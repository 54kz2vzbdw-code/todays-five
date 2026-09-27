// motion.js — how things move (1.12 b279). Fetched at idle after first paint, or on the first press on a line,
// whichever comes first; never at first paint. Pinned to the page's build like panels.js (COMPATIBILITY.md §6).
//
// Round one holds three things, and the materials round (1.12 b293, below them) builds on them:
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
  const stepped = document.documentElement.dataset.mat === "pixel"; // 1.12 b293: Arcade's ink is drawn in tenths, like its tap
  const lines = inks.map(el => {
    const clip = textured(getComputedStyle(el)) || el.classList.contains("scr"); // 1.12 b293: Sketch's scribble is revealed, never stretched
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
  const set = (l, p) => { l.p = p; if (stepped) p = Math.round(p * 10) / 10; if (l.clip) l.el.style.clipPath = clipAt(p); else l.el.style.transform = `scaleX(${p})`; };
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
  const frame = (l, p) => { if (stepped) p = Math.round(p * 10) / 10; return l.clip ? { clipPath: clipAt(p), transform: "scaleX(1)", opacity: 1 } : { transform: `scaleX(${p})`, opacity: 1 }; };
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
      const sp = stepped ? { duration: Math.max(90, d), easing: `steps(${Math.max(2, Math.round(Math.abs(to - l.p) * 10))},end)` }
        : single ? SPRINGS.settle : { duration: d, easing: last ? "cubic-bezier(.2,.8,.3,1)" : "linear" };
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

/* ======================= 1.12 b293: the materials =======================
   Everything else the redesign moves, it moves by the kit's material (theme.js MATERIALS, carried as html[data-mat]):
   a spring for what travels (move), one for what settles into place (snap), one for what pops (pop), and a tempo.
   Pixel has no springs: it moves in steps. app.js and panels.js make each change first and hand the moving to this
   module, so nothing here touches the list, and whatever it adds to the page it takes away again. Under reduced
   motion each function returns at once and the change is simply there. */

/** [move, snap, pop] as stiffness and damping, then the tempo. */
const MAT = {
  clean: [220, 26, 420, 34, 380, 18, 0.9], ink: [150, 19, 260, 22, 330, 13, 1], glass: [260, 24, 520, 38, 420, 16, 0.85],
  tide: [110, 17, 200, 20, 240, 12, 1.2], candy: [240, 14, 380, 16, 420, 10, 0.95], phosphor: [380, 36, 640, 46, 520, 19, 0.72],
  glow: [170, 20, 300, 26, 300, 14, 1.1], ember: [200, 22, 360, 30, 360, 15, 1], pencil: [180, 21, 300, 25, 340, 14, 1]
};
const felt = {};
const matNow = () => document.documentElement.dataset.mat || "clean";
/** How the material that is on moves: { mat, move, snap, pop, tempo, stepped }. The Extra pairs move as Clean does. */
export function feel(mat = matNow()) {
  if (felt[mat]) return felt[mat];
  const m = mat === "pixel" ? null : MAT[mat] || MAT.clean;
  return (felt[mat] = m
    ? { mat, move: spring(m[0], m[1]), snap: spring(m[2], m[3]), pop: spring(m[4], m[5]), tempo: m[6], stepped: false }
    : { mat, move: { duration: 300, easing: "steps(6,end)" }, snap: { duration: 200, easing: "steps(4,end)" }, pop: { duration: 320, easing: "steps(5,end)" }, tempo: 0.8, stepped: true });
}
const run = (el, kf, o) => el.animate(kf, o);
const after = (a, fn) => (a ? a.finished.then(fn, fn) : fn());

/* ---------------- particles fx.js does not draw ----------------
   Pixels on a 3 px grid, glass shards, rising sparks and bubbles: one fx.scene per burst, over when the last one is off
   the screen. The endings throw them (finale.js is handed `emit`), and so does a line its material erases. */
const PARTICLE = { pixel: 1, shard: 1, spark: 1, bubble: 1 };
function particles(fx, kind, x, y, n, power, spread, pal) {
  const ps = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * spread, sp = power * (0.55 + Math.random() * 0.8);
    ps.push({ x, y, vx: Math.cos(a) * sp + (Math.random() - 0.5) * 1.3, vy: Math.sin(a) * sp, s: 3 + Math.random() * 4, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 0.3,
      c: pal[(Math.random() * pal.length) | 0], life: 1, dec: 0.008 + Math.random() * 0.008, ph: Math.random() * 6.3 });
  }
  const g = kind === "spark" ? -0.05 : kind === "bubble" ? -0.07 : kind === "shard" ? 0.26 : 0.3;
  let last = 0;
  fx.scene((c, t, w, h) => {
    const k = Math.min(3, Math.max(0.5, (t - last) * 60)); last = t;
    let alive = false;
    for (const p of ps) {
      if (p.life <= 0) continue;
      p.vy += g * k; p.vx *= Math.pow(0.992, k); p.vy *= Math.pow(0.992, k); p.x += p.vx * k; p.y += p.vy * k; p.r += p.vr * k; p.life -= p.dec * k;
      if (p.life <= 0 || p.y > h + 60 || p.y < -60) { p.life = 0; continue; }
      alive = true;
      c.save(); c.globalAlpha = Math.max(0, Math.min(1, p.life * 1.7)); c.fillStyle = c.strokeStyle = p.c;
      if (kind === "pixel") { const s = Math.round(p.s * 0.9 + 2); c.fillRect(Math.round(p.x / 3) * 3, Math.round(p.y / 3) * 3, s, s); }
      else if (kind === "spark") { c.globalAlpha *= 0.55 + 0.45 * Math.abs(Math.sin(t * 22 + p.ph)); c.beginPath(); c.arc(p.x, p.y, 1.1 + p.s * 0.22, 0, 6.3); c.fill(); }
      else if (kind === "bubble") { c.lineWidth = 1.4; c.beginPath(); c.arc(p.x + Math.sin(t * 5 + p.ph) * 3, p.y, 2 + p.s * 0.6, 0, 6.3); c.stroke(); }
      else { c.translate(p.x, p.y); c.rotate(p.r); c.beginPath(); c.moveTo(0, -p.s); c.lineTo(p.s * 0.6, p.s * 0.7); c.lineTo(-p.s * 0.4, p.s * 0.4); c.closePath(); c.fill(); }
      c.restore();
    }
    return alive || t < 0.05;
  });
}
/** A burst of `what` — a particle of this module's own, an fx.js shape list, or null for the kit's own confetti. */
export function emit(fx, what, x, y, n, power, spread, pal) {
  if (!fx) return;
  if (what && PARTICLE[what] && fx.scene) particles(fx, what, x, y, n, power, spread, pal);
  else fx.burst(x, y, n, power, spread, what && !PARTICLE[what] ? { palette: pal, shapes: what } : null);
}

/* ---------------- things that travel ---------------- */
const TOP = typeof HTMLElement !== "undefined" && "popover" in HTMLElement.prototype;
/** A copy of `from`'s words at `r`, in its own type, above everything — a popover, so an open sheet's backdrop does not
    cover it. Whoever moves it takes it away (gone). */
export function ghost(text, from, r) {
  const cs = getComputedStyle(from), g = document.createElement("div"), s = g.style;
  g.className = "tghost"; g.textContent = text; g.setAttribute("aria-hidden", "true");
  for (const k of ["fontFamily", "fontWeight", "fontStyle", "fontSize", "lineHeight", "letterSpacing", "color", "textTransform"]) s[k] = cs[k];
  s.left = r.left + "px"; s.top = r.top + "px"; s.width = Math.ceil(r.width + 2) + "px";
  document.body.appendChild(g);
  if (TOP) { g.popover = "manual"; try { g.showPopover(); } catch (e) { /* in the page, then */ } }
  return g;
}
export function gone(g) { try { if (TOP && g.matches(":popover-open")) g.hidePopover(); } catch (e) { /* ignore */ } g.remove(); }
const size = el => parseFloat(getComputedStyle(el).fontSize) || 16;
/** Where `el` will be once `d` (a panel on its way in) has arrived: its rect without the panel's own transform. */
export function rest(el, d) {
  const r = el.getBoundingClientRect(), t = d ? getComputedStyle(d).transform : "none";
  if (!t || t === "none") return r;
  const m = new DOMMatrixReadOnly(t); return new DOMRect(r.left - m.e, r.top - m.f, r.width, r.height);
}
/** Words carried from `r0` (in `from`'s type) to `to` at `r1`, scaled to its size; `to` shows as they arrive. */
export function carry(text, from, r0, to, r1 = to && to.getBoundingClientRect()) {
  if (RM.matches || !to || !r0 || !r0.width || !r1 || !r1.width) return;
  const f = feel(), g = ghost(text, from, r0), T = `translate(${r1.left - r0.left}px,${r1.top - r0.top}px) scale(${size(to) / size(from)})`;
  after(run(g, [{ transform: "none", opacity: 1 }, { opacity: 1, offset: 0.7 }, { transform: T, opacity: 0 }], { duration: f.move.duration, easing: f.move.easing, fill: "forwards" }), () => gone(g));
  run(to, [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: f.move.duration });
}
/** A line's words fly to a control in an arc, shrinking into it (the tab the line went to); the control bumps. */
export function flyTo(text, from, r0, el) {
  if (RM.matches || !el || !r0) return;
  const t = el.getBoundingClientRect(), f = feel(), g = ghost(text, from, r0), dx = t.left + t.width / 2 - r0.left, dy = t.top + t.height / 2 - r0.top;
  after(run(g, [{ transform: "none", opacity: 1 }, { transform: `translate(${dx * 0.4}px,${dy * 0.4 - 80}px) scale(.55)`, opacity: 1, offset: 0.5 }, { transform: `translate(${dx}px,${dy}px) scale(.06)`, opacity: 0.25 }],
    { duration: Math.round(640 * f.tempo), easing: f.stepped ? "steps(8,end)" : "cubic-bezier(.45,0,.25,1)", fill: "forwards" }), () => { gone(g); bump(el); });
}
/** Not today: the words leave to the right, and a moon rises where they were. */
export function flyOff(text, from, r0) {
  if (RM.matches || !r0) return;
  const f = feel(), g = ghost(text, from, r0);
  after(run(g, [{ transform: "none", opacity: 1 }, { transform: `translate(${innerWidth - r0.left + 30}px,-36px) rotate(5deg) scale(.8)`, opacity: 0 }], { duration: Math.round(560 * f.tempo), easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" }), () => gone(g));
  moonAt(r0);
}
export function moonAt(r) {
  if (RM.matches || !r) return;
  const m = document.createElement("div"); m.className = "moon-f"; m.setAttribute("aria-hidden", "true");
  m.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z"/></svg>';
  m.style.left = r.left + 4 + "px"; m.style.top = r.top + "px"; document.body.appendChild(m);
  after(run(m, [{ opacity: 0, transform: "translateY(10px) scale(.6)" }, { opacity: 1, transform: "translateY(-10px) scale(1)", offset: 0.35 }, { opacity: 0, transform: "translateY(-44px)" }], { duration: 950, easing: "ease-out" }), () => m.remove());
}
export function bump(el) {
  if (RM.matches || !el || !el.isConnected) return;
  run(el, [{ transform: "scale(1)" }, { transform: "scale(1.16)", offset: 0.3 }, { transform: "scale(1)" }], { duration: 460, easing: "ease-out" });
}
/** A line back in its place (Undo, a restore): it rises into the gap the others open for it. */
export function arrive(li) {
  if (RM.matches || !li) return;
  const f = feel();
  run(li, [{ opacity: 0, transform: "translateY(.3em)" }, { opacity: 1, transform: "none" }], { duration: f.move.duration, easing: f.move.easing });
}
/** The count's number rolls to its new value like an odometer's wheel: up for a check-off, down for an uncheck. The
    old number rides above or below the new one (styles.css, data-was) inside a window the size of one line. */
export function roll(i, was) {
  if (RM.matches || !i) return;
  const f = feel(), up = +i.textContent > +was, k = (i._roll = (i._roll || 0) + 1);
  i.getAnimations().forEach(a => a.cancel());
  i.dataset.was = was; i.classList.toggle("down", !up);
  after(run(i, [{ transform: `translateY(${up ? 100 : -100}%)` }, { transform: "none" }], f.stepped ? { duration: 240, easing: "steps(3,end)" } : f.pop), () => { if (i._roll === k) delete i.dataset.was; });
}

/* ---------------- a line on its way out ----------------
   app.js has already changed the list; the row is out of the renderer's hands and leaves in place, then the rows below
   close the gap on the material's spring. `how`: "erase" (Delete), "off" (Not today: the words leave to the right),
   "moon" (a swipe has already carried them off), "all" (Take off Today: they fly to the Everything tab). `el` and `r`
   are where the words start when that is not the line itself (the line menu's title). */
/** A line's own words (not its captions) and where they sit. */
export function wordsOf(li) { const n = li.querySelector(".tx").firstChild; return n && n.nodeType === 3 ? n.nodeValue : ""; }
export function textRect(li) {
  const tx = li.querySelector(".tx"), n = tx && tx.firstChild;
  if (n && n.nodeType === 3) { const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); if (r.width) return r; }
  return (tx || li).getBoundingClientRect();
}
export function leave(li, { how, el = null, r = null, fx, tab, done }) {
  li.classList.add("leaving"); li.inert = true;
  const tx = li.querySelector(".tx"), words = wordsOf(li), home = textRect(li);
  const close = () => { collapse(li); done(); };
  if (how === "erase") {
    const go = () => { li.classList.remove("lifted"); erase(li, { fx, done: close }); };
    if (el) { carry(words, el, r, tx, home); setTimeout(go, feel().move.duration * 0.78); } else go();
    return;
  }
  if (how === "moon") moonAt(home); else if (how === "off") flyOff(words, el || tx, r || home); else if (how === "all") flyTo(words, el || tx, r || home, tab);
  li.style.opacity = "0";
  setTimeout(close, 140);
}
function collapse(li) {
  const box = li.parentNode; if (!box) return;
  const sibs = [...box.children].filter(e => e !== li && e.classList.contains("row") && !e.classList.contains("leaving")), first = sibs.map(e => e.getBoundingClientRect().top);
  li.remove();
  if (RM.matches) return;
  const f = feel(); let k = 0;
  sibs.forEach((e, i) => { const d = first[i] - e.getBoundingClientRect().top; if (d) run(e, [{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: f.move.duration, easing: f.move.easing, delay: 20 * k++, fill: "backwards" }); });
}

/* ---------------- how a line leaves ----------------
   Delete, in the material's way; the others close the gap once it has gone (app.js). The recipes are the prototype's:
   Clean folds away, Ink smears, Glass shatters, Tide sinks, Candy bursts, Phosphor backspaces, Glow dissolves, Ember
   burns, Pencil is rubbed out, Pixel explodes. The Extra pairs rub out like chalk, and Char burns. */
export function erase(li, { fx, done }) {
  const end = a => after(a, () => { li.style.opacity = "0"; if (a) a.cancel(); done(); });
  li.classList.add("leaving"); li.inert = true;
  const lines = li.querySelector(".lines"); if (lines) lines.textContent = "";
  if (RM.matches) return end(null);
  const theme = document.documentElement.dataset.theme, m = feel().mat, tx = li.querySelector(".tx") || li, r = tx.getBoundingClientRect();
  const css = n => getComputedStyle(li).getPropertyValue(n).trim(), text = tx.firstChild && tx.firstChild.nodeType === 3 ? tx.firstChild.nodeValue : tx.textContent;
  const hold = { fill: "forwards" };
  const smear = pal => {
    for (let k = 0; k < 7; k++) setTimeout(() => emit(fx, [5], r.left + r.width * (k / 7), r.top + r.height * 0.55, 5, 2.4, 3, pal), 40 + k * 55);
    return end(run(li, [{ clipPath: "inset(-20% -4% -20% 0)", filter: "blur(0px)", transform: "none" }, { clipPath: "inset(-20% -4% -20% 100%)", filter: "blur(2.5px)", transform: "translateX(8px) skewX(-5deg)" }], { duration: 460, easing: "cubic-bezier(.55,0,.45,1)", ...hold }));
  };
  const burn = () => {
    const hot = css("--accent-hi") || "#FFB02E";
    for (let k = 0; k < 8; k++) setTimeout(() => emit(fx, "spark", r.left + r.width * Math.random(), r.top + r.height * 0.4, 4, 2.2, 1.4, ["#FFB02E", "#FF8A3D", "#FFEDE4"]), 120 + k * 60);
    return end(run(li, [{ color: css("--text"), opacity: 1 }, { color: hot, textShadow: "0 0 16px rgba(255,120,40,.95)", offset: 0.35 }, { color: "#4A302A", textShadow: "none", opacity: 0.7, offset: 0.72 }, { color: "#4A302A", opacity: 0, filter: "blur(2px)", transform: "translateY(-6px)" }], { duration: 950, easing: "ease-in", ...hold }));
  };
  if (m === "ink") return smear([css("--hair-solid"), css("--dim"), css("--ink-3")]);
  if (m === "pencil") return smear(["#C9C6BE", "#767579", "#E2DED4"]);
  if (m === "chalk" || (m === "wood" && theme !== "char")) return smear([css("--text"), css("--dim"), css("--hair-solid")]);
  if (m === "ember" || theme === "char") return burn();
  if (m === "glass") {
    for (let k = 0; k < 6; k++) emit(fx, "shard", r.left + r.width * (k + 0.5) / 6, r.top + r.height / 2, 6, 5, 6.2, [css("--accent"), css("--accent-hi"), css("--text")]);
    return end(run(li, [{ opacity: 1, filter: "blur(0px)", transform: "none" }, { opacity: 0, filter: "blur(3px)", transform: "scale(.97)" }], { duration: 220, easing: "ease-in", ...hold }));
  }
  if (m === "tide") {
    for (let k = 0; k < 5; k++) setTimeout(() => emit(fx, "bubble", r.left + Math.random() * r.width, r.top + r.height * 0.8, 3, 1.5, 1, [css("--accent"), css("--accent-hi")]), k * 90);
    return end(run(li, [{ transform: "none", opacity: 1, filter: "blur(0px)" }, { transform: "translateY(36px)", opacity: 0, filter: "blur(3px)" }], { duration: 640, easing: "cubic-bezier(.5,0,.8,.4)", ...hold }));
  }
  if (m === "candy") {
    li.style.transformOrigin = "30% 50%";
    setTimeout(() => emit(fx, null, r.left + r.width * 0.5, r.top + r.height * 0.5, 30, 8, 6.2), 150);
    return end(run(li, [{ transform: "none", opacity: 1 }, { transform: "scale(1.07)", opacity: 1, offset: 0.55 }, { transform: "scale(1.1)", opacity: 0 }], { duration: 260, easing: "ease-out", ...hold }));
  }
  if (m === "phosphor") { // the line is backspaced out, a block caret riding it
    const car = document.createElement("span"); car.className = "caret"; let n = text.length; const per = Math.max(1, Math.ceil(n / 16));
    const bs = () => { if (!li.isConnected) return end(null); n = Math.max(0, n - per); tx.textContent = text.slice(0, n); tx.appendChild(car); if (n > 0) setTimeout(bs, 26); else setTimeout(() => end(null), 120); };
    return bs();
  }
  if (m === "glow") {
    emit(fx, [3, 5], r.left + r.width / 2, r.top + r.height / 2, 12, 3, 6.2, [css("--accent"), css("--accent-hi"), css("--text")]);
    return end(run(li, [{ opacity: 1, filter: "blur(0px) brightness(1)" }, { opacity: 0, filter: "blur(7px) brightness(2.3)" }], { duration: 720, easing: "ease-in", ...hold }));
  }
  if (m === "pixel") {
    for (let k = 0; k < 8; k++) emit(fx, "pixel", r.left + r.width * (k + 0.5) / 8, r.top + r.height / 2, 6, 5.5, 6.2, [css("--accent"), css("--accent-hi"), css("--text")]);
    return end(run(li, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "steps(2,end)", ...hold }));
  }
  li.style.transformOrigin = "50% 50%"; // Clean: it folds away
  return end(run(li, [{ transform: "none", opacity: 1 }, { transform: "scaleY(.05)", opacity: 0 }], { duration: 300, easing: "cubic-bezier(.5,0,.75,0)", ...hold }));
}

/* ---------------- two view transitions ---------------- */
/** A theme the person picked opens from what they touched (the sun or moon, a swatch): `change` runs inside a view
    transition and the new theme grows as a circle from `from` over the old one — Phosphor as a raster sweeping down,
    Pixel in steps. False when it cannot (no API, reduced motion, a hidden page); the caller then changes it itself. */
export function reveal(from, change) {
  if (RM.matches || !document.startViewTransition || !from || !from.isConnected || document.hidden) return false;
  const r = from.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, root = document.documentElement;
  const done = () => root.classList.remove("vt-theme");
  let t;
  root.classList.add("vt-theme");
  try { t = document.startViewTransition(change); } catch (e) { done(); return false; }
  t.ready.then(() => {
    const m = matNow(), R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.animate(m === "phosphor" ? [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }] : [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)` }],
      { duration: m === "phosphor" ? 380 : 460, easing: m === "pixel" ? "steps(9,end)" : m === "phosphor" ? "steps(20,end)" : "cubic-bezier(.3,0,.1,1)", pseudoElement: "::view-transition-new(root)" }); // short: the page takes no input until it ends
  }).catch(() => {});
  t.finished.then(done, done);
  return true;
}
/** Today is a close-up of Everything, so the tabs zoom: `lines()` names the rows on Today ([row, name]) before and after
    `apply` switches the view, so they travel between their places; the rest scales away and in (panels.css, vt-zoom),
    and the chosen tab's pill slides. The names come off when it ends. False when it cannot. */
export function zoom(toAll, lines, apply) {
  if (RM.matches || !document.startViewTransition || document.hidden) return false;
  const root = document.documentElement;
  const tag = on => { for (const [li, n] of lines()) if (li) { const r = on ? li.getBoundingClientRect() : null; li.style.viewTransitionName = r && r.height > 0 && r.bottom > 0 && r.top < innerHeight ? n : ""; } };
  const done = () => { tag(false); root.classList.remove("vt-zoom", "zoom-out", "zoom-in"); };
  tag(true); root.classList.add("vt-zoom", toAll ? "zoom-out" : "zoom-in");
  try { document.startViewTransition(() => { apply(); tag(true); }).finished.then(done, done); } catch (e) { done(); return false; }
  return true;
}

/* ---------------- panels: one surface that comes from what you touched ----------------
   app.js's panel stack opens and closes dialogs synchronously, as it always has; this only animates them. A panel grows
   out of the control that opened it (the ⋯, a line's ⋯), or out of the panel it replaces — a push, a Back, the ⋯ menu
   turning into what it opened — and a sheet with neither rises from the bottom edge. Closing, a copy of the panel folds
   back into its control (a sheet drops away) while the real one is already gone. */
const cl = (v, a, b) => Math.max(a, Math.min(b, v));
const OPEN = "inset(-80px round 18px)";
let pressed = null;
if (typeof document !== "undefined") document.addEventListener("pointerdown", e => { const b = e.target.closest && e.target.closest("button, [role=tab]"); if (b && !b.closest("dialog")) pressed = { el: b, t: performance.now() }; }, true);
/** The control on the rail, a line's ⋯ or Everything's head that was just pressed or has focus: where a panel comes
    from, and folds back to. Null for anything else (a panel that opened by itself scales in and out in place). */
export function origin() {
  const ok = el => !!el && el.isConnected && !el.closest("dialog") && !!el.closest(".rail, #foot, .tools, #all-head");
  if (pressed && performance.now() - pressed.t < 1500 && ok(pressed.el)) return pressed.el;
  const a = document.activeElement; return ok(a) ? a : null;
}
/** The start of a grow from rect A into the element's rect R: a translate that keeps A inside R, moving as little as it
    can, and A as a clip in R's own box. */
function grownFrom(A, R) {
  const tx = A.width <= R.width ? cl(0, A.right - R.right, A.left - R.left) : (A.left + A.right - R.left - R.right) / 2;
  const ty = A.height <= R.height ? cl(0, A.bottom - R.bottom, A.top - R.top) : (A.top + A.bottom - R.top - R.bottom) / 2;
  const l = A.left - R.left - tx, t = A.top - R.top - ty, f = n => n.toFixed(1) + "px";
  return { transform: `translate(${f(tx)},${f(ty)})`, clipPath: `inset(${f(t)} ${f(R.width - l - A.width)} ${f(R.height - t - A.height)} ${f(l)} round ${f(Math.min(18, A.height / 2))})` };
}
/** A dialog has just been shown. `sheet`: it is a bottom sheet. `anchor`: the control it came from. `src`: the rect of
    the panel it replaces. `dir`: "fwd" or "back", the side a pushed page slides in from. `step`: the same dialog shows
    its next (or previous) step — only its page moves. */
export function panelIn(d, { sheet = false, anchor = null, src = null, dir = "", step = false } = {}) {
  d.classList.add("mo"); // the stylesheet's own entrances stand down (panels.css)
  if (RM.matches) return;
  const f = feel(), R = d.getBoundingClientRect(), body = d.querySelector(".body");
  if (step) { if (body) run(body, [{ opacity: 0, transform: `translateX(${dir === "back" ? -28 : 28}px)` }, { opacity: 1, transform: "none" }], f.move); return; }
  const A = src || (anchor && anchor.isConnected ? anchor.getBoundingClientRect() : null);
  if (!R.width) return;
  if (sheet && !src) run(d, [{ transform: "translateY(100%)" }, { transform: "none" }], f.move);
  else if (sheet) { if (A.height < R.height - 1) run(d, [{ clipPath: `inset(${(R.height - A.height).toFixed(1)}px 0 0 0 round 18px 18px 0 0)` }, { clipPath: "inset(0 0 0 0 round 18px 18px 0 0)" }], f.move); }
  else if (A && A.width) run(d, [grownFrom(A, R), { transform: "none", clipPath: OPEN }], f.move);
  else run(d, [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], f.snap);
  if (body && dir) run(body, [{ opacity: 0, transform: `translateX(${dir === "back" ? -28 : 28}px)` }, { opacity: 1, transform: "none" }], f.move);
  else if (body && A && !sheet) run(body, [{ opacity: 0 }, { opacity: 0, offset: 0.2 }, { opacity: 1 }], { duration: f.move.duration, easing: "ease-out" });
  if (!src && !dir) d.querySelectorAll(".menu > :not([hidden])").forEach((el, i) => run(el, [{ opacity: 0, transform: `translateY(${sheet ? 10 : -6}px)` }, { opacity: 1, transform: "none" }], { duration: 280, delay: 40 + i * 22, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" }));
}
/** Hand a closing dialog to this before it closes: a copy of it folds into `to`, or drops away as a sheet. Returns
    { rect, cancel } — cancel() takes the copy away before it is painted, for a panel that turns into another. */
export function fold(d, { sheet = false, to = null } = {}) {
  if (RM.matches) return null;
  const R = d.getBoundingClientRect(); if (!R.width || !R.height) return null;
  const g = d.cloneNode(true), s = g.style;
  g.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
  g.removeAttribute("open"); g.inert = true; g.setAttribute("aria-hidden", "true"); g.classList.add("folding");
  s.inset = "auto"; s.left = R.left + "px"; s.top = R.top + "px"; s.width = R.width + "px"; s.height = R.height + "px"; s.transform = "none"; s.clipPath = "none";
  const scrim = d.classList.contains("pop") ? null : document.createElement("div");
  if (scrim) { scrim.className = "fold-scrim"; document.body.appendChild(scrim); }
  document.body.appendChild(g);
  const f = feel(), A = !sheet && to && to.isConnected ? to.getBoundingClientRect() : null, body = g.querySelector(".body");
  let a;
  if (sheet) a = run(g, [{ transform: "none" }, { transform: "translateY(100%)" }], { duration: 230, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
  else if (A && A.width) { const st = grownFrom(A, R); a = run(g, [{ transform: "none", clipPath: OPEN, opacity: 1 }, { ...st, opacity: 1, offset: 0.82 }, { ...st, opacity: 0 }], { duration: Math.max(280, Math.round(f.move.duration * 0.9)), easing: f.stepped ? "steps(6,end)" : "cubic-bezier(.3,.8,.3,1)", fill: "forwards" }); }
  else a = run(g, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.96)" }], { duration: 180, easing: "ease-in", fill: "forwards" });
  if (body) run(body, [{ opacity: 1 }, { opacity: 0 }], { duration: 110, fill: "forwards" });
  if (scrim) run(scrim, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" });
  let live = true;
  const end = () => { if (!live) return; live = false; g.remove(); if (scrim) scrim.remove(); };
  after(a, () => { if (live && to) bump(to); end(); });
  return { rect: R, cancel() { if (a) a.cancel(); end(); } };
}

/* ---------------- the keys ---------------- */
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"; // the links' own alphabet
const noise = n => { let s = ""; for (let i = 0; i < n; i++) s += B64[(Math.random() * 64) | 0]; return s; };
/** A link field comes up as ciphertext and decodes into its link, left to right. The field says what it holds in
    data-v from the first frame (Copy reads that), and holds the link itself again the moment this ends. */
export function decode(el, text, ms = 560, delay = 0) {
  if (!el) return;
  cancelAnimationFrame(el._dec); el.dataset.v = text;
  if (RM.matches || !text) { el.value = text; return; }
  const pre = Math.max(0, text.indexOf("://") + 3), t0 = performance.now() + delay;
  const step = now => {
    const p = cl((now - t0) / ms, 0, 1), k = pre + Math.floor((text.length - pre) * p);
    el.value = p < 1 ? text.slice(0, k) + noise(text.length - k) : text;
    if (p < 1 && el.isConnected) el._dec = requestAnimationFrame(step); else el.value = text;
  };
  el.value = text.slice(0, pre) + noise(text.length - pre);
  el._dec = requestAnimationFrame(step);
}
/** New keys: a band of the accent sweeps down the screen as the list is sealed again under its new key. */
export function sweep() {
  if (RM.matches) return;
  const s = document.createElement("div"); s.className = "sweep"; s.setAttribute("aria-hidden", "true"); document.body.appendChild(s);
  after(run(s, [{ transform: "translateY(-110%)" }, { transform: "translateY(270%)" }], { duration: 950, easing: "cubic-bezier(.45,0,.25,1)" }), () => s.remove());
}
