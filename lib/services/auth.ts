// ============================================================
// Auth & Yetkilendirme Servis Katmanı
// lib/services/auth.ts
// Yasin Hoca Çalışma Merkezi - Auth & RBAC (KTP-010)
// ============================================================

import { supabase } from '@/lib/supabase';
import type { DbProfile, UserRole } from '@/lib/types';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Supabase Auth üzerinden e-posta ve şifre ile giriş yapar.
 */
export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (error) {
      console.warn('[auth.service] Giriş hatası:', error.message);
      return { user: null, session: null, error };
    }

    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    console.error('[auth.service] Beklenmeyen giriş hatası:', err);
    return {
      user: null,
      session: null,
      error: { name: 'AuthError', message: err?.message || 'Giriş yapılamadı' } as AuthError,
    };
  }
}

/**
 * Oturumu sonlandırır.
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[auth.service] Çıkış hatası:', error.message);
      return { error };
    }
    return { error: null };
  } catch (err: any) {
    console.error('[auth.service] Beklenmeyen çıkış hatası:', err);
    return { error: err };
  }
}

/**
 * Aktif oturumdaki kullanıcıyı getirir.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch (err) {
    console.warn('[auth.service] getCurrentUser hatası:', err);
    return null;
  }
}

/**
 * Aktif kullanıcının profiles tablosundaki profilini ve rolünü getirir.
 * Tablo henüz oluşturulmamışsa veya profil kaydı yoksa güvenli bir profil objesi üretir.
 */
export async function getCurrentProfile(): Promise<DbProfile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[auth.service] Profil sorgusu başarısız (fallback üretiliyor):', error.message);
      // Fallback profil: user metadata veya e-posta bazlı
      const role: UserRole = (user.user_metadata?.role as UserRole) || 'admin';
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
        role,
        created_at: user.created_at || new Date().toISOString(),
      };
    }

    if (!data) {
      // Profil tablosunda henüz kayıt yoksa kullanıcı bilgileriyle oluşturmayı dene
      const fallbackRole: UserRole = (user.user_metadata?.role as UserRole) || 'admin';
      const newProfile: DbProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Kullanıcı',
        role: fallbackRole,
        created_at: new Date().toISOString(),
      };

      try {
        await db.from('profiles').insert(newProfile);
      } catch (insertErr) {
        console.warn('[auth.service] Otomatik profil oluşturulamadı:', insertErr);
      }

      return newProfile;
    }

    return {
      id: String(data.id),
      email: String(data.email),
      full_name: data.full_name ? String(data.full_name) : null,
      role: (data.role as UserRole) || 'staff',
      created_at: String(data.created_at),
    };
  } catch (err: any) {
    console.warn('[auth.service] getCurrentProfile hatası:', err?.message);
    return null;
  }
}
