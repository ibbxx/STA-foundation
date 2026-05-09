/**
 * Shared default values and constants used across admin and public pages.
 * Centralizing these prevents copy-paste drift between AdminContent and Home.
 */

export const DEFAULT_PROGRAMS_HEADER = {
  label: 'INISIATIF UTAMA',
  title: 'Program Kami',
  description:
    'Tiga pilar inisiatif yang kami rancang untuk menciptakan ekosistem pendidikan yang inklusif, layak, dan berkelanjutan.',
} as const;

export type ProgramsHeaderData = {
  label: string;
  title: string;
  description: string;
};

export const DEFAULT_CTA_DATA = {
  title: 'Bergabunglah untuk Masa Depan yang Lebih Cerah',
  description:
    'Setiap kontribusi Anda, sekecil apapun, adalah harapan bagi ribuan saudara kita. Mari bersama membangun Indonesia yang lebih baik.',
  primaryButtonText: 'Laporkan Sekolah',
  primaryButtonLink: '/laporkan',
  secondaryButtonText: 'Hubungi Kami',
  secondaryButtonLink: '/kontak',
  imageUrl: '',
} as const;

export type CtaData = {
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  imageUrl: string;
};

/**
 * Nomor WhatsApp admin terpusat.
 * Digunakan oleh modul EduXplore dan Laporan Sekolah.
 */
export const STA_ADMIN_WHATSAPP = '6287882799026';
