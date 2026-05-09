import { useEffect, useState, useRef } from 'react';
import { Bell, FileText, Users, X, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logError } from '../../lib/error-logger';
import { cn } from '../../lib/utils';
import { formatAdminDate } from '../../lib/admin-helpers';

interface NotificationItem {
  id: string;
  type: 'school_report' | 'volunteer';
  title: string;
  description: string;
  date: string;
  link: string;
  isNew: boolean;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Fetch pending school reports
      const { data: reports, error: reportsError } = await supabase
        .from('school_reports')
        .select('id, school_name, reporter_name, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (reportsError) throw reportsError;

      // Fetch pending volunteers
      const { data: volunteers, error: volunteersError } = await supabase
        .from('volunteer_registrations')
        .select('id, nama_lengkap, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (volunteersError) throw volunteersError;

      const items: NotificationItem[] = [];

      reports?.forEach((report) => {
        items.push({
          id: `report-${report.id}`,
          type: 'school_report',
          title: 'Laporan Sekolah Baru',
          description: `${report.reporter_name} melaporkan ${report.school_name}`,
          date: report.created_at,
          link: '/admin/school-reports',
          isNew: true,
        });
      });

      volunteers?.forEach((vol) => {
        items.push({
          id: `vol-${vol.id}`,
          type: 'volunteer',
          title: 'Pendaftar Volunteer Baru',
          description: `${vol.nama_lengkap} mendaftar sebagai volunteer`,
          date: vol.created_at,
          link: '/admin/eduxplore',
          isNew: true,
        });
      });

      // Sort by date descending
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setNotifications(items.slice(0, 10)); // keep top 10
    } catch (err) {
      logError('NotificationBell.loadNotifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Subscribe to changes
    const reportsSub = supabase
      .channel('public:school_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'school_reports' }, () => {
        loadNotifications();
      })
      .subscribe();

    const volunteersSub = supabase
      .channel('public:volunteer_registrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'volunteer_registrations' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportsSub);
      supabase.removeChannel(volunteersSub);
    };
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm">Notifikasi</h3>
            <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
              {unreadCount} Baru
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 flex justify-center items-center">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-900">Belum ada notifikasi baru</p>
                <p className="text-xs text-slate-500 mt-1">Anda sudah mengecek semuanya!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    onClick={() => setIsOpen(false)}
                    className="flex gap-3 p-4 hover:bg-slate-50 transition-colors group relative"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                      item.type === 'school_report' 
                        ? "bg-amber-50 border-amber-100 text-amber-600" 
                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    )}>
                      {item.type === 'school_report' ? <FileText size={18} /> : <Users size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate pr-4">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-2 flex items-center gap-1">
                        {formatAdminDate(item.date, true)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-50 bg-slate-50/50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
