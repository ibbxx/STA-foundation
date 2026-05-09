import { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Komponen dialog konfirmasi yang menggantikan `window.confirm()`.
 * Menyediakan UX yang konsisten dan aksesibel di seluruh panel admin.
 */
export default function ConfirmDialog({
  open,
  title = 'Konfirmasi',
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Focus trap: Fokuskan ke tombol batal saat dialog terbuka
  useEffect(() => {
    if (open) {
      // Delay focus agar transisi selesai dulu
      const timer = setTimeout(() => confirmBtnRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onCancel]);

  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${isDanger ? 'bg-rose-50' : 'bg-amber-50'}`}>
                <AlertTriangle className={`h-6 w-6 ${isDanger ? 'text-rose-500' : 'text-amber-500'}`} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
              <p className="mb-6 text-sm leading-relaxed text-gray-500">{message}</p>
              <div className="flex w-full gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {cancelText}
                </button>
                <button
                  ref={confirmBtnRef}
                  onClick={onConfirm}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors shadow-lg ${
                    isDanger
                      ? 'bg-rose-500 shadow-rose-200 hover:bg-rose-600'
                      : 'bg-amber-500 shadow-amber-200 hover:bg-amber-600'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Hook: useConfirmDialog ──────────────────────────────────────────────────
// Memudahkan penggunaan ConfirmDialog dari mana saja tanpa boilerplate state.

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning';
}

interface UseConfirmDialogReturn {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  ConfirmDialogElement: React.ReactNode;
}

/**
 * Hook untuk menampilkan dialog konfirmasi secara imperatif.
 * @example
 * ```tsx
 * const { confirm, ConfirmDialogElement } = useConfirmDialog();
 *
 * async function handleDelete() {
 *   const ok = await confirm({ message: 'Hapus data ini?', confirmText: 'Hapus' });
 *   if (!ok) return;
 *   // lakukan penghapusan
 * }
 *
 * return (
 *   <>
 *     {ConfirmDialogElement}
 *     <button onClick={handleDelete}>Hapus</button>
 *   </>
 * );
 * ```
 */
export function useConfirmDialog(): UseConfirmDialogReturn {
  const [state, setState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((val: boolean) => void) | null;
  }>({
    open: false,
    options: { message: '' },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState((prev) => ({ ...prev, open: false, resolve: null }));
  }, [state.resolve]);

  const ConfirmDialogElement = (
    <ConfirmDialog
      open={state.open}
      title={state.options.title}
      message={state.options.message}
      confirmText={state.options.confirmText}
      variant={state.options.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialogElement };
}
