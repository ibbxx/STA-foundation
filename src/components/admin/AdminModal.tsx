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
  widthClassName?: string;
};

export default function AdminModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
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
      <button
        type="button"
        aria-label="Tutup modal"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full ${widthClassName} overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-xl font-black text-gray-900">{title}</h2>
            {description ? <p className="mt-1 text-sm font-medium text-gray-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-13rem)] overflow-y-auto px-6 py-6 sm:px-8">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-5 sm:flex-row sm:justify-end sm:px-8">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
