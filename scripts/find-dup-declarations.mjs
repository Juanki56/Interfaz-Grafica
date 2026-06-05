/** Lista const/function duplicados en archivos .tsx */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
function walk(d, a = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, a);
    else if (p.endsWith('.tsx') || p.endsWith('.ts')) a.push(p);
  }
  return a;
}

for (const file of walk(root)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const counts = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m =
      lines[i].match(/^\s*(?:export\s+)?function\s+(\w+)/) ||
      lines[i].match(/^\s*const\s+(\w+)\s*=/);
    if (m) {
      const n = m[1];
      if (!counts.has(n)) counts.set(n, []);
      counts.get(n).push(i + 1);
    }
  }
  for (const [name, locs] of counts) {
    if (locs.length > 1) {
      console.log(`${path.relative(root, file)}: ${name} @ ${locs.join(', ')}`);
    }
  }
}
