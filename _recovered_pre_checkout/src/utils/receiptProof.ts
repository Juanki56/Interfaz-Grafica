/** Utilidades para comprobantes guardados como URL http(s) o data URL (base64). */

export function normalizeReceiptUrl(url: string | null | undefined): string | null {
  const u = String(url || '').trim();
  return u || null;
}

export function receiptMimeFromDataUrl(url: string): string | null {
  if (!url.startsWith('data:')) return null;
  const m = /^data:([^;,]+)/i.exec(url);
  const mime = m?.[1]?.trim();
  return mime || null;
}

export function receiptMimeFromUrl(url: string, explicitMime?: string | null): string {
  const fromExplicit = String(explicitMime || '').trim();
  if (fromExplicit && fromExplicit !== 'application/octet-stream') {
    return fromExplicit;
  }
  const fromData = receiptMimeFromDataUrl(url);
  if (fromData) return fromData;
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.pdf')) return 'application/pdf';
  if (/\.(png|webp|gif)$/i.test(path)) {
    if (path.endsWith('.png')) return 'image/png';
    if (path.endsWith('.webp')) return 'image/webp';
    return 'image/gif';
  }
  if (/\.(jpg|jpeg)$/i.test(path)) return 'image/jpeg';
  return 'application/octet-stream';
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/');
}

export function isPdfMime(mime: string): boolean {
  return mime === 'application/pdf' || mime.toLowerCase().includes('pdf');
}

export function downloadReceiptFile(url: string, filename?: string | null) {
  const base = filename?.trim() || 'comprobante';
  let downloadName = base;

  if (url.startsWith('data:application/pdf')) {
    if (!downloadName.toLowerCase().endsWith('.pdf')) downloadName = `${downloadName}.pdf`;
  } else if (url.startsWith('data:image/png')) {
    if (!/\.(png|jpg|jpeg|webp)$/i.test(downloadName)) downloadName = `${downloadName}.png`;
  } else if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/jpg')) {
    if (!/\.(png|jpg|jpeg|webp)$/i.test(downloadName)) downloadName = `${downloadName}.jpg`;
  } else if (url.startsWith('data:image/webp')) {
    if (!/\.(png|jpg|jpeg|webp)$/i.test(downloadName)) downloadName = `${downloadName}.webp`;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = downloadName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
