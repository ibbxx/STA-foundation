import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import type { VolunteerTimelineItem } from '../../../lib/eduxplore';

interface Props {
  timeline: VolunteerTimelineItem[];
}

export default function EduxploreTimeline({ timeline }: Props) {
  if (!timeline || timeline.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600 mb-3">
            Jadwal Kegiatan
          </p>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Timeline Program
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-8 sm:space-y-10">
            {timeline.map((item, index) => {
              const isCompleted = item.isCompleted ?? false;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-5 sm:gap-6"
                >
                  {/* Dot */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-emerald-100 ring-4 ring-emerald-50'
                        : 'bg-gray-100 ring-4 ring-gray-50'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    ) : (
                      <Circle size={20} className="text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-1.5 sm:pt-2.5">
                    <p
                      className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 ${
                        isCompleted ? 'text-emerald-600' : 'text-gray-400'
                      }`}
                    >
                      {item.date}
                    </p>
                    <h3
                      className={`text-base sm:text-lg font-bold ${
                        isCompleted ? 'text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
