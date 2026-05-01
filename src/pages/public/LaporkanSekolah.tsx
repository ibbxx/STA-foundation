import { useEffect, useState } from 'react';
import { SecureTurnstile } from '../../components/shared/SecureTurnstile';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, HeartHandshake, Search, ShieldCheck as ShieldIcon, Wand2, ArrowRight, X } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import Step1Reporter from '../../components/report-school/Step1Reporter';
import Step2School from '../../components/report-school/Step2School';
import Step3Needs from '../../components/report-school/Step3Needs';
import StepNavigation from '../../components/report-school/StepNavigation';
import StepProgress from '../../components/report-school/StepProgress';

import {
  REPORT_SCHOOL_STEPS,
  buildReportDescription,
  clearReportSchoolDraft,
  createWhatsAppReportUrl,
  getUserIP,
  isReportSchoolStepValid,
  loadReportSchoolDraft,
  persistReportSchoolDraft,
  reportSchoolFormSchema,
  type ReportSchoolAssets,
  type ReportSchoolFormValues,
} from '../../lib/report-school';
import { checkIPRateLimit, checkIsBlacklisted, insertSchoolReport, uploadSchoolReportPhotos } from '../../lib/admin/repository';
import { logError } from '../../lib/error-logger';
import { supabase } from '../../lib/supabase/types';

// Derive type from Zod schema to keep resolver and form in sync
type FormValues = z.infer<typeof reportSchoolFormSchema>;

const createEmptyAssets = (): ReportSchoolAssets => {
  return { schoolPhotos: [] };
}

function renderStepContent(
  stepKey: string,
  assets: ReportSchoolAssets,
  onAssetsChange: (assets: ReportSchoolAssets) => void,
) {
  switch (stepKey) {
    case 'reporter': return <Step1Reporter />;
    case 'school': return <Step2School />;
    case 'needs': return <Step3Needs assets={assets} onAssetsChange={onAssetsChange} />;
    default: return null;
  }
}

export default function LaporkanSekolah() {
  const [draftValues] = useState(() => loadReportSchoolDraft());
  const [currentStep, setCurrentStep] = useState(0);
  const [assets, setAssets] = useState<ReportSchoolAssets>(createEmptyAssets);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userIP, setUserIP] = useState('unknown');
  const [spamError, setSpamError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: rows } = await supabase.from('site_content').select('key, value').in('key', ['hero_laporkan', 'modal_lapor_sekolah']);
        if (rows) {
          rows.forEach((row: any) => {
            const val = row.value;
            const parsed = typeof val === 'string' ? JSON.parse(val) : val;
            if (row.key === 'hero_laporkan' && parsed.imageUrl) setHeroImage(parsed.imageUrl);
            if (row.key === 'modal_lapor_sekolah' && parsed.imageUrl) setModalImage(parsed.imageUrl);
          });
        }
      } catch (e) { }
    }
    loadData();
  }, []);

  // Close modal on Escape key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !isSuccess && !isSubmitting) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen, isSuccess, isSubmitting]);

  // Fetch user's IP on mount
  useEffect(() => {
    getUserIP().then(setUserIP);
  }, []);

  const methods = useForm<FormValues>({
    resolver: zodResolver(reportSchoolFormSchema),
    defaultValues: draftValues as FormValues,
    mode: 'onChange',
  });

  const { handleSubmit, reset, trigger, watch } = methods;
  const formValues = watch();
  const currentStepConfig = REPORT_SCHOOL_STEPS[currentStep];
  const isCurrentStepValid = isReportSchoolStepValid(
    currentStepConfig.key,
    formValues as ReportSchoolFormValues,
    assets,
  );

  useEffect(() => {
    if (!isSuccess) persistReportSchoolDraft(formValues as ReportSchoolFormValues);
  }, [formValues, isSuccess]);

  const handleNext = async () => {
    const isStepValid = await trigger(currentStepConfig.fields, { shouldFocus: true });
    if (isStepValid) {
      if (currentStep < REPORT_SCHOOL_STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleInjectDummy = () => {
    // 1. Fill all text data
    reset({
      reporterName: 'Budi Santoso',
      reporterWhatsapp: '081234567890',
      reporterEmail: 'budi.tester@gmail.com',
      reporterAddress: 'Jl. Merdeka No. 123, Jakarta Selatan',
      reporterStatus: 'Guru Sekolah',
      isWillingToFacilitate: false,
      hasSchoolContact: true,
      schoolContactName: 'Bapak Kepala Sekolah',
      schoolContactWhatsapp: '089876543210',

      schoolName: 'SDN 01 Harapan Bangsa',
      schoolLevel: 'SD',
      schoolStatus: 'Negeri',
      schoolAddress: 'Jl. Pendidikan No. 45, Desa Suka Maju, Bandung',
      schoolMapsUrl: 'https://maps.app.goo.gl/testing123',
      studentCount: '150',
      teacherCount: '10',

      buildingCondition: 'Rusak Ringan',
      physicalNeeds: ['Perbaikan Ruang Kelas', 'Renovasi Toilet dan Sanitasi', 'Perbaikan Atap, Dinding, dan Lantai'],
      nonPhysicalNeeds: ['Pelatihan Pengembangan Guru', 'Pelatihan Pengembangan Siswa (Literasi dan Perpustakaan)', 'Pelatihan Pengembangan Siswa (Program Kesehatan Sekolah)'],
      priorityTimeline: '3 Bulan',
      priorityReason: 'Kondisi atap sangat memprihatinkan dan rawan bocor saat hujan, mengganggu proses belajar 150 siswa setiap harinya.',
    } as FormValues);

    // 2. Create a dummy photo file so validation passes and WA gets a photo count
    const dummyBlob = new Blob(['dummy image content'], { type: 'image/jpeg' });
    const dummyFile = new File([dummyBlob], 'dummy-photo.jpg', { type: 'image/jpeg' });

    setAssets(prev => ({
      ...prev,
      schoolPhotos: [dummyFile]
    }));

    setCurrentStep(0);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!turnstileToken) {
      setSpamError('Mohon selesaikan verifikasi keamanan (Turnstile).');
      return;
    }

    setIsSubmitting(true);
    setSpamError(null);

    const typedValues = values as ReportSchoolFormValues;

    try {
      // ── Anti-Spam Layer 1: Blacklist Check ──
      const isBlacklisted = await checkIsBlacklisted(userIP, typedValues.reporterWhatsapp);
      if (isBlacklisted) {
        setSpamError('Akses Anda telah dibatasi oleh sistem keamanan kami. Jika ini kesalahan, hubungi admin STA.');
        setIsSubmitting(false);
        return;
      }

      // ── Anti-Spam Layer 2: IP Rate Limit ──
      if (userIP !== 'unknown') {
        const isRateLimited = await checkIPRateLimit(userIP);
        if (isRateLimited) {
          setSpamError('Terlalu banyak laporan dari perangkat ini. Silakan coba lagi dalam 1 jam.');
          setIsSubmitting(false);
          return;
        }
      }

      // 1. Upload foto ke Supabase Storage (wajib min 1)
      const photoUrls = await uploadSchoolReportPhotos(assets.schoolPhotos);

      // 2. Build description terstruktur dari seluruh data form
      const description = buildReportDescription(typedValues);
      const location = typedValues.schoolMapsUrl
        ? `${typedValues.schoolAddress} | Maps: ${typedValues.schoolMapsUrl}`
        : typedValues.schoolAddress;

      // 3. INSERT ke tabel school_reports (dengan IP)
      const { error: insertError } = await insertSchoolReport({
        reporter_name: typedValues.reporterName,
        reporter_phone: typedValues.reporterWhatsapp,
        reporter_ip: userIP,
        school_name: typedValues.schoolName,
        location,
        description,
        image_urls: photoUrls,
        status: 'pending',
      });

      if (insertError) {
        logError('LaporkanSekolah.insertSchoolReport', insertError);
      }
    } catch (err) {
      // Jika INSERT gagal, tetap lanjut ke WhatsApp agar data tidak hilang
      logError('LaporkanSekolah.onSubmit', err);
    }

    // 4. Show success state first to play animation
    const whatsappUrl = createWhatsAppReportUrl(values as ReportSchoolFormValues, assets);
    setIsSuccess(true);
    setIsSubmitting(false);
    clearReportSchoolDraft();

    // 5. Delay WhatsApp redirect so user can see the "WOW" animation
    setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }, 2500);
  });

  return (
    <div className="min-h-screen bg-[#FDFCFB] selection:bg-emerald-600 selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[100svh] w-full flex flex-col justify-end md:justify-center overflow-hidden bg-gray-900">
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <img src={heroImage} className="w-full h-full object-cover object-center" alt="Laporkan Sekolah" />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent md:bg-gradient-to-r md:from-gray-900/90 md:via-gray-900/40 md:to-transparent" />
          </div>
        )}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-8 pb-12 md:pb-0 pt-24 md:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full md:max-w-2xl"
          >
            <h1 className="text-[20px] sm:text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.2] tracking-tight mb-4 md:mb-6">
              Bantu kami menemukan <br className="hidden md:block" /> sekolah yang butuh bantuan.
            </h1>
            
            <p className="text-[11px] sm:text-sm md:text-xl text-gray-300 leading-relaxed font-light max-w-xl mb-8 md:mb-10">
              Setiap laporan Anda adalah langkah pertama untuk aksi nyata yang transparan dan berdampak luas bagi pendidikan Indonesia.
            </p>
 
            <div className="flex flex-row items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex h-10 md:h-14 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 md:px-10 text-[11px] md:text-base font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 shadow-lg shadow-emerald-900/40 group"
              >
                Mulai Laporkan Sekarang 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform md:w-5 md:h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ MODAL WIZARD ═══════════════ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSuccess && !isSubmitting) setIsModalOpen(false);
              }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-5xl h-[95vh] max-h-[800px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  if (!isSuccess && !isSubmitting) setIsModalOpen(false);
                }}
                className="absolute top-6 right-6 z-50 w-10 h-10 bg-gray-100/80 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                aria-label="Tutup Modal"
              >
                <X size={20} />
              </button>

              {/* Left Panel (Branding) */}
              <div className="hidden md:block w-1/3 relative bg-[#0A2E1F] overflow-hidden shrink-0">
                {modalImage && (
                  <img
                    src={modalImage}
                    alt="Sekolah"
                    className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
                  />
                )}
                <div className="absolute inset-0 p-10 flex flex-col justify-between">
                  <div className="flex items-center gap-3 font-bold text-lg text-white">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                      <ShieldCheck size={22} className="text-emerald-400" />
                    </div>
                    Lapor Sekolah
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-white leading-tight mb-4">
                      Bersama <br />Membangun <br /><span className="text-emerald-400">Pendidikan.</span>
                    </h2>
                    <p className="text-emerald-100/70 text-sm leading-relaxed">
                      Laporan Anda adalah data berharga. Tim relawan kami akan menggunakan informasi ini untuk melakukan verifikasi faktual di lapangan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Panel (Form Content) */}
              <div className="flex-1 flex flex-col bg-white h-full min-h-0 min-w-0 relative">

                {/* Mobile Header */}
                <div className="md:hidden px-6 py-4 border-b border-gray-100 flex items-center gap-2 font-bold text-sm text-gray-900 shrink-0">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  Lapor Sekolah
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 min-w-0 px-6 py-8 md:px-12 md:py-10">
                  <AnimatePresence mode="wait">
                    {isSuccess ? (
                      /* ═══════════════ SUCCESS OVERLAY ═══════════════ */
                      <motion.div
                        key="success-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center pb-10"
                      >
                        <div className="relative mb-8">
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center relative z-10 ring-8 ring-emerald-50/50"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.25, type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <CheckCircle2 size={64} strokeWidth={2.5} className="text-emerald-600" />
                            </motion.div>
                          </motion.div>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Berhasil!</h2>
                        <p className="text-gray-500 font-medium max-w-sm">Laporan Anda telah diterima dan diteruskan ke sistem keamanan kami.</p>
                      </motion.div>
                    ) : (
                      /* ═══════════════ FORM WIZARD ═══════════════ */
                      <motion.div
                        key="form-state"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FormProvider {...methods}>
                          <form onSubmit={onSubmit}>

                            {/* Step Progress directly in the white panel so it reads clearly */}
                            <div className="mb-10">
                              <StepProgress steps={REPORT_SCHOOL_STEPS} currentStep={currentStep} />

                              {import.meta.env.DEV && (
                                <button
                                  type="button"
                                  onClick={handleInjectDummy}
                                  className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors w-max"
                                >
                                  <Wand2 size={12} /> Inject Data
                                </button>
                              )}
                            </div>

                            <AnimatePresence mode="wait">
                              <motion.div
                                key={currentStepConfig.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                              >
                                {renderStepContent(currentStepConfig.key, assets, setAssets)}
                              </motion.div>
                            </AnimatePresence>

                            {/* Spam Error Banner */}
                            {spamError && (
                              <div className="mt-8 rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3">
                                <span className="text-lg leading-none mt-0.5">🚫</span>
                                <div>
                                  <p className="text-sm font-bold text-rose-900">Pengiriman Diblokir</p>
                                  <p className="text-sm text-rose-700 mt-0.5">{spamError}</p>
                                </div>
                              </div>
                            )}

                            {/* Turnstile Kustom yang Resilient */}
                            {currentStep === REPORT_SCHOOL_STEPS.length - 1 && (
                              <div className="mt-8 flex justify-center">
                                <SecureTurnstile
                                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                  onSuccess={(token) => {
                                    setTurnstileToken(token);
                                    setSpamError(null);
                                  }}
                                  onError={(err) => {
                                    console.error("Turnstile failed", err);
                                    setSpamError('Verifikasi keamanan terganggu. Anda dapat mencoba klik "Gunakan Jalur Cadangan" di atas.');
                                  }}
                                />
                              </div>
                            )}

                          </form>
                        </FormProvider>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Fixed Bottom Navigation */}
                {!isSuccess && (
                  <div className="px-6 pb-6 pt-2 md:px-12 md:pb-8 bg-white shrink-0">
                    <StepNavigation
                      currentStep={currentStep}
                      totalSteps={REPORT_SCHOOL_STEPS.length}
                      isCurrentStepValid={isCurrentStepValid}
                      isSubmitting={isSubmitting}
                      nextLabel={currentStep === 0 ? 'Selanjutnya' : 'Selanjutnya'}
                      onBack={handleBack}
                      onNext={handleNext}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
