/**
 * Copia _recovered_pre_checkout → src/ y scripts/, luego dedupe imports.
 * Uso: node scripts/apply-recovery.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const REC = path.join(ROOT, '_recovered_pre_checkout');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      n += copyDir(s, d);
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
      n++;
    }
  }
  return n;
}

if (!fs.existsSync(REC)) {
  console.error('Ejecuta primero: node scripts/recover-from-transcript.mjs');
  process.exit(1);
}

const srcFrom = path.join(REC, 'src');
const scriptsFrom = path.join(REC, 'scripts');
let count = 0;
if (fs.existsSync(srcFrom)) count += copyDir(srcFrom, path.join(ROOT, 'src'));
if (fs.existsSync(scriptsFrom)) count += copyDir(scriptsFrom, path.join(ROOT, 'scripts'));
console.log(`Copiados ${count} archivos desde recuperación.`);

execSync('node scripts/dedupe-import-lines.mjs', { cwd: ROOT, stdio: 'inherit' });
