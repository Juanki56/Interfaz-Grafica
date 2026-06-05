import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/components/ProgrammingManagement.tsx');
let s = fs.readFileSync(file, 'utf8');

if (s.includes('const renderStaffBackendCreateForm')) {
  console.log('already patched');
  process.exit(0);
}

const createStart =
  '          {isStaffRole ? (\n            <form\n              className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden"';
const createEnd =
  '            </form>\n                      ) : (\n                        <ProgrammingFormImproved';

const editStart =
  '                      {isStaffRole ? (\n                        <form\n                          className="flex flex-col gap-5 flex-1 min-h-0 overflow-hidden"';
const editEnd =
  '                        </form>\n                      ) : selectedProgramming ? (\n                        <ProgrammingFormImproved';

const ci = s.indexOf(createStart);
const ce = s.indexOf(createEnd);
if (ci < 0 || ce < 0) {
  console.error('create markers', ci, ce);
  process.exit(1);
}

let createForm = s.slice(ci + '          {isStaffRole ? (\n'.length, ce);
createForm = createForm.replace(
  'className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden"',
  'className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden h-full"',
);

const ei = s.indexOf(editStart);
const ee = s.indexOf(editEnd);
if (ei < 0 || ee < 0) {
  console.error('edit markers', ei, ee);
  process.exit(1);
}

let editForm = s.slice(ei + '                      {isStaffRole ? (\n'.length, ee);
editForm = editForm.replace(
  'className="flex flex-col gap-5 flex-1 min-h-0 overflow-hidden"',
  'className="flex flex-col gap-5 flex-1 min-h-0 overflow-hidden h-full"',
);

const anchor = '  const programmingStaffFullPageOpen =';
const ai = s.indexOf(anchor);
if (ai < 0) {
  console.error('anchor not found');
  process.exit(1);
}

const fnBlock = `
  const renderStaffBackendCreateForm = () => (
${createForm.trim()}
  );

  const renderStaffBackendEditForm = () => (
${editForm.trim()}
  );

`;

s = s.slice(0, ai) + fnBlock + s.slice(ai);

const createBlock = s.slice(ci, ce + createEnd.length);
const createReplacement =
  '          {!(isStaffRole && canUseBackend) ? (\n                        <ProgrammingFormImproved';
if (!s.includes(createBlock)) {
  console.error('create block not found after insert');
  process.exit(1);
}
s = s.replace(createBlock, createReplacement);

const editBlock = s.slice(s.indexOf(editStart), s.indexOf(editEnd) + editEnd.length);
const editReplacement =
  '                      {isStaffRole && canUseBackend ? null : selectedProgramming ? (\n                        <ProgrammingFormImproved';
if (!s.includes(editBlock)) {
  // edit block indices shifted - find again
  const ei2 = s.indexOf(editStart);
  const ee2 = s.indexOf(editEnd);
  if (ei2 < 0) {
    // form was extracted - dialog should still have editStart if not replaced
    const altStart = '                      {isStaffRole ? (\n                        <form';
    console.error('edit block', ei2, ee2, 'alt', s.indexOf(altStart));
    process.exit(1);
  }
}
s = s.replace(editBlock, editReplacement);

fs.writeFileSync(file, s);
console.log('done');
