// sync.js — local persistence, the transport interface (Supabase or same-origin local),
// and the sync engine: pull/merge/push with conflict retry, realtime wake-ups, reconnects.
//
// v3: the server only ever sees envelopes. The engine holds a `ref` for the open list
// ({ mode, lookupId, key, token }, see crypto.js), decrypts what it pulls, merges on plaintext
// (model.merge is commutative and idempotent) and re-encrypts what it pushes with a fresh iv.
// A view ref has no token and never pushes. Polls carry the known rev so an idle list costs bytes.

import { merge, normalize, canon } from "./model.js";
import * as C from "./crypto.js";

/* ---------------- localStorage ---------------- */

const K = {
  list: id => "tf/v3/list/" + id,
  legacy: id => "tf/v2/list/" + id,
  meta: "tf/v2/meta",                       // same key as v2: the boot script reads it and returning devices already have it
  local: id => "tf/v2/localserver/" + id
};

function read(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }
function remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }

export function loadLocal(id) {
  const v = read(K.list(id));
  if (!v || !v.doc) return null;
  return { doc: normalize(v.doc, id), rev: v.rev | 0, dirty: !!v.dirty, created: !!v.created, mode: v.mode === "view" ? "view" : "edit" };
}
/** `created` marks a list this device made itself (new, migrated, rotated): only those may be inserted on the server. */
export function saveLocal(id, { doc, rev, dirty, created, mode }) {
  return write(K.list(id), { doc, rev: rev | 0, dirty: !!dirty, created: !!created, mode: mode === "view" ? "view" : "edit", savedAt: Date.now() });
}
export function removeLocal(id) { remove(K.list(id)); }
/** A v2 (plaintext) list this device still holds under the old key. */
export function loadLegacyLocal(id) {
  const v = read(K.legacy(id));
  if (!v || !v.doc) return null;
  return { doc: normalize(v.doc, id), rev: v.rev | 0, dirty: !!v.dirty, created: !!v.created };
}
export function removeLegacyLocal(id) { remove(K.legacy(id)); }
export function loadMeta() { return read(K.meta) || {}; }
export function saveMeta(m) { return write(K.meta, m); }

function online() { return typeof navigator === "undefined" || navigator.onLine !== false; }
function visible() { return typeof document === "undefined" || document.visibilityState !== "hidden"; }

export class SyncError extends Error {
  constructor(message, status = 0, code = "") { super(message); this.status = status; this.code = code; }
}

/* ---------------- transports ----------------
   { kind,
     get(id, knownRev)         → { unchanged:true, rev } | { doc, rev } | null
     put(id, env, baseRev, tok) → { ok:true, rev } | { ok:false, rev, doc }      (throws SyncError 403/413/429/507)
     del(id, tok)               → boolean
     subscribe(id, onMsg, onState, presence?) → { alive(), send(payload), close() },  wake?() }
   presence = { key, onCount }: track this session on the channel under a random key (nothing else is sent)
   and report how many *other* keys are present. Absent when the device has turned "Show who's here" off. */

export async function makeTransport(kind, config) {
  if (kind === "local") return makeLocalTransport();
  const key = config && (config.key || config.anonKey || config.publishableKey);
  if (kind === "supabase" && config && config.url && key) return makeSupabaseTransport({ url: config.url, key });
  return null;
}

async function makeSupabaseTransport(cfg) {
  const base = String(cfg.url).replace(/\/+$/, "");
  const headers = { apikey: cfg.key, "Content-Type": "application/json" };
  async function rpc(fn, args) {
    let r;
    try { r = await fetch(`${base}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(args) }); }
    catch (e) { throw new SyncError("network", 0, "network"); }
    const text = await r.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
    if (!r.ok) throw new SyncError((data && (data.message || data.error)) || ("HTTP " + r.status), r.status, (data && data.code) || "");
    return data;
  }
  // The realtime client is vendored (vendor/realtime.js) and loaded lazily: it is only needed to *receive* broadcasts.
  let clientP = null;
  function client() {
    if (!clientP) {
      clientP = import("./vendor/realtime.js").then(m => new m.RealtimeClient(base.replace(/^http/, "ws") + "/realtime/v1", {
        params: { apikey: cfg.key },
        heartbeatIntervalMs: 30000
      })).catch(e => { clientP = null; throw e; });
    }
    return clientP;
  }
  return {
    kind: "supabase",
    get: (id, rev) => rpc("get_list_v3", { p_id: id, p_rev: rev == null ? null : rev }),
    put: (id, env, baseRev, token) => rpc("put_list_v3", { p_id: id, p_doc: env, p_base_rev: baseRev, p_token: token }),
    del: (id, token) => rpc("delete_list_v3", { p_id: id, p_token: token || null }).then(Boolean),
    subscribe(id, onMsg, onState, presence) {
      let ch = null, rc = null, closed = false, failed = false;
      client().then(c => {
        if (closed) return;
        rc = c;
        const config = { broadcast: { self: false, ack: false } };
        if (presence) config.presence = { key: presence.key };
        ch = c.channel("list:" + id, { config });
        ch.on("broadcast", { event: "change" }, ({ payload }) => onMsg(payload));
        if (presence) {
          const report = () => { try { const st = ch.presenceState(); presence.onCount(Object.keys(st).filter(k => k !== presence.key).length); } catch (e) { /* ignore */ } };
          ch.on("presence", { event: "sync" }, report);
        }
        ch.subscribe(status => {
          onState(status === "SUBSCRIBED" ? "joined" : String(status).toLowerCase());
          if (status === "SUBSCRIBED" && presence) { try { ch.track({}); } catch (e) { /* ignore */ } }
        });
      }).catch(() => { failed = true; onState("error"); });
      return {
        alive() { return !closed && !failed && (!ch || ch.state === "joined" || ch.state === "joining"); },
        send(payload) {
          if (ch && ch.state === "joined") return ch.send({ type: "broadcast", event: "change", payload });
          // REST broadcast: needs no socket and works before the client has loaded
          return fetch(`${base}/realtime/v1/api/broadcast`, { method: "POST", headers, body: JSON.stringify({ messages: [{ topic: "list:" + id, event: "change", payload, private: false }] }) }).catch(() => {});
        },
        close() { closed = true; if (rc && ch) { try { rc.removeChannel(ch); } catch (e) { /* ignore */ } } }
      };
    },
    /** After sleep/wake the socket may be dead while channels still say "joined"; nudge it. */
    wake() { if (clientP) clientP.then(c => { try { if (!c.isConnected()) c.connect(); } catch (e) { /* ignore */ } }).catch(() => {}); }
  };
}

/** Same-origin transport for tests and multi-tab demos: a localStorage row per list (envelope + token), BroadcastChannel
    for wake-ups. Honours navigator.onLine so Playwright's setOffline() behaves like a dead network. Test hooks in
    localStorage: tf/test/lag (ms), tf/test/rtfail (realtime never joins), tf/test/limit (every create → 429). */
function makeLocalTransport() {
  const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("tf-local-transport") : null;
  // presence between tabs: hello / here / bye on the same channel, a heartbeat, and a short expiry
  const PRESENCE_TTL = 12000;
  const hook = k => { try { return localStorage.getItem("tf/test/" + k); } catch (e) { return null; } };
  const wait = () => new Promise(r => setTimeout(r, +(hook("lag") || 15)));
  const guard = () => { if (!online()) throw new SyncError("offline", 0, "network"); };
  const locked = fn => (typeof navigator !== "undefined" && navigator.locks) ? navigator.locks.request("tf-local-server", fn) : fn();
  return {
    kind: "local",
    async get(id, rev) {
      guard(); await wait();
      const cur = read(K.local(id));
      if (!cur) return null;
      if (rev != null && cur.rev === rev) return { unchanged: true, rev: cur.rev };
      return { doc: cur.doc, rev: cur.rev };
    },
    async put(id, env, baseRev, token) {
      guard(); await wait();
      return locked(async () => {
        const cur = read(K.local(id));
        if (!cur) {
          if (baseRev !== 0) return { ok: false, rev: 0, doc: null };
          if (hook("limit")) throw new SyncError("Too many new lists from this network. Try again in a few minutes.", 429, "PT429");
          write(K.local(id), { doc: env, rev: 1, token: token || null }); return { ok: true, rev: 1 };
        }
        if (cur.token && cur.token !== token) throw new SyncError("This link can only view the list.", 403, "PT403");
        if (cur.rev !== baseRev) return { ok: false, rev: cur.rev, doc: cur.doc };
        const rev = cur.rev + 1;
        write(K.local(id), { doc: env, rev, token: cur.token || token || null });
        return { ok: true, rev };
      });
    },
    async del(id, token) {
      guard();
      const cur = read(K.local(id));
      if (!cur) return false;
      if (cur.token && cur.token !== token) throw new SyncError("This link can only view the list.", 403, "PT403");
      remove(K.local(id));
      return true;
    },
    subscribe(id, onMsg, onState, presence) {
      const others = new Map(); let beat = 0, closed = false;
      const count = () => { const t = Date.now(); for (const [k, at] of others) if (t - at > PRESENCE_TTL) others.delete(k); if (presence) presence.onCount(others.size); };
      const say = t => { if (bc && presence) bc.postMessage({ topic: id, presence: { t, key: presence.key } }); };
      const h = e => {
        const d = e.data; if (!d || d.topic !== id) return;
        if (d.presence) {
          if (!presence || d.presence.key === presence.key) return;
          if (d.presence.t === "bye") others.delete(d.presence.key); else others.set(d.presence.key, Date.now());
          if (d.presence.t === "hello") say("here");
          count();
          return;
        }
        onMsg(d.payload);
      };
      if (bc) bc.addEventListener("message", h);
      const bye = () => say("bye"); // a closed tab leaves at once, as a closed socket does on the real server
      if (typeof window !== "undefined" && presence) window.addEventListener("pagehide", bye);
      setTimeout(() => { if (closed) return; onState(hook("rtfail") ? "channel_error" : "joined"); if (presence) { say("hello"); beat = setInterval(() => { say("here"); count(); }, 5000); } }, 0);
      return {
        alive: () => !hook("rtfail"),
        send(payload) { if (bc) bc.postMessage({ topic: id, payload }); },
        close() { closed = true; clearInterval(beat); say("bye"); if (typeof window !== "undefined") window.removeEventListener("pagehide", bye); if (bc) bc.removeEventListener("message", h); }
      };
    }
  };
}

/* ---------------- legacy (v2 plaintext) rows ---------------- */

/** Read a v2 row by its raw id. Returns { doc, rev } for a plaintext row, null when missing or already an envelope. */
export async function fetchLegacy(transport, id) {
  const res = await transport.get(id, null);
  if (!res || res.unchanged || !res.doc || C.isEnvelope(res.doc)) return null;
  return { doc: normalize(res.doc, id), rev: res.rev | 0 };
}
export function deleteLegacy(transport, id) { return transport.del(id, null); }

/* ---------------- engine ---------------- */

export const POLL_LIVE_MS = 240000;
export const POLL_MS = 60000;

/** Strip the list secret before sealing: a view-link holder can decrypt the doc and must never learn W. */
export function forWire(doc) { const d = { ...doc }; delete d.id; return d; }

export const HOLD_MS = { busy: 5 * 60000, full: 10 * 60000 };

export function createSync({ transport, deviceId, onStatus, onRemote, onGone, onLive, holdMs = HOLD_MS, presence = null }) {
  // presence: { key, enabled: () => boolean, onCount(n) } — who's here, off when the device says so
  let cur = null;
  let status = transport ? "synced" : "off";
  let live = false;
  let lastFocusPull = 0;
  let retryTimer = 0, retryDelay = 2000;
  let pollTimer = 0;

  function setStatus(s) { if (s !== status) { status = s; onStatus && onStatus(s); } }
  function setLive(v) { if (v !== live) { live = v; onLive && onLive(v); } schedulePoll(); }
  // merge-on-write: another tab of this browser may have persisted edits of its own to the same key
  function persist() {
    if (!cur) return;
    const stored = loadLocal(cur.id);
    if (stored && canon(stored.doc) !== canon(cur.doc)) {
      const merged = merge(stored.doc, cur.doc);
      saveLocal(cur.id, { doc: merged, rev: Math.max(stored.rev, cur.rev), dirty: stored.dirty || cur.dirty || canon(merged) !== canon(cur.doc), created: cur.created || stored.created, mode: cur.ref.mode });
      return;
    }
    saveLocal(cur.id, { doc: cur.doc, rev: cur.rev, dirty: cur.dirty, created: cur.created || (stored && stored.created), mode: cur.ref.mode });
  }
  function gone(me) { me.gone = true; setStatus("gone"); onGone && onGone(me.id); }
  async function decrypt(me, env) { return normalize(await C.open(me.ref.key, env), me.id); }

  /** Map a transport failure to a status and decide whether to retry. Limit responses put the list on hold so a
      second wake-up (the channel joining, a focus event) cannot turn one refusal into a burst of them. */
  function failed(e) {
    const st = e && e.status;
    const hold = (name, until) => { setStatus(name); if (cur) { cur.holdUntil = until; cur.holdStatus = name; } };
    if (st === 403) { hold("readonly", Infinity); return; }                      // our token is not the row's: never hammer
    if (st === 413) { hold("toolarge", Infinity); return; }                      // retried on the next local change only
    if (st === 429) { hold("busy", Date.now() + holdMs.busy); scheduleRetry(holdMs.busy); return; }
    if (st === 507) { hold("full", Date.now() + holdMs.full); scheduleRetry(holdMs.full); return; }
    setStatus(online() ? "error" : "offline");
    scheduleRetry();
  }

  async function pull() {
    if (!cur || !transport) return;
    const me = cur;
    if (me.gone) return; // nothing to fetch for a rotated/deleted link; the user pastes a new one
    if (!online()) { setStatus("offline"); return; }
    if (me.pulling) { me.pullAgain = true; return; }
    me.pulling = true; setStatus("syncing");
    try {
      const res = await transport.get(me.ref.lookupId, me.rev > 0 ? me.rev : null);
      if (cur !== me) return;
      if (!res) {
        // only a list this device created may be inserted; a link that no longer resolves is gone (rotated/deleted)
        if (me.rev === 0 && me.created && me.ref.mode === "edit") { me.dirty = true; await push(); }
        else gone(me);
      } else if (res.unchanged) {
        if (me.dirty) await push(); else { retryDelay = 2000; setStatus("synced"); }
      } else if ((res.rev | 0) < me.rev) {
        // the server row was recreated after a rotate/delete: never merge into or refill it
        gone(me);
      } else if (!C.isEnvelope(res.doc)) {
        gone(me); // a plaintext row under a v3 id is not ours
      } else {
        let remote;
        try { remote = await decrypt(me, res.doc); } catch (e) { if (cur === me) setStatus("unreadable"); return; }
        if (cur !== me) return;
        const merged = merge(me.doc, remote);
        const cm = canon(merged);
        const changedLocal = cm !== canon(me.doc);
        const changedRemote = cm !== canon(remote);
        me.rev = res.rev | 0;
        if (changedLocal) { me.doc = merged; me.version++; onRemote && onRemote(merged); }
        if (changedRemote && me.ref.mode === "edit") me.dirty = true;
        persist();
        if (me.dirty) await push(); else { retryDelay = 2000; setStatus("synced"); }
      }
    } catch (e) {
      if (cur === me) failed(e);
    } finally {
      me.pulling = false;
      if (me.pullAgain) { me.pullAgain = false; pull(); }
    }
  }

  async function push() {
    if (!cur || !transport) return;
    const me = cur;
    if (me.ref.mode !== "edit") { me.dirty = false; if (!me.gone) setStatus("synced"); return; }
    if (!me.dirty || me.gone) { if (!me.gone) setStatus("synced"); return; }
    if (!online()) { setStatus("offline"); return; }
    if (me.holdUntil && me.holdUntil > Date.now()) { setStatus(me.holdStatus || "error"); return; } // refused a moment ago: wait for the retry timer or a new local change
    if (me.pushing) { me.pushAgain = true; return; }
    me.pushing = true; setStatus("syncing");
    try {
      for (let attempt = 0; attempt < 6; attempt++) {
        const v = me.version, doc = me.doc, base = me.rev;
        const env = await C.seal(me.ref.key, forWire(doc));
        if (cur !== me) return;
        const res = await transport.put(me.ref.lookupId, env, base, me.ref.token);
        if (cur !== me) return;
        if (res && res.ok) {
          me.rev = res.rev | 0;
          if (me.version === v) me.dirty = false;
          persist();
          try { me.channel && me.channel.send({ rev: me.rev, from: deviceId }); } catch (e) { /* ignore */ }
          if (me.dirty) continue; // edited while the put was in flight
          break;
        }
        if (!res || (!res.doc && (res.rev | 0) === 0) || ((res.rev | 0) < me.rev)) { gone(me); return; }
        // stale base: fold the server doc in and try again
        let remote;
        try { remote = await decrypt(me, res.doc); } catch (e) { if (cur === me) setStatus("unreadable"); return; }
        if (cur !== me) return;
        const merged = merge(me.doc, remote);
        me.rev = res.rev | 0;
        if (canon(merged) !== canon(me.doc)) { me.doc = merged; me.version++; onRemote && onRemote(merged); }
        if (canon(merged) === canon(remote)) { me.dirty = false; persist(); break; }
        persist();
      }
      retryDelay = 2000;
      setStatus(me.dirty ? "error" : "synced");
      if (me.dirty) scheduleRetry();
    } catch (e) {
      if (cur === me) failed(e);
    } finally {
      me.pushing = false;
      if (me.pushAgain) { me.pushAgain = false; push(); }
    }
  }

  function scheduleRetry(fixed) {
    clearTimeout(retryTimer);
    const delay = fixed || retryDelay;
    retryTimer = setTimeout(() => { if (!fixed) retryDelay = Math.min(retryDelay * 2, 30000); if (online() && cur && !cur.gone) pull(); }, delay);
  }

  function subscribe() {
    if (!cur || !transport || !transport.subscribe) return;
    const me = cur;
    if (me.channel && me.channel.alive()) return;
    if (me.channel) me.channel.close();
    const wantPresence = presence && presence.key && (!presence.enabled || presence.enabled());
    me.presenceOn = !!wantPresence;
    me.channel = transport.subscribe(me.ref.lookupId,
      msg => { if (cur === me && (!msg || msg.from !== deviceId)) pull(); },
      state => {
        if (cur !== me) return;
        if (state === "joined") { setLive(true); pull(); }
        else setLive(false);
      },
      wantPresence ? { key: presence.key, onCount: n => { if (cur === me) presence.onCount(n); } } : undefined);
  }

  /** The safety-net poll: every minute while live updates are not flowing, every 4 minutes while they are. */
  function schedulePoll() {
    clearTimeout(pollTimer);
    if (!cur || !transport) return;
    pollTimer = setTimeout(() => {
      if (visible() && online() && cur && !cur.gone) pull();
      schedulePoll();
    }, live ? POLL_LIVE_MS : POLL_MS);
  }

  function wake() {
    if (!cur || !transport) return;
    if (!visible()) return;
    if (transport.wake) transport.wake();
    subscribe();
    pull();
  }
  function onVisible() { if (visible()) wake(); }
  function onFocus() { const t = Date.now(); if (t - lastFocusPull > 2000) { lastFocusPull = t; wake(); } }
  function onOnline() { retryDelay = 2000; wake(); }
  function onOffline() { setStatus("offline"); }

  function listen(on) {
    if (typeof document === "undefined") return;
    const f = on ? "addEventListener" : "removeEventListener";
    document[f]("visibilitychange", onVisible);
    window[f]("focus", onFocus);
    window[f]("online", onOnline);
    window[f]("offline", onOffline);
    window[f]("pageshow", onFocus);
    clearTimeout(pollTimer);
    if (on) schedulePoll();
  }

  return {
    get status() { return status; },
    get live() { return live; },
    get kind() { return transport ? transport.kind : "off"; },
    /** Start syncing a list. `ref` is the derived link ({ mode, lookupId, key, token }); `doc` is what the app already painted. */
    open(ref, doc, { rev = 0, dirty = false, created = false } = {}) {
      this.close();
      cur = { id: ref.id, ref, doc, rev: rev | 0, dirty: ref.mode === "edit" && (dirty || (rev === 0 && created)), created: !!created, version: 0, pushing: false, pulling: false, channel: null, gone: false, pushTimer: 0, holdUntil: 0 };
      live = false;
      persist();
      if (!transport) { setStatus("off"); return; }
      listen(true);
      if (!online()) { setStatus("offline"); return; }
      subscribe();
      pull();
    },
    /** The app changed the doc locally. */
    update(doc) {
      if (!cur) return;
      cur.doc = doc; cur.version++;
      if (cur.ref.mode !== "edit") { persist(); return; }
      cur.dirty = true;
      if (cur.holdUntil === Infinity) cur.holdUntil = 0; // a new local change gets one fresh attempt after 403/413
      persist();
      if (!transport) return;
      clearTimeout(cur.pushTimer);
      const me = cur;
      cur.pushTimer = setTimeout(() => { if (cur === me) push(); }, 250);
    },
    /** Pull now (e.g. after switching lists back). */
    pull,
    /** Push whatever is pending now, without the debounce (used before rotating/leaving). */
    flush() { if (cur) { clearTimeout(cur.pushTimer); return push(); } },
    close() {
      if (!cur) return;
      clearTimeout(cur.pushTimer); clearTimeout(retryTimer); clearTimeout(pollTimer);
      if (cur.channel) cur.channel.close();
      listen(false);
      cur = null;
      live = false;
    },
    current() { return cur ? { id: cur.id, mode: cur.ref.mode, lookupId: cur.ref.lookupId, rev: cur.rev, dirty: cur.dirty, gone: cur.gone, live, presence: !!cur.presenceOn } : null; },
    /** "Show who's here" changed: rejoin the channel with or without presence. */
    resubscribe() { if (!cur) return; if (cur.channel) { cur.channel.close(); cur.channel = null; } if (presence && presence.onCount) presence.onCount(0); subscribe(); },
    /** Tell other devices on `lookupId` that it was deleted (after Rotate); they pull, find nothing, and show "gone". */
    announceGone(lookupId) {
      if (!transport || !transport.subscribe) return;
      try {
        const ch = transport.subscribe(lookupId, () => {}, state => { if (state === "joined") { try { ch.send({ rev: 0, from: deviceId, gone: true }); } catch (e) { /* ignore */ } setTimeout(() => ch.close(), 1500); } });
        setTimeout(() => { try { ch.close(); } catch (e) { /* ignore */ } }, 8000);
      } catch (e) { /* ignore */ }
    },
    async remove(lookupId, token) { if (transport && transport.del) return transport.del(lookupId, token); return false; },
    /** For tests: the poll delay the engine would use right now. */
    pollDelay() { return live ? POLL_LIVE_MS : POLL_MS; }
  };
}
