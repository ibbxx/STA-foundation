import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";
import Logo from "../shared/Logo";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  const isTransparentNavPage = location.pathname === "/" || location.pathname === "/tentang-kami";
  const isOverlayMode = isTransparentNavPage && !isScrolled && !isHovered;

  // Navbar sekarang selalu menggunakan tema gelap (hitam total) saat tidak transparan,
  // jadi kita harus memastikan teks selalu terang agar kontras.
  const isLightText = !isTransparentNavPage || isScrolled || isHovered || isTransparentNavPage;
  
  // Catatan: Karena desain kita saat ini menggunakan hero yang gelap di halaman transparan,
  // maka isLightText akan selalu true. Jika ke depannya ada halaman transparan dengan 
  // background terang, logika ini perlu disesuaikan.

  const textColorBrand = "text-[#F5F1E8]";
  const textColorMenu = "text-[#F5F1E8]/80";
  const hoverColorMenu = "hover:text-[#F5F1E8]";
  const iconColor = "text-[#F5F1E8]";

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{
        backgroundColor: isTransparentNavPage
          ? (isScrolled || isHovered)
            ? "#000000"
            : "rgba(0, 0, 0, 0)"
          : "#000000",
        backdropFilter: isOverlayMode ? "blur(0px)" : "blur(0px)",
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        borderBottomColor: isTransparentNavPage
          ? (isScrolled || isHovered)
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(255, 255, 255, 0)"
          : "rgba(255, 255, 255, 0.1)",
      }}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Logo / Brand Name */}
          <Link
            to="/"
            className={cn(
              "group flex items-center gap-3 transition-all duration-300",
              textColorBrand
            )}
          >
            <div className="relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
              <Logo size={44} showText={false} className="drop-shadow-sm" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-sm md:text-base font-semibold tracking-[0.15em] uppercase leading-none mb-1">
                Sekolah
              </span>
              <span className={cn(
                "text-xs md:text-sm font-light tracking-[0.1em] uppercase leading-none",
                isLightText ? "text-[#F5F1E8]/70" : "text-gray-500"
              )}>
                Tanah Air
              </span>
            </div>
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
            <Link
              to="/leaderboard"
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-all duration-300 py-1 border-b border-transparent",
                location.pathname === "/leaderboard" 
                  ? (isLightText ? "text-yellow-400 border-yellow-400" : "text-yellow-600 border-yellow-600")
                  : cn(textColorMenu, hoverColorMenu)
              )}
            >
              <Trophy size={16} />
              Leaderboard
            </Link>
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
            aria-expanded={mobileMenuOpen}
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
          className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl"
        >
          <div className="safe-pb mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col px-4 py-6 sm:min-h-[calc(100dvh-5rem)] sm:px-6">
            <div className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="rounded-2xl px-4 py-3 text-base font-light text-[#F5F1E8]/80 transition-colors hover:bg-white/5 hover:text-[#F5F1E8]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <Link
              to="/campaigns"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#2C5F4F] px-6 py-3 text-sm font-light text-[#F5F1E8] transition-colors hover:bg-[#234A3D]"
            >
              Donasi Sekarang
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
