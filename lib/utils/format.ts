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

/**
 * Telefon numarası formatı: 0507 036 78 61
 * Girdi: 05070367861, 5070367861, +905070367861 vb.
 * Çıktı: 0507 036 78 61
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;
  if (normalized.length === 10 && normalized.startsWith('5')) {
    normalized = '0' + normalized;
  } else if (normalized.length === 12 && normalized.startsWith('90')) {
    normalized = '0' + normalized.slice(2);
  }

  if (normalized.length === 11 && normalized.startsWith('0')) {
    return `${normalized.slice(0, 4)} ${normalized.slice(4, 7)} ${normalized.slice(7, 9)} ${normalized.slice(9, 11)}`;
  }

  return phone;
}

/**
 * Telefon bağlantısı için sayısal temizleme (tel: URI): 05070367861
 */
export function cleanPhoneForTel(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('5')) {
    return '0' + digits;
  }
  if (digits.length === 12 && digits.startsWith('90')) {
    return '0' + digits.slice(2);
  }
  return digits || phone;
}
