// tools/moves.mjs — GIFs of the materials round (1.12 b293) at 390×844 with a real finger (CDP touch), recorded from
// Chrome's own screencast so they play at the speed the app runs. One GIF per scene:
//   reveal   the sun or moon, Paper to Terminal and back: the other theme opens from it
//   zoom     Today to Everything and back: the lines travel, the pill slides
//   delete   a line erased in its material, then Undo: Paper, Terminal, Midnight, Pink (one GIF each)
//   menu     Paper: a hold lifts the words into the menu's title, × sends them home; then Not today, then Take off Today
//   panels   Paper: ⋯ rises, becomes Settings, × drops it away
//   unseal   a cold open on Paper and on Terminal
// Run: node tools/serve.js 8796 . &  then  BASE=http://127.0.0.1:8796/ node tools/moves.mjs shots/moat-2 [scene,scene]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const sharp = require("sharp");
const BASE = process.env.BASE || "http://127.0.0.1:8796/";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(BASE)) throw new Error("moves.mjs only records a local server");
const OUT = path.resolve(process.argv[2] || "shots/moat-2");
const ONLY = (process.argv[3] || "").split(",").filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });
const FPS = 30, W = 390, H = 844;
const wait = ms => new Promise(r => setTimeout(r, ms));
const SCENES = {
  reveal: { kit: "paper" }, zoom: { kit: "paper" },
  "delete-paper": { kit: "paper" }, "delete-terminal": { kit: "terminal", slot: "night" }, "delete-midnight": { kit: "midnight", slot: "night" }, "delete-pink": { kit: "pink", slot: "night" },
  menu: { kit: "paper" }, panels: { kit: "paper" }, "unseal-paper": { kit: "paper" }, "unseal-terminal": { kit: "terminal", slot: "night" }
};

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
for (const [scene, { kit, slot = "day" }] of Object.entries(SCENES)) {
  if (ONLY.length && !ONLY.some(o => scene.startsWith(o))) continue;
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, colorScheme: slot === "day" ? "light" : "dark" });
  const device = { day: "T1:curated:paper", night: "T1:curated:terminal", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" } };
  device[slot] = "T1:curated:" + kit;
  await ctx.addInitScript(`try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: ${JSON.stringify(device)} })); } catch (e) {}`);
  const page = await ctx.newPage(); page.setDefaultTimeout(9000);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(BASE + "?transport=local");
  await page.waitForSelector("#welcome:not([hidden])");
  await page.evaluate(() => document.getElementById("w-keep").click()); await page.waitForSelector("#p-save[open]"); await page.click("#save-done");
  await page.waitForSelector("#list .row"); await wait(1600); // the save sheet gone, motion.js in
  const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(200); }
  let cdp = await ctx.newCDPSession(page);
  const frames = [];
  const listen = c => c.on("Page.screencastFrame", async f => { frames.push({ t: f.metadata.timestamp, data: Buffer.from(f.data, "base64") }); try { await c.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) { /* stopped */ } });
  listen(cdp);
  const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  const at = async sel => { const b = await (await page.$(sel)).boundingBox(); return { x: b.x + Math.min(60, b.width / 2), y: b.y + Math.min(b.height, 40) / 2 }; };
  const tap = async sel => { const p = await at(sel); await touch("touchStart", p.x, p.y); await wait(60); await touch("touchEnd"); };
  const holdOn = async sel => { const p = await at(sel); await touch("touchStart", p.x, p.y); await wait(650); await touch("touchEnd"); };
  const start = () => cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });
  if (scene.startsWith("unseal")) { // a cold open: the recording starts before the reload
    await start(); await wait(300);
    await page.reload(); await page.waitForSelector("#list .row"); await wait(2600);
  } else {
    await start(); await wait(400);
    if (scene === "reveal") { await tap("#daynight"); await wait(1300); await tap("#daynight"); await wait(1300); }
    else if (scene === "zoom") { await tap("#v-all"); await wait(1200); await tap("#v-today"); await wait(1200); }
    else if (scene.startsWith("delete")) {
      await holdOn("#list .row:nth-child(2) .tx"); await page.waitForSelector("#p-line[open]"); await wait(700);
      await tap('#p-line [data-lact="delete"]'); await wait(1900);
      await tap("#toast-undo"); await wait(1000);
    } else if (scene === "menu") {
      await holdOn("#list .row:nth-child(1) .tx"); await page.waitForSelector("#p-line[open]"); await wait(800);
      await tap("#p-line h2 .x"); await wait(1100);
      await holdOn("#list .row:nth-child(1) .tx"); await page.waitForSelector("#p-line[open]"); await wait(800);
      await tap('#p-line [data-lact="nottoday"]'); await wait(1400);
      await holdOn("#list .row:nth-child(1) .tx"); await page.waitForSelector("#p-line[open]"); await wait(800);
      await tap('#p-line [data-lact="today"]'); await wait(1400);
    } else if (scene === "panels") {
      await tap("#more"); await page.waitForSelector("#p-menu[open]"); await wait(900);
      await tap('#p-menu [data-act="settings"]'); await page.waitForSelector("#p-settings[open]"); await wait(1000);
      await tap("#p-settings h2 .x"); await wait(1000);
    }
  }
  await cdp.send("Page.stopScreencast"); await wait(250);
  await cdp.detach(); await ctx.close();
  frames.sort((a, b) => a.t - b.t);
  const kept = []; let last = -1;
  for (const f of frames) if (last < 0 || f.t - last >= 1 / FPS - 0.003) { kept.push(f); last = f.t; }
  if (!kept.length) { console.log(scene + ": no frames"); continue; }
  const delays = kept.map((f, i) => (i + 1 < kept.length ? Math.max(20, Math.round((kept[i + 1].t - f.t) * 1000)) : 1200));
  const imgs = await Promise.all(kept.map(f => sharp(f.data).resize(Math.round(W * 0.8)).png().toBuffer())); // each frame on its own: sharp will not resize a join
  const file = path.join(OUT, scene + ".gif");
  await sharp(imgs, { join: { animated: true } }).gif({ delay: delays, loop: 0, effort: 7, colours: 96, dither: 0.3, interFrameMaxError: 6 }).toFile(file);
  console.log(`${path.relative(process.cwd(), file)}: ${kept.length} frames over ${(kept[kept.length - 1].t - kept[0].t).toFixed(2)} s, ${Math.round(fs.statSync(file).size / 1024)} KB${errors.length ? ", page errors: " + errors.join(" | ") : ""}`);
}
await browser.close();
