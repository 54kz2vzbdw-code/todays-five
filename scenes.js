// scenes.js — 1.12 b318: Scenes, a picture behind the list for the kits that have one, when this device's Scenes setting
// is on. app.js loads it only then (paintField): nothing of it is on the first paint, and a page with the setting off
// never asks for it or runs it (the worker precaches it like every module, so a page open across a deploy still gets
// its own build's). A scene is drawn in whole pixels on a small canvas, about 190 tall, scaled up crisp.
//
// Two moods. While the list is in use the scene is nearly still: stars, a firefly now and then (at thirty frames a
// second since 1.12 b391, as the loop: fifteen read as a stutter).
// Left alone for twenty seconds on Today it plays its fifteen-second loop, choreographed beat by beat, at 30, and eases
// back the moment anything is touched; Everything, a page of words, keeps it quiet behind a veil. The finale has a
// moment of its own. prefers-reduced-motion gets one still frame; a hidden page gets nothing at all; a panel over the
// page holds it still (1.12 b395). Each scene is its own module (scene-<id>.js), handed the drawing kit below; the
// words' side of it is scenes.css.
//
// 1.12 b367: the forever cycle. Left alone, a scene no longer plays one fifteen-second loop over and over: each time
// round is a pass, and the scene deals each pass its own — which of its beats play and when, from which side, in which
// colours, now and then a rare one — so it never shows the same fifteen seconds twice running. The stage counts the
// passes (`P`, the fifth thing `draw` is handed): the count moves on each time the loop comes round, and each time the
// loop starts again after the list was used, so every stretch left alone opens on a pass not seen yet. A scene that
// carries its picture from one pass into the next (`carry`: what a pass drew stays up through the quiet after it) plays
// a pass cut short again from its start instead, so its picture never jumps. Pass 0 is the scene's signature loop, the
// first of every visit; the passes after it are the visit's own, dealt from a number taken from the wall clock when the
// scene comes up, so no two visits go the same way. Every pass begins and ends in the scene's resting picture (for a
// scene that carries, the one the pass before it left), so any pass can follow any other.

export const LOOP = 15;
const IDLE_AFTER = 20000;
const MODS = { forest: "./scene-forest.js", harbor: "./scene-harbor.js", paper: "./scene-papercut.js", midnight: "./scene-papercut.js", teletype: "./scene-flap.js", terminal: "./scene-demo.js", light: "./scene-orbit.js", dark: "./scene-orbit.js", sunset: "./scene-bay.js", dusk: "./scene-bay.js", arcade: "./scene-arcade.js", sketch: "./scene-sketch.js", blush: "./scene-bubbles.js", pink: "./scene-heart.js", cocoa: "./scene-cocoa.js", ember: "./scene-ember.js", birthday: "./scene-party.js", superpink: "./scene-party.js", whiteboard: "./scene-board.js", chalkboard: "./scene-board.js", bark: "./scene-wood.js", char: "./scene-wood.js" }; // a pair can share one world
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
/** a pass's own dice: the same pass of the same visit always deals the same, so any moment of any pass can be held
 *  (tools/scene-lab.html) and a scene that carries can work out the picture the pass before left; `salt` keeps a scene's
 *  dealers apart */
let VISIT = 1;
const deal = (P, salt = 0) => rng(Math.imul(VISIT, 0x9E3779B1) ^ Math.imul(P + 1, 0x85EBCA6B) ^ Math.imul(salt + 1, 0xC2B2AE35));
/** a pass's pick from a pool of `n` (the signature, pass 0, has the first): each run of n passes after it deals the whole
 *  pool once, in an order of its own, and never the same one twice running — worked out from the pass alone */
const bag = (P, n, salt = 0) => {
  if (P <= 0 || n < 2) return 0;
  if (n === 2) return P % 2;
  const k = Math.floor((P - 1) / n), order = j => { const r = deal(-1000 - j, salt), a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const q = Math.floor(r() * (i + 1)); [a[i], a[q]] = [a[q], a[i]]; } return a; };
  const a = order(k), before = k > 0 ? order(k - 1)[n - 1] : 0; // the pass before this run: the last of the one before (a swap never reaches it), or the signature
  if (a[0] === before) [a[0], a[1]] = [a[1], a[0]];
  return a[(P - 1) % n];
};
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
export const KIT = { LOOP, deal, bag, clamp, lerp, E, spring, seg, env, rng, dith, rgb, mixc, css, canvas, paint, noise1, fbm, glowSpr, pine, sprite, layer, partial, boil, grain };

/* ---------------- the stage ---------------- */
/** The words' side of it (scenes.css), asked for with the page's build (COMPATIBILITY.md §6), and only once. */
function linkCss(build) {
  if (document.querySelector("link[data-scenes]")) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "scenes.css" + (build ? "?v=" + build : ""); l.dataset.scenes = "1";
  document.head.appendChild(l);
}
/** Mount scene `id` in `host` (#field). Returns { stop, finale, state }; stop() leaves the host as it found it. */
export function createScene(host, id, { build = "", reduced = () => false, ink = "#000000", busy = false, visit = 0 } = {}) {
  let alive = true, scene = null, raf = 0, last = 0, T = 0, I = 0, A = 12, F = -1, P = 0, frames = 0, fps = 30, lastInput = performance.now();
  VISIT = visit || Math.floor(Date.now() / 1000) % 999983 + 1; // this visit's sequence of passes (b367)
  let W = 0, H = 0, PXS = 4, resizeT = 0, coverT = 0, crowd = !!busy, veilAt = .5, shaded = 0, shadeT = 0, shadeWatch = null;
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
  // 1.12 b330: a scene that asks (`hug`) has the pad under the list hug each line's words instead of spanning the page, so
  // the rest of its picture keeps its colour; the pads are laid here, over the picture and under the veil
  const hugs = document.createElement("div"), hsd = hugs.style; hsd.position = "absolute"; hsd.inset = "0";
  host.append(bd, cv, scrim, hugs, veil);
  linkCss(build); document.documentElement.dataset.scene = id;

  const touched = () => { lastInput = performance.now(); };
  const opt = { capture: true, passive: true };
  const INPUTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"];
  INPUTS.forEach(t => addEventListener(t, touched, opt));
  const hidden = () => document.visibilityState === "hidden";
  const onVis = () => { if (hidden()) halt(); else run(); };
  document.addEventListener("visibilitychange", onVis);
  /* 1.12 b395: a panel over the page. Every panel is a modal dialog, and all but a wide screen's small ⋯ popover dim and
     blur the page behind them. Under one the picture holds still: through the blur there is nothing to see move, and a
     moving picture has the blur worked out again every frame (twice while a panel folds away over its blurred scrim).
     Walking the menus over Arcade (⋯, Settings, Appearance and back, three times), Chrome's GPU process ran at 17.5 % of
     a core against 9.6 % with Scenes off; held, 10.6 %. Under a popover, which blurs nothing, the picture holds once it
     has come to rest. It goes on a moment after the last panel closes, once the fold is done. */
  const held = () => shaded === 2 || (shaded === 1 && I <= .005 && F < 0);
  const reshade = () => {
    let s = 0; for (const d of document.querySelectorAll("dialog[open]")) s = Math.max(s, d.classList.contains("pop") ? 1 : 2);
    if (s === shaded) return; shaded = s; clearTimeout(shadeT);
    if (held()) halt(); else if (!s) shadeT = setTimeout(run, 260); else run();
  };
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(() => { if (alive && scene) { size(); draw(); } }, 150); };
  addEventListener("resize", onResize);
  /* 1.12 b328: a scene that keeps to the empty part of the page (its `words(rects)`) is told where the words are: each
     line's text and its tools, the pills, the date, the count, a section's name and count in Everything (b339), the keyboard line and the finale's
     words, in CSS pixels, measured again (once a frame at most) whenever the page's words change, move or scroll. */
  let wordsF = 0, watch = null;
  const measure = () => {
    wordsF = 0; if (!alive || !scene || !(scene.words || scene.hug)) return;
    const out = [], lines = [], range = document.createRange(), shell = document.getElementById("shell"); if (!shell) return;
    for (const el of shell.querySelectorAll(".row .tx, .row .tool, .chip, .seg, .add, .sec-toggle, .sec-count, #date, #count, #hint, #finale > span")) {
      if (el.classList.contains("tx")) range.selectNodeContents(el);
      const b = el.classList.contains("tx") ? range.getBoundingClientRect() : el.getBoundingClientRect();
      const kind = el.matches(".tx, .sec-toggle, .sec-count") ? 1 : el.classList.contains("tool") ? 2 : 0; /* 1 for a line's words, and a section's name and count, which read like one (b339); 2 for a line's tools (there when it is hovered); 0 the rest */
      if (b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight) out.push([b.left, b.top, b.right, b.bottom, kind]);
      if (scene.hug && b.width > 0 && (kind === 1 || (scene.hugFinale && el.matches("#finale > span")))) lines.push(b); /* a scene can have the finale's words hugged too */
    }
    if (scene.words) scene.words(out);
    if (scene.hug) {
      while (hugs.children.length < lines.length) { const d = document.createElement("div"), st = d.style; st.position = "absolute"; st.borderRadius = "40px"; st.background = k(typeof scene.hug === "number" ? scene.hug : .72); st.filter = "blur(14px)"; /* a scene can ask for a darker pad */ hugs.appendChild(d); }
      [...hugs.children].forEach((d, i) => { const b = lines[i], st = d.style; if (!b) { st.display = "none"; return; } st.display = ""; st.left = b.left - 30 + "px"; st.top = b.top - 14 + "px"; st.width = b.width + 60 + "px"; st.height = b.height + 28 + "px"; });
    }
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
  function draw() { g.globalAlpha = 1; scene.draw(T, I, A, F, P); frames++; }
  /* One cadence (1.12 b391): the callback stays on every vsync and draws every other one, thirty frames a second, in
     the loop and quiet alike. Quiet ran at fifteen until then, on a timer that woke half a display frame before each
     frame was due (1.6 % of a core against 2.4 % for a callback on every vsync), but fifteen read as a stutter in the
     twenty seconds before the loop began. In use a scene now costs one to two points of a core more on the page's own
     thread, two to eight across all of Chrome's processes (tools/idle.mjs `USE=5`, 15 against 30). At thirty the timer
     was the dearer way: stopping and starting the frame pipeline thirty times a second cost more than it saved (4.1 %
     against 2.8 %). */
  function tick(now) {
    raf = 0;
    if (last && now - last < 1000 / fps - 2) { raf = requestAnimationFrame(tick); return; }
    const idle = !crowd && now - lastInput > IDLE_AFTER, want = F >= 0 || idle ? 1 : 0;
    const dt = last ? Math.min(.1, (now - last) / 1000) : 1 / fps; last = now;
    A += dt;
    I = clamp(I + (want - I) * Math.min(1, dt * (want ? 1.2 : 2.6)));
    // the loop starts from its first beat each time it comes back; the pass moves on each time round, and when the
    // loop comes back after the list was used (b367) — but a pass cut short in a scene that carries plays again
    if (want || I > .005) { T += dt; if (T >= LOOP) { T -= LOOP; P++; } } else { if (T > 0 && !scene.carry) P++; T = 0; }
    if (F >= 0) { F += dt / 3.4; if (F >= 1) F = -1; }
    draw();
    if (held()) return; // under a panel, at rest (b395)
    raf = requestAnimationFrame(tick);
  }
  const covered = () => (crowd && veilAt > .98) || held();
  function run() { if (!alive || !scene || raf || hidden() || covered()) return; if (reduced()) { draw(); return; } last = 0; raf = requestAnimationFrame(tick); }
  function halt() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  const ready = import(MODS[id] + "?v=" + build).then(m => {
    if (!alive) return;
    scene = m.default(KIT, id); scene.bind(g);
    if (scene.clear) { listW = 0; document.documentElement.dataset.sceneClear = ""; } else if (scene.list) listW = scene.list; // it keeps out of the words' way
    if (scene.hug) document.documentElement.dataset.sceneClear = ""; // the list's pad gives way to one hugging each line
    wash(scene.wash || weight); if (scene.veil) { veilAt = scene.veil; paintVeil(); }
    size();
    if (scene.words || scene.hug) { const shell = document.getElementById("shell"); if (shell) { watch = new MutationObserver(remeasure); watch.observe(shell, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "hidden", "style"] }); } addEventListener("resize", remeasure); addEventListener("scroll", remeasure, opt); measure(); }
    shadeWatch = new MutationObserver(reshade); shadeWatch.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] }); reshade(); // (b395; Scenes are turned on in a panel)
    draw();
    requestAnimationFrame(() => { if (alive) hs.opacity = "1"; });
    run();
  }).catch(() => { /* no scene: the kit's own ground shows, as with the setting off */ });

  return {
    /** the day is done: the scene's own moment, then back to where it was */
    finale() { if (!scene || reduced()) return; F = 0; run(); }, // from the next frame
    /** a change of reduced motion: a still frame, or the loop again */
    motion() { halt(); if (scene) { draw(); run(); } },
    /** the page is full of words (Everything) or not (Today): the veil, and whether the loop may play */
    busy(on) { crowd = !!on; paintVeil(); clearTimeout(coverT); if (covered()) coverT = setTimeout(() => { if (covered()) halt(); }, 520); else run(); },
    /** a given moment, drawn once and held: the loop's time, how idle, the wall clock, the finale, the pass (tools/scene-frames.mjs) */
    seek(t, i = 1, a = A, f = -1, p = P) { halt(); T = t; I = i; A = a; F = f; P = p; if (scene) draw(); },
    /** from here on, pass `p` of visit `v` (the instruments' way to measure the same passes each run; b367) */
    pass(p = 0, v = VISIT) { P = p; VISIT = v; },
    /** as if nothing had been touched for the twenty seconds (the suite's way in; see app.js's __tfTest) */
    leaveAlone() { lastInput = performance.now() - IDLE_AFTER - 1; run(); },
    ready,
    state() { return { id, idle: I > .5, level: +I.toFixed(2), finale: F >= 0, frames, fps: raf ? fps : 0, running: !!raf, busy: crowd, shaded, px: PXS, size: [W, H], t: +T.toFixed(2), pass: P, carry: !!(scene && scene.carry), spot: scene && scene.spot ? scene.spot() : null, info: scene && scene.info ? scene.info() : null }; }, // spot: where a scene that keeps to the empty page has settled; info: what a scene tells the instruments of itself (b397)
    stop() {
      alive = false; halt(); clearTimeout(resizeT); clearTimeout(coverT); clearTimeout(shadeT); if (shadeWatch) shadeWatch.disconnect();
      INPUTS.forEach(t => removeEventListener(t, touched, opt));
      document.removeEventListener("visibilitychange", onVis); removeEventListener("resize", onResize);
      if (watch) watch.disconnect(); removeEventListener("resize", remeasure); removeEventListener("scroll", remeasure, opt); cancelAnimationFrame(wordsF);
      host.className = ""; host.textContent = ""; host.hidden = true; delete document.documentElement.dataset.scene; delete document.documentElement.dataset.sceneClear;
      for (const p of ["position", "inset", "pointerEvents", "zIndex", "overflow", "opacity", "transition"]) hs[p] = "";
    },
  };
}
