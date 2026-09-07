# ✅ Production (Canlı Ortam) Doğrulama Kontrol Listesi
**Yasin Hoca Çalışma Merkezi & Kütüphane Masa Yönetim Sistemi**

Sistemin canlıya alınması sırasında ve sonrasında adım adım işaretlenerek tamamlanacak kontrol listesidir.

---

## 1. Veritabanı ve Şema Doğrulaması

- [ ] **SQL migrationlar çalıştırıldı mı?**
  - Supabase Dashboard > SQL Editor üzerinden `supabase/migrations/production_all_migrations.sql` başarıyla çalıştırıldı.
  - Tablolar, ilişkiler (Foreign Keys) ve RLS politikaları eksiksiz yüklendi.

- [ ] **`desks` tablosu var mı ve 50 masa tanımlı mı?**
  - A bloğu: 12 masa (A1 - A12)
  - B bloğu: 22 masa (B1 - B22)
  - C bloğu: 16 masa (C1 - C16)
  - Toplam 50 masa başlangıçta `available` (müsait) durumda.

- [ ] **`students` tablosu var mı?**
  - `id`, `full_name`, `phone`, `group_type`, `parent_name`, `parent_phone`, `notes`, `created_at` kolonları mevcut.

- [ ] **`rentals` tablosu var mı?**
  - `id`, `student_id`, `desk_id`, `package_type`, `start_date`, `end_date`, `price`, `payment_status`, `payment_note`, `is_active` kolonları mevcut.

- [ ] **`rental_extensions` tablosu var mı?**
  - `id`, `rental_id`, `extension_type`, `amount`, `payment_status`, `payment_note`, `old_end_date`, `new_end_date`, `created_at` kolonları tanımlı.
  - `idx_rental_extensions_rental_id` indeksi aktif.

- [ ] **`settings` tablosu var mı?**
  - `library_name`, `phone`, `address`, `wifi_name`, `wifi_password`, `weekly_price`, `monthly_price`, `yearly_price` kolonları mevcut.
  - Sistem için 1 adet varsayılan ayar kaydı mevcut.

- [ ] **`profiles` tablosu ve Auth Trigger'ı var mı?**
  - `id` (references auth.users), `email`, `full_name`, `role` (`admin` / `staff`), `created_at` kolonları mevcut.
  - `on_auth_user_created` trigger'ı `auth.users` üzerinde tanımlı.

- [ ] **`backup_logs` tablosu var mı?**
  - `id`, `created_at`, `file_type`, `file_size`, `created_by`, `status`, `record_count` kolonları mevcut.
  - `idx_backup_logs_created_at` indeksi aktif.

---

## 2. Kullanıcı Hesapları ve Rol Güvenliği (RBAC)

- [ ] **Admin hesabı oluşturuldu mu?**
  - Supabase Auth üzerinde yönetici hesabı açıldı (Auto confirm aktif).
  - `profiles` tablosundaki `role` değeri `'admin'` olarak güncellendi.
  - Admin kullanıcı ile sisteme başarılı giriş yapıldı.

- [ ] **Staff (Personel) hesabı oluşturuldu mu?**
  - Supabase Auth üzerinde personel hesabı açıldı (Auto confirm aktif).
  - `profiles` tablosunda rolünün `'staff'` olduğu teyit edildi.
  - Staff hesabı ile giriş yapıldığında Navbar'da yalnızca `Kat Planı` ve `Kiralama Yönetimi` linklerinin göründüğü teyit edildi.
  - Staff hesabı `/reports`, `/settings`, `/backup` veya `/qr` adresine doğrudan gitmek istediğinde yetki engeli ile Kat Planı (`/`) sayfasına yönlendirildiği test edildi.

---

## 3. Sistem Fonksiyonellik Testleri

- [ ] **Kat Planı ve Süre Otomasyonu test edildi mi?**
  - Tek büyük kütüphane salon planı (Sol A, Orta B, Sağ cam kenarı C) hatasız çiziliyor.
  - Masa kartına tıklanınca açılan detay çekmecesi çalışıyor.
  - Boş masaya tıklanınca kiralama modalı açılıyor ve kiralama başarıyla yapılıyor.
  - Süresi dolmuş kiralamalar sayfa yüklendiğinde otomatik sonlandırılıp masa boşaltılıyor.

- [ ] **Süre Uzatma ve Ek Ödeme Sistemi test edildi mi?**
  - Aktif bir kiralama için "Süre Uzat" dialogu açılıyor.
  - Hafta / Ay / Yıl seçilip tutar ve ödeme durumu girildiğinde bitiş tarihi güncelleniyor.
  - `rental_extensions` tablosuna yeni finansal kayıt düşüyor.

- [ ] **QR Sistemi test edildi mi?**
  - `/qr` sayfasında 50 masanın tamamı (A1-A12, B1-B22, C1-C16) listeleniyor.
  - QR kod içeriği `WIFI:T:WPA;S:<wifi_name>;P:<wifi_password>;;` formatında telefon kamerasıyla okutuldu ve Wi-Fi'a bağlandığı test edildi.
  - Masa bazlı ve blok bazlı filtreleme çalışıyor.
  - "Toplu Yazdır" butonu A4 masa kartları formatında yazdırma penceresini açıyor.

- [ ] **Yedekleme Sistemi test edildi mi?**
  - `/backup` sayfasına sadece admin erişebiliyor.
  - "Tam Yedek Al" butonuna basıldığında JSON, CSV ve Excel formatlarında 6 tablonun (students, rentals, rental_extensions, desks, settings, profiles) verileri eksiksiz indirilebiliyor.
  - İndirme sonrası `backup_logs` tablosuna tarih, dosya boyutu ve kayıt sayısıyla yeni log satırı ekleniyor.

- [ ] **Reports (Finans & Gelir) ekranı test edildi mi?**
  - `/reports` sayfasına sadece admin erişebiliyor.
  - Bugünkü Gelir, Bu Ayki Gelir, Bu Yılki Gelir, Toplam Gelir hesaplanıyor.
  - Hesaplamada `rentals.price` + `rental_extensions.amount` toplamları doğru toplanıyor.
  - Bekleyen tahsilatlar ve kaporalı öğrenci listesi filtrelenebiliyor.

---

## 4. Canlı Dağıtım (Cloudflare Pages)

- [ ] **Next.js Static Build doğrulaması yapıldı mı?**
  - `npm run build` komutu yerelde sıfır hata ve sıfır uyarı ile `out/` klasörünü üretti.
- [ ] **Cloudflare Pages ortam değişkenleri girildi mi?**
  - `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` tanımlandı.
- [ ] **Supabase Auth URL yapılandırması yapıldı mı?**
  - Production domaini (veya `*.pages.dev`) Site URL ve Redirect URLs listesine eklendi.
- [ ] **SSL ve Özel Alan Adı doğrulandı mı?**
  - Domain CNAME kaydı Cloudflare Pages'e yönlendirildi.
  - HTTPS güvenli kilit simgesi tarayıcıda yeşil olarak onaylandı.
