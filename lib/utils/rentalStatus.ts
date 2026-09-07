import type { DeskWithRental, DeskStatus } from '@/lib/types';

/**
 * Bitiş tarihine göre kalan gün sayısını gün başlangıcına normalize ederek hesaplar.
 * Örn: 0 = bugün bitiyor, negatif = süresi geçmiş, pozitif = kalan gün sayısı.
 */
export function calculateRemainingDays(endDateStr: string | null | undefined): number {
  if (!endDateStr) return 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);

  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Kat planında masanın görünüm rengi:
 * - available: yeşil
 * - occupied: kırmızı
 * - suspended: sarı
 * - expiring: mavi (Aktif kiralamanın bitmesine 7 gün veya daha az kaldıysa)
 */
export function getDeskDisplayStatus(desk: DeskWithRental): DeskStatus {
  // Askıdaki masalar öncelikli olarak sarı gösterilir
  if (desk.status === 'suspended') return 'suspended';
  if (desk.status === 'available') return 'available';

  // Aktif kiralama varsa kalan günü kontrol et
  if (desk.active_rental?.end_date) {
    const diffDays = calculateRemainingDays(desk.active_rental.end_date);
    // 0-7 gün kaldıysa veya dolmuşsa kat planında mavi (expiring) göster
    if (diffDays <= 7 && diffDays >= 0) {
      return 'expiring';
    }
  }

  return desk.status;
}

/**
 * /rentals ve Detay Paneli için kalan süre durum bilgisi
 * Şartname formatları:
 * 🔴 Süresi Doldu (diffDays < 0)
 * 🟠 3 Gün Kaldı / 7 Gün Kaldı (diffDays 0..7)
 * 🟢 Aktif (diffDays > 7)
 */
export function getRentalStatusDetails(endDateStr: string | null | undefined) {
  const diffDays = calculateRemainingDays(endDateStr);

  if (diffDays < 0) {
    return {
      type: 'expired' as const,
      diffDays,
      badgeText: '🔴 Süresi Doldu',
      shortText: 'Süresi Doldu',
      label: 'Süresi Doldu',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      color: 'text-rose-600',
    };
  }

  if (diffDays <= 7) {
    const labelText = diffDays === 0 ? 'Bugün Bitiyor' : `${diffDays} Gün Kaldı`;
    return {
      type: 'expiring' as const,
      diffDays,
      badgeText: `🟠 ${labelText}`,
      shortText: labelText,
      label: `Yakında Bitecek (${labelText})`,
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      color: 'text-orange-600',
    };
  }

  return {
    type: 'active' as const,
    diffDays,
    badgeText: '🟢 Aktif',
    shortText: `${diffDays} Gün Kaldı`,
    label: `Aktif (${diffDays} Gün Kaldı)`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    color: 'text-emerald-600',
  };
}
