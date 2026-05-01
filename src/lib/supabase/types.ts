import { createClient } from '@supabase/supabase-js';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Tipe database utama untuk menyelaraskan client Supabase dengan schema SQL STA.
 * Row/Insert/Update di bawah mengikuti struktur tabel yang sudah ditetapkan di Supabase.
 */
export interface Database {
  public: {
    Tables: {
      programs: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          icon_name: string;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description: string;
          icon_name: string;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          icon_name?: string;
          content?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category_id: string | null;
          description: string | null;
          images: string[] | null;
          start_date: string | null;
          end_date: string | null;
          is_featured: boolean;
          target_amount: number;
          current_amount: number;
          donor_count: number;
          image_url: string | null;
          category: string | null;
          status: 'draft' | 'active' | 'completed' | 'upcoming';
          collaborators: any[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category_id?: string | null;
          description?: string | null;
          images?: string[] | null;
          start_date?: string | null;
          end_date?: string | null;
          is_featured?: boolean;
          target_amount: number;
          current_amount?: number;
          donor_count?: number;
          image_url?: string | null;
          category?: string | null;
          status?: 'draft' | 'active' | 'completed' | 'upcoming';
          collaborators?: any[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          category_id?: string | null;
          description?: string | null;
          images?: string[] | null;
          start_date?: string | null;
          end_date?: string | null;
          is_featured?: boolean;
          target_amount?: number;
          current_amount?: number;
          donor_count?: number;
          image_url?: string | null;
          category?: string | null;
          status?: 'draft' | 'active' | 'completed' | 'upcoming';
          collaborators?: any[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      donations: {
        Row: {
          id: string;
          campaign_id: string;
          donor_name: string;
          donor_email: string | null;
          donor_phone: string | null;
          amount: number;
          payment_status: 'pending' | 'success' | 'failed';
          payment_method: string | null;
          message: string | null;
          is_anonymous: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          donor_name: string;
          donor_email?: string | null;
          donor_phone?: string | null;
          amount: number;
          payment_status?: 'pending' | 'success' | 'failed';
          payment_method?: string | null;
          message?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          donor_name?: string;
          donor_email?: string | null;
          donor_phone?: string | null;
          amount?: number;
          payment_status?: 'pending' | 'success' | 'failed';
          payment_method?: string | null;
          message?: string | null;
          is_anonymous?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string | null;
          created_at?: string | null;
        };
      };
      campaign_updates: {
        Row: {
          id: string;
          campaign_id: string;
          title: string;
          content: string;
          image_url: string | null;
          images: string[] | null;
          update_type: 'General' | 'Fundraising Progress' | 'Distribution';
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          title: string;
          content: string;
          image_url?: string | null;
          images?: string[] | null;
          update_type: 'General' | 'Fundraising Progress' | 'Distribution';
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          title?: string;
          content?: string;
          image_url?: string | null;
          images?: string[] | null;
          update_type?: 'General' | 'Fundraising Progress' | 'Distribution';
          created_at?: string;
        };
      };
      school_reports: {
        Row: {
          id: string;
          reporter_name: string;
          reporter_phone: string;
          reporter_ip: string | null;
          school_name: string;
          location: string;
          description: string;
          image_urls: Json;
          status: 'pending' | 'verified' | 'actioned';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_name: string;
          reporter_phone: string;
          reporter_ip?: string | null;
          school_name: string;
          location: string;
          description: string;
          image_urls?: Json;
          status?: 'pending' | 'verified' | 'actioned';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_name?: string;
          reporter_phone?: string;
          reporter_ip?: string | null;
          school_name?: string;
          location?: string;
          description?: string;
          image_urls?: Json;
          status?: 'pending' | 'verified' | 'actioned';
          created_at?: string;
          updated_at?: string;
        };
      };
      spammer_blacklist: {
        Row: {
          id: string;
          identifier: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          identifier: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          identifier?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      site_content: {
        Row: {
          id: string;
          key: string;
          value: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json | null;
          updated_at?: string;
        };
      };
    };
    Views: {
      public_campaign_donations: {
        Row: {
          id: string;
          campaign_id: string;
          donor_name_display: string;
          amount: number;
          message: string | null;
          created_at: string;
          is_anonymous: boolean;
        };
      };
      public_campaign_stats: {
        Row: {
          campaign_id: string;
          current_amount: number;
          donor_count: number;
          updated_at: string;
        };
      };
    };
  };
}

// Mengambil kredensial Supabase dari environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[STA] ⚠️ VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum dikonfigurasi. '
    + 'Data dari Supabase tidak akan bisa dimuat. '
    + 'Pastikan environment variables sudah diset dengan prefix VITE_ di Vercel dan redeploy.'
  );
}

// Menginisialisasi klien Supabase untuk interaksi dengan database.
// Jika env vars kosong, gunakan placeholder agar createClient tidak crash
// (SDK melempar error sinkron "supabaseUrl is required" jika URL kosong,
// yang menyebabkan seluruh app gagal render — halaman putih total).
// Dengan placeholder, SDK tidak crash tapi query tetap gagal secara graceful.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder';

export const supabase = createClient<Database>(
  supabaseUrl || PLACEHOLDER_URL,
  supabaseAnonKey || PLACEHOLDER_KEY,
);

/**
 * Alias tipe berbasis schema Supabase.
 * Ini dipakai untuk integrasi data dinamis baru di admin/public secara bertahap.
 */
export type ProgramRow = Database['public']['Tables']['programs']['Row'];
export type ProgramInsert = Database['public']['Tables']['programs']['Insert'];
export type ProgramUpdate = Database['public']['Tables']['programs']['Update'];

export type CampaignRow = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];

export type DonationRow = Database['public']['Tables']['donations']['Row'];
export type DonationInsert = Database['public']['Tables']['donations']['Insert'];

export type CategoryRow = Database['public']['Tables']['categories']['Row'];

export type CampaignUpdateRow = Database['public']['Tables']['campaign_updates']['Row'];
export type CampaignUpdateInsert = Database['public']['Tables']['campaign_updates']['Insert'];

export type PublicCampaignDonationRow = Database['public']['Views']['public_campaign_donations']['Row'];
export type PublicCampaignStatsRow = Database['public']['Views']['public_campaign_stats']['Row'];

export type SchoolReportRow = Database['public']['Tables']['school_reports']['Row'];
export type SchoolReportInsert = Database['public']['Tables']['school_reports']['Insert'];
export type SchoolReportUpdate = Database['public']['Tables']['school_reports']['Update'];

export type SpammerBlacklistRow = Database['public']['Tables']['spammer_blacklist']['Row'];
export type SpammerBlacklistInsert = Database['public']['Tables']['spammer_blacklist']['Insert'];

export type SiteContentRow = Database['public']['Tables']['site_content']['Row'];
export type SiteContentInsert = Database['public']['Tables']['site_content']['Insert'];
export type SiteContentUpdate = Database['public']['Tables']['site_content']['Update'];

/**
 * View-model lama untuk halaman publik yang masih memakai mock data.
 * Dipertahankan sementara agar migrasi ke schema baru bisa dilakukan bertahap.
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
  category_name?: string;
  status: 'draft' | 'active' | 'inactive' | 'completed' | 'upcoming';
  deadline: string;
  is_featured: boolean;
  created_at: string;
  donor_count?: number;
  start_date?: string;
  end_date?: string;
  images?: string[];
  collaborators?: { id: string; name: string; role: string; quote: string; avatar?: string | null; url?: string | null }[];
};



/**
 * View-model program STA yang saat ini dipakai halaman publik.
 * Berbeda dengan `ProgramRow` karena halaman detail masih memakai struktur konten statis yang lebih kaya.
 */
export type ProgramContent = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  overview: string;
  detail_path: string;
  icon_name: 'search' | 'graduation-cap' | 'hammer';
  stage_label: string;
  stage_value: string;
  focus_areas: string[];
};
