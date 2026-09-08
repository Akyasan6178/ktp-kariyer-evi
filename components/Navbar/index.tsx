'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Map,
  Users,
  BarChart3,
  Settings,
  Database,
  QrCode,
  RefreshCw,
  Calendar,
  LogOut,
  Crown,
  UserCheck,
  BookOpenCheck,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onRefresh?: () => void;
}

export function Navbar({ onRefresh }: NavbarProps) {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Rol bazlı navigasyon filtreleme:
  // Staff sadece Kat Planı ve Kiralamalar'ı görür.
  // Admin tüm sayfaları görür.
  const allNavItems = [
    {
      label: 'Kat Planı',
      href: '/',
      icon: Map,
      active: pathname === '/',
      adminOnly: false,
    },
    {
      label: 'Kiralama Yönetimi',
      href: '/rentals',
      icon: Users,
      active: pathname.startsWith('/rentals'),
      adminOnly: false,
    },
    {
      label: 'Raporlar',
      href: '/reports',
      icon: BarChart3,
      active: pathname.startsWith('/reports'),
      adminOnly: true,
    },
    {
      label: 'Ayarlar',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
      adminOnly: true,
    },
    {
      label: 'Yedekleme',
      href: '/backup',
      icon: Database,
      active: pathname.startsWith('/backup'),
      adminOnly: true,
    },
    {
      label: 'QR Kodlar',
      href: '/qr',
      icon: QrCode,
      active: pathname.startsWith('/qr'),
      adminOnly: true,
    },
    {
      label: 'Nasıl Kullanılır',
      href: '/guide',
      icon: BookOpenCheck,
      active: pathname.startsWith('/guide'),
      adminOnly: false,
    },
  ];

  const visibleNavItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const displayName =
    profile?.full_name ||
    profile?.email?.split('@')[0] ||
    user?.email?.split('@')[0] ||
    'Kullanıcı';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-2">
            {/* Sol: Logo & Başlık */}
            <div className="flex items-center gap-2 sm:gap-6 min-w-0">
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-900 transition-transform group-hover:scale-105 shadow-sm">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="truncate">
                  <h1 className="text-sm sm:text-[15px] font-bold text-slate-900 leading-none truncate">
                    Kütüphane Yönetimi
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-none">
                    Kariyer Evi VIP
                  </p>
                </div>
              </Link>

              {/* Masaüstü Navigasyon Linkleri (Geniş ekranlar) */}
              <nav className="hidden xl:flex items-center gap-1 ml-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                        item.active
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Orta – Tarih (Yalnızca büyük ekranlarda) */}
            <div className="hidden 2xl:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">{today}</span>
            </div>

            {/* Sağ – Kullanıcı Bilgisi, Yenile & Hamburger Butonu */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  title="Verileri yenile"
                  className="group flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95"
                  aria-label="Verileri yenile"
                >
                  <RefreshCw className="h-4 w-4 sm:h-3.5 sm:w-3.5 transition-transform group-hover:rotate-180 duration-500" />
                </button>
              )}

              {user && (
                <div className="flex items-center gap-2 sm:gap-2.5 sm:pl-2 sm:border-l sm:border-slate-200">
                  {/* Kullanıcı Adı & Rol Rozeti (Tablet ve Desktop) */}
                  <div className="hidden md:flex flex-col items-end text-right">
                    <span className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">
                      {displayName}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/80">
                          <Crown className="h-2.5 w-2.5 text-amber-600" />
                          <span>Yönetici</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200/80">
                          <UserCheck className="h-2.5 w-2.5 text-blue-600" />
                          <span>Personel</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex h-8 w-8 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs shrink-0',
                      isAdmin
                        ? 'bg-gradient-to-tr from-amber-600 to-amber-500'
                        : 'bg-gradient-to-tr from-slate-800 to-slate-700',
                    )}
                    title={`${displayName} (${isAdmin ? 'Yönetici' : 'Personel'})`}
                  >
                    {displayName.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Çıkış Yap Butonu (Desktop) */}
                  <button
                    onClick={signOut}
                    title="Güvenli Çıkış Yap"
                    className="hidden sm:flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95"
                  >
                    <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600" />
                    <span>Çıkış</span>
                  </button>
                </div>
              )}

              {/* Hamburger Butonu (Mobil & Tablet < xl) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex xl:hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all shadow-xs"
                aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobil & Tablet Drawer Açılır Menü */}
        {mobileMenuOpen && (
          <div className="xl:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-start animate-in fade-in duration-200">
            <div
              className="bg-white border-b border-slate-200 shadow-2xl max-h-[calc(100dvh-4rem)] overflow-y-auto touch-scroll flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menü Başlık & Tarih */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-600">{today}</span>
                </div>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200/80">
                    <Crown className="h-3 w-3 text-amber-600" />
                    <span>Yönetici Paneli</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 border border-blue-200/80">
                    <UserCheck className="h-3 w-3 text-blue-600" />
                    <span>Personel Paneli</span>
                  </span>
                )}
              </div>

              {/* Sayfa Linkleri Listesi (Min 44px touch target) */}
              <nav className="p-3 space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all min-h-[48px] active:scale-[0.98]',
                        item.active
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-100',
                      )}
                    >
                      <Icon className={cn('h-5 w-5 shrink-0', item.active ? 'text-white' : 'text-slate-500')} />
                      <span className="flex-1">{item.label}</span>
                      {item.active && (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-xs" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Alt Alan: Kullanıcı Bilgisi & Çıkış Yap Butonu */}
              {user && (
                <div className="p-4 border-t border-slate-200 bg-slate-50 mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs',
                          isAdmin
                            ? 'bg-gradient-to-tr from-amber-600 to-amber-500'
                            : 'bg-gradient-to-tr from-slate-800 to-slate-700',
                        )}
                      >
                        {displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">{displayName}</span>
                        <span className="text-[11px] text-slate-500">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-semibold text-sm hover:bg-rose-100 active:scale-[0.99] transition-all"
                  >
                    <LogOut className="h-4 w-4 text-rose-600" />
                    <span>Güvenli Çıkış Yap</span>
                  </button>
                </div>
              )}
            </div>
            {/* Backdrop click to dismiss */}
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}
      </header>
      {/* Powered by Akyasan */}
      <div className="bg-slate-900 border-b border-slate-800 py-1 px-3 sm:px-6">
        <p className="text-center text-[10px] text-slate-500 tracking-widest font-medium uppercase">
          Powered by Akyasan
        </p>
      </div>
    </>
  );
}

