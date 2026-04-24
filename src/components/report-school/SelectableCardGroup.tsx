import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectableCardOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectableCardGroupProps {
  options: readonly SelectableCardOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: 'two' | 'three';
}

export function SelectableCardGroup({
  options,
  value,
  onChange,
  columns = 'two',
}: SelectableCardGroupProps) {
  return (
    <div className={cn('grid gap-3', columns === 'three' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2')}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'group rounded-[1rem] border px-3.5 py-3 text-left transition-all duration-200 sm:rounded-[1.1rem] sm:px-4 sm:py-3.5',
              isActive
                ? 'border-[#2C5F4F]/25 bg-[#F6FAF8]'
                : 'border-gray-200 bg-white hover:border-[#2C5F4F]/15',
            )}
            aria-pressed={isActive}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <p className="break-words text-sm font-medium text-gray-900">{option.label}</p>
                {option.description ? <p className="text-sm leading-relaxed text-gray-500">{option.description}</p> : null}
              </div>
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                  isActive
                    ? 'border-[#2C5F4F] bg-[#2C5F4F] text-white'
                    : 'border-gray-200 bg-white text-transparent group-hover:border-[#2C5F4F]/30',
                )}
              >
                <Check size={12} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
