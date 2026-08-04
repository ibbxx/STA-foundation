import { logError } from '../error-logger';
import { supabase } from '../supabase/types';

export type LeaderboardEntry = {
  identifier: string;
  display_name: string;
  total_amount: number;
  donation_count: number;
  rank?: number;
};

let cachedLeaderboard: LeaderboardEntry[] | null = null;
let cacheExpiryTime = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 Menit Client-Side Memory Cache

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const now = Date.now();
  // Jika cache memori masih berlaku (< 2 menit), kembalikan data langsung tanpa hit database!
  if (cachedLeaderboard && now < cacheExpiryTime) {
    return cachedLeaderboard;
  }

  let entries: LeaderboardEntry[] = [];

  // Layer 1: RPC Call get_public_leaderboard (Direct real-time query via SECURITY DEFINER)
  try {
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('get_public_leaderboard', { p_limit: 100 });
    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      entries = rpcData.map((row: any, index: number) => ({
        identifier: row.identifier,
        display_name: row.display_name,
        total_amount: Number(row.total_amount ?? 0),
        donation_count: Number(row.donation_count ?? 0),
        rank: index + 1,
      }));
    }
  } catch (err) {
    logError('leaderboard.fetchLeaderboard.rpc', err);
  }

  // Layer 2: Edge Function get-public-leaderboard (jika Layer 1 kosong)
  if (entries.length === 0) {
    try {
      const { data, error } = await supabase.functions.invoke<{ entries: LeaderboardEntry[] }>('get-public-leaderboard', {
        body: { limit: 100 },
      });

      if (!error && data?.entries && data.entries.length > 0) {
        entries = data.entries.map((row, index) => ({
          identifier: row.identifier,
          display_name: row.display_name,
          total_amount: Number(row.total_amount ?? 0),
          donation_count: Number(row.donation_count ?? 0),
          rank: index + 1,
        }));
      }
    } catch (err) {
      logError('leaderboard.fetchLeaderboard.edgeFunction', err);
    }
  }

  // Layer 3: Materialized View leaderboard via Supabase Client (jika Layer 1 & 2 kosong)
  if (entries.length === 0) {
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('leaderboard')
        .select('identifier, display_name, total_amount, donation_count')
        .order('total_amount', { ascending: false })
        .limit(100);

      if (!dbError && dbData) {
        entries = dbData.map((row: any, index: number) => ({
          identifier: row.identifier,
          display_name: row.display_name,
          total_amount: Number(row.total_amount ?? 0),
          donation_count: Number(row.donation_count ?? 0),
          rank: index + 1,
        }));
      }
    } catch (err) {
      logError('leaderboard.fetchLeaderboard.error', err);
    }
  }

  // Simpan hasil ke cache memori selama 2 menit
  if (entries.length > 0) {
    cachedLeaderboard = entries;
    cacheExpiryTime = now + CACHE_TTL_MS;
  }

  return entries;
}
