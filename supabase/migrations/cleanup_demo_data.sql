-- ============================================================
-- KTP-018C: Teslim Öncesi Demo / Test Verilerini Temizleme SQL'i
-- Yasin Hoca Çalışma Merkezi - Supabase SQL Editor
-- ============================================================

-- 1. Süre uzatmalarını temizle
DELETE FROM public.rental_extensions;

-- 2. Kiralamaları temizle
DELETE FROM public.rentals;

-- 3. Öğrencileri temizle
DELETE FROM public.students;

-- 4. Test yedekleme loglarını temizle
DROP POLICY IF EXISTS "Allow delete on backup_logs" ON public.backup_logs;
CREATE POLICY "Allow delete on backup_logs" ON public.backup_logs FOR DELETE TO public USING (true);
DELETE FROM public.backup_logs;

-- 5. Tüm 50 masayı 'available' (Boş) durumuna getir
UPDATE public.desks SET status = 'available';

-- ============================================================
-- KORUNAN TABLOLAR (Kesinlikle dokunulmaz):
-- - public.desks (50 masa tanımı, bölgesi ve koordinatları)
-- - public.settings (Kurum bilgileri, Wi-Fi ve fiyat tarifesi)
-- - public.profiles (Admin kullanıcıları ve rolleri)
-- - auth.users (Giriş hesapları)
-- ============================================================
