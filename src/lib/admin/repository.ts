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
} from '../supabase/types';
import { supabase } from '../supabase/types';

export function fetchDashboardRows() {
  return Promise.all([
    supabase.from('campaigns').select('*'),
    supabase.from('donations').select('*'),
    supabase.from('school_reports').select('*'),
  ]);
}

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

export function fetchSchoolReportRows() {
  return supabase
    .from('school_reports')
    .select('*')
    .order('updated_at', { ascending: false });
}

export function updateSchoolReportStatus(reportId: string, update: SchoolReportUpdate) {
  return supabase
    .from('school_reports')
    .update(update as never)
    .eq('id', reportId);
}

export function deleteSchoolReport(reportId: string) {
  return supabase
    .from('school_reports')
    .delete()
    .eq('id', reportId);
}

export function fetchProgramRows() {
  return supabase
    .from('programs')
    .select('*')
    .order('updated_at', { ascending: false });
}

export function insertProgram(payload: ProgramInsert) {
  return supabase.from('programs').insert(payload as never);
}

export function updateProgram(programId: string, payload: ProgramInsert) {
  return supabase.from('programs').update(payload as never).eq('id', programId);
}

export function deleteProgram(programId: string) {
  return supabase.from('programs').delete().eq('id', programId);
}

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
    .upsert(payload as never, { onConflict: 'key' });
}

export function insertSiteContent(payload: SiteContentInsert) {
  return supabase.from('site_content').insert(payload as never);
}

export function updateSiteContent(entryId: string, payload: SiteContentUpdate) {
  return supabase.from('site_content').update(payload as never).eq('id', entryId);
}

export function deleteSiteContent(entryId: string) {
  return supabase.from('site_content').delete().eq('id', entryId);
}

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
    ? supabase.from('campaigns').update(payload as never).eq('id', campaignId).select('*').single()
    : supabase.from('campaigns').insert(payload as never).select('*').single();
}

export function insertCampaignUpdate(payload: CampaignUpdateInsert) {
  return supabase.from('campaign_updates').insert(payload as never);
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

/**
 * Upload school report photos to Supabase Storage bucket 'school-reports'.
 * Returns array of public URLs.
 */
export async function uploadSchoolReportPhotos(photos: File[]): Promise<string[]> {
  const urls: string[] = [];

  for (const photo of photos) {
    const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `reports/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from('school-reports')
      .upload(filePath, photo, { cacheControl: '3600', upsert: false });

    if (!error) {
      const { data: urlData } = supabase.storage
        .from('school-reports')
        .getPublicUrl(filePath);
      urls.push(urlData.publicUrl);
    }
  }

  return urls;
}

/**
 * Insert a new school report row (status defaults to 'pending').
 */
export function insertSchoolReport(payload: SchoolReportInsert) {
  return supabase
    .from('school_reports')
    .insert(payload as never)
    .select('*')
    .single();
}

// ── Anti-Spam: Blacklist & Rate Limit ──

/**
 * Check if an IP address or WhatsApp number is blacklisted.
 * Returns true if the identifier is found in the blacklist.
 */
export async function checkIsBlacklisted(ip: string, whatsapp: string): Promise<boolean> {
  const { data } = await supabase
    .from('spammer_blacklist')
    .select('id')
    .or(`identifier.eq.${ip},identifier.eq.${whatsapp}`)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/**
 * Check how many reports were submitted from a given IP in the last hour.
 * Returns true if the count exceeds maxPerHour (default: 2).
 */
export async function checkIPRateLimit(ip: string, maxPerHour = 50): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from('school_reports')
    .select('id', { count: 'exact', head: true })
    .eq('reporter_ip', ip)
    .gte('created_at', oneHourAgo);

  return (count ?? 0) >= maxPerHour;
}

/**
 * Add an identifier (IP or WA number) to the spammer blacklist.
 * Used by the Admin panel when marking a report as spam.
 */
export function addToBlacklist(payload: SpammerBlacklistInsert) {
  return supabase
    .from('spammer_blacklist')
    .insert(payload as never);
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
    .eq('status', 'open')
    .order('created_at', { ascending: false });
}

export function fetchVolunteerProgramBySlug(slug: string) {
  return supabase
    .from('volunteer_programs')
    .select('*')
    .eq('slug', slug)
    .single();
}

export function saveVolunteerProgram(payload: VolunteerProgramInsert, programId?: string) {
  return programId
    ? supabase.from('volunteer_programs').update(payload as never).eq('id', programId).select('*').single()
    : supabase.from('volunteer_programs').insert(payload as never).select('*').single();
}

export function deleteVolunteerProgram(programId: string) {
  return supabase.from('volunteer_programs').delete().eq('id', programId);
}

// ── Volunteer Registrations ──

export async function uploadVolunteerFile(
  file: File,
  prefix: 'dp' | 'follow' | 'id_card',
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  const filePath = `${prefix}/${Date.now()}_${uniqueId}_${safeName}`;

  const { error } = await supabase.storage
    .from('volunteer-assets')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from('volunteer-assets').getPublicUrl(filePath);
  return data.publicUrl;
}

export function insertVolunteerRegistration(payload: VolunteerRegistrationInsert) {
  // Tidak menggunakan .select() agar anon tidak membutuhkan SELECT policy.
  // RLS hanya memerlukan INSERT policy untuk operasi ini.
  return supabase
    .from('volunteer_registrations')
    .insert(payload as never);
}

export function fetchVolunteerRegistrationsByProgram(programId: string) {
  return supabase
    .from('volunteer_registrations')
    .select('*')
    .eq('program_id', programId)
    .order('created_at', { ascending: false });
}

export function fetchAllVolunteerRegistrations() {
  return supabase
    .from('volunteer_registrations')
    .select('*')
    .order('created_at', { ascending: false });
}

export function updateVolunteerRegistrationStatus(
  id: string,
  update: VolunteerRegistrationUpdate,
) {
  return supabase
    .from('volunteer_registrations')
    .update(update as never)
    .eq('id', id);
}
