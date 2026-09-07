// ============================================================
// Raporlar & Finans Servis Katmanı
// lib/services/reports.ts
// Yasin Hoca Çalışma Merkezi - Gelir ve Finans Yönetimi
// ============================================================

import { supabase } from '@/lib/supabase';
import type { PaymentStatus } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface RevenueSummary {
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  totalRevenue: number;
  pendingTotal: number;
  depositCount: number;
  activeRentalsCount: number;
  activeStudentsCount: number;
}

export interface PaymentStatusSummaryItem {
  status: PaymentStatus;
  label: string;
  total: number;
  count: number;
}

export interface PaymentSummary {
  paid: PaymentStatusSummaryItem;
  deposit: PaymentStatusSummaryItem;
  pending: PaymentStatusSummaryItem;
  overallTotal: number;
}

export interface RegionRevenueItem {
  section: 'A' | 'B' | 'C';
  label: string;
  revenue: number;
  percentage: number;
  rentalCount: number;
  deskCount: number;
  isTop: boolean;
}

export interface RegionRevenueReport {
  regions: RegionRevenueItem[];
  topRegion: 'A' | 'B' | 'C' | null;
  totalRevenue: number;
}

export interface MonthlyRevenueItem {
  key: string; // YYYY-MM
  label: string; // e.g. "Eyl 2026"
  shortLabel: string; // e.g. "Eyl"
  totalRevenue: number;
  initialRevenue: number;
  extensionRevenue: number;
  count: number;
}

export interface StudentDistribution {
  yksCount: number;
  lgsCount: number;
  otherCount: number;
  totalStudents: number;
  yksPercent: number;
  lgsPercent: number;
  otherPercent: number;
}

export interface RecentTransaction {
  id: string;
  date: string;
  studentName: string;
  studentGroup: string;
  deskCode: string;
  section: string;
  type: 'İlk Kiralama' | 'Süre Uzatma';
  amount: number;
  paymentStatus: PaymentStatus;
  note?: string;
}

export interface FullReportsData {
  summary: RevenueSummary;
  payments: PaymentSummary;
  regions: RegionRevenueReport;
  monthlyRevenue: MonthlyRevenueItem[];
  studentDistribution: StudentDistribution;
  recentTransactions: RecentTransaction[];
}

/**
 * Yardımcı: Tarih string'ini yerel YYYY-MM-DD'ye çevirir
 */
function toDateKey(dateInput: string | Date | undefined): { y: number; m: number; d: number; ymd: string; ym: string } {
  const d = dateInput ? new Date(dateInput) : new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const ym = `${y}-${String(m).padStart(2, '0')}`;
  const ymd = `${ym}-${String(day).padStart(2, '0')}`;
  return { y, m, d: day, ymd, ym };
}

/**
 * Tüm kiralama ve uzatma verilerini çekip birleştirir.
 */
async function fetchRawReportData() {
  // 1. Tüm kiralamaları desk ve student joinleriyle al
  const { data: rentalsData, error: rentalsErr } = await db
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
      payment_note,
      is_active,
      created_at,
      desk:desks(id, code, section, status),
      student:students(id, full_name, phone, group_type)
    `)
    .order('created_at', { ascending: false });

  if (rentalsErr) {
    console.error('[reports.service] Kiralamalar getirilemedi:', rentalsErr.message);
    throw new Error(`Kiralamalar getirilemedi: ${rentalsErr.message}`);
  }

  // 2. Tüm uzatmaları çek (tablo yoksa güvenli biçimde boş dizi dön)
  let extensionsData: any[] = [];
  try {
    const { data: extData, error: extErr } = await db
      .from('rental_extensions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!extErr && extData) {
      extensionsData = extData;
    }
  } catch (err) {
    console.warn('[reports.service] rental_extensions okunamadı:', err);
  }

  // 3. Masaların toplam sayılarını al (bölge kapasite analizi için)
  let desksData: any[] = [];
  try {
    const { data: dData } = await db.from('desks').select('id, code, section, status');
    if (dData) desksData = dData;
  } catch (err) {
    console.warn('[reports.service] desks okunamadı:', err);
  }

  // 4. Öğrencileri al (dağılım analizi için)
  let studentsData: any[] = [];
  try {
    const { data: sData } = await db.from('students').select('id, full_name, group_type');
    if (sData) studentsData = sData;
  } catch (err) {
    console.warn('[reports.service] students okunamadı:', err);
  }

  return {
    rentals: rentalsData || [],
    extensions: extensionsData || [],
    desks: desksData || [],
    students: studentsData || [],
  };
}

/**
 * 1) getRevenueSummary
 * Bugünkü Gelir, Bu Ayki Gelir, Bu Yılki Gelir, Toplam Gelir,
 * Bekleyen Tahsilatlar, Kaporalı Öğrenciler, Aktif Kiralamalar, Aktif Öğrenci Sayısı
 */
export async function getRevenueSummary(): Promise<RevenueSummary> {
  const { rentals, extensions } = await fetchRawReportData();

  const now = new Date();
  const todayKey = toDateKey(now);

  let todayRevenue = 0;
  let monthRevenue = 0;
  let yearRevenue = 0;
  let totalRevenue = 0;
  let pendingTotal = 0;
  let depositCount = 0;

  // rentals döngüsü
  for (const r of rentals) {
    const price = Number(r.price || 0);
    const date = toDateKey(r.created_at || r.start_date);

    totalRevenue += price;

    if (date.ymd === todayKey.ymd) todayRevenue += price;
    if (date.ym === todayKey.ym) monthRevenue += price;
    if (date.y === todayKey.y) yearRevenue += price;

    if (r.payment_status === 'pending') {
      pendingTotal += price;
    } else if (r.payment_status === 'deposit') {
      depositCount += 1;
    }
  }

  // extensions döngüsü
  for (const ext of extensions) {
    const amount = Number(ext.amount || 0);
    const date = toDateKey(ext.created_at);

    totalRevenue += amount;

    if (date.ymd === todayKey.ymd) todayRevenue += amount;
    if (date.ym === todayKey.ym) monthRevenue += amount;
    if (date.y === todayKey.y) yearRevenue += amount;

    if (ext.payment_status === 'pending') {
      pendingTotal += amount;
    } else if (ext.payment_status === 'deposit') {
      depositCount += 1;
    }
  }

  // Aktif kiralamalar ve aktif öğrenci sayısı
  const activeRentals = rentals.filter((r: any) => Boolean(r.is_active));
  const activeStudentsSet = new Set(
    activeRentals.map((r: any) => r.student_id).filter(Boolean)
  );

  return {
    todayRevenue,
    monthRevenue,
    yearRevenue,
    totalRevenue,
    pendingTotal,
    depositCount,
    activeRentalsCount: activeRentals.length,
    activeStudentsCount: activeStudentsSet.size,
  };
}

/**
 * 2) getPaymentSummary
 * Ödeme durumlarına göre tutarlar ve sayılar: Ödendi, Kapora, Bekliyor
 */
export async function getPaymentSummary(): Promise<PaymentSummary> {
  const { rentals, extensions } = await fetchRawReportData();

  let paidTotal = 0;
  let paidCount = 0;
  let depositTotal = 0;
  let depositCount = 0;
  let pendingTotal = 0;
  let pendingCount = 0;

  // rentals
  for (const r of rentals) {
    const price = Number(r.price || 0);
    if (r.payment_status === 'paid') {
      paidTotal += price;
      paidCount += 1;
    } else if (r.payment_status === 'deposit') {
      depositTotal += price;
      depositCount += 1;
    } else {
      // pending
      pendingTotal += price;
      pendingCount += 1;
    }
  }

  // extensions
  for (const ext of extensions) {
    const amount = Number(ext.amount || 0);
    if (ext.payment_status === 'paid') {
      paidTotal += amount;
      paidCount += 1;
    } else if (ext.payment_status === 'deposit') {
      depositTotal += amount;
      depositCount += 1;
    } else {
      pendingTotal += amount;
      pendingCount += 1;
    }
  }

  const overallTotal = paidTotal + depositTotal + pendingTotal;

  return {
    paid: {
      status: 'paid',
      label: 'Ödendi',
      total: paidTotal,
      count: paidCount,
    },
    deposit: {
      status: 'deposit',
      label: 'Kapora',
      total: depositTotal,
      count: depositCount,
    },
    pending: {
      status: 'pending',
      label: 'Bekliyor',
      total: pendingTotal,
      count: pendingCount,
    },
    overallTotal,
  };
}

/**
 * 3) getRegionRevenue
 * A, B, C Bölgesi gelirleri ve en çok kazandıran bölgeyi vurgulama.
 */
export async function getRegionRevenue(): Promise<RegionRevenueReport> {
  const { rentals, extensions, desks } = await fetchRawReportData();

  // rentalId -> section eşleştirmesi
  const rentalSectionMap = new Map<string, 'A' | 'B' | 'C'>();
  for (const r of rentals) {
    const sec = (r.desk?.section || 'A').toUpperCase() as 'A' | 'B' | 'C';
    rentalSectionMap.set(String(r.id), sec);
  }

  const regionTotals: Record<'A' | 'B' | 'C', { revenue: number; rentalCount: number }> = {
    A: { revenue: 0, rentalCount: 0 },
    B: { revenue: 0, rentalCount: 0 },
    C: { revenue: 0, rentalCount: 0 },
  };

  // rentals katkısı
  for (const r of rentals) {
    const sec = (r.desk?.section || 'A').toUpperCase() as 'A' | 'B' | 'C';
    if (regionTotals[sec]) {
      regionTotals[sec].revenue += Number(r.price || 0);
      regionTotals[sec].rentalCount += 1;
    }
  }

  // extensions katkısı (kiralama id üzerinden masanın bölgesini bul)
  for (const ext of extensions) {
    const sec = rentalSectionMap.get(String(ext.rental_id)) || 'A';
    if (regionTotals[sec]) {
      regionTotals[sec].revenue += Number(ext.amount || 0);
    }
  }

  // Masaların bölgelere göre sayısı
  const deskCounts: Record<'A' | 'B' | 'C', number> = { A: 0, B: 0, C: 0 };
  for (const d of desks) {
    const sec = (d.section || 'A').toUpperCase() as 'A' | 'B' | 'C';
    if (deskCounts[sec] !== undefined) {
      deskCounts[sec] += 1;
    }
  }

  const totalRevenue =
    regionTotals.A.revenue + regionTotals.B.revenue + regionTotals.C.revenue;

  // En yüksek cirolu bölge
  let topSection: 'A' | 'B' | 'C' | null = null;
  let maxRevenue = -1;
  (['A', 'B', 'C'] as const).forEach((sec) => {
    if (regionTotals[sec].revenue > maxRevenue) {
      maxRevenue = regionTotals[sec].revenue;
      topSection = sec;
    }
  });

  const regions: RegionRevenueItem[] = (['A', 'B', 'C'] as const).map((sec) => {
    const rev = regionTotals[sec].revenue;
    const percentage = totalRevenue > 0 ? Math.round((rev / totalRevenue) * 100) : 0;
    return {
      section: sec,
      label: `${sec} Bölgesi`,
      revenue: rev,
      percentage,
      rentalCount: regionTotals[sec].rentalCount,
      deskCount: deskCounts[sec] || 0,
      isTop: sec === topSection && rev > 0,
    };
  });

  return {
    regions,
    topRegion: topSection,
    totalRevenue,
  };
}

/**
 * 4) getMonthlyRevenue
 * Son 12 ayın gelir dağılımı (Bar Chart için)
 */
export async function getMonthlyRevenue(monthCount = 12): Promise<MonthlyRevenueItem[]> {
  const { rentals, extensions } = await fetchRawReportData();

  const trMonths = [
    'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
  ];

  // Son 12 ayın listesini üret
  const monthlyList: MonthlyRevenueItem[] = [];
  const now = new Date();

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const shortLabel = trMonths[m];
    const label = `${shortLabel} ${y}`;

    monthlyList.push({
      key,
      label,
      shortLabel,
      totalRevenue: 0,
      initialRevenue: 0,
      extensionRevenue: 0,
      count: 0,
    });
  }

  const monthMap = new Map<string, MonthlyRevenueItem>();
  monthlyList.forEach((item) => monthMap.set(item.key, item));

  // rentals ekle
  for (const r of rentals) {
    const key = toDateKey(r.created_at || r.start_date).ym;
    const item = monthMap.get(key);
    if (item) {
      const price = Number(r.price || 0);
      item.initialRevenue += price;
      item.totalRevenue += price;
      item.count += 1;
    }
  }

  // extensions ekle
  for (const ext of extensions) {
    const key = toDateKey(ext.created_at).ym;
    const item = monthMap.get(key);
    if (item) {
      const amt = Number(ext.amount || 0);
      item.extensionRevenue += amt;
      item.totalRevenue += amt;
      item.count += 1;
    }
  }

  return monthlyList;
}

/**
 * 5) getStudentDistribution
 * YKS vs LGS Dağılımı (Pie/Donut Chart için)
 */
export async function getStudentDistribution(): Promise<StudentDistribution> {
  const { students } = await fetchRawReportData();

  let yksCount = 0;
  let lgsCount = 0;
  let otherCount = 0;

  for (const s of students) {
    const group = (s.group_type || '').toUpperCase();
    if (group === 'YKS') {
      yksCount += 1;
    } else if (group === 'LGS') {
      lgsCount += 1;
    } else {
      otherCount += 1;
    }
  }

  const totalStudents = students.length;
  const yksPercent = totalStudents > 0 ? Math.round((yksCount / totalStudents) * 100) : 0;
  const lgsPercent = totalStudents > 0 ? Math.round((lgsCount / totalStudents) * 100) : 0;
  const otherPercent = totalStudents > 0 ? Math.round((otherCount / totalStudents) * 100) : 0;

  return {
    yksCount,
    lgsCount,
    otherCount,
    totalStudents,
    yksPercent,
    lgsPercent,
    otherPercent,
  };
}

/**
 * 6) getRecentTransactions
 * Son İşlemler tablosu için: İlk Kiralamalar ve Süre Uzatmaları kronolojik sırada birleştirilir.
 */
export async function getRecentTransactions(limit = 25): Promise<RecentTransaction[]> {
  const { rentals, extensions } = await fetchRawReportData();

  const rentalMap = new Map<string, any>();
  for (const r of rentals) {
    rentalMap.set(String(r.id), r);
  }

  const transactions: RecentTransaction[] = [];

  // İlk Kiralamalar
  for (const r of rentals) {
    transactions.push({
      id: `rental-${r.id}`,
      date: r.created_at || r.start_date || new Date().toISOString(),
      studentName: r.student?.full_name || 'Bilinmeyen Öğrenci',
      studentGroup: r.student?.group_type || 'Genel',
      deskCode: r.desk?.code || 'Masa',
      section: r.desk?.section || 'A',
      type: 'İlk Kiralama',
      amount: Number(r.price || 0),
      paymentStatus: (r.payment_status || 'pending') as PaymentStatus,
      note: r.payment_note || undefined,
    });
  }

  // Süre Uzatmaları
  for (const ext of extensions) {
    const parentRental = rentalMap.get(String(ext.rental_id));
    transactions.push({
      id: `ext-${ext.id}`,
      date: ext.created_at || new Date().toISOString(),
      studentName: parentRental?.student?.full_name || 'Öğrenci',
      studentGroup: parentRental?.student?.group_type || 'Genel',
      deskCode: parentRental?.desk?.code || 'Masa',
      section: parentRental?.desk?.section || 'A',
      type: 'Süre Uzatma',
      amount: Number(ext.amount || 0),
      paymentStatus: (ext.payment_status || 'pending') as PaymentStatus,
      note: ext.payment_note ? `${ext.extension_type} - ${ext.payment_note}` : ext.extension_type,
    });
  }

  // En yeni tarihe göre sırala ve limitle
  transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return transactions.slice(0, limit);
}

/**
 * Tüm rapor verilerini tek seferde çeken ana orkestrasyon fonksiyonu.
 */
export async function getAllReportsData(): Promise<FullReportsData> {
  const [
    summary,
    payments,
    regions,
    monthlyRevenue,
    studentDistribution,
    recentTransactions,
  ] = await Promise.all([
    getRevenueSummary(),
    getPaymentSummary(),
    getRegionRevenue(),
    getMonthlyRevenue(12),
    getStudentDistribution(),
    getRecentTransactions(50),
  ]);

  return {
    summary,
    payments,
    regions,
    monthlyRevenue,
    studentDistribution,
    recentTransactions,
  };
}
