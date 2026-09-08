'use client';

// ============================================================
// useDesks Hook
// Supabase'den masa verilerini çeker.
// KTP-005: Açılışta ve yenilemede checkExpiredRentals() otomatik çalışır.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import type { DeskWithRental, LibraryStats } from '@/lib/types';
import { getAllDesks } from '@/lib/services/desks';
import { checkExpiredRentals } from '@/lib/services/automation';
import { calculateRemainingDays } from '@/lib/utils/rentalStatus';
import { toast } from 'sonner';

function computeStats(desks: DeskWithRental[]): LibraryStats {
  let expiringCount = 0;
  let expiredCount = 0;
  let depositCount = 0;

  desks.forEach((d) => {
    if (d.active_rental) {
      if (d.active_rental.payment_status === 'deposit') {
        depositCount++;
      }
      if (d.active_rental.end_date) {
        const diffDays = calculateRemainingDays(d.active_rental.end_date);
        if (diffDays < 0) {
          expiredCount++;
        } else if (diffDays <= 7) {
          expiringCount++;
        }
      }
    }
  });

  return {
    total: desks.length,
    available: desks.filter((d) => d.status === 'available').length,
    occupied: desks.filter((d) => d.status === 'occupied').length,
    suspended: desks.filter((d) => d.status === 'suspended').length,
    closed: desks.filter((d) => d.status === 'closed').length,
    expiring: expiringCount,
    depositCount,
    expiredCount,
  };
}

export function useDesks() {
  const [desks, setDesks] = useState<DeskWithRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDesk, setSelectedDesk] = useState<DeskWithRental | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // ── Veri yükleme & Otomatik Süre Kontrolü ───────────────────
  const fetchDesks = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('[useDesks] fetchDesks başlatıldı...');

    try {
      // 1. KTP-005 Otomasyon: Süresi dolan kiralamaları kontrol et ve masaları boşa çıkar
      const autoResult = await checkExpiredRentals();
      if (autoResult.expiredCount > 0) {
        toast.info('Süresi dolan masalar güncellendi', {
          description: `${autoResult.expiredCount} masanın süresi dolduğu için otomatik olarak boşaltıldı.`,
        });
      }

      // 2. Güncel masa verilerini çek
      const data = await getAllDesks();
      setDesks(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      console.error('[useDesks] Hata yakalandı:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesks();
  }, [fetchDesks]);

  // ── Panel kontrolleri ─────────────────────────────────────
  const handleDeskClick = useCallback((desk: DeskWithRental) => {
    setSelectedDesk(desk);
    setIsPanelOpen(true);
  }, []);

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedDesk(null), 300);
  }, []);

  return {
    desks,
    loading,
    error,
    stats: computeStats(desks),
    selectedDesk,
    isPanelOpen,
    handleDeskClick,
    handlePanelClose,
    refetch: fetchDesks,
  };
}
