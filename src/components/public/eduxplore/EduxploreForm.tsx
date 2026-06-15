import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

import { SecureTurnstile } from '../../shared/SecureTurnstile';
import EduxploreSuccess from './EduxploreSuccess';
import {
  createDynamicSchema,
  loadEduxploreDraft,
  persistEduxploreDraft,
  clearEduxploreDraft,
  createEduxploreWhatsAppUrl,
} from '../../../lib/eduxplore';
import {
  getEdgeFunctionErrorMessage,
  submitVolunteerRegistration,
} from '../../../lib/admin/repository';
import { compressImage } from '../../../lib/image-compression';
import { logError } from '../../../lib/error-logger';

interface Props {
  programId: string;
  programTitle: string;
  isOpen: boolean;
  formConfig?: any;
  externalLink?: string | null;
}

const DEFAULT_FORM_CONFIG = [
  { id: 'nama_lengkap', type: 'text', label: 'Nama Lengkap', required: true },
  { id: 'email', type: 'email', label: 'Email Aktif', required: true },
  { id: 'whatsapp', type: 'tel', label: 'No. WhatsApp', required: true },
  { id: 'whatsapp_emergency', type: 'tel', label: 'WA Darurat', required: true },
  { id: 'alamat', type: 'textarea', label: 'Alamat', required: true },
  { id: 'tanggal_lahir', type: 'date', label: 'Tanggal Lahir', required: true },
  { id: 'size_baju', type: 'select', label: 'Ukuran Baju', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
  { id: 'pendidikan', type: 'text', label: 'Latar Belakang Pendidikan', required: true },
  { id: 'bidang_diminati', type: 'select', label: 'Bidang yang Diminati', required: true, options: ['Pengembangan Pemuda', 'Pendidikan dan Pengajaran Siswa Guru', 'Media dan Promosi serta Branding Desa', 'Branding Budaya dan Lingkungan Lokal'] },
  { id: 'riwayat_penyakit', type: 'textarea', label: 'Riwayat Penyakit', required: false },
  { id: 'bukti_dp', type: 'file', label: 'Bukti DP', required: true },
  { id: 'bukti_follow_ig', type: 'file', label: 'Bukti Follow IG', required: true },
  { id: 'foto_id_card', type: 'file', label: 'Pas Foto (untuk ID Card)', required: true },
];

export default function EduxploreForm({ programId, programTitle, isOpen, formConfig, externalLink }: Props) {
  // Semua field sepenuhnya dari form_config — tidak ada hardcode
  const activeFormConfig = Array.isArray(formConfig) && formConfig.length > 0
    ? formConfig
    : DEFAULT_FORM_CONFIG;

  const dynamicSchema = createDynamicSchema(activeFormConfig);

  const [draftValues] = useState(() => loadEduxploreDraft());
  const [assets, setAssets] = useState<Record<string, File | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: draftValues,
    mode: 'onTouched',
  });

  // Persist draft tanpa memicu re-render di setiap ketikan
  useEffect(() => {
    const subscription = watch((value) => {
      if (!isSuccess) persistEduxploreDraft(value as any);
    });
    return () => subscription.unsubscribe();
  }, [watch, isSuccess]);

  // File handler
  const handleFileChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const removeFile = (key: string) => {
    setAssets((prev) => ({ ...prev, [key]: null }));
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!turnstileToken) {
      setErrorMsg('Mohon selesaikan verifikasi keamanan.');
      return;
    }

    // Validate files
    const fileQuestions = activeFormConfig.filter((q: any) => q.type === 'file');
    for (const q of fileQuestions) {
      if (q.required && !assets[q.id]) {
        setErrorMsg(`${q.label} wajib diunggah.`);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Compress all files
      const compressedFiles: Record<string, File> = {};
      for (const q of fileQuestions) {
        const file = assets[q.id];
        if (file) {
          compressedFiles[q.id] = await compressImage(file);
        }
      }

      // Map form values to standard payload keys with case-insensitive fallback mapping
      let nama_lengkap = values.nama_lengkap;
      let email = values.email;
      let whatsapp = values.whatsapp;

      if (nama_lengkap === undefined) {
        const found = activeFormConfig.find(
          (q: any) => q.id === 'nama_lengkap' || (q.label && q.label.toLowerCase().includes('nama lengkap'))
        );
        if (found) nama_lengkap = values[found.id];
      }

      if (email === undefined) {
        const found = activeFormConfig.find(
          (q: any) => q.id === 'email' || q.type === 'email' || (q.label && q.label.toLowerCase().includes('email'))
        );
        if (found) email = values[found.id];
      }

      if (whatsapp === undefined) {
        const found = activeFormConfig.find(
          (q: any) => q.id === 'whatsapp' || (q.type === 'tel' && !q.id.includes('emergency')) || (q.label && (q.label.toLowerCase().includes('whatsapp') || q.label.toLowerCase().includes('wa ')) && !q.label.toLowerCase().includes('darurat'))
        );
        if (found) whatsapp = values[found.id];
      }

      // Extract dynamic answers
      const answers: Record<string, any> = {};
      activeFormConfig.forEach((q: any) => {
        if (q.type === 'file') return;
        answers[q.id] = values[q.id] !== undefined ? values[q.id] : null;
      });

      // Map dynamic fields to standard key names inside answers object for database column inserts
      const mapping = [
        { key: 'whatsapp_emergency', keywords: ['emergency', 'darurat'] },
        { key: 'alamat', keywords: ['alamat', 'address'] },
        { key: 'tanggal_lahir', keywords: ['tanggal lahir', 'birth'] },
        { key: 'size_baju', keywords: ['ukuran baju', 'size baju', 'ukuran kaos', 'size kaos'] },
        { key: 'pendidikan', keywords: ['pendidikan', 'education'] },
        { key: 'bidang_diminati', keywords: ['bidang', 'divisi', 'posisi'] },
        { key: 'riwayat_penyakit', keywords: ['penyakit', 'sakit', 'riwayat medis'] },
      ];

      mapping.forEach(({ key, keywords }) => {
        if (answers[key] === undefined || answers[key] === null) {
          const found = activeFormConfig.find(
            (q: any) => q.id === key || (q.label && keywords.some(kw => q.label.toLowerCase().includes(kw)))
          );
          if (found && values[found.id] !== undefined) {
            answers[key] = values[found.id];
          } else {
            answers[key] = null;
          }
        }
      });

      const payload = {
        program_id: programId,
        nama_lengkap,
        email,
        whatsapp,
        answers,
      };

      // Debug: log the exact payload being sent
      console.log('[EduxploreForm] program_id:', programId);
      console.log('[EduxploreForm] nama_lengkap:', nama_lengkap);
      console.log('[EduxploreForm] email:', email);
      console.log('[EduxploreForm] whatsapp:', whatsapp);
      console.log('[EduxploreForm] Full payload:', JSON.stringify(payload, null, 2));

      // Validate core fields before sending
      if (!nama_lengkap || !email || !whatsapp) {
        const missing = [];
        if (!nama_lengkap) missing.push('Nama Lengkap');
        if (!email) missing.push('Email');
        if (!whatsapp) missing.push('WhatsApp');
        throw new Error(`Field wajib belum terisi: ${missing.join(', ')}. Mohon lengkapi form.`);
      }

      if (!programId) {
        throw new Error('Program ID tidak ditemukan. Muat ulang halaman dan coba lagi.');
      }

      const { error: insertError } = await submitVolunteerRegistration(
        payload,
        compressedFiles,
        turnstileToken
      );

      if (insertError) {
        logError('EduxploreForm.insertRegistration', insertError);
        throw new Error(await getEdgeFunctionErrorMessage(insertError, 'Pendaftaran gagal dikirim.'));
      }

      // WhatsApp URL
      const whatsappUrl = createEduxploreWhatsAppUrl(values, programTitle, activeFormConfig);
      setIsSuccess(true);
      setIsSubmitting(false);
      clearEduxploreDraft();

      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }, 2500);
    } catch (err) {
      logError('EduxploreForm.onSubmit', err);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak diketahui.';
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

  const hasBuktiDp = activeFormConfig.some((q: any) => q.id === 'bukti_dp');

  const inputClass = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors';

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
                {/* Semua field dirender secara dinamis */}
                {activeFormConfig.map((q: any) => {
                  return (
                    <div key={q.id}>
                      {/* Banner QRIS DP — hanya sebelum field bukti_dp */}
                      {q.id === 'bukti_dp' && hasBuktiDp && (
                        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 mb-6">
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
                      )}

                      <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        {q.label} {q.required && '*'}
                      </label>

                      {q.type === 'textarea' ? (
                        <textarea
                          {...register(q.id)}
                          rows={3}
                          placeholder={`${q.label} Anda`}
                          className={`${inputClass} resize-none`}
                        />
                      ) : q.type === 'select' ? (
                        <select
                          {...register(q.id)}
                          className={`${inputClass} bg-white`}
                        >
                          <option value="">Pilih {q.label.toLowerCase()}</option>
                          {(q.options || []).map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : q.type === 'date' ? (
                        <input {...register(q.id)} type="date" className={inputClass} />
                      ) : q.type === 'file' ? (
                        <div>
                          {assets[q.id] ? (
                            <div className="relative flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                              <ImageIcon size={16} className="text-emerald-600 flex-shrink-0" />
                              <span className="text-xs text-emerald-800 font-medium truncate flex-1">
                                {assets[q.id]!.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile(q.id)}
                                className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-emerald-300 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-3 p-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                              <Upload size={16} className="text-gray-400" />
                              <span className="text-xs text-gray-500">Upload {q.label.toLowerCase()}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange(q.id)}
                              />
                            </label>
                          )}
                        </div>
                      ) : q.type === 'number' ? (
                        <input
                          {...register(q.id)}
                          type="number"
                          placeholder={`${q.label} Anda`}
                          className={inputClass}
                        />
                      ) : q.type === 'email' ? (
                        <input
                          {...register(q.id)}
                          type="email"
                          placeholder="email@contoh.com"
                          className={inputClass}
                        />
                      ) : q.type === 'tel' ? (
                        <input
                          {...register(q.id)}
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          className={inputClass}
                        />
                      ) : (
                        <input
                          {...register(q.id)}
                          type="text"
                          placeholder={`${q.label} Anda`}
                          className={inputClass}
                        />
                      )}

                      {errors[q.id] && <p className="text-xs text-red-500 mt-1">{errors[q.id].message as string}</p>}
                    </div>
                  );
                })}

                {/* Guidebook */}
                {externalLink && (
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <h3 className="text-sm sm:text-base font-bold text-emerald-900 mb-1">
                          Panduan Kegiatan (Guidebook)
                        </h3>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                          Silakan lihat dokumen panduan untuk informasi detail mengenai program ini.
                        </p>
                      </div>
                      <a
                        href={externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-900/10 cursor-pointer shrink-0 w-full sm:w-auto text-center"
                      >
                        Lihat Guidebook
                      </a>
                    </div>
                  </div>
                )}

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
