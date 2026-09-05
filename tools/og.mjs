// tools/og.mjs — renders icons/og.png (1200×630, the card a texted link shows) from tools/og.html with the installed
// Chrome, quantised so it stays well under 150 KB. Run: node tools/serve.js 8791 . &  then  node tools/og.mjs
// (BASE=… for another port). The card is not part of the app shell: sw.js does not precache it.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const sharp = require("sharp");
const BASE = process.env.BASE || "http://127.0.0.1:8791/";
const out = path.resolve(process.argv[2] || "icons/og.png");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(BASE + "tools/og.html");
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 300));
const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
await sharp(png).png({ palette: true, quality: 90, colours: 128, compressionLevel: 9 }).toFile(out);
const kb = Math.round(fs.statSync(out).size / 1024);
console.log(`${path.relative(process.cwd(), out)}: 1200×630, ${kb} KB`);
if (kb > 150) { console.error("over 150 KB"); process.exit(1); }
