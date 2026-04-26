import type {
  CampaignInsert,
  CampaignUpdateInsert,
  ProgramInsert,
  SchoolReportUpdate,
  SiteContentInsert,
  SiteContentUpdate,
} from './supabase';
import { supabase } from './supabase';

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
