import { Check, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { getCroppedImageFile, type CropArea } from '../../../lib/crop-utils';
import { logError } from '../../../lib/error-logger';
import { cn } from '../../../lib/utils';

export type AspectOption = {
  label: string;
  value: number;
};

const ASPECT_OPTIONS: AspectOption[] = [
  { label: 'Banner Website (16:9)', value: 16 / 9 },
  { label: 'Bebas', value: 0 },
  { label: 'Standar Foto (3:2)', value: 1.5 },
  { label: 'Klasik (4:3)', value: 4 / 3 },
  { label: 'Persegi (1:1)', value: 1 },
];

type ImageCropperProps = {
  /** URL gambar yang akan di-crop (objectURL atau remote URL) */
  imageSrc: string;
  /** Callback saat user klik "Terapkan" — mengembalikan File hasil crop */
  onCropDone: (croppedFile: File) => void;
  /** Callback saat user batal crop */
  onCancel: () => void;
  /** Nama file output (opsional) */
  fileName?: string;
};

export default function ImageCropper({
  imageSrc,
  onCropDone,
  onCancel,
  fileName = 'cropped',
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedAspect, setSelectedAspect] = useState<number>(16 / 9); // Default to Banner Website
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleApply() {
    if (!croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName);
      onCropDone(file);
    } catch (err) {
      logError('ImageCropper.handleApply', err, {
        fileName,
        cropArea: croppedAreaPixels,
      });
    } finally {
      setIsCropping(false);
    }
  }

  function handleReset() {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  // Aspect = 0 berarti "Bebas" (free-form)
  const aspectProp = selectedAspect === 0 ? undefined : selectedAspect;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-100">Crop & Atur Posisi</h3>
            {croppedAreaPixels && (
              <span className="rounded-md bg-gray-800 px-2 py-0.5 text-[10px] font-mono text-gray-400">
                {Math.round(croppedAreaPixels.width)} × {Math.round(croppedAreaPixels.height)} px
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-[380px] w-full bg-gray-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectProp}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: '2px solid rgba(255,255,255,0.6)',
                borderRadius: '8px',
              },
            }}
          />
          {/* Safe Zone Hint for Freeform */}
          {selectedAspect === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
              <div className="aspect-video w-3/4 border border-dashed border-white/50" />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded bg-black/50 px-2 py-1 text-[10px] text-white">
                Panduan Safe Zone (16:9)
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 border-t border-gray-700/60 px-5 py-4">
          {/* Aspect Ratio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Rasio
              </p>
              {selectedAspect === 16/9 && (
                <p className="text-[10px] font-medium text-white">
                  Cocok untuk banner utama
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ASPECT_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSelectedAspect(opt.value)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    selectedAspect === opt.value
                      ? opt.value === 16/9
                        ? 'bg-zinc-900 text-white ring-2 ring-zinc-900/20'
                        : opt.value === 0
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-700 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom + Reset */}
          <div className="flex items-center gap-3">
            <ZoomOut size={14} className="text-gray-500" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full flex-1 cursor-pointer appearance-none rounded-full bg-gray-700 accent-emerald-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-950"
            />
            <ZoomIn size={14} className="text-gray-500" />
            <button
              type="button"
              onClick={handleReset}
              className="ml-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
              title="Reset posisi & zoom"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-700/60 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-800 px-4 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
          >
            <X size={13} />
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isCropping || !croppedAreaPixels}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-900/30 transition-colors hover:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check size={13} />
            {isCropping ? 'Memproses...' : 'Terapkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
