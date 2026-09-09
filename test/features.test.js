// Node tests for the v4 model features. Run: node test/features.test.js
import assert from "node:assert/strict";
import fs from "node:fs";
import * as M from "../model.js";
import * as T from "../theme.js";
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
  const tue = M.rollover(d, "2026-09-08", at("2026-09-08T09:00:00")).doc; // 1.9: the third argument is the clock (the six-hour guard reads it), so it is a real morning
  assert.equal(tue.items.a.done, false); assert.equal(tue.items.a.today, false, "not due on Tuesday: off Today, in Everything");
  assert.equal(M.rollover(tue, "2026-09-09", at("2026-09-09T09:00:00")).doc, tue, "Wednesday: nothing");
  const thu = M.rollover(tue, "2026-09-10", at("2026-09-10T09:00:00")).doc;
  assert.equal(thu.items.a.today, true, "Thursday: back on Today"); assert.equal(thu.items.a.updatedAt, tue.items.a.updatedAt + 1); assert.equal(thu.rules.a.placed, "2026-09-10");
  assert.equal(M.rollover(thu, "2026-09-10", at("2026-09-10T09:01:00")).doc, thu, "same day again: nothing");
  // the user takes it off Today that day: the minute tick must not put it back
  const off = M.normalize(thu); off.items.a = { ...off.items.a, today: false, updatedAt: at("2026-09-10T11:00:00") };
  assert.equal(M.rollover(off, "2026-09-10", at("2026-09-10T11:01:00")).doc, off);
  assert.equal(M.rollover(off, "2026-09-11", at("2026-09-11T09:00:00")).doc, off, "Friday: not due");
  assert.equal(M.rollover(off, "2026-09-14", at("2026-09-14T09:00:00")).doc.items.a.today, true, "next Monday: back");
});

test("rollover: an unfinished recurring line just stays; a plain done line still tombstones (+1) as in v3", () => {
  const y = at("2026-09-01T15:00:00");
  let d = M.emptyDoc("L"); d.items.a = item("a", { done: false }); d.items.b = item("b", { done: true, doneAt: y, updatedAt: y }); d = M.setRule(d, "a", { kind: "daily" }, 1, "2026-09-01");
  const r = M.rollover(d, "2026-09-02", at("2026-09-02T09:00:00")).doc;
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
  assert.ok(!md.includes("## Today"), "1.9: no separate Today block (proposal 30)"); assert.equal(md.split("Alpha ★").length - 1, 1, "a Today line prints once, marked in place");
  assert.ok(!md.includes("Gone"));
});

test("add from anywhere: the hash parses, newlines make lines, a view link is recognisable, junk is null", () => {
  const W = "AbCdEfGhIjKlMnOpQrStUv";
  assert.deepEqual(M.parseHash("#/l/" + W), { id: W, mode: "edit", add: null, hint: null });
  assert.deepEqual(M.parseHash("#/r/" + W), { id: W, mode: "view", add: null, hint: null });
  assert.deepEqual(M.parseHash("#/l/" + W + "/add?text=Call%20Bob"), { id: W, mode: "edit", add: { text: ["Call Bob"], section: "" }, hint: null });
  assert.deepEqual(M.parseHash("#/l/" + W + "/add?text=One%0ATwo%0D%0A%20%20Three%20%20%0A&section=Work").add, { text: ["One", "Two", "Three"], section: "Work" });
  assert.deepEqual(M.parseHash("#/l/" + W + "/add?text=a+plus+b").add.text, ["a plus b"]);
  assert.deepEqual(M.parseHash("#/l/" + W + "/add").add, { text: [], section: "" }, "empty text: the caller opens the editor");
  assert.deepEqual(M.parseHash("#/r/" + W + "/add?text=x"), { id: W, mode: "view", add: { text: ["x"], section: "" }, hint: null }, "a view link carries the add so the app can refuse it out loud");
  assert.equal(M.parseHash("#/l/short/add?text=x"), null); assert.equal(M.parseHash("#/x/" + W), null); assert.equal(M.parseHash("#/l/" + W + "/other").id, W, "a suffix from a later version leaves the id readable (COMPATIBILITY.md §1; 1.4)"); assert.equal(M.parseHash("#/l/" + W + "/other").hint, null); assert.equal(M.parseHash(""), null);
  assert.equal(M.addUrl("https://h/app/", W), "https://h/app/#/l/" + W + "/add?text=");
  assert.equal(M.parseHash("#/l/" + W + "/add?text=" + encodeURIComponent("x".repeat(500))).add.text[0].length, M.TEXT_MAX);
});

test("what's new: once per version, never on a fresh device, and a pre-v4 device with a list counts as returning", () => {
  assert.equal(M.whatsNewDue({ seenVersion: "", hasLists: false }, "4.0.0"), false, "first run");
  assert.equal(M.whatsNewDue({ seenVersion: "", hasLists: true }, "4.0.0"), true, "v3 device updating");
  assert.equal(M.whatsNewDue({ seenVersion: "4.0.0", hasLists: true }, "4.0.0"), false, "seen");
  assert.equal(M.whatsNewDue({ seenVersion: "4.0.0", hasLists: false }, "4.1.0"), true, "next update");
});

test("what's new fires on a changed version string, never on its order: a 1.3 device, a 1.2 device, a 1.1 device and a 1.0 device (4.0.0) each see the newest entry once", () => {
  // the renumbering (4.0.0 → 1.0) sorts *below* what a device from then remembers; 1.1 → 1.2 is the ordinary case
  assert.equal(M.whatsNewDue({ seenVersion: "4.0.0", hasLists: true }, VERSION), true, "a 1.0 device (which called itself 4.0.0) sees the 1.2 entry");
  assert.equal(M.whatsNewDue({ seenVersion: "1.1", hasLists: true }, VERSION), true, "a 1.1 device sees it");
  assert.equal(M.whatsNewDue({ seenVersion: "1.2", hasLists: true }, VERSION), true, "a 1.2 device sees it");
  assert.equal(M.whatsNewDue({ seenVersion: "1.3", hasLists: true }, VERSION), true, "a 1.3 device sees it");
  assert.equal(M.whatsNewDue({ seenVersion: "1.4", hasLists: true }, VERSION), true, "a 1.4 device sees it");
  assert.equal(M.whatsNewDue({ seenVersion: "1.5", hasLists: true }, VERSION), true, "a 1.5 device sees it");
  assert.equal(M.whatsNewDue({ seenVersion: VERSION, hasLists: true }, VERSION), false, "and never again");
  assert.equal(M.whatsNewDue({ seenVersion: "1.2", hasLists: true }, "1.1.1"), true, "a fix that sorts lower still fires (change, not order)");
  const wn = JSON.parse(fs.readFileSync(new URL("../whatsnew.json", import.meta.url), "utf8"));
  const toast = wn.versions[0].headline;
  assert.doesNotMatch(toast, /4\.0\.0|renumber|1\.0\b|1\.1\b|1\.2\b|1\.3\b/, "the headline says nothing about version numbers");
  assert.match(toast, /^Easier to get back where you were\.$/, "1.12: the headline is about getting around, not about what was wrong");
  assert.doesNotMatch(toast, /event|haptic|bridge|WKWebView|user agent|CSP|contrast|OKLCH|hex|accent|luminance/i, "and nothing a person would not say");
  assert.doesNotMatch(toast, /panel|stack|registry|archived|Restore|undo|bug|fix/i, "1.12: and not the names of the things that were wrong with it");
  // 1.10's line promised an iPhone app nobody can install yet; 1.11 does not repeat it
  assert.doesNotMatch(toast, /iPhone|App Store/i, "1.11: the app is still not something a person can get, so the toast does not say it again");
  assert.match(wn.versions.find(v => v.version === "1.10").headline, /^Now there's an iPhone app\.$/, "1.10 keeps its own line");
  assert.match(wn.versions.find(v => v.version === "1.9").headline, /^Easier all over\.$/, "1.9: the app got easier, not what was found");
  assert.match(wn.versions.find(v => v.version === "1.8").headline, /^A little something for someone in particular\.$/, "1.8: the wink, and nothing else");
  const sharper = wn.versions.find(v => v.version === "1.7").headline;
  assert.match(sharper, /sharper/i, "the 1.7 headline says the app got sharper, not what was found");
  assert.doesNotMatch(sharper, /bug|fix|audit|found/i, "and nothing about what was found");
  assert.match(wn.versions.find(v => v.version === "1.4").headline, /shared/i, "1.4: shared lists");
});

test("the changelog (1.2): 1.0 and later only, a one-sentence headline of 12 words or fewer, up to three tagged items of 14 words or fewer, nothing about the plumbing", () => {
  const wn = JSON.parse(fs.readFileSync(new URL("../whatsnew.json", import.meta.url), "utf8"));
  const words = s => s.trim().split(/\s+/).length;
  assert.deepEqual(wn.versions.map(v => v.version), ["1.12", "1.11", "1.10", "1.9", "1.8", "1.7", "1.5", "1.4", "1.3", "1.2", "1.1", "1.0"], "the 0.x entries are in CHANGELOG.md, never rendered");
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
  for (const v of ["1.10", "1.9", "1.8", "1.7", "1.5", "1.4", "1.3", "1.2", "1.1", "1.0", "0.3", "0.2", "0.1"]) assert.ok(new RegExp("^## " + v.replace(".", "\\."), "m").test(md), "CHANGELOG.md holds " + v);
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

test("the version is one number in three places, the build in four, and there are no dates anywhere", () => {
  const sw = fs.readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const wn = JSON.parse(fs.readFileSync(new URL("../whatsnew.json", import.meta.url), "utf8"));
  assert.match(VERSION, /^\d+\.\d+(\.\d+)?$/, "marketing version: 1.x, or 1.0.x for a fix");
  assert.ok(Number.isInteger(BUILD) && BUILD > 0, "build is a positive integer (the commit count on main)");
  assert.equal(VERSION_LABEL, `${VERSION} (build ${BUILD})`);
  assert.ok(sw.includes(`const VERSION = "tf-v${VERSION}"`), "sw.js cache name carries the app version");
  assert.ok(sw.includes(`const BUILD = ${BUILD};`), "sw.js carries the build too (1.4: the cache is per build, and a page asks for its own)");
  assert.equal(wn.versions[0].version, VERSION, "whatsnew.json leads with the current version");
  assert.equal(wn.build, BUILD, "whatsnew.json carries the build number the About page shows");
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8"), panels = fs.readFileSync(new URL("../panels.js", import.meta.url), "utf8");
  // matched attribute by attribute rather than as one literal tag: <html> gained data-tokens-rev in
  // 1.12 b212, and a whole-tag string match turns every future attribute into a false failure here
  assert.match(html, /<html\b[^>]*\slang="en"[^>]*>/, "index.html declares its language");
  assert.match(html, /<html\b[^>]*\sdata-base="dark"[^>]*>/, "index.html paints a dark ground before anything runs");
  assert.match(html, new RegExp(`<html\\b[^>]*\\sdata-build="${BUILD}"[^>]*>`), "index.html says which build its markup is");
  assert.ok(panels.includes(`const PANELS_BUILD = ${BUILD};`), "panels.js says which build's markup it wires (a page open across a deploy reloads on the mismatch)");
  assert.deepEqual(wn.versions.map(v => v.version), ["1.12", "1.11", "1.10", "1.9", "1.8", "1.7", "1.5", "1.4", "1.3", "1.2", "1.1", "1.0"], "the public history: 1.0 and later (4.0.0 became 1.0; the pre-releases live in CHANGELOG.md)");
  for (const v of wn.versions) { assert.match(v.version, /^\d+\.\d+(\.\d+)?$/); assert.ok(!("date" in v), v.version + ": no date field"); assert.ok(typeof v.headline === "string" && v.items.length >= 1 && v.items.length <= 3, v.version + ": a headline and one to three items"); }
  assert.ok(!/\b20\d\d-\d\d-\d\d\b/.test(fs.readFileSync(new URL("../about.html", import.meta.url), "utf8")), "no dates on the About page");
  for (const f of ["packs.js", "packs-secret.js", "secretfx.js", "secretfx.css", "panels.js", "panels.css", "exporter.js", "version.js", "whatsnew.json"]) assert.ok(sw.includes(`"./${f}"`), "precached: " + f);
  for (const f of ["packs-secret.js", "secretfx.js", "secretfx.css"]) assert.ok(panels.includes(`"./${f}"`), "and refreshed before the guard's one reload: " + f);
});

test("1.8: the Secret pair is nowhere anyone reading the app can find it — not About, not How it works, not the changelog beyond the wink", () => {
  const read = f => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
  const NAMES = /superpink|birthday/i;
  // what a reader of the app sees: the About page and the changelog it renders, the README, and the long-form help
  for (const f of ["about.html", "whatsnew.json", "CHANGELOG.md", "README.md"]) {
    assert.doesNotMatch(read(f), NAMES, f + " names one of them");
    assert.doesNotMatch(read(f), /forget the secret|secret (theme|group|pair)|unlock/i, f + " mentions the group"); // "secret" alone is what About calls the thing in a link
  }
  const panels = read("panels.js");
  const helpAt = panels.indexOf("How it works");
  assert.ok(helpAt > 0);
  assert.doesNotMatch(panels.slice(helpAt), NAMES, "the How it works copy names one of them");
  assert.ok(/one of the twelve sound packs/.test(panels), "How it works still says twelve: the Secret pair's two are not on offer");
  // the wink, and only the wink
  const wn = JSON.parse(read("whatsnew.json"));
  const v18 = wn.versions.find(v => v.version === "1.8"); assert.ok(v18); assert.equal(v18.items.length, 1, "one line");
  const md = read("CHANGELOG.md");
  const entry = md.slice(md.indexOf("## 1.8"), md.indexOf("## 1.7"));
  assert.equal(entry.trim().split("\n").filter(l => l.trim()).length, 2, "a heading and one item, no For the record: " + entry);
  // the markup gives the group a home and a way out of it, and names neither theme: the swatches are built at render time
  const html = read("index.html");
  assert.ok(html.includes('id="sw-secret"') && html.includes('id="sw-forget"'), "the group has a home in the markup");
  assert.doesNotMatch(html, NAMES, "and the markup names neither theme");
});

test("1.12 b212: the cached token CSS is stamped with the palette it was computed from, and both pages agree", () => {
  // tf/v2/themecss is a CACHE OF A COMPUTED VALUE. Until this build nothing recorded which palette it
  // had been computed from, so when a built-in kit's colours moved underneath it — which is exactly
  // what this round did to Paper and Terminal — the cached tokens were still a valid :root{…} rule and
  // simply the old palette's. The page corrected itself because app.js applies the theme on boot, but
  // that rests on a module running to completion; the stamp makes it structural, at first paint.
  const idx = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const abt = fs.readFileSync(new URL("../about.html", import.meta.url), "utf8");

  assert.match(T.PALETTE_REV, /^[0-9a-z]+$/, "the stamp is a short base-36 hash");
  for (const [name, html] of [["index.html", idx], ["about.html", abt]]) {
    const m = /<html[^>]*\sdata-tokens-rev="([^"]+)"/.exec(html);
    assert.ok(m, name + " carries data-tokens-rev on <html>");
    assert.equal(m[1], T.PALETTE_REV, name + "'s stamp is theme.js's PALETTE_REV — regenerate it when a palette moves");
    assert.ok(html.includes('localStorage.getItem("tf/v2/themerev") !== document.documentElement.getAttribute("data-tokens-rev")'),
      name + "'s boot script refuses a cache it cannot prove was computed from this palette");
  }

  // it must actually change when a palette does, or it is decoration
  const seen = new Set();
  for (const t of T.CURATED) seen.add(t.colors.accent);
  assert.ok(seen.size >= 16, "the stamp is over a table with real variety in it");
  const other = T.CURATED.map(t => t.id + "=" + Object.keys(t.colors).sort().map(k => k + ":" + (t.id === "paper" && k === "accent" ? "#A86014" : t.colors[k])).join(",") + ";").join("");
  const fnv = (str, off) => { let x = off >>> 0; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; };
  assert.notEqual(fnv(other, 2166136261).toString(36), T.PALETTE_REV, "moving one kit's accent moves the stamp");
});

test("1.12 b212: the Secret group's third door — a saved theme whose code names a secret kit is not rendered on a device without the key", () => {
  const src = fs.readFileSync(new URL("../panels.js", import.meta.url), "utf8");

  // the hole was real: a themes record is just { id, name, code, updatedAt }, the code is a theme
  // code like any other, and the model carries it through both directions untouched — which it must
  // (COMPATIBILITY.md §3), so nothing here can be fixed in model.js.
  const rec = { id: "r1", name: "Mine", code: "T1:curated:superpink", updatedAt: 1000 };
  const doc = M.normalize({ themes: { r1: { ...rec }, r2: { id: "r2", name: "Blue", code: "T2:d:3366FF:grotesk::Blue", updatedAt: 1000 } } }, "L");
  assert.deepEqual(doc.themes.r1, rec, "normalize() keeps the record verbatim");
  assert.deepEqual(M.merge(doc, M.emptyDoc("L")).themes.r1, rec, "and so does a merge");
  assert.ok(T.isSecretCode(rec.code), "and the code does name one of them");

  // the gate: run panels.js's own savedThemes() expression, lifted out of the file, on that document
  const m = /function savedThemes\(\) \{ return ([^\n]+); \}/.exec(src);
  assert.ok(m, "savedThemes() is still the one expression this test runs");
  const savedThemes = new Function("A", "T", "dev", "return " + m[1] + ";");
  const A = { doc };
  const locked = savedThemes(A, T, () => ({})).map(s => s.id);
  const unlocked = savedThemes(A, T, () => ({ secret: true })).map(s => s.id);
  assert.deepEqual(locked, ["r2"], "without the key the secret record is not among the swatches");
  assert.deepEqual(unlocked.sort(), ["r1", "r2"], "with it, it is — and it was never deleted, only unshown");
  assert.deepEqual(doc.themes.r1, rec, "showing or not showing it does not touch the record");

  // and all three doors name the same guard, so a fourth cannot be added without one
  assert.ok(/dev\(\)\.secret \|\| !T\.isSecretTheme\(/.test(src), "Yours");
  assert.ok(src.includes("const secret = !!dev().secret;") && src.includes('fill("#sw-secret", secret ? T.SECRET.map(t => mk(t)) : []);'), "the group");
  assert.ok(/T\.isSecretTheme\(t\) && !dev\(\)\.secret/.test(src), "the import field");
});

test("no class or id the common content-blocker lists hide everywhere (build 69: .share-block hid the whole Share sheet on a phone with a blocker)", () => {
  const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8") + fs.readFileSync(new URL("../about.html", import.meta.url), "utf8");
  const names = new Set(); for (const m of html.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach(c => c && names.add("." + c)); for (const m of html.matchAll(/id="([^"]+)"/g)) names.add("#" + m[1]);
  // the generic (no-domain) cosmetic rules of EasyList, Fanboy Social and Annoyance and AdGuard Base, Social and Annoyances that a small app could plausibly use — checked against all six on 2026-09-05; .share-block was the one hit
  const hidden = [".share-block", ".share-buttons", ".share-bar", ".share-btn", ".share-box", ".share-links", ".share-tools", ".share-widget", ".social-share", ".social-links", ".sharing", ".share-icons", ".share-this", ".sharebox", ".share-container", ".share-panel", "#share-block", "#share-buttons", "#share-bar", "#social-share", "#sharebox", "#share-box", "#share-this", ".newsletter", ".newsletter-signup", ".cookie-banner", ".cookie-notice", ".popup-overlay", ".ad", ".ads", ".advert", ".banner-ad", ".sponsored", "#ad", "#ads", "#banner-ad", ".push-notification", ".notification-bar", ".sticky-banner", ".promo-bar"];
  const bad = hidden.filter(h => names.has(h)); assert.deepEqual(bad, [], "hidden by a content blocker: " + bad.join(", "));
});

test("1.7: about.html's fallback version line matches version.js (it shows when the script cannot run)", () => {
  const about = fs.readFileSync(new URL("../about.html", import.meta.url), "utf8");
  assert.ok(about.includes(`<p class="version" id="version">Version ${VERSION}</p>`), "about.html's static version is " + VERSION);
});

test("1.7: nothing boot() can reach is declared below the boot call — the module-level const/let after it are the known few", () => {
  const src = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8").split("\n");
  const bootAt = src.findIndex(l => l === "boot();");
  assert.ok(bootAt > 0, "the boot call");
  const late = src.slice(bootAt + 1).map(l => (l.match(/^(?:const|let) ([A-Za-z_$][\w$]*)/) || [])[1]).filter(Boolean);
  assert.deepEqual(late, ["downPointers", "preventTouch", "backBtn", "IDLE_MS", "api"], "a new module-level binding below boot() must be one no render, open or paint reaches at boot (DAY_NAMES was, 1.7): declare it above the boot block, or add it here after checking");
  assert.ok(src.slice(0, bootAt).some(l => l.startsWith("const DAY_NAMES = ")), "DAY_NAMES is above boot");
});

/* ---------------- 1.9: the home zone ---------------- */
test("1.9: a list carries its home zone — today and a line's day are computed in it, so two devices in different zones roll the same records; without one the six-hour guard holds a fresh line", () => {
  const prev = process.env.TZ;
  const inZone = (tz, fn) => { process.env.TZ = tz; try { return fn(); } finally { if (prev === undefined) delete process.env.TZ; else process.env.TZ = prev; } };
  // Chicago crosses a line off at breakfast (08:30 Chicago, 13:30 UTC, on the 5th); two hours later Tokyo is already 00:30 on the 6th
  const doneAt = Date.UTC(2026, 8, 5, 13, 30), later = Date.UTC(2026, 8, 5, 15, 30), nextDay = Date.UTC(2026, 8, 6, 6, 0); // 01:00 in Chicago on the 6th
  const mk = zone => { const d = M.emptyDoc("L"); if (zone) d.zone = zone; d.items.a = item("a", { text: "crossed off at breakfast", done: true, doneAt, updatedAt: doneAt }); d.items.b = item("b", { text: "still to do" }); return M.normalize(d, "L"); };
  assert.equal(inZone("Asia/Tokyo", () => M.localDate(later)), "2026-09-06", "Tokyo's own clock says the 6th"); assert.equal(inZone("America/Chicago", () => M.localDate(later)), "2026-09-05", "Chicago's says the 5th");
  // with a home zone both devices compute today and the line's day at home, whatever their own clocks say
  const z = mk("America/Chicago");
  assert.equal(M.zoneOf(z), "America/Chicago"); assert.equal(M.todayFor(z, later), "2026-09-05"); assert.equal(M.dayOf(z, doneAt), "2026-09-05"); assert.equal(M.todayFor(z, nextDay), "2026-09-06");
  const tokyo = inZone("Asia/Tokyo", () => M.rollover(z, undefined, later)), chicago = inZone("America/Chicago", () => M.rollover(z, undefined, later));
  assert.equal(tokyo.moved.length, 0, "Tokyo leaves the line: it is still the 5th at home"); assert.equal(chicago.moved.length, 0); assert.equal(tokyo.doc, z, "nothing changed on either"); assert.equal(chicago.doc, z);
  const t2 = inZone("Asia/Tokyo", () => M.rollover(z, undefined, nextDay)), c2 = inZone("America/Chicago", () => M.rollover(z, undefined, nextDay));
  assert.equal(t2.moved.length, 1, "after Chicago's midnight it goes to History"); assert.equal(records(t2.doc), records(c2.doc), "identical records from two zones");
  assert.deepEqual(Object.keys(t2.doc.history), ["2026-09-05"]); assert.equal(t2.doc.items.a.deleted, true); assert.equal(t2.doc.items.a.updatedAt, doneAt + 1);
  assert.equal(records(M.merge(t2.doc, c2.doc)), records(t2.doc), "and the merge changes nothing"); assert.equal(records(M.rollover(t2.doc, undefined, nextDay + 60000).doc), records(t2.doc), "idempotent");
  // the key is additive: it survives normalize, merge and an export; a document without one has none; two different zones merge the way every client merges a key it does not know (the larger string), so 1.8 agrees
  assert.equal(M.normalize(z, "L").zone, "America/Chicago"); assert.equal(M.merge(z, mk("")).zone, "America/Chicago"); assert.equal(M.merge(mk(""), z).zone, "America/Chicago"); assert.equal("zone" in M.normalize(mk(""), "L"), false);
  assert.equal(M.merge(mk("Asia/Tokyo"), mk("America/Chicago")).zone, "Asia/Tokyo"); assert.equal(M.merge(mk("America/Chicago"), mk("Asia/Tokyo")).zone, "Asia/Tokyo");
  assert.equal(M.normalize({ zone: "Mars/Olympus" }, "L").zone, "Mars/Olympus", "a zone this platform does not know is kept as written"); assert.equal(M.zoneOf({ zone: "Mars/Olympus" }), "", "and not used");
  assert.equal(M.isZone("UTC"), true); assert.equal(M.isZone("Etc/GMT+9"), true); assert.equal(M.isZone("../x"), false); assert.equal(M.isZone(""), false); assert.equal(M.isZone(null), false);
  assert.equal(M.withZone(mk(""), "Asia/Tokyo").zone, "Asia/Tokyo"); assert.equal(M.withZone(z, "Asia/Tokyo").zone, "America/Chicago", "a list keeps the zone it has"); assert.equal("zone" in M.withZone(mk(""), "Mars/Olympus"), false, "junk is never written");
  assert.ok(M.deviceZone() === "" || M.isZone(M.deviceZone()));
  assert.ok(M.exportJSON(z).includes('"zone": "America/Chicago"'), "the zone travels in an export"); assert.equal(M.importJSON(M.exportJSON(z), "X").zone, "America/Chicago");
  // without a home zone Tokyo's own clock would file the line under yesterday: the guard refuses a line finished under six hours ago
  const u = mk("");
  const tu = inZone("Asia/Tokyo", () => M.rollover(u, undefined, later));
  assert.equal(tu.moved.length, 0, "the guard: two hours old, not rolled"); assert.equal(tu.doc, u);
  const tu2 = inZone("Asia/Tokyo", () => M.rollover(u, undefined, doneAt + M.ROLL_GUARD_MS + 60000));
  assert.equal(tu2.moved.length, 1, "past six hours Tokyo rolls it on its own clock, as 1.8 did"); assert.deepEqual(Object.keys(tu2.doc.history), ["2026-09-05"]);
  assert.equal(inZone("America/Chicago", () => M.rollover(u, undefined, later)).moved.length, 0, "Chicago: still today");
  assert.equal(inZone("Asia/Tokyo", () => M.rollover(u, "2026-09-06", later)).moved.length, 0, "an explicit today does not get past the guard either");
  // not today, a rule's placement and the streak read the home zone too
  assert.equal(M.notToday(z, "b", M.todayFor(z, later), later).returns.b.on, "2026-09-06", "tomorrow at home");
  assert.equal(M.setRule(z, "b", { kind: "daily" }, later).rules.b.placed, "2026-09-05");
  assert.equal(inZone("Asia/Tokyo", () => M.streak(z, M.todayFor(z, later))), 1);
});

test("1.9: moveToSection files a line at the end of another section, keeps its Today place, refreshes its rule's snapshot, and is a no-op for the section it is in", () => {
  let d = M.emptyDoc("L"); d.sections.s = { id: "s", name: "Errands", order: 1000, collapsed: false, updatedAt: 1 };
  d.items.a = item("a", { text: "Stamps", todayOrder: 2000 }); d.items.b = item("b", { sectionId: "s", order: 5000 }); d = M.setRule(d, "a", { kind: "daily" }, 10, "2026-09-01");
  const m = M.moveToSection(d, "a", "s", 500);
  assert.equal(m.items.a.sectionId, "s"); assert.ok(m.items.a.order > 5000, "at the end of Errands"); assert.equal(m.items.a.todayOrder, 2000, "Today's order untouched"); assert.equal(m.items.a.updatedAt, 500);
  assert.equal(m.rules.a.sectionId, "s", "the rule's snapshot follows"); assert.equal(m.items.b, d.items.b, "nothing else moves");
  assert.equal(M.moveToSection(m, "a", "s", 600), m, "already there: unchanged");
  assert.equal(M.moveToSection(m, "a", "nope", 600).items.a.sectionId, "", "an unknown section means Unsorted");
  assert.equal(M.moveToSection(d, "zz", "s"), d, "no such line");
  assert.deepEqual(M.itemsInSection(m, "s").map(i => i.id), ["b", "a"]);
});

test("1.9: the losing side of a simultaneous edit — lostEdits names the line this device rewrote in the last minute that a pull replaced, once; the undo writes the words back as a newer edit that wins from then on", () => {
  const t0 = 1_700_000_000_000;
  const base = M.emptyDoc("L"); base.items.a = item("a", { text: "call the bank", updatedAt: t0 }); base.items.b = item("b", { text: "walk", updatedAt: t0 });
  // this device edits a at t0+1000 and remembers it; the other device edited the same line at t0+2000 (later, so it wins the merge)
  const mine = M.normalize(base, "L"); mine.items.a = { ...mine.items.a, text: "call the credit union", updatedAt: t0 + 1000 };
  const recent = new Map([["a", { text: "call the credit union", note: "", at: t0 + 1000 }]]);
  const theirs = M.normalize(base, "L"); theirs.items.a = { ...theirs.items.a, text: "call the bank at nine", updatedAt: t0 + 2000 };
  const merged = M.merge(mine, theirs);
  assert.equal(merged.items.a.text, "call the bank at nine", "last writer wins, as it should");
  const lost = M.lostEdits(mine, merged, recent, t0 + 5000);
  assert.deepEqual(lost, [{ id: "a", text: "call the credit union", note: "", theirs: { text: "call the bank at nine", note: "" } }], "the loss is named");
  // the undo: this device's words back as a fresh edit, which now wins against the other device's record
  const undone = M.normalize(merged, "L"); undone.items.a = { ...undone.items.a, text: lost[0].text, note: lost[0].note, updatedAt: t0 + 6000 };
  assert.equal(M.merge(undone, theirs).items.a.text, "call the credit union"); assert.equal(M.merge(theirs, undone).items.a.text, "call the credit union");
  // nothing to say when this device's edit won, when it is older than a minute, when the line was deleted, or when the pull changed nothing
  assert.deepEqual(M.lostEdits(mine, M.merge(mine, base), recent, t0 + 5000), [], "our edit stood");
  assert.deepEqual(M.lostEdits(mine, merged, recent, t0 + 1000 + M.LOST_EDIT_MS + 1), [], "a minute later it is old news");
  const gone = M.normalize(base, "L"); gone.items.a = { id: "a", deleted: true, updatedAt: t0 + 2000 };
  assert.deepEqual(M.lostEdits(mine, M.merge(mine, gone), recent, t0 + 5000), [], "a delete is not a rewrite");
  assert.deepEqual(M.lostEdits(mine, mine, recent, t0 + 5000), []);
  assert.deepEqual(M.lostEdits(mine, merged, { a: { text: "something else", note: "", at: t0 + 1000 } }, t0 + 5000), [], "only words this device actually left on the line count");
  assert.deepEqual(M.lostEdits(mine, merged, {}, t0 + 5000), []);
});

test("1.9: bidi overrides are stripped where text enters — the editor's commit (app.js), add from anywhere, names, and an import, everywhere a person reads — and never on read", () => {
  assert.equal(M.stripBidi("safe‮gnp.exe‬ tail"), "safegnp.exe tail"); assert.equal(M.stripBidi("a⁦b⁧c⁨d⁩e‪f‫g‬h‭i"), "abcdefghi");
  assert.equal(M.stripBidi("plain"), "plain"); assert.equal(M.stripBidi(""), ""); assert.equal(M.stripBidi(undefined), undefined); assert.equal(M.stripBidi("‘quotes’ – dashes … stay"), "‘quotes’ – dashes … stay");
  let d = M.emptyDoc("L", "Work‮"); d.sections.s = { id: "s", name: "Er‮rands", order: 1, collapsed: false, updatedAt: 1 };
  d.items.a = item("a", { text: "safe‮gnp.exe‬ tail", note: "n⁦o", sectionId: "s" }); d.items.t = M.tombstone(item("t", { text: "gone‮" }), 9);
  d = M.setRule(d, "a", { kind: "daily" }, 10, "2026-09-01"); d = M.templateFromSection(d, "s", "Morn‮ing", "tp", 11);
  d.history["2026-08-30"] = [{ id: "h", text: "old‮", doneAt: 4, section: "Er‮rands" }]; d.themes.th = { id: "th", name: "Mi‮ne", code: "T1:curated:pink", updatedAt: 1 };
  const back = M.importJSON(M.exportJSON(d), "X");
  assert.equal(back.items.a.text, "safegnp.exe tail"); assert.equal(back.items.a.note, "no"); assert.equal(back.items.t.text, "gone", "a remembered tombstone too");
  assert.equal(back.sections.s.name, "Errands"); assert.equal(back.name, "Work"); assert.equal(back.rules.a.text, "safegnp.exe tail"); assert.equal(back.templates.tp.name, "Morning"); assert.equal(back.templates.tp.lines[0].text, "safegnp.exe tail");
  assert.equal(back.history["2026-08-30"][0].text, "old"); assert.equal(back.history["2026-08-30"][0].section, "Errands"); assert.equal(back.themes.th.name, "Mine");
  assert.equal(M.normalize(d, "L").items.a.text, "safe‮gnp.exe‬ tail", "normalize does not rewrite what a document already holds");
  assert.equal(M.exportJSON(M.importJSON(M.exportJSON(back), "X"), { at: 1 }), M.exportJSON(back, { at: 1 }), "stripping is idempotent across round trips");
  assert.deepEqual(M.parseHash("#/l/AbCdEfGhIjKlMnOpQrStUv/add?text=" + encodeURIComponent("x‮y")).add.text, ["x‮y"], "the parser leaves it to the app, which strips on add");
});

console.log(`\n${passed} feature tests passed`);
