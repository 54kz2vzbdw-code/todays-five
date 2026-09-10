// accent-contrast.mjs — the accent/danger ratios PLAN and DECISIONS quote, computed with theme.js's own contrast() at base and at head.
// usage: node accent-contrast.mjs <theme.js at base> <theme.js at head>
import { pathToFileURL } from "node:url";
const [,, basePath, headPath] = process.argv;
const A = await import(pathToFileURL(basePath).href), B = await import(pathToFileURL(headPath).href);
const c = (T, id, t1, t2) => { const k = T.CURATED.find(t => t.id === id).colors; return T.contrast(k[t1], k[t2]); };
const hex = (T, id, t) => T.CURATED.find(x => x.id === id).colors[t];
for (const id of ["terminal", "paper", "dark", "light", "pink"]) {
  console.log(`${id}: base accent ${hex(A, id, "accent")} a/ink ${c(A, id, "accent", "ink").toFixed(4)} a/ink3 ${c(A, id, "accent", "ink3").toFixed(4)} | head accent ${hex(B, id, "accent")} a/ink ${c(B, id, "accent", "ink").toFixed(4)} a/ink3 ${c(B, id, "accent", "ink3").toFixed(4)}`);
}
console.log(`light danger: base ${hex(A, "light", "danger")} on ink3 ${c(A, "light", "danger", "ink3").toFixed(4)} on ink ${c(A, "light", "danger", "ink").toFixed(4)} | head ${hex(B, "light", "danger")} on ink3 ${c(B, "light", "danger", "ink3").toFixed(4)} on ink ${c(B, "light", "danger", "ink").toFixed(4)}`);
console.log(`light accent on ink3 (head): ${c(B, "light", "accent", "ink3").toFixed(4)}`);
console.log(`pink accentText on ink3 (head): ${c(B, "pink", "accentText", "ink3").toFixed(4)}`);
console.log(`\nexports at head containing finalize/ensure/fix: ${Object.keys(B).filter(k => /finalize|ensure|fix/i.test(k)).join(", ") || "(none)"}`);
console.log(`exports at head: ${Object.keys(B).sort().join(" ")}`);
// finalize() returns the six reverted hexes unchanged: the RAW literals vs. what curated() (= RAW.map(finalize)) holds
import fs from "node:fs";
const src = fs.readFileSync(headPath, "utf8");
const paperRaw = /kit\("paper"[\s\S]*?accent: "(#[0-9A-F]{6})", accentHi: "(#[0-9A-F]{6})", accentDeep: "(#[0-9A-F]{6})", accentText: "(#[0-9A-F]{6})"/.exec(src);
const termRaw = /kit\("terminal"[\s\S]*?accent: "(#[0-9A-F]{6})", accentHi: "(#[0-9A-F]{6})", accentDeep: "(#[0-9A-F]{6})", accentText: "(#[0-9A-F]{6})"/.exec(src);
const p = B.curated("paper").colors, t = B.curated("terminal").colors;
console.log(`paper RAW ${paperRaw.slice(1).join(" ")} -> curated ${[p.accent, p.accentHi, p.accentDeep, p.accentText].join(" ")} unchanged=${paperRaw.slice(1).join() === [p.accent, p.accentHi, p.accentDeep, p.accentText].join()}`);
console.log(`terminal RAW ${termRaw.slice(1).join(" ")} -> curated ${[t.accent, t.accentHi, t.accentDeep, t.accentText].join(" ")} unchanged=${termRaw.slice(1).join() === [t.accent, t.accentHi, t.accentDeep, t.accentText].join()}`);
