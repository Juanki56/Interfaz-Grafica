/**
 * Elimina bloques duplicados de function/const al inicio del módulo (antes del export default principal).
 * También useState duplicados dentro del componente.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Uso: node dedupe-top-level-symbols.mjs <archivo.tsx> ...');
  process.exit(1);
}

function dedupeUseState(content) {
  const lines = content.split('\n');
  const seen = new Set();
  const out = [];
  let inComponent = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^export (default )?function /.test(line) || /^export default function/.test(line)) {
      inComponent = true;
    }
    const m = line.match(/^\s*const \[(\w+),/);
    if (inComponent && m) {
      const key = m[1];
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
    }
    out.push(line);
  }
  return out.join('\n');
}

function dedupeTopLevelFunctions(content) {
  const exportIdx = content.search(/^export default function/m);
  const splitAt = exportIdx >= 0 ? exportIdx : content.length;
  const head = content.slice(0, splitAt);
  const tail = content.slice(splitAt);

  const fnRe = /^(export )?function (\w+)\s*\([^)]*\)[^{]*\{/gm;
  const constFnRe = /^const (\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{/gm;

  const blocks = [];
  let m;
  const re = /^(?:(export )?function (\w+)|const (\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*)\s*[^{]*\{/gm;
  // Simpler: line-by-line scan for declaration starts, brace-balance to end block
  const lines = head.split('\n');
  const declarations = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    let name = null;
    let start = i;
    if (/^(export )?function (\w+)/.test(line)) {
      name = line.match(/^(?:export )?function (\w+)/)[1];
    } else if (/^const (\w+)\s*=/.test(line) && (line.includes('=>') || line.includes('function'))) {
      name = line.match(/^const (\w+)/)[1];
    }
    if (name) {
      let depth = 0;
      let started = false;
      let end = i;
      for (let j = i; j < lines.length; j++) {
        const l = lines[j];
        for (const ch of l) {
          if (ch === '{') {
            depth++;
            started = true;
          } else if (ch === '}') depth--;
        }
        end = j;
        if (started && depth === 0) break;
      }
      const block = lines.slice(start, end + 1).join('\n');
      const existing = declarations.find((d) => d.name === name);
      if (existing) {
        // skip duplicate block
        i = end + 1;
        continue;
      }
      declarations.push({ name, start, end, block });
      i = end + 1;
      continue;
    }
    i++;
  }

  const keep = new Set(declarations.map((d) => d.name));
  const outLines = [];
  i = 0;
  const declRanges = declarations.map((d) => ({ ...d, skip: false }));
  const seen = new Set();
  for (const d of declRanges) {
    if (seen.has(d.name)) d.skip = true;
    else seen.add(d.name);
  }

  i = 0;
  while (i < lines.length) {
    const d = declRanges.find((x) => x.start === i);
    if (d) {
      if (!d.skip) outLines.push(...lines.slice(d.start, d.end + 1));
      i = d.end + 1;
    } else {
      outLines.push(lines[i]);
      i++;
    }
  }

  return dedupeUseState(outLines.join('\n') + tail);
}

for (const f of files) {
  const p = path.resolve(f);
  const before = fs.readFileSync(p, 'utf8');
  const after = dedupeTopLevelFunctions(before);
  if (after !== before) {
    fs.writeFileSync(p, after, 'utf8');
    console.log('deduped:', p);
  }
}
