import { z } from 'zod';
import { logError } from './error-logger';
import { STA_ADMIN_WHATSAPP } from './constants';

// ── Constants ──

export const EDUXPLORE_ADMIN_NUMBER = STA_ADMIN_WHATSAPP;
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
  short_description: string | null;
  show_in_hero: boolean;
  program_type: 'jelajah' | 'eduxplore' | 'bangun-asa';
  status: 'open' | 'closed' | 'ongoing';
  form_config?: any;
  external_link?: string | null;
}

// ── Zod Schema ──

const phoneRegex = /^08\d{7,13}$/;
const waSchema = z
  .string()
  .min(1, 'Nomor WhatsApp wajib diisi')
  .refine(
    (v) => phoneRegex.test(v.replace(/[\s-]/g, '')),
    'Nomor WhatsApp harus diawali dengan angka 0 (contoh: 0812...)',
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

export function createDynamicSchema(formConfig: any) {
  const baseSchema: Record<string, any> = {};

  const questions = Array.isArray(formConfig) ? formConfig : [];

  questions.forEach((q: any) => {
    let fieldSchema: any;

    if (q.type === 'file') {
      fieldSchema = z.any().optional().nullable();
    } else if (q.type === 'email' || q.id === 'email') {
      fieldSchema = z.string().email('Format email tidak valid');
      if (!q.required) fieldSchema = fieldSchema.optional().nullable().or(z.literal(''));
    } else if (q.type === 'tel' || q.id === 'whatsapp' || q.id === 'whatsapp_emergency') {
      fieldSchema = waSchema;
      if (!q.required) fieldSchema = fieldSchema.optional().nullable().or(z.literal(''));
    } else if (q.id === 'nama_lengkap') {
      fieldSchema = z.string().min(3, 'Nama lengkap wajib diisi (min 3 karakter)');
    } else if (q.id === 'alamat') {
      fieldSchema = z.string().min(5, 'Alamat wajib diisi');
    } else if (q.id === 'tanggal_lahir') {
      fieldSchema = z.string().min(1, 'Tanggal lahir wajib diisi');
    } else if (q.id === 'size_baju') {
      fieldSchema = z.string().min(1, 'Ukuran baju wajib dipilih');
    } else if (q.id === 'pendidikan') {
      fieldSchema = z.string().min(3, 'Latar belakang pendidikan wajib diisi');
    } else if (q.id === 'bidang_diminati') {
      fieldSchema = z.string().min(1, 'Pilihan bidang wajib dipilih');
    } else if (q.type === 'number') {
      fieldSchema = z.string();
      if (q.required) {
        fieldSchema = fieldSchema
          .min(1, `${q.label} wajib diisi`)
          .regex(/^\d+$/, `${q.label} harus berupa angka`);
      } else {
        fieldSchema = fieldSchema
          .regex(/^\d+$/, `${q.label} harus berupa angka`);
      }
    } else {
      if (q.required) {
        fieldSchema = z.string().min(1, `${q.label} wajib diisi`);
      } else {
        fieldSchema = z.string().optional().nullable();
      }
    }

    if (!q.required && q.type !== 'file' && q.type !== 'email' && q.type !== 'tel') {
      fieldSchema = fieldSchema.optional().nullable().or(z.literal(''));
    }

    baseSchema[q.id] = fieldSchema;
  });

  return z.object(baseSchema);
}

export type EduxploreFormValues = z.infer<typeof eduxploreFormSchema>;

// ── Assets Interface ──

export interface EduxploreAssets {
  bukti_dp: File | null;
  bukti_follow_ig: File | null;
  foto_id_card: File | null;
}

// ── Default Values ──

export const EDUXPLORE_DEFAULT_VALUES = {
  nama_lengkap: '',
  email: '',
  whatsapp: '',
  whatsapp_emergency: '',
  alamat: '',
  tanggal_lahir: '',
  size_baju: '' as EduxploreFormValues['size_baju'],
  riwayat_penyakit: '',
  pendidikan: '',
  bidang_diminati: '',
} satisfies EduxploreFormValues;

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
  values: Record<string, any>,
  programTitle: string,
  formConfig?: any,
): string {
  const activeFormConfig = Array.isArray(formConfig) ? formConfig : [];
  const lines = [
    'Salam, Tim Sekolah Tanah Air.',
    '',
    `Saya telah mendaftar sebagai volunteer ${programTitle}:`,
    '',
    `• Nama: ${values.nama_lengkap}`,
    `• Email: ${values.email}`,
    `• WA: ${values.whatsapp}`,
  ];

  activeFormConfig.forEach((q: any) => {
    if (['nama_lengkap', 'email', 'whatsapp'].includes(q.id)) return;
    if (q.type === 'file') return;
    const val = values[q.id];
    if (val !== undefined && val !== null && val !== '') {
      lines.push(`• ${q.label}: ${val}`);
    }
  });

  const fileFields = activeFormConfig.filter((q: any) => q.type === 'file');
  if (fileFields.length > 0) {
    lines.push('');
    lines.push(`${fileFields.map((q: any) => q.label).join(', ')} telah diunggah melalui portal STA.`);
  }

  lines.push('');
  lines.push('Mohon konfirmasinya. Terima kasih!');
  return lines.join('\n');
}

export function createEduxploreWhatsAppUrl(
  values: Record<string, any>,
  programTitle: string,
  formConfig?: any,
): string {
  const message = buildEduxploreWhatsAppMessage(values, programTitle, formConfig);
  return `https://wa.me/${EDUXPLORE_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;
}
