// app.js — the UI: views, rendering, inline editing, drag, keyboard, undo, rollover, panels, lists.
import * as M from "./model.js";
import { loadLocal, saveLocal, removeLocal, loadMeta, saveMeta, makeTransport, createSync } from "./sync.js";
import * as T from "./theme.js";
import { createSound } from "./sound.js";
import { createFx } from "./fx.js";
import config from "./config.js";

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const RM = matchMedia("(prefers-reduced-motion: reduce)");
const HOVER = matchMedia("(hover: hover)");
const DARK_MQ = matchMedia("(prefers-color-scheme: dark)");
// iPadOS reports itself as a Mac; a real touch screen tells it apart (headless/desktop Chrome can expose ontouchend without one)
const IOS = /iP(hone|ad|od)/.test(navigator.platform) || (navigator.userAgent.includes("Mac") && navigator.maxTouchPoints > 0);
const STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const V1_KEY = "todays-five/v1";
const BASE = location.origin + location.pathname.replace(/[^/]*$/, "");
const SEARCH = location.search;
const TRANSPORT_KIND = (new URLSearchParams(SEARCH).get("transport") === "local" || (() => { try { return localStorage.getItem("tf/v2/transport") === "local"; } catch (e) { return false; } })()) ? "local" : "supabase";
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.6l5 5.2L19.5 6.4"/></svg>';
const ICONS = {
  pencil: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7z"/></svg>',
  handle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="3"/></svg>',
  kill: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
};

/* ---------------- device meta ---------------- */
let meta = loadMeta();
if (!meta.device) meta.device = {};
if (!meta.lists) meta.lists = [];
const dev = meta.device;
if (!dev.id) dev.id = M.shortId();
if (typeof dev.volume !== "number") dev.volume = 1;
if (!dev.theme) dev.theme = "T1:curated:dark";
if (!dev.darkSlot) dev.darkSlot = "T1:curated:dark";
if (!dev.lightSlot) dev.lightSlot = "T1:curated:light";
function saveDevice() {
  // another tab may have changed the registry since this tab loaded: union lists, respect rotations, keep our device settings
  const stored = loadMeta();
  const dead = new Set([...(stored.dead || []), ...(meta.dead || [])]);
  const byId = new Map();
  for (const l of [...(stored.lists || []), ...(meta.lists || [])]) if (l && l.id && !dead.has(l.id)) byId.set(l.id, { ...(byId.get(l.id) || {}), ...l });
  meta.lists = Array.from(byId.values());
  meta.dead = Array.from(dead);
  meta.redirect = { ...(stored.redirect || {}), ...(meta.redirect || {}) };
  meta.pendingKill = Array.from(new Set([...(stored.pendingKill || []), ...(meta.pendingKill || [])]));
  if (syncStatus === "gone" && stored.current && stored.current !== meta.current && !dead.has(stored.current)) meta.current = stored.current;
  saveMeta(meta);
}
/** Follow redirects recorded by Rotate (an installed iPhone icon keeps launching the old id). */
function resolveId(id) {
  const r = meta.redirect || {};
  const seen = new Set();
  while (r[id] && !seen.has(id)) { seen.add(id); id = r[id]; }
  return id;
}
// per-tab identity: two tabs on one device must not ignore each other's broadcasts
const TAB_ID = dev.id + ":" + M.shortId();

/* ---------------- state ---------------- */
let doc = null, listId = null, view = "today";
let sync = null, transport = null, syncStatus = "off", transportFailed = false;
let theme = null;
let editing = null;            // { id, el, ta, note, isNew, orig }
let wasAll = false;
let rows = new Map();          // id -> <li>
let lastRowId = null;
let undoStack = [];
let toastTimer = 0;
let drag = null;
let wakeLock = null;
let openPanel = null;

/* ---------------- sound & fx ---------------- */
const sound = createSound({ muted: () => !!dev.muted, volume: () => dev.volume, kit: () => theme && theme.sound });
const fx = createFx($("#fx"), { palette: () => theme ? theme.confetti : ["#D26128"], shapes: () => theme ? theme.shapes : 1, reduced: () => RM.matches });

/* ---------------- theme ---------------- */
function currentThemeCode() {
  if (dev.follow) return DARK_MQ.matches ? dev.darkSlot : dev.lightSlot;
  return dev.theme;
}
function applyThemeCode(code) {
  theme = T.parseCode(code) || T.curated("dark");
  T.applyTheme(theme);
  $("#theme").textContent = theme.name;
  syncFollowChip();
}
function chooseTheme(t) {
  const code = T.themeCode(t);
  if (dev.follow) { if (t.base === "dark") dev.darkSlot = code; else dev.lightSlot = code; }
  dev.theme = code;
  saveDevice();
  applyThemeCode(dev.follow ? currentThemeCode() : code);
  if (!dev.muted) sound.tick();
  renderSwatches();
}
DARK_MQ.addEventListener("change", () => { if (dev.follow) applyThemeCode(currentThemeCode()); });

/* ---------------- boot ---------------- */
applyThemeCode(currentThemeCode());
paintDate();
paintMute();
wireUi();
boot();
registerSw();

function boot() {
  const h = hashId();
  if (h) return openList(resolveId(h));
  if (meta.current && loadLocal(meta.current)) return openList(meta.current);
  if (!meta.migratedV1) {
    let v1 = null;
    try { v1 = JSON.parse(localStorage.getItem(V1_KEY) || "null"); } catch (e) { /* ignore */ }
    if (v1 && Array.isArray(v1.items) && v1.items.length) {
      const id = M.newId();
      const d = M.migrateV1(v1, id);
      saveLocal(id, { doc: d, rev: 0, dirty: true, created: true });
      meta.migratedV1 = true;
      if (v1.mode && T.curated(v1.mode)) { dev.theme = "T1:curated:" + v1.mode; applyThemeCode(dev.theme); }
      if (v1.muted) { dev.muted = true; paintMute(); }
      registerList(id, "");
      return openList(id);
    }
    meta.migratedV1 = true; saveDevice();
  }
  showWelcome();
}

/** Push whatever is pending, but never wait more than a moment. */
function flushQuick() {
  if (!sync) return Promise.resolve();
  return Promise.race([Promise.resolve(sync.flush()).catch(() => {}), new Promise(r => setTimeout(r, 1500))]);
}
/** Other lists this browser holds with unpushed edits (switched away before the debounce, iOS reloads): push them once. */
async function flushOthers() {
  if (!transport) return;
  for (const l of meta.lists) {
    if (l.id === listId) continue;
    const local = loadLocal(l.id);
    if (!local || !local.dirty) continue;
    try {
      const remote = await transport.get(l.id);
      if (!remote) { if (!(local.rev === 0 && local.created)) continue; }
      const mergedDoc = remote ? M.merge(local.doc, M.normalize(remote.doc, l.id)) : local.doc;
      const res = await transport.put(l.id, mergedDoc, remote ? (remote.rev | 0) : 0);
      if (res && res.ok) saveLocal(l.id, { doc: mergedDoc, rev: res.rev, dirty: false, created: local.created });
    } catch (e) { /* next time */ }
  }
}
function hashId() {
  const m = location.hash.match(/^#\/l\/([0-9A-Za-z]{22,64})/);
  return m ? m[1] : null;
}
let reloading = false;
addEventListener("hashchange", () => { if (reloading) return; const h = hashId(); if (h && h !== listId) switchTo(resolveId(h)); });
// the Supabase client comes from a CDN; if that import failed (first load while offline), try again once we're back
async function retryTransport() {
  if (transport || !transportFailed || !listId) return;
  try { transport = await makeTransport(TRANSPORT_KIND, config); } catch (e) { transport = null; }
  if (transport) { transportFailed = false; openList(listId); }
}
addEventListener("online", retryTransport);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") retryTransport(); });

function registerList(id, name) {
  let e = meta.lists.find(l => l.id === id);
  if (!e) { e = { id, name: name || "", addedAt: Date.now() }; meta.lists.push(e); }
  return e;
}

async function openList(id) {
  if (!M.isListId(id)) return showWelcome("That link doesn't look right.");
  if (sync) { await flushQuick(); sync.close(); }
  if (editing) cancelEdit();
  listId = id;
  meta.current = id;
  const entry = registerList(id, "");
  saveDevice();
  const local = loadLocal(id);
  // a list opened from a link starts from a doc that loses every tie, so the server's name and records win
  doc = local ? local.doc : M.normalize({}, id);
  doc = M.purgeTombstones(doc);
  const roll = M.rollover(doc);
  if (roll.moved.length) doc = roll.doc;
  history.replaceState(null, "", BASE + SEARCH + "#/l/" + id);
  if (window.__tfManifest) window.__tfManifest(id);
  $("#welcome").hidden = true;
  $("#dot").hidden = false;
  rows.clear(); $("#list").innerHTML = ""; $("#all").innerHTML = "";
  wasAll = allDoneToday();
  setView(view, { force: true });
  paintListName();
  // sync starts after first paint
  if (!transport) {
    try { transport = await makeTransport(TRANSPORT_KIND, config); } catch (e) { transport = null; transportFailed = true; }
    if (listId !== id) return;
  }
  sync = createSync({
    transport, deviceId: TAB_ID,
    onStatus: paintStatus,
    onRemote: remote => { doc = remote; applyRemote(); },
    onGone: () => { /* status dot shows it; the paste screen is offered from the Lists panel */ }
  });
  paintStatus(transportFailed ? "offline" : sync.status);
  sync.open(id, doc, local ? { rev: local.rev, dirty: local.dirty || roll.moved.length > 0, created: local.created } : { rev: 0, dirty: false, created: false });
  retryPendingKills();
  flushOthers();
  if (sessionStorage.getItem("tf/reopenShare")) { sessionStorage.removeItem("tf/reopenShare"); setTimeout(openShare, 300); }
  if (roll.moved.length) sync.update(doc);
  if (entry && !entry.name && doc.name) entry.name = doc.name;
}

function showWelcome(msg) {
  if (sync) { flushQuick().then(() => { if (sync) { sync.close(); sync = null; } }); }
  listId = null; doc = null;
  $("#today").hidden = true; $("#all").hidden = true; $("#welcome").hidden = false;
  $("#w-err").textContent = msg || "";
  $("#dot").hidden = true; // no list yet: nothing to report
  $("#count").innerHTML = "<b>0</b>/0";
  $("#hint").innerHTML = "";
  $("#addtoday").hidden = true;
  paintListName();
}

/* ---------------- lists registry ---------------- */
function paintListName() {
  const btn = $("#listname");
  const active = meta.lists.filter(l => !l.archived);
  const entry = meta.lists.find(l => l.id === listId);
  const name = doc && doc.name ? doc.name : (entry && entry.name) || "";
  btn.hidden = !(doc && (active.length > 1 || name));
  btn.textContent = name || "List";
  $("#lists-k").textContent = active.length > 1 ? active.length + " lists" : "";
}

/* ---------------- rendering ---------------- */
function paintDate() {
  $("#date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).replace(", ", " · ");
}
function todayList() { return M.todayItems(doc); }
function doneCountToday() { return todayList().filter(i => i.done).length; }
function allDoneToday() { const t = todayList(); return t.length > 0 && t.every(i => i.done); }

function setView(v, { force } = {}) {
  if (!doc) return;
  if (editing) commitEdit();
  if (v !== view || force) { rows.clear(); $("#list").innerHTML = ""; $("#all").innerHTML = ""; }
  view = v;
  $("#v-today").setAttribute("aria-selected", v === "today" ? "true" : "false");
  $("#v-all").setAttribute("aria-selected", v === "all" ? "true" : "false");
  $("#today").hidden = v !== "today";
  $("#all").hidden = v !== "all";
  $("#welcome").hidden = true;
  render({ animate: false });
}

function render({ animate = true, quiet = false } = {}) {
  if (!doc) return;
  if (view === "today") renderToday({ animate, quiet }); else renderAll({ animate, quiet });
  paint();
}

function makeRow(it) {
  const li = document.createElement("li");
  li.className = "row"; li.dataset.id = it.id;
  li.innerHTML = `<button class="check" type="button" role="checkbox" aria-checked="false"><span class="box">${CHECK}</span><span class="tx"></span></button><span class="lines" aria-hidden="true"></span><div class="tools"></div>`;
  const tools = li.querySelector(".tools");
  const mk = (cls, icon, label) => { const b = document.createElement("button"); b.type = "button"; b.className = "tool " + cls; b.innerHTML = ICONS[icon]; b.title = label; b.setAttribute("aria-label", label); return b; };
  if (view === "today") {
    const more = mk("more", "more", "Show note"); more.hidden = true; tools.appendChild(more);
    tools.appendChild(mk("pencil", "pencil", "Edit (E)"));
  } else {
    const star = mk("star", "star", "Today"); star.setAttribute("aria-pressed", "false"); tools.appendChild(star);
    tools.appendChild(mk("pencil", "pencil", "Edit (E)"));
    tools.appendChild(mk("kill", "kill", "Delete"));
    tools.appendChild(mk("handle", "handle", "Drag to reorder"));
  }
  li.addEventListener("click", e => { if (clickAfterDrag()) { e.stopPropagation(); e.preventDefault(); } }, true);
  li.querySelector(".check").addEventListener("click", e => { if (clickAfterDrag()) return; toggle(it.id, e.clientX, e.clientY, e.detail > 0); });
  li.querySelector(".check").addEventListener("focus", () => { lastRowId = it.id; });
  li.addEventListener("pointerenter", () => { lastRowId = it.id; });
  li.addEventListener("dblclick", e => { if (!HOVER.matches) return; e.preventDefault(); startEdit(it.id); });
  li.querySelector(".pencil").addEventListener("click", e => { e.stopPropagation(); if (clickAfterDrag()) return; startEdit(it.id); });
  const star = li.querySelector(".star"); if (star) star.addEventListener("click", e => { e.stopPropagation(); toggleToday(it.id); });
  const kill = li.querySelector(".kill"); if (kill) kill.addEventListener("click", e => { e.stopPropagation(); deleteItem(it.id); });
  const more = li.querySelector(".more"); if (more) more.addEventListener("click", e => { e.stopPropagation(); li.classList.toggle("open"); more.setAttribute("aria-expanded", li.classList.contains("open") ? "true" : "false"); layoutStrikes(li, true); });
  const handle = li.querySelector(".handle"); if (handle) handle.addEventListener("pointerdown", e => { if (e.button !== 0) return; e.preventDefault(); beginDrag(li, e); });
  li.addEventListener("pointerdown", e => longPressStart(li, e));
  li.addEventListener("contextmenu", e => { if (e.pointerType === "touch" || !HOVER.matches) e.preventDefault(); });
  li.addEventListener("animationend", () => { li.classList.remove("kick"); li.classList.remove("arrive"); });
  return li;
}

function updateRow(li, it) {
  const tx = li.querySelector(".tx");
  const changedText = tx.dataset.text !== it.text || tx.dataset.cap !== captionFor(it) || tx.dataset.note !== (it.note || "");
  if (changedText) {
    tx.textContent = it.text;
    tx.dataset.text = it.text; tx.dataset.cap = captionFor(it); tx.dataset.note = it.note || "";
    const cap = captionFor(it);
    if (cap) { const c = document.createElement("span"); c.className = "cap"; c.textContent = cap; tx.appendChild(c); }
    if (it.note) { const n = document.createElement("span"); n.className = "note"; n.textContent = it.note; tx.appendChild(n); }
  }
  li.classList.toggle("done", it.done);
  li.querySelector(".check").setAttribute("aria-checked", it.done ? "true" : "false");
  const star = li.querySelector(".star"); if (star) star.setAttribute("aria-pressed", it.today ? "true" : "false");
  const more = li.querySelector(".more"); if (more) more.hidden = !it.note;
  return changedText;
}
function captionFor(it) { return view === "today" ? M.sectionName(doc, it.sectionId) : ""; }

function renderToday({ animate, quiet }) {
  const list = $("#list");
  const items = todayList();
  const n = items.length;
  list.dataset.count = Math.min(n, 8);
  list.style.setProperty("--unit", n > 8 ? (41 / n) + "vh" : "");
  const keep = new Set();
  const relayout = [];
  for (const it of items) {
    keep.add(it.id);
    let li = rows.get(it.id), fresh = false;
    if (!li) { li = makeRow(it); rows.set(it.id, li); list.appendChild(li); fresh = true; if (quiet && animate && !RM.matches) li.classList.add("arrive"); }
    if (updateRow(li, it) || fresh) relayout.push(li);
    if (!li.parentNode) list.appendChild(li);
  }
  for (const [id, li] of rows) if (!keep.has(id)) { rows.delete(id); if (editing && editing.id === id) cancelEdit(true); li.remove(); }
  orderInto(list, items.map(i => i.id), animate);
  layoutAll(relayout);
  $("#addtoday").hidden = false;
}

function renderAll({ animate, quiet }) {
  const root = $("#all");
  const secs = M.sectionsOrdered(doc);
  const groups = [{ id: "", name: "Unsorted", implicit: !secs.length, collapsed: false }].concat(secs);
  const keepSec = new Set(), keep = new Set(), relayout = [];
  const moves = [];
  for (const g of groups) {
    keepSec.add(g.id);
    let sec = root.querySelector(`.sec[data-id="${CSS.escape(g.id)}"]`);
    if (!sec) { sec = makeSection(g); root.appendChild(sec); }
    updateSection(sec, g);
    const list = sec.querySelector(".seclist");
    const items = M.itemsInSection(doc, g.id);
    for (const it of items) {
      keep.add(it.id);
      let li = rows.get(it.id), fresh = false;
      if (!li) { li = makeRow(it); rows.set(it.id, li); list.appendChild(li); fresh = true; if (quiet && animate && !RM.matches) li.classList.add("arrive"); }
      if (updateRow(li, it) || fresh) relayout.push(li);
      if (li.parentNode !== list) moves.push([li, list]);
    }
    sec.querySelector(".empty").hidden = items.length > 0;
    sec.querySelector(".sec-count").textContent = items.length ? `${items.filter(i => i.done).length}/${items.length}` : "";
    if (g.id === "" && !items.length && !g.implicit) sec.hidden = true; else sec.hidden = false;
    moves.push(["order", list, items.map(i => i.id)]);
  }
  for (const s of $$("#all .sec")) if (!keepSec.has(s.dataset.id)) s.remove();
  for (const [id, li] of rows) if (!keep.has(id)) { rows.delete(id); if (editing && editing.id === id) cancelEdit(true); li.remove(); }
  // FLIP across sections
  const first = new Map();
  if (animate && !RM.matches) for (const li of rows.values()) first.set(li, li.getBoundingClientRect().top);
  for (const m of moves) { if (m[0] === "order") orderInto(m[1], m[2], false); else m[1].appendChild(m[0]); }
  for (const m of moves) if (m[0] === "order") orderInto(m[1], m[2], false);
  if (animate && !RM.matches) for (const [li, top] of first) { const d = top - li.getBoundingClientRect().top; if (d && li.animate) li.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.22,1,.36,1)" }); }
  let addsec = root.querySelector("#addsec");
  if (!addsec) { addsec = document.createElement("button"); addsec.id = "addsec"; addsec.className = "add"; addsec.type = "button"; addsec.textContent = "+ Section"; addsec.addEventListener("click", addSection); }
  root.appendChild(addsec);
  // order sections
  for (const g of groups) { const s = root.querySelector(`.sec[data-id="${CSS.escape(g.id)}"]`); if (s) root.insertBefore(s, addsec); }
  layoutAll(relayout);
}

function makeSection(g) {
  const sec = document.createElement("section");
  sec.className = "sec"; sec.dataset.id = g.id;
  sec.innerHTML = `<h2 class="sec-h"><button class="sec-toggle" type="button" aria-expanded="true"><span class="caret" aria-hidden="true">▾</span><span class="nm"></span></button><span class="sec-count"></span><span class="spacer"></span><button class="chip sec-more" type="button" aria-haspopup="dialog" aria-label="Section options">⋯</button></h2><ol class="seclist" role="list"></ol><div class="empty" hidden>Nothing here yet</div><button class="add" type="button">+ Add</button>`;
  sec.querySelector(".sec-toggle").addEventListener("click", () => toggleCollapse(g.id));
  sec.querySelector(".sec-more").addEventListener("click", () => openSectionMenu(g.id));
  sec.querySelector(".add").addEventListener("click", () => newItem({ sectionId: g.id, today: false }));
  return sec;
}
function updateSection(sec, g) {
  const h = sec.querySelector(".sec-h");
  h.hidden = !!g.implicit;
  sec.querySelector(".nm").textContent = g.name;
  sec.classList.toggle("collapsed", !!g.collapsed && !g.implicit);
  sec.querySelector(".sec-toggle").setAttribute("aria-expanded", g.collapsed ? "false" : "true");
  sec.querySelector(".sec-more").hidden = g.id === "";
}

/** Put the given ids in order inside `container`, FLIP-animating when asked. */
function orderInto(container, ids, animate) {
  const els = ids.map(id => rows.get(id)).filter(Boolean);
  const first = new Map();
  if (animate && !RM.matches) for (const el of els) first.set(el, el.getBoundingClientRect().top);
  for (const el of els) container.appendChild(el);
  if (animate && !RM.matches) for (const [el, top] of first) {
    const d = top - el.getBoundingClientRect().top;
    if (d && el.animate) el.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" });
  }
}

/* strike: one measured overlay per rendered line (v1) */
function layoutStrikes(el, instant) {
  const tx = el.querySelector(".tx");
  const wrap = el.querySelector(".lines");
  if (!tx || !wrap || el.classList.contains("editing")) return;
  const rg = document.createRange();
  const textNode = tx.firstChild;
  if (!textNode || textNode.nodeType !== 3) { wrap.innerHTML = ""; return; }
  rg.selectNodeContents(textNode);
  const rects = rg.getClientRects();
  const base = el.getBoundingClientRect();
  if (instant) el.classList.add("nofx");
  wrap.innerHTML = "";
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (r.width < 1) continue;
    const pos = `left:${r.left - base.left}px;top:${(r.top - base.top) + r.height * 0.555}px;width:${r.width}px`;
    const g = document.createElement("i"); g.className = "ghost"; g.style.cssText = pos;
    const k = document.createElement("i"); k.className = "ink"; k.style.cssText = pos + `;--d:${i * 0.13}s`;
    wrap.appendChild(g); wrap.appendChild(k);
  }
  if (instant) { void el.offsetHeight; requestAnimationFrame(() => el.classList.remove("nofx")); }
}
function layoutAll(only) {
  const els = only && only.length ? only : Array.from(rows.values());
  for (const el of els) layoutStrikes(el, true);
}
let rz = 0;
function relayout() { clearTimeout(rz); rz = setTimeout(() => layoutAll(), 130); }
addEventListener("resize", relayout);
if (window.ResizeObserver) new ResizeObserver(relayout).observe($("#main"));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layoutAll());
if (document.fonts) document.fonts.addEventListener("loadingdone", () => layoutAll());

function paint() {
  const t = todayList(), n = t.length, d = t.filter(i => i.done).length;
  $("#count").innerHTML = `<b>${d}</b>/${n}`;
  const fill = $("#fill");
  fill.style.width = (n ? (d / n * 100) : 0) + "%";
  fill.classList.toggle("full", n > 0 && d === n);
  const fs = document.fullscreenEnabled ? " &nbsp;·&nbsp; <em>F</em> full screen" : "";
  $("#hint").innerHTML = view === "today"
    ? `<em>1–${Math.min(n, 9)}</em> check off &nbsp;·&nbsp; <em>N</em> new &nbsp;·&nbsp; <em>E</em> edit &nbsp;·&nbsp; <em>A</em> everything &nbsp;·&nbsp; <em>T</em> theme &nbsp;·&nbsp; <em>M</em> mute${fs} &nbsp;·&nbsp; <em>?</em> help`
    : `<em>A</em> today &nbsp;·&nbsp; <em>N</em> new &nbsp;·&nbsp; <em>E</em> edit &nbsp;·&nbsp; <em>⌥↑↓</em> move &nbsp;·&nbsp; <em>?</em> help`;
  const fin = $("#finale"), hint = $("#hint");
  if (view === "today" && allDoneToday() && !editing) { fin.classList.add("on"); hint.classList.add("off"); }
  else { fin.classList.remove("on"); hint.classList.remove("off"); }
  $("#streak-k").textContent = (s => s ? s + " day" + (s > 1 ? "s" : "") : "")(M.streak(doc));
}

function paintStatus(s) {
  syncStatus = s;
  const dot = $("#dot");
  dot.dataset.s = s;
  const label = { synced: "Synced", syncing: "Syncing", offline: "Offline", error: "Sync trouble — will retry", gone: "This link no longer works", off: "Sync off — finish setup" }[s] || s;
  dot.querySelector(".lbl").textContent = label;
  dot.setAttribute("title", label);
  $("#dot-sr").textContent = label;
}

/* ---------------- changes ---------------- */
function afterChange({ animate = true, delay = 0 } = {}) {
  doc.updatedAt = M.now();
  if (sync) sync.update(doc); else saveLocal(listId, { doc, rev: 0, dirty: true, created: true });
  if (delay) setTimeout(() => render({ animate }), delay); else render({ animate });
  paintListName();
}
function applyRemote() {
  // quiet: no sound, no confetti, no kick; rows animate into place
  const nowAll = allDoneToday();
  render({ animate: true, quiet: true });
  wasAll = nowAll;
  paintListName();
  if (editing && !doc.items[editing.id]) cancelEdit(true);
}

function toggle(id, px, py, fromPointer) {
  const it = doc.items[id]; if (!it || it.deleted) return;
  if (editing) { if (editing.id === id) return; commitEdit(); }
  const li = rows.get(id);
  pushUndo(it.done ? "Undone" : "Done", [id]);
  it.done = !it.done; it.doneAt = it.done ? M.now() : 0; it.updatedAt = M.now();
  if (li) { li.classList.toggle("done", it.done); li.querySelector(".check").setAttribute("aria-checked", it.done ? "true" : "false"); }
  if (it.done) {
    sound.check(Math.max(0, (view === "today" ? doneCountToday() : M.itemsInSection(doc, it.sectionId).filter(i => i.done).length) - 1));
    if (li && !RM.matches) {
      const bx = li.querySelector(".box");
      li.classList.remove("kick"); bx.classList.remove("pop"); void li.offsetWidth;
      li.classList.add("kick"); bx.classList.add("pop");
      bx.addEventListener("animationend", function h() { bx.classList.remove("pop"); bx.removeEventListener("animationend", h); });
    }
    let x = px, y = py;
    if (!fromPointer || typeof x !== "number" || (x === 0 && y === 0)) {
      const r = (li ? li.querySelector(".tx") : document.body).getBoundingClientRect();
      x = Math.min(r.right, innerWidth - 40); y = r.top + r.height * 0.5;
    }
    if (view === "today") fx.burst(x, y, 46, 13, 2.0); else fx.burst(x, y, 18, 9, 1.6);
    toast("Done", { undo: true });
  } else {
    sound.uncheck();
  }
  afterChange({ animate: true, delay: it.done ? 520 : 200 });
  paint();
  if (view === "today") {
    const now = allDoneToday();
    if (now && !wasAll) setTimeout(() => {
      sound.finish(); fx.volley();
      const g = $("#glow"); g.classList.add("flare"); setTimeout(() => g.classList.remove("flare"), 900);
    }, 640);
    wasAll = now;
  }
}

function toggleToday(id) {
  const it = doc.items[id]; if (!it || it.deleted) return;
  it.today = !it.today;
  if (it.today) it.todayOrder = M.lastOrder(todayList(), i => i.todayOrder);
  it.updatedAt = M.now();
  sound.tick();
  afterChange();
}

function newItem({ sectionId = "", today = view === "today", afterId = null } = {}) {
  if (editing) commitEdit();
  const id = M.shortId();
  const ts = M.now();
  const sectionItems = M.itemsInSection(doc, sectionId).filter(i => !i.done);
  const tItems = todayList().filter(i => !i.done);
  let order, todayOrder;
  const after = afterId ? doc.items[afterId] : null;
  if (after && !after.deleted) {
    const nextSec = sectionItems[sectionItems.findIndex(i => i.id === afterId) + 1];
    order = M.orderBetween(after.order, nextSec ? nextSec.order : undefined);
    const nextT = tItems[tItems.findIndex(i => i.id === afterId) + 1];
    todayOrder = M.orderBetween(after.todayOrder, nextT ? nextT.todayOrder : undefined);
    if (order === null) { renumber(sectionId, "order"); order = M.orderBetween(doc.items[afterId].order, undefined); }
    if (todayOrder === null) { renumber(null, "todayOrder"); todayOrder = M.orderBetween(doc.items[afterId].todayOrder, undefined); }
    sectionId = after.sectionId;
  } else {
    order = M.lastOrder(sectionItems, i => i.order);
    todayOrder = M.lastOrder(tItems, i => i.todayOrder);
  }
  doc.items[id] = { id, sectionId, text: "", note: "", done: false, doneAt: 0, today, order, todayOrder, updatedAt: ts };
  if (view === "today" && !today) doc.items[id].today = true;
  render({ animate: false });
  startEdit(id, { isNew: true });
}

function renumber(sectionId, key) {
  const items = sectionId === null ? todayList().filter(i => !i.done) : M.itemsInSection(doc, sectionId).filter(i => !i.done);
  items.forEach((i, idx) => { i[key] = (idx + 1) * 1000; i.updatedAt = M.now(); });
}

function deleteItem(id, { silent = false } = {}) {
  const it = doc.items[id]; if (!it || it.deleted) return;
  if (editing && editing.id === id) { editing = null; }
  if (!silent) pushUndo("Deleted", [id]);
  const text = it.text;
  doc.items[id] = { id, deleted: true, updatedAt: M.now() };
  afterChange({ animate: true });
  if (!silent) toast(`Deleted “${text.length > 40 ? text.slice(0, 40) + "…" : text}”`, { undo: true });
}

/* ---------------- undo ---------------- */
function pushUndo(label, ids, secIds = []) {
  undoStack.push({ label, items: ids.map(id => [id, doc.items[id] ? JSON.parse(JSON.stringify(doc.items[id])) : null]), sections: secIds.map(id => [id, doc.sections[id] ? JSON.parse(JSON.stringify(doc.sections[id])) : null]) });
  if (undoStack.length > 60) undoStack.shift();
}
function undo() {
  const u = undoStack.pop();
  if (!u) return;
  if (editing) cancelEdit();
  const ts = M.now();
  for (const [id, rec] of u.items) doc.items[id] = rec ? { ...rec, updatedAt: ts } : { id, deleted: true, updatedAt: ts };
  for (const [id, rec] of u.sections) doc.sections[id] = rec ? { ...rec, updatedAt: ts } : { id, deleted: true, updatedAt: ts };
  sound.uncheck();
  afterChange();
  wasAll = allDoneToday();
  toast("Undone");
}

function toast(msg, { undo: withUndo = false } = {}) {
  const t = $("#toast");
  t.querySelector(".msg").textContent = msg;
  $("#toast-undo").hidden = !withUndo;
  t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, withUndo ? 4500 : 2200);
}
function hideToast() { $("#toast").classList.remove("on"); }

/* ---------------- inline editing ---------------- */
function startEdit(id, { isNew = false } = {}) {
  const it = doc.items[id]; if (!it || it.deleted) return;
  if (editing) { if (editing.id === id) return; commitEdit(); }
  const li = rows.get(id); if (!li) return;
  li.classList.add("editing");
  const tx = li.querySelector(".tx");
  const ta = document.createElement("textarea");
  ta.className = "einput"; ta.rows = 1; ta.value = it.text; ta.maxLength = M.TEXT_MAX;
  ta.placeholder = "What needs doing?"; ta.setAttribute("aria-label", "Edit line"); ta.spellcheck = true;
  const note = document.createElement("input");
  note.type = "text"; note.className = "einput note-in"; note.value = it.note || ""; note.maxLength = M.NOTE_MAX;
  note.placeholder = "Note (optional)"; note.setAttribute("aria-label", "Note");
  note.style.cssText = "font-family:var(--font-ui);font-weight:400;font-size:clamp(12px,.36em,15px);letter-spacing:.02em;margin-top:.2em;padding:.35em .6em;";
  tx.hidden = true;
  tx.after(ta); ta.after(note);
  const grow = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
  ta.addEventListener("input", grow);
  ta.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const cur = editing; const had = ta.value.trim(); commitEdit(); if (had) newItem({ afterId: cur.id, sectionId: doc.items[cur.id] ? doc.items[cur.id].sectionId : "" }); }
    else if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
    else if (e.key === "Backspace" && ta.value === "") { e.preventDefault(); const cur = editing; editing = null; li.classList.remove("editing"); deleteItem(cur.id, { silent: cur.isNew || !cur.orig }); focusRow(neighbourOf(cur.id)); }
    else if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); note.focus(); }
  });
  note.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
    else if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
    else if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); ta.focus(); }
  });
  const onBlur = () => setTimeout(() => { if (editing && editing.id === id && document.activeElement !== ta && document.activeElement !== note) commitEdit(); }, 0);
  ta.addEventListener("blur", onBlur); note.addEventListener("blur", onBlur);
  editing = { id, el: li, ta, note, isNew, orig: it.text, origNote: it.note || "" };
  li.querySelector(".lines").innerHTML = "";
  grow();
  ta.focus();
  if (!isNew) ta.setSelectionRange(ta.value.length, ta.value.length);
  paint();
}
/** Ids of the rows the user can currently see, top to bottom. */
function visibleRowIds() {
  const sel = view === "today" ? "#list .row" : "#all .sec:not([hidden]):not(.collapsed) .row";
  return $$(sel).map(li => li.dataset.id);
}
function neighbourOf(id) {
  const ids = visibleRowIds();
  const i = ids.indexOf(id);
  return ids[i - 1] || ids[i + 1] || null;
}
function endEditDom() {
  const e = editing; if (!e) return;
  e.ta.remove(); e.note.remove();
  const tx = e.el.querySelector(".tx"); tx.hidden = false;
  e.el.classList.remove("editing");
  editing = null;
}
function commitEdit() {
  const e = editing; if (!e) return;
  const text = e.ta.value.trim().replace(/\s+/g, " ");
  const note = e.note.value.trim();
  const it = doc.items[e.id];
  endEditDom();
  if (!it || it.deleted) return;
  if (!text) { deleteItem(e.id, { silent: e.isNew || !e.orig }); return; }
  if (text !== it.text || note !== (it.note || "")) {
    if (!e.isNew) pushUndo("Edited", [e.id]);
    it.text = text; it.note = note; it.updatedAt = M.now();
    afterChange({ animate: false });
  } else {
    render({ animate: false });
  }
  layoutStrikes(e.el, true);
  focusRow(e.id);
}
function cancelEdit(silent) {
  const e = editing; if (!e) return;
  endEditDom();
  if (e.isNew) { deleteItem(e.id, { silent: true }); return; }
  render({ animate: false });
  if (!silent) focusRow(e.id);
}
function focusRow(id) {
  const li = id && rows.get(id);
  if (li) { const b = li.querySelector(".check"); if (b) b.focus({ preventScroll: false }); lastRowId = id; }
}
function focusedRowId() {
  const a = document.activeElement;
  const li = a && a.closest ? a.closest(".row") : null;
  if (li && li.dataset.id) return li.dataset.id;
  if (lastRowId && rows.has(lastRowId)) return lastRowId;
  return visibleRowIds()[0] || null;
}

/* ---------------- sections ---------------- */
let secMenuId = null;
async function addSection() {
  const name = await ask({ title: "New section", label: "Name", value: "" });
  if (!name) return;
  const id = M.shortId();
  const secs = M.sectionsOrdered(doc);
  doc.sections[id] = { id, name: name.trim().slice(0, 60), order: M.lastOrder(secs, s => s.order), collapsed: false, updatedAt: M.now() };
  afterChange({ animate: false });
}
function toggleCollapse(id) {
  const s = doc.sections[id]; if (!s || s.deleted) return;
  s.collapsed = !s.collapsed; s.updatedAt = M.now();
  afterChange({ animate: false });
}
function openSectionMenu(id) { secMenuId = id; showPanel("p-sec"); }
async function sectionAction(act) {
  const s = doc.sections[secMenuId]; if (!s || s.deleted) return;
  closePanel();
  if (act === "rename") {
    const name = await ask({ title: "Rename section", label: "Name", value: s.name });
    if (name && name.trim() && name.trim() !== s.name) { s.name = name.trim().slice(0, 60); s.updatedAt = M.now(); afterChange({ animate: false }); }
  } else if (act === "up" || act === "down") {
    const secs = M.sectionsOrdered(doc);
    const i = secs.findIndex(x => x.id === s.id);
    const j = act === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= secs.length) return;
    const other = secs[j];
    const tmp = s.order; s.order = other.order; other.order = tmp;
    if (s.order === other.order) { secs.forEach((x, k) => { x.order = (k + 1) * 1000; }); const o = s.order; s.order = other.order; other.order = o; }
    s.updatedAt = M.now(); other.updatedAt = M.now();
    afterChange();
  } else if (act === "delete") {
    const ok = await ask({ title: "Delete section?", msg: `“${s.name}” goes away. Its lines move to Unsorted.`, confirm: "Delete", danger: true });
    if (!ok) return;
    pushUndo("Deleted section", [], [s.id]);
    doc.sections[s.id] = { id: s.id, deleted: true, updatedAt: M.now() };
    afterChange();
    toast(`Deleted “${s.name}”`, { undo: true });
  }
}

/* ---------------- keyboard move ---------------- */
function moveFocused(dir) {
  const id = focusedRowId(); if (!id) return;
  const it = doc.items[id]; if (!it || it.deleted || it.done) return;
  if (view === "today") {
    const list = todayList().filter(i => !i.done);
    const i = list.findIndex(x => x.id === id), j = i + dir;
    if (j < 0 || j >= list.length) return;
    const prev = list[dir > 0 ? j : j - 1], next = list[dir > 0 ? j + 1 : j];
    let o = M.orderBetween(prev && prev !== it ? prev.todayOrder : (dir > 0 ? list[j].todayOrder : undefined), next && next !== it ? next.todayOrder : (dir < 0 ? list[j].todayOrder : undefined));
    if (o === null) { renumber(null, "todayOrder"); return moveFocused(dir); }
    it.todayOrder = o;
  } else {
    const secs = [{ id: "" }].concat(M.sectionsOrdered(doc));
    const si = secs.findIndex(s => s.id === (doc.sections[it.sectionId] && !doc.sections[it.sectionId].deleted ? it.sectionId : ""));
    const list = M.itemsInSection(doc, secs[si].id).filter(i => !i.done);
    const i = list.findIndex(x => x.id === id), j = i + dir;
    if (j < 0 || j >= list.length) {
      const target = secs[si + dir]; if (!target) return;
      const tl = M.itemsInSection(doc, target.id).filter(i => !i.done);
      it.sectionId = target.id;
      it.order = dir > 0 ? M.orderBetween(undefined, tl[0] ? tl[0].order : undefined) : M.lastOrder(tl, x => x.order);
    } else {
      const prev = dir > 0 ? list[j] : list[j - 1], next = dir > 0 ? list[j + 1] : list[j];
      const o = M.orderBetween(prev ? prev.order : undefined, next ? next.order : undefined);
      if (o === null) { renumber(secs[si].id, "order"); return moveFocused(dir); }
      it.order = o;
    }
  }
  it.updatedAt = M.now();
  afterChange();
  focusRow(id);
}

/* ---------------- drag ---------------- */
const downPointers = new Set();
document.addEventListener("pointerdown", e => downPointers.add(e.pointerId), true);
document.addEventListener("pointerup", e => downPointers.delete(e.pointerId), true);
document.addEventListener("pointercancel", e => downPointers.delete(e.pointerId), true);
let dragEndedAt = -1e9; // no drag has ended yet
function longPressStart(li, e) {
  if (e.pointerType !== "touch" || e.button !== 0) return;
  if (editing || drag || e.target.closest(".tool")) return;
  const id = li.dataset.id, it = doc.items[id];
  if (!it || it.done) return;
  const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
  let t = 0;
  const cancel = () => { clearTimeout(t); li.removeEventListener("pointermove", onMove); li.removeEventListener("pointerup", cancel); li.removeEventListener("pointercancel", cancel); };
  const onMove = ev => { if (ev.pointerId === pid && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) cancel(); };
  t = setTimeout(() => {
    cancel();
    if (!downPointers.has(pid) || drag || editing) return; // finger already lifted, or something else started
    try { navigator.vibrate && navigator.vibrate(12); } catch (x) { /* ignore */ }
    beginDrag(li, e, true);
  }, 400);
  li.addEventListener("pointermove", onMove);
  li.addEventListener("pointerup", cancel);
  li.addEventListener("pointercancel", cancel);
}
/** The click that follows a touch drag (lift without moving) must not check the line off. */
function clickAfterDrag() { return !!drag || (performance.now() - dragEndedAt) < 600; }
const preventTouch = e => { if (drag) e.preventDefault(); };
function beginDrag(li, e, fromLongPress) {
  if (drag || editing) return;
  const id = li.dataset.id, it = doc.items[id];
  if (!it || it.deleted || it.done) return;
  const rect = li.getBoundingClientRect();
  drag = { id, li, offY: e.clientY - rect.top, startTop: rect.top, pointerId: e.pointerId, overSec: null, lastY: e.clientY, raf: 0 };
  li.classList.add("dragging"); document.body.classList.add("is-dragging");
  try { li.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
  document.addEventListener("touchmove", preventTouch, { passive: false });
  const move = ev => { drag.lastY = ev.clientY; if (!drag.raf) drag.raf = requestAnimationFrame(dragStep); };
  const up = () => endDrag(move, up, cancelled, false);
  const cancelled = () => endDrag(move, up, cancelled, true); // the system took the touch: put the row back, commit nothing
  li.addEventListener("pointermove", move);
  li.addEventListener("pointerup", up);
  li.addEventListener("pointercancel", cancelled);
  drag.move = move; drag.up = up; drag.cancelled = cancelled;
  dragStep();
}
function dragStep() {
  if (!drag) return;
  drag.raf = 0;
  const y = drag.lastY, li = drag.li;
  // measure without the current transform, so the offset is always relative to the row's real slot
  li.style.transform = "";
  // autoscroll
  const scroller = view === "today" ? $("#list") : $("#all");
  const sr = scroller.getBoundingClientRect();
  if (y < sr.top + 40) scroller.scrollTop -= 8; else if (y > sr.bottom - 40) scroller.scrollTop += 8;
  // candidates: undone rows in visible lists (not the dragged one)
  const lists = view === "today" ? [$("#list")] : $$("#all .sec:not([hidden]) .seclist");
  let placed = false;
  for (const list of lists) {
    const sec = list.closest(".sec");
    const lr = list.getBoundingClientRect();
    const head = sec ? sec.querySelector(".sec-h") : null;
    const hr = head && !head.hidden ? head.getBoundingClientRect() : lr;
    const within = y >= Math.min(hr.top, lr.top) - 6 && y <= Math.max(lr.bottom, hr.bottom) + 30;
    if (sec) sec.classList.toggle("over", within && list !== li.parentNode);
    if (!within || placed) continue;
    const rowsHere = Array.from(list.children).filter(r => r !== li && r.classList.contains("row") && !r.classList.contains("done"));
    let target = null, before = false;
    for (const r of rowsHere) { const rr = r.getBoundingClientRect(); if (y < rr.top + rr.height / 2) { target = r; before = true; break; } }
    if (!target) {
      const lastUndone = rowsHere[rowsHere.length - 1];
      const firstDone = Array.from(list.children).find(r => r !== li && r.classList.contains("done"));
      if (firstDone && !lastUndone) { target = firstDone; before = true; }
      else if (lastUndone) { target = lastUndone; before = false; }
    }
    let ref = null, needMove = false;
    if (target) { ref = before ? target : target.nextSibling; needMove = before ? target.previousSibling !== li : target.nextSibling !== li; }
    else { ref = list.firstChild; needMove = li.parentNode !== list; }
    if (needMove) domMove(li, list, ref);
    placed = true;
  }
  const nb = li.getBoundingClientRect();
  li.style.transform = `translateY(${y - drag.offY - nb.top}px)`;
  drag.raf = 0;
}
/** Move the dragged row in the DOM, FLIP-animating the rows it displaces, and re-take pointer capture
    (a DOM move is a remove + insert, which releases the capture). */
function domMove(li, list, ref) {
  const from = li.parentNode;
  const affected = new Set([...(from ? from.children : []), ...list.children]);
  affected.delete(li);
  const first = new Map();
  if (!RM.matches) for (const el of affected) if (el.classList && el.classList.contains("row")) first.set(el, el.getBoundingClientRect().top);
  list.insertBefore(li, ref);
  if (drag) { try { li.setPointerCapture(drag.pointerId); } catch (e) { /* pointer already gone */ } }
  for (const [el, top] of first) {
    const d = top - el.getBoundingClientRect().top;
    if (d && el.animate) el.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(.22,1,.36,1)" });
  }
}
function endDrag(move, up, cancelled, aborted) {
  if (!drag) return;
  const { id, li } = drag;
  li.removeEventListener("pointermove", move); li.removeEventListener("pointerup", up); li.removeEventListener("pointercancel", cancelled);
  document.removeEventListener("touchmove", preventTouch);
  try { li.releasePointerCapture(drag.pointerId); } catch (x) { /* ignore */ }
  li.classList.remove("dragging"); document.body.classList.remove("is-dragging");
  li.style.transform = "";
  $$("#all .sec.over").forEach(s => s.classList.remove("over"));
  drag = null;
  dragEndedAt = performance.now();
  if (aborted) { render({ animate: false }); return; }
  // derive the new position from the DOM
  const it = doc.items[id]; if (!it || it.deleted) return;
  const list = li.parentNode;
  const sib = Array.from(list.children).filter(r => r !== li && r.classList.contains("row") && !r.classList.contains("done"));
  const idx = Array.from(list.children).indexOf(li);
  const prevEl = Array.from(list.children).slice(0, idx).reverse().find(r => r.classList.contains("row") && !r.classList.contains("done"));
  const nextEl = Array.from(list.children).slice(idx + 1).find(r => r.classList.contains("row") && !r.classList.contains("done"));
  const key = view === "today" ? "todayOrder" : "order";
  const prev = prevEl ? doc.items[prevEl.dataset.id] : null, next = nextEl ? doc.items[nextEl.dataset.id] : null;
  let o = M.orderBetween(prev ? prev[key] : undefined, next ? next[key] : undefined);
  const secId = view === "today" ? it.sectionId : list.closest(".sec").dataset.id;
  if (o === null) { renumber(view === "today" ? null : secId, key); o = M.orderBetween(prev ? prev[key] : undefined, next ? next[key] : undefined) || M.lastOrder(sib.map(r => doc.items[r.dataset.id]), i => i[key]); }
  const changed = it[key] !== o || (view === "all" && it.sectionId !== secId);
  if (!changed) { render({ animate: false }); return; }
  pushUndo("Moved", [id]);
  it[key] = o;
  if (view === "all") it.sectionId = secId;
  it.updatedAt = M.now();
  sound.tick();
  afterChange({ animate: false });
  focusRow(id);
}

/* ---------------- panels ---------------- */
function showPanel(id) {
  const d = document.getElementById(id);
  if (openPanel && openPanel !== d) openPanel.close();
  openPanel = d;
  if (!d.open) d.showModal();
}
function closePanel() { if (openPanel) { openPanel.close(); } }
$$("dialog.panel").forEach(d => {
  d.addEventListener("close", () => { if (openPanel === d) openPanel = null; });
  d.addEventListener("click", e => { if (e.target === d) d.close(); });
  d.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => d.close()));
});
function ask({ title, msg = "", label = "", value = "", confirm = "OK", danger = false }) {
  return new Promise(resolve => {
    const d = $("#ask");
    $("#ask-title").textContent = title;
    $("#ask-msg").textContent = msg; $("#ask-msg").hidden = !msg;
    const field = $("#ask-field"), input = $("#ask-input");
    field.hidden = !label; input.value = value; input.setAttribute("aria-label", label || title);
    $("#ask-ok").textContent = confirm;
    $("#ask-ok").classList.toggle("danger", danger);
    let done = false;
    const finish = v => { if (done) return; done = true; resolve(v); };
    const form = $("#ask-form");
    const onSubmit = e => { e.preventDefault(); finish(label ? input.value : true); d.close(); };
    const onClose = () => { form.removeEventListener("submit", onSubmit); d.removeEventListener("close", onClose); finish(null); };
    form.addEventListener("submit", onSubmit);
    d.addEventListener("close", onClose);
    showPanel("ask");
    if (label) { input.focus(); input.select(); } else $("#ask-ok").focus();
  });
}

/* menu */
$("#more").addEventListener("click", () => { paintMenu(); showPanel("p-menu"); });
function paintMenu() {
  $("#wake-k").textContent = dev.wake ? "On" : "Off";
  $('#p-menu [data-act="wake"]').setAttribute("aria-pressed", dev.wake ? "true" : "false");
  $('#p-menu [data-act="wake"]').hidden = !("wakeLock" in navigator);
  $("#mute-k").textContent = dev.muted ? "Off" : "On";
  $('#p-menu [data-act="mute"]').setAttribute("aria-pressed", dev.muted ? "true" : "false");
  $("#volume").value = Math.round(dev.volume * 100);
  $('#p-menu [data-act="full"]').hidden = !document.fullscreenEnabled;
}
$("#p-menu").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "share") { closePanel(); openShare(); }
  else if (act === "wake") { setWake(!dev.wake); paintMenu(); }
  else if (act === "theme") { closePanel(); openTheme(); }
  else if (act === "mute") { toggleMute(); paintMenu(); }
  else if (act === "full") { closePanel(); toggleFullscreen(); }
  else if (act === "history") { closePanel(); openHistory(); }
  else if (act === "lists") { closePanel(); openLists(); }
  else if (act === "help") { closePanel(); showPanel("p-help"); }
});
$("#volume").addEventListener("input", e => { dev.volume = (+e.target.value) / 100; saveDevice(); });
$("#volume").addEventListener("change", () => { if (!dev.muted) sound.tick(); });

/* wake lock */
async function setWake(on) {
  dev.wake = !!on; saveDevice();
  if (on) await requestWake(); else if (wakeLock) { try { await wakeLock.release(); } catch (e) { /* ignore */ } wakeLock = null; }
}
async function requestWake() {
  if (!("wakeLock" in navigator) || !dev.wake || document.visibilityState !== "visible") return;
  try { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); }
  catch (e) { wakeLock = null; }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") { if (dev.wake && !wakeLock) requestWake(); tickDay(); }
});
if (dev.wake) requestWake();

/* rollover + date, once a minute */
function tickDay() {
  paintDate();
  if (!doc) return;
  const r = M.rollover(doc);
  if (r.moved.length) { doc = r.doc; afterChange({ animate: true }); wasAll = allDoneToday(); }
}
setInterval(() => { tickDay(); retryPendingKills(); }, 60000);

/* share / QR */
async function openShare() {
  if (!doc) return;
  const link = BASE + "#/l/" + listId;
  $("#share-link").textContent = link;
  const off = !transport;
  $("#share-msg").textContent = off
    ? "Sync isn't set up yet, so this link would open an empty list on another device. Follow SETUP.md first."
    : "Scan this with your phone's camera, or send yourself the link. Anyone with the link can read and edit the list, so treat it like a password.";
  $("#qr").hidden = off;
  $("#share-rotate").hidden = off;
  if (!off) {
    const { default: qrcode } = await import("./qr.js");
    const q = qrcode(0, "M"); q.addData(link); q.make();
    const n = q.getModuleCount(), scale = Math.max(4, Math.floor(220 / n)), quiet = 2;
    const c = $("#qr-c"), size = (n + quiet * 2) * scale;
    c.width = size; c.height = size; c.style.width = c.style.height = size + "px";
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, size, size); g.fillStyle = "#111";
    for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.isDark(r, col)) g.fillRect((col + quiet) * scale, (r + quiet) * scale, scale, scale);
  }
  showPanel("p-share");
}
$("#share-copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#share-link").textContent); toast("Link copied"); } catch (e) { toast("Select the link and copy it"); }
});
$("#share-rotate").addEventListener("click", async () => {
  closePanel();
  if (syncStatus !== "synced") { toast("Rotate needs a live connection — try again once synced"); return; }
  const ok = await ask({ title: "Rotate link?", msg: "A new secret link replaces this one. The old link stops working everywhere, including your other devices — open the new one there.", confirm: "Rotate", danger: true });
  if (!ok) return;
  await rotateLink();
});
async function rotateLink() {
  const oldId = listId;
  const newId = M.newId();
  if (sync) await sync.flush();
  const copy = M.normalize(JSON.parse(JSON.stringify(doc)), newId);
  copy.updatedAt = M.now();
  saveLocal(newId, { doc: copy, rev: 0, dirty: true, created: true });
  const old = meta.lists.find(l => l.id === oldId);
  registerList(newId, old ? old.name : "");
  meta.lists = meta.lists.filter(l => l.id !== oldId);
  meta.dead = Array.from(new Set([...(meta.dead || []), oldId]));
  meta.redirect = { ...(meta.redirect || {}), [oldId]: newId };
  await openList(newId);
  // let the new list land, then kill the old one; if that fails, remember to retry
  if (sync) await sync.flush();
  removeLocal(oldId);
  const dead = await killRemote(oldId);
  if (IOS && !STANDALONE) {
    // Safari memoised the manifest at load; reload so an Add to Home Screen now carries the new id
    sessionStorage.setItem("tf/reopenShare", "1");
    reloading = true; location.replace(BASE + SEARCH + "#/l/" + newId); location.reload();
    return;
  }
  toast(dead ? "New link ready" : "New link ready — old link not revoked yet, will retry");
  openShare();
}
async function killRemote(id) {
  if (!transport) { queueKill(id); return false; }
  try {
    await sync.remove(id);
    sync.announceGone(id);
    meta.pendingKill = (meta.pendingKill || []).filter(x => x !== id); saveDevice();
    return true;
  } catch (e) { queueKill(id); return false; }
}
function queueKill(id) { meta.pendingKill = Array.from(new Set([...(meta.pendingKill || []), id])); saveDevice(); }
let killing = false;
async function retryPendingKills() {
  if (killing || !transport || !(meta.pendingKill || []).length || !navigator.onLine) return;
  killing = true;
  try { for (const id of [...meta.pendingKill]) await killRemote(id); } finally { killing = false; }
}
addEventListener("online", () => setTimeout(retryPendingKills, 1500));

/* lists */
function openLists() {
  const menu = $("#lists-menu"); menu.innerHTML = "";
  const active = meta.lists.filter(l => !l.archived), archived = meta.lists.filter(l => l.archived);
  const mk = (l, arch) => {
    const b = document.createElement("button"); b.type = "button";
    const loc = loadLocal(l.id);
    const name = (loc && loc.doc.name) || l.name || "Untitled list";
    b.innerHTML = `<span class="${l.id === listId ? "cur" : ""}">${escapeHtml(name)}${arch ? ' <span class="sub">archived</span>' : ""}</span><span class="id">${l.id.slice(0, 6)}…</span>`;
    b.addEventListener("click", () => { closePanel(); if (arch) { l.archived = false; saveDevice(); } switchTo(l.id); });
    return b;
  };
  active.forEach(l => menu.appendChild(mk(l, false)));
  archived.forEach(l => menu.appendChild(mk(l, true)));
  $("#l-archive").hidden = active.length < 2 || !listId;
  $("#l-rename").hidden = !listId;
  showPanel("p-lists");
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
$("#l-new").addEventListener("click", async () => {
  closePanel();
  const name = await ask({ title: "New list", label: "Name", value: "" });
  if (name === null) return;
  const id = M.newId();
  const d = M.emptyDoc(id, (name || "").trim().slice(0, 60));
  saveLocal(id, { doc: d, rev: 0, dirty: true, created: true });
  registerList(id, d.name);
  switchTo(id);
});
$("#l-rename").addEventListener("click", async () => {
  closePanel();
  const name = await ask({ title: "Rename list", label: "Name", value: doc.name || "" });
  if (name === null) return;
  doc.name = name.trim().slice(0, 60); doc.nameAt = M.now();
  const e = meta.lists.find(l => l.id === listId); if (e) e.name = doc.name;
  saveDevice();
  afterChange({ animate: false });
});
$("#l-archive").addEventListener("click", async () => {
  closePanel();
  const e = meta.lists.find(l => l.id === listId); if (!e) return;
  await flushQuick();
  e.archived = true; saveDevice();
  const next = meta.lists.find(l => !l.archived);
  if (next) switchTo(next.id); else showWelcome();
});
$("#l-paste-go").addEventListener("click", () => { const id = parseLink($("#l-paste").value); if (!id) { toast("That doesn't look like a list link"); return; } closePanel(); switchTo(id); });
function parseLink(s) {
  const m = String(s || "").trim().match(/#\/l\/([0-9A-Za-z]{22,64})/) || String(s || "").trim().match(/^([0-9A-Za-z]{22,64})$/);
  return m ? m[1] : null;
}
function switchTo(id) {
  if (id === listId) return;
  if (listId && syncStatus === "gone") { meta.redirect = { ...(meta.redirect || {}), [listId]: id }; }
  meta.current = id; saveDevice();
  if (IOS && !STANDALONE) {
    reloading = true;
    const target = BASE + SEARCH + "#/l/" + id;
    if (location.origin + location.pathname === BASE) { flushQuick().then(() => { location.replace(target); location.reload(); }); }
    else location.replace(target); // path changes (…/index.html): this is a real navigation, no reload needed
    return;
  }
  openList(id);
}
$("#listname").addEventListener("click", openLists);
$("#w-new").addEventListener("click", () => {
  const id = M.newId();
  const d = M.seedDoc(id);
  saveLocal(id, { doc: d, rev: 0, dirty: true, created: true });
  registerList(id, "");
  switchTo(id);
});
$("#w-paste-form").addEventListener("submit", e => {
  e.preventDefault();
  const id = parseLink($("#w-paste").value);
  if (!id) { $("#w-err").textContent = "That doesn't look like a list link. It ends in #/l/ followed by 22 letters and digits."; return; }
  switchTo(id);
});

/* history */
function openHistory() {
  const s = M.streak(doc);
  $("#history-streak").textContent = s ? `${s}-day streak` : "No streak yet";
  const root = $("#history-days"); root.innerHTML = "";
  const days = M.historyDays(doc).slice(0, 60);
  if (!days.length) { root.innerHTML = '<p>Nothing finished on a previous day yet. Finished lines move here at the start of the next day.</p>'; }
  for (const day of days) {
    const d = document.createElement("div"); d.className = "day";
    const h = document.createElement("h4"); h.textContent = new Date(day + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const ul = document.createElement("ul");
    for (const e of doc.history[day]) {
      const li = document.createElement("li");
      const t = document.createElement("span"); t.className = "t"; t.textContent = new Date(e.doneAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      const x = document.createElement("span"); x.textContent = e.text + (e.section ? " · " + e.section : "");
      li.appendChild(t); li.appendChild(x); ul.appendChild(li);
    }
    d.appendChild(h); d.appendChild(ul); root.appendChild(d);
  }
  showPanel("p-history");
}

/* theme panel */
let custom = { accent: "#D26128", base: "dark", pair: "", name: "" };
function openTheme() {
  renderSwatches();
  if (theme && theme.kind === "custom") custom = { accent: theme.accent, base: theme.base, pair: theme.pair, name: theme.name };
  paintCustom();
  showPanel("p-theme");
}
$("#theme").addEventListener("click", openTheme);
function savedThemes() { return Object.values(doc ? doc.themes : {}).filter(t => !t.deleted).map(t => ({ ...t, theme: T.parseCode(t.code) })).filter(t => t.theme); }
function renderSwatches() {
  const root = $("#swatches"); root.innerHTML = "";
  const cur = theme ? T.themeCode(theme) : "";
  const mk = (t, saved) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "swatch";
    b.style.background = t.colors.ink; b.style.color = t.colors.text; b.style.borderColor = t.colors.hairSolid;
    b.setAttribute("aria-pressed", T.themeCode(t) === cur ? "true" : "false");
    const bar = document.createElement("span"); bar.className = "bar"; bar.style.background = t.colors.accent;
    const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = saved ? saved.name : t.name; nm.style.fontFamily = (T.pairOf(t.pair) || T.PAIRS.lato).task[2];
    const sm = document.createElement("span"); sm.className = "sm"; sm.textContent = t.base + (saved ? " · yours" : ""); sm.style.color = t.colors.dim;
    b.append(bar, nm, sm);
    b.addEventListener("click", () => chooseTheme(saved ? { ...t, name: saved.name } : t));
    if (saved) {
      const del = document.createElement("button"); del.type = "button"; del.className = "del"; del.textContent = "×"; del.setAttribute("aria-label", "Delete " + saved.name);
      del.addEventListener("click", e => { e.stopPropagation(); doc.themes[saved.id] = { id: saved.id, deleted: true, updatedAt: M.now() }; afterChange({ animate: false }); renderSwatches(); });
      b.appendChild(del);
    }
    return b;
  };
  T.CURATED.forEach(t => root.appendChild(mk(t)));
  savedThemes().forEach(s => root.appendChild(mk(s.theme, s)));
  syncFollowChip();
}
function syncFollowChip() {
  const b = $("#follow");
  b.setAttribute("aria-pressed", dev.follow ? "true" : "false");
  b.textContent = dev.follow ? "Follow system: on" : "Follow system: off";
}
$("#follow").addEventListener("click", () => {
  dev.follow = !dev.follow;
  // seed the slot for the current theme's base so turning it on doesn't swap the theme away
  if (dev.follow && theme) { if (theme.base === "dark") dev.darkSlot = dev.theme; else dev.lightSlot = dev.theme; }
  saveDevice(); applyThemeCode(currentThemeCode()); renderSwatches();
});
const pairSel = $("#c-pair");
T.CUSTOM_PAIRS.forEach(id => { const o = document.createElement("option"); o.value = id; o.textContent = T.PAIRS[id].name; pairSel.appendChild(o); });
function customTheme() { return T.derive({ accent: custom.accent, base: custom.base, pair: custom.pair || undefined, name: custom.name || "Custom" }); }
function paintCustom() {
  $("#c-color").value = custom.accent;
  if (document.activeElement !== $("#c-hex")) $("#c-hex").value = custom.accent;
  $("#c-dark").setAttribute("aria-pressed", custom.base === "dark" ? "true" : "false");
  $("#c-light").setAttribute("aria-pressed", custom.base === "light" ? "true" : "false");
  pairSel.value = custom.pair || "";
  $("#c-name").value = custom.name;
  const t = customTheme(), c = t.colors, p = T.pairOf(t.pair) || T.PAIRS.lato;
  const pv = $("#c-preview");
  pv.style.background = c.ink; pv.style.color = c.text; pv.style.borderColor = c.hairSolid; pv.style.setProperty("--pv-accent", c.accent);
  pv.querySelectorAll(".pt").forEach(x => { x.style.fontFamily = p.task[2]; x.style.fontWeight = p.w; x.style.letterSpacing = p.ls; });
  pv.querySelector(".pt.done").style.color = c.done;
  const pm = pv.querySelector(".pm"); pm.style.fontFamily = p.ui[2]; pm.style.color = c.dim; pm.querySelector("b").style.color = c.accentText;
  const r = T.report(t);
  $("#c-contrast").textContent = `Contrast — text ${r.text.toFixed(1)}:1 · muted ${r.muted.toFixed(1)}:1 · accent ${r.accentText.toFixed(1)}:1 · fonts ${p.name}`;
  T.loadFonts(T.fontsUrl(t.pair));
}
/** Live preview on the page (not persisted); the panel's close handler restores the real theme. */
function previewCustom() { T.applyTheme(customTheme(), document, { persist: false }); }
function setCustom(patch) { Object.assign(custom, patch); paintCustom(); previewCustom(); }
$("#c-color").addEventListener("input", e => setCustom({ accent: T.normalizeHex(e.target.value) || custom.accent }));
$("#c-hex").addEventListener("input", e => { const v = e.target.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) setCustom({ accent: T.normalizeHex(v) }); });
$("#c-hex").addEventListener("change", e => { const h = T.normalizeHex(e.target.value); if (h) setCustom({ accent: h }); else e.target.value = custom.accent; });
$("#c-dark").addEventListener("click", () => setCustom({ base: "dark" }));
$("#c-light").addEventListener("click", () => setCustom({ base: "light" }));
pairSel.addEventListener("change", e => setCustom({ pair: e.target.value }));
$("#c-name").addEventListener("input", e => { custom.name = e.target.value; });
$("#c-use").addEventListener("click", () => { chooseTheme(customTheme()); });
let keepPreview = false;
$("#c-save").addEventListener("click", async () => {
  if (!doc) { toast("Open a list first to save a theme"); return; }
  if (!custom.name.trim()) {
    keepPreview = true;
    const n = await ask({ title: "Name this theme", label: "Name", value: "" });
    keepPreview = false;
    if (!n || !n.trim()) { openTheme(); previewCustom(); return; }
    custom.name = n.trim().slice(0, 40);
  }
  const t = customTheme();
  const id = M.shortId();
  doc.themes[id] = { id, name: custom.name.trim().slice(0, 40), code: T.themeCode(t), updatedAt: M.now() };
  afterChange({ animate: false });
  chooseTheme(t);
  toast(`Saved “${custom.name.trim()}”`);
});
$("#c-surprise").addEventListener("click", () => { const t = T.surprise(); custom = { accent: t.accent, base: t.base, pair: t.pair, name: "" }; paintCustom(); previewCustom(); });
$("#c-export").addEventListener("click", async () => { try { await navigator.clipboard.writeText(T.themeCode(customTheme())); toast("Theme code copied"); } catch (e) { toast(T.themeCode(customTheme())); } });
$("#c-import-go").addEventListener("click", () => {
  const t = T.parseCode($("#c-import").value);
  if (!t) { toast("That code doesn't parse"); return; }
  if (t.kind === "custom") { custom = { accent: t.accent, base: t.base, pair: t.pair, name: t.name }; paintCustom(); previewCustom(); } else chooseTheme(t);
});
$("#p-theme").addEventListener("close", () => { if (!keepPreview) applyThemeCode(currentThemeCode()); });

/* ---------------- rail controls ---------------- */
function wireUi() {
  $("#v-today").addEventListener("click", () => setView("today"));
  $("#v-all").addEventListener("click", () => setView("all"));
  $("#mute").addEventListener("click", toggleMute);
  const fsBtn = $("#full");
  if (!document.fullscreenEnabled) fsBtn.hidden = true;
  fsBtn.addEventListener("click", toggleFullscreen);
  $("#again").addEventListener("click", startAgain);
  $("#addtoday").addEventListener("click", () => newItem({ today: true }));
  $("#toast-undo").addEventListener("click", () => { hideToast(); undo(); });
  $("#install-x").addEventListener("click", () => { $("#install").hidden = true; dev.installHint = true; saveDevice(); });
  $("#p-sec").addEventListener("click", e => { const b = e.target.closest("[data-sact]"); if (b) sectionAction(b.dataset.sact); });
  if (IOS && !STANDALONE && !dev.installHint) setTimeout(() => { if (doc) $("#install").hidden = false; }, 2500);
  document.addEventListener("pointerdown", () => sound.prime(), { once: true, capture: true });
}
function toggleMute() { dev.muted = !dev.muted; saveDevice(); paintMute(); if (!dev.muted) sound.tick(); }
function paintMute() { const b = $("#mute"); b.textContent = dev.muted ? "Muted" : "Sound on"; b.setAttribute("aria-pressed", dev.muted ? "true" : "false"); }
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}
function startAgain() {
  const ids = todayList().filter(i => i.done).map(i => i.id);
  if (!ids.length) return;
  pushUndo("Start again", ids);
  for (const id of ids) { const it = doc.items[id]; it.done = false; it.doneAt = 0; it.updatedAt = M.now(); }
  wasAll = false;
  sound.uncheck();
  afterChange();
  const first = todayList()[0]; if (first) focusRow(first.id);
}

/* ---------------- keyboard ---------------- */
document.addEventListener("keydown", e => {
  const t = e.target;
  const inField = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (e.key === "z" || e.key === "Z")) {
    if (inField && !editing) return; // let the field handle its own undo
    if (editing) return;
    e.preventDefault(); undo(); return;
  }
  if (openPanel || editing || inField) return;
  if (!doc) return;
  if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); moveFocused(e.key === "ArrowUp" ? -1 : 1); return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k >= "1" && k <= "9") {
    const pos = parseInt(k, 10) - 1;
    const ids = visibleRowIds();
    if (pos < ids.length) { e.preventDefault(); toggle(ids[pos], 0, 0, false); }
  }
  else if (k === "m" || k === "M") { e.preventDefault(); toggleMute(); }
  else if (k === "t" || k === "T") { e.preventDefault(); openTheme(); }
  else if ((k === "f" || k === "F") && document.fullscreenEnabled) { e.preventDefault(); toggleFullscreen(); }
  else if (k === "e" || k === "E") { e.preventDefault(); const id = focusedRowId(); if (id) startEdit(id); }
  else if (k === "n" || k === "N") { e.preventDefault(); newItem({ today: view === "today", sectionId: view === "all" ? sectionOfFocused() : "" }); }
  else if (k === "a" || k === "A") { e.preventDefault(); setView(view === "today" ? "all" : "today"); }
  else if (k === "?") { e.preventDefault(); showPanel("p-help"); }
  else if (k === "Escape") { hideToast(); }
});
function sectionOfFocused() {
  const id = focusedRowId();
  const it = id && doc.items[id];
  return it && !it.deleted && doc.sections[it.sectionId] && !doc.sections[it.sectionId].deleted ? it.sectionId : "";
}

/* test hook (read-only) */
window.__tf = () => ({ view, listId, dragging: !!drag, drag: drag ? { id: drag.id, lastY: drag.lastY, raf: drag.raf, offY: drag.offY, inDom: drag.li.isConnected, sameAsRows: rows.get(drag.id) === drag.li } : null, editing: editing ? editing.id : null, status: syncStatus, cur: sync ? sync.current() : null, tab: TAB_ID });

/* ---------------- service worker ---------------- */
function registerSw() {
  if (!("serviceWorker" in navigator)) return;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") { if (new URLSearchParams(location.search).get("sw") !== "1") return; }
  addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then(() => navigator.serviceWorker.ready).then(() => {
      // the first load's font requests happened before the worker took control: fetch the stylesheet
      // once more through it so the offline shell has the fonts CSS too
      const f = document.querySelector('link[data-fonts="active"]');
      if (f && navigator.serviceWorker.controller) fetch(f.href, { mode: "cors" }).catch(() => {});
    }).catch(() => {});
  });
}
