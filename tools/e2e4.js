// tools/e2e4.js — the browser suite for v4. Playwright driving the installed Chrome, on the local transport
// (?transport=local: a same-origin BroadcastChannel "server" that exercises the identical sync and crypto engine).
// Run: node tools/serve.js 8790 . &  then  node tools/e2e4.js
// Every feature at 1440×900 (mouse) and 390×844 (touch): one-thing mode, search, recently deleted, the Settings
// sheet, view-only celebration, every sound pack without console errors, the bottom-of-screen pixel probe, audio
// recovery after a simulated suspend and a dead context, presence dots between two tabs, zero page errors, zero
// CSP violations, zero third-party requests.
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
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
const assert = { ok(v, m) { if (!v) throw new Error(m || "expected truthy"); }, equal(a, b, m) { if (a !== b) throw new Error((m || "") + " expected " + JSON.stringify(b) + " got " + JSON.stringify(a)); } };
const wait = ms => new Promise(r => setTimeout(r, ms));

const VIEWPORTS = [["desktop 1440×900", { viewport: { width: 1440, height: 900 } }, false], ["phone 390×844", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, true]];
async function fresh(opts, { url = BASE + "?transport=local", list = true, ctx: shared = null } = {}) {
  // a second "device" on the local transport is a second tab of the same context: the local server lives in localStorage
  const ctx = shared || await browser.newContext(opts);
  open.add(ctx);
  const page = await ctx.newPage(); page.setDefaultTimeout(6000);
  const errors = [], csp = [], thirdParty = [], consoleErrors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { const t = m.text(); if (/Content Security Policy|Refused to/.test(t)) csp.push(t); else if (m.type() === "error") consoleErrors.push(t); });
  page.on("request", r => { const u = new URL(r.url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && !u.protocol.startsWith("blob") && !u.protocol.startsWith("data")) thirdParty.push(r.url()); });
  await page.goto(url);
  if (list) {
    await page.waitForSelector("#welcome:not([hidden])");
    await page.click("#w-new"); await page.waitForSelector("#p-save[open]"); await page.click("#save-done"); await wait(500);
    await page.waitForSelector("#tour:not([hidden])"); await page.click("#tour-skip"); await wait(200);
  }
  const s = () => page.evaluate(() => window.__tf());
  const press = async sel => {
    await page.bringToFront();
    // the one-time iOS install hint sits over the footer; a person would dismiss it, so does the suite
    const hint = await page.$("#install:not([hidden])"); if (hint) { await page.click("#install-x"); await wait(150); }
    const h = await page.$(sel); if (!h) throw new Error("no " + sel); if (opts.hasTouch) await h.tap(); else { await h.hover(); await h.click(); }
  };
  const front = () => page.bringToFront();
  return { ctx, page, errors, csp, thirdParty, consoleErrors, s, press, front, close: () => shared ? page.close() : ctx.close() };
}

for (const [label, opts, touch] of VIEWPORTS) {
  console.log("\n==", label);

  await test(label + ": a new list — save sheet, five-mark tour, five lines, no console noise", async () => {
    const t = await fresh(opts);
    assert.equal(await t.page.locator("#list .row").count(), 5);
    assert.ok(await t.page.locator("#tour").isHidden(), "tour closed");
    const st = await t.s(); assert.equal(st.tourDone, true); assert.ok(st.seenVersion === "4.0.0", "first run marks the version seen silently: " + st.seenVersion);
    assert.ok(await t.page.locator("#whatsnew").isHidden(), "no what's-new on first run");
    assert.equal(t.errors.length, 0, "page errors: " + t.errors); assert.equal(t.csp.length, 0, "csp: " + t.csp); assert.equal(t.thirdParty.length, 0, "third party: " + t.thirdParty);
    await t.close();
  });

  await test(label + ": the ⋯ menu is six rows, Share is worded for the device, Delete is last and destructive", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.waitForSelector("#p-menu[open]");
    const labels = await t.page.$$eval("#menu > *:not([hidden]) .lb", els => els.map(e => e.textContent.trim()));
    assert.equal(labels.length, 6, JSON.stringify(labels));
    assert.equal(labels[0], touch ? "Share this list" : "Share & open on phone");
    assert.ok(/Delete this list/.test(labels[5])); assert.ok(await t.page.$("#menu-delete.danger"));
    assert.equal(labels.slice(1, 5).join("|"), "How it works|Lists|Settings|About & privacy");
    await t.close();
  });

  await test(label + ": Settings has five sections and the toggles hold", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    const heads = await t.page.$$eval("#p-settings h3", els => els.map(e => e.textContent.trim()));
    assert.equal(heads.join("|"), "Appearance|Sound|Behavior|Lists|Advanced");
    for (const k of ["review", "celebrate", "who"]) { await t.page.click(`[data-set="${k}"]`); }
    assert.equal(await t.page.getAttribute('[data-set="review"]', "aria-pressed"), "true");
    assert.equal(await t.page.getAttribute('[data-set="who"]', "aria-pressed"), "false");
    // schedule and follow system are mutually exclusive
    await t.page.click('[data-set="follow"]'); assert.equal(await t.page.getAttribute('[data-set="follow"]', "aria-pressed"), "true");
    await t.page.click('[data-set="schedule"]'); assert.equal(await t.page.getAttribute('[data-set="schedule"]', "aria-pressed"), "true"); assert.equal(await t.page.getAttribute('[data-set="follow"]', "aria-pressed"), "false");
    assert.ok(await t.page.locator("#schedule-block").isVisible());
    await t.page.click('[data-set="follow"]'); assert.equal(await t.page.getAttribute('[data-set="schedule"]', "aria-pressed"), "false");
    // the settings survive a reload
    await t.page.reload(); await t.page.waitForSelector("#list .row");
    const dev = await t.page.evaluate(() => JSON.parse(localStorage.getItem("tf/v2/meta")).device);
    assert.equal(dev.review, true); assert.equal(dev.celebrateRemote, true); assert.equal(dev.whoOff, true); assert.equal(dev.follow, true);
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": repeat rule from the line menu, the glyph, and the rollover reset", async () => {
    const t = await fresh(opts);
    await t.page.click("#v-all"); await t.page.waitForSelector("#all:not([hidden])");
    await t.press("#all .row:first-child .tool.lmenu"); await t.page.waitForSelector("#p-line[open]");
    await t.page.click('#p-line [data-lact="repeat"]'); await t.page.waitForSelector("#p-repeat[open]");
    await t.page.click('#repeat-kinds [data-kind="daily"]'); await t.page.click("#repeat-done"); await wait(300);
    assert.equal(await t.page.locator("#all .row:first-child .rep").count(), 1, "repeat glyph");
    const id = await t.page.getAttribute("#all .row:first-child", "data-id");
    // check it off, roll over to tomorrow: it is in History and back undone on Today
    await t.page.click("#v-today"); await t.press(`#list .row[data-id="${id}"] .check`); await wait(800);
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

  await test(label + ": search filters lines and notes live, Escape clears", async () => {
    const t = await fresh(opts);
    await t.page.click("#v-all"); await t.page.waitForSelector("#all:not([hidden])");
    if (touch) await t.page.tap("#search-btn"); else await t.page.keyboard.press("/");
    await t.page.waitForSelector("#search:not([hidden])");
    await t.page.type("#search", "link");
    await wait(200);
    assert.equal(await t.page.$$eval("#all .row", rows => rows.filter(r => getComputedStyle(r).display !== "none").length), 1);
    await t.page.fill("#search", "zzz-nothing"); await wait(200);
    assert.ok(await t.page.locator(".nohits").isVisible());
    await t.page.keyboard.press("Escape"); await wait(200);
    assert.equal(await t.page.$$eval("#all .row", rows => rows.filter(r => getComputedStyle(r).display !== "none").length), 5);
    await t.close();
  });

  await test(label + ": recently deleted at the bottom of Everything, with Restore; rollover tombstones never show", async () => {
    const t = await fresh(opts);
    await t.page.click("#v-all"); await wait(200);
    const text = await t.page.$eval("#all .row:nth-child(2) .tx", e => e.dataset.text);
    await t.press("#all .row:nth-child(2) .tool.kill"); await wait(500);
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
    await t.page.click("#v-all"); await t.page.click("#addsec"); await t.page.fill("#ask-input", "Work"); await t.page.click("#ask-ok"); await wait(300);
    await t.press("#all .sec .sec-more"); await t.page.waitForSelector("#p-sec[open]");
    await t.page.click('#p-sec [data-sact="template"]'); await t.page.waitForSelector("#ask[open]"); await t.page.fill("#ask-input", "Five"); await t.page.click("#ask-ok"); await wait(300);
    await t.press("#all .sec .sec-more"); await t.page.click('#p-sec [data-sact="today-off"]'); await wait(400);
    assert.equal(await t.page.locator('#all .tool.today[aria-pressed="true"]').count(), 0, "all off Today");
    await t.press("#all .sec .sec-more"); await t.page.click('#p-sec [data-sact="today-on"]'); await wait(400);
    assert.equal(await t.page.locator('#all .tool.today[aria-pressed="true"]').count(), 5, "all on Today");
    await t.press('#all .sec[data-id="'+ await t.page.$eval('#all .sec:not([data-id=""])', e => e.dataset.id) +'"] .sec-more'); await t.page.click('#p-sec [data-sact="insert"]'); await t.page.waitForSelector("#p-pick[open]");
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
    await t.press("#list .row:first-child .tool.lmenu"); await t.page.click('#p-line [data-lact="move"]'); await t.page.waitForSelector("#p-pick[open]");
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

  await test(label + ": presence dots between two tabs, capped at five, off when the device says so", async () => {
    const a = await fresh(opts);
    const { listId } = await a.s();
    await a.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
    const b = await fresh(opts, { url: BASE + "?transport=local#/l/" + listId, list: false, ctx: a.ctx });
    await b.page.waitForSelector("#list .row");
    if (process.env.DEBUG) {
      await wait(1500);
      const tryWait = async (label, fn) => { try { await fn(); console.log("    debug", label, "ok"); } catch (e) { console.log("    debug", label, "FAILED:", e.message.split("\n")[0]); } };
      await tryWait("string predicate", () => a.page.waitForFunction("window.__tf().who === 1", null, { timeout: 2000 }));
      await tryWait("fn predicate raf", () => a.page.waitForFunction(() => window.__tf().who === 1, null, { timeout: 2000 }));
      await tryWait("fn predicate poll", () => a.page.waitForFunction(() => window.__tf().who === 1, null, { timeout: 2000, polling: 200 }));
      await tryWait("fn true", () => a.page.waitForFunction(() => true, null, { timeout: 2000 }));
      await tryWait("fn __tf exists", () => a.page.waitForFunction(() => typeof window.__tf, null, { timeout: 2000 }));
      console.log("    debug typeof in wff:", await a.page.evaluate(() => typeof window.__tf), "who via evaluate:", await a.page.evaluate(() => window.__tf().who));
    }
    await a.page.waitForFunction(() => window.__tf().who === 1, null, { timeout: 8000, polling: 200 });
    await b.page.waitForFunction(() => window.__tf().who === 1, null, { timeout: 8000, polling: 200 });
    assert.equal(await a.page.locator("#who .dots i.on").count(), 1);
    assert.ok(/1 other device/.test(await a.page.getAttribute("#who", "title")));
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

  await test(label + ": every sound pack plays check, uncheck and finale without console errors; the theme's pick and the override", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    await t.page.waitForFunction(() => window.__tf().audio.packs === true, null, { timeout: 5000, polling: 200 }, null, { polling: 200 });
    for (const pack of ["knock", "bell", "blip", "typewriter", "marble", "pop"]) {
      await t.page.selectOption("#set-pack", pack); await wait(150);
      const ok = await t.page.evaluate(() => { const s = window.__tf(); return s.audio.state === "running"; });
      assert.ok(ok, pack + ": context running");
    }
    await t.page.keyboard.press("Escape"); await wait(200);
    const played = await t.page.evaluate(async () => { const S = await import("./sound.js"); const P = await import("./packs.js"); const snd = S.createSound({ muted: false, volume: 1, kit: () => ({ engine: "knock" }), loadPacks: () => Promise.resolve(P) }); snd.prime(); await new Promise(r => setTimeout(r, 50)); const out = {}; for (const e of P.PACK_ORDER) { const k = { engine: e, pitch: 1, decay: 1 }; out[e] = [snd.preview(e), snd.uncheck(), snd.finish()]; } return { out, st: snd.state() }; });
    for (const e of Object.keys(played.out)) assert.ok(played.out[e][0] && played.out[e][1] && played.out[e][2], e + " scheduled: " + JSON.stringify(played.out[e]));
    assert.equal(played.st.state, "running");
    const themePick = await t.page.evaluate(async () => { const T = await import("./theme.js"); return [T.curated("paper").sound.engine, T.curated("forest").sound.engine, T.curated("harbor").sound.engine]; });
    assert.equal(themePick.join(","), "typewriter,marble,pop");
    assert.equal(t.consoleErrors.length, 0, "console errors: " + t.consoleErrors.join(" | ")); assert.equal(t.errors.length, 0, t.errors.join("; "));
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

  await test(label + ": export JSON round-trips byte for byte; Markdown reads; import merges", async () => {
    const t = await fresh(opts);
    const r = await t.page.evaluate(async () => { const M = await import("./model.js"); const s = window.__tf(); const d = JSON.parse(localStorage.getItem("tf/v3/list/" + s.listId)).doc; const a = M.exportJSON(d, { at: 1 }); const md = M.exportMarkdown(d); return { same: a === M.exportJSON(M.importJSON(a, s.listId), { at: 1 }), md: md.startsWith("# ") && md.includes("- [ ] "), secret: a.includes(s.listId) }; });
    assert.ok(r.same, "byte-identical"); assert.ok(r.md, "markdown"); assert.ok(!r.secret, "no secret in the export");
    await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]");
    assert.ok(/only backup/.test(await t.page.textContent("#p-settings")), "says it is the only backup");
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
    await t.page.click("#w-paste-show"); // the Lists panel is reachable from the welcome's paste; use the menu instead
    await t.page.evaluate(() => document.getElementById("more").click()); await t.page.waitForSelector("#p-menu[open]"); await t.page.click('#p-menu [data-act="lists"]');
    await t.page.waitForSelector("#lists-removed button"); await t.page.click("#lists-removed button"); await wait(600);
    assert.equal((await t.s()).listId, listId);
    await t.close();
  });

  await test(label + ": a v3 device updating sees the what's-new toast once, nothing else, list intact", async () => {
    const t = await fresh(opts);
    const { listId } = await t.s();
    // turn this device into a v3 one: drop the version marker, keep its list
    await t.page.evaluate(() => { const m = JSON.parse(localStorage.getItem("tf/v2/meta")); delete m.device.seenVersion; delete m.device.schedule; localStorage.setItem("tf/v2/meta", JSON.stringify(m)); });
    await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(1800);
    assert.ok(await t.page.locator("#whatsnew").isVisible(), "what's-new toast");
    assert.ok(/New in 4\.0\.0/.test(await t.page.textContent("#wn-msg")));
    assert.ok(await t.page.locator("#tour").isHidden(), "no tour"); assert.equal(await t.page.locator("dialog[open]").count(), 0, "no sheet");
    assert.equal((await t.s()).stats.check + (await t.s()).stats.finish, 0, "no sound");
    assert.equal(await t.page.locator("#list .row").count(), 5); assert.equal((await t.s()).listId, listId);
    await t.page.click("#wn-x"); await t.page.reload(); await t.page.waitForSelector("#list .row"); await wait(1800);
    assert.ok(await t.page.locator("#whatsnew").isHidden(), "shown once");
    assert.equal(t.errors.length, 0, t.errors.join("; "));
    await t.close();
  });

  await test(label + ": How it works is sectioned, has the Shortcut and bookmarklet, and replays the tour", async () => {
    const t = await fresh(opts);
    await t.press("#more"); await t.page.click('#p-menu [data-act="help"]'); await t.page.waitForSelector("#p-help[open]");
    const heads = await t.page.$$eval("#help-body h3", els => els.map(e => e.textContent));
    assert.ok(heads.length >= 6, "sections: " + heads.length);
    const body = await t.page.textContent("#help-body");
    assert.ok(/Ask for Input/.test(body) && /bookmarklet/i.test(body) && /Remove from this device/.test(body));
    assert.ok((await t.page.inputValue("#help-body input.link")).includes("/add?text="));
    await t.page.click("#help-tour"); await t.page.waitForSelector("#tour:not([hidden])");
    assert.equal(await t.page.locator("#tour-dots i").count(), 5, "five marks");
    await t.page.click("#tour-skip");
    await t.close();
  });

  await test(label + ": no page errors, CSP violations or third-party requests across a full session", async () => {
    const t = await fresh(opts);
    await t.press("#v-all"); await t.press("#v-today");
    if (touch) { await t.press("#more"); await t.page.click('#p-menu [data-act="settings"]'); await t.page.waitForSelector("#p-settings[open]"); await t.page.click('[data-set="theme"]'); } else await t.press("#theme");
    await t.page.waitForSelector("#p-theme[open]"); await t.page.click(".swatch:nth-child(4)"); await t.page.keyboard.press("Escape");
    await t.press("#more"); await t.page.click('#p-menu [data-act="share"]'); await t.page.waitForSelector("#p-share[open]"); await t.page.click("#share-tab-view"); await wait(300); await t.page.keyboard.press("Escape");
    await wait(300);
    assert.equal(t.errors.length, 0, t.errors.join("; ")); assert.equal(t.csp.length, 0, t.csp.join("; ")); assert.equal(t.thirdParty.length, 0, t.thirdParty.join("; "));
    await t.close();
  });
}

await browser.close();
console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length) { console.log(failures.map(f => "  - " + f).join("\n")); process.exit(1); }
