# Değişiklik Günlüğü – Yasin Hoca Kütüphane Yönetim Sistemi

Tüm önemli değişiklikler bu dosyada kronolojik olarak kayıt altına alınır.
Format: [Keep a Changelog](https://keepachangelog.com/tr/) · Versiyon: [Semantic Versioning](https://semver.org/)

---

## [1.5.0] – 2026-09-08 · KTP-015: Ürün Olgunlaştırma, Kod Temizliği ve UX İyileştirmesi

### 🧱 Ortak Utility Altyapısı (Yeni Dosyalar)

- **`lib/utils/format.ts`** oluşturuldu.
  Projedeki tüm tarih ve para biçimlendirme işlemleri tek bir yerden yönetilmektedir:
  - `formatDate(dateStr)` → `01.05.2025` (tablolar ve listeler için)
  - `formatDateLong(dateStr)` → `1 Mayıs 2025` (detay panelleri için)
  - `formatCurrency(amount)` → `₺2.500`
  - `getTodayString()` → Form başlangıç tarihleri için YYYY-MM-DD
  - `calculateEndDate(startDate, pkg)` → Pakete göre bitiş tarihi hesabı

- **`lib/utils/badges.ts`** oluşturuldu.
  Arayüzde kullanılan tüm rozet (badge) haritaları tek bir yerden okunmaktadır:
  - `STATUS_BADGE` → Masa durumu rozetleri (boş / dolu / askıda / dolmak üzere)
  - `PAYMENT_BADGE` → Ödeme durumu rozetleri (ödendi / kapora / bekliyor)
  - `PACKAGE_LABEL` → Paket tipi etiketleri (haftalık / aylık / yıllık)

---

### 🧹 Kod Temizliği – Kaldırılan Tekrarlar

Aşağıdaki tekrar eden kod blokları projeden kaldırılmış, yukarıdaki ortak utility dosyalarına taşınmıştır:

| # | Kaldırılan Yapı | Önceki Konum |
|---|----------------|-------------|
| 1 | `formatDate` inline lambda | `DeskDetailsPanel/index.tsx` |
| 2 | `formatDate` standalone fonksiyon | `app/rentals/page.tsx` |
| 3 | `STATUS_BADGE` lokal tanım | `DeskDetailsPanel/index.tsx` |
| 4 | `PAYMENT_BADGE` lokal tanım | `DeskDetailsPanel/index.tsx` |
| 5 | `PACKAGE_LABEL` lokal tanım | `DeskDetailsPanel/index.tsx` |
| 6 | `PAYMENT_CONFIG` lokal tanım | `app/rentals/page.tsx` |
| 7 | `PACKAGE_LABELS` lokal tanım | `app/rentals/page.tsx` |
| 8 | `getTodayString()` fonksiyon | `CreateRentalDialog/index.tsx` |
| 9 | `calculateEndDate()` fonksiyon | `CreateRentalDialog/index.tsx` |
| 10 | Manuel diffDays hesabı | `hooks/useRentals.ts` → `calculateRemainingDays` kullanıldı |
| 11 | Kullanılmayan `depositCount`, `paidCount`, `pendingCount` stat'lar | `hooks/useRentals.ts` |

---

### 🗑️ Kullanılmayan Kod Temizliği

- `app/page.tsx` — `console.log('[HomePage]…')` debug satırı kaldırıldı
- `app/page.tsx` — Kullanılmayan importlar temizlendi: `BookOpen`, `Settings`, `Bell`, `RefreshCw`, `Calendar`
- `app/backup/page.tsx` — Kullanılmayan `type formatBytes` import'u kaldırıldı
- `components/Navbar/index.tsx` — Kullanılmayan `role` destructure kaldırıldı

---

### 🎨 UI Standardizasyonu

- **Terminate (Sonlandır) Onay Modali İkon Hatası Düzeltildi:**
  `app/rentals/page.tsx` — Yanlış kullanılan `CheckCircle2` ikonu `XCircle` ile değiştirildi.
  (İptal/sonlandırma modalında onay ikonu kullanmak semantik olarak yanlıştı.)

- **Badge Alan Erişim Tutarsızlığı Düzeltildi:**
  `rentals/page.tsx` — `payment.badgeClass` → `payment.className` güncellendi.
  Tüm badge'ler artık `PAYMENT_BADGE` shared yapısını kullanıyor.

---

### 📖 Kullanım Rehberi – Yeni Sayfa

- **`app/guide/page.tsx`** oluşturuldu.
  Teknik olmayan kullanıcılar için 7 bölümlük kısa kullanım kılavuzu:
  1. Sisteme Giriş
  2. Masa Kiralama
  3. Süre Uzatma
  4. Raporları Görüntüleme
  5. QR Kodlarını Kullanma
  6. Yedek Alma
  7. Yetki Rolleri

  Her bölüm 3 madde içerir; teknik jargon kullanılmamıştır.
  URL: `/guide`

---

### 🧭 Navbar Değişiklikleri

- **"Nasıl Kullanılır" Linki Eklendi:**
  `components/Navbar/index.tsx` — `BookOpenCheck` ikonu ile `/guide` sayfasına bağlantı.
  `adminOnly: false` olarak tanımlandığından hem yönetici hem personel erişebilir.

- **"Powered by Akyasan" İbaresi Eklendi:**
  Navbar'ın hemen altına `bg-slate-900` zemin üzerinde kurumsal bir şerit eklendi.
  `text-slate-500 tracking-widest uppercase` — sade, göze çarpmayan, profesyonel.

---

### 🎨 Renk Paleti Güncellemesi

`app/globals.css` — CSS değişkenleri güncellendi:

| Değişken | Eski Değer | Yeni Değer | Etki |
|---------|-----------|-----------|------|
| `--background` | `oklch(1 0 0)` saf beyaz | `oklch(0.985 0.003 240)` hafif lacivert | Gözü yormayan arka plan |
| `--primary` | `oklch(0.205 0 0)` saf siyah | `oklch(0.25 0.07 240)` lacivert | Kütüphane ruhuna uygun |
| `--ring` | `oklch(0.708 0 0)` gri | `oklch(0.45 0.08 240)` mavi-gri | Focus halkası netleşti |
| `--border` | `oklch(0.922 0 0)` nötr | `oklch(0.90 0.01 240)` hafif mavi | Kartlar arası ayrım iyileşti |
| `--chart-1..5` | Gri skalası | Gerçek renkler (mavi, yeşil, sarı, turuncu, mor) | Grafikler anlamlı renkli |

---

### ✅ Doğrulama

```
npm run build → Exit code 0
TypeScript    → 0 hata, 0 uyarı
Sayfalar      → / /rentals /reports /settings /backup /qr /guide /login
```

---

## [1.4.0] – KTP-013: QR Kod Yönetim Sistemi

- 50 masa için Wi-Fi QR kod üretimi
- Toplu ZIP indirme
- A4 yazdırma düzeni

## [1.3.0] – KTP-011: Otomatik Yedekleme Sistemi

- JSON, Excel, CSV formatlarında tam veri dışa aktarma
- Yedek geçmişi loglama (`backup_logs` tablosu)
- Günlük yedek mimarisi (`runDailyBackup`)

## [1.2.0] – KTP-007: Ayarlar Merkezi

- Kütüphane bilgileri, Wi-Fi ve fiyatlandırma yönetimi

## [1.1.0] – KTP-005: Süre Uzatma ve Otomasyon

- Kiralama uzatma (+1 Hafta / +1 Ay / +1 Yıl)
- Süresi dolan kiralamalar otomatik temizliği
- `rental_extensions` tablosu

## [1.0.0] – KTP-001: Temel Sistem

- Supabase auth ve rol yönetimi
- Kat planı görünümü
- Masa kiralama ve sonlandırma
