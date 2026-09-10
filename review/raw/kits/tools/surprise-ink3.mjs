// surprise-ink3.mjs — the "Surprise me over 2,000 themes moved 0" claim, tested directly at HEAD:
// 2,000 surprise() themes (theme.js's own seeded LCG), how many have accent < 3:1 or danger < 4.5:1 on --ink-3.
import { pathToFileURL } from "node:url";
const T = await import(pathToFileURL(process.argv[2]).href);
for (const seed0 of [4242, 20260907]) {
  let seed = seed0; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  let underA = 0, underD = 0, worst = Infinity, worstId = "", shape = "";
  const bases = { dark: 0, light: 0 };
  for (let i = 0; i < 2000; i++) {
    let t = T.surprise(rnd);
    if (!shape) shape = Object.keys(t).join(",");
    if (!t.colors) t = T.derive(t);
    bases[t.base] = (bases[t.base] || 0) + 1;
    const a = T.contrast(t.colors.accent, t.colors.ink3), d = T.contrast(t.colors.danger, t.colors.ink3);
    if (a < 3) underA++; if (d < 4.5) underD++;
    if (a < worst) { worst = a; worstId = `${t.colors.accent} on ${t.base}`; }
  }
  console.log(`seed ${seed0}: surprise() returns {${shape}}; bases ${JSON.stringify(bases)}; accent under 3:1 on ink3 = ${underA}/2000 (worst ${worst.toFixed(3)} ${worstId}); danger under 4.5:1 on ink3 = ${underD}/2000`);
}
// and the same with Math.random, once, so the seeded LCG is not the story
let underA = 0; for (let i = 0; i < 2000; i++) { let t = T.surprise(); if (!t.colors) t = T.derive(t); if (T.contrast(t.colors.accent, t.colors.ink3) < 3) underA++; }
console.log(`Math.random: accent under 3:1 on ink3 = ${underA}/2000`);
