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
    .order('created_at', { ascending: false });
}

export function fetchTransactionRows() {
  return Promise.all([
    supabase.from('donations').select('*').order('created_at', { ascending: false }),
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
    .order('updated_at', { ascending: false });
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
  return supabase.from('programs').insert(payload as unknown as P['Insert']);
}

export function updateProgram(programId: string, payload: ProgramInsert) {
  return supabase.from('programs').update(payload as unknown as P['Update']).eq('id', programId);
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
    .upsert(payload as unknown as SC['Insert'][], { onConflict: 'key' });
}

export function insertSiteContent(payload: SiteContentInsert) {
  return supabase.from('site_content').insert(payload as unknown as SC['Insert']);
}

export function updateSiteContent(entryId: string, payload: SiteContentUpdate) {
  return supabase.from('site_content').update(payload as unknown as SC['Update']).eq('id', entryId);
}

export function deleteSiteContent(entryId: string) {
  return supabase.from('site_content').delete().eq('id', entryId);
}

// ── Campaigns ──

export function fetchCampaignManagerRows() {
  return Promise.all([
    supabase.from('campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name', { ascending: true }),
  ]);
}

export function fetchCampaignUpdateRows(campaignId: string) {
  return supabase
    .from('campaign_updates')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
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
  return campaignId
    ? supabase.from('campaigns').update(payload as unknown as C['Update']).eq('id', campaignId).select('*').single()
    : supabase.from('campaigns').insert(payload as unknown as C['Insert']).select('*').single();
}

export function insertCampaignUpdate(payload: CampaignUpdateInsert) {
  return supabase.from('campaign_updates').insert(payload as unknown as CU['Insert']);
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
  return programId
    ? supabase.from('volunteer_programs').update(payload as unknown as VP['Update']).eq('id', programId).select('*').single()
    : supabase.from('volunteer_programs').insert(payload as unknown as VP['Insert']).select('*').single();
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

async function createVolunteerSignedUrl(value: string | null) {
  const path = extractVolunteerStoragePath(value);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from('volunteer-assets')
    .createSignedUrl(path, 60 * 60);

  if (error) {
    logError('repository.createVolunteerSignedUrl', error, { path });
    return null;
  }

  return data.signedUrl;
}

export async function fetchAllVolunteerRegistrations() {
  const response = await supabase
    .from('volunteer_registrations')
    .select('*')
    .limit(10000)
    .order('created_at', { ascending: false });

  if (response.error || !response.data) {
    return response;
  }

  const data = await Promise.all(response.data.map(async (registration) => {
    const [dpUrl, followUrl, idUrl] = await Promise.all([
      createVolunteerSignedUrl(registration.bukti_dp_url),
      createVolunteerSignedUrl(registration.bukti_follow_url),
      createVolunteerSignedUrl(registration.foto_id_url),
    ]);

    return {
      ...registration,
      bukti_dp_url: dpUrl,
      bukti_follow_url: followUrl,
      foto_id_url: idUrl,
    };
  }));

  return { ...response, data };
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
