/** Aplica parches del transcript desde línea START (1-based) hasta el final. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TRANSCRIPT = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-PC-Desktop-OCCITOUR-INTERFAZ',
  'agent-transcripts',
  'ab14a053-bb8f-4bef-a988-18d9d199c765',
  'ab14a053-bb8f-4bef-a988-18d9d199c765.jsonl',
);
const START = Number(process.argv[2] || 4766);
const ONLY = process.argv.slice(3).map((p) => p.replace(/\\/g, '/'));

function normPath(p) {
  return p.replace(/\\/g, '/').replace(/.*Interfaz-Grafica\//, '');
}

function applyStrReplace(content, oldString, newString) {
  if (!content.includes(oldString)) return { ok: false, content };
  return { ok: true, content: content.replace(oldString, newString) };
}

function loadBase(relPath) {
  const cur = path.join(ROOT, relPath);
  if (fs.existsSync(cur)) return fs.readFileSync(cur, 'utf8');
  try {
    return execSync(`git show c7cf3f7:${relPath}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

const lines = fs.readFileSync(TRANSCRIPT, 'utf8').split('\n');
const fileState = new Map();
let ok = 0,
  fail = 0;

for (let i = START - 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    continue;
  }
  const parts = row?.message?.content;
  if (!Array.isArray(parts)) continue;
  for (const part of parts) {
    if (part?.type !== 'tool_use') continue;
    const input = part.input || {};
    if (part.name === 'StrReplace' && input.path && input.old_string != null) {
      const rel = normPath(input.path);
      if (ONLY.length && !ONLY.some((o) => rel.includes(o))) continue;
      if (!rel.startsWith('src/')) continue;
      if (!fileState.has(rel)) fileState.set(rel, loadBase(rel));
      const r = applyStrReplace(fileState.get(rel), input.old_string, input.new_string);
      if (r.ok) {
        ok++;
        fileState.set(rel, r.content);
      } else fail++;
    }
    if (part.name === 'Write' && input.path && input.contents != null) {
      const rel = normPath(input.path);
      if (ONLY.length && !ONLY.some((o) => rel.includes(o))) continue;
      if (!rel.startsWith('src/')) continue;
      fileState.set(rel, input.contents);
      ok++;
    }
  }
}

for (const [rel, content] of fileState) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content, 'utf8');
  console.log('wrote', rel);
}
console.log({ ok, fail, files: fileState.size });
