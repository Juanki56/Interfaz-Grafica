import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
function walk(d, a = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, a);
    else if (/\.tsx$/.test(f)) a.push(p);
  }
  return a;
}

let total = 0;
for (const file of walk(root)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const seen = new Set();
  const out = [];
  let removed = 0;
  for (const line of lines) {
    const m = line.match(/^\s*const\s+\[(\w+),/);
    if (m && seen.has(m[1])) {
      removed++;
      continue;
    }
    if (m) seen.add(m[1]);
    out.push(line);
  }
  if (removed) {
    fs.writeFileSync(file, out.join('\n'), 'utf8');
    total++;
    console.log(path.relative(root, file), removed);
  }
}
console.log('files:', total);
