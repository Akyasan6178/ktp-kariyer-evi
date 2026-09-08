'use client';

import { StatisticsCards } from '@/components/StatisticsCards';
import { LibraryMap } from '@/components/LibraryMap';
import { DeskDetailsPanel } from '@/components/DeskDetailsPanel';
import { useDesks } from '@/hooks/useDesk';


import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  const {
    desks,
    loading,
    error,
    stats,
    selectedDesk,
    isPanelOpen,
    handleDeskClick,
    handlePanelClose,
    refetch,
  } = useDesks();



  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== HEADER ===== */}
      <Navbar onRefresh={refetch} />

      {/* ===== ANA İÇERİK ===== */}
      <main className="mx-auto max-w-screen-2xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Sayfa başlığı & breadcrumb */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">Kütüphane Haritası</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Kütüphane Haritası</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {loading
                ? 'Masalar yükleniyor…'
                : `${desks.length} masanın gerçek zamanlı doluluk durumu`}
            </p>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <StatisticsCards stats={stats} />

        {/* Kütüphane Kat Planı Kartı */}
        <div className="max-w-5xl mx-auto w-full rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Kart Başlığı */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800">Kütüphane Kat Planı</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {loading ? 'YÜKLENİYOR' : 'CANLI PLAN'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] sm:text-xs text-slate-400">
              <span>Masaya dokunarak kiralama / detay görüntüleyin</span>
            </div>
          </div>

          <div className="p-2 sm:p-6 overflow-x-auto touch-scroll">
            <LibraryMap
              desks={desks}
              loading={loading}
              error={error}
              onDeskClick={handleDeskClick}
            />
          </div>
        </div>

        {/* Alt bilgi */}
        <div className="pb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 text-center sm:text-left">
          <span>© 2026 Kütüphane Yönetim Sistemi</span>
          <span>v2.0.0 · Supabase</span>
        </div>
      </main>

      {/* ===== SLIDE-OVER PANEL ===== */}
      <DeskDetailsPanel
        desk={selectedDesk}
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        onRentalCreated={refetch}
      />
    </div>
  );
}
