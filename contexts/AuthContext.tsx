'use client';

// ============================================================
// AuthContext & AuthGuard
// Yasin Hoca Çalışma Merkezi - Auth & RBAC (KTP-010)
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  signIn as authSignIn,
  signOut as authSignOut,
  getCurrentProfile,
  type SignInCredentials,
} from '@/lib/services/auth';
import type { DbProfile, UserRole } from '@/lib/types';
import type { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: DbProfile | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  signIn: (credentials: SignInCredentials) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Koruma altındaki sayfalar
const PROTECTED_ROUTES = ['/', '/rentals', '/reports', '/settings', '/backup', '/qr'];
// Sadece adminlerin erişebileceği sayfalar
const ADMIN_ONLY_ROUTES = ['/reports', '/settings', '/backup', '/qr'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  // Profil verisini yükle
  const loadProfile = useCallback(async () => {
    try {
      const prof = await getCurrentProfile();
      setProfile(prof);
    } catch (err) {
      console.warn('[AuthContext] Profil yüklenemedi:', err);
    }
  }, []);

  // Oturum durumunu dinle
  useEffect(() => {
    let mounted = true;

    // İlk oturumu al
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        loadProfile().finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Oturum değişikliklerini dinle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await loadProfile();
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Route Guard – Sayfa Yetkilendirme Kontrolü
  useEffect(() => {
    if (loading) return;

    const isLoginRoute = pathname === '/login';
    const isProtectedRoute = PROTECTED_ROUTES.some(
      (route) => pathname === route || (route !== '/' && pathname.startsWith(route)),
    );

    // 1. Giriş yapılmamışsa ve korunan sayfadaysa -> /login'e yönlendir
    if (!user && isProtectedRoute && !isLoginRoute) {
      router.replace('/login');
      return;
    }

    // 2. Giriş yapılmışsa ve /login sayfasına gidilmeye çalışılıyorsa -> /'a yönlendir
    if (user && isLoginRoute) {
      router.replace('/');
      return;
    }

    // 3. Staff kullanıcısı Admin-only sayfalara girmeye çalışırsa -> /'a yönlendir
    if (user && profile && profile.role === 'staff') {
      const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route));
      if (isAdminRoute) {
        toast.error('Bu sayfaya erişim yetkiniz bulunmamaktadır (Sadece Yöneticiler erişebilir).');
        router.replace('/');
      }
    }
  }, [user, profile, loading, pathname, router]);

  // Giriş yapma fonksiyonu
  const handleSignIn = async (credentials: SignInCredentials) => {
    setLoading(true);
    try {
      const { user: signedUser, error } = await authSignIn(credentials);
      if (error || !signedUser) {
        setLoading(false);
        return { success: false, error: error?.message || 'Giriş yapılamadı' };
      }

      setUser(signedUser);
      await loadProfile();
      toast.success('Giriş başarılı! Hoş geldiniz.');
      router.replace('/');
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err?.message || 'Bilinmeyen hata' };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yapma fonksiyonu
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authSignOut();
      setUser(null);
      setProfile(null);
      toast.info('Oturum kapatıldı.');
      router.replace('/login');
    } catch (err: any) {
      console.error('[AuthContext] Çıkış hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const role = profile?.role || null;
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        isAdmin,
        isStaff,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshProfile: loadProfile,
      }}
    >
      {loading ? (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
            <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
              Yasin Hoca Çalışma Merkezi &bull; Oturum Doğrulanıyor...
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
