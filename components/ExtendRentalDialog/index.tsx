'use client';

// ============================================================
// ExtendRentalDialog – Finansal Süre Uzatma Dialogu
// KTP-005 Revizyon:
// - Uzatma Türü: 1 Hafta, 1 Ay, 1 Yıl
// - Alınacak Ücret: (Zorunlu)
// - Ödeme Durumu: Ödendi, Kapora, Bekliyor
// - Ödeme Notu: (Opsiyonel)
// - rental_extensions tablosuna finansal kayıt ekler.
// - rentals.price DEĞİŞTİRİLMEZ!
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createExtension } from '@/lib/services/extensions';
import { useSettings } from '@/hooks/useSettings';
import type { PaymentStatus } from '@/lib/types';
import {
  Calendar,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  CreditCard,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExtensionType = '1 Hafta' | '1 Ay' | '1 Yıl';

interface ExtendRentalDialogProps {
  rentalId: string;
  deskCode: string;
  studentName: string;
  currentEndDate: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

const DEFAULT_AMOUNTS: Record<ExtensionType, number> = {
  '1 Hafta': 750,
  '1 Ay': 2500,
  '1 Yıl': 25000,
};

function calculatePreviewDate(currentEndDate: string, extType: ExtensionType): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const baseDate = currentEndDate ? new Date(currentEndDate) : new Date();
  baseDate.setHours(0, 0, 0, 0);

  // Süresi geçmişse bugünden, değilse mevcut bitiş tarihinden uzat
  const start = baseDate.getTime() > now.getTime() ? baseDate : now;
  const next = new Date(start);

  if (extType === '1 Hafta') {
    next.setDate(next.getDate() + 7);
  } else if (extType === '1 Yıl') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    // 1 Ay
    next.setMonth(next.getMonth() + 1);
  }

  return next.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ExtendRentalDialog({
  rentalId,
  deskCode,
  studentName,
  currentEndDate,
  isOpen,
  onClose,
  onSuccess,
}: ExtendRentalDialogProps) {
  const { settings } = useSettings();

  // Ayarlar tablosundan dinamik fiyatlar (Haftalık, Aylık, Yıllık)
  const extensionPrices = useMemo<Record<ExtensionType, number>>(
    () => ({
      '1 Hafta': Number(settings.weekly_price ?? DEFAULT_AMOUNTS['1 Hafta']),
      '1 Ay': Number(settings.monthly_price ?? DEFAULT_AMOUNTS['1 Ay']),
      '1 Yıl': Number(settings.yearly_price ?? DEFAULT_AMOUNTS['1 Yıl']),
    }),
    [settings],
  );

  const [extensionType, setExtensionType] = useState<ExtensionType>('1 Ay');
  const [amount, setAmount] = useState<string>('2500');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentNote, setPaymentNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dialog açıldığında veya ayarlar güncellendiğinde varsayılan fiyatları yükle
  useEffect(() => {
    if (isOpen) {
      setExtensionType('1 Ay');
      setAmount(String(extensionPrices['1 Ay'] || '2500'));
      setPaymentStatus('paid');
      setPaymentNote('');
      setErrorMsg(null);
    }
  }, [isOpen, extensionPrices]);

  // Uzatma türü değiştiğinde ilgili paket fiyatını otomatik doldur
  const handleTypeChange = (type: ExtensionType) => {
    setExtensionType(type);
    setAmount(String(extensionPrices[type] || ''));
  };

  const currentFormatted = currentEndDate
    ? new Date(currentEndDate).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—';

  const previewDate = calculatePreviewDate(currentEndDate, extensionType);

  const durationOptions: {
    type: ExtensionType;
    title: string;
    description: string;
    price: number;
  }[] = [
    {
      type: '1 Hafta',
      title: '1 Hafta',
      description: '+7 Gün ekler',
      price: extensionPrices['1 Hafta'],
    },
    {
      type: '1 Ay',
      title: '1 Ay',
      description: '+1 Ay ekler',
      price: extensionPrices['1 Ay'],
    },
    {
      type: '1 Yıl',
      title: '1 Yıl',
      description: '+1 Yıl ekler',
      price: extensionPrices['1 Yıl'],
    },
  ];

  const handleConfirm = async () => {
    setErrorMsg(null);
    const parsedAmount = Number(amount);

    // Zorunlu alan kontrolü
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Lütfen geçerli bir alınacak ücret tutarı girin.');
      return;
    }

    setLoading(true);
    try {
      const result = await createExtension({
        rentalId,
        extensionType,
        amount: parsedAmount,
        paymentStatus,
        paymentNote: paymentNote.trim() || undefined,
      });

      toast.success('Süre başarıyla uzatıldı', {
        description: `Masa ${deskCode} (${studentName}) bitiş tarihi ${result.newEndDate} olarak güncellendi. Alınan ücret: ₺${parsedAmount.toLocaleString('tr-TR')}`,
      });

      await onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Süre uzatılamadı';
      toast.error('Hata oluştu', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-slate-200 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="bg-slate-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white">
                Süre Uzat: Masa {deskCode}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs mt-0.5">
                {studentName} · Yeni ödeme ve süre uzatma kaydı
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form İçeriği */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto touch-scroll">
          {/* Tarih Karşılaştırma Kutusu */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Mevcut Bitiş</p>
              <p className="font-bold text-slate-700 mt-0.5">{currentFormatted}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 shrink-0 mx-2" />
            <div className="text-right">
              <p className="text-[10px] font-semibold text-blue-600 uppercase">Yeni Bitiş</p>
              <p className="font-bold text-blue-700 mt-0.5">{previewDate}</p>
            </div>
          </div>

          {/* 1. Uzatma Türü */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Uzatma Türü <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {durationOptions.map((opt) => {
                const isSelected = extensionType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleTypeChange(opt.type)}
                    className={cn(
                      'p-2 sm:p-2.5 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[58px]',
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <span className="font-bold text-xs">{opt.title}</span>
                    <span
                      className={cn(
                        'text-[9px] mt-0.5',
                        isSelected ? 'text-slate-300' : 'text-slate-400',
                      )}
                    >
                      {opt.description}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold mt-1',
                        isSelected ? 'text-emerald-300' : 'text-emerald-600',
                      )}
                    >
                      {new Intl.NumberFormat('tr-TR').format(opt.price)} ₺
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Alınacak Ücret (Zorunlu) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Alınacak Ücret (₺) <span className="text-rose-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Zorunlu alan</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                ₺
              </span>
              <input
                type="number"
                min="1"
                step="50"
                placeholder="Örn: 1500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 text-sm font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 min-h-[44px]"
              />
            </div>
          </div>

          {/* 3. Ödeme Durumu */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Ödeme Durumu <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'paid', label: 'Ödendi', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                  { id: 'deposit', label: 'Kapora', color: 'border-sky-500 bg-sky-50 text-sky-800' },
                  { id: 'pending', label: 'Bekliyor', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                ] as const
              ).map((opt) => {
                const isSelected = paymentStatus === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentStatus(opt.id)}
                    className={cn(
                      'py-2 px-2 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer text-center min-h-[44px]',
                      isSelected
                        ? opt.color + ' ring-2 ring-slate-900/10 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Ödeme Notu (Opsiyonel) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Ödeme Notu <span className="text-slate-400 font-normal">(Opsiyonel)</span>
            </label>
            <input
              type="text"
              placeholder="Örn: Havale ile ödendi / Kalan 500 TL haftaya"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 min-h-[44px]"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Finansal Bilgi Notu */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-700">📌 Finansal Kayıt Bilgisi:</p>
            <p>• Bu uzatma ayrı bir finansal kayıt (`rental_extensions`) olarak kaydedilir.</p>
            <p>• İlk kiralama fiyatı (`rentals.price`) sabit korunur.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px] sm:min-h-0 text-slate-600"
          >
            Vazgeç
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
            className="bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 font-bold min-h-[44px] sm:min-h-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Kaydediliyor…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Süreyi Uzat & Kaydet</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
