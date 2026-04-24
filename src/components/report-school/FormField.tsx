import type {
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/utils';

interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, hint, error, required, children }: FormFieldProps) {
  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-800">
            {label}
            {required ? <span className="ml-1 text-rose-500">*</span> : null}
          </label>
          {hint ? <p className="text-sm leading-relaxed text-gray-500">{hint}</p> : null}
        </div>
      </div>
      {children}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}

export const baseInputClassName =
  'w-full rounded-[1rem] border border-gray-200 bg-white px-3.5 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2C5F4F]/10 focus:border-[#2C5F4F]/30 sm:rounded-[1.1rem] sm:px-4 sm:py-3.5';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props;

  return <input className={cn(baseInputClassName, className)} {...restProps} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...restProps } = props;

  return <textarea className={cn(baseInputClassName, 'min-h-[120px] resize-none sm:min-h-[132px]', className)} {...restProps} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...restProps } = props;

  return (
    <select className={cn(baseInputClassName, 'appearance-none', className)} {...restProps}>
      {children}
    </select>
  );
}

export function SoftPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[1.1rem] border border-black/5 bg-[#FCFBF8] p-4 sm:rounded-[1.2rem] sm:p-5',
        className,
      )}
      {...props}
    />
  );
}
