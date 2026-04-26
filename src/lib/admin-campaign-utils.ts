import type { CampaignManagerValues, CampaignUpdateValues } from './admin-schemas';
import type { ImagePreviewItem } from './image-preview';
import type { CampaignRow } from './supabase';

export const defaultCampaignValues: CampaignManagerValues = {
  title: '',
  category_id: '',
  target_amount: 0,
  start_date: '',
  end_date: '',
  description: '',
  is_featured: false,
  status: 'draft',
  collaborators: [],
};

export const defaultUpdateValues: CampaignUpdateValues = {
  title: '',
  content: '',
  update_type: 'General',
  created_at: '',
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function getCampaignImages(campaign: CampaignRow | null) {
  if (!campaign) return [];
  if (Array.isArray(campaign.images) && campaign.images.length > 0) return campaign.images;
  if (campaign.image_url) return [campaign.image_url];
  return [];
}

export function toExistingImageItems(urls: string[]): ImagePreviewItem[] {
  return urls.map((url, index) => ({
    id: `existing-${index}-${url}`,
    url,
    name: `image-${index + 1}`,
    kind: 'existing',
  }));
}

export function toQueuedImageItems(files: File[]): ImagePreviewItem[] {
  return files.map((file) => ({
    id: `queued-${crypto.randomUUID()}`,
    url: URL.createObjectURL(file),
    name: file.name,
    kind: 'queued',
    file,
  }));
}

export function formatDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 'Tanggal belum lengkap';
  return `${startDate} - ${endDate}`;
}
