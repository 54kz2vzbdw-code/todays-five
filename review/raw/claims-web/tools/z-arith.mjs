// z-arith.mjs — recompute arithmetic claims the commit messages / test comments state, from the worktree's own theme.js
// and fixtures (read-only). Run: node z-arith.mjs   (writes nothing; output goes to review/raw/claims-web/z-arith.txt)
import * as T from "/Users/pricebrannen/Today's Five/todays-five-review-claims-web/theme.js";
import fs from "node:fs";
const W = "/Users/pricebrannen/Today's Five/todays-five-review-claims-web";
const f4 = x => x.toFixed(4);
const light = T.curated("light").colors;
console.log("9a2f369 'tightest is Light dim on its own --ink, 4.5002':", f4(T.contrast(light.dim, light.ink)));
const kits = JSON.parse(fs.readFileSync(W + "/test/fixtures/kits.json", "utf8")).kits;
const srcRaw = fs.readFileSync(W + "/theme.js", "utf8"), src = srcRaw.toLowerCase();
const hexes = o => { const out = []; const walk = v => { if (typeof v === "string") { if (/^#[0-9a-f]{6}$/i.test(v)) out.push(v); } else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(o); return out; };
let total = 0, absCI = 0, absCS = 0, kitsCI = 0, kitsCS = 0;
for (const k of kits) { const h = hexes(k.colors); total += h.length; const ci = h.filter(x => !src.includes(x.toLowerCase())), cs = h.filter(x => !srcRaw.includes(x)); absCI += ci.length; absCS += cs.length; if (ci.length) kitsCI++; if (cs.length) kitsCS++; }
console.log("144e5b3 / theme.test.js '62 of the 314 hex tokens absent from theme.js source; every one of 18 kits has one': kits=" + kits.length + " hex tokens in colors=" + total + " absent case-insensitive=" + absCI + " (kits with >=1: " + kitsCI + ") absent case-sensitive=" + absCS + " (kits with >=1: " + kitsCS + ")");
const n0 = kits.filter(k => JSON.stringify(k.shapes) === "[0]").length;
console.log("3ac91b2 'fifteen of eighteen read [0]': at HEAD kits with shapes [0] = " + n0 + "; light-base kits = " + kits.filter(k => k.base === "light").length + " (e3255d0 'six of the eighteen kits are light')");
const wf = JSON.parse(fs.readFileSync(W + "/test/fixtures/watch-fonts.json", "utf8")); const faces = Object.values(wf).find(v => Array.isArray(v));
const res = faces.filter(x => x.reservedFontName === true); const fam = s => String(s).replace(/-[^-]*$/, "").replace(/\.woff2$/, "");
console.log("1aada68 '15 faces across 9 families reserved' (9a2f369 said ten): faces=" + faces.length + " reserved=" + res.length + " source families=" + new Set(res.map(x => fam(x.source))).size + " [" + [...new Set(res.map(x => fam(x.source)))].join(", ") + "]");
console.log("  total source families in fixture: " + new Set(faces.map(x => fam(x.source))).size + "; total bytes " + faces.reduce((a, x) => a + (x.bytes || 0), 0) + " (9a2f369: 1.18 MB)");
console.log("PALETTE_REV " + T.PALETTE_REV + " CURATED " + T.CURATED.length + " secret " + T.CURATED.filter(t => t.secret).length + " SLOT_DEFAULT " + JSON.stringify(T.SLOT_DEFAULT) + " partnerOf(paper)=" + T.partnerOf(T.curated("paper")).id + " PACK_IDS=" + (T.PACK_IDS ? T.PACK_IDS.length : "?"));
