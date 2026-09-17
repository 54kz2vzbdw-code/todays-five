// tools/idle.mjs — what a list left on screen costs while nothing happens, per kit: Chrome's own per-renderer
// TaskDuration (Performance.getMetrics over CDP) sampled at the start and the end of a quiet window, as a share of
// one core, plus the style-recalc part of it. The instrument the 1.8 sparkle field's number was read off
// (PLAN.md, "The sparkle field"), so the numbers compare.
// Run: node tools/serve.js 8791 . &  then  node tools/idle.mjs [seconds=300] [kit,kit,…]   (WORD=… unlocks first)
import { createRequire } from "node:module";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8791/";
const SECONDS = +(process.argv[2] || 300);
const KITS = (process.argv[3] || "dark,chalkboard,whiteboard").split(",");
const WORDS = (process.env.WORD || "").split(",").filter(Boolean);
const browser = await chromium.launch({ channel: "chrome", headless: true });
console.log(`kit          window   TaskDuration   style recalc   share of one core`);
for (const kit of KITS) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
  const page = await ctx.newPage(); page.setDefaultTimeout(9000);
  await page.goto(BASE + "?transport=local"); await page.waitForSelector("#welcome:not([hidden])");
  await page.evaluate(() => document.getElementById("w-keep").click()); await page.waitForSelector("#p-save[open]"); await page.click("#save-done");
  await page.waitForSelector("#list .row"); await page.waitForTimeout(600);
  await page.click("#more"); await page.click('#p-menu [data-act="settings"]'); await page.waitForSelector("#p-settings[open]"); await page.click('[data-set="night"]'); await page.waitForSelector("#p-theme[open]");
  for (const w of WORDS) { if (!(await page.$("#p-builder[open]"))) { await page.click("#sw-build"); await page.waitForSelector("#p-builder[open]"); await page.waitForTimeout(200); } await page.fill("#c-import", w); await page.click("#c-import-go"); await page.waitForTimeout(800); }
  await page.click(`.swatch[data-code="T1:curated:${kit}"]`); await page.waitForTimeout(500);
  await page.keyboard.press("Escape"); for (let i = 0; i < 4; i++) { await page.waitForTimeout(150); if (!(await page.$("dialog.panel[open]"))) break; await page.keyboard.press("Escape"); }
  await page.mouse.move(2, 2); await page.waitForTimeout(6000); // past the idle preload and the crossfade
  const cdp = await ctx.newCDPSession(page); await cdp.send("Performance.enable");
  const read = async () => { const { metrics } = await cdp.send("Performance.getMetrics"); const m = Object.fromEntries(metrics.map(x => [x.name, x.value])); return { task: m.TaskDuration, recalc: m.RecalcStyleDuration, at: m.Timestamp }; };
  const a = await read(); await page.waitForTimeout(SECONDS * 1000); const b = await read();
  const wall = b.at - a.at, task = b.task - a.task, recalc = b.recalc - a.recalc;
  const on = await page.evaluate(() => window.__tf().theme);
  console.log(`${on.padEnd(12)} ${wall.toFixed(0).padStart(4)} s   ${(task * 1000).toFixed(0).padStart(6)} ms   ${(recalc * 1000).toFixed(0).padStart(8)} ms   ${(task / wall * 100).toFixed(3)} %`);
  await ctx.close();
}
await browser.close();
