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

export function createSound(opts) {
  const get = k => (typeof opts[k] === "function" ? opts[k]() : opts[k]);
  const AC = () => (typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)) || opts.AudioContext || null;
  let ac = null, master = null, pending = false, packs = null, packsP = null, made = 0;

  function fresh() {
    if (ac) { try { ac.close(); } catch (e) { /* ignore */ } }
    const C = AC(); if (!C) return null;
    ac = new C(); made++;
    master = ac.createGain();
    master.connect(ac.destination);
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
  function kit() {
    const k = get("kit") || { engine: "knock" };
    const override = get("pack");
    return override ? { ...k, engine: override } : k;
  }
  function loadPacks() {
    if (packs || packsP) return packsP;
    packsP = (opts.loadPacks ? opts.loadPacks() : import("./packs.js")).then(m => { packs = m.PACKS; return packs; }).catch(() => { packsP = null; });
    return packsP;
  }
  function play(fn, step) {
    const c = ctx(); if (!c) return false;
    if (!packs) { loadPacks(); return false; } // the very first sound on a cold page arrives a moment late; nothing else is lost
    const k = kit();
    const pack = packs[k.engine] || packs.knock;
    try { pack[fn]({ c, master, kit: k, P: (key, d) => { const v = k[key]; return typeof v === "number" ? v : d; } }, step || 0); } catch (e) { return false; }
    return true;
  }
  function buzz(pattern) {
    try { if (get("haptics") !== false && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }

  return {
    check(step) { const ok = play("check", step); buzz(8); return ok; },
    uncheck() { return play("uncheck"); },
    finish() { const ok = play("finish"); buzz([12, 40, 12, 40, 24]); return ok; },
    tick() { return play("uncheck"); },
    /** Warm the context up inside a user gesture and start loading the engines, so the first real sound is not swallowed. */
    prime() { ctx(); loadPacks(); },
    /** The page came back to the foreground: ask the context to resume (allowed outside a gesture once one has happened). */
    foreground() { if (ac && ac.state !== "running" && ac.state !== "closed") askResume(); },
    /** Play a pack's check sound regardless of the theme (Settings → Sound preview). */
    preview(engine) { const c = ctx(); if (!c) return false; if (!packs) { loadPacks(); return false; } const k = { ...kit(), engine }; const pack = packs[engine] || packs.knock; try { pack.check({ c, master, kit: k, P: (key, d) => { const v = k[key]; return typeof v === "number" ? v : d; } }, 0); } catch (e) { return false; } return true; },
    /** Test hook: the state machine's view of the world. */
    state() { return { state: ac ? ac.state : "none", pending, made, packs: !!packs }; }
  };
}
