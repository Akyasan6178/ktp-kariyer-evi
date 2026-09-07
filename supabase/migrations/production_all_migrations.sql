-- ============================================================
-- YASİN HOCA KÜTÜPHANE YÖNETİM SİSTEMİ
-- PRODUCTION TÜM VERİTABANI KURULUM MİGRASYONU (ALL-IN-ONE)
-- Dosya: production_all_migrations.sql
-- ============================================================

-- 0. Gerekli Eklentiler
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. MASALAR TABLOSU (desks)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.desks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    section TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'suspended', 'expiring')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Masalar tablosu RLS
ALTER TABLE public.desks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on desks" ON public.desks;
CREATE POLICY "Allow all access on desks"
ON public.desks FOR ALL TO public
USING (true) WITH CHECK (true);

-- 50 Masanın Otomatik Tohumlanması (A1-A12, B1-B22, C1-C16)
INSERT INTO public.desks (code, section, status)
VALUES
  -- A Masaları (12 Adet)
  ('A1', 'A', 'available'), ('A2', 'A', 'available'), ('A3', 'A', 'available'),
  ('A4', 'A', 'available'), ('A5', 'A', 'available'), ('A6', 'A', 'available'),
  ('A7', 'A', 'available'), ('A8', 'A', 'available'), ('A9', 'A', 'available'),
  ('A10', 'A', 'available'), ('A11', 'A', 'available'), ('A12', 'A', 'available'),
  -- B Masaları (22 Adet)
  ('B1', 'B', 'available'), ('B2', 'B', 'available'), ('B3', 'B', 'available'),
  ('B4', 'B', 'available'), ('B5', 'B', 'available'), ('B6', 'B', 'available'),
  ('B7', 'B', 'available'), ('B8', 'B', 'available'), ('B9', 'B', 'available'),
  ('B10', 'B', 'available'), ('B11', 'B', 'available'), ('B12', 'B', 'available'),
  ('B13', 'B', 'available'), ('B14', 'B', 'available'), ('B15', 'B', 'available'),
  ('B16', 'B', 'available'), ('B17', 'B', 'available'), ('B18', 'B', 'available'),
  ('B19', 'B', 'available'), ('B20', 'B', 'available'), ('B21', 'B', 'available'),
  ('B22', 'B', 'available'),
  -- C Masaları (16 Adet)
  ('C1', 'C', 'available'), ('C2', 'C', 'available'), ('C3', 'C', 'available'),
  ('C4', 'C', 'available'), ('C5', 'C', 'available'), ('C6', 'C', 'available'),
  ('C7', 'C', 'available'), ('C8', 'C', 'available'), ('C9', 'C', 'available'),
  ('C10', 'C', 'available'), ('C11', 'C', 'available'), ('C12', 'C', 'available'),
  ('C13', 'C', 'available'), ('C14', 'C', 'available'), ('C15', 'C', 'available'),
  ('C16', 'C', 'available')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 2. ÖĞRENCİLER TABLOSU (students)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    group_type TEXT NOT NULL DEFAULT 'YKS',
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on students" ON public.students;
CREATE POLICY "Allow all access on students"
ON public.students FOR ALL TO public
USING (true) WITH CHECK (true);

-- ============================================================
-- 3. KİRALAMALAR TABLOSU (rentals)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    desk_id UUID NOT NULL REFERENCES public.desks(id) ON DELETE CASCADE,
    package_type TEXT NOT NULL CHECK (package_type IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit', 'paid')),
    payment_note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rentals_desk_active ON public.rentals(desk_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rentals_student ON public.rentals(student_id);

ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on rentals" ON public.rentals;
CREATE POLICY "Allow all access on rentals"
ON public.rentals FOR ALL TO public
USING (true) WITH CHECK (true);

-- ============================================================
-- 4. SÜRE UZATMALAR TABLOSU (rental_extensions)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rental_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
    extension_type TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    payment_note TEXT,
    old_end_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rental_extensions_rental_id ON public.rental_extensions(rental_id);

ALTER TABLE public.rental_extensions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on rental_extensions" ON public.rental_extensions;
CREATE POLICY "Allow all on rental_extensions" 
ON public.rental_extensions FOR ALL TO public 
USING (true) WITH CHECK (true);

-- ============================================================
-- 5. AYARLAR TABLOSU (settings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_name TEXT NOT NULL DEFAULT 'Yasin Hoca Çalışma Merkezi',
    phone TEXT NOT NULL DEFAULT '0555 123 45 67',
    address TEXT NOT NULL DEFAULT 'Merkez Mah. Üniversite Cad. No: 12/A',
    wifi_name TEXT NOT NULL DEFAULT 'YasinHoca_Calisma',
    wifi_password TEXT NOT NULL DEFAULT 'yh2026calisma',
    weekly_price NUMERIC NOT NULL DEFAULT 750,
    monthly_price NUMERIC NOT NULL DEFAULT 2500,
    yearly_price NUMERIC NOT NULL DEFAULT 25000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
CREATE POLICY "Allow all on settings" 
ON public.settings FOR ALL TO public 
USING (true) WITH CHECK (true);

-- Varsayılan ayar satırı
INSERT INTO public.settings (
    id, library_name, phone, address, wifi_name, wifi_password, weekly_price, monthly_price, yearly_price
)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Yasin Hoca Çalışma Merkezi',
    '0555 123 45 67',
    'Merkez Mah. Üniversite Cad. No: 12/A',
    'YasinHoca_Calisma',
    'yh2026calisma',
    750, 2500, 25000
WHERE NOT EXISTS (SELECT 1 FROM public.settings LIMIT 1);

-- ============================================================
-- 6. KULLANICI PROFİLLERİ (profiles) & AUTH TETİKLEYİCİSİ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read profiles" 
ON public.profiles FOR SELECT TO public 
USING (true);

DROP POLICY IF EXISTS "Allow user update own profile" ON public.profiles;
CREATE POLICY "Allow user update own profile" 
ON public.profiles FOR UPDATE TO public 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
CREATE POLICY "Allow insert on profiles" 
ON public.profiles FOR INSERT TO public 
WITH CHECK (true);

-- Otomatik profil oluşturucu fonksiyon
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

-- ============================================================
-- 7. YEDEKLEME LOGLARI (backup_logs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('json', 'csv', 'excel')),
    file_size TEXT NOT NULL,
    created_by TEXT NOT NULL DEFAULT 'Admin',
    status TEXT NOT NULL DEFAULT 'success',
    record_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON public.backup_logs(created_at DESC);

ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read on backup_logs" ON public.backup_logs;
CREATE POLICY "Allow read on backup_logs" 
ON public.backup_logs FOR SELECT TO public 
USING (true);

DROP POLICY IF EXISTS "Allow insert on backup_logs" ON public.backup_logs;
CREATE POLICY "Allow insert on backup_logs" 
ON public.backup_logs FOR INSERT TO public 
WITH CHECK (true);
