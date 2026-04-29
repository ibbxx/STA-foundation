"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface CampaignPartner {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar?: string | null;
  url?: string | null;
}

interface CampaignPartnersProps {
  partners?: CampaignPartner[] | null;
  title?: string;
  size?: 'sm' | 'lg';
}

export function CampaignPartners({ partners, title = "Mitra Kolaborator", size = "sm" }: CampaignPartnersProps) {
  if (!partners || partners.length === 0) return null;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedQuote, setDisplayedQuote] = useState(partners[0].quote);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (index === activeIndex || isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      setDisplayedQuote(partners[index].quote);
      setActiveIndex(index);
      setTimeout(() => setIsAnimating(false), 400);
    }, 200);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8 md:py-12 bg-transparent overflow-hidden">
        <div className="mb-4 text-center sm:mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600 mb-2">{title}</h2>
        </div>

      {/* ─── LOGO MARQUEE SECTION (Interactive) ─── */}
      <div className="relative w-full overflow-hidden group/marquee py-4 cursor-grab active:cursor-grabbing">
        {/* Gradient Masking */}
        <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <motion.div 
          className="flex w-max py-2"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 10, 
            ease: "linear", 
            repeat: Infinity 
          }}
          drag="x"
          dragConstraints={{ left: -2000, right: 0 }}
          whileTap={{ cursor: "grabbing" }}
        >
          {/* Quadruple partners for a very long loop to support dragging */}
          {[...partners, ...partners, ...partners, ...partners].map((partner, index) => (
            <a
              key={`${partner.id}-${index}`}
              href={partner.url || "#"}
              target={partner.url ? "_blank" : undefined}
              rel={partner.url ? "noopener noreferrer" : undefined}
              onClick={(e) => {
                if (!partner.url) e.preventDefault();
                handleSelect(index % partners.length);
              }}
              className="mx-6 sm:mx-10 flex flex-col items-center gap-3 transition-all duration-300 hover:scale-110 active:scale-95 group select-none pointer-events-auto"
            >
              <div className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-100 transition-all duration-500">
                {partner.avatar ? (
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="max-h-full max-w-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                    {partner.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold text-gray-300 opacity-0 group-hover:opacity-100 uppercase tracking-tighter transition-opacity">
                {partner.name}
              </span>
            </a>
          ))}
        </motion.div>
      </div>

      {/* Quote Container */}
      <div className="relative px-6 w-full flex justify-center mt-4">
        <span className="absolute left-4 sm:left-12 -top-6 text-6xl md:text-7xl font-serif text-emerald-900/[0.03] select-none pointer-events-none">
          "
        </span>

        <p
          className={cn(
            "italic font-light text-gray-800 text-center leading-relaxed transition-all duration-500 ease-out",
            size === 'lg' ? "text-lg sm:text-2xl md:text-3xl max-w-3xl" : "text-base sm:text-lg md:text-xl max-w-lg",
            isAnimating ? "opacity-0 blur-md scale-[0.98]" : "opacity-100 blur-0 scale-100"
          )}
        >
          {displayedQuote}
        </p>

        <span className="absolute right-4 sm:right-12 -bottom-10 text-6xl md:text-7xl font-serif text-emerald-900/[0.03] select-none pointer-events-none">
          "
        </span>
      </div>

    </div>
  );
}
