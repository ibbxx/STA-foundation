import { ArrowLeft, ArrowRight, ArrowDownRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getProgramIcon } from '../../lib/program-icons';
import { getProgramBySlug, PROGRAMS } from '../../lib/programs';

export default function ProgramDetail() {
  const { slug } = useParams();
  const program = getProgramBySlug(slug);

  if (!program) {
    return (
      <div className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-3xl px-5 text-center md:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">Program STA</p>
          <h1 className="mt-4 text-2xl md:text-4xl font-black text-gray-900">Program tidak ditemukan</h1>
          <p className="mt-4 text-[15px] md:text-base leading-relaxed text-gray-600">
            Halaman program yang Anda cari belum tersedia atau slug-nya tidak sesuai.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center rounded-full bg-emerald-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-800"
          >
            <ArrowLeft size={16} className="mr-2" />
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  const Icon = getProgramIcon(program.icon_name);
  const relatedPrograms = PROGRAMS.filter((item) => item.slug !== program.slug);

  return (
    <div className="bg-white selection:bg-emerald-100 selection:text-emerald-900">
      {/* ═══════ HERO: PREMIUM CLEAN (MOBILE OPTIMIZED) ═══════ */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-24 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          
          <Link
            to="/"
            className="group inline-flex items-center text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase text-emerald-700 mb-8 md:mb-12 hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-white shadow-sm flex items-center justify-center text-emerald-700 rounded-full border border-emerald-100 shrink-0">
                  <Icon size={28} strokeWidth={1.5} className="md:w-8 md:h-8" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 mb-1">
                    {program.stage_label}
                  </p>
                  <p className="text-xs md:text-sm font-medium text-gray-500">
                    Fase: {program.stage_value}
                  </p>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.2] tracking-tight">
                {program.title}
              </h1>
              
              <p className="max-w-xl text-base md:text-xl font-light leading-relaxed text-gray-600">
                {program.short_description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 md:pt-6">
                <Link
                  to="/kontak"
                  className="inline-flex h-12 md:h-14 items-center justify-center bg-emerald-700 px-8 font-bold text-white transition-colors hover:bg-emerald-800 rounded-full sm:rounded-none text-sm md:text-base"
                >
                  Kolaborasi Sekarang
                </Link>
                <Link
                  to="/laporkan"
                  className="inline-flex h-12 md:h-14 items-center justify-center border border-gray-300 px-8 font-bold text-gray-700 transition-colors hover:border-emerald-700 hover:text-emerald-700 bg-white rounded-full sm:rounded-none text-sm md:text-base"
                >
                  Laporkan Sekolah
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 w-full bg-white border border-gray-100 p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl sm:rounded-none mt-0 lg:mt-0">
              <p className="text-xs md:text-sm font-bold uppercase tracking-[0.15em] text-emerald-700 mb-4 md:mb-6">Ringkasan Program</p>
              <p className="text-[15px] md:text-lg font-light leading-relaxed text-gray-700">
                {program.overview}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════ FOCUS AREAS: CLEAN LIST ═══════ */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 md:gap-16 lg:gap-20">
            
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-max">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-[2px] bg-emerald-600"></span>
                <h2 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Fokus Program
                </h2>
              </div>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
                Strategi &<br className="hidden lg:block"/> Implementasi
              </h3>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
              {program.focus_areas.map((focus, index) => (
                <div
                  key={focus}
                  className="group bg-white border border-gray-100 p-6 md:p-8 lg:p-10 flex gap-5 md:gap-6 hover:border-emerald-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 rounded-2xl md:rounded-none"
                >
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-base md:text-lg">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="pt-0.5 md:pt-2">
                    <p className="text-[15px] md:text-xl font-light leading-relaxed text-gray-800">
                      {focus}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ═══════ RELATED PROGRAMS: PREMIUM CARDS ═══════ */}
      <section className="bg-[#FAF9F6] py-20 md:py-28 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-200 pb-6 md:pb-10 mb-10 md:mb-12 gap-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">
              Inisiatif Lainnya
            </h2>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[13px] md:text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Kembali ke Beranda</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {relatedPrograms.map((item) => {
              const RelatedIcon = getProgramIcon(item.icon_name);
              return (
                <Link
                  key={item.id}
                  to={item.detail_path}
                  className="group bg-white border border-gray-100 p-6 md:p-8 lg:p-12 flex flex-col justify-between hover:border-emerald-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 rounded-2xl md:rounded-none"
                >
                  <div className="flex items-start justify-between mb-8 md:mb-10">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                      <RelatedIcon size={24} strokeWidth={1.5} className="md:w-7 md:h-7" />
                    </div>
                    <ArrowDownRight size={20} className="text-gray-300 group-hover:text-emerald-600 -rotate-90 group-hover:rotate-0 transition-transform duration-500 md:w-6 md:h-6" />
                  </div>

                  <div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 md:mb-4 leading-snug group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-[15px] md:text-base leading-relaxed font-light">
                      {item.short_description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>
    </div>
  );
}
