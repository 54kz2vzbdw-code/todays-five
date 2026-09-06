// tools/audit/harness.mjs — one way to open the app in any environment the audit covers, with the installed Chrome.
//
//   import { launch, openApp, ENVS } from "<repo>/tools/audit/harness.mjs";
//   const browser = await launch();
//   const t = await openApp(browser, { env: "phone", fixture: "longtime", scheme: "light" });
//   await t.press("#more"); await t.shot("phone-menu"); await t.close();
//
// Environments (ENVS): desktop 1440×900 · desktopHD 1920×1080 · narrow 900×700 · zoom150 · zoom200 (browser zoom, as a smaller
// viewport at a higher device scale) · phone 390×844 (touch) · phoneLandscape · android (Pixel 7, touch, Android UA) ·
// ipad 1024×1366 (touch) · ipadLandscape. Options: scheme "dark"|"light", reducedMotion "reduce"|"no-preference", timezone
// (an IANA name), clock (an ISO time: Playwright's fake clock is installed, drive it with t.page.clock), offline, slow3g.
// Fixtures: "fresh" (the welcome skipped: a saved list with the three seed lines) · "longtime" (test/fixtures/longtime.json:
// four lists, 80 lines, notes, repeats, history, saved themes; loaded once and reloaded so the device looks lived-in) ·
// "none" (the welcome as a stranger sees it) · a list link hash via `hash` for link-arrival cases.
// Every page runs on the local transport (?transport=local): nothing reaches the live server. Evidence goes to $OUT
// (default: ./audit-out) via t.shot(name). Two devices on one list: openApp again with { ctx: t.ctx, hash: t.link() }.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium, devices } = require("playwright");
export const BASE = process.env.BASE || "http://127.0.0.1:8796/";
export const OUT = path.resolve(process.env.OUT || "audit-out");
const FIXTURE = JSON.parse(fs.readFileSync(new URL("../../test/fixtures/longtime.json", import.meta.url), "utf8"));
export const wait = ms => new Promise(r => setTimeout(r, ms));

export const ENVS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  desktopHD: { viewport: { width: 1920, height: 1080 } },
  narrow: { viewport: { width: 900, height: 700 } },
  zoom150: { viewport: { width: 960, height: 600 }, deviceScaleFactor: 1.5 },
  zoom200: { viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 },
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 },
  phoneLandscape: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 },
  android: { ...devices["Pixel 7"] },
  ipad: { viewport: { width: 1024, height: 1366 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  ipadLandscape: { viewport: { width: 1366, height: 1024 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }
};

export async function launch({ headless = true } = {}) {
  return chromium.launch({ channel: "chrome", headless, args: ["--autoplay-policy=no-user-gesture-required"] });
}

/** The seeding script: writes the fixture into localStorage with every time shifted to now and the history bucketed by local day. */
function seedScript() {
  return `(() => {
    if (localStorage.getItem("tf/v2/meta")) return; // seeded already (a reload)
    const F = ${JSON.stringify(FIXTURE)};
    const delta = Date.now() - F.generatedAt;
    const shift = v => (typeof v === "number" && v > 1e12) ? v + delta : v;
    const localDate = ts => { const d = new Date(ts); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
    const walk = o => { if (Array.isArray(o)) return o.map(walk); if (o && typeof o === "object") { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = (/At$/.test(k) || k === "savedAt") ? shift(v) : walk(v); return r; } return o; };
    const meta = walk(F.meta);
    for (const l of meta.lists) if (l.addedAt) l.addedAt = shift(l.addedAt);
    localStorage.setItem("tf/v2/meta", JSON.stringify(meta));
    for (const [id, rec] of Object.entries(F.lists)) {
      const r = walk(rec); const doc = r.doc; const entries = doc.historyEntries || []; delete doc.historyEntries;
      const hist = {};
      for (const e of entries) { const day = localDate(e.doneAt); (hist[day] = hist[day] || []).push(e); }
      for (const day of Object.keys(hist)) hist[day].sort((a, b) => a.doneAt - b.doneAt);
      doc.history = hist;
      // a rule's "placed" day and a return's day are local dates: today, for the ones that mean today
      const today = localDate(Date.now());
      for (const rule of Object.values(doc.rules || {})) if (rule.placed) rule.placed = today;
      for (const ret of Object.values(doc.returns || {})) if (ret.day) ret.day = today;
      localStorage.setItem("tf/v3/list/" + id, JSON.stringify(r));
    }
  })();`;
}

/**
 * Open the app. Returns the page with helpers: press (tap on touch, hover+click on the desktop), esc (close the whole stack),
 * more(act) (⋯ then a row), lineMenu(rowSel), hold(sel, ms, dx), s() (the app's test hook window.__tf()), shot(name), link()
 * (the list's private link), close(). errors / csp / consoleErrors / thirdParty collect what the page reported.
 */
export async function openApp(browser, { env = "desktop", fixture = "fresh", scheme = "dark", reducedMotion = "no-preference", timezone, clock = null, offline = false, slow3g = false, hash = "", ctx: shared = null, url, server = null } = {}) {
  const opts = { ...(ENVS[env] || ENVS.desktop), colorScheme: scheme, reducedMotion, ...(timezone ? { timezoneId: timezone } : {}) };
  const ctx = shared || await browser.newContext(opts);
  if (!shared && fixture === "longtime") await ctx.addInitScript(seedScript());
  // a stranger arriving by a link: a new profile that holds no list, whose local "server" has the rows another profile made
  // (openApp(browser, { fixture: "none", hash: await a.link(), server: await a.exportServer() }); use a.viewLink() for a view link)
  if (!shared && server) await ctx.addInitScript(rows => { for (const [k, v] of Object.entries(rows)) if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, server);
  const page = await ctx.newPage(); page.setDefaultTimeout(8000);
  const touch = !!opts.hasTouch;
  if (clock) await page.clock.install({ time: clock });
  const errors = [], csp = [], consoleErrors = [], thirdParty = [];
  page.on("pageerror", e => errors.push(e.stack || e.message));
  page.on("console", m => { const t = m.text(); if (/Content Security Policy|Refused to/.test(t)) csp.push(t); else if (m.type() === "error") consoleErrors.push(t); });
  page.on("request", r => { const u = new URL(r.url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !u.protocol.startsWith("blob") && !u.protocol.startsWith("data")) thirdParty.push(r.url()); });
  if (slow3g) { const cdp = await ctx.newCDPSession(page); await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 400, downloadThroughput: 50 * 1024, uploadThroughput: 20 * 1024 }); }
  const target = url || (BASE + "?transport=local" + hash);
  await page.goto(target);
  if (fixture === "fresh" && !hash) {
    await page.waitForSelector("#welcome:not([hidden])");
    await page.click("#w-skip"); await page.waitForSelector("#p-save[open]"); await page.click("#save-done"); await wait(500);
    await page.waitForSelector("#list .row");
  } else if (fixture === "longtime") {
    await page.waitForSelector("#list .row"); await wait(1200);       // the four lists reach the local server, the theme CSS is cached
    await page.reload(); await page.waitForSelector("#list .row"); await wait(400);
  }
  if (!touch) { await page.mouse.move(2, 2); await wait(300); }
  if (offline) await ctx.setOffline(true);
  const s = () => page.evaluate(() => window.__tf());
  const dismissHint = async () => { const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(150); } };
  const press = async sel => { await dismissHint(); const h = await page.$(sel); if (!h) throw new Error("no " + sel); if (touch) await h.tap(); else { await h.hover(); await h.click(); } };
  const esc = async () => { await page.keyboard.press("Escape"); for (let i = 0; i < 5; i++) { await wait(150); if (!(await page.$("dialog.panel[open]"))) break; await page.keyboard.press("Escape"); } await wait(120); };
  const more = async act => { await press("#more"); await page.waitForSelector("#p-menu[open]"); if (act) { await page.click(`#p-menu [data-act="${act}"]`); await wait(300); } };
  const hold = async (sel, ms = 650, dx = 0) => {
    await dismissHint(); const el = await page.$(sel); if (!el) throw new Error("no " + sel); const b = await el.boundingBox();
    const x = b.x + Math.min(60, b.width / 2), y = b.y + b.height / 2; const cdp = await ctx.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await wait(ms);
    if (dx) for (let i = 1; i <= 6; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * i / 6, y }] }); await wait(16); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach(); await wait(350);
  };
  const lineMenu = async rowSel => { if (touch) await hold(rowSel + " .tx"); else { await page.hover(rowSel + " .tx"); await wait(120); await page.click(rowSel + " .tool.lmenu"); } await page.waitForSelector("#p-line[open]"); };
  const shot = async (name, o = {}) => { fs.mkdirSync(OUT, { recursive: true }); const file = path.join(OUT, name + ".png"); await page.screenshot({ path: file, ...o }); return file; };
  const link = async () => { const st = await s(); return st.listId ? "#/l/" + st.listId : ""; };
  const viewLink = async () => { const st = await s(); return st.R ? "#/r/" + st.R : ""; };
  const exportServer = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith("tf/v2/localserver/")).map(k => [k, localStorage.getItem(k)])));
  const a11y = async (sel = "body") => page.locator(sel).ariaSnapshot();
  return { ctx, page, touch, opts, s, press, esc, more, hold, lineMenu, shot, link, viewLink, exportServer, a11y, errors, csp, consoleErrors, thirdParty, close: () => shared ? page.close() : ctx.close() };
}
