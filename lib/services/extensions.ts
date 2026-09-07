// ============================================================
// Süre Uzatma & Finansal Kayıt Servisi
// lib/services/extensions.ts
// Süre uzatmalarını rental_extensions tablosuna ayrı finansal
// kayıt olarak ekler. rentals.price DEĞİŞTİRİLMEZ.
// ============================================================

import { supabase } from '@/lib/supabase';
import { updateDeskStatus } from '@/lib/services/desks';
import type {
  DbRentalExtension,
  RentalRevenueSummary,
  PaymentStatus,
} from '@/lib/types';

// Supabase client'ı any ile cast ederek generic tip çıkarımını aşıyoruz.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface CreateExtensionPayload {
  rentalId: string;
  extensionType: '1 Hafta' | '1 Ay' | '1 Yıl' | string;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentNote?: string;
}

/**
 * Süre Uzatma Fonksiyonu:
 * 1) Mevcut rental.end_date alınır.
 * 2) Seçilen süre kadar ileri alınır.
 * 3) rental_extensions tablosuna kayıt eklenir (ayrı finansal kayıt).
 * 4) Mevcut rental.end_date güncellenir (rentals.price DEĞİŞTİRİLMEZ).
 * 5) Masa 'occupied' yapılır.
 */
export async function createExtension(
  payload: CreateExtensionPayload,
): Promise<{ success: boolean; newEndDate: string; extension?: DbRentalExtension }> {
  // 1. Mevcut kiralamayı çek
  const { data: rental, error: fetchErr } = await db
    .from('rentals')
    .select('id, desk_id, end_date, price')
    .eq('id', payload.rentalId)
    .single();

  if (fetchErr || !rental) {
    console.error('[extensions.service] createExtension kiralama bulunamadı:', fetchErr?.message);
    throw new Error(`Kiralama bulunamadı: ${fetchErr?.message || 'Kayıt yok'}`);
  }

  // 2. Yeni bitiş tarihini hesapla
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const baseDate = rental.end_date ? new Date(rental.end_date) : new Date();
  baseDate.setHours(0, 0, 0, 0);

  // Eğer süresi çoktan geçmişse bugünden, değilse mevcut bitiş tarihinden uzat
  const startFrom = baseDate.getTime() > now.getTime() ? baseDate : now;
  const newDate = new Date(startFrom);

  if (payload.extensionType.includes('Hafta')) {
    newDate.setDate(newDate.getDate() + 7);
  } else if (payload.extensionType.includes('Yıl')) {
    newDate.setFullYear(newDate.getFullYear() + 1);
  } else {
    // 1 Ay
    newDate.setMonth(newDate.getMonth() + 1);
  }

  const oldEndDateStr = rental.end_date || new Date().toISOString().split('T')[0];
  const newEndDateStr = newDate.toISOString().split('T')[0];

  let savedExtension: DbRentalExtension | undefined;

  // 3. rental_extensions tablosuna kayıt ekle
  try {
    const { data: extData, error: extErr } = await db
      .from('rental_extensions')
      .insert({
        rental_id: payload.rentalId,
        extension_type: payload.extensionType,
        amount: Number(payload.amount || 0),
        payment_status: payload.paymentStatus,
        payment_note: payload.paymentNote ? payload.paymentNote.trim() : null,
        old_end_date: oldEndDateStr,
        new_end_date: newEndDateStr,
      })
      .select()
      .single();

    if (extErr) {
      console.warn(
        '[extensions.service] rental_extensions tablosuna yazılamadı (tablo henüz oluşturulmamış olabilir):',
        extErr.message,
      );
    } else {
      savedExtension = extData as DbRentalExtension;
    }
  } catch (err) {
    console.warn('[extensions.service] rental_extensions insert hatası:', err);
  }

  // 4. Mevcut rental güncellenir.
  // ÖNEMLİ: rentals.price ALANI DEĞİŞTİRİLMEZ! İlk kiralama fiyatı sabit kalır.
  const { error: updateErr } = await db
    .from('rentals')
    .update({
      end_date: newEndDateStr,
      is_active: true,
    })
    .eq('id', payload.rentalId);

  if (updateErr) {
    console.error('[extensions.service] rental update hata:', updateErr.message);
    throw new Error(`Kiralama süresi güncellenemedi: ${updateErr.message}`);
  }

  // 5. Masayı 'occupied' durumuna getir
  if (rental.desk_id) {
    await updateDeskStatus(rental.desk_id, 'occupied');
  }

  return {
    success: true,
    newEndDate: newEndDateStr,
    extension: savedExtension,
  };
}

/**
 * Belirli bir kiralamanın tüm uzatma geçmişini getirir.
 */
export async function getExtensionsByRental(
  rentalId: string,
): Promise<DbRentalExtension[]> {
  try {
    const { data, error } = await db
      .from('rental_extensions')
      .select('*')
      .eq('rental_id', rentalId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[extensions.service] getExtensionsByRental uyarı:', error.message);
      return [];
    }

    return (data || []) as DbRentalExtension[];
  } catch (err) {
    console.warn('[extensions.service] getExtensionsByRental hata:', err);
    return [];
  }
}

/**
 * Toplam Gelir Hesabı:
 * İlk Kiralama (rentals.price) + Tüm rental_extensions.amount toplanır.
 */
export async function getTotalRentalRevenue(
  rentalId: string,
  initialPrice: number,
): Promise<RentalRevenueSummary> {
  const extensions = await getExtensionsByRental(rentalId);

  const extensionsTotal = extensions.reduce(
    (sum, ext) => sum + Number(ext.amount || 0),
    0,
  );

  const paidExtensions = extensions
    .filter((e) => e.payment_status === 'paid')
    .reduce((sum, ext) => sum + Number(ext.amount || 0), 0);

  const pendingExtensions = extensions
    .filter((e) => e.payment_status === 'pending' || e.payment_status === 'deposit')
    .reduce((sum, ext) => sum + Number(ext.amount || 0), 0);

  const basePrice = Number(initialPrice || 0);

  return {
    initialPrice: basePrice,
    extensionsTotal,
    totalRevenue: basePrice + extensionsTotal,
    paidTotal: basePrice + paidExtensions,
    pendingTotal: pendingExtensions,
    extensions,
  };
}
