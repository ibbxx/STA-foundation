import { createClient } from '@supabase/supabase-js';

// Mengambil kredensial Supabase dari environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Menginisialisasi klien Supabase untuk interaksi dengan database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Definisi tipe data untuk entitas Kampanye (Campaign)
 */
export type Campaign = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  target_amount: number;
  current_amount: number;
  thumbnail_url: string;
  banner_url: string;
  category_id: string;
  status: 'active' | 'inactive' | 'completed';
  deadline: string;
  is_featured: boolean;
  created_at: string;
  donor_count?: number;
};

/**
 * Definisi tipe data untuk entitas Donasi (Donation)
 */
export type Donation = {
  id: string;
  campaign_id: string;
  donor_id: string;
  amount: number;
  message: string;
  is_anonymous: boolean;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  payment_method: string;
  created_at: string;
  paid_at?: string;
  donor?: {
    name: string;
  };
};

/**
 * Definisi tipe data untuk entitas Pembaruan Kampanye (Campaign Update)
 */
export type CampaignUpdate = {
  id: string;
  campaign_id: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
};
