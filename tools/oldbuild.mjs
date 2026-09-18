// 1.12 b268: does a 1.12 (266) page — the build that is deployed — keep a registry that names TWO Extra pair ids and
// an unknown kit in a slot? Measured, not assumed: b266 served on 8792, the new build on 8791; the registry a new
// page writes is carried across, the old page is USED (a theme change writes the device record) and reloaded, and
// the record is read back on both sides.
import { createRequire } from "node:module";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const NEW = process.env.NEW || "http://127.0.0.1:8791/", OLD = process.env.OLD || "http://127.0.0.1:8792/";
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await chromium.launch({ channel: "chrome", headless: true });
const open = async url => { const c = await b.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" }); const p = await c.newPage(); p.setDefaultTimeout(9000); const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => { if (m.type() === "error") errs.push("console: " + m.text()); }); return { c, p, errs }; };
const press = async (p, sel) => { const h = await p.$(sel); if (!h) throw new Error("no " + sel); await h.hover(); await h.click(); };

// 1. the new build: unlock both pairs, put one kit of each in a slot
const A = await open(NEW);
await A.p.goto(NEW + "?transport=local");
await A.p.waitForSelector("#welcome:not([hidden])");
await A.p.evaluate(() => document.getElementById("w-keep").click());
await A.p.waitForSelector("#p-save[open]"); await A.p.click("#save-done");
await A.p.waitForSelector("#list .row"); await wait(600);
await press(A.p, "#more"); await A.p.click('#p-menu [data-act="settings"]'); await A.p.waitForSelector("#p-settings[open]");
await A.p.click('[data-set="night"]'); await A.p.waitForSelector("#p-theme[open]");
if (await A.p.$("#sw-build")) { await A.p.click("#sw-build"); await A.p.waitForSelector("#p-builder[open]"); await wait(250); }
for (const w of ["ChalkDust", "SawDust"]) { if (!(await A.p.$("#p-builder[open]"))) { await A.p.click("#sw-build"); await A.p.waitForSelector("#p-builder[open]"); await wait(200); } await A.p.fill("#c-import", w); await press(A.p, "#c-import-go"); await wait(800); }
await press(A.p, '#sw-extra .swatch[data-code="T1:curated:char"]'); await wait(500);
await press(A.p, "#partner-use"); await wait(600);
const meta = await A.p.evaluate(() => localStorage.getItem("tf/v2/meta"));
const before = JSON.parse(meta).device;
console.log("new build wrote:  extras=" + JSON.stringify(before.extras) + "  day=" + before.day + "  night=" + before.night);
await A.c.close();

// 2. the old build (266), with that registry carried across the origin, used and reloaded
const B = await open(OLD);
await B.p.goto(OLD + "?transport=local");
await B.p.waitForSelector("#welcome:not([hidden])");
await B.p.evaluate(() => document.getElementById("w-keep").click());
await B.p.waitForSelector("#p-save[open]"); await B.p.click("#save-done");
await B.p.waitForSelector("#list .row"); await wait(600);
// the device record the new build wrote, into the old build's own registry: its list stays, only `device` crosses
await B.p.evaluate(d => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device = JSON.parse(d); localStorage.setItem("tf/v2/meta", JSON.stringify(m)); }, JSON.stringify(before));
await B.p.reload(); await B.p.waitForSelector("#list .row"); await wait(800);
const build = await B.p.evaluate(() => document.documentElement.dataset.build);
await press(B.p, "#more"); await B.p.click('#p-menu [data-act="settings"]'); await B.p.waitForSelector("#p-settings[open]");
await B.p.click('[data-set="night"]'); await B.p.waitForSelector("#p-theme[open]"); await wait(400);
const gs = await B.p.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent));
const swatches = await B.p.$$eval("#sw-extra .swatch .nm", els => els.map(e => e.textContent));
// use it: a theme change is what makes the old page write the device record back
await press(B.p, '.swatch[data-code="T1:curated:dark"]'); await wait(600);
await B.p.keyboard.press("Escape"); await wait(300); await B.p.keyboard.press("Escape"); await wait(600);
await B.p.reload(); await B.p.waitForSelector("#list .row"); await wait(800);
const after = await B.p.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device);
console.log("build " + build + " page: groups=" + JSON.stringify(gs) + " extra swatches=" + JSON.stringify(swatches));
console.log("build " + build + " kept:  extras=" + JSON.stringify(after.extras) + "  day=" + after.day + "  night=" + after.night);
console.log("build " + build + " errors: " + B.errs.length + (B.errs.length ? " — " + B.errs.join(" | ") : ""));
const metaAfter = await B.p.evaluate(() => localStorage.getItem("tf/v2/meta"));
await B.c.close();

// 3. back on the new build: the pairs and the slot are still there
const C = await open(NEW);
await C.p.goto(NEW + "?transport=local");
await C.p.waitForSelector("#welcome:not([hidden])");
await C.p.evaluate(d => { const m = JSON.parse(localStorage.getItem("tf/v2/meta") || '{"lists":[],"device":{}}'); m.device = JSON.parse(d).device; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); }, metaAfter);
await C.p.reload(); await C.p.waitForSelector("#welcome:not([hidden])"); await wait(900);
const back = await C.p.evaluate(() => { const s = window.__tf(); return { extras: s.extras, day: s.day, night: s.night }; });
console.log("new build reads back: " + JSON.stringify(back));
console.log("new build errors: " + C.errs.length + (C.errs.length ? " — " + C.errs.join(" | ") : ""));
await C.c.close();
await b.close();
const ok = JSON.stringify(after.extras) === JSON.stringify(before.extras) && after.day === before.day && B.errs.length === 0 && JSON.stringify(back.extras) === JSON.stringify(before.extras);
console.log(ok ? "PASS — the old build kept both pair ids and the unknown code, raised no error, and the new build read them back" : "FAIL");
process.exit(ok ? 0 : 1);
