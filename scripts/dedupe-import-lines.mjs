/** Elimina líneas import duplicadas idénticas consecutivas y globales en un archivo. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src');

function walk(d, a = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, a);
    else if (/\.(tsx?|jsx?)$/.test(f)) a.push(p);
  }
  return a;
}

let fixed = 0;
for (const file of walk(ROOT)) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const seen = new Set();
  const out = [];
  let changed = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^import\s+/.test(t) && /from\s+['"]/.test(t)) {
      if (seen.has(t)) {
        changed = true;
        continue;
      }
      seen.add(t);
    }
    out.push(line);
  }
  if (changed) {
    fs.writeFileSync(file, out.join('\n'), 'utf8');
    fixed++;
  }
}
console.log(`dedupe-import-lines: ${fixed} archivos corregidos`);
