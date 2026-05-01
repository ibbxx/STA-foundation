import { z } from 'zod';

export const programIconOptions = ['search', 'graduation-cap', 'hammer'] as const;

export const adminProgramSchema = z.object({
  slug: z.string().trim().min(1, 'Slug wajib diisi.'),
  title: z.string().trim().min(1, 'Judul program wajib diisi.'),
  description: z.string().trim().min(1, 'Deskripsi singkat wajib diisi.'),
  icon_name: z
    .string()
    .trim()
    .min(1, 'Nama ikon wajib diisi.')
    .refine((value) => programIconOptions.includes(value as (typeof programIconOptions)[number]), 'Pilih ikon yang tersedia.'),
  hero_image_url: z.string().trim().optional().or(z.literal('')),
  home_slider_image: z.string().trim().optional().or(z.literal('')),
  overview: z.string().trim().optional().or(z.literal('')),
  stage_label: z.string().trim().optional().or(z.literal('')),
  stage_value: z.string().trim().optional().or(z.literal('')),
  focus_areas: z.string().trim().optional().or(z.literal('')), // Akan disimpan sebagai JSON atau string terpisah
  gallery_images: z.string().trim().optional().or(z.literal('')),
  content: z.string().trim().optional().or(z.literal('')),
});

export type AdminProgramValues = z.infer<typeof adminProgramSchema>;



export const campaignManagerSchema = z
  .object({
    title: z.string().trim().min(1, 'Title wajib diisi.'),
    category_id: z.string().trim().min(1, 'Kategori wajib dipilih.'),
    target_amount: z.number().min(1, 'Target dana wajib diisi.'),
    start_date: z.string().trim().min(1, 'Tanggal mulai wajib diisi.'),
    end_date: z.string().trim().min(1, 'Tanggal akhir wajib diisi.'),
    description: z.string().trim().min(1, 'Deskripsi campaign wajib diisi.'),
    is_featured: z.boolean(),
    status: z.enum(['draft', 'active', 'completed']),
    collaborators: z.array(
      z.object({
        id: z.string(),
        name: z.string().trim().min(1, 'Nama mitra wajib diisi.'),
        role: z.string().trim().min(1, 'Peran wajib diisi.'),
        quote: z.string().trim().min(1, 'Quote wajib diisi.'),
        avatar: z.string().nullable().optional(),
        url: z.string().trim().optional().or(z.literal('')),
      })
    ),
  })
  .refine((values) => new Date(values.end_date) >= new Date(values.start_date), {
    path: ['end_date'],
    message: 'Tanggal akhir harus lebih besar atau sama dengan tanggal mulai.',
  });

export type CampaignManagerValues = z.infer<typeof campaignManagerSchema>;

export const campaignUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Judul update wajib diisi.'),
  content: z.string().trim().min(1, 'Isi update wajib diisi.'),
  update_type: z.enum(['General', 'Fundraising Progress', 'Distribution']),
  created_at: z.string().trim().optional().or(z.literal('')),
});

export type CampaignUpdateValues = z.infer<typeof campaignUpdateSchema>;

export const adminHeroSettingsSchema = z.object({
  hero_title: z.string().trim().min(1, 'Judul hero wajib diisi.'),
  hero_description: z.string().trim().min(1, 'Deskripsi hero wajib diisi.'),
  hero_primary_label: z.string().trim().min(1, 'Label CTA utama wajib diisi.'),
  hero_primary_link: z.string().trim().min(1, 'Link CTA utama wajib diisi.'),
  hero_secondary_label: z.string().trim().optional().or(z.literal('')),
  hero_secondary_link: z.string().trim().optional().or(z.literal('')),
});

export type AdminHeroSettingsValues = z.infer<typeof adminHeroSettingsSchema>;

export const adminSiteContentSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Key wajib diisi.')
    .regex(/^[a-z0-9_-]+$/, 'Key hanya boleh huruf kecil, angka, strip, dan underscore.'),
  value_text: z
    .string()
    .trim()
    .min(1, 'Value wajib diisi.')
    .refine((value) => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, 'Value harus berupa JSON yang valid.'),
});

export type AdminSiteContentValues = z.infer<typeof adminSiteContentSchema>;

export const adminMapLocationSchema = z.object({
  id: z.string().trim().optional(),
  title: z.string().trim().min(1, 'Judul wajib diisi.'),
  description: z.string().trim().min(1, 'Deskripsi wajib diisi.'),
  imageUrl: z.string().trim().min(1, 'URL Gambar wajib diisi.'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  status: z.enum(['Berjalan', 'Selesai', 'Akan Datang']),
  locationLabel: z.string().trim().optional().or(z.literal('')),
  actionHref: z.string().trim().optional().or(z.literal('')),
  actionLabel: z.string().trim().optional().or(z.literal('')),
  images: z.array(z.string()),
  fullContent: z.string().trim().optional().or(z.literal('')),
});

export type AdminMapLocationValues = z.infer<typeof adminMapLocationSchema>;
