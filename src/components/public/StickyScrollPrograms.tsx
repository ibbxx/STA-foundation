import React, { useRef, Component, ErrorInfo, ReactNode } from 'react';
import { motion, useScroll, useTransform, type MotionValue, mix } from 'framer-motion';
import type { HomeProgramSlide } from '../../lib/admin-home-programs';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("StickyScrollPrograms Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 m-10 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <h2 className="font-bold text-lg mb-2">Komponen StickyScrollPrograms Crash</h2>
          <pre className="text-xs overflow-auto bg-white p-4 rounded border border-red-100 whitespace-pre-wrap">
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function SlideContent({ prog, index, len, scrollYProgress }: { prog: HomeProgramSlide; index: number; len: number; scrollYProgress: MotionValue<number>; }) {
  const center = index / (len > 1 ? len - 1 : 1);
  const span = 1 / (len > 1 ? len - 1 : 1);

  const opacity = useTransform(scrollYProgress, (pos) => {
    const dist = Math.abs(pos - center);
    const plateau = span * 0.15; // Waktu diam dikurangi sedikit agar terasa lebih cepat
    const fade = span * 0.35;

    if (dist <= plateau) return 1;
    if (dist >= plateau + fade) return 0;
    return 1 - ((dist - plateau) / fade);
  });

  const y = useTransform(scrollYProgress, (pos) => {
    const dist = Math.abs(pos - center);
    const plateau = span * 0.15;
    const fade = span * 0.35;

    if (dist <= plateau) return 0;
    if (dist >= plateau + fade) return pos > center ? -40 : 40;
    
    const progress = (dist - plateau) / fade;
    return progress * (pos > center ? -40 : 40);
  });

  const pointerEvents = useTransform(opacity, (val) => val > 0.5 ? 'auto' : 'none');

  return (
    <motion.div
      className="absolute inset-0 flex flex-col justify-center"
      style={{ opacity, y, pointerEvents }}
    >
      <div className="flex items-end gap-3 md:gap-4 mb-3 md:mb-5">
        <span className="text-5xl md:text-7xl font-black text-gray-200 leading-none select-none">
          0{index + 1}
        </span>
        <h3 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight pb-1 md:pb-2">
          {prog.title || 'Tanpa Judul'}
        </h3>
      </div>
      <p className="text-gray-600 text-base md:text-xl leading-relaxed font-normal md:leading-loose">
        {prog.short_description || ''}
      </p>
    </motion.div>
  );
}

function SlideImage({ prog, index, len, scrollYProgress }: { prog: HomeProgramSlide; index: number; len: number; scrollYProgress: MotionValue<number>; }) {
  const center = index / (len > 1 ? len - 1 : 1);
  const span = 1 / (len > 1 ? len - 1 : 1);

  const opacity = useTransform(scrollYProgress, (pos) => {
    const dist = Math.abs(pos - center);
    const plateau = span * 0.15;
    const fade = span * 0.35;

    if (dist <= plateau) return 1;
    if (dist >= plateau + fade) return 0;
    return 1 - ((dist - plateau) / fade);
  });

  const scale = useTransform(scrollYProgress, (pos) => {
    const dist = Math.abs(pos - center);
    const plateau = span * 0.15;
    const fade = span * 0.35;

    if (dist <= plateau) return 1;
    if (dist >= plateau + fade) return 1.1;
    const progress = (dist - plateau) / fade;
    return 1 + (progress * 0.1);
  });

  return (
    <motion.div
      className="absolute inset-0 w-full h-full"
      style={{ opacity, scale }}
    >
      {prog.imageUrl ? (
        <img 
          src={prog.imageUrl} 
          alt={prog.title || 'Image'}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-emerald-900" />
      )}
      <div className="absolute inset-0 bg-emerald-950/10 mix-blend-overlay" />
    </motion.div>
  );
}

const colorMixer = mix("#E5E7EB", "#059669");

function SlideIndicator({ index, len, scrollYProgress }: { index: number; len: number; scrollYProgress: MotionValue<number>; }) {
  const center = index / (len > 1 ? len - 1 : 1);
  const span = 1 / (len > 1 ? len - 1 : 1);
  
  const height = useTransform(scrollYProgress, (pos) => {
    const dist = Math.abs(pos - center);
    const plateau = span * 0.15;
    const fade = span * 0.35;

    if (dist <= plateau) return 36;
    if (dist >= plateau + fade) return 8;
    const progress = (dist - plateau) / fade;
    return 36 - (progress * 28);
  });

  const backgroundColor = useTransform(scrollYProgress, (pos) => {
    const dist = Math.abs(pos - center);
    const plateau = span * 0.15;
    const fade = span * 0.35;

    if (dist <= plateau) return colorMixer(1); // Full emerald
    if (dist >= plateau + fade) return colorMixer(0); // Full gray
    const progress = (dist - plateau) / fade;
    return colorMixer(1 - progress);
  });
  
  return (
    <motion.div 
      className="w-1.5 rounded-full"
      style={{ height, backgroundColor }}
    />
  );
}

function StickyScrollProgramsInner({ programs }: { programs: HomeProgramSlide[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  if (!programs || !Array.isArray(programs) || programs.length === 0) {
    return null;
  }

  const len = programs.length;

  return (
    <section ref={containerRef} className="relative bg-[#FAF9F6]" style={{ height: `${len * 90}vh` }}>
      <div className="sticky top-0 h-[100dvh] w-full flex flex-col md:flex-row overflow-hidden">
        <div className="relative w-full h-[45vh] md:h-full md:w-1/2 bg-gray-100 overflow-hidden">
          {programs.map((prog, i) => (
            <SlideImage key={prog.id + '-img'} prog={prog} index={i} len={len} scrollYProgress={scrollYProgress} />
          ))}
        </div>
        <div className="relative flex-1 h-[55vh] md:h-full flex flex-col justify-center px-6 sm:px-10 md:px-16 lg:px-24 bg-white md:bg-[#FAF9F6]">
          <div className="max-w-xl w-full">
            <div className="mb-6 md:mb-12 relative z-10">
              <p className="text-emerald-700 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs mb-3 flex items-center gap-2">
                <span className="w-6 md:w-8 h-[2px] bg-emerald-600"></span> Inisiatif Utama
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Program Kami
              </h2>
            </div>
            <div className="relative h-[220px] md:h-[280px] w-full">
              {programs.map((prog, i) => (
                <SlideContent key={prog.id + '-text'} prog={prog} index={i} len={len} scrollYProgress={scrollYProgress} />
              ))}
            </div>
          </div>
          <div className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3">
            {programs.map((_, i) => (
              <SlideIndicator key={`indicator-${i}`} index={i} len={len} scrollYProgress={scrollYProgress} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StickyScrollPrograms({ programs }: { programs: HomeProgramSlide[] }) {
  return (
    <ErrorBoundary>
      <StickyScrollProgramsInner programs={programs} />
    </ErrorBoundary>
  );
}
