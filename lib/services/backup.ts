// ============================================================
// Yedekleme Servis Katmanı
// lib/services/backup.ts
// Yasin Hoca Çalışma Merkezi - Otomatik Yedekleme (KTP-011)
// ============================================================

import { supabase } from '@/lib/supabase';
import type { FullBackupPayload, DbBackupLog, BackupFileType } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Dosya boyutunu insan tarafından okunabilir string formatına dönüştürür.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Tüm kritik veritabanı tablolarını Supabase'den eşzamanlı çeker:
 * students, rentals, rental_extensions, desks, settings, profiles
 */
export async function fetchAllBackupData(createdBy = 'Kariyer Evi (Admin)'): Promise<FullBackupPayload> {
  const timestamp = new Date().toISOString();

  // 1. students
  let students: any[] = [];
  try {
    const { data } = await db.from('students').select('*').order('created_at', { ascending: false });
    if (data) students = data;
  } catch (err) {
    console.warn('[backup.service] students okunamadı:', err);
  }

  // 2. rentals
  let rentals: any[] = [];
  try {
    const { data } = await db.from('rentals').select('*').order('created_at', { ascending: false });
    if (data) rentals = data;
  } catch (err) {
    console.warn('[backup.service] rentals okunamadı:', err);
  }

  // 3. rental_extensions
  let rental_extensions: any[] = [];
  try {
    const { data } = await db.from('rental_extensions').select('*').order('created_at', { ascending: false });
    if (data) rental_extensions = data;
  } catch (err) {
    console.warn('[backup.service] rental_extensions okunamadı:', err);
  }

  // 4. desks
  let desks: any[] = [];
  try {
    const { data } = await db.from('desks').select('*').order('code', { ascending: true });
    if (data) desks = data;
  } catch (err) {
    console.warn('[backup.service] desks okunamadı:', err);
  }

  // 5. settings
  let settings: any[] = [];
  try {
    const { data } = await db.from('settings').select('*');
    if (data) settings = data;
  } catch (err) {
    console.warn('[backup.service] settings okunamadı:', err);
  }

  // 6. profiles
  let profiles: any[] = [];
  try {
    const { data } = await db.from('profiles').select('id, email, full_name, role, created_at');
    if (data) profiles = data;
  } catch (err) {
    console.warn('[backup.service] profiles okunamadı:', err);
  }

  const total =
    students.length +
    rentals.length +
    rental_extensions.length +
    desks.length +
    settings.length +
    profiles.length;

  return {
    version: '1.0.0',
    timestamp,
    created_by: createdBy,
    counts: {
      students: students.length,
      rentals: rentals.length,
      rental_extensions: rental_extensions.length,
      desks: desks.length,
      settings: settings.length,
      profiles: profiles.length,
      total,
    },
    tables: {
      students,
      rentals,
      rental_extensions,
      desks,
      settings,
      profiles,
    },
  };
}

/**
 * 1. JSON Formatında Yedek Oluşturur
 */
export function generateJSONBackup(payload: FullBackupPayload) {
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Yasin_Hoca_Kutuphane_Tam_Yedek_${dateStr}.json`;
  const sizeStr = formatBytes(blob.size);

  return { blob, filename, sizeStr };
}

/**
 * 2. CSV Formatında Çoklu Tablo Dökümü Oluşturur (Excel ve Türkçe Karakter Uyumlu UTF-8 BOM)
 */
export function generateCSVBackup(payload: FullBackupPayload) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Kariyer_Evi_Kutuphane_Veri_Dokumu_${dateStr}.csv`;

  let csvContent = `KARIYER EVI VIP KUTUPHANE - SISTEM VERI YEDEGI\r\n`;
  csvContent += `Tarih:;${new Date().toLocaleString('tr-TR')}\r\n`;
  csvContent += `Yedekleyen:;${payload.created_by}\r\n`;
  csvContent += `Toplam Kayit:;${payload.counts.total}\r\n\r\n`;

  // Tablo yardımcı dönüştürücüsü
  const appendTable = (title: string, data: any[]) => {
    csvContent += `=== ${title.toUpperCase()} (Toplam: ${data.length}) ===\r\n`;
    if (!data.length) {
      csvContent += `Kayit bulunamadi.\r\n\r\n`;
      return;
    }
    const keys = Object.keys(data[0]);
    csvContent += keys.join(';') + '\r\n';
    for (const row of data) {
      const line = keys
        .map((k) => {
          const val = row[k] === null || row[k] === undefined ? '' : String(row[k]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(';');
      csvContent += line + '\r\n';
    }
    csvContent += '\r\n';
  };

  appendTable('Öğrenciler (students)', payload.tables.students);
  appendTable('Kiralamalar (rentals)', payload.tables.rentals);
  appendTable('Süre Uzatmaları (rental_extensions)', payload.tables.rental_extensions);
  appendTable('Masalar (desks)', payload.tables.desks);
  appendTable('Ayarlar (settings)', payload.tables.settings);
  appendTable('Kullanıcı Profilleri (profiles)', payload.tables.profiles);

  // UTF-8 BOM ekle
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const sizeStr = formatBytes(blob.size);

  return { blob, filename, sizeStr };
}

/**
 * 3. Excel XML Çoklu Sayfa (Worksheet) Formatında Yedek Oluşturur
 * Excel tarafından yerel olarak açılan çok sekmeli XML formatı.
 */
export function generateExcelBackup(payload: FullBackupPayload) {
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Kariyer_Evi_Kutuphane_Yedek_${dateStr}.xls`;

  const generateSheet = (name: string, data: any[]) => {
    let rowsHtml = '';
    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      rowsHtml += `<tr>${keys.map((k) => `<th style="background-color:#1e293b;color:#ffffff;font-weight:bold;padding:6px;border:1px solid #cbd5e1;">${k}</th>`).join('')}</tr>`;
      for (const row of data) {
        rowsHtml += `<tr>${keys
          .map((k) => {
            const val = row[k] === null || row[k] === undefined ? '' : String(row[k]);
            return `<td style="padding:5px;border:1px solid #e2e8f0;mso-number-format:'\\@';">${val}</td>`;
          })
          .join('')}</tr>`;
      }
    } else {
      rowsHtml = `<tr><td style="padding:10px;color:#64748b;">Bu tabloda henüz veri bulunmuyor.</td></tr>`;
    }

    return `
      <div style="margin-bottom:30px;">
        <h3 style="color:#0f172a;font-family:Arial;margin-bottom:8px;">${name} (Toplam: ${data.length})</h3>
        <table border="1" style="border-collapse:collapse;font-family:Arial;font-size:12px;width:100%;">
          ${rowsHtml}
        </table>
      </div>
    `;
  };

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Tum Tablolar</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body style="font-family:Arial;padding:20px;">
        <div style="margin-bottom:20px;">
          <h1 style="color:#047857;margin:0;">KARIYER EVI VIP KUTUPHANE</h1>
          <p style="color:#475569;margin:4px 0 0 0;font-size:13px;">Sistem Tam Veritabani Yedegi &bull; Tarih: ${new Date().toLocaleString('tr-TR')}</p>
        </div>
        ${generateSheet('Ogrenciler (students)', payload.tables.students)}
        ${generateSheet('Kiralamalar (rentals)', payload.tables.rentals)}
        ${generateSheet('Sure Uzatmalari (rental_extensions)', payload.tables.rental_extensions)}
        ${generateSheet('Masalar (desks)', payload.tables.desks)}
        ${generateSheet('Ayarlar (settings)', payload.tables.settings)}
        ${generateSheet('Kullanici Profilleri (profiles)', payload.tables.profiles)}
      </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + htmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const sizeStr = formatBytes(blob.size);

  return { blob, filename, sizeStr };
}

/**
 * Tarayıcıda dosya indirmesini başlatır.
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * backup_logs tablosuna yeni yedekleme logu ekler.
 */
export async function logBackup(entry: {
  file_type: BackupFileType;
  file_size: string;
  created_by: string;
  status?: 'success' | 'failed';
  record_count: number;
}): Promise<DbBackupLog> {
  const logEntry = {
    file_type: entry.file_type,
    file_size: entry.file_size,
    created_by: entry.created_by || 'Admin',
    status: entry.status || 'success',
    record_count: entry.record_count || 0,
  };

  try {
    const { data, error } = await db
      .from('backup_logs')
      .insert(logEntry)
      .select()
      .single();

    if (!error && data) {
      return data as DbBackupLog;
    }
  } catch (err) {
    console.warn('[backup.service] backup_logs tablosuna yazılamadı:', err);
  }

  // Fallback log objesi
  return {
    id: 'local-' + Date.now(),
    created_at: new Date().toISOString(),
    ...logEntry,
  };
}

/**
 * Geçmiş yedekleme loglarını çeker.
 */
export async function getBackupLogs(): Promise<DbBackupLog[]> {
  try {
    const { data, error } = await db
      .from('backup_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      return data as DbBackupLog[];
    }
  } catch (err) {
    console.warn('[backup.service] backup_logs okunamadı:', err);
  }

  return [];
}

/**
 * Otomatik / Manuel günlük yedekleme tetikleyicisi.
 */
export async function runDailyBackup(createdBy = 'Sistem (Otomatik Günlük)'): Promise<{
  payload: FullBackupPayload;
  jsonLog: DbBackupLog;
}> {
  const payload = await fetchAllBackupData(createdBy);
  const { sizeStr } = generateJSONBackup(payload);

  const jsonLog = await logBackup({
    file_type: 'json',
    file_size: sizeStr,
    created_by: createdBy,
    status: 'success',
    record_count: payload.counts.total,
  });

  return { payload, jsonLog };
}
