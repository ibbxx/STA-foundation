import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export default function EduxploreSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="py-20 sm:py-32 flex flex-col items-center justify-center text-center px-5"
    >
      <div className="relative mb-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center relative z-10 ring-8 ring-emerald-50/50"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 25 }}
          >
            <CheckCircle2 size={64} strokeWidth={2.5} className="text-emerald-600" />
          </motion.div>
        </motion.div>
      </div>

      <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
        Pendaftaran Berhasil!
      </h2>
      <p className="text-gray-500 font-medium max-w-sm">
        Data Anda telah tercatat. WhatsApp akan terbuka otomatis untuk konfirmasi ke admin.
      </p>
    </motion.div>
  );
}
