'use client';

// ============================================================
// /login – Profesyonel Giriş Ekranı (KTP-010)
// Yasin Hoca Çalışma Merkezi - Auth & RBAC
// ============================================================

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { signIn, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signIn({
        email: email.trim(),
        password,
      });

      if (!res.success) {
        setErrorMessage(
          res.error === 'Invalid login credentials'
            ? 'Geçersiz e-posta veya şifre. Lütfen bilgilerinizi kontrol edin.'
            : res.error || 'Giriş yapılamadı.',
        );
        toast.error('Giriş başarısız oldu.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Giriş sırasında beklenmeyen bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Arka plan parlama efektleri */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-10 -z-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="w-full max-w-md space-y-8">
        {/* Üst Logo ve Başlık */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-xl shadow-emerald-900/30">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Yasin Hoca Çalışma Merkezi
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
            Kütüphane Yönetim ve Takip Sistemi &bull; Güvenli Giriş
          </p>
        </div>

        {/* Giriş Kartı */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Hata Uyarısı */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* E-Posta */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                E-Posta Adresi
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yasinhoca.com"
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Şifre */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300"
              >
                Şifre
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-11 text-sm text-white placeholder:text-slate-500 transition focus:border-emerald-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  title={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Beni Hatırla */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-400 select-none">
                  Beni Hatırla
                </span>
              </label>

              <span className="text-[11px] text-slate-500">
                Rol: Yönetici / Personel
              </span>
            </div>

            {/* Giriş Butonu */}
            <button
              type="submit"
              disabled={isSubmitting || authLoading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 text-white" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          {/* Alt Güvenlik Notu */}
          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>256-bit SSL ve Supabase Auth ile korunmaktadır</span>
            </div>
          </div>
        </div>

        {/* Bilgilendirme Rozeti */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5 text-center text-xs text-slate-400">
          İlk kez giriş yapıyorsanız veya şifrenizi unuttuysanız sistem yöneticisiyle iletişime geçiniz.
        </div>
      </div>
    </div>
  );
}
