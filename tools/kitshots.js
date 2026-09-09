// tools/kitshots.js — one screenshot per kit: the list on screen, one line struck, in every theme theme.js knows.
// Run: node tools/serve.js 8793 . &  then  node tools/kitshots.js /tmp/kits-before   (the directory is created)
//
// tools/shots.js walks the surfaces in one theme; this walks the themes on one surface. It exists because the only
// question an accent change actually raises — does this colour still read as this product on this ground — is not a
// number, and nothing in the repo could answer it before 1.12 b202. The accent is what the shot is of, so the list is left
// with one line struck and one line not: the strike, the filled box, the progress bar and the count all carry it.
//
// Secret kits are included (they are two more kits, and this runs on a developer's machine off a local transport);
// the Secret *key* is never typed here, because theme.js's CURATED already holds them and applyTheme does not ask.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
let sharp = null; try { sharp = require("sharp"); } catch (e) { /* plain PNGs then */ }
const BASE = process.env.BASE || "http://127.0.0.1:8793/";
// the same refusal tools/shots.js makes, for the same reason: a run against the live site would create a real list
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(BASE)) throw new Error("kitshots.js only runs against a local server");
const OUT = path.resolve(process.argv[2] || "shots/kits");
fs.mkdirSync(OUT, { recursive: true });

const wait = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 1000, height: 760 }, colorScheme: "dark", reducedMotion: "reduce" });
const page = await ctx.newPage(); page.setDefaultTimeout(8000);
const errors = [];
page.on("pageerror", e => errors.push(String(e.message || e)));

await page.goto(BASE + "?transport=local");
// past the welcome and onto a real list, the way shots.js does it
await page.waitForSelector("#welcome:not([hidden])");
if (await page.$("#w-keep")) await page.evaluate(() => document.getElementById("w-keep").click()); else await page.click("#w-new");
await page.waitForSelector("#p-save[open]"); await page.click("#save-done");
if (await page.$("#tour:not([hidden])")) { await page.click("#tour-skip"); }
await page.waitForSelector("#list .row");
// one line struck so the accent is on screen where it lives: the strike, the filled box, the bar, the count
await page.click("#list .row:first-child .check");
await wait(900);
await page.mouse.move(2, 2);
await wait(400);

const build = await page.evaluate(() => document.documentElement.dataset.build || "");
const ids = await page.evaluate(async b => {
  const T = await import("./theme.js?v=" + b);
  window.__kits = T;
  return T.CURATED.map(t => t.id);
}, build);

let n = 0;
for (const id of ids) {
  const ok = await page.evaluate(({ id }) => {
    const T = window.__kits;
    const t = T.CURATED.find(x => x.id === id);
    if (!t) return false;
    T.applyTheme(t, document, { persist: false });   // persist:false: the run leaves no theme behind in localStorage
    return true;
  }, { id });
  if (!ok) { console.log("skip", id); continue; }
  await wait(260);                                    // the crossfade styles.css runs on --ink and friends
  const buf = await page.screenshot();
  const file = path.join(OUT, id + ".png");
  if (sharp) await sharp(buf).png({ palette: true, quality: 90, compressionLevel: 9 }).toFile(file); else fs.writeFileSync(file, buf);
  n++; console.log("shot", id);
}

await ctx.close();
await browser.close();
if (errors.length) { console.log("\npage errors:"); for (const e of errors) console.log("  " + e); }
console.log(`\n${n} kit screenshots in ${path.relative(process.cwd(), OUT)}`);
if (errors.length) process.exit(1);
