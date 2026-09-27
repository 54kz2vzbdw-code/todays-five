// tools/endings.mjs — a GIF of each curated kit's finale (1.12 b293) at 390×844 on a phone: the list's last line tapped,
// the kit's own ending recorded from Chrome's screencast (real frame timing) and cropped to the lower half, where the
// line and the confetti are. One GIF per kit into the folder given.
// Run: node tools/serve.js 8796 . &  then  BASE=http://127.0.0.1:8796/ node tools/endings.mjs shots/endings [kit,kit]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const sharp = require("sharp");
const BASE = process.env.BASE || "http://127.0.0.1:8796/";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(BASE)) throw new Error("endings.mjs only records a local server");
const OUT = path.resolve(process.argv[2] || "shots/endings");
const KITS = (process.argv[3] || "paper,terminal,pink,midnight,harbor,dusk,ember,sketch,arcade,light").split(",").filter(Boolean);
const LIGHT = new Set(["light", "paper", "harbor", "blush", "teletype", "sketch"]);
fs.mkdirSync(OUT, { recursive: true });
const FPS = 30, W = 390, H = 844, CROP = { top: 360, height: 484 };
const wait = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const kit of KITS) {
  const slot = LIGHT.has(kit) ? "day" : "night";
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, colorScheme: slot === "day" ? "light" : "dark" });
  const device = { day: "T1:curated:paper", night: "T1:curated:terminal", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" } }; device[slot] = "T1:curated:" + kit;
  await ctx.addInitScript(`try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: ${JSON.stringify(device)} })); } catch (e) {}`);
  const page = await ctx.newPage();
  await page.goto(BASE + "?transport=local");
  await page.waitForSelector("#welcome:not([hidden])");
  await page.evaluate(() => document.getElementById("w-keep").click()); await page.waitForSelector("#p-save[open]"); await page.click("#save-done");
  await page.waitForSelector("#list .row"); await wait(2800);
  const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(200); }
  for (let k = 0; k < 2; k++) { await page.tap("#list .row:not(.done) .tx"); await wait(700); }
  await wait(4200); // the Done toast gone, so the ending is seen on its own
  const cdp = await ctx.newCDPSession(page), frames = [];
  cdp.on("Page.screencastFrame", async f => { frames.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, "base64") }); try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) { /* stopped */ } });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });
  await wait(300); await page.tap("#list .row:not(.done) .tx"); await wait(3200);
  await cdp.send("Page.stopScreencast"); await wait(200); await cdp.detach(); await ctx.close();
  frames.sort((a, b) => a.t - b.t);
  const kept = []; let last = -1;
  for (const f of frames) if (last < 0 || f.t - last >= 1 / FPS - 0.003) { kept.push(f); last = f.t; }
  const delays = kept.map((f, i) => (i + 1 < kept.length ? Math.max(20, Math.round((kept[i + 1].t - f.t) * 1000)) : 1500));
  const imgs = await Promise.all(kept.map(f => sharp(f.data).extract({ left: 0, top: CROP.top, width: W, height: CROP.height }).png().toBuffer()));
  const file = path.join(OUT, kit + ".gif");
  await sharp(imgs, { join: { animated: true } }).gif({ delay: delays, loop: 0, effort: 7, colours: 96, dither: 0.3, interFrameMaxError: 6 }).toFile(file);
  console.log(`${path.relative(process.cwd(), file)}: ${kept.length} frames over ${(kept[kept.length - 1].t - kept[0].t).toFixed(2)} s, ${Math.round(fs.statSync(file).size / 1024)} KB`);
}
await browser.close();
