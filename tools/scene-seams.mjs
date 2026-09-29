// tools/scene-seams.mjs — 1.12 b367: the forever cycle's promises, read off the lab (tools/scene-lab.html: the real stage,
// held at any moment of any pass). Seamless: the last frame of each pass against the first of the next, which should be
// the same picture but for what drifts with the wall clock in a thirtieth of a second. At rest: the quiet picture before
// each pass (the list in use), the same every time — or, for a scene that carries its picture from one pass into the
// next, the one the pass before it ended on. Never the same twice running: the same seconds of two passes side by side,
// which should differ somewhere. Each is the share of the screen's pixels that differ by more than an eighth of the
// range in any channel. For finding what to look at; the numbers are not a test.
// Run: node tools/serve.js 8791 . &  then  node tools/scene-seams.mjs <kit,kit,…> [phone,desktop] [passes=6] [first=0]
import { createRequire } from "node:module";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const BASE = process.env.BASE || "http://127.0.0.1:8791/";
const [, , kits = "forest", vps = "phone,desktop", n = "6", first = "0"] = process.argv;
const VP = { phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, desktop: { viewport: { width: 1440, height: 900 } } };
const LOOP = 15, FRAME = 1 / 30, SAMPLE = [2, 5, 8, 11];
const diff = (a, b) => { let d = 0; for (let i = 0; i < a.data.length; i += 4) if (Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2])) > 32) d++; return d / (a.width * a.height); };
const pct = v => (v * 100).toFixed(2).padStart(6) + " %";
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const vp of vps.split(",")) for (const kit of kits.split(",")) {
  const ctx = await browser.newContext(VP[vp]); const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/^Failed to load resource/.test(m.text())) errs.push(m.text()); });
  page.on("response", r => { if (r.status() >= 400 && !/favicon\.ico$|\/tools\/scenes\.css$/.test(r.url())) errs.push(r.status() + " " + r.url()); }); // the lab has no icon, and no list for scenes.css to dress
  await page.goto(BASE + "tools/scene-lab.html?scene=" + kit + "&visit=1"); await page.waitForFunction(() => window.labReady, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const carry = await page.evaluate(() => !!(window.stage && window.stage.state && window.stage.state().carry));
  /** pass p at loop time t, idle i, on a wall clock that runs on through the passes */
  const shot = async (p, t, i = 1) => { await page.evaluate(([t, i, a, p]) => window.seek(t, i, a, -1, "", p), [t, i, 12 + (p - +first) * LOOP + t, p]); return PNG.sync.read(await page.screenshot()); };
  const rows = [];
  let worstSeam = 0, restDrift = 0, sameRuns = 0;
  const rest0 = await shot(+first, 0, 0);
  for (let p = +first; p < +first + +n; p++) {
    const end = await shot(p, LOOP - FRAME), next = await shot(p + 1, 0);
    const seam = diff(end, next); worstSeam = Math.max(worstSeam, seam);
    const rest = await shot(p + 1, 0, 0), rd = carry ? diff(rest, end) : diff(rest, rest0); restDrift = Math.max(restDrift, rd);
    const vary = []; for (const t of SAMPLE) vary.push(diff(await shot(p, t), await shot(p + 1, t)));
    if (Math.max(...vary) < .01) sameRuns++;
    rows.push(`  pass ${String(p).padStart(3)} → ${String(p + 1).padEnd(4)} seam ${pct(seam)}   at rest ${pct(rd)}   the same seconds apart: ${vary.map(pct).join(" ")}`);
  }
  console.log(`== ${kit} ${vp}${carry ? " (carries its picture)" : ""}: the worst seam ${pct(worstSeam)}, the rest drifts ${pct(restDrift)}, ${sameRuns} of ${n} passes like the one before${errs.length ? "  ERRORS: " + errs.join(" | ") : ""}`);
  console.log(rows.join("\n"));
  await ctx.close();
}
await browser.close();
