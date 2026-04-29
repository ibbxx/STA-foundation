import { useFormContext } from 'react-hook-form';
import { FormField, TextInput, SelectInput } from './FormField';
import { SCHOOL_LEVEL_OPTIONS, SCHOOL_STATUS_OPTIONS, type ReportSchoolFormValues } from '../../lib/report-school';

export default function Step2School() {
  const { register, formState: { errors } } = useFormContext<ReportSchoolFormValues>();

  return (
    <div className="space-y-6">
      <FormField label="Nama Sekolah" error={errors.schoolName?.message}>
        <TextInput {...register('schoolName')} placeholder="Misal: SDN 01 Pesisir" />
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Jenjang Pendidikan" error={errors.schoolLevel?.message}>
          <SelectInput {...register('schoolLevel')}>
            <option value="">Pilih jenjang</option>
            {SCHOOL_LEVEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </SelectInput>
        </FormField>

        <FormField label="Status Sekolah" error={errors.schoolStatus?.message}>
          <SelectInput {...register('schoolStatus')}>
            <option value="">Pilih status</option>
            {SCHOOL_STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </SelectInput>
        </FormField>
      </div>

      <FormField label="Alamat Sekolah Lengkap" error={errors.schoolAddress?.message}>
        <textarea
          {...register('schoolAddress')}
          rows={3}
          placeholder="Tuliskan alamat lengkap beserta rute jika ada"
          className={`w-full rounded-lg border bg-white px-4 py-3 text-base transition-colors focus:outline-none focus:ring-2 ${
            errors.schoolAddress
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
              : 'border-gray-200 focus:border-emerald-600 focus:ring-emerald-600/10'
          }`}
        />
      </FormField>

      <FormField label="Link Google Maps (Opsional)" error={errors.schoolMapsUrl?.message}>
        <TextInput type="url" {...register('schoolMapsUrl')} placeholder="https://maps.app.goo.gl/..." />
      </FormField>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Jumlah Siswa" error={errors.studentCount?.message}>
          <TextInput type="number" {...register('studentCount')} placeholder="Total estimasi siswa" min={0} />
        </FormField>
        <FormField label="Jumlah Guru" error={errors.teacherCount?.message}>
          <TextInput type="number" {...register('teacherCount')} placeholder="Total guru aktif" min={0} />
        </FormField>
      </div>
    </div>
  );
}
