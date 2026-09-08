'use client';

// ============================================================
// /backup – Otomatik Yedekleme ve Kurtarma Merkezi (KTP-011)
// Yasin Hoca Çalışma Merkezi - Sadece Admin Erişebilir
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAllBackupData,
  generateJSONBackup,
  generateCSVBackup,
  generateExcelBackup,
  triggerDownload,
  logBackup,
  getBackupLogs,
} from '@/lib/services/backup';
import type { FullBackupPayload, DbBackupLog, BackupFileType } from '@/lib/types';
import {
  Database,
  FileJson,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  Calendar,
  Settings,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Sparkles,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function BackupPage() {
  const { user, profile, isAdmin } = useAuth();

  const [backupPayload, setBackupPayload] = useState<FullBackupPayload | null>(null);
  const [logs, setLogs] = useState<DbBackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<BackupFileType | null>(null);

  const adminName =
    profile?.full_name ||
    profile?.email?.split('@')[0] ||
    user?.email?.split('@')[0] ||
    'Kariyer Evi (Admin)';

  // Veritabanı ve Logları Yükle
  const loadData = useCallback(async (showToast = false) => {
    try {
      const [payload, logList] = await Promise.all([
        fetchAllBackupData(adminName),
        getBackupLogs(),
      ]);
      setBackupPayload(payload);
      setLogs(logList);
      if (showToast) {
        toast.success('Yedekleme verileri güncellendi');
      }
    } catch (err: any) {
      console.error('[BackupPage] Yükleme hatası:', err);
      toast.error('Veriler alınamadı: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  }, [adminName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manuel Dışa Aktar (Format Bazlı)
  const handleExport = async (type: BackupFileType) => {
    if (!backupPayload) return;

    setIsExporting(type);
    try {
      let filename = '';
      let recordCount = backupPayload.counts.total;
      let sizeStr = '0 KB';

      if (type === 'json') {
        const res = generateJSONBackup(backupPayload);
        filename = res.filename;
        sizeStr = res.sizeStr;
        triggerDownload(res.blob, filename);
      } else if (type === 'csv') {
        const res = generateCSVBackup(backupPayload);
        filename = res.filename;
        sizeStr = res.sizeStr;
        triggerDownload(res.blob, filename);
      } else if (type === 'excel') {
        const res = generateExcelBackup(backupPayload);
        filename = res.filename;
        sizeStr = res.sizeStr;
        triggerDownload(res.blob, filename);
      }

      // Veritabanına Log Kaydı Düş
      const savedLog = await logBackup({
        file_type: type,
        file_size: sizeStr,
        record_count: recordCount,
        status: 'success',
        created_by: adminName,
      });

      setLogs((prev) => [savedLog, ...prev]);

      toast.success(`${type.toUpperCase()} yedeği indirildi`, {
        description: `${filename} (${sizeStr}) başarıyla kaydedildi.`,
      });
    } catch (err: any) {
      console.error('[BackupPage] Yedekleme hatası:', err);
      toast.error('Yedek alınamadı: ' + (err?.message || 'Bilinmeyen hata'));

      await logBackup({
        file_type: type,
        file_size: '0 KB',
        record_count: 0,
        status: 'failed',
        created_by: adminName,
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onRefresh={() => loadData(true)} />

      <main className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {/* ============================================================ */}
        {/* 1. ÜST HEADER & DURUM BİLGİSİ                                 */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md shrink-0">
              <Database className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                  Otomatik Yedekleme Sistemi
                </h1>
              </div>
              <p className="text-xs text-slate-500 sm:text-sm mt-0.5">
                Kritik tabloları (öğrenciler, kiralamalar, uzatmalar, masalar, ayarlar, profiller) tek tıkla yedekleyin.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 min-h-[42px] sm:min-h-0"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Yükleniyor Durumu */}
        {loading ? (
          <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm font-medium text-slate-500">Veritabanı tabloları taranıyor...</p>
            </div>
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* 2. VERİTABANI ÖZETİ – 6 TABLO METRİK KARTLARI                */}
            {/* ============================================================ */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Veritabanı Tablo Özeti</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tam yedekleme sırasında arşivlenecek aktif kayıt sayıları
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white self-start sm:self-auto">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Toplam {backupPayload?.counts.total || 0} Aktif Kayıt</span>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 grid grid-cols-2 gap-2.5 sm:gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
                {/* Öğrenciler */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 sm:p-3.5">
                  <div className="flex items-center justify-between text-blue-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">Öğrenciler</span>
                    <Users className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-extrabold text-slate-900">
                    {backupPayload?.counts.students || 0}
                  </div>
                  <div className="mt-0.5 sm:mt-1 text-[10px] text-blue-600 font-medium truncate">students tablosu</div>
                </div>

                {/* Kiralamalar */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 sm:p-3.5">
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">Kiralamalar</span>
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-extrabold text-slate-900">
                    {backupPayload?.counts.rentals || 0}
                  </div>
                  <div className="mt-0.5 sm:mt-1 text-[10px] text-emerald-600 font-medium truncate">rentals tablosu</div>
                </div>

                {/* Süre Uzatmaları */}
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3 sm:p-3.5">
                  <div className="flex items-center justify-between text-purple-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">Uzatmalar</span>
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-extrabold text-slate-900">
                    {backupPayload?.counts.rental_extensions || 0}
                  </div>
                  <div className="mt-0.5 sm:mt-1 text-[10px] text-purple-600 font-medium truncate">rental_extensions</div>
                </div>

                {/* Masalar */}
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3 sm:p-3.5">
                  <div className="flex items-center justify-between text-teal-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">Masalar</span>
                    <Layers className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-extrabold text-slate-900">
                    {backupPayload?.counts.desks || 0}
                  </div>
                  <div className="mt-0.5 sm:mt-1 text-[10px] text-teal-600 font-medium truncate">desks (A, B, C)</div>
                </div>

                {/* Ayarlar */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 sm:p-3.5">
                  <div className="flex items-center justify-between text-indigo-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">Ayarlar</span>
                    <Settings className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-extrabold text-slate-900">
                    {backupPayload?.counts.settings || 0}
                  </div>
                  <div className="mt-0.5 sm:mt-1 text-[10px] text-indigo-600 font-medium truncate">settings (Fiyat/Wi-Fi)</div>
                </div>

                {/* Profiller */}
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 sm:p-3.5">
                  <div className="flex items-center justify-between text-amber-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">Kullanıcılar</span>
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  </div>
                  <div className="mt-1 sm:mt-2 text-lg sm:text-xl font-extrabold text-slate-900">
                    {backupPayload?.counts.profiles || 0}
                  </div>
                  <div className="mt-0.5 sm:mt-1 text-[10px] text-amber-600 font-medium truncate">profiles (Admin/Staff)</div>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3. YEDEKLEME FORMATLARI                                      */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              {/* JSON Formatı */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs transition hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <FileJson className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                      ÖNERİLEN
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">JSON Formatı</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Tüm tabloların ham verilerini ve ilişkilerini eksiksiz içeren yapılandırılmış yedek dosyası.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleExport('json')}
                    disabled={isExporting !== null}
                    className="flex min-h-[44px] sm:h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                  >
                    {isExporting === 'json' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Download className="h-4 w-4 text-slate-300" />
                    )}
                    <span>JSON Olarak İndir</span>
                  </button>
                </div>
              </div>

              {/* Excel Formatı */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs transition hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                      OFİS UYUMLU
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">Excel Formatı (.xls)</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Öğrenciler, Kiralamalar, Uzatmalar ve Masaları ayrı sekmelerde düzenleyen zengin elektronik tablo.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleExport('excel')}
                    disabled={isExporting !== null}
                    className="flex min-h-[44px] sm:h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                  >
                    {isExporting === 'excel' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Download className="h-4 w-4 text-slate-300" />
                    )}
                    <span>Excel Olarak İndir</span>
                  </button>
                </div>
              </div>

              {/* CSV Formatı */}
              <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs transition hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                      EVRENSEL
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900">CSV Formatı</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Türkçe karakterler için UTF-8 BOM ve noktalı virgül (;) ayırıcı içeren standart metin dökümü.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting !== null}
                    className="flex min-h-[44px] sm:h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                  >
                    {isExporting === 'csv' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Download className="h-4 w-4 text-slate-300" />
                    )}
                    <span>CSV Olarak İndir</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 5. YEDEK GEÇMİŞİ (backup_logs)                               */}
            {/* ============================================================ */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900">Yedekleme Geçmişi</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Oluşturulan tüm yedeklerin kayıt kütüğü
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Toplam {logs.length} İşlem
                </span>
              </div>

              {/* MOBİL GÖRÜNÜM: KART LİSTESİ (< md) */}
              <div className="block md:hidden divide-y divide-slate-100 p-2 sm:p-4">
                {logs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Henüz kayıtlı bir yedekleme geçmişi bulunmamaktadır.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {log.file_type === 'json' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              JSON
                            </span>
                          ) : log.file_type === 'excel' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                              EXCEL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800">
                              CSV
                            </span>
                          )}
                          <span className="font-bold text-xs text-slate-900">{log.file_size}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Başarılı
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {new Date(log.created_at).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>{log.record_count} kayıt</span>
                      </div>

                      <div className="pt-1 flex items-center justify-between border-t border-slate-50">
                        <span className="text-[10px] text-slate-400">Yedekleyen: {log.created_by}</span>
                        <button
                          onClick={() => handleExport(log.file_type)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 active:scale-95"
                        >
                          <Download className="h-3 w-3 text-slate-500" />
                          <span>İndir</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* MASAÜSTÜ GÖRÜNÜM: TABLO (>= md) */}
              <div className="hidden md:block overflow-x-auto touch-scroll">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3.5">Oluşturulma Tarihi</th>
                      <th className="px-6 py-3.5">Format</th>
                      <th className="px-6 py-3.5">Dosya Boyutu</th>
                      <th className="px-6 py-3.5">Kayıt Sayısı</th>
                      <th className="px-6 py-3.5">Yedekleyen</th>
                      <th className="px-6 py-3.5">Durum</th>
                      <th className="px-6 py-3.5 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                          Henüz kayıtlı bir yedekleme geçmişi bulunmamaktadır.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="transition hover:bg-slate-50/80">
                          {/* Tarih */}
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-700">
                            {new Date(log.created_at).toLocaleString('tr-TR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          {/* Format */}
                          <td className="whitespace-nowrap px-6 py-4">
                            {log.file_type === 'json' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                JSON
                              </span>
                            ) : log.file_type === 'excel' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                EXCEL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                                CSV
                              </span>
                            )}
                          </td>

                          {/* Boyut */}
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-900">
                            {log.file_size}
                          </td>

                          {/* Kayıt Sayısı */}
                          <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                            {log.record_count} kayıt
                          </td>

                          {/* Yedekleyen */}
                          <td className="whitespace-nowrap px-6 py-4 text-slate-700 font-medium">
                            {log.created_by}
                          </td>

                          {/* Durum */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Başarılı
                            </span>
                          </td>

                          {/* İndir Butonu */}
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <button
                              onClick={() => handleExport(log.file_type)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                            >
                              <Download className="h-3 w-3 text-slate-500" />
                              <span>Tekrar İndir</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
