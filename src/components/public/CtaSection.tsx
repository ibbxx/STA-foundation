import { Quote } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CtaData } from '../../lib/constants';

type CtaSectionProps = {
  data: CtaData;
};

export default function CtaSection({ data }: CtaSectionProps) {
  return (
    <section className="py-8 sm:py-14 md:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-0 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/30">
          {/* Text */}
          <div className="relative order-2 flex flex-col justify-center overflow-hidden bg-emerald-700 p-6 sm:p-10 md:p-14 lg:order-1 lg:p-16">
            <div className="absolute top-0 right-0 w-40 sm:w-48 h-40 sm:h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 sm:w-32 h-28 sm:h-32 bg-teal-800/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-4 sm:space-y-5">
              <Quote size={28} className="text-emerald-400/40" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {data.title}
              </h2>
              <p className="text-emerald-100/75 text-sm sm:text-base leading-relaxed">
                {data.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link to={data.primaryButtonLink} className="bg-white text-emerald-700 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold hover:bg-emerald-50 transition-all text-center text-sm shadow-lg">
                  {data.primaryButtonText}
                </Link>
                <Link to={data.secondaryButtonLink} className="bg-emerald-800/60 text-white px-6 sm:px-7 py-3 sm:py-3.5 rounded-full font-bold hover:bg-emerald-800 transition-all text-center text-sm border border-emerald-600/40">
                  {data.secondaryButtonText}
                </Link>
              </div>
            </div>
          </div>

          <div className="relative aspect-[16/10] lg:aspect-auto order-1 lg:order-2 bg-emerald-800/10">
            {data.imageUrl && (
              <img
                src={data.imageUrl}
                alt={data.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-emerald-700/5" />
          </div>
        </div>
      </div>
    </section>
  );
}
