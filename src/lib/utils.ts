import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Menggabungkan beberapa kelas CSS menjadi satu string.
 * Fungsi ini menangani konflik kelas pembantu Tailwind secara otomatis.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Memformat angka menjadi format mata uang Rupiah (IDR).
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Menghitung persentase pencapaian dari target yang ditentukan.
 * Nilai kembalian dibatasi maksimum 100 persen.
 */
export function calculateProgress(current: number, target: number) {
  if (!Number.isFinite(target) || target <= 0) {
    return 0;
  }

  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Memformat string tanggal menjadi format panjang Indonesia (contoh: "25 April 2026").
 */
export function formatLongDate(value?: string | null) {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'TBA';
  
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
