'use client';

// ============================================================
// Masa Kiralama Dialogu (Create Rental Modal)
// Yönetici boş bir masaya öğrenci ekleyip kiralama başlatır.
// Servis katmanı: students.service, rentals.service, desks.service
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
import { createStudent } from '@/lib/services/students';
import { createRental } from '@/lib/services/rentals';
import { useSettings } from '@/hooks/useSettings';
import { getTodayString, calculateEndDate } from '@/lib/utils/format';
import type { DeskWithRental, PackageType, PaymentStatus } from '@/lib/types';

import {
  User,
  Phone,
  Calendar,
  CreditCard,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface CreateRentalDialogProps {
  desk: DeskWithRental | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

interface FormState {
  fullName: string;
  phone: string;
  groupType: 'YKS' | 'LGS';
  parentName: string;
  parentPhone: string;
  packageType: PackageType;
  startDate: string;
  endDate: string;
  price: string;
  paymentStatus: PaymentStatus;
  paymentNote: string;
}


const DEFAULT_PRICES: Record<PackageType, string> = {
  weekly: '750',
  monthly: '2500',
  yearly: '25000',
};

export function CreateRentalDialog({
  desk,
  isOpen,
  onClose,
  onSuccess,
}: CreateRentalDialogProps) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ayarlar tablosundan gelen dinamik fiyatlar (fallback DEFAULT_PRICES)
  const packagePrices = useMemo<Record<PackageType, string>>(
    () => ({
      weekly: String(settings.weekly_price ?? DEFAULT_PRICES.weekly),
      monthly: String(settings.monthly_price ?? DEFAULT_PRICES.monthly),
      yearly: String(settings.yearly_price ?? DEFAULT_PRICES.yearly),
    }),
    [settings],
  );

  const [form, setForm] = useState<FormState>({
    fullName: '',
    phone: '',
    groupType: 'YKS',
    parentName: '',
    parentPhone: '',
    packageType: 'monthly',
    startDate: getTodayString(),
    endDate: calculateEndDate(getTodayString(), 'monthly'),
    price: packagePrices.monthly,
    paymentStatus: 'paid',
    paymentNote: '',
  });

  // Dialog her açıldığında formu sıfırla ve güncel fiyatları doldur
  useEffect(() => {
    if (isOpen) {
      const today = getTodayString();
      setForm({
        fullName: '',
        phone: '',
        groupType: 'YKS',
        parentName: '',
        parentPhone: '',
        packageType: 'monthly',
        startDate: today,
        endDate: calculateEndDate(today, 'monthly'),
        price: packagePrices.monthly,
        paymentStatus: 'paid',
        paymentNote: '',
      });
      setErrors({});
    }
  }, [isOpen, packagePrices]);

  const handlePackageChange = (pkg: PackageType) => {
    setForm((prev) => ({
      ...prev,
      packageType: pkg,
      endDate: calculateEndDate(prev.startDate, pkg),
      price: packagePrices[pkg],
    }));
  };

  const handleStartDateChange = (startDate: string) => {
    setForm((prev) => ({
      ...prev,
      startDate,
      endDate: calculateEndDate(startDate, prev.packageType),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Öğrenci Ad Soyad zorunludur.';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Öğrenci Telefonu zorunludur.';
    }
    if (!form.groupType) {
      newErrors.groupType = 'Grup seçimi zorunludur.';
    }
    if (!form.packageType) {
      newErrors.packageType = 'Paket türü zorunludur.';
    }
    if (!form.startDate) {
      newErrors.startDate = 'Başlangıç tarihi zorunludur.';
    }
    if (!form.endDate) {
      newErrors.endDate = 'Bitiş tarihi zorunludur.';
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      newErrors.price = 'Geçerli bir ücret giriniz.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desk) return;

    if (desk.status === 'closed') {
      toast.error('Kapalı koltuğa kiralama yapılamaz.');
      return;
    }

    if (!validate()) {
      toast.error('Lütfen zorunlu alanları eksiksiz doldurunuz.');
      return;
    }

    setLoading(true);

    try {
      // 1. Adım: students tablosuna yeni öğrenci oluştur
      const newStudent = await createStudent({
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        group_type: form.groupType,
        parent_name: form.parentName.trim() || '',
        parent_phone: form.parentPhone.trim() || '',
        notes: null,
      });

      // 2. Adım: rentals tablosuna yeni kiralama kaydı oluştur
      // createRental servisi masanın status alanını da 'occupied' olarak günceller.
      await createRental({
        student_id: newStudent.id,
        desk_id: desk.id,
        package_type: form.packageType,
        start_date: form.startDate,
        end_date: form.endDate,
        price: Number(form.price) || 0,
        payment_status: form.paymentStatus,
        payment_note: form.paymentNote.trim() || null,
      });

      toast.success('Masa başarıyla kiralandı!', {
        description: `Masa ${desk.code} (${desk.section} Bölgesi) - ${form.fullName}`,
      });

      // 3. Adım: Ekranı ve haritayı yenile
      await onSuccess();
      onClose();
    } catch (err) {
      console.error('[CreateRentalDialog] Hata:', err);
      const msg = err instanceof Error ? err.message : 'Kiralama oluşturulurken beklenmedik bir hata oluştu.';
      toast.error('Kiralama İşlemi Başarısız', {
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-slate-200 shadow-2xl rounded-2xl">
        {/* Header Alanı */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 sm:p-6 text-white border-b border-slate-800">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                    Masa {desk?.code} Kiralama
                  </DialogTitle>
                  <DialogDescription className="text-slate-300 text-xs mt-0.5">
                    {desk?.section} Bölgesi · Yeni öğrenci kaydı ve masa tahsisi
                  </DialogDescription>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                {desk?.status === 'closed' ? 'Kapalı' : 'Boş'}
              </span>
            </div>
          </DialogHeader>
        </div>

        {/* Kapalı Masa Uyarısı */}
        {desk?.status === 'closed' && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Bu masa kullanıma kapatılmıştır. Kapalı masaya kiralama yapılamaz.</span>
          </div>
        )}

        {/* Form Alanı */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white">
          {/* ================= 1. ÖĞRENCİ BİLGİLERİ ================= */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Öğrenci Bilgileri
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Ad Soyad */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Öğrenci Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-[11px] text-red-500">{errors.fullName}</p>
                )}
              </div>

              {/* Telefon */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="Örn: 0507 036 78 61"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
                {errors.phone && (
                  <p className="text-[11px] text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Grup */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Grup Türü <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['YKS', 'LGS'] as const).map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setForm({ ...form, groupType: group })}
                      disabled={loading}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold border transition-all min-h-[44px] ${
                        form.groupType === group
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {form.groupType === group && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= 2. VELİ BİLGİLERİ ================= */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="h-4 w-4 text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Veli Bilgileri (İsteğe Bağlı)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Veli Ad Soyad</label>
                <input
                  type="text"
                  placeholder="Örn: Mehmet Yılmaz"
                  value={form.parentName}
                  onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Veli Telefonu</label>
                <input
                  type="tel"
                  placeholder="Örn: 0507 036 78 61"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ================= 3. KİRALAMA & PAKET ================= */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Kiralama Detayları
              </h4>
            </div>

            {/* Paket Türü Seçimi */}
            <div className="space-y-1 mb-3.5">
              <label className="text-xs font-semibold text-slate-700">
                Paket Türü <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'weekly', label: 'Haftalık' },
                    { key: 'monthly', label: 'Aylık' },
                    { key: 'yearly', label: 'Yıllık' },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePackageChange(key)}
                    disabled={loading}
                    className={`py-2 px-2 sm:px-3 rounded-lg text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center min-h-[50px] ${
                      form.packageType === key
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="text-[10px] font-normal opacity-75 mt-0.5">
                      {new Intl.NumberFormat('tr-TR').format(Number(packagePrices[key]))} ₺
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Başlangıç ve Bitiş Tarihleri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Başlangıç Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    errors.startDate
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
                {errors.startDate && (
                  <p className="text-[11px] text-red-500">{errors.startDate}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Bitiş Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  disabled={loading}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 ${
                    errors.endDate
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-[11px] text-red-500">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* ================= 4. ÖDEME BİLGİLERİ ================= */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ücret & Ödeme
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Ücret */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Kiralama Ücreti (₺) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium text-sm">₺</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    placeholder="2500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    disabled={loading}
                    className={`w-full pl-8 pr-3.5 py-2.5 text-sm rounded-lg border font-semibold transition-all focus:outline-none focus:ring-2 ${
                      errors.price
                        ? 'border-red-400 focus:ring-red-200 bg-red-50/30'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100 text-slate-800'
                    }`}
                  />
                </div>
                {errors.price && (
                  <p className="text-[11px] text-red-500">{errors.price}</p>
                )}
              </div>

              {/* Ödeme Durumu */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Ödeme Durumu
                </label>
                <select
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as PaymentStatus })}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all focus:outline-none min-h-[42px]"
                >
                  <option value="paid">Ödendi</option>
                  <option value="deposit">Kapora</option>
                  <option value="pending">Bekliyor</option>
                </select>
              </div>

              {/* Ödeme Notu */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Ödeme Notu (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Nakit ödendi, makbuz no: 4021"
                  value={form.paymentNote}
                  onChange={(e) => setForm({ ...form, paymentNote: e.target.value })}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* ================= BUTONLAR ================= */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto px-5 min-h-[44px] text-slate-600 border-slate-300 hover:bg-slate-50"
            >
              İptal
            </Button>
            <button
              type="submit"
              disabled={loading || desk?.status === 'closed'}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Kaydediliyor…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Kiralamayı Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
