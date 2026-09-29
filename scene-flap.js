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
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H, C, R, fw, fh, gap, ox, oy, faces, wx } = S; let moved = S.full;
      const on = I > .01, fin = F >= 0, Tb = fin ? F * 3.4 : on ? T : 0, plan = fin ? [[0, "burst", "out"], [1.9, "plain", "out"]] : PLAN;
      const pl = fin || !(P > 0) ? null : S.plan(P); // b381: a pass after the first plays its own changes (the finale is the same over any pass)
      for (let rr = 0; rr < R; rr++) for (let c = 0; c < C; c++) {
        const i = rr * C + c, x = (ox + c * (fw + gap) + fw / 2) / W, y = (oy + rr * (fh + gap) + fh / 2) / H;
        let a, b, p;
        if (!pl) [a, b, p] = S.flapAt(Tb, plan, i, x, y, 0);
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
