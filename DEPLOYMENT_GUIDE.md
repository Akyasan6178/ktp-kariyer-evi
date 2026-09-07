# 🚀 Cloudflare Pages Canlıya Alma (Production Deployment) Rehberi
**Yasin Hoca Çalışma Merkezi & Kütüphane Masa Yönetim Sistemi**

Bu rehber, sistemi localhost ortamından çıkarıp Cloudflare Pages ve Supabase altyapısı üzerinde yüksek performanslı, güvenli ve 7/24 kesintisiz çalışacak şekilde canlıya alma adımlarını içerir.

---

## 📋 Genel Bakış ve Mimari

- **Frontend / Arayüz:** Next.js 15 (React 19, TypeScript, Tailwind CSS)
- **Dağıtım Platformu (Hosting):** Cloudflare Pages (Global Anycast Edge CDN, Ücretsiz SSL, DDoS Koruması)
- **Veritabanı & Auth:** Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security)
- **Derleme Çıktısı:** Static HTML/JS Export (`out/`) – Edge üzerinde sıfır gecikme (0ms Cold Start)

---

## ADIM 1: GitHub Reposu Oluşturma

1. [github.com](https://github.com) adresine giriş yapın.
2. Sağ üst köşedeki **`+`** simgesine tıklayıp **New repository** seçeneğini seçin.
3. Repo ayarlarını aşağıdaki gibi yapılandırın:
   - **Repository name:** `ktp-yasin-hoca` (veya tercih ettiğiniz bir isim)
   - **Description:** `Yasin Hoca Çalışma Merkezi Kütüphane Yönetim Sistemi`
   - **Visibility:** **Private** (Tavsiye edilir, kurum içi kod güvenliği için)
   - **Initialize this repository with:** *Tüm kutucukları (README, .gitignore, license) boş bırakın* (çünkü projemiz yerelde hazır).
4. **Create repository** butonuna tıklayın.

---

## ADIM 2: Projeyi GitHub'a Gönderme

Terminalinizi açın ve proje dizininde (`ktp-app`) şu komutları sırasıyla çalıştırın:

```powershell
# 1. Proje dizininde olduğunuzdan emin olun
cd "c:\Users\MSI\Desktop\KTP-Yasin Hoca\ktp-app"

# 2. Değişiklikleri Git takip listesine ekleyin
git add .

# 3. İlk canlıya alma commit'ini oluşturun
git commit -m "feat: production deployment hazirligi (KTP-014)"

# 4. Ana dalı main yapın
git branch -M main

# 5. Kendi GitHub repo adresinizi remote olarak ekleyin (Kullanıcı adınızı yazın):
git remote add origin https://github.com/KULLANICI_ADINIZ/ktp-yasin-hoca.git

# 6. Kodları GitHub'a gönderin
git push -u origin main
```

---

## ADIM 3: Cloudflare Pages'e Bağlama

1. [dash.cloudflare.com](https://dash.cloudflare.com) adresine gidin ve Cloudflare hesabınıza giriş yapın.
2. Sol menüden **Workers & Pages** sekmesine tıklayın.
3. **Create application** butonuna tıklayın.
4. Üst sekmelerden **Pages** seçeneğine geçin.
5. **Connect to Git** (Git'e Bağlan) butonuna tıklayın.
6. GitHub hesabınızı yetkilendirin ve oluşturduğunuz `ktp-yasin-hoca` reposunu seçin.
7. **Begin setup** butonuna basın.

---

## ADIM 4: Build Komutu Yapılandırması

Cloudflare Pages proje ayarları ekranında derleme yapılandırmasını girin:

- **Project name:** `ktp-yasin-hoca` (veya dilediğiniz subdomain adı, örn: `kutuphane-app`)
- **Production branch:** `main`
- **Framework preset:** `None` (veya `Next.js (Static HTML Export)`)
- **Build command:**
  ```bash
  npm run build
  ```

---

## ADIM 5: Output Ayarları (Derleme Çıktı Dizini)

- **Build output directory:**
  ```text
  out
  ```
  *(Next.js `next.config.ts` dosyasında `output: 'export'` ayarlandığı için tüm statik HTML/JS/CSS dosyaları `out` klasörüne oluşturulur).*

- **Root directory:** *(Eğer repoda ktp-app alt klasördeyse `ktp-app` yazın, reponun en üstündeyse boş bırakın).*

---

## ADIM 6: Environment Variables (Ortam Değişkenleri)

Aynı kurulum ekranında veya daha sonra **Settings > Environment variables** bölümünden Production değişkenlerini ekleyin:

| Değişken Adı | Değer (Örnek) | Açıklama |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzproject.supabase.co` | Supabase Dashboard > Settings > API altındaki Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Dashboard > Settings > API altındaki `anon` `public` key |
| `NODE_VERSION` | `20.18.0` | Cloudflare derleme ortamı için Node.js LTS sürümü |

> ⚠️ **ÖNEMLİ:** `service_role` anahtarını KESİNLİKLE buraya eklemeyin. Sadece `anon` anahtarını kullanın.

Değişkenleri girdikten sonra **Save and Deploy** butonuna tıklayın. İlk derleme 1-2 dakika içinde başarıyla tamamlanacaktır.

---

## ADIM 7: Özel Domain Bağlama (Custom Domain)

Yasin Hoca'nın özel alan adını (örneğin: `kutuphane.yasinhoca.com` veya `panel.yasinhoca.com`) bağlamak için:

1. Cloudflare Pages projenizin içine girin.
2. Üst menüden **Custom domains** sekmesine tıklayın.
3. **Set up a custom domain** butonuna basın.
4. Kullanmak istediğiniz domaini girin (Örn: `kutuphane.yasinhoca.com`).
5. **Continue** deyin:
   - **Eğer domaininiz zaten Cloudflare DNS üzerindeyse:** Cloudflare otomatik olarak CNAME kaydını ekler ve tek tıkla onaylar.
   - **Eğer domain başka bir firmadaysa (GoDaddy, Natro, İsimtescil vb.):** DNS yönetim panelinize gidip `CNAME` türünde:
     - **Ad / Host:** `kutuphane`
     - **Hedef / Value:** `<proje-adiniz>.pages.dev` kaydını ekleyin.
6. **Activate domain** butonuna basın.

---

## ADIM 8: SSL / TLS Doğrulama

1. Cloudflare, bağlanan domaine otomatik olarak ücretsiz **Universal SSL (Let's Encrypt / DigiCert)** sertifikası tahsis eder.
2. Cloudflare Dashboard > **SSL/TLS** sekmesine gidin:
   - Şifreleme modunu **Full (strict)** veya **Full** olarak seçin.
   - **Always Use HTTPS** seçeneğini aktif edin (HTTP istekleri otomatik güvenli HTTPS'e yönlendirilir).
3. 2-5 dakika içerisinde `https://kutuphane.yasinhoca.com` yeşil kilit simgesiyle güvenli şekilde açılacaktır.

---

## ADIM 9: İlk Admin Hesabını Oluşturma

Sisteme yönetici olarak giriş yapabilmek için Supabase üzerinde admin hesabının tanımlanması gerekir:

### 1. Veritabanı Tablolarını Çalıştırma:
Supabase Dashboard > **SQL Editor** sekmesine gidin.
Projedeki `supabase/migrations/production_all_migrations.sql` dosyasının içeriğini kopyalayıp yapıştırın ve **Run** butonuna tıklayın.

### 2. Admin Kullanıcısını Oluşturma:
Supabase Dashboard > **Authentication** > **Users** sekmesine gidin:
1. **Add user** > **Create user** tıklayın.
2. Bilgileri girin:
   - **Email:** `admin@yasinhoca.com` (veya Yasin Hoca'nın e-postası)
   - **Password:** Güçlü bir şifre
   - **Auto Confirm User?:** ✅ **İşaretleyin** (e-posta aktivasyonu beklemeden hemen giriş yapabilsin)
3. **Save** deyin.

### 3. Kullanıcıya Admin Rolü Verme:
Supabase Dashboard > **SQL Editor** ekranına dönün ve şu komutu çalıştırın:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Yasin Hoca'
WHERE email = 'admin@yasinhoca.com';
```

### 4. Supabase Auth URL Yapılandırması:
Supabase Dashboard > **Authentication** > **URL Configuration** bölümüne gidin:
- **Site URL:** `https://<proje-adiniz>.pages.dev` veya `https://kutuphane.yasinhoca.com`
- **Redirect URLs:** 
  - `https://<proje-adiniz>.pages.dev/**`
  - `https://kutuphane.yasinhoca.com/**`
  - `http://localhost:3000/**`
olarak kaydedin.

---

## ADIM 10: Production Test Checklist

Canlı yayına çıkmadan önce aşağıdaki kontrolleri sırasıyla yapın:

- [ ] **Giriş Testi:** `/login` sayfasına gidin, admin e-posta ve şifrenizle giriş yapın.
- [ ] **Masa Haritası:** Ana sayfada (`/`) tek büyük salon içerisinde A1..A12, B1..B22, C1..C16 masalarının eksiksiz dizildiğini doğrulayın.
- [ ] **Kiralama Testi:** Boş bir masaya tıklayıp test öğrencisiyle kiralama oluşturun; masa renginin kırmızı/dolu olduğunu kontrol edin.
- [ ] **Süre Uzatma:** Kiralanan masaya tıklayıp "Süre Uzat" diyerek uzatma ve ek ödeme kaydı ekleyin.
- [ ] **Raporlar:** `/reports` sayfasına girip finansal kartların (bugünkü gelir, toplam gelir, uzatmalar) doğru hesaplandığını doğrulayın.
- [ ] **Ayarlar Merkezi:** `/settings` sayfasına girip kütüphane adı, Wi-Fi adı ve fiyatları güncelleyin.
- [ ] **QR Kodları:** `/qr` sayfasına girip 50 masanın Wi-Fi QR kodlarını listeleyin ve "Toplu Yazdır" önizlemesini kontrol edin.
- [ ] **Yedekleme:** `/backup` sayfasına girip JSON ve Excel formatlarında "Tam Yedek Al" butonunu test edin; dosyanın indiğini ve tablonun loglandığını doğrulayın.
- [ ] **Yetki Güvenliği:** Bir `staff` (personel) hesabı ile giriş yapıp `/reports`, `/settings`, `/backup`, `/qr` sayfalarına gitmeyi deneyin; erişimin engellendiğini ve Kat Planına yönlendirildiğini teyit edin.
