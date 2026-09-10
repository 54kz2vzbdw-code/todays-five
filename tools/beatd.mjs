// tools/beatd.mjs — does an answered heartbeat reach `heartbeatCallback("ok")` on the LIVE socket?
//
// Run:  node tools/beatd.mjs            (about 70 s: it waits for two real 30-second beats)
//       node tools/beatd.mjs 3           (a 3-second beat instead, for a ~14 s smoke of the same path)
//
// NEVER YET RUN, AND THAT IS PART OF THE REPORT. The session that wrote it had no outbound network — the
// sandbox refused the connection — so this file has produced no output in this repo and not one number
// from it appears in any write-up. It parses, and nothing more than that is claimed for it. What a first
// run should print if the endpoint behaves: "sent, ok, sent, ok" and a first "ok" inside a second of the
// first beat. What a failure looks like: "sent" with no "ok", or "timeout", or a socket that never
// connects — and the closing paragraph below says what each of those would mean for sync.js.
//
// WHY THIS EXISTS. The whole of 1.12's silence test hangs on one stamp: `heard = Date.now()` inside
// `heartbeatCallback` in sync.js. `tools/socketd.mjs` proves the vendored client raises that callback with
// "ok" when a server answers — but the server it proves it against is sixty lines of `node:http` written in
// this repo, which answers everything. If the real Supabase realtime endpoint never answered a heartbeat,
// or answered it in a shape the vendored wrapper does not report, the stamp would freeze at the join on
// every real page and the silence test would be wrong about a channel that was perfectly well. That was
// the round's one gating unknown, and it was costed rather than measured. This measures it.
//
// WHAT IT DOES AND DOES NOT TOUCH. It opens one WebSocket to the project's realtime endpoint with the
// public anon key out of config.js — the same connection every visitor's browser makes — and then does
// nothing at all except listen to its own heartbeat. **It joins no channel, sends no broadcast, calls no
// RPC and creates no row**, so it spends none of the twelve-lists-an-hour the live run needs. It prints
// statuses and counts: no URL, no key, no id, nothing about anybody's list.
//
// WHAT IT CANNOT SEE. Two things, and they are why this is not the end of the question:
//   * it beats on a socket with **no channel joined**. A phoenix heartbeat is a socket-level frame on the
//     topic "phoenix" whether or not a channel is up — readable in vendor/realtime.js — but that last step
//     is a reading, not a measurement, and a page in the wild always has a channel.
//   * it measures this machine, on this network, now. A proxy, a captive portal, a corporate middlebox or
//     an iOS WKWebView on a suspended app can each do something else to an idle socket, and none of them
//     are here.
// So a "yes" from this file removes the *mechanism* doubt — the endpoint answers and the wrapper reports —
// and leaves the environment doubt, which stays on the unverified list where `__tf().cur.quietFor` is the
// thing a person reads to settle it on their own machine.
import cfg from "../config.js";

const { RealtimeClient } = await import("../vendor/realtime.js");
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 30 000 is exactly what sync.js asks for and is the default; an argument shortens the beat so the same
// path can be smoked in a few seconds. What is being measured is a mechanism — whether the answer reaches
// the callback — and that does not depend on the interval, which is the argument tools/socketd.mjs makes
// at 400 ms. A short beat is a heavier idle socket than production's, so do not leave one running.
const BEAT = Math.max(1, +(process.argv[2] || 30)) * 1000;
const WAIT = BEAT * 2 + 8000;

if (!cfg || !cfg.url || !cfg.key) { console.log("config.js has no url/key here, so there is nothing to beat against."); process.exit(2); }

const beats = [];
const c = new RealtimeClient(cfg.url.replace(/^http/, "ws") + "/realtime/v1", {
  params: { apikey: cfg.key },
  heartbeatIntervalMs: BEAT,
  heartbeatCallback: (status, ms) => beats.push([status, Date.now(), ms])
});

console.log(`beatd — one socket to the live realtime endpoint, ${BEAT / 1000} s heartbeat, no channel, no row.`);
console.log(`waiting ${WAIT / 1000} s for two beats.\n`);

const t0 = Date.now();
c.connect();
for (let i = 0; i < WAIT / 250 && beats.filter(b => b[0] === "ok").length < 2; i++) await sleep(250);

const connected = c.isConnected();
const oks = beats.filter(b => b[0] === "ok");
const bad = beats.filter(b => b[0] !== "ok" && b[0] !== "sent");
console.log(`socket connected: ${connected}`);
console.log(`callback fired ${beats.length} time(s): ${beats.map(b => b[0]).join(", ") || "never"}`);
if (oks.length) console.log(`first "ok" after ${((oks[0][1] - t0) / 1000).toFixed(1)} s, and there were ${oks.length} of them`);
if (bad.length) console.log(`and ${bad.length} that were neither "sent" nor "ok": ${bad.map(b => b[0]).join(", ")}`);

try { await c.disconnect(); } catch (e) { /* ignore */ }

const ok = connected && oks.length >= 2;
console.log("");
console.log(ok
  ? "The live endpoint answers a heartbeat and the vendored wrapper reports it as \"ok\", which is the only\n"
  + "thing that stamps `heard` in sync.js. So on this machine and this network the silence test's stamp\n"
  + "moves on a healthy socket, and the misfire it was costed against does not happen here. It says nothing\n"
  + "about a socket with a channel on it, a proxy, or an iOS app coming back from suspend."
  : "The live endpoint did NOT answer two heartbeats into the callback here. Read the lines above before\n"
  + "believing sync.js's silence test on the real backend: if this is what a real page sees, `heardAt()`\n"
  + "freezes at the join and `channelAlive` is false forever after 95 s — bounded by `heldSince` to one\n"
  + "rejoin per 95 s per list, but a rejoin nobody needed.");
process.exit(ok ? 0 : 1);
