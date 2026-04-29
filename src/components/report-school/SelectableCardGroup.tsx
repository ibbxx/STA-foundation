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
              'group rounded-lg border p-4 text-left transition-all duration-200 active:scale-[0.98]',
              isActive
                ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                : 'border-gray-200 bg-white hover:border-emerald-300',
            )}
            aria-pressed={isActive}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                {option.description ? <p className="text-sm leading-relaxed text-gray-500">{option.description}</p> : null}
              </div>
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all',
                  isActive
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-gray-200 bg-white text-transparent group-hover:border-emerald-300',
                )}
              >
                <Check size={12} strokeWidth={3} />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
