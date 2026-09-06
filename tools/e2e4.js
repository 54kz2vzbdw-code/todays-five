// tools/e2e4.js — the browser suite. Playwright driving the installed Chrome, on the local transport
// (?transport=local: a same-origin BroadcastChannel "server" that exercises the identical sync and crypto engine).
// Run: node tools/serve.js 8790 . &  then  node tools/e2e4.js      (BASE=… for another port)
// Every feature at 1440×900 (mouse) and 390×844 (touch), v4's and 1.1's: quiet rows (nothing at rest on the phone,
// one control on hover on the desktop), the seed lines all on screen, no coach mark after the save sheet, the three
// just-in-time hints once and never again, the idle fade, the four-item footers, the popover and the sheet, the
// welcome without a rail, the Advanced reshuffle, a 1.0 device seeing the toast once; 1.2's Day and Night (the flip with
// its crossfade and sound, each Switch mode with a mocked clock and a mocked colour scheme, the picker's groups and the
// one-tap partner, Make its partner, ⋯ → Theme opening Appearance, T and Shift+T, the migration of a 1.1 device, the
// headline-only toast and About's new shape, the sun/moon fading with the rail); plus one-thing mode, search, recently
// deleted, Settings, view-only celebration, every sound pack, the bottom-of-screen pixel probe, audio recovery, presence
// dots, zero page errors, zero CSP violations, zero third-party requests.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { VERSION, VERSION_LABEL } from "../version.js";
const require = createRequire((process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules")) + "/");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const BASE = process.env.BASE || "http://127.0.0.1:8790/";
const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
let passed = 0, failed = 0; const failures = [];
const ONLY = process.env.ONLY || ""; // run only the tests whose name contains this
const open = new Set(); // contexts a failed test left behind are closed before the next test runs
async function test(name, fn) {
  if (ONLY && !name.includes(ONLY)) return;
  try { await fn(); passed++; console.log("ok -", name); } catch (e) { failed++; failures.push(name + ": " + (e.message || e).split("\n")[0]); console.log("FAIL -", name, "\n    ", (e.message || String(e)).split("\n")[0]); if (process.env.DEBUG && e.stack) console.log("     " + e.stack.split("\n").filter(l => /e2e4/.test(l)).slice(0, 3).join("\n     ")); }
  for (const c of open) { try { await c.close(); } catch (x) { /* already closed */ } }
  open.clear();
}
const assert = { ok(v, m) { if (!v) throw new Error(m || "expected truthy"); }, notEqual(a, b, m) { if (a === b) throw new Error((m || "") + " expected not " + JSON.stringify(b)); }, deepEqual(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || "") + " expected " + JSON.stringify(b) + " got " + JSON.stringify(a)); }, equal(a, b, m) { if (a !== b) throw new Error((m || "") + " expected " + JSON.stringify(b) + " got " + JSON.stringify(a)); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

const VIEWPORTS = [["desktop 1440×900", { viewport: { width: 1440, height: 900 } }, false], ["phone 390×844", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, true]];
async function fresh(opts, { url = BASE + "?transport=local", list = true, ctx: shared = null, scheme = "dark", clock = null, reducedMotion = "no-preference", init = "" } = {}) {
  // a second "device" on the local transport is a second tab of the same context: the local server lives in localStorage.
  // The system is dark unless a test says otherwise (1.2 starts a fresh device With the system); `clock` installs a fake one.
  const ctx = shared || await browser.newContext({ ...opts, colorScheme: scheme, reducedMotion });
  open.add(ctx);
  if (init && !shared) await ctx.addInitScript(init);
  const page = await ctx.newPage(); page.setDefaultTimeout(6000);
  if (clock) await page.clock.install({ time: clock });
  const errors = [], csp = [], thirdParty = [], consoleErrors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { const t = m.text(); if (/Content Security Policy|Refused to/.test(t)) csp.push(t); else if (m.type() === "error") consoleErrors.push(t); });
  page.on("request", r => { const u = new URL(r.url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !u.protocol.startsWith("blob") && !u.protocol.startsWith("data")) thirdParty.push(r.url()); });
  await page.goto(url);
  if (list) {
    await page.waitForSelector("#welcome:not([hidden])");
    // 1.9: Skip starts an empty list; the suite keeps the three seed lines the way Keep does (the button waits for a line of your own, so it is pressed by hand)
    await page.evaluate(() => document.getElementById("w-keep").click()); await page.waitForSelector("#p-save[open]"); await page.click("#save-done"); await wait(500);
    await page.waitForSelector("#list .row");
    if (!opts.hasTouch) { await page.mouse.move(2, 2); await wait(400); } // past the tools' fade, so "at rest" means at rest
  }
  const s = () => page.evaluate(() => window.__tf());
  /** Escape, and again while a panel is still open: 1.4's Escape goes back one level, and the checks below mean "close it all" */
  const esc = async () => { await page.keyboard.press("Escape"); for (let i = 0; i < 4; i++) { await wait(150); if (!(await page.$("dialog.panel[open]"))) break; await page.keyboard.press("Escape"); } await wait(120); };
  /** a reload that lets the history unwind of a closing stack land first (a same-document traversal right before a reload aborts it) */
  const reload = async o => { await wait(180); await page.reload(o); };
  const press = async sel => {
    await page.bringToFront();
    // the one-time iOS install hint sits over the footer; a person would dismiss it, so does the suite
    const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(150); }
    const h = await page.$(sel); if (!h) throw new Error("no " + sel); if (opts.hasTouch) await h.tap(); else { await h.hover(); await h.click(); }
  };
  /** a finger held on an element (CDP touch) for `ms`, then lifted; returns the test hook's state mid-hold */
  const hold = async (sel, ms = 650, dx = 0) => {
    const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(150); }
    const el = await page.$(sel); if (!el) throw new Error("no " + sel); const b = await el.boundingBox();
    const x = b.x + Math.min(60, b.width / 2), y = b.y + b.height / 2;
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] }); await wait(ms);
    const during = await s();
    if (dx) { for (let i = 1; i <= 6; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + dx * i / 6, y }] }); await wait(16); } }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach(); await wait(350);
    return during;
  };
  /** the line's menu: ⋯ on hover on the desktop, a hold on the phone (Edit is its first row) */
  const lineMenu = async rowSel => { if (opts.hasTouch) await hold(rowSel + " .tx"); else { await page.hover(rowSel + " .tx"); await wait(120); await page.click(rowSel + " .tool.lmenu"); } await page.waitForSelector("#p-line[open]"); };
  const away = async () => { await page.mouse.move(2, 2); await wait(350); };
  /** the row tools a person can see: rendered, opaque, not clipped away */
  const visibleTools = (scope = "") => page.$$eval(scope + " .row .tool", els => els.filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 2 && cs.opacity !== "0" && cs.visibility !== "hidden" && cs.display !== "none"; }).map(e => e.className.replace("tool ", "")));
  const front = () => page.bringToFront();
  return { ctx, page, errors, csp, thirdParty, consoleErrors, s, press, hold, lineMenu, away, visibleTools, front, esc, reload, close: () => shared ? page.close() : ctx.close() };
}
const rect = (page, sel) => page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; });
const { seedScript } = await import("./audit/harness.mjs"); // 1.7: the long-time fixture (four lists, repeats, history, saved themes)
const seedLines = JSON.parse(fs.readFileSync(new URL("../model.js", import.meta.url), "utf8").match(/SEED_LINES = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));

for (const [label, opts, touch] of VIEWPORTS) {
  console.log("\n==", label);
  const openBuild = async t => { if (!(await t.page.$("#p-builder[open]"))) { await t.page.click("#sw-build"); await t.page.waitForSelector("#p-builder[open]"); await wait(150); } }; // 1.9: the builder is a sheet under the picker's Make your own row

  await test(label + ": a long-time device opens whole — four lists, a chosen-days repeat on the current one, 90 days of history: no page error, every Today line, the count, sync running", async () => {
    const SAT = new Date("2026-09-12T14:00:00"); // a Saturday: what is on Today depends on the weekday (Groceries repeats on Saturdays)
    const t = await fresh(opts, { list: false, init: seedScript({ now: +SAT }), clock: SAT });
    await t.page.waitForSelector("#list .row"); await wait(1500);
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(800);
    assert.equal(t.errors.length, 0, "page errors at boot: " + t.errors.map(e => e.split("\n")[0]).join(" | "));
    assert.equal(await t.page.locator("#list .row").count(), 7, "every Today line rendered"); assert.equal(await t.page.locator("#list .row.done").count(), 2);
    assert.equal((await t.page.textContent("#count")).replace(/\s+/g, " ").trim(), "2/7 done");
    const s = await t.s(); assert.equal(s.status, "synced", "the engine started: " + s.status); assert.equal(s.migrations, 0);
    assert.ok(await t.page.$$eval("#list .row", els => els.some(e => /Writing/i.test(e.textContent))), "the section caption on a Today line");
    if (opts.hasTouch) await t.press("#v-all"); else await t.page.keyboard.press("a"); await wait(400);
    assert.equal(await t.page.locator("#all .row").count(), 84); assert.equal(await t.page.locator("#all .sec").count(), 7, "six sections and Unsorted");
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(300);
    assert.equal(await t.page.locator("#lists-menu .group-h").count(), 2, "My lists and Shared with me"); assert.equal(await t.page.locator("#lists-menu .row").count(), 3, "the archived one is not listed");
    await t.esc();
    assert.equal(t.errors.length, 0, t.errors.join(" | ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | "));
    await t.close();
  });

  await test(label + ": 1.9: a list carries its home zone — the maker's zone at creation, stamped on a list from before by its maker on the next open, left alone by a device that only holds the link, and used for rollover whatever the device's own clock says", async () => {
    // a new list made in Tokyo carries Asia/Tokyo, in the document
    const t = await fresh({ ...opts, timezoneId: "Asia/Tokyo" });
    assert.equal((await t.s()).zone, "Asia/Tokyo", "the home zone is the maker's zone");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.zone), "Asia/Tokyo", "and it is in the document");
    await t.close();
    // a list from before 1.9 (the long-time fixture carries none) gets one from the device that made it, on its next open, and keeps it
    const SAT = new Date("2026-09-12T14:00:00");
    const f = await fresh({ ...opts, timezoneId: "America/Chicago" }, { list: false, init: seedScript({ now: +SAT }), clock: SAT });
    await f.page.waitForSelector("#list .row"); await f.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    assert.equal((await f.s()).zone, "America/Chicago", "stamped by its maker");
    await f.reload(); await f.page.waitForSelector("#list .row"); await wait(400);
    assert.equal((await f.s()).zone, "America/Chicago", "and kept"); assert.equal(f.errors.length, 0, f.errors.join("; "));
    await f.close();
    // a device that only holds the link (the same fixture, its entries not made here) writes no zone of its own: the six-hour guard covers it until the maker opens the list
    const strip = ";(() => { const m = JSON.parse(localStorage.getItem('tf/v2/meta')); for (const l of m.lists) delete l.created; localStorage.setItem('tf/v2/meta', JSON.stringify(m)); })();";
    const o = await fresh({ ...opts, timezoneId: "America/Chicago" }, { list: false, init: seedScript({ now: +SAT }) + strip, clock: SAT });
    await o.page.waitForSelector("#list .row"); await wait(1500);
    assert.equal((await o.s()).zone, null, "a link-only device leaves the document without a zone");
    await o.close();
    // rollover reads the home zone: Tokyo, half past midnight on Sunday the 13th, while it is still Saturday morning at home in Chicago
    const NOW = Date.UTC(2026, 8, 12, 15, 30); // 10:30 Saturday in Chicago, 00:30 Sunday in Tokyo
    const home = ";(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('tf/v3/list/')) { const r = JSON.parse(localStorage.getItem(k)); r.doc.zone = 'America/Chicago'; localStorage.setItem(k, JSON.stringify(r)); } })();";
    const k = await fresh({ ...opts, timezoneId: "Asia/Tokyo" }, { list: false, init: seedScript({ now: NOW }) + home, clock: NOW });
    await k.page.waitForSelector("#list .row"); await wait(600);
    assert.equal((await k.s()).zone, "America/Chicago"); assert.equal(await k.page.evaluate(() => new Date().getTimezoneOffset()), -540, "the device is in Tokyo");
    const doneBefore = await k.page.locator("#list .row.done").count(); assert.ok(doneBefore >= 1, "lines finished this morning at home: " + doneBefore);
    await k.page.evaluate(() => window.__tfTest.rollover()); await wait(300);
    assert.equal(await k.page.locator("#list .row.done").count(), doneBefore, "still Saturday at home: nothing rolls, though Tokyo's clock says Sunday");
    await k.page.clock.setSystemTime(Date.UTC(2026, 8, 13, 6, 0)); // 01:00 Sunday in Chicago
    await k.page.evaluate(() => window.__tfTest.rollover()); await wait(400);
    assert.equal(await k.page.locator("#list .row.done").count(), 0, "after home midnight they go to History");
    const days = await k.page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.history));
    assert.ok(days.includes("2026-09-12"), "under the day they were finished at home: " + days.slice(-3));
    assert.equal(k.errors.length, 0, k.errors.join("; "));
    await k.close();
  });

  await test(label + ": 1.7: the first check-off on a cold page plays once the engines land; the panels warm on the first gesture; an empty Today says so; the star row explains itself; tooltips in Everything", async () => {
    const t = await fresh(opts);
    await t.ctx.addInitScript(() => { window.__nodes = 0; for (const m of ["createOscillator", "createBufferSource"]) { const o = AudioContext.prototype[m]; AudioContext.prototype[m] = function () { window.__nodes++; return o.apply(this, arguments); }; } });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(2600); // past the idle preload
    const step = async (name, fn) => { try { await fn(); } catch (e) { throw new Error(name + ": " + String(e.message || e).split("\n")[0]); } };
    await step("first check-off", () => t.press("#list .row:first-child .check")); await wait(1200);
    assert.ok(await t.page.evaluate(() => window.__nodes) > 0, "the first check-off on a cold page made sound nodes");
    assert.ok(await t.page.evaluate(() => performance.getEntriesByType("resource").some(r => /panels\.js/.test(r.name))), "the panels module was fetched on the first gesture");
    await step("uncheck", () => t.press("#list .row.done .check")); await wait(700);
    // an empty Today: take the three lines off it with the star in Everything
    if (opts.hasTouch) await t.press("#v-all"); else await t.page.keyboard.press("a"); await wait(400);
    for (let i = 0; i < 3; i++) { await step("star " + i, () => t.press('#all .row .tool.today[aria-pressed="true"]')); await wait(500); }
    if (opts.hasTouch) await t.press("#v-today"); else await t.page.keyboard.press("a"); await wait(500);
    assert.equal(await t.page.locator("#list .row").count(), 0);
    assert.ok(await t.page.locator("#today-empty").isVisible(), "the empty Today says so"); assert.equal((await t.page.textContent("#today-empty")).trim(), "Nothing on Today yet. Add a line, or bring one over from Everything.");
    if (opts.hasTouch) await t.press("#v-all"); else await t.page.keyboard.press("a"); await wait(400);
    assert.equal(await t.page.$eval("#all .row:first-child .tool.today", e => e.title), "Put this line on Today", "the star's tooltip");
    assert.equal(await t.page.$eval("#all .sec-toggle", e => e.title), "Collapse this section"); assert.equal(await t.page.$eval("#all .sec-more", e => e.title), "Section options");
    await t.lineMenu("#all .row:first-child"); assert.equal(await t.page.$eval("#line-today-lb", e => Array.from(e.childNodes).map(n => n.textContent.trim()).join(" ")), "Put on Today It stays in Everything too"); await t.esc(); await wait(200);
    await t.press("#all .row:first-child .tool.today"); await wait(400);
    if (opts.hasTouch) await t.press("#v-today"); else await t.page.keyboard.press("a"); await wait(400);
    assert.ok(await t.page.locator("#today-empty").isHidden(), "gone once a line is on Today"); assert.equal(await t.page.locator("#list .row").count(), 1);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | ")); await t.close();
  });

  await test(label + ": 1.7: a hold released in place opens the line's menu — on a first, a middle and a last row after a reorder, and through a remote change landing mid-hold", async () => {
    if (!opts.hasTouch) return;
    const t = await fresh(opts); const id = (await t.s()).listId;
    // uneven orders, as any reorder leaves them: the stored order is no longer the neighbours' midpoint
    await t.page.evaluate(() => { const s = window.__tf(); const raw = JSON.parse(localStorage.getItem("tf/v3/list/" + s.listId)); const items = Object.values(raw.doc.items).sort((a, b) => a.todayOrder - b.todayOrder); items[0].todayOrder = 700; items[1].todayOrder = 1500; items[2].todayOrder = 1700; for (const it of items) raw.doc.items[it.id].todayOrder = it.todayOrder; localStorage.setItem("tf/v3/list/" + s.listId, JSON.stringify(raw)); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(500);
    for (const row of [1, 2, 3]) {
      const before = await t.page.$$eval("#list .row", els => els.map(e => e.dataset.id).join(","));
      await t.page.evaluate(() => { document.querySelector("#toast .msg").textContent = ""; });
      await t.hold(`#list .row:nth-child(${row}) .tx`); await wait(300);
      assert.ok(await t.page.$eval("#p-line", d => d.open), "row " + row + ": the menu"); await t.esc(); await wait(250);
      assert.equal(await t.page.$$eval("#list .row", els => els.map(e => e.dataset.id).join(",")), before, "row " + row + ": nothing moved");
      assert.ok(!/Moved/.test(await t.page.textContent("#toast .msg")), "row " + row + ": no phantom move");
    }
    // a remote change lands while a finger holds a line: the hold survives and the release opens the menu
    const b = await fresh(opts, { ctx: t.ctx, url: BASE + "?transport=local#/l/" + id, list: false }); await b.page.waitForSelector("#list .row"); await wait(400);
    await t.front(); const el = await t.page.$("#list .row:nth-child(2) .tx"); const bx = await el.boundingBox(); const cdp = await t.ctx.newCDPSession(t.page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: bx.x + 40, y: bx.y + bx.height / 2 }] }); await wait(650);
    await b.front(); await b.press("#list .row:nth-child(3) .check"); await wait(900); await t.front(); await wait(200);
    assert.ok((await t.s()).dragging, "the hold rides the remote render");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach(); await wait(400);
    assert.ok(await t.page.$eval("#p-line", d => d.open), "the menu opens on release");
    await t.esc(); await wait(200); assert.equal(await t.page.locator("#list .row.done").count(), 1, "and the remote check-off is on screen");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await b.close(); await t.close();
  });

  await test(label + ": 1.7: add-from-anywhere with only spaces adds no line; the welcome's paste error clears on the next try; a saved theme's × is beside the swatch, clear of the name, and deleting can be undone", async () => {
    const t = await fresh(opts); const id = (await t.s()).listId;
    await t.page.goto(BASE + "?transport=local#/l/" + id + "/add?text=%20%20%20"); await wait(900);
    assert.equal(await t.page.locator("#list .row:not(.editing)").count(), 3, "no blank line added"); assert.ok(!/Added/.test(await t.page.textContent("#toast .msg")), "no Added toast");
    await t.page.keyboard.press("Escape"); await wait(200);
    // a theme of one's own, then its ×
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]");
    if (opts.hasTouch) assert.ok(await t.page.$eval("#p-theme", d => d.classList.contains("sheet") && !!d.querySelector(".grip")), "a sheet on touch, like every other panel");
    await t.page.click("#sw-build"); await t.page.waitForSelector("#p-builder[open]"); await wait(150); // 1.9: the builder behind one row
    await t.page.fill("#c-hex", "#2F7F6F"); await t.page.dispatchEvent("#c-hex", "input"); await t.page.fill("#c-name", "Slate green, day"); await t.page.dispatchEvent("#c-name", "input"); await t.page.click("#c-save"); await wait(500);
    await t.page.click("#p-builder h2 .back"); await t.page.waitForSelector("#p-theme[open]"); await wait(300); // back to the picker, where the saved theme shows
    assert.equal(await t.page.locator("#sw-yours .swatch").count(), 1, "saved"); assert.equal(await t.page.locator("#sw-yours .swatch button").count(), 0, "no button inside the swatch"); assert.equal(await t.page.locator("#sw-yours .swatch-wrap > .del").count(), 1, "the × beside it");
    const nm = await t.page.$eval("#sw-yours .swatch .nm", e => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect(); }), del = await t.page.$eval("#sw-yours .del", e => e.getBoundingClientRect());
    assert.ok(nm.right <= del.left + 1, "the name stops before the ×: " + JSON.stringify({ nameRight: nm.right, delLeft: del.left }));
    await t.page.click("#sw-yours .del"); await wait(300);
    assert.equal(await t.page.locator("#sw-yours .swatch").count(), 0, "deleted"); assert.ok(/Deleted/.test(await t.page.textContent("#toast .msg")), "with a toast"); assert.ok(await t.page.locator("#toast-undo").isVisible(), "and Undo");
    await t.page.click("#toast-undo"); await wait(400);
    assert.equal(await t.page.locator("#sw-yours .swatch").count(), 1, "back after Undo");
    await t.esc(); await wait(200);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | ")); await t.close();
  });

  await test(label + ": 1.7: one design language — the danger confirm, accent focus rings on selects, ranges, the About row and the Dark | Light control, uppercase chips in panels and the finale, the control widths in the builder, touch targets", async () => {
    const t = await fresh(opts);
    const accent = await t.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()), danger = await t.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--danger").trim());
    const hex = c => { const m = c.match(/\d+/g); return m ? "#" + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, "0")).join("").toUpperCase() : c; };
    // the confirm of an irreversible act
    await t.press("#more"); await t.page.click('#p-menu [data-act="delete"]'); await t.page.waitForSelector("#ask[open]"); await wait(200);
    assert.equal(hex(await t.page.$eval("#ask-ok", e => getComputedStyle(e).color)), danger.toUpperCase(), "the OK of Delete everywhere is red"); assert.ok(await t.page.$eval("#ask-ok", e => !e.classList.contains("accent")), "and not accent too");
    await t.esc(); await wait(200);
    // focus rings in Settings
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(200);
    for (const sel of ["#set-switch", "#set-pack", "#volume", "#menu-about"].filter(Boolean)) {
      const el = await t.page.$(sel); if (!el) continue;
      await t.page.evaluate(s => document.querySelector(s).focus({ focusVisible: true }), sel);
      const ring = await t.page.$eval(sel, e => e.matches(":focus-visible") ? getComputedStyle(e).outlineColor : "not focus-visible");
      if (ring !== "not focus-visible") assert.equal(hex(ring), accent.toUpperCase(), sel + " ring is the accent, not the browser's: " + ring);
    }
    if (opts.hasTouch) { for (const sel of ["#set-switch", "#set-pack", "#volume"]) assert.ok((await t.page.$eval(sel, e => e.getBoundingClientRect().height)) >= 44, sel + " is 44 px on touch"); }
    assert.equal(await t.page.$eval("#set-addurl-copy", e => getComputedStyle(e).textTransform), "uppercase", "a chip outside a row of actions carries the chip type");
    await t.esc(); await wait(200);
    // the builder: the Dark | Light control and Import keep their own width
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(200);
    await t.page.click("#sw-build"); await t.page.waitForSelector("#p-builder[open]"); await wait(150); // 1.9
    const seg = await t.page.$eval("#p-builder .seg2", e => e.getBoundingClientRect().width), body = await t.page.$eval("#p-builder .body", e => e.getBoundingClientRect().width);
    assert.ok(seg < body * 0.6, "the segmented control is not a bar across the panel: " + Math.round(seg) + " of " + Math.round(body));
    assert.equal(await t.page.$eval("#c-import-go", e => getComputedStyle(e).textTransform), "uppercase");
    await t.esc(); await wait(200);
    if (opts.hasTouch) assert.ok((await t.page.$eval("#count", e => e.getBoundingClientRect().height)) >= 44, "the count is a 44 px control on touch");
    if (!opts.hasTouch) { if (opts.hasTouch === false) { await t.page.keyboard.press("a"); await wait(300); assert.ok((await t.page.$eval("#all .sec-more", e => e.getBoundingClientRect().height)) >= 32, "the section ⋯ at the chip floor"); } }
    // the finale's chip
    for (let i = 0; i < 3; i++) { await t.press("#list .row:not(.done) .check"); await wait(500); } await wait(1200);
    assert.equal(await t.page.$eval("#again", e => getComputedStyle(e).textTransform), "uppercase", "the finale's chip is a chip");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.7: the screen reader's view — a line's name and description, the star keeps keyboard focus, the finale and the count announced, headings without Close, key hints hidden, the keys sheet a list, the Repeat title whole, Undo returns focus, a sheet starts at its title", async () => {
    const t = await fresh(opts);
    assert.equal(await t.page.$eval("#list .row:first-child .check", e => e.getAttribute("aria-label")), seedLines[0], "the name is the line");
    // a note becomes the description
    await t.press("#addtoday"); await t.page.keyboard.type("Post the form"); await t.page.keyboard.press("Tab"); await t.page.keyboard.type("Take the receipt"); await t.page.keyboard.press("Enter"); await t.page.keyboard.press("Escape"); await wait(500);
    const withNote = await t.page.$$eval("#list .row .check", els => els.map(e => [e.getAttribute("aria-label"), e.getAttribute("aria-description")]).find(x => x[0] === "Post the form"));
    assert.ok(withNote && /Take the receipt/.test(withNote[1]), "the note is spoken apart: " + JSON.stringify(withNote));
    // the count and the finale are announced
    await t.press("#list .row:first-child .check"); await wait(500);
    assert.equal((await t.page.textContent("#sr-note")).trim(), "1 of 4 done", "the count");
    for (let i = 0; i < 3; i++) { await t.press("#list .row:not(.done) .check"); await wait(450); } await wait(800);
    assert.ok(/That's the list\.$/.test((await t.page.textContent("#sr-note")).trim()), "the finale: " + await t.page.textContent("#sr-note"));
    await t.press("#again"); await wait(500);
    // headings are named by their title; key hints are hidden
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]");
    assert.ok(await t.page.$$eval("#p-menu .k.key", els => els.length > 0 && els.every(e => e.getAttribute("aria-hidden") === "true")), "key hints hidden from the reader");
    await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(250);
    { const snap = await t.page.locator("#p-lists h2").ariaSnapshot(); assert.ok(/heading "Lists"/.test(snap) && !/Close/.test(snap.split("\n")[0]), "the heading is the title alone: " + snap); }
    assert.equal(await t.page.evaluate(() => document.activeElement && document.activeElement.className), "body", "a sheet starts at its title");
    await t.esc(); await wait(200);
    if (!opts.hasTouch) {
      // the star keeps focus through the re-render
      await t.page.keyboard.press("a"); await wait(400);
      const id = await t.page.$eval("#all .row:first-child", e => e.dataset.id);
      await t.page.evaluate(() => document.querySelector("#all .row:first-child .tool.today").focus()); await t.page.keyboard.press("Enter"); await wait(700);
      assert.equal(await t.page.evaluate(() => { const a = document.activeElement; return a && a.classList.contains("today") ? a.closest(".row").dataset.id : String(a && a.tagName); }), id, "focus stays on the same line's star");
      // the keys sheet is a list
      await t.page.keyboard.press("Escape"); await wait(200); await t.page.keyboard.press("a"); await wait(300);
      await t.page.keyboard.press("?"); await t.page.waitForSelector("#p-keys[open]"); assert.ok(await t.page.locator("#p-keys dl.keys dt").count() > 5, "keys as a definition list"); await t.esc(); await wait(200);
      // Undo returns focus to the line
      await t.press("#list .row:first-child .check"); await wait(400); await t.page.click("#toast-undo"); await wait(600);
      assert.ok(await t.page.evaluate(() => document.activeElement && document.activeElement.classList.contains("check")), "focus on the line after Undo");
    } else {
      assert.notEqual(await t.page.$eval("#list .row:first-child .tool.lmenu", e => getComputedStyle(e).pointerEvents), "none", "the hidden ⋯ takes an assistive tap");
    }
    // the Repeat title is whole
    await t.press("#addtoday"); await t.page.keyboard.type("A line long enough that the old title cut it off before the end"); await t.page.keyboard.press("Enter"); await t.page.keyboard.press("Escape"); await wait(500);
    await t.lineMenu("#list .row:not(.done):last-of-type"); await t.page.click('#p-line [data-lact="repeat"]'); await t.page.waitForSelector("#p-repeat[open]"); await wait(200);
    assert.ok(/before the end$/.test((await t.page.textContent("#p-repeat-h")).trim()), "the whole line in the title: " + await t.page.textContent("#p-repeat-h"));
    await t.esc();
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | ")); await t.close();
  });

  await test(label + ": 1.7: the worker keys the cached navigation without the fragment; the test hook hands out no secret off the local transport (by code); Share… falls back to a copy when the system sheet fails; Copy code falls back to a field", async () => {
    const t = await fresh(opts, { url: BASE + "?transport=local&sw=1", init: "window.__clip = null; navigator.clipboard.writeText = async t => { window.__clip = t; };" });
    const id = (await t.s()).listId;
    await t.page.waitForFunction(() => navigator.serviceWorker && !!navigator.serviceWorker.controller, null, { timeout: 15000 }).catch(() => null);
    await t.page.goto(BASE + "?transport=local&sw=1#/l/" + id); await t.page.waitForSelector("#list .row"); await wait(1200);
    const keys = await t.page.evaluate(async () => { const out = []; for (const n of await caches.keys()) { const c = await caches.open(n); for (const r of await c.keys()) out.push(r.url); } return out; });
    assert.ok(keys.length > 5, "the shell is cached: " + keys.length); assert.ok(keys.every(u => !u.includes("#")), "no fragment in any cache key: " + keys.filter(u => u.includes("#")).join(" "));
    assert.ok(!keys.some(u => u.includes(id)), "the list's link is in no cache key");
    // Share… failing for a real reason
    if (opts.hasTouch) {
      await t.page.evaluate(() => { navigator.share = async () => { throw new Error("nope"); }; });
      await t.press("#more"); await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await wait(300);
      await t.page.click("#share-native"); await wait(400);
      assert.ok(/copied instead/.test(await t.page.textContent("#toast .msg")), "a copy instead, and a word about it: " + await t.page.textContent("#toast .msg"));
      assert.ok(/#\/r\//.test(await t.page.evaluate(() => window.__clip)), "the View link on the clipboard");
      await t.esc(); await wait(200);
    }
    // Copy code without a clipboard
    await t.page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error("no"); }; });
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(200);
    await t.page.click("#sw-build"); await t.page.waitForSelector("#p-builder[open]"); await wait(150); // 1.9
    await t.page.click("#c-export"); await wait(300);
    assert.ok(/^T2:/.test(await t.page.inputValue("#c-import")), "the code lands in the field"); assert.ok(/Select the code/.test(await t.page.textContent("#toast .msg")), "and the toast says so");
    await t.esc();
    const src = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
    assert.ok(/listId: TRANSPORT_KIND === "local" \? listId/.test(src) && /lookupId: TRANSPORT_KIND === "local" && ref/.test(src), "the hook's secrets are gated to the local transport");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.7: under reduced motion the finale's glow never flares", async () => {
    const t = await fresh(opts, { reducedMotion: "reduce" });
    await t.page.evaluate(() => { window.__flared = false; new MutationObserver(() => { if (document.getElementById("glow").classList.contains("flare")) window.__flared = true; }).observe(document.getElementById("glow"), { attributes: true, attributeFilter: ["class"] }); });
    for (let i = 0; i < 3; i++) { await t.press("#list .row:not(.done) .check"); await wait(500); }
    await wait(1600);
    assert.ok(await t.page.locator("#finale").isVisible(), "the finale"); assert.equal(await t.page.evaluate(() => window.__flared), false, "no flare");
    assert.equal((await t.page.textContent("#again")).trim(), "Bring them all back");
    await t.close();
  });

  await test(label + ": a new list — the save sheet, then the three seed lines of 32 characters or fewer all on screen, no tour, no mark, nothing else", async () => {
    const t = await fresh(opts);
    assert.equal(await t.page.locator("#list .row").count(), 3);
    assert.equal(await t.page.locator("#tour").count(), 0, "the tour is gone from the page");
    await wait(1500); // anything that wanted to appear after the save sheet has had its chance
    assert.ok(await t.page.locator("#mark").isHidden(), "no coach mark on Today after the save-link sheet");
    assert.equal(await t.page.locator("dialog[open]").count(), 0, "no sheet");
    assert.ok(await t.page.locator("#whatsnew").isHidden(), "no what's-new on first run");
    const texts = await t.page.$$eval("#list .row .tx", els => els.map(e => e.dataset.text));
    assert.equal(JSON.stringify(texts), JSON.stringify(seedLines));
    for (const l of texts) assert.ok(l.length <= 32, l + " is over 32 characters");
    const fits = await t.page.evaluate(() => { const l = document.getElementById("list"); const last = l.lastElementChild.getBoundingClientRect(); return { noScroll: l.scrollHeight <= l.clientHeight + 1, lastBottom: last.bottom, vh: innerHeight, addBottom: document.getElementById("addtoday").getBoundingClientRect().bottom }; });
    assert.ok(fits.noScroll && fits.lastBottom <= fits.vh && fits.addBottom <= fits.vh, "all three fit without scrolling: " + JSON.stringify(fits));
    assert.ok(/all three/.test(texts[2]), "the payoff line is last and visible");
    const st = await t.s(); assert.equal(st.seenVersion, VERSION, "first run marks the version seen silently");
    assert.equal(t.errors.length, 0, "page errors: " + t.errors); assert.equal(t.csp.length, 0, "csp: " + t.csp); assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty);
    await t.close();
  });

  await test(label + ": the welcome has no rail and no footer; both are back once a list opens", async () => {
    const t = await fresh(opts, { list: false });
    await t.page.waitForSelector("#welcome:not([hidden])");
    assert.equal(await t.page.$eval(".rail", e => getComputedStyle(e).display), "none", "rail hidden on welcome");
    assert.equal(await t.page.$eval("#foot", e => getComputedStyle(e).display), "none", "footer hidden on welcome");
    await t.page.evaluate(() => document.fonts.ready); await wait(300);
    const fonts = await t.page.evaluate(() => performance.getEntriesByType("resource").map(r => r.name).filter(n => /fonts\//.test(n)).map(n => n.replace(/.*fonts\//, "")).sort());
    assert.equal(fonts.join(" "), "lato-900.woff2 pt-sans-400.woff2 pt-sans-700.woff2", "the welcome pulls in the three faces 1.2 did and nothing more (first paint): " + fonts);
    const parts = await t.page.$$eval("#welcome > *:not([hidden])", els => els.map(e => e.tagName.toLowerCase()));
    assert.equal(parts.join(","), "h1,p", "the title and one sentence above the live list: " + parts);
    const below = await t.page.$$eval("#demo-foot > *:not([hidden])", els => els.map(e => e.tagName.toLowerCase() + (e.querySelector("#w-skip") ? "(skip, paste)" : "")));
    assert.equal(below.join(","), "div,p(skip, paste),div,p", "Keep's slot, the quiet links, the error slot, the About link: " + below);
    await t.page.click("#w-skip"); await t.page.waitForSelector("#p-save[open]"); await t.page.click("#save-done"); await wait(400);
    assert.equal(await t.page.$eval(".rail", e => getComputedStyle(e).display), "flex", "rail back with the list");
    await t.close();
  });

  await test(label + ": the rail is date · count with the sync dot · Today/Everything · Share · ⋯ (count · dot · views · ⋯ on the phone), no pills", async () => {
    const t = await fresh(opts);
    const items = await t.page.$$eval(".rail-l > *, .rail-r > *", els => els.filter(e => !e.hidden && getComputedStyle(e).display !== "none").map(e => e.id || e.className));
    assert.equal(items.join(" "), touch ? "status seg daynight more" : "date status seg daynight share more", items.join(" "));
    const dn = await t.page.$eval("#daynight", e => ({ next: e.dataset.next, title: e.title, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height }));
    assert.equal(dn.next, "day", "a dark system: Night is on, so the tap goes to Day: " + JSON.stringify(dn)); assert.equal(dn.title, "Day · T"); assert.ok(dn.w >= 30 && dn.h >= 32, "a real target: " + JSON.stringify(dn)); if (touch) assert.ok(dn.w >= 44 && dn.h >= 44, "44 px on touch");
    const dot = await t.page.$eval("#dot", e => ({ size: getComputedStyle(e, "::before").width, bg: getComputedStyle(e).backgroundColor, border: getComputedStyle(e).borderTopWidth }));
    assert.equal(dot.size, "6px", "6 px sync dot"); assert.ok(dot.bg === "rgba(0, 0, 0, 0)" && dot.border === "0px", "no pill around the dot: " + JSON.stringify(dot));
    assert.equal(await t.page.locator("#theme, #mute, #full").count(), 0, "theme, sound and full-screen chips are gone from the rail; the sun/moon is the one chip 1.2 added");
    await t.close();
  });

  await test(label + ": the ⋯ menu is nine rows in order, " + (touch ? "a bottom sheet" : "a popover under the button") + ", and Sound toggles in place", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await wait(300);
    const labels = await t.page.$$eval("#menu > *:not([hidden]) .lb", els => els.map(e => e.textContent.trim()));
    assert.equal(labels.join("|"), "Share this list|Theme|Sound|Full screen|How it works|Lists|Settings|About & privacy|Delete this list everywhere");
    assert.ok(await t.page.$("#menu-delete.danger"));
    const d = await rect(t.page, "#p-menu"), more = await rect(t.page, "#more");
    const pop = await t.page.$eval("#p-menu", e => e.classList.contains("pop"));
    if (touch) { assert.ok(!pop, "a sheet on the phone"); assert.ok(Math.abs(d.bottom - opts.viewport.height) < 2 && d.width >= opts.viewport.width - 1, "bottom sheet: " + JSON.stringify(d)); }
    else { assert.ok(pop, "a popover on the desktop"); assert.ok(d.top >= more.bottom && d.top < more.bottom + 20 && Math.abs(d.right - more.right) < 4, "anchored under ⋯: " + JSON.stringify({ d, more })); assert.equal(await t.page.$eval("#p-menu", e => getComputedStyle(e, "::backdrop").backgroundColor), "rgba(0, 0, 0, 0)", "no dim behind a popover"); }
    assert.equal(await t.page.textContent("#menu-theme-k"), "Dark");
    await t.press('#p-menu [data-act="sound"]'); await wait(200);
    assert.ok(await t.page.$("#p-menu[open]"), "the menu stays open for a toggle row"); assert.equal(await t.page.textContent("#menu-sound-k"), "Off");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.muted), true);
    await t.press('#p-menu [data-act="sound"]'); assert.equal(await t.page.textContent("#menu-sound-k"), "On");
    await t.esc(); await wait(200);
    if (!touch) { await t.page.keyboard.press("m"); assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.muted), true, "M still mutes"); await t.page.keyboard.press("m"); const s0 = (await t.s()).slot; await t.page.keyboard.press("t"); await wait(600); assert.notEqual((await t.s()).slot, s0, "T flips Day and Night"); assert.equal(await t.page.locator("#p-theme[open]").count(), 0, "and opens nothing"); await t.page.keyboard.press("t"); await wait(600); }
    await t.close();
  });

  await test(label + ": quiet rows — " + (touch ? "nothing on a row at rest but the checkbox, the words and (in Everything) a small star" : "nothing at rest, hover reveals exactly one control, the star stays"), async () => {
    const t = await fresh(opts);
    assert.equal((await t.visibleTools("#list")).length, 0, "Today at rest: no per-row buttons");
    assert.equal(await t.page.locator("#list .row .tool.pencil, #list .row .tool.kill, #list .row .tool.handle, #list .row .tool.more").count(), 0, "the pencil, delete, handle and chevron are gone");
    if (!touch) {
      await t.page.hover("#list .row:nth-child(2) .tx"); await wait(250);
      assert.equal((await t.visibleTools("#list")).join(","), "lmenu", "hover reveals exactly one control: ⋯");
      await t.away();
    }
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.esc(); await wait(200);
    const atRest = await t.visibleTools("#all");
    assert.equal(atRest.join(","), "today,today,today", "Everything at rest: only the stars: " + atRest);
    const star = await t.page.$eval("#all .row:first-child .tool.today", e => { const cs = getComputedStyle(e); const p = e.querySelector("path"); return { pressed: e.getAttribute("aria-pressed"), fill: getComputedStyle(p).fill, color: cs.color, border: cs.borderTopColor, bg: cs.backgroundColor, w: e.getBoundingClientRect().width, text: e.textContent.trim() }; });
    assert.equal(star.pressed, "true"); assert.ok(star.fill !== "none", "filled when on"); assert.equal(star.text, "", "no label, no pill");
    assert.ok(star.bg === "rgba(0, 0, 0, 0)" && (star.border === "rgba(0, 0, 0, 0)" || star.border === "transparent"), "no pill: " + JSON.stringify(star));
    const accent = await t.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent-text").trim().toUpperCase());
    const toHex = c => "#" + c.match(/\d+/g).slice(0, 3).map(v => (+v).toString(16).padStart(2, "0")).join("").toUpperCase();
    assert.ok(toHex(star.color) !== accent, "no orange at rest: " + star.color + " vs " + accent);
    await t.press("#all .row:first-child .tool.today"); await wait(300);
    const off = await t.page.$eval("#all .row:first-child .tool.today", e => ({ pressed: e.getAttribute("aria-pressed"), fill: getComputedStyle(e.querySelector("path")).fill }));
    assert.equal(off.pressed, "false"); assert.equal(off.fill, "none", "hollow when off");
    if (!touch) { await t.page.hover("#all .row:nth-child(2) .tx"); await wait(250); const h = await t.visibleTools("#all"); assert.equal(h.filter(x => x === "lmenu").length, 1, "hover reveals one more control: " + h); await t.away(); }
    else { assert.equal(await t.page.$$eval("#all .row .tool.lmenu", els => els.filter(e => e.getBoundingClientRect().width > 2).length), 0, "⋯ is not on the phone's rows (assistive tech still reaches it)"); }
    const adds = await t.page.$$eval("#addsec, #all .add", els => els.map(e => getComputedStyle(e).fontSize + "/" + getComputedStyle(e).borderTopStyle));
    await t.press("#v-today"); const addToday = await t.page.$eval("#addtoday", e => getComputedStyle(e).fontSize + "/" + getComputedStyle(e).borderTopStyle);
    assert.ok(adds.every(a => a === addToday), "one add style everywhere: " + JSON.stringify([addToday, adds]));
    await t.close();
  });

  await test(label + ": the line menu opens by " + (touch ? "a hold released in place and by a swipe right, Edit first; a hold that moves drags" : "⋯, Edit first; dragging ⋯ moves the line; the popover sits by the row"), async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.esc(); await wait(200);
    await t.lineMenu("#all .row:nth-child(2)");
    assert.equal((await t.page.textContent("#p-line .menu button:first-child .lb")).trim(), "Edit", "Edit at the top");
    if (!touch) { assert.ok(await t.page.$eval("#p-line", e => e.classList.contains("pop")), "popover"); const d = await rect(t.page, "#p-line"), g = await rect(t.page, "#all .row:nth-child(2) .tool.lmenu"); assert.ok(d.top >= g.bottom - 1 && Math.abs(d.right - g.right) < 8, "under ⋯: " + JSON.stringify({ d, g })); }
    else assert.ok(!(await t.page.$eval("#p-line", e => e.classList.contains("pop"))), "a sheet on the phone");
    await t.esc(); await wait(300);
    const first = await t.page.$eval("#all .row:first-child .tx", e => e.dataset.text);
    if (touch) {
      // swipe right → the menu
      await t.hold("#all .row:nth-child(3) .tx", 60, 120); await t.page.waitForSelector("#p-line[open]"); await t.esc(); await wait(300);
      // a hold that moves: row 1 dragged below row 2
      const b1 = await rect(t.page, "#all .row:nth-child(1) .tx"), b2 = await rect(t.page, "#all .row:nth-child(2)");
      const cdp = await t.ctx.newCDPSession(t.page); const x = b1.left + 40, y0 = b1.top + b1.height / 2;
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] }); await wait(550);
      for (let i = 1; i <= 10; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 + i * ((b2.bottom - y0) / 10) }] }); await wait(20); }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach(); await wait(500);
      assert.equal(await t.page.$eval("#all .row:nth-child(2) .tx", e => e.dataset.text), first, "moved down by a hold-and-drag");
      assert.equal(await t.page.locator("#p-line[open]").count(), 0, "no menu after a drag");
    } else {
      const g = await rect(t.page, "#all .row:nth-child(2) .tool.lmenu"); await t.page.hover("#all .row:nth-child(2) .tx"); await wait(150);
      const r1 = await rect(t.page, "#all .row:nth-child(1)");
      await t.page.mouse.move(g.left + g.width / 2, g.top + g.height / 2); await t.page.mouse.down(); await t.page.mouse.move(g.left + g.width / 2, g.top - 12, { steps: 4 }); await t.page.mouse.move(g.left + g.width / 2, r1.top + 4, { steps: 8 }); await wait(80); await t.page.mouse.up(); await wait(700);
      assert.equal(await t.page.$eval("#all .row:nth-child(2) .tx", e => e.dataset.text), first, "row 2 dragged above row 1 by its ⋯");
      assert.equal(await t.page.locator("#p-line[open]").count(), 0, "no menu after a drag");
      await t.away();
    }
    // the section menu follows the same rule
    await t.page.click("#addsec"); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Work"); await t.page.click("#ask-ok"); await wait(400);
    if (!touch) await t.page.hover('#all .sec:not([data-id=""]) .sec-h');
    await t.press('#all .sec:not([data-id=""]) .sec-more'); await t.page.waitForSelector("#p-sec[open]");
    assert.equal(await t.page.$eval("#p-sec", e => e.classList.contains("pop")), !touch, "section menu: popover on the desktop, sheet on the phone");
    await t.esc();
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the three just-in-time hints each appear once and never again (the star, drag, the menu)", async () => {
    const t = await fresh(opts);
    assert.equal(JSON.stringify((await t.s()).hints), "{}", "a fresh device has seen none");
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(400);
    assert.equal((await t.s()).mark, "today", "the star hint on the first Everything");
    assert.ok(await t.page.locator("#mark").isVisible()); assert.ok(/star/i.test(await t.page.textContent("#mark-text")));
    assert.ok(await t.page.$("#all .row:first-child .tool.today.marked"), "it points at the first line's star");
    await t.press("#all .row:first-child .tool.today"); await wait(300);
    assert.equal((await t.s()).mark, "", "doing the thing dismisses it"); assert.equal(await t.page.getAttribute("#all .row:first-child .tool.today", "aria-pressed"), "false", "and the tap still counted");
    await t.press("#v-today"); await t.press("#v-all"); await wait(400); assert.equal((await t.s()).mark, "", "never again");
    if (touch) {
      const during = await t.hold("#all .row:nth-child(2) .tx"); assert.equal(during.mark, "drag", "the drag hint while the line is held"); assert.ok(during.dragging);
      await t.page.waitForSelector("#p-line[open]"); assert.equal((await t.s()).mark, "", "gone on release"); await t.esc(); await wait(300);
      assert.equal((await t.hold("#all .row:nth-child(3) .tx")).mark, "", "a second hold shows nothing"); await t.esc(); await wait(300);
      await t.hold("#all .row:nth-child(2) .tx"); await t.press('#p-line [data-lact="edit"]');
    } else {
      await t.page.hover("#all .row:nth-child(2) .tx"); await wait(120); await t.page.hover("#all .row:nth-child(2) .tool.lmenu"); await wait(300);
      assert.equal((await t.s()).mark, "drag", "the drag hint on the first ⋯ hover"); assert.ok(/Drag/.test(await t.page.textContent("#mark-text")));
      await t.esc(); await wait(200); assert.equal((await t.s()).mark, "", "a key dismisses it");
      await t.away(); await t.page.hover("#all .row:nth-child(3) .tx"); await wait(120); await t.page.hover("#all .row:nth-child(3) .tool.lmenu"); await wait(300); assert.equal((await t.s()).mark, "", "never again"); await t.away();
      await t.page.focus("#all .row:nth-child(2) .check"); await t.page.keyboard.press("e");
    }
    await t.page.waitForSelector("#all .row.editing"); await t.page.keyboard.type(" now"); await t.page.keyboard.press("Enter"); await wait(300); // Enter saves and opens the next line
    await t.esc(); await wait(500);
    assert.equal((await t.s()).mark, "menu", "the menu hint once the first edit is done and no editor is open");
    assert.ok(new RegExp(touch ? "Hold" : "⋯").test(await t.page.textContent("#mark-text")));
    await t.esc(); await wait(200);
    assert.equal(JSON.stringify((await t.s()).hints), JSON.stringify({ today: true, drag: true, menu: true }));
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
    assert.equal(JSON.stringify((await t.s()).hints), JSON.stringify({ today: true, drag: true, menu: true }), "remembered on the device");
    await t.press("#v-all"); await wait(400); assert.equal((await t.s()).mark, "", "nothing after a reload either");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the footers are four items per view" + (touch ? " (hidden on the phone)" : ""), async () => {
    const t = await fresh(opts);
    if (touch) { assert.equal(await t.page.$eval("#hint", e => getComputedStyle(e).display), "none"); await t.close(); return; }
    const items = () => t.page.$$eval("#hint em", els => els.map(e => e.textContent));
    assert.equal((await items()).join(" "), "1–3 N E ?", "Today: 1–3 check off · N new · E edit · ? help");
    assert.equal(await t.page.$eval("#hint", e => e.textContent.replace(/\s+/g, " ").trim()), "1–3 check off · N new · E edit · ? help");
    await t.press("#v-all"); await wait(200);
    assert.equal(await t.page.$eval("#hint", e => e.textContent.replace(/\s+/g, " ").trim()), "A today · N new · / search · ? help");
    await t.esc(); await t.page.keyboard.press("?"); await t.page.waitForSelector("#p-keys[open]");
    assert.ok(/Undo/.test(await t.page.textContent("#keys-body")) && /Hover a line/.test(await t.page.textContent("#keys-body")), "? is the reference: every key and the mouse"); assert.ok(/Day ↔ Night/.test(await t.page.textContent("#keys-body")) && /Appearance/.test(await t.page.textContent("#keys-body")), "T and ⇧T in the reference");
    await t.page.click("#keys-help"); await t.page.waitForSelector("#p-help[open]"); assert.ok(/no tour/i.test(await t.page.textContent("#help-body")));
    await t.esc();
    await t.close();
  });

  if (!touch) await test(label + ": the idle fade — after 4 s the rail and footer fade to the date and the count; a move brings them back; off with a panel, off during the finale, off by setting", async () => {
    const t = await fresh(opts);
    await t.away(); await wait(4400);
    assert.ok((await t.s()).idle, "idle after 4 s"); await wait(1600);
    const op = sel => t.page.$eval(sel, e => +getComputedStyle(e).opacity);
    assert.ok((await op(".seg")) < 0.05 && (await op("#share")) < 0.05 && (await op("#foot")) < 0.05 && (await op("#daynight")) < 0.05, "the views, the sun/moon, Share and the footer faded");
    assert.equal(await op("#date"), 1); assert.equal(await op(".status"), 1, "the date and the count stay");
    await t.page.mouse.move(600, 400); await wait(400);
    assert.ok(!(await t.s()).idle, "a move brings them back"); assert.equal(await op(".seg"), 1);
    await t.page.keyboard.press("Shift"); await t.away(); await wait(2000); await t.page.keyboard.press("Shift"); await wait(3000); assert.ok(!(await t.s()).idle, "a key resets the clock");
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await wait(4600); assert.ok(!(await t.s()).idle, "no fade while a panel is open"); await t.esc();
    for (let i = 0; i < 3; i++) { await t.press("#list .row:not(.done) .check"); await wait(450); } await wait(1200); await t.away(); await wait(4600);
    assert.ok(!(await t.s()).idle, "no fade during the finale"); assert.ok(await t.page.locator("#finale.on").isVisible());
    await t.press("#again"); await wait(300);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.getAttribute('[data-set="fade"]', "aria-pressed"), "true", "on by default"); await t.page.click('[data-set="fade"]'); await t.esc(); await t.away(); await wait(4600);
    assert.ok(!(await t.s()).idle, "off by the setting");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.idleFadeOff), true);
    await t.close();
  });

  await test(label + ": 1.9: Settings is three groups — Appearance, This device, This list — the toggles hold, Templates shows only for a list with no sections, and This list keeps the add-from-anywhere URL beside Export & import ›", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    const heads = await t.page.$$eval("#p-settings h3", els => els.map(e => e.textContent.trim()));
    assert.equal(heads.join("|"), "Appearance|This device|This list");
    assert.equal(await t.page.locator('#p-settings [data-set="removed"], #p-settings [data-set="history"]').count(), 0, "Removed lists and History left Settings (proposal 5)");
    const habits = await t.page.$$eval("#p-settings h3:nth-of-type(2) + .menu > *:not([hidden])", els => els.map(e => (e.querySelector(".lb") || e).firstChild.textContent.trim()));
    const wake = (await t.page.locator('[data-set="wake"]:not([hidden])').count()) ? ["Keep screen awake"] : [];
    const want = ["Sound", "Sound pack", "Volume", "Celebrate changes from other devices", "Day review", ...wake, ...(touch ? ["Swipe left for “Not today”"] : ["Single-key shortcuts", "Fade controls when idle"]), "Show who's here"];
    assert.equal(habits.join("|"), want.join("|"), "this device's habits, in the mockup's order");
    assert.ok(!(await t.page.$eval('[data-set="templates"]', e => e.hidden)), "no sections yet: Templates shows under This list");
    assert.equal(await t.page.locator("#set-full").count(), 0, "Full screen left Settings for ⋯");
    assert.ok(new RegExp(VERSION_LABEL.replace(/[.()]/g, "\\$&")).test(await t.page.textContent("#set-version")), "the version line: " + await t.page.textContent("#set-version"));
    for (const k of ["review", "celebrate", "who"]) { await t.page.click(`[data-set="${k}"]`); }
    assert.equal(await t.page.getAttribute('[data-set="review"]', "aria-pressed"), "true");
    assert.equal(await t.page.getAttribute('[data-set="who"]', "aria-pressed"), "false");
    // Appearance (1.2): Day theme · Night theme · Switch; the old Follow system and Schedule toggles are gone
    const app = await t.page.$$eval("#p-settings h3:first-of-type + .menu > *", els => els.map(e => (e.querySelector(".lb") || e).firstChild.textContent.trim()));
    assert.equal(app.slice(0, 3).join("|"), "Day theme|Night theme|Switch", app.join("|"));
    assert.equal(await t.page.locator('[data-set="follow"], [data-set="schedule"], [data-set="theme"], #sch-day, #sch-night').count(), 0, "the 1.1 rows are gone");
    assert.equal(await t.page.$eval("#set-switch", e => e.value), "system", "a fresh device switches with the system");
    assert.equal(await t.page.$$eval("#set-switch option", os => os.map(o => o.textContent).join("|")), "By hand|With the system|On a schedule");
    await t.page.selectOption("#set-switch", "schedule"); await wait(150); assert.ok(await t.page.locator("#schedule-block").isVisible(), "the times show for a schedule"); assert.ok(/Day from 07:00, night from 19:00/.test(await t.page.textContent("#set-switch-sub")));
    await t.page.selectOption("#set-switch", "hand"); await wait(150); assert.ok(await t.page.locator("#schedule-block").isHidden()); assert.ok(/sun and moon/.test(await t.page.textContent("#set-switch-sub")));
    await t.page.selectOption("#set-switch", "system"); await wait(150);
    // This list: the URL, export and import one level down, Templates while the list has no sections
    const adv = await t.page.$$eval("#p-settings h3:last-of-type ~ .menu > *:not([hidden])", els => els.map(e => (e.querySelector(".lb") || e).textContent.trim().split(/\n|(?<=[a-z])(?=[A-Z])/)[0].slice(0, 18)));
    assert.equal(adv.join("|"), "Add from anywhere|Export & import|Templates", adv.join("|"));
    assert.ok((await t.page.inputValue("#set-addurl")).includes("/add?text="), "the personalised URL is still there");
    await t.page.click('[data-set="export"]'); await t.page.waitForSelector("#p-export[open]");
    assert.equal(await t.page.locator("#set-export-json:not([disabled]), #set-export-md:not([disabled]), #set-import-file").count(), 3, "export and import inside the sub-sheet");
    assert.ok(/only backup/.test(await t.page.textContent("#p-export")));
    await t.esc();
    // the settings survive a reload
    await t.reload(); await t.page.waitForSelector("#list .row");
    const dev = await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device);
    assert.equal(dev.review, true); assert.equal(dev.celebrateRemote, true); assert.equal(dev.whoOff, true); assert.equal(dev.switch.mode, "system");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": repeat rule from the line menu, the glyph, and the rollover reset", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.esc();
    await t.lineMenu("#all .row:first-child");
    await t.page.click('#p-line [data-lact="repeat"]'); await t.page.waitForSelector("#p-repeat[open]");
    await t.page.click('#repeat-kinds [data-kind="daily"]'); await t.page.click("#repeat-done"); await wait(300);
    assert.equal(await t.page.locator("#all .row:first-child .rep").count(), 1, "repeat glyph");
    const id = await t.page.getAttribute("#all .row:first-child", "data-id");
    // check it off, roll over to tomorrow: it is in History and back undone on Today
    await t.press("#v-today"); await t.press(`#list .row[data-id="${id}"] .check`); await wait(800);
    const tomorrow = await t.page.evaluate(async () => { const M = await import("./model.js"); return M.addDays(M.localDate(), 1); });
    await t.page.evaluate(d => window.__tfTest.rollover(d), tomorrow); await wait(500);
    const st = await t.page.evaluate(id => { const d = JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc; return { done: d.items[id].done, today: d.items[id].today, deleted: !!d.items[id].deleted, hist: Object.values(d.history).flat().some(e => e.id === id), rule: !!(d.rules[id] && !d.rules[id].deleted) }; }, id);
    assert.equal(st.deleted, false); assert.equal(st.done, false); assert.equal(st.today, true); assert.equal(st.hist, true); assert.equal(st.rule, true);
    assert.equal(await t.page.locator(`#list .row[data-id="${id}"]:not(.done)`).count(), 1, "back on Today undone");
    await t.close();
  });

  await test(label + ": not today — " + (touch ? "swipe left" : "the - key") + ", the tomorrow tag, and the return", async () => {
    const t = await fresh(opts);
    const id = await t.page.getAttribute("#list .row:first-child", "data-id");
    if (touch) {
      const box = await (await t.page.$("#list .row:first-child .tx")).boundingBox();
      const x = box.x + box.width * 0.8, y = box.y + box.height / 2;
      await t.page.touchscreen.tap(x, y); await wait(200); // a tap toggles; undo it so the swipe starts from undone
      await t.page.touchscreen.tap(x, y); await wait(400);
      const cdp = await t.ctx.newCDPSession(t.page);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= 8; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - i * 20, y }] }); await wait(16); }
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await wait(600);
    } else { await t.page.focus("#list .row:first-child .check"); await t.page.keyboard.press("-"); await wait(400); }
    assert.equal(await t.page.locator(`#list .row[data-id="${id}"]`).count(), 0, "left Today");
    await t.page.click("#v-all"); await wait(300);
    assert.equal(await t.page.locator(`#all .row[data-id="${id}"] .cap.tmr`).count(), 1, "tomorrow tag");
    const tomorrow = await t.page.evaluate(async () => { const M = await import("./model.js"); return M.addDays(M.localDate(), 1); });
    await t.page.evaluate(d => window.__tfTest.rollover(d), tomorrow); await wait(400);
    assert.equal(await t.page.locator(`#all .row[data-id="${id}"] .cap.tmr`).count(), 0, "tag gone");
    await t.page.click("#v-today"); await wait(300);
    assert.equal(await t.page.locator(`#list .row[data-id="${id}"]`).count(), 1, "back on Today");
    await t.close();
  });

  await test(label + ": one-thing mode — the top undone line only, the next slides in, the finale ends it, remembered", async () => {
    const t = await fresh(opts);
    if (touch) await t.page.tap("#count"); else await t.page.keyboard.press("o");
    await wait(400);
    assert.ok(await t.page.evaluate(() => document.body.classList.contains("one")), "body.one");
    const vis = await t.page.$$eval("#list .row", rows => rows.filter(r => getComputedStyle(r).display !== "none").length);
    assert.equal(vis, 1, "one visible row");
    const size = await t.page.$eval("#list .row.one-now", r => parseFloat(getComputedStyle(r).fontSize));
    assert.ok(size > (touch ? 44 : 100), "enormous: " + size);
    const first = await t.page.getAttribute("#list .row.one-now", "data-id");
    await t.press("#list .row.one-now .check"); await wait(900);
    const second = await t.page.getAttribute("#list .row.one-now", "data-id");
    assert.ok(second && second !== first, "the next one is up");
    assert.ok(/more after this|Last one/.test(await t.page.textContent(".one-more")));
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
    assert.ok(await t.page.evaluate(() => document.body.classList.contains("one")), "remembered per device");
    for (let i = 0; i < 2; i++) { await t.press("#list .row.one-now .check"); await wait(700); }
    await wait(900);
    assert.ok(!(await t.page.evaluate(() => document.body.classList.contains("one"))), "the finale ends it");
    assert.ok(await t.page.locator("#finale.on").isVisible());
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": search — no lone icon; a Search button past eight lines, / always works, Escape clears", async () => {
    const t = await fresh(opts);
    const { listId } = await t.s();
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.esc();
    assert.ok(await t.page.$eval("#all-head", e => e.hidden), "three lines: no search affordance at all");
    assert.equal(await t.page.locator("#all-head svg").count(), 0, "no lone icon");
    if (!touch) { await t.page.keyboard.press("/"); await t.page.waitForSelector("#search:not([hidden])"); assert.ok(!(await t.page.$eval("#all-head", e => e.hidden)), "/ opens the field even under eight lines"); await t.esc(); await wait(200); assert.ok(await t.page.$eval("#all-head", e => e.hidden), "and it goes away again"); }
    await t.page.goto(BASE + "?transport=local#/l/" + listId + "/add?text=Four%0AFive%0ASix%0ASeven%0AEight%0ANine"); await wait(1200);
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300);
    assert.equal(await t.page.locator("#all .row").count(), 9);
    assert.ok(!(await t.page.$eval("#all-head", e => e.hidden)), "nine lines: the Search button appears");
    assert.equal(await t.page.$eval("#search-btn", e => e.firstChild.textContent.trim()), "Search", "worded, not an icon");
    if (touch) await t.page.tap("#search-btn"); else await t.page.keyboard.press("/");
    await t.page.waitForSelector("#search:not([hidden])");
    await t.page.type("#search", "your own"); await wait(200);
    assert.equal(await t.page.$$eval("#all .row", rows => rows.filter(r => getComputedStyle(r).display !== "none").length), 1);
    await t.page.fill("#search", "zzz-nothing"); await wait(200);
    assert.ok(await t.page.locator(".nohits").isVisible());
    await t.esc(); await wait(200);
    assert.equal(await t.page.$$eval("#all .row", rows => rows.filter(r => getComputedStyle(r).display !== "none").length), 9);
    assert.ok(!(await t.page.$eval("#all-head", e => e.hidden)), "the button stays while there are nine lines");
    await t.close();
  });

  await test(label + ": recently deleted at the bottom of Everything (delete from the line menu), with Restore", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await wait(300); await t.esc();
    const text = await t.page.$eval("#all .row:nth-child(2) .tx", e => e.dataset.text);
    await t.lineMenu("#all .row:nth-child(2)"); await t.page.click('#p-line [data-lact="delete"]'); await wait(500);
    assert.ok(/Recently deleted \(1\)/.test(await t.page.textContent("#deleted summary")));
    await t.page.click("#deleted summary"); await wait(200);
    assert.ok((await t.page.textContent("#deleted li .t")).includes(text));
    await t.page.click("#deleted [data-restore]"); await wait(400);
    assert.equal(await t.page.locator("#deleted").count(), 0);
    assert.equal(await t.page.locator("#all .row").count(), 3);
    await t.close();
  });

  await test(label + ": section menu — templates (save, insert), put all on Today / take all off", async () => {
    const t = await fresh(opts);
    await t.page.click("#v-all"); await wait(300); await t.esc(); await t.page.click("#addsec"); await t.page.fill("#ask-input", "Work"); await t.page.click("#ask-ok"); await wait(300);
    await t.press("#all .sec .sec-more"); await t.page.waitForSelector("#p-sec[open]");
    await t.page.click('#p-sec [data-sact="template"]'); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Five"); await t.page.click("#ask-ok"); await wait(300);
    await t.press("#all .sec .sec-more"); await t.page.click('#p-sec [data-sact="today-off"]'); await wait(400);
    assert.equal(await t.page.locator('#all .tool.today[aria-pressed="true"]').count(), 0, "all off Today");
    await t.press("#all .sec .sec-more"); await t.page.click('#p-sec [data-sact="today-on"]'); await wait(400);
    assert.equal(await t.page.locator('#all .tool.today[aria-pressed="true"]').count(), 3, "all on Today");
    await t.press('#all .sec[data-id="' + await t.page.$eval('#all .sec:not([data-id=""])', e => e.dataset.id) + '"] .sec-more'); await t.page.click('#p-sec [data-sact="insert"]'); await t.page.waitForSelector("#p-pick[open]");
    await t.page.click("#pick-menu button"); await wait(400);
    assert.equal(await t.page.locator("#all .row").count(), 6, "three template lines inserted into Work");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.click('[data-set="templates"]'); await t.page.waitForSelector("#p-pick[open]");
    assert.ok(/Five/.test(await t.page.textContent("#pick-menu")));
    await t.close();
  });

  await test(label + ": move a line to another list, and the target holds it", async () => {
    const t = await fresh(opts);
    const first = await t.s();
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]");
    await t.page.click("#l-new"); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Second"); await t.page.click("#ask-ok"); await wait(600);
    await t.page.waitForSelector("#p-save[open]"); await t.page.click("#save-done"); await wait(400);
    const second = await t.s(); assert.ok(second.listId !== first.listId);
    // back to the first, move its first line to Second
    await t.press("#listname"); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu .row > button:first-child:not(:has(.cur))"); await wait(600);
    assert.equal((await t.s()).listId, first.listId);
    const text = await t.page.$eval("#list .row:first-child .tx", e => e.dataset.text);
    await t.lineMenu("#list .row:first-child"); await t.page.click('#p-line [data-lact="move"]'); await t.page.waitForSelector("#p-pick[open]");
    await t.page.click("#pick-menu button"); await wait(500);
    assert.equal(await t.page.locator("#list .row").count(), 2);
    const held = await t.page.evaluate(id => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + id)).doc.items).filter(i => !i.deleted).map(i => i.text), second.listId);
    assert.ok(held.includes(text), "target holds " + text + ": " + JSON.stringify(held));
    await t.page.click("#toast-undo"); await wait(500);
    assert.equal(await t.page.locator("#list .row").count(), 3, "moved back");
    await t.close();
  });

  await test(label + ": 1.9: Move to… files a line under another section of this list — the sections first, then the other lists — and Undo brings it home", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); if (await t.page.$("#mark:not([hidden])")) { await t.esc(); }
    await t.page.click("#addsec"); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Errands"); await t.page.click("#ask-ok"); await wait(400);
    const text = await t.page.$eval("#all .row:first-child .tx", e => e.dataset.text);
    await t.lineMenu("#all .row:first-child"); assert.equal(await t.page.$eval('#p-line [data-lact="move"] .lb', e => e.firstChild.textContent.trim()), "Move to…", "the row is Move to…");
    await t.page.click('#p-line [data-lact="move"]'); await t.page.waitForSelector("#p-pick[open]"); await wait(200);
    const rows = await t.page.$$eval("#pick-menu > *", els => els.map(e => (e.classList.contains("group-h") ? "#" : "") + (e.querySelector(".lb") || e).firstChild.textContent.trim()));
    assert.deepEqual(rows, ["#This list", "Errands"], "this list's other sections, and no other list yet: " + rows.join("|"));
    await t.page.click("#pick-menu button"); await wait(600);
    assert.equal(await t.page.$eval('#all .sec[data-id]:not([data-id=""]) .row:last-child .tx', e => e.dataset.text), text, "the line is at the end of Errands");
    assert.ok(/Moved to Errands/.test(await t.page.textContent("#toast .msg")));
    await t.page.click("#toast-undo"); await wait(500);
    assert.equal(await t.page.$eval('#all .sec[data-id=""] .row:first-child .tx', e => e.dataset.text), text, "Undo brings it back to Unsorted");
    // with another list on the device the picker has both groups; a line already in Errands is offered Unsorted, not Errands
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#l-new"); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Second"); await t.page.click("#ask-ok"); await wait(600);
    await t.page.waitForSelector("#p-save[open]"); await t.page.click("#save-done"); await wait(400);
    await t.press("#listname"); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu .row > button:first-child:not(:has(.cur))"); await wait(600);
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300);
    await t.lineMenu("#all .row:first-child"); await t.page.click('#p-line [data-lact="move"]'); await t.page.waitForSelector("#p-pick[open]"); await wait(200);
    await t.page.click("#pick-menu button"); await wait(500); // into Errands
    await t.lineMenu('#all .sec[data-id]:not([data-id=""]) .row:last-child'); await t.page.click('#p-line [data-lact="move"]'); await t.page.waitForSelector("#p-pick[open]"); await wait(200);
    const both = await t.page.$$eval("#pick-menu > *", els => els.map(e => (e.classList.contains("group-h") ? "#" : "") + (e.querySelector(".lb") || e).firstChild.textContent.trim()));
    assert.deepEqual(both, ["#This list", "Unsorted", "#Other lists on this device", "Second"], both.join("|"));
    await t.esc(); assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": delete this list everywhere, then undo within ten seconds", async () => {
    const t = await fresh(opts);
    const { listId, lookupId } = await t.s();
    await t.press("#more"); await t.page.click('#p-menu [data-act="delete"]'); await t.page.waitForSelector("#ask[open]");
    assert.ok(/ten seconds/.test(await t.page.textContent("#ask-msg")));
    await t.page.click("#ask-ok"); await wait(800);
    assert.ok(await t.page.locator("#welcome").isVisible(), "welcome after the last list goes");
    assert.equal(await t.page.evaluate(id => localStorage.getItem("tf/v2/localserver/" + id), lookupId), null, "row gone from the local server");
    assert.equal(await t.page.evaluate(id => localStorage.getItem("tf/v3/list/" + id), listId), null, "local copy gone");
    await t.page.click("#toast-undo"); await wait(1000);
    assert.equal((await t.s()).listId, listId, "same link");
    assert.equal(await t.page.locator("#list .row").count(), 3);
    assert.ok(await t.page.evaluate(id => !!localStorage.getItem("tf/v2/localserver/" + id), lookupId), "row re-created");
    await t.close();
  });

  await test(label + ": add from anywhere — lines land on Today, the address is cleaned, a view link is refused", async () => {
    const t = await fresh(opts);
    const { listId, R } = await t.s();
    await t.page.goto(BASE + "?transport=local#/l/" + listId + "/add?text=Call%20Bob%0ABuy%20milk&section=Nope");
    await wait(1200);
    const texts = await t.page.$$eval("#list .row .tx", els => els.map(e => e.dataset.text));
    assert.ok(texts.includes("Call Bob") && texts.includes("Buy milk"), JSON.stringify(texts));
    assert.ok(!/add/.test(await t.page.evaluate(() => location.hash)), "hash cleaned");
    await t.reload(); await wait(800);
    assert.equal(await t.page.locator("#list .row").count(), 5, "a reload adds nothing");
    await t.page.goto(BASE + "?transport=local#/r/" + R + "/add?text=Nope"); await wait(1500);
    assert.ok(/view link/i.test(await t.page.textContent("#toast .msg")), "refused out loud");
    assert.equal(await t.page.locator("#list .row").count(), 5);
    await t.close();
  });

  await test(label + ": view-only link celebrates remote check-offs; an edit link only with the setting", async () => {
    const editor = await fresh(opts);
    const { R, listId } = await editor.s();
    await editor.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    const viewer = await fresh(opts, { url: BASE + "?transport=local#/r/" + R, list: false, ctx: editor.ctx });
    await viewer.page.waitForSelector("#list .row"); await wait(500);
    await viewer.page.evaluate(() => document.dispatchEvent(new PointerEvent("pointerdown"))); // primes the audio context like a first tap would
    const before = (await viewer.s()).stats;
    await editor.press("#list .row:first-child .check"); await wait(1500);
    const after = (await viewer.s()).stats;
    assert.ok(after.check > before.check, "viewer played the check: " + JSON.stringify(after));
    assert.ok(after.burst > before.burst, "viewer burst confetti");
    // finish the rest: the viewer gets the finale
    for (let i = 2; i <= 3; i++) { await editor.press("#list .row:not(.done) .check"); await wait(700); }
    await wait(1800);
    assert.ok((await viewer.s()).stats.finish >= 1, "viewer finale");
    assert.equal(viewer.errors.length, 0, viewer.errors.join("; "));
    // a second editor (edit link) stays quiet by default, and celebrates with the setting on
    const other = await fresh(opts, { url: BASE + "?transport=local#/l/" + listId, list: false, ctx: editor.ctx });
    await other.front(); await other.page.waitForSelector("#list .row"); await other.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    await editor.press("#again"); await wait(1200);
    const q0 = (await other.s()).stats;
    await editor.press("#list .row:first-child .check"); await wait(1500);
    assert.equal((await other.s()).stats.check, q0.check, "edit link is quiet by default");
    await other.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.celebrateRemote = true; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await other.front(); await other.reload(); await other.page.waitForSelector("#list .row"); await other.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    await other.page.evaluate(() => document.dispatchEvent(new PointerEvent("pointerdown")));
    const q1 = (await other.s()).stats;
    await editor.press("#list .row:not(.done) .check"); await wait(1500);
    assert.ok((await other.s()).stats.check > q1.check, "celebrates with the setting on");
    await viewer.close(); await other.close(); await editor.close();
  });

  await test(label + ": 1.9: the losing side of a simultaneous edit gets a word — a pull that replaces a line this device just rewrote toasts once, and Undo puts the words back so they win", async () => {
    const t = await fresh(opts); const { listId } = await t.s();
    await t.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    const b = await fresh(opts, { url: BASE + "?transport=local#/l/" + listId, list: false, ctx: t.ctx }); await b.page.waitForSelector("#list .row"); await wait(800);
    const edit = async (p, text) => { await p.focus("#list .row:first-child .check"); await p.keyboard.press("e"); await p.waitForSelector("#list .row.editing textarea"); await p.keyboard.press("Meta+a"); await p.keyboard.press("Control+a"); await p.keyboard.type(text); await p.keyboard.press("Escape"); await wait(100); };
    // Escape cancels: commit with Enter instead, then close the new line it opens
    const commit = async (p, text) => { await p.focus("#list .row:first-child .check"); await p.keyboard.press("e"); await p.waitForSelector("#list .row.editing textarea"); await p.$eval("#list .row.editing textarea", (ta, v) => { ta.value = v; ta.dispatchEvent(new Event("input", { bubbles: true })); }, text); await p.keyboard.press("Enter"); await wait(150); await p.keyboard.press("Escape"); await wait(400); };
    await commit(t.page, "call the credit union"); await wait(900); // pushed, and the other tab pulled it
    assert.equal(await b.page.$eval("#list .row:first-child .tx", e => e.dataset.text), "call the credit union");
    await commit(b.page, "call the bank at nine"); await wait(1200); // the other device's later edit wins the merge
    assert.equal(await t.page.$eval("#list .row:first-child .tx", e => e.dataset.text), "call the bank at nine", "last writer wins on this device too");
    assert.ok(/Another device changed “call the credit union” after you did/.test(await t.page.textContent("#toast .msg")), "the loss gets a word: " + await t.page.textContent("#toast .msg"));
    assert.ok(!(await t.page.$eval("#toast-undo", e => e.hidden)), "with an Undo");
    await t.page.click("#toast-undo"); await wait(1200);
    assert.equal(await t.page.$eval("#list .row:first-child .tx", e => e.dataset.text), "call the credit union", "the words are back here");
    assert.equal(await b.page.$eval("#list .row:first-child .tx", e => e.dataset.text), "call the credit union", "and they win over there");
    assert.ok(/Another device changed “call the bank at nine” after you did/.test(await b.page.textContent("#toast .msg")), "and the other device, whose own fresh words just lost to the undo, gets the same word");
    assert.equal(t.errors.length + b.errors.length, 0, t.errors.concat(b.errors).join("; ")); await b.close(); await t.close();
  });

  await test(label + ": presence dots between two tabs, capped at five, beside the sync dot, off when the device says so", async () => {
    const a = await fresh(opts);
    const { listId } = await a.s();
    await a.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    const b = await fresh(opts, { url: BASE + "?transport=local#/l/" + listId, list: false, ctx: a.ctx });
    await b.page.waitForSelector("#list .row");
    await a.page.waitForFunction(() => window.__tf().who === 1, null, { timeout: 8000, polling: 200 });
    await b.page.waitForFunction(() => window.__tf().who === 1, null, { timeout: 8000, polling: 200 });
    assert.equal(await a.page.locator("#who .dots i.on").count(), 1);
    assert.ok(/1 other device/.test(await a.page.getAttribute("#who", "title")));
    assert.ok(await a.page.$(".status #who"), "the dots live in the count-and-dot group, exempt from the fade");
    await a.page.evaluate(() => window.__tfTest.presence(7)); await wait(300);
    assert.equal(await a.page.locator("#who .dots i").count(), 5); assert.equal(await a.page.textContent("#who .plus"), "+2");
    await b.close();
    await a.page.waitForFunction(() => window.__tf().who === 0, null, { timeout: 8000, polling: 200 });
    await wait(600); assert.ok(await a.page.locator("#who").isHidden(), "dots fade out");
    // off: neither shows nor broadcasts
    await a.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.whoOff = true; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await a.front(); await a.reload(); await a.page.waitForSelector("#list .row"); await a.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    const c = await fresh(opts, { url: BASE + "?transport=local#/l/" + listId, list: false, ctx: a.ctx });
    await c.page.waitForSelector("#list .row"); await wait(2500);
    assert.equal((await c.s()).who, 0, "the opted-out tab is invisible");
    assert.equal((await a.s()).who, 0); assert.equal((await a.s()).cur.presence, false);
    await c.close(); await a.close();
  });

  await test(label + ": every sound pack plays check, uncheck and finale without console errors; the theme's pick is named and the override wins", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    await t.page.waitForFunction(() => window.__tf().audio.packs === true, null, { timeout: 5000, polling: 200 });
    assert.equal(await t.page.$eval("#set-pack option", o => o.textContent), "Theme's pick (Knock)", "Theme's pick names the theme's pack");
    for (const pack of ["knock", "bell", "blip", "typewriter", "marble", "pop", "kalimba", "pencil", "whistle", "bongo", "cork", "arcade"]) { // 1.5: twelve
      await t.page.selectOption("#set-pack", pack); await wait(150);
      const ok = await t.page.evaluate(() => { const s = window.__tf(); return s.audio.state === "running"; });
      assert.ok(ok, pack + ": context running");
    }
    assert.ok(/Dark picks Knock; this device plays Arcade/.test(await t.page.textContent("#set-pack-sub")), "says which one wins (Dark is on: a dark system, Night = Dark): " + await t.page.textContent("#set-pack-sub"));
    await t.esc(); await wait(200);
    const played = await t.page.evaluate(async () => { const S = await import("./sound.js"); const P = await import("./packs.js"); const snd = S.createSound({ muted: false, volume: 1, kit: () => ({ engine: "knock" }), loadPacks: () => Promise.resolve(P) }); snd.prime(); await new Promise(r => setTimeout(r, 50)); const out = {}; for (const e of P.PACK_ORDER) { out[e] = [snd.preview(e), snd.uncheck(), snd.finish()]; } return { out, st: snd.state() }; });
    for (const e of Object.keys(played.out)) assert.ok(played.out[e][0] && played.out[e][1] && played.out[e][2], e + " scheduled: " + JSON.stringify(played.out[e]));
    assert.equal(played.st.state, "running");
    const themePick = await t.page.evaluate(async () => { const T = await import("./theme.js"); return [T.curated("paper").sound.engine, T.curated("forest").sound.engine, T.curated("harbor").sound.engine]; });
    assert.equal(themePick.join(","), "typewriter,marble,pop");
    assert.equal(t.consoleErrors.length, 0, "console errors: " + t.consoleErrors.join(" | ")); assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the theme builder carries a sound pack — Auto names the hue rule's pick, a saved theme's code is T2:, a T1: code imports", async () => {
    const t = await fresh(opts);
    await t.press("#list .row:first-child .check"); await wait(400); // a gesture, so a preview has a context to play through
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]");
    assert.equal((await t.page.textContent("#p-theme-h")).trim(), "Night theme");
    await t.page.click("#sw-build"); await t.page.waitForSelector("#p-builder[open]"); await wait(150); // 1.9: the builder behind one row
    assert.equal((await t.page.textContent("#p-builder-h")).trim(), "Make your own"); assert.equal((await t.page.textContent("#c-use")).trim(), "Use for Night");
    assert.equal(await t.page.$$eval("#c-pack option", os => os.map(o => o.value).join(",")), ",knock,bell,blip,typewriter,marble,pop,kalimba,pencil,whistle,bongo,cork,arcade"); // 1.5
    await t.page.fill("#c-hex", "#3366FF"); await t.page.dispatchEvent("#c-hex", "input"); await wait(150);
    assert.equal(await t.page.$eval("#c-pack option", o => o.textContent), "Auto · Bell", "blue rings a bell by the hue rule");
    await t.page.selectOption("#c-pack", "marble"); await wait(200);
    await t.page.fill("#c-name", "Marbles"); await t.page.dispatchEvent("#c-name", "input"); await t.page.click("#c-save"); await wait(500);
    const codes = await t.page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.themes).map(x => x.code));
    assert.equal(codes.join(""), "T2:d:3366FF:grotesk:marble:Marbles", "the pack rides in the theme record");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.night), "T2:d:3366FF:grotesk:marble:Marbles", "and in the Night slot"); assert.equal((await t.s()).theme, "custom-3366ff-d-grotesk-marble", "which is on");
    await openBuild(t); await t.page.fill("#c-import", "T1:d:FF3D9A:fraunces:Old pink"); await t.page.click("#c-import-go"); await wait(200);
    assert.equal(await t.page.$eval("#c-pack", s => s.value), "", "a T1 code imports with the hue rule");
    assert.equal(await t.page.inputValue("#c-hex"), "#FF3D9A");
    await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#set-pack option", o => o.textContent), "Theme's pick (Marble)");
    assert.ok(/Marbles picks Marble, and that's what plays/.test(await t.page.textContent("#set-pack-sub")));
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | "));
    await t.close();
  });

  await test(label + ": audio recovers — a suspended context resumes on the next tap, a dead one is replaced", async () => {
    const t = await fresh(opts);
    await t.press("#list .row:first-child .check"); await wait(600);
    await t.page.waitForFunction(() => window.__tf().audio.state === "running", null, { polling: 200 });
    await t.page.evaluate(() => window.__tfTest.suspendAudio()); await wait(200);
    assert.equal((await t.s()).audio.state, "suspended", "suspended like a background");
    await t.press("#list .row:nth-child(2) .check"); await wait(600);
    let st = (await t.s()).audio; assert.equal(st.state, "running", "resumed on the tap"); assert.equal(st.made, 1);
    await t.page.evaluate(() => window.__tfTest.killAudio()); await wait(200);
    assert.equal((await t.s()).audio.state, "closed", "dead like after a call");
    await t.press("#list .row:nth-child(3) .check"); await wait(600);
    st = (await t.s()).audio; assert.equal(st.state, "running", "fresh context running"); assert.equal(st.made, 2, "a second context was made");
    await t.close();
  });

  await test(label + ": the bottom edge is the page background — no hairline under the list", async () => {
    const t = await fresh(opts);
    const png = PNG.sync.read(await t.page.screenshot());
    const ink = await t.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim());
    const hex = (x, y) => { const i = (png.width * y + x) * 4; return "#" + [png.data[i], png.data[i + 1], png.data[i + 2]].map(v => v.toString(16).padStart(2, "0")).join("").toUpperCase(); };
    const x = Math.floor(png.width / 2);
    const bad = [];
    for (let y = png.height - 1; y >= png.height - 12 * (opts.deviceScaleFactor || 1); y--) { const c = hex(x, y); if (c !== ink.toUpperCase()) bad.push(y + ":" + c); }
    assert.equal(bad.length, 0, "rows not --ink (" + ink + "): " + bad.slice(0, 4).join(" "));
    // and with progress the fill sits above the safe-area inset, still inside the page
    await t.press("#list .row:first-child .check"); await wait(900);
    const bar = await t.page.$eval("#bar", b => { const r = b.getBoundingClientRect(); return { bottom: r.bottom, h: r.height, bg: getComputedStyle(b).backgroundColor }; });
    assert.ok(bar.bg === "rgba(0, 0, 0, 0)" || bar.bg === "transparent", "track transparent: " + bar.bg);
    assert.ok(bar.bottom <= opts.viewport.height, "inside the viewport");
    await t.close();
  });

  await test(label + ": export JSON round-trips byte for byte; Markdown reads; import merges (from the Export & import sub-sheet)", async () => {
    const t = await fresh(opts);
    const r = await t.page.evaluate(async () => { const M = await import("./model.js"); const s = window.__tf(); const d = JSON.parse(localStorage.getItem("tf/v3/list/" + s.listId)).doc; const a = M.exportJSON(d, { at: 1 }); const md = M.exportMarkdown(d); return { same: a === M.exportJSON(M.importJSON(a, s.listId), { at: 1 }), md: md.startsWith("# ") && md.includes("- [ ] "), secret: a.includes(s.listId) }; });
    assert.ok(r.same, "byte-identical"); assert.ok(r.md, "markdown"); assert.ok(!r.secret, "no secret in the export");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.ok(/only backup/.test(await t.page.textContent("#p-settings")), "says it is the only backup");
    await t.page.click('[data-set="export"]'); await t.page.waitForSelector("#p-export[open]");
    const [dl] = await Promise.all([t.page.waitForEvent("download", { timeout: 5000 }).catch(() => null), t.page.click("#set-export-json")]);
    if (dl) assert.ok(/\.json$/.test(dl.suggestedFilename()));
    // import a file that adds a line
    const file = { name: "x.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ app: "todays-five", format: 1, doc: { v: 3, items: { imp1: { id: "imp1", sectionId: "", text: "Imported line", note: "", done: false, doneAt: 0, today: true, order: 9000, todayOrder: 9000, updatedAt: 5 } }, sections: {}, history: {}, themes: {}, updatedAt: 5 } })) };
    await t.page.setInputFiles("#set-import-file", file); await wait(400);
    assert.ok(/1 lines/.test(await t.page.textContent("#set-import-name")));
    await t.page.click("#set-import-merge"); await wait(500);
    assert.equal(await t.page.locator("#list .row").count(), 4);
    // 1.7: a merge-import keeps the open list's name
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="export"]'); await t.page.waitForSelector("#p-export[open]");
    const named = { name: "y.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ app: "todays-five", format: 1, doc: { v: 3, name: "Holiday packing", nameAt: 9e12, items: { imp2: { id: "imp2", sectionId: "", text: "Sunscreen", note: "", done: false, doneAt: 0, today: true, order: 2048, todayOrder: 2048, updatedAt: 9e12 } }, sections: {}, themes: {}, rules: {}, returns: {}, templates: {}, history: {}, updatedAt: 9e12 } })) };
    await t.page.setInputFiles("#set-import-file", named); await wait(400); await t.page.click("#set-import-merge"); await wait(600);
    assert.equal(await t.page.locator("#list .row").count(), 5);
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.name), "", "the list keeps its own name");
    assert.ok(/keeps its name/.test(await t.page.textContent("#toast")), "and says so: " + await t.page.textContent("#toast"));
    await t.close();
  });

  await test(label + ": 1.7: unsynced edits on a link that died are carried to its successor on this device without a paste", async () => {
    const t = await fresh(opts);
    const X = (await t.s()).listId;
    // the successor: a copy of X with the same line ids (a rotation elsewhere makes exactly this), held on this device
    const exp = await t.page.evaluate(async () => { const M = await import("./model.js"); const d = JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc; return M.exportJSON(d, { at: 1 }); });
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="export"]'); await t.page.waitForSelector("#p-export[open]");
    await t.page.setInputFiles("#set-import-file", { name: "copy.json", mimeType: "application/json", buffer: Buffer.from(exp) }); await wait(400);
    await t.page.click("#set-import-new"); await t.page.waitForFunction(x => window.__tf().listId && window.__tf().listId !== x, X, { timeout: 9000 }); await wait(800);
    const Y = (await t.s()).listId; await t.page.waitForFunction(() => window.__tf().status === "synced", null, { timeout: 9000 });
    // back on X: its server row dies (New keys on another device), and a line typed here cannot be pushed
    await t.page.goto(BASE + "?transport=local#/l/" + X); await t.page.waitForFunction(x => window.__tf().listId === x && window.__tf().status === "synced", X, { timeout: 9000 }); await wait(300);
    await t.page.evaluate(() => { const s = window.__tf(); localStorage.removeItem("tf/v2/localserver/" + s.lookupId); });
    await t.press("#addtoday"); await t.page.keyboard.type("Typed after the keys changed"); await t.page.keyboard.press("Enter"); await t.page.keyboard.press("Escape"); await wait(300);
    await t.page.waitForFunction(() => window.__tf().status === "gone", null, { timeout: 12000 }); await wait(900);
    assert.ok(/Carried your unsynced edits/.test(await t.page.textContent("#toast")), "the carry toast: " + await t.page.textContent("#toast"));
    const yDoc = await t.page.evaluate(y => JSON.parse(localStorage.getItem("tf/v3/list/" + y)), Y);
    assert.ok(Object.values(yDoc.doc.items).some(i => i.text === "Typed after the keys changed" && !i.deleted), "the line is in the successor's copy (pushed at once, or waiting)");
    await t.page.goto(BASE + "?transport=local#/l/" + Y); await t.page.waitForFunction(y => window.__tf().listId === y && window.__tf().status === "synced", Y, { timeout: 9000 }); await wait(400);
    assert.ok(await t.page.$$eval("#list .row", els => els.some(e => /Typed after the keys changed/.test(e.textContent))), "and on screen in the successor");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": day review shows under the finale when on, dismisses on a tap, never fires a sound", async () => {
    const t = await fresh(opts);
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.review = true; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForSelector("#list .row");
    for (let i = 1; i <= 3; i++) { await t.press("#list .row:not(.done) .check"); await wait(650); }
    await wait(1200);
    assert.ok(await t.page.locator("#review").isVisible(), "review card");
    assert.ok(/streak/i.test(await t.page.textContent("#review")));
    const st = (await t.s()).stats; assert.equal(st.finish, 1, "one finale, nothing extra");
    if (touch) await t.page.touchscreen.tap(200, 300); else await t.page.mouse.click(700, 300);
    await wait(200);
    assert.ok(await t.page.locator("#review").isHidden(), "dismissed");
    await t.close();
  });

  await test(label + ": remove from this device hides the list here only; Lists → Removed restores it", async () => {
    const t = await fresh(opts);
    const { listId, lookupId } = await t.s();
    await t.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]");
    // 1.9: Remove and Rename live in the list's detail only (proposal 5); the shelf keeps New list and the paste field
    assert.equal(await t.page.locator("#l-archive, #l-rename").count(), 0, "no second Rename or Remove at the bottom of Lists");
    assert.equal(await t.page.$$eval("#p-lists .row-actions .chip", els => els.map(e => e.textContent.trim()).join("|")), "New list");
    await t.page.click("#lists-menu .row .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.equal((await t.page.textContent('#list-detail-menu [data-lact="remove"] .lb')).trim(), "Remove from this device");
    await t.page.click('#list-detail-menu [data-lact="remove"]'); await wait(600);
    assert.ok(await t.page.locator("#welcome").isVisible());
    assert.ok(await t.page.evaluate(id => !!localStorage.getItem("tf/v2/localserver/" + id), lookupId), "server row untouched");
    await t.page.evaluate(() => document.getElementById("more").click()); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="lists"]');
    await t.page.waitForSelector("#lists-removed button"); await t.page.click("#lists-removed button"); await wait(600);
    assert.equal((await t.s()).listId, listId);
    await t.close();
  });

  await test(label + ": a 1.0 device (it called itself 4.0.0) opens 1.8 — the toast once, nothing else, nothing about version numbers, list intact, no hints later", async () => {
    const t = await fresh(opts);
    const { listId } = await t.s();
    // turn this device into a 1.0 one: the version it remembers is 4.0.0, it went through the tour, it never heard of hints
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.seenVersion = "4.0.0"; m.device.tourDone = true; delete m.device.hints; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(1800);
    assert.ok(await t.page.locator("#whatsnew").isVisible(), "what's-new toast");
    const msg = await t.page.textContent("#wn-msg");
    assert.ok(new RegExp("New in " + VERSION.replace(".", "\\.")).test(msg), msg); assert.ok(!/4\.0\.0|renumber|1\.1\b|1\.2\b|1\.3\b/.test(msg), "nothing about version numbers: " + msg); assert.ok(/A little something for someone in particular\./.test(msg), "the headline is 1.8's wink: " + msg); assert.equal((await t.page.textContent("#wn-more")).trim(), "What's new");
    assert.equal(await t.page.locator("#tour").count(), 0, "no tour"); assert.equal(await t.page.locator("dialog[open]").count(), 0, "no sheet"); assert.ok(await t.page.locator("#mark").isHidden(), "no hint");
    assert.equal((await t.s()).stats.check + (await t.s()).stats.finish, 0, "no sound");
    assert.equal(await t.page.locator("#list .row").count(), 3); assert.equal((await t.s()).listId, listId);
    await t.page.click("#wn-x"); await t.reload(); await t.page.waitForSelector("#list .row"); await wait(1800);
    assert.ok(await t.page.locator("#whatsnew").isHidden(), "shown once");
    assert.equal((await t.s()).seenVersion, VERSION);
    await t.press("#v-all"); await wait(400); assert.equal((await t.s()).mark, "", "a device that knew the app gets no hints either");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": About shows the version as 1.8 (build N) and the changelog in its shape, no dates", async () => {
    const t = await fresh(opts, { url: BASE + "about.html", list: false });
    await t.page.waitForFunction(() => /build/.test(document.getElementById("version").textContent), null, { timeout: 5000, polling: 100 });
    assert.equal(await t.page.textContent("#version"), "Version " + VERSION_LABEL);
    const log = await t.page.$$eval("#log .v", els => els.map(e => e.textContent));
    assert.equal(log.join(","), "1.8,1.7,1.5,1.4,1.3,1.2,1.1,1.0", "1.0 and later; the pre-releases never render");
    assert.ok(/A little something for someone in particular\./.test(await t.page.textContent("#log > li:first-child div")), "a headline per version"); assert.ok(/Sharper all over\./.test(await t.page.textContent("#log > li:nth-child(2) div")), "and the one before it");
    const tags = await t.page.$$eval("#log .tag", els => els.map(e => e.textContent)); assert.ok(tags.length >= 6 && tags.every(x => ["New", "Improved", "Fixed"].includes(x)), "tagged items: " + tags);
    assert.ok(await t.page.$$eval("#log > li", els => els.every(li => li.querySelectorAll("ul li").length <= 3)), "three items at most");
    assert.equal(await t.page.$eval("#version", e => getComputedStyle(e).textTransform), "uppercase", "the version line is styled on About (its rules live in styles.css now)");
    assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(await t.page.textContent("main")), "no dates");
    assert.equal(await t.page.locator("#log .d").count(), 0);
    assert.equal(t.csp.length, 0, "csp: " + t.csp); assert.equal(t.errors.length, 0);
    await t.close();
  });

  await test(label + ": How it works has the Shortcut and bookmarklet, the new gestures, no tour, and opens the reference", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="help"]'); await t.page.waitForSelector("#p-help[open]");
    const heads = await t.page.$$eval("#help-body h3", els => els.map(e => e.textContent));
    assert.ok(heads.length >= 6, "sections: " + heads.length);
    const body = await t.page.textContent("#help-body");
    assert.ok(/Ask for Input/.test(body) && /bookmarklet/i.test(body) && /Remove from this device/.test(body));
    assert.ok(/Day theme/.test(body) && /Night theme/.test(body) && /partner/.test(body) && /schedule/.test(body), "Day and Night in How it works");
    assert.ok(/no tour/i.test(body), "says the tour is gone"); assert.ok(new RegExp(touch ? "Hold a line" : "Hover a line").test(body), "the new gestures");
    assert.ok(!/Replay the tour/.test(body)); assert.equal(await t.page.locator("#help-tour").count(), 0);
    assert.ok((await t.page.inputValue("#help-body input.link")).includes("/add?text="));
    await t.press("#help-keys"); await t.page.waitForSelector("#p-keys[open]");
    assert.equal((await t.page.textContent("#p-keys-h")).trim(), touch ? "Gestures" : "Keys");
    assert.ok(new RegExp(touch ? "Swipe right" : "⌘ Z").test(await t.page.textContent("#keys-body")));
    await t.esc();
    await t.close();
  });

  /* ---------------- 1.2: Day and Night ---------------- */
  const inkOf = page => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim().toUpperCase());
  const INK = { dark: "#1A1D21", light: "#FAF8F4", midnight: "#0E1424", paper: "#F7F2E8", harbor: "#EEF5F4", forest: "#10201A" };

  await test(label + ": the flip — " + (touch ? "a tap on the sun/moon" : "T, or a click on the sun/moon") + " crossfades the whole palette (~400 ms, tokens interpolated) with the incoming theme's tick; instant under reduced motion", async () => {
    const t = await fresh(opts);
    assert.equal((await t.s()).theme, "dark", "a dark system: Night = Dark is on"); assert.equal(await inkOf(t.page), INK.dark);
    const tick0 = (await t.s()).stats.tick;
    if (touch) await t.page.tap("#daynight"); else await t.page.keyboard.press("t");
    await wait(110);
    const mid = await inkOf(t.page), midState = await t.s();
    assert.ok(midState.fading, "a crossfade is running"); assert.equal(midState.theme, "light", "the theme is already the incoming one (its kit plays)");
    assert.ok(mid !== INK.dark && mid !== INK.light, "the ink is in between mid-flip: " + mid);
    assert.ok(await t.page.$eval("#glow", e => +getComputedStyle(e).opacity < 0.6), "the glow dips through the flip");
    assert.ok(await t.page.evaluate(() => document.body.classList.contains("fading")), "the rows' own colour transitions are off while the tokens move");
    assert.equal(await t.page.$eval("#list .row", e => getComputedStyle(e).color), await t.page.evaluate(() => getComputedStyle(document.body).color), "the row text is at the token, not trailing it");
    await wait(600);
    assert.equal(await inkOf(t.page), INK.light, "Day = Light at the end"); assert.ok(!(await t.s()).fading); assert.ok(!(await t.page.evaluate(() => document.body.classList.contains("fading"))), "transitions are back once it lands");
    assert.equal((await t.s()).stats.tick, tick0 + 1, "the incoming theme's soft tick played");
    assert.equal(await t.page.$eval("#daynight", e => e.dataset.next + "|" + e.title + "|" + e.getAttribute("aria-label")), "night|Night · T|Switch to night", "the glyph now offers Night");
    assert.equal(await t.page.$eval("html", e => e.dataset.base + "/" + e.dataset.theme), "light/light"); assert.equal(await t.page.$eval('meta[name="theme-color"]', e => e.content), INK.light, "theme-color follows the slot's theme");
    assert.equal(await t.page.evaluate(() => localStorage.getItem("tf/v2/themecss").includes("--ink:#FAF8F4")), true, "the boot cache holds the theme that is on");
    // flip back with the control itself, then check the fonts swapped at the midpoint (Light and Dark share Lato; use Paper for Day)
    await t.press("#daynight"); await wait(700); assert.equal(await inkOf(t.page), INK.dark);
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.day = "T1:curated:paper"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
    await t.press("#daynight"); await wait(90);
    assert.ok(/Lato/.test(await t.page.$eval("#list .row", e => getComputedStyle(e).fontFamily)), "before the midpoint: the outgoing fonts");
    await wait(600);
    assert.ok(/Playfair/.test(await t.page.$eval("#list .row", e => getComputedStyle(e).fontFamily)), "after: Paper's"); assert.equal(await inkOf(t.page), INK.paper);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | "));
    await t.close();
    const r = await fresh(opts, { reducedMotion: "reduce" });
    await r.press("#daynight"); await wait(40);
    assert.equal(await inkOf(r.page), INK.light, "reduced motion: instant"); assert.ok(!(await r.s()).fading);
    await r.close();
  });

  await test(label + ": Switch · With the system — the device's setting picks the slot; a manual flip holds until the system next changes, then the automation resumes", async () => {
    const t = await fresh(opts, { scheme: "light" });
    assert.equal((await t.s()).switchMode, "system"); assert.equal((await t.s()).theme, "light", "a light system: Day = Light");
    await t.page.emulateMedia({ colorScheme: "dark" }); await wait(700);
    assert.equal((await t.s()).theme, "dark", "the system went dark: Night"); assert.equal(await inkOf(t.page), INK.dark);
    await t.press("#daynight"); await wait(700);
    let st = await t.s(); assert.equal(st.theme, "light", "flipped to Day by hand"); assert.equal(st.hold, "night", "held against a dark system");
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
    st = await t.s(); assert.equal(st.theme, "light", "the hold survives a reload"); assert.equal(st.hold, "night");
    await t.page.emulateMedia({ colorScheme: "light" }); await wait(700);
    st = await t.s(); assert.equal(st.hold, null, "the system changed its mind: the hold is spent"); assert.equal(st.theme, "light");
    await t.page.emulateMedia({ colorScheme: "dark" }); await wait(700);
    assert.equal((await t.s()).theme, "dark", "and the automation is back in charge");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.ok(/Follows the device/.test(await t.page.textContent("#set-switch-sub")), await t.page.textContent("#set-switch-sub"));
    assert.equal(await t.page.textContent("#set-night-k"), "Dark · on"); assert.equal(await t.page.textContent("#set-day-k"), "Light");
    await t.esc();
    await t.press("#daynight"); await wait(700);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.ok(/Day by hand for now/.test(await t.page.textContent("#set-switch-sub")), "the row says a flip is holding: " + await t.page.textContent("#set-switch-sub"));
    await t.page.selectOption("#set-switch", "hand"); await wait(200);
    st = await t.s(); assert.equal(st.switchMode, "hand"); assert.equal(st.theme, "light", "By hand keeps what is on"); assert.equal(st.hold, null);
    await t.esc(); await t.page.emulateMedia({ colorScheme: "light" }); await wait(500); await t.page.emulateMedia({ colorScheme: "dark" }); await wait(500);
    assert.equal((await t.s()).theme, "light", "by hand, the system is ignored");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": Switch · On a schedule — day from / night from by a mocked clock; the minute tick switches; a manual flip holds until the schedule's next switch", async () => {
    const t = await fresh(opts, { clock: new Date("2026-09-05T15:00:00") });
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    await t.page.selectOption("#set-switch", "schedule"); await wait(200);
    let st = await t.s(); assert.equal(st.switchMode, "schedule"); assert.equal(st.theme, "light", "15:00 is day: Light");
    await t.page.fill("#sch-night-at", "16:30"); await t.page.dispatchEvent("#sch-night-at", "change"); await wait(200);
    assert.ok(/Day from 07:00, night from 16:30/.test(await t.page.textContent("#set-switch-sub")), await t.page.textContent("#set-switch-sub"));
    await t.esc(); await wait(200);
    await t.page.clock.fastForward("01:31:00"); await wait(800); // 16:31: the minute tick applies Night
    st = await t.s(); assert.equal(st.theme, "dark", "16:31 is night: Dark"); assert.equal(await inkOf(t.page), INK.dark);
    await t.press("#daynight"); await wait(700);
    st = await t.s(); assert.equal(st.theme, "light", "flipped to Day by hand"); assert.equal(st.hold, "night", "held against the schedule");
    await t.page.clock.fastForward("02:00:00"); await wait(800); // 18:31: still night by the clock, still held
    assert.equal((await t.s()).theme, "light", "the hold stands while the schedule says night"); assert.equal((await t.s()).hold, "night");
    await t.page.clock.fastForward("13:00:00"); await wait(800); // 07:31 next day: the schedule's own switch to day ends the hold
    st = await t.s(); assert.equal(st.hold, null, "the schedule switched: the hold is spent"); assert.equal(st.theme, "light");
    await t.page.clock.fastForward("09:30:00"); await wait(800); // 17:01: night again, by the schedule
    assert.equal((await t.s()).theme, "dark", "the automation resumed"); assert.equal(await inkOf(t.page), INK.dark);
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the picker fills one slot — Made for day / Made for night / Yours, every theme for either slot, the lean and partner tags, and the one-tap partner", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#p-settings h3", e => e.textContent), "Appearance", "Settings opens at Appearance");
    await t.page.click('[data-set="day"]'); await t.page.waitForSelector("#p-theme[open]");
    assert.equal((await t.page.textContent("#p-theme-h")).trim(), "Day theme");
    const heads = await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent));
    assert.equal(heads.slice(0, 2).join("|"), "Made for day|Made for night"); assert.ok(!heads.includes("Yours"), "no saved themes yet: no Yours group");
    const day = await t.page.$$eval("#sw-day .swatch .nm", els => els.map(e => e.textContent)), night = await t.page.$$eval("#sw-night .swatch .nm", els => els.map(e => e.textContent));
    assert.equal(day.join(","), "Light,Paper,Harbor,Blush,Teletype,Sunset,Cocoa"); assert.equal(night.join(","), "Dark,Midnight,Forest,Pink,Terminal,Dusk,Ember");
    assert.equal(await t.page.$eval('#sw-day .swatch[data-code="T1:curated:light"] .sm', e => e.textContent), "Day · pairs with Dark", "a lean and a partner on every curated kit");
    assert.equal(await t.page.$eval('#sw-night .swatch[data-code="T1:curated:ember"] .sm', e => e.textContent), "Night · pairs with Cocoa");
    assert.equal(await t.page.$eval('#sw-day .swatch[data-code="T1:curated:light"]', e => e.getAttribute("aria-pressed")), "true", "the slot's theme is marked");
    assert.ok(await t.page.locator("#partner-offer").isHidden(), "no offer before a choice");
    // a night kit for the Day slot (any theme, either slot); its partner is offered for Night
    await t.press('#sw-night .swatch[data-code="T1:curated:midnight"]'); await wait(300);
    let st = await t.s(); assert.equal(st.day, "T1:curated:midnight"); assert.equal(st.theme, "dark", "Night is on: nothing changes on screen yet");
    assert.ok(await t.page.locator("#partner-offer").isVisible()); assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Paper for Night");
    assert.equal(await t.page.$eval("#partner-offer", e => e.previousElementSibling.id), "sw-night", "the chip sits under the group the choice came from");
    assert.equal(await t.page.$eval('#sw-night .swatch[data-code="T1:curated:midnight"]', e => e.getAttribute("aria-pressed")), "true");
    await t.press("#partner-use"); await wait(500);
    st = await t.s(); assert.equal(st.night, "T1:curated:paper"); assert.equal(st.theme, "paper", "Night is on, so Paper shows at once"); assert.equal(await inkOf(t.page), INK.paper);
    assert.ok(await t.page.locator("#partner-offer").isHidden(), "the offer is spent");
    // a choice whose partner the other slot already holds offers nothing
    await t.press('#sw-day .swatch[data-code="T1:curated:harbor"]'); await wait(300);
    assert.ok(await t.page.locator("#partner-offer").isVisible()); assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Forest for Night");
    await t.press("#partner-use"); await wait(300);
    await t.press('#sw-day .swatch[data-code="T1:curated:harbor"]'); await wait(300); assert.ok(await t.page.locator("#partner-offer").isHidden(), "Forest is already in Night: nothing to offer");
    await t.esc(); await wait(300);
    assert.equal(await inkOf(t.page), INK.forest, "closing the picker leaves the slot's theme on");
    await t.press("#daynight"); await wait(700); assert.equal(await inkOf(t.page), INK.harbor, "Day = Harbor");
    // the sound and the confetti follow the slot's theme like the active theme before
    const kit = await t.page.evaluate(async () => { const T = await import("./theme.js"); const s = window.__tf(); return { engine: T.curated(s.theme).sound.engine, confetti: T.curated(s.theme).confetti[0] }; });
    assert.equal(kit.engine, "pop", "Harbor pops");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#set-pack option", o => o.textContent), "Theme's pick (Pop)", "Settings → Sound names the slot's theme's pack");
    assert.equal(await t.page.textContent("#set-day-k"), "Harbor · on"); assert.equal(await t.page.textContent("#set-night-k"), "Forest");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the builder — Use for the slot, Save to this list puts a theme under Yours, Make its partner saves a linked second theme and offers it", async () => {
    const t = await fresh(opts);
    await t.press("#list .row:first-child .check"); await wait(400);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]");
    await t.page.click("#sw-build"); await t.page.waitForSelector("#p-builder[open]"); await wait(150); // 1.9
    await t.page.fill("#c-hex", "#3366FF"); await t.page.dispatchEvent("#c-hex", "input"); await wait(150);
    await t.page.selectOption("#c-pair", "grotesk"); await t.page.selectOption("#c-pack", "marble"); await wait(150);
    await t.page.fill("#c-name", "Blue"); await t.page.dispatchEvent("#c-name", "input");
    await t.press("#c-partner"); await wait(700);
    const themes = await t.page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.themes).filter(x => !x.deleted));
    assert.equal(themes.length, 2, "two saved themes: " + JSON.stringify(themes));
    const blue = themes.find(x => x.name === "Blue"), day = themes.find(x => x.name === "Blue · day");
    assert.ok(blue && day, "named Blue and Blue · day");
    assert.equal(blue.code, "T2:d:3366FF:grotesk:marble:Blue"); assert.equal(day.code, "T2:l:3366FF:grotesk:marble:Blue · day", "same accent, same pack, the chosen pair kept, flipped base");
    assert.equal(blue.partner, day.id); assert.equal(day.partner, blue.id, "linked both ways through the partner field");
    let st = await t.s(); assert.equal(st.night, blue.code, "the theme you made fills the slot you were filling"); assert.equal(st.theme, "custom-3366ff-d-grotesk-marble");
    await t.page.click("#p-builder h2 .back"); await t.page.waitForSelector("#p-theme[open]"); await wait(300); // 1.9: the offer sits in the picker, under Yours
    assert.ok(await t.page.locator("#partner-offer").isVisible()); assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Blue · day for Day");
    const yours = await t.page.$$eval("#sw-yours .swatch .sm", els => els.map(e => e.textContent)); assert.equal(yours.join("|"), "Yours · pairs with Blue · day|Yours · pairs with Blue");
    await t.press("#partner-use"); await wait(400);
    st = await t.s(); assert.equal(st.day, day.code);
    // the partner made from the partner is the original palette again
    const round = await t.page.evaluate(async c => { const T = await import("./theme.js"); const p = T.parseCode(c); const back = T.makePartner({ ...p, pairChosen: true }); return T.cssText(back) === T.cssText(T.parseCode("T2:d:3366FF:grotesk:marble:Blue")); }, day.code);
    assert.ok(round, "round trip");
    // Make its partner again on the same theme finds the existing link instead of saving a third theme
    await openBuild(t); await t.press("#c-partner"); await wait(500);
    assert.equal(await t.page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.themes).filter(x => !x.deleted).length), 2);
    await t.esc(); await wait(200);
    // a saved theme chosen from Yours offers its partner like a curated one
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.click('[data-set="day"]'); await t.page.waitForSelector("#p-theme[open]");
    await t.press('#sw-yours .swatch[data-code="T2:d:3366FF:grotesk:marble:Blue"]'); await wait(300);
    assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Blue · day for Night");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | "));
    await t.close();
  });

  /* ---------------- 1.6: the Secret pair ---------------- */
  const openPicker = async (t, slot = "night") => { await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click(`[data-set="${slot}"]`); await t.page.waitForSelector("#p-theme[open]"); };
  const KEY = "SuperPink"; // what the picker's Import a code takes as a key rather than a code

  await test(label + ": the Secret group shows up only after the key, and Forget puts it away and the slots back", async () => {
    const t = await fresh(opts);
    await openPicker(t);
    assert.deepEqual(await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent)), ["Made for day", "Made for night"], "three groups before the key");
    assert.ok(await t.page.locator("#sw-secret").isHidden() && await t.page.locator("#sw-secret-actions").isHidden(), "no group, no way to forget it");
    assert.equal((await t.s()).secret, false);
    // an ordinary bad code still behaves like one
    await openBuild(t);
    await openBuild(t); await t.page.fill("#c-import", "not-a-code"); await t.press("#c-import-go"); await wait(250);
    assert.equal(await t.page.textContent("#toast .msg"), "That code doesn't parse");
    // the key: trimmed, any case
    await openBuild(t); await t.page.fill("#c-import", "  " + KEY.toUpperCase() + "  "); await t.press("#c-import-go"); await wait(700);
    assert.equal((await t.s()).secret, true, "unlocked"); assert.equal(await t.page.inputValue("#c-import"), "", "the field is cleared");
    assert.equal(await t.page.textContent("#toast .msg"), "Found it—two themes, under Secret.");
    assert.deepEqual(await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent)), ["Made for day", "Made for night", "Secret"], "the group sits with the others");
    assert.deepEqual(await t.page.$$eval("#sw-secret .swatch .nm", els => els.map(e => e.textContent)), ["Superpink", "Birthday"]);
    assert.deepEqual(await t.page.$$eval("#sw-secret .swatch .sm", els => els.map(e => e.textContent)), ["Night · pairs with Birthday", "Day · pairs with Superpink"], "tagged as partners of each other");
    // 1.7 made the picker a sheet on touch; the group is inside it, above Yours and below the two open groups
    if (touch) assert.ok(await t.page.$eval("#p-theme", d => d.classList.contains("sheet") && !!d.querySelector(".grip") && d.querySelector("#sw-secret") !== null), "the sheet holds the group");
    assert.ok(await t.page.evaluate(() => { const b = document.querySelector("#sw-secret .swatch"); return b.parentElement.id === "sw-secret" && b.tagName === "BUTTON"; }), "its swatches are the bare buttons, not the wrapper a saved theme's × needs");
    assert.ok((await t.s()).stats.burst > 0, "a sparkle went up");
    // it persists, and Settings → Sound gains the pair's own two
    await t.esc(); await t.reload(); await t.page.waitForSelector("#list .row"); await wait(600);
    assert.equal((await t.s()).secret, true, "the key persists in the device's settings");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.deepEqual((await t.page.$$eval("#set-pack option", els => els.map(e => e.textContent))).slice(-2), ["Sparkle", "Party"], "Settings → Sound offers them once unlocked");
    await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]");
    await t.press('#sw-secret .swatch[data-code="T1:curated:superpink"]'); await wait(500);
    await t.press("#partner-use"); await wait(400);
    let st = await t.s(); assert.equal(st.night, "T1:curated:superpink"); assert.equal(st.day, "T1:curated:birthday");
    // Forget: the group goes, and any slot holding one of them goes back to its default
    await t.press("#sw-forget"); await wait(900);
    st = await t.s();
    assert.equal(st.secret, false, "forgotten"); assert.equal(st.day, "T1:curated:light"); assert.equal(st.night, "T1:curated:dark");
    assert.equal(st.field, false, "the field went with it");
    assert.ok(await t.page.locator("#sw-secret").isHidden(), "and the group");
    assert.equal(await t.page.textContent("#toast .msg"), "Forgotten on this device. The word still works.");
    assert.equal(await inkOf(t.page), INK.dark, "Night is Dark again");
    assert.equal(await t.page.textContent("#finale span"), "That's the list.", "and the finale line is the ordinary one");
    // and the word brings it back
    await openBuild(t); await t.page.fill("#c-import", KEY.toLowerCase()); await t.press("#c-import-go"); await wait(500);
    assert.equal((await t.s()).secret, true);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; "));
    await t.close();
  });

  await test(label + ": both Secret themes in both slots, the flip between them, their own fonts, and a finale each", async () => {
    const t = await fresh(opts);
    await openPicker(t, "night");
    await openBuild(t); await t.page.fill("#c-import", KEY); await t.press("#c-import-go"); await wait(600);
    await t.press('#sw-secret .swatch[data-code="T1:curated:superpink"]'); await wait(400);
    assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Birthday for Day", "each names the other");
    await t.press("#partner-use"); await wait(400);
    await t.esc(); await wait(700);
    let st = await t.s(); assert.equal(st.theme, "superpink"); assert.equal(st.field, true, "Superpink brings its field");
    const face = () => t.page.evaluate(() => getComputedStyle(document.querySelector("#list .row .tx")).fontFamily);
    assert.ok(/Fredoka/.test(await face()), "Superpink is set in Fredoka");
    assert.equal(await t.page.$eval('meta[name="theme-color"]', e => e.content.toUpperCase()), "#3F0026", "the theme-color meta follows it like any kit");
    // the flip
    await t.press("#daynight"); await wait(900);
    st = await t.s(); assert.equal(st.theme, "birthday"); assert.equal(st.field, false, "the field goes with Superpink");
    assert.ok(/Baloo/.test(await face()), "Birthday is set in Baloo 2");
    // Birthday's finale: its own line, and the cake on the confetti canvas
    for (const box of await t.page.$$("#list .row:not(.done) .check")) { await box.click(); await wait(320); }
    await wait(1500);
    assert.equal(await t.page.textContent("#finale span"), "Make a wish. The list can wait.");
    st = await t.s(); assert.ok(st.stats.finish >= 1 && st.stats.volley >= 1, "the finale fired: " + JSON.stringify(st.stats));
    assert.equal(await t.page.$eval("#finale span", e => getComputedStyle(e).fontStyle), "normal");
    // and now the other one, in the other slot
    for (const box of await t.page.$$("#list .row.done .check")) { await box.click(); await wait(240); }
    await t.press("#daynight"); await wait(900);
    assert.equal((await t.s()).theme, "superpink");
    const before = (await t.s()).stats.volley;
    for (const box of await t.page.$$("#list .row:not(.done) .check")) { await box.click(); await wait(320); }
    await wait(1500);
    assert.equal(await t.page.textContent("#finale span"), "Everything crossed off but you.");
    assert.equal(await t.page.$eval("#finale span", e => getComputedStyle(e).fontStyle), "italic", "Superpink's finale is set in italic, as Pink's is");
    assert.ok((await t.s()).stats.volley > before, "its own bloom went up");
    // either one goes in either slot: Birthday for Night too
    await openPicker(t, "night");
    await t.press('#sw-secret .swatch[data-code="T1:curated:birthday"]'); await wait(500);
    await t.esc(); await wait(700);
    assert.equal((await t.s()).night, "T1:curated:birthday", "a light theme in the Night slot, like any other");
    assert.equal(await inkOf(t.page), "#FFF3F8");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; ")); assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty);
    await t.close();
  });

  await test(label + ": the sparkle field is behind the words, costs no frames at rest, pauses with the tab and stands still under reduced motion", async () => {
    const t = await fresh(opts, { init: "window.__raf = 0; (function(){ var r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = function (cb) { window.__raf++; return r(cb); }; })();" });
    await openPicker(t); await openBuild(t);
    await openBuild(t); await t.page.fill("#c-import", KEY); await t.press("#c-import-go"); await wait(600);
    await t.press('#sw-secret .swatch[data-code="T1:curated:superpink"]'); await wait(400);
    await t.esc(); await wait(900);
    assert.equal(await t.page.$$eval("#field i", els => els.length), 26, "twenty-six twinkles, two elements each");
    const z = await t.page.evaluate(() => ({ field: +getComputedStyle(document.getElementById("field")).zIndex, glow: +getComputedStyle(document.getElementById("glow")).zIndex, shell: +getComputedStyle(document.getElementById("shell")).zIndex, ev: getComputedStyle(document.getElementById("field")).pointerEvents }));
    assert.ok(z.field > z.glow && z.field < z.shell && z.ev === "none", "above the glow, behind the words, and not in the way: " + JSON.stringify(z));
    // only the compositor's properties are animated, and every animated value is a literal — a keyframe that reads a
    // custom property is resolved on the main thread every frame, which is what the frame count below would catch
    const props = await t.page.evaluate(() => { const i = document.querySelector("#field i"), b = i.firstElementChild; return [getComputedStyle(i).animationName, getComputedStyle(b).animationName]; });
    assert.ok(/^tf-d\d$/.test(props[0]) && props[1] === "tf-twinkle", "the two are running: " + props);
    const drifts = await t.page.$$eval("#field i", els => Array.from(new Set(els.map(e => getComputedStyle(e).animationName))).sort());
    assert.ok(drifts.length >= 4 && drifts.every(n => /^tf-d\d$/.test(n)), "no two twinkles move alike: " + drifts);
    const css = await t.page.evaluate(async () => ({ field: await (await fetch("secretfx.css")).text(), shell: await (await fetch("styles.css")).text() }));
    const frames = [...css.field.matchAll(/@keyframes (tf-[a-z0-9]+)\{([^}]*\}[^}]*)\}/g)].filter(m => /var\(/.test(m[2])).map(m => m[1]);
    assert.deepEqual(frames, [], "a keyframe that reads a custom property cannot be composited: " + frames);
    assert.ok(!/#field\s*[{,]|#field\s+i/.test(css.shell), "and no rule for it is in the render-blocking stylesheet every device waits for");
    assert.ok(await t.page.evaluate(() => !!document.querySelector('link[data-secretfx][href^="secretfx.css?v="]')), "the field's stylesheet came with the module, by build");
    // wait for the confetti of the unlock and the theme's crossfade to finish first — on a loaded machine their
    // frames are throttled, so they take longer in wall-clock than they do in frames
    let settled = 0;
    for (let i = 0; i < 40 && settled < 2; i++) {
      const a0 = await t.page.evaluate(() => window.__raf); await wait(500);
      settled = (await t.page.evaluate(() => window.__raf)) - a0 === 0 ? settled + 1 : 0;
    }
    assert.ok(settled >= 2, "the page went quiet within twenty seconds");
    const raf0 = await t.page.evaluate(() => window.__raf);
    await wait(3000);
    const raf1 = await t.page.evaluate(() => window.__raf);
    assert.equal(raf1 - raf0, 0, "no frame loop while the field is up: " + (raf1 - raf0) + " requestAnimationFrame calls in three seconds");
    // a strike that moves costs a style recalc and a repaint every frame, so it runs on struck rows only: an
    // overlay at scaleX(0) is invisible and cost exactly the same (Pink, Blush and Sunset get this too)
    const idleAnim = await t.page.$$eval("#list .row .ink", els => els.map(e => getComputedStyle(e).animationName));
    assert.deepEqual(idleAnim, idleAnim.map(() => "none"), "nothing shimmers while nothing is struck: " + idleAnim);
    await t.press("#list .row:first-child .check"); await wait(700);
    assert.equal(await t.page.$eval("#list .row.done .ink", e => getComputedStyle(e).animationName), "shimmer", "the row that is struck shimmers");
    await t.press("#list .row:first-child .check"); await wait(600);
    // a hidden tab stops it
    await t.page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
    await wait(200);
    assert.equal(await t.page.$eval("#field i", e => getComputedStyle(e).animationPlayState), "paused", "paused with the tab");
    await t.page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
    await wait(200);
    assert.equal(await t.page.$eval("#field i", e => getComputedStyle(e).animationPlayState), "running", "and back");
    await t.close();
    // reduced motion: the twinkles are there and still, and the finale throws nothing
    const r = await fresh(opts, { reducedMotion: "reduce" });
    await openPicker(r); await openBuild(r);
    await openBuild(r); await r.page.fill("#c-import", KEY); await r.press("#c-import-go"); await wait(600);
    await r.press('#sw-secret .swatch[data-code="T1:curated:superpink"]'); await wait(400);
    await r.esc(); await wait(700);
    assert.equal(await r.page.$$eval("#field i", els => els.length), 26, "the field is there");
    assert.equal(await r.page.$eval("#field i", e => getComputedStyle(e).animationName), "none", "and standing still");
    assert.equal(await r.page.$eval("#field i > b", e => getComputedStyle(e).animationName), "none");
    for (const box of await r.page.$$("#list .row:not(.done) .check")) { await box.click(); await wait(300); }
    await wait(1400);
    assert.equal(await r.page.textContent("#finale span"), "Everything crossed off but you.", "the line still lands");
    const painted = await r.page.evaluate(() => { const c = document.getElementById("fx"); const g = c.getContext("2d"); const d = g.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4000) if (d[i] > 0) return true; return false; });
    assert.equal(painted, false, "no bloom under reduced motion, like every other effect");
    assert.equal(r.errors.length, 0, r.errors.join("; "));
    await r.close();
  });

  await test(label + ": a device that never gives the key asks for nothing of the Secret pair and is never told about it", async () => {
    const t = await fresh(opts);
    // a whole session: the picker, Settings, How it works
    await openPicker(t); await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal((await t.page.$$eval("#set-pack option", els => els.map(e => e.textContent))).length, 13, "Theme's pick and the twelve");
    await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="help"]'); await t.page.waitForSelector("#p-help[open]"); await wait(300);
    const help = await t.page.textContent("#p-help");
    assert.ok(!/Superpink|Birthday|Secret/i.test(help), "How it works says nothing about it");
    assert.ok(/twelve sound packs/.test(help), "and still counts twelve packs");
    await t.esc(); await wait(300);
    const asked = await t.page.evaluate(() => performance.getEntriesByType("resource").map(r => r.name).filter(n => /secretfx|packs-secret|fredoka|baloo/.test(n)));  // the two modules, the field's stylesheet and the two faces
    assert.deepEqual(asked, [], "nothing of the pair is fetched: " + asked);
    assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty);
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
    // and the About page's changelog carries the wink and nothing else
    const a = await fresh(opts, { url: BASE + "about.html", list: false });
    await a.page.waitForFunction(() => /build/.test(document.getElementById("version").textContent), null, { timeout: 5000, polling: 100 });
    const log = await a.page.$$eval("#log .v", els => els.map(e => e.textContent));
    assert.equal(log.join(","), "1.8,1.7,1.5,1.4,1.3,1.2,1.1,1.0");
    assert.ok(/A little something for someone in particular\.$/.test((await a.page.textContent("#log > li:first-child div")).trim()), "the headline is the wink");
    const first = await a.page.$$eval("#log > li:first-child ul li", els => els.map(e => e.textContent.replace(/^(New|Improved|Fixed)/, "").trim()));
    assert.deepEqual(first, ["If you know, you know."], "one line and a wink");
    const body = await a.page.textContent("body");
    assert.ok(!/Superpink|Birthday/i.test(body) && !/secret (theme|group|pair)|forget the secret/i.test(body), "and nothing else about it on About (the crypto page's own \"secret\" is the one in a link)");
    await a.close();
  });

  if (!touch) await test(label + ": T flips, Shift+T opens Appearance; ⋯ → Theme opens the picker for the slot that is on (1.9)", async () => {
    const t = await fresh(opts);
    const s0 = (await t.s()).slot;
    await t.page.keyboard.press("t"); await wait(600); assert.notEqual((await t.s()).slot, s0, "T flips");
    await t.page.keyboard.press("Shift+T"); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#p-settings h3", e => e.textContent), "Appearance"); assert.equal((await t.s()).slot, s0 === "day" ? "night" : "day", "Shift+T does not flip");
    await t.page.$eval("#p-settings .body", e => { e.scrollTop = e.scrollHeight; }); await t.esc(); await wait(200); // leave Settings scrolled to the bottom
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(150);
    assert.equal(await t.page.$eval("#p-settings .body", e => e.scrollTop), 0, "Settings opens at its top, wherever it was left");
    assert.equal(await t.page.textContent("#menu-theme-k"), "Light", "the ⋯ row names the theme that is on");
    await t.esc(); await wait(200);
    // 1.9 (proposal 19): the row that names the theme opens the picker for the slot that is on; Appearance keeps both slots
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(150);
    assert.equal(await t.page.locator("#p-settings[open]").count(), 0, "straight to the picker"); assert.equal((await t.page.textContent("#p-theme-h")).trim(), "Day theme", "for the slot that is on");
    assert.equal(await t.page.$eval('#p-theme .swatch[aria-pressed="true"] .nm', e => e.textContent), "Light", "with the theme that is on marked");
    await t.esc();
    await t.close();
  });

  await test(label + ": a 1.1 device opens 1.8 — Follow system and the schedule migrate into the switch, the theme on screen does not change, and the toast is the only new thing", async () => {
    // Follow system on, with both slots filled
    const t = await fresh(opts);
    const { listId } = await t.s();
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); const d = m.device; delete d.day; delete d.night; delete d.switch; delete d.slot; delete d.holdAuto; d.seenVersion = "1.1"; d.tourDone = true; d.hints = { today: true, drag: true, menu: true }; d.follow = true; d.darkSlot = "T1:curated:midnight"; d.lightSlot = "T1:curated:harbor"; d.theme = "T1:curated:midnight"; d.schedule = { on: false, dayAt: "07:00", nightAt: "19:00", day: "T1:curated:light", night: "T1:curated:dark" }; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); localStorage.setItem("tf/v2/themecss", "x"); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(1800);
    let st = await t.s();
    assert.equal(st.theme, "midnight", "a dark system: Midnight, as Follow system showed"); assert.equal(st.switchMode, "system"); assert.equal(st.day, "T1:curated:harbor"); assert.equal(st.night, "T1:curated:midnight"); assert.equal(st.hold, null);
    assert.ok(await t.page.locator("#whatsnew").isVisible(), "the toast"); assert.ok(/New in 1\.8: A little something for someone in particular\./.test(await t.page.textContent("#wn-msg")), "the headline only: " + await t.page.textContent("#wn-msg"));
    assert.equal(await t.page.locator("dialog[open]").count(), 0, "no sheet"); assert.ok(await t.page.locator("#mark").isHidden(), "no hint"); assert.equal(st.stats.check + st.stats.finish + st.stats.tick, 0, "no sound");
    assert.equal(await t.page.locator("#list .row").count(), 3); assert.equal(st.listId, listId, "the list is intact");
    assert.ok(await t.page.locator("#daynight").isVisible(), "the sun/moon is there");
    const old = await t.page.evaluate(() => { const d = JSON.parse(localStorage.getItem("tf/v2/meta")).device; return { follow: d.follow, darkSlot: d.darkSlot, lightSlot: d.lightSlot, scheduleOn: d.schedule.on }; });
    assert.deepEqual(old, { follow: true, darkSlot: "T1:curated:midnight", lightSlot: "T1:curated:harbor", scheduleOn: false }, "the 1.1 keys are left in place, never wiped");
    await t.page.emulateMedia({ colorScheme: "light" }); await wait(700); assert.equal((await t.s()).theme, "harbor", "and the system still drives it");
    // the schedule on, with its themes and times
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); const d = m.device; delete d.day; delete d.night; delete d.switch; delete d.slot; delete d.holdAuto; d.follow = false; d.schedule = { on: true, dayAt: "08:15", nightAt: "17:45", day: "T1:curated:paper", night: "T1:curated:forest" }; d.theme = "T1:curated:paper"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(400);
    st = await t.s(); assert.equal(st.switchMode, "schedule"); assert.equal(st.day, "T1:curated:paper"); assert.equal(st.night, "T1:curated:forest");
    const hour = new Date().getHours() + new Date().getMinutes() / 60; const expect = hour >= 8.25 && hour < 17.75 ? "paper" : "forest";
    assert.equal(st.theme, expect, "the clock decides as before");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#set-switch", e => e.value), "schedule"); assert.equal(await t.page.$eval("#sch-day-at", e => e.value) + "/" + await t.page.$eval("#sch-night-at", e => e.value), "08:15/17:45", "the times carried over");
    await t.esc();
    // neither on: by hand, the theme in the slot matching its base, its partner in the other
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); const d = m.device; delete d.day; delete d.night; delete d.switch; delete d.slot; delete d.holdAuto; d.follow = false; d.schedule.on = false; d.theme = "T1:curated:pink"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(400);
    st = await t.s(); assert.equal(st.switchMode, "hand"); assert.equal(st.theme, "pink"); assert.equal(st.night, "T1:curated:pink"); assert.equal(st.day, "T1:curated:blush", "Pink's partner fills Day"); assert.equal(st.slot, "night");
    assert.ok(await t.page.locator("#whatsnew").isHidden(), "the toast showed once");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": a fresh device on a light system paints Light from the first frame and starts With the system", async () => {
    const t = await fresh(opts, { scheme: "light", list: false });
    assert.equal(await inkOf(t.page), INK.light, "the inline tokens follow prefers-color-scheme before any module ran");
    await t.page.click("#w-skip"); await t.page.waitForSelector("#p-save[open]"); await t.page.click("#save-done"); await wait(500);
    const st = await t.s(); assert.equal(st.theme, "light"); assert.equal(st.switchMode, "system"); assert.equal(st.day, "T1:curated:light"); assert.equal(st.night, "T1:curated:dark");
    assert.equal(await t.page.$eval("#daynight", e => e.dataset.next), "night");
    await t.close();
  });

  /* ---------------- 1.3: the first minute, the link names, shuffle ---------------- */
  const STUBS = `window.__shared = []; window.__clip = null; navigator.share = async d => { window.__shared.push(d); }; navigator.clipboard.writeText = async t => { window.__clip = t; };`;
  const IPHONE = `Object.defineProperty(navigator, "platform", { get: () => "iPhone" });`;
  const STANDALONE = IPHONE + ` Object.defineProperty(navigator, "standalone", { get: () => true });`;
  const storedLists = page => page.evaluate(() => Object.keys(localStorage).filter(k => /^tf\/v3\/list\/|^tf\/v2\/localserver\//.test(k)));
  /** a fresh device on the welcome (no list made), with the share and clipboard stubs in place */
  const welcome = async (extra = "") => { const t = await fresh(opts, { list: false, init: STUBS + extra }); await t.page.waitForSelector("#welcome:not([hidden])"); await t.page.waitForSelector("#list .row"); await wait(300); return t; };

  await test(label + ": the welcome is a live list — the title and one sentence, three lines that strike, knock and throw confetti before any list exists, nothing stored, no rail, footer, hint or toast", async () => {
    const t = await welcome();
    const parts = await t.page.$$eval("#welcome > *", els => els.map(e => e.tagName.toLowerCase())); assert.equal(parts.join(","), "h1,p", "the title and one sentence above the list");
    assert.equal(await t.page.$eval("#welcome-msg", e => e.textContent.split(/[.!?](\s|$)/).filter(s => s.trim()).length), 1, "one sentence");
    assert.ok(!/encrypt/i.test(await t.page.textContent("#welcome")) && !/encrypt/i.test(await t.page.textContent("#demo-foot")), "the word encrypted stays off the welcome");
    assert.equal(await t.page.locator("#list .row").count(), 3); assert.equal(JSON.stringify(await t.page.$$eval("#list .row .tx", els => els.map(e => e.dataset.text))), JSON.stringify(seedLines));
    assert.equal(await t.page.$eval(".rail", e => getComputedStyle(e).display), "none", "no rail"); assert.equal(await t.page.$eval("#foot", e => getComputedStyle(e).display), "none", "no footer");
    const st0 = await t.s(); assert.ok(st0.demo, "a local document"); assert.equal(st0.listId, null, "no id, no secret"); assert.equal(st0.status, "off", "no sync");
    assert.equal((await storedLists(t.page)).length, 0, "nothing stored, nothing on the server");
    assert.ok(await t.page.$eval("#w-keep", e => e.hidden), "Keep waits for the person to make it theirs");
    const fits = await t.page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight, foot: document.getElementById("demo-foot").getBoundingClientRect().bottom }));
    assert.ok(fits.h <= fits.vh + 1 && fits.foot <= fits.vh, "everything on screen without scrolling: " + JSON.stringify(fits));
    await t.press("#list .row:first-child .check"); await wait(700);
    const st = await t.s(); assert.equal(st.stats.check, 1, "the knock"); assert.equal(st.stats.burst, 1, "the confetti"); assert.equal(await t.page.locator("#list .row.done").count(), 1, "the strike");
    assert.equal((await storedLists(t.page)).length, 0, "still nothing stored"); assert.ok(await t.page.$eval("#w-keep", e => e.hidden), "one tap is not yet a list of yours");
    await t.press("#list .row:not(.done) .check"); await wait(600); await t.press("#list .row:not(.done) .check"); await wait(1400);
    assert.equal((await t.s()).stats.finish, 1, "the finale on all three"); assert.ok(!(await t.page.$eval("#w-keep", e => e.hidden)), "all three crossed off: Keep this list is offered");
    assert.ok(await t.page.locator("#mark").isHidden(), "no hint"); assert.ok(await t.page.locator("#whatsnew").isHidden(), "no toast"); assert.equal(await t.page.locator("dialog[open]").count(), 0, "no sheet");
    assert.equal(await t.page.locator("#install:not([hidden])").count(), 0, "no install hint on the welcome");
    if (!touch) { await t.page.keyboard.press("a"); await wait(200); assert.ok(await t.page.$eval("#all", e => e.hidden), "Everything is not a place the welcome goes"); await t.page.keyboard.press("o"); await wait(200); assert.ok(!(await t.page.evaluate(() => document.body.classList.contains("one"))), "nor one-thing mode"); }
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0); assert.equal(t.thirdParty.length, 0);
    await t.close();
  });

  await test(label + ": a line of your own offers Keep; Keep carries the lines and the check marks into a real list, and the save sheet follows", async () => {
    const t = await welcome();
    await t.press("#list .row:first-child .check"); await wait(500);
    await t.press("#addtoday"); await t.page.waitForSelector("#list .row.editing"); await t.page.keyboard.type("Buy milk"); await t.page.keyboard.press("Enter"); await wait(150); await t.esc(); await wait(400);
    assert.equal(await t.page.locator("#list .row").count(), 4); assert.ok(!(await t.page.$eval("#w-keep", e => e.hidden)), "a line of your own: Keep this list is offered");
    assert.equal((await storedLists(t.page)).length, 0, "nothing on the server until Keep");
    await t.press("#w-keep"); await t.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await wait(400);
    const st = await t.s(); assert.ok(!st.demo && st.listId, "a real list"); assert.equal(st.mode, "edit");
    const texts = await t.page.$$eval("#list .row .tx", els => els.map(e => e.dataset.text)); assert.ok(texts.includes("Buy milk") && texts.includes(seedLines[0]), "the lines came along: " + texts);
    assert.equal(await t.page.locator("#list .row.done").count(), 1, "and the check mark");
    await t.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    assert.ok((await storedLists(t.page)).some(k => k.startsWith("tf/v2/localserver/")), "now it is on the server");
    assert.ok(/only key/.test(await t.page.textContent("#save-msg")) && /no spare/.test(await t.page.textContent("#save-msg")), "the save sheet says the one thing");
    assert.ok(!/encrypt/i.test(await t.page.textContent("#p-save")), "the word encrypted stays off the save sheet");
    assert.equal((await t.s()).seenVersion, VERSION, "first run marks the version seen silently"); assert.equal(await t.page.locator("#tour").count(), 0);
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": 1.9: Skip on an untouched welcome starts an empty list; once a line of your own is on it, Skip keeps the lines; Paste opens the form, refuses junk, and opens a real link", async () => {
    // a line of your own: Skip's label flips to keeping the lines, and it does (the audit's proposal 1)
    const k = await welcome();
    assert.equal(await k.page.textContent("#w-skip"), "Skip — start with an empty list", "Skip says what it does before the welcome is touched");
    await k.press("#addtoday"); await k.page.keyboard.type("Mine"); await k.page.keyboard.press("Enter"); await wait(200); await k.page.keyboard.press("Escape"); await wait(200);
    assert.ok(!(await k.page.$eval("#w-keep", e => e.hidden)), "Keep is offered"); assert.equal(await k.page.textContent("#w-skip"), "Skip — keep these lines", "and Skip now keeps");
    await k.press("#w-skip"); await k.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await k.page.click("#save-done"); await wait(400);
    assert.equal(await k.page.locator("#list .row").count(), 4, "the three seed lines and the line of your own"); await k.close();
    const t = await welcome();
    await t.press("#w-skip"); await t.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await t.page.click("#save-done"); await wait(400);
    assert.equal(await t.page.locator("#list .row").count(), 0, "an empty list: nothing to delete"); assert.ok(!(await t.page.$eval("#today-empty", e => e.hidden)), "and the empty Today says so");
    const { R } = await t.s(); await t.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    // a second tab of the same device lands on the welcome without a current list: Paste the View link
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.current = null; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    const p2 = await t.ctx.newPage(); p2.setDefaultTimeout(6000); await p2.goto(BASE + "?transport=local"); await p2.waitForSelector("#welcome:not([hidden])"); await p2.waitForSelector("#list .row");
    assert.ok(await p2.$eval("#w-paste-form", e => e.hidden), "the form waits behind the link");
    if (touch) await p2.tap("#w-paste-show"); else await p2.click("#w-paste-show");
    assert.ok(!(await p2.$eval("#w-paste-form", e => e.hidden)));
    await p2.fill("#w-paste", "not a link"); await p2.press("#w-paste", "Enter"); await wait(200);
    assert.ok(/doesn't look like a list link/.test(await p2.textContent("#w-err")), "junk is refused out loud");
    await p2.fill("#w-paste", BASE + "#/r/" + R); await p2.press("#w-paste", "Enter"); await p2.waitForSelector("#ro:not([hidden])", { timeout: 9000 }); await p2.waitForSelector("#today-empty:not([hidden])", { timeout: 9000 }); await wait(300);
    assert.equal((await p2.evaluate(() => window.__tf())).mode, "view", "the View link opens the list view-only"); assert.equal(await p2.locator("#list .row").count(), 0, "the empty list, view-only"); assert.equal((await p2.textContent("#today-empty")).trim(), "Nothing on Today.");
    await p2.close(); await t.close();
  });

  await test(label + ": the save sheet by device — " + (touch ? "Safari on a phone leads with Add to Home Screen and shows no QR; the installed app says the icon holds the link" : "a desktop leads with Bookmark this page, then Copy, then Open it on your phone with the QR"), async () => {
    const check = async (init, expect) => {
      const t = await welcome(init);
      await t.press("#w-skip"); await t.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await wait(300);
      const leads = await t.page.$$eval("#p-save .save-lead:not([hidden]) b", els => els.map(e => e.textContent.trim()));
      const r = { leads, qr: !(await t.page.$eval("#save-phone", e => e.hidden)), link: !(await t.page.$eval("#save-link", e => e.hidden)), how: await t.page.$eval("#save-lead-home", e => e.hidden ? "" : Array.from(e.querySelectorAll("ol, span")).filter(x => !x.hidden).map(x => x.textContent.replace(/\s+/g, " ").trim()).join(" ")) };
      assert.equal(leads.length, 1, "one lead: " + JSON.stringify(r)); assert.ok(expect.lead.test(leads[0]), JSON.stringify(r)); assert.equal(r.qr, expect.qr, "the QR expander: " + JSON.stringify(r)); assert.equal(r.link, expect.link, "the link field: " + JSON.stringify(r));
      if (expect.how) assert.ok(expect.how.test(r.how), r.how);
      const order = await t.page.$$eval("#p-save .body > *:not([hidden])", els => els.map(e => e.id || e.className)); assert.ok(order.indexOf(expect.first) < order.indexOf("row-actions"), "the lead comes before the buttons: " + order);
      assert.equal(await t.page.locator("#p-save canvas:visible").count(), expect.qr ? 0 : 0, "no QR on screen until the expander opens"); // the desktop's QR waits behind the summary
      return t;
    };
    if (touch) {
      let t = await check(IPHONE, { lead: /Add it to your Home Screen/, qr: false, link: false, how: /Tap Share .*square with the arrow.*tap .*first.*Scroll down\..*Add to Home Screen/, first: "save-lead-home" }); await t.close();
      t = await check(STANDALONE, { lead: /Saved—this icon holds your link/, qr: false, link: false, first: "save-lead-icon" }); await t.close();
      t = await check(`Object.defineProperty(navigator, "platform", { get: () => "Linux armv8l" }); Object.defineProperty(navigator, "userAgent", { get: () => "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0 Mobile Safari/537.36" });`, { lead: /Add it to your Home Screen/, qr: false, link: false, how: /browser's menu/, first: "save-lead-home" }); await t.close(); // another phone: the browser's own menu
    } else {
      const t = await check("", { lead: /Bookmark this page/, qr: true, link: true, first: "save-lead-bm" });
      assert.ok(/⌘D|Ctrl\+D/.test(await t.page.textContent("#save-bm-key")));
      await t.page.click("#save-phone summary"); await wait(300); assert.ok(await t.page.locator("#save-qr-c").isVisible(), "the QR behind Open it on your phone");
      await t.close();
    }
  });

  await test(label + ": saving counts on Copy or I've saved it; until then ⋯ carries Save your link with a dot and the Share sheet repeats the key line; a device from before is grandfathered", async () => {
    const t = await welcome();
    await t.page.evaluate(() => document.getElementById("w-keep").click()); await t.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await wait(200); // the seed lines kept (Skip starts empty since 1.9)
    // 1.9: the sheet has the standard × and a Not yet chip; both close it and leave the nudge on (the audit's proposal 2)
    assert.ok(await t.page.$("#p-save h2 .x[data-close]"), "the × beside the title"); assert.equal((await t.page.textContent("#save-later")).trim(), "Not yet");
    await t.press("#save-later"); await wait(300); assert.ok(!(await t.page.$("#p-save[open]")), "Not yet closes the sheet"); assert.ok((await t.s()).unsaved, "and leaves the link unsaved");
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="save"]'); await t.page.waitForSelector("#p-save[open]"); await wait(200);
    await t.press("#p-save h2 .x"); await wait(300); assert.ok(!(await t.page.$("#p-save[open]")), "× closes the sheet"); assert.ok((await t.s()).unsaved, "and leaves the link unsaved too");
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="save"]'); await t.page.waitForSelector("#p-save[open]"); await wait(200);
    await t.esc(); await wait(300); // closed without saving
    assert.ok((await t.s()).unsaved, "not saved yet");
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await wait(200);
    let rows = await t.page.$$eval("#menu > *:not([hidden]) .lb", els => els.map(e => e.firstChild.textContent.trim()));
    assert.equal(rows.length, 10); assert.equal(rows[0], "Save your link"); assert.equal(await t.page.$eval("#menu-save .dot-k", e => e.textContent.trim()), "●", "with a dot");
    await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await wait(200);
    assert.ok(await t.page.locator("#share-unsaved").isVisible(), "the Share sheet repeats the key line"); assert.ok(/only key/.test(await t.page.textContent("#share-unsaved")));
    await t.page.click("#share-save"); await t.page.waitForSelector("#p-save[open]");
    await t.page.click("#save-done"); await wait(300);
    assert.equal(await t.page.locator("#p-save[open]").count(), 0, "I've saved it closes the sheet"); assert.ok(!(await t.s()).unsaved);
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); rows = await t.page.$$eval("#menu > *:not([hidden]) .lb", els => els.map(e => e.firstChild.textContent.trim())); assert.equal(rows.length, 9, "nine rows again: " + rows[0]);
    await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); assert.ok(await t.page.locator("#share-unsaved").isHidden(), "the notice is gone"); await t.esc(); await wait(200);
    await t.reload(); await t.page.waitForSelector("#list .row"); assert.ok(!(await t.s()).unsaved, "remembered");
    // Copy counts too (a second list, made from Lists)
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#l-new"); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Second"); await t.page.click("#ask-ok");
    await t.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await wait(200); await t.page.click("#save-copy"); await wait(300);
    assert.equal(await t.page.locator("#p-save[open]").count(), 0, "Copy closes the sheet"); assert.ok(/#\/l\//.test(await t.page.evaluate(() => window.__clip)), "with the Private link on the clipboard"); assert.ok(!(await t.s()).unsaved);
    // a 1.2 device that never confirmed its old sheet: grandfathered on update, no row, no dot
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.seenVersion = "1.2"; delete m.device.savedGrandfathered; m.lists.forEach(l => { l.linkSaved = false; }); localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForFunction(() => window.__tf && window.__tf().listId, null, { polling: 100 }); await wait(1800); // the second list is empty: no rows to wait for
    assert.ok(!(await t.s()).unsaved, "grandfathered"); assert.ok(await t.page.locator("#whatsnew").isVisible(), "the toast is the only new thing");
    await t.press("#wn-x"); await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); assert.equal((await t.page.$$eval("#menu > *:not([hidden])", els => els.length)), 9); await t.esc();
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the names everywhere — How it works (Private link, View link, Second screen beside Let someone watch, New keys), Settings › Advanced on a View link, the refusal of an add on a View link", async () => {
    const t = await fresh(opts);
    const { R } = await t.s();
    await t.press("#more"); await t.page.click('#p-menu [data-act="help"]'); await t.page.waitForSelector("#p-help[open]");
    const body = await t.page.textContent("#help-body");
    assert.ok(/Private link/.test(body) && /View link/.test(body) && /New keys/.test(body), "the names");
    assert.ok(/Second screen:/.test(body) && /Let someone watch:/.test(body), "both examples");
    const ex = await t.page.$$eval("#help-body p", els => els.filter(e => /^(Second screen|Let someone watch):/.test(e.textContent)).map(e => e.textContent.length));
    assert.equal(ex.length, 2); assert.ok(Math.abs(ex[0] - ex[1]) < 90, "same weight, same length: " + ex);
    assert.ok(!/edit link|view-only link|Rotate \(in Share\)/.test(body), "no old names: " + body.match(/edit link|Rotate \(in Share\)/));
    assert.ok(/Shuffle/.test(body) && /↻/.test(body), "shuffle in How it works");
    await t.esc(); await wait(200);
    if (!touch) { await t.page.keyboard.press("?"); await t.page.waitForSelector("#p-keys[open]"); assert.ok(/Shuffle/.test(await t.page.textContent("#keys-body")), "S in the reference"); await t.esc(); await wait(200); }
    await t.page.goto(BASE + "?transport=local#/r/" + R + "/add?text=Nope"); await wait(1500);
    assert.ok(/View link only shows the list/.test(await t.page.textContent("#toast .msg")) && /Private link/.test(await t.page.textContent("#toast .msg")), "the refusal names the links: " + await t.page.textContent("#toast .msg"));
    await t.page.evaluate(() => document.getElementById("more").click()); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.inputValue("#set-addurl"), "Open a Private link to get its URL");
    await t.esc();
    const about = await fresh(opts, { url: BASE + "about.html", list: false, ctx: t.ctx });
    const main = await about.page.textContent("main"); assert.ok(/Private link/.test(main) && /View link/.test(main) && !/edit link/.test(main), "About uses the names");
    await about.close(); await t.close();
  });

  await test(label + ": shuffle in one-thing mode — " + (touch ? "↻ beside the count" : "S, or ↻ beside the count") + ": a different undone line, never the same twice, no reorder, the last line wobbles, a check-off puts the top line back; nothing outside the mode", async () => {
    const t = await fresh(opts);
    const { listId } = await t.s();
    await t.page.goto(BASE + "?transport=local#/l/" + listId + "/add?text=Four%0AFive%0ASix"); await wait(1200);
    assert.equal(await t.page.$eval("#shuffle", e => getComputedStyle(e).display), "none", "↻ exists only inside one-thing mode");
    if (!touch) { const o0 = await t.page.$$eval("#list .row", els => els.map(e => e.dataset.id).join(",")); await t.page.keyboard.press("s"); await wait(300); assert.equal(await t.page.$$eval("#list .row", els => els.map(e => e.dataset.id).join(",")), o0, "S outside the mode does nothing"); }
    if (touch) await t.page.tap("#count"); else await t.page.keyboard.press("o"); await wait(400);
    assert.ok(await t.page.evaluate(() => document.body.classList.contains("one"))); assert.equal(await t.page.$eval("#shuffle", e => getComputedStyle(e).display !== "none"), true, "↻ beside the count");
    assert.ok(await t.page.evaluate(() => { const c = document.getElementById("count").getBoundingClientRect(), s = document.getElementById("shuffle").getBoundingClientRect(); return s.left >= c.right - 2 && Math.abs(s.top - c.top) < 20; }), "beside the count");
    const orderOf = () => t.page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.items).filter(i => !i.deleted).map(i => i.id + ":" + i.todayOrder).sort().join(","));
    const o1 = await orderOf(); const top = (await t.s()).oneNow;
    const seen = new Set(); let prev = top, tick0 = (await t.s()).stats.tick;
    for (let i = 0; i < 10; i++) {
      if (touch || i % 2) await t.page.tap("#shuffle").catch(() => t.page.click("#shuffle")); else await t.page.keyboard.press("s");
      await wait(320);
      const now = (await t.s()).oneNow; assert.ok(now && now !== prev, "never the same line twice in a row (" + i + ")"); seen.add(now); prev = now;
    }
    assert.ok(seen.size >= 3, "chosen at random among the undone lines: " + seen.size);
    assert.equal((await t.s()).stats.tick, tick0 + 10, "the theme's soft tick each time");
    assert.equal(await orderOf(), o1, "nothing was reordered");
    assert.equal(await t.page.locator("#list .row.one-now").count(), 1, "one line shown");
    const shown = (await t.s()).oneNow; await wait(1200); assert.equal((await t.s()).oneNow, shown, "the shuffled line holds");
    await t.press("#list .row.one-now .check"); await wait(900);
    const firstUndone = await t.page.evaluate(() => { const d = JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc; return Object.values(d.items).filter(i => !i.deleted && i.today && !i.done).sort((a, b) => a.todayOrder - b.todayOrder)[0].id; });
    assert.equal((await t.s()).oneNow, firstUndone, "after a check-off the top undone line is back"); assert.equal((await t.s()).shuffled, null);
    // a panel open: a shuffle is ignored
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); const before = (await t.s()).oneNow; if (!touch) await t.page.keyboard.press("s"); await wait(200); assert.equal((await t.s()).oneNow, before); await t.esc(); await wait(200);
    // down to one undone line: a wobble, nothing changes
    while ((await t.page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.items).filter(i => !i.deleted && i.today && !i.done).length)) > 1) { await t.press("#list .row.one-now .check"); await wait(800); }
    const last = (await t.s()).oneNow; if (touch) await t.page.tap("#shuffle"); else await t.page.keyboard.press("s"); await wait(120);
    assert.ok(await t.page.$eval("#list .row.one-now", e => e.classList.contains("wobble")), "a small wobble"); assert.equal((await t.s()).oneNow, last, "nothing changes");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  if (touch) await test(label + ": shake to shuffle — the hint on the second visit to the mode, named for what it does, once; Allow, a shake shuffles, a walk does not, one shuffle a second; declined means ↻ only", async () => {
    const t = await fresh(opts, { init: IPHONE + ` window.__perm = "granted"; DeviceMotionEvent.requestPermission = async () => window.__perm;` });
    const { listId } = await t.s();
    await t.page.goto(BASE + "?transport=local#/l/" + listId + "/add?text=Four%0AFive"); await wait(1200);
    assert.ok(await t.page.$eval("#shake-ask", e => e.hidden), "nothing before one-thing mode");
    await t.page.tap("#count"); await wait(400);
    assert.ok(await t.page.$eval("#shake-ask", e => e.hidden), "1.9: the first visit to the mode, often an accident, asks nothing (proposal 12)");
    assert.ok(await t.page.$eval("#count", e => { const cs = getComputedStyle(e); return parseFloat(cs.borderTopWidth) >= 1 && cs.backgroundColor !== "rgba(0, 0, 0, 0)"; }), "1.9: on a phone the count looks like a control (proposal 11)");
    await t.page.tap("#count"); await wait(300); await t.page.tap("#count"); await wait(400); // off and on again: the second visit
    assert.ok(!(await t.page.$eval("#shake-ask", e => e.hidden)), "the second time one-thing mode opens on a phone, the hint"); assert.equal((await t.page.textContent("#shake-ask span")).trim(), "Shake the phone for a different line?", "named for what it does");
    await wait(1400); // the install hint arrives at 2.5 s: the two hints stack, the toast sits above both
    const stack = await t.page.evaluate(() => { const r = s => { const el = document.querySelector(s); const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), on: !el.hidden && getComputedStyle(el).opacity !== "0" }; }; return { install: r("#install"), ask: r("#shake-ask"), toast: r("#toast") }; });
    assert.ok(stack.install.on && stack.ask.on, "both hints up: " + JSON.stringify(stack)); assert.ok(stack.ask.bottom <= stack.install.top + 1, "the shake hint sits above the install hint: " + JSON.stringify(stack));
    if (stack.toast.on) assert.ok(stack.toast.bottom <= stack.ask.top + 1, "the toast above both: " + JSON.stringify(stack));
    await t.page.tap("#shake-allow"); await wait(300);
    let st = await t.s(); assert.equal(st.shake, "allowed"); assert.ok(st.motion, "listening");
    const shake = (a, b) => t.page.evaluate(([a, b]) => { window.dispatchEvent(new DeviceMotionEvent("devicemotion", { acceleration: { x: a, y: 0, z: 0 } })); window.dispatchEvent(new DeviceMotionEvent("devicemotion", { acceleration: { x: b, y: 0, z: 0 } })); }, [a, b]);
    let before = st.oneNow; await shake(0, 25); await wait(400); assert.notEqual((await t.s()).oneNow, before, "a shake (a delta over 15 m/s²) shuffles");
    before = (await t.s()).oneNow; await shake(0, 25); await wait(300); assert.equal((await t.s()).oneNow, before, "one shuffle a second at most");
    await shake(25, 25); await wait(1100); before = (await t.s()).oneNow; await shake(28, 24); await shake(29, 26); await wait(300); assert.equal((await t.s()).oneNow, before, "a walk (small deltas) does not");
    await wait(300); await t.page.tap("#more"); await t.page.waitForSelector("#p-menu[open]"); before = (await t.s()).oneNow; await shake(0, 25); await wait(300); assert.equal((await t.s()).oneNow, before, "ignored while a panel is open"); await t.esc(); await wait(200);
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(400);
    assert.ok(await t.page.$eval("#shake-ask", e => e.hidden), "asked once"); assert.ok((await t.s()).motion, "and still listening on the next open");
    // declined: ↻ only
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); delete m.device.shake; m.device.oneThing = false; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(300); await t.page.tap("#count"); await wait(400);
    assert.ok(!(await t.page.$eval("#shake-ask", e => e.hidden))); await t.page.tap("#shake-x"); await wait(200);
    st = await t.s(); assert.equal(st.shake, "declined");
    before = st.oneNow; await wait(1100); await shake(0, 25); await wait(300); assert.equal((await t.s()).oneNow, before, "a shake does nothing once declined");
    await t.page.tap("#shuffle"); await wait(300); assert.notEqual((await t.s()).oneNow, before, "↻ still works");
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(400); assert.ok(await t.page.$eval("#shake-ask", e => e.hidden), "never asked again");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": Keep under the server's create limit still degrades politely — the list is kept here, the toast says so, no error", async () => {
    const t = await welcome();
    await t.page.evaluate(() => localStorage.setItem("tf/test/limit", "1"));
    await t.page.evaluate(() => document.getElementById("w-keep").click()); await t.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await t.page.click("#save-done"); await wait(300);
    await t.page.waitForFunction(() => window.__tf().status === "busy", null, { timeout: 8000, polling: 200 });
    assert.equal(await t.page.locator("#list .row").count(), 3, "the list is here"); assert.ok(/busy/i.test(await t.page.textContent("#toast .msg")) && /safe here/.test(await t.page.textContent("#toast .msg")), await t.page.textContent("#toast .msg"));
    assert.ok((await storedLists(t.page)).some(k => k.startsWith("tf/v3/list/")), "kept locally");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the card a texted link shows — the Open Graph and Twitter tags are in the static HTML of both pages, the image answers 200 at 1200×630 under 150 KB", async () => {
    for (const file of ["", "about.html"]) {
      const html = await (await fetch(BASE + file)).text();
      const tag = (p, n = "property") => { const m = html.match(new RegExp("<meta " + n + "=\"" + p + "\" content=\"([^\"]*)\"")); return m ? m[1] : null; };
      assert.equal(tag("og:title"), file ? "Today's Five — how it works &amp; privacy" : "Today's Five", file + " og:title");
      assert.ok(tag("og:description") && tag("og:description").split(/[.!?](\s|$)/).filter(s => s.trim()).length === 1, file + " one sentence: " + tag("og:description"));
      assert.ok(/^https:\/\/54kz2vzbdw-code\.github\.io\/todays-five\/icons\/og\.png$/.test(tag("og:image")), file + " an absolute image URL");
      assert.ok(/^https:\/\/54kz2vzbdw-code\.github\.io\/todays-five\//.test(tag("og:url")), file + " og:url"); assert.equal(tag("twitter:card", "name"), "summary_large_image");
      assert.ok(new RegExp("<link rel=\"canonical\" href=\"https://54kz2vzbdw-code\\.github\\.io/todays-five/" + file + "\">").test(html), file + " canonical");
    }
    const r = await fetch(BASE + "icons/og.png"); assert.equal(r.status, 200); const buf = Buffer.from(await r.arrayBuffer());
    const png = PNG.sync.read(buf); assert.equal(png.width + "×" + png.height, "1200×630"); assert.ok(buf.length < 150 * 1024, "under 150 KB: " + buf.length);
    const sw = await (await fetch(BASE + "sw.js")).text(); assert.ok(!/og\.png/.test(sw), "not part of the shell");
  });

  /* ---------------- 1.4: mine and shared, Share by intent, the panel stack, iOS 26, pages open across a deploy ---------------- */
  /** a list this device made and then forgot: no registry entry, no local copy — the local transport still holds it */
  const forget = async (page, id) => { await page.evaluate(id => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.lists = m.lists.filter(l => l.id !== id); if (m.current === id) m.current = (m.lists[0] || {}).id || null; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); localStorage.removeItem("tf/v3/list/" + id); }, id); await page.reload(); await page.waitForFunction(() => window.__tf && (window.__tf().listId || window.__tf().demo)); await wait(400); }; // the page's own registry is rebuilt from storage by the reload
  /** a second list made in this context (Lists → New list), on its own page so the page under test keeps its place */
  const makeList = async (t, name) => {
    const q = await t.ctx.newPage(); await q.goto(BASE + "?transport=local"); await q.waitForFunction(() => window.__tf && window.__tf().listId); const prev = await q.evaluate(() => window.__tf().listId);
    await q.evaluate(() => document.getElementById("more").click()); await q.waitForSelector("#p-menu[open]"); await q.click('#p-menu [data-act="lists"]'); await q.waitForSelector("#p-lists[open]"); await q.click("#l-new"); await q.waitForSelector("#ask[open]"); await q.fill("#ask-input", name); await q.click("#ask-ok");
    await q.waitForFunction(prev => window.__tf && window.__tf().listId && window.__tf().listId !== prev, prev, { timeout: 9000 }); await wait(600);
    const st = await q.evaluate(() => window.__tf()); await q.close(); return { id: st.listId, R: st.R };
  };
  const whoseOpen = page => page.$eval("#whose", e => e.open);
  const onList = (page, id) => page.waitForFunction(id => window.__tf && window.__tf().listId === id && !document.getElementById("whose").open, id, { timeout: 9000 });

  await test(label + ": whose list is this — asked once for a bare private link and for a view link, never for a hinted link or a list made here; the answer files it and the hint leaves the address bar", async () => {
    const t = await fresh(opts);
    assert.equal((await t.s()).origin, "mine", "a list made here is mine, no question"); assert.ok(!(await t.s()).whose);
    const a = await makeList(t, "Groceries"); await forget(t.page, a.id);
    await t.page.goto(BASE + "?transport=local#/l/" + a.id); await t.page.waitForFunction(() => document.getElementById("whose").open, null, { timeout: 9000 });
    assert.equal(await t.page.$eval("#whose-h", e => e.textContent), "Whose list is this?");
    assert.deepEqual(await t.page.$$eval("#whose [data-whose]", els => els.map(e => e.textContent.trim())), ["Mine, from another device", "Someone else's"], "one tap");
    await t.page.keyboard.press("Escape"); await wait(250); assert.ok(await whoseOpen(t.page), "not cancelable: the answer is what the list is filed as");
    await t.press('#whose [data-whose="shared"]'); await onList(t.page, a.id); await wait(600);
    let st = await t.s(); assert.equal(st.origin, "shared"); assert.ok(!(await t.page.$eval("#shared", e => e.hidden)), "the Shared pill"); assert.equal((await t.page.$eval("#shared", e => e.textContent)).trim(), "Shared");
    await t.reload(); await onList(t.page, a.id); await wait(500); assert.ok(!(await whoseOpen(t.page)), "asked once");
    // a hinted link: no question, the hint decides and leaves the address bar
    const b = await makeList(t, "Work"); await forget(t.page, b.id);
    await t.page.goto(BASE + "?transport=local#/l/" + b.id + "/mine"); await onList(t.page, b.id); await wait(600);
    st = await t.s(); assert.equal(st.origin, "mine", "/mine files it under My lists"); assert.equal(await t.page.evaluate(() => location.hash), "#/l/" + b.id, "the hint is gone from the address bar");
    await t.page.goto(BASE + "?transport=local#/l/" + a.id); await onList(t.page, a.id); await wait(300); await forget(t.page, b.id);
    await t.page.goto(BASE + "?transport=local#/l/" + b.id + "/shared"); await onList(t.page, b.id); await wait(600);
    st = await t.s(); assert.equal(st.origin, "shared", "/shared files it under Shared with me"); assert.equal(await t.page.evaluate(() => location.hash), "#/l/" + b.id);
    // a view link carries no hint: the question, once; a view-only list of one's own has no pill
    const c = await makeList(t, "Reading"); await forget(t.page, c.id);
    await t.page.goto(BASE + "?transport=local#/r/" + c.R); await t.page.waitForFunction(() => document.getElementById("whose").open, null, { timeout: 9000 });
    await t.press('#whose [data-whose="mine"]'); await t.page.waitForFunction(() => window.__tf().mode === "view" && !document.getElementById("whose").open, null, { timeout: 9000 }); await wait(500);
    st = await t.s(); assert.equal(st.origin, "mine"); assert.equal(st.mode, "view"); assert.ok(await t.page.$eval("#shared", e => e.hidden), "no pill on a list of one's own");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.7: the whose question survives a tap outside the card and Escape, no answer carries a focus ring, and an answer opens the list", async () => {
    const t = await fresh(opts);
    const c = await makeList(t, "Reading"); await forget(t.page, c.id);
    await t.page.goto(BASE + "?transport=local#/l/" + c.id); await t.page.waitForFunction(() => document.getElementById("whose").open, null, { timeout: 9000 }); await wait(400);
    assert.equal(await t.page.$$eval("#whose [data-whose]", els => els.filter(e => e.matches(":focus-visible")).length), 0, "no answer looks chosen");
    if (opts.hasTouch) await t.page.touchscreen.tap(12, 60); else await t.page.mouse.click(12, 60); await wait(500);
    assert.ok(await whoseOpen(t.page), "a tap outside the card is not an answer");
    await t.page.keyboard.press("Escape"); await wait(300); assert.ok(await whoseOpen(t.page), "nor is Escape");
    await t.press('#whose [data-whose="shared"]'); await t.page.waitForFunction(id => !document.getElementById("whose").open && window.__tf().listId === id, c.id, { timeout: 9000 }); await wait(400);
    await t.page.waitForFunction(() => window.__tf().status === "synced" && !document.getElementById("today-empty").hidden, null, { timeout: 9000 }); // a list made by New list is empty: the empty Today says so
    assert.equal((await t.s()).origin, "shared");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": a shared list — under Shared with me in Lists, a nickname of its own that never touches the synced name, no New keys, no Delete everywhere, no save nudge; It's mine after all files it under My lists and brings them back; a list made here has no switch", async () => {
    const t = await fresh(opts, { init: STUBS });
    const a = await makeList(t, "Groceries"); await forget(t.page, a.id);
    await t.page.goto(BASE + "?transport=local#/l/" + a.id + "/shared"); await onList(t.page, a.id); await wait(600);
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(300);
    const groups = await t.page.$$eval("#lists-menu > *", els => els.map(e => e.classList.contains("group-h") ? "#" + e.textContent : e.querySelector(".lb").firstChild.textContent.trim()));
    assert.deepEqual(groups, ["#My lists", "Untitled list", "#Shared with me", "Groceries"], "grouped: " + groups);
    // 1.9: the nickname is in the list's detail (›), the one place Rename or Nickname lives now (proposal 5)
    await t.page.click('#lists-menu .row:has(.cur) .more'); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.equal((await t.page.textContent("#list-detail-rename")).trim(), "Nickname");
    await t.page.click('#list-detail-menu [data-lact="rename"]'); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Sarah's groceries"); await t.page.click("#ask-ok"); await wait(400);
    assert.equal((await t.page.textContent("#listname")).trim(), "Sarah's groceries", "the rail goes by the nickname"); assert.equal((await t.s()).nickname, "Sarah's groceries");
    assert.equal(await t.page.evaluate(id => JSON.parse(localStorage.getItem("tf/v3/list/" + id)).doc.name, a.id), "Groceries", "the name inside the document is untouched");
    // the other device (a page that pulls the list fresh) still sees the list's own name
    const other = await fresh(opts, { url: BASE + "?transport=local#/l/" + a.id, list: false, ctx: t.ctx }); await other.page.waitForFunction(id => window.__tf && window.__tf().listId === id, a.id); await wait(800);
    assert.equal(await other.page.evaluate(() => window.__tf().listId && document.getElementById("list-h1").textContent), "Sarah's groceries — Today's Five"); // the same registry: the nickname
    assert.equal(await other.page.evaluate(id => JSON.parse(localStorage.getItem("tf/v3/list/" + id)).doc.name, a.id), "Groceries", "and the document name as it was");
    await other.close();
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(300);
    const row = await t.page.$eval("#lists-menu .row:last-child .lb", e => e.textContent.replace(/\s+/g, " ").trim()); assert.ok(/^Sarah's groceries/.test(row) && /Groceries$/.test(row), "nickname first, its own name second: " + row);
    await t.page.keyboard.press("Escape"); await wait(250);
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); assert.ok(await t.page.$eval("#menu-delete", e => e.hidden), "no Delete everywhere"); assert.ok(await t.page.$eval("#menu-save", e => e.hidden), "no save nudge");
    await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await wait(300);
    assert.ok(await t.page.$eval("#share-keys", e => e.hidden), "no New keys"); assert.ok(await t.page.$eval("#share-unsaved", e => e.hidden), "no save nudge in Share");
    assert.deepEqual(await t.page.$$eval("#p-share .lk-block:not([hidden])", els => els.map(e => e.id)), ["share-view", "share-mine", "share-private", "share-friend"], "everything else the link allows");
    await t.page.keyboard.press("Escape"); await wait(250);
    // It's mine after all
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu .row:last-child .more"); await t.page.waitForSelector("#p-list[open]"); await wait(300);
    assert.equal((await t.page.textContent("#p-list-h")).trim(), "Sarah's groceries"); assert.ok(/Shared with me/.test(await t.page.textContent("#list-detail-sub")) && /Groceries/.test(await t.page.textContent("#list-detail-sub")));
    // 1.9: the question a link asked, mirrored — two answers under "Whose list is this?", the current one marked (proposal 10)
    assert.equal((await t.page.textContent("#list-detail-whose-h")).trim(), "Whose list is this?"); assert.ok(!(await t.page.$eval("#list-detail-whose", e => e.hidden)));
    const answers = async () => t.page.$$eval("#list-detail-whose [data-whose]", els => els.map(e => e.dataset.whose + ":" + e.getAttribute("aria-checked")).join(" "));
    assert.equal(await answers(), "mine:false shared:true", "Someone else's is marked"); assert.equal(await t.page.$eval("#list-detail-whose", e => e.getAttribute("role")), "radiogroup");
    assert.equal((await t.page.textContent("#list-detail-rename")).trim(), "Nickname");
    await t.page.click('#list-detail-whose [data-whose="mine"]'); await wait(400);
    let st = await t.s(); assert.equal(st.origin, "mine"); assert.equal(st.nickname, null, "a list of one's own goes by its name"); assert.equal((await t.page.textContent("#listname")).trim(), "Groceries");
    assert.equal(await answers(), "mine:true shared:false"); assert.ok(await t.page.$eval("#shared", e => e.hidden), "the pill is gone");
    assert.equal((await t.page.textContent("#list-detail-rename")).trim(), "Rename");
    await t.page.keyboard.press("Escape"); await wait(250); assert.equal((await t.s()).panels.join(","), "p-lists", "Escape from the detail lands on Lists");
    assert.equal(await t.page.locator("#lists-menu .group-h").count(), 0, "no groups once nothing is shared");
    await t.page.keyboard.press("Escape"); await wait(250);
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); assert.ok(!(await t.page.$eval("#menu-delete", e => e.hidden)), "Delete everywhere is back");
    await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); assert.ok(!(await t.page.$eval("#share-keys", e => e.hidden)), "New keys is back"); await t.page.keyboard.press("Escape"); await wait(250);
    // a list made on this device has no switch; one from a link can go the other way
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu .row:first-child .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.ok(await t.page.$eval("#list-detail-whose", e => e.hidden), "a list made on this device is mine, not asked"); assert.equal((await t.page.textContent("#list-detail-sub")).trim(), "Made on this device");
    await t.page.click("#p-list h2 .back"); await wait(300); await t.page.click("#lists-menu .row:last-child .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.ok(!(await t.page.$eval("#list-detail-whose", e => e.hidden))); assert.equal((await t.page.textContent("#list-detail-sub")).trim(), "Mine, from another device");
    await t.page.click('#list-detail-whose [data-whose="shared"]'); await wait(300); assert.equal((await t.s()).origin, "shared", "and back to shared"); assert.ok(!(await t.page.$eval("#shared", e => e.hidden)));
    await t.page.keyboard.press("Escape"); await t.page.keyboard.press("Escape"); await wait(250);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": the Share sheet by intent — Show it somewhere first (the View link, both uses in one breath, the first Copy), Open on my other device (the Private link marked /mine, qualified, the code first, then Copy), Let someone edit (the Private link marked /shared under the warning, Copy only), Tell a friend apart, New keys last; the system share sheet gets the note in the tap's own tick, and the note itself is shown when nothing else can take it", async () => {
    const t = await fresh(opts, { init: STUBS + ` document.addEventListener("click", () => { window.__inClick = true; queueMicrotask(() => { window.__inClick = false; }); }, true); navigator.share = d => { window.__shared.push({ ...d, sync: !!(window.event && window.event.type === "click") }); return Promise.resolve(); };` });
    const { listId, R } = await t.s();
    await t.press("#more"); await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await wait(300);
    assert.deepEqual(await t.page.$$eval("#p-share .lk-block:not([hidden])", els => els.map(e => e.id)), ["share-view", "share-mine", "share-private", "share-friend", "share-keys"], "the order");
    assert.deepEqual(await t.page.$$eval("#p-share .lk-block:not([hidden]) h3", els => els.map(e => e.firstChild.textContent.trim())), ["Show it somewhere", "Open on my other device", "Let someone edit", "Tell a friend", "Replace both links"]);
    assert.equal(await t.page.$eval("#share-view h3 .sub-h", e => e.textContent), "view only");
    assert.equal(await t.page.$eval("#share-mine h3 .sub-h", e => e.textContent), "the same list, with full control", "1.9: the first block's qualifier says what the link does (proposal 9)");
    assert.ok(await t.page.evaluate(() => document.getElementById("share-copy").getBoundingClientRect().top < document.getElementById("share-copy-mine").getBoundingClientRect().top), "the View link's Copy is the first Copy");
    const viewMsg = await t.page.textContent("#share-view .share-msg"); assert.ok(/can't change it/.test(viewMsg) && /second screen/.test(viewMsg) && /someone who should watch/.test(viewMsg), "both uses in one breath: " + viewMsg);
    assert.ok(/sound and the confetti/.test(await t.page.textContent("#share-view-more")));
    assert.ok(!/for your other devices|for anyone|who should be able to edit/i.test(await t.page.textContent("#p-share")), "what the link does, never who it is for");
    assert.equal(await t.page.$eval("#share-link-mine", e => e.value), BASE + "#/l/" + listId + "/mine"); assert.equal(await t.page.$eval("#share-link", e => e.value), BASE + "#/r/" + R); assert.equal(await t.page.$eval("#share-link-private", e => e.value), BASE + "#/l/" + listId + "/shared");
    assert.equal(await t.page.$eval("#qr-mine", e => e.hidden), touch, "the code where the sheet has room"); assert.equal(await t.page.$eval("#qr", e => e.hidden), touch);
    if (!touch) assert.ok(await t.page.evaluate(() => document.getElementById("qr-mine").getBoundingClientRect().top < document.getElementById("share-copy-mine").getBoundingClientRect().top), "the code first, then Copy");
    await t.page.click("#share-copy-mine"); await wait(150); assert.equal(await t.page.evaluate(() => window.__clip), BASE + "#/l/" + listId + "/mine", "the Private link marked as mine");
    await t.page.click("#share-copy"); await wait(150); assert.equal(await t.page.evaluate(() => window.__clip), BASE + "#/r/" + R);
    await t.page.click("#share-copy-private"); await wait(150); assert.equal(await t.page.evaluate(() => window.__clip), BASE + "#/l/" + listId + "/shared", "Copy under the warning: marked as shared");
    assert.deepEqual(await t.page.$$eval("#share-private button", els => els.map(e => e.textContent.trim())), ["Copy the Private link", "QR code"], "Copy and a code under the warning, nothing else");
    // a QR code on request: beside every Copy where the sheet has no room for the code, and always under the warning
    assert.equal(await t.page.$eval("#share-qr-mine", e => e.hidden), !touch, "the QR code button where the code is not already on screen"); assert.equal(await t.page.$eval("#share-qr", e => e.hidden), !touch); assert.ok(!(await t.page.$eval("#share-qr-private", e => e.hidden)));
    if (touch) { assert.ok(await t.page.$eval("#qr-mine", e => e.hidden)); await t.page.click("#share-qr-mine"); await wait(500); assert.ok(!(await t.page.$eval("#qr-mine", e => e.hidden)), "the code opens"); assert.ok(await t.page.$eval("#qr-mine-c", c => c.width > 50), "and is drawn"); assert.equal(await t.page.$eval("#share-qr-mine", e => e.getAttribute("aria-pressed")), "true"); await t.page.click("#share-qr-mine"); await wait(200); assert.ok(await t.page.$eval("#qr-mine", e => e.hidden), "and closes again"); }
    assert.ok(await t.page.$eval("#qr-private", e => e.hidden)); await t.page.click("#share-qr-private"); await wait(500); assert.ok(!(await t.page.$eval("#qr-private", e => e.hidden)) && await t.page.$eval("#qr-private-c", c => c.width > 50), "the private link's code on request"); await t.page.click("#share-qr-private"); await wait(200);
    const warn = await t.page.$eval("#share-warn", e => ({ text: e.textContent, color: getComputedStyle(e).color, danger: getComputedStyle(document.documentElement).getPropertyValue("--danger").trim() }));
    const hex = c => "#" + c.match(/\d+/g).slice(0, 3).map(v => (+v).toString(16).padStart(2, "0")).join("").toUpperCase();
    assert.equal(hex(warn.color), warn.danger.toUpperCase(), "the warning line is in the danger colour"); assert.ok(/change everything/.test(warn.text) && /no spare/.test(warn.text), warn.text);
    const tops = await t.page.evaluate(() => ["share-view", "share-mine", "share-private", "share-friend", "share-keys"].map(id => document.getElementById(id).getBoundingClientRect().top)); assert.ok(tops.every((v, i) => !i || v > tops[i - 1]), "top to bottom in that order: " + tops);
    assert.ok(await t.page.evaluate(() => document.getElementById("share-friend").getBoundingClientRect().top - document.getElementById("share-private").getBoundingClientRect().bottom >= 0), "Tell a friend sits apart");
    assert.equal((await t.page.textContent("#share-rotate")).trim(), "New keys"); assert.ok(/old links stop working everywhere/.test(await t.page.textContent("#share-rotate-note")));
    assert.ok(!/edit link|rotate/i.test(await t.page.textContent("#p-share")), "the old names are gone from the sheet");
    await t.page.click("#share-friend-go"); await wait(200);
    const shared = await t.page.evaluate(() => window.__shared); assert.equal(shared.length, 1, "handed to the system share sheet"); assert.ok(shared[0].sync, "navigator.share ran inside the tap's own tick");
    assert.equal(shared[0].url, BASE, "the bare app URL"); assert.ok(!/#\/(l|r)\//.test(JSON.stringify(shared)), "never a list link");
    const sentences = shared[0].text.split(/[.!?](\s|$)/).filter(s => s.trim()); assert.equal(sentences.length, 2, "two sentences: " + shared[0].text);
    await t.page.evaluate(() => { navigator.share = undefined; }); await t.page.click("#share-friend-go"); await wait(250);
    const clip = await t.page.evaluate(() => window.__clip); assert.ok(clip.endsWith("\n" + BASE) && !/#\/(l|r)\//.test(clip), "the clipboard fallback: " + clip); assert.ok(/Note copied/.test(await t.page.textContent("#toast .msg")));
    await t.page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("no")); }); await t.page.click("#share-friend-go"); await wait(300);
    assert.ok(!(await t.page.$eval("#share-note", e => e.hidden)), "the note itself is shown"); assert.ok((await t.page.$eval("#share-note", e => e.value)).endsWith("\n" + BASE)); assert.equal((await t.page.textContent("#toast .msg")).trim(), "Select the note and copy it", "the toast says the note, not the link");
    await t.page.keyboard.press("Escape"); await wait(250);
    const v = await fresh(opts, { url: BASE + "?transport=local#/r/" + R, list: false, ctx: t.ctx });
    await v.page.waitForSelector("#ro:not([hidden])"); await v.page.evaluate(() => document.getElementById("more").click()); await v.page.waitForSelector("#p-menu[open]");
    assert.equal((await v.page.textContent("#menu-share-lb")).trim(), "Share the View link");
    await v.page.click('#p-menu [data-act="share"]'); await v.page.waitForSelector("#p-share[open]");
    assert.deepEqual(await v.page.$$eval("#p-share .lk-block:not([hidden])", els => els.map(e => e.id)), ["share-view", "share-friend"], "a View link holder: Show it somewhere and Tell a friend only");
    assert.equal((await v.page.$eval("#ro", e => e.textContent.replace(/\s+/g, " ").trim())), "View link · view only", "the pill names the link");
    assert.equal(await v.page.$eval("#ro .ro-l", e => getComputedStyle(e).display), touch ? "none" : "inline", "the phone's rail keeps the state alone");
    await v.close();
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": panels are one stack — a sub-panel shows ‹ Back and returns to its parent with its scroll and its changed value, × closes the whole stack, Escape goes back a level and closes at the root, one history entry per level so the browser's Back goes back a level" + (touch ? ", and an edge swipe from the left goes back" : ""), async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(300);
    assert.equal((await t.s()).panels.join(","), "p-settings", "a panel from the ⋯ menu is a root"); assert.equal(await t.page.locator("#p-settings h2 .back").count(), 0, "no Back at the root");
    assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), 1, "one history entry for the level");
    await t.page.evaluate(() => { document.querySelector("#p-settings .body").scrollTop = 60; }); await wait(100); // the Day row stays in view: a click that had to scroll it into view would move the parent before it is left
    const scrolled = await t.page.evaluate(() => document.querySelector("#p-settings .body").scrollTop); assert.ok(scrolled >= 30, "scrolled: " + scrolled);
    const dayBefore = (await t.page.textContent("#set-day-k")).trim();
    await t.page.click('#p-settings [data-set="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(300);
    assert.equal((await t.s()).panels.join(","), "p-settings,p-theme"); assert.equal(await t.page.locator("#p-theme h2 .back").count(), 1, "‹ Back on the sub-panel"); assert.equal((await t.page.textContent("#p-theme h2 .back")).replace(/\s+/g, " ").trim(), "‹ Back");
    assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), 2, "a second entry for the second level");
    const sw = await t.page.$$("#p-theme .swatch"); const pressed = await Promise.all(sw.map(s => s.getAttribute("aria-pressed"))); await sw[pressed.indexOf("false")].click(); await wait(500);
    await t.page.click("#p-theme h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(400);
    assert.equal((await t.s()).panels.join(","), "p-settings", "Back lands on the parent");
    assert.notEqual((await t.page.textContent("#set-day-k")).trim(), dayBefore, "the value changed below is in place");
    assert.ok(Math.abs(await t.page.evaluate(() => document.querySelector("#p-settings .body").scrollTop) - scrolled) <= 2, "the parent's scroll position");
    assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), 1, "the level's entry went with it");
    await t.page.click('#p-settings [data-set="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(200);
    await t.page.keyboard.press("Escape"); await wait(350); assert.equal((await t.s()).panels.join(","), "p-settings", "Escape goes back one level");
    await t.page.keyboard.press("Escape"); await wait(350); assert.equal((await t.s()).panels.join(","), "", "and closes at the root"); assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), null, "no entry left behind");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('#p-settings [data-set="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(300);
    await t.page.evaluate(() => history.back()); await wait(500); assert.equal((await t.s()).panels.join(","), "p-settings", "the browser's Back: one level, not out of the list");
    await t.page.click('#p-settings [data-set="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(200);
    await t.page.click("#p-theme .x"); await wait(400); assert.equal((await t.s()).panels.join(","), "", "× closes the whole stack"); assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), null, "and its entries are gone");
    assert.equal((await t.s()).listId !== null, true, "still on the list");
    // Lists → a list's detail → back (the edge swipe on a phone)
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu .row .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.equal((await t.s()).panels.join(","), "p-lists,p-list");
    if (touch) { const cdp = await t.ctx.newCDPSession(t.page); await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 6, y: 520 }] }); for (let i = 1; i <= 6; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 6 + 22 * i, y: 520 }] }); await wait(16); } await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach(); await wait(500); }
    else { await t.page.click("#p-list h2 .back"); await wait(400); }
    assert.equal((await t.s()).panels.join(","), "p-lists", touch ? "the edge swipe goes back" : "Back lands on Lists");
    await t.page.keyboard.press("Escape"); await wait(250);
    // Export & import and Removed lists, from Settings
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('#p-settings [data-set="export"]'); await t.page.waitForSelector("#p-export[open]"); await wait(200);
    assert.equal((await t.s()).panels.join(","), "p-settings,p-export"); await t.page.click("#p-export h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250); assert.equal((await t.s()).panels.join(","), "p-settings");
    await t.page.keyboard.press("Escape"); await wait(250);
    // 1.9: History from a list's detail, two levels under Lists (proposal 5); Back lands on the detail, then on Lists
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu .row:has(.cur) .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.ok(!(await t.page.$eval("#list-detail-history", e => e.hidden)), "History is in the detail"); await t.page.click('#list-detail-menu [data-lact="history"]'); await t.page.waitForSelector("#p-history[open]"); await wait(200);
    assert.equal((await t.s()).panels.join(","), "p-lists,p-list,p-history"); assert.ok(/Nothing finished on a previous day/.test(await t.page.textContent("#history-days")));
    await t.page.click("#p-history h2 .back"); await t.page.waitForSelector("#p-list[open]"); await wait(300); assert.equal((await t.s()).panels.join(","), "p-lists,p-list");
    await t.page.click("#p-list h2 .back"); await t.page.waitForSelector("#p-lists[open]"); await wait(300); assert.equal((await t.s()).panels.join(","), "p-lists");
    await t.page.keyboard.press("Escape"); await wait(250);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": a 1.3 device opens 1.8 — every list it holds is mine with no question and no groups, and the toast is the only new thing", async () => {
    const t = await fresh(opts);
    await makeList(t, "Work");
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); for (const l of m.lists) { delete l.origin; delete l.nickname; } m.device.seenVersion = "1.3"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForFunction(() => window.__tf && window.__tf().listId); await wait(1800);
    assert.ok(!(await whoseOpen(t.page)), "no question"); assert.equal((await t.s()).origin, "mine");
    assert.deepEqual(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.map(l => l.origin)), ["mine", "mine"], "every existing list is mine");
    assert.ok(await t.page.locator("#whatsnew").isVisible(), "the toast"); assert.ok(/New in 1\.8: A little something for someone in particular\./.test(await t.page.textContent("#wn-msg")), await t.page.textContent("#wn-msg"));
    assert.ok(await t.page.$eval("#shared", e => e.hidden)); assert.equal(await t.page.locator("dialog[open]").count(), 0, "nothing else");
    await t.page.click("#wn-x"); await wait(200); await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); assert.equal(await t.page.locator("#lists-menu .group-h").count(), 0, "no groups until something is shared");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": the Home Screen name is Today's Five (the apple title, the manifest's name and short_name); the save sheet's phone steps cover every iOS 26 Safari layout — Share may sit behind ⋯ — and other phones get their browser's menu", async () => {
    const t = await fresh(opts, { init: IPHONE, list: false }); await t.page.waitForSelector("#welcome:not([hidden])");
    assert.equal(await t.page.$eval('meta[name="apple-mobile-web-app-title"]', e => e.content), "Today's Five");
    const boot = await t.page.$$eval("script:not([src])", els => els.map(e => e.textContent).join("\n"));
    assert.ok(/name: "Today's Five"/.test(boot) && /short_name: "Today's Five"/.test(boot), "the manifest the boot script builds names the app in full"); assert.ok((await t.page.$eval('link[rel="manifest"]', e => e.href)).startsWith("blob:"));
    await t.press("#w-skip"); await t.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await wait(300);
    if (touch) {
      assert.ok(!(await t.page.$eval("#save-steps", e => e.hidden)), "the three steps"); const steps = await t.page.$$eval("#save-steps li", els => els.map(e => e.textContent.replace(/\s+/g, " ").trim()));
      assert.equal(steps.length, 3, steps.join(" | ")); assert.ok(/^Tap Share/.test(steps[0]) && /square with the arrow/.test(steps[0]) && /don't see it, tap\s+first/.test(steps[0]), steps[0]); assert.equal(steps[1], "Scroll down."); assert.ok(/^Add to Home Screen/.test(steps[2]), steps[2]);
      assert.equal(await t.page.$$eval("#save-steps svg.glyph", els => els.length), 2, "the two glyphs, inline"); assert.ok(await t.page.$eval("#save-lead-home-how", e => e.hidden));
      assert.ok(!/Compact|Bottom|Top/.test(await t.page.textContent("#save-lead-home")), "no layout names: the same steps work in all three");
      assert.ok(await t.page.$eval("#save-phone", e => e.hidden) && await t.page.$eval("#save-link", e => e.hidden), "no code, no link field on a phone");
    } else assert.ok(await t.page.$eval("#save-lead-home", e => e.hidden), "a desktop leads with the bookmark");
    await t.close();
    if (touch) {
      const a = await fresh(opts, { init: `Object.defineProperty(navigator, "platform", { get: () => "Linux armv8l" }); Object.defineProperty(navigator, "userAgent", { get: () => "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0 Mobile Safari/537.36" });`, list: false });
      await a.page.waitForSelector("#welcome:not([hidden])"); await a.press("#w-skip"); await a.page.waitForSelector("#p-save[open]", { timeout: 9000 }); await wait(300);
      assert.ok(await a.page.$eval("#save-steps", e => e.hidden), "no iOS steps on another phone"); assert.ok(/browser's menu/.test(await a.page.textContent("#save-lead-home-how")), "its browser's menu"); await a.close();
    }
  });

  await test(label + ": a page open across a deploy — its later modules are asked for by build and the service worker answers from that build's cache, this build's from its own cache first (1.9), an unknown build falls back to the network; the cache holds one copy of each file (1.9); a page whose build cannot be served reloads once after flushing and comes back to its view with the panel it asked for", async () => {
    const t = await fresh(opts, { url: BASE + "?transport=local&sw=1" });
    await t.page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 20000 });
    const build = await t.page.evaluate(() => document.documentElement.getAttribute("data-build"));
    const keys = await t.page.evaluate(() => caches.keys()); assert.ok(keys.includes("tf-v1.8-b" + build), "this build's cache: " + keys.join(","));
    await t.page.evaluate(async () => { const c = await caches.open("tf-v1.3-b62"); await c.put(new Request("./panels.js"), new Response("// build 62's panels", { headers: { "Content-Type": "text/javascript" } })); });
    assert.equal((await t.page.evaluate(async () => (await fetch("panels.js?v=62")).text())).trim(), "// build 62's panels", "a page from build 62 gets build 62's module");
    assert.ok(/PANELS_BUILD = /.test(await t.page.evaluate(async b => (await fetch("panels.js?v=" + b)).text(), build)), "this build's module is served");
    // 1.9 (proposal 14): the page's own build is answered from this build's cache first — a marker planted there is what comes back, no network
    await t.page.evaluate(async b => { const c = await caches.open("tf-v1.8-b" + b); await c.put(new Request("./exporter.js"), new Response("// this build's cached exporter", { headers: { "Content-Type": "text/javascript" } })); }, build);
    assert.equal((await t.page.evaluate(async b => (await fetch("exporter.js?v=" + b)).text(), build)).trim(), "// this build's cached exporter", "cache-first for the page's own build");
    assert.ok(/handOff/.test(await t.page.evaluate(async () => (await fetch("exporter.js")).text())), "the plain name is still network-first (the shell)");
    // 1.9 (proposal 15): one copy of each file — no bare ./ beside index.html, no ?v= keys beside the plain names, the navigation keyed as index.html
    await t.page.evaluate(async b => { await fetch("panels.js?v=" + b); await fetch("qr.js?v=" + b); }, build); await wait(300);
    const urls = await t.page.evaluate(async b => (await (await caches.open("tf-v1.8-b" + b)).keys()).map(r => r.url), build);
    assert.ok(!urls.some(u => u.endsWith("/")), "no bare ./ entry: " + urls.filter(u => u.endsWith("/")).join(","));
    assert.ok(!urls.some(u => /\?v=/.test(u)), "no ?v= entries: " + urls.filter(u => /\?v=/.test(u)).join(","));
    assert.ok(urls.some(u => u.endsWith("/index.html")) && !urls.some(u => /transport=local/.test(u)), "the navigation is keyed as index.html, without its query: " + urls.filter(u => /index|transport/.test(u)).join(","));
    assert.equal(new Set(urls).size, urls.length, "no duplicate urls");
    assert.ok(/PANELS_BUILD = /.test(await t.page.evaluate(async () => (await fetch("panels.js?v=9999")).text())), "a build with no cache falls back to the network");
    assert.ok(/panels\.js\?v=" \+ BUILD/.test(await t.page.evaluate(async () => (await fetch("app.js")).text())), "app.js asks for the panels by build");
    for (const f of ["sound.js", "sync.js", "panels.js"]) assert.ok(/\?v=" \+ (BUILD|PANELS_BUILD)/.test(await t.page.evaluate(async f => (await fetch(f)).text(), f)), f + " asks by build");
    // the reload path
    await t.page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); if (r) await r.unregister(); });
    await t.page.goto(BASE + "?transport=local"); await t.page.waitForSelector("#list .row"); await wait(400);
    // 1.7: the panels warm on the first gesture, so a stale build is caught there: the guard reloads once and comes back to the view it had
    await t.page.evaluate(() => document.documentElement.setAttribute("data-build", "62"));
    const loaded = t.page.waitForEvent("load", { timeout: 8000 });
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])");
    await loaded; await t.page.waitForFunction(() => window.__tf && window.__tf().listId, null, { timeout: 9000 }); await wait(400);
    assert.equal((await t.s()).view, "all", "back on the view it had");
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await t.press('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(200);
    assert.equal((await t.s()).panel, "p-settings", "and a panel opens whole on the new page");
    assert.ok(!/Couldn't load/.test(await t.page.textContent("#toast")), "no failure toast"); assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.page.keyboard.press("Escape"); await wait(200); await t.close();
  });

  await test(label + ": 1.9: a page another site has framed leaves the frame (the boot script's framebust, hashed in the CSP)", async () => {
    const t = await fresh(opts, { list: false, url: BASE + "tools/og.html" }); // any same-origin page to host a frame; the app's boot script does the rest
    await t.page.evaluate(base => { document.body.innerHTML = ""; const f = document.createElement("iframe"); f.src = base + "?transport=local"; f.width = 600; f.height = 400; document.body.appendChild(f); }, BASE);
    await t.page.waitForFunction(base => location.href.startsWith(base) && !/og\.html/.test(location.href), BASE, { timeout: 9000 });
    assert.ok(!/og\.html/.test(t.page.url()), "the top navigated to the app: " + t.page.url());
    await t.page.waitForSelector("#welcome:not([hidden])"); assert.equal(t.csp.length, 0, "the boot script's hash is right: " + t.csp.join("; "));
    await t.close();
  });

  await test(label + ": 1.9: a counter appears for the last twenty characters before a cap; Lists rows carry no id fragment", async () => {
    const t = await fresh(opts);
    await t.page.focus("#list .row:first-child .check"); await t.page.keyboard.press("e"); await t.page.waitForSelector("#list .row.editing textarea");
    const set = async (sel, v) => t.page.$eval(sel, (el, v) => { el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); }, v);
    await set("#list .row.editing textarea", "x".repeat(150)); assert.ok(await t.page.$eval(".cap-count", e => e.hidden), "nothing at 150 of 200");
    await set("#list .row.editing textarea", "x".repeat(181)); assert.ok(!(await t.page.$eval(".cap-count", e => e.hidden)), "the counter shows inside the last twenty"); assert.equal(await t.page.textContent(".cap-count"), "181/200");
    await set("#list .row.editing textarea", "x".repeat(200)); assert.equal(await t.page.textContent(".cap-count"), "200/200", "and says the cap when it is reached");
    await t.page.focus("#list .row.editing .note-in"); await wait(50); assert.ok(await t.page.$eval(".cap-count", e => e.hidden), "the note's own count: nothing yet");
    await set("#list .row.editing .note-in", "n".repeat(290)); assert.equal(await t.page.textContent(".cap-count"), "290/300", "the note counts to 300");
    await t.page.keyboard.press("Escape"); await wait(300);
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(200);
    assert.equal(await t.page.locator("#lists-menu .id").count(), 0, "no six characters of the id on a row (proposal 21)");
    assert.equal(await t.page.locator("#lists-menu .row .more").count(), 1, "the › says there is more");
    await t.esc(); assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": no page errors, CSP violations or third-party requests across a full session", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.esc(); await t.press("#v-today");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]');
    await t.page.waitForSelector("#p-theme[open]"); await t.page.click("#sw-night .swatch:nth-child(4)"); await wait(200); await t.page.click("#partner-use"); await t.esc(); await wait(200);
    await t.press("#daynight"); await wait(500); await t.press("#daynight"); await wait(500);
    await t.press("#more"); await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await t.page.click("#share-copy"); await wait(300); await t.esc();
    if (!touch) { await t.press("#share"); await t.page.waitForSelector("#p-share[open]"); await t.esc(); await t.page.keyboard.press("?"); await t.page.waitForSelector("#p-keys[open]"); await t.esc(); await t.page.keyboard.press("f"); await wait(200); await t.page.keyboard.press("f"); }
    await wait(300);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, t.csp.join("; ")); assert.equal(t.thirdParty.length, 0, t.thirdParty.join("; "));
    await t.close();
  });
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length) { console.log(failures.map(f => "  - " + f).join("\n")); process.exit(1); }
