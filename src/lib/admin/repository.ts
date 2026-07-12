import type {
  CampaignInsert,
  CampaignUpdateInsert,
  ProgramInsert,
  SchoolReportInsert,
  SchoolReportUpdate,
  SpammerBlacklistInsert,
  SiteContentInsert,
  SiteContentUpdate,
  VolunteerProgramInsert,
  VolunteerProgramUpdate,
  VolunteerRegistrationInsert,
  VolunteerRegistrationUpdate,
  Database,
  DonationRow,
} from '../supabase/types';
import { supabase } from '../supabase/types';
import { logError } from '../error-logger';
import {
  normalizeSafeUrl,
  normalizeGuidebookUrl,
  sanitizeJsonForStorage,
  sanitizePlainTextForStorage,
  sanitizeRichTextForStorage,
} from '../sanitize';

// ── Typed table helpers (workaround for Supabase v2.99.x generic strictness) ──
// Supabase v2.99.x uses `PostgrestVersion: "12"` in its generic system, which
// causes the `.update()`, `.insert()`, `.upsert()` overloads to require a type that
// resolves to exactly the Table's Insert/Update type — not a named alias of it.
//
// Using `as unknown as X` is the idiomatic fix: it first asserts to `unknown`
// (which is always safe), then to the target type (which is equivalent since they
// come from the same Database interface). This is NOT bypassing type-safety —
// it's navigating around a TypeScript generic variance limitation.
//
// Reference: https://github.com/supabase/supabase-js/issues/1070

type Tables = Database['public']['Tables'];
type SR = Tables['school_reports'];
type P = Tables['programs'];
type SC = Tables['site_content'];
type C = Tables['campaigns'];
type CU = Tables['campaign_updates'];
type SB = Tables['spammer_blacklist'];
type VP = Tables['volunteer_programs'];
type VR = Tables['volunteer_registrations'];

function sanitizeProgramPayload(payload: ProgramInsert): ProgramInsert {
  let content = payload.content ?? null;

  if (content?.trim()) {
    try {
      content = JSON.stringify(sanitizeJsonForStorage(JSON.parse(content), 'program.content'));
    } catch {
      content = sanitizeRichTextForStorage(content, 'Konten program');
    }
  }

  return {
    ...payload,
    slug: sanitizePlainTextForStorage(payload.slug, 'Slug program'),
    title: sanitizePlainTextForStorage(payload.title, 'Judul program'),
    description: sanitizeRichTextForStorage(payload.description, 'Deskripsi program'),
    icon_name: sanitizePlainTextForStorage(payload.icon_name, 'Ikon program'),
    content,
  };
}

function sanitizeSiteContentPayload<T extends SiteContentInsert | SiteContentUpdate>(payload: T): T {
  return {
    ...payload,
    ...(payload.key ? { key: sanitizePlainTextForStorage(payload.key, 'Key konten') } : {}),
    ...(payload.value !== undefined ? { value: sanitizeJsonForStorage(payload.value, payload.key ?? 'site_content.value') } : {}),
  };
}

function sanitizeCampaignCollaborators(collaborators: CampaignInsert['collaborators']) {
  if (!Array.isArray(collaborators)) return collaborators;

  return collaborators.map((collaborator) => {
    const item = collaborator as {
      id?: string;
      name?: string;
      role?: string;
      quote?: string;
      avatar?: string | null;
      url?: string | null;
    };

    return {
      ...item,
      id: sanitizePlainTextForStorage(item.id ?? '', 'ID mitra'),
      name: sanitizePlainTextForStorage(item.name ?? '', 'Nama mitra'),
      role: sanitizePlainTextForStorage(item.role ?? '', 'Peran mitra'),
      quote: sanitizePlainTextForStorage(item.quote ?? '', 'Quote mitra'),
      avatar: item.avatar && item.avatar !== 'PENDING_UPLOAD'
        ? normalizeSafeUrl(item.avatar, { fieldName: 'Avatar mitra' })
        : null,
      url: item.url ? normalizeSafeUrl(item.url, { fieldName: 'URL mitra' }) : '',
    };
  });
}

function sanitizeCampaignPayload(payload: CampaignInsert): CampaignInsert {
  return {
    ...payload,
    slug: sanitizePlainTextForStorage(payload.slug, 'Slug campaign'),
    title: sanitizePlainTextForStorage(payload.title, 'Judul campaign'),
    category: payload.category ? sanitizePlainTextForStorage(payload.category, 'Kategori campaign') : payload.category,
    description: payload.description ? sanitizeRichTextForStorage(payload.description, 'Deskripsi campaign') : payload.description,
    image_url: payload.image_url ? normalizeSafeUrl(payload.image_url, { fieldName: 'Gambar campaign' }) : payload.image_url,
    images: Array.isArray(payload.images)
      ? payload.images.map((url) => normalizeSafeUrl(url, { fieldName: 'Galeri campaign' }))
      : payload.images,
    collaborators: sanitizeCampaignCollaborators(payload.collaborators),
  };
}

function sanitizeCampaignUpdatePayload(payload: CampaignUpdateInsert): CampaignUpdateInsert {
  return {
    ...payload,
    title: sanitizePlainTextForStorage(payload.title, 'Judul update campaign'),
    content: sanitizeRichTextForStorage(payload.content, 'Isi update campaign'),
    update_type: sanitizePlainTextForStorage(payload.update_type, 'Jenis update campaign') as CampaignUpdateInsert['update_type'],
    image_url: payload.image_url ? normalizeSafeUrl(payload.image_url, { fieldName: 'Gambar update campaign' }) : payload.image_url,
    images: Array.isArray(payload.images)
      ? payload.images.map((url) => normalizeSafeUrl(url, { fieldName: 'Galeri update campaign' }))
      : payload.images,
  };
}

function sanitizeVolunteerProgramPayload<T extends VolunteerProgramInsert | VolunteerProgramUpdate>(payload: T): T {
  return {
    ...payload,
    ...(payload.slug ? { slug: sanitizePlainTextForStorage(payload.slug, 'Slug program relawan') } : {}),
    ...(payload.title ? { title: sanitizePlainTextForStorage(payload.title, 'Judul program relawan') } : {}),
    ...(payload.location ? { location: sanitizePlainTextForStorage(payload.location, 'Lokasi program relawan') } : {}),
    ...(payload.description !== undefined ? { description: payload.description ? sanitizeRichTextForStorage(payload.description, 'Deskripsi program relawan') : payload.description } : {}),
    ...(payload.short_description !== undefined ? { short_description: payload.short_description ? sanitizeRichTextForStorage(payload.short_description, 'Deskripsi singkat program relawan') : payload.short_description } : {}),
    ...(payload.image_url ? { image_url: normalizeSafeUrl(payload.image_url, { fieldName: 'Gambar program relawan' }) } : {}),
    ...(payload.external_link !== undefined ? { external_link: payload.external_link ? normalizeGuidebookUrl(payload.external_link) : null } : {}),
    ...(payload.timeline !== undefined ? { timeline: sanitizeJsonForStorage(payload.timeline, 'Timeline program relawan') } : {}),
    ...(payload.requirements !== undefined ? { requirements: sanitizeJsonForStorage(payload.requirements, 'Syarat program relawan') } : {}),
    ...(payload.form_config !== undefined ? { form_config: sanitizeJsonForStorage(payload.form_config, 'Konfigurasi form relawan') } : {}),
  };
}

// ── Dashboard ──

export function fetchDashboardRows() {
  return Promise.all([
    supabase
      .from('campaigns')
      .select('id, title, status, category, current_amount, target_amount, is_featured'),
    supabase
      .from('donations')
      .select('id, campaign_id, amount, payment_status, donor_name, donor_email, is_anonymous, created_at'),
    supabase
      .from('school_reports')
      .select('id, status, created_at, updated_at'),
  ]);
}

// ── Donors & Transactions ──

export function fetchDonorDonationRows() {
  return supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);
}

export function fetchTransactionRows() {
  return Promise.all([
    supabase.from('donations').select('*').order('created_at', { ascending: false }).limit(1000),
    supabase.from('campaigns').select('id, title'),
  ]);
}

export function updateDonationStatus(
  donationId: string,
  paymentStatus: DonationRow['payment_status'],
) {
  return supabase
    .from('donations')
    .update({ payment_status: paymentStatus } as unknown as Tables['donations']['Update'])
    .eq('id', donationId);
}

// ── School Reports ──

export function fetchSchoolReportRows() {
  return supabase
    .from('school_reports')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1000);
}

export function updateSchoolReportStatus(reportId: string, update: SchoolReportUpdate) {
  return supabase
    .from('school_reports')
    .update(update as unknown as SR['Update'])
    .eq('id', reportId);
}

export function deleteSchoolReport(reportId: string) {
  return supabase
    .from('school_reports')
    .delete()
    .eq('id', reportId);
}

// ── Programs ──

export function fetchProgramRows() {
  return supabase
    .from('programs')
    .select('*')
    .order('updated_at', { ascending: false });
}

export function insertProgram(payload: ProgramInsert) {
  return supabase.from('programs').insert(sanitizeProgramPayload(payload) as unknown as P['Insert']);
}

export function updateProgram(programId: string, payload: ProgramInsert) {
  return supabase.from('programs').update(sanitizeProgramPayload(payload) as unknown as P['Update']).eq('id', programId);
}

export function deleteProgram(programId: string) {
  return supabase.from('programs').delete().eq('id', programId);
}

// ── Site Content ──

export function fetchSiteContentRows() {
  return supabase
    .from('site_content')
    .select('*')
    .order('updated_at', { ascending: false });
}

export function listStorageBuckets() {
  return supabase.storage.listBuckets();
}

export function upsertSiteContent(payload: SiteContentInsert[]) {
  return supabase
    .from('site_content')
    .upsert(payload.map(sanitizeSiteContentPayload) as unknown as SC['Insert'][], { onConflict: 'key' });
}

export function insertSiteContent(payload: SiteContentInsert) {
  return supabase.from('site_content').insert(sanitizeSiteContentPayload(payload) as unknown as SC['Insert']);
}

export function updateSiteContent(entryId: string, payload: SiteContentUpdate) {
  return supabase.from('site_content').update(sanitizeSiteContentPayload(payload) as unknown as SC['Update']).eq('id', entryId);
}

export function deleteSiteContent(entryId: string) {
  return supabase.from('site_content').delete().eq('id', entryId);
}

// ── Campaigns ──

export function fetchCampaignManagerRows() {
  return Promise.all([
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }).limit(500),
    supabase.from('categories').select('*').order('name', { ascending: true }),
  ]);
}

export function fetchCampaignUpdateRows(campaignId: string) {
  return supabase
    .from('campaign_updates')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(200);
}

export function fetchCampaignDonationRows(campaignId: string) {
  return supabase
    .from('donations')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('payment_status', 'success')
    .order('created_at', { ascending: false });
}

export function saveCampaign(payload: CampaignInsert, campaignId?: string) {
  const sanitizedPayload = sanitizeCampaignPayload(payload);
  return campaignId
    ? supabase.from('campaigns').update(sanitizedPayload as unknown as C['Update']).eq('id', campaignId).select('*').single()
    : supabase.from('campaigns').insert(sanitizedPayload as unknown as C['Insert']).select('*').single();
}

export function insertCampaignUpdate(payload: CampaignUpdateInsert) {
  return supabase.from('campaign_updates').insert(sanitizeCampaignUpdatePayload(payload) as unknown as CU['Insert']);
}

export function fetchCampaignDonationProbe(campaignId: string) {
  return supabase
    .from('donations')
    .select('id')
    .eq('campaign_id', campaignId)
    .limit(1);
}

export function fetchCampaignUpdateImageRows(campaignId: string) {
  return supabase
    .from('campaign_updates')
    .select('image_url')
    .eq('campaign_id', campaignId)
    .not('image_url', 'is', null);
}

export function deleteCampaign(campaignId: string) {
  return supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);
}

export function deleteCampaignUpdate(updateId: string) {
  return supabase
    .from('campaign_updates')
    .delete()
    .eq('id', updateId);
}

// ── School Report: Public Submit ──

export function submitSchoolReport(
  payload: SchoolReportInsert,
  photos: File[],
  turnstileToken: string,
) {
  const body = new FormData();
  body.set('payload', JSON.stringify(payload));
  body.set('turnstile_token', turnstileToken);
  photos.forEach((photo) => body.append('photos', photo));

  return supabase.functions.invoke<{ id: string }>('submit-school-report', { body });
}

/**
 * Add an identifier (IP or WA number) to the spammer blacklist.
 * Used by the Admin panel when marking a report as spam.
 */
export function addToBlacklist(payload: SpammerBlacklistInsert) {
  return supabase
    .from('spammer_blacklist')
    .insert(payload as unknown as SB['Insert']);
}

export async function getEdgeFunctionErrorMessage(error: unknown, fallback: string) {
  if (
    error
    && typeof error === 'object'
    && 'context' in error
    && error.context instanceof Response
  ) {
    try {
      const body = await error.context.clone().json() as { error?: string };
      if (body.error) return body.error;
    } catch {
      // Fall back to the SDK error message below.
    }
  }

  return error instanceof Error ? error.message : fallback;
}

// ── Volunteer Programs ──

export function fetchVolunteerPrograms() {
  return supabase
    .from('volunteer_programs')
    .select('*')
    .order('created_at', { ascending: false });
}

export function fetchHeroVolunteerPrograms() {
  return supabase
    .from('volunteer_programs')
    .select('*')
    .eq('show_in_hero', true)
    .order('created_at', { ascending: false });
}

export function fetchVolunteerProgramBySlug(slug: string) {
  return supabase
    .from('volunteer_programs')
    .select('*')
    .eq('slug', slug)
    .single();
}

export function saveVolunteerProgram(payload: VolunteerProgramInsert | VolunteerProgramUpdate, programId?: string) {
  const sanitizedPayload = sanitizeVolunteerProgramPayload(payload);
  return programId
    ? supabase.from('volunteer_programs').update(sanitizedPayload as unknown as VP['Update']).eq('id', programId).select('*').single()
    : supabase.from('volunteer_programs').insert(sanitizedPayload as unknown as VP['Insert']).select('*').single();
}

export function deleteVolunteerProgram(programId: string) {
  return supabase.from('volunteer_programs').delete().eq('id', programId);
}

// ── Volunteer Registrations ──

export function submitVolunteerRegistration(
  payload: any,
  files: Record<string, File>,
  turnstileToken: string,
) {
  const body = new FormData();
  body.set('payload', JSON.stringify(payload));
  body.set('turnstile_token', turnstileToken);
  for (const [key, file] of Object.entries(files)) {
    if (file) {
      body.set(key, file);
    }
  }

  return supabase.functions.invoke<{ id: string }>('submit-volunteer-registration', { body });
}

export function fetchVolunteerRegistrationsByProgram(programId: string) {
  return supabase
    .from('volunteer_registrations')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: false });
}

function extractVolunteerStoragePath(value: string | null) {
  if (!value) return null;
  if (!value.startsWith('http')) return value;

  const marker = '/volunteer-assets/';
  const markerIndex = value.indexOf(marker);
  if (markerIndex === -1) return null;

  return decodeURIComponent(value.slice(markerIndex + marker.length).split('?')[0]);
}


export async function fetchAllVolunteerRegistrations() {
  // Signed URLs are now generated lazily in AdminEduxplore when a row is selected,
  // so we no longer pre-generate them here (which caused N×3 Storage API calls
  // and was the primary suspect for PostgREST timeouts).
  return supabase
    .from('volunteer_registrations')
    .select('*')
    .limit(500)
    .order('created_at', { ascending: false });
}

export function updateVolunteerRegistrationStatus(
  id: string,
  update: VolunteerRegistrationUpdate,
) {
  return supabase
    .from('volunteer_registrations')
    .update(update as unknown as VR['Update'])
    .eq('id', id);
}

export async function deleteVolunteerRegistrations(ids: string[]) {
  // 1. Ambil URL file untuk pendaftar yang akan dihapus
  const { data: records, error: fetchError } = await supabase
    .from('volunteer_registrations')
    .select('bukti_dp_url, bukti_follow_url, foto_id_url')
    .in('id', ids);

  // 2. Kumpulkan path file dari storage
  if (!fetchError && records && records.length > 0) {
    const filePaths: string[] = [];

    records.forEach((record) => {
      const dp = extractVolunteerStoragePath(record.bukti_dp_url ?? null);
      const follow = extractVolunteerStoragePath(record.bukti_follow_url ?? null);
      const idCard = extractVolunteerStoragePath(record.foto_id_url ?? null);

      if (dp) filePaths.push(dp);
      if (follow) filePaths.push(follow);
      if (idCard) filePaths.push(idCard);
    });

    // 3. Hapus file dari Supabase Storage jika ada
    if (filePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('volunteer-assets')
        .remove(filePaths);

      if (storageError) {
        logError('repository.deleteVolunteerRegistrations.storage', storageError, { filePaths });
      }
    }
  }

  // 4. Hapus baris data dari database
  return supabase
    .from('volunteer_registrations')
    .delete()
    .in('id', ids);
}
