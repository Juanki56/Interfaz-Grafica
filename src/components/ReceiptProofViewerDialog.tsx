import * as React from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import {
  downloadReceiptFile,
  isImageMime,
  isPdfMime,
  normalizeReceiptUrl,
  receiptMimeFromUrl,
} from '../utils/receiptProof';

export interface ReceiptProofViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** URL absoluta o data URL del comprobante */
  url: string | null | undefined;
  fileName?: string | null;
  mimeType?: string | null;
}

export function ReceiptProofViewerDialog({
  open,
  onOpenChange,
  url,
  fileName,
  mimeType,
}: ReceiptProofViewerDialogProps) {
  const normalized = normalizeReceiptUrl(url);
  const mime = normalized ? receiptMimeFromUrl(normalized, mimeType) : 'application/octet-stream';
  const showImage = normalized ? isImageMime(mime) : false;
  const showPdf = normalized ? isPdfMime(mime) : false;

  const openInNewTab = React.useCallback(() => {
    if (!normalized) {
      toast.error('No hay comprobante para abrir.');
      return;
    }
    const win = window.open(normalized, '_blank', 'noopener,noreferrer');
    if (!win) {
      toast.error('El navegador bloqueó la ventana emergente. Usa la vista previa o descarga.');
    }
  }, [normalized]);

  const handleDownload = React.useCallback(() => {
    if (!normalized) {
      toast.error('No hay comprobante para descargar.');
      return;
    }
    try {
      downloadReceiptFile(normalized, fileName);
    } catch {
      toast.error('No se pudo descargar. Prueba «Abrir en pestaña».');
    }
  }, [normalized, fileName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col gap-3 p-4 sm:p-6">
        <DialogHeader className="shrink-0 space-y-1 text-left">
          <DialogTitle>Comprobante del cliente</DialogTitle>
          <DialogDescription className="text-sm text-neutral-600">
            Vista previa del archivo enviado con el pago. Si no carga, usa abrir en pestaña o descargar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={openInNewTab} disabled={!normalized}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir en pestaña
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={!normalized}>
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </Button>
        </div>

        <div className="min-h-[320px] max-h-[70vh] flex-1 rounded-lg border border-neutral-200 bg-neutral-50 overflow-auto">
          {!normalized ? (
            <p className="p-6 text-sm text-neutral-600 text-center">No hay comprobante adjunto.</p>
          ) : showImage ? (
            <div className="flex items-center justify-center p-4 min-h-[320px]">
              <img
                src={normalized}
                alt="Comprobante de pago"
                className="max-w-full max-h-[65vh] w-auto h-auto object-contain"
              />
            </div>
          ) : showPdf ? (
            <iframe title="Comprobante PDF" src={normalized} className="w-full min-h-[65vh] border-0 bg-white" />
          ) : (
            <div className="flex flex-col gap-3 p-4">
              <p className="text-sm text-neutral-600">
                No hay vista previa para este tipo de archivo. Usa los botones de arriba.
              </p>
              <iframe title="Comprobante" src={normalized} className="w-full min-h-[50vh] border-0 bg-white" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
