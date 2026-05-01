import { InfiniteSlider } from '../../components/ui/infinite-slider';
import { ProgressiveBlur } from '../../components/ui/progressive-blur';
import { cn } from '../../lib/utils';

const PARTNERS = [
  { name: 'Admedika', src: '/mitra/assets/admedika.png', href: 'https://www.instagram.com/admedika_ig?igsh=MW04d3hhMmYxa3pvMQ==', sizeClass: 'h-14 md:h-20 scale-110' },
  { name: 'Bali Nggih', src: '/mitra/assets/balinggih.png', href: 'https://www.instagram.com/balinggih?igsh=MTg5MDBsZ3JvdzJqZw==', sizeClass: 'h-8 md:h-12' },
  { name: 'Distrik Berisik', src: '/mitra/assets/blue-db.png', href: 'https://www.instagram.com/distrik_berisik?igsh=Mmk3bTN6eG5maHZ3', sizeClass: 'h-8 md:h-12' },
  { name: 'PIS Movement', src: '/mitra/assets/peacemaker.png', href: 'https://www.instagram.com/pismovement?igsh=c25kNWZtNDJkcWI1', sizeClass: 'h-14 md:h-20' },
  { name: 'Kawan Cendekia', src: '/mitra/assets/img-0338.png', href: 'https://www.instagram.com/kawancendekia?igsh=ZTlzNHhqem13MHlo', sizeClass: 'h-14 md:h-20' },
  { name: 'Perempuan Lestari', src: '/mitra/assets/wa-image.jpg', href: 'https://www.instagram.com/perempuan.lestari?igsh=MW5uMW9tcHltYWZ5OA==', sizeClass: 'h-14 md:h-20' },
] as const;

export default function TrustBar() {
  return (
    <section className="bg-white border-y border-gray-200/60 py-4">
      <div className="group relative m-auto max-w-7xl px-6">
        <div className="flex flex-col items-center md:flex-row">
          <div className="shrink-0 py-6 md:max-w-48 md:border-r md:border-gray-200 md:pr-8">
            <p className="text-center text-sm font-bold uppercase tracking-widest text-gray-400 md:text-end">
              Dipercaya Oleh
            </p>
          </div>
          <div className="relative py-8 md:w-[calc(100%-12rem)]">
            <InfiniteSlider
              duration={35}
              gap={80}
              stopOnHover={true}
              draggable={true}
            >
              {PARTNERS.map((partner) => (
                <div key={partner.name} className="flex items-center justify-center px-4 min-h-[6rem]">
                  <a 
                    href={partner.href} 
                    target="_blank" 
                    rel="noreferrer"
                    className="transition-transform hover:scale-110"
                  >
                    <img
                      src={partner.src}
                      alt={`Logo ${partner.name}`}
                      className={cn(
                        "w-auto object-contain mix-blend-multiply origin-center",
                        partner.sizeClass
                      )}
                    />
                  </a>
                </div>
              ))}
            </InfiniteSlider>

            {/* Edge fade masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent" />
            <ProgressiveBlur
              className="pointer-events-none absolute left-0 top-0 h-full w-20"
              direction="left"
              blurIntensity={1}
            />
            <ProgressiveBlur
              className="pointer-events-none absolute right-0 top-0 h-full w-20"
              direction="right"
              blurIntensity={1}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
