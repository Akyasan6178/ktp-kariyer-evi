'use client';

// ============================================================
// useSettings Hook
// Yasin Hoca Çalışma Merkezi - Ayarlar Yönetim Hook'u (KTP-007)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { DbSettings, SettingsUpdate } from '@/lib/types';
import { getSettings, updateSettings, DEFAULT_SETTINGS } from '@/lib/services/settings';
import { toast } from 'sonner';

export function useSettings() {
  const [settings, setSettings] = useState<DbSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (err: any) {
      console.warn('[useSettings] Ayarlar yüklenirken uyarı:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const save = useCallback(
    async (payload: SettingsUpdate): Promise<boolean> => {
      setIsSaving(true);
      try {
        const updated = await updateSettings(payload);
        setSettings(updated);
        toast.success('Ayarlar başarıyla kaydedildi!');
        return true;
      } catch (err: any) {
        console.error('[useSettings] Kaydetme hatası:', err);
        toast.error('Ayarlar kaydedilirken hata oluştu: ' + (err?.message || 'Bilinmeyen hata'));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return {
    settings,
    loading,
    isSaving,
    saveSettings: save,
    refreshSettings: fetchSettings,
  };
}
