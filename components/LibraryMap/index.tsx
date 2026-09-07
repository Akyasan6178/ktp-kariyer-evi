'use client';

// ============================================================
// LibraryMap – Gerçek Kütüphane Kat Planı (KTP-012)
// Referans mimari çizime birebir sadık kalınarak yeniden tasarlandı.
// Kütüphane TEK BÜYÜK ODADIR:
// - Sol girintide A Masaları (4 sütun x 3 sıra = 12 masa)
// - Ortada B Masaları (2 kolon x 11 sıra = 22 masa)
// - Sağda Cam Kenarında C Masaları (1 kolon x 16 sıra = 16 masa)
// - Sağ kenarda CAM CEPHE (mavi çizgi)
// - Alt kısımda YASİN HOCA alanı (sarı kutu)
// - Dış sınırları belirleyen kalın siyah duvarlar
// ============================================================

import React, { useMemo } from 'react';
import type { DeskWithRental } from '@/lib/types';
import { DeskCard } from '@/components/DeskCard';
import { DeskTooltip } from '@/components/DeskTooltip';
import { Loader2, AlertCircle } from 'lucide-react';

interface LibraryMapProps {
  desks: DeskWithRental[];
  loading: boolean;
  error: string | null;
  onDeskClick: (desk: DeskWithRental) => void;
}

// ── MASA KOORDİNAT SİSTEMİ (X, Y) ─────────────────────────────
// Koordinat tablosu (Gelecekte masa yerleri buradan serbestçe değiştirilebilir)
// Koordinat uzayı: 630 x 800
const DESK_COORDINATES: Record<string, { x: number; y: number }> = {
  // A MASALARI: Sol alanda 4 sütun x 3 sıra
  // Sütunlar: 75, 115, 155, 195 | Sıralar: 250, 310, 370
  A1: { x: 75, y: 250 },
  A2: { x: 115, y: 250 },
  A3: { x: 155, y: 250 },
  A4: { x: 195, y: 250 },

  A5: { x: 75, y: 310 },
  A6: { x: 115, y: 310 },
  A7: { x: 155, y: 310 },
  A8: { x: 195, y: 310 },

  A9: { x: 75, y: 370 },
  A10: { x: 115, y: 370 },
  A11: { x: 155, y: 370 },
  A12: { x: 195, y: 370 },

  // B MASALARI: Ortada 2 kolon x 11 sıra
  // Kolon 1: x = 310 | Kolon 2: x = 352
  B1: { x: 310, y: 135 },
  B2: { x: 352, y: 135 },
  B3: { x: 310, y: 187 },
  B4: { x: 352, y: 187 },
  B5: { x: 310, y: 239 },
  B6: { x: 352, y: 239 },
  B7: { x: 310, y: 291 },
  B8: { x: 352, y: 291 },
  B9: { x: 310, y: 343 },
  B10: { x: 352, y: 343 },
  B11: { x: 310, y: 395 },
  B12: { x: 352, y: 395 },
  B13: { x: 310, y: 447 },
  B14: { x: 352, y: 447 },
  B15: { x: 310, y: 499 },
  B16: { x: 352, y: 499 },
  B17: { x: 310, y: 551 },
  B18: { x: 352, y: 551 },
  B19: { x: 310, y: 603 },
  B20: { x: 352, y: 603 },
  B21: { x: 310, y: 655 },
  B22: { x: 352, y: 655 },

  // C MASALARI: Sağda cam kenarında tek kolon x 16 sıra
  // Kolon: x = 505
  C1: { x: 505, y: 65 },
  C2: { x: 505, y: 106 },
  C3: { x: 505, y: 147 },
  C4: { x: 505, y: 188 },
  C5: { x: 505, y: 229 },
  C6: { x: 505, y: 270 },
  C7: { x: 505, y: 311 },
  C8: { x: 505, y: 352 },
  C9: { x: 505, y: 393 },
  C10: { x: 505, y: 434 },
  C11: { x: 505, y: 475 },
  C12: { x: 505, y: 516 },
  C13: { x: 505, y: 557 },
  C14: { x: 505, y: 598 },
  C15: { x: 505, y: 639 },
  C16: { x: 505, y: 680 },
};

// Masa kutu genişlik ve yükseklik değerleri (koordinat merkezleme için)
const DESK_WIDTH = 32;
const DESK_HEIGHT = 26;

// ── Durum Göstergesi (Legend) ─────────────────────────────────
function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-2 px-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-[2px] bg-emerald-500 border border-emerald-700 shadow-sm" />
        <span className="font-semibold text-slate-700">Boş</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-[2px] bg-rose-500 border border-rose-700 shadow-sm" />
        <span className="font-semibold text-slate-700">Dolu</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-[2px] bg-amber-400 border border-amber-600 shadow-sm" />
        <span className="font-semibold text-slate-700">Askıda</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-[2px] bg-sky-500 border border-sky-700 shadow-sm" />
        <span className="font-semibold text-slate-700">Dolmak Üzere (&le;7 Gün)</span>
      </div>
    </div>
  );
}

export function LibraryMap({ desks, loading, error, onDeskClick }: LibraryMapProps) {
  // Masaları kodlarına göre hızlı erişim için haritala
  const deskMap = useMemo(() => {
    const map = new Map<string, DeskWithRental>();
    for (const d of desks || []) {
      const code = (d.code || '').trim().toUpperCase();
      map.set(code, d);
    }
    return map;
  }, [desks]);

  // Hata durumu
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-semibold text-sm">Kat planı yüklenirken hata oluştu:</p>
        <p className="text-xs text-red-500 mt-1 font-mono">{error}</p>
      </div>
    );
  }

  // Yükleniyor durumu
  if (loading && desks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
        <p className="font-bold text-slate-700 text-sm">Kütüphane Kat Planı Hazırlanıyor...</p>
        <p className="text-xs text-slate-400 mt-1">50 masa koordinat sistemiyle yükleniyor</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full select-none">
      {/* Üst Durum Çubuğu */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[630px]">
        <StatusLegend />
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          50 Masa &bull; Tek Salon
        </div>
      </div>

      {/* ============================================================ */}
      {/* MİMARİ KAT PLANI KROKİSİ                                      */}
      {/* Referans çizimdeki duvarlar, cam cephe, Yasin Hoca alanı      */}
      {/* Koordinat Boyutu: 630px genişlik x 800px yükseklik           */}
      {/* ============================================================ */}
      <div className="relative w-full max-w-[630px] aspect-[630/800] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center p-2">
        {/* SVG Arka Plan: Dış Duvarlar, Cam Cephe, Yasin Hoca Odası */}
        <svg
          viewBox="0 0 630 800"
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* İnce iç zemin çizgileri / grid (hafif kroki dokusu) */}
          <defs>
            <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="630" height="800" fill="url(#blueprint-grid)" />

          {/* ============================================================ */}
          {/* 1. YASİN HOCA ALANI (Alt kısımdaki Sarı Oda)                  */}
          {/* ============================================================ */}
          {/* Sarı dolgulu oda */}
          <rect
            x="390"
            y="720"
            width="80"
            height="55"
            fill="#facc15"
            stroke="#000000"
            strokeWidth="7"
            strokeLinejoin="miter"
          />
          {/* Yasin Hoca Metni */}
          <text
            x="430"
            y="754"
            textAnchor="middle"
            fill="#000000"
            fontSize="10"
            fontWeight="900"
            letterSpacing="1"
            fontFamily="system-ui, sans-serif"
          >
            YASİN HOCA
          </text>

          {/* ============================================================ */}
          {/* 2. TEK BÜYÜK ODA DIŞ DUVARLARI (Kalın Siyah Çizgiler)        */}
          {/* Çizimdeki şekil: Sol girintili ve sağ dikey ana salonlu kroki */}
          {/* ============================================================ */}
          {/* Dış duvar poligon çizgisi (Sağ cam cephe açıklığı hariç) */}
          <polyline
            points="
              560,60
              560,30
              220,30
              220,200
              40,200
              40,420
              220,420
              220,720
              390,720
            "
            fill="none"
            stroke="#000000"
            strokeWidth="8"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Yasin Hoca sağındaki alt duvar ve sağ alt köşe duvarı */}
          <polyline
            points="
              470,720
              560,720
              560,690
            "
            fill="none"
            stroke="#000000"
            strokeWidth="8"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* ============================================================ */}
          {/* 3. CAM CEPHE (Sağ kenardaki boydan boya Mavi Hat)            */}
          {/* ============================================================ */}
          <line
            x1="560"
            y1="60"
            x2="560"
            y2="690"
            stroke="#0ea5e9"
            strokeWidth="10"
            strokeLinecap="square"
          />

          {/* Cam Cephe Dikey Etiketi */}
          <g transform="translate(582, 375) rotate(90)">
            <rect
              x="-65"
              y="-10"
              width="130"
              height="20"
              rx="4"
              fill="#e0f2fe"
              stroke="#bae6fd"
              strokeWidth="1"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#0284c7"
              fontSize="10"
              fontWeight="900"
              letterSpacing="2.5"
              fontFamily="system-ui, sans-serif"
            >
              CAM CEPHE
            </text>
          </g>

          {/* Bölge Rehber Etiketleri (Hafif ve şık arka plan metinleri) */}
          <text
            x="135"
            y="225"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="800"
            letterSpacing="2"
            fontFamily="system-ui, sans-serif"
          >
            A BÖLGESİ
          </text>
          <text
            x="331"
            y="110"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="800"
            letterSpacing="2"
            fontFamily="system-ui, sans-serif"
          >
            B BÖLGESİ
          </text>
          <text
            x="505"
            y="45"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontWeight="800"
            letterSpacing="2"
            fontFamily="system-ui, sans-serif"
          >
            C BÖLGESİ
          </text>
        </svg>

        {/* ============================================================ */}
        {/* 4. MASALAR (Koordinat Sistemine Göre Kesin Yerleşim)          */}
        {/* A1..A12, B1..B22, C1..C16                                   */}
        {/* Tooltip + Tıklama + Renk Durumu Tam Korundu                  */}
        {/* ============================================================ */}
        <div className="absolute inset-0 w-full h-full">
          {Object.entries(DESK_COORDINATES).map(([code, coords]) => {
            const desk = deskMap.get(code);

            // Koordinat yüzdesi (Responsive % yerleşim)
            const leftPercent = (coords.x / 630) * 100;
            const topPercent = (coords.y / 800) * 100;

            if (!desk) {
              // Veritabanında henüz bulunmuyorsa placeholder
              return (
                <div
                  key={code}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[30px] h-[24px] sm:w-[32px] sm:h-[26px] rounded-[3px] border border-slate-300 bg-slate-200/50 text-[9px] font-bold text-slate-400 select-none"
                  style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                >
                  {code}
                </div>
              );
            }

            return (
              <div
                key={desk.id || code}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
              >
                <DeskTooltip desk={desk}>
                  <div>
                    <DeskCard desk={desk} onClick={onDeskClick} />
                  </div>
                </DeskTooltip>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
