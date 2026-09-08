// ============================================================
// Kiralama Servisi
// Tüm Supabase kiralama sorguları bu dosyada toplanır.
// finishRental masa durumunu da günceller (transaction benzeri).
// ============================================================

import { supabase } from '@/lib/supabase';
import { updateDeskStatus, getDeskById } from '@/lib/services/desks';
import { updateStudent } from '@/lib/services/students';
import type { DbRental, RentalDetailed, RentalInsert, RentalUpdate, StudentUpdate } from '@/lib/types';

// Supabase client'ı any ile cast ederek generic tip çıkarım sorununu aşıyoruz.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Tüm kiralamaları (aktif + pasif) oluşturma tarihine göre getirir.
 */
export async function getRentals(): Promise<DbRental[]> {
  const { data, error } = await db
    .from('rentals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[rentals.service] getRentals hata:', error.message);
    throw new Error(`Kiralamalar yüklenemedi: ${error.message}`);
  }

  return (data ?? []) as DbRental[];
}

/**
 * Aktif kiralamaları masa ve öğrenci detaylarıyla birlikte getirir.
 */
export async function getActiveRentals(): Promise<RentalDetailed[]> {
  const { data, error } = await db
    .from('rentals')
    .select(`
      id,
      student_id,
      desk_id,
      package_type,
      start_date,
      end_date,
      price,
      payment_status,
      payment_note,
      is_active,
      created_at,
      desk:desks(id, code, section, status),
      student:students(id, full_name, phone, group_type, parent_name, parent_phone, notes)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[rentals.service] getActiveRentals hata:', error.message);
    throw new Error(`Aktif kiralamalar yüklenemedi: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    student_id: String(r.student_id),
    desk_id: String(r.desk_id),
    package_type: r.package_type,
    start_date: String(r.start_date),
    end_date: String(r.end_date),
    price: Number(r.price),
    payment_status: r.payment_status,
    payment_note: r.payment_note ? String(r.payment_note) : null,
    is_active: Boolean(r.is_active),
    created_at: String(r.created_at),
    desk: r.desk,
    student: r.student,
  })) as RentalDetailed[];
}

export const getActiveRentalsDetailed = getActiveRentals;

/**
 * Yeni kiralama kaydı oluşturur ve masayı 'occupied' yapar.
 * Kapalı masaya kiralama yapılması engellenir.
 */
export async function createRental(
  payload: Omit<RentalInsert, 'id' | 'created_at' | 'is_active'>,
): Promise<DbRental> {
  // Masanın kapalı olup olmadığını kontrol et
  const desk = await getDeskById(payload.desk_id);
  if (desk?.status === 'closed') {
    throw new Error('Bu koltuk kullanıma kapatılmıştır. Kapalı koltuğa kiralama yapılamaz.');
  }

  const { data, error } = await db
    .from('rentals')
    .insert({ ...payload, is_active: true })
    .select()
    .single();

  if (error) {
    console.error('[rentals.service] createRental hata:', error.message);
    throw new Error(`Kiralama oluşturulamadı: ${error.message}`);
  }

  // Masa durumunu güncelle
  await updateDeskStatus(payload.desk_id, 'occupied');

  return data as DbRental;
}

/**
 * Mevcut kiralamayı günceller (ödeme durumu, tarih uzatma vb.)
 */
export async function updateRental(
  id: string,
  payload: RentalUpdate,
): Promise<DbRental> {
  const { data, error } = await db
    .from('rentals')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[rentals.service] updateRental hata:', error.message);
    throw new Error(`Kiralama güncellenemedi: ${error.message}`);
  }

  return data as DbRental;
}

/**
 * Hem kiralama detaylarını hem de gerekiyorsa öğrenci bilgilerini günceller.
 */
export async function updateRentalDetails(
  rentalId: string,
  rentalPayload: RentalUpdate,
  studentId?: string,
  studentPayload?: StudentUpdate,
): Promise<void> {
  await updateRental(rentalId, rentalPayload);
  if (studentId && studentPayload) {
    await updateStudent(studentId, studentPayload);
  }
}

/**
 * Kiralamayı sonlandırır:
 * 1. rentals.is_active = false
 * 2. desks.status = 'available'
 */
export async function finishRental(rentalId: string, deskId: string): Promise<void> {
  const { error } = await db
    .from('rentals')
    .update({ is_active: false })
    .eq('id', rentalId);

  if (error) {
    console.error('[rentals.service] finishRental hata:', error.message);
    throw new Error(`Kiralama sonlandırılamadı: ${error.message}`);
  }

  // Masa tekrar müsait hale gelir
  await updateDeskStatus(deskId, 'available');
}
