// ============================================================
// KTP-005: Süre Otomasyon Servisi
// lib/services/automation.ts
// Süresi dolan kiralamaları otomatik kapatır, masaları yeşile döndürür,
// süre uzatma işlemlerini yönetir.
// ============================================================

import { supabase } from '@/lib/supabase';
import { updateDeskStatus } from '@/lib/services/desks';
import { calculateRemainingDays } from '@/lib/utils/rentalStatus';
import type { DbRental } from '@/lib/types';

// Supabase client'ı any ile cast ederek tip uyumsuzluğunu aşıyoruz.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ExtensionDuration = 'week' | 'month' | 'year';

export interface CheckExpiredResult {
  expiredCount: number;
  updatedDeskCodes: string[];
}

/**
 * 1. OTOMATİK SÜRE KONTROLÜ
 * Aktif kiralamaları kontrol eder.
 * Eğer today > rental.end_date ise:
 *   rentals.is_active = false
 *   desk.status = 'available'
 * yapar. Masalar otomatik olarak yeşil (boş) duruma döner.
 */
export async function checkExpiredRentals(): Promise<CheckExpiredResult> {
  try {
    const { data: activeRentals, error } = await db
      .from('rentals')
      .select(`
        id,
        desk_id,
        end_date,
        is_active,
        desk:desks(id, code, status)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('[automation.service] checkExpiredRentals hata:', error.message);
      return { expiredCount: 0, updatedDeskCodes: [] };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expiredList = (activeRentals || []).filter((r: any) => {
      if (!r.end_date) return false;
      const endDate = new Date(r.end_date);
      endDate.setHours(0, 0, 0, 0);
      // today > rental.end_date
      return now.getTime() > endDate.getTime();
    });

    if (expiredList.length === 0) {
      return { expiredCount: 0, updatedDeskCodes: [] };
    }

    const updatedDeskCodes: string[] = [];

    // Süresi dolan kiralamaları sonlandır ve masayı boşa al
    for (const item of expiredList) {
      // 1. rental pasife al
      await db
        .from('rentals')
        .update({ is_active: false })
        .eq('id', item.id);

      // 2. desk.status = available yap
      if (item.desk_id) {
        await updateDeskStatus(item.desk_id, 'available');
      }

      const deskCode = item.desk?.code || item.desk_id;
      if (deskCode) updatedDeskCodes.push(deskCode);
    }

    console.log(
      `[automation.service] ${expiredList.length} adet süresi dolan kiralama kapatıldı ve masalar boşa çıkarıldı:`,
      updatedDeskCodes,
    );

    return {
      expiredCount: expiredList.length,
      updatedDeskCodes,
    };
  } catch (err) {
    console.error('[automation.service] checkExpiredRentals beklenmeyen hata:', err);
    return { expiredCount: 0, updatedDeskCodes: [] };
  }
}

/**
 * 2. YAKINDA BİTECEK KİRALAMALAR
 * Bitişine 1-7 gün kalan aktif kiralamaları döner.
 */
export async function getExpiringRentals(daysThreshold = 7): Promise<any[]> {
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
      is_active,
      desk:desks(id, code, section, status),
      student:students(id, full_name, phone)
    `)
    .eq('is_active', true);

  if (error) {
    console.error('[automation.service] getExpiringRentals hata:', error.message);
    return [];
  }

  return (data || []).filter((r: any) => {
    const remaining = calculateRemainingDays(r.end_date);
    return remaining >= 0 && remaining <= daysThreshold;
  });
}

/**
 * 7. SÜRE UZATMA (Extend Rental)
 * Mevcut kiralamanın bitiş tarihini (+1 Hafta, +1 Ay, +1 Yıl) ileri alır.
 * Yeni kiralama oluşturulmaz; mevcut kayıt güncellenir.
 * Masanın durumu 'occupied' yapılır.
 */
export async function extendRental(
  rentalId: string,
  durationType: ExtensionDuration,
  additionalPrice: number = 0,
): Promise<{ success: boolean; newEndDate: string }> {
  // 1. Mevcut kiralamayı çek
  const { data: current, error: fetchErr } = await db
    .from('rentals')
    .select('id, desk_id, end_date, price')
    .eq('id', rentalId)
    .single();

  if (fetchErr || !current) {
    throw new Error(`Kiralama bulunamadı: ${fetchErr?.message || 'Bilinmeyen hata'}`);
  }

  // 2. Yeni bitiş tarihini hesapla
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const baseDate = current.end_date ? new Date(current.end_date) : new Date();
  baseDate.setHours(0, 0, 0, 0);

  // Eğer kiralama süresi çoktan geçmişse uzatmayı bugünden başlat, değilse mevcut bitişten ekle
  const startDate = baseDate.getTime() > now.getTime() ? baseDate : now;
  const newDate = new Date(startDate);

  if (durationType === 'week') {
    newDate.setDate(newDate.getDate() + 7);
  } else if (durationType === 'month') {
    newDate.setMonth(newDate.getMonth() + 1);
  } else if (durationType === 'year') {
    newDate.setFullYear(newDate.getFullYear() + 1);
  }

  const newEndDateStr = newDate.toISOString().split('T')[0];

  // 3. rentals tablosunu güncelle (is_active = true)
  const updatePayload: any = {
    end_date: newEndDateStr,
    is_active: true,
  };
  if (additionalPrice > 0) {
    updatePayload.price = Number(current.price || 0) + Number(additionalPrice);
  }

  const { error: updateErr } = await db
    .from('rentals')
    .update(updatePayload)
    .eq('id', rentalId);

  if (updateErr) {
    console.error('[automation.service] extendRental update hata:', updateErr.message);
    throw new Error(`Süre uzatılamadı: ${updateErr.message}`);
  }

  // 4. Masayı 'occupied' durumuna getir
  if (current.desk_id) {
    await updateDeskStatus(current.desk_id, 'occupied');
  }

  return {
    success: true,
    newEndDate: newEndDateStr,
  };
}
