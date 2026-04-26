import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Crop,
  GripVertical,
  ImagePlus,
  Star,
  UploadCloud,
  X,
} from 'lucide-react';
import { useRef, useState, type CSSProperties } from 'react';
import type { ImagePreviewItem } from '../../../lib/image-preview';
import { cn } from '../../../lib/utils';
import ImageCropper from './ImageCropper';

type ImageDropzoneProps = {
  label: string;
  description?: string;
  items: ImagePreviewItem[];
  onFilesAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  /** Callback saat item di-reorder — mengembalikan array lengkap dengan urutan baru */
  onReorder?: (items: ImagePreviewItem[]) => void;
  /** Callback saat alt text berubah */
  onAltTextChange?: (id: string, altText: string) => void;
  /** Callback saat gambar di-crop — mengembalikan id dan File baru hasil crop */
  onCropReplace?: (id: string, croppedFile: File) => void;
  disabled?: boolean;
  multiple?: boolean;
  emptyHint?: string;
};

// ─── Sortable thumbnail card ───────────────────────────────────────────

type SortableImageCardProps = {
  item: ImagePreviewItem;
  onRemove: (id: string) => void;
  onCropClick: (item: ImagePreviewItem) => void;
  onAltTextChange?: (id: string, altText: string) => void;
  isFirst: boolean;
};

function SortableImageCard({
  item,
  onRemove,
  onCropClick,
  onAltTextChange,
  isFirst,
}: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const [showAltInput, setShowAltInput] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow',
        isDragging
          ? 'border-emerald-300 shadow-lg shadow-emerald-100/40 ring-2 ring-emerald-200'
          : 'border-gray-200 hover:shadow-md',
        isFirst && 'ring-2 ring-emerald-400/50',
      )}
    >
      {/* Cover badge */}
      {isFirst && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          <Star size={10} className="fill-white" />
          Cover
        </div>
      )}

      {/* Drag handle */}
      <button
        type="button"
        className="absolute top-2 right-2 z-10 cursor-grab rounded-md bg-white/90 p-1 text-gray-400 shadow backdrop-blur-sm transition-colors hover:text-gray-700 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Geser untuk mengurutkan"
      >
        <GripVertical size={14} />
      </button>

      {/* Image preview */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-50">
        <img
          src={item.url}
          alt={item.altText || item.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Info + Actions */}
      <div className="flex flex-col gap-2 border-t border-gray-100 p-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-gray-700">
              {item.name}
            </p>
            <p className="text-[10px] text-gray-400">
              {item.kind === 'queued' ? 'Menunggu upload' : 'Terupload'}
              {item.originalSize
                ? ` · ${(item.originalSize / 1024).toFixed(0)}KB`
                : ''}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onCropClick(item)}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              title="Crop gambar"
            >
              <Crop size={13} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label={`Hapus ${item.name}`}
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Alt text toggle */}
        {onAltTextChange && (
          <>
            {showAltInput ? (
              <input
                type="text"
                value={item.altText || ''}
                onChange={(e) => onAltTextChange(item.id, e.target.value)}
                placeholder="Deskripsi foto (alt text)"
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-600 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowAltInput(true)}
                className="self-start text-[10px] font-medium text-gray-400 transition-colors hover:text-zinc-900"
              >
                + Tambah deskripsi
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ImageDropzone ─────────────────────────────────────────────────

export default function ImageDropzone({
  label,
  description,
  items,
  onFilesAdd,
  onRemove,
  onReorder,
  onAltTextChange,
  onCropReplace,
  disabled,
  multiple = true,
  emptyHint,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cropTarget, setCropTarget] = useState<ImagePreviewItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function pushFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList);
    // Simpan info ukuran asli ke setiap file
    onFilesAdd(files);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered);
  }

  function handleCropClick(item: ImagePreviewItem) {
    setCropTarget(item);
  }

  function handleCropDone(croppedFile: File) {
    if (!cropTarget || !onCropReplace) return;
    onCropReplace(cropTarget.id, croppedFile);
    setCropTarget(null);
  }

  return (
    <>
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {description ? (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          ) : null}
        </div>

        {/* Dropzone area */}
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
            'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-8 text-center transition-all',
            dragActive
              ? 'border-emerald-400 bg-zinc-100/50'
              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50',
            disabled && 'cursor-not-allowed opacity-60',
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <UploadCloud size={20} />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-700">
            Drop gambar di sini atau klik untuk browse
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {emptyHint ||
              'JPEG atau WEBP. Gambar otomatis dikompres saat upload.'}
          </p>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            pushFiles(event.target.files);
            // Reset input agar bisa select file yang sama lagi
            event.target.value = '';
          }}
        />

        {/* Image grid with drag-and-drop */}
        {items.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
              {items.length} gambar · Geser untuk mengurutkan · Posisi 1 =
              Cover
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((item) => item.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {items.map((item, index) => (
                    <SortableImageCard
                      key={item.id}
                      item={item}
                      onRemove={onRemove}
                      onCropClick={handleCropClick}
                      onAltTextChange={onAltTextChange}
                      isFirst={index === 0}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-500">
            <ImagePlus className="h-4 w-4" />
            <span>Belum ada gambar yang dipilih.</span>
          </div>
        )}
      </div>

      {/* Crop overlay */}
      {cropTarget ? (
        <ImageCropper
          imageSrc={cropTarget.url}
          fileName={cropTarget.name.replace(/\.[^.]+$/, '')}
          onCropDone={handleCropDone}
          onCancel={() => setCropTarget(null)}
        />
      ) : null}
    </>
  );
}
