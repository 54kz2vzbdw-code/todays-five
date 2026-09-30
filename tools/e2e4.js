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
const ONLY = process.env.ONLY || ""; // run only the tests whose name contains this (or any of "a||b")
const open = new Set(); // contexts a failed test left behind are closed before the next test runs
const SHARD = (process.env.SHARD || "").split("/").map(Number); let testNo = 0; // SHARD="i/n": every nth test from the ith, so a full run can go in slices
async function test(name, fn) {
  if (ONLY && !ONLY.split("||").some(o => name.includes(o))) return; // "a||b" runs both
  if (SHARD.length === 2 && SHARD[1] > 0 && (testNo++ % SHARD[1]) !== SHARD[0]) return;
  try { await fn(); passed++; console.log("ok -", name); } catch (e) { failed++; failures.push(name + ": " + (e.message || e).split("\n")[0]); console.log("FAIL -", name, "\n    ", (e.message || String(e)).split("\n")[0]); if (process.env.DEBUG && e.stack) console.log("     " + e.stack.split("\n").filter(l => /e2e4/.test(l)).slice(0, 3).join("\n     ")); }
  for (const c of open) { try { await c.close(); } catch (x) { /* already closed */ } }
  open.clear();
}
const assert = { ok(v, m) { if (!v) throw new Error(m || "expected truthy"); }, notEqual(a, b, m) { if (a === b) throw new Error((m || "") + " expected not " + JSON.stringify(b)); }, deepEqual(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || "") + " expected " + JSON.stringify(b) + " got " + JSON.stringify(a)); }, equal(a, b, m) { if (a !== b) throw new Error((m || "") + " expected " + JSON.stringify(b) + " got " + JSON.stringify(a)); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

const VIEWPORTS = [["desktop 1440×900", { viewport: { width: 1440, height: 900 } }, false], ["phone 390×844", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, true]];
async function fresh(opts, { url = BASE + "?transport=local", list = true, ctx: shared = null, scheme = "dark", clock = null, reducedMotion = "no-preference", init = "", pinSlots = true } = {}) {
  // a second "device" on the local transport is a second tab of the same context: the local server lives in localStorage.
  // The system is dark unless a test says otherwise (1.2 starts a fresh device With the system); `clock` installs a fake one.
  const ctx = shared || await browser.newContext({ ...opts, colorScheme: scheme, reducedMotion });
  open.add(ctx);
  /* 1.11 moved the default pair from Light/Dark to Paper/Terminal. Most of what follows is about the
     *switch* — the crossfade, With the system, the schedule, the hold, the picker, the sound row —
     and not about which pair a brand-new device is handed, so `fresh()` pins the pair those tests
     were written against and they go on testing what they were written to test. It only seeds a
     context that has no meta of its own, so a test that writes its own device (the migrations, the
     1.3/1.9 devices) is untouched, on its first load and on every reload. The two places that *are*
     about the default pass `pinSlots: false` and assert SLOT_DEFAULT itself. */
  // `switch` has to be in there too: migrateSlots() only leaves the slots alone when the device
  // already carries a valid switch, and a fresh one without it is rewritten to SLOT_DEFAULT. And the
  // pin stands down whenever a test seeds its own device through `init`, so it can never clobber one.
  const pin = (pinSlots && !init) ? `try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: { day: "T1:curated:light", night: "T1:curated:dark", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" } } })); } catch (e) {}\n` : "";
  if ((init || pin) && !shared) await ctx.addInitScript(pin + init);
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
  /** 1.12 b293: a view transition (the tabs' zoom, a theme's reveal) takes no input while it runs, and a person does not
      tap faster than one ends; the suite does, so a press, a hold and a stroke wait for one to be over first */
  const settled = () => page.waitForFunction(() => !/\bvt-/.test(document.documentElement.className), null, { timeout: 3000 }).catch(() => {});
  const press = async sel => {
    await page.bringToFront(); await settled();
    // the one-time iOS install hint sits over the footer; a person would dismiss it, so does the suite
    const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(150); }
    const h = await page.$(sel); if (!h) throw new Error("no " + sel); if (opts.hasTouch) await h.tap(); else { await h.hover(); await h.click(); }
    await settled();
  };
  /** a finger held on an element (CDP touch) for `ms`, then lifted; returns the test hook's state mid-hold */
  const hold = async (sel, ms = 650, dx = 0) => {
    await settled();
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
  /** 1.12 b279: a strike drawn by hand across a line's words to `frac` of their width (1 = a little past the end) —
      a finger on the phone (CDP touch, 16 ms steps), the mouse on the desktop. `mid` runs while the finger is still down
      (a screenshot, a read of the ink), so a test can see the stroke before it lands. */
  const draw = async (sel, frac = 1, { steps = 18, mid = null } = {}) => {
    await settled();
    const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(150); }
    const el = await page.$(sel + " .tx"); if (!el) throw new Error("no " + sel); const b = await el.boundingBox();
    const y = b.y + Math.min(b.height, 30) / 2, x0 = b.x + 4, x1 = b.x + 4 + (b.width + 16) * frac;
    if (opts.hasTouch) {
      const cdp = await ctx.newCDPSession(page);
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
      for (let i = 1; i <= steps; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y }] }); await wait(16); }
      if (mid) await mid();
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach();
    } else {
      await page.mouse.move(x0, y); await page.mouse.down();
      for (let i = 1; i <= steps; i++) { await page.mouse.move(x0 + (x1 - x0) * i / steps, y); await wait(16); }
      if (mid) await mid();
      await page.mouse.up();
    }
    await wait(80);
  };
  /** the line's menu: ⋯ on hover on the desktop, a hold on the phone (Edit is its first row) */
  const lineMenu = async rowSel => { if (opts.hasTouch) await hold(rowSel + " .tx"); else { await page.hover(rowSel + " .tx"); await wait(120); await page.click(rowSel + " .tool.lmenu"); } await page.waitForSelector("#p-line[open]"); };
  const away = async () => { await page.mouse.move(2, 2); await wait(350); };
  /** the row tools a person can see: rendered, opaque, not clipped away */
  const visibleTools = (scope = "") => page.$$eval(scope + " .row .tool", els => els.filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 2 && cs.opacity !== "0" && cs.visibility !== "hidden" && cs.display !== "none"; }).map(e => e.className.replace("tool ", "")));
  const front = () => page.bringToFront();
  return { ctx, page, errors, csp, thirdParty, consoleErrors, s, press, hold, draw, lineMenu, away, visibleTools, front, esc, reload, close: () => shared ? page.close() : ctx.close() };
}
const rect = (page, sel) => page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; });
const { seedScript } = await import("./audit/harness.mjs"); // 1.7: the long-time fixture (four lists, repeats, history, saved themes)
const seedLines = JSON.parse(fs.readFileSync(new URL("../model.js", import.meta.url), "utf8").match(/SEED_LINES = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));

for (const [label, opts, touch] of VIEWPORTS) {
  console.log("\n==", label);
  /** 1.12 b309: Settings → Sound is a page — the slot on a small switch, the packs as rows; read one slot's rows the way
      1.9's picker named its options ("Theme's pick (Knock)", "Knock", …) and come back */
  const packOptions = async (t, slot = "day") => { await t.page.click('#p-settings [data-set="sound"]'); await t.page.waitForSelector("#p-sound[open]"); await wait(250); await t.page.click(`#snd-slot [data-slot="${slot}"]`); await wait(150); const v = await t.page.$$eval("#snd-packs button .lb", els => els.map(e => e.firstChild.textContent + (e.querySelector(".sub") ? " (" + e.querySelector(".sub").textContent + ")" : ""))); await t.page.click("#p-sound h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250); return v; };
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
    assert.equal(await t.page.locator("#lists-menu .group-h").count(), 2, "My lists and Shared with me"); assert.equal(await t.page.locator("#lists-menu .row").count(), 3, "1.12: the one an older build had archived was finished on read, not listed under a Removed group");
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
    await t.esc(); // 1.12: the ⋯ menu sits under the stack, so closing it takes more than one Escape
    // a theme of one's own, then its ×
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]");
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
    const rings = async sels => { for (const sel of sels) {
      const el = await t.page.$(sel); if (!el) continue;
      await t.page.evaluate(s => document.querySelector(s).focus({ focusVisible: true }), sel);
      const ring = await t.page.$eval(sel, e => e.matches(":focus-visible") ? getComputedStyle(e).outlineColor : "not focus-visible");
      if (ring !== "not focus-visible") assert.equal(hex(ring), accent.toUpperCase(), sel + " ring is the accent, not the browser's: " + ring);
    } };
    await rings(['#p-settings [data-set="appearance"]', '#p-settings [data-set="sound"]', "#menu-about"]);
    if (opts.hasTouch) { for (const sel of ['#p-settings [data-set="appearance"]', '#p-settings [data-set="sound"]', '#p-settings [data-set="export"]']) assert.ok((await t.page.$eval(sel, e => e.getBoundingClientRect().height)) >= 44, sel + " is 44 px on touch"); }
    // 1.12 b309: the volume and the slot switch live on the Sound page; the Appearance switch on its own
    await t.page.click('#p-settings [data-set="sound"]'); await t.page.waitForSelector("#p-sound[open]"); await wait(250);
    if (opts.hasTouch) { await t.page.hover("#p-sound label.item"); await wait(150); assert.equal(await t.page.$eval("#p-sound label.item", e => getComputedStyle(e).backgroundColor), "rgba(0, 0, 0, 0)", "a row fills under a resting pointer only where a pointer can hover: on a phone the fill stuck under the finger when a page opened there"); }
    await rings(["#volume", '#snd-slot [aria-checked="true"]', '#snd-packs [aria-checked="true"]']);
    if (opts.hasTouch) { for (const sel of ["#volume", '#snd-slot [aria-checked="true"]', '#snd-packs [aria-checked="true"]']) assert.ok((await t.page.$eval(sel, e => e.getBoundingClientRect().height)) >= 44, sel + " is 44 px on touch"); }
    await t.page.click("#p-sound h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250);
    await t.page.click('#p-settings [data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(250);
    await rings(['#ap-switch [aria-checked="true"]', '#p-appear .slot[data-slot="day"]', "#ap-pairs-go"]);
    if (opts.hasTouch) { for (const sel of ['#ap-switch [aria-checked="true"]', "#ap-pairs-go", "#ap-build"]) assert.ok((await t.page.$eval(sel, e => e.getBoundingClientRect().height)) >= 44, sel + " is 44 px on touch"); }
    await t.page.click("#p-appear h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250);
    assert.equal(await t.page.$eval("#set-addurl-copy", e => getComputedStyle(e).textTransform), "uppercase", "a chip outside a row of actions carries the chip type");
    { // 1.9: the panel's title is a step above its section headings (proposal 24)
      const h2 = await t.page.$eval("#p-settings h2", e => parseFloat(getComputedStyle(e).fontSize)), h3 = await t.page.$eval("#p-settings h3", e => parseFloat(getComputedStyle(e).fontSize));
      assert.ok(h2 >= h3 + 1.5, "the title a step above its headings: " + h2 + " vs " + h3);
    }
    if (!opts.hasTouch) { // 1.9: one hover treatment — the × fills the way a menu row does (proposal 25)
      const ink3 = (await t.page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ink-3").trim())).toUpperCase();
      await t.page.hover('#p-settings [data-set="sound"]'); await wait(200);
      assert.equal(hex(await t.page.$eval('#p-settings [data-set="sound"]', e => getComputedStyle(e).backgroundColor)), ink3, "a menu row fills");
      await t.page.hover("#p-settings h2 .x"); await wait(200);
      assert.equal(hex(await t.page.$eval("#p-settings h2 .x", e => getComputedStyle(e).backgroundColor)), ink3, "the × fills the same way");
      assert.equal(await t.page.$eval("#p-settings h2 .x", e => getComputedStyle(e).borderTopColor.replace(/\s/g, "")), "rgba(0,0,0,0)", "and draws no border");
    }
    await t.esc(); await wait(200);
    // the builder: the Dark | Light control and Import keep their own width
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(200);
    if (!opts.hasTouch) { await t.page.hover("#p-theme .swatch"); await wait(250); const lift = await t.page.$eval("#p-theme .swatch", e => parseFloat(getComputedStyle(e, "::after").opacity)); assert.ok(lift > 0 && lift < 0.3, "1.9: a swatch lifts its fill on hover, not only its edge: " + lift); }
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
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(200);
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
    const items = await t.page.$$eval(".rail-l > *, .rail-r > :not(.tools), .rail-r .tools > *", els => els.filter(e => !e.hidden && getComputedStyle(e).display !== "none").map(e => e.id || e.className));
    assert.equal(items.join(" "), touch ? "status seg daynight more" : "date status seg daynight share more", items.join(" "));
    const dn = await t.page.$eval("#daynight", e => ({ next: e.dataset.next, title: e.title, w: e.getBoundingClientRect().width, h: e.getBoundingClientRect().height }));
    assert.equal(dn.next, "day", "a dark system: Night is on, so the tap goes to Day: " + JSON.stringify(dn)); assert.equal(dn.title, "Day · T"); assert.ok(dn.w >= 30 && dn.h >= 32, "a real target: " + JSON.stringify(dn)); if (touch) assert.ok(dn.w >= 44 && dn.h >= 44, "44 px on touch");
    const dot = await t.page.$eval("#dot", e => ({ size: getComputedStyle(e, "::before").width, bg: getComputedStyle(e).backgroundColor, border: getComputedStyle(e).borderTopWidth }));
    assert.equal(dot.size, "6px", "6 px sync dot"); assert.ok(dot.bg === "rgba(0, 0, 0, 0)" && dot.border === "0px", "no pill around the dot: " + JSON.stringify(dot));
    assert.equal(await t.page.locator("#theme, #mute, #full").count(), 0, "theme, sound and full-screen chips are gone from the rail; the sun/moon is the one chip 1.2 added");
    await t.close();
  });

  await test(label + ": 1.12 b315: the ⋯ menu is four tiles, then four rows, then Delete everywhere on its own, " + (touch ? "a bottom sheet" : "a popover under the button") + ", and the Sound tile toggles in place", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await wait(300);
    await t.page.waitForFunction(() => !document.getElementById("p-menu").getAnimations({ subtree: true }).length); // 1.12 b293: it rises (or grows out of ⋯) first
    const tiles = await t.page.$$eval("#menu-tiles > *:not([hidden]) .lb", els => els.map(e => e.textContent.trim()));
    assert.equal(tiles.join("|"), "Share|Theme|Sound|Full screen", "the four reached for most, as tiles");
    const rows = await t.page.$$eval("#menu > *:not([hidden]) .lb", els => els.map(e => e.textContent.trim()));
    assert.equal(rows.join("|"), "Lists|Settings|How it works|About & privacy", "the places, as rows");
    assert.ok(await t.page.$("#menu-end #menu-delete.danger") && await t.page.locator("#menu-delete").isVisible(), "Delete everywhere, on a card of its own");
    assert.equal(await t.page.getAttribute("#menu-share", "aria-label"), "Share this list", "the tile says Share; its name says which");
    const tr = await t.page.$$eval("#menu-tiles > *:not([hidden])", els => els.map(e => e.getBoundingClientRect()).map(r => ({ top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) })));
    assert.ok(tr.every(r => r.top === tr[0].top && Math.abs(r.w - tr[0].w) <= 1 && r.h >= 44), "one row of equal tiles, each a real target: " + JSON.stringify(tr));
    const d = await rect(t.page, "#p-menu"), more = await rect(t.page, "#more");
    const pop = await t.page.$eval("#p-menu", e => e.classList.contains("pop"));
    if (touch) { assert.ok(!pop, "a sheet on the phone"); assert.ok(Math.abs(d.bottom - opts.viewport.height) < 2 && d.width >= opts.viewport.width - 1, "bottom sheet: " + JSON.stringify(d)); }
    else { assert.ok(pop, "a popover on the desktop"); assert.ok(d.top >= more.bottom && d.top < more.bottom + 20 && Math.abs(d.right - more.right) < 4, "anchored under ⋯: " + JSON.stringify({ d, more })); assert.equal(await t.page.$eval("#p-menu", e => getComputedStyle(e, "::backdrop").backgroundColor), "rgba(0, 0, 0, 0)", "no dim behind a popover"); }
    assert.equal(await t.page.textContent("#menu-theme-k"), "Dark");
    await t.press('#p-menu [data-act="sound"]'); await wait(200);
    assert.ok(await t.page.$("#p-menu[open]"), "the menu stays open for a toggle"); assert.equal(await t.page.textContent("#menu-sound-k"), "Off");
    assert.ok(await t.page.locator('#menu-tiles [data-act="sound"] .off-ic').isVisible() && await t.page.locator('#menu-tiles [data-act="sound"] .on-ic').isHidden(), "the tile shows the speaker muted");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.muted), true);
    await t.press('#p-menu [data-act="sound"]'); assert.equal(await t.page.textContent("#menu-sound-k"), "On");
    await t.esc(); await wait(200);
    if (!touch) { await t.page.keyboard.press("m"); assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.muted), true, "M still mutes"); await t.page.keyboard.press("m"); const s0 = (await t.s()).slot; await t.page.keyboard.press("t"); await wait(600); assert.notEqual((await t.s()).slot, s0, "T flips Day and Night"); assert.equal(await t.page.locator("#p-theme[open]").count(), 0, "and opens nothing"); await t.page.keyboard.press("t"); await wait(600); }
    await t.close();
  });

  await test(label + ": 1.10 + 1.12 b279: the six moments the iPhone shell listens for fire, once each and in order, and nothing about them shows on the web", async () => {
    const t = await fresh(opts);
    // The shell hears these through a WKUserScript in a client content world; here the page listens
    // to itself, which is the same contract (COMPATIBILITY.md §8) seen from the other side.
    await t.page.evaluate(() => {
      window.__moments = [];
      for (const n of ["tf:check", "tf:uncheck", "tf:finale", "tf:shuffle", "tf:draw", "tf:lift"]) {
        addEventListener(n, e => window.__moments.push([n, e.detail === null]));
      }
    });
    const seen = () => t.page.evaluate(() => window.__moments.map(m => m[0]));

    // a done line sinks, so the row is held by its id rather than by its position
    const firstId = await t.page.$eval("#list .row", e => e.dataset.id);
    await t.press(`#list .row[data-id="${firstId}"] .tx`); await wait(450);
    assert.deepEqual(await seen(), ["tf:check"], "a check-off says so");
    await t.press(`#list .row[data-id="${firstId}"] .tx`); await wait(450);
    assert.deepEqual(await seen(), ["tf:check", "tf:uncheck"], "and taking it back says so");

    // 1.12 b279: a strike drawn by hand is tf:draw, tf:lift, tf:check, in that order — the shell's scratch stops before
    // the knock — and the two taps above sent neither of the first two
    const drawId = await t.page.$eval("#list .row:not(.done)", e => e.dataset.id);
    await t.draw(`#list .row[data-id="${drawId}"]`, 1); await wait(450);
    assert.deepEqual(await seen(), ["tf:check", "tf:uncheck", "tf:draw", "tf:lift", "tf:check"], "a drawn strike says when it starts and ends, then checks off");
    await t.press(`#list .row[data-id="${drawId}"] .tx`); await wait(450); // back, so the finale below still has every line to do

    // shuffle: the page ticks for it today through the hidden switch, and the shell must not lose it
    if (touch) await t.page.tap("#count"); else await t.page.keyboard.press("o");
    await wait(400);
    const beforeShuffle = (await seen()).length;
    if (touch) await t.page.tap("#shuffle"); else await t.page.keyboard.press("s");
    await wait(500);
    const afterShuffle = await seen();
    assert.equal(afterShuffle.length, beforeShuffle + 1, "shuffle says so once: " + afterShuffle.join(" "));
    assert.equal(afterShuffle[afterShuffle.length - 1], "tf:shuffle");
    if (touch) await t.page.tap("#count"); else await t.page.keyboard.press("o");
    await wait(400);

    // the last line of the day: one finale, not one per line
    for (let i = 0; i < 5; i++) {
      if (!(await t.page.locator("#list .row:not(.done)").count())) break;
      await t.press("#list .row:not(.done) .tx");
      await wait(450);
    }
    await wait(700);
    const afterAll = await seen();
    assert.equal(afterAll.filter(n => n === "tf:finale").length, 1, "one finale for the last line: " + afterAll.join(" "));
    assert.equal(await t.page.locator("#list .row:not(.done)").count(), 0, "every line is done");

    // nothing that identifies a list rides along, and the web itself has not moved
    assert.ok(await t.page.evaluate(() => window.__moments.every(m => m[1])), "no detail on any of them (a CustomEvent with none carries null)");
    assert.equal(await t.page.evaluate(() => / TodaysFive\//.test(navigator.userAgent)), false, "a browser is not the shell");
    assert.equal(await t.page.evaluate(() => matchMedia("(display-mode: standalone)").matches), false, "and is not standalone");
    assert.equal(await t.page.locator("#haptic").count(), 1, "the hidden switch is still there for Safari");
    assert.equal(t.errors.length, 0, "page errors: " + t.errors);
    await t.close();
  });

  /* ---------------- 1.12 b279: the strike drawn by hand ---------------- */
  const pinKit = (kit, extra = "") => `try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: { day: "T1:curated:${kit}", night: "T1:curated:${kit}", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }${extra} } })); } catch (e) {}`;
  const isDone = (t, id) => t.page.$eval(`.row[data-id="${id}"]`, e => e.classList.contains("done"));
  /** how far each line's ink is drawn right now, read off the inline style motion.js writes while a finger is down */
  const drawnTo = (t, sel) => t.page.$$eval(sel + " .lines .ink", els => els.map(e => { const s = e.style, c = /inset\(\S+ ([\d.]+)%/.exec(s.clipPath || ""), m = /scaleX\(([\d.]+)\)/.exec(s.transform || ""); return c ? 1 - c[1] / 100 : m ? +m[1] : 0; }));
  const clean = (t, sel) => t.page.$$eval(sel + " .lines .ink", els => els.every(e => !/transform|clip-path|opacity|transition|--hot|--tip/.test(e.getAttribute("style") || "")));

  await test(label + ": 1.12 b279: a strike drawn " + (touch ? "by a finger" : "with the mouse") + " past 55 % crosses the line off; one at 40 % pulls back and writes nothing; a quick short flick writes nothing; none of them opens the menu", async () => {
    const t = await fresh(opts); await wait(900); // motion.js arrives at idle
    const id = await t.page.$eval("#list .row:not(.done)", e => e.dataset.id), sel = `#list .row[data-id="${id}"]`;
    const before = (await t.s()).stats.check;
    await t.draw(sel, 0.4); await wait(500);
    assert.equal(await isDone(t, id), false, "40 % pulls back");
    assert.ok(await clean(t, sel), "and leaves no ink behind");
    await t.draw(sel, 0.3, { steps: 3 }); await wait(500);
    assert.equal(await isDone(t, id), false, "a quick short flick is not a commit: distance, never speed");
    assert.equal((await t.s()).stats.check, before, "and neither made the check-off sound");
    await t.draw(sel, 1); await wait(600);
    assert.equal(await isDone(t, id), true, "past 55 % it lands");
    assert.equal((await t.s()).stats.check, before + 1, "one check-off, with its sound");
    assert.equal(await t.page.locator("#p-line[open]").count(), 0, "and no menu");
    assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
    await t.close();
  });

  if (touch) await test(label + ": 1.12 b279: a line that wraps is struck as one stroke in reading order — the first line full before the next begins — drawn or tapped, and unchecking unwinds it from the last line", async () => {
    const t = await fresh(opts, { init: pinKit("terminal") }); await wait(900); // a mono face at 390 wraps the second seed line
    const id = await t.page.evaluate(() => { const r = [...document.querySelectorAll("#list .row:not(.done)")].find(r => r.querySelectorAll(".lines .ink").length > 1); return r ? r.dataset.id : null; });
    assert.ok(id, "a seed line wraps on a phone");
    const sel = `#list .row[data-id="${id}"]`;
    let mid = null;
    await t.draw(sel, 0.45, { mid: async () => { mid = await drawnTo(t, sel); } }); // short of the 55 % that would land it
    const say = mid.map(v => v.toFixed(2)).join(" ");
    for (let i = 1; i < mid.length; i++) if (mid[i] > 0.001) assert.ok(mid[i - 1] > 0.99, "line " + (i + 1) + " began before line " + i + " was done: " + say);
    assert.ok(mid[0] > 0.55, "under halfway through the stroke the first line is well along: " + say);
    await wait(700);
    assert.equal(await isDone(t, id), false, "that stroke was short and pulled back");
    await t.press(sel + " .tx"); await wait(600);
    const on = await t.page.$$eval(sel + " .lines .ink", els => els.map(e => { const c = getComputedStyle(e); return { d: parseFloat(c.transitionDelay), t: parseFloat(c.transitionDuration) }; }));
    for (let i = 1; i < on.length; i++) assert.ok(Math.abs(on[i].d - (on[i - 1].d + on[i - 1].t)) < 0.002, "a tap: line " + (i + 1) + " starts as line " + i + " ends: " + JSON.stringify(on));
    assert.ok(on.reduce((a, x) => Math.max(a, x.d + x.t), 0) <= 0.3201, "and the whole stroke lands inside .32 s: " + JSON.stringify(on));
    await t.press(sel + " .tx"); await wait(600);
    const off = await t.page.$$eval(sel + " .lines .ink", els => els.map(e => parseFloat(getComputedStyle(e).transitionDelay)));
    assert.equal(off[off.length - 1], 0, "unchecking starts with the last line: " + off);
    for (let i = 0; i < off.length - 1; i++) assert.ok(off[i] > off[i + 1], "and unwinds towards the first: " + off);
    assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
    await t.close();
  });

  await test(label + ": 1.12 b279: a strike drawn by hand lands exactly where a tap's does — the same computed ink, nothing inline left behind — and a done line does not draw", async () => {
    const t = await fresh(opts); await wait(900);
    const ids = await t.page.$$eval("#list .row:not(.done)", els => els.map(e => e.dataset.id));
    await t.press(`#list .row[data-id="${ids[0]}"] .tx`); await wait(700);
    await t.draw(`#list .row[data-id="${ids[1]}"]`, 1); await wait(1500); // past the landing and the cooling
    const look = id => t.page.$eval(`.row[data-id="${id}"] .lines .ink`, e => { const c = getComputedStyle(e); return [c.transform, c.clipPath, c.opacity, c.backgroundImage, c.boxShadow, c.height].join(" | "); });
    assert.equal(await look(ids[1]), await look(ids[0]), "the same computed ink as a tap");
    assert.ok(await clean(t, `.row[data-id="${ids[1]}"]`), "nothing inline left");
    assert.equal(await t.page.$eval(`.row[data-id="${ids[1]}"]`, e => e.classList.contains("drawing") || e.classList.contains("cooling")), false, "no drawing class left");
    await t.page.evaluate(() => { window.__m = []; for (const n of ["tf:draw", "tf:lift", "tf:uncheck"]) addEventListener(n, () => window.__m.push(n)); });
    await t.draw(`.row[data-id="${ids[1]}"]`, 1); await wait(500);
    assert.equal(await isDone(t, ids[1]), true, "a done line stays done");
    assert.deepEqual(await t.page.evaluate(() => window.__m), [], "and a drag across it says nothing to the shell");
    assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
    await t.close();
  });

  if (touch) await test(label + ": 1.12 b279: a textured ink is revealed by a clip while it is drawn, never squashed, and held visible — Pink's gradient, Chalkboard's chalk", async () => {
    for (const [kit, extra] of [["pink", ""], ["chalkboard", ', extras: ["chalk"]']]) {
      const t = await fresh(opts, { init: pinKit(kit, extra) }); await wait(900);
      assert.equal((await t.s()).theme, kit);
      const sel = `#list .row[data-id="${await t.page.$eval("#list .row:not(.done)", e => e.dataset.id)}"]`;
      let mid = null;
      await t.draw(sel, 0.5, { mid: async () => { mid = await t.page.$eval(sel + " .lines .ink", e => ({ clip: e.style.clipPath, transform: e.style.transform, opacity: getComputedStyle(e).opacity })); } });
      assert.ok(/inset/.test(mid.clip) && /scaleX\(1\)/.test(mid.transform), kit + ": clipped, not scaled: " + JSON.stringify(mid));
      assert.equal(mid.opacity, "1", kit + ": held visible while it is drawn");
      assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
      await t.close();
    }
  });

  if (touch) await test(label + ": 1.12 b279: a device that knew the old swipe-right menu is told once, on its first drawn strike, that a swipe crosses off now — and a new device is not told at all", async () => {
    let t = await fresh(opts, { init: pinKit("light", ", hints: { today: true, drag: true, menu: true }") }); await wait(900);
    const ids = await t.page.$$eval("#list .row:not(.done)", els => els.map(e => e.dataset.id));
    await t.draw(`#list .row[data-id="${ids[0]}"]`, 1); await wait(500);
    assert.equal((await t.s()).mark, "draw", "the hint is on screen");
    assert.equal((await t.page.textContent("#mark-text")).trim(), "A swipe across a line crosses it off now—hold it for the menu.");
    assert.equal((await t.s()).hints.draw, true, "and marked as shown");
    await t.draw(`#list .row[data-id="${ids[1]}"]`, 1); await wait(500);
    assert.notEqual((await t.s()).mark, "draw", "once only");
    await t.close();
    t = await fresh(opts); await wait(900);
    await t.draw(`#list .row[data-id="${await t.page.$eval("#list .row:not(.done)", e => e.dataset.id)}"]`, 1); await wait(500);
    assert.notEqual((await t.s()).mark, "draw", "a device that never had the old menu hint is not told");
    await t.close();
  });

  await test(label + ": 1.12 b279: under reduced motion the ink still follows the finger, and the landing is instant", async () => {
    const t = await fresh(opts, { reducedMotion: "reduce" }); await wait(900);
    const id = await t.page.$eval("#list .row:not(.done)", e => e.dataset.id), sel = `#list .row[data-id="${id}"]`;
    let mid = null;
    await t.draw(sel, 1, { mid: async () => { mid = await drawnTo(t, sel); } });
    assert.ok(mid.some(v => v > 0.5), "the ink followed the " + (touch ? "finger" : "mouse") + ": " + mid);
    assert.equal(await t.page.$$eval(sel + " .lines .ink", els => els.reduce((n, e) => n + e.getAnimations().length, 0)), 0, "nothing animating once it is up");
    assert.equal(await isDone(t, id), true);
    assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
    await t.close();
  });

  /* ---------------- 1.12 b293: each kit ends its own way ---------------- */
  await test(label + ": 1.12 b293: each curated kit ends its own way — the line lands as plain text, Arcade's reads Level clear., nothing errors — and on a phone a finale card that wraps lifts the toast clear of it", async () => {
    for (const kit of ["paper", "terminal", "arcade", "midnight", "ember"]) {
      const t = await fresh(opts, { init: pinKit(kit) }); await wait(1300); // finale.js arrives at idle
      for (let k = 0; k < 2; k++) { await t.press("#list .row:not(.done) .tx"); await wait(650); }
      const before = (await t.s()).stats.volley;
      await t.press("#list .row:not(.done) .tx"); await wait(900);
      assert.ok(await t.page.$eval("#finale", e => e.classList.contains("on")), kit + ": the finale is up");
      assert.equal((await t.s()).stats.volley, before + 1, kit + ": one finale, counted as the volley it replaces");
      if (touch && kit === "terminal") {
        const toast = await rect(t.page, "#toast"), line = await rect(t.page, "#finale span");
        assert.ok(toast.bottom <= line.top + 2, "the toast sits clear of a wrapped card: " + JSON.stringify({ toast, line }));
      }
      await wait(2600); // past the typing, the caret's three blinks and the swash
      const line = await t.page.$eval("#finale span", e => ({ text: e.textContent, spans: e.querySelectorAll("span").length }));
      assert.equal(line.text, kit === "arcade" ? "Level clear." : "That's the list.", kit + ": its line");
      assert.equal(line.spans, 0, kit + ": plain text again once it has landed");
      assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
      await t.close();
    }
    const t = await fresh(opts, { init: pinKit("paper"), reducedMotion: "reduce" }); await wait(1300);
    for (let k = 0; k < 3; k++) { await t.press("#list .row:not(.done) .tx"); await wait(650); }
    assert.equal(await t.page.$eval("#finale span", e => e.querySelectorAll("span, svg").length), 0, "under reduced motion the card is the quiet card it always was");
    await t.close();
  });

  await test(label + ": 1.12 b307: a finale started again before the last one has landed — check, uncheck, check inside a second — still reads its line once, in Dark, Terminal and Paper", async () => {
    for (const kit of ["dark", "terminal", "paper"]) {
      const t = await fresh(opts, { init: pinKit(kit) }); await wait(1300); // finale.js arrives at idle
      for (let k = 0; k < 2; k++) { await t.press("#list .row:not(.done) .tx"); await wait(650); }
      await t.press("#list .row:not(.done) .tx"); await wait(520); // the finale is 300 ms after the check: its letters are mid-flight
      await t.press("#list .row.done .tx"); await wait(150); await t.press("#list .row:not(.done) .tx");
      await wait(3000); // past both finales, the caret's blinks and the swash
      const line = await t.page.$eval("#finale span", e => ({ text: e.textContent, spans: e.querySelectorAll("span").length }));
      assert.deepEqual(line, { text: "That's the list.", spans: 0 }, kit + ": the line once, as plain text");
      assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
      await t.close();
    }
  });

  /* ---------------- 1.12 b293: the materials, the menus, the unseal ---------------- */
  const cls = (t, c) => t.page.evaluate(c => document.documentElement.classList.contains(c), c);
  const clear = t => assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
  await test(label + ": 1.12 b293: each kit carries its material — html[data-mat] follows the theme — and strikes in its own hand: Paper's pen is a hair off level, Arcade's ink is square, Sketch's is a scribble revealed by a clip", async () => {
    for (const [kit, mat] of [["paper", "ink"], ["arcade", "pixel"], ["sketch", "pencil"], ["terminal", "phosphor"], ["light", "clean"]]) {
      const t = await fresh(opts, { init: pinKit(kit) }); await wait(900);
      assert.equal(await t.page.evaluate(() => document.documentElement.dataset.mat), mat, kit + "'s material");
      await t.press("#list .row:not(.done) .tx"); await wait(700);
      const ink = await t.page.$eval("#list .row.done .lines .ink", e => { const cs = getComputedStyle(e); return { scr: e.classList.contains("scr"), svg: !!e.querySelector("svg path"), clip: cs.clipPath, radius: cs.borderTopLeftRadius, rotate: cs.rotate }; });
      if (kit === "sketch") { assert.ok(ink.scr && ink.svg, "a scribble"); assert.ok(/^inset\(-60% 0(px)?( -60% 0(px)?)?\)$/.test(ink.clip), "whole once struck: " + ink.clip); }
      else assert.ok(!ink.scr && !ink.svg, kit + ": a bar");
      if (kit === "arcade") assert.equal(ink.radius, "0px", "square");
      if (kit === "paper") assert.notEqual(ink.rotate, "none", "a hair off level");
      clear(t); await t.close();
    }
  });
  await test(label + ": 1.12 b293: the count rolls like an odometer — its text is the count from the first frame, the old number rides alongside only while it rolls, and a new view does not roll", async () => {
    const t = await fresh(opts); await wait(900);
    await t.press("#list .row:not(.done) .tx"); await wait(40);
    assert.deepEqual(await t.page.$eval("#count b", b => [b.textContent, b.querySelector("i").dataset.was]), ["1", "0"], "1, with 0 rolling away");
    await wait(900);
    assert.equal(await t.page.$eval("#count b i", i => i.dataset.was === undefined), true, "and the old one goes");
    assert.equal((await t.page.textContent("#count")).replace(/\s+/g, " ").trim(), "1/3 done");
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(60);
    assert.equal(await t.page.$eval("#count b i", i => i.dataset.was === undefined), true, "a new view is not a roll");
    clear(t); await t.close();
  });
  await test(label + ": 1.12 b293: Delete erases the line where it is, in its material, and only then do the others close up; Undo brings it back", async () => {
    for (const kit of ["paper", "terminal", "midnight"]) {
      const t = await fresh(opts, { init: pinKit(kit) }); await wait(900);
      const id = await t.page.$eval("#list .row:nth-child(2)", e => e.dataset.id);
      const top3 = (await rect(t.page, "#list .row:nth-child(3)")).top;
      await t.lineMenu(`#list .row[data-id="${id}"]`); await t.page.click('#p-line [data-lact="delete"]'); await wait(60);
      assert.ok(await t.page.$(`#list .row.leaving[data-id="${id}"]`), kit + ": still there, on its way out");
      assert.ok(/^Deleted/.test(await t.page.textContent("#toast .msg")), kit + ": deleted at once all the same");
      await wait(1700);
      assert.equal(await t.page.$$eval("#list .row", els => els.length), 2, kit + ": gone once erased");
      assert.ok((await rect(t.page, "#list .row:nth-child(2)")).top < top3 - 4, kit + ": the line below closed the gap");
      await t.press("#toast-undo"); await wait(800);
      assert.ok(await t.page.$(`#list .row[data-id="${id}"]:not(.leaving)`), kit + ": Undo brings it back");
      assert.equal(await t.page.$$eval("#list .row", els => els.length), 3);
      clear(t); await t.close();
    }
  });
  await test(label + ": 1.12 b293: Not today sends a line's words off with a moon rising where they were, Take off Today flies them to Everything, and each line leaves Today", async () => {
    const t = await fresh(opts); await wait(900);
    const [a, b] = await t.page.$$eval("#list .row", els => els.map(e => e.dataset.id));
    await t.lineMenu(`#list .row[data-id="${a}"]`); await t.page.click('#p-line [data-lact="nottoday"]'); await wait(80);
    assert.ok(await t.page.$(".moon-f"), "a moon rises");
    await wait(1200);
    assert.deepEqual([await t.page.$(".moon-f"), await t.page.$(`#list .row[data-id="${a}"]`)], [null, null], "the moon has set and the line has left Today");
    await t.lineMenu(`#list .row[data-id="${b}"]`); await t.page.click('#p-line [data-lact="today"]'); await wait(80);
    assert.ok(await t.page.$(".tghost"), "its words are in flight");
    await wait(1100);
    assert.deepEqual([await t.page.$(".tghost"), await t.page.$(`#list .row[data-id="${b}"]`)], [null, null], "they have landed and the line has left Today");
    clear(t); await t.close();
  });
  await test(label + ": 1.12 b293: a panel comes from what opened it and goes back — ⋯ " + (touch ? "rises" : "grows out of itself") + ", Settings grows out of the menu rather than the menu folding away, × closes at once while a copy folds off — and under reduced motion nothing moves", async () => {
    const t = await fresh(opts); await wait(900);
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]");
    assert.ok(await t.page.$eval("#p-menu", d => d.classList.contains("mo") && d.getAnimations().length > 0), "motion.js brings it in");
    await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$$eval(".folding", els => els.length), 0, "the menu became Settings");
    await wait(700);
    await t.page.click("#p-settings h2 .x"); await wait(30);
    assert.equal(await t.page.$("dialog.panel[open]"), null, "closed at once");
    assert.equal(await t.page.$$eval(".folding", els => els.length), 1, "a copy folds off");
    await wait(800);
    assert.equal(await t.page.$$eval(".folding, .fold-scrim", els => els.length), 0, "and is gone");
    clear(t); await t.close();
    const r = await fresh(opts, { reducedMotion: "reduce" }); await wait(900);
    await r.press("#more"); await r.page.waitForSelector("#p-menu[open]");
    assert.equal(await r.page.$eval("#p-menu", d => d.getAnimations().length), 0, "reduced motion: it is simply there");
    await r.esc(); await wait(30);
    assert.equal(await r.page.$$eval(".folding", els => els.length), 0, "and nothing folds");
    clear(r); await r.close();
  });
  await test(label + ": 1.12 b293: the tabs zoom and leave nothing named behind, and the sun or moon opens the other theme from itself", async () => {
    const t = await fresh(opts); await wait(900);
    const vt = await t.page.evaluate(() => typeof document.startViewTransition === "function");
    const watch = () => t.page.evaluate(() => { window.__cls = []; new MutationObserver(() => window.__cls.push(document.documentElement.className)).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] }); });
    const had = c => t.page.evaluate(c => window.__cls.some(x => x.split(" ").includes(c)), c);
    await watch(); await t.press("#v-all");
    if (vt) assert.ok(await had("vt-zoom"), "a zoom");
    await t.page.waitForSelector("#all:not([hidden])"); await wait(700);
    assert.deepEqual(await t.page.evaluate(() => [/vt-|zoom-/.test(document.documentElement.className), [...document.querySelectorAll(".row")].filter(r => r.style.viewTransitionName).length]), [false, 0], "nothing left named");
    await t.press("#v-today"); await t.page.waitForSelector("#today:not([hidden])"); await wait(700);
    const before = await t.page.evaluate(() => document.documentElement.dataset.theme);
    await watch(); await t.press("#daynight");
    if (vt) assert.ok(await had("vt-theme"), "a reveal");
    await wait(900);
    assert.notEqual(await t.page.evaluate(() => document.documentElement.dataset.theme), before, "the other theme is on");
    assert.equal(await cls(t, "vt-theme"), false);
    clear(t); await t.close();
  });
  await test(label + ": 1.12 b293: a list unseals as it opens cold, the lock over the dot opening, and ends by itself — a touch ends it at once; the welcome's list never does, nor anything under reduced motion", async () => {
    const w = await fresh(opts, { list: false }); await w.page.waitForSelector("#welcome:not([hidden])"); await wait(200);
    assert.equal(await cls(w, "unseal"), false, "the welcome's list is nobody's yet"); await w.close();
    const t = await fresh(opts); await wait(300);
    assert.equal(await cls(t, "unseal"), false, "keeping the welcome's list is not an unseal");
    await t.reload(); await t.page.waitForSelector("#list .row");
    assert.ok(await cls(t, "unseal"), "a cold open unseals");
    assert.equal(await t.page.$eval("#dot .lock", e => getComputedStyle(e).animationName), "tf-lock", "the lock opens");
    await wait(2800);
    assert.equal(await cls(t, "unseal"), false, "and it ends by itself");
    assert.ok(await t.page.$$eval("#list .row", els => els.every(e => getComputedStyle(e).opacity === "1" && getComputedStyle(e).filter === "none")), "every line fully there");
    await t.reload(); await t.page.waitForSelector("#list .row");
    await t.page.evaluate(() => document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true })));
    assert.equal(await cls(t, "unseal"), false, "a touch ends it at once");
    clear(t); await t.close();
    const r = await fresh(opts, { reducedMotion: "reduce" }); await r.reload(); await r.page.waitForSelector("#list .row");
    assert.equal(await cls(r, "unseal"), false, "reduced motion: the list is simply there"); await r.close();
  });
  if (touch) await test(label + ": 1.12 b293: on a phone a line's words rise into its menu's title, and go back into the line when the menu closes with nothing chosen", async () => {
    const t = await fresh(opts); await wait(900);
    const id = await t.page.$eval("#list .row", e => e.dataset.id);
    await t.lineMenu(`#list .row[data-id="${id}"]`);
    assert.ok(await t.page.$eval(`#list .row[data-id="${id}"]`, e => e.classList.contains("lifted")), "the words have left the line");
    await t.page.click("#p-line h2 .x"); await wait(80);
    assert.ok(await t.page.$(".tghost"), "they travel back");
    await wait(900);
    assert.deepEqual([await t.page.$eval(`#list .row[data-id="${id}"]`, e => e.classList.contains("lifted")), await t.page.$(".tghost")], [false, null], "and are home");
    clear(t); await t.close();
  });
  await test(label + ": 1.12 b293: Share's links come up as ciphertext the length of the link and decode into it; what the field holds (data-v) is the link from the first frame", async () => {
    const t = await fresh(opts); await wait(900);
    if (touch) { await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="share"]'); } else await t.press("#share"); // the phone's rail has no Share
    await t.page.waitForSelector("#p-share[open]"); await wait(20);
    const early = await t.page.$eval("#share-link", e => ({ v: e.value, real: e.dataset.v }));
    const head = early.real.slice(0, early.real.indexOf("://") + 3);
    assert.ok(early.real && early.v !== early.real && early.v.length === early.real.length && early.v.startsWith(head), "ciphertext after the scheme, the length of the link");
    await wait(1100);
    assert.equal(await t.page.$eval("#share-link", e => e.value === e.dataset.v), true, "then the link itself");
    clear(t); await t.close();
  });

  if (!touch) await test(label + ": 1.12 b279: the mouse — a click that wobbles a few pixels is still a click, and a drag that is mostly up or down draws nothing", async () => {
    const t = await fresh(opts); await wait(900);
    const ids = await t.page.$$eval("#list .row:not(.done)", els => els.map(e => e.dataset.id));
    const at = async id => (await t.page.$(`.row[data-id="${id}"] .tx`)).boundingBox();
    let b = await at(ids[0]);
    await t.page.mouse.move(b.x + 20, b.y + 10); await t.page.mouse.down(); await t.page.mouse.move(b.x + 26, b.y + 12, { steps: 3 }); await t.page.mouse.up(); await wait(600);
    assert.equal(await isDone(t, ids[0]), true, "a wobbly click is a click");
    b = await at(ids[1]);
    await t.page.mouse.move(b.x + 20, b.y + 6); await t.page.mouse.down(); await t.page.mouse.move(b.x + 34, b.y + b.height + 90, { steps: 8 }); await t.page.mouse.up(); await wait(600); // out of the row: a release on its own words has always been a click
    assert.equal(await isDone(t, ids[1]), false, "a drag down is not a strike");
    assert.ok(await clean(t, `.row[data-id="${ids[1]}"]`), "and leaves no ink");
    assert.deepEqual([t.errors, t.csp, t.thirdParty], [[], [], []]);
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

  await test(label + ": the line menu opens by " + (touch ? "a hold released in place, Edit first — a swipe right crosses the line off instead (1.12 b279); a hold that moves drags" : "⋯, Edit first; dragging ⋯ moves the line; the popover sits by the row"), async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.esc(); await wait(200);
    await t.lineMenu("#all .row:nth-child(2)");
    assert.equal((await t.page.textContent("#p-line .menu button:first-child .lb")).trim(), "Edit", "Edit at the top");
    await t.page.waitForFunction(() => !document.getElementById("p-line").getAnimations().length); // 1.12 b293: it grows out of ⋯ first
    if (!touch) { assert.ok(await t.page.$eval("#p-line", e => e.classList.contains("pop")), "popover"); const d = await rect(t.page, "#p-line"), g = await rect(t.page, "#all .row:nth-child(2) .tool.lmenu"); assert.ok(d.top >= g.bottom - 1 && Math.abs(d.right - g.right) < 8, "under ⋯: " + JSON.stringify({ d, g })); }
    else assert.ok(!(await t.page.$eval("#p-line", e => e.classList.contains("pop"))), "a sheet on the phone");
    await t.esc(); await wait(300);
    const first = await t.page.$eval("#all .row:first-child .tx", e => e.dataset.text);
    if (touch) {
      // 1.12 b279: a swipe right no longer opens the menu — it draws the strike, and this one is long enough to land
      await wait(600); // motion.js arrives at idle
      const r3 = await t.page.$eval("#all .row:nth-child(3)", e => e.dataset.id);
      await t.draw(`#all .row[data-id="${r3}"]`, 1); await wait(500);
      assert.equal(await t.page.locator("#p-line[open]").count(), 0, "a swipe right opens no menu now");
      assert.ok(await t.page.$eval(`#all .row[data-id="${r3}"]`, e => e.classList.contains("done")), "it crossed the line off");
      await t.press(`#all .row[data-id="${r3}"] .tx`); await wait(450); // back, so the drag below starts where it always did
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
    // 1.9: the three popovers share one anatomy — an icon, a label (with a sub-line where it helps), the state or key slot (proposal 23)
    for (const id of ["#p-menu", "#p-line", "#p-sec"]) {
      const rows = await t.page.$eval(id + " .menu", m => [...m.querySelectorAll("button")].map(b => [!!b.querySelector("svg.ic, .ico svg"), !!b.querySelector(".lb")])); // 1.12 b315: the ⋯ menu's icons sit on tiles
      assert.ok(rows.length >= 3 && rows.every(r => r[0] && r[1]), id + ": every row has an icon and a label: " + JSON.stringify(rows));
    }
    assert.ok(await t.page.$("#p-sec .menu button.danger") && await t.page.$("#p-line .menu button.danger"), "the destructive row is red in each");
    await t.esc();
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": 1.9: the idle fade rests at 0.2 (26), the rail wraps whole at 200 % text (27), the Undo chip names its key (28)", async () => {
    const t = await fresh(opts);
    if (!opts.hasTouch) { // 26: after four seconds the controls step back to 0.2, the count stays, a move brings them back
      await wait(5800);
      assert.ok(await t.page.$eval("body", b => b.classList.contains("idle")), "idle after four seconds still");
      const op = await t.page.$eval(".rail-r .tools", e => parseFloat(getComputedStyle(e).opacity)), foot = await t.page.$eval("#foot", e => parseFloat(getComputedStyle(e).opacity));
      assert.ok(Math.abs(op - 0.2) < 0.03 && Math.abs(foot - 0.2) < 0.03, "the controls rest at 0.2, not 0: " + op + " " + foot);
      assert.equal(await t.page.$eval("#count", e => getComputedStyle(e).opacity), "1", "the count stays");
      await t.page.mouse.move(300, 300); await wait(400);
      assert.ok(!(await t.page.$eval("body", b => b.classList.contains("idle"))), "a move wakes it");
    }
    // 27: at the phone's own width the tabs share the line with the count (nothing moved); at 200 % text they drop to their own line, whole
    { const m = await t.page.evaluate(() => { const b = s => document.querySelector(s).getBoundingClientRect(); return { sameLine: b(".seg").top < b(".status").bottom, whole: document.querySelector(".seg").scrollWidth <= document.querySelector(".seg").clientWidth + 1 }; }); assert.ok(m.sameLine && m.whole, "one line, whole, at " + opts.viewport.width + ": " + JSON.stringify(m)); }
    if (opts.hasTouch) {
      const z = await fresh({ ...opts, viewport: { width: 195, height: 422 }, deviceScaleFactor: 4 });
      const m = await z.page.evaluate(() => { const b = s => document.querySelector(s).getBoundingClientRect(); const seg = document.querySelector(".seg"); return { segBelow: b(".seg").top >= b(".status").bottom - 1, whole: seg.scrollWidth <= seg.clientWidth + 1, docW: document.documentElement.scrollWidth, tabs: [...seg.querySelectorAll("button")].every(x => x.scrollWidth <= x.clientWidth + 1) }; });
      assert.ok(m.segBelow && m.whole && m.tabs, "the tabs drop to their own line and read whole: " + JSON.stringify(m)); assert.equal(m.docW, 195, "no sideways scroll");
      assert.equal(z.errors.length, 0, z.errors.join("; ")); await z.close();
      // the audit's own case: the phone at its width with the root text at 200 % (the margins grow, the rail narrows)
      await t.page.evaluate(() => { document.documentElement.style.fontSize = "200%"; }); await wait(300);
      const m2 = await t.page.evaluate(() => { const b = s => document.querySelector(s).getBoundingClientRect(); const seg = document.querySelector(".seg"); return { railW: Math.round(b(".rail").width), segBelow: b(".seg").top >= b(".status").bottom - 1, whole: seg.scrollWidth <= seg.clientWidth + 1, docW: document.documentElement.scrollWidth, tabs: [...seg.querySelectorAll("button")].every(x => x.scrollWidth <= x.clientWidth + 1) }; });
      assert.ok(m2.railW < 341 && m2.whole && m2.tabs, "at 200 % root text the tabs read whole: " + JSON.stringify(m2)); assert.equal(m2.docW, opts.viewport.width, "no sideways scroll");
      await t.page.evaluate(() => { document.documentElement.style.fontSize = ""; }); await wait(300);
    }
    // 28: an Undo on the toast names its key — printed where there is a keyboard, aria-keyshortcuts everywhere, the reader hears "Undo" alone
    await t.press("#list .row:first-child .check"); await wait(400);
    assert.ok(!(await t.page.$eval("#toast-undo", e => e.hidden)), "an Undo on the toast");
    const ks = await t.page.$eval("#toast-undo", e => e.getAttribute("aria-keyshortcuts")); assert.ok(/^(Meta|Control)\+Z$/.test(ks), "aria-keyshortcuts names the key: " + ks);
    assert.equal(await t.page.$eval("#toast-undo-key", e => getComputedStyle(e).display !== "none" && !e.hidden), !opts.hasTouch, "the printed hint only where there is a key to press");
    if (!opts.hasTouch) assert.ok(/⌘Z|Ctrl\+Z/.test(await t.page.textContent("#toast-undo-key")), "⌘Z or Ctrl+Z");
    { const snap = await t.page.locator("#toast-undo").ariaSnapshot(); assert.ok(/button "Undo"$/m.test(snap.trim()), "the reader hears Undo alone: " + snap); }
    assert.equal(await t.page.textContent("#count b"), "1");
    await t.page.keyboard.press(process.platform === "darwin" ? "Meta+z" : "Control+z"); await wait(500);
    assert.equal(await t.page.textContent("#count b"), "0", "and the key undoes");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.9: a done line while lifted reads in --done-2 (29), the ⋯ menu is two columns in phone landscape and one otherwise (31)", async () => {
    const t = await fresh(opts);
    // 1.11: the recoloured Dark derives --done from a grey that already clears 4.5:1 on --ink-3, so
    // --done and --done-2 are the same colour there and the check below would prove nothing. Pink is
    // a night kit where the two genuinely differ, which is what this test needs to be about.
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.night = "T1:curated:pink"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(400);
    const hex = c => { const m = c.match(/\d+/g); return m ? "#" + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, "0")).join("").toUpperCase() : c; };
    await t.press("#list .row:first-child .check"); await wait(700);
    const c = await t.page.evaluate(() => { const r = document.querySelector("#list .row.done"); const rest = getComputedStyle(r).color; r.classList.add("dragging"); const lifted = getComputedStyle(r).color; r.classList.remove("dragging"); const cs = getComputedStyle(document.documentElement); return { rest, lifted, done: cs.getPropertyValue("--done").trim(), done2: cs.getPropertyValue("--done-2").trim() }; });
    assert.equal(hex(c.rest), c.done.toUpperCase(), "at rest a done line reads in --done"); assert.equal(hex(c.lifted), c.done2.toUpperCase(), "lifted, in --done-2"); assert.ok(c.done2 && c.done2 !== c.done || opts.hasTouch, "the two differ on the kit where it matters: " + JSON.stringify(c));
    const cols = async p => p.evaluate(() => { const vis = e => !e.hidden && getComputedStyle(e).display !== "none"; const rows = [...document.querySelectorAll("#p-menu .menu > *")].filter(vis), tiles = [...document.querySelectorAll("#menu-tiles > *")].filter(vis); const body = document.querySelector("#p-menu .body"); return { cols: new Set(rows.map(r => Math.round(r.getBoundingClientRect().left))).size, scroll: body.scrollHeight - body.clientHeight, minH: Math.min(...rows.concat(tiles).map(r => r.getBoundingClientRect().height)), n: rows.length + tiles.length }; }); // 1.12 b315: the tiles and the rows, nine in all
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await wait(400);
    const m1 = await cols(t.page); assert.equal(m1.cols, 1, "one column here: " + JSON.stringify(m1)); await t.esc();
    if (opts.hasTouch) {
      const z = await fresh({ ...opts, viewport: { width: 844, height: 390 } });
      await z.press("#more"); await z.page.waitForSelector("#p-menu[open]"); await wait(500);
      const m2 = await cols(z.page); assert.ok(m2.cols === 2 && m2.scroll <= 1 && m2.minH >= 44 && m2.n >= 9, "landscape: two columns, no scroll, 44 px rows: " + JSON.stringify(m2));
      await z.esc(); assert.equal(z.errors.length, 0, z.errors.join("; ")); await z.close();
    }
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.9: no leak — Settings open/close ×20 and Today↔Everything ×30 keep nodes and listeners flat after a forced GC (ceiling 10 nodes, 4 listeners)", async () => {
    const t = await fresh(opts);
    const cdp = await t.page.context().newCDPSession(t.page);
    await cdp.send("HeapProfiler.enable"); await cdp.send("Performance.enable");
    const measure = async () => { await cdp.send("HeapProfiler.collectGarbage"); await wait(80); await cdp.send("HeapProfiler.collectGarbage"); const { metrics } = await cdp.send("Performance.getMetrics"); const m = Object.fromEntries(metrics.map(x => [x.name, x.value])); return { nodes: m.Nodes, listeners: m.JSEventListeners }; };
    const settings = async () => { await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(120); await t.esc(); };
    const view = async () => { await t.press("#v-all"); await wait(140); await t.press("#v-today"); await wait(140); };
    for (const [name, cycle, n] of [["Settings", settings, 20], ["Today↔Everything", view, 30]]) {
      await cycle(); await cycle(); // the first open loads panels.js and wires it once; the first visit builds Everything's scaffolding — one-time, not growth (the audit's baseline was taken before either)
      const a = await measure(); for (let i = 0; i < n; i++) await cycle(); const b = await measure();
      assert.ok(b.nodes - a.nodes <= 10 && b.listeners - a.listeners <= 4, name + " ×" + n + " grew: " + JSON.stringify({ before: a, after: b }));
    }
    await cdp.detach();
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.9: a sound for Day and one for Night — 1.12 b309: Settings' Sound row says what plays now and opens a page with a pack per slot, the slot that is on first, each defaulting to the theme's pick and previewing; a 1.8 override lands in both slots; a kit whose pack changed keeps its old pack pinned until the slot's theme changes", async () => {
    // a fresh device: both slots on the theme's pick; a pick previews and the note says so
    const t = await fresh(opts);
    await t.press("#list .row:first-child .check"); await wait(400); // a gesture, so a preview has a context
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(200);
    assert.equal((await t.page.textContent("#set-sound-k")).trim(), "On · Knock");
    await t.page.click('#p-settings [data-set="sound"]'); await t.page.waitForSelector("#p-sound[open]"); await wait(250);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-settings,p-sound", "a page under Settings, under the ⋯ menu it came from (1.12)");
    assert.equal(await t.page.$eval('#snd-slot [aria-checked="true"]', e => e.dataset.slot), "night", "it opens on the slot that is on (a dark system)");
    assert.equal(await t.page.locator('#snd-packs [role="radio"]').count(), 13, "Theme's pick and the twelve");
    assert.equal(await t.page.$eval('#snd-packs [aria-checked="true"]', e => e.dataset.pack + "|" + e.querySelector(".sub").textContent), "|Knock", "the theme's pick, named, is the one checked");
    await t.page.click('#snd-slot [data-slot="day"]'); await wait(250);
    assert.ok(/Light picks Knock, and that's what plays by day/.test(await t.page.textContent("#snd-note")), await t.page.textContent("#snd-note"));
    await t.page.click('#snd-packs [data-pack="kalimba"]'); await wait(300);
    assert.equal((await t.s()).audio.state, "running", "a pick previews"); assert.deepEqual((await t.s()).soundPacks, { day: "kalimba", night: "" });
    assert.ok(/Light picks Knock; this device plays Kalimba by day/.test(await t.page.textContent("#snd-note")));
    assert.equal(await t.page.$eval('#snd-packs [aria-checked="true"]', e => e.dataset.pack), "kalimba");
    if (!touch) { await t.page.focus('#snd-packs [data-pack="bell"]'); await t.page.keyboard.press("Enter"); await wait(200); assert.equal(await t.page.evaluate(() => document.activeElement.dataset.pack), "bell", "a keyboard that chose a pack is still on it"); await t.page.click('#snd-packs [data-pack="kalimba"]'); await wait(200); }
    await t.page.click('#snd-slot [data-slot="night"]'); await wait(250);
    assert.equal(await t.page.$eval('#snd-packs [aria-checked="true"]', e => e.dataset.pack), "", "Night keeps the theme's pick");
    await t.page.click("#p-sound h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250);
    assert.equal((await t.page.textContent("#set-sound-k")).trim(), "On · Knock", "Night is on, and plays its theme's pick");
    await t.esc(); assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
    // a device from 1.8 with one override: it lands in both slots (the device's record is put back to 1.8's shape and the page reloaded)
    const a = await fresh(opts);
    await a.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); delete m.device.soundPacks; delete m.device.soundPins; m.device.soundPack = "arcade"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await a.reload(); await a.page.waitForSelector("#list .row"); await wait(500);
    assert.deepEqual((await a.s()).soundPacks, { day: "arcade", night: "arcade" }); assert.deepEqual((await a.s()).soundPins, { day: "", night: "" });
    await a.press("#more"); await a.page.click('#p-menu [data-act="settings"]'); await a.page.waitForSelector("#p-settings[open]"); await wait(200);
    assert.equal((await a.page.textContent("#set-sound-k")).trim(), "On · Arcade");
    await a.esc(); assert.equal(a.errors.length, 0, a.errors.join("; ")); await a.close();
    // a device from 1.8 on Cocoa at night (knock then, kalimba now): the knock is pinned, with its old parameters; a new Night theme lifts the pin
    const b = await fresh(opts);
    await b.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); delete m.device.soundPacks; delete m.device.soundPins; delete m.device.soundPack; m.device.day = "T1:curated:harbor"; m.device.night = "T1:curated:cocoa"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await b.reload(); await b.page.waitForSelector("#list .row"); await wait(500);
    assert.deepEqual((await b.s()).soundPacks, { day: "pop", night: "knock" }, "both slots held a kit whose pack changed"); assert.deepEqual((await b.s()).soundPins, { day: "harbor", night: "cocoa" });
    await b.press("#more"); await b.page.click('#p-menu [data-act="settings"]'); await b.page.waitForSelector("#p-settings[open]"); await wait(200);
    assert.equal((await b.page.textContent("#set-sound-k")).trim(), "On · Knock", "Night is on, and keeps its knock");
    await b.page.click('#p-settings [data-set="sound"]'); await b.page.waitForSelector("#p-sound[open]"); await wait(250);
    assert.ok(/Cocoa picks Kalimba since 1.9; this device keeps Knock at night, as before/.test(await b.page.textContent("#snd-note")), await b.page.textContent("#snd-note"));
    await b.page.click('#snd-slot [data-slot="day"]'); await wait(250);
    assert.ok(/Harbor picks Whistle since 1.9; this device keeps Pop by day, as before/.test(await b.page.textContent("#snd-note")), await b.page.textContent("#snd-note"));
    await b.page.click("#p-sound h2 .back"); await b.page.waitForSelector("#p-settings[open]"); await wait(250);
    await b.page.click('[data-set="appearance"]'); await b.page.waitForSelector("#p-appear[open]"); await b.page.click('#p-appear .slot[data-slot="night"]'); await b.page.waitForSelector("#p-theme[open]"); await wait(250);
    await b.press('#p-theme .swatch[data-code="T1:curated:forest"]'); await wait(500);
    assert.deepEqual((await b.s()).soundPacks, { day: "pop", night: "" }, "a new Night theme plays its own pack"); assert.equal((await b.s()).soundPins.night, "");
    await b.esc(); await b.reload(); await b.page.waitForSelector("#list .row"); await wait(400);
    assert.deepEqual((await b.s()).soundPacks, { day: "pop", night: "" }, "and it stays that way: the migration runs once");
    assert.equal(b.errors.length, 0, b.errors.join("; ")); await b.close();
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
    const at = async sel => Math.abs((await op(sel)) - 0.2) < 0.05; // 1.9: to 0.2, not 0 (proposal 26); the tools fade as one unit
    assert.ok((await at(".seg")) && (await at("#foot")) && (await at(".rail-r .tools")), "the views, the tools and the footer faded to 0.2: " + [await op(".seg"), await op("#foot"), await op(".rail-r .tools")].join(" "));
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

  await test(label + ": 1.12 b309: Settings is a hub — Appearance and Sound say what is set and open pages of their own; Screen, Other devices and Gestures or Keyboard hold the switches; This list, under the list's name, keeps Add from anywhere, Export & import and Templates one level down; the toggles hold", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    const name = await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.name || "");
    const heads = await t.page.$$eval("#p-settings h3", els => els.map(e => e.textContent.trim()));
    assert.equal(heads.join("|"), ["Screen", "Other devices", touch ? "Gestures" : "Keyboard", "This list" + (name ? " · " + name : "")].join("|"));
    assert.equal(await t.page.$eval("#p-settings .body > .hero", e => e.dataset.set), "appearance", "1.12 b315: Appearance is the hero");
    assert.equal(await t.page.$$eval("#set-pv-day i, #set-pv-night i", els => els.length), 6, "both slots in miniature");
    const cards = await t.page.$$eval("#p-settings .body > .menu.card", cs => cs.map(c => [...c.children].filter(e => !e.hidden).map(e => (e.querySelector(".lb") || e).firstChild.textContent.trim())));
    const wake = (await t.page.locator('[data-set="wake"]:not([hidden])').count()) ? ["Keep screen awake"] : [];
    assert.deepEqual(cards, [["Sound"], [...wake, "Day review", ...(touch ? [] : ["Fade controls when idle"])], ["Show who's here", "Celebrate their check‑offs"], [touch ? "Swipe left for “Not today”" : "Single-key shortcuts"], ["Add from anywhere", "Export & import", "Templates"]], JSON.stringify(cards));
    assert.equal((await t.page.textContent("#set-appear-k")).trim(), "Light · Dark", "Appearance names both slots");
    assert.ok(/quiet card under the finale/.test(await t.page.textContent("#set-screen-foot")) && /neither shows nor counts/.test(await t.page.textContent("#set-others-foot")), "a line under each group says what its switches do");
    assert.ok((touch ? /swiped left/ : /1–9 work on their own/).test(await t.page.textContent("#set-input-foot")), await t.page.textContent("#set-input-foot"));
    assert.equal(await t.page.getAttribute('[data-set="review"]', "aria-describedby"), "set-screen-foot", "and the switch it explains points at it");
    assert.equal((await t.page.textContent("#set-sound-k")).trim(), "On · Knock", "Sound says it is on, and what plays now");
    assert.equal(await t.page.locator('#p-settings select, #p-settings input, #set-full, #p-settings [data-set="removed"], #p-settings [data-set="history"]').count(), 0, "no pickers or fields on the hub; Full screen, Removed lists and History left long ago");
    assert.equal(await t.page.locator('[data-set="follow"], [data-set="schedule"], [data-set="theme"], [data-set="day"], [data-set="night"], [data-set="pack"], #set-switch, #set-pack, #sch-day, #sch-night').count(), 0, "the 1.1 and 1.9 rows are gone");
    assert.ok(!(await t.page.$eval('[data-set="templates"]', e => e.hidden)), "no sections yet: Templates shows under This list");
    assert.ok(new RegExp(VERSION_LABEL.replace(/[.()]/g, "\\$&")).test(await t.page.textContent("#set-version")), "the version line: " + await t.page.textContent("#set-version"));
    assert.ok(/stay on this device/.test(await t.page.textContent("#set-note")), "and where settings live");
    for (const k of ["review", "celebrate", "who"]) { await t.page.click(`[data-set="${k}"]`); }
    assert.equal(await t.page.getAttribute('[data-set="review"]', "aria-pressed"), "true");
    assert.equal(await t.page.getAttribute('[data-set="who"]', "aria-pressed"), "false");
    // Appearance: the switch, on its own page
    await t.page.click('#p-settings [data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(250);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-settings,p-appear");
    assert.equal(await t.page.$eval('#ap-switch [aria-checked="true"]', e => e.dataset.mode), "system", "a fresh device switches with the system");
    assert.equal(await t.page.$$eval("#ap-switch button", bs => bs.map(b => b.textContent).join("|")), "By hand|With the system|On a schedule");
    await t.page.click('#ap-switch [data-mode="schedule"]'); await wait(300); assert.ok(await t.page.locator("#schedule-block").isVisible(), "the times show for a schedule"); assert.ok(/Day from 07:00, night from 19:00/.test(await t.page.textContent("#ap-switch-note")));
    await t.page.click('#ap-switch [data-mode="hand"]'); await wait(300); assert.ok(await t.page.locator("#schedule-block").isHidden()); assert.ok(/sun and moon/.test(await t.page.textContent("#ap-switch-note")));
    await t.page.click('#ap-switch [data-mode="system"]'); await wait(300);
    await t.page.click("#p-appear h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250);
    // Sound: the switch and the volume moved in with the packs
    await t.page.click('#p-settings [data-set="sound"]'); await t.page.waitForSelector("#p-sound[open]"); await wait(250);
    await t.page.click('#p-sound [data-snd="on"]'); await wait(150);
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.muted), true, "the switch mutes");
    assert.equal(await t.page.getAttribute('#p-sound [data-snd="on"]', "aria-pressed"), "false");
    await t.page.click("#p-sound h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250);
    assert.equal((await t.page.textContent("#set-sound-k")).trim(), "Off", "and the row says so");
    await t.page.click('#p-settings [data-set="sound"]'); await t.page.waitForSelector("#p-sound[open]"); await wait(200); await t.page.click('#p-sound [data-snd="on"]'); await wait(150);
    await t.page.click("#p-sound h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250);
    assert.equal((await t.page.textContent("#set-sound-k")).trim(), "On · Knock");
    // This list: its things one level down
    await t.page.click('#p-settings [data-set="addurl"]'); await t.page.waitForSelector("#p-addurl[open]"); await wait(200);
    assert.ok((await t.page.inputValue("#set-addurl")).includes("/add?text="), "the personalised URL, on its own page"); assert.ok(!(await t.page.$eval("#set-addurl-copy", e => e.disabled)), "with Copy");
    await t.page.click("#addurl-help"); await t.page.waitForSelector("#p-help[open]"); await wait(300);
    assert.ok(await t.page.$eval("#h-add", e => { const r = e.getBoundingClientRect(), b = e.closest(".body").getBoundingClientRect(); return r.top >= b.top - 2 && r.top < b.top + b.height / 2; }), "Set one up opens How it works at adding from anywhere");
    await t.page.click("#p-help h2 .back"); await t.page.waitForSelector("#p-addurl[open]"); await wait(200);
    await t.page.click("#p-addurl h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250);
    await t.page.click('[data-set="export"]'); await t.page.waitForSelector("#p-export[open]");
    assert.equal(await t.page.locator("#set-export-json:not([disabled]), #set-export-md:not([disabled]), #set-import-file").count(), 3, "export and import inside the sub-sheet");
    assert.ok(/only backup/.test(await t.page.textContent("#p-export")));
    await t.esc();
    // the settings survive a reload
    await t.reload(); await t.page.waitForSelector("#list .row");
    const dev = await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device);
    assert.equal(dev.review, true); assert.equal(dev.celebrateRemote, true); assert.equal(dev.whoOff, true); assert.equal(dev.switch.mode, "system"); assert.ok(!dev.muted, "sound back on");
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
    await t.press("#v-today"); await t.page.waitForSelector("#today:not([hidden])"); await t.press(`#list .row[data-id="${id}"] .check`); await wait(800); // 1.12 b293: the tabs zoom, so the view lands a frame later
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
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(200);
    assert.ok(!(await t.page.$eval('[data-set="templates"]', e => e.hidden)), "1.12 b309: a list with sections shows Templates once it has one, since this is the only place one can be deleted");
    assert.equal((await t.page.textContent("#set-tpl-k")).trim(), "1");
    await t.page.click('#p-settings [data-set="templates"]'); await t.page.waitForSelector("#p-pick[open]"); await wait(200);
    assert.equal(await t.page.textContent("#p-pick-h"), "Templates"); assert.equal(await t.page.locator('#pick-menu [aria-label="Delete Five"]').count(), 1, "with its Delete");
    await t.esc();
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
    await t.page.click('#p-settings [data-set="sound"]'); await t.page.waitForSelector("#p-sound[open]"); await wait(250); // 1.12 b309: the page opens on the slot that is on (the system is dark: Night = Dark)
    assert.equal(await t.page.$eval('#snd-slot [aria-checked="true"]', e => e.dataset.slot), "night");
    assert.equal(await t.page.$eval('#snd-packs [data-pack=""] .sub', e => e.textContent), "Knock", "Theme's pick names the theme's pack");
    for (const pack of ["knock", "bell", "blip", "typewriter", "marble", "pop", "kalimba", "pencil", "whistle", "bongo", "cork", "arcade"]) { // 1.5: twelve
      await t.page.click(`#snd-packs [data-pack="${pack}"]`); await wait(150);
      const ok = await t.page.evaluate(() => { const s = window.__tf(); return s.audio.state === "running"; });
      assert.ok(ok, pack + ": context running");
      assert.equal(await t.page.$eval('#snd-packs [aria-checked="true"]', e => e.dataset.pack), pack, pack + ": the row is checked");
    }
    assert.ok(/Dark picks Knock; this device plays Arcade at night/.test(await t.page.textContent("#snd-note")), "says which one wins (Dark is on: a dark system, Night = Dark): " + await t.page.textContent("#snd-note"));
    await t.page.click("#p-sound h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250);
    assert.equal((await t.page.textContent("#set-sound-k")).trim(), "On · Arcade", "the row names what plays now");
    await t.esc(); await wait(200);
    const played = await t.page.evaluate(async () => { const S = await import("./sound.js"); const P = await import("./packs.js"); const snd = S.createSound({ muted: false, volume: 1, kit: () => ({ engine: "knock" }), loadPacks: () => Promise.resolve(P) }); snd.prime(); await new Promise(r => setTimeout(r, 50)); const out = {}; for (const e of P.PACK_ORDER) { out[e] = [snd.preview(e), snd.uncheck(), snd.finish()]; } return { out, st: snd.state() }; });
    for (const e of Object.keys(played.out)) assert.ok(played.out[e][0] && played.out[e][1] && played.out[e][2], e + " scheduled: " + JSON.stringify(played.out[e]));
    assert.equal(played.st.state, "running");
    const themePick = await t.page.evaluate(async () => { const T = await import("./theme.js"); return [T.curated("paper").sound.engine, T.curated("forest").sound.engine, T.curated("harbor").sound.engine]; });
    assert.equal(themePick.join(","), "typewriter,marble,whistle"); // 1.9: Harbor whistles
    assert.equal(t.consoleErrors.length, 0, "console errors: " + t.consoleErrors.join(" | ")); assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the theme builder carries a sound pack — Auto names the hue rule's pick, a saved theme's code is T2:, a T1: code imports", async () => {
    const t = await fresh(opts);
    await t.press("#list .row:first-child .check"); await wait(400); // a gesture, so a preview has a context to play through
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]");
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
    assert.equal((await t.page.textContent("#set-sound-k")).trim(), "On · Marble", "the row names what plays now: the slot's own pick");
    await t.page.click('#p-settings [data-set="sound"]'); await t.page.waitForSelector("#p-sound[open]"); await wait(250);
    assert.equal(await t.page.$eval('#snd-packs [data-pack=""] .sub', e => e.textContent), "Marble", "Theme's pick names it");
    assert.ok(/Marbles picks Marble, and that's what plays at night/.test(await t.page.textContent("#snd-note")), await t.page.textContent("#snd-note"));
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

  await test(label + ": remove from this device takes it off this device only; the server keeps it and the link brings it back (1.12)", async () => {
    const t = await fresh(opts);
    const { listId, lookupId } = await t.s();
    await t.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]");
    // 1.9: Remove and Rename live in the list's detail only (proposal 5); the shelf keeps New list and the paste field
    assert.equal(await t.page.locator("#l-archive, #l-rename").count(), 0, "no second Rename or Remove at the bottom of Lists");
    assert.equal((await t.page.textContent("#l-new")).trim(), "New list"); assert.ok(await t.page.locator("#l-paste").isVisible(), "and the paste field"); // 1.12 b315: New list is a row
    await t.page.click("#lists-menu .row .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.equal((await t.page.textContent('#list-detail-menu [data-lact="remove"] .lb')).trim(), "Remove from this device");
    await t.page.click('#list-detail-menu [data-lact="remove"]'); await t.page.waitForSelector("#ask[open]"); await wait(200);
    await t.page.click("#ask-ok"); await wait(900);
    assert.ok(await t.page.locator("#welcome").isVisible(), "the last list gone leaves the welcome");
    assert.ok(await t.page.evaluate(id => !!localStorage.getItem("tf/v2/localserver/" + id), lookupId), "server row untouched");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.length), 0, "1.12: gone from the registry, not parked in it");
    // and the way back is the link, like any other list
    await t.page.goto(BASE + "?transport=local#/l/" + listId); await wait(1400);
    const whose = await t.page.$("#whose[open]"); if (whose) { await t.page.click('#whose [data-whose="mine"]'); await wait(900); }
    assert.equal((await t.s()).listId, listId, "pasting the link opens it again");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.length), 1, "and this device holds it once more");
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
    assert.ok(new RegExp("New in " + VERSION.replace(".", "\\.")).test(msg), msg); assert.ok(!/4\.0\.0|renumber|1\.1\b|1\.2\b|1\.3\b/.test(msg), "nothing about version numbers: " + msg); assert.ok(/Easier to get back where you were\./.test(msg), "the headline is 1.12's: " + msg); assert.equal((await t.page.textContent("#wn-more")).trim(), "What's new");
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

  await test(label + ": About shows the version as 1.9 (build N) and the changelog in its shape, no dates", async () => {
    const t = await fresh(opts, { url: BASE + "about.html", list: false });
    await t.page.waitForFunction(() => /build/.test(document.getElementById("version").textContent), null, { timeout: 5000, polling: 100 });
    assert.equal(await t.page.textContent("#version"), "Version " + VERSION_LABEL);
    const log = await t.page.$$eval("#log .v", els => els.map(e => e.textContent));
    assert.equal(log.join(","), "1.12,1.11,1.10,1.9,1.8,1.7,1.5,1.4,1.3,1.2,1.1,1.0", "1.0 and later; the pre-releases never render");
    assert.ok(/Easier to get back where you were\./.test(await t.page.textContent("#log > li:first-child div")), "a headline per version"); assert.ok(/A look of its own\./.test(await t.page.textContent("#log > li:nth-child(2) div")), "and the one before it");
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
    assert.ok(new RegExp(touch ? "Swipe across a line" : "⌘ Z").test(await t.page.textContent("#keys-body"))); // 1.12 b279: the gesture that took swipe right's place
    await t.esc();
    await t.close();
  });

  /* ---------------- 1.2: Day and Night ---------------- */
  const inkOf = page => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--ink").trim().toUpperCase());
  const INK = { dark: "#070A08", terminal: "#070A08", light: "#FAF8F4", midnight: "#0E1424", paper: "#F7F2E8", harbor: "#EEF5F4", forest: "#10201A" };  // 1.11: Dark was recoloured onto Terminal's grounds, so the two share an ink

  await test(label + ": the flip — " + (touch ? "a tap on the sun/moon" : "T, or a click on the sun/moon") + " opens the other theme from the sun or moon (1.12 b293; it crossfaded before, and the clock's and the system's switches still do) with the incoming theme's tick; instant under reduced motion", async () => {
    const t = await fresh(opts);
    assert.equal((await t.s()).theme, "dark", "a dark system: Night = Dark is on"); assert.equal(await inkOf(t.page), INK.dark);
    const tick0 = (await t.s()).stats.tick;
    if (touch) await t.page.tap("#daynight"); else await t.page.keyboard.press("t");
    await wait(110);
    const midState = await t.s();
    assert.ok(await t.page.evaluate(() => document.documentElement.classList.contains("vt-theme")), "a view transition opens it");
    assert.ok(!midState.fading, "not the crossfade"); assert.equal(midState.theme, "light", "the theme is already the incoming one (its kit plays)");
    await wait(600);
    assert.equal(await inkOf(t.page), INK.light, "Day = Light at the end"); assert.ok(!(await t.page.evaluate(() => document.documentElement.classList.contains("vt-theme"))), "and it is over");
    assert.equal((await t.s()).stats.tick, tick0 + 1, "the incoming theme's soft tick played");
    assert.equal(await t.page.$eval("#daynight", e => e.dataset.next + "|" + e.title + "|" + e.getAttribute("aria-label")), "night|Night · T|Switch to night", "the glyph now offers Night");
    assert.equal(await t.page.$eval("html", e => e.dataset.base + "/" + e.dataset.theme), "light/light"); assert.equal(await t.page.$eval('meta[name="theme-color"]', e => e.content), INK.light, "theme-color follows the slot's theme");
    assert.equal(await t.page.evaluate(() => localStorage.getItem("tf/v2/themecss").includes("--ink:#FAF8F4")), true, "the boot cache holds the theme that is on");
    // flip back with the control itself; Paper's own fonts arrive with it
    await t.press("#daynight"); await wait(700); assert.equal(await inkOf(t.page), INK.dark);
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.day = "T1:curated:paper"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
    await t.press("#daynight"); await wait(700);
    assert.ok(/Playfair/.test(await t.page.$eval("#list .row", e => getComputedStyle(e).fontFamily)), "Paper's fonts"); assert.equal(await inkOf(t.page), INK.paper);
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
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(250); // 1.12 b309: ⋯ → Theme is Appearance
    assert.ok(/Follows the device/.test(await t.page.textContent("#ap-switch-note")), await t.page.textContent("#ap-switch-note"));
    assert.equal(await t.page.textContent("#ap-night-nm"), "Dark"); assert.ok(await t.page.locator("#ap-night-on").isVisible(), "Night: on now"); assert.equal(await t.page.textContent("#ap-day-nm"), "Light"); assert.ok(await t.page.locator("#ap-day-on").isHidden());
    await t.esc();
    await t.press("#daynight"); await wait(700);
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(250); // 1.12 b309: ⋯ → Theme is Appearance
    assert.ok(/Day by hand for now/.test(await t.page.textContent("#ap-switch-note")), "the note says a flip is holding: " + await t.page.textContent("#ap-switch-note"));
    await t.page.click('#ap-switch [data-mode="hand"]'); await wait(200);
    st = await t.s(); assert.equal(st.switchMode, "hand"); assert.equal(st.theme, "light", "By hand keeps what is on"); assert.equal(st.hold, null);
    await t.esc(); await t.page.emulateMedia({ colorScheme: "light" }); await wait(500); await t.page.emulateMedia({ colorScheme: "dark" }); await wait(500);
    assert.equal((await t.s()).theme, "light", "by hand, the system is ignored");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": Switch · On a schedule — day from / night from by a mocked clock; the minute tick switches; a manual flip holds until the schedule's next switch", async () => {
    const t = await fresh(opts, { clock: new Date("2026-09-05T15:00:00") });
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(250); // 1.12 b309: ⋯ → Theme is Appearance
    await t.page.click('#ap-switch [data-mode="schedule"]'); await wait(200);
    let st = await t.s(); assert.equal(st.switchMode, "schedule"); assert.equal(st.theme, "light", "15:00 is day: Light");
    await t.page.fill("#sch-night-at", "16:30"); await t.page.dispatchEvent("#sch-night-at", "change"); await wait(200);
    assert.ok(/Day from 07:00, night from 16:30/.test(await t.page.textContent("#ap-switch-note")), await t.page.textContent("#ap-switch-note"));
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

  await test(label + ": the picker fills one slot — 1.12 b309: Light and Dark, the slot's own kind first, then Yours; every theme for either slot, each naming its partner, and the one-tap partner", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#p-settings .body > .hero", e => e.dataset.set), "appearance", "Settings opens at Appearance");
    await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="day"]'); await t.page.waitForSelector("#p-theme[open]");
    assert.equal((await t.page.textContent("#p-theme-h")).trim(), "Day theme");
    const heads = await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent));
    assert.equal(heads.slice(0, 2).join("|"), "Light|Dark", "the day slot: light themes first"); assert.ok(!heads.includes("Yours"), "no saved themes yet: no Yours group");
    const light = await t.page.$$eval("#sw-light .swatch .nm", els => els.map(e => e.textContent)), dark = await t.page.$$eval("#sw-dark .swatch .nm", els => els.map(e => e.textContent));
    assert.equal(light.join(","), "Light,Paper,Harbor,Blush,Teletype,Sketch"); assert.equal(dark.join(","), "Dark,Midnight,Forest,Pink,Terminal,Arcade,Sunset,Dusk,Cocoa,Ember", "Sunset and Cocoa are dark themes, and sit with the dark ones");
    assert.equal(await t.page.$eval('#sw-light .swatch[data-code="T1:curated:light"] .sm', e => e.textContent), "Pairs with Dark", "a partner named on every curated kit");
    assert.equal(await t.page.$eval('#sw-dark .swatch[data-code="T1:curated:ember"] .sm', e => e.textContent), "Pairs with Cocoa");
    assert.equal(await t.page.$eval('#sw-light .swatch[data-code="T1:curated:light"]', e => e.getAttribute("aria-pressed")), "true", "the slot's theme is marked");
    assert.ok(await t.page.locator("#partner-offer").isHidden(), "no offer before a choice");
    // a dark kit for the Day slot (any theme, either slot); its partner is offered for Night
    await t.press('#sw-dark .swatch[data-code="T1:curated:midnight"]'); await wait(300);
    let st = await t.s(); assert.equal(st.day, "T1:curated:midnight"); assert.equal(st.theme, "dark", "Night is on: nothing changes on screen yet");
    assert.ok(await t.page.locator("#partner-offer").isVisible()); assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Paper for Night");
    assert.equal(await t.page.$eval("#partner-offer", e => e.previousElementSibling.id), "sw-dark", "the chip sits under the group the choice came from");
    assert.equal(await t.page.$eval('#sw-dark .swatch[data-code="T1:curated:midnight"]', e => e.getAttribute("aria-pressed")), "true");
    await t.press("#partner-use"); await wait(500);
    st = await t.s(); assert.equal(st.night, "T1:curated:paper"); assert.equal(st.theme, "paper", "Night is on, so Paper shows at once"); assert.equal(await inkOf(t.page), INK.paper);
    assert.ok(await t.page.locator("#partner-offer").isHidden(), "the offer is spent");
    // a choice whose partner the other slot already holds offers nothing
    await t.press('#sw-light .swatch[data-code="T1:curated:harbor"]'); await wait(300);
    assert.ok(await t.page.locator("#partner-offer").isVisible()); assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Forest for Night");
    await t.press("#partner-use"); await wait(300);
    await t.press('#sw-light .swatch[data-code="T1:curated:harbor"]'); await wait(300); assert.ok(await t.page.locator("#partner-offer").isHidden(), "Forest is already in Night: nothing to offer");
    await t.esc(); await wait(300);
    assert.equal(await inkOf(t.page), INK.forest, "closing the picker leaves the slot's theme on");
    await t.press("#daynight"); await wait(700); assert.equal(await inkOf(t.page), INK.harbor, "Day = Harbor");
    // the sound and the confetti follow the slot's theme like the active theme before
    const kit = await t.page.evaluate(async () => { const T = await import("./theme.js"); const s = window.__tf(); return { engine: T.curated(s.theme).sound.engine, confetti: T.curated(s.theme).confetti[0] }; });
    assert.equal(kit.engine, "whistle", "Harbor whistles (1.9)");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal((await t.page.textContent("#set-appear-k")).trim(), "Harbor · Forest", "the hub names both slots"); assert.equal((await t.page.textContent("#set-sound-k")).trim(), "On · Whistle", "and what plays now");
    assert.equal((await packOptions(t, "day"))[0], "Theme's pick (Whistle)", "Settings → Sound names the slot's theme's pack");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the builder — Use for the slot, Save to this list puts a theme under Yours, Make its partner saves a linked second theme and offers it", async () => {
    const t = await fresh(opts);
    await t.press("#list .row:first-child .check"); await wait(400);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]");
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
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="day"]'); await t.page.waitForSelector("#p-theme[open]");
    await t.press('#sw-yours .swatch[data-code="T2:d:3366FF:grotesk:marble:Blue"]'); await wait(300);
    assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Blue · day for Night");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | "));
    await t.close();
  });

  /* ---------------- 1.6: the Secret pair ---------------- */
  const openPicker = async (t, slot = "night") => { await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click(`#p-appear .slot[data-slot="${slot}"]`); await t.page.waitForSelector("#p-theme[open]"); }; // 1.12 b309: ⋯ → Theme is Appearance
  const KEY = "SuperPink"; // what the picker's Import a code takes as a key rather than a code

  await test(label + ": the Secret group shows up only after the key, and Forget puts it away and the slots back", async () => {
    const t = await fresh(opts);
    await openPicker(t);
    assert.deepEqual(await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent)), ["Dark", "Light"], "two groups before the key, the night slot's own kind first");
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
    assert.deepEqual(await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent)), ["Dark", "Light", "Secret"], "the group sits with the others");
    assert.deepEqual(await t.page.$$eval("#sw-secret .swatch .nm", els => els.map(e => e.textContent)), ["Superpink", "Birthday"]);
    assert.deepEqual(await t.page.$$eval("#sw-secret .swatch .sm", els => els.map(e => e.textContent)), ["Pairs with Birthday", "Pairs with Superpink"], "tagged as partners of each other");
    // 1.7 made the picker a sheet on touch; the group is inside it, above Yours and below the two open groups
    if (touch) assert.ok(await t.page.$eval("#p-theme", d => d.classList.contains("sheet") && !!d.querySelector(".grip") && d.querySelector("#sw-secret") !== null), "the sheet holds the group");
    assert.ok(await t.page.evaluate(() => { const b = document.querySelector("#sw-secret .swatch"); return b.parentElement.id === "sw-secret" && b.tagName === "BUTTON"; }), "its swatches are the bare buttons, not the wrapper a saved theme's × needs");
    assert.ok((await t.s()).stats.burst > 0, "a sparkle went up");
    // it persists, and Settings → Sound gains the pair's own two
    await t.esc(); await t.reload(); await t.page.waitForSelector("#list .row"); await wait(600);
    assert.equal((await t.s()).secret, true, "the key persists in the device's settings");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.deepEqual((await packOptions(t, "day")).slice(-2), ["Sparkle", "Party"], "Settings → Sound offers them once unlocked");
    await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]");
    await t.press('#sw-secret .swatch[data-code="T1:curated:superpink"]'); await wait(500);
    await t.press("#partner-use"); await wait(400);
    let st = await t.s(); assert.equal(st.night, "T1:curated:superpink"); assert.equal(st.day, "T1:curated:birthday");
    // Forget: the group goes, and any slot holding one of them goes back to its default
    await t.press("#sw-forget"); await wait(900);
    st = await t.s();
    assert.equal(st.secret, false, "forgotten"); assert.equal(st.day, "T1:curated:paper"); assert.equal(st.night, "T1:curated:terminal");
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
    assert.equal((await packOptions(t, "day")).length, 13, "Theme's pick and the twelve");
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
    assert.equal(log.join(","), "1.12,1.11,1.10,1.9,1.8,1.7,1.5,1.4,1.3,1.2,1.1,1.0");
    assert.ok(/A little something for someone in particular\.$/.test((await a.page.textContent("#log > li:nth-child(5) div")).trim()), "the 1.8 headline is the wink (fifth now that 1.12 leads)");
    const wink = await a.page.$$eval("#log > li:nth-child(5) ul li", els => els.map(e => e.textContent.replace(/^(New|Improved|Fixed)/, "").trim())); // the same 1.8 entry, fifth now that 1.12 leads
    assert.deepEqual(wink, ["If you know, you know."], "one line and a wink");
    const body = await a.page.textContent("body");
    assert.ok(!/Superpink|Birthday/i.test(body) && !/secret (theme|group|pair)|forget the secret/i.test(body), "and nothing else about it on About (the crypto page's own \"secret\" is the one in a link)");
    await a.close();
  });

  /* ---------------- 1.12 b262: the Extra category ---------------- */
  const WORD = "ChalkDust"; // the first Extra pair's word, as the import field takes it: trimmed, any case
  const giveWord = async (t, w = WORD) => { await openBuild(t); await t.page.fill("#c-import", w); await t.press("#c-import-go"); await wait(700); };

  await test(label + ": the Extra group shows up only after its word, Forget puts that pair away and its slots back, and the Secret word and its Forget touch only Secret", async () => {
    const t = await fresh(opts);
    await openPicker(t);
    assert.deepEqual(await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent)), ["Dark", "Light"], "two groups before any word, the night slot's own kind first");
    assert.ok(await t.page.locator("#sw-extra").isHidden() && await t.page.locator("#sw-extra-actions").isHidden(), "no group, no way to forget it");
    assert.deepEqual((await t.s()).extras, []);
    await giveWord(t, "  " + WORD.toUpperCase() + "  ");
    assert.deepEqual((await t.s()).extras, ["chalk"], "the pair is unlocked"); assert.equal(await t.page.inputValue("#c-import"), "", "the field is cleared");
    assert.equal(await t.page.textContent("#toast .msg"), "Found it—two more, under Extra.");
    assert.deepEqual(await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent)), ["Dark", "Light", "Extra"], "the group sits with the others; Secret is not opened by it");
    assert.deepEqual(await t.page.$$eval("#sw-extra .swatch .nm", els => els.map(e => e.textContent)), ["Chalkboard", "Whiteboard"]);
    assert.deepEqual(await t.page.$$eval("#sw-extra .swatch .sm", els => els.map(e => e.textContent)), ["Pairs with Whiteboard", "Pairs with Chalkboard"], "tagged as partners of each other");
    assert.deepEqual(await t.page.$$eval("#sw-extra-actions .chip", els => els.map(e => [e.dataset.forget, e.textContent])), [["chalk", "Forget Chalkboard & Whiteboard"]], "one quiet Forget per unlocked pair");
    assert.equal((await t.s()).secret, false, "the Secret latch is untouched");
    assert.ok((await t.s()).stats.burst > 0, "a puff went up");
    // it persists, and Settings → Sound gains the pair's own two
    await t.esc(); await t.reload(); await t.page.waitForSelector("#list .row"); await wait(600);
    assert.deepEqual((await t.s()).extras, ["chalk"], "the pair persists in the device's settings");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.deepEqual((await packOptions(t, "day")).slice(-2), ["Chalk", "Marker"], "Settings → Sound offers them once unlocked, and not the Secret pair's");
    await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]");
    await t.press('#sw-extra .swatch[data-code="T1:curated:chalkboard"]'); await wait(500);
    assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Whiteboard for Day", "each names the other");
    await t.press("#partner-use"); await wait(400);
    let st = await t.s(); assert.equal(st.night, "T1:curated:chalkboard"); assert.equal(st.day, "T1:curated:whiteboard");
    // Forget the pair: the group goes, and any slot holding one of them goes back to its default
    await t.press('#sw-extra-actions .chip[data-forget="chalk"]'); await wait(900);
    st = await t.s();
    assert.deepEqual(st.extras, [], "forgotten"); assert.equal(st.day, "T1:curated:paper"); assert.equal(st.night, "T1:curated:terminal");
    assert.equal(st.field, false, "the ground went with it");
    assert.ok(await t.page.locator("#sw-extra").isHidden(), "and the group");
    assert.equal(await t.page.textContent("#toast .msg"), "Forgotten on this device. The word still works.");
    assert.equal(await t.page.evaluate(() => "extras" in JSON.parse(localStorage.getItem("tf/v2/meta")).device), false, "the key is removed rather than left empty");
    assert.equal(await t.page.textContent("#finale span"), "That's the list.", "and the finale line is the ordinary one");
    // the kit's own code, pasted while the pair is forgotten, is the same word spelled out: it unlocks and then applies
    await giveWord(t, "T1:curated:whiteboard");
    st = await t.s(); assert.deepEqual(st.extras, ["chalk"], "the code unlocks the pair");
    // the Secret word still does exactly what it did, and its Forget clears only Secret
    await giveWord(t, "SuperPink");
    st = await t.s(); assert.equal(st.secret, true); assert.deepEqual(st.extras, ["chalk"], "the Secret unlock leaves the Extra pair alone");
    assert.deepEqual(await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent)), ["Dark", "Light", "Secret", "Extra"], "both hidden groups, Secret first");
    await t.esc(); await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.deepEqual((await packOptions(t, "day")).slice(-4), ["Sparkle", "Party", "Chalk", "Marker"], "Settings → Sound: both pairs' engines, Secret first");
    await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]");
    await t.press('#sw-secret .swatch[data-code="T1:curated:superpink"]'); await wait(400);
    await t.press('#sw-extra .swatch[data-code="T1:curated:chalkboard"]'); await wait(400);
    st = await t.s(); assert.equal(st.night, "T1:curated:chalkboard", "the last choice holds the slot");
    await t.press('#sw-secret .swatch[data-code="T1:curated:superpink"]'); await wait(400);
    await t.press("#sw-forget"); await wait(900);
    st = await t.s(); assert.equal(st.secret, false, "Secret forgotten"); assert.deepEqual(st.extras, ["chalk"], "the Extra pair is still unlocked");
    assert.equal(st.night, "T1:curated:terminal", "the slot that held Superpink is back to its default");
    assert.ok(await t.page.locator("#sw-secret").isHidden() && !(await t.page.locator("#sw-extra").isHidden()), "Secret hidden, Extra still showing");
    await t.press('#sw-extra .swatch[data-code="T1:curated:whiteboard"]'); await wait(400);
    await t.press('#sw-extra-actions .chip[data-forget="chalk"]'); await wait(900);
    st = await t.s(); assert.deepEqual(st.extras, []); assert.equal(st.night, "T1:curated:terminal"); assert.equal(st.secret, false);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; "));
    await t.close();
  });

  await test(label + ": both Extra themes in both slots, the flip between them, the material — the hand, the ground, the strike, the check — and a finale each", async () => {
    const t = await fresh(opts);
    await openPicker(t, "night");
    await giveWord(t);
    await t.press('#sw-extra .swatch[data-code="T1:curated:chalkboard"]'); await wait(400);
    await t.press("#partner-use"); await wait(400);
    await t.esc(); await wait(800);
    let st = await t.s(); assert.equal(st.theme, "chalkboard"); assert.equal(st.field, true, "Chalkboard brings its ground");
    const face = () => t.page.evaluate(() => { const c = getComputedStyle(document.querySelector("#list .row .tx")); return [c.fontFamily, c.fontWeight]; });
    let f = await face(); assert.ok(/Caveat/.test(f[0]) && f[1] === "500", "Chalkboard is set in Caveat at 500 (chalk): " + f);
    assert.equal(await t.page.$eval('meta[name="theme-color"]', e => e.content.toUpperCase()), "#1C2724", "the theme-color meta follows it like any kit");
    const ground = await t.page.evaluate(() => { const el = document.getElementById("field"), c = getComputedStyle(el); return { cls: el.className, hidden: el.hidden, img: c.backgroundImage.slice(0, 30), z: +c.zIndex, glow: +getComputedStyle(document.getElementById("glow")).zIndex, shell: +getComputedStyle(document.getElementById("shell")).zIndex, ev: c.pointerEvents, anim: c.animationName, kids: el.children.length }; });
    assert.equal(ground.cls, "ground"); assert.equal(ground.hidden, false); assert.ok(/^url\("data:image\/svg\+xml/.test(ground.img), "the ground is a data: picture: " + ground.img);
    assert.ok(ground.z > ground.glow && ground.z < ground.shell && ground.ev === "none", "above the glow, behind the words, not in the way: " + JSON.stringify(ground));
    assert.equal(ground.anim, "none", "and it does not move"); assert.equal(ground.kids, 0, "no elements, one picture");
    assert.ok(await t.page.evaluate(() => !!document.querySelector('link[data-extrafx][href^="extrafx.css?v="]')), "the ground's stylesheet came with the module, by build");
    // the strike: a chalk line with a torn edge, thicker than a rule; the box takes a chalk check rather than a fill
    await t.press("#list .row:first-child .check"); await wait(700);
    let ink = await t.page.$eval("#list .row.done .ink", e => { const c = getComputedStyle(e); return { h: parseFloat(c.height), mask: (c.maskImage || c.webkitMaskImage || "").slice(0, 20), blend: c.mixBlendMode, op: c.opacity, anim: c.animationName }; });
    assert.ok(ink.h >= 4 && /^url\("data:image/.test(ink.mask) && ink.blend === "normal" && ink.op === "1" && ink.anim === "none", "a chalk line: " + JSON.stringify(ink));
    let box = await t.page.$eval("#list .row.done .box", e => ({ path: getComputedStyle(e.querySelector("path")).stroke, sw: getComputedStyle(e.querySelector("path")).strokeWidth, bg: getComputedStyle(e).backgroundColor }));
    assert.equal(box.path, "rgb(244, 241, 232)", "the check is chalk"); assert.equal(box.sw, "3.6px"); assert.equal(box.bg, "rgb(34, 48, 44)", "on the board, not a fill");
    // uncheck brushes it away: the exit is slower than the entry and fades
    await t.press("#list .row:first-child .check"); await wait(80);
    ink = await t.page.$eval("#list .row:not(.done) .ink", e => { const c = getComputedStyle(e); return { dur: c.transitionDuration, op: c.opacity }; });
    assert.ok(/0\.42s/.test(ink.dur) && +ink.op < 1, "brushed away over .42s, fading: " + JSON.stringify(ink));
    await wait(600);
    // the finale: the eraser on the confetti canvas, dust, and the line
    for (const b of await t.page.$$("#list .row:not(.done) .check")) { await b.click(); await wait(320); }
    await wait(1500);
    assert.equal(await t.page.textContent("#finale span"), "Class dismissed.");
    st = await t.s(); assert.ok(st.stats.finish >= 1 && st.stats.volley >= 1, "the finale fired: " + JSON.stringify(st.stats));
    assert.equal(await t.page.$eval("#finale span", e => getComputedStyle(e).animationName), "tf-write", "the line writes itself");
    const painted = await t.page.evaluate(() => { const c = document.getElementById("fx"); const g = c.getContext("2d"); const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 400) if (d[i] > 0) n++; return n; });
    assert.ok(painted > 0, "the eraser is on the canvas mid-sweep");
    // the flip: Whiteboard, the same hand with a marker in it, a fat translucent strike that smears away
    for (const b of await t.page.$$("#list .row.done .check")) { await b.click(); await wait(240); }
    await t.press("#daynight"); await wait(900);
    st = await t.s(); assert.equal(st.theme, "whiteboard"); assert.equal(st.field, true, "its own ground");
    f = await face(); assert.ok(/Caveat/.test(f[0]) && f[1] === "700", "Whiteboard is Caveat at 700 (marker): " + f);
    assert.equal(await t.page.$eval('meta[name="theme-color"]', e => e.content.toUpperCase()), "#FBFBFA");
    await t.press("#list .row:first-child .check"); await wait(700);
    ink = await t.page.$eval("#list .row.done .ink", e => { const c = getComputedStyle(e); return { h: parseFloat(c.height), blend: c.mixBlendMode, mask: (c.maskImage || c.webkitMaskImage || "").slice(0, 20) }; });
    assert.ok(ink.h >= 9 && ink.blend === "multiply" && /^url\("data:image/.test(ink.mask), "a fat dry-erase stroke, translucent over the words: " + JSON.stringify(ink));
    box = await t.page.$eval("#list .row.done .box", e => ({ path: getComputedStyle(e.querySelector("path")).stroke, bg: getComputedStyle(e).backgroundColor }));
    assert.equal(box.path, "rgb(36, 87, 197)", "a marker check"); assert.equal(box.bg, "rgb(251, 251, 250)", "on the board");
    await t.press("#list .row:first-child .check"); await wait(80);
    assert.ok(/0\.5s/.test(await t.page.$eval("#list .row:not(.done) .ink", e => getComputedStyle(e).transitionDuration)), "smeared away over half a second");
    await wait(700);
    const before = (await t.s()).stats.volley;
    for (const b of await t.page.$$("#list .row:not(.done) .check")) { await b.click(); await wait(320); }
    await wait(1200);
    assert.equal(await t.page.textContent("#finale span"), "Meeting's over.");
    assert.ok((await t.s()).stats.volley > before, "its own check went up");
    // either one goes in either slot: Whiteboard for Night too
    await openPicker(t, "night");
    await t.press('#sw-extra .swatch[data-code="T1:curated:whiteboard"]'); await wait(500);
    await t.esc(); await wait(700);
    assert.equal((await t.s()).night, "T1:curated:whiteboard", "a light theme in the Night slot, like any other");
    assert.equal(await inkOf(t.page), "#FBFBFA");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; ")); assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty);
    await t.close();
    // reduced motion: the ground is there (it never moved), the line lands without writing itself, and the finale draws nothing
    const r = await fresh(opts, { reducedMotion: "reduce" });
    await openPicker(r); await giveWord(r);
    await r.press('#sw-extra .swatch[data-code="T1:curated:chalkboard"]'); await wait(400);
    await r.esc(); await wait(700);
    assert.equal(await r.page.$eval("#field", e => e.className), "ground", "the ground is there");
    for (const b of await r.page.$$("#list .row:not(.done) .check")) { await b.click(); await wait(300); }
    await wait(1400);
    assert.equal(await r.page.textContent("#finale span"), "Class dismissed.", "the line still lands");
    assert.equal(await r.page.$eval("#finale span", e => getComputedStyle(e).animationName), "none", "and stands still");
    const drew = await r.page.evaluate(() => { const c = document.getElementById("fx"); const g = c.getContext("2d"); const d = g.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4000) if (d[i] > 0) return true; return false; });
    assert.equal(drew, false, "no eraser under reduced motion, like every other effect");
    assert.equal(r.errors.length, 0, r.errors.join("; "));
    await r.close();
  });

  await test(label + ": the Extra ground costs no frames at rest, and the grain rule holds as rendered — every pixel of both grounds sits inside its kit's grain", async () => {
    const t = await fresh(opts, { init: "window.__raf = 0; (function(){ var r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = function (cb) { window.__raf++; return r(cb); }; })();" });
    await openPicker(t); await giveWord(t);
    await t.press('#sw-extra .swatch[data-code="T1:curated:chalkboard"]'); await wait(400);
    await t.esc(); await wait(900);
    const css = await t.page.evaluate(async () => ({ ground: await (await fetch("extrafx.css")).text(), shell: await (await fetch("styles.css")).text() }));
    assert.ok(!/#field\.ground/.test(css.shell), "no rule for the ground is in the render-blocking stylesheet every device waits for");
    assert.ok(/#field\.ground\{/.test(css.ground), "it is in the module's own");
    let settled = 0;
    for (let i = 0; i < 40 && settled < 2; i++) { const a0 = await t.page.evaluate(() => window.__raf); await wait(500); settled = (await t.page.evaluate(() => window.__raf)) - a0 === 0 ? settled + 1 : 0; }
    assert.ok(settled >= 2, "the page went quiet within twenty seconds");
    const raf0 = await t.page.evaluate(() => window.__raf); await wait(3000); const raf1 = await t.page.evaluate(() => window.__raf);
    assert.equal(raf1 - raf0, 0, "no frame loop while the ground is up: " + (raf1 - raf0) + " requestAnimationFrame calls in three seconds");
    assert.deepEqual(await t.page.$$eval("#field, #field *", els => els.map(e => getComputedStyle(e).animationName)), ["none"], "nothing on the ground animates");
    // the grain rule, measured the way tools/grain.mjs measures it: the picture the page shows, rasterised at this viewport
    const rows = await t.page.evaluate(async () => {
      const T = await import("./theme.js"), X = await import("./extrafx.js");
      const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const hexLum = h => lum(...[1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
      const out = [];
      for (const kit of T.EXTRA) {
        const img = new Image(); img.src = X.groundUrl(kit); await img.decode();
        const w = innerWidth, h = innerHeight, c = document.createElement("canvas"); c.width = w; c.height = h;
        const g = c.getContext("2d", { willReadFrequently: true }); g.fillStyle = kit.grain[0]; g.fillRect(0, 0, w, h);
        const s = Math.max(w / img.width, h / img.height); g.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
        const d = g.getImageData(0, 0, w, h).data; let lo = 1, hi = 0;
        for (let i = 0; i < d.length; i += 4) { const L = lum(d[i], d[i + 1], d[i + 2]); if (L < lo) lo = L; if (L > hi) hi = L; }
        const gl = kit.grain.map(hexLum);
        const extreme = kit.base === "dark" ? hi : lo, cr = tok => (Math.max(hexLum(kit.colors[tok]), extreme) + 0.05) / (Math.min(hexLum(kit.colors[tok]), extreme) + 0.05);
        out.push({ id: kit.id, lo, hi, gLo: Math.min(...gl), gHi: Math.max(...gl), text: cr("text"), accent: cr("accent"), dim: cr("dim"), hair: cr("hairSolid") });
      }
      return out;
    });
    for (const r of rows) {
      assert.ok(r.lo >= r.gLo - 0.0065 && r.hi <= r.gHi + 0.0065, `${r.id}: rendered ${r.lo.toFixed(4)}…${r.hi.toFixed(4)} is outside its grain ${r.gLo.toFixed(4)}…${r.gHi.toFixed(4)} (one sRGB step of green at the light end is 0.0063)`);
      assert.ok(r.text >= 4.5 && r.dim >= 4.5 && r.accent >= 3 && r.hair >= 3, `${r.id}: on the ground as drawn, text ${r.text.toFixed(2)} dim ${r.dim.toFixed(2)} accent ${r.accent.toFixed(2)} hairline ${r.hair.toFixed(2)}`);
    }
    console.log("      grain as rendered: " + rows.map(r => `${r.id} ${r.lo.toFixed(4)}…${r.hi.toFixed(4)} in ${r.gLo.toFixed(4)}…${r.gHi.toFixed(4)}, text ${r.text.toFixed(2)}`).join("; "));
    // a hidden tab has nothing to pause, and coming back changes nothing
    await t.page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); }); await wait(200);
    assert.equal(await t.page.$eval("#field", e => e.className), "ground");
    await t.page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); }); await wait(200);
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": a device that never gives a word asks for nothing of the Extra pair and is never told about it", async () => {
    const t = await fresh(opts);
    await openPicker(t); await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal((await packOptions(t, "day")).length, 13, "Theme's pick and the twelve");
    await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="help"]'); await t.page.waitForSelector("#p-help[open]"); await wait(300);
    const help = await t.page.textContent("#p-help");
    assert.ok(!/Chalkboard|Whiteboard|Extra theme|Chalkdust/i.test(help), "How it works says nothing about it");
    await t.esc(); await wait(300);
    const asked = await t.page.evaluate(() => performance.getEntriesByType("resource").map(r => r.name).filter(n => /extrafx|packs-extra|caveat/.test(n)));  // the two modules, the ground's stylesheet and the face
    assert.deepEqual(asked, [], "nothing of the pair is fetched: " + asked);
    const total = await t.page.evaluate(() => performance.getEntriesByType("resource").length);
    assert.ok(total > 0, "the network log is the instrument: " + total + " requests, none of them the pair's");
    assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty); assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
    const a = await fresh(opts, { url: BASE + "about.html", list: false });
    await a.page.waitForFunction(() => /build/.test(document.getElementById("version").textContent), null, { timeout: 5000, polling: 100 });
    const body = await a.page.textContent("body");
    assert.ok(!/Chalkboard|Whiteboard|Chalkdust/i.test(body) && !/extra (theme|group|pair)/i.test(body), "nothing about it on About or in the changelog");
    await a.close();
  });

  /* ---------------- 1.12 b268: the Extra category, pair two ---------------- */
  const WORD2 = "SawDust"; // the wood pair's word, taken the same way

  await test(label + ": the second pair opens beside the first, neither word opens the other, and Forget takes one and leaves the other", async () => {
    const t = await fresh(opts);
    await openPicker(t);
    await giveWord(t, "  " + WORD2.toUpperCase() + "  ");
    assert.deepEqual((await t.s()).extras, ["wood"], "the wood pair alone"); assert.equal(await t.page.inputValue("#c-import"), "", "the field is cleared");
    assert.equal(await t.page.textContent("#toast .msg"), "Found it—two more, under Extra.");
    assert.deepEqual(await t.page.$$eval("#sw-extra .swatch .nm", els => els.map(e => e.textContent)), ["Bark", "Char"], "and the boards are not among them");
    assert.deepEqual(await t.page.$$eval("#sw-extra .swatch .sm", els => els.map(e => e.textContent)), ["Pairs with Char", "Pairs with Bark"]);
    assert.deepEqual(await t.page.$$eval("#sw-extra-actions .chip", els => els.map(e => e.textContent)), ["Forget Bark & Char"], "one Forget, for this pair");
    assert.equal((await t.s()).secret, false, "the Secret latch is untouched");
    // the other word now: both pairs in one group, in the order they shipped, with a Forget each
    await giveWord(t, "chalkdust");
    assert.deepEqual((await t.s()).extras, ["chalk", "wood"], "a device holds both, read back in the table's order whichever order the words arrived");
    assert.deepEqual(await t.page.$$eval("#sw-extra .swatch .nm", els => els.map(e => e.textContent)), ["Chalkboard", "Whiteboard", "Bark", "Char"], "four kits, a pair at a time");
    assert.deepEqual(await t.page.$$eval("#sw-extra-actions .chip", els => els.map(e => [e.dataset.forget, e.textContent])), [["chalk", "Forget Chalkboard & Whiteboard"], ["wood", "Forget Bark & Char"]], "a Forget per pair");
    assert.deepEqual(await t.page.$$eval("#p-theme h3:not([hidden])", els => els.map(e => e.textContent)), ["Dark", "Light", "Extra"], "one group, still; Secret is opened by neither");
    await t.esc(); await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.deepEqual((await packOptions(t, "day")).slice(-4), ["Chalk", "Marker", "Carve", "Burn"], "Settings → Sound: both pairs' engines, and not the Secret pair's");
    await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]'); await t.page.waitForSelector("#p-theme[open]");
    // a slot from each pair, then forget one: only that pair's slot goes back
    await t.press('#sw-extra .swatch[data-code="T1:curated:char"]'); await wait(500);
    await t.press("#partner-use"); await wait(500);
    let st = await t.s(); assert.equal(st.night, "T1:curated:char"); assert.equal(st.day, "T1:curated:bark");
    await t.press('#sw-extra .swatch[data-code="T1:curated:chalkboard"]'); await wait(500);
    st = await t.s(); assert.equal(st.night, "T1:curated:chalkboard"); assert.equal(st.day, "T1:curated:bark", "the day slot still holds the other pair's");
    await t.press('#sw-extra-actions .chip[data-forget="wood"]'); await wait(900);
    st = await t.s();
    assert.deepEqual(st.extras, ["chalk"], "the wood pair is forgotten and the boards are not");
    assert.equal(st.day, "T1:curated:paper", "the slot that held Bark is back to its default");
    assert.equal(st.night, "T1:curated:chalkboard", "and the slot that held the other pair's kit is untouched");
    assert.deepEqual(await t.page.$$eval("#sw-extra .swatch .nm", els => els.map(e => e.textContent)), ["Chalkboard", "Whiteboard"], "only the pair that is left");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.extras.join(","), "chalk"), "chalk", "the key holds what is left rather than being emptied");
    // and it persists, and a kit's own code re-opens its pair
    await t.esc(); await t.reload(); await t.page.waitForSelector("#list .row"); await wait(600);
    assert.deepEqual((await t.s()).extras, ["chalk"]);
    await openPicker(t); await giveWord(t, "T1:curated:char");
    assert.deepEqual((await t.s()).extras, ["chalk", "wood"], "the code unlocks its own pair and no other");
    await t.press('#sw-extra-actions .chip[data-forget="chalk"]'); await wait(900);
    st = await t.s(); assert.deepEqual(st.extras, ["wood"]); assert.equal(st.night, "T1:curated:terminal", "the board's slot is back");
    await t.press('#sw-extra-actions .chip[data-forget="wood"]'); await wait(900);
    assert.equal(await t.page.evaluate(() => "extras" in JSON.parse(localStorage.getItem("tf/v2/meta")).device), false, "the last pair forgotten removes the key");
    assert.ok(await t.page.locator("#sw-extra").isHidden(), "and the group");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; "));
    await t.close();
  });

  await test(label + ": both wood kits in both slots, the flip, the hand, the plank, the gouge, the burn and the check — and a finale each", async () => {
    const t = await fresh(opts);
    await openPicker(t, "night");
    await giveWord(t, WORD2);
    await t.press('#sw-extra .swatch[data-code="T1:curated:bark"]'); await wait(400);
    await t.press("#partner-use"); await wait(400);
    await t.esc(); await wait(800);
    if ((await t.s()).theme !== "bark") { await t.press("#daynight"); await wait(1000); }
    let st = await t.s(); assert.equal(st.theme, "bark"); assert.equal(st.field, true, "Bark brings its plank");
    const face = () => t.page.evaluate(() => { const c = getComputedStyle(document.querySelector("#list .row .tx")); return [c.fontFamily, c.fontWeight, c.textShadow]; });
    let f = await face();
    assert.ok(/Lora/.test(f[0]) && f[1] === "700", "Bark is set in Lora, one of the thirteen the app already has: " + f);
    assert.ok(/rgba?\([^)]*\)\s+0px\s+-1px|-1px/.test(f[2]) && /1px/.test(f[2]), "and the words are carved: a highlight over a shadow — " + f[2]);
    assert.equal(await t.page.$eval('meta[name="theme-color"]', e => e.content.toUpperCase()), "#F3E7D3");
    const ground = await t.page.evaluate(() => { const el = document.getElementById("field"), c = getComputedStyle(el); return { cls: el.className, hidden: el.hidden, img: c.backgroundImage.slice(0, 30), z: +c.zIndex, glow: +getComputedStyle(document.getElementById("glow")).zIndex, shell: +getComputedStyle(document.getElementById("shell")).zIndex, ev: c.pointerEvents, anim: c.animationName, kids: el.children.length }; });
    assert.equal(ground.cls, "ground"); assert.equal(ground.hidden, false); assert.ok(/^url\("data:image\/svg\+xml/.test(ground.img), "the plank is a data: picture: " + ground.img);
    assert.ok(ground.z > ground.glow && ground.z < ground.shell && ground.ev === "none", "above the glow, behind the words: " + JSON.stringify(ground));
    assert.equal(ground.anim, "none"); assert.equal(ground.kids, 0, "no elements, one picture");
    // the gouge: a channel, thicker than a rule, with a torn end and no blend
    await t.press("#list .row:first-child .check"); await wait(700);
    let ink = await t.page.$eval("#list .row.done .ink", e => { const c = getComputedStyle(e); return { h: parseFloat(c.height), mask: (c.maskImage || c.webkitMaskImage || "").slice(0, 20), blend: c.mixBlendMode, img: c.backgroundImage.slice(0, 22), anim: c.animationName }; });
    assert.ok(ink.h >= 9 && /^url\("data:image/.test(ink.mask) && ink.blend === "normal" && /linear-gradient/.test(ink.img) && ink.anim === "none", "a gouged channel: " + JSON.stringify(ink));
    let box = await t.page.$eval("#list .row.done .box", e => ({ path: getComputedStyle(e.querySelector("path")).stroke, sw: getComputedStyle(e.querySelector("path")).strokeWidth, bg: getComputedStyle(e).backgroundColor }));
    assert.equal(box.path, "rgb(90, 68, 50)", "a carved check"); assert.equal(box.sw, "3.4px"); assert.equal(box.bg, "rgb(236, 223, 200)", "on the plank a shade warmer, not a fill");
    await t.press("#list .row:first-child .check"); await wait(80);
    ink = await t.page.$eval("#list .row:not(.done) .ink", e => { const c = getComputedStyle(e); return { dur: c.transitionDuration, op: c.opacity }; });
    assert.ok(/0\.46s/.test(ink.dur) && +ink.op < 1, "the shavings are brushed back over .46s: " + JSON.stringify(ink));
    await wait(700);
    // the finale: the chisel on the confetti canvas, and the line carving itself in
    for (const b of await t.page.$$("#list .row:not(.done) .check")) { await b.click(); await wait(320); }
    await wait(1500);
    assert.equal(await t.page.textContent("#finale span"), "Whittled down.");
    st = await t.s(); assert.ok(st.stats.finish >= 1 && st.stats.volley >= 1, "the finale fired: " + JSON.stringify(st.stats));
    assert.equal(await t.page.$eval("#finale span", e => getComputedStyle(e).animationName), "tf-write", "the line carves itself in");
    assert.ok(await t.page.evaluate(() => { const c = document.getElementById("fx"), g = c.getContext("2d"), d = g.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 400) if (d[i] > 0) return true; return false; }), "the chisel is on the canvas mid-cut");
    // the flip: Char, the same hand with a hot tip, a strike born ember that cools to char and holds
    for (const b of await t.page.$$("#list .row.done .check")) { await b.click(); await wait(240); }
    await t.press("#daynight"); await wait(900);
    st = await t.s(); assert.equal(st.theme, "char"); assert.equal(st.field, true, "its own plank");
    f = await face(); assert.ok(/Lora/.test(f[0]) && f[1] === "700", "Char is Bark's hand: " + f);
    assert.equal(await t.page.$eval('meta[name="theme-color"]', e => e.content.toUpperCase()), "#1B1512");
    const burnAt = () => t.page.$eval("#list .row.done .ink", e => { const a = getComputedStyle(e, "::after"); return { op: +a.opacity, bg: a.backgroundImage.slice(0, 22), cool: getComputedStyle(e.parentElement).transitionDuration }; });
    await t.press("#list .row:first-child .check"); await wait(90);
    let hot = await burnAt();
    assert.ok(hot.op > 0.35 && /linear-gradient/.test(hot.bg) && /1\.5s/.test(hot.cool), "the line is born ember: " + JSON.stringify(hot));
    await wait(2200);
    let cold = await burnAt();
    assert.equal(cold.op, 0, "and it has cooled to char: " + JSON.stringify(cold));
    assert.equal(await t.page.$eval("#list .row.done .ink", e => getComputedStyle(e).backgroundColor), "rgb(85, 74, 65)", "the char underneath is the strike itself");
    // and it stays cooled: a relayout rebuilds the overlay, and nothing re-fires
    await t.page.setViewportSize(opts.viewport.width === 1440 ? { width: 1200, height: 860 } : { width: 360, height: 800 }); await wait(700);
    assert.equal((await burnAt()).op, 0, "a resize rebuilds the strike and does not light it again");
    await t.page.setViewportSize(opts.viewport); await wait(700);
    box = await t.page.$eval("#list .row.done .box", e => ({ path: getComputedStyle(e.querySelector("path")).stroke, bg: getComputedStyle(e).backgroundColor }));
    assert.equal(box.path, "rgb(255, 138, 60)", "an ember check"); assert.equal(box.bg, "rgb(44, 34, 27)");
    await t.press("#list .row:first-child .check"); await wait(90);
    assert.equal(await t.page.$eval("#list .row:not(.done) .ink", e => +getComputedStyle(e, "::after").opacity), 0, "and sanding it back does not light it either");
    await wait(700);
    const before = (await t.s()).stats.volley;
    for (const b of await t.page.$$("#list .row:not(.done) .check")) { await b.click(); await wait(320); }
    await wait(1400);
    assert.equal(await t.page.textContent("#finale span"), "Burned through it.");
    assert.ok((await t.s()).stats.volley > before, "its own ember went up");
    assert.deepEqual(await t.page.$$eval("#finale.on span", els => els.map(e => getComputedStyle(e).animationName)), ["tf-write, tf-scorch"], "the line burns itself in and the scorch cools behind it");
    await wait(2200);
    // either one goes in either slot: Char for Day
    await openPicker(t, "day");
    await t.press('#sw-extra .swatch[data-code="T1:curated:char"]'); await wait(500);
    await t.esc(); await wait(700);
    assert.equal((await t.s()).day, "T1:curated:char", "a dark theme in the Day slot, like any other");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; ")); assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty);
    await t.close();
    // reduced motion: the plank is there, the line lands already cooled, and nothing is drawn or smoked
    const r = await fresh(opts, { reducedMotion: "reduce" });
    await openPicker(r); await giveWord(r, WORD2);
    await r.press('#sw-extra .swatch[data-code="T1:curated:char"]'); await wait(400);
    await r.esc(); await wait(700);
    if ((await r.s()).theme !== "char") { await r.press("#daynight"); await wait(1000); }
    assert.equal(await r.page.$eval("#field", e => e.className), "ground", "the plank is there");
    await r.press("#list .row:first-child .check"); await wait(90);
    assert.equal(await r.page.$eval("#list .row.done .ink", e => +getComputedStyle(e, "::after").opacity), 0, "the line is born cooled — there is no heat to watch fall");
    await wait(600);
    for (const b of await r.page.$$("#list .row:not(.done) .check")) { await b.click(); await wait(300); }
    await wait(1600);
    assert.equal(await r.page.textContent("#finale span"), "Burned through it.", "the line still lands");
    assert.equal(await r.page.$eval("#finale span", e => getComputedStyle(e).animationName), "none", "and stands still");
    assert.equal(await r.page.$eval("#field", e => e.children.length), 0, "no smoke under reduced motion");
    assert.equal(await r.page.evaluate(() => { const c = document.getElementById("fx"), g = c.getContext("2d"), d = g.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4000) if (d[i] > 0) return 1; return 0; }), 0, "and nothing on the canvas, like every other effect");
    assert.equal(r.errors.length, 0, r.errors.join("; "));
    await r.close();
  });

  await test(label + ": the wood planks cost no frames at rest, the grain rule holds as rendered, and the smoke goes up once and takes itself off", async () => {
    const t = await fresh(opts, { init: "window.__raf = 0; (function(){ var r = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = function (cb) { window.__raf++; return r(cb); }; })();" });
    await openPicker(t); await giveWord(t, WORD2);
    await t.press('#sw-extra .swatch[data-code="T1:curated:bark"]'); await wait(400);
    await t.esc(); await wait(900);
    if ((await t.s()).theme !== "bark") { await t.press("#daynight"); await wait(1000); }
    assert.ok(!/#field\.ground/.test(await t.page.evaluate(() => fetch("styles.css").then(r => r.text()))), "no rule for the ground is in the render-blocking stylesheet every device waits for");
    let settled = 0;
    for (let i = 0; i < 40 && settled < 2; i++) { const a0 = await t.page.evaluate(() => window.__raf); await wait(500); settled = (await t.page.evaluate(() => window.__raf)) - a0 === 0 ? settled + 1 : 0; }
    assert.ok(settled >= 2, "the page went quiet within twenty seconds");
    const raf0 = await t.page.evaluate(() => window.__raf); await wait(3000); const raf1 = await t.page.evaluate(() => window.__raf);
    assert.equal(raf1 - raf0, 0, "no frame loop while the plank is up: " + (raf1 - raf0) + " requestAnimationFrame calls in three seconds");
    assert.deepEqual(await t.page.$$eval("#field, #field *", els => els.map(e => getComputedStyle(e).animationName)), ["none"], "nothing on the plank animates");
    // the grain rule as rendered, at this viewport, for every Extra kit there is
    const rows = await t.page.evaluate(async () => {
      const T = await import("./theme.js"), X = await import("./extrafx.js");
      const lum = (r, g, b) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const hexLum = h => lum(...[1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
      const out = [];
      for (const kit of T.EXTRA) {
        const img = new Image(); img.src = X.groundUrl(kit); await img.decode();
        const w = innerWidth, h = innerHeight, c = document.createElement("canvas"); c.width = w; c.height = h;
        const g = c.getContext("2d", { willReadFrequently: true }); g.fillStyle = kit.grain[0]; g.fillRect(0, 0, w, h);
        const s = Math.max(w / img.width, h / img.height); g.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
        const d = g.getImageData(0, 0, w, h).data; let lo = 1, hi = 0;
        for (let i = 0; i < d.length; i += 4) { const L = lum(d[i], d[i + 1], d[i + 2]); if (L < lo) lo = L; if (L > hi) hi = L; }
        const gl = kit.grain.map(hexLum);
        const extreme = kit.base === "dark" ? hi : lo, cr = tok => (Math.max(hexLum(kit.colors[tok]), extreme) + 0.05) / (Math.min(hexLum(kit.colors[tok]), extreme) + 0.05);
        out.push({ id: kit.id, lo, hi, gLo: Math.min(...gl), gHi: Math.max(...gl), text: cr("text"), accent: cr("accent"), dim: cr("dim"), hair: cr("hairSolid") });
      }
      return out;
    });
    assert.equal(rows.length, 4, "every Extra kit, both pairs");
    for (const r of rows) {
      assert.ok(r.lo >= r.gLo - 0.0065 && r.hi <= r.gHi + 0.0065, `${r.id}: rendered ${r.lo.toFixed(4)}…${r.hi.toFixed(4)} is outside its grain ${r.gLo.toFixed(4)}…${r.gHi.toFixed(4)}`);
      assert.ok(r.text >= 4.5 && r.dim >= 4.5 && r.accent >= 3 && r.hair >= 3, `${r.id}: on the ground as drawn, text ${r.text.toFixed(2)} dim ${r.dim.toFixed(2)} accent ${r.accent.toFixed(2)} hairline ${r.hair.toFixed(2)}`);
    }
    console.log("      grain as rendered: " + rows.map(r => `${r.id} ${r.lo.toFixed(4)}…${r.hi.toFixed(4)} in ${r.gLo.toFixed(4)}…${r.gHi.toFixed(4)}, text ${r.text.toFixed(2)}`).join("; "));
    // the smoke: Char's finale puts one wisp through the layer, moved by transform and opacity alone, and it goes
    await openPicker(t); await t.press('#sw-extra .swatch[data-code="T1:curated:char"]'); await wait(400);
    await t.esc(); await wait(800);
    if ((await t.s()).theme !== "char") { await t.press("#daynight"); await wait(1000); }
    for (const b of await t.page.$$("#list .row:not(.done) .check")) { await b.click(); await wait(320); }
    await t.page.waitForFunction(() => document.querySelectorAll("#field .wisp").length === 1, null, { timeout: 6000, polling: 60 });
    const wisp = await t.page.$eval("#field .wisp", e => { const c = getComputedStyle(e); return { anim: c.animationName, it: c.animationIterationCount, props: c.animationName ? "" : "none", img: c.backgroundImage.slice(0, 16) }; });
    assert.equal(wisp.anim, "tf-wisp"); assert.equal(wisp.it, "1", "once"); assert.ok(/radial-gradient/.test(wisp.img), "a still picture moved by transform and opacity");
    await t.page.waitForFunction(() => document.querySelectorAll("#field .wisp").length === 0, null, { timeout: 9000, polling: 100 });
    assert.equal(await t.page.$eval("#field", e => e.children.length), 0, "the layer is empty again at rest");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; "));
    await t.close();
  });

  await test(label + ": a device with one pair's word is told nothing of the other, and fetches nothing extra for it", async () => {
    const t = await fresh(opts);
    await openPicker(t); await giveWord(t, WORD2);
    assert.deepEqual(await t.page.$$eval("#p-theme", els => els.map(e => e.textContent.match(/Chalkboard|Whiteboard|Chalkdust/i) || "")), [""], "the picker never names the other pair");
    await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    const packs = await packOptions(t, "day");
    assert.equal(packs.length, 15, "Theme's pick, the twelve, and this pair's two — not the other pair's and not Secret's: " + packs.join(", "));
    assert.ok(!packs.includes("Chalk") && !packs.includes("Marker") && !packs.includes("Sparkle"), packs.join(", "));
    await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="help"]'); await t.page.waitForSelector("#p-help[open]"); await wait(300);
    assert.ok(!/\bBark\b|\bChar\b|Sawdust|Chalkboard|Extra theme/i.test(await t.page.textContent("#p-help")), "How it works says nothing about any of it");
    await t.esc(); await wait(300);
    // the pair adds no file of its own: what a device on it fetches is the two modules the category already had
    await t.press('#sw-extra .swatch[data-code="T1:curated:bark"]').catch(() => {});
    await openPicker(t); await t.press('#sw-extra .swatch[data-code="T1:curated:bark"]'); await wait(700); await t.esc(); await wait(900);
    const asked = [...new Set(await t.page.evaluate(() => performance.getEntriesByType("resource").map(r => r.name.replace(/^.*\//, "").replace(/\?.*/, "")).filter(n => /extrafx|packs-extra|secret|caveat/.test(n)).sort()))];
    assert.ok(asked.includes("extrafx.js") && asked.includes("extrafx.css"), "the plank comes from the category's own module and its sheet: " + asked);
    assert.deepEqual(asked.filter(n => !["extrafx.js", "extrafx.css", "packs-extra.js"].includes(n)), [], "and nothing else — no file of this pair's own, nothing of the Secret pair, no face: " + asked);
    assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty); assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  if (!touch) await test(label + ": T flips; Shift+T and ⋯ → Theme open Appearance, with the slot that is on marked (1.12 b309)", async () => {
    const t = await fresh(opts);
    const s0 = (await t.s()).slot;
    await t.page.keyboard.press("t"); await wait(600); assert.notEqual((await t.s()).slot, s0, "T flips");
    await t.page.keyboard.press("Shift+T"); await t.page.waitForSelector("#p-appear[open]");
    assert.equal(await t.page.locator("#p-settings[open]").count(), 0, "1.12 b309: Shift+T opens Appearance, the page"); assert.equal((await t.s()).slot, s0 === "day" ? "night" : "day", "Shift+T does not flip");
    await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(150);
    await t.page.$eval("#p-settings .body", e => { e.scrollTop = e.scrollHeight; }); await t.esc(); await wait(200); // leave Settings scrolled to the bottom
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(150);
    assert.equal(await t.page.$eval("#p-settings .body", e => e.scrollTop), 0, "Settings opens at its top, wherever it was left");
    assert.equal(await t.page.textContent("#menu-theme-k"), "Light", "the ⋯ row names the theme that is on");
    await t.esc(); await wait(200);
    // 1.9 (proposal 19) put the picker behind the row that names the theme; 1.12 made it Day, then Night; 1.12 b309 makes it
    // Appearance: both slots side by side, a tap on either for its picker, the pairs a tap away
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(150);
    assert.equal(await t.page.locator("#p-settings[open], #p-theme[open]").count(), 0, "straight to Appearance");
    const on = (await t.s()).slot; assert.ok(await t.page.locator("#ap-" + on + "-on").isVisible() && await t.page.locator("#ap-" + (on === "day" ? "night" : "day") + "-on").isHidden(), "with the slot that is on marked");
    assert.equal(await t.page.textContent("#ap-" + on + "-nm"), "Light", "and named");
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
    assert.ok(await t.page.locator("#whatsnew").isVisible(), "the toast"); assert.ok(/New in 1\.12: Easier to get back where you were\./.test(await t.page.textContent("#wn-msg")), "the headline only: " + await t.page.textContent("#wn-msg"));
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
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(250); // 1.12 b309: ⋯ → Theme is Appearance
    assert.equal(await t.page.$eval('#ap-switch [aria-checked="true"]', e => e.dataset.mode), "schedule"); assert.equal(await t.page.$eval("#sch-day-at", e => e.value) + "/" + await t.page.$eval("#sch-night-at", e => e.value), "08:15/17:45", "the times carried over");
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
    const t = await fresh(opts, { scheme: "light", list: false, pinSlots: false });
    assert.equal(await inkOf(t.page), INK.paper, "1.11: a device that never chose gets Paper by day");
    await t.page.evaluate(() => document.fonts.ready); await wait(300);
    const faces = await t.page.evaluate(() => performance.getEntriesByType("resource").map(r => r.name).filter(n => /fonts\//.test(n)).map(n => n.replace(/.*fonts\//, "")).sort());
    assert.equal(faces.join(" "), "playfair-display-700-800.woff2 pt-sans-700.woff2 source-serif-4-400-600.woff2", "and Paper's faces, not Lato's: " + faces);
    await t.page.click("#w-skip"); await t.page.waitForSelector("#p-save[open]"); await t.page.click("#save-done"); await wait(500);
    const st = await t.s(); assert.equal(st.theme, "paper"); assert.equal(st.switchMode, "system"); assert.equal(st.day, "T1:curated:paper"); assert.equal(st.night, "T1:curated:terminal");
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
    assert.ok(await t.page.locator("#menu-save").isVisible(), "Save your link heads the menu"); assert.equal(await t.page.$eval("#menu-save .lb", e => e.firstChild.textContent.trim()), "Save your link"); assert.equal(await t.page.$eval("#menu-save .dot-k", e => e.textContent.trim()), "●", "with a dot");
    assert.ok((await rect(t.page, "#menu-save")).bottom <= (await rect(t.page, "#menu-tiles")).top + 1, "above the tiles");
    await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await wait(200);
    assert.ok(await t.page.locator("#share-unsaved").isVisible(), "the Share sheet repeats the key line"); assert.ok(/only key/.test(await t.page.textContent("#share-unsaved")));
    await t.page.click("#share-save"); await t.page.waitForSelector("#p-save[open]");
    await t.page.click("#save-done"); await wait(300);
    assert.equal(await t.page.locator("#p-save[open]").count(), 0, "I've saved it closes the sheet"); assert.ok(!(await t.s()).unsaved);
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); assert.ok(await t.page.locator("#menu-save").isHidden(), "gone once it is saved");
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
    await t.press("#wn-x"); await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); assert.ok(await t.page.locator("#menu-save").isHidden(), "grandfathered: no row"); await t.esc();
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the names everywhere — How it works (Private link, View link, Second screen beside Let someone watch, New keys), Settings → This list → Add from anywhere on a View link, the refusal of an add on a View link", async () => {
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
    await t.page.evaluate(() => document.getElementById("more").click()); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('#p-settings [data-set="addurl"]'); await t.page.waitForSelector("#p-addurl[open]");
    assert.equal(await t.page.inputValue("#set-addurl"), "Open a Private link to get its URL"); assert.ok(await t.page.$eval("#set-addurl-copy", e => e.disabled), "and nothing to copy");
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
    await t.esc(); // 1.12: the ⋯ menu sits under the stack, so closing it takes more than one Escape
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); assert.ok(await t.page.$eval("#menu-delete", e => e.hidden), "no Delete everywhere"); assert.ok(await t.page.$eval("#menu-save", e => e.hidden), "no save nudge");
    await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await wait(300);
    assert.ok(await t.page.$eval("#share-keys", e => e.hidden), "no New keys"); assert.ok(await t.page.$eval("#share-unsaved", e => e.hidden), "no save nudge in Share");
    assert.deepEqual(await t.page.$$eval("#p-share .lk-block:not([hidden])", els => els.map(e => e.id)), ["share-view", "share-mine", "share-private", "share-friend"], "everything else the link allows");
    await t.esc(); // 1.12: the ⋯ menu sits under the stack, so closing it takes more than one Escape
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
    await t.page.keyboard.press("Escape"); await wait(250); assert.equal((await t.s()).panels.join(","), "p-menu,p-lists", "Escape from the detail lands on Lists");
    assert.equal(await t.page.locator("#lists-menu .group-h").count(), 0, "no groups once nothing is shared");
    await t.esc(); // 1.12: and out of the menu under it
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); assert.ok(!(await t.page.$eval("#menu-delete", e => e.hidden)), "Delete everywhere is back");
    await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); assert.ok(!(await t.page.$eval("#share-keys", e => e.hidden)), "New keys is back"); await t.esc(); // 1.12: Share sits on the menu, so one Escape lands on it
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
    assert.deepEqual(await t.page.$$eval("#p-share .lk-block:not([hidden]) h3", els => els.map(e => e.querySelector(":scope > span:not(.ico)").firstChild.textContent.trim())), ["Show it somewhere", "Open on my other device", "Let someone edit", "Tell a friend", "Replace both links"]);
    assert.equal(await t.page.$eval("#share-view h3 .sub-h", e => e.textContent), "view only");
    assert.equal(await t.page.$eval("#share-mine h3 .sub-h", e => e.textContent), "the same list, with full control", "1.9: the first block's qualifier says what the link does (proposal 9)");
    assert.ok(await t.page.evaluate(() => document.getElementById("share-copy").getBoundingClientRect().top < document.getElementById("share-copy-mine").getBoundingClientRect().top), "the View link's Copy is the first Copy");
    const viewMsg = await t.page.textContent("#share-view .share-msg"); assert.ok(/can't change it/.test(viewMsg) && /second screen/.test(viewMsg) && /someone who should watch/.test(viewMsg), "both uses in one breath: " + viewMsg);
    assert.ok(/sound and the confetti/.test(await t.page.textContent("#share-view-more")));
    assert.ok(!/for your other devices|for anyone|who should be able to edit/i.test(await t.page.textContent("#p-share")), "what the link does, never who it is for");
    await t.page.waitForFunction(() => [...document.querySelectorAll("#p-share .link[data-v]")].every(e => e.value === e.dataset.v)); // 1.12 b293: the links decode in first
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
    assert.equal(await v.page.getAttribute("#menu-share", "aria-label"), "Share the View link");
    await v.page.click('#p-menu [data-act="share"]'); await v.page.waitForSelector("#p-share[open]");
    assert.deepEqual(await v.page.$$eval("#p-share .lk-block:not([hidden])", els => els.map(e => e.id)), ["share-view", "share-friend"], "a View link holder: Show it somewhere and Tell a friend only");
    assert.equal((await v.page.$eval("#ro", e => e.textContent.replace(/\s+/g, " ").trim())), "View link · view only", "the pill names the link");
    assert.equal(await v.page.$eval("#ro .ro-l", e => getComputedStyle(e).display), touch ? "none" : "inline", "the phone's rail keeps the state alone");
    await v.close();
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  // 1.12 b388: one-thing mode is a way to work one's own list; on a device that has it on, a View link still shows its
  // whole Today (the body's class came from the device's setting at start-up, before any list said whether it can edit)
  await test(label + ": 1.12 b388: a device in one-thing mode opens a View link on its whole Today, and its own list in one-thing mode again", async () => {
    const t = await fresh(opts);
    const rows = await t.page.locator("#list .row").count(); assert.ok(rows >= 3, "the owner's Today: " + rows);
    await t.page.click("#count"); await wait(400);
    assert.equal(await t.page.evaluate(() => document.body.classList.contains("one")), true, "one-thing mode on, on the owner's list");
    const { R } = await t.s();
    const v = await fresh(opts, { url: BASE + "?transport=local#/r/" + R, list: false, ctx: t.ctx });
    await v.page.waitForSelector("#ro:not([hidden])"); await wait(400);
    assert.equal(await v.page.evaluate(() => document.body.classList.contains("one")), false, "a View link has no one thing");
    assert.equal(await v.page.$$eval("#list .row", els => els.filter(e => e.getClientRects().length).length), rows, "the whole Today, on the View link");
    assert.equal(v.errors.length, 0, v.errors.join("; ")); await v.close();
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(400);
    assert.equal(await t.page.evaluate(() => document.body.classList.contains("one")), true, "the owner's list comes back in one-thing mode");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  // 1.12 b387: a View link's holder has the rail's tools again. The view rule that hides a line's tools (v3) matched the
  // rail's own wrapper once 1.9 grouped the sun/moon, Share and ⋯ as `.tools`, so a viewer lost ⋯ and with it the device's
  // own theme, sound and settings; everything behind ⋯ was already made safe for a View link
  await test(label + ": 1.12 b387: a View link's holder has the rail's tools — ⋯ and the sun/moon, and Share where the rail has room — and ⋯ offers only what is the device's or safe to show: Share the View link, Theme, Sound, Lists, Settings, How it works, About, no Save and no Delete everywhere; Appearance sets this device's theme; Templates offers no Delete; b389: someone else's View link keeps the whole rail, wrapped where the line runs out, the tabs and the list's name whole", async () => {
    const t = await fresh(opts);
    await t.page.click("#v-all"); await wait(300); await t.esc(); await t.page.click("#addsec"); await t.page.fill("#ask-input", "Work"); await t.page.click("#ask-ok"); await wait(300);
    await t.press("#all .sec .sec-more"); await t.page.waitForSelector("#p-sec[open]");
    await t.page.click('#p-sec [data-sact="template"]'); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Five"); await t.page.click("#ask-ok"); await wait(600);
    const { R } = await t.s();
    const v = await fresh(opts, { url: BASE + "?transport=local#/r/" + R, list: false, ctx: t.ctx });
    await v.page.waitForSelector("#ro:not([hidden])"); await wait(300);
    const shown = id => v.page.evaluate(id => { const e = document.getElementById(id); return !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden"; }, id);
    assert.equal(await shown("more"), true, "⋯ on the rail"); assert.equal(await shown("daynight"), true, "the sun/moon"); assert.equal(await shown("share"), !touch, "Share where the rail has room (a phone keeps it in ⋯)");
    const whole = page => page.evaluate(() => { const cut = e => e.scrollWidth > e.clientWidth + 1, r = document.querySelector(".rail"), s = document.querySelector(".rail .seg"); return !cut(r) && !cut(s) && ![...s.children].some(cut) && !cut(document.getElementById("listname")); });
    assert.ok(await whole(v.page), "b389: the rail fits, the tabs whole");
    assert.equal(await v.page.$$eval("#list .row .tools, #all .row .tools", els => els.filter(e => e.getClientRects().length).length), 0, "a line's own tools stay hidden");
    await v.press("#more"); await v.page.waitForSelector("#p-menu[open]"); await wait(200);
    const acts = await v.page.$$eval("#p-menu [data-act], #p-menu #menu-about", els => els.filter(e => e.getClientRects().length).map(e => e.dataset.act || e.id));
    for (const a of ["share", "theme", "sound", "lists", "settings", "help", "menu-about"]) assert.ok(acts.includes(a), a + " is offered: " + acts);
    for (const a of ["save", "delete"]) assert.ok(!acts.includes(a), a + " is not: " + acts);
    assert.equal(await v.page.getAttribute("#menu-share", "aria-label"), "Share the View link");
    await v.page.click('#p-menu [data-act="theme"]'); await v.page.waitForSelector("#p-appear[open]");
    await v.page.click('#p-appear .slot[data-slot="day"]'); await v.page.waitForSelector("#p-theme[open]");
    await v.page.click('#p-theme .swatch[data-code="T1:curated:harbor"]'); await wait(300);
    assert.equal(await v.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.day), "T1:curated:harbor", "the viewer's own Day theme, on this device");
    await v.esc(); await wait(200); await v.esc(); await wait(200);
    await v.press("#more"); await v.page.click('#p-menu [data-act="settings"]'); await v.page.waitForSelector("#p-settings[open]"); await wait(200);
    await v.page.click('#p-settings [data-set="templates"]'); await v.page.waitForSelector("#p-pick[open]"); await wait(200);
    assert.ok(/Five/.test(await v.page.textContent("#pick-menu")), "the list's template shows");
    assert.equal(await v.page.locator('#pick-menu [aria-label="Delete Five"]').count(), 0, "with no Delete for a viewer");
    await v.esc();
    assert.equal(v.errors.length, 0, v.errors.join("; ")); await v.close();
    // b389: someone else's list on a View link carries the list's chip and both pills besides all an owner's rail has; where
    // the line runs out (a phone) the rail wraps, the count, the tabs and the tools on a line of their own, nothing cut short
    const g = await makeList(t, "Groceries"); await forget(t.page, g.id);
    const o = await fresh(opts, { url: BASE + "?transport=local#/r/" + g.R, list: false, ctx: t.ctx });
    await o.page.waitForFunction(() => document.getElementById("whose").open, null, { timeout: 9000 });
    await o.press('#whose [data-whose="shared"]'); await o.page.waitForFunction(() => window.__tf().mode === "view" && !document.getElementById("whose").open, null, { timeout: 9000 }); await wait(500);
    const rail = await o.page.evaluate(() => ["listname", "ro", "shared", "count", "daynight", "more"].filter(id => document.getElementById(id).getClientRects().length > 0));
    assert.deepEqual(rail, ["listname", "ro", "shared", "count", "daynight", "more"], "the whole rail: " + rail); assert.equal(await o.page.textContent("#listname"), "Groceries");
    assert.ok(await whole(o.page), "nothing on the rail cut short: the tabs and the list's name whole");
    if (touch) assert.ok(await o.page.evaluate(() => document.querySelector(".rail .seg").getBoundingClientRect().top >= document.getElementById("shared").getBoundingClientRect().bottom - 1), "a phone's rail wraps: the tabs below the pills");
    assert.equal(o.errors.length, 0, o.errors.join("; ")); await o.close();
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  // 1.12 b393: the rail of someone else's list one can edit carries the Shared pill and the list's chip besides the tools,
  // and on a phone its tabs were clipped; it wraps where its line runs out, as a View link's does (b389)
  await test(label + ": 1.12 b393: someone else's list one can edit keeps its rail whole — the list's chip, the Shared pill, the count, the tabs and the tools, wrapped where the line runs out, nothing cut short", async () => {
    const t = await fresh(opts);
    const g = await makeList(t, "Groceries"); await forget(t.page, g.id);
    await t.page.goto(BASE + "?transport=local#/l/" + g.id); await t.page.waitForFunction(() => document.getElementById("whose").open, null, { timeout: 9000 });
    await t.press('#whose [data-whose="shared"]'); await onList(t.page, g.id); await wait(600);
    assert.equal((await t.s()).mode, "edit"); assert.equal((await t.s()).origin, "shared");
    const rail = await t.page.evaluate(() => ["listname", "shared", "count", "daynight", "more"].filter(id => document.getElementById(id).getClientRects().length > 0));
    assert.deepEqual(rail, ["listname", "shared", "count", "daynight", "more"], "the whole rail: " + rail); assert.equal(await t.page.textContent("#listname"), "Groceries");
    assert.ok(await t.page.evaluate(() => { const cut = e => e.scrollWidth > e.clientWidth + 1, r = document.querySelector(".rail"), s = document.querySelector(".rail .seg"); return !cut(r) && !cut(s) && ![...s.children].some(cut) && !cut(document.getElementById("listname")); }), "nothing on the rail cut short: the tabs and the list's name whole");
    if (touch) assert.ok(await t.page.evaluate(() => document.querySelector(".rail .seg").getBoundingClientRect().top >= document.getElementById("shared").getBoundingClientRect().bottom - 1), "a phone's rail wraps: the tabs below the pill");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": panels are one stack — a sub-panel shows ‹ Back and returns to its parent with its scroll and its changed value, × closes the whole stack, Escape goes back a level and closes at the root, one history entry per level so the browser's Back goes back a level" + (touch ? ", and an edge swipe from the left goes back" : ""), async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(300);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-settings", "1.12: the ⋯ menu is the root and stays under what it opens"); assert.equal(await t.page.locator("#p-settings h2 .back").count(), 1, "1.12: so a panel from ⋯ has ‹ Back too");
    assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), 2, "an entry for the menu and one for the panel");
    await t.page.evaluate(() => { document.querySelector("#p-settings .body").scrollTop = 60; }); await wait(150); // the hero stays in view, clear of the bar: a click that had to scroll it into view would move the parent before it is left
    const scrolled = await t.page.evaluate(() => document.querySelector("#p-settings .body").scrollTop); assert.ok(scrolled >= 30, "scrolled: " + scrolled);
    const dayBefore = (await t.page.textContent("#set-appear-k")).trim();
    await t.page.click('#p-settings [data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(300);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-settings,p-appear"); assert.equal((await t.page.textContent("#p-appear h2 .back")).replace(/\s+/g, " ").trim(), "‹ Back");
    await t.page.click('#p-appear .slot[data-slot="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(300);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-settings,p-appear,p-theme"); assert.equal(await t.page.locator("#p-theme h2 .back").count(), 1, "‹ Back on the sub-panel"); assert.equal((await t.page.textContent("#p-theme h2 .back")).replace(/\s+/g, " ").trim(), "‹ Back");
    assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), 4, "an entry for each level");
    const sw = await t.page.$$("#p-theme .swatch"); const pressed = await Promise.all(sw.map(s => s.getAttribute("aria-pressed"))); await sw[pressed.indexOf("false")].click(); await wait(500);
    await t.page.click("#p-theme h2 .back"); await t.page.waitForSelector("#p-appear[open]"); await wait(400);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-settings,p-appear", "Back lands on the parent");
    assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), 3, "the level's entry went with it");
    await t.page.click("#p-appear h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(400);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-settings", "and again, to Settings");
    assert.notEqual((await t.page.textContent("#set-appear-k")).trim(), dayBefore, "the value changed below is in place");
    assert.ok(Math.abs(await t.page.evaluate(() => document.querySelector("#p-settings .body").scrollTop) - scrolled) <= 2, "the parent's scroll position");
    await t.page.click('#p-settings [data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(300);
    await t.page.click('#p-appear .slot[data-slot="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(200);
    await t.page.keyboard.press("Escape"); await wait(350); assert.equal((await t.s()).panels.join(","), "p-menu,p-settings,p-appear", "Escape goes back one level");
    await t.page.keyboard.press("Escape"); await wait(350); assert.equal((await t.s()).panels.join(","), "p-menu,p-settings", "and again");
    await t.page.keyboard.press("Escape"); await wait(350); assert.equal((await t.s()).panels.join(","), "p-menu", "and again, to the menu it came from");
    await t.page.keyboard.press("Escape"); await wait(350); assert.equal((await t.s()).panels.join(","), "", "and closes at the root"); assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), null, "no entry left behind");
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(300);
    await t.page.evaluate(() => history.back()); await wait(500); assert.equal((await t.s()).panels.join(","), "p-menu,p-appear", "the browser's Back: one level, not out of the list");
    await t.page.click('#p-appear .slot[data-slot="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(200);
    await t.page.click("#p-theme .x"); await wait(400); assert.equal((await t.s()).panels.join(","), "", "× closes the whole stack"); assert.equal(await t.page.evaluate(() => history.state && history.state.tfPanel), null, "and its entries are gone");
    assert.equal((await t.s()).listId !== null, true, "still on the list");
    // Lists → a list's detail → back (the edge swipe on a phone)
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu .row .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-lists,p-list");
    if (touch) { const cdp = await t.ctx.newCDPSession(t.page); await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 6, y: 520 }] }); for (let i = 1; i <= 6; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 6 + 22 * i, y: 520 }] }); await wait(16); } await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await cdp.detach(); await wait(500); }
    else { await t.page.click("#p-list h2 .back"); await wait(400); }
    assert.equal((await t.s()).panels.join(","), "p-menu,p-lists", touch ? "the edge swipe goes back" : "Back lands on Lists");
    await t.esc(); await wait(250); // 1.12: the ⋯ menu is under the stack now, so one Escape lands on it rather than closing
    // Export & import, from Settings
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('#p-settings [data-set="export"]'); await t.page.waitForSelector("#p-export[open]"); await wait(200);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-settings,p-export"); await t.page.click("#p-export h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(250); assert.equal((await t.s()).panels.join(","), "p-menu,p-settings");
    await t.esc(); await wait(250); // 1.12: the ⋯ menu is under the stack now, so one Escape lands on it rather than closing
    // 1.9: History from a list's detail, two levels under Lists (proposal 5); Back lands on the detail, then on Lists
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu .row:has(.cur) .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    assert.ok(!(await t.page.$eval("#list-detail-history", e => e.hidden)), "History is in the detail"); await t.page.click('#list-detail-menu [data-lact="history"]'); await t.page.waitForSelector("#p-history[open]"); await wait(200);
    assert.equal((await t.s()).panels.join(","), "p-menu,p-lists,p-list,p-history"); assert.ok(/Nothing finished on a previous day/.test(await t.page.textContent("#history-days")));
    await t.page.click("#p-history h2 .back"); await t.page.waitForSelector("#p-list[open]"); await wait(300); assert.equal((await t.s()).panels.join(","), "p-menu,p-lists,p-list");
    await t.page.click("#p-list h2 .back"); await t.page.waitForSelector("#p-lists[open]"); await wait(300); assert.equal((await t.s()).panels.join(","), "p-menu,p-lists");
    await t.esc(); await wait(250); // 1.12: the ⋯ menu is under the stack now, so one Escape lands on it rather than closing
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": a 1.3 device opens 1.8 — every list it holds is mine with no question and no groups, and the toast is the only new thing", async () => {
    const t = await fresh(opts);
    await makeList(t, "Work");
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); for (const l of m.lists) { delete l.origin; delete l.nickname; } m.device.seenVersion = "1.3"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await t.page.waitForFunction(() => window.__tf && window.__tf().listId); await wait(1800);
    assert.ok(!(await whoseOpen(t.page)), "no question"); assert.equal((await t.s()).origin, "mine");
    assert.deepEqual(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.map(l => l.origin)), ["mine", "mine"], "every existing list is mine");
    assert.ok(await t.page.locator("#whatsnew").isVisible(), "the toast"); assert.ok(/New in 1\.12: Easier to get back where you were\./.test(await t.page.textContent("#wn-msg")), await t.page.textContent("#wn-msg"));
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
    const keys = await t.page.evaluate(() => caches.keys()); assert.ok(keys.includes("tf-v" + VERSION + "-b" + build), "this build's cache: " + keys.join(","));
    await t.page.evaluate(async () => { const c = await caches.open("tf-v1.3-b62"); await c.put(new Request("./panels.js"), new Response("// build 62's panels", { headers: { "Content-Type": "text/javascript" } })); });
    assert.equal((await t.page.evaluate(async () => (await fetch("panels.js?v=62")).text())).trim(), "// build 62's panels", "a page from build 62 gets build 62's module");
    assert.ok(/PANELS_BUILD = /.test(await t.page.evaluate(async b => (await fetch("panels.js?v=" + b)).text(), build)), "this build's module is served");
    // 1.9 (proposal 14): the page's own build is answered from this build's cache first — a marker planted there is what comes back, no network
    await t.page.evaluate(async b => { const c = await caches.open(b); await c.put(new Request("./exporter.js"), new Response("// this build's cached exporter", { headers: { "Content-Type": "text/javascript" } })); }, "tf-v" + VERSION + "-b" + build);
    assert.equal((await t.page.evaluate(async b => (await fetch("exporter.js?v=" + b)).text(), build)).trim(), "// this build's cached exporter", "cache-first for the page's own build");
    assert.ok(/handOff/.test(await t.page.evaluate(async () => (await fetch("exporter.js")).text())), "the plain name is still network-first (the shell)");
    // 1.9 (proposal 15): one copy of each file — no bare ./ beside index.html, no ?v= keys beside the plain names, the navigation keyed as index.html
    await t.page.evaluate(async b => { await fetch("panels.js?v=" + b); await fetch("qr.js?v=" + b); }, build); await wait(300);
    const urls = await t.page.evaluate(async b => (await (await caches.open(b)).keys()).map(r => r.url), "tf-v" + VERSION + "-b" + build);
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
    await t.esc(); // 1.12: the ⋯ menu sits under the stack, so closing it takes more than one Escape
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(200);
    assert.equal(await t.page.locator("#lists-menu .id").count(), 0, "no six characters of the id on a row (proposal 21)");
    assert.equal(await t.page.locator("#lists-menu .row .more").count(), 1, "the › says there is more");
    await t.esc(); assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.12: ‹ Back on every panel ⋯ opens returns to the menu as it was; × still takes the whole stack; a tap outside still closes everything", async () => {
    const t = await fresh(opts);
    for (const [act, panel] of [["theme", "#p-appear"], ["help", "#p-help"], ["lists", "#p-lists"], ["settings", "#p-settings"], ["share", "#p-share"]]) {
      await t.press("#more"); await t.page.waitForSelector("#p-menu[open]");
      await t.page.click(`#p-menu [data-act="${act}"]`); await t.page.waitForSelector(panel + "[open]"); await wait(250);
      assert.deepEqual((await t.s()).panels, ["p-menu", panel.slice(1)], act + ": the menu is the frame below it");
      assert.ok(await t.page.$(panel + " h2 .back"), act + ": and so there is a ‹ Back");
      await t.page.click(panel + " h2 .back"); await t.page.waitForSelector("#p-menu[open]"); await wait(250);
      assert.deepEqual((await t.s()).panels, ["p-menu"], act + ": Back lands on the menu with nothing under it");
      assert.ok((await t.page.textContent("#menu-theme-k")).trim().length > 0, act + ": repainted on the way back — the row still names the theme that is on");
      if (!touch) assert.ok(await t.page.$eval("#p-menu", e => e.classList.contains("pop")), act + ": and back under the button as a popover, not a sheet in the middle");
      await t.esc();
    }
    // a panel opened from inside Settings still goes back to Settings (1.4), now two deep from ⋯
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    await t.page.click('#p-settings [data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(250);
    assert.deepEqual((await t.s()).panels, ["p-menu", "p-settings", "p-appear", "p-theme"], "four deep: ⋯ → Settings → Appearance → the day slot");
    await t.page.click("#p-theme h2 .back"); await t.page.waitForSelector("#p-appear[open]"); await wait(250);
    assert.deepEqual((await t.s()).panels, ["p-menu", "p-settings", "p-appear"], "Back is one level, not all the way out");
    await t.page.click("#p-appear h2 .x"); await wait(450);
    assert.equal(await t.page.$("dialog.panel[open]"), null, "× takes the whole stack, from any depth");
    // and the backdrop
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(200);
    if (touch) await t.page.touchscreen.tap(4, 4); else await t.page.mouse.click(4, 4);
    await wait(450);
    assert.equal(await t.page.$("dialog.panel[open]"), null, "tap-outside-closes-everything is untouched");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.12 b309: ⋯ → Theme is Appearance — both slots side by side in miniature with the one on marked, a tile opens its own slot and Back comes back to it, a designed pair sets both in one tap, the switch's pill slides to the way chosen, Make your own fills the slot that is on", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(300);
    assert.deepEqual((await t.s()).panels, ["p-menu", "p-appear"], "a page under the menu, not the picker");
    // the tiles: each slot's theme in miniature, the one on now marked (a dark system: Night)
    assert.equal(await t.page.textContent("#ap-day-nm"), "Light"); assert.equal(await t.page.textContent("#ap-night-nm"), "Dark");
    assert.ok(await t.page.locator("#ap-night-on").isVisible() && await t.page.locator("#ap-day-on").isHidden(), "On now marks Night");
    assert.equal(await t.page.$eval('#p-appear .slot[data-slot="night"]', e => e.getAttribute("aria-current")), "true");
    assert.equal(await t.page.$eval('#p-appear .slot[data-slot="night"]', e => e.getAttribute("aria-label")), "Night theme: Dark, on now", "a screen reader hears the same");
    assert.deepEqual(await t.page.$eval('#p-appear .slot[data-slot="day"] .pv', e => [e.children.length, e.querySelectorAll(".done").length, e.querySelectorAll(".done b").length]), [3, 1, 1], "a miniature: three lines, the middle one crossed off");
    const tiles = await t.page.$$eval("#p-appear .slot", els => els.map(e => e.getBoundingClientRect()).map(r => ({ top: Math.round(r.top), left: r.left, right: r.right })));
    assert.ok(tiles[0].top === tiles[1].top && tiles[0].right <= tiles[1].left, "side by side, on a phone too: " + JSON.stringify(tiles));
    assert.ok(await t.page.$eval("#p-appear .body", e => e.scrollWidth <= e.clientWidth + 1), "nothing runs off the side");
    // a tile opens its own slot, whichever is on, and Back comes back to the tiles with the choice in place
    await t.page.click('#p-appear .slot[data-slot="day"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(300);
    assert.equal(await t.page.textContent("#p-theme-h"), "Day theme", "the day tile opens the day slot, though Night is on");
    await t.page.click('#sw-light .swatch[data-code="T1:curated:paper"]'); await wait(500);
    assert.equal(await t.page.textContent("#p-theme-h"), "Day theme", "and stays on that one slot"); assert.equal((await t.s()).day, "T1:curated:paper");
    await t.page.click("#p-theme h2 .back"); await t.page.waitForSelector("#p-appear[open]"); await wait(300);
    assert.deepEqual((await t.s()).panels, ["p-menu", "p-appear"], "Back lands on Appearance");
    assert.equal(await t.page.textContent("#ap-day-nm"), "Paper", "with the choice in place");
    // the pairs, a page one row away (1.12 b315): the six that are light by day, then the two that are always dark; one tap sets both
    assert.equal(await t.page.locator("#p-appear .pair").count(), 0, "not on the landing");
    await t.page.click("#ap-pairs-go"); await t.page.waitForSelector("#p-pairs[open]"); await wait(300);
    assert.deepEqual((await t.s()).panels, ["p-menu", "p-appear", "p-pairs"], "a page under Appearance");
    assert.deepEqual(await t.page.$$eval("#ap-pairs .pairs-h", els => els.map(e => e.textContent)), ["Light by day, dark by night", "Always dark"]);
    assert.deepEqual(await t.page.$$eval("#ap-pairs .pair", els => els.map(e => e.getAttribute("aria-label"))), ["Light by day, Dark by night", "Paper by day, Midnight by night", "Harbor by day, Forest by night", "Blush by day, Pink by night", "Teletype by day, Terminal by night", "Sketch by day, Arcade by night", "Sunset by day, Dusk by night", "Cocoa by day, Ember by night"]);
    assert.equal(await t.page.locator('#ap-pairs .pair[aria-pressed="true"]').count(), 0, "Paper with Dark is no designed pair, so none is marked");
    await t.press('#ap-pairs .pair[aria-label="Harbor by day, Forest by night"]'); await wait(300);
    let st = await t.s(); assert.equal(st.day, "T1:curated:harbor"); assert.equal(st.night, "T1:curated:forest", "one tap, both slots"); assert.equal(st.theme, "forest", "and the one on shows it");
    assert.equal(await t.page.textContent("#toast .msg"), "Harbor by day, Forest by night");
    assert.equal(await t.page.$eval('#ap-pairs .pair[aria-pressed="true"]', e => e.getAttribute("aria-label")), "Harbor by day, Forest by night", "the pair that is set is marked");
    if (!touch) { // a keyboard that chose a pair is still on it after the pairs repaint
      await t.page.focus('#ap-pairs .pair[aria-label="Paper by day, Midnight by night"]'); await t.page.keyboard.press("Enter"); await wait(900);
      assert.equal((await t.s()).night, "T1:curated:midnight"); assert.equal(await t.page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Paper by day, Midnight by night", "focus stays on the pair");
      await t.page.focus('#ap-pairs .pair[aria-label="Harbor by day, Forest by night"]'); await t.page.keyboard.press("Enter"); await wait(900);
    }
    await t.page.click("#p-pairs h2 .back"); await t.page.waitForSelector("#p-appear[open]"); await wait(300);
    assert.deepEqual((await t.s()).panels, ["p-menu", "p-appear"], "Back comes back to the tiles");
    assert.equal(await t.page.textContent("#ap-day-nm") + "|" + await t.page.textContent("#ap-night-nm"), "Harbor|Forest", "with the pair in them");
    // the switch: three ways, the pill under the one chosen, the times only for a schedule
    const pill = () => t.page.$eval("#ap-switch", s => { const th = s.querySelector(".thumb").getBoundingClientRect(), on = s.querySelector('[aria-checked="true"]').getBoundingClientRect(); return Math.abs(th.left - on.left) < 2 && Math.abs(th.width - on.width) < 2; });
    assert.equal(await t.page.$eval('#ap-switch [aria-checked="true"]', e => e.dataset.mode), "system"); assert.ok(await pill(), "the pill sits under With the system");
    assert.equal(await t.page.$$eval('#ap-switch [role="radio"]', bs => bs.map(b => b.getAttribute("aria-checked")).join(",")), "false,true,false", "a radio group to a screen reader");
    await t.page.click('#ap-switch [data-mode="schedule"]'); await wait(700);
    assert.equal((await t.s()).switchMode, "schedule"); assert.ok(await pill(), "and slides to On a schedule"); assert.ok(await t.page.locator("#schedule-block").isVisible(), "the times show");
    assert.ok(/Day from 07:00, night from 19:00/.test(await t.page.textContent("#ap-switch-note")), await t.page.textContent("#ap-switch-note"));
    if (!touch) { await t.page.keyboard.press("ArrowLeft"); await wait(700); assert.equal((await t.s()).switchMode, "system", "the arrow keys move it, like any radio group"); assert.ok(await pill()); }
    else { await t.page.click('#ap-switch [data-mode="system"]'); await wait(700); }
    assert.ok(await t.page.locator("#schedule-block").isHidden(), "and the times go");
    // Make your own opens the builder for the slot that is on
    await t.page.click("#ap-build"); await t.page.waitForSelector("#p-builder[open]"); await wait(200);
    assert.equal((await t.page.textContent("#c-use")).trim(), "Use for Night");
    await t.page.click("#p-builder h2 .back"); await t.page.waitForSelector("#p-appear[open]"); await wait(200);
    assert.deepEqual((await t.s()).panels, ["p-menu", "p-appear"], "and Back comes back to Appearance");
    await t.esc(); assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | ")); await t.close();
  });

  await test(label + ": 1.12: Everything has its own bar, count and finale; Start again there brings everything back; Today is unchanged", async () => {
    const t = await fresh(opts);
    // a fourth line that is not on Today, so the two views differ (the button and the line menu, so the phone runs it too)
    await t.press("#addtoday"); await t.page.waitForSelector("#list .row.editing"); await t.page.keyboard.type("Only in Everything"); await t.page.keyboard.press("Enter"); await t.esc(); await wait(500);
    await t.lineMenu("#today .row:nth-child(4)"); await t.page.click('#p-line [data-lact="nottoday"]'); await wait(600);
    const count = () => t.page.textContent("#count");
    const fill = () => t.page.$eval("#fill", e => e.style.width);
    assert.equal((await count()).trim(), "0/3 done", "Today counts Today's lines");
    await t.press("#v-all"); await wait(400);
    assert.equal((await count()).trim(), "0/4 done", "Everything counts every line in the list");
    // cross Everything off completely
    for (let i = 0; i < 8; i++) { const c = await t.page.$("#all .row:not(.done) .check"); if (!c) break; await c.click(); await wait(350); }
    await wait(1600);
    assert.equal((await count()).trim(), "4/4 done"); assert.equal(await fill(), "100%", "Everything's bar is full when Everything is");
    assert.ok(await t.page.$eval("#finale", e => e.classList.contains("on")), "and the finale is Everything's to have");
    assert.ok((await t.s()).stats.volley >= 1, "the volley went up");
    assert.ok(await t.page.$eval("#review", e => e.hidden), "the review card is a day's, so it stays out of Everything's finale");
    await t.page.click("#again"); await wait(700);
    assert.equal((await count()).trim(), "0/4 done", "Start again on Everything brings everything back");
    await t.press("#v-today"); await wait(400);
    assert.equal((await count()).trim(), "0/3 done", "and Today is Today's own again");
    // Today still finishes on its own three
    for (let i = 0; i < 5; i++) { const c = await t.page.$("#today .row:not(.done) .check"); if (!c) break; await c.click(); await wait(350); }
    await wait(1600);
    assert.ok(await t.page.$eval("#finale", e => e.classList.contains("on")), "Today's finale is exactly as it was");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.12: Remove asks first, offers the link, warns harder when it was never saved, undoes for ten seconds — and there is no Removed group anywhere", async () => {
    const t = await fresh(opts);
    assert.equal(await t.page.$("#lists-removed"), null, "no Removed group in the markup at all");
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(200);
    await t.page.click("#lists-menu .row:first-child .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    await t.page.click('#p-list [data-lact="remove"]'); await t.page.waitForSelector("#ask[open]"); await wait(250);
    assert.equal(await t.page.textContent("#ask-title"), "Remove from this device?", "it asks");
    assert.ok(/need it again/.test(await t.page.textContent("#ask-msg")), "and says the link is the way back");
    assert.equal(await t.page.textContent("#ask-extra"), "Copy link", "with the link within reach");
    assert.deepEqual(await t.page.$$eval("#ask-ok ~ *, #ask-ok", els => els.map(e => e.id || "cancel")), ["ask-ok", "ask-extra", "cancel"], "a saved link: Copy link sits after Remove");
    await t.page.click('#ask [data-close]'); await wait(300); await t.esc();
    // a list whose link was never saved warns harder, and Copy link comes first
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.lists[0].linkSaved = false; m.lists[0].created = true; m.device.savedGrandfathered = true; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); }); // the boot's one-time grandfathering would turn it back on
    await t.reload(); await wait(1200); await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(200);
    await t.page.click("#lists-menu .row:first-child .more"); await t.page.waitForSelector("#p-list[open]"); await wait(200);
    await t.page.click('#p-list [data-lact="remove"]'); await t.page.waitForSelector("#ask[open]"); await wait(250);
    assert.ok(/never saved/.test(await t.page.textContent("#ask-msg")), "the stronger warning when the link was never saved");
    assert.deepEqual(await t.page.$$eval("#ask-extra ~ *, #ask-extra", els => els.map(e => e.id || "cancel")), ["ask-extra", "ask-ok", "cancel"], "and Copy link comes first");
    await t.page.click("#ask-ok"); await wait(1200);
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.length), 0, "removed, not parked");
    assert.ok(!(await t.page.$eval("#toast-undo", e => e.hidden)), "the ten-second Undo is on screen, not hidden behind the switch");
    await t.page.click("#toast-undo"); await wait(1200);
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.length), 1, "and it comes back");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.12: a registry an older build left with an archived entry is finished on read, quietly", async () => {
    const t = await fresh(opts);
    const id = await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists[0].id);
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.lists.push({ id: "z".repeat(22), mode: "edit", name: "Old", origin: "mine", archived: true }); localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.reload(); await wait(1400); await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="lists"]'); await t.page.waitForSelector("#p-lists[open]"); await wait(300);
    assert.equal(await t.page.locator("#lists-menu .row").count(), 1, "the archived entry is gone from Lists");
    assert.equal(await t.page.locator("#lists-menu .row .id").count(), 0, "and there is no Restore anywhere");
    assert.ok(!(await t.page.$eval("#toast", e => e.classList.contains("on"))), "and nothing is said about it: the person asked for this once already");
    await t.esc(); await wait(200);
    assert.deepEqual(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).lists.map(l => l.id)), [id], "and the stored registry settles without it");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  /* 1.12 b321: the kits that carry a scene, and the module each one's is in (a pair can share one) */
  const SCENE_MODS = { forest: "scene-forest.js", harbor: "scene-harbor.js", paper: "scene-papercut.js", midnight: "scene-papercut.js", teletype: "scene-flap.js", terminal: "scene-demo.js", light: "scene-orbit.js", dark: "scene-orbit.js", sunset: "scene-bay.js", dusk: "scene-bay.js", arcade: "scene-arcade.js", sketch: "scene-sketch.js", blush: "scene-bubbles.js", pink: "scene-heart.js", cocoa: "scene-cocoa.js", ember: "scene-ember.js" };
  const SCENE_KITS = Object.keys(SCENE_MODS);
  /* 1.12 b318: Scenes. A device that has them on, Forest in Night and Harbor in Day (a dark system: Forest on) */
  const sceneDevice = (on = true) => `try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: { day: "T1:curated:harbor", night: "T1:curated:forest", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }${on ? ", scenes: true" : ""} } })); } catch (e) {}`;
  const sceneUp = (t, id) => t.page.waitForFunction(id => { const s = window.__tf().scene; return !!s && s.id === id && s.frames > 0; }, id, { timeout: 8000, polling: 100 });
  const sceneFiles = t => t.page.evaluate(() => [...new Set(performance.getEntriesByType("resource").map(e => new URL(e.name).pathname.split("/").pop()).filter(n => /^scene/.test(n)))]);
  const openAppear = async t => { await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(250); };

  await test(label + ": 1.12 b318: Scenes are off on a new device and the page asks for none of them; on in Appearance, Forest brings its picture and only its own module, behind the words and not in the way; a flip to Harbor swaps it, a theme without one takes it down and says where one shows, and the setting is the device's", async () => {
    const t = await fresh(opts, { init: sceneDevice(false) });
    assert.equal((await t.s()).theme, "forest", "Forest is on");
    assert.equal((await t.s()).scene, null, "and no scene on a new device");
    assert.deepEqual(await sceneFiles(t), [], "with it off, the page asks for none of it");
    assert.ok(await t.page.$eval("#field", e => e.hidden && !e.children.length), "the layer is empty");
    await openAppear(t);
    assert.equal(await t.page.getAttribute("#ap-scenes", "aria-pressed"), "false", "the switch is off");
    assert.equal(await t.page.textContent("#ap-scenes-sub"), "A moving picture behind every built-in theme");
    if (opts.hasTouch) assert.ok((await t.page.$eval("#ap-scenes", e => e.getBoundingClientRect().height)) >= 44, "44 px on touch");
    await t.page.click("#ap-scenes"); await wait(200);
    assert.equal(await t.page.getAttribute("#ap-scenes", "aria-pressed"), "true", "on");
    assert.ok(!(await t.page.$eval("#toast", e => e.classList.contains("on"))), "Forest has one, so nothing needs saying");
    await sceneUp(t, "forest");
    assert.deepEqual((await sceneFiles(t)).sort(), ["scene-forest.js", "scenes.css", "scenes.js"], "the stage, its stylesheet and Forest's own, nothing else");
    assert.equal(await t.page.evaluate(() => document.documentElement.dataset.scene), "forest", "the page knows a scene is up (scenes.css)");
    assert.ok(await t.page.evaluate(() => performance.getEntriesByType("resource").filter(e => /\/scene/.test(e.name)).every(e => /[?&]v=\d+$/.test(e.name))), "each by build, answered from its own build's cache");
    await t.esc(); await wait(900);
    const sc = (await t.s()).scene; assert.equal(sc.running, true, "running: " + JSON.stringify(sc));
    assert.ok(sc.size[1] >= 150 && sc.size[1] <= 240 && sc.px >= 3, "about 190 pixels tall, scaled up whole: " + JSON.stringify(sc));
    const z = await t.page.evaluate(() => { const f = document.getElementById("field"), cs = getComputedStyle(f), c = f.querySelectorAll("canvas")[1], r = c.getBoundingClientRect(); return { field: +cs.zIndex, glow: +getComputedStyle(document.getElementById("glow")).zIndex, shell: +getComputedStyle(document.getElementById("shell")).zIndex, ev: cs.pointerEvents, pos: cs.position, op: cs.opacity, cover: r.left <= 0 && r.top <= 0 && r.right >= innerWidth && r.bottom >= innerHeight, px: getComputedStyle(c).imageRendering, aria: f.getAttribute("aria-hidden") }; });
    assert.ok(z.field > z.glow && z.field < z.shell && z.ev === "none" && z.pos === "fixed", "above the glow, behind the words, and not in the way: " + JSON.stringify(z));
    assert.ok(z.cover && z.px === "pixelated" && z.aria === "true" && z.op === "1", "the whole screen, in crisp pixels, faded in, silent to a screen reader: " + JSON.stringify(z));
    const washes = await t.page.$eval("#field", f => getComputedStyle(f.querySelector("div")).backgroundImage);
    assert.ok((washes.match(/radial-gradient/g) || []).length === 2 && (washes.match(/linear-gradient/g) || []).length === 1, "the words' three washes are all there (one value the parser rejects drops the lot): " + washes.slice(0, 80));
    const hit = await t.page.evaluate(() => { const r = document.querySelector("#list .row .tx").getBoundingClientRect(); return document.elementFromPoint(r.left + 10, r.top + r.height / 2).closest(".row") !== null; });
    assert.ok(hit, "a tap on a line lands on the line");
    // the flip: Harbor in Day brings its own, and only then
    await t.press("#daynight"); await wait(400);
    await sceneUp(t, "harbor"); assert.equal((await t.s()).theme, "harbor");
    assert.deepEqual((await sceneFiles(t)).sort(), ["scene-forest.js", "scene-harbor.js", "scenes.css", "scenes.js"], "Harbor's module, now Harbor is on");
    assert.equal(await t.page.$$eval("#field canvas", els => els.length), 2, "one picture (and its backdrop) at a time");
    // Harbor's small words are dark on light with no room to spare: on Everything, the plain ground, and nothing drawn under it
    await t.press("#v-all"); await t.page.waitForSelector("#all .row"); await wait(1100);
    assert.equal(await t.page.$eval("#field", f => getComputedStyle(f.lastElementChild).opacity), "1", "Harbor's veil covers it on Everything");
    assert.equal((await t.s()).scene.running, false, "and it stops drawing under it");
    await t.press("#v-today"); await t.page.waitForSelector("#list .row"); await wait(400);
    assert.equal((await t.s()).scene.running, true, "back on Today, it moves again"); assert.equal(await t.page.$eval("#field", f => getComputedStyle(f.lastElementChild).opacity), "0");
    // the picker tags the kits that have one; a theme without one takes the scene down (1.12 b336: every curated kit has
    // one now, so the theme without one is a theme you make)
    await openPicker(t, "day");
    assert.deepEqual(await t.page.$$eval("#p-theme .swatch .scene-tag", els => els.map(e => e.closest(".swatch").dataset.code + ":" + e.textContent).sort()), SCENE_KITS.map(k => "T1:curated:" + k + ":Scene").sort(), "the kits with a scene, tagged");
    assert.equal(await t.page.$$eval("#sw-light .swatch, #sw-dark .swatch", els => els.filter(e => !e.querySelector(".scene-tag")).length), 0, "every kit in the picker has one");
    await t.page.click("#sw-build"); await t.page.waitForSelector("#p-builder[open]"); await wait(150);
    await t.page.fill("#c-hex", "#3366FF"); await t.page.dispatchEvent("#c-hex", "input"); await t.page.click("#c-light"); await wait(150);
    await t.press("#c-use"); await wait(500); await t.esc(); await wait(300);
    const made = (await t.s()).theme; assert.ok(/^custom-3366ff-l/.test(made), "the theme you made is on: " + made); assert.equal((await t.s()).scene, null, "it has none: the scene goes");
    assert.ok(await t.page.$eval("#field", e => e.hidden && !e.children.length && !e.style.cssText), "and leaves the layer as it found it");
    assert.equal(await t.page.evaluate(() => "scene" in document.documentElement.dataset), false, "and the page without its mark");
    // off, then on again with nothing to show on the theme that is on: a word on where one shows
    await openAppear(t);
    await t.page.click("#ap-scenes"); await wait(200); assert.equal(await t.page.getAttribute("#ap-scenes", "aria-pressed"), "false");
    assert.equal(await t.page.evaluate(() => "scenes" in JSON.parse(localStorage.getItem("tf/v2/meta")).device), false, "off is no key at all, as on a new device");
    await t.page.click("#ap-scenes"); await wait(300);
    assert.equal(await t.page.textContent("#toast .msg"), "Scenes are on. Every built-in theme has one.", "on, on a theme without one, it says where one shows");
    await t.esc(); await wait(200);
    // this device's, and kept
    await t.press("#daynight"); await wait(400); await sceneUp(t, "forest");
    await t.reload(); await t.page.waitForSelector("#list .row"); await sceneUp(t, "forest");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.scenes), true, "on after a reload");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; ")); assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join("; "));
    await t.close();
  });

  // 1.12 b397: Arcade's score carries from level to level, as a game's does; b398: every fiftieth level a boss of its own
  await test(label + ": 1.12 b397: Arcade's score carries from level to level — a page opens on nothing, a level the list cuts short banks what it had and a quiet page shows the bank, levels skipped count whole; b398: level 50 brings the mothership, worth 50,000, and level 100 the moon", async () => {
    const t = await fresh(opts, { init: `try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: { day: "T1:curated:light", night: "T1:curated:arcade", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }, scenes: true } })); } catch (e) {}` });
    await sceneUp(t, "arcade"); await wait(300);
    const info = () => t.page.evaluate(() => window.__tf().scene.info);
    let i = await info(); assert.equal(i.level, 1); assert.equal(i.score, 0, "a page opens on nothing"); assert.equal(i.boss, -1, "the first level is the signature");
    await t.page.evaluate(() => window.__tfTest.sceneIdle());
    await t.page.waitForFunction(() => { const s = window.__tf().scene; return s.t > 3.2 && s.info.score >= 50; }, null, { timeout: 9000, polling: 50 });
    await t.page.keyboard.press("Shift"); // the list is used: the loop lets go
    await t.page.waitForFunction(() => { const s = window.__tf().scene; return s.level === 0 && s.t === 0 && s.pass === 1; }, null, { timeout: 6000, polling: 50 }); await wait(200);
    i = await info(); assert.equal(i.level, 2, "the next stretch left alone plays the next level");
    assert.ok(i.bank >= 50 && i.bank < 6350, "the level cut short banked what it had, not all of it: " + i.bank); assert.equal(i.score, i.bank, "and a quiet page shows the bank");
    const cut = i.bank;
    await t.page.evaluate(() => window.__tfTest.scenePass(49, 1)); await wait(300);
    i = await info(); assert.equal(i.level, 50); assert.equal(i.boss, 4, "level 50: the mothership"); assert.ok(i.bank > cut + 48 * 5000, "the levels skipped count whole: " + i.bank);
    const at50 = i.bank;
    await t.page.evaluate(() => window.__tfTest.sceneIdle());
    await t.page.waitForFunction(() => window.__tf().scene.t > 11.8, null, { timeout: 16000, polling: 50 });
    i = await info(); assert.equal(i.level, 50); assert.ok(i.score >= at50 + 50000 + 1000, "its fall is worth 50,000 on top of the level's own: " + (i.score - at50));
    await t.page.evaluate(() => window.__tfTest.scenePass(99, 1)); await wait(300);
    i = await info(); assert.equal(i.level, 100); assert.equal(i.boss, 5, "level 100: the moon");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  // 1.12 b395: a panel over the page holds the picture still: at once under one that blurs the page (every panel on a
  // phone, and a page such as Settings anywhere), once at rest under a wide screen's ⋯ popover; it goes on as the last closes
  await test(label + ": 1.12 b395: a scene holds still under a panel — at once under one that blurs the page, at rest under a wide screen's ⋯ popover — and goes on when the last panel closes", async () => {
    const t = await fresh(opts, { init: sceneDevice() });
    await sceneUp(t, "forest"); await wait(500);
    assert.equal((await t.s()).scene.running, true, "running before");
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]");
    await t.page.waitForFunction(() => !window.__tf().scene.running, null, { timeout: 3000, polling: 50 });
    let sc = (await t.s()).scene; assert.equal(sc.shaded, touch ? 2 : 1, "under ⋯, a sheet on a phone and a popover on a wide screen: " + JSON.stringify(sc));
    const f0 = sc.frames; await wait(700); assert.equal((await t.s()).scene.frames, f0, "and nothing drawn while it is open");
    await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(300);
    sc = (await t.s()).scene; assert.equal(sc.shaded, 2, "Settings blurs the page on every screen"); assert.equal(sc.running, false);
    await t.esc(); await t.page.waitForFunction(() => window.__tf().scene.running, null, { timeout: 3000, polling: 50 });
    const f1 = (await t.s()).scene.frames; await wait(500); assert.ok((await t.s()).scene.frames > f1 + 5, "drawing again once the panels are closed");
    // the loop playing: under a sheet it holds at once; under a popover it eases to rest, then holds
    await t.page.evaluate(() => window.__tfTest.sceneIdle()); await t.page.waitForFunction(() => window.__tf().scene.idle, null, { timeout: 4000, polling: 100 });
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]");
    if (touch) { await wait(150); assert.equal((await t.s()).scene.running, false, "held at once under the sheet"); }
    else await t.page.waitForFunction(() => { const s = window.__tf().scene; return !s.running && s.level === 0; }, null, { timeout: 4000, polling: 100 });
    await t.esc(); await t.page.waitForFunction(() => window.__tf().scene.running, null, { timeout: 3000, polling: 50 });
    assert.equal(t.errors.length, 0, t.errors.join("; ")); await t.close();
  });

  await test(label + ": 1.12 b318: a scene is nearly still while the list is in use (at thirty frames a second since b391, as the loop), plays its loop after twenty seconds alone and eases back at a touch, has its own moment at the finale, stops with the tab, and under reduced motion is one still frame", async () => {
    const t = await fresh(opts, { init: sceneDevice() });
    await sceneUp(t, "forest"); await t.page.keyboard.press("Shift"); await wait(300);
    const rate = async ms => { const a = (await t.s()).scene.frames; await wait(ms); return ((await t.s()).scene.frames - a) / (ms / 1000); };
    let sc = (await t.s()).scene; assert.equal(sc.fps, 30, "in use: thirty, as the loop (b391: fifteen read as a stutter): " + JSON.stringify(sc)); assert.equal(sc.idle, false); assert.equal(sc.t, 0, "the loop waits at its start");
    const amb = await rate(2000); assert.ok(amb > 20 && amb <= 31.5, "drawn at that, and no more: " + amb);
    // left alone
    await t.page.evaluate(() => window.__tfTest.sceneIdle());
    await t.page.waitForFunction(() => window.__tf().scene.idle, null, { timeout: 4000, polling: 100 });
    sc = (await t.s()).scene; assert.equal(sc.fps, 30, "the loop at thirty");
    const loop = await rate(2000); assert.ok(loop > 20 && loop <= 31.5, "drawn at that: " + loop);
    assert.ok((await t.s()).scene.t > 1, "with its clock running");
    // a touch, and it eases back to the start of its loop
    await t.page.keyboard.press("Shift");
    await t.page.waitForFunction(() => !window.__tf().scene.idle, null, { timeout: 3000, polling: 50 });
    await t.page.waitForFunction(() => { const s = window.__tf().scene; return s.level === 0 && s.t === 0 && !s.idle; }, null, { timeout: 5000, polling: 100 });
    // Everything is a page of words: the picture steps back behind a veil and its loop waits for Today
    await t.press("#v-all"); await t.page.waitForSelector("#all .row"); await wait(700);
    assert.equal((await t.s()).scene.busy, true, "Everything is busy");
    assert.equal(await t.page.$eval("#field", f => getComputedStyle(f.lastElementChild).opacity), "0.5", "the veil is up");
    await t.page.evaluate(() => window.__tfTest.sceneIdle()); await wait(1500);
    sc = (await t.s()).scene; assert.ok(!sc.idle && sc.level === 0 && sc.t === 0, "left alone on Everything, it stays quiet: " + JSON.stringify(sc));
    await t.press("#v-today"); await t.page.waitForSelector("#list .row"); await wait(700);
    assert.equal((await t.s()).scene.busy, false); assert.equal(await t.page.$eval("#field", f => getComputedStyle(f.lastElementChild).opacity), "0", "and down again on Today");
    await t.page.evaluate(() => window.__tfTest.sceneIdle());
    await t.page.waitForFunction(() => window.__tf().scene.idle, null, { timeout: 4000, polling: 100 });
    await t.page.keyboard.press("Shift"); await t.page.waitForFunction(() => !window.__tf().scene.idle, null, { timeout: 5000, polling: 100 });
    // the finale: its own moment, then back
    for (const box of await t.page.$$("#list .row:not(.done) .check")) { await box.click(); await wait(300); }
    await t.page.waitForFunction(() => window.__tf().scene.finale, null, { timeout: 4000, polling: 50 });
    await t.page.waitForFunction(() => { const s = window.__tf().scene; return s.finale && s.fps === 30; }, null, { timeout: 1500, polling: 20 }); // at thirty through it, from its next frame
    await t.page.waitForFunction(() => !window.__tf().scene.finale, null, { timeout: 8000, polling: 100 });
    // the tab hidden: nothing at all
    await t.page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
    await wait(200); sc = (await t.s()).scene; assert.equal(sc.running, false, "stopped with the tab");
    await wait(1000); assert.equal((await t.s()).scene.frames, sc.frames, "not a frame drawn while hidden");
    await t.page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
    await wait(300); assert.equal((await t.s()).scene.running, true, "and back with it");
    // reduced motion turned on: one still frame, and left alone it stays still
    await t.page.emulateMedia({ reducedMotion: "reduce" }); await wait(300);
    sc = (await t.s()).scene; assert.equal(sc.running, false, "reduced motion stops it");
    await wait(1000); assert.equal((await t.s()).scene.frames, sc.frames, "on a still frame");
    await t.page.evaluate(() => window.__tfTest.sceneIdle()); await wait(600); assert.equal((await t.s()).scene.running, false, "left alone, still");
    await t.page.emulateMedia({ reducedMotion: "no-preference" }); await wait(300); assert.equal((await t.s()).scene.running, true, "and moving again when it is off");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; "));
    await t.close();
    // a device that asks for reduced motion from the start: a whole picture, and nothing after it, the finale included
    const r = await fresh(opts, { init: sceneDevice(), reducedMotion: "reduce" });
    await sceneUp(r, "forest"); await wait(600);
    const still = (await r.s()).scene; assert.equal(still.running, false, "a still frame: " + JSON.stringify(still));
    const opaque = await r.page.evaluate(() => { const c = document.querySelectorAll("#field canvas")[1], d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] === 255) n++; return n / (d.length / 4); });
    assert.ok(opaque > .99, "the whole picture: " + opaque);
    for (const box of await r.page.$$("#list .row:not(.done) .check")) { await box.click(); await wait(300); }
    await wait(1400);
    assert.equal(await r.page.textContent("#finale span") !== "", true, "the finale's line lands");
    assert.equal((await r.s()).scene.finale, false, "with no moment of the scene's own"); assert.equal((await r.s()).scene.running, false);
    assert.equal(r.errors.length, 0, r.errors.join("; "));
    await r.close();
  });

  // 1.12 b367: the forever cycle — the stage counts the passes and hands each to the scene
  await test(label + ": 1.12 b367: the forever cycle — a visit opens on pass 0, the scene's signature loop; the pass moves on each time the loop comes round, and when it comes back after the list was used, so every stretch left alone opens on a new one; and the instruments can hold one", async () => {
    const t = await fresh(opts, { init: sceneDevice() });
    await sceneUp(t, "forest"); await t.page.keyboard.press("Shift"); await wait(300);
    let sc = (await t.s()).scene; assert.equal(sc.pass, 0, "a visit opens on pass 0: " + JSON.stringify(sc)); assert.equal(sc.carry, false, "Forest's picture rests the same between passes");
    await t.page.evaluate(() => window.__tfTest.sceneIdle());
    await t.page.waitForFunction(() => { const s = window.__tf().scene; return s.idle && s.t > .5; }, null, { timeout: 4000, polling: 100 });
    assert.equal((await t.s()).scene.pass, 0, "the signature plays first");
    await t.page.keyboard.press("Shift"); // cut short: it eases back, and the next stretch alone opens on the next pass
    await t.page.waitForFunction(() => { const s = window.__tf().scene; return s.level === 0 && s.t === 0; }, null, { timeout: 5000, polling: 100 });
    assert.equal((await t.s()).scene.pass, 1, "the next stretch opens on the next pass");
    await t.page.evaluate(() => window.__tfTest.scenePass(7, 1)); // where the instruments put it
    await t.page.evaluate(() => window.__tfTest.sceneIdle());
    await t.page.waitForFunction(() => window.__tf().scene.idle, null, { timeout: 4000, polling: 100 });
    assert.equal((await t.s()).scene.pass, 7, "held where it was put");
    await t.page.waitForFunction(() => window.__tf().scene.pass === 8, null, { timeout: 17000, polling: 200 }); // and round again
    sc = (await t.s()).scene; assert.ok(sc.idle && sc.t < 3, "the next pass from its start: " + JSON.stringify(sc));
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join("; "));
    await t.close();
  });

  await test(label + ": 1.12 b321: every kit with a scene brings its own and only its module, draws, plays its loop left alone, has its finale's moment, and throws nothing", async () => {
    const t = await fresh(opts, { init: sceneDevice() });
    await sceneUp(t, "forest");
    for (const kit of SCENE_KITS) {
      await openPicker(t, "night"); await t.page.click(`#p-theme .swatch[data-code="T1:curated:${kit}"]`); await wait(300); await t.esc(); await wait(200);
      await sceneUp(t, kit);
      const files = await sceneFiles(t); assert.ok(files.includes(SCENE_MODS[kit]), kit + ": its module: " + files.join(", "));
      const extra = files.filter(f => /^scene-/.test(f) && !Object.values(SCENE_MODS).includes(f)); assert.deepEqual(extra, [], kit + ": nothing that is not a scene's");
      let sc = (await t.s()).scene; assert.ok(sc.running && sc.frames > 0, kit + ": drawing: " + JSON.stringify(sc));
      await t.page.evaluate(() => window.__tfTest.sceneIdle());
      await t.page.waitForFunction(() => { const s = window.__tf().scene; return s.idle && s.fps === 30; }, null, { timeout: 5000, polling: 100 });
      await t.page.evaluate(() => window.__tfTest.sceneFinale());
      await t.page.waitForFunction(() => window.__tf().scene.finale, null, { timeout: 3000, polling: 50 });
      await t.page.waitForFunction(() => !window.__tf().scene.finale, null, { timeout: 8000, polling: 100 });
      await t.page.keyboard.press("Shift");
    }
    assert.deepEqual(await t.page.$$eval("#field canvas", els => els.length), 2, "one picture (and its backdrop) at a time");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join("; "));
    await t.close();
  });

  // 1.12 b361: the hidden kits have scenes too, once this device has them (the unlock is the device's own latch, as the
  // picker writes it: no word is typed here)
  const HIDDEN_MODS = { birthday: "scene-party.js", superpink: "scene-party.js", whiteboard: "scene-board.js", chalkboard: "scene-board.js", bark: "scene-wood.js", char: "scene-wood.js" };
  const hiddenDevice = `try { if (!localStorage.getItem("tf/v2/meta")) localStorage.setItem("tf/v2/meta", JSON.stringify({ device: { day: "T1:curated:harbor", night: "T1:curated:forest", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }, scenes: true, secret: true, extras: ["chalk", "wood"] } })); } catch (e) {}`;
  await test(label + ": 1.12 b361: each hidden kit with a scene, once this device has it, brings its own module in place of its field or ground, draws, plays its loop left alone, has its moment under the kit's own finale, and throws nothing", async () => {
    const t = await fresh(opts, { init: hiddenDevice });
    await sceneUp(t, "forest");
    for (const kit of Object.keys(HIDDEN_MODS)) {
      await openPicker(t, "night"); await t.page.click(`#p-theme .swatch[data-code="T1:curated:${kit}"]`); await wait(300); await t.esc(); await wait(200);
      await sceneUp(t, kit);
      const files = await sceneFiles(t); assert.ok(files.includes(HIDDEN_MODS[kit]), kit + ": its module: " + files.join(", "));
      const sc = (await t.s()).scene; assert.ok(sc.running && sc.frames > 0, kit + ": drawing: " + JSON.stringify(sc));
      await t.page.evaluate(() => window.__tfTest.sceneIdle());
      await t.page.waitForFunction(() => { const s = window.__tf().scene; return s.idle && s.fps === 30; }, null, { timeout: 5000, polling: 100 });
      await t.page.evaluate(() => window.__tfTest.sceneFinale());
      await t.page.waitForFunction(() => window.__tf().scene.finale, null, { timeout: 3000, polling: 50 });
      await t.page.waitForFunction(() => !window.__tf().scene.finale, null, { timeout: 8000, polling: 100 });
      await t.page.keyboard.press("Shift");
    }
    assert.deepEqual(await t.page.$$eval("#field canvas", els => els.length), 2, "one picture (and its backdrop) at a time");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, "csp: " + t.csp.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join("; "));
    await t.close();
  });

  await test(label + ": 1.12 b328: Light's and Dark's liquid (and, from b332, Sketch's balloon; from b334, Pink's heart; from b336, Cocoa's cup; from b353, Blush's wand and its big bubble; from b361, Birthday's bouquet and Superpink's mirror ball; from b363, Whiteboard's plan and Chalkboard's lesson; from b365, Bark's inlay and Char's burned medallion) keeps to the empty part of the page — no pad under the words, and wherever it settles it is clear of every line, before and after a long line is added", async () => {
    const t = await fresh(opts, { init: hiddenDevice });
    await sceneUp(t, "forest");
    const clear = () => t.page.evaluate(() => { const s = window.__tf().scene, [x, y, r] = s.spot || [-1e4, -1e4, 0], range = document.createRange(), hits = [];
      for (const el of document.querySelectorAll("#today .row .tx")) { range.selectNodeContents(el); const b = range.getBoundingClientRect(); const dx = Math.max(b.left - x, 0, x - b.right), dy = Math.max(b.top - y, 0, y - b.bottom); if (Math.hypot(dx, dy) < r) hits.push(el.textContent.slice(0, 20)); }
      return { spot: s.spot, hits, flag: document.documentElement.dataset.sceneClear !== undefined, pad: getComputedStyle(document.getElementById("today")).backgroundColor }; });
    for (const kit of ["light", "dark", "sketch", "blush", "pink", "cocoa", "birthday", "superpink", "whiteboard", "chalkboard", "bark", "char"]) {
      await openPicker(t, "night"); await t.page.click(`#p-theme .swatch[data-code="T1:curated:${kit}"]`); await wait(300); await t.esc(); await wait(200);
      await sceneUp(t, kit); await wait(2500);
      let c = await clear(); assert.ok(c.flag, kit + ": the stage knows it keeps clear"); assert.ok(/rgba\(0, 0, 0, 0\)|transparent/.test(c.pad), kit + ": no pad under the words: " + c.pad);
      assert.deepEqual(c.hits, [], kit + ": clear of every line, at " + JSON.stringify(c.spot));
      await t.press("#addtoday"); await t.page.keyboard.type("A line long enough to reach across most of the page and then some more"); await t.page.keyboard.press("Enter"); await t.page.keyboard.press("Escape"); await wait(2800);
      c = await clear(); assert.deepEqual(c.hits, [], kit + ": still clear after a long line (or gone, with no room), now at " + JSON.stringify(c.spot));
    }
    await openPicker(t, "night"); await t.page.click(`#p-theme .swatch[data-code="T1:curated:forest"]`); await wait(300); await t.esc(); await sceneUp(t, "forest");
    assert.equal(await t.page.evaluate(() => document.documentElement.dataset.sceneClear), undefined, "a scene that doesn't keep clear has its pad back");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join("; "));
    await t.close();
  });

  await test(label + ": 1.12 b330: Sunset's and Dusk's pad hugs each line — no pad across the list, one soft pad over each line's words, and they follow the words when a line is added", async () => {
    const t = await fresh(opts, { init: sceneDevice() });
    await sceneUp(t, "forest");
    const pads = () => t.page.evaluate(() => { const range = document.createRange(), lines = [...document.querySelectorAll("#today .row .tx")].map(el => { range.selectNodeContents(el); return range.getBoundingClientRect(); }).filter(b => b.width > 0);
      const hugs = [...document.querySelectorAll("#field > div")].find(d => d.children.length && [...d.children].every(c => c.style.filter)), shown = hugs ? [...hugs.children].filter(c => c.style.display !== "none").map(c => c.getBoundingClientRect()) : [];
      const covered = lines.every(b => shown.some(p => p.left <= b.left && p.right >= b.right && p.top <= b.top && p.bottom >= b.bottom));
      return { lines: lines.length, pads: shown.length, covered, pad: getComputedStyle(document.getElementById("today")).backgroundColor }; });
    for (const kit of ["sunset", "dusk"]) {
      await openPicker(t, "night"); await t.page.click(`#p-theme .swatch[data-code="T1:curated:${kit}"]`); await wait(300); await t.esc(); await wait(200);
      await sceneUp(t, kit); await wait(600);
      let p = await pads(); assert.ok(/rgba\(0, 0, 0, 0\)|transparent/.test(p.pad), kit + ": no pad across the list: " + p.pad);
      assert.ok(p.lines > 0 && p.pads === p.lines && p.covered, kit + ": a pad over each line's words: " + JSON.stringify(p));
      await t.press("#addtoday"); await t.page.keyboard.type("One more line, to see the pads follow"); await t.page.keyboard.press("Enter"); await t.page.keyboard.press("Escape"); await wait(800);
      p = await pads(); assert.ok(p.pads === p.lines && p.covered, kit + ": still one over each after a line is added: " + JSON.stringify(p));
    }
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join("; "));
    await t.close();
  });

  await test(label + ": 1.12 b339: in Everything a section's name and count read like a line's words — the stage measures them, and Dusk lays a pad under each", async () => {
    const dev = `;try { if (!sessionStorage.getItem("tf-b339")) { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device = Object.assign(m.device || {}, { day: "T1:curated:harbor", night: "T1:curated:dusk", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }, scenes: true }); localStorage.setItem("tf/v2/meta", JSON.stringify(m)); sessionStorage.setItem("tf-b339", "1"); } } catch (e) {}`;
    const SAT = new Date("2026-09-12T14:00:00"); // the long-time fixture's Saturday
    const t = await fresh(opts, { list: false, init: seedScript({ now: +SAT }) + dev, clock: SAT });
    await t.page.waitForSelector("#list .row"); await sceneUp(t, "dusk");
    await t.press("#v-all"); await t.page.waitForSelector("#all .row"); await wait(900);
    const heads = await t.page.evaluate(() => { const vis = b => b.width > 0 && b.bottom > 0 && b.top < innerHeight, names = [...document.querySelectorAll("#all .sec-toggle, #all .sec-count")].map(e => e.getBoundingClientRect()).filter(vis);
      const hugs = [...document.querySelectorAll("#field > div")].find(d => d.children.length && [...d.children].every(c => c.style.filter)), shown = hugs ? [...hugs.children].filter(c => c.style.display !== "none").map(c => c.getBoundingClientRect()) : [];
      return { names: names.length, padded: names.filter(b => shown.some(p => p.left <= b.left && p.right >= b.right && p.top <= b.top && p.bottom >= b.bottom)).length }; });
    assert.ok(heads.names >= 2 && heads.padded === heads.names, "a pad under each section's name and count on screen: " + JSON.stringify(heads));
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join("; "));
    await t.close();
  });

  await test(label + ": no page errors, CSP violations or third-party requests across a full session", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.esc(); await t.press("#v-today");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="appearance"]'); await t.page.waitForSelector("#p-appear[open]"); await t.page.click('#p-appear .slot[data-slot="night"]');
    await t.page.waitForSelector("#p-theme[open]"); await t.page.click("#sw-dark .swatch:nth-child(4)"); await wait(200); await t.page.click("#partner-use"); await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-appear[open]"); await wait(250); await t.page.click("#ap-pairs-go"); await t.page.waitForSelector("#p-pairs[open]"); await wait(250); await t.press('#ap-pairs .pair[aria-label="Harbor by day, Forest by night"]'); await wait(300); await t.page.click("#p-pairs h2 .back"); await t.page.waitForSelector("#p-appear[open]"); await wait(250); await t.page.click("#ap-scenes"); await wait(300); await t.page.click('#ap-switch [data-mode="schedule"]'); await wait(300); await t.page.click('#ap-switch [data-mode="system"]'); await wait(300); await t.esc(); await wait(200);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="sound"]'); await t.page.waitForSelector("#p-sound[open]"); await wait(200); await t.page.click('#snd-slot [data-slot="day"]'); await t.page.click('#snd-packs [data-pack="bell"]'); await wait(200); await t.page.click('#snd-packs [data-pack=""]'); await wait(200);
    await t.page.click("#p-sound h2 .back"); await t.page.waitForSelector("#p-settings[open]"); await wait(200); await t.page.click('[data-set="addurl"]'); await t.page.waitForSelector("#p-addurl[open]"); await wait(200); await t.esc(); await wait(200);
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
