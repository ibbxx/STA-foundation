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
  registration_start?: string | null;
  registration_end?: string | null;
  program_end?: string | null;
}

export type EduxploreRegistrationType = 'reguler' | 'beasiswa';

export interface EduxploreQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'file' | 'number' | 'email' | 'tel';
  label: string;
  required: boolean;
  options?: string[] | null;
}

export interface EduxploreEnabledRegistrationTypes {
  reguler: boolean;
  beasiswa: boolean;
}

export interface NormalizedEduxploreFormConfig {
  reguler: EduxploreQuestion[];
  beasiswa: EduxploreQuestion[];
  enabled_registration_types: EduxploreEnabledRegistrationTypes;
}

export const DEFAULT_REGULER_FORM_CONFIG: EduxploreQuestion[] = [
  { id: 'nama_lengkap', type: 'text', label: 'Nama Lengkap', required: true },
  { id: 'email', type: 'email', label: 'Email Aktif', required: true },
  { id: 'whatsapp', type: 'tel', label: 'No. WhatsApp', required: true },
  { id: 'instagram', type: 'text', label: 'Instagram', required: true },
  { id: 'institusi', type: 'text', label: 'Institusi / Sekolah / Kampus', required: true },
  { id: 'jurusan', type: 'text', label: 'Jurusan / Kelas / Lainnya', required: true },
  { id: 'bukti_follow_sta', type: 'file', label: 'Bukti Follow Instagram @sekolah.tanahair', required: true },
  { id: 'bukti_follow_bepro', type: 'file', label: 'Bukti Follow Instagram @bepro_id', required: true },
  { id: 'mini_esai', type: 'textarea', label: 'Mini Esai (Motivasi & Kontribusi)', required: true },
  { id: 'meeting_point', type: 'select', label: 'Meeting Point', required: true, options: ['Payakumbuh', 'Padang', 'Jakarta'] },
  { id: 'bukti_pembayaran', type: 'file', label: 'Bukti Pembayaran (Full Payment / Cicilan 50%)', required: true },
];

export const DEFAULT_BEASISWA_FORM_CONFIG: EduxploreQuestion[] = [
  { id: 'nama_lengkap', type: 'text', label: 'Nama Lengkap', required: true },
  { id: 'email', type: 'email', label: 'Email Aktif', required: true },
  { id: 'whatsapp', type: 'tel', label: 'No. WhatsApp', required: true },
  { id: 'instagram', type: 'text', label: 'Instagram', required: true },
  { id: 'institusi', type: 'text', label: 'Institusi / Sekolah / Kampus', required: true },
  { id: 'jurusan', type: 'text', label: 'Jurusan / Kelas / Lainnya', required: true },
  { id: 'bukti_follow_sta', type: 'file', label: 'Bukti Follow Instagram @sekolah.tanahair', required: true },
  { id: 'bukti_follow_bepro', type: 'file', label: 'Bukti Follow Instagram @bepro_id', required: true },
  { id: 'cv', type: 'file', label: 'Curriculum Vitae', required: true },
  { id: 'motivation_letter', type: 'file', label: 'Motivation Letter (PDF)', required: true },
  { id: 'social_project_proposal', type: 'file', label: 'Mini Proposal Project atau Gagasan Dampak Sosial (PDF)', required: true },
];

const DEFAULT_ENABLED_REGISTRATION_TYPES: EduxploreEnabledRegistrationTypes = {
  reguler: true,
  beasiswa: true,
};

function cloneQuestions(questions: EduxploreQuestion[]): EduxploreQuestion[] {
  return questions.map((q) => ({
    ...q,
    options: Array.isArray(q.options) ? [...q.options] : q.options ?? undefined,
  }));
}

function parseFormConfigValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeQuestions(value: unknown, fallback: EduxploreQuestion[]): EduxploreQuestion[] {
  return Array.isArray(value) && value.length > 0
    ? cloneQuestions(value as EduxploreQuestion[])
    : cloneQuestions(fallback);
}

export function normalizeEduxploreFormConfig(value: unknown): NormalizedEduxploreFormConfig {
  const raw = parseFormConfigValue(value);

  if (Array.isArray(raw)) {
    return {
      reguler: normalizeQuestions(raw, DEFAULT_REGULER_FORM_CONFIG),
      beasiswa: cloneQuestions(DEFAULT_BEASISWA_FORM_CONFIG),
      enabled_registration_types: { ...DEFAULT_ENABLED_REGISTRATION_TYPES },
    };
  }

  if (raw && typeof raw === 'object') {
    const config = raw as Record<string, unknown>;
    const enabled = config.enabled_registration_types && typeof config.enabled_registration_types === 'object'
      ? config.enabled_registration_types as Partial<EduxploreEnabledRegistrationTypes>
      : {};

    return {
      reguler: normalizeQuestions(config.reguler, DEFAULT_REGULER_FORM_CONFIG),
      beasiswa: normalizeQuestions(config.beasiswa, DEFAULT_BEASISWA_FORM_CONFIG),
      enabled_registration_types: {
        reguler: typeof enabled.reguler === 'boolean' ? enabled.reguler : true,
        beasiswa: typeof enabled.beasiswa === 'boolean' ? enabled.beasiswa : true,
      },
    };
  }

  return {
    reguler: cloneQuestions(DEFAULT_REGULER_FORM_CONFIG),
    beasiswa: cloneQuestions(DEFAULT_BEASISWA_FORM_CONFIG),
    enabled_registration_types: { ...DEFAULT_ENABLED_REGISTRATION_TYPES },
  };
}

export function getEnabledEduxploreRegistrationTypes(config: NormalizedEduxploreFormConfig): EduxploreRegistrationType[] {
  const enabled: EduxploreRegistrationType[] = [];
  if (config.enabled_registration_types.reguler) enabled.push('reguler');
  if (config.enabled_registration_types.beasiswa) enabled.push('beasiswa');
  return enabled;
}

export function getEduxploreQuestionsForRegistrationType(
  config: NormalizedEduxploreFormConfig,
  registrationType: EduxploreRegistrationType | string | null | undefined,
): EduxploreQuestion[] {
  return registrationType === 'beasiswa' ? config.beasiswa : config.reguler;
}

export function getVolunteerProgramStatus(program: {
  status: 'open' | 'closed' | 'ongoing';
  registration_start?: string | null;
  registration_end?: string | null;
  program_end?: string | null;
}): 'open' | 'closed' | 'ongoing' {
  if (!program.registration_start || !program.registration_end || !program.program_end) {
    return program.status;
  }

  const now = new Date();
  const startReg = new Date(program.registration_start);
  const endReg = new Date(program.registration_end);
  const endProg = new Date(program.program_end);

  if (now < startReg) {
    return 'closed';
  } else if (now >= startReg && now <= endReg) {
    return 'open';
  } else if (now > endReg && now <= endProg) {
    return 'ongoing';
  } else {
    return 'closed';
  }
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
