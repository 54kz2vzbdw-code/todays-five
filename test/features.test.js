// Node tests for the v4 model features. Run: node test/features.test.js
import assert from "node:assert/strict";
import fs from "node:fs";
import * as M from "../model.js";
import { VERSION, BUILD, VERSION_LABEL } from "../version.js";

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok -", name); }
const records = d => M.canon({ ...d, updatedAt: 0 });
const item = (id, over = {}) => ({ id, sectionId: "", text: "t-" + id, note: "", done: false, doneAt: 0, today: true, order: 1000, todayOrder: 1000, updatedAt: 1000, ...over });
const at = s => new Date(s).getTime();
let seed = 777; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

test("normalize keeps unknown keys on the document, on records and on tombstones; merge keeps unknown collections", () => {
  const d = M.normalize({ items: { a: { ...item("a"), extra: [1, 2] }, t: { id: "t", deleted: true, updatedAt: 3, why: "later" } }, sections: { s: { id: "s", name: "S", order: 1, collapsed: false, updatedAt: 1, colour: "red" } }, rules: { a: { id: "a", kind: "daily", updatedAt: 1, every: 2 } }, mystery: { k: { id: "k", updatedAt: 9 } }, flag: true }, "L");
  assert.deepEqual(d.items.a.extra, [1, 2]); assert.equal(d.items.t.why, "later"); assert.equal(d.sections.s.colour, "red"); assert.equal(d.rules.a.every, 2);
  assert.deepEqual(d.mystery, { k: { id: "k", updatedAt: 9 } }); assert.equal(d.flag, true);
  const m = M.merge(d, M.emptyDoc("L"));
  assert.deepEqual(m.items.a.extra, [1, 2]); assert.deepEqual(m.mystery, d.mystery); assert.equal(m.flag, true);
  assert.equal(M.canon(M.normalize(d)), M.canon(d), "normalize is idempotent with unknown keys");
});

test("tie-break: a tombstone, then the record that carries more, then the lexically larger; still a total order (fuzz)", () => {
  const a = M.emptyDoc("L"), b = M.emptyDoc("L");
  a.items.x = { ...item("x"), repeat: "daily" }; b.items.x = item("x");
  assert.equal(M.merge(a, b).items.x.repeat, "daily"); assert.equal(M.merge(b, a).items.x.repeat, "daily");
  b.items.x = { id: "x", deleted: true, updatedAt: 1000 };
  assert.equal(M.merge(a, b).items.x.deleted, true);
  for (let i = 0; i < 200; i++) {
    const mk = () => { const d = M.emptyDoc("L"); for (const id of ["p", "q"]) if (rnd() < 0.8) d.items[id] = rnd() < 0.2 ? { id, deleted: true, updatedAt: 1 } : { ...item(id, { updatedAt: 1, text: ["a", "b"][rnd() < 0.5 ? 0 : 1] }), ...(rnd() < 0.5 ? { extra: Math.floor(rnd() * 3) } : {}) }; return d; };
    const x = mk(), y = mk(), z = mk();
    assert.equal(M.canon(M.merge(x, y)), M.canon(M.merge(y, x)));
    assert.equal(M.canon(M.merge(M.merge(x, y), z)), M.canon(M.merge(x, M.merge(y, z))));
  }
});

test("isDue: daily, weekdays, chosen days, monthly (clamped to short months)", () => {
  assert.ok(M.isDue({ kind: "daily" }, "2026-09-06"));
  assert.ok(M.isDue({ kind: "weekdays" }, "2026-09-04"), "Friday"); assert.ok(!M.isDue({ kind: "weekdays" }, "2026-09-05"), "Saturday");
  assert.ok(M.isDue({ kind: "weekly", days: [1, 3] }, "2026-09-07"), "Monday"); assert.ok(!M.isDue({ kind: "weekly", days: [1, 3] }, "2026-09-08"));
  assert.ok(M.isDue({ kind: "monthly", day: 15 }, "2026-09-15")); assert.ok(!M.isDue({ kind: "monthly", day: 15 }, "2026-09-16"));
  assert.ok(M.isDue({ kind: "monthly", day: 31 }, "2026-02-28"), "31st clamps to the 28th"); assert.ok(!M.isDue({ kind: "monthly", day: 31 }, "2026-02-27"));
  assert.ok(M.isDue({ kind: "monthly", day: 31 }, "2028-02-29"), "leap year");
  assert.equal(M.addDays("2026-12-31", 1), "2027-01-01"); assert.equal(M.addDays("2026-03-01", -1), "2026-02-28"); assert.equal(M.weekdayOf("2026-09-06"), 0);
});

test("setRule stores a snapshot; a rule on a line already on Today is marked placed today; clearing tombstones it", () => {
  let d = M.emptyDoc("L"); d.items.a = item("a", { text: "Standup", note: "9", sectionId: "s" });
  d = M.setRule(d, "a", { kind: "weekly", days: [3, 1, 1, 9] }, 50, "2026-09-01");
  assert.deepEqual(d.rules.a, { id: "a", kind: "weekly", days: [1, 3], text: "Standup", note: "9", sectionId: "s", placed: "2026-09-01", updatedAt: 50 });
  d.items.a.text = "Standup (short)"; d = M.refreshRuleSnapshot(d, "a", 60); assert.equal(d.rules.a.text, "Standup (short)"); assert.equal(d.rules.a.updatedAt, 60);
  d = M.setRule(d, "a", null, 70); assert.equal(d.rules.a.deleted, true); assert.equal(M.ruleOf(d, "a"), null);
  d = M.setRule(d, "a", { kind: "monthly", day: 40 }, 80, "2026-09-01"); assert.equal(d.rules.a.day, 31);
  assert.equal(M.setRule(d, "nope", { kind: "daily" }), d, "no such line: unchanged");
});

test("rollover: a done daily line goes to History and resets undone on Today (+2); idempotent; two devices converge", () => {
  const y = at("2026-09-01T15:00:00");
  let d = M.emptyDoc("L"); d.items.a = item("a", { text: "Stretch", done: true, doneAt: y, updatedAt: y }); d = M.setRule(d, "a", { kind: "daily" }, 100, "2026-09-01");
  const r1 = M.rollover(d, "2026-09-02", 7e12);
  assert.equal(r1.moved.length, 1); assert.equal(r1.doc.history["2026-09-01"][0].text, "Stretch");
  const a = r1.doc.items.a; assert.equal(a.done, false); assert.equal(a.doneAt, 0); assert.equal(a.today, true); assert.equal(a.updatedAt, y + 2); assert.equal(a.text, "Stretch");
  assert.equal(r1.doc.rules.a.placed, "2026-09-02");
  const r2 = M.rollover(r1.doc, "2026-09-02", 7e12 + 1); assert.equal(r2.doc, r1.doc); assert.equal(r2.moved.length, 0);
  const other = M.rollover(d, "2026-09-02", 7e12 + 999).doc;
  assert.equal(records(M.merge(r1.doc, other)), records(r1.doc), "identical records from two devices");
  // done again today, rolled tomorrow: another History day, reset again
  const d2 = M.normalize(r1.doc); d2.items.a = { ...d2.items.a, done: true, doneAt: at("2026-09-02T10:00:00"), updatedAt: at("2026-09-02T10:00:00") };
  const r3 = M.rollover(d2, "2026-09-03", 7e12).doc;
  assert.equal(r3.history["2026-09-02"][0].id, "a"); assert.equal(r3.items.a.done, false); assert.equal(Object.keys(r3.history).length, 2);
});

test("rollover: a weekly line done on its day leaves Today until its next day, then comes back once; taking it off Today sticks", () => {
  const mon = at("2026-09-07T10:00:00"); // Monday
  let d = M.emptyDoc("L"); d.items.a = item("a", { done: true, doneAt: mon, updatedAt: mon }); d = M.setRule(d, "a", { kind: "weekly", days: [1, 4] }, 100, "2026-09-07");
  const tue = M.rollover(d, "2026-09-08", 1).doc;
  assert.equal(tue.items.a.done, false); assert.equal(tue.items.a.today, false, "not due on Tuesday: off Today, in Everything");
  assert.equal(M.rollover(tue, "2026-09-09", 2).doc, tue, "Wednesday: nothing");
  const thu = M.rollover(tue, "2026-09-10", 3).doc;
  assert.equal(thu.items.a.today, true, "Thursday: back on Today"); assert.equal(thu.items.a.updatedAt, tue.items.a.updatedAt + 1); assert.equal(thu.rules.a.placed, "2026-09-10");
  assert.equal(M.rollover(thu, "2026-09-10", 4).doc, thu, "same day again: nothing");
  // the user takes it off Today that day: the minute tick must not put it back
  const off = M.normalize(thu); off.items.a = { ...off.items.a, today: false, updatedAt: at("2026-09-10T11:00:00") };
  assert.equal(M.rollover(off, "2026-09-10", 5).doc, off);
  assert.equal(M.rollover(off, "2026-09-11", 6).doc, off, "Friday: not due");
  assert.equal(M.rollover(off, "2026-09-14", 7).doc.items.a.today, true, "next Monday: back");
});

test("rollover: an unfinished recurring line just stays; a plain done line still tombstones (+1) as in v3", () => {
  const y = at("2026-09-01T15:00:00");
  let d = M.emptyDoc("L"); d.items.a = item("a", { done: false }); d.items.b = item("b", { done: true, doneAt: y, updatedAt: y }); d = M.setRule(d, "a", { kind: "daily" }, 1, "2026-09-01");
  const r = M.rollover(d, "2026-09-02", 5).doc;
  assert.equal(r.items.a, d.items.a); assert.deepEqual(r.items.b, { id: "b", deleted: true, updatedAt: y + 1 });
  assert.equal(M.recentlyDeleted(r).length, 0, "rollover tombstones never show as deleted");
});

test("not today: off Today now, back at tomorrow's rollover, undo puts it straight back", () => {
  let d = M.emptyDoc("L"); d.items.a = item("a", { todayOrder: 3000 });
  d = M.notToday(d, "a", "2026-09-01", 500);
  assert.equal(d.items.a.today, false); assert.deepEqual(d.returns.a, { id: "a", on: "2026-09-02", updatedAt: 500 }); assert.ok(M.returnOf(d, "a"));
  assert.equal(M.rollover(d, "2026-09-01", 600).doc, d, "today: stays off");
  const back = M.rollover(d, "2026-09-02", 700).doc;
  assert.equal(back.items.a.today, true); assert.equal(back.items.a.todayOrder, 3000, "keeps its place"); assert.equal(back.items.a.updatedAt, 501); assert.equal(back.returns.a.deleted, true);
  assert.equal(M.rollover(back, "2026-09-02", 800).doc, back, "idempotent");
  assert.equal(records(M.rollover(d, "2026-09-03", 900).doc), records(M.rollover(back, "2026-09-03", 900).doc), "a device that slept through a day agrees");
  const undone = M.backToday(d, "a", 550); assert.equal(undone.items.a.today, true); assert.equal(undone.returns.a.deleted, true);
  // done in the meantime: the return retires without touching the line
  const done = M.normalize(d); done.items.a = { ...done.items.a, done: true, doneAt: at("2026-09-02T09:00:00"), updatedAt: at("2026-09-02T09:00:00") };
  const r = M.rollover(done, "2026-09-02", 1000).doc; assert.equal(r.items.a.today, false); assert.equal(r.items.a.done, true); assert.equal(r.returns.a.deleted, true);
  // a recurring line that is not-today'd is not re-placed by its rule that day
  let e = M.emptyDoc("L"); e.items.a = item("a"); e = M.setRule(e, "a", { kind: "daily" }, 1, "2026-09-01"); e = M.notToday(e, "a", "2026-09-01", 2);
  assert.equal(M.rollover(e, "2026-09-01", 3).doc, e);
});

test("recently deleted: tombstones with text, newest first; restore brings the line back into its section", () => {
  let d = M.emptyDoc("L"); d.sections.s = { id: "s", name: "S", order: 1, collapsed: false, updatedAt: 1 };
  d.items.a = item("a", { text: "Alpha", sectionId: "s", note: "n" }); d.items.b = item("b", { text: "Beta" }); d.items.c = item("c");
  d.items.a = M.tombstone(d.items.a, 5000); d.items.b = M.tombstone(d.items.b, 6000); d.items.c = { id: "c", deleted: true, updatedAt: 7000 };
  assert.deepEqual(M.recentlyDeleted(d).map(t => t.id), ["b", "a"]);
  assert.deepEqual(d.items.a, { id: "a", deleted: true, text: "Alpha", note: "n", sectionId: "s", updatedAt: 5000 });
  const r = M.restoreItem(d, "a", 8000);
  assert.equal(r.items.a.text, "Alpha"); assert.equal(r.items.a.sectionId, "s"); assert.equal(r.items.a.done, false); assert.equal(r.items.a.today, false); assert.equal(r.items.a.updatedAt, 8000);
  assert.equal(M.recentlyDeleted(r).length, 1);
  d.sections.s = { id: "s", deleted: true, updatedAt: 9 };
  assert.equal(M.restoreItem(d, "a", 8000).items.a.sectionId, "", "a deleted section falls back to Unsorted");
  assert.equal(M.restoreItem(d, "c", 8000).items.c.text, "", "a bare tombstone restores empty (never offered in the UI)");
  const purged = M.purgeTombstones(r, 8000 + M.TOMBSTONE_TTL + 1);
  assert.ok(!purged.items.b && !purged.items.c && purged.items.a);
});

test("templates: saved from a section without state, inserted anywhere, deleted", () => {
  let d = M.emptyDoc("L"); d.sections.s = { id: "s", name: "Morning", order: 1, collapsed: false, updatedAt: 1 };
  d.items.a = item("a", { sectionId: "s", text: "Coffee", done: true, doneAt: 5, order: 2000 }); d.items.b = item("b", { sectionId: "s", text: "Mail", note: "inbox", order: 1000 }); d.items.c = item("c", { text: "Elsewhere" });
  d = M.templateFromSection(d, "s", "  Morning  ", "tp", 100);
  assert.deepEqual(d.templates.tp, { id: "tp", name: "Morning", lines: [{ text: "Mail", note: "inbox" }, { text: "Coffee", note: "" }], updatedAt: 100 });
  assert.deepEqual(M.liveTemplates(d).map(t => t.name), ["Morning"]);
  let n = 0; const ids = () => "new" + (++n);
  const ins = M.insertTemplate(d, d.templates.tp, "", { today: true }, 200, ids);
  assert.deepEqual(ins.ids, ["new1", "new2"]);
  assert.equal(ins.doc.items.new1.text, "Mail"); assert.equal(ins.doc.items.new1.today, true); assert.equal(ins.doc.items.new1.done, false); assert.equal(ins.doc.items.new1.sectionId, "");
  assert.ok(ins.doc.items.new2.order > ins.doc.items.new1.order && ins.doc.items.new1.order > d.items.c.order);
  assert.deepEqual(M.itemsInSection(ins.doc, "").map(i => i.id), ["c", "new1", "new2"]);
  const del = M.deleteTemplate(ins.doc, "tp", 300); assert.equal(del.templates.tp.deleted, true); assert.equal(M.liveTemplates(del).length, 0);
  assert.equal(M.normalize(d).templates.tp.lines.length, 2, "survives normalize");
});

test("put a section on Today / take it off", () => {
  let d = M.emptyDoc("L"); d.sections.s = { id: "s", name: "S", order: 1, collapsed: false, updatedAt: 1 };
  d.items.a = item("a", { sectionId: "s", today: false }); d.items.b = item("b", { sectionId: "s", today: false, done: true, doneAt: 5 }); d.items.c = item("c", { sectionId: "s", today: true });
  const on = M.setSectionToday(d, "s", true, 50);
  assert.equal(on.items.a.today, true); assert.equal(on.items.b.today, false, "done lines are left alone"); assert.equal(on.items.c.updatedAt, 1000, "already on Today: untouched");
  assert.ok(on.items.a.todayOrder > on.items.c.todayOrder, "lands at the end of Today");
  const off = M.setSectionToday(on, "s", false, 60); assert.equal(off.items.a.today, false); assert.equal(off.items.c.today, false);
  assert.equal(M.setSectionToday(off, "s", false, 70), off, "nothing to do: same doc");
});

test("move to another list: copied under a new id with its rule and return; the source keeps a bare tombstone", () => {
  let src = M.emptyDoc("A"), dst = M.emptyDoc("B");
  src.items.a = item("a", { text: "Take me", sectionId: "s", note: "n", today: true }); src = M.setRule(src, "a", { kind: "weekdays" }, 1, "2026-09-01"); src = M.notToday(src, "a", "2026-09-01", 2);
  dst.items.z = item("z", { order: 5000, todayOrder: 5000 });
  const r = M.moveItem(src, dst, "a", 100, () => "fresh");
  assert.equal(r.newId, "fresh");
  const it = r.dst.items.fresh; assert.equal(it.text, "Take me"); assert.equal(it.note, "n"); assert.equal(it.sectionId, ""); assert.equal(it.today, false, "state travels as it was (not-today'd)"); assert.ok(it.order > 5000); assert.equal(it.updatedAt, 100);
  assert.equal(r.dst.rules.fresh.kind, "weekdays"); assert.equal(r.dst.returns.fresh.on, "2026-09-02");
  assert.deepEqual(r.src.items.a, { id: "a", deleted: true, updatedAt: 100 }); assert.equal(r.src.rules.a.deleted, true); assert.equal(r.src.returns.a.deleted, true);
  assert.equal(M.recentlyDeleted(r.src).length, 0, "a moved line is not a deleted one");
  assert.equal(M.moveItem(src, dst, "nope"), null);
  assert.doesNotThrow(() => { M.normalize(r.src); M.normalize(r.dst); M.merge(r.dst, dst); });
});

test("export → import round trip is byte-identical, carries no secret, and Markdown reads", () => {
  let d = M.emptyDoc("SecretW0000000000000000", "Work"); d.sections.s = { id: "s", name: "Home", order: 1, collapsed: false, updatedAt: 1 };
  d.items.a = item("a", { text: "Alpha", note: "with a note", sectionId: "s" }); d.items.b = item("b", { text: "Beta", done: true, doneAt: 5 }); d.items.t = M.tombstone(item("t", { text: "Gone" }), 9);
  d.history["2026-08-30"] = [{ id: "h", text: "Old", doneAt: 4, section: "Home" }];
  d = M.setRule(d, "a", { kind: "daily" }, 10, "2026-09-01"); d = M.templateFromSection(d, "s", "T", "tp", 11);
  const out = M.exportJSON(d, { at: 123 });
  assert.ok(!out.includes("SecretW0000000000000000"), "the list secret never leaves");
  assert.ok(out.endsWith("\n") && out.startsWith("{"));
  const back = M.importJSON(out, "NewList0000000000000000");
  assert.equal(back.id, "NewList0000000000000000"); assert.equal(back.items.a.note, "with a note"); assert.equal(back.rules.a.kind, "daily"); assert.equal(back.templates.tp.name, "T");
  assert.equal(M.exportJSON(back, { at: 123 }), out, "byte-identical");
  assert.equal(M.exportJSON(M.importJSON(M.exportJSON(back, { at: 1 })), { at: 123 }), out, "and again");
  assert.throws(() => M.importJSON("not json"), /JSON/); assert.throws(() => M.importJSON('{"hello":1}'), /export/);
  assert.equal(M.importJSON(JSON.stringify(d)).items.a.text, "Alpha", "a bare document is accepted too");
  const md = M.exportMarkdown(d, { today: "2026-09-01" });
  assert.ok(md.startsWith("# Work\n")); assert.ok(md.includes("- [ ] Alpha ★ ↻\n  with a note")); assert.ok(md.includes("- [x] Beta ★")); assert.ok(md.includes("## Home")); assert.ok(md.includes("### 2026-08-30\n\n- Old · Home"));
  assert.ok(!md.includes("Gone"));
});

test("add from anywhere: the hash parses, newlines make lines, a view link is recognisable, junk is null", () => {
  const W = "AbCdEfGhIjKlMnOpQrStUv";
  assert.deepEqual(M.parseHash("#/l/" + W), { id: W, mode: "edit", add: null });
  assert.deepEqual(M.parseHash("#/r/" + W), { id: W, mode: "view", add: null });
  assert.deepEqual(M.parseHash("#/l/" + W + "/add?text=Call%20Bob"), { id: W, mode: "edit", add: { text: ["Call Bob"], section: "" } });
  assert.deepEqual(M.parseHash("#/l/" + W + "/add?text=One%0ATwo%0D%0A%20%20Three%20%20%0A&section=Work").add, { text: ["One", "Two", "Three"], section: "Work" });
  assert.deepEqual(M.parseHash("#/l/" + W + "/add?text=a+plus+b").add.text, ["a plus b"]);
  assert.deepEqual(M.parseHash("#/l/" + W + "/add").add, { text: [], section: "" }, "empty text: the caller opens the editor");
  assert.deepEqual(M.parseHash("#/r/" + W + "/add?text=x"), { id: W, mode: "view", add: { text: ["x"], section: "" } }, "a view link carries the add so the app can refuse it out loud");
  assert.equal(M.parseHash("#/l/short/add?text=x"), null); assert.equal(M.parseHash("#/x/" + W), null); assert.equal(M.parseHash("#/l/" + W + "/other"), null); assert.equal(M.parseHash(""), null);
  assert.equal(M.addUrl("https://h/app/", W), "https://h/app/#/l/" + W + "/add?text=");
  assert.equal(M.parseHash("#/l/" + W + "/add?text=" + encodeURIComponent("x".repeat(500))).add.text[0].length, M.TEXT_MAX);
});

test("what's new: once per version, never on a fresh device, and a pre-v4 device with a list counts as returning", () => {
  assert.equal(M.whatsNewDue({ seenVersion: "", hasLists: false }, "4.0.0"), false, "first run");
  assert.equal(M.whatsNewDue({ seenVersion: "", hasLists: true }, "4.0.0"), true, "v3 device updating");
  assert.equal(M.whatsNewDue({ seenVersion: "4.0.0", hasLists: true }, "4.0.0"), false, "seen");
  assert.equal(M.whatsNewDue({ seenVersion: "4.0.0", hasLists: false }, "4.1.0"), true, "next update");
});

test("what's new fires on a changed version string, never on its order: a 1.1 device and a 1.0 device (4.0.0) each see 1.2 once", () => {
  // the renumbering (4.0.0 → 1.0) sorts *below* what a device from then remembers; 1.1 → 1.2 is the ordinary case
  assert.equal(M.whatsNewDue({ seenVersion: "4.0.0", hasLists: true }, VERSION), true, "a 1.0 device (which called itself 4.0.0) sees the 1.2 entry");
  assert.equal(M.whatsNewDue({ seenVersion: "1.1", hasLists: true }, VERSION), true, "a 1.1 device sees it");
  assert.equal(M.whatsNewDue({ seenVersion: VERSION, hasLists: true }, VERSION), false, "and never again");
  assert.equal(M.whatsNewDue({ seenVersion: "1.2", hasLists: true }, "1.1.1"), true, "a fix that sorts lower still fires (change, not order)");
  const wn = JSON.parse(fs.readFileSync(new URL("../whatsnew.json", import.meta.url), "utf8"));
  const toast = wn.versions[0].headline;
  assert.doesNotMatch(toast, /4\.0\.0|renumber|1\.0\b|1\.1\b/, "the headline says nothing about version numbers");
  assert.match(toast, /day and night/i, "the headline is the Day and Night round");
});

test("the changelog (1.2): 1.0 and later only, a one-sentence headline of 12 words or fewer, up to three tagged items of 14 words or fewer, nothing about the plumbing", () => {
  const wn = JSON.parse(fs.readFileSync(new URL("../whatsnew.json", import.meta.url), "utf8"));
  const words = s => s.trim().split(/\s+/).length;
  assert.deepEqual(wn.versions.map(v => v.version), ["1.2", "1.1", "1.0"], "the 0.x entries are in CHANGELOG.md, never rendered");
  const never = /\bfonts?\b|\bCDN\b|service worker|\btests?\b|Lighthouse|renumber|migrat|\bmerge/i;
  for (const v of wn.versions) {
    assert.match(v.headline, /^[^.!?]+[.!?]$/, v.version + ": a headline that is one sentence: " + v.headline);
    assert.ok(words(v.headline) <= 12, v.version + ": headline over 12 words");
    assert.ok(!("lines" in v) && !("date" in v), v.version + ": the old shape is gone");
    assert.ok(Array.isArray(v.items) && v.items.length >= 1 && v.items.length <= 3, v.version + ": one to three items");
    for (const it of v.items) {
      assert.ok(["New", "Improved", "Fixed"].includes(it.tag), v.version + ": tag " + it.tag);
      assert.ok(words(it.text) <= 14, v.version + ": over 14 words: " + it.text);
      assert.doesNotMatch(it.text, never, v.version + ": plumbing in an item: " + it.text);
    }
    assert.doesNotMatch(v.headline, never, v.version + ": plumbing in the headline");
  }
  const md = fs.readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
  for (const v of ["1.2", "1.1", "1.0", "0.3", "0.2", "0.1"]) assert.ok(new RegExp("^## " + v.replace(".", "\\."), "m").test(md), "CHANGELOG.md holds " + v);
  assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(md), "no dates in CHANGELOG.md either");
});

test("day review: streak, the week's finished days, today's lines", () => {
  const d = M.emptyDoc("L");
  d.history["2026-09-01"] = [{ id: "h1", text: "x", doneAt: 1, section: "" }]; d.history["2026-09-02"] = [{ id: "h2", text: "y", doneAt: 2, section: "" }];
  d.items.a = item("a", { text: "Alpha", done: true, doneAt: at("2026-09-03T09:00:00") }); d.items.b = item("b", { text: "Beta" });
  const r = M.dayReview(d, "2026-09-03"); // a Thursday
  assert.equal(r.streak, 3); assert.equal(r.days[0].day, "2026-08-31"); assert.equal(r.days[6].day, "2026-09-06");
  assert.deepEqual(r.days.map(x => x.finished), [false, true, true, true, false, false, false]); assert.equal(r.finishedThisWeek, 3);
  assert.deepEqual(r.days.map(x => x.future), [false, false, false, false, true, true, true]);
  assert.deepEqual(r.lines, [{ id: "b", text: "Beta", done: false }, { id: "a", text: "Alpha", done: true }]);
  assert.equal(M.dayReview(d, "2026-09-06").days[0].day, "2026-08-31", "Sunday belongs to the week that started on Monday");
});

test("purgeTombstones drops rules and returns whose line is gone for good", () => {
  let d = M.emptyDoc("L"); d.items.a = item("a"); d = M.setRule(d, "a", { kind: "daily" }, 1, "2026-09-01"); d = M.notToday(d, "a", "2026-09-01", 2);
  delete d.items.a; // the tombstone was purged long ago
  const p = M.purgeTombstones(d, 1e13);
  assert.ok(!p.rules.a && !p.returns.a);
  let e = M.emptyDoc("L"); e.items.a = item("a"); e = M.setRule(e, "a", { kind: "daily" }, 1, "2026-09-01");
  assert.equal(M.purgeTombstones(e, 1e13), e, "a live line keeps its rule");
});

test("the version is one number in three places, the build in two, and there are no dates anywhere", () => {
  const sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const wn = JSON.parse(fs.readFileSync(new URL("../whatsnew.json", import.meta.url), "utf8"));
  assert.match(VERSION, /^\d+\.\d+(\.\d+)?$/, "marketing version: 1.x, or 1.0.x for a fix");
  assert.ok(Number.isInteger(BUILD) && BUILD > 0, "build is a positive integer (the commit count on main)");
  assert.equal(VERSION_LABEL, `${VERSION} (build ${BUILD})`);
  assert.ok(sw.includes(`const VERSION = "tf-v${VERSION}"`), "sw.js cache name carries the app version");
  assert.equal(wn.versions[0].version, VERSION, "whatsnew.json leads with the current version");
  assert.equal(wn.build, BUILD, "whatsnew.json carries the build number the About page shows");
  assert.deepEqual(wn.versions.map(v => v.version), ["1.2", "1.1", "1.0"], "the public history: 1.0 and later (4.0.0 became 1.0; the pre-releases live in CHANGELOG.md)");
  for (const v of wn.versions) { assert.match(v.version, /^\d+\.\d+(\.\d+)?$/); assert.ok(!("date" in v), v.version + ": no date field"); assert.ok(typeof v.headline === "string" && v.items.length >= 1 && v.items.length <= 3, v.version + ": a headline and one to three items"); }
  assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(fs.readFileSync(new URL("../about.html", import.meta.url), "utf8")), "no dates on the About page");
  for (const f of ["packs.js", "panels.js", "panels.css", "exporter.js", "version.js", "whatsnew.json"]) assert.ok(sw.includes(`"./${f}"`), "precached: " + f);
});

console.log(`\n${passed} feature tests passed`);
