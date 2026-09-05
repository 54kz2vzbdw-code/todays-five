// packs.js — the sound engines, loaded lazily by sound.js on the first gesture. Each pack has check, uncheck and
// finish, and reads the theme's parameters through P(name, default): pitch, decay, noise, filter, bright, tone.
// env = { c: AudioContext, master: GainNode, kit, P }.

function noiseBurst({ c, master }, t, len, curve, filt, freq, gain) {
  const n = c.createBufferSource();
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, curve);
  n.buffer = buf;
  const f = c.createBiquadFilter(); f.type = filt; f.frequency.value = freq;
  const g = c.createGain(); g.gain.value = gain;
  n.connect(f); f.connect(g); g.connect(master);
  n.start(t);
}
function tone({ c, master }, { type = "sine", f0, f1, t, attack = 0.004, peak = 0.2, len = 0.2, bend = 0, curve = 1 }) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + (bend || len * 0.6));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len * curve);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + len * curve + 0.05);
}

/* wooden knock — each consecutive one pitched up a quarter tone (v1) */
const knock = {
  check(env, step) {
    const { c, kit, P } = env; const t = c.currentTime, bend = Math.pow(2, (step || 0) / 24) * P("pitch", 1), dec = P("decay", 1);
    tone(env, { type: kit.tone || "triangle", f0: 195 * bend, f1: 58 * bend, t, attack: 0.006, peak: 0.40, len: 0.24 * dec, bend: 0.13 * dec });
    noiseBurst(env, t, 1600, 5, "lowpass", P("filter", 2600), 0.2 * P("noise", 1));
  },
  uncheck(env) { const { c, P } = env; const t = c.currentTime, p = P("pitch", 1); tone(env, { f0: 330 * p, f1: 148 * p, t, attack: 0.002, peak: 0.13, len: 0.11, bend: 0.09 }); },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => tone(env, { type: i === 3 ? "triangle" : "sine", f0: f * p, t: t0 + i * 0.085, attack: 0.02, peak: 0.22, len: 0.85 * dec }));
  }
};

/* glass bell — inharmonic partials (v1 pink) */
const bell = {
  check(env, step) {
    const { c, P } = env; const t = c.currentTime, f0 = 880 * Math.pow(2, (step || 0) / 24) * P("pitch", 1), dec = P("decay", 1);
    [[1, 0.20, 1.15], [2.76, 0.10, 0.78], [5.40, 0.055, 0.46], [8.93, 0.028, 0.30]].forEach(p => tone(env, { f0: f0 * p[0], t, attack: 0.004, peak: p[1], len: p[2] * dec }));
    noiseBurst(env, t, 2200, 3, "highpass", 5200, 0.11 * P("bright", 1));
  },
  uncheck(env) { const { c, P } = env; const t = c.currentTime, p = P("pitch", 1); tone(env, { f0: 760 * p, f1: 300 * p, t, attack: 0.002, peak: 0.11, len: 0.14, bend: 0.12 }); },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1568, 1760, 2093].forEach((f, i) => tone(env, { f0: f * p, t: t0 + i * 0.055, attack: 0.012, peak: 0.13, len: 0.75 * dec }));
    [523.25, 659.25, 783.99].forEach(f => tone(env, { type: "triangle", f0: f * p, t: t0, attack: 0.25, peak: 0.07, len: 2.2 * dec }));
  }
};

/* blip — short square tone for the Terminal kit */
const blip = {
  check(env, step) {
    const { c } = env; const t = c.currentTime, f = 620 * Math.pow(2, (step || 0) / 12);
    const o = c.createOscillator(), g = c.createGain();
    o.type = "square"; o.frequency.setValueAtTime(f, t); o.frequency.setValueAtTime(f * 1.5, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(env.master); o.start(t); o.stop(t + 0.13);
  },
  uncheck(env) {
    const { c } = env; const t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "square"; o.frequency.setValueAtTime(420, t); o.frequency.setValueAtTime(280, t + 0.05);
    g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(env.master); o.start(t); o.stop(t + 0.11);
  },
  finish(env) {
    const { c } = env; const t0 = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(env, { type: "square", f0: f, t: t0 + i * 0.07, attack: 0.01, peak: 0.09, len: 0.35 }));
  }
};

/* typewriter — a key strike: the type bar hitting the platen (a click, a thud of the carriage), each key a hair
   different; the finale is the carriage return: bell, the zip of the carriage, the clunk at the margin. */
const typewriter = {
  check(env, step) {
    const { c, P } = env; const t = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    const wob = 1 + (((step || 0) * 7) % 5) * 0.02;
    noiseBurst(env, t, 700, 6, "highpass", 2800 * p, 0.35 * P("noise", 1));          // the strike
    tone(env, { type: "sine", f0: 170 * p * wob, f1: 80 * p, t: t + 0.004, attack: 0.002, peak: 0.28, len: 0.07 * dec, bend: 0.05 });   // the platen
    noiseBurst(env, t + 0.03, 500, 8, "bandpass", 1200 * p, 0.12);                   // the key coming back up
  },
  uncheck(env) {
    const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
    noiseBurst(env, t, 900, 5, "bandpass", 900 * p, 0.22);                            // the space bar: softer, lower
    tone(env, { f0: 120 * p, f1: 70 * p, t, attack: 0.002, peak: 0.12, len: 0.06, bend: 0.04 });
  },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    tone(env, { f0: 2350 * p, t: t0, attack: 0.003, peak: 0.16, len: 0.9 * dec });     // the margin bell
    tone(env, { f0: 2350 * 2.7 * p, t: t0, attack: 0.003, peak: 0.05, len: 0.4 * dec });
    // the carriage zipping back: a run of little clicks, quickening
    for (let i = 0; i < 14; i++) { const dt = 0.12 + i * i * 0.0022; noiseBurst(env, t0 + dt, 260, 4, "bandpass", (1500 + i * 120) * p, 0.10); }
    noiseBurst(env, t0 + 0.62, 1400, 4, "lowpass", 900 * p, 0.32);                     // the clunk at the margin
    tone(env, { f0: 110 * p, f1: 60 * p, t: t0 + 0.62, attack: 0.003, peak: 0.25, len: 0.12, bend: 0.06 });
  }
};

/* marble — a glass marble dropped on wood: a bright tick, a wooden tock, two smaller bounces. */
function marbleDrop(env, t, gain, p, dec) {
  tone(env, { f0: 2600 * p, f1: 2100 * p, t, attack: 0.001, peak: 0.16 * gain, len: 0.05, bend: 0.03 });                  // glass
  tone(env, { type: "triangle", f0: 240 * p, f1: 95 * p, t: t + 0.003, attack: 0.002, peak: 0.34 * gain, len: 0.11 * dec, bend: 0.06 }); // wood
  noiseBurst(env, t, 500, 7, "lowpass", 3200 * p, 0.14 * gain);
}
const marble = {
  check(env, step) {
    const { c, P } = env; const t = c.currentTime, p = Math.pow(2, (step || 0) / 36) * P("pitch", 1), dec = P("decay", 1);
    marbleDrop(env, t, 1, p, dec);
    marbleDrop(env, t + 0.13 * dec, 0.45, p * 1.04, dec);
    marbleDrop(env, t + 0.21 * dec, 0.2, p * 1.08, dec);
  },
  uncheck(env) { const { c, P } = env; marbleDrop(env, c.currentTime, 0.4, 0.8 * P("pitch", 1), 1); },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    const steps = [0, 2, 4, 5, 7, 9, 11, 12];
    steps.forEach((s, i) => { const t = t0 + i * 0.09; const pp = p * Math.pow(2, s / 12); marbleDrop(env, t, 0.9, pp, dec); marbleDrop(env, t + 0.05, 0.3, pp * 1.03, dec); });
    tone(env, { type: "triangle", f0: 130 * p, t: t0 + 0.75, attack: 0.02, peak: 0.2, len: 0.8 * dec });
  }
};

/* pop — a soft bubble: a quick upward sweep with a breath of noise; the finale fizzes. */
function pop(env, t, f, gain, len) {
  tone(env, { f0: f, f1: f * 2.6, t, attack: 0.003, peak: 0.3 * gain, len, bend: len * 0.45 });
  noiseBurst(env, t, 300, 6, "bandpass", f * 3, 0.08 * gain);
}
const popPack = {
  check(env, step) { const { c, P } = env; pop(env, c.currentTime, 320 * Math.pow(2, (step || 0) / 24) * P("pitch", 1), 1, 0.09 * P("decay", 1)); },
  uncheck(env) { const { c, P } = env; const t = c.currentTime, p = P("pitch", 1); tone(env, { f0: 700 * p, f1: 300 * p, t, attack: 0.003, peak: 0.16, len: 0.09, bend: 0.06 }); },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1);
    for (let i = 0; i < 12; i++) pop(env, t0 + i * 0.055 + (i % 3) * 0.008, (300 + i * 55) * p, 0.7 + (i % 2) * 0.3, 0.08);
    tone(env, { f0: 520 * p, f1: 1040 * p, t: t0 + 0.55, attack: 0.02, peak: 0.12, len: 0.5, bend: 0.3 });
  }
};

export const PACKS = { knock, bell, blip, typewriter, marble, pop: popPack };
export const PACK_NAMES = { knock: "Knock", bell: "Bell", blip: "Blip", typewriter: "Typewriter", marble: "Marble", pop: "Pop" };
export const PACK_ORDER = ["knock", "bell", "blip", "typewriter", "marble", "pop"];
