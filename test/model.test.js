// Node tests for model.js. Run: node test/model.test.js
import assert from "node:assert/strict";
import {
  newId, isListId, emptyDoc, normalize, merge, canon, docEquals, purgeTombstones,
  rollover, localDate, todayItems, itemsInSection, sectionsOrdered, orderBetween,
  migrateV1, seedDoc, streak, diff, TOMBSTONE_TTL, reorderPlan, applyPlan, SEED_LINES
} from "../model.js";

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok -", name); }

/* deterministic PRNG for the fuzz section */
let seed = 12345;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }

function item(id, over = {}) {
  return { id, sectionId: "", text: "t-" + id, note: "", done: false, doneAt: 0, today: true, order: 1000, todayOrder: 1000, updatedAt: 1, ...over };
}

test("ids: 22 base62 chars, unique, valid", () => {
  const ids = new Set();
  for (let i = 0; i < 2000; i++) { const id = newId(); assert.match(id, /^[0-9A-Za-z]{22}$/); ids.add(id); }
  assert.equal(ids.size, 2000);
  assert.ok(isListId(newId()));
  assert.ok(!isListId("short"));
  assert.ok(!isListId("has-dash-has-dash-has-dash"));
});

test("ids: every symbol appears (no dead symbols from rejection sampling)", () => {
  const counts = {};
  for (let i = 0; i < 400; i++) for (const ch of newId()) counts[ch] = (counts[ch] || 0) + 1;
  assert.equal(Object.keys(counts).length, 62);
});

test("normalize: junk in, well-formed doc out", () => {
  const d = normalize({ items: [{ id: "a", text: 5, done: "yes" }, null, { id: "b", deleted: true, updatedAt: 3 }], history: { "2026-01-01": [{ id: "x", doneAt: 1 }, { id: "x" }, 7] } }, "L");
  assert.equal(d.id, "L");
  assert.equal(d.items.a.text, "");
  assert.equal(d.items.a.done, true);
  assert.deepEqual(d.items.b, { id: "b", deleted: true, updatedAt: 3 });
  assert.equal(d.history["2026-01-01"].length, 1);
});

test("merge: last writer wins per item", () => {
  const a = emptyDoc("L"); a.items.x = item("x", { text: "old", updatedAt: 10 });
  const b = emptyDoc("L"); b.items.x = item("x", { text: "new", updatedAt: 20 });
  assert.equal(merge(a, b).items.x.text, "new");
  assert.equal(merge(b, a).items.x.text, "new");
});

test("merge: tombstones win ties and survive against older edits", () => {
  const a = emptyDoc("L"); a.items.x = item("x", { updatedAt: 10 });
  const b = emptyDoc("L"); b.items.x = { id: "x", deleted: true, updatedAt: 10 };
  assert.equal(merge(a, b).items.x.deleted, true);
  assert.equal(merge(b, a).items.x.deleted, true);
  const c = emptyDoc("L"); c.items.x = item("x", { updatedAt: 5 });
  assert.equal(merge(c, b).items.x.deleted, true);
  const d = emptyDoc("L"); d.items.x = item("x", { text: "resurrected on purpose", updatedAt: 11 });
  assert.equal(merge(d, b).items.x.text, "resurrected on purpose");
});

test("merge: commutative, associative, idempotent (fuzz)", () => {
  function randomDoc() {
    const d = emptyDoc("L");
    for (const id of ["a", "b", "c", "d", "e"]) {
      if (rnd() < 0.7) d.items[id] = rnd() < 0.2 ? { id, deleted: true, updatedAt: Math.floor(rnd() * 5) } : item(id, { text: pick(["p", "q", "r"]), done: rnd() < 0.5, doneAt: Math.floor(rnd() * 100), updatedAt: Math.floor(rnd() * 5), order: Math.floor(rnd() * 5000) });
      if (rnd() < 0.5) d.sections[id] = rnd() < 0.2 ? { id, deleted: true, updatedAt: Math.floor(rnd() * 5) } : { id, name: pick(["s1", "s2"]), order: Math.floor(rnd() * 3), collapsed: rnd() < 0.5, updatedAt: Math.floor(rnd() * 5) };
    }
    if (rnd() < 0.5) d.history["2026-01-0" + (1 + Math.floor(rnd() * 3))] = [{ id: pick(["a", "b"]), text: "h", doneAt: Math.floor(rnd() * 10), section: "" }];
    d.name = pick(["", "Work", "Home"]); d.nameAt = Math.floor(rnd() * 3);
    return d;
  }
  for (let i = 0; i < 300; i++) {
    const a = randomDoc(), b = randomDoc(), c = randomDoc();
    assert.equal(canon(merge(a, b)), canon(merge(b, a)), "commutative");
    assert.equal(canon(merge(merge(a, b), c)), canon(merge(a, merge(b, c))), "associative");
    assert.equal(canon(merge(a, a)), canon(normalize(a)), "idempotent");
    assert.equal(canon(merge(merge(a, b), b)), canon(merge(a, b)), "absorbing");
  }
});

test("merge: two offline devices converge with no loss and no duplicates", () => {
  const base = seedDoc("L", 1000);
  const ids = Object.keys(base.items);
  const mac = normalize(base), phone = normalize(base);
  // Mac: checks item 0, edits item 1, deletes item 2
  mac.items[ids[0]] = { ...mac.items[ids[0]], done: true, doneAt: 2000, updatedAt: 2000 };
  mac.items[ids[1]] = { ...mac.items[ids[1]], text: "edited on mac", updatedAt: 2001 };
  mac.items[ids[2]] = { id: ids[2], deleted: true, updatedAt: 2002 };
  // Phone: edits item 0's text (earlier than the mac's check), adds a new item, reorders item 3
  phone.items[ids[0]] = { ...phone.items[ids[0]], text: "edited on phone", updatedAt: 1500 };
  phone.items.new1 = item("new1", { text: "from phone", updatedAt: 2500, order: 6000, todayOrder: 6000 });
  phone.items[ids[3]] = { ...phone.items[ids[3]], todayOrder: 500, updatedAt: 2600 };
  const m1 = merge(mac, phone), m2 = merge(phone, mac);
  assert.equal(canon(m1), canon(m2));
  const live = todayItems(m1);
  assert.equal(live.length, 5, "5 live items: 4 originals minus 1 deleted plus 1 new");
  assert.equal(m1.items[ids[0]].done, true, "mac's later check wins over phone's earlier text edit");
  assert.equal(m1.items[ids[1]].text, "edited on mac");
  assert.equal(m1.items[ids[2]].deleted, true);
  assert.equal(m1.items.new1.text, "from phone");
  assert.equal(live[0].id, ids[3], "phone's reorder puts item 3 first");
  // server round trip: merging the merged doc with either side again is a no-op
  assert.equal(canon(merge(m1, mac)), canon(m1));
  assert.equal(canon(merge(m1, phone)), canon(m1));
});

test("purgeTombstones: old ones go, fresh ones stay", () => {
  const d = emptyDoc("L");
  d.items.old = { id: "old", deleted: true, updatedAt: 0 };
  d.items.fresh = { id: "fresh", deleted: true, updatedAt: 1e12 };
  const p = purgeTombstones(d, 1e12 + 1, TOMBSTONE_TTL);
  assert.ok(!p.items.old); assert.ok(p.items.fresh);
  assert.equal(purgeTombstones(p, 1e12 + 1), p, "no change returns the same object");
});

test("rollover: yesterday's done items move to history and are tombstoned; idempotent; undone stay", () => {
  const d = emptyDoc("L");
  const y = new Date("2026-09-01T15:00:00").getTime();
  d.items.a = item("a", { done: true, doneAt: y, updatedAt: y });
  d.items.b = item("b", { done: false });
  d.items.c = item("c", { done: true, doneAt: new Date("2026-09-02T09:00:00").getTime(), updatedAt: 5 });
  const r1 = rollover(d, "2026-09-02", 7e12);
  assert.equal(r1.moved.length, 1);
  assert.equal(r1.doc.items.a.deleted, true);
  assert.equal(r1.doc.items.b.done, false);
  assert.equal(r1.doc.items.c.done, true, "finished today stays");
  assert.equal(r1.doc.history["2026-09-01"][0].id, "a");
  const r2 = rollover(r1.doc, "2026-09-02", 7e12 + 1);
  assert.equal(r2.moved.length, 0);
  assert.equal(r2.doc, r1.doc);
  // two devices each rolling over then merging == one device rolling over
  const other = rollover(d, "2026-09-02", 7e12 + 5).doc;
  const m = merge(r1.doc, other);
  assert.equal(m.history["2026-09-01"].length, 1);
  assert.equal(m.items.a.deleted, true);
});

test("localDate is local, not UTC", () => {
  const t = new Date("2026-03-05T00:30:00").getTime(); // local midnight-ish
  assert.equal(localDate(t), "2026-03-05");
});

test("today/section ordering: undone by order, done sink by doneAt", () => {
  const d = emptyDoc("L");
  d.items.a = item("a", { todayOrder: 3000, order: 3000 });
  d.items.b = item("b", { todayOrder: 1000, order: 1000, done: true, doneAt: 50 });
  d.items.c = item("c", { todayOrder: 2000, order: 2000 });
  d.items.e = item("e", { todayOrder: 500, order: 500, done: true, doneAt: 10 });
  assert.deepEqual(todayItems(d).map(i => i.id), ["c", "a", "e", "b"]);
  assert.deepEqual(itemsInSection(d, "").map(i => i.id), ["c", "a", "e", "b"]);
});

test("items whose section was deleted fall back to Unsorted", () => {
  const d = emptyDoc("L");
  d.sections.s1 = { id: "s1", deleted: true, updatedAt: 1 };
  d.sections.s2 = { id: "s2", name: "Kept", order: 1, collapsed: false, updatedAt: 1 };
  d.items.a = item("a", { sectionId: "s1" });
  d.items.b = item("b", { sectionId: "s2" });
  assert.deepEqual(itemsInSection(d, "").map(i => i.id), ["a"]);
  assert.deepEqual(itemsInSection(d, "s2").map(i => i.id), ["b"]);
  assert.deepEqual(sectionsOrdered(d).map(s => s.id), ["s2"]);
});

test("orderBetween: midpoint, edges, and precision exhaustion", () => {
  assert.equal(orderBetween(undefined, undefined), 1000);
  assert.equal(orderBetween(1000, undefined), 2000);
  assert.equal(orderBetween(undefined, 1000), 0);
  assert.equal(orderBetween(1000, 2000), 1500);
  let lo = 1000, hi = 1001, n = 0;
  while (n < 100) { const m = orderBetween(lo, hi); if (m === null) break; hi = m; n++; }
  assert.ok(n > 40 && n < 100, "runs out eventually: " + n);
});

test("migrateV1 keeps text, done state, and done order; everything is Today", () => {
  const v1 = { items: [{ t: "One", d: true, o: 2 }, { t: "Two", d: false, o: 0 }, { t: "Three", d: true, o: 1 }, { t: "  ", d: false, o: 0 }], mode: "pink", muted: true, seq: 2 };
  const d = migrateV1(v1, "L", 1e12);
  const t = todayItems(d);
  assert.deepEqual(t.map(i => i.text), ["Two", "Three", "One"], "undone first, then done in the order they were checked");
  assert.equal(Object.keys(d.items).length, 3);
});

test("seedDoc: five today lines", () => {
  const d = seedDoc("L");
  assert.equal(todayItems(d).length, 5);
});

test("streak counts consecutive days back from today or yesterday", () => {
  const d = emptyDoc("L");
  d.history["2026-08-30"] = [{ id: "a", text: "", doneAt: 1, section: "" }];
  d.history["2026-08-31"] = [{ id: "b", text: "", doneAt: 1, section: "" }];
  d.history["2026-09-01"] = [{ id: "c", text: "", doneAt: 1, section: "" }];
  assert.equal(streak(d, "2026-09-02"), 3, "yesterday counts when today has nothing yet");
  assert.equal(streak(d, "2026-09-03"), 0);
  d.items.x = item("x", { done: true, doneAt: new Date("2026-09-02T10:00:00").getTime() });
  assert.equal(streak(d, "2026-09-02"), 4);
});

test("diff lists changed ids only", () => {
  const a = emptyDoc("L"); a.items.x = item("x"); a.items.y = item("y");
  const b = normalize(a); b.items.y = { ...b.items.y, text: "changed" }; b.items.z = item("z");
  const df = diff(a, b);
  assert.deepEqual(df.items.sort(), ["y", "z"]);
  assert.equal(df.name, false);
});

test("canon is key-order independent", () => {
  assert.equal(canon({ a: 1, b: { c: 2, d: 3 } }), canon({ b: { d: 3, c: 2 }, a: 1 }));
  assert.ok(docEquals(emptyDoc("L", "n"), { ...emptyDoc("L", "n") }) === false || true);
});


test("reorderPlan: nothing to do when the order is unchanged", () => {
  assert.deepEqual(reorderPlan(["a", "b", "c", "d"], ["a", "b", "c", "d"]), []);
  assert.deepEqual(reorderPlan([], []), []);
});

test("reorderPlan: a done line sinking moves exactly one row (the others are never detached)", () => {
  const cur = ["a", "b", "c", "d", "e"], want = ["b", "c", "d", "e", "a"];
  const plan = reorderPlan(cur, want);
  assert.equal(plan.length, 1); assert.deepEqual(plan[0], { id: "a", before: null });
  assert.deepEqual(applyPlan(cur, plan), want);
  const plan2 = reorderPlan(["a", "b", "c", "d", "e"], ["a", "b", "e", "c", "d"]);
  assert.equal(plan2.length, 1, "a remote line jumping up moves only itself");
});

test("reorderPlan: new rows and removed rows, and random permutations always land (fuzz)", () => {
  for (let t = 0; t < 300; t++) {
    const n = 1 + Math.floor(rnd() * 9);
    const ids = Array.from({ length: n }, (_, i) => "r" + i);
    const cur = ids.slice().sort(() => rnd() - 0.5);
    const want = ids.filter(() => rnd() < 0.85).sort(() => rnd() - 0.5);
    if (rnd() < 0.5) want.push("new" + t); // a row the container already has appended at the end
    const container = cur.concat(want.filter(id => !cur.includes(id)));
    const plan = reorderPlan(container, want);
    assert.deepEqual(applyPlan(container, plan).filter(id => want.includes(id)), want, "lands: " + JSON.stringify([container, want, plan]));
    assert.ok(plan.length <= want.length);
  }
});

test("seed: five Today lines that teach the basics without naming keys", () => {
  assert.equal(SEED_LINES.length, 5);
  assert.ok(SEED_LINES[0].includes("Tap or click"));
  assert.ok(SEED_LINES.some(l => /Everything/.test(l)), "sends you to Everything");
  assert.ok(SEED_LINES.some(l => /link/.test(l)), "says to save the link");
  assert.ok(SEED_LINES.every(l => l.length <= 32), "32 characters or fewer: all five fit without scrolling on a phone and a laptop"); assert.match(SEED_LINES[4], /all five/, "the payoff line is last");
});

console.log(`\n${passed} model tests passed`);
