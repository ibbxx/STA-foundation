import { ImagePlus, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { cn } from '../../../lib/utils';

export type ImagePreviewItem = {
  id: string;
  url: string;
  name: string;
  kind: 'existing' | 'queued';
  file?: File;
};

type ImageDropzoneProps = {
  label: string;
  description?: string;
  items: ImagePreviewItem[];
  onFilesAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  multiple?: boolean;
  emptyHint?: string;
};

export default function ImageDropzone({
  label,
  description,
  items,
  onFilesAdd,
  onRemove,
  disabled,
  multiple = true,
  emptyHint,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function pushFiles(fileList: FileList | null) {
    if (!fileList) return;
    onFilesAdd(Array.from(fileList));
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description ? <p className="mt-1 text-xs text-gray-500">{description}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          if (disabled) return;
          pushFiles(event.dataTransfer.files);
        }}
        className={cn(
          'flex w-full flex-col items-center justify-center rounded-lg border border-dashed px-5 py-8 text-center transition-colors',
          dragActive ? 'border-gray-400 bg-gray-50' : 'border-gray-300 bg-white hover:bg-gray-50',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <UploadCloud className="mb-3 h-5 w-5 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">Drop images here or click to browse</p>
        <p className="mt-1 text-xs text-gray-500">{emptyHint || 'PNG, JPG, atau WEBP. Anda bisa memilih lebih dari satu file.'}</p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(event) => pushFiles(event.target.files)}
      />

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-md border border-gray-200 bg-gray-50">
              <img src={item.url} alt={item.name} className="h-24 w-full object-cover" />
              <div className="flex items-center justify-between border-t border-gray-200 px-2.5 py-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-gray-600">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.kind === 'queued' ? 'Queued' : 'Uploaded'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
                  aria-label={`Remove ${item.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-500">
          <ImagePlus className="h-4 w-4" />
          <span>Belum ada gambar yang dipilih.</span>
        </div>
      )}
    </div>
  );
}
