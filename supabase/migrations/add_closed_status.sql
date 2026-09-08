-- ============================================================
-- KTP-018B: desks tablosuna 'closed' (Kapalı Koltuk) durumu ekleme
-- Yasin Hoca Çalışma Merkezi - Supabase SQL Migration
-- ============================================================

-- 1. Mevcut check kısıtlamasını kaldır
ALTER TABLE public.desks DROP CONSTRAINT IF EXISTS desks_status_check;

-- 2. 'closed' durumunu içeren yeni check kısıtlamasını ekle
ALTER TABLE public.desks ADD CONSTRAINT desks_status_check 
  CHECK (status IN ('available', 'occupied', 'suspended', 'expiring', 'closed'));

COMMENT ON CONSTRAINT desks_status_check ON public.desks IS 
  'Masa durumları: available (Boş), occupied (Dolu), suspended (Askıda), expiring (Dolmak Üzere), closed (Kapalı/Kullanım Dışı)';
