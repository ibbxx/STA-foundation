import { z } from 'zod';
import { logError } from './error-logger';

// ── Constants ──

export const EDUXPLORE_ADMIN_NUMBER = '6287882799026';
export const EDUXPLORE_DRAFT_KEY = 'sta-eduxplore-draft-v1';

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;
export const BIDANG_OPTIONS = [
  'Pengembangan Pemuda',
  'Pendidikan dan Pengajaran Siswa Guru',
  'Media dan Promosi serta Branding Desa',
  'Branding Budaya dan Lingkungan Lokal',
] as const;

// ── Timeline Interface ──

export interface VolunteerTimelineItem {
  date: string;
  label: string;
  isCompleted?: boolean;
}

export interface VolunteerProgramData {
  id: string;
  slug: string;
  title: string;
  location: string;
  image_url: string | null;
  timeline: VolunteerTimelineItem[];
  requirements: string[];
  description: string | null;
  show_in_hero: boolean;
  status: 'open' | 'closed' | 'ongoing';
}

// ── Zod Schema ──

const phoneRegex = /^(?:\+62|62|0)8\d{7,13}$/;
const waSchema = z
  .string()
  .min(1, 'Nomor WhatsApp wajib diisi')
  .refine(
    (v) => phoneRegex.test(v.replace(/[\s-]/g, '')),
    'Nomor WhatsApp tidak valid',
  );

export const eduxploreFormSchema = z.object({
  nama_lengkap: z.string().min(3, 'Nama lengkap wajib diisi (min 3 karakter)'),
  email: z.string().email('Email tidak valid'),
  whatsapp: waSchema,
  whatsapp_emergency: waSchema,
  alamat: z.string().min(5, 'Alamat wajib diisi'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  size_baju: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'], {
    error: 'Ukuran baju wajib dipilih',
  }),
  riwayat_penyakit: z.string().optional(),
  pendidikan: z.string().min(3, 'Latar belakang pendidikan wajib diisi'),
  bidang_diminati: z.string().min(1, 'Pilihan bidang wajib dipilih'),
});

export type EduxploreFormValues = z.infer<typeof eduxploreFormSchema>;

// ── Assets Interface ──

export interface EduxploreAssets {
  bukti_dp: File | null;
  bukti_follow_ig: File | null;
  foto_id_card: File | null;
}

// ── Default Values ──

export const EDUXPLORE_DEFAULT_VALUES: EduxploreFormValues = {
  nama_lengkap: '',
  email: '',
  whatsapp: '',
  whatsapp_emergency: '',
  alamat: '',
  tanggal_lahir: '',
  size_baju: '' as any,
  riwayat_penyakit: '',
  pendidikan: '',
  bidang_diminati: '',
};

// ── Draft Persistence ──

export function loadEduxploreDraft(): EduxploreFormValues {
  if (typeof window === 'undefined') return EDUXPLORE_DEFAULT_VALUES;
  const raw = window.localStorage.getItem(EDUXPLORE_DRAFT_KEY);
  if (!raw) return EDUXPLORE_DEFAULT_VALUES;

  try {
    const parsed = JSON.parse(raw) as Partial<EduxploreFormValues>;
    return { ...EDUXPLORE_DEFAULT_VALUES, ...parsed };
  } catch (err) {
    logError('eduxplore.loadEduxploreDraft', err, { storageKey: EDUXPLORE_DRAFT_KEY });
    return EDUXPLORE_DEFAULT_VALUES;
  }
}

export function persistEduxploreDraft(values: EduxploreFormValues) {
  if (typeof window === 'undefined') return;
  const isDefault = JSON.stringify(values) === JSON.stringify(EDUXPLORE_DEFAULT_VALUES);

  if (isDefault) {
    window.localStorage.removeItem(EDUXPLORE_DRAFT_KEY);
    return;
  }
  window.localStorage.setItem(EDUXPLORE_DRAFT_KEY, JSON.stringify(values));
}

export function clearEduxploreDraft() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(EDUXPLORE_DRAFT_KEY);
}

// ── WhatsApp Builder (Dynamic) ──

export function buildEduxploreWhatsAppMessage(
  values: EduxploreFormValues,
  programTitle: string,
): string {
  return [
    'Salam, Tim Sekolah Tanah Air.',
    '',
    `Saya telah mendaftar sebagai volunteer ${programTitle}:`,
    '',
    `• Nama: ${values.nama_lengkap}`,
    `• Email: ${values.email}`,
    `• WA: ${values.whatsapp}`,
    `• WA Darurat: ${values.whatsapp_emergency}`,
    `• Alamat: ${values.alamat}`,
    `• Tanggal Lahir: ${values.tanggal_lahir}`,
    `• Size Baju: ${values.size_baju}`,
    `• Pendidikan: ${values.pendidikan}`,
    `• Bidang Diminati: ${values.bidang_diminati}`,
    `• Riwayat Penyakit: ${values.riwayat_penyakit || 'Tidak ada'}`,
    '',
    'Bukti DP, bukti follow IG, dan pas foto (untuk ID Card) telah diunggah melalui portal STA.',
    '',
    'Mohon konfirmasinya. Terima kasih!',
  ].join('\n');
}

export function createEduxploreWhatsAppUrl(
  values: EduxploreFormValues,
  programTitle: string,
): string {
  const message = buildEduxploreWhatsAppMessage(values, programTitle);
  return `https://wa.me/${EDUXPLORE_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;
}
