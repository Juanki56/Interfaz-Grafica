const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/components/ProgrammingManagement.tsx");
let s = fs.readFileSync(file, "utf8");

const startMarker =
  "              {isStaffRole ? (\n" +
  '                <div className="space-y-6">\n' +
  "                  {backendViewLoading ? (";

const endMarker =
  "                </div>\n" +
  "              ) : (\n" +
  '                <div className="space-y-6">\n' +
  "                {/* Resumen Rápido para Cliente/Guía */}";

const modalAnchor = "      {/* Modal Ver Detalles */}";
const ma = s.indexOf(modalAnchor);
if (ma < 0) throw new Error("modal anchor not found");

const j = s.indexOf(startMarker, ma);
const k = s.indexOf(endMarker, ma);
if (j < 0 || k < 0 || k < j) throw new Error(`markers j=${j} k=${k}`);

const replacement =
  "              {isStaffRole ? (\n" +
  "                renderStaffOperativeDetailBody()\n" +
  "              ) : (\n" +
  '                <div className="space-y-6">\n' +
  "                {/* Resumen Rápido para Cliente/Guía */}";

const before = s.slice(0, j);
const after = s.slice(k + endMarker.length);
const newS = before + replacement + after;
fs.writeFileSync(file, newS);
console.log("replaced dialog staff block");
