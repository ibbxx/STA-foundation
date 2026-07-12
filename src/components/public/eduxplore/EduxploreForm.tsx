import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, Image as ImageIcon, FileText } from 'lucide-react';

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
import { safeNormalizeUrl } from '../../../lib/sanitize';

interface Props {
  programId: string;
  programTitle: string;
  isOpen: boolean;
  formConfig?: any;
  externalLink?: string | null;
}

// ── Default Configurations ──

const DEFAULT_REGULER_FORM_CONFIG = [
  { id: 'nama_lengkap', type: 'text', label: 'Nama Lengkap', required: true },
  { id: 'email', type: 'email', label: 'Email Aktif', required: true },
  { id: 'whatsapp', type: 'tel', label: 'No. WhatsApp', required: true },
  { id: 'instagram', type: 'text', label: 'Instagram', required: true },
  { id: 'institusi', type: 'text', label: 'Institusi / Sekolah / Kampus', required: true },
  { id: 'jurusan', type: 'text', label: 'Jurusan / Kelas / Lainnya', required: true },
  { id: 'bukti_follow_sta', type: 'file', label: 'Bukti Follow Instagram @sekolah.tanahair', required: true },
  { id: 'bukti_follow_bepro', type: 'file', label: 'Bukti Follow Instagram @bepro_id', required: true },
  { id: 'mini_esai', type: 'textarea', label: 'Mini Esai (Motivasi & Kontribusi)', required: true },
  { id: 'meeting_point', type: 'select', label: 'Meeting Point', required: true, options: ['Payakumbuh', 'Padang', 'Jakarta'] },
  { id: 'bukti_pembayaran', type: 'file', label: 'Bukti Pembayaran (Full Payment / Cicilan 50%)', required: true },
];

const DEFAULT_BEASISWA_FORM_CONFIG = [
  { id: 'nama_lengkap', type: 'text', label: 'Nama Lengkap', required: true },
  { id: 'email', type: 'email', label: 'Email Aktif', required: true },
  { id: 'whatsapp', type: 'tel', label: 'No. WhatsApp', required: true },
  { id: 'instagram', type: 'text', label: 'Instagram', required: true },
  { id: 'institusi', type: 'text', label: 'Institusi / Sekolah / Kampus', required: true },
  { id: 'jurusan', type: 'text', label: 'Jurusan / Kelas / Lainnya', required: true },
  { id: 'bukti_follow_sta', type: 'file', label: 'Bukti Follow Instagram @sekolah.tanahair', required: true },
  { id: 'bukti_follow_bepro', type: 'file', label: 'Bukti Follow Instagram @bepro_id', required: true },
  { id: 'cv', type: 'file', label: 'Curriculum Vitae', required: true },
  { id: 'motivation_letter', type: 'file', label: 'Motivation Letter (PDF)', required: true },
  { id: 'social_project_proposal', type: 'file', label: 'Mini Proposal Project atau Gagasan Dampak Sosial (PDF)', required: true },
];

export default function EduxploreForm({ programId, programTitle, isOpen, formConfig, externalLink }: Props) {
  const [registrationType, setRegistrationType] = useState<'reguler' | 'beasiswa'>('reguler');

  // Cek apakah data form_config di DB mendukung dual-template (object) atau legacy (array)
  const isDualForm = formConfig && typeof formConfig === 'object' && !Array.isArray(formConfig) && ('reguler' in formConfig || 'beasiswa' in formConfig);

  const activeFormConfig = isDualForm
    ? (registrationType === 'beasiswa' ? (formConfig.beasiswa || DEFAULT_BEASISWA_FORM_CONFIG) : (formConfig.reguler || DEFAULT_REGULER_FORM_CONFIG))
    : (Array.isArray(formConfig) && formConfig.length > 0 ? formConfig : DEFAULT_REGULER_FORM_CONFIG);

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
        {/* Section Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600 mb-3">
            Formulir Pendaftaran
          </p>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Daftar Sebagai Volunteer
          </h2>
          <p className="text-sm text-slate-500 mt-2">Pilih jalur pendaftaran relawan Anda di bawah ini.</p>
        </div>

        {/* Tab Pemilih Jalur (Hanya tampil jika program mendukung dual form) */}
        {isDualForm && (
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50 shadow-inner">
              <button
                type="button"
                onClick={() => setRegistrationType('reguler')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  registrationType === 'reguler'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Jalur Reguler
              </button>
              <button
                type="button"
                onClick={() => setRegistrationType('beasiswa')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  registrationType === 'beasiswa'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Jalur Beasiswa
              </button>
            </div>
          </div>
        )}

        {/* Form Body - Dikey berdasarkan jalur pendaftaran agar hooks re-initialize secara total */}
        <VolunteerFormInner
          key={registrationType}
          registrationType={registrationType}
          programId={programId}
          programTitle={programTitle}
          activeFormConfig={activeFormConfig}
          isDualForm={isDualForm}
          externalLink={externalLink}
        />
      </div>
    </section>
  );
}

// ── Inner Component for Clean Hook Form Re-initialization ──

interface InnerProps {
  registrationType: 'reguler' | 'beasiswa';
  programId: string;
  programTitle: string;
  activeFormConfig: any[];
  isDualForm: boolean;
  externalLink?: string | null;
}

function VolunteerFormInner({ registrationType, programId, programTitle, activeFormConfig, isDualForm, externalLink }: InnerProps) {
  const dynamicSchema = createDynamicSchema(activeFormConfig);
  const safeExternalLink = externalLink ? safeNormalizeUrl(externalLink, '') : '';

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

  // Persist draft
  useEffect(() => {
    const subscription = watch((value) => {
      if (!isSuccess) persistEduxploreDraft(value as any);
    });
    return () => subscription.unsubscribe();
  }, [watch, isSuccess]);

  // File handler supporting both Images and PDF files
  const handleFileChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setErrorMsg('Format berkas tidak valid. Harap unggah gambar (JPG, PNG, WebP) atau dokumen PDF.');
      return;
    }

    if (isPdf && file.size > 1 * 1024 * 1024) {
      setErrorMsg('Ukuran file PDF maksimal 1MB.');
      return;
    }

    if (isImage && file.size > 10 * 1024 * 1024) {
      setErrorMsg('Ukuran gambar maksimal 10MB.');
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
      // Process files: compress images, bypass PDFs
      const processedFiles: Record<string, File> = {};
      for (const q of fileQuestions) {
        const file = assets[q.id];
        if (file) {
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            processedFiles[q.id] = file;
          } else {
            processedFiles[q.id] = await compressImage(file);
          }
        }
      }

      // Map values
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

      const answers: Record<string, any> = {};
      activeFormConfig.forEach((q: any) => {
        if (q.type === 'file') return;
        answers[q.id] = values[q.id] !== undefined ? values[q.id] : null;
      });

      // Map standard keys for tables
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
        registration_type: isDualForm ? registrationType : 'reguler',
      };

      if (!nama_lengkap || !email || !whatsapp) {
        const missing = [];
        if (!nama_lengkap) missing.push('Nama Lengkap');
        if (!email) missing.push('Email');
        if (!whatsapp) missing.push('WhatsApp');
        throw new Error(`Field wajib belum terisi: ${missing.join(', ')}. Mohon lengkapi form.`);
      }

      const { error: insertError } = await submitVolunteerRegistration(
        payload,
        processedFiles,
        turnstileToken
      );

      if (insertError) {
        logError('EduxploreForm.insertRegistration', insertError);
        throw new Error(await getEdgeFunctionErrorMessage(insertError, 'Pendaftaran gagal dikirim.'));
      }

      const mappedValuesForWa = { ...values, nama_lengkap, email, whatsapp };
      const whatsappUrl = createEduxploreWhatsAppUrl(mappedValuesForWa, `${programTitle} (Jalur ${registrationType.toUpperCase()})`, activeFormConfig);
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

  const hasBuktiDp = activeFormConfig.some((q: any) => q.id === 'bukti_dp' || q.id === 'bukti_pembayaran');
  const inputClass = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors bg-white';

  return (
    <AnimatePresence mode="wait">
      {isSuccess ? (
        <EduxploreSuccess key="success" />
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-6 sm:p-10 shadow-sm"
        >
          <form onSubmit={onSubmit} className="space-y-6">
            {activeFormConfig.map((q: any) => {
              const file = assets[q.id];
              const isPdf = file ? (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) : false;

              return (
                <div key={q.id}>
                  {/* Banner QRIS DP — hanya sebelum field bukti_dp / bukti_pembayaran */}
                  {(q.id === 'bukti_dp' || q.id === 'bukti_pembayaran') && hasBuktiDp && (
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 mb-6">
                      <div className="text-center mb-5">
                        <h3 className="text-sm sm:text-base font-bold text-emerald-900 mb-2">
                          Informasi Pembayaran Kontribusi
                        </h3>
                        <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed max-w-lg mx-auto">
                          Silakan lakukan pembayaran biaya kontribusi (DP / Pelunasan) melalui scan QRIS di bawah ini sebelum mengunggah bukti pembayaran.
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
                      {file ? (
                        <div className="relative flex items-center gap-3 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                          {isPdf ? (
                            <FileText size={18} className="text-emerald-600 flex-shrink-0" />
                          ) : (
                            <ImageIcon size={18} className="text-emerald-600 flex-shrink-0" />
                          )}
                          <span className="text-xs text-emerald-800 font-semibold truncate flex-1">
                            {file.name}
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
                        <label className="flex items-center gap-3 p-3.5 border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 rounded-xl cursor-pointer transition-all">
                          <Upload size={16} className="text-slate-400" />
                          <span className="text-xs text-slate-500 font-medium">Unggah {q.label.toLowerCase()} (Gambar / PDF)</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
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

                  {errors[q.id] && <p className="text-xs text-rose-500 mt-1">{errors[q.id].message as string}</p>}
                </div>
              );
            })}

            {/* Guidebook */}
            {safeExternalLink && (
              <div className="bg-emerald-50/70 rounded-2xl p-6 border border-emerald-200/70">
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
                    href={safeExternalLink}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-900/10 cursor-pointer shrink-0 w-full sm:w-auto text-center"
                  >
                    Lihat Guidebook
                  </a>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">🚫</span>
                <p className="text-sm text-rose-700 font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Turnstile Security verification */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-14 rounded-xl text-white font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isDualForm && registrationType === 'beasiswa'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-100'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-100'
              }`}
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
  );
}
