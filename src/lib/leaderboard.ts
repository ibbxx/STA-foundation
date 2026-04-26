import { supabase } from './supabase';

export type LeaderboardEntry = {
  identifier: string;
  display_name: string;
  total_amount: number;
  donation_count: number;
  rank?: number;
};

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  // Mengambil data dari VIEW 'leaderboard' yang akan dibuat di Supabase
  const { data, error } = await supabase
    .from('leaderboard' as any)
    .select('*')
    .order('total_amount', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  // Menambahkan atribut rank secara dinamis dan memastikan tipe data
  return ((data as any[]) || []).map((row, index) => ({
    ...row,
    total_amount: Number(row.total_amount || 0), // Paksa jadi number untuk mencegah crash di formatCurrency
    rank: index + 1,
  })) as LeaderboardEntry[];
}
