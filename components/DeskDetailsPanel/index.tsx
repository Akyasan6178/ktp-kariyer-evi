'use client';

// ============================================================
// Masa Detay Paneli (DeskDetailsPanel)
// KTP-005 Revizyon:
// - Kalan gün / süre bilgisi ve "Süre Uzat" aksiyonu
// - Uzatma Geçmişi listesi (rental_extensions)
// - Toplam Öğrenci Geliri hesabı (İlk Kiralama + Uzatmalar)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { CreateRentalDialog } from '@/components/CreateRentalDialog';
import { ExtendRentalDialog } from '@/components/ExtendRentalDialog';
import { getRentalStatusDetails } from '@/lib/utils/rentalStatus';
import { getTotalRentalRevenue } from '@/lib/services/extensions';
import { formatDateLong, formatDate, formatPhone, cleanPhoneForTel } from '@/lib/utils/format';
import { STATUS_BADGE, PAYMENT_BADGE, PACKAGE_LABEL } from '@/lib/utils/badges';
import { unsuspendDesk } from '@/lib/services/desks';
import { toast } from 'sonner';
import type {
  DeskWithRental,
  RentalRevenueSummary,
} from '@/lib/types';

import { cn } from '@/lib/utils';
import {
  User,
  Phone,
  Users,
  Calendar,
  CreditCard,
  BookOpen,
  FileText,
  Hash,
  ChevronRight,
  Clock,
  PlusCircle,
  PlayCircle,
  PauseCircle,
  Hourglass,
  Sparkles,
  TrendingUp,
  History,
} from 'lucide-react';

interface DeskDetailsPanelProps {
  desk: DeskWithRental | null;
  isOpen: boolean;
  onClose: () => void;
  onRentalCreated?: () => Promise<void> | void;
}


// ── Alt bileşenler ───────────────────────────────────────────
interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string | React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 shrink-0">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {Icon ? (
        <Icon className="h-3.5 w-3.5 text-slate-400" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
      )}
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </span>
    </div>
  );
}

// ── Ana bileşen ──────────────────────────────────────────────
export function DeskDetailsPanel({
  desk,
  isOpen,
  onClose,
  onRentalCreated,
}: DeskDetailsPanelProps) {
  const [isRentalDialogOpen, setIsRentalDialogOpen] = useState(false);
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false);
  const [revenueSummary, setRevenueSummary] = useState<RentalRevenueSummary | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const statusConfig = desk ? STATUS_BADGE[desk.status] : null;
  const rental = desk?.active_rental ?? null;
  const rentalStatus = rental ? getRentalStatusDetails(rental.end_date) : null;

  const handleUnsuspendDesk = async () => {
    if (!desk) return;
    setActionLoading(true);
    try {
      await unsuspendDesk(desk.id);
      toast.success('Masa tekrar aktif edildi', {
        description: `Masa ${desk.code} durumu 'Dolu' olarak güncellendi.`,
      });
      if (onRentalCreated) {
        await onRentalCreated();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız';
      toast.error('Hata oluştu', { description: msg });
    } finally {
      setActionLoading(false);
    }
  };


  // ── Uzatma ve Toplam Gelir Verilerini Yükle ────────────────
  const loadRevenue = useCallback(async () => {
    if (rental?.id) {
      setLoadingRevenue(true);
      try {
        const summary = await getTotalRentalRevenue(rental.id, rental.price || 0);
        setRevenueSummary(summary);
      } catch (err) {
        console.warn('[DeskDetailsPanel] loadRevenue hata:', err);
      } finally {
        setLoadingRevenue(false);
      }
    } else {
      setRevenueSummary(null);
    }
  }, [rental?.id, rental?.price]);

  useEffect(() => {
    if (isOpen && rental?.id) {
      loadRevenue();
    }
  }, [isOpen, rental?.id, loadRevenue]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 overflow-y-auto border-l border-slate-200 shadow-2xl"
        >
          {desk && (
            <>
              {/* Başlık Alanı */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-6">
                <SheetHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <SheetTitle className="text-white text-xl font-bold">
                          Masa {desk.code}
                        </SheetTitle>
                        <SheetDescription className="text-slate-400 text-sm mt-0.5">
                          {desk.section} Bölgesi
                        </SheetDescription>
                      </div>
                    </div>
                    {statusConfig && (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border',
                          statusConfig.className,
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                </SheetHeader>
              </div>

              {/* İçerik */}
              <div className="px-6 py-4 space-y-3">
                {rental ? (
                  <>
                    {/* Askıda Masayı Aktifleştirme Banner / Butonu */}
                    {desk.status === 'suspended' && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PauseCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-amber-900">Masa Askıda</p>
                            <p className="text-[11px] text-amber-700">Bu masa askıya alınmış durumda.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={handleUnsuspendDesk}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          <span>{actionLoading ? 'İşleniyor…' : 'Askıdan Çıkar'}</span>
                        </button>
                      </div>
                    )}

                    {/* KTP-005: Kalan Süre Özeti & Süre Uzat Butonu */}
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Hourglass className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-700">Kalan Süre:</span>
                        </div>
                        {rentalStatus && (
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs',
                              rentalStatus.badgeClass,
                            )}
                          >
                            {rentalStatus.badgeText}
                          </span>
                        )}
                      </div>

                      {/* Süre Uzat Butonu */}
                      <button
                        type="button"
                        onClick={() => setIsExtendDialogOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Süre Uzat (+1 Hafta / +1 Ay / +1 Yıl)</span>
                      </button>
                    </div>

                    {/* Toplam Öğrenci Geliri Kartı */}
                    <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col gap-2 shadow-sm">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                          Toplam Öğrenci Geliri
                        </span>
                        <span className="font-semibold text-emerald-400">
                          {revenueSummary
                            ? `₺${revenueSummary.totalRevenue.toLocaleString('tr-TR')}`
                            : `₺${(rental.price || 0).toLocaleString('tr-TR')}`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[9px]">İlk Kiralama</span>
                          <span className="font-bold text-slate-200">
                            ₺{(rental.price || 0).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px]">Uzatmalar Toplamı</span>
                          <span className="font-bold text-blue-300">
                            +₺{(revenueSummary?.extensionsTotal || 0).toLocaleString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Uzatma Geçmişi (rental_extensions) */}
                    <SectionTitle title="Uzatma Geçmişi" icon={History} />
                    <div className="space-y-2">
                      {revenueSummary?.extensions && revenueSummary.extensions.length > 0 ? (
                        <div className="space-y-2">
                          {revenueSummary.extensions.map((ext) => {
                            const badge =
                              PAYMENT_BADGE[ext.payment_status] || PAYMENT_BADGE.pending;
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

                    <Separator className="bg-slate-100 my-2" />

                    {/* Öğrenci Bilgileri */}
                    <SectionTitle title="Öğrenci Bilgileri" />
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 divide-y divide-slate-100">
                      <InfoRow icon={Hash} label="Masa Kodu" value={desk.code} />
                      <InfoRow
                        icon={User}
                        label="Öğrenci Adı"
                        value={rental.student.full_name}
                      />
                      <InfoRow
                        icon={Phone}
                        label="Öğrenci Telefonu"
                        value={
                          rental.student.phone ? (
                            <a
                              href={`tel:${cleanPhoneForTel(rental.student.phone)}`}
                              className="text-blue-600 hover:underline"
                            >
                              {formatPhone(rental.student.phone)}
                            </a>
                          ) : (
                            '—'
                          )
                        }
                      />
                      <InfoRow
                        icon={Users}
                        label="Grup"
                        value={
                          <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                            {rental.student.group_type}
                          </span>
                        }
                      />
                    </div>

                    <Separator className="bg-slate-100 my-2" />

                    {/* Veli Bilgileri */}
                    <SectionTitle title="Veli Bilgileri" />
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 divide-y divide-slate-100">
                      <InfoRow
                        icon={User}
                        label="Veli Adı"
                        value={rental.student.parent_name || '—'}
                      />
                      <InfoRow
                        icon={Phone}
                        label="Veli Telefonu"
                        value={
                          rental.student.parent_phone ? (
                            <a
                              href={`tel:${cleanPhoneForTel(rental.student.parent_phone)}`}
                              className="text-blue-600 hover:underline"
                            >
                              {formatPhone(rental.student.parent_phone)}
                            </a>
                          ) : (
                            '—'
                          )
                        }
                      />
                    </div>

                    <Separator className="bg-slate-100 my-2" />

                    {/* Kiralama Bilgileri */}
                    <SectionTitle title="İlk Kiralama Bilgileri" />
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 divide-y divide-slate-100">
                      <InfoRow
                        icon={Clock}
                        label="Paket Türü"
                        value={PACKAGE_LABEL[rental.package_type] ?? rental.package_type}
                      />
                      <InfoRow
                        icon={Calendar}
                        label="Başlangıç Tarihi"
                        value={formatDateLong(rental.start_date)}

                      />
                      <InfoRow
                        icon={Calendar}
                        label="Güncel Bitiş Tarihi"
                        value={
                          <span className="font-bold text-slate-800">
                            {formatDateLong(rental.end_date)}

                          </span>
                        }
                      />
                      <InfoRow
                        icon={CreditCard}
                        label="İlk Kiralama Ücreti"
                        value={`₺${(rental.price || 0).toLocaleString('tr-TR')}`}
                      />
                      <InfoRow
                        icon={CreditCard}
                        label="İlk Ödeme Durumu"
                        value={
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
                              PAYMENT_BADGE[rental.payment_status]?.className,
                            )}
                          >
                            {PAYMENT_BADGE[rental.payment_status]?.label ?? rental.payment_status}
                          </span>
                        }
                      />
                    </div>

                    {/* Ödeme Notu */}
                    {rental.payment_note && (
                      <>
                        <SectionTitle title="İlk Ödeme Notu" />
                        <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
                          <div className="flex gap-2.5">
                            <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {rental.payment_note}
                            </p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Öğrenci Notları */}
                    {rental.student.notes && (
                      <>
                        <SectionTitle title="Öğrenci Notları" />
                        <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                          <div className="flex gap-2.5">
                            <FileText className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {rental.student.notes}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  /* Boş Masa Durumu */
                  <div className="flex flex-col items-center justify-center py-12 text-center px-2">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                      <BookOpen className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Masa Boş</h3>
                    <p className="text-sm text-slate-500 max-w-xs mb-6 leading-relaxed">
                      Bu masa şu an müsait durumda. Yeni bir öğrenci kaydedip hemen kiralama oluşturabilirsiniz.
                    </p>

                    {/* Yeşil Renkli Büyük Buton */}
                    <button
                      type="button"
                      onClick={() => setIsRentalDialogOpen(true)}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                    >
                      <PlusCircle className="h-5 w-5" />
                      <span>Kiralama Oluştur</span>
                    </button>
                  </div>
                )}

                <div className="pb-6" />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Kiralama Oluştur Dialogu */}
      <CreateRentalDialog
        desk={desk}
        isOpen={isRentalDialogOpen}
        onClose={() => setIsRentalDialogOpen(false)}
        onSuccess={async () => {
          setIsRentalDialogOpen(false);
          if (onRentalCreated) {
            await onRentalCreated();
          }
          onClose();
        }}
      />

      {/* KTP-005 Finansal Süre Uzat Dialogu */}
      {rental && desk && (
        <ExtendRentalDialog
          rentalId={rental.id}
          deskCode={desk.code}
          studentName={rental.student.full_name}
          currentEndDate={rental.end_date}
          isOpen={isExtendDialogOpen}
          onClose={() => setIsExtendDialogOpen(false)}
          onSuccess={async () => {
            setIsExtendDialogOpen(false);
            await loadRevenue();
            if (onRentalCreated) {
              await onRentalCreated();
            }
          }}
        />
      )}
    </>
  );
}
