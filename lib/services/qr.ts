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
 * A4 çıktısındaki gibi tasarlanmış etiketli QR görselini (Canvas -> PNG dataUrl) üretir.
 * İçerik: Kurum Başlığı ("Kariyer Evi VIP Kütüphane"), Masa Kodu, QR Görseli ve Wi-Fi Bilgisi.
 */
export async function generateLabeledQR(
  item: DeskQRItem,
  title = 'Kariyer Evi VIP Kütüphane',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 760;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context not available'));

    // Arka plan (Beyaz)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dış kesim / etiket çerçevesi (Kesik çizgili)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.setLineDash([]); // Çizgiyi sıfırla

    // Üst Başlık (Kurum Adı)
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), canvas.width / 2, 70);

    // Masa Numarası
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 46px Arial, sans-serif';
    ctx.fillText(`MASA ${item.deskCode}`, canvas.width / 2, 130);

    // QR Görselini ortalayarak çiz
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const qrSize = 390;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 160;

      // QR arkası hafif çerçeve
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);

      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      // Wi-Fi Bilgisi
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText(`Wi-Fi: ${item.wifiName}`, canvas.width / 2, 625);

      // Alt açıklama
      ctx.fillStyle = '#64748b';
      ctx.font = '500 17px Arial, sans-serif';
      ctx.fillText('Kameranızla okutarak Wi-Fi ağına anında bağlanın', canvas.width / 2, 670);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
    img.src = item.dataUrl;
  });
}

/**
 * Tek bir masanın QR kodunu veya etiketini dosya olarak indirir.
 */
export function downloadQR(filename: string, dataUrl: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * 50 masanın QR kodlarını (Sadece QR veya Etiketli QR) tek bir ZIP arşivi olarak indirir.
 */
export async function downloadAllQRs(
  items: DeskQRItem[],
  mode: 'qr-only' | 'labeled' = 'qr-only',
  title = 'Kariyer Evi VIP Kütüphane',
  zipFilename?: string,
): Promise<void> {
  const zip = new JSZip();
  const folderName = mode === 'labeled' ? 'Masa_Etiketleri' : 'Masa_QR_Kodlari';
  const folder = zip.folder(folderName);

  const defaultFilename =
    mode === 'labeled'
      ? 'Kariyer_Evi_Masa_Etiketleri_ZIP.zip'
      : 'Kariyer_Evi_Masa_QR_Kodlari.zip';

  // Her masa için dosyayı ekle
  for (const item of items) {
    let base64Data: string;
    let fileName: string;

    if (mode === 'labeled') {
      const labeledDataUrl = await generateLabeledQR(item, title);
      base64Data = labeledDataUrl.replace(/^data:image\/png;base64,/, '');
      fileName = `Masa_${item.deskCode}_Etiket.png`;
    } else {
      base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');
      fileName = `Masa_${item.deskCode}_QR.png`;
    }

    folder?.file(fileName, base64Data, { base64: true });
  }

  // Bilgilendirme metni dosyası da ekle
  const infoText = `${title.toUpperCase()} - MASA QR KODLARI\r\n` +
    `Format: ${mode === 'labeled' ? 'Etiketli QR (Baskıya Hazır)' : 'Sadece QR Kodu'}\r\n` +
    `Toplam Masa: ${items.length}\r\n` +
    `Tarih: ${new Date().toLocaleString('tr-TR')}\r\n` +
    `Wi-Fi Adi: ${items[0]?.wifiName || ''}\r\n` +
    `Kullanim: Her QR gorseli ilgili masanin uzerine yapistirilacaktir.\r\n`;

  folder?.file('README_WIFI_BILGILERI.txt', infoText);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

