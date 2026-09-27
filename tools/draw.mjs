// tools/draw.mjs — GIFs of the strike drawn by hand (motion-1), at 390×844 with a real finger (CDP touch), recorded from
// Chrome's own screencast so they play at the speed the app runs, and cropped to the lines. One GIF per scene:
//   paper       a slow stroke, a fast one on the next line, and a short one that pulls back
//   terminal    the line that wraps, drawn in one pass (both lines struck at the finger's x), then a fast one
//   pink        a slow stroke and a fast one: the gradient ink revealed by a clip, never squashed
//   chalkboard  a slow stroke and a fast one: the masked chalk, held visible while it is drawn
//   gestures    Paper again: a swipe left is still Not today, and a hold still opens the menu
// Run: node tools/serve.js 8795 . &  then  BASE=http://127.0.0.1:8795/ node tools/draw.mjs shots/motion-1 [scene,scene]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const sharp = require("sharp");
const BASE = process.env.BASE || "http://127.0.0.1:8795/";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(BASE)) throw new Error("draw.mjs only records a local server");
const OUT = path.resolve(process.argv[2] || "shots/motion-1");
const ONLY = (process.argv[3] || "").split(",").filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });
const FPS = 30, W = 390, H = 844, CROP = { top: 200, height: 460 };
const wait = ms => new Promise(r => setTimeout(r, ms));
const KIT = { paper: ["day", "paper"], terminal: ["night", "terminal"], pink: ["night", "pink"], chalkboard: ["night", "chalkboard"], gestures: ["day", "paper"] };

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
for (const scene of Object.keys(KIT)) {
  if (ONLY.length && !ONLY.includes(scene)) continue;
  const [slot, kit] = KIT[scene];
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, colorScheme: slot === "day" ? "light" : "dark" });
  const device = { day: "T1:curated:paper", night: "T1:curated:terminal", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }, extras: kit === "chalkboard" ? ["chalk"] : [] };
  device[slot] = "T1:curated:" + kit;
  await ctx.addInitScript(`try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: ${JSON.stringify(device)} })); } catch (e) {}`);
  const page = await ctx.newPage(); page.setDefaultTimeout(9000);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(BASE + "?transport=local");
  await page.waitForSelector("#welcome:not([hidden])");
  await page.evaluate(() => document.getElementById("w-keep").click()); await page.waitForSelector("#p-save[open]"); await page.click("#save-done");
  await page.waitForSelector("#list .row"); await wait(1600); // the save sheet gone, motion.js in
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  const frames = [];
  cdp.on("Page.screencastFrame", async f => { frames.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, "base64") }); try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) { /* stopped */ } });
  const words = async n => page.$eval(`#list .row:nth-child(${n}) .tx`, e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  /** a stroke across line n to `frac` of its words, in `ms` */
  const stroke = async (n, frac, ms) => {
    const b = await words(n), y = b.y + Math.min(b.h, 34) / 2, x0 = b.x + 4, x1 = b.x + 4 + (b.w + 16) * frac, steps = Math.max(6, Math.round(ms / 16));
    await touch("touchStart", x0, y);
    for (let i = 1; i <= steps; i++) { await touch("touchMove", x0 + (x1 - x0) * i / steps, y); await wait(ms / steps); }
    await touch("touchEnd");
  };
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });
  await wait(500);
  if (scene === "paper") { await stroke(1, 1, 1100); await wait(1300); await stroke(1, 1, 180); await wait(1300); await stroke(1, 0.4, 500); await wait(1100); }
  else if (scene === "terminal") { await stroke(1, 1, 1300); await wait(1300); await stroke(1, 1, 200); await wait(1300); }
  else if (scene === "pink" || scene === "chalkboard") { await stroke(1, 1, 1100); await wait(1300); await stroke(1, 1, 180); await wait(1400); }
  else if (scene === "gestures") {
    const b = await words(1), y = b.y + Math.min(b.h, 34) / 2, x = b.x + b.w * 0.7;
    await touch("touchStart", x, y); for (let i = 1; i <= 14; i++) { await touch("touchMove", x - 150 * i / 14, y); await wait(18); } await touch("touchEnd"); await wait(1500);
    const c = await words(1), cy = c.y + Math.min(c.h, 34) / 2;
    await touch("touchStart", c.x + 40, cy); await wait(700); await touch("touchEnd"); await wait(1400);
  }
  await cdp.send("Page.stopScreencast"); await wait(250);
  await cdp.detach(); await ctx.close();
  frames.sort((a, b) => a.t - b.t);
  const kept = []; let last = -1;
  for (const f of frames) if (last < 0 || f.t - last >= 1 / FPS - 0.003) { kept.push(f); last = f.t; }
  const delays = kept.map((f, i) => (i + 1 < kept.length ? Math.max(20, Math.round((kept[i + 1].t - f.t) * 1000)) : 1200));
  const imgs = await Promise.all(kept.map(f => sharp(f.data).extract({ left: 0, top: CROP.top, width: W, height: CROP.height }).png().toBuffer()));
  const file = path.join(OUT, scene + ".gif");
  await sharp(imgs, { join: { animated: true } }).gif({ delay: delays, loop: 0, effort: 7, colours: 96, dither: 0.3, interFrameMaxError: 6 }).toFile(file);
  console.log(`${path.relative(process.cwd(), file)}: ${kept.length} frames over ${(kept[kept.length - 1].t - kept[0].t).toFixed(2)} s, ${Math.round(fs.statSync(file).size / 1024)} KB${errors.length ? ", page errors: " + errors.join(" | ") : ""}`);
}
await browser.close();
