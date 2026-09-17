// tools/grain.mjs — the grain rule, measured (1.12 b262). An Extra kit's ground is a picture built only from the
// kit's `grain`, and test/theme.test.js holds every grain hex to the kit's contrast floors. That leaves one thing a
// flat hex cannot say: that the picture the browser actually rasterises — blurs, gradients, quantised noise, the
// cover-scaling of an SVG — never puts a pixel outside the grain's range of luminance. This draws exactly what the
// page draws (extrafx.js groundSvg, the same data: URI) onto a canvas at both viewports, reads every pixel back,
// and prints the darkest and the lightest against the grain's darkest and lightest, plus the worst contrast the
// kit's text, accent and secondaries reach on the ground as rendered.
// Run: node tools/serve.js 8791 . &  then  node tools/grain.mjs        (BASE=… for another port; exits 1 on a breach)
import { createRequire } from "node:module";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8791/";
const TOL = 0.0065; // luminance: one sRGB step of the green channel at the light end is 0.0063 (251 → 252), which is the
                    // rounding a premultiplied gradient or blur is allowed; anything past one step is a colour that is not in the grain
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto(BASE + "?transport=local");
const rows = await page.evaluate(async ({ TOL }) => {
  const T = await import("./theme.js"), X = await import("./extrafx.js");
  const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const hexLum = h => lum(...[1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  const out = [];
  for (const kit of T.EXTRA) {
    const url = X.groundUrl(kit);
    for (const [w, h] of [[1440, 900], [390, 844]]) {
      const img = new Image(); img.src = url; await img.decode();
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.fillStyle = kit.grain[0]; g.fillRect(0, 0, w, h);
      // background-size: cover, centred — what #field.ground does with the same picture
      const iw = img.width || 1600, ih = img.height || 1000, s = Math.max(w / iw, h / ih);
      g.drawImage(img, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s);
      const d = g.getImageData(0, 0, w, h).data;
      let lo = 1, hi = 0, loPx = "", hiPx = "";
      for (let i = 0; i < d.length; i += 4) { const L = lum(d[i], d[i + 1], d[i + 2]); if (L < lo) { lo = L; loPx = [d[i], d[i + 1], d[i + 2]].join(","); } if (L > hi) { hi = L; hiPx = [d[i], d[i + 1], d[i + 2]].join(","); } }
      const gl = kit.grain.map(hexLum), gLo = Math.min(...gl), gHi = Math.max(...gl);
      const extreme = kit.base === "dark" ? hi : lo; // the ground pixel every token reads worst against
      const worst = {};
      for (const k of ["text", "muted", "dim", "done", "accent", "accentText", "danger", "hairSolid"]) worst[k] = +contrast(hexLum(kit.colors[k]), extreme).toFixed(2);
      out.push({ kit: kit.id, viewport: w + "×" + h, pixels: (w * h), lo: +lo.toFixed(4), hi: +hi.toFixed(4), loPx, hiPx, grainLo: +gLo.toFixed(4), grainHi: +gHi.toFixed(4), inside: lo >= gLo - TOL && hi <= gHi + TOL, worst, bytes: url.length });
    }
  }
  return out;
}, { TOL });
const FLOORS = { text: 4.5, muted: 4.5, dim: 4.5, done: 4.5, accent: 3, accentText: 4.5, danger: 4.5, hairSolid: 3 };
let ok = true;
for (const r of rows) {
  ok = ok && r.inside;
  for (const [k, f] of Object.entries(FLOORS)) if (r.worst[k] < f) { ok = false; console.error(`${r.kit}: ${k} is ${r.worst[k]} on the ground as drawn, under ${f}`); }
  console.log(`${r.kit.padEnd(11)} ${r.viewport.padEnd(9)} ${r.pixels} px  rendered lum ${r.lo}…${r.hi} (rgb ${r.loPx} … ${r.hiPx})  grain lum ${r.grainLo}…${r.grainHi}  ${r.inside ? "inside" : "OUTSIDE"}  worst on the ground as drawn: ${Object.entries(r.worst).map(([k, v]) => k + " " + v).join(", ")}  (ground ${r.bytes} bytes as a data: URI)`);
}
await browser.close();
if (!ok) { console.error("a ground put a pixel outside its grain"); process.exit(1); }
