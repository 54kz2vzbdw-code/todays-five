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
//
// 1.12 b416: the egg. Every twelfth pass (K.egg: three minutes of the list left alone), before anything else, the pencil
// doodles a little figure in the margin beside the drawing — a round head with a curl, a hatched body, stick arms and
// legs, a smile, its eyes last — and it blinks. It's alive: it looks one way and the other, looks up at the pencil and
// waves, and the pencil waggles back and goes. Then the eraser comes, as it always does, and rubs the drawing out, and
// the figure watches with its hands to its face, its face long, shaking — a doodle's Scream; the eraser turns on it and
// scrapes like a bull, the figure jumps out of its skin ("!"), and as the eraser charges it runs off the page, its legs a
// blur, the eraser after it, the line it stood on rubbed out behind it. The pass's subject is then drawn and painted as
// any pass's is, a little later and without its moment, so the pass ends on the very picture the next one starts from
// and nothing in the passes either side of it changes; and at the very end the figure leans back in from the edge it ran
// off, blinks at the new drawing, waggles its fingers, and is gone. It stands where the words leave room beside the
// drawing, on the side with a clear run to the page's edge.
//
// 1.12 b427: the long day's hour eggs. For a list left up for hours: once in each hour of the list left alone (K.long), in
// place of the pass it would have dealt, one of two little films, by turns. The first is Escher's Drawing Hands (1948):
// the eraser takes the drawing the pass before left, and the pencil draws a hand holding a pencil, its shirt cuff drawn
// flat, and jumps back as the hand comes to life, colour flooding into it; the hand draws a second cuff, a second hand
// grows out of it holding a pencil of its own, and the two draw each other, each going over the other's cuff; then each
// twirls its pencil round and rubs out the other's cuff, and each, its cuff gone, comes undone from the cuff out, their
// erasers the last of them. The second is a coffee ring: a mug's shadow comes down over the drawing and lifts away, leaving
// a ring that dries paler with its rim darker; the eraser takes the drawing but not the ring, scrubs at it and gives up;
// the pencil looks it over and makes it the big wheel of a penny-farthing, the brush paints its frame red, its bell rings
// twice and it rolls off the page. Either way the pencil comes back, a little unsure, and draws this pass's subject as any
// pass does, only quicker and without its moment, so the pass ends on the very picture the next one starts from.
//
// 1.12 b448: the crown. In the sixth hour of the list left alone and every sixth after (K.long 3), in place of the pass it
// would have dealt, a curtain call for the day's drawings. The eraser takes the drawing the pass before left, and the
// pencil, in a hurry, draws a little theatre — its arch, the valance along its top, two curtains in their folds, the stage
// and its footlights — and the brush paints it gold and crimson. The curtains open on the whole company of the day, every
// subject a pass draws, standing in two rows on the stage under a painted moon: the balloon, the lighthouse and the
// sailboat at the back, the humpback, the teapot, the hummingbird and the cat in front. The footlights come up; they bow one
// after another down the line, flowers are thrown up onto the stage, and they bow together. The curtains close, and the
// pencil, the brush and the eraser come out in front of them, one after another, and take a bow of their own. Then the
// eraser strikes the set, and the pencil draws this pass's subject as any pass does, only quicker and without its moment,
// so the pass ends on the very picture the next one starts from.
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
        const full = st.live ? st.I * seg(st.T, 10.35, 11.5) : st.redraw ? st.prog(8.26, 8.4) : 1; // the tea in the cup: poured in the moment, there at rest; and its steam (b416: in the egg's pass, with no moment, the brush lays it in last)
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

  /* ---------------- 1.12 b416: the egg ---------------- */
  /** its beats, in the pass's seconds: the pencil doodles the little figure (`draw`); it blinks, looks about, looks up at
   *  the pencil and waves (`wave`), the pencil waggling back; the pencil goes; the eraser rubs the drawing out (`erase`)
   *  while the figure watches, its hands to its face (`scream`); the eraser comes round at it (`aim`), scrapes like a bull
   *  (`scrape`), the figure jumps (`gulp`), and as it charges (`charge`) the figure runs off the page (`zip`); this pass's
   *  subject is then drawn and painted as any pass's is, `shift` seconds later and without its moment; and at the end
   *  the figure peeks back in from the edge it ran off (`peek`) */
  const EB = { draw: [.3, 1.55], blink: 1.85, wave: [2.7, 3.46], waggle: [2.92, 3.4], penOut: [3.42, 3.68], erase: [3.6, 5.0], scream: [3.82, 5.2], aim: [5.0, 5.24], scrape: [5.24, 5.6], gulp: 5.28, zip: [5.58, 5.88], charge: [5.6, 5.95], shift: 4.4, peek: [13.85, 14.8] };
  const EPE = []; [-.84, -.5, -.17, .17, .5, .84].forEach((y, i) => { const w = Math.min(1.02, Math.sqrt(Math.max(0, 1 - Math.min(1, (Math.abs(y) + .1) ** 2))) + .24), xs = i % 2 ? [w, -w] : [-w, w]; for (let k = 0; k <= 20; k++) EPE.push([lerp(xs[0], xs[1], k / 20), y + (k / 20 - .5) * .1]); });
  const EPEM = EPE.map(([u, v]) => [-u, v]), ELE = lens(EPE); // the egg's eraser rows: as wide as the circle is at each, ending low on the figure's side
  const way = (a, l) => [Math.sin(a) * l, Math.cos(a) * l]; // a limb's way: its angle from straight down, positive to the right
  const dotRing = (cx, cy, rx, ry = rx, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = i / n * TAU; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  /** the figure at rest, as the pencil leaves it: a round head, a little hatched body, arms a little out, smiling */
  const REST = () => ({ x: 0, y: 0, lean: 0, sq: 1, face: 0, look: [0, 0], open: 1, wide: 0, mouth: 0, grin: .45, aR: [.35, .15], aL: [-.35, -.15], kR: 1, kL: 1, lR: [.1, .04], lL: [-.1, -.04], wheel: 0, hair: 0, bang: 0, sweat: 0, wv: 0, shiver: 0, long: 0, show: 1 });
  /** how it stands at T: alive from the blink on; `sd` the side of the drawing it stands on and runs off toward (so it
   *  looks and waves toward -sd), `run` how far it is to that edge of the page, in its heights */
  const figPose = (T, A, sd, run) => {
    const m = -sd, p = REST(), to = (k, v, w) => { if (w <= 0) return; p[k] = Array.isArray(v) ? p[k].map((q, i) => lerp(q, v[i], w)) : lerp(p[k], v, w); }, near = sd > 0 ? "aL" : "aR";
    if (T < EB.draw[1] + .05) return p;
    if (T > EB.zip[1] + .03 && T < EB.peek[0]) { p.show = 0; return p; }
    if (T >= EB.peek[0]) { // back for a look: leaning in from past the edge, a blink, a smile and a wave of its fingers, and gone
      const k = env(T, EB.peek[0], EB.peek[0] + .28, EB.peek[1] - .26, EB.peek[1], E.io);
      p.x = sd * (run + .62 - .6 * k); p.lean = m * .62 * k; p.face = m * .8; p.look = [m * .9, .1]; p.grin = 1;
      p.open = 1 - env(T, 14.3, 14.34, 14.38, 14.44); to(near, [m * 1.4, m * (2.45 + .4 * Math.sin((T - EB.peek[0]) * TAU * 3))], k); p[sd > 0 ? "kL" : "kR"] = 1 + .4 * k; // out from its side and up, clear of its head p.wv = k * env(T, 14.05, 14.15, 14.5, 14.6);
      return p; }
    p.open = 1 - env(T, EB.blink, EB.blink + .05, EB.blink + .09, EB.blink + .15); // alive
    to("look", [sd * .9, .1], env(T, 2.04, 2.12, 2.22, 2.3, E.sine)); to("look", [m * .9, .1], env(T, 2.3, 2.38, 2.5, 2.58, E.sine)); // a look one way, and the other
    to("look", [m * .55, -.95], seg(T, 2.58, 2.68) * (1 - seg(T, 3.62, 3.72))); p.y -= .06 * env(T, 2.62, 2.67, 2.68, 2.8, E.out); // up at the pencil: it hops
    p.face = p.look[0] * .42;
    const wv = env(T, EB.wave[0], EB.wave[0] + .1, EB.wave[1] - .1, EB.wave[1], E.out), ph = Math.sin((T - EB.wave[0]) * TAU * 3.2); // a wave, the arm on the pencil's side
    to(near, [m * 2.45, m * (3.0 + .5 * ph)], wv); p[sd > 0 ? "kL" : "kR"] = 1 + .55 * wv; p.wv = wv; p.grin = lerp(p.grin, 1, wv); p.y -= .025 * Math.abs(Math.sin((T - EB.wave[0]) * TAU * 1.6)) * wv; p.lean = m * .07 * wv;
    to("look", [m * .3, -1], env(T, EB.penOut[0], EB.penOut[0] + .1, EB.penOut[1], EB.penOut[1] + .08)); // watching it go
    const tn = seg(T, 3.62, 3.74) * (1 - seg(T, 5.45, 5.52)); to("look", [m * .9, .08], tn); p.face = lerp(p.face, m * .45, tn); // round to the drawing as the eraser starts
    const sc = env(T, EB.scream[0], EB.scream[0] + .12, EB.scream[1] - .09, EB.scream[1], E.out); // the scream: its hands to its face, its face long
    to("aR", [2.4, 3.12], sc); to("aL", [-2.4, -3.12], sc); to("lR", [.03, -.22], sc); to("lL", [-.03, .22], sc); p.sq = lerp(1, .95, sc); p.x += Math.sin(A * 57) * .008 * sc; p.long = sc; p.shiver = sc; to("look", [m * .4, .1], sc);
    p.wide = env(T, EB.scream[0], EB.scream[0] + .08, EB.zip[1], EB.zip[1] + .02); p.mouth = T > EB.scream[0] && T < EB.scream[1] ? 1 : T >= EB.scream[1] && T < EB.zip[0] ? 2 : 0;
    p.sweat = env(T, 4.15, 4.3, 5.05, 5.2);
    p.bang = E.back(seg(T, EB.gulp, EB.gulp + .1, x => x)) * (1 - seg(T, EB.zip[0] + .02, EB.zip[0] + .1)); p.hair = env(T, EB.gulp, EB.gulp + .03, EB.zip[0], EB.zip[0] + .1); // "!"
    p.y -= .2 * env(T, EB.gulp, EB.gulp + .07, EB.gulp + .09, EB.gulp + .19, E.out); // it jumps
    const turn = seg(T, 5.45, 5.52); p.face = lerp(p.face, sd, turn); to("look", [sd, 0], turn); // round to its way out
    const wind = env(T, 5.47, 5.52, 5.55, EB.zip[0]); p.lean += -sd * .22 * wind; p.sq = lerp(p.sq, .86, wind);
    p.wheel = seg(T, 5.47, 5.55); to("aR", [sd * 1.3, sd * 2], wind); to("aL", [sd * 1.15, sd * 1.9], wind); // its legs a blur on the spot
    const z = seg(T, EB.zip[0], EB.zip[1], E.in); if (z > 0) { p.x = sd * (run + 1.3) * z; p.lean = sd * .42; p.sq = lerp(.86, 1, Math.min(1, z * 4)); to("aR", [-sd * 1.35, -sd * 1.8], 1); to("aL", [-sd * 1.1, -sd * 1.55], 1); }
    return p;
  };
  /** the figure's lines for a pose, in its own units (its height 1, its feet at the origin, y down): polylines, the dots of
   *  its eyes, and its parts by name (for the pencil, which draws it at rest) */
  const figLines = (p, A) => {
    const L = [], D = [], c = Math.cos(p.lean), s = Math.sin(p.lean), kx = 1 + (1 - p.sq) * .4, m = p.face < 0 ? -1 : 1, Hy = -.3;
    const at = q => [q[0] * kx + p.x, q[1] * p.sq + p.y]; // squashed about its feet, and moved
    const up = q => { const dx = q[0], dy = q[1] - Hy; return at([dx * c - dy * s, Hy + dx * s + dy * c]); }; // the body leans about its hips
    const ry = .19 * (1 + .24 * p.long), rx = .2 * (1 - .1 * p.long), hc = up([0, -.585 - ry]), tilt = q => [hc[0] + q[0] * c - q[1] * s, hc[1] + q[0] * s + q[1] * c];
    const head = dotRing(hc[0], hc[1], rx, ry, 26);
    const body = [[-.062, -.57], [.062, -.57], [.088, -.47], [.104, -.33], [.088, -.296], [-.088, -.296], [-.104, -.33], [-.088, -.47], [-.062, -.57]].map(up);
    const hatch = [[[.012, -.31], [.09, -.42]], [[.045, -.31], [.098, -.385]], [[-.02, -.31], [.078, -.455]]].map(l => l.map(up)); // shade down its right side, the light from the left
    const hair = p.hair > .5 ? [[[-.08, -.17], [-.11, -.3]], [[0, -.188], [.005, -.33]], [[.08, -.17], [.115, -.3]]].map(h => h.map(tilt)) : [[[.005, -.186], [-.022, -.245], [.03, -.29], [.085, -.262], [.072, -.212], [.03, -.226]].map(tilt)];
    const fx = hc[0] + p.face * .075, fy = hc[1] + .012, es = .075 * (1 - .3 * Math.abs(p.face)), eyes = [], my = fy + .068;
    for (const e of [-1, 1]) { const ex = fx + e * es, ey = fy - .02;
      if (p.wide > .5) { eyes.push(dotRing(ex, ey, .05, .056, 12)); D.push([ex + p.look[0] * .022, ey + p.look[1] * .022, .021]); }
      else if (p.open < .45) eyes.push([[ex - .03, ey + .006], [ex, ey + .012], [ex + .03, ey + .006]]);
      else D.push([ex + p.look[0] * .02, ey + p.look[1] * .016, .029]); }
    const blush = p.wide > .5 ? [] : [-1, 1].flatMap(e => [0, 1].map(k => { const bx = fx + e * (es + .045) + k * .026 - .013, by = fy + .035; return [[bx - .009, by + .014], [bx + .009, by - .012]]; }));
    const mouth = p.mouth > 1.5 ? Array.from({ length: 7 }, (_, i) => [fx - .05 + i * .0167, my + .012 + (i % 2 ? -.012 : .008)]) : p.mouth > .5 ? dotRing(fx, my + .02 + .03 * p.long, .03, .046 * (1 + .3 * p.long), 12) : Array.from({ length: 7 }, (_, i) => { const t = i / 6; return [fx - .052 + .104 * t, my - .006 + Math.sin(t * Math.PI) * (.014 + .036 * p.grin)]; });
    const shR = up([.072, -.535]), shL = up([-.072, -.535]);
    const arms = [[p.aR, shR, p.kR], [p.aL, shL, p.kL]].map(([a, sh, k]) => { const e = [sh[0] + way(a[0], .135 * k)[0], sh[1] + way(a[0], .135 * k)[1]]; return [sh, e, [e[0] + way(a[1], .125 * k)[0], e[1] + way(a[1], .125 * k)[1]]]; });
    const hands = arms.map(a => dotRing(a[2][0], a[2][1], .03, .03, 10));
    let legs = [], feet = [], wheel = null;
    if (p.wheel > .5) { const o = at([0, -.15]), ph = A * 34; wheel = [0, 1].map(j => Array.from({ length: 31 }, (_, i) => { const a = ph + j * 2.6 + i / 30 * TAU * 1.08, r = .15 + .028 * Math.sin(i * 1.9 + j * 3); return [o[0] + Math.cos(a) * r, o[1] + Math.sin(a) * r * .8]; })); }
    else { legs = [[p.lR, .055], [p.lL, -.055]].map(([a, ox]) => { const h = at([ox, Hy]), k = [h[0] + way(a[0], .155)[0], h[1] + way(a[0], .155)[1]]; return [h, k, [k[0] + way(a[1], .15)[0], k[1] + way(a[1], .15)[1]]]; });
      feet = legs.map((l, i) => { const f = l[2], d = Math.abs(p.face) > .5 ? m : i ? -1 : 1; return [f, [f[0] + d * .07, f[1] + .004]]; }); }
    L.push(head, ...hair, body, ...hatch, ...arms, ...hands, ...legs, ...feet, mouth, ...eyes, ...blush); if (wheel) L.push(...wheel);
    if (p.wv > .05) { const h = arms[m > 0 ? 0 : 1][2]; for (const [r, a0, a1] of [[.08, -.9, .2], [.125, -.8, .1]]) { const pts = Array.from({ length: 6 }, (_, i) => { const a = lerp(a0, a1, i / 5); return [h[0] + m * Math.cos(a) * r, h[1] + Math.sin(a) * r]; }); L.push(pts); } } // wave lines by its hand
    if (p.shiver > .05) for (const e of [-1, 1]) for (const yy of [-.5, -.34]) { const b = up([e * .19, yy]), j = Math.sin(A * 40 + yy * 9) * .008; L.push([[b[0] + j, b[1] - .05], [b[0] + e * .02 - j, b[1] - .017], [b[0] + j, b[1] + .017], [b[0] + e * .02 - j, b[1] + .05]]); } // shaking
    if (p.bang > .01) { const b = p.bang, bx = hc[0] - m * .03, by = hc[1] - ry - .2; L.push([[bx, by - .2 * b], [bx + .008, by - .03 * b]], [[bx - .012, by - .2 * b], [bx + .012, by - .2 * b]]); D.push([bx + .008, by + .04 * b, .026 * b]); } // "!"
    if (p.sweat > .01) { const sx = hc[0] + (rx + .05) * (p.face < 0 ? 1 : -1), sy = hc[1] - .06 + (1 - p.sweat) * .05; L.push([[sx, sy - .06], [sx - .026, sy + .008], [sx, sy + .036], [sx + .026, sy + .008], [sx, sy - .06]]); }
    return { L, D, parts: { head, hair, body, hatch, arms, hands, legs, feet, mouth, blush } };
  };
  /** the order the pencil draws it in, and when: the head, its curl, the body and its shading, the arms and hands, the
   *  legs and feet, the smile, the eyes last and its blush; then the line it stands on (laid out once, in its own units) */
  const FIG_PEN = (() => { const { parts: q } = figLines(REST(), 0), hc = [0, -.775], eyes = [-1, 1].map(e => dotRing(e * .075, hc[1] + .012 - .02, .029, .029, 8));
    const list = [[q.head], [q.hair[0]], [q.body], q.hatch, [q.arms[1], q.hands[1]], [q.arms[0], q.hands[0]], [q.legs[1], q.feet[1]], [q.legs[0], q.feet[0]], [q.mouth], [eyes[0]], [eyes[1]], q.blush, [[[-.5, .012], [.52, .012]]]].flat().map(pts => [pts, 0, 0]);
    pace(list, EB.draw[0], EB.draw[1], .025); return list.map(e => [...e, lens(e[0]), eyes.includes(e[0]) ? [e[0][0][0] - .029, e[0][0][1]] : null]); })(); // (an eye is filled in once it's drawn round)

  /* ---------------- 1.12 b427: the long day's hour eggs ---------------- */
  /** a path's points in the box the hands are drawn in (the 200-box's own numbers, not the drawing's units) */
  const svd = (d, step = 1.5) => sv(d, step).map(([u, v]) => [u * 100 + 100, v * 100 + 100]);
  /** The hand, drawn once in its own box: a right hand seen from the thumb side, pointing right, holding a pencil that
   *  points down to the right; its shirt cuff drawn flat, the way Escher drew his (1948). Each line knows what it is
   *  (`ph`: the cuff, the hand's contours, its details) and runs from the wrist outward, so a hand can grow out of its cuff. */
  const HD = (() => {
    const L = [], ln = (ph, d, w, a) => L.push({ ph, pts: svd(d), w, a }), WC = [41, 64.5], c30 = Math.cos(Math.PI / 6), s30 = Math.sin(Math.PI / 6);
    const turn = (x, y, k = 1) => [WC[0] + (x - WC[0]) * c30 - (y - WC[1]) * s30 * k, WC[1] + (x - WC[0]) * s30 * k + (y - WC[1]) * c30]; // the cuff, its forearm coming in from above, a sixth of a turn
    const cf = d => d.replace(/(-?[\d.]+)[ ,]+(-?[\d.]+)/g, (m, a, b) => turn(+a, +b).map(v => v.toFixed(2)).join(" "));
    ln("cuff", cf("M 38 85.5 C 44.5 79, 43.5 49, 38 42.5"), 1.3, .9); ln("cuff", cf("M 38 42.5 L 6 44"), 1.3, .9); ln("cuff", cf("M 31.5 43 C 36 51, 36 77.5, 31.5 85.8"), .8, .6); ln("cuff", cf("M 38 85.5 L 6 87"), 1.3, .9);
    ln("cuff", cf("M 21 64.5 C 21 62.9, 23.6 62.9, 23.6 64.5 C 23.6 66.1, 21 66.1, 21 64.5"), .9, .8); ln("cuff", cf("M 6 44 L -4 43.3"), .9, .45); ln("cuff", cf("M 6 87 L -4 88"), .9, .45);
    ln("hand", "M 48.5 47 C 56 46.2, 66 45.5, 76 45 C 79 44.8, 81.5 44.7, 83.3 44.7", 1.4, .92); ln("hand", "M 89.2 44.8 C 89.8 44.8, 90.4 44.9, 91 45", 1.4, .92);
    ln("hand", "M 91 45 C 97 43.5, 103 43.5, 107.5 45 C 111 46, 113.5 49, 115.5 53.5 C 117.5 58, 119.5 61.5, 121 65.5 C 122.5 69.5, 122.8 73.5, 121 75.8 C 119.6 77.5, 117 77.3, 115.6 75.6", 1.4, .92); // the index, over the pencil
    ln("hand", "M 106.5 58 C 107 61, 108 63.5, 109.5 66 C 111.5 69, 113.5 72.5, 115.6 75.6", 1.1, .85);
    ln("hand", "M 47 85 C 51 84.4, 55 83.8, 59 83.2 C 66 82, 72 80.3, 79 78.5 C 85 77, 91 76.8, 97.5 77.3 C 101.5 77.7, 105 77.6, 107 76.3 C 109 74.8, 109 72, 107.5 70 C 105.5 67.5, 102.5 65.5, 99 63.5 C 95 61, 90 58.5, 84 57", 1.4, .92); // the thumb, pressing the pencil from this side
    ln("hand", "M 106.5 79 C 110.5 82, 114.5 83.6, 118 83.8 C 120.2 83.9, 121.2 82.6, 120.6 80.6", 1.25, .88); // the middle finger, under the pencil
    ln("hand", "M 29.5 81 C 36 84.5, 46 86, 56 86 C 64 86.2, 71 87.5, 78 89.5 C 84 91.5, 89 94.5, 94.5 95.2 C 99 97.8, 106 97, 109.5 93.8 C 115.5 93.5, 120.5 90, 121.5 85", 1.35, .9); // the ring and little fingers, curled under
    ln("det", "M 60 51.5 C 68 50.5, 76 50, 85 49.5", .5, .3); ln("det", "M 84.5 45 C 86.5 46.5, 87 48, 86 49.5", .6, .45);
    ln("det", "M 120.5 68 C 121.6 70.5, 121.5 73.2, 120 75", .8, .7); ln("det", "M 113 48.5 C 113.8 51, 113 53, 111.2 54", .6, .45); ln("det", "M 118.5 60.5 C 119.6 62, 119.2 63.6, 117.8 64.2", .55, .4);
    ln("det", "M 99.5 64 C 103 65.4, 106 67.6, 107.3 70.6", .8, .7); ln("det", "M 95.5 61.5 C 97 63.8, 96.8 66.2, 95.2 68", .55, .4); ln("det", "M 79 78.5 C 76 75.8, 75.5 72, 77.5 68.5", .6, .45);
    ln("det", "M 103 92.8 C 105 92, 107.5 92.3, 109.5 93.8", .6, .4); ln("det", "M 89.2 92.4 C 91.5 92.2, 93.5 93.2, 94.5 95.2", .6, .4);
    const SIL = "M 48.5 47 C 56 46.2, 66 45.5, 76 45 C 82 44.6, 87 44.6, 91 45 C 97 43.5, 103 43.5, 107.5 45 C 111 46, 113.5 49, 115.5 53.5 C 117.5 58, 119.5 61.5, 121 65.5 C 122.5 69.5, 122.8 73.5, 121 75.8 C 120.3 78, 120.8 79.5, 120.6 80.6 C 121.5 82.5, 121.8 83.8, 121.5 85 C 120.5 90, 115.5 93.5, 109.5 93.8 C 106 97, 99 97.8, 94.5 95.2 C 89 94.5, 84 91.5, 78 89.5 C 71 87.5, 64 86.2, 56 86 C 46 86, 36 84.5, 29.5 81 C 36 76, 44 62, 48.5 47 Z";
    const shade = (x, y) => (y - 64) > .2 * (x - 40) + 12 || (x > 117 && y < 80 && y > 58) || (x > 104 && y > 77); // the palm's side and the fingers' undersides
    for (const h of hatchIn(sv(SIL, 2), 1.15, .028, (u, v) => shade(u * 100 + 100, v * 100 + 100))) L.push({ ph: "hat", pts: h.map(([u, v]) => [u * 100 + 100, v * 100 + 100]), w: .6, a: .32 });
    const CUFF = cf("M 6 44 L 38 42.5 C 43.5 49, 44.5 79, 38 85.5 L 6 87 Z"), cuffHat = hatchIn(sv(CUFF, 2), Math.PI * 2 / 3, .028, (u, v) => { const [x, y] = turn(u * 100 + 100, v * 100 + 100, -1); return x > 27 && y > 57; }).map(h => h.map(([u, v]) => [u * 100 + 100, v * 100 + 100])); // the shading the other hand adds, along its rim
    const G = [svd("M 1 43 C 30 60, 98 58, 137.5 121", 4), Array.from({ length: 41 }, (_, i) => { const a = -2.7 + i / 40 * 6.6; return [87 + Math.cos(a) * 35, 70 + Math.sin(a) * 27]; })]; // the gesture first: the arm's line, the hand's mass
    return { L, G, SIL: svd(SIL, 2), cuffHat, X: [111.5, 76], ang: Math.PI / 3, hw: 3.1, W: [41, 64.5], tip: [137.5, 121.03], Q: [35.5, 77] };
  })();
  /** the hand's pencil in its box, its lines and its paint ([polygon, colour, strength]): as the pencil draws it, in the
   *  pieces the fingers leave showing (0); whole (2), to be slid through the fingers behind a mask of them; and whole and
   *  turned end for end about its middle (3), the eraser where the point was */
  const PEN = flip => {
    const { X, ang, hw } = HD, u = [Math.cos(ang), Math.sin(ang)], n = [-u[1], u[0]], at = (s, o = 0) => [X[0] + u[0] * s + n[0] * o, X[1] + u[1] * s + n[1] * o];
    const L = [], W = [], line = (...ps) => L.push({ ph: "pen", pts: ps.flatMap((p, i) => i ? Array.from({ length: 6 }, (_, k) => [lerp(ps[i - 1][0], p[0], (k + 1) / 6), lerp(ps[i - 1][1], p[1], (k + 1) / 6)]) : [p]), w: 1.05, a: .9 });
    const thin = (w, a, ...ps) => { line(...ps); Object.assign(L[L.length - 1], { w, a }); }, quad = (s0, s1, col, a, o0 = hw, o1 = hw) => W.push([[at(s0, -o0), at(s1, -o1), at(s1, o1), at(s0, o0)], col, a]);
    const PAINT = [244, 190, 40], WOOD = [222, 180, 130], LEAD = [60, 60, 70], TIN = [170, 172, 182], RUB = [238, 140, 146];
    if (flip === 2) { // whole, as it twirls out of the fingers and round
      line(at(-54.5, -hw), at(39.5, -hw), at(48.5, -.8), at(52, 0)); line(at(-54.5, hw), at(39.5, hw), at(48.5, .8), at(52, 0)); line(at(-54.5, -hw), at(-66, -hw), at(-66, hw), at(-54.5, hw)); thin(.7, .7, at(-58.5, -hw), at(-58.5, hw)); thin(.7, .7, at(-54.5, -hw), at(-54.5, hw));
      quad(-54.5, 39.5, PAINT, .72); quad(39.5, 48.5, WOOD, .6, hw, .8); quad(48.5, 52, LEAD, .8, .8, .01); quad(-61.5, -54.5, TIN, .6); quad(-66, -61.5, RUB, .7);
    } else if (!flip) { // the eraser up at the back, the point down at the paper
      line(at(-20.5, -hw), at(-66, -hw)); line(at(-15.5, hw), at(-66, hw)); line(at(-66, -hw), at(-66, hw)); thin(.7, .7, at(-58.5, -hw), at(-58.5, hw)); thin(.7, .7, at(-55, -hw), at(-55, hw)); thin(.55, .5, at(-61.5, -hw), at(-61.5, hw)); thin(.55, .45, at(-30, 0), at(-54, 0));
      line(at(2.5, hw), at(39.5, hw)); line(at(1.5, -hw), at(39.5, -hw)); thin(.55, .45, at(4, 0), at(39.5, 0)); line(at(39.5, -hw), at(48.5, -.8), at(52, 0)); line(at(39.5, hw), at(48.5, .8), at(52, 0));
      thin(.75, .7, at(39.5, -hw), at(41.1, -1.5), at(39.5, 0), at(41.1, 1.5), at(39.5, hw)); thin(.6, .6, at(48.5, -.8), at(48.5, .8));
      quad(-54.5, -18, PAINT, .72); quad(2, 39.5, PAINT, .72); quad(39.5, 48.5, WOOD, .6, hw, .8); quad(48.5, 52, LEAD, .8, .8, .01); quad(-61.5, -54.5, TIN, .6); quad(-66, -61.5, RUB, .7);
    } else if (flip === 3) { // whole and turned end for end about its middle: the point up at the back, the eraser down at the paper
      line(at(40.5, -hw), at(-53.5, -hw), at(-62.5, -.8), at(-66, 0)); line(at(40.5, hw), at(-53.5, hw), at(-62.5, .8), at(-66, 0)); thin(.75, .7, at(-53.5, -hw), at(-55.1, -1.5), at(-53.5, 0), at(-55.1, 1.5), at(-53.5, hw)); thin(.6, .6, at(-62.5, -.8), at(-62.5, .8));
      line(at(40.5, -hw), at(52, -hw), at(52.9, 0), at(52, hw), at(40.5, hw)); thin(.7, .7, at(44.5, -hw), at(44.5, hw)); thin(.7, .7, at(40.5, -hw), at(40.5, hw)); thin(.55, .5, at(47.5, -hw), at(47.5, hw)); thin(.55, .45, at(-30, 0), at(-53.5, 0));
      quad(-53.5, 40.5, PAINT, .72); quad(-62.5, -53.5, WOOD, .6, .8, hw); quad(-66, -62.5, LEAD, .8, .01, .8); quad(40.5, 47.5, TIN, .6); quad(47.5, 52.5, RUB, .7);
    }
    return { L, W };
  };
  /** Hour egg 1, its beats in the pass's seconds: the eraser takes the drawing the pass before left (`erase`); the pencil
   *  draws hand A — a gesture (`guide`), its cuff, its contours, its details, its pencil, its shading — and lifts away
   *  (`penOut`); the hand comes alive, its colour flooding in (`liveA`); it draws hand B's cuff (`cuffB`), and B grows out
   *  of it (`growB`) and comes alive (`liveB`); each draws the other (`loop`); each twirls its pencil (`twirl`) and rubs
   *  out the other's cuff, and each, its cuff gone, comes undone (`scrub`); the pencil comes back (`back`) and from `sub`
   *  draws this pass's subject as any pass does, a little quicker, so the pass ends on the picture the next one starts from */
  const HK = .0085; // the hands' box to the drawing's units
  const HB = { erase: [.3, 1.4], guide: [1.48, 1.66], cuff: [1.68, 2.08], hand: [2.1, 2.98], det: [2.98, 3.22], pen: [3.24, 3.5], hat: [3.5, 3.72], penOut: [3.62, 3.98], liveA: [3.72, 4.22], cuffB: [4.24, 5.04], growB: [5.04, 5.66], liveB: [5.56, 6.04], loop: [6.06, 7.86], twirl: [7.86, 8.16], scrub: [8.18, 8.98], back: [8.86, 9.2], sub: 9.2 };
  /** the pair, set down in the drawing's units: hand A as drawn, hand B turned half round about the drawing's centre, so
   *  each one's pencil point rests on the other's cuff; their lines timed for the pencil (A), for A's pencil (B's cuff, and
   *  the shading A adds to it), for growing (B's hand), and for B's pencil going over A's cuff; their washes as polygons */
  const PAIR = (() => {
    const M = [(HD.tip[0] + HD.Q[0]) / 2, (HD.tip[1] + HD.Q[1]) / 2], k = HK, to = ([x, y]) => [(x - M[0]) * k, (y - M[1]) * k];
    const P0 = PEN(0), P2 = PEN(2), P3 = PEN(3), occ = (() => { const { X, ang, hw } = HD, at = (sl, o) => [X[0] + Math.cos(ang) * sl - Math.sin(ang) * o, X[1] + Math.sin(ang) * sl + Math.cos(ang) * o]; return [at(-20.5, -hw - 1.4), at(-15.5, hw + 1.4), at(2.5, hw + 1.4), at(1.5, -hw - 1.4)]; })(); // where the fingers hide the pencil
    const hands = [1, -1].map(sg => { const m = p => { const q = to(p); return [q[0] * sg, q[1] * sg]; }, mk = l => [l.pts.map(m), 0, 0, l.w, l.a, l.ph];
      const pen = P0.L.map(mk), penF = P3.L.map(mk), penW = P2.L.map(mk);
      return { sg, m, W: m(HD.W), ax: [sg, 0], pu: [Math.cos(HD.ang) * sg, Math.sin(HD.ang) * sg], tip: m(HD.tip), mid: m([HD.X[0] + Math.cos(HD.ang) * -7, HD.X[1] + Math.sin(HD.ang) * -7]),
        cuff: HD.L.filter(l => l.ph === "cuff").map(mk), body: HD.L.filter(l => l.ph !== "cuff").map(mk), pen, penF, penW, skin: HD.SIL.map(m), gest: HD.G.map(p => [p.map(m), 0, 0, .7, .2, "guide"]),
        paint: P0.W.map(([p, c, a]) => [p.map(m), c, a]), paintF: P3.W.map(([p, c, a]) => [p.map(m), c, a]), paintW: P2.W.map(([p, c, a]) => [p.map(m), c, a]), occ: occ.map(m), cuffHat: HD.cuffHat.slice(0, 7).map(h => [h.map(m), 0, 0, .7, .45, "hat"]) }; });
    const [A, B] = hands, bySpan = (list, t0, t1, gap) => { pace(list, t0, t1, gap); return list; };
    // the pencil draws hand A: a gesture, then the cuff, the contours, the details, the pencil, the shading
    const gest = A.gest; bySpan(gest, HB.guide[0], HB.guide[1], .02); bySpan(A.cuff, HB.cuff[0], HB.cuff[1], .02); bySpan(A.body.filter(s => s[5] === "hand"), HB.hand[0], HB.hand[1], .03);
    bySpan(A.body.filter(s => s[5] === "det"), HB.det[0], HB.det[1], .01); bySpan(A.pen, HB.pen[0], HB.pen[1], .008); bySpan(A.body.filter(s => s[5] === "hat"), HB.hat[0], HB.hat[1], .003);
    A.drawn = [...gest, ...A.cuff, ...A.body, ...A.pen].sort((a, b) => a[1] - b[1]).map(e => [...e, lens(e[0])]); // the pencil's own path over A
    // A's pencil draws B's cuff — its rim and its seam, the rest drawing itself out from them — and B grows out of it, from
    // its wrist outward; then each goes over the other's cuff, B A's rim and seam, and each shades the other's near its rim
    const [bRim, bTop, bSeam, bBot, bBtn, bT1, bT2] = B.cuff, c0 = HB.cuffB[0];
    [[bRim, 0, .3], [bBot, .04, .36], [bTop, .3, .6], [bSeam, .4, .64], [bT2, .36, .48], [bT1, .6, .7], [bBtn, .64, .76]].forEach(([s, a, b]) => { s[1] = c0 + a; s[2] = c0 + b; });
    const reach = s => Math.hypot(s[0][0][0] - B.W[0], s[0][0][1] - B.W[1]), far = Math.max(...[...B.body, ...B.pen].map(reach));
    for (const s of [...B.body.filter(s => s[5] !== "hat"), ...B.pen]) { const f = reach(s) / far, [a, k, d] = s[5] === "hand" ? [0, .22, .26] : s[5] === "det" ? [.22, .1, .12] : [.26, .12, .16]; s[1] = HB.growB[0] + a + f * k; s[2] = s[1] + d; } // its contours first, then its details and its pencil
    B.body.filter(s => s[5] === "hat").forEach((s, i, a) => { s[1] = HB.growB[0] + .44 + i / a.length * .14; s[2] = s[1] + .05; });
    const l0 = HB.loop[0] + .1, l1 = HB.loop[1] - .1;
    A.retrace = [A.cuff[0], A.cuff[2]].map(s => [s[0], 0, 0, s[3] * 1.15, Math.min(1, s[4] * 1.1), "re"]); bySpan(A.retrace, l0, l0 + .7, .08); bySpan(A.cuffHat, l0 + .85, l1, .06);
    bySpan(B.cuffHat, l0 + .05, l1 - .1, .07);
    const withL = list => list.map(e => [...e, lens(e[0])]);
    A.job = withL([bRim, bSeam, ...B.cuffHat]); B.job = withL([...A.retrace, ...A.cuffHat]); // where each one's pencil goes
    A.marks = [...A.retrace, ...A.cuffHat]; B.marks = B.cuffHat; // what the other hand adds to each one's cuff
    // the scrub: back and forth across the other's cuff by its rim, the eraser end leading
    for (const [me, other] of [[A, B], [B, A]]) { const c = other.m([37.5, 70]), o = other.m([44, 59]), ax = [(c[0] - o[0]), (c[1] - o[1])], w = other.m([44, 74]), along2 = [(w[0] - c[0]), (w[1] - c[1])];
      me.rub = Array.from({ length: 41 }, (_, i) => { const f = i / 40, z = Math.sin(f * Math.PI * 9) * .95; return [c[0] + ax[0] * z + along2[0] * (f - .5) * 1.4, c[1] + ax[1] * z + along2[1] * (f - .5) * 1.4]; }); me.rubL = lens(me.rub); }
    return { A, B, hands };
  })();
  /** where a pencil is along a job (a list of timed lines) at T, and how far it's lifted: on the line it's drawing, in the
   *  air between two, gliding in from `rest` just before the first, and staying where the last one left it */
  const penAt = (job, T, rest, lead = .22) => {
    for (const [pts, t0, t1, , , , L] of job) if (T >= t0 && T <= t1) { const [u, v] = along(pts, L, (T - t0) / ((t1 - t0) || 1)); return [u, v, 0]; }
    let pv = null, nx = null; for (const s of job) { if (s[2] <= T && (!pv || s[2] > pv[2])) pv = s; if (s[1] >= T && (!nx || s[1] < nx[1])) nx = s; }
    const a = pv ? pv[0][pv[0].length - 1] : rest, b = nx ? nx[0][0] : a, t0 = pv ? pv[2] : nx ? nx[1] - lead : T, t1 = nx ? nx[1] : t0 + 1, q = clamp((T - t0) / ((t1 - t0) || 1));
    return [lerp(a[0], b[0], E.io(q)), lerp(a[1], b[1], E.io(q)), nx ? Math.sin(q * Math.PI) : 0];
  };
  /** a hand's pose that puts its pencil's point (or, flipped, its eraser) on `at`: the hand turned at its wrist (θ), and
   *  the pencil slid a little through its fingers along its own length (σ); the cuff stays where it was drawn */
  const reachTo = (h, at, tipNow) => { const v0 = [tipNow[0] - h.W[0], tipNow[1] - h.W[1]], d = Math.hypot(at[0] - h.W[0], at[1] - h.W[1]), b = v0[0] * h.pu[0] + v0[1] * h.pu[1], c = v0[0] * v0[0] + v0[1] * v0[1] - d * d, sl = clamp(-b + Math.sqrt(Math.max(0, b * b - c)), -.18, .18), v = [v0[0] + h.pu[0] * sl, v0[1] + h.pu[1] * sl];
    return { th: Math.atan2(at[1] - h.W[1], at[0] - h.W[0]) - Math.atan2(v[1], v[0]), sl }; };
  /** Hour egg 2, its beats in the pass's seconds: a mug's shadow comes down over the drawing the pass before left
   *  (`down`), sits (`sit`) and lifts away (`lift`), leaving a coffee ring that dries (`dry`), darkest at its rim (the
   *  coffee-ring effect); the eraser takes the drawing (`erase`) but not the ring, scrubs at the ring (`rub`) and gives up
   *  (`sulk`); the pencil looks it over (`circle`) and makes it the big wheel of a penny-farthing (`bike`), the brush
   *  paints its frame (`paint`), its bell rings (`ding`) and it rolls off the page (`roll`); the pencil turns back
   *  (`back`) and from `sub` draws this pass's subject */
  const RB = { down: [.3, 1.5], sit: [1.5, 1.95], lift: [1.95, 2.55], dry: [2.5, 3.4], erase: [2.6, 3.7], rub: [3.74, 4.3], sulk: [4.3, 4.64], circle: [4.64, 5.06], bike: [5.08, 6.7], paint: [6.84, 7.22], ding: [7.24, 7.66], roll: [7.7, 8.85], back: [8.7, 9.0], sub: 9.0 };
  /** the penny-farthing, in the drawing's units about its big wheel's hub (the ring is that wheel, radius RH), facing +x:
   *  its lines in the order the pencil draws them, each knowing what it turns with (`big`, `small`, `crank`) or not (`frame`) */
  const RH = .34, RS = RH / 3.2;
  const BIKE = (() => {
    const L = [], ln = (part, pts, w = 1.1, a = .9) => L.push([pts, 0, 0, w, a, part]);
    const arc = (cx, cy, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
    const bz = (p0, p1, p2, p3, n = 20) => Array.from({ length: n + 1 }, (_, i) => bez(p0, p1, p2, p3, i / n));
    const H = [-.05, -RH - .1], SM = [-RH * 1.55, RH - RS], BACK = bz(H, [-.32, -RH - .2], [-.5, -.12], SM);
    ln("big", arc(0, 0, .028, 0, TAU, 12)); // the hub
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + .1; ln("big", [[Math.cos(a) * .03, Math.sin(a) * .03], [Math.cos(a) * (RH - .025), Math.sin(a) * (RH - .025)]], .7, .6); } // spokes, out to the ring
    ln("frame", [[0, 0], [H[0] / 2, H[1] / 2], H], 1.25, .92); ln("frame", BACK, 1.3, .92); // the fork; the backbone, over and down to the little wheel
    ln("frame", bz([H[0] - .01, H[1] + .005], [.04, H[1] - .06], [.12, H[1] - .04], [.15, H[1] + .03], 12), 1.1, .9); ln("frame", arc(.155, H[1] + .045, .016, -1.6, 1.6, 6), .9, .8); // the handlebar and its grip
    const SAD = [[-.13, -RH - .155], [-.2, -RH - .172], [-.27, -RH - .158], [-.245, -RH - .126], [-.16, -RH - .12], [-.13, -RH - .155]]; ln("frame", SAD, 1.05, .9); ln("frame", [[-.2, -RH - .124], [-.205, -RH - .085]], .9, .85); // the saddle on its post
    ln("small", arc(0, 0, RS, 0, TAU, 20), 1.15, .9); ln("small", arc(0, 0, .014, 0, TAU, 8), .9, .85); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ln("small", [[Math.cos(a) * .016, Math.sin(a) * .016], [Math.cos(a) * (RS - .012), Math.sin(a) * (RS - .012)]], .6, .6); } // the little wheel
    ln("crank", [[0, 0], [.07, .045]], 1, .9); ln("crank", [[.045, .045], [.095, .045]], 1.15, .9); ln("crank", [[0, 0], [-.07, -.045]], 1, .9); ln("crank", [[-.095, -.045], [-.045, -.045]], 1.15, .9); // its cranks and pedals
    ln("frame", arc(.035, H[1] - .045, .018, 0, TAU, 10), .9, .85); // and a bell
    pace(L, RB.bike[0], RB.bike[1], .022);
    const tubeU = (pts, w) => { const n = pts.length, Lf = [], Rt = []; for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b2 = pts[Math.min(n - 1, i + 1)], dx = b2[0] - a[0], dy = b2[1] - a[1], l = Math.hypot(dx, dy) || 1; Lf.push([pts[i][0] - dy / l * w, pts[i][1] + dx / l * w]); Rt.push([pts[i][0] + dy / l * w, pts[i][1] - dx / l * w]); } return [...Lf, ...Rt.reverse()]; };
    return { L, H, SM, SAD, BACK, pen: L.map(e => [e[5] === "small" ? e[0].map(([u, v]) => [u + SM[0], v + SM[1]]) : e[0], e[1], e[2], e[3], e[4], e[5], lens(e[0])]), paint: [[tubeU(BACK, .02), [210, 50, 44], .74, H], [tubeU([[0, 0], H], .02), [210, 50, 44], .74, H], [SAD, [126, 72, 40], .72, [-.2, -RH - .145]]] };
  })();

  /* ---------------- 1.12 b448: the crown ---------------- */
  /** The crown, its beats in the pass's seconds: the eraser takes the drawing the pass before left (`erase`); the pencil
   *  draws a little theatre, fast (`draw`: its arch, its valance, its curtains and their folds, its stage and footlights)
   *  and the brush paints it (`paint`); the curtains open (`open`) on the day's company, every subject a pass draws,
   *  standing in two rows under a painted moon, and the footlights come up (`lights`); they bow one after another down the
   *  line (`wave`), flowers are thrown up onto the stage (`flowers`), and they bow together (`bow`); the curtains close
   *  (`close`) and the pencil, the brush and the eraser come out in front of them and take a bow of their own (`tools`);
   *  the eraser strikes the set (`strike`), and from `sub` the pencil draws this pass's subject as any pass does, only quicker */
  const CRB = { erase: [.3, 1.4], draw: [1.45, 3.4], paint: [3.4, 4.0], open: [4.1, 4.85], lights: [4.5, 5.0], wave: [5.0, 6.6], flowers: [6.25, 7.35], bow: [7.05, 7.8], close: [7.9, 8.5], tools: [8.45, 9.5], strike: [9.55, 10.3], sub: 10.3 };
  /** the theatre's own clock: drawn on a subject's (the pencil 1.95 – 6.45, the brush 6.45 – 9.1), only faster */
  const stageT = T => T < CRB.draw[0] ? 1.9 : T < CRB.draw[1] ? lerp(1.95, 6.45, (T - CRB.draw[0]) / (CRB.draw[1] - CRB.draw[0])) : T < CRB.paint[1] ? lerp(6.45, 9.1, (T - CRB.paint[0]) / (CRB.paint[1] - CRB.paint[0])) : 9.1 + (T - CRB.paint[1]);
  /** a crescent: circle c0 (radius r0) with circle c1 (radius r1) taken out of it, as a closed line */
  const crescent = (c0, r0, c1, r1, n = 18) => { const dx = c1[0] - c0[0], dy = c1[1] - c0[1], d = Math.hypot(dx, dy), a = (r0 * r0 - r1 * r1 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r0 * r0 - a * a)), ux = dx / d, uy = dy / d, bx = c0[0] + a * ux, by = c0[1] + a * uy, H1 = [bx - h * uy, by + h * ux], H2 = [bx + h * uy, by - h * ux], ang = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]);
    let a1 = ang(c0, H1), a2 = ang(c0, H2); while (a2 < a1) a2 += TAU; let b1 = ang(c1, H2), b2 = ang(c1, H1); while (b2 > b1) b2 -= TAU;
    return [...Array.from({ length: n + 1 }, (_, i) => { const t = lerp(a1, a2, i / n); return [c0[0] + Math.cos(t) * r0, c0[1] + Math.sin(t) * r0]; }), ...Array.from({ length: n + 1 }, (_, i) => { const t = lerp(b1, b2, i / n); return [c1[0] + Math.cos(t) * r1, c1[1] + Math.sin(t) * r1]; })]; };
  /** The theatre, in the 200-box: its arch (gold), the valance along its top, two crimson curtains in folds, the stage and
   *  its footlights; behind the curtains, a backdrop of night with a painted moon and stars. Drawn and painted as a subject
   *  is, its parts the backdrop (0), the stage (1), the arch (2) and the two curtains (3, 4), which gather to the sides. */
  const STAGE = (() => {
    const b = kit(), back = b.part(), floor = b.part(), frame = b.part(), cur = [b.part(), b.part()];
    const P = pts => pts.map(([x, y]) => [U(x), U(y)]), archY = x => 42 + 15 * Math.pow((x - 100) / 74, 2), outY = x => 33 + 19 * Math.pow((x - 100) / 82, 2), fy = x => 156 + 32 * ((x - 24) / 152) * (1 - (x - 24) / 152); // the opening's top, the arch's, the stage's front edge
    const along2 = (f, x0, x1, n = 24, dy = 0) => Array.from({ length: n + 1 }, (_, i) => { const x = lerp(x0, x1, i / n); return [x, f(x) + dy]; });
    const IN = [[26, 146], ...along2(archY, 26, 174), [174, 146]], OUT = [[18, 148], ...along2(outY, 18, 182, 28), [182, 148]];
    const MID = [[22, 147], ...along2(x => (archY(clamp(x, 26, 174)) + outY(x)) / 2 - .5, 22, 178, 28), [178, 147]];
    const VB = []; for (let i = 0; i < 9; i++) for (let k = i ? 1 : 0; k <= 8; k++) { const x = lerp(26, 174, (i + k / 8) / 9); VB.push([x, archY(x) + 10 + 5.5 * Math.sin(k / 8 * Math.PI)]); } // the valance's scalloped hem
    const hemY = x => 146 + 1.6 * Math.abs(Math.sin((x - 26) / 9.25 * Math.PI));
    const CUR = sd => { const xo = sd < 0 ? 26 : 174; return [[xo, archY(xo) + 6], ...along2(archY, xo, 100, 12, 6).slice(1), [100, 146], ...along2(hemY, 100, xo, 32).slice(1)]; };
    const MOON = crescent([56, 80], 8, [59.6, 77.4], 7.2);
    // the pencil: a guide, the arch and its moulding, the valance and its fringe, the curtains (where they meet, their hems,
    // their folds, the shadow in the folds), the stage, its boards and the footlights
    b.ink(frame, "guide", P([[26, 146], [174, 146]]), .7, .2); b.ink(frame, "guide", P(along2(archY, 26, 174, 16)), .7, .18);
    b.ink(frame, "frame", P(OUT), 1.45, .92); b.ink(frame, "frame", P(IN), 1.2, .88); b.ink(frame, "frame", P(MID), .75, .55); b.ink(frame, "frame", P(VB), 1.15, .88);
    for (let i = 0; i < VB.length; i += 3) b.ink(frame, "fringe", P([VB[i], [VB[i][0] + .4, VB[i][1] + 3.2]]), .7, .7);
    [-1, 1].forEach((sd, c) => { const k = cur[c], x0 = sd < 0 ? 26 : 100, x1 = sd < 0 ? 100 : 174;
      b.ink(k, "curtain", sv(`M ${100 - sd * .4} 52 C ${100 - sd * 1.2} 90, ${100 + sd * .3} 120, ${100 - sd * .4} 146`, 3), 1.25, .9); b.ink(k, "curtain", P(along2(hemY, x0, x1, 32)), 1.1, .85);
      for (let f = 1; f <= 7; f++) { const x = sd < 0 ? 26 + 9.25 * f : 174 - 9.25 * f, w = f % 2 ? 1.6 : -1.6; b.ink(k, "curtain", sv(`M ${x} ${archY(x) + 12} C ${x + w} ${archY(x) + 40}, ${x - w} 110, ${x + w * .4} 145.5`, 3), .85, .62); }
      for (const h of hatchIn(P(CUR(sd)), 1.4, .03, (x, y) => { const X = x * 100 + 100, q = (((X - 26) / 9.25) % 1 + 1) % 1; return q > .5 && q < .92 && y > U(62); })) b.ink(k, "shade", h, .55, .3); });
    b.ink(floor, "floor", P(along2(fy, 24, 176, 30)), 1.35, .9); b.ink(floor, "floor", P([[26, 146], [24, 156]]), 1.1, .85); b.ink(floor, "floor", P([[174, 146], [176, 156]]), 1.1, .85);
    for (let x = 38; x <= 162; x += 15.5) { const xe = 100 + (x - 100) * 1.07; b.ink(floor, "boards", P([[x, 146.5], [xe, fy(xe) - .5]]), .7, .5); }
    const LAMPS = [44, 72, 100, 128, 156].map(x => [x, fy(x) - 3]); for (const [x, y] of LAMPS) b.ink(floor, "lamps", ring(x, y, 3.8, 2.6, 0, Math.PI, 10), 1, .85), b.ink(floor, "lamps", P([[x - 3.8, y], [x + 3.8, y]]), .9, .8);
    b.ink(back, "back", P(MOON), 1, .82); for (const [x, y, s] of [[120, 64, 2.6], [146, 80, 2.2], [90, 60, 2], [134, 98, 2.4], [74, 100, 2], [162, 104, 1.8], [104, 84, 1.6], [42, 112, 1.8]]) { b.ink(back, "back", P([[x - s, y], [x + s, y]]), .8, .72); b.ink(back, "back", P([[x, y - s], [x, y + s]]), .8, .72); }
    b.time("guide", 2.0, 2.3); b.time("frame", 2.35, 3.55, .02); b.time("fringe", 3.55, 3.8, .004); b.time("curtain", 3.82, 5.0, .012); b.time("shade", 5.0, 5.45, .002); b.time("floor", 5.47, 5.85, .02); b.time("boards", 5.86, 6.08, .006); b.time("lamps", 6.08, 6.3, .006); b.time("back", 0, .01, 0);
    // the brush: the backdrop's night and its moon (there all along, behind the curtains), the arch's gold, the valance, the curtains, the stage, the lamps
    b.wash(back, P(IN), [44, 56, 122], .64, 0, .01, [0, 0]); b.wash(back, P(MOON), [252, 224, 132], .86, 0, .01, [U(56), U(80)]);
    b.wash(frame, P([...OUT, ...IN.slice().reverse()]), [214, 166, 62], .64, 6.5, 6.9, [U(22), U(110)]); b.wash(frame, P([...along2(archY, 26, 174), ...VB.slice().reverse()]), [150, 26, 46], .82, 6.9, 7.15, [U(100), U(50)]);
    b.wash(cur[0], P(CUR(-1)), [196, 38, 56], .78, 7.15, 7.7, [U(62), U(92)]); b.wash(cur[1], P(CUR(1)), [196, 38, 56], .78, 7.5, 8.05, [U(138), U(92)]);
    b.wash(floor, P([[26, 146], [174, 146], [176, 156], ...along2(fy, 176, 24, 24).slice(1)]), [178, 120, 62], .52, 8.05, 8.5, [U(100), U(154)]);
    LAMPS.forEach(([x, y], k) => b.wash(floor, ring(x, y, 3.8, 2.6, 0, Math.PI, 10), [196, 164, 96], .62, 8.5 + k * .05, 8.6 + k * .05, [U(x), U(y + 1)]));
    return { parts: b.parts, flicks: [], pal: [[196, 38, 56], [214, 166, 62]], LAMPS: LAMPS.map(([x, y]) => [U(x), U(y)]), back, floor, frame, cur, fy, curP: [P(CUR(-1)), P(CUR(1))] };
  })();
  /** the day's company, as it stands on the stage: [the subject (0 the balloon), its parts that come on (the rest is its
   *  scenery), where it stands (its feet, in the 200-box), how tall it stands there, which way it faces] — the tall ones
   *  at the back, the small ones in front */
  const CAST = [[0, null, 56, 125, 58, 0], [1, [2], 100, 124, 70, 0], [2, [2], 145, 126, 52, 1], [3, [2, 3], 47, 147, 22, 1], [4, [1, 2], 81, 147, 30, 0], [5, [2], 116, 139, 28, 0], [6, [1, 2, 3, 4], 152, 147, 34, 0]];
  const CAST_X = CAST.map((c, i) => [c[2], i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i); // left to right, for the bows down the line
  /** the flowers thrown up onto the stage: where each lands (the 200-box), when it's thrown, how it spins */
  const ROSES = [64, 90, 108, 126, 144].map((x, k) => { const xl = x + (k % 2 ? 2 : -2), yl = STAGE.fy(xl) - 4.5; return { x0: U(xl + (xl - 100) * .3 + 8), y0: U(198), x1: U(xl), y1: U(yl), t: CRB.flowers[0] + k * .17, spin: (k % 2 ? 1 : -1) * (5 + k), rest: -.5 + k * .22 }; });
  /** a rose, at (u, v) turned r, `s` across, in the drawing's units */
  const rose = (x, u, v, r, s) => { x.save(); x.translate(u, v); x.rotate(r);
    x.strokeStyle = rgba([66, 124, 62], .9); x.lineWidth = 1.5 / S.RR; x.beginPath(); x.moveTo(0, s * .4); x.quadraticCurveTo(s * .7, s * 1.4, s * .35, s * 2.5); x.stroke();
    x.fillStyle = rgba([96, 152, 78], .8); x.beginPath(); x.ellipse(s * .6, s * 1.45, s * .42, s * .17, -.75, 0, TAU); x.fill();
    x.fillStyle = rgba([214, 44, 72], .88); x.beginPath(); x.arc(0, 0, s * .6, 0, TAU); x.fill();
    x.strokeStyle = rgba([120, 18, 40], .85); x.lineWidth = 1 / S.RR; x.beginPath(); for (let k = 0; k <= 18; k++) { const t = k / 18 * 4.6, rr = s * (.06 + .11 * t); k ? x.lineTo(Math.cos(t * 1.9) * rr, Math.sin(t * 1.9) * rr) : x.moveTo(Math.cos(t * 1.9) * rr, Math.sin(t * 1.9) * rr); } x.stroke();
    x.restore(); };

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
    pieceOf(ins, x, st, mirror, inkOnly, only) {
      const ga = x.globalAlpha;
      if (ins.balloon) { const key = "p" + st.inkKey; if (key !== S.inkKey) { const c = S.ink, x2 = c.getContext("2d"); x2.setTransform(1, 0, 0, 1, 0, 0); x2.clearRect(0, 0, c.width, c.height); x2.setTransform(px * S.RR, 0, 0, px * S.RR, 1.15 * S.RR * px, 1.15 * S.RR * px); x2.lineCap = "round"; x2.lineJoin = "round"; S.inkInto(x2, st.prog, st.jit, 1); S.inkKey = key; }
        st.inkC = S.ink; x.save(); if (mirror) x.scale(-1, 1); if (!inkOnly) { const keep = S.washes; if (ins.washes) S.washes = ins.washes; S.piece(x, st); S.washes = keep; } else { x.translate(0, st.lift); x.rotate(st.sway); x.drawImage(S.ink, -1.15, -1.15, 2.3, 2.3); } x.restore(); return; }
      const sub = ins.sub; x.save(); if (mirror) x.scale(-1, 1);
      sub.parts.forEach((pt, k) => {
        if (only && !only.includes(k)) return; // (b448: just these parts, as the crown puts a subject on its stage)
        const ps = sub.pose ? sub.pose(st, k) : null; x.save();
        if (ps) { x.translate(pt.pivot[0] + ps[0], pt.pivot[1] + ps[1]); if (ps[2]) x.rotate(ps[2]); x.translate(-pt.pivot[0], -pt.pivot[1]); }
        if (!inkOnly && sub.live) sub.live(x, st, k, 0, ins);
        if (!inkOnly) pt.washes.forEach((w, j) => { const p = st.w[k][j]; if (p <= .001) return; S.washAt(x, ins.washes[k][j], w[5], p, st.A); const wet = st.wet[k][j]; if (wet > .01) { x.globalAlpha = ga * wet * .45; S.washAt(x, ins.washes[k][j], w[5], p, st.A); x.globalAlpha = ga; } });
        const ik = ins.ink[k]; if (ik) { if (ik.key !== st.inkKey) { const x2 = ik.c.getContext("2d"); x2.setTransform(1, 0, 0, 1, 0, 0); x2.clearRect(0, 0, ik.c.width, ik.c.height); x2.setTransform(px * ins.RR, 0, 0, px * ins.RR, -ik.x0 * px * ins.RR, -ik.y0 * px * ins.RR); x2.lineCap = "round"; x2.lineJoin = "round"; S.inkInto(x2, st.prog, st.jit, 1, pt.strokes); ik.key = st.inkKey; } x.drawImage(ik.c, ik.x0, ik.y0, ik.w, ik.h); }
        if (!inkOnly && sub.live) sub.live(x, st, k, 1, ins);
        x.restore(); x.globalAlpha = ga;
      });
      if (!inkOnly && !only) {
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
    /** 1.12 b416: where the egg's figure stands — beside the drawing, on open paper, with a clear run to the page's edge
     *  on its side: [its feet x, y, its height, the side it stands on (and runs off toward), how far that edge is] */
    eggSpot() {
      const { cx, cy, R, W, H, pr } = S, key = [cx, cy, R].map(Math.round).join(",") + ":" + (S.raw ? S.raw.length : 0);
      if (S.eggAt && S.eggAt.key === key && S.eggAt.raw === S.raw) return S.eggAt;
      const fh = clamp(R * .5, 34, 88), top = pr ? 96 : 122, foot = H - (pr ? 104 : 128), rs = S.raw || [], gap = 10;
      const free = (x0, y0, x1, y1) => rs.every(([a, b, c, d]) => x1 < a - gap || x0 > c + gap || y1 < b - gap || y0 > d + gap);
      let best = null;
      for (const sd of [1, -1]) for (const k of [.62, .5, .74, .4, .84]) {
        const fy = cy + R * k, dy = fy - fh * .5 - cy, half = Math.abs(dy) < R ? Math.sqrt(R * R - dy * dy) : 0, fx = cx + sd * (half + fh * .45 + 8), edge = sd > 0 ? W : 0, run = Math.abs(edge - fx);
        if (fx - fh * .55 < 4 || fx + fh * .55 > W - 4 || fy - fh * 1.45 < top || fy + 4 > foot + 8 || !free(fx - fh * .55, fy - fh * 1.45, fx + fh * .55, fy + 4) || !free(Math.min(fx, edge), fy - fh, Math.max(fx, edge), fy)) continue;
        const score = -Math.abs(k - .62) * 1.5 - Math.max(0, run / fh - 5) * .12 - (run < fh * .6 ? 1 : 0); // low beside it, with a short dash to the edge
        if (!best || score > best.score) best = { fx, fy, fh, sd, run: run / fh, score };
      }
      if (!best) { const sd = cx > W / 2 ? 1 : -1, fh2 = fh * .85, fx = cx + sd * R * .5, fy = cy + R * .72; best = { fx, fy, fh: fh2, sd, run: Math.abs((sd > 0 ? W : 0) - fx) / fh2 }; } // no room beside it: on the drawing itself, low down
      return (S.eggAt = Object.assign(best, { key, raw: S.raw }));
    },
    /** 1.12 b416: the egg pass — the drawing the pass before left, the little figure the pencil doodles beside it and what
     *  becomes of it, then this pass's subject made as any pass makes it (only later, and without its moment, so the pass
     *  ends on the very picture the next one starts from); worked out from the pass and the time alone */
    eggPass(T, I, A, F, P) {
      const { W, H } = S, on = I > .01;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl; S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4)); if (S.vis < .01) return;
      if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) S.build();
      if (S.plP !== P) { const cur = planOf(P), prev = planOf(P - 1); S.pl = { cur, prev }; S.plP = P; for (const k of [...S.subs.keys()]) if (k !== cur.key + "@" + S.RR && k !== prev.key + "@" + S.RR) S.subs.delete(k); }
      const { cx, cy, R } = S, { cur, prev } = S.pl, iN = S.inst(cur), iO = S.inst(prev), sp = S.eggSpot(), { fx, fy, fh, sd } = sp;
      const Ts = T - EB.shift, [e0, e1] = EB.erase, gone = on && T >= e1, erasing = on && T > e0 && T < e1, fin = F >= 0 ? env(F, .05, .15, .55, .85, E.sine) : 0;
      const fr = Math.floor(A * 8), jit = boil(fr, .35 / S.RR), stO = S.stOf(iO, false, T, I, A, F, fin, jit, fr);
      // this pass's subject, as the pencil and the brush have it by Ts: a pass's lines and washes, its tools, its drops, with
      // none of its moment (so its rest, when it's done, is the rest the next pass starts from)
      const pr2 = (t0, t1) => seg(Ts, t0, t1, x => x), inkKey = fr + ":" + (Ts < 6.5 ? Math.round(Ts * 30) : "all") + ":" + S.RR, finD = F >= 0 ? S.fin.map(d => ({ ...d, k: seg(F, d.t, d.t + .12, x => x), a: 1 - seg(F, .8, 1) })) : [];
      const dropsOf = list => [...list.map(d => ({ ...d, k: seg(Ts, d.t + .1, d.t + .25, x => x), a: 1 })), ...finD];
      const stN = !gone ? null : iN.balloon ? { A, jit, prog: pr2, inkKey, w: WASH.map(([, , , t0, t1]) => pr2(t0, t1)), wet: WASH.map(([, , , t0, t1]) => env(Ts, t0, t0 + .1, t1 + .2, t1 + .9) * I), cp: CSTROKES.map(([, t0, t1]) => pr2(t0, t1)), ghost: [1, 1], ghostB: 1, cloud: [Math.sin(A * .12) * .03, Math.sin(A * .1 + 2) * .025], birds: seg(Ts, 6.16, 6.4, x => x), fly: 0, lift: -fin * .12 + Math.sin(A * .9) * .01, sway: Math.sin(A * .7) * .025 * .35, flame: (.15 + .1 * Math.sin(A * 5) * Math.sin(A * 3.3) + fin) * pr2(4.65, 4.75), drops: dropsOf(S.drops) } // (its flame lit once its burner is drawn)
        : { A, T: Ts, I, jit, fin, live: false, redraw: true, alive: 0, prog: pr2, inkKey, w: iN.sub.parts.map(pt => pt.washes.map(w => pr2(w[3], w[4]))), wet: iN.sub.parts.map(pt => pt.washes.map(w => env(Ts, w[3], w[3] + .1, w[4] + .2, w[4] + .9) * I)), birds: seg(Ts, 6.16, 6.4, x => x), fly: 0, drops: dropsOf(iN.drops) };
      const rows = sd > 0 ? EPEM : EPE; // the eraser's rows end on the figure's side
      if (!gone && !erasing) { g.save(); g.globalAlpha = S.vis; g.translate(cx, cy); g.scale(R, R); S.pieceOf(iO, g, stO, prev.mirror); g.restore(); }
      else if (erasing) { // the drawing the pass before left, drawn aside and rubbed out there, row after row
        const size = Math.ceil(2.3 * R * px); if (!S.comp || S.comp.width !== size) [S.comp] = canvas(size, size);
        const x = S.comp.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, size, size); x.setTransform(px * R, 0, 0, px * R, 1.15 * R * px, 1.15 * R * px); x.imageSmoothingEnabled = true; x.lineCap = "round"; x.lineJoin = "round";
        S.pieceOf(iO, x, stO, prev.mirror);
        const e = seg(T, e0, e1, x2 => x2), s = ELE[ELE.length - 1] * e; x.globalCompositeOperation = "destination-out"; x.strokeStyle = `rgba(0,0,0,${I.toFixed(3)})`; x.lineWidth = .46; x.beginPath(); x.moveTo(rows[0][0], rows[0][1]); for (let i = 1; i < rows.length && ELE[i - 1] < s; i++) { const f = clamp((s - ELE[i - 1]) / (ELE[i] - ELE[i - 1])); x.lineTo(lerp(rows[i - 1][0], rows[i][0], f), lerp(rows[i - 1][1], rows[i][1], f)); } x.stroke(); x.globalCompositeOperation = "source-over";
        g.globalAlpha = S.vis; g.drawImage(S.comp, cx - 1.15 * R, cy - 1.15 * R, 2.3 * R, 2.3 * R); g.globalAlpha = 1;
      } else { // rubbed out: its ghost a while, and this pass's subject coming; a touch brings the old one back as it eases
        g.save(); g.translate(cx, cy); g.scale(R, R);
        if (I < .99) { g.globalAlpha = S.vis * (1 - I); S.pieceOf(iO, g, stO, prev.mirror); }
        if (Ts < 6.5) { g.globalAlpha = S.vis * .07 * I; S.pieceOf(iO, g, stO, prev.mirror, true); }
        g.globalAlpha = S.vis * I; S.pieceOf(iN, g, stN, cur.mirror);
        g.restore(); g.globalAlpha = 1;
      }
      const tool = (spr, sh, [sx, sy], lift, ang, a) => { if (a <= .005) return; g.globalAlpha = a * S.vis; g.save(); g.translate(sx + 6 + lift * 10, sy + 9 + lift * 14); g.rotate(ang); g.drawImage(sh, -sh.w2 * .06, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy - lift * 6); g.rotate(ang); g.drawImage(spr, 0, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; };
      const rubber = (sx, sy, rt, a) => { if (a <= .005) return; const spr = S.eraserS, sh = S.eraserSh; g.globalAlpha = a * S.vis; g.save(); g.translate(sx + 5, sy + 7); g.rotate(rt); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy); g.rotate(rt); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; };
      const ta = S.toolAng || -.62, ew = S.eraserS.w2, eh = S.eraserS.h2;
      // where the eraser is from the rows' end on: round to face the figure, scraping, then charging after it off the page
      const rowEnd = rows[rows.length - 1], endP = [cx + rowEnd[0] * R, cy + rowEnd[1] * R], endA = along(rows, ELE, 1)[2], faceA = endA - Math.PI * sd; // it turns half round, to lead with its rubber at the figure
      const stand = [fx - sd * (fh * .78 + ew * .5), fy - eh * .5 - 1], gone2 = sd > 0 ? W + ew * 1.4 : -ew * 1.4;
      const ex = T < EB.aim[0] ? null : T < EB.charge[0] ? (() => { const k = seg(T, EB.aim[0], EB.aim[1], E.io), sc = Math.sin(seg(T, EB.scrape[0], EB.scrape[1], x => x) * TAU * 2) * env(T, EB.scrape[0], EB.scrape[0] + .05, EB.scrape[1] - .05, EB.scrape[1]); return [lerp(endP[0], stand[0], k) - sd * sc * fh * .1, lerp(endP[1], stand[1], k) - Math.sin(k * Math.PI) * fh * .3, lerp(endA, faceA, k) + sc * .16 * sd]; })()
        : [lerp(stand[0], gone2, seg(T, EB.charge[0], EB.charge[1], t => t * t * (3 - 2 * t))), stand[1] + Math.sin(A * 47) * .6, faceA + Math.sin(A * 30) * .05]; // a lunge
      // the figure: its line under it (rubbed out where the charging eraser has been), the dust it kicks up, its speed lines
      const fa = I * S.vis, fj = boil(fr + 50000, .55 / fh), lw = clamp(fh / 34, 1.3, 2.3);
      const strokeIn = (pts, a, w = lw, k = 1) => { const q = pts.map(([u, v]) => fj(u, v)), o = [.5 / fh, .35 / fh]; g.lineWidth = w / fh; g.strokeStyle = rgba(INK, .9 * a); K.partial(g, q, k); g.lineWidth = w * .7 / fh; g.strokeStyle = rgba(INK, .2 * a); K.partial(g, q.map(([u, v]) => [u + o[0], v + o[1]]), k); }; // a line, and the graphite's second, fainter one
      if (on && T > EB.draw[0] && T < EB.charge[1] + .1) {
        g.save(); g.translate(fx, fy); g.scale(fh, fh); g.lineCap = "round"; g.lineJoin = "round";
        const drawing = T < EB.draw[1] + .05, pose = figPose(T, A, sd, sp.run);
        // its ground: the pencil's last line; rubbed out where the charging eraser has been
        const gp = FIG_PEN[FIG_PEN.length - 1], gk = drawing ? seg(T, gp[1], gp[2], x => x) : 1, cut = ex && T >= EB.charge[0] ? (ex[0] + sd * ew * .45 - fx) / fh : null;
        if (gk > 0) { let [a0, a1] = [gp[0][0][0], lerp(gp[0][0][0], gp[0][1][0], gk)]; if (cut !== null) { if (sd > 0) a0 = Math.max(a0, cut); else a1 = Math.min(a1, cut); } if (a1 > a0) strokeIn([[a0, .012], [a1, .012]], fa); }
        if (drawing) { g.fillStyle = rgba(INK, .9 * fa); for (const [pts, t0, t1, , dot] of FIG_PEN.slice(0, -1)) { const k = seg(T, t0, t1, x => x); if (k <= 0) continue; strokeIn(pts, fa, lw, k); if (dot && k >= 1) { g.beginPath(); g.arc(dot[0], dot[1], .021, 0, TAU); g.fill(); } } }
        else if (pose.show) { const { L, D } = figLines(pose, A); for (const l of L) strokeIn(l, fa); g.fillStyle = rgba(INK, .9 * fa); for (const [u, v, r] of D) { g.beginPath(); g.arc(u, v, r, 0, TAU); g.fill(); } }
        const z = seg(T, EB.zip[0], EB.zip[1], E.in); // off it goes: speed lines after it, a puff of dust where it stood (rubbed out as the eraser goes over)
        if (z > 0 && z < 1) { const hx = sd * (sp.run + 1.3) * z; for (const [y, l] of [[-.26, .9], [-.52, 1.3], [-.76, .8]]) strokeIn([[hx - sd * (.35 + l * z), y], [hx - sd * .3, y]], fa * .8, lw * .8); }
        const dk = env(T, EB.zip[0], EB.zip[0] + .05, EB.zip[0] + .3, EB.zip[0] + .6) * (cut !== null && (sd > 0 ? cut > 0 : cut < 0) ? 0 : 1);
        if (dk > .01) { const gr = seg(T, EB.zip[0], EB.zip[0] + .5, E.out); for (const [u, v, r, q] of [[-.16, -.08, .085, 0], [.02, -.12, .11, 1], [.2, -.07, .08, 2], [.08, -.03, .065, 3]]) strokeIn(Array.from({ length: 25 }, (_, i) => { const a = i / 24 * TAU + q, rr = r * (.75 + .45 * gr) * (1 + .16 * Math.pow(Math.abs(Math.sin(i / 24 * Math.PI * 4 + q)), .5)); return [-sd * u * (1 + gr * .7) + Math.cos(a) * rr, v - gr * .06 + Math.sin(a) * rr * .82]; }), fa * dk * .7, lw * .8); } // puffs, scalloped like cartoon dust
        g.restore();
      }
      // the pencil: drawing the figure along each line, then hanging over it, waggling back at its wave, and away
      const hover = [fx - sd * fh * .55, fy - fh * 1.22];
      if (on && T > EB.draw[0] - .06 && T < EB.penOut[1]) {
        let at, lift = 0;
        if (T < EB.draw[1]) { let hit = null; for (const [pts, t0, t1, L] of FIG_PEN) if (T >= t0 && T <= t1) { hit = along(pts, L, (T - t0) / (t1 - t0)); break; }
          if (!hit) { let pv = null, nx = null; for (const s of FIG_PEN) { if (s[2] <= T && (!pv || s[2] > pv[2])) pv = s; if (s[1] >= T && (!nx || s[1] < nx[1])) nx = s; } const pe = pv ? pv[0][pv[0].length - 1] : FIG_PEN[0][0][0], ns = nx ? nx[0][0] : pe, q = pv && nx ? clamp((T - pv[2]) / ((nx[1] - pv[2]) || 1)) : 1; hit = [lerp(pe[0], ns[0], E.io(q)), lerp(pe[1], ns[1], E.io(q))]; lift = Math.sin(q * Math.PI); }
          at = [fx + hit[0] * fh, fy + hit[1] * fh]; }
        else { const k = seg(T, EB.draw[1], EB.draw[1] + .22, E.io), out = seg(T, EB.penOut[0], EB.penOut[1], E.in), end = [fx + FIG_PEN[FIG_PEN.length - 1][0][1][0] * fh, fy]; at = [lerp(end[0], hover[0], k) + Math.sin(A * 2.1) * 1.5 * k - sd * out * fh * .6, lerp(end[1], hover[1], k) + Math.sin(A * 1.7) * 1.2 * k - out * fh * 1.6]; lift = .4 * k; }
        const wag = Math.sin((T - EB.waggle[0]) * TAU * 3) * .24 * env(T, EB.waggle[0], EB.waggle[0] + .06, EB.waggle[1] - .06, EB.waggle[1]);
        tool(S.pencil, S.pencilSh, at, lift, ta + wag, I * env(T, EB.draw[0] - .06, EB.draw[0] + .04, EB.penOut[0] + .05, EB.penOut[1]));
      }
      // the eraser: rubbing the drawing out, its crumbs flying; then round at the figure, scraping, and charging off the page after it
      if (on && T > e0 && T < EB.charge[1]) {
        const e = seg(T, e0, e1, x => x);
        for (const c of S.crumbs) { if (c.e > e) continue; const te = e0 + c.e * (e1 - e0), dtc = T - te; if (dtc > .9) continue; const [u, v] = along(rows, ELE, c.e), x = cx + (u + c.vx * dtc) * R, y = cy + (v + c.vy * dtc + .9 * dtc * dtc) * R; g.strokeStyle = rgba(c.c, (1 - dtc / .9) * .8 * I * S.vis); g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 2.2, c.rot, c.rot + 2.4); g.stroke(); }
        if (erasing) { const [u0, v0, a0] = along(rows, ELE, e), sc = Math.sin(A * 34) * .09, sx = cx + (u0 - Math.sin(a0) * sc) * R, sy = cy + (v0 + Math.cos(a0) * sc) * R; rubber(sx, sy, a0 + Math.sin(A * 24) * .12, I * env(T, e0, e0 + .08, e1, e1 + 1)); }
        else if (ex) { rubber(ex[0], ex[1], ex[2], I);
          if (T > EB.scrape[0]) for (let k = 0; k < 7; k++) { const t0 = EB.scrape[0] + k * .1, d = T - t0; if (d < 0 || d > .5) continue; const x = ex[0] - sd * (ew * .4 + d * fh * 1.1), y = ex[1] + eh * .3 - d * fh * .5 + d * d * fh * 2.4; g.strokeStyle = rgba(S.crumbs[k].c, (1 - d / .5) * .8 * I * S.vis); g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 2.2, k, k + 2.4); g.stroke(); } } // crumbs kicked back as it scrapes and charges
      }
      // then this pass's subject: the pencil while it draws, the brush while it paints (Ts: the time a pass would have)
      if (gone && Ts > 1.95 && Ts < 9.1) { const tl = S.toolsAt(iN, Ts);
        if (tl.pen) tool(S.pencil, S.pencilSh, S.toScr(iN, stN, cur.mirror, tl.pen.k, tl.pen.at[0], tl.pen.at[1]), tl.pen.lift, ta + tl.pen.lift * .06, I * env(Ts, 1.95, 2.05, 6.35, 6.5));
        if (tl.brush) { const fl = (iN.balloon ? FLICKS : iN.sub.flicks).reduce((m, t) => Math.max(m, env(Ts, t - .06, t, t + .02, t + .14)), 0); tool(S.brush, S.brushSh, S.toScr(iN, stN, cur.mirror, tl.brush.k, tl.brush.at[0], tl.brush.at[1]), tl.brush.lift * .4, ta * 1.12 - Math.sign(ta) * fl * .5, I * env(Ts, 6.4, 6.5, 9.0, 9.1)); } }
      // the peek, at the very end: the figure's head round the edge of the page
      if (on && T > EB.peek[0] && T < EB.peek[1]) { const pose = figPose(T, A, sd, sp.run), { L, D } = figLines(pose, A); g.save(); g.translate(fx, fy); g.scale(fh, fh); g.lineCap = "round"; g.lineJoin = "round"; for (const l of L) strokeIn(l, fa); g.fillStyle = rgba(INK, .9 * fa); for (const [u, v, r] of D) { g.beginPath(); g.arc(u, v, r, 0, TAU); g.fill(); } g.restore(); }
      // the finale: stars sketched in round it
      if (F >= 0) for (const s of S.stars) { const p = seg(F, s.t, s.t + .16, x => x); if (p <= 0) continue; const pts = Array.from({ length: 11 }, (_, k) => { const a = -Math.PI / 2 + k * TAU * 2 / 5, rr = s.s; return [s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr]; }); g.save(); g.translate(cx, cy); g.scale(R, R); g.lineWidth = 1.4 / R; g.strokeStyle = rgba([157, 119, 0], .9 * (1 - seg(F, .82, 1)) * S.vis); K.partial(g, pts.map(([u, v]) => jit(u, v)), p); g.restore(); }
    },
    /** 1.12 b427: an hour egg's pass (K.long: one pass in each hour of the list left alone, 1 and 2 by turns) — the
     *  drawing the pass before left, rubbed out; the egg; then this pass's subject drawn and painted as any pass's is, only
     *  quicker and without its moment, so the pass ends on the very picture the next one starts from; worked out from the
     *  pass and the time alone */
    hourPass(T, I, A, F, P, which) {
      const { W, H } = S, on = I > .01;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl; S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4)); if (S.vis < .01) return;
      if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) S.build();
      if (S.plP !== P) { const cur = planOf(P), prev = planOf(P - 1); S.pl = { cur, prev }; S.plP = P; for (const k of [...S.subs.keys()]) if (k !== cur.key + "@" + S.RR && k !== prev.key + "@" + S.RR) S.subs.delete(k); }
      const { cx, cy, R } = S, { cur, prev } = S.pl, iN = S.inst(cur), iO = S.inst(prev), fin = F >= 0 ? env(F, .05, .15, .55, .85, E.sine) : 0;
      const fr = Math.floor(A * 8), jit = boil(fr, .35 / S.RR), stO = S.stOf(iO, false, T, I, A, F, fin, jit, fr), mir = deal(P, 83)() < .5;
      const EB2 = which === 1 ? HB : RB, [e0, e1] = EB2.erase, erasing = on && T > e0 && T < e1, gone = on && T >= e1;
      const sd = which === 2 ? S.ringSide() : 1, rc = [cx + sd * .18 * R, cy + .13 * R], dist = (sd > 0 ? W + 8 - cx : cx + 8) / R - .18 + .63 + .5; // egg 2: which way the bike rolls off, where its wheel lies, how far it has to go
      // this pass's subject from `sub` on, on a clock of its own (Ts) that runs from its first line to its last wash dried by the pass's end
      const Ts = 1.95 + Math.max(0, T - EB2.sub) * (9.85 - 1.95) / (14.82 - EB2.sub), sub = gone && T >= EB2.sub, pr2 = (t0, t1) => seg(Ts, t0, t1, x => x);
      const inkKey = fr + ":" + (Ts < 6.5 ? Math.round(Ts * 30) : "all") + ":" + S.RR, finD = F >= 0 ? S.fin.map(d => ({ ...d, k: seg(F, d.t, d.t + .12, x => x), a: 1 - seg(F, .8, 1) })) : [], dropsOf = list => [...list.map(d => ({ ...d, k: seg(Ts, d.t + .1, d.t + .25, x => x), a: 1 })), ...finD];
      const stN = !sub ? null : iN.balloon ? { A, jit, prog: pr2, inkKey, w: WASH.map(([, , , t0, t1]) => pr2(t0, t1)), wet: WASH.map(([, , , t0, t1]) => env(Ts, t0, t0 + .1, t1 + .2, t1 + .9) * I), cp: CSTROKES.map(([, t0, t1]) => pr2(t0, t1)), ghost: [1, 1], ghostB: 1, cloud: [Math.sin(A * .12) * .03, Math.sin(A * .1 + 2) * .025], birds: seg(Ts, 6.16, 6.4, x => x), fly: 0, lift: -fin * .12 + Math.sin(A * .9) * .01, sway: Math.sin(A * .7) * .025 * .35, flame: (.15 + .1 * Math.sin(A * 5) * Math.sin(A * 3.3) + fin) * pr2(4.65, 4.75), drops: dropsOf(S.drops) }
        : { A, T: Ts, I, jit, fin, live: false, redraw: true, alive: 0, prog: pr2, inkKey, w: iN.sub.parts.map(pt => pt.washes.map(w => pr2(w[3], w[4]))), wet: iN.sub.parts.map(pt => pt.washes.map(w => env(Ts, w[3], w[3] + .1, w[4] + .2, w[4] + .9) * I)), birds: seg(Ts, 6.16, 6.4, x => x), fly: 0, drops: dropsOf(iN.drops) };
      const rot = ([u, v]) => { const c = Math.cos(cur.ang), s = Math.sin(cur.ang); return [u * c - v * s, u * s + v * c]; };
      if (!gone && !erasing) { const jolt = which === 2 && on ? Math.sin((T - RB.sit[0]) * 70) * .005 * env(T, RB.sit[0], RB.sit[0] + .02, RB.sit[0] + .06, RB.sit[0] + .2) * I : 0; // (egg 2: the table jolts as the mug comes down)
        g.save(); g.globalAlpha = S.vis; g.translate(cx, cy + jolt * R); g.scale(R, R); S.pieceOf(iO, g, stO, prev.mirror); g.restore(); }
      else if (erasing) { // the drawing the pass before left, drawn aside and rubbed out there, row after row
        const size = Math.ceil(2.3 * R * px); if (!S.comp || S.comp.width !== size) [S.comp] = canvas(size, size);
        const x = S.comp.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, size, size); x.setTransform(px * R, 0, 0, px * R, 1.15 * R * px, 1.15 * R * px); x.imageSmoothingEnabled = true; x.lineCap = "round"; x.lineJoin = "round";
        S.pieceOf(iO, x, stO, prev.mirror);
        const e = seg(T, e0, e1, x2 => x2), s = EL2[EL2.length - 1] * e; x.globalCompositeOperation = "destination-out"; x.strokeStyle = `rgba(0,0,0,${I.toFixed(3)})`; x.lineWidth = .46; x.beginPath(); let p0 = rot(EP2[0]); x.moveTo(p0[0], p0[1]); for (let i = 1; i < EP2.length && EL2[i - 1] < s; i++) { const f = clamp((s - EL2[i - 1]) / (EL2[i] - EL2[i - 1])), q = rot([lerp(EP2[i - 1][0], EP2[i][0], f), lerp(EP2[i - 1][1], EP2[i][1], f)]); x.lineTo(q[0], q[1]); } x.stroke(); x.globalCompositeOperation = "source-over";
        g.globalAlpha = S.vis; g.drawImage(S.comp, cx - 1.15 * R, cy - 1.15 * R, 2.3 * R, 2.3 * R); g.globalAlpha = 1;
      } else { // rubbed out: a ghost of it a moment, then the egg, then this pass's subject; a touch brings the old one back as it eases
        g.save(); g.translate(cx, cy); g.scale(R, R);
        if (I < .99) { g.globalAlpha = S.vis * (1 - I); S.pieceOf(iO, g, stO, prev.mirror); }
        const gh = .07 * I * (1 - seg(T, e1 + 1, e1 + 2.2)); if (gh > .002) { g.globalAlpha = S.vis * gh; S.pieceOf(iO, g, stO, prev.mirror, true); }
        if (which === 1) { g.globalAlpha = S.vis * I; S.handsAt(g, T, A, jit, mir); }
        if (sub) { g.globalAlpha = S.vis * I; S.pieceOf(iN, g, stN, cur.mirror); }
        g.restore(); g.globalAlpha = 1;
      }
      if (which === 2 && on) { g.save(); g.translate(cx, cy); g.scale(R, R); g.globalAlpha = S.vis * I; S.ringAt(g, T, A, jit, sd, dist); g.restore(); g.globalAlpha = 1; } // egg 2: the shadow, the ring, the bike
      const tool = (spr, sh, [sx, sy], lift, ang, a) => { if (a <= .005) return; g.globalAlpha = a * S.vis; g.save(); g.translate(sx + 6 + lift * 10, sy + 9 + lift * 14); g.rotate(ang); g.drawImage(sh, -sh.w2 * .06, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy - lift * 6); g.rotate(ang); g.drawImage(spr, 0, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; };
      const rubber = ([sx, sy], rt, a) => { if (a <= .005) return; const spr = S.eraserS, sh = S.eraserSh; g.globalAlpha = a * S.vis; g.save(); g.translate(sx + 5, sy + 7); g.rotate(rt); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy); g.rotate(rt); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; };
      const ta = S.toolAng || -.62, td = [Math.cos(ta), Math.sin(ta)], scr = ([u, v]) => [cx + (mir ? -u : u) * R, cy + v * R], bk = ([u, v]) => [rc[0] + sd * u * R, rc[1] + v * R]; // (bk: a point of the bike, before it rolls)
      // the eraser at work, its crumbs flying
      if (erasing || (on && T >= e1 && T < e1 + .9)) {
        const e = seg(T, e0, e1, x => x);
        for (const c of S.crumbs) { if (c.e > e) continue; const te = e0 + c.e * (e1 - e0), dtc = T - te; if (dtc > .9) continue; const [u, v] = rot(along(EP2, EL2, c.e)), x = cx + (u + c.vx * dtc) * R, y = cy + (v + c.vy * dtc + .9 * dtc * dtc) * R; g.strokeStyle = rgba(c.c, (1 - dtc / .9) * .8 * I * S.vis); g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 2.2, c.rot, c.rot + 2.4); g.stroke(); }
        if (erasing) { const [u0, v0, a0] = along(EP2, EL2, e), sc = Math.sin(A * 34) * .09, [u, v] = rot([u0 - Math.sin(a0) * sc, v0 + Math.cos(a0) * sc]), rt = a0 + cur.ang + Math.sin(A * 24) * .12, spr = S.eraserS, sh = S.eraserSh, sx = cx + u * R, sy = cy + v * R;
          g.globalAlpha = I * S.vis; g.save(); g.translate(sx + 5, sy + 7); g.rotate(rt); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy); g.rotate(rt); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; }
      }
      if (on && which === 2) { // egg 2's tools: the eraser at the ring, and giving up; the pencil looking it over, drawing the bike and watching it go; the brush
        const ePt = (() => { const [u, v] = rot(along(EP2, EL2, 1)); return [cx + u * R, cy + v * R]; })(), rk = seg(T, RB.rub[0] - .12, RB.rub[0] + .06, E.io), rubbing = env(T, RB.rub[0] + .02, RB.rub[0] + .08, RB.rub[1] - .06, RB.rub[1]);
        if (T > RB.rub[0] - .12 && T < RB.sulk[1]) {
          const z = [Math.sin((T - RB.rub[0]) * 29) * RH * .8 * R, Math.sin((T - RB.rub[0]) * 6.5 + .4) * RH * .55 * R], at = [lerp(ePt[0], rc[0] + z[0] * rubbing, rk), lerp(ePt[1], rc[1] + z[1] * rubbing, rk)], droop = E.out(seg(T, RB.sulk[0], RB.sulk[0] + .14)), away = seg(T, RB.sulk[0] + .14, RB.sulk[1], E.in);
          rubber([at[0] + sd * away * R * .9, at[1] + droop * R * .04 + away * R * .5], cur.ang + Math.sin(A * 28) * .16 * rubbing + sd * .5 * droop, I * (1 - away));
          if (rubbing > .05) for (let k = 0; k < 10; k++) { const r = rng(9500 + k), t = (T * 3.2 + r()) % 1, x0 = rc[0] + (r() - .5) * RH * 1.4 * R, y0 = rc[1] + (r() - .5) * RH * R; g.strokeStyle = rgba(r() < .6 ? [205, 150, 150] : [150, 150, 158], (1 - t) * .8 * I * S.vis * rubbing); g.lineWidth = 1.2; g.beginPath(); g.arc(x0 + (r() - .5) * t * R * .3, y0 + t * R * .08 + t * t * R * .3, 2.2, k, k + 2.4); g.stroke(); } // crumbs, and the ring still there
        }
        const hover = bk(ta > 0 ? [-.34, RH + .3] : [-.12, -RH - .5]) /* where it watches from: out of the bike's way, whichever side it's held from */, first = (() => { const f = iN.pen[0], u0 = f[0][0][0], v0 = f[0][0][1]; return [cx + (cur.mirror ? -u0 : u0) * R, cy + v0 * R]; })();
        if (T > RB.circle[0] - .3 && T < RB.sub + .1) { let at, lift = 0, ang = ta;
          if (T < RB.circle[0]) { const k = seg(T, RB.circle[0] - .3, RB.circle[0], E.out), a0 = -1.9, st = bk([Math.cos(a0) * RH * 1.18, Math.sin(a0) * RH * 1.18]); at = [lerp(st[0] + td[0] * R * 1.3, st[0], k), lerp(st[1] + td[1] * R * 1.3 - R * .4, st[1], k)]; lift = .9; } // in from off the page,
          else if (T < RB.bike[0]) { const q = seg(T, RB.circle[0], RB.circle[1] - .1, E.io), a = -1.9 + q * TAU * sd, rr = RH * 1.18 * (1 - seg(T, RB.circle[1] - .14, RB.bike[0], E.in)); at = bk([Math.cos(a) * rr, Math.sin(a) * rr]); lift = .8 * (1 - seg(T, RB.circle[1] - .1, RB.bike[0])); } // round the ring once, looking it over, and down at its middle
          else if (T < RB.bike[1] + .02) { const [u, v, l] = penAt(BIKE.pen, T, [0, 0]); at = bk([u, v]); lift = l; } // drawing it into a bike
          else if (T < RB.back[0]) { const k = seg(T, RB.bike[1], RB.bike[1] + .2, E.io), end = BIKE.pen[BIKE.pen.length - 1][0], e = bk(end[end.length - 1]); at = [lerp(e[0], hover[0], k), lerp(e[1], hover[1], k)]; lift = .5 * k; ang = ta + sd * .22 * seg(T, RB.roll[0], RB.roll[0] + .5, E.io); } // stepping back to watch it go
          else { const k = seg(T, RB.back[0], RB.back[1], E.io); at = [lerp(hover[0], first[0], k), lerp(hover[1], first[1], k)]; lift = .5 * (1 - k) + .25 * Math.sin(k * Math.PI); ang = ta + sd * .22 * (1 - k); } // and back to today's drawing
          tool(S.pencil, S.pencilSh, at, lift, ang, I * env(T, RB.circle[0] - .3, RB.circle[0] - .18, RB.sub - .03, RB.sub + .05));
        }
        if (T > RB.paint[0] - .14 && T < RB.paint[1] + .14) { const k = seg(T, RB.paint[0], RB.paint[0] + .3, E.io), b = along(BIKE.BACK, lens(BIKE.BACK), k), sad = [-.2, -RH - .145], at = T < RB.paint[0] + .3 ? bk(b) : bk([lerp(BIKE.SM[0], sad[0], seg(T, RB.paint[0] + .3, RB.paint[0] + .36)), lerp(BIKE.SM[1], sad[1], seg(T, RB.paint[0] + .3, RB.paint[0] + .36))]); // the brush, down the frame and onto the saddle
          tool(S.brush, S.brushSh, at, .15, ta * 1.12, I * env(T, RB.paint[0] - .14, RB.paint[0], RB.paint[1], RB.paint[1] + .14)); }
      }
      if (on && which === 1) { // the pencil: drawing hand A, lifting away (startled as A comes alive), and back again, a little unsure, for today's drawing
        const HA = PAIR.A;
        if (T > HB.guide[0] - .3 && T < HB.penOut[1]) {
          const [u, v, l] = penAt(HA.drawn, Math.min(T, HB.hat[1]), HA.drawn[0][0][0], .3), out = seg(T, HB.penOut[0], HB.penOut[1], E.in), jolt = env(T, HB.liveA[0] + .02, HB.liveA[0] + .09, HB.liveA[0] + .12, HB.liveA[0] + .3, E.out), p = scr([u, v]), go = out * R * 1.4 + jolt * R * .14;
          tool(S.pencil, S.pencilSh, [p[0] + td[0] * go, p[1] + td[1] * go - out * R * .45], Math.max(l, out * .9), ta + jolt * .32, I * env(T, HB.guide[0] - .3, HB.guide[0] - .18, HB.penOut[0] + .12, HB.penOut[1]));
        }
        if (T > HB.back[0] && T < EB2.sub + .1) {
          const f = iN.pen[0], u0 = f[0][0][0], v0 = f[0][0][1], p = [cx + (cur.mirror ? -u0 : u0) * R, cy + v0 * R], k = seg(T, HB.back[0], HB.back[1], E.out), from = [p[0] + td[0] * R * 1.4, p[1] + td[1] * R * 1.4 - R * .45];
          const wag = Math.sin((T - HB.back[0]) * TAU * 3.2) * .17 * env(T, HB.back[0] + .12, HB.back[0] + .17, HB.back[1] - .03, HB.back[1]);
          tool(S.pencil, S.pencilSh, [lerp(from[0], p[0], k), lerp(from[1], p[1], k)], (1 - k) * .8 + .3 * (1 - seg(T, HB.back[1] - .05, EB2.sub)), ta + wag, I * (1 - seg(T, EB2.sub - .02, EB2.sub + .06)));
        }
      }
      // then this pass's subject: the pencil while it draws, the brush while it paints, on its own clock
      if (sub && Ts > 1.95 && Ts < 9.1) { const tl = S.toolsAt(iN, Ts);
        if (tl.pen) tool(S.pencil, S.pencilSh, S.toScr(iN, stN, cur.mirror, tl.pen.k, tl.pen.at[0], tl.pen.at[1]), tl.pen.lift, ta + tl.pen.lift * .06, I * env(Ts, 1.95, 2.05, 6.35, 6.5));
        if (tl.brush) { const fl = (iN.balloon ? FLICKS : iN.sub.flicks).reduce((m, t) => Math.max(m, env(Ts, t - .06, t, t + .02, t + .14)), 0); tool(S.brush, S.brushSh, S.toScr(iN, stN, cur.mirror, tl.brush.k, tl.brush.at[0], tl.brush.at[1]), tl.brush.lift * .4, ta * 1.12 - Math.sign(ta) * fl * .5, I * env(Ts, 6.4, 6.5, 9.0, 9.1)); } }
      // the finale: stars sketched in round it
      if (F >= 0) for (const s of S.stars) { const p = seg(F, s.t, s.t + .16, x => x); if (p <= 0) continue; const pts = Array.from({ length: 11 }, (_, k) => { const a = -Math.PI / 2 + k * TAU * 2 / 5, rr = s.s; return [s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr]; }); g.save(); g.translate(cx, cy); g.scale(R, R); g.lineWidth = 1.4 / R; g.strokeStyle = rgba([157, 119, 0], .9 * (1 - seg(F, .82, 1)) * S.vis); K.partial(g, pts.map(([u, v]) => jit(u, v)), p); g.restore(); }
    },
    /** egg 2: which way the penny-farthing rolls off: to the nearer edge of the page, if nothing is in the way at its height */
    ringSide() {
      const { cx, cy, R, W } = S, key = [cx, cy, R].map(Math.round).join(",") + ":" + (S.raw ? S.raw.length : 0);
      if (S.rsd && S.rsd.key === key && S.rsd.raw === S.raw) return S.rsd.sd;
      const y0 = cy - .45 * R, y1 = cy + .55 * R, clear = sd => (S.raw || []).every(([a, b, c, d]) => d < y0 || b > y1 || (sd > 0 ? c < cx + .2 * R : a > cx - .2 * R));
      const order = W - cx <= cx ? [1, -1] : [-1, 1], sd = order.find(clear) || order[0];
      S.rsd = { key, raw: S.raw, sd }; return sd;
    },
    /** egg 2: the coffee ring, drawn once for a size, wet and dry — a faint film inside it, its band darkest at the outer
     *  edge, where the coffee carried itself as it dried, granulated, and a run off one side — and the bike's paint */
    ringW() {
      if (S.rw && S.rw.RR === S.RR) return S.rw;
      const RR = S.RR, half = RH + .08, mkR = wet => { const [c, x] = canvas(Math.ceil(2 * half * RR * px), Math.ceil(2 * half * RR * px)); x.imageSmoothingEnabled = true; x.setTransform(px * RR, 0, 0, px * RR, half * RR * px, half * RR * px);
        const r = rng(4400), nz = K.noise1(4401, 24), rim = a => RH * (1 + .022 * (nz(a / TAU * 24) - .5)), band = a => .028 + .022 * nz(a / TAU * 24 + 7), C = wet ? [100, 58, 28] : [146, 100, 60];
        const loop = (f, rev) => { for (let i = 0; i <= 96; i++) { const a = (rev ? 96 - i : i) / 96 * TAU, rr = f(a); i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } };
        x.beginPath(); loop(a => rim(a) - band(a) * .7); x.closePath(); x.fillStyle = rgba(C, wet ? .16 : .055); x.fill(); // the film inside it, faint once it's dry
        x.beginPath(); loop(rim); loop(a => rim(a) - band(a), true); x.closePath(); x.fillStyle = rgba(C, wet ? .48 : .26); x.fill(); // its band
        x.beginPath(); for (let i = 0; i <= 40; i++) { const a = .6 + i / 40 * 2.6, rr = rim(a) * 1.035 + .006 * Math.sin(i * .9); i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.strokeStyle = rgba(C, wet ? .22 : .3, .8); x.lineWidth = 1.1 / RR; x.stroke(); // and a fainter second ring, where the cup sat a hair over first
        x.beginPath(); loop(rim); x.closePath(); x.strokeStyle = rgba(C, wet ? .5 : .7, .78); x.lineWidth = (wet ? 1.5 : 2.1) / RR; x.stroke(); // darkest at its outer edge
        x.beginPath(); loop(a => rim(a) - band(a)); x.closePath(); x.strokeStyle = rgba(C, .22, .85); x.lineWidth = .9 / RR; x.stroke();
        for (let k = 0; k < 340; k++) { const a = r() * TAU, rr = rim(a) - r() * band(a) * 1.15; x.fillStyle = rgba(C, .1 + r() * .2, .7); const s2 = (.6 + r() * .9) / RR; x.fillRect(Math.cos(a) * rr, Math.sin(a) * rr, s2, s2); } // its grain
        const da = 2.25, nx = Math.cos(da), ny = Math.sin(da); x.fillStyle = rgba(C, wet ? .44 : .3); x.beginPath(); x.moveTo(nx * (RH - .01) - ny * .022, ny * (RH - .01) + nx * .022); x.quadraticCurveTo(nx * (RH + .075), ny * (RH + .075), nx * (RH - .01) + ny * .022, ny * (RH - .01) - nx * .022); x.closePath(); x.fill(); // a run, off one side
        c.half = half; return c; };
      S.rw = { RR: S.RR, wet: mkR(true), dry: mkR(false), paint: BIKE.paint.map(([p, col, a, at], i) => { const c = S.washOf(p, col, a, 4500 + i); let far = 0; for (const [u, v] of p) far = Math.max(far, Math.hypot(u - at[0], v - at[1])); c.reach = far * 1.12 + .02; c.nz = K.noise1(4510 + i, 16); return c; }) };
      return S.rw;
    },
    /** hour egg 2 at T, drawn into x in the drawing's frame: the mug's shadow; the ring it leaves; the penny-farthing the
     *  pencil makes of it, painted, ringing its bell, and rolling off the page (`dist`: how far that is, in the drawing's units) */
    ringAt(x, T, A, jit, sd, dist) {
      if (T < RB.down[0] || T > RB.roll[1] + .05) return;
      const c = [sd * .18, .13], ga = x.globalAlpha, pr = (t0, t1) => seg(T, t0, t1, z => z), rw = S.ringW();
      if (T < RB.lift[1]) { // the mug's shadow, coming down from up high, sitting, lifting away: softer and fainter the higher it is
        const h = T < RB.sit[0] ? 1 - seg(T, RB.down[0], RB.sit[0], E.out) : T < RB.lift[0] ? 0 : seg(T, RB.lift[0], RB.lift[1], E.in), dir = T < RB.sit[0] ? [.95 * sd, -1.15] : [1.25 * sd, -.95];
        const p = [c[0] + dir[0] * h * h * 1.2 + .045 + .3 * h, c[1] + dir[1] * h * h * 1.2 + .065 + .4 * h], rr = RH * (1.07 + .6 * h), soft = .12 + .72 * h, a = (.3 - .17 * h) * env(T, RB.down[0], RB.down[0] + .35, RB.lift[1] - .3, RB.lift[1]);
        { const gr = x.createRadialGradient(p[0], p[1], rr * (1 - soft), p[0], p[1], rr); gr.addColorStop(0, `rgba(70,52,38,${a.toFixed(3)})`); gr.addColorStop(1, "rgba(70,52,38,0)"); x.fillStyle = gr; x.beginPath(); x.arc(p[0], p[1], rr, 0, TAU); x.fill(); } // the mug's shadow,
        for (const [wk, ak] of [[1, .9], [1.9, .45], [3, .22]]) { x.strokeStyle = `rgba(70,52,38,${(a * ak * (1 - .5 * soft)).toFixed(3)})`; x.lineWidth = rr * .1 * wk * (1 + soft); x.beginPath(); x.arc(p[0] + rr * 1.06 * sd, p[1] - rr * .04, rr * .3, sd > 0 ? -1.35 : Math.PI - 1.35, sd > 0 ? 1.35 : Math.PI + 1.35); x.stroke(); } // and its handle's, a loop
      }
      if (T < RB.sit[0]) { x.globalAlpha = ga; return; }
      // how far it has rolled: back a little as it winds up, then away, faster and faster; that turns each wheel
      const q = seg(T, RB.roll[0], RB.roll[1], z => z), d = dist * q * q * (.3 + .7 * q) - .04 * env(T, RB.ding[0] + .05, RB.ding[1], RB.ding[1] + .02, RB.roll[0] + .15, E.sine), ang = d / RH, bob = -Math.abs(Math.sin(ang * 2)) * .007 * Math.min(1, q * 8);
      x.save(); x.translate(c[0] + sd * d, c[1] + bob); x.scale(sd, 1);
      const wet = 1 - seg(T, RB.dry[0], RB.dry[1]), ring = rw.wet.half; // the ring: wet as it's left, drying paler with its rim darker; the bike's big wheel, turning
      x.save(); x.rotate(ang); if (wet > .01) { x.globalAlpha = ga * wet; x.drawImage(rw.wet, -ring, -ring, 2 * ring, 2 * ring); } if (wet < .99) { x.globalAlpha = ga * (1 - wet); x.drawImage(rw.dry, -ring, -ring, 2 * ring, 2 * ring); } x.globalAlpha = ga; x.restore();
      if (wet > .01) { x.strokeStyle = `rgba(255,255,255,${(.6 * wet).toFixed(3)})`; x.lineWidth = 1.6 / S.RR; x.beginPath(); x.arc(0, 0, RH - .016, Math.PI * 1.08, Math.PI * 1.42); x.stroke(); } // its wet gloss
      BIKE.paint.forEach((w, i) => { const p = seg(T, RB.paint[0] + i * .1, RB.paint[0] + .16 + i * .1); if (p > .001) S.washAt(x, rw.paint[i], w[3], p, A); }); // the brush's red, and the saddle's brown
      const lines = part => BIKE.L.filter(l => l[5] === part);
      x.save(); x.rotate(ang); S.inkInto(x, pr, jit, 1, lines("big")); S.inkInto(x, pr, jit, 1, lines("crank")); x.restore();
      S.inkInto(x, pr, jit, 1, lines("frame"));
      x.save(); x.translate(BIKE.SM[0], BIKE.SM[1]); x.rotate(d / RS); S.inkInto(x, pr, jit, 1, lines("small")); x.restore();
      const dg = Math.max(env(T, RB.ding[0], RB.ding[0] + .05, RB.ding[0] + .11, RB.ding[0] + .18), env(T, RB.ding[0] + .22, RB.ding[0] + .27, RB.ding[0] + .33, RB.ding[0] + .4)); // its bell, twice
      if (dg > .02) { x.strokeStyle = rgba(INK, .85 * dg); x.lineWidth = 1 / S.RR; const b = [.035, BIKE.H[1] - .045]; for (const a of [-2.3, -1.57, -.84, -.15]) { x.beginPath(); x.moveTo(b[0] + Math.cos(a) * .036, b[1] + Math.sin(a) * .036); x.lineTo(b[0] + Math.cos(a) * (.056 + .018 * dg), b[1] + Math.sin(a) * (.056 + .018 * dg)); x.stroke(); } }
      const v = q > 0 && q < 1 ? Math.min(1, q * 2.4) : 0; // speed lines behind it
      if (v > .05) { x.strokeStyle = rgba(INK, .5 * v); x.lineWidth = .9 / S.RR; for (const [y, l] of [[-.22, .8], [.03, 1.15], [.25, .7]]) { const x0 = BIKE.SM[0] - RS - .05; x.beginPath(); x.moveTo(x0 - .05 - l * .3 * v, y); x.lineTo(x0, y); x.stroke(); } }
      x.restore();
      const pf = env(T, RB.roll[0] + .02, RB.roll[0] + .12, RB.roll[0] + .3, RB.roll[0] + .65); // a puff of dust where it set off
      if (pf > .01) { const gr = seg(T, RB.roll[0], RB.roll[0] + .6, E.out); x.strokeStyle = rgba(INK, .55 * pf); x.lineWidth = .9 / S.RR; for (const [u, v2, r0, ph] of [[-.1, -.05, .06, 0], [.02, -.08, .075, 1], [-.02, -.01, .05, 2]]) { x.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU + ph, rr = r0 * (.7 + .5 * gr) * (1 + .15 * Math.pow(Math.abs(Math.sin(i / 24 * Math.PI * 4 + ph)), .5)), px2 = c[0] + sd * (BIKE.SM[0] - RS * .6 + u * (1 + gr)) + Math.cos(a) * rr, py2 = c[1] + RH - .06 + v2 - gr * .05 + Math.sin(a) * rr * .8; i ? x.lineTo(px2, py2) : x.moveTo(px2, py2); } x.stroke(); } }
      x.globalAlpha = ga;
    },
    /** the hands' washes, made for the drawing's size: each one's skin, and its pencil's paint as it's held, flipped, and whole */
    handW() {
      if (S.hw && S.hw.RR === S.RR) return S.hw.list;
      const mk = (poly, col, a, seed, at) => { const c = S.washOf(poly, col, a, seed); let far = 0; for (const [u, v] of poly) far = Math.max(far, Math.hypot(u - at[0], v - at[1])); c.reach = far * 1.12 + .02; c.nz = K.noise1(seed, 16); c.at = at; return c; };
      const list = PAIR.hands.map((h, i) => ({ skin: mk(h.skin, [238, 180, 144], .55, 701 + i, h.W), ...Object.fromEntries(["paint", "paintF", "paintW"].map((key, j) => [key, h[key].map(([p, c, a], q) => mk(p, c, a, 711 + i * 40 + j * 10 + q, h.mid))])) }));
      S.hw = { RR: S.RR, list }; return list;
    },
    /** hour egg 1 at T, drawn into x in the drawing's frame: the pair (PAIR), each cuff where it was drawn and each hand
     *  turned at its wrist and slid in its cuff so its pencil (or, turned round, its eraser) is where its job has it; the
     *  lines as far as they're drawn, the colour as far as it has flooded in; in the scrub, each undone from its cuff out */
    handsAt(x, T, A, jit, mir) {
      if (T < HB.guide[0] || T > HB.scrub[1] + .02) return;
      const { A: HA, B: HBk } = PAIR, ga = x.globalAlpha, pr = (t0, t1) => seg(T, t0, t1, z => z), all = () => 1, ws = S.handW();
      const tw = seg(T, HB.twirl[0], HB.twirl[1], E.io), undo = seg(T, HB.scrub[0] + .04, HB.scrub[1], z => z);
      const pose = h => { // where its pencil is meant to be, and the turn and slide that put it there
        const isA = h === HA, lv = isA ? HB.liveA : HB.liveB, stretch = -.07 * env(T, lv[0], lv[0] + .16, lv[0] + .2, lv[1], E.sine), breath = Math.sin(A * 2.1 + (isA ? 0 : 2.3)) * .01 * seg(T, lv[0], lv[1]);
        let at = null, lift = 0;
        const end = penAt(h.job, HB.loop[1], h.tip);
        if (T >= HB.twirl[0]) { const q = seg(T, HB.twirl[0], HB.scrub[0], E.io), r = along(h.rub, h.rubL, seg(T, HB.scrub[0], HB.scrub[1] - .12, z => z)); at = T < HB.scrub[0] ? [lerp(end[0], h.rub[0][0], q), lerp(end[1], h.rub[0][1], q)] : [r[0], r[1]]; lift = T < HB.scrub[0] ? Math.sin(q * Math.PI) * .6 : 0; }
        else if (T >= (isA ? HB.cuffB[0] : HB.loop[0]) - .3) { const p = penAt(h.job, T, h.tip); at = [p[0], p[1]]; lift = p[2]; }
        if (!at) return { th: stretch + breath, sl: 0, lift: 0 };
        const r = reachTo(h, at, h.tip); return { th: r.th + breath * .3, sl: r.sl, lift };
      };
      const one = (c, h, i, cut) => { // a hand into c: its cuff, then the hand itself, posed
        const lv = h === HA ? HB.liveA : HB.liveB, live = pr(lv[0], lv[1]), wh = ws[i], ps = pose(h);
        S.inkInto(c, pr, jit, 1, h.cuff); S.inkInto(c, pr, jit, 1, h.marks);
        c.save(); c.translate(h.W[0], h.W[1] - ps.lift * .014); c.rotate(ps.th); c.translate(-h.W[0], -h.W[1]);
        if (live > .001) S.washAt(c, wh.skin, h.W, live, A);
        const pen = (lines, paint, prog, hide) => { c.save(); if (hide) { c.beginPath(); c.rect(-3, -3, 6, 6); h.occ.forEach(([u, v], j) => j ? c.lineTo(u, v) : c.moveTo(u, v)); c.closePath(); c.clip("evenodd"); } // behind the fingers, wherever it slides
          c.translate(h.pu[0] * ps.sl, h.pu[1] * ps.sl); if (live > .001) paint.forEach(w => S.washAt(c, w, w.at, live, A)); S.inkInto(c, prog, jit, 1, lines); c.restore(); };
        S.inkInto(c, pr, jit, 1, h.body);
        if (T < (h === HA ? HB.liveA[0] : HB.growB[1])) pen(h.pen, wh.paint, pr, false); // as it's being drawn
        else if (tw <= 0) pen(h.penW, wh.paintW, all, true); else if (tw >= 1) pen(h.penF, wh.paintF, all, true);
        else { c.save(); c.translate(h.mid[0], h.mid[1]); c.rotate(Math.PI * tw * (h === HA ? 1 : -1)); c.translate(-h.mid[0], -h.mid[1]); pen(h.penW, wh.paintW, all, false); c.restore(); } // twirled out of the fingers and round
        c.restore();
        if (cut > 0) { // undone from its cuff out: everything behind the front rubbed away, its edge ragged
          const f = (lerp(-6, 142, cut) - (HD.tip[0] + HD.Q[0]) / 2) * HK * h.sg, sg = h.sg; c.save(); c.globalCompositeOperation = "destination-out"; c.fillStyle = "#000";
          for (const [lead, a] of [[.05, .35], [.025, .6], [0, 1]]) { c.globalAlpha = a; c.beginPath(); c.moveTo(-2 * sg, -1.4); for (let k = 0; k <= 56; k++) { const y = -1.4 + k * .05; c.lineTo(f + sg * (lead + .03 * Math.sin(y * 41 + i * 2) * Math.sin(y * 17 + 1) + .012 * Math.sin(y * 97)), y); } c.lineTo(-2 * sg, 1.4); c.closePath(); c.fill(); } // ragged, and softer ahead of it, as a rubber leaves it
          c.restore(); }
      };
      if (undo <= 0) { x.save(); if (mir) x.scale(-1, 1); x.lineCap = "round"; x.lineJoin = "round"; PAIR.hands.forEach((h, i) => one(x, h, i, 0)); x.restore(); }
      else PAIR.hands.forEach((h, i) => { // each into a layer of its own, undone there, crumbs falling off its front
        const R = S.R, size = Math.ceil(2.3 * R * px), key = "hl" + i; if (!S[key] || S[key].width !== size) [S[key]] = canvas(size, size);
        const c = S[key].getContext("2d"); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.clearRect(0, 0, size, size); c.setTransform(px * R * (mir ? -1 : 1), 0, 0, px * R, 1.15 * R * px, 1.15 * R * px); c.imageSmoothingEnabled = true; c.lineCap = "round"; c.lineJoin = "round";
        one(c, h, i, undo); x.drawImage(S[key], -1.15, -1.15, 2.3, 2.3);
        const f = (lerp(-6, 142, undo) - (HD.tip[0] + HD.Q[0]) / 2) * HK * h.sg;
        for (let k = 0; k < 14; k++) { const r = rng(9100 + i * 50 + k), y0 = h.W[1] + (r() - .45) * .55 * -h.sg, t = (T * 2.6 + r()) % 1, fx = (f + (r() - .5) * .04) * (mir ? -1 : 1), fy = y0 + t * .1 + t * t * .22; x.strokeStyle = rgba(r() < .6 ? [205, 150, 150] : [150, 150, 158], .75 * (1 - t) * env(undo, 0, .08, .9, 1)); x.lineWidth = 1.2 / S.RR; x.beginPath(); x.arc(fx, fy, 2.2 / S.RR, k, k + 2.4); x.stroke(); } // crumbs off the front
        const rb = along(h.rub, h.rubL, seg(T, HB.scrub[0], HB.scrub[1] - .12, z => z)); for (let k = 0; k < 6; k++) { const r = rng(9300 + i * 20 + k), t = (T * 3.4 + r()) % 1, fx = (rb[0] + (r() - .5) * .05 + (r() - .5) * t * .12) * (mir ? -1 : 1), fy = rb[1] + t * .05 + t * t * .25; x.strokeStyle = rgba(r() < .7 ? [205, 150, 150] : [150, 150, 158], .8 * (1 - t) * env(undo, 0, .05, .7, .85)); x.lineWidth = 1.2 / S.RR; x.beginPath(); x.arc(fx, fy, 2.2 / S.RR, k * 2, k * 2 + 2.4); x.stroke(); } // and where its eraser rubs
      });
      x.globalAlpha = ga;
    },
    /** 1.12 b448: the crown's theatre, made for the drawing's size and kept, as `inst` makes a subject: its washes, its
     *  lines' caches, the pencil's and the brush's ways round it (not round the backdrop: that's there all along) */
    crownStage() {
      if (S.cst && S.cst.RR === S.RR) return S.cst;
      const sub = STAGE, RR = S.RR, box = pts => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [u, v] of pts) { x0 = Math.min(x0, u); y0 = Math.min(y0, v); x1 = Math.max(x1, u); y1 = Math.max(y1, v); } return [x0, y0, x1, y1]; };
      const ins = { sub, RR, key: "stage", spr: null, drops: [],
        washes: sub.parts.map((pt, k) => pt.washes.map((w, j) => { const c = S.washOf(w[0], w[1], w[2], 4401 + k * 31 + j * 17, w[6]); let far = 0; for (const [u, v] of w[0]) far = Math.max(far, Math.hypot(u - w[5][0], v - w[5][1])); c.reach = far * 1.12 + .02; c.nz = K.noise1(70 + j + k * 7, 16); return c; })),
        ink: sub.parts.map(pt => { if (!pt.strokes.length) return null; const [x0, y0, x1, y1] = box(pt.strokes.flatMap(s => s[0])), m = .05, [c] = canvas(Math.ceil((x1 - x0 + 2 * m) * RR * px), Math.ceil((y1 - y0 + 2 * m) * RR * px)); return { c, x0: x0 - m, y0: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m, key: null }; }),
        pen: sub.parts.flatMap((pt, k) => k === sub.back ? [] : pt.strokes.map(s => [s[0], s[1], s[2], k])).sort((a, b) => a[1] - b[1]).map(e => [...e, lens(e[0])]),
        brush: sub.parts.flatMap((pt, k) => k === sub.back ? [] : pt.washes.map(w => { const [x0, y0, x1, y1] = box(w[0]); return [w[3], w[4], w[5], k, x1 - x0, y1 - y0]; })).sort((a, b) => a[0] - b[0]),
        glow: mk(64, 64, x => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,236,170,.95)"); gr.addColorStop(.3, "rgba(255,214,120,.45)"); gr.addColorStop(1, "rgba(255,200,100,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }), curC: null };
      return (S.cst = ins);
    },
    /** a curtain, drawn once into its own canvas when it's painted (its lines held still), to be gathered in bands */
    crownCurtain(ins, st, c) {
      ins.curC = ins.curC || []; if (ins.curC[c]) return ins.curC[c];
      const x0 = U(c ? 98 : 24), y0 = U(44), w = U(176) - U(98), h = U(150) - U(44), [cv, x] = canvas(Math.ceil(w * ins.RR * px), Math.ceil(h * ins.RR * px));
      x.imageSmoothingEnabled = true; x.setTransform(px * ins.RR, 0, 0, px * ins.RR, -x0 * px * ins.RR, -y0 * px * ins.RR); x.lineCap = "round"; x.lineJoin = "round";
      x.fillStyle = "#F8F6F1"; x.beginPath(); STAGE.curP[c].forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); x.closePath(); x.fill(); // on the paper's own white, so the bands it's gathered in lay over each other without showing
      S.pieceOf(ins, x, st, 0, false, [STAGE.cur[c]]);
      return (ins.curC[c] = Object.assign(cv, { x0, y0, w, h }));
    },
    /** how far across a curtain reaches at height v (the drawing's units), gathered to its tie-back as it opens (o: 0 … 1) */
    crownGather(v, o) { const y = v * 100 + 100, t = (y - 112) / 40, shape = .12 + (y < 112 ? .17 : .09) * Math.min(1, t * t); return lerp(1, shape, o); },
    /** a member of the crown's company, made for its size on the stage: its subject (or the balloon's own lines and paint),
     *  just the parts that come on (the rest is its scenery), its lines drawn once and held still */
    crownMember(i) {
      const [id, only, sx, sy, h, mir] = CAST[i], keep = S.RR, fit = [1e9, 1e9, -1e9, -1e9], put = pts => { for (const [u, v] of pts) { fit[0] = Math.min(fit[0], u); fit[1] = Math.min(fit[1], v); fit[2] = Math.max(fit[2], u); fit[3] = Math.max(fit[3], v); } };
      const sub = id ? SUBJECTS[id](0) : null; if (sub) { for (const k of only) for (const s of sub.parts[k].strokes) put(s[0]); } else { put(CONTOUR); put(BASKET); }
      const s = (h / 100) / (fit[3] - fit[1]), RR = Math.max(6, keep * s), jit = boil(5, .3 / RR); S.RR = RR;
      let ins;
      if (sub) ins = { sub, RR, key: "cast" + i, spr: sub.sprites ? sub.sprites(mk) : null, drops: [],
        washes: sub.parts.map((pt, k) => only.includes(k) ? pt.washes.map((w, j) => S.washOf(w[0], w[1], w[2], 211 + id * 97 + k * 31 + j * 17, w[6])) : []),
        ink: sub.parts.map((pt, k) => { if (!only.includes(k) || !pt.strokes.length) return null; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const st2 of pt.strokes) for (const [u, v] of st2[0]) { x0 = Math.min(x0, u); y0 = Math.min(y0, v); x1 = Math.max(x1, u); y1 = Math.max(y1, v); } const m = .05, [c] = canvas(Math.ceil((x1 - x0 + 2 * m) * RR * px), Math.ceil((y1 - y0 + 2 * m) * RR * px)); return { c, x0: x0 - m, y0: y0 - m, w: x1 - x0 + 2 * m, h: y1 - y0 + 2 * m, key: null }; }) };
      else { ins = { washes: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => S.washOf(WASH[w][0], WASH[w][1], WASH[w][2], 101 + w * 17)) }; const [c] = canvas(Math.ceil(2.3 * RR * px), Math.ceil(2.3 * RR * px)), x2 = c.getContext("2d"); x2.setTransform(px * RR, 0, 0, px * RR, 1.15 * RR * px, 1.15 * RR * px); x2.lineCap = "round"; x2.lineJoin = "round"; S.inkInto(x2, () => 1, jit, 1, STROKES.slice(1)); ins.inkC = c; }
      const st = { A: 0, T: 0, I: 1, jit, fin: 0, live: false, alive: 0, prog: () => 1, inkKey: "cast", w: sub ? sub.parts.map(pt => pt.washes.map(() => 1)) : null, wet: sub ? sub.parts.map(pt => pt.washes.map(() => 0)) : null, birds: 1, fly: 0, drops: [] };
      const m = .14, bx = fit[0] - m, by = fit[1] - m, bw = fit[2] - fit[0] + 2 * m, bh = fit[3] - fit[1] + 2 * m, [spr, x] = canvas(Math.ceil(bw * RR * px), Math.ceil(bh * RR * px)); // all of it drawn once into a sprite of its own, its lines held still
      x.imageSmoothingEnabled = true; x.setTransform(px * RR, 0, 0, px * RR, -bx * px * RR, -by * px * RR); x.lineCap = "round"; x.lineJoin = "round";
      if (sub) S.pieceOf(ins, x, st, 0, false, only); else { for (const c of ins.washes) x.drawImage(c, c.x0, c.y0, c.lw, c.lh); x.drawImage(ins.inkC, -1.15, -1.15, 2.3, 2.3); }
      S.RR = keep;
      return { id, spr, box: [bx, by, bw, bh], s, mir, foot: [(fit[0] + fit[2]) / 2, fit[3]], at: [U(sx), U(sy)], dir: sx < 96 ? 1 : sx > 104 ? -1 : 0 };
    },
    /** the company, made a member a frame until the curtains open (all of it at once if it's wanted sooner) */
    crownCast(T) {
      if (!S.cc || S.cc.RR !== S.RR) S.cc = { RR: S.RR, m: [] };
      const want = T >= CRB.open[0] - .4 ? CAST.length : Math.min(CAST.length, S.cc.m.length + 1);
      while (S.cc.m.length < want) S.cc.m.push(S.crownMember(S.cc.m.length));
      return S.cc.m;
    },
    /** the company on the stage, in the drawing's units, the back row first: each bows about its feet, one after another
     *  down the line and then all together, a little rise before each */
    crownCompany(x, T) {
      const list = S.cc ? S.cc.m : [];
      for (let i = 0; i < list.length; i++) {
        const m = list[i], j = CAST_X.indexOf(i), t0 = CRB.wave[0] + j * .16, b0 = CRB.bow[0], b1 = CRB.bow[1];
        const k = Math.max(env(T, t0, t0 + .24, t0 + .3, t0 + .62, E.io), 1.15 * env(T, b0, b0 + .3, b1 - .3, b1, E.io)), ant = env(T, t0 - .14, t0 - .03, t0, t0 + .08) + env(T, b0 - .16, b0 - .04, b0, b0 + .08);
        x.save(); x.translate(m.at[0], m.at[1]); x.rotate(m.dir * .42 * k); x.scale(m.s * (1 - .02 * ant) * (m.mir ? -1 : 1), m.s * (1 - (m.dir ? .08 : .22) * k + .05 * ant)); x.translate(-m.foot[0], -m.foot[1]);
        x.drawImage(m.spr, m.box[0], m.box[1], m.box[2], m.box[3]); x.restore();
      }
    },
    /** the theatre into context x, in the drawing's units: the backdrop and the company in the gap between the curtains,
     *  the stage under them, the curtains gathered as far as they're open (o: 0 closed … 1 open), the arch over all, the
     *  footlights (lit) and the flowers on the stage */
    crownTheatre(x, ins, st, o, T, A, fin, lit) {
      const ga = x.globalAlpha, open = o > .002, N = 52, top = U(46), bot = U(150);
      const edge = (c, v) => { const xo = U(c ? 174 : 26); return xo + (c ? -1 : 1) * ((U(100) - U(26)) * S.crownGather(v, o) - .03); }; // (a little under each curtain, so no paper shows between)
      const gap = () => { x.beginPath(); for (let b = 0; b <= N; b++) { const v = lerp(top, bot, b / N); b ? x.lineTo(edge(0, v), v) : x.moveTo(edge(0, v), v); } for (let b = N; b >= 0; b--) { const v = lerp(top, bot, b / N); x.lineTo(edge(1, v), v); } x.closePath(); };
      if (open) { x.save(); gap(); x.clip(); S.pieceOf(ins, x, st, 0, false, [STAGE.back]); x.restore(); }
      S.pieceOf(ins, x, st, 0, false, [STAGE.floor]);
      if (open) { x.save(); gap(); x.clip(); S.crownCompany(x, T); x.restore(); }
      STAGE.cur.forEach((k, c) => {
        if (!open && st.T < 9.1) { S.pieceOf(ins, x, st, 0, false, [k]); return; } // (drawn as it's drawn and painted; then held, and gathered)
        const cv = S.crownCurtain(ins, st, c), xo = U(c ? 174 : 26), sh = cv.height / cv.h, bands = (y, oo) => { for (let b = 0; b < N; b++) { const v0 = lerp(top, bot, b / N), v1 = lerp(top, bot, (b + 1) / N), f = S.crownGather((v0 + v1) / 2, oo); y.drawImage(cv, 0, (v0 - cv.y0) * sh, cv.width, (v1 - v0) * sh + .5, xo + (cv.x0 - xo) * f, v0, cv.w * f, v1 - v0 + .002); } }; // in bands, each drawn in to its own width
        if (o < .001) x.drawImage(cv, cv.x0, cv.y0, cv.w, cv.h); // closed: as it hangs
        else if (o > .999) { if (!cv.open) { const [c2, y] = canvas(cv.width, cv.height); y.imageSmoothingEnabled = true; y.setTransform(cv.width / cv.w, 0, 0, sh, -cv.x0 * cv.width / cv.w, -cv.y0 * sh); bands(y, 1); cv.open = c2; } x.drawImage(cv.open, cv.x0, cv.y0, cv.w, cv.h); } // open: gathered once, and held
        else bands(x, o);
        if (o > .82) { const v = U(112), e = edge(c, v) + (c ? -.03 : .03), xo2 = U(c ? 174 : 26); x.strokeStyle = rgba([196, 150, 52], .9 * clamp((o - .82) * 8)); x.lineWidth = 2.2 / S.RR; x.beginPath(); x.moveTo(xo2, v - .01); x.quadraticCurveTo((xo2 + e) / 2, v + .02, e + (c ? -.006 : .006), v + .004); x.stroke(); } // the tie-back
      });
      S.pieceOf(ins, x, st, 0, false, [STAGE.frame]);
      if (lit > .002) { for (const [u, v] of STAGE.LAMPS) { x.globalAlpha = ga * lit * .85; x.drawImage(ins.glow, u - .09, v - .1, .18, .18); } x.globalAlpha = ga; }
      for (const r of ROSES) { const tt = (T - r.t) / .5; if (tt <= 0) continue; const f = Math.min(1, tt), u = lerp(r.x0, r.x1, f), v = lerp(r.y0, r.y1, f) - .5 * 4 * f * (1 - f), rot = r.rest + r.spin * (1 - E.out(f)); x.globalAlpha = ga * clamp(tt * 6); rose(x, u, v, rot, .045); x.globalAlpha = ga; }
    },
    /** 1.12 b448: the crown's pass (K.long 3: the sixth hour of the list left alone, and every sixth after) — the drawing
     *  the pass before left, rubbed out; the theatre drawn and painted, the curtain call, the set struck; then this pass's
     *  subject drawn and painted as any pass's is, only quicker and without its moment, so the pass ends on the very picture
     *  the next one starts from; worked out from the pass and the time alone */
    crownPass(T, I, A, F, P) {
      const { W, H } = S, on = I > .01;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl; S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4)); if (S.vis < .01) return;
      if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) S.build();
      if (S.plP !== P) { const cur = planOf(P), prev = planOf(P - 1); S.pl = { cur, prev }; S.plP = P; for (const k of [...S.subs.keys()]) if (k !== cur.key + "@" + S.RR && k !== prev.key + "@" + S.RR) S.subs.delete(k); }
      const { cx, cy, R } = S, { cur, prev } = S.pl, iN = S.inst(cur), iO = S.inst(prev), fin = F >= 0 ? env(F, .05, .15, .55, .85, E.sine) : 0;
      const fr = Math.floor(A * 8), jit = boil(fr, .35 / S.RR), stO = S.stOf(iO, false, T, I, A, F, fin, jit, fr);
      const [e0, e1] = CRB.erase, erasing = on && T > e0 && T < e1, gone = on && T >= e1, [k0, k1] = CRB.strike, striking = on && T > k0 && T < k1, struck = on && T >= k1;
      // this pass's subject from `sub` on, on a clock of its own (Ts) that runs from its first line to its last wash dried by the pass's end
      const Ts = 1.95 + Math.max(0, T - CRB.sub) * (9.85 - 1.95) / (14.82 - CRB.sub), sub = gone && T >= CRB.sub, pr2 = (t0, t1) => seg(Ts, t0, t1, x => x);
      const inkKey = fr + ":" + (Ts < 6.5 ? Math.round(Ts * 30) : "all") + ":" + S.RR, finD = F >= 0 ? S.fin.map(d => ({ ...d, k: seg(F, d.t, d.t + .12, x => x), a: 1 - seg(F, .8, 1) })) : [], dropsOf = list => [...list.map(d => ({ ...d, k: seg(Ts, d.t + .1, d.t + .25, x => x), a: 1 })), ...finD];
      const stN = !sub ? null : iN.balloon ? { A, jit, prog: pr2, inkKey, w: WASH.map(([, , , t0, t1]) => pr2(t0, t1)), wet: WASH.map(([, , , t0, t1]) => env(Ts, t0, t0 + .1, t1 + .2, t1 + .9) * I), cp: CSTROKES.map(([, t0, t1]) => pr2(t0, t1)), ghost: [1, 1], ghostB: 1, cloud: [Math.sin(A * .12) * .03, Math.sin(A * .1 + 2) * .025], birds: seg(Ts, 6.16, 6.4, x => x), fly: 0, lift: -fin * .12 + Math.sin(A * .9) * .01, sway: Math.sin(A * .7) * .025 * .35, flame: (.15 + .1 * Math.sin(A * 5) * Math.sin(A * 3.3) + fin) * pr2(4.65, 4.75), drops: dropsOf(S.drops) }
        : { A, T: Ts, I, jit, fin, live: false, redraw: true, alive: 0, prog: pr2, inkKey, w: iN.sub.parts.map(pt => pt.washes.map(w => pr2(w[3], w[4]))), wet: iN.sub.parts.map(pt => pt.washes.map(w => env(Ts, w[3], w[3] + .1, w[4] + .2, w[4] + .9) * I)), birds: seg(Ts, 6.16, 6.4, x => x), fly: 0, drops: dropsOf(iN.drops) };
      // the theatre, on a clock of its own (Tq); how far the curtains are open (o); the footlights (lit); the company, made a member a frame
      const stage = gone && T < k1 + 2 ? S.crownStage() : null, Tq = stageT(T), pq = (t0, t1) => seg(Tq, t0, t1, x => x);
      const stS = stage ? { A, T: Tq, I, jit, fin, live: false, redraw: true, alive: 0, prog: pq, inkKey: (Tq < 6.5 ? fr + ":" + Math.round(Tq * 30) : "all") + ":" + S.RR, w: STAGE.parts.map(pt => pt.washes.map(w => pq(w[3], w[4]))), wet: STAGE.parts.map(pt => pt.washes.map(w => env(Tq, w[3], w[3] + .1, w[4] + .2, w[4] + .9) * I)), birds: 1, fly: 0, drops: [] } : null;
      const o = E.io(seg(T, CRB.open[0], CRB.open[1])) - E.io(seg(T, CRB.close[0], CRB.close[1])), lit = env(T, CRB.lights[0], CRB.lights[1], CRB.close[0], CRB.close[1] - .2);
      if (on && T < CRB.close[1]) S.crownCast(T);
      const rot = ([u, v]) => { const c = Math.cos(cur.ang), s = Math.sin(cur.ang); return [u * c - v * s, u * s + v * c]; };
      if (!gone && !erasing) { g.save(); g.globalAlpha = S.vis; g.translate(cx, cy); g.scale(R, R); S.pieceOf(iO, g, stO, prev.mirror); g.restore(); }
      else if (erasing) { // the drawing the pass before left, drawn aside and rubbed out there, row after row
        const size = Math.ceil(2.3 * R * px); if (!S.comp || S.comp.width !== size) [S.comp] = canvas(size, size);
        const x = S.comp.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, size, size); x.setTransform(px * R, 0, 0, px * R, 1.15 * R * px, 1.15 * R * px); x.imageSmoothingEnabled = true; x.lineCap = "round"; x.lineJoin = "round";
        S.pieceOf(iO, x, stO, prev.mirror);
        const e = seg(T, e0, e1, x2 => x2), s = EL2[EL2.length - 1] * e; x.globalCompositeOperation = "destination-out"; x.strokeStyle = `rgba(0,0,0,${I.toFixed(3)})`; x.lineWidth = .46; x.beginPath(); let p0 = rot(EP2[0]); x.moveTo(p0[0], p0[1]); for (let i = 1; i < EP2.length && EL2[i - 1] < s; i++) { const f = clamp((s - EL2[i - 1]) / (EL2[i] - EL2[i - 1])), q = rot([lerp(EP2[i - 1][0], EP2[i][0], f), lerp(EP2[i - 1][1], EP2[i][1], f)]); x.lineTo(q[0], q[1]); } x.stroke(); x.globalCompositeOperation = "source-over";
        g.globalAlpha = S.vis; g.drawImage(S.comp, cx - 1.15 * R, cy - 1.15 * R, 2.3 * R, 2.3 * R); g.globalAlpha = 1;
      } else { // rubbed out: a ghost of it a moment; the theatre, and after the strike its ghost; then this pass's subject; a touch brings the old one back as it eases
        g.save(); g.translate(cx, cy); g.scale(R, R);
        if (I < .99) { g.globalAlpha = S.vis * (1 - I); S.pieceOf(iO, g, stO, prev.mirror); }
        const gh = .07 * I * (1 - seg(T, e1 + 1, e1 + 2.2)); if (gh > .002) { g.globalAlpha = S.vis * gh; S.pieceOf(iO, g, stO, prev.mirror, true); }
        if (stage && T <= k0) { g.globalAlpha = S.vis * I; S.crownTheatre(g, stage, stS, o, T, A, fin, lit); }
        const gs = stage && struck ? .07 * I * (1 - seg(T, k1 + .5, k1 + 1.7)) : 0; if (gs > .002) { g.globalAlpha = S.vis * gs; S.pieceOf(stage, g, stS, 0, true, [STAGE.floor, STAGE.frame, ...STAGE.cur]); }
        if (sub) { g.globalAlpha = S.vis * I; S.pieceOf(iN, g, stN, cur.mirror); }
        g.restore(); g.globalAlpha = 1;
        if (striking && stage) { // the set struck: the theatre, drawn aside and rubbed out there, row after row
          const size = Math.ceil(2.3 * R * px); if (!S.comp || S.comp.width !== size) [S.comp] = canvas(size, size);
          const x = S.comp.getContext("2d"); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, size, size); x.setTransform(px * R, 0, 0, px * R, 1.15 * R * px, 1.15 * R * px); x.imageSmoothingEnabled = true; x.lineCap = "round"; x.lineJoin = "round";
          S.crownTheatre(x, stage, stS, 0, T, A, fin, 0);
          const e = seg(T, k0, k1, x2 => x2), s = EL2[EL2.length - 1] * e; x.globalCompositeOperation = "destination-out"; x.strokeStyle = "#000"; x.lineWidth = .46; x.beginPath(); x.moveTo(EP2[0][0], EP2[0][1]); for (let i = 1; i < EP2.length && EL2[i - 1] < s; i++) { const f = clamp((s - EL2[i - 1]) / (EL2[i] - EL2[i - 1])); x.lineTo(lerp(EP2[i - 1][0], EP2[i][0], f), lerp(EP2[i - 1][1], EP2[i][1], f)); } x.stroke(); x.globalCompositeOperation = "source-over";
          g.globalAlpha = S.vis * I; g.drawImage(S.comp, cx - 1.15 * R, cy - 1.15 * R, 2.3 * R, 2.3 * R); g.globalAlpha = 1; }
      }
      const tool = (spr, sh, [sx, sy], lift, ang, a) => { if (a <= .005) return; g.globalAlpha = a * S.vis; g.save(); g.translate(sx + 6 + lift * 10, sy + 9 + lift * 14); g.rotate(ang); g.drawImage(sh, -sh.w2 * .06, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy - lift * 6); g.rotate(ang); g.drawImage(spr, 0, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; };
      const ta = S.toolAng || -.62;
      // the eraser at work, its crumbs flying: the drawing the pass before left, and the set
      for (const [a0, a1, turn] of [[e0, e1, true], [k0, k1, false]]) if (on && T > a0 && T < a1 + .9) {
        const e = seg(T, a0, a1, x => x), at = q => turn ? rot(q) : q;
        for (const c of S.crumbs) { if (c.e > e) continue; const te = a0 + c.e * (a1 - a0), dtc = T - te; if (dtc > .9) continue; const [u, v] = at(along(EP2, EL2, c.e)), x = cx + (u + c.vx * dtc) * R, y = cy + (v + c.vy * dtc + .9 * dtc * dtc) * R; g.strokeStyle = rgba(c.c, (1 - dtc / .9) * .8 * I * S.vis); g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 2.2, c.rot, c.rot + 2.4); g.stroke(); }
        if (T < a1) { const [u0, v0, d0] = along(EP2, EL2, e), sc = Math.sin(A * 34) * .09, [u, v] = at([u0 - Math.sin(d0) * sc, v0 + Math.cos(d0) * sc]), rt = d0 + (turn ? cur.ang : 0) + Math.sin(A * 24) * .12, spr = S.eraserS, sh = S.eraserSh, sx = cx + u * R, sy = cy + v * R;
          g.globalAlpha = I * S.vis; g.save(); g.translate(sx + 5, sy + 7); g.rotate(rt); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(sx, sy); g.rotate(rt); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; }
      }
      // the pencil drawing the theatre and the brush painting it, on its clock
      if (stage && on && Tq > 1.95 && Tq < 9.1) { const tl = S.toolsAt(stage, Tq);
        if (tl.pen) tool(S.pencil, S.pencilSh, S.toScr(stage, stS, 0, tl.pen.k, tl.pen.at[0], tl.pen.at[1]), tl.pen.lift, ta + tl.pen.lift * .06, I * env(Tq, 1.95, 2.05, 6.35, 6.5));
        if (tl.brush) tool(S.brush, S.brushSh, S.toScr(stage, stS, 0, tl.brush.k, tl.brush.at[0], tl.brush.at[1]), tl.brush.lift * .4, ta * 1.12, I * env(Tq, 6.4, 6.5, 9.0, 9.1)); }
      // the tools' own bow, in front of the closed curtains: in from the side one after another, a hop as each stops, a bow together, and off
      if (on && T > CRB.tools[0] && T < CRB.tools[1]) { const [t0, t1] = CRB.tools, bowK = env(T, t0 + .5, t0 + .66, t0 + .74, t0 + .9, E.io);
        [[S.pencil, S.pencilSh, -.28], [S.brush, S.brushSh, 0], [S.eraserS, S.eraserSh, .28]].forEach(([spr, sh, u], i) => {
          const tin = t0 + i * .07, k = E.out(seg(T, tin, tin + .34)), out = E.in(seg(T, t1 - .3 + i * .05, t1 - .02 + i * .05)), hop = Math.abs(Math.sin(seg(T, tin, tin + .34) * Math.PI * 3)) * (1 - k) * .05, v = U(STAGE.fy(100 + u * 100)) - .055;
          const x = cx + (lerp(1.1, u, k) + out * 1.3) * R, y = cy + (v - hop) * R, ang = -Math.PI / 2 - bowK * .34, dip = 1 - .24 * bowK; // a bow: its top dipping to us as it leans
          g.globalAlpha = S.vis * I; g.save(); g.translate(x + 5, y + 4); g.rotate(ang); g.scale(dip, 1); g.drawImage(sh, -sh.w2 * .06, -sh.h2 / 2, sh.w2, sh.h2); g.restore(); g.save(); g.translate(x, y); g.rotate(ang); g.scale(dip, 1); g.drawImage(spr, 0, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); g.globalAlpha = 1; }); }
      // then this pass's subject: the pencil while it draws, the brush while it paints, on its own clock
      if (sub && Ts > 1.95 && Ts < 9.1) { const tl = S.toolsAt(iN, Ts);
        if (tl.pen) tool(S.pencil, S.pencilSh, S.toScr(iN, stN, cur.mirror, tl.pen.k, tl.pen.at[0], tl.pen.at[1]), tl.pen.lift, ta + tl.pen.lift * .06, I * env(Ts, 1.95, 2.05, 6.35, 6.5));
        if (tl.brush) { const fl = (iN.balloon ? FLICKS : iN.sub.flicks).reduce((m, t) => Math.max(m, env(Ts, t - .06, t, t + .02, t + .14)), 0); tool(S.brush, S.brushSh, S.toScr(iN, stN, cur.mirror, tl.brush.k, tl.brush.at[0], tl.brush.at[1]), tl.brush.lift * .4, ta * 1.12 - Math.sign(ta) * fl * .5, I * env(Ts, 6.4, 6.5, 9.0, 9.1)); } }
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
      if (P > 0) { const L = K.long(P); if (K.egg(P)) S.eggPass(T, I, A, F, P); else if (L === 1 || L === 2) S.hourPass(T, I, A, F, P, L); else if (L === 3) S.crownPass(T, I, A, F, P); else S.drawPass(T, I, A, F, P); if (L !== 3 && S.cst) S.cst = S.cc = null; return; } // b416: every twelfth pass, the egg; b427: once an hour, an hour egg; b448: in the sixth hour and every sixth, the crown (its theatre and its company let go once it's over)
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
