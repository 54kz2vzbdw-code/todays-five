// hex-314.mjs — the population "16 hex tokens + the three hex-or-gradient tokens when they are a bare hex", at base and head.
import { pathToFileURL } from "node:url";
import fs from "node:fs";
const HEX = ["ink", "ink2", "ink3", "text", "muted", "dim", "done", "accent", "accentHi", "accentDeep", "accentText", "danger", "hairSolid", "muted2", "dim2", "done2"];
for (const [label, p] of [["base 4962f97", process.argv[2]], ["head 7341981", process.argv[3]]]) {
  const T = await import(pathToFileURL(p).href);
  const srcHex = new Set([...fs.readFileSync(p, "utf8").matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g)].map(m => m[0].toUpperCase()));
  let slots = 0, absent = 0, bare = 0, absentBare = 0;
  for (const k of T.CURATED) {
    for (const t of HEX) { slots++; if (!srcHex.has(k.colors[t].toUpperCase())) absent++; }
    for (const t of ["boxDoneBg", "strikeBg", "barBg"]) { const v = k.colors[t]; if (/^#[0-9A-Fa-f]{6}$/.test(String(v))) { bare++; if (!srcHex.has(v.toUpperCase())) absentBare++; } }
  }
  console.log(`${label}: 16-token slots ${slots} + bare-hex boxDoneBg/strikeBg/barBg ${bare} = ${slots + bare}; absent from source ${absent} + ${absentBare} = ${absent + absentBare}`);
  const keys = Object.keys(T.CURATED[0].colors); console.log(`  colors keys (${keys.length}): ${keys.join(" ")}`);
}
