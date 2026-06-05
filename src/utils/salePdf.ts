import { jsPDF } from 'jspdf';

export interface SalePdfClient {
  name: string;
  document: string;
  phone: string;
  email: string;
}

export interface SalePdfPayment {
  id: string;
  amount: number;
  date: string;
  status: string;
  paymentMethod: string;
  transactionNumber?: string;
}

export interface SalePdfMainService {
  name: string;
  kind: 'route' | 'farm';
  detail1?: string;
  detail2?: string;
  price: number;
}

export interface SalePdfAdditionalService {
  name: string;
  description: string;
  price: number;
}

export interface SalePdfInput {
  id: string;
  backendId?: number;
  reservationId?: number;
  client: SalePdfClient;
  saleType: string;
  amount: number;
  paidAmount?: number;
  pendingAmount?: number;
  date: string;
  status: string;
  paymentMethod: string;
  mainService?: SalePdfMainService;
  additionalServices?: SalePdfAdditionalService[];
  paymentHistory?: SalePdfPayment[];
  cancellationDate?: string;
  cancellationReason?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDateEs(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value.includes('T') ? value : `${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

type PdfWriter = {
  doc: jsPDF;
  margin: number;
  maxW: number;
  y: number;
  ensureSpace: (needed?: number) => void;
  writeHeading: (text: string) => void;
  writeLabelValue: (label: string, value: string) => void;
  writeParagraph: (text: string) => void;
  writeBlank: (gap?: number) => void;
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
    y,
    ensureSpace,
    writeHeading(text: string) {
      ensureSpace(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(22, 101, 52);
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
      const valueLines = doc.splitTextToSize(value || '—', maxW - 52);
      if (valueLines.length === 1) {
        doc.text(valueLines[0], margin + 52, y);
        y += 6;
      } else {
        y += 6;
        writeLines(valueLines, 10, 52);
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
  };
}

/** Genera y descarga el PDF de una venta OCCITOUR. */
export function downloadSalePdf(sale: SalePdfInput): void {
  const doc = new jsPDF();
  const w = createPdfWriter(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(22, 101, 52);
  doc.text('OCCITOUR', w.margin, w.y);
  w.y += 8;

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Comprobante de venta', w.margin, w.y);
  w.y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, w.margin, w.y);
  w.y += 12;
  doc.setTextColor(0, 0, 0);

  w.writeLabelValue('ID venta', sale.id);
  if (sale.reservationId) {
    w.writeLabelValue('ID reserva', `#${sale.reservationId}`);
  }
  w.writeLabelValue('Fecha de venta', formatDateEs(sale.date));
  w.writeLabelValue('Estado', sale.status);
  w.writeBlank();

  w.writeHeading('Datos del cliente');
  w.writeLabelValue('Nombre', sale.client.name);
  w.writeLabelValue('Documento', sale.client.document);
  w.writeLabelValue('Teléfono', sale.client.phone);
  w.writeLabelValue('Correo', sale.client.email);
  w.writeBlank();

  w.writeHeading('Servicios adquiridos');
  w.writeLabelValue('Tipo', sale.saleType);
  if (sale.mainService) {
    const svc = sale.mainService;
    w.writeLabelValue(
      svc.kind === 'route' ? 'Ruta / servicio principal' : 'Finca reservada',
      svc.name,
    );
    if (svc.detail1) {
      w.writeLabelValue(svc.kind === 'route' ? 'Duración / salida' : 'Ubicación', svc.detail1);
    }
    if (svc.detail2) {
      w.writeLabelValue(svc.kind === 'route' ? 'Dificultad' : 'Capacidad', svc.detail2);
    }
    w.writeLabelValue('Precio base', formatCurrency(svc.price));
  }

  const extras = sale.additionalServices ?? [];
  if (extras.length > 0) {
    w.writeBlank(2);
    w.writeParagraph('Servicios adicionales:');
    for (const item of extras) {
      w.writeParagraph(`• ${item.name} — ${formatCurrency(item.price)}${item.description ? ` (${item.description})` : ''}`);
    }
  }
  w.writeBlank();

  w.writeHeading('Resumen económico');
  w.writeLabelValue('Monto total', formatCurrency(sale.amount));
  w.writeLabelValue('Monto pagado', formatCurrency(sale.paidAmount ?? 0));
  w.writeLabelValue('Saldo pendiente', formatCurrency(sale.pendingAmount ?? 0));
  w.writeLabelValue('Método de pago', sale.paymentMethod);
  w.writeBlank();

  const payments = sale.paymentHistory ?? [];
  if (payments.length > 0) {
    w.writeHeading('Historial de abonos');
    for (const payment of payments) {
      w.writeParagraph(
        `${payment.id} · ${formatDateEs(payment.date)} · ${formatCurrency(payment.amount)} · ${payment.status} · ${payment.paymentMethod}${
          payment.transactionNumber ? ` · Ref: ${payment.transactionNumber}` : ''
        }`,
      );
    }
    w.writeBlank();
  }

  if (sale.status === 'Anulado' || sale.cancellationDate || sale.cancellationReason) {
    w.writeHeading('Anulación');
    if (sale.cancellationDate) {
      w.writeLabelValue('Fecha', formatDateEs(sale.cancellationDate));
    }
    w.writeLabelValue('Motivo', sale.cancellationReason || '—');
  }

  w.writeBlank(6);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  w.ensureSpace(10);
  doc.text(
    'Documento generado por el sistema OCCITOUR. No sustituye factura electrónica salvo indicación expresa.',
    w.margin,
    w.y,
    { maxWidth: w.maxW },
  );

  const fileId = String(sale.backendId ?? sale.id).replace(/[^\w-]+/g, '-');
  doc.save(`venta-${fileId}.pdf`);
}

/** Adapta el objeto Sale del módulo de ventas al formato del PDF. */
export function saleToPdfInput(sale: {
  id: string;
  backendId?: number;
  reservationId?: number;
  client: SalePdfClient;
  saleType: string;
  amount: number;
  paidAmount?: number;
  pendingAmount?: number;
  date: string;
  status: string;
  paymentMethod: string;
  mainService?: {
    name: string;
    distance?: string;
    difficulty?: string;
    location?: string;
    capacity?: number;
    price: number;
  };
  additionalServices?: { id: string; name: string; description: string; price: number }[];
  paymentHistory?: SalePdfPayment[];
  cancellationDate?: string;
  cancellationReason?: string;
}): SalePdfInput {
  const ms = sale.mainService;
  let mainService: SalePdfMainService | undefined;
  if (ms) {
    const isRoute = 'distance' in ms && ms.distance !== undefined;
    mainService = {
      name: ms.name,
      kind: isRoute ? 'route' : 'farm',
      detail1: isRoute ? ms.distance : ms.location,
      detail2: isRoute ? ms.difficulty : ms.capacity != null ? `${ms.capacity} personas` : undefined,
      price: ms.price,
    };
  }

  return {
    id: sale.id,
    backendId: sale.backendId,
    reservationId: sale.reservationId,
    client: sale.client,
    saleType: sale.saleType,
    amount: sale.amount,
    paidAmount: sale.paidAmount,
    pendingAmount: sale.pendingAmount,
    date: sale.date,
    status: sale.status,
    paymentMethod: sale.paymentMethod,
    mainService,
    additionalServices: (sale.additionalServices ?? []).map((s) => ({
      name: s.name,
      description: s.description,
      price: s.price,
    })),
    paymentHistory: sale.paymentHistory,
    cancellationDate: sale.cancellationDate,
    cancellationReason: sale.cancellationReason,
  };
}
