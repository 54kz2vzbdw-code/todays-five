// The compatibility test (COMPATIBILITY.md §3). Run: node test/compat.test.js
// A v4 document goes through the FROZEN v3 model (test/fixtures/model-v3.js): the old client must lose nothing
// it can see, its own edits must survive, and a v4 client merging the result back must recover every v4-only
// field. Rollover on both sides must converge on the v4 outcome for recurring lines.
import assert from "node:assert/strict";
import * as V3 from "./fixtures/model-v3.js";
import * as M from "../model.js";

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok -", name); }
/** Records compared, the document's own wall-clock stamp ignored (two devices roll at different times). */
const records = d => M.canon({ ...d, updatedAt: 0 });

const item = (id, over = {}) => ({ id, sectionId: "", text: "t-" + id, note: "", done: false, doneAt: 0, today: true, order: 1000, todayOrder: 1000, updatedAt: 1000, ...over });
const T0 = new Date("2026-09-01T15:00:00").getTime();

/** A document that uses every v4 addition, plus a field from a version that does not exist yet. */
function v4doc() {
  const d = M.emptyDoc("L", "Work"); d.nameAt = 5; d.updatedAt = 5000;
  d.sections.s1 = { id: "s1", name: "Home", order: 1000, collapsed: false, updatedAt: 1000 };
  d.items.a = item("a", { text: "Standup", note: "9 am" });
  d.items.b = item("b", { sectionId: "s1", text: "Walk", today: false });
  d.items.c = item("c", { text: "Call Bob", done: true, doneAt: T0, updatedAt: T0 });
  d.items.gone = M.tombstone(item("gone", { text: "Old line", note: "with a note", sectionId: "s1" }), 4000);
  d.items.z = item("z", { text: "From the future", future: { flag: true } });
  d.themes.t1 = { id: "t1", name: "Mine", code: "T1:d:FF3D9A:fraunces:Mine", updatedAt: 1000 };
  d.history["2026-08-31"] = [{ id: "h1", text: "Yesterday's", doneAt: T0 - 86400000, section: "" }];
  d.rules.a = { id: "a", kind: "weekdays", text: "Standup", note: "9 am", sectionId: "", placed: "2026-09-01", updatedAt: 1000 };
  d.rules.c = { id: "c", kind: "daily", text: "Call Bob", note: "", sectionId: "", updatedAt: 1000 };
  d.returns.b = { id: "b", on: "2026-09-02", updatedAt: 1000 };
  d.templates.tp = { id: "tp", name: "Morning", lines: [{ text: "Coffee", note: "" }, { text: "Mail", note: "inbox zero" }], updatedAt: 1000 };
  d.someFutureCollection = { x: { id: "x", updatedAt: 1 } };
  return M.normalize(d, "L");
}

test("the frozen v3 model is what shipped (it must not know the v4 collections)", () => {
  const d = V3.normalize(v4doc(), "L");
  assert.equal(d.v, 2);
  assert.ok(!("rules" in d) && !("returns" in d) && !("templates" in d) && !("someFutureCollection" in d));
  assert.deepEqual(d.items.gone, { id: "gone", deleted: true, updatedAt: 4000 }, "v3 strips a tombstone's text");
  assert.ok(!("future" in d.items.z));
});

test("nothing an old client can see is dropped: items, sections, themes, history, name", () => {
  const d4 = v4doc(), d3 = V3.normalize(d4, "L");
  for (const id of Object.keys(d4.items)) {
    const a = d4.items[id], b = d3.items[id];
    assert.ok(b, "item " + id);
    for (const k of ["text", "note", "sectionId", "done", "doneAt", "today", "order", "todayOrder", "updatedAt", "deleted"]) if (k in a && !(a.deleted && ["text", "note", "sectionId"].includes(k))) assert.deepEqual(b[k], a[k], id + "." + k);
  }
  assert.deepEqual(d3.sections, d4.sections); assert.deepEqual(d3.themes, d4.themes); assert.deepEqual(d3.history, d4.history);
  assert.equal(d3.name, "Work"); assert.equal(d3.nameAt, 5);
  // and the v3 client's own routines do not choke on it
  assert.doesNotThrow(() => V3.rollover(d3, "2026-09-02", T0 + 1));
  assert.doesNotThrow(() => V3.purgeTombstones(d3, T0 + 1));
  assert.doesNotThrow(() => V3.merge(d3, v4doc()));
  assert.doesNotThrow(() => V3.diff(d3, V3.normalize(v4doc(), "L")));
});

test("the old client edits and pushes; the v4 client merging it back keeps its edits and recovers every v4 field", () => {
  const d4 = v4doc();
  const d3 = V3.normalize(d4, "L");
  // the old phone: edits a line's text, checks another off, adds a line, deletes a section
  d3.items.b = { ...d3.items.b, text: "Walk the dog", updatedAt: 9000 };
  d3.items.a = { ...d3.items.a, done: true, doneAt: 9500, updatedAt: 9500 };
  d3.items.n = item("n", { text: "From the phone", updatedAt: 9600 });
  d3.sections.s1 = { id: "s1", deleted: true, updatedAt: 9700 };
  const pushed = V3.merge(d3, d3); // what lands on the server: v3's own merge/normalize of its doc
  for (const [x, y] of [[d4, pushed], [pushed, d4]]) {
    const m = M.merge(x, y);
    assert.equal(m.items.b.text, "Walk the dog"); assert.equal(m.items.a.done, true); assert.equal(m.items.n.text, "From the phone"); assert.equal(m.sections.s1.deleted, true);
    assert.deepEqual(m.rules, d4.rules, "rules survive"); assert.deepEqual(m.returns, d4.returns, "returns survive"); assert.deepEqual(m.templates, d4.templates, "templates survive");
    assert.equal(m.items.gone.text, "Old line", "a tombstone's text wins the tie against the stripped copy");
    assert.deepEqual(m.items.z.future, { flag: true }, "a future field survives the round trip");
    assert.deepEqual(m.someFutureCollection, d4.someFutureCollection, "a future collection survives");
    assert.equal(M.canon(M.merge(m, pushed)), M.canon(m), "stable once merged");
  }
});

test("rollover on both sides converges on the v4 outcome: the recurring line resets instead of vanishing", () => {
  const d4 = v4doc();                                             // c is done yesterday and repeats daily
  const v3 = V3.rollover(V3.normalize(d4, "L"), "2026-09-02", T0 + 86400000).doc;
  assert.equal(v3.items.c.deleted, true, "the old client tombstones it");
  const v4 = M.rollover(d4, "2026-09-02", T0 + 86400000).doc;
  assert.equal(v4.items.c.done, false); assert.equal(v4.items.c.today, true); assert.equal(v4.items.c.updatedAt, T0 + 2);
  assert.equal(v4.history["2026-09-01"][0].id, "c");
  for (const [x, y] of [[v4, v3], [v3, v4]]) {
    const m = M.merge(x, y);
    assert.equal(m.items.c.deleted, undefined, "the reset beats the tombstone"); assert.equal(m.items.c.text, "Call Bob");
    assert.equal(m.history["2026-09-01"].length, 1);
    assert.equal(records(M.rollover(m, "2026-09-02", T0 + 90000000).doc), records(m), "idempotent after the merge");
  }
  // the old client, seeing the merged doc, shows the line again and does not tombstone it a second time
  const seen = V3.normalize(M.merge(v4, v3), "L");
  assert.equal(seen.items.c.done, false);
  assert.equal(V3.rollover(seen, "2026-09-02", T0 + 90000000).moved.length, 0);
});

test("revival: the old client rolled over before any v4 device saw the check-off; the rule brings the line back", () => {
  const d4 = v4doc();
  // the Mac (v4) last saw c undone
  const mac = M.normalize(d4, "L"); mac.items.c = item("c", { text: "Call Bob", updatedAt: 500 });
  // the phone (v3) checked it off and rolled over the next morning; the Mac only sees the result
  const phone = V3.normalize(d4, "L"); phone.items.c = { ...phone.items.c, done: true, doneAt: T0, updatedAt: T0 + 1 };
  const rolled = V3.rollover(phone, "2026-09-02", T0 + 86400000).doc;
  assert.equal(rolled.items.c.deleted, true);
  const merged = M.merge(mac, rolled);
  assert.equal(merged.items.c.deleted, true, "the tombstone wins the merge");
  const revived = M.rollover(merged, "2026-09-02", T0 + 86400000).doc;
  assert.equal(revived.items.c.deleted, undefined, "revived"); assert.equal(revived.items.c.text, "Call Bob"); assert.equal(revived.items.c.today, true);
  assert.equal(revived.items.c.updatedAt, rolled.items.c.updatedAt + 1);
  assert.equal(records(M.rollover(revived, "2026-09-02", T0 + 86400001).doc), records(revived), "idempotent");
  // two v4 devices doing this independently agree on every record
  assert.equal(records(M.rollover(M.merge(rolled, mac), "2026-09-02", T0 + 90000000).doc), records(revived));
  // a deliberate delete on the old client (stamped with the clock, long after the check-off) is honoured
  const del = V3.normalize(d4, "L"); del.items.c = { id: "c", deleted: true, updatedAt: T0 + 3600000 };
  assert.equal(M.rollover(M.merge(mac, del), "2026-09-02", T0 + 86400000).doc.items.c.deleted, true);
});

test("v4 docs read by v4 keep v:3, and a v2-stamped doc from an old client is accepted as it is", () => {
  const d = M.normalize({ ...v4doc(), v: 2 }, "L");
  assert.equal(d.v, 3); assert.equal(Object.keys(d.rules).length, 2);
  assert.equal(M.normalize(v4doc(), "L").v, 3);
});

console.log(`\n${passed} compatibility tests passed`);
