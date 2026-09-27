// Node tests for the audio-context state machine in sound.js. Run: node test/sound.test.js
// A fake AudioContext models what iOS does: a fresh context starts suspended, the app goes to the background
// (suspended, resume works), a call or Siri interrupts it (resume never lands), and closed contexts.
import assert from "node:assert/strict";
import { createSound, SECRET_ENGINES, EXTRA_ENGINES, FINALE_BUZZ, phrase, ROOM } from "../sound.js";
import * as EXTRA from "../packs-extra.js";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { PACKS, PACK_ORDER, PACK_NAMES, HELPERS, SCRATCH, scratch, CUES } from "../packs.js";
import * as SECRET from "../packs-secret.js";

let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log("ok -", name); }
const tick = () => new Promise(r => setTimeout(r, 5));

class FakeAC {
  constructor() { this.state = "suspended"; this.resumes = 0; this.resumeWorks = true; this.sampleRate = 48000; this.currentTime = 0; this.destination = {}; this.nodes = 0; FakeAC.all.push(this); }
  resume() { this.resumes++; if (this.resumeWorks && this.state !== "closed") this.state = "running"; return Promise.resolve(); }
  close() { this.state = "closed"; return Promise.resolve(); }
  createGain() { this.nodes++; return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} }, connect() {} }; } // 1.12 b279: the scratch glides its level
  createOscillator() { this.nodes++; return { type: "sine", frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
  createBufferSource() { this.nodes++; return { buffer: null, loop: false, playbackRate: { value: 1 }, connect() {}, start() {}, stop() {} }; }
  createBiquadFilter() { this.nodes++; return { type: "", Q: { value: 0 }, frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} }, connect() {} }; }
}
FakeAC.all = [];
const last = () => FakeAC.all[FakeAC.all.length - 1];

function make(over = {}) {
  FakeAC.all = [];
  let secretLoads = 0, extraLoads = 0;
  const o = { muted: () => false, volume: () => 1, kit: () => ({ engine: "knock" }), pack: () => "", haptics: false, AudioContext: FakeAC, loadPacks: () => Promise.resolve({ PACKS, HELPERS }), loadSecret: () => { secretLoads++; return Promise.resolve(SECRET); }, loadExtra: () => { extraLoads++; return Promise.resolve(EXTRA); }, ...over };
  const s = createSound(o); s.secretLoads = () => secretLoads; s.extraLoads = () => extraLoads; return s;
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

await test("1.7: a check-off before the engines land plays as soon as they do, once; a late arrival is dropped; preload makes no context", async () => {
  let resolveLoad; const s = make({ loadPacks: () => new Promise(r => { resolveLoad = r; }) });
  s.prime(); await tick();
  assert.equal(s.check(0), false, "not yet"); const c = last(); const before = c.nodes;
  resolveLoad({ PACKS }); await tick(); await tick();
  assert.ok(c.nodes > before, "played when the engines landed"); assert.equal(s.state().packs, true);
  const n = c.nodes; await tick(); assert.equal(c.nodes, n, "once");
  const s2 = make({ loadPacks: () => Promise.resolve({ PACKS }) }); s2.preload(); await tick();
  assert.equal(FakeAC.all.length, 0, "preload made no context"); assert.equal(s2.state().packs, true);
});

await test("1.8: the Secret pair's two engines live in a module of their own, fetched only when one is asked for", async () => {
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

await test("the finale's vibration keeps the volley's rhythm — read out of fx.js, not copied from it", async () => {
  // fx.js is where the confetti's timing lives; this reads the schedule back out of it so that changing the
  // volley and leaving the vibration behind is a red suite rather than a thing nobody notices on an Android.
  const fx = fs.readFileSync(fileURLToPath(new URL("../fx.js", import.meta.url)), "utf8");
  const run = /for \(let i = 0; i < (\d+); i\+\+\) setTimeout\([^;]*?, i \* (\d+)\);/.exec(fx);
  const centre = /setTimeout\(\(\) => burst\([^;]*?\), (\d+)\);/.exec(fx);
  assert.ok(run && centre, "fx.js still schedules a run of bursts and a centre burst");
  const count = +run[1], step = +run[2], centreAt = +centre[3 - 2];
  const bursts = Array.from({ length: count }, (_, i) => i * step);

  // navigator.vibrate alternates buzz, gap, buzz, gap… so a buzz starts at the sum of everything before it
  const onsets = [], lengths = [];
  let t = 0;
  for (let i = 0; i < FINALE_BUZZ.length; i++) { if (i % 2 === 0) { onsets.push(t); lengths.push(FINALE_BUZZ[i]); } t += FINALE_BUZZ[i]; }

  assert.equal(onsets.length, count + 1, "one buzz per burst, and one more for the chord");
  for (let i = 0; i < count; i++) assert.equal(onsets[i], bursts[i], `buzz ${i} lands on burst ${i}`);

  // the centre burst has no buzz of its own; the buzz it falls inside is longer for it
  const inside = onsets.findIndex((o, i) => centreAt >= o && centreAt < o + lengths[i]);
  assert.ok(inside >= 0, "the centre burst falls inside one of the buzzes");
  assert.ok(lengths[inside] > lengths[0], "and that buzz is the longer one");

  const chord = onsets[onsets.length - 1];
  assert.ok(chord > bursts[count - 1], "the last buzz comes after the run, with the chord");
  assert.ok(lengths[lengths.length - 1] > lengths[0], "and it is the strongest of them");
});

await test("1.12 b262: the Extra category's engines live in a module of their own, fetched only when one is asked for, and never with the Secret pair's", async () => {
  assert.deepEqual([...EXTRA_ENGINES].sort(), ["burn", "carve", "chalk", "marker"]); // 1.12 b268: the wood pair's two
  assert.deepEqual(EXTRA.ORDER, ["chalk", "marker", "carve", "burn"], "a pair at a time, in the order they shipped");
  for (const id of EXTRA.ORDER) assert.equal(typeof EXTRA.NAMES[id], "string", id + " has a name");
  for (const id of EXTRA.ORDER) assert.ok(!PACK_ORDER.includes(id), id + " is never in the twelve, so never in a T2 code");
  const plain = make(); plain.prime(); await tick(); plain.check(0); plain.uncheck(); plain.finish();
  assert.equal(plain.extraLoads(), 0, "no kit that carries one is on: the module is never fetched"); assert.equal(plain.secretLoads(), 0);
  const s = make({ kit: () => ({ engine: "chalk" }) });
  s.prime(); await tick();
  assert.equal(s.extraLoads(), 1, "prime() warms the engine the kit that is on carries"); assert.equal(s.secretLoads(), 0, "and not the Secret pair's module");
  for (let step = 0; step < 12; step++) assert.equal(s.check(step), true, "chalk step " + step);
  assert.equal(s.uncheck(), true); assert.equal(s.finish(), true);
  assert.equal(s.preview("marker"), true, "the other one plays through the same module");
  assert.equal(s.extraLoads(), 1, "fetched once");
  const w = make(); w.warm("marker"); await tick(); assert.equal(w.extraLoads(), 1); assert.equal(w.secretLoads(), 0);
  await w.ready("chalk"); assert.equal(w.extraLoads(), 1);
  // every sound of both engines renders without throwing on the fake context, at every step
  const P = await import("../packs.js");
  const built = EXTRA.create(P.HELPERS);
  for (const id of EXTRA.ORDER) { const o = make({ kit: () => ({ engine: id }) }); o.prime(); await tick(); for (let i = 0; i < 6; i++) assert.equal(o.check(i), true); assert.equal(o.uncheck(), true); assert.equal(o.finish(), true); assert.equal(typeof built[id].check, "function"); }
});

await test("1.12 b279: every engine the app can play has a scratch — the twelve, the Secret pair's, the Extra kits' — and each row is a filter the Web Audio API takes, a centre inside hearing, a level under the check-off and some grain", async () => {
  const engines = [...PACK_ORDER, ...SECRET_ENGINES, ...EXTRA_ENGINES];
  assert.deepEqual(engines.filter(id => !SCRATCH[id]), [], "a scratch for every engine");
  assert.deepEqual(Object.keys(SCRATCH).filter(id => !engines.includes(id)), [], "and none for an engine that does not exist");
  for (const [id, [type, f, q, level, grain]] of Object.entries(SCRATCH)) {
    assert.ok(["bandpass", "lowpass", "highpass"].includes(type), id + ": " + type);
    assert.ok(f >= 200 && f <= 8000 && q > 0 && q <= 6, id + ": " + f + " Hz, Q " + q);
    assert.ok(level > 0 && level <= 0.3, id + ": level " + level + " (tools/sounds.js keeps a fast stroke under the check-off)");
    assert.ok(grain > 0 && grain <= 1.5, id + ": grain " + grain);
  }
});
await test("1.12 b279: sound.scratch() is null when muted and before the engines land, and a voice that follows speed and stops once when they have", async () => {
  FakeAC.all = [];
  let muted = true; const o = make({ muted: () => muted, kit: () => ({ engine: "chalk" }), loadPacks: () => Promise.resolve({ PACKS, HELPERS, scratch }) }); // the module import() hands over, scratch and all
  assert.equal(o.scratch(), null, "muted: nothing");
  muted = false; assert.equal(o.scratch(), null, "the engines have not landed yet: nothing, and they are asked for");
  o.prime(); await tick();
  const v = o.scratch(); assert.ok(v && typeof v.speed === "function" && typeof v.stop === "function", "a voice");
  v.speed(0.8, 0.2); v.speed(5, 1.4); v.stop(); v.stop(); v.speed(1, 0.5); // out of range, twice stopped, spoken to after: none of it throws
});

await test("1.12 b293: the day's check-offs climb a major pentatonic, in each engine's own units of pitch; the others keep their own steps", async () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(s => phrase("knock", s)), [0, 4, 8, 14, 18, 24], "a knock's steps are quarter tones");
  assert.deepEqual([0, 1, 2, 3, 4].map(s => phrase("blip", s)), [0, 2, 4, 7, 9], "a blip's are semitones");
  assert.deepEqual([0, 1, 2, 3, 4].map(s => phrase("marble", s)), [0, 6, 12, 21, 27], "a marble's are thirds of one");
  assert.deepEqual([0, 3, 7].map(s => phrase("kalimba", s)), [0, 3, 7], "the kalimba climbs its own pentatonic already");
  assert.deepEqual(Object.keys(ROOM).sort(), ["candy", "clean", "ember", "glass", "glow", "ink", "pencil", "phosphor", "pixel", "tide"], "a room for each of the ten materials");
});
await test("1.12 b293: the stage — a limiter and a room where the context has them, each sound panned where it came from — has no loop in it; a cue plays only on a context that is already running", async () => {
  const edges = [];
  class StageAC extends FakeAC {
    constructor() { super(); this.state = "running"; }
    track(n, kind) { n.kind = kind; n.connect = to => { edges.push([n, to]); return to; }; return n; }
    createGain() { return this.track(super.createGain(), "gain"); }
    createOscillator() { return this.track(super.createOscillator(), "osc"); }
    createBufferSource() { return this.track(super.createBufferSource(), "src"); }
    createBiquadFilter() { return this.track(super.createBiquadFilter(), "filter"); }
    createDynamicsCompressor() { this.nodes++; const p = () => ({ value: 0 }); return this.track({ threshold: p(), knee: p(), ratio: p(), attack: p(), release: p() }, "limiter"); }
    createConvolver() { this.nodes++; return this.track({ buffer: null }, "room"); }
    createStereoPanner() { this.nodes++; return this.track({ pan: { value: 0 } }, "pan"); }
  }
  const s = make({ AudioContext: StageAC, mat: () => "glass", loadPacks: () => Promise.resolve({ PACKS, HELPERS, CUES }) });
  s.prime(); await tick();
  assert.equal(s.check(0, 0.9), true); assert.equal(s.uncheck(0.1), true); assert.equal(s.finish(), true);
  const pans = edges.filter(([n]) => n.kind === "pan").map(([n]) => n.pan.value);
  assert.ok(pans.length === 2 && pans[0] > 0.4 && pans[1] < -0.4, "the check-off heard on the right, the uncheck on the left: " + pans);
  const next = new Map(); for (const [a, b] of edges) { if (!next.has(a)) next.set(a, []); next.get(a).push(b); }
  const seen = new Set(), on = new Set();
  const loops = n => { if (on.has(n)) return true; if (seen.has(n)) return false; seen.add(n); on.add(n); for (const m of next.get(n) || []) if (loops(m)) return true; on.delete(n); return false; };
  assert.equal([...next.keys()].some(loops), false, "no sound feeds back into itself");
  assert.ok(edges.some(([n]) => n.kind === "room") && edges.some(([n, to]) => n.kind === "limiter" && to.kind === "gain"), "a room, and a limiter in front of the volume");
  assert.equal(s.cue("whoosh", 0.5, { running: true }), true, "a cue on a running context");
  assert.equal(s.cue("nothing"), false, "a cue that does not exist is nothing");
  const cold = make({ loadPacks: () => Promise.resolve({ PACKS, HELPERS, CUES }) });
  assert.equal(cold.cue("unlock", 0.1, { running: true }), false, "a cue never makes a context");
  assert.equal(FakeAC.all.length, 0, "no context was made");
  const dry = make(); dry.prime(); await tick(); await tick();
  assert.equal(dry.check(0, 0.2), true, "a context with no limiter, room or panner plays dry, as before");
});

console.log(`\n${passed} sound tests passed`);
