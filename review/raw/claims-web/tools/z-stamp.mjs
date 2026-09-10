// z-stamp.mjs — 59ef2ee's stamp refusal, re-measured locally (no backend, ?transport=local, service workers blocked):
// seed tf/v2/themecss with Paper's tokens through the page's own theme.js, vary tf/v2/themerev, block app.js so nothing
// corrects the boot script afterwards, and read --ink at first paint. Paper's --ink is #F7F2E8; the inline default's is #070A08.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:8894/";
setTimeout(() => { console.log("TIMEOUT after 120 s"); process.exit(3); }, 120000).unref();
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const ctx = await browser.newContext({ serviceWorkers: "block" });
const page = await ctx.newPage();
await page.goto(BASE + "?transport=local", { waitUntil: "load" });
const seed = await page.evaluate(async () => { const T = await import("./theme.js"); T.applyTheme(T.curated("paper"), document, { persist: true }); return { css: localStorage.getItem("tf/v2/themecss"), rev: localStorage.getItem("tf/v2/themerev"), attr: document.documentElement.getAttribute("data-tokens-rev") }; });
console.log("seed: themerev=" + seed.rev + " data-tokens-rev=" + seed.attr + " themecss starts " + JSON.stringify((seed.css || "").slice(0, 32)) + " (" + (seed.css || "").length + " chars)");
await ctx.close();
for (const [label, rev] of [["b158 stamp (bogus)", "b158"], ["no stamp", null], ["current stamp", seed.rev]]) {
  const c = await browser.newContext({ serviceWorkers: "block" });
  await c.route(/\/app\.js(\?.*)?$/, r => r.abort());
  const p = await c.newPage();
  await p.addInitScript(({ css, rev }) => { try { localStorage.setItem("tf/v2/themecss", css); if (rev === null) localStorage.removeItem("tf/v2/themerev"); else localStorage.setItem("tf/v2/themerev", rev); } catch (e) {} }, { css: seed.css, rev });
  await p.goto(BASE + "?transport=local", { waitUntil: "domcontentloaded" });
  const r = await p.evaluate(() => ({ ink: getComputedStyle(document.documentElement).getPropertyValue("--ink").trim(), base: document.documentElement.getAttribute("data-base"), rev: localStorage.getItem("tf/v2/themerev") }));
  const verdict = r.ink.toUpperCase() === "#F7F2E8" ? "the cache (trusted)" : r.ink.toUpperCase() === "#070A08" ? "the inline default (refused)" : "?";
  console.log(label.padEnd(20) + " -> --ink " + r.ink + "  data-base=" + r.base + "  themerev now=" + r.rev + "  => " + verdict);
  await c.close();
}
await browser.close();
