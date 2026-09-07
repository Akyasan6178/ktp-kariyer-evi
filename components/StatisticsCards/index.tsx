'use client';

// ============================================================
// İstatistik Kartları Bileşeni (Dashboard)
// KTP-005: "Yakında Bitecekler" ve "Süresi Dolanlar" kartları
// gerçek zamanlı hesaplanır.
// ============================================================

import type { LibraryStats } from '@/lib/types';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Hourglass,
  AlertOctagon,
} from 'lucide-react';

interface StatisticsCardsProps {
  stats: LibraryStats;
}

interface StatCard {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
  description: string;
}

export function StatisticsCards({ stats }: StatisticsCardsProps) {
  const cards: StatCard[] = [
    {
      label: 'Toplam Masa',
      value: stats.total,
      icon: BookOpen,
      colorClass: 'text-slate-800',
      bgClass: 'bg-slate-50',
      borderClass: 'border-slate-200',
      badgeClass: 'bg-slate-200/80 text-slate-700',
      description: 'Kütüphanedeki tüm masalar',
    },
    {
      label: 'Boş Masa',
      value: stats.available,
      icon: CheckCircle2,
      colorClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50/70',
      borderClass: 'border-emerald-200',
      badgeClass: 'bg-emerald-100 text-emerald-700',
      description: 'Müsait ve kiralanabilir',
    },
    {
      label: 'Dolu Masa',
      value: stats.occupied,
      icon: XCircle,
      colorClass: 'text-rose-700',
      bgClass: 'bg-rose-50/70',
      borderClass: 'border-rose-200',
      badgeClass: 'bg-rose-100 text-rose-700',
      description: 'Aktif kullanımda olan',
    },
    {
      label: 'Yakında Bitecekler',
      value: stats.expiring,
      icon: Hourglass,
      colorClass: 'text-orange-700',
      bgClass: 'bg-orange-50/70',
      borderClass: 'border-orange-200',
      badgeClass: 'bg-orange-100 text-orange-700',
      description: '≤ 7 gün kalan kiralamalar',
    },
    {
      label: 'Süresi Dolanlar',
      value: stats.expiredCount || 0,
      icon: AlertOctagon,
      colorClass: 'text-red-700',
      bgClass: 'bg-red-50/70',
      borderClass: 'border-red-200',
      badgeClass: 'bg-red-100 text-red-700',
      description: 'Süresi bitmiş kayıtlar',
    },
    {
      label: 'Askıda',
      value: stats.suspended,
      icon: AlertTriangle,
      colorClass: 'text-yellow-800',
      bgClass: 'bg-yellow-50/80',
      borderClass: 'border-yellow-200',
      badgeClass: 'bg-yellow-100 text-yellow-800',
      description: 'Durdurulmuş / onay bekleyen',
    },
  ];

  const occupancyRate =
    stats.total > 0
      ? Math.round(
          ((stats.occupied + stats.expiring + stats.suspended) / stats.total) * 100,
        )
      : 0;

  return (
    <div className="space-y-4">
      {/* 6'lı İstatistik Grid'i */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-xl border ${card.borderClass} ${card.bgClass} p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-black mt-1 ${card.colorClass}`}>{card.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${card.badgeClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                <p className="text-[10px] text-slate-400 truncate">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Doluluk oranı özeti */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
        <span className="text-xs font-medium text-slate-500">Kütüphane genel doluluk oranı:</span>
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all duration-700"
            style={{ width: `${occupancyRate}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-800">%{occupancyRate}</span>
      </div>
    </div>
  );
}
