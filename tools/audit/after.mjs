// tools/audit/after.mjs — re-takes the 1.7 audit's evidence after the 1.9 round, one `-after` file per item, into audit/.
//   BASE=http://127.0.0.1:8791/ OUT=audit node tools/audit/after.mjs [item,item,…]
// Each item is a small scene in the environment the audit used (desktop 1440×900 unless the finding was a phone one);
// what could not be re-taken the same way says so in audit/after-notes.txt.
import fs from "node:fs";
import path from "node:path";
import { launch, openApp, wait, OUT, BASE } from "./harness.mjs";

const only = process.argv[2] ? new Set(process.argv[2].split(",")) : null;
const notes = [];
const note = (item, text) => { notes.push(item + ": " + text); console.log("  note", item, text); };
const write = (name, text) => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, name), text); };
const browser = await launch();
const items = {};
const item = (name, fn) => { items[name] = fn; };

/* ---------------- the proposals ---------------- */
item("skip-keeps-demo", async () => { const t = await openApp(browser, { fixture: "none" }); await t.page.click("#w-skip"); await wait(600); await t.shot("skip-keeps-demo-after"); await t.close(); });
item("save-sheet-no-exit", async () => { const t = await openApp(browser, { fixture: "none" }); await t.page.evaluate(() => document.getElementById("w-keep").click()); await t.page.waitForSelector("#p-save[open]"); await wait(400); await t.shot("save-sheet-no-exit-after"); await t.close(); });
item("timezone-rollover", async () => {
  const t = await openApp(browser, { fixture: "fresh" });
  const out = await t.page.evaluate(async () => {
    const M = await import("./model.js?v=" + document.documentElement.getAttribute("data-build"));
    const lines = [];
    // a list made in Auckland, opened in Los Angeles: a line finished at 23:30 home time is yesterday at home once home midnight passes,
    // whatever the device's own clock says; a document without a zone keeps the six-hour guard
    const doc = M.withZone(M.normalize({ id: "ZoneTest0000000000000000", items: { a: { id: "a", text: "Done late at home", today: true, done: true, doneAt: 0, order: 1 } } }, "ZoneTest0000000000000000"), "Pacific/Auckland");
    const homeLate = Date.UTC(2026, 8, 5, 11, 30); // 23:30 NZST on 5 Sep = 11:30 UTC
    doc.items.a.doneAt = homeLate;
    const afterMidnightHome = Date.UTC(2026, 8, 5, 12, 30); // 00:30 NZST on 6 Sep: an hour later
    const r = M.rollover(doc, null, afterMidnightHome);
    lines.push("zone: " + doc.zone + " · todayFor(doc) at 12:30 UTC = " + M.todayFor(doc, afterMidnightHome) + " · dayOf(doneAt) = " + M.dayOf(doc, homeLate));
    lines.push("rollover an hour after home midnight (device clock irrelevant): line reset = " + (!r.doc.items.a.done) + " (done → undone, still on Today = " + r.doc.items.a.today + ")");
    const unz = M.normalize({ id: "ZoneTest0000000000000001", items: { a: { id: "a", text: "x", today: true, done: true, doneAt: afterMidnightHome - 2 * 3600e3, order: 1 } } }, "ZoneTest0000000000000001");
    const r2 = M.rollover(unz, "2026-09-06", afterMidnightHome);
    lines.push("no zone, finished two hours ago, a new local day: guard holds = " + (r2.doc === unz || r2.doc.items.a.done));
    return lines.join("\n");
  });
  write("timezone-rollover-after.txt", out + "\n"); await t.close();
});
item("tap-to-rest", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.press("#list .row:first-child .check"); await wait(380); await t.shot("tap-to-rest-after"); note("tap-to-rest", "a frame 380 ms after the tap; the whole choreography is shots/1.9/motion-after.gif"); await t.close(); });
item("settings-lists-group", async () => { const t = await openApp(browser, { fixture: "longtime" }); await t.more("settings"); await t.page.waitForSelector("#p-settings[open]"); await wait(300); await t.shot("settings-lists-group-after"); await t.close(); });
item("move-to-sections", async () => { const t = await openApp(browser, { fixture: "longtime" }); await t.press("#v-all"); await wait(500); await t.lineMenu('#all .row:not(.done)'); await t.page.click('#p-line [data-lact="move"]'); await t.page.waitForSelector("#p-pick[open]"); await wait(300); await t.shot("move-to-sections-after"); await t.close(); });
item("builder-behind-a-row", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.more("settings"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(300); await t.page.evaluate(() => document.querySelector("#theme-more").scrollIntoView()); await wait(200); await t.shot("builder-behind-a-row-after"); await t.close(); });
item("settings-groups", async () => { const t = await openApp(browser, { env: "phone", fixture: "fresh" }); await t.more("settings"); await t.page.waitForSelector("#p-settings[open]"); await wait(400); await t.shot("settings-groups-after"); await t.close(); });
item("share-first-block", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.press("#share"); await t.page.waitForSelector("#p-share[open]"); await wait(400); await t.shot("share-first-block-after"); await t.close(); });
item("origin-toggle", async () => { const t = await openApp(browser, { fixture: "longtime" }); await t.more("lists"); await t.page.waitForSelector("#p-lists[open]"); await wait(300); await t.page.click("#lists-menu .row .more"); await t.page.waitForSelector("#p-list[open]"); await wait(300); await t.shot("origin-toggle-after"); await t.close(); });
item("count-control", async () => { const t = await openApp(browser, { env: "phone", fixture: "fresh" }); await wait(300); await t.shot("count-control-after", { clip: { x: 0, y: 0, width: 390, height: 90 } }); await t.close(); });
item("shake-ask", async () => {
  const t = await openApp(browser, { env: "phone", fixture: "fresh" });
  await t.page.evaluate(() => { window.__perm = "granted"; window.DeviceMotionEvent = window.DeviceMotionEvent || function () {}; DeviceMotionEvent.requestPermission = async () => "granted"; });
  await t.page.tap("#count"); await wait(400); await t.page.tap("#count"); await wait(400); await t.page.tap("#count"); await wait(500);
  if (await t.page.$eval("#shake-ask", e => e.hidden)) note("shake-ask", "the bar did not show under emulation (it needs iOS's DeviceMotionEvent.requestPermission); the suite covers it with the iPhone init script");
  await t.shot("shake-ask-after"); await t.close();
});
item("conflict-silent", async () => {
  const a = await openApp(browser, { fixture: "fresh" });
  await a.page.waitForFunction(() => window.__tf().status === "synced", null, { polling: 200 });
  const b = await openApp(browser, { ctx: a.ctx, hash: await a.link() }); await b.page.waitForSelector("#list .row"); await wait(800);
  const commit = async (p, text) => { await p.focus("#list .row:first-child .check"); await p.keyboard.press("e"); await p.waitForSelector("#list .row.editing textarea"); await p.$eval("#list .row.editing textarea", (ta, v) => { ta.value = v; ta.dispatchEvent(new Event("input", { bubbles: true })); }, text); await p.keyboard.press("Enter"); await wait(150); await p.keyboard.press("Escape"); await wait(200); };
  await commit(a.page, "call the credit union"); await wait(900);
  await commit(b.page, "call the bank at nine"); await wait(1200);
  await a.page.bringToFront(); await a.shot("conflict-silent-after");
  await b.close(); await a.close();
});
item("lazy-cache-first", async () => {
  const t = await openApp(browser, { fixture: "fresh", url: BASE + "?transport=local&sw=1" });
  await wait(2500); await t.page.reload(); await wait(1500);
  await t.more("settings"); await t.page.waitForSelector("#p-settings[open]"); await wait(800); // panels.js?v= fetched under the worker
  const out = await t.page.evaluate(async () => {
    const build = document.documentElement.getAttribute("data-build");
    const names = await caches.keys(); const res = { build, caches: names, entries: {}, panelsRequest: null };
    for (const n of names) { const c = await caches.open(n); res.entries[n] = (await c.keys()).map(r => r.url.replace(location.origin, "")); }
    const pe = performance.getEntriesByType("resource").filter(e => /panels\.js/.test(e.name)).map(e => ({ name: e.name.replace(location.origin, ""), transferSize: e.transferSize, deliveryType: e.deliveryType || "", duration: Math.round(e.duration) }));
    res.panelsRequest = pe; return res;
  });
  const own = Object.entries(out.entries).find(([n]) => n.includes("b" + out.build)) || [];
  out.verdict = { ownBuildCache: own[0] || null, panelsStoredOnce: (own[1] || []).filter(u => /panels\.js/.test(u)).length === 1, indexStoredOnce: (own[1] || []).filter(u => /index\.html|^\/$|\/todays-five\/?$/.test(u)).length <= 1, panelsServedFromWorker: (out.panelsRequest || []).some(e => e.transferSize === 0) };
  write("lazy-cache-first-after.json", JSON.stringify(out, null, 2) + "\n");
  write("sw-duplicates-after.json", JSON.stringify({ build: out.build, entries: out.entries, duplicateFiles: Object.values(out.entries).flat().map(u => u.replace(/\?.*$/, "")).filter((u, i, a) => a.indexOf(u) !== i) }, null, 2) + "\n");
  await t.close();
});
item("bidi", async () => {
  const t = await openApp(browser, { fixture: "fresh" });
  const out = await t.page.evaluate(async () => {
    const M = await import("./model.js?v=" + document.documentElement.getAttribute("data-build"));
    const bad = "Pay ‮gnik‬ the bill";
    const doc = M.importJSON(M.exportJSON(M.normalize({ id: "BidiTest0000000000000000", name: "L⁦ist", items: { a: { id: "a", text: bad, order: 1 } } }, "BidiTest0000000000000000"), { at: 1 }));
    return "imported line: " + JSON.stringify(doc.items.a.text) + "\nimported name: " + JSON.stringify(doc.name) + "\nstripBidi(" + JSON.stringify(bad) + ") = " + JSON.stringify(M.stripBidi(bad));
  });
  write("bidi-after.txt", out + "\n"); await t.close();
});
item("import-size", async () => {
  const t = await openApp(browser, { fixture: "fresh" });
  const out = await t.page.evaluate(async () => {
    const v = document.documentElement.getAttribute("data-build"); const S = await import("./sync.js?v=" + v); const M = await import("./model.js?v=" + v);
    const big = M.normalize({ id: "SizeTest0000000000000000", items: Object.fromEntries(Array.from({ length: 900 }, (_, i) => ["i" + i, { id: "i" + i, text: "line " + i + " " + "x".repeat(120), order: i }])) }, "SizeTest0000000000000000");
    return "ENVELOPE_CAP = " + S.ENVELOPE_CAP + " bytes\n900 lines of 125 chars: envelopeBytes = " + S.envelopeBytes("k".repeat(43), big) + " → over the cap: " + (S.envelopeBytes("k".repeat(43), big) > S.ENVELOPE_CAP);
  });
  write("import-size-after.txt", out + "\n"); await t.close();
});
item("theme-row", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.more("theme"); await t.page.waitForSelector("#p-theme[open]"); await wait(400); await t.shot("theme-row-after"); await t.close(); });
item("new-keys-heading", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.press("#share"); await t.page.waitForSelector("#p-share[open]"); await wait(300); await t.page.evaluate(() => { const h = [...document.querySelectorAll("#p-share h3")].find(h => /Replace both links/.test(h.textContent)); if (h) h.scrollIntoView(); }); await wait(200); await t.shot("new-keys-heading-after"); await t.close(); });
item("id-fragment", async () => { const t = await openApp(browser, { fixture: "longtime" }); await t.more("lists"); await t.page.waitForSelector("#p-lists[open]"); await wait(300); await t.shot("id-fragment-after"); await t.close(); });
item("caps-counter", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.page.focus("#list .row:first-child .check"); await t.page.keyboard.press("e"); await t.page.waitForSelector("#list .row.editing textarea"); await t.page.$eval("#list .row.editing textarea", el => { el.value = "Pick up the dry cleaning before they close and drop the parcel at the post office on the way back, then call".slice(0, 190).padEnd(186, "."); el.dispatchEvent(new Event("input", { bubbles: true })); }); await wait(200); await t.shot("caps-counter-after"); await t.close(); });
item("popover-anatomy", async () => {
  const t = await openApp(browser, { fixture: "longtime" });
  await t.more(); await wait(300); await t.shot("popover-anatomy-after"); await t.esc();
  await t.lineMenu("#list .row:first-child"); await wait(300); await t.shot("popover-anatomy-after-line"); await t.esc();
  await t.press("#v-all"); await wait(500); await t.page.hover('#all .sec:not([data-id=""]) .sec-h'); await t.press('#all .sec:not([data-id=""]) .sec-more'); await t.page.waitForSelector("#p-sec[open]"); await wait(300); await t.shot("popover-anatomy-after-section"); await t.close();
});
item("h2-h3", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.more("settings"); await t.page.waitForSelector("#p-settings[open]"); await wait(300); const b = await t.page.$eval("#p-settings .body", e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 220) }; }); await t.shot("h2-h3-after", { clip: b }); await t.close(); });
item("hover-treatments", async () => {
  const t = await openApp(browser, { fixture: "fresh" });
  await t.more("settings"); await t.page.waitForSelector("#p-settings[open]"); await wait(300);
  await t.page.hover("#p-settings h2 .x"); await wait(250); await t.shot("hover-treatments-after", { clip: await t.page.$eval("#p-settings .body", e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: 120 }; }) });
  await t.page.hover('#p-settings [data-set="night"]'); await wait(250); await t.shot("hover-treatments-after-row", { clip: await t.page.$eval("#p-settings .body", e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: 260 }; }) });
  await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(300); await t.page.hover("#p-theme .swatch"); await wait(300); await t.shot("hover-treatments-after-swatch", { clip: await t.page.$eval("#p-theme .swatches", e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 200) }; }) });
  await t.close();
});
item("idle-fade", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.page.mouse.move(700, 450); await wait(6000); await t.shot("idle-fade-after"); await t.close(); });
item("text-200", async () => { const t = await openApp(browser, { env: "phone", fixture: "longtime" }); await t.page.evaluate(() => { document.documentElement.style.fontSize = "200%"; }); await wait(400); await t.shot("text-200-after"); await t.close(); });
item("undo-tab-order", async () => {
  const t = await openApp(browser, { fixture: "fresh" });
  await t.press("#list .row:first-child .check"); await wait(400);
  const out = await t.page.evaluate(() => { const u = document.getElementById("toast-undo"); const k = document.getElementById("toast-undo-key"); return "Undo chip: hidden=" + u.hidden + " · aria-keyshortcuts=" + u.getAttribute("aria-keyshortcuts") + " · printed hint=" + JSON.stringify(k.textContent) + " (display " + getComputedStyle(k).display + ")"; });
  await t.page.focus("#list .row:last-child .check"); await t.page.keyboard.press("Meta+z"); await wait(400);
  const after = await t.page.evaluate(() => "after Cmd+Z with focus on the last row: done rows = " + document.querySelectorAll("#list .row.done").length + " · focus on " + (document.activeElement && document.activeElement.className));
  write("undo-tab-order-after.txt", out + "\n" + after + "\n"); await t.close();
});
item("done-on-ink3", async () => {
  const t = await openApp(browser, { fixture: "fresh" });
  const out = await t.page.evaluate(async () => {
    const T = await import("./theme.js?v=" + document.documentElement.getAttribute("data-build"));
    const rows = [];
    for (const th of T.CURATED) { const c = th.colors; rows.push({ theme: th.id, "done2/ink3": +T.contrast(c.done2, c.ink3).toFixed(3), "done/ink3 (raw, unused while lifted now)": +T.contrast(c.done, c.ink3).toFixed(3), "accentText/ink3": +T.contrast(c.accentText, c.ink3).toFixed(3), pass: T.contrast(c.done2, c.ink3) >= 4.5 && T.contrast(c.accentText, c.ink3) >= 4.5 }); }
    for (const accent of ["#3366FF", "#FF3D9A", "#1E9A4F", "#D9A066", "#8A2BFF"]) { const th = T.derive({ accent }); const c = th.colors; rows.push({ theme: "custom " + accent, "done2/ink3": +T.contrast(c.done2, c.ink3).toFixed(3), "accentText/ink3": +T.contrast(c.accentText, c.ink3).toFixed(3), pass: T.contrast(c.done2, c.ink3) >= 4.5 }); }
    return rows;
  });
  write("done-on-ink3-after.json", JSON.stringify({ note: "a dragged line and a panel read done text in --done-2 (styles.css .row.dragging, panels.css dialog.panel); Pink's accent text is #FF58A2 since 1.9", failures: out.filter(r => !r.pass).length, rows: out }, null, 2) + "\n"); await t.close();
});
item("markdown-twice", async () => {
  const t = await openApp(browser, { fixture: "longtime" });
  const out = await t.page.evaluate(async () => { const M = await import("./model.js?v=" + document.documentElement.getAttribute("data-build")); return M.exportMarkdown(window.__tfDoc ? window.__tfDoc() : JSON.parse(localStorage.getItem("tf/v3/list/" + window.__tf().listId)).doc); });
  const stars = (out.match(/ ★/g) || []).length, today = /## Today/.test(out);
  write("markdown-twice-after.txt", "Today lines marked ★ in place: " + stars + " · a separate ## Today block: " + today + "\n\n" + out); await t.close();
});
item("landscape-menu", async () => { const t = await openApp(browser, { env: "phoneLandscape", fixture: "fresh" }); await t.more(); await wait(500); await t.shot("landscape-menu-after"); await t.close(); });

/* ---------------- the appendix (1.7's fixes, still holding) ---------------- */
item("daynames", async () => { const t = await openApp(browser, { fixture: "longtime" }); await wait(400); const st = await t.s(); write("daynames-after.txt", "longtime (repeats, chosen days) opened: rows " + await t.page.locator("#list .row").count() + " · count " + await t.page.textContent("#count") + " · errors " + JSON.stringify(t.errors) + " · listname visible " + !(await t.page.$eval("#listname", e => e.hidden)) + " · status " + st.status + "\n"); await t.shot("daynames-after"); await t.close(); });
item("empty-today", async () => { const t = await openApp(browser, { fixture: "none" }); await t.page.click("#w-skip"); await wait(600); await t.shot("empty-today-after"); await t.close(); });
item("chips", async () => { const t = await openApp(browser, { fixture: "fresh" }); for (let i = 0; i < 3; i++) { await t.press("#list .row:not(.done) .check"); await wait(500); } await wait(1400); await t.shot("chips-after"); await t.close(); });
item("line-menu", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.lineMenu("#list .row:first-child"); await wait(300); write("line-menu-after.txt", await t.a11y("#p-line") + "\n"); await t.shot("line-menu-after"); await t.close(); });
item("hold-no-menu", async () => { const t = await openApp(browser, { env: "phone", fixture: "fresh" }); await t.hold("#list .row:first-child .tx"); await wait(300); write("hold-no-menu-after.txt", "a hold released in place on the phone: line menu open = " + !!(await t.page.$("#p-line[open]")) + "\n"); await t.shot("hold-no-menu-after"); await t.close(); });
item("empty-add", async () => { const t = await openApp(browser, { fixture: "fresh" }); const before = await t.page.locator("#list .row").count(); await t.page.goto(BASE + "?transport=local" + (await t.link()) + "/add?text=%20%20%0A%20"); await wait(1200); write("empty-add-after.txt", "rows before " + before + " · after a whitespace-only add-from-anywhere " + await t.page.locator("#list .row").count() + "\n"); await t.close(); });
item("swatch-delete", async () => { const t = await openApp(browser, { fixture: "longtime" }); await t.more("settings"); await t.page.click('[data-set="night"]'); await t.page.waitForSelector("#p-theme[open]"); await wait(400); await t.page.evaluate(() => { const y = document.querySelector("#sw-yours"); if (y) y.scrollIntoView(); }); await wait(200); await t.shot("swatch-delete-after"); await t.close(); });
item("theme-card", async () => { const t = await openApp(browser, { env: "phone", fixture: "fresh" }); await t.more("theme"); await t.page.waitForSelector("#p-theme[open]"); await wait(500); await t.shot("theme-card-after"); await t.close(); });
item("toast-behind-modal", async () => { const t = await openApp(browser, { env: "phone", fixture: "fresh" }); await t.more("settings"); await t.page.waitForSelector("#p-settings[open]"); await wait(300); await t.page.click('[data-set="keys"]').catch(() => {}); await t.page.click('[data-set="celebrate"]'); await wait(200); await t.page.evaluate(() => { const T = document.getElementById("toast"); }); await t.page.click('[data-set="fade"]').catch(() => {}); await wait(200); await t.shot("toast-behind-modal-after"); note("toast-behind-modal", "a toast raised under the Settings sheet (a toggle's), inside the sheet"); await t.close(); });
item("danger-confirm", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.more("delete"); await t.page.waitForSelector("#ask[open]"); await wait(300); await t.shot("danger-confirm-after"); await t.close(); });
item("focus-rings", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.more("settings"); await t.page.waitForSelector("#p-settings[open]"); await wait(300); await t.page.evaluate(() => document.getElementById("set-switch").focus({ focusVisible: true })); await wait(200); await t.shot("focus-rings-after"); await t.close(); });
item("kit-contrast", async () => { const t = await openApp(browser, { fixture: "fresh" }); const out = await t.page.evaluate(async () => { const T = await import("./theme.js?v=" + document.documentElement.getAttribute("data-build")); return T.CURATED.map(th => ({ theme: th.id, ...Object.fromEntries(Object.entries(T.report(th)).map(([k, v]) => [k, typeof v === "number" ? +v.toFixed(2) : v])) })); }); write("kit-contrast-after.json", JSON.stringify(out, null, 2) + "\n"); await t.close(); });
item("share-warning", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.press("#share"); await t.page.waitForSelector("#p-share[open]"); await wait(300); await t.page.evaluate(() => { const h = [...document.querySelectorAll("#p-share h3")].find(h => /Let someone edit/.test(h.textContent)); if (h) h.scrollIntoView(); }); await wait(200); await t.shot("share-warning-after"); await t.close(); });
item("streak-chip", async () => { const t = await openApp(browser, { fixture: "longtime" }); for (let i = 0; i < 6; i++) { const c = await t.page.$("#list .row:not(.done) .check"); if (!c) break; await c.click(); await wait(400); } await wait(1500); await t.shot("streak-chip-after"); await t.close(); });
item("first-sound", async () => { const t = await openApp(browser, { fixture: "fresh" }); await t.press("#list .row:first-child .check"); await wait(900); const st = await t.s(); write("first-sound-after.txt", "the first check-off on a cold page: audio " + JSON.stringify(st.audio) + "\n"); await t.close(); });
item("hover-after-sink", async () => { const t = await openApp(browser, { fixture: "fresh" }); const box = await t.page.$eval("#list .row:first-child .check", e => e.getBoundingClientRect()); await t.page.mouse.click(box.x + 10, box.y + box.height / 2); await wait(900); const hovered = await t.page.evaluate(() => [...document.querySelectorAll("#list .row")].map(r => r.matches(":hover") && getComputedStyle(r).backgroundColor !== "rgba(0, 0, 0, 0)")); write("hover-after-sink-after.txt", "a still cursor after the sink: rows painted as hovered = " + JSON.stringify(hovered) + " (no-hover class on the row that slid under it: " + await t.page.evaluate(() => !!document.querySelector("#list .row.no-hover")) + ")\n"); await t.shot("hover-after-sink-after"); await t.close(); });
item("flare-reduced-motion", async () => { const t = await openApp(browser, { fixture: "fresh", reducedMotion: "reduce" }); for (let i = 0; i < 3; i++) { await t.press("#list .row:not(.done) .check"); await wait(400); } await wait(500); await t.shot("flare-reduced-motion-after"); await t.close(); });
item("whose-dead-end", async () => { const a = await openApp(browser, { fixture: "fresh" }); const link = await a.link(); const b = await openApp(browser, { hash: link }); await wait(800); const open = !!(await b.page.$("#whose[open]")); if (open) { await b.page.mouse.click(5, 5); await wait(400); } write("whose-dead-end-after.txt", "a list link on a second device asks whose it is: " + open + " · still asking after a click outside: " + !!(await b.page.$("#whose[open]")) + "\n"); await b.shot("whose-dead-end-after"); await b.close(); await a.close(); });
item("cache-secret-key", async () => { const t = await openApp(browser, { fixture: "fresh" }); const link = await t.link(); const out = await t.page.evaluate(async () => { const names = await caches.keys(); const urls = []; for (const n of names) { const c = await caches.open(n); for (const r of await c.keys()) urls.push(r.url); } return { caches: names, urlsWithFragment: urls.filter(u => /#\/l\//.test(u)), title: document.title, referrerPolicy: document.querySelector('meta[name="referrer"]')?.content || "" }; }); write("cache-secret-key-after.json", JSON.stringify({ link: link.replace(/#\/l\/(.{4}).*/, "#/l/$1…"), ...out }, null, 2) + "\n"); await t.close(); });

const names = Object.keys(items).filter(n => !only || only.has(n));
for (const n of names) { process.stdout.write(n + " … "); try { await items[n](); console.log("ok"); } catch (e) { console.log("FAILED: " + e.message.split("\n")[0]); note(n, "could not be re-taken: " + e.message.split("\n")[0]); } }
write("after-notes.txt", "# evidence re-taken after 1.9 (tools/audit/after.mjs)\n" + notes.join("\n") + "\n");
await browser.close();
