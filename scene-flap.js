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
//
// 1.12 b423: the long day's hour eggs. Once an hour of the list left alone (K.long), the wall shows a film, printed
// across the flaps clear of the words the way the horse is, each frame a flip, and only the flaps a frame changes turn,
// none more than three times a second. The first hour's, and every odd one's: A Trip to the Moon, 1902. The man in the
// moon comes up out of the open part of the wall, small and far off, and nearer, frame by frame, asleep; he wakes, and
// looks round; Méliès's shell comes across the wall from its edge on a curving flight, its smoke dotted behind it, and
// lands in his eye; he screws up his face, the cream running down his cheek, holds it — then opens the other eye, winks,
// and the film irises out, the wall plain from the edges in to his face. The second hour's, and every even one's: the
// station clock. The open part of the wall clatters round, like a hand going round its dial, into Hilfiker's railway
// clock — batons, no numbers — both hands at twelve; they step round together to the time it really is, an hour and
// five minutes at a step; the second hand comes on and ticks up to the twelve, waits there as his did, and the minute
// hand jumps on to the minute it now is; then the face clatters round to plain again. The clock reads the time once,
// when its pass comes up (the one thing on the wall that isn't dealt from the pass alone). With no room clear of the
// words for the moon or the clock, the wall rests plain all pass, as it does for the horse.
//
// 1.12 b443: the crown. In the sixth hour of the list left alone, and every sixth after (K.long 3), the wall plays the
// Lumières' train: L'Arrivée d'un train en gare de La Ciotat, 1896. It clatters over, out from the far end of the line,
// into a printed frame of the station: the far platform with its lamps and the people waiting, the station's wall behind
// them, the hills, the track running away into the open wall below and beside the list. A speck and its plume appear far
// down the line; frame by frame, every frame a flip, the train comes on, braking all the way, and at the last rushes up
// — as the first audiences ducked — to stop with its engine's front filling the corner, steam rolling from its cylinders
// either side. Then the film runs out: the wall wipes back to plain from the left. The station and the train are drawn
// in perspective, every part of the engine a box or a drum, its wheels turning, so it grows as a real one would; a new
// frame comes every .36 seconds, so no flap turns more than three times a second; only the flaps the train and its steam
// cross are worked out again for each frame (the station is printed once); the flaps under the words stay plain.
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

  /* ---------------- 1.12 b423: the long day's hour eggs ---------------- */
  const HFE = .06; /* a flap's fall in an hour egg */
  /** the inks the films are printed in, laid over the flaps' cream as the horse is (multiplied), so each keeps its flap's
   *  light and shade: the moon's face, his shell and its smoke, the stars; the clock's face, its case and its hands */
  const MN = { disc: "#B0D7BA", rim: "#6CAE86", shade: "#96C8A3", deep: "#82BC93", crater: "#94C6A1", craterHi: "#DDEFE0", light: "#D6ECDA", ink: "#1D6141", mid: "#4A996D", eye: "#FBFDF9", goo: "#FFFFFF", shell: "#2A7149", shellHi: "#A6D3B4", smoke: "#E6F2E7", star: "#3A8A5E" };
  const CK = { face: "#ECF3E9", case: "#2E7A52", caseHi: "#5FA97F", baton: "#2A6E4A", hand: "#24603F", sec: "#4FA474", hub: "#24603F" };
  /** the man in the moon, Méliès's, at (cx, cy), radius r: `ex` his face — `lid` [near, far] eyes 0 shut … 1 open, 1.3
   *  wide; `look` where his eyes turn; `mouth` 0 at peace, 1 an O, 2 a grimace, 3 a crooked smile; `brow` how far they
   *  rise; `hit` the shell in his near eye (its angle `ang`, the `splash` round it, the `goo` run down his cheek), the
   *  other eye screwed up (`squint`) or winking (`wink`); `mir`: the near eye on his left (the shell came from the right).
   *  Drawn in his own unit, y down, the near eye on the viewer's left: a plaster face, lit from the upper left, as his was */
  function moonFace(g, cx, cy, r, ex) {
    const m = ex.mir ? -1 : 1, L = ex.lid || [1, 1], lk = ex.look || [0, 0], br = ex.brow || [0, 0];
    g.save(); g.translate(cx, cy); g.scale(r * m, r); g.lineCap = "round"; g.lineJoin = "round";
    const P = (pts, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    const Q = (x0, y0, qx, qy, x1, y1, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(qx, qy, x1, y1); g.stroke(); };
    const O = (x, y, rx, ry, col, rot = 0) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
    // the disc, a crescent of shade on its lower right, its rim
    O(0, 0, 1, 1, MN.disc);
    g.save(); g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.clip(); g.fillStyle = MN.shade; g.beginPath(); g.rect(-1.2, -1.2, 2.4, 2.4); g.arc(-.16, -.15, 1.02, 0, TAU, true); g.fill("evenodd");
    // craters round the edge, clear of his face, each lit on its far rim
    for (const [x, y, s] of [[-.58, -.66, .13], [-.86, -.16, .09], [.62, -.64, .11], [.86, .1, .08], [-.76, .46, .11], [.48, .8, .09], [-.22, -.88, .07], [.22, -.9, .055], [-.4, .86, .065], [.88, -.32, .055], [.74, .52, .06]]) {
      O(x, y, s, s * .82, MN.crater, .4); g.strokeStyle = MN.craterHi; g.lineWidth = .028; g.beginPath(); g.ellipse(x + s * .14, y + s * .12, s * .9, s * .72, .4, Math.PI * .1, Math.PI * .95); g.stroke(); }
    g.restore();
    g.strokeStyle = MN.rim; g.lineWidth = .06; g.beginPath(); g.arc(0, 0, .97, 0, TAU); g.stroke();
    // the planes of his face: the brow, the cheeks, the chin lit; the eyes deep in their sockets; the shadow under the cheekbones
    O(0, -.58, .42, .15, MN.light); O(-.46, .15, .22, .17, MN.light, -.3); O(.46, .15, .22, .17, MN.light, .3); O(0, .76, .17, .07, MN.light);
    O(-.36, -.16, .25, .17, MN.shade); O(.36, -.16, .25, .17, MN.shade);
    O(-.5, .38, .14, .08, MN.shade, -.5); O(.5, .38, .14, .08, MN.shade, .5);
    Q(-.17, .21, -.34, .3, -.37, .52, .045, MN.mid); Q(.17, .21, .34, .3, .37, .52, .045, MN.mid); // the folds from his nose to his mouth
    Q(-.17, .72, 0, .8, .17, .72, .04, MN.mid); // his chin
    // his nose: its shaded side, the ridge, the round of its tip, the nostrils
    g.fillStyle = MN.deep; g.beginPath(); g.moveTo(-.02, -.24); g.quadraticCurveTo(-.13, -.02, -.17, .15); g.quadraticCurveTo(-.12, .23, -.02, .2); g.quadraticCurveTo(-.04, 0, -.02, -.24); g.fill();
    Q(.03, -.25, .12, -.02, .13, .13, .045, MN.mid); Q(-.17, .14, -.21, .21, -.13, .24, .045, MN.ink); Q(.15, .13, .2, .21, .12, .24, .045, MN.ink); O(-.06, .22, .045, .025, MN.ink, .3); O(.07, .22, .045, .025, MN.ink, -.3); // the wings of his nose, the nostrils
    const eye = (sx, open, look, wink, squint) => { // one eye: the lid, the white and the pupil, or shut
      const x = sx * .36, y = -.17;
      if (squint) { Q(x - .19, y + .03, x, y - .1, x + .19, y + .04, .065, MN.ink); for (let k = 0; k < 3; k++) P([[x + sx * (.22 + k * .01), y - .05 + k * .065], [x + sx * (.34 + k * .02), y - .1 + k * .09]], .035, MN.ink); return; } // screwed up tight, its crow's feet
      if (wink) { Q(x - .18, y - .02, x, y + .11, x + .18, y - .02, .065, MN.ink); return; } // shut, smiling
      if (open <= .05) { Q(x - .19, y, x, y + .08, x + .19, y, .06, MN.ink); Q(x - .16, y + .06, x, y + .13, x + .15, y + .06, .025, MN.mid); return; } // asleep
      const h = .11 * open; O(x, y, .18, h, MN.eye);
      g.save(); g.beginPath(); g.ellipse(x, y, .18, h, 0, 0, TAU); g.clip(); O(x + look[0] * .075, y + look[1] * .045, .085, .085, MN.ink); O(x + look[0] * .075 + .03, y + look[1] * .045 - .03, .026, .026, MN.eye); g.restore();
      g.strokeStyle = MN.ink; g.lineWidth = .06; g.beginPath(); g.ellipse(x, y, .18, h, 0, Math.PI * 1.02, Math.PI * 1.98); g.stroke(); // the upper lid
      g.lineWidth = .025; g.beginPath(); g.ellipse(x, y, .18, h, 0, Math.PI * .12, Math.PI * .88); g.stroke(); // the lower
    };
    const hit = ex.hit;
    if (!hit) eye(-1, L[0], lk, false, false);
    eye(1, L[1], lk, ex.wink, ex.squint);
    // the brows: up with surprise; the far one knotted with the pain
    { const b0 = br[0], b1 = br[1], k = ex.squint ? 1 : 0;
      Q(-.58, -.37 - b0 * .07, -.38, -.52 - b0 * .1, -.16, -.41 - b0 * .07, .075, MN.ink);
      Q(.16, -.41 - b1 * .07 + k * .09, .38, -.52 - b1 * .1 + k * .02, .58, -.37 - b1 * .07 - k * .09, .075, MN.ink); }
    // the mouth: at peace, an O, clenched in a grimace, or a crooked smile
    const mo = ex.mouth || 0;
    if (mo === 1) { O(0, .5, .11, .14, MN.ink); O(0, .55, .065, .065, MN.mid); }
    else if (mo === 2) { g.fillStyle = MN.ink; g.beginPath(); g.moveTo(-.38, .56); g.quadraticCurveTo(-.2, .4, 0, .46); g.quadraticCurveTo(.19, .4, .35, .5); g.quadraticCurveTo(.17, .6, 0, .58); g.quadraticCurveTo(-.2, .62, -.38, .56); g.fill();
      g.fillStyle = MN.eye; g.beginPath(); g.moveTo(-.25, .51); g.quadraticCurveTo(0, .45, .22, .49); g.lineTo(.2, .525); g.quadraticCurveTo(0, .495, -.23, .545); g.closePath(); g.fill(); } // clenched, his teeth set
    else if (mo === 3) { Q(-.31, .43, -.02, .6, .33, .38, .065, MN.ink); P([[.3, .35], [.38, .42]], .045, MN.ink); O(-.04, .62, .14, .035, MN.shade); }
    else { Q(-.32, .44, 0, .57, .32, .44, .065, MN.ink); O(0, .62, .15, .035, MN.shade); }
    if (hit) { // the shell in his near eye: the flesh puffed round where it went in, his cream run down his cheek, a splash
      const x = -.36, y = -.17, a = hit.ang;
      for (let k = 0; k < 3; k++) { g.strokeStyle = MN.mid; g.lineWidth = .03; g.beginPath(); g.arc(x, y, .19 + k * .075, a + 1.0, a + TAU - 1.0); g.stroke(); }
      if (hit.goo > 0) { const gl = hit.goo; g.fillStyle = MN.goo; g.strokeStyle = MN.mid; g.lineWidth = .025; g.beginPath(); g.moveTo(x - .16, y + .05);
        g.quadraticCurveTo(x - .22, y + .2 + .1 * gl, x - .13, y + .3 + .22 * gl); g.quadraticCurveTo(x - .08, y + .4 + .24 * gl, x - .04, y + .29 + .2 * gl); g.quadraticCurveTo(x - .02, y + .21, x + .04, y + .22 + .18 * gl); g.quadraticCurveTo(x + .08, y + .33 + .18 * gl, x + .12, y + .17 + .11 * gl); g.quadraticCurveTo(x + .15, y + .1, x + .13, y + .05); g.closePath(); g.fill(); g.stroke(); }
      O(x, y, .14, .12, MN.ink);
      shell(g, x + Math.cos(a) * .06, y + Math.sin(a) * .06, a, .62, true);
      g.fillStyle = MN.disc; g.strokeStyle = MN.mid; g.lineWidth = .03; g.beginPath(); g.ellipse(x + Math.cos(a) * .04, y + Math.sin(a) * .04, .07, .16, a, -Math.PI / 2, Math.PI / 2, true); g.fill(); g.stroke(); // his flesh round its nose
      if (hit.splash) for (let k = 0; k < 7; k++) { const an = a + Math.PI + (k - 3) * .45, d = .34 + (k % 3) * .08, rr = .045 - (k % 2) * .012; O(x + Math.cos(an) * d, y + Math.sin(an) * d, rr, rr, MN.goo); g.strokeStyle = MN.mid; g.lineWidth = .016; g.beginPath(); g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, rr, 0, TAU); g.stroke(); }
    }
    g.restore();
  }
  /** Méliès's shell: its nose at (x, y) when `inEye` (else its middle there), pointing at angle `a`, `len` long — a
   *  bullet, its band of rivets and two portholes, lit along its top. In the moon's unit when `inEye`, else in pixels */
  function shell(g, x, y, a, len, inEye) {
    const w = len * .34, back = inEye ? len : len * .55, front = inEye ? 0 : len * .45, nose = len * .36;
    g.save(); g.translate(x, y); g.rotate(a); g.lineJoin = "round";
    // it points along +x: the nose, an ogive, then the body back to its flat end
    g.fillStyle = MN.shell; g.beginPath(); g.moveTo(front, 0); g.bezierCurveTo(front - nose * .25, -w * .32, front - nose * .6, -w * .5, front - nose, -w * .5); g.lineTo(front - back, -w * .5); g.lineTo(front - back, w * .5); g.lineTo(front - nose, w * .5); g.bezierCurveTo(front - nose * .6, w * .5, front - nose * .25, w * .32, front, 0); g.fill();
    g.fillStyle = MN.shellHi; g.beginPath(); g.moveTo(front - nose * .3, -w * .2); g.bezierCurveTo(front - nose * .5, -w * .32, front - nose * .75, -w * .36, front - nose, -w * .36); g.lineTo(front - back + len * .04, -w * .36); g.lineTo(front - back + len * .04, -w * .22); g.lineTo(front - nose, -w * .22); g.bezierCurveTo(front - nose * .75, -w * .22, front - nose * .55, -w * .16, front - nose * .3, -w * .2); g.fill(); // the light along its top
    g.fillStyle = MN.ink; g.fillRect(front - nose - len * .02, -w * .5, len * .04, w); g.fillRect(front - back, -w * .5, len * .05, w); // the seam where the nose is screwed on, its flat end
    g.fillStyle = MN.shellHi; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(front - back + len * .11, -w * .33 + k * w * .22, len * .016, 0, TAU); g.fill(); } // a ring of rivets
    for (const f of [.5, .74]) { g.fillStyle = MN.eye; g.beginPath(); g.arc(front - len * f, w * .08, w * .21, 0, TAU); g.fill(); g.strokeStyle = MN.ink; g.lineWidth = len * .035; g.stroke(); } // the portholes
    g.restore();
  }
  /** Hilfiker's station clock: the case, the face, sixty batons and twelve heavy ones, the hands at `h` hours and `mi`
   *  minutes, and (if `s` isn't null) the second hand with its disc */
  function clockFace(g, cx, cy, r, h, mi, s) {
    g.save(); g.translate(cx, cy);
    g.fillStyle = CK.face; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.strokeStyle = CK.case; g.lineWidth = r * .07; g.beginPath(); g.arc(0, 0, r * .965, 0, TAU); g.stroke();
    g.strokeStyle = CK.caseHi; g.lineWidth = r * .012; g.beginPath(); g.arc(0, 0, r * .915, Math.PI * .95, Math.PI * 1.55); g.stroke(); // the light along the case's inner edge
    g.fillStyle = CK.baton; for (let k = 0; k < 60; k++) { g.save(); g.rotate(k / 60 * TAU); if (k % 5) g.fillRect(-r * .012, -r * .86, r * .024, r * .085); else g.fillRect(-r * .036, -r * .86, r * .072, r * .25); g.restore(); }
    const hand = (ang, l0, l1, w0, w1, col) => { g.save(); g.rotate(ang); g.fillStyle = col; g.beginPath(); g.moveTo(-w0 / 2, l0); g.lineTo(-w1 / 2, -l1); g.lineTo(w1 / 2, -l1); g.lineTo(w0 / 2, l0); g.closePath(); g.fill(); g.restore(); };
    hand((h % 12) / 12 * TAU, r * .2, r * .62, r * .1, r * .08, CK.hand);
    hand(mi / 60 * TAU, r * .2, r * .86, r * .085, r * .06, CK.hand);
    if (s !== null) { const a = s / 60 * TAU; hand(a, r * .3, r * .6, r * .022, r * .018, CK.sec); g.save(); g.rotate(a); g.fillStyle = CK.sec; g.beginPath(); g.arc(0, -r * .62, r * .085, 0, TAU); g.fill(); g.restore(); }
    g.fillStyle = CK.hub; g.beginPath(); g.arc(0, 0, r * .045, 0, TAU); g.fill();
    if (s !== null) { g.fillStyle = CK.sec; g.beginPath(); g.arc(0, 0, r * .025, 0, TAU); g.fill(); }
    g.restore();
  }
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
    /** 1.12 b423: the room an hour egg has — the flaps clear of the words, below the bar's wash and above the footer's
     *  (no words known yet, in the lab: a list's usual place stands in, as for the horse); `room(x, y)` how far a point
     *  is from the nearest flap it may not use, or from the edge of that room */
    hourRoom() {
      const { C, R, fw, fh, gap, ox, oy, W, H, pr } = S, pw = fw + gap, ph = fh + gap, top = 128, bot = H - (pr ? 56 : 60); /* below the bar's wash, above the footer's */
      const lab = (c, rr) => { const y0 = oy + rr * ph, y1 = y0 + fh, x0 = ox + c * pw; return pr ? y1 > H * .3 && y0 < H * .66 : y1 > H * .24 && y0 < H * .71 && x0 < W * .82; }; // the seed list's place in the app
      /* the words' own flaps, as words() finds them, but for a line's tools: they show only while a line is pointed at,
         when the list is in use and the film has gone back to plain, so a film may play where they would be */
      const m2 = new Uint8Array(C * R); if (S.raw) for (const [x0, y0, x1, y1, kd] of S.raw) { if (kd === 2) continue; const c0 = Math.max(0, Math.floor((x0 - 6 - ox) / pw)), c1 = Math.min(C - 1, Math.floor((x1 + 6 - ox) / pw)), r0 = Math.max(0, Math.floor((y0 - 6 - oy) / ph)), r1 = Math.min(R - 1, Math.floor((y1 + 6 - oy) / ph)); for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) m2[rr * C + c] = 1; }
      const masked = (c, rr) => S.raw ? m2[rr * C + c] : lab(c, rr);
      const bad = []; for (let rr = 0; rr < R; rr++) for (let c = 0; c < C; c++) if (masked(c, rr)) bad.push([ox + c * pw - gap / 2, oy + rr * ph - gap / 2, ox + c * pw + fw + gap / 2, oy + rr * ph + fh + gap / 2]);
      const room = (x, y) => { let d = Math.min(x - 6, W - 6 - x, y - top, bot - y); for (const b of bad) { const dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]); if (dx < d && dy < d) d = Math.min(d, Math.hypot(dx, dy)); } return d; };
      const open = (x, y) => { if (y < top || y > bot || x < 0 || x > W) return false; const c = Math.floor((x - ox + gap / 2) / pw), rr = Math.floor((y - oy + gap / 2) / ph); return c < 0 || rr < 0 || c >= C || rr >= R || !masked(c, rr); }; // the flap under a point (or the gap beside it) free
      /** the biggest round picture that fits: its centre and radius (no bigger than `cap`), the side `lean` prefers */
      /* how much of the stage's wash over the list's band lies on a point (scenes.js: an ellipse 120 % by 72 % at 42 %, 40 %):
         a picture there shows that much fainter */
      const wash = (x, y) => { const d = Math.hypot((x - W * .42) / (W * 1.2), (y - H * .4) / (H * .72)); return d < .52 ? .62 - .22 * d / .52 : d < .82 ? .4 * (1 - (d - .52) / .3) : 0; };
      const disc = cap => { let best = null, bs = -1; for (let y = top + 20; y <= bot - 20; y += 12) for (let x = 20; x <= W - 20; x += 12) { const rr = Math.min(cap, room(x, y)); if (rr < 20) continue; const sc = rr * Math.pow(1 - wash(x, y), 1.5) + (pr ? 1 - Math.abs(x / W - .5) : x / W) * 6; if (sc > bs) { bs = sc; best = [x, y, rr]; } } return best; }; // as big and as clear of the wash as it can be; a phone's in the middle, a wide screen's to the right
      return { masked, room, open, disc, wash, top, bot };
    },
    /** 1.12 b423: A Trip to the Moon — where the moon goes, the shell's flight to his eye, and every frame */
    moonFilm(P, rm) {
      const { W, H, pr, fw, gap } = S, d = rm.disc(pr ? W * .31 : H * .21);
      if (!d || d[2] < (pr ? 70 : 80)) return null; // no room for him: the wall rests plain
      const [mx, my] = d, mr = d[2] - 4, r = K.deal(P, 41);
      // the flight: in from past an edge on a gentle curve to his near eye, through as much open wall as it can find
      let fl = null, fs = -1;
      for (const mir of [false, true]) { const qx = mx + (mir ? .36 : -.36) * mr, qy = my - .17 * mr;
        const ents = []; for (let y = -40; y <= H + 40; y += 30) ents.push([mir ? W + 70 : -70, y]); for (let x = 0; x <= W; x += 40) { if (mir ? x > qx : x < qx) { ents.push([x, -70]); ents.push([x, H + 70]); } }
        for (const [ex, ey] of ents) for (const bend of [-.22, 0, .22]) {
          const dx = qx - ex, dy = qy - ey, dl = Math.hypot(dx, dy), cx = (ex + qx) / 2 - dy / dl * bend * dl, cy = (ey + qy) / 2 + dx / dl * bend * dl;
          const at = t => [(1 - t) * (1 - t) * ex + 2 * (1 - t) * t * cx + t * t * qx, (1 - t) * (1 - t) * ey + 2 * (1 - t) * t * cy + t * t * qy];
          let on = 0, ok = 0, len = 0, inside = 0, prev = null; for (let k = 0; k <= 60; k++) { const p = at(k / 60); if (p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H) { on++; if (rm.open(p[0], p[1])) ok++; if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p; } else prev = null; if (k < 52 && Math.hypot(p[0] - mx, p[1] - my) < mr) inside++; }
          const [tx, ty] = [qx - cx, qy - cy], ang = Math.atan2(ty, tx), side = Math.abs(Math.cos(ang)); // its last approach: from the side reads best
          if (on < 8) continue; const frac = ok / on, sc = Math.min(len, mr * 7) * Math.pow(frac, 8) * (.55 + .45 * side) * (inside > 4 ? .3 : 1);
          if (sc > fs) { fs = sc; fl = { mir, ex, ey, cx, cy, qx, qy, len, at, frac }; } } }
      if (!fl || fl.frac < .72 || fl.len < mr * 1.1) return null;
      // the stars, a few, in the open wall round him and off his flight
      const stars = []; for (let k = 0; k < 40 && stars.length < (pr ? 6 : 10); k++) { const x = r() * W, y = rm.top + r() * (rm.bot - rm.top); if (!rm.open(x, y) || Math.hypot(x - mx, y - my) < mr * 1.25 || Math.hypot(x - mx, y - my) > mr * (pr ? 3 : 4.2)) continue; let near = false; for (let t = 0; t <= 1; t += .05) { const p = fl.at(t); if (Math.hypot(p[0] - x, p[1] - y) < 34) near = true; } if (!near && !stars.some(s => Math.hypot(s[0] - x, s[1] - y) < 70)) stars.push([x, y, .7 + r() * .6]); }
      // the frames: [time, what] — he comes nearer, asleep; wakes; looks; the shell's flight a frame at a time; the hit
      const ev = [{ t: 0 }], F = (t, o) => ev.push(Object.assign({ t }, o)), calm = { lid: [0, 0], mouth: 0 };
      F(.7, { s: .34, ex: calm, wave: "near" }); F(1.25, { s: .56, ex: calm }); F(1.8, { s: .78, ex: calm }); F(2.35, { s: 1, ex: calm, stars: 1 });
      F(3.1, { s: 1, ex: { lid: [1, 1], mouth: 0 }, stars: 1 }); const lookTo = [fl.mir ? 1 : -1, fl.ey < my - mr ? -.6 : fl.ey > my + mr ? .6 : 0];
      F(3.7, { s: 1, ex: { lid: [1, 1], mouth: 0, look: lookTo }, stars: 1 });
      const sl = .78 * mr, step = Math.max(1.5 * (fw + gap), sl * .95), n = Math.max(4, Math.round(fl.len / step)), dur = Math.max(n * .23, clamp(fl.len / (pr ? 260 : 470), 1.3, 3.1)), t0 = 4.0; /* a frame a shell's length on: no flap sees it more than twice */ // the shell as long as half his face
      const along = []; { let L = 0, prev = fl.at(0); along.push([0, 0]); for (let k = 1; k <= 200; k++) { const p = fl.at(k / 200); L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); along.push([k / 200, L]); prev = p; } } // arc length → t
      const tOf = s => { const L = along[200][1] * s; let k = 1; while (k < 200 && along[k][1] < L) k++; const a = along[k - 1], b = along[k]; return a[0] + (b[0] - a[0]) * ((L - a[1]) / ((b[1] - a[1]) || 1)); };
      const tEnd = 1 - (sl * .5) / (along[200][1] || 1); // he stops where his nose is in the eye
      for (let k = 1; k <= n; k++) { const q = tOf(Math.min(tEnd, k / n * tEnd + (1 - tEnd) * 0)), tt = t0 + dur * k / (n + 1); F(tt, { s: 1, ex: { lid: [k > n - 2 ? 1.3 : 1, k > n - 2 ? 1.3 : 1], mouth: k > n - 2 ? 1 : 0, look: lookTo, brow: k > n - 2 ? [1, 1] : [0, 0] }, stars: 1, fly: q, trail: q }); }
      const tHit = t0 + dur + .12, ang = (() => { const p = fl.at(tEnd), p0 = fl.at(tEnd - .02); const a = Math.atan2(p[1] - p0[1], p[0] - p0[0]); return fl.mir ? Math.PI - a : a; })();
      F(tHit, { s: 1, ex: { hit: { ang, splash: 1, goo: 0 }, squint: 1, mouth: 2, mir: fl.mir }, stars: 1, trail: tEnd });
      F(tHit + .5, { s: 1, ex: { hit: { ang, splash: 0, goo: .5 }, squint: 1, mouth: 2, mir: fl.mir }, stars: 1, trail: tEnd });
      F(tHit + 1.05, { s: 1, ex: { hit: { ang, splash: 0, goo: 1 }, squint: 1, mouth: 2, mir: fl.mir }, stars: 1, trail: tEnd * .55 });
      F(tHit + 1.6, { s: 1, ex: { hit: { ang, splash: 0, goo: 1.3 }, squint: 1, mouth: 2, mir: fl.mir }, stars: 1, trail: 0 });
      F(10.0, { s: 1, ex: { hit: { ang, splash: 0, goo: 1.3 }, lid: [1, 1], mouth: 3, look: [0, 0], mir: fl.mir }, stars: 1 });
      F(10.65, { s: 1, ex: { hit: { ang, splash: 0, goo: 1.3 }, wink: 1, mouth: 3, mir: fl.mir }, stars: 1 });
      F(11.3, { s: 1, ex: { hit: { ang, splash: 0, goo: 1.3 }, lid: [1, 1], mouth: 3, look: [0, 0], mir: fl.mir }, stars: 1 });
      F(12.1, { wave: "iris" }); // the iris closes on him: the wall plain from the edges in, his face the last to go
      const far = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - mx, y - my)));
      let x0 = mx - mr, y0 = my - mr, x1 = mx + mr, y1 = my + mr; for (let t = 0; t <= 1; t += .02) { const p = fl.at(t); x0 = Math.min(x0, p[0] - sl); y0 = Math.min(y0, p[1] - sl); x1 = Math.max(x1, p[0] + sl); y1 = Math.max(y1, p[1] + sl); } for (const s of stars) { x0 = Math.min(x0, s[0] - 12); y0 = Math.min(y0, s[1] - 12); x1 = Math.max(x1, s[0] + 12); y1 = Math.max(y1, s[1] + 12); }
      return { box: [x0, y0, x1, y1], ev, mx, my, mr, fl, sl, stars,
        delay: (e, x, y, h) => e.wave === "near" ? Math.hypot(x - mx, y - my) / mr * .25 + h * .03 : e.wave === "iris" ? (1 - Math.hypot(x - mx, y - my) / far) * 1.1 + h * .04 : h * .03,
        ink(g, e) { // frame e, in the page's pixels
          if (e.stars) for (const [x, y, s] of stars) { g.fillStyle = MN.star; g.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = (k % 2 ? 2.2 : 8) * s; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
          if (e.trail) { const gap2 = (pr ? 15 : 19) / (fl.len || 1), back2 = e.fly !== undefined ? sl * .62 / (fl.len || 1) : 0; g.fillStyle = MN.mid; for (let q = gap2; q < e.trail - back2; q += gap2) { const p = fl.at(q); if (Math.hypot(p[0] - mx, p[1] - my) < mr + 6) continue; g.beginPath(); g.arc(p[0], p[1], pr ? 2.6 : 3.2, 0, TAU); g.fill(); } } // its flight, dotted behind it (each dot where it was put)
          if (e.s) moonFace(g, mx, my, mr * e.s, e.ex);
          if (e.fly !== undefined) { const p = fl.at(e.fly), p0 = fl.at(Math.max(0, e.fly - .01)); shell(g, p[0], p[1], Math.atan2(p[1] - p0[1], p[0] - p0[0]), sl, false); }
        } };
    },
    /** 1.12 b423: the station clock — where it goes, and every frame: the face clattering round, the hands stepping to
     *  the time (read once, as the pass comes up), the second hand ticking up to twelve, its wait, the minute's jump */
    clockFilm(P, rm, T) {
      const { W, H, pr } = S, d = rm.disc(pr ? W * .4 : H * .26);
      if (!d || d[2] < (pr ? 72 : 84)) return null;
      const [cx, cy] = d, cr = d[2] - 4, now = Date.now() - T * 1000; // the moment the pass began
      const at = new Date(now + 10.9 * 1000), hh = at.getHours() % 12, mm = at.getMinutes(), m0 = (mm + 59) % 60, h0 = m0 === 59 ? (hh + 11) % 12 : hh; // the time it shows: a minute short of the minute it is when the hand jumps
      const ev = [{ t: 0 }], F = (t, o) => ev.push(Object.assign({ t }, o));
      F(.75, { h: 0, m: 0, s: null, wave: "round" }); // the face, both hands at twelve
      const hs = h0 + m0 / 60, ns = Math.max(Math.ceil(hs - .001), Math.ceil(m0 / 5)), st = .36; // a step: an hour on the hour hand, five minutes on the minute hand
      for (let k = 1; k <= ns; k++) F(2.1 + k * st, { h: Math.min(hs, k), m: Math.min(m0, k * 5), s: null });
      const top = 9.4, ticks = clamp(Math.floor(top - (2.1 + ns * st) - .5), 2, 5);
      for (let k = ticks; k >= 1; k--) F(top - k, { h: hs, m: m0, s: 60 - k });
      F(top, { h: hs, m: m0, s: 0 }); // at twelve, and it waits
      F(top + 1.5, { h: hh + mm / 60, m: mm, s: 0 }); // the minute hand jumps
      F(top + 2.3, { h: hh + mm / 60, m: mm, s: 1 });
      F(12.15, { wave: "round" }); // and the face clatters round to plain again
      return { box: [cx - cr, cy - cr, cx + cr, cy + cr], ev, cx, cy, cr,
        delay: (e, x, y, h) => e.wave === "round" ? ((Math.atan2(x - cx, cy - y) / TAU + 1) % 1) * 1.15 + h * .03 : h * .03,
        ink(g, e) { if (e.m !== undefined) clockFace(g, cx, cy, cr, e.h, e.m, e.s); } };
    },
    /** 1.12 b443: the crown — L'Arrivée d'un train en gare de La Ciotat, 1896. The station seen from the platform, the
     *  track running away to the horizon in the open part of the wall: the far platform with its lamps and the people
     *  waiting, the station's wall behind them, the hills. The train comes in from the horizon, a speck and its plume,
     *  nearer frame by frame, slowing as it comes, and at the last rushes up to fill the open wall — as the audience
     *  ducked — and stops, hissing steam; then the film ends, the wall wiping back to plain. Every frame drawn from the
     *  scene in perspective, the train's every part a box or a drum, so it grows as a real one would */
    trainFilm(P, rm) {
      const { W, H, pr, C, R, fw, fh, gap, ox, oy } = S, pw = fw + gap, ph = fh + gap, eh = 1.5, zEnd = 6;
      // the open part: the wall beside the list (its right edge) and below it (its foot). The camera stands on the near
      // platform well back from the track, so the train comes in across the open wall below the list and stops with its
      // front filling the corner beside it
      let edge = 0, foot = 0; for (let rr = 0; rr < R; rr++) for (let c = 0; c < C; c++) if (rm.masked(c, rr)) { const y0 = oy + rr * ph, y1 = y0 + fh; if (y1 < 118 || y0 > H - 70) continue; edge = Math.max(edge, ox + c * pw + fw); foot = Math.max(foot, y1); }
      let s, vpX, vpY, tx; // the train's scale when it stops (px a metre), the vanishing point, how far the track is from the camera
      if (!pr) { const colL = (edge || W * .82) + 16; s = Math.max(40, Math.min((W - colL) * 1.3 / 3.0, (H + 12 - 128) / 4.6)); vpY = H + 12 - 1.5 * s; tx = 8; vpX = colL - s * (tx - 1.5); if (vpX < W * .25) { vpX = W * .25; tx = 1.5 + (colL - vpX) / s; } } /* it stops with its front in the corner beside the list, a little of it past the edge and the foot of the page, as a film's would be */
      else { const top = (foot || H * .66) + 14; s = Math.max(28, Math.min((H + 10 - top) / 4.6, W * 1.25 / 3.0)); vpY = H + 10 - 1.5 * s; tx = 5; vpX = W * 1.08 - 3 * s - s * (tx - 1.5); if (vpX < 16) { vpX = 16; tx = 1.5 + (W * 1.08 - 3 * s - vpX) / s; } }
      const f = zEnd * s, Pj = (x, y, z) => [vpX + f * x / z, vpY - f * (y - eh) / z];
      const ev = [{ t: 0 }], F2 = (t, o) => ev.push(Object.assign({ t }, o));
      const T0 = 2.0, dt = .36, N = 17, T1 = T0 + dt * (N - 1); // the approach: a frame every .36 s, no flap turning more than three times a second
      F2(.6, { z: 170, wave: "in" });
      for (let k = 0; k < N; k++) { const q = k / (N - 1); F2(T0 + k * dt, { z: zEnd + (170 - zEnd) * Math.pow(1 - q, 2.0), tt: T0 + k * dt }); } // braking all the way in: far off for a while, then all at once
      for (let t = T1 + dt; t < 11.4; t += dt) F2(t, { z: zEnd, tt: t, hiss: t - T1 }); // it stands, steam pouring from its cylinders
      F2(11.75, { wave: "out" });
      // the station's furniture, fixed: the lamps on the far platform, the people waiting, the windows in the wall
      const r = K.deal(P, 51), folk = []; for (let k = 0; k < (pr ? 7 : 10); k++) folk.push({ x: tx + 2.3 + r() * 3.2, z: 7 + k * 3.6 + r() * 2.5, h: 1.55 + r() * .3, kind: Math.floor(r() * 4) });
      const TONES = { sky: "#E6F0E3", hill: "#C9DFCB", hill2: "#B5D3BC", wall: "#ADCDB5", wallLo: "#97C1A2", win: "#7DAF8E", roof: "#5E9A74", plat: "#BCD8C1", platE: "#5F9B75", bed: "#A3C9AD", sleeper: "#78A887", rail: "#3D7B57", people: "#2D6649", lamp: "#3D7B57", glass: "#F2F8F0", dark: "#1D4D35", mid: "#2C6448", side: "#3B7856", hi: "#7DB592", win2: "#CFE6D4", steam: "#FAFDF8", steamE: "#B9D7C0", grain: "#5E9A74" };
      let still = null; // the station without its train, printed once and laid under every frame
      const stillOn = g => { if (!still) { const [c, x] = canvas(Math.ceil(W * px), Math.ceil(H * px)); x.imageSmoothingEnabled = true; x.setTransform(px, 0, 0, px, 0, 0); station(x); still = c; } g.drawImage(still, 0, 0, W, H); };
      const drawScene = (g, e) => { stillOn(g); S.trainInk(g, e, Pj, f, tx, TONES, zEnd); }; // the station, and the train at e.z (its front's distance), as frame e of the film
      const station = g => {
        g.save(); g.lineJoin = "round"; g.lineCap = "round";
        const poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
        const quad = (a, b, c, d, col) => poly([Pj(...a), Pj(...b), Pj(...c), Pj(...d)], col);
        g.fillStyle = TONES.sky; g.fillRect(0, 0, W, H);
        // the hills on the horizon, two ranges
        for (const [col, amp, fr, off] of [[TONES.hill, .06, 3.1, 0], [TONES.hill2, .035, 5.3, 1.7]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, vpY + 2); for (let x = 0; x <= W; x += 12) g.lineTo(x, vpY - H * amp * (.55 + .45 * Math.sin(x / W * fr * Math.PI + off)) * (.4 + .6 * Math.min(1, Math.abs(x - vpX) / (W * .25)))); g.lineTo(W, vpY + 2); g.closePath(); g.fill(); }
        const ZF = 3, ZB = 400;
        // the ground between: the track bed, and the near platform on the left of it
        const nE = tx - 1.35, fE = tx + 1.5, wl = tx + 7.7; // the near platform's edge, the far one's, the station's wall
        quad([-30, 0, ZF], [60, 0, ZF], [60, 0, ZB], [-30, 0, ZB], TONES.bed);
        quad([-30, .9, ZF], [nE, .9, ZF], [nE, .9, ZB], [-30, .9, ZB], TONES.plat); g.strokeStyle = TONES.glass; g.lineWidth = Math.max(1, f * .08 / 10); g.beginPath(); g.moveTo(...Pj(nE, .9, ZF)); g.lineTo(...Pj(nE, .9, ZB)); g.stroke(); // its white edge
        // the station's wall behind the far platform: its windows and doors, its eaves; the far platform, its edge, its lamps
        quad([wl, .9, ZF], [wl, 5.2, ZF], [wl, 5.2, ZB], [wl, .9, ZB], TONES.wall);
        for (let z = 6; z < 160; z += 5.5) { quad([wl - .02, 1.4, z], [wl - .02, 3.6, z], [wl - .02, 3.6, z + 2.2], [wl - .02, 1.4, z + 2.2], (z / 5.5 | 0) % 3 ? TONES.win : TONES.wallLo); }
        quad([wl, 5.2, ZF], [wl - .9, 5.6, ZF], [wl - .9, 5.6, ZB], [wl, 5.2, ZB], TONES.roof); // the eaves
        quad([fE, .9, ZF], [wl, .9, ZF], [wl, .9, ZB], [fE, .9, ZB], TONES.plat); quad([fE, 0, ZF], [fE, .9, ZF], [fE, .9, ZB], [fE, 0, ZB], TONES.platE);
        for (let z = 7; z < 130; z += 9) { const a = Pj(tx + 2.2, .9, z), b = Pj(tx + 2.2, 4.0, z), w = Math.max(.6, f * .09 / z); g.strokeStyle = TONES.lamp; g.lineWidth = w; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); const lr = Math.max(.8, f * .22 / z); g.fillStyle = TONES.lamp; g.fillRect(b[0] - lr, b[1] - lr * 1.6, lr * 2, lr * 1.8); g.fillStyle = TONES.glass; g.fillRect(b[0] - lr * .6, b[1] - lr * 1.3, lr * 1.2, lr * 1.2); }
        // the people waiting on the far platform: a coat or a long skirt, a hat, the nearest the biggest
        for (const p of folk.slice().sort((a, b) => b.z - a.z)) { const k = f / p.z, [fx, fy] = Pj(p.x, .9, p.z), h = p.h * k, w = h * .26; g.fillStyle = TONES.people;
          g.beginPath(); if (p.kind % 2) { g.moveTo(fx - w * .75, fy); g.lineTo(fx - w * .32, fy - h * .62); g.lineTo(fx + w * .32, fy - h * .62); g.lineTo(fx + w * .75, fy); } else { g.moveTo(fx - w * .38, fy); g.lineTo(fx - w * .45, fy - h * .66); g.lineTo(fx + w * .45, fy - h * .66); g.lineTo(fx + w * .38, fy); } g.closePath(); g.fill(); // the skirt, or the coat to the knees
          g.beginPath(); g.ellipse(fx, fy - h * .74, w * .5, h * .14, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(fx, fy - h * .88, w * .26, 0, TAU); g.fill(); // the shoulders, the head
          g.beginPath(); if (p.kind === 0) g.rect(fx - w * .26, fy - h * 1.06, w * .52, h * .16); else if (p.kind === 2) g.ellipse(fx, fy - h * .96, w * .55, h * .035, 0, 0, TAU); else g.ellipse(fx, fy - h * .97, w * .5, h * .06, 0, 0, TAU); g.fill(); // a top hat, a boater, a bonnet
          if (p.kind === 0) g.fillRect(fx - w * .45, fy - h * .91, w * .9, h * .03); }
        // the track: the sleepers, then the rails, running away to the horizon
        g.fillStyle = TONES.sleeper; for (let z = ZF; z < 120; z += .75) { const a = Pj(tx - 1.3, .08, z), b = Pj(tx + 1.3, .08, z), c = Pj(tx + 1.3, .08, z + .26), d = Pj(tx - 1.3, .08, z + .26); if (Math.abs(a[1] - c[1]) < .4) break; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.closePath(); g.fill(); }
        for (const dx of [-.72, .72]) quad([tx + dx - .04, .18, ZF], [tx + dx + .04, .18, ZF], [tx + dx + .04, .18, ZB], [tx + dx - .04, .18, ZB], TONES.rail);
        g.restore(); };
      /** where a frame's train and its steam can be: the box round them, seen from the platform */
      const region = e => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const x of [tx - 4.6, tx + 4.6]) for (const y of [-.4, 11.2]) for (const z of [Math.max(.8, e.z - .3), e.z + 44.5]) { const [a, b] = Pj(x, y, z); x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); }
        return [Math.max(0, x0 - 4), Math.max(0, y0 - 4), Math.min(W, x1 + 4), Math.min(H, y1 + 4)]; };
      return { box: [0, 0, W, H], ev, vp: [vpX, vpY], s, still: stillOn, region,
        delay: (e, x, y, h) => e.wave === "in" ? Math.hypot(x - vpX, y - vpY) / Math.hypot(W, H) * 1.6 + h * .03 : e.wave === "out" ? (x / W) * 1.3 + h * .03 : h * .03,
        ink(g, e) { if (e.z !== undefined) drawScene(g, e); } };
    },
    /** the train at frame e: its engine's front `e.z` metres off, every part a box or a drum seen from the platform,
     *  furthest first; its steam — the plume it trails from the chimney, and when it stands, the hiss from its cylinders */
    trainInk(g, e, Pj, f, tx, Q, zEnd) {
      const zf = e.z, poly = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
      const box = (x0, x1, y0, y1, z0, z1, side, front) => { if (z0 < .5) return; poly([Pj(x0, y0, z0), Pj(x0, y1, z0), Pj(x0, y1, z1), Pj(x0, y0, z1)], side); if (front) poly([Pj(x0, y0, z0), Pj(x1, y0, z0), Pj(x1, y1, z0), Pj(x0, y1, z0)], front); };
      const disc = (x, y, z, r, col) => { const [a, b] = Pj(x, y, z); g.fillStyle = col; g.beginPath(); g.arc(a, b, Math.max(.4, f * r / z), 0, TAU); g.fill(); };
      const ring = (x, y, z, r, col, w) => { const [a, b] = Pj(x, y, z); g.strokeStyle = col; g.lineWidth = Math.max(.5, f * w / z); g.beginPath(); g.arc(a, b, Math.max(.4, f * r / z), 0, TAU); g.stroke(); };
      const wheel = (x, zc, rad, col, rim) => { const pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; pts.push(Pj(x, rad + rad * Math.sin(a), zc + rad * Math.cos(a))); } poly(pts, col); g.strokeStyle = rim; g.lineWidth = Math.max(.5, f * .06 / zc); g.beginPath(); pts.forEach(([a, b], i) => i ? g.lineTo(a, b) : g.moveTo(a, b)); g.closePath(); g.stroke();
        const turn = (170 - zf) / rad; g.beginPath(); for (let k = 0; k < 8; k++) { const a = turn + k / 8 * TAU, [p, q] = Pj(x - .02, rad, zc), [p2, q2] = Pj(x - .02, rad + rad * .85 * Math.sin(a), zc + rad * .85 * Math.cos(a)); g.moveTo(p, q); g.lineTo(p2, q2); } g.stroke(); }; // its spokes, turning as it comes
      // the steam it trails: a puff from the chimney at every few metres it came, rising and spreading where the air left it
      const puffs = []; for (let k = 0; k < 10; k++) { const back = k * 4 + (zf % 4), age = back / 20 + .15; if (zf + back > 200) break; puffs.push([tx + .35 * Math.sin(k * 2.3) * age, 4.5 + 1.8 * age, zf + 1.1 + back, .45 + .8 * age, k]); } /* a puff every four metres it came, left where the air took it: rising and spreading behind it */
      // the coaches, the tender, the cab, then the boiler, back to front
      for (let k = 2; k >= 0; k--) { const z0 = zf + 12.5 + k * 10.4, z1 = z0 + 10; if (z0 > 400) continue; box(tx - 1.45, tx + 1.45, 1.0, 3.5, z0, z1, Q.side, Q.mid); box(tx - 1.45, tx + 1.45, 3.5, 3.85, z0 - .1, z1 + .1, Q.hi, Q.side); // the coach, its roof
        for (let w = 0; w < 7; w++) { const za = z0 + .8 + w * 1.3; poly([Pj(tx - 1.47, 2.0, za), Pj(tx - 1.47, 3.0, za), Pj(tx - 1.47, 3.0, za + .8), Pj(tx - 1.47, 2.0, za + .8)], Q.win2); } // its windows
        wheel(tx - 1.0, z0 + 1.6, .5, Q.dark, Q.mid); wheel(tx - 1.0, z1 - 1.6, .5, Q.dark, Q.mid); }
      box(tx - 1.3, tx + 1.3, .9, 3.0, zf + 8.2, zf + 12.1, Q.side, Q.mid); box(tx - 1.2, tx + 1.2, 3.0, 3.35, zf + 8.6, zf + 11.8, Q.dark, Q.dark); // the tender, its coal
      wheel(tx - 1.05, zf + 9.2, .5, Q.dark, Q.mid); wheel(tx - 1.05, zf + 11.1, .5, Q.dark, Q.mid);
      box(tx - 1.3, tx + 1.3, 1.6, 3.9, zf + 6.0, zf + 7.9, Q.side, Q.mid); box(tx - 1.42, tx + 1.42, 3.9, 4.08, zf + 5.85, zf + 8.05, Q.dark, Q.dark); // the cab, its roof
      poly([Pj(tx - 1.31, 2.7, zf + 6.3), Pj(tx - 1.31, 3.6, zf + 6.3), Pj(tx - 1.31, 3.6, zf + 7.3), Pj(tx - 1.31, 2.7, zf + 7.3)], Q.win2); // its window
      wheel(tx - .95, zf + 4.5, .85, Q.dark, Q.hi); wheel(tx - .95, zf + 2.6, .85, Q.dark, Q.hi); wheel(tx - .95, zf + 1.05, .48, Q.dark, Q.hi); // the driving wheels and the leading one
      for (let z = zf + 6.0; z >= zf + 1.7; z -= .5) disc(tx, 2.35, z, .78, Q.mid); // the boiler, drum by drum
      for (const z of [zf + 5.2, zf + 3.9, zf + 2.6]) ring(tx, 2.35, z, .78, Q.hi, .05); // its bands
      { const [a, b] = Pj(tx, 3.0, zf + 3.4), [, b2] = Pj(tx, 3.62, zf + 3.4), rr = f * .34 / (zf + 3.4); g.fillStyle = Q.side; g.beginPath(); g.moveTo(a - rr, b); g.lineTo(a - rr, b2 + rr * .6); g.quadraticCurveTo(a, b2 - rr * .5, a + rr, b2 + rr * .6); g.lineTo(a + rr, b); g.closePath(); g.fill(); } // the dome
      box(tx - 1.4, tx + 1.4, 1.45, 1.62, zf + .4, zf + 8.2, Q.hi, Q.dark); // the footplate
      for (let z = zf + 1.75; z >= zf + .6; z -= .3) disc(tx, 2.35, z, .86, Q.mid); // the smokebox
      { const zc = zf + 1.1, [a, b] = Pj(tx, 3.15, zc), [, b2] = Pj(tx, 4.45, zc), r0 = f * .27 / zc, r1 = f * .34 / zc; g.fillStyle = Q.dark; g.beginPath(); g.moveTo(a - r0, b); g.lineTo(a - r0 * .92, b2 + r1 * .5); g.lineTo(a - r1, b2); g.lineTo(a + r1, b2); g.lineTo(a + r0 * .92, b2 + r1 * .5); g.lineTo(a + r0, b); g.closePath(); g.fill(); g.fillStyle = Q.hi; g.fillRect(a - r0 * .7, b2 + r1 * .55, r0 * .35, b - b2 - r1 * .8); } // the tall chimney, its flared cap, the light on it
      disc(tx, 2.35, zf + .58, .86, Q.dark); disc(tx, 2.35, zf + .56, .6, Q.mid); ring(tx, 2.35, zf + .55, .6, Q.hi, .04); // the smokebox front, its door
      { const [a, b] = Pj(tx, 2.35, zf + .54), k = f / (zf + .54); g.strokeStyle = Q.dark; g.lineWidth = Math.max(.6, k * .06); g.beginPath(); g.moveTo(a - k * .55, b); g.lineTo(a + k * .55, b); g.stroke(); g.fillStyle = Q.hi; g.beginPath(); g.arc(a, b, Math.max(.5, k * .08), 0, TAU); g.fill(); } // its strap and its handle
      box(tx - 1.38, tx + 1.38, .85, 1.45, zf + .35, zf + .6, Q.mid, Q.dark); // the buffer beam
      for (const dx of [-.95, .95]) { for (let z = zf + .35; z >= zf; z -= .12) disc(tx + dx, 1.15, z, .2, Q.mid); disc(tx + dx, 1.15, zf, .22, Q.dark); disc(tx + dx, 1.15, zf - .01, .13, Q.hi); } // the buffers
      for (const dx of [-.6, .6]) { disc(tx + dx, 1.62, zf + .4, .13, Q.dark); disc(tx + dx, 1.62, zf + .39, .08, Q.glass); } // the lamps
      // the steam: the plume behind, back to front, and when it stands the hiss from its cylinders, either side
      const cloud = (a, b, rr, seed, al = 1) => { const lumps = [[-.55, .12, .62], [.5, .18, .58], [0, -.22, .78], [.18, .32, .55], [-.25, -.05, .6], [.62, -.12, .45]]; g.globalAlpha = al; g.fillStyle = Q.steamE; for (const [dx, dy, s2] of lumps) { g.beginPath(); g.arc(a + dx * rr + rr * .05, b + dy * rr + rr * .07, rr * s2 * (.9 + .2 * Math.sin(seed * 3.1 + dx * 7)), 0, TAU); g.fill(); } /* its shadowed underside, then its lit body */
        g.fillStyle = Q.steam; for (const [dx, dy, s2] of lumps) { g.beginPath(); g.arc(a + dx * rr, b + dy * rr, rr * s2 * (.9 + .2 * Math.sin(seed * 3.1 + dx * 7)), 0, TAU); g.fill(); } g.globalAlpha = 1; };
      for (let k = puffs.length - 1; k >= 0; k--) { const [x, y, z, r, i] = puffs[k]; if (z < 1) continue; const [a, b] = Pj(x, y, z); cloud(a, b, f * r / z, i); }
      if (e.hiss !== undefined) { const h = e.hiss; for (let n = Math.floor((h - 2.6) / .55); n * .55 <= h; n++) { if (n < 0) continue; const tb = n * .55, age = (h - tb) / 2.6; if (age < 0 || age >= 1) continue; const sd = n % 2 ? 1 : -1, x = tx + sd * (1.4 + age * 2.6), y = .5 + age * 1.7, z = zf + .9 - sd * age * .8, [a, b] = Pj(x, y, z); cloud(a, b, f * (.25 + age * 1.0) / z, n * 1.7, Math.min(1, (1 - age) * 1.6)); } } // the hiss from its cylinders: billows rolling out either side in turn, each growing and thinning away over a few frames
    },
    /** 1.12 b423: the hour egg's plan — its film, the flaps it plays on (those it reaches, clear of the words), and when
     *  each of them turns to each frame; the frames printed as they're asked for */
    hourPlan(P, kind, T) {
      const o = S.hp; if (o && o.P === P && o.kind === kind && o.raw === S.raw && o.W === S.W && o.H === S.H) return o;
      const { C, R, fw, fh, gap, ox, oy } = S, pw = fw + gap, ph = fh + gap, rm = S.hourRoom(), film = kind === 1 ? S.moonFilm(P, rm) : kind === 2 ? S.clockFilm(P, rm, T) : S.trainFilm(P, rm); /* (b443: 3, the crown's film) */
      const E0 = { P, kind, raw: S.raw, W: S.W, H: S.H, film }; S.hp = E0; if (!film) return E0;
      const [X0, Y0, X1, Y1] = film.box, c0 = clamp(Math.floor((X0 - ox) / pw), 0, C - 1), c1 = clamp(Math.floor((X1 - ox) / pw), 0, C - 1), r0 = clamp(Math.floor((Y0 - oy) / ph), 0, R - 1), r1 = clamp(Math.floor((Y1 - oy) / ph), 0, R - 1);
      const bx = ox + c0 * pw - gap / 2, by = oy + r0 * ph - gap / 2, bw = (c1 - c0 + 1) * pw, bh = (r1 - r0 + 1) * ph, at = new Int16Array(C * R).fill(-1), fl = [];
      for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) { if (rm.masked(c, rr)) continue; const i = rr * C + c; at[i] = fl.length; fl.push({ i, lx: ox + c * pw - bx, ly: oy + rr * ph - by, x: ox + c * pw + fw / 2, y: oy + rr * ph + fh / 2 }); }
      const ev = film.ev, n = ev.length, tt = new Float32Array(fl.length * n); // when each flap turns to each frame: the frame's time, and the wave's delay where there is one
      fl.forEach((f, b) => { let prev = -9; for (let k = 0; k < n; k++) { const t = Math.max(ev[k].t + (k ? film.delay(ev[k], f.x, f.y, S.hash[f.i]) : 0), prev + .03); tt[b * n + k] = t; prev = t; } });
      const mk = (w, h2) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h2 * px)); x.imageSmoothingEnabled = true; return [c, x]; };
      const [base, bx2] = mk(bw, bh), clip = new Path2D(); bx2.setTransform(px, 0, 0, px, 0, 0);
      for (const f of fl) { bx2.drawImage(S.faces[0], f.lx + gap / 2, f.ly + gap / 2, fw, fh); clip.roundRect(f.lx + gap / 2, f.ly + gap / 2, fw, fh, fw * .1); }
      const sc = film.region ? .25 : .5, [print, pX] = mk(bw, bh), lo = document.createElement("canvas"); lo.width = Math.ceil(bw * sc); lo.height = Math.ceil(bh * sc); /* (b443: the crown's film, the whole wall, is told apart at a quarter size) */
      const loX = lo.getContext("2d", { willReadFrequently: true }), lr = fl.map(f => [Math.floor((f.lx + gap / 2) * sc), Math.floor((f.ly + gap / 2) * sc), Math.ceil((f.lx + gap / 2 + fw) * sc), Math.ceil((f.ly + gap / 2 + fh) * sc)]);
      return S.hp = Object.assign(E0, { bx, by, bw, bh, at, fl, n, tt, base, clip, print, pX, lo, loX, lr, sc, sig: [], cache: new Map() });
    },
    /** 1.12 b423: which flaps frame e changes: each flap's piece of it, drawn at half size, summed up as a number */
    hourSig(hp, e) {
      if (hp.sig[e]) return hp.sig[e];
      if (hp.film.region) return hp.sig[e] = S.regionSig(hp, e); /* (b443) */
      const { lo, loX } = hp; loX.setTransform(1, 0, 0, 1, 0, 0); loX.clearRect(0, 0, lo.width, lo.height); loX.setTransform(.5, 0, 0, .5, -hp.bx * .5, -hp.by * .5); if (e > 0) hp.film.ink(loX, hp.film.ev[e]);
      const d = loX.getImageData(0, 0, lo.width, lo.height).data, out = new Uint32Array(hp.fl.length);
      hp.lr.forEach(([x0, y0, x1, y1], b) => { let h = 2166136261; for (let y = y0; y < Math.min(y1, lo.height); y++) for (let x = x0; x < Math.min(x1, lo.width); x++) { const i = (y * lo.width + x) * 4; h = Math.imul(h ^ d[i] ^ d[i + 1] << 8 ^ d[i + 2] << 16 ^ d[i + 3] << 24, 16777619) >>> 0; } out[b] = h; });
      return hp.sig[e] = out;
    },
    /** 1.12 b423: frame e as the box's flaps show it: their plain faces with the frame printed on them (the last few kept) */
    hourFace(hp, e) {
      let c = hp.cache.get(e); if (c) { hp.cache.delete(e); hp.cache.set(e, c); return c; }
      if (hp.cache.size >= 4) { const [k0, c0] = hp.cache.entries().next().value; hp.cache.delete(k0); c = c0; } else [c] = canvas(hp.base.width, hp.base.height);
      if (hp.film.region) { S.regionFace(hp, e, c); hp.cache.set(e, c); return c; } /* (b443) */
      const x = c.getContext("2d"), { print, pX } = hp; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "copy"; x.drawImage(hp.base, 0, 0); x.globalCompositeOperation = "source-over";
      pX.setTransform(1, 0, 0, 1, 0, 0); pX.fillStyle = "#fff"; pX.fillRect(0, 0, print.width, print.height); pX.setTransform(px, 0, 0, px, -hp.bx * px, -hp.by * px); hp.film.ink(pX, hp.film.ev[e]);
      x.save(); x.setTransform(px, 0, 0, px, 0, 0); x.clip(hp.clip); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "multiply"; x.drawImage(print, 0, 0); x.restore();
      hp.cache.set(e, c); return c;
    },
    /** 1.12 b443: the crown's film fills the wall, but only its train moves: each frame is told apart, and printed, only
     *  where its train and steam are (`film.region`), the rest the station as it was printed once (`still`) */
    regionSig(hp, e) {
      const { lo, loX, sc, film, lr } = hp, ev = film.ev[e], F = hp.fl.length;
      const hashIn = (x0, y0, x1, y1, d, w, out, only) => lr.forEach(([a, b2, c2, d2], b) => { if (only && (c2 <= x0 || a >= x1 || d2 <= y0 || b2 >= y1)) return; let h = 2166136261; for (let y = b2; y < Math.min(d2, lo.height); y++) for (let x = a; x < Math.min(c2, lo.width); x++) { const i = ((y - y0) * w + (x - x0)) * 4; h = Math.imul(h ^ d[i] ^ d[i + 1] << 8 ^ d[i + 2] << 16 ^ d[i + 3] << 24, 16777619) >>> 0; } out[b] = h; });
      const draw = (x0, y0, x1, y1, fn) => { loX.setTransform(1, 0, 0, 1, 0, 0); loX.clearRect(x0, y0, x1 - x0, y1 - y0); loX.save(); loX.beginPath(); loX.rect(x0, y0, x1 - x0, y1 - y0); loX.clip(); loX.setTransform(sc, 0, 0, sc, -hp.bx * sc, -hp.by * sc); fn(); loX.restore(); return loX.getImageData(x0, y0, x1 - x0, y1 - y0).data; };
      if (!hp.plainSig) { const d = draw(0, 0, lo.width, lo.height, () => {}); hashIn(0, 0, lo.width, lo.height, d, lo.width, hp.plainSig = new Uint32Array(F), false); }
      if (e < 0) { if (!hp.stillSig) { const d = draw(0, 0, lo.width, lo.height, () => film.still(loX)); hashIn(0, 0, lo.width, lo.height, d, lo.width, hp.stillSig = new Uint32Array(F), false); } return null; } // (made ahead, a piece a frame: regionPrep)
      if (e === 0 || ev.z === undefined) return hp.plainSig; // no picture: the flaps plain
      if (!hp.stillSig) S.regionSig(hp, -1);
      const out = hp.stillSig.slice(), r = film.region(ev); if (!r) return out;
      let x0 = Math.floor((r[0] - hp.bx) * sc), y0 = Math.floor((r[1] - hp.by) * sc), x1 = Math.ceil((r[2] - hp.bx) * sc), y1 = Math.ceil((r[3] - hp.by) * sc); // the region, out to the edges of the flaps it touches
      for (const [a, b2, c2, d2] of lr) if (c2 > x0 && a < x1 && d2 > y0 && b2 < y1) { x0 = Math.min(x0, a); y0 = Math.min(y0, b2); x1 = Math.max(x1, c2); y1 = Math.max(y1, d2); }
      x0 = clamp(x0, 0, lo.width); y0 = clamp(y0, 0, lo.height); x1 = clamp(x1, 0, lo.width); y1 = clamp(y1, 0, lo.height); if (x1 <= x0 || y1 <= y0) return out;
      const d = draw(x0, y0, x1, y1, () => film.ink(loX, ev)); hashIn(x0, y0, x1, y1, d, x1 - x0, out, true); return out;
    },
    regionFace(hp, e, c) {
      const x = c.getContext("2d"), { print, pX, film } = hp, ev = film.ev[e]; x.setTransform(1, 0, 0, 1, 0, 0);
      const stamp = (fn, clipR) => { pX.setTransform(1, 0, 0, 1, 0, 0); pX.fillStyle = "#fff"; if (clipR) pX.fillRect(clipR[0], clipR[1], clipR[2] - clipR[0], clipR[3] - clipR[1]); else pX.fillRect(0, 0, print.width, print.height); pX.save(); if (clipR) { pX.beginPath(); pX.rect(clipR[0], clipR[1], clipR[2] - clipR[0], clipR[3] - clipR[1]); pX.clip(); } pX.setTransform(px, 0, 0, px, -hp.bx * px, -hp.by * px); fn(); pX.restore();
        x.save(); x.setTransform(px, 0, 0, px, 0, 0); x.clip(hp.clip); x.setTransform(1, 0, 0, 1, 0, 0); if (clipR) { x.beginPath(); x.rect(clipR[0], clipR[1], clipR[2] - clipR[0], clipR[3] - clipR[1]); x.clip(); } x.globalCompositeOperation = "multiply"; x.drawImage(print, 0, 0); x.restore(); };
      if (ev.z === undefined) { x.globalCompositeOperation = "copy"; x.drawImage(hp.base, 0, 0); x.globalCompositeOperation = "source-over"; return; }
      S.regionStill(hp); x.globalCompositeOperation = "copy"; x.drawImage(hp.stillFace, 0, 0); x.globalCompositeOperation = "source-over";
      const r = film.region(ev); if (!r) return;
      const R2 = [Math.floor((r[0] - hp.bx) * px), Math.floor((r[1] - hp.by) * px), Math.ceil((r[2] - hp.bx) * px), Math.ceil((r[3] - hp.by) * px)].map((v, k) => clamp(v, 0, k % 2 ? print.height : print.width));
      if (R2[2] <= R2[0] || R2[3] <= R2[1]) return;
      x.save(); x.beginPath(); x.rect(R2[0], R2[1], R2[2] - R2[0], R2[3] - R2[1]); x.clip(); x.globalCompositeOperation = "copy"; x.drawImage(hp.base, 0, 0); x.restore(); x.globalCompositeOperation = "source-over"; // the plain flaps there, to print the frame on
      stamp(() => film.ink(pX, ev), R2);
    },
    /** 1.12 b443: the station printed on the flaps, once (made ahead too) */
    regionStill(hp) {
      const { print, pX, film } = hp;
      if (!hp.stillFace) { const [sf, sx] = canvas(hp.base.width, hp.base.height); sx.drawImage(hp.base, 0, 0); // the station printed once on the flaps
        pX.setTransform(1, 0, 0, 1, 0, 0); pX.fillStyle = "#fff"; pX.fillRect(0, 0, print.width, print.height); pX.setTransform(px, 0, 0, px, -hp.bx * px, -hp.by * px); film.still(pX);
        sx.save(); sx.setTransform(px, 0, 0, px, 0, 0); sx.clip(hp.clip); sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = "multiply"; sx.drawImage(print, 0, 0); sx.restore(); hp.stillFace = sf; }
    },
    /** 1.12 b443: what the crown's film needs before its first frame, made a piece a frame while the wall still rests:
     *  the station drawn, the plain flaps and the station's told apart, the station printed */
    regionPrep(hp) {
      if (!hp.film || !hp.film.region) return; const step = hp.prep || 0;
      if (step === 0) hp.film.still(hp.pX); else if (step === 1) S.regionSig(hp, 0); else if (step === 2) S.regionSig(hp, -1); else if (step === 3) S.regionStill(hp); else return;
      hp.prep = step + 1;
    },
    /** 1.12 b423: a flap of the hour egg at time T: the frame it turns from, the one it turns to (0 plain), how far */
    hourFlap(hp, b, i, T, I) {
      const n = hp.n, tt = hp.tt, o = b * n; let e = 0; for (let k = 1; k < n; k++) { if (tt[o + k] > T) break; e = k; }
      let from = e, to = e, p = 0;
      if (e > 0 && T - tt[o + e] < HFE && S.hourSig(hp, e)[b] !== S.hourSig(hp, e - 1)[b]) { from = e - 1; p = (T - tt[o + e]) / HFE; }
      if (I < S.back[i] && (p || S.hourSig(hp, e)[b] !== S.hourSig(hp, 0)[b])) { const q = clamp((S.back[i] - I) / Math.min(.12, S.back[i] - .012)); if (q > 0) { from = to; to = 0; p = q < 1 ? q : 0; } } // the list in use: back to plain, in a scatter, as the loop lets go
      if (p <= 0 || p >= 1) { p = 0; from = to; }
      return [from, to, p];
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H, C, R, fw, fh, gap, ox, oy, faces, wx } = S; let moved = S.full;
      const on = I > .01, fin = F >= 0, Tb = fin ? F * 3.4 : on ? T : 0, plan = fin ? [[0, "burst", "out"], [1.9, "plain", "out"]] : PLAN;
      const egg = K.egg(P), eg = egg && on && !fin ? S.eggPlan(P) : null; if (!egg) S.ep = null; // 1.12 b414: the egg's pass plays the egg (its pictures let go after)
      const hr = egg ? 0 : K.long(P), hour = hr === 1 || hr === 2 || hr === 3, hp = hour && on && !fin ? S.hourPlan(P, hr, T) : null; if (!hour) S.hp = null; /* (b443: and the crown, 3, plays the Lumières' train) */ // 1.12 b423: an hour egg's pass plays its film (a crown's, 3, is dealt as any pass)
      if (hp && hp.film && hp.film.region && T < .62) S.regionPrep(hp); // (b443) the crown's film made ready, a piece a frame, before it clatters in
      const pl = fin || !(P > 0) || egg || hour ? null : S.plan(P); // b381: a pass after the first plays its own changes (the finale is the same over any pass)
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
        else if (hp) { // 1.12 b423: a flap of the hour egg's film shows its piece of the frame it last turned to, or turns
          const bi = hp.film ? hp.at[i] : -1;
          if (bi >= 0) {
            const [f0, f1, pp] = S.hourFlap(hp, bi, i, T, I), s0 = S.hourSig(hp, 0)[bi], bare = !pp && S.mask[i] && S.hourSig(hp, f1)[bi] === s0, key = bare ? "m" : pp ? "h" + f0 + "," + f1 + "," + Math.round(pp * 16) : "r" + S.hourSig(hp, f1)[bi]; // at rest, a flap the frame leaves as it was isn't drawn again
            if (!S.full && S.drawn[i] === key) continue; S.drawn[i] = key; moved = true;
            const fx = ox + c * (fw + gap), fy = oy + rr * (fh + gap), hh = fh / 2, fb = hp.fl[bi]; wx.clearRect(fx - gap / 2, fy - gap / 2, fw + gap, fh + gap);
            if (bare) { wx.fillStyle = TONE[0]; wx.fillRect(fx - gap / 2, fy - gap / 2, fw + gap, fh + gap); continue; } // under a line's tools, nothing on it: page-plain, as always
            const face = f => S.hourSig(hp, f)[bi] === s0 ? [faces[0], 0, 0, faces[0].width, faces[0].height / 2] : [S.hourFace(hp, f), (fb.lx + gap / 2) * px, (fb.ly + gap / 2) * px, fw * px, fh * px / 2]; // a face, and where its top half is
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
