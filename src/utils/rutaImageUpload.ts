export const RUTA_IMAGE_LIMITS = {
  maxGalleryFiles: 5,
  maxCoverFiles: 1,
  maxImageBytes: 5 * 1024 * 1024,
} as const;

export const RUTA_PORTADA_URL_RE = /\/principal\.(png|jpe?g|webp|gif|bmp)$/i;

export const isRutaPortadaUrl = (url: string) => RUTA_PORTADA_URL_RE.test(String(url || ''));

export const rutaGalleryFileKey = (file: File) =>
  `${file.name}|${file.size}|${file.lastModified}`;

export const validateRutaImageFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'Solo se permiten archivos de imagen.';
  }
  if (file.size > RUTA_IMAGE_LIMITS.maxImageBytes) {
    return 'Cada imagen debe pesar máximo 5 MB.';
  }
  return null;
};
