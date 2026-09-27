import { BUILD } from "./version.js"; // 1.4: the packs a page loads later come from its own build
// sound.js — the audio-context state machine and the sound API. The engines live in packs.js and load on the
// first gesture (sound.prime), so Today's first paint never pays for them. Sounds are triggered by local actions,
// by remote check-offs on a view link, and (opt-in) by remote check-offs on an edit link.
//
// iOS suspends the AudioContext when the app goes to the background and *interrupts* it for calls, Siri and
// other apps' audio; a resume() after an interruption can silently never land. So every tap runs this machine:
//   running                → play
//   not running            → ask for resume() inside the gesture and remember that we asked
//   still not running on the next tap, or closed → close it and make a fresh context inside this gesture
// and the app calls sound.foreground() when the page becomes visible again.

/** The engines that live in packs-secret.js rather than packs.js (1.6). */
export const SECRET_ENGINES = new Set(["sparkle", "party"]);
/** The engines that live in packs-extra.js (1.12 b262: the Extra category). */
export const EXTRA_ENGINES = new Set(["chalk", "marker", "carve", "burn"]); // 1.12 b268: the wood pair's two

/* 1.12: the finale's vibration, on the volley's own rhythm (fx.js `volley()`): seven bursts at i × 65 ms, the
   centre burst at 210 ms inside the fourth, and the chord at 700 ms. navigator.vibrate alternates on/off, so each
   pair below is a buzz and the gap to the next burst. test/sound.test.js derives the same numbers from fx.js. */
export const FINALE_BUZZ = [14, 51, 14, 51, 14, 51, 30, 35, 14, 51, 14, 51, 14, 296, 60];
/* 1.12 b293: the stage the packs play on. A room per material — an impulse response of decaying noise, darker at its
   tail, [wet, seconds] — so Glass rings and Pixel stays dry; each sound placed in stereo where it came from on the
   screen; a limiter in front of the volume, so a check-off landing on a finale's tail never clips; and the day's
   check-offs climbing a major pentatonic, the nth on the nth note, in each engine's own units of pitch (a knock's
   steps are quarter tones, a blip's semitones, a marble's thirds of one). The engines themselves are unchanged. */
export const ROOM = { clean: [0.12, 0.9], ink: [0.1, 0.7], glass: [0.28, 1.8], tide: [0.3, 2.4], candy: [0.18, 1.2], phosphor: [0.04, 0.5], glow: [0.32, 2.8], ember: [0.18, 1.4], pencil: [0.08, 0.6], pixel: [0.03, 0.4] };
export const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
export const PHRASE = { knock: 2, bell: 2, pop: 2, blip: 1, marble: 3 };
export function phrase(engine, step) { return PHRASE[engine] ? PENTA[(step || 0) % PENTA.length] * PHRASE[engine] : step || 0; }
export function createSound(opts) {
  const get = k => (typeof opts[k] === "function" ? opts[k]() : opts[k]);
  const AC = () => (typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)) || opts.AudioContext || null;
  let ac = null, master = null, bus = null, room = null, roomMat = "", pending = false, packs = null, packsMod = null, packsP = null, made = 0;
  let extra = null, extraP = null; // 1.6: the two engines the Secret pair carries, in a module of their own
  let more = null, moreP = null;   // 1.12 b262: the Extra category's engines, in a module of their own

  function fresh() {
    if (ac) { try { ac.close(); } catch (e) { /* ignore */ } }
    const C = AC(); if (!C) return null;
    ac = new C(); made++;
    master = ac.createGain();
    master.connect(ac.destination);
    bus = master; room = null; roomMat = "";
    try { // 1.12 b293: the limiter and the room, where the browser has them (a context without them plays dry, as before)
      let into = master; // what the dry sound and the room's return both feed: the limiter, or the volume itself (never upstream of bus)
      if (ac.createDynamicsCompressor) { const lim = ac.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 3; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12; lim.connect(master); into = lim; }
      bus = ac.createGain(); bus.connect(into);
      if (ac.createConvolver) { room = { conv: ac.createConvolver(), wet: ac.createGain() }; room.wet.gain.value = 0; bus.connect(room.conv); room.conv.connect(room.wet); room.wet.connect(into); }
    } catch (e) { bus = master; room = null; }
    pending = false;
    return ac;
  }
  function askResume() {
    pending = true;
    try {
      const p = ac.resume();
      if (p && p.then) p.then(() => { if (ac && ac.state === "running") pending = false; }, () => {});
    } catch (e) { /* the next tap recreates */ }
  }
  /** The context to play through right now, or null when muted / unavailable. Must be called inside the user's gesture. */
  function ctx() {
    if (get("muted")) return null;
    try {
      if (!ac || ac.state === "closed") { if (!fresh()) return null; }
      if (ac.state !== "running") {
        if (pending) { if (!fresh()) return null; } // we asked last time and it never came back: start over
        if (ac.state !== "running") askResume();
      } else pending = false;
      const v = Math.max(0, Math.min(1, get("volume") ?? 1));
      master.gain.value = v * v; // perceptual-ish curve
      return ac;
    } catch (e) { return null; }
  }
  /** The room for the material that is on, built just after the first sound that wants it (that one plays dry): up to
      2.8 s of noise is not made inside a tap. */
  function roomFor() {
    const m = (opts.mat && get("mat")) || "clean", c = ac, r = room;
    if (!r || m === roomMat) return; roomMat = m;
    setTimeout(() => {
      if (ac !== c || roomMat !== m) return;
      try {
        const [wet, secs] = ROOM[m] || ROOM.clean, n = Math.floor(c.sampleRate * secs), ir = c.createBuffer(2, n, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < n; i++) { const t = i / n; lp += (Math.random() * 2 - 1 - lp) * (0.9 - t * 0.7); d[i] = lp * Math.pow(1 - t, 2.6); } }
        r.conv.buffer = ir; r.wet.gain.setTargetAtTime(wet, c.currentTime, 0.05);
      } catch (e) { /* dry, then */ }
    }, 0);
  }
  /** Where a sound plays into: panned to where it came from on the screen (x, 0 to 1), or straight to the bus. */
  function out(x) {
    if (typeof x !== "number" || !ac.createStereoPanner) return bus || master;
    try { const p = ac.createStereoPanner(); p.pan.value = Math.max(-0.7, Math.min(0.7, (x - 0.5) * 1.3)); p.connect(bus || master); return p; } catch (e) { return bus || master; }
  }
  function kit() {
    const k = get("kit") || { engine: "knock" };
    const override = get("pack");
    return override ? { ...k, engine: override } : k;
  }
  function loadPacks() {
    if (packs || packsP) return packsP;
    packsP = (opts.loadPacks ? opts.loadPacks() : import("./packs.js?v=" + BUILD)).then(m => { packs = m.PACKS; packsMod = m; return packs; }).catch(() => { packsP = null; });
    return packsP;
  }
  /** The Secret pair's engines (1.6), fetched only when a kit that is on asks for one: a device that never unlocked
      never sends the request. They are built from packs.js's own builders, handed over rather than imported. */
  function loadExtra() {
    if (extra || extraP) return extraP;
    extraP = Promise.all([loadPacks(), opts.loadSecret ? opts.loadSecret() : import("./packs-secret.js?v=" + BUILD)])
      .then(([, m]) => { extra = m.create((packsMod && packsMod.HELPERS) || {}); return extra; })
      .catch(() => { extraP = null; });
    return extraP;
  }
  function loadMore() {
    if (more || moreP) return moreP;
    moreP = Promise.all([loadPacks(), opts.loadExtra ? opts.loadExtra() : import("./packs-extra.js?v=" + BUILD)])
      .then(([, m]) => { more = m.create((packsMod && packsMod.HELPERS) || {}); return more; })
      .catch(() => { moreP = null; });
    return moreP;
  }
  function warm(id) { if (SECRET_ENGINES.has(id)) loadExtra(); else if (EXTRA_ENGINES.has(id)) loadMore(); }
  /** The engine an id names, or null when it is one of the Secret pair's and has not arrived yet (the load starts). */
  function engineOf(id) {
    if (SECRET_ENGINES.has(id)) { if (!extra) { loadExtra(); return null; } return extra[id]; }
    if (EXTRA_ENGINES.has(id)) { if (!more) { loadMore(); return null; } return more[id]; }
    return packs[id] || packs.knock;
  }
  function play(fn, step, x) {
    const c = ctx(); if (!c) return false;
    if (!packs) { // 1.7: the very first sound on a cold page plays as soon as the engines land (they used to be dropped), unless that took longer than a beat
      const t0 = Date.now(); const p = loadPacks(); if (p && p.then) p.then(() => { if (packs && Date.now() - t0 < 1500) play(fn, step, x); });
      return false;
    }
    const k = kit();
    const pack = engineOf(k.engine);
    if (!pack) { // 1.8: a Secret kit's engine is in a module of its own; play as soon as it lands, the way 1.7 does for the twelve
      const t0 = Date.now(); const p = EXTRA_ENGINES.has(k.engine) ? loadMore() : loadExtra(); if (p && p.then) p.then(() => { if ((extra || more) && Date.now() - t0 < 1500) play(fn, step, x); });
      return false;
    }
    roomFor();
    try { pack[fn]({ c, master: out(x), kit: k, P: (key, d) => { const v = k[key]; return typeof v === "number" ? v : d; } }, fn === "check" ? phrase(k.engine, step) : step || 0); } catch (e) { return false; }
    return true;
  }
  function buzz(pattern) {
    try { if (get("haptics") !== false && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  return {
    check(step, x) { const ok = play("check", step, x); buzz(8); return ok; },
    uncheck(x) { return play("uncheck", 0, x); },
    // 1.12: the finale follows the volley in fx.js rather than being three anonymous buzzes — seven bursts 65 ms
    // apart (0…390), the centre burst landing inside the fourth (210), and one longer one on the chord at 700.
    // Change fx.js's volley() and this changes with it; test/sound.test.js holds the two together.
    finish() { const ok = play("finish"); buzz(FINALE_BUZZ); return ok; },
    tick() { return play("uncheck"); },
    /** 1.12 b279: the scratch under a drawing finger, for whichever engine is on — { speed(v, x), stop() }, or null when
        muted or before the engines have landed (then the strike is silent, and the check-off still sounds). */
    scratch() { const c = ctx(); if (!c) return null; if (!packsMod) { loadPacks(); return null; } roomFor(); try { return packsMod.scratch({ c, master: bus || master, kit: kit() }); } catch (e) { return null; } },
    /** 1.12 b293: one of the app's own small sounds (packs.js CUES: whoosh, tick, key, unlock), placed at x. With
        `running`, only on a context that is already playing: a cue never makes one (a cold open's unseal has had no tap). */
    cue(name, x, { running = false } = {}) {
      if (get("muted") || (running && !(ac && ac.state === "running"))) return false;
      const c = running ? ac : ctx(); if (!c) return false;
      if (!packsMod) { loadPacks(); return false; }
      const fn = packsMod.CUES && packsMod.CUES[name]; if (!fn) return false;
      const m = (opts.mat && get("mat")) || "", k = kit();
      roomFor();
      try { fn({ c, master: out(x), kit: k, P: (key, d) => d }, m === "phosphor" || m === "pixel"); } catch (e) { return false; }
      return true;
    },
    /** Warm the context up inside a user gesture and start loading the engines, so the first real sound is not swallowed. */
    prime() { ctx(); loadPacks(); warm(kit().engine); },
    /** 1.7: fetch the engines at idle, outside any gesture (no context is made), so the first check-off finds them loaded. */
    preload() { loadPacks(); warm(kit().engine); },
    /** Start fetching an engine's module before it is needed (app.js calls this when a kit that carries one goes on). */
    warm,
    /** Resolves once an engine can play, so a caller that wants to be heard the first time can wait for it. */
    ready(engine) { return Promise.resolve(SECRET_ENGINES.has(engine) ? loadExtra() : EXTRA_ENGINES.has(engine) ? loadMore() : loadPacks()).then(() => {}); },
    /** The page came back to the foreground: ask the context to resume (allowed outside a gesture once one has happened). */
    foreground() { if (ac && ac.state !== "running" && ac.state !== "closed") askResume(); },
    /** Play a pack's check sound regardless of the theme (Settings → Sound preview). */
    preview(engine) { const c = ctx(); if (!c) return false; if (!packs) { loadPacks(); return false; } const k = { ...kit(), engine }; const pack = engineOf(engine); if (!pack) return false; try { pack.check({ c, master, kit: k, P: (key, d) => { const v = k[key]; return typeof v === "number" ? v : d; } }, 0); } catch (e) { return false; } return true; },
    /** Test hook: the state machine's view of the world. */
    state() { return { state: ac ? ac.state : "none", pending, made, packs: !!packs, extra: !!extra }; },
    /** Test hook: do to the live context what iOS does (suspend on background; a dead context after a call). */
    debugContext(what) { if (!ac) return false; try { if (what === "suspend") ac.suspend(); else if (what === "close") ac.close(); } catch (e) { /* ignore */ } return true; }
  };
}
