'use client';

// ============================================================
// /reports – Gelir ve Finans Yönetim Ekranı
// Yasin Hoca Çalışma Merkezi
// Supabase Service Layer (lib/services/reports.ts) entegreli
// ============================================================

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  getAllReportsData,
  type FullReportsData,
  type RecentTransaction,
  type MonthlyRevenueItem,
} from '@/lib/services/reports';
import type { PaymentStatus } from '@/lib/types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Crown,
  Award,
  BookOpen,
  PieChart as PieChartIcon,
  BarChart3,
  Building2,
  ArrowLeft,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Para birimi formatlama (45.000 ₺)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Tarih formatlama
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<FullReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'İlk Kiralama' | 'Süre Uzatma'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Veri yükleme
  const loadReports = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const res = await getAllReportsData();
      setData(res);
      if (showToast) {
        toast.success('Finans verileri güncellendi');
      }
    } catch (err: any) {
      console.error('Raporlar yüklenemedi:', err);
      toast.error('Rapor verileri alınamadı: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filtrelenmiş işlemler
  const filteredTransactions = useMemo(() => {
    if (!data) return [];
    return data.recentTransactions.filter((tx) => {
      const matchesSearch =
        searchTerm === '' ||
        tx.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.deskCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || tx.paymentStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, searchTerm, typeFilter, statusFilter]);

  // CSV ve Excel İndirme Fonksiyonu
  const exportToSpreadsheet = (isExcelFormat: boolean) => {
    if (!data || !data.recentTransactions.length) {
      toast.error('Dışa aktarılacak işlem bulunamadı');
      return;
    }

    try {
      const headers = [
        'Tarih',
        'Öğrenci',
        'Grup',
        'Masa',
        'Bölge',
        'İşlem Tipi',
        'Tutar (TL)',
        'Ödeme Durumu',
        'Açıklama/Not',
      ];

      const statusTrMap: Record<PaymentStatus, string> = {
        paid: 'Ödendi',
        deposit: 'Kapora',
        pending: 'Bekliyor',
      };

      const rows = data.recentTransactions.map((tx) => [
        `"${formatDateTime(tx.date)}"`,
        `"${tx.studentName}"`,
        `"${tx.studentGroup}"`,
        `"${tx.deskCode}"`,
        `"${tx.section}"`,
        `"${tx.type}"`,
        tx.amount,
        `"${statusTrMap[tx.paymentStatus] || tx.paymentStatus}"`,
        `"${(tx.note || '').replace(/"/g, '""')}"`,
      ]);

      // Excel için UTF-8 BOM ve noktalı virgül (Turkish locale Excel separator)
      const csvContent =
        '\uFEFF' +
        [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');

      const blob = new Blob([csvContent], {
        type: isExcelFormat
          ? 'application/vnd.ms-excel;charset=utf-8;'
          : 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `Yasin_Hoca_Finans_Raporu_${new Date().toISOString().split('T')[0]}.${
        isExcelFormat ? 'csv' : 'csv'
      }`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        isExcelFormat
          ? 'Excel uyumlu rapor başarıyla indirildi'
          : 'CSV dosyası başarıyla indirildi'
      );
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Dosya indirilirken bir hata oluştu');
    }
  };

  // Bar Chart için maksimum değer hesaplama
  const maxMonthlyRevenue = useMemo(() => {
    if (!data?.monthlyRevenue?.length) return 10000;
    const maxVal = Math.max(...data.monthlyRevenue.map((m) => m.totalRevenue));
    return maxVal > 0 ? maxVal * 1.15 : 10000;
  }, [data]);

  // Donut Chart koordinat hesaplama
  const donutData = useMemo(() => {
    if (!data?.studentDistribution) return null;
    const { yksCount, lgsCount, otherCount, totalStudents } = data.studentDistribution;
    if (totalStudents === 0) return null;

    const items = [
      { label: 'YKS', count: yksCount, color: '#3b82f6', bg: 'bg-blue-500' },
      { label: 'LGS', count: lgsCount, color: '#8b5cf6', bg: 'bg-purple-500' },
      { label: 'Diğer', count: otherCount, color: '#10b981', bg: 'bg-emerald-500' },
    ].filter((item) => item.count > 0);

    let cumulativePercent = 0;
    const slices = items.map((item) => {
      const percent = item.count / totalStudents;
      const startAngle = cumulativePercent * 360;
      cumulativePercent += percent;
      const endAngle = cumulativePercent * 360;

      // SVG path calculations
      const radius = 60;
      const strokeWidth = 22;
      const circumference = 2 * Math.PI * radius;
      const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
      const strokeDashoffset = -circumference * (cumulativePercent - percent);

      return {
        ...item,
        percent: Math.round(percent * 100),
        strokeDasharray,
        strokeDashoffset,
        startAngle,
        endAngle,
      };
    });

    return { slices, totalStudents };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onRefresh={() => loadReports(true)} />

      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* ============================================================ */}
        {/* 1. ÜST HEADER & AKSİYONLAR                                   */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Gelir ve Finans Yönetimi
                </h1>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Yasin Hoca Çalışma Merkezi &bull; Anlık ciro, tahsilat, bölge performansı ve finansal işlemler
                </p>
              </div>
            </div>
          </div>

          {/* Export Butonları */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadReports(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
              title="Verileri Yenile"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin text-emerald-600')} />
              <span>Yenile</span>
            </button>

            <button
              onClick={() => exportToSpreadsheet(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>CSV İndir</span>
            </button>

            <button
              onClick={() => exportToSpreadsheet(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-200" />
              <span>Excel'e Aktar</span>
            </button>
          </div>
        </div>

        {/* Yükleniyor State */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
              <p className="text-sm font-medium text-slate-500">Finans verileri yükleniyor...</p>
            </div>
          </div>
        ) : !data ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            Veriler alınamadı. Lütfen sayfayı yenileyin.
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* 2. FİNANS DASHBOARDU – 8 ADET ANA METRİK KARTI                 */}
            {/* ============================================================ */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
              {/* Bugünkü Gelir */}
              <div className="relative overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Bugünkü Gelir</span>
                  <div className="rounded-md bg-emerald-100 p-1">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                  {formatCurrency(data.summary.todayRevenue)}
                </div>
                <div className="mt-1 text-[10px] text-emerald-600 font-medium">Günlük tahsilat</div>
              </div>

              {/* Bu Ayki Gelir */}
              <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Bu Ayki Gelir</span>
                  <div className="rounded-md bg-blue-100 p-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                  {formatCurrency(data.summary.monthRevenue)}
                </div>
                <div className="mt-1 text-[10px] text-blue-600 font-medium">Bu ayki toplam ciro</div>
              </div>

              {/* Bu Yılki Gelir */}
              <div className="relative overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-indigo-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Bu Yılki Gelir</span>
                  <div className="rounded-md bg-indigo-100 p-1">
                    <Award className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                  {formatCurrency(data.summary.yearRevenue)}
                </div>
                <div className="mt-1 text-[10px] text-indigo-600 font-medium">Yıllık toplam hacim</div>
              </div>

              {/* Toplam Gelir */}
              <div className="relative overflow-hidden rounded-xl border border-slate-900/10 bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-md">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Toplam Gelir
                  </span>
                  <div className="rounded-md bg-white/10 p-1">
                    <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
                <div className="mt-2 text-lg font-extrabold text-white sm:text-xl tracking-tight">
                  {formatCurrency(data.summary.totalRevenue)}
                </div>
                <div className="mt-1 text-[10px] text-slate-300">Kiralama + Uzatmalar</div>
              </div>

              {/* Bekleyen Tahsilatlar */}
              <div className="relative overflow-hidden rounded-xl border border-rose-100 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-rose-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Bekleyen Tahsilat</span>
                  <div className="rounded-md bg-rose-100 p-1">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-rose-600 sm:text-xl">
                  {formatCurrency(data.summary.pendingTotal)}
                </div>
                <div className="mt-1 text-[10px] text-rose-500 font-medium">Alınacak bakiye</div>
              </div>

              {/* Kaporalı Öğrenciler */}
              <div className="relative overflow-hidden rounded-xl border border-amber-100 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-amber-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Kaporalı Öğrenci</span>
                  <div className="rounded-md bg-amber-100 p-1">
                    <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                  {data.summary.depositCount}{' '}
                  <span className="text-xs font-normal text-slate-500">öğrenci</span>
                </div>
                <div className="mt-1 text-[10px] text-amber-600 font-medium">Tamamlama bekliyor</div>
              </div>

              {/* Aktif Kiralamalar */}
              <div className="relative overflow-hidden rounded-xl border border-teal-100 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-teal-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Aktif Kiralamalar</span>
                  <div className="rounded-md bg-teal-100 p-1">
                    <Layers className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                  {data.summary.activeRentalsCount}{' '}
                  <span className="text-xs font-normal text-slate-500">masa</span>
                </div>
                <div className="mt-1 text-[10px] text-teal-600 font-medium">Dolu masalar</div>
              </div>

              {/* Aktif Öğrenci Sayısı */}
              <div className="relative overflow-hidden rounded-xl border border-purple-100 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-purple-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Aktif Öğrenci</span>
                  <div className="rounded-md bg-purple-100 p-1">
                    <Users className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                  {data.summary.activeStudentsCount}{' '}
                  <span className="text-xs font-normal text-slate-500">kişi</span>
                </div>
                <div className="mt-1 text-[10px] text-purple-600 font-medium">Kayıtlı tekil öğrenci</div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3. ÖDEME DURUMU RAPORLARI & BÖLGE ANALİZİ                     */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Ödeme Durumu Raporları */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Ödeme Durumu Raporları</h2>
                    <p className="text-xs text-slate-500">
                      Ödenen, kapora alınan ve tahsilat bekleyen kiralama ve uzatmalar
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    Genel Toplam: {formatCurrency(data.payments.overallTotal)}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Ödendi */}
                  <div className="group rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-emerald-800">Ödendi</span>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {data.payments.paid.count} işlem
                      </span>
                    </div>
                    <div className="mt-3 text-xl font-extrabold text-emerald-700">
                      {formatCurrency(data.payments.paid.total)}
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${
                            data.payments.overallTotal > 0
                              ? Math.round((data.payments.paid.total / data.payments.overallTotal) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-emerald-600">
                      <span>Oran</span>
                      <span className="font-semibold">
                        %{data.payments.overallTotal > 0 ? Math.round((data.payments.paid.total / data.payments.overallTotal) * 100) : 0}
                      </span>
                    </div>
                  </div>

                  {/* Kapora */}
                  <div className="group rounded-xl border border-amber-200 bg-amber-50/50 p-4 transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-amber-800">Kapora</span>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {data.payments.deposit.count} işlem
                      </span>
                    </div>
                    <div className="mt-3 text-xl font-extrabold text-amber-700">
                      {formatCurrency(data.payments.deposit.total)}
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all duration-500"
                        style={{
                          width: `${
                            data.payments.overallTotal > 0
                              ? Math.round((data.payments.deposit.total / data.payments.overallTotal) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-amber-600">
                      <span>Oran</span>
                      <span className="font-semibold">
                        %{data.payments.overallTotal > 0 ? Math.round((data.payments.deposit.total / data.payments.overallTotal) * 100) : 0}
                      </span>
                    </div>
                  </div>

                  {/* Bekliyor */}
                  <div className="group rounded-xl border border-rose-200 bg-rose-50/50 p-4 transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                        <span className="text-xs font-bold text-rose-800">Bekliyor</span>
                      </div>
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        {data.payments.pending.count} işlem
                      </span>
                    </div>
                    <div className="mt-3 text-xl font-extrabold text-rose-700">
                      {formatCurrency(data.payments.pending.total)}
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-rose-200">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-500"
                        style={{
                          width: `${
                            data.payments.overallTotal > 0
                              ? Math.round((data.payments.pending.total / data.payments.overallTotal) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-rose-600">
                      <span>Oran</span>
                      <span className="font-semibold">
                        %{data.payments.overallTotal > 0 ? Math.round((data.payments.pending.total / data.payments.overallTotal) * 100) : 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 flex items-center justify-between">
                  <span>Tahsilat Başarı Oranı:</span>
                  <span className="font-bold text-emerald-700">
                    %{data.payments.overallTotal > 0 ? Math.round((data.payments.paid.total / data.payments.overallTotal) * 100) : 0} Gerçekleşti
                  </span>
                </div>
              </div>

              {/* Bölge Analizi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Bölge Performans Analizi</h2>
                    <p className="text-xs text-slate-500">
                      A, B ve C çalışma salonlarının gelir ve tercih edilme oranları
                    </p>
                  </div>
                  {data.regions.topRegion && (
                    <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm">
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                      <span>En Çok Gelir: {data.regions.topRegion} Bölgesi</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {data.regions.regions.map((reg) => (
                    <div
                      key={reg.section}
                      className={cn(
                        'relative rounded-xl border p-4 transition hover:shadow-md',
                        reg.isTop
                          ? 'border-amber-300 bg-gradient-to-b from-amber-50/60 to-white shadow-sm ring-1 ring-amber-200'
                          : 'border-slate-200 bg-slate-50/50'
                      )}
                    >
                      {reg.isTop && (
                        <div className="absolute -top-2.5 right-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                          <Crown className="h-2.5 w-2.5" />
                          <span>LİDER BÖLGE</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{reg.label}</span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {reg.deskCount} Masa
                        </span>
                      </div>

                      <div className="mt-3 text-lg font-bold text-slate-900 sm:text-xl">
                        {formatCurrency(reg.revenue)}
                      </div>

                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            reg.isTop ? 'bg-amber-500' : 'bg-slate-700'
                          )}
                          style={{ width: `${reg.percentage}%` }}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Ciro Payı: %{reg.percentage}</span>
                        <span>{reg.rentalCount} Kiralama</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 flex items-center justify-between">
                  <span>Toplam Bölge Geliri:</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(data.regions.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 4. GRAFİKLER – AYLIK GELİR BAR CHART & ÖĞRENCİ DAĞILIMI PIE  */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Aylık Gelir Grafiği (Son 12 Ay - Bar Chart) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Aylık Gelir Grafiği (Son 12 Ay)</h2>
                    <p className="text-xs text-slate-500">
                      İlk kiralamalar ve süre uzatmalarının aylık konsolide dağılımı
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-sm bg-emerald-600" />
                      <span className="text-slate-600">Toplam Gelir</span>
                    </div>
                  </div>
                </div>

                {/* SVG Bar Chart */}
                <div className="mt-6">
                  <div className="relative h-64 w-full">
                    {/* Y Axis Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400">
                      <div className="border-b border-slate-100 pb-1 flex justify-between">
                        <span>{formatCurrency(maxMonthlyRevenue)}</span>
                        <div className="w-full border-t border-dashed border-slate-200 ml-2" />
                      </div>
                      <div className="border-b border-slate-100 pb-1 flex justify-between">
                        <span>{formatCurrency(maxMonthlyRevenue / 2)}</span>
                        <div className="w-full border-t border-dashed border-slate-200 ml-2" />
                      </div>
                      <div className="border-b border-slate-100 pb-1 flex justify-between">
                        <span>0 ₺</span>
                        <div className="w-full border-t border-slate-200 ml-2" />
                      </div>
                    </div>

                    {/* Bars Grid */}
                    <div className="absolute inset-x-8 bottom-4 top-2 flex items-end justify-between gap-1 sm:gap-2">
                      {data.monthlyRevenue.map((item, index) => {
                        const heightPercent =
                          maxMonthlyRevenue > 0
                            ? Math.min(100, Math.max(4, (item.totalRevenue / maxMonthlyRevenue) * 100))
                            : 4;
                        const isHovered = hoveredBarIndex === index;

                        return (
                          <div
                            key={item.key}
                            className="relative flex flex-1 flex-col items-center h-full justify-end group cursor-pointer"
                            onMouseEnter={() => setHoveredBarIndex(index)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          >
                            {/* Tooltip */}
                            {isHovered && (
                              <div className="absolute -top-16 z-20 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-xl pointer-events-none transition-all">
                                <div className="font-bold">{item.label}</div>
                                <div className="text-emerald-300 font-semibold">{formatCurrency(item.totalRevenue)}</div>
                                <div className="text-[10px] text-slate-300">
                                  {item.count} işlem (Kira: {formatCurrency(item.initialRevenue)} / Uzatma: {formatCurrency(item.extensionRevenue)})
                                </div>
                              </div>
                            )}

                            {/* Bar Column */}
                            <div className="w-full max-w-[36px] flex flex-col items-center justify-end h-full">
                              <div
                                className={cn(
                                  'w-full rounded-t-md transition-all duration-300',
                                  item.totalRevenue > 0
                                    ? 'bg-gradient-to-t from-emerald-700 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 shadow-sm'
                                    : 'bg-slate-200/60'
                                )}
                                style={{ height: `${heightPercent}%` }}
                              />
                            </div>

                            {/* Month Label */}
                            <span className="mt-2 text-[10px] font-medium text-slate-500 group-hover:text-slate-900 group-hover:font-bold">
                              {item.shortLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Öğrenci Dağılımı (YKS vs LGS - Donut Chart) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Öğrenci Dağılımı</h2>
                      <p className="text-xs text-slate-500">YKS vs LGS hazırlık oranları</p>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-1.5 text-slate-600">
                      <PieChartIcon className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Donut SVG */}
                  <div className="mt-6 flex flex-col items-center justify-center">
                    <div className="relative h-44 w-44 flex items-center justify-center">
                      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90 transform">
                        {/* Arka plan çemberi */}
                        <circle
                          cx="80"
                          cy="80"
                          r="60"
                          fill="transparent"
                          stroke="#f1f5f9"
                          strokeWidth="22"
                        />

                        {/* Dilimler */}
                        {donutData?.slices.map((slice, i) => (
                          <circle
                            key={slice.label}
                            cx="80"
                            cy="80"
                            r="60"
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth="22"
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            strokeLinecap="butt"
                            className="transition-all duration-700 hover:opacity-90"
                          />
                        ))}
                      </svg>

                      {/* Merkezdeki Bilgi */}
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-extrabold text-slate-900">
                          {data.studentDistribution.totalStudents}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">Toplam Öğrenci</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lejant & İstatistikler */}
                <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-4">
                  {/* YKS */}
                  <div className="flex items-center justify-between rounded-lg bg-blue-50/50 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-xs font-bold text-slate-800">YKS Öğrencileri</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-blue-700">
                        {data.studentDistribution.yksCount} kişi
                      </span>
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                        %{data.studentDistribution.yksPercent}
                      </span>
                    </div>
                  </div>

                  {/* LGS */}
                  <div className="flex items-center justify-between rounded-lg bg-purple-50/50 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-purple-500" />
                      <span className="text-xs font-bold text-slate-800">LGS Öğrencileri</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-purple-700">
                        {data.studentDistribution.lgsCount} kişi
                      </span>
                      <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">
                        %{data.studentDistribution.lgsPercent}
                      </span>
                    </div>
                  </div>

                  {/* Diğer */}
                  {data.studentDistribution.otherCount > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50/50 p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-800">Diğer / Mezun</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-700">
                          {data.studentDistribution.otherCount} kişi
                        </span>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          %{data.studentDistribution.otherPercent}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 5. SON İŞLEMLER TABLOSU                                       */}
            {/* ============================================================ */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Tablo Üstü Başlık ve Filtre Barı */}
              <div className="border-b border-slate-200 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Son Finansal İşlemler</h2>
                    <p className="text-xs text-slate-500">
                      İlk masa kiralamaları ve süre uzatma ödemeleri kronolojik listesi
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Arama Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Öğrenci, masa kodu veya not ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* İşlem Tipi Filtresi */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="all">Tüm İşlemler</option>
                      <option value="İlk Kiralama">İlk Kiralama</option>
                      <option value="Süre Uzatma">Süre Uzatma</option>
                    </select>

                    {/* Ödeme Durumu Filtresi */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="all">Tüm Durumlar</option>
                      <option value="paid">Ödendi</option>
                      <option value="deposit">Kapora</option>
                      <option value="pending">Bekliyor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tablo İçeriği */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Tarih</th>
                      <th className="px-6 py-3.5">Öğrenci</th>
                      <th className="px-6 py-3.5">Masa & Bölge</th>
                      <th className="px-6 py-3.5">İşlem Tipi</th>
                      <th className="px-6 py-3.5">Tutar</th>
                      <th className="px-6 py-3.5">Ödeme Durumu</th>
                      <th className="px-6 py-3.5">Açıklama / Not</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          Arama kriterlerine uygun işlem bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="transition hover:bg-slate-50/80">
                          {/* Tarih */}
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-600">
                            {formatDateTime(tx.date)}
                          </td>

                          {/* Öğrenci */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="font-bold text-slate-900">{tx.studentName}</div>
                            <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {tx.studentGroup}
                            </span>
                          </td>

                          {/* Masa & Bölge */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{tx.deskCode}</span>
                              <span
                                className={cn(
                                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                                  tx.section === 'A'
                                    ? 'bg-blue-100 text-blue-700'
                                    : tx.section === 'B'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                )}
                              >
                                {tx.section} Bölgesi
                              </span>
                            </div>
                          </td>

                          {/* İşlem Tipi */}
                          <td className="whitespace-nowrap px-6 py-4">
                            {tx.type === 'İlk Kiralama' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                İlk Kiralama
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 border border-purple-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                Süre Uzatma
                              </span>
                            )}
                          </td>

                          {/* Tutar */}
                          <td className="whitespace-nowrap px-6 py-4 font-extrabold text-slate-900">
                            {formatCurrency(tx.amount)}
                          </td>

                          {/* Ödeme Durumu */}
                          <td className="whitespace-nowrap px-6 py-4">
                            {tx.paymentStatus === 'paid' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Ödendi
                              </span>
                            ) : tx.paymentStatus === 'deposit' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                <Clock className="h-3 w-3 text-amber-600" />
                                Kapora
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                                <AlertCircle className="h-3 w-3 text-rose-600" />
                                Bekliyor
                              </span>
                            )}
                          </td>

                          {/* Not */}
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                            {tx.note || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tablo Altı Toplam Bilgisi */}
              <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-500 flex items-center justify-between">
                <span>
                  Toplam {filteredTransactions.length} işlem listeleniyor (Tüm kayıtlar arasından)
                </span>
                <span className="font-semibold text-slate-700">
                  Filtrelenen Tutar:{' '}
                  {formatCurrency(
                    filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0)
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
