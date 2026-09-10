// tools/ticks.mjs — what the safety poll's tick costs, tick by tick, in requests and in channel joins.
//
// Run:  node tools/ticks.mjs            (no browser, no server, no backend; a couple of seconds)
//
// WHY THIS EXISTS. The 1.12 channel-liveness change rests on a cost claim as much as on a latency one:
// "it is a timer that already fires, so the asking costs nothing at idle". `tools/quietd.js` measures
// the latency and cannot see the cost — it watches a row appear in a list, not what was sent. This is
// the other half, and it is offline and instant so it can be re-run at integration instead of believed:
// the engine on a fake transport that logs every request and every `subscribe`, with `pollNow()` called
// by hand where the 240-second timer would have called it.
//
// WHAT IT CANNOT SEE. Request *counts*, never bytes: the fake transport's `get` is a function call, not
// a POST, so the 29-byte unchanged poll is weighed by `tools/realsync4.js` and `apple/tools/interop.mjs`
// against the real backend and not here. And a `subscribe` here is one call, where a real one is a
// WebSocket join — this says how many, not what one costs on a radio.
//
// THE HANDLE IS MODELLED ON THE REAL ONE, which is the whole difficulty of a fake. A channel that has
// reported `channel_error` stays not-alive afterwards (`ch.state` is "errored", and the supabase
// handle's `alive()` is false for any state but joined/joining) — a first draft of this file had the
// handle recover its own `alive()` the moment the network did, which is a state the real client does not
// have, and it reported that a repaired socket was never rejoined. Say what the double does, and make it
// do what the real one does.
const ROOT = new URL("../", import.meta.url).href;
const S = await import(ROOT + "sync.js");
const M = await import(ROOT + "model.js");
const C = await import(ROOT + "crypto.js");

globalThis.localStorage = { _m: new Map(), getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }, setItem(k, v) { this._m.set(k, String(v)); }, removeItem(k) { this._m.delete(k); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const rows = new Map(), log = [], subs = [];
let joinFails = false;
const transport = {
  async get(id, rev) { log.push("get"); const r = rows.get(id); if (!r) return null; if (rev != null && r.rev === rev) return { unchanged: true, rev: r.rev }; return { doc: r.doc, rev: r.rev }; },
  async put(id, env, base, token) { log.push("put"); const r = rows.get(id); if (!r) { if (base !== 0) return { ok: false, rev: 0, doc: null }; rows.set(id, { doc: env, rev: 1, token }); return { ok: true, rev: 1 }; } if (r.rev !== base) return { ok: false, rev: r.rev, doc: r.doc }; r.rev++; r.doc = env; return { ok: true, rev: r.rev }; },
  async del() { return true; },
  subscribe(id, onMsg, onState) {
    const h = {
      state: "", quiet: false, closed: false, born: Date.now(),
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

// and the thing that needed a click before this round: the socket comes back while nobody touches the window
joinFails = false;
const repaired = await tick();
say("the tick after the socket returns", repaired);
console.log(`    → live ${s.live}, poll ${s.pollDelay() / 1000} s`);

const ok = found.joins === 1 && repaired.joins === 1 && s.live === true && s.pollDelay() === S.POLL_LIVE_MS
  && broken.every(r => r.gets === 1) && broken.reduce((n, r) => n + r.joins, 0) <= 5;
console.log("");
console.log(ok
  ? "At idle the tick is the one unchanged poll it always was. A quiet channel costs one join and one extra\npoll, once. A socket that will not come back costs one join attempt per tick and not one extra request.\nA socket that does come back is rejoined with nobody touching the window — which is what needed a click."
  : "one of those is not what sync.js claims. Read the lines above before changing anything.");
Date.now = realNow;
s.close();
process.exit(ok ? 0 : 1);
