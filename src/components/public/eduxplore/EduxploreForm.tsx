import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

import { SecureTurnstile } from '../../shared/SecureTurnstile';
import EduxploreSuccess from './EduxploreSuccess';
import {
  eduxploreFormSchema,
  type EduxploreFormValues,
  type EduxploreAssets,
  EDUXPLORE_DEFAULT_VALUES,
  SIZE_OPTIONS,
  BIDANG_OPTIONS,
  loadEduxploreDraft,
  persistEduxploreDraft,
  clearEduxploreDraft,
  createEduxploreWhatsAppUrl,
} from '../../../lib/eduxplore';
import {
  uploadVolunteerFile,
  insertVolunteerRegistration,
} from '../../../lib/admin/repository';
import { compressImage } from '../../../lib/image-compression';
import { logError } from '../../../lib/error-logger';

interface Props {
  programId: string;
  programTitle: string;
  isOpen: boolean;
}

export default function EduxploreForm({ programId, programTitle, isOpen }: Props) {
  const [draftValues] = useState(() => loadEduxploreDraft());
  const [assets, setAssets] = useState<EduxploreAssets>({ bukti_dp: null, bukti_follow_ig: null, foto_id_card: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EduxploreFormValues>({
    resolver: zodResolver(eduxploreFormSchema),
    defaultValues: draftValues,
    mode: 'onTouched',
  });

  // Persist draft tanpa memicu re-render di setiap ketikan (mengurangi lag)
  useEffect(() => {
    const subscription = watch((value) => {
      if (!isSuccess) persistEduxploreDraft(value as EduxploreFormValues);
    });
    return () => subscription.unsubscribe();
  }, [watch, isSuccess]);

  // File handler
  const handleFileChange = (key: keyof EduxploreAssets) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: max 5MB, image only
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, dll).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 5MB.');
      return;
    }

    setErrorMsg(null);
    setAssets((prev) => ({ ...prev, [key]: file }));
  };

  const removeFile = (key: keyof EduxploreAssets) => {
    setAssets((prev) => ({ ...prev, [key]: null }));
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!turnstileToken) {
      setErrorMsg('Mohon selesaikan verifikasi keamanan.');
      return;
    }
    if (!assets.bukti_dp) {
      setErrorMsg('Bukti DP wajib diunggah.');
      return;
    }
    if (!assets.bukti_follow_ig) {
      setErrorMsg('Bukti follow IG wajib diunggah.');
      return;
    }
    if (!assets.foto_id_card) {
      setErrorMsg('Pas Foto (untuk ID Card) wajib diunggah.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Compress & Upload files
      const compressedDp = await compressImage(assets.bukti_dp);
      const compressedFollow = await compressImage(assets.bukti_follow_ig);
      const compressedId = await compressImage(assets.foto_id_card);

      const [dpUrl, followUrl, idUrl] = await Promise.all([
        uploadVolunteerFile(compressedDp, 'dp'),
        uploadVolunteerFile(compressedFollow, 'follow'),
        uploadVolunteerFile(compressedId, 'id_card'),
      ]);

      // 2. Insert registration
      const { error: insertError } = await insertVolunteerRegistration({
        program_id: programId,
        nama_lengkap: values.nama_lengkap,
        email: values.email,
        whatsapp: values.whatsapp,
        whatsapp_emergency: values.whatsapp_emergency,
        alamat: values.alamat,
        tanggal_lahir: values.tanggal_lahir,
        size_baju: values.size_baju,
        pendidikan: values.pendidikan,
        bidang_diminati: values.bidang_diminati,
        riwayat_penyakit: values.riwayat_penyakit || null,
        bukti_dp_url: dpUrl,
        bukti_follow_url: followUrl,
        foto_id_url: idUrl,
        status: 'pending',
      });

      if (insertError) {
        logError('EduxploreForm.insertRegistration', insertError);
        throw insertError;
      }

      // 3. Success
      const whatsappUrl = createEduxploreWhatsAppUrl(values, programTitle);
      setIsSuccess(true);
      setIsSubmitting(false);
      clearEduxploreDraft();

      // 4. Delay WhatsApp redirect
      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }, 2500);
    } catch (err: any) {
      logError('EduxploreForm.onSubmit', err);
      const msg = err?.message || 'Terjadi kesalahan yang tidak diketahui.';
      setErrorMsg(`Gagal mengirim pendaftaran: ${msg}`);
      setIsSubmitting(false);
    }
  });

  if (!isOpen) {
    return (
      <div className="py-16 sm:py-24 text-center px-5">
        <div className="max-w-md mx-auto p-8 bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-lg font-bold text-gray-700">Pendaftaran belum dibuka atau sudah ditutup.</p>
        </div>
      </div>
    );
  }

  return (
    <section id="form-pendaftaran" className="relative z-10 py-10 sm:py-24 bg-white">
      <div className="max-w-2xl mx-auto px-5 md:px-8">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <EduxploreSuccess key="success" />
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Section Header */}
              <div className="text-center mb-8 sm:mb-14">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600 mb-3">
                  Formulir Pendaftaran
                </p>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                  Daftar Sebagai Volunteer
                </h2>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Lengkap *</label>
                  <input
                    {...register('nama_lengkap')}
                    type="text"
                    placeholder="Nama lengkap Anda"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                  />
                  {errors.nama_lengkap && <p className="text-xs text-red-500 mt-1">{errors.nama_lengkap.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email *</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="email@contoh.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                {/* WhatsApp Row */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">WhatsApp *</label>
                    <input
                      {...register('whatsapp')}
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                    />
                    {errors.whatsapp && <p className="text-xs text-red-500 mt-1">{errors.whatsapp.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">WA Darurat *</label>
                    <input
                      {...register('whatsapp_emergency')}
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                    />
                    {errors.whatsapp_emergency && <p className="text-xs text-red-500 mt-1">{errors.whatsapp_emergency.message}</p>}
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Alamat *</label>
                  <textarea
                    {...register('alamat')}
                    rows={2}
                    placeholder="Alamat lengkap Anda"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors resize-none"
                  />
                  {errors.alamat && <p className="text-xs text-red-500 mt-1">{errors.alamat.message}</p>}
                </div>

                {/* Tanggal Lahir & Size Baju */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Tanggal Lahir *</label>
                    <input
                      {...register('tanggal_lahir')}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                    />
                    {errors.tanggal_lahir && <p className="text-xs text-red-500 mt-1">{errors.tanggal_lahir.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Ukuran Baju *</label>
                    <select
                      {...register('size_baju')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors bg-white"
                    >
                      <option value="">Pilih ukuran</option>
                      {SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    {errors.size_baju && <p className="text-xs text-red-500 mt-1">{errors.size_baju.message}</p>}
                  </div>
                </div>

                {/* Latar Belakang Pendidikan */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Latar Belakang Pendidikan *</label>
                  <input
                    {...register('pendidikan')}
                    type="text"
                    placeholder="Contoh: S1 Pendidikan Biologi - Universitas Hasanuddin"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                  />
                  {errors.pendidikan && <p className="text-xs text-red-500 mt-1">{errors.pendidikan.message}</p>}
                </div>

                {/* Bidang yang Diminati */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Bidang yang Diminati *</label>
                  <select
                    {...register('bidang_diminati')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors bg-white"
                  >
                    <option value="">Pilih bidang</option>
                    {BIDANG_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.bidang_diminati && <p className="text-xs text-red-500 mt-1">{errors.bidang_diminati.message}</p>}
                </div>

                {/* Riwayat Penyakit */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Riwayat Penyakit <span className="text-gray-400 font-normal">(opsional)</span>
                  </label>
                  <textarea
                    {...register('riwayat_penyakit')}
                    rows={2}
                    placeholder="Tuliskan jika ada riwayat penyakit..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                {/* Informasi Pembayaran & QRIS */}
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                  <div className="text-center mb-5">
                    <h3 className="text-sm sm:text-base font-bold text-emerald-900 mb-2">
                      Informasi Pembayaran (DP)
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed max-w-lg mx-auto">
                      Silakan lakukan pembayaran Down Payment (DP) sebesar <strong className="font-bold text-emerald-900">Rp 300.000</strong> melalui scan QRIS di bawah ini sebelum mengunggah bukti pendaftaran.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <a 
                      href="/images/qris-payment.jpeg" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-100 hover:shadow-md hover:border-emerald-300 transition-all group block cursor-pointer"
                    >
                      <div className="relative overflow-hidden rounded-xl">
                        <img 
                          src="/images/qris-payment.jpeg" 
                          alt="QRIS Pembayaran Eduxplore" 
                          className="max-w-[200px] sm:max-w-[240px] w-full rounded-xl group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl">
                          <span className="text-white text-sm font-bold flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
                            Perbesar
                          </span>
                        </div>
                      </div>
                      <p className="text-center text-[10px] text-emerald-600 mt-2 font-medium">Klik untuk memperbesar</p>
                    </a>
                  </div>
                </div>

                {/* File Uploads */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Bukti DP */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Bukti DP *</label>
                    {assets.bukti_dp ? (
                      <div className="relative flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <ImageIcon size={16} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-xs text-emerald-800 font-medium truncate flex-1">
                          {assets.bukti_dp.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile('bukti_dp')}
                          className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-emerald-300 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                        <Upload size={16} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Upload bukti DP</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange('bukti_dp')}
                        />
                      </label>
                    )}
                  </div>

                  {/* Bukti Follow IG */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Bukti Follow IG *</label>
                    {assets.bukti_follow_ig ? (
                      <div className="relative flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <ImageIcon size={16} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-xs text-emerald-800 font-medium truncate flex-1">
                          {assets.bukti_follow_ig.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile('bukti_follow_ig')}
                          className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-emerald-300 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                        <Upload size={16} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Upload bukti follow</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange('bukti_follow_ig')}
                        />
                      </label>
                    )}
                  </div>

                  {/* Pas Foto */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Pas Foto (untuk ID Card) *</label>
                    {assets.foto_id_card ? (
                      <div className="relative flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <ImageIcon size={16} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-xs text-emerald-800 font-medium truncate flex-1">
                          {assets.foto_id_card.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile('foto_id_card')}
                          className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-emerald-300 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                        <Upload size={16} className="text-gray-400" />
                        <span className="text-xs text-gray-500">Upload foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange('foto_id_card')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5">🚫</span>
                    <p className="text-sm text-rose-700">{errorMsg}</p>
                  </div>
                )}

                {/* Turnstile */}
                <div className="flex justify-center">
                  <SecureTurnstile
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                    onSuccess={(token) => {
                      setTurnstileToken(token);
                      setErrorMsg(null);
                    }}
                    onError={(err) => {
                      console.error('Turnstile failed', err);
                      setErrorMsg('Verifikasi keamanan terganggu. Coba muat ulang halaman.');
                    }}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-500 active:scale-[0.98] transition-colors shadow-lg shadow-emerald-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Pendaftaran'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
