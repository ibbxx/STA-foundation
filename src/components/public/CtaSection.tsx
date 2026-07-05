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
        <div className="grid grid-cols-12 gap-0 rounded-2xl sm:rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-xl shadow-gray-200/30 bg-emerald-700">
          {/* Text - Left Column */}
          <div className="relative col-span-7 sm:col-span-6 flex flex-col justify-center overflow-hidden p-3.5 sm:p-10 md:p-12 lg:p-12 min-w-0">
            <div className="absolute top-0 right-0 w-40 sm:w-48 h-40 sm:h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 sm:w-32 h-28 sm:h-32 bg-teal-800/20 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-2 sm:space-y-5">
              <Quote className="h-4 w-4 sm:h-7 sm:w-7 text-emerald-400/40 hidden xs:block" />
              <h2 className="text-sm sm:text-3xl md:text-4xl font-extrabold text-white leading-tight">
                {data.title}
              </h2>
              <p className="text-emerald-100/75 text-[10px] sm:text-base leading-relaxed line-clamp-3 sm:line-clamp-none">
                {data.description}
              </p>
              <div className="flex flex-row gap-1.5 pt-1.5 sm:pt-2 sm:gap-3 flex-wrap">
                <Link to={data.primaryButtonLink} className="bg-white text-emerald-700 px-2.5 sm:px-7 py-1.5 sm:py-3.5 rounded-full font-bold hover:bg-emerald-50 transition-all text-center text-[9px] sm:text-sm shadow-lg whitespace-nowrap">
                  {data.primaryButtonText}
                </Link>
                <Link to={data.secondaryButtonLink} className="bg-emerald-800/60 text-white px-2.5 sm:px-7 py-1.5 sm:py-3.5 rounded-full font-bold hover:bg-emerald-800 transition-all text-center text-[9px] sm:text-sm border border-emerald-600/40 whitespace-nowrap">
                  {data.secondaryButtonText}
                </Link>
              </div>
            </div>
          </div>

          {/* Image - Right Column */}
          <div className="relative col-span-5 sm:col-span-6 bg-emerald-800/10 min-h-full">
            {data.imageUrl && (
              <img
                src={data.imageUrl}
                alt={data.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-700/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
