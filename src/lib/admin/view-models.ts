import type {
  AdminHeroSettingsValues,
  AdminProgramValues,
  AdminSiteContentValues,
} from './schemas';
import { formatAdminDate } from './helpers';
import type {
  CampaignRow,
  DonationRow,
  ProgramInsert,
  ProgramRow,
  SchoolReportRow,
  SiteContentRow,
} from '../supabase/types';

export type TransactionView = DonationRow & {
  campaign_title: string;
};




export type DonorSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_donated: number;
  transaction_count: number;
  first_donation_at: string;
  last_donation_at: string;
  status: 'identified' | 'anonymous';
};

export type ReportStatus = SchoolReportRow['status'];

export const defaultProgramValues: AdminProgramValues = {
  slug: '',
  title: '',
  description: '',
  icon_name: '',
  hero_image_url: '',
  home_slider_image: '',
  overview: '',
  stage_label: '',
  stage_value: '',
  focus_areas: '',
  gallery_images: '',
  content: '',
};

export const heroKeys = [
  'hero_title',
  'hero_description',
  'hero_primary_label',
  'hero_primary_link',
  'hero_secondary_label',
  'hero_secondary_link',
] as const;

export const defaultHeroValues: AdminHeroSettingsValues = {
  hero_title: '',
  hero_description: '',
  hero_primary_label: '',
  hero_primary_link: '',
  hero_secondary_label: '',
  hero_secondary_link: '',
};

export const defaultContentValues: AdminSiteContentValues = {
  key: '',
  value_text: '{\n  \n}',
};

export function buildSevenDaySeries(donations: DonationRow[]) {
  const formatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      key: date.toISOString().slice(0, 10),
      name: formatter.format(date),
      total: 0,
      count: 0,
    };
  });

  const dayMap = new Map(days.map((day) => [day.key, day]));

  donations.forEach((donation) => {
    if (donation.payment_status !== 'success') return;

    const key = new Date(donation.created_at).toISOString().slice(0, 10);
    const bucket = dayMap.get(key);
    if (!bucket) return;

    bucket.total += donation.amount;
    bucket.count += 1;
  });

  return days;
}

export function buildCategorySeries(campaigns: CampaignRow[]) {
  const grouped = new Map<string, number>();

  campaigns.forEach((campaign) => {
    const key = campaign.category?.trim() || 'Tanpa kategori';
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  });

  const total = campaigns.length || 1;

  return Array.from(grouped.entries())
    .map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
}

export function buildUniqueDonorCount(donations: DonationRow[]) {
  const keys = new Set<string>();

  donations.forEach((donation) => {
    if (donation.payment_status !== 'success') return;

    const key = donation.is_anonymous
      ? `anon:${donation.donor_name ?? donation.id}`
      : `${donation.donor_email ?? donation.donor_name ?? donation.id}`;

    keys.add(key.toLowerCase());
  });

  return keys.size;
}

export function buildCampaignTitleMap(campaigns: Pick<CampaignRow, 'id' | 'title'>[]) {
  return new Map(campaigns.map((campaign) => [campaign.id, campaign.title]));
}

export function buildRecentTransactions(
  donations: DonationRow[],
  campaignMap: Map<string, string>,
): TransactionView[] {
  return [...donations]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 5)
    .map((transaction) => ({
      ...transaction,
      campaign_title: campaignMap.get(transaction.campaign_id) ?? 'Campaign tidak ditemukan',
    }));
}

export function deriveDonors(donations: DonationRow[]) {
  const grouped = new Map<string, DonorSummary>();

  donations.forEach((donation) => {
    const key = donation.is_anonymous
      ? `anonymous:${donation.donor_name ?? donation.id}`
      : `${donation.donor_email ?? ''}:${donation.donor_name ?? donation.id}`;

    const existing = grouped.get(key);
    const donatedAmount = donation.payment_status === 'success' ? donation.amount : 0;

    if (!existing) {
      grouped.set(key, {
        id: key,
        name: donation.is_anonymous ? 'Anonim' : donation.donor_name ?? 'Tanpa nama',
        email: donation.is_anonymous ? null : donation.donor_email,
        phone: donation.is_anonymous ? null : donation.donor_phone,
        total_donated: donatedAmount,
        transaction_count: 1,
        first_donation_at: donation.created_at,
        last_donation_at: donation.created_at,
        status: donation.is_anonymous ? 'anonymous' : 'identified',
      });
      return;
    }

    existing.total_donated += donatedAmount;
    existing.transaction_count += 1;
    if (!existing.phone && !donation.is_anonymous) {
      existing.phone = donation.donor_phone;
    }

    if (new Date(donation.created_at) < new Date(existing.first_donation_at)) {
      existing.first_donation_at = donation.created_at;
    }

    if (new Date(donation.created_at) > new Date(existing.last_donation_at)) {
      existing.last_donation_at = donation.created_at;
    }
  });

  return Array.from(grouped.values()).sort(
    (left, right) => new Date(right.last_donation_at).getTime() - new Date(left.last_donation_at).getTime(),
  );
}

export function filterDonors(donors: DonorSummary[], searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return donors;

  return donors.filter((donor) =>
    [donor.name, donor.email ?? '', donor.id]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
}

export function buildTransactionViews(
  donationRows: DonationRow[],
  campaignRows: Pick<CampaignRow, 'id' | 'title'>[],
): TransactionView[] {
  const campaignMap = buildCampaignTitleMap(campaignRows);

  return donationRows.map((transaction) => ({
    ...transaction,
    campaign_title: campaignMap.get(transaction.campaign_id) ?? 'Campaign tidak ditemukan',
  }));
}

export function filterTransactions(
  transactions: TransactionView[],
  searchQuery: string,
  statusFilter: 'all' | DonationRow['payment_status'],
) {
  const query = searchQuery.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const matchesQuery = !query || [
      transaction.id,
      transaction.donor_name ?? '',
      transaction.donor_email ?? '',
      transaction.campaign_title,
      transaction.payment_method ?? '',
      transaction.payment_status,
    ]
      .join(' ')
      .toLowerCase()
      .includes(query);

    const matchesStatus = statusFilter === 'all' || transaction.payment_status === statusFilter;
    return matchesQuery && matchesStatus;
  });
}

export function buildTransactionSummary(transactions: TransactionView[]) {
  const base = {
    success: { total: 0, count: 0 },
    pending: { total: 0, count: 0 },
    failed: { total: 0, count: 0 },
  };

  transactions.forEach((transaction) => {
    base[transaction.payment_status].total += transaction.amount;
    base[transaction.payment_status].count += 1;
  });

  return base;
}

export function filterReports(
  reports: SchoolReportRow[],
  searchQuery: string,
  statusFilter: 'all' | ReportStatus,
) {
  const query = searchQuery.trim().toLowerCase();

  return reports.filter((report) => {
    const matchesQuery = !query || [
      report.reporter_name,
      report.reporter_phone,
      report.school_name,
      report.location,
      report.status,
    ].join(' ').toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
}

export function buildReportSummary(reports: SchoolReportRow[]) {
  return {
    total: reports.length,
    pending: reports.filter((report) => report.status === 'pending').length,
    verified: reports.filter((report) => report.status === 'verified').length,
    actioned: reports.filter((report) => report.status === 'actioned').length,
  };
}

export function getReportImageUrls(imageUrls: SchoolReportRow['image_urls']) {
  if (Array.isArray(imageUrls)) {
    return imageUrls.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

export function toProgramPayload(values: AdminProgramValues): ProgramInsert {
  // Simpan data redesign dalam field content sebagai JSON agar tidak mengubah skema DB
  const detailData = {
    hero_image_url: values.hero_image_url?.trim(),
    home_slider_image: values.home_slider_image?.trim(),
    overview: values.overview?.trim(),
    stage_label: values.stage_label?.trim(),
    stage_value: values.stage_value?.trim(),
    focus_areas: values.focus_areas?.trim() ? values.focus_areas.split('\n').map(s => s.trim()).filter(Boolean) : [],
    gallery_images: values.gallery_images?.trim() ? values.gallery_images.split('\n').map(s => s.trim()).filter(Boolean) : [],
    body_content: values.content?.trim(),
  };

  return {
    slug: values.slug.trim(),
    title: values.title.trim(),
    description: values.description.trim(),
    icon_name: values.icon_name.trim(),
    content: JSON.stringify(detailData),
  };
}

export function filterPrograms(programs: ProgramRow[], searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return programs;

  return programs.filter((program) =>
    [program.title, program.slug, program.icon_name]
      .join(' ')
      .toLowerCase()
      .includes(query),
  );
}

export function buildProgramSummary(programs: ProgramRow[]) {
  const lastUpdated = programs[0]?.updated_at ?? null;

  return {
    total: programs.length,
    withContent: programs.filter((program) => Boolean(program.content?.trim())).length,
    lastUpdated: lastUpdated ? formatAdminDate(lastUpdated, true) : '-',
  };
}

export function stringifySiteContentValue(value: SiteContentRow['value']) {
  return value === null ? 'null' : JSON.stringify(value, null, 2);
}

function getStringValue(value: SiteContentRow['value']) {
  if (typeof value === 'string') return value;
  if (value === null) return '';
  return JSON.stringify(value);
}

export function buildHeroValues(entries: SiteContentRow[]): AdminHeroSettingsValues {
  const entryByKey = new Map(entries.map((entry) => [entry.key, entry]));

  return {
    hero_title: getStringValue(entryByKey.get('hero_title')?.value ?? null),
    hero_description: getStringValue(entryByKey.get('hero_description')?.value ?? null),
    hero_primary_label: getStringValue(entryByKey.get('hero_primary_label')?.value ?? null),
    hero_primary_link: getStringValue(entryByKey.get('hero_primary_link')?.value ?? null),
    hero_secondary_label: getStringValue(entryByKey.get('hero_secondary_label')?.value ?? null),
    hero_secondary_link: getStringValue(entryByKey.get('hero_secondary_link')?.value ?? null),
  };
}
