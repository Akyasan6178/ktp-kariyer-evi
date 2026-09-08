'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DeskWithRental, DeskStatus } from '@/lib/types';
import { CalendarDays, User, Users, CreditCard, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeskTooltipProps {
  desk: DeskWithRental;
  children: React.ReactNode;
}

// Ödeme durumu → Türkçe etiket + renk
const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Beklemede',
  deposit: 'Kapora Alındı',
  paid: 'Ödendi',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  deposit: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function DeskTooltip({ desk, children }: DeskTooltipProps) {
  const rental = desk.active_rental;

  return (
    <Tooltip>
      <TooltipTrigger render={<div />}>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="w-64 p-0 overflow-hidden rounded-xl border border-slate-200 shadow-xl bg-white text-left"
      >
        {/* Başlık */}
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-slate-300" />
            <span className="text-sm font-bold text-white">Masa {desk.code}</span>
          </div>
          <StatusBadge status={desk.status} />
        </div>

        {/* İçerik */}
        {rental ? (
          <div className="px-4 py-3 space-y-2.5">
            {/* Öğrenci */}
            <div className="flex items-center gap-2.5">
              <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 leading-none">Öğrenci</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">
                  {rental.student.full_name}
                </p>
              </div>
            </div>

            {/* Grup */}
            <div className="flex items-center gap-2.5">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 leading-none">Grup</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {rental.student.group_type}
                </p>
              </div>
            </div>

            {/* Bitiş Tarihi */}
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 leading-none">Bitiş Tarihi</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {new Date(rental.end_date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Ödeme Durumu */}
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 leading-none mb-1">Ödeme Durumu</p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                    PAYMENT_COLORS[rental.payment_status],
                  )}
                >
                  {PAYMENT_LABEL[rental.payment_status] ?? rental.payment_status}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">Bu masa müsait</p>
          </div>
        )}

        {/* Alt bilgi */}
        <div className="border-t border-slate-100 px-4 py-2">
          <p className="text-[10px] text-slate-400 text-center">
            Detay için masaya tıklayın
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function StatusBadge({ status }: { status: DeskStatus }) {
  const CONFIG: Record<DeskStatus, { label: string; className: string }> = {
    available: { label: 'Boş', className: 'bg-emerald-500 text-white' },
    occupied: { label: 'Dolu', className: 'bg-red-500 text-white' },
    suspended: { label: 'Askıda', className: 'bg-amber-500 text-white' },
    expiring: { label: 'Dolmak Üzere', className: 'bg-blue-500 text-white' },
  };
  const c = CONFIG[status];
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', c.className)}>
      {c.label}
    </span>
  );
}
