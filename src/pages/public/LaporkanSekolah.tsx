import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, HeartHandshake, Search } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import Step1Reporter from '../../components/report-school/Step1Reporter';
import Step2School from '../../components/report-school/Step2School';
import Step3Needs from '../../components/report-school/Step3Needs';
import StepNavigation from '../../components/report-school/StepNavigation';
import StepProgress from '../../components/report-school/StepProgress';

import {
  REPORT_SCHOOL_DEFAULT_VALUES,
  REPORT_SCHOOL_STEPS,
  clearReportSchoolDraft,
  createWhatsAppReportUrl,
  isReportSchoolStepValid,
  loadReportSchoolDraft,
  persistReportSchoolDraft,
  reportSchoolFormSchema,
  type ReportSchoolAssets,
  type ReportSchoolFormValues,
} from '../../lib/report-school';

// Derive type from Zod schema to keep resolver and form in sync
type FormValues = z.infer<typeof reportSchoolFormSchema>;

const trustHighlights = [
  { icon: ShieldCheck, title: 'Ditinjau tim STA', description: 'Setiap laporan dibaca manual agar proses verifikasi hati-hati.' },
  { icon: Search, title: 'Verifikasi awal', description: 'Informasi awal dibandingkan dengan konteks lapangan sebelum ditindak.' },
  { icon: HeartHandshake, title: 'Tanpa biaya', description: 'Laporan ini independen, tidak dipungut biaya apapun.' },
];

function createEmptyAssets(): ReportSchoolAssets {
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
  const [lastWhatsAppUrl, setLastWhatsAppUrl] = useState('');

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

  const handleRestart = () => {
    reset(REPORT_SCHOOL_DEFAULT_VALUES as FormValues);
    setAssets(createEmptyAssets());
    setCurrentStep(0);
    setIsSuccess(false);
    clearReportSchoolDraft();
  };

  const onSubmit = handleSubmit((values) => {
    setIsSubmitting(true);
    const whatsappUrl = createWhatsAppReportUrl(values as ReportSchoolFormValues, assets);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setLastWhatsAppUrl(whatsappUrl);
    setIsSuccess(true);
    setIsSubmitting(false);
    clearReportSchoolDraft();
  });

  return (
    <div className="overflow-x-hidden bg-[#FBFAF8] py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-[42rem]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2C5F4F]/10 bg-white/80 px-3.5 py-2 backdrop-blur-sm sm:px-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2C5F4F]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">Platform Transparansi</span>
          </div>
          <h1 className="mt-5 text-[2rem] font-light leading-[1.08] tracking-tight text-gray-900 sm:mt-6 sm:text-5xl lg:text-6xl">
            Laporkan Sekolah
          </h1>
          <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-gray-600 sm:mt-6 sm:text-lg">
            Kami ubah alurnya menjadi 3 langkah ringkas. Lengkapi form di bawah lalu otomatis dikirim ke WhatsApp resmi admin STA.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-8 grid max-w-5xl gap-3 sm:grid-cols-3"
        >
          {trustHighlights.map((highlight) => (
            <div key={highlight.title} className="rounded-[1rem] border border-black/5 bg-white/70 px-4 py-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full bg-[#F4F8F6] p-2 text-[#2C5F4F]"><highlight.icon size={16} /></span>
                <p className="text-sm font-medium text-gray-900">{highlight.title}</p>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">{highlight.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-8 max-w-4xl"
        >
          <div className="rounded-[1.3rem] border border-black/5 bg-white p-4 shadow-xl shadow-emerald-900/5 sm:rounded-[1.6rem] sm:p-6 lg:p-7">
            {isSuccess ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="space-y-4 border-b border-black/5 pb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2C5F4F] text-white">
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                      Laporan Dalam Perjalanan!
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                      Terima kasih atas kepedulian Anda. Jika WhatsApp tidak otomatis terbuka, klik tombol di bawah.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href={lastWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#2C5F4F] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#234A3D]"
                  >
                    Buka WA Admin STA
                  </a>
                  <button
                    onClick={handleRestart}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:border-[#2C5F4F]/30 hover:text-[#2C5F4F]"
                  >
                    Buat Laporan Baru
                  </button>
                </div>
              </motion.div>
            ) : (
              <FormProvider {...methods}>
                <form onSubmit={onSubmit}>
                  <StepProgress steps={REPORT_SCHOOL_STEPS} currentStep={currentStep} />
                  <p className="mt-4 text-xs leading-relaxed text-gray-400">
                    Progress Anda tersimpan sementara di browser.
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStepConfig.key}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      className="mt-8"
                    >
                      {renderStepContent(currentStepConfig.key, assets, setAssets)}
                    </motion.div>
                  </AnimatePresence>
                  <StepNavigation
                    currentStep={currentStep}
                    totalSteps={REPORT_SCHOOL_STEPS.length}
                    isCurrentStepValid={isCurrentStepValid}
                    isSubmitting={isSubmitting}
                    nextLabel={currentStep === 0 ? 'Lanjut ke Step 2' : 'Lanjut'}
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                </form>
              </FormProvider>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
