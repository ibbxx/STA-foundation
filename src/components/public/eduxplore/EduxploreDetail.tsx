import { motion } from 'framer-motion';
import { CheckCircle2, Heart, BookOpen, Users } from 'lucide-react';

interface Props {
  description: string | null;
  requirements: string[];
}

export default function EduxploreDetail({ description, requirements }: Props) {
  return (
    <section className="py-16 sm:py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Deskripsi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">
                Tentang Program
              </p>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Apa itu EduXplore?
              </h2>
            </div>

            {description && (
              <p className="text-sm sm:text-base text-gray-600 font-light leading-relaxed">
                {description}
              </p>
            )}

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: BookOpen, title: 'Edukasi', desc: 'Mengajar dan berbagi ilmu langsung kepada siswa di daerah terpencil.' },
                { icon: Users, title: 'Kegiatan Lapangan', desc: 'Terjun langsung ke komunitas untuk dampak yang nyata.' },
                { icon: Heart, title: 'Dampak Sosial', desc: 'Membangun koneksi dan meninggalkan jejak perubahan.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <item.icon size={20} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Persyaratan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">
                Sebelum Mendaftar
              </p>
              <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Persyaratan
              </h2>
            </div>

            {requirements.length > 0 && (
              <div className="space-y-4">
                {requirements.map((req, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed">
                      {req.toLowerCase().includes('membayar dp') && !req.includes('300')
                        ? `${req} (Rp 300.000)`
                        : req}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
