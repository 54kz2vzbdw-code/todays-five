// Node tests for the sync engine against a fake encrypting server. Run: node test/sync.test.js
import assert from "node:assert/strict";

// minimal browser shims so sync.js loads
const store = new Map();
globalThis.localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
globalThis.document = { visibilityState: "visible", addEventListener() {}, removeEventListener() {} };
globalThis.window = { addEventListener() {}, removeEventListener() {} };
Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true });

const S = await import("../sync.js");
const M = await import("../model.js");
const C = await import("../crypto.js");

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log("ok -", name); }
const tick = (ms = 30) => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 3000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return true; await tick(10); } return fn(); };

/** In-memory server with v3 semantics (token hashes, unchanged, 403). */
function fakeServer() {
  const rows = new Map(); const log = [];
  const t = {
    kind: "fake", rows, log,
    async get(id, rev) { log.push(["get", id, rev]); const r = rows.get(id); if (!r) return null; if (rev != null && r.rev === rev) return { unchanged: true, rev: r.rev }; return { doc: r.doc, rev: r.rev }; },
    async put(id, env, base, token) {
      log.push(["put", id, base]);
      const r = rows.get(id);
      if (!r) { if (base !== 0) return { ok: false, rev: 0, doc: null }; rows.set(id, { doc: env, rev: 1, token }); return { ok: true, rev: 1 }; }
      if (r.token && r.token !== token) throw new S.SyncError("view only", 403, "PT403");
      if (r.rev !== base) return { ok: false, rev: r.rev, doc: r.doc };
      r.rev++; r.doc = env; return { ok: true, rev: r.rev };
    },
    async del(id, token) { const r = rows.get(id); if (!r) return false; if (r.token && r.token !== token) throw new S.SyncError("view only", 403, "PT403"); rows.delete(id); return true; },
    subscribe(id, onMsg, onState) { setTimeout(() => onState(t.rtfail ? "channel_error" : "joined"), 0); return { alive: () => !t.rtfail, send() {}, close() {} }; }
  };
  return t;
}
const item = (id, over = {}) => ({ id, sectionId: "", text: "t-" + id, note: "", done: false, doneAt: 0, today: true, order: 1000, todayOrder: 1000, updatedAt: 1, ...over });

await test("a created list is pushed as an envelope; the server never holds plaintext or the secret", async () => {
  const srv = fakeServer();
  const W = M.newId(); const ref = await C.fromWrite(W);
  const doc = M.seedDoc(W);
  const s = S.createSync({ transport: srv, deviceId: "d1" });
  s.open(ref, doc, { rev: 0, dirty: true, created: true });
  assert.ok(await until(() => srv.rows.has(ref.lookupId)), "row created");
  const row = srv.rows.get(ref.lookupId);
  assert.ok(C.isEnvelope(row.doc)); assert.equal(row.token, ref.token);
  const txt = JSON.stringify(row.doc);
  assert.ok(!txt.includes(W) && !txt.includes(ref.R) && !txt.includes("Tap or click"), "no secret or plaintext on the wire");
  const back = await C.open(ref.key, row.doc);
  assert.equal(Object.keys(back.items).length, 3);
  assert.ok(!("id" in back), "the list secret is stripped before sealing (a viewer can decrypt)");
  await until(() => s.status === "synced");
  assert.equal(s.status, "synced"); assert.equal(s.current().rev, 1);
  assert.equal(S.loadLocal(W).mode, "edit");
  s.close();
});

await test("view ref pulls and decrypts, never pushes, and local edits do not mark it dirty", async () => {
  const srv = fakeServer();
  const W = M.newId(); const e = await C.fromWrite(W); const r = await C.fromRead(e.R);
  srv.rows.set(e.lookupId, { doc: await C.seal(e.key, M.seedDoc(W)), rev: 3, token: e.token });
  let remote = null;
  const s = S.createSync({ transport: srv, deviceId: "v1", onRemote: d => { remote = d; } });
  s.open(r, M.normalize({}, e.R), { rev: 0, dirty: false, created: false });
  assert.ok(await until(() => remote !== null));
  assert.equal(Object.keys(remote.items).length, 3);
  assert.equal(remote.id, e.R, "the view's local doc is keyed by the view secret");
  const d2 = M.normalize(remote, e.R); d2.items[Object.keys(d2.items)[0]].done = true; s.update(d2);
  await tick(400);
  assert.ok(!srv.log.some(l => l[0] === "put"), "no put from a view ref");
  assert.equal(s.current().dirty, false); assert.equal(s.current().mode, "view");
  s.close();
});

await test("a view link's write is refused by the server (403) → status readonly, no retry storm", async () => {
  const srv = fakeServer();
  const W = M.newId(); const e = await C.fromWrite(W); const r = await C.fromRead(e.R);
  srv.rows.set(e.lookupId, { doc: await C.seal(e.key, M.seedDoc(W)), rev: 1, token: e.token });
  // pretend a buggy client pushes with the view key and no token
  const forged = { ...r, mode: "edit", token: "x".repeat(43) };
  const statuses = [];
  const s = S.createSync({ transport: srv, deviceId: "f", onStatus: st => statuses.push(st) });
  s.open(forged, M.seedDoc(W), { rev: 1, dirty: true, created: false });
  await until(() => statuses.includes("readonly"));
  const puts = srv.log.filter(l => l[0] === "put").length;
  await tick(300);
  assert.equal(srv.log.filter(l => l[0] === "put").length, puts, "no further puts after a 403");
  assert.equal(s.status, "readonly");
  s.close();
});

await test("unchanged polls: a pull with the known rev transfers no document", async () => {
  const srv = fakeServer();
  const W = M.newId(); const e = await C.fromWrite(W);
  const s = S.createSync({ transport: srv, deviceId: "d" });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => s.status === "synced" && s.current().rev === 1);
  srv.log.length = 0;
  await s.pull(); await tick(20);
  assert.deepEqual(srv.log[0], ["get", e.lookupId, 1]);
  assert.equal(s.status, "synced");
  assert.equal(s.pollDelay(), S.POLL_LIVE_MS, "joined channel → slow poll");
  s.close();
});

await test("realtime not joined → fast poll and live=false; joined → slow poll", async () => {
  const srv = fakeServer(); srv.rtfail = true;
  const W = M.newId(); const e = await C.fromWrite(W);
  const lives = [];
  const s = S.createSync({ transport: srv, deviceId: "d", onLive: v => lives.push(v) });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => s.status === "synced");
  assert.equal(s.live, false); assert.equal(s.pollDelay(), S.POLL_MS);
  s.close();
  srv.rtfail = false;
  const s2 = S.createSync({ transport: srv, deviceId: "d", onLive: v => lives.push(v) });
  s2.open(e, M.seedDoc(W), { rev: 1, dirty: false, created: true });
  await until(() => s2.live === true);
  assert.equal(s2.pollDelay(), S.POLL_LIVE_MS); assert.deepEqual(lives, [true]);
  s2.close();
});

await test("conflict: decrypt the server envelope, merge on plaintext, re-encrypt, retry; both sides converge", async () => {
  const srv = fakeServer();
  const W = M.newId(); const e = await C.fromWrite(W);
  const base = M.seedDoc(W, 1000); const ids = Object.keys(base.items);
  srv.rows.set(e.lookupId, { doc: await C.seal(e.key, base), rev: 1, token: e.token });
  // device A edits offline from rev 1; meanwhile device B (a different browser) pushed rev 2
  const bDoc = M.normalize(base, W); bDoc.items[ids[1]] = { ...bDoc.items[ids[1]], text: "from B", updatedAt: 3000 };
  srv.rows.get(e.lookupId).doc = await C.seal(e.key, bDoc); srv.rows.get(e.lookupId).rev = 2;
  const aDoc = M.normalize(base, W); aDoc.items[ids[0]] = { ...aDoc.items[ids[0]], done: true, doneAt: 2500, updatedAt: 2500 };
  let remote = null;
  const s = S.createSync({ transport: srv, deviceId: "a", onRemote: d => { remote = d; } });
  s.open(e, aDoc, { rev: 1, dirty: true, created: false });
  await until(() => s.status === "synced" && s.current().rev === 3);
  const server = await C.open(e.key, srv.rows.get(e.lookupId).doc);
  assert.equal(server.items[ids[0]].done, true, "A's check survived");
  assert.equal(server.items[ids[1]].text, "from B", "B's edit survived");
  assert.ok(remote && remote.items[ids[1]].text === "from B", "A was told about B's edit");
  assert.equal(srv.rows.get(e.lookupId).rev, 3);
  s.close();
});

await test("a row recreated with a lower rev, or missing for an opened link, is 'gone' and never refilled", async () => {
  const srv = fakeServer();
  const W = M.newId(); const e = await C.fromWrite(W);
  const gones = [];
  const s = S.createSync({ transport: srv, deviceId: "a", onGone: id => gones.push(id) });
  s.open(e, M.seedDoc(W), { rev: 4, dirty: false, created: false });
  await until(() => s.status === "gone");
  assert.deepEqual(gones, [W]); assert.equal(srv.rows.size, 0);
  s.close();
});

await test("fetchLegacy reads a plaintext v2 row and ignores envelopes; deleteLegacy needs no token", async () => {
  const srv = fakeServer();
  const legacyId = M.newId();
  srv.rows.set(legacyId, { doc: { v: 2, id: legacyId, items: { a: item("a") }, sections: {}, history: {}, themes: {}, updatedAt: 5 }, rev: 7, token: null });
  const leg = await S.fetchLegacy(srv, legacyId);
  assert.equal(leg.rev, 7); assert.equal(leg.doc.items.a.text, "t-a"); assert.equal(leg.doc.id, legacyId);
  const W = M.newId(); const e = await C.fromWrite(W);
  srv.rows.set(e.lookupId, { doc: await C.seal(e.key, M.seedDoc(W)), rev: 1, token: e.token });
  assert.equal(await S.fetchLegacy(srv, e.lookupId), null);
  assert.equal(await S.fetchLegacy(srv, M.newId()), null);
  assert.equal(await S.deleteLegacy(srv, legacyId), true);
  assert.equal(srv.rows.has(legacyId), false);
});

await test("local storage: v3 records carry the mode; legacy v2 records are readable and removable separately", () => {
  const W = M.newId();
  S.saveLocal(W, { doc: M.seedDoc(W), rev: 2, dirty: false, created: true, mode: "view" });
  assert.equal(S.loadLocal(W).mode, "view");
  localStorage.setItem("tf/v2/list/" + W, JSON.stringify({ doc: M.seedDoc(W), rev: 1, dirty: true }));
  assert.equal(S.loadLegacyLocal(W).dirty, true);
  S.removeLegacyLocal(W);
  assert.equal(S.loadLegacyLocal(W), null);
  assert.ok(S.loadLocal(W), "removing the legacy copy leaves the v3 record");
});

await test("429 on create → status busy, list kept locally, retry scheduled later (not immediately)", async () => {
  const srv = fakeServer();
  const origPut = srv.put; let puts = 0;
  srv.put = async (...a) => { puts++; throw new S.SyncError("Too many new lists", 429, "PT429"); };
  const W = M.newId(); const e = await C.fromWrite(W);
  const s = S.createSync({ transport: srv, deviceId: "a" });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => s.status === "busy");
  await tick(300);
  assert.equal(puts, 1, "one attempt, then a long back-off");
  assert.ok(S.loadLocal(W).dirty && S.loadLocal(W).created, "kept locally as dirty + created");
  srv.put = origPut;
  s.close();
});

console.log(`\n${passed} sync tests passed`);

/* ---- v4 ---- */

await test("presence: the engine tracks under its session key only when enabled, and reports other keys", async () => {
  const srv = fakeServer();
  let seen = null, counts = [];
  srv.subscribe = (id, onMsg, onState, presence) => { seen = presence; setTimeout(() => { onState("joined"); if (presence) presence.onCount(2); }, 0); return { alive: () => true, send() {}, close() {} }; };
  const W = M.newId(); const e = await C.fromWrite(W);
  let on = true;
  const s = S.createSync({ transport: srv, deviceId: "d", presence: { key: "sess1", enabled: () => on, onCount: n => counts.push(n) } });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => counts.length > 0);
  assert.deepEqual(seen, { key: "sess1", onCount: seen.onCount }); assert.deepEqual(counts, [2]); assert.equal(s.current().presence, true);
  on = false; s.resubscribe(); await tick(20);
  assert.equal(seen, undefined, "off: no presence on the channel at all"); assert.equal(counts[counts.length - 1], 0); assert.equal(s.current().presence, false);
  s.close();
});

await test("delete everywhere, then undo: the row is removed and re-created under the same lookup id with the same token", async () => {
  const srv = fakeServer();
  const W = M.newId(); const e = await C.fromWrite(W);
  const s = S.createSync({ transport: srv, deviceId: "d" });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => s.status === "synced" && srv.rows.has(e.lookupId));
  const doc = M.normalize(S.loadLocal(W).doc, W);
  s.close();
  assert.equal(await s.remove(e.lookupId, e.token), true); assert.equal(srv.rows.has(e.lookupId), false);
  assert.equal(await srv.del(e.lookupId, e.token), false, "nothing to delete twice");
  // undo within ten seconds: the client still holds W and the document
  const s2 = S.createSync({ transport: srv, deviceId: "d" });
  s2.open(e, doc, { rev: 0, dirty: true, created: true });
  await until(() => s2.status === "synced" && srv.rows.has(e.lookupId));
  const row = srv.rows.get(e.lookupId);
  assert.equal(row.rev, 1); assert.equal(row.token, e.token);
  assert.equal(Object.keys(await C.open(e.key, row.doc)).length > 0, true);
  assert.equal(Object.keys((await C.open(e.key, row.doc)).items).length, 3, "the same three lines");
  s2.close();
});

await test("a device that never created the list cannot re-create a deleted row by accident", async () => {
  const srv = fakeServer();
  const W = M.newId(); const e = await C.fromWrite(W);
  const s = S.createSync({ transport: srv, deviceId: "x" });
  s.open(e, M.seedDoc(W), { rev: 3, dirty: true, created: false });
  await until(() => s.status === "gone");
  assert.equal(srv.rows.size, 0);
  s.close();
});

await test("1.9: an import is measured against the server's cap before it lands — sealed the way a push seals it (proposal 18)", async () => {
  const W = M.newId(); const e = await C.fromWrite(W);
  const small = M.seedDoc(W);
  const bytes = await S.envelopeBytes(e.key, small);
  assert.ok(bytes > 200 && bytes < S.ENVELOPE_CAP, "the seed list seals well under the cap: " + bytes);
  const huge = M.emptyDoc(W); for (let i = 0; i < 4000; i++) huge.items["i" + i] = item("i" + i, { text: "line " + i + " " + Math.random().toString(36).slice(2) + " " + Math.random().toString(36).slice(2), note: "note " + Math.random().toString(36).slice(2) });
  const big = await S.envelopeBytes(e.key, huge);
  assert.ok(big > S.ENVELOPE_CAP, "four thousand lines seal over the cap: " + big); assert.equal(S.ENVELOPE_CAP, 96 * 1024, "the server's 96 KB");
  const env = await C.seal(e.key, S.forWire(huge)); assert.ok(big >= JSON.stringify(env).length, "measured as at least the JSON text");
});

console.log(`${passed} sync tests passed (with v4)`);

/* ---- 1.12: a channel that says it is there and is not ---- */

// Date.now is the instrument for every test below, so the real one is kept here: `until` above measures
// its own patience with Date.now, and a frozen clock would turn a failed expectation into a hung suite.
const realNow = Date.now;
const waitReal = async (fn, ms = 3000) => { const t0 = realNow(); while (realNow() - t0 < ms) { if (fn()) return true; await tick(10); } return fn(); };

/** A fake server whose channels can be told to go quiet: the handle goes on saying `alive`, and stops
    advancing the stamp of the last thing it heard. That is a socket that died under a channel which still
    reports "joined" — the state sync.js's own comment above `wake()` has described since v3. Every handle
    it has ever given out is kept, in order, so a rejoin is visible. */
function mutableServer() {
  const t = fakeServer();
  t.subs = [];
  t.subscribe = (id, onMsg, onState, presence) => {
    const h = {
      id, onMsg, onState, presence, quiet: false, closed: false, state: "", born: Date.now(),
      alive: () => !h.closed && h.state !== "channel_error",
      heardAt: () => h.quiet ? h.born : Date.now(),
      send() {}, close() { h.closed = true; }
    };
    t.subs.push(h);
    setTimeout(() => { if (!h.closed) { h.state = t.rtfail ? "channel_error" : "joined"; h.onState(h.state); } }, 0);
    return h;
  };
  return t;
}

await test("the silence test: a channel that has heard nothing for longer than it should have is not alive, whatever it says about itself", () => {
  const now = 1700000000000;
  assert.equal(S.channelAlive({ alive: () => true }, now), true, "a transport that cannot say is believed, exactly as before");
  assert.equal(S.channelAlive({ alive: () => true, heardAt: () => now - 1000 }, now), true);
  assert.equal(S.channelAlive({ alive: () => true, heardAt: () => now - S.CHANNEL_SILENCE_MS + 1000 }, now), true, "just inside the silence");
  assert.equal(S.channelAlive({ alive: () => true, heardAt: () => now - S.CHANNEL_SILENCE_MS - 1 }, now), false, "quiet for longer than the beat allows");
  assert.equal(S.channelAlive({ alive: () => false, heardAt: () => now }, now), false, "the channel's own no is still a no");
  assert.equal(S.channelAlive(null, now), false);
  assert.equal(S.channelAlive({ alive: () => true, heardAt: () => 0 }, now), false, "a channel that has never heard anything is not one to trust");
  assert.ok(S.CHANNEL_SILENCE_MS > 90000, "three of the client's 30 s heartbeats, and slack");
  assert.ok(S.CHANNEL_SILENCE_MS < S.POLL_LIVE_MS, "so the first safety poll after the silence finds it");
});

await test("the safety poll is the occasion: a quiet channel is let go and rejoined, and the rejoined one delivers", async () => {
  const srv = mutableServer();
  const W = M.newId(); const e = await C.fromWrite(W);
  let NOW = 1700000000000;
  try {
    Date.now = () => NOW;
    const s = S.createSync({ transport: srv, deviceId: "d" });
    s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
    assert.ok(await waitReal(() => s.status === "synced" && s.live === true), "joined and synced");
    assert.equal(srv.subs.length, 1);

    // idle, and the channel is fine: the poll tick costs one unchanged get and nothing else
    srv.log.length = 0;
    s.pollNow();
    assert.ok(await waitReal(() => srv.log.length > 0));
    await tick(40);
    assert.equal(srv.subs.length, 1, "a living channel is not replaced");
    assert.equal(srv.log.filter(l => l[0] === "get").length, 1, "one poll, which is the poll that already happened");

    // now the channel dies without saying so, and a whole silence goes by
    srv.subs[0].quiet = true;
    NOW += S.CHANNEL_SILENCE_MS + 1000;
    s.pollNow();
    assert.ok(await waitReal(() => srv.subs.length === 2), "the poll tick rejoined");
    assert.equal(srv.subs[0].closed, true, "the channel that had stopped hearing is let go");
    assert.ok(await waitReal(() => s.live === true));
    assert.equal(s.pollDelay(), S.POLL_LIVE_MS, "live again, so the slow poll again");

    // and the doorbell works again: a broadcast on the new channel turns into a pull
    srv.log.length = 0;
    srv.subs[1].onMsg({ rev: 9, from: "somebody-else" });
    assert.ok(await waitReal(() => srv.log.some(l => l[0] === "get")), "the rejoined channel's doorbell is answered");
    s.close();
  } finally { Date.now = realNow; }
});

await test("a channel that has been replaced does not speak for the list any more", async () => {
  const srv = mutableServer();
  const W = M.newId(); const e = await C.fromWrite(W);
  let NOW = 1700000000000;
  try {
    Date.now = () => NOW;
    const s = S.createSync({ transport: srv, deviceId: "d" });
    s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
    assert.ok(await waitReal(() => s.live === true));
    srv.subs[0].quiet = true;
    NOW += S.CHANNEL_SILENCE_MS + 1000;
    s.pollNow();
    assert.ok(await waitReal(() => srv.subs.length === 2));
    await tick(40);
    // the handle we let go of answers late, as a socket shutting down does
    srv.log.length = 0;
    srv.subs[0].onState("joined");
    srv.subs[0].onMsg({ rev: 99, from: "somebody-else" });
    srv.subs[0].onState("channel_error");
    await tick(60);
    assert.equal(srv.log.length, 0, "no pull from a channel we have replaced: one wake is not a burst");
    assert.equal(s.live, true, "and it cannot put out the live light either");
    s.close();
  } finally { Date.now = realNow; }
});

await test("a rejoin that fails puts the poll back to a minute, through the machinery that was already there", async () => {
  const srv = mutableServer();
  const W = M.newId(); const e = await C.fromWrite(W);
  let NOW = 1700000000000;
  try {
    Date.now = () => NOW;
    const s = S.createSync({ transport: srv, deviceId: "d" });
    s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
    assert.ok(await waitReal(() => s.live === true));
    assert.equal(s.pollDelay(), S.POLL_LIVE_MS);
    srv.subs[0].quiet = true;
    srv.rtfail = true;                                  // the channel is gone and cannot be got back
    NOW += S.CHANNEL_SILENCE_MS + 1000;
    s.pollNow();
    assert.ok(await waitReal(() => s.live === false), "the engine stops claiming to be live");
    assert.equal(s.pollDelay(), S.POLL_MS, "and the existing machinery halves the wait four times over");
    assert.equal(s.status !== "gone", true);
    s.close();
  } finally { Date.now = realNow; }
});

await test("the poll tick changes nothing for a transport that cannot say when it last heard", async () => {
  const srv = fakeServer();
  let subs = 0;
  const base = srv.subscribe;
  srv.subscribe = (...a) => { subs++; return base(...a); };
  const W = M.newId(); const e = await C.fromWrite(W);
  const s = S.createSync({ transport: srv, deviceId: "d" });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => s.status === "synced" && s.live === true);
  assert.equal(subs, 1);
  srv.log.length = 0;
  s.pollNow(); await until(() => srv.log.length > 0); await tick(40);
  s.pollNow(); await tick(60);
  assert.equal(subs, 1, "no rejoin: the channel never claimed anything that could be checked");
  assert.equal(srv.log.filter(l => l[0] === "get").length, 2, "two ticks, two unchanged polls, and nothing else");
  s.close();
});

console.log(`${passed} sync tests passed (with 1.12)`);
