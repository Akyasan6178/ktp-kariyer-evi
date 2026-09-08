'use client';

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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';


interface NavbarProps {
  onRefresh?: () => void;
}

export function Navbar({ onRefresh }: NavbarProps) {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut } = useAuth();


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
      <div className="mx-auto max-w-screen-2xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Başlık */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 transition-transform group-hover:scale-105">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 leading-none">
                  Kütüphane Yönetimi
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-none">
                  Kariyer Evi VIP Kütüphane
                </p>
              </div>
            </Link>

            {/* Navigasyon Linkleri */}
            <nav className="hidden sm:flex items-center gap-1.5 ml-4 p-1 bg-slate-100 rounded-xl">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      item.active
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Orta – Tarih */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600">{today}</span>
          </div>

          {/* Sağ – Kullanıcı, Rol & Butonlar */}
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Verileri yenile"
                className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 duration-500" />
              </button>
            )}

            {user && (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                {/* Kullanıcı Adı & Rol Rozeti */}
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
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
                    'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm',
                    isAdmin
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-500'
                      : 'bg-gradient-to-tr from-slate-800 to-slate-700',
                  )}
                  title={`${displayName} (${isAdmin ? 'Yönetici' : 'Personel'})`}
                >
                  {displayName.substring(0, 2).toUpperCase()}
                </div>

                {/* Çıkış Yap Butonu */}
                <button
                  onClick={signOut}
                  title="Güvenli Çıkış Yap"
                  className="group flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                >
                  <LogOut className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-rose-600" />
                  <span className="hidden md:inline">Çıkış</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    {/* Powered by Akyasan */}
    <div className="bg-slate-900 border-b border-slate-800 py-1 px-6">
      <p className="text-center text-[10px] text-slate-500 tracking-widest font-medium uppercase">
        Powered by Akyasan
      </p>
    </div>
  </>);
}

