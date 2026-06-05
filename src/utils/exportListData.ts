import * as XLSX from 'xlsx';

export type ExportColumn<T> = {
  header: string;
  getValue: (row: T) => string | number | boolean | null | undefined;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(blob: Blob, filename: string): void {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(href);
  }, 1000);
}

function normalizeFilename(base: string, extension: string): string {
  const safeBase = String(base || 'export')
    .trim()
    .replace(/[^\w\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'export';
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return safeBase.toLowerCase().endsWith(ext) ? safeBase : `${safeBase}${ext}`;
}

export function buildExportFilename(prefix: string, extension: 'csv' | 'xlsx'): string {
  const date = new Date().toISOString().slice(0, 10);
  return normalizeFilename(`${prefix}_${date}`, extension);
}

export function exportToCsv<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  const separator = ';';
  const headerLine = columns.map((col) => escapeCsvCell(col.header)).join(separator);
  const dataLines = rows.map((row) =>
    columns
      .map((col) => escapeCsvCell(String(col.getValue(row) ?? '')))
      .join(separator),
  );
  const content = `\uFEFF${[headerLine, ...dataLines].join('\r\n')}`;
  downloadBlob(
    new Blob([content], { type: 'text/csv;charset=utf-8;' }),
    normalizeFilename(filename, 'csv'),
  );
}

export function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = 'Datos',
): void {
  const sheetData: Array<Array<string | number | boolean>> = [
    columns.map((col) => col.header),
    ...rows.map((row) =>
      columns.map((col) => {
        const value = col.getValue(row);
        if (value === null || value === undefined) return '';
        return value;
      }),
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    normalizeFilename(filename, 'xlsx'),
  );
}
