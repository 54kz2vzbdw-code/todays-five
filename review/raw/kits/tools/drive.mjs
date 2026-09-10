// drive.mjs — mean per-channel linear drive of a screenshot at gamma 2.2, several weightings; share of pixels exactly the ground;
// the bounding box of pure-white pixels in the top-right quadrant (the system clock); the colour under that box and its contrast with white.
// usage: node drive.mjs <png> <ground hex> [scrim hex]
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { PNG } = require("pngjs");
const [,, file, groundHex, scrimHex] = process.argv;
const png = PNG.sync.read(fs.readFileSync(file));
const { width: w, height: h, data } = png;
const rgb = hx => [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16));
const g = rgb(groundHex);
const lin = v => Math.pow(v / 255, 2.2);
let sum = [0, 0, 0], ground = 0, n = w * h;
let minx = w, miny = h, maxx = -1, maxy = -1, whites = 0;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const i = (y * w + x) * 4, r = data[i], gg = data[i + 1], b = data[i + 2];
  sum[0] += lin(r); sum[1] += lin(gg); sum[2] += lin(b);
  if (r === g[0] && gg === g[1] && b === g[2]) ground++;
  if (r === 255 && gg === 255 && b === 255 && x >= w / 2 && y < h / 2) { whites++; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
}
const m = sum.map(s => s / n);
const flat = (m[0] + m[1] + m[2]) / 3, luma = 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2], maxc = Math.max(...m);
console.log(`${file.split("/").pop()}: ${w}x${h} px; drive flat=${flat.toFixed(4)} luma709=${luma.toFixed(4)} maxChannel=${maxc.toFixed(4)} (R ${m[0].toFixed(4)} G ${m[1].toFixed(4)} B ${m[2].toFixed(4)}); exactly ground ${groundHex}: ${ground}/${n} = ${(100 * ground / n).toFixed(1)}%`);
if (maxx >= 0) {
  console.log(`  pure-white pixels in the top-right quadrant: ${whites}, bbox px x ${minx}–${maxx}, y ${miny}–${maxy} (pt at 2x: ${(minx / 2).toFixed(1)},${(miny / 2).toFixed(1)}–${(maxx / 2).toFixed(1)},${(maxy / 2).toFixed(1)})`);
  // the colour under/around the clock: the most common non-white colour inside the bbox expanded by 4 px
  const tally = new Map();
  for (let y = Math.max(0, miny - 4); y <= Math.min(h - 1, maxy + 4); y++) for (let x = Math.max(0, minx - 4); x <= Math.min(w - 1, maxx + 4); x++) {
    const i = (y * w + x) * 4, key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    if (key === "255,255,255") continue; tally.set(key, (tally.get(key) || 0) + 1);
  }
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const L = c => { const l = c.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
  for (const [k, c] of top) { const v = k.split(",").map(Number); const hex = "#" + v.map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase(); console.log(`  under/around the clock: ${hex} x${c} → white on it ${(1.05 / (L(v) + 0.05)).toFixed(2)}:1`); }
  if (scrimHex) { const s = rgb(scrimHex); console.log(`  white on the scrim colour ${scrimHex}: ${(1.05 / (L(s) + 0.05)).toFixed(2)}:1; white on the ground ${groundHex}: ${(1.05 / (L(g) + 0.05)).toFixed(2)}:1`); }
} else console.log("  no pure-white pixels in the top-right quadrant");
