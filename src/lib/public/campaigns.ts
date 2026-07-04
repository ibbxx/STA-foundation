import {
  Campaign,
  CampaignRow,
  CampaignUpdateRow,
  CategoryRow,
  supabase,
} from '../supabase/types';
import { getEdgeFunctionErrorMessage } from '../admin/repository';
import { logError } from '../error-logger';

export type CampaignDonationSummary = {
  donor_name_display: string;
  amount: number;
  message: string | null;
  created_at: string;
  is_anonymous: boolean;
};

function stripHtml(input: string) {
  return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getCampaignImages(row: Pick<CampaignRow, 'images' | 'image_url'> | null) {
  if (!row) return [];

  if (Array.isArray(row.images) && row.images.length > 0) {
    return row.images;
  }

  if (row.image_url) {
    return [row.image_url];
  }

  return [];
}

export function getCampaignPrimaryImage(row: Pick<CampaignRow, 'images' | 'image_url' | 'id'>) {
  return getCampaignImages(row)[0] ?? null;
}

export function getDaysLeft(endDate?: string | null) {
  if (!endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, diff);
}

export function mapCampaignRowToPublicCampaign(
  row: CampaignRow,
  categoryMap: Map<string, CategoryRow>,
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
    donor_count: row.donor_count ?? 0,
    start_date: row.start_date ?? undefined,
    end_date: row.end_date ?? undefined,
    images,
    collaborators: Array.isArray(row.collaborators) ? row.collaborators as Campaign['collaborators'] : [],
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
    .neq('status', 'draft')
    .order('created_at', { ascending: false });

  if (options?.featuredOnly) {
    campaignsQuery = campaignsQuery.eq('is_featured', true);
  }

  if (options?.activeOnly) {
    campaignsQuery = campaignsQuery.eq('status', 'active');
  }

  campaignsQuery = campaignsQuery.limit(options?.limit ?? 100);

  const [{ data: campaignRows, error: campaignsError }, { data: categoryRows, error: categoriesError }] = await Promise.all([
    campaignsQuery,
    supabase.from('categories').select('*').order('name', { ascending: true }),
  ]);

  if (campaignsError || categoriesError) {
    throw new Error(campaignsError?.message ?? categoriesError?.message ?? 'Gagal memuat campaign publik.');
  }

  const safeCampaignRows: CampaignRow[] = campaignRows ?? [];
  const safeCategoryRows: CategoryRow[] = categoryRows ?? [];

  const categoryMap = new Map(safeCategoryRows.map((category) => [category.id, category]));

  return {
    campaigns: safeCampaignRows.map((row) => mapCampaignRowToPublicCampaign(row, categoryMap)),
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

  const [{ data: categoryRows, error: categoriesError }, { data: updateRows, error: updatesError }, { data: recentDonationsPayload, error: recentDonationsError }] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('campaign_updates').select('*').eq('campaign_id', safeCampaignRow.id).order('created_at', { ascending: false }).limit(100),
    supabase.functions.invoke<{ donations: CampaignDonationSummary[] }>('get-public-campaign-donations', {
      body: {
        campaign_id: safeCampaignRow.id,
        limit: 10,
      },
    }),
  ]);

  if (categoriesError || updatesError) {
    throw new Error(
      categoriesError?.message
      ?? updatesError?.message
      ?? 'Gagal memuat detail campaign.',
    );
  }

  if (recentDonationsError) {
    const edgeErrorMessage = await getEdgeFunctionErrorMessage(
      recentDonationsError,
      'Gagal memuat donasi publik.',
    );
    logError('public-campaigns.fetchPublicCampaignDetail.recentDonations', recentDonationsError, {
      campaignId: safeCampaignRow.id,
      errorMessage: edgeErrorMessage,
      slug,
    });
  }

  const safeCategoryRows: CategoryRow[] = (categoryRows ?? []) as CategoryRow[];

  const categoryMap = new Map(safeCategoryRows.map((category) => [category.id, category]));

  return {
    campaign: mapCampaignRowToPublicCampaign(safeCampaignRow, categoryMap),
    updates: (updateRows ?? []) as CampaignUpdateRow[],
    donations: recentDonationsPayload?.donations ?? [],
  };
}

export async function fetchPublicCampaignForDonate(slug: string) {
  const detail = await fetchPublicCampaignDetail(slug);
  const campaign = detail?.campaign ?? null;
  if (!campaign || campaign.status !== 'active') {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = campaign.start_date ? new Date(`${campaign.start_date}T00:00:00`) : null;
  const endDate = campaign.end_date ? new Date(`${campaign.end_date}T00:00:00`) : null;

  if ((startDate && today < startDate) || (endDate && today > endDate)) {
    return null;
  }

  return campaign;
}
