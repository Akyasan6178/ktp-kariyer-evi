-- ============================================================
-- Migration: Create profiles table & Auth triggers
-- Yasin Hoca Kütüphane Sistemi - Auth & Yetkilendirme (KTP-010)
-- ============================================================

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

-- Herkes profilleri okuyabilir (giriş yapan kullanıcı kendi rolünü ve diğer personeli görebilir)
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read profiles" 
ON public.profiles 
FOR SELECT 
TO public 
USING (true);

-- Kullanıcı sadece kendi profilini güncelleyebilir
DROP POLICY IF EXISTS "Allow user update own profile" ON public.profiles;
CREATE POLICY "Allow user update own profile" 
ON public.profiles 
FOR UPDATE 
TO public 
USING (auth.uid() = id);

-- Profil ekleme izni
DROP POLICY IF EXISTS "Allow insert on profiles" ON public.profiles;
CREATE POLICY "Allow insert on profiles" 
ON public.profiles 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 3. auth.users tablosuna kullanıcı eklendiğinde otomatik profile oluşturan Trigger
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

-- Trigger'ı auth.users üzerine bağla
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
