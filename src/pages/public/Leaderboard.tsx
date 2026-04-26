import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Heart } from 'lucide-react';
import { fetchLeaderboard, LeaderboardEntry } from '../../lib/leaderboard';
import { formatCurrency, cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const getBadgeIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500 w-6 h-6" />;
    if (rank === 2) return <Medal className="text-gray-400 w-6 h-6" />;
    if (rank === 3) return <Medal className="text-amber-600 w-6 h-6" />;
    if (rank <= 10) return <Star className="text-emerald-500 w-5 h-5" />;
    return <span className="text-gray-400 font-bold w-6 text-center">{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50/50 border-yellow-200 shadow-sm';
    if (rank === 2) return 'bg-gray-50/50 border-gray-200';
    if (rank === 3) return 'bg-amber-50/50 border-amber-200';
    return 'bg-white border-gray-100 hover:border-emerald-100';
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 mb-6">
              <Trophy size={32} />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
              Pejuang Tanah Air
            </h1>
            <p className="text-gray-500 max-w-xl mx-auto text-base md:text-lg font-light leading-relaxed">
              Penghargaan tertinggi bagi mereka yang telah memberikan kontribusi luar biasa untuk pendidikan anak-anak Indonesia.
            </p>
          </motion.div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-12">
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 bg-emerald-700 text-white px-8 py-3.5 rounded-full font-bold hover:bg-emerald-800 transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Heart size={18} />
            Jadilah Pejuang Selanjutnya
          </Link>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-20 text-gray-500">Memuat data pejuang...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
              <p className="text-gray-500">Belum ada data donasi yang masuk ke leaderboard.</p>
            </div>
          ) : (
            entries.map((entry, index) => (
              <motion.div
                key={entry.identifier}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  "flex items-center p-4 md:p-6 rounded-2xl border transition-all duration-300",
                  getRankStyle(entry.rank || index + 1)
                )}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-center w-12 shrink-0">
                  {getBadgeIcon(entry.rank || index + 1)}
                </div>

                {/* Donor Info */}
                <div className="flex-1 min-w-0 px-4">
                  <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">
                    {entry.display_name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">
                    Mendukung {entry.donation_count} kali donasi
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div className="text-base md:text-xl font-black text-emerald-800">
                    {formatCurrency(entry.total_amount)}
                  </div>
                  {entry.rank === 1 && (
                    <span className="inline-block mt-1 text-[10px] uppercase tracking-widest font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                      Peringkat 1
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
