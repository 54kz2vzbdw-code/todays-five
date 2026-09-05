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
async function fresh(opts, { url = BASE + "?transport=local", list = true, ctx: shared = null, scheme = "dark", clock = null, reducedMotion = "no-preference" } = {}) {
  // a second "device" on the local transport is a second tab of the same context: the local server lives in localStorage.
  // The system is dark unless a test says otherwise (1.2 starts a fresh device With the system); `clock` installs a fake one.
  const ctx = shared || await browser.newContext({ ...opts, colorScheme: scheme, reducedMotion });
  open.add(ctx);
  const page = await ctx.newPage(); page.setDefaultTimeout(6000);
  if (clock) await page.clock.install({ time: clock });
  const errors = [], csp = [], thirdParty = [], consoleErrors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { const t = m.text(); if (/Content Security Policy|Refused to/.test(t)) csp.push(t); else if (m.type() === "error") consoleErrors.push(t); });
  page.on("request", r => { const u = new URL(r.url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !u.protocol.startsWith("blob") && !u.protocol.startsWith("data")) thirdParty.push(r.url()); });
  await page.goto(url);
  if (list) {
    await page.waitForSelector("#welcome:not([hidden])");
    await page.click("#w-new"); await page.waitForSelector("#p-save[open]"); await page.click("#save-done"); await wait(500);
    await page.waitForSelector("#list .row");
    if (!opts.hasTouch) { await page.mouse.move(2, 2); await wait(400); } // past the tools' fade, so "at rest" means at rest
  }
  const s = () => page.evaluate(() => window.__tf());
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
  return { ctx, page, errors, csp, thirdParty, consoleErrors, s, press, hold, lineMenu, away, visibleTools, front, close: () => shared ? page.close() : ctx.close() };
}
const rect = (page, sel) => page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; });
const seedLines = JSON.parse(fs.readFileSync(new URL("../model.js", import.meta.url), "utf8").match(/SEED_LINES = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));

for (const [label, opts, touch] of VIEWPORTS) {
  console.log("\n==", label);

  await test(label + ": a new list — the save sheet, then five seed lines of 32 characters or fewer all on screen, no tour, no mark, nothing else", async () => {
    const t = await fresh(opts);
    assert.equal(await t.page.locator("#list .row").count(), 5);
    assert.equal(await t.page.locator("#tour").count(), 0, "the tour is gone from the page");
    await wait(1500); // anything that wanted to appear after the save sheet has had its chance
    assert.ok(await t.page.locator("#mark").isHidden(), "no coach mark on Today after the save-link sheet");
    assert.equal(await t.page.locator("dialog[open]").count(), 0, "no sheet");
    assert.ok(await t.page.locator("#whatsnew").isHidden(), "no what's-new on first run");
    const texts = await t.page.$$eval("#list .row .tx", els => els.map(e => e.dataset.text));
    assert.equal(JSON.stringify(texts), JSON.stringify(seedLines));
    for (const l of texts) assert.ok(l.length <= 32, l + " is over 32 characters");
    const fits = await t.page.evaluate(() => { const l = document.getElementById("list"); const last = l.lastElementChild.getBoundingClientRect(); return { noScroll: l.scrollHeight <= l.clientHeight + 1, lastBottom: last.bottom, vh: innerHeight, addBottom: document.getElementById("addtoday").getBoundingClientRect().bottom }; });
    assert.ok(fits.noScroll && fits.lastBottom <= fits.vh && fits.addBottom <= fits.vh, "all five fit without scrolling: " + JSON.stringify(fits));
    assert.ok(/all five/.test(texts[4]), "the payoff line is last and visible");
    const st = await t.s(); assert.equal(st.seenVersion, VERSION, "first run marks the version seen silently");
    assert.equal(t.errors.length, 0, "page errors: " + t.errors); assert.equal(t.csp.length, 0, "csp: " + t.csp); assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty);
    await t.close();
  });

  await test(label + ": the welcome has no rail and no footer; both are back once a list opens", async () => {
    const t = await fresh(opts, { list: false });
    await t.page.waitForSelector("#welcome:not([hidden])");
    assert.equal(await t.page.$eval(".rail", e => getComputedStyle(e).display), "none", "rail hidden on welcome");
    assert.equal(await t.page.$eval("#foot", e => getComputedStyle(e).display), "none", "footer hidden on welcome");
    const parts = await t.page.$$eval("#welcome > *:not([hidden])", els => els.map(e => e.tagName.toLowerCase()));
    assert.equal(parts.join(","), "h1,p,div,div,p", "title, sentences, buttons, (error slot), link: " + parts);
    assert.equal(await t.page.$eval("#welcome-msg", e => e.textContent.split(/[.!?](\s|$)/).filter(s => s.trim()).length), 3, "three sentences");
    await t.page.click("#w-new"); await t.page.waitForSelector("#p-save[open]"); await t.page.click("#save-done"); await wait(400);
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
    assert.equal(labels.join("|"), (touch ? "Share this list" : "Share & open on phone") + "|Theme|Sound|Full screen|How it works|Lists|Settings|About & privacy|Delete this list everywhere");
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
    await t.page.keyboard.press("Escape"); await wait(200);
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
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.page.keyboard.press("Escape"); await wait(200);
    const atRest = await t.visibleTools("#all");
    assert.equal(atRest.join(","), "today,today,today,today,today", "Everything at rest: only the stars: " + atRest);
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
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.page.keyboard.press("Escape"); await wait(200);
    await t.lineMenu("#all .row:nth-child(2)");
    assert.equal((await t.page.textContent("#p-line .menu button:first-child .lb")).trim(), "Edit", "Edit at the top");
    if (!touch) { assert.ok(await t.page.$eval("#p-line", e => e.classList.contains("pop")), "popover"); const d = await rect(t.page, "#p-line"), g = await rect(t.page, "#all .row:nth-child(2) .tool.lmenu"); assert.ok(d.top >= g.bottom - 1 && Math.abs(d.right - g.right) < 8, "under ⋯: " + JSON.stringify({ d, g })); }
    else assert.ok(!(await t.page.$eval("#p-line", e => e.classList.contains("pop"))), "a sheet on the phone");
    await t.page.keyboard.press("Escape"); await wait(300);
    const first = await t.page.$eval("#all .row:first-child .tx", e => e.dataset.text);
    if (touch) {
      // swipe right → the menu
      await t.hold("#all .row:nth-child(3) .tx", 60, 120); await t.page.waitForSelector("#p-line[open]"); await t.page.keyboard.press("Escape"); await wait(300);
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
    await t.page.keyboard.press("Escape");
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
      await t.page.waitForSelector("#p-line[open]"); assert.equal((await t.s()).mark, "", "gone on release"); await t.page.keyboard.press("Escape"); await wait(300);
      assert.equal((await t.hold("#all .row:nth-child(3) .tx")).mark, "", "a second hold shows nothing"); await t.page.keyboard.press("Escape"); await wait(300);
      await t.hold("#all .row:nth-child(2) .tx"); await t.press('#p-line [data-lact="edit"]');
    } else {
      await t.page.hover("#all .row:nth-child(2) .tx"); await wait(120); await t.page.hover("#all .row:nth-child(2) .tool.lmenu"); await wait(300);
      assert.equal((await t.s()).mark, "drag", "the drag hint on the first ⋯ hover"); assert.ok(/Drag/.test(await t.page.textContent("#mark-text")));
      await t.page.keyboard.press("Escape"); await wait(200); assert.equal((await t.s()).mark, "", "a key dismisses it");
      await t.away(); await t.page.hover("#all .row:nth-child(3) .tx"); await wait(120); await t.page.hover("#all .row:nth-child(3) .tool.lmenu"); await wait(300); assert.equal((await t.s()).mark, "", "never again"); await t.away();
      await t.page.focus("#all .row:nth-child(2) .check"); await t.page.keyboard.press("e");
    }
    await t.page.waitForSelector("#all .row.editing"); await t.page.keyboard.type(" now"); await t.page.keyboard.press("Enter"); await wait(300); // Enter saves and opens the next line
    await t.page.keyboard.press("Escape"); await wait(500);
    assert.equal((await t.s()).mark, "menu", "the menu hint once the first edit is done and no editor is open");
    assert.ok(new RegExp(touch ? "Hold" : "⋯").test(await t.page.textContent("#mark-text")));
    await t.page.keyboard.press("Escape"); await wait(200);
    assert.equal(JSON.stringify((await t.s()).hints), JSON.stringify({ today: true, drag: true, menu: true }));
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
    assert.equal(JSON.stringify((await t.s()).hints), JSON.stringify({ today: true, drag: true, menu: true }), "remembered on the device");
    await t.press("#v-all"); await wait(400); assert.equal((await t.s()).mark, "", "nothing after a reload either");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": the footers are four items per view" + (touch ? " (hidden on the phone)" : ""), async () => {
    const t = await fresh(opts);
    if (touch) { assert.equal(await t.page.$eval("#hint", e => getComputedStyle(e).display), "none"); await t.close(); return; }
    const items = () => t.page.$$eval("#hint em", els => els.map(e => e.textContent));
    assert.equal((await items()).join(" "), "1–5 N E ?", "Today: 1–5 check off · N new · E edit · ? help");
    assert.equal(await t.page.$eval("#hint", e => e.textContent.replace(/\s+/g, " ").trim()), "1–5 check off · N new · E edit · ? help");
    await t.press("#v-all"); await wait(200);
    assert.equal(await t.page.$eval("#hint", e => e.textContent.replace(/\s+/g, " ").trim()), "A today · N new · / search · ? help");
    await t.page.keyboard.press("Escape"); await t.page.keyboard.press("?"); await t.page.waitForSelector("#p-keys[open]");
    assert.ok(/Undo/.test(await t.page.textContent("#keys-body")) && /Hover a line/.test(await t.page.textContent("#keys-body")), "? is the reference: every key and the mouse"); assert.ok(/Day ↔ Night/.test(await t.page.textContent("#keys-body")) && /Appearance/.test(await t.page.textContent("#keys-body")), "T and ⇧T in the reference");
    await t.page.click("#keys-help"); await t.page.waitForSelector("#p-help[open]"); assert.ok(/no tour/i.test(await t.page.textContent("#help-body")));
    await t.page.keyboard.press("Escape");
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
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]"); await wait(4600); assert.ok(!(await t.s()).idle, "no fade while a panel is open"); await t.page.keyboard.press("Escape");
    for (let i = 0; i < 5; i++) { await t.press("#list .row:not(.done) .check"); await wait(450); } await wait(1200); await t.away(); await wait(4600);
    assert.ok(!(await t.s()).idle, "no fade during the finale"); assert.ok(await t.page.locator("#finale.on").isVisible());
    await t.press("#again"); await wait(300);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.getAttribute('[data-set="fade"]', "aria-pressed"), "true", "on by default"); await t.page.click('[data-set="fade"]'); await t.page.keyboard.press("Escape"); await t.away(); await wait(4600);
    assert.ok(!(await t.s()).idle, "off by the setting");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.idleFadeOff), true);
    await t.close();
  });

  await test(label + ": Settings has five sections, the toggles hold, and Advanced keeps the add-from-anywhere URL and who's-here beside Export & import ›", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    const heads = await t.page.$$eval("#p-settings h3", els => els.map(e => e.textContent.trim()));
    assert.equal(heads.join("|"), "Appearance|Sound|Behavior|Lists|Advanced");
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
    // Advanced: the URL and who's here on top, export and import one level down
    const adv = await t.page.$$eval("#p-settings h3:last-of-type ~ .menu > *", els => els.map(e => (e.querySelector(".lb") || e).textContent.trim().split(/\n|(?<=[a-z])(?=[A-Z])/)[0].slice(0, 18)));
    assert.equal(adv.join("|"), "Add from anywhere|Export & import|Show who's here", adv.join("|"));
    assert.ok((await t.page.inputValue("#set-addurl")).includes("/add?text="), "the personalised URL is still there");
    await t.page.click('[data-set="export"]'); await t.page.waitForSelector("#p-export[open]");
    assert.equal(await t.page.locator("#set-export-json:not([disabled]), #set-export-md:not([disabled]), #set-import-file").count(), 3, "export and import inside the sub-sheet");
    assert.ok(/only backup/.test(await t.page.textContent("#p-export")));
    await t.page.keyboard.press("Escape");
    // the settings survive a reload
    await t.page.reload(); await t.page.waitForSelector("#list .row");
    const dev = await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device);
    assert.equal(dev.review, true); assert.equal(dev.celebrateRemote, true); assert.equal(dev.whoOff, true); assert.equal(dev.switch.mode, "system");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": repeat rule from the line menu, the glyph, and the rollover reset", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.page.keyboard.press("Escape");
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
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
    assert.ok(await t.page.evaluate(() => document.body.classList.contains("one")), "remembered per device");
    for (let i = 0; i < 4; i++) { await t.press("#list .row.one-now .check"); await wait(700); }
    await wait(900);
    assert.ok(!(await t.page.evaluate(() => document.body.classList.contains("one"))), "the finale ends it");
    assert.ok(await t.page.locator("#finale.on").isVisible());
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": search — no lone icon; a Search button past eight lines, / always works, Escape clears", async () => {
    const t = await fresh(opts);
    const { listId } = await t.s();
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300); await t.page.keyboard.press("Escape");
    assert.ok(await t.page.$eval("#all-head", e => e.hidden), "five lines: no search affordance at all");
    assert.equal(await t.page.locator("#all-head svg").count(), 0, "no lone icon");
    if (!touch) { await t.page.keyboard.press("/"); await t.page.waitForSelector("#search:not([hidden])"); assert.ok(!(await t.page.$eval("#all-head", e => e.hidden)), "/ opens the field even under eight lines"); await t.page.keyboard.press("Escape"); await wait(200); assert.ok(await t.page.$eval("#all-head", e => e.hidden), "and it goes away again"); }
    await t.page.goto(BASE + "?transport=local#/l/" + listId + "/add?text=Six%0ASeven%0AEight%0ANine"); await wait(1200);
    await t.press("#v-all"); await t.page.waitForSelector("#all:not([hidden])"); await wait(300);
    assert.equal(await t.page.locator("#all .row").count(), 9);
    assert.ok(!(await t.page.$eval("#all-head", e => e.hidden)), "nine lines: the Search button appears");
    assert.equal(await t.page.$eval("#search-btn", e => e.firstChild.textContent.trim()), "Search", "worded, not an icon");
    if (touch) await t.page.tap("#search-btn"); else await t.page.keyboard.press("/");
    await t.page.waitForSelector("#search:not([hidden])");
    await t.page.type("#search", "link"); await wait(200);
    assert.equal(await t.page.$$eval("#all .row", rows => rows.filter(r => getComputedStyle(r).display !== "none").length), 1);
    await t.page.fill("#search", "zzz-nothing"); await wait(200);
    assert.ok(await t.page.locator(".nohits").isVisible());
    await t.page.keyboard.press("Escape"); await wait(200);
    assert.equal(await t.page.$$eval("#all .row", rows => rows.filter(r => getComputedStyle(r).display !== "none").length), 9);
    assert.ok(!(await t.page.$eval("#all-head", e => e.hidden)), "the button stays while there are nine lines");
    await t.close();
  });

  await test(label + ": recently deleted at the bottom of Everything (delete from the line menu), with Restore", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await wait(300); await t.page.keyboard.press("Escape");
    const text = await t.page.$eval("#all .row:nth-child(2) .tx", e => e.dataset.text);
    await t.lineMenu("#all .row:nth-child(2)"); await t.page.click('#p-line [data-lact="delete"]'); await wait(500);
    assert.ok(/Recently deleted \(1\)/.test(await t.page.textContent("#deleted summary")));
    await t.page.click("#deleted summary"); await wait(200);
    assert.ok((await t.page.textContent("#deleted li .t")).includes(text));
    await t.page.click("#deleted [data-restore]"); await wait(400);
    assert.equal(await t.page.locator("#deleted").count(), 0);
    assert.equal(await t.page.locator("#all .row").count(), 5);
    await t.close();
  });

  await test(label + ": section menu — templates (save, insert), put all on Today / take all off", async () => {
    const t = await fresh(opts);
    await t.page.click("#v-all"); await wait(300); await t.page.keyboard.press("Escape"); await t.page.click("#addsec"); await t.page.fill("#ask-input", "Work"); await t.page.click("#ask-ok"); await wait(300);
    await t.press("#all .sec .sec-more"); await t.page.waitForSelector("#p-sec[open]");
    await t.page.click('#p-sec [data-sact="template"]'); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Five"); await t.page.click("#ask-ok"); await wait(300);
    await t.press("#all .sec .sec-more"); await t.page.click('#p-sec [data-sact="today-off"]'); await wait(400);
    assert.equal(await t.page.locator('#all .tool.today[aria-pressed="true"]').count(), 0, "all off Today");
    await t.press("#all .sec .sec-more"); await t.page.click('#p-sec [data-sact="today-on"]'); await wait(400);
    assert.equal(await t.page.locator('#all .tool.today[aria-pressed="true"]').count(), 5, "all on Today");
    await t.press('#all .sec[data-id="' + await t.page.$eval('#all .sec:not([data-id=""])', e => e.dataset.id) + '"] .sec-more'); await t.page.click('#p-sec [data-sact="insert"]'); await t.page.waitForSelector("#p-pick[open]");
    await t.page.click("#pick-menu button"); await wait(400);
    assert.equal(await t.page.locator("#all .row").count(), 10, "five template lines inserted into Work");
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
    await t.press("#listname"); await t.page.waitForSelector("#p-lists[open]"); await t.page.click("#lists-menu button:not(:has(.cur))"); await wait(600);
    assert.equal((await t.s()).listId, first.listId);
    const text = await t.page.$eval("#list .row:first-child .tx", e => e.dataset.text);
    await t.lineMenu("#list .row:first-child"); await t.page.click('#p-line [data-lact="move"]'); await t.page.waitForSelector("#p-pick[open]");
    await t.page.click("#pick-menu button"); await wait(500);
    assert.equal(await t.page.locator("#list .row").count(), 4);
    const held = await t.page.evaluate(id => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + id)).doc.items).filter(i => !i.deleted).map(i => i.text), second.listId);
    assert.ok(held.includes(text), "target holds " + text + ": " + JSON.stringify(held));
    await t.page.click("#toast-undo"); await wait(500);
    assert.equal(await t.page.locator("#list .row").count(), 5, "moved back");
    await t.close();
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
    assert.equal(await t.page.locator("#list .row").count(), 5);
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
    await t.page.reload(); await wait(800);
    assert.equal(await t.page.locator("#list .row").count(), 7, "a reload adds nothing");
    await t.page.goto(BASE + "?transport=local#/r/" + R + "/add?text=Nope"); await wait(1500);
    assert.ok(/view link/i.test(await t.page.textContent("#toast .msg")), "refused out loud");
    assert.equal(await t.page.locator("#list .row").count(), 7);
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
    for (let i = 2; i <= 5; i++) { await editor.press("#list .row:not(.done) .check"); await wait(700); }
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
    await other.front(); await other.page.reload(); await other.page.waitForSelector("#list .row"); await other.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    await other.page.evaluate(() => document.dispatchEvent(new PointerEvent("pointerdown")));
    const q1 = (await other.s()).stats;
    await editor.press("#list .row:not(.done) .check"); await wait(1500);
    assert.ok((await other.s()).stats.check > q1.check, "celebrates with the setting on");
    await viewer.close(); await other.close(); await editor.close();
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
    await a.front(); await a.page.reload(); await a.page.waitForSelector("#list .row"); await a.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
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
    for (const pack of ["knock", "bell", "blip", "typewriter", "marble", "pop"]) {
      await t.page.selectOption("#set-pack", pack); await wait(150);
      const ok = await t.page.evaluate(() => { const s = window.__tf(); return s.audio.state === "running"; });
      assert.ok(ok, pack + ": context running");
    }
    assert.ok(/Dark picks Knock; this device plays Pop/.test(await t.page.textContent("#set-pack-sub")), "says which one wins (Dark is on: a dark system, Night = Dark): " + await t.page.textContent("#set-pack-sub"));
    await t.page.keyboard.press("Escape"); await wait(200);
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
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]");
    assert.equal((await t.page.textContent("#p-theme-h")).trim(), "Night theme"); assert.equal((await t.page.textContent("#c-use")).trim(), "Use for Night");
    assert.equal(await t.page.$$eval("#c-pack option", os => os.map(o => o.value).join(",")), ",knock,bell,blip,typewriter,marble,pop");
    await t.page.fill("#c-hex", "#3366FF"); await t.page.dispatchEvent("#c-hex", "input"); await wait(150);
    assert.equal(await t.page.$eval("#c-pack option", o => o.textContent), "Auto · Bell", "blue rings a bell by the hue rule");
    await t.page.selectOption("#c-pack", "marble"); await wait(200);
    await t.page.fill("#c-name", "Marbles"); await t.page.dispatchEvent("#c-name", "input"); await t.page.click("#c-save"); await wait(500);
    const codes = await t.page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.themes).map(x => x.code));
    assert.equal(codes.join(""), "T2:d:3366FF:grotesk:marble:Marbles", "the pack rides in the theme record");
    assert.equal(await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device.night), "T2:d:3366FF:grotesk:marble:Marbles", "and in the Night slot"); assert.equal((await t.s()).theme, "custom-3366ff-d-grotesk-marble", "which is on");
    await t.page.fill("#c-import", "T1:d:FF3D9A:fraunces:Old pink"); await t.page.click("#c-import-go"); await wait(200);
    assert.equal(await t.page.$eval("#c-pack", s => s.value), "", "a T1 code imports with the hue rule");
    assert.equal(await t.page.inputValue("#c-hex"), "#FF3D9A");
    await t.page.keyboard.press("Escape"); await wait(200);
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
    assert.equal(await t.page.locator("#list .row").count(), 6);
    await t.close();
  });

  await test(label + ": day review shows under the finale when on, dismisses on a tap, never fires a sound", async () => {
    const t = await fresh(opts);
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.review = true; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.page.reload(); await t.page.waitForSelector("#list .row");
    for (let i = 1; i <= 5; i++) { await t.press("#list .row:not(.done) .check"); await wait(650); }
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
    assert.equal((await t.page.textContent("#l-archive")).trim(), "Remove from this device");
    await t.page.click("#l-archive"); await wait(600);
    assert.ok(await t.page.locator("#welcome").isVisible());
    assert.ok(await t.page.evaluate(id => !!localStorage.getItem("tf/v2/localserver/" + id), lookupId), "server row untouched");
    await t.page.evaluate(() => document.getElementById("more").click()); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="lists"]');
    await t.page.waitForSelector("#lists-removed button"); await t.page.click("#lists-removed button"); await wait(600);
    assert.equal((await t.s()).listId, listId);
    await t.close();
  });

  await test(label + ": a 1.0 device (it called itself 4.0.0) opens 1.2 — the toast once, nothing else, nothing about version numbers, list intact, no hints later", async () => {
    const t = await fresh(opts);
    const { listId } = await t.s();
    // turn this device into a 1.0 one: the version it remembers is 4.0.0, it went through the tour, it never heard of hints
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); m.device.seenVersion = "4.0.0"; m.device.tourDone = true; delete m.device.hints; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(1800);
    assert.ok(await t.page.locator("#whatsnew").isVisible(), "what's-new toast");
    const msg = await t.page.textContent("#wn-msg");
    assert.ok(new RegExp("New in " + VERSION.replace(".", "\\.")).test(msg), msg); assert.ok(!/4\.0\.0|renumber|1\.1\b/.test(msg), "nothing about version numbers: " + msg); assert.ok(/Day and night/i.test(msg), "the headline"); assert.equal((await t.page.textContent("#wn-more")).trim(), "What's new");
    assert.equal(await t.page.locator("#tour").count(), 0, "no tour"); assert.equal(await t.page.locator("dialog[open]").count(), 0, "no sheet"); assert.ok(await t.page.locator("#mark").isHidden(), "no hint");
    assert.equal((await t.s()).stats.check + (await t.s()).stats.finish, 0, "no sound");
    assert.equal(await t.page.locator("#list .row").count(), 5); assert.equal((await t.s()).listId, listId);
    await t.page.click("#wn-x"); await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(1800);
    assert.ok(await t.page.locator("#whatsnew").isHidden(), "shown once");
    assert.equal((await t.s()).seenVersion, VERSION);
    await t.press("#v-all"); await wait(400); assert.equal((await t.s()).mark, "", "a device that knew the app gets no hints either");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": About shows the version as 1.2 (build N) and the changelog in its new shape, no dates", async () => {
    const t = await fresh(opts, { url: BASE + "about.html", list: false });
    await t.page.waitForFunction(() => /build/.test(document.getElementById("version").textContent), null, { timeout: 5000, polling: 100 });
    assert.equal(await t.page.textContent("#version"), "Version " + VERSION_LABEL);
    const log = await t.page.$$eval("#log .v", els => els.map(e => e.textContent));
    assert.equal(log.join(","), "1.2,1.1,1.0", "1.0 and later; the pre-releases never render");
    assert.ok(/Day and night, your way\./.test(await t.page.textContent("#log > li:first-child div")), "a headline per version");
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
    await t.page.keyboard.press("Escape");
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
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
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
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(300);
    st = await t.s(); assert.equal(st.theme, "light", "the hold survives a reload"); assert.equal(st.hold, "night");
    await t.page.emulateMedia({ colorScheme: "light" }); await wait(700);
    st = await t.s(); assert.equal(st.hold, null, "the system changed its mind: the hold is spent"); assert.equal(st.theme, "light");
    await t.page.emulateMedia({ colorScheme: "dark" }); await wait(700);
    assert.equal((await t.s()).theme, "dark", "and the automation is back in charge");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.ok(/Follows the device/.test(await t.page.textContent("#set-switch-sub")), await t.page.textContent("#set-switch-sub"));
    assert.equal(await t.page.textContent("#set-night-k"), "Dark · on"); assert.equal(await t.page.textContent("#set-day-k"), "Light");
    await t.page.keyboard.press("Escape");
    await t.press("#daynight"); await wait(700);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.ok(/Day by hand for now/.test(await t.page.textContent("#set-switch-sub")), "the row says a flip is holding: " + await t.page.textContent("#set-switch-sub"));
    await t.page.selectOption("#set-switch", "hand"); await wait(200);
    st = await t.s(); assert.equal(st.switchMode, "hand"); assert.equal(st.theme, "light", "By hand keeps what is on"); assert.equal(st.hold, null);
    await t.page.keyboard.press("Escape"); await t.page.emulateMedia({ colorScheme: "light" }); await wait(500); await t.page.emulateMedia({ colorScheme: "dark" }); await wait(500);
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
    await t.page.keyboard.press("Escape"); await wait(200);
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
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#p-settings h3", e => e.textContent), "Appearance", "⋯ → Theme opens Appearance");
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
    await t.page.keyboard.press("Escape"); await wait(300);
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
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]");
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
    assert.ok(await t.page.locator("#partner-offer").isVisible()); assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Blue · day for Day");
    const yours = await t.page.$$eval("#sw-yours .swatch .sm", els => els.map(e => e.textContent)); assert.equal(yours.join("|"), "Yours · pairs with Blue · day|Yours · pairs with Blue");
    await t.press("#partner-use"); await wait(400);
    st = await t.s(); assert.equal(st.day, day.code);
    // the partner made from the partner is the original palette again
    const round = await t.page.evaluate(async c => { const T = await import("./theme.js"); const p = T.parseCode(c); const back = T.makePartner({ ...p, pairChosen: true }); return T.cssText(back) === T.cssText(T.parseCode("T2:d:3366FF:grotesk:marble:Blue")); }, day.code);
    assert.ok(round, "round trip");
    // Make its partner again on the same theme finds the existing link instead of saving a third theme
    await t.press("#c-partner"); await wait(500);
    assert.equal(await t.page.evaluate(() => Object.values(JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc.themes).filter(x => !x.deleted).length), 2);
    await t.page.keyboard.press("Escape"); await wait(200);
    // a saved theme chosen from Yours offers its partner like a curated one
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.click('[data-set="day"]'); await t.page.waitForSelector("#p-theme[open]");
    await t.press('#sw-yours .swatch[data-code="T2:d:3366FF:grotesk:marble:Blue"]'); await wait(300);
    assert.equal((await t.page.textContent("#partner-use")).trim(), "Use Blue · day for Night");
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.consoleErrors.length, 0, t.consoleErrors.join(" | "));
    await t.close();
  });

  if (!touch) await test(label + ": T flips, Shift+T opens Appearance; ⋯ → Theme opens Appearance too", async () => {
    const t = await fresh(opts);
    const s0 = (await t.s()).slot;
    await t.page.keyboard.press("t"); await wait(600); assert.notEqual((await t.s()).slot, s0, "T flips");
    await t.page.keyboard.press("Shift+T"); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#p-settings h3", e => e.textContent), "Appearance"); assert.equal((await t.s()).slot, s0 === "day" ? "night" : "day", "Shift+T does not flip");
    await t.page.$eval("#p-settings .body", e => { e.scrollTop = e.scrollHeight; }); await t.page.keyboard.press("Escape"); await wait(200); // leave Settings scrolled to the bottom
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-settings[open]"); await wait(150);
    assert.equal(await t.page.locator("#p-theme[open]").count(), 0, "the ⋯ row goes to Appearance, not straight to the picker");
    assert.equal(await t.page.$eval("#p-settings .body", e => e.scrollTop), 0, "and Appearance is what shows: the sheet opens at its top, wherever it was left");
    assert.equal(await t.page.textContent("#menu-theme-k"), "Light", "the ⋯ row still names the theme that is on");
    await t.page.keyboard.press("Escape");
    await t.close();
  });

  await test(label + ": a 1.1 device opens 1.2 — Follow system and the schedule migrate into the switch, the theme on screen does not change, and the toast is the only new thing", async () => {
    // Follow system on, with both slots filled
    const t = await fresh(opts);
    const { listId } = await t.s();
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); const d = m.device; delete d.day; delete d.night; delete d.switch; delete d.slot; delete d.holdAuto; d.seenVersion = "1.1"; d.tourDone = true; d.hints = { today: true, drag: true, menu: true }; d.follow = true; d.darkSlot = "T1:curated:midnight"; d.lightSlot = "T1:curated:harbor"; d.theme = "T1:curated:midnight"; d.schedule = { on: false, dayAt: "07:00", nightAt: "19:00", day: "T1:curated:light", night: "T1:curated:dark" }; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); localStorage.setItem("tf/v2/themecss", "x"); });
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(1800);
    let st = await t.s();
    assert.equal(st.theme, "midnight", "a dark system: Midnight, as Follow system showed"); assert.equal(st.switchMode, "system"); assert.equal(st.day, "T1:curated:harbor"); assert.equal(st.night, "T1:curated:midnight"); assert.equal(st.hold, null);
    assert.ok(await t.page.locator("#whatsnew").isVisible(), "the toast"); assert.ok(/New in 1\.2: Day and night, your way\./.test(await t.page.textContent("#wn-msg")), "the headline only: " + await t.page.textContent("#wn-msg"));
    assert.equal(await t.page.locator("dialog[open]").count(), 0, "no sheet"); assert.ok(await t.page.locator("#mark").isHidden(), "no hint"); assert.equal(st.stats.check + st.stats.finish + st.stats.tick, 0, "no sound");
    assert.equal(await t.page.locator("#list .row").count(), 5); assert.equal(st.listId, listId, "the list is intact");
    assert.ok(await t.page.locator("#daynight").isVisible(), "the sun/moon is there");
    const old = await t.page.evaluate(() => { const d = JSON.parse(localStorage.getItem("tf/v2/meta")).device; return { follow: d.follow, darkSlot: d.darkSlot, lightSlot: d.lightSlot, scheduleOn: d.schedule.on }; });
    assert.deepEqual(old, { follow: true, darkSlot: "T1:curated:midnight", lightSlot: "T1:curated:harbor", scheduleOn: false }, "the 1.1 keys are left in place, never wiped");
    await t.page.emulateMedia({ colorScheme: "light" }); await wait(700); assert.equal((await t.s()).theme, "harbor", "and the system still drives it");
    // the schedule on, with its themes and times
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); const d = m.device; delete d.day; delete d.night; delete d.switch; delete d.slot; delete d.holdAuto; d.follow = false; d.schedule = { on: true, dayAt: "08:15", nightAt: "17:45", day: "T1:curated:paper", night: "T1:curated:forest" }; d.theme = "T1:curated:paper"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(400);
    st = await t.s(); assert.equal(st.switchMode, "schedule"); assert.equal(st.day, "T1:curated:paper"); assert.equal(st.night, "T1:curated:forest");
    const hour = new Date().getHours() + new Date().getMinutes() / 60; const expect = hour >= 8.25 && hour < 17.75 ? "paper" : "forest";
    assert.equal(st.theme, expect, "the clock decides as before");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.equal(await t.page.$eval("#set-switch", e => e.value), "schedule"); assert.equal(await t.page.$eval("#sch-day-at", e => e.value) + "/" + await t.page.$eval("#sch-night-at", e => e.value), "08:15/17:45", "the times carried over");
    await t.page.keyboard.press("Escape");
    // neither on: by hand, the theme in the slot matching its base, its partner in the other
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); const d = m.device; delete d.day; delete d.night; delete d.switch; delete d.slot; delete d.holdAuto; d.follow = false; d.schedule.on = false; d.theme = "T1:curated:pink"; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(400);
    st = await t.s(); assert.equal(st.switchMode, "hand"); assert.equal(st.theme, "pink"); assert.equal(st.night, "T1:curated:pink"); assert.equal(st.day, "T1:curated:blush", "Pink's partner fills Day"); assert.equal(st.slot, "night");
    assert.ok(await t.page.locator("#whatsnew").isHidden(), "the toast showed once");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": a fresh device on a light system paints Light from the first frame and starts With the system", async () => {
    const t = await fresh(opts, { scheme: "light", list: false });
    assert.equal(await inkOf(t.page), INK.light, "the inline tokens follow prefers-color-scheme before any module ran");
    await t.page.click("#w-new"); await t.page.waitForSelector("#p-save[open]"); await t.page.click("#save-done"); await wait(500);
    const st = await t.s(); assert.equal(st.theme, "light"); assert.equal(st.switchMode, "system"); assert.equal(st.day, "T1:curated:light"); assert.equal(st.night, "T1:curated:dark");
    assert.equal(await t.page.$eval("#daynight", e => e.dataset.next), "night");
    await t.close();
  });

  await test(label + ": no page errors, CSP violations or third-party requests across a full session", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.page.keyboard.press("Escape"); await t.press("#v-today");
    await t.press("#more"); await t.page.click('#p-menu [data-act="theme"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="night"]');
    await t.page.waitForSelector("#p-theme[open]"); await t.page.click("#sw-night .swatch:nth-child(4)"); await wait(200); await t.page.click("#partner-use"); await t.page.keyboard.press("Escape"); await wait(200);
    await t.press("#daynight"); await wait(500); await t.press("#daynight"); await wait(500);
    await t.press("#more"); await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await t.page.click("#share-tab-view"); await wait(300); await t.page.keyboard.press("Escape");
    if (!touch) { await t.press("#share"); await t.page.waitForSelector("#p-share[open]"); await t.page.keyboard.press("Escape"); await t.page.keyboard.press("?"); await t.page.waitForSelector("#p-keys[open]"); await t.page.keyboard.press("Escape"); await t.page.keyboard.press("f"); await wait(200); await t.page.keyboard.press("f"); }
    await wait(300);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, t.csp.join("; ")); assert.equal(t.thirdParty.length, 0, t.thirdParty.join("; "));
    await t.close();
  });
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length) { console.log(failures.map(f => "  - " + f).join("\n")); process.exit(1); }
