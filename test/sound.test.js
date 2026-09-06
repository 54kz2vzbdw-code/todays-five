// Node tests for the audio-context state machine in sound.js. Run: node test/sound.test.js
// A fake AudioContext models what iOS does: a fresh context starts suspended, the app goes to the background
// (suspended, resume works), a call or Siri interrupts it (resume never lands), and closed contexts.
import assert from "node:assert/strict";
import { createSound, SECRET_ENGINES } from "../sound.js";
import { PACKS, PACK_ORDER, PACK_NAMES, HELPERS } from "../packs.js";
import * as SECRET from "../packs-secret.js";

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log("ok -", name); }
const tick = () => new Promise(r => setTimeout(r, 5));

class FakeAC {
  constructor() { this.state = "suspended"; this.resumes = 0; this.resumeWorks = true; this.sampleRate = 48000; this.currentTime = 0; this.destination = {}; this.nodes = 0; FakeAC.all.push(this); }
  resume() { this.resumes++; if (this.resumeWorks && this.state !== "closed") this.state = "running"; return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
  createGain() { this.nodes++; return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  createOscillator() { this.nodes++; return { type: "sine", frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
  createBufferSource() { this.nodes++; return { buffer: null, connect() {}, start() {}, stop() {} }; }
  createBiquadFilter() { this.nodes++; return { type: "", Q: { value: 0 }, frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
}
FakeAC.all = [];
const last = () => FakeAC.all[FakeAC.all.length - 1];

function make(over = {}) {
  FakeAC.all = [];
  let secretLoads = 0;
  const o = { muted: () => false, volume: () => 1, kit: () => ({ engine: "knock" }), pack: () => "", haptics: false, AudioContext: FakeAC, loadPacks: () => Promise.resolve({ PACKS, HELPERS }), loadSecret: () => { secretLoads++; return Promise.resolve(SECRET); }, ...over };
  const s = createSound(o); s.secretLoads = () => secretLoads; return s;
}

await test("muted: no context is ever created", async () => {
  const s = make({ muted: () => true });
  assert.equal(s.check(0), false); s.prime(); s.foreground();
  assert.equal(FakeAC.all.length, 0); assert.equal(s.state().state, "none");
});

await test("first gesture: a fresh (suspended) context is resumed inside the tap; the engines load; the next tap plays", async () => {
  const s = make();
  s.prime(); await tick();
  assert.equal(FakeAC.all.length, 1); assert.equal(last().resumes, 1); assert.equal(last().state, "running");
  assert.equal(s.state().pending, false); assert.equal(s.state().packs, true);
  assert.equal(s.check(0), true); assert.ok(last().nodes > 0, "nodes were scheduled");
  assert.equal(FakeAC.all.length, 1, "no second context while the first runs");
});

await test("background then back: suspended → one resume, same context", async () => {
  const s = make(); s.prime(); await tick();
  last().state = "suspended";
  assert.equal(s.check(1), true);
  assert.equal(last().resumes, 2); assert.equal(last().state, "running"); assert.equal(FakeAC.all.length, 1);
});

await test("interrupted by a call and resume never lands: the next tap closes it and makes a fresh context", async () => {
  const s = make(); s.prime(); await tick();
  const first = last();
  first.state = "interrupted"; first.resumeWorks = false;
  s.check(0); await tick();                         // asked for a resume that never comes
  assert.equal(first.resumes, 2); assert.equal(first.state, "interrupted"); assert.equal(s.state().pending, true);
  assert.equal(s.check(1), true); await tick();     // gave up on it inside this gesture
  assert.equal(FakeAC.all.length, 2, "a fresh context"); assert.equal(first.state, "closed", "the dead one was closed");
  assert.equal(last().state, "running"); assert.equal(s.state().pending, false);
  assert.equal(s.check(2), true); assert.equal(FakeAC.all.length, 2, "and it is kept from then on");
});

await test("a closed context is replaced at once", async () => {
  const s = make(); s.prime(); await tick();
  last().state = "closed";
  assert.equal(s.check(0), true); assert.equal(FakeAC.all.length, 2); assert.equal(last().state, "running");
});

await test("foreground(): resumes a suspended context, leaves a running one alone, never touches a closed one", async () => {
  const s = make(); s.prime(); await tick();
  const c = last(); const n = c.resumes;
  s.foreground(); assert.equal(c.resumes, n, "running: nothing to do");
  c.state = "suspended"; s.foreground(); assert.equal(c.resumes, n + 1); assert.equal(c.state, "running");
  c.state = "closed"; s.foreground(); assert.equal(c.resumes, n + 1);
  // foreground asked, the resume did not land, then the user taps: fresh context inside the gesture
  const s2 = make(); s2.prime(); await tick(); const c2 = last(); c2.state = "interrupted"; c2.resumeWorks = false;
  s2.foreground(); assert.equal(s2.state().pending, true);
  assert.equal(s2.check(0), true); assert.equal(FakeAC.all.length, 2);
});

await test("every pack plays check, uncheck and finish without throwing, and the device override picks the pack", async () => {
  for (const name of PACK_ORDER) {
    const s = make({ kit: () => ({ engine: "bell", pitch: 0.9, decay: 1.2 }), pack: () => name });
    s.prime(); await tick();
    const c = last(); const before = c.nodes;
    assert.equal(s.check(3), true); assert.equal(s.uncheck(), true); assert.equal(s.finish(), true); assert.equal(s.tick(), true);
    assert.ok(c.nodes > before + 6, name + " scheduled nodes");
    assert.equal(s.preview(name), true);
  }
  assert.deepEqual(Object.keys(PACKS).sort(), [...PACK_ORDER].sort());
  for (const p of Object.values(PACKS)) for (const fn of ["check", "uncheck", "finish"]) assert.equal(typeof p[fn], "function");
});

await test("1.5: twelve packs, the six new ones after the six of 1.1, every one named", async () => {
  assert.deepEqual(PACK_ORDER, ["knock", "bell", "blip", "typewriter", "marble", "pop", "kalimba", "pencil", "whistle", "bongo", "cork", "arcade"]);
  for (const id of PACK_ORDER) assert.equal(typeof PACK_NAMES[id], "string", id + " has a name");
  // the new voices climb, alternate or vary with the step and never throw for any step
  for (const id of ["kalimba", "pencil", "whistle", "bongo", "cork", "arcade"]) { const s = make({ pack: () => id }); s.prime(); await tick(); for (let step = 0; step < 12; step++) assert.equal(s.check(step), true, id + " step " + step); }
  // a theme's pitch and decay still reach them
  const s = make({ kit: () => ({ engine: "knock", pitch: 0.7, decay: 1.6 }), pack: () => "cork" }); s.prime(); await tick();
  assert.equal(s.check(0), true); assert.equal(s.finish(), true);
});

await test("1.6: the Secret pair's two engines live in a module of their own, fetched only when one is asked for", async () => {
  assert.deepEqual([...SECRET_ENGINES].sort(), ["party", "sparkle"]);
  assert.deepEqual(SECRET.ORDER, ["sparkle", "party"]);
  for (const id of SECRET.ORDER) assert.equal(typeof SECRET.NAMES[id], "string", id + " has a name");
  assert.ok(!PACK_ORDER.includes("sparkle") && !PACK_ORDER.includes("party"), "and never in the twelve");
  // a device on any other kit never asks for it
  const plain = make(); plain.prime(); await tick();
  plain.check(0); plain.uncheck(); plain.finish();
  assert.equal(plain.secretLoads(), 0, "no kit that carries one is on: the module is never fetched");
  assert.equal(plain.state().extra, false);
  // the first sound on a Secret kit starts the fetch; from then on it plays
  const s = make({ kit: () => ({ engine: "sparkle" }) });
  s.prime(); await tick();
  assert.equal(s.secretLoads(), 1, "prime() warms the engine the kit that is on carries");
  assert.equal(s.state().extra, true);
  for (let step = 0; step < 12; step++) assert.equal(s.check(step), true, "sparkle step " + step);
  assert.equal(s.uncheck(), true); assert.equal(s.finish(), true);
  assert.equal(s.preview("party"), true, "the other one plays through the same module");
  assert.equal(s.secretLoads(), 1, "fetched once");
  // warm() on its own, without a context (app.js calls it when the kit goes on)
  const w = make(); assert.equal(w.secretLoads(), 0); w.warm("party"); await tick();
  assert.equal(w.secretLoads(), 1); assert.equal(w.warm("knock"), undefined); assert.equal(w.secretLoads(), 1, "the twelve need no warming");
  await w.ready("sparkle"); assert.equal(w.state().extra, true);
  // the device override reaches them too, and a theme's pitch and decay still land
  const o = make({ kit: () => ({ engine: "bell", pitch: 0.8, decay: 1.3 }), pack: () => "party" });
  o.prime(); await tick(); assert.equal(o.check(2), true); assert.equal(o.finish(), true);
  // built from packs.js's own two builders, handed over rather than imported
  const built = SECRET.create(HELPERS);
  assert.deepEqual(Object.keys(built).sort(), ["party", "sparkle"]);
  for (const p of Object.values(built)) for (const fn of ["check", "uncheck", "finish"]) assert.equal(typeof p[fn], "function");
});

await test("an unknown engine name falls back to the knock", async () => {
  const s = make({ kit: () => ({ engine: "kazoo" }) }); s.prime(); await tick();
  assert.equal(s.check(0), true);
});

console.log(`\n${passed} sound tests passed`);
