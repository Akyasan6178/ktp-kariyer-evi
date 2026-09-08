'use client';

// ============================================================
// /settings – Ayarlar Merkezi (KTP-007)
// Yasin Hoca Çalışma Merkezi
// Dinamik fiyatlandırma, kütüphane ve Wi-Fi yönetimi
// ============================================================

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSettings } from '@/hooks/useSettings';
import type { SettingsUpdate } from '@/lib/types';
import {
  Settings,
  Building2,
  Phone,
  MapPin,
  Wifi,
  KeyRound,
  Eye,
  EyeOff,
  DollarSign,
  Save,
  CheckCircle2,
  QrCode,
  Sparkles,
  Info,
  RotateCcw,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, loading, isSaving, saveSettings, refreshSettings } = useSettings();

  // Form State
  const [form, setForm] = useState({
    library_name: '',
    phone: '',
    address: '',
    wifi_name: '',
    wifi_password: '',
    weekly_price: 750,
    monthly_price: 2500,
    yearly_price: 25000,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Ayarlar yüklendiğinde formu doldur
  useEffect(() => {
    if (settings) {
      setForm({
        library_name: settings.library_name || '',
        phone: settings.phone || '',
        address: settings.address || '',
        wifi_name: settings.wifi_name || '',
        wifi_password: settings.wifi_password || '',
        weekly_price: Number(settings.weekly_price || 750),
        monthly_price: Number(settings.monthly_price || 2500),
        yearly_price: Number(settings.yearly_price || 25000),
      });
      setHasChanges(false);
    }
  }, [settings]);

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      setHasChanges(true);
      return updated;
    });
  };

  const handleReset = () => {
    if (settings) {
      setForm({
        library_name: settings.library_name || '',
        phone: settings.phone || '',
        address: settings.address || '',
        wifi_name: settings.wifi_name || '',
        wifi_password: settings.wifi_password || '',
        weekly_price: Number(settings.weekly_price || 750),
        monthly_price: Number(settings.monthly_price || 2500),
        yearly_price: Number(settings.yearly_price || 25000),
      });
      setHasChanges(false);
      toast.info('Formdaki değişiklikler geri alındı.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.library_name.trim()) {
      toast.error('Kütüphane adı boş bırakılamaz');
      return;
    }

    if (form.weekly_price < 0 || form.monthly_price < 0 || form.yearly_price < 0) {
      toast.error('Fiyatlar negatif olamaz');
      return;
    }

    const payload: SettingsUpdate = {
      library_name: form.library_name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      wifi_name: form.wifi_name.trim(),
      wifi_password: form.wifi_password.trim(),
      weekly_price: Number(form.weekly_price),
      monthly_price: Number(form.monthly_price),
      yearly_price: Number(form.yearly_price),
    };

    const success = await saveSettings(payload);
    if (success) {
      setHasChanges(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />

      <main className="mx-auto max-w-screen-xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Üst Başlık */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shrink-0">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                Ayarlar Merkezi
              </h1>
              <p className="text-xs text-slate-500 sm:text-sm mt-0.5">
                Kütüphane bilgileri, Wi-Fi erişimi ve dinamik kiralama fiyatlarını tek noktadan yönetin.
              </p>
            </div>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 animate-pulse self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Kaydedilmemiş değişiklikler var</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-slate-500">Ayarlar yükleniyor...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* 1. KÜTÜPHANE VE İLETİŞİM BİLGİLERİ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-8 shadow-xs">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Kütüphane & İletişim Bilgileri</h2>
                  <p className="text-xs text-slate-500">
                    Makbuzlarda, sözleşmelerde ve arayüzde görünecek kurumsal bilgiler
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Kütüphane Adı */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Kütüphane / Kurum Adı <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-2">
                    <Building2 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={form.library_name}
                      onChange={(e) => handleChange('library_name', e.target.value)}
                      placeholder="Örn: Kariyer Evi VIP Kütüphane"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    İletişim Telefonu
                  </label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="0555 123 45 67"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Adres */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Kütüphane Adresi
                  </label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Merkez Mah. Üniversite Cad. No: 12/A"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. WI-FI & BAĞLANTI BİLGİLERİ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Wi-Fi & İnternet Erişimi</h2>
                    <p className="text-xs text-slate-500">
                      Öğrencilere verilecek kablosuz ağ bağlantı detayları
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>QR Sistemine Hazır</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Wi-Fi Adı */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Wi-Fi Ağ Adı (SSID)
                  </label>
                  <div className="relative mt-2">
                    <Wifi className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.wifi_name}
                      onChange={(e) => handleChange('wifi_name', e.target.value)}
                      placeholder="Örn: YasinHoca_Calisma"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium text-slate-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Wi-Fi Şifresi */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Wi-Fi Şifresi
                  </label>
                  <div className="relative mt-2">
                    <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.wifi_password}
                      onChange={(e) => handleChange('wifi_password', e.target.value)}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-12 text-sm font-medium text-slate-900 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. OTOMATİK FİYATLANDIRMA PAKETLERİ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Otomatik Paket Fiyatlandırması</h2>
                    <p className="text-xs text-slate-500">
                      Yeni kiralama ve süre uzatma işlemlerinde otomatik dolacak taban ücretler
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Tek Noktadan Yönetim</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Haftalık Ücret */}
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 transition hover:border-emerald-300 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Haftalık Paket
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                      7 Gün
                    </span>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                      Haftalık Ücret (₺) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        required
                        value={form.weekly_price}
                        onChange={(e) => handleChange('weekly_price', Number(e.target.value))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-base font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₺
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Yeni kiralama ve +1 Hafta uzatmalarda otomatik önerilir.
                  </p>
                </div>

                {/* Aylık Ücret */}
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 transition hover:border-emerald-300 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Aylık Paket
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      30 Gün
                    </span>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                      Aylık Ücret (₺) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={form.monthly_price}
                        onChange={(e) => handleChange('monthly_price', Number(e.target.value))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-base font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₺
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Yeni kiralama ve +1 Ay uzatmalarda varsayılan tutardır.
                  </p>
                </div>

                {/* Yıllık Ücret */}
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 transition hover:border-emerald-300 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Yıllık Paket
                    </span>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                      365 Gün
                    </span>
                  </div>
                  <div className="mt-3">
                    <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                      Yıllık Ücret (₺) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="500"
                        required
                        value={form.yearly_price}
                        onChange={(e) => handleChange('yearly_price', Number(e.target.value))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-8 text-base font-extrabold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        ₺
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Uzun dönem YKS/LGS hazırlık öğrencileri içindir.
                  </p>
                </div>
              </div>

              {/* Bilgilendirme */}
              <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    Burada belirlediğiniz fiyatlar sistemin tamamında otomatik geçerli olur. İhtiyaç halinde işlem anında manuel fiyat esnekliği korunur.
                  </span>
                </div>
              </div>
            </div>

            {/* BUTONLAR & AKSİYON BARI */}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end border-t border-slate-200 pt-6">
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 min-h-[44px] text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Değişiklikleri Sıfırla</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-8 min-h-[44px] text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 text-white" />
                    <span>Ayarları Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
