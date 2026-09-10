// contrast.mjs — recompute the contrast ratios and OKLCH figures that theme.js's comments, the theme suite's
// assertion messages and the Phase 4 commit messages state, using theme.js's own contrast()/hexToOklch() from
// the worktree (read-only import). Run: node contrast.mjs
import * as T from "/Users/pricebrannen/Today's Five/todays-five-review-claims-web/theme.js";
const c = (a, b) => T.contrast(a, b);
const f = x => x.toFixed(4);
const P = T.PAPER_GROUND, Tm = T.TERMINAL_GROUND;
const light = T.curated("light").colors, dark = T.curated("dark").colors, paper = T.curated("paper").colors, terminal = T.curated("terminal").colors, pink = T.curated("pink").colors;
console.log("BRAND_ACCENT =", T.BRAND_ACCENT);
console.log("-- theme.js:147-150 'clears the 3:1 floor on all four grounds by 16 % (min 3.48)'; '#D9A066 … 2.05:1 on Paper'");
const four = { "paper ink": P.ink, "paper ink3": P.ink3, "terminal ink": Tm.ink, "terminal ink3": Tm.ink3 };
let min = Infinity; for (const [k, g] of Object.entries(four)) { const r = c(T.BRAND_ACCENT, g); min = Math.min(min, r); console.log("   #A86014 on", k.padEnd(14), g, f(r)); }
console.log("   min =", f(min), " margin over 3:1 =", ((min / 3 - 1) * 100).toFixed(1) + "%");
console.log("   #D9A066 on Paper ink", P.ink, f(c("#D9A066", P.ink)));
const o = T.hexToOklch(T.BRAND_ACCENT); console.log("   OKLCH(#A86014) L=" + o.L.toFixed(3) + " C=" + o.C.toFixed(3) + " h=" + o.h.toFixed(1));
console.log("-- theme.js:236-240 / test/theme.test.js:158-159 / 411f142: light's danger #B8402A → #B13924");
console.log("   light grounds ink", light.ink, "ink2", light.ink2, "ink3", light.ink3, " danger now", light.danger);
for (const hex of ["#B8402A", "#B13924"]) console.log("   " + hex + " on ink3 " + f(c(hex, light.ink3)) + "  on ink2 " + f(c(hex, light.ink2)) + "  on ink " + f(c(hex, light.ink)));
console.log("-- test/theme.test.js:154 'light's accent on --ink-3 clears the floor by 0.0016'; f9e64d7 'Pink's accent text on --ink-3 is 4.5069'");
console.log("   light accent", light.accent, "on ink3", light.ink3, f(c(light.accent, light.ink3)), " margin", f(c(light.accent, light.ink3) - 3));
console.log("   pink accentText", pink.accentText, "on ink3", pink.ink3, f(c(pink.accentText, pink.ink3)));
console.log("-- f9e64d7's table (accent on --ink / --ink-3)");
for (const [name, k] of [["dark", dark], ["paper", paper], ["terminal", terminal]]) console.log("   " + name.padEnd(9) + k.accent + "  on ink " + f(c(k.accent, k.ink)) + "  on ink3 " + f(c(k.accent, k.ink3)) + "   (with #A86014 instead: " + f(c("#A86014", k.ink)) + " / " + f(c("#A86014", k.ink3)) + ")");
console.log("-- 2dbdfd9 'light's danger #B13924 at 4.5050 … now the worst of the eighteen' (danger on ink3 across CURATED)");
const rows = T.CURATED.map(t => [t.id, c(t.colors.danger, t.colors.ink3)]).sort((a, b) => a[1] - b[1]);
console.log("   lowest three: " + rows.slice(0, 3).map(r => r[0] + " " + f(r[1])).join(", ") + "   kits=" + T.CURATED.length);
console.log("-- PALETTE_REV =", T.PALETTE_REV, " CURATED kits =", T.CURATED.length, " secret =", T.CURATED.filter(t => t.secret).length);
console.log("-- SLOT_DEFAULT =", JSON.stringify(T.SLOT_DEFAULT), " partnerOf(paper) =", T.partnerOf(T.curated("paper")).id);
