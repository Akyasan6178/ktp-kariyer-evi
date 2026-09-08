// ============================================================
// Ayarlar Servis Katmanı
// lib/services/settings.ts
// Yasin Hoca Çalışma Merkezi - Ayarlar Merkezi (KTP-007)
// ============================================================

import { supabase } from '@/lib/supabase';
import type { DbSettings, SettingsUpdate } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const DEFAULT_SETTINGS: DbSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  library_name: 'Kariyer Evi VIP Kütüphane',
  phone: '0507 036 78 61',
  address: 'Merkez Mah. Üniversite Cad. No: 12/A',
  wifi_name: 'KariyerEvi_VIP',
  wifi_password: 'kariyerevi2026',
  weekly_price: 750,
  monthly_price: 2500,
  yearly_price: 25000,
  updated_at: new Date().toISOString(),
};

/**
 * Mevcut sistem ayarlarını getirir.
 * Eğer Supabase üzerinde tablo henüz yoksa veya boşsa varsayılan ayarları döner.
 */
export async function getSettings(): Promise<DbSettings> {
  try {
    const { data, error } = await db
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[settings.service] Ayarlar okunamadı (varsayılanlar kullanılacak):', error.message);
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      // Tablo var ama henüz boşsa başlangıç kaydını eklemeyi dene
      try {
        const { data: inserted, error: insertErr } = await db
          .from('settings')
          .insert(DEFAULT_SETTINGS)
          .select()
          .single();

        if (!insertErr && inserted) {
          return inserted as DbSettings;
        }
      } catch {
        // Hata durumunda varsayılan dön
      }
      return DEFAULT_SETTINGS;
    }

    return {
      id: String(data.id),
      library_name: String(data.library_name || DEFAULT_SETTINGS.library_name),
      phone: String(data.phone || DEFAULT_SETTINGS.phone),
      address: String(data.address || DEFAULT_SETTINGS.address),
      wifi_name: String(data.wifi_name || DEFAULT_SETTINGS.wifi_name),
      wifi_password: String(data.wifi_password || DEFAULT_SETTINGS.wifi_password),
      weekly_price: Number(data.weekly_price ?? DEFAULT_SETTINGS.weekly_price),
      monthly_price: Number(data.monthly_price ?? DEFAULT_SETTINGS.monthly_price),
      yearly_price: Number(data.yearly_price ?? DEFAULT_SETTINGS.yearly_price),
      updated_at: String(data.updated_at || new Date().toISOString()),
    };
  } catch (err: any) {
    console.warn('[settings.service] Beklenmeyen hata (varsayılan kullanılacak):', err?.message);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Sistem ayarlarını günceller.
 */
export async function updateSettings(payload: SettingsUpdate): Promise<DbSettings> {
  try {
    // Mevcut kaydı bul
    const current = await getSettings();

    const updatePayload = {
      ...payload,
      weekly_price: payload.weekly_price !== undefined ? Number(payload.weekly_price) : current.weekly_price,
      monthly_price: payload.monthly_price !== undefined ? Number(payload.monthly_price) : current.monthly_price,
      yearly_price: payload.yearly_price !== undefined ? Number(payload.yearly_price) : current.yearly_price,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('settings')
      .update(updatePayload)
      .eq('id', current.id)
      .select()
      .single();

    if (error) {
      // Eğer id eşleşmediyse upsert dene
      const { data: upsertData, error: upsertErr } = await db
        .from('settings')
        .upsert({ id: current.id, ...updatePayload })
        .select()
        .single();

      if (upsertErr) {
        console.error('[settings.service] Ayarlar güncellenemedi:', upsertErr.message);
        throw new Error(`Ayarlar güncellenemedi: ${upsertErr.message}`);
      }

      return upsertData as DbSettings;
    }

    return data as DbSettings;
  } catch (err: any) {
    console.error('[settings.service] updateSettings hatası:', err?.message);
    throw err;
  }
}
