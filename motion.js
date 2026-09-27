// motion.js — how things move (1.12 b279). Fetched at idle after first paint, or on the first press on a line,
// whichever comes first; never at first paint. Pinned to the page's build like panels.js (COMPATIBILITY.md §6).
//
// Round one holds three things, and later rounds (the materials, the menus, the unseal) build on them:
//  · spring(stiffness, damping) — a spring solved once into a CSS linear() easing and the time it takes to settle. A
//    moving thing is then an ordinary compositor animation with real physics, and nothing runs a frame loop.
//  · SPRINGS — the few the app names. Round one: `settle`, the ink pulling back into a single line.
//  · draw(li) — the ink under a finger. app.js measures the lines (layoutStrikes) and owns the check-off; this only
//    moves the ink that is already there, and says how much of the stroke is drawn.
//
// A strike wraps the way the words do: one stroke through the text in reading order, across the first line and on
// from the start of the next (Price's call, after the first cut struck every line at once like a rake). The finger's
// sweep across the row is the whole stroke, so a line that wraps is crossed off in one pass without the finger having
// to wrap too; the ink runs ahead of the finger on the early lines and meets it on the last.
//
// A flat ink grows with scaleX, as a tapped strike always has. An ink with a texture — a gradient (Pink, Blush, Sunset,
// the Secret pair) or a mask (the Extra kits) — would squash under a scale, so while it is drawn it is shown whole and
// revealed with a clip instead. A kit whose strike is born hot (Char) burns only at the tip while a finger draws and
// cools behind it (extrafx.css reads --hot and --tip); after the lift the tip cools too, and the line is not reheated.
// Every inline style this module sets is gone when it finishes, so a struck row at rest is exactly what a tap leaves.

const RM = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
const LINEAR = typeof CSS !== "undefined" && CSS.supports && CSS.supports("transition-timing-function", "linear(0, 1)");

/** A damped spring from 0 to 1 at unit mass: { easing, duration } for Element.animate or a CSS transition. */
export function spring(stiffness, damping) {
  let x = 0, v = 0, t = 0; const dt = 1 / 600, xs = [];
  while (t < 3) {
    v += (-stiffness * (x - 1) - damping * v) * dt; x += v * dt; t += dt; xs.push(x);
    if (t > 0.03 && Math.abs(x - 1) < 0.004 && Math.abs(v) < 0.08) break; // settled to the eye: a longer tail is time nobody sees
  }
  const n = 32, pts = [];
  for (let i = 0; i <= n; i++) pts.push(+xs[Math.min(xs.length - 1, Math.round(i / n * (xs.length - 1)))].toFixed(4));
  pts[0] = 0; pts[n] = 1;
  return { easing: LINEAR ? `linear(${pts.join(",")})` : "cubic-bezier(.22,1,.36,1)", duration: Math.round(t * 1000) };
}

export const SPRINGS = {
  settle: spring(900, 60) // ζ 1.0: a single line pulled back to nothing in ~275 ms, never past its start
};

/** The one hint a device that knew the old swipe-right menu is shown, once, on its first drawn strike (app.js, showMark). */
export const HINT = "A swipe across a line crosses it off now—hold it for the menu.";

const px = s => parseFloat(s) || 0;
const textured = cs => (cs.backgroundImage && cs.backgroundImage !== "none") || (cs.maskImage && cs.maskImage !== "none") || (cs.webkitMaskImage && cs.webkitMaskImage !== "none");
const clipAt = p => `inset(-80% ${((1 - p) * 100).toFixed(3)}% -80% 0)`;
const COOL_MS = 900; // how long the tip takes to cool after the lift (Char); the classes go after it

/** Start drawing on a row. Returns null when the row has no measured lines (app.js lays them out first). */
export function draw(li) {
  const inks = Array.from(li.querySelectorAll(".lines .ink"));
  if (!inks.length) return null;
  const box = li.querySelector(".lines");
  let acc = 0;
  const lines = inks.map(el => {
    const clip = textured(getComputedStyle(el));
    el.getAnimations().forEach(a => a.cancel());
    el.style.transition = "none";
    el.style.opacity = "1"; // an Extra kit fades an unstruck ink out (--strike-exit-op); a line being drawn is on its way in
    if (clip) { el.style.transform = "scaleX(1)"; el.style.clipPath = clipAt(0); } else el.style.transform = "scaleX(0)";
    const width = Math.max(1, px(el.style.width)), l = { el, clip, left: px(el.style.left), width, from: acc, p: 0 };
    acc += width;
    return l;
  });
  const total = acc;
  // only a strike born hot (Char) has a tip to cool after the lift; every other kit is tidied the moment its ink settles
  const hot = lines.some(l => { const a = getComputedStyle(l.el, "::after"); return a.content !== "none" && ((a.backgroundImage && a.backgroundImage !== "none") || (a.backgroundColor && a.backgroundColor !== "rgba(0, 0, 0, 0)" && a.backgroundColor !== "transparent")); });
  const start = Math.min(...lines.map(l => l.left)), sweep = Math.max(1, Math.max(...lines.map(l => l.left + l.width)) - start);
  li.classList.add("drawing");
  box.style.setProperty("--burn", "0"); // a strike drawn by hand is cooled behind the finger: the check-off must not reheat it
  let P = 0, settled = false;
  const set = (l, p) => { l.p = p; if (l.clip) l.el.style.clipPath = clipAt(p); else l.el.style.transform = `scaleX(${p})`; };
  const heat = () => { // only the line the tip is on is hot, and only near the tip; nothing reads this but a hot kit
    const at = total * P;
    const tip = P > 0 && P < 1 ? lines.find(l => at >= l.from && at <= l.from + l.width) : null;
    for (const l of lines) {
      l.el.style.setProperty("--hot", l === tip ? "1" : "0");
      if (l === tip) l.el.style.setProperty("--tip", l.clip ? (l.p * l.width).toFixed(1) + "px" : "100%");
    }
  };
  const put = p => { P = p; const at = total * p; for (const l of lines) set(l, Math.max(0, Math.min(1, (at - l.from) / l.width))); heat(); };
  // a textured ink is held whole for as long as it animates: underneath, an unstruck row's ink is at scaleX(0)
  const frame = (l, p) => (l.clip ? { clipPath: clipAt(p), transform: "scaleX(1)", opacity: 1 } : { transform: `scaleX(${p})`, opacity: 1 });
  const clean = l => { const s = l.el.style; s.transform = ""; s.clipPath = ""; s.opacity = ""; };
  const release = l => { l.el.style.transition = ""; };
  const tidy = () => {
    li.classList.remove("drawing", "cooling"); box.style.removeProperty("--burn");
    for (const l of lines) { l.el.style.removeProperty("--hot"); l.el.style.removeProperty("--tip"); }
  };
  /** Run the ink to `to` (1 lands it, 0 pulls it back) as one stroke through the lines — forwards through them when it
      lands, backwards when it pulls back — in `ms`, the last segment easing out. Each line waits its turn showing
      where it was (fill: backwards); underneath, the stylesheet already holds the end state. */
  const run = (to, ms) => {
    if (settled) return Promise.resolve(); settled = true;
    li.classList.add("cooling");
    const order = to === 1 ? lines : lines.slice().reverse();
    const moving = order.filter(l => l.p !== to);
    const dist = moving.reduce((s, l) => s + Math.abs(to - l.p) * l.width, 0) || 1;
    const runs = []; let t = 0;
    for (const l of lines) clean(l);
    moving.forEach((l, i) => {
      const d = Math.abs(to - l.p) * l.width / dist * ms, last = i === moving.length - 1;
      if (RM.matches || d < 1) return;
      const single = moving.length === 1 && to === 0;
      const sp = single ? SPRINGS.settle : { duration: d, easing: last ? "cubic-bezier(.2,.8,.3,1)" : "linear" };
      runs.push(l.el.animate([frame(l, l.p), frame(l, to)], { duration: sp.duration, easing: sp.easing, delay: t, fill: "backwards" }).finished.catch(() => {}));
      t += d;
    });
    const cooled = hot && !RM.matches ? new Promise(r => setTimeout(r, COOL_MS)) : null;
    return Promise.all(runs).then(() => { for (const l of lines) release(l); return cooled; }).then(tidy);
  };
  return {
    /** The finger is at `x`, in the row's own coordinates: the stroke is drawn that far through the text. */
    to(x) { if (!settled) put(Math.max(0, Math.min(1, (x - start) / sweep))); },
    /** How much of the whole stroke is drawn: the commit rule reads it. */
    progress() { return P; },
    /** The strike commits: call after the row has its `done` class, so the stylesheet underneath is already struck. The
        ink carries on from where the finger left it at the finger's own speed (px/ms), faster for a flick. */
    finish(speed = 1) { const v = Math.max(0.8, Math.min(3.2, speed || 0)); return run(1, Math.max(70, Math.min(240, total * (1 - P) / v))); },
    /** The finger let go early: the stroke pulls back the way it came and the row is as it was. */
    retract() { return run(0, Math.max(140, Math.min(320, total * P / 1.1))); },
    /** Something else took the row (a render, a cancel): drop the ink where the stylesheet says, now. */
    cancel() { if (settled) return; settled = true; for (const l of lines) { clean(l); release(l); } tidy(); }
  };
}
