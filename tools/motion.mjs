// tools/motion.mjs — a GIF of the check-off choreography at 1440×900 (1.9, proposal 4): a check-off that sinks past two rows,
// a second check-off, and the finale, on the three seed lines. Recorded from Chrome's own screencast — real frames with real
// timestamps, so the GIF plays at the speed the app runs — and assembled with sharp at half size.
// Run: node tools/serve.js 8791 . &  then  node tools/motion.mjs shots/1.9/motion-after.gif
//      BASE=http://127.0.0.1:8792/ node tools/motion.mjs shots/1.9/motion-before.gif   (an untouched clone of main on 8792)
// Prints the moments it measured (the strike, the sink, the finale) beside the file, for PLAN.md.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const sharp = require("sharp");
const BASE = process.env.BASE || "http://127.0.0.1:8791/";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(BASE)) throw new Error("motion.mjs only records a local server");
const OUT = path.resolve(process.argv[2] || "shots/1.9/motion.gif");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const SCALE = +(process.env.SCALE || 0.5), FPS = +(process.env.FPS || 30);

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
const page = await ctx.newPage(); page.setDefaultTimeout(9000);
await page.goto(BASE + "?transport=local");
await page.waitForSelector("#welcome:not([hidden])");
await page.evaluate(() => document.getElementById("w-keep").click()); // the three seed lines, as they stand (Skip starts an empty list since 1.9)
await page.waitForSelector("#p-save[open]"); await page.click("#save-done");
await page.waitForSelector("#list .row"); await page.mouse.move(720, 860); await page.waitForTimeout(1500);
// what the page itself sees, on the same clock as the frames: the strike's end, the sink's first and last frame, the finale's sound
await page.evaluate(() => {
  window.__moments = [];
  const note = (what, extra) => window.__moments.push({ t: performance.timeOrigin + performance.now(), what, ...(extra || {}) });
  document.addEventListener("pointerdown", () => note("tap"), true);
  document.addEventListener("transitionend", e => { if (e.target.classList && e.target.classList.contains("ink")) note("ink lands"); }, true);
  const first = new Map();
  new MutationObserver(() => { for (const li of document.querySelectorAll("#list .row")) { const top = li.getBoundingClientRect().top; if (first.has(li) && Math.abs(first.get(li) - top) > 2) note("row moved", { to: Math.round(top) }); first.set(li, top); } }).observe(document.getElementById("list"), { childList: true, attributes: true, subtree: true });
  const fin = document.getElementById("finale"); new MutationObserver(() => { if (fin.classList.contains("on")) note("finale card"); }).observe(fin, { attributes: true });
  const AC = window.AudioContext; const ctxs = new Set();
  const wrap = (proto, name) => { const orig = proto[name]; proto[name] = function () { note("sound: " + name); return orig.apply(this, arguments); }; };
  wrap(AC.prototype, "createOscillator"); wrap(AC.prototype, "createBufferSource");
});
const cdp = await ctx.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async f => { frames.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, "base64") }); try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) { /* stopped */ } });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1 });
const box = async i => { const b = await (await page.$(`#list .row:nth-child(${i}) .box`)).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
const tap = async i => { const p = await box(i); await page.mouse.move(p.x, p.y); await page.waitForTimeout(120); await page.mouse.down(); await page.mouse.up(); };
const rest = async () => { await page.mouse.move(720, 860); await page.waitForTimeout(900); };
await page.waitForTimeout(500);
await tap(1); await page.waitForTimeout(1500); await rest();   // the first line: a check-off, and a sink past two rows
await tap(1); await page.waitForTimeout(1500); await rest();   // the next line: a sink past one
await tap(1); await page.waitForTimeout(2600);                 // the last line: the finale
await cdp.send("Page.stopScreencast"); await page.waitForTimeout(300);
const moments = await page.evaluate(() => window.__moments);
await browser.close();

// real timing, at most FPS frames a second, the last frame held
frames.sort((a, b) => a.t - b.t);
const kept = []; let last = -1;
for (const f of frames) { if (last < 0 || f.t - last >= 1 / FPS - 0.003) { kept.push(f); last = f.t; } }
const delays = kept.map((f, i) => i + 1 < kept.length ? Math.max(20, Math.round((kept[i + 1].t - f.t) * 1000)) : 1500);
const imgs = await Promise.all(kept.map(f => sharp(f.data).resize(Math.round(1440 * SCALE)).png().toBuffer()));
await sharp(imgs, { join: { animated: true } }).gif({ delay: delays, loop: 0, effort: 7, colours: 128, dither: 0.3, interFrameMaxError: 6 }).toFile(OUT);
const size = fs.statSync(OUT).size;
console.log(`${path.relative(process.cwd(), OUT)}: ${kept.length} frames of ${frames.length} over ${((kept[kept.length - 1].t - kept[0].t)).toFixed(2)} s, ${Math.round(size / 1024)} KB`);
// the moments, relative to each tap (ms)
let t0 = null; const rows = [];
for (const m of moments) { if (m.what === "tap") { t0 = m.t; rows.push("tap"); continue; } if (t0 === null) continue; rows.push(`  +${Math.round(m.t - t0)} ${m.what}${m.to !== undefined ? " (top " + m.to + ")" : ""}`); }
console.log(rows.join("\n"));
