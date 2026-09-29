// scene-wood.js — 1.12 b365: Bark's and Char's scene, one plank by day and by night (scenes.js loads it for either kit
// and says which). The same country in both, in a round medallion in the largest open space on the page (scenes.js,
// `words`): a sun (by night the moon) low between two peaks, a nearer range of hills, a lake, three pines on the shore.
// By day it is marquetry let into the pale plank, each piece its own veneer with its grain running its own way and a fine
// glue line round it: a sunburst of maple and satinwood rays, a padauk sun cut across the end grain, oak and teak peaks
// capped in holly, cherry and walnut hills, a lake of slate-blue dyed veneer with a satinwood glint, green pines on an
// ebony shore, in a ring of dogtooth banding. While the list is in use it lies there oiled, a sheen drifting over it. The
// loop, fifteen seconds: a bullnose plane comes in from the right and takes the picture back to the plank in three passes,
// each curl of shaving wound with the picture's colours, carried back in the plane's throat and flicked off the page;
// the pieces come back from past the edge away from the list, one by one — the banding spun in, the rays as a closed fan
// that opens round its pivot, the sun, the peaks facet by facet and their snow, the hills, the lake and its glint, the
// shore, the pines — each dropping into its place with a puff of sawdust; a rag of oil wipes across in three rows and the
// raw woods deepen, wet, then dry; a sheen runs over them. The finale, under the kit's carve: the pieces lift and settle
// in a wave from left to right, each catching the light as it rises.
// By night it is pyrography in the charred plank, the char crazed along the grain and mottled, embers breathing in its
// checks. The picture is burned in pale ash: the ring and its row of dots, the moon's rim, the ridges and their snow, the
// moonlit faces hatched along the lie of the land, the pines, the lake and the moon's road on it, the stars, the moon
// stippled. The loop: the picture glows red-hot once, from the moon outward, and crumbles behind the glow into ash that
// drifts off; the pen comes in, its tip glowing and lighting the char round it, and burns it all in again, each line
// white-hot behind the tip and cooling through orange and red to ash, a wisp of smoke curling off the tip; the stippling
// last; the pen goes. The finale, under the kit's burn: a pulse of heat runs out from the moon through every line, sparks
// go up off its front, and a wisp of smoke rises off the moon.
// The plane and the rag stop short of any word, the lines sit on pads of the ground (scenes.js, `hug`), the embers keep
// off them. The beats are tables, so they can be dealt differently each time round.
export default function wood(K, id) {
  const night = id === "char";
  const { clamp, lerp, E, seg, env, rng, canvas, noise1, fbm } = K;
  const TAU = Math.PI * 2, lin = x => x;
  let g = null, px = 1;
  /** a sprite drawn smooth at the screen's density, `w` by `h` CSS pixels */
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); x.lineCap = "round"; x.lineJoin = "round"; fn(x); c.w2 = w; c.h2 = h; return c; };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;
  const mixc = (a, b, t) => [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], clamp(t))));
  const trace = (x, pts, close = true) => { x.beginPath(); pts.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); if (close) x.closePath(); };
  /** a sprite's soft shadow, drawn once (canvas shadows are in device pixels whatever the transform) */
  const shadowOf = (spr, blur, col) => make(spr.w2 + blur * 4, spr.h2 + blur * 4, x => { x.shadowColor = col; x.shadowBlur = blur * px; x.shadowOffsetY = 10000 * px; x.drawImage(spr, blur * 2, blur * 2 - 10000, spr.w2, spr.h2); });

  /* ---------------- the country, in units of the medallion's radius (y down): the same by day and by night ---------------- */
  const fnOf = P => x => { if (x <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (x <= P[i][0]) return lerp(P[i - 1][1], P[i][1], (x - P[i - 1][0]) / (P[i][0] - P[i - 1][0])); return P[P.length - 1][1]; };
  const FAR = [[-.95, .14], [-.84, .07], [-.72, -.05], [-.58, -.21], [-.5, -.13], [-.4, -.06], [-.28, .01], [-.14, .07], [0, .09], [.12, .05], [.24, -.03], [.35, -.15], [.46, -.27], [.55, -.16], [.66, -.07], [.8, .03], [.95, .12]];
  const NEAR = [[-.95, .29], [-.84, .2], [-.72, .1], [-.63, .05], [-.54, .1], [-.42, .18], [-.28, .24], [-.14, .275], [0, .245], [.12, .19], [.22, .13], [.31, .09], [.41, .14], [.53, .2], [.67, .25], [.82, .28], [.95, .3]];
  const SHORE = [[-.95, .56], [-.7, .6], [-.42, .64], [-.12, .665], [.18, .64], [.46, .6], [.72, .56], [.95, .53]];
  const SNOWA = [[-.72, -.04], [-.67, -.08], [-.63, -.06], [-.6, -.11], [-.56, -.07], [-.53, -.1], [-.49, -.07], [-.45, -.085]];
  const SNOWB = [[.32, -.1], [.36, -.14], [.4, -.12], [.43, -.17], [.47, -.13], [.5, -.16], [.54, -.12], [.58, -.13], [.62, -.09]];
  const far = fnOf(FAR), near = fnOf(NEAR), shore = fnOf(SHORE);
  const HZ = .3, RI = .9, SUN = .23, PINES = [[-.52, .75, .44], [-.35, .72, .3], [.6, .67, .37]];
  // the lines that part each peak's lit face from its shaded one (and the two peaks, and the two hills)
  const LA = [[-.58, -.21], [-.53, .3]], LS = [[0, .09], [.02, .3]], LB = [[.46, -.27], [.41, .3]], LC = [[-.63, .05], [-.58, .3]], LV = [[-.15, .2], [-.13, .36]], LD = [[.31, .09], [.27, .3]];
  const lx = (L, y) => lerp(L[0][0], L[1][0], (y - L[0][1]) / (L[1][1] - L[0][1]));
  /** a pine: a point, four tiers flaring out and tucked in, a stub of trunk */
  const pinePoly = (bx, by, h) => { const top = by - h, bot = by - h * .12, tw = Math.max(.012, h * .045), right = [];
    for (let k = 0; k < 4; k++) { const yb = lerp(top, bot, (k + 1) / 4), w = h * (.11 + .075 * k); right.push([bx + w, yb]); if (k < 3) right.push([bx + w * .36, yb - h * .03]); }
    right.push([bx + tw, bot], [bx + tw, by]);
    return [[bx, top], ...right, ...right.map(([x, y]) => [2 * bx - x, y]).reverse()]; };
  const PINEP = PINES.map(p => pinePoly(...p));
  const pIn = pts => (u, v) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi) + xi) c = !c; } return c; };
  const inPine = PINEP.map(pIn), behindPine = (u, v) => inPine.some(t => t(u, v) || t(u + .02, v) || t(u - .02, v) || t(u, v + .02));

  /** where the medallion goes (scenes.js, `words`): the largest circle of open page, clear of every word, the edges, the
   *  bar along the top and the footer's pool, a little smaller than the room so the tools have room to work; and the side
   *  away from the words, which everything comes in from and goes off to */
  const place = rects => {
    const { W, H, pr } = S, gap = pr ? 14 : 26, top = pr ? 96 : 122, foot = H - (pr ? 104 : 128);
    let best = 0, bx = S.tx, by = S.ty;
    for (let gy = 0; gy <= 24; gy++) for (let gx = 0; gx <= 32; gx++) {
      const x = W * (.04 + .92 * gx / 32), y = top + (foot - top) * gy / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y);
      for (const [x0, y0, x1, y1] of rects) { rad = Math.min(rad, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)) - gap); if (rad <= best) break; }
      if (rad > best) { best = rad; bx = x; by = y; }
    }
    let nr = null, nd = 1e9; for (const [x0, y0, x1, y1] of rects) { const qx = clamp(bx, x0, x1), qy = clamp(by, y0, y1), d = Math.hypot(qx - bx, qy - by); if (d < nd) { nd = d; nr = [qx, qy]; } }
    const ax = nr ? bx - nr[0] : pr ? 0 : 1, ay = nr ? by - nr[1] : pr ? 1 : 0, al = Math.hypot(ax, ay) || 1, fit = best * (pr ? .94 : .84);
    Object.assign(S, { tx: bx, ty: by, tR: clamp(fit, S.Rmin, S.Rmax), room: fit >= S.Rmin ? 1 : 0, away: [ax / al, ay / al] });
    if (!S.placed) { Object.assign(S, { cx: S.tx, cy: S.ty, R: S.tR }); S.placed = true; }
  };
  /** how far from (x, y) along (dx, dy) to the page's edge */
  const out = (x, y, dx, dy) => { let t = 1e9; if (dx > 1e-6) t = Math.min(t, (S.W - x) / dx); if (dx < -1e-6) t = Math.min(t, -x / dx); if (dy > 1e-6) t = Math.min(t, (S.H - y) / dy); if (dy < -1e-6) t = Math.min(t, -y / dy); return Math.max(0, t); };
  /** glide to the room the words leave; fade away while there is none */
  const glide = A => {
    const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A; S.dt = dt;
    const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl;
    S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4));
  };

  /* ================================ BY DAY: marquetry ================================ */
  // the loop's beats, in seconds (the forever cycle can deal them differently)
  const BD = {
    plane: [.5, .92, 2.98, 3.5], passes: [[.92, 1.42], [1.7, 2.2], [2.48, 2.98]], roll: .9,   // in, three passes, out; a curl's roll off the page
    ring: [3.85, 4.7], fan: [4.5, 5.05, 5.95], sun: [5.85, 6.45], far: 6.25, snow: 6.85, near: 6.95, lake: 7.5, glint: 7.85, shore: 8.0, pines: 8.35, done: 9.2,
    rag: [9.4, 9.72, 11.98, 12.4], wipes: [[9.72, 10.36], [10.52, 11.16], [11.34, 11.98]], sheen: [12.3, 13.8],
  };
  const BANDS = [[-1.07, -.35, -.7], [-.35, .35, 0], [.35, 1.07, .7]], SPAN = [.96, 1.03, .96], MOUTH = .19, WIPEY = [-.64, 0, .64]; // the plane's bands, how far each pass runs, where its mouth is; the rag's rows
  // the veneers, raw and oiled: [ground, grain, figure]
  const WOOD = {
    maple: { dry: ["#EBD8B2", "#D2B687", "#F7EBD2"], oil: ["#E6BE7E", "#C4914C", "#F5D69E"], step: 3.2, wob: .05, ga: .34, fig: "ribbon" },
    satin: { dry: ["#E2B563", "#C49441", "#F3D493"], oil: ["#D8962E", "#AE6F17", "#F2C165"], step: 3, wob: .04, ga: .4, fig: "ribbon" },
    padauk: { dry: ["#D46C3A", "#AE4D26", "#EA8C5A"], oil: ["#C4481A", "#8E2A0E", "#E0703C"], step: 2.6, wob: .06, ga: .42, fig: "rings" },
    oak: { dry: ["#D8B07A", "#B48450", "#E9CC9D"], oil: ["#C88C46", "#9A6126", "#DEAA62"], step: 3.6, wob: .12, ga: .48, fig: "fleck" },
    teak: { dry: ["#B98A55", "#96683A", "#D0A26C"], oil: ["#9C6630", "#744618", "#B87E44"], step: 3.2, wob: .1, ga: .46 },
    cherry: { dry: ["#BC7650", "#9A5533", "#D18E66"], oil: ["#A0462A", "#782C15", "#BD603A"], step: 3.2, wob: .1, ga: .44 },
    walnut: { dry: ["#6F4F39", "#523726", "#8C684B"], oil: ["#4F3222", "#341E13", "#6B4630"], step: 3, wob: .12, ga: .5 },
    ebony: { dry: ["#3B312B", "#29211C", "#4C4038"], oil: ["#241B16", "#130D0A", "#352820"], step: 2.2, wob: .03, ga: .5 },
    holly: { dry: ["#F4EDE0", "#E1D6C3", "#FCF8EF"], oil: ["#F2E5CB", "#DBC8A6", "#FBF1DD"], step: 3.4, wob: .03, ga: .24 },
    blue: { dry: ["#83A0B2", "#6B889B", "#A5BDCB"], oil: ["#4B7187", "#34586D", "#6B91A6"], step: 3, wob: .04, ga: .34, fig: "ribbon" },
    green: { dry: ["#5E7B53", "#47623F", "#7C9971"], oil: ["#3B5A34", "#284323", "#577A4C"], step: 2.8, wob: .05, ga: .4 },
  };
  // the pieces: primitives each piece is the meeting of, as polygons to cut with and tests to measure with
  const circ = (r, n = 144) => Array.from({ length: n }, (_, i) => [Math.cos(i / n * TAU) * r, Math.sin(i / n * TAU) * r]);
  const ext = P => [[-1.4, P[0][1]], ...P, [1.4, P[P.length - 1][1]]];
  const prim = (pts, test) => { let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const [u, v] of pts) { x0 = Math.min(x0, u); y0 = Math.min(y0, v); x1 = Math.max(x1, u); y1 = Math.max(y1, v); } return { pts, test, bb: [x0, y0, x1, y1] }; };
  const above = (P, f) => prim([...ext(P), [1.4, -1.4], [-1.4, -1.4]], (u, v) => v < f(u)), below = (P, f) => prim([...ext(P), [1.4, 1.4], [-1.4, 1.4]], (u, v) => v > f(u));
  const leftOf = L => prim([[lx(L, -1.4), -1.4], [lx(L, 1.4), 1.4], [-1.4, 1.4], [-1.4, -1.4]], (u, v) => u < lx(L, v)), rightOf = L => prim([[lx(L, -1.4), -1.4], [1.4, -1.4], [1.4, 1.4], [lx(L, 1.4), 1.4]], (u, v) => u > lx(L, v));
  const poly = pts => prim(pts, pIn(pts));
  const wedge = (a0, a1, r) => { const n = Math.ceil((a1 - a0) / .03), p = [[0, 0]]; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([Math.cos(a) * r, Math.sin(a) * r]); } return prim(p, (u, v) => { let a = Math.atan2(v, u); while (a < a0) a += TAU; return a <= a1 && u * u + v * v < r * r; }); };
  const DISC = prim(circ(RI), (u, v) => u * u + v * v < RI * RI), UPH = above([[-1, HZ], [1, HZ]], () => HZ), DOWNH = below([[-1, HZ], [1, HZ]], () => HZ);
  const WFAR = below(FAR, far), WNEAR = below(NEAR, near), SKYLINE = above(SHORE, shore);
  const TH0 = Math.PI * 160 / 180, TH1 = Math.PI * 380 / 180, NR = 14, DTH = (TH1 - TH0) / NR;
  const RFL = (() => { const L = [], Rt = []; for (let i = 0; i <= 12; i++) { const y = HZ - .01 + i * .026, w = .03 + i * .0085 + (i % 2 ? .014 : 0); L.push([-w, y]); Rt.push([w * (i % 2 ? .8 : 1.12), y]); } return [...L, ...Rt.reverse()]; })();
  const PIECES = [];
  const add = (wood, polys, grain, t0, dur, extra = {}) => PIECES.push({ wood, polys, grain, t0, t1: t0 + dur, ...extra });
  if (!night) { // (the night has no inlay)
  for (let i = 0; i < NR; i++) add(i % 2 ? "satin" : "maple", [wedge(TH0 + i * DTH, TH0 + (i + 1) * DTH, RI)], TH0 + (i + .5) * DTH, 0, 0, { ray: i });
  add("padauk", [prim(circ(SUN, 96), (u, v) => u * u + v * v < SUN * SUN)], .3, BD.sun[0], BD.sun[1] - BD.sun[0], { bow: 1.6 });
  [[[WFAR, UPH, DISC, leftOf(LA)], "teak", -.85], [[WFAR, UPH, DISC, rightOf(LA), leftOf(LS)], "oak", .7], [[WFAR, UPH, DISC, rightOf(LS), leftOf(LB)], "oak", -.83], [[WFAR, UPH, DISC, rightOf(LB)], "teak", .79]]
    .forEach(([polys, w, gr], k) => add(w, polys, gr, BD.far + k * .1, .55));
  add("holly", [poly([...SNOWA, [-.45, far(-.45)], [-.5, -.13], [-.58, -.21]])], .2, BD.snow, .45);
  add("holly", [poly([...SNOWB, [.62, far(.62)], [.55, -.16], [.46, -.27], [.35, -.15], [.32, far(.32)]])], -.2, BD.snow + .08, .45);
  [[[WNEAR, UPH, DISC, leftOf(LC)], "walnut", -.62], [[WNEAR, UPH, DISC, rightOf(LC), leftOf(LV)], "cherry", .55], [[WNEAR, UPH, DISC, rightOf(LV), leftOf(LD)], "cherry", -.49], [[WNEAR, UPH, DISC, rightOf(LD)], "walnut", .46]]
    .forEach(([polys, w, gr], k) => add(w, polys, gr, BD.near + k * .1, .55));
  add("blue", [DOWNH, SKYLINE, DISC], 0, BD.lake, .55);
  add("satin", [poly(RFL), DOWNH, SKYLINE], 0, BD.glint, .45);
  add("ebony", [below(SHORE, shore), DISC], .04, BD.shore, .55);
  PINEP.forEach((p, k) => add("green", [poly(p)], Math.PI / 2, BD.pines + k * .13, .55));
  // each piece measured once: where its middle is, what box it fills, how far it reaches
  PIECES.forEach((p, i) => {
    let [x0, y0, x1, y1] = [-1.05, -1.05, 1.05, 1.05]; for (const q of p.polys) { x0 = Math.max(x0, q.bb[0]); y0 = Math.max(y0, q.bb[1]); x1 = Math.min(x1, q.bb[2]); y1 = Math.min(y1, q.bb[3]); }
    let n = 0, sx = 0, sy = 0, a = 9, b = 9, c = -9, d = -9;
    for (let v = y0; v <= y1; v += .007) for (let u = x0; u <= x1; u += .007) if (p.polys.every(q => q.test(u, v))) { n++; sx += u; sy += v; a = Math.min(a, u); b = Math.min(b, v); c = Math.max(c, u); d = Math.max(d, v); }
    p.c = n ? [sx / n, sy / n] : [0, 0]; p.bb = { x0: a - .02, y0: b - .02, x1: c + .02, y1: d + .02 };
    p.L = Math.max(...[[a, b], [c, b], [a, d], [c, d]].map(([u, v]) => Math.hypot(u - p.c[0], v - p.c[1]))) + .03;
    const r = rng(300 + i * 37); p.seed = 1000 + i * 37; p.rot0 = (r() - .5) * 1.7; p.bow = (i % 2 ? 1 : -1) * (p.bow || .5 + r() * .6);
  });
  }
  const RAYS = PIECES.filter(p => p.ray !== undefined), REST = PIECES.filter(p => p.ray === undefined);

  /** one veneer into x, in the picture's units: its ground, its figure, its grain, its pores, cut to its shape */
  const woodInto = (x, p, oiled, u) => {
    const W = WOOD[p.wood], P = (oiled ? W.oil : W.dry).map(hex), r = rng(p.seed), n = noise1(p.seed, 64), L = p.L;
    x.save(); x.translate(p.c[0], p.c[1]); x.rotate(p.grain);
    x.fillStyle = rgba(P[0]); x.fillRect(-L, -L, 2 * L, 2 * L);
    if (W.fig === "rings") { // the sun: end grain, rings round a heart a little off the middle
      for (let k = 1; k < 26; k++) { x.strokeStyle = rgba(k % 3 ? P[1] : P[2], .22 + r() * .25); x.lineWidth = (.6 + r() * 1.2) * u; x.beginPath(); for (let j = 0; j <= 48; j++) { const a = j / 48 * TAU, rr = k * .0105 * (1 + .12 * (n(j * .5 + k) - .5)); x.lineTo(.03 + Math.cos(a) * rr, -.02 + Math.sin(a) * rr); } x.stroke(); }
      x.restore(); return;
    }
    // the figure: broad bands of the lighter and darker tone along the grain (a ribbon catches the light in stripes)
    for (let y = -L; y < L;) { const h = (3 + r() * (W.fig === "ribbon" ? 7 : 12)) * u; x.fillStyle = rgba(r() < .5 ? P[2] : P[1], (W.fig === "ribbon" ? .3 : .12) * r()); x.fillRect(-L, y, 2 * L, h); y += h; }
    // the grain: long lines, each wandering with its neighbours
    x.lineCap = "butt";
    for (let y = -L; y < L; y += W.step * u * (.45 + r() * 1.1)) {
      x.strokeStyle = rgba(P[1], W.ga * (.3 + .7 * r())); x.lineWidth = (.45 + Math.pow(r(), 2) * 1.6) * u; x.beginPath();
      for (let k = 0; k <= 28; k++) { const xx = -L + 2 * L * k / 28, yy = y + (fbm(n, xx * 2.2 + y * 1.3 + 50, 3) - .5) * W.wob * 2; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      x.stroke();
    }
    // pores, and an oak's rays: small flecks across the grain
    x.fillStyle = rgba(P[1], .38); for (let k = 0; k < L * L * 900; k++) x.fillRect((r() - .5) * 2 * L, (r() - .5) * 2 * L, (1.5 + r() * 3) * u, .7 * u);
    if (W.fig === "fleck") { x.fillStyle = rgba(P[2], .5); for (let k = 0; k < L * L * 160; k++) { x.beginPath(); x.ellipse((r() - .5) * 2 * L, (r() - .5) * 2 * L, (1 + r() * 2.5) * u, .8 * u, Math.PI / 2, 0, TAU); x.fill(); } }
    x.restore();
  };
  /** a piece into x: its veneer cut to its shape, the glue line round it */
  const pieceInto = (x, p, oiled, u) => {
    x.save(); for (const q of p.polys) { trace(x, q.pts); x.clip(); }
    woodInto(x, p, oiled, u);
    x.lineWidth = 2.4 * u; x.strokeStyle = oiled ? "rgba(36,20,10,.78)" : "rgba(58,38,22,.62)"; for (const q of p.polys) { trace(x, q.pts); x.stroke(); }
    x.restore();
  };
  /** the banding round it: an ebony line, dogtooth in maple and walnut, a holly line, an ebony line */
  const ringInto = (x, oiled, u) => {
    const k = oiled ? "oil" : "dry", c = w => rgba(hex(WOOD[w][k][0])), band = (r0, r1, col) => { x.beginPath(); x.arc(0, 0, r1, 0, TAU); x.arc(0, 0, r0, 0, TAU, true); x.fillStyle = col; x.fill(); };
    band(.975, 1, c("ebony")); band(.925, .975, c("maple")); band(.912, .925, c("holly")); band(RI, .912, c("ebony"));
    x.fillStyle = c("walnut"); const N = 64; for (let i = 0; i < N; i++) { const a0 = i / N * TAU, a1 = (i + 1) / N * TAU; x.beginPath(); x.moveTo(Math.cos(a0) * .925, Math.sin(a0) * .925); x.lineTo(Math.cos((a0 + a1) / 2) * .975, Math.sin((a0 + a1) / 2) * .975); x.lineTo(Math.cos(a1) * .925, Math.sin(a1) * .925); x.closePath(); x.fill(); }
    // a whisper of grain along the banding, and the glue lines between
    const r = rng(8); x.strokeStyle = oiled ? "rgba(255,236,200,.1)" : "rgba(255,244,220,.12)"; x.lineWidth = .6 * u; for (let k2 = 0; k2 < 6; k2++) { const rr = .976 + k2 * .004; x.beginPath(); x.arc(0, 0, rr, r() * TAU, r() * TAU + 2); x.stroke(); }
    x.strokeStyle = oiled ? "rgba(30,18,10,.7)" : "rgba(58,38,22,.55)"; x.lineWidth = 1 * u; for (const rr of [1, .975, .925, .912, RI]) { x.beginPath(); x.arc(0, 0, rr, 0, TAU); x.stroke(); }
  };
  /** the sprites for this size: every piece raw, with its shadow; the whole inlay raw and oiled; the tools */
  function buildDay() {
    const R = S.R; S.RR = R; const u = 1 / R;
    for (const p of PIECES) { const { x0, y0, x1, y1 } = p.bb; p.spr = make((x1 - x0) * R, (y1 - y0) * R, x => { x.scale(R, R); x.translate(-x0, -y0); pieceInto(x, p, false, u); }); p.sh = shadowOf(p.spr, 4, "rgba(78,52,26,.55)"); }
    S.ringDry = make(2.04 * R, 2.04 * R, x => { x.scale(R, R); x.translate(1.02, 1.02); ringInto(x, false, u); }); S.ringSh = shadowOf(S.ringDry, 5, "rgba(78,52,26,.5)");
    const whole = oiled => make(2.1 * R, 2.1 * R, x => { x.scale(R, R); x.translate(1.05, 1.05); for (const p of PIECES) { if (oiled) pieceInto(x, p, true, u); else x.drawImage(p.spr, p.bb.x0, p.bb.y0, p.bb.x1 - p.bb.x0, p.bb.y1 - p.bb.y0); } ringInto(x, oiled, u); });
    S.dry = whole(false); S.oiled = whole(true);
    // what a pass of the plane shaves: the plank, and the inlay in it
    S.shave = make(2.2 * R, 2.2 * R, x => { const r = rng(4); x.fillStyle = "#F3E7D3"; x.fillRect(0, 0, 2.2 * R, 2.2 * R); x.strokeStyle = "rgba(216,196,164,.6)"; for (let k = 0; k < 40; k++) { x.lineWidth = .6 + r() * 1.5; const y = r() * 2.2 * R; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(R * .7, y + (r() - .5) * 10, R * 1.4, y + (r() - .5) * 10, 2.2 * R, y + (r() - .5) * 6); x.stroke(); } x.drawImage(S.oiled, .05 * R, .05 * R, 2.1 * R, 2.1 * R); });
    // the oil's wet shine: fine streaks the way a rag leaves them
    S.gloss = make(2.1 * R, 2.1 * R, x => { const r = rng(12); x.translate(1.05 * R, 1.05 * R); x.beginPath(); x.arc(0, 0, R, 0, TAU); x.clip(); for (let k = 0; k < 150; k++) { const y = (r() - .5) * 2 * R, x0 = (r() - .5) * 2.2 * R, w = R * (.15 + r() * .6); x.strokeStyle = `rgba(255,252,240,${(.15 + r() * .45).toFixed(3)})`; x.lineWidth = .6 + r() * 2.2; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + w, y + (r() - .5) * 3); x.stroke(); } });
    // the plane, seen from above, nose to the left: a bullnose, its mouth near the front so it planes right up to the
    // medallion's edge without reaching far past it; a cast body, the iron under a chrome lever cap, a brass nut, a rosewood tote
    const Lp = 1.5 * R, Wp = .76 * R, M = MOUTH; S.Lp = Lp; S.Wp = Wp;
    S.plane = make(Lp, Wp, x => {
      const r0 = Wp * .16; let q = x.createLinearGradient(0, 0, 0, Wp); q.addColorStop(0, "#615B56"); q.addColorStop(.08, "#34302D"); q.addColorStop(.92, "#1F1C1B"); q.addColorStop(1, "#121010");
      x.fillStyle = q; x.beginPath(); x.moveTo(Lp * .09, 0); x.lineTo(Lp - r0, 0); x.quadraticCurveTo(Lp, 0, Lp, r0); x.lineTo(Lp, Wp - r0); x.quadraticCurveTo(Lp, Wp, Lp - r0, Wp); x.lineTo(Lp * .09, Wp); x.bezierCurveTo(Lp * .015, Wp, 0, Wp * .78, 0, Wp * .5); x.bezierCurveTo(0, Wp * .22, Lp * .015, 0, Lp * .09, 0); x.closePath(); x.fill();
      x.lineWidth = Math.max(1, Wp * .022); x.strokeStyle = "rgba(232,236,242,.9)"; x.beginPath(); x.moveTo(Lp * .08, Wp * .028); x.lineTo(Lp - r0, Wp * .028); x.stroke();
      x.strokeStyle = "rgba(170,175,182,.4)"; x.beginPath(); x.moveTo(Lp * .08, Wp * .972); x.lineTo(Lp - r0, Wp * .972); x.stroke();
      q = x.createLinearGradient(0, 0, Lp * .09, 0); q.addColorStop(0, "rgba(220,224,230,.55)"); q.addColorStop(1, "rgba(220,224,230,0)"); x.fillStyle = q; x.fillRect(0, Wp * .1, Lp * .09, Wp * .8); // the nose's machined face
      x.fillStyle = "#181414"; x.beginPath(); x.roundRect(Lp * .06, Wp * .1, Lp * .89, Wp * .8, r0 * .45); x.fill();
      x.fillStyle = "#050404"; x.fillRect(Lp * (M - .018), Wp * .09, Lp * .028, Wp * .82);
      x.fillStyle = "rgba(240,242,246,.95)"; x.fillRect(Lp * (M + .008), Wp * .1, Math.max(1, Lp * .006), Wp * .8);
      q = x.createLinearGradient(0, Wp * .12, 0, Wp * .88); q.addColorStop(0, "#B6BCC4"); q.addColorStop(1, "#6E747C"); x.fillStyle = q; x.fillRect(Lp * (M + .014), Wp * .12, Lp * .3, Wp * .76); // the iron and its cap iron
      q = x.createLinearGradient(0, Wp * .15, 0, Wp * .85); q.addColorStop(0, "#F7F9FB"); q.addColorStop(.28, "#C3C8CE"); q.addColorStop(.56, "#878D95"); q.addColorStop(1, "#DADEE2");
      x.fillStyle = q; x.beginPath(); x.moveTo(Lp * (M + .04), Wp * .16); x.lineTo(Lp * .43, Wp * .2); x.quadraticCurveTo(Lp * .52, Wp * .5, Lp * .43, Wp * .8); x.lineTo(Lp * (M + .04), Wp * .84); x.closePath(); x.fill();
      x.strokeStyle = "rgba(255,255,255,.8)"; x.lineWidth = Math.max(1, Wp * .02); x.beginPath(); x.moveTo(Lp * (M + .06), Wp * .24); x.lineTo(Lp * .42, Wp * .27); x.stroke();
      x.fillStyle = "#2A2626"; x.beginPath(); x.ellipse(Lp * .37, Wp * .5, Lp * .026, Wp * .1, 0, 0, TAU); x.fill();
      x.fillStyle = "#D2D6DB"; x.beginPath(); x.roundRect(Lp * .41, Wp * .42, Lp * .06, Wp * .16, Wp * .04); x.fill();
      x.strokeStyle = "#8E949B"; x.lineWidth = Math.max(1, Wp * .03); x.beginPath(); x.moveTo(Lp * .55, Wp * .5); x.lineTo(Lp * .5, Wp * .24); x.stroke(); // the lateral lever
      q = x.createRadialGradient(Lp * .57, Wp * .46, 0, Lp * .575, Wp * .5, Wp * .1); q.addColorStop(0, "#F8E29A"); q.addColorStop(1, "#8C6A22"); x.fillStyle = q; x.beginPath(); x.arc(Lp * .575, Wp * .5, Wp * .085, 0, TAU); x.fill();
      x.strokeStyle = "rgba(90,66,20,.6)"; x.lineWidth = 1; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; x.beginPath(); x.moveTo(Lp * .575 + Math.cos(a) * Wp * .06, Wp * .5 + Math.sin(a) * Wp * .06); x.lineTo(Lp * .575 + Math.cos(a) * Wp * .085, Wp * .5 + Math.sin(a) * Wp * .085); x.stroke(); }
      const rose = (gx, gy, rr) => { const t = x.createRadialGradient(gx - rr * .35, gy - rr * .5, rr * .05, gx, gy, rr); t.addColorStop(0, "#C8784E"); t.addColorStop(.55, "#7E331A"); t.addColorStop(1, "#46180A"); return t; };
      x.fillStyle = rose(Lp * .8, Wp * .5, Wp * .34); x.beginPath(); x.moveTo(Lp * .64, Wp * .41); x.quadraticCurveTo(Lp * .82, Wp * .33, Lp * .975, Wp * .42); x.quadraticCurveTo(Lp * .995, Wp * .5, Lp * .975, Wp * .58); x.quadraticCurveTo(Lp * .82, Wp * .67, Lp * .64, Wp * .59); x.quadraticCurveTo(Lp * .62, Wp * .5, Lp * .64, Wp * .41); x.closePath(); x.fill();
      x.strokeStyle = "rgba(255,214,186,.5)"; x.lineWidth = Math.max(1, Wp * .026); x.beginPath(); x.moveTo(Lp * .67, Wp * .44); x.quadraticCurveTo(Lp * .82, Wp * .38, Lp * .96, Wp * .45); x.stroke();
      x.fillStyle = "rgba(20,8,4,.35)"; x.beginPath(); x.ellipse(Lp * .66, Wp * .5, Lp * .018, Wp * .07, 0, 0, TAU); x.fill(); // the tote's bolt
    });
    S.planeSh = shadowOf(S.plane, 7, "rgba(60,40,20,.5)");
    // the rag: a wad of linen, dark with oil in the middle, creased
    const rw = .62 * R, rh = .46 * R; S.rw = rw; S.rh = rh;
    S.rag = make(rw, rh, x => {
      const r = rng(71), n = noise1(71, 32), pts = Array.from({ length: 44 }, (_, i) => { const a = i / 44 * TAU, k = .8 + .2 * n(i * .9); return [rw / 2 + Math.cos(a) * rw * .47 * k, rh / 2 + Math.sin(a) * rh * .45 * k]; });
      let q = x.createLinearGradient(0, 0, rw, rh); q.addColorStop(0, "#FBF6EA"); q.addColorStop(1, "#DFD0B4"); x.fillStyle = q; trace(x, pts); x.fill();
      q = x.createRadialGradient(rw * .55, rh * .58, 0, rw * .55, rh * .58, rw * .32); q.addColorStop(0, "rgba(168,110,40,.62)"); q.addColorStop(1, "rgba(168,110,40,0)"); x.fillStyle = q; trace(x, pts); x.fill();
      x.lineWidth = Math.max(1, R * .008); for (let k = 0; k < 7; k++) { const y0 = rh * (.2 + r() * .6), x0 = rw * (.1 + r() * .35), x1 = x0 + rw * (.25 + r() * .35); x.strokeStyle = "rgba(140,112,78,.6)"; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo((x0 + x1) / 2, y0 + (r() - .5) * rh * .35, x1, y0 + (r() - .5) * rh * .25); x.stroke(); x.strokeStyle = "rgba(255,255,255,.55)"; x.beginPath(); x.moveTo(x0 + 2, y0 - 1.5); x.quadraticCurveTo((x0 + x1) / 2, y0 - 1.5 + (r() - .5) * rh * .2, x1 - 3, y0 - 2); x.stroke(); }
    });
    S.ragSh = shadowOf(S.rag, 6, "rgba(60,40,20,.45)");
  }
  /** the plank, laid once: pale, the grain running the long way, a knot low and to the right with the grain closing
   *  round it, the sawn ends a shade darker, pores, a speck of grain over all of it */
  function plankDay(bg, W, H) {
    const G = ["#F3E7D3", "#ECDFC8", "#E3D3B8", "#D8C4A4"].map(hex), r = rng(29), n1 = noise1(7, 128), n2 = noise1(13, 64);
    let q = bg.createLinearGradient(0, 0, 0, H); q.addColorStop(0, rgba(G[1])); q.addColorStop(.28, rgba(G[0])); q.addColorStop(.64, rgba(G[0])); q.addColorStop(1, rgba(G[1]));
    bg.fillStyle = q; bg.fillRect(0, 0, W, H);
    const kx = W * (S.pr ? .86 : .88), ky = H * (S.pr ? .955 : .87), kr = Math.min(W, H) * .045;
    const lines = Math.round(H / 6.5);
    for (let i = 0; i < lines; i++) {
      const y0 = (i + r() * .9) / lines * H * 1.06 - H * .03, c = G[1 + Math.floor(r() * 3)], w = .5 + Math.pow(r(), 3) * 3;
      bg.strokeStyle = rgba(c, .16 + r() * .42); bg.lineWidth = w; bg.beginPath();
      for (let x = -10; x <= W + 10; x += 8) {
        let y = y0 + (fbm(n1, x / 560 + y0 / 320, 3) - .5) * 40 + (fbm(n2, x / 80 + i * .7, 2) - .5) * 2.4;
        const dx = (x - kx) / (kr * 3.4), dy = (y - ky) / (kr * 1.4), d2 = dx * dx + dy * dy; if (d2 < 9) y += (y - ky) / (Math.abs(y - ky) + kr * .35) * kr * 1.1 * Math.exp(-d2); // the grain parts round the knot
        x > -10 ? bg.lineTo(x, y) : bg.moveTo(x, y);
      }
      bg.stroke();
    }
    for (let k = 5; k >= 0; k--) { bg.strokeStyle = rgba(G[k > 2 ? 2 : 3], .3 + (5 - k) * .09); bg.lineWidth = 1.6 + (5 - k) * .45; bg.beginPath(); bg.ellipse(kx, ky, kr * (.3 + k * .4), kr * (.12 + k * .16), 0, 0, TAU); bg.stroke(); }
    bg.fillStyle = rgba(G[3], .85); bg.beginPath(); bg.ellipse(kx, ky, kr * .26, kr * .1, 0, 0, TAU); bg.fill();
    bg.fillStyle = rgba(G[3], .32); for (let k = 0; k < W * H / 1400; k++) bg.fillRect(r() * W, r() * H, 1.5 + r() * 4, .8);
    for (const [x0, x1] of [[0, W * .09], [W, W * .91]]) { const e = bg.createLinearGradient(x0, 0, x1, 0); e.addColorStop(0, rgba(G[2], .8)); e.addColorStop(1, rgba(G[2], 0)); bg.fillStyle = e; bg.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), H); }
    bg.fillStyle = bg.createPattern(K.grain(160, 160, 11, .035), "repeat"); bg.fillRect(0, 0, W, H);
  }
  /** how far left (in the medallion's units) a tool working a band may take the point it is steered by, before its
   *  leading edge, `lead` pixels on, comes near a word: the pass stops short there, and what it leaves is under the tool */
  const leftStop = (y, hh, lead, far) => { const { cx, cy, R } = S; let s = -far;
    for (const [, y0, x1, y1] of S.raw || []) { if (x1 > cx || y1 < cy + (y - hh) * R - 12 || y0 > cy + (y + hh) * R + 12) continue; s = Math.max(s, (x1 + 12 + lead - cx) / R); }
    return Math.min(s, far - .7); };
  /** where the plane is at loop time t: the blade's x and the band's y in the medallion's units, how high it's lifted */
  const planeAt = T => {
    const [p0, p1, p2, p3] = BD.plane, P = BD.passes, E0 = S.pstop; if (T < p0 || T > p3) return null;
    const xOff = (S.W + S.Lp * MOUTH + 24 - S.cx) / S.R;
    if (T < p1) { const q = seg(T, p0, p1, lin); return { x: lerp(xOff, SPAN[0], E.out(q)), y: BANDS[0][2], z: 1 - seg(q, .55, 1, E.io) }; }
    for (let j = 0; j < 3; j++) { const [a, b] = P[j]; if (T > b) continue;
      if (T >= a) return { x: lerp(SPAN[j], E0[j], E.sine(seg(T, a, b, lin))), y: BANDS[j][2], z: 0, j };
      const q = seg(T, P[j - 1][1], a, lin); return { x: lerp(E0[j - 1], SPAN[j], E.io(q)), y: lerp(BANDS[j - 1][2], BANDS[j][2], E.io(q)), z: Math.sin(Math.PI * q) }; }
    const q = seg(T, p2, p3, lin); return { x: lerp(E0[2], xOff, E.in(q)), y: BANDS[2][2], z: Math.min(1, q * 3) };
  };
  /** when curl j leaves the plane: as the plane sets down at the right for its next pass, or (the last) as it goes */
  const releaseAt = j => { if (j < 2) return BD.passes[j + 1][0] - .02; const [, , p2, p3] = BD.plane, xOff = (S.W + S.Lp * MOUTH + 24 - S.cx) / S.R, e = S.pstop[2]; return p2 + Math.cbrt(clamp((.9 - e) / (xOff - e))) * (p3 - p2); };
  /** a curl of shaving: growing in the plane's throat through its pass, carried back in it, then flicked out at the right
   *  and rolled off the page on the side away from the list */
  const curlAt = (j, T) => {
    const [a, b] = BD.passes[j]; if (T < a) return null; const s = E.sine(seg(T, a, b, lin)), rc = lerp(.035, .13, s), tr = releaseAt(j);
    if (T <= tr) { const pl = planeAt(T); if (!pl) return null; return { x: pl.x + .03 + rc, y: pl.y, rc, z: pl.z, yaw: 0, src: T <= b ? pl.x : S.pstop[j], turn: s * 3, inPlane: true }; }
    const q = T - tr; if (q > BD.roll) return null;
    const p0 = planeAt(tr) || { x: SPAN[j], y: BANDS[j][2], z: 0 }, [dx, dy] = S.curlDir, x0 = p0.x + .03 + rc, y0 = p0.y, sx = S.cx + x0 * S.R, sy = S.cy + y0 * S.R, D = (out(sx, sy, dx, dy) + (rc + .34) * S.R + 30) / S.R, k = q / BD.roll, dist = D * (.35 * k + .65 * k * k);
    return { x: x0 + dx * dist, y: y0 + dy * dist, rc, z: q < .3 ? Math.max(p0.z * (1 - q / .3), Math.sin(Math.PI * q / .3) * .9) : 0, yaw: Math.atan2(dy, dx) * E.io(Math.min(1, q / .35)), src: S.pstop[j] + dist * .6, turn: 3 + dist / rc };
  };
  const ragOff = ([u, v]) => { const [dx, dy] = S.away, sx = S.cx + u * S.R, sy = S.cy + v * S.R, d = out(sx, sy, dx, dy) + S.rw * .7 + 24; return [u + dx * d / S.R, v + dy * d / S.R]; };
  /** where each of the rag's rows starts and ends: right to left, left to right, right to left (short of any word) */
  const rowEnds = j => j % 2 ? [S.rstop[j], 1.02] : [1.02, S.rstop[j]];
  /** where the rag is: in from the side away from the words, three wipes back and forth down the medallion, off again */
  const ragAt = T => {
    const [r0, r1, r2, r3] = BD.rag, P = BD.wipes; if (T < r0 || T > r3) return null;
    const st = [1.02, WIPEY[0]], en = [S.rstop[2], WIPEY[2]];
    if (T < r1) { const q = E.out(seg(T, r0, r1, lin)), o = ragOff(st); return { x: lerp(o[0], st[0], q), y: lerp(o[1], st[1], q), z: 1 - q }; }
    for (let j = 0; j < 3; j++) { const [a, b] = P[j], [xa, xb] = rowEnds(j); if (T > b) continue;
      if (T >= a) return { x: lerp(xa, xb, E.sine(seg(T, a, b, lin))), y: WIPEY[j], z: 0, j };
      const q = E.io(seg(T, P[j - 1][1], a, lin)); return { x: lerp(rowEnds(j - 1)[1], xa, q), y: lerp(WIPEY[j - 1], WIPEY[j], q), z: .3 * Math.sin(Math.PI * q) }; }
    const q = E.in(seg(T, r2, r3, lin)), o = ragOff(en); return { x: lerp(en[0], o[0], q), y: lerp(en[1], o[1], q), z: Math.min(1, q * 2.5) };
  };
  /** a band the rag has wiped, from where it started to x: a little wavy along its edges, the way oil takes */
  const wipePoly = (j, xa, xb) => { const top = [], bot = [], y = WIPEY[j]; for (let i = 0; i <= 20; i++) { const x = lerp(xa, xb, i / 20); top.push([x, y - .42 + .03 * Math.sin(x * 11 + j * 2)]); bot.push([x, y + .42 + .03 * Math.sin(x * 9 + j * 3 + 1)]); } return [...top, ...bot.reverse()]; };

  function drawDay(T, I, A, F) {
    const { W, H } = S; g.clearRect(0, 0, W, H);
    glide(A); if (S.vis < .01) return;
    if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) buildDay();
    const { cx, cy, R } = S, on = I > .01, V = S.vis, L = v => lerp(1, v, I), k = R / S.RR;
    S.curlDir = [.96, .28]; // the curls go off to the right: the list is never there
    S.pstop = BANDS.map(([, , y], j) => leftStop(y, .4, S.Lp * k * MOUTH, SPAN[j])); S.rstop = WIPEY.map(y => leftStop(y, .66, S.rw * k * .5, 1.02)); // the tools keep short of the words
    const put = (c, a = 1) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.globalAlpha = 1; };
    /** clip to what the rag has wiped so far (bands in the medallion's units), then back to the page's own pixels */
    const wiped = (only = -1) => { g.translate(cx, cy); g.scale(R, R); g.beginPath(); BD.wipes.forEach(([a, b], j) => { if (only >= 0 && j !== only) return; const q = only >= 0 ? seg(T, a, b, E.sine) : L(seg(T, a, b, E.sine)); if (q <= 0) return;
      const [xa, xb] = rowEnds(j), from = xa > 0 ? 1.12 : -1.12; wipePoly(j, from, q >= 1 ? -from : lerp(xa, xb, q)).forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.closePath(); }); g.clip(); g.setTransform(px, 0, 0, px, 0, 0); };
    /** a piece at (sx, sy) on the page, turned by rot, lifted by z (its shadow falling away as it rises) */
    const piece = (p, sx, sy, rot, z, a = 1) => {
      const w = (p.bb.x1 - p.bb.x0) * R, h = (p.bb.y1 - p.bb.y0) * R, ox = (p.bb.x0 - p.c[0]) * R, oy = (p.bb.y0 - p.c[1]) * R, sc = 1 + .07 * z;
      if (z > .01) { const b = 4 * k; g.save(); g.globalAlpha = a * V * Math.min(1, z * 2) * .9; g.translate(sx + (3 + 10 * z) * k, sy + (5 + 15 * z) * k); g.rotate(rot); g.scale(sc, sc); g.drawImage(p.sh, ox - 2 * b, oy - 2 * b, w + 4 * b, h + 4 * b); g.restore(); }
      g.save(); g.globalAlpha = a * V; g.translate(sx, sy); g.rotate(rot); g.scale(sc, sc); g.drawImage(p.spr, ox, oy, w, h); g.restore();
    };
    /** a piece's way in: from past the page's edge on the side away from the words, turning, lifted, dropped into place */
    const fly = (p, q) => {
      const tx = cx + p.c[0] * R, ty = cy + p.c[1] * R, aw = Math.atan2(S.away[1], S.away[0]), pa = Math.hypot(p.c[0], p.c[1]) < .12 ? aw : Math.atan2(p.c[1], p.c[0]);
      let sp = pa - aw; while (sp > Math.PI) sp -= TAU; while (sp < -Math.PI) sp += TAU; const ang = aw + clamp(sp, -1.15, 1.15) * .85, dx = Math.cos(ang), dy = Math.sin(ang);
      const D = out(tx, ty, dx, dy) + p.L * R + 30, e = E.out(q), side = p.bow * Math.sin(Math.PI * e) * D * .14;
      return [tx + dx * D * (1 - e) - dy * side, ty + dy * D * (1 - e) + dx * side, p.rot0 * (1 - E.out(q)), 1 - seg(q, .72, 1, E.in)];
    };
    const phase = !on || T < BD.plane[0] || T >= BD.rag[3] ? 0 : T < BD.ring[0] ? 1 : T < BD.done ? 2 : T < BD.rag[0] ? 3 : 4;
    if (phase === 0) put(S.oiled);
    else if (phase === 1) { // the plane has taken these bands back to the plank
      g.save(); g.beginPath(); g.rect(cx - 1.1 * R, cy - 1.1 * R, 2.2 * R, 2.2 * R);
      BD.passes.forEach(([a, b], j) => { const s = E.sine(seg(T, a, b, lin)); if (s <= 0 || I <= .01) return; const xb = lerp(1.12, s >= 1 ? -1.12 : lerp(SPAN[j], S.pstop[j], s), I); /* cut up to the blade, under the plane */ g.rect(cx + xb * R, cy + BANDS[j][0] * R, (1.12 - xb) * R, (BANDS[j][1] - BANDS[j][0]) * R); });
      g.clip("evenodd"); put(S.oiled); g.restore();
    } else if (phase === 2) { // the pieces come back: what has landed is kept on a layer drawn again only when another lands
      const L2 = v => lerp(1, v, I * I); // touched mid-way, what is in flight hurries home before the oiled inlay comes back over it
      const ringQ = L2(seg(T, BD.ring[0], BD.ring[1], lin)), fq = L2(seg(T, BD.fan[0], BD.fan[1], lin)), sw = L2(seg(T, BD.fan[1], BD.fan[2], E.out)), maxEnd = S.away[0] >= -.2, th = RAYS.map(p => p.grain);
      const qs = REST.map(p => L2(seg(T, p.t0, p.t1, lin))), fanDone = fq >= 1 && sw >= 1, ringDone = ringQ >= 1, RR = S.RR, n = Math.ceil(2.1 * RR * px);
      put(S.landed(n, n, (ringDone ? "r" : "") + (fanDone ? "f" : "") + qs.map(q => q >= 1 ? 1 : 0).join("") + RR, x => {
        x.imageSmoothingEnabled = true; x.setTransform(px * RR, 0, 0, px * RR, 1.05 * RR * px, 1.05 * RR * px); const at = p => x.drawImage(p.spr, p.bb.x0, p.bb.y0, p.bb.x1 - p.bb.x0, p.bb.y1 - p.bb.y0);
        if (fanDone) RAYS.forEach(at); REST.forEach((p, i) => { if (qs[i] >= 1) at(p); }); if (ringDone) x.drawImage(S.ringDry, -1.02, -1.02, 2.04, 2.04); x.setTransform(1, 0, 0, 1, 0, 0); }));
      // the fan: in closed from past the edge, pivoting on the medallion's middle, then opened as its leading ray sweeps round
      if (fq > 0 && !fanDone) {
        const [dx, dy] = S.away, D = out(cx, cy, dx, dy) + R + 30, e = E.out(fq), fx = cx + dx * D * (1 - e), fy = cy + dy * D * (1 - e), frot = (maxEnd ? -.8 : .8) * (1 - e), z = 1 - seg(fq, .7, 1, E.in);
        const lead = maxEnd ? lerp(th[NR - 1], th[0], sw) : lerp(th[0], th[NR - 1], sw), order = maxEnd ? RAYS.slice().reverse() : RAYS.slice(), top = order[NR - 1]; // the leading ray always on top of those still folded under it
        for (const p of order) { const held = maxEnd ? p.grain <= lead : p.grain >= lead; if (held && p !== top) continue; /* folded under the leader: not seen */
          const ang = (held ? lead : p.grain) - p.grain + frot, c = Math.cos(ang), s = Math.sin(ang), px2 = p.c[0] * c - p.c[1] * s, py2 = p.c[0] * s + p.c[1] * c; piece(p, fx + px2 * R, fy + py2 * R, ang, z); }
      }
      REST.forEach((p, i) => { const q = qs[i]; if (q <= 0 || q >= 1) return; const [x, y, rot, z] = fly(p, q); piece(p, x, y, rot, z); });
      // the banding, spun in from past the edge, over what is in flight
      if (ringQ > 0 && !ringDone) { const [dx, dy] = S.away, D = out(cx, cy, dx, dy) + 1.1 * R + 30, e = E.out(ringQ), x = cx + dx * D * (1 - e), y = cy + dy * D * (1 - e), rot = -(1 - E.back(ringQ)) * TAU * 1.15, z = 1 - seg(ringQ, .7, 1, E.in), sc = 1 + .05 * z;
        if (z > .01) { g.save(); g.globalAlpha = V * Math.min(1, z * 2) * .9; g.translate(x + (3 + 10 * z) * k, y + (5 + 15 * z) * k); g.rotate(rot); g.drawImage(S.ringSh, -1.02 * R - 10 * k, -1.02 * R - 10 * k, 2.04 * R + 20 * k, 2.04 * R + 20 * k); g.restore(); }
        g.save(); g.globalAlpha = V; g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.drawImage(S.ringDry, -1.02 * R, -1.02 * R, 2.04 * R, 2.04 * R); g.restore(); }
      // sawdust puffed out as each piece drops in
      g.fillStyle = "#C9AD80"; for (const p of REST) { const q = (T - p.t1) / .45; if (q < 0 || q > 1) continue; const r = rng(p.seed); for (let s = 0; s < 8; s++) { const a = r() * TAU, d = (p.L * .55 + .05 + .16 * E.out(q)) * R; g.globalAlpha = V * I * (1 - q) * .8; const sz = (1.2 + r() * 1.6) * Math.max(1, k); g.fillRect(cx + (p.c[0] + Math.cos(a) * d / R) * R, cy + (p.c[1] + Math.sin(a) * d / R) * R - q * 6, sz, sz); } } g.globalAlpha = 1;
      put(S.oiled, Math.pow(1 - I, 1.6));
    } else if (phase === 3) { put(S.dry); put(S.oiled, 1 - I); }
    else { put(S.dry); g.save(); wiped(); put(S.oiled); g.restore(); } // the oil: what the rag has wiped deepens
    // the wet shine the rag leaves, drying
    if (on && T > BD.wipes[0][0] && T < BD.wipes[2][1] + 1.9) BD.wipes.forEach(([, b], j) => { const wet = (1 - seg(T, b + .2, b + 1.9, E.sine)) * I; if (T < BD.wipes[j][0] || wet <= .01) return;
      g.save(); wiped(j); g.globalCompositeOperation = "screen"; put(S.gloss, .55 * wet); g.restore(); });
    // the light over it: a sheen drifting while the list is in use, and one running across once the oil is on
    const sheen = (s, a, w = .5) => { if (a <= .004) return; const dx = .83, dy = .56, q = g.createLinearGradient(cx + dx * (s - w) * R, cy + dy * (s - w) * R, cx + dx * (s + w) * R, cy + dy * (s + w) * R);
      q.addColorStop(0, "rgba(255,246,226,0)"); q.addColorStop(.5, `rgba(255,246,226,${clamp(a).toFixed(3)})`); q.addColorStop(1, "rgba(255,246,226,0)");
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip(); g.globalCompositeOperation = "soft-light"; g.fillStyle = q; g.fillRect(cx - R, cy - R, 2 * R, 2 * R); g.restore(); };
    const present = lerp(1, 1 - env(T, BD.plane[0] - .2, BD.plane[0] + .3, BD.rag[1], BD.rag[3], E.sine), I);
    sheen(Math.sin(A * .12) * 1.25, .5 * V * present);
    if (on) { const q = seg(T, BD.sheen[0], BD.sheen[1], lin); if (q > 0 && q < 1) { sheen(lerp(-1.7, 1.7, E.io(q)), .95 * I * V, .42); sheen(lerp(-1.7, 1.7, E.io(q)), .35 * I * V, .12); } }
    // the plane and its curls
    if (on && T > BD.plane[0] && T < BD.plane[3] + BD.roll) {
      for (let j = 0; j < 3; j++) { const c = curlAt(j, T); if (c && !c.inPlane) S.curl(j, c, I * V); }
      const pl = planeAt(T);
      if (pl) { const bx = cx + pl.x * R, by = cy + pl.y * R, sc = 1 + .05 * pl.z, Lp = S.Lp * k, Wp = S.Wp * k, b = 7 * k, dim = I * V;
        g.save(); g.globalAlpha = dim * (1 - .35 * pl.z); g.translate(bx + (5 + 22 * pl.z) * k, by + (8 + 28 * pl.z) * k); g.scale(sc, sc); g.drawImage(S.planeSh, -Lp * MOUTH - 2 * b, -Wp / 2 - 2 * b, Lp + 4 * b, Wp + 4 * b); g.restore();
        g.save(); g.globalAlpha = dim; g.translate(bx, by); g.scale(sc, sc); g.drawImage(S.plane, -Lp * MOUTH, -Wp / 2, Lp, Wp); g.restore();
        for (let j = 0; j < 3; j++) { const c = curlAt(j, T); if (c && c.inPlane) S.curl(j, c, dim); } }
    }
    // the rag
    if (on) { const rg = ragAt(T); if (rg) { const x = cx + rg.x * R + Math.sin(A * 23) * .012 * R * (rg.j !== undefined ? 1 : 0), y = cy + rg.y * R + Math.cos(A * 19) * .01 * R, rot = Math.sin(A * 3.1) * .08 + (rg.j !== undefined ? Math.sin(A * 17) * .05 : 0), sc = 1 + .06 * rg.z, rw = S.rw * k, rh = S.rh * k, b = 6 * k;
      g.save(); g.globalAlpha = I * V * .9; g.translate(x + (4 + 16 * rg.z) * k, y + (6 + 20 * rg.z) * k); g.rotate(rot); g.scale(sc, sc); g.drawImage(S.ragSh, -rw / 2 - 2 * b, -rh / 2 - 2 * b, rw + 4 * b, rh + 4 * b); g.restore();
      g.save(); g.globalAlpha = I * V; g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.drawImage(S.rag, -rw / 2, -rh / 2, rw, rh); g.restore(); } }
    // the finale: the pieces lift and settle in a wave from left to right, the light running along with it
    if (F >= 0) {
      const fr = E.io(seg(F, .06, .7, lin)); sheen(lerp(-1.8, 1.8, fr), .9 * V * env(F, .04, .12, .62, .8), .35);
      for (const p of [...RAYS, ...REST]) { const w0 = .06 + (p.c[0] + 1) * .27, z = env(F, w0, w0 + .08, w0 + .1, w0 + .24, E.sine); if (z <= .01) continue;
        const sx = cx + p.c[0] * R, sy = cy + p.c[1] * R - z * 9 * k, sc = 1 + .09 * z, w = (p.bb.x1 - p.bb.x0) * R, h = (p.bb.y1 - p.bb.y0) * R, b = 4 * k;
        g.save(); g.globalAlpha = V * z; g.translate(sx + 12 * z * k, sy + 18 * z * k); g.scale(sc, sc); g.drawImage(p.sh, (p.bb.x0 - p.c[0]) * R - 2 * b, (p.bb.y0 - p.c[1]) * R - 2 * b, w + 4 * b, h + 4 * b); g.restore();
        g.save(); g.globalAlpha = V; g.translate(sx, sy); g.scale(sc, sc); g.translate(-p.c[0] * R, -p.c[1] * R); g.scale(R, R); g.beginPath(); for (const q of p.polys) { trace(g, q.pts); g.clip(); } g.drawImage(S.oiled, -1.05, -1.05, 2.1, 2.1);
        g.globalCompositeOperation = "soft-light"; g.fillStyle = `rgba(255,248,228,${(.85 * z).toFixed(3)})`; g.fillRect(-1.1, -1.1, 2.2, 2.2); g.restore(); } /* and catches the light as it rises */
    }
  }
  /** a curl of shaving from pass j: a roll lying across the band it cut, the band's colours wound round it, lit like a
   *  cylinder, and its end turned a little toward us so the spiral it's wound in shows (turning as it rolls) */
  function curl(j, c, a) {
    const { cx, cy, R } = S, r = Math.max(2.5, c.rc * R), h = .64 * R, src = S.shave, sp = src.width / 2.2, len = Math.PI * c.rc * 1.3;
    let x0 = c.src; while (x0 + len > 1.08) x0 -= 2.1 - len; x0 = Math.max(-1.08, x0);
    g.save(); g.globalAlpha = a; g.translate(cx + c.x * R, cy + c.y * R - c.z * 10); g.rotate(c.yaw);
    g.fillStyle = "rgba(90,58,26,.26)"; g.beginPath(); g.ellipse(4 + c.z * 8, 5 + c.z * 10, r * 1.08, h * .53, 0, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.roundRect(-r, -h / 2, 2 * r, h, r * .5); g.clip();
    g.drawImage(src, (x0 + 1.1) * sp, (BANDS[j][0] + 1.12) * sp, len * sp, .64 * sp, -r, -h / 2, 2 * r, h);
    const q = g.createLinearGradient(-r, 0, r, 0); q.addColorStop(0, "rgba(80,46,18,.62)"); q.addColorStop(.26, "rgba(255,250,236,.45)"); q.addColorStop(.4, "rgba(255,250,236,0)"); q.addColorStop(.76, "rgba(80,46,18,.16)"); q.addColorStop(1, "rgba(80,46,18,.7)");
    g.fillStyle = q; g.fillRect(-r, -h / 2, 2 * r, h); g.restore();
    const ey = h / 2 - r * .3; g.fillStyle = "#E9D3AE"; g.beginPath(); g.ellipse(0, ey, r, r * .32, 0, 0, TAU); g.fill();
    g.strokeStyle = "rgba(118,76,36,.9)"; g.lineWidth = Math.max(.8, r * .09); g.beginPath();
    for (let i = 0; i <= 64; i++) { const f = i / 64, th = f * 2.7 * TAU + (c.turn || 0), rr = r * (.1 + .86 * f), ux = Math.cos(th) * rr, uy = ey + Math.sin(th) * rr * .32; i ? g.lineTo(ux, uy) : g.moveTo(ux, uy); } g.stroke();
    g.restore();
  }

  /* ================================ BY NIGHT: pyrography ================================ */
  const BN = { heat: [.5, 2.1], crumble: [1.0, 2.8], drift: .95, pen: [2.8, 3.2, 11.35, 11.9], cool: 1.3 };   // glow, crumble, ash's drift, the pen in / burning / done / out, how long a line takes to cool
  const ASH = [216, 200, 180], HOT = ["#FFF8E2", "#FFE19C", "#FFB257", "#F27E2E", "#C9541E"].map(hex), AGES = [.05, .12, .24, .42, .66, .95, 1.3], GLOWA = [.55, .42, .3, .18, .09, .035, 0];
  // the marks the pen burns, in its order: lines (points) and dots, each with its width in pixels and its strength
  const MARKS = !night ? [] : (() => {
    const r = rng(91), M = [], Ln = (pts, w, a, v = 1) => { if (pts.length > 1) M.push({ pts, w, a, v }); }, D = (p, w, a) => M.push({ pts: [p], w, a, dot: true });
    const inC = ([x, y], rr = .885) => x * x + y * y < rr * rr;
    const across = (P, f) => { const xs = new Set(P.map(([x]) => x)); for (let x = -1; x <= 1.0001; x += .02) xs.add(+x.toFixed(3)); return [...xs].sort((a, b) => a - b).map(x => [x, f(x)]).filter(p => inC(p)); };
    const runs = (pts, bad) => { const out = []; let cur = []; for (const p of pts) { if (bad(...p)) { if (cur.length > 1) out.push(cur); cur = []; } else cur.push(p); } if (cur.length > 1) out.push(cur); return out; };
    const circle = (rr, a0, dir, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + dir * i / n * TAU; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    const hatch = (inside, ang, gap) => { const out = [], ux = Math.cos(ang), uy = Math.sin(ang); let flip = false;
      for (let o = -1.3; o <= 1.3; o += gap) { let run = null; const done = () => { if (run && Math.hypot(run[1][0] - run[0][0], run[1][1] - run[0][1]) > .03) { const a = r() * .14, b = r() * .14, p0 = [lerp(run[0][0], run[1][0], a), lerp(run[0][1], run[1][1], a)], p1 = [lerp(run[1][0], run[0][0], b), lerp(run[1][1], run[0][1], b)]; out.push(flip ? [p1, p0] : [p0, p1]); flip = !flip; } run = null; };
        for (let t = -1.3; t <= 1.3; t += .008) { const x = -uy * o + ux * t, y = ux * o + uy * t; if (inside(x, y)) { if (!run) run = [[x, y], [x, y]]; else run[1] = [x, y]; } else done(); } done(); }
      return out; };
    const face = (lo, hi, la, lb) => (x, y) => inC([x, y], .875) && y > lo(x) + .014 && y < hi(x) - .012 && (!la || x > lx(la, y) + .014) && (!lb || x < lx(lb, y) - .014) && !behindPine(x, y);
    Ln(circle(.985, -.6, -1, 96), 2.6, 1, 1.9);
    Ln(circle(RI, -.6, 1, 90), 1.6, .85, 1.9);
    for (let i = 0; i < 60; i++) { const a = -.6 + i / 60 * TAU; D([Math.cos(a) * .943, Math.sin(a) * .943], 1.6, .8); } // a row of dots round the ring, between its two lines
    Ln(across(FAR, far), 2.2, 1);
    Ln(SNOWB.slice().reverse(), 1.2, .9); Ln(SNOWA.slice().reverse(), 1.2, .9);
    const lowFar = x => Math.min(near(x), HZ);
    hatch(face(far, lowFar, LA, LS), .7, .05).forEach(s => Ln(s, 1.2, .72, 1.4));
    hatch(face(far, lowFar, LS, LB), -.83, .05).forEach(s => Ln(s, 1.2, .72, 1.4));
    Ln(across(NEAR, near).reverse(), 2.2, 1);
    hatch(face(near, () => HZ, LV, LD), -.49, .036).forEach(s => Ln(s, 1.2, .78, 1.4));
    hatch(face(near, () => HZ, LC, LV), .55, .036).forEach(s => Ln(s, 1.2, .78, 1.4));
    runs(across([[-1, HZ], [1, HZ]], () => HZ), behindPine).forEach(s => Ln(s, 1.2, .8));
    const moon = []; for (let i = 0; i <= 90; i++) { const a = Math.PI * .92 + i / 90 * Math.PI * 1.16, p = [Math.cos(a) * SUN, Math.sin(a) * SUN]; if (p[1] < far(p[0]) - .008) moon.push(p); }
    Ln(moon, 2, 1);
    for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI, p = [Math.cos(a) * .31, Math.sin(a) * .31]; if (p[1] < far(p[0]) - .03) D(p, 1.2, .55); }
    for (const [bx, by, s] of [[-.34, -.47, .06], [-.21, -.53, .045]]) Ln([[bx - s, by - s * .35], [bx - s * .45, by - s * .6], [bx, by], [bx + s * .45, by - s * .6], [bx + s, by - s * .35]], 1.2, .9, 1.2);
    const stars = []; for (let t = 0; t < 3000 && stars.length < 20; t++) { const x = (r() - .5) * 1.7, y = -r() * .86, p = [x, y]; if (!inC(p, .8) || y > far(x) - .08 || Math.hypot(x, y) < .37 || stars.some(q => Math.hypot(q[0] - x, q[1] - y) < .1)) continue; stars.push(p); }
    stars.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])).forEach((p, i) => { if (i % 5 === 2) { Ln([[p[0] - .024, p[1]], [p[0] + .024, p[1]]], 1, .9, 1.4); Ln([[p[0], p[1] - .024], [p[0], p[1] + .024]], 1, .9, 1.4); } else D(p, 1 + r() * .8, .55 + r() * .45); });
    PINES.forEach(([bx, by, h]) => { Ln([[bx, by - h], [bx, by]], 1.8, .95, 1.3); const n = Math.round(h * 22);
      for (let k = 1; k <= n; k++) { const f = k / n, y = by - h + (h * .88) * f, w = h * (.05 + .27 * f), d = .018 + .05 * f; for (const s of k % 2 ? [1, -1] : [-1, 1]) Ln([[bx, y - .008], [bx + s * w * .55, y + d * .3], [bx + s * w, y + d]], 1.3, .88, 1.5); } });
    runs(across(SHORE, shore).reverse(), behindPine).forEach(s => Ln(s, 1.8, .92));
    for (let y = HZ + .025, k = 0; y < .6; y += .024, k++) { const hw = (.1 - (y - HZ) * .17) * (.75 + .5 * r()), c0 = (r() - .5) * .02; if (hw < .012) break; const s = [[c0 - hw, y], [c0 + hw, y]]; Ln(k % 2 ? s.reverse() : s, 1.2, .95, 1.3); }
    for (let t = 0, n = 0; t < 400 && n < 13; t++) { const x = (r() - .5) * 1.5, y = lerp(HZ + .04, shore(x) - .03, r()), l = .04 + r() * .07; if (Math.abs(x) < .17 || !inC([x - l, y]) || !inC([x + l, y]) || behindPine(x, y) || behindPine(x + l, y)) continue; Ln([[x, y], [x + l, y]], 1, .5, 1.3); n++; }
    for (let t = 0, n = 0; t < 400 && n < 16; t++) { const x = (r() - .5) * 1.5, y = shore(x) + .025 + r() * .05; if (!inC([x, y], .86) || behindPine(x, y)) continue; Ln([[x, y], [x + .012, y - .035 - r() * .02]], 1, .6, 1.5); n++; }
    const mn = noise1(55, 32), dots = []; for (let t = 0; t < 8000 && dots.length < 90; t++) { const a = r() * TAU, d = Math.sqrt(r()) * (SUN - .022), x = Math.cos(a) * d, y = Math.sin(a) * d; if (y > far(x) - .016) continue; if (fbm(mn, x * 5 + y * 3.7 + 9, 2) < .46 && r() < .72) continue; if (dots.some(q => Math.hypot(q[0] - x, q[1] - y) < .024)) continue; dots.push([x, y]); }
    dots.sort((p, q) => { const a = Math.round(p[1] / .04), b = Math.round(q[1] / .04); return a - b || (a % 2 ? q[0] - p[0] : p[0] - q[0]); }).forEach(p => D(p, 1.1 + r() * .5, .9));
    // when the pen reaches each point: lines at its pace (the ring at a compass's), dots a tap each, hops between
    let t = 0, prev = null; for (const m of M) { const p0 = m.pts[0]; if (prev) t += Math.hypot(p0[0] - prev[0], p0[1] - prev[1]) / 16 + (m.dot ? .004 : .008);
      m.len = 0; m.cum = [0]; for (let i = 1; i < m.pts.length; i++) { m.len += Math.hypot(m.pts[i][0] - m.pts[i - 1][0], m.pts[i][1] - m.pts[i - 1][1]); m.cum.push(m.len); }
      m.s = t; t += m.dot ? .014 : m.len / (3.4 * m.v); m.e = t; prev = m.pts[m.pts.length - 1]; }
    const k = (BN.pen[2] - BN.pen[1]) / t; for (const m of M) { m.s = BN.pen[1] + m.s * k; m.e = BN.pen[1] + m.e * k; m.ts = m.cum.map(c => m.s + (m.len ? c / m.len : 1) * (m.e - m.s)); }
    return M;
  })();
  // the same marks as pieces the pen lays down, in time order: segments of line, and dots
  const SEGS = []; MARKS.forEach(m => { if (m.dot) SEGS.push({ dot: true, a: m.pts[0], t0: m.s, t1: m.e, w: m.w, al: m.a }); else for (let i = 1; i < m.pts.length; i++) SEGS.push({ a: m.pts[i - 1], b: m.pts[i], t0: m.ts[i - 1], t1: m.ts[i], w: m.w, al: m.a }); });
  SEGS.sort((a, b) => a.t1 - b.t1);
  // ash to crumble: points along every mark, each with how far it is from the moon
  const ASHES = (() => { const r = rng(17), out = []; for (const s of SEGS) { if (s.dot) { out.push({ x: s.a[0], y: s.a[1], s: r() }); continue; } const l = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]); for (let d = r() * .06; d < l; d += .06) { const f = d / l; out.push({ x: lerp(s.a[0], s.b[0], f), y: lerp(s.a[1], s.b[1], f), s: r() }); } } out.forEach(p => { p.d = Math.hypot(p.x, p.y); }); return out; })();
  /** where the pen's tip is at time t, and whether it is down */
  const tipAt = t => {
    const M = MARKS, [p0, p1, p2, p3] = BN.pen; if (t <= p0 || t >= p3) return null;
    if (t < p1) { const q = E.out(seg(t, p0, p1, lin)), o = penOff(M[0].pts[0]); return { u: lerp(o[0], M[0].pts[0][0], q), v: lerp(o[1], M[0].pts[0][1], q), down: 0, z: 1 - q }; }
    const last = M[M.length - 1], lp = last.pts[last.pts.length - 1]; if (t > last.e) { const q = E.in(seg(t, last.e, p3, lin)), o = penOff(lp); return { u: lerp(lp[0], o[0], q), v: lerp(lp[1], o[1], q), down: 0, z: Math.min(1, q * 3) }; }
    let lo = 0, hi = M.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (M[mid].s <= t) lo = mid; else hi = mid - 1; }
    const m = M[lo];
    if (t <= m.e) { if (m.dot) return { u: m.pts[0][0], v: m.pts[0][1], down: 1, z: 0 }; let i = 1; while (i < m.ts.length - 1 && m.ts[i] < t) i++; const f = clamp((t - m.ts[i - 1]) / ((m.ts[i] - m.ts[i - 1]) || 1)); return { u: lerp(m.pts[i - 1][0], m.pts[i][0], f), v: lerp(m.pts[i - 1][1], m.pts[i][1], f), down: 1, z: 0 }; }
    const n = M[lo + 1], a = m.pts[m.pts.length - 1], b = n.pts[0], q = clamp((t - m.e) / ((n.s - m.e) || 1)); return { u: lerp(a[0], b[0], E.sine(q)), v: lerp(a[1], b[1], E.sine(q)), down: 0, z: Math.sin(Math.PI * q) * .5 };
  };
  const penOff = ([u, v]) => { const [dx, dy] = S.penDir, sx = S.cx + u * S.R, sy = S.cy + v * S.R, d = out(sx, sy, dx, dy) + (S.penL || 120) + 30; return [u + dx * d / S.R, v + dy * d / S.R]; };
  /** the charred plank, laid once: the char mottled, and crazed where the fire took hold deepest — long checks along the
   *  grain, broken, with short jagged cracks across between them, each scale's upper edge catching a little light; the
   *  grain only just there; ash; soot gathered low and in the corners. Some of the checks keep an ember. */
  function plankNight(bg, W, H) {
    const G = ["#1B1512", "#221A15", "#2C221B", "#382C22"].map(hex), r = rng(43), n1 = noise1(31, 128), n2 = noise1(37, 64), n3 = noise1(41, 64);
    let q = bg.createLinearGradient(0, 0, 0, H); q.addColorStop(0, rgba(G[1])); q.addColorStop(.34, rgba(G[2])); q.addColorStop(.78, rgba(G[1])); q.addColorStop(1, rgba(G[0]));
    bg.fillStyle = q; bg.fillRect(0, 0, W, H);
    for (let k = 0; k < Math.round(W * H / 40000); k++) { const x = r() * W, y = r() * H, rad = 40 + r() * 170, lite = r() < .42, c = lite ? G[3] : [13, 9, 7]; q = bg.createRadialGradient(x, y, 0, x, y, rad); q.addColorStop(0, rgba(c, lite ? .2 : .38)); q.addColorStop(1, rgba(c, 0)); bg.fillStyle = q; bg.fillRect(x - rad, y - rad, rad * 2, rad * 2); } // the mottling
    const deep = (x, y) => clamp((fbm(n1, x / 420 + y / 260 + 3, 3) - .34) * 2.6);
    for (let i = 0; i < H / 9; i++) { const y0 = r() * H; bg.strokeStyle = rgba(G[3], .12 + r() * .3); bg.lineWidth = .6 + r() * 2; bg.beginPath(); for (let x = -10; x <= W + 10; x += 10) { const y = y0 + (fbm(n3, x / 480 + y0 / 260, 3) - .5) * 30; x > -10 ? bg.lineTo(x, y) : bg.moveTo(x, y); } bg.stroke(); }
    const edge = (y0, x) => y0 + (fbm(n2, x / 300 + y0 / 170, 3) - .5) * 26 + (fbm(n3, x / 21 + y0 * .37, 2) - .5) * 2.4, lanes = []; for (let y = -12; y < H + 24; y += 7 + r() * 12) lanes.push(y);
    const P = [0, 1, 2, 3].map(() => ({ c: new Path2D(), l: new Path2D() })), cand = []; // by how deep: the cracks, and the lit edges under them
    for (let i = 0; i < lanes.length - 1; i++) { const y0 = lanes[i], y1 = lanes[i + 1];
      for (let x = -r() * 90; x < W + 10;) { const len = 26 + r() * 170, d = deep(x + len / 2, y0); // the long check along this lane, in pieces
        if (d > .06) { const b = P[Math.min(3, Math.floor(d * 4))]; b.c.moveTo(x, edge(y0, x)); b.l.moveTo(x + 2, edge(y0, x + 2) + 1.4); for (let xx = x + 5; xx <= x + len; xx += 5) { b.c.lineTo(xx, edge(y0, xx)); b.l.lineTo(xx, edge(y0, xx) + 1.4); } if (d > .45 && len > 50 && r() < .2) cand.push([x + 6, y0, len - 12]); }
        x += len + 6 + r() * 46; }
      for (let x = -r() * 40; x < W + 10; x += 11 + r() * 36) { const d = deep(x, (y0 + y1) / 2); if (d <= .06 || r() < .22) continue; // the short cracks across, down to the next
        const b = P[Math.min(3, Math.floor(d * 4))], xb = x + (r() - .5) * 7, ya = edge(y0, x), yb = edge(y1, xb); b.c.moveTo(x, ya); b.c.lineTo((x + xb) / 2 + (r() - .5) * 4, (ya + yb) / 2); b.c.lineTo(xb, yb); } }
    P.forEach((b, k) => { const d = (k + .5) / 4; bg.strokeStyle = rgba([7, 5, 4], .35 + .5 * d); bg.lineWidth = .7 + d; bg.stroke(b.c); bg.strokeStyle = rgba([112, 98, 88], .05 + .13 * d); bg.lineWidth = .7; bg.stroke(b.l); });
    for (let k = 0; k < W * H / 2200; k++) { bg.fillStyle = rgba(r() < .7 ? G[3] : [96, 84, 74], .25 + r() * .4); const s = .8 + r() * 1.2; bg.fillRect(r() * W, r() * H, s, s); }
    q = bg.createRadialGradient(W * .5, H * .4, Math.min(W, H) * .25, W * .5, H * .45, Math.hypot(W, H) * .62); q.addColorStop(0, rgba(G[0], 0)); q.addColorStop(1, rgba(G[0], .85)); bg.fillStyle = q; bg.fillRect(0, 0, W, H);
    q = bg.createLinearGradient(0, H * .7, 0, H); q.addColorStop(0, rgba(G[0], 0)); q.addColorStop(1, rgba([14, 10, 8], .7)); bg.fillStyle = q; bg.fillRect(0, H * .7, W, H * .3);
    // the embers: a stretch of a check that glows and goes dark again, here and there in the deepest char
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    S.embers = []; S.halo = K.glowSpr(24, [255, 110, 30], .7);
    for (const [xa, y0, len] of cand) { const L = Math.min(len, 24 + r() * 34), x = xa + L / 2, y = edge(y0, x); if (S.embers.length >= (S.pr ? 9 : 16) || S.embers.some(e => Math.hypot(e.x - x, e.y - y) < 90)) continue;
      const pts = []; for (let xx = 0; xx <= L + .1; xx += 3) pts.push([xx, edge(y0, xa + xx) - y]); const top = Math.min(...pts.map(p => p[1])), bot = Math.max(...pts.map(p => p[1])), w = L + 24, h = bot - top + 30;
      const spr = make(w, h, c => { c.translate(12, 15 - top); c.shadowColor = "rgba(255,110,30,.95)"; c.shadowBlur = 6 * px; c.strokeStyle = "#FF7A22"; c.lineWidth = 1.7; trace(c, pts, false); c.stroke(); c.shadowBlur = 0; c.strokeStyle = "#FFD58A"; c.lineWidth = .8; trace(c, pts.slice(Math.floor(pts.length * .2), Math.ceil(pts.length * .8)), false); c.stroke(); });
      S.embers.push({ x: xa + w / 2 - 12, y: y + (top + bot) / 2, spr, f: .28 + r() * .4, ph: r() * TAU, k: .6 + r() * .4 }); }
  }
  /** the canvases for this size: the picture whole in ash, its glow (small, so it blurs as it is drawn big), the ash as
   *  far as the pen has got, a scratch canvas for masks, the pen */
  function buildNight() {
    const R = S.R; S.RR = R; const n = Math.ceil(2.1 * R * px), ws = clamp(R / 190, .8, 1.35); S.ws = ws;
    const unit = (c, k = 1) => { const x = c.getContext("2d"); x.setTransform(px * R * k, 0, 0, px * R * k, 1.05 * R * px * k, 1.05 * R * px * k); x.lineCap = "round"; x.lineJoin = "round"; return x; };
    [S.full] = canvas(n, n); const fx = unit(S.full); for (const s of SEGS) S.ink(fx, s, ASH, s.al);
    [S.hotC] = canvas(n, n); const hx = unit(S.hotC); for (const s of SEGS) ink(hx, { ...s, w: s.w + .5 }, [255, 116, 40], 1);
    const gk = .3; [S.glowC] = canvas(Math.ceil(n * gk), Math.ceil(n * gk)); const gx = unit(S.glowC, gk); gx.strokeStyle = "rgb(255,100,26)"; gx.fillStyle = "rgb(255,100,26)";
    for (const s of SEGS) { if (s.dot) { gx.beginPath(); gx.arc(s.a[0], s.a[1], 2.2 / (R * px * gk), 0, TAU); gx.fill(); } else { gx.lineWidth = (s.w + 1.6) / (R * px * gk); gx.beginPath(); gx.moveTo(s.a[0], s.a[1]); gx.lineTo(s.b[0], s.b[1]); gx.stroke(); } }
    [S.tmp] = canvas(S.glowC.width, S.glowC.height); [S.tmp2] = canvas(n, n);
    [S.cold] = canvas(n, n); S.coldX = unit(S.cold); S.ci = 0; S.coldT = -1;
    const L = clamp(R * 1.05, 84, 170); S.penL = L;
    S.pen = make(L, L * .12, x => { const c = L * .06;
      x.strokeStyle = "#B58A52"; x.lineWidth = Math.max(1, L * .011); x.beginPath(); x.moveTo(L * .075, c - L * .016); x.quadraticCurveTo(L * .02, c - L * .006, 0, c); x.quadraticCurveTo(L * .02, c + L * .006, L * .075, c + L * .016); x.stroke();
      let q = x.createLinearGradient(0, c - L * .02, 0, c + L * .02); q.addColorStop(0, "#DDE0E3"); q.addColorStop(.5, "#8A8F95"); q.addColorStop(1, "#4A4E53"); x.fillStyle = q; x.fillRect(L * .07, c - L * .017, L * .15, L * .034);
      x.fillStyle = "#35383C"; x.beginPath(); x.roundRect(L * .215, c - L * .048, L * .03, L * .096, L * .01); x.fill();
      q = x.createLinearGradient(0, c - L * .045, 0, c + L * .045); q.addColorStop(0, "#E2C392"); q.addColorStop(.45, "#B58B57"); q.addColorStop(1, "#6A4A2A"); x.fillStyle = q; x.beginPath(); x.roundRect(L * .245, c - L * .043, L * .36, L * .086, L * .02); x.fill();
      const rr = rng(5); x.fillStyle = "rgba(92,60,30,.5)"; for (let k = 0; k < 46; k++) x.fillRect(L * (.25 + rr() * .35), c + (rr() - .5) * L * .074, 1.2, .8);
      q = x.createLinearGradient(0, c - L * .04, 0, c + L * .04); q.addColorStop(0, "#5C4236"); q.addColorStop(.4, "#34241C"); q.addColorStop(1, "#18110D"); x.fillStyle = q; x.beginPath(); x.moveTo(L * .6, c - L * .04); x.lineTo(L * .97, c - L * .03); x.quadraticCurveTo(L, c, L * .97, c + L * .03); x.lineTo(L * .6, c + L * .04); x.closePath(); x.fill(); });
    S.penSh = shadowOf(S.pen, 4, "rgba(0,0,0,.6)");
    S.moonGlow = K.glowSpr(64, [236, 222, 196], .5); S.tipGlow = K.glowSpr(48, [255, 132, 40], .8);
  }
  /** one segment (or dot) of a mark into x, in the picture's units */
  function ink(x, s, col, a) {
    const w = s.w * S.ws / S.R; x.globalAlpha = 1;
    if (s.dot) { x.fillStyle = rgba(col, a); x.beginPath(); x.arc(s.a[0], s.a[1], w * .62, 0, TAU); x.fill(); return; }
    x.strokeStyle = rgba(col, a); x.lineWidth = w; x.beginPath(); x.moveTo(s.a[0], s.a[1]); x.lineTo(s.b[0], s.b[1]); x.stroke();
  }
  /** heat running through the picture's lines between two radii (from the moon outward): the lines themselves red-hot,
   *  and the glow round them (only the glow, faint, for the embers' breathing at rest) */
  function heat(rIn, rOut, amp, lines = true) {
    if (amp <= .004 || rOut <= 0) return; const { cx, cy, R } = S, soft = .12, a = Math.max(0, rIn - soft), b = Math.max(a + .02, rOut), f = t => clamp((t - a) / (b - a));
    const mask = (c, src) => { const x = c.getContext("2d"), n = c.width, m = n / 2.1; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, n, n); x.drawImage(src, 0, 0);
      x.globalCompositeOperation = "destination-in"; const q = x.createRadialGradient(n / 2, n / 2, a * m, n / 2, n / 2, b * m);
      q.addColorStop(0, rIn <= 0 ? "#000" : "rgba(0,0,0,0)"); q.addColorStop(f(rIn), "#000"); q.addColorStop(Math.max(f(rIn), f(rOut - soft)), "#000"); q.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = q; x.fillRect(0, 0, n, n); x.globalCompositeOperation = "source-over"; return c; };
    const X = cx - 1.05 * R, Y = cy - 1.05 * R, D = 2.1 * R, all = rIn <= 0 && rOut >= 1.15; // all of it: nothing to mask
    g.save(); if (lines) { g.globalAlpha = clamp(amp); g.drawImage(all ? S.hotC : mask(S.tmp2, S.hotC), X, Y, D, D); }
    g.globalCompositeOperation = "lighter"; g.globalAlpha = clamp(amp * .8); g.drawImage(all ? S.glowC : mask(S.tmp, S.glowC), X, Y, D, D); g.restore();
  }
  function drawNight(T, I, A, F) {
    const { W, H } = S; g.clearRect(0, 0, W, H);
    glide(A);
    // the embers in the char, breathing; never behind the words, nor under the picture
    g.save(); g.globalCompositeOperation = "lighter";
    for (const e of S.embers || []) { const b = Math.pow(.5 + .5 * Math.sin(A * e.f + e.ph), 1.8); if (b < .03) continue; const sh = S.shade(e.x, e.y, 30), inM = Math.hypot(e.x - S.cx, e.y - S.cy) < S.R * 1.2 * S.vis; if (sh < .02 || inM) continue;
      const a = b * sh * e.k; g.globalAlpha = a * .45; g.drawImage(S.halo, e.x - 26, e.y - 26, 52, 52); g.globalAlpha = a; g.drawImage(e.spr, e.x - e.spr.w2 / 2, e.y - e.spr.h2 / 2, e.spr.w2, e.spr.h2); }
    g.restore();
    if (S.vis < .01) return;
    if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) buildNight();
    const { cx, cy, R } = S, on = I > .01, V = S.vis, ox = cx - 1.05 * R, oy = cy - 1.05 * R, D2 = 2.1 * R;
    S.penDir = (() => { const a = Math.atan2(S.away[1], S.away[0]) - .55; return [Math.cos(a), Math.sin(a)]; })();
    const pic = (c, a) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, ox, oy, D2, D2); g.globalAlpha = 1; };
    // the moon's light in the picture, and the picture breathing a little, as embers do
    g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .13 * V; g.drawImage(S.moonGlow, cx - .62 * R, cy - .62 * R, 1.24 * R, 1.24 * R); g.restore();
    const [c0, c1] = BN.crumble, [p0, p1, p2, p3] = BN.pen, burnt = p2 + BN.cool, cEnd = c1 - .35;
    const phase = !on || T < BN.heat[0] || T >= burnt ? 0 : T < c1 ? 1 : T < p0 ? 2 : 3;
    heat(0, 1.2, (.045 + .035 * Math.sin(A * .7)) * V * lerp(1, 1 - env(T, BN.heat[0] - .3, BN.heat[0], burnt - .2, burnt + 1.4, E.sine), I), false); // the picture breathing a little, as embers do
    if (phase === 0) pic(S.full, 1);
    else if (phase === 1) { // it glows red-hot once, from the moon outward, and crumbles to ash behind the glow
      const rc = lerp(-.05, 1.12, seg(T, c0, cEnd, lin)), rh = lerp(0, 1.35, seg(T, BN.heat[0], BN.heat[1], E.sine));
      pic(S.full, 1 - I);
      g.save(); g.beginPath(); g.rect(ox, oy, D2, D2); if (rc > 0) g.arc(cx, cy, rc * R, 0, TAU); g.clip("evenodd"); pic(S.full, I); g.restore();
      heat(rc, rh, I * V * .95 * (1 - seg(T, c1 - .5, c1, lin)));
    } else if (phase === 2) pic(S.full, 1 - I);
    // the ash, drifting up off the lines as the crumble passes them, and going
    if (on && T > c0 && T < cEnd + BN.drift) { g.save(); for (const p of ASHES) { const tr = lerp(c0, cEnd, clamp((p.d + .05) / 1.17)), a = (T - tr) / BN.drift; if (a < 0 || a >= 1) continue;
      const x = cx + (p.x + Math.sin(a * 5 + p.s * 9) * .03 * a + (p.s - .5) * .08 * a) * R, y = cy + (p.y - a * (.1 + .16 * p.s) - a * a * .12) * R, hot = a < .2;
      g.globalAlpha = I * V * Math.pow(1 - a, 1.3) * (hot ? 1 : .8); g.fillStyle = hot ? "#FFB257" : rgba(ASH); const s = (1.7 - a * .9) * S.ws; g.fillRect(x - s / 2, y - s / 2, s, s); } g.restore(); }
    if (phase === 3) { // the pen burns it in again: what has cooled is ash (kept on a canvas as it comes), what is new still glows
      pic(S.full, 1 - I);
      const cool = T - BN.cool; if (cool < S.coldT - 1e-6) { S.coldX.save(); S.coldX.setTransform(1, 0, 0, 1, 0, 0); S.coldX.clearRect(0, 0, S.cold.width, S.cold.height); S.coldX.restore(); S.ci = 0; }
      while (S.ci < SEGS.length && SEGS[S.ci].t1 <= cool) { const s = SEGS[S.ci++]; ink(S.coldX, s, ASH, s.al); } S.coldT = cool;
      pic(S.cold, I);
      // the hot part: segments by how long ago the tip passed, white to orange to red to ash
      g.save(); g.translate(cx, cy); g.scale(R, R); const u = S.ws / R;
      const hot = AGES.map(() => ({ l: [], d: [] })); let k2 = S.ci;
      for (; k2 < SEGS.length && SEGS[k2].t1 <= T; k2++) { const s = SEGS[k2], age = T - s.t1; let b = 0; while (b < AGES.length - 1 && age > AGES[b]) b++; (s.dot ? hot[b].d : hot[b].l).push(s); }
      const tp0 = tipAt(T); if (tp0 && tp0.down && k2 < SEGS.length && SEGS[k2].t0 < T && !SEGS[k2].dot) { const s = SEGS[k2]; hot[0].l.push({ a: s.a, b: [tp0.u, tp0.v], w: s.w }); }
      for (let pass = 0; pass < 2; pass++) { g.globalCompositeOperation = pass ? "source-over" : "lighter";
        hot.forEach((h, b) => { if (!h.l.length && !h.d.length) return; const col = b < HOT.length ? HOT[b] : mixc(ASH, [168, 72, 34], b === 5 ? .5 : .2), ga = GLOWA[b];
          if (!pass && ga < .05) return; g.strokeStyle = pass ? rgba(col, 1) : rgba([255, 128, 40], ga); g.fillStyle = g.strokeStyle; g.globalAlpha = I * V;
          g.lineWidth = (pass ? 1.6 : 5.5) * u; g.beginPath(); for (const s of h.l) { g.moveTo(s.a[0], s.a[1]); g.lineTo(s.b[0], s.b[1]); } g.stroke();
          g.beginPath(); for (const s of h.d) { g.moveTo(s.a[0] + (pass ? 1.1 : 3) * u, s.a[1]); g.arc(s.a[0], s.a[1], (pass ? 1.1 : 3) * u, 0, TAU); } g.fill(); }); }
      g.restore(); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      // a wisp of smoke off the tip: it leans back along the way the pen came, rising and spreading and thinning as it goes
      const tip = tipAt(T);
      if (tip) { const back = tipAt(T - .18) || tip, vx = tip.u - back.u, vy = tip.v - back.v, vl = Math.hypot(vx, vy) || 1, lean = Math.min(1, vl / .3), up = tip.down ? 1 : .4;
        g.save(); g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "rgb(214,204,194)"; const pts = [];
        for (let j = 0; j <= 24; j++) { const a = j / 24, u = tip.u - vx / vl * lean * .14 * a + (Math.sin(a * 6 - T * 3.1) * .045 + Math.sin(a * 2.3 + T * 1.2) * .03) * a, v = tip.v - a * .52 - vy / vl * lean * .06 * a; pts.push([cx + u * R, cy + v * R]); }
        for (let c = 0; c < 4; c++) { const a = (c + .5) / 4; g.globalAlpha = I * V * up * .3 * Math.pow(1 - a, 1.3) * Math.min(1, a * 5); g.lineWidth = (1.1 + a * 10) * S.ws; g.beginPath(); for (let j = c * 6; j <= c * 6 + 6; j++) j > c * 6 ? g.lineTo(pts[j][0], pts[j][1]) : g.moveTo(pts[j][0], pts[j][1]); g.stroke(); }
        g.restore(); }
      // the pen: its tip glowing and lighting the char round it, its cord trailing off the page
      if (tip) { const heatUp = seg(T, p0, p1, lin) * (1 - seg(T, p2, p3, lin) * .6), sx = cx + tip.u * R, sy = cy + tip.v * R, [dx, dy] = S.penDir, L = S.penL, lift = tip.z;
        g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = I * V * heatUp * (.3 + .2 * tip.down); const tg = .5 * R; g.drawImage(S.tipGlow, sx - tg, sy - tg, 2 * tg, 2 * tg); g.restore();
        const ex = sx + dx * L - lift * 4, ey = sy + dy * L - lift * 7, o = out(ex, ey, dx, dy) + 20;
        g.save(); g.globalAlpha = I * V; g.strokeStyle = "#0E0B0A"; g.lineWidth = 2.6; g.beginPath(); g.moveTo(ex, ey); g.bezierCurveTo(ex + dx * o * .35, ey + dy * o * .35 + 30, ex + dx * o * .7, ey + dy * o * .7 - 20, ex + dx * o, ey + dy * o); g.stroke(); g.restore();
        const ang = Math.atan2(dy, dx), b = 4;
        g.save(); g.globalAlpha = I * V * .7; g.translate(sx + 5 + lift * 10, sy + 8 + lift * 14); g.rotate(ang); g.drawImage(S.penSh, -2 * b, -S.pen.h2 / 2 - 2 * b, S.pen.w2 + 4 * b, S.pen.h2 + 4 * b); g.restore();
        g.save(); g.globalAlpha = I * V; g.translate(sx - lift * 4, sy - lift * 7); g.rotate(ang); g.drawImage(S.pen, 0, -S.pen.h2 / 2, S.pen.w2, S.pen.h2); g.restore();
        g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = I * V * heatUp; g.drawImage(S.halo, sx - lift * 4 - 7, sy - lift * 7 - 7, 14, 14); g.fillStyle = "#FFF4D6"; g.beginPath(); g.arc(sx - lift * 4, sy - lift * 7, 1.6, 0, TAU); g.fill(); g.restore(); }
    }
    // the finale: the picture flares from the moon outward, sparks go up off it, and a wisp of smoke rises off the moon
    if (F >= 0) {
      heat(lerp(-.35, 1.15, seg(F, .16, .78, E.sine)), lerp(.05, 1.35, seg(F, .03, .5, E.out)), env(F, .02, .12, .6, .9) * V * .95); // a pulse of heat out from the moon, the middle cooling first
      g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = "#FFB257";
      for (let i = 0; i < ASHES.length; i += 7) { const p = ASHES[i], t0 = .05 + p.d * .36 + p.s * .1, a = (F - t0) / .4; if (a < 0 || a >= 1) continue; const x = cx + (p.x + (p.s - .5) * .14 * a + Math.sin(a * 7 + p.s * 20) * .02) * R, y = cy + (p.y - a * (.28 + .32 * p.s)) * R, z = (2.8 - a * 1.8) * S.ws; g.globalAlpha = V * (1 - a) * (a < .1 ? a / .1 : 1); g.fillRect(x - z / 2, y - z / 2, z, z); } // sparks off the pulse's front
      g.globalCompositeOperation = "source-over"; const wa = env(F, .15, .4, .6, 1) * V; if (wa > .01) { g.lineCap = "round"; let pr2 = null; for (let j = 0; j <= 28; j++) { const f = j / 28, x = cx + (Math.sin(f * 5 + F * 4) * .08 * f + .02) * R, y = cy - (SUN + f * .9 * seg(F, .15, .7, E.out)) * R; if (pr2) { g.globalAlpha = wa * .3 * (1 - f); g.strokeStyle = "rgb(206,196,186)"; g.lineWidth = (1.5 + f * 9) * S.ws; g.beginPath(); g.moveTo(pr2[0], pr2[1]); g.lineTo(x, y); g.stroke(); } pr2 = [x, y]; } }
      g.restore();
    }
  }

  const S = {
    res: "dpr",
    wash: night ? 1 : 1.6, veil: night ? .6 : 1, // a light kit's small words have no room for the picture under them (scenes.js); a dark kit's do
    hug: night ? .72 : .8, hugFinale: true, list: night ? .4 : .3, // the lines and the finale's words sit on pads of the ground; the medallion keeps to the open page
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05;
      Object.assign(S, { W, H, pr, Rmin: pr ? 54 : 70, Rmax: pr ? 150 : 240 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .3, 118) : Math.min(W * .14, H * .27); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .77 : H * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: pr ? H * .77 : H * .5, tR: R0, away: pr ? [0, 1] : [1, 0] }); }
      S.RR = 0; S.landed = K.layer(); // the sprites are drawn again for this size, on the next frame
      if (night) plankNight(bg, W, H); else plankDay(bg, W, H);
      if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the medallion settles in the largest open space; embers keep off the lines */
    words(rects) { S.raw = rects; S.wr = rects.map(([x0, y0, x1, y1]) => [x0 - 10, y0 - 8, x1 + 10, y1 + 8]); if (S.W) place(rects); },
    /** 1 clear of the words, down to nothing behind them */
    shade(x, y, r) { let d = 1e9; for (const [x0, y0, x1, y1] of S.wr || []) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))); return clamp((d - r * .3) / (r + 6)); },
    /** where the medallion has settled, for the suite: its centre and size in CSS pixels, or null while there's no room */
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    curl, ink,
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) { if (night) drawNight(T, I, A, F); else drawDay(T, I, A, F); },
  };
  return S;
}
