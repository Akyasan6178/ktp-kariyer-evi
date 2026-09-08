// ============================================================
// Format Utility Fonksiyonları
// Projedeki tüm tarih ve para formatlama işlemleri burada.
// ============================================================

/**
 * Kısa tarih formatı: 01.05.2025
 * Kullanım: tablolar, listeler
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Uzun tarih formatı: 1 Mayıs 2025
 * Kullanım: detay panelleri, bilgi satırları
 */
export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Para formatı: ₺2.500
 * Kullanım: ücret alanları
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '₺0';
  return `₺${amount.toLocaleString('tr-TR')}`;
}

/**
 * Bugünün tarihini YYYY-MM-DD formatında döndürür.
 * Kullanım: form başlangıç tarihleri
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Pakete göre bitiş tarihi hesaplar.
 * Kullanım: kiralama ve uzatma dialogları
 */
export function calculateEndDate(
  startDateStr: string,
  pkg: 'weekly' | 'monthly' | 'yearly',
): string {
  if (!startDateStr) return '';
  const d = new Date(startDateStr);
  if (isNaN(d.getTime())) return '';

  if (pkg === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (pkg === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (pkg === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
