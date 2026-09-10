// shapes-and-pairs.mjs — which kits were a bare count in theme.js (fixture shapes [0]), and which pairs the 16 open kits name.
import fs from "node:fs";
const root = process.argv[2];
const fx = JSON.parse(fs.readFileSync(root + "/test/fixtures/kits.json", "utf8"));
const src = fs.readFileSync(root + "/theme.js", "utf8");
const lits = [...src.matchAll(/kit\("([a-z]+)"[\s\S]*?shapes:\s*(\[[^\]]*\]|\d+)/g)].map(m => m[1] + "=" + m[2]);
console.log("theme.js RAW shapes literals (" + lits.length + "): " + lits.join(" "));
const c1 = fx.kits.filter(k => k.shapes.length === 1 && k.shapes[0] === 0).map(k => k.id);
console.log("fixture kits with shapes [0] (a bare count 1 in theme.js, ribbons only): " + c1.length + " — " + c1.join(", "));
console.log("the rest: " + fx.kits.filter(k => !(k.shapes.length === 1 && k.shapes[0] === 0)).map(k => k.id + "=" + JSON.stringify(k.shapes)).join(" "));
const open = fx.kits.filter(k => !k.secret); const pairs = new Set(open.map(k => k.pair));
console.log("pairs named by the 16 open kits: " + pairs.size + " of " + Object.keys(fx.pairs).length + " — unused by open kits: " + Object.keys(fx.pairs).filter(p => !pairs.has(p)).join(", "));
console.log("secret kits' pairs: " + fx.kits.filter(k => k.secret).map(k => k.id + "->" + k.pair).join(", "));
