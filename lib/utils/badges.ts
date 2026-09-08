// ============================================================
// Badge / Label Haritaları – Ortak UI Etiketleri
// Projedeki tüm tekrar eden badge map'leri burada.
// ============================================================

import type { DeskStatus, PaymentStatus, PackageType } from '@/lib/types';

// ── Masa Durumu Rozetleri ────────────────────────────────────
export const STATUS_BADGE: Record<DeskStatus, { label: string; className: string }> = {
  available: {
    label: 'Boş',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  occupied: {
    label: 'Dolu',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  suspended: {
    label: 'Askıda',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  expiring: {
    label: 'Dolmak Üzere',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
};

// ── Ödeme Durumu Rozetleri ───────────────────────────────────
export const PAYMENT_BADGE: Record<PaymentStatus, { label: string; className: string }> = {
  pending: {
    label: 'Bekliyor',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  deposit: {
    label: 'Kapora',
    className: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  paid: {
    label: 'Ödendi',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
};

// ── Paket Türü Etiketleri ────────────────────────────────────
export const PACKAGE_LABEL: Record<PackageType, string> = {
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
};
