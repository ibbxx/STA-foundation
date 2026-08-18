/**
 * Diagnostic Script: Leaderboard & Campaign Donations (READ-ONLY)
 *
 * Script ini TIDAK membuat, mengubah, atau menghapus data apa pun.
 * Hanya membaca data yang sudah ada untuk mendiagnosis masalah leaderboard.
 *
 * Jalankan: npx tsx scripts/diagnose-leaderboard.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          let value = trimmed.slice(idx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch {}
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diset di .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DIVIDER = '─'.repeat(60);

async function main() {
  console.log('\n🔍 Leaderboard & Campaign Donations Diagnostic\n');
  console.log(DIVIDER);
  console.log('ℹ️  Mode: READ-ONLY — tidak ada data yang diubah');
  console.log('ℹ️  Menggunakan: ANON KEY (seperti browser publik)');
  console.log(DIVIDER);

  // ── 1. Cek jumlah donasi per status ──
  console.log('\n📊 1. Jumlah donasi per payment_status (via admin view)');
  console.log('   (Catatan: anon key mungkin tidak bisa akses tabel donations langsung karena RLS)');
  try {
    const { data: donations, error, count } = await supabase
      .from('donations')
      .select('id, payment_status, is_anonymous', { count: 'exact' })
      .limit(1000);

    if (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
      console.log('   → Ini normal jika RLS membatasi akses anon ke tabel donations');
    } else {
      const total = count ?? donations?.length ?? 0;
      const statusCounts: Record<string, number> = {};
      const anonCounts = { anonymous: 0, nonAnonymous: 0 };

      (donations ?? []).forEach((d: any) => {
        statusCounts[d.payment_status] = (statusCounts[d.payment_status] || 0) + 1;
        if (d.is_anonymous) anonCounts.anonymous++;
        else anonCounts.nonAnonymous++;
      });

      console.log(`   Total rows accessible: ${total}`);
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   • ${status}: ${count}`);
      });
      console.log(`   • is_anonymous=true: ${anonCounts.anonymous}`);
      console.log(`   • is_anonymous=false: ${anonCounts.nonAnonymous}`);
      console.log(`   → Eligible untuk leaderboard (success + non-anonymous): ${
        (donations ?? []).filter((d: any) => d.payment_status === 'success' && !d.is_anonymous).length
      }`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err}`);
  }

  // ── 2. Test RPC get_public_leaderboard ──
  console.log(`\n${DIVIDER}`);
  console.log('📊 2. Test RPC get_public_leaderboard (Layer 1)');
  try {
    const { data, error } = await (supabase.rpc as any)('get_public_leaderboard', { p_limit: 10 });
    if (error) {
      console.log(`   ⚠️  RPC Error: ${error.message}`);
      console.log(`   → Kemungkinan: fungsi RPC belum di-deploy ke Supabase remote`);
      console.log(`   → Solusi: jalankan migrasi 20260805000000 & 20260805010000`);
    } else if (!Array.isArray(data) || data.length === 0) {
      console.log('   ⚠️  RPC berhasil dipanggil tapi mengembalikan 0 rows');
      console.log('   → Kemungkinan: belum ada donasi success + non-anonymous di database');
    } else {
      console.log(`   ✅ RPC berhasil! Mengembalikan ${data.length} entries:`);
      data.slice(0, 5).forEach((entry: any, i: number) => {
        console.log(`      ${i + 1}. ${entry.display_name} — Rp ${Number(entry.total_amount).toLocaleString('id-ID')} (${entry.donation_count}x donasi)`);
      });
      if (data.length > 5) console.log(`      ... dan ${data.length - 5} lainnya`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err}`);
  }

  // ── 3. Test Materialized View leaderboard (Layer 3) ──
  console.log(`\n${DIVIDER}`);
  console.log('📊 3. Test SELECT dari Materialized View leaderboard (Layer 3)');
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('identifier, display_name, total_amount, donation_count')
      .order('total_amount', { ascending: false })
      .limit(5);

    if (error) {
      console.log(`   ⚠️  Error: ${error.message} (code: ${error.code})`);
      if (error.code === '42501') {
        console.log('   → Permission Denied — ini normal karena SELECT di-REVOKE dari anon');
        console.log('   → Layer 3 akan selalu gagal untuk client publik (by design)');
      }
    } else if (!data || data.length === 0) {
      console.log('   ⚠️  Query berhasil tapi 0 rows — materialized view mungkin belum di-refresh');
    } else {
      console.log(`   ✅ Berhasil! ${data.length} entries dari materialized view`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err}`);
  }

  // ── 4. Test Edge Function get-public-leaderboard (Layer 2) ──
  console.log(`\n${DIVIDER}`);
  console.log('📊 4. Test Edge Function get-public-leaderboard (Layer 2)');
  try {
    const { data, error } = await supabase.functions.invoke('get-public-leaderboard', {
      body: { limit: 5 },
    });

    if (error) {
      console.log(`   ⚠️  Edge Function Error: ${typeof error === 'object' ? JSON.stringify(error) : error}`);
      console.log('   → Kemungkinan: Edge Function belum di-deploy');
      console.log('   → Solusi: supabase functions deploy get-public-leaderboard');
    } else if (!data?.entries || data.entries.length === 0) {
      console.log('   ⚠️  Edge Function berhasil tapi 0 entries — materialized view kosong/stale');
    } else {
      console.log(`   ✅ Edge Function berhasil! ${data.entries.length} entries`);
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err}`);
  }

  // ── 5. Test Edge Function get-public-campaign-donations (Tab DONATUR) ──
  console.log(`\n${DIVIDER}`);
  console.log('📊 5. Test Edge Function get-public-campaign-donations (Tab DONATUR)');

  // Pertama, ambil 1 campaign aktif untuk testing
  try {
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, title, slug')
      .eq('status', 'active')
      .limit(1);

    if (campaignError || !campaigns || campaigns.length === 0) {
      console.log('   ⚠️  Tidak ada campaign aktif ditemukan untuk testing');
    } else {
      const campaign = campaigns[0];
      console.log(`   Testing dengan campaign: "${campaign.title}" (${campaign.id.slice(0, 8)}...)`);

      const { data, error } = await supabase.functions.invoke('get-public-campaign-donations', {
        body: { campaign_id: campaign.id, limit: 5 },
      });

      if (error) {
        console.log(`   ⚠️  Edge Function Error: ${typeof error === 'object' ? JSON.stringify(error) : error}`);
        console.log('   → Kemungkinan: Edge Function belum di-deploy');
        console.log('   → Solusi: supabase functions deploy get-public-campaign-donations');
      } else if (!data?.donations || data.donations.length === 0) {
        console.log('   ⚠️  Edge Function berhasil tapi 0 donations untuk campaign ini');
        console.log('   → Kemungkinan: belum ada donasi success untuk campaign ini');
      } else {
        console.log(`   ✅ Edge Function berhasil! ${data.donations.length} donatur:`);
        data.donations.slice(0, 3).forEach((d: any, i: number) => {
          console.log(`      ${i + 1}. ${d.donor_name_display} — Rp ${Number(d.amount).toLocaleString('id-ID')}`);
        });
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception: ${err}`);
  }

  // ── Ringkasan ──
  console.log(`\n${DIVIDER}`);
  console.log('📋 Ringkasan Checklist:\n');
  console.log('  □ Pastikan migrasi SQL sudah di-apply (terutama 20260805*, 20260818*)');
  console.log('  □ Pastikan Edge Functions sudah di-deploy:');
  console.log('    supabase functions deploy get-public-leaderboard');
  console.log('    supabase functions deploy get-public-campaign-donations');
  console.log('  □ Pastikan SUPABASE_SERVICE_ROLE_KEY diset di Vercel env vars');
  console.log('  □ Pastikan ada data donasi nyata dengan payment_status = "success"');
  console.log(`\n${DIVIDER}\n`);
}

main().catch(console.error);
