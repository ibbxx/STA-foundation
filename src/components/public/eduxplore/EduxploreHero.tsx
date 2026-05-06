import { motion } from 'framer-motion';
import { MapPin, ArrowRight } from 'lucide-react';
import type { VolunteerProgramData } from '../../../lib/eduxplore';

interface Props {
  program: VolunteerProgramData;
}

export default function EduxploreHero({ program }: Props) {
  const handleScrollToForm = () => {
    document.getElementById('form-pendaftaran')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[100svh] w-full flex flex-col justify-end md:justify-center overflow-clip bg-gray-900">
      {/* Background */}
      {program.image_url && (
        <div className="absolute inset-0 z-0">
          <img
            src={program.image_url}
            className="w-full h-full object-cover object-center"
            alt={program.title}
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent md:bg-gradient-to-r md:from-gray-900/90 md:via-gray-900/40 md:to-transparent" />
        </div>
      )}

      {/* Fallback gradient when no image */}
      {!program.image_url && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-950 via-gray-900 to-gray-950" />
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 pb-6 md:pb-0 pt-20 md:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full md:max-w-2xl"
        >
          {/* Badge Lokasi Premium */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-3 pr-4 pl-1.5 py-1.5 backdrop-blur-md bg-white/10 border border-white/20 rounded-full mb-6 shadow-2xl"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <span className="text-[10px] md:text-xs font-bold text-[#F5F1E8] tracking-[0.2em] uppercase">
              {program.location}
            </span>
          </motion.div>

          <h1 className="font-black text-white leading-[1.2] tracking-tight mb-4 md:mb-6">
            {(() => {
              const match = program.title.match(/^(EDUXPLORE\s+#\d+)\s+(.*)$/i);
              if (match) {
                return (
                  <>
                    <span className="block text-[28px] sm:text-4xl md:text-6xl lg:text-7xl mb-1 md:mb-2 text-white">
                      {match[1]}
                    </span>
                    <span className="block text-[16px] sm:text-2xl md:text-3xl lg:text-4xl text-emerald-400 font-bold">
                      {match[2]}
                    </span>
                  </>
                );
              }
              return (
                <span className="block text-[20px] sm:text-3xl md:text-5xl lg:text-6xl">
                  {program.title}
                </span>
              );
            })()}
          </h1>

          {program.description && (
            <p className="text-[11px] sm:text-sm md:text-xl text-gray-300 leading-relaxed font-light max-w-xl mb-8 md:mb-10">
              {program.description}
            </p>
          )}

          {program.status === 'open' && (
            <div className="flex flex-row items-center gap-3">
              <button
                onClick={handleScrollToForm}
                className="inline-flex h-10 md:h-14 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 md:px-10 text-[11px] md:text-base font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-900/40 group"
              >
                Daftar Sekarang
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform md:w-5 md:h-5"
                />
              </button>
            </div>
          )}

          {program.status === 'closed' && (
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-red-500/20 border border-red-500/30 rounded-full">
              <span className="text-sm font-bold text-red-300">Pendaftaran Ditutup</span>
            </div>
          )}

          {program.status === 'ongoing' && (
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500/20 border border-amber-500/30 rounded-full">
              <span className="text-sm font-bold text-amber-300">Program Sedang Berlangsung</span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
