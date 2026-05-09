import { logError } from '../error-logger';
import { supabase } from '../supabase/types';

export type LeaderboardEntry = {
  identifier: string;
  display_name: string;
  total_amount: number;
  donation_count: number;
  rank?: number;
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // Mengambil data dari VIEW 'leaderboard' di Supabase
  const { data, error } = await supabase
    .from('leaderboard')
    .select('identifier, display_name, total_amount, donation_count')
    .order('total_amount', { ascending: false })
    .limit(100);

  if (error) {
    logError('leaderboard.fetchLeaderboard', error);
    return [];
  }

  return (data ?? []).map((row, index) => ({
    identifier: row.identifier,
    display_name: row.display_name,
    total_amount: Number(row.total_amount ?? 0),
    donation_count: Number(row.donation_count ?? 0),
    rank: index + 1,
  }));
}
