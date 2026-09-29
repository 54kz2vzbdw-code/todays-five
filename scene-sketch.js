// scene-sketch.js — 1.12 b332: Sketch's scene (scenes.js loads it). A drawing that draws itself, in the largest open space
// on the page: a hot-air balloon in pencil and watercolour, in a round vignette of pale sky, with a couple of clouds and a
// few birds. While the list is in use it floats, its lines boiling a little, as a hand-drawn thing does. The loop, fifteen
// seconds: an eraser scrubs the whole drawing out, crumbs flying, a ghost of it left on the paper; a pencil draws it again
// — a light guide, the envelope in one confident line, its seams, the ropes and the basket's weave, the shading hatched
// down one side, the clouds, the birds; a brush floods the sky in, then each gore of the envelope, the wet paint darker
// until it dries, flicking drops off as it goes; and the burner roars, the balloon lifts, the birds wheel, and it settles.
// The finale: the brush throws a burst of colour round it, the flame roars and it rises, and the pencil sketches stars.
// It keeps to the empty part of the page (scenes.js, `words`), so the words need no pad and no wash under them.
//
// 1.12 b375: the forever cycle. The drawing carries: what a pass draws stays up through the quiet after it, and the next
// pass's eraser takes it off before the pencil starts again. The balloon is the signature, the first pass of every visit,
// drawn as it always was. After it each pass draws one subject from a pool of six, dealt so a run of six passes draws
// them all and never the same one twice running: the balloon again (in its own colours, a rainbow, or blue and gold); a
// lighthouse on its rock at sundown, whose lamp is lit as the first stars come out, its beam turning through the dusk
// while a wave rolls in and breaks on the rock in spray; a sailboat on the swell, which rides a swell rolling under it,
// bow up, then stern, throwing spray; a humpback at the surface, which blows, the spray billowing and raining down, then
// lifts its flukes and slaps the sea; a teapot on a gingham cloth, whose lid rattles as it puffs, and which then tips and
// pours the cup in front of it full; a hummingbird at a fuchsia, which darts in and drinks, the flower nodding and
// shedding pollen, and loops up and comes back. Each is drawn the balloon's way — a light guide, the confident line, the
// details, the hatching, the washes wet and then drying, the flicked drops — and each pass deals which way it faces, its
// colours, and which way the eraser scrubs. The rare one, about one pass in eight: a cat on its rug by a ball of yarn,
// whose eyes, once they're drawn, follow the pencil and then the brush round the page; then it watches the brush go,
// yawns, bats its yarn twice and gives a slow blink.
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

  /* ---------------- 1.12 b375: the forever cycle — the subjects after the balloon ---------------- */
  const { bag, deal } = K;
  /** the drawing's units from the 200-box the subjects are drawn in (the circle's centre at 100, 100, its radius 100) */
  const U = v => (v - 100) / 100;
  /** the points along a path written as SVG in the 200-box: M, L, C, Q and Z, absolute, a command repeating while numbers follow */
  const sv = (d, step = 3) => {
    const tk = d.match(/[MLCQZ]|-?(?:\d+\.?\d*|\.\d+)/gi), out = [], put = p => out.push([U(p[0]), U(p[1])]);
    let i = 0, cmd = "", cur = [100, 100], st = cur;
    const P2 = () => [+tk[i++], +tk[i++]], to = (f, k) => { for (let j = 1; j <= k; j++) put(f(j / k)); };
    const ln = (a, p) => to(t => [lerp(a[0], p[0], t), lerp(a[1], p[1], t)], Math.max(1, Math.ceil(Math.hypot(p[0] - a[0], p[1] - a[1]) / step)));
    while (i < tk.length) {
      if (/^[MLCQZ]$/i.test(tk[i])) cmd = tk[i++].toUpperCase(); else if (!cmd || cmd === "Z") { i++; continue; }
      if (cmd === "M") { cur = st = P2(); put(cur); cmd = "L"; }
      else if (cmd === "L") { const p = P2(); ln(cur, p); cur = p; }
      else if (cmd === "C" || cmd === "Q") { const a = cur, q = P2(), r2 = cmd === "C" ? P2() : null, p = P2(), c1 = r2 ? q : [a[0] + (q[0] - a[0]) * 2 / 3, a[1] + (q[1] - a[1]) * 2 / 3], c2 = r2 || [p[0] + (q[0] - p[0]) * 2 / 3, p[1] + (q[1] - p[1]) * 2 / 3];
        to(t => bez(a, c1, c2, p, t), Math.max(2, Math.ceil((Math.hypot(c1[0] - a[0], c1[1] - a[1]) + Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) + Math.hypot(p[0] - c2[0], p[1] - c2[1])) / step))); cur = p; }
      else if (cmd === "Z") { if (cur[0] !== st[0] || cur[1] !== st[1]) ln(cur, st); cur = st; }
    }
    return out;
  };
  /** an ellipse (or an arc of one) in the 200-box */
  const ring = (cx, cy, rx, ry = rx, a0 = 0, a1 = TAU, n = 36) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [U(cx + Math.cos(a) * rx), U(cy + Math.sin(a) * ry)]; });
  const plen = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  /** hatching: parallel strokes at angle `ang`, `gap` apart, inside `poly` wherever `mask` allows */
  const hatchIn = (poly, ang, gap, mask = () => true) => {
    const dx = Math.cos(ang), dy = Math.sin(ang), out = []; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [u, v] of poly) { x0 = Math.min(x0, u); y0 = Math.min(y0, v); x1 = Math.max(x1, u); y1 = Math.max(y1, v); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rad = Math.hypot(x1 - x0, y1 - y0) / 2 + .01, end = run => { if (run && plen(run) > .02) out.push(run); };
    for (let c = -rad + gap / 2; c <= rad; c += gap) { let run = null; for (let s = -rad; s <= rad; s += .005) { const x = cx - dy * c + dx * s, y = cy + dx * c + dy * s; if (inPoly(poly, x, y) && mask(x, y)) { if (!run) run = [[x, y], [x, y]]; else run[1] = [x, y]; } else { end(run); run = null; } } end(run); }
    return out;
  };
  /** lines laid out in time, one after another at a pencil's steady pace between t0 and t1, lifting a moment between */
  const pace = (list, t0, t1, gap = .025) => { const L = list.map(s => Math.max(.03, plen(s[0]))), tot = L.reduce((a, b) => a + b, 0), span = t1 - t0 - gap * (list.length - 1); let t = t0; list.forEach((s, i) => { const d = span * L[i] / tot; s[1] = t; s[2] = t + d; t += d + gap; }); };
  /** a subject being put together: its parts (each its lines, its washes, the point it turns about), its lines gathered by
   *  phase to be timed at a pencil's pace */
  const kit = () => { const parts = [], ph = {}; return {
    parts,
    part(pivot = [0, 0]) { parts.push({ strokes: [], washes: [], pivot }); return parts.length - 1; },
    ink(k, phase, pts, w = 1, a = .85) { const s = [pts, 0, 0, w, a]; parts[k].strokes.push(s); (ph[phase] = ph[phase] || []).push(s); },
    wash(k, poly, col, a, t0, t1, at, opt) { parts[k].washes.push([poly, col, a, t0, t1, at, opt]); },
    time(phase, t0, t1, gap) { if (ph[phase]) pace(ph[phase], t0, t1, gap); },
  }; };
  /** the sky's disc cut off at a horizon `y` (units): the sea below it */
  const below = (y, r = .95, n = 40) => { const a0 = Math.asin(clamp(y / r, -1, 1)), top = sv(`M ${100 - Math.cos(a0) * r * 100} ${100 + y * 100} L ${100 + Math.cos(a0) * r * 100} ${100 + y * 100}`, 6), nz = K.noise1(17, 16);
    return [...top, ...Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, Math.PI - a0, i / n), rr = r * (1 + .03 * (nz(i / 3) - .5)); return [Math.cos(a) * rr, Math.sin(a) * rr]; })]; };
  const wave = (x, y, w = 6, h = 3.2) => sv(`M ${x - w} ${y} C ${x - w * .5} ${y - h}, ${x + w * .5} ${y - h}, ${x + w} ${y}`, 2);

  /** The lighthouse on its rock at sundown: the tower in its bands, the gallery and its rail, the lantern, the dome; the
   *  sun going down into the sea and its glitter on the water, the waves, the gulls. Its moment: the lamp is lit, the
   *  first stars come out, the beam turns and sweeps the dusk, and a wave breaks on the rock in spray. */
  const lighthouse = pal => {
    const b = kit(), bg = b.part(), sea = b.part(), tw = b.part([0, U(134)]);
    const BAND = [[222, 70, 52], [48, 92, 170], [30, 122, 108]][pal], DUSK = { grad: [[0, [74, 84, 178]], [.5, [186, 124, 186]], [.9, [252, 166, 108]], [1, [252, 178, 118]]] };
    const xl = y => lerp(79, 86.5, (134 - y) / 80), xr = y => 200 - xl(y);
    const TOWER = sv("M 79 134 C 81.5 108, 84.5 80, 86.5 54 L 113.5 54 C 115.5 80, 118.5 108, 121 134 Z");
    const edge = y => `${xl(y)} ${y} Q 100 ${y + 5.5}, ${xr(y)} ${y}`, bandPoly = (ya, yb) => sv(`M ${edge(ya)} L ${xr(yb)} ${yb} Q 100 ${yb + 5.5}, ${xl(yb)} ${yb} Z`, 2);
    const BANDS = [[54, 67], [80, 93], [106, 119]];
    const ROCK = sv("M 30 160 C 32 148, 42 141, 54 140 C 58 132, 70 127, 80 128 L 120 128 C 132 126, 142 132, 146 138 C 158 139, 166 148, 170 160 C 140 166.5, 60 166.5, 30 160 Z");
    const DOME = sv("M 86 28 C 86 19.5, 92.5 14, 100 14 C 107.5 14, 114 19.5, 114 28 Z", 2), GAL = sv("M 75 54 L 125 54 L 125 49 L 75 49 Z", 2), GLASS = sv("M 89 49 L 89 28 L 111 28 L 111 49 Z", 2);
    const DOOR = sv("M 94 134 L 94 125 C 94 119.5, 106 119.5, 106 125 L 106 134", 2), SUN = sv("M 137 138 C 137 126, 146 118, 156 118 C 166 118, 175 126, 175 138 Z", 2);
    const MOSS = sv("M 46 146 C 50 141, 56 138, 60 136 C 66 130, 74 127.5, 80 128 L 120 128 C 130 126.5, 140 131, 146 137 C 154 138, 160 142, 163 147 C 156 143.5, 148 142.5, 142 142.5 C 136 137, 128 133.5, 118 134 L 82 134 C 74 133.5, 66 137.5, 62 141.5 C 56 142.5, 50 144, 46 146 Z", 2);
    const GLIT = [[156, 143.5, 15], [155, 148.5, 12], [157, 154, 9], [155, 160, 6], [156, 166, 3.5]];
    const CL = [cloud(U(40), U(112), .4, [[-.12, .04], [-.03, .065], [.07, .05], [.15, .03]]), cloud(U(146), U(92), .3, [[-.09, .035], [.01, .055], [.09, .035]])];
    // the pencil: a guide, the tower and its rock in confident lines, the bands, the gallery, the lantern and the dome,
    // the door and the windows, the shading, then the sea, the sun and the clouds
    b.ink(tw, "guide", sv("M 100 3 L 100 150", 5), .7, .2); b.ink(tw, "guide", ring(100, 147, 72, 18), .7, .18); b.ink(bg, "guide", sv("M 4 138 L 196 138", 8), .6, .14);
    b.ink(tw, "line", TOWER.slice(0, -Math.ceil(42 / 3)), 1.45, .92); b.ink(tw, "line", ROCK, 1.35, .9);
    for (const [ya, yb] of BANDS) { b.ink(tw, "band", sv("M " + edge(ya), 2), .95, .72); b.ink(tw, "band", sv("M " + edge(yb), 2), .95, .72); }
    b.ink(tw, "top", GAL, 1.15, .9); b.ink(tw, "top", GLASS, 1.05, .9); b.ink(tw, "top", sv("M 96.3 28 L 96.3 49", 2), .75, .7); b.ink(tw, "top", sv("M 103.7 28 L 103.7 49", 2), .75, .7);
    b.ink(tw, "top", sv("M 76 40 L 124 40", 2), .95, .85); [76, 84, 92, 100, 108, 116, 124].forEach(x => b.ink(tw, "top", sv(`M ${x} 40 L ${x} 49`, 2), .75, .78));
    b.ink(tw, "top", sv("M 80 54 L 86.5 60", 2), .85, .75); b.ink(tw, "top", sv("M 120 54 L 113.5 60", 2), .85, .75);
    b.ink(tw, "top", DOME, 1.15, .9); b.ink(tw, "top", ring(100, 10.5, 3.3, 3.3, 0, TAU, 14), .95, .85); b.ink(tw, "top", sv("M 100 7.2 L 100 2.5", 2), .85, .8);
    b.ink(tw, "top", DOOR, 1.05, .88); for (const y of [74, 100]) b.ink(tw, "top", sv(`M 97.4 ${y + 3.6} L 97.4 ${y - 1} C 97.4 ${y - 4}, 102.6 ${y - 4}, 102.6 ${y - 1} L 102.6 ${y + 3.6} Z`, 1.5), .85, .82);
    for (const d of ["M 54 140 C 60 144, 64 152, 64 161", "M 146 138 C 140 143, 138 152, 140 162", "M 96 140 C 102 146, 105 152, 113 156", "M 70 131 L 79 136", "M 130 131 L 122 137", "M 42 150 L 50 153"]) b.ink(tw, "top", sv(d, 2.5), .85, .62);
    for (const h of hatchIn(TOWER, 1.1, .032, (x, y) => x > U(100 + (xr(y * 100 + 100) - 100) * .3) && y > U(55))) b.ink(tw, "hatch", h, .6, .34);
    for (const h of hatchIn(ROCK, 1.1, .028, (x, y) => x > U(122) || (x < U(64) && y > U(147)) || (y > U(156) && x > U(80)))) b.ink(tw, "hatch", h, .6, .3);
    for (const h of hatchIn(DOME, 1.1, .028, x => x > U(103))) b.ink(tw, "hatch", h, .55, .32);
    b.ink(sea, "sea", sv("M 6 138 L 43 138", 4), 1.05, .82); b.ink(sea, "sea", sv("M 158 138 L 194 138", 4), 1.05, .82); b.ink(sea, "sea", SUN.slice(0, -Math.ceil(38 / 2)), 1, .8);
    for (const [x, y, w] of GLIT) b.ink(sea, "sea", sv(`M ${x - w} ${y} L ${x + w} ${y}`, 2), .8, .55);
    for (const [x, y, w] of [[22, 150, 6], [44, 172, 7], [82, 180, 6], [118, 178, 7], [186, 152, 5], [104, 191, 5], [62, 188, 5], [136, 186, 5]]) b.ink(sea, "sea", wave(x, y, w), .85, .62);
    for (const d of ["M 22 163 C 25 159, 29 159, 32 163 C 35 159, 39 159, 42 163", "M 160 163 C 163 159, 167 159, 170 163 C 173 159, 177 159, 180 163"]) b.ink(sea, "sea", sv(d, 2), .85, .7);
    CL.forEach(c => b.ink(bg, "sky", c, 1.05, .78));
    b.time("guide", 2.0, 2.3); b.time("line", 2.35, 3.35, .06); b.time("band", 3.4, 3.8, .03); b.time("top", 3.85, 5.3, .02); b.time("hatch", 5.32, 5.8, .004); b.time("sea", 5.82, 6.14, .012); b.time("sky", 5.95, 6.14, .03);
    // the brush: the dusk, the sun, the sea and the sun's glitter on it, the rock, the bands, the dome, the gallery, the
    // lantern's glass, the door, the clouds lit from below
    b.wash(bg, SKYPOLY, [196, 128, 170], .44, 6.5, 7.05, [-.5, -.55], { ...DUSK, cut: [TOWER, GAL, GLASS, DOME, ROCK, SUN] });
    b.wash(sea, SUN, [252, 138, 52], .78, 6.98, 7.12, [U(156), U(130)]);
    b.wash(sea, below(U(138)), [30, 108, 158], .56, 7.08, 7.42, [-.35, .6], { cut: [ROCK] });
    GLIT.forEach(([x, y, w], k) => b.wash(sea, ring(x, y + .5, w, 1.6, 0, TAU, 16), [252, 150, 70], .7, 7.42 + k * .03, 7.5 + k * .03, [U(x), U(y)]));
    b.wash(tw, ROCK, [140, 112, 94], .62, 7.5, 7.72, [U(120), U(146)]); b.wash(tw, MOSS, [104, 140, 70], .56, 7.7, 7.8, [U(100), U(131)]);
    BANDS.forEach(([ya, yb], k) => b.wash(tw, bandPoly(ya, yb), BAND, .74, 7.8 + k * .12, 7.95 + k * .12, [U(100), U((ya + yb) / 2)]));
    b.wash(tw, DOME, BAND, .78, 8.14, 8.26, [U(100), U(21)]); b.wash(tw, GAL, [70, 74, 90], .56, 8.26, 8.36, [U(100), U(51)]);
    b.wash(tw, GLASS, PIG.sun, .6, 8.36, 8.48, [U(100), U(38)]); b.wash(tw, DOOR.concat([[U(94), U(134)]]), PIG.wood, .62, 8.48, 8.56, [U(100), U(128)]);
    CL.forEach((c, k) => b.wash(bg, c, [236, 146, 150], .5, 8.58 + k * .12, 8.78 + k * .12, [c[20][0], c[20][1] + .03]));
    const plume = Array.from({ length: 9 }, (_, i) => { const r = rng(900 + i); return { x: U(33 + i * 1.6), vx: (r() - .6) * .16, vy: -(.42 + r() * .5), s: .016 + r() * .016, g: .026 + r() * .02, t: 10.42 + r() * .12 }; });
    const drops = Array.from({ length: 24 }, (_, i) => { const r = rng(950 + i), a = -Math.PI / 2 + (r() - .62) * 2.2; return { x: U(36) + (r() - .5) * .06, vx: Math.cos(a) * (.2 + r() * .4), vy: Math.sin(a) * (.6 + r() * .55), s: .005 + r() * .008, t: 10.45 + r() * .2 }; });
    const stars = [[-.56, -.6, 0], [-.3, -.8, .8], [.26, -.78, .3], [.54, -.58, 1.3], [.74, -.3, .6], [-.74, -.26, 1.9], [.02, -.9, 1.1]];
    const beamAt = st => st.live ? 1.2 + (st.T - 9.25) * 2 : st.A * 2;
    return {
      parts: b.parts, birds: [[.5, -.62, .045, 0], [.64, -.52, .036, 1.7], [-.54, -.42, .04, 3.1]], flicks: [7.3, 7.9, 8.46], pal: [BAND, [34, 104, 150], [252, 138, 52]],
      live(x, st, k, after, ins) {
        if (k !== tw || !after) return;
        const ga = x.globalAlpha, lit = clamp(st.alive + st.fin), lamp = U(37), th = beamAt(st);
        if (lit > .01) { // the first stars; the beam turning: long when it points across, short when it points at us or away
          for (const [u, v, ph] of stars) { const tw2 = lit * (.6 + .4 * Math.sin(st.A * 2.2 + ph * 3)), s = .016 * tw2; if (s < .002) continue; x.strokeStyle = rgba([255, 240, 200], .9 * tw2); x.lineWidth = 1.1 / S.RR; x.beginPath(); x.moveTo(u - s, v); x.lineTo(u + s, v); x.moveTo(u, v - s); x.lineTo(u, v + s); x.stroke(); }
          x.save(); x.beginPath(); x.arc(0, 0, .965, 0, TAU); x.clip();
          for (const b2 of [th, th + Math.PI]) { const c = Math.cos(b2), s = Math.sin(b2), len = .1 + Math.abs(c) * 1.05, wd = .3 * (.55 + .45 * Math.abs(c)); x.save(); x.translate(0, lamp); x.scale(c < 0 ? -1 : 1, 1); x.globalAlpha = ga * lit * (.7 + .3 * Math.max(0, s)); x.drawImage(ins.spr.beam, 0, -wd / 2, len, wd); x.restore(); }
          x.restore(); }
        const fl = .3 + lit * (.55 + .45 * Math.pow(Math.max(0, Math.sin(th)), 5)), gs = .08 + fl * .16;
        x.globalAlpha = ga * clamp(fl); x.drawImage(ins.spr.glow, -gs, lamp - gs, gs * 2, gs * 2); x.globalAlpha = ga;
        if (st.live && st.T > 9.6 && st.T < 12.2) { // a wave rolls in, curls and breaks on the rock: foam thrown up its face, spray flung off
          const a0 = st.I * env(st.T, 9.6, 9.8, 10.35, 10.5), wx = lerp(-.99, U(30), seg(st.T, 9.6, 10.45, E.in)); if (a0 > .01) { x.strokeStyle = rgba(INK, .8 * a0); x.lineWidth = 1.1 / S.RR; const c = [[wx - .1, .6], [wx - .06, .575], [wx - .02, .552], [wx + .02, .555], [wx + .045, .572], [wx + .04, .59], [wx + .02, .592]]; x.beginPath(); c.forEach(([u, v], i) => { const [p, q] = st.jit(u, v); i ? x.lineTo(p, q) : x.moveTo(p, q); }); x.stroke(); }
          for (const pass of [0, 1]) for (const d of plume) { const t = st.T - d.t; if (t <= 0 || t > 1.3) continue; const a = st.I * (1 - seg(t, 1, 1.3)), y = U(160) + d.vy * t + .8 * t * t, r2 = (d.s + d.g * seg(t, 0, .6, E.out)) * (1 - seg(t, .55, 1.3, E.in)); x.beginPath(); x.arc(d.x + d.vx * t, y, r2, 0, TAU); // the foam as one body: every blob's outline first, then every fill over them, so only its outer edge keeps a line
            if (pass) { x.fillStyle = rgba([248, 251, 253], a); x.fill(); } else { x.strokeStyle = rgba([30, 108, 158], .6 * a); x.lineWidth = 2.2 / S.RR; x.stroke(); } }
          for (const d of drops) { const t = st.T - d.t; if (t <= 0 || t > 1.2) continue; const a = st.I * (1 - seg(t, .7, 1.2)); x.fillStyle = rgba([240, 248, 252], .95 * a); x.beginPath(); x.arc(d.x + d.vx * t, U(158) + d.vy * t + .95 * t * t, d.s, 0, TAU); x.fill(); x.strokeStyle = rgba([30, 108, 158], .7 * a); x.lineWidth = .8 / S.RR; x.stroke(); } }
      },
      sprites(mk) { return { beam: mk(240, 60, x => { for (let q = 0; q < 9; q++) { const gr = x.createLinearGradient(0, 0, 240, 0); gr.addColorStop(0, "rgba(255,248,206,.34)"); gr.addColorStop(.45, "rgba(255,236,168,.2)"); gr.addColorStop(1, "rgba(255,226,150,0)"); x.fillStyle = gr; const w = 2.5 + q * 3.2; x.beginPath(); x.moveTo(0, 30 - 2); x.lineTo(240, 30 - w); x.lineTo(240, 30 + w); x.lineTo(0, 30 + 2); x.closePath(); x.fill(); } }),
        glow: mk(64, 64, x => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,252,226,1)"); gr.addColorStop(.22, "rgba(255,232,150,.8)"); gr.addColorStop(.6, "rgba(255,200,110,.25)"); gr.addColorStop(1, "rgba(255,190,100,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }) }; },
    };
  };
  /** a sea under a swell line written in the 200-box: the line, then round the bottom of the circle back to its start */
  const seaUnder = (d, r = .955) => { const top = sv(d, 4), a1 = Math.atan2(top[top.length - 1][1], top[top.length - 1][0]), a0 = Math.atan2(top[0][1], top[0][0]), nz = K.noise1(19, 16), n = 36, span = ((a0 - a1) % TAU + TAU) % TAU;
    return [...top, ...Array.from({ length: n + 1 }, (_, i) => { const a = a1 + span * i / n, rr = r * (1 + .03 * (nz(i / 3) - .5)); return [Math.cos(a) * rr, Math.sin(a) * rr]; })]; };
  /** The sailboat on the swell: its hull and cabin, the mast, the mainsail with its battens and seams and the jib filled
   *  with wind, a pennant at the masthead; the sun, a cloud, the gulls, the waves and the wake. Its moment: a swell rolls
   *  under it and it rides it, pitching over the crest, the bow throwing spray, the pennant streaming. */
  const sailboat = pal => {
    const b = kit(), bg = b.part(), sea = b.part(), bt = b.part([0, U(128)]), fr = b.part();
    const HULL = [[34, 58, 120], [214, 68, 54], [26, 116, 108]][pal], JIB = [[236, 90, 62], [244, 176, 24], [240, 150, 40]][pal];
    const SWELL = "M 3 131 C 20 127, 34 127, 50 130 C 66 133, 80 133, 96 130 C 112 127, 128 127, 144 130 C 160 133, 176 133, 197 130";
    const HULLP = sv("M 42 116 C 70 121.5, 120 121.5, 158 113 L 151 124 C 132 135, 92 137, 70 133 C 57 129, 48 123, 42 116 Z", 2.5);
    const BOTTOM = sv("M 56 127 C 88 131.5, 122 130.5, 151 123.5 L 151 124 C 132 135, 92 137, 70 133 C 64 131, 60 129.5, 56 127 Z", 2.5);
    const CABIN = sv("M 85 118.6 L 89 110 L 119 110 L 123 118.6 Z", 2), MAIN = sv("M 106 23 C 121 45, 141 76, 150 103 L 106 102 Z", 2.5), JIBP = sv("M 104 31 L 49 112 L 97 106 C 100 82, 102 58, 104 31 Z", 2.5);
    const MSHADE = sv("M 118 42 C 130 60, 143 82, 150 103 L 128 102.5 C 126 82, 123 62, 118 42 Z", 2), SUNP = ring(40, 56, 15, 15, 0, TAU, 40);
    const CL = cloud(U(158), U(66), .34, [[-.1, .045], [-.01, .07], [.09, .05]]);
    // the pencil: a guide, the hull and the sails in confident lines, the rigging and the details, the shading, the sea
    b.ink(bt, "guide", sv("M 106 20 L 44 114 L 156 114 Z", 6), .7, .18); b.ink(bg, "guide", sv("M 6 130 L 194 130", 8), .6, .14);
    b.ink(bt, "line", HULLP, 1.45, .92); b.ink(bt, "line", sv("M 105.5 118 L 105.5 20", 3), 1.3, .9); b.ink(bt, "line", MAIN, 1.35, .9); b.ink(bt, "line", JIBP, 1.35, .9);
    b.ink(bt, "rig", sv("M 105.5 104 L 153 106", 2), 1.1, .88); b.ink(bt, "rig", sv("M 105.5 20 L 156 114.5", 3), .6, .45); b.ink(bt, "rig", sv("M 56 127 C 88 131.5, 122 130.5, 151 123.5", 2.5), .9, .75);
    b.ink(bt, "rig", CABIN, 1, .85); for (const x of [95, 104, 113]) b.ink(bt, "rig", ring(x, 114.3, 2, 2, 0, TAU, 12), .8, .8);
    for (const [y, x2] of [[46, 124], [66, 137], [86, 146]]) b.ink(bt, "rig", sv(`M 106.5 ${y + 1} Q ${(106 + x2) / 2} ${y - 1.5}, ${x2} ${y}`, 2), .7, .55);
    for (const [x, y] of [[125.5, 50], [137.5, 70], [145.5, 90]]) b.ink(bt, "rig", sv(`M ${x} ${y} L ${x - 10} ${y + 1}`, 2), .85, .75);
    for (const f of [.4, .7]) b.ink(bt, "rig", sv(`M ${lerp(104, 49, f)} ${lerp(31, 112, f)} L ${lerp(104, 97, f) - .5} ${lerp(31, 106, f)}`, 2), .7, .5);
    for (const h of hatchIn(MSHADE, 1.2, .03)) b.ink(bt, "hatch", h, .55, .3);
    for (const h of hatchIn(BOTTOM, -.5, .028)) b.ink(bt, "hatch", h, .55, .3);
    const sw = sv(SWELL, 3); b.ink(sea, "sea", sw.filter(([u]) => u < U(38)), 1.05, .8); b.ink(sea, "sea", sw.filter(([u]) => u > U(158)), 1.05, .8);
    for (const [x, y, w] of [[20, 146, 6], [44, 168, 7], [86, 176, 6], [126, 170, 7], [166, 154, 6], [180, 140, 5], [104, 190, 5], [60, 184, 5], [150, 184, 5]]) b.ink(sea, "sea", wave(x, y, w), .85, .62);
    b.ink(sea, "sea", sv("M 34 126 C 38 121, 43 121, 46 124", 2), .85, .75); b.ink(sea, "sea", sv("M 152 128 C 164 130, 176 129, 190 127", 2), .8, .55); b.ink(sea, "sea", sv("M 150 132 C 162 135, 172 135, 184 134", 2), .75, .45);
    b.ink(bg, "sky", SUNP, 1, .8); b.ink(bg, "sky", CL, 1.05, .78);
    b.time("guide", 2.0, 2.3); b.time("line", 2.35, 3.45, .06); b.time("rig", 3.5, 5.28, .02); b.time("hatch", 5.3, 5.8, .004); b.time("sea", 5.82, 6.14, .012); b.time("sky", 5.95, 6.14, .03);
    // the brush: the sky (round the sails, left white), the sun, the sea, the hull, its bottom, the cabin, the sail's shade, the jib, the cloud
    b.wash(bg, SKYPOLY, PIG.sky, .3, 6.5, 7.02, [-.55, -.5], { grad: [[0, [96, 150, 222]], [.7, [150, 196, 232]], [1, [196, 222, 236]]], cut: [MAIN, JIBP] });
    b.wash(bg, SUNP, PIG.sun, .66, 6.98, 7.1, [U(40), U(56)]);
    b.wash(sea, seaUnder(SWELL), [26, 118, 170], .54, 7.08, 7.42, [.3, .6], { cut: [HULLP], grad: [[0, [96, 176, 214]], [.45, [44, 136, 190]], [1, [22, 92, 158]]] });
    b.wash(bt, HULLP, HULL, .72, 7.42, 7.64, [U(80), U(120)]); b.wash(bt, BOTTOM, [196, 60, 50], .7, 7.64, 7.76, [U(100), U(131)]);
    b.wash(bt, CABIN, PIG.wood, .6, 7.76, 7.86, [U(104), U(114)]); b.wash(bt, MSHADE, [140, 170, 205], .32, 7.88, 8.02, [U(136), U(80)]);
    b.wash(bt, JIBP, JIB, .66, 8.04, 8.3, [U(90), U(80)]); b.wash(bg, CL, [196, 210, 232], .5, 8.34, 8.56, [CL[20][0], CL[20][1] + .03]);
    const spray = Array.from({ length: 26 }, (_, i) => { const r = rng(700 + i), a = -Math.PI / 2 - .55 + (r() - .5) * 1.7; return { vx: Math.cos(a) * (.16 + r() * .32), vy: Math.sin(a) * (.4 + r() * .45), s: .005 + r() * .01, t: 10.72 + r() * .16 }; });
    const SWP = sv(SWELL, 2), swy = u => { for (let i = 1; i < SWP.length; i++) if (SWP[i][0] >= u) { const [x0, y0] = SWP[i - 1], [x1, y1] = SWP[i]; return lerp(y0, y1, (u - x0) / ((x1 - x0) || 1)); } return SWP[SWP.length - 1][1]; };
    const crest = st => lerp(-1.25, 1.25, seg(st.T, 9.2, 12.8, x => x)); // a swell's crest, rolling in from ahead and on under the boat
    const pitch = st => { const k = st.live ? st.I * env(st.T, 9.2, 9.6, 12.4, 12.8, E.sine) : 0, d = (crest(st) + .05) / .42, bump = Math.exp(-d * d); return [-.17 * d * bump * k + Math.sin(st.A * 1.1) * .01, -.06 * bump * k + Math.sin(st.A * 1.3) * .006 - st.fin * .04]; }; // lifted as it passes: the bow first, then the stern
    return {
      parts: b.parts, birds: [[-.46, -.66, .045, .4], [-.3, -.72, .035, 2.2], [.52, -.24, .04, 1.2]], flicks: [7.3, 7.7, 8.2], pal: [HULL, JIB, [26, 118, 170]],
      pose(st, k) { if (k !== bt) return null; const [r2, dy] = pitch(st); return [0, dy, r2]; },
      live(x, st, k, after, ins) {
        if (k === fr && !after && st.live && st.T > 9.2 && st.T < 12.8) { // the crest: the sea rising in a swell that rolls on under the boat, its hull sitting down in it
          const c = crest(st), a = st.I * env(st.T, 9.2, 9.5, 12.5, 12.8), top = [], n = 28; for (let i = 0; i <= n; i++) { const u = c - .42 + i * .84 / n, e = Math.exp(-Math.pow((u - c) / .19, 2)); top.push([u, swy(u) - .058 * e + .002]); }
          x.save(); x.beginPath(); x.arc(0, 0, .95, 0, TAU); x.clip();
          x.fillStyle = rgba([84, 166, 208], .62 * a); x.beginPath(); top.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); for (let i = n; i >= 0; i--) x.lineTo(top[i][0], swy(top[i][0]) + .03); x.closePath(); x.fill();
          x.strokeStyle = rgba(INK, .8 * a); x.lineWidth = 1.15 / S.RR; x.beginPath(); top.forEach(([u, v], i) => { const [p, q] = st.jit(u, v); i ? x.lineTo(p, q) : x.moveTo(p, q); }); x.stroke();
          x.strokeStyle = rgba([252, 253, 254], .95 * a); x.lineWidth = 3 / S.RR; x.beginPath(); for (let i = 9; i <= 19; i++) i === 9 ? x.moveTo(top[i][0], top[i][1] + .006) : x.lineTo(top[i][0], top[i][1] + .006); x.stroke();
          x.strokeStyle = rgba(INK, .65 * a); x.lineWidth = .95 / S.RR; for (const o of [-.1, -.02, .07]) { const u = c + o, v = swy(u) - .058 * Math.exp(-Math.pow(o / .19, 2)); x.beginPath(); x.moveTo(u - .014, v + .008); x.quadraticCurveTo(u, v - .016, u + .016, v - .001); x.stroke(); }
          x.restore(); }
        if (k !== bt || !after) return;
        const blow = .3 + st.alive * .7 + st.fin, fl = Math.sin(st.A * (4 + blow * 6)), fl2 = Math.sin(st.A * (4 + blow * 6) + 1.7), pts = [[U(105.5), U(21)], [U(113), U(22.5 + fl * 1.2)], [U(120 + blow * 3), U(24 + fl2 * 1.8)], [U(113), U(26.5 + fl * 1.2)], [U(105.5), U(28)]]; // the pennant, streaming harder in the moment
        x.fillStyle = rgba(JIB, .75 * st.prog(8.26, 8.34)); x.beginPath(); pts.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); x.fill(); x.strokeStyle = rgba(INK, .85 * clamp(st.prog(5.2, 5.3))); x.lineWidth = 1 / S.RR; x.beginPath(); pts.forEach(([u, v], i) => { const [p, q] = st.jit(u, v); i ? x.lineTo(p, q) : x.moveTo(p, q); }); x.stroke();
        if (st.live && st.T > 10.7 && st.T < 12) for (const d of spray) { const t = st.T - d.t; if (t <= 0 || t > 1) continue; const a = st.I * (1 - seg(t, .6, 1)); x.fillStyle = rgba([240, 248, 252], .95 * a); x.beginPath(); x.arc(U(44) + d.vx * t, U(119) + d.vy * t + .9 * t * t, d.s, 0, TAU); x.fill(); x.strokeStyle = rgba([26, 118, 170], .7 * a); x.lineWidth = .8 / S.RR; x.stroke(); }
      },
    };
  };
  /** The whale: a humpback at the surface, its head and back out of the water, its belly and its pleats and its long
   *  flipper seen down through the sea, its flukes raised behind; clouds, gulls, the waves. Its moment: it blows — a
   *  plume of spray thrown up from its blowhole, billowing and raining down — then lifts its flukes and slaps the sea. */
  const whale = pal => {
    const b = kit(), bg = b.part(), sea = b.part(), bd = b.part([0, U(124)]), tl = b.part([U(164), U(124)]), fr = b.part([0, U(124)]);
    const SKIN = [[38, 78, 142], [50, 66, 116], [28, 98, 132]][pal];
    const BACK = sv("M 21 124 C 23 116, 39 106, 59 101 C 77 96, 94 92, 110 92 C 126 92, 140 100, 147 110 C 150 115, 151 120, 152 124 Z", 2.5), THROAT = sv("M 22 121.6 C 33 119.2, 46 118.4, 60 120.6 C 62 122, 63 123, 64 124 L 21.5 124 Z", 2);
    const BELLY = sv("M 21 124 C 25 133, 41 141, 65 144 C 93 147, 124 141, 152 124 Z", 2.5), FIN = sv("M 66 130 C 70 137, 76 142, 80 145 C 84 148, 88 150, 92 153 C 96 156, 100 158, 104 160 C 109 162.5, 114.5 162.5, 113 158.5 C 109.5 153.5, 99 146, 89 139 C 83 135, 79 131, 76.5 127.5 Z", 1.8);
    const DORSAL = sv("M 115.5 92.4 C 118.5 88, 122.5 86, 127.5 86 C 125.5 89, 126 92.5, 129.5 95.4", 2);
    const TAIL = sv("M 158 124 C 160 115, 162 107, 164 101 C 158 99, 150 94.5, 144.5 87 C 151 87, 159 89.5, 166 95.5 C 172 88.5, 179 85, 187 83.5 C 183 91.5, 176 98, 168.5 101.5 C 169.5 108, 171 116, 173 124 Z", 2.5);
    const CL = [cloud(U(44), U(58), .36, [[-.1, .04], [-.01, .065], [.09, .045]]), cloud(U(150), U(44), .26, [[-.07, .035], [.02, .05], [.08, .03]])];
    // the pencil: a guide, the back and the flukes, the head, the fin, the pleats and the belly, the shading, the sea
    b.ink(bd, "guide", ring(88, 122, 64, 27, Math.PI, TAU * .999), .7, .18); b.ink(bd, "guide", ring(88, 122, 64, 22, 0, Math.PI), .6, .12); b.ink(sea, "guide", sv("M 6 124 L 194 124", 8), .6, .14);
    b.ink(bd, "line", BACK.slice(0, -Math.ceil(131 / 2.5)), 1.45, .92); b.ink(tl, "line", TAIL.slice(0, -Math.ceil(16 / 2.5)), 1.4, .92);
    b.ink(bd, "top", DORSAL, 1.2, .9); b.ink(bd, "top", ring(64, 115.4, 2.2, 2.2, 0, TAU, 14), 1, .9); b.ink(bd, "top", sv("M 59.5 111.8 C 62.5 110.2, 66.5 110.3, 69.5 112", 2), .8, .7);
    b.ink(bd, "top", sv("M 22 121.6 C 33 119.2, 46 118.4, 60 120.6", 2), 1, .85); b.ink(bd, "top", sv("M 69.5 98.2 C 71.5 96.6, 74 96.4, 76 97.6", 1.5), .95, .85);
    for (const [x, y, r] of [[30, 114.2, 1.3], [36.5, 110.6, 1.5], [43.5, 107.4, 1.6], [50.5, 104.8, 1.4], [40, 113.4, 1.1]]) b.ink(bd, "top", ring(x, y, r, r, 0, TAU, 10), .7, .7);
    b.ink(bd, "deep", BELLY.slice(0, -Math.ceil(131 / 2.5)), 1.1, .48); b.ink(bd, "deep", FIN, 1, .55); for (const [x, y] of [[73, 140.5], [83.5, 148.5], [94, 155]]) b.ink(bd, "deep", sv(`M ${x - 2.5} ${y + 1.5} Q ${x - 1} ${y + 3.5}, ${x + 1.5} ${y + 3.2}`, 1), .7, .45);
    for (const d of ["M 25 127.5 C 36 134, 50 137, 64 138", "M 29 132 C 40 137.5, 54 140, 68 141", "M 35 136 C 47 140.5, 60 142.5, 74 143.2", "M 44 139.8 C 56 143, 70 144.6, 86 145"]) b.ink(bd, "deep", sv(d, 2.5), .75, .36);
    b.ink(tl, "top", sv("M 165 95 C 165 98, 165.5 100, 166 101.5", 1.5), .8, .7);
    for (const h of hatchIn(BACK, 1.15, .03, (x, y) => y > U(106) && x > U(76))) b.ink(bd, "hatch", h, .55, .3);
    for (const h of hatchIn(TAIL, 1.15, .028, (x, y) => y > U(100) && x > U(165))) b.ink(tl, "hatch", h, .55, .32);
    b.ink(fr, "sea", sv("M 6 124 L 20 124", 3), 1.05, .82); b.ink(fr, "sea", sv("M 153 124 L 157 124", 2), 1.05, .82); b.ink(fr, "sea", sv("M 174 124 L 194 124", 3), 1.05, .82);
    for (const d of ["M 13 126.5 C 16 122.5, 20 122.5, 23 126", "M 145 126 C 148 122, 152 122, 155 126", "M 154 126.5 C 157 122.5, 160 122.5, 162.5 126", "M 170.5 126 C 173.5 122.5, 177 122.5, 180 126.5", "M 60 125.5 C 66 122.5, 72 122.5, 78 125.5", "M 100 125.5 C 106 122.8, 112 122.8, 118 125.5"]) b.ink(fr, "sea", sv(d, 2), .85, .72);
    for (const [x, y, w] of [[14, 142, 6], [24, 166, 7], [54, 180, 6], [96, 188, 5], [128, 174, 7], [150, 160, 6], [178, 146, 6], [132, 150, 5]]) b.ink(sea, "sea", wave(x, y, w), .85, .62);
    CL.forEach(c => b.ink(bg, "sky", c, 1.05, .78));
    b.time("guide", 2.0, 2.32); b.time("line", 2.36, 3.36, .08); b.time("top", 3.4, 4.5, .02); b.time("deep", 4.52, 5.28, .02); b.time("hatch", 5.3, 5.78, .004); b.time("sea", 5.8, 6.12, .012); b.time("sky", 5.92, 6.14, .03);
    // the brush: the sky, the sea, the whale down through the water, its flipper, its back and its flukes, the clouds
    b.wash(bg, SKYPOLY, PIG.sky, .28, 6.5, 7.0, [-.55, -.55], { grad: [[0, [110, 160, 226]], [1, [206, 226, 238]]] });
    b.wash(sea, below(U(124)), [30, 110, 164], .52, 6.98, 7.36, [-.3, .62], { grad: [[0, [92, 170, 212]], [.5, [40, 128, 184]], [1, [22, 90, 150]]] });
    b.wash(bd, BELLY, SKIN, .36, 7.36, 7.56, [U(80), U(136)]); b.wash(bd, FIN, [214, 228, 236], .62, 7.56, 7.68, [U(88), U(148)]);
    b.wash(bd, BACK, SKIN, .68, 7.68, 7.98, [U(96), U(104)], { lift: [[U(98), U(96), .14, .018, .55], [U(46), U(108), .05, .014, .45]] }); b.wash(bd, THROAT, [214, 226, 234], .6, 7.98, 8.06, [U(40), U(121)]); b.wash(tl, TAIL, SKIN, .74, 8.0, 8.2, [U(165), U(98)]);
    CL.forEach((c, k) => b.wash(bg, c, [206, 218, 236], .5, 8.24 + k * .12, 8.44 + k * .12, [c[20][0], c[20][1] + .03]));
    const rain = Array.from({ length: 30 }, (_, i) => { const r = rng(1300 + i), a = -Math.PI / 2 + (r() - .5) * 1.1; return { vx: Math.cos(a) * (.1 + r() * .2), vy: Math.sin(a) * (.95 + r() * .45), s: .006 + r() * .01, t: 9.35 + r() * .35 }; });
    const puffs = Array.from({ length: 9 }, (_, i) => { const r = rng(1400 + i); return { u: (r() - .5) * .16, v: -.38 - r() * .22, s: .04 + r() * .04, t: .15 + r() * .25 }; });
    const slap = Array.from({ length: 20 }, (_, i) => { const r = rng(1500 + i), a = -Math.PI / 2 + (r() - .5) * 1.8; return { vx: Math.cos(a) * (.14 + r() * .3), vy: Math.sin(a) * (.4 + r() * .45), s: .006 + r() * .01, t: 12.05 + r() * .12 }; });
    const blowAt = U(97), bx = U(73);
    return {
      parts: b.parts, birds: [[.36, -.7, .045, .6], [.5, -.62, .036, 2.3], [-.62, -.3, .04, 1.4]], flicks: [7.2, 7.8, 8.3], pal: [SKIN, [30, 110, 164], [178, 204, 218]],
      pose(st, k) { if (k === bd) return [0, (st.live ? -.02 * st.I * env(st.T, 9.1, 9.5, 10.6, 11.4, E.sine) : 0) + Math.sin(st.A * .9) * .006, 0];
        if (k === tl) { const f = st.live ? st.I * (-.34 * env(st.T, 11.2, 11.75, 11.8, 12.05, E.io) + .06 * env(st.T, 12.05, 12.25, 12.3, 12.9, E.sine)) : 0; return [0, Math.sin(st.A * .9) * .006, f + Math.sin(st.A * .7 + 1) * .02]; } return null; },
      live(x, st, k, after, ins) {
        if (k !== fr || !after) return;
        const blow = st.live ? st.I * env(st.T, 9.3, 9.45, 10.3, 11.3) : 0, fb = st.fin;
        const h = (blow > .001 ? seg(st.T, 9.3, 9.75, E.out) : 0) * .5 + fb * .45, spread = blow > .001 ? seg(st.T, 9.5, 11.2, E.out) : fb; // the finale's blow alone when the moment's is done, so a pass's end and the next's rest agree
        if (blow + fb > .01) { const a = clamp(blow + fb); // the blow: a column that fans out and billows, drifting with the wind, then rains down
          for (const d of puffs) { const p = clamp((spread - d.t) / .5); if (p <= 0) continue; const s = d.s * E.out(p) * (1 + spread * .4), u = bx + d.u * (.6 + spread) + spread * .06, v = blowAt + d.v * (h / .5) - spread * .03; x.fillStyle = rgba([244, 250, 253], .8 * a); x.beginPath(); x.arc(u, v, s, 0, TAU); x.fill(); }
          x.strokeStyle = rgba(INK, .7 * a); x.lineWidth = 1.05 / S.RR; for (const sd of [-1, -.35, .35, 1]) { x.beginPath(); for (let i = 0; i <= 10; i++) { const f = i / 10, u = bx + sd * (.012 + f * .09 * (.4 + spread)) + Math.sin(f * 5 + st.A * 3) * .006 + f * spread * .05, v = blowAt - .02 - f * h * .9, [p, q] = st.jit(u, v); i ? x.lineTo(p, q) : x.moveTo(p, q); } x.stroke(); } }
        if (st.live && st.T > 9.3 && st.T < 11.8) for (const d of rain) { const t = st.T - d.t; if (t <= 0 || t > 1.6) continue; const a = st.I * (1 - seg(t, 1.1, 1.6)); x.fillStyle = rgba([240, 248, 252], .9 * a); x.beginPath(); x.arc(bx + d.vx * t, blowAt - .04 + d.vy * t + .8 * t * t, d.s, 0, TAU); x.fill(); x.strokeStyle = rgba([30, 110, 164], .65 * a); x.lineWidth = .8 / S.RR; x.stroke(); }
        if (st.live && st.T > 12 && st.T < 13.2) for (const d of slap) { const t = st.T - d.t; if (t <= 0 || t > 1) continue; const a = st.I * (1 - seg(t, .6, 1)); x.fillStyle = rgba([240, 248, 252], .95 * a); x.beginPath(); x.arc(U(164) + d.vx * t, U(122) + d.vy * t + .9 * t * t, d.s, 0, TAU); x.fill(); x.strokeStyle = rgba([30, 110, 164], .7 * a); x.lineWidth = .8 / S.RR; x.stroke(); }
      },
    };
  };
  /** The teapot on a gingham cloth: round-bellied, a band of white spots round it, its lid and knob, its spout and
   *  handle, and a cup on its saucer in front. Its moment: the lid rattles and it puffs steam, then it tips forward and
   *  pours the cup full, a stream of tea falling from the spout, and the cup steams. */
  const teapot = pal => {
    const b = kit(), bg = b.part(), tp = b.part([U(107), U(152)]), ld = b.part([U(126), U(95.2)]), cup = b.part();
    const GLAZE = [[28, 128, 126], [222, 84, 62], [48, 90, 172]][pal], CLOTH = [[226, 84, 70], [48, 110, 180], [226, 84, 70]][pal];
    const P = pts => pts.map(([u, v]) => [(u - U(114)) * .86 + U(114) + .12, (v - U(152)) * .86 + U(152)]); // the pot drawn big, then set down a little smaller, to the right
    const BODY = P(sv("M 70 126 C 66 102, 86 82, 114 82 C 142 82, 162 102, 158 126 C 154 142, 136 150, 114 150 C 92 150, 74 142, 70 126 Z", 2.5));
    const SPOUT = P(sv("M 72 110 C 60 108, 50 100, 42 84 L 35 85 C 44 106, 56 128, 72 132 Z", 2)), HANDLE = P(sv("M 157 100 C 182 96, 188 132, 156 140 L 157 131 C 175 128, 174 106, 158 109 Z", 2));
    const LID = P(sv("M 93 86 C 95 72, 133 72, 135 86 C 126 89.5, 102 89.5, 93 86 Z", 2)), KNOB = P(ring(114, 67, 5, 5, 0, TAU, 20)), FOOT = P(sv("M 94 147.5 L 92 152.5 L 136 152.5 L 134 147.5", 2));
    const DOTS = [80, 91.5, 103, 114.5, 126, 137.5, 149].map(x => P(ring(x, 117.3 + 1.6 * (1 - Math.pow((x - 114) / 45, 2)), 3.1, 3.1, 0, TAU, 14)));
    const CUPB = sv("M 33.5 133.5 C 33.5 146.5, 39.5 151, 47 151 C 54.5 151, 60.5 146.5, 60.5 133.5 Z", 1.8), SAUCER = ring(47, 151.6, 20, 4.4, 0, TAU, 30), TEA = ring(47, 134.1, 12, 2.6, 0, TAU, 24);
    const WALL = (() => { const y = U(152), r = .965, a0 = Math.asin(y / r), nz = K.noise1(23, 16), out = []; for (let i = 0; i <= 44; i++) { const a = lerp(Math.PI - a0, TAU + a0, i / 44), rr = r * (1 + .04 * (nz(i / 3) - .5)); out.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return out; })(); // the vignette's own round edge, down to the table
    const vb = [], hb = [[156, 160.5], [167, 172.5], [181, 188], [196, 204]].map(([a, c]) => sv(`M 0 ${a} L 200 ${a} L 200 ${c} L 0 ${c} Z`, 20));
    for (let x = -4; x < 204; x += 22) vb.push(sv(`M ${x} 152 L ${x + 11} 152 L ${100 + (x + 11 - 100) * 1.35} 206 L ${100 + (x - 100) * 1.35} 206 Z`, 20));
    // the pencil: a guide, the pot's belly in one line, its spout and handle and lid, the band and its spots, the cup, the shading, the cloth
    b.ink(tp, "guide", P(ring(114, 116, 46, 36)), .7, .2); b.ink(bg, "guide", sv("M 6 152 L 194 152", 8), .6, .15);
    b.ink(tp, "line", BODY, 1.45, .92); b.ink(tp, "line", SPOUT.slice(0, -Math.ceil(40 / 2)), 1.35, .9); b.ink(tp, "line", HANDLE, 1.3, .9);
    b.ink(ld, "top", LID, 1.2, .9); b.ink(ld, "top", KNOB, 1.1, .9); b.ink(tp, "top", FOOT, 1.1, .88);
    b.ink(tp, "top", P(sv("M 71 112 C 90 117.5, 138 117.5, 157 112", 2)), .9, .72); b.ink(tp, "top", P(sv("M 70.4 122 C 90 127.5, 138 127.5, 157.6 122", 2)), .9, .72); DOTS.forEach(d => b.ink(tp, "top", d, .75, .7));
    b.ink(cup, "top", CUPB.slice(0, -Math.ceil(27 / 1.8)), 1.2, .9); b.ink(cup, "top", ring(47, 133.5, 13.5, 3.2, 0, TAU, 26), 1.05, .88); b.ink(cup, "top", sv("M 34 137 C 27 135.5, 26.5 144.5, 35.3 145.6", 1.5), 1, .85); b.ink(cup, "top", SAUCER.filter(([u, v]) => v > U(151.4) || u < U(33) || u > U(61)), 1, .85);
    for (const h of hatchIn(BODY, 1.15, .03, (x, y) => x > U(138) + (y - U(122)) * .15 && y > U(97))) b.ink(tp, "hatch", h, .55, .32);
    for (const h of hatchIn(CUPB, 1.15, .028, x => x > U(53))) b.ink(cup, "hatch", h, .5, .3);
    b.ink(bg, "cloth", sv("M 6 152 L 26 152", 2), 1, .8); b.ink(bg, "cloth", sv("M 68 152 L 194 152", 3), 1.05, .82);
    b.time("guide", 2.0, 2.3); b.time("line", 2.35, 3.4, .06); b.time("top", 3.45, 5.3, .02); b.time("hatch", 5.32, 5.8, .004); b.time("cloth", 5.84, 6.14, .02);
    // the brush: the warm wall, the gingham in two crossing sets of stripes (darker where they cross), the pot round its spots, the lid, the cup and its rim; the tea comes later
    b.wash(bg, WALL, [246, 206, 150], .3, 6.5, 6.9, [-.4, -.5], { grad: [[0, [250, 226, 176]], [1, [242, 186, 132]]] });
    vb.forEach((p, k) => b.wash(bg, p, CLOTH, .34, 6.9 + k * .025, 7.06 + k * .025, [U(100 + (k * 22 - 98) * 1.2), U(172)], { inR: .95 })); hb.forEach((p, k) => b.wash(bg, p, CLOTH, .34, 7.12 + k * .05, 7.26 + k * .05, [U(100), U(162 + k * 14)], { inR: .95 }));
    b.wash(tp, BODY, GLAZE, .7, 7.34, 7.64, [U(120), U(112)], { cut: DOTS, lift: [[U(103), U(108), .06, .03, .55]] }); b.wash(tp, SPOUT, GLAZE, .7, 7.64, 7.74, [U(68), U(114)]); b.wash(tp, HANDLE, GLAZE, .7, 7.74, 7.82, [U(178), U(122)]);
    b.wash(ld, LID, GLAZE, .72, 7.84, 7.92, [U(126), U(90)], { lift: [[U(117), U(89), .022, .009, .5]] }); b.wash(ld, KNOB, GLAZE, .74, 7.92, 7.98, [U(126), U(79.6)]);
    b.wash(cup, CUPB, [238, 240, 244], .5, 8.0, 8.1, [U(47), U(142)]); b.wash(cup, SAUCER, [238, 240, 244], .45, 8.1, 8.18, [U(47), U(152)]); b.wash(cup, sv("M 34 137.4 C 40 139.6, 54 139.6, 60 137.4 L 60.1 140.8 C 54 143, 40 143, 33.9 140.8 Z", 1.5), GLAZE, .6, 8.18, 8.26, [U(47), U(139)]);
    const tilt = st => st.live ? st.I * (-.23 * env(st.T, 9.7, 10.25, 11.45, 12.05, E.io)) : 0, rattle = st => st.live ? st.I * env(st.T, 9.0, 9.1, 9.5, 9.65) : 0;
    const tip = st => { const a = tilt(st), c = Math.cos(a), s = Math.sin(a), u = SPOUT[0][0] * 0 + U(60.8) - U(107), v = U(93.8) - U(152); return [U(107) + u * c - v * s, U(152) + u * s + v * c]; };
    const steam = (x, st, cx, cy, h, a, n = 2) => { x.strokeStyle = rgba(INK, a); x.lineWidth = 1 / S.RR; for (let w = 0; w < n; w++) { x.beginPath(); for (let i = 0; i <= 14; i++) { const f = i / 14, u = cx + (w - (n - 1) / 2) * .04 + Math.sin(f * 6 - st.A * 2.2 + w * 2) * .02 * f, v = cy - f * h, [p, q] = st.jit(u, v); i ? x.lineTo(p, q) : x.moveTo(p, q); } x.stroke(); } };
    return {
      parts: b.parts, flicks: [7.2, 7.7, 8.1], pal: [GLAZE, CLOTH, [242, 186, 132]],
      pose(st, k) { if (k === tp) return [0, 0, tilt(st)]; if (k === ld) { const r = rattle(st), t = tilt(st), up = r * Math.abs(Math.sin(st.T * 34)) * .012, c = Math.cos(t), s = Math.sin(t), u = U(126) - U(107), v = U(95.2) - U(152); return [U(107) + u * c - v * s - U(126), U(152) + u * s + v * c - U(95.2) - up, t + r * Math.sin(st.T * 30) * .05]; } return null; },
      live(x, st, k, after, ins) {
        if (k !== cup || !after) return; const ga = x.globalAlpha;
        const [tx, ty] = tip(st), puff = st.live ? st.I * env(st.T, 9.05, 9.3, 9.8, 10.3) : 0; // a puff from the spout while the lid rattles
        if (puff > .02) { x.globalAlpha = ga * puff; steam(x, st, tx - .01, ty - .02, .1 + puff * .06, .7, 2); x.globalAlpha = ga; }
        const rt = st.live ? st.I * env(st.T, 9.0, 9.1, 9.5, 9.65) : 0; if (rt > .02) { x.globalAlpha = ga * rt; x.strokeStyle = rgba(INK, .7); x.lineWidth = 1 / S.RR; for (const sd of [-1, 1]) { const cx = U(126), cy = U(80); x.beginPath(); x.moveTo(cx + sd * .15, cy - .02); x.lineTo(cx + sd * .19, cy - .06); x.moveTo(cx + sd * .17, cy + .05); x.lineTo(cx + sd * .22, cy + .03); x.stroke(); } x.globalAlpha = ga; }
        const f = st.live ? st.I * env(st.T, 10.15, 10.35, 11.35, 11.75) : 0; // the stream: out of the spout's tip and down into the cup
        if (f > .01) { const ex = U(46.5), ey = U(134); x.strokeStyle = rgba([150, 88, 40], .88 * f); x.lineCap = "round"; let p0 = [tx, ty]; for (let i = 1; i <= 16; i++) { const q = i / 16, p1 = [lerp(tx, ex, q) - .035 * Math.sin(q * Math.PI) * (1 - q), lerp(ty, ey, q)]; x.lineWidth = lerp(.024, .012, q) * (.5 + .5 * f); x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.stroke(); p0 = p1; }
          x.strokeStyle = rgba([255, 236, 204], .5 * f); x.lineWidth = .004; x.beginPath(); x.moveTo(tx + .004, ty + .01); x.lineTo(lerp(tx, ex, .5) - .004, lerp(ty, ey, .5)); x.stroke(); }
        const full = st.live ? st.I * seg(st.T, 10.35, 11.5) : 1; // the tea in the cup: poured in the moment, there at rest; and its steam
        if (full > .01) { x.globalAlpha = ga * full; x.fillStyle = rgba([150, 88, 40], .88); x.beginPath(); TEA.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); x.fill(); x.fillStyle = rgba([255, 236, 200], .4); x.beginPath(); x.ellipse(U(42), U(133.6), .03, .006, 0, 0, TAU); x.fill(); x.globalAlpha = ga; }
        if (f > .01) { x.strokeStyle = rgba([255, 240, 214], .7 * f); x.lineWidth = .8 / S.RR; for (let q = 0; q < 2; q++) { const rr = ((st.A * 1.8 + q / 2) % 1); x.beginPath(); x.ellipse(U(46.5), U(134.2), .01 + rr * .08, .003 + rr * .015, 0, 0, TAU); x.stroke(); } }
        const hot = (st.live ? st.I * env(st.T, 11.3, 12, 13.8, 14.6) : 0) * .8 + full * .2 + st.fin * .5; if (hot > .02) { x.globalAlpha = ga * clamp(hot); steam(x, st, U(47), U(127), .15 + hot * .12, .7); x.globalAlpha = ga; }
      },
    };
  };
  /** The hummingbird at a fuchsia: the bird hovering, its wings a blur, its green back and its ruby throat, its long bill;
   *  the flower hanging from its arching stem, pink sepals flared over a purple skirt, its stamens, a bud, the leaves.
   *  Its moment: it darts in and drinks, the flower nodding and shedding pollen, backs out, loops up and comes back. */
  const bird = pal => {
    const b = kit(), bg = b.part(), fl = b.part([U(190), U(76)]), bd = b.part([U(84), U(136)]);
    const SEPAL = [[232, 64, 128], [214, 40, 60], [240, 118, 158]][pal], SKIRT = [[118, 56, 170], [146, 64, 186], [196, 40, 120]][pal], GORGET = [[222, 34, 78], [236, 86, 30], [206, 30, 110]][pal];
    const HEAD = ring(98, 122, 9, 8.6, 0, TAU, 30), BILL = sv("M 105.6 118.2 L 133 106.6 L 106.4 121.4", 1.5);
    const BODY = sv("M 90 116 C 82 121, 74 131, 68 146 L 56 166 L 64 160 L 66 170 L 76 156 C 88 150, 98 140, 104 128 C 106 124, 104 118, 98 114 C 95 113.5, 92 114.5, 90 116 Z", 2);
    const BELLY = sv("M 103.5 129 C 98 140, 88 150, 76.5 155.5 C 80 146, 88 136, 96 131 C 99 130, 101 129.5, 103.5 129 Z", 1.5), THROAT = sv("M 105.6 124.4 C 105.6 131, 101.6 136.6, 95 139.6 C 92.4 133.6, 95.4 127.4, 105.6 124.4 Z", 1.2);
    const WING = sv("M 88 124 C 83 110, 74 97, 58 89 C 56.5 88.5, 56 90.5, 57.5 91.5 C 67 99, 75 112, 81 128 Z", 1.6), WING2 = sv("M 91 121 C 89 105, 84 92, 74 81.5 C 73 80.5, 71.5 81.5, 72 83 C 77 94, 81 108, 84 125 Z", 1.6);
    const STEM = sv("M 190 76 C 178 56, 160 50, 148 54 C 140 57, 136 62, 136 70", 2.5), STEM2 = sv("M 162 53 C 168 60, 171 70, 171 80", 2);
    const TUBE = sv("M 133 70 L 139 70 L 138.5 83 L 133.5 83 Z", 1.2), SEP = [sv("M 133.5 82 C 124 80, 116 84, 110 94 C 118 90, 126 88, 134.5 88 Z", 1.5), sv("M 138.5 82 C 148 80, 156 84, 162 94 C 154 90, 146 88, 137.5 88 Z", 1.5), sv("M 134 83 C 131 92, 128 98, 128 104 C 132 98, 134.5 93, 136 86 Z", 1.5)];
    const SKIRTP = sv("M 128.5 88 C 126 96, 125.5 104, 128 110 C 131 108, 133 110.5, 136 110 C 139 110.5, 141 108, 144 110 C 146.5 104, 146 96, 143.5 88 C 139 86, 133 86, 128.5 88 Z", 1.5);
    const BUD = sv("M 170 80 C 166 86, 166 94, 172 98 C 178 94, 178 86, 174 80 Z", 1.5);
    const LEAVES = [sv("M 154 53 C 150 45, 153 37, 160 33 C 163 41, 160 49, 154 53 Z", 2), sv("M 178 70 C 185 73, 188 80, 186 87 C 180 84, 176 77, 178 70 Z", 2), sv("M 146 56 C 134 52, 124 56, 118 64 C 128 66, 138 64, 146 56 Z", 2)];
    // the pencil: a guide, the bird in one line and its bill, the wings, the flower and its stem, the leaves, the details, the shading
    b.ink(bd, "guide", ring(86, 132, 26, 30), .7, .18); b.ink(fl, "guide", sv("M 190 76 C 170 46, 140 50, 136 70", 6), .6, .15);
    b.ink(bd, "line", BODY, 1.4, .92); b.ink(bd, "line", HEAD.slice(4, 26), 1.3, .9); b.ink(bd, "line", BILL, 1.1, .92);
    b.ink(bd, "wing", WING, 1.05, .8); b.ink(bd, "wing", WING2, .9, .6); for (const f of [.35, .6]) b.ink(bd, "wing", sv(`M ${lerp(86, 60, f)} ${lerp(125, 90, f)} L ${lerp(80, 64, f) + 4} ${lerp(128, 98, f) + 2}`, 1.5), .7, .5);
    b.ink(fl, "flower", STEM, 1.2, .88); b.ink(fl, "flower", STEM2, 1, .8); b.ink(fl, "flower", TUBE, 1, .88); SEP.forEach(s2 => b.ink(fl, "flower", s2, 1.05, .9)); b.ink(fl, "flower", SKIRTP, 1.1, .9); b.ink(fl, "flower", BUD, 1, .85); LEAVES.forEach(l => b.ink(fl, "flower", l, 1, .85));
    for (const [x2, y2] of [[132, 122], [136, 125], [140, 121]]) { b.ink(fl, "detail", sv(`M ${x2 < 136 ? 133 : x2 > 136 ? 139 : 136} 109 L ${x2} ${y2}`, 1.5), .7, .8); b.ink(fl, "detail", ring(x2, y2 + 1.2, 1.2, 1.2, 0, TAU, 8), .7, .8); }
    for (const l of LEAVES) { const m = l[Math.floor(l.length / 2)]; b.ink(fl, "detail", [l[0], [lerp(l[0][0], m[0], .5) + .004, lerp(l[0][1], m[1], .5) + .004], m], .6, .55); }
    b.ink(bd, "detail", ring(100.6, 119.6, 1.7, 1.7, 0, TAU, 10), 1, .95); b.ink(bd, "detail", sv("M 97 125 C 99 129, 99 133, 97 136.5", 1.2), .7, .6); b.ink(bd, "detail", sv("M 70 150 L 62 163 M 73 153 L 67 166", 1.5), .6, .55);
    for (const h of hatchIn(BODY, 1.15, .026, (x, y) => y < U(128) + (x - U(80)) * .1 && x < U(94))) b.ink(bd, "hatch", h, .5, .3);
    for (const h of hatchIn(SKIRTP, 1.2, .022, x => x > U(138))) b.ink(fl, "hatch", h, .5, .32);
    b.time("guide", 2.0, 2.3); b.time("line", 2.35, 3.25, .06); b.time("wing", 3.28, 3.8, .03); b.time("flower", 3.84, 4.95, .02); b.time("detail", 4.98, 5.4, .015); b.time("hatch", 5.42, 5.9, .004);
    // the brush: the garden's green haze, the leaves, the sepals and the skirt, the bud, the bird's back and throat, its wings
    b.wash(bg, SKYPOLY, [150, 200, 160], .26, 6.5, 7.0, [-.5, -.5], { grad: [[0, [178, 222, 206]], [.6, [196, 226, 180]], [1, [226, 232, 176]]] });
    LEAVES.forEach((l, k) => b.wash(fl, l, [78, 150, 70], .6, 7.0 + k * .06, 7.1 + k * .06, l[Math.floor(l.length / 3)]));
    SEP.forEach((s2, k) => b.wash(fl, s2, SEPAL, .72, 7.18 + k * .05, 7.28 + k * .05, s2[Math.floor(s2.length / 2)])); b.wash(fl, TUBE, SEPAL, .7, 7.32, 7.38, [U(136), U(76)]);
    b.wash(fl, SKIRTP, SKIRT, .7, 7.38, 7.5, [U(136), U(100)]); b.wash(fl, BUD, SEPAL, .66, 7.5, 7.56, [U(172), U(88)]);
    b.wash(bd, BODY, [40, 146, 104], .7, 7.6, 7.84, [U(84), U(132)], { lift: [[U(88), U(124), .03, .012, .5]] }); b.wash(bd, HEAD, [40, 146, 104], .72, 7.84, 7.92, [U(97), U(120)], { lift: [[U(95), U(117.5), .016, .01, .55]] });
    b.wash(bd, BELLY, [226, 230, 222], .6, 7.92, 7.98, [U(92), U(140)]); b.wash(bd, THROAT, GORGET, .8, 7.98, 8.06, [U(100), U(130)]);
    b.wash(bd, WING, [150, 156, 190], .36, 8.08, 8.18, [U(72), U(106)]); b.wash(bd, WING2, [150, 156, 190], .26, 8.18, 8.26, [U(80), U(102)]);
    const pollen = Array.from({ length: 16 }, (_, i) => { const r = rng(1600 + i), a = r() * TAU; return { vx: Math.cos(a) * (.06 + r() * .1), vy: Math.sin(a) * (.05 + r() * .08) - .04, s: .004 + r() * .005, t: 9.95 + r() * .5 }; });
    // where the bird is: hovering in place; in the moment it darts in to the flower, drinks, backs out, loops up and comes back
    const at = st => { const h = [Math.sin(st.A * 1.7) * .008, Math.sin(st.A * 2.3) * .01]; if (!st.live) return [h[0], h[1] - st.fin * .03, 0];
      const k = st.I, T = st.T, into = env(T, 9.35, 9.7, 10.75, 11.1, E.io), loop = seg(T, 11.5, 12.9, E.io), la = loop * TAU, lr = .09 * env(T, 11.5, 11.6, 12.8, 12.9);
      const sip = into * Math.sin(T * 9) * .006, back = env(T, 9.1, 9.3, 9.35, 9.5) * -.025;
      return [h[0] + k * (into * .102 + back + Math.sin(la) * lr), h[1] + k * (into * -.052 + sip - (1 - Math.cos(la)) * lr * .9) - st.fin * .03, k * (into * -.08 + Math.sin(la) * .12 * (lr / .09))]; };
    return {
      parts: b.parts, flicks: [7.2, 7.7, 8.2], pal: [SEPAL, [78, 150, 70], [40, 146, 104]],
      pose(st, k) { if (k === bd) return at(st); if (k === fl) { const nod = st.live ? st.I * env(st.T, 9.62, 9.75, 10.7, 11.4) : 0; return [0, 0, Math.sin(st.A * .8) * .006 + nod * (.018 + Math.sin(st.T * 9) * .006)]; } return null; },
      live(x, st, k, after, ins) {
        const ga = x.globalAlpha;
        if (k === bd && !after) { // the wings in a hover: the sweep of the beat as a fan of wash, the wing redrawn in faint pencil at the ends of its stroke and once between, arcs where the tips sweep
          const pw = st.prog(8.08, 8.3), pg = st.prog(3.8, 4.25), fast = st.live ? clamp(st.alive * 1.4) : 0; // the fan once the brush has painted the wing, the pencil's ghosts once it has drawn it; wider as it darts
          const lo = -.64 - .1 * fast, hi = .6 + .08 * fast, o = [U(88), U(124)], tipA = Math.atan2(U(89) - o[1], U(57) - o[0]), tipR = Math.hypot(U(57) - o[0], U(89) - o[1]), sheen = lo + (hi - lo) * (.5 + .5 * Math.sin(st.A * 2.1));
          const wingAt = (a, fn) => { x.save(); x.translate(o[0], o[1]); x.rotate(a); x.translate(-o[0], -o[1]); fn(); x.restore(); }, outline = () => { x.beginPath(); WING.forEach(([u, v], j) => j ? x.lineTo(u, v) : x.moveTo(u, v)); };
          if (pw > .01) { x.fillStyle = rgba([158, 164, 204], 1); for (let i = 0; i < 9; i++) { const f = i / 8, a = lo + (hi - lo) * f, end = Math.pow(Math.abs(f - .5) * 2, 3), lit = Math.exp(-Math.pow((a - sheen) / .25, 2)); x.globalAlpha = ga * pw * (.045 + .1 * end + .05 * lit); wingAt(a, () => { outline(); x.fill(); }); } } // denser at the two ends, where the wing slows to turn; a sheen moving slowly across it
          if (pg > .01) { x.strokeStyle = rgba(INK, 1); x.lineWidth = .8 / S.RR; x.lineJoin = "round";
            for (const [a, k2] of [[lo, .3], [hi, .3], [lo * .45, .17]]) { x.globalAlpha = ga * pg * k2; wingAt(a, () => { x.beginPath(); WING.forEach(([u, v], j) => { const [p2, q2] = st.jit(u, v); j ? x.lineTo(p2, q2) : x.moveTo(p2, q2); }); x.stroke(); }); }
            x.lineWidth = .9 / S.RR; for (const [dr, k2, t0, t1] of [[.02, .34, .1, .9], [.055, .24, .25, .75], [.085, .14, .38, .62]]) { x.globalAlpha = ga * pg * k2; x.beginPath(); x.arc(o[0], o[1], tipR + dr, tipA + lo + (hi - lo) * t0, tipA + lo + (hi - lo) * t1); x.stroke(); } } // the tips' sweep, in arcs that shorten as they reach out
          x.globalAlpha = ga; }
        if (k === fl && after && st.live && st.T > 9.9 && st.T < 11.6) for (const d of pollen) { const t = st.T - d.t; if (t <= 0 || t > 1) continue; x.fillStyle = rgba([250, 214, 60], .9 * st.I * (1 - t)); x.beginPath(); x.arc(U(136) + d.vx * t, U(112) + d.vy * t + .1 * t * t, d.s, 0, TAU); x.fill(); }
        x.globalAlpha = ga;
      },
    };
  };
  /** a tapering band round a centreline in the 200-box, for a tail or a stripe */
  const tube = (d, w0, w1) => { const c = sv(d, 2), n = c.length, L = [], R2 = []; for (let i = 0; i < n; i++) { const a = c[Math.max(0, i - 1)], b2 = c[Math.min(n - 1, i + 1)], dx = b2[0] - a[0], dy = b2[1] - a[1], l = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (n - 1)) / 200; L.push([c[i][0] - dy / l * w, c[i][1] + dx / l * w]); R2.push([c[i][0] + dy / l * w, c[i][1] - dx / l * w]); } return [...L, ...R2.reverse()]; };
  /** The rare one: a cat, sitting on its rug by a ball of yarn — the one that comes to life a little more. Its eyes are
   *  drawn early, and from then on they watch the pencil draw the rest of it and the brush paint it; its moment: it
   *  watches the brush go, yawns, bats its yarn twice, and gives a slow blink, the way a cat says it's fond of you. */
  const cat = pal => {
    const b = kit(), bg = b.part(), tl = b.part([U(70), U(152)]), bd = b.part(), hd = b.part([U(100), U(95)]), pw = b.part([U(112), U(124)]), yn = b.part([U(152), U(150)]);
    const FUR = [[234, 144, 58], [140, 140, 152], [62, 62, 76]][pal], STRIPE = [[196, 98, 34], [88, 88, 104], [40, 40, 52]][pal], IRIS = [[118, 178, 70], [228, 176, 52], [184, 204, 66]][pal], YARN = [[230, 80, 96], [40, 140, 150], [122, 90, 190]][pal];
    const BODY = sv("M 84 94 C 71 106, 63 128, 65 150 C 66 158, 75 163, 88 163 L 112 163 C 125 163, 134 158, 135 150 C 137 128, 129 106, 116 94 Z", 2.5), BIB = sv("M 92 97 C 86 110, 87 128, 93 142 C 96 138, 104 138, 107 142 C 113 128, 114 110, 108 97 Z", 2);
    const HEAD = sv("M 75 74 C 73 57, 85 45, 100 45 C 115 45, 127 57, 125 74 C 124 87, 113 96, 100 96 C 87 96, 76 87, 75 74 Z", 2.5), MUZZLE = sv("M 90 80.5 C 90 74.5, 96 72.5, 100 76 C 104 72.5, 110 74.5, 110 80.5 C 110 86.5, 105 89.5, 100 89.5 C 95 89.5, 90 86.5, 90 80.5 Z", 1.5);
    const EARS = [sv("M 80 60 C 77 49, 76 41, 77.5 32 C 84.5 36, 90 41, 95.5 47.5 Z", 2), sv("M 104.5 47.5 C 110 41, 115.5 36, 122.5 32 C 124 41, 123 49, 120 60 Z", 2)], INNER = [sv("M 82 53 C 80.5 46.5, 80.5 41.5, 81.5 37.5 C 85.5 40.5, 88.5 43.5, 91.5 47.5 Z", 1.5), sv("M 108.5 47.5 C 111.5 43.5, 114.5 40.5, 118.5 37.5 C 119.5 41.5, 119.5 46.5, 118 53 Z", 1.5)];
    const EYE = [[89.5, 68], [110.5, 68]], EYES = EYE.map(([x, y]) => ring(x, y, 6.2, 6.8, 0, TAU, 28)), NOSE = sv("M 97 77 L 103 77 L 100 80.6 Z", 1);
    const LEG = sv("M 104 140 C 105 148, 105 154, 104 160 C 104 165.5, 118 165.5, 118 160 C 117 150, 116 140, 114 128 C 110 128, 106 132, 104 140 Z", 1.8);
    const TAIL = tube("M 70 152 C 50 152, 40 140, 42 122 C 43 110, 39 102, 30 99", 10, 6), RUG = ring(100, 164, 74, 15.5, 0, TAU, 48), BALL = ring(152, 150, 12.5, 12.5, 0, TAU, 30);
    const STRIPES = ["M 70 118 C 75 120, 79 124, 80 129", "M 67 132 C 72 134, 76 138, 77 143", "M 130 118 C 125 120, 121 124, 120 129", "M 133 132 C 128 134, 124 138, 123 143", "M 100 50 L 100 57.5", "M 94 51.5 L 95.5 57.5", "M 106 51.5 L 104.5 57.5", "M 76.5 74 L 83.5 75.5", "M 123.5 74 L 116.5 75.5"];
    // the pencil: a guide, the head and the body in confident lines, the ears; the eyes first of the details (then it can watch), the nose and mouth, the legs, the whiskers; its stripes; the shading; the rug and the yarn
    b.ink(hd, "guide", ring(100, 70, 25, 25), .7, .2); b.ink(bd, "guide", ring(100, 130, 35, 33), .7, .18); b.ink(bd, "guide", sv("M 100 30 L 100 166", 6), .6, .14);
    b.ink(hd, "line", HEAD, 1.45, .92); b.ink(bd, "line", BODY.slice(0, -Math.ceil(24 / 2.5)), 1.4, .92); EARS.forEach(e => b.ink(hd, "line", e.slice(0, -4), 1.3, .9));
    EYES.forEach(e => b.ink(hd, "eyes", e, 1.15, .92)); b.ink(hd, "face", NOSE, 1, .9); b.ink(hd, "face", sv("M 100 80.6 C 100 83.5, 97.5 85.5, 94.5 84.5", 1), .9, .85); b.ink(hd, "face", sv("M 100 80.6 C 100 83.5, 102.5 85.5, 105.5 84.5", 1), .9, .85);
    b.ink(hd, "face", MUZZLE.slice(0, 18), .7, .45); INNER.forEach(e => b.ink(hd, "face", e.slice(0, -3), .8, .6));
    b.ink(bd, "face", BIB.slice(0, -4), .8, .55); b.ink(bd, "face", sv("M 86 128 C 84 140, 83 150, 83 160", 2), 1.05, .88); b.ink(bd, "face", sv("M 96 140 C 95 148, 95 154, 95.5 160", 2), 1, .85); b.ink(bd, "face", sv("M 82.5 160 C 82.5 165.5, 96.5 165.5, 96 160", 1.5), 1, .88);
    b.ink(pw, "face", LEG, 1.05, .88); for (const x of [108.5, 113]) b.ink(pw, "face", sv(`M ${x} 164.5 L ${x} 162`, 1), .7, .7); for (const x of [87, 91.5]) b.ink(bd, "face", sv(`M ${x} 164.5 L ${x} 162`, 1), .7, .7);
    for (const d of ["M 91 81 L 69 77", "M 91 83 L 68 84.5", "M 92 85 L 70 91", "M 109 81 L 131 77", "M 109 83 L 132 84.5", "M 108 85 L 130 91"]) b.ink(hd, "whisk", sv(d, 3), .7, .7);
    STRIPES.forEach((d, k) => b.ink(k < 4 ? bd : hd, "stripe", sv(d, 2), .95, .75)); b.ink(tl, "stripe", TAIL, 1.2, .9); for (const f of [.3, .5, .7]) { const c = sv("M 70 152 C 50 152, 40 140, 42 122 C 43 110, 39 102, 30 99", 2), p = c[Math.floor(f * (c.length - 1))]; b.ink(tl, "stripe", [[p[0] - .03, p[1] - .02], [p[0] + .03, p[1] + .025]], .8, .6); }
    for (const h of hatchIn(BODY, 1.15, .03, (x, y) => x > U(122) && y > U(104))) b.ink(bd, "hatch", h, .55, .3); for (const h of hatchIn(HEAD, 1.15, .028, (x, y) => y > U(86) && x > U(104))) b.ink(hd, "hatch", h, .5, .28);
    b.ink(bg, "rug", RUG.filter(([u, v]) => v > U(156) || u < U(62) || u > U(140)), 1.05, .82); b.ink(bg, "rug", ring(100, 164, 60, 11.5, .35, Math.PI - .35, 30), .7, .45);
    b.ink(yn, "rug", BALL, 1.15, .9); for (const d of ["M 141 144 C 147 140, 157 140, 163 146", "M 140 152 C 148 147, 158 148, 164 154", "M 143 158 C 150 154, 158 156, 162 160", "M 147 139 C 142 146, 143 155, 149 162"]) b.ink(yn, "rug", sv(d, 2), .75, .7); b.ink(yn, "rug", sv("M 141 157 C 134 162, 128 167, 120 168.5 C 113 170, 108 168, 102 170.5", 2), .8, .75);
    b.time("guide", 2.0, 2.3); b.time("line", 2.35, 3.3, .06); b.time("eyes", 3.34, 3.62, .04); b.time("face", 3.66, 4.7, .02); b.time("whisk", 4.72, 4.98, .02); b.time("stripe", 5.0, 5.36, .02); b.time("hatch", 5.38, 5.82, .004); b.time("rug", 5.84, 6.14, .012);
    // the brush: the warm room, the rug, the tail, the body round its white bib, the head round its muzzle, the ears and their pink, the paw, the stripes darker, the eyes, the nose, the yarn
    b.wash(bg, SKYPOLY, [246, 206, 160], .28, 6.5, 6.92, [-.5, -.55], { grad: [[0, [252, 230, 192]], [1, [240, 190, 146]]] });
    b.wash(bg, RUG, [44, 110, 150], .5, 6.92, 7.1, [U(70), U(166)]);
    b.wash(tl, TAIL, FUR, .72, 7.12, 7.22, [U(44), U(124)]); b.wash(bd, BODY, FUR, .7, 7.22, 7.46, [U(100), U(128)], { cut: [BIB] }); b.wash(hd, HEAD, FUR, .72, 7.46, 7.62, [U(100), U(62)], { cut: [MUZZLE, ...EYES] });
    EARS.forEach((e, k) => b.wash(hd, e, FUR, .72, 7.62 + k * .04, 7.68 + k * .04, e[5])); INNER.forEach((e, k) => b.wash(hd, e, [240, 150, 160], .6, 7.7 + k * .03, 7.75 + k * .03, e[4]));
    b.wash(pw, LEG, FUR, .72, 7.78, 7.86, [U(111), U(148)]); STRIPES.forEach((d, k) => b.wash(k < 4 ? bd : hd, tube(d, 3.2, 1.6), STRIPE, .6, 7.88 + k * .015, 7.94 + k * .015, sv(d, 2)[0]));
    EYES.forEach((e, k) => b.wash(hd, e, IRIS, .72, 8.04 + k * .04, 8.1 + k * .04, [U(EYE[k][0]), U(EYE[k][1])])); b.wash(hd, NOSE, [232, 128, 140], .8, 8.14, 8.18, [0, U(78)]);
    b.wash(bd, BIB, [250, 240, 224], .5, 8.18, 8.24, [0, U(118)]); b.wash(hd, MUZZLE, [250, 240, 224], .45, 8.24, 8.28, [0, U(82)]); b.wash(yn, BALL, YARN, .72, 8.3, 8.42, [U(152), U(150)]);
    // the moment, and the eyes: where it looks, how open its eyes are, its yawn, its paw, its yarn
    const yawnK = st => st.live ? st.I * env(st.T, 9.7, 10.1, 10.45, 10.9, E.sine) : 0, bat = st => st.live ? st.I * (env(st.T, 11.0, 11.18, 11.22, 11.42, E.io) + .8 * env(st.T, 11.5, 11.66, 11.7, 11.9, E.io)) : 0;
    const look = st => { const c = [0, U(68)]; if (!st.live) return c; const T = st.T;
      if (T < 9.05 && st.gaze && st.prog(3.3, 3.62) >= 1) return st.gaze; if (T < 9.7) return [lerp(.3, .95, seg(T, 8.9, 9.6)), lerp(-.2, -1.1, seg(T, 8.9, 9.6))];
      if (T > 10.8 && T < 12) return [U(152) + (bat(st) > .1 ? .02 : 0), U(150)]; return c; };
    const openK = st => { const blink = Math.pow(Math.max(0, Math.sin((st.A / 6.3) * TAU * 1)), 60); let o = 1 - blink; if (st.live) { o *= 1 - .75 * yawnK(st) / Math.max(st.I, .001) * st.I; o *= 1 - .92 * st.I * env(st.T, 12.15, 12.5, 12.65, 13.1, E.sine); } return clamp(o, .06, 1); };
    return {
      parts: b.parts, flicks: [7.2, 7.72, 8.3], pal: [FUR, YARN, [44, 110, 150]],
      pose(st, k) {
        if (k === tl) return [0, 0, Math.sin(st.A * .9) * .05 + (st.live ? st.I * env(st.T, 10.9, 11.1, 12, 12.4) * Math.sin(st.A * 5) * .1 : 0)];
        if (k === hd) { const y = yawnK(st), tg = look(st), turn = st.live ? clamp((tg[0] - 0) * .09, -.08, .08) * st.I * (st.T > 3.62 ? 1 : 0) : 0; return [0, -y * .012 - st.fin * .01, -y * .07 + turn + Math.sin(st.A * .6) * .012]; }
        if (k === pw) return [0, 0, -.72 * bat(st)];
        if (k === yn) { const r1 = st.live ? st.I * (seg(st.T, 11.3, 11.9, E.out) - seg(st.T, 11.75, 12.6, E.io)) : 0; return [r1 * .07, 0, r1 * 1.6]; }
        return null;
      },
      live(x, st, k, after, ins) {
        if (k !== hd || !after || st.prog(3.3, 3.62) < 1) return;
        const tg = look(st), o = openK(st), painted = st.prog(8.04, 8.14), ga = x.globalAlpha;
        EYE.forEach(([ex, ey]) => { const cx = U(ex), cy = U(ey), dx = tg[0] - cx, dy = tg[1] - cy, d = Math.hypot(dx, dy) || 1, m = Math.min(.024, d * .12), px2 = cx + dx / d * m, py2 = cy + dy / d * m * .8, wide = st.live && st.T > 12.1 ? .012 : .008;
          x.save(); x.beginPath(); x.ellipse(cx, cy, .06, .066, 0, 0, TAU); x.clip();
          x.fillStyle = rgba([34, 30, 34], .92); x.beginPath(); x.ellipse(px2, py2, wide + .006 * (1 - painted), .05, 0, 0, TAU); x.fill(); x.fillStyle = "rgba(255,255,255,.9)"; x.beginPath(); x.arc(px2 - .012, py2 - .02, .008, 0, TAU); x.fill();
          if (o < .99) { const ly = cy - .068 + .136 * (1 - o); x.fillStyle = painted > .5 ? rgba(FUR, .92) : "rgba(248,246,241,1)"; x.fillRect(cx - .07, cy - .07, .14, ly - cy + .07); x.strokeStyle = rgba(INK, .9); x.lineWidth = 1.2 / S.RR; x.beginPath(); x.moveTo(cx - .065, ly); x.quadraticCurveTo(cx, ly + .012, cx + .065, ly); x.stroke(); }
          x.restore(); });
        const y = yawnK(st); if (y > .02) { const w = .05 + y * .03, h = y * .085, my = U(84.5); x.fillStyle = rgba([150, 40, 56], .95); x.beginPath(); x.ellipse(0, my + h / 2, w, h / 2 + .004, 0, 0, TAU); x.fill(); x.fillStyle = rgba([236, 120, 136], .95); x.beginPath(); x.ellipse(0, my + h * .78, w * .6, h * .22, 0, 0, TAU); x.fill();
          x.fillStyle = "#FFF"; for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(sd * w * .55, my + .004); x.lineTo(sd * w * .38, my + .004); x.lineTo(sd * w * .47, my + .004 + h * .28); x.fill(); } x.strokeStyle = rgba(INK, .9); x.lineWidth = 1.1 / S.RR; x.beginPath(); x.ellipse(0, my + h / 2, w, h / 2 + .004, 0, 0, TAU); x.stroke(); }
        x.globalAlpha = ga;
      },
    };
  };
  /** the subjects: the balloon (drawn by the code above) and those after it, a pass drawing one of them in turn; and the
   *  rare one, the cat, about one pass in eight (never two running), dealt from the pass alone like the rest */
  const SUBJECTS = [null, lighthouse, sailboat, whale, teapot, bird, cat], NSUB = SUBJECTS.length - 1, RARE = NSUB;
  const rare = P => P > 1 && deal(P, 41)() < .125 && !(deal(P - 1, 41)() < .125);
  /** what pass P draws, worked out from P alone: the subject from the bag (or now and then the rare one), its colours,
   *  which way it faces, which way the eraser goes; pass 0 is the signature */
  const planOf = P => {
    if (P <= 0) return { id: 0, pal: 0, key: "0:0", mirror: 0, ang: 0 };
    const r = deal(P, 23), id = rare(P) ? RARE : bag(P, NSUB, 5), pal = Math.floor(r() * 3);
    return { id, pal, key: id + ":" + pal, mirror: r() < .5 ? 1 : 0, ang: [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4][Math.floor(r() * 4)] };
  };
  /** the eraser's rows for the passes after the signature: close enough that they overlap, past the circle at both ends */
  const EP2 = []; [-.84, -.5, -.17, .17, .5, .84].forEach((y, i) => { const xs = i % 2 ? [1.02, -1.02] : [-1.02, 1.02]; for (let k = 0; k <= 20; k++) EP2.push([lerp(xs[0], xs[1], k / 20), y + (k / 20 - .5) * .1]); });
  const EL2 = [0]; for (let i = 1; i < EP2.length; i++) EL2.push(EL2[i - 1] + Math.hypot(EP2[i][0] - EP2[i - 1][0], EP2[i][1] - EP2[i - 1][1]));
  const lens = pts => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; };
  /** the balloon, when a pass after the signature rubs it out or draws it again: the pencil's and the brush's way round it */
  const B_INST = { balloon: true,
    pen: [...STROKES.map(s => [s[0], s[1], s[2], 0]), ...CSTROKES.map(s => [s[0], s[1], s[2], 0]), ...BIRDS.map(([bx, by, s], i) => [[[bx - s, by - s * .2], [bx, by], [bx + s, by - s * .2]], 6.16 + i * .08, 6.24 + i * .08, 0])].sort((a, b) => a[1] - b[1]).map(e => [...e, lens(e[0])]),
    brush: WASH.map(w => { const xs = w[0].map(p => p[0]), ys = w[0].map(p => p[1]); return [w[3], w[4], w[5], 0, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]; }).sort((a, b) => a[0] - b[0]) };
  /** the balloon's gores when a later pass draws it again: the signature's colours, a rainbow, or blue and gold */
  const GPAL = [GCOL, [PIG.coral, [244, 128, 40], PIG.sun, [112, 176, 76], PIG.teal, PIG.sky, [118, 96, 196], [220, 86, 146]], [[56, 106, 188], PIG.sun, [56, 106, 188], PIG.sun, [56, 106, 188], PIG.sun, [56, 106, 188], PIG.sun]];
  /** a sprite drawn smooth at the screen's density, `w` by `h` CSS pixels */
  const mk = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); x.lineCap = "round"; x.lineJoin = "round"; fn(x); c.w2 = w; c.h2 = h; return c; };
  const S = {
    res: "dpr",
    wash: 1.6, veil: 1, // a light kit (scenes.js)
    clear: true, // it keeps to the empty part of the page, so the words need no pad
    carry: true, // what a pass draws stays up through the quiet after it, until the next pass rubs it out (b375)
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
      { const pm = pr ? 14 : 18, M = Math.max(2, Math.round(pm * px)), N = 2 * M + 2; S.padM = pm; S.padD = M; // the shade under the lines (b376)
        S.padSpr = K.paint(N, N, (x, y) => { const dx = Math.max(0, Math.abs(x + .5 - N / 2) - 1), dy = Math.max(0, Math.abs(y + .5 - N / 2) - 1), d = Math.min(1, Math.hypot(dx, dy) / M); return d >= 1 ? null : [248, 246, 241, Math.round(255 * (1 - d * d * (3 - 2 * d)))]; }); }
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
     *  granular texture, a lighter bloom, its edge a little off the pencil line as a brush's is (b375: `opt` may grade it
     *  from one colour at the top to another at the foot, and lift paper-white highlights out of it) */
    washOf(poly, col, a, seed, opt) {
      const RR = S.RR, rr = rng(seed), n = K.noise1(seed, 32);
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [u, v] of poly) { x0 = Math.min(x0, u); y0 = Math.min(y0, v); x1 = Math.max(x1, u); y1 = Math.max(y1, v); }
      const m = .03; x0 -= m; y0 -= m; x1 += m; y1 += m;
      const [c, x] = canvas(Math.ceil((x1 - x0) * RR * px), Math.ceil((y1 - y0) * RR * px)); x.imageSmoothingEnabled = true;
      x.setTransform(px * RR, 0, 0, px * RR, -x0 * RR * px, -y0 * RR * px);
      if (opt && opt.inR) { x.beginPath(); x.arc(0, 0, opt.inR, 0, TAU); x.clip(); } // kept inside the vignette
      const off = poly.map(([u, v], i) => [u + (n(i * .7) - .5) * .014, v + (n(i * .7 + 9) - .5) * .014]), path = new Path2D(); off.forEach(([u, v], i) => i ? path.lineTo(u, v) : path.moveTo(u, v)); path.closePath();
      x.lineJoin = "round"; x.strokeStyle = rgba(col, a * .22); x.lineWidth = 3 / RR; x.stroke(path); // a soft bleed past the edge
      if (opt && opt.grad) { const gr = x.createLinearGradient(0, y0, 0, y1); opt.grad.forEach(([f, c]) => gr.addColorStop(f, rgba(c, a))); x.fillStyle = gr; } else x.fillStyle = rgba(col, a); x.fill(path);
      x.save(); x.clip(path);
      x.strokeStyle = rgba(col, a * .55, .82); x.lineWidth = 4 / RR; x.stroke(path); x.strokeStyle = rgba(col, a * .5, .7); x.lineWidth = 1.5 / RR; x.stroke(path); // the edge where it dried darker
      const area = (x1 - x0) * (y1 - y0) * RR * RR; for (let k = 0; k < area / 16; k++) { x.fillStyle = rgba(col, .1 + rr() * .14, .72); const u = x0 + rr() * (x1 - x0), v = y0 + rr() * (y1 - y0), s2 = (.7 + rr()) / RR; x.fillRect(u, v, s2, s2); } // granulation
      x.globalCompositeOperation = "destination-out"; for (let k = 0; k < 2; k++) { const u = lerp(x0, x1, .3 + rr() * .4), v = lerp(y0, y1, .25 + rr() * .5), rad = (.05 + rr() * .06), gr = x.createRadialGradient(u, v, 0, u, v, rad); gr.addColorStop(0, "rgba(0,0,0,.28)"); gr.addColorStop(.8, "rgba(0,0,0,.16)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(u - rad, v - rad, rad * 2, rad * 2); } // a bloom where water crept back
      if (opt && opt.cut) for (const p of opt.cut) { const q = new Path2D(); p.forEach(([u, v], i) => i ? q.lineTo(u, v) : q.moveTo(u, v)); q.closePath(); x.fillStyle = "#000"; x.fill(q); x.globalCompositeOperation = "source-over"; x.strokeStyle = rgba(col, a * .5, .75); x.lineWidth = 2 / RR; x.stroke(q); x.globalCompositeOperation = "destination-out"; } // the paper the painter left white round a shape, the wash's edge darker along it
      if (opt && opt.lift) for (const [u, v, rx, ry, k] of opt.lift) { x.save(); x.translate(u, v); x.scale(1, ry / rx); const gr = x.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(.55, `rgba(0,0,0,${k * .8})`); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(-rx, -rx, rx * 2, rx * 2); x.restore(); } // the paper's white lifted out, for a glint
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
      S.subs = new Map(); S.plP = null; // the other subjects' caches are made again for the new size, as they're wanted
    },
    /** a subject as a pass draws it: its washes and its lines' caches, made for the drawing's size and kept while wanted */
    inst(pl) {
      if (!pl.id) { const key = "0:" + pl.pal + "@" + S.RR; let b2 = S.subs.get(key); if (!b2) { b2 = { ...B_INST, pal: pl.pal, washes: pl.pal ? S.washes.map((c, i) => i >= 3 && i <= 10 ? S.washOf(WASH[i][0], GPAL[pl.pal][i - 3], WASH[i][2], 101 + i * 17) : c) : null }; S.subs.set(key, b2); } return b2; }
      const key = pl.key + "@" + S.RR; let ins = S.subs.get(key);
      if (ins) return ins;
      const sub = SUBJECTS[pl.id](pl.pal), RR = S.RR, box = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [u, v] of pts) { x0 = Math.min(x0, u); y0 = Math.min(y0, v); x1 = Math.max(x1, u); y1 = Math.max(y1, v); } return [x0, y0, x1, y1]; };
      const r = rng(333 + pl.id * 71 + pl.pal * 7);
      ins = { sub, RR, key,
        washes: sub.parts.map((pt, k) => pt.washes.map((w, j) => { const c = S.washOf(w[0], w[1], w[2], 211 + pl.id * 97 + k * 31 + j * 17, w[6]); let far = 0; for (const [u, v] of w[0]) far = Math.max(far, Math.hypot(u - w[5][0], v - w[5][1])); c.reach = far * 1.12 + .02; c.nz = K.noise1(40 + j + k * 7, 16); return c; })),
        ink: sub.parts.map(pt => { if (!pt.strokes.length) return null; const [x0, y0, x1, y1] = box(pt.strokes.flatMap(s => s[0])), m = .05, [c] = canvas(Math.ceil((x1 - x0 + 2 * m) * RR * px), Math.ceil((y1 - y0 + 2 * m) * RR * px)); return { c, x0: x0 - m, y0: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m, key: null }; }),
        spr: sub.sprites ? sub.sprites(mk) : null,
        drops: sub.flicks.flatMap((t, f) => Array.from({ length: 5 }, () => { const a = r() * TAU, d = .5 + r() * .4; return { t: t + r() * .06, x: Math.cos(a) * d, y: Math.sin(a) * d * .9, s: .008 + r() * .016, c: sub.pal[(f + Math.floor(r() * 3)) % sub.pal.length] }; })),
        pen: sub.parts.flatMap((pt, k) => pt.strokes.map(s => [s[0], s[1], s[2], k])).concat((sub.birds || []).map(([bx, by, s], i) => [[[bx - s, by - s * .2], [bx, by], [bx + s, by - s * .2]], 6.16 + i * .08, 6.24 + i * .08, -1])).sort((a, b) => a[1] - b[1]).map(e => { const L = [0]; for (let i = 1; i < e[0].length; i++) L.push(L[i - 1] + Math.hypot(e[0][i][0] - e[0][i - 1][0], e[0][i][1] - e[0][i - 1][1])); return [...e, L]; }),
        brush: sub.parts.flatMap((pt, k) => pt.washes.map(w => { const [x0, y0, x1, y1] = box(w[0]); return [w[3], w[4], w[5], k, x1 - x0, y1 - y0]; })).sort((a, b) => a[0] - b[0]),
      };
      S.subs.set(key, ins); return ins;
    },
    /** how far along each thing of a subject is: `live`, the pass drawing it at T; else whole, as a pass left it */
    stOf(ins, live, T, I, A, F, fin, jit, fr) {
      const on = I > .01, pr = live ? (t0, t1) => seg(T, t0, t1, x => x) : () => 1, alive = live && on ? env(T, 9.0, 9.3, 12.6, 13.0) * I : 0;
      const inkKey = fr + ":" + (live && T < 6.5 ? Math.round(T * 30) : "all") + ":" + S.RR, finDrops = F >= 0 ? S.fin.map(d => ({ ...d, k: seg(F, d.t, d.t + .12, x => x), a: 1 - seg(F, .8, 1) })) : [];
      if (ins.balloon) return { A, jit, prog: pr, inkKey, w: WASH.map(([, , , t0, t1]) => pr(t0, t1)), wet: WASH.map(([, , , t0, t1]) => live && on ? env(T, t0, t0 + .1, t1 + .2, t1 + .9) * I : 0),
        cp: CSTROKES.map(([, t0, t1]) => pr(t0, t1)), ghost: [1, 1], ghostB: 1, cloud: [Math.sin(A * .12) * .03, Math.sin(A * .1 + 2) * .025], birds: live ? seg(T, 6.16, 6.4, x => x) : 1, fly: alive,
        lift: -(live && on ? env(T, 9.2, 10.6, 12.8, 14.4, E.io) * .06 * I : 0) - fin * .12 + Math.sin(A * .9) * .01, sway: Math.sin(A * .7) * .025 * (.35 + .65 * alive),
        flame: .15 + .1 * Math.sin(A * 5) * Math.sin(A * 3.3) + alive * .85 + fin,
        drops: [...S.drops.map(d => ({ ...d, k: live ? seg(T, d.t + .1, d.t + .25, x => x) : 1, a: 1 })), ...finDrops] };
      const sub = ins.sub;
      return { A, T, I, jit, fin, live, alive, prog: pr, inkKey,
        w: sub.parts.map(pt => pt.washes.map(w => pr(w[3], w[4]))), wet: sub.parts.map(pt => pt.washes.map(w => live && on ? env(T, w[3], w[3] + .1, w[4] + .2, w[4] + .9) * I : 0)),
        birds: live ? seg(T, 6.16, 6.4, x => x) : 1, fly: alive, drops: [...ins.drops.map(d => ({ ...d, k: live ? seg(T, d.t + .1, d.t + .25, x => x) : 1, a: 1 })), ...finDrops] };
    },
    /** one wash, the whole of it or as far as the brush has spread it from where it dropped the paint */
    washAt(x, c, at, p, A) {
      if (p >= 1) { x.drawImage(c, c.x0, c.y0, c.lw, c.lh); return; }
      const rad = p * c.reach; x.save(); x.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * TAU, rr = rad * (1 + .12 * (c.nz(k / 2.5 + A * 2) - .5)); x.lineTo(at[0] + Math.cos(a) * rr, at[1] + Math.sin(a) * rr); } x.clip(); x.drawImage(c, c.x0, c.y0, c.lw, c.lh); x.restore();
    },
    /** a subject drawn into context x, in the drawing's units: part by part, each turned by its pose, its washes under its
     *  lines; then the birds and the drops (or, `inkOnly`, just its lines: the ghost an eraser leaves) */
    pieceOf(ins, x, st, mirror, inkOnly) {
      const ga = x.globalAlpha;
      if (ins.balloon) { const key = "p" + st.inkKey; if (key !== S.inkKey) { const c = S.ink, x2 = c.getContext("2d"); x2.setTransform(1, 0, 0, 1, 0, 0); x2.clearRect(0, 0, c.width, c.height); x2.setTransform(px * S.RR, 0, 0, px * S.RR, 1.15 * S.RR * px, 1.15 * S.RR * px); x2.lineCap = "round"; x2.lineJoin = "round"; S.inkInto(x2, st.prog, st.jit, 1); S.inkKey = key; }
        st.inkC = S.ink; x.save(); if (mirror) x.scale(-1, 1); if (!inkOnly) { const keep = S.washes; if (ins.washes) S.washes = ins.washes; S.piece(x, st); S.washes = keep; } else { x.translate(0, st.lift); x.rotate(st.sway); x.drawImage(S.ink, -1.15, -1.15, 2.3, 2.3); } x.restore(); return; }
      const sub = ins.sub; x.save(); if (mirror) x.scale(-1, 1);
      sub.parts.forEach((pt, k) => {
        const ps = sub.pose ? sub.pose(st, k) : null; x.save();
        if (ps) { x.translate(pt.pivot[0] + ps[0], pt.pivot[1] + ps[1]); if (ps[2]) x.rotate(ps[2]); x.translate(-pt.pivot[0], -pt.pivot[1]); }
        if (!inkOnly && sub.live) sub.live(x, st, k, 0, ins);
        if (!inkOnly) pt.washes.forEach((w, j) => { const p = st.w[k][j]; if (p <= .001) return; S.washAt(x, ins.washes[k][j], w[5], p, st.A); const wet = st.wet[k][j]; if (wet > .01) { x.globalAlpha = ga * wet * .45; S.washAt(x, ins.washes[k][j], w[5], p, st.A); x.globalAlpha = ga; } });
        const ik = ins.ink[k]; if (ik) { if (ik.key !== st.inkKey) { const x2 = ik.c.getContext("2d"); x2.setTransform(1, 0, 0, 1, 0, 0); x2.clearRect(0, 0, ik.c.width, ik.c.height); x2.setTransform(px * ins.RR, 0, 0, px * ins.RR, -ik.x0 * px * ins.RR, -ik.y0 * px * ins.RR); x2.lineCap = "round"; x2.lineJoin = "round"; S.inkInto(x2, st.prog, st.jit, 1, pt.strokes); ik.key = st.inkKey; } x.drawImage(ik.c, ik.x0, ik.y0, ik.w, ik.h); }
        if (!inkOnly && sub.live) sub.live(x, st, k, 1, ins);
        x.restore(); x.globalAlpha = ga;
      });
      if (!inkOnly) {
        for (const [bx, by, s, ph] of sub.birds || []) { const v = st.birds; if (v <= 0) continue; const fly = st.fly, ox = fly * Math.sin(st.A * .9 + ph) * .1, oy = fly * Math.cos(st.A * 1.1 + ph) * .05 - fly * .04, flap = Math.sin(st.A * (3 + fly * 9) + ph) * (.35 + fly * .5);
          const cx2 = bx + ox, cy2 = by + oy, pts = [[cx2 - s, cy2 - s * (.2 + flap * .6)], [cx2 - s * .45, cy2 - s * (.45 + flap * .25)], [cx2, cy2], [cx2 + s * .45, cy2 - s * (.45 + flap * .25)], [cx2 + s, cy2 - s * (.2 + flap * .6)]];
          x.lineWidth = 1.2 / S.RR; x.strokeStyle = rgba(INK, .85); K.partial(x, pts.map(([u, w2]) => st.jit(u, w2)), v); }
        for (const d of st.drops) { if (d.k <= 0) continue; const s2 = d.s * E.back(clamp(d.k)); x.fillStyle = rgba(d.c, .55 * d.a); x.beginPath(); x.arc(d.x, d.y, s2, 0, TAU); x.fill(); x.strokeStyle = rgba(d.c, .5 * d.a, .72); x.lineWidth = .9 / S.RR; x.stroke(); }
      }
      x.restore();
    },
    /** where the pencil and the brush are at T, in the subject's own units (the pencil from 1.95 s, the brush from 6.4) */
    toolsAt(ins, T) {
      const out = { pen: null, brush: null };
      if (T > 1.95 && T < 6.5) { const pen = ins.pen; let at = null, lift = 0, k = -1;
        for (const [pts, t0, t1, kk, L] of pen) if (T >= t0 && T <= t1) { at = along(pts, L, (T - t0) / (t1 - t0)); k = kk; break; }
        if (!at) { let pv = null, nx = null; for (const s of pen) { if (s[2] <= T && (!pv || s[2] > pv[2])) pv = s; if (s[1] >= T && (!nx || s[1] < nx[1])) nx = s; } const pe = pv ? pv[0][pv[0].length - 1] : [.3, -.8], ns = nx ? nx[0][0] : pe, q = pv && nx ? clamp((T - pv[2]) / ((nx[1] - pv[2]) || 1)) : 1; at = [lerp(pe[0], ns[0], E.io(q)), lerp(pe[1], ns[1], E.io(q))]; lift = Math.sin(q * Math.PI); k = (nx || pv) ? (nx || pv)[3] : -1; }
        out.pen = { at, lift, k }; }
      if (T > 6.4 && T < 9.1) { const br = ins.brush; let at = null, lift = 0, k = -1;
        for (const [t0, t1, [u, v], kk, bw, bh] of br) if (T >= t0 - .08 && T <= t1) { const q = clamp((T - t0) / (t1 - t0)); at = [u + Math.sin(q * 6) * Math.min(bw * .3, .24), v + (q - .25) * Math.min(bh * .5, .32)]; k = kk; }
        if (!at) { let pv = null, nx = null; for (const s of br) { if (s[1] <= T && (!pv || s[1] > pv[1])) pv = s; if (s[0] >= T && (!nx || s[0] < nx[0])) nx = s; } const pe = pv ? [pv[2][0] + Math.sin(6) * Math.min(pv[4] * .3, .24), pv[2][1] + .75 * Math.min(pv[5] * .5, .32)] : [.4, -.2], ns = nx ? [nx[2][0], nx[2][1] - .25 * Math.min(nx[5] * .5, .32)] : pe, q = pv && nx ? clamp((T - pv[1]) / ((nx[0] - pv[1]) || 1)) : 1; at = [lerp(pe[0], ns[0], E.io(q)), lerp(pe[1], ns[1], E.io(q))]; lift = Math.sin(q * Math.PI); k = (nx || pv) ? (nx || pv)[3] : -1; }
        out.brush = { at, lift, k }; }
      return out;
    },
    /** where a point of a subject (in part k) is on the screen, turned as its part is */
    toScr(ins, st, mirror, k, u, v) {
      if (ins.balloon) return [S.cx + (mirror ? -u : u) * S.R, S.cy + (v + st.lift) * S.R];
      const pt = k >= 0 ? ins.sub.parts[k] : null, ps = pt && ins.sub.pose ? ins.sub.pose(st, k) : null;
      if (ps) { const [p0, p1] = pt.pivot, c = Math.cos(ps[2]), s = Math.sin(ps[2]), du = u - p0, dv = v - p1; u = p0 + ps[0] + du * c - dv * s; v = p1 + ps[1] + du * s + dv * c; }
      return [S.cx + (mirror ? -u : u) * S.R, S.cy + v * S.R];
    },
    /** the passes after the signature: the eraser takes off what the pass before left, the pencil and the brush make
     *  this pass's subject, and it has its moment; worked out from the pass and the time alone */
    drawPass(T, I, A, F, P) {
      const { W, H } = S, on = I > .01;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl; S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4)); if (S.vis < .01) return;
      if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) S.build();
      if (S.plP !== P) { const cur = planOf(P), prev = planOf(P - 1); S.pl = { cur, prev }; S.plP = P; for (const k of [...S.subs.keys()]) if (k !== cur.key + "@" + S.RR && k !== prev.key + "@" + S.RR) S.subs.delete(k); }
      const { cx, cy, R } = S, { cur, prev } = S.pl, iN = S.inst(cur), iO = S.inst(prev);
      const gone = on && T >= ER1, erasing = on && T > ER0 && T < ER1, fin = F >= 0 ? env(F, .05, .15, .55, .85, E.sine) : 0;
      const fr = Math.floor(A * 8), amp = (.35 + (on ? env(T, 9.0, 9.4, 12.4, 12.8) * .25 * I : 0)) / S.RR, jit = boil(fr, amp);
      const stO = S.stOf(iO, false, T, I, A, F, fin, jit, fr), stN = gone ? S.stOf(iN, true, T, I, A, F, fin, jit, fr) : null, tl = gone ? S.toolsAt(iN, T) : null;
      if (stN) stN.gaze = tl.brush ? tl.brush.at : tl.pen ? tl.pen.at : null; // where the tool is, for a subject that watches it
      const rot = ([u, v]) => { const c = Math.cos(cur.ang), s = Math.sin(cur.ang); return [u * c - v * s, u * s + v * c]; };
      if (!gone && !erasing) { g.save(); g.globalAlpha = S.vis; g.translate(cx, cy); g.scale(R, R); S.pieceOf(iO, g, stO, prev.mirror); g.restore(); }
      else if (erasing) { // the pass before's picture, drawn aside and rubbed out there, row after row
        const size = Math.ceil(2.3 * R * px); if (!S.comp || S.comp.width !== size) [S.comp] = canvas(size, size);
        const x = S.comp.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, size, size); x.setTransform(px * R, 0, 0, px * R, 1.15 * R * px, 1.15 * R * px); x.imageSmoothingEnabled = true; x.lineCap = "round"; x.lineJoin = "round";
        S.pieceOf(iO, x, stO, prev.mirror);
        const e = seg(T, ER0, ER1, x2 => x2), s = EL2[EL2.length - 1] * e; x.globalCompositeOperation = "destination-out"; x.strokeStyle = `rgba(0,0,0,${I.toFixed(3)})`; x.lineWidth = .46; x.beginPath(); let p0 = rot(EP2[0]); x.moveTo(p0[0], p0[1]); for (let i = 1; i < EP2.length && EL2[i - 1] < s; i++) { const f = clamp((s - EL2[i - 1]) / (EL2[i] - EL2[i - 1])), q = rot([lerp(EP2[i - 1][0], EP2[i][0], f), lerp(EP2[i - 1][1], EP2[i][1], f)]); x.lineTo(q[0], q[1]); } x.stroke(); x.globalCompositeOperation = "source-over";
        g.globalAlpha = S.vis; g.drawImage(S.comp, cx - 1.15 * R, cy - 1.15 * R, 2.3 * R, 2.3 * R); g.globalAlpha = 1;
      } else { // rubbed out: its ghost a while, and this pass's subject coming; a touch brings the old one back as it eases
        g.save(); g.translate(cx, cy); g.scale(R, R);
        if (I < .99) { g.globalAlpha = S.vis * (1 - I); S.pieceOf(iO, g, stO, prev.mirror); }
        if (T < 6.5) { g.globalAlpha = S.vis * .07 * I; S.pieceOf(iO, g, stO, prev.mirror, true); }
        g.globalAlpha = S.vis * I; S.pieceOf(iN, g, stN, cur.mirror);
        g.restore(); g.globalAlpha = 1;
      }
      // the eraser at work, its crumbs flying
      if (erasing || (on && T >= ER1 && T < ER1 + .9)) {
        const e = seg(T, ER0, ER1, x => x);
        for (const c of S.crumbs) { if (c.e > e) continue; const te = ER0 + c.e * (ER1 - ER0), dtc = T - te; if (dtc > .9) continue; const [u, v] = rot(along(EP2, EL2, c.e)), x = cx + (u + c.vx * dtc) * R, y = cy + (v + c.vy * dtc + .9 * dtc * dtc) * R; g.strokeStyle = rgba(c.c, (1 - dtc / .9) * .8 * I * S.vis); g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 2.2, c.rot, c.rot + 2.4); g.stroke(); }
        if (erasing) { const [u0, v0, a0] = along(EP2, EL2, e), sc = Math.sin(A * 34) * .09, [u, v] = rot([u0 - Math.sin(a0) * sc, v0 + Math.cos(a0) * sc]), rt = a0 + cur.ang + Math.sin(A * 24) * .12, spr = S.eraserS, sh = S.eraserSh, sx = cx + u * R, sy = cy + v * R;
          g.globalAlpha = I * S.vis; g.save(); g.translate(sx + 5, sy + 7); g.rotate(rt); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy); g.rotate(rt); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; }
      }
      const tool = (spr, sh, [sx, sy], lift, ang, a) => { g.globalAlpha = a * S.vis; g.save(); g.translate(sx + 6 + lift * 10, sy + 9 + lift * 14); g.rotate(ang); g.drawImage(sh, -sh.w2 * .06, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy - lift * 6); g.rotate(ang); g.drawImage(spr, 0, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; };
      const ta = S.toolAng || -.62;
      // the pencil while it draws, at the end of the line it's drawing, lifted between lines; the brush while it paints,
      // across each wash as the wet front spreads, flicking drops at the flicks
      if (tl && tl.pen) tool(S.pencil, S.pencilSh, S.toScr(iN, stN, cur.mirror, tl.pen.k, tl.pen.at[0], tl.pen.at[1]), tl.pen.lift, ta + tl.pen.lift * .06, I * env(T, 1.95, 2.05, 6.35, 6.5));
      if (tl && tl.brush) { const fl = (iN.balloon ? FLICKS : iN.sub.flicks).reduce((m, t) => Math.max(m, env(T, t - .06, t, t + .02, t + .14)), 0);
        tool(S.brush, S.brushSh, S.toScr(iN, stN, cur.mirror, tl.brush.k, tl.brush.at[0], tl.brush.at[1]), tl.brush.lift * .4, ta * 1.12 - Math.sign(ta) * fl * .5, I * env(T, 6.4, 6.5, 9.0, 9.1)); }
      // the finale: stars sketched in round it
      if (F >= 0) for (const s of S.stars) { const p = seg(F, s.t, s.t + .16, x => x); if (p <= 0) continue; const pts = Array.from({ length: 11 }, (_, k) => { const a = -Math.PI / 2 + k * TAU * 2 / 5, rr = s.s; return [s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr]; }); g.save(); g.translate(cx, cy); g.scale(R, R); g.lineWidth = 1.4 / R; g.strokeStyle = rgba([157, 119, 0], .9 * (1 - seg(F, .82, 1)) * S.vis); K.partial(g, pts.map(([u, v]) => jit(u, v)), p); g.restore(); }
    },
    /** the pencil lines, drawn into the cache for this boil frame and this much of the drawing */
    inkInto(x, prog, jit, ghost, list = STROKES) {
      const RR = S.RR, stroke = (pts, p, w, a) => {
        if (p <= 0 || pts.length < 2) return; const q = pts.map(([u, v]) => jit(u, v)), L = [0]; for (let i = 1; i < q.length; i++) L.push(L[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]));
        const end = L[L.length - 1] * clamp(p), path = (s0, s1, dx = 0, dy = 0) => { x.beginPath(); let started = false; for (let i = 1; i < q.length; i++) { const a0 = L[i - 1], a1 = L[i]; if (a1 < s0 || a0 > s1) continue; const f0 = clamp((s0 - a0) / ((a1 - a0) || 1)), f1 = clamp((s1 - a0) / ((a1 - a0) || 1)); if (!started) { x.moveTo(lerp(q[i - 1][0], q[i][0], f0) + dx, lerp(q[i - 1][1], q[i][1], f0) + dy); started = true; } x.lineTo(lerp(q[i - 1][0], q[i][0], f1) + dx, lerp(q[i - 1][1], q[i][1], f1) + dy); } x.stroke(); };
        const ws = clamp(RR / 150, .9, 1.45); w *= ws; for (const [f0, f1, wk, ak] of [[0, .14, .6, .75], [.12, .9, 1, 1], [.88, 1, .7, .85]]) { x.lineWidth = w * wk / RR; x.strokeStyle = rgba(INK, a * ak * ghost); path(end * f0, end * f1); }
        x.lineWidth = w * .7 / RR; x.strokeStyle = rgba(INK, a * .2 * ghost); path(0, end, .5 / RR, .35 / RR); // the graphite's second, fainter line
      };
      list.forEach(([pts, t0, t1, w, a], i) => stroke(pts, prog(t0, t1), w, a));
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
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass (b375) */
    draw(T, I, A, F, P = 0) { S.paint(T, I, A, F, P); S.shade(); },
    /** under each line's words, the paper (b376): whatever the scene has drawn there — the sketchbook's squares, the edge
     *  of a wash, a tool going by — is laid over with the kit's own ground, solid under the words and fading out round
     *  them, so a line (a struck line's grey most of all) reads as it does on the plain page; in every pass, and in use */
    shade() {
      const rs = S.raw, sp = S.padSpr; if (!rs || !rs.length || !sp) return;
      const m = S.padM, M = S.padD, e = 3; g.save(); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.fillStyle = "#F8F6F1";
      for (const [x0, y0, x1, y1, kind] of rs) { if (kind !== 1) continue; const a = x0 - e, b = y0 - e, w = x1 - x0 + 2 * e, h = y1 - y0 + 2 * e; if (w <= 0 || h <= 0 || b - m > S.H || b + h + m < 0) continue;
        g.fillRect(a, b, w, h); // under the words: the paper, solid
        g.drawImage(sp, 0, 0, M, M, a - m, b - m, m, m); g.drawImage(sp, M + 2, 0, M, M, a + w, b - m, m, m); g.drawImage(sp, 0, M + 2, M, M, a - m, b + h, m, m); g.drawImage(sp, M + 2, M + 2, M, M, a + w, b + h, m, m); // round it, fading: the corners,
        g.drawImage(sp, M, 0, 2, M, a, b - m, w, m); g.drawImage(sp, M, M + 2, 2, M, a, b + h, w, m); g.drawImage(sp, 0, M, M, 2, a - m, b, m, h); g.drawImage(sp, M + 2, M, M, 2, a + w, b, m, h); } // and the sides
      g.restore();
    },
    paint(T, I, A, F, P = 0) {
      if (P > 0) { S.drawPass(T, I, A, F, P); return; }
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
