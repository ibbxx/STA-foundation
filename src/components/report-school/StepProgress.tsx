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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-[0.08em] text-[#2C5F4F]">{activeStep.eyebrow}</p>
          <h2 className="text-xl font-light tracking-tight text-gray-900 sm:text-2xl">{activeStep.title}</h2>
        </div>
        <div className="text-sm text-gray-500">
          Langkah {currentStep + 1} dari {steps.length}
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-[#E4ECE7]">
        <motion.div
          className="h-full rounded-full bg-[#2C5F4F]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        />
      </div>

      <div className="md:hidden">
        <p className="text-sm leading-relaxed text-gray-500">{activeStep.description}</p>
      </div>

      <div className="hidden flex-wrap gap-x-6 gap-y-3 border-b border-black/5 pb-5 md:flex">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <div key={step.key} className="flex items-center gap-2.5">
              <span
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  isActive ? 'bg-[#2C5F4F]' : isComplete ? 'bg-[#89B49F]' : 'bg-gray-300',
                )}
              />
              <span
                className={cn(
                  'text-sm transition-colors',
                  isActive ? 'font-medium text-gray-900' : 'text-gray-500',
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
