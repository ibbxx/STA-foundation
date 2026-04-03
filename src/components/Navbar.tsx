import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "../lib/utils";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  const isTransparentNavPage = location.pathname === "/" || location.pathname === "/tentang-kami";

  // Use light text if we are on Home page (over dark hero) OR if we have scrolled (navbar turns black)
  const isLightText = isTransparentNavPage || isScrolled;
  
  const textColorBrand = isLightText ? "text-[#F5F1E8]" : "text-gray-900";
  const textColorMenu = isLightText ? "text-[#F5F1E8]/80" : "text-gray-900";
  const hoverColorMenu = isLightText ? "hover:text-[#F5F1E8]" : "hover:text-black";
  const iconColor = isLightText ? "text-[#F5F1E8]" : "text-gray-900";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 10);
  });

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: "Beranda", href: "/" },
    { label: "Tentang Kami", href: "/tentang-kami" },
    { label: "Campaign", href: "/campaigns" },
    { label: "Laporkan Sekolah", href: "/laporkan" },
    { label: "Kontak", href: "/kontak" },
  ];

  return (
    <motion.header
      initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
      animate={{
        backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.85)" : "rgba(0, 0, 0, 0)",
        backdropFilter: isScrolled ? "blur(12px)" : "blur(0px)",
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        borderBottomColor: isScrolled 
          ? "rgba(255, 255, 255, 0.1)" 
          : "rgba(255, 255, 255, 0)",
      }}
    >
      <nav className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand Name */}
          <Link to="/" className={cn("text-xl font-light tracking-wide transition-colors duration-300", textColorBrand)}>
            STA Crowdfunding
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "text-sm font-light transition-all duration-300 border-b py-1",
                    textColorMenu,
                    hoverColorMenu,
                    isActive 
                      ? (isLightText ? "border-[#F5F1E8]" : "border-black") 
                      : "border-transparent",
                    isLightText ? "hover:border-[#F5F1E8]" : "hover:border-black"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Core CTA */}
          <div className="hidden md:block">
            <Link
              to="/campaigns"
              className="inline-block px-6 py-2.5 bg-[#2C5F4F] text-[#F5F1E8] text-sm font-light rounded-sm hover:bg-[#234A3D] transition-colors shadow-none"
            >
              Donasi Sekarang
            </Link>
          </div>

          {/* Mobile Hamburg */}
          <button
            className={cn("md:hidden transition-colors duration-300", iconColor)}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
        >
          <div className="container mx-auto px-6 py-6 flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-light text-[#F5F1E8]/80 hover:text-[#F5F1E8] transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/campaigns"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-block px-6 py-3 bg-[#2C5F4F] text-[#F5F1E8] text-sm font-light rounded-sm hover:bg-[#234A3D] transition-colors text-center"
            >
              Donasi Sekarang
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
