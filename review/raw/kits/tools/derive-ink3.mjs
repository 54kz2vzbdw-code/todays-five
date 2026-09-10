// derive-ink3.mjs — how many derived accents sit under 3:1 on --ink-3 at head, with the theme suite's own LCG (seed 4242) and with a second seed.
import { pathToFileURL } from "node:url";
const T = await import(pathToFileURL(process.argv[2]).href);
for (const seed0 of [4242, 20260907]) {
  let seed = seed0; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const hex = () => "#" + [0, 0, 0].map(() => Math.floor(rnd() * 256).toString(16).padStart(2, "0")).join("").toUpperCase();
  for (const base of ["dark", "light"]) {
    let under = 0, worst = Infinity, worstHex = "", underD = 0;
    for (let i = 0; i < 3000; i++) { const a = hex(); const t = T.derive({ accent: a, base }); const c = T.contrast(t.colors.accent, t.colors.ink3); if (c < 3) under++; if (c < worst) { worst = c; worstHex = a; } if (T.contrast(t.colors.danger, t.colors.ink3) < 4.5) underD++; }
    console.log(`seed ${seed0} ${base}: accent under 3:1 on ink3 = ${under}/3000 (worst ${worst.toFixed(2)} from ${worstHex}); danger under 4.5:1 on ink3 = ${underD}/3000`);
  }
}
