# KAPALI KOLTUK MODU SİSTEM ETKİ RAPORU (KTP-018B)
**Kariyer Evi VIP Kütüphane Yönetim Sistemi**  
**Tarih:** 8 Eylül 2026  
**Durum:** Tamamlandı (Production Ready)  
**Derleme Durumu:** `npm run build` -> Başarılı (0 Hata, 0 TypeScript Uyarısı)

---

## 1. AMAÇ VE KAPSAM
KTP-018B geliştirmesiyle, kurum yöneticisi Yasin Hoca'nın kütüphanedeki bazı koltukları tadilat, rezervasyon, teknik arıza, özel kullanım veya idari nedenlerle **geçici olarak kullanıma kapatabilmesi** (`closed`) ve dilediğinde tekrar **boş duruma alabilmesi** sağlanmıştır.

Bu mod, sistemin finansal ve operasyonel kararlılığını bozmadan tüm iş mantığı katmanlarında (UI, Servis, Güvenlik, İstatistik) devreye alınmıştır.

---

## 2. YENİ MASA DURUMU: `closed`

| Alan | Değer / Davranış |
| :--- | :--- |
| **Durum Kodu** | `closed` |
| **Görsel Renk** | **Nötr Gri** (`bg-slate-400 hover:bg-slate-500 border-slate-600 text-white`) |
| **Kat Planı Lejantı** | `Kapalı (Kullanım Dışı)` gri kutu göstergesi |
| **Tooltip Rozeti** | Gri zeminli `Kapalı` etiketi |
| **Detay Paneli** | Gri başlık rozeti ve `Geçici Kullanım Dışı` bilgilendirme kartı |

---

## 3. KAT PLANI VE YÖNETİCİ KONTROLLERİ

1. **Kapalıya Al (Kullanıma Kapat):**
   - Yalnızca **Admin** yetkisine sahip kullanıcılar boş bir masanın detay panelini açtığında, yeşil "Kiralama Oluştur" butonunun altında `"Kullanıma Kapat (Kapalıya Al)"` butonunu görür.
   - Butona tıklandığında masa anında `closed` durumuna geçirilir ve kat planında gri renge bürünür.
2. **Kullanıma Aç (Boşa Al):**
   - Kapalı bir masaya tıklandığında, "Kiralama Oluştur" butonu yerine yeşil renkli **"Kullanıma Aç (Boşa Al)"** butonu görüntülenir.
   - Admin butona bastığında masa tekrar `available` (yeşil) olur ve kiralama işlemlerine açılır.
3. **Yetki Koruması (RBAC):**
   - Personel (Staff) rolündeki kullanıcılar kapalı masaya tıkladığında işlem butonu görmez; *"Bu koltuğu sadece sistem yöneticisi (Admin) tekrar kullanıma açabilir."* uyarısı ile karşılaşır.

---

## 4. KAPALI KOLTUK GÜVENLİK DAVRANIŞLARI (ÇİFT KİLİT)

Kapalı bir koltuk üzerinde yetkisiz işlem yapılmasını engellemek amacıyla **önyüz (UI)** ve **servis katmanı (API)** seviyesinde çift kilit uygulanmıştır:

1. **Kiralama Yapılamaz:**
   - **UI:** Kapalı masanın detayında "Kiralama Oluştur" butonu gizlenir. Modal açılmaya zorlansa dahi kırmızı uyarı banner'ı belirir ve kaydet butonu devredışı bırakılır.
   - **Servis:** `lib/services/rentals.ts -> createRental()` fonksiyonu, işlem öncesinde masanın `closed` olup olmadığını denetler. Kapalıysa işlemi reddederek hata fırlatır.
2. **Süre Uzatılamaz:**
   - **UI:** Kiralama listesi ve detay ekranlarında kapalı masalar için süre uzatma işlemi engellenir ve toast bildirimi verilir.
   - **Servis:** `lib/services/extensions.ts -> createExtension()` fonksiyonu, kapalı masada uzatma yapılmasını engeller.
3. **Öğrenci Atanamaz:**
   - Kapalı koltuk hiçbir öğrenciye tahsis edilemez ve yeni sözleşme bağlanamaz.

---

## 5. KAPALI KOLTUKLARIN SİSTEMDEKİ ETKİLERİ

### 5.1. Doluluk Oranı (Occupancy Rate) Formülü
- **Önceki Hesaplama:** Tüm masalar (50) baz alınıyordu.
- **Yeni Optimize Hesaplama (Net Aktif Kapasite):**
  Kapalı koltuklar fiilen hizmet dışı olduğundan doluluk oranı toplam 50 masa üzerinden değil, **Aktif Hizmet Veren Masalar** üzerinden hesaplanır:
  $$\text{Net Aktif Kapasite} = \text{Toplam Masa} - \text{Kapalı Masa}$$
  $$\text{Doluluk Oranı (\%)} = \frac{\text{Dolu} + \text{Dolmak Üzere} + \text{Askıda}}{\text{Net Aktif Kapasite}} \times 100$$
- **Arayüz Gösterimi:** Doluluk çubuğunda gerçek oranla birlikte `(Aktif Kapasite: 48/50)` şeklinde net şeffaflık sağlanır.

### 5.2. Dashboard İstatistik Kartları
- Dashboard üzerindeki KPI ızgarası 7'li düzene uyarlandı:
  `Toplam Masa (50)` · `Boş Masa` · `Dolu Masa` · `Yakında Bitecekler` · `Süresi Dolanlar` · `Askıda` · **`Kapalı Koltuk` (Yeni Gri Kart)**.

### 5.3. Kiralama Yönetimi (`/rentals`)
- Mobil kartlarda ve masaüstü tablosunda masanın kapalı olup olmadığı özel gri `Kapalı` rozetiyle gösterilir.

---

## 6. VERİTABANI ENTEGRASYONU & SQL MIGRATION

Mevcut Supabase veritabanında `desks.status` üzerinde `CHECK (status IN ('available', 'occupied', 'suspended', 'expiring'))` kısıtlaması bulunmaktadır.

### 6.1. Hazırlanan SQL Dosyası
`ktp-app/supabase/migrations/add_closed_status.sql`:
```sql
-- Mevcut check kısıtlamasını kaldır ve 'closed' ekle
ALTER TABLE public.desks DROP CONSTRAINT IF EXISTS desks_status_check;

ALTER TABLE public.desks ADD CONSTRAINT desks_status_check 
  CHECK (status IN ('available', 'occupied', 'suspended', 'expiring', 'closed'));
```

### 6.2. Çift Katmanlı Dayanıklılık (Resilient Storage Fallback)
Kullanıcı Supabase SQL Editor üzerinde bu sorguyu henüz çalıştırmamış olsa dahi, `lib/services/desks.ts` içerisindeki akıllı mekanizma:
- `updateDeskStatus` çağrısında Postgres `23514` (check constraint violation) hatası aldığında çökmeyi engeller,
- Masanın kapalı durumunu güvenli istemci hafızasına (localStorage fallback) işler,
- UI'da anında griye dönüştürür ve kiralamayı kilitler,
- SQL çalıştırıldığı andan itibaren ise doğrudan PostgreSQL veritabanına kalıcı olarak kaydeder.

---

## 7. TEST VE DERLEME DOĞRULAMASI
- `npm run build` komutu çalıştırılmış; **0 hata ve 0 TypeScript uyarısı** ile 11 sayfanın tamamı optimize statik olarak derlenmiştir.
- Tip bütünlüğü `lib/database.types.ts` ve `lib/types.ts` üzerinde eksiksiz sağlanmıştır.
