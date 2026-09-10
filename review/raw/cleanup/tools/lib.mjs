// review/raw/cleanup/tools/lib.mjs — the shared bits of the cleanup track's Playwright instruments.
// Mirrors tools/e2e4.js's fresh(): the installed Chrome, headless, a context pinned to Light/Dark + `switch: system`
// (so the slot that is on follows colorScheme), and the welcome → Keep → save-done dance that leaves a list open.
import { createRequire } from "node:module";
const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
export const { chromium } = require("playwright");
export const BASE = process.env.BASE || "http://127.0.0.1:8891/";
export const wait = ms => new Promise(r => setTimeout(r, ms));
export const DESKTOP = { viewport: { width: 1440, height: 900 } };
export const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };
export async function launch() { return chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] }); }
export async function context(browser, opts = DESKTOP, { scheme = "dark", pin = true } = {}) {
  const ctx = await browser.newContext({ ...opts, colorScheme: scheme });
  if (pin) await ctx.addInitScript(`try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: { day: "T1:curated:light", night: "T1:curated:dark", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" } } })); } catch (e) {}`);
  return ctx;
}
/** A page with a list open (the seed's three lines), the way e2e4's fresh() leaves one. */
export async function freshPage(ctx, base = BASE) {
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto(base + "?transport=local");
  await page.waitForSelector("#welcome:not([hidden])");
  await page.evaluate(() => document.getElementById("w-keep").click()); await page.waitForSelector("#p-save[open]"); await page.click("#save-done"); await wait(500);
  await page.waitForSelector("#list .row");
  await page.mouse.move(2, 2); await wait(400);
  return { page, errors };
}
export const s = page => page.evaluate(() => window.__tf());
export const meta = page => page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta") || "{}"); return { lists: (m.lists || []).map(l => l.id), removed: m.removed || null, unremoved: m.unremoved || null, dead: m.dead || null, current: m.current || null }; });
export const header = page => page.textContent("#p-theme-h").then(t => t.trim());
export const theme = page => page.$eval("html", e => e.dataset.theme);
/** Escape until no panel is open (e2e4's t.esc()). */
export async function esc(page) { await page.keyboard.press("Escape"); for (let i = 0; i < 4; i++) { await wait(150); if (!(await page.$("dialog.panel[open]"))) break; await page.keyboard.press("Escape"); } await wait(120); }
export async function openMore(page, act, panel) { await page.click("#more"); await page.waitForSelector("#p-menu[open]"); await page.click(`#p-menu [data-act="${act}"]`); if (panel) await page.waitForSelector(panel + "[open]"); await wait(300); }
export async function openListsDetail(page, nth = 1) { await openMore(page, "lists", "#p-lists"); await page.click(`#lists-menu .row:nth-child(${nth}) .more`); await page.waitForSelector("#p-list[open]"); await wait(200); }
export const log = (...a) => console.log(...a.map(x => (typeof x === "string" ? x : JSON.stringify(x))));
