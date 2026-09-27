// motion.js — how things move (1.12 motion-1). Fetched at idle after first paint, or on the first press on a line,
// whichever comes first; never at first paint. Pinned to the page's build like panels.js (COMPATIBILITY.md §6).
//
// Round one holds three things, and later rounds (the materials, the menus, the unseal) build on them:
//  · spring(stiffness, damping) — a spring solved once into a CSS linear() easing and the time it takes to settle. A
//    moving thing is then an ordinary compositor animation with real physics, and nothing runs a frame loop.
//  · SPRINGS — the few the app names. Round one: `finish` (the ink landing when a drawn strike commits) and `retract`
//    (the ink pulling back when the finger lets go early). Critically damped or over: a strike never overshoots its line.
//  · draw(li) — the ink under a finger. app.js measures the lines (layoutStrikes) and owns the check-off; this only
//    moves the ink that is already there, and says how much of the line is struck.
//
// A strike is one `.ink` per rendered line. A flat ink grows with scaleX, as a tapped strike always has. An ink with a
// texture — a gradient (Pink, Blush, Sunset, the Secret pair) or a mask (the Extra kits) — would squash under a scale,
// so while it is being drawn it is shown whole and revealed with a clip instead. Either way the inline styles this
// module sets are gone when it finishes, so a struck row at rest is exactly what a tap leaves.

const RM = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
const LINEAR = typeof CSS !== "undefined" && CSS.supports && CSS.supports("transition-timing-function", "linear(0, 1)");

/** A damped spring from 0 to 1 at unit mass: { easing, duration } for Element.animate or a CSS transition. */
export function spring(stiffness, damping) {
  let x = 0, v = 0, t = 0; const dt = 1 / 600, xs = [];
  while (t < 3) {
    v += (-stiffness * (x - 1) - damping * v) * dt; x += v * dt; t += dt; xs.push(x);
    if (t > 0.03 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
  }
  const n = 32, pts = [];
  for (let i = 0; i <= n; i++) pts.push(+xs[Math.min(xs.length - 1, Math.round(i / n * (xs.length - 1)))].toFixed(4));
  pts[0] = 0; pts[n] = 1;
  return { easing: LINEAR ? `linear(${pts.join(",")})` : "cubic-bezier(.22,1,.36,1)", duration: Math.round(t * 1000) };
}

export const SPRINGS = {
  finish: spring(900, 60),   // ζ 1.0: lands in ~180 ms, inside the check-off's own sound
  retract: spring(420, 44)   // ζ 1.07: back to nothing in ~300 ms, no bounce past the line's start
};

const px = s => parseFloat(s) || 0;
const textured = cs => (cs.backgroundImage && cs.backgroundImage !== "none") || (cs.maskImage && cs.maskImage !== "none") || (cs.webkitMaskImage && cs.webkitMaskImage !== "none");
const clipAt = p => `inset(-80% ${((1 - p) * 100).toFixed(3)}% -80% 0)`;

/** Start drawing on a row. Returns null when the row has no measured lines (app.js lays them out first). */
export function draw(li) {
  const inks = Array.from(li.querySelectorAll(".lines .ink"));
  if (!inks.length) return null;
  const lines = inks.map(el => {
    const clip = textured(getComputedStyle(el));
    el.getAnimations().forEach(a => a.cancel());
    el.style.transition = "none";
    el.style.opacity = "1"; // an Extra kit fades an unstruck ink out (--strike-exit-op); a line being drawn is on its way in
    if (clip) { el.style.transform = "scaleX(1)"; el.style.clipPath = clipAt(0); }
    else el.style.transform = "scaleX(0)";
    return { el, clip, left: px(el.style.left), width: Math.max(1, px(el.style.width)), p: 0 };
  });
  const total = lines.reduce((s, l) => s + l.width, 0);
  const longest = lines.reduce((a, l) => (l.width > a.width ? l : a), lines[0]);
  const set = (l, p) => { l.p = p; if (l.clip) l.el.style.clipPath = clipAt(p); else l.el.style.transform = `scaleX(${p})`; };
  // a textured ink is held whole for as long as it animates: underneath, an unstruck row's ink is at scaleX(0)
  const frame = (l, p) => (l.clip ? { clipPath: clipAt(p), transform: "scaleX(1)", opacity: 1 } : { transform: `scaleX(${p})`, opacity: 1 });
  let settled = false;
  const clean = l => { l.el.style.transform = ""; l.el.style.clipPath = ""; l.el.style.opacity = ""; };
  const release = l => { l.el.style.transition = ""; };
  /** Animate every line to `to`, then leave the ink to the stylesheet (whose state is already the end state underneath). */
  const go = (to, sp) => {
    if (settled) return Promise.resolve(); settled = true;
    const runs = lines.map(l => {
      const from = l.p;
      clean(l);                                 // the stylesheet's own state is underneath from here on
      if (RM.matches || from === to) { release(l); return Promise.resolve(); }
      const a = l.el.animate([frame(l, from), frame(l, to)], { duration: sp.duration, easing: sp.easing });
      return a.finished.then(() => release(l), () => release(l));
    });
    return Promise.all(runs).then(() => {});
  };
  return {
    /** The finger is at `x`, in the row's own coordinates: every line is struck up to it at once. */
    to(x) { if (settled) return; for (const l of lines) set(l, Math.max(0, Math.min(1, (x - l.left) / l.width))); },
    /** How much of the longest line is struck (the commit rule), and how much of all of it (for the scratch). */
    progress() { return longest.p; },
    covered() { return lines.reduce((s, l) => s + l.width * l.p, 0) / total; },
    /** The strike commits: call after the row has its `done` class, so the stylesheet underneath is already struck. */
    finish() { return go(1, SPRINGS.finish); },
    /** The finger let go early: the ink pulls back and the row is as it was. */
    retract() { return go(0, SPRINGS.retract); },
    /** Something else took the row (a render, a cancel): drop the ink where the stylesheet says, now. */
    cancel() { if (settled) return; settled = true; for (const l of lines) { clean(l); release(l); } }
  };
}
