import { motion } from 'framer-motion';
import type { ReportSchoolStep } from '../../lib/report-school';
import { cn } from '../../lib/utils';

interface StepProgressProps {
  steps: ReportSchoolStep[];
  currentStep: number;
}

export default function StepProgress({ steps, currentStep }: StepProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;
  const activeStep = steps[currentStep];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-wide text-emerald-600">{activeStep.eyebrow}</p>
          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-semibold text-gray-900">{activeStep.title}</h2>
        </div>
        <div className="text-sm text-gray-500">
          Langkah {currentStep + 1} dari {steps.length}
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-emerald-600"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="hidden flex-wrap gap-x-6 gap-y-2 border-b border-gray-100 pb-4 md:flex">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <div key={step.key} className="flex items-center gap-2">
              <span
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  isActive ? 'bg-emerald-600' : isComplete ? 'bg-emerald-300' : 'bg-gray-200',
                )}
              />
              <span
                className={cn(
                  'text-sm transition-colors',
                  isActive ? 'font-medium text-gray-900' : 'text-gray-400',
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
