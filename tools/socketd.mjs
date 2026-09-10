// tools/socketd.mjs — what the vendored realtime client does over a socket that stops answering.
//
// Run:  node tools/socketd.mjs            (no backend, no list creations, nothing past 127.0.0.1)
//
// WHY THIS EXISTS. The 1.12 channel-liveness change in sync.js rested on four claims about
// vendor/realtime.js, every one of them a reading of a minified bundle:
//
//   1. an answered phoenix heartbeat reaches `heartbeatCallback("ok")`, which is what stamps `heard`;
//   2. a socket that is held open and stops answering is NOT noticed by the client, which is the
//      hypothesis the round was given;
//   3. `RealtimeClient.channel(topic)` after `removeChannel` on a **joined** channel hands back the
//      channel that is leaving, so a rejoin needs a brand-new client;
//   4. after the socket is cut and reconnects, the channel does not come back with it.
//
// Claim 1 held. **Claims 2, 3 and 4 are false**, and this file is what said so — which is why sync.js
// no longer has the `reset()` claim 3 was written for, and why the write-up in
// apple/DECISIONS-apple.md does not say the client fails to notice a dead socket. The round was handed
// a hypothesis and the instrument took it away.
//
// A channel-identity probe with no socket at all cannot settle claim 3: a channel with nothing under it
// cannot send a leave, so it closes in the same tick and the registry lets go of it immediately, which
// is the answer for the wrong reason. Claim 3 is only about a channel that is really joined. So this
// file is a real socket: a phoenix-protocol WebSocket server, about 60 lines of `node:http` upgrade and
// hand-rolled frames, that the vendored client connects to, joins over and is answered by — until it is
// told to go quiet, or cut.
//
// WHAT IT IS AND IS NOT. It is a real WebSocket, a real join, a real heartbeat, a real leave round trip
// and a real reconnect: the client's socket and channel layers are exercised, not stubbed. It is **not**
// Supabase. It says nothing about what that server does to an idle connection, whether it drops a
// channel while keeping the socket up, how a proxy or a captive portal times a connection out, or what
// iOS does to a WKWebView's socket on suspend. And it cannot produce the one state that is left over
// once claims 2–4 have fallen: a client whose own timers did not run, because Node runs its timers.
// That state is a property of the host, it is what `wake()`'s comment in sync.js has described since v3,
// and it stays a reading and a wrist item.
//
// THE INTERVALS ARE SHORT ON PURPOSE. The client is built here with heartbeatIntervalMs of 400 ms where
// sync.js asks for 30 000, so a run costs seconds instead of minutes. What is measured is a *mechanism*
// — which callback fires, in which order, and whether a timer re-arms — and that does not depend on the
// interval. Everything below is therefore reported in beats, and the beats are only there to show the
// ordering was real.
import http from "node:http";
import crypto from "node:crypto";

/* ---------------- a phoenix-protocol WebSocket server, small enough to read ---------------- */

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function frame(text) {
  const body = Buffer.from(text, "utf8");
  const head = body.length < 126 ? Buffer.from([0x81, body.length])
    : Buffer.concat([Buffer.from([0x81, 126]), (() => { const b = Buffer.alloc(2); b.writeUInt16BE(body.length); return b; })()]);
  return Buffer.concat([head, body]);
}
/** Client→server frames are masked; this reads as many whole frames as `buf` holds and returns the rest. */
function unframe(buf, onText) {
  for (;;) {
    if (buf.length < 2) return buf;
    const len0 = buf[1] & 0x7f;
    let off = 2, len = len0;
    if (len0 === 126) { if (buf.length < 4) return buf; len = buf.readUInt16BE(2); off = 4; }
    else if (len0 === 127) { if (buf.length < 10) return buf; len = Number(buf.readBigUInt64BE(2)); off = 10; }
    const masked = (buf[1] & 0x80) !== 0;
    const maskOff = off; if (masked) off += 4;
    if (buf.length < off + len) return buf;
    const body = Buffer.from(buf.subarray(off, off + len));
    if (masked) for (let i = 0; i < len; i++) body[i] ^= buf[maskOff + i % 4];
    const opcode = buf[0] & 0x0f;
    buf = buf.subarray(off + len);
    if (opcode === 0x1) onText(body.toString("utf8"));
    if (opcode === 0x8) return Buffer.alloc(0);   // close
  }
}

/** The server. `mode` decides what it does with what the client says: "answer" replies to everything,
    "silent" holds the socket open and replies to nothing — a socket that is up and carries nothing,
    which is the state the whole silence test exists for. */
function server() {
  const st = { mode: "answer", sockets: [], joins: 0, heartbeats: 0, leaves: 0, port: 0 };
  const http_ = http.createServer();
  http_.on("upgrade", (req, sock) => {
    const key = req.headers["sec-websocket-key"];
    sock.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
      "Sec-WebSocket-Accept: " + crypto.createHash("sha1").update(key + GUID).digest("base64") + "\r\n\r\n");
    st.sockets.push(sock);
    let buf = Buffer.alloc(0);
    sock.on("data", d => {
      buf = unframe(Buffer.concat([buf, d]), text => {
        // vsn 2.0.0 puts everything but a user broadcast on the wire as [join_ref, ref, topic, event, payload]
        let m; try { m = JSON.parse(text); } catch (e) { return; }
        const [joinRef, ref, topic, event] = m;
        if (event === "heartbeat") st.heartbeats++;
        if (event === "phx_join") st.joins++;
        if (event === "phx_leave") st.leaves++;
        if (st.mode === "silent") return;                       // up, and carrying nothing
        sock.write(frame(JSON.stringify([joinRef, ref, topic, "phx_reply", { status: "ok", response: {} }])));
      });
    });
    sock.on("error", () => {});
  });
  st.listen = () => new Promise(r => http_.listen(0, "127.0.0.1", () => { st.port = http_.address().port; r(st.port); }));
  st.stop = () => { for (const s of st.sockets) try { s.destroy(); } catch (e) {} http_.close(); };
  return st;
}

/* ---------------- the run ---------------- */

const { RealtimeClient } = await import("../vendor/realtime.js");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BEAT = 400;                       // sync.js asks for 30000; see the header
const line = (ok, text) => { console.log((ok ? "yes  " : "NO   ") + text); if (!ok) failures++; };
let failures = 0;

const srv = server();
const port = await srv.listen();
console.log(`socketd — a phoenix WebSocket on 127.0.0.1:${port}, heartbeat every ${BEAT} ms (sync.js asks for 30000)\n`);

/* --- 1. an answered beat is what stamps `heard` --- */

const beats = [];
const c = new RealtimeClient(`ws://127.0.0.1:${port}/realtime/v1`, {
  params: { apikey: "socketd" }, heartbeatIntervalMs: BEAT,
  heartbeatCallback: (status, ms) => beats.push(status)
});
const states = [];
const ch = c.channel("list:socketd", { config: { broadcast: { self: false, ack: false } } });
ch.on("broadcast", { event: "change" }, () => {});
ch.subscribe(s => states.push(String(s)));

await sleep(BEAT * 3);
line(states[0] === "SUBSCRIBED", `the channel joins over a real socket (states so far: ${states.join(", ") || "none"})`);
line(ch.state === "joined", `and reports state "${ch.state}"`);
line(beats.includes("ok"), `an answered heartbeat arrives as "ok" — this is the only thing that stamps \`heard\` (beats: ${beats.join(", ")})`);
line(srv.heartbeats >= 1, `the server saw ${srv.heartbeats} heartbeat(s), so the beat is on the wire and costs nothing new`);
line(!beats.includes("disconnected"), `and "disconnected" never reaches the callback — the client's own wrapper swallows it, so only a real answer stamps \`heard\``);

/* --- 3. a rejoin on the SAME client, which is the thing `reset()` was written because it could not do --- */

const joinsBefore = srv.joins;
const p = c.removeChannel(ch);                     // exactly what sync.js's handle.close() does, unawaited
const again = c.channel("list:socketd", { config: { broadcast: { self: false, ack: false } } });
line(again !== ch, `synchronously after removeChannel on a **joined** channel, channel(topic) hands back a NEW channel, not the one leaving (old state "${ch.state}", new "${again.state}")`);
console.log(`     channels held: ${c.getChannels().length} — the opposite of what the minified bundle was read to say. removeChannel marks`);
console.log(`     the channel closed in the same tick; the leave push is what takes the round trip, and nothing waits for it`);
console.log(`     before the registry lets go.`);
const states3 = [];
again.on("broadcast", { event: "change" }, () => {});
again.subscribe(s => states3.push(String(s)));
await sleep(BEAT * 3);
line(states3.includes("SUBSCRIBED"), `and re-subscribing on the same client really joins: ${states3.join(", ") || "nothing"} (server saw ${srv.joins - joinsBefore} new join(s), ${srv.leaves} leave(s))`);
line(c.isConnected(), "the socket is still up afterwards — asking for the topic again cancels the client's pending-disconnect timer");
await p.catch(() => {});
await sleep(BEAT);
line(again.state === "joined" && c.isConnected(), `and it is still joined after the leave round trip completes (state "${again.state}")`);
console.log(`     so a rejoin needs no new client: sync.js's reset() was written for a trap this version of the client does not have.\n`);

/* --- 2. the socket is held open and stops answering: the round's hypothesis --- */

const beats2 = [], states2 = [];
const c2 = new RealtimeClient(`ws://127.0.0.1:${port}/realtime/v1`, {
  params: { apikey: "socketd" }, heartbeatIntervalMs: BEAT,
  heartbeatCallback: status => beats2.push([status, Date.now()])
});
const ch2 = c2.channel("list:quiet", { config: { broadcast: { self: false, ack: false } } });
ch2.on("broadcast", { event: "change" }, () => {});
ch2.subscribe(s => states2.push([String(s), Date.now()]));
await sleep(BEAT * 3);
line(states2.some(s => s[0] === "SUBSCRIBED"), "a second channel joins");

const t0 = Date.now();
const okBefore = beats2.filter(b => b[0] === "ok").length;
srv.mode = "silent";                                  // the socket stays up; nothing is ever answered again
await sleep(BEAT * 12);
const timedOut = beats2.find(b => b[0] === "timeout");
const errored = states2.find(s => s[0] !== "SUBSCRIBED" && s[1] > t0);
line(!!timedOut, timedOut
  ? `a socket that is up and answers nothing IS noticed — heartbeatCallback("timeout") after ${((timedOut[1] - t0) / BEAT).toFixed(1)} beats — so the round's hypothesis is false here`
  : `a socket that is up and answers nothing was NOT noticed in 12 beats (beats seen: ${beats2.map(b => b[0]).join(", ")})`);
line(!!errored, errored
  ? `and ch.subscribe's callback is told: "${errored[0]}" after ${((errored[1] - t0) / BEAT).toFixed(1)} beats — which is sync.js's setLive(false)`
  : `but ch.subscribe's callback was never told, so sync.js would still believe it was live`);
console.log(`     beats after the server went quiet: ${beats2.slice(okBefore).map(b => b[0]).join(", ") || "none"}`);
console.log(`     the client's own recovery: it tears the socket down and schedules a reconnect, and this server accepts it —`);
console.log(`     which a network that has actually gone is not obliged to do.\n`);

/* --- 4. the socket is cut, the client reconnects — does the CHANNEL come back? --- */

// A server of its own, so the previous client's reconnect ladder cannot be mistaken for this one's.
try { await c2.disconnect(); } catch (e) { /* ignore */ }
srv.mode = "answer";
const srv2 = server();
const port2 = await srv2.listen();

const states4 = [];
const c3 = new RealtimeClient(`ws://127.0.0.1:${port2}/realtime/v1`, {
  params: { apikey: "socketd" }, heartbeatIntervalMs: BEAT
});
const ch3 = c3.channel("list:cut", { config: { broadcast: { self: false, ack: false } } });
ch3.on("broadcast", { event: "change" }, () => {});
ch3.subscribe(s => states4.push(String(s)));
await sleep(BEAT * 3);
line(ch3.state === "joined", "a third channel joins");

const joinsAtCut = srv2.joins;
for (const s of srv2.sockets.slice()) { try { s.destroy(); } catch (e) {} }   // the network goes away, rudely
srv2.sockets.length = 0;
await sleep(BEAT * 15);                                  // long enough for the client's reconnect ladder
const reconnected = c3.isConnected();
const rejoined = srv2.joins > joinsAtCut;
line(reconnected, `after a rude cut the client reconnects on its own (connected: ${reconnected})`);
console.log(`     channel states reported: ${states4.join(", ")}`);
console.log(`     channel state now: "${ch3.state}"; joins the server saw after the cut: ${srv2.joins - joinsAtCut}`);
if (reconnected && !rejoined) {
  console.log("");
  console.log("  >>> THIS IS THE BUG. The socket is healthy again and the channel did not come back with it.");
  console.log("      `triggerChanError` schedules a channel's rejoin only `if (socket.isConnected())`, and at the");
  console.log("      moment a close is processed it is not; `onConnOpen` re-arms the heartbeat and flushes the send");
  console.log("      buffer and has no channel-rejoin loop of its own. So the channel is left errored on a live");
  console.log("      socket, and nothing in the client will ever join it again. Before 1.12 the only thing in");
  console.log("      sync.js that could was `wake()` — visibilitychange, focus, pageshow, online. On a second");
  console.log("      monitor none of those happen, which is precisely 'it does not move until you click it'.");
}
if (reconnected && rejoined) {
  console.log("      the client rejoined the channel by itself, so this failure mode is not the reported bug's mechanism.");
}
console.log("");

/* --- the case neither the client nor the silence test can see --- */

console.log("what none of this catches: a socket that answers every heartbeat while the *channel* has stopped");
console.log("delivering. The beat keeps `heard` fresh, ch.state stays \"joined\", and both the client and the");
console.log("1.12 silence test call that alive. Only a message that should have come and did not would say");
console.log("otherwise, and a doorbell has nothing to compare against. Named as a limit, not measured here.\n");

srv.stop(); srv2.stop();
try { await c.disconnect(); await c3.disconnect(); } catch (e) { /* ignore */ }

console.log(failures ? `${failures} line(s) above came out "NO" — a reading in sync.js is wrong and must be rewritten.`
  : "every line above came out as sync.js now describes it. Three of the four claims the round started with\ndid not, which is why sync.js describes it the way it does.");
process.exit(failures ? 1 : 0);
