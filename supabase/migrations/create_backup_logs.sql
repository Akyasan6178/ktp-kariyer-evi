-- ============================================================
-- Migration: Create backup_logs table
-- Yasin Hoca Kütüphane Sistemi - Yedekleme Sistemi (KTP-011)
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

-- Index for fast sorting by date
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at 
ON public.backup_logs(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and anon read/write
DROP POLICY IF EXISTS "Allow read on backup_logs" ON public.backup_logs;
CREATE POLICY "Allow read on backup_logs" 
ON public.backup_logs 
FOR SELECT 
TO public 
USING (true);

DROP POLICY IF EXISTS "Allow insert on backup_logs" ON public.backup_logs;
CREATE POLICY "Allow insert on backup_logs" 
ON public.backup_logs 
FOR INSERT 
TO public 
WITH CHECK (true);
