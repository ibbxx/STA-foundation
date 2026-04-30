import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

type ShareToastProps = {
  show: boolean;
  message?: string;
};

export default function ShareToast({ show, message = 'Link berhasil disalin!' }: ShareToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-zinc-900 text-white rounded-2xl shadow-2xl shadow-zinc-950/40 border border-white/10 backdrop-blur-md"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <CheckCircle2 size={14} />
          </div>
          <span className="text-sm font-bold tracking-tight whitespace-nowrap">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
