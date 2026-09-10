#!/usr/bin/env node
// firstpaint.mjs — INK review instrument. Seeds a browser context the way a returning device is left by main's build
// (tf/v2/themecss computed by MAIN's derive() for a made T2: theme, tf/v2/themerev = PALETTE_REV, the device's slots on
// that code), loads the served tree, and records --accent on every animation frame from the first one, at
// DOMContentLoaded, at load, and afterwards; then reads what the cache holds after that load, and reloads once more.
// Scenarios: A normal load; B the same with app.js blocked (what the boot script alone paints); C the same as A with
// a stamp that does not match (what a re-stamp would do instead); D the second load after A (the refreshed cache).
//
// usage: node firstpaint.mjs --base http://127.0.0.1:8893/ --mainTheme <main's theme.js> --hex 11735B --themeBase dark --label branch --out <dir>
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { chromium } = require("playwright");

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith("--") ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true] : []).filter(Boolean));
const BASE = args.base, LABEL = args.label || "tree", OUT = args.out; fs.mkdirSync(OUT, { recursive: true });
const MAIN = await import(pathToFileURL(args.mainTheme).href);
const hex = "#" + args.hex, base = args.themeBase || "dark";
const code = MAIN.themeCode(MAIN.derive({ accent: hex, base, name: "Worst" }));
const staleCss = MAIN.cssText(MAIN.parseCode(code));
const staleAccent = /--accent:([^;]+);/.exec(staleCss)[1];
const wait = ms => new Promise(r => setTimeout(r, ms));
const accentOf = css => { const m = /--accent:([^;]+);/.exec(css || ""); return m ? m[1] : null; };

const recorder = `(() => { const frames = []; window.__inkFrames = frames;
  const read = () => { try { return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "(empty)"; } catch (e) { return "ERR"; } };
  const tick = () => { frames.push([Math.round(performance.now()), read()]); if (frames.length < 300) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  document.addEventListener("DOMContentLoaded", () => { window.__inkDCL = [Math.round(performance.now()), read()]; });
  window.addEventListener("load", () => { window.__inkLoad = [Math.round(performance.now()), read()]; });
})();`;
// Seeded ONCE per context: an init script runs on every navigation, and re-seeding on the reload would put the stale
// cache back and hide exactly what the second load is meant to show (the cache app.js rewrote on the first load).
const seed = (rev) => `try { if (!localStorage.getItem("ink-review/seeded")) { localStorage.setItem("ink-review/seeded", "1");
  localStorage.setItem("tf/v2/themecss", ${JSON.stringify(staleCss)}); localStorage.setItem("tf/v2/themerev", ${JSON.stringify(rev)});
  if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: { day: ${JSON.stringify(code)}, night: ${JSON.stringify(code)}, switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" } } })); } } catch (e) {}`;
const runs = s => { const out = []; for (const [t, a] of s) { const last = out[out.length - 1]; if (last && last.accent === a) { last.frames++; last.until = t; } else out.push({ accent: a, from: t, until: t, frames: 1 }); } return out; };

const browser = await chromium.launch({ channel: "chrome", headless: true });
const report = { label: LABEL, base, code, staleAccent, paletteRev: MAIN.PALETTE_REV, scenarios: {} };
async function scenario(name, { rev, blockApp = false, reloadAfter = false }) {
  const ctx = await browser.newContext({ colorScheme: base === "dark" ? "dark" : "light", viewport: { width: 1000, height: 800 } });
  await ctx.addInitScript(seed(rev) + "\n" + recorder);
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  if (blockApp) await page.route(/\/app\.js(\?.*)?$/, r => r.abort());
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  const t0 = Date.now();
  await page.goto(BASE + "?transport=local", { waitUntil: "load" }); await wait(1500);
  const read = () => page.evaluate(() => ({ frames: window.__inkFrames, dcl: window.__inkDCL || null, load: window.__inkLoad || null, now: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(), stamp: document.documentElement.getAttribute("data-tokens-rev"), cacheAccent: (() => { const m = /--accent:([^;]+);/.exec(localStorage.getItem("tf/v2/themecss") || ""); return m ? m[1] : null; })(), cacheRev: localStorage.getItem("tf/v2/themerev"), theme: document.documentElement.dataset.theme }));
  const first = await read();
  const res = { blockApp, seededRev: rev, firstFrame: first.frames[0], runs: runs(first.frames), atDOMContentLoaded: first.dcl, atLoad: first.load, after1500ms: first.now, cacheAfter: { accent: first.cacheAccent, rev: first.cacheRev }, pageStamp: first.stamp, themeId: first.theme, pageErrors: errors.slice() };
  if (reloadAfter) { await page.reload({ waitUntil: "load" }); await wait(1000); const second = await read(); res.secondLoad = { firstFrame: second.frames[0], runs: runs(second.frames), after1000ms: second.now, cacheAfter: { accent: second.cacheAccent, rev: second.cacheRev } }; }
  res.wallMs = Date.now() - t0;
  report.scenarios[name] = res; await ctx.close();
}
await scenario("A_normal_then_reload", { rev: MAIN.PALETTE_REV, reloadAfter: true });
await scenario("B_appjs_blocked", { rev: MAIN.PALETTE_REV, blockApp: true });
await scenario("C_stamp_mismatch", { rev: "stale00" });
await browser.close();
fs.writeFileSync(path.join(OUT, `firstpaint-${LABEL}-${args.hex}-${base}.json`), JSON.stringify(report, null, 2) + "\n");
console.log(`[${LABEL}] ${base} code accent ${hex} → main's derive gives --accent ${staleAccent}; PALETTE_REV ${MAIN.PALETTE_REV}`);
for (const [k, s] of Object.entries(report.scenarios)) {
  console.log(`  ${k}: first frame ${JSON.stringify(s.firstFrame)}; runs ${s.runs.map(r => `${r.accent}×${r.frames} (${r.from}–${r.until}ms)`).join(" → ")}; DCL ${JSON.stringify(s.atDOMContentLoaded)}; load ${JSON.stringify(s.atLoad)}; after 1.5s ${s.after1500ms}; cache now ${s.cacheAfter.accent} @${s.cacheAfter.rev}; page stamp ${s.pageStamp}; errors ${s.pageErrors.length}`);
  if (s.secondLoad) console.log(`     second load: first frame ${JSON.stringify(s.secondLoad.firstFrame)}; runs ${s.secondLoad.runs.map(r => `${r.accent}×${r.frames}`).join(" → ")}; cache ${s.secondLoad.cacheAfter.accent}`);
}
