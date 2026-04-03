import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface NavHeaderProps {
  className?: string;
  isTransparent?: boolean;
}

export function NavHeader({ className, isTransparent = false }: NavHeaderProps) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const location = useLocation();

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Campaign', path: '/campaigns' },
    { name: 'Tentang Kami', path: '/tentang-kami' },
    { name: 'Laporan', path: '/laporan' },
    { name: 'Kontak', path: '/kontak' },
  ];

  return (
    <ul
      className={cn(
        'relative mx-auto flex w-fit',
        className
      )}
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {navLinks.map((link) => (
        <React.Fragment key={link.path}>
          <Tab
            setPosition={setPosition}
            path={link.path}
            isActive={location.pathname === link.path}
            isTransparent={isTransparent}
          >
            {link.name}
          </Tab>
        </React.Fragment>
      ))}

      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  setPosition,
  path,
  isActive,
  isTransparent,
}: {
  children: React.ReactNode;
  setPosition: any;
  path: string;
  isActive: boolean;
  isTransparent: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const navigate = useNavigate();

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      onClick={() => navigate(path)}
      className={cn(
        'relative z-10 block cursor-pointer px-3 py-1.5 text-xs font-semibold uppercase md:px-4 md:py-2 md:text-sm transition-colors',
        // Hover state text colors based on background variant
        isTransparent
          ? isActive ? 'text-emerald-900 mix-blend-difference' : 'text-white/90 hover:text-white'
          : isActive ? 'text-white' : 'text-gray-600 hover:text-emerald-800'
      )}
    >
      {children}
    </li>
  );
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={position}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="absolute z-0 h-7 md:h-9 rounded-full bg-emerald-600"
    />
  );
};
