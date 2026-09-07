-- ============================================================
-- Migration: Create rental_extensions table
-- Yasin Hoca Kütüphane Sistemi - Süre Uzatma & Finansal Kayıtlar
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

-- Index for fast queries by rental_id
CREATE INDEX IF NOT EXISTS idx_rental_extensions_rental_id 
ON public.rental_extensions(rental_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.rental_extensions ENABLE ROW LEVEL SECURITY;

-- Allow public access for anon client
DROP POLICY IF EXISTS "Allow all on rental_extensions" ON public.rental_extensions;
CREATE POLICY "Allow all on rental_extensions" 
ON public.rental_extensions 
FOR ALL 
TO public 
USING (true) 
WITH CHECK (true);
