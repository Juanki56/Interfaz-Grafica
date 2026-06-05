/**
 * Migra formateo de precios a utils/currencyDisplay.ts (COP, es-CO).
 * Ejecutar: node scripts/migrate-currency-cop.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../src');

const IMPORT_LINE = "import { formatCurrencyCOP as formatCurrency } from '../utils/currencyDisplay';";
const IMPORT_LINE_UTILS = "import { formatCurrencyCOP as formatCurrency } from './currencyDisplay';";

const SKIP = new Set([
  path.join(SRC, 'utils', 'currencyDisplay.ts'),
  path.join(SRC, 'components', 'ui', 'chart.tsx'),
  path.join(SRC, 'temp_sales_case.txt'),
]);

const LOCAL_FORMAT_PATTERNS = [
  /const formatCop = \(value\?: number\) =>\s*\n\s*`?\$\$\{Number\(value \|\| 0\)\.toLocaleString\('es-CO'[^`]*\}`?;?\s*\n/g,
  /const formatCurrency = \(value\?: number \| string \| null\) =>\s*\n\s*`?\$\$\{Number\(value \|\| 0\)\.toLocaleString\('es-CO'[^`]*\}`?;?\s*\n/g,
  /function formatCurrency\(value\?: number \| string \| null\): string \{\s*\n\s*const numeric = Number\(value\);\s*\n\s*if \(!Number\.isFinite\(numeric\)\) return '—';\s*\n\s*return new Intl\.NumberFormat\('es-CO'[^}]+\}\.format\(numeric\);\s*\n\}/g,
  /function formatCurrency\(value: number\): string \{\s*\n\s*return `\$\$\{Number\(value \|\| 0\)\.toLocaleString\('es-CO'\)\}`;\s*\n\}/g,
  /function formatCurrency\(amount: number\) \{\s*\n\s*return new Intl\.NumberFormat\('es-CO', \{\s*\n\s*style: 'currency',\s*\n\s*currency: 'COP',\s*\n\s*minimumFractionDigits: 0,\s*\n\s*\}\)\.format\(amount\);\s*\n\}/g,
  /function formatCurrency\(value\?: number \| string \| null\) \{\s*\n\s*const amount = Number\(value\);\s*\n\s*if \(!Number\.isFinite\(amount\)\) return '—';\s*\n\s*return new Intl\.NumberFormat\('es-CO', \{ style: 'currency', currency: 'COP'[^}]+\}\)\.format\(amount\);\s*\n\}/g,
  /const formatCurrency = \(value\?: number \| string \| null\) =>\s*\n\s*`\$\$\{Number\(value \|\| 0\)\.toLocaleString\('es-CO'\)\}`;\s*\n/g,
  /const formatCurrency = \(amount: number\) => \{\s*\n\s*return new Intl\.NumberFormat\('es-CO', \{\s*\n\s*style: 'currency',\s*\n\s*currency: 'COP',\s*\n\s*minimumFractionDigits: 0,\s*\n\s*\}\)\.format\(amount\);\s*\n\s*\};/g,
  /const formatCurrency = \(amount: number \| null \| undefined\) => \{\s*\n\s*if \(amount == null \|\| !Number\.isFinite\(Number\(amount\)\)\) return '—';\s*\n\s*return new Intl\.NumberFormat\('es-CO',[^}]+\}\)\.format\(Number\(amount\)\);\s*\n\s*\};/g,
  /const formatCurrency = \(value\?: number \| string \| null\) => \{\s*\n\s*const numeric = Number\(value\);\s*\n\s*if \(!Number\.isFinite\(numeric\)\) return '—';\s*\n\s*return new Intl\.NumberFormat\('es-CO', \{ style: 'currency', currency: 'COP', maximumFractionDigits: 0 \}\)\.format\(numeric\);\s*\n\s*\};/g,
  /const formatCurrency = \(amount: number\) => new Intl\.NumberFormat\('es-CO', \{\s*\n\s*style: 'currency', currency: 'COP', minimumFractionDigits: 0,\s*\n\s*\}\)\.format\(amount\);/g,
  /const formatCurrency = \(value\?: number \| string \| null\) => \{\s*\n\s*const numeric = Number\(value\);\s*\n\s*if \(!Number\.isFinite\(numeric\)\) return '—';\s*\n\s*return `\$\$\{numeric\.toLocaleString\(\)\}`;\s*\n\s*\};/g,
  /function formatCurrency\(value\?: number \| string \| null\): string \{\s*\n\s*const amount = Number\(value\);\s*\n\s*if \(!Number\.isFinite\(amount\)\) return '—';\s*\n\s*return `\$\$\{amount\.toLocaleString\('es-CO'\)\}`;\s*\n\}/g,
  /return `\$\$\{Math\.round\(Number\(value \|\| 0\)\)\.toLocaleString\('es-CO'\)\}`;/g,
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function relativeImport(file) {
  const dir = path.dirname(file);
  const rel = path.relative(dir, path.join(SRC, 'utils', 'currencyDisplay.ts')).replace(/\\/g, '/');
  const withoutExt = rel.replace(/\.ts$/, '');
  return `import { formatCurrencyCOP as formatCurrency } from '${withoutExt.startsWith('.') ? withoutExt : './' + withoutExt}';`;
}

function ensureImport(content, file) {
  if (content.includes('currencyDisplay')) return content;
  if (!content.includes('formatCurrency')) return content;

  const importLine = file.includes(path.join('utils', path.sep)) ? IMPORT_LINE_UTILS : relativeImport(file);
  const lastImport = content.lastIndexOf('\nimport ');
  if (lastImport === -1) return importLine + '\n' + content;
  const end = content.indexOf('\n', lastImport + 1);
  const insertAt = end === -1 ? content.length : end + 1;
  return content.slice(0, insertAt) + importLine + '\n' + content.slice(insertAt);
}

function migrateContent(content, file) {
  let next = content;
  for (const re of LOCAL_FORMAT_PATTERNS) {
    next = next.replace(re, '');
  }

  // Common inline price patterns -> formatCurrency(...)
  const replacements = [
    [/\$\$\{Number\(([^)]+)\)\.toLocaleString\('es-CO'\)\}/g, '{formatCurrency($1)}'],
    [/\$\$\{Number\(([^)]+)\)\.toLocaleString\("es-CO"\)\}/g, '{formatCurrency($1)}'],
    [/\$\$\{Number\(([^)]+)\)\.toLocaleString\('es-CO', \{ maximumFractionDigits: 0 \}\)\}/g, '{formatCurrency($1)}'],
    [/\$\$\{([^}?]+)\.toLocaleString\('es-CO'\)\}/g, '{formatCurrency($1)}'],
    [/\$\$\{([^}?]+)\.toLocaleString\("es-CO"\)\}/g, '{formatCurrency($1)}'],
    [/\$\$\{([^}?]+)\.toLocaleString\(\)\}/g, '{formatCurrency($1)}'],
    [/\$\$\{parseInt\(([^)]+)\)\.toLocaleString\(\)\}/g, '{formatCurrency(parseInt($1, 10))}'],
    [/\$\$\{Math\.round\(Number\(([^)]+)\)\)\.toLocaleString\('es-CO'\)\}/g, '{formatCurrency($1)}'],
    [/\{amount\.toLocaleString\('es-CO'\)\} COP/g, '{formatCurrency(amount)}'],
    [/\{unitPrice\.toLocaleString\('es-CO'\)\} COP/g, '{formatCurrency(unitPrice)}'],
    [/\{estimatedTotal\.toLocaleString\('es-CO'\)\} COP/g, '{formatCurrency(estimatedTotal)}'],
    [/\$\{service\.price\.toLocaleString\('es-CO'\)\}/g, '{formatCurrency(service.price)}'],
    [/\$\{Number\(item\.servicio\.precio\)\.toLocaleString\('es-CO'\)\}/g, '{formatCurrency(item.servicio.precio)}'],
    [/\$\{Number\(item\.servicio\.precio\)\.toLocaleString\("es-CO"\)\}/g, '{formatCurrency(item.servicio.precio)}'],
    [/\$\{Number\(service\.precio\)\.toLocaleString\("es-CO"\)\}/g, '{formatCurrency(service.precio)}'],
    [/\$\{Number\(service\.precio\)\.toLocaleString\('es-CO'\)\}/g, '{formatCurrency(service.precio)}'],
    [/\$\{service\.price\.toLocaleString\(\)\}/g, '{formatCurrency(service.price)}'],
    [/\$\{([^}?]+)\.toLocaleString\(\)\}/g, '{formatCurrency($1)}'],
    [/\$\{formatCurrency\(([^)]+)\)\}/g, '{formatCurrency($1)}'], // fix double if any
  ];

  for (const [re, rep] of replacements) {
    next = next.replace(re, rep);
  }

  const usesFormat =
    next.includes('formatCurrency(') ||
    next.includes('{formatCurrency') ||
    (next.includes('formatCurrency') && !next.includes('currencyDisplay'));

  if (usesFormat && !next.includes('currencyDisplay')) {
    next = ensureImport(next, file);
  }

  return next;
}

const files = walk(SRC);
let changed = 0;
for (const file of files) {
  if (SKIP.has(file)) continue;
  const before = fs.readFileSync(file, 'utf8');
  const after = migrateContent(before, file);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed++;
    console.log('updated:', path.relative(SRC, file));
  }
}

console.log(`Done. ${changed} files updated.`);
