import { useFormContext } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, TextInput, SelectInput } from './FormField';
import { STATUS_OPTIONS, type ReportSchoolFormValues } from '../../lib/report-school';

export default function Step1Reporter() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ReportSchoolFormValues>();
  
  const isWillingToFacilitate = watch('isWillingToFacilitate');
  const hasSchoolContact = watch('hasSchoolContact');

  return (
    <div className="space-y-6">
      <FormField label="Nama Lengkap" error={errors.reporterName?.message}>
        <TextInput {...register('reporterName')} placeholder="Masukkan nama lengkap Anda" />
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Kontak WhatsApp" error={errors.reporterWhatsapp?.message}>
          <TextInput type="tel" {...register('reporterWhatsapp')} placeholder="08xxxxxxxxxx" />
        </FormField>
        <FormField label="Email Aktif" error={errors.reporterEmail?.message}>
          <TextInput type="email" {...register('reporterEmail')} placeholder="email@contoh.com" />
        </FormField>
      </div>

      <FormField label="Alamat Anda" error={errors.reporterAddress?.message}>
        <textarea
          {...register('reporterAddress')}
          rows={3}
          placeholder="Masukkan alamat lengkap domisili Anda"
          className={`w-full rounded-lg border bg-white px-4 py-3 text-base transition-colors focus:outline-none focus:ring-2 ${
            errors.reporterAddress
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/10'
          }`}
        />
      </FormField>

      <FormField label="Status Anda" error={errors.reporterStatus?.message}>
        <SelectInput {...register('reporterStatus')}>
          <option value="">Pilih status pekerjaan/peran</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </SelectInput>
      </FormField>

      {/* ── Fasilitator Section ── */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-5 space-y-0">
        {/* State 1: isFasilitator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Bersedia menjadi fasilitator lokal?</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">Apakah Anda bersedia menjadi narahubung langsung untuk sekolah yang Anda informasikan?</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setValue('isWillingToFacilitate', true, { shouldValidate: true });
                setValue('hasSchoolContact', undefined);
                setValue('schoolContactName', '');
                setValue('schoolContactWhatsapp', '');
              }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] ${
                isWillingToFacilitate === true
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
              }`}
            >
              Ya
            </button>
            <button
              type="button"
              onClick={() => setValue('isWillingToFacilitate', false, { shouldValidate: true })}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] ${
                isWillingToFacilitate === false
                  ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/20'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-rose-300 hover:text-rose-600'
              }`}
            >
              Tidak
            </button>
          </div>
        </div>

        {/* State 2: hasContact — only visible when isFasilitator === false */}
        <AnimatePresence>
          {isWillingToFacilitate === false && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-4 border-t border-gray-200 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-gray-900">Memiliki kontak penanggungjawab sekolah?</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setValue('hasSchoolContact', true, { shouldValidate: true })}
                      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] ${
                        hasSchoolContact === true
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                          : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('hasSchoolContact', false, { shouldValidate: true });
                        setValue('schoolContactName', '');
                        setValue('schoolContactWhatsapp', '');
                      }}
                      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-[0.98] ${
                        hasSchoolContact === false
                          ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-500/20'
                          : 'bg-white text-gray-500 border border-gray-200 hover:border-rose-300'
                      }`}
                    >
                      Tidak
                    </button>
                  </div>
                </div>

                {/* hasContact === true → Show PIC inputs */}
                <AnimatePresence>
                  {hasSchoolContact === true && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 sm:grid-cols-2 pt-3">
                        <FormField label="Nama Penanggungjawab" error={errors.schoolContactName?.message}>
                          <TextInput
                            {...register('schoolContactName', { required: 'Nama wajib diisi' })}
                            placeholder="Nama Guru / Kepala Sekolah"
                          />
                        </FormField>
                        <FormField label="Kontak WA Penanggungjawab" error={errors.schoolContactWhatsapp?.message}>
                          <TextInput
                            type="tel"
                            {...register('schoolContactWhatsapp', { required: 'WA wajib diisi' })}
                            placeholder="08xxxxxxxxxx"
                          />
                        </FormField>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* hasContact === false → Show Warning Alert */}
                <AnimatePresence>
                  {hasSchoolContact === false && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                        <span className="text-lg leading-none mt-0.5">⚠️</span>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          Laporan tanpa kontak lokal akan memakan waktu lebih lama untuk diverifikasi oleh tim STA.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
