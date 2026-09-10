// csstext-diff.mjs — how many of the 18 kits' cssText() moved between two theme.js revisions.
// usage: node csstext-diff.mjs <theme.js at base> <theme.js at head>
import { pathToFileURL } from "node:url";
const [,, basePath, headPath] = process.argv;
const A = await import(pathToFileURL(basePath).href), B = await import(pathToFileURL(headPath).href);
const tok = s => Object.fromEntries(s.replace(/^:root\{/, "").replace(/\}$/, "").split(";").filter(Boolean).map(kv => { const i = kv.indexOf(":"); return [kv.slice(0, i), kv.slice(i + 1)]; }));
let differ = 0, brandBase = [], brandHead = [];
for (const b of B.CURATED) {
  const a = A.CURATED.find(t => t.id === b.id);
  const ca = A.cssText(a), cb = B.cssText(b);
  if (/#A86014/i.test(ca)) brandBase.push(b.id);
  if (/#A86014/i.test(cb)) brandHead.push(b.id);
  if (ca === cb) { console.log(`${b.id.padEnd(10)} byte-identical (${cb.length} bytes)`); continue; }
  differ++;
  const ta = tok(ca), tb = tok(cb);
  const moved = Object.keys(tb).filter(k => ta[k] !== tb[k]);
  console.log(`${b.id.padEnd(10)} DIFFERS in ${moved.length} token(s): ${moved.map(k => `${k}: ${ta[k]} -> ${tb[k]}`).join("; ")}`);
}
console.log(`\n${differ} of ${B.CURATED.length} kits' cssText() differ base->head; ${B.CURATED.length - differ} byte-identical`);
console.log(`kits whose cssText carries #A86014 at base: ${brandBase.join(", ")} (${brandBase.length}); at head: ${brandHead.join(", ")} (${brandHead.length})`);
// colours objects too (confetti is not in cssText)
const carriers = T => T.CURATED.filter(t => Object.values(t.colors).some(v => /#A86014/i.test(String(v))) || t.confetti.some(h => /#A86014/i.test(h))).map(t => t.id);
console.log(`kits whose colors/confetti carry #A86014 at base: ${carriers(A).join(", ")}; at head: ${carriers(B).join(", ")}`);
