import React from "react";
import { ShieldCheck, HeartPulse, Building2, Landmark, Shield, Leaf, Ribbon, HandHeart } from "lucide-react";

interface Logo {
  id: string;
  name: string;
  Icon: React.ElementType;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const Logos3 = ({
  heading = "Dipercaya Oleh Institusi & Komunitas Tersertifikasi",
  logos = [
    { id: "logo-1", name: "UNICEF", Icon: HeartPulse },
    { id: "logo-2", name: "Kemendikbud", Icon: Landmark },
    { id: "logo-3", name: "Kitabisa", Icon: HandHeart },
    { id: "logo-4", name: "Dompet Dhuafa", Icon: ShieldCheck },
    { id: "logo-5", name: "Baznas", Icon: Building2 },
    { id: "logo-6", name: "PMI", Icon: Shield },
    { id: "logo-7", name: "Lazismu", Icon: Leaf },
    { id: "logo-8", name: "ACT", Icon: Ribbon },
  ],
  className = "",
}: Logos3Props) => {

  return (
    <section className={`py-10 border-y border-gray-200/60 bg-white overflow-hidden ${className}`}>
      <div className="container max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
          {heading}
        </p>
      </div>
      
      <div className="pt-2 pb-6 relative">
        {/* Gradients on edges for cinematic fade effect */}
        <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent mix-blend-normal pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent mix-blend-normal pointer-events-none z-10" />
        
        {/* CSS Marquee Belt */}
        <div className="flex w-max animate-marquee">
          {/* We duplicate the array 4 times to ensure it covers the viewport fully for seamless scrolling */}
          {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
            <div
              key={`${logo.id}-${index}`}
              className="pl-10 sm:pl-16 md:pl-24"
            >
              <div className="flex shrink-0 items-center justify-center gap-3 text-lg sm:text-xl font-black text-gray-800 tracking-tight opacity-60 grayscale hover:grayscale-0 transition-all duration-500 whitespace-nowrap">
                <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <logo.Icon size={18} />
                </div>
                {logo.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Logos3 };
