"use client";

import { useState } from "react";
import { cn } from "../../lib/utils";

export interface CampaignPartner {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar?: string | null;
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
    <div className="flex flex-col items-center gap-6 py-6 md:py-8 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="text-center mb-2">
        <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{title}</h3>
      </div>

      {/* Quote Container */}
      <div className="relative px-6 w-full flex justify-center">
        <span className="absolute left-2 sm:left-6 -top-4 text-5xl md:text-6xl font-serif text-emerald-900/[0.05] select-none pointer-events-none">
          "
        </span>

        <p
          className={cn(
            "italic font-light text-gray-800 text-center leading-relaxed transition-all duration-400 ease-out",
            size === 'lg' ? "text-lg sm:text-2xl md:text-3xl max-w-2xl" : "text-base sm:text-lg md:text-xl max-w-sm",
            isAnimating ? "opacity-0 blur-sm scale-[0.98]" : "opacity-100 blur-0 scale-100"
          )}
        >
          {displayedQuote}
        </p>

        <span className="absolute right-2 sm:right-6 -bottom-6 text-5xl md:text-6xl font-serif text-emerald-900/[0.05] select-none pointer-events-none">
          "
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 mt-2">
        {/* Role text */}
        <p
          className={cn(
            "text-[10px] sm:text-xs text-gray-500 font-bold tracking-[0.2em] uppercase transition-all duration-500 ease-out",
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          {displayedRole}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 max-w-full px-4">
          {partners.map((partner, index) => {
            const isActive = activeIndex === index;
            const isHovered = hoveredIndex === index && !isActive;
            const showName = isActive || isHovered;

            return (
              <button
                key={partner.id}
                onClick={() => handleSelect(index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={cn(
                  "relative flex items-center gap-0 rounded-full cursor-pointer",
                  "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  isActive ? "bg-emerald-700 shadow-md" : "bg-white border border-gray-200 hover:bg-gray-100",
                  showName ? "pr-3 pl-1.5 py-1.5" : "p-1"
                )}
              >
                {/* Avatar with smooth ring animation */}
                <div 
                  className={cn(
                    "relative flex-shrink-0 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold",
                    size === 'lg' ? "w-10 h-10 sm:w-14 sm:h-14 text-sm" : "w-6 h-6 sm:w-8 sm:h-8 text-xs"
                  )}
                >
                  {partner.avatar ? (
                    <img
                      src={partner.avatar}
                      alt={partner.name}
                      className={cn(
                        "w-full h-full rounded-full object-cover",
                        "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        isActive ? "ring-2 ring-emerald-200" : "ring-0",
                        !isActive && "hover:scale-105"
                      )}
                    />
                  ) : (
                    <span>{partner.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div
                  className={cn(
                    "grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    showName ? "grid-cols-[1fr] opacity-100 ml-2" : "grid-cols-[0fr] opacity-0 ml-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-semibold whitespace-nowrap block",
                        "transition-colors duration-300",
                        isActive ? "text-white" : "text-gray-700"
                      )}
                    >
                      {partner.name}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
