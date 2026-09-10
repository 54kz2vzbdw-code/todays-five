// z-shapes.mjs — per-commit tallies from git-show'n copies of test/fixtures/kits.json and theme.js (read-only):
// 3ac91b2's "fifteen of the eighteen", 144e5b3's "62 of the 314 hex tokens", e6f7d28's "fifteen of eighteen kits are
// byte-identical", and 9a2f369's "12 of the 22 families are not called what theme.js calls them" (results say ten).
import fs from "node:fs";
const S = process.argv[2], W = process.argv[3];
const hexes = o => { const out = []; const walk = v => { if (typeof v === "string") { if (/^#[0-9a-f]{6}$/i.test(v)) out.push(v); } else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(o); return out; };
for (const c of ["3ac91b2p", "3ac91b2", "144e5b3", "HEAD"]) {
  const kits = JSON.parse(fs.readFileSync(`${S}/kits-${c}.json`, "utf8")).kits;
  const tally = {}; for (const k of kits) { const s = JSON.stringify(k.shapes); tally[s] = (tally[s] || 0) + 1; }
  const src = fs.readFileSync(`${S}/theme-${c}.mjs`, "utf8");
  let tot = 0, abs = 0, kitsAbs = 0; for (const k of kits) { const h = hexes(k.colors); tot += h.length; const a = h.filter(x => !src.includes(x)).length; abs += a; if (a) kitsAbs++; }
  console.log(c.padEnd(9), "shapes:", JSON.stringify(tally), "| hex in colors:", tot, "absent from that commit's theme.js:", abs, "kits with >=1 absent:", kitsAbs);
}
const OLD = await import(`${S}/theme-0e03143.mjs`), NEW = await import(`${S}/theme-HEAD.mjs`);
const moved = [], same = [];
for (const t of NEW.CURATED) { const o = OLD.CURATED.find(x => x.id === t.id); if (!o) { moved.push(t.id + "(new)"); continue; } const a = JSON.stringify(o.colors), b = JSON.stringify(t.colors); (a === b ? same : moved).push(t.id); }
console.log("palette 0e03143 -> HEAD: kits whose colors changed:", moved.join(","), "| byte-identical colors:", same.length, "of", NEW.CURATED.length);
for (const id of moved) { const o = OLD.curated(id).colors, n = NEW.curated(id).colors; const keys = Object.keys(n).filter(k => JSON.stringify(o[k]) !== JSON.stringify(n[k])); console.log("  " + id + ": " + keys.map(k => `${k} ${JSON.stringify(o[k])}->${JSON.stringify(n[k])}`).join("; ")); }
const css = fs.readFileSync(`${W}/styles.css`, "utf8"); const map = {};
for (const m of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) { const fam = /font-family:\s*["']([^"']+)["']/.exec(m[1]), url = /url\(["']?([^"')]+)["']?\)/.exec(m[1]); if (fam && url) map[url[1].replace(/^.*\//, "")] = fam[1]; }
const faces = Object.values(JSON.parse(fs.readFileSync(`${W}/test/fixtures/watch-fonts.json`, "utf8"))).find(v => Array.isArray(v));
const byFam = {}; for (const f of faces) { const cssFam = map[String(f.source).replace(/^.*\//, "")] || "?"; (byFam[cssFam] ||= []).push(f.family); }
const mismatchAny = Object.entries(byFam).filter(([c, fs]) => fs.some(x => x !== c)), mismatchAll = Object.entries(byFam).filter(([c, fs]) => fs.every(x => x !== c));
console.log("CSS families mapped:", Object.keys(byFam).length, "| families with ANY face named differently from styles.css's font-family:", mismatchAny.length, "| ALL faces differ:", mismatchAll.length);
console.log("  any:", mismatchAny.map(([c, fs]) => c + "->" + [...new Set(fs)].join("/")).join("; "));
