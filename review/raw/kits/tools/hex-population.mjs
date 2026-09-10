// hex-population.mjs — which population of hex tokens gives "314", and how many are absent from theme.js's source.
// usage: node hex-population.mjs <kits.json> <theme.js>
import fs from "node:fs";
const [,, fixturePath, themePath] = process.argv;
const fx = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const src = fs.readFileSync(themePath, "utf8");
const srcHex = new Set([...src.matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g)].map(m => m[0].toUpperCase()));
const up = h => h.toUpperCase();
const pops = {};
const add = (name, list) => { pops[name] = list; };
let slots16 = [], conf = [], allColorHex = [], slotsEmbedded = [];
const perKit = {};
for (const k of fx.kits) {
  perKit[k.id] = { missing16: [], missingAll: [] };
  for (const t of fx.hexTokens) { slots16.push(k.colors[t]); if (!srcHex.has(up(k.colors[t]))) perKit[k.id].missing16.push(`${t}=${k.colors[t]}`); }
  for (const h of k.confetti) conf.push(h);
  for (const [key, v] of Object.entries(k.colors)) {
    for (const m of String(v).matchAll(/#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g)) { allColorHex.push(m[0]); if (!fx.hexTokens.includes(key)) slotsEmbedded.push(`${k.id}.${key}=${m[0]}`); if (!srcHex.has(up(m[0]))) perKit[k.id].missingAll.push(`${key}=${m[0]}`); }
  }
}
add("A: 16 hex tokens x 18 kits (slots)", slots16);
add("B: distinct values of A", [...new Set(slots16.map(up))]);
add("C: A + confetti slots", slots16.concat(conf));
add("D: distinct values of C", [...new Set(slots16.concat(conf).map(up))]);
add("E: every #RRGGBB occurrence anywhere in colors (incl. gradients/box/strike)", allColorHex);
add("F: distinct values of E", [...new Set(allColorHex.map(up))]);
add("G: E + confetti", allColorHex.concat(conf));
add("H: distinct values of G", [...new Set(allColorHex.concat(conf).map(up))]);
console.log(`theme.js source carries ${srcHex.size} distinct #RRGGBB literals`);
for (const [name, list] of Object.entries(pops)) {
  const missing = list.filter(h => !srcHex.has(up(h)));
  const distinctMissing = new Set(missing.map(up)).size;
  console.log(`${name}: ${list.length} tokens, ${missing.length} not literal in theme.js (${distinctMissing} distinct)`);
}
const kitsWithMissing16 = Object.entries(perKit).filter(([, v]) => v.missing16.length).length;
console.log(`\nkits with at least one of the 16 hex tokens absent from the source: ${kitsWithMissing16} of ${fx.kits.length}`);
for (const [id, v] of Object.entries(perKit)) console.log(`  ${id.padEnd(10)} ${v.missing16.length} of 16 absent: ${v.missing16.join(" ")}`);
console.log(`\nhex literals embedded in non-hex tokens (gradients etc.): ${slotsEmbedded.length}`);
