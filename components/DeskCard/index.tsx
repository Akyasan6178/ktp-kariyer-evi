'use client';

// ============================================================
// DeskCard – Kat Planı Masa Butonu
// KTP-005: 7 gün veya daha az kalan aktif masalar
// desk.status değişmeden kat planında MAVİ (expiring) gösterilir.
// ============================================================

import type { DeskWithRental, DeskStatus } from '@/lib/types';
import { getDeskDisplayStatus } from '@/lib/utils/rentalStatus';
import { cn } from '@/lib/utils';

interface DeskCardProps {
  desk: DeskWithRental;
  onClick: (desk: DeskWithRental) => void;
  className?: string;
}

// ============================================================
// Renk Kuralları (Kullanıcı Şartnamesi):
// available  = yeşil
// occupied   = kırmızı
// suspended  = sarı
// expiring   = mavi (7 gün veya daha az kalanlar)
// ============================================================
const STATUS_STYLES: Record<
  DeskStatus,
  { bg: string; border: string; text: string; shadow: string }
> = {
  available: {
    bg: 'bg-emerald-500 hover:bg-emerald-600',
    border: 'border-emerald-700',
    text: 'text-white',
    shadow: 'hover:shadow-emerald-500/40',
  },
  occupied: {
    bg: 'bg-rose-500 hover:bg-rose-600',
    border: 'border-rose-700',
    text: 'text-white',
    shadow: 'hover:shadow-rose-500/40',
  },
  suspended: {
    bg: 'bg-amber-400 hover:bg-amber-500',
    border: 'border-amber-600',
    text: 'text-slate-900',
    shadow: 'hover:shadow-amber-500/40',
  },
  expiring: {
    bg: 'bg-sky-500 hover:bg-sky-600',
    border: 'border-sky-700',
    text: 'text-white',
    shadow: 'hover:shadow-sky-500/40',
  },
  closed: {
    bg: 'bg-slate-400 hover:bg-slate-500',
    border: 'border-slate-600',
    text: 'text-white',
    shadow: 'hover:shadow-slate-500/40',
  },
};

export function DeskCard({ desk, onClick, className }: DeskCardProps) {
  // Dinamik harita görünüm durumu (7 gün kala maviye döner)
  const displayStatus = getDeskDisplayStatus(desk);
  const style = STATUS_STYLES[displayStatus] ?? STATUS_STYLES.available;

  return (
    <button
      type="button"
      onClick={() => onClick(desk)}
      className={cn(
        'relative flex items-center justify-center select-none',
        'w-[30px] h-[24px] sm:w-[32px] sm:h-[26px] rounded-[3px] border transition-all duration-150',
        'cursor-pointer hover:scale-115 active:scale-95 hover:z-30 hover:shadow-md',
        'before:absolute before:-inset-2 sm:before:-inset-1 before:content-[\'\']',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-700',
        style.bg,
        style.border,
        style.text,
        style.shadow,
        className,
      )}
      aria-label={`Masa ${desk.code} (${displayStatus})`}
    >
      <span className="text-[9px] sm:text-[10px] font-black tracking-tight leading-none pointer-events-none">
        {desk.code}
      </span>
    </button>
  );
}

