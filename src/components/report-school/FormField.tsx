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
    <div className="space-y-2">
      <div className="space-y-0.5">
        <label className="block text-sm font-semibold text-gray-900 tracking-wide">
          {label}
          {required ? <span className="ml-1 text-emerald-600">*</span> : null}
        </label>
        {hint ? <p className="text-sm text-gray-500">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-rose-600 font-medium">{error}</p> : null}
    </div>
  );
}

export const baseInputClassName =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...restProps } = props;

  return <input className={cn(baseInputClassName, className)} {...restProps} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...restProps } = props;

  return <textarea className={cn(baseInputClassName, 'min-h-[100px] resize-none', className)} {...restProps} />;
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
        'rounded-lg bg-gray-50 border border-gray-200 p-4',
        className,
      )}
      {...props}
    />
  );
}
