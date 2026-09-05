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
  assert.equal(Object.keys(back.items).length, 5);
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
  assert.equal(Object.keys(remote.items).length, 5);
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
  assert.equal(Object.keys((await C.open(e.key, row.doc)).items).length, 5, "the same five lines");
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

console.log(`${passed} sync tests passed (with v4)`);
