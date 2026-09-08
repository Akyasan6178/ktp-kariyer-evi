'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useRentals, type GroupFilter, type PaymentFilter } from '@/hooks/useRentals';
import type { RentalDetailed, PackageType, PaymentStatus, RentalRevenueSummary } from '@/lib/types';
import { ExtendRentalDialog } from '@/components/ExtendRentalDialog';
import { getRentalStatusDetails } from '@/lib/utils/rentalStatus';
import { getTotalRentalRevenue } from '@/lib/services/extensions';
import { formatDate } from '@/lib/utils/format';
import { PAYMENT_BADGE, PACKAGE_LABEL } from '@/lib/utils/badges';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  CheckCircle2,
  PauseCircle,
  Clock,
  User,
  Phone,
  ArrowLeft,
  RefreshCw,
  Loader2,
  X,
  Hourglass,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';




export default function RentalsPage() {
  const {
    rentals,
    filteredRentals,
    loading,
    error,
    stats,
    searchQuery,
    setSearchQuery,
    groupFilter,
    setGroupFilter,
    paymentFilter,
    setPaymentFilter,
    terminateRental,
    suspendDesk,
    updateRental,
    refetch,
  } = useRentals();

  // Dialog State'leri
  const [selectedRental, setSelectedRental] = useState<RentalDetailed | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Düzenleme Formu State'i
  const [editForm, setEditForm] = useState<{
    packageType: PackageType;
    startDate: string;
    endDate: string;
    price: number;
    paymentStatus: PaymentStatus;
    paymentNote: string;
    phone: string;
    parentPhone: string;
    notes: string;
  }>({
    packageType: 'monthly',
    startDate: '',
    endDate: '',
    price: 0,
    paymentStatus: 'pending',
    paymentNote: '',
    phone: '',
    parentPhone: '',
    notes: '',
  });

  const [detailRevenue, setDetailRevenue] = useState<RentalRevenueSummary | null>(null);

  // Modal Tetikleyicileri
  const openDetail = async (rental: RentalDetailed) => {
    setSelectedRental(rental);
    setDetailModalOpen(true);
    try {
      const summary = await getTotalRentalRevenue(rental.id, rental.price || 0);
      setDetailRevenue(summary);
    } catch {
      setDetailRevenue(null);
    }
  };

  const openEdit = (rental: RentalDetailed) => {
    setSelectedRental(rental);
    setEditForm({
      packageType: rental.package_type,
      startDate: rental.start_date,
      endDate: rental.end_date,
      price: rental.price,
      paymentStatus: rental.payment_status,
      paymentNote: rental.payment_note || '',
      phone: rental.student.phone || '',
      parentPhone: rental.student.parent_phone || '',
      notes: rental.student.notes || '',
    });
    setEditModalOpen(true);
  };

  const openExtend = (rental: RentalDetailed) => {
    setSelectedRental(rental);
    setExtendModalOpen(true);
  };

  const openTerminate = (rental: RentalDetailed) => {
    setSelectedRental(rental);
    setTerminateModalOpen(true);
  };

  const openSuspend = (rental: RentalDetailed) => {
    setSelectedRental(rental);
    setSuspendModalOpen(true);
  };

  // ── İşlem Fonksiyonları ────────────────────────────────────

  // Kiralamayı Sonlandır (rentals.is_active = false, desk.status = available)
  const handleConfirmTerminate = async () => {
    if (!selectedRental) return;
    setActionLoading(true);
    try {
      await terminateRental(selectedRental.id, selectedRental.desk_id);
      toast.success('Kiralama sonlandırıldı', {
        description: `Masa ${selectedRental.desk?.code} boş duruma getirildi.`,
      });
      setTerminateModalOpen(false);
      setSelectedRental(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız';
      toast.error('Hata oluştu', { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Masayı Askıya Al (desk.status = suspended)
  const handleConfirmSuspend = async () => {
    if (!selectedRental) return;
    setActionLoading(true);
    try {
      await suspendDesk(selectedRental.desk_id);
      toast.warning('Masa askıya alındı', {
        description: `Masa ${selectedRental.desk?.code} durumu 'Askıda' olarak güncellendi.`,
      });
      setSuspendModalOpen(false);
      setSelectedRental(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız';
      toast.error('Hata oluştu', { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Düzenleme Kaydet
  const handleSaveEdit = async () => {
    if (!selectedRental) return;
    setActionLoading(true);
    try {
      await updateRental(
        selectedRental.id,
        {
          package_type: editForm.packageType,
          start_date: editForm.startDate,
          end_date: editForm.endDate,
          price: editForm.price,
          payment_status: editForm.paymentStatus,
          payment_note: editForm.paymentNote || null,
        },
        selectedRental.student_id,
        {
          phone: editForm.phone,
          parent_phone: editForm.parentPhone,
          notes: editForm.notes || null,
        },
      );
      toast.success('Kiralama güncellendi', {
        description: `${selectedRental.student?.full_name} kaydı güncellendi.`,
      });
      setEditModalOpen(false);
      setSelectedRental(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Güncelleme başarısız';
      toast.error('Hata oluştu', { description: msg });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <Navbar onRefresh={refetch} />

      <main className="mx-auto max-w-screen-2xl px-6 py-6 space-y-6">
        {/* Başlık & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Link href="/" className="hover:text-slate-600 flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                <span>Kat Planı</span>
              </Link>
              <span>/</span>
              <span className="text-slate-600 font-semibold">Kiralama Yönetimi</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Kiralama Yönetimi
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Aktif kiralamaları görüntüleyin, filtreleyin, süre uzatın veya sonlandırın.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-60"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              <span>Yenile</span>
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm hover:bg-slate-800 transition-all"
            >
              <span>Kat Planına Git</span>
            </Link>
          </div>
        </div>

        {/* ── Özet Sayaç Kartları ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Toplam Aktif
              </p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700">
              <User className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Aktif Kiralama
              </p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-orange-800 uppercase tracking-wider">
                ≤ 7 Gün Kalan
              </p>
              <p className="text-2xl font-black text-orange-700 mt-1">{stats.expiringCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-100 text-orange-700">
              <Hourglass className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
                Süresi Dolan
              </p>
              <p className="text-2xl font-black text-rose-700 mt-1">{stats.expiredCount}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-rose-100 text-rose-700">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* ── Filtre & Arama Çubuğu ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Canlı Arama Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Öğrenci adı, masa kodu veya telefon ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filtre Grupları */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Grup Filtresi: Tümü, YKS, LGS */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(['all', 'YKS', 'LGS'] as const).map((group) => (
                  <button
                    key={group}
                    onClick={() => setGroupFilter(group)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      groupFilter === group
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900',
                    )}
                  >
                    {group === 'all' ? 'Tüm Gruplar' : group}
                  </button>
                ))}
              </div>

              {/* Ödeme Durumu Filtresi: Tümü, Ödendi, Kapora, Bekliyor */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    { id: 'all', label: 'Tüm Ödemeler' },
                    { id: 'paid', label: 'Ödendi' },
                    { id: 'deposit', label: 'Kapora' },
                    { id: 'pending', label: 'Bekliyor' },
                  ] as const
                ).map((pay) => (
                  <button
                    key={pay.id}
                    onClick={() => setPaymentFilter(pay.id as PaymentFilter)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      paymentFilter === pay.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900',
                    )}
                  >
                    {pay.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filtre Özet Bilgisi */}
          {(searchQuery || groupFilter !== 'all' || paymentFilter !== 'all') && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
              <span>
                Filtrelenen sonuç: <strong>{filteredRentals.length}</strong> / {rentals.length}
              </span>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGroupFilter('all');
                  setPaymentFilter('all');
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
              >
                Filtreleri Temizle
              </button>
            </div>
          )}
        </div>

        {/* ── KİRALAMA TABLOSU ── */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Masa</th>
                  <th className="py-3.5 px-4">Öğrenci</th>
                  <th className="py-3.5 px-4">Telefon</th>
                  <th className="py-3.5 px-4">Grup</th>
                  <th className="py-3.5 px-4">Paket</th>
                  <th className="py-3.5 px-4">Başlangıç</th>
                  <th className="py-3.5 px-4">Bitiş</th>
                  <th className="py-3.5 px-4">Ödeme Durumu</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
                        <span className="text-xs font-medium">Kiralamalar yükleniyor…</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRentals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="h-8 w-8 text-slate-300" />
                        <span className="text-sm font-semibold text-slate-700">
                          Kiralama kaydı bulunamadı
                        </span>
                        <span className="text-xs text-slate-400">
                          Arama kriterlerini değiştirerek tekrar deneyebilirsiniz.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRentals.map((rental) => {
                    const status = getRentalStatusDetails(rental.end_date);
                    const payment =
                      PAYMENT_BADGE[rental.payment_status] || PAYMENT_BADGE.pending;

                    return (
                      <tr
                        key={rental.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        {/* 1. Masa */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-7 rounded-md bg-slate-900 text-white font-black text-xs shadow-sm">
                              {rental.desk?.code || '—'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {rental.desk?.section}
                            </span>
                          </div>
                        </td>

                        {/* 2. Öğrenci */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                              {rental.student?.full_name?.charAt(0) || 'Ö'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {rental.student?.full_name || '—'}
                              </p>
                              {rental.student?.parent_name && (
                                <p className="text-[10px] text-slate-400">
                                  Veli: {rental.student.parent_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 3. Telefon */}
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                          {rental.student?.phone ? (
                            <a
                              href={`tel:${rental.student.phone}`}
                              className="hover:text-slate-900 flex items-center gap-1.5"
                            >
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{rental.student.phone}</span>
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* 4. Grup */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {rental.student?.group_type || '—'}
                          </span>
                        </td>

                        {/* 5. Paket */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div>
                            <span className="font-semibold text-slate-800">
                              {PACKAGE_LABEL[rental.package_type] || rental.package_type}

                            </span>
                            <p className="text-[10px] text-slate-400">
                              ₺{rental.price.toLocaleString('tr-TR')}
                            </p>
                          </div>
                        </td>

                        {/* 6. Başlangıç */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {formatDate(rental.start_date)}
                        </td>

                        {/* 7. Bitiş */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {formatDate(rental.end_date)}
                        </td>

                        {/* 8. Ödeme Durumu */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border',
                              payment.className,
                            )}
                          >
                            {payment.label}
                          </span>

                        </td>

                        {/* 9. Durum (Şartname: 🔴 Süresi Doldu, 🟠 X Gün Kaldı, 🟢 Aktif) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs',
                              status.badgeClass,
                            )}
                          >
                            {status.badgeText}
                          </span>
                        </td>

                        {/* 10. İşlemler */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Detay Gör */}
                            <button
                              onClick={() => openDetail(rental)}
                              title="Detay Gör"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Düzenle */}
                            <button
                              onClick={() => openEdit(rental)}
                              title="Düzenle"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* KTP-005: Süre Uzat */}
                            <button
                              onClick={() => openExtend(rental)}
                              title="Süre Uzat (+1 Hafta, +1 Ay, +1 Yıl)"
                              className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all shadow-xs cursor-pointer"
                            >
                              <Clock className="h-3.5 w-3.5" />
                            </button>

                            {/* Masayı Askıya Al */}
                            <button
                              onClick={() => openSuspend(rental)}
                              title="Masayı Askıya Al"
                              className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all shadow-xs cursor-pointer"
                            >
                              <PauseCircle className="h-3.5 w-3.5" />
                            </button>

                            {/* Kiralamayı Sonlandır */}
                            <button
                              onClick={() => openTerminate(rental)}
                              title="Kiralamayı Sonlandır"
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════════
          1. DETAY GÖR MODALI
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={detailModalOpen} onOpenChange={(open) => !open && setDetailModalOpen(false)}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-slate-200 shadow-2xl rounded-2xl">
          <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-sm">
                {selectedRental?.desk?.code}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  {selectedRental?.student?.full_name}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  Masa {selectedRental?.desk?.code} ({selectedRental?.desk?.section} Bölgesi) Kiralama Detayları
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Kalan Süre Rozeti */}
            {selectedRental && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Hourglass className="h-4 w-4 text-blue-600" />
                  Kalan Süre:
                </span>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-bold border',
                    getRentalStatusDetails(selectedRental.end_date).badgeClass,
                  )}
                >
                  {getRentalStatusDetails(selectedRental.end_date).badgeText}
                </span>
              </div>
            )}

            {/* Öğrenci & Veli Bilgileri */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Öğrenci Bilgileri
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 text-[10px]">Öğrenci Ad Soyad</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental?.student?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Grup</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental?.student?.group_type}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Öğrenci Telefon</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental?.student?.phone || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Veli Ad Soyad</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental?.student?.parent_name || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Veli Telefon</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental?.student?.parent_phone || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Öğrenci Notu</p>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedRental?.student?.notes || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Kiralama & Ödeme Bilgileri */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kiralama & Ödeme
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 text-[10px]">Paket Tipi</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental && PACKAGE_LABEL[selectedRental.package_type]}

                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Ücret</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    ₺{selectedRental?.price.toLocaleString('tr-TR')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Başlangıç Tarihi</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental && formatDate(selectedRental.start_date)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Bitiş Tarihi</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental && formatDate(selectedRental.end_date)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Ödeme Durumu</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {selectedRental && PAYMENT_BADGE[selectedRental.payment_status]?.label}
                  </p>

                </div>
                <div>
                  <p className="text-slate-400 text-[10px]">Ödeme Notu</p>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {selectedRental?.payment_note || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Toplam Öğrenci Geliri Özeti */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col gap-2 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Toplam Öğrenci Geliri
                </span>
                <span className="font-bold text-emerald-400">
                  {detailRevenue
                    ? `₺${detailRevenue.totalRevenue.toLocaleString('tr-TR')}`
                    : `₺${(selectedRental?.price || 0).toLocaleString('tr-TR')}`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">İlk Kiralama</span>
                  <span className="font-bold text-slate-200">
                    ₺{(selectedRental?.price || 0).toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px]">Uzatmalar Toplamı</span>
                  <span className="font-bold text-blue-300">
                    +₺{(detailRevenue?.extensionsTotal || 0).toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Uzatma Geçmişi */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Uzatma Geçmişi ({detailRevenue?.extensions?.length || 0})
              </h4>
              {detailRevenue?.extensions && detailRevenue.extensions.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {detailRevenue.extensions.map((ext) => {
                    const badge = PAYMENT_BADGE[ext.payment_status] || PAYMENT_BADGE.pending;

                    return (
                      <div
                        key={ext.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">
                            {ext.extension_type}
                          </span>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                              badge.className,
                            )}
                          >

                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>{formatDate(ext.created_at)}</span>
                          <span className="font-bold text-slate-900">
                            ₺{ext.amount.toLocaleString('tr-TR')}
                          </span>
                        </div>
                        {ext.payment_note && (
                          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                            Not: {ext.payment_note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                  Henüz ek süre uzatma yapılmadı.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              size="sm"
              onClick={() => {
                setDetailModalOpen(false);
                setExtendModalOpen(true);
              }}
              className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Süre Uzat</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailModalOpen(false)}
            >
              Kapat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          2. DÜZENLE MODALI
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={editModalOpen} onOpenChange={(open) => !open && !actionLoading && setEditModalOpen(false)}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-slate-200 shadow-2xl rounded-2xl">
          <div className="bg-slate-900 p-5 text-white">
            <DialogTitle className="text-base font-bold text-white">
              Kiralamayı Düzenle: Masa {selectedRental?.desk?.code}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-0.5">
              Öğrenci: {selectedRental?.student?.full_name}
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Paket Tipi
                </label>
                <select
                  value={editForm.packageType}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      packageType: e.target.value as PackageType,
                    }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                  <option value="yearly">Yıllık</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ücret (₺)
                </label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      price: Number(e.target.value),
                    }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Ödeme Durumu
                </label>
                <select
                  value={editForm.paymentStatus}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      paymentStatus: e.target.value as PaymentStatus,
                    }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="paid">Ödendi</option>
                  <option value="deposit">Kapora</option>
                  <option value="pending">Bekliyor</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Öğrenci Telefon
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Ödeme Notu
              </label>
              <input
                type="text"
                placeholder="Örn: 500 TL kapora elden alındı"
                value={editForm.paymentNote}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    paymentNote: e.target.value,
                  }))
                }
                className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={actionLoading}
            >
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={actionLoading}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {actionLoading ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          3. KİRALAMAYI SONLANDIR ONAY MODALI
          Şartname: rentals.is_active = false, desk.status = available
      ══════════════════════════════════════════════════════════ */}
      <Dialog
        open={terminateModalOpen}
        onOpenChange={(open) => !open && !actionLoading && setTerminateModalOpen(false)}
      >
        <DialogContent className="sm:max-w-md p-6 border-slate-200 shadow-2xl rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <XCircle className="h-5 w-5" />
            </div>

            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Kiralamayı Sonlandır
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                <strong>Masa {selectedRental?.desk?.code}</strong> için{' '}
                <strong>{selectedRental?.student?.full_name}</strong> adlı öğrencinin aktif kiralamasını sonlandırmak istediğinizden emin misiniz?
              </DialogDescription>
              <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p>• Kiralama kaydı pasif (arşiv) duruma getirilecek.</p>
                <p>• Masa durumu <strong>Boş (available)</strong> olarak güncellenecek.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminateModalOpen(false)}
              disabled={actionLoading}
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmTerminate}
              disabled={actionLoading}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {actionLoading ? 'Sonlandırılıyor…' : 'Evet, Sonlandır'}
            </Button>

          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          4. MASAYI ASKIYA AL ONAY MODALI
          Şartname: desk.status = suspended
      ══════════════════════════════════════════════════════════ */}
      <Dialog
        open={suspendModalOpen}
        onOpenChange={(open) => !open && !actionLoading && setSuspendModalOpen(false)}
      >
        <DialogContent className="sm:max-w-md p-6 border-slate-200 shadow-2xl rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <PauseCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Masayı Askıya Al
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                <strong>Masa {selectedRental?.desk?.code}</strong> masasını askıya almak istediğinizden emin misiniz?
              </DialogDescription>
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                <p>• Masa durumu <strong>Askıda (suspended)</strong> olarak güncellenecek.</p>
                <p>• Kat planında sarı renkle işaretlenecektir.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuspendModalOpen(false)}
              disabled={actionLoading}
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSuspend}
              disabled={actionLoading}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {actionLoading ? 'İşleniyor…' : 'Evet, Askıya Al'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          5. SÜRE UZATMA MODALI (KTP-005)
      ══════════════════════════════════════════════════════════ */}
      {selectedRental && (
        <ExtendRentalDialog
          rentalId={selectedRental.id}
          deskCode={selectedRental.desk?.code || ''}
          studentName={selectedRental.student?.full_name || ''}
          currentEndDate={selectedRental.end_date}
          isOpen={extendModalOpen}
          onClose={() => setExtendModalOpen(false)}
          onSuccess={async () => {
            setExtendModalOpen(false);
            await refetch();
          }}
        />
      )}
    </div>
  );
}
