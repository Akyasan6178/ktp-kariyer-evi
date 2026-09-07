// ============================================================
// Masa Servisi
// Tüm Supabase masa sorguları bu dosyada toplanır.
// Bileşenler doğrudan Supabase çağrısı yapmaz.
// ============================================================

import { supabase } from '@/lib/supabase';
import type { DeskWithRental, DeskStatus } from '@/lib/types';

// Supabase client'ı any ile cast ederek generic tip çıkarım sorununu aşıyoruz.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Tüm masaları aktif kiralama + öğrenci bilgisiyle birlikte getirir.
 * Supabase join: desks → rentals (is_active=true) → students
 */
export async function getAllDesks(): Promise<DeskWithRental[]> {
  console.log('[desks.service] getAllDesks() çağrıldı.');

  const { data, error } = await db
    .from('desks')
    .select(`
      id,
      code,
      section,
      status,
      created_at,
      active_rental:rentals(
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
        student:students(
          id,
          full_name,
          phone,
          group_type,
          parent_name,
          parent_phone,
          notes,
          created_at
        )
      )
    `)
    .order('code', { ascending: true });

  if (error) {
    console.error('[desks.service] getAllDesks hata:', error.message);
    throw new Error(`Masalar yüklenemedi: ${error.message}`);
  }

  console.log('[desks.service] Supabase veritabanından dönen satır sayısı:', data?.length ?? 0);
  if (data && data.length > 0) {
    console.log('[desks.service] Örnek ilk kayıt:', data[0]);
  } else {
    console.warn('[desks.service] Supabase sorgusu boş dizi [] döndü!');
  }

  // Supabase join array döner; aktif kiralamayı filtrele (is_active = true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatted = (data ?? []).map((desk: any) => {
    const rentalsArr: unknown[] = Array.isArray(desk.active_rental)
      ? desk.active_rental
      : [];

    const activeRentals = rentalsArr.filter(
      (r: unknown) => (r as { is_active: boolean }).is_active === true,
    );

    const active_rental =
      activeRentals.length > 0
        ? (activeRentals[0] as DeskWithRental['active_rental'])
        : null;

    return {
      id: String(desk.id),
      code: String(desk.code),
      section: String(desk.section || '').trim().toUpperCase(),
      status: (desk.status || 'available') as DeskStatus,
      created_at: String(desk.created_at || new Date().toISOString()),
      active_rental,
    } satisfies DeskWithRental;
  });

  console.log('[desks.service] Formatlanıp döndürülen masa sayısı:', formatted.length);
  return formatted;
}

/**
 * Tek masayı aktif kiralama + öğrenci bilgisiyle getirir.
 */
export async function getDeskById(id: string): Promise<DeskWithRental | null> {
  const { data, error } = await db
    .from('desks')
    .select(`
      id,
      code,
      section,
      status,
      created_at,
      active_rental:rentals(
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
        student:students(
          id,
          full_name,
          phone,
          group_type,
          parent_name,
          parent_phone,
          notes,
          created_at
        )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[desks.service] getDeskById hata:', error.message);
    throw new Error(`Masa bulunamadı: ${error.message}`);
  }

  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const desk = data as any;
  const rentalsArr: unknown[] = Array.isArray(desk.active_rental)
    ? desk.active_rental
    : [];
  const activeRentals = rentalsArr.filter(
    (r: unknown) => (r as { is_active: boolean }).is_active === true,
  );
  const active_rental =
    activeRentals.length > 0
      ? (activeRentals[0] as DeskWithRental['active_rental'])
      : null;

  return {
    id: desk.id as string,
    code: desk.code as string,
    section: desk.section as string,
    status: desk.status as DeskStatus,
    created_at: desk.created_at as string,
    active_rental,
  } satisfies DeskWithRental;
}

/**
 * Masanın durumunu günceller.
 * finishRental() çağrısından da kullanılır.
 */
export async function updateDeskStatus(
  id: string,
  status: DeskStatus,
): Promise<void> {
  const { error } = await db
    .from('desks')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error('[desks.service] updateDeskStatus hata:', error.message);
    throw new Error(`Masa durumu güncellenemedi: ${error.message}`);
  }
}

/**
 * Masayı askıya alır (status = 'suspended').
 */
export async function suspendDesk(id: string): Promise<void> {
  await updateDeskStatus(id, 'suspended');
}


