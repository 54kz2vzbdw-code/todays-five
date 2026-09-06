// test/tools/check-swift-envelopes.mjs — the other direction of the envelope round trip: envelopes the
// Swift core sealed, opened here by crypto.js. The Swift suite writes them to
// apple/TodaysFiveCore/.artifacts/swift-envelopes.json when it runs; run `swift test` first.
//
// This is what proves Apple's Compression framework writes DEFLATE the web can read — the reading of
// the documentation is not the proof.
// Run: node test/tools/check-swift-envelopes.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import * as C from "../../crypto.js";

const path = new URL("../../apple/TodaysFiveCore/.artifacts/swift-envelopes.json", import.meta.url);
if (!fs.existsSync(path)) {
  console.error("no swift-envelopes.json — run `swift test` in apple/TodaysFiveCore first");
  process.exit(1);
}
const cases = JSON.parse(fs.readFileSync(path, "utf8"));
assert.ok(Array.isArray(cases) && cases.length >= 3, "expected at least three envelopes");

let passed = 0;
for (const c of cases) {
  const ref = await C.fromWrite(c.W);

  assert.ok(C.isEnvelope(c.env), c.name + ": Swift's compressed envelope is one of ours");
  assert.equal(c.env.z, "deflate-raw", c.name + ": the compression flag");
  assert.deepEqual(Object.keys(c.env), ["v", "alg", "z", "iv", "ct"], c.name + ": key order");
  const opened = await C.open(ref.key, c.env);
  assert.equal(JSON.stringify(opened), c.plaintext, c.name + ": deflate-raw from Swift opens here");

  assert.ok(!("z" in c.envRaw), c.name + ": the uncompressed one carries no flag");
  const openedRaw = await C.open(ref.key, c.envRaw);
  assert.equal(JSON.stringify(openedRaw), c.plaintext, c.name + ": uncompressed from Swift opens here");

  // and the compression flag is authenticated on this side too
  const { z, ...noZ } = c.env;
  await assert.rejects(C.open(ref.key, noZ), c.name + ": dropping z must fail authentication");

  passed++;
  console.log("ok -", c.name, `(${C.envelopeBytes(c.env)} bytes compressed, ${C.envelopeBytes(c.envRaw)} not)`);
}
console.log(`\n${passed} Swift-sealed envelopes opened by crypto.js`);
