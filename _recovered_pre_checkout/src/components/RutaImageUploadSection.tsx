import { useRef } from 'react';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  RUTA_IMAGE_LIMITS,
  rutaGalleryFileKey,
} from '../utils/rutaImageUpload';

type RutaImageUploadSectionProps = {
  coverFile: File | null;
  onCoverChange: (file: File | null) => void;
  galleryFiles: File[];
  onGalleryFilesChange: (files: File[]) => void;
  existingCoverUrl?: string | null;
  existingGalleryUrls?: string[];
  showExistingGallery?: boolean;
  disabled?: boolean;
  idPrefix?: string;
};

export function RutaImageUploadSection({
  coverFile,
  onCoverChange,
  galleryFiles,
  onGalleryFilesChange,
  existingCoverUrl = null,
  existingGalleryUrls = [],
  showExistingGallery = false,
  disabled = false,
  idPrefix = 'ruta',
}: RutaImageUploadSectionProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    const seen = new Set(galleryFiles.map(rutaGalleryFileKey));
    const merged = [...galleryFiles];

    for (const file of picked) {
      const key = rutaGalleryFileKey(file);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(file);
    }

    if (merged.length > RUTA_IMAGE_LIMITS.maxGalleryFiles) {
      toast.error(
        `Máximo ${RUTA_IMAGE_LIMITS.maxGalleryFiles} fotos nuevas en la galería por guardado.`,
      );
      onGalleryFilesChange(merged.slice(0, RUTA_IMAGE_LIMITS.maxGalleryFiles));
    } else {
      onGalleryFilesChange(merged);
    }

    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const removePendingGalleryFile = (index: number) => {
    onGalleryFilesChange(galleryFiles.filter((_, i) => i !== index));
  };

  const portadaPreview = coverFile
    ? URL.createObjectURL(coverFile)
    : existingCoverUrl || null;

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-800">Imágenes (Supabase Storage)</p>

      <div>
        <Label htmlFor={`${idPrefix}_portada`}>Portada (tarjeta y listados)</Label>
        <Input
          id={`${idPrefix}_portada`}
          type="file"
          accept="image/*"
          onChange={(e) => onCoverChange(e.target.files?.[0] ?? null)}
          disabled={disabled}
        />
        <p className="text-xs text-gray-500 mt-1">
          1 imagen, máx. 5 MB. Se guarda como principal en Storage.
        </p>
        {portadaPreview && (
          <div className="mt-2 flex items-center gap-3">
            <img
              src={portadaPreview}
              alt="Vista previa portada"
              className="h-20 w-28 rounded-md object-cover border"
            />
            <span className="text-xs text-gray-500">
              {coverFile ? 'Nueva portada (se subirá al guardar)' : 'Portada actual'}
            </span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor={`${idPrefix}_galeria`}>Galería (página de detalle)</Label>
        <Input
          ref={galleryInputRef}
          id={`${idPrefix}_galeria`}
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryFilesChange}
          disabled={disabled}
        />
        <p className="text-xs text-gray-500 mt-1">
          Hasta {RUTA_IMAGE_LIMITS.maxGalleryFiles} fotos nuevas por guardado, 5 MB c/u. Puedes elegir
          varias a la vez o volver a «Elegir archivos» para sumar más antes de guardar.
        </p>
        {showExistingGallery && existingGalleryUrls.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {existingGalleryUrls.length} foto(s) ya en Storage
            {galleryFiles.length > 0 ? ` · +${galleryFiles.length} nueva(s) pendiente(s)` : ''}.
          </p>
        )}
        {!showExistingGallery && galleryFiles.length > 0 && (
          <p className="text-xs text-emerald-700 mt-1">
            {galleryFiles.length} foto(s) lista(s) para subir al guardar.
          </p>
        )}
        {(galleryFiles.length > 0 || (showExistingGallery && existingGalleryUrls.length > 0)) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {showExistingGallery &&
              existingGalleryUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="Galería actual"
                  className="h-16 w-16 rounded-md object-cover border"
                  title="Ya guardada en Storage"
                />
              ))}
            {galleryFiles.map((file, idx) => (
              <div key={rutaGalleryFileKey(file)} className="relative">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-16 w-16 rounded-md object-cover border"
                />
                <button
                  type="button"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 text-white text-xs leading-none"
                  onClick={() => removePendingGalleryFile(idx)}
                  disabled={disabled}
                  aria-label={`Quitar ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
