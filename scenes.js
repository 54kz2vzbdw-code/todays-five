// scenes.js — 1.12 b318: Scenes, a picture behind the list for the kits that have one, when this device's Scenes setting
// is on. app.js loads it only then (paintField): nothing of it is on the first paint, and a page with the setting off
// never asks for it or runs it (the worker precaches it like every module, so a page open across a deploy still gets
// its own build's). A scene is drawn in whole pixels on a small canvas, about 190 tall, scaled up crisp.
//
// Two moods. While the list is in use the scene is nearly still: stars, a firefly now and then, 15 frames a second.
// Left alone for twenty seconds on Today it plays its fifteen-second loop, choreographed beat by beat, at 30, and eases
// back the moment anything is touched; Everything, a page of words, keeps it quiet behind a veil. The finale has a
// moment of its own. prefers-reduced-motion gets one still frame; a hidden page gets nothing at all. Each scene is its
// own module (scene-<id>.js), handed the drawing kit below; the words' side of it is scenes.css.

export const LOOP = 15;
const IDLE_AFTER = 20000;
const MODS = { forest: "./scene-forest.js", harbor: "./scene-harbor.js", paper: "./scene-papercut.js", midnight: "./scene-papercut.js", teletype: "./scene-teletype.js", terminal: "./scene-terminal.js", light: "./scene-orbit.js", dark: "./scene-orbit.js" }; // a pair can share one world
export const SCENE_IDS = Object.keys(MODS);

/* ---------------- the drawing kit a scene is handed ---------------- */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  back: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2), // out, overshooting a little and settling
  elastic: t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * 2.0944) + 1,
};
/** a damped spring from 0 to 1 over t in [0,1]: `k` wobbles, `d` how fast they die */
const spring = (t, k = 3, d = 6) => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-d * t) * Math.cos(k * Math.PI * t);
const seg = (t, a, b, e = E.io) => e(clamp((t - a) / (b - a)));
/** a beat's envelope: 0 before a, up to 1 by b, held to c, back to 0 by d */
const env = (t, a, b, c, d, e = E.io) => t <= a || t >= d ? 0 : t < b ? e((t - a) / (b - a)) : t <= c ? 1 : e((d - t) / (d - c));
function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixc = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const css = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; };
/** a sprite from a function of (x, y) → [r,g,b,a?] or null, written straight into pixels */
function paint(w, h, fn) {
  const [c, x2] = canvas(w, h), im = x2.createImageData(c.width, c.height), d = im.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = fn(x, y); if (!v) continue; const i = (y * c.width + x) * 4; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = v[3] === undefined ? 255 : v[3]; }
  x2.putImageData(im, 0, 0); return c;
}
/** 1-D value noise, smooth, tiling every `p` */
function noise1(seed, p) { const r = rng(seed), v = Array.from({ length: p }, r); return x => { const i = Math.floor(x), f = x - i, a = v[((i % p) + p) % p], b = v[(((i + 1) % p) + p) % p], s = f * f * (3 - 2 * f); return lerp(a, b, s); }; }
const fbm = (n, x, o = 3) => { let s = 0, a = .5, f = 1, t = 0; for (let i = 0; i < o; i++) { s += a * n(x * f); t += a; a *= .5; f *= 2; } return s / t; };
/** a soft glow: alpha falling off from the centre, one colour */
function glowSpr(r, c, k = 1) { return paint(r * 2 + 1, r * 2 + 1, (x, y) => { const d = Math.hypot(x - r, y - r) / (r + .5); if (d >= 1) return null; return [c[0], c[1], c[2], Math.round(255 * k * Math.pow(1 - d, 2.2))]; }); }
/** a pine, pointed, in tiers that flare and droop, lit on the right */
function pine(h, seed, body, rim, trunk, shade) {
  const r = rng(seed), w = (Math.max(5, Math.round(h * .5)) | 1), cx = (w - 1) / 2, tH = Math.max(1, Math.round(h * .1)), canopy = h - tH;
  const k = clamp(Math.round(canopy / 6), 3, 9), th = canopy / k, jag = Array.from({ length: h }, () => r() < .35 ? 1 : 0);
  return paint(w, h, (x, y) => {
    const dx = x - cx;
    if (y >= canopy) return Math.abs(dx) <= (h > 34 ? 1 : 0) ? trunk : null;
    const i = Math.min(k - 1, Math.floor(y / th)), ty = (y - i * th) / th;
    const end = (w / 2) * Math.pow((i + 1) / k, .85), start = i === 0 ? 0 : end * .5;
    const half = lerp(start, end, Math.pow(ty, .9)) + (ty > .82 ? .9 : 0) - jag[y] * .8;
    if (Math.abs(dx) > half) return null;
    if (dx > half - 1.1 && dx > -.5) return rim;
    if (shade && dx < -half + 1.6) return shade;
    return body;
  });
}
/** a pixel sprite from rows of characters, one palette entry per character */
function sprite(rows, pal) { const w = Math.max(...rows.map(r => r.length)); return paint(w, rows.length, (x, y) => pal[rows[y][x]] || null); }
/** the first `p` (0…1) of a polyline's length, drawn: a line that draws itself */
function partial(g, pts, p) {
  if (p <= 0 || pts.length < 2) return; let total = 0; const seglen = [];
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seglen.push(l); total += l; }
  let left = total * clamp(p); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) { const l = seglen[i - 1], f = Math.min(1, left / (l || 1)); g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)); left -= l; }
  g.stroke();
}
/** line boil: the same drawing redrawn a few times a second with its points shifted a hair, as a hand would redraw it */
const boil = (frame, amp = .8) => { const r = rng(frame * 7919 + 13); return (x, y) => [x + (r() - .5) * 2 * amp, y + (r() - .5) * 2 * amp]; };
/** paper grain: soft specks of light and dark, drawn once and laid over a paper colour */
function grain(w, h, seed = 1, k = .06) { const r = rng(seed); return paint(w, h, () => { const v = r(); return v < .5 ? [0, 0, 0, Math.round(255 * k * r())] : [255, 255, 255, Math.round(255 * k * .8 * r())]; }); }
/** a layer redrawn only when what is in it moves: `key` says what it looks like now */
function layer() { let c = null, k = null; return (w, h, key, draw) => { if (!c || c.width !== w || c.height !== h) { [c] = canvas(w, h); k = null; } if (key !== k) { const x = c.getContext("2d"); x.clearRect(0, 0, w, h); draw(x); k = key; } return c; }; }
export const KIT = { LOOP, clamp, lerp, E, spring, seg, env, rng, dith, rgb, mixc, css, canvas, paint, noise1, fbm, glowSpr, pine, sprite, layer, partial, boil, grain };

/* ---------------- the stage ---------------- */
/** The words' side of it (scenes.css), asked for with the page's build (COMPATIBILITY.md §6), and only once. */
function linkCss(build) {
  if (document.querySelector("link[data-scenes]")) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "scenes.css" + (build ? "?v=" + build : ""); l.dataset.scenes = "1";
  document.head.appendChild(l);
}
/** Mount scene `id` in `host` (#field). Returns { stop, finale, state }; stop() leaves the host as it found it. */
export function createScene(host, id, { build = "", reduced = () => false, ink = "#000000", busy = false } = {}) {
  let alive = true, scene = null, raf = 0, timer = 0, last = 0, T = 0, I = 0, A = 12, F = -1, frames = 0, fps = 15, lastInput = performance.now();
  let W = 0, H = 0, PXS = 4, resizeT = 0, coverT = 0, crowd = !!busy, veilAt = .5;
  const [cv, g] = canvas(1, 1), [bd, bg] = canvas(1, 1); // the moving picture, and (smooth styles) what never moves under it
  cv.setAttribute("aria-hidden", "true"); bd.setAttribute("aria-hidden", "true");
  const scrim = document.createElement("div");
  host.hidden = false; host.className = "scene"; host.textContent = "";
  const hs = host.style; hs.position = "fixed"; hs.inset = "0"; hs.pointerEvents = "none"; hs.zIndex = "1"; hs.overflow = "hidden"; hs.opacity = "0"; hs.transition = "opacity .7s ease";
  const cs = cv.style, bs = bd.style; for (const x of [cs, bs]) { x.position = "absolute"; x.left = "0"; x.top = "0"; }
  // the words stay on a quiet ground: washes of the kit's own ink where the app keeps words — the bar along the top,
  // the list, the footer's row — and the picture whole between them and in the corners (tools/contrast.mjs measures
  // it). A scene weighs the two bands (`wash`): a light kit's small words sit right at 4.5:1 on its own ground, so its
  // picture has to come nearly to the ink under them, where a dark kit's has room to spare. A scene that keeps its picture
  // clear of the list (`list`, 1.12 b328) may lighten the wash over the list's band, so its picture isn't dimmed for nothing.
  const [ir, ig, ib] = rgb(ink), k = a => `rgba(${ir},${ig},${ib},${Math.min(.95, a).toFixed(3)})`, ss = scrim.style; ss.position = "absolute"; ss.inset = "0";
  let weight = 1, listW = 1;
  const wash = (w = weight) => {
    weight = w;
    const pool = Math.round(Math.max(innerWidth * .7, 360)); // a phone's footer row is as wide as the phone
    ss.background = [
      `linear-gradient(to bottom, ${k(.55 * w)} 0, ${k(.55 * w)} 48px, ${k(.28 * w)} 88px, ${k(0)} 132px)`,
      `radial-gradient(${pool}px 110px at 50% 100%, ${k(.72 * w)} 0%, ${k(.72 * w)} 45%, ${k(.4 * w)} 75%, ${k(0)} 100%)`,
      `radial-gradient(120% 72% at 42% 40%, ${k(.62 * listW)} 0%, ${k(.4 * listW)} 52%, ${k(0)} 82%)`,
    ].join(", ");
  };
  // Everything is a page of words from top to bottom, over every part of the picture (the moon included): there the
  // scene steps back behind a veil of the same ink and its loop waits for Today. A scene says how far (`veil`): half
  // for a dark kit, all the way for a light one, whose small words have no room for any picture at all — and a veil
  // that covers everything stops the drawing under it too.
  const veil = document.createElement("div"), vs = veil.style; vs.position = "absolute"; vs.inset = "0"; vs.background = ink; vs.transition = "opacity .5s ease";
  const paintVeil = () => { vs.opacity = crowd ? String(veilAt) : "0"; };
  wash(); paintVeil();
  host.append(bd, cv, scrim, veil);
  linkCss(build); document.documentElement.dataset.scene = id;

  const touched = () => { lastInput = performance.now(); };
  const opt = { capture: true, passive: true };
  const INPUTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];
  INPUTS.forEach(t => addEventListener(t, touched, opt));
  const hidden = () => document.visibilityState === "hidden";
  const onVis = () => { if (hidden()) halt(); else run(); };
  document.addEventListener("visibilitychange", onVis);
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (alive && scene) { size(); draw(); } }, 150); };
  addEventListener("resize", onResize);
  /* 1.12 b328: a scene that keeps to the empty part of the page (its `words(rects)`) is told where the words are: each
     line's text and its tools, the pills, the date, the count, the keyboard line and the finale's words, in CSS pixels, measured again (once a frame at
     most) whenever the page's words change, move or scroll. */
  let wordsF = 0, watch = null;
  const measure = () => {
    wordsF = 0; if (!alive || !scene || !scene.words) return;
    const out = [], range = document.createRange(), shell = document.getElementById("shell"); if (!shell) return;
    for (const el of shell.querySelectorAll(".row .tx, .row .tool, .chip, .seg, .add, #date, #count, #hint, #finale > span")) {
      if (el.classList.contains("tx")) range.selectNodeContents(el);
      const b = el.classList.contains("tx") ? range.getBoundingClientRect() : el.getBoundingClientRect();
      if (b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight) out.push([b.left, b.top, b.right, b.bottom]);
    }
    scene.words(out);
  };
  const remeasure = () => { if (!wordsF && alive) wordsF = requestAnimationFrame(measure); };

  /* Two ways to draw. Pixel art (Forest, Harbor): a canvas about 190 pixels tall, scaled up crisp, redrawn whole each
     frame, which at that size costs next to nothing. The smooth styles (`res` on the scene: canvas pixels per CSS pixel,
     or "dpr" for line art that wants the screen's own, up to 2): the scene draws in CSS pixels, what never moves goes
     on the backdrop once, at layout, and each frame redraws only what moves. */
  let smooth = false;
  function size() {
    wash();
    smooth = scene.res !== undefined && scene.res !== "pixel";
    if (!smooth) {
      PXS = Math.max(3, Math.round(innerHeight / (innerWidth < 700 ? 205 : 185)));
      W = Math.ceil(innerWidth / PXS); H = Math.ceil(innerHeight / PXS);
      cv.width = W; cv.height = H; g.imageSmoothingEnabled = false;
      cs.width = W * PXS + "px"; cs.height = H * PXS + "px"; cs.imageRendering = "pixelated";
      bd.width = bd.height = 1; bs.display = "none";
      scene.layout(W, H);
      return;
    }
    PXS = scene.res === "dpr" ? Math.min(2, devicePixelRatio || 1) : +scene.res || 1;
    W = innerWidth; H = innerHeight;
    for (const [c, x, st] of [[cv, g, cs], [bd, bg, bs]]) { c.width = Math.round(W * PXS); c.height = Math.round(H * PXS); x.setTransform(PXS, 0, 0, PXS, 0, 0); x.imageSmoothingEnabled = true; st.width = W + "px"; st.height = H + "px"; st.imageRendering = "auto"; }
    bs.display = "";
    bg.clearRect(0, 0, W, H);
    scene.layout(W, H, bg);
  }
  function draw() { g.globalAlpha = 1; scene.draw(T, I, A, F); frames++; }
  /* Two cadences, two ways of asking for frames, each the cheaper one where it is used (measured in Chrome with
     tools/idle.mjs, A against B on the same build): quiet at fifteen, a timer wakes half a display frame before the
     next is due and that one frame is asked for (1.6 % of a core against 2.4 % with a callback on every vsync); at
     thirty, in the loop, the callback stays on every vsync and draws every other one (2.8 % against 4.1 % for the
     timer, whose stopping and starting the frame pipeline thirty times a second cost more than it saved). */
  function tick(now) {
    raf = 0;
    if (last && now - last < 1000 / fps - 2) { raf = requestAnimationFrame(tick); return; }
    const idle = !crowd && now - lastInput > IDLE_AFTER, want = F >= 0 || idle ? 1 : 0;
    const dt = last ? Math.min(.1, (now - last) / 1000) : 1 / fps; last = now;
    A += dt;
    I = clamp(I + (want - I) * Math.min(1, dt * (want ? 1.2 : 2.6)));
    if (want || I > .005) T = (T + dt) % LOOP; else T = 0; // the loop starts from its first beat each time it comes back
    if (F >= 0) { F += dt / 3.4; if (F >= 1) F = -1; }
    fps = want || I > .01 ? 30 : 15;
    draw();
    if (fps === 30) raf = requestAnimationFrame(tick);
    else timer = setTimeout(() => { timer = 0; raf = requestAnimationFrame(tick); }, Math.max(0, last + 1000 / fps - 8 - performance.now()));
  }
  const covered = () => crowd && veilAt > .98;
  function run() { if (!alive || !scene || raf || timer || hidden() || covered()) return; if (reduced()) { draw(); return; } last = 0; raf = requestAnimationFrame(tick); }
  function halt() { if (raf) cancelAnimationFrame(raf); clearTimeout(timer); raf = timer = 0; }

  const ready = import(MODS[id] + "?v=" + build).then(m => {
    if (!alive) return;
    scene = m.default(KIT, id); scene.bind(g);
    if (scene.clear) { listW = 0; document.documentElement.dataset.sceneClear = ""; } else if (scene.list) listW = scene.list; // it keeps out of the words' way
    wash(scene.wash || weight); if (scene.veil) { veilAt = scene.veil; paintVeil(); }
    size();
    if (scene.words) { const shell = document.getElementById("shell"); if (shell) { watch = new MutationObserver(remeasure); watch.observe(shell, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "hidden", "style"] }); } addEventListener("resize", remeasure); addEventListener("scroll", remeasure, opt); measure(); }
    draw();
    requestAnimationFrame(() => { if (alive) hs.opacity = "1"; });
    run();
  }).catch(() => { /* no scene: the kit's own ground shows, as with the setting off */ });

  return {
    /** the day is done: the scene's own moment, then back to where it was */
    finale() { if (!scene || reduced()) return; F = 0; if (timer) { halt(); run(); } else run(); }, // now, not after a quiet frame's wait
    /** a change of reduced motion: a still frame, or the loop again */
    motion() { halt(); if (scene) { draw(); run(); } },
    /** the page is full of words (Everything) or not (Today): the veil, and whether the loop may play */
    busy(on) { crowd = !!on; paintVeil(); clearTimeout(coverT); if (covered()) coverT = setTimeout(() => { if (covered()) halt(); }, 520); else run(); },
    /** a given moment, drawn once and held: the loop's time, how idle, the wall clock, the finale (tools/scene-frames.mjs) */
    seek(t, i = 1, a = A, f = -1) { halt(); T = t; I = i; A = a; F = f; if (scene) draw(); },
    /** as if nothing had been touched for the twenty seconds (the suite's way in; see app.js's __tfTest) */
    leaveAlone() { lastInput = performance.now() - IDLE_AFTER - 1; run(); },
    ready,
    state() { return { id, idle: I > .5, level: +I.toFixed(2), finale: F >= 0, frames, fps: raf || timer ? fps : 0, running: !!(raf || timer), busy: crowd, px: PXS, size: [W, H], t: +T.toFixed(2), spot: scene && scene.spot ? scene.spot() : null }; }, // spot: where a scene that keeps to the empty page has settled
    stop() {
      alive = false; halt(); clearTimeout(resizeT); clearTimeout(coverT);
      INPUTS.forEach(t => removeEventListener(t, touched, opt));
      document.removeEventListener("visibilitychange", onVis); removeEventListener("resize", onResize);
      if (watch) watch.disconnect(); removeEventListener("resize", remeasure); removeEventListener("scroll", remeasure, opt); cancelAnimationFrame(wordsF);
      host.className = ""; host.textContent = ""; host.hidden = true; delete document.documentElement.dataset.scene; delete document.documentElement.dataset.sceneClear;
      for (const p of ["position", "inset", "pointerEvents", "zIndex", "overflow", "opacity", "transition"]) hs[p] = "";
    },
  };
}
