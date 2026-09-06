// tools/merge-fixtures.js — the merge fixtures (1.9): language-neutral golden cases for merge, normalize and rollover, so
// another implementation of the document (the Swift core that comes next) can prove it agrees with this one byte for
// byte. Run: node tools/merge-fixtures.js   — writes test/fixtures/merge/*.json; test/compat.test.js replays them.
// Every case names its inputs in full (no clock, no random id, no device zone: `today` and `ts` are given), and
// `expect` is what model.js produced when the file was written, as canonical JSON (keys sorted). A case that stops
// replaying means the document's behaviour changed, which COMPATIBILITY.md §3 says it must not, except additively.
import fs from "node:fs";
import path from "node:path";
import * as M from "../model.js";

const OUT = path.resolve("test/fixtures/merge");
fs.mkdirSync(OUT, { recursive: true });
const sorted = v => JSON.parse(M.canon(v));
const item = (id, over = {}) => ({ id, sectionId: "", text: "t-" + id, note: "", done: false, doneAt: 0, today: true, order: 1000, todayOrder: 1000, updatedAt: 1000, ...over });
const base = (id = "L", over = {}) => ({ ...M.emptyDoc(id), nameAt: 0, updatedAt: 0, ...over }); // emptyDoc stamps the clock: pinned
const files = [];
function file(name, op, note, cases) {
  const fx = { name, op, note, cases: cases.map(c => sorted(c)) };
  fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(fx, null, 2) + "\n");
  files.push(name + " (" + cases.length + ")");
}
const both = (name, a, b) => [{ name: name + " (a, b)", a, b, expect: M.merge(a, b) }, { name: name + " (b, a)", a: b, b: a, expect: M.merge(b, a) }];
// Every rollover case records the device zone it was written in. It changes nothing for a list with a
// home zone — that is the point of one — but a list without one rolls on the device's own clock, so
// `dayOf` is the machine's, and an expectation written in Chicago is not the one Kiritimati produces.
// A replay that can compute in a named zone (the Swift core) uses it; one that cannot (this file, run
// under Node) skips a case that was not written in its own zone and says so.
const DEVICE_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const roll = (name, doc, today, ts) => ({ name, doc, today, ts, deviceZone: DEVICE_ZONE, expect: M.rollover(M.normalize(doc, doc.id), today, ts).doc });

/* ---- merge: records ---- */
{
  const a = base(), b = base();
  a.items.x = item("x", { text: "old", updatedAt: 10 }); b.items.x = item("x", { text: "new", updatedAt: 20 });
  a.items.t = item("t", { updatedAt: 10 }); b.items.t = { id: "t", deleted: true, updatedAt: 10 };                       // a tombstone wins a tie
  a.items.r = { ...item("r", { updatedAt: 1 }), extra: [1, 2] }; b.items.r = item("r", { updatedAt: 1 });                // the record that carries more wins a tie
  a.items.l = item("l", { text: "abc", updatedAt: 3 }); b.items.l = item("l", { text: "abd", updatedAt: 3 });            // then the lexically larger
  a.sections.s = { id: "s", name: "Home", order: 1000, collapsed: false, updatedAt: 5, colour: "red" };                  // an unknown field on a record
  a.history["2026-09-01"] = [{ id: "h1", text: "one", doneAt: 100, section: "" }]; b.history["2026-09-01"] = [{ id: "h2", text: "two", doneAt: 50, section: "" }, { id: "h1", text: "one", doneAt: 100, section: "" }];
  a.name = "Work"; a.nameAt = 5; b.name = "Home"; b.nameAt = 7;                                                           // the name by nameAt
  a.someFutureCollection = { k: { id: "k", updatedAt: 9 } }; b.flag = true;                                             // unknown top-level keys pass through
  a.themes.t1 = { id: "t1", name: "Mine", code: "T2:d:FF3D9A:fraunces:bell:Mine", updatedAt: 1, partner: "t2" }; b.themes.t1 = { id: "t1", name: "Mine", code: "T2:d:FF3D9A:fraunces:bell:Mine", updatedAt: 1 };
  a.rules.x = { id: "x", kind: "daily", text: "old", note: "", sectionId: "", updatedAt: 2 }; b.returns.x = { id: "x", on: "2026-09-02", updatedAt: 2 };
  file("merge-records", "merge", "last writer wins per record; on a tie a tombstone, then the record that carries more, then the lexically larger; history unions per day by id; the name by nameAt; unknown fields, records and collections pass through; the result is the same whichever side merges", [
    ...both("records", a, b),
    { name: "idempotent", a: M.merge(a, b), b, expect: M.merge(M.merge(a, b), b) },
    { name: "empty right", a, b: base(), expect: M.merge(a, base()) }
  ]);
}

/* ---- merge: the home zone (1.9) ---- */
{
  const z = base("L", { zone: "America/Chicago" }), n = base(), t = base("L", { zone: "Asia/Tokyo" });
  z.items.a = item("a"); n.items.a = item("a"); t.items.a = item("a");
  file("merge-zone", "merge", "the home zone is an additive top-level key: one side's value is kept; two different values merge by the larger string, the rule every client applies to a key it does not know, so 1.8 and 1.9 agree", [
    ...both("one side has it", z, n), ...both("two different zones", z, t), ...both("the same zone", z, base("L", { zone: "America/Chicago" }))
  ]);
}

/* ---- normalize ---- */
{
  file("normalize", "normalize", "junk in, a well-formed document out: unknown fields and collections kept, the zone kept as written whether or not the platform knows it, a bare tombstone bare, a v2-stamped document accepted", [
    { name: "junk", id: "L", doc: { items: [{ id: "a", text: 5, done: "yes" }, null, { id: "b", deleted: true, updatedAt: 3 }], history: { "2026-01-01": [{ id: "x", doneAt: 1 }, { id: "x" }, 7], junk: [] } }, expect: M.normalize({ items: [{ id: "a", text: 5, done: "yes" }, null, { id: "b", deleted: true, updatedAt: 3 }], history: { "2026-01-01": [{ id: "x", doneAt: 1 }, { id: "x" }, 7], junk: [] } }, "L") },
    { name: "zone kept as written", id: "L", doc: { v: 2, zone: "Mars/Olympus", items: { a: { ...item("a"), future: { flag: true } } }, mystery: { k: { id: "k", updatedAt: 9 } } }, expect: M.normalize({ v: 2, zone: "Mars/Olympus", items: { a: { ...item("a"), future: { flag: true } } }, mystery: { k: { id: "k", updatedAt: 9 } } }, "L") },
    { name: "no zone means none", id: "L", doc: { items: { a: item("a") }, zone: "" }, expect: M.normalize({ items: { a: item("a") }, zone: "" }, "L") }
  ]);
}

/* ---- rollover: the home zone and the guard (1.9) ---- */
{
  // Chicago crosses a line off at breakfast (08:30 Chicago, 13:30 UTC, 2026-09-05); two hours later Tokyo is on the 6th; Chicago's midnight comes at 05:00 UTC
  const doneAt = Date.UTC(2026, 8, 5, 13, 30), later = Date.UTC(2026, 8, 5, 15, 30), nextDay = Date.UTC(2026, 8, 6, 6, 0);
  const mk = zone => { const d = base("L", zone ? { zone } : {}); d.items.a = item("a", { text: "crossed off at breakfast", done: true, doneAt, updatedAt: doneAt }); d.items.b = item("b", { text: "still to do" }); return d; };
  file("rollover-zone", "rollover", "with a home zone every device passes the same today (computed in that zone) and files a line under the day it was finished there: nothing moves while it is still the 5th at home, and after home midnight both devices write the identical tombstone and History entry", [
    roll("still the 5th at home (Tokyo's clock says the 6th)", mk("America/Chicago"), "2026-09-05", later),
    roll("after Chicago's midnight", mk("America/Chicago"), "2026-09-06", nextDay),
    roll("the same call from the other device", mk("America/Chicago"), "2026-09-06", nextDay + 3600000),
    roll("rolled twice changes nothing", M.rollover(M.normalize(mk("America/Chicago"), "L"), "2026-09-06", nextDay).doc, "2026-09-06", nextDay + 60000)
  ]);
  file("rollover-guard", "rollover", "without a home zone a device rolls on its own clock, behind the guard: a line finished under six hours ago is never rolled, whatever today the device passes; past six hours it is, as 1.8 did", [
    roll("two hours old, Tokyo already on the 6th: held", mk(""), "2026-09-06", later),
    roll("still the 5th here: nothing", mk(""), "2026-09-05", later),
    roll("past six hours: rolled", mk(""), "2026-09-06", doneAt + M.ROLL_GUARD_MS + 60000)
  ]);
}

/* ---- rollover: repeats, not today, revival ---- */
{
  const T0 = Date.UTC(2026, 8, 1, 20, 0); // 2026-09-01, afternoon everywhere the app runs
  const daily = base("L", { zone: "UTC" }); daily.items.a = item("a", { text: "Stretch", done: true, doneAt: T0, updatedAt: T0 }); daily.rules.a = { id: "a", kind: "daily", text: "Stretch", note: "", sectionId: "", updatedAt: 100 };
  const weekly = base("L", { zone: "UTC" }); weekly.items.a = item("a", { done: true, doneAt: T0, updatedAt: T0 }); weekly.rules.a = { id: "a", kind: "weekly", days: [1, 4], text: "t-a", note: "", sectionId: "", updatedAt: 100, placed: "2026-09-01" }; // Tuesday the 1st: not due until Thursday
  const plain = base("L", { zone: "UTC" }); plain.items.a = item("a", { done: true, doneAt: T0, updatedAt: T0 }); plain.items.b = item("b");
  const ret = base("L", { zone: "UTC" }); ret.items.a = item("a", { today: false, todayOrder: 3000, updatedAt: 500 }); ret.returns.a = { id: "a", on: "2026-09-02", updatedAt: 500 };
  const revive = base("L", { zone: "UTC" }); revive.items.c = { id: "c", deleted: true, updatedAt: T0 + 1 }; revive.history["2026-09-01"] = [{ id: "c", text: "Call Bob", doneAt: T0, section: "" }]; revive.rules.c = { id: "c", kind: "daily", text: "Call Bob", note: "", sectionId: "", updatedAt: 100 };
  file("rollover-records", "rollover", "a finished daily line goes to History and resets undone on Today at +2; a finished weekly line resets off Today until its day; a plain finished line tombstones at +1; a return whose day has come puts its line back at +1 and retires; a live rule whose line a v3 rollover tombstoned (one or two ms above its History entry) is revived", [
    roll("daily reset", daily, "2026-09-02", T0 + 86400000),
    roll("weekly, not due on Wednesday", weekly, "2026-09-02", T0 + 86400000),
    roll("weekly, due on Thursday", M.rollover(M.normalize(weekly, "L"), "2026-09-02", T0 + 86400000).doc, "2026-09-03", T0 + 2 * 86400000),
    roll("plain tombstone", plain, "2026-09-02", T0 + 86400000),
    roll("a return comes due", ret, "2026-09-02", T0 + 86400000),
    roll("revival after a v3 rollover", revive, "2026-09-02", T0 + 86400000)
  ]);
}

console.log("wrote " + files.join(", ") + " to " + OUT);
