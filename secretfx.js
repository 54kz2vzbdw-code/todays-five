// secretfx.js — the two things the Secret pair (1.6) draws that no other kit does: Superpink's sparkle field, the
// layer that twinkles behind the words all day, and the two finales (Superpink's bloom, Birthday's cake).
// Loaded by app.js only when one of those kits is the theme that is on, so a device that never unlocked never asks
// for it. Nothing here touches the document, the registry or the server.
//
// The field is CSS, not a frame loop: twenty-six two-element twinkles animating opacity, scale and a translate, all
// of which the compositor owns, so a list left on screen all day costs no main thread. Its rules (#field, in
// styles.css) ship with the stylesheet rather than being built here: a <style> element made at runtime is inline
// style, which this app's CSP refuses. Nothing renders until this module fills #field, and #field is hidden until
// then, so a device that never unlocked pays for nine rules it never matches.

const N = 26;

/** A twinkling background layer inside `host`. `palette` is the kit's confetti list; `reduced` a getter.
    Returns { stop } — it removes the twinkles and its listeners and leaves the host empty. */
export function createField(host, { palette = ["#FFFFFF"], reduced = () => false } = {}) {
  if (!host) return { stop() {} };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < N; i++) {
    const el = document.createElement("i"), dot = document.createElement("b");
    const s = rnd(1.4, 3.4);
    el.style.setProperty("--x", rnd(0, 100).toFixed(2) + "vw");
    el.style.setProperty("--y", rnd(0, 100).toFixed(2) + "vh");
    el.style.setProperty("--mx", rnd(-7, 7).toFixed(2) + "vw");   // where it drifts to, and back, over a minute or two
    el.style.setProperty("--my", rnd(-5, 5).toFixed(2) + "vh");
    el.style.setProperty("--dd", rnd(48, 96).toFixed(1) + "s");
    el.style.setProperty("--td", rnd(2.4, 6.4).toFixed(2) + "s");
    el.style.setProperty("--del", (-rnd(0, 8)).toFixed(2) + "s");  // negative: the field is already under way on the first frame
    el.style.setProperty("--s", s.toFixed(2) + "px");
    el.style.setProperty("--o", rnd(0.45, 0.9).toFixed(2));
    el.style.setProperty("--c", palette[(Math.random() * palette.length) | 0]);
    el.appendChild(dot); frag.appendChild(el);
  }
  host.appendChild(frag);
  host.hidden = false;

  const paintStill = () => host.classList.toggle("still", !!reduced());
  // hidden tab: the compositor stops on its own, but say so, so nothing is left ticking anywhere
  const paintVisible = () => host.classList.toggle("off", document.visibilityState === "hidden");
  paintStill(); paintVisible();
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", paintStill);
  document.addEventListener("visibilitychange", paintVisible);
  return {
    stop() {
      mq.removeEventListener("change", paintStill);
      document.removeEventListener("visibilitychange", paintVisible);
      host.className = ""; host.hidden = true; host.innerHTML = "";
    }
  };
}

/* ---------------- the finales ---------------- */

/** Superpink: a full-screen bloom — the centre opens, a ring goes up around it, and a pink flare washes out. */
function bloom(fx, { w, h }) {
  fx.burst(w * 0.5, h * 0.62, 64, 17, 2.9);
  for (let i = 0; i < 8; i++) setTimeout(() => fx.burst(w * (0.06 + 0.126 * i), h * (0.86 - (i % 2) * 0.10), 26, 18, 1.2), 90 + i * 55);
  setTimeout(() => fx.burst(w * 0.5, h * 0.42, 54, 12, 6.283), 320);
  setTimeout(() => fx.burst(w * 0.5, h * 0.5, 40, 9, 6.283), 620);
  fx.scene((g, t) => {                                            // the flare: two rings opening out of the middle
    if (t > 1.15) return false;
    const cx = w * 0.5, cy = h * 0.55, R = Math.max(w, h) * 0.75;
    for (const [d, col] of [[0, "255,46,154"], [0.16, "255,211,110"]]) {
      const p = (t - d) / 1.0; if (p <= 0 || p >= 1) continue;
      g.beginPath(); g.arc(cx, cy, R * p * p, 0, Math.PI * 2);
      g.strokeStyle = `rgba(${col},${(1 - p) * 0.5})`; g.lineWidth = 26 * (1 - p) + 2; g.stroke();
    }
    return true;
  });
}

/* Birthday: a round cake, five candles that blow out with a puff, then the cake opens into slices whose layers show.
   Drawn as plain paths on the same canvas the confetti uses — no images, no emoji (they are a different picture on
   every platform), no second system. */
const CAKE = {
  plate: "#F3E2EA", frostTop: "#FFF3F8", frostSide: "#FFD9EA", drip: "#FF7FC4",
  sponge: "#F7D774", cream: "#FFF6E4", band: "#FF7FC4", candle: "#B79BE8", candle2: "#7FC8F0",
  flame: "#FFC94A", flameHi: "#FFF3C4", wick: "#5B4A3F", smoke: "220,214,220"
};
function roundRect(g, x, y, w, h, r) {
  if (g.roundRect) { g.beginPath(); g.roundRect(x, y, w, h, r); return; }
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
/** One wedge of the cake, drawn in elevation at (0,0) = the middle of its base, so the layers read across the cut. */
function slab(g, halfW, H, layer) {
  const lay = [[CAKE.sponge, 0.34], [CAKE.cream, 0.14], [CAKE.sponge, 0.30], [CAKE.band, 0.06], [CAKE.frostSide, 0.16]];
  let y = 0;
  for (const [col, frac] of lay) {
    const hh = H * frac;
    g.fillStyle = col;
    g.fillRect(-halfW, y - hh, halfW * 2, hh + 0.6);
    y -= hh;
  }
  if (layer) { g.strokeStyle = "rgba(150,18,90,.20)"; g.lineWidth = 1; g.strokeRect(-halfW, -H, halfW * 2, H); }
}
function drawFlame(g, x, y, s, flicker, life) {
  const a = Math.max(0, Math.min(1, life));
  if (a <= 0) return;
  g.save(); g.translate(x, y); g.rotate(flicker * 0.22);
  g.globalAlpha = a;
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 0.62, -s * 0.9, 0, -s * 2.1); g.quadraticCurveTo(-s * 0.62, -s * 0.9, 0, 0);
  g.fillStyle = CAKE.flame; g.fill();
  g.beginPath(); g.moveTo(0, -s * 0.25); g.quadraticCurveTo(s * 0.26, -s * 0.85, 0, -s * 1.35); g.quadraticCurveTo(-s * 0.26, -s * 0.85, 0, -s * 0.25);
  g.fillStyle = CAKE.flameHi; g.fill();
  g.restore(); g.globalAlpha = 1;
}
function cake(fx, { w, h }) {
  // the cake's width; everything else is a fraction of it. It sits low and centred, in the gap between the last
  // line and the footer on both shapes of screen, so it never lands on top of the words.
  const S = Math.min(w * 0.5, h * 0.32);
  const cx = w * 0.5, base = h * 0.86;
  const H = S * 0.46, halfW = S * 0.5;
  const CANDLES = 5, OUT_AT = 1.45, CUT_AT = 2.5, END = 5.2;
  const flick = (i, t) => Math.sin(t * (7 + i * 1.7) + i) * Math.sin(t * 3.1 + i * 2);
  fx.scene((g, t) => {
    if (t > END) return false;
    const rise = Math.min(1, t / 0.42), ease = 1 - Math.pow(1 - rise, 3);
    const fade = t > END - 0.7 ? Math.max(0, (END - t) / 0.7) : 1;
    g.save(); g.globalAlpha = fade;
    g.translate(cx, base);
    g.scale(0.62 + 0.38 * ease, 0.62 + 0.38 * ease);
    // the plate
    g.fillStyle = CAKE.plate; g.beginPath(); g.ellipse(0, 6, halfW * 1.22, S * 0.055, 0, 0, Math.PI * 2); g.fill();
    // the cake: whole until the cut, then six wedges fanning out, each showing its layers across the cut
    const cut = t > CUT_AT ? Math.min(1, (t - CUT_AT) / 1.4) : 0;
    const n = 6, wedge = (halfW * 2) / n;
    for (let i = 0; i < n; i++) {
      const mid = -halfW + wedge * (i + 0.5);
      const push = cut * cut * (mid / halfW) * S * 0.42;
      g.save(); g.translate(mid + push, -cut * cut * S * 0.05); g.rotate(cut * (mid / halfW) * 0.14);
      slab(g, wedge / 2 + 0.4, H, cut > 0.05);
      g.restore();
    }
    if (cut < 0.05) {                                              // the frosted top, while it is still one cake
      g.fillStyle = CAKE.frostTop; g.beginPath(); g.ellipse(0, -H, halfW, S * 0.075, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = CAKE.drip;
      for (let i = 0; i < 9; i++) { const x = -halfW + (halfW * 2) * (i + 0.5) / 9; const d = S * (0.06 + 0.075 * Math.abs(Math.sin(i * 2.3))); roundRect(g, x - S * 0.026, -H - S * 0.01, S * 0.052, d, S * 0.026); g.fill(); }
    }
    // the candles: lit, then out one after another, each leaving a puff that climbs and spreads
    for (let i = 0; i < CANDLES; i++) {
      const x = -halfW * 0.66 + (halfW * 1.32) * i / (CANDLES - 1);
      const out = OUT_AT + i * 0.14;
      const gone = Math.max(0, Math.min(1, (t - out) / 0.22));
      const sink = cut * cut * S * 0.5;
      g.save(); g.translate(x, -H - sink); g.globalAlpha = fade * (1 - cut);
      g.fillStyle = i % 2 ? CAKE.candle2 : CAKE.candle;
      roundRect(g, -S * 0.022, -S * 0.20, S * 0.044, S * 0.20, S * 0.02); g.fill();
      g.strokeStyle = CAKE.wick; g.lineWidth = Math.max(1, S * 0.008);
      g.beginPath(); g.moveTo(0, -S * 0.20); g.lineTo(0, -S * 0.225); g.stroke();
      drawFlame(g, 0, -S * 0.225, S * 0.05, flick(i, t) * (1 - gone), 1 - gone);
      if (gone > 0 && gone < 1.0001 && t < out + 1.5) {            // the puff
        const p = Math.min(1, (t - out) / 1.5);
        for (let k = 0; k < 3; k++) {
          const r = S * (0.022 + 0.05 * p) * (1 + k * 0.35);
          g.beginPath(); g.arc(k === 1 ? S * 0.02 * p : -S * 0.018 * p * k, -S * 0.26 - S * 0.30 * p - k * S * 0.03, r, 0, Math.PI * 2);
          g.fillStyle = `rgba(${CAKE.smoke},${(1 - p) * 0.34})`; g.fill();
        }
      }
      g.restore();
    }
    g.restore(); g.globalAlpha = 1;
    return true;
  });
  // sprinkles: a handful as it lands, a shower as the candles go out, a last one as it opens
  fx.burst(w * 0.5, h * 0.52, 34, 12, 2.6);
  setTimeout(() => { for (let i = 0; i < 5; i++) setTimeout(() => fx.burst(w * (0.16 + 0.17 * i), h * 0.94, 22, 17, 1.15), i * 70); }, OUT_AT * 1000);
  setTimeout(() => fx.burst(w * 0.5, h * 0.58, 46, 13, 3.2), CUT_AT * 1000 + 120);
}

/** The finale a Secret kit names. Returns true when it played one, false for a name it does not know. */
export function finale(kind, fx, opts = {}) {
  const geom = { w: opts.w || (typeof innerWidth === "number" ? innerWidth : 1440), h: opts.h || (typeof innerHeight === "number" ? innerHeight : 900) };
  if (kind === "bloom") { bloom(fx, geom); return true; }
  if (kind === "cake") { cake(fx, geom); return true; }
  return false;
}
