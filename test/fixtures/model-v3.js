// FROZEN COPY of model.js as shipped in v3 (commit 3556158). Never edit. test/compat.test.js runs v4 documents
// through it to prove an old client drops nothing an old client can see, and that a v4 client recovers the rest.
// model.js — the list document: ids, shape, merge, rollover, ordering.
// Pure functions only. No DOM, no storage. Tested in Node (test/model.test.js).

export const DOC_VERSION = 2;
export const TEXT_MAX = 200;
export const NOTE_MAX = 300;
export const TOMBSTONE_TTL = 30 * 24 * 3600 * 1000;
const ORDER_STEP = 1000;

const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/* ---------------- ids ---------------- */

function randomBytes(n) {
  const c = globalThis.crypto;
  if (!c || !c.getRandomValues) throw new Error("crypto.getRandomValues unavailable");
  const b = new Uint8Array(n);
  c.getRandomValues(b);
  return b;
}

/** Unbiased base62 string of `len` chars (rejection sampling). 22 chars ≈ 131 bits. */
export function newId(len = 22) {
  let out = "";
  while (out.length < len) {
    const bytes = randomBytes(len * 2);
    for (let i = 0; i < bytes.length && out.length < len; i++) {
      const v = bytes[i];
      if (v < 248) out += B62[v % 62]; // 248 = 4 × 62, keeps every symbol equally likely
    }
  }
  return out;
}

export function shortId() { return newId(10); }

export function isListId(s) { return typeof s === "string" && /^[0-9A-Za-z]{22,64}$/.test(s); }

export function now() { return Date.now(); }

/* ---------------- dates ---------------- */

/** Local calendar date as YYYY-MM-DD. */
export function localDate(ts = Date.now()) {
  const d = new Date(ts);
  const m = d.getMonth() + 1, day = d.getDate();
  return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
}

/* ---------------- shape ---------------- */

export function emptyDoc(id, name = "") {
  const t = now();
  return { v: DOC_VERSION, id, name, nameAt: t, sections: {}, items: {}, history: {}, themes: {}, updatedAt: t };
}

/** Coerce whatever came out of storage into a well-formed doc. Never throws on junk. */
export function normalize(doc, id) {
  const d = (doc && typeof doc === "object") ? doc : {};
  const out = emptyDoc(id || d.id || "", typeof d.name === "string" ? d.name : "");
  out.nameAt = num(d.nameAt, 0);
  out.updatedAt = num(d.updatedAt, 0);
  out.sections = mapOf(d.sections, normSection);
  out.items = mapOf(d.items, normItem);
  out.themes = mapOf(d.themes, normTheme);
  out.history = {};
  if (d.history && typeof d.history === "object") {
    for (const day of Object.keys(d.history)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Array.isArray(d.history[day])) continue;
      const seen = new Set(), list = [];
      for (const e of d.history[day]) {
        if (!e || typeof e !== "object" || typeof e.id !== "string" || seen.has(e.id)) continue;
        seen.add(e.id);
        list.push({ id: e.id, text: str(e.text, TEXT_MAX), doneAt: num(e.doneAt, 0), section: str(e.section, 60) });
      }
      list.sort((a, b) => a.doneAt - b.doneAt || cmp(a.id, b.id));
      if (list.length) out.history[day] = list;
    }
  }
  return out;
}

function num(v, dflt) { return (typeof v === "number" && isFinite(v)) ? v : dflt; }
function str(v, max) { return typeof v === "string" ? v.slice(0, max) : ""; }
function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }

function mapOf(src, norm) {
  const out = {};
  if (Array.isArray(src)) { for (const r of src) { const n = norm(r); if (n) out[n.id] = n; } }
  else if (src && typeof src === "object") {
    for (const k of Object.keys(src)) { const n = norm(src[k], k); if (n) out[n.id] = n; }
  }
  return out;
}

function normItem(r, key) {
  if (!r || typeof r !== "object") return null;
  const id = typeof r.id === "string" ? r.id : key;
  if (!id) return null;
  if (r.deleted) return { id, deleted: true, updatedAt: num(r.updatedAt, 0) };
  return {
    id,
    sectionId: typeof r.sectionId === "string" ? r.sectionId : "",
    text: str(r.text, TEXT_MAX),
    note: str(r.note, NOTE_MAX),
    done: !!r.done,
    doneAt: r.done ? num(r.doneAt, 0) : 0,
    today: !!r.today,
    order: num(r.order, 0),
    todayOrder: num(r.todayOrder, num(r.order, 0)),
    updatedAt: num(r.updatedAt, 0)
  };
}

function normSection(r, key) {
  if (!r || typeof r !== "object") return null;
  const id = typeof r.id === "string" ? r.id : key;
  if (!id) return null;
  if (r.deleted) return { id, deleted: true, updatedAt: num(r.updatedAt, 0) };
  return { id, name: str(r.name, 60), order: num(r.order, 0), collapsed: !!r.collapsed, updatedAt: num(r.updatedAt, 0) };
}

function normTheme(r, key) {
  if (!r || typeof r !== "object") return null;
  const id = typeof r.id === "string" ? r.id : key;
  if (!id) return null;
  if (r.deleted) return { id, deleted: true, updatedAt: num(r.updatedAt, 0) };
  return { id, name: str(r.name, 40), code: str(r.code, 120), updatedAt: num(r.updatedAt, 0) };
}

/* ---------------- canonical form & equality ---------------- */

/** JSON with sorted keys, so equal records stringify equally regardless of insertion order. */
export function canon(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  const keys = Object.keys(v).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
}

export function docEquals(a, b) { return canon(a) === canon(b); }

/* ---------------- merge ----------------
   Per record, last writer wins by updatedAt. Ties: a tombstone beats a live
   record; otherwise the lexically larger canonical JSON wins. Deterministic,
   so merge(a,b) === merge(b,a) and merging twice changes nothing.          */

function pickRecord(x, y) {
  if (!x) return y;
  if (!y) return x;
  const tx = x.updatedAt || 0, ty = y.updatedAt || 0;
  if (tx !== ty) return tx > ty ? x : y;
  if (!!x.deleted !== !!y.deleted) return x.deleted ? x : y;
  const cx = canon(x), cy = canon(y);
  return cx >= cy ? x : y;
}

function mergeMap(a, b) {
  const out = {};
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) out[k] = pickRecord(a && a[k], b && b[k]);
  return out;
}

function mergeHistory(a, b) {
  const out = {};
  const days = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const day of days) {
    const seen = new Map();
    for (const src of [a && a[day], b && b[day]]) {
      if (!Array.isArray(src)) continue;
      for (const e of src) {
        if (!e || !e.id) continue;
        const cur = seen.get(e.id);
        // same item recorded twice for one day: keep the later doneAt, then the canonical max
        if (!cur || e.doneAt > cur.doneAt || (e.doneAt === cur.doneAt && canon(e) > canon(cur))) seen.set(e.id, e);
      }
    }
    const list = [...seen.values()].sort((x, y) => x.doneAt - y.doneAt || cmp(x.id, y.id));
    if (list.length) out[day] = list;
  }
  return out;
}

export function merge(a, b) {
  a = normalize(a); b = normalize(b);
  const nameWinner = (a.nameAt === b.nameAt) ? (a.name >= b.name ? a : b) : (a.nameAt > b.nameAt ? a : b);
  return {
    v: DOC_VERSION,
    id: a.id || b.id,
    name: nameWinner.name,
    nameAt: nameWinner.nameAt,
    sections: mergeMap(a.sections, b.sections),
    items: mergeMap(a.items, b.items),
    history: mergeHistory(a.history, b.history),
    themes: mergeMap(a.themes, b.themes),
    updatedAt: Math.max(a.updatedAt, b.updatedAt)
  };
}

export const HISTORY_DAYS = 365;

/** Drop tombstones older than TTL and history older than HISTORY_DAYS. Returns a new doc (or the same one if nothing changed). */
export function purgeTombstones(doc, nowTs = now(), ttl = TOMBSTONE_TTL) {
  let changed = false;
  const out = { ...doc };
  const cutoff = localDate(nowTs - HISTORY_DAYS * 24 * 3600 * 1000);
  const hist = {};
  for (const day of Object.keys(doc.history || {})) { if (day >= cutoff) hist[day] = doc.history[day]; else changed = true; }
  out.history = hist;
  for (const key of ["sections", "items", "themes"]) {
    const m = doc[key];
    const kept = {};
    for (const id of Object.keys(m)) {
      const r = m[id];
      if (r.deleted && nowTs - (r.updatedAt || 0) > ttl) { changed = true; continue; }
      kept[id] = r;
    }
    out[key] = kept;
  }
  return changed ? out : doc;
}

/* ---------------- queries ---------------- */

export function liveItems(doc) { return Object.values(doc.items).filter(i => !i.deleted); }
export function liveSections(doc) { return Object.values(doc.sections).filter(s => !s.deleted); }

/** Sections in display order. */
export function sectionsOrdered(doc) {
  return liveSections(doc).sort((a, b) => a.order - b.order || cmp(a.id, b.id));
}

/** Items of one section: undone by manual order, then done by doneAt (they sink). */
export function itemsInSection(doc, sectionId) {
  const live = liveSections(doc);
  const known = new Set(live.map(s => s.id));
  const inSec = liveItems(doc).filter(i => (i.sectionId === sectionId) || (sectionId === "" && !known.has(i.sectionId)));
  return sortSink(inSec, i => i.order);
}

/** Today view: starred items; undone by todayOrder, done sink by doneAt. */
export function todayItems(doc) {
  return sortSink(liveItems(doc).filter(i => i.today), i => i.todayOrder);
}

function sortSink(items, keyFn) {
  return items.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.done) return a.doneAt - b.doneAt || cmp(a.id, b.id);
    return keyFn(a) - keyFn(b) || cmp(a.id, b.id);
  });
}

export function sectionName(doc, sectionId) {
  const s = doc.sections[sectionId];
  return (s && !s.deleted) ? s.name : "";
}

/* ---------------- ordering ---------------- */

/** A value strictly between prev and next (either may be undefined). null when precision is exhausted. */
export function orderBetween(prev, next) {
  if (prev == null && next == null) return ORDER_STEP;
  if (prev == null) return next - ORDER_STEP;
  if (next == null) return prev + ORDER_STEP;
  const mid = (prev + next) / 2;
  if (!(mid > prev && mid < next)) return null;
  return mid;
}

export function lastOrder(items, keyFn) {
  let max = 0;
  for (const i of items) max = Math.max(max, keyFn(i));
  return max + ORDER_STEP;
}

/* ---------------- rollover ----------------
   Every item finished on an earlier local date goes to history for that
   date and is tombstoned. Idempotent: running it twice, or on two devices,
   yields the same merged result.                                          */

export function rollover(doc, today = localDate(), ts = now()) {
  const moved = [];
  const items = { ...doc.items };
  const history = { ...doc.history };
  for (const it of Object.values(doc.items)) {
    if (it.deleted || !it.done || !it.doneAt) continue;
    const day = localDate(it.doneAt);
    if (day >= today) continue;
    const entry = { id: it.id, text: it.text, doneAt: it.doneAt, section: sectionName(doc, it.sectionId) };
    const list = (history[day] || []).filter(e => e.id !== it.id).concat([entry]);
    list.sort((a, b) => a.doneAt - b.doneAt || cmp(a.id, b.id));
    history[day] = list;
    // stamped just above the record it replaces (not "now"), so a genuinely newer edit elsewhere still wins
    // and every device produces the identical tombstone
    items[it.id] = { id: it.id, deleted: true, updatedAt: (it.updatedAt || 0) + 1 };
    moved.push(entry);
  }
  if (!moved.length) return { doc, moved };
  return { doc: { ...doc, items, history, updatedAt: Math.max(doc.updatedAt, ts) }, moved };
}

/** Days with at least one finished item, most recent first. */
export function historyDays(doc) {
  return Object.keys(doc.history).sort().reverse();
}

/** Consecutive days (ending today or yesterday) with at least one finished item. */
export function streak(doc, today = localDate()) {
  const days = new Set(historyDays(doc));
  for (const it of liveItems(doc)) if (it.done && it.doneAt) days.add(localDate(it.doneAt));
  let d = new Date(today + "T12:00:00");
  let count = 0;
  if (!days.has(localDate(d.getTime()))) d.setDate(d.getDate() - 1);
  while (days.has(localDate(d.getTime()))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}

/* ---------------- migration & seed ---------------- */

/** v1 localStorage shape: { items:[{t,d,o}], mode, muted, seq }. */
export function migrateV1(v1, id, ts = now()) {
  const doc = emptyDoc(id, "");
  const items = Array.isArray(v1 && v1.items) ? v1.items : [];
  const seq = num(v1 && v1.seq, 0);
  items.forEach((it, i) => {
    if (!it || typeof it.t !== "string" || !it.t.trim()) return;
    const iid = shortId();
    const done = !!it.d;
    doc.items[iid] = {
      id: iid, sectionId: "", text: it.t.slice(0, TEXT_MAX), note: "",
      done, doneAt: done ? ts - (seq - num(it.o, 0) + 1) * 1000 : 0,
      today: true, order: (i + 1) * ORDER_STEP, todayOrder: (i + 1) * ORDER_STEP, updatedAt: ts
    };
  });
  return doc;
}

export const SEED_LINES = [
  "Tap or click this line to cross it off",
  "Add a line with + New line; the pencil edits one",
  "Everything holds the rest; its Today toggle brings a line here",
  "Your link is the key: save it from Share before you close this",
  "Cross off all five and see what happens"
];

export function seedDoc(id, ts = now()) {
  const doc = emptyDoc(id, "");
  SEED_LINES.forEach((t, i) => {
    const iid = shortId();
    doc.items[iid] = {
      id: iid, sectionId: "", text: t, note: "", done: false, doneAt: 0, today: true,
      order: (i + 1) * ORDER_STEP, todayOrder: (i + 1) * ORDER_STEP, updatedAt: ts
    };
  });
  return doc;
}

/* ---------------- reorder planning ----------------
   The fewest DOM moves that turn `current` into `wanted`: rows that already sit in a
   correct relative order (the longest increasing subsequence) stay untouched, so a
   render never detaches the row under the user's pointer unless it really moved.      */

/** Moves as [{ id, before }] to apply in order: insert `id` before `before` (null = append). */
export function reorderPlan(current, wanted) {
  const cur = current.filter(id => wanted.includes(id));
  const index = new Map(cur.map((id, i) => [id, i]));
  const pos = wanted.map(id => index.has(id) ? index.get(id) : -1);
  // longest strictly increasing subsequence over the current positions (O(n²) is fine for a list)
  const n = pos.length, len = new Array(n).fill(1), prev = new Array(n).fill(-1);
  let best = -1;
  for (let i = 0; i < n; i++) {
    if (pos[i] < 0) { len[i] = 0; continue; }
    for (let j = 0; j < i; j++) if (pos[j] >= 0 && pos[j] < pos[i] && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; }
    if (best < 0 || len[i] > len[best]) best = i;
  }
  const keep = new Set();
  for (let i = best; i >= 0; i = prev[i]) keep.add(wanted[i]);
  const moves = [];
  for (let i = n - 1; i >= 0; i--) {
    if (keep.has(wanted[i])) continue;
    moves.push({ id: wanted[i], before: i + 1 < n ? wanted[i + 1] : null });
  }
  return moves;
}

/** Apply a plan to an array (what the DOM does with insertBefore); used by the tests. */
export function applyPlan(current, moves) {
  const out = current.slice();
  for (const m of moves) {
    const i = out.indexOf(m.id); if (i >= 0) out.splice(i, 1);
    if (m.before === null) out.push(m.id); else out.splice(out.indexOf(m.before), 0, m.id);
  }
  return out;
}

/* ---------------- diff (for quiet UI updates) ---------------- */

/** Ids whose records differ between two docs, per collection. */
export function diff(prev, next) {
  const out = { items: [], sections: [], themes: [], name: prev.name !== next.name };
  for (const key of ["items", "sections", "themes"]) {
    const ids = new Set([...Object.keys(prev[key] || {}), ...Object.keys(next[key] || {})]);
    for (const id of ids) {
      const a = prev[key] && prev[key][id], b = next[key] && next[key][id];
      if (canon(a) !== canon(b)) out[key].push(id);
    }
  }
  return out;
}
