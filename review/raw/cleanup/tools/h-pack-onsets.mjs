// (h) Every pack's finale onsets, measured: each finish(env) is run against a stub AudioContext that records when
// every oscillator / buffer source is started, relative to t0. Usage: node h-pack-onsets.mjs <repo dir>
import { pathToFileURL } from "node:url";
const dir = process.argv[2];
const { PACKS, PACK_ORDER } = await import(pathToFileURL(dir + "/packs.js").href);
const SECRET = await import(pathToFileURL(dir + "/packs-secret.js").href);
function stubContext(starts) {
  const param = () => ({ value: 0, setValueAtTime() {}, [REDACTED]() {}, [REDACTED]() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
  const node = () => ({ connect() {}, disconnect() {}, gain: param(), frequency: param(), Q: param(), detune: param(), type: "sine", start(t = 0) { starts.push(+t.toFixed(3)); }, stop() {}, buffer: null, playbackRate: param() });
  return { currentTime: 0, sampleRate: 48000, destination: {}, createOscillator: node, createGain: node, createBiquadFilter: node, createBufferSource: node, createBuffer: (ch, n) => ({ getChannelData: () => new Float32Array(n) }), [REDACTED]: node };
}
const all = { ...PACKS, ...(SECRET.PACKS || {}) };
for (const name of [...PACK_ORDER, ...Object.keys(all).filter(k => !PACK_ORDER.includes(k))]) {
  const pack = all[name]; if (!pack || !pack.finish) { console.log(name, "(no finish)"); continue; }
  const starts = []; const c = stubContext(starts);
  try { pack.finish({ c, master: c.createGain(), kit: {}, P: (k, d) => d }); } catch (e) { console.log(name, "threw:", e.message); continue; }
  const onsets = [...new Set(starts)].sort((a, b) => a - b);
  console.log(name.padEnd(11), "onsets(s):", onsets.join(" "), "| last:", onsets[onsets.length - 1], "| has 0.7:", onsets.includes(0.7));
}
