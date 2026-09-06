// tools/sounds.js — renders every sound pack's check (three steps), uncheck and finale through an OfflineAudioContext
// in Chrome and writes one WAV per pack, with a table of peak and loudness per sound so the packs sit at the same
// level. Run: node tools/serve.js 8791 . &  then  node tools/sounds.js shots/1.6/sounds [pack,pack,…]
// The second argument joins those packs, in that order, into joined.wav with a pause between them (for listening).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const NM = process.env.NODE_PATH || (process.env.HOME + "/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules");
const require = createRequire(NM + "/");
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://127.0.0.1:8791/";
const OUT = path.resolve(process.argv[2] || "shots/sounds");
const JOIN = (process.argv[3] || "").split(",").filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });
const RATE = 44100, SECONDS = 4.6, EVENTS = { check0: 0, check1: 0.45, check2: 0.9, uncheck: 1.5, finish: 2.1 };

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto(BASE + "?transport=local");
// the twelve, then the two the Secret pair carries (1.6): they are levelled against the same table
const packs = await page.evaluate(async () => [...(await import("./packs.js")).PACK_ORDER, ...(await import("./packs-secret.js")).ORDER]);
const wav = (pcm) => { // 16-bit mono
  const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVE", 8); h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]);
};
const rows = [], pcmOf = {};
for (const id of packs) {
  const r = await page.evaluate(async ({ id, RATE, SECONDS, EVENTS }) => {
    const P = await import("./packs.js");
    const PACKS = { ...P.PACKS, ...(await import("./packs-secret.js")).create(P.HELPERS) };
    const c = new OfflineAudioContext(1, Math.ceil(RATE * SECONDS), RATE);
    const master = c.createGain(); master.gain.value = 1; master.connect(c.destination);
    const kit = { engine: id, pitch: 1, decay: 1 };
    const env = { c, master, kit, P: (key, d) => { const v = kit[key]; return typeof v === "number" ? v : d; } };
    // the engines read c.currentTime, so rendering is suspended at each event's time, the sound scheduled there, and resumed
    const at = (t, fn) => c.suspend(t).then(() => { fn(); return c.resume(); });
    const pending = [
      at(EVENTS.check0 + 0.01, () => PACKS[id].check(env, 0)), at(EVENTS.check1, () => PACKS[id].check(env, 1)), at(EVENTS.check2, () => PACKS[id].check(env, 2)),
      at(EVENTS.uncheck, () => PACKS[id].uncheck(env)), at(EVENTS.finish, () => PACKS[id].finish(env))
    ];
    const buf = await c.startRendering(); await Promise.all(pending);
    const d = buf.getChannelData(0);
    const stat = (a, b) => { let peak = 0, sum = 0, n = 0; for (let i = Math.floor(a * RATE); i < Math.min(d.length, Math.floor(b * RATE)); i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; sum += d[i] * d[i]; n++; } return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / Math.max(1, n)).toFixed(4) }; };
    let last = 0; for (let i = d.length - 1; i > 0; i--) if (Math.abs(d[i]) > 0.004) { last = i; break; }
    const pcm = new Int16Array(d.length); for (let i = 0; i < d.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(d[i] * 32767)));
    const bytes = new Uint8Array(pcm.buffer); let bin = ""; for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); const b64 = btoa(bin);
    return { check: stat(EVENTS.check0, EVENTS.check1), uncheck: stat(EVENTS.uncheck, EVENTS.finish), finish: stat(EVENTS.finish, SECONDS), tail: +(last / RATE - EVENTS.finish).toFixed(2), b64, clipped: d.some(v => Math.abs(v) >= 1) };
  }, { id, RATE, SECONDS, EVENTS });
  const pcm = Buffer.from(r.b64, "base64"); pcmOf[id] = pcm;
  fs.writeFileSync(path.join(OUT, id + ".wav"), wav(pcm));
  // the envelope, drawn: loudness in 4 ms windows, the five events marked (a picture of the sound for PLAN.md)
  try {
    const sharp = require("sharp"); const W = 920, H = 160, win = Math.round(RATE * 0.004), n = Math.floor(pcm.length / 2 / win);
    let pts = ""; for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < win; j++) { const v = pcm.readInt16LE((i * win + j) * 2) / 32768; s += v * v; } const rms = Math.sqrt(s / win); pts += `${(i / n * W).toFixed(1)},${(H - 8 - Math.min(1, rms * 6) * (H - 16)).toFixed(1)} `; }
    const marks = Object.entries(EVENTS).map(([k, t]) => `<line x1="${(t / SECONDS * W).toFixed(1)}" y1="0" x2="${(t / SECONDS * W).toFixed(1)}" y2="${H}" stroke="#D26128" stroke-width="1" stroke-dasharray="3 3"/><text x="${(t / SECONDS * W + 3).toFixed(1)}" y="12" font-family="Helvetica, Arial" font-size="10" fill="#D26128">${k}</text>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#1B1917"/>${marks}<polyline points="${pts}" fill="none" stroke="#F5F1EA" stroke-width="1"/><text x="6" y="${H - 6}" font-family="Helvetica, Arial" font-size="11" fill="#9EA2A7">${id} — loudness over ${SECONDS} s</text></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, id + ".png"));
  } catch (e) { /* no sharp: WAVs only */ }
  rows.push([id, r.check.peak, r.check.rms, r.uncheck.peak, r.uncheck.rms, r.finish.peak, r.finish.rms, r.tail, r.clipped ? "CLIPS" : ""]);
}
console.log(["pack", "check peak", "check rms", "uncheck peak", "uncheck rms", "finale peak", "finale rms", "finale s", ""].join("\t"));
for (const r of rows) console.log(r.join("\t"));
if (JOIN.length) {
  const gap = Buffer.alloc(RATE * 2 * 0.6);
  const parts = []; for (const id of JOIN) { if (!pcmOf[id]) throw new Error("no pack " + id); parts.push(pcmOf[id], gap); }
  fs.writeFileSync(path.join(OUT, "joined.wav"), wav(Buffer.concat(parts))); console.log("joined.wav:", JOIN.join(", "));
}
await browser.close();
