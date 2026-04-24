import { ProgramContent } from './supabase';

export const PROGRAMS: ProgramContent[] = [
  {
    id: 'program-1',
    slug: 'jelajah-tanah-air',
    title: 'Jelajah Tanah Air',
    short_description:
      'Tahap awal fokus pada survei, identifikasi permasalahan pendidikan, pemetaan kondisi sekolah/desa, dan riset potensi lokal.',
    overview:
      'Jelajah Tanah Air menjadi fondasi kerja STA di lapangan. Program ini dipakai untuk memahami kebutuhan riil sekolah dan desa secara menyeluruh sebelum intervensi pendidikan dijalankan.',
    detail_path: '/programs/jelajah-tanah-air',
    icon_name: 'search',
    stage_label: 'Fase Program',
    stage_value: 'Survei & Pemetaan',
    focus_areas: [
      'Survei lapangan untuk membaca kondisi sekolah dan desa secara langsung.',
      'Identifikasi permasalahan pendidikan yang paling mendesak di setiap lokasi.',
      'Pemetaan kondisi sekolah, akses belajar, dan sumber daya komunitas setempat.',
      'Riset potensi lokal sebagai dasar desain program yang relevan dan berkelanjutan.',
    ],
  },
  {
    id: 'program-2',
    slug: 'eduxplore-tanah-air',
    title: 'EduXplore Tanah Air',
    short_description:
      'Aktivitas mengajar, eksplorasi budaya, penerapan kurikulum hijau, perpustakaan digital, serta pengenalan teknologi dan AI.',
    overview:
      'EduXplore Tanah Air menghadirkan pengalaman belajar yang kontekstual. Program ini menggabungkan pengajaran, pelestarian budaya, literasi digital, serta pengenalan teknologi agar siswa belajar dekat dengan realitas masa depan.',
    detail_path: '/programs/eduxplore-tanah-air',
    icon_name: 'graduation-cap',
    stage_label: 'Fase Program',
    stage_value: 'Belajar & Eksplorasi',
    focus_areas: [
      'Aktivitas mengajar yang dirancang sesuai kebutuhan belajar siswa di lokasi.',
      'Eksplorasi budaya sebagai bagian dari pembelajaran yang berakar pada identitas lokal.',
      'Penerapan kurikulum hijau untuk menumbuhkan kepedulian terhadap lingkungan sekitar.',
      'Perpustakaan digital dan pengenalan teknologi serta AI untuk memperluas akses pengetahuan.',
    ],
  },
  {
    id: 'program-3',
    slug: 'bangun-1000-asa',
    title: 'Bangun 1000 Asa',
    short_description:
      'Implementasi pembangunan atau renovasi sekolah, pengadaan alat digital, peningkatan kapasitas guru, dan monitoring berkelanjutan.',
    overview:
      'Bangun 1000 Asa mendorong perubahan yang bisa dirasakan langsung oleh sekolah. Fokusnya adalah memperbaiki sarana belajar, memperkuat kesiapan guru, dan menjaga keberlanjutan dampak melalui pemantauan rutin.',
    detail_path: '/programs/bangun-1000-asa',
    icon_name: 'hammer',
    stage_label: 'Fase Program',
    stage_value: 'Implementasi & Monitoring',
    focus_areas: [
      'Pembangunan atau renovasi sekolah untuk menciptakan ruang belajar yang lebih layak.',
      'Pengadaan alat digital guna mendukung pembelajaran yang lebih adaptif.',
      'Peningkatan kapasitas guru melalui pendampingan dan penguatan kompetensi.',
      'Monitoring berkelanjutan untuk memastikan program tetap berjalan dan bertumbuh.',
    ],
  },
];

export function getProgramBySlug(slug?: string) {
  if (!slug) return null;
  return PROGRAMS.find((program) => program.slug === slug) ?? null;
}
