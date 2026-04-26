import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

type AdminModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  widthClassName?: string;
};

export default function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  headerActions,
  widthClassName = 'max-w-2xl',
}: AdminModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      {/* 
        UX FIX: Backdrop is now a static div to prevent accidental closes 
        when clicking outside the modal, saving unsaved form data.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm transition-all"
      />
      <div className={`relative z-10 w-full ${widthClassName} overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
            {description ? <p className="mt-1 text-sm font-medium text-zinc-500">{description}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-13rem)] overflow-y-auto px-6 py-6 sm:px-8">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-col-reverse gap-3 border-t border-zinc-100 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
