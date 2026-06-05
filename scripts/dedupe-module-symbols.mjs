/**
 * Elimina declaraciones duplicadas a nivel de módulo (function/const) antes del primer export default function.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const targets = process.argv.slice(2);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(d, a = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, a);
    else if (p.endsWith('.tsx')) a.push(p);
  }
  return a;
}

const files = targets.length ? targets.map((t) => path.resolve(t)) : walk(path.join(root, 'components'));

function dedupeFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const exportIdx = content.search(/^export default function/m);
  const splitAt = exportIdx >= 0 ? exportIdx : content.length;
  const head = content.slice(0, splitAt);
  const tail = content.slice(splitAt);
  const lines = head.split('\n');

  const declarations = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    let name = null;
    if (/^(export )?function \w+/.test(line)) {
      name = line.match(/^(?:export )?function (\w+)/)[1];
    } else if (/^const \w+/.test(line)) {
      name = line.match(/^const (\w+)/)[1];
    }
    if (name) {
      let depth = 0;
      let started = false;
      let end = i;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') {
            depth++;
            started = true;
          } else if (ch === '}') depth--;
        }
        end = j;
        if (started && depth === 0) break;
        if (!started && j > i && /^(\s*$|import |export |\/\/|\/\*)/.test(lines[j]) === false && !/^const |^function /.test(lines[j])) {
          // single-line const without braces
          if (/^const \w+.*=.*;?\s*$/.test(lines[j]) && j === i) {
            end = j;
            break;
          }
        }
      }
      // single line const arrow without braces on same line
      if (line.includes('=>') && line.trim().endsWith(';')) end = i;
      declarations.push({ name, start: i, end });
      i = end + 1;
      continue;
    }
    i++;
  }

  const seen = new Set();
  const skipRanges = new Set();
  for (const d of declarations) {
    if (seen.has(d.name)) {
      for (let r = d.start; r <= d.end; r++) skipRanges.add(r);
    } else seen.add(d.name);
  }

  if (!skipRanges.size) return false;
  const out = [];
  for (let j = 0; j < lines.length; j++) {
    if (!skipRanges.has(j)) out.push(lines[j]);
  }
  fs.writeFileSync(file, out.join('\n') + tail, 'utf8');
  return true;
}

let n = 0;
for (const f of files) {
  if (dedupeFile(f)) {
    console.log('deduped', path.relative(root, f));
    n++;
  }
}
console.log('total', n);
