// tools/scene-frames.mjs — 1.12 b321: a scene's moments on one sheet, from tools/scene-lab.html (the real stage, held at
// each moment with seek): the quiet picture, the loop at the seconds asked for, and the finale at three points, each
// with its label, tiled a third of their size. One PNG per kit and viewport. For looking, not for asserting.
// Run: node tools/serve.js 8791 . &  then  node tools/scene-frames.mjs <kit,kit,…> [out=.] [phone,desktop] [seconds]
import { createRequire } from "node:module";
import fs from "node:fs";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const BASE = process.env.BASE || "http://127.0.0.1:8791/";
const [, , kits = "forest", out = ".", vps = "phone,desktop", secs = "0,1.5,3,4.5,6,7.5,9,10.5,12,13.5"] = process.argv;
const VP = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, desktop: { viewport: { width: 1440, height: 900 } } };
const K = 3, COLS = 4; // a third of the size, four across
const shrink = (img, k) => { const w = Math.floor(img.width / k), h = Math.floor(img.height / k), o = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const acc = [0, 0, 0, 0]; for (let dy = 0; dy < k; dy++) for (let dx = 0; dx < k; dx++) { const i = ((y * k + dy) * img.width + x * k + dx) * 4; for (let c = 0; c < 4; c++) acc[c] += img.data[i + c]; } const j = (y * w + x) * 4; for (let c = 0; c < 4; c++) o.data[j + c] = Math.round(acc[c] / (k * k)); }
  return o; };
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const vp of vps.split(",")) for (const kit of kits.split(",")) {
  const ctx = await browser.newContext(VP[vp]); const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(BASE + "tools/scene-lab.html?scene=" + kit); await page.waitForFunction(() => window.labReady, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const moments = [{ t: 0, i: 0, f: -1, label: "quiet" }, ...secs.split(",").map(Number).map(t => ({ t, i: 1, f: -1, label: t + " s" })), ...[.18, .45, .72].map(f => ({ t: 0, i: 0, f, label: "finale " + f }))];
  const shots = [];
  for (const m of moments) { await page.evaluate(m => window.seek(m.t, m.i, 12 + m.t, m.f, m.label), m); shots.push(shrink(PNG.sync.read(await page.screenshot()), K)); }
  const w = shots[0].width, h = shots[0].height, rows = Math.ceil(shots.length / COLS), sheet = new PNG({ width: w * COLS, height: h * rows });
  shots.forEach((s, n) => PNG.bitblt(s, sheet, 0, 0, w, h, (n % COLS) * w, Math.floor(n / COLS) * h));
  fs.writeFileSync(`${out}/${kit}-${vp}.png`, PNG.sync.write(sheet));
  console.log(`${kit} ${vp}: ${shots.length} moments → ${out}/${kit}-${vp}.png${errs.length ? "  ERRORS: " + errs.join(" | ") : ""}`);
  await ctx.close();
}
await browser.close();
