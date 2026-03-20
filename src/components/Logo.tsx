import React from 'react';
import { cn } from '../lib/utils';

/**
 * Properti pendukung komponen Logo
 */
interface LogoProps {
  className?: string; // Gaya CSS tambahan (opsional)
  size?: number; // Ukuran logo baik lebar maupun tinggi, default 40
  showText?: boolean; // Label teks di samping lambang (default true)
  variant?: 'light' | 'dark'; // Variasi warna disesuaikan dengan latar belakang
}

/**
 * Komponen Logo grafis vektor (SVG) untuk Sekolah Tanah Air.
 * Dirancang skalabel tanpa mengorbankan ketajaman tampilan.
 */
export default function Logo({ className, size = 40, showText = true, variant = 'dark' }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* SVG Kontainer Logo Utama */}
      <div
        className="shrink-0 relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Latar Belakang Oval Utama */}
          <ellipse cx="50" cy="50" rx="48" ry="40" fill="#002129" />

          {/* Teks Melengkung: SEKOLAH TANAH AIR */}
          <path id="logoTextPath" d="M 15 50 A 35 30 0 0 1 85 50" fill="none" />
          <text className="text-[7px] font-black tracking-[0.05em]" fill="white" style={{ fontFamily: 'system-ui, sans-serif' }}>
            <textPath href="#logoTextPath" startOffset="50%" textAnchor="middle">
              SEKOLAH TANAH AIR
            </textPath>
          </text>

          {/* Ornamen Bintang Delapan Penjuru Mata Angin */}
          <g transform="translate(50, 45)">
            {/* Titik utama berwarna merah (U, S, T, B) */}
            <path d="M 0 -18 L 3 0 L 0 18 L -3 0 Z" fill="#C0392B" />
            <path d="M -18 0 L 0 -3 L 18 0 L 0 3 Z" fill="#C0392B" />

            {/* Titik sekunder berwarna putih (TL, BD, T, B) */}
            <path d="M -10 -10 L 0 -1.5 L 10 10 L -1.5 0 Z" fill="white" />
            <path d="M 10 -10 L 1.5 0 L -10 10 L 0 -1.5 Z" fill="white" />

            {/* Lingkaran pusat kompas */}
            <circle cx="0" cy="0" r="3" fill="#002129" stroke="white" strokeWidth="1" />
          </g>

          {/* Pola Sayap atau Gelombang di bagian bawah */}
          <g transform="translate(50, 70)" stroke="#004D5A" strokeWidth="1.5" fill="none">
            {/* Sayap Kiri */}
            <path d="M -5 0 C -15 5, -35 5, -45 -15" />
            <path d="M -5 5 C -15 10, -35 10, -45 -10" />
            <path d="M -5 10 C -15 15, -35 15, -45 -5" />

            {/* Sayap Kanan */}
            <path d="M 5 0 C 15 5, 35 5, 45 -15" />
            <path d="M 5 5 C 15 10, 35 10, 45 -10" />
            <path d="M 5 10 C 15 15, 35 15, 45 -5" />
          </g>

          {/* Garis putih tipis (inner lining) untuk highlight sayap */}
          <g transform="translate(50, 70)" stroke="white" strokeWidth="0.5" fill="none" opacity="0.6">
            <path d="M -5 2 C -15 7, -35 7, -45 -13" />
            <path d="M 5 2 C 15 7, 35 7, 45 -13" />
          </g>
        </svg>
      </div>

      {/* Teks Identitas Merek di samping Logo */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            "text-lg font-black tracking-tight leading-none",
            variant === 'dark' ? "text-gray-900" : "text-white"
          )}>
            Sekolah
          </span>
          <span className={cn(
            "text-sm font-bold tracking-[0.2em] uppercase leading-none mt-0.5",
            variant === 'dark' ? "text-emerald-600" : "text-emerald-400"
          )}>
            Tanah Air
          </span>
        </div>
      )}
    </div>
  );
}
