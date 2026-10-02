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
//
// 1.12 b373: the forever cycle. The loop above is pass 0. Each pass after it lays a picture of its own in the medallion
// (by night, burns one), and it stays there through the quiet after it (the scene carries) until the next pass planes it
// back to the plank, or glows it to ash, and lays or burns another; a touch mid-pass eases back to the one the pass began
// on. The pictures are the same by day and by night, drawn once both ways: the signature's country; a compass rose, its
// ground in sixteen wedges of two woods and its points halved light and dark; a schooner under sail on an evening sea, the
// sun going down behind her; a lighthouse on its rock at dusk, its two beams across the sky; a robin on a branch before
// the full moon, its leaves in two greens and its berries; and an oak leaf in two autumn woods with its veins let in in
// holly, and an acorn, on a parquet ground. By day each comes in as the country does, the banding spun in and then piece by
// piece from past the edge away from the words, each dropping in with its puff of sawdust, and is oiled; by night the pen
// burns it line by line, hatching along the lie of each face, stippling the moon and the sun, and it cools to ash. A pass
// deals which picture (each run of passes lays them all once, never the same twice running) and, for all but the compass,
// which way it faces, and with that a second look: a later hour for the schooner, cherry in the lighthouse's bands, a
// harvest moon behind the robin, other woods for the leaf, holly in the stag's sky. About one pass in ten, never two within four passes, is the rare one: a stag on the ridge before
// the setting sun, the sky in rays behind him. The finale lifts, or flares, whichever picture is up.
//
// 1.12 b417: the egg. Every twelfth pass (K.egg: three minutes of the list left alone) the medallion turns out to have been
// a sliding puzzle all along. Cuts run across the inlay along new glue lines (by night they burn through the char, white-hot
// at the head and cooling behind it): a square of sixteen tiles in its middle and the four caps of inlay round it. The
// bottom-right tile lifts out and goes off past the edge away from the words, and twelve slides jumble the picture; then
// every piece turns over in a wave from the top left, and on their backs is the picture the pass would have laid, jumbled
// the same way. It slides home, the missing tile comes back the other way up and drops into its gap with a click and a puff
// of sawdust (by night, of ash and a spark or two), and the cuts close under a sheen (by night, fused by a run of heat).
// By night the cuts smoulder while the tiles slide, and an ember glows down in the gap. It plays in place of the plane and
// the rag (the glow and the pen) and leaves the picture that pass would have left, so the pass after it rests on what it
// always would have; a touch eases back to the picture it began on, as any pass does.
//
// 1.12 b431: the long day's hour eggs. Once in each hour of the list left alone (K.long: the first in odd hours, the
// second in even) a pass of its own, in place of the plane and the rag (the glow and the pen), from the picture the pass
// began on to the one it would have left, so the pass after it rests where it always would. The first: the cuckoo. It is
// an hour egg, so the medallion is a clock for the hour: its marks tapped in round it, its hands dropped on and set to
// the hour before, a door cut in its top; the minute hand goes once round, an hour passing, and behind it the picture
// turns to the next (by night it is burned again in the hand's wake, white-hot and cooling, the old lines catching and
// crumbling ahead of it); at the hour the door opens and the cuckoo comes out on its perch and calls it, once for every
// hour the list has been up (round again after twelve), bowing, beak and wings and tail, without a sound (by night a puff
// of smoke with each call, the ember in its house behind it); it goes in, the door shuts, the clock is taken off again
// and the cut closes. The second: the clockwork. The medallion opens like the iris of a lens — cuts run out from its
// middle, and eight blades turn back under the banding, each carrying its piece of the picture — and behind it a clock
// is going: a movement cut from the same woods, its wheels turning, the escape wheel stepping a tooth at each swing of a
// long pendulum, and it strikes the hours the list has been up on a bell, each stroke's sound drawn as a ring running
// out over the works (by night all of it charred, an ember glowing down in the works, a spark at every tick, the bell
// glowing as it is struck). Then the blades come back, and the picture on them is the next.
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
    // (the forever cycle's pictures: a deep blue, a pale one, a second green)
    navy: { dry: ["#56758C", "#415F76", "#7090A6"], oil: ["#2F5069", "#1E3B53", "#476B86"], step: 3, wob: .04, ga: .36, fig: "ribbon" },
    sky: { dry: ["#BACDD6", "#A2B8C4", "#D4E1E8"], oil: ["#92B2C3", "#7699AD", "#B0CCDB"], step: 3.2, wob: .04, ga: .3, fig: "ribbon" },
    rust: { dry: ["#CC6E3E", "#A9522A", "#E08D5E"], oil: ["#B54E22", "#8A3514", "#D26E3C"], step: 2.8, wob: .07, ga: .44, fig: "ribbon" },
    olive: { dry: ["#8C9C5C", "#72834B", "#A6B676"], oil: ["#6C7E3D", "#54642D", "#889C56"], step: 2.8, wob: .05, ga: .4 },
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

  function drawDay(T, I, A, F, P) {
    const { W, H } = S; g.clearRect(0, 0, W, H);
    glide(A); if (S.vis < .01) return;
    if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) buildDay();
    const pp = passOf(P), cur = pp.cur, prev = pp.prev; // what the pass lays, and what it rests on
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
    const egg = K.egg(P) && pp.P > 0; // (1.12 b417: on an egg pass the puzzle plays instead of the plane, the pieces and the rag)
    const lg = !egg && pp.P > 0 ? longOf(P) : 0, quiet = egg || lg > 0, hw = lg ? hourWin(P, lg) : null; // (1.12 b431: an hour egg plays instead of them too)
    if (egg) eggDay(T, I, prev, cur);
    else if (lg === 1) cuckooDay(T, I, A, prev, cur, ckPlan(P));
    else if (lg === 2) clockDay(T, I, A, prev, cur, P);
    else if (phase === 0) { if (!pp.P || !on || T < BD.plane[0]) put(prev.oiled); else { put(cur.oiled); put(prev.oiled, 1 - I); } }
    else if (phase === 1) { // the plane has taken these bands back to the plank
      g.save(); g.beginPath(); g.rect(cx - 1.1 * R, cy - 1.1 * R, 2.2 * R, 2.2 * R);
      BD.passes.forEach(([a, b], j) => { const s = E.sine(seg(T, a, b, lin)); if (s <= 0 || I <= .01) return; const xb = lerp(1.12, s >= 1 ? -1.12 : lerp(SPAN[j], S.pstop[j], s), I); /* cut up to the blade, under the plane */ g.rect(cx + xb * R, cy + BANDS[j][0] * R, (1.12 - xb) * R, (BANDS[j][1] - BANDS[j][0]) * R); });
      g.clip("evenodd"); put(prev.oiled); g.restore();
    } else if (phase === 2 && !cur.sig) { // a new picture's pieces come in, one by one, over the banding spun in
      const L2 = v => lerp(1, v, I * I), ringQ = L2(seg(T, BD.ring[0], BD.ring[1], lin)), qs = cur.pieces.map(p => L2(seg(T, p.t0, p.t1, lin))), ringDone = ringQ >= 1, RR = S.RR, n = Math.ceil(2.1 * RR * px);
      put(S.landed(n, n, "P" + cur.key + (ringDone ? "r" : "") + qs.map(q => q >= 1 ? 1 : 0).join("") + RR, x => {
        x.imageSmoothingEnabled = true; x.setTransform(px * RR, 0, 0, px * RR, 1.05 * RR * px, 1.05 * RR * px); cur.pieces.forEach((p, i) => { if (qs[i] >= 1) x.drawImage(p.spr, p.bb.x0, p.bb.y0, p.bb.x1 - p.bb.x0, p.bb.y1 - p.bb.y0); }); if (ringDone) x.drawImage(S.ringDry, -1.02, -1.02, 2.04, 2.04); x.setTransform(1, 0, 0, 1, 0, 0); }));
      cur.pieces.forEach((p, i) => { const q = qs[i]; if (q <= 0 || q >= 1) return; const [x, y, rot, z] = fly(p, q); piece(p, x, y, rot, z); });
      if (ringQ > 0 && !ringDone) { const [dx, dy] = S.away, D = out(cx, cy, dx, dy) + 1.1 * R + 30, e = E.out(ringQ), x = cx + dx * D * (1 - e), y = cy + dy * D * (1 - e), rot = -(1 - E.back(ringQ)) * TAU * 1.15, z = 1 - seg(ringQ, .7, 1, E.in), sc = 1 + .05 * z;
        if (z > .01) { g.save(); g.globalAlpha = V * Math.min(1, z * 2) * .9; g.translate(x + (3 + 10 * z) * k, y + (5 + 15 * z) * k); g.rotate(rot); g.drawImage(S.ringSh, -1.02 * R - 10 * k, -1.02 * R - 10 * k, 2.04 * R + 20 * k, 2.04 * R + 20 * k); g.restore(); }
        g.save(); g.globalAlpha = V; g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.drawImage(S.ringDry, -1.02 * R, -1.02 * R, 2.04 * R, 2.04 * R); g.restore(); }
      g.fillStyle = "#C9AD80"; for (const p of cur.pieces) { const q = (T - p.t1) / .45; if (q < 0 || q > 1) continue; const r = rng(p.seed); for (let s = 0; s < 8; s++) { const a = r() * TAU, d = (p.L * .55 + .05 + .16 * E.out(q)) * R; g.globalAlpha = V * I * (1 - q) * .8; const sz = (1.2 + r() * 1.6) * Math.max(1, k); g.fillRect(cx + (p.c[0] + Math.cos(a) * d / R) * R, cy + (p.c[1] + Math.sin(a) * d / R) * R - q * 6, sz, sz); } } g.globalAlpha = 1;
      put(prev.oiled, Math.pow(1 - I, 1.6));
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
      put(prev.oiled, Math.pow(1 - I, 1.6));
    } else if (phase === 3) { put(cur.dry); put(prev.oiled, 1 - I); }
    else { put(cur.dry); g.save(); wiped(); put(cur.oiled); g.restore(); if (pp.P) put(prev.oiled, 1 - I); } // the oil: what the rag has wiped deepens
    // the wet shine the rag leaves, drying
    if (!quiet && on && T > BD.wipes[0][0] && T < BD.wipes[2][1] + 1.9) BD.wipes.forEach(([, b], j) => { const wet = (1 - seg(T, b + .2, b + 1.9, E.sine)) * I; if (T < BD.wipes[j][0] || wet <= .01) return;
      g.save(); wiped(j); g.globalCompositeOperation = "screen"; put(S.gloss, .55 * wet); g.restore(); });
    // the light over it: a sheen drifting while the list is in use, and one running across once the oil is on
    const sheen = (s, a, w = .5) => { if (a <= .004) return; const dx = .83, dy = .56, q = g.createLinearGradient(cx + dx * (s - w) * R, cy + dy * (s - w) * R, cx + dx * (s + w) * R, cy + dy * (s + w) * R);
      q.addColorStop(0, "rgba(255,246,226,0)"); q.addColorStop(.5, `rgba(255,246,226,${clamp(a).toFixed(3)})`); q.addColorStop(1, "rgba(255,246,226,0)");
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip(); g.globalCompositeOperation = "soft-light"; g.fillStyle = q; g.fillRect(cx - R, cy - R, 2 * R, 2 * R); g.restore(); };
    const present = lerp(1, 1 - (hw ? env(T, hw[0] - .3, hw[0] + .2, hw[2], hw[3], E.sine) : egg ? env(T, EW.crack[0] - .3, EW.crack[0] + .2, EW.seal[0], EW.seal[1], E.sine) : env(T, BD.plane[0] - .2, BD.plane[0] + .3, BD.rag[1], BD.rag[3], E.sine)), I);
    sheen(Math.sin(A * .12) * 1.25, .5 * V * present);
    if (on) { const sq = hw ? [hw[2], hw[3]] : egg ? EW.seal : BD.sheen, q = seg(T, sq[0], sq[1], lin); if (q > 0 && q < 1) { sheen(lerp(-1.7, 1.7, E.io(q)), .95 * I * V, .42); sheen(lerp(-1.7, 1.7, E.io(q)), .35 * I * V, .12); } }
    // the plane and its curls
    if (!quiet && on && T > BD.plane[0] && T < BD.plane[3] + BD.roll) {
      for (let j = 0; j < 3; j++) { const c = curlAt(j, T); if (c && !c.inPlane) S.curl(j, c, I * V, prev.shave); }
      const pl = planeAt(T);
      if (pl) { const bx = cx + pl.x * R, by = cy + pl.y * R, sc = 1 + .05 * pl.z, Lp = S.Lp * k, Wp = S.Wp * k, b = 7 * k, dim = I * V;
        g.save(); g.globalAlpha = dim * (1 - .35 * pl.z); g.translate(bx + (5 + 22 * pl.z) * k, by + (8 + 28 * pl.z) * k); g.scale(sc, sc); g.drawImage(S.planeSh, -Lp * MOUTH - 2 * b, -Wp / 2 - 2 * b, Lp + 4 * b, Wp + 4 * b); g.restore();
        g.save(); g.globalAlpha = dim; g.translate(bx, by); g.scale(sc, sc); g.drawImage(S.plane, -Lp * MOUTH, -Wp / 2, Lp, Wp); g.restore();
        for (let j = 0; j < 3; j++) { const c = curlAt(j, T); if (c && c.inPlane) S.curl(j, c, dim, prev.shave); } }
    }
    // the rag
    if (!quiet && on) { const rg = ragAt(T); if (rg) { const x = cx + rg.x * R + Math.sin(A * 23) * .012 * R * (rg.j !== undefined ? 1 : 0), y = cy + rg.y * R + Math.cos(A * 19) * .01 * R, rot = Math.sin(A * 3.1) * .08 + (rg.j !== undefined ? Math.sin(A * 17) * .05 : 0), sc = 1 + .06 * rg.z, rw = S.rw * k, rh = S.rh * k, b = 6 * k;
      g.save(); g.globalAlpha = I * V * .9; g.translate(x + (4 + 16 * rg.z) * k, y + (6 + 20 * rg.z) * k); g.rotate(rot); g.scale(sc, sc); g.drawImage(S.ragSh, -rw / 2 - 2 * b, -rh / 2 - 2 * b, rw + 4 * b, rh + 4 * b); g.restore();
      g.save(); g.globalAlpha = I * V; g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.drawImage(S.rag, -rw / 2, -rh / 2, rw, rh); g.restore(); } }
    if (egg && on) { eggCuts(T, I, false); eggClick(T, I, false); }
    /** a sheet of a new picture's (its ground, its sky) in the finale: each part lifting as the wave reaches it, its shadow
     *  cut to its shape, catching the light as it rises */
    const liftParts = (p, F) => { for (const q of p.parts) { const w0 = .06 + (q.c[0] + 1) * .27, z = env(F, w0, w0 + .08, w0 + .1, w0 + .24, E.sine); if (z <= .01) continue;
      const sx = cx + q.c[0] * R, sy = cy + q.c[1] * R - z * 9 * k, sc = 1 + .09 * z, path = () => { g.beginPath(); q.pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.closePath(); };
      g.save(); g.beginPath(); g.arc(cx, cy, RI * R * (1 + .09 * z), 0, TAU); g.clip(); g.globalAlpha = V * z * .28; g.translate(sx + 12 * z * k, sy + 18 * z * k); g.scale(sc, sc); g.translate(-q.c[0] * R, -q.c[1] * R); g.scale(R, R); path(); g.fillStyle = "rgb(78,52,26)"; g.fill(); g.restore();
      g.save(); g.globalAlpha = V; g.translate(sx, sy); g.scale(sc, sc); g.translate(-q.c[0] * R, -q.c[1] * R); g.scale(R, R); path(); g.clip(); trace(g, DISC.pts); g.clip(); g.drawImage(prev.oiled, -1.05, -1.05, 2.1, 2.1);
      g.globalCompositeOperation = "soft-light"; g.fillStyle = `rgba(255,248,228,${(.85 * z).toFixed(3)})`; g.fillRect(-1.1, -1.1, 2.2, 2.2); g.restore(); } };
    // the finale: the pieces lift and settle in a wave from left to right, the light running along with it
    if (F >= 0) {
      const fr = E.io(seg(F, .06, .7, lin)); sheen(lerp(-1.8, 1.8, fr), .9 * V * env(F, .04, .12, .62, .8), .35);
      for (const p of prev.pieces) { if (p.parts && p.parts.length > 3) { liftParts(p, F); continue; } /* a sheet: its parts one by one, in the wave */ const w0 = .06 + (p.c[0] + 1) * .27, z = env(F, w0, w0 + .08, w0 + .1, w0 + .24, E.sine); if (z <= .01) continue;
        const sx = cx + p.c[0] * R, sy = cy + p.c[1] * R - z * 9 * k, sc = 1 + .09 * z, w = (p.bb.x1 - p.bb.x0) * R, h = (p.bb.y1 - p.bb.y0) * R, b = 4 * k;
        g.save(); g.globalAlpha = V * z; g.translate(sx + 12 * z * k, sy + 18 * z * k); g.scale(sc, sc); g.drawImage(p.sh, (p.bb.x0 - p.c[0]) * R - 2 * b, (p.bb.y0 - p.c[1]) * R - 2 * b, w + 4 * b, h + 4 * b); g.restore();
        g.save(); g.globalAlpha = V; g.translate(sx, sy); g.scale(sc, sc); g.translate(-p.c[0] * R, -p.c[1] * R); g.scale(R, R); g.beginPath(); if (p.polys) for (const q of p.polys) { trace(g, q.pts); g.clip(); } else { for (const q of p.parts) { q.pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.closePath(); } g.clip(); trace(g, DISC.pts); g.clip(); } g.drawImage(prev.oiled, -1.05, -1.05, 2.1, 2.1);
        g.globalCompositeOperation = "soft-light"; g.fillStyle = `rgba(255,248,228,${(.85 * z).toFixed(3)})`; g.fillRect(-1.1, -1.1, 2.2, 2.2); g.restore(); } /* and catches the light as it rises */
    }
  }
  /** a curl of shaving from pass j: a roll lying across the band it cut, the band's colours wound round it, lit like a
   *  cylinder, and its end turned a little toward us so the spiral it's wound in shows (turning as it rolls) */
  function curl(j, c, a, src = S.shave) {
    const { cx, cy, R } = S, r = Math.max(2.5, c.rc * R), h = .64 * R, sp = src.width / 2.2, len = Math.PI * c.rc * 1.3;
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
  const tipAt = (t, M = MARKS) => {
    const [p0, p1, p2, p3] = BN.pen; if (t <= p0 || t >= p3) return null;
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
  function heat(rIn, rOut, amp, lines = true, pc = S) {
    if (amp <= .004 || rOut <= 0) return; const { cx, cy, R } = S, soft = .12, a = Math.max(0, rIn - soft), b = Math.max(a + .02, rOut), f = t => clamp((t - a) / (b - a));
    const mask = (c, src) => { const x = c.getContext("2d"), n = c.width, m = n / 2.1; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "source-over"; x.clearRect(0, 0, n, n); x.drawImage(src, 0, 0);
      x.globalCompositeOperation = "destination-in"; const q = x.createRadialGradient(n / 2, n / 2, a * m, n / 2, n / 2, b * m);
      q.addColorStop(0, rIn <= 0 ? "#000" : "rgba(0,0,0,0)"); q.addColorStop(f(rIn), "#000"); q.addColorStop(Math.max(f(rIn), f(rOut - soft)), "#000"); q.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = q; x.fillRect(0, 0, n, n); x.globalCompositeOperation = "source-over"; return c; };
    const X = cx - 1.05 * R, Y = cy - 1.05 * R, D = 2.1 * R, all = rIn <= 0 && rOut >= 1.15; // all of it: nothing to mask
    g.save(); if (lines) { g.globalAlpha = clamp(amp); g.drawImage(all ? pc.hotC : mask(S.tmp2, pc.hotC), X, Y, D, D); }
    g.globalCompositeOperation = "lighter"; g.globalAlpha = clamp(amp * .8); g.drawImage(all ? pc.glowC : mask(S.tmp, pc.glowC), X, Y, D, D); g.restore();
  }
  function drawNight(T, I, A, F, P) {
    const { W, H } = S; g.clearRect(0, 0, W, H);
    glide(A);
    // the embers in the char, breathing; never behind the words, nor under the picture
    g.save(); g.globalCompositeOperation = "lighter";
    for (const e of S.embers || []) { const b = Math.pow(.5 + .5 * Math.sin(A * e.f + e.ph), 1.8); if (b < .03) continue; const sh = S.shade(e.x, e.y, 30), inM = Math.hypot(e.x - S.cx, e.y - S.cy) < S.R * 1.2 * S.vis; if (sh < .02 || inM) continue;
      const a = b * sh * e.k; g.globalAlpha = a * .45; g.drawImage(S.halo, e.x - 26, e.y - 26, 52, 52); g.globalAlpha = a; g.drawImage(e.spr, e.x - e.spr.w2 / 2, e.y - e.spr.h2 / 2, e.spr.w2, e.spr.h2); }
    g.restore();
    if (S.vis < .01) return;
    if (!S.RR || (Math.abs(S.R / S.RR - 1) > .08 && Math.abs(S.tR - S.R) < 2)) buildNight();
    const pp = passOf(P), cur = pp.cur, prev = pp.prev; // what the pen burns this pass, and what it rests on
    const { cx, cy, R } = S, on = I > .01, V = S.vis, ox = cx - 1.05 * R, oy = cy - 1.05 * R, D2 = 2.1 * R;
    S.penDir = (() => { const a = Math.atan2(S.away[1], S.away[0]) - .55; return [Math.cos(a), Math.sin(a)]; })();
    const pic = (c, a) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, ox, oy, D2, D2); g.globalAlpha = 1; };
    // the moon's light in the picture, and the picture breathing a little, as embers do
    g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .13 * V; g.drawImage(S.moonGlow, cx - .62 * R, cy - .62 * R, 1.24 * R, 1.24 * R); g.restore();
    const [c0, c1] = BN.crumble, [p0, p1, p2, p3] = BN.pen, burnt = p2 + BN.cool, cEnd = c1 - .35;
    const phase = !on || T < BN.heat[0] || T >= burnt ? 0 : T < c1 ? 1 : T < p0 ? 2 : 3, egg = K.egg(P) && pp.P > 0; // (1.12 b417: an egg pass plays the puzzle instead)
    const lg = !egg && pp.P > 0 ? longOf(P) : 0, quiet = egg || lg > 0, hw = lg ? hourWin(P, lg) : null; // (1.12 b431: and an hour egg's pass its hour egg)
    if (hw) heat(0, 1.2, (.045 + .035 * Math.sin(A * .7)) * V * lerp(1, 1 - env(T, hw[0] - .3, hw[0], hw[3] - .3, hw[3] + .5, E.sine), I), false, on && T >= hw[1] ? cur : prev); // (the picture breathing, quiet while it plays)
    else if (egg) heat(0, 1.2, (.045 + .035 * Math.sin(A * .7)) * V * lerp(1, 1 - env(T, EW.crack[0] - .3, EW.crack[0], EW.seal[1] - .3, EW.seal[1] + .5, E.sine), I), false, on && T >= EW.seal[0] ? cur : prev);
    else heat(0, 1.2, (.045 + .035 * Math.sin(A * .7)) * V * lerp(1, 1 - env(T, BN.heat[0] - .3, BN.heat[0], burnt - .2, burnt + 1.4, E.sine), I), false, pp.P && on && T >= burnt - .2 ? cur : prev); // the picture breathing a little, as embers do
    if (egg) eggNight(T, I, A, prev, cur);
    else if (lg === 1) cuckooNight(T, I, A, prev, cur, ckPlan(P));
    else if (lg === 2) clockNight(T, I, A, prev, cur, P);
    else if (phase === 0) { if (!pp.P || !on || T < BN.heat[0]) pic(prev.full, 1); else { pic(cur.full, 1); pic(prev.full, 1 - I); } } // (burned: the new picture, the old one back as the list is used)
    else if (phase === 1) { // it glows red-hot once, from the moon outward, and crumbles to ash behind the glow
      const rc = lerp(-.05, 1.12, seg(T, c0, cEnd, lin)), rh = lerp(0, 1.35, seg(T, BN.heat[0], BN.heat[1], E.sine));
      pic(prev.full, 1 - I);
      g.save(); g.beginPath(); g.rect(ox, oy, D2, D2); if (rc > 0) g.arc(cx, cy, rc * R, 0, TAU); g.clip("evenodd"); pic(prev.full, I); g.restore();
      heat(rc, rh, I * V * .95 * (1 - seg(T, c1 - .5, c1, lin)), true, prev);
    } else if (phase === 2) pic(prev.full, 1 - I);
    // the ash, drifting up off the lines as the crumble passes them, and going
    if (!quiet && on && T > c0 && T < cEnd + BN.drift) { g.save(); for (const p of prev.ASHES) { const tr = lerp(c0, cEnd, clamp((p.d + .05) / 1.17)), a = (T - tr) / BN.drift; if (a < 0 || a >= 1) continue;
      const x = cx + (p.x + Math.sin(a * 5 + p.s * 9) * .03 * a + (p.s - .5) * .08 * a) * R, y = cy + (p.y - a * (.1 + .16 * p.s) - a * a * .12) * R, hot = a < .2;
      g.globalAlpha = I * V * Math.pow(1 - a, 1.3) * (hot ? 1 : .8); g.fillStyle = hot ? "#FFB257" : rgba(ASH); const s = (1.7 - a * .9) * S.ws; g.fillRect(x - s / 2, y - s / 2, s, s); } g.restore(); }
    if (!quiet && phase === 3) { // the pen burns it in again: what has cooled is ash (kept on a canvas as it comes), what is new still glows
      pic(prev.full, 1 - I);
      const cool = T - BN.cool, SG = cur.SEGS; if (S.coldL !== SG || cool < S.coldT - 1e-6) { S.coldL = SG; S.coldX.save(); S.coldX.setTransform(1, 0, 0, 1, 0, 0); S.coldX.clearRect(0, 0, S.cold.width, S.cold.height); S.coldX.restore(); S.ci = 0; }
      while (S.ci < SG.length && SG[S.ci].t1 <= cool) { const s = SG[S.ci++]; ink(S.coldX, s, ASH, s.al); } S.coldT = cool;
      pic(S.cold, I);
      // the hot part: segments by how long ago the tip passed, white to orange to red to ash
      g.save(); g.translate(cx, cy); g.scale(R, R); const u = S.ws / R;
      const hot = AGES.map(() => ({ l: [], d: [] })); let k2 = S.ci;
      for (; k2 < SG.length && SG[k2].t1 <= T; k2++) { const s = SG[k2], age = T - s.t1; let b = 0; while (b < AGES.length - 1 && age > AGES[b]) b++; (s.dot ? hot[b].d : hot[b].l).push(s); }
      const tp0 = tipAt(T, cur.M); if (tp0 && tp0.down && k2 < SG.length && SG[k2].t0 < T && !SG[k2].dot) { const s = SG[k2]; hot[0].l.push({ a: s.a, b: [tp0.u, tp0.v], w: s.w }); }
      for (let pass = 0; pass < 2; pass++) { g.globalCompositeOperation = pass ? "source-over" : "lighter";
        hot.forEach((h, b) => { if (!h.l.length && !h.d.length) return; const col = b < HOT.length ? HOT[b] : mixc(ASH, [168, 72, 34], b === 5 ? .5 : .2), ga = GLOWA[b];
          if (!pass && ga < .05) return; g.strokeStyle = pass ? rgba(col, 1) : rgba([255, 128, 40], ga); g.fillStyle = g.strokeStyle; g.globalAlpha = I * V;
          g.lineWidth = (pass ? 1.6 : 5.5) * u; g.beginPath(); for (const s of h.l) { g.moveTo(s.a[0], s.a[1]); g.lineTo(s.b[0], s.b[1]); } g.stroke();
          g.beginPath(); for (const s of h.d) { g.moveTo(s.a[0] + (pass ? 1.1 : 3) * u, s.a[1]); g.arc(s.a[0], s.a[1], (pass ? 1.1 : 3) * u, 0, TAU); } g.fill(); }); }
      g.restore(); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      // a wisp of smoke off the tip: it leans back along the way the pen came, rising and spreading and thinning as it goes
      const tip = tipAt(T, cur.M);
      if (tip) { const back = tipAt(T - .18, cur.M) || tip, vx = tip.u - back.u, vy = tip.v - back.v, vl = Math.hypot(vx, vy) || 1, lean = Math.min(1, vl / .3), up = tip.down ? 1 : .4;
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
    if (egg && on) { eggCuts(T, I, true); eggClick(T, I, true); }
    // the finale: the picture flares from the moon outward, sparks go up off it, and a wisp of smoke rises off the moon
    if (F >= 0) {
      heat(lerp(-.35, 1.15, seg(F, .16, .78, E.sine)), lerp(.05, 1.35, seg(F, .03, .5, E.out)), env(F, .02, .12, .6, .9) * V * .95, true, prev); // a pulse of heat out from the moon, the middle cooling first
      g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = "#FFB257";
      for (let i = 0; i < prev.ASHES.length; i += 7) { const p = prev.ASHES[i], t0 = .05 + p.d * .36 + p.s * .1, a = (F - t0) / .4; if (a < 0 || a >= 1) continue; const x = cx + (p.x + (p.s - .5) * .14 * a + Math.sin(a * 7 + p.s * 20) * .02) * R, y = cy + (p.y - a * (.28 + .32 * p.s)) * R, z = (2.8 - a * 1.8) * S.ws; g.globalAlpha = V * (1 - a) * (a < .1 ? a / .1 : 1); g.fillRect(x - z / 2, y - z / 2, z, z); } // sparks off the pulse's front
      g.globalCompositeOperation = "source-over"; const wa = env(F, .15, .4, .6, 1) * V; if (wa > .01) { g.lineCap = "round"; let pr2 = null; for (let j = 0; j <= 28; j++) { const f = j / 28, x = cx + (Math.sin(f * 5 + F * 4) * .08 * f + .02) * R, y = cy - (SUN + f * .9 * seg(F, .15, .7, E.out)) * R; if (pr2) { g.globalAlpha = wa * .3 * (1 - f); g.strokeStyle = "rgb(206,196,186)"; g.lineWidth = (1.5 + f * 9) * S.ws; g.beginPath(); g.moveTo(pr2[0], pr2[1]); g.lineTo(x, y); g.stroke(); } pr2 = [x, y]; } }
      g.restore();
    }
  }

  /* ---------------- the forever cycle: the pictures after the country ----------------
     Each is drawn once in the medallion's units (its radius 1, the inlay inside RI), both ways: as the pieces the day cuts
     from its veneers (a piece is its parts, each part its wood and the way its grain runs, laid one piece after another)
     and as the marks the night's pen burns (lines, hatching along the lie of each face, stippling, dots, in the pen's
     order). A pass deals which picture, and, where it can, which way round it faces. */
  const dirA = (a, r) => [Math.cos(a) * r, Math.sin(a) * r], mid2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  const arcPts = (cx, cy, r, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const ellPts = (cx, cy, rx, ry, rot = 0, n = 48) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]; });
  const bez = (p0, p1, p2, p3, n = 16) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, s = 1 - t; return [0, 1].map(j => s * s * s * p0[j] + 3 * s * s * t * p1[j] + 3 * s * t * t * p2[j] + t * t * t * p3[j]); });
  const waveY = (x0, x1, y, amp, k, ph = 0, n = 48) => Array.from({ length: n + 1 }, (_, i) => { const x = lerp(x0, x1, i / n); return [x, y + Math.sin(x * k + ph) * amp]; });
  const between = (top, bot) => [...top, ...bot.slice().reverse()]; /* the region between two lines drawn left to right */
  /** lines across a region at an angle, `gap` apart, ends a little ragged, every other one the other way (the pen's own
   *  back and forth) */
  const hatchSegs = (inside, ang, gap, r, lo = -1.2, hi = 1.2) => { const out = [], ux = Math.cos(ang), uy = Math.sin(ang), bb = inside.bb; let flip = false, t0 = -1.25, t1 = 1.25;
    if (bb) { const cs = [[bb[0], bb[1]], [bb[2], bb[1]], [bb[0], bb[3]], [bb[2], bb[3]]], os = cs.map(([x, y]) => -uy * x + ux * y), ts = cs.map(([x, y]) => ux * x + uy * y); lo = Math.max(lo, Math.min(...os) - gap); hi = Math.min(hi, Math.max(...os) + gap); t0 = Math.min(...ts) - .01; t1 = Math.max(...ts) + .01; lo = Math.floor(lo / gap) * gap; } /* only across the shape's own box */
    for (let o = lo; o <= hi; o += gap) { let run = null; const done = () => { if (run && Math.hypot(run[1][0] - run[0][0], run[1][1] - run[0][1]) > .025) { const a = r() * .12, b = r() * .12, p0 = mid2(run[0], run[1], a), p1 = mid2(run[1], run[0], b); out.push(flip ? [p1, p0] : [p0, p1]); flip = !flip; } run = null; };
      for (let t = t0; t <= t1; t += .007) { const x = -uy * o + ux * t, y = ux * o + uy * t; if (inside(x, y)) { if (!run) run = [[x, y], [x, y]]; else run[1] = [x, y]; } else done(); } done(); }
    return out; };
  /** the ring every picture sits in, burned the same as the country's: its rims and its row of dots */
  const ringMarks = (Ln, D) => { const circle = (rr, a0, dir, n) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + dir * i / n * TAU; return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    Ln(circle(.985, -.6, -1, 96), 2.6, 1, 1.9); Ln(circle(RI, -.6, 1, 90), 1.6, .85, 1.9); for (let i = 0; i < 60; i++) { const a = -.6 + i / 60 * TAU; D([Math.cos(a) * .943, Math.sin(a) * .943], 1.6, .8); } };
  const inPts = pts => { const t = pIn(pts); let a = 9, b = 9, c = -9, d = -9; for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } const f = (x, y) => x >= a && x <= c && y >= b && y <= d && x * x + y * y < .86 * .86 && t(x, y); f.bb = [a, b, c, d]; return f; };

  /** the compass rose: sixteen wedges of ground in two woods, a band of ebony, the four long points and the four short,
   *  each point halved light and dark as the light falls on it, a boss in the middle */
  const COMPASS = () => {
    const pieces = [], M = [], r = rng(211), Ln = (pts, w, a, v = 1) => { if (pts.length > 1) M.push({ pts, w, a, v }); }, D = (p, w, a) => M.push({ pts: [p], w, a, dot: true });
    const lay = (parts, t0, dur = .5) => pieces.push({ parts, t0, t1: t0 + dur });
    const ground = []; for (let i = 0; i < 16; i++) { const a0 = -Math.PI / 2 - Math.PI / 16 + i * Math.PI / 8, a1 = a0 + Math.PI / 8; ground.push({ wood: i % 2 ? "maple" : "satin", pts: [[0, 0], ...arcPts(0, 0, 1.02, a0, a1, 10)], grain: (a0 + a1) / 2 }); }
    lay(ground, 4.55, .7);
    lay([{ wood: "walnut", pts: [...arcPts(0, 0, .655, 0, TAU, 80), ...arcPts(0, 0, .625, TAU, 0, 80)], grain: 0 }], 5.35, .5);
    const main = [0, 1, 2, 3].map(k => -Math.PI / 2 + k * Math.PI / 2), T = main.map(a => dirA(a, .86)), V = main.map(a => dirA(a + Math.PI / 4, .19));
    const inter = main.map((a, k) => ({ a: a + Math.PI / 4, v: V[k], t: dirA(a + Math.PI / 4, .6), e1: mid2(V[k], T[k], .2), e2: mid2(V[k], T[(k + 1) % 4], .2) }));
    inter.forEach(({ a, v, t, e1, e2 }, k) => lay([{ wood: "cherry", pts: [v, e1, t], grain: a }, { wood: "maple", pts: [v, t, e2], grain: a }], 5.95 + k * .17, .45));
    main.forEach((a, k) => lay([{ wood: "holly", pts: [[0, 0], V[(k + 3) % 4], T[k]], grain: a }, { wood: "walnut", pts: [[0, 0], T[k], V[k]], grain: a }], 6.75 + k * .2, .5));
    lay([{ wood: "padauk", pts: ellPts(0, 0, .085, .085, 0, 32), grain: .3 }, { wood: "holly", pts: ellPts(0, 0, .032, .032, 0, 16), grain: 0 }], 7.85, .45);
    if (!night) return { pieces, M, mir: false }; /* (the day wants only the pieces, the night only the marks) */
    // by night: the ring; the band, ruled round and ticked across; the ground's joins; the star, its middles, its dark
    // halves hatched along the point; the short points; the boss stippled; the maple's figure in dots
    ringMarks(Ln, D);
    const circ2 = (rr, n) => Array.from({ length: n + 1 }, (_, i) => dirA(-Math.PI / 2 + i / n * TAU, rr));
    Ln(circ2(.655, 80), 1.4, .95); Ln(circ2(.625, 76), 1.4, .95);
    for (let i = 0; i < 72; i++) { const a = i / 72 * TAU; Ln([dirA(a, .625), dirA(a + .03, .66)], 1, .75, 1.6); }
    for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 - Math.PI / 16 + i * Math.PI / 8; Ln([dirA(a, .69), dirA(a, .88)], 1.2, .8); }
    const star = []; for (let k = 0; k < 4; k++) star.push(T[k], V[k]); star.push(T[0]); Ln(star, 2, 1);
    for (let k = 0; k < 4; k++) Ln([[0, 0], T[k]], 1.2, .85);
    inter.forEach(({ v, t, e1, e2 }) => { Ln([e1, t, e2], 1.6, .95); Ln([v, t], 1.1, .8); });
    main.forEach((a, k) => hatchSegs(inPts([[0, 0], T[k], V[k]]), a, .026, r).forEach(s => Ln(s, 1.1, .75, 1.5)));
    inter.forEach(({ a, v, t, e1 }) => hatchSegs(inPts([v, e1, t]), a, .03, r).forEach(s => Ln(s, 1, .7, 1.5)));
    Ln(ellPts(0, 0, .085, .085, 0, 30).concat([[.085, 0]]), 1.4, .95);
    for (let i = 0; i < 14; i++) { const a = r() * TAU, d = Math.sqrt(r()) * .07; D(dirA(a, d), 1.1, .9); }
    for (let i = 1; i < 16; i += 2) { const a0 = -Math.PI / 2 - Math.PI / 16 + i * Math.PI / 8; for (let j = 0; j < 7; j++) D(dirA(a0 + (.15 + r() * .7) * Math.PI / 8, .7 + r() * .16), 1 + r() * .5, .55); }
    return { pieces, M, mir: false };
  };
  /** the pen's helpers for a picture: lines and dots in its order, outlines of its pieces' parts, hatching in them */
  const penOf = seed => { const M = [], r = rng(seed), Ln = (pts, w = 1.2, a = .9, v = 1) => { if (pts.length > 1) M.push({ pts, w, a, v }); }, D = (p, w = 1.1, a = .8) => M.push({ pts: [p], w, a, dot: true });
    const outline = (pts, w = 1.6, a = .95) => Ln([...pts, pts[0]].map(([x, y]) => { const d = Math.hypot(x, y); return d > .875 ? [x * .875 / d, y * .875 / d] : [x, y]; }), w, a);
    const hatch = (pts, ang, gap, w = 1.1, a = .72) => hatchSegs(inPts(pts), ang, gap, r).forEach(s => Ln(s, w, a, 1.5));
    const stipple = (pts, n, w = 1.1) => { const t = inPts(pts); let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } const got = []; for (let k = 0; k < n * 40 && got.length < n; k++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()); if (!t(x, y) || got.some(q => Math.hypot(q[0] - x, q[1] - y) < .022)) continue; got.push([x, y]); } got.sort((p, q) => Math.round(p[1] / .04) - Math.round(q[1] / .04) || p[0] - q[0]).forEach(p => D(p, w + r() * .5, .85)); };
    const stars = (n, inside) => { const got = []; for (let k = 0; k < 2000 && got.length < n; k++) { const x = (r() - .5) * 1.7, y = (r() - .5) * 1.7; if (x * x + y * y > .78 * .78 || !inside(x, y) || got.some(q => Math.hypot(q[0] - x, q[1] - y) < .12)) continue; got.push([x, y]); } got.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])).forEach((p, i) => { if (i % 4 === 1) { Ln([[p[0] - .022, p[1]], [p[0] + .022, p[1]]], 1, .9, 1.4); Ln([[p[0], p[1] - .022], [p[0], p[1] + .022]], 1, .9, 1.4); } else D(p, 1 + r() * .7, .55 + r() * .4); }); };
    const bird = (x, y, s) => Ln([[x - s, y - s * .35], [x - s * .45, y - s * .6], [x, y], [x + s * .45, y - s * .6], [x + s, y - s * .35]], 1.2, .9, 1.2);
    return { M, r, Ln, D, outline, hatch, stipple, stars, bird }; };
  const sea = (y, amp, k, ph) => waveY(-1.05, 1.05, y, amp, k, ph, 60);

  /** a schooner under sail on an evening sea: the sky in three veneers, the sun going down, its road on the water, the
   *  hull in walnut with a line of holly, the masts, the sails in holly and maple bellied by the wind, a pennant; by night
   *  its lines, its sails shaded, the waves, gulls and stars */
  const SHIP = (mir) => {
    const pieces = [], lay = (parts, t0, dur = .5) => pieces.push({ parts, t0, t1: t0 + dur });
    const b1 = waveY(-1.05, 1.05, -.4, .025, 3.1, .4), b2 = waveY(-1.05, 1.05, -.06, .02, 4.2, 1.3), HZN = [[-1.05, .2], [1.05, .2]];
    const top = [[-1.05, -1.05], [1.05, -1.05]];
    const SK = mir ? ["blue", "sky", "satin"] : ["sky", "maple", "satin"]; /* the other way round, a later hour */
    lay([{ wood: SK[0], pts: between(top, b1), grain: 0 }, { wood: SK[1], pts: between(b1, b2), grain: 0 }, { wood: SK[2], pts: between(b2, HZN), grain: 0 }], 4.5, .65); /* the sky, as one sheet */
    const sunC = [-.42, .2], sunP = arcPts(sunC[0], sunC[1], .26, Math.PI, TAU, 36);
    lay([{ wood: "padauk", pts: sunP, grain: .3 }], 5.2, .45);
    const s1 = sea(.36, .018, 9, .3), s2 = sea(.55, .02, 8, 1.1), bot = [[-1.05, 1.05], [1.05, 1.05]];
    lay([{ wood: "blue", pts: between(HZN, s1), grain: 0 }], 5.55, .5);
    const road = []; for (let i = 0; i <= 5; i++) { const y = .205 + i * .036, w = .04 + i * .009 + (i % 2 ? .014 : 0); road.push([sunC[0] - w, y]); } for (let i = 5; i >= 0; i--) { const y = .205 + i * .036, w = .04 + i * .009 + (i % 2 ? .014 : 0); road.push([sunC[0] + w * (i % 2 ? .8 : 1.1), y]); }
    lay([{ wood: "satin", pts: road, grain: 0 }], 5.9, .4);
    lay([{ wood: "navy", pts: between(s1, s2), grain: 0 }, { wood: "blue", pts: between(s2, bot), grain: 0 }], 6.15, .5);
    const hull = [[-.4, .11], ...bez([-.4, .11], [-.1, .17], [.25, .17], [.6, .08], 12).slice(1), [.64, .075], ...bez([.64, .075], [.58, .22], [.46, .32], [.24, .35], 10).slice(1), [-.12, .355], [-.32, .31], [-.41, .22]];
    const stripe = [...bez([-.395, .15], [-.1, .2], [.25, .2], [.595, .115], 12), ...bez([.6, .145], [.25, .228], [-.1, .228], [-.39, .18], 12)];
    lay([{ wood: "walnut", pts: hull, grain: -.05 }, { wood: "holly", pts: stripe, grain: -.05 }], 6.6, .55);
    const mast = (x, y0, y1, w) => [[x - w, y1], [x + w, y1], [x + w * 1.2, y0], [x - w * 1.2, y0]];
    lay([{ wood: "ebony", pts: mast(-.05, .16, -.74, .016), grain: Math.PI / 2 }, { wood: "ebony", pts: mast(.26, .15, -.64, .015), grain: Math.PI / 2 }, { wood: "ebony", pts: [[.56, .1], [.84, .005], [.845, .02], [.57, .125]], grain: -.32 }], 7.0, .45);
    const MS = [[-.075, -.68], [-.36, -.52], [-.42, .06], [-.075, .08]], FS = [[.235, -.6], [.03, -.46], [-.02, .06], [.235, .075]], JB = [[.29, -.58], [.79, .03], [.3, .07]];
    const belly = (q, k) => { const [a, b, c, dd] = q; return [[a, ...bez(a, mid2(a, b, .3), mid2(b, c, .1), b, 6).slice(1), ...bez(b, [lerp(b[0], c[0], .5) - .05 * k, lerp(b[1], c[1], .5)], [lerp(b[0], c[0], .8) - .03 * k, lerp(b[1], c[1], .8)], c, 10).slice(1), dd], [a, dd]]; };
    const [msO] = belly(MS, 1), [fsO] = belly(FS, 1);
    const cut = (pts, a, b) => { const ax = a[0], ay = a[1], bx = b[0], by = b[1], side = ([x, y]) => (bx - ax) * (y - ay) - (by - ay) * (x - ax); const L2 = [], R2 = []; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], sp = side(p), sq = side(q); (sp >= 0 ? L2 : R2).push(p); if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq), x = [lerp(p[0], q[0], t), lerp(p[1], q[1], t)]; L2.push(x); R2.push(x); } } return [L2, R2]; };
    for (const [o, t0] of [[msO, 7.4], [fsO, 7.75]]) { const [l, rr] = cut(o, o[0], mid2(o[Math.floor(o.length / 2)], o[o.length - 1], .5)); lay([{ wood: "holly", pts: l, grain: -1.3 }, { wood: "maple", pts: rr, grain: -1.3 }], t0, .5); }
    { const [l, rr] = cut(JB, JB[0], mid2(JB[1], JB[2], .5)); lay([{ wood: "holly", pts: l, grain: -.9 }, { wood: "maple", pts: rr, grain: -.9 }], 8.1, .45); }
    lay([{ wood: "padauk", pts: [[-.06, -.8], [.12, -.76], [-.06, -.72]], grain: 0 }], 8.45, .35);
    lay([{ wood: "blue", pts: between(waveY(-.47, .72, .305, .012, 16, .7, 30), waveY(-.47, .72, .37, .01, 13, .2, 30)), grain: 0 }], 8.6, .45); /* the water over her waterline */
    if (!night) return { pieces, M: [], mir: true };
    // by night
    const pn = penOf(311), { Ln, D, outline, hatch, stipple, stars, bird } = pn;
    ringMarks(Ln, D);
    Ln([[-.86, .2], [sunC[0] - .27, .2]], 1.4, .9); Ln([[sunC[0] + .27, .2], [-.41, .2]], 1.4, .9); Ln([[.66, .2], [.86, .2]], 1.4, .9);
    Ln(sunP.slice(2, -2), 2, 1); stipple(sunP, 60);
    outline(hull, 1.8); Ln(stripe.slice(0, 13), 1.1, .85); hatch(hull, -.05, .03, 1.1, .75);
    Ln([[-.05, .15], [-.05, -.74]], 1.6, .95); Ln([[.26, .14], [.26, -.64]], 1.5, .95); Ln([[.57, .11], [.84, .01]], 1.3, .9);
    for (const o of [msO, fsO, JB]) outline(o, 1.4, .95);
    hatch(cut(msO, msO[0], mid2(msO[Math.floor(msO.length / 2)], msO[msO.length - 1], .5))[1], -1.3, .05, 1, .6); hatch(cut(fsO, fsO[0], mid2(fsO[Math.floor(fsO.length / 2)], fsO[fsO.length - 1], .5))[1], -1.3, .05, 1, .6);
    Ln([[-.06, -.8], [.12, -.76], [-.06, -.72]], 1.2, .9);
    for (let i = 0; i < 10; i++) { const y = .22 + i * .044, w = .045 + i * .012; Ln([[sunC[0] - w, y], [sunC[0] + w, y]], 1.2, .95, 1.3); }
    for (const [y0, n] of [[.3, 5], [.4, 6], [.5, 6], [.6, 5], [.7, 4]]) for (let i = 0; i < n; i++) { const x = -.78 + (i + (y0 * 10 % 2) * .5) * 1.5 / n, l = .09; if (Math.abs(x - sunC[0]) < .12 || (x > -.45 && x < .66 && y0 < .36)) continue; Ln(waveY(x, x + l, y0, .008, 60, 0, 6), 1, .7, 1.3); }
    const inSail = [msO, fsO, JB].map(pIn); stars(12, (x, y) => y < -.08 && !inSail.some(t => t(x, y) || t(x + .05, y) || t(x - .05, y) || t(x, y + .05)) && Math.abs(x + .06) > .06 && Math.abs(x - .26) > .06); bird(.58, -.48, .04); bird(.7, -.58, .03);
    return { pieces, M: pn.M, mir: true };
  };

  /** a lighthouse on its rock at dusk, its two beams across the sky, the sea round the rock; by night its beams burned
   *  out to the rim, the tower's bands, the rock hatched, the waves, stars */
  const LIGHT = (mir) => {
    const pieces = [], lay = (parts, t0, dur = .5) => pieces.push({ parts, t0, t1: t0 + dur });
    const lamp = [.14, -.37], HZN = [[-1.05, .26], [1.05, .26]], top = [[-1.05, -1.05], [1.05, -1.05]], b1 = waveY(-1.05, 1.05, -.2, .02, 3.3, .8);
    lay([{ wood: "blue", pts: between(top, b1), grain: 0 }, { wood: "sky", pts: between(b1, HZN), grain: 0 }], 4.5, .65);
    const beam = (a, w) => [lamp, ...arcPts(lamp[0], lamp[1], 1.6, a - w, a + w, 8)];
    lay([{ wood: "satin", pts: beam(Math.PI + .12, .085), grain: Math.PI + .12 }, { wood: "satin", pts: beam(-.1, .075), grain: -.1 }], 5.15, .5);
    const s1 = sea(.4, .016, 10, .2), bot = [[-1.05, 1.05], [1.05, 1.05]];
    lay([{ wood: "navy", pts: between(HZN, s1), grain: 0 }, { wood: "blue", pts: between(s1, bot), grain: 0 }], 5.6, .55);
    const rock = [[-.3, .5], [-.22, .3], [-.1, .19], [.04, .16], [.2, .15], [.34, .2], [.44, .31], [.52, .5], [.3, .56], [0, .57]], rock2 = [[.2, .15], [.34, .2], [.44, .31], [.52, .5], [.36, .52], [.3, .36]];
    lay([{ wood: "walnut", pts: rock, grain: .4 }, { wood: "ebony", pts: rock2, grain: .9 }], 6.1, .5);
    const tw = (y) => lerp(.074, .128, (y + .3) / .5), band = (ya, yb) => [[lamp[0] - tw(ya), ya], [lamp[0] + tw(ya), ya], [lamp[0] + tw(yb), yb], [lamp[0] - tw(yb), yb]];
    const ys = [-.3, -.175, -.05, .075, .2];
    lay(ys.slice(0, 4).map((y, i) => ({ wood: i % 2 ? (mir ? "cherry" : "padauk") : "holly", pts: band(y, ys[i + 1]), grain: Math.PI / 2 })), 6.6, .55);
    lay([{ wood: "ebony", pts: [[lamp[0] - .11, -.33], [lamp[0] + .11, -.33], [lamp[0] + .11, -.3], [lamp[0] - .11, -.3]], grain: 0 }, { wood: "satin", pts: [[lamp[0] - .058, -.44], [lamp[0] + .058, -.44], [lamp[0] + .058, -.33], [lamp[0] - .058, -.33]], grain: Math.PI / 2 }, { wood: "ebony", pts: [[lamp[0] - .085, -.44], [lamp[0] - .055, -.49], [lamp[0], -.56], [lamp[0] + .055, -.49], [lamp[0] + .085, -.44]], grain: 0 }], 7.15, .5);
    lay([{ wood: "ebony", pts: [[lamp[0] - .03, .2], [lamp[0] - .03, .14], ...arcPts(lamp[0], .14, .03, Math.PI, TAU, 6).slice(1, -1), [lamp[0] + .03, .14], [lamp[0] + .03, .2]], grain: Math.PI / 2 }], 7.6, .35);
    if (!night) return { pieces, M: [], mir: true };
    // by night
    const pn = penOf(411), { Ln, D, outline, hatch, stipple, stars, bird } = pn;
    ringMarks(Ln, D);
    for (const [a, w] of [[Math.PI + .12, .085], [-.1, .075]]) for (const o of [-w, 0, w]) Ln([dirA(a + o, .1).map((v, i) => v + lamp[i]), dirA(a + o, 1.2).map((v, i) => v + lamp[i])].map(([x, y]) => { const d = Math.hypot(x, y); return d > .87 ? [x * .87 / d, y * .87 / d] : [x, y]; }), o ? 1 : 1.3, o ? .7 : .95, o ? 1.2 : 1.5);
    Ln([[-.86, .26], [-.27, .26]], 1.3, .9); Ln([[.5, .26], [.86, .26]], 1.3, .9);
    outline(rock, 1.8); hatch(rock, .4, .035); hatch(rock2, .9, .02, 1.1, .85);
    outline([[lamp[0] - tw(-.3), -.3], [lamp[0] + tw(-.3), -.3], [lamp[0] + tw(.2), .2], [lamp[0] - tw(.2), .2]], 1.8);
    for (const i of [1, 3]) hatch(band(ys[i], ys[i + 1]), Math.PI / 2 + .02, .018, 1, .8);
    outline([[lamp[0] - .11, -.33], [lamp[0] + .11, -.33], [lamp[0] + .11, -.3], [lamp[0] - .11, -.3]], 1.3); outline([[lamp[0] - .058, -.44], [lamp[0] + .058, -.44], [lamp[0] + .058, -.33], [lamp[0] - .058, -.33]], 1.3);
    stipple([[lamp[0] - .05, -.43], [lamp[0] + .05, -.43], [lamp[0] + .05, -.34], [lamp[0] - .05, -.34]], 10); Ln([[lamp[0] - .085, -.44], [lamp[0] - .055, -.49], [lamp[0], -.56], [lamp[0] + .055, -.49], [lamp[0] + .085, -.44]], 1.5, .95);
    for (const [y0, n] of [[.33, 6], [.45, 7], [.58, 6], [.7, 4]]) for (let i = 0; i < n; i++) { const x = -.8 + (i + (y0 * 10 % 2) * .5) * 1.6 / n; if (y0 < .6 && x > -.35 && x < .55) continue; Ln(waveY(x, x + .08, y0, .008, 60, 0, 6), 1, .7, 1.3); }
    stars(14, (x, y) => y < .1 && Math.abs(Math.atan2(y - lamp[1], x - lamp[0]) - (Math.PI + .12)) > .2 && Math.abs(Math.atan2(y - lamp[1], x - lamp[0]) + .1) > .2 && Math.abs(x - lamp[0]) > .16);
    bird(-.38, -.5, .045); bird(-.5, -.38, .032);
    return { pieces, M: pn.M, mir: true };
  };

  /** a robin on a branch before the moon: a dusk sky in two blues, the full moon in holly, the branch in walnut with its
   *  leaves in two greens and its berries; the bird in walnut, cherry and padauk. By night its outlines, the wing's
   *  feathers, the breast stippled, the moon's rim and its face, stars */
  const BIRD = (mir) => {
    const pieces = [], lay = (parts, t0, dur = .5) => pieces.push({ parts, t0, t1: t0 + dur });
    const top = [[-1.05, -1.05], [1.05, -1.05]], b1 = waveY(-1.05, 1.05, .05, .02, 3, .3), bot = [[-1.05, 1.05], [1.05, 1.05]];
    lay([{ wood: "blue", pts: between(top, b1), grain: 0 }, { wood: "sky", pts: between(b1, bot), grain: 0 }], 4.5, .65);
    const moon = ellPts(.2, -.2, .44, .44, 0, 72); lay([{ wood: mir ? "maple" : "holly", pts: moon, grain: .5 }], 5.15, .5); /* the other way round, a harvest moon */
    const br = t => [lerp(-1.05, 1.05, t), lerp(.52, .06, t) + Math.sin(t * 5.5) * .035], bw = t => lerp(.075, .03, t);
    const brPts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, [x, y] = br(t); brPts.push([x, y - bw(t)]); } for (let i = 24; i >= 0; i--) { const t = i / 24, [x, y] = br(t); brPts.push([x, y + bw(t)]); }
    const tw0 = br(.66), twig = [[tw0[0] - .025, tw0[1]], [tw0[0] + .15, tw0[1] - .16], [tw0[0] + .3, tw0[1] - .28], [tw0[0] + .31, tw0[1] - .26], [tw0[0] + .17, tw0[1] - .13], [tw0[0] + .03, tw0[1] + .01]];
    lay([{ wood: "walnut", pts: brPts, grain: -.22 }, { wood: "walnut", pts: twig, grain: -.8 }], 5.6, .55);
    const leaf = (x, y, a, l, w) => { const tip = [x + Math.cos(a) * l, y + Math.sin(a) * l], m = mid2([x, y], tip, .45), n = [-Math.sin(a) * w, Math.cos(a) * w]; return [bez([x, y], [m[0] + n[0], m[1] + n[1]], [tip[0] + n[0] * .3, tip[1] + n[1] * .3], tip, 8), bez([x, y], [m[0] - n[0], m[1] - n[1]], [tip[0] - n[0] * .3, tip[1] - n[1] * .3], tip, 8)]; };
    const LV = [[br(.2), -1.9, .26, .09], [br(.3), .9, .22, .08], [br(.52), -1.3, .25, .085], [br(.78), .6, .23, .08], [[tw0[0] + .3, tw0[1] - .27], -.6, .2, .07], [[tw0[0] + .16, tw0[1] - .14], -2, .18, .065]];
    LV.forEach(([p, a, l, w], i) => { const [s1, s2] = leaf(p[0], p[1], a, l, w); lay([{ wood: "green", pts: [...s1, p], grain: a }, { wood: "olive", pts: [...s2, p], grain: a }], 6.1 + i * .12, .4); }); /* each leaf in two greens either side of its middle */
    const BE = [br(.4), br(.43), br(.415)].map((p, i) => [p[0] + (i - 1) * .05, p[1] + .1 + (i % 2) * .04]); lay(BE.map(p => ({ wood: "padauk", pts: ellPts(p[0], p[1], .03, .03, 0, 16), grain: 0 })), 6.9, .35);
    // the robin, perched on the branch a third of the way along
    const perch = br(.4), bx = perch[0] - .02, by = perch[1] - .2;
    const body = ellPts(bx, by, .2, .145, -.3, 40), head = ellPts(bx + .19, by - .15, .1, .095, 0, 30), breast = ellPts(bx + .07, by + .03, .15, .11, -.5, 30);
    const tail = [[bx - .15, by - .02], [bx - .38, by + .14], [bx - .42, by + .1], [bx - .35, by + .04], [bx - .17, by - .07]];
    const wing = [...bez([bx - .12, by - .07], [bx - .02, by - .13], [bx + .1, by - .08], [bx + .08, by], 8), ...bez([bx + .08, by], [bx, by + .06], [bx - .12, by + .06], [bx - .25, by + .06], 8).slice(1)];
    lay([{ wood: "walnut", pts: tail, grain: .5 }], 7.2, .4);
    lay([{ wood: "teak", pts: body, grain: -.3 }, { wood: "padauk", pts: breast, grain: -.5 }], 7.5, .5);
    lay([{ wood: "walnut", pts: wing, grain: -.2 }], 7.9, .4);
    lay([{ wood: "teak", pts: head, grain: 0 }, { wood: "padauk", pts: ellPts(bx + .16, by - .09, .07, .05, .3, 20), grain: 0 }, { wood: "satin", pts: [[bx + .27, by - .17], [bx + .36, by - .145], [bx + .27, by - .12]], grain: 0 }, { wood: "ebony", pts: ellPts(bx + .22, by - .17, .018, .018, 0, 12), grain: 0 }], 8.2, .45);
    lay([{ wood: "ebony", pts: [[bx - .015, by + .13], [bx + .005, by + .13], [bx + .01, perch[1] - .06], [bx - .01, perch[1] - .06]], grain: Math.PI / 2 }, { wood: "ebony", pts: [[bx + .05, by + .12], [bx + .07, by + .12], [bx + .075, perch[1] - .06], [bx + .055, perch[1] - .06]], grain: Math.PI / 2 }], 8.6, .35);
    if (!night) return { pieces, M: [], mir: true };
    // by night
    const pn = penOf(511), { Ln, D, outline, hatch, stipple, stars } = pn;
    ringMarks(Ln, D);
    Ln(arcPts(.2, -.2, .44, -2.4, 1.75, 50), 1.8, 1); { const mn = noise1(55, 32), got = []; for (let k = 0; k < 6000 && got.length < 95; k++) { const a = pn.r() * TAU, d = Math.sqrt(pn.r()) * .41, x = .2 + Math.cos(a) * d, y = -.2 + Math.sin(a) * d; if (fbm(mn, x * 5 + y * 3.7 + 9, 2) < .46 && pn.r() < .72) continue; if (got.some(q => Math.hypot(q[0] - x, q[1] - y) < .026)) continue; if (y > -.02 + (x + .6) * -.05 && x < .45) continue; got.push([x, y]); } got.sort((p, q) => Math.round(p[1] / .04) - Math.round(q[1] / .04) || p[0] - q[0]).forEach(p => D(p, 1.1 + pn.r() * .5, .9)); } /* the moon's face, as the country's */
    outline(brPts, 1.7); hatch(brPts, -.22, .03, 1, .7); outline(twig, 1.4);
    LV.forEach(([p, a, l, w]) => { const [s1, s2] = leaf(p[0], p[1], a, l, w); Ln(s1, 1.3, .95); Ln(s2, 1.3, .95); Ln([p, [p[0] + Math.cos(a) * l * .95, p[1] + Math.sin(a) * l * .95]], 1, .8); });
    BE.forEach(p => { Ln(ellPts(p[0], p[1], .03, .03, 0, 12).concat([[p[0] + .03, p[1]]]), 1.2, .95); D(p, 1.4, .9); });
    outline(tail, 1.5); hatch(tail, .5, .025, 1, .75);
    outline(body, 1.8); outline(head, 1.6); stipple(breast, 30); outline(wing, 1.5); for (let i = 0; i < 4; i++) { const t = .25 + i * .18; Ln([mid2([bx - .12, by - .05], [bx + .06, by - .02], t), mid2([bx - .25, by + .05], [bx - .02, by + .05], t)], 1, .75, 1.3); }
    Ln([[bx + .27, by - .17], [bx + .36, by - .145], [bx + .27, by - .12]], 1.3, .95); D([bx + .22, by - .17], 2.2, 1);
    Ln([[bx - .005, by + .13], [bx, perch[1] - .06]], 1.3, .95); Ln([[bx + .06, by + .12], [bx + .065, perch[1] - .06]], 1.3, .95);
    stars(12, (x, y) => Math.hypot(x - .2, y + .2) > .52 && y < .3 && Math.hypot(x - bx, y - by) > .45);
    return { pieces, M: pn.M, mir: true };
  };

  /** an oak leaf in autumn on a parquet ground: its lobes cut along the veins, each lobe its own wood, and an acorn; by
   *  night the leaf's outline and its veins, alternate lobes hatched, the acorn's cup crossed, the ground's lattice faint */
  const LEAF = (mir) => {
    const pieces = [], lay = (parts, t0, dur = .5) => pieces.push({ parts, t0, t1: t0 + dur });
    const ground = []; const q2 = .26; for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) { const cx = (i + j) * q2 / 2 * 1.414, cy = (j - i) * q2 / 2 * 1.414; if (Math.hypot(cx, cy) > 1.2) continue; const h = q2 * .707; ground.push({ wood: (i + j) % 2 ? "maple" : "holly", pts: [[cx, cy - h], [cx + h, cy], [cx, cy + h], [cx - h, cy]], grain: (i + j) % 2 ? Math.PI / 4 : -Math.PI / 4 }); }
    lay(ground, 4.5, .7);
    // the leaf: along a midrib from the stem (lower left) to the tip (upper right), seven lobes, cut along the veins
    const A = -.74, ux = Math.cos(A), uy = Math.sin(A), nx = -uy, ny = ux, base = [-.5, .5], len = 1.28, at = (s, o) => [base[0] + ux * s * len + nx * o, base[1] + uy * s * len + ny * o];
    const halfW = s => (.13 + .2 * Math.sin(Math.PI * Math.min(1, s * 1.05))) * (s < .08 ? s / .08 : 1), lobes = [.14, .33, .52, .71, .9];
    const edge = sd => { const pts = []; for (let i = 0; i <= 120; i++) { const s = i / 120, lobe = Math.pow(Math.abs(Math.sin((s - .04) * Math.PI * 5.2)), .7), w = halfW(s) * (.55 + .45 * lobe) * (1 - Math.pow(s, 6)); pts.push(at(s, sd * w)); } return pts; };
    const L1 = edge(1), R1 = edge(-1), cuts = [0, .23, .42, .6, .79, 1]; /* cut at the sinuses between the lobes */
    const WL = ["rust", "satin", "cherry", "oak", "rust"], WR = ["satin", "cherry", "rust", "teak", "satin"];
    const slice = (E, s0, s1) => { const i0 = Math.round(s0 * 120), i1 = Math.round(s1 * 120); return [at(s0, 0), ...E.slice(i0, i1 + 1), at(s1, 0)]; };
    const [wl, wr] = [["rust", "satin"], ["cherry", "satin"], ["satin", "rust"], ["oak", "rust"]][Math.floor(rng(613 + (mir ? 7 : 0))() * 4)];
    lay([{ wood: wl, pts: slice(L1, 0, 1), grain: A + .5 }], 5.3, .5); lay([{ wood: wr, pts: slice(R1, 0, 1), grain: A - .5 }], 5.75, .5); /* the leaf's two halves, either side of its middle */
    const veinQ = (a, b, w) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, n2 = [-dy / l * w, dx / l * w]; return [[a[0] + n2[0], a[1] + n2[1]], [b[0] + n2[0] * .3, b[1] + n2[1] * .3], [b[0] - n2[0] * .3, b[1] - n2[1] * .3], [a[0] - n2[0], a[1] - n2[1]]]; };
    const VEINS = [[at(.02, 0), at(.97, 0), .013]]; for (const sv of lobes) for (const sd of [1, -1]) { const E = sd > 0 ? L1 : R1; VEINS.push([at(sv - .06, 0), mid2(at(sv - .06, 0), E[Math.min(120, Math.round((sv + .01) * 120))], .88), .008]); }
    lay(VEINS.map(([a2, b2, w]) => ({ wood: "holly", pts: veinQ(a2, b2, w), grain: Math.atan2(b2[1] - a2[1], b2[0] - a2[0]) })), 6.3, .5); /* its veins in holly */
    lay([{ wood: "walnut", pts: [[base[0] - .02, base[1] - .02], [base[0] + .02, base[1] + .02], [base[0] - .2, base[1] + .22], [base[0] - .23, base[1] + .19]], grain: A }], 7.4, .35);
    const ac = [.42, .44], cup = [...arcPts(ac[0], ac[1], .12, Math.PI + .1, TAU - .1, 16), [ac[0] + .12, ac[1] + .03], [ac[0] - .12, ac[1] + .03]], nut = ellPts(ac[0], ac[1] + .13, .1, .13, 0, 32);
    lay([{ wood: "oak", pts: nut, grain: Math.PI / 2 }], 7.8, .4); lay([{ wood: "walnut", pts: cup, grain: 0 }, { wood: "walnut", pts: [[ac[0] - .01, ac[1] - .12], [ac[0] + .01, ac[1] - .12], [ac[0] + .03, ac[1] - .2], [ac[0] + .01, ac[1] - .2]], grain: 1.3 }], 8.15, .4);
    if (!night) return { pieces, M: [], mir: true };
    // by night
    const pn = penOf(611), { Ln, D, outline, hatch, stipple } = pn;
    ringMarks(Ln, D);
    const inLeaf = pIn([...L1, ...R1.slice().reverse()]), clear = (a, b) => { const m = mid2(a, b, .5); return Math.hypot(...a) < .82 && Math.hypot(...b) < .82 && !inLeaf(...m) && !inLeaf(...a) && !inLeaf(...b) && Math.hypot(m[0] - ac[0], m[1] - ac[1] - .08) > .2; };
    for (const g2 of ground) { const [a, b, c] = g2.pts; if (clear(a, b)) Ln([a, b], .9, .45); if (clear(b, c)) Ln([b, c], .9, .45); } /* the parquet's lattice, faint, kept off the leaf */
    Ln(L1, 1.8, 1); Ln(R1, 1.8, 1); Ln([at(0, 0), at(.98, 0)], 1.6, .95);
    for (const sv of lobes) for (const sd of [1, -1]) { const E = sd > 0 ? L1 : R1, e = E[Math.min(120, Math.round((sv + .01) * 120))]; Ln([at(sv - .06, 0), mid2(at(sv - .06, 0), e, .88)], 1.1, .85); } /* the veins, out to each lobe */
    hatch(slice(R1, 0, 1), A - .5, .028, 1, .66); /* the half away from the light, shaded */
    Ln([[base[0], base[1]], [base[0] - .21, base[1] + .21]], 1.6, .95);
    outline(nut, 1.6); stipple(nut, 16); outline(cup, 1.6); hatch(cup, .7, .028, 1, .8); hatch(cup, -.7, .028, 1, .8); Ln([[ac[0], ac[1] - .12], [ac[0] + .02, ac[1] - .2]], 1.3, .95);
    return { pieces, M: pn.M, mir: true };
  };

  /** rare: a stag on the ridge before the setting sun, the sky in rays of satinwood and maple behind him; by night his
   *  shape burned dark, the sun's rim, the ridge, the grass */
  const STAG = (mir) => {
    const pieces = [], lay = (parts, t0, dur = .5) => pieces.push({ parts, t0, t1: t0 + dur });
    const sunC = [.1, .2], rays = []; for (let i = 0; i < 18; i++) { const a0 = Math.PI + i / 18 * Math.PI, a1 = a0 + Math.PI / 18; rays.push({ wood: i % 2 ? (mir ? "holly" : "maple") : "satin", pts: [sunC, ...arcPts(sunC[0], sunC[1], 1.8, a0, a1, 6)], grain: (a0 + a1) / 2 }); }
    rays.push({ wood: "satin", pts: [[-1.05, .2], [1.05, .2], [1.05, 1.05], [-1.05, 1.05]], grain: 0 });
    lay(rays, 4.5, .65);
    lay([{ wood: "padauk", pts: ellPts(sunC[0], sunC[1], .34, .34, 0, 60), grain: .3 }], 5.15, .45);
    const ridge = [[-1.05, .36], [-.7, .31], [-.4, .26], [-.1, .28], [.2, .33], [.5, .3], [.8, .34], [1.05, .38]], bot = [[-1.05, 1.05], [1.05, 1.05]], ridge2 = [[-1.05, .58], [-.6, .52], [-.2, .56], [.3, .5], [.7, .55], [1.05, .52]];
    lay([{ wood: "cherry", pts: between(ridge, bot), grain: -.05 }, { wood: "walnut", pts: between(ridge2, bot), grain: .05 }], 5.55, .5);
    // the stag, in profile facing right, standing on the ridge: one shape for him (body, neck, head, legs), his antlers
    const X = (x, y) => [x - .06, y - .04];
    const HART = [[-.34, -.1], [-.2, -.13], [0, -.12], [.12, -.14], [.2, -.24], [.27, -.33], [.3, -.4], [.27, -.47], [.33, -.43], [.36, -.41], [.44, -.34], [.52, -.28], [.535, -.25], [.49, -.225], [.42, -.235], [.36, -.26], [.3, -.18], [.26, -.06], [.24, .04],
      [.225, .07], [.235, .22], [.22, .29], [.225, .4], [.195, .4], [.19, .29], [.185, .2], [.17, .1], [.13, .1], [.125, .24], [.12, .4], [.092, .4], [.095, .25], [.09, .12], [0, .1], [-.12, .1],
      [-.17, .11], [-.165, .18], [-.135, .26], [-.15, .4], [-.178, .4], [-.168, .28], [-.2, .19], [-.225, .13], [-.25, .13], [-.24, .2], [-.215, .27], [-.228, .4], [-.256, .4], [-.25, .29], [-.29, .19], [-.33, .07], [-.365, -.02], [-.38, -.05], [-.36, -.08]].map(q => X(...q));
    const limb = (q, w0, w1) => { const L2 = [], R2 = []; q.forEach((p, i) => { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (q.length - 1)); L2.push([p[0] - dy / l * w, p[1] + dx / l * w]); R2.push([p[0] + dy / l * w, p[1] - dx / l * w]); }); return [...L2, ...R2.reverse()]; };
    const beamN = [[.31, -.41], [.27, -.52], [.23, -.64], [.22, -.75], [.25, -.84]].map(q => X(...q)), beamF = [[.34, -.41], [.37, -.52], [.41, -.63], [.43, -.73], [.41, -.82]].map(q => X(...q));
    const tinesOf = (bm, dir) => [[1, .12, -1.1 * dir], [2, .1, -.95 * dir], [3, .08, -1.25 * dir]].map(([i, l, da]) => { const p = bm[i], a0 = Math.atan2(bm[i + 1][1] - bm[i - 1][1], bm[i + 1][0] - bm[i - 1][0]) + da; return [p, [p[0] + Math.cos(a0) * l * .55, p[1] + Math.sin(a0) * l * .55 - .01], [p[0] + Math.cos(a0) * l, p[1] + Math.sin(a0) * l]]; });
    const antlers = [beamN, beamF, ...tinesOf(beamN, -1), ...tinesOf(beamF, 1)];
    lay([{ wood: "ebony", pts: HART, grain: .1 }], 6.1, .55);
    lay(antlers.map((q, i) => ({ wood: "walnut", pts: limb(q, i < 2 ? .018 : .011, i < 2 ? .007 : .004), grain: -1.4 })), 6.8, .5);
    lay([{ wood: "green", pts: between(waveY(-1.05, 1.05, .72, .03, 22, .4, 90), bot), grain: 0 }], 7.8, .45);
    if (!night) return { pieces, M: [], mir: true };
    // by night
    const pn = penOf(711), { Ln, D, outline, hatch, stipple, stars, bird } = pn;
    ringMarks(Ln, D);
    Ln(arcPts(sunC[0], sunC[1], .34, Math.PI, TAU, 40), 2, 1); stipple(ellPts(sunC[0], sunC[1] - .01, .31, .31, 0, 40).filter(([x, y]) => y < .19), 44);
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i + .5) / 9 * Math.PI; Ln([dirA(a, .42).map((v, j) => v + sunC[j]), dirA(a, .6 + (i % 2) * .12).map((v, j) => v + sunC[j])], 1.1, .75, 1.4); }
    Ln(ridge.map(([x, y]) => [x * .86, y]), 1.6, .95); Ln(ridge2.map(([x, y]) => [x * .86, y]), 1.3, .85);
    outline(HART, 1.6); hatch(HART, .5, .014, 1.1, .92); /* burned dark all over */
    for (const q of antlers) Ln(q, q.length > 3 ? 1.9 : 1.4, .95);
    for (let i = 0; i < 26; i++) { const x = -.8 + i * .064 + (i % 3) * .01, y = .75 + (i % 2) * .03; Ln([[x, y], [x + .01, y - .05 - (i % 3) * .015]], 1, .7, 1.5); }
    stars(10, (x, y) => y < 0 && Math.hypot(x - sunC[0], y - sunC[1]) > .7); bird(-.5, -.3, .04);
    return { pieces, M: pn.M, mir: true };
  };

  /* ---------------- the forever cycle: which picture each pass lays, and what it rests on ---------------- */
  // the pool: the country first, then the others (each run of passes deals all of them once); the rare ones about one pass
  // in ten, never two within four passes of each other
  const WPOOL = [null, COMPASS, SHIP, LIGHT, BIRD, LEAF], WRARE = [STAG], WNS = WPOOL.length, WNR = WRARE.length;
  const rareHit = P => WNR > 0 && P > 1 && K.deal(P, 191)() < 1 / 6, rareAt = P => rareHit(P) && !rareHit(P - 1) && !rareHit(P - 2) && !rareHit(P - 3);
  const subjOf = P => P <= 0 ? 0 : rareAt(P) ? WNS + Math.floor(K.deal(P, 192)() * WNR) : K.bag(P, WNS, 190);
  const DEFS = new Map();
  /** a picture's pieces and marks, worked out once (and turned the other way round, when a pass deals that) */
  const defOf = (id, mir) => { const key = id + (mir ? "m" : ""); let d = DEFS.get(key); if (d) return d;
    d = (id < WNS ? WPOOL[id] : WRARE[id - WNS])(mir); d.key = key;
    if (!night) d.pieces.forEach((p, i) => { for (const [j, q] of p.parts.entries()) { if (mir && !q.done) { q.pts = q.pts.map(([x, y]) => [-x, y]).reverse(); q.grain = Math.PI - q.grain; } q.done = true; } measure(p, i); });
    else { if (mir) for (const m of d.M) m.pts = m.pts.map(([x, y]) => [-x, y]); timeMarks(d.M); d.SEGS = segsOf(d.M); d.ASHES = ashesOf(d.SEGS); }
    DEFS.set(key, d); return d; };
  /** the pass's pictures: the one it lays (or burns), and the one it rests on (the country's, before pass 1) */
  const passOf = P => { P = Math.max(0, P | 0); if (S.pp && S.pp.P === P && S.pp.RR === S.RR) return S.pp; const pic = q => { const id = subjOf(q); if (id === 0) return sigPic(); const d = defOf(id, d0(id).mir && K.deal(q, 194)() < .5); return night ? nightPic(d) : dayPic(d); };
    const pp = { P, RR: S.RR, cur: pic(P), prev: pic(Math.max(0, P - 1)) };
    for (const d of DEFS.values()) if (d !== pp.cur && d !== pp.prev && d.RR) { d.RR = 0; d.dry = d.oiled = d.shave = d.full = d.hotC = d.glowC = null; if (d.pieces) for (const q of d.pieces) q.spr = q.sh = null; } /* the rest let go */
    return (S.pp = pp); };
  const d0 = id => defOf(id, false);
  /** the country, as a picture like the others (the day's and the night's own, as they were built for this size) */
  const sigPic = () => night ? { sig: true, M: MARKS, SEGS, ASHES, full: S.full, hotC: S.hotC, glowC: S.glowC } : { sig: true, pieces: [...RAYS, ...REST], oiled: S.oiled, dry: S.dry, shave: S.shave };
  /** a piece of a new picture measured: its middle, the box it fills, how far it reaches; and how it flies in */
  const measure = (p, i) => {
    let x0 = 9, y0 = 9, x1 = -9, y1 = -9, A = 0, cx = 0, cy = 0;
    for (const q of p.parts) { const pts = q.pts.map(([x, y]) => { const d = Math.hypot(x, y), f = d > RI ? RI / d : 1; return [x * f, y * f]; });
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const [xa, ya] = pts[a], [xb, yb] = pts[b], cr = xb * ya - xa * yb; A += cr; cx += (xa + xb) * cr; cy += (ya + yb) * cr; x0 = Math.min(x0, xa); y0 = Math.min(y0, ya); x1 = Math.max(x1, xa); y1 = Math.max(y1, ya); } }
    p.c = Math.abs(A) > 1e-5 ? [cx / (3 * A), cy / (3 * A)] : [(x0 + x1) / 2, (y0 + y1) / 2]; p.bb = { x0: x0 - .02, y0: y0 - .02, x1: x1 + .02, y1: y1 + .02 };
    p.L = Math.max(...[[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([u, v]) => Math.hypot(u - p.c[0], v - p.c[1]))) + .05;
    const r = rng(700 + i * 37); p.seed = 4000 + i * 37; p.rot0 = (r() - .5) * 1.7; p.bow = (i % 2 ? 1 : -1) * (.5 + r() * .6);
    p.parts.forEach((q, j) => { let a = 9, b = 9, c = -9, e = -9; for (const [x, y] of q.pts) { const d = Math.hypot(x, y), f = d > 1 ? 1 / d : 1; a = Math.min(a, x * f); b = Math.min(b, y * f); c = Math.max(c, x * f); e = Math.max(e, y * f); } const qc = [(a + c) / 2, (b + e) / 2];
      Object.assign(q, { polys: [poly(q.pts), DISC], c: qc, L: Math.hypot(c - a, e - b) / 2 + .04, seed: p.seed + 7 * j }); });
  };
  /** a new picture cut for this size: each piece's veneers raw (and its shadow), the inlay whole raw and oiled, and the
   *  plank as the plane will find it */
  const dayPic = d => {
    const R = S.RR; if (d.RR === R) return d; const u = 1 / R;
    for (const p of d.pieces) { const { x0, y0, x1, y1 } = p.bb; p.spr = make((x1 - x0) * R, (y1 - y0) * R, x => { x.scale(R, R); x.translate(-x0, -y0); for (const q of p.parts) pieceInto(x, q, false, u); }); p.sh = shadowOf(p.spr, 4, "rgba(78,52,26,.55)"); }
    const whole = oiled => make(2.1 * R, 2.1 * R, x => { x.scale(R, R); x.translate(1.05, 1.05); for (const p of d.pieces) { if (oiled) for (const q of p.parts) pieceInto(x, q, true, u); else x.drawImage(p.spr, p.bb.x0, p.bb.y0, p.bb.x1 - p.bb.x0, p.bb.y1 - p.bb.y0); } ringInto(x, oiled, u); });
    d.dry = whole(false); d.oiled = whole(true);
    d.shave = make(2.2 * R, 2.2 * R, x => { const r = rng(4); x.fillStyle = "#F3E7D3"; x.fillRect(0, 0, 2.2 * R, 2.2 * R); x.strokeStyle = "rgba(216,196,164,.6)"; for (let k = 0; k < 40; k++) { x.lineWidth = .6 + r() * 1.5; const y = r() * 2.2 * R; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(R * .7, y + (r() - .5) * 10, R * 1.4, y + (r() - .5) * 10, 2.2 * R, y + (r() - .5) * 6); x.stroke(); } x.drawImage(d.oiled, .05 * R, .05 * R, 2.1 * R, 2.1 * R); });
    d.RR = R; return d;
  };
  /** a new picture's marks in the pen's order, paced as the country's are (the ring at a compass's pace, dots a tap each,
   *  hops between), fitted to the pen's time */
  const timeMarks = M => { let t = 0, prev = null; for (const m of M) { const p0 = m.pts[0]; if (prev) t += Math.hypot(p0[0] - prev[0], p0[1] - prev[1]) / 16 + (m.dot ? .004 : .008);
      m.len = 0; m.cum = [0]; for (let i = 1; i < m.pts.length; i++) { m.len += Math.hypot(m.pts[i][0] - m.pts[i - 1][0], m.pts[i][1] - m.pts[i - 1][1]); m.cum.push(m.len); }
      m.s = t; t += m.dot ? .014 : m.len / (3.4 * m.v); m.e = t; prev = m.pts[m.pts.length - 1]; }
    const k = (BN.pen[2] - BN.pen[1]) / t; for (const m of M) { m.s = BN.pen[1] + m.s * k; m.e = BN.pen[1] + m.e * k; m.ts = m.cum.map(c => m.s + (m.len ? c / m.len : 1) * (m.e - m.s)); } };
  const segsOf = M => { const out = []; M.forEach(m => { if (m.dot) out.push({ dot: true, a: m.pts[0], t0: m.s, t1: m.e, w: m.w, al: m.a }); else for (let i = 1; i < m.pts.length; i++) out.push({ a: m.pts[i - 1], b: m.pts[i], t0: m.ts[i - 1], t1: m.ts[i], w: m.w, al: m.a }); }); return out.sort((a, b) => a.t1 - b.t1); };
  const ashesOf = SG => { const r = rng(17), out = []; for (const s of SG) { if (s.dot) { out.push({ x: s.a[0], y: s.a[1], s: r() }); continue; } const l = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]); for (let d = r() * .06; d < l; d += .06) { const f = d / l; out.push({ x: lerp(s.a[0], s.b[0], f), y: lerp(s.a[1], s.b[1], f), s: r() }); } } out.forEach(p => { p.d = Math.hypot(p.x, p.y); }); return out; };
  /** a new picture burned for this size: in ash, red-hot, and its glow (small, blurred as it is drawn big) */
  const nightPic = d => {
    const R = S.RR; if (d.RR === R) return d; const n = Math.ceil(2.1 * R * px), gk = .3;
    const unit = (c, k = 1) => { const x = c.getContext("2d"); x.setTransform(px * R * k, 0, 0, px * R * k, 1.05 * R * px * k, 1.05 * R * px * k); x.lineCap = "round"; x.lineJoin = "round"; return x; };
    [d.full] = canvas(n, n); const fx = unit(d.full); for (const s of d.SEGS) ink(fx, s, ASH, s.al);
    [d.hotC] = canvas(n, n); const hx = unit(d.hotC); for (const s of d.SEGS) ink(hx, { ...s, w: s.w + .5 }, [255, 116, 40], 1);
    [d.glowC] = canvas(Math.ceil(n * gk), Math.ceil(n * gk)); const gx = unit(d.glowC, gk); gx.strokeStyle = "rgb(255,100,26)"; gx.fillStyle = "rgb(255,100,26)";
    for (const s of d.SEGS) { if (s.dot) { gx.beginPath(); gx.arc(s.a[0], s.a[1], 2.2 / (R * px * gk), 0, TAU); gx.fill(); } else { gx.lineWidth = (s.w + 1.6) / (R * px * gk); gx.beginPath(); gx.moveTo(s.a[0], s.a[1]); gx.lineTo(s.b[0], s.b[1]); gx.stroke(); } }
    d.RR = R; return d;
  };

  /* ---------------- 1.12 b417: the egg — the medallion was a sliding puzzle all along ----------------
     A square of sixteen in the middle of the inlay (in the medallion's units) and the four caps of inlay round it; the
     cuts that part them, in the order they run (round the square, down it, across it, out from its corners to the rim);
     and the beats: the cuts, a tile lifted out and gone, nine slides, the wave of turning over, the slides home, the tile
     back, the cuts closed. Its own dice (salt 451), so no pass that isn't an egg draws a thing differently. */
  const PZH = .615, PZS = PZH / 2, PZC = Array.from({ length: 16 }, (_, c) => [-PZH + (c % 4 + .5) * PZS, -PZH + ((c >> 2) + .5) * PZS]);
  const EW = { crack: [.7, 2.0], lift: [2.0, 2.95], mix: [3.0, 6.6], flip: [6.7, 8.15], solve: [8.25, 11.85], back: [11.85, 12.95], seal: [13.0, 14.05] };
  const CAPS = [0, 1, 2, 3].map(k => { const a0 = -3 * Math.PI / 4 + k * Math.PI / 2, a1 = a0 + Math.PI / 2, m = (a0 + a1) / 2, d = PZH * Math.SQRT2;
    const pts = [[Math.cos(a0) * d, Math.sin(a0) * d], ...arcPts(0, 0, RI, a0, a1, 24), [Math.cos(a1) * d, Math.sin(a1) * d]], xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    return { pts, x: Math.cos(m) * (PZH + RI) / 2, y: Math.sin(m) * (PZH + RI) / 2, bb: [Math.min(...xs) - .01, Math.min(...ys) - .01, Math.max(...xs) + .01, Math.max(...ys) + .01] }; });
  const CUTS = (() => { const h = PZH, c0 = EW.crack[0], out = [{ pts: [[-h, -h], [h, -h], [h, h], [-h, h], [-h, -h]], t0: c0, t1: c0 + .62 }];
    for (let i = 1; i < 4; i++) { const v = -h + i * PZS; out.push({ pts: [[v, -h], [v, h]], t0: c0 + .3 + i * .1, t1: c0 + .62 + i * .1 }, { pts: [[-h, v], [h, v]], t0: c0 + .45 + i * .1, t1: c0 + .77 + i * .1 }); }
    for (let k = 0; k < 4; k++) { const a = -3 * Math.PI / 4 + k * Math.PI / 2, d = PZH * Math.SQRT2; out.push({ pts: [[Math.cos(a) * d, Math.sin(a) * d], [Math.cos(a) * RI, Math.sin(a) * RI]], t0: c0 + .92 + k * .05, t1: c0 + 1.13 + k * .05 }); }
    return out.map(c => { let L = 0; const cum = [0]; for (let i = 1; i < c.pts.length; i++) { L += Math.hypot(c.pts[i][0] - c.pts[i - 1][0], c.pts[i][1] - c.pts[i - 1][1]); cum.push(L); } return { ...c, L, cum }; }); })();
  /** a point a fraction p of the way along a cut */
  const alongCut = (c, p) => { const d = clamp(p) * c.L; let i = 1; while (i < c.cum.length - 1 && c.cum[i] < d) i++; const f = (d - c.cum[i - 1]) / ((c.cum[i] - c.cum[i - 1]) || 1); return [lerp(c.pts[i - 1][0], c.pts[i][0], f), lerp(c.pts[i - 1][1], c.pts[i][1], f)]; };
  /** the stretch of a cut between two fractions of it, as a path on the page */
  const cutPath = (c, p0, p1) => { const { cx, cy, R } = S, a = alongCut(c, p0), b = alongCut(c, p1), d0 = p0 * c.L, d1 = p1 * c.L; g.moveTo(cx + a[0] * R, cy + a[1] * R);
    for (let i = 1; i < c.pts.length - 1; i++) if (c.cum[i] > d0 && c.cum[i] < d1) g.lineTo(cx + c.pts[i][0] * R, cy + c.pts[i][1] * R); g.lineTo(cx + b[0] * R, cy + b[1] * R); };
  /** the egg pass's moves, from the pass alone: the gap starts where the lifted tile was (bottom right) and wanders twelve
   *  cells, never straight back and wherever it can somewhere it hasn't lately been, so the picture is well jumbled; and
   *  which cell each tile is in after each move */
  let eggW = null;
  const eggPlanW = P => { if (eggW && eggW.P === P) return eggW; const r = K.deal(P, 451), moves = [], board = [...Array(15).keys(), -1], seen = [15]; let e = 15;
    for (let i = 0; i < 12; i++) { const nb = []; if (e % 4) nb.push(e - 1); if (e % 4 < 3) nb.push(e + 1); if (e > 3) nb.push(e - 4); if (e < 12) nb.push(e + 4);
      const fresh = nb.filter(c => !seen.slice(-5).includes(c)), opts = fresh.length ? fresh : nb.filter(c => c !== seen[seen.length - 2]), to = opts[Math.floor(r() * opts.length)], t = board[to];
      board[e] = t; board[to] = -1; moves.push({ t, from: to, to: e }); e = to; seen.push(e); }
    const after = [[...Array(15).keys()]]; for (const m of moves) { const c = after[after.length - 1].slice(); c[m.t] = m.to; after.push(c); }
    return (eggW = { P, moves, after, spin: r() < .5 ? -1 : 1 }); };
  /** where the tiles are at time T: the cell each is in, and the one sliding (scrambled, or back home) and how far */
  const boardAt = (T, pl) => { const n = pl.moves.length, [m0, m1] = EW.mix, [s0, s1] = EW.solve, a = (m1 - m0) / n, b = (s1 - s0) / n;
    if (T < m0 || T >= s1) return { cells: pl.after[0], mv: null, f: 0 };
    if (T < m1) { const i = Math.min(n - 1, Math.floor((T - m0) / a)); return { cells: pl.after[i], mv: pl.moves[i], f: E.io(clamp((T - m0 - i * a) / (a * .78))), rev: false }; }
    if (T < s0) return { cells: pl.after[n], mv: null, f: 0 };
    const j = Math.min(n - 1, Math.floor((T - s0) / b)); return { cells: pl.after[n - j], mv: pl.moves[n - 1 - j], f: E.io(clamp((T - s0 - j * b) / (b * .78))), rev: true }; };
  const tileXY = (bd, t) => { const m = bd.mv; if (m && m.t === t) { const p0 = PZC[bd.rev ? m.to : m.from], p1 = PZC[bd.rev ? m.from : m.to]; return [lerp(p0[0], p1[0], bd.f), lerp(p0[1], p1[1], bd.f)]; } return PZC[bd.cells[t]]; };
  /** how far a piece at (x, y) has turned over in the wave (0 face up … π the other face up): top left first */
  const turnAt = (T, x, y) => { const t0 = EW.flip[0] + clamp((x + y + 1) / 2) * (EW.flip[1] - EW.flip[0] - .62); return Math.PI * E.io(clamp((T - t0) / .62)); };
  /** the lifted tile's way off the page, on the side away from the words (0 home … 1 gone) */
  const offPath = (q, dir) => { const { cx, cy, R } = S, [dx, dy] = S.away, X = cx + PZC[15][0] * R, Y = cy + PZC[15][1] * R, D = out(X, Y, dx, dy) + PZS * R * 1.2 + 30, bow = Math.sin(Math.PI * q) * D * .12 * dir;
    return [X + dx * D * q - dy * bow, Y + dy * D * q + dx * bow]; };
  /** by night a picture's plate: the char under it (from the backdrop), the moon's light, its lines — what a tile carries */
  const plateOf = d => { const { cx, cy, R } = S, key = [S.RR, Math.round(cx), Math.round(cy), Math.round(R), S.vis > .99 ? 1 : +S.vis.toFixed(2)].join(":"), sl = S.plates || (S.plates = []);
    let e = sl.find(q => q.d === d); if (e && e.key === key && e.src === d.full) return e.c;
    const n = d.full.width, [c, x] = canvas(n, n), b = S.bgc, sc = b.width / S.W, m = n / 2.1; x.imageSmoothingEnabled = true;
    x.drawImage(b, (cx - 1.05 * R) * sc, (cy - 1.05 * R) * sc, 2.1 * R * sc, 2.1 * R * sc, 0, 0, n, n);
    x.globalAlpha = .13 * S.vis; x.drawImage(S.moonGlow, n / 2 - .62 * m, n / 2 - .62 * m, 1.24 * m, 1.24 * m); x.globalAlpha = 1; x.drawImage(d.full, 0, 0, n, n);
    if (!e) { e = { d }; sl.push(e); if (sl.length > 2) sl.shift(); } Object.assign(e, { key, src: d.full, c }); return c; };
  /** the puzzle, by day or by night, over the medallion: a (the picture the pass began on) and b (the one it leaves), as
   *  the canvases the tiles are cut from; in place of the plane, the pieces and the rag, or the glow and the pen */
  function eggPuzzle(T, I, A, a, b, night, al) {
    const { cx, cy, R } = S, V = S.vis * al, k = R / S.RR, pl = eggPlanW(S.pp.P), [l0, l1] = EW.lift, [b0, b1] = EW.back, at = (u, v) => [cx + u * R, cy + v * R];
    const whole = c => { g.save(); g.beginPath(); g.arc(cx, cy, 1.03 * R, 0, TAU); g.clip(); g.globalAlpha = V; g.drawImage(c, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.restore(); };
    if (!S.tsh || S.tshR !== S.RR) { const s = PZS * S.RR; S.tsh = shadowOf(make(s, s, x => { x.fillStyle = "#000"; x.fillRect(0, 0, s, s); }), 5, night ? "rgba(0,0,0,.85)" : "rgba(64,40,18,.62)"); S.tshR = S.RR; }
    const bd = boardAt(T, pl), D0 = PZS * R, tsh = S.tsh, n = a.width / 2.1;
    // the recess they sit in, under all of them: raw wood by day, by night the char gone deep, an ember in it
    // the ring stays as it is (the picture's own, the same on both); inside it, the recess the pieces sit in, under all of
    // them: raw wood by day, by night the char gone deep with an ember in it — laid only where it can show (the gap, where
    // a tile slides, under a piece as it turns)
    g.save(); g.beginPath(); g.arc(cx, cy, 1.03 * R, 0, TAU); g.arc(cx, cy, RI * R * .995, 0, TAU, true); g.clip("evenodd"); whole(a); g.restore();
    const hole = (() => { const used = new Set(bd.cells); for (let c = 0; c < 16; c++) if (!used.has(c)) return c; return 15; })(), [hx, hy] = at(...PZC[hole]);
    // what goes into it: the caps and the tiles, each turned over as the wave reaches it, lifted while it turns
    const pieces = [];
    CAPS.forEach((c, i) => pieces.push({ cap: i, x: c.x, y: c.y, th: turnAt(T, c.x, c.y) }));
    for (let t = 0; t < 15; t++) { const [x, y] = tileXY(bd, t); pieces.push({ t, x, y, th: turnAt(T, x, y) }); }
    if (T >= b1) pieces.push({ t: 15, x: PZC[15][0], y: PZC[15][1], th: Math.PI, zz: .16 * Math.sin(Math.PI * clamp((T - b1) / .24)) * (T - b1 < .24 ? 1 : 0) }); // (home, and a little bounce)
    for (const p of pieces) p.z = p.zz !== undefined ? p.zz : Math.sin(p.th) * .9;
    const cellRect = (u, v, e = 0) => { const h = PZS / 2 + e; g.rect(cx + (u - h) * R, cy + (v - h) * R, 2 * h * R, 2 * h * R); };
    g.save(); g.beginPath(); cellRect(...PZC[hole], .02); if (bd.mv) { cellRect(...PZC[bd.mv.from], .02); cellRect(...PZC[bd.mv.to], .02); }
    for (const p of pieces) { if (p.z <= .01 && Math.abs(Math.cos(p.th)) > .995) continue; if (p.cap !== undefined) { g.moveTo(cx + CAPS[p.cap].pts[0][0] * R, cy + CAPS[p.cap].pts[0][1] * R); CAPS[p.cap].pts.forEach(([u, v]) => g.lineTo(cx + u * R, cy + v * R)); g.closePath(); } else cellRect(p.x, p.y, .02); }
    g.clip(); g.beginPath(); g.arc(cx, cy, RI * R, 0, TAU); g.clip(); g.globalAlpha = V;
    let q = g.createRadialGradient(cx - R * .3, cy - R * .3, 0, cx, cy, RI * R); q.addColorStop(0, night ? "#100B08" : "#8C6A45"); q.addColorStop(1, night ? "#060403" : "#6A4A2C"); g.fillStyle = q; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    if (night) { g.globalCompositeOperation = "lighter"; g.globalAlpha = V * (.32 + .14 * Math.sin(A * 1.3)); g.drawImage(S.halo, hx - D0 * .6, hy - D0 * .6, D0 * 1.2, D0 * 1.2); g.globalCompositeOperation = "source-over"; }
    // the pieces' shadows on it (only seen in the gap, and under a piece as it turns)
    for (const p of pieces) { if (p.cap !== undefined) continue; const near = Math.abs(p.x - PZC[hole][0]) < PZS * 1.5 && Math.abs(p.y - PZC[hole][1]) < PZS * 1.5; if (p.z <= .01 && !near) continue;
      const sx = Math.max(.02, Math.abs(Math.cos(p.th))), D = D0 * (1 + .06 * p.z), [X, Y] = at(p.x, p.y);
      g.save(); g.globalAlpha = V * (.75 - .25 * p.z); g.translate(X + (1.5 + 12 * p.z) * k, Y + (2.5 + 16 * p.z) * k); g.scale(sx, 1); g.drawImage(tsh, -D / 2 - 10 * k, -D / 2 - 10 * k, D + 20 * k, D + 20 * k); g.restore(); }
    g.restore();
    const edge = night ? ["rgba(6,4,3,.92)", "rgba(156,128,106,.22)", "rgba(0,0,0,.38)"] : ["rgba(36,20,10,.74)", "rgba(255,248,230,.36)", "rgba(46,26,10,.3)"];
    /** how a turning face is lit: its normal swung about the upright, against a light up on the left (1 face up) */
    const lit = th => { const c = Math.cos(th), s2 = Math.sin(th); return c >= 0 ? (c * .77 - s2 * .5) / .77 : (-c * .77 + s2 * .5) / .77; };
    const shadeFace = (th, x0, y0, w, h) => { const l = lit(th); if (Math.abs(l - 1) < .01) return; const al = g.globalAlpha;
      if (l < 1) { g.globalAlpha = al * Math.min(1, (1 - l) * .62); g.fillStyle = night ? "#000" : "#2E1B0B"; } else { g.globalAlpha = al * Math.min(1, (l - 1) * 1.5); g.fillStyle = night ? "rgb(150,120,96)" : "#FFF6E2"; }
      g.fillRect(x0, y0, w, h); g.globalAlpha = al; };
    const emb = night ? seg(T, l0, l0 + .6, E.io) * (1 - seg(T, EW.seal[0] - .45, EW.seal[0], E.io)) : 0; // (by night the cuts smoulder)
    const ember = (path, ph, e = emb) => { if (e <= .004) return; const k = e * (.72 + .28 * Math.sin(A * 1.6 + ph)), al = g.globalAlpha; g.globalCompositeOperation = "lighter";
      const lw = clamp(R / 130, .9, 1.5); g.globalAlpha = al * k * .3; g.strokeStyle = "rgb(255,104,28)"; g.lineWidth = 3.2 * lw; path(); g.stroke(); g.globalAlpha = al * k * .42; g.strokeStyle = "#FFB868"; g.lineWidth = .9 * lw; path(); g.stroke(); g.globalCompositeOperation = "source-over"; g.globalAlpha = al; };
    const drawPiece = p => {
      const sx = Math.max(.02, Math.abs(Math.cos(p.th))), src = p.th < Math.PI / 2 ? a : b, lift = 1 + .06 * p.z;
      g.save(); g.globalAlpha = V;
      if (p.cap !== undefined) { const C = CAPS[p.cap]; g.translate(cx + C.x * R, cy + C.y * R - p.z * 7 * k); g.scale(sx * lift * R, lift * R); g.translate(-C.x, -C.y);
        g.save(); trace(g, C.pts); g.clip(); { const [u0, v0, u1, v1] = C.bb, m = src.width / 2.1; g.drawImage(src, (u0 + 1.05) * m, (v0 + 1.05) * m, (u1 - u0) * m, (v1 - v0) * m, u0, v0, u1 - u0, v1 - v0); shadeFace(p.th, u0, v0, u1 - u0, v1 - v0); } g.restore();
        g.globalAlpha = V; g.lineWidth = 1.5 / R; g.strokeStyle = edge[0]; trace(g, C.pts); g.stroke(); g.restore();
        if (emb > .004) { g.save(); g.globalAlpha = V; g.translate(cx + C.x * R, cy + C.y * R - p.z * 7 * k); g.scale(sx * lift, lift); g.translate(-C.x * R, -C.y * R); ember(() => { g.beginPath(); const P0 = C.pts[0], P1 = C.pts[C.pts.length - 1], Q0 = C.pts[1], Q1 = C.pts[C.pts.length - 2]; g.moveTo(Q0[0] * R, Q0[1] * R); g.lineTo(P0[0] * R, P0[1] * R); g.lineTo(P1[0] * R, P1[1] * R); g.lineTo(Q1[0] * R, Q1[1] * R); }, p.cap * 1.7); g.restore(); }
        return; }
      const [hx0, hy0] = PZC[p.t], D = D0 * lift, [X, Y] = at(p.x, p.y);
      g.translate(X, Y - p.z * 7 * k); g.scale(sx, 1); g.drawImage(src, (hx0 - PZS / 2 + 1.05) * n, (hy0 - PZS / 2 + 1.05) * n, PZS * n, PZS * n, -D / 2, -D / 2, D, D);
      shadeFace(p.th, -D / 2, -D / 2, D, D);
      const e = D / 2 - .5; g.lineWidth = night ? 1.4 : 1.6; g.strokeStyle = edge[0]; g.strokeRect(-D / 2, -D / 2, D, D);
      g.lineWidth = 1; g.strokeStyle = edge[1]; g.beginPath(); g.moveTo(-e + 1, e - 1); g.lineTo(-e + 1, -e + 1); g.lineTo(e - 1, -e + 1); g.stroke(); g.strokeStyle = edge[2]; g.beginPath(); g.moveTo(e - 1, -e + 1); g.lineTo(e - 1, e - 1); g.lineTo(-e + 1, e - 1); g.stroke();
      ember(() => { g.beginPath(); g.rect(-D / 2, -D / 2, D, D); }, p.t * 2.3);
      g.restore(); };
    pieces.filter(p => p.z <= .01).forEach(drawPiece); pieces.filter(p => p.z > .01).sort((p, q2) => p.z - q2.z).forEach(drawPiece);
    // the tile lifted out: up, and off the page on the side away from the words; then back, the other way up, and down
    // into the gap with a click
    let mx = null;
    if (T >= l0 && T < l1) { const u = seg(T, l0, l1, lin), go = E.in(clamp((u - .22) / .78)); mx = { src: a, at: offPath(go, pl.spin), z: E.out(clamp(u / .3)), rot: pl.spin * go * 2.4 }; }
    else if (T >= b0 && T < b1) { const u = seg(T, b0, b1, lin), go = 1 - E.out(clamp(u / .74)); mx = { src: b, at: offPath(go, pl.spin), z: u < .74 ? 1 : 1 - E.in(clamp((u - .74) / .26)), rot: pl.spin * go * 2.4 }; }
    if (mx) { const [X, Y] = mx.at, D = D0 * (1 + .08 * mx.z), [hx0, hy0] = PZC[15];
      const fa = night ? V : V * I;
      if (mx.z > .01) { g.save(); g.globalAlpha = fa * mx.z * .7; g.translate(X + (3 + 14 * mx.z) * k, Y + (5 + 20 * mx.z) * k); g.rotate(mx.rot); g.drawImage(tsh, -D / 2 - 10 * k, -D / 2 - 10 * k, D + 20 * k, D + 20 * k); g.restore(); }
      g.save(); g.globalAlpha = fa; g.translate(X, Y - mx.z * 7 * k); g.rotate(mx.rot); g.drawImage(mx.src, (hx0 - PZS / 2 + 1.05) * n, (hy0 - PZS / 2 + 1.05) * n, PZS * n, PZS * n, -D / 2, -D / 2, D, D);
      g.lineWidth = 1.4; g.strokeStyle = edge[0]; g.strokeRect(-D / 2, -D / 2, D, D); if (night) ember(() => { g.beginPath(); g.rect(-D / 2, -D / 2, D, D); }, 0, .85); g.restore(); }
    g.globalAlpha = 1;
  }
  /** the cuts as they run, or as they close: by day a glue line scored across with a glint at its head; by night burned
   *  through, white-hot at the head and cooling behind it; closed again under a sheen, or fused by a run of heat */
  function eggCuts(T, I, night) {
    if (T < EW.crack[0] || (T >= EW.crack[1] && T < EW.seal[0]) || T >= EW.seal[1]) return;
    const { R } = S, V = S.vis * I, k = R / S.RR, [, c1] = EW.crack, [s0, s1] = EW.seal; if (!night && !S.glint) S.glint = K.glowSpr(10, [255, 252, 240], 1);
    const run = T < c1, close = run ? 0 : seg(T, s0, s1, lin), dark = run ? 1 : 1 - E.io(clamp(close / .75)); if (dark <= .003 && !night) return;
    g.save(); g.lineCap = "round"; g.lineJoin = "miter";
    for (const c of CUTS) { const p = run ? seg(T, c.t0, c.t1, lin) : 1; if (p <= 0) continue;
      g.beginPath(); cutPath(c, 0, p); g.globalAlpha = V * dark; g.strokeStyle = night ? "rgba(6,4,3,.95)" : "rgba(36,20,10,.8)"; g.lineWidth = (night ? 1.6 : 1.9) * Math.max(1, k * .9); g.stroke();
      if (!night) { g.beginPath(); cutPath(c, 0, p); g.save(); g.translate(.9, .9); g.globalAlpha = V * dark * .9; g.strokeStyle = "rgba(255,248,230,.4)"; g.lineWidth = 1; g.stroke(); g.restore(); }
      if (run) { const hot0 = seg(T - .42, c.t0, c.t1, lin), hot1 = seg(T - .14, c.t0, c.t1, lin);
        g.globalCompositeOperation = "lighter";
        if (night && p > hot0) { g.beginPath(); cutPath(c, hot0, p); g.globalAlpha = V * .55; g.strokeStyle = "rgb(255,120,36)"; g.lineWidth = 4.5; g.stroke(); g.beginPath(); cutPath(c, Math.max(hot0, hot1), p); g.globalAlpha = V; g.strokeStyle = "#FFE19C"; g.lineWidth = 1.6; g.stroke(); }
        if (p < 1) { const [u, v] = alongCut(c, p), x = S.cx + u * R, y = S.cy + v * R; g.globalAlpha = V * (night ? 1 : .9); g.drawImage(night ? S.halo : S.glint, x - 9, y - 9, 18, 18); }
        g.globalCompositeOperation = "source-over"; }
    }
    // closing: by night a run of heat along every cut, fusing it, as it fades
    if (night && !run) { const hk = env(close, 0, .22, .42, .95, E.sine); if (hk > .003) { g.globalCompositeOperation = "lighter"; for (const c of CUTS) { const w = clamp(close * 2.2 - c.t0 + EW.crack[0]); if (w <= 0) continue; g.beginPath(); cutPath(c, 0, w); g.globalAlpha = V * hk * .6; g.strokeStyle = "rgb(255,120,36)"; g.lineWidth = 4; g.stroke(); g.globalAlpha = V * hk; g.strokeStyle = "#FFC46E"; g.lineWidth = 1.2; g.stroke(); } g.globalCompositeOperation = "source-over"; } }
    g.restore(); g.globalAlpha = 1;
  }
  /** the egg by day: the oiled picture the pass began on, cut and slid about, turned over to the one it leaves, slid home */
  function eggDay(T, I, prev, cur) {
    const { cx, cy, R } = S, V = S.vis, whole = (c, a = 1) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.globalAlpha = 1; };
    if (I <= .01 || T < EW.lift[0]) { whole(prev.oiled); return; } // (at rest, and while the cuts run)
    if (T >= EW.seal[0]) whole(cur.oiled); else eggPuzzle(T, I, 0, prev.oiled, cur.oiled, false, 1);
    whole(prev.oiled, 1 - I); // (the list touched: back to the picture the pass began on)
  }
  /** the egg by night: the same, the tiles cut from the char with the lines burned in them */
  function eggNight(T, I, A, prev, cur) {
    const { cx, cy, R } = S, V = S.vis, pic = (c, a) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.globalAlpha = 1; };
    if (I <= .01 || T < EW.lift[0]) { pic(prev.full, 1); return; }
    if (T >= EW.seal[0]) pic(cur.full, I); else eggPuzzle(T, I, A, plateOf(prev), plateOf(cur), true, I);
    pic(prev.full, 1 - I);
  }
  /** the click: the last tile down in its gap, a puff of sawdust (by night of ash, and a few sparks) out of the joins */
  function eggClick(T, I, night) {
    const u = (T - EW.back[1]) / .55; if (u < 0 || u > 1) return; const { cx, cy, R } = S, V = S.vis, k = R / S.RR, [hx, hy] = PZC[15], r = rng(977), h = PZS / 2;
    g.save();
    for (let i = 0; i < 26; i++) { const sd = i % 4, f = r() * 2 - 1, ex = sd === 0 ? f * h : sd === 1 ? h : sd === 2 ? f * h : -h, ey = sd === 0 ? -h : sd === 1 ? f * h : sd === 2 ? h : f * h, ox = sd === 1 ? 1 : sd === 3 ? -1 : 0, oy = sd === 0 ? -1 : sd === 2 ? 1 : 0, sp = (.05 + r() * .09) * E.out(u);
      const x = cx + (hx + ex + ox * sp + (r() - .5) * .02) * R, y = cy + (hy + ey + oy * sp) * R - u * (6 + r() * 8) * k, s = (1.1 + r() * 1.6) * Math.max(1, k);
      g.globalAlpha = V * I * (1 - u) * .85; g.fillStyle = night ? (i % 5 === 0 ? "#FFB257" : "rgb(196,182,166)") : "#C9AD80"; g.fillRect(x - s / 2, y - s / 2, s, s); }
    g.restore(); g.globalAlpha = 1;
  }

  /* ---------------- 1.12 b431: the long day's hour eggs ----------------
     Two, for a list left up for hours (K.long: once in each hour of loops left alone, the first in odd hours, the second
     in even), each one idea by day and by night. Each plays in place of the plane and the rag (the glow and the pen),
     from the picture the pass began on to the one the pass would have left, so the pass after it rests where it always
     would; a touch eases back to the picture it began on, as any pass does. Neither draws a die any other pass draws. */
  const longOf = P => { if (S.lgP !== P) { const l = K.long ? K.long(P) : 0; S.lgP = P; S.lgK = l === 1 || l === 2 ? l : 0; } return S.lgK; };
  /** a piece of veneer for the hour eggs' things (a hand, a mark, a bird's wing), as the pictures' pieces are: its wood,
   *  its shape, the way its grain runs */
  const vpiece = (wood, pts, grain, seed) => { let x0 = 9, y0 = 9, x1 = -9, y1 = -9, sx = 0, sy = 0; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); sx += x; sy += y; }
    return { wood, polys: [poly(pts)], grain, seed, pts, c: [sx / pts.length, sy / pts.length], L: Math.hypot(x1 - x0, y1 - y0) / 2 + .06, bx: [x0, y0, x1, y1] }; };
  /** things drawn once for this size (in the medallion's units, at its radius): by day pieces of veneer, oiled; by night
   *  char cut out, its lines burned in ash; `extra` draws on top; the sprite knows its box */
  const thing = (pieces, extra, pad = .03) => { let x0 = 9, y0 = 9, x1 = -9, y1 = -9; for (const p of pieces) { x0 = Math.min(x0, p.bx[0]); y0 = Math.min(y0, p.bx[1]); x1 = Math.max(x1, p.bx[2]); y1 = Math.max(y1, p.bx[3]); }
    x0 -= pad; y0 -= pad; x1 += pad; y1 += pad; const R = S.RR, u = 1 / R;
    const c = make((x1 - x0) * R, (y1 - y0) * R, x => { x.scale(R, R); x.translate(-x0, -y0);
      if (!night) for (const p of pieces) pieceInto(x, p, true, u);
      else for (const p of pieces) { x.save(); trace(x, p.pts); x.clip(); const q = x.createLinearGradient(p.bx[0], p.bx[1], p.bx[2], p.bx[3]); q.addColorStop(0, p.lit || "#3A2E26"); q.addColorStop(1, p.dark || "#211915"); x.fillStyle = q; x.fillRect(p.bx[0] - .1, p.bx[1] - .1, p.bx[2] - p.bx[0] + .2, p.bx[3] - p.bx[1] + .2); x.restore();
        x.strokeStyle = rgba(ASH, .9); x.lineWidth = 1.3 * u * S.ws; x.lineJoin = "round"; trace(x, p.pts); x.stroke(); }
      if (extra) extra(x, u); });
    c.bx = [x0, y0, x1, y1]; return c; };
  /** a thing drawn at (x, y) on the page (its own origin there), turned by `rot` about that origin, scaled by `sc` */
  const put2 = (c, x, y, rot, sc, a) => { if (a <= .003) return; const R = S.R; g.save(); g.globalAlpha = a; g.translate(x, y); if (rot) g.rotate(rot); if (sc !== 1) g.scale(sc, sc); g.drawImage(c, c.bx[0] * R, c.bx[1] * R, (c.bx[2] - c.bx[0]) * R, (c.bx[3] - c.bx[1]) * R); g.restore(); };

  // The first: the cuckoo. It is an hour egg, so the medallion is a clock for the hour: its marks let in round it, its
  // hands dropped on; a door cut in its top; the minute hand goes once round, an hour passing, and behind it the picture
  // turns to the next; at the hour the door opens and the cuckoo comes out on its perch and calls the hour — once for
  // each hour the list has been up, round again after twelve — beak and wings and tail, without a sound (by night a puff
  // of smoke with each call); it goes in, the door shuts, the clock is taken off again, and the cut closes.
  const EC = { marks: [.5, 1.55], hands: [1.15, 2.2], cut: [1.95, 2.85], set: [2.3, 3.05], sweep: [3.2, 6.95], open: [7.05, 7.45], out: [7.35, 7.85], call0: 7.95 };
  /** the cuckoo's pass: how many calls (the hours the list has been up, round again after twelve), how long each, and when
   *  it goes in, the door shuts, the clock goes and the cut closes */
  const ckPlan = P => { if (S.ckp && S.ckp.P === P) return S.ckp; const h = Math.max(1, Math.floor(P / 240)), n = (h - 1) % 12 + 1, d = Math.min(.8, 3.9 / n), ce = EC.call0 + n * d + .45;
    return (S.ckp = { P, n, d, back: [ce, ce + .42], shut: [ce + .4, ce + .7], leave: [ce + .76, ce + 1.7], seal: [ce + .8, ce + 1.8], spin: K.deal(P, 471)() < .5 ? -1 : 1 }); };
  const CKDOOR = [[-.115, -.67], [-.115, -.9], ...arcPts(0, -.9, .115, Math.PI, TAU, 18).slice(1, -1), [.115, -.9], [.115, -.67]];
  const CKMARK = k => { const a = -Math.PI / 2 + k * Math.PI / 6, l = k % 3 ? .045 : .066, w = k % 3 ? .019 : .03, c = Math.cos(a), s = Math.sin(a), m = .81;
    return [[c * (m - l) - s * w, s * (m - l) + c * w], [c * (m + l) - s * w, s * (m + l) + c * w], [c * (m + l) + s * w, s * (m + l) - c * w], [c * (m - l) + s * w, s * (m - l) - c * w]]; };
  // the hands, pointing up from their pivot: a spade at the tip, a fret in it, a counterweight behind; the boss
  const HANDM = [[0, -.67], [.056, -.565], [.02, -.47], [.014, -.42], [.016, .06], [-.016, .06], [-.014, -.42], [-.02, -.47], [-.056, -.565]];
  const HANDH = [[0, -.47], [.075, -.37], [.026, -.29], [.02, .05], [-.02, .05], [-.026, -.29], [-.075, -.37]];
  // the bird, facing left, in the medallion's units, its feet on its perch at (0, 0)
  const CB = { tail: [[.1, -.135], [.36, -.085], [.4, -.042], [.12, -.075]], body: ellPts(.03, -.12, .158, .094, .2, 40), breast: ellPts(-.065, -.098, .09, .062, .45, 30),
    head: ellPts(-.128, -.218, .088, .083, 0, 30), bill: [[-.2, -.245], [-.318, -.222], [-.206, -.2]], jaw: [[-.206, -.211], [-.296, -.207], [-.198, -.186]],
    ring: ellPts(-.15, -.236, .032, .032, 0, 18), eye: ellPts(-.152, -.236, .019, .019, 0, 14), wing: [[-.07, -.165], [.04, -.208], [.2, -.18], [.275, -.118], [.12, -.088], [-.05, -.103]],
    perch: [[-.15, .0], [.15, .0], [.15, .024], [-.15, .024]], legs: [[-.024, -.05], [-.012, -.05], [-.016, .0], [-.03, .0], [.024, -.05], [.036, -.05], [.034, .0], [.02, .0]],
    pv: { tail: [.11, -.1], head: [-.08, -.155], jaw: [-.2, -.2], wing: [-.055, -.145] } };
  /** the cuckoo's things for this size: the marks, the hands, the bird in its parts, its shadow, the door's back */
  const ckThings = () => {
    if (S.ckt && S.ckt.RR === S.RR) return S.ckt; const t = { RR: S.RR };
    const lit = (p, a, b) => { p.lit = a; p.dark = b; return p; };
    t.marks = Array.from({ length: 12 }, (_, k) => k ? thing([lit(vpiece("holly", CKMARK(k), -Math.PI / 2 + k * Math.PI / 6, 9100 + k), "#4A3B31", "#2E241E")]) : null);
    const disc = (cx2, cy2, r2) => ellPts(cx2, cy2, r2, r2, 0, 24);
    t.hm = thing([lit(vpiece("ebony", HANDM, Math.PI / 2, 9201), "#3C3029", "#1E1713"), lit(vpiece("ebony", disc(0, .085, .036), 0, 9202), "#3C3029", "#1E1713")], (x, u) => { if (night) return; trace(x, [[0, -.615], [.019, -.56], [0, -.505], [-.019, -.56]]); x.fillStyle = rgba(hex(WOOD.holly.oil[0])); x.fill(); x.lineWidth = 1.2 * u; x.strokeStyle = "rgba(36,20,10,.7)"; x.stroke(); });
    t.hh = thing([lit(vpiece("ebony", HANDH, Math.PI / 2, 9203), "#3C3029", "#1E1713"), lit(vpiece("ebony", disc(0, .075, .044), 0, 9204), "#3C3029", "#1E1713")], (x, u) => { if (night) return; trace(x, [[0, -.42], [.027, -.365], [0, -.315], [-.027, -.365]]); x.fillStyle = rgba(hex(WOOD.holly.oil[0])); x.fill(); x.lineWidth = 1.2 * u; x.strokeStyle = "rgba(36,20,10,.7)"; x.stroke(); });
    t.boss = thing([lit(vpiece("satin", disc(0, 0, .052), .4, 9205), "#5A4636", "#2E2219")], (x, u) => { x.fillStyle = night ? rgba(ASH, .9) : rgba(hex(WOOD.holly.oil[0])); x.beginPath(); x.arc(0, 0, .018, 0, TAU); x.fill(); });
    // the bird: its tail, its body and barred breast, its wing, its head and bill, its jaw, its perch and legs
    const ck = (w, pts, gr, s, a = "#3E312A", b = "#241B16") => lit(vpiece(w, pts, gr, s), a, b);
    t.perch = thing([ck("satin", CB.perch, 0, 9301, "#5A4636", "#2E2219"), ck("ebony", CB.legs.slice(0, 4), Math.PI / 2, 9302), ck("ebony", CB.legs.slice(4), Math.PI / 2, 9303)]);
    t.tail = thing([ck("walnut", CB.tail, .25, 9304)], (x, u) => { x.save(); trace(x, CB.tail); x.clip(); x.strokeStyle = night ? rgba(ASH, .75) : rgba(hex(WOOD.holly.oil[0]), .95); x.lineWidth = (night ? 1 : 2.2) * u; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(.31 - k * .028, -.1); x.lineTo(.3 - k * .028, -.02); x.stroke(); } x.restore(); });
    const bars = (x, u, pts, col, w) => { x.save(); trace(x, pts); x.clip(); x.strokeStyle = col; x.lineWidth = w * u; for (let k = 0; k < 7; k++) { const y = -.15 + k * .018; x.beginPath(); x.moveTo(-.16, y + .02); x.quadraticCurveTo(-.07, y + .028, .02, y); x.stroke(); } x.restore(); };
    t.body = thing([ck("walnut", CB.body, .2, 9305, "#3E312A", "#221A15"), ck("holly", CB.breast, .45, 9306, "#4B3D33", "#2E241E")], (x, u) => bars(x, u, CB.breast, night ? rgba(ASH, .8) : "rgba(46,30,20,.62)", night ? 1 : 1.6));
    t.wing = thing([ck("teak", CB.wing, -.2, 9307)], (x, u) => { x.save(); trace(x, CB.wing); x.clip(); x.strokeStyle = night ? rgba(ASH, .7) : "rgba(40,22,10,.55)"; x.lineWidth = (night ? 1 : 1.4) * u; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(.07 + k * .045, -.2); x.quadraticCurveTo(.09 + k * .045, -.14, .06 + k * .05, -.09); x.stroke(); } x.restore(); });
    t.head = thing([ck("walnut", CB.head, 0, 9308, "#3E312A", "#221A15"), ck("satin", CB.bill, 0, 9309, "#5A4636", "#2E2219"), ck("satin", CB.ring, 0, 9310, "#5A4636", "#2E2219"), ck("ebony", CB.eye, 0, 9311, "#140F0C", "#0A0706")], (x, u) => { x.fillStyle = night ? "#FFB257" : "#fff"; x.beginPath(); x.arc(-.157, -.242, .006, 0, TAU); x.fill(); });
    t.jaw = thing([ck("satin", CB.jaw, 0, 9312, "#5A4636", "#2E2219")]);
    // its shadow, in one piece, as it stands
    const sil = make(.8 * S.RR, .45 * S.RR, x => { x.scale(S.RR, S.RR); x.translate(.4, .32); x.fillStyle = "#000"; for (const pts of [CB.tail, CB.body, CB.breast, CB.head, CB.bill, CB.wing, CB.perch]) { trace(x, pts); x.fill(); } });
    sil.bx = [-.4, -.32, .4, .13]; t.birdSh = shadowOf(sil, 4, night ? "rgba(0,0,0,.8)" : "rgba(64,40,18,.55)"); t.birdSh.bx = [-.4 - 8 / S.RR, -.32 - 8 / S.RR, .4 + 8 / S.RR, .13 + 8 / S.RR];
    if (night) { t.birdGlow = shadowOf(sil, 7, "rgba(255,112,34,.95)"); t.birdGlow.bx = [-.4 - 14 / S.RR, -.32 - 14 / S.RR, .4 + 14 / S.RR, .13 + 14 / S.RR]; } // (by night, the ember in the house behind it, round its edges)
    return (S.ckt = t); };
  /** the bird at loop time T: how far out of its door (0 … 1), how it bows, opens its beak, lifts its wings and its tail */
  const ckBird = (T, pl) => {
    const out = seg(T, EC.out[0], EC.out[1], E.out) * (1 - seg(T, pl.back[0], pl.back[1], E.in)); if (T < EC.out[0] || T > pl.back[1]) return null;
    let bow = 0, beak = 0, wing = 0, tail = 0; const k = Math.floor((T - EC.call0) / pl.d);
    if (k >= 0 && k < pl.n) { const u = (T - EC.call0 - k * pl.d) / pl.d, e = (a, b, c, d) => env(u, a, b, c, d, E.sine); // "cuck" — "oo"
      bow = -.2 * e(0, .14, .3, .48) - .1 * e(.5, .6, .7, .9); beak = .55 * e(.04, .13, .24, .36) + .42 * e(.52, .6, .68, .8); wing = .85 * e(.02, .14, .3, .46) + .55 * e(.5, .6, .72, .88); tail = .45 * e(0, .14, .3, .5) + .3 * e(.5, .62, .72, .9); }
    else if (T > EC.out[0] && T < EC.call0) { const s = T - EC.out[0]; bow = .06 * Math.sin(s * 9) * Math.exp(-s * 3); } // (a little bob as it comes out)
    return { out, bow, beak, wing, tail };
  };
  /** the cuckoo's hands and marks at T: the angle each hand points (0 up), how high a mark or a hand is lifted, where a hand
   *  is on its way in or out */
  const ckHand = (T, pl, which) => {
    const sw = seg(T, EC.sweep[0], EC.sweep[1], E.io), set = seg(T, EC.set[0], EC.set[1], E.back), n = pl.n;
    const ang = which ? sw * TAU : ((n - 1) * set + sw) * Math.PI / 6; // the minute hand once round; the hour hand to the hour before, then on to the hour
    const qi = seg(T, EC.hands[0] + (which ? .12 : 0), EC.hands[1] + (which ? .12 : 0), x => x), qo = seg(T, pl.leave[0] + (which ? .1 : .2), pl.leave[0] + (which ? .85 : .95), x => x);
    return { ang, qi, qo };
  };
  /** a thing's flight to (or from) its place, on the side away from the words: where it is, how it turns, how lifted */
  const flight = (q, tx, ty, spin, back) => { const [dx, dy] = S.away, D = out(tx, ty, dx, dy) + S.R * .8 + 30, e = back ? E.in(q) : 1 - E.out(q), side = Math.sin(Math.PI * q) * D * .1 * spin;
    return { x: tx + dx * D * e - dy * side, y: ty + dy * D * e + dx * side, rot: spin * e * 2.2, z: back ? Math.min(1, q * 3) : 1 - seg(q, .7, 1, E.in) }; };
  /** a puff of sawdust (by night of ash, and a spark or two) out of a spot, `u` 0 … 1 as it goes */
  const puff = (x, y, rad, u, a, seed, n = 10) => { if (u <= 0 || u >= 1 || a <= .003) return; const r = rng(seed), k = S.R / S.RR;
    for (let i = 0; i < n; i++) { const an = r() * TAU, d = rad + (.03 + r() * .08) * S.R * E.out(u), s = (1 + r() * 1.5) * Math.max(1, k); g.globalAlpha = a * (1 - u) * .85; g.fillStyle = night ? (i % 4 === 0 ? "#FFB257" : "rgb(196,182,166)") : "#C9AD80"; g.fillRect(x + Math.cos(an) * d - s / 2, y + Math.sin(an) * d - u * (5 + r() * 7) * k - s / 2, s, s); }
    g.globalAlpha = 1; };
  /** when an E.io easing reached y */
  const invIo = y => { y = clamp(y); return y < .5 ? Math.cbrt(y / 4) : 1 - Math.cbrt(2 * (1 - y)) / 2; };
  /** the door's outline, on the page, as a path */
  const doorPath = (sx = 1, hx = -.115) => { const { cx, cy, R } = S; g.beginPath(); CKDOOR.forEach(([u, v], i) => { const x = cx + (hx + (u - hx) * sx) * R, y = cy + v * R; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  /** how far the door has swung open (0 shut … past a right angle), with a bounce as it shuts */
  const doorAt = (T, pl) => { if (T < EC.open[0] || T > pl.shut[1] + .3) return 0; const o = E.back(seg(T, EC.open[0], EC.open[1], x => x)) * 1.95; if (T < pl.shut[0]) return o;
    const s = seg(T, pl.shut[0], pl.shut[1], E.in), b = T > pl.shut[1] ? Math.exp(-(T - pl.shut[1]) * 14) * Math.sin((T - pl.shut[1]) * 40) * .12 : 0; return Math.max(0, 1.95 * (1 - s) + b); };
  /** the cuckoo's clock, by day or by night: the marks, the hands, the door's leaf, the bird; what lies on the picture */
  function ckClock(T, I, A, pl, pic, night2) {
    const { cx, cy, R } = S, V = S.vis * I, k = R / S.RR, t = ckThings();
    // the marks: tapped in one after another round the face, then lifted out and away
    for (let m = 1; m < 12; m++) { const ti = EC.marks[0] + (m - 1) * .085, qi = seg(T, ti, ti + .3, x => x); if (qi <= 0) continue;
      const to = pl.leave[0] + (m - 1) * .04, qo = seg(T, to, to + .62, x => x); if (qo >= 1) continue;
      const z = qo > 0 ? 0 : 1 - E.in(qi), f = qo > 0 ? flight(qo, cx, cy, pl.spin, true) : { x: cx, y: cy, rot: 0, z: 0 }, zz = Math.max(z, f.z);
      if (zz > .01) put2(t.marks[m], f.x + (3 + 9 * zz) * k, f.y + (4 + 12 * zz) * k, f.rot, 1 + .25 * zz, V * .35 * zz);
      put2(t.marks[m], f.x, f.y - zz * 6 * k, f.rot, 1 + .25 * zz, V * Math.min(1, qi * 4));
      if (!night2) { const [mx, my] = CKMARK(m).reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]); puff(cx + mx * R, cy + my * R, .03 * R, (T - ti - .3) / .4, V, 9400 + m, 6); } }
    // the door's leaf, swinging open on its hinge, the picture on its face, plain wood on its back
    const th = doorAt(T, pl);
    if (th > .001) { const c = Math.cos(th); g.save(); g.globalAlpha = V;
      if (c >= 0) { doorPath(c); g.clip(); g.translate(cx + -.115 * R, 0); g.scale(c, 1); g.translate(-(cx + -.115 * R), 0); g.drawImage(pic, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.setTransform(px, 0, 0, px, 0, 0); g.fillStyle = night2 ? "#000" : "#2E1B0B"; g.globalAlpha = V * (1 - c) * .45; g.fillRect(cx - R, cy - 1.1 * R, 2 * R, R); }
      else { doorPath(c); g.fillStyle = night2 ? "#2A211C" : "#D9C29C"; g.fill(); g.clip(); g.strokeStyle = night2 ? rgba(ASH, .25) : "rgba(150,112,70,.5)"; g.lineWidth = 1; for (let y = -1.02; y < -.67; y += .022) { g.beginPath(); g.moveTo(cx - .5 * R, cy + y * R); g.lineTo(cx, cy + (y + .004) * R); g.stroke(); } }
      g.restore(); g.save(); g.globalAlpha = V; doorPath(c); g.lineWidth = 1.3; g.strokeStyle = night2 ? "rgba(156,128,106,.5)" : "rgba(36,20,10,.75)"; g.stroke(); g.restore(); }
    // the door's knob, once the door is cut, riding on its leaf as it swings
    if (T > EC.cut[1] && T < pl.seal[0] + .3) { const c = Math.cos(th), kx = cx + (-.115 + (.075 + .115) * c) * R, ky = cy - .84 * R, kr = Math.max(1.2, .016 * R), ka = V * Math.min(1, (T - EC.cut[1]) * 4) * (1 - seg(T, pl.seal[0], pl.seal[0] + .3, x => x)) * (c > 0 ? 1 : 0);
      if (ka > .01) { g.save(); g.globalAlpha = ka; g.beginPath(); g.ellipse(kx, ky, kr * Math.max(.25, c), kr, 0, 0, TAU); g.fillStyle = night2 ? rgba(ASH, .9) : "#E9C77C"; g.fill(); g.lineWidth = 1; g.strokeStyle = night2 ? "rgba(0,0,0,.6)" : "rgba(60,36,10,.7)"; g.stroke(); g.restore(); } }
    // the hands, flown in and dropped on, set to the hour before, the minute hand once round; flown off again
    for (const which of [0, 1]) { const h = ckHand(T, pl, which); if (h.qi <= 0 || h.qo >= 1) continue; const f = h.qo > 0 ? flight(h.qo, cx, cy, pl.spin, true) : flight(h.qi, cx, cy, -pl.spin, false), z = f.z, spr = which ? t.hm : t.hh, rot = h.ang + f.rot;
      if (z > .01) put2(spr, f.x + (4 + 14 * z) * k, f.y + (6 + 18 * z) * k, rot, 1 + .08 * z, V * .4 * Math.min(1, z * 2));
      else put2(spr, f.x + 2.5 * k, f.y + 3.5 * k, rot, 1, V * .3); // (its shadow, lying on the face)
      put2(spr, f.x, f.y - z * 8 * k, rot, 1 + .08 * z, V);
      if (which && night2 && T > EC.sweep[0] - .3 && T < EC.sweep[1] + .6) { const hg = env(T, EC.sweep[0] - .3, EC.sweep[0] + .2, EC.sweep[1] - .1, EC.sweep[1] + .6, E.sine); if (hg > .01) { g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = V * hg * .55; const tip = [cx + Math.sin(rot) * .6 * R, cy - Math.cos(rot) * .6 * R], gr = .32 * R; g.drawImage(S.tipGlow, tip[0] - gr, tip[1] - gr, 2 * gr, 2 * gr); g.restore(); } } // (by night the hand burns as it goes: its tip glowing)
      if (!night2 && z <= 0 && h.qo <= 0) puff(cx, cy, .06 * R, (T - EC.hands[1] - (which ? .12 : 0)) / .45, V, 9500 + which, 8); }
    if (seg(T, EC.hands[0] + .12, EC.hands[1] + .12, x => x) >= 1 && seg(T, pl.leave[0] + .1, pl.leave[0] + .85, x => x) <= 0) put2(t.boss, cx, cy, 0, 1, V);
    // the bird: out of its door on its perch, calling the hour, and in again
    const b = ckBird(T, pl);
    if (b) { const sc = lerp(.7, 1.5, b.out), fx = cx + .04 * R, fy = cy + lerp(-.72, -.5, b.out) * R, z = b.out, a = V * lerp(.35, 1, Math.min(1, b.out * 1.6));
      g.save(); if (b.out < .8) { const rv = lerp(.12, .75, seg(b.out, .25, .8, E.in)), ry = lerp(.18, .6, seg(b.out, .25, .8, E.in)); g.beginPath(); g.ellipse(cx, cy - .84 * R, rv * R, ry * R, 0, 0, TAU); if (b.out < .25) { doorPath(); } g.clip(); } // (coming out of the doorway: only what the door shows, then more as it comes forward)
      if (night2) { g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = V * .5 * (1 - .4 * z); const gr = .36 * R; g.drawImage(S.halo, fx - gr, fy - .18 * R - gr, 2 * gr, 2 * gr); g.restore(); } // (by night the ember in the house lights it from behind)
      if (z > .3) put2(t.birdSh, fx + (5 + 12 * z) * k, fy + (7 + 14 * z) * k, b.bow, sc, a * .5 * z);
      if (night2 && t.birdGlow) { g.save(); g.globalCompositeOperation = "lighter"; put2(t.birdGlow, fx, fy - 2 * k, b.bow, sc * 1.02, a * (.42 + .1 * Math.sin(A * 2.3))); g.restore(); }
      const part = (spr, pv, ang) => { g.save(); g.globalAlpha = a; g.translate(fx, fy); g.scale(sc, sc); g.rotate(b.bow); if (pv) { g.translate(pv[0] * R, pv[1] * R); g.rotate(ang); g.translate(-pv[0] * R, -pv[1] * R); } g.drawImage(spr, spr.bx[0] * R, spr.bx[1] * R, (spr.bx[2] - spr.bx[0]) * R, (spr.bx[3] - spr.bx[1]) * R); g.restore(); };
      part(t.perch); part(t.tail, CB.pv.tail, -b.tail); part(t.body); part(t.jaw, CB.pv.jaw, -b.beak * .9); part(t.head, CB.pv.head, b.beak * .22); part(t.wing, CB.pv.wing, -b.wing);
      g.restore();
      if (night2 && b.out > .5) for (let c = 0; c < pl.n; c++) { const t0 = EC.call0 + c * pl.d + .05 * pl.d, u = (T - t0) / 1.1; if (u <= 0 || u >= 1) continue; // (by night each call a puff of smoke out of its beak, curling up and thinning)
        const bx = fx + (-.31 * sc) * R, by = fy + (-.215 * sc) * R; g.save(); g.lineCap = "round"; g.strokeStyle = "rgb(222,212,202)"; let p0 = null;
        for (let j = 0; j <= 18; j++) { const f = j / 18 * Math.min(1, u * 2.4), x = bx - f * .26 * R * sc + Math.sin(f * 6 + c * 1.7 - u * 2) * .045 * R * f, y = by - f * .36 * R * (.45 + u) * sc; if (p0) { g.globalAlpha = V * .55 * Math.pow(1 - u, 1.2) * (1 - f * .55); g.lineWidth = (2 + f * 11 * (.6 + u)) * S.ws; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(x, y); g.stroke(); } p0 = [x, y]; }
        g.restore(); } }
    // the door shut: a puff out of its joins
    if (!night2) puff(cx, cy - .85 * R, .12 * R, (T - pl.shut[1]) / .5, V, 9600, 12); else puff(cx, cy - .85 * R, .12 * R, (T - pl.shut[1]) / .5, V, 9601, 9);
    g.globalAlpha = 1;
  }
  /** the cut round the door, as it runs (a glint at its head; by night white-hot), and as it closes */
  function ckCut(T, I, pl, night2) {
    const { cx, cy, R } = S, V = S.vis * I, [c0, c1] = EC.cut; if (T < c0 || T > pl.seal[1]) return;
    const run = seg(T, c0, c1, lin), close = seg(T, pl.seal[0], pl.seal[1], lin), dark = 1 - E.io(clamp(close / .8));
    const n = CKDOOR.length, upto = run * (n - 1), path = () => { g.beginPath(); for (let i = 0; i <= Math.floor(upto); i++) { const [u, v] = CKDOOR[i]; i ? g.lineTo(cx + u * R, cy + v * R) : g.moveTo(cx + u * R, cy + v * R); } const i = Math.floor(upto), f = upto - i; if (i < n - 1) { const [u0, v0] = CKDOOR[i], [u1, v1] = CKDOOR[i + 1]; g.lineTo(cx + lerp(u0, u1, f) * R, cy + lerp(v0, v1, f) * R); } };
    g.save(); g.lineCap = "round"; g.lineJoin = "round"; path(); g.globalAlpha = V * dark; g.strokeStyle = night2 ? "rgba(6,4,3,.95)" : "rgba(36,20,10,.8)"; g.lineWidth = night2 ? 1.6 : 1.9; g.stroke();
    if (night2 && run < 1) { g.globalCompositeOperation = "lighter"; g.globalAlpha = V * .6; g.strokeStyle = "rgb(255,120,36)"; g.lineWidth = 3.5; g.stroke(); g.globalCompositeOperation = "source-over"; }
    if (run < 1) { const i = Math.min(n - 2, Math.floor(upto)), f = upto - i, [u0, v0] = CKDOOR[i], [u1, v1] = CKDOOR[i + 1], x = cx + lerp(u0, u1, f) * R, y = cy + lerp(v0, v1, f) * R; g.globalCompositeOperation = "lighter"; g.globalAlpha = V; if (!S.glint) S.glint = K.glowSpr(10, [255, 252, 240], 1); g.drawImage(night2 ? S.halo : S.glint, x - 9, y - 9, 18, 18); g.globalCompositeOperation = "source-over"; }
    if (night2 && close > 0) { const hk = env(close, 0, .22, .42, .95, E.sine); if (hk > .003) { g.globalCompositeOperation = "lighter"; path(); g.globalAlpha = V * hk * .6; g.strokeStyle = "rgb(255,120,36)"; g.lineWidth = 4; g.stroke(); g.globalAlpha = V * hk; g.strokeStyle = "#FFC46E"; g.lineWidth = 1.2; g.stroke(); g.globalCompositeOperation = "source-over"; } }
    g.restore(); g.globalAlpha = 1;
  }
  /** the cuckoo by day: the picture the pass began on, turning to the next behind the minute hand; the house behind the
   *  open door, raw wood in shadow; the clock over it */
  function cuckooDay(T, I, A, prev, cur, pl) {
    const { cx, cy, R } = S, V = S.vis, whole = (c, a = 1) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.globalAlpha = 1; };
    if (I <= .01 || T < EC.marks[0]) { whole(prev.oiled); return; }
    const sw = seg(T, EC.sweep[0], EC.sweep[1], E.io), a0 = -Math.PI / 2, a1 = a0 + sw * TAU;
    if (sw <= 0) whole(prev.oiled); else if (sw >= 1) whole(cur.oiled);
    else { whole(prev.oiled); g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 1.1 * R, a0, a1); g.closePath(); g.clip(); whole(cur.oiled);
      g.globalCompositeOperation = "soft-light"; for (let j = 0; j < 5; j++) { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R * .9, a1 - (j + 1) * .07, a1 - j * .07); g.closePath(); g.fillStyle = `rgba(255,248,228,${(.7 * (1 - j / 5)).toFixed(3)})`; g.fill(); } // (the new veneer catching the light just behind the hand)
      g.restore(); }
    const th = doorAt(T, pl); if (th > .001) { g.save(); g.globalAlpha = V; doorPath(); g.clip(); const q = g.createLinearGradient(cx, cy - 1.02 * R, cx, cy - .67 * R); q.addColorStop(0, "#1C110A"); q.addColorStop(1, "#4A3220"); g.fillStyle = q; g.fillRect(cx - .2 * R, cy - 1.1 * R, .4 * R, .5 * R); g.restore(); } // (the house behind the door)
    whole(prev.oiled, 1 - I); // (the list touched: back to the picture the pass began on)
    ckCut(T, I, pl, false); ckClock(T, I, A, pl, sw >= 1 ? cur.oiled : prev.oiled, false);
  }
  /** the cuckoo by night: the same, the picture burned again behind the minute hand — the old lines catching and
   *  crumbling to ash ahead of it, the new ones white-hot in its wake, cooling — the house glowing with an ember */
  function cuckooNight(T, I, A, prev, cur, pl) {
    const { cx, cy, R } = S, V = S.vis, pic = (c, a = 1) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.globalAlpha = 1; };
    if (I <= .01 || T < EC.marks[0]) { pic(prev.full); return; }
    const sw = seg(T, EC.sweep[0], EC.sweep[1], E.io), a0 = -Math.PI / 2, a1 = a0 + sw * TAU, X = cx - 1.05 * R, Y = cy - 1.05 * R, D = 2.1 * R;
    const sector = (b0, b1) => { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 1.1 * R, b0, b1); g.closePath(); };
    if (sw <= 0) pic(prev.full, I); else if (sw >= 1) pic(cur.full, I); // (by night the picture is lines only, which cover nothing: what the egg draws eases out with the list touched, as the picture it began on comes back)
    else { g.save(); sector(a1, a0 + TAU); g.clip(); pic(prev.full, I); g.restore(); g.save(); sector(a0, a1); g.clip(); pic(cur.full, I); g.restore(); }
    if (sw > 0 && T < EC.sweep[1] + 1.4) { // the heat: behind the hand the new lines white-hot and cooling; just ahead of it the old ones catching
      const cool = T > EC.sweep[1] ? seg(T, EC.sweep[1], EC.sweep[1] + 1.4, E.sine) : 0;
      g.save(); for (let j = 0; j < 7; j++) { const b1 = a1 - j * .16, b0 = Math.max(a0, b1 - .16); if (b1 <= a0) break; const hk = Math.pow(1 - j / 7, 1.6) * (1 - cool); if (hk < .02) continue;
        g.save(); sector(b0, b1); g.clip(); g.globalAlpha = V * I * hk; g.drawImage(cur.hotC, X, Y, D, D); g.globalCompositeOperation = "lighter"; g.globalAlpha = V * I * hk * .7; g.drawImage(cur.glowC, X, Y, D, D); g.restore(); }
      if (sw < 1) { g.save(); sector(a1, a1 + .22); g.clip(); g.globalAlpha = V * I * .5; g.drawImage(prev.hotC, X, Y, D, D); g.globalCompositeOperation = "lighter"; g.globalAlpha = V * I * .4; g.drawImage(prev.glowC, X, Y, D, D); g.restore(); }
      g.restore();
      // the old lines' ash, drifting up off where the hand has passed
      g.save(); for (const p of prev.ASHES) { let an = Math.atan2(p.y, p.x) - a0; while (an < 0) an += TAU; const tp = EC.sweep[0] + (EC.sweep[1] - EC.sweep[0]) * invIo(an / TAU), a = (T - tp) / .9; if (a < 0 || a >= 1) continue; // (when the hand passed it)
        const x = cx + (p.x + Math.sin(a * 5 + p.s * 9) * .03 * a) * R, y = cy + (p.y - a * (.08 + .14 * p.s) - a * a * .1) * R; g.globalAlpha = I * V * Math.pow(1 - a, 1.3) * (a < .2 ? 1 : .8); g.fillStyle = a < .2 ? "#FFB257" : rgba(ASH); const s = (1.7 - a * .9) * S.ws; g.fillRect(x - s / 2, y - s / 2, s, s); }
      g.restore(); }
    const th = doorAt(T, pl); if (th > .001) { g.save(); g.globalAlpha = V * I; doorPath(); g.clip(); g.fillStyle = "#070504"; g.fillRect(cx - .2 * R, cy - 1.1 * R, .4 * R, .5 * R); g.globalCompositeOperation = "lighter"; g.globalAlpha = V * I * (.4 + .12 * Math.sin(A * 1.3)) * Math.min(1, th); const gr = .3 * R; g.drawImage(S.halo, cx - gr, cy - .8 * R - gr, 2 * gr, 2 * gr); g.restore(); } // (the house: the char gone deep, an ember in it)
    pic(prev.full, 1 - I);
    ckCut(T, I, pl, true); ckClock(T, I, A, pl, plateOf(sw >= 1 ? cur : prev), true);
    // the marks, by night, burned in white-hot and cooling as they go in, and flaring as they go
    if (I > .01) { g.save(); g.globalCompositeOperation = "lighter"; for (let m = 1; m < 12; m++) { const ti = EC.marks[0] + (m - 1) * .085, hk = env(T, ti + .2, ti + .3, ti + .35, ti + 1.3, E.sine) + env(T, pl.leave[0] + (m - 1) * .04 - .25, pl.leave[0] + (m - 1) * .04, pl.leave[0] + (m - 1) * .04 + .05, pl.leave[0] + (m - 1) * .04 + .35, E.sine); if (hk < .01) continue;
      const [mx, my] = CKMARK(m).reduce((s, p) => [s[0] + p[0] / 4, s[1] + p[1] / 4], [0, 0]), gr = .07 * R; g.globalAlpha = V * I * hk * .8; g.drawImage(S.halo, cx + mx * R - gr, cy + my * R - gr, 2 * gr, 2 * gr); } g.restore(); }
  }

  /** an hour egg's span: when it begins, when the next picture is all in, and when its seal runs (by day a sheen runs
   *  over it; by night the picture breathes again after it) */
  const hourWin = (P, lg) => { if (lg === 1) { const pl = ckPlan(P); return [EC.marks[0], EC.sweep[1], pl.seal[0], pl.seal[1]]; } return [EK.cut[0], EK.shut, EK.seal[0], EK.seal[1]]; };
  // The second: the clockwork. The medallion opens like the iris of a lens: cuts run out from its middle along eight
  // curved seams, and its blades turn back on their pivots under the banding, each carrying its piece of the picture;
  // behind it a clock is going — a movement cut from the same woods, its great wheel and second wheel turning, the escape
  // wheel stepping a tooth at each swing of a long pendulum whose anchor rocks over it (by night the works charred, an
  // ember glowing down in them, a spark at every tick). Then the blades come back, and the picture on them is the next.
  const EK = { cut: [.55, 1.75], open: [1.95, 3.75], strike: 5.6, close: [10.75, 12.55], shut: 12.55, seal: [12.65, 13.75] };
  const NB = 8, IR0 = .2; // the blades, and how the iris is turned
  /** the iris open by o: the aperture an octagon whose corners run out from the middle on arcs about the blades' pivots
   *  (just past the banding, under the plank), turning a little as it opens; each blade the part of the face beyond one
   *  side of it, between that side and the one before, each produced to the banding; each blade's picture turned about its
   *  pivot as far as takes its corner from the middle to where it is now (`s`) */
  const irisGeo = o => { const rho = o, be = Math.acos(clamp(rho / 2.4)), V = [], Q = [], sp = [];
    for (let j = 0; j < NB; j++) { const ph = j * TAU / NB + IR0; Q.push([Math.cos(ph) * 1.2, Math.sin(ph) * 1.2]); V.push([Math.cos(ph - be) * rho, Math.sin(ph - be) * rho]); }
    for (let j = 0; j < NB; j++) sp.push(Math.atan2(V[j][1] - Q[j][1], V[j][0] - Q[j][0]) - Math.atan2(-Q[j][1], -Q[j][0]));
    const dir = j => { const a = V[j], b = V[(j + 1) % NB], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); if (l < 1e-6) { const an = j * TAU / NB + IR0 + Math.PI / NB; return [Math.cos(an), Math.sin(an)]; } return [dx / l, dy / l]; };
    const D = Array.from({ length: NB }, (_, j) => dir(j));
    const poly2 = j => { const v0 = V[j], v1 = V[(j + 1) % NB], d1 = D[j], d0 = D[(j + NB - 1) % NB]; return [v0, v1, [v1[0] + d1[0] * 3, v1[1] + d1[1] * 3], [v0[0] + d0[0] * 3, v0[1] + d0[1] * 3]]; };
    return { rho, V, Q, sp, D, poly2 }; };
  /** how far the iris is open (0 shut … 1 all the way, its blades under the banding) */
  const irisAt = T => T < EK.open[0] || T > EK.close[1] ? 0 : T < EK.open[1] ? E.io(seg(T, EK.open[0], EK.open[1], x => x)) : T < EK.close[0] ? 1 : 1 - E.io(seg(T, EK.close[0], EK.close[1], x => x));
  // the movement, in the medallion's units: wheels (teeth, pitch radius, middle), the pinions on their arbors, the escape
  // wheel, the anchor and pendulum on one pivot
  const MV = { g1: { n: 40, r: .4, at: [-.2, .22], wood: "cherry", sp: 6 }, p2: { n: 10, r: .1, wood: "walnut" }, g2: { n: 30, r: .3, wood: "maple", sp: 5 }, p3: { n: 8, r: .08, wood: "walnut" }, esc: { n: 15, r: .22, wood: "holly", sp: 4 }, piv: [.02, -.72], len: 1.3 };
  MV.g2.at = [MV.g1.at[0] + (MV.g1.r + MV.p2.r) * Math.cos(-.61), MV.g1.at[1] + (MV.g1.r + MV.p2.r) * Math.sin(-.61)];
  MV.esc.at = [MV.g2.at[0] + (MV.g2.r + MV.p3.r) * Math.cos(-2.09), MV.g2.at[1] + (MV.g2.r + MV.p3.r) * Math.sin(-2.09)];
  MV.piv = [MV.esc.at[0], MV.esc.at[1] - MV.esc.r - .09];
  MV.bell = { at: [-.47, -.43], r: .145 }; MV.hammer = { at: [-.76, -.12] }; MV.hammer.len = Math.hypot(MV.bell.at[0] - MV.hammer.at[0], MV.bell.at[1] - MV.hammer.at[1]) - MV.bell.r - .042; MV.hammer.rest = Math.atan2(MV.bell.at[1] - MV.hammer.at[1], MV.bell.at[0] - MV.hammer.at[0]);
  /** the strike: the hours the list has been up (round again after twelve), struck on the bell from EK.strike on; how far
   *  the hammer is lifted at T (0 on the bell), and how long since each stroke landed */
  const strikeOf = P => { if (S.stk && S.stk.P === P) return S.stk; const h = Math.max(1, Math.floor(P / 240)), n = (h - 1) % 12 + 1, d = Math.min(.62, 4.0 / n); return (S.stk = { P, n, d, t0: EK.strike }); };
  const hammerAt = (T, st) => { const k = Math.floor((T - st.t0) / st.d); if (k < 0 || k >= st.n) return 0; const u = (T - st.t0 - k * st.d) / st.d; return u < .7 ? .42 * E.io(clamp(u / .7)) : .42 * (1 - E.in(clamp((u - .7) / .3))); }; // (lifted, and let fall: each stroke lands as the period ends)
  /** a wheel's outline: its teeth round it (rounded, or for the escape wheel hooked) and the windows between its spokes */
  const wheelPath = (x, w, esc) => { const { n, r } = w, m = 2 * r / n, ra = r + m * (esc ? 1.5 : .95), rd = r - m * 1.15; x.beginPath();
    for (let k = 0; k < n; k++) { const a = k / n * TAU, p = TAU / n;
      if (esc) { x.lineTo(Math.cos(a) * rd, Math.sin(a) * rd); x.lineTo(Math.cos(a + p * .12) * ra, Math.sin(a + p * .12) * ra); x.lineTo(Math.cos(a + p * .32) * (rd + m * .4), Math.sin(a + p * .32) * (rd + m * .4)); x.lineTo(Math.cos(a + p * .9) * rd, Math.sin(a + p * .9) * rd); continue; }
      for (const [f, rr] of [[0, rd], [.12, rd], [.22, r + m * .45], [.3, ra], [.42, ra], [.5, r + m * .45], [.6, rd]]) x.lineTo(Math.cos(a + f * p) * rr, Math.sin(a + f * p) * rr); }
    x.closePath();
    if (w.sp) { const ri = r * (esc ? .34 : .3), ro = rd - r * (esc ? .14 : .12), half = (TAU / w.sp - (esc ? .5 : .32) / (r * 3)) / 2; for (let k = 0; k < w.sp; k++) { const a = (k + .5) / w.sp * TAU; x.moveTo(Math.cos(a - half) * ro, Math.sin(a - half) * ro); x.arc(0, 0, ro, a - half, a + half); x.arc(0, 0, ri, a + half * ri / ro * .7, a - half * ri / ro * .7, true); x.closePath(); } } };
  /** the movement's things for this size: each wheel and pinion, the anchor and its pendulum, the back plate; by day cut
   *  from veneers, by night char with its lines burned in */
  const mvThings = () => {
    if (S.mvt && S.mvt.RR === S.RR) return S.mvt; const R = S.RR, u = 1 / R, t = { RR: R };
    const wheel = (w, seed, esc) => { const ext = w.r + 2 * w.r / w.n * 1.6 + .02, c = make(2 * ext * R, 2 * ext * R, x => { x.scale(R, R); x.translate(ext, ext); wheelPath(x, w, esc);
        if (!night) { x.save(); x.clip("evenodd"); woodInto(x, { wood: w.wood, grain: seed % 3, c: [0, 0], L: ext, seed }, true, u); x.restore(); wheelPath(x, w, esc); x.lineWidth = 1.4 * u; x.strokeStyle = "rgba(36,20,10,.72)"; x.stroke(); }
        else { x.fillStyle = "#2E241E"; x.fill("evenodd"); x.lineWidth = 1.2 * u * S.ws; x.strokeStyle = rgba(ASH, .85); x.stroke(); }
        // the hub, its arbor's pin
        x.beginPath(); x.arc(0, 0, w.r * (w.n > 12 ? .22 : .5), 0, TAU); x.fillStyle = night ? "#251C17" : rgba(hex(WOOD.walnut.oil[0])); x.fill(); x.lineWidth = 1.2 * u; x.strokeStyle = night ? rgba(ASH, .8) : "rgba(36,20,10,.7)"; x.stroke();
        x.beginPath(); x.arc(0, 0, Math.max(.012, w.r * .07), 0, TAU); x.fillStyle = night ? rgba(ASH, .9) : "#E9C77C"; x.fill(); });
      c.ext = ext; c.sh = shadowOf(c, 4, night ? "rgba(0,0,0,.9)" : "rgba(30,16,6,.7)"); return c; };
    t.g1 = wheel(MV.g1, 7101); t.p2 = wheel(MV.p2, 7102); t.g2 = wheel(MV.g2, 7103); t.p3 = wheel(MV.p3, 7104); t.esc = wheel(MV.esc, 7105, true);
    // the anchor and its pendulum, hung from one pivot, drawn hanging straight down: the arms over the escape wheel, the
    // pallets at their ends, the rod, the bob
    const L = MV.len, pa = .7, ar = MV.esc.r + .09, arm = a => [Math.sin(a) * (MV.esc.r + .02) * 1.0, MV.esc.at[1] - MV.piv[1] - Math.cos(a) * MV.esc.r * .98];
    const [lx, ly] = arm(-pa), [rx2, ry] = arm(pa), ext = L + .14;
    t.pend = make(.6 * R, (ext + .1) * R, x => { x.scale(R, R); x.translate(.3, .05);
      const anchor = [[0, -.03], [rx2 * .6, ry * .2], [rx2 + .025, ry - .01], [rx2 - .005, ry + .035], [rx2 * .55, ry * .45], [0, .04], [lx * .55, ly * .45], [lx + .005, ly + .035], [lx - .025, ly - .01], [lx * .6, ly * .2]];
      const rod = [[-.011, 0], [.011, 0], [.011, L - .1], [-.011, L - .1]], bob = ellPts(0, L, .115, .115, 0, 40), ring = ellPts(0, L, .08, .08, 0, 32);
      if (!night) { pieceInto(x, vpiece("ebony", rod, Math.PI / 2, 7201), true, u); pieceInto(x, vpiece("walnut", anchor, 0, 7202), true, u); pieceInto(x, vpiece("padauk", bob, .4, 7203), true, u); pieceInto(x, vpiece("satin", ring, 0, 7204), true, u); }
      else for (const [pts, a2] of [[rod, .8], [anchor, .9], [bob, .95], [ring, .7]]) { trace(x, pts); x.fillStyle = "#2B221C"; x.fill(); x.lineWidth = 1.2 * u * S.ws; x.strokeStyle = rgba(ASH, a2); x.stroke(); }
      x.beginPath(); x.arc(0, 0, .03, 0, TAU); x.fillStyle = night ? rgba(ASH, .9) : "#E9C77C"; x.fill(); x.lineWidth = u; x.strokeStyle = "rgba(36,20,10,.6)"; x.stroke(); });
    t.pend.bx = [-.3, -.05, .3, ext + .05]; t.pendSh = shadowOf(t.pend, 4, night ? "rgba(0,0,0,.9)" : "rgba(30,16,6,.7)");
    // the bell it strikes the hour on (seen from above: its rings), and the hammer, on its arm, drawn lying to the right
    const br = MV.bell.r; t.bell = make(2.3 * br * R, 2.3 * br * R, x => { x.scale(R, R); x.translate(1.15 * br, 1.15 * br);
      if (!night) { const q = x.createRadialGradient(-br * .35, -br * .4, br * .05, 0, 0, br); q.addColorStop(0, "#FFF0C2"); q.addColorStop(.45, "#E2B563"); q.addColorStop(.85, "#A8701E"); q.addColorStop(1, "#6E4510"); x.fillStyle = q; x.beginPath(); x.arc(0, 0, br, 0, TAU); x.fill();
        x.strokeStyle = "rgba(90,52,10,.55)"; x.lineWidth = 1.2 * u; for (const k of [.78, .52, .22]) { x.beginPath(); x.arc(0, 0, br * k, 0, TAU); x.stroke(); } x.strokeStyle = "rgba(255,246,214,.7)"; x.beginPath(); x.arc(0, 0, br * .64, 3.6, 4.6); x.stroke(); }
      else { x.fillStyle = "#2E241E"; x.beginPath(); x.arc(0, 0, br, 0, TAU); x.fill(); x.strokeStyle = rgba(ASH, .85); x.lineWidth = 1.2 * u * S.ws; for (const k of [1, .78, .52, .22]) { x.beginPath(); x.arc(0, 0, br * k * .99, 0, TAU); x.stroke(); } }
      x.beginPath(); x.arc(0, 0, .016, 0, TAU); x.fillStyle = night ? rgba(ASH, .9) : "#6E4510"; x.fill(); });
    t.bellSh = shadowOf(t.bell, 4, night ? "rgba(0,0,0,.9)" : "rgba(30,16,6,.7)");
    const hl = MV.hammer.len; t.hammer = make((hl + .14) * R, .2 * R, x => { x.scale(R, R); x.translate(.05, .1); const arm = [[0, -.016], [hl - .04, -.012], [hl - .04, .012], [0, .016]], head = [[hl - .06, -.07], [hl + .04, -.07], [hl + .04, .07], [hl - .06, .07]];
      if (!night) { pieceInto(x, vpiece("ebony", arm, 0, 7401), true, u); pieceInto(x, vpiece("walnut", head, Math.PI / 2, 7402), true, u); }
      else for (const pts of [arm, head]) { trace(x, pts); x.fillStyle = "#2B221C"; x.fill(); x.lineWidth = 1.2 * u * S.ws; x.strokeStyle = rgba(ASH, .85); x.stroke(); }
      x.beginPath(); x.arc(0, 0, .024, 0, TAU); x.fillStyle = night ? rgba(ASH, .9) : "#E9C77C"; x.fill(); });
    t.hammer.bx = [-.05, -.1, hl + .09, .1]; t.hammerSh = shadowOf(t.hammer, 3, night ? "rgba(0,0,0,.9)" : "rgba(30,16,6,.7)");
    // the back plate the works are set in: dark wood by day, deep char by night
    t.plate = make(2.1 * R, 2.1 * R, x => { x.scale(R, R); x.translate(1.05, 1.05); x.beginPath(); x.arc(0, 0, RI, 0, TAU); x.clip();
      if (!night) { woodInto(x, { wood: "walnut", grain: .15, c: [0, 0], L: 1, seed: 7301 }, true, u); const q = x.createRadialGradient(0, 0, RI * .55, 0, 0, RI); q.addColorStop(0, "rgba(20,10,4,.1)"); q.addColorStop(1, "rgba(20,10,4,.72)"); x.fillStyle = q; x.fillRect(-1, -1, 2, 2); }
      else { x.fillStyle = "#0C0806"; x.fillRect(-1, -1, 2, 2); const q = x.createRadialGradient(.05, .45, 0, .05, .45, RI * 1.1); q.addColorStop(0, "rgba(255,96,24,.32)"); q.addColorStop(.5, "rgba(140,40,10,.12)"); q.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = q; x.fillRect(-1, -1, 2, 2); } });
    return (S.mvt = t); };
  /** the movement at T: the pendulum's swing, the escape wheel stepping half a tooth at each end of it, the train turning
   *  with it (each wheel the other way to the one it is geared to, slower by their teeth), and when a tick lands */
  const mvAt = T => { const Tp = 1.6, sw = .16 * Math.sin(TAU * T / Tp), s = (T - Tp / 4) / (Tp / 2), k = Math.floor(s), f = s - k, step = clamp(f / .14), rec = f > .14 ? -.12 * Math.exp(-(f - .14) * 18) * Math.sin((f - .14) * 40) : 0;
    const ae = (Math.PI / MV.esc.n) * (k + E.out(step) + rec), a2 = -ae * MV.p3.n / MV.g2.n, a1 = -a2 * MV.p2.n / MV.g1.n; return { sw, ae, a2, a1, tick: f }; };
  /** the movement, at the page's (cx, cy, R): the plate, then each wheel (its shadow under it), the pendulum over them */
  function movement(T, A, V, night2) {
    const { cx, cy, R } = S, t = mvThings(), m = mvAt(T), k = R / S.RR;
    g.save(); g.beginPath(); g.arc(cx, cy, RI * R, 0, TAU); g.clip(); g.globalAlpha = V; g.drawImage(t.plate, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R);
    const wh = (c, at, ang) => { const e = c.ext, x = cx + at[0] * R, y = cy + at[1] * R; g.save(); g.globalAlpha = V * .75; g.translate(x + 3 * k, y + 4 * k); g.rotate(ang); g.drawImage(c.sh, -e * R - 8 * k, -e * R - 8 * k, 2 * e * R + 16 * k, 2 * e * R + 16 * k); g.restore();
      g.save(); g.globalAlpha = V; g.translate(x, y); g.rotate(ang); g.drawImage(c, -e * R, -e * R, 2 * e * R, 2 * e * R); g.restore(); };
    wh(t.g1, MV.g1.at, m.a1); wh(t.g2, MV.g2.at, m.a2); wh(t.p2, MV.g2.at, m.a2 + .2); wh(t.esc, MV.esc.at, m.ae); wh(t.p3, MV.esc.at, m.ae + .1);
    if (night2) { // an ember down in the works, breathing, and a spark where the pallet lets a tooth go
      g.globalCompositeOperation = "lighter"; g.globalAlpha = V * (.22 + .08 * Math.sin(A * 1.1)); const gr = .7 * R; g.drawImage(S.halo, cx + .05 * R - gr, cy + .5 * R - gr, 2 * gr, 2 * gr);
      if (m.tick < .25) { const side = Math.floor((T - .4) / .8) % 2 ? 1 : -1, px2 = cx + (MV.esc.at[0] + side * MV.esc.r * .62) * R, py2 = cy + (MV.esc.at[1] - MV.esc.r * .8) * R, q = m.tick / .25; g.globalAlpha = V * (1 - q) * .8; g.drawImage(S.halo, px2 - 7, py2 - 7, 14, 14); g.fillStyle = "#FFD58A"; for (let i = 0; i < 3; i++) { const a = -1.2 - i * .5 + side * .4; g.fillRect(px2 + Math.cos(a) * q * 10 * k, py2 + Math.sin(a) * q * 10 * k + q * q * 6 * k, 1.4, 1.4); } }
      g.globalCompositeOperation = "source-over"; }
    // the bell, shivering as each stroke lands, the rings of it running out over the works; the hammer, lifted and let fall
    const st = strikeOf(S.pp.P), bx2 = cx + MV.bell.at[0] * R, by2 = cy + MV.bell.at[1] * R, br = MV.bell.r, e2 = br * 1.15;
    let shiv = 0; for (let j = 0; j < st.n; j++) { const a = T - (st.t0 + (j + 1) * st.d); if (a < 0) break; if (a < 1.2) { shiv += Math.exp(-a * 7) * Math.sin(a * 60) * .04;
      const rr = br + a * .55, ra = Math.pow(1 - a / 1.2, 1.5); g.save(); g.globalAlpha = V * ra * (night2 ? .8 : .55); if (night2) g.globalCompositeOperation = "lighter"; g.strokeStyle = night2 ? "rgb(255,140,50)" : "rgba(255,240,200,.95)"; g.lineWidth = (night2 ? 2.4 : 2.2) * (1 - a / 1.6); g.beginPath(); g.arc(bx2, by2, rr * R, 0, TAU); g.stroke(); if (!night2) { g.strokeStyle = "rgba(90,52,10,.4)"; g.lineWidth = .8; g.beginPath(); g.arc(bx2, by2, rr * R + 1.6, 0, TAU); g.stroke(); } g.restore(); } } // (silent: its sound drawn as rings)
    g.save(); g.globalAlpha = V * .7; g.drawImage(t.bellSh, bx2 - e2 * R + 3 * k - 8 * k, by2 - e2 * R + 4 * k - 8 * k, 2 * e2 * R + 16 * k, 2 * e2 * R + 16 * k); g.restore();
    g.save(); g.globalAlpha = V; g.translate(bx2, by2); g.scale(1 + shiv, 1 - shiv); g.drawImage(t.bell, -e2 * R, -e2 * R, 2 * e2 * R, 2 * e2 * R); g.restore();
    if (night2) { const hot = st.n ? Math.max(0, ...Array.from({ length: st.n }, (_, j) => { const a = T - (st.t0 + (j + 1) * st.d); return a < 0 ? 0 : Math.exp(-a * 3); })) : 0; if (hot > .01) { g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = V * hot * .55; const gr = br * 1.6 * R; g.drawImage(S.halo, bx2 - gr, by2 - gr, 2 * gr, 2 * gr); g.restore(); } } // (by night the bell glows as it's struck)
    const hx = cx + MV.hammer.at[0] * R, hy = cy + MV.hammer.at[1] * R, ha = MV.hammer.rest + hammerAt(T, st), hb = t.hammer.bx;
    g.save(); g.globalAlpha = V * .7; g.translate(hx + 3 * k, hy + 4 * k); g.rotate(ha); g.drawImage(t.hammerSh, hb[0] * R - 6 * k, hb[1] * R - 6 * k, (hb[2] - hb[0]) * R + 12 * k, (hb[3] - hb[1]) * R + 12 * k); g.restore();
    g.save(); g.globalAlpha = V; g.translate(hx, hy); g.rotate(ha); g.drawImage(t.hammer, hb[0] * R, hb[1] * R, (hb[2] - hb[0]) * R, (hb[3] - hb[1]) * R); g.restore();
    const pv = [cx + MV.piv[0] * R, cy + MV.piv[1] * R], pb = t.pend.bx;
    g.save(); g.globalAlpha = V * .7; g.translate(pv[0] + 4 * k, pv[1] + 6 * k); g.rotate(m.sw); g.drawImage(t.pendSh, pb[0] * R - 8 * k, pb[1] * R - 8 * k, (pb[2] - pb[0]) * R + 16 * k, (pb[3] - pb[1]) * R + 16 * k); g.restore();
    g.save(); g.globalAlpha = V; g.translate(pv[0], pv[1]); g.rotate(m.sw); g.drawImage(t.pend, pb[0] * R, pb[1] * R, (pb[2] - pb[0]) * R, (pb[3] - pb[1]) * R); g.restore();
    if (night2) { g.globalCompositeOperation = "lighter"; const bx = pv[0] + Math.sin(-m.sw) * MV.len * R, by = pv[1] + Math.cos(m.sw) * MV.len * R, gr = .2 * R; g.globalAlpha = V * .3; g.drawImage(S.halo, bx - gr, by - gr, 2 * gr, 2 * gr); g.globalCompositeOperation = "source-over"; } // (the bob catching the ember's light)
    // the shadow the banding casts in over the works
    const q = g.createRadialGradient(cx, cy, RI * R * .8, cx, cy, RI * R); q.addColorStop(0, "rgba(0,0,0,0)"); q.addColorStop(1, night2 ? "rgba(0,0,0,.7)" : "rgba(30,16,6,.5)"); g.fillStyle = q; g.globalAlpha = V; g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    g.restore(); }
  /** the blades, open by `o`: each its piece of `pic`, turned on its pivot, clipped to its part of the face; their edges
   *  where they meet, the aperture's edge catching the light and throwing a shadow in on the works */
  function blades(o, pic, V0, night2) {
    const { cx, cy, R } = S, G = irisGeo(o), path = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(cx + x * R, cy + y * R) : g.moveTo(cx + x * R, cy + y * R)); g.closePath(); };
    g.save(); g.beginPath(); g.arc(cx, cy, RI * R * .998, 0, TAU); g.clip();
    if (o > .002) { g.save(); path(G.V); g.lineWidth = 9; g.strokeStyle = night2 ? "rgba(0,0,0,.55)" : "rgba(30,16,6,.3)"; g.globalAlpha = V0; g.translate(1.5, 2.5); g.stroke(); g.lineWidth = 3.5; g.stroke(); g.restore(); } // (their shadow in on the works)
    for (let j = 0; j < NB; j++) { const q = G.Q[j]; g.save(); path(G.poly2(j)); g.clip(); g.globalAlpha = V0;
      g.translate(cx + q[0] * R, cy + q[1] * R); g.rotate(G.sp[j]); g.translate(-(cx + q[0] * R), -(cy + q[1] * R)); g.drawImage(pic, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.restore(); }
    if (o > .002) { const k = Math.min(1, o * 10); g.lineCap = "round";
      for (let j = 0; j < NB; j++) { const v1 = G.V[(j + 1) % NB], d = G.D[j], e = [v1[0] + d[0] * 1.2, v1[1] + d[1] * 1.2]; // where blade meets blade: a dark joint, lit on one side
        g.beginPath(); g.moveTo(cx + v1[0] * R, cy + v1[1] * R); g.lineTo(cx + e[0] * R, cy + e[1] * R); g.globalAlpha = V0 * k; g.lineWidth = 1.6; g.strokeStyle = night2 ? "rgba(4,3,2,.9)" : "rgba(36,20,10,.75)"; g.stroke(); g.save(); g.translate(.8, .8); g.lineWidth = .9; g.strokeStyle = night2 ? "rgba(156,128,106,.3)" : "rgba(255,248,230,.45)"; g.stroke(); g.restore(); }
      path(G.V); g.globalAlpha = V0 * k; g.lineWidth = 1.8; g.strokeStyle = night2 ? "rgba(4,3,2,.9)" : "rgba(36,20,10,.8)"; g.stroke(); g.lineWidth = .9; g.strokeStyle = night2 ? "rgba(176,150,128,.55)" : "rgba(255,246,226,.75)"; g.save(); g.translate(-.7, -.7); g.stroke(); g.restore(); }
    g.restore(); }
  /** the seams as they are cut (a glint at each one's head, by night white-hot) and as they close */
  function irisCuts(T, I, night2) {
    const { cx, cy, R } = S, V = S.vis * I, [c0, c1] = EK.cut, [s0, s1] = EK.seal; if (T < c0 || (T > c1 && T < EK.close[1] - .01) || T > s1) return;
    const run = T < c1, close = run ? 0 : seg(T, s0, s1, lin), dark = run ? 1 : 1 - E.io(clamp(close / .8)); if (!S.glint) S.glint = K.glowSpr(10, [255, 252, 240], 1);
    g.save(); g.lineCap = "round"; g.lineJoin = "round";
    for (let j = 0; j < NB; j++) { const t0 = c0 + j * .07, p = run ? seg(T, t0, t0 + .8, E.io) : 1; if (p <= 0) continue; const an = j * TAU / NB + IR0 + Math.PI / NB, pts = Array.from({ length: 25 }, (_, i) => [Math.cos(an) * i / 24 * RI, Math.sin(an) * i / 24 * RI]), n = Math.max(1, Math.round(p * (pts.length - 1)));
      g.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = pts[i]; i ? g.lineTo(cx + x * R, cy + y * R) : g.moveTo(cx + x * R, cy + y * R); }
      g.globalAlpha = V * dark; g.strokeStyle = night2 ? "rgba(6,4,3,.95)" : "rgba(36,20,10,.8)"; g.lineWidth = night2 ? 1.6 : 1.9; g.stroke();
      if (night2 && run && p < 1) { g.globalCompositeOperation = "lighter"; g.globalAlpha = V * .6; g.strokeStyle = "rgb(255,120,36)"; g.lineWidth = 3.5; g.stroke(); g.globalCompositeOperation = "source-over"; }
      if (night2 && !run) { const hk = env(close, 0, .22, .42, .95, E.sine); if (hk > .003) { g.globalCompositeOperation = "lighter"; g.globalAlpha = V * hk * .6; g.strokeStyle = "rgb(255,120,36)"; g.lineWidth = 4; g.stroke(); g.globalAlpha = V * hk; g.strokeStyle = "#FFC46E"; g.lineWidth = 1.2; g.stroke(); g.globalCompositeOperation = "source-over"; } }
      if (run && p < 1) { const [x, y] = pts[n]; g.globalCompositeOperation = "lighter"; g.globalAlpha = V; g.drawImage(night2 ? S.halo : S.glint, cx + x * R - 9, cy + y * R - 9, 18, 18); g.globalCompositeOperation = "source-over"; } }
    g.restore(); g.globalAlpha = 1; }
  /** the clockwork by day: the picture the pass began on, opening on the works, closing on the next */
  function clockDay(T, I, A, prev, cur) {
    const { cx, cy, R } = S, V = S.vis, whole = (c, a = 1) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.globalAlpha = 1; };
    if (I <= .01 || T < EK.cut[0]) { whole(prev.oiled); return; }
    const o = irisAt(T), pic = T < EK.open[1] + .5 ? prev.oiled : cur.oiled;
    if (o <= .001) whole(T < EK.open[1] ? prev.oiled : cur.oiled); // (shut: the one it began on until it has opened, the next once it has closed)
    else { movement(T, A, V, false); blades(o, pic, V, false); g.save(); g.beginPath(); g.arc(cx, cy, 1.06 * R, 0, TAU); g.arc(cx, cy, RI * R * .998, 0, TAU, true); g.clip("evenodd"); whole(pic); g.restore(); } // (the banding over the blades' roots)
    whole(prev.oiled, 1 - I);
    irisCuts(T, I, false);
  }
  /** the clockwork by night: the same in the char, the works charred and lit from below by an ember */
  function clockNight(T, I, A, prev, cur) {
    const { cx, cy, R } = S, V = S.vis, pic = (c, a = 1) => { if (a <= .003) return; g.globalAlpha = a * V; g.drawImage(c, cx - 1.05 * R, cy - 1.05 * R, 2.1 * R, 2.1 * R); g.globalAlpha = 1; };
    if (I <= .01 || T < EK.cut[0]) { pic(prev.full); return; }
    const o = irisAt(T), d = T < EK.open[1] + .5 ? prev : cur;
    if (o <= .001) pic(T < EK.open[1] ? prev.full : cur.full, I); // (eased out with the list touched, as the cuckoo's is)
    else { movement(T, A, V * I, true); blades(o, plateOf(d), V * I, true); g.save(); g.beginPath(); g.arc(cx, cy, 1.06 * R, 0, TAU); g.arc(cx, cy, RI * R * .998, 0, TAU, true); g.clip("evenodd"); pic(d.full, I); g.restore(); }
    pic(prev.full, 1 - I);
    irisCuts(T, I, true);
  }

  const S = {
    res: "dpr", carry: true, // (the picture a pass lays, or burns, stays up through the quiet after it)
    wash: night ? 1 : 1.6, veil: night ? .6 : 1, // a light kit's small words have no room for the picture under them (scenes.js); a dark kit's do
    hug: night ? .72 : .8, hugFinale: true, list: night ? .4 : .3, // the lines and the finale's words sit on pads of the ground; the medallion keeps to the open page
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05;
      Object.assign(S, { W, H, pr, Rmin: pr ? 54 : 70, Rmax: pr ? 150 : 240 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .3, 118) : Math.min(W * .14, H * .27); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .77 : H * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: pr ? H * .77 : H * .5, tR: R0, away: pr ? [0, 1] : [1, 0] }); }
      S.RR = 0; S.landed = K.layer(); S.bgc = bg.canvas; S.plates = null; // the sprites are drawn again for this size, on the next frame (the egg's night tiles carry the char from the backdrop)
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
    draw(T, I, A, F, P = 0) { if (night) drawNight(T, I, A, F, P); else drawDay(T, I, A, F, P); },
  };
  return S;
}
