-- ============================================================
-- Migration: Create settings table
-- Yasin Hoca Kütüphane Sistemi - Ayarlar Merkezi (KTP-007)
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

-- Sistemde başlangıç için tek satır konfigürasyon ekle (eğer henüz yoksa)
INSERT INTO public.settings (
    id,
    library_name,
    phone,
    address,
    wifi_name,
    wifi_password,
    weekly_price,
    monthly_price,
    yearly_price
)
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Yasin Hoca Çalışma Merkezi',
    '0555 123 45 67',
    'Merkez Mah. Üniversite Cad. No: 12/A',
    'YasinHoca_Calisma',
    'yh2026calisma',
    750,
    2500,
    25000
WHERE NOT EXISTS (
    SELECT 1 FROM public.settings LIMIT 1
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow public access for anon client
DROP POLICY IF EXISTS "Allow all on settings" ON public.settings;
CREATE POLICY "Allow all on settings" 
ON public.settings 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);
