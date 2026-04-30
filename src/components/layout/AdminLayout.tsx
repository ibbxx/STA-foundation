import {
  ArrowLeft,
  Banknote,
  BookText,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
  Bell,
  MapPinned
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/admin-helpers';
import { logError } from '../../lib/error-logger';
import { supabase } from '../../lib/supabase';
import Logo from '../shared/Logo';

type AdminNavItem = {
  name: string;
  path: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const menuItems: AdminNavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Campaigns', path: '/admin/campaigns', icon: FileText },
  { name: 'Manajemen Konten', path: '/admin/content', icon: BookText },
  { name: 'Donatur', path: '/admin/donors', icon: Users },
  { name: 'Donasi', path: '/admin/transactions', icon: Banknote },
  { name: 'Peta Dampak', path: '/admin/impact-map', icon: MapPinned },
  { name: 'Laporan Sekolah', path: '/admin/school-reports', icon: Building2 },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminIdentity, setAdminIdentity] = useState('Memuat profil...');
  const [adminRole, setAdminRole] = useState('authenticated');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        logError('AdminLayout.loadUser', error);
      }
      if (ignore) return;

      const user = data.user;
      if (!user) {
        setAdminIdentity('Belum login');
        setAdminRole('anon');
        return;
      }

      setAdminIdentity(user.email ?? user.phone ?? user.id);
      setAdminRole(user.role ?? 'authenticated');
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, []);

  function isActive(path: string) {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      logError('AdminLayout.signOut', error);
    }
    setIsSigningOut(false);
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      
      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <Logo size={28} showText={false} />
          <span className="font-bold text-slate-900 text-sm">Panel Admin</span>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
          <Link to="/" className="flex items-center gap-3">
            <Logo size={28} showText={false} />
            <span className="font-bold text-slate-900 tracking-tight">Panel Admin</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {menuItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <item.icon size={18} className={active ? 'text-zinc-900' : 'text-slate-400'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={18} className="text-slate-400" />
            Ke Halaman Utama
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={18} className="text-rose-500" />
            {isSigningOut ? 'Keluar...' : 'Keluar'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header (Desktop) */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 flex-shrink-0">
          <div className="flex-1" />
          
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3 cursor-default">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-900 border border-zinc-200">
                {getInitials(adminIdentity)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">{adminIdentity}</p>
                <p className="text-xs text-slate-500 capitalize">{adminRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 pt-20 lg:pt-8 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
