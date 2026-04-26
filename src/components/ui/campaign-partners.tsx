"use client";

import { useState } from "react";
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
  const [displayedRole, setDisplayedRole] = useState(partners[0].role);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (index === activeIndex || isAnimating) return;
    setIsAnimating(true);

    setTimeout(() => {
      setDisplayedQuote(partners[index].quote);
      setDisplayedRole(partners[index].role);
      setActiveIndex(index);
      setTimeout(() => setIsAnimating(false), 400);
    }, 200);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 md:py-12 bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden">
      <div className="text-center mb-2 px-4">
        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] mb-2">{title}</h3>
        <p className="text-[10px] text-gray-400 font-medium">Klik logo untuk mengunjungi profil mitra</p>
      </div>

      {/* ─── LOGO MARQUEE SECTION ─── */}
      <div className="relative w-full overflow-hidden group/marquee py-4">
        {/* Gradient Masking */}
        <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

        <div className="flex w-max animate-marquee group-hover/marquee:pause py-2">
          {/* Duplicate partners for infinite loop effect */}
          {[...partners, ...partners, ...partners].map((partner, index) => (
            <a
              key={`${partner.id}-${index}`}
              href={partner.url || "#"}
              target={partner.url ? "_blank" : undefined}
              rel={partner.url ? "noopener noreferrer" : undefined}
              onClick={(e) => {
                if (!partner.url) e.preventDefault();
                handleSelect(index % partners.length);
              }}
              className="mx-6 sm:mx-10 flex flex-col items-center gap-3 transition-all duration-300 hover:scale-110 active:scale-95 group"
            >
              <div className="h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-500">
                {partner.avatar ? (
                  <img
                    src={partner.avatar}
                    alt={partner.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl">
                    {partner.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold text-gray-400 opacity-0 group-hover:opacity-100 uppercase tracking-tighter transition-opacity">
                {partner.name}
              </span>
            </a>
          ))}
        </div>
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

      <div className="flex flex-col items-center gap-4 mt-6">
        {/* Role text */}
        <p
          className={cn(
            "text-[10px] sm:text-xs text-emerald-600 font-black tracking-[0.3em] uppercase transition-all duration-500 ease-out",
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          {displayedRole}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-full px-4">
          {partners.map((partner, index) => {
            const isActive = activeIndex === index;
            
            return (
              <button
                key={`pill-${partner.id}`}
                onClick={() => handleSelect(index)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                  isActive 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105" 
                    : "bg-white text-gray-400 border border-gray-100 hover:border-emerald-200 hover:text-emerald-500"
                )}
              >
                {partner.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
