// packs.js — the sound engines, loaded lazily by sound.js on the first gesture. Each pack has check, uncheck and
// finish, and reads the theme's parameters through P(name, default): pitch, decay, noise, filter, bright, tone.
// Six voices since 1.1 (knock, bell, blip, typewriter, marble, pop) and six more in 1.5 (kalimba, pencil, whistle, bongo,
// cork, arcade); the lists at the bottom are mirrored in theme.js (codes) and panels.js (Settings).
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

/* 1.5: six more voices. A stroke of noise with its own envelope (attack, hold, release) and a filter that can glide —
   the pencil, the eraser, the page, the fizz, the palm on a drum. */
function noiseShape({ c, master }, t, { attack = 0.01, hold = 0.04, release = 0.05, filt = "bandpass", freq = 1500, f1 = 0, q = 1, gain = 0.2 }) {
  const len = attack + hold + release, N = Math.ceil(len * c.sampleRate) + 64;
  const n = c.createBufferSource();
  const buf = c.createBuffer(1, N, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const f = c.createBiquadFilter(); f.type = filt; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + len);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attack); g.gain.setValueAtTime(gain, t + attack + hold); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  n.connect(f); f.connect(g); g.connect(master);
  n.start(t); n.stop(t + len + 0.02);
}

/* kalimba — a thumb-piano tine: a warm fundamental, one high partial that dies first, the thumb's tick. Check-offs
   climb a major pentatonic scale; the finale rolls up it and lands on a chord. */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
function tine(env, t, f, gain, dec) {
  tone(env, { f0: f, t, attack: 0.003, peak: 0.26 * gain, len: 0.9 * dec });
  tone(env, { f0: f * 5.4, t, attack: 0.002, peak: 0.055 * gain, len: 0.18 * dec });
  tone(env, { type: "triangle", f0: f * 2.01, t, attack: 0.003, peak: 0.04 * gain, len: 0.35 * dec });
  noiseBurst(env, t, 180, 6, "highpass", 3000, 0.06 * gain);
}
const kalimba = {
  check(env, step) { const { c, P } = env; tine(env, c.currentTime, 392 * Math.pow(2, PENTA[(step || 0) % PENTA.length] / 12) * P("pitch", 1), 1, P("decay", 1)); },
  uncheck(env) { const { c, P } = env; tine(env, c.currentTime, 294 * P("pitch", 1), 0.35, 0.6 * P("decay", 1)); },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    [0, 2, 4, 7, 9, 12, 14, 16].forEach((s, i) => tine(env, t0 + i * 0.07, 392 * Math.pow(2, s / 12) * p, 0.45, dec));
    [0, 7, 12, 16].forEach(s => tine(env, t0 + 0.64, 196 * Math.pow(2, s / 12) * p, 0.3, 1.7 * dec));
  }
};

/* pencil — a check mark drawn on paper: a short stroke down, a longer stroke up; unchecking rubs it out with an
   eraser; the finale tears the page off the pad. */
function stroke(env, t, hold, freq, gain, p) {
  noiseShape(env, t, { attack: 0.012, hold, release: 0.03, filt: "bandpass", freq: freq * p, f1: freq * 0.7 * p, q: 0.8, gain });
  noiseShape(env, t, { attack: 0.004, hold: 0.01, release: 0.02, filt: "highpass", freq: 4000 * p, gain: gain * 0.5 }); // the tip landing
}
const pencil = {
  check(env, step) {
    const { c, P } = env; const t = c.currentTime, p = P("pitch", 1), n = P("noise", 1), wob = 1 + (((step || 0) * 5) % 4) * 0.03;
    stroke(env, t, 0.05, 2400 * wob, 0.30 * n, p);
    stroke(env, t + 0.10, 0.11, 2000 * wob, 0.36 * n, p);
  },
  uncheck(env) {
    const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
    for (let i = 0; i < 3; i++) noiseShape(env, t + i * 0.085, { attack: 0.02, hold: 0.03, release: 0.03, filt: "lowpass", freq: 1200 * p, q: 0.7, gain: 0.26 - i * 0.04 });
  },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1);
    stroke(env, t0, 0.05, 2400, 0.30, p); stroke(env, t0 + 0.10, 0.11, 2000, 0.36, p);                                                        // the last mark
    noiseShape(env, t0 + 0.42, { attack: 0.03, hold: 0.30, release: 0.10, filt: "bandpass", freq: 900 * p, f1: 3200 * p, q: 0.5, gain: 0.36 }); // the page coming off the pad
    for (let i = 0; i < 9; i++) noiseShape(env, t0 + 0.44 + i * 0.038, { attack: 0.003, hold: 0.004, release: 0.012, filt: "highpass", freq: (2500 + i * 300) * p, gain: 0.18 }); // tooth by tooth
    noiseShape(env, t0 + 0.92, { attack: 0.02, hold: 0.06, release: 0.16, filt: "lowpass", freq: 700 * p, q: 0.6, gain: 0.3 });               // the sheet settling
  }
};

/* whistle — someone whistling: a sine with a little vibrato and breath, sliding up for a check-off and down for an
   uncheck; the finale is a short tune with the last note bent up. */
function whistle(env, t, f0, f1, len, gain, glide) {
  const { c, master } = env;
  const o = c.createOscillator(), g = c.createGain();
  o.type = "sine"; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + glide);
  const lfo = c.createOscillator(), depth = c.createGain(); lfo.frequency.value = 5.5; depth.gain.value = f1 * 0.012; lfo.connect(depth); depth.connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.03); g.gain.setValueAtTime(gain, t + len - 0.06); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + len + 0.02); lfo.start(t); lfo.stop(t + len + 0.02);
  noiseShape(env, t, { attack: 0.03, hold: Math.max(0.01, len - 0.08), release: 0.05, filt: "bandpass", freq: (f0 + f1) / 2, q: 3, gain: gain * 0.25 }); // the breath
}
const whistlePack = {
  check(env, step) { const { c, P } = env; const p = Math.pow(2, ((step || 0) % 5) / 12) * P("pitch", 1); whistle(env, c.currentTime, 1046 * p, 1568 * p, 0.22, 0.16, 0.12); },
  uncheck(env) { const { c, P } = env; const p = P("pitch", 1); whistle(env, c.currentTime, 1318 * p, 880 * p, 0.24, 0.13, 0.16); },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1);
    [[1046, 1046, 0.16], [1318, 1318, 0.16], [1568, 1568, 0.16], [1318, 1318, 0.16], [1568, 2093, 0.55]].forEach(([a, b, len], i) => whistle(env, t0 + i * 0.19, a * p, b * p, len, 0.15, len * 0.5));
  }
};

/* bongo — a hand drum: the skin's note drops as it settles, the palm slaps on top; check-offs alternate the high and
   the low drum; the finale is a quick fill and one open hit with both hands. */
function drum(env, t, f, gain, dec, open) {
  tone(env, { f0: f * 1.7, f1: f, t, attack: 0.002, peak: 0.29 * gain, len: (open ? 0.32 : 0.16) * dec, bend: 0.035 });
  tone(env, { type: "triangle", f0: f * 2.9, f1: f * 2.2, t, attack: 0.001, peak: 0.08 * gain, len: 0.06, bend: 0.02 });
  noiseShape(env, t, { attack: 0.002, hold: 0.008, release: 0.03, filt: "bandpass", freq: 2200, q: 0.7, gain: 0.22 * gain }); // the palm
}
const bongo = {
  check(env, step) { const { c, P } = env; drum(env, c.currentTime, ((step || 0) % 2 === 0 ? 330 : 215) * P("pitch", 1), 1, P("decay", 1), true); },
  uncheck(env) { const { c, P } = env; drum(env, c.currentTime, 180 * P("pitch", 1), 0.4, 0.6 * P("decay", 1), false); },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    [[0, 330, 0.7], [0.11, 215, 0.7], [0.22, 330, 0.8], [0.30, 330, 0.6], [0.38, 215, 0.8], [0.46, 330, 0.7], [0.52, 215, 0.6], [0.58, 330, 0.9]].forEach(([dt, f, g]) => drum(env, t0 + dt, f * p, g * 0.6, dec, false));
    drum(env, t0 + 0.72, 215 * p, 0.7, 1.6 * dec, true); drum(env, t0 + 0.72, 330 * p, 0.5, 1.4 * dec, true);
  }
};

/* cork — a cork eased out of a bottle: the little pop and the bottle's hollow note; unchecking pushes it back in; the
   finale pops it properly, fizzes, pours, and clinks two glasses. */
function corkPop(env, t, gain, p, dec) {
  tone(env, { f0: 620 * p, f1: 240 * p, t, attack: 0.002, peak: 0.36 * gain, len: 0.09 * dec, bend: 0.025 });
  tone(env, { f0: 165 * p, t: t + 0.01, attack: 0.004, peak: 0.22 * gain, len: 0.16 * dec });
  noiseShape(env, t, { attack: 0.002, hold: 0.006, release: 0.03, filt: "bandpass", freq: 1500 * p, q: 1.2, gain: 0.25 * gain });
}
function glug(env, t, f, gain) { tone(env, { f0: f, f1: f * 1.6, t, attack: 0.006, peak: 0.16 * gain, len: 0.11, bend: 0.06 }); }
const cork = {
  check(env, step) { const { c, P } = env; corkPop(env, c.currentTime, 1, Math.pow(2, ((step || 0) % 3) / 24) * P("pitch", 1), P("decay", 1)); },
  uncheck(env) {
    const { c, P } = env; const t = c.currentTime, p = P("pitch", 1);
    tone(env, { f0: 300 * p, f1: 150 * p, t, attack: 0.004, peak: 0.13, len: 0.08, bend: 0.04 });
    noiseShape(env, t, { attack: 0.004, hold: 0.02, release: 0.04, filt: "lowpass", freq: 900 * p, gain: 0.14 });
  },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    corkPop(env, t0, 1.0, p * 0.9, 1.2 * dec);
    noiseShape(env, t0 + 0.03, { attack: 0.02, hold: 0.5, release: 0.9, filt: "highpass", freq: 5000 * p, q: 0.5, gain: 0.09 });  // the fizz
    [150, 160, 175, 190, 205].forEach((f, i) => glug(env, t0 + 0.45 + i * 0.15, f * p, 1 - i * 0.08));                          // the pour
    [[2640, 0.12], [3520, 0.07], [5280, 0.04]].forEach(([f, g]) => { tone(env, { f0: f * p, t: t0 + 1.3, attack: 0.002, peak: g, len: 0.9 * dec }); tone(env, { f0: f * 1.01 * p, t: t0 + 1.36, attack: 0.002, peak: g * 0.8, len: 0.9 * dec }); }); // two glasses
  }
};

/* arcade — a coin machine: the two-note coin, a hurt blip for an uncheck, the level-clear jingle at the end. */
function chip(env, t, f, len, gain, type) {
  const { c, master } = env; const o = c.createOscillator(), g = c.createGain();
  o.type = type || "square"; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.003); g.gain.setValueAtTime(gain, t + Math.max(0.004, len - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + len + 0.02);
}
const arcade = {
  check(env, step) {
    const { c, P } = env; const t = c.currentTime, p = Math.pow(2, ((step || 0) % 4) / 12) * P("pitch", 1);
    chip(env, t, 988 * p, 0.07, 0.075); tone(env, { type: "square", f0: 1319 * p, t: t + 0.07, attack: 0.003, peak: 0.075, len: 0.5 * P("decay", 1) }); // the coin: B5, then E6 ringing down
  },
  uncheck(env) { const { c, P } = env; const t = c.currentTime, p = P("pitch", 1); chip(env, t, 440 * p, 0.08, 0.07); chip(env, t + 0.08, 330 * p, 0.14, 0.07); },
  finish(env) {
    const { c, P } = env; const t0 = c.currentTime, p = P("pitch", 1);
    [523, 659, 784, 1047, 659, 784, 1047, 1319, 784, 1047, 1319, 1568].forEach((f, i) => chip(env, t0 + i * 0.055, f * p, 0.06, 0.06));
    [1047, 1319, 1568, 2093].forEach((f, i) => tone(env, { type: i === 3 ? "triangle" : "square", f0: f * p, t: t0 + 0.7, attack: 0.005, peak: 0.035, len: 0.9 })); // the chord, ringing down
  }
};

export const PACKS = { knock, bell, blip, typewriter, marble, pop: popPack, kalimba, pencil, whistle: whistlePack, bongo, cork, arcade };
export const PACK_NAMES = { knock: "Knock", bell: "Bell", blip: "Blip", typewriter: "Typewriter", marble: "Marble", pop: "Pop", kalimba: "Kalimba", pencil: "Pencil", whistle: "Whistle", bongo: "Bongo", cork: "Cork", arcade: "Arcade" };
export const PACK_ORDER = ["knock", "bell", "blip", "typewriter", "marble", "pop", "kalimba", "pencil", "whistle", "bongo", "cork", "arcade"];
