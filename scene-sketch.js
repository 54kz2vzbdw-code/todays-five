// scene-sketch.js — 1.12 b332: Sketch's scene (scenes.js loads it). A drawing that draws itself, in the largest open space
// on the page: a hot-air balloon in pencil and watercolour, in a round vignette of pale sky, with a couple of clouds and a
// few birds. While the list is in use it floats, its lines boiling a little, as a hand-drawn thing does. The loop, fifteen
// seconds: an eraser scrubs the whole drawing out, crumbs flying, a ghost of it left on the paper; a pencil draws it again
// — a light guide, the envelope in one confident line, its seams, the ropes and the basket's weave, the shading hatched
// down one side, the clouds, the birds; a brush floods the sky in, then each gore of the envelope, the wet paint darker
// until it dries, flicking drops off as it goes; and the burner roars, the balloon lifts, the birds wheel, and it settles.
// The finale: the brush throws a burst of colour round it, the flame roars and it rises, and the pencil sketches stars.
// It keeps to the empty part of the page (scenes.js, `words`), so the words need no pad and no wash under them.
export default function sketch(K) {
  const { clamp, lerp, E, seg, env, rng, canvas, boil } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  const INK = [44, 44, 54];
  const PIG = { coral: [230, 82, 58], sun: [244, 178, 24], teal: [26, 146, 134], sky: [112, 164, 224], cloud: [140, 172, 220], wood: [176, 116, 58], steel: [110, 114, 128], flame: [252, 138, 30] };
  const rgba = (c, a, k = 1) => `rgba(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)},${clamp(a).toFixed(3)})`;
  // ---- the drawing, in units of its circle (radius 1, y down)
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
  const RIGHT = []; for (let i = 0; i <= 24; i++) RIGHT.push(bez([0, -.92], [.27, -.92], [.47, -.72], [.47, -.42], i / 24)); for (let i = 1; i <= 24; i++) RIGHT.push(bez([.47, -.42], [.47, -.12], [.23, .12], [.13, .3], i / 24));
  const hw = y => { if (y <= RIGHT[0][1]) return 0; for (let i = 1; i < RIGHT.length; i++) if (RIGHT[i][1] >= y) { const [x0, y0] = RIGHT[i - 1], [x1, y1] = RIGHT[i]; return lerp(x0, x1, (y - y0) / ((y1 - y0) || 1)); } return .13; };
  const Y0 = -.92, Y1 = .3, YS = Array.from({ length: 41 }, (_, i) => lerp(Y0, Y1, i / 40));
  const SEAMS = [-1, ...[1, 2, 3, 4, 5, 6, 7].map(k => Math.sin(Math.PI / 2 * (-1 + 2 * k / 8))), 1];
  const seam = s => YS.map(y => [s * hw(y), y]);
  const CONTOUR = [...RIGHT.slice().reverse().map(([x, y]) => [-x, y]), ...RIGHT.slice(1)];
  const GORES = SEAMS.slice(0, 8).map((s, k) => [...seam(s), ...seam(SEAMS[k + 1]).reverse()]);
  const GCOL = [PIG.teal, PIG.coral, PIG.sun, PIG.coral, PIG.sun, PIG.coral, PIG.sun, PIG.teal];
  const THROAT = [[-.13, .3], [.13, .3], [.125, .35], [-.125, .35], [-.13, .3]];
  const ROPES = [[[-.12, .35], [-.09, .52]], [[-.045, .35], [-.035, .52]], [[.045, .35], [.035, .52]], [[.12, .35], [.09, .52]]];
  const BURNER = [[-.035, .4], [.035, .4], [.035, .44], [-.035, .44], [-.035, .4]];
  const BASKET = [[-.1, .52], [.1, .52], [.1, .635], [.095, .655], [.08, .662], [-.08, .662], [-.095, .655], [-.1, .635], [-.1, .52]];
  const RIM = [[-.1, .545], [.1, .545]], WEAVE_V = [-.07, -.035, 0, .035, .07].map(x => [[x, .545], [x + .002, .657]]), WEAVE_H = Array.from({ length: 17 }, (_, i) => [-.1 + i * .0125, .6 + (i % 2 ? .006 : -.006)]);
  const inEnv = (x, y) => y > Y0 && y < Y1 && Math.abs(x) < hw(y);
  const hatch = (lo, dir, step) => { const out = []; for (let c = -1.2; c < 1.6; c += step) { let run = null; for (let y = Y0; y <= Y1; y += .008) { const x = c + dir * (y - Y0) * .75, ok = inEnv(x, y) && x > lo * hw(y); if (ok) { if (!run) run = [[x, y], [x, y]]; else run[1] = [x, y]; } else if (run) { if (run[1][1] - run[0][1] > .02) out.push(run); run = null; } } if (run && run[1][1] - run[0][1] > .02) out.push(run); } return out; };
  const HATCH = hatch(.42, -1, .034);
  const cloud = (cx, cy, w, bumps) => { const top = []; for (let i = 0; i <= 40; i++) { const x = cx - w / 2 + w * i / 40; let y = cy; for (const [bx, r] of bumps) { const d = x - (cx + bx); if (Math.abs(d) < r) y = Math.min(y, cy - Math.sqrt(r * r - d * d)); } top.push([x, y]); } return [...top, [cx + w / 2, cy], [cx - w / 2, cy]]; };
  const CLOUDS = [cloud(-.6, .12, .46, [[-.16, .07], [-.06, .1], [.06, .085], [.16, .06]]), cloud(.62, .5, .34, [[-.1, .05], [0, .075], [.1, .055]])];
  const BIRDS = [[.5, -.62, .05, 0], [.63, -.54, .04, 1.7], [.43, -.49, .034, 3.1]];
  const GUIDE = Array.from({ length: 49 }, (_, i) => { const a = i / 48 * TAU * 1.04 - 1.9; return [Math.cos(a) * .5, -.42 + Math.sin(a) * .53]; });
  // when each line is drawn: [points, start, end, width (px), strength]
  const STROKES = [[GUIDE, 2.0, 2.3, .7, .2], [CONTOUR, 2.35, 3.3, 1.4, .92]];
  SEAMS.slice(1, 8).forEach((s, k) => STROKES.push([seam(s), 3.35 + k * .13, 3.51 + k * .13, .95, .72]));
  STROKES.push([THROAT, 4.3, 4.45, 1, .85]); ROPES.forEach((r2, k) => STROKES.push([r2, 4.45 + k * .05, 4.5 + k * .05, .8, .8])); STROKES.push([BURNER, 4.65, 4.75, .9, .85]);
  STROKES.push([BASKET, 4.75, 4.98, 1.2, .9], [RIM, 4.98, 5.03, 1, .85]); WEAVE_V.forEach((w, k) => STROKES.push([w, 5.03 + k * .03, 5.06 + k * .03, .7, .6])); STROKES.push([WEAVE_H, 5.18, 5.28, .7, .6]);
  HATCH.forEach((h, k) => STROKES.push([h, 5.3 + k * .45 / HATCH.length, 5.36 + k * .45 / HATCH.length, .6, .34]));
  const CSTROKES = [[CLOUDS[0], 5.78, 5.98], [CLOUDS[1], 5.98, 6.14]];
  const ER0 = .4, ER1 = 1.8; // the eraser
  // the eraser's path: rows back and forth across the circle
  const EPATH = []; [-.78, -.4, 0, .4, .78].forEach((y, i) => { const xs = i % 2 ? [.92, -.92] : [-.92, .92]; for (let k = 0; k <= 20; k++) EPATH.push([lerp(xs[0], xs[1], k / 20), y + (k / 20 - .5) * .12]); });
  const EL = [0]; for (let i = 1; i < EPATH.length; i++) EL.push(EL[i - 1] + Math.hypot(EPATH[i][0] - EPATH[i - 1][0], EPATH[i][1] - EPATH[i - 1][1]));
  const along = (pts, L, p) => { const s = L[L.length - 1] * clamp(p); let i = 1; while (i < L.length - 1 && L[i] < s) i++; const f = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; };
  // the washes, in the order they're laid: [polygon, pigment, strength, start, end, where the brush drops it]
  const gx = k => (SEAMS[k] + SEAMS[k + 1]) / 2 * hw(-.62);
  const SKYPOLY = (() => { const n = K.noise1(5, 16); return Array.from({ length: 64 }, (_, i) => { const a = i / 64 * TAU, r = .97 * (1 + .045 * (n(i / 4) - .5)); return [Math.cos(a) * r, Math.sin(a) * r]; }); })();
  const WASH = [[SKYPOLY, PIG.sky, .24, 6.5, 7.05, [-.55, -.5]], [CLOUDS[0], PIG.cloud, .38, 8.35, 8.62, [-.6, .08], 0], [CLOUDS[1], PIG.cloud, .38, 8.5, 8.75, [.62, .47], 1],
    ...GORES.map((p, k) => [p, GCOL[k], .64, 6.95 + k * .17, 7.45 + k * .17, [gx(k), -.66]]), [BASKET, PIG.wood, .62, 8.7, 8.92, [0, .58]], [THROAT, PIG.steel, .45, 8.8, 8.95, [0, .32]]];
  const FLICKS = [7.35, 7.95, 8.45];
  const S = {
    res: "dpr",
    wash: 1.6, veil: 1, // a light kit (scenes.js)
    clear: true, // it keeps to the empty part of the page, so the words need no pad
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(53);
      Object.assign(S, { W, H, pr, Rmin: pr ? 30 : 36, Rmax: pr ? 150 : 250 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .3, 120) : Math.min(W * .15, H * .3); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .78 : H * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: pr ? H * .78 : H * .5, tR: R0 }); }
      // the splatters the brush flicks off, and the crumbs the eraser leaves: where they land is decided now
      S.drops = FLICKS.flatMap((t, f) => Array.from({ length: 5 }, () => { const a = r() * TAU, d = .5 + r() * .4; return { t: t + r() * .06, x: Math.cos(a) * d, y: Math.sin(a) * d * .9, s: .008 + r() * .016, c: GCOL[(f * 3 + Math.floor(r() * 8)) % 8] }; }));
      S.fin = Array.from({ length: 22 }, () => { const a = r() * TAU, d = .55 + r() * .38; return { x: Math.cos(a) * d, y: Math.sin(a) * d, s: .01 + r() * .022, c: [PIG.coral, PIG.sun, PIG.teal, PIG.sky][Math.floor(r() * 4)], t: r() * .12 }; });
      S.stars = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + (i - 2) * .55, d = .82; return { x: Math.cos(a) * d * (i % 2 ? 1.05 : .95), y: Math.sin(a) * d * .95 + .02, s: .05 + (i % 2) * .02, t: .18 + i * .07 }; });
      S.crumbs = Array.from({ length: 40 }, (_, i) => ({ e: i / 40 + r() * .02, vx: (r() - .5) * .5, vy: .02 + r() * .1, rot: r() * TAU, c: r() < .6 ? [205, 150, 150] : [150, 150, 158] }));
      S.jitter = null; S.RR = 0; // the caches are drawn for a size, and again if it changes much
      bg.fillStyle = "#F8F6F1"; bg.fillRect(0, 0, W, H);
      // the paper's tooth: faint fibres, and the sketchbook's squares
      const step = pr ? 18 : 22; bg.strokeStyle = "rgba(110,135,170,.12)"; bg.lineWidth = .6; bg.beginPath(); for (let x = (W % step) / 2; x < W; x += step) { bg.moveTo(x, 0); bg.lineTo(x, H); } for (let y = step; y < H; y += step) { bg.moveTo(0, y); bg.lineTo(W, y); } bg.stroke();
      if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the largest circle of empty page, clear of every word, the screen's edges, the
     *  header and the footer's pool; the drawing settles there, as big as the room allows, and glides when it changes */
    words(rects) {
      S.raw = rects; if (!S.W) return;
      const { W, H, pr } = S, gap = pr ? 14 : 26, top = pr ? 96 : 122, foot = H - (pr ? 104 : 128);
      let best = 0, bx = S.tx, by = S.ty;
      for (let gy2 = 0; gy2 <= 24; gy2++) for (let gx2 = 0; gx2 <= 32; gx2++) {
        const x = W * (.04 + .92 * gx2 / 32), y = top + (foot - top) * gy2 / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y);
        for (const [x0, y0, x1, y1] of rects) { rad = Math.min(rad, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)) - gap); if (rad <= best) break; }
        if (rad > best) { best = rad; bx = x; by = y; }
      }
      // the pencil and the brush are held from the side away from the words: from below when the words are above
      let near = null, nd = 1e9; for (const [x0, y0, x1, y1] of rects) { const qx = clamp(bx, x0, x1), qy = clamp(by, y0, y1), d = Math.hypot(qx - bx, qy - by); if (d < nd) { nd = d; near = [qx, qy]; } }
      S.toolAng = near && near[1] < by - Math.abs(near[0] - bx) * .5 ? .62 : -.62;
      Object.assign(S, { tx: bx, ty: by, tR: clamp(best, S.Rmin, S.Rmax), room: best >= S.Rmin ? 1 : 0 }); // no room at all: it fades away until there is
      if (!S.placed) { Object.assign(S, { cx: S.tx, cy: S.ty, R: S.tR }); S.placed = true; }
    },
    /** where it has settled, for the suite: its centre and size in CSS pixels */
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; }, // null: no room, so none shown
    /** the watercolour for one polygon, drawn once for a size: a wash with its edge darker where the pigment dried, a
     *  granular texture, a lighter bloom, its edge a little off the pencil line as a brush's is */
    washOf(poly, col, a, seed) {
      const RR = S.RR, rr = rng(seed), n = K.noise1(seed, 32);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [u, v] of poly) { x0 = Math.min(x0, u); y0 = Math.min(y0, v); x1 = Math.max(x1, u); y1 = Math.max(y1, v); }
      const m = .03; x0 -= m; y0 -= m; x1 += m; y1 += m;
      const [c, x] = canvas(Math.ceil((x1 - x0) * RR * px), Math.ceil((y1 - y0) * RR * px)); x.imageSmoothingEnabled = true;
      x.setTransform(px * RR, 0, 0, px * RR, -x0 * RR * px, -y0 * RR * px);
      const off = poly.map(([u, v], i) => [u + (n(i * .7) - .5) * .014, v + (n(i * .7 + 9) - .5) * .014]), path = new Path2D(); off.forEach(([u, v], i) => i ? path.lineTo(u, v) : path.moveTo(u, v)); path.closePath();
      x.lineJoin = "round"; x.strokeStyle = rgba(col, a * .22); x.lineWidth = 3 / RR; x.stroke(path); // a soft bleed past the edge
      x.fillStyle = rgba(col, a); x.fill(path);
      x.save(); x.clip(path);
      x.strokeStyle = rgba(col, a * .55, .82); x.lineWidth = 4 / RR; x.stroke(path); x.strokeStyle = rgba(col, a * .5, .7); x.lineWidth = 1.5 / RR; x.stroke(path); // the edge where it dried darker
      const area = (x1 - x0) * (y1 - y0) * RR * RR; for (let k = 0; k < area / 16; k++) { x.fillStyle = rgba(col, .1 + rr() * .14, .72); const u = x0 + rr() * (x1 - x0), v = y0 + rr() * (y1 - y0), s2 = (.7 + rr()) / RR; x.fillRect(u, v, s2, s2); } // granulation
      x.globalCompositeOperation = "destination-out"; for (let k = 0; k < 2; k++) { const u = lerp(x0, x1, .3 + rr() * .4), v = lerp(y0, y1, .25 + rr() * .5), rad = (.05 + rr() * .06), gr = x.createRadialGradient(u, v, 0, u, v, rad); gr.addColorStop(0, "rgba(0,0,0,.28)"); gr.addColorStop(.8, "rgba(0,0,0,.16)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(u - rad, v - rad, rad * 2, rad * 2); } // a bloom where water crept back
      x.restore();
      return Object.assign(c, { x0, y0, lw: x1 - x0, lh: y1 - y0 });
    },
    build() {
      S.RR = S.R; const RR = S.RR;
      S.washes = WASH.map(([poly, col, a], i) => S.washOf(poly, col, a, 101 + i * 17));
      // the tools, drawn once for the size: a pencil, a brush, an eraser, each with its soft shadow
      const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); x.lineCap = "round"; x.lineJoin = "round"; fn(x); c.w2 = w; c.h2 = h; return c; };
      const shadowOf = (spr, blur) => make(spr.w2 + blur * 4, spr.h2 + blur * 4, x => { x.shadowColor = "rgba(70,55,40,.3)"; x.shadowBlur = blur * px; x.shadowOffsetY = 10000 * px; x.drawImage(spr, blur * 2, blur * 2 - 10000, spr.w2, spr.h2); });
      const L = clamp(RR * .62, 64, 140), wd = L * .09; S.toolL = L;
      S.pencil = make(L, wd + 2, x => { const c = wd / 2 + 1, y0 = 1;
        x.fillStyle = "#3A3A44"; x.beginPath(); x.moveTo(0, c); x.lineTo(L * .07, c - wd * .2); x.lineTo(L * .07, c + wd * .2); x.closePath(); x.fill();
        x.fillStyle = "#EFCB98"; x.beginPath(); x.moveTo(L * .06, c - wd * .22); x.lineTo(L * .17, y0); x.lineTo(L * .17, y0 + wd); x.lineTo(L * .06, c + wd * .22); x.closePath(); x.fill();
        x.strokeStyle = "rgba(160,110,60,.5)"; x.lineWidth = .6; for (const f of [.3, .7]) { x.beginPath(); x.moveTo(L * .1, c + (f - .5) * wd * .5); x.lineTo(L * .17, y0 + f * wd); x.stroke(); }
        for (const [f0, f1, col] of [[0, .36, "#F7CF45"], [.36, .7, "#E6AE17"], [.7, 1, "#B98708"]]) { x.fillStyle = col; x.fillRect(L * .17, y0 + f0 * wd, L * .66, (f1 - f0) * wd + .3); }
        x.fillStyle = "#D5D6DE"; x.fillRect(L * .83, y0, L * .075, wd); x.fillStyle = "#8F909C"; for (const f of [.2, .5, .8]) x.fillRect(L * (.83 + .075 * f), y0, .8, wd);
        x.fillStyle = "#EE9C9E"; x.beginPath(); x.roundRect(L * .905, y0, L * .095, wd, [0, wd * .35, wd * .35, 0]); x.fill(); });
      S.brush = make(L * 1.05, wd * 1.3 + 2, x => { const h = wd * 1.3, c = h / 2 + 1;
        x.fillStyle = "#4E3322"; x.beginPath(); x.moveTo(0, c); x.quadraticCurveTo(L * .06, c - h * .55, L * .15, c - h * .32); x.lineTo(L * .15, c + h * .32); x.quadraticCurveTo(L * .06, c + h * .55, 0, c); x.fill();
        x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.ellipse(L * .08, c - h * .12, L * .04, h * .06, -.1, 0, TAU); x.fill();
        x.fillStyle = "#C9CAD3"; x.fillRect(L * .15, c - h * .34, L * .1, h * .68); x.fillStyle = "#8F909C"; x.fillRect(L * .2, c - h * .34, .8, h * .68);
        x.fillStyle = "#A63229"; x.beginPath(); x.moveTo(L * .25, c - h * .3); x.lineTo(L * 1.03, c - h * .16); x.quadraticCurveTo(L * 1.05, c, L * 1.03, c + h * .16); x.lineTo(L * .25, c + h * .3); x.closePath(); x.fill();
        x.strokeStyle = "rgba(255,210,200,.45)"; x.lineWidth = 1; x.beginPath(); x.moveTo(L * .28, c - h * .14); x.lineTo(L * 1, c - h * .07); x.stroke(); });
      const ew = clamp(RR * .22, 30, 58), eh = ew * .46; S.eraserS = make(ew, eh, x => { x.fillStyle = "#F2A3A1"; x.beginPath(); x.roundRect(0, 0, ew, eh, eh * .18); x.fill(); x.fillStyle = "#E08785"; x.fillRect(0, eh * .72, ew * .45, eh * .28);
        x.fillStyle = "#FBFAF6"; x.fillRect(ew * .42, 0, ew * .58, eh); x.fillStyle = "#4F7FD0"; x.fillRect(ew * .5, eh * .2, ew * .42, eh * .14); x.fillRect(ew * .5, eh * .66, ew * .42, eh * .14); });
      S.pencilSh = shadowOf(S.pencil, 3); S.brushSh = shadowOf(S.brush, 3); S.eraserSh = shadowOf(S.eraserS, 3);
      [S.ink] = canvas(Math.ceil(2.3 * RR * px), Math.ceil(2.3 * RR * px)); S.inkKey = null;
      S.comp = null;
    },
    /** the pencil lines, drawn into the cache for this boil frame and this much of the drawing */
    inkInto(x, prog, jit, ghost) {
      const RR = S.RR, stroke = (pts, p, w, a) => {
        if (p <= 0 || pts.length < 2) return; const q = pts.map(([u, v]) => jit(u, v)), L = [0]; for (let i = 1; i < q.length; i++) L.push(L[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
        const end = L[L.length - 1] * clamp(p), path = (s0, s1, dx = 0, dy = 0) => { x.beginPath(); let started = false; for (let i = 1; i < q.length; i++) { const a0 = L[i - 1], a1 = L[i]; if (a1 < s0 || a0 > s1) continue; const f0 = clamp((s0 - a0) / ((a1 - a0) || 1)), f1 = clamp((s1 - a0) / ((a1 - a0) || 1)); if (!started) { x.moveTo(lerp(q[i - 1][0], q[i][0], f0) + dx, lerp(q[i - 1][1], q[i][1], f0) + dy); started = true; } x.lineTo(lerp(q[i - 1][0], q[i][0], f1) + dx, lerp(q[i - 1][1], q[i][1], f1) + dy); } x.stroke(); };
        const ws = clamp(RR / 150, .9, 1.45); w *= ws; for (const [f0, f1, wk, ak] of [[0, .14, .6, .75], [.12, .9, 1, 1], [.88, 1, .7, .85]]) { x.lineWidth = w * wk / RR; x.strokeStyle = rgba(INK, a * ak * ghost); path(end * f0, end * f1); }
        x.lineWidth = w * .7 / RR; x.strokeStyle = rgba(INK, a * .2 * ghost); path(0, end, .5 / RR, .35 / RR); // the graphite's second, fainter line
      };
      STROKES.forEach(([pts, t0, t1, w, a], i) => stroke(pts, prog(t0, t1), w, a));
    },
    /** the balloon and everything round it, in the drawing's own units, into context x */
    piece(x, st) {
      const { washes } = S;
      const wash = (i, p, dx = 0, dy = 0) => { if (p <= .001) return; const c = washes[i]; if (p >= 1) { x.drawImage(c, c.x0 + dx, c.y0 + dy, c.lw, c.lh); return; }
        const [ux, uy] = WASH[i][5], rad = p * (i === 0 ? 2.1 : 1.35), n = K.noise1(40 + i, 16); x.save(); x.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU, rr = rad * (1 + .12 * (n(k / 2.5 + st.A * 2) - .5)); x.lineTo(ux + dx + Math.cos(a) * rr, uy + dy + Math.sin(a) * rr); } x.clip(); x.drawImage(c, c.x0 + dx, c.y0 + dy, c.lw, c.lh); x.restore(); };
      // the sky, then the clouds drifting, then the balloon
      wash(0, st.w[0]);
      CLOUDS.forEach((pts, i) => { const dx = st.cloud[i]; wash(1 + i, st.w[1 + i], dx); if (st.cp[i] > 0) { x.lineWidth = 1.1 / S.RR; x.strokeStyle = rgba(INK, .8 * st.ghost[i]); K.partial(x, pts.map(([u, v]) => st.jit(u + dx, v)), st.cp[i]); } });
      x.save(); x.translate(0, st.lift); x.rotate(st.sway);
      for (let k = 0; k < 8; k++) { wash(3 + k, st.w[3 + k]); const wet = st.wet[3 + k]; if (wet > .01) { const ga = x.globalAlpha; x.globalAlpha = ga * wet * .45; wash(3 + k, st.w[3 + k]); x.globalAlpha = ga; } } // wet paint is darker until it dries
      wash(11, st.w[11]); wash(12, st.w[12]);
      // the flame, in the gap between the burner and the envelope
      if (st.flame > .01) { const h = .03 + st.flame * .08, w = .026 + st.flame * .01, fl = 1 + .18 * Math.sin(st.A * 23) * Math.sin(st.A * 17); x.save(); x.beginPath(); x.rect(-.2, .302, .4, .2); x.clip();
        for (const [k, col] of [[1, PIG.flame], [.55, [255, 214, 90]]]) { x.fillStyle = rgba(col, .85); x.beginPath(); x.moveTo(-w * k, .4); x.quadraticCurveTo(-w * k * 1.1, .4 - h * .5 * k * fl, 0, .4 - h * k * fl); x.quadraticCurveTo(w * k * 1.1, .4 - h * .5 * k * fl, w * k, .4); x.closePath(); x.fill(); }
        x.restore(); }
      if (st.inkC) { const c = st.inkC; x.drawImage(c, -1.15, -1.15, 2.3, 2.3); }
      x.restore();
      // the birds, gliding, and flapping when they fly
      BIRDS.forEach(([bx, by, s, ph], i) => { const v = st.birds; if (v <= 0) return; const fly = st.fly, ox = fly * Math.sin(st.A * .9 + ph) * .1, oy = fly * Math.cos(st.A * 1.1 + ph) * .05 - fly * .04, flap = Math.sin(st.A * (3 + fly * 9) + ph) * (.35 + fly * .5);
        const cx2 = bx + ox, cy2 = by + oy, pts = [[cx2 - s, cy2 - s * (.2 + flap * .6)], [cx2 - s * .45, cy2 - s * (.45 + flap * .25)], [cx2, cy2], [cx2 + s * .45, cy2 - s * (.45 + flap * .25)], [cx2 + s, cy2 - s * (.2 + flap * .6)]];
        x.lineWidth = 1.2 / S.RR; x.strokeStyle = rgba(INK, .85 * st.ghostB); K.partial(x, pts.map(([u, w2]) => st.jit(u, w2)), v); });
      // the splatters, landing with a small spread
      for (const d of st.drops) { if (d.k <= 0) continue; const s2 = d.s * E.back(clamp(d.k)); x.fillStyle = rgba(d.c, .55 * d.a); x.beginPath(); x.arc(d.x, d.y, s2, 0, TAU); x.fill(); x.strokeStyle = rgba(d.c, .5 * d.a, .72); x.lineWidth = .9 / S.RR; x.stroke(); }
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H } = S, on = I > .01;
      g.clearRect(0, 0, W, H);
      // glide to the room the words leave, and draw the caches again if the size has changed much
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl; S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4)); if (S.vis < .01) return;
      if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) S.build();
      const { cx, cy, R } = S, L = t => lerp(1, t, I); // in use, all of it is there; left alone, the loop decides
      // how much of the drawing is there: after the eraser, only what the pencil and the brush have put back
      const gone = on && T >= ER1, prog = (t0, t1) => L(gone ? seg(T, t0, t1, x => x) : 1);
      const fr = Math.floor(A * 8), amp = (.35 + (on ? env(T, 9.0, 9.4, 12.4, 12.8) * .25 * I : 0)) / S.RR, jit = boil(fr, amp);
      const key = fr + ":" + (gone && T < 6.5 ? Math.round(T * 30) : "all") + ":" + (I > .99 ? 1 : Math.round(I * 20)) + ":" + S.RR;
      if (key !== S.inkKey) { const c = S.ink, x = c.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.setTransform(px * S.RR, 0, 0, px * S.RR, 1.15 * S.RR * px, 1.15 * S.RR * px); x.lineCap = "round"; x.lineJoin = "round";
        if (gone && T < 6.5) S.inkInto(x, () => 1, jit, .07 * I); // the ghost the eraser left
        S.inkInto(x, prog, jit, 1); S.inkKey = key; }
      const alive = on ? env(T, 9.0, 9.3, 12.6, 13.0) * I : 0, fin = F >= 0 ? env(F, .05, .15, .55, .85, E.sine) : 0;
      const st = {
        A, jit, inkC: S.ink,
        w: WASH.map(([, , , t0, t1]) => L(gone ? seg(T, t0, t1, x => x) : 1)),
        wet: WASH.map(([, , , t0, t1]) => on && gone ? env(T, t0, t0 + .1, t1 + .2, t1 + .9) * I : 0),
        cp: CSTROKES.map(([, t0, t1]) => L(gone ? seg(T, t0, t1, x => x) : 1)), ghost: [1, 1], ghostB: 1,
        cloud: [Math.sin(A * .12) * .03, Math.sin(A * .1 + 2) * .025],
        birds: L(gone ? seg(T, 6.16, 6.4, x => x) : 1), fly: alive,
        lift: -(on ? env(T, 9.2, 10.6, 12.8, 14.4, E.io) * .06 * I : 0) - fin * .12 + Math.sin(A * .9) * .01, sway: Math.sin(A * .7) * .025 * (.35 + .65 * alive),
        flame: .15 + .1 * Math.sin(A * 5) * Math.sin(A * 3.3) + alive * .85 + fin,
        drops: [...S.drops.map(d => ({ ...d, k: L(gone ? seg(T, d.t + .1, d.t + .25, x => x) : 1), a: 1 })), ...(F >= 0 ? S.fin.map(d => ({ ...d, k: seg(F, d.t, d.t + .12, x => x), a: 1 - seg(F, .8, 1) })) : [])],
      };
      // the drawing, in its circle; while the eraser works, drawn aside first and rubbed out there
      const erasing = on && T > ER0 && T < ER1;
      if (!erasing) { g.save(); g.globalAlpha = S.vis; g.translate(cx, cy); g.scale(R, R); S.piece(g, st); g.restore(); }
      else {
        const size = Math.ceil(2.3 * R * px); if (!S.comp || S.comp.width !== size) [S.comp] = canvas(size, size);
        const x = S.comp.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, size, size); x.setTransform(px * R, 0, 0, px * R, 1.15 * R * px, 1.15 * R * px); x.imageSmoothingEnabled = true; x.lineCap = "round"; x.lineJoin = "round";
        S.piece(x, st);
        const e = seg(T, ER0, ER1, x2 => x2), s = EL[EL.length - 1] * e; x.globalCompositeOperation = "destination-out"; x.strokeStyle = `rgba(0,0,0,${I.toFixed(3)})`; x.lineWidth = .34; x.beginPath(); x.moveTo(EPATH[0][0], EPATH[0][1]); for (let i = 1; i < EPATH.length && EL[i - 1] < s; i++) { const f = clamp((s - EL[i - 1]) / (EL[i] - EL[i - 1])); x.lineTo(lerp(EPATH[i - 1][0], EPATH[i][0], f), lerp(EPATH[i - 1][1], EPATH[i][1], f)); } x.stroke(); x.globalCompositeOperation = "source-over";
        g.globalAlpha = S.vis; g.drawImage(S.comp, cx - 1.15 * R, cy - 1.15 * R, 2.3 * R, 2.3 * R); g.globalAlpha = 1;
      }
      const toScreen = (u, v, lifted = true) => [cx + u * R, cy + (v + (lifted ? st.lift : 0)) * R];
      // the eraser at work, its crumbs flying
      if (erasing || (on && T >= ER1 && T < ER1 + .9)) {
        const e = seg(T, ER0, ER1, x => x);
        for (const c of S.crumbs) { if (c.e > e) continue; const te = ER0 + c.e * (ER1 - ER0), dtc = T - te; if (dtc > .9) continue; const [u, v] = along(EPATH, EL, c.e), x = cx + (u + c.vx * dtc) * R, y = cy + (v + c.vy * dtc + .9 * dtc * dtc) * R; g.strokeStyle = rgba(c.c, (1 - dtc / .9) * .8 * I * S.vis); g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 2.2, c.rot, c.rot + 2.4); g.stroke(); }
        if (erasing) { const [u, v, a] = along(EPATH, EL, e), sc = Math.sin(A * 40) * .03, [sx, sy] = toScreen(u - Math.sin(a) * sc, v + Math.cos(a) * sc, false), rot = a + Math.sin(A * 24) * .12, spr = S.eraserS, sh = S.eraserSh;
          g.globalAlpha = I * S.vis; g.save(); g.translate(sx + 5, sy + 7); g.rotate(rot); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy); g.rotate(rot); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; }
      }
      // the pencil while it draws: at the end of the line it's drawing, lifted between lines
      const tool = (spr, sh, u, v, lift, ang, a) => { const [sx, sy] = toScreen(u, v); g.globalAlpha = a * S.vis; g.save(); g.translate(sx + 6 + lift * 10, sy + 9 + lift * 14); g.rotate(ang); g.drawImage(sh, -sh.w2 * .06, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy - lift * 6); g.rotate(ang); g.drawImage(spr, 0, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; };
      if (on && T > 1.95 && T < 6.5) {
        const all = [...STROKES.map(s => [s[0], s[1], s[2]]), ...CSTROKES, ...BIRDS.map(([bx, by, s], i) => [[[bx - s, by - s * .2], [bx, by], [bx + s, by - s * .2]], 6.16 + i * .08, 6.24 + i * .08])];
        let at = null, lift = 0;
        for (let i = 0; i < all.length; i++) { const [pts, t0, t1] = all[i]; if (T >= t0 && T <= t1) { const pL = [0]; for (let k = 1; k < pts.length; k++) pL.push(pL[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])); const [u, v] = along(pts, pL, (T - t0) / (t1 - t0)); at = [u, v]; break; } }
        if (!at) { let prev = null, next = null; for (const s of all) { if (s[2] <= T && (!prev || s[2] > prev[2])) prev = s; if (s[1] >= T && (!next || s[1] < next[1])) next = s; } const pe = prev ? prev[0][prev[0].length - 1] : [.3, -.8], ns = next ? next[0][0] : pe, k = prev && next ? clamp((T - prev[2]) / ((next[1] - prev[2]) || 1)) : 1; at = [lerp(pe[0], ns[0], E.io(k)), lerp(pe[1], ns[1], E.io(k))]; lift = Math.sin(k * Math.PI); }
        tool(S.pencil, S.pencilSh, at[0], at[1], lift, (S.toolAng || -.62) + lift * .06, I * env(T, 1.95, 2.05, 6.35, 6.5));
      }
      // the brush while it paints: down each gore as the wet front spreads, flicking drops at the flicks
      if (on && T > 6.4 && T < 9.1) {
        let at = null, lift = 0; for (let i = 0; i < WASH.length; i++) { const [, , , t0, t1, [u, v]] = WASH[i]; if (T >= t0 - .08 && T <= t1) { const k = clamp((T - t0) / (t1 - t0)); at = [u + (i === 0 ? Math.sin(k * 5) * .25 : 0), v + (i === 0 ? k * .3 : i >= 3 && i <= 10 ? k * .55 : 0)]; } }
        if (!at) at = [.4, -.2], lift = 1;
        const flick = FLICKS.reduce((m, t) => Math.max(m, env(T, t - .06, t, t + .02, t + .14)), 0);
        tool(S.brush, S.brushSh, at[0], at[1], lift * .4, (S.toolAng || -.62) * 1.12 - Math.sign(S.toolAng || -.62) * flick * .5, I * env(T, 6.4, 6.5, 9.0, 9.1));
      }
      // the finale: stars sketched in round it
      if (F >= 0) for (const s of S.stars) { const p = seg(F, s.t, s.t + .16, x => x); if (p <= 0) continue; const pts = Array.from({ length: 11 }, (_, k) => { const a = -Math.PI / 2 + k * TAU * 2 / 5, rr = s.s; return [s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr]; }); g.save(); g.translate(cx, cy); g.scale(R, R); g.lineWidth = 1.4 / R; g.strokeStyle = rgba([157, 119, 0], .9 * (1 - seg(F, .82, 1)) * S.vis); K.partial(g, pts.map(([u, v]) => jit(u, v)), p); g.restore(); }
    },
  };
  return S;
}
