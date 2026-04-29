import { useCallback, ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import { Camera, Paperclip, X } from 'lucide-react';
import { FormField } from './FormField';
import {
  BUILDING_CONDITIONS,
  PHYSICAL_NEEDS_OPTIONS,
  NON_PHYSICAL_NEEDS_OPTIONS,
  TIMELINE_OPTIONS,
  type ReportSchoolFormValues,
  type ReportSchoolAssets,
} from '../../lib/report-school';

interface Props {
  assets: ReportSchoolAssets;
  onAssetsChange: (assets: ReportSchoolAssets) => void;
}

export default function Step3Needs({ assets, onAssetsChange }: Props) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ReportSchoolFormValues>();

  const watchedPhysical = watch('physicalNeeds') ?? [];
  const watchedNonPhysical = watch('nonPhysicalNeeds') ?? [];

  const handleCheckboxChange = (
    field: 'physicalNeeds' | 'nonPhysicalNeeds',
    value: string,
    currentSelections: string[],
  ) => {
    if (currentSelections.includes(value)) {
      setValue(field, currentSelections.filter((i) => i !== value), { shouldValidate: true });
    } else if (currentSelections.length < 3) {
      setValue(field, [...currentSelections, value], { shouldValidate: true });
    }
  };

  const handlePhotoUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      const fileList: File[] = Array.from(e.target.files);
      const remainingSlots = 3 - assets.schoolPhotos.length;
      if (remainingSlots > 0) {
        onAssetsChange({
          ...assets,
          schoolPhotos: [...assets.schoolPhotos, ...fileList.slice(0, remainingSlots)],
        });
      }
    },
    [assets, onAssetsChange],
  );

  const removePhoto = useCallback(
    (index: number) => {
      onAssetsChange({
        ...assets,
        schoolPhotos: assets.schoolPhotos.filter((_, i) => i !== index),
      });
    },
    [assets, onAssetsChange],
  );

  return (
    <div className="space-y-8">
      {/* Kondisi Bangunan */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-900">Kondisi Fisik Bangunan</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILDING_CONDITIONS.map((cond) => (
            <label
              key={cond.value}
              className="relative flex cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-emerald-300 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:ring-1 has-[:checked]:ring-emerald-600"
            >
              <input
                type="radio"
                value={cond.value}
                {...register('buildingCondition')}
                className="peer sr-only"
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-bold text-gray-900">{cond.value}</span>
                <span className="text-sm leading-relaxed text-gray-500">{cond.desc}</span>
              </div>
            </label>
          ))}
        </div>
        {errors.buildingCondition && (
          <p className="text-sm font-medium text-rose-600">{errors.buildingCondition.message}</p>
        )}
      </div>

      <hr className="border-gray-100" />

      {/* Kebutuhan Fisik */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <label className="block text-sm font-semibold text-gray-900">Kebutuhan Fisik Prioritas (Wajib Pilih 3)</label>
          <span className={`text-sm font-bold ${watchedPhysical.length === 3 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {watchedPhysical.length} / 3 terpilih
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {PHYSICAL_NEEDS_OPTIONS.map((opt) => {
            const isChecked = watchedPhysical.includes(opt);
            const isDisabled = !isChecked && watchedPhysical.length >= 3;
            return (
              <label
                key={opt}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  isChecked
                    ? 'border-emerald-600 bg-emerald-50'
                    : isDisabled
                      ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                      : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => handleCheckboxChange('physicalNeeds', opt, watchedPhysical)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                />
                <span className={`text-sm ${isChecked ? 'font-medium text-emerald-900' : 'text-gray-700'}`}>{opt}</span>
              </label>
            );
          })}
        </div>
        {errors.physicalNeeds && (
          <p className="text-sm font-medium text-rose-600">{errors.physicalNeeds.message}</p>
        )}
      </div>

      <hr className="border-gray-100" />

      {/* Kebutuhan Non-Fisik */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <label className="block text-sm font-semibold text-gray-900">Kebutuhan Non-Fisik Prioritas (Wajib Pilih 3)</label>
          <span className={`text-sm font-bold ${watchedNonPhysical.length === 3 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {watchedNonPhysical.length} / 3 terpilih
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {NON_PHYSICAL_NEEDS_OPTIONS.map((opt) => {
            const isChecked = watchedNonPhysical.includes(opt);
            const isDisabled = !isChecked && watchedNonPhysical.length >= 3;
            return (
              <label
                key={opt}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  isChecked
                    ? 'border-emerald-600 bg-emerald-50'
                    : isDisabled
                      ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                      : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => handleCheckboxChange('nonPhysicalNeeds', opt, watchedNonPhysical)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                />
                <span className={`text-sm ${isChecked ? 'font-medium text-emerald-900' : 'text-gray-700'}`}>{opt}</span>
              </label>
            );
          })}
        </div>
        {errors.nonPhysicalNeeds && (
          <p className="text-sm font-medium text-rose-600">{errors.nonPhysicalNeeds.message}</p>
        )}
      </div>

      <hr className="border-gray-100" />

      {/* Timeline & Alasan */}
      <div className="space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-900">Jangka Prioritas Kebutuhan</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TIMELINE_OPTIONS.map((opt) => (
              <label
                key={opt}
                className="relative flex cursor-pointer justify-center rounded-lg border border-gray-200 bg-white p-3 text-center transition-all hover:border-emerald-300 has-[:checked]:border-none has-[:checked]:bg-emerald-600 has-[:checked]:text-white"
              >
                <input type="radio" value={opt} {...register('priorityTimeline')} className="peer sr-only" />
                <span className="text-sm font-medium">{opt}</span>
              </label>
            ))}
          </div>
          {errors.priorityTimeline && (
            <p className="text-sm font-medium text-rose-600">{errors.priorityTimeline.message}</p>
          )}
        </div>

        <FormField label="Ceritakan Alasan Prioritas di Atas" error={errors.priorityReason?.message}>
          <textarea
            {...register('priorityReason')}
            rows={4}
            placeholder="Jelaskan dalam 1 paragraf singkat mengapa pilihan-pilihan di atas menjadi urgensi bagi sekolah ini."
            className={`w-full rounded-lg border bg-white px-4 py-3 text-base transition-colors focus:outline-none focus:ring-2 ${
              errors.priorityReason
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                : 'border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/10'
            }`}
          />
        </FormField>
      </div>

      {/* Upload Foto */}
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Camera size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Unggah 1–3 Foto Lapangan</h4>
            <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">
              Ruang belajar, bangunan luar, atau fasilitas utama yang ingin disorot.
            </p>
          </div>
          <div className="relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={assets.schoolPhotos.length >= 3}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <div
              className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-all active:scale-[0.98] ${
                assets.schoolPhotos.length >= 3
                  ? 'bg-gray-200 text-gray-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
              }`}
            >
              {assets.schoolPhotos.length >= 3 ? 'Batas Foto Tercapai' : 'Pilih Foto'}
            </div>
          </div>
        </div>

        {assets.schoolPhotos.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {assets.schoolPhotos.map((file, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-emerald-600">
                    <Paperclip size={16} />
                  </div>
                  <p className="truncate pr-8 text-sm font-medium text-gray-700">{file.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pesan validasi foto wajib */}
      {assets.schoolPhotos.length === 0 && (
        <p className="text-sm text-rose-600 font-medium flex items-center gap-2">
          <span>⚠</span> Wajib unggah minimal 1 foto sebelum mengirim laporan.
        </p>
      )}
    </div>
  );
}
