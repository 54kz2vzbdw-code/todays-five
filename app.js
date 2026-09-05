// app.js — the UI: boot, registry, open/switch lists, rendering, inline editing, drag, keyboard, undo, rollover,
// sync wiring, the ⋯ menu, one-thing mode, search, not-today, presence, add-from-URL, the what's-new toast.
// Everything used only from a panel (theme picker, share/save sheets, Lists, History, Settings, section and line
// menus, templates, delete-everywhere, move, export, the ? reference, How it works) lives in panels.js and loads on first
// use: Today's first paint pays for none of it. panels.js gets one object, `api`, with live getters for the
// state here and the actions it needs.
import * as M from "./model.js";
import { loadLocal, saveLocal, removeLocal, loadLegacyLocal, removeLegacyLocal, loadMeta, saveMeta, makeTransport, createSync, fetchLegacy, deleteLegacy, forWire } from "./sync.js";
import * as C from "./crypto.js";
import * as T from "./theme.js";
import { createSound } from "./sound.js";
import { createFx } from "./fx.js";
import config from "./config.js";
import { VERSION, BUILD, VERSION_LABEL } from "./version.js";

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const RM = matchMedia("(prefers-reduced-motion: reduce)");
const HOVER = matchMedia("(hover: hover)");
const NARROW = matchMedia("(max-width: 680px)");
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
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></svg>'
};
const touchUi = () => !HOVER.matches;
const sheetUi = () => !HOVER.matches || NARROW.matches;

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
// v4 settings all default off (or to the v3 behaviour) when absent; nothing is rewritten on a returning device
if (!dev.schedule || typeof dev.schedule !== "object") dev.schedule = { on: false, dayAt: "07:00", nightAt: "19:00", day: "T1:curated:light", night: "T1:curated:dark" };
// a device that already holds an established list is a returning user (the latch the tour used; the hints and what's-new read it).
// A list registered moments ago (`fresh`) does not count: iOS Safari reloads the page
// right after the first list is created, and that reload must not look like a returning device.
if (!dev.tourDone && meta.lists.some(l => !l.fresh)) dev.tourDone = true;
// a device that holds a list (or went through the tour) is a returning one: it sees the what's-new toast, no hints, and
// its theme settings migrate in place; a device with neither is on its first run
const RETURNING = meta.lists.length > 0 || !!dev.tourDone;
// what's new: a device that has never held a list is on its first run and sees nothing; anyone else sees the toast once per version
const whatsNewPending = M.whatsNewDue({ seenVersion: dev.seenVersion, hasLists: RETURNING }, VERSION);
if (!dev.seenVersion && !whatsNewPending) dev.seenVersion = VERSION;
// 1.3: the save-your-link sheet only counts as done once the link is copied or confirmed, and ⋯ nags until then.
// A device from before is grandfathered on its first open of 1.3 (the what's-new pending is that moment, and only that
// moment: the reload iOS Safari does right after a fresh device's first list is made must not look like an update):
// whatever it did with the old sheet counts as saved.
if (whatsNewPending && !dev.savedGrandfathered) { for (const l of meta.lists) if (l && l.linkSaved === false) l.linkSaved = true; dev.savedGrandfathered = true; }
// just-in-time hints (1.1), once per device. A device that held a list before 1.1 went through the tour, or simply
// knows the app, and must see exactly one new thing on update (the what's-new toast): its hints count as seen.
if (!dev.hints || typeof dev.hints !== "object") dev.hints = (dev.tourDone || meta.lists.some(l => !l.fresh)) ? { today: true, drag: true, menu: true } : {};
function saveDevice() {
  // another tab may have changed the registry since this tab loaded: union lists, respect rotations, keep our device settings
  const stored = loadMeta();
  const dead = new Set([...(stored.dead || []), ...(meta.dead || [])]);
  const byId = new Map();
  for (const l of [...(stored.lists || []), ...(meta.lists || [])]) if (l && l.id && !dead.has(l.id)) byId.set(l.id, { ...(byId.get(l.id) || {}), ...l });
  meta.lists = Array.from(byId.values());
  meta.dead = Array.from(dead);
  meta.redirect = { ...(stored.redirect || {}), ...(meta.redirect || {}) };
  const kills = new Map(); for (const k of [...(stored.pendingKill || []), ...(meta.pendingKill || [])]) if (k && k.lookupId) kills.set(k.lookupId, k);
  meta.pendingKill = Array.from(kills.values());
  const migs = new Map(); for (const m of [...(stored.migrations || []), ...(meta.migrations || [])]) if (m && m.from) migs.set(m.from, m);
  meta.migrations = Array.from(migs.values());
  if (syncStatus === "gone" && stored.current && stored.current !== meta.current && !dead.has(stored.current)) { meta.current = stored.current; meta.currentMode = stored.currentMode; }
  if (stored.device) { if (stored.device.tourDone) dev.tourDone = true; if (stored.device.installHint) dev.installHint = true; } // one-way latches
  saveMeta(meta);
}
/** Follow redirects recorded by Rotate and migration (an installed iPhone icon keeps launching the old id). */
function resolveRef(r) {
  if (r.mode === "view") return r;
  const map = meta.redirect || {};
  const seen = new Set();
  let id = r.id;
  while (map[id] && !seen.has(id)) { seen.add(id); id = map[id]; }
  return { id, mode: "edit" };
}
// per-tab identity: two tabs on one device must not ignore each other's broadcasts; presence tracks a per-load key
const TAB_ID = dev.id + ":" + M.shortId();
const PRESENCE_KEY = M.shortId();

/* ---------------- state ---------------- */
let doc = null, listId = null, listMode = "edit", ref = null, view = "today";
let sync = null, transport = null, syncStatus = "off", syncLive = false, liveGrace = 0, transportFailed = false;
let openGen = 0;
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
let markTarget = null, markKey = ""; // the just-in-time hint on screen, if any (declared up here: boot() reaches it)
let menuHintFor = null;        // the line whose edit just ended by hand: the menu hint points at it once the editor is gone
let idleTimer = 0, idleOn = false, finaleOn = false; // the idle fade (desktop)
let query = "";                // Everything's search
let pendingAdd = null;         // { text: [...], section } from an add-from-anywhere link, applied once the doc is ready
let whoCount = 0;
let lastRemoteCelebrate = 0;
const canEdit = () => listMode === "edit" && !!doc;
// Everything below is reachable from boot() (which runs before the rest of this module has been evaluated):
// declare it here, never further down, or a cold start straight into a link dies in a temporal dead zone.
const STATUS_SHORT = { offline: "Offline", error: "Sync trouble" };
const STATUS_CAT = s => (s === "synced" || s === "syncing") ? "ok" : (s === "busy" || s === "full" || s === "toolarge" || s === "error") ? "trouble" : s;
const STATUS_LABEL = {
  synced: "Synced", syncing: "Syncing", offline: "Offline", error: "Sync trouble — will retry",
  gone: "This link no longer works", off: "Sync off", busy: "Server busy — retrying in a few minutes",
  full: "The service is full — saved on this device only", toolarge: "Too large to sync — saved on this device only",
  readonly: "View only", unreadable: "This link can't read this list"
};
let lastCat = "", lastLimitToast = "";
const viewCollapsed = new Set(); // view-only mode: a viewer's collapse must never win a merge against the editors
let press = null, tapped = null, swipe = null;
let reloading = false;
let toastAction = null, reviewDismissed = false, whatsNewShown = false, rz = 0, settling = false, killing = false;
let dragEndedAt = -1e9; // no drag has ended yet
let panelsP = null, panelCssReady = false;
let demo = false;              // the welcome's live list (1.3): a local document, no id, no secret, nothing on the server
let shuffledId = null;         // one-thing mode's shuffled line (1.3): shown instead of the top undone line until it is crossed off
let lastAcc = null, lastShake = 0, motionOn = false; // shake to shuffle
/** The panels' stylesheet is not render-blocking: it is asked for a beat after load, so it never competes with the
    first paint for the connection, and every panel waits for it. */
const panelCss = new Promise(res => {
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "panels.css";
  l.onload = () => { panelCssReady = true; res(true); }; l.onerror = () => { panelCssReady = true; res(false); };
  const go = () => setTimeout(() => document.head.appendChild(l), 250);
  if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
});
/** The lazy module with every panel. Loaded on first use, then kept. */
function panels() {
  if (!panelsP) panelsP = Promise.all([import("./panels.js"), panelCss]).then(([m]) => { m.init(api); return m; }).catch(e => { panelsP = null; toast("Couldn't load that part of the app—check the connection and try again"); throw e; });
  return panelsP;
}
const HAPTIC = IOS && (() => { const h = document.getElementById("haptic"); return !!h && "switch" in h; })();

/* ---------------- sound & fx ---------------- */
const stats = { check: 0, uncheck: 0, finish: 0, burst: 0, volley: 0, tick: 0 }; // read by the test hook
const rawSound = createSound({ muted: () => !!dev.muted, volume: () => dev.volume, kit: () => theme && theme.sound, pack: () => dev.soundPack || "" });
const sound = { ...rawSound, check: s => { stats.check++; return rawSound.check(s); }, uncheck: () => { stats.uncheck++; return rawSound.uncheck(); }, finish: () => { stats.finish++; return rawSound.finish(); }, tick: () => { stats.tick++; return rawSound.tick(); } };
const rawFx = createFx($("#fx"), { palette: () => theme ? theme.confetti : ["#D26128"], shapes: () => theme ? theme.shapes : 1, reduced: () => RM.matches });
const fx = { burst: (...a) => { stats.burst++; return rawFx.burst(...a); }, volley: () => { stats.volley++; return rawFx.volley(); } };

/* ---------------- theme: Day and Night (1.2) ----------------
   Every device has a Day theme and a Night theme; the sun/moon on the rail (T) flips between them. Settings →
   Appearance decides which theme fills each slot and how the switch happens: by hand, with the system, or on a
   schedule. A flip while an automation is on holds until the automation next switches. The slot logic is pure
   and lives in theme.js (migrateSlots, activeSlot, flipSlot…); this is the DOM side: apply, crossfade, the glyph. */
const envNow = () => ({ systemDark: DARK_MQ.matches, now: new Date() });
if (T.migrateSlots(dev, { returning: RETURNING, env: envNow() })) saveDevice(); // once, on the first open of 1.2; the old keys stay
/** The code of the theme that is on right now. */
function currentThemeCode() { return T.slotCode(dev, envNow()); }
let appliedCode = "", fadeRaf = 0;
const FADE_MS = 400;
function applyThemeCode(code, { crossfade = false } = {}) {
  const next = T.parseCode(code) || T.curated("dark"), prev = theme;
  theme = next;
  dev.theme = code; // mirrored (never read here) so a device that ever ran the old code again opens on what it last saw
  if (crossfade && prev && !RM.matches && T.cssText(prev) !== T.cssText(next)) crossfadeTo(prev, next);
  else { stopFade(); T.applyTheme(next); }
  $("#menu-theme-k").textContent = next.name;
  paintDayNight();
  dispatchEvent(new CustomEvent("tf:theme"));
}
function stopFade() { if (!fadeRaf) return; cancelAnimationFrame(fadeRaf); fadeRaf = 0; const g = $("#glow"); g.style.transition = ""; g.style.opacity = ""; document.body.classList.remove("fading"); }
/** The whole palette crossfades from one slot's theme to the other's: the colour tokens interpolated in OKLab over
    about 400 ms, the fonts, gradients and shadows swapped at the midpoint, the glow dipping through it. Instant
    under prefers-reduced-motion (applyThemeCode never gets here then). */
function crossfadeTo(prev, next) {
  stopFade();
  const style = document.getElementById("theme-vars"), glow = $("#glow"), root = document.documentElement;
  const t0 = performance.now();
  const ease = p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  glow.style.transition = "opacity .2s ease"; glow.style.opacity = "0";
  document.body.classList.add("fading"); // the rows' own colour transitions would trail the tokens (styles.css)
  let swapped = false;
  const step = now => {
    const p = Math.min(1, (now - t0) / FADE_MS);
    if (p >= 0.5 && !swapped) { swapped = true; root.dataset.base = next.base; root.dataset.theme = next.id; glow.style.opacity = ""; }
    if (p < 1) { T.setTokenCss(style, T.cssTextBetween(prev, next, ease(p))); fadeRaf = requestAnimationFrame(step); }
    else { fadeRaf = 0; glow.style.transition = ""; T.applyTheme(next); document.body.classList.remove("fading"); }
  };
  fadeRaf = requestAnimationFrame(step);
}
/** The sun/moon on the rail shows where a tap goes: the moon by day, the sun by night. */
function paintDayNight() {
  const b = $("#daynight"); if (!b) return;
  const next = T.activeSlot(dev, envNow()) === "day" ? "night" : "day";
  b.dataset.next = next;
  b.title = (next === "night" ? "Night" : "Day") + " · T";
  b.setAttribute("aria-label", "Switch to " + next);
}
/** A tap on the sun or moon: the other slot, with the crossfade and the incoming theme's soft tick. */
function flipSlot() {
  T.flipSlot(dev, envNow()); saveDevice();
  appliedCode = currentThemeCode();
  applyThemeCode(appliedCode, { crossfade: true });
  if (!dev.muted) sound.tick();
}
/** Settings → Appearance: a theme for a slot (applied at once when that slot is on), the switch, its times. */
function setSlotTheme(slot, code) {
  if ((slot !== "day" && slot !== "night") || !T.parseCode(code)) return;
  dev[slot] = code; saveDevice();
  if (T.activeSlot(dev, envNow()) === slot) { appliedCode = code; applyThemeCode(code); if (!dev.muted) sound.tick(); }
  else dispatchEvent(new CustomEvent("tf:theme"));
}
function setSwitchMode(mode) { T.setSwitchMode(dev, mode, envNow()); saveDevice(); tickTheme(); dispatchEvent(new CustomEvent("tf:theme")); }
function setSwitchTimes(dayAt, nightAt) { dev.switch = { ...dev.switch, dayAt: dayAt || "07:00", nightAt: nightAt || "19:00" }; dev.holdAuto = null; saveDevice(); tickTheme(); dispatchEvent(new CustomEvent("tf:theme")); }
/** The minute tick and the system's own switch: a spent hold is forgotten, and a slot change crossfades. */
function tickTheme() {
  if (T.settleHold(dev, envNow())) saveDevice();
  const c = currentThemeCode();
  if (c !== appliedCode) { appliedCode = c; applyThemeCode(c, { crossfade: true }); }
  else paintDayNight();
}
DARK_MQ.addEventListener("change", tickTheme);

/* ---------------- boot ---------------- */
appliedCode = currentThemeCode();
applyThemeCode(appliedCode);
paintDate();
paintMute();
wireUi();
boot();
registerSw();

function frag(r) { return "#/" + (r.mode === "view" ? "r" : "l") + "/" + r.id; }
function hashRef() {
  const h = M.parseHash(location.hash);
  return h ? { id: h.id, mode: h.mode } : null;
}
/** An add-from-anywhere link: remember what to add, refuse it on a view link, and clean the address either way. */
function takeAddFromHash() {
  const h = M.parseHash(location.hash);
  if (!h || !h.add) return;
  if (h.mode === "view") { pendingAdd = null; notice("A View link only shows the list. Open the Private link to add a line."); }
  else pendingAdd = h.add;
  history.replaceState(null, "", BASE + SEARCH + frag(h));
}
/** A toast that survives the reload iOS Safari needs when the list changes (it is shown once the list is painted). */
function notice(msg) { try { sessionStorage.setItem("tf/notice", msg); } catch (e) { /* ignore */ } setTimeout(flushNotice, 600); }
function flushNotice() {
  let msg = null; try { msg = sessionStorage.getItem("tf/notice"); if (msg) sessionStorage.removeItem("tf/notice"); } catch (e) { /* ignore */ }
  if (msg) toast(msg);
}
function boot() {
  takeAddFromHash();
  const h = hashRef();
  if (h) return openList(resolveRef(h));
  if (meta.current && (loadLocal(meta.current) || loadLegacyLocal(meta.current))) return openList({ id: meta.current, mode: meta.currentMode === "view" ? "view" : "edit" });
  if (!meta.migratedV1) {
    let v1 = null;
    try { v1 = JSON.parse(localStorage.getItem(V1_KEY) || "null"); } catch (e) { /* ignore */ }
    if (v1 && Array.isArray(v1.items) && v1.items.length) {
      const id = M.newId();
      const d = M.migrateV1(v1, id);
      saveLocal(id, { doc: d, rev: 0, dirty: true, created: true, mode: "edit" });
      meta.migratedV1 = true;
      if (v1.mode && T.curated(v1.mode)) { const t = T.curated(v1.mode), slot = t.base === "light" ? "day" : "night"; dev[slot] = "T1:curated:" + v1.mode; T.setSwitchMode(dev, "hand"); dev.slot = slot; appliedCode = currentThemeCode(); applyThemeCode(appliedCode); }
      if (v1.muted) { dev.muted = true; paintMute(); }
      dev.tourDone = true; // a v1 user is a returning user
      const e = registerList(id, "", "edit"); e.created = true; e.linkSaved = false;
      return openList({ id, mode: "edit" });
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
/** Other lists this browser holds with unpushed edits (switched away before the debounce, iOS reloads, a line moved
    to another list): push them once. */
async function flushOthers() {
  if (!transport || !navigator.onLine) return;
  for (const l of meta.lists) {
    if (l.id === listId || l.mode === "view") continue;
    const local = loadLocal(l.id);
    if (!local || !local.dirty || local.mode === "view") continue;
    try {
      const r = await C.fromWrite(l.id);
      const remote = await transport.get(r.lookupId, null);
      if (!remote) { if (!(local.rev === 0 && local.created)) continue; }
      let mergedDoc = local.doc, base = 0;
      if (remote) {
        if (!remote.doc || !C.isEnvelope(remote.doc)) continue;
        mergedDoc = M.merge(local.doc, M.normalize(await C.open(r.key, remote.doc), l.id)); base = remote.rev | 0;
      }
      const res = await transport.put(r.lookupId, await C.seal(r.key, forWire(mergedDoc)), base, r.token);
      if (res && res.ok) saveLocal(l.id, { doc: mergedDoc, rev: res.rev, dirty: false, created: local.created, mode: "edit" });
    } catch (e) { /* next time */ }
  }
}
addEventListener("hashchange", () => {
  if (reloading) return;
  takeAddFromHash();
  const h = hashRef(); if (!h) return;
  const r = resolveRef(h);
  if (r.id === listId && r.mode === listMode) { history.replaceState(null, "", BASE + SEARCH + frag(r)); applyPendingAdd(); return; } // a stale (redirected) link: show the real one
  switchTo(r);
});
async function retryTransport() {
  if (transport || !transportFailed || !listId) return;
  try { transport = await makeTransport(TRANSPORT_KIND, config); } catch (e) { transport = null; }
  if (transport) { transportFailed = false; openList({ id: listId, mode: listMode }); }
}
addEventListener("online", retryTransport);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") retryTransport(); });

function registerList(id, name, mode) {
  let e = meta.lists.find(l => l.id === id);
  if (!e) { e = { id, mode: mode === "view" ? "view" : "edit", name: name || "", addedAt: Date.now(), fresh: !dev.tourDone }; meta.lists.push(e); }
  else if (mode && e.mode !== mode) e.mode = mode;
  return e;
}

async function openList(r) {
  if (!r || !M.isListId(r.id)) return showWelcome("That link doesn't look right.");
  const mode = r.mode === "view" ? "view" : "edit";
  if (editing) cancelEdit();
  if (sync) { await flushQuick(); sync.close(); sync = null; }
  if (drag) abortDrag();
  undoStack = []; hideToast();
  setSearch("", { silent: true });
  const gen = ++openGen;
  demo = false; shuffledId = null; $("#demo-foot").hidden = true; $("#w-keep").hidden = true;
  listId = r.id; listMode = mode; ref = null;
  meta.current = r.id; meta.currentMode = mode;
  const entry = registerList(r.id, "", mode);
  saveDevice();
  let local = loadLocal(r.id);
  const legacy = (!local && mode === "edit") ? loadLegacyLocal(r.id) : null; // a v2 list this device still holds in plaintext
  // a list opened from a link starts from a doc that loses every tie, so the server's name and records win
  doc = local ? local.doc : legacy ? legacy.doc : M.normalize({}, r.id);
  let rolled = false;
  if (mode === "edit") {
    doc = M.purgeTombstones(doc);
    const roll = M.rollover(doc);
    if (roll.moved.length || roll.doc !== doc) { doc = roll.doc; rolled = true; }
  }
  document.documentElement.dataset.mode = mode;
  document.body.classList.remove("welcome");
  history.replaceState(null, "", BASE + SEARCH + frag({ id: r.id, mode }));
  if (window.__tfManifest) window.__tfManifest(frag({ id: r.id, mode }));
  $("#welcome").hidden = true;
  $("#dot").hidden = false;
  $("#ro").hidden = mode !== "view";
  rows.clear(); $("#list").innerHTML = ""; clearAll();
  wasAll = allDoneToday();
  paintWho(0);
  setView(view, { force: true });
  paintListName();
  syncLive = false; lastCat = ""; paintStatus(transport || TRANSPORT_KIND ? "syncing" : "off");
  if (legacy) {
    const outcome = await migrateLegacy(r.id, legacy, null, gen);
    if (gen !== openGen || outcome !== "keep") return; // migrated (openList ran again) or superseded
    local = loadLocal(r.id) || { doc: legacy.doc, rev: legacy.rev, dirty: legacy.dirty, created: legacy.created, mode: "edit" }; // stays under its old id, will report "gone"
  }
  // keys and sync start after first paint
  let derived = null;
  try { derived = await C.fromLink(mode, r.id); } catch (e) { derived = null; }
  if (gen !== openGen) return;
  if (!derived) return showWelcome("That link doesn't look right.");
  ref = derived;
  if (!transport) {
    try { transport = await makeTransport(TRANSPORT_KIND, config); } catch (e) { transport = null; transportFailed = true; }
    if (gen !== openGen) return;
  }
  // a link pasted for the first time: an encrypted row, a v2 plaintext row (migrate), or nothing (gone)
  if (!local && mode === "edit" && transport && navigator.onLine) {
    try {
      const res = await transport.get(ref.lookupId, null);
      if (gen !== openGen) return;
      if (!res) {
        const leg = await fetchLegacy(transport, r.id);
        if (gen !== openGen) return;
        if (leg) return migrateLegacy(r.id, null, leg);
      }
    } catch (e) { /* offline or refused: the engine reports it */ }
  }
  liveGrace = Date.now() + 8000; setTimeout(() => { if (gen === openGen) paintStatus(syncStatus); }, 8200);
  const holdHook = TRANSPORT_KIND === "local" ? (() => { try { return +localStorage.getItem("tf/test/hold") || 0; } catch (e) { return 0; } })() : 0;
  sync = createSync({
    transport, deviceId: TAB_ID,
    holdMs: holdHook ? { busy: holdHook, full: holdHook } : undefined,
    presence: { key: PRESENCE_KEY, enabled: () => !dev.whoOff, onCount: n => { if (gen === openGen) paintWho(n); } },
    onStatus: s => { if (gen === openGen) paintStatus(s); },
    onLive: v => { if (gen === openGen) { syncLive = v; paintStatus(syncStatus); } },
    onRemote: remote => { if (gen !== openGen) return; const prev = doc; doc = remote; applyRemote(prev); applyCarry(); applyPendingAdd(); },
    onGone: () => { /* the dot says it; the Lists panel offers the paste box */ }
  });
  syncLive = false;
  paintStatus(transportFailed ? "offline" : sync.status);
  sync.open(ref, doc, local ? { rev: local.rev, dirty: local.dirty || rolled, created: local.created } : { rev: 0, dirty: false, created: false });
  retryPendingKills();
  flushOthers();
  settleMigrations();
  applyCarry();
  if (sessionStorage.getItem("tf/reopenShare")) { sessionStorage.removeItem("tf/reopenShare"); setTimeout(() => panels().then(p => p.openShare()), 300); }
  if (rolled) sync.update(doc);
  if (entry && !entry.name && doc.name) entry.name = doc.name;
  if (local) applyPendingAdd();
  flushNotice();
  if (mode === "edit" && entry.created && !entry.linkSaved) panels().then(p => p.showSaveLink({ migrated: !!entry.migrated }));
  maybeWhatsNew();
}

/** The welcome (1.3) is a live list: the title and one sentence, then three lines rendered by the Today renderer from
    a local document that has no id, no secret and no server row, then Keep / Skip / Paste. A tap strikes, knocks and
    throws confetti as on any list; adding a line or crossing off all three offers Keep, which turns the document
    into a real list, lines and check marks included. No rail, no footer, no tour, no hints, no toast. */
function showWelcome(msg) {
  if (sync) { flushQuick().then(() => { if (sync) { sync.close(); sync = null; } }); }
  if (editing) cancelEdit(true);
  if (drag) abortDrag();
  listId = null; ref = null; undoStack = []; hideToast();
  meta.current = null; meta.currentMode = null; saveDevice();
  listMode = "edit"; demo = true; shuffledId = null;
  doc = M.seedDoc("");
  document.documentElement.dataset.mode = "edit";
  document.body.classList.add("welcome");
  $("#all").hidden = true; $("#welcome").hidden = false; $("#demo-foot").hidden = false; $("#w-keep").hidden = true; $("#w-paste-form").hidden = true;
  $("#w-err").textContent = msg || "";
  $("#dot").hidden = true; // no list yet: nothing to report
  $("#ro").hidden = true;
  paintWho(0);
  $("#hint").innerHTML = "";
  $("#list-h1").textContent = "Today's Five";
  $("#review").hidden = true;
  setOneThing(false, { silent: true, keep: true });
  rows.clear(); $("#list").innerHTML = "";
  wasAll = false;
  setView("today", { force: true });
  paintListName();
  maybeWhatsNew();
}
/** The welcome's list wants keeping once the person has made it theirs: a line of their own, or all three crossed off. */
function demoNudge() {
  if (!demo || !doc) return;
  const items = M.liveItems(doc);
  const own = items.some(i => !M.SEED_LINES.includes(i.text) && i.text.trim());
  if ((own || allDoneToday()) && $("#w-keep").hidden) { $("#w-keep").hidden = false; }
}
/** Keep this list: the same document under a real id, through the ordinary create path (the save sheet follows). */
function keepDemo() {
  if (!demo || !doc) return;
  if (editing) commitEdit();
  const id = M.newId();
  const d = M.normalize(doc, id); d.updatedAt = M.now();
  demo = false;
  createList(d, id);
}

/* ---------------- migration of a v2 (plaintext) list ---------------- */
async function migrateLegacy(oldId, legacyLocal, serverRow, gen = openGen) {
  let D = legacyLocal ? legacyLocal.doc : M.normalize({}, oldId);
  let legacyRev = 0;
  if (serverRow) { D = M.merge(D, serverRow.doc); legacyRev = serverRow.rev; }
  else if (!transport) { try { transport = await makeTransport(TRANSPORT_KIND, config); } catch (e) { transport = null; transportFailed = true; } }
  if (gen !== openGen) return "superseded";
  if (!serverRow && transport && navigator.onLine) {
    let leg = null, reached = false;
    try { leg = await fetchLegacy(transport, oldId); reached = true; } catch (e) { /* offline or refused: the follow-up merges again */ }
    if (gen !== openGen) return "superseded";
    if (leg) { D = M.merge(D, leg.doc); legacyRev = leg.rev; }
    // the row is already gone and this device only ever opened the list from a link: another device migrated it.
    // Forking a second encrypted list here would strand this copy; keep it, show "gone", and let the paste carry it over.
    else if (reached && legacyLocal && !legacyLocal.created) return "keep";
  }
  const W = M.newId();
  const copy = M.normalize(D, W); copy.updatedAt = M.now();
  saveLocal(W, { doc: copy, rev: 0, dirty: true, created: true, mode: "edit" }); // the data is safe from here on, push or no push
  dev.tourDone = true; // this device had a list already: the migration sheet is the only new screen it gets
  const old = meta.lists.find(l => l.id === oldId);
  const e = registerList(W, old ? old.name : (copy.name || ""), "edit");
  e.created = true; e.linkSaved = false; e.migrated = true;
  if (old && old.archived) e.archived = true;
  meta.lists = meta.lists.filter(l => l.id !== oldId);
  meta.dead = Array.from(new Set([...(meta.dead || []), oldId]));
  meta.redirect = { ...(meta.redirect || {}), [oldId]: W };
  meta.migrations = [...(meta.migrations || []).filter(m => m.from !== oldId), { from: oldId, to: W, rev: legacyRev, at: Date.now() }];
  if (meta.current === oldId) { meta.current = W; meta.currentMode = "edit"; }
  saveDevice();
  if (gen !== openGen) return "superseded";
  await openList({ id: W, mode: "edit" });
  return "migrated";
}
/** Once a migrated list has landed on the server: fold in anything another device wrote to the old row since,
    retire the old row, drop the plaintext local copy. Retried until it succeeds. */
async function settleMigrations() {
  if (settling || !transport || !navigator.onLine || !(meta.migrations || []).length) return;
  settling = true;
  try {
    for (const m of [...meta.migrations]) {
      const local = loadLocal(m.to);
      if (!local) { meta.migrations = meta.migrations.filter(x => x !== m); saveDevice(); continue; }
      if (local.rev === 0) continue; // not pushed yet
      try {
        const leg = await fetchLegacy(transport, m.from);
        if (leg) {
          if (m.to === listId && doc) {
            const merged = M.normalize(M.merge(doc, leg.doc), listId);
            if (M.canon(merged) !== M.canon(doc)) { const prev = doc; doc = merged; applyRemote(prev); if (sync) sync.update(doc); }
          } else {
            const merged = M.normalize(M.merge(local.doc, leg.doc), m.to);
            if (M.canon(merged) !== M.canon(local.doc)) saveLocal(m.to, { ...local, doc: merged, dirty: true });
          }
          await deleteLegacy(transport, m.from);
        }
        removeLegacyLocal(m.from);
        meta.migrations = meta.migrations.filter(x => x !== m); saveDevice();
      } catch (e) { /* retry on the next tick */ }
    }
  } finally { settling = false; }
}
/** After a rotate or a migration elsewhere, the device that still held the old link pastes the new one: carry its
    unpushed edits over, but only when the two documents share lines (same lineage), never into a stranger's list. */
function applyCarry() {
  const c = meta.carry; if (!c || c.to !== listId || !doc || listMode !== "edit") return;
  if (!Object.keys(doc.items).length && !(sync && sync.current() && sync.current().rev > 0)) return; // nothing pulled yet: decide on real data
  meta.carry = null; saveDevice();
  const old = loadLocal(c.from) || loadLegacyLocal(c.from);
  if (!old || !old.dirty) return;
  const shared = Object.keys(old.doc.items).some(id => doc.items[id]);
  if (!shared) return;
  const merged = M.normalize(M.merge(doc, old.doc), listId);
  if (M.canon(merged) === M.canon(doc)) return;
  const prev = doc; doc = merged; applyRemote(prev); if (sync) sync.update(doc);
  toast("Carried your unsynced edits over from the old link");
}
/** Add-from-anywhere: once the document is real (local, or pulled for the first time), add the lines to Today. */
function applyPendingAdd() {
  const a = pendingAdd; if (!a || !doc || listMode !== "edit") return;
  const fresh = !Object.keys(doc.items).length && !(sync && sync.current() && sync.current().rev > 0) && !(loadLocal(listId) && loadLocal(listId).rev > 0);
  if (fresh && syncStatus !== "gone" && syncStatus !== "off") return; // a link this device never had: wait for the pull
  pendingAdd = null;
  if (syncStatus === "gone") { toast("This link no longer works, so nothing was added"); return; }
  if (!a.text.length) { setView("today"); newItem({ today: true }); return; }
  const secs = M.sectionsOrdered(doc);
  const sec = a.section ? secs.find(s => s.name.toLowerCase() === a.section.toLowerCase()) : null;
  const sectionId = sec ? sec.id : "";
  const ts = M.now();
  let order = M.lastOrder(M.itemsInSection(doc, sectionId), i => i.order), todayOrder = M.lastOrder(todayList(), i => i.todayOrder);
  const ids = [];
  for (const text of a.text) { const id = M.shortId(); ids.push(id); doc.items[id] = { id, sectionId, text, note: "", done: false, doneAt: 0, today: true, order, todayOrder, updatedAt: ts }; order += 1000; todayOrder += 1000; }
  pushUndo("Added", ids);
  setView("today");
  afterChange({ animate: false });
  requestAnimationFrame(() => { for (const id of ids) { const li = rows.get(id); if (li && !RM.matches) li.classList.add("arrive"); } focusRow(ids[0]); });
  toast(ids.length === 1 ? "Added" : "Added " + ids.length + " lines", { undo: true });
}

/* ---------------- lists registry ---------------- */
function paintListName() {
  const btn = $("#listname");
  const active = meta.lists.filter(l => !l.archived);
  const entry = meta.lists.find(l => l.id === listId);
  const name = doc && doc.name ? doc.name : (entry && entry.name) || "";
  btn.hidden = !(doc && (active.length > 1 || name));
  btn.textContent = name || "List";
  $("#list-h1").textContent = name ? name + " — Today's Five" : "Today's Five";
  $("#lists-k").textContent = active.length > 1 ? active.length + " lists" : "";
}

/* ---------------- rendering ---------------- */
function paintDate() {
  $("#date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).replace(", ", " · ");
}
function todayList() { return M.todayItems(doc); }
function doneCountToday() { return todayList().filter(i => i.done).length; }
function allDoneToday() { const t = todayList(); return t.length > 0 && t.every(i => i.done); }
/** Everything's DOM apart from its header: sections, the add button, the deleted shelf. */
function clearAll() { for (const el of Array.from($("#all").children)) if (el.id !== "all-head") el.remove(); }

function setView(v, { force } = {}) {
  if (!doc) return;
  if (demo && v !== "today") return; // the welcome's list is Today only
  if (editing) commitEdit();
  if (drag) abortDrag();
  hideMark();
  if (v !== view || force) { rows.clear(); $("#list").innerHTML = ""; clearAll(); }
  view = v;
  $("#v-today").setAttribute("aria-selected", v === "today" ? "true" : "false");
  $("#v-all").setAttribute("aria-selected", v === "all" ? "true" : "false");
  $("#today").hidden = v !== "today";
  $("#all").hidden = v !== "all";
  $("#welcome").hidden = !demo; // the welcome's title and sentence sit above the live list
  render({ animate: false });
  if (v === "all") hintToday();
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
  // quiet rows (1.1): the checkbox and the words, plus a small star in Everything. The one control, ⋯, appears on hover
  // on the desktop (click: the line's menu, Edit at the top; drag: move the line). On the phone it is kept for assistive
  // tech only; a hold lifts the line (drag to move, let go for the menu) and a swipe right opens the menu.
  if (view === "all") {
    const today = document.createElement("button"); today.type = "button"; today.className = "tool today";
    today.innerHTML = ICONS.star; today.setAttribute("aria-pressed", "false"); today.setAttribute("aria-label", "Today");
    today.addEventListener("click", e => { e.stopPropagation(); toggleToday(it.id); });
    tools.appendChild(today);
  }
  const grip = document.createElement("button"); grip.type = "button"; grip.className = "tool lmenu"; grip.innerHTML = ICONS.menu;
  grip.title = "Line menu · drag to move"; grip.setAttribute("aria-label", "Line menu"); grip.setAttribute("aria-haspopup", "dialog");
  grip.addEventListener("click", e => { e.stopPropagation(); if (clickAfterDrag()) return; openLineMenu(it.id); });
  grip.addEventListener("pointerdown", e => { if (e.button !== 0 || e.pointerType === "touch") return; e.preventDefault(); gripPress(li, e); });
  grip.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") showMark("drag", grip, "Drag ⋯ to move the line. Click it for the menu."); });
  tools.appendChild(grip);
  // the click a browser synthesises after a touch tap can land on a neighbour when the page moved in between (the
  // finale's review card re-centres the list, a done line sinks): the tap has already done its work, so that click
  // is swallowed wherever it lands
  li.addEventListener("click", e => { if (clickAfterDrag() || (tapped && tapped.touch && performance.now() - tapped.t < 700 && tapped.id !== it.id)) { e.stopPropagation(); e.preventDefault(); } }, true);
  // taps are recognised from pointer events (see onPress/onRelease); the click path serves keyboards and assistive tech
  li.querySelector(".check").addEventListener("click", e => { if (clickAfterDrag()) return; if (recentlyTapped(it.id)) return; toggle(it.id, e.clientX, e.clientY, e.detail > 0); });
  li.querySelector(".check").addEventListener("focus", () => { lastRowId = it.id; });
  li.addEventListener("pointerenter", () => { lastRowId = it.id; });
  li.addEventListener("dblclick", e => { if (!HOVER.matches) return; e.preventDefault(); startEdit(it.id); });
  li.addEventListener("pointerdown", e => { onPress(li, e); longPressStart(li, e); swipeStart(li, e); });
  li.addEventListener("contextmenu", e => { if (e.pointerType === "touch" || !HOVER.matches) e.preventDefault(); });
  li.addEventListener("animationend", () => { li.classList.remove("kick"); li.classList.remove("arrive"); li.classList.remove("shuffle-in"); li.classList.remove("wobble"); });
  return li;
}
/** ⋯ pressed with a mouse: a drag once the pointer moves, otherwise the click that follows opens the menu. */
function gripPress(li, e) {
  if (!canEdit() || drag || editing) return;
  const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
  const stop = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", stop); document.removeEventListener("pointercancel", stop); };
  const move = ev => { if (ev.pointerId !== pid) return; if (Math.hypot(ev.clientX - sx, ev.clientY - sy) > 4) { stop(); beginDrag(li, ev); } };
  document.addEventListener("pointermove", move); document.addEventListener("pointerup", stop); document.addEventListener("pointercancel", stop);
}

function updateRow(li, it) {
  const tx = li.querySelector(".tx");
  const rule = M.ruleOf(doc, it.id), ret = listMode === "edit" ? M.returnOf(doc, it.id) : null;
  const marks = (rule ? "r" : "") + (ret ? "t" : "");
  const changedText = tx.dataset.text !== it.text || tx.dataset.cap !== captionFor(it) || tx.dataset.note !== (it.note || "") || tx.dataset.marks !== marks;
  if (changedText) {
    tx.textContent = it.text;
    tx.dataset.text = it.text; tx.dataset.cap = captionFor(it); tx.dataset.note = it.note || ""; tx.dataset.marks = marks;
    if (rule) { const r = document.createElement("span"); r.className = "rep"; r.textContent = "↻"; r.title = ruleLabel(rule); r.setAttribute("aria-label", "Repeats: " + ruleLabel(rule)); tx.appendChild(r); }
    const cap = captionFor(it);
    if (cap) { const c = document.createElement("span"); c.className = "cap"; c.textContent = cap; tx.appendChild(c); }
    if (ret) { const c = document.createElement("span"); c.className = "cap tmr"; c.textContent = "tomorrow"; c.title = "Not today: back on Today at tomorrow's rollover"; tx.appendChild(c); }
    if (it.note) { const n = document.createElement("span"); n.className = "note"; n.textContent = it.note; tx.appendChild(n); }
  }
  li.classList.toggle("done", it.done);
  const chk = li.querySelector(".check");
  chk.setAttribute("aria-checked", it.done ? "true" : "false");
  if (listMode === "view") chk.setAttribute("aria-readonly", "true"); else chk.removeAttribute("aria-readonly");
  const today = li.querySelector(".today");
  if (today) {
    // the name stays "Today"; aria-pressed carries the state, the description says what a press does
    today.setAttribute("aria-pressed", it.today ? "true" : "false");
    today.setAttribute("aria-description", it.today ? "Take this line off Today" : "Put this line on Today");
    today.dataset.tip = it.today ? "On Today — click to take it off" : "Put this line on Today";
  }
  if (view === "all") li.classList.toggle("miss", !!query && !matches(it, query));
  return changedText;
}
function captionFor(it) { return view === "today" ? M.sectionName(doc, it.sectionId) : ""; }
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function ruleLabel(r) {
  if (!r) return "Never";
  if (r.kind === "daily") return "Every day";
  if (r.kind === "weekdays") return "Weekdays";
  if (r.kind === "weekly") return (r.days || []).length ? (r.days.length === 7 ? "Every day" : r.days.map(d => DAY_NAMES[d]).join(", ")) : "Chosen days";
  if (r.kind === "monthly") return "Monthly on the " + ordinal(r.day || 1);
  return "Repeats";
}
function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function matches(it, q) { const s = q.toLowerCase(); return it.text.toLowerCase().includes(s) || (it.note || "").toLowerCase().includes(s); }

function renderToday({ animate, quiet }) {
  const list = $("#list");
  const items = todayList();
  const n = items.length;
  list.dataset.count = Math.min(n, 8);
  list.style.setProperty("--unit", n > 8 ? (41 / n) + "vh" : "");
  const keep = new Set();
  const relayout = [];
  const one = !!dev.oneThing && listMode === "edit" && !demo;
  const undone = one ? items.filter(i => !i.done) : [];
  if (shuffledId && !undone.some(i => i.id === shuffledId)) shuffledId = null; // crossed off, or gone: back to the top
  const first = one ? (undone.find(i => i.id === shuffledId) || undone[0] || null) : null;
  for (const it of items) {
    keep.add(it.id);
    let li = rows.get(it.id), fresh = false;
    if (!li) { li = makeRow(it); rows.set(it.id, li); list.appendChild(li); fresh = true; if (quiet && animate && !RM.matches) li.classList.add("arrive"); }
    const was = li.classList.contains("one-now");
    li.classList.toggle("one-now", !!first && first.id === it.id);
    if (first && first.id === it.id && !was && !fresh && animate && !RM.matches) li.classList.add("arrive");
    if (updateRow(li, it) || fresh || (one && first && first.id === it.id && !was)) relayout.push(li);
    if (!li.parentNode) list.appendChild(li);
  }
  for (const [id, li] of rows) if (!keep.has(id)) { rows.delete(id); if (editing && editing.id === id) cancelEdit(true); li.remove(); }
  orderInto(list, items.map(i => i.id), animate);
  let more = list.parentNode.querySelector(".one-more");
  if (one) {
    if (!more) { more = document.createElement("div"); more.className = "one-more"; list.after(more); }
    const left = items.filter(i => !i.done).length - (first ? 1 : 0);
    more.textContent = first ? (left ? left + " more after this" : "Last one") : "";
  } else if (more) more.remove();
  layoutAll(relayout);
  $("#addtoday").hidden = false;
}

function renderAll({ animate, quiet }) {
  const root = $("#all");
  const secs = M.sectionsOrdered(doc);
  const groups = [{ id: "", name: "Unsorted", implicit: !secs.length, collapsed: false }].concat(listMode === "view" ? secs.map(s => ({ ...s, collapsed: viewCollapsed.has(s.id) })) : secs);
  const keepSec = new Set(), keep = new Set(), relayout = [];
  const moves = [];
  root.classList.toggle("searching", !!query);
  let hits = 0;
  for (const g of groups) {
    keepSec.add(g.id);
    let sec = root.querySelector(`.sec[data-id="${CSS.escape(g.id)}"]`);
    if (!sec) { sec = makeSection(g); root.appendChild(sec); }
    updateSection(sec, g);
    const list = sec.querySelector(".seclist");
    const items = M.itemsInSection(doc, g.id);
    let hit = 0;
    for (const it of items) {
      keep.add(it.id);
      let li = rows.get(it.id), fresh = false;
      if (!li) { li = makeRow(it); rows.set(it.id, li); list.appendChild(li); fresh = true; if (quiet && animate && !RM.matches) li.classList.add("arrive"); }
      if (updateRow(li, it) || fresh) relayout.push(li);
      if (li.parentNode !== list) moves.push([li, list]);
      if (!query || matches(it, query)) hit++;
    }
    hits += hit;
    sec.classList.toggle("nohit", !!query && hit === 0);
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
  let none = root.querySelector(".nohits");
  if (query && !hits) { if (!none) { none = document.createElement("div"); none.className = "nohits"; } none.textContent = "Nothing matches “" + query + "”"; root.insertBefore(none, addsec); }
  else if (none) none.remove();
  renderDeleted(root);
  paintSearchHead();
  layoutAll(relayout);
}
/** Everything's search: no lone icon. Past eight lines a Search button sits in the header row; / opens the field any time. */
function paintSearchHead() {
  const open = !$("#search").hidden;
  $("#all-head").hidden = !(open || (doc && M.liveItems(doc).length > 8));
}
/** "Recently deleted (n)" at the bottom of Everything: the tombstones that remember their line, with Restore. */
function renderDeleted(root) {
  let shelf = root.querySelector("#deleted");
  const gone = listMode === "edit" && !query ? M.recentlyDeleted(doc) : [];
  if (!gone.length) { if (shelf) shelf.remove(); return; }
  if (!shelf) {
    shelf = document.createElement("details"); shelf.id = "deleted"; shelf.className = "deleted";
    shelf.innerHTML = '<summary><span class="caret" aria-hidden="true">›</span><span class="lb"></span></summary><ul></ul>';
    shelf.addEventListener("click", e => { const b = e.target.closest("[data-restore]"); if (b) { e.preventDefault(); restoreItem(b.dataset.restore); } });
  }
  root.appendChild(shelf);
  shelf.querySelector(".lb").textContent = `Recently deleted (${gone.length})`;
  const ul = shelf.querySelector("ul"); ul.innerHTML = "";
  for (const t of gone) {
    const li = document.createElement("li");
    const s = document.createElement("span"); s.className = "t"; s.textContent = t.text + (t.note ? " · " + t.note : "");
    const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = "Restore"; b.dataset.restore = t.id; b.setAttribute("aria-label", "Restore “" + t.text + "”");
    li.append(s, b); ul.appendChild(li);
  }
}
function restoreItem(id) {
  if (!canEdit()) return;
  const t = doc.items[id]; if (!t || !t.deleted) return;
  doc = M.restoreItem(doc, id);
  afterChange({ animate: true });
  toast(`Restored “${t.text.length > 40 ? t.text.slice(0, 40) + "…" : t.text}”`);
  focusRow(id);
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
  sec.querySelector(".sec-more").hidden = false; // Unsorted has a menu too (templates, put all on Today)
  sec.querySelector(".sec-more").dataset.unsorted = g.id === "" ? "1" : "";
}

/** Put the given ids in order inside `container` with the fewest DOM moves (rows already in place are never
    detached, so a render cannot cancel a click in progress or steal focus), FLIP-animating when asked. */
function orderInto(container, ids, animate) {
  const wanted = ids.filter(id => rows.has(id));
  const els = wanted.map(id => rows.get(id));
  for (const el of els) if (el.parentNode !== container) container.appendChild(el);
  const current = Array.from(container.children).filter(el => el.classList && el.classList.contains("row")).map(el => el.dataset.id);
  const plan = M.reorderPlan(current, wanted);
  if (!plan.length) return;
  const first = new Map();
  if (animate && !RM.matches) for (const el of els) first.set(el, el.getBoundingClientRect().top);
  const active = document.activeElement;
  for (const m of plan) {
    const el = rows.get(m.id); const before = m.before ? rows.get(m.before) : null;
    if (el) container.insertBefore(el, before && before.parentNode === container ? before : null);
  }
  if (active && active !== document.body && document.activeElement !== active && active.isConnected) { try { active.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
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
function relayout() { clearTimeout(rz); rz = setTimeout(() => { layoutAll(); placeMark(); }, 130); }
addEventListener("resize", relayout);
if (window.ResizeObserver) new ResizeObserver(relayout).observe($("#main"));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layoutAll());
if (document.fonts) document.fonts.addEventListener("loadingdone", () => layoutAll());

function paint() {
  const t = todayList(), n = t.length, d = t.filter(i => i.done).length;
  const countHtml = `<b>${d}</b>/${n}<span class="sr-only"> done</span>`;
  if ($("#count").innerHTML !== countHtml) $("#count").innerHTML = countHtml;
  $("#count").setAttribute("aria-pressed", dev.oneThing && listMode === "edit" ? "true" : "false");
  const fill = $("#fill");
  fill.style.width = (n ? (d / n * 100) : 0) + "%";
  fill.classList.toggle("full", n > 0 && d === n);
  // four items per view; everything else is one keystroke away in the ? reference
  $("#hint").innerHTML = view === "today"
    ? `<em>${n > 1 ? "1–" + Math.min(n, 9) : "1"}</em> check off &nbsp;·&nbsp; <em>N</em> new &nbsp;·&nbsp; <em>E</em> edit &nbsp;·&nbsp; <em>?</em> help`
    : `<em>A</em> today &nbsp;·&nbsp; <em>N</em> new &nbsp;·&nbsp; <em>/</em> search &nbsp;·&nbsp; <em>?</em> help`;
  const fin = $("#finale"), hint = $("#hint");
  const finale = view === "today" && allDoneToday() && !editing;
  if (finale) { fin.classList.add("on"); hint.classList.add("off"); }
  else { fin.classList.remove("on"); hint.classList.remove("off"); }
  if (finale !== finaleOn) { finaleOn = finale; idleReset(); } // the controls never fade during the finale
  paintReview(finale);
  $("#streak-k").textContent = (s => s ? s + " day" + (s > 1 ? "s" : "") : "")(M.streak(doc));
}
/** Day review: a quiet card under "That's the list", only when the setting is on, dismissed by any tap or key. */
function paintReview(finale) {
  const card = $("#review");
  const show = finale && !!dev.review && listMode === "edit" && !reviewDismissed;
  if (!show) { card.hidden = true; if (!finale) reviewDismissed = false; return; }
  const r = M.dayReview(doc);
  card.innerHTML = `<div class="r-head"><span>Today</span><span class="r-streak">${r.streak ? r.streak + "-day streak" : "Streak starts today"}</span></div>` +
    `<div class="r-week">${r.days.map(d => `<i class="${d.finished ? "on" : ""}${d.future ? " future" : ""}" title="${d.day}"></i>`).join("")}<span>${r.finishedThisWeek} of 7 days finished this week</span></div>` +
    `<ul>${r.lines.map(l => `<li class="${l.done ? "done" : ""}">${escapeHtml(l.text)}</li>`).join("")}</ul>`;
  card.hidden = false;
}
function dismissReview() { if (!$("#review").hidden) { reviewDismissed = true; $("#review").hidden = true; } }
document.addEventListener("pointerdown", dismissReview, true);
document.addEventListener("keydown", dismissReview, true);

function paintStatus(s) {
  syncStatus = s;
  const dot = $("#dot");
  dot.dataset.s = s;
  const paused = s === "synced" && !syncLive && transport && Date.now() > liveGrace && listMode !== undefined;
  dot.dataset.live = syncLive || s !== "synced" ? "1" : (Date.now() > liveGrace ? "0" : "1");
  const label = (paused ? "Synced · live updates paused" : STATUS_LABEL[s]) || s;
  dot.querySelector(".lbl").textContent = STATUS_SHORT[s] || label;
  dot.setAttribute("title", label);
  dot.setAttribute("aria-label", "Sync status: " + label);
  const cat = STATUS_CAT(s);
  if (cat !== lastCat) { lastCat = cat; const sr = $("#dot-sr"); if (sr) sr.textContent = cat === "ok" ? (lastCat && s === "synced" ? "Synced" : "") : label; }
  if (s === "synced") { settleMigrations(); retryPendingKills(); } // follow-ups that wait for the first successful push
  if ((s === "busy" || s === "full" || s === "toolarge") && lastLimitToast !== s) {
    lastLimitToast = s;
    toast(s === "busy" ? "The server's busy. Your list is safe here—it'll sync again in a few minutes." : s === "full" ? "The service is full right now. Your list is safe on this device." : "This list is too large to sync. Clear out some old lines or history.");
  }
  if (s === "synced") lastLimitToast = "";
  if (s === "gone") applyPendingAdd();
}
$("#dot").addEventListener("click", () => { toast($("#dot").getAttribute("title") || ""); });
/** Who's here: one dot per other device (five, then "+n"), fading in and out. */
function paintWho(n) {
  whoCount = n;
  const el = $("#who");
  const show = n > 0 && !!doc && !dev.whoOff;
  if (!show) { if (!el.hidden) { el.classList.add("fade"); setTimeout(() => { if (whoCount === 0 || dev.whoOff || !doc) { el.hidden = true; el.classList.remove("fade"); } }, 420); } return; }
  el.hidden = false; el.classList.remove("fade");
  const dots = el.querySelector(".dots");
  const want = Math.min(n, 5);
  while (dots.children.length < want) { const i = document.createElement("i"); dots.appendChild(i); requestAnimationFrame(() => i.classList.add("on")); }
  while (dots.children.length > want) dots.lastChild.remove();
  el.querySelector(".plus").textContent = n > 5 ? "+" + (n - 5) : "";
  const label = n === 1 ? "1 other device has this list open" : n + " others have this list open";
  el.title = label; el.querySelector("#who-sr").textContent = label;
}

/* ---------------- changes ---------------- */
function afterChange({ animate = true, delay = 0 } = {}) {
  doc.updatedAt = M.now();
  if (sync) sync.update(doc);
  else if (!demo) { const l = loadLocal(listId); saveLocal(listId, { doc, rev: l ? l.rev : 0, dirty: true, created: l ? l.created : true, mode: listMode }); } // the welcome's list lives nowhere but here
  if (delay) setTimeout(() => render({ animate }), delay); else render({ animate });
  paintListName();
  demoNudge();
}
/** A remote document arrived (`prev` is the one it replaces). Quiet by default: no sound, no confetti, no kick; rows
    animate into place. A view link celebrates what the editors did; an edit link only when the setting says so. */
function applyRemote(prev) {
  if (drag) abortDrag(); // the row under the finger may be gone or moved; a stuck drag would swallow every tap
  const before = wasAll;
  const nowAll = allDoneToday();
  render({ animate: true, quiet: true });
  wasAll = nowAll;
  paintListName();
  if (editing && !doc.items[editing.id]) cancelEdit(true);
  if (prev && (listMode === "view" || dev.celebrateRemote)) celebrateRemote(prev, before, nowAll);
}
function celebrateRemote(prev, before, nowAll) {
  const doneNow = [];
  for (const it of todayList()) { const p = prev.items && prev.items[it.id]; if (it.done && (!p || p.deleted || !p.done)) doneNow.push(it); }
  if (!doneNow.length) return;
  const t = performance.now();
  if (t - lastRemoteCelebrate > 250) { lastRemoteCelebrate = t; sound.check(Math.max(0, doneCountToday() - 1)); }
  if (view === "today" && !RM.matches) for (const it of doneNow) {
    const li = rows.get(it.id); if (!li) continue;
    const r = li.querySelector(".tx").getBoundingClientRect();
    fx.burst(Math.min(r.right, innerWidth - 40), r.top + r.height * 0.5, 30, 11, 1.8);
  }
  if (nowAll && !before) setTimeout(() => { sound.finish(); fx.volley(); const g = $("#glow"); g.classList.add("flare"); setTimeout(() => g.classList.remove("flare"), 900); }, 500);
}

function toggle(id, px, py, fromPointer) {
  if (!canEdit()) return;
  const it = doc.items[id]; if (!it || it.deleted) return;
  if (editing) { if (editing.id === id) return; commitEdit(); }
  const li = rows.get(id);
  pushUndo(it.done ? "Undone" : "Done", [id]);
  const ts = M.now();
  it.done = !it.done; it.doneAt = it.done ? ts : 0; it.updatedAt = ts; // one stamp: a rollover elsewhere is recognisable by it
  if (li) { li.classList.toggle("done", it.done); li.querySelector(".check").setAttribute("aria-checked", it.done ? "true" : "false"); }
  if (it.done) {
    const played = sound.check(Math.max(0, (view === "today" ? doneCountToday() : M.itemsInSection(doc, it.sectionId).filter(i => i.done).length) - 1));
    haptic();
    if (played && IOS && !dev.muted && !dev.silentHint) { dev.silentHint = true; saveDevice(); setTimeout(() => toast("Hearing nothing? The ring/silent switch mutes the app's sounds too."), 900); }
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
      if (dev.oneThing) setOneThing(false, { silent: true }); // the finale shows the whole list
      sound.finish(); fx.volley();
      const g = $("#glow"); g.classList.add("flare"); setTimeout(() => g.classList.remove("flare"), 900);
    }, 640);
    wasAll = now;
  }
}
/** iOS haptics through a hidden native switch: toggling it inside the tap is what fires the tick. No-op elsewhere. */
function haptic() {
  if (!HAPTIC || dev.haptics === false) return;
  try { const h = document.getElementById("haptic"); const a = document.activeElement; h.click(); if (document.activeElement !== a && a && a.focus) a.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
}

/* taps: recognised from the pointer, so a render or a remote change between press and release cannot swallow them */
function onPress(li, e) {
  if (e.button !== 0 || e.isPrimary === false) return;
  if (!e.target.closest(".check") || e.target.closest(".einput")) return;
  if (editing || drag) return;
  press = { id: li.dataset.id, x: e.clientX, y: e.clientY, t: performance.now(), pointerId: e.pointerId, type: e.pointerType };
}
function recentlyTapped(id) { return !!tapped && tapped.id === id && performance.now() - tapped.t < 700; }
document.addEventListener("pointerup", e => {
  const p = press; press = null;
  if (!p || e.pointerId !== p.pointerId) return;
  if (drag || clickAfterDrag() || editing) return;
  if (swipe && swipe.moving) return;
  if (p.type === "touch" && performance.now() - p.t > 450) return; // held: a drag attempt, not a tap
  const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const row = under && under.closest ? under.closest(".row") : null;
  const sameRow = !!row && row.dataset.id === p.id && !!(under.closest(".check"));
  if (!sameRow && moved > 10) return; // released somewhere else on purpose
  if (!doc || !doc.items[p.id] || !rows.has(p.id)) return;
  tapped = { id: p.id, t: performance.now(), touch: p.type === "touch" };
  toggle(p.id, e.clientX, e.clientY, true);
}, true);
document.addEventListener("pointercancel", () => { press = null; }, true);

/* swipes across a line (touch only): leftwards is "Not today" (off in Settings → Behavior), rightwards opens the line's menu */
function swipeStart(li, e) {
  if (!canEdit() || e.pointerType !== "touch" || e.button !== 0 || editing || drag) return;
  if (e.target.closest(".tool")) return;
  const it = doc.items[li.dataset.id]; if (!it || it.deleted) return;
  swipe = { id: li.dataset.id, li, x: e.clientX, y: e.clientY, pointerId: e.pointerId, moving: false, dx: 0, dir: "" };
  const move = ev => {
    if (!swipe || ev.pointerId !== swipe.pointerId) return;
    const dx = ev.clientX - swipe.x, dy = ev.clientY - swipe.y;
    if (!swipe.moving) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { end(); return; } // a scroll
      if (Math.abs(dx) < 14) return;
      if (drag || (dx < 0 && dev.swipeOff)) { end(); return; }
      swipe.moving = true; swipe.dir = dx < 0 ? "left" : "right"; press = null; li.classList.add("swiping");
      try { li.setPointerCapture(ev.pointerId); } catch (x) { /* ignore */ }
    }
    swipe.dx = swipe.dir === "left" ? Math.min(0, dx) : Math.max(0, Math.min(72, dx));
    li.style.transform = `translateX(${swipe.dx}px)`; li.style.opacity = swipe.dir === "left" ? String(Math.max(0.35, 1 + swipe.dx / 260)) : "";
  };
  const up = ev => {
    if (!swipe || ev.pointerId !== swipe.pointerId) return;
    const s = swipe; end();
    if (s.moving && s.dir === "left" && s.dx < -90 && !s.li.classList.contains("done")) { s.li.classList.add("swipe-out"); s.li.style.transform = "translateX(-110%)"; setTimeout(() => { s.li.classList.remove("swipe-out"); s.li.style.transform = ""; s.li.style.opacity = ""; notToday(s.id); }, RM.matches ? 0 : 180); }
    else { s.li.style.transform = ""; s.li.style.opacity = ""; if (s.moving && s.dir === "right" && s.dx >= 48) openLineMenu(s.id); }
    if (s.moving) { dragEndedAt = performance.now(); } // the click that follows must not toggle
  };
  const end = () => { if (!swipe) return; swipe.li.classList.remove("swiping"); li.removeEventListener("pointermove", move); li.removeEventListener("pointerup", up); li.removeEventListener("pointercancel", cancel); try { li.releasePointerCapture(swipe.pointerId); } catch (x) { /* ignore */ } swipe = null; };
  const cancel = () => { if (swipe) { swipe.li.style.transform = ""; swipe.li.style.opacity = ""; } end(); };
  li.addEventListener("pointermove", move); li.addEventListener("pointerup", up); li.addEventListener("pointercancel", cancel);
}
/** Take a line off Today until tomorrow's rollover. */
function notToday(id) {
  if (!canEdit()) return;
  const it = doc.items[id]; if (!it || it.deleted) return;
  if (editing) commitEdit();
  if (!it.today && M.returnOf(doc, id)) { toast("Already off until tomorrow"); return; }
  pushUndo("Not today", [id]);
  doc = M.notToday(doc, id);
  sound.tick();
  afterChange({ animate: true });
  toast("Not today. It's back on Today tomorrow.", { undo: true });
}

function toggleToday(id) {
  if (!canEdit()) return;
  const it = doc.items[id]; if (!it || it.deleted) return;
  if (!it.today && M.returnOf(doc, id)) { pushUndo("On Today", [id]); doc = M.backToday(doc, id); sound.tick(); afterChange(); toast("On Today"); return; }
  it.today = !it.today;
  if (it.today) it.todayOrder = M.lastOrder(todayList(), i => i.todayOrder);
  it.updatedAt = M.now();
  if (it.today) { const r = M.ruleOf(doc, id); if (r) doc.rules[id] = { ...r, placed: M.localDate(), updatedAt: M.now() }; }
  sound.tick();
  afterChange();
  toast(it.today ? "On Today" : "Off Today");
}

function newItem({ sectionId = "", today = view === "today", afterId = null } = {}) {
  if (!canEdit()) return;
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
  if (dev.oneThing && view === "today") setOneThing(false, { silent: true }); // a new line is written in the full list
  render({ animate: false });
  startEdit(id, { isNew: true });
}

function renumber(sectionId, key) {
  const items = sectionId === null ? todayList().filter(i => !i.done) : M.itemsInSection(doc, sectionId).filter(i => !i.done);
  items.forEach((i, idx) => { i[key] = (idx + 1) * 1000; i.updatedAt = M.now(); });
}

function deleteItem(id, { silent = false } = {}) {
  if (!canEdit()) return;
  const it = doc.items[id]; if (!it || it.deleted) return;
  if (editing && editing.id === id) { editing = null; }
  if (!silent) pushUndo("Deleted", [id]);
  const text = it.text;
  const hadFocus = document.activeElement && document.activeElement.closest && document.activeElement.closest(".row") && document.activeElement.closest(".row").dataset.id === id;
  const next = hadFocus ? neighbourOf(id) : null;
  const ts = M.now();
  doc.items[id] = text ? M.tombstone(it, ts) : { id, deleted: true, updatedAt: ts }; // a line with words is remembered in Recently deleted
  if (M.ruleOf(doc, id)) doc.rules[id] = { id, deleted: true, updatedAt: ts };
  if (M.returnOf(doc, id)) doc.returns[id] = { id, deleted: true, updatedAt: ts };
  afterChange({ animate: true });
  if (hadFocus) { if (next && rows.has(next)) focusRow(next); else { const add = view === "today" ? $("#addtoday") : $("#all .add"); if (add) add.focus(); } }
  if (!silent) toast(`Deleted “${text.length > 40 ? text.slice(0, 40) + "…" : text}”`, { undo: true });
}

/* ---------------- undo ---------------- */
function pushUndo(label, ids, secIds = []) {
  const snap = (m, id) => (m && m[id]) ? JSON.parse(JSON.stringify(m[id])) : null;
  undoStack.push({
    label,
    items: ids.map(id => [id, snap(doc.items, id)]),
    rules: ids.map(id => [id, snap(doc.rules, id)]),
    returns: ids.map(id => [id, snap(doc.returns, id)]),
    sections: secIds.map(id => [id, snap(doc.sections, id)])
  });
  if (undoStack.length > 60) undoStack.shift();
}
function undo() {
  if (!canEdit()) return;
  const u = undoStack.pop();
  if (!u) return;
  if (editing) cancelEdit();
  const ts = M.now();
  for (const [id, rec] of u.items) doc.items[id] = rec ? { ...rec, updatedAt: ts } : { id, deleted: true, updatedAt: ts };
  for (const [id, rec] of u.rules || []) { if (rec) doc.rules[id] = { ...rec, updatedAt: ts }; else if (doc.rules[id] && !doc.rules[id].deleted) doc.rules[id] = { id, deleted: true, updatedAt: ts }; }
  for (const [id, rec] of u.returns || []) { if (rec) doc.returns[id] = { ...rec, updatedAt: ts }; else if (doc.returns[id] && !doc.returns[id].deleted) doc.returns[id] = { id, deleted: true, updatedAt: ts }; }
  for (const [id, rec] of u.sections) doc.sections[id] = rec ? { ...rec, updatedAt: ts } : { id, deleted: true, updatedAt: ts };
  sound.uncheck();
  afterChange();
  wasAll = allDoneToday();
  toast("Undone");
}

/** A toast. `undo: true` offers the undo stack; `action` offers a one-off undo of its own (delete everywhere) for `ms`. */
function toast(msg, { undo: withUndo = false, action = null, ms = 0 } = {}) {
  const t = $("#toast");
  t.querySelector(".msg").textContent = msg;
  toastAction = action;
  $("#toast-undo").hidden = !(action || (withUndo && canEdit()));
  t.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, ms || (action ? 10000 : withUndo ? 4500 : 2600));
}
function hideToast() { $("#toast").classList.remove("on"); $("#toast-undo").hidden = true; toastAction = null; }

/* ---------------- inline editing ---------------- */
function startEdit(id, { isNew = false } = {}) {
  if (!canEdit()) return;
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
  // the repeat rule lives in the editor: a chip that opens the picker for this line
  const erow = document.createElement("div"); erow.className = "erow";
  const rep = document.createElement("button"); rep.type = "button"; rep.className = "chip rep-chip"; rep.setAttribute("aria-haspopup", "dialog");
  const rule = M.ruleOf(doc, id); rep.textContent = "↻ " + (rule ? ruleLabel(rule) : "Repeat"); rep.classList.toggle("on", !!rule); rep.title = "Repeat: " + ruleLabel(rule);
  rep.addEventListener("pointerdown", e => e.preventDefault()); // keep the textarea's focus until we decide
  rep.addEventListener("click", () => { const cur = editing; if (!cur) return; if (!ta.value.trim()) { toast("Write the line first, then set how it repeats"); ta.focus(); return; } commitEdit(); openRepeat(cur.id); });
  erow.appendChild(rep);
  tx.hidden = true;
  tx.after(ta); ta.after(note); note.after(erow);
  const grow = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
  ta.addEventListener("input", grow);
  ta.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); const cur = editing; const had = ta.value.trim(); cur.byUser = true; commitEdit(); if (had) newItem({ afterId: cur.id, sectionId: doc.items[cur.id] ? doc.items[cur.id].sectionId : "" }); }
    else if (e.key === "Escape") { e.preventDefault(); editing.byUser = true; cancelEdit(); }
    else if (e.key === "Backspace" && ta.value === "") { e.preventDefault(); const cur = editing; editing = null; li.classList.remove("editing"); erow.remove(); deleteItem(cur.id, { silent: cur.isNew || !cur.orig }); focusRow(neighbourOf(cur.id)); }
    else if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); note.focus(); }
  });
  note.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); editing.byUser = true; commitEdit(); }
    else if (e.key === "Escape") { e.preventDefault(); editing.byUser = true; cancelEdit(); }
    else if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); ta.focus(); }
  });
  const onBlur = () => setTimeout(() => { if (editing && editing.id === id && document.activeElement !== ta && document.activeElement !== note && document.activeElement !== rep) { editing.byUser = true; commitEdit(); } }, 0);
  ta.addEventListener("blur", onBlur); note.addEventListener("blur", onBlur);
  editing = { id, el: li, ta, note, erow, isNew, orig: it.text, origNote: it.note || "" };
  li.querySelector(".lines").innerHTML = "";
  grow();
  ta.focus();
  if (!isNew) ta.setSelectionRange(ta.value.length, ta.value.length);
  paint();
}
/** Ids of the rows the user can currently see, top to bottom. */
function visibleRowIds() {
  const sel = view === "today" ? (dev.oneThing && listMode === "edit" ? "#list .row.one-now" : "#list .row") : "#all .sec:not([hidden]):not(.collapsed):not(.nohit) .row:not(.miss)";
  return $$(sel).map(li => li.dataset.id);
}
function neighbourOf(id) {
  const ids = visibleRowIds();
  const i = ids.indexOf(id);
  return ids[i - 1] || ids[i + 1] || null;
}
function endEditDom() {
  const e = editing; if (!e) return;
  e.ta.remove(); e.note.remove(); if (e.erow) e.erow.remove();
  const tx = e.el.querySelector(".tx"); tx.hidden = false;
  e.el.classList.remove("editing");
  editing = null;
  // the first line edited by hand earns the menu hint, shown once no editor is open (Enter may have opened the next line)
  if (e.byUser && !e.isNew && hintDue("menu")) menuHintFor = e.id;
  if (menuHintFor) setTimeout(hintMenu, 80);
}
/** The first time a line is edited: ⋯ (or, on the phone, the line itself) holds the rest of what a line can do. */
function hintMenu() {
  if (editing || !menuHintFor || !hintDue("menu")) return;
  const li = rows.get(menuHintFor) || rows.values().next().value; menuHintFor = null;
  if (!li) return;
  if (touchUi()) showMark("menu", li, "Hold a line for the rest: repeat, not today, move, delete.");
  else showMark("menu", li.querySelector(".tool.lmenu"), "⋯ has the rest: repeat, not today, move, delete.");
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
    doc = M.refreshRuleSnapshot(doc, e.id);
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
async function addSection() {
  if (!canEdit()) return;
  const name = await ask({ title: "New section", label: "Name", value: "" });
  if (!name) return;
  const id = M.shortId();
  const secs = M.sectionsOrdered(doc);
  doc.sections[id] = { id, name: name.trim().slice(0, 60), order: M.lastOrder(secs, s => s.order), collapsed: false, updatedAt: M.now() };
  afterChange({ animate: false });
}
function toggleCollapse(id) {
  const s = doc.sections[id]; if (!s || s.deleted) return;
  if (listMode === "view") { if (viewCollapsed.has(id)) viewCollapsed.delete(id); else viewCollapsed.add(id); render({ animate: false }); return; }
  s.collapsed = !s.collapsed; s.updatedAt = M.now();
  afterChange({ animate: false });
}
function openSectionMenu(id) { if (!canEdit()) return; panels().then(p => p.openSectionMenu(id)); }
function openLineMenu(id) { if (!canEdit()) return; if (editing) commitEdit(); panels().then(p => p.openLineMenu(id)); }
function openRepeat(id) { if (!canEdit()) return; panels().then(p => p.openRepeat(id)); }

/* ---------------- keyboard move ---------------- */
function moveFocused(dir) {
  if (!canEdit()) return;
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
  doc = M.refreshRuleSnapshot(doc, id);
  afterChange();
  focusRow(id);
}

/* ---------------- drag ---------------- */
const downPointers = new Set();
document.addEventListener("pointerdown", e => downPointers.add(e.pointerId), true);
document.addEventListener("pointerup", e => downPointers.delete(e.pointerId), true);
document.addEventListener("pointercancel", e => downPointers.delete(e.pointerId), true);
/* a hold on the phone: the line lifts; drag to move it, let go without moving for its menu (a done line goes straight to the menu) */
function longPressStart(li, e) {
  if (!canEdit()) return;
  if (e.pointerType !== "touch" || e.button !== 0) return;
  if (editing || drag || e.target.closest(".tool")) return;
  const id = li.dataset.id, it = doc.items[id];
  if (!it || it.deleted) return;
  const sx = e.clientX, sy = e.clientY, pid = e.pointerId;
  let t = 0;
  const cancel = () => { clearTimeout(t); li.removeEventListener("pointermove", onMove); li.removeEventListener("pointerup", cancel); li.removeEventListener("pointercancel", cancel); };
  const onMove = ev => { if (ev.pointerId === pid && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) cancel(); };
  t = setTimeout(() => {
    cancel();
    if (!downPointers.has(pid) || drag || editing || (swipe && swipe.moving)) return; // finger already lifted, or something else started
    press = null; // a hold is not a tap
    try { navigator.vibrate && navigator.vibrate(12); } catch (x) { /* ignore */ }
    const cur = doc.items[id];
    if (!cur || cur.deleted) return;
    if (cur.done) { dragEndedAt = performance.now(); openLineMenu(id); return; }
    beginDrag(li, e, true);
    if (drag) showMark("drag", li, "Drag to move it. Let go for the menu.");
  }, 400);
  li.addEventListener("pointermove", onMove);
  li.addEventListener("pointerup", cancel);
  li.addEventListener("pointercancel", cancel);
}
/** The click that follows a touch drag (lift without moving) must not check the line off. */
function clickAfterDrag() { return !!drag || (performance.now() - dragEndedAt) < 600; }
const preventTouch = e => { if (drag) e.preventDefault(); };
function beginDrag(li, e, fromLongPress) {
  if (!canEdit()) return;
  if (drag || editing) return;
  const id = li.dataset.id, it = doc.items[id];
  if (!it || it.deleted || it.done) return;
  press = null;
  if (swipe) { swipe.li.style.transform = ""; swipe.li.style.opacity = ""; swipe = null; }
  const rect = li.getBoundingClientRect();
  drag = { id, li, offY: e.clientY - rect.top, startTop: rect.top, pointerId: e.pointerId, overSec: null, lastY: e.clientY, raf: 0, fromHold: !!fromLongPress, startY: e.clientY, moved: false };
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
  li.addEventListener("lostpointercapture", () => { if (drag && drag.li === li && !li.isConnected) abortDrag(); }, { once: true });
  dragStep();
}
/** Put the dragged row back without committing anything (a render, a view switch or a lost row interrupted it). */
function abortDrag() { if (drag) endDrag(drag.move, drag.up, drag.cancelled, true); }
function dragStep() {
  if (!drag) return;
  drag.raf = 0;
  const y = drag.lastY, li = drag.li;
  if (Math.abs(y - drag.startY) > 8) drag.moved = true;
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
  const { id, li, fromHold, moved } = drag;
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
  if (!changed) { render({ animate: false }); if (fromHold && !moved) openLineMenu(id); return; } // a hold released in place: the menu
  pushUndo("Moved", [id]);
  it[key] = o;
  if (view === "all") it.sectionId = secId;
  it.updatedAt = M.now();
  doc = M.refreshRuleSnapshot(doc, id);
  sound.tick();
  afterChange({ animate: false });
  focusRow(id);
}

/* ---------------- panels: plumbing shared by every dialog ---------------- */
/** Open a dialog. With an anchor on the desktop it is a popover under that control (the ⋯, line and section menus);
    on the phone, or without one, it is the sheet or the centred panel it always was. */
function showPanel(id, { anchor = null } = {}) {
  if (!panelCssReady) { panelCss.then(() => showPanel(id, { anchor })); return; } // never paint a dialog before its stylesheet
  const d = document.getElementById(id);
  hideMark();
  if (openPanel && openPanel !== d) openPanel.close();
  openPanel = d;
  d.classList.remove("closing"); d.style.transform = ""; d.removeAttribute("data-drag");
  const pop = !!anchor && !sheetUi() && anchor.isConnected;
  d.classList.toggle("pop", pop); d.style.left = ""; d.style.top = "";
  if (!d.open) d.showModal();
  const body = d.querySelector(".body"); if (body) body.scrollTop = 0; // a sheet opens at its top, whatever it was scrolled to when it closed (⋯ → Theme must land on Appearance)
  if (pop) {
    const r = anchor.getBoundingClientRect(), w = d.offsetWidth, h = d.offsetHeight;
    const left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w));
    const top = r.bottom + 6 + h <= innerHeight - 8 ? r.bottom + 6 : Math.max(8, r.top - 6 - h);
    d.style.left = left + "px"; d.style.top = top + "px";
  }
  idleReset();
}
function closePanel() { if (openPanel) { const d = openPanel; openPanel = null; d.close(); } } // forget it now, not when the close event lands: what follows may need the panel gone
$$("dialog.panel").forEach(d => {
  d.addEventListener("close", () => { if (openPanel === d) openPanel = null; idleReset(); });
  d.addEventListener("cancel", () => { if (openPanel === d) openPanel = null; }); // Escape: forget it now, the close event lands a tick later
  d.addEventListener("click", e => { if (e.target === d && !clickAfterDrag()) d.close(); }); // not the click a browser synthesises after the hold that opened it
  d.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => d.close()));
  if (d.classList.contains("sheet")) wireSheetSwipe(d);
});
/** Bottom sheets close on a downward swipe (from the grip, the header, or the body when it is scrolled to the top). */
function wireSheetSwipe(d) {
  let st = null;
  d.addEventListener("pointerdown", e => {
    if (!sheetUi() || e.pointerType === "mouse" || e.button !== 0) return;
    const body = d.querySelector(".body");
    if (e.target.closest("input,select,textarea,canvas,.link,.days")) return;
    if (body && body.scrollTop > 0 && !e.target.closest(".grip, h2")) return;
    st = { y: e.clientY, x: e.clientX, t: performance.now(), id: e.pointerId, moving: false };
  });
  d.addEventListener("pointermove", e => {
    if (!st || e.pointerId !== st.id) return;
    const dy = e.clientY - st.y, dx = e.clientX - st.x;
    if (!st.moving) { if (Math.abs(dx) > Math.abs(dy) || dy < 8) { if (Math.abs(dx) > 12) st = null; return; } st.moving = true; d.setAttribute("data-drag", "1"); try { d.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } }
    d.style.transform = `translateY(${Math.max(0, dy)}px)`;
  });
  const end = e => {
    if (!st || e.pointerId !== st.id) return;
    const dy = e.clientY - st.y, dt = performance.now() - st.t; const s = st; st = null;
    d.removeAttribute("data-drag");
    if (s.moving && (dy > 90 || (dy > 30 && dy / dt > 0.5))) {
      d.classList.add("closing"); d.style.transform = "";
      setTimeout(() => { d.classList.remove("closing"); if (d.open) d.close(); }, RM.matches ? 0 : 200);
    } else d.style.transform = "";
  };
  d.addEventListener("pointerup", end); d.addEventListener("pointercancel", end);
}
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

/* the ⋯ menu: Share · Theme · Sound · Full screen · How it works · Lists · Settings · About · Delete (nine rows is the ceiling);
   1.3: a Save your link row stands above them, with a dot, only until this device's list has its link saved */
$("#more").addEventListener("click", () => { paintMenu(); showPanel("p-menu", { anchor: $("#more") }); });
/** The registry entry of the open list when its link has not been saved yet (a list this device made). */
function unsavedEntry() { const e = listId && meta.lists.find(l => l.id === listId); return e && e.created && e.linkSaved === false && listMode === "edit" ? e : null; }
function paintMenu() {
  $("#menu-save").hidden = !doc || !unsavedEntry();
  $("#menu-share-lb").textContent = listMode === "view" ? "Share the View link" : "Share this list";
  $('#p-menu [data-act="share"] .k').hidden = sheetUi();
  $("#menu-theme-k").textContent = theme ? theme.name : "";
  paintMute();
  $("#menu-full").hidden = !document.fullscreenEnabled;
  $("#menu-delete").hidden = !doc || listMode !== "edit";
  $("#settings-k").textContent = "";
}
$("#p-menu").addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "sound") { toggleMute(); return; } // a toggle row: the menu stays, the state flips
  closePanel();
  if (act === "save") panels().then(p => p.showSaveLink());
  else if (act === "share") panels().then(p => p.openShare());
  else if (act === "theme") panels().then(p => p.openSettings()); // 1.2: Appearance (Day theme · Night theme · Switch) is the theme's home
  else if (act === "full") toggleFullscreen();
  else if (act === "help") panels().then(p => p.openHelp());
  else if (act === "lists") panels().then(p => p.openLists());
  else if (act === "settings") panels().then(p => p.openSettings());
  else if (act === "delete") panels().then(p => p.deleteEverywhere());
});

/* ---------------- idle fade (desktop) ----------------
   About four seconds without the mouse or a key and the rail and the footer fade to the date and the count (the
   presence dots stay). Any move or key brings them back. Off while a panel is open, off during the finale, off under
   prefers-reduced-motion, and Settings → Behavior turns it off for good.                                        */
const IDLE_MS = 4000;
function idleAllowed() { return HOVER.matches && !dev.idleFadeOff && !RM.matches && !!doc && !openPanel && !finaleOn && !drag; }
function idleReset() {
  if (idleOn) { idleOn = false; document.body.classList.remove("idle"); }
  clearTimeout(idleTimer); idleTimer = 0;
  if (idleAllowed()) idleTimer = setTimeout(() => { idleTimer = 0; if (idleAllowed()) { idleOn = true; document.body.classList.add("idle"); } }, IDLE_MS);
}
document.addEventListener("pointermove", idleReset, { passive: true, capture: true });
document.addEventListener("pointerdown", idleReset, { passive: true, capture: true });
document.addEventListener("keydown", idleReset, true);
document.addEventListener("focusin", idleReset);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") idleReset(); });
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
  if (document.visibilityState === "visible") { if (dev.wake && !wakeLock) requestWake(); sound.foreground(); tickDay(); }
});
if (dev.wake) requestWake();
if (dev.oneThing && dev.shake === "allowed") startMotion(); // a phone that said yes keeps listening from the next open

/* rollover + date + the theme schedule, once a minute */
function tickDay() {
  paintDate();
  tickTheme();
  if (!doc || listMode !== "edit" || demo) return;
  const r = M.rollover(doc);
  if (r.doc !== doc) { if (drag) abortDrag(); doc = r.doc; afterChange({ animate: true }); wasAll = allDoneToday(); }
}
setInterval(() => { tickDay(); retryPendingKills(); settleMigrations(); }, 60000);

/* ---------------- links ---------------- */
function editLink() { return ref && ref.mode === "edit" ? BASE + "#/l/" + ref.W : null; }
function viewLink() { return ref ? BASE + "#/r/" + ref.R : null; }
async function drawQr(canvas, text) {
  const { default: qrcode } = await import("./qr.js");
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(), scale = Math.max(3, Math.floor(200 / n)), quiet = 2;
  const size = (n + quiet * 2) * scale;
  canvas.width = size; canvas.height = size; canvas.style.width = canvas.style.height = size + "px";
  const g = canvas.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, size, size); g.fillStyle = "#111";
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.isDark(r, col)) g.fillRect((col + quiet) * scale, (r + quiet) * scale, scale, scale);
}
async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg || "Copied"); } catch (e) { toast("Select the link and copy it"); }
}
function nativeShare(text) {
  if (!navigator.share) return false;
  navigator.share({ title: "Today's Five", text: "Today's Five list", url: text }).catch(() => {});
  return true;
}
$$(".link").forEach(el => el.addEventListener("focus", () => { try { el.select(); } catch (e) { /* ignore */ } }));
$("#share").addEventListener("click", () => panels().then(p => p.openShare()));
async function killRemote(k) {
  if (!transport) { queueKill(k); return false; }
  try {
    await sync.remove(k.lookupId, k.token);
    sync.announceGone(k.lookupId);
    meta.pendingKill = (meta.pendingKill || []).filter(x => x.lookupId !== k.lookupId); saveDevice();
    return true;
  } catch (e) { queueKill(k); return false; }
}
function queueKill(k) { meta.pendingKill = [...(meta.pendingKill || []).filter(x => x.lookupId !== k.lookupId), k]; saveDevice(); }
async function retryPendingKills() {
  if (killing || !transport || !sync || !(meta.pendingKill || []).length || !navigator.onLine) return;
  killing = true;
  try { for (const k of [...meta.pendingKill]) await killRemote(k); } finally { killing = false; }
}
addEventListener("online", () => setTimeout(() => { retryPendingKills(); settleMigrations(); flushOthers(); }, 1500));

/* lists: the pieces the welcome screen and the switcher need before any panel has loaded */
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function createList(d, id) {
  saveLocal(id, { doc: d, rev: 0, dirty: true, created: true, mode: "edit" });
  const e = registerList(id, d.name, "edit"); e.created = true; e.linkSaved = false;
  switchTo({ id, mode: "edit" });
}
function parseLink(s) {
  const t = String(s || "").trim();
  const m = t.match(/#\/(l|r)\/([0-9A-Za-z]{22,64})/);
  if (m) return { id: m[2], mode: m[1] === "r" ? "view" : "edit" };
  const bare = t.match(/^([0-9A-Za-z]{22,64})$/);
  return bare ? { id: bare[1], mode: "edit" } : null;
}
function switchTo(r, { paste = false } = {}) {
  if (r.id === listId && r.mode === listMode) return;
  if (paste && listId && syncStatus === "gone" && r.mode === "edit") {
    // the old link died (rotated or migrated elsewhere): remember where it went, and carry unsynced edits if the docs are kin
    meta.redirect = { ...(meta.redirect || {}), [listId]: r.id };
    meta.carry = { from: listId, to: r.id };
  }
  meta.current = r.id; meta.currentMode = r.mode; saveDevice();
  if (IOS && !STANDALONE) {
    reloading = true;
    const target = BASE + SEARCH + frag(r);
    if (location.origin + location.pathname === BASE) { flushQuick().then(() => { location.replace(target); location.reload(); }); }
    else location.replace(target); // path changes (…/index.html): this is a real navigation, no reload needed
    return;
  }
  openList(r);
}
$("#listname").addEventListener("click", () => panels().then(p => p.openLists()));
$("#w-keep").addEventListener("click", keepDemo);
$("#w-skip").addEventListener("click", keepDemo); // Skip is Keep without the play: the same three lines, as they stand
$("#w-paste-show").addEventListener("click", () => { $("#w-paste-form").hidden = false; $("#w-paste").focus(); });
$("#w-paste-form").addEventListener("submit", e => {
  e.preventDefault();
  const r = parseLink($("#w-paste").value);
  if (!r) { $("#w-err").textContent = "That doesn't look like a list link. It ends in #/l/ or #/r/ followed by 22 letters and digits."; return; }
  switchTo(r, { paste: true });
});

/* ---------------- one-thing mode, search ---------------- */
/** Only the top undone Today line, enormous. `O` or the count toggles it; the finale ends it. Remembered per device. */
function setOneThing(on, { silent = false, keep = false } = {}) {
  if (!keep) { dev.oneThing = !!on; saveDevice(); }
  shuffledId = null;
  document.body.classList.toggle("one", !!on && !!doc && listMode === "edit" && !demo);
  if (doc) { if (editing) commitEdit(); if (view !== "today" && on) setView("today"); else render({ animate: false }); }
  if (!silent) toast(on ? "One thing at a time. O or the count brings the list back." : "The whole list");
  if (on && doc && !demo) shakeReady();
}
$("#count").addEventListener("click", () => { if (!doc || listMode !== "edit" || demo) return; setOneThing(!dev.oneThing); });

/* ---------------- shuffle (1.3): a different undone line in one-thing mode ----------------
   Never the same line twice in a row, never a reorder: the shown line holds until it is crossed off or shuffled again,
   and a check-off puts the top undone line back. Triggers: S, the ↻ beside the count, a shake of the phone. */
function shuffle() {
  if (!doc || listMode !== "edit" || !dev.oneThing || demo || openPanel || editing || drag) return;
  const undone = todayList().filter(i => !i.done);
  const cur = $("#list .row.one-now");
  if (undone.length <= 1) { if (cur) { cur.classList.remove("wobble"); void cur.offsetWidth; cur.classList.add("wobble"); } return; } // one left: a small wobble, nothing changes
  const curId = cur ? cur.dataset.id : null;
  const pool = undone.filter(i => i.id !== curId);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const land = () => {
    shuffledId = pick.id;
    render({ animate: false });
    const next = $("#list .row.one-now");
    if (next && !RM.matches) { next.classList.remove("shuffle-in"); void next.offsetWidth; next.classList.add("shuffle-in"); }
  };
  if (cur && !RM.matches) { cur.classList.add("shuffle-out"); setTimeout(() => { cur.classList.remove("shuffle-out"); land(); }, 160); } else land();
  sound.tick();
  haptic();
  try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) { /* ignore */ }
}
$("#shuffle").addEventListener("click", shuffle);
/** Shake to shuffle: DeviceMotion, a delta of more than 15 m/s² between two samples, one shuffle a second, nothing while a
    panel is open. iOS asks for permission from a gesture: the first time one-thing mode opens on a phone, one hint with Allow,
    asked once and remembered either way (declined means ↻ only). Android needs no permission and listens straight away. */
function onMotion(e) {
  const a = (e.acceleration && e.acceleration.x !== null && e.acceleration.x !== undefined) ? e.acceleration : e.accelerationIncludingGravity;
  if (!a) return;
  const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
  if (lastAcc !== null && Math.abs(mag - lastAcc) > 15 && performance.now() - lastShake > 1000 && dev.oneThing && !openPanel && doc && listMode === "edit" && !demo) { lastShake = performance.now(); shuffle(); }
  lastAcc = mag;
}
function startMotion() { if (motionOn || typeof DeviceMotionEvent === "undefined") return; motionOn = true; addEventListener("devicemotion", onMotion); }
function shakeReady() {
  if (!touchUi() || typeof DeviceMotionEvent === "undefined") return;
  const asks = typeof DeviceMotionEvent.requestPermission === "function";
  if (dev.shake === "allowed") { startMotion(); return; }
  if (dev.shake === "declined") return;
  if (!asks) { dev.shake = "allowed"; saveDevice(); startMotion(); return; } // Android: no permission to ask for
  if (!openPanel) $("#shake-ask").hidden = false; // asked once, remembered either way
}
$("#shake-allow").addEventListener("click", async () => {
  $("#shake-ask").hidden = true;
  let r = "granted";
  try { r = await DeviceMotionEvent.requestPermission(); } catch (e) { r = "denied"; }
  dev.shake = r === "granted" ? "allowed" : "declined"; saveDevice();
  if (dev.shake === "allowed") { startMotion(); toast("Shake the phone for a different line"); }
});
$("#shake-x").addEventListener("click", () => { $("#shake-ask").hidden = true; dev.shake = "declined"; saveDevice(); });
function setSearch(q, { silent = false } = {}) {
  query = String(q || "").trim();
  const inp = $("#search"), btn = $("#search-btn");
  if (inp.value !== q) inp.value = q;
  const open = !!query || document.activeElement === inp;
  inp.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false");
  paintSearchHead();
  if (doc && view === "all" && !silent) render({ animate: false });
}
function openSearch() {
  if (!doc) return;
  if (view !== "all") setView("all");
  $("#all-head").hidden = false; $("#search").hidden = false; $("#search-btn").setAttribute("aria-expanded", "true");
  $("#search").focus();
}
function closeSearch() { setSearch(""); $("#search").hidden = true; $("#search-btn").setAttribute("aria-expanded", "false"); paintSearchHead(); }
$("#search-btn").addEventListener("click", () => { if ($("#search").hidden) openSearch(); else closeSearch(); });
$("#search").addEventListener("input", e => setSearch(e.target.value));
$("#search").addEventListener("keydown", e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeSearch(); if (!$("#all-head").hidden) $("#search-btn").focus(); } });
$("#search").addEventListener("blur", () => { if (!query) closeSearch(); });

/* ---------------- what's new ---------------- */
function maybeWhatsNew() {
  if (!whatsNewPending || whatsNewShown) return;
  setTimeout(async () => {
    if (whatsNewShown || openPanel) { if (!whatsNewShown) setTimeout(maybeWhatsNew, 3000); return; }
    whatsNewShown = true;
    dev.seenVersion = VERSION; saveDevice();
    // the toast is the headline only; "What's new" opens the About page's changelog
    let line = "Day and night, your way.";
    try { const r = await fetch("whatsnew.json", { cache: "no-cache" }); const j = await r.json(); const v = (j.versions || []).find(x => x.version === VERSION) || j.versions[0]; if (v && typeof v.headline === "string" && v.headline) line = v.headline; } catch (e) { /* the fallback line */ }
    $("#wn-msg").textContent = "New in " + VERSION + ": " + line;
    $("#whatsnew").hidden = false;
  }, 1200);
}
$("#wn-x").addEventListener("click", () => { $("#whatsnew").hidden = true; });
$("#wn-more").addEventListener("click", () => { $("#whatsnew").hidden = true; location.href = "about.html#whats-new"; });

/* ---------------- rail controls ---------------- */
function wireUi() {
  $("#v-today").addEventListener("click", () => setView("today"));
  $("#v-all").addEventListener("click", () => setView("all"));
  $("#again").addEventListener("click", startAgain);
  $("#addtoday").addEventListener("click", () => newItem({ today: true }));
  $("#daynight").addEventListener("click", flipSlot);
  $("#toast-undo").addEventListener("click", () => { const a = toastAction; hideToast(); if (a) a(); else undo(); });
  $("#install-x").addEventListener("click", () => { $("#install").hidden = true; document.body.classList.remove("install-on"); dev.installHint = true; saveDevice(); });
  if (IOS && !STANDALONE && !dev.installHint) setTimeout(() => { if (doc && !demo && !openPanel) { $("#install").hidden = false; document.body.classList.add("install-on"); } }, 2500);
  document.addEventListener("pointerdown", () => sound.prime(), { once: true, capture: true });
  document.body.classList.toggle("one", !!dev.oneThing);
}
function toggleMute() { dev.muted = !dev.muted; saveDevice(); paintMute(); if (!dev.muted) sound.tick(); dispatchEvent(new CustomEvent("tf:settings")); }
function paintMute() { $("#menu-sound-k").textContent = dev.muted ? "Off" : "On"; $('#p-menu [data-act="sound"]').setAttribute("aria-pressed", dev.muted ? "false" : "true"); }
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}
function startAgain() {
  if (!canEdit()) return;
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
    if (!canEdit()) return;
    e.preventDefault(); undo(); return;
  }
  if (openPanel || editing || inField) return;
  if (!doc) return;
  const edit = canEdit();
  if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { if (edit) { e.preventDefault(); moveFocused(e.key === "ArrowUp" ? -1 : 1); } return; }
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === "Escape") { hideToast(); if (query) setSearch(""); return; }
  if (dev.keysOff) return; // single-character shortcuts can be switched off (Settings → Behavior)
  if (demo && ["a", "A", "o", "O", "/", "-", "s", "S"].includes(k)) return; // the welcome's list is Today, whole, and nothing else
  if (k >= "1" && k <= "9") {
    if (!edit) return;
    const pos = parseInt(k, 10) - 1;
    const ids = visibleRowIds();
    if (pos < ids.length) { e.preventDefault(); toggle(ids[pos], 0, 0, false); }
  }
  else if (k === "s" || k === "S") { if (!edit || !dev.oneThing) return; e.preventDefault(); shuffle(); }
  else if (k === "m" || k === "M") { e.preventDefault(); toggleMute(); }
  else if (k === "t" || k === "T") { e.preventDefault(); if (e.shiftKey) panels().then(p => p.openSettings()); else flipSlot(); } // T flips Day and Night; Shift+T opens Appearance
  else if ((k === "f" || k === "F") && document.fullscreenEnabled) { e.preventDefault(); toggleFullscreen(); }
  else if (k === "e" || k === "E") { if (!edit) return; e.preventDefault(); const id = focusedRowId(); if (id) startEdit(id); }
  else if (k === "n" || k === "N") { if (!edit) return; e.preventDefault(); newItem({ today: view === "today", sectionId: view === "all" ? sectionOfFocused() : "" }); }
  else if (k === "a" || k === "A") { e.preventDefault(); setView(view === "today" ? "all" : "today"); }
  else if (k === "o" || k === "O") { if (!edit) return; e.preventDefault(); setOneThing(!dev.oneThing); }
  else if (k === "/") { e.preventDefault(); openSearch(); }
  else if (k === "-") { if (!edit) return; e.preventDefault(); const id = focusedRowId(); if (id && doc.items[id] && doc.items[id].today) notToday(id); }
  else if (k === "?") { e.preventDefault(); panels().then(p => p.openKeys()); }
});
function sectionOfFocused() {
  const id = focusedRowId();
  const it = id && doc.items[id];
  return it && !it.deleted && doc.sections[it.sectionId] && !doc.sections[it.sectionId].deleted ? it.sectionId : "";
}
/* ---------------- just-in-time hints (1.1) ----------------
   One line beside the real control, once per device, in place of the tour: the star the first time Everything
   opens, drag the first time a line is held (or its ⋯ hovered), the menu the first time a line is edited. Gone on
   the next tap or key, or when the control it points at goes away. Nothing appears unasked on Today.            */
function hintDue(key) { return canEdit() && !demo && !openPanel && !(dev.hints && dev.hints[key]); } // nothing appears unasked on the welcome
function showMark(key, target, text) {
  if (!hintDue(key) || !target || !target.isConnected) return false;
  dev.hints = { ...(dev.hints || {}), [key]: true }; saveDevice(); // once, read to the end or not
  hideMark();
  markTarget = target; markKey = key;
  target.classList.add("marked"); const row = target.closest(".row"); if (row) row.classList.add("marked-row");
  $("#mark-text").textContent = text;
  $("#mark").hidden = false;
  placeMark();
  return true;
}
function hideMark() {
  if (!markTarget) return;
  markTarget.classList.remove("marked"); const row = markTarget.closest(".row"); if (row) row.classList.remove("marked-row");
  markTarget = null; markKey = "";
  $("#mark").hidden = true;
}
function placeMark() {
  if (!markTarget) return;
  if (!markTarget.isConnected) { hideMark(); return; }
  const m = $("#mark"), r = markTarget.getBoundingClientRect();
  m.style.left = "0px"; m.style.top = "0px";
  const w = m.offsetWidth, h = m.offsetHeight;
  const left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2));
  const below = r.bottom + 14 + h < innerHeight - 12;
  m.dataset.place = below ? "below" : "above";
  m.style.left = left + "px"; m.style.top = (below ? r.bottom + 12 : Math.max(12, r.top - 12 - h)) + "px";
  m.style.setProperty("--arrow-x", Math.max(16, Math.min(w - 16, r.left + r.width / 2 - left)) + "px");
}
document.addEventListener("pointerdown", hideMark, true);
document.addEventListener("pointerup", () => { if (markTarget) setTimeout(hideMark, 80); }, true); // a hold's hint goes when the finger lifts
document.addEventListener("keydown", hideMark, true);
$("#all").addEventListener("scroll", placeMark, { passive: true });
$("#list").addEventListener("scroll", placeMark, { passive: true });
/** The first time Everything opens: the star on the first line. */
function hintToday() {
  if (!hintDue("today")) return;
  const star = $("#all .row .tool.today"); if (!star) return;
  requestAnimationFrame(() => showMark("today", star, "The star puts a line on Today, or takes it off."));
}

/* ---------------- what the lazy modules see ---------------- */
const api = {
  M, C, T, VERSION, BUILD, VERSION_LABEL, config, $, $$, IOS, STANDALONE, BASE, SEARCH, TRANSPORT_KIND, HOVER, NARROW, RM, DARK_MQ, touchUi, sheetUi, canEdit,
  meta, dev, rows, sound, fx,
  get demo() { return demo; }, unsavedEntry, shuffle,
  get doc() { return doc; }, set doc(v) { doc = v; },
  get listId() { return listId; }, get listMode() { return listMode; }, get ref() { return ref; }, get sync() { return sync; }, get transport() { return transport; },
  get theme() { return theme; }, get view() { return view; }, get syncStatus() { return syncStatus; }, get editing() { return editing; }, get openPanel() { return openPanel; },
  get whoCount() { return whoCount; },
  todayList, allDoneToday, setWasAll: () => { wasAll = allDoneToday(); },
  afterChange, applyRemote, render, setView, paint, paintListName, paintMute, paintStatus, paintMenu, paintWho, toast, hideToast, ask, showPanel, closePanel,
  focusRow, newItem, startEdit, commitEdit, deleteItem, toggle, toggleToday, notToday, pushUndo, undo, restoreItem,
  saveDevice, registerList, switchTo, openList, showWelcome, createList, parseLink, flushQuick, flushOthers, killRemote, queueKill, retryPendingKills,
  applyThemeCode, currentThemeCode, tickTheme, setSlotTheme, flipSlot, setSwitchMode, setSwitchTimes, activeSlot: () => T.activeSlot(dev, envNow()), autoSlot: () => T.autoSlot(dev, envNow()),
  slotCode: slot => dev[slot] || T.SLOT_DEFAULT[slot], setWake, toggleMute, toggleFullscreen, setOneThing, setSearch, ruleLabel, idleReset,
  editLink, viewLink, copyText, nativeShare, escapeHtml, drawQr, frag,
  resubscribePresence: () => { if (sync) sync.resubscribe(); paintWho(dev.whoOff ? 0 : whoCount); },
  loadLocal, saveLocal, removeLocal
};

/* test hook (read-only) */
window.__tf = () => ({ stats: { ...stats }, view, listId, mode: listMode, lookupId: ref ? ref.lookupId : null, R: ref ? ref.R : null, dragging: !!drag, editing: editing ? editing.id : null, status: syncStatus, live: syncLive, cur: sync ? sync.current() : null, tab: TAB_ID, hints: { ...(dev.hints || {}) }, mark: markTarget ? markKey : "", menuHintFor, panel: openPanel ? openPanel.id : null, editByUser: editing ? !!editing.byUser : null, idle: idleOn, migrations: (meta.migrations || []).length, pendingKill: (meta.pendingKill || []).length, who: whoCount, one: !!dev.oneThing, query, audio: sound.state(), version: VERSION, seenVersion: dev.seenVersion, presenceKey: PRESENCE_KEY, theme: theme ? theme.id : null, slot: T.activeSlot(dev, envNow()), auto: T.autoSlot(dev, envNow()), switchMode: dev.switch ? dev.switch.mode : null, hold: dev.holdAuto || null, day: dev.day, night: dev.night, fading: !!fadeRaf, demo, shuffled: shuffledId, oneNow: (() => { const r = $("#list .row.one-now"); return r ? r.dataset.id : null; })(), shake: dev.shake || null, motion: motionOn, unsaved: !!unsavedEntry() });
// test-only controls, on the local transport: simulate what iOS does to the audio context
if (TRANSPORT_KIND === "local") window.__tfTest = { suspendAudio: () => rawSound.debugContext("suspend"), killAudio: () => rawSound.debugContext("close"), rollover: today => { if (!doc) return; const r = M.rollover(doc, today); if (r.doc !== doc) { doc = r.doc; afterChange(); wasAll = allDoneToday(); } }, presence: n => paintWho(n) };

/* debug badge (?debug=1): the audio state machine, readable from a simulator screenshot */
if (new URLSearchParams(SEARCH).get("debug") === "1") {
  const b = document.createElement("div"); b.id = "dbg";
  b.style.cssText = "position:fixed;left:8px;top:calc(8px + env(safe-area-inset-top,0px));z-index:99;font:12px/1.4 ui-monospace,Menlo,monospace;color:#0f0;background:rgba(0,0,0,.75);padding:4px 6px;border-radius:6px;pointer-events:none;white-space:pre";
  document.body.appendChild(b);
  setInterval(() => { const a = sound.state(); b.textContent = `audio ${a.state} pending=${a.pending} made=${a.made} packs=${a.packs}\nchecks=${stats.check} finish=${stats.finish} sync=${syncStatus}`; }, 250);
}

/* ---------------- service worker ---------------- */
function registerSw() {
  if (!("serviceWorker" in navigator)) return;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") { if (new URLSearchParams(location.search).get("sw") !== "1") return; }
  addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
