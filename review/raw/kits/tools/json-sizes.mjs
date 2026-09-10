// json-sizes.mjs — the byte counts the write-ups quote for "JSON.stringify(CURATED)" and the drift test's object, at base and head; and the hex population at base.
import { pathToFileURL } from "node:url";
import fs from "node:fs";
for (const [label, p] of [["base 4962f97", process.argv[2]], ["head 7341981", process.argv[3]]]) {
  const T = await import(pathToFileURL(p).href);
  const normalizeKit = t => ({ ...t, shapes: Array.isArray(t.shapes) ? t.shapes : Array.from({ length: t.shapes || 1 }, (_, i) => i), secret: t.secret === true });
  const curated = JSON.stringify(T.CURATED), drift = JSON.stringify({ kits: T.CURATED.map(normalizeKit), pairs: T.PAIRS });
  console.log(`${label}: JSON.stringify(CURATED) = ${Buffer.byteLength(curated)} bytes; JSON.stringify({kits: normalized, pairs}) = ${Buffer.byteLength(drift)} bytes`);
  const src = fs.readFileSync(p, "utf8");
  const srcHex = new Set([...src.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g)].map(m => m[0].toUpperCase()));
  const HEX = ["ink", "ink2", "ink3", "text", "muted", "dim", "done", "accent", "accentHi", "accentDeep", "accentText", "danger", "hairSolid", "muted2", "dim2", "done2"];
  let slots = 0, miss = 0, all = 0, missAll = 0, kitsMiss = 0;
  for (const k of T.CURATED) {
    let m = 0;
    for (const t of HEX) { slots++; if (!srcHex.has(k.colors[t].toUpperCase())) { miss++; m++; } }
    for (const v of Object.values(k.colors)) for (const h of String(v).matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g)) { all++; if (!srcHex.has(h[0].toUpperCase())) missAll++; }
    if (m) kitsMiss++;
  }
  console.log(`  ${label}: 16-token slots ${slots}, absent from source ${miss} (kits with >=1: ${kitsMiss}); every hex occurrence in colors ${all}, absent ${missAll}`);
}
