'use client';

// ============================================================
// useRentals Hook
// Aktif kiralamaları Supabase service katmanından çeker.
// Arama, filtreleme ve işlem (sonlandır, askıya al, düzenle) yönetir.
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { RentalDetailed, RentalUpdate, StudentUpdate } from '@/lib/types';
import {
  getActiveRentalsDetailed,
  finishRental,
  updateRentalDetails,
} from '@/lib/services/rentals';
import { suspendDesk } from '@/lib/services/desks';
import { checkExpiredRentals } from '@/lib/services/automation';
import { calculateRemainingDays } from '@/lib/utils/rentalStatus';


export type GroupFilter = 'all' | 'YKS' | 'LGS';
export type PaymentFilter = 'all' | 'paid' | 'deposit' | 'pending';

export function useRentals() {
  const [rentals, setRentals] = useState<RentalDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtre durumları
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

  // ── Veri Yükleme & Otomasyon ───────────────────────────────
  const fetchRentals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. KTP-005: Süresi dolanları kontrol et ve temizle
      await checkExpiredRentals();

      // 2. Aktif kiralamaları getir
      const data = await getActiveRentalsDetailed();
      setRentals(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kiralamalar yüklenemedi';
      console.error('[useRentals] Hata:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRentals();
  }, [fetchRentals]);

  // ── Filtrelenmiş Liste ─────────────────────────────────────
  const filteredRentals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return rentals.filter((rental) => {
      // 1. Arama: Öğrenci adı, masa kodu, telefon
      if (query) {
        const studentName = rental.student?.full_name?.toLowerCase() || '';
        const deskCode = rental.desk?.code?.toLowerCase() || '';
        const phone = rental.student?.phone?.replace(/\s+/g, '') || '';
        const parentPhone = rental.student?.parent_phone?.replace(/\s+/g, '') || '';
        const cleanQuery = query.replace(/\s+/g, '');

        const matchesQuery =
          studentName.includes(query) ||
          deskCode.includes(query) ||
          phone.includes(cleanQuery) ||
          parentPhone.includes(cleanQuery);

        if (!matchesQuery) return false;
      }

      // 2. Grup Filtresi: YKS | LGS
      if (groupFilter !== 'all') {
        const studentGroup = (rental.student?.group_type || '').toUpperCase();
        if (studentGroup !== groupFilter.toUpperCase()) {
          return false;
        }
      }

      // 3. Ödeme Filtresi: paid (Ödendi) | deposit (Kapora) | pending (Bekliyor)
      if (paymentFilter !== 'all') {
        if (rental.payment_status !== paymentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [rentals, searchQuery, groupFilter, paymentFilter]);

  // ── Sayaç İstatistikleri ────────────────────────────────────
  const stats = useMemo(() => {
    let expiringCount = 0;
    let expiredCount = 0;

    rentals.forEach((r) => {
      if (r.end_date) {
        const diffDays = calculateRemainingDays(r.end_date);
        if (diffDays < 0) {
          expiredCount++;
        } else if (diffDays <= 7) {
          expiringCount++;
        }
      }
    });

    return {
      total: rentals.length,
      active: rentals.length - expiredCount,
      expiringCount,
      expiredCount,
    };
  }, [rentals]);


  // ── İşlemler (Actions) ─────────────────────────────────────
  
  // 1. Kiralamayı Sonlandır: rentals.is_active = false, desk.status = available
  const terminateRental = useCallback(
    async (rentalId: string, deskId: string) => {
      await finishRental(rentalId, deskId);
      await fetchRentals();
    },
    [fetchRentals],
  );

  // 2. Masayı Askıya Al: desk.status = suspended
  const handleSuspendDesk = useCallback(
    async (deskId: string) => {
      await suspendDesk(deskId);
      await fetchRentals();
    },
    [fetchRentals],
  );

  // 3. Kiralamayı ve Öğrenciyi Güncelle
  const handleUpdateRental = useCallback(
    async (
      rentalId: string,
      rentalPayload: RentalUpdate,
      studentId?: string,
      studentPayload?: StudentUpdate,
    ) => {
      await updateRentalDetails(rentalId, rentalPayload, studentId, studentPayload);
      await fetchRentals();
    },
    [fetchRentals],
  );

  return {
    rentals,
    filteredRentals,
    loading,
    error,
    stats,
    // Filtre kontrolleri
    searchQuery,
    setSearchQuery,
    groupFilter,
    setGroupFilter,
    paymentFilter,
    setPaymentFilter,
    // İşlemler
    terminateRental,
    suspendDesk: handleSuspendDesk,
    updateRental: handleUpdateRental,
    refetch: fetchRentals,
  };
}
