import {
  Campaign,
  CampaignRow,
  CampaignUpdateRow,
  CategoryRow,
  PublicCampaignDonationRow,
  supabase,
} from './supabase';

export type CampaignDonationSummary = Pick<
  PublicCampaignDonationRow,
  'donor_name_display' | 'amount' | 'message' | 'created_at' | 'is_anonymous'
>;

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getCampaignImages(row: Pick<CampaignRow, 'images' | 'image_url'>) {
  if (Array.isArray(row.images) && row.images.length > 0) {
    return row.images;
  }

  if (row.image_url) {
    return [row.image_url];
  }

  return [];
}

export function getCampaignPrimaryImage(row: Pick<CampaignRow, 'images' | 'image_url' | 'id'>) {
  return getCampaignImages(row)[0] ?? `https://picsum.photos/seed/${row.id}/1200/720`;
}

export function getDaysLeft(endDate?: string | null) {
  if (!endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, diff);
}

function buildDonationCountMap(rows: Pick<PublicCampaignDonationRow, 'campaign_id'>[]) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    counts.set(row.campaign_id, (counts.get(row.campaign_id) ?? 0) + 1);
  });

  return counts;
}

export function mapCampaignRowToPublicCampaign(
  row: CampaignRow,
  categoryMap: Map<string, CategoryRow>,
  donorCountMap: Map<string, number>,
): Campaign {
  const images = getCampaignImages(row);
  const htmlDescription = row.description ?? '';
  const shortDescription = stripHtml(htmlDescription).slice(0, 180);

  // Resolve category name: prioritas lookup UUID, fallback ke kolom text legacy
  let categoryName = 'Tanpa Kategori';
  if (row.category_id && categoryMap.has(row.category_id)) {
    categoryName = categoryMap.get(row.category_id)!.name;
  } else if (row.category && row.category.trim()) {
    categoryName = row.category;
  }

  const primaryImage = images[0] ?? getCampaignPrimaryImage(row);

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    short_description: shortDescription,
    full_description: htmlDescription,
    target_amount: row.target_amount,
    current_amount: row.current_amount,
    thumbnail_url: primaryImage,
    banner_url: primaryImage,
    category_id: row.category_id ?? '',
    category_name: categoryName,
    status: row.status,
    deadline: row.end_date ?? '',
    is_featured: row.is_featured,
    created_at: row.created_at,
    donor_count: donorCountMap.get(row.id) ?? 0,
    start_date: row.start_date ?? undefined,
    end_date: row.end_date ?? undefined,
    images,
  };
}

export async function fetchPublicCampaigns(options?: {
  featuredOnly?: boolean;
  limit?: number;
  activeOnly?: boolean;
}) {
  let campaignsQuery = supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.featuredOnly) {
    campaignsQuery = campaignsQuery.eq('is_featured', true);
  }

  if (options?.activeOnly) {
    campaignsQuery = campaignsQuery.eq('status', 'active');
  }

  if (options?.limit) {
    campaignsQuery = campaignsQuery.limit(options.limit);
  }

  const [{ data: campaignRows, error: campaignsError }, { data: categoryRows, error: categoriesError }, { data: donationRows, error: donationsError }] = await Promise.all([
    campaignsQuery,
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('public_campaign_donations').select('campaign_id'),
  ]);

  if (campaignsError || categoriesError) {
    throw new Error(campaignsError?.message ?? categoriesError?.message ?? 'Gagal memuat campaign publik.');
  }

  // Donation count is non-critical; degrade gracefully if view is inaccessible
  const safeCampaignRows: CampaignRow[] = campaignRows ?? [];
  const safeCategoryRows: CategoryRow[] = categoryRows ?? [];
  const safeDonationRows: Pick<PublicCampaignDonationRow, 'campaign_id'>[] = donationRows ?? [];

  const categoryMap = new Map(safeCategoryRows.map((category) => [category.id, category]));
  const donorCountMap = buildDonationCountMap(safeDonationRows);

  return {
    campaigns: safeCampaignRows.map((row) => mapCampaignRowToPublicCampaign(row, categoryMap, donorCountMap)),
    categories: safeCategoryRows,
  };
}

export async function fetchPublicCampaignDetail(slug: string) {
  const { data: campaignRow, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (campaignError) {
    throw new Error(campaignError.message);
  }

  if (!campaignRow) {
    return null;
  }

  const safeCampaignRow = campaignRow as CampaignRow;

  const [{ data: categoryRows, error: categoriesError }, { data: donationRows, error: donationsError }, { data: updateRows, error: updatesError }, { data: recentDonationRows, error: recentDonationsError }] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('public_campaign_donations').select('campaign_id'),
    supabase.from('campaign_updates').select('*').eq('campaign_id', safeCampaignRow.id).order('created_at', { ascending: false }),
    supabase
      .from('public_campaign_donations')
      .select('donor_name_display, amount, message, created_at, is_anonymous')
      .eq('campaign_id', safeCampaignRow.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (categoriesError || updatesError) {
    throw new Error(
      categoriesError?.message
      ?? updatesError?.message
      ?? 'Gagal memuat detail campaign.',
    );
  }

  const safeCategoryRows: CategoryRow[] = (categoryRows ?? []) as CategoryRow[];
  const safeDonationRows: Pick<PublicCampaignDonationRow, 'campaign_id'>[] = (donationRows ?? []) as Pick<PublicCampaignDonationRow, 'campaign_id'>[];

  const categoryMap = new Map(safeCategoryRows.map((category) => [category.id, category]));
  const donorCountMap = buildDonationCountMap(safeDonationRows);

  return {
    campaign: mapCampaignRowToPublicCampaign(safeCampaignRow, categoryMap, donorCountMap),
    updates: (updateRows ?? []) as CampaignUpdateRow[],
    donations: (recentDonationRows ?? []) as CampaignDonationSummary[],
  };
}

export async function fetchPublicCampaignForDonate(slug: string) {
  const detail = await fetchPublicCampaignDetail(slug);
  return detail?.campaign ?? null;
}
