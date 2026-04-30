import { z } from 'zod';
import { logError } from './error-logger';

export const REPORT_SCHOOL_STORAGE_KEY = 'sta-report-school-draft-v2';
export const REPORT_SCHOOL_ADMIN_NUMBER = '6287882799026'; // Updated WA number

/**
 * Fetch the user's public IP address using ipify API.
 * Returns 'unknown' if the request fails (to avoid blocking form submission).
 */
export async function getUserIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

export type ReportSchoolStepKey = 'reporter' | 'school' | 'needs';

export interface ReportSchoolFormValues {
  // STEP 1: Reporter
  reporterName: string;
  reporterWhatsapp: string;
  reporterEmail: string;
  reporterAddress: string;
  reporterStatus: string;
  isWillingToFacilitate: boolean;
  hasSchoolContact?: boolean;
  schoolContactName?: string;
  schoolContactWhatsapp?: string;

  // STEP 2: School
  schoolName: string;
  schoolLevel: string;
  schoolStatus: string;
  schoolAddress: string;
  schoolMapsUrl?: string;
  studentCount: string;
  teacherCount: string;

  // STEP 3: Needs & Condition
  buildingCondition: string;
  physicalNeeds: string[];
  nonPhysicalNeeds: string[];
  priorityTimeline: string;
  priorityReason: string;
}

export interface ReportSchoolAssets {
  schoolPhotos: File[];
}

export interface ReportSchoolStep {
  key: ReportSchoolStepKey;
  title: string;
  eyebrow: string;
  description: string;
  fields: Array<keyof ReportSchoolFormValues>;
}

// Validation Helpers
const phoneRegex = /^(?:\+62|62|0)8\d{7,13}$/;
const whatsappSchema = z
  .string()
  .min(1, 'Nomor WhatsApp wajib diisi')
  .refine((v) => phoneRegex.test(v.replace(/[\s-]/g, '')), 'Nomor WhatsApp tidak valid');

const positiveIntegerString = z
  .string()
  .min(1, 'Field ini wajib diisi')
  .refine((value) => /^\d+$/.test(value), 'Masukkan angka tanpa simbol')
  .refine((value) => Number(value) >= 0, 'Nilai harus lebih dari 0');

// Base Schema Form
export const reportSchoolFormSchema = z.object({
  // STEP 1
  reporterName: z.string().min(3, 'Nama pelapor wajib diisi (min 3 karakter)'),
  reporterWhatsapp: whatsappSchema,
  reporterEmail: z.string().email('Email tidak valid'),
  reporterAddress: z.string().min(5, 'Alamat wajib diisi'),
  reporterStatus: z.string().min(1, 'Status wajib dipilih'),
  isWillingToFacilitate: z.boolean(),
  hasSchoolContact: z.boolean().optional(),
  schoolContactName: z.string().optional(),
  schoolContactWhatsapp: z.string().optional(),

  // STEP 2
  schoolName: z.string().min(3, 'Nama sekolah wajib diisi'),
  schoolLevel: z.string().min(1, 'Jenjang wajib dipilih'),
  schoolStatus: z.string().min(1, 'Status sekolah wajib dipilih'),
  schoolAddress: z.string().min(10, 'Alamat sekolah wajib diisi lengkap'),
  schoolMapsUrl: z.string().optional(),
  studentCount: positiveIntegerString,
  teacherCount: positiveIntegerString,

  // STEP 3
  buildingCondition: z.string().min(1, 'Kondisi bangunan wajib dipilih'),
  physicalNeeds: z.array(z.string()).length(3, 'Wajib pilih tepat 3 kebutuhan fisik'),
  nonPhysicalNeeds: z.array(z.string()).length(3, 'Wajib pilih tepat 3 kebutuhan non-fisik'),
  priorityTimeline: z.string().min(1, 'Jangka prioritas wajib dipilih'),
  priorityReason: z.string().min(10, 'Ceritakan alasan Anda (min 10 karakter)'),
}).superRefine((values, ctx) => {
  if (values.isWillingToFacilitate === false && values.hasSchoolContact === true) {
    if (!(values.schoolContactName || '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['schoolContactName'],
        message: 'Nama wajib diisi',
      });
    }

    if (!(values.schoolContactWhatsapp || '').trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['schoolContactWhatsapp'],
        message: 'WA wajib diisi',
      });
    } else if (!phoneRegexFn(values.schoolContactWhatsapp || '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['schoolContactWhatsapp'],
        message: 'Nomor WhatsApp tidak valid',
      });
    }
  }
});

// Step validation — check required fields directly instead of using Zod .pick()
// which fails on superRefine + extra keys from the full form values object.

const phoneRegexFn = (v: string) => /^(?:\+62|62|0)8\d{7,13}$/.test((v || '').replace(/[\s-]/g, ''));

export function isReportSchoolStepValid(
  stepKey: ReportSchoolStepKey,
  values: ReportSchoolFormValues,
  assets?: ReportSchoolAssets,
) {
  switch (stepKey) {
    case 'reporter': {
      const base =
        (values.reporterName || '').length >= 3 &&
        phoneRegexFn(values.reporterWhatsapp) &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.reporterEmail || '') &&
        (values.reporterAddress || '').length >= 5 &&
        (values.reporterStatus || '').length >= 1;

      if (!base) return false;

      // If not willing to facilitate and has contact, check contact fields
      if (values.isWillingToFacilitate === false && values.hasSchoolContact === true) {
        return (
          (values.schoolContactName || '').trim().length >= 1 &&
          phoneRegexFn(values.schoolContactWhatsapp || '')
        );
      }

      return true;
    }
    case 'school':
      return (
        (values.schoolName || '').length >= 3 &&
        (values.schoolLevel || '').length >= 1 &&
        (values.schoolStatus || '').length >= 1 &&
        (values.schoolAddress || '').length >= 10 &&
        /^\d+$/.test(values.studentCount || '') &&
        /^\d+$/.test(values.teacherCount || '')
      );
    case 'needs':
      return (
        (values.buildingCondition || '').length >= 1 &&
        (values.physicalNeeds || []).length === 3 &&
        (values.nonPhysicalNeeds || []).length === 3 &&
        (values.priorityTimeline || '').length >= 1 &&
        (values.priorityReason || '').length >= 10 &&
        (assets ? assets.schoolPhotos.length >= 1 : true)
      );
    default:
      return false;
  }
}

// Default Values
export const REPORT_SCHOOL_DEFAULT_VALUES: ReportSchoolFormValues = {
  reporterName: '',
  reporterWhatsapp: '',
  reporterEmail: '',
  reporterAddress: '',
  reporterStatus: '',
  isWillingToFacilitate: true,
  hasSchoolContact: undefined,
  schoolContactName: undefined,
  schoolContactWhatsapp: undefined,

  schoolName: '',
  schoolLevel: '',
  schoolStatus: '',
  schoolAddress: '',
  schoolMapsUrl: undefined,
  studentCount: '',
  teacherCount: '',

  buildingCondition: '',
  physicalNeeds: [],
  nonPhysicalNeeds: [],
  priorityTimeline: '',
  priorityReason: '',
};

// Selection Options
export const STATUS_OPTIONS = [
  'Pelajar', 'Mahasiswa', 'Pekerja', 'Guru Sekolah', 'Aktivis', 'Perwakilan Komunitas Lokal', 'Lainnya'
] as const;

export const SCHOOL_LEVEL_OPTIONS = [
  'PAUD/TK', 'SD', 'SMP', 'SMA', 'SMK', 'Non-Formal'
] as const;

export const SCHOOL_STATUS_OPTIONS = [
  'Negeri', 'Swasta', 'Mandiri', 'Yayasan', 'Komunitas'
] as const;

export const BUILDING_CONDITIONS = [
  { value: 'Baik', desc: 'Seluruh bangunan dapat berfungsi dengan baik untuk menunjang pembelajaran' },
  { value: 'Rusak Ringan', desc: 'Terdapat satu atau dua ruangan yang kurang layak digunakan namun masih bisa digunakan untuk menunjang pembelajaran' },
  { value: 'Rusak Sedang', desc: 'Terdapat lebih dari dua ruangan yang kurang layak digunakan dan menyulitkan siswa/guru untuk menunjang pembelajaran' },
  { value: 'Rusak Berat', desc: 'Seluruh ruangan kelas rusak dan sebagian tidak dapat digunakan untuk menunjang pembelajaran' },
] as const;

export const PHYSICAL_NEEDS_OPTIONS = [
  'Perbaikan Ruang Kelas',
  'Renovasi Toilet dan Sanitasi',
  'Perbaikan Atap, Dinding, dan Lantai',
  'Perbaikan Fasilitas Listrik dan Pencahayaan',
  'Fasilitas Meja dan Kursi (Siswa)',
  'Fasilitas Meja dan Kursi (Guru)',
  'Buku dan Rak Perpustakaan',
  'Papan Tulis',
  'Lemari Penyimpanan',
  'Perbaikan Halaman Sekolah',
  'Perbaikan Pagar Sekolah',
  'Tempat Cuci Tangan',
  'Tempat Sampah Terpilah',
  'Alat Peraga Kelas (Sains dan Humaniora)',
  'Media Pembelajaran Digital (Tablet/Laptop/Proyektor)',
  'Sound System/Speaker Kelas'
] as const;

export const NON_PHYSICAL_NEEDS_OPTIONS = [
  'Pelatihan Pengembangan Guru',
  'Pelatihan Pengembangan Siswa (Literasi dan Perpustakaan)',
  'Pelatihan Pengembangan Siswa (Program Kesehatan Sekolah)',
  'Pelatihan Kelas Motivasi dan Pengembangan Karakter',
  'Pelatihan Kelas Lingkungan',
  'Pelatihan Manajemen Sekolah',
  'Kegiatan Sosial Anti-Bullying dan Kesehatan Mental',
  'Kegiatan Penguatan Komunitas Sekolah'
] as const;

export const TIMELINE_OPTIONS = [
  'Mendesak (Kurun 1 - 2 bulan)', '3 Bulan', '6 Bulan'
] as const;

// Step Definitions
export const REPORT_SCHOOL_STEPS: ReportSchoolStep[] = [
  {
    key: 'reporter',
    title: 'Data Pelapor',
    eyebrow: 'Langkah 1/3',
    description: 'Profil dan identitas Anda.',
    fields: ['reporterName', 'reporterWhatsapp', 'reporterEmail', 'reporterAddress', 'reporterStatus', 'isWillingToFacilitate', 'hasSchoolContact', 'schoolContactName', 'schoolContactWhatsapp'],
  },
  {
    key: 'school',
    title: 'Identitas Sekolah',
    eyebrow: 'Langkah 2/3',
    description: 'Informasi dasar sekolah.',
    fields: ['schoolName', 'schoolLevel', 'schoolStatus', 'schoolAddress', 'schoolMapsUrl', 'studentCount', 'teacherCount'],
  },
  {
    key: 'needs',
    title: 'Kondisi & Kebutuhan',
    eyebrow: 'Langkah 3/3',
    description: 'Analisis kondisi dan bantuan yang dibutuhkan.',
    fields: ['buildingCondition', 'physicalNeeds', 'nonPhysicalNeeds', 'priorityTimeline', 'priorityReason'],
  }
];

export function loadReportSchoolDraft(): ReportSchoolFormValues {
  if (typeof window === 'undefined') return REPORT_SCHOOL_DEFAULT_VALUES;
  const rawDraft = window.localStorage.getItem(REPORT_SCHOOL_STORAGE_KEY);
  if (!rawDraft) return REPORT_SCHOOL_DEFAULT_VALUES;

  try {
    const parsed = JSON.parse(rawDraft) as Partial<ReportSchoolFormValues>;
    return {
      ...REPORT_SCHOOL_DEFAULT_VALUES,
      ...parsed,
    };
  } catch (draftError) {
    logError('report-school.loadReportSchoolDraft', draftError, {
      storageKey: REPORT_SCHOOL_STORAGE_KEY,
    });
    return REPORT_SCHOOL_DEFAULT_VALUES;
  }
}

export function persistReportSchoolDraft(values: ReportSchoolFormValues) {
  if (typeof window === 'undefined') return;
  const isDefaultDraft = JSON.stringify(values) === JSON.stringify(REPORT_SCHOOL_DEFAULT_VALUES);

  if (isDefaultDraft) {
    window.localStorage.removeItem(REPORT_SCHOOL_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(REPORT_SCHOOL_STORAGE_KEY, JSON.stringify(values));
}

export function clearReportSchoolDraft() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(REPORT_SCHOOL_STORAGE_KEY);
}


/**
 * Build a structured text description from all form data.
 * This is stored in the `description` column of `school_reports`.
 */
export function buildReportDescription(values: ReportSchoolFormValues): string {
  const lines: string[] = [
    '── IDENTITAS PELAPOR ──',
    `Nama: ${values.reporterName}`,
    `WhatsApp: ${values.reporterWhatsapp}`,
    `Email: ${values.reporterEmail}`,
    `Alamat Pelapor: ${values.reporterAddress}`,
    `Status: ${values.reporterStatus}`,
    `Bersedia fasilitator: ${values.isWillingToFacilitate ? 'Ya' : 'Tidak'}`,
  ];

  if (!values.isWillingToFacilitate) {
    lines.push(`Memiliki kontak sekolah: ${values.hasSchoolContact ? 'Ya' : 'Tidak'}`);
    if (values.hasSchoolContact) {
      lines.push(`Kontak Sekolah: ${values.schoolContactName} (${values.schoolContactWhatsapp})`);
    }
  }

  lines.push(
    '',
    '── DETAIL SEKOLAH ──',
    `Nama Sekolah: ${values.schoolName}`,
    `Jenjang: ${values.schoolLevel} | Status: ${values.schoolStatus}`,
    `Alamat Sekolah: ${values.schoolAddress}`,
    `Google Maps: ${values.schoolMapsUrl || '-'}`,
    `Jumlah Siswa: ${values.studentCount} | Jumlah Guru: ${values.teacherCount}`,
    '',
    '── KONDISI & KEBUTUHAN ──',
    `Kondisi Bangunan: ${values.buildingCondition}`,
    `Kebutuhan Fisik: ${values.physicalNeeds.join(', ')}`,
    `Kebutuhan Non-Fisik: ${values.nonPhysicalNeeds.join(', ')}`,
    `Prioritas: ${values.priorityTimeline}`,
    `Alasan Prioritas:`,
    values.priorityReason,
  );

  return lines.join('\n');
}

function formatOptionalValue(value: string) {
  return value?.trim() ? value.trim() : '-';
}

function formatSelectedFiles(files: File[]) {
  if (!files || !files.length) return 'Tidak ada foto dilampirkan via web.';
  return files.map((file) => file.name).join(', ');
}

export function buildWhatsAppReportMessage(
  values: ReportSchoolFormValues,
  assets: ReportSchoolAssets
) {
  const physicalNeedsList = (values.physicalNeeds || []).map((need) => `   • ${need}`);
  const nonPhysicalNeedsList = (values.nonPhysicalNeeds || []).map((need) => `   • ${need}`);
  const photoCount = assets?.schoolPhotos?.length || 0;
  const reportId = `STA-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;

  return [
    'Salam, Tim Sekolah Tanah Air.',
    '',
    'Melalui pesan ini, saya bermaksud menyampaikan laporan mengenai kondisi sekolah yang membutuhkan perhatian, dengan rincian sebagai berikut:',
    '',
    '*(1) INFORMASI PELAPOR*',
    `• Nama: ${values.reporterName}`,
    `• Kontak: ${values.reporterWhatsapp}`,
    `• Email: ${values.reporterEmail}`,
    `• Status: ${values.reporterStatus}`,
    `• Peran: ${values.isWillingToFacilitate ? 'Bersedia menjadi fasilitator lokal' : 'Hanya sebagai pemberi informasi'}`,
    ...(values.hasSchoolContact && !values.isWillingToFacilitate 
      ? [`• Kontak Sekolah: ${values.schoolContactName} (${values.schoolContactWhatsapp})`] 
      : []),
    '',
    '*(2) IDENTITAS & LOKASI SEKOLAH*',
    `• Nama Sekolah: ${values.schoolName} (${values.schoolLevel})`,
    `• Status: ${values.schoolStatus}`,
    `• Alamat: ${values.schoolAddress}`,
    `• Maps: ${formatOptionalValue(values.schoolMapsUrl)}`,
    `• Kapasitas: ${values.studentCount} Siswa & ${values.teacherCount} Guru`,
    '',
    '*(3) ANALISIS KONDISI & KEBUTUHAN*',
    `• Kondisi Fisik: ${values.buildingCondition}`,
    '• Kebutuhan Prioritas:',
    ...physicalNeedsList,
    '• Kebutuhan Pendukung:',
    ...nonPhysicalNeedsList,
    `• Estimasi Urgensi: ${values.priorityTimeline}`,
    `• Dasar Pertimbangan: ${values.priorityReason}`,
    '',
    '',
    'Saya juga sudah mengunggah foto pendukung melalui portal Sekolah Tanah Air untuk membantu proses verifikasi.',
    '',
    'Mohon bantuannya untuk ditindaklanjuti. Terima kasih banyak atas perhatian Tim STA.',
    '',
    '#' + reportId,
  ].join('\n');
}

export function createWhatsAppReportUrl(
  values: ReportSchoolFormValues,
  assets: ReportSchoolAssets
) {
  const message = buildWhatsAppReportMessage(values, assets);
  return `https://wa.me/${REPORT_SCHOOL_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;
}
