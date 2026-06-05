const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/components/ProgrammingManagement.tsx");
let s = fs.readFileSync(file, "utf8");

if (s.includes("const renderStaffOperativeDetailBody")) {
  console.log("already patched");
  process.exit(0);
}

const anchor =
  "  const getTotalParticipants = (clients: Client[]) => {\n" +
  "    return clients.reduce((total, client) => {\n" +
  "      return total + 1 + client.companions.length;\n" +
  "    }, 0);\n" +
  "  };\n\n" +
  "  return (";

const i = s.indexOf(anchor);
if (i < 0) throw new Error("anchor not found");

const startMarker =
  "              {isStaffRole ? (\n" +
  '                <div className="space-y-6">\n' +
  "                  {backendViewLoading ? (";

const endMarker =
  "                </div>\n" +
  "              ) : (\n" +
  '                <div className="space-y-6">\n' +
  "                {/* Resumen Rápido para Cliente/Guía */}";

const j = s.indexOf(startMarker);
const k = s.indexOf(endMarker);
if (j < 0 || k < 0 || k < j) throw new Error(`markers j=${j} k=${k}`);

const inner = s.slice(j + startMarker.length, k);
const fn =
  "\n  const renderStaffOperativeDetailBody = () => (\n" +
  '    <div className="space-y-6 min-w-0 w-full max-w-full overflow-x-hidden">\n' +
  "                  " +
  inner.trimStart() +
  "\n    </div>\n  );\n";

const before = s.slice(0, i + anchor.length - "  return (".length);
const after = s.slice(i + anchor.length);
const newS = before + fn + "\n  return (" + after;

fs.writeFileSync(file, newS);
console.log("inserted renderStaffOperativeDetailBody");
