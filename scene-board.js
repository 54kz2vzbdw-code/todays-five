// scene-board.js — 1.12 b363: Chalkboard's and Whiteboard's scene (scenes.js loads it for either kit and says which).
// One board, by night and by day, and on it, in the open space the words leave (scenes.js, `words`), something drawn
// stroke by stroke by a hand we never see: its stick of chalk, or its marker, is all of it there is, riding the line as
// it goes down, lifting between strokes and going off the edge of the board for another colour. The board itself is
// laid once, behind everything; what has been drawn is kept in a layer that grows a stroke at a time, so each frame
// draws only the stroke in hand. The hand writes in a script of its own, every letter a little different.
//
// By night, a slate under a haze of dust, the light from a window falling across it in two shafts, chalk dust drifting
// and glinting in them; and a lesson in chalk: a circle and the right triangle standing in it, the sum of the squares
// boxed under them, a sine wave on its axes, a sum worked in a column, Saturn and its ring. The chalk is the slate's own
// grain showing through the line, so it breaks where the stick skipped, puffs where it landed and sheds dust as it goes.
// The loop, fifteen seconds: a wet sponge comes on from the edge and wipes the lesson off in long passes, leaving the
// slate dark and wet, streaked where the sponge's edges pushed the chalk; it dries back from its edges in, in patches,
// while the white chalk draws it all again; the hand goes for the blue and draws the wave and the planet; it goes for
// the yellow and marks the right angle, boxes the formula, carries the one, writes the answer and underlines it twice,
// and puts in stars. The finale, under the kit's own eraser: A+, circled, in yellow.
//
// By day, a whiteboard and a plan: three sticky notes with arrows between them, a bar chart, a light bulb, a checklist.
// The loop: an eraser scrubs the chart and the list off, leaving a ghost that fades, while the last note's corner lifts
// and it peels away and flutters off the board; the black marker draws the list and the chart's axes again (and the
// bulb, where it's among them); the blue colours the bars in with the tip's broad side and outlines them; a new note is
// slapped on, coming at the board from in front of it; the green ticks the list; the red draws the trend, rings the
// best bar and lights the bulb. The finale, under the kit's big check: notes slapped on all round the plan, ticked and
// starred, and a gust takes them off the edge. While the list is in use the lesson and the plan simply stand there, the
// dust drifting and the notes' corners stirring. The beats are a table, so they can be dealt differently each time round.
export default function board(K, id) {
  const chalk = id !== "whiteboard";
  const { clamp, lerp, E, seg, env, rng, canvas, paint } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  /** a sprite drawn smooth at the screen's density, `w` by `h` CSS pixels */
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); x.lineCap = "round"; x.lineJoin = "round"; fn(x); c.w2 = w; c.h2 = h; return c; };
  const rgba = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${+a.toFixed(3)})`;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const jerk = t => { t = clamp(t); return t * t * t * (10 - 15 * t + 6 * t * t); }; /* a hand's stroke: slow off the mark, quick through, slow in */
  const W3 = [255, 255, 255], K3 = [0, 0, 0];

  // the loop's beats, in seconds (the forever cycle can deal them differently): the wipe, and the window each colour
  // is drawn in (the hand goes off the board for the next colour between them)
  const B = chalk
    ? { wipe: [.5, 2.2], dry: [2.2, 5.6], white: [2.4, 9.3], blue: [9.8, 11.1], yellow: [11.6, 14.1] }
    : { wipe: [.6, 2.4], ghost: [2.4, 4.2], peel: [1.0, 2.1], slap: 8.9, black: [2.8, 6.8], blue: [7.3, 10.0], green: [10.5, 11.4], red: [11.9, 13.8] };
  const INKS = chalk ? [[246, 243, 234], [140, 196, 255], [250, 226, 118]] /* white, blue, yellow chalk */
    : [[34, 40, 49], [36, 87, 197], [38, 150, 84], [204, 44, 36]]; /* black, blue, green, red marker */
  const PHASES = chalk ? ["white", "blue", "yellow"] : ["black", "blue", "green", "red"];

  /* ---------------- the hand: a single-stroke script ----------------
     Each glyph is its advance and its strokes, in a box one cap high (y down: the line at 1, the x-height at .42); a
     stroke is runs joined end to end, and a run of three points or more is drawn as a curve through them. */
  const SRC = {
    A: ".62:0,1 .31,0;.31,0 .62,1|.15,.61 .48,.61",
    B: ".55:.06,0 .05,1|.06,.02 .3,0 .47,.1 .46,.3 .3,.45 .07,.47;.07,.47 .33,.49 .52,.62 .53,.83 .38,.98 .06,1",
    C: ".58:.56,.16 .44,.02 .25,.02 .08,.18 .03,.5 .1,.84 .3,1 .5,.96 .58,.84",
    a: ".5:.46,.52 .3,.42 .1,.5 .03,.74 .13,.96 .3,1 .44,.86 .47,.43;.47,.43 .49,1",
    b: ".5:.07,-.02 .06,1|.06,.66 .2,.46 .38,.43 .49,.6 .47,.86 .3,1 .08,.95",
    c: ".44:.42,.5 .28,.42 .1,.48 .03,.72 .12,.95 .3,1 .44,.9",
    d: ".52:.44,.52 .28,.42 .09,.5 .03,.74 .13,.96 .3,1 .44,.86|.46,-.02 .47,1",
    e: ".46:.06,.72 .4,.68 .42,.54 .28,.42 .1,.48 .03,.74 .14,.96 .32,1 .45,.9",
    h: ".5:.07,-.02 .06,1|.06,.64 .2,.46 .36,.43 .46,.56 .46,1",
    i: ".2:.1,.44 .1,1|.1,.2 .11,.225",
    l: ".22:.1,-.02 .09,.84 .13,.97 .2,1",
    n: ".5:.06,.43 .06,1|.06,.64 .2,.46 .36,.43 .46,.56 .46,1",
    p: ".5:.07,.43 .06,1.34|.07,.62 .21,.45 .38,.43 .49,.6 .47,.86 .3,1 .09,.94",
    s: ".42:.38,.47 .24,.41 .07,.47 .07,.62 .28,.71 .4,.83 .33,.97 .15,1 .02,.92",
    x: ".46:.02,.43 .44,1|.44,.43 .02,1",
    y: ".48:.02,.43 .22,.92|.46,.43 .27,1 .14,1.28 .02,1.34",
    "!": ".22:.11,0 .1,.7|.1,.94 .11,.965",
    "+": ".54:.27,.3 .27,.84|.04,.57 .5,.57",
    "=": ".5:.04,.47 .46,.46|.04,.71 .46,.7",
    "²": ".34:.04,.08 .13,-.02 .25,0 .3,.1 .25,.22 .03,.4;.03,.4 .32,.39",
    "π": ".66:.02,.52 .12,.44 .64,.42|.21,.44 .18,1|.46,.43 .47,.9 .55,1",
    "1": ".36:.06,.22 .24,0;.24,0 .24,1",
    "2": ".54:.04,.22 .16,.04 .34,0 .5,.12 .48,.34 .28,.6 .02,1;.02,1 .54,1",
    "3": ".52:.06,.12 .24,0 .44,.04 .5,.2 .41,.38 .2,.46;.2,.46 .44,.54 .52,.74 .44,.93 .24,1 .04,.9",
    "4": ".58:.4,0 .02,.66;.02,.66 .58,.66|.44,0 .44,1",
    "5": ".52:.12,0 .08,.44;.08,.44 .28,.38 .48,.47 .54,.7 .45,.92 .25,1 .03,.92|.12,0 .5,-.01",
    "7": ".54:.02,0 .54,0;.54,0 .18,1",
    "8": ".52:.46,.12 .28,0 .08,.08 .1,.28 .28,.44 .48,.6 .52,.82 .38,.99 .18,1 .03,.84 .08,.62 .28,.44 .44,.28 .46,.12",
  };
  /** a curve through the points (Catmull-Rom), `n` steps to each span */
  const smooth = (q, n = 5) => { const out = [q[0]]; for (let i = 0; i < q.length - 1; i++) { const p0 = q[Math.max(0, i - 1)], p1 = q[i], p2 = q[i + 1], p3 = q[Math.min(q.length - 1, i + 2)]; for (let k = 1; k <= n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3))); } } return out; };
  const GL = {};
  for (const ch in SRC) { const i = SRC[ch].indexOf(":"); GL[ch] = { w: +SRC[ch].slice(0, i), s: SRC[ch].slice(i + 1).split("|").map(st => st.split(";").map(run => run.trim().split(/\s+/).map(p => p.split(",").map(Number)))) }; }
  const oval = (cx, rx) => [Array.from({ length: 15 }, (_, i) => { const a = -1.75 - i / 14 * TAU * 1.07; return [cx + Math.cos(a) * rx, .5 + Math.sin(a) * .5]; })];
  GL.O = { w: .66, s: [oval(.33, .31)] }; GL["0"] = { w: .5, s: [oval(.25, .23)] };
  /** how wide a line of the hand is, at cap height s */
  const width = (str, s) => { let w = -.15; for (const ch of str) w += ch === " " ? .42 : GL[ch] ? GL[ch].w + .15 : 0; return Math.max(0, w) * s; };
  /** a line in the hand, as strokes in board pixels: cap height u, its left end at (x, y) on the line; every letter a
   *  little different from the last (its points moved a hair), and leaning a little forward */
  const write = (str, x, y, u, seed, slant = .13) => {
    const r = rng(seed), strokes = []; let cx = x;
    for (const ch of str) {
      if (ch === " ") { cx += .42 * u; continue; }
      const gl = GL[ch]; if (!gl) continue;
      for (const st of gl.s) {
        const pts = []; let last = null, lastJ = null;
        for (const run of st) {
          const q = run.map(p => (last && p[0] === last[0] && p[1] === last[1]) ? lastJ : [p[0] + (r() - .5) * .045, p[1] + (r() - .5) * .045]);
          last = run[run.length - 1]; lastJ = q[q.length - 1];
          for (const p of q.length > 2 ? smooth(q) : q) { const pv = pts[pts.length - 1]; if (!pv || Math.hypot(p[0] - pv[0], p[1] - pv[1]) > 1e-4) pts.push(p); }
        }
        strokes.push(pts.map(([a, b]) => [cx + (a + slant * (1 - b)) * u, y + (b - 1) * u]));
      }
      cx += (gl.w + .15) * u;
    }
    return strokes;
  };

  /* ---------------- what a hand draws: never quite straight, never quite closed ---------------- */
  const hline = (a, b, r, bow = .012) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, n = Math.max(2, Math.ceil(L / 12)), k = (r() - .5) * 2 * bow * L; return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, o = Math.sin(t * Math.PI) * k; return [a[0] + dx * t - dy / L * o, a[1] + dy * t + dx / L * o]; }); };
  const poly = (q, r, bow) => { let out = []; for (let i = 1; i < q.length; i++) out = out.concat(hline(q[i - 1], q[i], r, bow).slice(i > 1 ? 1 : 0)); return out; };
  /** an ellipse in one sweep, round a little past where it began and a little wide of it */
  const hring = (c, rx, ry, r, a0 = -2.3, over = .06) => { const n = Math.max(24, Math.ceil(Math.max(rx, ry) * TAU / 5)), wob = K.noise1(1 + Math.floor(r() * 9999), 8), k = .015 + r() * .025; return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = a0 - t * TAU * (1 + over), f = 1 + .02 * (wob(t * 8) - .5) + k * t; return [c[0] + Math.cos(a) * rx * f, c[1] + Math.sin(a) * ry * f]; }); };
  const hstar = (c, R, rot = 0) => Array.from({ length: 6 }, (_, i) => { const a = rot - Math.PI / 2 + i * TAU * 2 / 5; return [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]; });
  /** a box in one stroke from its top left, clockwise, the last side run on past the corner it started from */
  const hbox = (x0, y0, x1, y1, r, j) => poly([[x0, y0], [x1, y0 + (r() - .5) * j], [x1 + (r() - .5) * j, y1], [x0, y1 + (r() - .5) * j], [x0 + (r() - .5) * j, y0 - j * .8]], r);
  /** a word too far off to read: the loops and humps of a running hand along a line */
  const scrawl = (x, y, len, u, r) => { const pts = [], n = Math.max(2, Math.round(len / (.5 * u))), adv = len / n; for (let k = 0; k < n; k++) { const h = (r() < .28 ? .9 : .4 + r() * .1) * u; for (let j = 0; j < 8; j++) { const t = (k + j / 8) * TAU; pts.push([x + (k + j / 8) * adv - Math.sin(t) * .12 * u, y - (1 - Math.cos(t)) / 2 * h]); } } pts.push([x + len, y]); return smooth(pts, 2); };

  /* ---------------- strokes, and when each is drawn ---------------- */
  let seedN = 1;
  /** a stroke: its points and their running lengths, its colour, its width, how it's drawn ("w" writing, "l" a line or a
   *  curve, "d" a tap), and the chalk's pressure along it (where it bears down, and where it skips) */
  const mk = (pts, col, w, kind = "l") => {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = Math.max(L[L.length - 1], .5), n1 = K.noise1(seedN * 7 + 1, 32), n2 = K.noise1(seedN * 13 + 5, 32); seedN++;
    return { p: pts, L, len, col, w, kind, n: Math.max(1, Math.ceil(len / 3)), pr: s => clamp(.55 + .45 * n1(s / 16)) * (n2(s / 7) < .13 ? .3 : 1) + (s < 5 ? .25 : 0) };
  };
  /** the point `s` along a stroke: [x, y, the way it's heading, the index of the next point, how far toward it] */
  const along = (st, s) => { const L = st.L; let lo = 0, hi = L.length - 1; s = clamp(s, 0, L[hi]); if (hi === 0) return [st.p[0][0], st.p[0][1], 0, 0, 0]; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m; else hi = m; } const f = (s - L[lo]) / ((L[hi] - L[lo]) || 1), a = st.p[lo], b = st.p[hi]; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0]), hi, f]; };
  /** the path along a stroke from s0 to s1 — or along a line kept beside it, point for point (`pts`) */
  const trace = (x, st, s0, s1, pts = st.p) => { const a = along(st, s0), b = along(st, s1), at = q => { const p0 = pts[Math.max(0, q[3] - 1)], p1 = pts[q[3]]; return [lerp(p0[0], p1[0], q[4]), lerp(p0[1], p1[1], q[4])]; }, pa = at(a), pb = at(b); x.beginPath(); x.moveTo(pa[0], pa[1]); for (let i = a[3]; i < b[3]; i++) x.lineTo(pts[i][0], pts[i][1]); x.lineTo(pb[0], pb[1]); };
  /** how much of a stroke is down at time t */
  const done = (st, t) => st.t1 <= st.t0 ? (t >= st.t1 ? st.len : 0) : st.len * (st.kind === "w" ? E.sine : st.kind === "d" ? (v => v) : jerk)(clamp((t - st.t0) / (st.t1 - st.t0)));
  /** each colour's strokes laid out in time at a hand's pace — longer strokes quicker, a lift between strokes that is
   *  quicker for a short hop — and then fitted to that colour's window */
  const pace = (phs, u) => {
    for (const ph of phs) {
      let t = 0, pv = null;
      for (const st of ph.strokes) {
        if (pv) { const e = pv.p[pv.p.length - 1], d = Math.hypot(st.p[0][0] - e[0], st.p[0][1] - e[1]); t += .06 + Math.sqrt(d / u) * .05; }
        st.t0 = t; t += st.kind === "d" ? .06 : Math.max(.08, Math.sqrt(st.len * 2.4 * u) / (10 * u)); st.t1 = t; pv = st;
      }
      const [a, b] = ph.win, k = Math.min(1.2, (b - a) / t); ph.pace = 1 / k; /* above 1: brisker than the hand's own pace; never much slower (a short list of strokes just finishes early) */
      for (const st of ph.strokes) { st.t0 = a + st.t0 * k; st.t1 = a + st.t1 * k; }
    }
  };

  /* ---------------- chalk: the board's own grain showing through the line ---------------- */
  // the tooth of the slate, a tile of it: where the chalk catches (most of it), and the pits it skips (a fine speckle
  // and, larger, the soft patches where the stick rode high); tiled at the screen's own pixels, so the grain belongs
  // to the board and two strokes over the same place catch in the same pits
  /** 2-D value noise, smooth, tiling every `p` */
  const noise2 = (seed, p = 64) => { const v = Array.from({ length: p * p }, rng(seed)), at = (i, j) => v[(((j % p) + p) % p) * p + ((i % p) + p) % p]; return (x, y) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); return lerp(lerp(at(i, j), at(i + 1, j), sx), lerp(at(i, j + 1), at(i + 1, j + 1), sx), sy); }; };
  const TOOTH = (() => { const n = 128, r = rng(71), m = noise2(72, 16), a = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) a[y * n + x] = clamp((r() * .55 + m(x / 8, y / 8) * .45 - .2) * 2.3);
    return { n, a }; })();
  let tiles = null;
  const pats = x => { if (x._pat && x._px === px) return x._pat; if (!tiles) tiles = INKS.map(c => paint(TOOTH.n, TOOTH.n, (i, j) => [c[0], c[1], c[2], Math.round(255 * TOOTH.a[j * TOOTH.n + i])]));
    x._px = px; return (x._pat = tiles.map(t => { const p = x.createPattern(t, "repeat"); try { p.setTransform(new DOMMatrix([1 / px, 0, 0, 1 / px, 0, 0])); } catch (e) { /* an engine without it: the grain at the page's scale */ } return p; })); };
  /** segments k0 … k1-1 of a chalk stroke (three pixels each, butt-ended so they meet without beading), each as heavy as
   *  the chalk's pressure where it falls; the first is a dab where the stick landed; the last thins as it lifts */
  const chalkSegs = (x, st, k0, k1, upto = st.len, ga = 1) => {
    const P = pats(x), d = st.len / st.n; x.strokeStyle = P[st.col]; x.fillStyle = P[st.col]; x.lineCap = "butt";
    if (k0 === 0 && upto > 0) { x.globalAlpha = .7 * ga; x.beginPath(); x.arc(st.p[0][0], st.p[0][1], st.w * .62, 0, TAU); x.fill(); }
    for (let k = k0; k < k1; k++) {
      const s0 = k * d, s1 = Math.min(upto, (k + 1) * d); if (s1 <= s0) break;
      const sm = (s0 + s1) / 2, pr = st.pr(sm), tap = st.len - sm < 7 ? .6 + .4 * (st.len - sm) / 7 : 1;
      trace(x, st, s0, s1);
      x.globalAlpha = .62 * pr * ga; x.lineWidth = st.w * tap; x.stroke();
      x.globalAlpha = Math.min(1, .95 * pr) * ga; x.lineWidth = st.w * .56 * tap; x.stroke();
    }
    x.lineCap = "round"; x.globalAlpha = 1;
  };
  /** the dust that hangs about a chalk line, a soft haze a few times its width */
  const chalkHalo = (x, st, upto, ga = 1) => { if (upto <= 0) return; trace(x, st, 0, upto); x.strokeStyle = rgba(INKS[st.col]); x.globalAlpha = .035 * ga; x.lineWidth = st.w * 4.6; x.stroke(); x.globalAlpha = .055 * ga; x.lineWidth = st.w * 2.4; x.stroke(); x.globalAlpha = 1; };

  /* ---------------- marker: translucent, round, streaked where the felt ran thin, pooled where it rested ---------------- */
  const markerLine = (x, st, upto) => {
    if (upto <= 0) return; const c = INKS[st.col];
    x.lineCap = "round"; x.lineJoin = "round"; x.globalCompositeOperation = "multiply";
    trace(x, st, 0, upto); x.strokeStyle = rgba(c, st.a || .88); x.lineWidth = st.w; x.stroke();
    x.fillStyle = rgba(c, .35 * (st.a || .88) / .88); const a = st.p[0]; x.beginPath(); x.arc(a[0], a[1], st.w * .52, 0, TAU); x.fill(); /* where it went down */
    if (upto >= st.len) { const b = st.p[st.p.length - 1]; x.beginPath(); x.arc(b[0], b[1], st.w * .46, 0, TAU); x.fill(); } /* and came up */
    x.globalCompositeOperation = "source-over";
    for (const [pts, al] of st.streaks) { trace(x, st, 0, upto, pts); x.strokeStyle = `rgba(255,255,255,${al})`; x.lineWidth = Math.max(.6, st.w * .09); x.stroke(); }
  };
  /** the lines along a stroke a hair either side of its middle, where a felt tip leaves its streaks */
  const streaks = (st, r) => [[-.22, .3], [.08, .18], [.26, .24]].map(([o, a]) => [st.p.map((p, i) => { const q = st.p[Math.min(st.p.length - 1, i + 1)], pq = st.p[Math.max(0, i - 1)], dx = q[0] - pq[0], dy = q[1] - pq[1], L = Math.hypot(dx, dy) || 1; return [p[0] - dy / L * o * st.w, p[1] + dx / L * o * st.w]; }), a * (.6 + r() * .6)]);

  /* ---------------- the lesson and the plan, in units of the hand's letter height ---------------- */
  // Two ways of laying each out: tall, for a column beside the list (a desktop), and wide, for the band under it (a
  // phone). `words` picks the one that fits largest in the open space.
  const LESSON = {
    tall: { w: 22, h: 26.8, c: [7.3, 8.4], R: 5.4, f: [7.3, 17.2, 1.45], ax: [1.6, 23.0, 11.6, 2.3, 10], sum: [21.0, 19.4, 1.55], sat: [18.2, 4.5, 1.75], stars: [[15.1, 1.7, .55], [21.4, 7.6, .45], [15.6, 7.7, .38]], fin: [17.7, 12.0, 2.9], rows: [.9, 26.9], sh: 6.4 },
    wide: { w: 26, h: 18.2, c: [5.4, 7.0], R: 4.3, f: [5.4, 15.4, 1.05], ax: [12.4, 7.4, 8.4, 2.1, 7.6], sum: [25.6, 3.4, 1.1], sat: [16.4, 14.3, 1.35], stars: [[13.6, 12.2, .42], [19.6, 16.6, .38], [19.4, 12.0, .32]], fin: [22.6, 13.8, 2.0], rows: [.1, 18.1], sh: 5.8 },
  };
  const PLAN = {
    tall: { w: 20.6, h: 26.2, ns: 4.6, notes: [[2.5, 2.8, -.05], [10.3, 3.3, .035], [18.1, 2.6, -.025]], arrows: [[5.1, 3.0, 7.7, 3.5, -.5], [12.9, 3.6, 15.5, 2.9, -.5]], chart: [1.0, 7.6, 16.2, 12.6], bars: [[2.1, 3.2], [4.6, 5.0], [7.1, 4.0], [9.6, 7.6]], bw: 1.7, trend: [[2.4, 11.9], [5.3, 10.0], [7.9, 10.9], [12.0, 6.6]], bulb: [16.9, 10.4, 1.9], list: [.7, 19.8, 2.8, 3.0, 1.5, [9.8, 7.0, 11.4]], rows: [6.6, 26.1], eh: 4.8, fin: [10.3, 14] },
    wide: { w: 26, h: 16.4, ns: 4.2, notes: [[2.3, 2.6, -.05], [8.9, 3.1, .035], [15.5, 2.4, -.025]], arrows: [[4.7, 2.8, 6.5, 3.2, -.4], [11.3, 3.3, 13.1, 2.7, -.4]], chart: [14.2, 6.8, 15.4, 25.6], bars: [[15.2, 2.8], [17.8, 4.8], [20.4, 3.8], [23.0, 7.2]], bw: 1.8, trend: [[15.5, 11.2], [18.5, 9.2], [21.2, 10.3], [25.1, 6.6]], bulb: [22.2, 3.0, 1.45], bulbTop: true, list: [.6, 8.8, 2.9, 2.7, 1.3, [8.6, 6.2, 9.6]], rows: [6.0, 16.4], eh: 4.9, fin: [13, 8.4] },
  };
  const NOTE = [[255, 224, 90], [255, 138, 180], [126, 222, 178], [255, 178, 88], [140, 200, 255]];
  const WORDS = ["idea", "plan", "ship!"];

  /** the lesson, laid out at size u from (ox, oy): each colour's strokes, in the order the hand draws them */
  const lessonAt = (L, ox, oy, u) => {
    const r = rng(29), P = (x, y) => [ox + x * u, oy + y * u], w = clamp(u * .2, 2.4, 6), ph = [[], [], []];
    const put = (i, pts, k = 1, kind = "l") => ph[i].push(mk(pts, i, w * k, kind));
    const say = (i, str, x, y, s, seed, al = 0) => { const tw = width(str, s * u); write(str, ox + x * u - tw * al, oy + y * u, s * u, seed).forEach(p => put(i, p, clamp(s * .9, .8, 1.25), "w")); return tw / u; };
    // the circle, its diameter, the triangle on it (the angle at C is right: it stands in a semicircle), the letters
    const [cx, cy] = L.c, R = L.R, ca = -2.02, A = [cx - R, cy], Bq = [cx + R, cy], C = [cx + Math.cos(ca) * R, cy + Math.sin(ca) * R];
    put(0, hring(P(cx, cy), R * u, R * u, r, -2.4, .045), 1.05);
    put(0, hline(P(...A), P(...Bq), r));
    put(0, [...hline(P(...A), P(...C), r), ...hline(P(...C), P(...Bq), r).slice(1)]);
    put(0, [P(cx, cy), P(cx + .04, cy + .03)], 1.6, "d");
    say(0, "A", A[0] - .85, A[1] + .55, 1.1, 11, .5); say(0, "B", Bq[0] + .9, Bq[1] + .55, 1.1, 12, .5); say(0, "C", C[0] - .6, C[1] - .35, 1.1, 13, .5);
    // the sum of the squares under it
    const [fx, fy, fs] = L.f, fw = say(0, "a² + b² = c²", fx, fy, fs, 21, .5);
    // the axes and the wave on them, the half and the whole turn marked
    const [ax, ay, al, am, per] = L.ax;
    put(0, hline(P(ax - .5, ay), P(ax + al, ay), r)); put(0, [P(ax + al - .55, ay - .38), P(ax + al, ay), P(ax + al - .55, ay + .38)]);
    put(0, hline(P(ax, ay + am + .9), P(ax, ay - am - 1.2), r)); put(0, [P(ax - .38, ay - am - .62), P(ax, ay - am - 1.2), P(ax + .38, ay - am - .62)]);
    // a sum, worked in a column
    const [sx, sy, ss] = L.sum, w47 = width("47", ss), wp = width("+", ss);
    say(0, "38", sx, sy, ss, 31, 1); say(0, "+", sx - w47 - .35 * ss, sy + 1.7 * ss, ss, 32, 1); say(0, "47", sx, sy + 1.7 * ss, ss, 33, 1);
    put(0, hline(P(sx - w47 - .35 * ss - wp - .25, sy + 2.3 * ss), P(sx + .3, sy + 2.3 * ss), r));
    // blue: the wave, and Saturn with its ring (from where it comes out from behind the planet, round the front, to
    // where it goes behind again)
    const n = Math.ceil((al - .9) * u / 4); put(1, Array.from({ length: n + 1 }, (_, i) => { const t = i / n * (al - .9); return P(ax + t, ay - am * Math.sin(t / per * TAU)); }), 1.05);
    const [qx, qy, qr] = L.sat; put(1, hring(P(qx, qy), qr * u, qr * u, r, -2.2, .03));
    const tilt = -.32, rx = qr * 1.95, ry = qr * .52, rp = a => { const x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [qx + x * Math.cos(tilt) - y * Math.sin(tilt), qy + x * Math.sin(tilt) + y * Math.cos(tilt)]; };
    const hid = a => Math.hypot(rp(a)[0] - qx, rp(a)[1] - qy) < qr * 1.06; let a0 = Math.PI; while (!hid(a0) && a0 < 1.5 * Math.PI) a0 += .02; let a1 = TAU; while (!hid(a1) && a1 > 1.5 * Math.PI) a1 -= .02;
    const ring = []; for (let a = a0 - .04; a >= a1 - TAU + .04; a -= .05) ring.push(P(...rp(a))); put(1, ring);
    // yellow: the right angle marked, the formula boxed, the one carried, the answer underlined twice, stars
    const ua = [A[0] - C[0], A[1] - C[1]], ub = [Bq[0] - C[0], Bq[1] - C[1]], la = Math.hypot(...ua), lb = Math.hypot(...ub), q = .8;
    put(2, [P(C[0] + ua[0] / la * q, C[1] + ua[1] / la * q), P(C[0] + (ua[0] / la + ub[0] / lb) * q, C[1] + (ua[1] / la + ub[1] / lb) * q), P(C[0] + ub[0] / lb * q, C[1] + ub[1] / lb * q)]);
    put(2, hbox(ox + (fx - fw / 2 - .55) * u, oy + (fy - fs * 1.4) * u, ox + (fx + fw / 2 + .55) * u, oy + (fy + fs * .5) * u, r, .14 * u));
    say(2, "1", sx - width("38", ss) + .26 * ss, sy - 1.25 * ss, .62 * ss, 35, .5); say(2, "85", sx, sy + 4.05 * ss, ss, 34, 1);
    const w85 = width("85", ss); for (const k of [.55, 1.0]) put(2, hline(P(sx - w85 - .35, sy + 4.05 * ss + k * ss * .55), P(sx + .35, sy + 4.05 * ss + k * ss * .55), r), 1.1);
    for (const [x, y, s] of L.stars.slice(0, 2)) put(2, hstar(P(x, y), s * u, (r() - .5) * .3), .9);
    return ph;
  };

  /** the plan, laid out at size u from (ox, oy): the notes and the arrows between them, which stay, and each colour's
   *  strokes below them, which are wiped and drawn again */
  const planAt = (L, ox, oy, u) => {
    const r = rng(43), P = (x, y) => [ox + x * u, oy + y * u], w = clamp(u * .2, 2.4, 6.2), ph = [[], [], [], []], top = [], bt = L.bulbTop ? -1 : 0, rt = L.bulbTop ? -1 : 3;
    /* phase i (or -1: the part of the plan that stays), in colour c */
    const put = (i, pts, k = 1, kind = "l", c = i, a) => { const st = mk(pts, c, w * k, kind); st.streaks = streaks(st, r); if (a) st.a = a; (i < 0 ? top : ph[i]).push(st); return st; };
    // the arrows between the notes: a curve and its head
    for (const [x0, y0, x1, y1, b] of L.arrows) { const m = [(x0 + x1) / 2, (y0 + y1) / 2 + b], pts = Array.from({ length: 13 }, (_, i) => { const t = i / 12; return P((1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * m[0] + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * m[1] + t * t * y1); }); const st = mk(pts, 0, w); st.streaks = streaks(st, r); st.col = 0; top.push(st);
      const e = pts[12], d = pts[10], a = Math.atan2(e[1] - d[1], e[0] - d[0]), hl = .7 * u; const h = mk([[e[0] - Math.cos(a - .5) * hl, e[1] - Math.sin(a - .5) * hl], e, [e[0] - Math.cos(a + .5) * hl, e[1] - Math.sin(a + .5) * hl]], 0, w); h.streaks = streaks(h, r); top.push(h); }
    // black: the checklist's boxes and its items, the chart's axes, the bulb
    const [lx, ly, ldy, lix, lbs, lens] = L.list;
    lens.forEach((len, k) => { const y = ly + k * ldy; put(0, hbox(ox + lx * u, oy + (y - lbs) * u, ox + (lx + lbs) * u, oy + y * u, r, .1 * u), .85); put(0, scrawl(ox + lix * u, oy + y * u, len * u, u, r), .8, "w"); });
    const [cx0, cy0, cy1, cx1] = L.chart; put(0, [...hline(P(cx0, cy0), P(cx0, cy1), r), ...hline(P(cx0, cy1), P(cx1, cy1), r).slice(1)]);
    const [bx, by, br] = L.bulb, glass = []; for (let a = 2.08; a <= TAU + 1.06; a += .12) glass.push(P(bx + Math.cos(a) * br, by + Math.sin(a) * br)); put(bt, glass, 1, "l", 0);
    put(bt, hline(P(bx - .47 * br, by + .88 * br), P(bx - .42 * br, by + 1.45 * br), r), 1, "l", 0); put(bt, hline(P(bx + .47 * br, by + .88 * br), P(bx + .42 * br, by + 1.45 * br), r), 1, "l", 0);
    put(bt, poly([P(bx - .5 * br, by + 1.5 * br), P(bx + .5 * br, by + 1.5 * br), P(bx - .45 * br, by + 1.72 * br), P(bx + .45 * br, by + 1.72 * br)], r), .8, "l", 0);
    { const fil = [P(bx - .28 * br, by + .9 * br), P(bx - .24 * br, by + .2 * br)]; for (let k = 0; k <= 16; k++) { const t = k / 16, a = t * TAU * 3; fil.push(P(bx - .24 * br + t * .48 * br + Math.sin(a) * .07 * br, by + .2 * br - (1 - Math.cos(a)) * .09 * br)); } fil.push(P(bx + .24 * br, by + .2 * br), P(bx + .28 * br, by + .9 * br)); put(bt, fil, .6, "l", 0); }
    // blue: each bar drawn up, across and down, then filled from the bottom in a zigzag
    for (const [x, h] of L.bars) { const x1 = x + L.bw, y0 = cy1, y1 = cy1 - h, zz = []; for (let y = y0 - .3, k = 0; y > y1 + .25; y -= .5, k++) zz.push(P(k % 2 ? x1 - .3 : x + .3, y - (k % 2 ? .12 : 0)));
      put(1, zz, 3.1, "l", 1, .34); put(1, [...hline(P(x, y0), P(x, y1), r), ...hline(P(x, y1), P(x1, y1), r).slice(1), ...hline(P(x1, y1), P(x1, y0), r).slice(1)], .9); }
    // green: the ticks, each bigger than its box
    lens.forEach((_, k) => { const y = ly + k * ldy; put(2, [P(lx + .2, y - .7 * lbs), P(lx + .55 * lbs, y - .08), P(lx + lbs * 1.35, y - lbs * 1.45)], 1.1); });
    // red: the trend, rising over the bars, and the bulb's light
    const tr = put(3, smooth(L.trend.map(p => P(...p)), 6), 1.05); { const e = tr.p[tr.p.length - 1], d = tr.p[tr.p.length - 4], a = Math.atan2(e[1] - d[1], e[0] - d[0]), hl = .75 * u; put(3, [[e[0] - Math.cos(a - .5) * hl, e[1] - Math.sin(a - .5) * hl], e, [e[0] - Math.cos(a + .5) * hl, e[1] - Math.sin(a + .5) * hl]]); }
    { const [x, h] = L.bars.reduce((m, q) => q[1] > m[1] ? q : m); put(3, hring(P(x + L.bw / 2, cy1 - h), L.bw * .95 * u, .95 * u, r, -2.6, .12), .9); } /* a ring round the best of them */
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .62; put(rt, hline(P(bx + Math.cos(a) * br * 1.35, by + Math.sin(a) * br * 1.35), P(bx + Math.cos(a) * br * 1.85, by + Math.sin(a) * br * 1.85), r), .85, "l", 3); }
    // the notes, where they sit on the board
    const notes = L.notes.map(([x, y, rot], i) => ({ x: ox + x * u, y: oy + y * u, rot, s: L.ns * u, col: NOTE[i], word: WORDS[i], ph: i * 2.1 + .4 }));
    return { ph, top, notes };
  };

  /* ---------------- the sponge's and the eraser's path: straight passes to and fro, in from an edge and out ----------------
     The wet (and what's wiped) is the passes themselves, square at the ends and overlapping; the sponge rides a rounded
     copy of the same path, swinging a little wide at each turn, and slows into it. */
  /** how many passes, and how tall a band each, to cover rows y0 … y1 of the box: the passes overlap, and when the
   *  drawing has words to one side there are an even number of them, so the wiper goes back out the way it came in */
  const passesFor = (y0, y1, want, u, both) => { let n = Math.max(1, Math.round((y1 - y0) / want)); if (!both && n % 2) n++; const step = (y1 - y0) / n; return { passes: Array.from({ length: n }, (_, i) => y0 + (i + .5) * step), band: step * 1.16 * u }; };
  const wipePath = (passes, band, box, u) => {
    const { W } = S, pts = [], inR = S.side !== "l", e = band * .4, x0 = box.x + e, x1 = box.x + box.w - e, far = W + band, near = -band;
    passes.forEach((ps, i) => { const [y, xs] = Array.isArray(ps) ? ps : [ps, null], yy = box.y + y * u, toL = (i % 2 === 0) === inR, a = i === 0 ? (inR ? far : near) : (toL ? x1 : x0), b = xs !== null ? box.x + xs * u : toL ? x0 : x1;
      pts.push([a, yy], [b, yy]); });
    const lastL = (passes.length - 1) % 2 === 0 === inR, ly = pts[pts.length - 1][1]; pts.push([lastL ? near * 2 : far + band, ly]);
    const st = mk(pts, 0, band), ride = mk(smooth(pts, 12), 0, band);
    // the pace along it: quick down the straights, slowing into each turn (a time for each point of the ride, 0 … 1)
    const sm = ride.p, tl = [0]; for (let i = 1; i < sm.length; i++) { const a = sm[Math.max(0, i - 3)], b = sm[i], c = sm[Math.min(sm.length - 1, i + 3)], t1 = Math.atan2(b[1] - a[1], b[0] - a[0]), t2 = Math.atan2(c[1] - b[1], c[0] - b[0]), turn = Math.abs(Math.atan2(Math.sin(t2 - t1), Math.cos(t2 - t1))); tl.push(tl[i - 1] + (ride.L[i] - ride.L[i - 1]) / (.3 + .7 * Math.max(0, Math.cos(Math.min(turn * 1.3, Math.PI / 2))))); }
    const T0 = tl[tl.length - 1]; for (let i = 0; i < tl.length; i++) tl[i] /= T0;
    /** how far along (0 … 1) the wiper is at k of its time */
    st.at = k => { if (k <= 0) return 0; if (k >= 1) return 1; let lo = 0, hi = tl.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tl[m] < k) lo = m; else hi = m; } return lerp(ride.L[lo], ride.L[hi], (k - tl[lo]) / ((tl[hi] - tl[lo]) || 1)) / ride.len; };
    st.ride = ride;
    return st;
  };

  /* ---------------- the stage's side of it ---------------- */
  const S = {
    res: "dpr",
    ...(chalk ? { wash: 1, veil: .6, hug: .72, hugFinale: true, list: .4 } : { wash: 1.6, veil: 1, hug: .8, hugFinale: true, list: .4 }), // the lines and the finale's words sit on pads; the drawing keeps to the open space
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a; g._pat = null; tiles = null;
      const pr = H > W * 1.05, r = rng(chalk ? 5 : 9);
      Object.assign(S, { W, H, pr, bg }); if (S.vis === undefined) S.vis = 1;
      S.motes = Array.from({ length: pr ? 34 : 60 }, () => ({ x: r(), y: r(), s: .5 + r() * 1.2, f: .3 + r() * .7, ph: r() * TAU, v: .004 + r() * .008 }));
      S.puffs = INKS.map(c => K.glowSpr(24, c, .9)); /* the dust where a stroke lands, in its chalk's colour */
      if (chalk) { S.sh = S.shafts(); S.slate(W, H, bg); } else S.white(W, H, bg);
      S.box = S.pending = null; S.fit(true); /* a new size: placed afresh (with no room yet, nothing until there is) */
    },
    /** soft shapes for the ground: drawn an eighth the size, blurred there, and stretched over the board (a wide blur
     *  at the screen's own density costs a great deal, and these have no edges to lose) */
    soft(bg, W, H) { const q = .125, [c, x] = canvas(Math.ceil(W * q) + 1, Math.ceil(H * q) + 1); return (blur, col, fn) => { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.save(); x.setTransform(q, 0, 0, q, 0, 0); x.shadowColor = col; x.shadowBlur = blur * q; x.shadowOffsetY = 10000; x.translate(0, -10000 / q); x.strokeStyle = "#000"; x.fillStyle = "#000"; x.lineCap = "round"; x.lineJoin = "round"; fn(x); x.restore(); bg.save(); bg.imageSmoothingEnabled = true; bg.drawImage(c, 0, 0, c.width / q, c.height / q); bg.restore(); }; },
    /** the window's light: where it comes from, which way it falls, and its two shafts (offset and width) */
    shafts() { const { W, H } = S, a = .55; S.beam = [[W * .8, 0], [-Math.sin(a), Math.cos(a)], [Math.cos(a), Math.sin(a)]]; const k = Math.min(W, H); return [[-k * .1, k * .13], [k * .07, k * .1]]; },
    /** how much of the window's light falls at (x, y), 0 … 1 */
    lit(x, y) { const [p0, , n] = S.beam, e = (x - p0[0]) * n[0] + (y - p0[1]) * n[1]; let v = 0; for (const [o, wb] of S.sh) v = Math.max(v, clamp(1 - Math.abs(e - o) / (wb * .6))); return v; },
    /** the slate: under a haze of dust that gathers low, the ghost of a wide erase across it and of old lessons, the
     *  dust in its grain, the corners darker */
    slate(W, H, bg) {
      const G = ["#1C2724", "#22302C", "#2A3B35", "#33463F"], r = rng(13);
      bg.fillStyle = G[0]; bg.fillRect(0, 0, W, H);
      bg.save(); bg.translate(W * .5, H * .92); bg.scale(W * .9, H * .9); const hz = bg.createRadialGradient(0, 0, 0, 0, 0, 1); hz.addColorStop(0, G[2]); hz.addColorStop(.55, G[1]); hz.addColorStop(1, G[0]); bg.fillStyle = hz; bg.fillRect(-2, -2, 4, 4); bg.restore();
      const soft = S.soft(bg, W, H);
      soft(70, "rgba(51,70,63,.38)", bg => { bg.lineWidth = H * .17; bg.beginPath(); bg.moveTo(W * .11, H * .43); bg.bezierCurveTo(W * .31, H * .38, W * .56, H * .52, W * .89, H * .42); bg.stroke(); });
      soft(70, "rgba(42,59,53,.5)", bg => { bg.lineWidth = H * .12; bg.beginPath(); bg.moveTo(W * .06, H * .7); bg.bezierCurveTo(W * .25, H * .76, W * .44, H * .66, W * .61, H * .72); bg.stroke(); });
      // the swirls an eraser left, faint
      for (let k = 0; k < 5; k++) soft(18, "rgba(58,78,70,.16)", bg => { const cx = W * (.15 + r() * .75), cy = H * (.2 + r() * .65), R0 = Math.min(W, H) * (.08 + r() * .1); bg.lineWidth = R0 * .5; bg.beginPath(); bg.arc(cx, cy, R0, r() * TAU, r() * TAU + 2.2); bg.stroke(); });
      // the light from a window up on the right, falling across the board in two shafts (the motes glint in it)
      soft(40, "rgba(255,240,214,.055)", bg => { for (const [o, wb] of S.shafts()) { const [p0, d, n] = S.beam, c = (t, e) => [p0[0] + n[0] * e + d[0] * t, p0[1] + n[1] * e + d[1] * t]; bg.beginPath(); for (const q of [c(-H * .3, o - wb / 2), c(-H * .3, o + wb / 2), c(H * 1.6, o + wb / 2), c(H * 1.6, o - wb / 2)]) bg.lineTo(q[0], q[1]); bg.closePath(); bg.fill(); } });
      // old lessons, all but gone
      bg.save(); bg.strokeStyle = "rgba(160,176,168,.05)"; bg.lineWidth = 3; const u0 = clamp(Math.min(W, H) * .03, 12, 22);
      for (const [str, x, y] of [["x + y = 12", .05, .12], ["3 × 4", .62, .9], ["b² - 4ac", .08, .88], ["y = 2x + 1", .58, .08]]) for (const p of write(str.replace("×", "x").replace("-", "="), W * x, H * y, u0 * 1.1, 91)) { bg.beginPath(); p.forEach(([a, b], i) => i ? bg.lineTo(a, b) : bg.moveTo(a, b)); bg.stroke(); }
      bg.restore();
      // the dust in the slate's grain, and the motes caught in it
      const tile = paint(Math.round(160 * px), Math.round(160 * px), () => { const v = r(); return v < .1 ? [51, 70, 63, 150] : v < .115 ? [70, 92, 84, 190] : null; });
      const pat = bg.createPattern(tile, "repeat"); try { pat.setTransform(new DOMMatrix([1 / px, 0, 0, 1 / px, 0, 0])); } catch (e) { /* as it comes */ } bg.fillStyle = pat; bg.globalAlpha = .6; bg.fillRect(0, 0, W, H); bg.globalAlpha = 1;
      const vg = bg.createRadialGradient(W * .5, H * .45, Math.min(W, H) * .3, W * .5, H * .5, Math.hypot(W, H) * .62); vg.addColorStop(0, "rgba(14,20,18,0)"); vg.addColorStop(1, "rgba(14,20,18,.5)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
    },
    /** the whiteboard: bright, a sheen across it, the ghost of a smudge that didn't quite wipe, a window's reflection,
     *  the corners dimmer */
    white(W, H, bg) {
      const G = ["#FBFBFA", "#F4F5F3", "#ECEEEB", "#E2E5E1"], r = rng(17);
      bg.save(); bg.scale(W, H); const sh = bg.createLinearGradient(0, 0, 1, 1); sh.addColorStop(0, G[0]); sh.addColorStop(.38, G[0]); sh.addColorStop(.5, G[1]); sh.addColorStop(.62, G[0]); sh.addColorStop(1, G[0]); bg.fillStyle = sh; bg.fillRect(0, 0, 1, 1); bg.restore();
      bg.save(); bg.translate(W / 2, H / 2); bg.scale(W * .75, H * .75); const vg = bg.createRadialGradient(0, 0, 0, 0, 0, 1); vg.addColorStop(.55, "rgba(236,238,235,0)"); vg.addColorStop(1, "rgba(236,238,235,.7)"); bg.fillStyle = vg; bg.fillRect(-2, -2, 4, 4); bg.restore();
      const soft = S.soft(bg, W, H);
      soft(60, "rgba(226,229,225,.55)", bg => { bg.lineWidth = H * .15; bg.beginPath(); bg.moveTo(W * .16, H * .72); bg.bezierCurveTo(W * .33, H * .56, W * .48, H * .64, W * .65, H * .47); bg.bezierCurveTo(W * .8, H * .36, W * .88, H * .38, W * .94, H * .3); bg.stroke(); });
      soft(60, "rgba(236,238,235,.38)", bg => { bg.lineWidth = H * .07; bg.beginPath(); bg.moveTo(W * .06, H * .25); bg.bezierCurveTo(W * .19, H * .19, W * .33, H * .33, W * .45, H * .25); bg.bezierCurveTo(W * .6, H * .15, W * .7, H * .2, W * .74, H * .21); bg.stroke(); });
      // the window's reflection: two soft panes of brighter white, high on the right
      soft(40, "rgba(255,255,255,.75)", bg => { for (const k of [0, 1]) { const x0 = W * (.7 + k * .1), y0 = H * .06; bg.beginPath(); bg.moveTo(x0, y0); bg.lineTo(x0 + W * .07, y0); bg.lineTo(x0 + W * .03, y0 + H * .3); bg.lineTo(x0 - W * .04, y0 + H * .3); bg.closePath(); bg.fill(); } });
      // the ghost of an old plan that didn't quite wipe
      bg.save(); bg.strokeStyle = "rgba(120,140,170,.07)"; bg.lineWidth = 4; bg.lineCap = "round"; const u0 = clamp(Math.min(W, H) * .03, 12, 22);
      for (const [str, x, y] of [["plan b", .05, .93], ["ship", .66, .95]]) for (const p of write(str, W * x, H * y, u0 * 1.1, 93)) { bg.beginPath(); p.forEach(([a, b], i) => i ? bg.lineTo(a, b) : bg.moveTo(a, b)); bg.stroke(); }
      bg.restore();
    },
    /** where the words are (scenes.js): the largest open rectangle clear of them, the edges, the bar along the top and
     *  the footer's pool; the lesson (or the plan) is laid in it, tall or wide, as large as the room allows. It moves
     *  only when the words come over it or there is far more room elsewhere, and then fades out and in again there. */
    words(rects) { S.raw = rects; if (!S.W) return; if (S.F >= 0) S.refit = true; else S.fit(false); }, /* not in the middle of the finale: its own words come and go */
    fit(now) {
      const { W, H, pr } = S, rects = (S.raw || [pr ? [16, H * .12, W - 16, H * .56, 1] : [W * .05, H * .14, W * .6, H * .8, 1]]).filter(q => q[4] !== 2); /* the lab has no words: a list where it would be */
      const top = pr ? 88 : 104, foot = H - (pr ? 96 : 112), gap = pr ? 12 : 22, C = 36, R = 28, cw = W / C, ch = (foot - top) / R, free = new Uint8Array(C * R);
      for (let j = 0; j < R; j++) for (let i = 0; i < C; i++) { const x0 = i * cw, y0 = top + j * ch, x1 = x0 + cw, y1 = y0 + ch; let ok = x0 >= 6 && x1 <= W - 6; if (ok) for (const [a, b, c, d] of rects) if (x1 > a - gap && x0 < c + gap && y1 > b - gap && y0 < d + gap) { ok = false; break; } free[j * C + i] = ok ? 1 : 0; }
      const COMP = chalk ? LESSON : PLAN, umax = pr ? 15 : 26; let best = null; const col = new Uint8Array(C);
      for (let j0 = 0; j0 < R; j0++) { col.fill(1); for (let j1 = j0; j1 < R; j1++) { for (let i = 0; i < C; i++) col[i] &= free[j1 * C + i]; let i0 = 0;
        for (let i = 0; i <= C; i++) { if (i < C && col[i]) continue; if (i > i0) { const bw = (i - i0) * cw, bh = (j1 - j0 + 1) * ch; for (const k in COMP) { const L = COMP[k], u = Math.min(bw / L.w, bh / L.h, umax), sc = u * (k === "tall" && !pr ? 1.12 : 1); /* on a wide screen the tall one, a column, unless the wide one is much larger */ if (!best || sc > best.sc * 1.005 || (sc > best.sc * .995 && bw * bh > best.room)) best = { u, sc, k, room: bw * bh, x: i0 * cw + (bw - L.w * u) / 2, y: top + j0 * ch + (bh - L.h * u) / 2, w: L.w * u, h: L.h * u }; } /* as large as any, and then the most room round it: centred in it */ } i0 = i + 1; } } }
      S.room = best && best.u >= 8 ? 1 : 0; if (!S.room) { S.pending = null; return; }
      const cur = S.box, hit = cur && rects.some(([a, b, c, d]) => c > cur.x + 4 && a < cur.x + cur.w - 4 && d > cur.y + 4 && b < cur.y + cur.h - 4);
      if (now || !cur) { S.box = best; S.pending = null; S.build(); return; }
      if (hit || best.u > cur.u * 1.25 || (best.k !== cur.k && best.u > cur.u * 1.1)) { if (Math.abs(best.x - cur.x) > 6 || Math.abs(best.y - cur.y) > 6 || Math.abs(best.u - cur.u) > .3) S.pending = best; }
      else S.pending = null;
    },
    /** where the drawing is (the stage's `spot`), or nothing while there's no room for it */
    spot() { const b = S.box; return !b || S.vis < .05 ? null : [Math.round(b.x + b.w / 2), Math.round(b.y + b.h / 2), Math.round(Math.min(b.w, b.h) / 2)]; },
    /** everything that depends on where the drawing is and how large: its strokes and their times, the layers they're
     *  kept in, the tools at their size, the wipe's path and what it leaves */
    build() {
      const { W, H } = S, b = S.box, u = b.u, L = (chalk ? LESSON : PLAN)[b.k], r = rng(61); seedN = 1;
      S.side = b.x + b.w > W * .82 ? "r" : b.x < W * .18 ? "l" : "r";
      // the layers cover the drawing and a margin round it (and, by night, all the sponge wets)
      const m = 2.2 * u; let ex0 = b.x - m, ey0 = b.y - m, ex1 = b.x + b.w + m, ey1 = b.y + b.h + m;
      const both = b.x < W * .1 && b.x + b.w > W * .9, pz = passesFor(L.rows[0], L.rows[1], chalk ? L.sh : L.eh, u, both);
      if (chalk) { S.band = pz.band; S.wipe = wipePath(pz.passes, S.band, b, u); for (const [a, c] of S.wipe.p) { ex0 = Math.min(ex0, a - S.band / 2); ey0 = Math.min(ey0, c - S.band / 2); ex1 = Math.max(ex1, a + S.band / 2); ey1 = Math.max(ey1, c + S.band / 2); } }
      S.lx = Math.floor(Math.max(0, ex0) * px) / px; S.ly = Math.floor(Math.max(0, ey0) * px) / px;
      const lw = Math.max(1, Math.ceil((Math.min(W, ex1) - S.lx) * px)), lh = Math.max(1, Math.ceil((Math.min(H, ey1) - S.ly) * px));
      const layer = () => { const [c, x] = canvas(lw, lh); x.imageSmoothingEnabled = true; x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); x.lineCap = "round"; x.lineJoin = "round"; return { c, x, n: 0, k: 0 }; };
      S.full = layer(); S.live = layer(); S.scr = layer(); S.fin = null; S.layer = layer; /* the finale's layer is made when a finale first plays */
      if (chalk) {
        const ph = lessonAt(L, b.x, b.y, u);
        S.phases = PHASES.map((nm, i) => ({ col: i, win: B[nm], strokes: ph[i] }));
        // the finale: A+ in yellow, circled, and three stars
        const [fx, fy, fs] = L.fin, fw = width("A+", fs * u), fwd = clamp(u * .22, 2.6, 6.4);
        const letters = write("A+", b.x + fx * u - fw / 2, b.y + (fy + fs * .5) * u, fs * u, 77).map(p => mk(p, 2, fwd, "w"));
        const round = [mk(hring([b.x + fx * u, b.y + fy * u], fw * .5 + .45 * fs * u, fs * u * .85, r, -2.6, .1), 2, fwd * .9)];
        const stars = [[-1.15, -1.1, .3], [1.25, -.95, .24], [1.1, 1.05, .2]].map(([dx, dy, s]) => mk(hstar([b.x + (fx + dx * fs) * u, b.y + (fy + dy * fs) * u], s * fs * u, r() - .5), 2, fwd * .75));
        pace([{ win: [.06, .38], strokes: letters }, { win: [.42, .55], strokes: round }, { win: [.58, .72], strokes: stars }], u);
        S.finS = [...letters, ...round, ...stars];
        // the chalk stick, one of each colour, and its shadow; the sponge
        const sl = clamp(u * 1.9, 24, 50), sd = sl * .22; S.tl = sl;
        S.tools = INKS.map(c => make(sl + 4, sd + 4, x => { x.translate(2, 2); const gr = x.createLinearGradient(0, 0, 0, sd); gr.addColorStop(0, rgba(mix(c, W3, .6))); gr.addColorStop(.4, rgba(c)); gr.addColorStop(1, rgba(mix(c, K3, .3)));
          x.fillStyle = gr; x.beginPath(); x.moveTo(sd * .3, 0); x.lineTo(sl - 1.2, .4); x.lineTo(sl, sd * .35); x.lineTo(sl - .6, sd * .7); x.lineTo(sl - 1.4, sd); x.lineTo(sd * .12, sd); x.quadraticCurveTo(-sd * .18, sd * .5, sd * .3, 0); x.fill();
          x.fillStyle = rgba(mix(c, W3, .45), .9); x.beginPath(); x.ellipse(sd * .1, sd * .5, sd * .2, sd * .42, 0, 0, TAU); x.fill(); /* the worn end */
          x.fillStyle = rgba(mix(c, K3, .25), .35); for (let k = 0; k < 4; k++) x.fillRect(sd + r() * (sl - sd * 2), r() * sd, .8, .8); }));
        S.toolSh = make(sl + 12, sd + 12, x => { x.shadowColor = "rgba(0,0,0,.55)"; x.shadowBlur = 3 * px; x.shadowOffsetY = 1000 * px; x.fillStyle = "#000"; x.beginPath(); x.roundRect(6, 6 - 1000, sl, sd, sd / 2); x.fill(); });
        const band = S.band, sw = band * .56;
        S.sponge = make(sw + 8, band + 8, x => { x.translate(4, 4); const gr = x.createLinearGradient(0, 0, sw, band); gr.addColorStop(0, "#F4D774"); gr.addColorStop(1, "#D9A93C"); x.fillStyle = gr; x.beginPath(); x.roundRect(0, 0, sw, band, sw * .22); x.fill();
          x.fillStyle = "rgba(150,100,20,.45)"; for (let k = 0; k < sw * band / 40; k++) { x.beginPath(); x.ellipse(2 + r() * (sw - 4), 2 + r() * (band - 4), .6 + r() * 1.6, .5 + r() * 1.1, r() * 3, 0, TAU); x.fill(); }
          x.strokeStyle = "rgba(255,246,200,.6)"; x.lineWidth = 1.5; x.beginPath(); x.roundRect(1.5, 1.5, sw - 3, band - 3, sw * .2); x.stroke(); });
        S.spongeSh = make(sw + 30, band + 30, x => { x.shadowColor = "rgba(0,0,0,.5)"; x.shadowBlur = 8 * px; x.shadowOffsetY = 1000 * px; x.fillStyle = "#000"; x.beginPath(); x.roundRect(15, 15 - 1000, sw, band, sw * .22); x.fill(); });
        S.wet();
      } else {
        const pl = planAt(L, b.x, b.y, u);
        S.phases = PHASES.map((nm, i) => ({ col: i, win: B[nm], strokes: pl.ph[i] })); S.topS = pl.top; S.notes = pl.notes;
        S.top = layer(); for (const st of S.topS) markerLine(S.top.x, st, st.len);
        // the note sprites: each its colour, a band of adhesive along the top, its word in black marker; a back for when
        // it turns over; the soft shadow a note casts
        const ns = L.ns * u; S.ns = ns;
        const noteSpr = (c, word, seed, back) => make(ns, ns, x => { const gr = x.createLinearGradient(0, 0, ns * .3, ns); gr.addColorStop(0, rgba(mix(c, W3, back ? .35 : .12))); gr.addColorStop(1, rgba(mix(c, K3, back ? .02 : .06))); x.fillStyle = gr; x.fillRect(0, 0, ns, ns);
          x.fillStyle = rgba(mix(c, K3, .08), .5); x.fillRect(0, 0, ns, ns * .18); if (!word) return;
          const s = ns * .2, tw = width(word, s); x.strokeStyle = "rgba(34,40,49,.92)"; x.lineWidth = Math.max(1.4, ns * .045);
          for (const p of write(word, (ns - tw) / 2, ns * .6 + s * .3, s, seed)) { x.beginPath(); p.forEach(([a, b2], i) => i ? x.lineTo(a, b2) : x.moveTo(a, b2)); x.stroke(); } });
        S.notes.forEach((n, i) => { n.spr = noteSpr(n.col, n.word, 50 + i); n.back = noteSpr(n.col, "", 0, true); });
        S.noteSh = make(ns * 1.5, ns * 1.5, x => { x.shadowColor = "rgba(40,48,60,.42)"; x.shadowBlur = ns * .08 * px; x.shadowOffsetY = 1000 * px; x.fillStyle = "#000"; x.fillRect(ns * .25, ns * .25 - 1000, ns, ns); });
        // the finale's notes: slapped on round the plan, each ticked or starred
        const [fcx, fcy] = L.fin; S.burst = Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU + r() * .5, d = .55 + r() * .45; return { x: clamp(b.x + (fcx + Math.cos(a) * L.w * .42 * d) * u, b.x + ns * .5, b.x + b.w - ns * .5), y: clamp(b.y + (fcy + Math.sin(a) * L.h * .38 * d) * u, b.y + ns * .5, b.y + b.h - ns * .5), /* inside the plan's own room */ rot: (r() - .5) * .5, t: .02 + i * .03, off: .52 + i * .018 + r() * .02, c: NOTE[i % 5], ph: r() * TAU, sp: .8 + r() * .5 }; });
        S.burstSpr = NOTE.map((c, i) => make(ns * .8, ns * .8, x => { const s2 = ns * .8, gr = x.createLinearGradient(0, 0, 0, s2); gr.addColorStop(0, rgba(mix(c, W3, .12))); gr.addColorStop(1, rgba(c)); x.fillStyle = gr; x.fillRect(0, 0, s2, s2); x.strokeStyle = "rgba(34,40,49,.9)"; x.lineWidth = Math.max(1.6, s2 * .07);
          x.beginPath(); if (i % 2) { const c2 = [s2 / 2, s2 / 2], pts = hstar(c2, s2 * .3); pts.forEach(([a, b2], j) => j ? x.lineTo(a, b2) : x.moveTo(a, b2)); } else { x.moveTo(s2 * .25, s2 * .52); x.lineTo(s2 * .43, s2 * .7); x.lineTo(s2 * .76, s2 * .28); } x.stroke(); }));
        // the marker, one of each colour: a white barrel, its cap posted on the end in its colour, its tip
        const ml = clamp(u * 3.1, 40, 86), md = ml * .15; S.tl = ml;
        S.tools = INKS.map(c => make(ml + 4, md + 4, x => { x.translate(2, 2); x.fillStyle = rgba(c); x.beginPath(); x.moveTo(0, md * .5); x.lineTo(ml * .05, md * .3); x.lineTo(ml * .05, md * .7); x.closePath(); x.fill();
          x.fillStyle = "#9AA1AB"; x.beginPath(); x.moveTo(ml * .05, md * .3); x.lineTo(ml * .13, md * .08); x.lineTo(ml * .13, md * .92); x.lineTo(ml * .05, md * .7); x.closePath(); x.fill();
          const gr = x.createLinearGradient(0, 0, 0, md); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.45, "#EEF0F2"); gr.addColorStop(1, "#B9BEC6"); x.fillStyle = gr; x.beginPath(); x.roundRect(ml * .13, 0, ml * .6, md, md * .2); x.fill();
          x.fillStyle = rgba(c); x.fillRect(ml * .3, 0, ml * .22, md); x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(ml * .3, md * .12, ml * .22, md * .16);
          const gc = x.createLinearGradient(0, 0, 0, md); gc.addColorStop(0, rgba(mix(c, W3, .35))); gc.addColorStop(.5, rgba(c)); gc.addColorStop(1, rgba(mix(c, K3, .35))); x.fillStyle = gc; x.beginPath(); x.roundRect(ml * .7, -md * .06, ml * .3, md * 1.12, md * .3); x.fill(); }));
        S.toolSh = make(ml + 14, md + 14, x => { x.shadowColor = "rgba(40,48,60,.4)"; x.shadowBlur = 4 * px; x.shadowOffsetY = 1000 * px; x.fillStyle = "#000"; x.beginPath(); x.roundRect(7, 7 - 1000, ml, md, md / 2); x.fill(); });
        // the eraser: a felt pad under a blue back
        const band = pz.band, ew = band * .4; S.band = band;
        S.sponge = make(ew + 8, band + 8, x => { x.translate(4, 4); x.fillStyle = "#AEB4BB"; x.beginPath(); x.roundRect(0, 0, ew, band, ew * .18); x.fill(); const gr = x.createLinearGradient(0, 0, ew, 0); gr.addColorStop(0, "#3F6FD6"); gr.addColorStop(1, "#224AA6"); x.fillStyle = gr; x.beginPath(); x.roundRect(ew * .12, band * .05, ew * .76, band * .9, ew * .2); x.fill();
          x.fillStyle = "rgba(255,255,255,.28)"; x.beginPath(); x.roundRect(ew * .2, band * .1, ew * .18, band * .8, ew * .1); x.fill(); x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(ew * .46, band * .22, ew * .08, band * .56); });
        S.spongeSh = make(ew + 30, band + 30, x => { x.shadowColor = "rgba(40,48,60,.35)"; x.shadowBlur = 7 * px; x.shadowOffsetY = 1000 * px; x.fillStyle = "#000"; x.beginPath(); x.roundRect(15, 15 - 1000, ew, band, ew * .2); x.fill(); });
        S.wipe = wipePath(pz.passes, band, b, u);
      }
      pace(S.phases, u);
      S.all = S.phases.flatMap(p => p.strokes); S.end = S.all[S.all.length - 1].t1;
      for (const st of S.all) (chalk ? (chalkSegs(S.full.x, st, 0, st.n), chalkHalo(S.full.x, st, st.len)) : markerLine(S.full.x, st, st.len));
      // the dust the chalk sheds as it goes: where each speck leaves the line, how it falls, and when
      S.dust = []; if (chalk) for (const st of S.all) { const n = Math.ceil((st.t1 - st.t0) / .05); for (let k = 0; k < n; k++) { const t = lerp(st.t0, st.t1, (k + r()) / n), q = along(st, done(st, t)); S.dust.push({ t, x: q[0], y: q[1], vx: (r() - .5) * 26, vy: 4 + r() * 14, s: .6 + r() * 1.1, life: Math.min(.5 + r() * .7, K.LOOP - .05 - t), c: st.col }); } /* all of it settled before the loop comes round */ }
      S.live.n = S.live.k = 0;
    },
    /** the wet the sponge leaves, worked out once, small, and stretched soft: how far each point lies inside the passes
     *  (their edges ragged, as a wet edge is), which decides when it dries — the edges first, then in patches, as a slate
     *  dries; its colour, a wet slate's, with the window's sheen across it and the sponge's streaks down each pass */
    wet() {
      const { W, H } = S, st = S.wipe, band = S.band, hb = band / 2, q = 1 / 3;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [a, b] of st.p) { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); }
      x0 = Math.max(0, x0 - hb); y0 = Math.max(0, y0 - hb); x1 = Math.min(W, x1 + hb); y1 = Math.min(H, y1 + hb);
      const w = Math.max(1, Math.ceil((x1 - x0) * q)), h = Math.max(1, Math.ceil((y1 - y0) * q)), segs = [];
      for (let i = 1; i < st.p.length; i++) segs.push([st.p[i - 1], st.p[i]]);
      const n1 = noise2(3), n2 = noise2(8), n3 = noise2(13), depth = new Float32Array(w * h), edge = new Float32Array(w * h), tone = new Float32Array(w * h), cS = (x0 + x1) / 2 + (y0 + y1) / 2 * .8;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const X = x0 + (i + .5) / q, Y = y0 + (j + .5) / q, k = j * w + i; let d = 1e9;
        for (const [a, b] of segs) { const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1, t = clamp(((X - a[0]) * dx + (Y - a[1]) * dy) / l2); d = Math.min(d, Math.hypot(X - a[0] - dx * t, Y - a[1] - dy * t)); }
        const cov = 1 - d / hb + (n3(X / 7, Y / 7) - .5) * .26 + (n1(X / 43 + 5, Y / 43) - .5) * .22; if (cov <= .02) { depth[k] = -1; continue; }
        edge[k] = clamp((cov - .02) / .07); depth[k] = Math.min(1, cov) * .5 + (n1(X / 34, Y / 34) * .6 + n2(X / 13 + 3.1, Y / 13 + 1.7) * .4) * .5;
        tone[k] = .5 * Math.exp(-Math.pow((X + Y * .8 - cS) / (band * 1.4), 2)) + (n2(X / 70, Y / 3.4) > .7 ? .28 : 0);
      }
      S.wetAt = { x: x0, y: y0, w: w / q, h: h / q };
      // each stage is what is still wet at that point of the drying; each ring is what dries between it and the next
      // (drawn fading over the stage after it, the two never overlap, so the wet never dips as it goes)
      const al = tau => { const o = new Float32Array(w * h); if (tau < 1) for (let k = 0; k < w * h; k++) { const v = depth[k]; if (v >= 0) o[k] = clamp((v - tau) / .07) * edge[k]; } return o; };
      const lv = [0, .2, .4, .6, .8, 1].map(al), img = f => { const [cc, xx] = canvas(w, h), im = xx.createImageData(w, h), o = im.data; for (let k = 0; k < w * h; k++) { const v = f(k); if (v <= 0) continue; const t = tone[k]; o[k * 4] = 6 + 30 * t; o[k * 4 + 1] = 12 + 38 * t; o[k * 4 + 2] = 10 + 35 * t; o[k * 4 + 3] = Math.round(122 * v); } xx.putImageData(im, 0, 0); return cc; };
      S.wetS = [0, 1, 2, 3, 4].map(i => img(k => lv[i][k])); S.wetR = [0, 1, 2, 3, 4].map(i => img(k => lv[i][k] - lv[i + 1][k]));
      // the chalk the sponge pushed along each pass, in broken streaks
      const r = rng(19); S.wpass = []; for (let i = 0; i + 1 < st.p.length - 1; i += 2) S.wpass.push({ y: st.p[i][1], xa: st.p[i][0], xb: st.p[i + 1][0], s0: st.L[i], s1: st.L[i + 1] });
      S.slurry = [-.4, -.34, .36, .41, (r() - .5) * .3].map(o => [o * band, .045 + r() * .05, .7 + r() * 1.1, [band * (.5 + r() * 1.6), band * (.12 + r() * .4)]]);
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      // a move to new room: fade out here, build it there, fade in (and if there's no room at all, fade and wait)
      const want = S.pending || !S.room ? 0 : 1; S.vis += (want - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 5));
      if (S.pending && S.vis < .03) { S.box = S.pending; S.pending = null; S.build(); }
      S.F = F; if (F < 0 && S.refit) { S.refit = false; S.fit(false); }
      const vis = S.vis, on = I > .01;
      if (vis > .005 && S.box) { if (chalk) S.lesson(T, I, A, on, vis); else S.plan(T, I, A, on, vis); }
      if (chalk) S.dustMotes(A);
      if (F >= 0 && S.box) { if (chalk) S.aplus(F); else S.notesBurst(F, A); }
      g.globalAlpha = 1;
    },
    blit(l, a) { if (a <= .003) return; g.globalAlpha = a; g.drawImage(l.c, S.lx, S.ly, l.c.width / px, l.c.height / px); g.globalAlpha = 1; },
    /** a layer brought to time t: the strokes done by then drawn whole, the one in hand drawn as far as it has gone
     *  (and all of it again from nothing if time has gone back); returns the stroke in hand */
    grow(l, list, t) {
      let n = 0; while (n < list.length && list[n].t1 <= t) n++;
      const cur = list[n], k = chalk && cur && t > cur.t0 ? Math.floor(done(cur, t) / (cur.len / cur.n)) : 0;
      if (n < l.n || (n === l.n && k < l.k)) { l.x.setTransform(1, 0, 0, 1, 0, 0); l.x.clearRect(0, 0, l.c.width, l.c.height); l.x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); l.n = l.k = 0; }
      while (l.n < n) { const st = list[l.n]; if (chalk) { chalkSegs(l.x, st, l.k, st.n); chalkHalo(l.x, st, st.len); } else markerLine(l.x, st, st.len); l.n++; l.k = 0; }
      if (chalk && cur && k > l.k) { chalkSegs(l.x, cur, l.k, k); l.k = k; }
      return cur && t > cur.t0 ? cur : null;
    },
    /** the stroke in hand, on the frame: the part the layer hasn't taken yet */
    hand(st, t, a, l = S.live) { const s = done(st, t); if (chalk) { chalkSegs(g, st, l.k, l.k + 1, s, a); chalkHalo(g, st, s, a); } else { g.globalAlpha = a; markerLine(g, st, s); g.globalAlpha = 1; } },
    /** where the tool is at time t: on a stroke, lifted between two, or coming on from past the edge or going off */
    toolAt(t, phases, OFF = .3) {
      const off = p => S.side === "l" ? [-S.tl - 30, p[1] + 30] : [S.W + S.tl + 30, p[1] + 40];
      for (const ph of phases) {
        const ss = ph.strokes, a = ss[0].t0, b = ss[ss.length - 1].t1; if (t < a - OFF || t > b + OFF) continue;
        if (t < a) { const k = E.out((t - a + OFF) / OFF), o = off(ss[0].p[0]), p = ss[0].p[0]; return { x: lerp(o[0], p[0], k), y: lerp(o[1], p[1], k), lift: 1 - k, dir: Math.PI, col: ph.col }; }
        if (t > b) { const e = ss[ss.length - 1].p, p = e[e.length - 1], o = off(p), k = E.in((t - b) / OFF); return { x: lerp(p[0], o[0], k), y: lerp(p[1], o[1], k), lift: k, dir: 0, col: ph.col }; }
        for (let i = 0; i < ss.length; i++) { const st = ss[i]; if (t > st.t1) continue;
          if (t >= st.t0) { const q = along(st, done(st, t)); return { x: q[0], y: q[1], lift: 0, dir: q[2], col: ph.col }; }
          const e = ss[i - 1].p[ss[i - 1].p.length - 1], s0 = st.p[0], k = clamp((t - ss[i - 1].t1) / (st.t0 - ss[i - 1].t1)), ke = E.io(k), d = Math.hypot(s0[0] - e[0], s0[1] - e[1]), up = Math.sin(Math.PI * k);
          return { x: lerp(e[0], s0[0], ke), y: lerp(e[1], s0[1], ke) - up * Math.min(10, d * .15), lift: up * clamp(d / (S.box.u * 2), .35, 1), dir: Math.atan2(s0[1] - e[1], s0[0] - e[0]), col: ph.col }; }
      }
      return null;
    },
    /** the chalk or the marker in the hand, its tip at the point, leaning off down to the right as a right hand holds it;
     *  lifted, it stands off the board and its shadow falls further from it */
    tool(p, a) {
      if (!p || a <= .01) return; const spr = S.tools[p.col], sh = S.toolSh, ang = (chalk ? .78 : .9) + Math.cos(p.dir) * .06 + p.lift * .1, s = 1 + p.lift * .07;
      g.save(); g.globalAlpha = a * (chalk ? .6 : .5) * (1 - p.lift * .35); g.translate(p.x + 2 + p.lift * 8, p.y + 3 + p.lift * 11); g.rotate(ang); g.drawImage(sh, -8, -sh.h2 / 2, sh.w2, sh.h2); g.restore();
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y - p.lift * 2); g.rotate(ang); g.scale(s, s); g.drawImage(spr, -2, -spr.h2 / 2, spr.w2, spr.h2); g.restore();
    },
    /** the sponge or the eraser along its path at loop time t, leaning into its passes; null before and after */
    wiper(t) { const k = (t - B.wipe[0]) / (B.wipe[1] - B.wipe[0]); if (k <= 0 || k >= 1) return null; const f = S.wipe.at(k), q = along(S.wipe.ride, f * S.wipe.ride.len); return { s: f * S.wipe.len, x: q[0], y: q[1], dir: q[2] }; },
    drawWiper(w, a, A) { if (!w || a <= .01) return; const spr = S.sponge, sh = S.spongeSh, lean = Math.cos(w.dir) * -.07 + Math.sin(A * (chalk ? 9 : 26)) * (chalk ? .03 : .05), jig = chalk ? 0 : Math.sin(A * 26) * S.box.u * .35;
      g.save(); g.globalAlpha = a * .8; g.translate(w.x + 6 + jig, w.y + 10); g.rotate(lean); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore();
      g.save(); g.globalAlpha = a; g.translate(w.x + jig, w.y); g.rotate(lean); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); },
    /** the whole drawing with the wiper's path so far taken out of it — as far as the loop has taken over (I) */
    wiped(s, vis, I) { const l = S.scr, x = l.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.drawImage(S.full.c, 0, 0); x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px);
      if (s > 0) { x.globalCompositeOperation = "destination-out"; x.strokeStyle = `rgba(0,0,0,${I.toFixed(3)})`; x.lineWidth = S.band; x.lineCap = "butt"; x.lineJoin = "miter"; trace(x, S.wipe, 0, s); x.stroke(); x.globalCompositeOperation = "source-over"; x.lineCap = "round"; x.lineJoin = "round"; }
      S.blit(l, vis); },
    /** the drawing so far, and (while the loop is only taking over, or giving back) the whole of it, crossfaded */
    redrawn(vis, I) { if (I >= .99) { S.blit(S.live, vis); return; } const l = S.scr, x = l.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.globalAlpha = 1 - I; x.drawImage(S.full.c, 0, 0);
      x.globalCompositeOperation = "lighter"; x.globalAlpha = I; x.drawImage(S.live.c, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); S.blit(l, vis); },

    /* ---------------- by night: the lesson ---------------- */
    lesson(T, I, A, on, vis) {
      const loop = on && T >= B.wipe[0] && T < S.end + 1.3, a = vis * I;
      if (!loop) { S.blit(S.full, vis); return; }
      const w = S.wiper(T), s = w ? w.s : T >= B.wipe[1] ? S.wipe.len : 0;
      // the wet: where the sponge has been, drying back from its edges in
      const dk = seg(T, B.dry[0], B.dry[1], x => x), wa = a * (T < B.dry[1] ? 1 : 0);
      if (wa > .003) {
        const st = S.wetS, f = dk * 5, i0 = Math.min(4, Math.floor(f)), fr = f - i0, W0 = S.wetAt;
        const put = (c, al) => { if (al > .003) { g.globalAlpha = al; g.drawImage(c, W0.x, W0.y, W0.w, W0.h); } };
        if (s < S.wipe.len) { const l = S.scr, x = l.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); x.drawImage(st[0], W0.x, W0.y, W0.w, W0.h); x.globalCompositeOperation = "destination-in"; x.strokeStyle = "#000"; x.lineWidth = S.band * 1.3; x.lineCap = "butt"; x.lineJoin = "miter"; trace(x, S.wipe, 0, Math.max(.1, s)); x.stroke(); x.globalCompositeOperation = "source-over"; x.lineCap = "round"; x.lineJoin = "round"; S.blit(l, wa); }
        else { if (i0 < 4) put(st[i0 + 1], wa); put(S.wetR[i0], wa * (1 - fr)); }
        // the slurry and the gloss, drying with it
        g.strokeStyle = "rgb(214,222,216)"; g.lineCap = "butt";
        S.wpass.forEach((ps, i) => { if (s <= ps.s0) return; const xe = lerp(ps.xa, ps.xb, clamp((s - ps.s0) / (ps.s1 - ps.s0))); for (const [o, al, lw, dash] of S.slurry) { const k = a * al * (1 - dk); if (k <= .003) continue; g.globalAlpha = k; g.lineWidth = lw; g.setLineDash(dash); g.lineDashOffset = i * 37 + o; g.beginPath(); g.moveTo(ps.xa, ps.y + o); g.lineTo(xe, ps.y + o); g.stroke(); } });
        g.setLineDash([]); g.lineDashOffset = 0; g.lineCap = "round";
        g.globalAlpha = 1;
      }
      // the lesson: going under the sponge, then drawn again stroke by stroke
      if (T < B.wipe[1]) S.wiped(s, vis, I);
      else { const cur = S.grow(S.live, S.all, T); S.redrawn(vis, I); if (cur) S.hand(cur, T, a); }
      // the dust: a puff where each stroke begins, specks falling from the stick as it goes
      g.fillStyle = rgba(INKS[0]);
      for (const st of S.all) { const age = T - st.t0; if (age < 0 || age > .5) continue; const k = age / .5, R = S.box.u * (.35 + .5 * E.out(k)); g.globalAlpha = a * .22 * (1 - k); g.drawImage(S.puffs[st.col], st.p[0][0] - R, st.p[0][1] - R, R * 2, R * 2); }
      for (const d of S.dust) { const age = T - d.t; if (age < 0 || age > d.life) continue; g.globalAlpha = a * .55 * (1 - age / d.life); g.fillStyle = rgba(INKS[d.c]); g.fillRect(d.x + d.vx * age, d.y + d.vy * age + 70 * age * age, d.s, d.s); }
      g.globalAlpha = 1;
      S.drawWiper(w, a, A);
      S.tool(S.toolAt(T, S.phases), a);
    },
    /** the chalk dust in the air, drifting down the board and glinting where the window's light falls (never in front of
     *  the words: it fades as it comes near them) */
    dustMotes(A) {
      const { W, H } = S; g.fillStyle = "#DDE6E0";
      for (const m of S.motes) { const x = (m.x + Math.sin(A * m.f * .21 + m.ph) * .015) * W, y = (((m.y + A * m.v) % 1) + 1) % 1 * H; let d = 99; for (const q of S.raw || []) d = Math.min(d, Math.hypot(Math.max(q[0] - x, 0, x - q[2]), Math.max(q[1] - y, 0, y - q[3]))); const near = clamp((d - 6) / 18); if (near <= 0) continue; /* fading as it comes near the words */
        const tw = Math.pow(.5 + .5 * Math.sin(A * m.f * 1.3 + m.ph), 3), l = S.lit(x, y); g.globalAlpha = (.08 + .16 * tw + l * (.18 + .5 * tw)) * near; g.beginPath(); g.arc(x, y, m.s * (.7 + l * .35), 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    },
    /** the finale: A+ in yellow, circled, stars round it; the hand comes on for it and goes, and it all fades at the end */
    aplus(F) {
      const fa = 1 - seg(F, .84, 1, E.sine), fl = S.finS; if (fa <= 0) return;
      if (!S.fin) S.fin = S.layer(); const cur = S.grow(S.fin, fl, F); S.blit(S.fin, fa); if (cur) S.hand(cur, F, fa, S.fin);
      const ph = [{ col: 2, strokes: fl }]; S.tool(S.toolAt(F, ph, .06), fa);
    },

    /* ---------------- by day: the plan ---------------- */
    plan(T, I, A, on, vis) {
      const a = vis * I, loop = on && T >= B.wipe[0] && T < S.end + 1.3;
      S.blit(S.top, vis);
      if (!loop) S.blit(S.full, vis);
      else {
        const w = S.wiper(T), s = w ? w.s : T >= B.wipe[1] ? S.wipe.len : 0;
        // what the eraser leaves: a ghost of the lines, smeared the way it went, fading
        const gh = a * env(T, B.wipe[0], B.wipe[0] + .3, B.ghost[0], B.ghost[1], E.sine);
        if (gh > .003) { S.blit(S.full, gh * .03); g.save(); g.translate(7, 1); S.blit(S.full, gh * .02); g.restore(); }
        if (T < B.wipe[1]) S.wiped(s, vis, I);
        else { const cur = S.grow(S.live, S.all, T); S.redrawn(vis, I); if (cur) S.hand(cur, T, a); }
      }
      // the notes on the board, their corners stirring; the last one peels off and flutters away, and a new one is slapped
      // on where it was (while the loop only half has the board, the note at rest shows through as much)
      const curl = n => .12 + .025 * Math.sin(A * .9 + n.ph), n3 = S.notes[2], c0 = curl(n3);
      S.notes.forEach((n, i) => { if (i < 2 || !on) S.note(n, n.x, n.y, n.rot, 1, curl(n), vis, 0); });
      if (on) {
        const ts = B.slap, tp = B.peel;
        if (T < tp[0] || T >= ts + .6) S.note(n3, n3.x, n3.y, n3.rot, 1, c0, vis, 0);
        else {
          if (I < .99) S.note(n3, n3.x, n3.y, n3.rot, 1, c0, vis * (1 - I), 0);
          if (T < tp[1]) { const k = seg(T, tp[0], tp[1], E.in); S.note(n3, n3.x, n3.y - k * S.ns * .04, n3.rot - k * .06, 1 + k * .03, c0 + k * .55 + Math.sin(A * 21) * .02 * k, a, k); }
          else if (T >= ts) { const sl = S.slap(T - ts); S.note(n3, n3.x, n3.y - sl.lift * S.ns * .08, n3.rot + sl.lift * .12, sl.sc, c0 + sl.flap, a * sl.a, sl.lift); }
          else { const k = T - tp[1], f = S.flutter(n3, k, -S.ns * .04, -.06); if (f) S.note(n3, f.x, f.y, f.rot, 1.03 + .01 * clamp(k / .3), lerp(c0 + .55, .3, clamp(k / .35)), a, 1, f.flip); }
        }
      }
      S.drawWiper(on ? S.wiper(T) : null, a, A);
      if (on && T < S.end + .4) S.tool(S.toolAt(T, S.phases), a);
    },
    /** a note slapped on, `k` seconds after it set off: coming at the board from in front of it, big and its shadow far
     *  off, landing, squashing a little and springing back, its corner flapping */
    slap(k) { const a = clamp(k / .24), b = Math.max(0, k - .24); return { sc: a < 1 ? lerp(1.6, 1, E.in(a)) : 1 - .05 * Math.sin(b * 16) * Math.exp(-b * 9), lift: 1 - E.in(a), a: clamp(k / .08), flap: a < 1 ? .06 * (1 - a) : .14 * Math.sin(b * 22) * Math.exp(-b * 6) }; },
    /** where a note that has let go is, `k` seconds on: a little up as it comes away, then falling, rocking and turning
     *  over as a leaf does, drifting off the side it's nearest; null once it's all the way off the board */
    flutter(n, k, dy = 0, dr = 0) {
      const { H, W } = S, s = n.s, vt = Math.max(H * .3, 190), dir = S.side === "l" ? -1 : 1;
      const y = n.y + dy + vt * (k - (1 - Math.exp(-2.4 * k)) / 2.4) - s * .3 * Math.sin(Math.min(k * 3, Math.PI)), x = n.x + dir * s * (.5 * k + .35 * k * k) + Math.sin(k * 3.3) * s * .3 * clamp(k * 2);
      if (y - s > H || x - s > W || x + s < 0) return null;
      return { x, y, rot: n.rot + dr + (Math.sin(k * 3.3 + .7) - Math.sin(.7)) * .55 + k * .5 * dir, flip: Math.cos(k * 4.4) };
    },
    /** a sticky note at (x, y): its shadow (further off and softer when it's off the board), its face cut where the
     *  corner has curled, and the curl, its underside toward us, lit along its lip */
    note(n, x, y, rot, sc, curl, a, lift, flip = 1) {
      if (a <= .003) return; const s = n.s * sc, h = s / 2, c = s * clamp(curl, 0, .6), fy = Math.abs(flip) < .04 ? .04 : flip, ks = n.s / S.ns;
      g.save(); g.globalAlpha = a * (.9 - lift * .45); g.translate(x + 2 + lift * s * .12, y + 4 + lift * s * .18); g.rotate(rot); g.scale(sc * ks * (1 + lift * .08), sc * ks * fy * (1 + lift * .08)); const sh = S.noteSh; g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore();
      g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(1, fy);
      g.beginPath(); g.moveTo(-h, -h); g.lineTo(h, -h); g.lineTo(h, h - c); g.quadraticCurveTo(h - c * .5, h - c * .5, h - c, h); g.lineTo(-h, h); g.closePath();
      g.save(); g.clip(); g.drawImage(fy < 0 ? n.back : n.spr, -h, -h, s, s); g.restore();
      if (c > .5) { const tip = [h - c * .42, h - c * .42], gr = g.createLinearGradient(h - c * .5, h - c * .5, tip[0], tip[1]); gr.addColorStop(0, rgba(mix(n.col, K3, .22))); gr.addColorStop(.7, rgba(mix(n.col, W3, .25))); gr.addColorStop(1, rgba(mix(n.col, W3, .55)));
        g.fillStyle = "rgba(40,48,60,.16)"; g.beginPath(); g.moveTo(h, h - c); g.quadraticCurveTo(h + c * .15, h + c * .15, h - c, h); g.closePath(); g.fill();
        g.fillStyle = gr; g.beginPath(); g.moveTo(h, h - c); g.quadraticCurveTo(h - c * .5, h - c * .5, h - c, h); g.quadraticCurveTo(tip[0] - c * .05, tip[1] + c * .12, tip[0], tip[1]); g.quadraticCurveTo(tip[0] + c * .12, tip[1] - c * .05, h, h - c); g.fill(); }
      g.restore();
    },
    /** the finale: notes slapped on round the plan one after another, each ticked or starred, and then a gust takes them
     *  off past the edge, tumbling */
    notesBurst(F, A) {
      const { W, H } = S, dir = S.side === "l" ? -1 : 1;
      for (const [i, b] of S.burst.entries()) {
        const k = (F - b.t) / .09; if (k <= 0) continue; const spr = S.burstSpr[i % S.burstSpr.length], n = { s: spr.w2, col: b.c, spr, back: spr };
        if (F < b.off) { const sl = S.slap((F - b.t) * 3.4); S.note(n, b.x, b.y - sl.lift * 8, b.rot + sl.lift * .12, sl.sc, .1 + .06 * Math.sin(A * 1.3 + b.ph) + sl.flap, sl.a, sl.lift); continue; }
        const q = (F - b.off) * 3.4, x = b.x + dir * (600 * q + 900 * q * q) * b.sp + Math.sin(q * 6 + b.ph) * n.s * .3, y = b.y - 70 * q + 320 * q * q;
        if (x - n.s > W || x + n.s < 0 || y - n.s > H) continue;
        S.note(n, x, y, b.rot + q * (2.2 + b.sp) * dir, 1.04, .1 + .25 * clamp(q * 4), 1, clamp(q * 5), Math.cos(q * 7 + b.ph));
      }
    },
  };
  return S;
}
