// ============================================================
// QR Servis Katmanı
// lib/services/qr.ts
// Yasin Hoca Çalışma Merkezi - QR Yönetim Sistemi (KTP-013)
// ============================================================

import QRCode from 'qrcode';
import JSZip from 'jszip';
import type { DbSettings } from '@/lib/types';
import { getSettings } from '@/lib/services/settings';

// 50 Masanın Kod Listesi
export const ALL_DESK_CODES: string[] = [
  // A Masaları (12 Adet)
  'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12',
  // B Masaları (22 Adet)
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10',
  'B11', 'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20',
  'B21', 'B22',
  // C Masaları (16 Adet)
  'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10',
  'C11', 'C12', 'C13', 'C14', 'C15', 'C16',
];

export interface DeskQRItem {
  deskCode: string;
  section: 'A' | 'B' | 'C';
  wifiName: string;
  wifiString: string;
  dataUrl: string;
  metadata: {
    desk: string;
    type: string;
    library: string;
    created_at: string;
  };
}

/**
 * Masa kodundan bölgeyi çıkarır (A, B veya C).
 */
export function getSectionFromCode(deskCode: string): 'A' | 'B' | 'C' {
  const upper = deskCode.trim().toUpperCase();
  if (upper.startsWith('A')) return 'A';
  if (upper.startsWith('B')) return 'B';
  return 'C';
}

/**
 * Standart Wi-Fi QR metnini üretir:
 * WIFI:T:WPA;S:{wifi_name};P:{wifi_password};;
 */
export function buildWifiString(ssid: string, password = ''): string {
  // Özel karakter kaçışları (ASCII ; : , \)
  const cleanSsid = ssid.replace(/([\\;,:"])/g, '\\$1');
  const cleanPass = password.replace(/([\\;,:"])/g, '\\$1');
  return `WIFI:T:WPA;S:${cleanSsid};P:${cleanPass};;`;
}

/**
 * Tek bir masa için Wi-Fi formatlı QR kod veri URL'si (PNG) ve metadata üretir.
 */
export async function generateDeskQR(
  deskCode: string,
  wifiName: string,
  wifiPassword = '',
  libraryName = 'Yasin Hoca Çalışma Merkezi',
): Promise<DeskQRItem> {
  const wifiString = buildWifiString(wifiName, wifiPassword);

  // Yüksek çözünürlüklü ve net QR kod oluştur
  const dataUrl = await QRCode.toDataURL(wifiString, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a', // Koyu slate
      light: '#ffffff', // Beyaz
    },
  });

  return {
    deskCode,
    section: getSectionFromCode(deskCode),
    wifiName,
    wifiString,
    dataUrl,
    metadata: {
      desk: deskCode,
      type: 'wifi',
      library: libraryName,
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * 50 masanın tamamı için QR kodlarını eşzamanlı olarak üretir.
 */
export async function generateAllDeskQRs(
  settings?: DbSettings,
): Promise<{ items: DeskQRItem[]; settings: DbSettings }> {
  const currentSettings = settings || (await getSettings());
  const wifiName = currentSettings.wifi_name || 'YasinHoca_Calisma';
  const wifiPass = currentSettings.wifi_password || 'yh2026calisma';
  const libName = currentSettings.library_name || 'Yasin Hoca Çalışma Merkezi';

  const promises = ALL_DESK_CODES.map((code) =>
    generateDeskQR(code, wifiName, wifiPass, libName),
  );

  const items = await Promise.all(promises);
  return { items, settings: currentSettings };
}

/**
 * Tek bir masanın QR kodunu {deskCode}.png olarak indirir.
 */
export function downloadQR(deskCode: string, dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${deskCode}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 50 masanın QR kodlarını tek bir ZIP arşivi olarak paketleyip indirir.
 * Dosyalar: A1.png, A2.png, ... C16.png
 */
export async function downloadAllQRs(
  items: DeskQRItem[],
  zipFilename = 'Yasin_Hoca_Masa_QR_Kodlari.zip',
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('Masa_QR_Kodlari');

  // Her masanın dataURL'sini base64 byte dizisine çevirip zip içine ekle
  for (const item of items) {
    const base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');
    folder?.file(`${item.deskCode}.png`, base64Data, { base64: true });
  }

  // Bilgilendirme metni dosyası da ekle
  const infoText = `YASIN HOCA CALISMA MERKEZI - MASA QR KODLARI\r\n` +
    `Toplam Masa: 50\r\n` +
    `Tarih: ${new Date().toLocaleString('tr-TR')}\r\n` +
    `Wi-Fi Adi: ${items[0]?.wifiName || ''}\r\n` +
    `Kullanim: Her QR gorseli ilgili masanin uzerine yapistirilacaktir.\r\n`;

  folder?.file('README_WIFI_BILGILERI.txt', infoText);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
