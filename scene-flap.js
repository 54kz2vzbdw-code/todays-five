// scene-flap.js — 1.12 b356: Teletype's scene (scenes.js loads it). The whole page is a wall of split flaps, the kind a
// railway station hangs over its platforms, each one a tone barely off the page's own cream. Every flap really flips:
// its top half falls over the hinge, shading as it turns, and the next face's bottom half comes down over the last; a
// flap passes through every tone between where it is and where it's going, in order, the way a real one does, so a
// change runs across the wall as a clattering ripple. The flaps under the words always rest page-plain (scenes.js,
// `words`), so the pictures flow round the list, and a line that moves has the flaps under it flip clear. The loop,
// fifteen seconds: a wave from the left draws a sun as big as the page, its rays running out from behind the list; rings
// ripple out from the middle; a diagonal sweep winds a spiral; flaps turn over one by one, here and there, into stripes;
// a wave from the right wipes the wall plain again. While the list is in use it holds still. The finale: rings burst out from the middle. The
// pictures, the order they come in and the shape of each wave are a table, so they can be dealt differently each time.
//
// 1.12 b381: the forever cycle. Every pass after the first deals four changes of its own and wipes the wall plain again
// at the end, so the wall is always plain while the list is in use (it does not carry). A pass has one still pattern —
// the signature's sun, rings, spiral or stripes, or diamonds, a checkerboard, chevrons, waves, a pinwheel, a starburst,
// dots, a ramp, squares — two that move, flipped a frame at a time the way a station board animates, so their moving
// edges clatter as they go (rings flowing out from behind the list, a radar beam sweeping round with its afterglow, the
// spiral turning, the pinwheel spinning, a sea rolling under the list, stripes running up the wall, a heart round the
// list, beating, a ball bouncing along the foot of the wall, a drop down every column, a clock whose hands sweep out
// from behind the words, a plasma, an equaliser's bars), and a little picture in the open part of the wall, sized to it
// and slow enough for flaps to follow (a rocket lifting off out of the top, a skyline rising and lighting its windows,
// peaks with the sun coming up behind them, a sailboat, a plane and its trail, a steam engine puffing across). A still
// pattern never shares a pass with itself in motion. Each change runs in a wave dealt from eleven (from either side, the
// top or the bottom, out from the middle or in to it, both diagonals, a rain down the columns, a spiral, a scatter).
// About one pass in eight, the whole wall cascades through its every tone like a departures board resetting before the
// pass goes on. Each flap keeps its own list of changes, so a flap still turning when the next one comes simply keeps
// going, forward, as a real flap does; a touch mid-pass sends the flaps back to plain in a scatter of flips rather than a
// jump; and every flip is drawn once, so a busy pass lays each turning flap in a single stroke.
//
// 1.12 b414: the egg. Every twelfth pass left alone (three minutes of the list untouched), the wall plays the first motion
// picture: Muybridge's horse, 1878. A run of flaps in the open part of the wall clatters over to a sheet ruled and
// numbered the way his backdrop at Palo Alto was, a track along its foot; a horse and rider gallop in from the left,
// printed across the flaps, and every frame of the stride is a flip — only the flaps the horse moves through turn, so the
// clatter runs with its legs. The board slows, a frame at a time, to the moment all four hooves are off the ground, holds
// it a second, picks the gallop up again, and the horse runs out at the right; the sheet flips back to plain. The horse
// is worked out, not traced: a gallop on the right lead, each leg fitted to the path its hoof takes, the body pitching
// and the rider sitting it, in the wall's own greens. The flaps under the words stay plain, as always; with no run of
// flaps clear of them, the wall rests plain all pass.
export default function flap(K) {
  const { clamp, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  // the tones a flap passes through, in order: the page's cream to a soft green
  const TONE = ["#F3F6EF", "#DDEBD8", "#B9DABD", "#86C39A", "#4DA873"], NT = TONE.length; /* the page's cream to near the kit's green */
  const FLIP = .07; /* seconds a flap takes to fall */
  /** the pictures: a tone for every flap, from where it is on the page (x, y: 0…1) and the page's shape (a = width/height) */
  const PICS = { /* each drawn round the middle of the page, where the list is, so it frames the words rather than hides behind them */
    plain: () => 0,
    sun: (x, y, a) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), th = Math.atan2(Y, X), ray = Math.cos(th * 6) > .55; return d < .3 ? 4 : d < .36 ? 2 : ray ? (d < .62 ? 3 : d < .85 ? 2 : 1) : 0; }, /* a disc behind the list, six broad rays out from it */
    rings: (x, y, a) => { const d = Math.hypot((x - .5) * a, y - .5); return [3, 1, 4, 2, 0, 3, 1, 0, 2, 0][Math.min(9, Math.floor(d * 10))]; },
    spiral: (x, y, a) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), th = Math.atan2(Y, X), s2 = Math.sin(th * 2 - d * 14); return s2 > .55 ? 4 : s2 > .1 ? 2 : s2 > -.4 ? 1 : 0; },
    stripes: (x, y, a) => [0, 1, 3, 4, 3, 1][((Math.floor((x * a + y) * 5) % 6) + 6) % 6], /* the wall runs past the page's edge: keep the index whole */
    burst: (x, y, a) => { const d = Math.hypot((x - .5) * a, y - .5); return [4, 3, 2, 4, 1, 3, 0, 2][Math.min(7, Math.floor(d * 8))]; },
    // b381: more of the same kind, for the passes after the first
    diamonds: (x, y, a) => { const d = Math.abs((x - .5) * a) + Math.abs(y - .5); return [4, 2, 0, 3, 1, 0, 2, 0][Math.min(7, Math.floor(d * 7))]; },
    checker: (x, y, a) => ((Math.floor((x - .5) * a * 6 + 60) + Math.floor((y - .5) * 6 + 60)) % 2) ? 3 : 1,
    chevrons: (x, y, a) => [0, 1, 3, 4, 3, 1][((Math.floor((Math.abs(x - .5) * a * .9 + y) * 6) % 6) + 6) % 6],
    waves: (x, y, a) => { const w = y - .5 + .07 * Math.sin((x - .5) * a * 10); return [0, 1, 2, 3, 4, 3, 2, 1][((Math.floor(w * 12) % 8) + 8) % 8]; },
    pinwheel: (x, y, a) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), th = Math.atan2(Y, X) + d * 2.6; return d < .07 ? 4 : ((Math.floor(th / (Math.PI / 4)) % 2) + 2) % 2 ? (d < .45 ? 3 : 2) : (d < .3 ? 1 : 0); },
    starburst: (x, y, a) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), ray = Math.cos(Math.atan2(Y, X) * 8); return d < .15 ? 4 : ray > .72 ? (d < .5 ? 3 : 2) : ray > .2 && d < .7 ? 1 : 0; },
    dots: (x, y, a, c, r) => (c % 3 === 1 && r % 3 === 1) ? 4 : (c % 3 === 1 || r % 3 === 1) && (c + r) % 2 ? 1 : 0,
    ramp: x => Math.min(4, Math.max(0, Math.floor(x * 5.2 - .1))),
    target: (x, y, a) => { const d = Math.max(Math.abs((x - .5) * a) / .9, Math.abs(y - .5)); return [4, 1, 3, 0, 2, 0, 1, 0][Math.min(7, Math.floor(d * 8))]; },
  };
  /** how a change runs across the wall: each flap's delay, from where it is */
  const WAVES = {
    right: (x, y) => x * 1.5 + y * .3, left: (x, y) => (1 - x) * 1.5 + y * .3, out: (x, y, a) => Math.hypot((x - .5) * a, y - .5) * 1.7,
    diag: (x, y) => (x + y) * .85, scatter: (x, y, a, h) => h * 1.7,
    // b381
    in: (x, y, a) => (1 - Math.min(1, Math.hypot((x - .5) * a, y - .5) / .9)) * 1.6, anti: (x, y) => (x + 1 - y) * .85,
    up: (x, y) => (1 - y) * 1.5 + x * .15, down: (x, y) => y * 1.5 + x * .15, rain: (x, y, a, h, c) => S.colh[c] * 1.1 + y * .9,
    spiral: (x, y, a) => (Math.atan2(y - .5, (x - .5) * a) / TAU + .5) * 1.4 + Math.hypot((x - .5) * a, y - .5) * .5,
  };
  // the loop: at each time the wall turns to a picture, the change running as a wave; it ends where it began, plain
  const PLAN = [[1.0, "sun", "right"], [4.1, "rings", "out"], [7.0, "spiral", "diag"], [9.9, "stripes", "scatter"], [12.7, "plain", "left"]];
  // b381: the pools a pass deals from
  const PATS = ["sun", "rings", "spiral", "stripes", "diamonds", "checker", "chevrons", "waves", "pinwheel", "starburst", "dots", "ramp", "target"];
  const WPOOL = ["right", "left", "out", "in", "diag", "anti", "scatter", "rain", "spiral", "up", "down"];
  /** b381: patterns that move, page-sized like the signature's, `t` seconds since they came up; flipped a frame at a time,
   *  the way a station board animates, so their moving edges clatter as they go */
  const seg2 = (u, v, an, L, w) => { const hx = Math.cos(an), hy = Math.sin(an), t = clamp(u * hx + v * hy, 0, L); return Math.hypot(u - hx * t, v - hy * t) < w; }; // near a hand of length L
  const KIN = {
    ripple: (x, y, a, c, r, t) => [0, 1, 2, 3, 4, 3, 2, 1][((Math.floor(Math.hypot((x - .5) * a, y - .5) * 9 - t * 1.15) % 8) + 8) % 8], // rings flowing out from behind the list
    radar: (x, y, a, c, r, t) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), rel = (((t * 1.9 - Math.atan2(Y, X)) % TAU) + TAU) % TAU; return rel < .2 ? 4 : rel < .55 ? 3 : rel < 1 ? 2 : rel < 1.6 || Math.abs(d - .27) < .025 || Math.abs(d - .52) < .025 ? 1 : 0; }, // a beam sweeping round, its afterglow behind it
    turn: (x, y, a, c, r, t) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), s2 = Math.sin(Math.atan2(Y, X) * 2 - d * 14 + t * 1.6); return s2 > .55 ? 4 : s2 > .1 ? 2 : s2 > -.4 ? 1 : 0; }, // the spiral, turning
    spin: (x, y, a, c, r, t) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), th = Math.atan2(Y, X) + d * 2.6 - t * 1.05; return d < .07 ? 4 : ((Math.floor(th / (Math.PI / 4)) % 2) + 2) % 2 ? (d < .45 ? 3 : 2) : (d < .3 ? 1 : 0); }, // a pinwheel, spinning
    sea: (x, y, a, c, r, t) => { const X = x * a, w = y - .52 - .06 * Math.sin(X * 7 - t * 1.9) - .03 * Math.sin(X * 17 + t * 1.4); return w < 0 ? 0 : [1, 2, 3, 2, 4, 3][Math.floor(w * 11) % 6]; }, // a sea rolling under the list
    barber: (x, y, a, c, r, t) => [0, 1, 3, 4, 3, 1][((Math.floor((x * a + y) * 5 - t * 1.05) % 6) + 6) % 6], // stripes running up the wall
    heartbeat: (x, y, a, c, r, t) => { const ph = t % 1.1, beat = ph < .12 ? ph / .12 : ph < .24 ? 1 - (ph - .12) / .12 * .6 : ph < .36 ? .4 + (ph - .24) / .12 * .5 : ph < .6 ? .9 - (ph - .36) / .24 * .9 : 0, sc = .43 * (1 + .07 * beat), X = (x - .5) * a / sc, Y = -(y - .46) / sc, h = Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y; return h < -.35 ? 4 : h < 0 ? 3 : h < .5 * (.4 + beat) ? 1 : 0; }, // a heart round the list, beating
    ball: (x, y, a, c, r, t) => { const bx = -.2 + (a + .4) * (t / 3.1), ph = (t * 1.45) % 1, sq = ph < .07 || ph > .93 ? .78 : 1, by = .86 - 4 * ph * (1 - ph) * .2 + (1 - sq) * .03, X = x * a - bx, Y = y - by, d = Math.hypot(X / (.1 / sq), Y / (.1 * sq)); // a ball bouncing along the foot of the wall, under the words
      if (d < 1) return d < .5 && X < -.01 && Y < -.01 ? 2 : 4; return y > .95 && Math.abs(X) < .12 - (.86 - by) * .2 ? 1 : 0; },
    rainfall: (x, y, a, c, r, t) => { const k = ((((t * 1.1 + S.colh[c] * 3) % 1.5) - .25) - y) / .07; return k < 0 || k > 4 ? 0 : k < 1 ? 4 : k < 2 ? 3 : k < 3 ? 2 : 1; }, // a drop down every column, its trail behind it
    clock: (x, y, a, c, r, t) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y); if (d > .5) return 0; if (d > .44) return 3; const th = ((Math.atan2(Y, X) / (TAU / 12)) % 1 + 1) % 1; if (d > .37 && (th < .1 || th > .9)) return 4; // a clock round the list
      if (seg2(X, Y, -Math.PI / 2 + t * TAU / 6, .41, .035) || seg2(X, Y, -Math.PI / 2 + 1.1 + t * TAU / 72, .27, .05)) return 4; return 1; }, // its hands sweeping out from behind the words
    plasma: (x, y, a, c, r, t) => { const X = x * a, v = Math.sin(X * 5 + t * .9) + Math.sin(y * 6 - t * 1.2) + Math.sin((X + y) * 4 + t * .6) + Math.sin(Math.hypot(X - a / 2, y - .5) * 7 - t * 1.5); return Math.max(0, Math.min(4, Math.floor((v + 4) / 8 * 5))); }, // Terminal's plasma, in flaps
    equalizer: (x, y, a, c, r, t) => { const h = (.5 + .5 * Math.sin(t * 3.1 + c * .9)) * (.3 + .18 * Math.sin(t * 1.7 + c * .35)) + .06, k = (1 - y) / h; return k > 1 ? 0 : k > .75 ? 1 : k > .5 ? 2 : k > .25 ? 3 : 4; }, // bars jumping along the foot
  };
  /** b381: little pictures for the open part of the wall (the box: the right-hand column of a wide screen, the foot of a
   *  tall one), sized to it and slow enough for flaps to follow: x, y in rows from its left and top, the box `n` rows deep
   *  and `w` rows wide, `t` seconds since the picture came up */
  const STAGE = {
    rocket: (x, y, t, n, w) => { const s = Math.min(1.5, n / 7), cx = w / 2, pad = n - .5; if (y > pad - .1 && Math.abs(x - cx) < 2.2 * s) return 3; // the pad
      const lift = t < 1.0 ? 0 : (t - 1.0) * (t - 1.0) * 5.5 * s, bot = pad - .1 - lift, top = bot - 4.6 * s, k = (y - top) / (bot - top), dx = Math.abs(x - cx); // it waits, lights, and goes, up out of the top
      if (k > 0 && k < 1) { const half = (k < .3 ? .9 * k / .3 : .9) * s; if (dx < half) return dx < .5 * s && Math.abs(y - (top + 1.7 * s)) < .5 * s ? 1 : 4; if (k > .72 && dx < half + (k - .72) * 3 * s) return 3; } // body, window, fins
      if (t > .85 && y > bot && y < bot + (1.1 + .4 * Math.sin(t * 17)) * s && dx < .55 * s) return 2; // its flame
      if (t > .85 && t < 2.8 && y > pad - 1.2 * s && y < pad && dx > .9 * s && dx < (1.2 + (t - .85) * 1.6) * s) return 1; // smoke rolling off the pad
      return 0; },
    skyline: (x, y, t, n, w) => { const col = Math.floor(x / .77), hash = ((Math.sin(col * 12.9898 + 3) * 43758.5453) % 1 + 1) % 1, hgt = Math.max(2, Math.round(n * (.3 + .55 * hash))), rise = clamp((t - hash * .7) / .45), top = n - Math.round(hgt * rise); // towers rising, their windows lighting
      if (col % 4 === 3 || y < top) return 0; const wy = Math.floor(y), lit = ((Math.sin(col * 7.1 + wy * 3.3) * 999) % 1 + 1) % 1; return wy > top && wy < n - 1 && col % 2 === 0 && t > 1.1 + lit * 1.5 ? 1 : 4; },
    peaks: (x, y, t, n, w) => { let near = 0; for (let k = 0; k < 4; k++) near = Math.max(near, n * (.42 + .35 * ((k * 7.7) % 1)) - Math.abs(x - (k + .3) * w / 3.2) * 1.15); // peaks across the box, snow on top
      const yy = n - y, far = n * (.55 + .08 * Math.sin(x * .9 + 1)); if (yy < near) return yy > near - Math.max(1, n * .12) ? 1 : 4; if (yy < far - n * .15) return 3;
      return Math.hypot((x - w * .55) * .95, y - (n - n * .8 * clamp((t - .2) / 2.2))) < Math.max(1.6, n * .2) ? 2 : 0; }, // the sun coming up behind them
    boat: (x, y, t, n, w) => { const s = Math.min(1.5, n / 6), sea = n - 1.3 * s + .3 * s * Math.sin(x * 1.3 / s - t * 3.2); if (y > sea) return y < sea + .8 * s ? 2 : 3; // the waves
      const bx = w + 2.4 * s - (w + 4.8 * s) * clamp(t / 2.9), yw = n - 1.5 * s + .2 * s * Math.sin(t * 4.2); // in from the right, out at the left
      if (y > yw - s && y < yw + .2 * s && Math.abs(x - bx) < (1.8 - (y - yw + s) / s * .8) * s) return 4; // the hull
      if (Math.abs(x - bx) < .3 && y > yw - 4.2 * s && y < yw - s) return 4; // the mast
      if (y > yw - 4 * s && y < yw - 1.25 * s && x > bx + .15 && x < bx + .15 + (y - (yw - 4.1 * s)) * .6) return 2; // its sail
      return 0; },
    plane: (x, y, t, n, w) => { const s = Math.min(1.4, n / 6), px2 = w + 3 * s - (w + 9 * s) * clamp(t / 2.8), py = n * .42 + Math.sin(t * 1.3) * .3, dx = (x - px2) / s, dy = (y - py) / s; // in from the right, its trail behind it
      if (Math.abs(dy) < .5 && dx > -.9 && dx < 2.2) return 4; if (dx > .3 && dx < 1.3 && Math.abs(dy) < 1.9 - (dx - .3)) return 4; if (dx > 1.7 && dx < 2.3 && dy > -1.1 && dy < .3) return 4; // body, wings, tail
      if (dx > 2.2 && dx < 6 && Math.abs(dy) < .4) return dx < 3.8 ? 2 : 1; // the trail
      return 0; },
    engine: (x, y, t, n, w) => { const s = Math.min(1.5, n / 6); if (y > n - .55) return 3; // the rails
      const tx = w + 1 - (w + 7 * s) * clamp(t / 2.9), bot = n - .65, dx = (x - tx) / s, dy = (bot - y) / s; // a little steam engine, puffing across
      if (dy > 0 && dy < .55 && dx > .2 && dx < 4.6 && Math.abs(((dx % 1.5) + 1.5) % 1.5 - .75) < .45) return 2; // its wheels
      if (dx > 0 && dx < 3.4 && dy > .5 && dy < 2.3) return 4; // the boiler
      if (dx > 3.4 && dx < 5 && dy > .5 && dy < 3.2) return dy > 2.2 && dx > 3.7 && dx < 4.7 ? 1 : 4; // the cab, its window
      if (dx > .5 && dx < 1.3 && dy > 2.3 && dy < 3.2) return 4; // the funnel
      for (let k = 0; k < 4; k++) { const age = (t * 1.6 + k * .25) % 1, px2 = tx + (1 + age * 2.6) * s, py = bot - (3.6 + age * 1.6) * s; if (Math.hypot(x - px2, (y - py) * 1.1) < (.5 + age * .5) * s) return age < .5 ? 2 : 1; } // smoke, drifting back
      return 0; },
  };
  const KINS = Object.keys(KIN), STAGES = Object.keys(STAGE), TWIN = { spiral: "turn", pinwheel: "spin", stripes: "barber", rings: "ripple", waves: "sea" }; // a still pattern never shares a pass with itself in motion
  /** 1.12 b414: the egg's horse and rider, a silhouette worked out from a gallop rather than traced. Units: the withers 1
   *  high, x forward, y up, the ground at 0; u the stride, 0…1 — a transverse gallop on the right lead (left hind, right
   *  hind, left fore, right fore, then all four gathered under it in the air, the moment Muybridge's camera caught).
   *  Each fetlock follows a path (on the ground it runs back as the body goes over it; in the air it flicks up, folds
   *  and reaches) and its leg is fitted to it, two bones, the knee forward and the hock back; the body bobs and pitches
   *  with the stride, the head nods, the tail streams, the rider sits it. drawHorse(g, u, X, Y, s): facing right, its
   *  ground point at (X, Y), s px a unit, filled in the current fill. */
  const HORSE = (() => {
    const cr = (Q, s) => { const n = Q.length - 1, f = Math.min(n - 1e-9, Math.max(0, s * n)), i = Math.floor(f), t = f - i, p0 = Q[Math.max(0, i - 1)], p1 = Q[i], p2 = Q[i + 1], p3 = Q[Math.min(n, i + 2)], t2 = t * t, t3 = t2 * t;
      return [0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)); }; // through the path's points
    const ik = (A, T, a, b, bend) => { const dx = T[0] - A[0], dy = T[1] - A[1], d0 = Math.hypot(dx, dy) || 1e-6, d = Math.max(Math.abs(a - b) + .02, Math.min(d0, a + b - 1e-4)), ux = dx / d0, uy = dy / d0, x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x)); return [A[0] + ux * x - uy * h * bend, A[1] + uy * x + ux * h * bend]; }; // the joint between two bones reaching from A to T
    const rot = (p, o, a) => { const c = Math.cos(a), s = Math.sin(a), x = p[0] - o[0], y = p[1] - o[1]; return [o[0] + x * c - y * s, o[1] + x * s + y * c]; };
    const DUTY = .32, LEGS = [[1, 0], [1, .1], [0, .3], [0, .42]]; // each leg: hind or fore, and when in the stride it lands
    // a leg's joint at rest (the elbow, the stifle) and how far it slides with the leg's swing, its two bones, where its
    // fetlock lands and leaves the ground, and the path the fetlock swings back along in the air
    const FORE = { piv: [.3, .56], slide: [.12, .02], a: .34, b: .24, td: .4, lo: -.4, sw: [[-.4, .085], [-.44, .2], [-.4, .34], [-.28, .41], [-.02, .41], [.3, .35], [.52, .22], [.48, .12], [.4, .085]] };
    const HIND = { piv: [-.4, .6], slide: [.1, .04], a: .37, b: .27, td: .34, lo: -.36, sw: [[-.36, .085], [-.46, .2], [-.44, .32], [-.28, .38], [-.02, .36], [.24, .26], [.38, .15], [.34, .085]] };
    const BODY = [[.2, 1.0], [-.02, .955], [-.26, .965], [-.5, .995], [-.72, .935], [-.82, .82], [-.83, .7], [-.74, .58], [-.52, .54], [-.32, .575], [-.08, .5], [.18, .45], [.36, .5], [.53, .64], [.61, .8], [.53, .94], [.36, 1.02]];
    const NECK = [[.32, 1.03], [.56, 1.2], [.77, 1.31], [.91, 1.36], [.99, 1.33], [1.1, 1.22], [1.24, 1.07], [1.3, 1.0], [1.27, .95], [1.18, .95], [1.06, 1.03], [.97, 1.08], [.88, 1.12], [.73, 1.0], [.62, .85], [.57, .76]], NB = [.45, .95]; // the neck and head, nodding about the neck's root
    const smooth = (g, Q) => { const n = Q.length, at = i => Q[(i + n) % n]; g.moveTo(at(0)[0], at(0)[1]); for (let i = 0; i < n; i++) { const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2); g.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]); } g.closePath(); };
    const fill = (g, fn) => { g.beginPath(); fn(); g.fill(); }; // each part filled alone, so where parts overlap the ink stays even
    const limb = (g, A, B, w0, w1) => { const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L; // a bone, tapering, round at both ends
      fill(g, () => { g.moveTo(A[0] + nx * w0 / 2, A[1] + ny * w0 / 2); g.lineTo(B[0] + nx * w1 / 2, B[1] + ny * w1 / 2); g.lineTo(B[0] - nx * w1 / 2, B[1] - ny * w1 / 2); g.lineTo(A[0] - nx * w0 / 2, A[1] - ny * w0 / 2); g.closePath(); });
      fill(g, () => g.arc(A[0], A[1], w0 / 2, 0, TAU)); fill(g, () => g.arc(B[0], B[1], w1 / 2, 0, TAU)); };
    const pose = u => {
      const bob = .035 * Math.cos(TAU * (u - .85)), pitch = .06 * Math.cos(TAU * (u - .17)), nod = .07 * Math.cos(TAU * (u - .9)), O = [0, .7];
      const B = p => { const q = rot(p, O, pitch); return [q[0], q[1] + bob]; }; // the body's frame into the ground's
      const legs = LEGS.map(([hind, td]) => {
        const D = hind ? HIND : FORE, ph = ((u - td) % 1 + 1) % 1, s = ph < DUTY ? ph / DUTY : (ph - DUTY) / (1 - DUTY), on = ph < DUTY;
        const F = on ? [D.piv[0] + D.td + (D.lo - D.td) * s, .085 - .03 * Math.sin(Math.PI * s)] : (q => [D.piv[0] + q[0], q[1]])(cr(D.sw, s)); // the fetlock
        const r = B(D.piv), th = Math.atan2(F[0] - r[0], r[1] - F[1]), top = B([D.piv[0] + D.slide[0] * Math.sin(th), D.piv[1] + D.slide[1] * Math.sin(th)]), knee = ik(top, F, D.a, D.b, hind ? -1 : 1);
        const cd = (v => { const n = Math.hypot(v[0], v[1]) || 1; return [v[0] / n, v[1] / n]; })([F[0] - knee[0], F[1] - knee[1]]), al = Math.asin(Math.min(1, Math.max(.25, F[1] / .1))), down = [Math.cos(al), -Math.sin(al)];
        let pa = down; // the pastern: on the ground it reaches down to the hoof; in the air it curls back, and straightens to land
        if (!on) { const curl = rot(cd, [0, 0], -(hind ? .8 : 1.3) * Math.sin(Math.PI * Math.min(1, s / .8))), k = clamp((s - .8) / .2), v = [curl[0] + (down[0] - curl[0]) * k, curl[1] + (down[1] - curl[1]) * k], n = Math.hypot(v[0], v[1]) || 1; pa = [v[0] / n, v[1] / n]; }
        return { hind, root: B(hind ? [-.55, .8] : [.47, .78]), top, knee, F, hoof: [F[0] + pa[0] * .1, F[1] + pa[1] * .1], pa };
      });
      return { bob, pitch, nod, B, legs };
    };
    return (g, u, X, Y, s) => {
      const P = pose(u), B = P.B, N = p => B(rot(p, NB, P.nod));
      g.save(); g.translate(X, Y); g.scale(s, -s);
      for (const L of P.legs) {
        if (L.hind) { limb(g, L.root, L.top, .3, .22); limb(g, L.top, L.knee, .2, .075); const d = [L.knee[0] - L.top[0], L.knee[1] - L.top[1]], n = Math.hypot(d[0], d[1]) || 1, k = L.knee; fill(g, () => { g.moveTo(k[0] - d[1] / n * .045, k[1] + d[0] / n * .045); g.lineTo(k[0] + d[0] / n * .055 - d[1] / n * .005, k[1] + d[1] / n * .055 + d[0] / n * .005); g.lineTo(k[0] + d[1] / n * .04, k[1] - d[0] / n * .04); g.closePath(); }); } // the thigh, the gaskin, the point of the hock
        else { limb(g, L.root, L.top, .24, .17); limb(g, L.top, L.knee, .155, .07); } // the shoulder, the forearm
        limb(g, L.knee, L.F, .058, .05); limb(g, L.F, L.hoof, .05, .046); // the cannon, the pastern
        const h = L.hoof, d = L.pa, n = [-d[1], d[0]]; fill(g, () => { g.moveTo(h[0] + n[0] * .03, h[1] + n[1] * .03); g.lineTo(h[0] + d[0] * .055 + n[0] * .042, h[1] + d[1] * .055 + n[1] * .042); g.lineTo(h[0] + d[0] * .055 - n[0] * .042, h[1] + d[1] * .055 - n[1] * .042); g.lineTo(h[0] - n[0] * .03, h[1] - n[1] * .03); g.closePath(); }); // the hoof
      }
      fill(g, () => smooth(g, BODY.map(B))); fill(g, () => smooth(g, NECK.map(N)));
      const ear = [[.85, 1.32], [.83, 1.43], [.92, 1.34]].map(N); fill(g, () => { g.moveTo(...ear[0]); g.lineTo(...ear[1]); g.lineTo(...ear[2]); g.closePath(); });
      const tl = [[-.72, .93], [-.87, .965], [-1.02, .94], [-1.16, .87], [-1.27, .78]].map((p, k) => B([p[0], p[1] + .03 * k * Math.sin(TAU * (u - k * .16))])), tw = [.08, .15, .17, .13, .05]; // the tail, a ripple running down it
      for (let k = 0; k < 4; k++) limb(g, tl[k], tl[k + 1], tw[k], tw[k + 1]);
      // the rider: sitting up, 1878's way, his hands down on the reins, steady over the horse's pitch
      const J = p => { const q = rot(p, [.05, 1.05], -P.pitch * .6); return B([q[0], q[1] - P.bob * .5]); };
      const hip = J([.02, 1.07]), kn = J([.17, .87]), ft = J([.1, .68]), sh = J([.13, 1.34]), el = J([.25, 1.21]), hand = J([.41, 1.14]), hd = J([.18, 1.45]);
      limb(g, hip, sh, .16, .15); limb(g, hip, kn, .12, .08); limb(g, kn, ft, .07, .055); limb(g, sh, el, .065, .055); limb(g, el, hand, .055, .045); limb(g, ft, J([.18, .66]), .055, .045);
      fill(g, () => g.arc(hd[0], hd[1], .07, 0, TAU));
      const c0 = J([.12, 1.47]), c1 = J([.3, 1.465]), c2 = J([.25, 1.5]); fill(g, () => { g.arc(hd[0], hd[1] + .012, .072, 0, Math.PI); g.lineTo(c0[0], c0[1]); g.lineTo(c1[0], c1[1]); g.lineTo(c2[0], c2[1]); g.closePath(); }); // his cap and its peak
      limb(g, hand, N([1.26, .985]), .016, .016); // the reins
      g.restore();
    };
  })();
  // 1.12 b414: the egg's gallop, a frame at a time: ten a second, then slowing to the frame where all four hooves are off
  // the ground, held a second, and the gallop again (the seconds each frame stays up); the held frame is the twelfth of
  // the stride, so the first is the second
  const INK = "#3B9462"; /* the horse's ink: the wall's deepest green, taken a step deeper, as his silhouettes were */
  const GALLOP = [...Array(40).fill(.1), .13, .17, .21, .26, .31, .36, 1.0, .3, .22, .16, .12, .1, ...Array(21).fill(.1)], HOLD = 46, FE = .05; /* FE: a flap's fall in the egg, a touch quicker than the wall's */
  const S = {
    res: "dpr",
    wash: 1.6, veil: 1, // a light kit: the list's band keeps its wash, and Everything shows the plain ground
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(19), fw = pr ? 30 : 42, fh = pr ? 40 : 56, gap = pr ? 3 : 4;
      const C = Math.ceil((W + gap) / (fw + gap)) + 1, R = Math.ceil((H + gap) / (fh + gap)) + 1, ox = (W - (C * (fw + gap) - gap)) / 2, oy = (H - (R * (fh + gap) - gap)) / 2;
      Object.assign(S, { W, H, pr, fw, fh, gap, C, R, ox, oy, a: W / H });
      S.hash = Array.from({ length: C * R }, () => r());
      S.mask = new Uint8Array(C * R); if (S.raw) S.words(S.raw);
      // each tone drawn once: the flap, lit a little on its top half and shaded on its bottom, and its hinge
      const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
      S.faces = TONE.map(col => make(fw, fh, x => { const rr = fw * .1; x.fillStyle = col; x.beginPath(); x.roundRect(0, 0, fw, fh, rr); x.fill();
        const gr = x.createLinearGradient(0, 0, 0, fh); gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(.5, "rgba(255,255,255,0)"); gr.addColorStop(.5, "rgba(20,38,27,.03)"); gr.addColorStop(1, "rgba(20,38,27,.06)"); x.fillStyle = gr; x.beginPath(); x.roundRect(0, 0, fw, fh, rr); x.fill();
        x.fillStyle = "rgba(20,38,27,.1)"; x.fillRect(0, fh / 2 - .5, fw, 1); x.fillStyle = "rgba(255,255,255,.5)"; x.fillRect(0, fh / 2 + .5, fw, .6); }));
      // b381: every flip drawn once, a tone falling to the next at each sixteenth of its fall, so a pass after the first
      // lays a turning flap in one stroke (the first pass draws its flips as it always has)
      const fall = (x, A0, B0, p) => { const hh = fh / 2, sy = A0.height / 2; x.drawImage(B0, 0, 0, B0.width, sy, 0, 0, fw, hh); x.drawImage(A0, 0, sy, A0.width, sy, 0, hh, fw, hh);
        if (p < .5) { const k = Math.cos(p * Math.PI); x.drawImage(A0, 0, 0, A0.width, sy, 0, hh - hh * k, fw, hh * k); x.fillStyle = `rgba(20,38,27,${(p * .18).toFixed(3)})`; x.fillRect(0, hh - hh * k, fw, hh * k); }
        else { const k = -Math.cos(p * Math.PI); x.drawImage(B0, 0, sy, B0.width, sy, 0, hh, fw, hh * k); x.fillStyle = `rgba(20,38,27,${((1 - p) * .18).toFixed(3)})`; x.fillRect(0, hh, fw, hh * k); } };
      S.flips = TONE.map((_, a2) => Array.from({ length: 17 }, (_, ph) => ph ? make(fw, fh, x => fall(x, S.faces[a2], S.faces[(a2 + 1) % NT], ph / 16)) : S.faces[a2]));
      // the wall behind the flaps, and the cache the flaps are kept drawn in
      bg.fillStyle = "#E4EADF"; bg.fillRect(0, 0, W, H);
      [S.wall, S.wx] = canvas(Math.ceil(W * px), Math.ceil(H * px)); S.wx.imageSmoothingEnabled = true; S.wx.setTransform(px, 0, 0, px, 0, 0);
      S.drawn = new Array(C * R).fill(""); S.full = true;
      // b381: dice of their own for the rain's columns and the scatter back to plain; where the pictures go
      const q = rng(29); S.colh = Array.from({ length: C }, () => q()); S.back = Float32Array.from({ length: C * R }, () => .12 + .78 * q());
      S.pl = null; S.stage();
    },
    /** where the words are (scenes.js): the flaps under them (and a little round them) rest page-plain */
    words(rects) {
      S.raw = rects; if (!S.W) return;
      const { C, R, fw, fh, gap, ox, oy } = S, m = 6; S.mask.fill(0);
      for (const [x0, y0, x1, y1] of rects) { const c0 = Math.max(0, Math.floor((x0 - m - ox) / (fw + gap))), c1 = Math.min(C - 1, Math.floor((x1 + m - ox) / (fw + gap))), r0 = Math.max(0, Math.floor((y0 - m - oy) / (fh + gap))), r1 = Math.min(R - 1, Math.floor((y1 + m - oy) / (fh + gap))); for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) S.mask[rr * C + c] = 1; }
      if (S.hash) S.stage();
    },
    /** b381: the open part of the wall, where the little pictures play — the biggest block of flaps clear of the words, on
     *  the right of a wide screen, at the foot of a tall one. With no words known yet (the lab), a list's usual place stands
     *  in for them. */
    stage() {
      const { C, R, pr } = S, m = new Uint8Array(C * R);
      if (S.raw) m.set(S.mask); else for (let rr = 0; rr < R; rr++) for (let c = 0; c < C; c++) if (pr ? rr >= Math.round(R * .34) && rr <= Math.round(R * .56) : rr >= Math.round(R * .3) && rr <= Math.round(R * .62) && c <= Math.round(C * .64)) m[rr * C + c] = 1;
      const ps = new Int32Array((C + 1) * (R + 1)); for (let rr = 0; rr < R; rr++) for (let c = 0; c < C; c++) ps[(rr + 1) * (C + 1) + c + 1] = m[rr * C + c] + ps[rr * (C + 1) + c + 1] + ps[(rr + 1) * (C + 1) + c] - ps[rr * (C + 1) + c];
      const sum = (c0, r0, w, h) => ps[(r0 + h) * (C + 1) + c0 + w] - ps[r0 * (C + 1) + c0 + w] - ps[(r0 + h) * (C + 1) + c0] + ps[r0 * (C + 1) + c0];
      let box = null, bs = -1; for (let h = 5; h <= Math.min(15, R - 2); h++) for (let w = 6; w <= Math.min(12, C - 2); w++) for (let r0 = 1; r0 + h <= R - 1; r0++) for (let c0 = 1; c0 + w <= C - 1; c0++) {
        if (sum(c0, r0, w, h)) continue; const unit = Math.min(h, w * .77), sc = Math.min(unit, 9) * 10 + (pr ? r0 / R : c0 / C) * 3 + r0 / R + unit * .1 + w * h * .01; if (sc > bs) { bs = sc; box = [c0, r0, w, h]; } } // as big as the open part allows, a picture centred in it
      S.box = box || [Math.max(1, C - 10), Math.max(1, R - 9), Math.min(9, C - 2), Math.min(8, R - 2)];
      S.stageKey = S.box.join(",");
    },
    /** what a flap shows at time T of a plan: its tone, and if it's mid-fall the tone it's falling to and how far */
    flapAt(T, plan, i, x, y, start0) {
      const h = S.hash[i], masked = S.mask[i], pic = n => masked ? 0 : PICS[n](x, y, S.a);
      let face = start0;
      for (const [t0, name, wave] of plan) {
        const tgt = pic(name), start = t0 + WAVES[wave](x, y, S.a, h), steps = (tgt - face + NT) % NT;
        if (T < start) return [face, face, 0];
        const done = start + steps * FLIP; if (T < done) { const k = (T - start) / FLIP, j = Math.floor(k); return [(face + j) % NT, (face + j + 1) % NT, k - j]; }
        face = tgt;
      }
      return [face, face, 0];
    },
    /** b381: pass P as each flap's own list of changes — when it starts to turn, and to which tone (and, for the board's
     *  reset, how many times round first) — worked out once a pass from its steps: a pattern in a wave, a picture frame by
     *  frame, plain again at the end */
    plan(P) {
      const key = P + "|" + S.stageKey; if (S.pl && S.pl.key === key) return S.pl;
      const { C, R, fw, fh, gap, ox, oy, W, H, a } = S, n = C * R, r = K.deal(P, 11), wv = () => WPOOL[Math.floor(r() * WPOOL.length)];
      // a still pattern, two that move and a picture that travels, each from its own bag, in one of four orders
      const k1 = K.bag(P, KINS.length, 13), k2b = K.bag(P, KINS.length, 15), k2 = k2b !== k1 ? k2b : (k1 + 1 + Math.floor(r() * (KINS.length - 1))) % KINS.length, b1 = K.bag(P, STAGES.length, 16);
      let s1 = K.bag(P, PATS.length, 12); for (let z = 0; z < 3 && [KINS[k1], KINS[k2]].includes(TWIN[PATS[s1]]); z++) s1 = (s1 + 1) % PATS.length;
      const order = [["S", "K", "B", "K"], ["K", "S", "K", "B"], ["B", "K", "S", "K"], ["K", "B", "K", "S"]][K.bag(P, 4, 17)], reset = K.bag(P, 8, 14) === 5, steps = [], names = [];
      const at = [1.0 + r() * .15, 3.95 + r() * .2, 7.15 + r() * .2, 10.1 + r() * .15, 12.7];
      const [bc0, br0, bnc, bnr] = S.box, AR = (fw + gap) / (fh + gap), inBox = (c, rr) => c >= bc0 && c < bc0 + bnc && rr >= br0 && rr < br0 + bnr;
      const still = (t, name, wave, spin = 0) => steps.push({ t, wave, spin, pic: (c, rr, x, y) => PICS[name](x, y, a, c, rr) });
      const moving = (t0, t1, f, wave, only) => { steps.push({ t: t0, wave, quick: true, pic: (c, rr, x, y) => f(c, rr, x, y, 0) }); // it comes up in a quicker wave, then a frame at a time
        for (let t = .28; t0 + t < t1 - .05; t += .28) steps.push({ t: t0 + t, wave: "tick", only, pic: (c, rr, x, y) => f(c, rr, x, y, t) }); };
      let ki = 0; for (let k = 0; k < 4; k++) { const w = wv();
        if (order[k] === "S") { names.push((reset ? "reset+" : "") + PATS[s1] + "/" + w); still(at[k], PATS[s1], w, reset ? 2 : 0); }
        else if (order[k] === "K") { const name = KINS[ki++ ? k2 : k1], f = KIN[name]; names.push(name + "/" + w); moving(at[k], at[k + 1], (c, rr, x, y, t) => f(x, y, a, c, rr, t), w, null); }
        else { const name = STAGES[b1], f = STAGE[name]; names.push(name + "/" + w); moving(at[k], at[k + 1], (c, rr, x, y, t) => inBox(c, rr) ? f((c - bc0 + .5) * AR, rr - br0 + .5, t, bnr, bnc * AR) : 0, w, inBox); } }
      still(at[4], "plain", wv());
      // each flap's changes, in order: one that would come before the last it had waits for it
      const lists = Array.from({ length: n }, () => []), last = new Uint8Array(n);
      for (const st of steps) for (let i = 0; i < n; i++) {
        const c = i % C, rr = (i / C) | 0; if (st.only && !st.only(c, rr)) continue;
        const x = (ox + c * (fw + gap) + fw / 2) / W, y = (oy + rr * (fh + gap) + fh / 2) / H, tg = st.pic(c, rr, x, y); if (tg === last[i] && !st.spin) continue;
        const L2 = lists[i], d = st.wave === "tick" ? S.hash[i] * .05 : WAVES[st.wave](x, y, a, S.hash[i], c, rr) * (st.quick ? .45 : 1), t = Math.max(st.t + d, L2.length ? L2[L2.length - 3] + .01 : 0);
        L2.push(t, tg, st.spin || 0); last[i] = tg;
      }
      const cnt = new Int32Array(n), off = new Int32Array(n); let tot = 0; for (let i = 0; i < n; i++) { off[i] = tot; cnt[i] = lists[i].length / 3; tot += cnt[i]; }
      const es = new Float32Array(tot), et = new Uint8Array(tot); for (let i = 0; i < n; i++) for (let k = 0; k < cnt[i]; k++) { es[off[i] + k] = lists[i][k * 3]; et[off[i] + k] = lists[i][k * 3 + 1] + lists[i][k * 3 + 2] * 8; }
      return S.pl = { key, off, cnt, es, et, names };
    },
    /** 1.12 b414: the egg's plan — where it plays (the run of flaps clear of the words that holds the biggest horse, two to
     *  six rows deep, kept out of the washes along the top and the foot), each frame of the gallop (when it goes up, the
     *  stride, where the horse is), and each flap's moment in the waves that put the sheet up and take it down */
    eggPlan(P) {
      const o = S.ep; if (o && o.P === P && o.raw === S.raw && o.W === S.W && o.H === S.H) return o;
      const { C, R, fw, fh, gap, ox, oy, W, H, pr } = S, cap = pr ? 100 : 150;
      const masked = (c, rr) => S.raw ? S.mask[rr * C + c] : pr ? rr >= Math.round(R * .34) && rr <= Math.round(R * .56) : rr >= Math.round(R * .3) && rr <= Math.round(R * .62) && c <= Math.round(C * .64); // no words known yet (the lab): a list's usual place stands in
      let bd = null, bs = 0;
      for (let h = 2; h <= 6; h++) for (let r0 = 0; r0 + h <= R; r0++) {
        const y0 = oy + r0 * (fh + gap), y1 = y0 + h * (fh + gap) - gap; if (y0 < 0 || y1 > H) continue;
        const hb = y1 - y0, top = y0 + hb * .08, ground = Math.min(y1 - hb * .1, H - (pr ? 100 : 105)), s = Math.min(cap, (ground - top) / 1.62), hw = s * 2.66; // the hooves kept above the footer's wash
        if (s < (pr ? 38 : 48)) continue;
        const wash = clamp((132 - top) / hb) * .9; // the bar's wash along the top
        for (let c = 0; c < C;) {
          let e = c; while (e < C && ![...Array(h).keys()].some(k => masked(e, r0 + k))) e++;
          if (e === c) { c++; continue; }
          const x0 = Math.max(0, ox + c * (fw + gap)), x1 = Math.min(W, ox + e * (fw + gap) - gap), run = x1 - x0;
          if (run >= hw * (pr ? 1.3 : 1.6)) { const sc = s * (1 + .3 * Math.min(4, run / hw)) * (1 - wash); if (sc > bs) { bs = sc; bd = { r0, h, c0: c, c1: e, s, x0, x1, y0, y1, ground }; } } // a big horse with room to run
          c = e;
        }
      }
      const E0 = { P, raw: S.raw, W, H, bd }; S.ep = E0; if (!bd) return E0; // no room anywhere: the wall rests plain
      // the band's flaps, where each sits in the band's own picture, and its moments in the two waves
      const bx = ox + bd.c0 * (fw + gap) - gap / 2, by = oy + bd.r0 * (fh + gap) - gap / 2, bw = (bd.c1 - bd.c0) * (fw + gap), bh = bd.h * (fh + gap), at = new Int16Array(C * R).fill(-1), fl = [];
      for (let rr = bd.r0; rr < bd.r0 + bd.h; rr++) for (let c = bd.c0; c < bd.c1; c++) { const i = rr * C + c, lx = ox + c * (fw + gap) - bx, ly = oy + rr * (fh + gap) - by, k = clamp((bx + lx + fw / 2 - bd.x0) / (bd.x1 - bd.x0)); at[i] = fl.length; fl.push({ i, lx, ly, tin: .7 + k * 1.0 + S.hash[i] * .08, tout: 11.75 + k * 1.0 + S.hash[i] * .08 }); }
      // the gallop: in from the left, easing to the middle; there through the slowing and the hold; away out at the right
      const s = bd.s, Xin = bd.x0 - 1.45 * s, Xc = (bd.x0 + bd.x1) / 2, Xout = bd.x1 + 1.45 * s, ev = [{ t: 1.9, u: -1, x: 0 }];
      for (let k = 0, t = 2.0; k < GALLOP.length; t += GALLOP[k++]) { const qi = clamp((t - 2) / 2.2), qo = clamp((t - 9.24) / 2.1); ev.push({ t, u: ((k + 1) / 12) % 1, x: t < 4.2 ? Xin + (Xc - Xin) * (1 - (1 - qi) * (1 - qi)) : t < 9.24 ? Xc : Xc + (Xout - Xc) * qo * qo }); }
      // the pictures: every flap's plain face laid out once, the sheet (its rules, numbered, and the track) printed on them
      // once, a small copy to tell which flaps a frame changes, a buffer to print into, and the frames made as they're asked for
      const mk = (w, h2) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h2 * px)); x.imageSmoothingEnabled = true; return [c, x]; };
      const [base, bx2] = mk(bw, bh), clip = new Path2D(); bx2.setTransform(px, 0, 0, px, 0, 0);
      for (const f of fl) { bx2.drawImage(S.faces[0], f.lx + gap / 2, f.ly + gap / 2, fw, fh); clip.roundRect(f.lx + gap / 2, f.ly + gap / 2, fw, fh, fw * .1); }
      const [print, pX] = mk(bw, bh), gy = bd.ground - by, top = gy - s * 1.62;
      pX.setTransform(1, 0, 0, 1, 0, 0); pX.fillStyle = "#fff"; pX.fillRect(0, 0, print.width, print.height); pX.setTransform(px, 0, 0, px, 0, 0);
      const step = s * .5, sx0 = ((Xc - bx) % step + step) % step; pX.fillStyle = TONE[2]; // the rules, half a horse apart, numbered along the top as his were
      const fs = Math.max(9, s * .11); pX.font = `600 ${fs.toFixed(1)}px ui-monospace, Menlo, monospace`; pX.textAlign = "center"; pX.textBaseline = "top";
      for (let x = sx0, n = 1; x < bw; x += step, n++) { pX.fillStyle = TONE[2]; pX.fillRect(x - .6, top + fs * 1.15, 1.2, gy - top - fs * 1.15); if (x > 8 && x < bw - 8) { pX.fillStyle = TONE[3]; pX.fillText(String(n), x, top); } }
      pX.fillStyle = TONE[1]; pX.fillRect(0, gy, bw, bh - gy); pX.fillStyle = TONE[2]; pX.fillRect(0, gy, bw, 1); // the track
      const [sheet, sX] = mk(bw, bh); sX.drawImage(base, 0, 0); sX.save(); sX.setTransform(px, 0, 0, px, 0, 0); sX.clip(clip); sX.setTransform(1, 0, 0, 1, 0, 0); sX.globalCompositeOperation = "multiply"; sX.drawImage(print, 0, 0); sX.restore();
      const lo = document.createElement("canvas"); lo.width = Math.ceil(bw / 4); lo.height = Math.ceil(bh / 4); const loX = lo.getContext("2d", { willReadFrequently: true });
      const lr = fl.map(f => [Math.floor((f.lx + gap / 2) / 4), Math.floor((f.ly + gap / 2) / 4), Math.ceil((f.lx + gap / 2 + fw) / 4), Math.ceil((f.ly + gap / 2 + fh) / 4)]);
      return S.ep = Object.assign(E0, { bx, by, bw, bh, at, fl, ev, sheet, clip, print, pX, gy, lo, loX, lr, sig: [], cache: new Map() });
    },
    /** 1.12 b414: what frame e does to the band, in the flaps' own tones: its horse and rider, and their shadow under them */
    eggInk(g, eg, e) {
      const v = eg.ev[e], x = v.x - eg.bx, s = eg.bd.s;
      g.fillStyle = TONE[1]; g.beginPath(); g.ellipse(x - .1 * s, eg.gy + .012 * s, .78 * s, .05 * s, 0, 0, TAU); g.fill(); // the shadow, the sun high over the track
      g.fillStyle = INK; HORSE(g, v.u, x, eg.gy, s);
    },
    /** 1.12 b414: which flaps frame e changes: the frame drawn small, each flap's piece of it summed up as a number, so a flap
     *  turns only where the horse moves through it and the clatter runs with its legs */
    eggSig(eg, e) {
      if (eg.sig[e]) return eg.sig[e];
      const { lo, loX } = eg; loX.setTransform(1, 0, 0, 1, 0, 0); loX.clearRect(0, 0, lo.width, lo.height); loX.setTransform(.25, 0, 0, .25, 0, 0); if (e > 0) S.eggInk(loX, eg, e);
      const d = loX.getImageData(0, 0, lo.width, lo.height).data, out = new Uint32Array(eg.fl.length);
      eg.lr.forEach(([x0, y0, x1, y1], b) => { let h = 0; for (let y = y0; y < Math.min(y1, lo.height); y++) for (let x = x0; x < Math.min(x1, lo.width); x++) h = Math.imul(h ^ d[(y * lo.width + x) * 4 + 3], 16777619) >>> 0; out[b] = h; });
      return eg.sig[e] = out;
    },
    /** 1.12 b414: frame e as the band's flaps show it: the sheet's faces with the frame printed on them (the few made last
     *  are kept, so a flap turning from one frame to the next has both) */
    eggFace(eg, e) {
      if (e <= 0) return eg.sheet;
      let c = eg.cache.get(e); if (c) { eg.cache.delete(e); eg.cache.set(e, c); return c; }
      if (eg.cache.size >= 4) { const [k0, c0] = eg.cache.entries().next().value; eg.cache.delete(k0); c = c0; } else [c] = canvas(eg.sheet.width, eg.sheet.height);
      const x = c.getContext("2d"), { print, pX } = eg; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "copy"; x.drawImage(eg.sheet, 0, 0); x.globalCompositeOperation = "source-over";
      pX.setTransform(1, 0, 0, 1, 0, 0); pX.fillStyle = "#fff"; pX.fillRect(0, 0, print.width, print.height); pX.setTransform(px, 0, 0, px, 0, 0); S.eggInk(pX, eg, e);
      x.save(); x.setTransform(px, 0, 0, px, 0, 0); x.clip(eg.clip); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "multiply"; x.drawImage(print, 0, 0); x.restore();
      eg.cache.set(e, c); return c;
    },
    /** 1.12 b414: a band flap at time T of the egg: the face it turns from, the one it turns to (-1 plain, 0 the sheet, then
     *  the frames), and how far through the fall */
    eggFlap(eg, b, i, T, I) {
      const f = eg.fl[b], ev = eg.ev, j = S.hash[i] * .03; let from = -1, to = -1, p = 0;
      if (T >= f.tin) {
        let e = 0; for (let k = 1; k < ev.length && ev[k].t <= T - j; k++) e = k; // the last frame put up, by this flap's clock
        if (T < f.tin + FE) { to = 0; p = (T - f.tin) / FE; }
        else if (T >= f.tout) { if (T < f.tout + FE) { from = e; p = (T - f.tout) / FE; } }
        else { from = to = e; if (e > 0 && T - j - ev[e].t < FE && S.eggSig(eg, e)[b] !== S.eggSig(eg, e - 1)[b]) { from = e - 1; p = (T - j - ev[e].t) / FE; } }
      }
      if (I < S.back[i] && (to >= 0 || p)) { const q = clamp((S.back[i] - I) / Math.min(.12, S.back[i] - .012)); if (q > 0) { from = to >= 0 ? to : from; to = -1; p = q < 1 ? q : 0; } } // the list in use: back to plain, in a scatter, as the loop lets go
      if (p <= 0 || p >= 1) { p = 0; from = to; }
      return [from, to, p];
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H, C, R, fw, fh, gap, ox, oy, faces, wx } = S; let moved = S.full;
      const on = I > .01, fin = F >= 0, Tb = fin ? F * 3.4 : on ? T : 0, plan = fin ? [[0, "burst", "out"], [1.9, "plain", "out"]] : PLAN;
      const egg = K.egg(P), eg = egg && on && !fin ? S.eggPlan(P) : null; if (!egg) S.ep = null; // 1.12 b414: the egg's pass plays the egg (its pictures let go after)
      const pl = fin || !(P > 0) || egg ? null : S.plan(P); // b381: a pass after the first plays its own changes (the finale is the same over any pass)
      for (let rr = 0; rr < R; rr++) for (let c = 0; c < C; c++) {
        const i = rr * C + c, x = (ox + c * (fw + gap) + fw / 2) / W, y = (oy + rr * (fh + gap) + fh / 2) / H;
        let a, b, p;
        if (eg) { // 1.12 b414: a flap in the egg's band shows its piece of the sheet or of the frame it last turned to, or turns
          const bi = eg.bd ? eg.at[i] : -1;
          if (bi >= 0) {
            const [f0, f1, pp] = S.eggFlap(eg, bi, i, T, I), key = pp ? "e" + f0 + "," + f1 + "," + Math.round(pp * 16) : f1 < 0 ? "0,0,0" : "q" + S.eggSig(eg, f1)[bi]; // at rest, a flap the frame leaves as it was isn't drawn again
            if (!S.full && S.drawn[i] === key) continue; S.drawn[i] = key; moved = true;
            const fx = ox + c * (fw + gap), fy = oy + rr * (fh + gap), hh = fh / 2, fb = eg.fl[bi]; wx.clearRect(fx - gap / 2, fy - gap / 2, fw + gap, fh + gap);
            const face = f => f < 0 ? [faces[0], 0, 0, faces[0].width, faces[0].height / 2] : [S.eggFace(eg, f), (fb.lx + gap / 2) * px, (fb.ly + gap / 2) * px, fw * px, fh * px / 2]; // a face, and where its top half is
            const B0 = face(f1); if (!pp) { wx.drawImage(B0[0], B0[1], B0[2], B0[3], B0[4] * 2, fx, fy, fw, fh); continue; }
            const A0 = face(f0);
            wx.drawImage(B0[0], B0[1], B0[2], B0[3], B0[4], fx, fy, fw, hh); wx.drawImage(A0[0], A0[1], A0[2] + A0[4], A0[3], A0[4], fx, fy + hh, fw, hh); /* behind the falling flap */
            if (pp < .5) { const k = Math.cos(pp * Math.PI); wx.drawImage(A0[0], A0[1], A0[2], A0[3], A0[4], fx, fy + hh - hh * k, fw, hh * k); wx.fillStyle = `rgba(20,38,27,${(pp * .18).toFixed(3)})`; wx.fillRect(fx, fy + hh - hh * k, fw, hh * k); }
            else { const k = -Math.cos(pp * Math.PI); wx.drawImage(B0[0], B0[1], B0[2] + B0[4], B0[3], B0[4], fx, fy + hh, fw, hh * k); wx.fillStyle = `rgba(20,38,27,${((1 - pp) * .18).toFixed(3)})`; wx.fillRect(fx, fy + hh, fw, hh * k); }
            continue;
          }
          a = b = 0; p = 0;
        }
        else if (!pl) [a, b, p] = S.flapAt(Tb, plan, i, x, y, 0);
        else { // the flap's own changes: it turns a tone every FLIP toward the latest, always forward, as far round as a reset asks
          let q = 0, qe = 0, t = 0; if (on) { for (let k = pl.off[i], e = k + pl.cnt[i]; k < e; k++) { const s = pl.es[k]; if (s > T) break; q = Math.min(qe, q + (s - t) / FLIP); t = s; const tg = pl.et[k] & 7, c0 = Math.ceil(q - 1e-6); qe = c0 + ((tg - c0) % NT + NT) % NT + (pl.et[k] >> 3) * NT; } q = Math.min(qe, q + (T - t) / FLIP); }
          if (on && I < S.back[i]) { const c0 = Math.ceil(q - 1e-6), home = c0 + ((NT - c0 % NT) % NT); q += (home - q) * clamp((S.back[i] - I) / Math.min(.12, S.back[i] - .012)); } // the list in use: the flaps flip back to plain, in a scatter, as the loop lets go
          const f0 = Math.floor(q + 1e-6); p = q - f0; if (p < 1e-4) p = 0; a = f0 % NT; b = p ? (a + 1) % NT : a;
        }
        const key = S.mask[i] ? "m" : a + "," + b + "," + Math.round(p * 16);
        if (!S.full && S.drawn[i] === key) continue; S.drawn[i] = key; moved = true;
        const fx = ox + c * (fw + gap), fy = oy + rr * (fh + gap), hh = fh / 2; wx.clearRect(fx - gap / 2, fy - gap / 2, fw + gap, fh + gap);
        if (S.mask[i]) { wx.fillStyle = TONE[0]; wx.fillRect(fx - gap / 2, fy - gap / 2, fw + gap, fh + gap); continue; } /* under the words the wall is page-plain, its gaps too */
        if (p <= 0) { wx.drawImage(faces[a], fx, fy, fw, fh); continue; }
        if (pl) { wx.drawImage(S.flips[a][Math.round(p * 16)], fx, fy, fw, fh); continue; } // b381: a pass after the first lays its flips from the ones drawn once
        const A0 = faces[a], B0 = faces[b], sy = A0.height / 2;
        wx.drawImage(B0, 0, 0, B0.width, sy, fx, fy, fw, hh); wx.drawImage(A0, 0, sy, A0.width, sy, fx, fy + hh, fw, hh); /* behind the falling flap */
        if (p < .5) { const k = Math.cos(p * Math.PI); wx.drawImage(A0, 0, 0, A0.width, sy, fx, fy + hh - hh * k, fw, hh * k); wx.fillStyle = `rgba(20,38,27,${(p * .18).toFixed(3)})`; wx.fillRect(fx, fy + hh - hh * k, fw, hh * k); } /* the last tone's top, falling */
        else { const k = -Math.cos(p * Math.PI); wx.drawImage(B0, 0, sy, B0.width, sy, fx, fy + hh, fw, hh * k); wx.fillStyle = `rgba(20,38,27,${((1 - p) * .18).toFixed(3)})`; wx.fillRect(fx, fy + hh, fw, hh * k); } /* the next tone's bottom, coming down */
      }
      S.full = false;
      if (moved) { g.clearRect(0, 0, W, H); g.drawImage(S.wall, 0, 0, W, H); } /* no flap has moved: the screen already shows the wall */
    },
  };
  return S;
}
