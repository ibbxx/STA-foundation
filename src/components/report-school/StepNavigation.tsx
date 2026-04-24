import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  isCurrentStepValid: boolean;
  isSubmitting: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
}

export default function StepNavigation({
  currentStep,
  totalSteps,
  isCurrentStepValid,
  isSubmitting,
  nextLabel = 'Lanjut',
  onBack,
  onNext,
}: StepNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="mt-10 flex flex-col gap-4 border-t border-black/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-gray-500">
        {isLastStep
          ? 'Pastikan seluruh data sudah benar sebelum diarahkan ke WhatsApp admin.'
          : 'Anda bisa kembali ke langkah sebelumnya kapan saja tanpa kehilangan draft.'}
      </div>

      <div className="flex w-full flex-col-reverse gap-3 self-stretch sm:w-auto sm:flex-row sm:items-center">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-[#2C5F4F]/20 hover:text-[#2C5F4F] sm:w-auto"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
        ) : null}

        {isLastStep ? (
          <button
            type="submit"
            disabled={!isCurrentStepValid || isSubmitting}
            className={cn(
              'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-all duration-200 sm:min-w-[170px] sm:w-auto',
              isCurrentStepValid && !isSubmitting
                ? 'bg-[#2C5F4F] shadow-[0_18px_40px_rgba(17,94,69,0.25)] hover:bg-[#244E41]'
                : 'cursor-not-allowed bg-[#98A7A1]',
            )}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSubmitting ? 'Mempersiapkan...' : 'Kirim ke WhatsApp'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!isCurrentStepValid}
            className={cn(
              'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition-all duration-200 sm:min-w-[148px] sm:w-auto',
              isCurrentStepValid
                ? 'bg-[#2C5F4F] shadow-[0_18px_40px_rgba(17,94,69,0.25)] hover:bg-[#244E41]'
                : 'cursor-not-allowed bg-[#98A7A1]',
            )}
          >
            {nextLabel}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
