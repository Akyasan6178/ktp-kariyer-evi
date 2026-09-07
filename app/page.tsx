'use client';

import { StatisticsCards } from '@/components/StatisticsCards';
import { LibraryMap } from '@/components/LibraryMap';
import { DeskDetailsPanel } from '@/components/DeskDetailsPanel';
import { useDesks } from '@/hooks/useDesk';
import { BookOpen, Settings, Bell, RefreshCw, Calendar } from 'lucide-react';

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

  console.log('[HomePage] Render edildi:', {
    toplamMasa: desks.length,
    loading,
    error,
    stats,
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===== HEADER ===== */}
      <Navbar onRefresh={refetch} />

      {/* ===== ANA İÇERİK ===== */}
      <main className="mx-auto max-w-screen-2xl px-6 py-6 space-y-6">

        {/* Sayfa başlığı & breadcrumb */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-slate-600 font-medium">Kütüphane Haritası</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Kütüphane Haritası</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading
                ? 'Masalar yükleniyor…'
                : `${desks.length} masanın gerçek zamanlı doluluk durumu`}
            </p>
          </div>

          {/* Hızlı filtre butonları (UI only) */}
          <div className="hidden sm:flex items-center gap-2">
            {(['Tümü', 'Boş', 'Dolu', 'Askıda'] as const).map((filter, i) => (
              <button
                key={filter}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  i === 0
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* İstatistik Kartları */}
        <StatisticsCards stats={stats} />

        {/* Kütüphane Kat Planı Kartı */}
        <div className="max-w-5xl mx-auto w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Kart Başlığı */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-slate-800">Kütüphane Kat Planı</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {loading ? 'YÜKLENİYOR' : 'CANLI PLAN'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Masaya tıklayarak kiralama / detay görüntüleyin</span>
            </div>
          </div>

          <div className="p-6">
            <LibraryMap
              desks={desks}
              loading={loading}
              error={error}
              onDeskClick={handleDeskClick}
            />
          </div>
        </div>

        {/* Alt bilgi */}
        <div className="pb-6 flex items-center justify-between text-[11px] text-slate-400">
          <span>© 2025 Kütüphane Yönetim Sistemi · Yasin Hoca</span>
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
