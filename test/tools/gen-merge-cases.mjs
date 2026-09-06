// test/tools/gen-merge-cases.mjs — the differential fixture: a few thousand random cases, run through
// model.js, with the web's answers written down as canonical JSON. The Swift core replays every one
// and compares strings; a mismatch is a bug in the port until proven otherwise.
//
// Run: TZ=America/Chicago node test/tools/gen-merge-cases.mjs   (the zone is pinned: rollover and the
// streak are functions of the local calendar, and the Swift side is told which zone to use.)
//
// The generator is deliberately adversarial about the things a port gets almost right:
//   * ties on updatedAt, so the tie-break (tombstone, then longer canonical JSON, then lexically
//     larger) decides — measured in UTF-16 code units, which is not what Swift counts by default;
//   * text that truncates in the middle of a surrogate pair, so normalize() leaves half an emoji;
//   * accents both precomposed and decomposed, which Swift's String comparison calls equal;
//   * unknown fields on records, unknown collections, unknown top-level keys (COMPATIBILITY.md §3);
//   * fractional and very large order values, so the number formatting shows;
//   * two recurring lines in one section revived together, where the answer depends on the order
//     Object.keys hands back.
import crypto from "node:crypto";
import zlib from "node:zlib";
import fs from "node:fs";
import * as M from "../../model.js";

const MERGE_CASES = Number(process.env.MERGE_CASES || 1200);
const SEQ_CASES = Number(process.env.SEQ_CASES || 900);
const TZ = process.env.TZ || "America/Chicago";
// The inputs are written out in full; the answers are digested, because a fixture with five copies of
// every document in it runs to ninety megabytes and nobody clones that. The first DETAILED cases keep
// their answers verbatim so the ordinary failure is diagnosed where it is read, and
// `node test/tools/gen-merge-cases.mjs --explain merge 417` prints any case's expected canon in full.
const DETAILED = Number(process.env.DETAILED || 120);
const digest = s => s.length + ":" + crypto.createHash("sha256").update(s, "utf8").digest("hex").slice(0, 32);
const answer = (s, detailed) => detailed ? { canon: s, d: digest(s) } : { d: digest(s) };

/* ---------------- a seeded PRNG, so the fixture is the same every run ---------------- */
let seed = 20260906;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const chance = p => rnd() < p;
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

/* ---------------- the awkward strings ---------------- */

const EMOJI = "\u{1F600}";
const LONE = "\uD83D";                       // half a surrogate pair, which JavaScript keeps
const SHORT_TEXTS = [
  "", "a", "Call the bank", "Walk the dog", "café", "café",      // precomposed, then decomposed
  "日本語のテキスト", "Line with " + EMOJI + " an emoji", LONE + "lone lead",
  " leading and trailing ", "tab\there", "quote \" and \\ backslash", " nbsp"
];
// The long ones matter — they are what normalize() truncates, and the 200th code unit of the first is
// half an emoji — but one item in six being four hundred characters makes the fixture unclonable, so
// they turn up about one time in fifteen instead.
const LONG_TEXTS = ["x".repeat(199) + EMOJI, "y".repeat(201), "z".repeat(400)];
const text = () => chance(0.07) ? pick(LONG_TEXTS) : pick(SHORT_TEXTS);
const note = () => chance(0.05) ? "w".repeat(299) + EMOJI : pick(["", "n", "a note", "note\nwith\nnewlines", "note " + LONE]);
const IDS = ["a", "b", "c", "d", "e", "0", "10", "2", "zz", "Ab"];
const SECTIONS = ["", "s1", "s2", "gone"];
const STAMPS = [0, 1, 2, 1000, 1000, 1000, 2000, 5000, 1725000000000, 1725000000001];
const ORDERS = [0, 1, 1000, 1000.5, 1250.25, -500, 1e20, 1e21, 1e-7, 0.1, 3000];
const DAYS = ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-07", "2026-09-14", "2026-02-28", "2026-12-31"];
const KINDS = ["daily", "weekdays", "weekly", "monthly"];

function futureField() {
  return pick([
    { extra: [1, 2] },
    { future: { flag: true } },
    { colour: "red" },
    { weight: 1000.5 },
    { emoji: EMOJI },
    {}
  ]);
}

function randomItem(id) {
  if (chance(0.18)) {
    const t = { id, deleted: true, updatedAt: pick(STAMPS), ...futureField() };
    if (chance(0.5)) { t.text = text(); t.note = note(); t.sectionId = pick(SECTIONS); }
    return t;
  }
  const done = chance(0.35);
  return {
    id, sectionId: pick(SECTIONS), text: text(), note: note(),
    done, doneAt: done ? pick([0, 1, 1725000000000, new Date("2026-09-01T15:00:00").getTime(), new Date("2026-09-02T09:00:00").getTime()]) : 0,
    today: chance(0.5), order: pick(ORDERS), todayOrder: pick(ORDERS), updatedAt: pick(STAMPS),
    ...futureField()
  };
}

function randomSection(id) {
  if (chance(0.2)) return { id, deleted: true, updatedAt: pick(STAMPS), ...futureField() };
  return { id, name: pick(["", "Work", "Home", "café", "z".repeat(70)]), order: pick(ORDERS), collapsed: chance(0.5), updatedAt: pick(STAMPS), ...futureField() };
}

function randomRule(id) {
  if (chance(0.15)) return { id, deleted: true, updatedAt: pick(STAMPS) };
  const kind = pick(KINDS);
  const r = { id, kind, text: text(), note: note(), sectionId: pick(SECTIONS), updatedAt: pick(STAMPS), ...futureField() };
  if (kind === "weekly") r.days = Array.from({ length: int(0, 4) }, () => int(-1, 7));
  if (kind === "monthly") r.day = pick([1, 15, 28, 31, 40, 0, -3, 15.7]);
  if (chance(0.5)) r.placed = pick(DAYS);
  return r;
}

function randomReturn(id) {
  if (chance(0.2)) return { id, deleted: true, updatedAt: pick(STAMPS) };
  return { id, on: pick(DAYS.concat(["nope"])), updatedAt: pick(STAMPS) };
}

function randomTemplate(id) {
  if (chance(0.2)) return { id, deleted: true, updatedAt: pick(STAMPS) };
  return {
    id, name: pick(["", "Morning", "  padded  ", "n".repeat(50)]),
    lines: Array.from({ length: int(0, 4) }, () => chance(0.15) ? null : { text: text(), note: note() }),
    updatedAt: pick(STAMPS)
  };
}

function randomDoc(id = "L") {
  const d = { v: 3, id, name: pick(["", "Work", "Home", "café", "café"]), nameAt: pick(STAMPS),
    sections: {}, items: {}, history: {}, themes: {}, rules: {}, returns: {}, templates: {}, updatedAt: pick(STAMPS) };
  for (const iid of IDS) if (chance(0.55)) d.items[iid] = randomItem(iid);
  for (const sid of ["s1", "s2"]) if (chance(0.6)) d.sections[sid] = randomSection(sid);
  for (const tid of ["t1", "t2"]) if (chance(0.4)) d.themes[tid] = { id: tid, name: pick(["Mine", ""]), code: pick(["T1:d:FF3D9A:fraunces:Mine", ""]), updatedAt: pick(STAMPS), ...futureField() };
  for (const iid of IDS) if (chance(0.25)) d.rules[iid] = randomRule(iid);
  for (const iid of IDS) if (chance(0.2)) d.returns[iid] = randomReturn(iid);
  for (const tid of ["tp1", "tp2"]) if (chance(0.3)) d.templates[tid] = randomTemplate(tid);
  for (const day of DAYS) if (chance(0.3)) {
    d.history[day] = Array.from({ length: int(1, 3) }, () => ({ id: pick(IDS), text: text(), doneAt: pick(STAMPS), section: pick(["", "Work"]) }));
  }
  if (chance(0.15)) d.history["not-a-day"] = [{ id: "x", text: "x", doneAt: 1, section: "" }];
  if (chance(0.2)) d.someFutureCollection = { x: { id: "x", updatedAt: pick(STAMPS) } };
  if (chance(0.15)) d.futureFlag = pick([true, false, 1, "yes", null]);
  if (chance(0.1)) d.items = Object.values(d.items);          // the array shape normalize also accepts
  return d;
}

/* ---------------- merge cases ---------------- */

const mergeCases = [];
for (let i = 0; i < MERGE_CASES; i++) {
  const a = randomDoc(), b = randomDoc();
  const detailed = i < DETAILED;
  mergeCases.push({
    a, b,
    normalizeA: answer(M.canon(M.normalize(a)), detailed),
    normalizeB: answer(M.canon(M.normalize(b, "OtherId")), detailed),
    mergeAB: answer(M.canon(M.merge(a, b)), detailed),
    mergeBA: answer(M.canon(M.merge(b, a)), detailed),
    mergeAA: answer(M.canon(M.merge(a, a)), detailed),
    purgeA: answer(M.canon(M.purgeTombstones(M.normalize(a), 1735000000000, M.TOMBSTONE_TTL)), detailed),
    diffAB: M.diff(M.normalize(a), M.normalize(b))
  });
}

/* ---------------- operation sequences ---------------- */

const OPS = ["rollover", "purge", "setRule", "clearRule", "refreshRuleSnapshot", "notToday", "backToday",
  "tombstoneItem", "restoreItem", "templateFromSection", "insertTemplate", "deleteTemplate",
  "setSectionToday", "moveItem", "editText", "check", "uncheck", "setToday", "deleteSection",
  "addItem", "mergeWith"];

function randomOp(n) {
  const op = pick(OPS);
  const ts = pick([1, 500, 3000, 1725000000000, 1725000086400000]) + n;
  switch (op) {
    case "rollover": return { op, today: pick(DAYS), ts };
    case "purge": return { op, now: pick([1725000000000, 1735000000000, 1e12]), ttl: M.TOMBSTONE_TTL };
    case "setRule": {
      const kind = pick(KINDS);
      const rule = { kind };
      if (kind === "weekly") rule.days = Array.from({ length: int(0, 3) }, () => int(0, 6));
      if (kind === "monthly") rule.day = pick([1, 15, 31, 40]);
      return { op: "setRule", id: pick(IDS), rule, ts, today: pick(DAYS) };
    }
    case "clearRule": return { op: "setRule", id: pick(IDS), rule: null, ts, today: pick(DAYS) };
    case "refreshRuleSnapshot": return { op, id: pick(IDS), ts };
    case "notToday": return { op, id: pick(IDS), today: pick(DAYS), ts };
    case "backToday": return { op, id: pick(IDS), ts };
    case "tombstoneItem": return { op, id: pick(IDS), ts };
    case "restoreItem": return { op, id: pick(IDS), ts };
    case "templateFromSection": return { op, sectionId: pick(SECTIONS), name: pick(["", "  Morning  ", "T"]), id: "tpl" + n, ts };
    case "insertTemplate": return { op, tplId: pick(["tp1", "tp2", "tpl3"]), sectionId: pick(SECTIONS), today: chance(0.5), ts, idPrefix: "ins" + n + "_" };
    case "deleteTemplate": return { op, id: pick(["tp1", "tp2"]), ts };
    case "setSectionToday": return { op, sectionId: pick(SECTIONS), on: chance(0.5), ts };
    case "moveItem": return { op, id: pick(IDS), ts, newId: "mv" + n };
    case "editText": return { op, id: pick(IDS), text: text(), ts };
    case "check": return { op, id: pick(IDS), doneAt: pick([new Date("2026-09-01T15:00:00").getTime(), new Date("2026-09-02T09:00:00").getTime(), 1725000000000]), ts };
    case "uncheck": return { op, id: pick(IDS), ts };
    case "setToday": return { op, id: pick(IDS), on: chance(0.5), ts };
    case "deleteSection": return { op, id: pick(["s1", "s2"]), ts };
    case "addItem": return { op, id: "new" + n, text: text(), sectionId: pick(SECTIONS), today: chance(0.5), order: pick(ORDERS), ts };
    case "mergeWith": return { op, doc: randomDoc() };
    default: return { op: "rollover", today: pick(DAYS), ts };
  }
}

/** Apply one op. `state` is { doc, dst }; both are normalized documents. */
function apply(state, o) {
  let { doc, dst } = state;
  switch (o.op) {
    case "rollover": doc = M.rollover(doc, o.today, o.ts).doc; break;
    case "purge": doc = M.purgeTombstones(doc, o.now, o.ttl); break;
    case "setRule": doc = M.setRule(doc, o.id, o.rule, o.ts, o.today); break;
    case "refreshRuleSnapshot": doc = M.refreshRuleSnapshot(doc, o.id, o.ts); break;
    case "notToday": doc = M.notToday(doc, o.id, o.today, o.ts); break;
    case "backToday": doc = M.backToday(doc, o.id, o.ts); break;
    case "tombstoneItem": {
      const it = doc.items[o.id];
      if (it && !it.deleted) doc = { ...doc, items: { ...doc.items, [o.id]: M.tombstone(it, o.ts) }, updatedAt: Math.max(doc.updatedAt, o.ts) };
      break;
    }
    case "restoreItem": doc = M.restoreItem(doc, o.id, o.ts); break;
    case "templateFromSection": doc = M.templateFromSection(doc, o.sectionId, o.name, o.id, o.ts); break;
    case "insertTemplate": {
      const tpl = doc.templates && doc.templates[o.tplId];
      if (tpl && !tpl.deleted) { let k = 0; doc = M.insertTemplate(doc, tpl, o.sectionId, { today: o.today }, o.ts, () => o.idPrefix + (++k)).doc; }
      break;
    }
    case "deleteTemplate": doc = M.deleteTemplate(doc, o.id, o.ts); break;
    case "setSectionToday": doc = M.setSectionToday(doc, o.sectionId, o.on, o.ts); break;
    case "moveItem": {
      const r = M.moveItem(doc, dst, o.id, o.ts, () => o.newId);
      if (r) { doc = r.src; dst = r.dst; }
      break;
    }
    case "editText": {
      const it = doc.items[o.id];
      if (it && !it.deleted) doc = { ...doc, items: { ...doc.items, [o.id]: { ...it, text: o.text, updatedAt: o.ts } } };
      break;
    }
    case "check": {
      const it = doc.items[o.id];
      if (it && !it.deleted) doc = { ...doc, items: { ...doc.items, [o.id]: { ...it, done: true, doneAt: o.doneAt, updatedAt: o.ts } } };
      break;
    }
    case "uncheck": {
      const it = doc.items[o.id];
      if (it && !it.deleted) doc = { ...doc, items: { ...doc.items, [o.id]: { ...it, done: false, doneAt: 0, updatedAt: o.ts } } };
      break;
    }
    case "setToday": {
      const it = doc.items[o.id];
      if (it && !it.deleted) doc = { ...doc, items: { ...doc.items, [o.id]: { ...it, today: o.on, updatedAt: o.ts } } };
      break;
    }
    case "deleteSection":
      doc = { ...doc, sections: { ...doc.sections, [o.id]: { id: o.id, deleted: true, updatedAt: o.ts } } };
      break;
    case "addItem":
      doc = { ...doc, items: { ...doc.items, [o.id]: { id: o.id, sectionId: o.sectionId, text: o.text, note: "", done: false, doneAt: 0, today: o.today, order: o.order, todayOrder: o.order, updatedAt: o.ts } } };
      break;
    case "mergeWith": doc = M.merge(doc, o.doc); break;
  }
  return { doc, dst };
}

function queries(doc, today) {
  return {
    today: M.todayItems(doc).map(i => i.id),
    unsorted: M.itemsInSection(doc, "").map(i => i.id),
    s1: M.itemsInSection(doc, "s1").map(i => i.id),
    sections: M.sectionsOrdered(doc).map(s => s.id),
    recentlyDeleted: M.recentlyDeleted(doc).map(i => i.id),
    historyDays: M.historyDays(doc),
    templates: M.liveTemplates(doc).map(t => t.id),
    streak: M.streak(doc, today),
    exportJSON: M.exportJSON(doc, { at: 123 }),
    exportMarkdown: M.exportMarkdown(doc, { today })
  };
}

const sequenceCases = [];
for (let i = 0; i < SEQ_CASES; i++) {
  const detailed = i < DETAILED;
  const start = randomDoc("Start" + i);
  const startDst = randomDoc("Dst" + i);
  let state = { doc: M.normalize(start, "Start" + i), dst: M.normalize(startDst, "Dst" + i) };
  const ops = [];
  const steps = [];
  const n = int(1, 8);
  for (let k = 0; k < n; k++) {
    const o = randomOp(i * 100 + k);
    ops.push(o);
    state = apply(state, o);
    steps.push({ doc: answer(M.canon(state.doc), detailed), dst: answer(M.canon(state.dst), detailed) });
  }
  const today = pick(DAYS);
  const q = queries(state.doc, today);
  sequenceCases.push({
    start, startDst, id: "Start" + i, dstId: "Dst" + i, ops, steps, today,
    queries: { ...q, exportJSON: answer(q.exportJSON, detailed), exportMarkdown: answer(q.exportMarkdown, detailed) }
  });
}

/* ---------------- the revival collision, on purpose ---------------- */

// two daily lines in one section, both tombstoned by a v3 rollover: which order they are revived in
// decides their `order`, and that order is Object.keys's.
const revivalCases = [];
for (const ids of [["a", "b"], ["b", "a"], ["10", "2"], ["2", "10"], ["a", "10"]]) {
  const T0 = new Date("2026-09-01T15:00:00").getTime();
  const d = M.emptyDoc("Revival", "");
  d.updatedAt = T0;
  d.history["2026-09-01"] = ids.map((id, k) => ({ id, text: "Line " + id, doneAt: T0 + k, section: "" }));
  for (const [k, id] of ids.entries()) {
    d.items[id] = { id, deleted: true, updatedAt: T0 + k + 1 };            // a bare v3 tombstone, +1
    d.rules[id] = { id, kind: "daily", text: "Line " + id, note: "", sectionId: "s1", updatedAt: 1000 };
  }
  d.items.keep = { id: "keep", sectionId: "s1", text: "Still here", note: "", done: false, doneAt: 0, today: true, order: 4000, todayOrder: 4000, updatedAt: 1 };
  d.sections.s1 = { id: "s1", name: "S", order: 1000, collapsed: false, updatedAt: 1 };
  const normalized = M.normalize(d, "Revival");
  revivalCases.push({ ids, doc: d, today: "2026-09-02", ts: T0 + 86400000, rolled: answer(M.canon(M.rollover(normalized, "2026-09-02", T0 + 86400000).doc), true) });
}

/* ---------------- --explain: one case, in full ---------------- */

const explainAt = process.argv.indexOf("--explain");
if (explainAt >= 0) {
  const kind = process.argv[explainAt + 1], idx = Number(process.argv[explainAt + 2]);
  if (kind === "merge") {
    const a = mergeCases[idx].a, b = mergeCases[idx].b;
    console.log("a          " + JSON.stringify(a));
    console.log("b          " + JSON.stringify(b));
    console.log("normalizeA " + M.canon(M.normalize(a)));
    console.log("mergeAB    " + M.canon(M.merge(a, b)));
    console.log("mergeBA    " + M.canon(M.merge(b, a)));
  } else if (kind === "sequence") {
    const c = sequenceCases[idx];
    let st = { doc: M.normalize(c.start, c.id), dst: M.normalize(c.startDst, c.dstId) };
    console.log("start " + JSON.stringify(c.start));
    for (const [k, o] of c.ops.entries()) {
      st = apply(st, o);
      console.log(`step ${k} ${JSON.stringify(o)}`);
      console.log("  doc " + M.canon(st.doc));
      console.log("  dst " + M.canon(st.dst));
    }
  } else {
    console.error("--explain merge|sequence <index>");
  }
  process.exit(0);
}

/* ---------------- write ---------------- */

const out = {
  note: "Generated by test/tools/gen-merge-cases.mjs. The web's answers, as canonical JSON, for the Swift core to replay. Regenerate with the same TZ.",
  timezone: TZ,
  mergeCases,
  sequenceCases,
  revivalCases
};
// Written raw-deflated: twenty-odd megabytes of documents is not a thing to put in a repository, and
// raw DEFLATE is a format both sides already speak (crypto.js's envelope, Compression on the Swift
// side), so reading it needs no new code and exercises the path a little more. `--raw` also writes the
// plain JSON beside it, for reading.
const json = JSON.stringify(out) + "\n";
const path = new URL("../fixtures/merge-cases.json.deflate", import.meta.url);
fs.writeFileSync(path, zlib.deflateRawSync(Buffer.from(json, "utf8"), { level: 9 }));
if (process.argv.includes("--raw")) fs.writeFileSync(new URL("../fixtures/merge-cases.json", import.meta.url), json);
const bytes = fs.statSync(path).size;
console.log(`wrote test/fixtures/merge-cases.json.deflate (${(bytes / 1048576).toFixed(1)} MB deflated, ${(json.length / 1048576).toFixed(1)} MB raw) in ${TZ}`);
console.log(`  ${mergeCases.length} merge cases, ${sequenceCases.length} sequences (${sequenceCases.reduce((n, c) => n + c.ops.length, 0)} operations), ${revivalCases.length} revival collisions`);
console.log(`  the first ${DETAILED} of each keep their answers verbatim; the rest are digested. Diagnose one with --explain merge|sequence <index>.`);
