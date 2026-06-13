import { jsPDF } from 'jspdf';

// ─── Tipos de entrada ──────────────────────────────────────────────────────────

export interface AbonoPdfClient {
  name: string;
  document: string;
  phone: string;
  email: string;
}

export interface AbonoPdfReservation {
  id: string;
  serviceType: string;
  serviceName: string;
  totalAmount: number;
  paidAmount: number;
  pendingBalance: number;
  date: string;
}

export interface AbonoPdfInput {
  /** ID visual del abono, p. ej. "A-005" */
  id: string;
  backendId: number;
  client: AbonoPdfClient;
  reservation: AbonoPdfReservation;
  amount: number;
  date: string;
  status: string;
  paymentMethod: string;
  transactionNumber?: string;
  observations?: string;
  rejectionReason?: string;
  verificationDate?: string;
  verifiedBy?: string;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function fmtDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value.includes('T') ? value : `${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ─── PdfWriter (mismo patrón que salePdf.ts) ──────────────────────────────────

type PdfWriter = {
  doc: jsPDF;
  margin: number;
  maxW: number;
  getY: () => number;
  setY: (v: number) => void;
  addY: (v: number) => void;
  ensureSpace: (needed?: number) => void;
  writeHeading: (text: string) => void;
  writeLabelValue: (label: string, value: string) => void;
  writeParagraph: (text: string) => void;
  writeBlank: (gap?: number) => void;
  writeDivider: () => void;
};

function createPdfWriter(doc: jsPDF): PdfWriter {
  const margin = 14;
  const maxW = doc.internal.pageSize.getWidth() - margin * 2;
  let y = 18;

  const ensureSpace = (needed = 8) => {
    if (y + needed > 285) {
      doc.addPage();
      y = 18;
    }
  };

  const writeLines = (lines: string[], fontSize = 10, indent = 0) => {
    doc.setFontSize(fontSize);
    for (const line of lines) {
      ensureSpace(7);
      doc.text(line, margin + indent, y);
      y += 6;
    }
  };

  return {
    doc,
    margin,
    maxW,
    getY: () => y,
    setY: (v: number) => { y = v; },
    addY: (v: number) => { y += v; },
    ensureSpace,
    writeHeading(text: string) {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(22, 101, 52); // Verde OCCITOURS
      writeLines(doc.splitTextToSize(text, maxW), 12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      y += 2;
    },
    writeLabelValue(label: string, value: string) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      ensureSpace(7);
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(value || '—', maxW - 60);
      if (valueLines.length === 1) {
        doc.text(valueLines[0], margin + 60, y);
        y += 6;
      } else {
        doc.text(valueLines[0], margin + 60, y);
        y += 6;
        writeLines(valueLines.slice(1), 10, 60);
      }
    },
    writeParagraph(text: string) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      writeLines(doc.splitTextToSize(text || '—', maxW), 10);
    },
    writeBlank(gap = 4) {
      y += gap;
    },
    writeDivider() {
      ensureSpace(6);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, margin + maxW, y);
      y += 5;
    },
  };
}

// ─── Función pública principal ────────────────────────────────────────────────

/**
 * Genera y descarga el PDF de comprobante de abono de OCCITOURS.
 * Compatible con clientes (sin datos internos de verificación) y administradores.
 */
export async function downloadAbonoPdf(
  abono: AbonoPdfInput,
  options?: { forClient?: boolean },
): Promise<void> {
  const doc = new jsPDF();
  const w = createPdfWriter(doc);
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Encabezado con logo ────────────────────────────────────────────────────
  try {
    const imgData = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        } else {
          reject(new Error('No canvas context'));
        }
      };
      img.onerror = reject;
      img.src = '/logo.jpg';
    });

    doc.addImage(imgData, 'JPEG', w.margin, w.getY(), 25, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(22, 101, 52);
    doc.text('OCCITOURS', w.margin + 30, w.getY() + 10);

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('Comprobante de Abono', w.margin + 30, w.getY() + 18);

    w.addY(32);
  } catch {
    // Fallback si el logo no carga
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(22, 101, 52);
    doc.text('OCCITOURS', w.margin, w.getY() + 4);
    w.addY(12);

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('Comprobante de Abono', w.margin, w.getY());
    w.addY(10);
  }

  // Línea separadora bajo el encabezado
  doc.setDrawColor(22, 101, 52);
  doc.setLineWidth(0.8);
  doc.line(w.margin, w.getY(), w.margin + w.maxW, w.getY());
  w.addY(6);

  // Fecha de generación
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, w.margin, w.getY());
  doc.text(`ID Abono: ${abono.id}`, pageWidth - w.margin, w.getY(), { align: 'right' });
  w.addY(10);
  doc.setTextColor(0, 0, 0);

  // ── Sección 1: Datos del cliente ───────────────────────────────────────────
  w.writeHeading('Datos del Cliente');
  w.writeLabelValue('Nombre completo', abono.client.name);
  w.writeLabelValue('Documento', abono.client.document);
  w.writeLabelValue('Teléfono', abono.client.phone);
  w.writeLabelValue('Correo electrónico', abono.client.email);
  w.writeBlank(4);
  w.writeDivider();

  // ── Sección 2: Información del abono ──────────────────────────────────────
  w.writeHeading('Información del Abono');
  w.writeLabelValue('ID del abono', abono.id);
  w.writeLabelValue('Fecha del abono', fmtDate(abono.date));
  w.writeLabelValue('Monto abonado', fmtCurrency(abono.amount));
  w.writeLabelValue('Método de pago', abono.paymentMethod);
  if (abono.transactionNumber) {
    w.writeLabelValue('N.° de transacción', abono.transactionNumber);
  }
  w.writeLabelValue('Estado', abono.status);

  if (!options?.forClient) {
    // Campos internos solo visibles para administradores/asesores
    if (abono.observations) {
      w.writeLabelValue('Observaciones', abono.observations);
    }
    if (abono.verificationDate) {
      w.writeLabelValue('Fecha de verificación', fmtDate(abono.verificationDate));
    }
    if (abono.verifiedBy) {
      w.writeLabelValue('Verificado por', abono.verifiedBy);
    }
    if (abono.rejectionReason) {
      doc.setTextColor(180, 0, 0);
      w.writeLabelValue('Motivo de rechazo', abono.rejectionReason);
      doc.setTextColor(0, 0, 0);
    }
  }

  w.writeBlank(4);
  w.writeDivider();

  // ── Sección 3: Servicio/Reserva asociada ─────────────────────────────────
  w.writeHeading('Servicio Asociado');
  w.writeLabelValue('ID de reserva', abono.reservation.id);
  w.writeLabelValue('Tipo de servicio', abono.reservation.serviceType);
  w.writeLabelValue('Nombre del servicio', abono.reservation.serviceName);
  w.writeLabelValue('Fecha del servicio', fmtDate(abono.reservation.date));
  w.writeBlank(4);
  w.writeDivider();

  // ── Sección 4: Resumen financiero ─────────────────────────────────────────
  w.writeHeading('Resumen Financiero');
  w.writeLabelValue('Valor total del servicio', fmtCurrency(abono.reservation.totalAmount));
  w.writeLabelValue('Total pagado', fmtCurrency(abono.reservation.paidAmount));
  w.writeLabelValue('Saldo pendiente', fmtCurrency(abono.reservation.pendingBalance));
  w.writeBlank(4);

  // Caja de saldo pendiente destacada
  const isFullyPaid = abono.reservation.pendingBalance <= 0;
  w.ensureSpace(20);
  const boxY = w.getY();
  const boxH = 14;
  if (isFullyPaid) {
    doc.setFillColor(220, 252, 231); // Verde claro
    doc.setDrawColor(22, 101, 52);
  } else {
    doc.setFillColor(255, 251, 235); // Amarillo claro
    doc.setDrawColor(180, 120, 0);
  }
  doc.setLineWidth(0.5);
  doc.roundedRect(w.margin, boxY, w.maxW, boxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(isFullyPaid ? 22 : 100, isFullyPaid ? 101 : 60, isFullyPaid ? 52 : 0);
  doc.text(
    isFullyPaid
      ? '✓  El servicio está completamente pagado'
      : `Saldo pendiente: ${fmtCurrency(abono.reservation.pendingBalance)}`,
    w.margin + 4,
    boxY + 9,
  );
  doc.setTextColor(0, 0, 0);
  w.addY(boxH + 8);

  // ── Pie de página ─────────────────────────────────────────────────────────
  w.writeBlank(6);
  w.ensureSpace(14);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(w.margin, w.getY(), w.margin + w.maxW, w.getY());
  w.addY(5);
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Documento generado por el sistema OCCITOURS. No sustituye factura electrónica salvo indicación expresa.',
    w.margin,
    w.getY(),
    { maxWidth: w.maxW },
  );

  // ── Guardar ───────────────────────────────────────────────────────────────
  const fileId = String(abono.backendId ?? abono.id).replace(/[^\w-]+/g, '-');
  const prefix = options?.forClient ? 'abono-cliente' : 'abono';
  doc.save(`${prefix}-${fileId}.pdf`);
}
