import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/components/ProgrammingManagement.tsx');
let s = fs.readFileSync(file, 'utf8');

const corruptStart =
  '                                      Cliente #{s.id_cliente}\n                                      {s.cliente_nombre ? ` · ${          {!(isStaffRole && canUseBackend) ? (';
const corruptEnd =
  "                                        {backendConvertingId === id ? 'Convirtiendo…' : 'Convertir a programación'}\n                                      </Button>\n                                    </div>\n                                  </TableCell>\n                                </TableRow>";

const i = s.indexOf(corruptStart);
const j = s.indexOf(corruptEnd);
if (i < 0 || j < 0) {
  console.log('corruption not found', i, j);
  process.exit(i < 0 ? 1 : 0);
}

const head = execSync(
  'git show HEAD:src/components/ProgrammingManagement.tsx',
  { cwd: path.join(__dirname, '..'), encoding: 'utf8' },
);

const goodStart = '                                      Cliente #{s.id_cliente}';
const goodEnd =
  "                                        {backendConvertingId === id ? 'Convirtiendo…' : 'Convertir a programación'}\n                                      </Button>\n                                    </div>\n                                  </TableCell>\n                                </TableRow>";

const gi = head.indexOf(goodStart);
const gj = head.indexOf(goodEnd);
if (gi < 0 || gj < 0) {
  console.error('good markers in HEAD', gi, gj);
  process.exit(1);
}

const replacement = head.slice(gi, gj + goodEnd.length);
s = s.slice(0, i) + replacement + s.slice(j + corruptEnd.length);
fs.writeFileSync(file, s);
console.log('repaired solicitudes block');
