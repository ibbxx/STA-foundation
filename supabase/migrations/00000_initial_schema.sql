-- Database Schema for Tanah Air Crowdfunding

-- 1. Campaign Categories
CREATE TABLE campaign_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) DEFAULT 0,
  thumbnail_url TEXT,
  banner_url TEXT,
  category_id UUID REFERENCES campaign_categories(id),
  status TEXT DEFAULT 'active', -- active, inactive, completed
  deadline TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Donors
CREATE TABLE donors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Donations
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  donor_id UUID REFERENCES donors(id),
  amount DECIMAL(15, 2) NOT NULL,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- pending, paid, failed, expired
  payment_method TEXT,
  payment_id TEXT UNIQUE, -- ID from payment gateway
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 5. Campaign Updates
CREATE TABLE campaign_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Partners
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT,
  content TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Site Settings
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Media Assets
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id),
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- image, video
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) - Basic setup
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Public can read active campaigns
CREATE POLICY "Public can read active campaigns" ON campaigns
  FOR SELECT USING (status = 'active');

-- Public can read paid donations for progress
CREATE POLICY "Public can read paid donations" ON donations
  FOR SELECT USING (status = 'paid');

-- Only admins can do everything (simplified for this context)
-- In a real app, you'd check against an admins table or auth.uid

-- 10. School Reports (Multi-step Wizard Form)
CREATE TABLE school_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Step 1: Identitas Pelapor
  reporter_name TEXT NOT NULL,
  reporter_whatsapp TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  reporter_address TEXT NOT NULL,
  reporter_status TEXT NOT NULL,
  is_willing_to_be_facilitator BOOLEAN NOT NULL,
  has_school_contact BOOLEAN,
  school_contact_name TEXT,
  school_contact_whatsapp TEXT,
  
  -- Step 2: Identitas & Lokasi Sekolah
  school_name TEXT NOT NULL,
  school_level TEXT NOT NULL,
  school_status TEXT NOT NULL,
  school_address TEXT NOT NULL,
  school_maps_url TEXT,
  student_count INTEGER NOT NULL,
  teacher_count INTEGER NOT NULL,
  
  -- Step 3: Kondisi & Kebutuhan
  building_condition TEXT NOT NULL,
  physical_needs TEXT[] NOT NULL,
  non_physical_needs TEXT[] NOT NULL,
  priority_timeline TEXT NOT NULL,
  priority_reason TEXT NOT NULL,
  photos_urls TEXT[],
  
  status TEXT DEFAULT 'pending', -- pending, reviewed, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE school_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert school reports" ON school_reports
  FOR INSERT WITH CHECK (true);
