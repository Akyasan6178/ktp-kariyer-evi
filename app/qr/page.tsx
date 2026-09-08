'use client';

// ============================================================
// /qr – Masa QR Kod Yönetim Sistemi (KTP-013)
// Yasin Hoca Çalışma Merkezi - Sadece Admin Erişebilir
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
  generateAllDeskQRs,
  generateLabeledQR,
  downloadQR,
  downloadAllQRs,
  type DeskQRItem,
} from '@/lib/services/qr';
import type { DbSettings } from '@/lib/types';
import {
  QrCode,
  Wifi,
  Download,
  Printer,
  Archive,
  Search,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sparkles,
  Info,
  BookOpen,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function QrManagementPage() {
  const { isAdmin } = useAuth();

  const [qrItems, setQrItems] = useState<DeskQRItem[]>([]);
  const [settings, setSettings] = useState<DbSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadMode, setDownloadMode] = useState<'labeled' | 'qr-only'>('labeled');

  // Filtreler
  const [selectedSection, setSelectedSection] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Verileri ve QR Kodları Yükle
  const loadQRs = useCallback(async (showToast = false) => {
    try {
      setLoading(true);
      const res = await generateAllDeskQRs();
      setQrItems(res.items);
      setSettings(res.settings);
      if (showToast) {
        toast.success('50 masanın QR kodları güncellendi');
      }
    } catch (err: any) {
      console.error('[QR Page] Hata:', err);
      toast.error('QR kodlar oluşturulamadı: ' + (err?.message || 'Hata'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQRs();
  }, [loadQRs]);

  // Filtrelenmiş Masalar
  const filteredItems = useMemo(() => {
    return qrItems.filter((item) => {
      const matchesSection = selectedSection === 'all' || item.section === selectedSection;
      const matchesSearch =
        searchQuery === '' ||
        item.deskCode.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesSection && matchesSearch;
    });
  }, [qrItems, selectedSection, searchQuery]);

  // Toplu ZIP İndirme
  const handleDownloadAllZip = async () => {
    if (!qrItems.length) return;
    setIsZipping(true);
    try {
      toast.info(`50 masanın ${downloadMode === 'labeled' ? 'etiketli QR kodları' : 'QR kodları'} ZIP olarak paketleniyor...`);
      await downloadAllQRs(qrItems, downloadMode, 'Kariyer Evi VIP Kütüphane');
      toast.success('50 masa QR kodu tek ZIP dosyası olarak başarıyla indirildi!');
    } catch (err: any) {
      console.error('ZIP indirme hatası:', err);
      toast.error('ZIP oluşturulurken hata oluştu: ' + (err?.message || 'Hata'));
    } finally {
      setIsZipping(false);
    }
  };

  // Tekli QR İndirme (Seçilen formata göre)
  const handleDownloadSingle = async (item: DeskQRItem) => {
    if (downloadMode === 'labeled') {
      try {
        const labeledUrl = await generateLabeledQR(item, 'Kariyer Evi VIP Kütüphane');
        downloadQR(`Masa_${item.deskCode}_Etiket.png`, labeledUrl);
        toast.success(`Masa ${item.deskCode} etiketli QR indirildi`);
      } catch (err) {
        console.error(err);
        toast.error('Etiket görseli oluşturulamadı');
      }
    } else {
      downloadQR(`Masa_${item.deskCode}_QR.png`, item.dataUrl);
      toast.success(`Masa ${item.deskCode} QR kodu indirildi`);
    }
  };

  // Yazdırma Modu (A4 Çıktı)
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Ekran Görünümünde Navbar (Yazdırmada Gizli) */}
      <div className="print:hidden">
        <Navbar onRefresh={() => loadQRs(true)} />
      </div>

      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* ============================================================ */}
        {/* 1. ÜST BAŞLIK & AKSİYON BARI (Yazdırmada Gizli)               */}
        {/* ============================================================ */}
        <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
              <QrCode className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Masa QR Kod Yönetim Sistemi
                </h1>
              </div>
              <p className="text-xs text-slate-500 sm:text-sm mt-0.5">
                Kütüphanedeki 50 masa için doğrudan Wi-Fi bağlantısı sağlayan özel QR kodlar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Format Seçici: Etiketli QR vs Sadece QR */}
            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setDownloadMode('labeled')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                  downloadMode === 'labeled'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <Tag className="h-3.5 w-3.5 text-emerald-600" />
                <span>Etiketli QR</span>
              </button>
              <button
                type="button"
                onClick={() => setDownloadMode('qr-only')}
                className={cn(
                  'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                  downloadMode === 'qr-only'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                <QrCode className="h-3.5 w-3.5 text-slate-700" />
                <span>Sadece QR</span>
              </button>
            </div>

            <button
              onClick={() => loadQRs(true)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              title="Yenile"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin text-emerald-600')} />
              <span>Yenile</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Printer className="h-4 w-4 text-blue-600" />
              <span>Yazdır (A4 Çıktı)</span>
            </button>

            <button
              onClick={handleDownloadAllZip}
              disabled={loading || isZipping}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {isZipping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>ZIP Hazırlanıyor...</span>
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 text-emerald-200" />
                  <span>Tümünü İndir (ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. WI-FI VE SİSTEM BİLGİLENDİRME KUTUSU (Yazdırmada Gizli)   */}
        {/* ============================================================ */}
        <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ayarlar Tablosundan Okunan Wi-Fi Parametreleri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Öğrenciler telefon kameralarıyla masadaki QR kodu okuttuklarında bu ağa anında şifresiz bağlanırlar.
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono font-bold text-slate-700">
                    Ağ (SSID): {settings?.wifi_name || 'YasinHoca_Calisma'}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-slate-600">
                    Şifre: {settings?.wifi_password ? '••••••••' : 'Tanımsız'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. FİLTRE VE ARAMA ÇUBUĞU (Yazdırmada Gizli)                 */}
        {/* ============================================================ */}
        <div className="print:hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Bölge Butonları */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl w-fit">
            {(
              [
                { key: 'all', label: 'Tümü (50)' },
                { key: 'A', label: 'A Bölgesi (12)' },
                { key: 'B', label: 'B Bölgesi (22)' },
                { key: 'C', label: 'C Bölgesi (16)' },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedSection(key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                  selectedSection === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Arama Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Masa kodu ara (A1, B14, C7...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Yükleniyor Durumu */}
        {loading ? (
          <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-slate-500">
                50 masanın yüksek çözünürlüklü QR kodları üretiliyor...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* 4. EKRAN GÖRÜNÜMÜ: 50 MASA QR KARTLARI (Yazdırmada Gizli)     */}
            {/* ============================================================ */}
            <div className="print:hidden grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filteredItems.map((item) => (
                <div
                  key={item.deskCode}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
                >
                  {/* Kart Başlığı */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-base font-extrabold text-slate-900">
                      Masa {item.deskCode}
                    </span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-bold',
                        item.section === 'A'
                          ? 'bg-blue-100 text-blue-700'
                          : item.section === 'B'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700',
                      )}
                    >
                      {item.section} Bölgesi
                    </span>
                  </div>

                  {/* QR Kod Görseli */}
                  <div className="my-3 flex flex-col items-center justify-center">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-2 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.dataUrl}
                        alt={`Masa ${item.deskCode} QR Kodu`}
                        className="h-32 w-32 object-contain"
                      />
                    </div>
                  </div>

                  {/* Wi-Fi İpucu & İndirme Butonu */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="text-center text-[10px] text-slate-500 leading-tight">
                      Wi-Fi: <span className="font-semibold text-slate-700">{item.wifiName}</span>
                    </div>

                    <button
                      onClick={() => handleDownloadSingle(item)}
                      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-500" />
                      <span>{downloadMode === 'labeled' ? 'Etiket İndir' : 'QR İndir'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ============================================================ */}
            {/* 5. YAZDIRMA DÜZENİ (Sadece Yazıcı / Print Diyaloğunda Aktif)  */}
            {/* A4 Kağıdına Kesilmeye Hazır 50 Sticker Kartı                  */}
            {/* ============================================================ */}
            <div className="hidden print:block space-y-4">
              <div className="text-center pb-4 border-b border-slate-300">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  Kariyer Evi VIP Kütüphane
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Masa Wi-Fi Bağlantı QR Kodları &bull; Masalara Yapıştırmak İçin Kesim Çizgileriyle
                </p>
              </div>

              {/* A4 Izgara: Sayfa başına 3 sütunlu kartlar */}
              <div className="grid grid-cols-3 gap-6">
                {qrItems.map((item) => (
                  <div
                    key={'print-' + item.deskCode}
                    className="border-2 border-dashed border-slate-400 p-4 rounded-xl flex flex-col items-center justify-center text-center page-break-inside-avoid break-inside-avoid bg-white"
                    style={{ pageBreakInside: 'avoid' }}
                  >
                    {/* Kurum Başlığı */}
                    <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-slate-600 mb-1">
                      <BookOpen className="h-3 w-3" />
                      <span>Kariyer Evi VIP Kütüphane</span>
                    </div>

                    {/* Masa Numarası */}
                    <div className="text-xl font-black tracking-tight text-slate-950 mb-1.5">
                      MASA {item.deskCode}
                    </div>

                    {/* QR Kod */}
                    <div className="p-1 border border-slate-300 rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.dataUrl}
                        alt={`Masa ${item.deskCode}`}
                        className="h-36 w-36 object-contain"
                      />
                    </div>

                    {/* Talimatlar */}
                    <div className="mt-2 text-[10px] font-extrabold text-slate-900">
                      Wi-Fi: {item.wifiName}
                    </div>
                    <div className="text-[8px] text-slate-500 mt-0.5 font-medium leading-tight">
                      Kameranızla okutarak Wi-Fi ağına anında bağlanın
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
