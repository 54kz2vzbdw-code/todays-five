// tools/ticks.mjs — what the safety poll's tick costs, tick by tick, in requests and in channel joins.
//
// Run:  node tools/ticks.mjs            (no browser, no server, no backend; a couple of seconds)
//
// WHY THIS EXISTS. The 1.12 channel-liveness change rests on a cost claim as much as on a latency one:
// "it is a timer that already fires, so the asking costs nothing at idle". `tools/quietd.js` measures
// the latency and cannot see the cost — it watches a row appear in a list, not what was sent. This is
// the other half, and it is offline and instant so it can be re-run at integration instead of believed:
// the engine on a fake transport that logs every request and every `subscribe`, with `pollNow()` called
// by hand where the 240-second timer would have called it, and with real `visibilitychange` events fired
// at it through a fake `document` so the *other* road to `subscribe()` is costed too.
//
// WHAT IT CANNOT SEE. Request *counts*, never bytes: the fake transport's `get` is a function call, not
// a POST, so the 29-byte unchanged poll is weighed by `tools/realsync4.js` and `apple/tools/interop.mjs`
// against the real backend and not here. And a `subscribe` here is one call, where a real one is a
// WebSocket join — this says how many, not what one costs on a radio. It also cannot say what a real
// client reports, or when: that is `tools/socketd.mjs`, on a real socket. The handle below is *driven* to
// do what that file measured, rather than being left to decide for itself.
//
// THE HANDLE IS A DOUBLE, AND THE DRIVER SAYS WHAT IT DOES. Two facts about the real client, both
// measured in tools/socketd.mjs, and the double must not blur them:
//   * a channel that has just reported CHANNEL_ERROR reads "errored", so the supabase handle's `alive()`
//     is false at that moment — which is why the double's `alive()` is false after `channel_error`;
//   * but the channel **does come back**. After a rude cut the client reconnects and rejoins on its own,
//     and the SAME `ch.subscribe` callback fires a third time: socketd.mjs prints
//     `SUBSCRIBED, CHANNEL_ERROR, SUBSCRIBED` on one handle, one new join at the server. sync.js maps
//     SUBSCRIBED to "joined", so that is `setLive(true); pull()` with nobody touching the window, through
//     `onState` — which is not new in 1.12.
// An earlier draft of this file let the double recover its own `alive()` silently, never re-fired
// `onState`, and so reported this tick as the thing that brought such a page back to live. It is not. The
// probe below fires the state the real client fires and credits the client with it. What this tick is for
// is the channel that reports *nothing at all* — the state no instrument in this repo can produce.
const ROOT = new URL("../", import.meta.url).href;
const S = await import(ROOT + "sync.js");
const M = await import(ROOT + "model.js");
const C = await import(ROOT + "crypto.js");

globalThis.localStorage = { _m: new Map(), getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }, setItem(k, v) { this._m.set(k, String(v)); }, removeItem(k) { this._m.delete(k); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// A document and a window with nothing in them but the listeners sync.js binds, so the second road to
// `subscribe()` — `wake()`, off `visibilitychange`/`focus`/`pageshow`/`online` — can be costed as well as
// the timer. `visibilityState` stays "visible": this models switching *to* the tab, which is the transition
// that calls `wake()` with no throttle at all.
const bound = new Map();
const on = (type, fn) => { if (!bound.has(type)) bound.set(type, new Set()); bound.get(type).add(fn); };
const off = (type, fn) => { if (bound.has(type)) bound.get(type).delete(fn); };
globalThis.document = { visibilityState: "visible", addEventListener: on, removeEventListener: off };
globalThis.window = { addEventListener: on, removeEventListener: off };
const fireEvent = type => { for (const fn of [...(bound.get(type) || [])]) fn(); };

const rows = new Map(), log = [], subs = [];
let joinFails = false, quietAll = false;
const transport = {
  async get(id, rev) { log.push("get"); const r = rows.get(id); if (!r) return null; if (rev != null && r.rev === rev) return { unchanged: true, rev: r.rev }; return { doc: r.doc, rev: r.rev }; },
  async put(id, env, base, token) { log.push("put"); const r = rows.get(id); if (!r) { if (base !== 0) return { ok: false, rev: 0, doc: null }; rows.set(id, { doc: env, rev: 1, token }); return { ok: true, rev: 1 }; } if (r.rev !== base) return { ok: false, rev: r.rev, doc: r.doc }; r.rev++; r.doc = env; return { ok: true, rev: r.rev }; },
  async del() { return true; },
  subscribe(id, onMsg, onState) {
    const h = {
      id, onMsg, onState, state: "", quiet: quietAll, closed: false, born: Date.now(),
      alive: () => !h.closed && h.state !== "channel_error",
      heardAt: () => h.quiet ? h.born : Date.now(),          // quiet: the stamp stops moving, the opinion does not
      send() {}, close() { h.closed = true; }
    };
    subs.push(h);
    setTimeout(() => { if (!h.closed) { h.state = joinFails ? "channel_error" : "joined"; onState(h.state); } }, 0);
    return h;
  }
};

// The engine's clock is frozen, so a silence is a fact rather than a wait; the real Date.now is kept for
// the awaits, because a frozen clock turns an unmet expectation into a hung script.
const realNow = Date.now;
let NOW = 1700000000000;
const settle = async (ms = 80) => { Date.now = realNow; await sleep(ms); Date.now = () => NOW; };
Date.now = () => NOW;

const W = M.newId();
const ref = await C.fromWrite(W);
const s = S.createSync({ transport, deviceId: "ticks" });
s.open(ref, M.seedDoc(W), { rev: 0, dirty: true, created: true });
for (let i = 0; i < 80 && !(s.status === "synced" && s.live); i++) await settle(10);

const tick = async () => { NOW += S.POLL_LIVE_MS; const g0 = log.length, s0 = subs.length; s.pollNow(); await settle(); return { gets: log.length - g0, joins: subs.length - s0 }; };
const say = (what, r) => console.log(`${what.padEnd(34)} ${r.gets} request(s), ${r.joins} channel join(s)`);

console.log(`ticks — the 240 s poll's body, called by hand. CHANNEL_SILENCE_MS ${S.CHANNEL_SILENCE_MS / 1000} s, POLL_LIVE_MS ${S.POLL_LIVE_MS / 1000} s\n`);
if (s.status !== "synced" || !s.live) { console.log("the engine never settled, so nothing below is a measurement"); process.exit(1); }

say("a channel that is hearing", await tick());
say("  and again", await tick());

subs[subs.length - 1].quiet = true;                     // the socket died under a channel still saying "joined"
const found = await tick();
say("the tick that finds it quiet", found);
console.log(`    → live ${s.live}, poll ${s.pollDelay() / 1000} s, channels held open ${subs.filter(h => !h.closed).length} of ${subs.length}`);
say("the tick after the rejoin", await tick());

// the channel is gone and cannot be got back: what a page on a broken socket costs per tick
joinFails = true;
subs[subs.length - 1].quiet = true;
const broken = [];
for (let i = 0; i < 5; i++) broken.push(await tick());
console.log(`five ticks on a socket that will not come back   ${broken.reduce((n, r) => n + r.gets, 0)} request(s), ${broken.reduce((n, r) => n + r.joins, 0)} channel join(s)`);
console.log(`    → live ${s.live}, poll ${s.pollDelay() / 1000} s (the 60 s fallback that was already there), status "${s.status}"`);

/* --- the repair that is the CLIENT's, and was never this tick's --- */
// socketd.mjs, on a real socket: after a rude cut the vendored client reconnects and rejoins by itself, and
// the same ch.subscribe callback fires SUBSCRIBED a third time. Fire exactly that here — no tick, nothing
// touched — and watch who does the work.
joinFails = false;
const cameBack = subs[subs.length - 1];
const g0 = log.length, s0 = subs.length;
cameBack.state = "joined";
cameBack.onState("joined");
await settle();
const clientRepair = { gets: log.length - g0, joins: subs.length - s0 };
say("the client rejoins by itself", clientRepair);
console.log(`    → live ${s.live}, poll ${s.pollDelay() / 1000} s — through \`onState\`, which has done this since v3.`);
console.log(`      Nobody touched the window and this round did not buy it; it must not be credited with it.`);
say("  the next tick, after that", await tick());
const sEnd = { live: s.live, poll: s.pollDelay() };
s.close();

/* --- the cost if the silence test is WRONG: a frozen stamp and a storm of wakes --- */
// The one way the silence test can misfire is a stamp that freezes while the channel carries fine — an
// answered heartbeat that never reaches `heartbeatCallback` on the live socket, which is this round's one
// unverified mechanism. `subscribe()` is reached from `wake()` as well as from the tick, and
// `visibilitychange` calls `wake()` with no throttle whatever, so the worst case is not a per-tick number:
// it would be a per-tab-switch number unless something bounded it. `channelAlive`'s `heldSince` floor is
// that bound, and this is the measurement of it.
quietAll = true;
const W2 = M.newId();
const ref2 = await C.fromWrite(W2);
const s2 = S.createSync({ transport, deviceId: "ticks2" });
s2.open(ref2, M.seedDoc(W2), { rev: 0, dirty: true, created: true });
for (let i = 0; i < 80 && !(s2.status === "synced" && s2.live); i++) await settle(10);
const storm0 = subs.length;
let g1 = log.length;
for (let i = 0; i < 40; i++) { NOW += 2000; fireEvent("visibilitychange"); await settle(8); }
console.log(`\n40 tab switches in 80 s, stamp frozen        ${log.length - g1} request(s), ${subs.length - storm0} channel join(s)`);
NOW += S.CHANNEL_SILENCE_MS;
g1 = log.length;
const held = subs.length;
fireEvent("visibilitychange");
await settle();
console.log(`one more, past a whole silence window        ${log.length - g1} request(s), ${subs.length - held} channel join(s)`);
g1 = log.length;
const after = subs.length;
for (let i = 0; i < 40; i++) { NOW += 2000; fireEvent("visibilitychange"); await settle(8); }
console.log(`40 more, on the replacement                  ${log.length - g1} request(s), ${subs.length - after} channel join(s)`);
const stormJoins = subs.length - storm0;
console.log(`    → live ${s2.live}; 81 wakes in ${(81 * 2 + S.CHANNEL_SILENCE_MS / 1000).toFixed(0)} s cost ${stormJoins} join(s) in total.`);
console.log(`      The one request per wake is \`wake()\`'s own pull and is not new: \`wake()\` has pulled on every`);
console.log(`      visibilitychange since v3, and \`onFocus\` is the only road with a throttle on it (2 s).`);
const s2End = { live: s2.live };
s2.close();

// Everything asserted here is read BEFORE the engines are closed: a closed engine reports live false and the
// 60 s poll, which would be a harness artefact dressed up as a finding.
const ok = found.joins === 1 && sEnd.poll === S.POLL_LIVE_MS && sEnd.live === true
  && broken.every(r => r.gets === 1) && broken.reduce((n, r) => n + r.joins, 0) <= 5
  && clientRepair.joins === 0
  && stormJoins === 1 && s2End.live === true;
console.log("");
console.log(ok
  ? "At idle the tick is the one unchanged poll it always was, and a living channel is not replaced. A quiet\n"
  + "channel costs one join and one extra poll, once. A socket that will not come back costs one join attempt\n"
  + "per tick and not one extra request. A client that rejoins by itself — which is what socketd.mjs measured\n"
  + "a real one doing after a cut — costs this tick nothing and was already bringing the page back to live\n"
  + "before 1.12. And if the silence test were wrong about a channel that was fine, eighty-one wakes cost one\n"
  + "join: the `heldSince` floor holds the worst case to one per 95 s per list, not one per tab switch."
  : "one of those is not what sync.js claims. Read the lines above before changing anything.");
Date.now = realNow;
process.exit(ok ? 0 : 1);
