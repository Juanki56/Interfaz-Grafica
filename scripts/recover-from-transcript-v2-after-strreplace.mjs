/**
 * Reconstruye archivos aplicando StrReplace del transcript de Cursor
 * hasta el primer `git checkout HEAD -- src/components/` (pérdida masiva).
 *
 * Uso: node scripts/recover-from-transcript.mjs
 * Salida: ./_recovered_pre_checkout/ (no toca src/)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, '_recovered_pre_checkout');
const TRANSCRIPT = path.join(
  process.env.USERPROFILE || '',
  '.cursor',
  'projects',
  'c-Users-PC-Desktop-OCCITOUR-INTERFAZ',
  'agent-transcripts',
  'ab14a053-bb8f-4bef-a988-18d9d199c765',
  'ab14a053-bb8f-4bef-a988-18d9d199c765.jsonl',
);

const CHECKOUT_MARKER = 'git checkout HEAD -- src/components';

function normPath(p) {
  return p.replace(/\\/g, '/').replace(/.*Interfaz-Grafica\//, '');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function applyStrReplace(content, oldString, newString) {
  if (!content.includes(oldString)) return { ok: false, content };
  return { ok: true, content: content.replace(oldString, newString) };
}

function parsePatchAddFile(patch) {
  const m = patch.match(/^\+\+\+ Add File: (.+)$/m);
  if (!m) return null;
  return normPath(m[1].trim());
}

function parsePatchBody(patch) {
  const lines = patch.split('\n');
  const body = [];
  let inAdd = false;
  for (const line of lines) {
    if (line.startsWith('+++ Add File:')) {
      inAdd = true;
      continue;
    }
    if (line.startsWith('*** End Patch')) break;
    if (!inAdd) continue;
    if (line.startsWith('+')) body.push(line.slice(1));
    else if (line === '+') body.push('');
  }
  return body.join('\n');
}

const GIT_BASE = 'c7cf3f7';

function loadBase(relPath) {
  try {
    return execSync(`git show ${GIT_BASE}:${relPath.replace(/\\/g, '/')}`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch {
    const cur = path.join(ROOT, relPath);
    if (fs.existsSync(cur)) return fs.readFileSync(cur, 'utf8');
    return '';
  }
}

const lines = fs.readFileSync(TRANSCRIPT, 'utf8').split('\n');
const fileState = new Map();
const stats = { strReplace: 0, strOk: 0, strFail: 0, writes: 0, patches: 0, stoppedAt: 0 };

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes(CHECKOUT_MARKER)) {
    stats.stoppedAt = i + 1;
    break;
  }
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
    const name = part.name;
    const input = part.input || {};

    if (name === 'StrReplace' && input.path && input.old_string != null && input.new_string != null) {
      const rel = normPath(input.path);
      if (!rel.startsWith('src/') && !rel.startsWith('scripts/')) continue;
      stats.strReplace++;
      if (!fileState.has(rel)) fileState.set(rel, loadBase(rel));
      let content = fileState.get(rel);
      const r = applyStrReplace(content, input.old_string, input.new_string);
      if (r.ok) {
        stats.strOk++;
        fileState.set(rel, r.content);
      } else {
        stats.strFail++;
      }
    }

    if (name === 'Write' && input.path && input.contents != null) {
      const rel = normPath(input.path);
      if (!rel.startsWith('src/') && !rel.startsWith('scripts/')) continue;
      stats.writes++;
      fileState.set(rel, input.contents);
    }

    if (name === 'ApplyPatch') {
      const raw = typeof input === 'string' ? input : JSON.stringify(input);
      if (raw.includes('Add File:')) {
        const rel = parsePatchAddFile(raw.replace(/\\n/g, '\n'));
        if (rel) {
          const body = parsePatchBody(raw.replace(/\\n/g, '\n'));
          if (body) {
            stats.patches++;
            fileState.set(rel, body);
          }
        }
      }
    }
  }
}

if (stats.stoppedAt === 0) stats.stoppedAt = lines.length;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const [rel, content] of fileState) {
  const outPath = path.join(OUT, rel);
  ensureDir(outPath);
  fs.writeFileSync(outPath, content, 'utf8');
}

const report = {
  transcriptLines: lines.length,
  stoppedAtLine: stats.stoppedAt,
  filesRecovered: fileState.size,
  ...stats,
};
fs.writeFileSync(path.join(OUT, '_report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`\nArchivos en: ${OUT}`);
