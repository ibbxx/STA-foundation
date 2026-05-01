import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";
import Logo from "../shared/Logo";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { label: "Event", href: "/events" },
    { label: "Campaign", href: "/campaigns" },
    { label: "Laporkan Sekolah", href: "/laporkan" },
    { label: "Kontak", href: "/kontak" },
  ];

  const isHome = location.pathname === "/";
  const isContact = location.pathname === "/kontak";
  const isSolid = isScrolled || isHovered || mobileMenuOpen || isContact;

  const isDarkText = isSolid || !isHome;

  const textColorMenu = isDarkText ? "text-gray-900/80" : "text-white/90";
  const hoverColorMenu = isDarkText ? "hover:text-gray-900" : "hover:text-white";
  const iconColor = isDarkText ? "text-gray-900" : "text-white";
  const borderColorActive = isDarkText ? "border-black text-gray-900" : "border-white text-white";
  const borderHover = isDarkText ? "hover:border-black" : "hover:border-white";

  return (
    <motion.header
      initial={false}
      animate={{
        backgroundColor: isSolid ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0)",
        backdropFilter: isSolid ? "blur(12px)" : "blur(0px)",
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        borderBottomColor: isSolid ? "rgba(17, 24, 39, 0.08)" : "transparent",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Logo / Brand Name */}
          <Link
            to="/"
            className="group flex items-center transition-all duration-300"
            aria-label="Sekolah Tanah Air"
          >
            <div className="relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
              <Logo size={44} showText={false} variant={isDarkText ? "dark" : "light"} className="drop-shadow-none" />
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
                    isActive ? borderColorActive : "border-transparent",
                    borderHover
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Core CTA */}
          <div className="hidden md:flex items-center gap-6">
            {/* HIDDEN FOR PRESENTATION MODE */}
            <Link
              to="/leaderboard"
              aria-label="Leaderboard"
              title="Leaderboard"
              className={cn(
                "flex items-center justify-center text-sm font-medium transition-all duration-300 py-1 border-b border-transparent",
                location.pathname === "/leaderboard"
                  ? "text-yellow-500 border-yellow-500"
                  : cn(textColorMenu, hoverColorMenu)
              )}
            >
              <Trophy size={16} />
            </Link>
            <Link
              to="/campaigns"
              className={cn(
                "inline-block px-6 py-2.5 text-sm font-light rounded-sm transition-colors shadow-none",
                isDarkText
                  ? "bg-[#2C5F4F] text-[#F5F1E8] hover:bg-[#234A3D]"
                  : "bg-white text-[#2C5F4F] hover:bg-white/90"
              )}
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
          className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl"
        >
          <div className="safe-pb mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col px-4 py-6 sm:min-h-[calc(100dvh-5rem)] sm:px-6">
            <div className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="rounded-2xl px-4 py-3 text-base font-light text-gray-900/80 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            {/* HIDDEN FOR PRESENTATION MODE */}
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
