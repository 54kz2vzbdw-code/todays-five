// model.js — the list document: ids, shape, merge, rollover, ordering, and the v4 additions
// (recurrence rules, not-today returns, templates, tombstones that remember their text, export/import).
// Pure functions only. No DOM, no storage. Tested in Node (test/model.test.js, test/compat.test.js).
//
// Compatibility (COMPATIBILITY.md §3): the shape only grows. normalize() keeps every key it does not know, on the
// document and on every record, and merge() keeps whole collections it does not know, because an old client will
// hand this code documents from the future just as v3 handed v4 documents to v3 code.

export const DOC_VERSION = 3;
export const TEMPLATE_NAME_MAX = 40;
export const TEMPLATE_LINES_MAX = 60;
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
  return { v: DOC_VERSION, id, name, nameAt: t, sections: {}, items: {}, history: {}, themes: {}, rules: {}, returns: {}, templates: {}, updatedAt: t };
}

/** The collections a document carries, in the order they are merged. Unknown top-level keys pass through untouched. */
export const COLLECTIONS = ["sections", "items", "themes", "rules", "returns", "templates"];
const DOC_KEYS = new Set(["v", "id", "name", "nameAt", "updatedAt", "history", ...COLLECTIONS]);
const ITEM_KEYS = new Set(["id", "sectionId", "text", "note", "done", "doneAt", "today", "order", "todayOrder", "updatedAt", "deleted"]);
const SECTION_KEYS = new Set(["id", "name", "order", "collapsed", "updatedAt", "deleted"]);
const THEME_KEYS = new Set(["id", "name", "code", "updatedAt", "deleted"]);
const RULE_KEYS = new Set(["id", "kind", "days", "day", "text", "note", "sectionId", "placed", "updatedAt", "deleted"]);
const RETURN_KEYS = new Set(["id", "on", "updatedAt", "deleted"]);
const TEMPLATE_KEYS = new Set(["id", "name", "lines", "updatedAt", "deleted"]);

/** Copy the keys `known` does not list from `src` onto `out` (a future version's fields must survive this one). */
function passThrough(out, src, known) {
  for (const k of Object.keys(src)) if (!known.has(k) && !(k in out)) out[k] = src[k];
  return out;
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
  out.rules = mapOf(d.rules, normRule);
  out.returns = mapOf(d.returns, normReturn);
  out.templates = mapOf(d.templates, normTemplate);
  passThrough(out, d, DOC_KEYS);
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
  if (r.deleted) {
    // a tombstone that remembers its line (v4) shows in Recently deleted; a bare one (rollover, moves, v3) does not
    const t = { id, deleted: true, updatedAt: num(r.updatedAt, 0) };
    if (typeof r.text === "string" && r.text) { t.text = str(r.text, TEXT_MAX); t.note = str(r.note, NOTE_MAX); t.sectionId = typeof r.sectionId === "string" ? r.sectionId : ""; }
    return passThrough(t, r, ITEM_KEYS);
  }
  return passThrough({
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
  }, r, ITEM_KEYS);
}

function normSection(r, key) {
  if (!r || typeof r !== "object") return null;
  const id = typeof r.id === "string" ? r.id : key;
  if (!id) return null;
  if (r.deleted) return passThrough({ id, deleted: true, updatedAt: num(r.updatedAt, 0) }, r, SECTION_KEYS);
  return passThrough({ id, name: str(r.name, 60), order: num(r.order, 0), collapsed: !!r.collapsed, updatedAt: num(r.updatedAt, 0) }, r, SECTION_KEYS);
}

function normTheme(r, key) {
  if (!r || typeof r !== "object") return null;
  const id = typeof r.id === "string" ? r.id : key;
  if (!id) return null;
  if (r.deleted) return passThrough({ id, deleted: true, updatedAt: num(r.updatedAt, 0) }, r, THEME_KEYS);
  return passThrough({ id, name: str(r.name, 40), code: str(r.code, 120), updatedAt: num(r.updatedAt, 0) }, r, THEME_KEYS);
}

/* ---- v4 records ---- */

export const RULE_KINDS = ["daily", "weekdays", "weekly", "monthly"];

/** A recurrence rule, keyed by the item it belongs to. Carries a snapshot of the line so a revival has text. */
function normRule(r, key) {
  if (!r || typeof r !== "object") return null;
  const id = typeof r.id === "string" ? r.id : key;
  if (!id) return null;
  if (r.deleted) return passThrough({ id, deleted: true, updatedAt: num(r.updatedAt, 0) }, r, RULE_KEYS);
  const kind = RULE_KINDS.includes(r.kind) ? r.kind : "daily";
  const out = { id, kind, text: str(r.text, TEXT_MAX), note: str(r.note, NOTE_MAX), sectionId: typeof r.sectionId === "string" ? r.sectionId : "", updatedAt: num(r.updatedAt, 0) };
  if (kind === "weekly") out.days = Array.isArray(r.days) ? [...new Set(r.days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort() : [];
  if (kind === "monthly") out.day = Math.min(31, Math.max(1, num(r.day, 1) | 0));
  if (typeof r.placed === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.placed)) out.placed = r.placed; // the date the rule last put its line on Today
  return passThrough(out, r, RULE_KEYS);
}

/** "Not today": the line is off Today until `on` (a local date). */
function normReturn(r, key) {
  if (!r || typeof r !== "object") return null;
  const id = typeof r.id === "string" ? r.id : key;
  if (!id) return null;
  if (r.deleted) return passThrough({ id, deleted: true, updatedAt: num(r.updatedAt, 0) }, r, RETURN_KEYS);
  const on = typeof r.on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.on) ? r.on : "";
  if (!on) return null;
  return passThrough({ id, on, updatedAt: num(r.updatedAt, 0) }, r, RETURN_KEYS);
}

function normTemplate(r, key) {
  if (!r || typeof r !== "object") return null;
  const id = typeof r.id === "string" ? r.id : key;
  if (!id) return null;
  if (r.deleted) return passThrough({ id, deleted: true, updatedAt: num(r.updatedAt, 0) }, r, TEMPLATE_KEYS);
  const lines = (Array.isArray(r.lines) ? r.lines : []).map(l => l && typeof l === "object" ? { text: str(l.text, TEXT_MAX), note: str(l.note, NOTE_MAX) } : null).filter(l => l && l.text).slice(0, TEMPLATE_LINES_MAX);
  return passThrough({ id, name: str(r.name, TEMPLATE_NAME_MAX), lines, updatedAt: num(r.updatedAt, 0) }, r, TEMPLATE_KEYS);
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
   Per record, last writer wins by updatedAt. Ties: a tombstone beats a live record; then the record
   that carries more (the longer canonical JSON) wins, so a field an old client stripped is restored
   by the next merge; then the lexically larger. A total order, so merge(a,b) === merge(b,a), it is
   associative, and merging twice changes nothing.                                                   */

function pickRecord(x, y) {
  if (!x) return y;
  if (!y) return x;
  const tx = x.updatedAt || 0, ty = y.updatedAt || 0;
  if (tx !== ty) return tx > ty ? x : y;
  if (!!x.deleted !== !!y.deleted) return x.deleted ? x : y;
  const cx = canon(x), cy = canon(y);
  if (cx.length !== cy.length) return cx.length > cy.length ? x : y;
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
  const out = {
    v: DOC_VERSION,
    id: a.id || b.id,
    name: nameWinner.name,
    nameAt: nameWinner.nameAt,
    sections: mergeMap(a.sections, b.sections),
    items: mergeMap(a.items, b.items),
    history: mergeHistory(a.history, b.history),
    themes: mergeMap(a.themes, b.themes),
    rules: mergeMap(a.rules, b.rules),
    returns: mergeMap(a.returns, b.returns),
    templates: mergeMap(a.templates, b.templates),
    updatedAt: Math.max(a.updatedAt, b.updatedAt)
  };
  // keys neither side of this code knows: keep the larger canonical value so both sides agree (a future version merges them properly)
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (DOC_KEYS.has(k)) continue;
    const va = a[k], vb = b[k];
    out[k] = va === undefined ? vb : vb === undefined ? va : (canon(va) >= canon(vb) ? va : vb);
  }
  return out;
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
  for (const key of COLLECTIONS) {
    const m = doc[key] || {};
    const kept = {};
    for (const id of Object.keys(m)) {
      const r = m[id];
      if (r.deleted && nowTs - (r.updatedAt || 0) > ttl) { changed = true; continue; }
      // a rule or return whose line is long gone (its tombstone already purged) is an orphan
      if ((key === "rules" || key === "returns") && !r.deleted && !(doc.items && doc.items[id])) { changed = true; continue; }
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

/* ---------------- recurrence ---------------- */

export function ruleOf(doc, id) { const r = doc.rules && doc.rules[id]; return r && !r.deleted ? r : null; }
export function returnOf(doc, id) { const r = doc.returns && doc.returns[id]; return r && !r.deleted ? r : null; }
export function liveRules(doc) { return Object.values(doc.rules || {}).filter(r => !r.deleted); }
export function liveTemplates(doc) { return Object.values(doc.templates || {}).filter(t => !t.deleted).sort((a, b) => cmp(a.name.toLowerCase(), b.name.toLowerCase()) || cmp(a.id, b.id)); }

function dateParts(day) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day); return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null; }
function daysInMonth(y, mo) { return new Date(y, mo, 0).getDate(); }
/** The local date `n` days after `day` (YYYY-MM-DD in, YYYY-MM-DD out). */
export function addDays(day, n) {
  const p = dateParts(day); if (!p) return day;
  return localDate(new Date(p.y, p.mo - 1, p.d + n, 12).getTime());
}
export function weekdayOf(day) { const p = dateParts(day); return p ? new Date(p.y, p.mo - 1, p.d, 12).getDay() : 0; }

/** Does a rule fire on this local date? Monthly rules clamp to the month's last day. */
export function isDue(rule, day) {
  if (!rule || rule.deleted) return false;
  const p = dateParts(day); if (!p) return false;
  const wd = new Date(p.y, p.mo - 1, p.d, 12).getDay();
  if (rule.kind === "daily") return true;
  if (rule.kind === "weekdays") return wd >= 1 && wd <= 5;
  if (rule.kind === "weekly") return (rule.days || []).includes(wd);
  if (rule.kind === "monthly") return p.d === Math.min(rule.day || 1, daysInMonth(p.y, p.mo));
  return false;
}

/** Set (or clear, with null) the recurrence rule of a line. The rule keeps a snapshot of the line for revival. */
export function setRule(doc, id, rule, ts = now(), today = localDate()) {
  const it = doc.items[id]; if (!it || it.deleted) return doc;
  const rules = { ...(doc.rules || {}) };
  if (!rule) {
    if (!rules[id] || rules[id].deleted) return doc;
    rules[id] = { id, deleted: true, updatedAt: ts };
  } else {
    const r = { id, kind: rule.kind, text: it.text, note: it.note || "", sectionId: it.sectionId || "", updatedAt: ts };
    if (rule.kind === "weekly") r.days = [...new Set((rule.days || []).filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (rule.kind === "monthly") r.day = Math.min(31, Math.max(1, (rule.day || 1) | 0));
    if (it.today) r.placed = today; // already on Today: the rule must not re-place it today if the user takes it off
    rules[id] = r;
  }
  return { ...doc, rules, updatedAt: Math.max(doc.updatedAt, ts) };
}

/** Keep a rule's snapshot in step with its line (called after an edit on this device). */
export function refreshRuleSnapshot(doc, id, ts = now()) {
  const it = doc.items[id], r = ruleOf(doc, id);
  if (!it || it.deleted || !r) return doc;
  if (r.text === it.text && r.note === (it.note || "") && r.sectionId === (it.sectionId || "")) return doc;
  return { ...doc, rules: { ...doc.rules, [id]: { ...r, text: it.text, note: it.note || "", sectionId: it.sectionId || "", updatedAt: ts } } };
}

/* ---------------- not today ---------------- */

/** Take a line off Today until `on` (tomorrow by default). Visible to old clients as an ordinary "off Today". */
export function notToday(doc, id, today = localDate(), ts = now()) {
  const it = doc.items[id]; if (!it || it.deleted) return doc;
  const items = { ...doc.items, [id]: { ...it, today: false, updatedAt: ts } };
  const returns = { ...(doc.returns || {}), [id]: { id, on: addDays(today, 1), updatedAt: ts } };
  return { ...doc, items, returns, updatedAt: Math.max(doc.updatedAt, ts) };
}
/** Undo of notToday: back on Today now, and the return is dropped. */
export function backToday(doc, id, ts = now()) {
  const it = doc.items[id]; if (!it || it.deleted) return doc;
  const items = { ...doc.items, [id]: { ...it, today: true, updatedAt: ts } };
  const returns = { ...(doc.returns || {}) };
  if (returns[id] && !returns[id].deleted) returns[id] = { id, deleted: true, updatedAt: ts };
  return { ...doc, items, returns, updatedAt: Math.max(doc.updatedAt, ts) };
}

/* ---------------- rollover ----------------
   A pure, idempotent function of (doc, today). Every record it writes is stamped relative to the
   record it replaces (+1, +2), never with the clock, so two devices produce identical records and
   a device waking from days of sleep cannot beat a real edit made elsewhere. Steps:
     1. finished on an earlier date → History; a recurring line resets (+2, beating a v3 rollover's
        tombstone at +1), any other line is tombstoned (+1) as in v3;
     2. an undone recurring line that is off Today and due today goes on Today (once per day: the
        rule remembers the date it last placed its line, so taking it off Today sticks);
     3. a return whose day has come puts its line back on Today and retires itself;
     4. revival: a live rule whose line was tombstoned by a v3 rollover (bare tombstone stamped one or
        two ms above the line's latest History entry) is recreated from the rule's snapshot.        */

function latestHistoryFor(history, id) {
  let best = null;
  for (const day of Object.keys(history || {})) for (const e of history[day]) if (e.id === id && (!best || e.doneAt > best.doneAt)) best = e;
  return best;
}

export function rollover(doc, today = localDate(), ts = now()) {
  const moved = [];
  const items = { ...doc.items };
  const history = { ...doc.history };
  const rules = { ...(doc.rules || {}) };
  const returns = { ...(doc.returns || {}) };
  let changed = false;
  const liveRule = id => { const r = rules[id]; return r && !r.deleted ? r : null; };
  const placeToday = (rule, it, stampFrom) => {
    items[it.id] = { ...it, today: true, updatedAt: (stampFrom || 0) + 1 };
    rules[rule.id] = { ...rule, placed: today, updatedAt: (rule.updatedAt || 0) + 1 };
    changed = true;
  };
  // 1. finished on an earlier date
  for (const it of Object.values(doc.items)) {
    if (it.deleted || !it.done || !it.doneAt) continue;
    const day = localDate(it.doneAt);
    if (day >= today) continue;
    const entry = { id: it.id, text: it.text, doneAt: it.doneAt, section: sectionName(doc, it.sectionId) };
    const list = (history[day] || []).filter(e => e.id !== it.id).concat([entry]);
    list.sort((a, b) => a.doneAt - b.doneAt || cmp(a.id, b.id));
    history[day] = list;
    const rule = liveRule(it.id);
    if (rule) {
      const due = isDue(rule, today);
      items[it.id] = { ...it, done: false, doneAt: 0, today: due, updatedAt: (it.updatedAt || 0) + 2 };
      if (due) rules[rule.id] = { ...rule, placed: today, updatedAt: (rule.updatedAt || 0) + 1 };
    } else {
      items[it.id] = { id: it.id, deleted: true, updatedAt: (it.updatedAt || 0) + 1 };
    }
    moved.push(entry);
    changed = true;
  }
  // 2. due recurring lines that are off Today
  for (const rule of Object.values(rules)) {
    if (rule.deleted) continue;
    const it = items[rule.id];
    if (!it || it.deleted || it.done || it.today) continue;
    if (rule.placed && rule.placed >= today) continue;
    const ret = returns[rule.id];
    if (ret && !ret.deleted && ret.on > today) continue; // "not today" holds it back
    if (isDue(rule, today)) placeToday(rule, it, it.updatedAt);
  }
  // 3. returns whose day has come
  for (const ret of Object.values(returns)) {
    if (ret.deleted || ret.on > today) continue;
    const it = items[ret.id];
    if (it && !it.deleted && !it.done && !it.today) items[ret.id] = { ...it, today: true, updatedAt: (it.updatedAt || 0) + 1 };
    returns[ret.id] = { id: ret.id, deleted: true, updatedAt: (ret.updatedAt || 0) + 1 };
    changed = true;
  }
  // 4. revival after a v3 rollover
  for (const rule of Object.values(rules)) {
    if (rule.deleted) continue;
    const t = items[rule.id];
    if (!t || !t.deleted || t.text) continue;
    const h = latestHistoryFor(history, rule.id);
    if (!h) continue;
    const gap = t.updatedAt - h.doneAt;
    if (gap < 1 || gap > 2) continue;
    const secItems = Object.values(items).filter(i => !i.deleted && (i.sectionId || "") === (rule.sectionId || ""));
    const due = isDue(rule, today);
    items[rule.id] = {
      id: rule.id, sectionId: rule.sectionId || "", text: rule.text, note: rule.note || "", done: false, doneAt: 0, today: due,
      order: lastOrder(secItems, i => i.order), todayOrder: lastOrder(Object.values(items).filter(i => !i.deleted && i.today), i => i.todayOrder),
      updatedAt: t.updatedAt + 1
    };
    if (due) rules[rule.id] = { ...rule, placed: today, updatedAt: (rule.updatedAt || 0) + 1 };
    changed = true;
  }
  if (!changed) return { doc, moved };
  return { doc: { ...doc, items, history, rules, returns, updatedAt: Math.max(doc.updatedAt, ts) }, moved };
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
  const out = { items: [], sections: [], themes: [], rules: [], returns: [], templates: [], name: prev.name !== next.name };
  for (const key of COLLECTIONS) {
    const ids = new Set([...Object.keys(prev[key] || {}), ...Object.keys(next[key] || {})]);
    for (const id of ids) {
      const a = prev[key] && prev[key][id], b = next[key] && next[key][id];
      if (canon(a) !== canon(b)) out[key].push(id);
    }
  }
  return out;
}

/* ---------------- recently deleted ---------------- */

/** Tombstones that remember their line, newest first. */
export function recentlyDeleted(doc) {
  return Object.values(doc.items).filter(i => i.deleted && i.text).sort((a, b) => b.updatedAt - a.updatedAt || cmp(a.id, b.id));
}
/** Delete a line but remember what it said (v4 tombstone). */
export function tombstone(it, ts = now()) { return { id: it.id, deleted: true, text: it.text, note: it.note || "", sectionId: it.sectionId || "", updatedAt: ts }; }
/** Bring a deleted line back into its section, undone, at the end. */
export function restoreItem(doc, id, ts = now()) {
  const t = doc.items[id]; if (!t || !t.deleted) return doc;
  const known = new Set(liveSections(doc).map(s => s.id));
  const sectionId = known.has(t.sectionId) ? t.sectionId : "";
  const items = { ...doc.items, [id]: { id, sectionId, text: t.text || "", note: t.note || "", done: false, doneAt: 0, today: false, order: lastOrder(itemsInSection(doc, sectionId), i => i.order), todayOrder: lastOrder(todayItems(doc), i => i.todayOrder), updatedAt: ts } };
  return { ...doc, items, updatedAt: Math.max(doc.updatedAt, ts) };
}

/* ---------------- templates ---------------- */

/** A template from a section's live lines (text and note, no state). */
export function templateFromSection(doc, sectionId, name, id = shortId(), ts = now()) {
  const lines = itemsInSection(doc, sectionId).map(i => ({ text: i.text, note: i.note || "" })).filter(l => l.text).slice(0, TEMPLATE_LINES_MAX);
  const t = { id, name: String(name || "").trim().slice(0, TEMPLATE_NAME_MAX) || "Template", lines, updatedAt: ts };
  return { ...doc, templates: { ...(doc.templates || {}), [id]: t }, updatedAt: Math.max(doc.updatedAt, ts) };
}
/** Insert a template's lines at the end of a section (and on Today when asked). Returns the doc and the new ids. */
export function insertTemplate(doc, tpl, sectionId = "", { today = false } = {}, ts = now(), idFn = shortId) {
  const items = { ...doc.items };
  let order = lastOrder(itemsInSection(doc, sectionId), i => i.order), todayOrder = lastOrder(todayItems(doc), i => i.todayOrder);
  const ids = [];
  for (const l of tpl.lines || []) {
    const id = idFn(); ids.push(id);
    items[id] = { id, sectionId, text: l.text, note: l.note || "", done: false, doneAt: 0, today, order, todayOrder, updatedAt: ts };
    order += ORDER_STEP; todayOrder += ORDER_STEP;
  }
  return { doc: { ...doc, items, updatedAt: Math.max(doc.updatedAt, ts) }, ids };
}
export function deleteTemplate(doc, id, ts = now()) {
  const t = doc.templates && doc.templates[id]; if (!t || t.deleted) return doc;
  return { ...doc, templates: { ...doc.templates, [id]: { id, deleted: true, updatedAt: ts } }, updatedAt: Math.max(doc.updatedAt, ts) };
}

/* ---------------- sections on/off Today ---------------- */

export function setSectionToday(doc, sectionId, on, ts = now()) {
  const items = { ...doc.items };
  let todayOrder = lastOrder(todayItems(doc), i => i.todayOrder);
  let changed = false;
  for (const it of itemsInSection(doc, sectionId)) {
    if (it.done || !!it.today === !!on) continue;
    items[it.id] = { ...it, today: !!on, todayOrder: on ? todayOrder : it.todayOrder, updatedAt: ts };
    if (on) todayOrder += ORDER_STEP;
    changed = true;
  }
  return changed ? { ...doc, items, updatedAt: Math.max(doc.updatedAt, ts) } : doc;
}

/* ---------------- move to another list ---------------- */

/** Copy a line (with its rule and return) into `dst` under a new id, and tombstone it in `src` without text
    (a moved line is not a deleted one). Both docs are returned; the caller saves each under its own key. */
export function moveItem(src, dst, id, ts = now(), idFn = shortId) {
  const it = src.items[id]; if (!it || it.deleted) return null;
  const newId = idFn();
  const dstItems = { ...dst.items, [newId]: { ...it, id: newId, sectionId: "", order: lastOrder(itemsInSection(dst, ""), i => i.order), todayOrder: lastOrder(todayItems(dst), i => i.todayOrder), updatedAt: ts } };
  const out = { ...dst, items: dstItems, updatedAt: Math.max(dst.updatedAt, ts) };
  const rule = ruleOf(src, id);
  if (rule) out.rules = { ...(dst.rules || {}), [newId]: { ...rule, id: newId, sectionId: "", updatedAt: ts } };
  const ret = returnOf(src, id);
  if (ret) out.returns = { ...(dst.returns || {}), [newId]: { ...ret, id: newId, updatedAt: ts } };
  const srcItems = { ...src.items, [id]: { id, deleted: true, updatedAt: ts } };
  const srcOut = { ...src, items: srcItems, updatedAt: Math.max(src.updatedAt, ts) };
  if (rule) srcOut.rules = { ...src.rules, [id]: { id, deleted: true, updatedAt: ts } };
  if (ret) srcOut.returns = { ...src.returns, [id]: { id, deleted: true, updatedAt: ts } };
  return { src: srcOut, dst: out, newId };
}

/* ---------------- export / import ---------------- */

export const EXPORT_FORMAT = 1;

/** The document without its secret, keys sorted, so the same document always exports to the same bytes. */
function forExport(doc) { const d = normalize(doc); delete d.id; return d; }
export function exportJSON(doc, { at = now() } = {}) {
  const body = { app: "todays-five", format: EXPORT_FORMAT, exportedAt: at, doc: forExport(doc) };
  return JSON.stringify(JSON.parse(canon(body)), null, 2) + "\n";
}
/** Parse an export. Returns the normalized document (without an id: the caller supplies the list it belongs to). */
export function importJSON(text, id = "") {
  let v;
  try { v = JSON.parse(String(text)); } catch (e) { throw new Error("That file isn't JSON."); }
  const inner = v && typeof v === "object" && v.app === "todays-five" && v.doc && typeof v.doc === "object" ? v.doc : (v && typeof v === "object" && v.items && typeof v.items === "object" ? v : null);
  if (!inner) throw new Error("That file isn't a Today's Five export.");
  return normalize(inner, id);
}
export function exportMarkdown(doc, { today = localDate() } = {}) {
  const lines = [];
  lines.push("# " + (doc.name || "Today's Five"));
  lines.push("");
  lines.push("_Exported " + today + "_");
  const line = i => `- [${i.done ? "x" : " "}] ${i.text}${i.today ? " ★" : ""}${ruleOf(doc, i.id) ? " ↻" : ""}${i.note ? "\n  " + i.note.replace(/\n/g, "\n  ") : ""}`;
  const t = todayItems(doc);
  if (t.length) { lines.push("", "## Today", ""); for (const i of t) lines.push(line(i)); }
  const secs = [{ id: "", name: "Unsorted" }].concat(sectionsOrdered(doc));
  for (const s of secs) {
    const items = itemsInSection(doc, s.id);
    if (!items.length) continue;
    lines.push("", "## " + s.name, "");
    for (const i of items) lines.push(line(i));
  }
  const days = historyDays(doc);
  if (days.length) {
    lines.push("", "## History");
    for (const day of days) { lines.push("", "### " + day, ""); for (const e of doc.history[day]) lines.push("- " + e.text + (e.section ? " · " + e.section : "")); }
  }
  return lines.join("\n") + "\n";
}

/* ---------------- links: add from anywhere ---------------- */

/** Parse a location hash. `#/l/<W>` and `#/r/<R>` as ever; `#/l/<W>/add?text=…&section=…` adds lines
    (newlines make several). An old client matches only the prefix, so the id stays readable to it. */
export function parseHash(hash) {
  const m = String(hash || "").match(/^#\/(l|r)\/([0-9A-Za-z]{22,64})(\/add(?:\?(.*))?)?$/);
  if (!m) return null;
  const out = { id: m[2], mode: m[1] === "r" ? "view" : "edit", add: null };
  if (m[3]) {
    const q = new URLSearchParams(m[4] || "");
    const text = (q.get("text") || "").split(/\r?\n/).map(t => t.trim().replace(/\s+/g, " ")).filter(Boolean).map(t => t.slice(0, TEXT_MAX));
    out.add = { text, section: (q.get("section") || "").trim().slice(0, 60) };
  }
  return out;
}
/** The personalised add URL for an edit link (text left for the caller to append). */
export function addUrl(base, W) { return base + "#/l/" + W + "/add?text="; }

/* ---------------- what's new ---------------- */

/** Show the what's-new toast once per version, and never on a device that has never held a list. */
export function whatsNewDue({ seenVersion, hasLists }, version) {
  if (!seenVersion) return !!hasLists; // a device from before v4: returning if it holds a list, fresh otherwise
  return seenVersion !== version;
}

/* ---------------- day review ---------------- */

export function dayReview(doc, today = localDate()) {
  const t = todayItems(doc);
  const wd = weekdayOf(today);
  const monday = addDays(today, wd === 0 ? -6 : 1 - wd);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    const finished = d === today ? t.some(x => x.done) : !!(doc.history[d] && doc.history[d].length);
    days.push({ day: d, finished, future: d > today });
  }
  return { streak: streak(doc, today), days, finishedThisWeek: days.filter(d => d.finished).length, lines: t.map(i => ({ id: i.id, text: i.text, done: i.done })) };
}
