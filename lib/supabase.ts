// ============================================================
// Supabase Client
// Gelecekte auth eklendiğinde createServerClient buraya gelir.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// URL temizleme: Sonunda /rest/v1 veya trailing slash varsa otomatik kaldırır
function sanitizeSupabaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const supabaseUrl = sanitizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

// URL doğruluğunu hem istemci hem sunucu loglarında net göster
console.log('[Supabase] Okunan URL:', supabaseUrl ? supabaseUrl : '(BOŞ)');
console.log('[Supabase] Anon Key mevcut:', Boolean(supabaseAnonKey));

// Build zamanında değil, runtime'da kontrol et (sadece client tarafında uyar)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error(
    '[Supabase] Ortam değişkenleri eksik.\n' +
    '.env.local dosyasına NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ekleyin.'
  );
}

// Singleton – her modülde aynı instance kullanılır
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
