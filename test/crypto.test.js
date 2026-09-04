// Node tests for crypto.js. Run: node test/crypto.test.js
// The derivation vectors are PINNED. If this file fails after a refactor, the refactor changed the key
// derivation and would orphan every existing list: fix the code, never the vectors.
import assert from "node:assert/strict";
import * as C from "../crypto.js";

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log("ok -", name); }

const VECTORS = [
  { W: "0000000000000000000000", R: "f5jwBqepsm4euDWGqzIaoz", lookupId: "Pw65fk7NC0dA6FXNQZqS7ByhW8leXlEX", token: "2ypXzsOVYhrGZ5LeMwr_nyEdjFdrP8rt49XD8o7OW5I", keyHex: "d9c865725135ec37dfdc335292f53a807efe9ae87475d9d33f621d9432cf6518" },
  { W: "AbCdEfGhIjKlMnOpQrStUv", R: "mgmG3Iy1o4Po3rGCzouWck", lookupId: "vyYoOBXhDMNnl4aAaKYKSwyouuuG31sc", token: "bhiaZ9Bmf2RkcvSM1V7qSgZCZWwkJd1vm3XtL0OkcGI", keyHex: "7af2e2f8cabe7dcb1cea93c4b485cfc76e27f7265510df1cc0e961e7b67a69d4" },
  { W: "zzzzzzzzzzzzzzzzzzzzzz", R: "62QPblnKIY0WDeOaCZm70X", lookupId: "JhwQ61Xd491BdswU1nNy20RGC6YSWxKm", token: "odx3wxFh5q21nfpDFQjYm2OGSCdB-gaFKqrWRqNMi6M", keyHex: "36a5a467d2ac419e1c97bc8b1068b614c6078274f51a749173a8153cb1a5bf14" }
];

const doc = () => ({ v: 2, name: "Test", items: { a: { id: "a", text: "Call the bank", done: false, updatedAt: 1 } }, sections: {}, history: { "2026-01-01": [{ id: "h", text: "x", doneAt: 1, section: "" }] }, themes: {}, updatedAt: 1 });

await test("pinned derivation vectors: W → R → lookupId, key; W → token", async () => {
  for (const v of VECTORS) {
    const e = await C.fromWrite(v.W);
    assert.equal(e.R, v.R, "R for " + v.W);
    assert.equal(e.lookupId, v.lookupId, "lookupId for " + v.W);
    assert.equal(e.token, v.token, "token for " + v.W);
    assert.equal(C.hex(await C.hkdfBits(e.R, "key", 32)), v.keyHex, "key for " + v.W);
    assert.match(e.R, /^[0-9A-Za-z]{22}$/); assert.match(e.lookupId, /^[0-9A-Za-z]{32}$/); assert.match(e.token, /^[0-9A-Za-z_-]{43}$/);
  }
});

await test("the view link derives the same lookupId and key, and no token", async () => {
  for (const v of VECTORS) {
    const e = await C.fromWrite(v.W), r = await C.fromRead(v.R);
    assert.equal(r.lookupId, e.lookupId);
    assert.equal(r.token, null);
    assert.equal(r.mode, "view"); assert.equal(e.mode, "edit");
    assert.ok(!("W" in r), "a view derivation never carries W");
    // the two CryptoKeys are the same key: what one seals the other opens
    const env = await C.seal(e.key, doc());
    assert.deepEqual(await C.open(r.key, env), doc());
    const env2 = await C.seal(r.key, doc());
    assert.deepEqual(await C.open(e.key, env2), doc());
  }
});

await test("nothing derivable from R reproduces the token (R is not an input to the write branch)", async () => {
  const e = await C.fromWrite(VECTORS[0].W);
  // HKDF(R, "write") is a different value: the token depends on W, which R does not contain
  const fromR = C.b64url(await C.hkdfBits(e.R, "write", 32));
  assert.notEqual(fromR, e.token);
  // the server compares sha256(token); a view holder cannot produce a token whose hash matches
  const sha = async s => C.hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))));
  assert.notEqual(await sha(fromR), await sha(e.token));
});

await test("envelope shape and round trip, compressed and not", async () => {
  const e = await C.fromWrite(VECTORS[1].W);
  const env = await C.seal(e.key, doc());
  assert.equal(env.v, 3); assert.equal(env.alg, "A256GCM"); assert.equal(env.z, "deflate-raw");
  assert.equal(C.unb64(env.iv).length, 12);
  assert.ok(C.isEnvelope(env));
  assert.deepEqual(await C.open(e.key, env), doc());
  const raw = await C.seal(e.key, doc(), { compress: false });
  assert.ok(!("z" in raw));
  assert.deepEqual(await C.open(e.key, raw), doc());
  assert.deepEqual(Object.keys(env), ["v", "alg", "z", "iv", "ct"]);
});

await test("fresh iv per write; ciphertexts differ for the same doc", async () => {
  const e = await C.fromWrite(VECTORS[1].W);
  const a = await C.seal(e.key, doc()), b = await C.seal(e.key, doc());
  assert.notEqual(a.iv, b.iv); assert.notEqual(a.ct, b.ct);
});

await test("tampering fails: ct, iv, header flag, wrong key, plaintext doc", async () => {
  const e = await C.fromWrite(VECTORS[1].W), other = await C.fromWrite(VECTORS[2].W);
  const env = await C.seal(e.key, doc());
  const flip = s => { const b = C.unb64(s); b[0] ^= 1; return C.b64(b); };
  await assert.rejects(C.open(e.key, { ...env, ct: flip(env.ct) }));
  await assert.rejects(C.open(e.key, { ...env, iv: flip(env.iv) }));
  const { z, ...noZ } = env; await assert.rejects(C.open(e.key, noZ), "dropping the compression flag must fail authentication");
  await assert.rejects(C.open(e.key, { ...env, z: "gzip" }));
  await assert.rejects(C.open(other.key, env));
  await assert.rejects(C.open(e.key, { v: 2, items: {} }));
  assert.ok(!C.isEnvelope({ v: 2, items: {} })); assert.ok(!C.isEnvelope(null)); assert.ok(!C.isEnvelope({ v: 3, alg: "A256GCM", iv: 1, ct: "x" }));
});

await test("a year of history compresses far below the 96 KB server cap", async () => {
  const e = await C.fromWrite(VECTORS[0].W);
  const d = doc();
  for (let i = 0; i < 365; i++) d.history["2025-" + String(1 + i % 12).padStart(2, "0") + "-" + String(1 + i % 28).padStart(2, "0") + "x" + i] = Array.from({ length: 5 }, (_, j) => ({ id: "h" + i + j, text: "Follow up with the structural engineer on the RFI about the slab", doneAt: 1725000000000 + i * 86400000 + j, section: "Work" }));
  for (let i = 0; i < 60; i++) d.items["i" + i] = { id: "i" + i, sectionId: "", text: "Line number " + i + " with a reasonably long description", note: "and a note", done: false, doneAt: 0, today: i < 5, order: i, todayOrder: i, updatedAt: 1 };
  const env = await C.seal(e.key, d);
  const plain = new TextEncoder().encode(JSON.stringify(d)).length;
  assert.ok(plain > 200000, "plain " + plain);
  assert.ok(C.envelopeBytes(env) < 40000, "envelope " + C.envelopeBytes(env));
  assert.deepEqual(await C.open(e.key, env), d);
});

await test("base62 mapping is deterministic and rejects biased bytes", () => {
  const bytes = new Uint8Array([0, 61, 62, 247, 248, 255, 10]);
  // 0→'0', 61→'z', 62→'0', 247→'z', 248 and 255 rejected (they would bias the last symbols), 10→'A'
  assert.equal(C.b62FromBytes(bytes, 5), "0z0zA");
  assert.equal(C.b62FromBytes(bytes, 6), null, "not enough bytes → null, and deriveB62 asks for another block");
});

await test("isSecret accepts 22–64 base62 and nothing else", () => {
  assert.ok(C.isSecret("AbCdEfGhIjKlMnOpQrStUv")); assert.ok(C.isSecret("Pw65fk7NC0dA6FXNQZqS7ByhW8leXlEX"));
  assert.ok(!C.isSecret("short")); assert.ok(!C.isSecret("has-dash-has-dash-has-dash")); assert.ok(!C.isSecret(42));
});

console.log(`\n${passed} crypto tests passed`);
