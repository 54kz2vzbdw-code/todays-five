// sync.js — local persistence, the transport interface (Supabase or same-origin local),
// and the sync engine: pull/merge/push with conflict retry, realtime wake-ups, reconnects.
//
// The engine never needs an op log: every local edit lands in the doc, which is marked
// dirty; a push sends the whole doc with the last seen rev; a stale rev comes back with the
// server doc, which is merged (model.merge is commutative and idempotent) and pushed again.

import { merge, normalize, canon } from "./model.js";

const SUPABASE_ESM = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.114.0/+esm";

/* ---------------- localStorage ---------------- */

const K = {
  list: id => "tf/v2/list/" + id,
  meta: "tf/v2/meta",
  local: id => "tf/v2/localserver/" + id
};

function read(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }

export function loadLocal(id) {
  const v = read(K.list(id));
  if (!v || !v.doc) return null;
  return { doc: normalize(v.doc, id), rev: v.rev | 0, dirty: !!v.dirty, created: !!v.created };
}
/** `created` marks a list this device made itself (vs. one opened from a link): only those may be inserted on the server. */
export function saveLocal(id, { doc, rev, dirty, created }) { return write(K.list(id), { doc, rev: rev | 0, dirty: !!dirty, created: !!created, savedAt: Date.now() }); }
export function removeLocal(id) { try { localStorage.removeItem(K.list(id)); } catch (e) { /* ignore */ } }
export function loadMeta() { return read(K.meta) || {}; }
export function saveMeta(m) { return write(K.meta, m); }

function online() { return typeof navigator === "undefined" || navigator.onLine !== false; }

/* ---------------- transports ----------------
   { kind, get(id) → {doc,rev}|null, put(id,doc,baseRev) → {ok,rev,doc?}, del(id),
     subscribe(id, onMsg, onState) → { alive(), send(payload), close() } }             */

export async function makeTransport(kind, config) {
  if (kind === "local") return makeLocalTransport();
  const key = config && (config.key || config.anonKey || config.publishableKey);
  if (kind === "supabase" && config && config.url && key) return makeSupabaseTransport({ url: config.url, key });
  return null;
}

async function makeSupabaseTransport(cfg) {
  const mod = await import(SUPABASE_ESM);
  const sb = mod.createClient(cfg.url, cfg.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 5 } }
  });
  const rpc = async (fn, args) => {
    const { data, error } = await sb.rpc(fn, args);
    if (error) throw new Error(error.message || String(error));
    return data;
  };
  return {
    kind: "supabase",
    get: id => rpc("get_list", { p_id: id }),
    put: (id, doc, baseRev) => rpc("put_list", { p_id: id, p_doc: doc, p_base_rev: baseRev }),
    del: id => rpc("delete_list", { p_id: id }).then(Boolean),
    subscribe(id, onMsg, onState) {
      const ch = sb.channel("list:" + id, { config: { broadcast: { self: false, ack: false } } });
      ch.on("broadcast", { event: "change" }, ({ payload }) => onMsg(payload));
      ch.subscribe(status => onState(status === "SUBSCRIBED" ? "joined" : String(status).toLowerCase()));
      return {
        alive() { return ch.state === "joined" || ch.state === "joining"; },
        send(payload) {
          // joined: over the socket; otherwise the explicit REST path (the implicit fallback is being deprecated)
          if (ch.state === "joined") return ch.send({ type: "broadcast", event: "change", payload });
          if (typeof ch.httpSend === "function") return ch.httpSend("change", payload);
          return ch.send({ type: "broadcast", event: "change", payload });
        },
        close() { try { sb.removeChannel(ch); } catch (e) { /* ignore */ } }
      };
    },
    /** After sleep/wake the socket may be dead while channels still say "joined"; nudge it. */
    wake() { try { if (sb.realtime && !sb.realtime.isConnected()) sb.realtime.connect(); } catch (e) { /* ignore */ } }
  };
}

/** Same-origin transport for tests and multi-tab demos: a localStorage row per list, BroadcastChannel for wake-ups.
    Honours navigator.onLine so Playwright's setOffline() behaves like a dead network. */
function makeLocalTransport() {
  const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("tf-local-transport") : null;
  const wait = () => new Promise(r => setTimeout(r, 15));
  const guard = () => { if (!online()) throw new Error("offline"); };
  const locked = fn => (typeof navigator !== "undefined" && navigator.locks) ? navigator.locks.request("tf-local-server", fn) : fn();
  return {
    kind: "local",
    async get(id) { guard(); await wait(); return read(K.local(id)); },
    async put(id, doc, baseRev) {
      guard(); await wait();
      return locked(async () => {
        const cur = read(K.local(id));
        if (!cur) {
          if (baseRev !== 0) return { ok: false, rev: 0, doc: null };
          write(K.local(id), { doc, rev: 1 }); return { ok: true, rev: 1 };
        }
        if (cur.rev !== baseRev) return { ok: false, rev: cur.rev, doc: cur.doc };
        const rev = cur.rev + 1;
        write(K.local(id), { doc, rev });
        return { ok: true, rev };
      });
    },
    async del(id) { guard(); try { localStorage.removeItem(K.local(id)); } catch (e) { /* ignore */ } return true; },
    subscribe(id, onMsg, onState) {
      const h = e => { if (e.data && e.data.topic === id) onMsg(e.data.payload); };
      if (bc) bc.addEventListener("message", h);
      setTimeout(() => onState("joined"), 0);
      return {
        alive: () => true,
        send(payload) { if (bc) bc.postMessage({ topic: id, payload }); },
        close() { if (bc) bc.removeEventListener("message", h); }
      };
    }
  };
}

/* ---------------- engine ---------------- */

export function createSync({ transport, deviceId, onStatus, onRemote, onGone }) {
  let cur = null;
  let status = transport ? "synced" : "off";
  let lastFocusPull = 0;
  let retryTimer = 0, retryDelay = 2000;
  let pollTimer = 0;

  function setStatus(s) { if (s !== status) { status = s; onStatus && onStatus(s); } }
  function persist() { if (cur) saveLocal(cur.id, { doc: cur.doc, rev: cur.rev, dirty: cur.dirty, created: cur.created }); }

  async function pull() {
    if (!cur || !transport) return;
    const me = cur;
    if (!online()) { setStatus("offline"); return; }
    if (me.pulling) { me.pullAgain = true; return; }
    me.pulling = true; setStatus("syncing");
    try {
      const res = await transport.get(me.id);
      if (cur !== me) return;
      if (!res) {
        // only a list this device created may be inserted; a link that no longer resolves is gone (rotated/deleted)
        if (me.rev === 0 && me.created) { me.dirty = true; await push(); }
        else { me.gone = true; setStatus("gone"); onGone && onGone(me.id); }
      } else if ((res.rev | 0) < me.rev) {
        // the server row was recreated after a rotate/delete: never merge into or refill it
        me.gone = true; setStatus("gone"); onGone && onGone(me.id);
      } else {
        const remote = normalize(res.doc, me.id);
        const merged = merge(me.doc, remote);
        const cm = canon(merged);
        const changedLocal = cm !== canon(me.doc);
        const changedRemote = cm !== canon(remote);
        me.rev = res.rev | 0;
        if (changedLocal) { me.doc = merged; me.version++; onRemote && onRemote(merged); }
        if (changedRemote) me.dirty = true;
        persist();
        if (me.dirty) await push(); else { retryDelay = 2000; setStatus("synced"); }
      }
    } catch (e) {
      setStatus(online() ? "error" : "offline");
      scheduleRetry();
    } finally {
      me.pulling = false;
      if (me.pullAgain) { me.pullAgain = false; pull(); }
    }
  }

  async function push() {
    if (!cur || !transport) return;
    const me = cur;
    if (!me.dirty || me.gone) { if (!me.gone) setStatus("synced"); return; }
    if (!online()) { setStatus("offline"); return; }
    if (me.pushing) { me.pushAgain = true; return; }
    me.pushing = true; setStatus("syncing");
    try {
      for (let attempt = 0; attempt < 6; attempt++) {
        const v = me.version, doc = me.doc, base = me.rev;
        const res = await transport.put(me.id, doc, base);
        if (cur !== me) return;
        if (res && res.ok) {
          me.rev = res.rev | 0;
          if (me.version === v) me.dirty = false;
          persist();
          try { me.channel && me.channel.send({ rev: me.rev, from: deviceId }); } catch (e) { /* ignore */ }
          if (me.dirty) continue; // edited while the put was in flight
          break;
        }
        if (!res || (!res.doc && (res.rev | 0) === 0) || ((res.rev | 0) < me.rev)) { me.gone = true; setStatus("gone"); onGone && onGone(me.id); return; }
        // stale base: fold the server doc in and try again
        const remote = normalize(res.doc, me.id);
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
      setStatus(online() ? "error" : "offline");
      scheduleRetry();
    } finally {
      me.pushing = false;
      if (me.pushAgain) { me.pushAgain = false; push(); }
    }
  }

  function scheduleRetry() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => { retryDelay = Math.min(retryDelay * 2, 30000); if (online()) pull(); }, retryDelay);
  }

  function subscribe() {
    if (!cur || !transport || !transport.subscribe) return;
    const me = cur;
    if (me.channel && me.channel.alive()) return;
    if (me.channel) me.channel.close();
    me.channel = transport.subscribe(me.id,
      msg => { if (!msg || msg.from !== deviceId) pull(); },
      state => { if (state === "joined" && cur === me) pull(); });
  }

  function wake() {
    if (!cur || !transport) return;
    if (document.visibilityState === "hidden") return;
    if (transport.wake) transport.wake();
    subscribe();
    pull();
  }
  function onVisible() { if (document.visibilityState === "visible") wake(); }
  function onFocus() { const t = Date.now(); if (t - lastFocusPull > 2000) { lastFocusPull = t; wake(); } }
  function onOnline() { retryDelay = 2000; wake(); }
  function onOffline() { setStatus("offline"); }

  function listen(on) {
    const f = on ? "addEventListener" : "removeEventListener";
    document[f]("visibilitychange", onVisible);
    window[f]("focus", onFocus);
    window[f]("online", onOnline);
    window[f]("offline", onOffline);
    window[f]("pageshow", onFocus);
    clearInterval(pollTimer);
    if (on) pollTimer = setInterval(() => { if (document.visibilityState === "visible" && online() && cur && !cur.gone) pull(); }, 60000);
  }

  return {
    get status() { return status; },
    get kind() { return transport ? transport.kind : "off"; },
    /** Start syncing a list. `doc` is what the app already painted; rev/dirty come from loadLocal(). */
    open(id, doc, { rev = 0, dirty = false, created = false } = {}) {
      this.close();
      cur = { id, doc, rev: rev | 0, dirty: dirty || (rev === 0 && created), created: !!created, version: 0, pushing: false, pulling: false, channel: null, gone: false, pushTimer: 0 };
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
      cur.doc = doc; cur.version++; cur.dirty = true;
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
      clearTimeout(cur.pushTimer); clearTimeout(retryTimer);
      if (cur.channel) cur.channel.close();
      listen(false);
      cur = null;
    },
    current() { return cur ? { id: cur.id, rev: cur.rev, dirty: cur.dirty, gone: cur.gone } : null; },
    /** Tell other devices on `id` that it was deleted (after Rotate); they pull, find nothing, and show "gone". */
    announceGone(id) {
      if (!transport || !transport.subscribe) return;
      try {
        const ch = transport.subscribe(id, () => {}, state => { if (state === "joined") { try { ch.send({ rev: 0, from: deviceId, gone: true }); } catch (e) { /* ignore */ } setTimeout(() => ch.close(), 1500); } });
        setTimeout(() => { try { ch.close(); } catch (e) { /* ignore */ } }, 8000);
      } catch (e) { /* ignore */ }
    },
    async remove(id) { if (transport && transport.del) return transport.del(id); return false; }
  };
}
