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
  const { data, error } = await supabase.functions.invoke<{ entries: LeaderboardEntry[] }>('get-public-leaderboard', {
    body: { limit: 100 },
  });

  if (error) {
    logError('leaderboard.fetchLeaderboard', error);
    return [];
  }

  return (data?.entries ?? []).map((row, index) => ({
    identifier: row.identifier,
    display_name: row.display_name,
    total_amount: Number(row.total_amount ?? 0),
    donation_count: Number(row.donation_count ?? 0),
    rank: index + 1,
  }));
}
