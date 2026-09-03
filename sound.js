// sound.js — v1's wooden-knock and glass-bell engines, parameterised per theme kit,
// with a master volume and optional haptics. Sounds are only ever triggered by local actions.

export function createSound(opts) {
  const get = k => (typeof opts[k] === "function" ? opts[k]() : opts[k]);
  let ac = null, master = null;

  function ctx() {
    if (get("muted")) return null;
    try {
      if (!ac) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ac = new C();
        master = ac.createGain();
        master.connect(ac.destination);
      }
      if (ac.state === "suspended") ac.resume();
      const v = Math.max(0, Math.min(1, get("volume") ?? 1));
      master.gain.value = v * v; // perceptual-ish curve
      return ac;
    } catch (e) { return null; }
  }
  function kit() { return get("kit") || { engine: "knock" }; }
  const P = (k, d) => { const v = kit()[k]; return typeof v === "number" ? v : d; };

  function noiseBurst(c, t, len, curve, filt, freq, gain) {
    const n = c.createBufferSource();
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, curve);
    n.buffer = buf;
    const f = c.createBiquadFilter(); f.type = filt; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = gain;
    n.connect(f); f.connect(g); g.connect(master);
    n.start(t);
  }

  /* wooden knock — each consecutive one pitched up a quarter tone (v1) */
  function woodThunk(step) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime, bend = Math.pow(2, (step || 0) / 24) * P("pitch", 1), dec = P("decay", 1);
    const o = c.createOscillator(), g = c.createGain();
    o.type = kit().tone || "triangle";
    o.frequency.setValueAtTime(195 * bend, t);
    o.frequency.exponentialRampToValueAtTime(58 * bend, t + 0.13 * dec);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.40, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24 * dec);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.26 * dec);
    noiseBurst(c, t, 1600, 5, "lowpass", P("filter", 2600), 0.2 * P("noise", 1));
  }
  function woodUntick() {
    const c = ctx(); if (!c) return; const t = c.currentTime, p = P("pitch", 1);
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(330 * p, t);
    o.frequency.exponentialRampToValueAtTime(148 * p, t + 0.09);
    g.gain.setValueAtTime(0.13, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.12);
  }
  function woodFanfare() {
    const c = ctx(); if (!c) return; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = i === 3 ? "triangle" : "sine";
      o.frequency.value = f * p;
      const t = t0 + i * 0.085;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85 * dec);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.9 * dec);
    });
  }

  /* glass bell — inharmonic partials (v1 pink) */
  function bellHit(step) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime, f0 = 880 * Math.pow(2, (step || 0) / 24) * P("pitch", 1), dec = P("decay", 1);
    [[1, 0.20, 1.15], [2.76, 0.10, 0.78], [5.40, 0.055, 0.46], [8.93, 0.028, 0.30]].forEach(p => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f0 * p[0];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p[1], t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + p[2] * dec);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + p[2] * dec + 0.05);
    });
    noiseBurst(c, t, 2200, 3, "highpass", 5200, 0.11 * P("bright", 1));
  }
  function bellUntick() {
    const c = ctx(); if (!c) return; const t = c.currentTime, p = P("pitch", 1);
    const o = c.createOscillator(), g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(760 * p, t);
    o.frequency.exponentialRampToValueAtTime(300 * p, t + 0.12);
    g.gain.setValueAtTime(0.11, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.16);
  }
  function bellShimmer() {
    const c = ctx(); if (!c) return; const t0 = c.currentTime, p = P("pitch", 1), dec = P("decay", 1);
    [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1568, 1760, 2093].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f * p;
      const t = t0 + i * 0.055;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75 * dec);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.8 * dec);
    });
    [523.25, 659.25, 783.99].forEach(f => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "triangle"; o.frequency.value = f * p;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2 * dec);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 2.3 * dec);
    });
  }

  /* blip — short square tone for the Terminal kit (same wiring as the knock) */
  function blipHit(step) {
    const c = ctx(); if (!c) return;
    const t = c.currentTime, f = 620 * Math.pow(2, (step || 0) / 12);
    const o = c.createOscillator(), g = c.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(f, t);
    o.frequency.setValueAtTime(f * 1.5, t + 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.13);
  }
  function blipUntick() {
    const c = ctx(); if (!c) return; const t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(420, t);
    o.frequency.setValueAtTime(280, t + 0.05);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.11);
  }
  function blipFanfare() {
    const c = ctx(); if (!c) return; const t0 = c.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "square"; o.frequency.value = f;
      const t = t0 + i * 0.07;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.4);
    });
  }

  const engines = {
    knock: { check: woodThunk, uncheck: woodUntick, finish: woodFanfare },
    bell: { check: bellHit, uncheck: bellUntick, finish: bellShimmer },
    blip: { check: blipHit, uncheck: blipUntick, finish: blipFanfare }
  };
  function eng() { return engines[kit().engine] || engines.knock; }

  function buzz(pattern) {
    try { if (get("haptics") !== false && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  return {
    check(step) { eng().check(step); buzz(8); },
    uncheck() { eng().uncheck(); },
    finish() { eng().finish(); buzz([12, 40, 12, 40, 24]); },
    tick() { eng().uncheck(); },
    /** Warm the context up inside a user gesture so the first real sound is not swallowed. */
    prime() { ctx(); }
  };
}
