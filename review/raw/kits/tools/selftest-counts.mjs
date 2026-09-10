// selftest-counts.mjs — the check counts FontSelfTest.run and ConfettiSelfTest.run must produce, derived from the fixtures and the code's structure.
import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const wf = JSON.parse(fs.readFileSync(path.join(root, "test/fixtures/watch-fonts.json"), "utf8"));
const pairs = Object.entries(wf.pairs);
const faces = new Set();
let pairChecks = 0, samePair = [];
for (const [id, p] of pairs) {
  for (const f of [p.task.faces[0], ...p.ui.faces]) faces.add(f.postScriptName);
  const ui = p.ui.faces; const a = ui[0], b = ui[ui.length - 1];
  if (a.postScriptName === b.postScriptName) samePair.push(id); else pairChecks++;
}
const faceChecks = faces.size * 2;
console.log(`pairs=${pairs.length} distinct faces=${faces.size} -> per-face checks (family + resolves) = ${faceChecks}; pairs with two distinct ui faces = ${pairChecks} (single-weight ui pairs: ${samePair.join(",") || "none"})`);
for (const kits of [16, 18]) console.log(`FontSelfTest with ${kits} kits: 1 (bundled) + ${faceChecks} + ${pairChecks} + ${kits} = ${1 + faceChecks + pairChecks + kits}`);
for (const kits of [16, 18]) console.log(`ConfettiSelfTest with ${kits} kits: 6 checks x ${kits} = ${6 * kits}`);
// the 12 of 22: bare family (weight suffix stripped) != cssFamily
const css = new Set(), surprises = new Set();
for (const [, p] of pairs) for (const role of ["task", "ui"]) { css.add(p[role].cssFamily); for (const f of p[role].faces) { const bare = f.family.replace(new RegExp(" " + f.weight + "$"), ""); if (bare !== p[role].cssFamily) surprises.add(p[role].cssFamily + " -> " + bare); } }
console.log(`\nCSS families named by PAIRS: ${css.size}; families whose file name differs: ${surprises.size}`);
for (const s of [...surprises].sort()) console.log("  " + s);
// reserved font names
const rfn = wf.faces.filter(f => f.reservedFontName);
const fams = new Set(rfn.map(f => f.family.replace(new RegExp(" " + f.weight + "$"), "").replace(/ (Thin|Light|ExtraLight|SemiBold|Bold|Black|Regular|Medium)( \d+)?$/, "")));
console.log(`\nreservedFontName=true faces: ${rfn.length} of ${wf.faces.length}; families (bare): ${[...fams].sort().join(" | ")} (${fams.size})`);
console.log(`totals: ${JSON.stringify(wf.totals)}; bytes = ${(wf.totals.bytes / 1048576).toFixed(3)} MiB = ${(wf.totals.bytes / 1e6).toFixed(3)} MB; sourceBytes = ${(wf.totals.sourceBytes / 1024).toFixed(1)} KiB = ${(wf.totals.sourceBytes / 1e3).toFixed(1)} KB`);
// per-source table: bytes per source woff2, as the README rows state them
const bySource = {};
for (const f of wf.faces) { bySource[f.source] = (bySource[f.source] || 0) + f.bytes; }
for (const [s, b] of Object.entries(bySource).sort()) console.log(`  ${s.padEnd(36)} ${b} bytes = ${(b / 1024).toFixed(1)} KiB = ${(b / 1e3).toFixed(1)} KB`);
