// tools/realsync4.js — the real-backend suite for v4, against the live Supabase project in config.js.
// Run: node tools/realsync4.js   (creates a few throwaway lists; they are deleted at the end)
// Checks: envelopes on the wire; a view link's put refused; the unchanged poll's byte count; presence across two
// clients; delete everywhere and the ten-second undo (re-creation under the same link); add-from-URL end to end
// through the engine; and the doc-size measurement for a realistic list.
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
globalThis.document = { visibilityState: "visible", addEventListener() {}, removeEventListener() {} };
globalThis.window = { addEventListener() {}, removeEventListener() {} };
Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, configurable: true });

const S = await import("../sync.js");
const M = await import("../model.js");
const C = await import("../crypto.js");
const config = (await import("../config.js")).default;

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log("ok -", name); }
const tick = (ms = 50) => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (fn()) return true; await tick(50); } return fn(); };
const made = []; // lookupIds + tokens to clean up

const transport = await S.makeTransport("supabase", config);
assert.ok(transport, "transport");
const base = config.url.replace(/\/+$/, "");
async function rawRpc(fn, args) {
  const r = await fetch(`${base}/rest/v1/rpc/${fn}`, { method: "POST", headers: { apikey: config.key, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  const text = await r.text();
  return { status: r.status, text, bytes: new TextEncoder().encode(text).length };
}

/** A realistic list: five sections, forty lines with notes, a few rules and templates, ninety days of history. */
function realisticDoc(W) {
  const d = M.emptyDoc(W, "Work and home");
  const secs = ["Work", "Home", "Errands", "Calls", "Someday"];
  secs.forEach((n, i) => { d.sections["s" + i] = { id: "s" + i, name: n, order: (i + 1) * 1000, collapsed: false, updatedAt: 1 }; });
  for (let i = 0; i < 40; i++) {
    const id = "line" + i;
    d.items[id] = { id, sectionId: "s" + (i % 5), text: ["Call the structural engineer about the RFI on the slab", "Walk after lunch", "Renew the truck registration", "Draft the change order for the hangar", "Pick up the dry cleaning"][i % 5] + " " + i, note: i % 3 ? "with a short note about it" : "", done: i % 7 === 0, doneAt: i % 7 === 0 ? Date.now() : 0, today: i < 5, order: (i + 1) * 1000, todayOrder: (i + 1) * 1000, updatedAt: Date.now() - i * 1000 };
  }
  d.rules.line1 = { id: "line1", kind: "weekdays", text: d.items.line1.text, note: "", sectionId: "s1", updatedAt: 1 };
  d.rules.line2 = { id: "line2", kind: "weekly", days: [1, 4], text: d.items.line2.text, note: "", sectionId: "s2", updatedAt: 1 };
  d.templates.t1 = { id: "t1", name: "Monday morning", lines: Array.from({ length: 8 }, (_, j) => ({ text: "Template line number " + j, note: "" })), updatedAt: 1 };
  for (let i = 1; i <= 90; i++) {
    const day = M.addDays(M.localDate(), -i);
    d.history[day] = Array.from({ length: 5 }, (_, j) => ({ id: "h" + i + "_" + j, text: "Follow up with the structural engineer on the RFI about the slab", doneAt: Date.now() - i * 86400000 + j * 1000, section: secs[j] }));
  }
  return M.normalize(d, W);
}

let sizes = {};
await test("a created list lands as an envelope; the raw row never holds plaintext or the secret", async () => {
  const W = M.newId(); const e = await C.fromWrite(W); made.push(e);
  const s = S.createSync({ transport, deviceId: "d1" });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  assert.ok(await until(() => s.status === "synced" && s.current().rev >= 1), "pushed: " + s.status);
  const raw = await rawRpc("get_list_v3", { p_id: e.lookupId, p_rev: null });
  assert.equal(raw.status, 200);
  const row = JSON.parse(raw.text);
  assert.ok(C.isEnvelope(row.doc)); assert.ok(!raw.text.includes(W) && !raw.text.includes("Tap or click"));
  s.close();
});

await test("a view link's put is refused with 403; the unchanged poll is a few dozen bytes", async () => {
  const W = M.newId(); const e = await C.fromWrite(W); made.push(e);
  const s = S.createSync({ transport, deviceId: "d1" });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => s.status === "synced" && s.current().rev >= 1);
  const rev = s.current().rev; s.close();
  const env = await C.seal(e.key, M.seedDoc(W));
  const forged = await rawRpc("put_list_v3", { p_id: e.lookupId, p_doc: env, p_base_rev: rev, p_token: "x".repeat(43) });
  assert.equal(forged.status, 403);
  const poll = await rawRpc("get_list_v3", { p_id: e.lookupId, p_rev: rev });
  assert.equal(poll.status, 200); assert.ok(JSON.parse(poll.text).unchanged);
  sizes.unchangedPollBytes = poll.bytes;
  const full = await rawRpc("get_list_v3", { p_id: e.lookupId, p_rev: null });
  sizes.seedDocBytes = full.bytes;
  assert.ok(poll.bytes < 60, "unchanged poll bytes " + poll.bytes);
});

await test("presence: two clients on one list see each other, and the count drops when one leaves", async () => {
  const W = M.newId(); const e = await C.fromWrite(W); made.push(e);
  const countsA = [], countsB = [];
  const a = S.createSync({ transport, deviceId: "a", presence: { key: "sessA" + M.shortId(), enabled: () => true, onCount: n => countsA.push(n) } });
  a.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  assert.ok(await until(() => a.status === "synced" && a.live, 20000), "A live: " + a.status + " " + a.live);
  const b = S.createSync({ transport, deviceId: "b", presence: { key: "sessB" + M.shortId(), enabled: () => true, onCount: n => countsB.push(n) } });
  b.open(e, M.seedDoc(W), { rev: 0, dirty: false, created: false });
  assert.ok(await until(() => countsA.includes(1) && countsB.includes(1), 20000), "both see one other: A=" + JSON.stringify(countsA) + " B=" + JSON.stringify(countsB));
  b.close();
  assert.ok(await until(() => countsA[countsA.length - 1] === 0, 20000), "A sees B leave: " + JSON.stringify(countsA));
  // presence off: a third client that neither tracks nor listens is invisible to A
  const c = S.createSync({ transport, deviceId: "c", presence: { key: "sessC", enabled: () => false, onCount: () => { throw new Error("must not report"); } } });
  c.open(e, M.seedDoc(W), { rev: 0, dirty: false, created: false });
  await until(() => c.live, 20000); await tick(2500);
  assert.equal(countsA[countsA.length - 1], 0, "an opted-out device is not counted: " + JSON.stringify(countsA));
  c.close(); a.close();
});

await test("delete everywhere, then undo within ten seconds: the row is gone, then back under the same link", async () => {
  const W = M.newId(); const e = await C.fromWrite(W); made.push(e);
  const s = S.createSync({ transport, deviceId: "d1" });
  s.open(e, M.seedDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => s.status === "synced" && s.current().rev >= 1);
  const doc = M.normalize(S.loadLocal(W).doc, W);
  s.close();
  assert.equal(await s.remove(e.lookupId, e.token), true);
  assert.equal((await rawRpc("get_list_v3", { p_id: e.lookupId, p_rev: null })).text, "null", "gone from the server");
  // another device holding the link finds nothing and reports gone, never re-creating it
  const other = S.createSync({ transport, deviceId: "d2" });
  other.open(e, doc, { rev: 1, dirty: true, created: false });
  assert.ok(await until(() => other.status === "gone"), "other device: " + other.status); other.close();
  // the undo: this device still holds W and the document
  const s2 = S.createSync({ transport, deviceId: "d1" });
  s2.open(e, doc, { rev: 0, dirty: true, created: true });
  assert.ok(await until(() => s2.status === "synced" && s2.current().rev >= 1), "re-created: " + s2.status);
  const back = JSON.parse((await rawRpc("get_list_v3", { p_id: e.lookupId, p_rev: null })).text);
  assert.equal(Object.keys((await C.open(e.key, back.doc)).items).length, 5, "the same five lines, same lookup id");
  s2.close();
});

await test("add from a URL, end to end: parse → open → add to Today → push → a second device sees the line", async () => {
  const W = M.newId(); const e = await C.fromWrite(W); made.push(e);
  const s = S.createSync({ transport, deviceId: "d1" });
  s.open(e, M.emptyDoc(W), { rev: 0, dirty: true, created: true });
  await until(() => s.status === "synced" && s.current().rev >= 1);
  const h = M.parseHash("#/l/" + W + "/add?text=Call%20Bob%0ABuy%20milk&section=Work");
  assert.equal(h.mode, "edit"); assert.deepEqual(h.add.text, ["Call Bob", "Buy milk"]);
  const doc = M.normalize(S.loadLocal(W).doc, W);
  let order = 1000;
  for (const text of h.add.text) { const id = M.shortId(); doc.items[id] = { id, sectionId: "", text, note: "", done: false, doneAt: 0, today: true, order, todayOrder: order, updatedAt: M.now() }; order += 1000; }
  s.update(doc);
  await until(() => s.status === "synced" && !s.current().dirty);
  let seen = null;
  const d2 = S.createSync({ transport, deviceId: "d2", onRemote: d => { seen = d; } });
  d2.open(e, M.normalize({}, W), { rev: 0, dirty: false, created: false });
  assert.ok(await until(() => seen && Object.values(seen.items).some(i => i.text === "Buy milk")), "second device sees the added line");
  assert.equal(M.parseHash("#/r/" + e.R + "/add?text=x").mode, "view", "a view link is recognisable and refused by the app");
  d2.close(); s.close();
});

await test("doc size: a realistic list on the live backend stays well under 20 KB encrypted", async () => {
  const W = M.newId(); const e = await C.fromWrite(W); made.push(e);
  const doc = realisticDoc(W);
  const s = S.createSync({ transport, deviceId: "d1" });
  s.open(e, doc, { rev: 0, dirty: true, created: true });
  assert.ok(await until(() => s.status === "synced" && s.current().rev >= 1), "pushed: " + s.status); s.close();
  const raw = await rawRpc("get_list_v3", { p_id: e.lookupId, p_rev: null });
  const row = JSON.parse(raw.text);
  sizes.realisticEnvelopeBytes = C.envelopeBytes(row.doc);
  sizes.realisticPlainBytes = new TextEncoder().encode(JSON.stringify(S.forWire(doc))).length;
  sizes.realisticLines = Object.values(doc.items).length; sizes.realisticHistoryDays = Object.keys(doc.history).length;
  assert.ok(sizes.realisticEnvelopeBytes < 20000, "envelope " + sizes.realisticEnvelopeBytes);
});

for (const e of made) { try { await transport.del(e.lookupId, e.token); } catch (x) { /* already gone */ } }
console.log(`\n${passed} real-backend tests passed`);
console.log("measurements:", JSON.stringify(sizes));
