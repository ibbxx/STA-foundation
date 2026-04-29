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
    <div className="flex flex-col gap-4 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-gray-500 max-w-xs leading-relaxed">
        {isLastStep
          ? 'Pastikan seluruh data sudah benar sebelum dikirim.'
          : 'Draft tersimpan otomatis selama pengisian.'}
      </div>

      <div className="flex w-full gap-3 sm:w-auto sm:items-center">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98] sm:w-auto"
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
              'inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] sm:w-auto',
              isCurrentStepValid && !isSubmitting
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                : 'cursor-not-allowed bg-gray-200 text-gray-400',
            )}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {isSubmitting ? 'Mengirim...' : 'Kirim ke WhatsApp'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!isCurrentStepValid}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] sm:w-auto',
              isCurrentStepValid
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                : 'cursor-not-allowed bg-gray-200 text-gray-400',
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
