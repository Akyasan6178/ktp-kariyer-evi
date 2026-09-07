# KTP-010: İlk Admin Kullanıcısı Kurulum Kılavuzu

Yasin Hoca Çalışma Merkezi Kütüphane Yönetim Sistemi için **Supabase Auth ve Rol Bazlı Yetkilendirme (RBAC)** kurulum adımları aşağıda detaylandırılmıştır.

---

## 1. Veritabanı Tablosunun ve Tetikleyicinin Oluşturulması

Supabase Dashboard üzerinde **SQL Editor** ekranına gidin ve `supabase/migrations/create_profiles.sql` dosyasındaki SQL komutlarını çalıştırın:

```sql
-- 1. Profiles Tablosu
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read profiles" 
ON public.profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow user update own profile" ON public.profiles;
CREATE POLICY "Allow user update own profile" 
ON public.profiles FOR UPDATE TO public USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
CREATE POLICY "Allow insert on profiles" 
ON public.profiles FOR INSERT TO public WITH CHECK (true);

-- 3. Otomatik profil oluşturan Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. İlk Admin Kullanıcısının Oluşturulması

### Yöntem A: Supabase Dashboard Arayüzünden (Önerilen)
1. Supabase Dashboard'da sol menüden **Authentication** > **Users** sekmesine gidin.
2. Sağ üstteki **Add user** > **Create user** butonuna tıklayın.
3. Bilgileri girin:
   - **Email:** `yasin@yasinhoca.com` (veya istediğiniz e-posta)
   - **Password:** Güçlü bir şifre belirleyin
   - **Auto Confirm User?** seçeneğini işaretleyin (e-posta onayına gerek kalmadan hemen giriş yapabilmek için).
4. Kullanıcı oluştuktan sonra sol menüden **SQL Editor** sekmesine geçin ve kullanıcının rolünü `admin` yapın:

```sql
UPDATE public.profiles 
SET role = 'admin', full_name = 'Yasin Hoca'
WHERE email = 'yasin@yasinhoca.com';
```

---

### Yöntem B: Doğrudan SQL ile Kullanıcı ve Profil Oluşturma
Aşağıdaki SQL betiğini Supabase SQL Editor'de çalıştırarak tek adımda admin kullanıcısı oluşturabilirsiniz:

```sql
-- E-posta: admin@yasinhoca.com
-- Şifre: YasinHoca2026!
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@yasinhoca.com',
    crypt('YasinHoca2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Yasin Hoca","role":"admin"}',
    now(),
    now()
);

-- Profil kaydının rolünü admin olarak doğrula
UPDATE public.profiles
SET role = 'admin', full_name = 'Yasin Hoca'
WHERE email = 'admin@yasinhoca.com';
```

---

## 3. Personel (Staff) Kullanıcısı Oluşturma

Kütüphane çalışanları / personeller için:
1. **Authentication** > **Users** üzerinden yeni bir kullanıcı açın (örn: `personel@yasinhoca.com`).
2. Tetikleyici otomatik olarak bu kullanıcıyı `staff` rolü ile kaydedecektir.
3. İsim vermek isterseniz:
```sql
UPDATE public.profiles 
SET full_name = 'Ahmet Personel'
WHERE email = 'personel@yasinhoca.com';
```

---

## 4. Roller ve Erişim Matrisi

| Sayfa | Rota | Yönetici (Admin) | Personel (Staff) |
| :--- | :--- | :---: | :---: |
| **Kat Planı** | `/` | ✅ Tam Erişim | ✅ Tam Erişim |
| **Kiralama Yönetimi** | `/rentals` | ✅ Tam Erişim | ✅ Tam Erişim |
| **Gelir & Finans Raporları** | `/reports` | ✅ Tam Erişim | ❌ **Erişemez** (Engelli) |
| **Ayarlar Merkezi** | `/settings` | ✅ Tam Erişim | ❌ **Erişemez** (Engelli) |

- Personel (`staff`) rolündeki bir kullanıcı `/reports` veya `/settings` adresine doğrudan gitmeye çalışırsa, sistem yetki uyarısı vererek kullanıcıyı otomatik olarak `/` (Kat Planı) sayfasına yönlendirir.
- Menüde `Raporlar` ve `Ayarlar` linkleri yalnızca `admin` rolüne görünür.
