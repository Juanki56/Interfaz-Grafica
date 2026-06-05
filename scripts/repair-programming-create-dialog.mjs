import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/components/ProgrammingManagement.tsx');
let s = fs.readFileSync(file, 'utf8');

const dialogStart =
  '          </DialogHeader>\n          {isStaffRole ? (\n            <form\n              className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden"';
const dialogEnd =
  '            </form>\n                      ) : (\n                        <ProgrammingFormImproved';

const i = s.indexOf(dialogStart);
const j = s.indexOf(dialogEnd);
if (i < 0 || j < 0) {
  console.log('create dialog already fixed or not found', i, j);
  process.exit(i < 0 ? 1 : 0);
}

const replacement =
  '          </DialogHeader>\n          {!(isStaffRole && canUseBackend) ? (\n                        <ProgrammingFormImproved';

s = s.slice(0, i) + replacement + s.slice(j + dialogEnd.length);
fs.writeFileSync(file, s);
console.log('fixed create dialog');
