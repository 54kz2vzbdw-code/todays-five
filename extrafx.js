// extrafx.js — what an Extra kit (1.12 b262) draws that no other kit does: the material ground behind the words, and
// the finale drawn for it. Loaded by app.js only when one of those kits is the theme that is on, so a device that
// never unlocked never asks for it (COMPATIBILITY.md §6: asked for with the page's build, precached beside it).
// Nothing here touches the document, the registry or the server.
//
// THE GROUND IS ONE PICTURE, BUILT ONLY FROM THE KIT'S GRAIN. A kit declares `grain`, at most six hexes, and the
// ground is an SVG composed of those colours and nothing else: flat fills, gradients between two of them, blurs
// and opacities over them. Every pixel that comes out is therefore a channel-wise mix of grain colours, and its
// luminance sits between the darkest and the lightest grain — which is what lets test/theme.test.js hold the
// grain to the kit's contrast floors with a flat hex, the way every other token is held, and what
// tools/grain.mjs rasterises this picture to confirm. A ground that could not keep that rule would have to lose
// contrast, never the words.
//
// It is a data: URI on #field (img-src allows data:, which is also why the strike's rough edge is one), sized
// to cover, and it does not move: nothing here animates, so a list left on screen all day costs the compositor
// nothing and reduced motion has nothing to still. The dust, the haze and the ghost of what was erased are all
// in the picture.

/** The module's own stylesheet, asked for with the page's build (COMPATIBILITY.md §6) and only once. */
function linkCss(build) {
  if (document.querySelector("link[data-extrafx]")) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "extrafx.css" + (build ? "?v=" + build : ""); l.dataset.extrafx = "1";
  document.head.appendChild(l);
}

/* A speckle: turbulence quantised to solid-or-clear alpha, then filled with one grain colour, so the dust is that
   colour exactly where it lands and nothing where it does not. `cut` is the fraction of the field that is dust. */
function speckle(id, f, cut, seed, colour) {
  const table = Array.from({ length: 10 }, (_, i) => (i / 10 < 1 - cut ? 0 : 1)).join(" ");
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="3" seed="${seed}"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.9 0.9 0.9 0 -0.55"/><feComponentTransfer><feFuncA type="discrete" tableValues="${table}"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/><feFlood flood-color="${colour}"/><feComposite in2="SourceGraphic" operator="in" result="fill"/><feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="3" seed="${seed}"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.9 0.9 0.9 0 -0.55"/><feComponentTransfer><feFuncA type="discrete" tableValues="${table}"/></feComponentTransfer><feComposite in="fill" operator="in"/></filter>`;
}

/** The ground for a kit, as an SVG document string. Exported so tools/grain.mjs and the browser suite rasterise
    exactly what the page shows. Every colour in it is one of `kit.grain`. */
export function groundSvg(kit) {
  const g = kit.grain || [kit.colors.ink];
  const [g0, g1 = g0, g2 = g1, g3 = g2] = g;
  const W = 1600, H = 1000;
  if (kit.field === "whiteboard") {
    // a bright board: a diagonal sheen band, the ghost of a marker smudge that did not quite wipe, dim corners
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
      `<defs><linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g0}"/><stop offset=".38" stop-color="${g0}"/><stop offset=".5" stop-color="${g1}"/><stop offset=".62" stop-color="${g0}"/><stop offset="1" stop-color="${g0}"/></linearGradient>` +
      `<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="${g0}" stop-opacity="0"/><stop offset="1" stop-color="${g2}"/></radialGradient>` +
      `<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="34"/></filter></defs>` +
      `<rect width="${W}" height="${H}" fill="url(#sheen)"/><rect width="${W}" height="${H}" fill="url(#vig)" opacity=".7"/>` +
      `<path d="M 260 720 C 520 560, 760 640, 1040 470 S 1380 380, 1500 300" fill="none" stroke="${g3}" stroke-width="150" stroke-linecap="round" opacity=".55" filter="url(#soft)"/>` +
      `<path d="M 90 250 C 300 190, 520 330, 720 250 S 980 150, 1180 210" fill="none" stroke="${g2}" stroke-width="70" stroke-linecap="round" opacity=".38" filter="url(#soft)"/>` +
      `</svg>`;
  }
  // the board: slate under a haze of dust that gathers low, the ghost of a wide erase across the middle, dust motes
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<defs><radialGradient id="haze" cx=".5" cy=".92" r=".9"><stop offset="0" stop-color="${g2}"/><stop offset=".55" stop-color="${g1}"/><stop offset="1" stop-color="${g0}"/></radialGradient>` +
    `<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="40"/></filter>` +
    speckle("dust", 0.55, 0.16, 11, g3) + speckle("motes", 0.9, 0.05, 5, g3) + `</defs>` +
    `<rect width="${W}" height="${H}" fill="url(#haze)"/>` +
    `<path d="M 180 430 C 500 380, 900 520, 1420 420" fill="none" stroke="${g3}" stroke-width="170" stroke-linecap="round" opacity=".38" filter="url(#soft)"/>` +
    `<path d="M 100 700 C 400 760, 700 660, 980 720" fill="none" stroke="${g2}" stroke-width="120" stroke-linecap="round" opacity=".5" filter="url(#soft)"/>` +
    `<rect width="${W}" height="${H}" filter="url(#dust)" opacity=".42"/><rect width="${W}" height="${H}" filter="url(#motes)" opacity=".7"/>` +
    `</svg>`;
}
export function groundUrl(kit) { return "data:image/svg+xml," + encodeURIComponent(groundSvg(kit)); }

/** The ground inside `host`: the kit's base colour under its picture, behind the words. Returns { stop }. */
export function createGround(host, kit, { build = "" } = {}) {
  if (!host || !kit) return { stop() {} };
  linkCss(build);
  host.className = "ground";
  host.style.backgroundColor = (kit.grain && kit.grain[0]) || kit.colors.ink;
  host.style.backgroundImage = `url("${groundUrl(kit)}")`;
  host.hidden = false;
  return {
    stop() { host.className = ""; host.style.backgroundColor = ""; host.style.backgroundImage = ""; host.hidden = true; host.innerHTML = ""; }
  };
}

/* ---------------- the finales ---------------- */

/** Chalkboard: a felt eraser sweeps the board in three passes, each leaving a band of haze that settles, and dust
    goes up as it lifts. The line then writes itself (extrafx.css). Drawn on the confetti canvas through fx.scene(). */
function eraser(fx, { w, h }, kit) {
  const haze = (kit.grain && kit.grain[3]) || "#33463F";
  const [hr, hg, hb] = [1, 3, 5].map(i => parseInt(haze.slice(i, i + 2), 16));
  const T = 2.1, passes = 3, top = h * 0.22, span = h * 0.5;
  const ew = Math.min(w * 0.16, 180), eh = Math.min(h * 0.055, 44);
  const at = t => { // where the eraser is at t: left→right, right→left, left→right, sinking a band each pass
    const p = Math.min(1, Math.max(0, t / T)) * passes, i = Math.min(passes - 1, Math.floor(p)), f = p - i;
    const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    const x = i % 2 ? w * (0.92 - 0.84 * e) : w * (0.08 + 0.84 * e), y = top + span * ((i + f) / passes);
    return { x, y, i, f };
  };
  fx.scene((g, t) => {
    if (t > T + 1.1) return false;
    const fade = t > T + 0.4 ? Math.max(0, 1 - (t - T - 0.4) / 0.7) : 1;
    // the haze the passes have laid down so far: one band per pass, up to where the eraser is
    for (let i = 0; i < passes; i++) {
      const done = Math.min(1, Math.max(0, t / T * passes - i));
      if (done <= 0) continue;
      const y0 = top + span * (i / passes), y1 = top + span * ((i + 1) / passes);
      const from = i % 2 ? w * 0.92 - w * 0.84 * done : w * 0.08, to = i % 2 ? w * 0.92 : w * 0.08 + w * 0.84 * done;
      const grd = g.createLinearGradient(0, y0, 0, y1);
      grd.addColorStop(0, `rgba(${hr},${hg},${hb},0)`); grd.addColorStop(0.5, `rgba(${hr},${hg},${hb},${0.42 * fade})`); grd.addColorStop(1, `rgba(${hr},${hg},${hb},0)`);
      g.fillStyle = grd; g.fillRect(from, y0 - eh, to - from, y1 - y0 + eh * 2);
    }
    if (t < T) {
      const { x, y, i } = at(t), tilt = (i % 2 ? -1 : 1) * 0.08;
      g.save(); g.translate(x, y); g.rotate(tilt); g.globalAlpha = 0.96;
      g.fillStyle = "#2B2B2B"; roundRect(g, -ew / 2, -eh / 2 - eh * 0.55, ew, eh * 0.6, 4); g.fill();                  // the wooden back
      g.fillStyle = "#D9D7CC"; roundRect(g, -ew / 2, -eh / 2, ew, eh, 5); g.fill();                                       // the felt
      g.fillStyle = `rgba(${hr},${hg},${hb},.55)`; roundRect(g, -ew / 2 + 6, eh * 0.18, ew - 12, eh * 0.26, 3); g.fill();  // its dusty edge
      g.restore();
    }
    return true;
  });
  // the dust: a puff as each pass ends, and a cloud as the eraser lifts
  for (let i = 1; i <= passes; i++) setTimeout(() => { const { x, y } = at((i / passes) * T - 0.01); fx.burst(x, y, 22, 7, 2.4); }, (i / passes) * T * 1000 - 40);
  setTimeout(() => fx.burst(w * 0.5, h * 0.62, 70, 11, 6.283), T * 1000 + 60);
}

/** Whiteboard: one big marker check drawn across the board, stroke by stroke, translucent where it crosses the
    words, held, then wiped. */
function marker(fx, { w, h }, kit) {
  const c = kit.colors.accent, [r, gg, b] = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const A = [w * 0.30, h * 0.54], B = [w * 0.45, h * 0.72], C = [w * 0.74, h * 0.34];
  const L1 = Math.hypot(B[0] - A[0], B[1] - A[1]), L2 = Math.hypot(C[0] - B[0], C[1] - B[1]), L = L1 + L2;
  const DRAW = 0.62, HOLD = 2.2, END = 3.0, lw = Math.min(w, h) * 0.05;
  fx.scene((g, t) => {
    if (t > END) return false;
    const p = Math.min(1, t / DRAW), ease = 1 - Math.pow(1 - p, 2), d = ease * L;
    const fade = t > HOLD ? Math.max(0, 1 - (t - HOLD) / (END - HOLD)) : 1;
    g.save(); g.globalCompositeOperation = "multiply"; g.globalAlpha = 0.78 * fade;
    g.strokeStyle = `rgb(${r},${gg},${b})`; g.lineWidth = lw; g.lineCap = "round"; g.lineJoin = "round";
    g.beginPath(); g.moveTo(A[0], A[1]);
    if (d <= L1) { const f = d / L1; g.lineTo(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f); }
    else { const f = (d - L1) / L2; g.lineTo(B[0], B[1]); g.lineTo(B[0] + (C[0] - B[0]) * f, B[1] + (C[1] - B[1]) * f); }
    g.stroke();
    if (t > HOLD) { // the wipe: a band of the board's own white crossing it — nothing here is a colour outside the grain
      const x = w * (0.2 + 0.7 * (t - HOLD) / (END - HOLD));
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 0.9;
      const grd = g.createLinearGradient(x - lw * 3, 0, x + lw * 3, 0);
      grd.addColorStop(0, "rgba(251,251,250,0)"); grd.addColorStop(0.5, "rgba(251,251,250,.9)"); grd.addColorStop(1, "rgba(251,251,250,0)");
      g.fillStyle = grd; g.fillRect(x - lw * 3, h * 0.25, lw * 6, h * 0.55);
    }
    g.restore();
    return true;
  });
  setTimeout(() => fx.burst(C[0], C[1], 26, 10, 2.2), DRAW * 1000);
}

function roundRect(g, x, y, w, h, r) {
  if (g.roundRect) { g.beginPath(); g.roundRect(x, y, w, h, r); return; }
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** The finale an Extra kit names. Returns true when it played one, false for a name it does not know. */
export function finale(kind, fx, opts = {}) {
  const geom = { w: opts.w || (typeof innerWidth === "number" ? innerWidth : 1440), h: opts.h || (typeof innerHeight === "number" ? innerHeight : 900) };
  const kit = opts.kit || { colors: { accent: "#2457C5" }, grain: [] };
  if (kind === "eraser") { eraser(fx, geom, kit); return true; }
  if (kind === "marker") { marker(fx, geom, kit); return true; }
  return false;
}
