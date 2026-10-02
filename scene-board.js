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
//
// 1.12 b373: the forever cycle. The loop above is pass 0. Each pass after it wipes the board and draws a lesson (or a
// plan) of its own, and what it draws stays up through the quiet after it (the scene carries), until the next pass wipes
// it in its turn; a touch mid-pass eases back to the one it began on. By night the lessons are the signature's geometry;
// the solar system, the sun in the corner, each orbit as far as the board goes and each planet somewhere on its own (where,
// is dealt), the belt of rocks, a comet going by; a page of music, the grand staff ruled with a staff liner's five sticks
// at once, the clefs, a dealt key, time and tune with its bass, how it is to be played, and a keyboard with the tune's
// first keys marked; light, a beam through a prism fanned out into its colours on a screen and over a rainbow, a stick for
// each colour, and a lens bringing three rays to their focus; the water cycle, the mountain and its river, the rain, the
// sea (on either side, dealt), the sun and the arrows round; and DNA, the double helix going behind itself with its pairs
// coloured in pair by pair (which, dealt), a benzene ring and a water molecule with its angle. By day the plans are the
// signature's planning board; a flowchart whose no loops back; three sets overlapping, coloured in with the side of each
// marker so their inks mix where they meet (which inks, dealt); a roadmap winding up the board (which way, dealt), its
// milestones flagged and noted; a mind map (its leaves' places and inks dealt); a rocket launch, the dotted way to the moon
// (or a ringed planet) and the countdown ticked; and a dashboard, a pie with its key and a line going up past its target.
// A pass after the signature's peels the old plan's notes off one by one, erases the whole board and slaps the new plan's
// notes on as it is drawn. Each run of passes deals the whole pool once, never the same twice running. About one pass in
// ten, never two within four passes, is a rare one: the hand plays itself at noughts and crosses (it stops to think before
// each move, crosses win, the line is struck through them and the next game begun in the corner), or, by night, doodles a
// cat with a ball of wool, or, by day, fills the board with the doodles of a long meeting. The finale's A+ goes where the
// lesson on the board leaves room for it.
//
// 1.12 b418: the egg. Every twelfth pass (scenes.js, `K.egg`: three minutes of the list left alone) the board plays one
// of its own. By night, lines: the sponge takes the lesson off as ever, and the hand writes its lines like a pupil kept
// in after school, "I will finish my list" four times down the room, and goes for the yellow to tick the last one; the
// sponge comes back for them, and as the slate dries the next lesson comes up through it, patch by patch, a ghost of it
// first, as if it had been there under the wet all along. By day, the invader: the old plan's notes peel off and the
// eraser takes it off as ever; then, on the clean board, the hand slaps sticky notes on in rows, quick as cards dealt,
// from a neon pad (pink, orange or green, dealt), and they make a space invader, the crab; it waves its arms, the notes
// hopping to their places in its other frame as a wall of them is animated; the eraser is thrown at it from the side
// and goes back out that way, and the invader bursts into its notes, which tumble off the board each by the clearest way
// off that crosses no words; then the hand gets on with the plan, briskly, a colour at a time. Either way the pass ends
// on the picture it would have drawn, worked out as ever from its number, so the pass after it rests on just what it
// always would; the egg has dice of its own, and nothing else on the board draws any differently.
//
// 1.12 b430: the long day's hour eggs. Once in each hour of the list left alone (scenes.js, `K.long`: the first in the
// odd hours, the second in the even; never on an egg's pass, and not the sixth hour's crown) the hand draws something,
// and then the drawing comes alive. By night, the proof: the chalk draws a right triangle on the square on its long side
// and the squares on its legs, shades the two small squares in and cuts the larger in four through its middle, along the
// long side and across it; the pieces lift off the slate one by one and slide, never turning, into the big square, the
// smallest last into the hole the others leave in its middle (Perigal's dissection, 1873); the big square glows, and the
// hand writes a² + b² = c² by it and boxes it; then the proof crumbles, its dust going up off the slate toward the
// window, and a moment behind it dust comes down out of the air onto the next lesson, which is there where it settles.
// Or the rocket: the chalk draws a rocket on its pad by its tower, shades its nose and fins, draws the moon in the corner,
// counts down from three a beat at a time and draws the flame; the flame comes alive, the tower's arm swings away, smoke
// rolls out lit by the fire, and the rocket goes, on its own, up and over toward the moon and away into the slate,
// smaller and smaller, until it winks out as a star by the moon; then the moon breaks up into stardust that spreads out
// over the room, and where it has been the launch is gone and the next lesson is there. By day, the machine: the marker
// draws a contraption (a ball on a shelf, ramps zigzagging down, a row of dominoes, a seesaw, a switch on the wall wired
// to a light bulb), colours it in and taps the ball, and it runs on its own: the ball rolls down the ramps (a little
// simulation of it, turned back at each stop, bouncing on the floor), knocks the dominoes over one into the next, the last
// onto the seesaw, which throws its other end up into the switch; a spark runs up the wire and the bulb lights; then the
// eraser goes over it all, and behind the eraser is the plan, its notes slapped on. Or the maze: the marker draws a box
// open at two corners, a star past one opening and a dot at the other, and the box grows its own walls in from its sides;
// the dot sets off on its own, a line feeling its way through, stopping at each turning, trying a dead end and drawing
// back out of it, until it comes out to the star, which lights; the way is gone over in green, the maze winds itself back
// up into nothing the way it came, and the plan draws itself, every line of it at once. Each starts on what the pass
// before it left and ends on what this pass would have drawn (pic(P)), so the pass after it rests on just what it always
// would; each keeps to the room the words leave (what drifts goes out at its edge); the eggs have dice of their own, and
// nothing else on the board draws any differently.
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
  // by day, a pass after the signature's: its notes peel off from `peel`, `gap` apart; the eraser; the ghost it leaves
  const BW = { peel: .3, gap: .42, wipe: [1.35, 3.35], ghost: [3.35, 4.6] };
  // 1.12 b418, the egg's beats. By night: the sponge as ever, the lines, the tick, the sponge again, and the slate drying
  // with the next lesson in it. By day: the old plan off as ever; on the clean board, the invader slapped on, its arms up
  // and down, the eraser thrown, the notes blown off; then the pass's own plan, its clock starting at `plan` (at the
  // moment the marker sets off for the board) and running `k` times as fast as a pass's own.
  const EG = chalk ? { wipe: [.5, 2.2], dry: [2.2, 5.6], lines: [2.4, 10.1], tick: [10.4, 10.75], wipe2: [11.15, 12.65], dry2: [12.65, 14.85] }
    : { slap: [3.45, 4.85], toggle: [5.05, 5.85], throw: [5.8, 6.35], burst: [6.35, 8.1], plan: 7.5, k: 1.65 };
  const INV = [[255, 92, 164], [255, 140, 44], [64, 200, 116]]; /* the invader's notes: a neon pad, pink, orange or green */
  const INKS = chalk ? [[246, 243, 234], [140, 196, 255], [250, 226, 118], [255, 152, 190], [152, 226, 146], [255, 182, 104], [202, 166, 255]] /* white, blue, yellow chalk; and for the forever cycle's lessons, pink, green, orange, violet */
    : [[34, 40, 49], [36, 87, 197], [38, 150, 84], [204, 44, 36], [124, 60, 178], [234, 122, 22]]; /* black, blue, green, red marker; purple, orange */
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
    // the forever cycle's lessons and plans want a few more
    t: ".32:.14,.1 .13,.86 .19,.98 .3,.97|.02,.44 .3,.43",
    r: ".38:.06,.43 .06,1|.06,.7 .14,.51 .26,.43 .37,.46",
    u: ".5:.05,.43 .06,.8 .16,.97 .31,1 .44,.88 .46,.43;.46,.43 .47,1",
    m: ".74:.05,.43 .05,1|.05,.63 .15,.46 .27,.43 .35,.53 .36,1|.36,.63 .46,.46 .58,.43 .67,.53 .69,1",
    g: ".5:.44,.52 .28,.42 .09,.5 .03,.72 .13,.94 .3,.98 .44,.84|.46,.43 .46,1.18 .37,1.33 .19,1.36 .05,1.27",
    k: ".48:.07,-.02 .06,1|.43,.43 .07,.74;.07,.74 .46,1",
    v: ".48:.02,.43 .24,1;.24,1 .46,.43",
    w: ".7:.02,.43 .17,1;.17,1 .35,.55;.35,.55 .52,1;.52,1 .68,.43",
    f: ".36:.34,.06 .25,-.01 .15,.03 .12,.2 .12,1|.01,.44 .31,.44",
    "?": ".46:.06,.2 .14,.04 .28,0 .42,.08 .44,.24 .34,.38 .22,.48 .22,.7|.22,.94 .23,.965",
    Y: ".58:.02,0 .29,.5;.29,.5 .56,0|.29,.5 .29,1",
    N: ".62:.06,1 .06,0;.06,0 .56,1;.56,1 .56,0",
    H: ".6:.06,0 .06,1|.54,0 .54,1|.06,.5 .54,.5",
    X: ".56:.04,0 .52,1|.52,0 .04,1",
    F: ".5:.06,1 .06,0;.06,0 .46,0|.06,.47 .38,.47",
    "6": ".52:.44,.06 .3,0 .14,.08 .05,.34 .04,.66 .12,.92 .28,1 .44,.94 .5,.76 .44,.56 .28,.5 .12,.56 .06,.7",
    "9": ".52:.46,.36 .38,.5 .22,.52 .08,.42 .06,.2 .18,.04 .34,0 .46,.1 .48,.3 .46,.62 .38,.9 .22,1 .08,.94",
    ".": ".2:.08,.95 .09,.97",
    "°": ".3:.15,.02 .06,.08 .06,.2 .15,.26 .24,.2 .24,.08 .15,.02",
    // the egg's lines want one more (no other line on the board has it, so nothing else written moves)
    I: ".4:.05,.01 .37,0|.21,0 .2,1|.04,1 .36,.99",
  };
  /** a curve through the points (Catmull-Rom), `n` steps to each span */
  const smooth = (q, n = 5) => { const out = [q[0]]; for (let i = 0; i < q.length - 1; i++) { const p0 = q[Math.max(0, i - 1)], p1 = q[i], p2 = q[i + 1], p3 = q[Math.min(q.length - 1, i + 2)]; for (let k = 1; k <= n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3))); } } return out; };
  const GL = {};
  for (const ch in SRC) { const i = SRC[ch].indexOf(":"); GL[ch] = { w: +SRC[ch].slice(0, i), s: SRC[ch].slice(i + 1).split("|").map(st => st.split(";").map(run => run.trim().split(/\s+/).map(p => p.split(",").map(Number)))) }; }
  const oval = (cx, rx) => [Array.from({ length: 15 }, (_, i) => { const a = -1.75 - i / 14 * TAU * 1.07; return [cx + Math.cos(a) * rx, .5 + Math.sin(a) * .5]; })];
  GL.O = { w: .66, s: [oval(.33, .31)] }; GL["0"] = { w: .5, s: [oval(.25, .23)] };
  GL.o = { w: .48, s: [[Array.from({ length: 13 }, (_, i) => { const a = -1.75 - i / 12 * TAU * 1.07; return [.24 + Math.cos(a) * .22, .715 + Math.sin(a) * .285]; })]] };
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
  // (the forever cycle's lessons and plans draw with these too)
  /** part of an ellipse (tilted by `tilt`) from a0 round through `sweep`, in one sweep of the hand, a little uneven */
  const harc = (c, rx, ry, a0, sweep, r, tilt = 0) => { const n = Math.max(8, Math.ceil(Math.abs(sweep) * Math.max(rx, ry) / 4)), wob = K.noise1(1 + Math.floor(r() * 9999), 8), ct = Math.cos(tilt), sn = Math.sin(tilt), wa = Math.min(.018, 2.4 / Math.max(rx, ry, 1)), wf = Math.max(1, Math.min(6, Math.abs(sweep) * Math.max(rx, ry) / 90)); return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = a0 + sweep * t, f = 1 + wa * (wob(t * wf) - .5), x = Math.cos(a) * rx * f, y = Math.sin(a) * ry * f; return [c[0] + x * ct - y * sn, c[1] + x * sn + y * ct]; }); };
  /** a shape shaded the way a hand shades one, back and forth across it at an angle: one stroke, zigzagging */
  const zigzag = (inside, box, gap, ang, r) => { const ux = Math.cos(ang), uy = Math.sin(ang), cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2, R = Math.hypot(box[2] - box[0], box[3] - box[1]) / 2, pts = []; let flip = false;
    for (let o = -R; o <= R; o += gap) { let a = null, b = null; for (let t = -R; t <= R; t += gap / 4) { const x = cx - uy * o + ux * t, y = cy + ux * o + uy * t; if (inside(x, y)) { if (!a) a = [x, y]; b = [x, y]; } } if (!a || Math.hypot(b[0] - a[0], b[1] - a[1]) < gap * .3) continue; const j = (r() - .5) * gap * .6; pts.push(...(flip ? [[b[0] + ux * j, b[1] + uy * j], a] : [[a[0] - ux * j, a[1] - uy * j], b])); flip = !flip; }
    return pts; };
  const inDisc = (c, R) => (x, y) => (x - c[0]) * (x - c[0]) + (y - c[1]) * (y - c[1]) < R * R;
  /** a spiral wound in from the rim of an ellipse: a note's head filled in, a dot pressed in */
  const spiral = (c, rx, ry, turns, tilt = 0, a0 = 0) => { const n = Math.max(10, Math.ceil(turns * 14)), ct = Math.cos(tilt), sn = Math.sin(tilt); return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = a0 + t * turns * TAU, k = 1 - .8 * t, x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k; return [c[0] + x * ct - y * sn, c[1] + x * sn + y * ct]; }); };
  /** an arrow's head at the end of a line, its barbs `hl` long */
  const head = (pts, hl, spread = .5) => { const e = pts[pts.length - 1], d = pts[Math.max(0, pts.length - 3)], a = Math.atan2(e[1] - d[1], e[0] - d[0]); return [[e[0] - Math.cos(a - spread) * hl, e[1] - Math.sin(a - spread) * hl], e, [e[0] - Math.cos(a + spread) * hl, e[1] - Math.sin(a + spread) * hl]]; };
  /** a line that waves as it goes, `amp` either side of it, `waves` times along it */
  const wavy = (a, b, amp, waves, n = 40, ph = 0) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, o = Math.sin(t * waves * TAU + ph) * amp; return [a[0] + dx * t - dy / L * o, a[1] + dy * t + dx / L * o]; }); };
  /** a cloud's outline in one stroke: billows over the top, scalloped where they meet, and a flat foot (`w` its width;
   *  the billows dealt a little) */
  const cloudPts = (cx, cy, w, h, nb, r) => { const B = (nb > 3 ? [[-.31, .02, .19], [-.1, -.1, .26], [.15, -.05, .22], [.34, .04, .15]] : [[-.26, .02, .22], [.02, -.08, .28], [.29, .03, .19]]).map(([x, y, q]) => [cx + (x + (r() - .5) * .03) * w, cy + y * w * (h / w > .3 ? 1.1 : .9), q * w * (.96 + r() * .08)]);
    const yb = cy + .1 * w, x0 = Math.min(...B.map(q => q[0] - q[2])) + w * .01, x1 = Math.max(...B.map(q => q[0] + q[2])) - w * .01, top = x => { let y = yb; for (const [bx, by, br] of B) { const dx = x - bx; if (Math.abs(dx) < br) y = Math.min(y, by - Math.sqrt(br * br - dx * dx)); } return y; };
    const pts = [[x0 + w * .03, yb]]; for (let i = 0; i <= 64; i++) { const x = lerp(x0, x1, i / 64); pts.push([x, top(x)]); } pts.push([x1 - w * .03, yb], [lerp(x1, x0, .5), yb + w * .012], [x0 + w * .05, yb + w * .004]); return pts; };
  /** a curve through points (a hand's, via the same spline the letters use) */
  const curve = (q, n = 8) => smooth(q, n);

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
        if (st.wait) t += st.wait; /* the hand stopping to think (a move at noughts and crosses) */
        st.t0 = t; t += st.kind === "d" ? .06 : Math.max(.08, Math.sqrt(st.len * 2.4 * u) / (10 * u)); st.t1 = t; pv = st;
      }
      const [a, b] = ph.win, k = Math.min(1.2, (b - a) / t); ph.pace = 1 / k; /* above 1: brisker than the hand's own pace; never much slower (a short list of strokes just finishes early) */
      for (const st of ph.strokes) { st.t0 = a + st.t0 * k; st.t1 = a + st.t1 * k; }
    }
  };

  /** the dust a stick sheds as it goes: where each speck leaves the line, how it falls, and when (all of it settled
   *  before the loop comes round) */
  const dustOf = (all, r) => { const out = []; for (const st of all) { const n = Math.ceil((st.t1 - st.t0) / .05); for (let k = 0; k < n; k++) { const t = lerp(st.t0, st.t1, (k + r()) / n), q = along(st, done(st, t)); out.push({ t, x: q[0], y: q[1], vx: (r() - .5) * 26, vy: 4 + r() * 14, s: .6 + r() * 1.1, life: Math.min(.5 + r() * .7, K.LOOP - .05 - t), c: st.col }); } } return out; };

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
    if (st.par) return chalkPar(x, st, k0, k1, upto, ga);
    const P = pats(x), d = st.len / st.n; x.strokeStyle = P[st.col]; x.fillStyle = P[st.col]; x.lineCap = "butt";
    if (st.soft) ga *= st.soft; /* shading, with the side of the stick */
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
  /** the staff liner's five sticks at once: each line its own chalk, catching and skipping on its own */
  const chalkPar = (x, st, k0, k1, upto, ga) => {
    const P = pats(x), d = st.len / st.n; x.strokeStyle = P[st.col]; x.fillStyle = P[st.col]; x.lineCap = "butt";
    st.par.forEach((q, j) => {
      if (k0 === 0 && upto > 0) { x.globalAlpha = .6 * ga; x.beginPath(); x.arc(q[0][0], q[0][1], st.w * .55, 0, TAU); x.fill(); }
      for (let k = k0; k < k1; k++) {
        const s0 = k * d, s1 = Math.min(upto, (k + 1) * d); if (s1 <= s0) break;
        const sm = (s0 + s1) / 2, pr = st.pr(sm + j * 41), tap = st.len - sm < 7 ? .6 + .4 * (st.len - sm) / 7 : 1;
        trace(x, st, s0, s1, q); x.globalAlpha = .6 * pr * ga; x.lineWidth = st.w * tap; x.stroke();
        x.globalAlpha = Math.min(1, .9 * pr) * ga; x.lineWidth = st.w * .5 * tap; x.stroke();
      }
    });
    x.lineCap = "round"; x.globalAlpha = 1;
  };
  /** the dust that hangs about a chalk line, a soft haze a few times its width */
  const chalkHalo = (x, st, upto, ga = 1) => { if (upto <= 0) return; if (st.par) { for (const q of st.par) { trace(x, st, 0, upto, q); x.strokeStyle = rgba(INKS[st.col]); x.globalAlpha = .03 * ga; x.lineWidth = st.w * 3.4; x.stroke(); } x.globalAlpha = 1; return; } if (st.soft) ga *= st.soft; trace(x, st, 0, upto); x.strokeStyle = rgba(INKS[st.col]); x.globalAlpha = .035 * ga; x.lineWidth = st.w * 4.6; x.stroke(); x.globalAlpha = .055 * ga; x.lineWidth = st.w * 2.4; x.stroke(); x.globalAlpha = 1; };

  /* ---------------- marker: translucent, round, streaked where the felt ran thin, pooled where it rested ---------------- */
  const markerLine = (x, st, upto) => {
    if (upto <= 0) return; const c = INKS[st.col];
    x.lineCap = "round"; x.lineJoin = "round"; x.globalCompositeOperation = "multiply";
    trace(x, st, 0, upto); x.strokeStyle = rgba(c, st.a || .88); x.lineWidth = st.w; if (st.dash) { x.setLineDash(st.dash); x.stroke(); x.setLineDash([]); } else x.stroke();
    x.fillStyle = rgba(c, .35 * (st.a || .88) / .88); const a = st.p[0]; x.beginPath(); x.arc(a[0], a[1], st.w * .52, 0, TAU); x.fill(); /* where it went down */
    if (upto >= st.len) { const b = st.p[st.p.length - 1]; x.beginPath(); x.arc(b[0], b[1], st.w * .46, 0, TAU); x.fill(); } /* and came up */
    x.globalCompositeOperation = "source-over";
    if (st.dash) return; for (const [pts, al] of st.streaks) { trace(x, st, 0, upto, pts); x.strokeStyle = `rgba(255,255,255,${al})`; x.lineWidth = Math.max(.6, st.w * .09); x.stroke(); }
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

  /* ---------------- the forever cycle: what the passes after the signature's draw ----------------
     Each lesson (and each plan) is laid out in the signature's own room, tall or wide, in units of the letter height, and
     worked out from its pass's dice alone: its details (where the planets are on their orbits, the tune, the game) and
     some of its colours. It is drawn a colour at a time, the hand going off the board for the next stick. */
  /** a lesson's pen: its strokes into its phases, at size u from (ox, oy) */
  const pen = (ox, oy, u, nph, r) => {
    const w = clamp(u * .2, 2.4, chalk ? 6 : 6.2), ph = Array.from({ length: nph }, () => []), P = (x, y) => [ox + x * u, oy + y * u];
    const put = (i, pts, k = 1, kind = "l", extra) => { const st = mk(pts, 0, w * k, kind); if (!chalk) st.streaks = streaks(st, r); if (extra) Object.assign(st, extra); ph[i].push(st); return st; };
    const say = (i, str, x, y, s, seed, al = 0, k = 1) => { const tw = width(str, s * u); write(str, ox + x * u - tw * al, oy + y * u, s * u, seed).forEach(p => put(i, p, clamp(s * .9, .8, 1.25) * k, "w")); return tw / u; };
    const disc = (i, c, R, gap = .3, ang = -.8, k = 1.6, soft = .55) => put(i, zigzag(inDisc(c, R * u * .9), [c[0] - R * u, c[1] - R * u, c[0] + R * u, c[1] + R * u], gap * u, ang, r), k, "l", { soft }); /* a round thing shaded in */
    return { u, w, ph, P, put, say, disc };
  };

  /** the solar system from the sun in the corner: each orbit as far as the board goes, each planet somewhere on its own
   *  (where, is dealt), the belt of rocks, a comet going by */
  const solar = (L, ox, oy, u, r) => {
    const d = pen(ox, oy, u, 4, r), { P, put, disc } = d, W = L.w, H = L.h, sc = [1.1, 1.3], SR = 3.3, sp = P(...sc);
    // yellow: the sun in the corner, its rim, shaded with the side of the stick, its rays
    put(0, harc(sp, SR * u, SR * u, -.1, Math.PI / 2 + .2, r), 1.15);
    put(0, zigzag((x, y) => inDisc(sp, SR * u * .93)(x, y) && x > ox + .2 * u && y > oy + .2 * u, [ox, oy, sp[0] + SR * u, sp[1] + SR * u], u * .5, -.75, r), 2.3, "l", { soft: .4 });
    for (let i = 0; i < 7; i++) { const a = (i + .5) / 7 * Math.PI / 2, r0 = SR + .55, r1 = SR + (i % 2 ? 1.35 : 2.1); put(0, hline(P(sc[0] + Math.cos(a) * r0, sc[1] + Math.sin(a) * r0), P(sc[0] + Math.cos(a) * r1, sc[1] + Math.sin(a) * r1), r), .95); }
    // white: the orbits from the inside out, each broken round its planet, and the planet on it; the belt of rocks; stars
    const Dm = Math.hypot(W - sc[0], H - sc[1]) - 1.4;
    const span = (rho, m) => { let a0 = null, a1 = 0; for (let a = 0; a <= Math.PI / 2 + 1e-9; a += .003) { const x = sc[0] + Math.cos(a) * rho, y = sc[1] + Math.sin(a) * rho; if (x < W - m && y < H - m && x > m && y > m) { if (a0 === null) a0 = a; a1 = a; } } return a0 === null ? null : [a0, a1]; };
    const ORB = [{ f: .21, r: .34 }, { f: .285, r: .54, k: 3 }, { f: .36, r: .62, k: 2, moon: 1 }, { f: .435, r: .47, k: 3 }, { f: .59, r: 1.45, bands: 1 }, { f: .72, r: 1.02, ring: 1 }, { f: .845, r: .76, k: 2, tilt: 1 }, { f: .96, r: .74, k: 2 }];
    for (const q of ORB) {
      const rho = q.f * Dm, sa = span(rho, .45); if (!sa) continue;
      const m = (q.r + .6) / rho, th = sa[1] - sa[0] > 2 * m ? lerp(sa[0] + m, sa[1] - m, r()) : (sa[0] + sa[1]) / 2, gap = (q.r + .3) / rho;
      if (th - gap > sa[0] + .01) put(1, harc(sp, rho * u, rho * u, sa[0], th - gap - sa[0], r), .72, "l", { soft: .8 });
      if (sa[1] > th + gap + .01) put(1, harc(sp, rho * u, rho * u, th + gap, sa[1] - th - gap, r), .72, "l", { soft: .8 });
      const cx = sc[0] + Math.cos(th) * rho, cy = sc[1] + Math.sin(th) * rho, c = P(cx, cy); q.at = c; q.xy = [cx, cy];
      put(1, hring(c, q.r * u, q.r * u, r, r() * TAU, .05), q.r > 1 ? 1.05 : .9);
      if (q.moon) put(1, hring(P(cx + q.r + .45, cy - .5), .17 * u, .17 * u, r, 0, .05), .7);
      if (q.ring) { const tilt = -.32, rx = q.r * 1.95, ry = q.r * .5, rp = a => { const x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]; };
        const hid = a => Math.hypot(rp(a)[0] - cx, rp(a)[1] - cy) < q.r * 1.08; let a0 = Math.PI; while (!hid(a0) && a0 < 1.5 * Math.PI) a0 += .02; let a1 = TAU; while (!hid(a1) && a1 > 1.5 * Math.PI) a1 -= .02;
        const ring = []; for (let a = a0 - .04; a >= a1 - TAU + .04; a -= .05) ring.push(P(...rp(a))); put(1, ring, .85); }
      if (q.tilt) put(1, harc(c, q.r * 1.8 * u, q.r * .34 * u, -2.2, TAU * .98, r, 1.32), .7);
    }
    { const sa = span(.51 * Dm, .5); if (sa) for (let i = 0; i < 17; i++) { const a = lerp(sa[0] + .03, sa[1] - .03, (i + r() * .8) / 17), rho = (.49 + r() * .045) * Dm, p = P(sc[0] + Math.cos(a) * rho, sc[1] + Math.sin(a) * rho); put(1, [p, [p[0] + .1 * u, p[1] + .04 * u]], .5 + r() * .55, "d"); } }
    for (const [fx, fy, s] of [[.93, .08, .42], [.56, .96, .34], [.08, .93, .38]]) put(1, hstar(P(fx * W, fy * H), s * u, (r() - .5) * .4), .8);
    // blue: the blue planets shaded in, and a comet going by, its tail streaming away from the sun
    for (const q of ORB) if (q.at && q.k === 2) disc(2, q.at, q.r, .26);
    { // the comet: where it is clearest of the planets (its tail too), its head pressed in, its tail fanning away from the sun
      let best = null; for (let j = 0; j < 40; j++) { const x = lerp(W * .3, W - 2.2, r()), y = lerp(H * .12, H - 2.2, r()), ta = Math.atan2(y - sc[1], x - sc[0]); let dmin = 1e9;
        for (const q of ORB) if (q.xy) for (const f of [0, .5, 1]) dmin = Math.min(dmin, Math.hypot(q.xy[0] - x - Math.cos(ta) * 4 * f, q.xy[1] - y - Math.sin(ta) * 4 * f) - q.r);
        if (Math.hypot(x - sc[0], y - sc[1]) < SR + 6) continue; if (!best || dmin > best.d) best = { x, y, d: dmin, ta }; }
      const { x: hx, y: hy, ta } = best, hp = P(hx, hy); ORB.comet = [hx, hy];
      put(2, spiral(hp, .34 * u, .34 * u, 2.2, 0, r() * TAU), 1.25);
      [[0, 4.8, .9], [-.13, 3.9, .7], [.14, 3.6, .7], [-.26, 2.7, .55], [.27, 2.5, .55]].forEach(([o, l, k]) => { const a0 = [hx + Math.cos(ta + o * 1.6) * .42, hy + Math.sin(ta + o * 1.6) * .42], bend = o * .35;
        put(2, curve([a0, [hx + Math.cos(ta + o + bend * .5) * l * .5, hy + Math.sin(ta + o + bend * .5) * l * .5], [hx + Math.cos(ta + o + bend) * l, hy + Math.sin(ta + o + bend) * l]].map(q => P(...q)), 10), k, "l", { soft: .55 + .45 * k }); });
      for (let i = 0; i < 3; i++) { const a = ta + (r() - .5) * .6, l = 1.2 + r() * 3, p = P(hx + Math.cos(a) * l, hy + Math.sin(a) * l); put(2, [p, [p[0] + .06 * u, p[1]]], .5, "d"); } }
    // orange: Venus and Mars shaded in, Jupiter's bands and its spot
    for (const q of ORB) if (q.at && q.k === 3) disc(3, q.at, q.r, .24);
    { const q = ORB[4]; if (q.at) { const [cx, cy] = q.xy; for (const [o, k] of [[-.5, .8], [-.12, 1], [.3, .9]]) { const hw = Math.sqrt(1 - o * o) * q.r * .88; put(3, hline(P(cx - hw, cy + o * q.r), P(cx + hw, cy + o * q.r + .05), r, .03), k); }
      put(3, hring(P(cx + q.r * .38, cy + q.r * .52), q.r * .26 * u, q.r * .14 * u, r, 0, .08), .75); } }
    d.cols = [2, 0, 1, 5]; d.wins = [[2.4, 3.8], [4.2, 10.3], [10.7, 12.1], [12.5, 14.0]];
    { let fb = null; const fs = L.w > 23 ? 1.7 : 2.2; for (let j = 0; j < 66; j++) { const x = lerp(fs * 1.4, W - fs * 1.4, (j % 11) / 10), y = lerp(fs * 1.3, H - fs * 1.3, Math.floor(j / 11) / 5); if (Math.hypot(x - sc[0], y - sc[1]) < SR + 3.4) continue; /* the A+ where the planets and the comet leave it most room */
        let m = 1e9; for (const q of ORB) if (q.xy) m = Math.min(m, Math.hypot(q.xy[0] - x, q.xy[1] - y) - q.r * (q.ring ? 2 : 1)); if (ORB.comet) m = Math.min(m, Math.hypot(ORB.comet[0] - x, ORB.comet[1] - y) - 1.5); if (!fb || m > fb.m) fb = { x, y, m }; }
      d.fin = [fb.x, fb.y, fs]; }
    return d;
  };

  /** the staff's line gap for each room (the liner is cut to it), where the two staves sit, and the keyboard under them */
  const MUSIC = { tall: { g: .78, tops: [3.4, 11.2], bars: 3, keys: [1, 21, 17.6, 24.6] }, wide: { g: .64, tops: [1.6, 7.9], bars: 4, keys: [1.5, 24.5, 12.9, 17.7] } };
  /** the clefs, in staff gaps from the staff's top line: the G clef's spiral round its line, the F clef's curl and dots */
  const GCLEF = [[1.25, 3.05], [1.45, 2.6], [1.25, 2.2], [.8, 2.15], [.45, 2.5], [.35, 3.1], [.55, 3.65], [1.1, 3.95], [1.7, 3.8], [2.05, 3.3], [2, 2.6], [1.6, 2], [1.1, 1.5], [.8, .85], [.8, 0], [1, -.75], [1.35, -1.15], [1.6, -.9], [1.62, -.3], [1.4, .35], [1.15, 1.2], [1.1, 2.2], [1.15, 3.2], [1.25, 4.3], [1.25, 5], [1.05, 5.45], [.7, 5.5], [.45, 5.25]];
  const FCLEF = [[.45, 1.02], [.42, .5], [.9, .1], [1.55, .12], [1.98, .6], [2.02, 1.38], [1.66, 2.3], [1.02, 3.08], [.26, 3.6]];
  /** a page of music: the grand staff ruled with the liner, the clefs, the key and the time, a tune (dealt: its notes and
   *  its rhythm) with the bass under it, how it is to be played, and a keyboard with the tune's first keys marked */
  const music = (L, ox, oy, u, r, k) => {
    const d = pen(ox, oy, u, 4, r), { P, put, say } = d, M = MUSIC[k], g = M.g, W = L.w, x0 = .9, x1 = W - .5, [tT, tB] = M.tops, bot = tB + 4 * g;
    const Y = (top, s) => top + (8 - s) * g / 2; /* a staff step (0 the bottom line, 8 the top) to the board */
    // the liner: each staff's five lines at once
    for (const t of M.tops) { const mid = hline(P(x0, t + 2 * g), P(x1, t + 2 * g), r, .0025); put(0, mid, .8, "l", { par: [-2, -1, 0, 1, 2].map(j => mid.map(([x, y], i) => [x, y + j * g * u + Math.sin(i * 1.3 + j * 2) * .35])) }); }
    // white: the brace and the line that joins the staves, the clefs, the key, the time, the bar lines
    const bh = bot - tT; put(1, curve([[x0 - .12, tT], [x0 - .52, tT + bh * .1], [x0 - .46, tT + bh * .38], [x0 - .86, tT + bh * .5], [x0 - .46, tT + bh * .62], [x0 - .52, tT + bh * .9], [x0 - .12, bot]].map(q => P(...q)), 8), 1.1);
    put(1, hline(P(x0, tT), P(x0, bot), r, .004), .9);
    const cx = x0 + .35; put(1, curve(GCLEF.map(([a, b]) => P(cx + a * g, tT + b * g)), 7), 1.05); put(1, spiral(P(cx + .62 * g, tT + 5.12 * g), .2 * g * u, .2 * g * u, 1.6), 1.1);
    put(1, spiral(P(cx + .5 * g, tB + 1 * g), .2 * g * u, .2 * g * u, 1.6), 1.2); put(1, curve(FCLEF.map(([a, b]) => P(cx + a * g, tB + b * g)), 7), 1.05);
    for (const yy of [.55, 1.45]) put(1, spiral(P(cx + 2.5 * g, tB + yy * g), .12 * g * u, .12 * g * u, 1.4), 1);
    const nsh = Math.floor(r() * 3), sharp = (x, y) => { for (const dx of [.28, .72]) put(1, hline(P(x + dx * g, y - 1.25 * g), P(x + dx * g + .05 * g, y + 1.35 * g), r, .01), .7); for (const dy of [-.42, .48]) put(1, hline(P(x - .02 * g, y + (dy + .14) * g), P(x + 1.02 * g, y + (dy - .14) * g), r, .01), 1.3); };
    let kx = cx + 2.75 * g; for (let i = 0; i < nsh; i++) { sharp(kx, Y(tT, [8, 5][i])); sharp(kx, Y(tB, [6, 3][i])); kx += 1.15 * g; }
    const three = r() < .35, beats = three ? 3 : 4, tx = kx + .25 * g;
    for (const t of M.tops) { say(1, three ? "3" : "4", tx, t + 2 * g, 2 * g, 60 + t, 0, 1.05); say(1, "4", tx, t + 4 * g, 2 * g, 70 + t, 0, 1.05); }
    const bx0 = tx + 1.7 * g, bw = (x1 - .5 - bx0) / M.bars, bars = Array.from({ length: M.bars + 1 }, (_, i) => bx0 + i * bw);
    for (let i = 1; i < M.bars; i++) put(1, hline(P(bars[i], tT), P(bars[i], bot), r, .004), .85);
    put(1, hline(P(x1 - .45, tT), P(x1 - .45, bot), r, .003), .8); put(1, hline(P(x1 - .08, tT), P(x1 - .08, bot), r, .003), 2.2);
    // the keyboard: its case, the white keys' edges, the black keys filled in
    const [kx0, kx1, ky0, ky1] = M.keys, nk = 14, kw = (kx1 - kx0) / nk;
    put(1, hbox(ox + kx0 * u, oy + ky0 * u, ox + kx1 * u, oy + ky1 * u, r, .1 * u), 1);
    for (let i = 1; i < nk; i++) put(1, hline(P(kx0 + i * kw, ky0 + .05), P(kx0 + i * kw, ky1 - .05), r, .004), .7);
    for (let i = 1; i < nk; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) { const bx = kx0 + i * kw, bw2 = kw * .3, by0 = ky0 + .06, by1 = ky0 + (ky1 - ky0) * .6;
      put(1, poly([P(bx - bw2, by0), P(bx - bw2, by1), P(bx + bw2, by1), P(bx + bw2, by0)], r, .004), .6);
      put(1, zigzag((x, y) => x > ox + (bx - bw2 + .1) * u && x < ox + (bx + bw2 - .1) * u && y > oy + (by0 + .1) * u && y < oy + (by1 - .1) * u, [ox + (bx - bw2) * u, oy + by0 * u, ox + (bx + bw2) * u, oy + by1 * u], u * .24, -.95, r), 1, "l", { soft: .55 }); }
    // blue: the tune (a walk of notes, dealt, ending home) and the bass under it
    const RH = beats === 4 ? [[1, 1, 1, 1], [.5, .5, 1, 1, 1], [1, .5, .5, 1, 1], [2, 1, 1], [1, 1, 2], [.5, .5, .5, .5, 1, 1], [1.5, .5, 2]] : [[1, 1, 1], [.5, .5, 1, 1], [2, 1], [1, .5, .5, 1], [1.5, .5, 1]];
    const LAST = beats === 4 ? [[2, 2], [4], [1, 1, 2]] : [[3], [2, 1]];
    const rx = .64 * g, ry = .46 * g, tilt = -.38, notes = []; let st = 2 + Math.floor(r() * 4);
    for (let b = 0; b < M.bars; b++) { const pat = b === M.bars - 1 ? LAST[Math.floor(r() * LAST.length)] : RH[Math.floor(r() * RH.length)]; let at = 0;
      pat.forEach((du, i) => { if (b || i) st = clamp(st + [-2, -1, -1, 1, 1, 2, 0][Math.floor(r() * 7)], -1, 9); if (b === M.bars - 1 && i === pat.length - 1) st = [1, 4, 8][Math.floor(r() * 3)];
        notes.push({ b, at, du, s: st, x: bars[b] + .55 + (at / beats) * (bw - .9) + rx * .6 }); at += du; }); }
    const noteAt = (top, n, stemDir) => { const x = n.x, y = Y(top, n.s), c = P(x, y);
      if (n.s <= -2) for (let s = -2; s >= n.s; s -= 2) put(2, hline(P(x - rx * 1.6, Y(top, s)), P(x + rx * 1.6, Y(top, s)), r, .01), .7); /* ledger lines */
      if (n.s >= 10) for (let s = 10; s <= n.s; s += 2) put(2, hline(P(x - rx * 1.6, Y(top, s)), P(x + rx * 1.6, Y(top, s)), r, .01), .7);
      if (n.du >= 2) put(2, harc(c, rx * u, ry * u, -2.4, TAU * 1.04, r, tilt), .75); else put(2, spiral(c, rx * u * .92, ry * u * .92, 2.2, tilt, -2.4), 1.35);
      if (n.du % 1 === .5 && n.du > 1) put(2, spiral(P(x + rx * 1.9, y - (n.s % 2 ? 0 : g * .25)), .1 * g * u, .1 * g * u, 1.2), 1); /* a dotted note */
      if (n.du >= 4) return null; const up = stemDir ?? n.s < 4, sx = x + (up ? rx * .92 : -rx * .92), sy1 = y + (up ? -3.3 * g : 3.3 * g); put(2, hline(P(sx, y + (up ? -.1 : .1) * g), P(sx, sy1), r, .006), .8); return [sx, sy1, up]; };
    for (let i = 0; i < notes.length; i++) { const n = notes[i], m = notes[i + 1];
      if (n.du === .5 && m && m.du === .5 && m.b === n.b && Math.floor(n.at) === Math.floor(m.at)) { const up = (n.s + m.s) / 2 < 4, a = noteAt(tT, n, up), c = noteAt(tT, m, up); put(2, hline(P(a[0], a[1]), P(c[0], c[1] + (m.s - n.s) * g * .12), r, .01), 2.3); i++; continue; }
      const e = noteAt(tT, n); if (n.du === .5 && e) put(2, curve([[e[0], e[1]], [e[0] + .45 * g, e[1] + (e[2] ? 1 : -1) * 1.1 * g], [e[0] + .75 * g, e[1] + (e[2] ? 1 : -1) * 2.3 * g], [e[0] + .5 * g, e[1] + (e[2] ? 1 : -1) * 3 * g]].map(q => P(...q)), 6), .9); /* a flag */ }
    for (let b = 0; b < M.bars; b++) { const two = r() < .6 && b < M.bars - 1; for (let j = 0; j < (two ? 2 : 1); j++) { const s = 1 + Math.floor(r() * 5); noteAt(tB, { x: bars[b] + .55 + j * (bw - .9) / 2 + rx * .6, s, du: two ? 2 : beats === 4 ? 4 : 3 }); } }
    // yellow: a slur over the first bar, piano to begin, a swell, forte, a pause held on the last note; the first bar's keys
    const b0 = notes.filter(n => n.b === 0), hiS = Math.max(...b0.map(n => n.s)) + 3.2; if (b0.length > 1) put(3, curve([[b0[0].x, Y(tT, hiS - .8)], [(b0[0].x + b0[b0.length - 1].x) / 2, Y(tT, hiS + 1.1)], [b0[b0.length - 1].x, Y(tT, hiS - .8)]].map(q => P(...q)), 10), .8);
    const dy = tT + 4 * g + 1.35; say(3, "p", bars[0] + .3, dy + .5, 1.1, 81); say(3, "f", bars[Math.min(2, M.bars - 1)] + .3, dy + .5, 1.1, 82);
    put(3, [P(bars[1] + .4, dy + .05), P(bars[1] + bw - .8, dy - .45)], .8); put(3, [P(bars[1] + .4, dy + .15), P(bars[1] + bw - .8, dy + .6)], .8);
    { const n = notes[notes.length - 1], up = n.s < 4 && n.du < 4, hy = Y(tT, n.s), fy = Math.min(up ? hy - 3.3 * g : hy - .7 * g, tT) - 1.1 * g; put(3, harc(P(n.x, fy), .78 * g * u, .62 * g * u, Math.PI, Math.PI, r), .85); put(3, spiral(P(n.x, fy - .12 * g), .11 * g * u, .11 * g * u, 1.2), 1.1); }
    const kd = [...new Set(b0.map(n => n.s))]; for (const s of kd) { const ki = s + 2; if (ki < 0 || ki >= nk) continue; put(3, spiral(P(kx0 + (ki + .5) * kw, ky1 - (ky1 - ky0) * .18), .22 * u, .22 * u, 1.8), 1.2); }
    d.cols = [0, 0, 1, 2]; d.tools = ["liner", null, null, null]; d.wins = [[2.4, 3.5], [3.8, 8.4], [8.8, 12.2], [12.6, 14.1]];
    d.fin = k === "tall" ? [17.8, 15.9, 1.55] : [21.6, 11.4, 1.6];
    return d;
  };
  const at2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
  /** light: a beam through a prism fanned out into its colours on a screen, a rainbow over the corner in the same
   *  colours, and a lens bringing three rays to their focus. White first, then each colour in its turn */
  const prism = (L, ox, oy, u, r, k) => {
    const d = pen(ox, oy, u, 7, r), { P, put, say } = d, tall = k === "tall";
    const G = tall ? { ap: [8.6, 2.4], s: 9.2, src: [.4, 4.3], sx: 21.3, sy: [8.4, 14.6], rb: [17.7, 5.7, 2.5, 4.2], ax: [.6, 21.3, 20.7], ln: [8.3, 3.9], lr: [-2.5, 0, 2.5], fx: 15.3, fin: [4.2, 13.8, 1.7] }
      : { ap: [6.2, 1.1], s: 8.4, src: [.3, 2.9], sx: 16.6, sy: [6.1, 10.9], rb: [21.8, 7.4, 2.3, 3.9], ax: [.5, 15.2, 14.3], ln: [5.2, 3.0], lr: [-2, 0, 2], fx: 11.3, fin: [22.9, 13.6, 1.6] };
    const [apx, apy] = G.ap, hs = G.s / 2, by = apy + G.s * .866, bl = [apx - hs, by], br = [apx + hs, by], at = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
    const A = at(G.ap, bl, .36 + r() * .12), Bq = at(G.ap, br, .5 + r() * .12); G.rb = [G.rb[0], G.rb[1], G.rb[2] * (.92 + r() * .12), G.rb[3] * (.95 + r() * .08)];
    // white: the prism, the beam in (and its arrow), the normals where it goes in and out, the ray inside, the screen
    put(0, poly([P(...G.ap), P(...br), P(...bl), P(apx - .06, apy - .1)], r, .008), 1.15);
    const beam = hline(P(...G.src), P(...A), r, .004); put(0, beam, 1.1); put(0, head(beam.slice(0, Math.ceil(beam.length * .55)), .6 * u), .9);
    for (const [p, q] of [[A, bl], [Bq, br]]) { const fx = q[0] - G.ap[0], fy = q[1] - G.ap[1], fl = Math.hypot(fx, fy), nx = -fy / fl * (p === A ? -1 : 1), ny = fx / fl * (p === A ? -1 : 1);
      for (let j = -2; j <= 1; j++) put(0, hline(P(p[0] + nx * (j * .8 + .15), p[1] + ny * (j * .8 + .15)), P(p[0] + nx * (j * .8 + .55), p[1] + ny * (j * .8 + .55)), r, .01), .5, "l", { soft: .7 }); }
    put(0, hline(P(...A), P(...Bq), r, .005), .85);
    put(0, hline(P(G.sx + .15, G.sy[0] - 1.3), P(G.sx + .15, G.sy[1] + 1.3), r, .004), 1.2);
    for (let yy = G.sy[0] - 1.1; yy < G.sy[1] + 1.2; yy += .75) put(0, [P(G.sx + .25, yy), P(G.sx + .75, yy - .45)], .55, "l", { soft: .7 });
    // the lens's axis, and the clouds the rainbow stands on
    put(0, hline(P(G.ax[0], G.ax[2]), P(G.ax[1], G.ax[2]), r, .003), .6, "l", { soft: .75 });
    { const [lx0, lh] = G.ln; for (const sd of [-1, 1]) put(0, curve([[lx0, G.ax[2] - lh], [lx0 + sd * .95, G.ax[2]], [lx0, G.ax[2] + lh]].map(q => P(...q)), 12), 1); } /* the lens */
    const [rcx, rcy, rr0, rr1] = G.rb; for (const sx of [-1, 1]) put(0, cloudPts(ox + (rcx + sx * (rr0 + rr1) / 2) * u, oy + (rcy + .15) * u, 2.6 * u, 1.1 * u, 3, r), .8);
    // the colours, one stick each: its ray out of the prism, where it lands on the screen, its band of the rainbow; the
    // yellow brings the lens's rays to their focus, the blue draws the lens
    const COL = [3, 5, 2, 4, 1, 6];
    COL.forEach((c, i) => { const ph = i + 1, ty = lerp(G.sy[0], G.sy[1], i / 5), o = (i - 2.5) * .06;
      put(ph, hline(P(Bq[0], Bq[1] + o), P(G.sx, ty), r, .004), 1.05);
      put(ph, [P(G.sx - .1, ty - .28), P(G.sx - .08, ty + .28)], 2.1);
      const rad = lerp(rr1, rr0, i / 5); put(ph, harc(P(rcx, rcy), rad * u, rad * u, Math.PI + .03, Math.PI - .06, r), 1.7);
      if (c === 2) { const [lx0, lh] = G.ln; for (const dy of G.lr) { const y0 = G.ax[2] + dy, ray = [P(G.ax[0] + .2, y0), P(lx0, y0), P(G.fx, G.ax[2]), P(G.fx + (G.fx - lx0) * .45, G.ax[2] - dy * .45)]; put(ph, ray, .8); }
        put(ph, hstar(P(G.fx, G.ax[2]), .55 * u, .2), .9); say(ph, "F", G.fx + .1, G.ax[2] + 2.1, 1.1, 97, .5); }
      if (c === 1) { const [lx0, lh] = G.ln, bx = ox + lx0 * u, byc = oy + G.ax[2] * u; put(ph, zigzag((x, y) => { const t = (y - byc) / (lh * u); return Math.abs(t) < .92 && Math.abs(x - bx) < .9 * u * (1 - t * t); }, [bx - u, byc - lh * u, bx + u, byc + lh * u], u * .22, -.6, r), 1, "l", { soft: .5 }); } /* the glass tinted */
    });
    d.cols = [0, ...COL]; d.wins = [[2.4, 6.3], [6.7, 7.6], [7.9, 8.8], [9.1, 10.6], [10.9, 11.7], [12.0, 13.0], [13.3, 14.05]];
    d.fin = G.fin;
    return d;
  };

  /** the water cycle: the sea, the mountain and its river, the trees at its foot; the cloud raining on it; the sun, and
   *  the arrows round the cycle (up off the sea, over to the cloud) */
  const water = (L, ox, oy, u, r, k) => {
    const d = pen(ox, oy, u, 4, r), { put } = d, tall = k === "tall", flip = r() < .5, X = x => flip ? L.w - x : x, P = (x, y) => d.P(X(x), y); /* the sea on either side, dealt */
    const G = tall ? { mt: [[.3, 22.6], [2.2, 18.2], [3.4, 16.4], [5, 12.6], [5.9, 11], [6.8, 12.4], [7.6, 11.6], [8.5, 13.2], [10.4, 16.6], [12.2, 20.2], [13.4, 22.6], [14.2, 23.1]],
      snow: [[4.75, 13.1], [5.35, 13.9], [5.9, 13.1], [6.5, 13.8], [7.1, 12.9], [7.6, 13.6], [8.2, 12.9]], sea: [14, 21.8, 23.1, 1.3], river: [[7.2, 14.2], [7.9, 15.6], [7.5, 16.9], [8.6, 18.2], [9.8, 19.4], [10.6, 20.8], [12, 21.8], [13.9, 23]],
      trees: [[1.7, 22.6, 2.3], [2.9, 22.7, 1.8], [11.4, 21.4, 1.9]], cloud: [6.6, 4.7, 8.4, 3.3], cloud2: [12.6, 2.4, 4.4, 1.7], rain: [3.6, 9.8, 7.1, 10.6], sun: [18.3, 4.3, 1.9], evap: [15.2, 17.4, 19.6], ey: [22.2, 14.7], cond: [[17.4, 12.6], [15.8, 8.2], [12.2, 5.8]], fin: [5.6, 25, 1.5] }
      : { mt: [[.2, 15.6], [1.8, 12.4], [3, 10], [4.3, 7.2], [5.1, 6], [5.9, 7], [6.6, 6.4], [7.4, 7.7], [9, 10.5], [10.6, 13.3], [11.8, 15.6], [12.6, 16]],
      snow: [[3.9, 8], [4.5, 8.7], [5.1, 7.9], [5.7, 8.6], [6.2, 7.8], [6.7, 8.4], [7.3, 7.9]], sea: [12.4, 25.8, 16, .95], river: [[6.2, 8.7], [6.9, 9.9], [6.5, 11.1], [7.6, 12.2], [8.9, 13.2], [10.1, 14.4], [12.4, 15.9]],
      trees: [[1.3, 15.6, 1.8], [2.4, 15.7, 1.4], [10.5, 14.4, 1.6]], cloud: [9.4, 3, 7, 2.7], cloud2: [15.6, 1.9, 3.8, 1.4], rain: [7.4, 11.6, 4.8, 7.6], sun: [22.8, 3.2, 1.7], evap: [16.4, 18.8, 21.2], ey: [15.2, 9.3], cond: [[20.3, 8.4], [17, 6.2], [13.3, 4.4]], fin: [24.1, 10.9, 1.4] };
    // white: the mountain and its snowline, the clouds
    put(0, poly(G.mt.map(q => P(...q)), r, .006), 1.1); put(0, poly(G.snow.map(q => P(...q)), r, .01), .8);
    for (let i = 0; i < 5; i++) { const t = .12 + i * .15, p0 = at2(G.mt[4], G.mt[10], t); put(0, hline(P(p0[0] - .3, p0[1] + .45), P(p0[0] - 1.25, p0[1] + 2.1 - i * .12), r, .02), .55, "l", { soft: .6 }); } /* the far side in shadow */
    for (const c of [G.cloud, G.cloud2]) put(0, cloudPts(ox + X(c[0]) * u, oy + c[1] * u, c[2] * u, c[3] * u, c === G.cloud ? 4 : 3, r), c === G.cloud ? 1.1 : .9);
    // green: the trees at the mountain's foot
    for (const [x, y, h] of G.trees) { put(1, [[x, y - h], [x + h * .28, y - h * .6], [x + h * .1, y - h * .6], [x + h * .36, y - h * .2], [x - h * .36, y - h * .2], [x - h * .1, y - h * .6], [x - h * .28, y - h * .6], [x, y - h]].map(q => P(...q)), .9); put(1, hline(P(x, y - h * .2), P(x, y), r, .02), .8); }
    // blue: the rain, the river, the sea and its waves
    const [rx0, rx1, ry0, ry1] = G.rain; for (let i = 0; i < 13; i++) { const x = lerp(rx0, rx1, (i % 7 + (i > 6 ? .5 : 0) + r() * .3) / 7), y = lerp(ry0, ry1, i > 6 ? .55 + r() * .2 : r() * .25); put(2, hline(P(x, y), P(x + (flip ? .32 : -.32), y + .95), r, .01), .8); }
    put(2, curve(G.river.map(q => P(...q)), 8), 1.1);
    const [sx0, sx1, sy, sgap] = G.sea; put(2, wavy(P(sx0, sy), P(sx1, sy), .13 * u, (sx1 - sx0) / 1.4, 90), 1.05);
    for (let j = 1; j <= 2; j++) { const y = sy + sgap * j; for (let x = sx0 + .8 + j * .6; x < sx1 - 1.4; x += 3.1) put(2, wavy(P(x, y), P(x + 1.9, y), .12 * u, 1.3, 16), .75); }
    // yellow: the sun, the water going up off the sea, and over to the cloud
    const [scx, scy, sR] = G.sun; put(3, hring(P(scx, scy), sR * u, sR * u, r, -2, .06), 1.1);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + .2; put(3, hline(P(scx + Math.cos(a) * (sR + .55), scy + Math.sin(a) * (sR + .55)), P(scx + Math.cos(a) * (sR + (i % 2 ? 1.1 : 1.5)), scy + Math.sin(a) * (sR + (i % 2 ? 1.1 : 1.5))), r, .01), .9); }
    for (const x of G.evap) { const w = wavy(P(x, G.ey[0]), P(x, G.ey[1]), .28 * u, 2.2, 36, r() * 3); put(3, w, .9); put(3, head(w, .55 * u), .9); }
    const cv = curve(G.cond.map(q => P(...q)), 10); put(3, cv, 1); put(3, head(cv, .65 * u), 1);
    d.cols = [0, 4, 1, 2]; d.wins = [[2.4, 7.0], [7.4, 8.6], [9.0, 11.6], [12.0, 14.1]]; d.fin = [X(G.fin[0]), G.fin[1], G.fin[2]];
    return d;
  };

  /** DNA's double helix, its two strands going behind each other, the rungs of its pairs coloured in pair by pair (which
   *  pairs, dealt); and beside it a benzene ring and a water molecule with its angle */
  const dna = (L, ox, oy, u, r, k) => {
    const d = pen(ox, oy, u, 5, r), { P, put, say } = d, tall = k === "tall";
    const G = tall ? { v: 1, c: 5.4, amp: 3.3, s0: .9, s1: 26, per: 8.4, bz: [16.3, 5.3, 3], o: [16.3, 14.6, 1.55], h: 3.5, hr: .95, lab: [16.3, 21.4, 1.2], fin: [16.6, 24.6, 1.5] }
      : { v: 0, c: 13.3, amp: 3.1, s0: .8, s1: 25.2, per: 8.4, bz: [4.7, 4.5, 2.7], o: [15.2, 2.6, 1.3], h: 2.9, hr: .8, lab: [21.4, 4.6, 1.1], fin: [9.9, 5.7, 1.35] };
    const at = (s, ph) => { const th = (s - G.s0) / G.per * TAU + ph, w = G.c + G.amp * Math.sin(th); return G.v ? [w, s] : [s, w]; }, ph2 = 2.4;
    const front = (s, ph) => Math.cos((s - G.s0) / G.per * TAU + ph) > 0;
    // white: the two strands, a piece at a time, the pieces behind softer
    for (const ph of [0, ph2]) { let cur = [], f = front(G.s0, ph); const flush = () => { if (cur.length > 1) put(0, cur.map(q => P(...q)), f ? 1.15 : .75, "l", f ? undefined : { soft: .5 }); };
      for (let s = G.s0; s <= G.s1 + 1e-9; s += .12) { const nf = front(s, ph); if (nf !== f) { cur.push(at(s, ph)); flush(); cur = [at(s, ph)]; f = nf; } else cur.push(at(s, ph)); } flush(); }
    // the benzene ring, its circle, the bonds off it; the water molecule, its atoms named
    const [bx, by, bR] = G.bz, hex = Array.from({ length: 7 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return P(bx + Math.cos(a) * bR, by + Math.sin(a) * bR); });
    put(0, poly(hex, r, .006), 1.05); put(0, hring(P(bx, by), bR * .58 * u, bR * .58 * u, r, -1, .05), .85);
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; put(0, hline(P(bx + Math.cos(a) * (bR + .15), by + Math.sin(a) * (bR + .15)), P(bx + Math.cos(a) * (bR + .95), by + Math.sin(a) * (bR + .95)), r, .01), .8); }
    const [qx, qy, qR] = G.o, HA = 52.25 * Math.PI / 180, Hs = [-1, 1].map(sd => [qx + sd * Math.sin(HA) * G.h, qy + Math.cos(HA) * G.h]);
    put(0, hring(P(qx, qy), qR * u, qR * u, r, -2, .05), 1.1); say(0, "O", qx, qy + .5, 1, 94, .5);
    for (const [hx, hy] of Hs) { const dx = hx - qx, dy = hy - qy, l = Math.hypot(dx, dy); for (const o of [-.12, .12]) put(0, hline(P(qx + dx / l * qR - dy / l * o, qy + dy / l * qR + dx / l * o), P(hx - dx / l * G.hr - dy / l * o, hy - dy / l * G.hr + dx / l * o), r, .01), .75);
      put(0, hring(P(hx, hy), G.hr * u, G.hr * u, r, -2, .05), .95); say(0, "H", hx, hy + .45, .9, 95 + hx, .5); }
    // the pairs: A with T (blue and yellow), C with G (pink and green), each rung its two halves; which way round, dealt
    const pair = { A: [1, 2], T: [2, 1], C: [3, 4], G: [4, 3] }, PH = { 1: 1, 2: 2, 3: 3, 4: 4 };
    for (let s = G.s0 + .55; s < G.s1 - .3; s += .78) { const a = at(s, 0), b = at(s, ph2), gap = Math.abs(G.v ? a[0] - b[0] : a[1] - b[1]); if (gap < 1.1) continue;
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], [ca, cb] = pair["ATCG"[Math.floor(r() * 4)]], sh = G.v ? [(a[0] < b[0] ? .12 : -.12), 0] : [0, (a[1] < b[1] ? .12 : -.12)];
      put(PH[ca], hline(P(a[0] + sh[0], a[1] + sh[1]), P(...m), r, .01), 1.25); put(PH[cb], hline(P(...m), P(b[0] - sh[0], b[1] - sh[1]), r, .01), 1.25); }
    // yellow also marks the water molecule's angle and says what it is; pink fills in the oxygen
    const a0 = Math.PI / 2 - HA, a1 = Math.PI / 2 + HA; put(2, harc(P(qx, qy), (qR + .75) * u, (qR + .75) * u, a0 + .06, a1 - a0 - .12, r), .85);
    say(2, "104.5°", G.lab[0], G.lab[1], G.lab[2], 96, .5);
    d.disc(3, P(qx, qy), qR * .96, .24, -.7, 1.4, .45);
    d.cols = [0, 1, 2, 3, 4]; d.wins = [[2.4, 7.4], [7.8, 9.2], [9.6, 11.6], [12.0, 13.0], [13.3, 14.1]]; d.fin = G.fin;
    return d;
  };

  /* ---------------- the rare ones ---------------- */
  /** noughts and crosses, the hand playing both sides: it thinks before each move, crosses win (along a line dealt), the
   *  line struck through them in yellow, and the tally kept */
  const ttt = (L, ox, oy, u, r, k) => {
    const d = pen(ox, oy, u, 3, r), { P, put, say } = d, tall = k === "tall", [gx, gy, c] = tall ? [11, 11.4, 4.7] : [13, 8.9, 4.2], cellC = (i, j) => [gx + (i - 1) * c, gy + (j - 1) * c];
    for (const o of [-.5, .5]) put(0, hline(P(gx + o * c, gy - 1.52 * c), P(gx + o * c + .1, gy + 1.52 * c), r, .01), 1.15);
    for (const o of [-.5, .5]) put(0, hline(P(gx - 1.52 * c, gy + o * c), P(gx + 1.52 * c, gy + o * c - .1), r, .01), 1.15);
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]], win = LINES[Math.floor(r() * 8)], rest = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter(i => !win.includes(i));
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    const xs = win.slice(); for (let i = 2; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; }
    const moves = [xs[0], rest[0], xs[1], rest[1], xs[2]];
    moves.forEach((cell, m) => { const [cx, cy] = cellC(cell % 3, Math.floor(cell / 3)), s = c * .3;
      if (m % 2 === 0) { put(0, hline(P(cx - s, cy - s), P(cx + s, cy + s), r, .02), 1.1, "l", { wait: .38 + r() * .2 }); put(0, hline(P(cx + s, cy - s), P(cx - s, cy + s), r, .02), 1.1); }
      else put(0, hring(P(cx, cy), s * 1.05 * u, s * 1.05 * u, r, -2.1, .06), 1.1, "l", { wait: .45 + r() * .25 }); });
    const [p0, p2] = [cellC(win[0] % 3, Math.floor(win[0] / 3)), cellC(win[2] % 3, Math.floor(win[2] / 3))], ex = (p2[0] - p0[0]) / Math.hypot(p2[0] - p0[0], p2[1] - p0[1]), ey = (p2[1] - p0[1]) / Math.hypot(p2[0] - p0[0], p2[1] - p0[1]);
    put(1, hline(P(p0[0] - ex * c * .45, p0[1] - ey * c * .45), P(p2[0] + ex * c * .45, p2[1] + ey * c * .45), r, .015), 1.5, "l", { wait: .2 });
    put(1, hstar(P(gx + 1.62 * c, gy - 1.55 * c), .9 * u, .15), 1);
    // and the next game begun in the corner, noughts to go first this time
    const [nx2, ny2, c2] = tall ? [16.4, 22.9, 1.75] : [3.3, 4.2, 1.5];
    for (const o of [-.5, .5]) put(2, hline(P(nx2 + o * c2, ny2 - 1.5 * c2), P(nx2 + o * c2 + .05, ny2 + 1.5 * c2), r, .01), .8, "l", o < 0 ? { wait: .3 } : undefined);
    for (const o of [-.5, .5]) put(2, hline(P(nx2 - 1.5 * c2, ny2 + o * c2), P(nx2 + 1.5 * c2, ny2 + o * c2 - .05), r, .01), .8);
    { const cell = Math.floor(r() * 9), q = [nx2 + (cell % 3 - 1) * c2, ny2 + (Math.floor(cell / 3) - 1) * c2]; put(2, hring(P(...q), c2 * .32 * u, c2 * .32 * u, r, -2.1, .06), .85, "l", { wait: .5 }); }
    d.cols = chalk ? [0, 2, 0] : [0, 3, 1]; d.wins = chalk ? [[2.4, 10.4], [10.8, 11.9], [12.3, 13.8]] : [[3.4, 10.6], [11.0, 12.1], [12.5, 13.9]]; d.fin = tall ? [5.8, 22.8, 1.6] : [23.2, 13.6, 1.5];
    return d;
  };

  /** a cat, doodled: sitting, tail curled round, its whiskers and its green eyes, pink ears and nose, hearts over it, and
   *  a ball of wool it has been at, its thread run out to the cat's paw */
  const cat = (L, ox, oy, u, r, k) => {
    const d = pen(ox, oy, u, 4, r), { put } = d, tall = k === "tall", sc = tall ? 1 : .78, dx = tall ? 0 : 2.6, dy = tall ? 0 : -1.9, flip = r() < .5, FX = x => flip ? L.w - x : x, T2 = ([x, y]) => [ox + FX(dx + x * sc) * u, oy + (dy + y * sc) * u], TT = q => q.map(T2); /* which way it sits, dealt */
    const head = [[6.1, 9.2], [5.95, 7.6], [6.35, 6.3], [6.2, 5], [6, 3.7], [6, 3.7], [7, 4.6], [7.7, 5.2], [9, 5], [10.3, 5.2], [11, 4.6], [12, 3.7], [12, 3.7], [11.8, 5], [11.65, 6.3], [12.05, 7.6], [11.9, 9.2], [10.9, 10.6], [9, 11.1], [7.1, 10.6], [6.1, 9.2]];
    const body = [[7, 10.8], [5.5, 13.2], [4.6, 16.4], [4.9, 19.4], [6, 21.3], [8, 21.8], [10, 21.8], [12, 21.3], [13.1, 19.4], [13.4, 16.4], [12.5, 13.2], [11, 10.8]];
    put(0, TT(curve(head, 6)), 1.1); put(0, TT(curve(body, 6)), 1.1);
    put(0, TT(curve([[7.7, 16], [7.4, 19], [7.6, 21.7]], 6)), .95); put(0, TT(curve([[10.3, 16], [10.6, 19], [10.4, 21.7]], 6)), .95);
    put(0, TT(curve([[12.9, 20.4], [15.2, 21], [16.8, 19.6], [16.9, 17.2], [15.8, 15.8], [14.8, 16.4], [15.2, 17.4]], 8)), 1.05);
    for (const [a, b] of [[[8.4, 5.6], [8.6, 6.4]], [[9, 5.45], [9, 6.3]], [[9.6, 5.6], [9.4, 6.4]]]) put(0, TT([a, b]), .8);
    put(0, TT(curve([[9, 9.65], [9, 9.95], [8.6, 10.25], [8.25, 10.05]], 5)), .75); put(0, TT(curve([[9, 9.95], [9.4, 10.25], [9.75, 10.05]], 5)), .75);
    for (const sd of [-1, 1]) for (const [ey, ly] of [[9.5, 8.8], [9.7, 9.7], [9.9, 10.6]]) put(0, TT([[9 + sd * 1.4, ey], [9 + sd * 3.1, (ey + ly) / 2 - .05], [9 + sd * 4.8, ly]]), .6);
    // pink: inside the ears, the nose, hearts
    put(1, TT([[6.6, 5.8], [6.35, 4.5], [7.35, 5.3]]), .85); put(1, TT([[11.4, 5.8], [11.65, 4.5], [10.65, 5.3]]), .85);
    put(1, TT([[8.6, 9.05], [9.4, 9.05], [9, 9.6], [8.6, 9.05]]), 1.1);
    const heart = (x, y, s) => TT(curve([[x, y + s * .9], [x - s * .9, y + s * .1], [x - s * .75, y - s * .55], [x - s * .2, y - s * .6], [x, y - s * .15], [x + s * .2, y - s * .6], [x + s * .75, y - s * .55], [x + s * .9, y + s * .1], [x, y + s * .9]], 5));
    put(1, heart(14.6, 4.4, .95), 1); put(1, heart(16.7, 6.6, .62), .9); put(1, heart(15.4, 8.7, .42), .8);
    // green: the eyes, their slits; blue: the ball of wool and its thread to the paw
    for (const ex of [7.85, 10.15]) { put(2, TT(curve([[ex - .75, 7.95], [ex, 7.4], [ex + .75, 7.95], [ex, 8.5], [ex - .75, 7.95]], 5)), .85); put(2, TT([[ex, 7.55], [ex + .02, 8.35]]), 1.1); }
    const [yx, yy, yr] = tall ? [18, 23.4, 1.95] : [21.3, 14.4, 1.75], YB = (x, y) => [ox + FX(x) * u, oy + y * u];
    put(3, hring(YB(yx, yy), yr * u, yr * u, r, -1.5, .05), 1.05);
    for (const [o, a, s] of [[-.35, .5, 1.6], [.2, -.4, 1.9], [.55, .9, 1.3]]) put(3, harc(YB(yx + o * yr, yy - .9 * o * yr), yr * s * u * .55, yr * s * u * .55, flip ? Math.PI - a - 2 : a, 2, r), .7);
    const paw = T2([10.9, 21.8]), start = YB(yx - yr * .7, yy - yr * .6); put(3, curve([[start[0], start[1]], [start[0] + (flip ? 1.6 : -1.6) * u, start[1] + 1.2 * u], [lerp(start[0], paw[0], .55), Math.max(start[1], paw[1]) + .3 * u], [paw[0], paw[1]]], 10), .75);
    d.cols = [0, 3, [4, 2][Math.floor(r() * 2)], [1, 6][Math.floor(r() * 2)]]; d.wins = [[2.4, 8.6], [9.0, 10.8], [11.2, 12.2], [12.6, 14.05]]; d.fin = tall ? [FX(18.7), 12.9, 1.5] : [FX(22.4), 4.8, 1.5];
    return d;
  };

  /* ---------------- by day, the plans after the signature's ---------------- */
  /** a plan's pen: the lesson's, and its notes (in units, slapped on at `slap`) and its shapes */
  const board = (L, ox, oy, u, r, nph) => {
    const d = pen(ox, oy, u, nph, r), P = d.P; d.notes = [];
    d.N = (x, y, rot, ci, word, slap) => d.notes.push({ x: ox + x * u, y: oy + y * u, rot, s: L.ns * u, col: NOTE[ci], word, ph: r() * TAU, slap });
    d.pill = (cx, cy, w, h) => { const rr = h / 2, pts = []; for (let i = 0; i <= 14; i++) { const a = -Math.PI / 2 - i / 14 * Math.PI; pts.push(P(cx - w / 2 + rr + Math.cos(a) * rr, cy + Math.sin(a) * rr)); } for (let i = 0; i <= 14; i++) { const a = Math.PI / 2 - i / 14 * Math.PI; pts.push(P(cx + w / 2 - rr + Math.cos(a) * rr, cy + Math.sin(a) * rr)); } pts.push(P(cx - w / 2 + rr + .15, cy - rr - .04)); return pts; };
    d.arrow = (i, q, k = 1, hl = .62) => { const pts = q.length > 2 ? curve(q.map(p => P(...p)), 10) : hline(P(...q[0]), P(...q[1]), r, .01); d.put(i, pts, k); d.put(i, head(pts, hl * u), k); return pts; };
    d.fill = (i, inside, box, gap = .3, ang = -.9, a = .3) => d.put(i, zigzag(inside, box.map((v, j) => (j % 2 ? oy : ox) + v * u), gap * u, ang, r), 3, "l", { a });
    d.scr = (i, x, y, len, k = .8) => d.put(i, scrawl(ox + x * u, oy + y * u, len * u, u * .85, r), k, "w");
    return d;
  };

  /** a flowchart: start, a step, a question; yes goes on to the end, no loops back to the step */
  const flow = (L, ox, oy, u, r, k) => {
    const d = board(L, ox, oy, u, r, 4), { P, put, say, pill, arrow, scr, N } = d, tall = k === "tall";
    const G = tall ? { st: [10.3, 2.3, 6.2, 2.3], pr: [7.2, 5.6, 13.4, 8.8], dm: [10.3, 13.1, 3.5, 2.6], ye: [7.2, 17.2, 13.4, 20.2], en: [10.3, 23.6, 6.2, 2.3],
        ar: [[[10.3, 3.5], [10.3, 5.45]], [[10.3, 8.95], [10.3, 10.35]], [[10.3, 15.8], [10.3, 17.05]], [[10.3, 20.35], [10.3, 22.35]]], no: [[13.85, 13.1], [17.6, 13.1], [17.6, 7.2], [13.55, 7.2]], Y: [11, 16.9], Nl: [15.4, 12.6], notes: [[3.5, 12.9, -.06], [16.9, 21.2, .05]] }
      : { st: [3.3, 3.4, 5.4, 2.2], pr: [7.6, 2.2, 12.6, 4.6], dm: [16.6, 3.4, 3, 2.3], ye: [14.1, 9.4, 19.1, 11.8], en: [23.2, 10.6, 4.8, 2.2],
        ar: [[[6.05, 3.4], [7.45, 3.4]], [[12.75, 3.4], [13.45, 3.4]], [[16.6, 5.8], [16.6, 9.25]], [[19.25, 10.6], [20.65, 10.6]]], no: [[16.6, 1.05], [16.6, .35], [10.1, .35], [10.1, 2.05]], Y: [17.2, 7.9], Nl: [13.6, 1.5], notes: [[4.4, 11], [23.4, 5.3, .06]].map(q => q.length < 3 ? [...q, -.05] : q) };
    // black: the shapes, what's in them
    put(0, pill(...G.st), 1); scr(0, G.st[0] - G.st[2] * .3, G.st[1] + .45, G.st[2] * .6);
    put(0, hbox(ox + G.pr[0] * u, oy + G.pr[1] * u, ox + G.pr[2] * u, oy + G.pr[3] * u, r, .1 * u), 1); scr(0, G.pr[0] + .7, (G.pr[1] + G.pr[3]) / 2 + .45, G.pr[2] - G.pr[0] - 1.4);
    const [dx, dy, hw, hh] = G.dm; put(0, poly([P(dx, dy - hh), P(dx + hw, dy), P(dx, dy + hh), P(dx - hw, dy), P(dx + .05, dy - hh - .06)], r, .006), 1); say(0, "?", dx, dy + .75, 1.5, 131, .5);
    put(0, hbox(ox + G.ye[0] * u, oy + G.ye[1] * u, ox + G.ye[2] * u, oy + G.ye[3] * u, r, .1 * u), 1); scr(0, G.ye[0] + .7, (G.ye[1] + G.ye[3]) / 2 + .45, G.ye[2] - G.ye[0] - 1.4);
    put(0, pill(...G.en), 1);
    // blue: the way through; green: yes, and the end reached; red: no, back round
    for (const q of G.ar) arrow(1, q, .95);
    say(2, "Y", G.Y[0], G.Y[1], 1.1, 132); const [ex, ey, ew, eh] = G.en; d.fill(2, (x, y) => Math.abs(x - ox - ex * u) < (ew / 2 - .3) * u && Math.abs(y - oy - ey * u) < (eh / 2 - .3) * u, [ex - ew / 2, ey - eh / 2, ex + ew / 2, ey + eh / 2], .3, -.9, .32);
    put(2, [P(ex - .9, ey), P(ex - .2, ey + .6), P(ex + 1.1, ey - .8)], 1.3);
    const nl = poly(G.no.map(q => P(...q)), r, .005); put(3, nl, 1); put(3, head(nl, .66 * u), 1); say(3, "N", G.Nl[0], G.Nl[1], 1.1, 133);
    const W2 = [["test", "done"], ["idea", "ship!"], ["try", "yes!"], ["plan", "go!"]][Math.floor(r() * 4)], nc = Math.floor(r() * 5); N(...G.notes[0], nc, W2[0], 8.0); N(...G.notes[1], (nc + 1 + Math.floor(r() * 4)) % 5, W2[1], 13.9);
    d.cols = [0, 1, 2, 3]; d.wins = [[3.4, 7.8], [8.2, 9.6], [10.0, 11.3], [11.7, 13.6]]; return d;
  };

  /** three sets overlapping, each coloured in with the side of its marker so their inks mix where they overlap; the
   *  middle starred, what's in each written in, and a note pointing at the middle */
  const venn = (L, ox, oy, u, r, k) => {
    const d = board(L, ox, oy, u, r, 4), { P, put, arrow, scr, N } = d, tall = k === "tall";
    const G = tall ? { C: [[7.3, 8.5], [13.3, 8.5], [10.3, 13.7]], R: 5, lab: [[3.4, 6.6], [14.4, 6.6], [8.6, 17.4]], nt: [16.6, 21.8, .06], nt2: [3.8, 22, -.05], ar: [[14.6, 20.2], [13.4, 15.6], [11.1, 11.3]] }
      : { C: [[9.7, 5.4], [14.9, 5.4], [12.3, 9.9]], R: 4.2, lab: [[6.3, 4.2], [15.8, 4.2], [11.1, 13], []].slice(0, 3), nt: [22.4, 11.4, .06], nt2: [3.4, 12.2, -.05], ar: [[20.2, 10.9], [16.4, 10.4], [12.9, 7.5]] };
    G.C.forEach((c, i) => { const cp = P(...c); put(i, hring(cp, G.R * u, G.R * u, r, -2.2 + i, .06), 1.05); d.fill(i, inDisc(cp, (G.R - .35) * u), [c[0] - G.R, c[1] - G.R, c[0] + G.R, c[1] + G.R], .34, [-.9, -.5, -1.2][i], .26); });
    const mid = [(G.C[0][0] + G.C[1][0] + G.C[2][0]) / 3, (G.C[0][1] + G.C[1][1] + G.C[2][1]) / 3]; put(3, hstar(P(...mid), .95 * u, .1), 1.2);
    G.lab.forEach(([x, y]) => scr(3, x, y, 3.2, .75));
    arrow(3, G.ar, 1, .6); N(...G.nt, 3, "us!", 11.5); N(...G.nt2, 0, "yes", 13.9);
    const inks = [1, 3, 2, 4, 5]; for (let i = inks.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [inks[i], inks[j]] = [inks[j], inks[i]]; }
    d.cols = [inks[0], inks[1], inks[2], 0]; d.wins = [[3.4, 5.6], [6.0, 8.2], [8.6, 10.8], [11.3, 13.7]]; return d;
  };

  /** a roadmap: the road winding up the board, its milestones flagged, each with its note; the ones passed ticked, where
   *  we are pinned, the finish flag chequered */
  const road = (L, ox, oy, u, r, k) => {
    const d = board(L, ox, oy, u, r, 4), { P, put, N } = d, tall = k === "tall", flip = r() < .5;
    const C0 = tall ? [[1.2, 25.2], [6, 23], [12.4, 22.2], [16.8, 18.6], [15, 14.4], [7.2, 13.4], [4.2, 9.8], [7.6, 6], [14, 5.3], [19.2, 2.4]] : [[.6, 14.6], [5.4, 13], [8.4, 9.4], [12.6, 8.6], [15.4, 11.9], [19.4, 12.4], [22, 8.4], [20.4, 4.8], [23.2, 2.4], [25.6, 1.9]], C = flip ? C0.map(([x, y]) => [L.w - x, y]) : C0; /* which way the road winds, dealt */
    const mid = curve(C, 10), cum = [0]; for (let i = 1; i < mid.length; i++) cum.push(cum[i - 1] + Math.hypot(mid[i][0] - mid[i - 1][0], mid[i][1] - mid[i - 1][1]));
    const at = f => { const s = f * cum[cum.length - 1]; let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1), a = mid[i - 1], b = mid[i], L2 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return { p: [lerp(a[0], b[0], t), lerp(a[1], b[1], t)], n: [-(b[1] - a[1]) / L2, (b[0] - a[0]) / L2] }; };
    const edge = o => mid.map((q, i) => { const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)], L2 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return P(q[0] - (b[1] - a[1]) / L2 * o, q[1] + (b[0] - a[0]) / L2 * o); });
    put(0, edge(.78), 1); put(0, edge(-.78), 1); put(1, mid.map(q => P(...q)), .75, "l", { dash: [.42 * u, .5 * u] });
    const MS = [.2, .44, .68, .93], words = ["v1", "beta", "ship!"], flags = MS.map((f, i) => { const { p, n } = at(f), side = i % 2 ? -1 : 1; return [p[0] + n[0] * 1.3 * side + .6, p[1] + n[1] * 1.3 * side - 1.8]; });
    MS.forEach((f, i) => { const { p, n } = at(f), side = (i % 2 ? -1 : 1), base = [p[0] + n[0] * 1.3 * side, p[1] + n[1] * 1.3 * side], top = [base[0], base[1] - 2.6];
      put(0, hline(P(...base), P(...top), r, .01), 1);
      if (i < 3) { put(3, [P(...top), P(top[0] + 1.5, top[1] + .5), P(top[0], top[1] + 1), P(...top)], 1); d.fill(3, (x, y) => { const tx = (x - ox) / u - top[0], ty = (y - oy) / u - top[1]; return tx > .05 && ty > tx * .33 + .06 && ty < 1 - tx * .33 - .06; }, [top[0], top[1], top[0] + 1.6, top[1] + 1], .2, -.3, .5); }
      else { for (let a = 0; a < 2; a++) for (let b = 0; b < 3; b++) { const x0 = top[0] + b * .55, y0 = top[1] + a * .5; put(0, hbox(ox + x0 * u, oy + y0 * u, ox + (x0 + .55) * u, oy + (y0 + .5) * u, r, .02 * u), .45); if ((a + b) % 2 === 0) d.fill(0, (x, y) => x > ox + (x0 + .06) * u && x < ox + (x0 + .49) * u && y > oy + (y0 + .06) * u && y < oy + (y0 + .44) * u, [x0, y0, x0 + .55, y0 + .5], .12, -.8, .8); } }
      if (i < 2) put(2, [P(base[0] + .7 * side - .3, base[1] - .9), P(base[0] + .7 * side + .1, base[1] - .4), P(base[0] + .7 * side + .9, base[1] - 1.6)], 1.2);
      if (i < 3) { // the note where it is clearest of the road, the flags and the notes already up
        let best = null; for (let j = 0; j < 16; j++) { const a = j / 16 * TAU, dd = L.ns * .62 + 1, x = clamp(top[0] + .7 + Math.cos(a) * dd, L.ns * .55, L.w - L.ns * .55), y = clamp(top[1] + .6 + Math.sin(a) * dd, L.ns * .55, L.h - L.ns * .55);
          let m = 1e9; for (const q of mid) m = Math.min(m, Math.max(Math.abs(q[0] - x), Math.abs(q[1] - y)) - L.ns * .5 - .9); for (const q of d.notes) m = Math.min(m, Math.max(Math.abs(q.x - ox - x * u), Math.abs(q.y - oy - y * u)) / u - L.ns - .3); for (const q of flags) m = Math.min(m, Math.hypot(q[0] - x, q[1] - y) - L.ns * .6);
          if (!best || m > best.m + .05) best = { x, y, m }; }
        N(best.x, best.y, (r() - .5) * .12, [0, 1, 2][i], words[i], 12.6 + i * .42); } });
    { const { p } = at(.56); put(3, curve([[p[0], p[1] - .15], [p[0] - .75, p[1] - 1.3], [p[0], p[1] - 2.1], [p[0] + .75, p[1] - 1.3], [p[0], p[1] - .15]].map(q => P(...q)), 6), 1.2); put(3, hring(P(p[0], p[1] - 1.35), .26 * u, .26 * u, r, 0, .05), 1); }
    d.cols = [0, 1, 2, 3]; d.wins = [[3.4, 7.6], [8.0, 9.0], [9.4, 10.1], [10.5, 12.3]]; return d;
  };

  /** a mind map: the idea in a cloud, its branches out in colours to what grows from it, two of them notes */
  const mind = (L, ox, oy, u, r, k) => {
    const d = board(L, ox, oy, u, r, 6), { P, put, say, scr, N } = d, tall = k === "tall";
    const G = tall ? { c: [10.3, 12.8, 7.6], lv: [[3.9, 4.8], [16.7, 4.6], [17.4, 14.4], [3.3, 14.8]], nt: [[15.6, 22.2, .05], [4.6, 22, -.06]] }
      : { c: [13, 8.2, 7], lv: [[3.9, 3.2], [22.1, 3.1], [22.4, 13.3], [3.8, 13.2]], nt: [[22.9, 8.3, .05], [3, 8.2, -.05]] };
    const [cx, cy, cw] = G.c; put(0, cloudPts(ox + cx * u, oy + (cy + .2) * u, cw * u, cw * .4 * u, 4, r), 1.1); say(0, "idea", cx, cy + .9, 1.4, 141, .5);
    const branch = (i, to, leaf) => { const a = Math.atan2(to[1] - cy, to[0] - cx), s0 = [cx + Math.cos(a) * cw * .42, cy + .5 + Math.sin(a) * cw * .22], e = leaf ? [to[0] - Math.cos(a) * 2.4, to[1] - Math.sin(a) * 1.25] : [to[0] - Math.cos(a) * 2.3, to[1] - Math.sin(a) * 2.3], m = [(s0[0] + e[0]) / 2 - Math.sin(a) * .9, (s0[1] + e[1]) / 2 + Math.cos(a) * .9];
      put(i, curve([s0, m, e].map(q => P(...q)), 12), 1.7); if (leaf) put(i, hring(P(...to), 2.6 * u, 1.3 * u, r, -2.4, .06), 1); };
    for (let i = G.lv.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [G.lv[i], G.lv[j]] = [G.lv[j], G.lv[i]]; }
    G.lv.forEach((q, i) => branch(1 + i, q, true));
    G.nt.forEach((q, i) => branch(5, q, false));
    G.lv.forEach(([x, y]) => scr(0, x - 1.7, y + .35, 3.4, .7));
    put(0, hstar(P(G.lv[1][0] + 2.6, G.lv[1][1] - 1.6), .6 * u, .2), .9);
    N(...G.nt[0], 1, "wow!", 5.3); N(...G.nt[1], 0, "fun!", 5.7);
    const ph0 = d.ph[0], first = ph0.slice(0, ph0.length - 5), last = ph0.slice(ph0.length - 5); d.ph = [first, d.ph[1], d.ph[2], d.ph[3], d.ph[4], d.ph[5], last]; /* the idea first; what's in the leaves, last */
    const inks = [1, 2, 3, 4, 5]; for (let i = inks.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [inks[i], inks[j]] = [inks[j], inks[i]]; }
    d.cols = [0, ...inks, 0]; d.wins = [[3.4, 5.1], [6.1, 7.1], [7.4, 8.4], [8.7, 9.7], [10.0, 11.0], [11.3, 12.3], [12.7, 13.9]]; return d;
  };

  /** a launch: the rocket on its pad, its nose and fins in red, its window, the flame lit; the dotted way to the moon; the
   *  countdown ticked off; and the note that says go */
  const rocket = (L, ox, oy, u, r, k) => {
    const d = board(L, ox, oy, u, r, 5), { P, put, say, N } = d, tall = k === "tall";
    const G = tall ? { rk: [4.6, 21.2, 1], pad: [1.2, 8.4, 22.7], mo: [17, 4.8, 2.5], tr: [[4.6, 10.9], [6.4, 6.4], [10.6, 3.6], [14.1, 3.9]], cd: [11.6, 13.6, 2.8], nt: [15.8, 23.3, .06], st: [[9.2, 1.6], [13.6, 8.6], [19.6, 10.2], [1.6, 3.6]] }
      : { rk: [4.2, 14.2, .8], pad: [1, 7.6, 15.4], mo: [22.6, 3.4, 2.2], tr: [[4.2, 5.4], [6.6, 2.6], [12.4, 1.2], [19.8, 2.4]], cd: [10, 6.8, 2.6], nt: [21.4, 12, .06], st: [[9.6, 5.2], [16.4, 4.4], [25, 8.4], [2.2, 2.2]] };
    const [bx, by, s] = G.rk, R = q => P(bx + q[0] * s, by + q[1] * s);
    const hull = [[-1.2, -.2], [-1.2, -5.8], [-1.05, -7.4], [-.55, -8.8], [0, -9.9], [.55, -8.8], [1.05, -7.4], [1.2, -5.8], [1.2, -.2], [-1.2, -.2]];
    put(0, curve(hull.slice(0, 9), 6).map(q => R(q)).concat([R([-1.2, -.2])]), 1.05);
    put(0, hline(R([-1.12, -7.3]), R([1.12, -7.3]), r, .01), .8);
    for (const sd of [-1, 1]) put(0, [R([sd * 1.2, -3.2]), R([sd * 2.5, -.2]), R([sd * 2.4, .4]), R([sd * 1.2, -.3])], .95);
    put(0, hring(R([0, -5]), .62 * s * u, .62 * s * u, r, -2, .05), 1);
    put(0, hline(P(G.pad[0], G.pad[2]), P(G.pad[1], G.pad[2]), r, .005), 1.3);
    const [mx, my, mR] = G.mo, ringed = r() < .4; put(0, hring(P(mx, my), mR * u, mR * u, r, -2, .05), 1.1);
    if (ringed) put(0, harc(P(mx, my), mR * 1.75 * u, mR * .42 * u, .1, Math.PI - .2, r, -.25), .9); /* a ringed planet this time */
    for (const [ax, ay, ar] of [[-.8, -.6, .5], [.5, .3, .7], [.3, -1.2, .35], [-.4, 1.1, .3]]) put(0, hring(P(mx + ax * mR, my + ay * mR), ar * mR * .6 * u, ar * mR * .6 * u, r, 1, .04), .6);
    const [cx0, cy0, cdy] = G.cd; ["3", "2", "1"].forEach((n, i) => { const y = cy0 + i * cdy; put(0, hbox(ox + cx0 * u, oy + (y - 1.3) * u, ox + (cx0 + 1.3) * u, oy + y * u, r, .08 * u), .85); say(0, n, cx0 + 1.9, y, 1.3, 150 + i); d.scr(0, cx0 + 3.1, y, 3.2, .7); });
    // red: the nose and the fins coloured in, stars
    d.fill(1, (x, y) => { const q = [((x - ox) / u - bx) / s, ((y - oy) / u - by) / s]; return q[1] < -7.45 && Math.abs(q[0]) < (q[1] + 9.9) / 2.5 * 1.05; }, [bx - 1.2 * s, by - 10 * s, bx + 1.2 * s, by - 7.3 * s], .22, -.9, .45);
    for (const sd of [-1, 1]) d.fill(1, (x, y) => { const q = [((x - ox) / u - bx) / s * sd, ((y - oy) / u - by) / s]; return q[0] > 1.25 && q[1] < .2 && q[1] > -3.1 + (q[0] - 1.2) * 2.3; }, [bx + (sd < 0 ? -2.6 : 1.2) * s, by - 3.3 * s, bx + (sd < 0 ? -1.2 : 2.6) * s, by + .5 * s], .2, -.6, .45);
    for (const [x, y] of G.st) put(1, hstar(P(x, y), .5 * u, (r() - .5) * .4), .85);
    // blue: the window, the way to the moon, dotted
    d.fill(2, inDisc(R([0, -5]), .5 * s * u), [bx - .7 * s, by - 5.7 * s, bx + .7 * s, by - 4.3 * s], .14, -.8, .45);
    const tr = curve(G.tr.map(q => P(...q)), 12); put(2, tr, .9, "l", { dash: [.28 * u, .42 * u] }); put(2, head(tr, .6 * u), .9);
    // orange: the flame, lit; green: the countdown ticked
    put(4, curve([[-.9, .1], [-.55, 1.4], [-.25, .8], [0, 2.3], [.25, .8], [.55, 1.4], [.9, .1]].map(R), 6), 1.2); d.fill(4, (x, y) => { const q = [((x - ox) / u - bx) / s, ((y - oy) / u - by) / s]; return q[1] > .15 && Math.abs(q[0]) < .8 * (1 - (q[1] - .15) / 1.9); }, [bx - .9 * s, by, bx + .9 * s, by + 2.2 * s], .15, -.8, .5);
    [0, 1, 2].forEach(i => { const y = cy0 + i * cdy; put(3, [P(cx0 + .2, y - .9), P(cx0 + .6, y - .25), P(cx0 + 1.6, y - 1.8)], 1.15); });
    N(...G.nt, 2, "go!", 13.95);
    d.ph = [d.ph[0], d.ph[1], d.ph[2], d.ph[4], d.ph[3]]; d.cols = [0, [3, 4][Math.floor(r() * 2)], 1, 5, 2]; d.wins = [[3.4, 8.2], [8.6, 9.8], [10.2, 11.4], [11.8, 12.6], [13.0, 13.8]]; return d;
  };

  /** the numbers: a pie in three colours with its key, a line going up past its target, the gain written by it, and a
   *  note that says so */
  const dash = (L, ox, oy, u, r, k) => {
    const d = board(L, ox, oy, u, r, 4), { P, put, say, scr, N } = d, tall = k === "tall";
    const G = tall ? { pc: [6.1, 6.4, 4.3], key: [12.4, 3.4, 2.3], ch: [1.6, 24.2, 19.2, 12.6], nt: [5.6, 16.3, -.05] } : { pc: [5, 6.2, 4], key: [1.6, 12.6, 1.5], ch: [11.2, 14.6, 25.4, 1.6], nt: [15.4, 4.7, .05] };
    const [pcx, pcy, pR] = G.pc, cp = P(pcx, pcy); put(0, hring(cp, pR * u, pR * u, r, -1.6, .05), 1.1);
    const f1 = .36 + r() * .16, f2 = f1 + .24 + r() * .12, A0 = -Math.PI / 2, ang = [A0, A0 + f1 * TAU, A0 + f2 * TAU, A0 + TAU];
    for (const a of ang.slice(0, 3)) put(0, hline(cp, P(pcx + Math.cos(a) * pR, pcy + Math.sin(a) * pR), r, .006), .9);
    const [x0, y0, x1, y1] = G.ch; put(0, [...hline(P(x0, y1), P(x0, y0), r), ...hline(P(x0, y0), P(x1, y0), r).slice(1)], 1);
    const n = 6, pts = []; let v = .2 + r() * .15; for (let i = 0; i < n; i++) { pts.push([lerp(x0 + 1.2, x1 - 1.4, i / (n - 1)), lerp(y0 - .8, y1 + 1.2, v)]); v = clamp(v + (i === n - 2 ? .3 : (r() - .3) * .32), .05, .95); } pts[n - 1][1] = Math.min(pts[n - 1][1], y1 + 1.4);
    for (let i = 0; i < 3; i++) { const [kx, ky, kdy] = G.key, y = ky + i * kdy; put(0, hbox(ox + kx * u, oy + (y - .7) * u, ox + (kx + .9) * u, oy + (y + .2) * u, r, .05 * u), .7); scr(0, kx + 1.4, y + .2, 3.4, .7); }
    // the pie's wedges and the key, coloured in, each its own marker
    [1, 2, 3].forEach((c, i) => { const a0 = ang[i], a1 = ang[i + 1]; d.fill(i + 1, (x, y) => { const dx = x - cp[0], dy = y - cp[1]; if (dx * dx + dy * dy > (pR - .3) * (pR - .3) * u * u) return false; let a = Math.atan2(dy, dx); while (a < a0) a += TAU; return a < a1 - .04 && Math.hypot(dx, dy) > .35 * u; }, [pcx - pR, pcy - pR, pcx + pR, pcy + pR], .3, [-.9, -.4, -1.3][i], .3);
      const [kx, ky, kdy] = G.key, y = ky + i * kdy; d.fill(i + 1, (x, yy) => x > ox + (kx + .1) * u && x < ox + (kx + .8) * u && yy > oy + (y - .6) * u && yy < oy + (y + .1) * u, [kx, y - .7, kx + .9, y + .2], .16, -.9, .45); });
    // red: the line and its points, the gain; green (again): the target, dashed, and the way up
    const line = pts.map(q => P(...q)); put(3, line, 1.05); for (const q of line) put(3, [q, [q[0] + .05 * u, q[1]]], 2, "d");
    say(3, "+42", pts[n - 1][0] - 2.4, pts[n - 1][1] - 1, 1.3, 161);
    const ty2 = lerp(y0 - .8, y1 + 1.2, .62); put(2, hline(P(x0 + .3, ty2), P(x1 - .3, ty2), r, .004), .7, "l", { dash: [.35 * u, .35 * u] });
    N(...G.nt, 0, "yes!", 13.9);
    d.ph = [d.ph[0], d.ph[1], d.ph[2].filter(st => !st.dash), d.ph[3], d.ph[2].filter(st => st.dash)];
    const inks = [1, 2, 3, 4, 5]; for (let i = inks.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [inks[i], inks[j]] = [inks[j], inks[i]]; }
    d.cols = [0, inks[0], inks[1], inks[2], inks[1]]; d.wins = [[3.4, 7.8], [8.2, 9.2], [9.6, 10.6], [11.0, 12.9], [13.2, 13.8]]; return d;
  };

  /** rare: the doodles of a long meeting, all over the board in every colour — a cube, a spiral, a face, a flower, a
   *  bolt, a heart, stars, a loop of arrow, hi */
  const doodles = (L, ox, oy, u, r, k) => {
    const d = board(L, ox, oy, u, r, 5), { P, put, say } = d, W = L.w, H = L.h, cells = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) cells.push([(i + .5) / 3 * W + (r() - .5) * W * .06, (j + .5) / 3 * H + (r() - .5) * H * .05]);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    const s = Math.min(W, H) / 7.5, c = i => cells[i];
    { const [x, y] = c(0), a = s * .8, o = s * .45; for (const q of [[[x - a, y - a + o], [x + a - o, y - a + o], [x + a - o, y + a], [x - a, y + a], [x - a, y - a + o]], [[x - a, y - a + o], [x - a + o, y - a], [x + a, y - a], [x + a - o, y - a + o]], [[x + a, y - a], [x + a, y + a - o], [x + a - o, y + a]]]) put(0, poly(q.map(p => P(...p)), r, .01), .9); }
    { const [x, y] = c(1); put(1, spiral(P(x, y), s * .95 * u, s * .95 * u, 3.2, 0, r() * TAU).reverse(), .9); }
    { const [x, y] = c(2); put(4, hring(P(x, y), s * u, s * u, r, -2, .06), 1.1); for (const sd of [-1, 1]) put(4, [P(x + sd * s * .35, y - s * .3), P(x + sd * s * .36, y - s * .12)], 1.6); put(4, harc(P(x, y + s * .05), s * .55 * u, s * .45 * u, .35, Math.PI - .7, r), 1); }
    { const [x, y] = c(3); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; put(3, curve([[x, y], [x + Math.cos(a - .38) * s * .7, y + Math.sin(a - .38) * s * .7], [x + Math.cos(a) * s * .95, y + Math.sin(a) * s * .95], [x + Math.cos(a + .38) * s * .7, y + Math.sin(a + .38) * s * .7], [x, y]].map(p => P(...p)), 4), .85); } put(2, curve([[x, y + s * .2], [x - s * .15, y + s * .9], [x + s * .05, y + s * 1.5]].map(p => P(...p)), 6), 1); }
    { const [x, y] = c(4); put(4, poly([[x + s * .25, y - s], [x - s * .45, y + s * .1], [x + s * .05, y + s * .1], [x - s * .3, y + s], [x + s * .5, y - s * .15], [x, y - s * .15], [x + s * .3, y - s]].map(p => P(...p)), r, .01), 1.05); }
    { const [x, y] = c(5); put(3, curve([[x, y + s * .85], [x - s * .9, y + s * .05], [x - s * .75, y - s * .6], [x - s * .2, y - s * .65], [x, y - s * .15], [x + s * .2, y - s * .65], [x + s * .75, y - s * .6], [x + s * .9, y + s * .05], [x, y + s * .85]].map(p => P(...p)), 5), 1.1); }
    { const [x, y] = c(6); for (const [dx, dy, q] of [[0, 0, .6], [s * .9, -s * .5, .35], [-s * .8, s * .6, .3]]) put(0, hstar(P(x + dx, y + dy), q * s * u * 1.3, (r() - .5) * .5), .9); }
    { const [x, y] = c(7), pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * TAU * 1.1 - Math.PI / 2; pts.push(P(x - s * 1.1 + t * s * 2.2 + Math.cos(a) * s * .45 * Math.sin(t * Math.PI), y + Math.sin(a) * s * .45 * Math.sin(t * Math.PI))); } put(2, pts, .95); put(2, head(pts, .55 * u), .95); }
    { const [x, y] = c(8); say(1, "hi!", x, y + s * .45, s * 1.1, 171, .5, 1.2); }
    const inks = [1, 2, 3, 4, 5]; for (let i = inks.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [inks[i], inks[j]] = [inks[j], inks[i]]; }
    d.cols = [0, inks[0], inks[1], inks[2], inks[3]]; d.wins = [[3.4, 6.2], [6.6, 8.4], [8.8, 10.4], [10.8, 12.3], [12.7, 13.9]]; return d;
  };

  /* ---------------- 1.12 b430: the long day's hour eggs, their pieces ---------------- */
  // their beats, in seconds: each opens as a pass does (by night the sponge, by day the old plan's notes and the eraser)
  const HB = chalk ? {
    proof: { wipe: [.5, 2.2], dry: [2.2, 5.6], fig: [2.4, 4.9], tintA: [5.1, 5.75], tintB: [5.95, 7.0], cut: [7.2, 7.55], slide: 7.75, eq: [10.95, 11.8], out: [12.2, 14.8] },
    rocket: { wipe: [.5, 2.2], dry: [2.2, 5.6], white: [2.4, 4.6], pink: [4.85, 5.5], blue: [5.7, 6.0], count: [6.25, 7.9], flame: [8.1, 8.35], lit: 8.45, lift: [9.15, 11.3], sweep: [11.85, 13.75] },
  } : {
    machine: { black: [3.4, 6.5], red: [6.75, 7.45], blue: [7.7, 8.25], wipe: [12.45, 14.15] },
    maze: { box: [3.4, 4.3], star: [4.55, 4.95], dot: [5.15, 5.4], grow: [5.6, 6.9], solve: [7.0, 10.75], rewind: [11.9, 12.75], bloom: [12.55, 14.5] },
  };
  /** inside a polygon (page points), and at least `inset` from its edges */
  const inPoly = (q, inset = 0) => (x, y) => { let ins = false; for (let i = 0, j = q.length - 1; i < q.length; j = i++) { const [xi, yi] = q[i], [xj, yj] = q[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } if (!ins || inset <= 0) return ins;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) { const [ax, ay] = q[j], [bx, by] = q[i], dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)); if (Math.hypot(x - ax - dx * t, y - ay - dy * t) < inset) return false; } return true; };
  /** a polygon cut by a half-plane: what of it lies where nx·x + ny·y ≥ c */
  const clipHalf = (q, nx, ny, c) => { const out = [], f = p => p[0] * nx + p[1] * ny - c; for (let i = 0; i < q.length; i++) { const p = q[i], s = q[(i + 1) % q.length], fp = f(p), fs = f(s); if (fp >= 0) out.push(p); if ((fp >= 0) !== (fs >= 0)) { const t = fp / (fp - fs); out.push([lerp(p[0], s[0], t), lerp(p[1], s[1], t)]); } } return out; };
  /** a canvas over a box of the page (`pad` round it) on the screen's own pixel grid, drawn on in page pixels: what is cut
   *  onto it and drawn back where it was cut is the same pixels */
  const boxCanvas = (x0, y0, x1, y1, pad = 0) => { const ox = Math.floor((x0 - pad) * px) / px, oy = Math.floor((y0 - pad) * px) / px, [c, x] = canvas(Math.ceil((x1 + pad - ox) * px), Math.ceil((y1 + pad - oy) * px)); x.imageSmoothingEnabled = true; x.setTransform(px, 0, 0, px, -ox * px, -oy * px); x.lineCap = "round"; x.lineJoin = "round"; return { c, ctx: x, x0: ox, y0: oy, w: c.width / px, h: c.height / px }; };
  /** such a canvas drawn back (dx, dy) from where it was cut, scaled by sc and turned by rot about (cx, cy) (on the frame,
   *  or on a layer) */
  const drawSpr = (sp, dx, dy, a, sc = 1, rot = 0, cx = sp.x0 + sp.w / 2, cy = sp.y0 + sp.h / 2, x = g) => { if (a <= .003 || sc <= .001) return; x.globalAlpha = Math.min(1, a); if (sc === 1 && !rot) x.drawImage(sp.c, sp.x0 + dx, sp.y0 + dy, sp.w, sp.h); else { x.save(); x.translate(cx + dx, cy + dy); x.rotate(rot); x.scale(sc, sc); x.drawImage(sp.c, sp.x0 - cx, sp.y0 - cy, sp.w, sp.h); x.restore(); } x.globalAlpha = 1; };
  /** strokes drawn whole, in chalk or in marker */
  const strokesOn = (x, list) => { for (const st of list) { if (chalk) { chalkSegs(x, st, 0, st.n); chalkHalo(x, st, st.len); } else markerLine(x, st, st.len); } };
  const bboxOf = list => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const st of list) for (const [a, b] of st.p) { x0 = Math.min(x0, a); y0 = Math.min(y0, b); x1 = Math.max(x1, a); y1 = Math.max(y1, b); } return [x0, y0, x1, y1]; };

  // the pool: the signature's first, then the others (each run of passes deals all of them once); and the rare ones,
  // about one pass in ten, never two within four passes of each other
  const POOL = chalk ? [null, solar, music, prism, water, dna] : [null, flow, venn, road, mind, rocket, dash], RAREP = chalk ? [ttt, cat] : [ttt, doodles], NS = POOL.length, NR = RAREP.length;
  const rareHit = P => NR > 0 && P > 1 && K.deal(P, 91)() < 1 / 6, rareAt = P => rareHit(P) && !rareHit(P - 1) && !rareHit(P - 2) && !rareHit(P - 3);
  const subjOf = P => P <= 0 ? 0 : rareAt(P) ? NS + Math.floor(K.deal(P, 92)() * NR) : K.bag(P, NS, 90);

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
    res: "dpr", carry: true, // (the lesson or the plan a pass draws stays up through the quiet after it)
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
        S.tools = INKS.slice(0, 3).map(c => make(sl + 4, sd + 4, x => { /* (the forever cycle's other colours are cut after the rest, with dice of their own: extra()) */ x.translate(2, 2); const gr = x.createLinearGradient(0, 0, 0, sd); gr.addColorStop(0, rgba(mix(c, W3, .6))); gr.addColorStop(.4, rgba(c)); gr.addColorStop(1, rgba(mix(c, K3, .3)));
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
        S.notes.forEach((n, i) => { n.spr = noteSpr(n.col, n.word, 50 + i); n.back = noteSpr(n.col, "", 0, true); }); S.noteSpr = noteSpr;
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
      S.extra();
    },
    /** the forever cycle's own, for this room: the other sticks of chalk and the staff liner, or the eraser that takes a
     *  whole plan off; and no passes worked out yet */
    extra() {
      const b = S.box, u = b.u, r = rng(62);
      S.pics = new Map(); S.pp = null;
      if (chalk) {
        const sl = S.tl, sd = sl * .22;
        for (const c of INKS.slice(3)) S.tools.push(make(sl + 4, sd + 4, x => { x.translate(2, 2); const gr = x.createLinearGradient(0, 0, 0, sd); gr.addColorStop(0, rgba(mix(c, W3, .6))); gr.addColorStop(.4, rgba(c)); gr.addColorStop(1, rgba(mix(c, K3, .3)));
          x.fillStyle = gr; x.beginPath(); x.moveTo(sd * .3, 0); x.lineTo(sl - 1.2, .4); x.lineTo(sl, sd * .35); x.lineTo(sl - .6, sd * .7); x.lineTo(sl - 1.4, sd); x.lineTo(sd * .12, sd); x.quadraticCurveTo(-sd * .18, sd * .5, sd * .3, 0); x.fill();
          x.fillStyle = rgba(mix(c, W3, .45), .9); x.beginPath(); x.ellipse(sd * .1, sd * .5, sd * .2, sd * .42, 0, 0, TAU); x.fill();
          x.fillStyle = rgba(mix(c, K3, .25), .35); for (let k = 0; k < 4; k++) x.fillRect(sd + r() * (sl - sd * 2), r() * sd, .8, .8); }));
        // the staff liner: five short sticks in a wire cradle on a wooden handle, as far apart as the staff's lines
        const gp = (b.k === "tall" ? MUSIC.tall.g : MUSIC.wide.g) * u, lh = gp * 4 + sd * 1.6, hl = clamp(u * 2.4, 30, 62); S.gp = gp;
        S.liner = make(hl + sd * 2 + 6, lh + 6, x => { x.translate(3, 3); const cx = sd * .9;
          x.strokeStyle = "#8C939B"; x.lineWidth = Math.max(1.2, sd * .22); x.beginPath(); x.moveTo(cx, sd * .5); x.lineTo(cx, lh - sd * .5); x.stroke();
          for (let j = 0; j < 5; j++) { const y = sd * .8 + j * gp; x.fillStyle = rgba(INKS[0]); x.beginPath(); x.roundRect(0, y - sd * .32, sd * 1.3, sd * .64, sd * .3); x.fill(); x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(sd * .4, y + sd * .08, sd * .8, sd * .2); }
          const gr = x.createLinearGradient(0, lh / 2 - sd * .4, 0, lh / 2 + sd * .4); gr.addColorStop(0, "#C99A62"); gr.addColorStop(1, "#7A5230"); x.fillStyle = gr; x.beginPath(); x.roundRect(cx, lh / 2 - sd * .38, hl, sd * .76, sd * .38); x.fill(); });
        S.liner.cx = sd * .9 + 3; S.liner.cy = sd * .8 + 2 * gp + 3;
      } else {
        // a pass after the signature's takes the whole plan off: its passes over the whole room, and an eraser to fit them
        const L = PLAN[b.k], both = b.x < S.W * .1 && b.x + b.w > S.W * .9, pz = passesFor(.3, L.h - .3, L.eh, u, both), band = pz.band, ew = band * .4;
        S.band2 = band; S.wipeAll = wipePath(pz.passes, band, b, u);
        S.sponge2 = make(ew + 8, band + 8, x => { x.translate(4, 4); x.fillStyle = "#AEB4BB"; x.beginPath(); x.roundRect(0, 0, ew, band, ew * .18); x.fill(); const gr = x.createLinearGradient(0, 0, ew, 0); gr.addColorStop(0, "#3F6FD6"); gr.addColorStop(1, "#224AA6"); x.fillStyle = gr; x.beginPath(); x.roundRect(ew * .12, band * .05, ew * .76, band * .9, ew * .2); x.fill();
          x.fillStyle = "rgba(255,255,255,.28)"; x.beginPath(); x.roundRect(ew * .2, band * .1, ew * .18, band * .8, ew * .1); x.fill(); x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(ew * .46, band * .22, ew * .08, band * .56); });
        S.spongeSh2 = make(ew + 30, band + 30, x => { x.shadowColor = "rgba(40,48,60,.35)"; x.shadowBlur = 7 * px; x.shadowOffsetY = 1000 * px; x.fillStyle = "#000"; x.beginPath(); x.roundRect(15, 15 - 1000, ew, band, ew * .2); x.fill(); });
        S.nspr = new Map();
      }
    },
    /** what pass P draws, and so what pass P + 1 rests on: its strokes by phase, paced, in their colours, worked out from P
     *  alone (its own dice, and its own chalk, the same whenever it is worked out again) */
    pic(P) {
      let pc = S.pics.get(P); if (pc) return pc;
      if (P <= 0) pc = { P: 0, id: 0, phases: S.phases, all: S.all, end: S.end, dust: S.dust, whole: chalk ? S.full : null, finS: S.finS, notes: S.notes, fin: chalk ? LESSON[S.box.k].fin : null };
      else {
        const b = S.box, L = (chalk ? LESSON : PLAN)[b.k], id = subjOf(P), keep = seedN, r = K.deal(P, 93);
        seedN = 20000 + (P % 1009) * 700;
        const o = id === 0 ? S.again(L, b) : (id < NS ? POOL[id] : RAREP[id - NS])(L, b.x, b.y, b.u, r, b.k);
        seedN = keep;
        const phases = o.ph.map((strokes, i) => ({ col: o.cols[i], win: o.wins[i], strokes, tool: o.tools ? o.tools[i] : null })).filter(q => q.strokes.length);
        for (const q of phases) for (const st of q.strokes) st.col = q.col;
        pace(phases, b.u);
        const all = phases.flatMap(q => q.strokes);
        pc = { P, id, phases, all, end: all[all.length - 1].t1, dust: chalk ? dustOf(all, rng(7000 + P % 9973)) : [], fin: o.fin, notes: o.notes || [], whole: null };
      }
      S.pics.set(P, pc);
      if (S.pics.size > 4) for (const k of S.pics.keys()) { if (k !== P && k !== P - 1 && k !== P + 1) { S.pics.delete(k); if (S.pics.size <= 4) break; } }
      return pc;
    },
    /** the signature's lesson (or plan) again, in a pass of its own: the same strokes and the same chalk as pass 0's */
    again(L, b) {
      if (chalk) { seedN = 3; const ph = lessonAt(L, b.x, b.y, b.u); return { ph, cols: [0, 1, 2], wins: [B.white, B.blue, B.yellow], fin: L.fin }; }
      seedN = 1; const pl = planAt(L, b.x, b.y, b.u); return { ph: [[...pl.top, ...pl.ph[0]], pl.ph[1], pl.ph[2], pl.ph[3]], cols: [0, 1, 2, 3], wins: [[4.0, 7.4], [7.8, 10.2], [10.6, 11.5], [11.9, 13.8]], notes: pl.notes.map((n, i) => ({ ...n, slap: 3.5 + i * .3 })) };
    },
    /** the pass: what it draws, and what it rests on (what the pass before it drew; the signature's before pass 1) */
    passOf(P) { P = Math.max(0, P | 0); if (S.pp && S.pp.P === P) return S.pp; return (S.pp = { P, cur: S.pic(P), prev: S.pic(Math.max(0, P - 1)) }); },
    /** a pass's picture, whole, on a layer of its own: the live layer taken over when it has just finished drawing it,
     *  else drawn afresh */
    wholeOf(pc) {
      if (pc.whole) return pc.whole;
      const l = S.live, w = !(l.list === pc.all && l.n >= pc.all.length) || (!chalk && pc.P === 0) ? S.layer() : l;
      if (w === l) S.live = S.layer();
      else if (!chalk && pc.P === 0) { w.x.save(); w.x.setTransform(1, 0, 0, 1, 0, 0); w.x.drawImage(S.top.c, 0, 0); w.x.drawImage(S.full.c, 0, 0); w.x.restore(); }
      else for (const st of pc.all) { if (chalk) { chalkSegs(w.x, st, 0, st.n); chalkHalo(w.x, st, st.len); } else markerLine(w.x, st, st.len); }
      return (pc.whole = w);
    },
    /** the finale's A+ where a pass's picture leaves room for it */
    finOf(pc) {
      if (pc.finS) return pc.finS;
      const b = S.box, u = b.u, r = rng(8000 + pc.P % 9973), keep = seedN; seedN = 900000 + (pc.P % 1009) * 60;
      const [fx, fy, fs] = pc.fin, fw = width("A+", fs * u), fwd = clamp(u * .22, 2.6, 6.4);
      const letters = write("A+", b.x + fx * u - fw / 2, b.y + (fy + fs * .5) * u, fs * u, 77).map(p => mk(p, 2, fwd, "w"));
      const round = [mk(hring([b.x + fx * u, b.y + fy * u], fw * .5 + .45 * fs * u, fs * u * .85, r, -2.6, .1), 2, fwd * .9)];
      const stars = [[-1.15, -1.1, .3], [1.25, -.95, .24], [1.1, 1.05, .2]].map(([dx, dy, s]) => mk(hstar([b.x + (fx + dx * fs) * u, b.y + (fy + dy * fs) * u], s * fs * u, r() - .5), 2, fwd * .75));
      pace([{ win: [.06, .38], strokes: letters }, { win: [.42, .55], strokes: round }, { win: [.58, .72], strokes: stars }], u); seedN = keep;
      return (pc.finS = [...letters, ...round, ...stars]);
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
    draw(T, I, A, F, P = 0) {
      const { W, H } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      // a move to new room: fade out here, build it there, fade in (and if there's no room at all, fade and wait)
      const want = S.pending || !S.room ? 0 : 1; S.vis += (want - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 5));
      if (S.pending && S.vis < .03) { S.box = S.pending; S.pending = null; S.build(); }
      S.F = F; if (F < 0 && S.refit) { S.refit = false; S.fit(false); }
      const vis = S.vis, on = I > .01;
      if (vis > .005 && S.box) { const pp = S.passOf(P), lg = K.long ? K.long(P) : 0; if (lg === 1 || lg === 2) S.hour(T, I, A, on, vis, pp, lg); /* (b430: once in an hour, an hour's egg) */ else { S.hr = null; /* (its layers let go once it is over) */ if (K.egg && K.egg(P)) S.egg(T, I, A, on, vis, pp); /* (b418: every twelfth pass, the egg) */ else if (chalk) S.lesson(T, I, A, on, vis, pp); else if (pp.P) S.planOn(T, I, A, on, vis, pp); else S.plan(T, I, A, on, vis); } }
      if (chalk) S.dustMotes(A);
      if (F >= 0 && S.box) { if (chalk) S.aplus(F, S.passOf(P)); else S.notesBurst(F, A); }
      g.globalAlpha = 1;
    },
    blit(l, a) { if (a <= .003) return; g.globalAlpha = a; g.drawImage(l.c, S.lx, S.ly, l.c.width / px, l.c.height / px); g.globalAlpha = 1; },
    /** a layer brought to time t: the strokes done by then drawn whole, the one in hand drawn as far as it has gone
     *  (and all of it again from nothing if time has gone back); returns the stroke in hand */
    grow(l, list, t) {
      if (l.list !== list) { if (l.list) { l.x.setTransform(1, 0, 0, 1, 0, 0); l.x.clearRect(0, 0, l.c.width, l.c.height); l.x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); } l.list = list; l.n = l.k = 0; } /* another pass's */
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
        if (t < a) { const k = E.out((t - a + OFF) / OFF), o = off(ss[0].p[0]), p = ss[0].p[0]; return { x: lerp(o[0], p[0], k), y: lerp(o[1], p[1], k), lift: 1 - k, dir: Math.PI, col: ph.col, tool: ph.tool }; }
        if (t > b) { const e = ss[ss.length - 1].p, p = e[e.length - 1], o = off(p), k = E.in((t - b) / OFF); return { x: lerp(p[0], o[0], k), y: lerp(p[1], o[1], k), lift: k, dir: 0, col: ph.col, tool: ph.tool }; }
        for (let i = 0; i < ss.length; i++) { const st = ss[i]; if (t > st.t1) continue;
          if (t >= st.t0) { const q = along(st, done(st, t)); return { x: q[0], y: q[1], lift: 0, dir: q[2], col: ph.col, tool: ph.tool }; }
          const e = ss[i - 1].p[ss[i - 1].p.length - 1], s0 = st.p[0], k = clamp((t - ss[i - 1].t1) / (st.t0 - ss[i - 1].t1)), ke = E.io(k), d = Math.hypot(s0[0] - e[0], s0[1] - e[1]), up = Math.sin(Math.PI * k);
          return { x: lerp(e[0], s0[0], ke), y: lerp(e[1], s0[1], ke) - up * Math.min(10, d * .15), lift: up * clamp(d / (S.box.u * 2), .35, 1), dir: Math.atan2(s0[1] - e[1], s0[0] - e[0]), col: ph.col, tool: ph.tool }; }
      }
      return null;
    },
    /** the chalk or the marker in the hand, its tip at the point, leaning off down to the right as a right hand holds it;
     *  lifted, it stands off the board and its shadow falls further from it */
    tool(p, a) {
      if (!p || a <= .01) return; if (p.tool === "liner") return S.linerAt(p, a);
      const spr = S.tools[p.col], sh = S.toolSh, ang = (chalk ? .78 : .9) + Math.cos(p.dir) * .06 + p.lift * .1, s = 1 + p.lift * .07;
      g.save(); g.globalAlpha = a * (chalk ? .6 : .5) * (1 - p.lift * .35); g.translate(p.x + 2 + p.lift * 8, p.y + 3 + p.lift * 11); g.rotate(ang); g.drawImage(sh, -8, -sh.h2 / 2, sh.w2, sh.h2); g.restore();
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y - p.lift * 2); g.rotate(ang); g.scale(s, s); g.drawImage(spr, -2, -spr.h2 / 2, spr.w2, spr.h2); g.restore();
    },
    /** the staff liner, its middle stick at the point, the cradle upright across the line it rules, the handle off to the
     *  side the hand is on; lifted, it stands off the board */
    linerAt(p, a) {
      const L = S.liner, dx = S.side === "l" ? -1 : 1, lift = p.lift;
      g.save(); g.globalAlpha = a * .5 * (1 - lift * .35); g.translate(p.x + 3 + lift * 9, p.y + 4 + lift * 12); g.scale(dx, 1); g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(-L.cx + 2, -L.cy + 2, L.w2 * .35, L.h2 - 4); g.restore();
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y - lift * 3); g.scale(dx * (1 + lift * .06), 1 + lift * .06); g.drawImage(L, -L.cx, -L.cy, L.w2, L.h2); g.restore();
    },
    /** the sponge or the eraser along its path at loop time t, leaning into its passes; null before and after */
    wiper(t) { const k = (t - B.wipe[0]) / (B.wipe[1] - B.wipe[0]); if (k <= 0 || k >= 1) return null; const f = S.wipe.at(k), q = along(S.wipe.ride, f * S.wipe.ride.len); return { s: f * S.wipe.len, x: q[0], y: q[1], dir: q[2] }; },
    drawWiper(w, a, A, spr = S.sponge, sh = S.spongeSh) { if (!w || a <= .01) return; const lean = Math.cos(w.dir) * -.07 + Math.sin(A * (chalk ? 9 : 26)) * (chalk ? .03 : .05), jig = chalk ? 0 : Math.sin(A * 26) * S.box.u * .35;
      g.save(); g.globalAlpha = a * .8; g.translate(w.x + 6 + jig, w.y + 10); g.rotate(lean); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore();
      g.save(); g.globalAlpha = a; g.translate(w.x + jig, w.y); g.rotate(lean); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); },
    /** the whole drawing with the wiper's path so far taken out of it — as far as the loop has taken over (I) */
    wiped(s, vis, I, src = S.full, path = S.wipe, band = S.band) { const l = S.scr, x = l.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.drawImage(src.c, 0, 0); x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px);
      if (s > 0) { x.globalCompositeOperation = "destination-out"; x.strokeStyle = `rgba(0,0,0,${I.toFixed(3)})`; x.lineWidth = band; x.lineCap = "butt"; x.lineJoin = "miter"; trace(x, path, 0, s); x.stroke(); x.globalCompositeOperation = "source-over"; x.lineCap = "round"; x.lineJoin = "round"; }
      S.blit(l, vis); },
    /** the drawing so far, and (while the loop is only taking over, or giving back) the whole of it, crossfaded */
    redrawn(vis, I, src = S.full) { if (I >= .99) { S.blit(S.live, vis); return; } const l = S.scr, x = l.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.globalAlpha = 1 - I; x.drawImage(src.c, 0, 0);
      x.globalCompositeOperation = "lighter"; x.globalAlpha = I; x.drawImage(S.live.c, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); S.blit(l, vis); },

    /* ---------------- by night: the lesson ---------------- */
    lesson(T, I, A, on, vis, pp) {
      // what the pass rests on (the lesson the pass before it drew: the signature's, before pass 1), and what it draws
      const rest = S.wholeOf(pp.prev), cur = pp.cur, loop = on && T >= B.wipe[0] && (pp.P > 0 || T < cur.end + 1.3), a = vis * I;
      if (!loop) { S.blit(rest, vis); return; }
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
      if (T < B.wipe[1]) S.wiped(s, vis, I, rest);
      else { const st = S.grow(S.live, cur.all, T); S.redrawn(vis, I, rest); if (st) S.hand(st, T, a); }
      // the dust: a puff where each stroke begins, specks falling from the stick as it goes
      g.fillStyle = rgba(INKS[0]);
      for (const st of cur.all) { const age = T - st.t0; if (age < 0 || age > .5) continue; const k = age / .5, R = S.box.u * (.35 + .5 * E.out(k)); g.globalAlpha = a * .22 * (1 - k); g.drawImage(S.puffs[st.col], st.p[0][0] - R, st.p[0][1] - R, R * 2, R * 2); }
      for (const d of cur.dust) { const age = T - d.t; if (age < 0 || age > d.life) continue; g.globalAlpha = a * .55 * (1 - age / d.life); g.fillStyle = rgba(INKS[d.c]); g.fillRect(d.x + d.vx * age, d.y + d.vy * age + 70 * age * age, d.s, d.s); }
      g.globalAlpha = 1;
      S.drawWiper(w, a, A);
      S.tool(S.toolAt(T, cur.phases), a);
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
    aplus(F, pp) {
      const fa = 1 - seg(F, .84, 1, E.sine), fl = S.finOf(pp.prev); if (fa <= 0) return; /* over the lesson the pass rests on */
      if (!S.fin) S.fin = S.layer(); const cur = S.grow(S.fin, fl, F); S.blit(S.fin, fa); if (cur) S.hand(cur, F, fa, S.fin);
      const ph = [{ col: 2, strokes: fl }]; S.tool(S.toolAt(F, ph, .06), fa);
    },

    /* ---------------- by day: the plan ---------------- */
    /** a pass after the signature's: the notes the plan before it left peel off one by one and flutter away, the eraser
     *  takes the whole plan off (a ghost of it fading), and the new plan is drawn a colour at a time, its notes slapped on */
    planOn(T, I, A, on, vis, pp) {
      const a = vis * I, rest = S.wholeOf(pp.prev), cur = pp.cur, WP = S.wipeAll, WB = BW.wipe, loop = on && T >= WB[0];
      if (!loop) S.blit(rest, vis);
      else {
        const k = (T - WB[0]) / (WB[1] - WB[0]), s = k <= 0 ? 0 : k >= 1 ? WP.len : WP.at(k) * WP.len;
        const gh = a * env(T, WB[0], WB[0] + .3, BW.ghost[0], BW.ghost[1], E.sine);
        if (gh > .003) { S.blit(rest, gh * .03); g.save(); g.translate(7, 1); S.blit(rest, gh * .02); g.restore(); }
        if (T < WB[1]) S.wiped(s, vis, I, rest, WP, S.band2);
        else { const st = S.grow(S.live, cur.all, T); S.redrawn(vis, I, rest); if (st) S.hand(st, T, a); }
      }
      const curl = n => .12 + .025 * Math.sin(A * .9 + n.ph);
      pp.prev.notes.forEach((n, i) => { const tp0 = BW.peel + i * BW.gap, tp1 = tp0 + .55; S.sprOf(n);
        if (!on || T < tp0) { S.note(n, n.x, n.y, n.rot, 1, curl(n), vis, 0); return; }
        if (I < .99) S.note(n, n.x, n.y, n.rot, 1, curl(n), vis * (1 - I), 0);
        S.peel(n, T, tp0, tp1, A, a, curl(n)); });
      if (on) for (const n of cur.notes) { if (T < n.slap) continue; S.sprOf(n); if (T >= n.slap + .6) S.note(n, n.x, n.y, n.rot, 1, curl(n), a, 0); else { const sl = S.slap(T - n.slap); S.note(n, n.x, n.y - sl.lift * n.s * .08, n.rot + sl.lift * .12, sl.sc, curl(n) + sl.flap, a * sl.a, sl.lift); } }
      if (on) { const k = (T - WB[0]) / (WB[1] - WB[0]); if (k > 0 && k < 1) { const f = WP.at(k), q = along(WP.ride, f * WP.ride.len); S.drawWiper({ x: q[0], y: q[1], dir: q[2] }, a, A, S.sponge2, S.spongeSh2); } }
      if (on && T < cur.end + .4) S.tool(S.toolAt(T, cur.phases), a);
    },
    /** a note's sprites, cut when it is first drawn (one for each colour and word) */
    sprOf(n) { if (n.spr) return; const key = n.col.join() + n.word; let q = S.nspr.get(key); if (!q) { q = [S.noteSpr(n.col, n.word, 50 + n.word.length * 7), S.noteSpr(n.col, "", 0, true)]; S.nspr.set(key, q); } [n.spr, n.back] = q; },
    /** a note peeling off, its corner lifting from tp0 to tp1, then fluttering away off the board */
    peel(n, T, tp0, tp1, A, a, c0) {
      if (T < tp1) { const k = seg(T, tp0, tp1, E.in); S.note(n, n.x, n.y - k * n.s * .04, n.rot - k * .06, 1 + k * .03, c0 + k * .55 + Math.sin(A * 21) * .02 * k, a, k); return; }
      const k = T - tp1, f = S.flutter(n, k, -n.s * .04, -.06); if (f) S.note(n, f.x, f.y, f.rot, 1.03 + .01 * clamp(k / .3), lerp(c0 + .55, .3, clamp(k / .35)), a, 1, f.flip);
    },
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

    /* ---------------- 1.12 b418: the egg ----------------
       Every twelfth pass (K.egg), for whoever has left the list alone that long. It starts from the picture the pass
       before it left, as any pass does, and ends on the one this pass would have drawn, worked out as ever (pic(P)), so
       the pass after it rests on just what it always would have. */
    egg(T, I, A, on, vis, pp) { if (chalk) S.eggNight(T, I, A, on, vis, pp); else S.eggDay(T, I, A, on, vis, pp); },
    /** the egg's own, for this room and this pass, worked out once: by night the lines and the tick, paced */
    eggOf(P) {
      const b = S.box; if (S.eg && S.eg.box === b && S.eg.P === P) return S.eg;
      const u = b.u, r = K.deal(P, 95), keep = seedN, e = { box: b, P }; seedN = 700000 + (P % 997) * 400; /* its own dice, and its own chalk */
      if (chalk) {
        // four lines of it down the room, as large as the room allows, and room at the end of the last for the tick
        const str = "I will finish my list", n = 4, Wl = width(str, 1) + 1.9, s = Math.min(b.w * .92 / Wl, b.h * .86 / ((n - 1) * 1.8 + 1.3), u * 2.3);
        const pitch = clamp((b.h * .78 / s - 1.3) / (n - 1), 1.8, 2.3), span = (n - 1) * pitch + 1.3, x0 = b.x + (b.w - Wl * s) / 2, top = b.y + (b.h - span * s) / 2 + s; /* ruled a little wider where the room is tall */
        const w = clamp(u * .2, 2.4, 6) * clamp(s / u * .9, .8, 1.25), lines = []; let xe = 0, ye = 0;
        const firm = st => { const p0 = st.pr; st.pr = q => Math.max(.5, p0(q)); return st; }; /* the stick bears on more evenly: it skips, but never so that an l reads as an i */
        for (let i = 0; i < n; i++) { const x = x0 + (r() - .5) * .16 * s, y = top + i * pitch * s + (r() - .5) * .08 * s; for (const p of write(str, x, y, s, 300 + Math.floor(r() * 9999), .12 + r() * .04)) lines.push(firm(mk(p, 0, w, "w"))); xe = x + width(str, s); ye = y; }
        const rr = rng(96), t0 = [xe + .3 * s, ye - .55 * s], t1 = [xe + .72 * s, ye - .02 * s], t2 = [xe + 1.75 * s, ye - 1.3 * s];
        const tick = mk([...hline(t0, t1, rr, .02), ...hline(t1, t2, rr, .02).slice(1)], 2, w * 1.35);
        e.phases = [{ col: 0, win: EG.lines, strokes: lines }, { col: 2, win: EG.tick, strokes: [tick] }];
        pace(e.phases, u); e.all = [...lines, tick]; e.dust = dustOf(e.all, rng(7100 + P % 9973));
      } else {
        // the crab, in its two frames, arms down and arms up: a note to each square, as large as the room allows
        const FR = [["..X.....X..", "...X...X...", "..XXXXXXX..", ".XX.XXX.XX.", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.X.....X.X", "...XX.XX..."],
          ["..X.....X..", "X..X...X..X", "X.XXXXXXX.X", "XXX.XXX.XXX", "XXXXXXXXXXX", ".XXXXXXXXX.", "..X.....X..", ".X.......X."]].map(f => f.flatMap((row, j) => [...row].map((ch, i) => ch === "X" ? i + j * 11 : -1)).filter(k => k >= 0));
        const c = Math.min(b.w * .9 / 11, b.h * .86 / 8, u * 3), cx = b.x + b.w / 2, cy = b.y + b.h / 2, home = k => [cx + (k % 11 - 5) * c, cy + (Math.floor(k / 11) - 3.5) * c];
        const col = INV[Math.floor(r() * 3)], A1 = FR[0], A2 = FR[1], only1 = A1.filter(k => !A2.includes(k)), only2 = A2.filter(k => !A1.includes(k));
        // the squares a note leaves for the other frame, paired with the ones it goes to (the shortest hops, on its own side); the one left over is a note more
        const pairs = [], extra = []; for (const side of [-1, 1]) { const from = only1.filter(k => Math.sign(k % 11 - 5) === side), to = only2.filter(k => Math.sign(k % 11 - 5) === side); let best = null;
          const perm = (rest, acc) => { if (acc.length === from.length) { const d = acc.reduce((m, k, i) => m + Math.hypot(k % 11 - from[i] % 11, Math.floor(k / 11) - Math.floor(from[i] / 11)), 0); if (!best || d < best.d) best = { d, acc: acc.slice() }; return; } for (const k of rest) perm(rest.filter(q => q !== k), [...acc, k]); };
          perm(to, []); from.forEach((k, i) => pairs.push([k, best.acc[i]])); extra.push(...to.filter(k => !best.acc.includes(k))); }
        const jit = () => [(r() - .5) * .05 * c, (r() - .5) * .05 * c, (r() - .5) * .07];
        const post = (k, k2) => { const [jx, jy, jr] = jit(); return { k, k2, x: home(k)[0] + jx, y: home(k)[1] + jy, x2: k2 === undefined ? 0 : home(k2)[0] + jx * .5, y2: k2 === undefined ? 0 : home(k2)[1] + jy * .5, rot: jr, s: c * .86, curl: r() < .3 }; };
        const posts = A1.map(k => { const pr = pairs.find(q => q[0] === k); return post(k, pr ? pr[1] : undefined); }), extras = extra.map(k => post(k));
        // slapped on in rows, to and fro (the eraser's way), quick as cards dealt
        const order = posts.slice().sort((p, q) => { const jp = Math.floor(p.k / 11), jq = Math.floor(q.k / 11); return jp - jq || (jp % 2 ? q.k - p.k : p.k - q.k); }), [s0, s1] = EG.slap;
        order.forEach((q, i) => { q.ts = s0 + (s1 - s0 - .3) * i / (order.length - 1) + (r() - .5) * .02; });
        // the burst: from where the eraser hits, each note blown out by the clearest way off the board from where it is (a
        // way that crosses no words: off the side, on a phone whose room sits between the bar and the list), scattering
        const hit = [cx + .3 * c, cy + .9 * c], rects = (S.raw || [S.pr ? [16, S.H * .12, S.W - 16, S.H * .56, 1] : [S.W * .05, S.H * .14, S.W * .6, S.H * .8, 1]]).filter(q => q[4] !== 2).concat([[0, 0, S.W, 70, 0], [0, S.H - 56, S.W, S.H, 0]]); /* and the bar along the top, the foot */
        const way = (x0, y0, t) => { const ux = Math.cos(t), uy = Math.sin(t), m = c * .7; let hits = 0, d = c * .5; for (; d < 4000; d += c * .5) { const x = x0 + ux * d, y = y0 + uy * d; if (x < -c || x > S.W + c || y < -c || y > S.H + c) break; for (const [a2, b2, c2, d2] of rects) if (x > a2 - m && x < c2 + m && y > b2 - m && y < d2 + m) { hits++; break; } } return { t, ux, uy, hits, d }; };
        const outOf = (x0, y0, pref) => { const ws = Array.from({ length: 24 }, (_, i) => way(x0, y0, i / 24 * TAU)), lo = Math.min(...ws.map(w => w.hits)); return ws.filter(w => w.hits === lo).reduce((m, w) => { const sc = Math.cos(w.t - pref) - w.d / 3000; return !m || sc > m.sc ? { ...w, sc } : m; }, null); };
        for (const q of [...posts, ...extras]) { const px0 = q.k2 !== undefined ? q.x2 : q.x, py0 = q.k2 !== undefined ? q.y2 : q.y, dx = px0 - hit[0], dy = py0 - hit[1], d = Math.hypot(dx, dy) || 1, o = outOf(px0, py0, Math.atan2(dy, dx)), tOut = .8 + r() * .8, bs = (o.d + c) * .9 / (1 - Math.exp(-.9 * tOut)), sp = (60 + r() * 90) * (1.2 - .5 * clamp(d / (6 * c))), j = (r() - .5) * .24; /* fast enough to be off the board in tOut, however far that is */
          q.v = [(o.ux * Math.cos(j) - o.uy * Math.sin(j)) * bs + dx / d * sp, (o.uy * Math.cos(j) + o.ux * Math.sin(j)) * bs + dy / d * sp - 160 * r()];
          for (let k = 1; k <= 10; k++) { const t = k / 10 * tOut, ex = (1 - Math.exp(-.9 * t)) / .9, x = px0 + q.v[0] * ex, y = py0 + q.v[1] * ex + 70 * (t - ex), m = c * .5; /* the way it actually goes, scatter and all: if that would cross words, straight out instead */
            if (rects.some(([a2, b2, c2, d2]) => x > a2 - m && x < c2 + m && y > b2 - m && y < d2 + m)) { q.v = [o.ux * bs, o.uy * bs - 70 * tOut * .5]; break; } }
          q.w = (r() - .5) * 7; q.f = 3.2 + r() * 4; q.ph = r() * TAU; q.tum = .25 + r() * .75; } /* how far it turns over as it tumbles: some all the way, some only rock */
        // the eraser comes in from the side whose way is clear (the hand's, if both are) and goes back out that way
        const sideOk = sd => way(hit[0], hit[1], sd > 0 ? 0 : Math.PI).hits === 0, hand = S.side === "l" ? -1 : 1; e.throwSide = sideOk(hand) || !sideOk(-hand) ? hand : -hand;
        const spr = S.noteSpr(col, "", 0), ns = S.ns, hh = ns / 2, cc = ns * .2; /* and one with its corner lifted, as a note's own is */
        const sprC = make(ns, ns, x => { x.translate(hh, hh); x.beginPath(); x.moveTo(-hh, -hh); x.lineTo(hh, -hh); x.lineTo(hh, hh - cc); x.quadraticCurveTo(hh - cc * .5, hh - cc * .5, hh - cc, hh); x.lineTo(-hh, hh); x.closePath(); x.save(); x.clip(); x.drawImage(spr, -hh, -hh, ns, ns); x.restore();
          const tip = [hh - cc * .42, hh - cc * .42], gr = x.createLinearGradient(hh - cc * .5, hh - cc * .5, tip[0], tip[1]); gr.addColorStop(0, rgba(mix(col, K3, .22))); gr.addColorStop(.7, rgba(mix(col, W3, .25))); gr.addColorStop(1, rgba(mix(col, W3, .55)));
          x.fillStyle = "rgba(40,48,60,.16)"; x.beginPath(); x.moveTo(hh, hh - cc); x.quadraticCurveTo(hh + cc * .15, hh + cc * .15, hh - cc, hh); x.closePath(); x.fill();
          x.fillStyle = gr; x.beginPath(); x.moveTo(hh, hh - cc); x.quadraticCurveTo(hh - cc * .5, hh - cc * .5, hh - cc, hh); x.quadraticCurveTo(tip[0] - cc * .05, tip[1] + cc * .12, tip[0], tip[1]); x.quadraticCurveTo(tip[0] + cc * .12, tip[1] - cc * .05, hh, hh - cc); x.fill(); });
        Object.assign(e, { c, col, posts, extras, hit, spr, sprC, back: S.noteSpr(col, "", 0, true), tg: [EG.toggle[0], (EG.toggle[0] + EG.toggle[1]) / 2, EG.toggle[1]], rot0: (r() - .5) * .6 });
      }
      seedN = keep;
      return (S.eg = e);
    },
    /** the sponge (or the eraser) along its path in a window of its own */
    wiperAt(t, win) { const k = (t - win[0]) / (win[1] - win[0]); if (k <= 0 || k >= 1) return null; const f = S.wipe.at(k), q = along(S.wipe.ride, f * S.wipe.ride.len); return { s: f * S.wipe.len, x: q[0], y: q[1], dir: q[2] }; },
    /** the wet behind the sponge as it goes (s along its path), then drying back from its edges in (dk), as in a pass */
    eggWet(s, dk, a) {
      if (a <= .003) return; const st = S.wetS, f = dk * 5, i0 = Math.min(4, Math.floor(f)), fr = f - i0, W0 = S.wetAt;
      const put = (c, al) => { if (al > .003) { g.globalAlpha = al; g.drawImage(c, W0.x, W0.y, W0.w, W0.h); } };
      if (s < S.wipe.len) { const l = S.scr, x = l.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); x.drawImage(st[0], W0.x, W0.y, W0.w, W0.h); x.globalCompositeOperation = "destination-in"; x.strokeStyle = "#000"; x.lineWidth = S.band * 1.3; x.lineCap = "butt"; x.lineJoin = "miter"; trace(x, S.wipe, 0, Math.max(.1, s)); x.stroke(); x.globalCompositeOperation = "source-over"; x.lineCap = "round"; x.lineJoin = "round"; S.blit(l, a); }
      else { if (i0 < 4) put(st[i0 + 1], a); put(S.wetR[i0], a * (1 - fr)); }
      g.strokeStyle = "rgb(214,222,216)"; g.lineCap = "butt";
      S.wpass.forEach((ps, i) => { if (s <= ps.s0) return; const xe = lerp(ps.xa, ps.xb, clamp((s - ps.s0) / (ps.s1 - ps.s0))); for (const [o, al, lw, dash] of S.slurry) { const k = a * al * (1 - dk); if (k <= .003) continue; g.globalAlpha = k; g.lineWidth = lw; g.setLineDash(dash); g.lineDashOffset = i * 37 + o; g.beginPath(); g.moveTo(ps.xa, ps.y + o); g.lineTo(xe, ps.y + o); g.stroke(); } });
      g.setLineDash([]); g.lineDashOffset = 0; g.lineCap = "round"; g.globalAlpha = 1;
    },
    /** the egg's picture (a layer of its own) over the one the pass rests on, as far as the loop has the board (I) */
    eggMix(e, rest, vis, I) { if (I >= .99) { S.blit(e, vis); return; } const l = S.scr, x = l.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.globalAlpha = 1 - I; x.drawImage(rest.c, 0, 0); x.globalCompositeOperation = "lighter"; x.globalAlpha = I; x.drawImage(e.c, 0, 0); x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); S.blit(l, vis); },
    /** by night, lines: the sponge takes the lesson off as ever, and the hand writes its lines like a pupil kept in after
     *  school, "I will finish my list" four times down the room, and goes for the yellow to tick the last one; the sponge
     *  comes back for them, and as the slate dries the next lesson comes up through it, patch by patch, as if it had been
     *  there under the wet all along */
    eggNight(T, I, A, on, vis, pp) {
      const X = S.wholeOf(pp.prev), a = vis * I;
      if (!(on && T >= EG.wipe[0])) { S.blit(X, vis); return; }
      const e = S.eggOf(pp.P), w1 = S.wiperAt(T, EG.wipe), w2 = S.wiperAt(T, EG.wipe2), cur = pp.cur;
      // the next lesson, drawn whole out of sight a few strokes a frame while the lines go up (not all at once: a lesson is
      // a great many strokes), and from then on it is the lesson this pass leaves
      if (!cur.whole) { const L = e.Y || (e.Y = S.layer()); S.grow(L, cur.all, T < EG.lines[0] ? 0 : T >= EG.lines[1] ? 99 : (T - EG.lines[0]) / (EG.lines[1] - EG.lines[0]) * (cur.end + .1)); if (L.n >= cur.all.length) cur.whole = L; }
      const Y = cur.whole;
      const s1 = w1 ? w1.s : T >= EG.wipe[1] ? S.wipe.len : 0, s2 = w2 ? w2.s : T >= EG.wipe2[1] ? S.wipe.len : 0;
      // the wet: the first sponge's, drying while the lines go up; the second's, drying with the lesson in it
      if (T < EG.wipe2[0]) { if (T < EG.dry[1]) S.eggWet(s1, seg(T, EG.dry[0], EG.dry[1], x => x), a); }
      else if (T < EG.dry2[1]) S.eggWet(s2, seg(T, EG.dry2[0], EG.dry2[1], x => x), a);
      // the board: the lesson under the sponge; the lines going up; the lines under the sponge; the next lesson coming up
      if (T < EG.wipe[1]) S.wiped(s1, vis, I, X);
      else if (T < EG.wipe2[0]) { const st = S.grow(S.live, e.all, T); S.redrawn(vis, I, X); if (st) S.hand(st, T, a); }
      else {
        const L = e.L || (e.L = S.layer()), x = L.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, L.c.width, L.c.height);
        if (T < EG.wipe2[1]) { S.grow(S.live, e.all, T); x.drawImage(S.live.c, 0, 0); x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); if (s2 > 0) { x.globalCompositeOperation = "destination-out"; x.strokeStyle = "#000"; x.lineWidth = S.band; x.lineCap = "butt"; x.lineJoin = "miter"; trace(x, S.wipe, 0, s2); x.stroke(); x.globalCompositeOperation = "source-over"; x.lineCap = "round"; x.lineJoin = "round"; } }
        else { // the lesson: a ghost of it under the wet at first, then whole wherever the slate has dried
          // (the wet's own stages hide it: each is about half as dark as the wet is, so taken out three times they leave a
          // ghost of it, about a seventh, under what is still wet)
          const dk = seg(T, EG.dry2[0], EG.dry2[1], x => x); x.globalAlpha = clamp((T - EG.dry2[0]) / .4); if (Y) x.drawImage(Y.c, 0, 0); x.globalAlpha = 1; x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px);
          if (dk < 1) { const W0 = S.wetAt, f = dk * 5, i0 = Math.min(4, Math.floor(f)), fr = f - i0; x.globalCompositeOperation = "destination-out"; for (let n = 0; n < 3; n++) { x.globalAlpha = 1; if (i0 < 4) x.drawImage(S.wetS[i0 + 1], W0.x, W0.y, W0.w, W0.h); x.globalAlpha = 1 - fr; x.drawImage(S.wetR[i0], W0.x, W0.y, W0.w, W0.h); } x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; } }
        S.eggMix(L, X, vis, I);
      }
      // the dust: a puff where each stroke begins, specks falling from the stick as it goes
      if (T < EG.wipe2[1]) { for (const st of e.all) { const age = T - st.t0; if (age < 0 || age > .5) continue; const k = age / .5, R = S.box.u * (.35 + .5 * E.out(k)); g.globalAlpha = a * .22 * (1 - k); g.drawImage(S.puffs[st.col], st.p[0][0] - R, st.p[0][1] - R, R * 2, R * 2); }
        for (const d of e.dust) { const age = T - d.t; if (age < 0 || age > d.life) continue; g.globalAlpha = a * .55 * (1 - age / d.life); g.fillStyle = rgba(INKS[d.c]); g.fillRect(d.x + d.vx * age, d.y + d.vy * age + 70 * age * age, d.s, d.s); }
        g.globalAlpha = 1; }
      S.drawWiper(w1 || w2, a, A);
      S.tool(S.toolAt(T, e.phases), a);
    },
    /** a sticky note, plain: its shadow (further off when it's off the board) and its face, or its back when it has
     *  turned over */
    post(n, sp, x, y, rot, sc, a, lift = 0, flip = 1) {
      if (a <= .003) return; const s = n.s * sc, ks = n.s / S.ns, fy = Math.abs(flip) < .04 ? .04 : flip, sh = S.noteSh;
      g.save(); g.globalAlpha = a * (.85 - lift * .4); g.translate(x + 1.5 + lift * s * .14, y + 2.5 + lift * s * .22); g.rotate(rot); g.scale(sc * ks * (1 + lift * .1), sc * ks * fy * (1 + lift * .1)); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore();
      g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(1, fy); g.drawImage(fy < 0 ? sp[1] : sp[0], -s / 2, -s / 2, s, s); g.restore();
    },
    /** by day, the invader: the old plan's notes peel off and the eraser takes it off, as in any pass; then, on the clean
     *  board, the hand slaps sticky notes on in rows, quick as cards dealt, and they make a space invader, the crab, in a
     *  neon pad; it waves its arms (the notes hop to their places in the other frame, as a wall of them is animated); the
     *  eraser is thrown at it, and it bursts into its notes, which tumble off the board; and the hand gets on with the
     *  plan, briskly, a colour at a time, its notes slapped on, as the pass would have drawn it */
    eggDay(T, I, A, on, vis, pp) {
      const a = vis * I, rest = S.wholeOf(pp.prev), cur = pp.cur, WP = S.wipeAll, WB = BW.wipe, Ty = T < EG.plan ? 0 : 3 + (T - EG.plan) * EG.k;
      if (!(on && T >= WB[0])) S.blit(rest, vis);
      else {
        const k = (T - WB[0]) / (WB[1] - WB[0]), s = k <= 0 ? 0 : k >= 1 ? WP.len : WP.at(k) * WP.len, gh = a * env(T, WB[0], WB[0] + .3, BW.ghost[0], BW.ghost[1], E.sine);
        if (gh > .003) { S.blit(rest, gh * .03); g.save(); g.translate(7, 1); S.blit(rest, gh * .02); g.restore(); }
        if (T < WB[1]) S.wiped(s, vis, I, rest, WP, S.band2);
        else { const st = S.grow(S.live, cur.all, Ty); S.redrawn(vis, I, rest); if (st) S.hand(st, Ty, a); }
      }
      const curl = n => .12 + .025 * Math.sin(A * .9 + n.ph);
      pp.prev.notes.forEach((n, i) => { const tp0 = BW.peel + i * BW.gap, tp1 = tp0 + .55; S.sprOf(n);
        if (!on || T < tp0) { S.note(n, n.x, n.y, n.rot, 1, curl(n), vis, 0); return; }
        if (I < .99) S.note(n, n.x, n.y, n.rot, 1, curl(n), vis * (1 - I), 0);
        S.peel(n, T, tp0, tp1, A, a, curl(n)); });
      if (on) for (const n of cur.notes) { if (Ty < n.slap) continue; S.sprOf(n); if (Ty >= n.slap + .6) S.note(n, n.x, n.y, n.rot, 1, curl(n), a, 0); else { const sl = S.slap(Ty - n.slap); S.note(n, n.x, n.y - sl.lift * n.s * .08, n.rot + sl.lift * .12, sl.sc, curl(n) + sl.flap, a * sl.a, sl.lift); } }
      if (on) { const k = (T - WB[0]) / (WB[1] - WB[0]); if (k > 0 && k < 1) { const f = WP.at(k), q = along(WP.ride, f * WP.ride.len); S.drawWiper({ x: q[0], y: q[1], dir: q[2] }, a, A, S.sponge2, S.spongeSh2); } }
      if (on && Ty > 0 && Ty < cur.end + .4) S.tool(S.toolAt(Ty, cur.phases), a);
      if (!on || T < EG.slap[0] || T > EG.burst[1] + .2) return;
      const e = S.eggOf(pp.P), c = e.c, tb = EG.burst[0], SP = [e.spr, e.back], SC = [e.sprC, e.back];
      // where the invader is in its frames: the toggles so far, and a hop in progress
      const tg = e.tg, HOP = .2, nT = tg.filter(t => T >= t).length, hopK = nT ? clamp((T - tg[nT - 1]) / HOP) : 1;
      const burst = (q, x0, y0, rot0) => { const t = T - tb, kk = .9, ex = (1 - Math.exp(-kk * t)) / kk, x = x0 + q.v[0] * ex + Math.sin(t * 3.1 + q.ph) * c * .25 * clamp(t * 3), y = y0 + q.v[1] * ex + 70 * (t - ex), m = q.s; /* paper: it slows in the air and drifts down */
        if (x < -m || x > S.W + m || y > S.H + m || y < -m * 3) return; S.post(q, q.curl ? SC : SP, x, y, rot0 + q.w * ex + Math.sin(t * 4 + q.ph) * .3, 1.04, a * (1 - seg(T, EG.burst[1] - .35, EG.burst[1])), clamp(t * 6), 1 - q.tum * (1 - Math.cos(t * q.f))); };
      for (const q of e.posts) {
        if (T < q.ts) continue;
        let x = q.x, y = q.y; const moving = q.k2 !== undefined;
        if (moving && nT) { const toB = nT % 2 === 1, k = E.io(hopK), [fx, fy, tx, ty] = toB ? [q.x, q.y, q.x2, q.y2] : [q.x2, q.y2, q.x, q.y];
          x = lerp(fx, tx, k); y = lerp(fy, ty, k) - Math.sin(Math.PI * k) * c * .45; if (T >= tb) { burst(q, x, y, q.rot); continue; } if (k < 1) { S.post(q, q.curl ? SC : SP, x, y, q.rot + Math.sin(Math.PI * k) * .25, 1 + .1 * Math.sin(Math.PI * k), a, Math.sin(Math.PI * k)); continue; } }
        if (T >= tb) { burst(q, x, y, q.rot); continue; }
        const k = T - q.ts; if (k < .3) { const sl = S.slap(k * 2); S.post(q, q.curl ? SC : SP, x, y - sl.lift * c * .3, q.rot + sl.lift * .2, sl.sc, a * sl.a, sl.lift); } else S.post(q, q.curl ? SC : SP, x, y, q.rot, 1, a, 0);
      }
      // the note more that the arms want when they're up: slapped on, taken off again, slapped on
      for (const q of e.extras) for (const [t0, t1] of [[tg[0], tg[1]], [tg[2], 99]]) {
        if (T < t0) continue;
        if (T >= tb && t1 > tb) { burst(q, q.x, q.y, q.rot); continue; }
        if (T >= t1) { const k = (T - t1) / .3; if (k < 1) S.post(q, q.curl ? SC : SP, q.x + e.throwSide * E.in(k) * S.W * .7, q.y - Math.sin(k * 2) * c, q.rot + k * 2, 1 + .12 * Math.sin(Math.PI * Math.min(1, k * 2)), a, Math.min(1, k * 3)); continue; }
        const k = T - t0; if (k < .3) { const sl = S.slap(k * 2.2); S.post(q, q.curl ? SC : SP, q.x, q.y - sl.lift * c * .3, q.rot + sl.lift * .2, sl.sc, a * sl.a, sl.lift); } else S.post(q, q.curl ? SC : SP, q.x, q.y, q.rot, 1, a, 0);
      }
      // the eraser, thrown: in from the side (the hand's, if its way is clear), turning over and over, at the invader; it
      // knocks it to bits and goes back out the way it came
      const [th0, th1] = EG.throw;
      if (T >= th0 && T < th1 + 1.2) {
        const spr = S.sponge2, sh = S.spongeSh2, dir = e.throwSide, q = e.hit, st0 = [dir < 0 ? -spr.h2 : S.W + spr.h2, q[1] + c * 1.4];
        let x, y, rot, lift;
        if (T < th1) { const k = (T - th0) / (th1 - th0); x = lerp(st0[0], q[0], k); y = lerp(st0[1], q[1], k) - Math.sin(Math.PI * k) * c * 1.6; rot = e.rot0 - dir * k * TAU * 1.6; lift = 1 - k; }
        else { const t = T - th1; x = q[0] + dir * 820 * t; y = q[1] - 300 * t + 700 * t * t; rot = e.rot0 - dir * (TAU * 1.6 - t * 8); lift = clamp(t * 4); } /* back the way it came, off the board */
        if (y - spr.h2 < S.H && x + spr.h2 > 0 && x - spr.h2 < S.W) { g.save(); g.globalAlpha = a * .7 * (1 - lift * .5); g.translate(x + 6 + lift * 26, y + 10 + lift * 34); g.rotate(rot); g.drawImage(sh, -sh.w2 / 2, -sh.h2 / 2, sh.w2, sh.h2); g.restore();
          g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot); g.scale(1 + lift * .12, 1 + lift * .12); g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); }
      }
    },
    /* ---------------- 1.12 b430: the long day's hour eggs ----------------
       Once in each hour of the list left alone (K.long: 1 in the odd hours, 2 in the even), for whoever has left it up
       that long: the hand draws something, and then the drawing comes alive. Each starts from the picture the pass before
       it left and ends on the one this pass would have drawn (pic(P)), so the pass after it rests on just what it always
       would; each has dice of its own, and chalk (or ink) of its own. */
    hour(T, I, A, on, vis, pp, lg) { S[chalk ? (lg === 1 ? "proof" : "rocket") : (lg === 1 ? "machine" : "maze")](T, I, A, on, vis, pp); },
    /** the hour's egg for this room and this pass, worked out once */
    hourOf(P, lg) {
      const b = S.box; if (S.hr && S.hr.box === b && S.hr.P === P) return S.hr;
      const keep = seedN, h = { box: b, P, lg }; seedN = 820000 + (P % 997) * 500;
      S[chalk ? (lg === 1 ? "proofOf" : "rocketOf") : (lg === 1 ? "machineOf" : "mazeOf")](h, K.deal(P, chalk ? 97 : 98));
      seedN = keep; return (S.hr = h);
    },
    /** this pass's own picture, drawn whole out of sight a few strokes a frame from t0 to t1 (a lesson is a great many
     *  strokes): from then on it is the picture this pass leaves */
    hidden(h, cur, T, t0, t1) { if (cur.whole) return cur.whole; const L = h.Y || (h.Y = S.layer()); S.grow(L, cur.all, T < t0 ? 0 : T >= t1 ? 99 : (T - t0) / (t1 - t0) * (cur.end + .1)); if (L.n >= cur.all.length) cur.whole = L; return cur.whole; },
    /** a field over the room's layers (f: page x, y → 0 … 1), as stages to take a layer through: stage i is where f is
     *  past i/n (`hi`), and short of it (`lo`), and ring i what lies between stage i and the next; worked out a third of
     *  the size and stretched soft, as the wet is */
    fieldOf(f, n = 8) {
      const q = 1 / 3, w = Math.ceil(S.live.c.width / px * q), hh = Math.ceil(S.live.c.height / px * q), v = new Float32Array(w * hh), e = .45 / n;
      for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) v[j * w + i] = f(S.lx + (i + .5) / q, S.ly + (j + .5) / q);
      const al = (t, i) => i <= 0 ? 1 : i >= n ? 0 : clamp((t - i / n) / e + .5);
      const img = fn => { const [c, x] = canvas(w, hh), im = x.createImageData(w, hh), o = im.data; for (let k = 0; k < w * hh; k++) { const a = fn(v[k]); if (a <= 0) continue; o[k * 4 + 3] = Math.round(255 * Math.min(1, a)); } x.putImageData(im, 0, 0); return c; };
      return { n, hi: Array.from({ length: n + 1 }, (_, i) => img(t => al(t, i))), lo: Array.from({ length: n + 1 }, (_, i) => img(t => 1 - al(t, i))), ring: Array.from({ length: n }, (_, i) => img(t => al(t, i) - al(t, i + 1))), at: { x: S.lx, y: S.ly, w: w / q, h: hh / q } };
    },
    /** a layer taken through a field at τ (0 … 1): what lies past τ (hi), or short of it, soft at the edge, on a scratch
     *  layer, then drawn */
    through(src, fd, tau, hi, a, l = S.scr) {
      if (a <= .003) return; const x = l.x, n = fd.n, f = clamp(tau) * n, i = Math.min(n - 1, Math.floor(f)), fr = f - i, at = fd.at;
      x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.drawImage(src.c, 0, 0); x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); x.globalCompositeOperation = "destination-out";
      if (hi) { if (i > 0) x.drawImage(fd.lo[i], at.x, at.y, at.w, at.h); if (fr > .003) { x.globalAlpha = fr; x.drawImage(fd.ring[i], at.x, at.y, at.w, at.h); } }
      else { x.drawImage(fd.hi[i + 1], at.x, at.y, at.w, at.h); if (fr < .997) { x.globalAlpha = 1 - fr; x.drawImage(fd.ring[i], at.x, at.y, at.w, at.h); } }
      x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; S.blit(l, a);
    },
    /** how far into the room a point is, as a fade: none at its edge and beyond, whole a little way in (what drifts toward
     *  the edge of the room goes out before it, and so never nearer the words than the room is) */
    edge(x, y) { const b = S.box, d = Math.min(x - b.x, b.x + b.w - x, y - b.y, b.y + b.h - y) + 6; return clamp(d / (b.u * 1.4)); },
    /** what is drawn by fn, kept to the room and a few pixels round it (the glows' soft edges, what has drifted) */
    roomClip(fn) { const b = S.box; g.save(); g.beginPath(); g.rect(b.x - 8, b.y - 8, b.w + 16, b.h + 16); g.clip(); fn(); g.restore(); },
    /** the dust of the hand's strokes: a puff where each begins, specks falling from the stick as it goes */
    handDust(all, dust, T, a) {
      for (const st of all) { const age = T - st.t0; if (age < 0 || age > .5) continue; const k = age / .5, R = S.box.u * (.35 + .5 * E.out(k)); g.globalAlpha = a * .22 * (1 - k); g.drawImage(S.puffs[st.col], st.p[0][0] - R, st.p[0][1] - R, R * 2, R * 2); }
      for (const d of dust) { const age = T - d.t; if (age < 0 || age > d.life) continue; g.globalAlpha = a * .55 * (1 - age / d.life); g.fillStyle = rgba(INKS[d.c]); g.fillRect(d.x + d.vx * age, d.y + d.vy * age + 70 * age * age, d.s, d.s); }
      g.globalAlpha = 1;
    },
    /* by night, the proof */
    /** its figure for this room: a right triangle (three, four, five) on the square on its long side, the squares on its
     *  legs, the larger of them cut in four through its middle along the long side and across it; and the five pieces,
     *  each with where it goes in the big square, only ever slid (Perigal's dissection, 1873) */
    proofOf(h, r) {
      const H = HB.proof, b = h.box, u = b.u, tall = b.k === "tall", cb = .8, sb = .6, add = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k];
      const A = [0, 0], B2 = [1, 0], C = [cb * cb, -cb * sb], nb = [-sb * cb, -cb * cb], na = [cb * sb, -sb * sb], sqB = [A, C, add(C, nb), add(A, nb)], sqA = [C, B2, add(B2, na), add(C, na)];
      const Ob = [(A[0] + sqB[2][0]) / 2, (A[1] + sqB[2][1]) / 2], Oa = [(C[0] + sqA[2][0]) / 2, (C[1] + sqA[2][1]) / 2];
      // laid in the room as it is in a tall one, on its side in a wide one (the big square to the right, the sum beside it)
      const R = tall ? (p => p) : (p => [p[1], -p[0]]), pts = [...sqB, ...sqA, [0, 1], [1, 1]].map(R), fx0 = Math.min(...pts.map(p => p[0])), fx1 = Math.max(...pts.map(p => p[0])), fy0 = Math.min(...pts.map(p => p[1])), fy1 = Math.max(...pts.map(p => p[1])), fw = fx1 - fx0, fh = fy1 - fy0;
      const STR = "a² + b² = c²", se = clamp(u * 1.3, 12, 34), wq = width(STR, se);
      const cp = tall ? Math.min((b.w - 2 * u) / fw, (b.h - 2.4 * u - se * 2.7) / fh) : Math.min((b.w - 3.6 * u - wq) / fw, (b.h - 2 * u) / fh);
      const bw = tall ? fw * cp : fw * cp + 1.6 * u + wq, bh = tall ? fh * cp + se * 2.7 : fh * cp, ox = b.x + (b.w - bw) / 2 - fx0 * cp, oy = b.y + (b.h - bh) / 2 - fy0 * cp;
      const Pg = p => { const q = R(p); return [ox + q[0] * cp, oy + q[1] * cp]; }, W = clamp(u * .2, 2.4, 6), white = [], fills = [], yel = [];
      const put = (list, q, col, k = 1, kind = "l", ex) => { const st = mk(q, col, W * k, kind); if (ex) Object.assign(st, ex); list.push(st); return st; }, L = (p, q) => hline(Pg(p), Pg(q), r, .006);
      // white: the triangle, the square on its long side, the squares on its legs, the right angle, the cuts, its sides named
      put(white, [...L(A, C), ...L(C, B2).slice(1), ...L(B2, A).slice(1)], 0, 1.15);
      put(white, poly([A, [0, 1], [1, 1], B2].map(Pg), r, .005), 0, 1.05);
      put(white, poly([A, sqB[3], sqB[2], C].map(Pg), r, .005), 0, 1);
      put(white, poly([C, sqA[3], sqA[2], B2].map(Pg), r, .005), 0, 1);
      { const q = .07, ua = [(A[0] - C[0]) / cb, (A[1] - C[1]) / cb], ub = [(B2[0] - C[0]) / sb, (B2[1] - C[1]) / sb]; put(white, [Pg(add(C, ua, q)), Pg(add(add(C, ua, q), ub, q)), Pg(add(C, ub, q))], 0, .75); }
      const G = [(A[0] + B2[0] + C[0]) / 3, (A[1] + B2[1] + C[1]) / 3], sl = clamp(cp * .085, 8, 22);
      for (const [ch, p, q] of [["b", A, C], ["a", C, B2], ["c", B2, A]]) { const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], at = Pg(add(m, [G[0] - m[0], G[1] - m[1]], .5)), tw = width(ch, sl); write(ch, at[0] - tw / 2, at[1] + sl * .28, sl, 60 + ch.charCodeAt(0)).forEach(p2 => put(white, p2, 0, .8, "w")); }
      // pink, then blue: the small squares shaded in with the side of the stick
      const shade = (sq, col, ang) => { const q = sq.map(Pg), xs = q.map(p => p[0]), ys = q.map(p => p[1]); return put(fills, zigzag(inPoly(q, u * .2), [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], u * .5, ang, r), col, 2.3, "l", { soft: .7 }); };
      shade(sqA, 3, tall ? -.75 : .8); shade(sqB, 1, tall ? -1.1 : .45);
      // white again: the larger square cut in four through its middle, along the long side and across it
      const cuts = []; put(cuts, L([Ob[0] - .5, Ob[1]], [Ob[0] + .5, Ob[1]]), 0, .85); put(cuts, L([Ob[0], Ob[1] - .5], [Ob[0], Ob[1] + .5]), 0, .85);
      // yellow, at the end: the sum, boxed
      const eq = tall ? [ox + (fx0 + fw / 2) * cp - wq / 2, oy + fy1 * cp + se * 2.15] : [ox + fx1 * cp + 1.6 * u, oy + (fy0 + fh / 2) * cp + se * .4];
      write(STR, eq[0], eq[1], se, 71).forEach(p => put(yel, p, 2, clamp(se / u * .9, .8, 1.25), "w"));
      put(yel, hbox(eq[0] - .55 * u, eq[1] - se * 1.5, eq[0] + wq + .55 * u, eq[1] + se * .6, r, .1 * u), 2, .95);
      h.phases = [{ col: 0, win: H.fig, strokes: white }, { col: 3, win: H.tintA, strokes: [fills[0]] }, { col: 1, win: H.tintB, strokes: [fills[1]] }, { col: 0, win: H.cut, strokes: cuts }, { col: 2, win: H.eq, strokes: yel }];
      pace(h.phases, u); h.board = [...white, ...cuts, ...yel]; h.fills = fills; h.all = [...white, ...fills, ...cuts, ...yel]; h.c2 = [Pg([.5, .5]), cp]; h.dust = dustOf(h.all, rng(7200 + h.P % 9973));
      // the pieces: the larger square's four (each to the corner its two cut edges fit), then the small square, to the middle
      const edge = q => { const p2 = []; q.forEach((p0, i) => { const p1 = q[(i + 1) % q.length], n = Math.max(2, Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 5)); for (let j = 0; j < n; j++) p2.push([lerp(p0[0], p1[0], j / n), lerp(p0[1], p1[1], j / n)]); }); p2.push(q[0]); return mk(p2, 0, W * .85); };
      h.pieces = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => { const q = clipHalf(clipHalf(sqB, sx, 0, sx * Ob[0]), 0, sy, sy * Ob[1]), p0 = Pg(Ob), p1 = Pg([sx > 0 ? 0 : 1, sy > 0 ? 0 : 1]); return { poly: q.map(Pg), dx: p1[0] - p0[0], dy: p1[1] - p0[1], col: 1, t0: H.slide + i * .34, dur: 1, wig: (r() - .5) * .08 }; });
      { const p0 = Pg(Oa), p1 = Pg([.5, .5]); h.pieces.push({ poly: sqA.map(Pg), dx: p1[0] - p0[0], dy: p1[1] - p0[1], col: 3, t0: H.slide + 3 * .34 + 1.08, dur: 1.05, wig: .05 }); }
      h.pieces.forEach((pc, i) => { pc.edge = edge(pc.poly); pc.d = Math.hypot(pc.dx, pc.dy) || 1; pc.bow = pc.d * (.1 + r() * .06) * (i % 2 ? 1 : -1); pc.c = [pc.poly.reduce((m, p) => m + p[0], 0) / pc.poly.length, pc.poly.reduce((m, p) => m + p[1], 0) / pc.poly.length]; pc.r = Math.sqrt(Math.abs(pc.poly.reduce((m, p, j) => { const q = pc.poly[(j + 1) % pc.poly.length]; return m + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2); });
      // the sweep the proof goes up in and the next lesson settles in: across the room, a little ragged
      const n2 = noise2(31, 64); h.ff = (x, y) => clamp(.1 + .78 * (.62 * (x - b.x) / b.w + .38 * (y - b.y) / b.h) + .26 * (n2(x / 24, y / 24) - .5), .001, .999);
    },
    /** by night, the proof: the chalk draws a right triangle on the square on its long side and the squares on its legs,
     *  shades the small squares in, and cuts the larger in four through its middle; then the pieces lift off the slate one
     *  by one and slide, never turning, into the big square, the smallest last into the hole the others leave in its
     *  middle, and the big square glows; it writes a² + b² = c² by them and boxes it; and the proof goes up in dust that drifts across the room and
     *  settles, a patch at a time, into the next lesson */
    proof(T, I, A, on, vis, pp) {
      const H = HB.proof, X = S.wholeOf(pp.prev), a = vis * I;
      if (!(on && T >= H.wipe[0])) { S.blit(X, vis); return; }
      const h = S.hourOf(pp.P, 1), cur = pp.cur, w1 = S.wiperAt(T, H.wipe), s1 = w1 ? w1.s : T >= H.wipe[1] ? S.wipe.len : 0;
      S.hidden(h, cur, T, H.fig[0], H.eq[0]);
      if (T < H.dry[1]) S.eggWet(s1, seg(T, H.dry[0], H.dry[1], x => x), a);
      if (T < H.wipe[1]) S.wiped(s1, vis, I, X);
      else {
        if (I < .99) S.blit(X, vis * (1 - I));
        if (T < H.out[0]) { S.pieces(h, T, a, 0); const st = S.grow(S.live, h.board, T); S.blit(S.live, a); if (st) S.hand(st, T, a); S.pieces(h, T, a, 1); }
        else S.proofOut(h, cur, T, A, a);
        S.handDust(h.all, h.dust, T, a);
      }
      S.drawWiper(w1, a, A);
      S.tool(S.toolAt(T, h.phases), a);
    },
    /** the small squares shaded in where they are (under the board's lines, so the cuts show across the shading); from
     *  `slide` on (over the board), the pieces cut out of the shading lifting off one by one, coming unstuck with a little
     *  wiggle, each with its shadow, sliding home and settling with a little give, a puff of dust as each goes and as each
     *  lands; and when the last is home, the big square glows a moment */
    pieces(h, T, a, over) {
      const H = HB.proof, F = h.F || (h.F = S.layer());
      if (T < H.slide) { if (!over) { const st = S.grow(F, h.fills, T); S.blit(F, a); if (st) S.hand(st, T, a, F); } return; }
      S.cutPieces(h); const fly = [], u = h.box.u;
      if (!over) { for (const pc of h.pieces) if (T <= pc.t0) drawSpr(pc.sf, 0, 0, a); return; }
      const last = h.pieces[h.pieces.length - 1], gk = env(T, last.t0 + last.dur - .1, last.t0 + last.dur + .25, last.t0 + last.dur + .5, last.t0 + last.dur + 1.3, E.sine); if (gk > .01) { const [c2, s2] = h.c2, R2 = s2 * 1.05; g.globalAlpha = a * .38 * gk; g.drawImage(S.puffs[2], c2[0] - R2, c2[1] - R2, R2 * 2, R2 * 2); g.globalAlpha = 1; }
      for (const pc of h.pieces) { const k = (T - pc.t0) / pc.dur; if (k >= 1) { const sc = 1 - .028 * Math.sin(Math.PI * clamp((k - 1) * pc.dur / .22)); drawSpr(pc.sf, pc.dx, pc.dy, a, sc, 0, pc.c[0] + pc.dx, pc.c[1] + pc.dy); drawSpr(pc.se, pc.dx, pc.dy, a, sc, 0, pc.c[0] + pc.dx, pc.c[1] + pc.dy); } else if (k > 0) fly.push([pc, k]); }
      for (const [pc, k] of fly) { const lift = seg(k, 0, .16, E.out) * (1 - seg(k, .84, 1, E.in)), tr = seg(k, .08, .92, E.io), bow = Math.sin(Math.PI * tr) * pc.bow, dx = pc.dx * tr - pc.dy / pc.d * bow, dy = pc.dy * tr + pc.dx / pc.d * bow, sc = 1 + .07 * lift, rot = k < .2 ? pc.wig * Math.sin(k / .2 * TAU) * (1 - k / .2) : 0;
        drawSpr(pc.ss, dx + lift * u * .3, dy + lift * u * .5, a * .55 * lift, sc, rot); drawSpr(pc.sf, dx, dy, a, sc, rot); drawSpr(pc.se, dx, dy, a * clamp(k / .12), sc, rot); }
      for (const pc of h.pieces) for (const [t, dx, dy] of [[pc.t0, 0, 0], [pc.t0 + pc.dur, pc.dx, pc.dy]]) { const age = T - t; if (age < 0 || age > .6) continue; const k = age / .6, R2 = pc.r * (.75 + .6 * E.out(k)); g.globalAlpha = a * .2 * (1 - k); g.drawImage(S.puffs[pc.col], pc.c[0] + dx - R2, pc.c[1] + dy - R2, R2 * 2, R2 * 2); }
      g.globalAlpha = 1;
    },
    /** each piece cut out of the shading, its edge in white, and the shadow it casts when it is lifted */
    cutPieces(h) {
      if (h.cut) return; h.cut = 1; const F = h.F || (h.F = S.layer()), u = h.box.u; S.grow(F, h.fills, 99);
      for (const pc of h.pieces) { const xs = pc.poly.map(p => p[0]), ys = pc.poly.map(p => p[1]), bb = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], path = x => { x.beginPath(); pc.poly.forEach(([p, q], i) => i ? x.lineTo(p, q) : x.moveTo(p, q)); x.closePath(); };
        const sf = pc.sf = boxCanvas(...bb, u), x = sf.ctx; x.save(); path(x); x.clip(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(F.c, Math.round((sf.x0 - S.lx) * px), Math.round((sf.y0 - S.ly) * px), sf.c.width, sf.c.height, 0, 0, sf.c.width, sf.c.height); x.restore();
        pc.se = boxCanvas(...bb, u); strokesOn(pc.se.ctx, [pc.edge]);
        const ss = pc.ss = boxCanvas(...bb, u), y = ss.ctx; y.shadowColor = "rgba(0,0,0,.62)"; y.shadowBlur = u * .45 * px; y.shadowOffsetY = 1000 * px; y.fillStyle = "#000"; y.translate(0, -1000); path(y); y.fill(); }
    },
    /** the proof's lines as they stand at its end, on a layer of its own: the board's and the sum's, the pieces' edges home */
    proofZ(h) { if (h.Z) return h.Z; S.grow(S.live, h.board, 99); S.cutPieces(h); const Z = h.Z = S.layer(); Z.x.save(); Z.x.setTransform(1, 0, 0, 1, 0, 0); Z.x.drawImage(S.live.c, 0, 0); Z.x.restore(); for (const pc of h.pieces) Z.x.drawImage(pc.se.c, pc.se.x0 + pc.dx, pc.se.y0 + pc.dy, pc.se.w, pc.se.h); return Z; },
    /** the proof going up in dust, and the next lesson coming down out of it, the same sweep a moment behind */
    proofOut(h, cur, T, A, a) { const [, o1] = HB.proof.out; if (T >= o1) S.blit(S.hidden(h, cur, T, 0, 0), a); else S.drift(h, cur, T, A, a); },
    /** a soft round mark, to eat a layer away with or to let one through */
    disc() { return S.dk || (S.dk = paint(33, 33, (x, y) => { const d = Math.hypot(x - 16, y - 16) / 16.5; return d >= 1 ? null : [0, 0, 0, Math.round(255 * clamp((1 - d) * 2.4))]; })); },
    /** the dust: as the sweep takes each bit of the proof's lines it crumbles (each piece's shading fading as it goes), and its dust goes up off the slate and away on the
     *  air toward the window, thinning out; a moment behind it, dust comes down out of the air onto the next lesson, and
     *  where it settles, there the lesson is; brighter where the window's light falls */
    drift(h, cur, T, A, a) {
      const [o0, o1] = HB.proof.out, u = h.box.u; let pt = h.pt;
      if (!pt || pt.cur !== cur) {
        const r = K.deal(h.P, 99), step = Math.max(3.5, u * .33), f = h.ff, sr = [], tg = [];
        for (const st of h.board) { const n = Math.max(1, Math.round(st.len / step)); for (let i = 0; i < n; i++) { const q = along(st, (i + r()) / n * st.len); sr.push([q[0], q[1], st.col, step * .9 + st.w * .55]); } }
        for (const pc of h.pieces) { const e = pc.edge, n = Math.max(1, Math.round(e.len / step)); for (let i = 0; i < n; i++) { const q = along(e, (i + r()) / n * e.len); sr.push([q[0] + pc.dx, q[1] + pc.dy, 0, step * .9 + e.w * .55]); } }
        const fl = []; for (const pc of h.pieces) { pc.tf = o0 + f(pc.c[0] + pc.dx, pc.c[1] + pc.dy) * 1.4; const ins = inPoly(pc.poly), xs = pc.poly.map(p => p[0]), ys = pc.poly.map(p => p[1]); for (let y = Math.min(...ys); y < Math.max(...ys); y += step * 1.25) for (let x = Math.min(...xs); x < Math.max(...xs); x += step * 1.25) if (ins(x, y)) fl.push([pc.tf + r() * .55, [x + pc.dx, y + pc.dy, pc.col, 0]]); }
        for (const st of cur.all) { const n = Math.max(1, Math.round(st.len / step * (st.soft ? .5 : 1))); for (let i = 0; i < n; i++) { const q = along(st, (i + r()) / n * st.len); tg.push([q[0], q[1], st.col]); } }
        // going up: each bit off on the air as the sweep takes it (in the order it goes, so the crumbling can be kept up)
        const up = sr.map(q => [o0 + .05 + f(q[0], q[1]) * 1.4 + r() * .06, q]).concat(fl).sort((p, q) => p[0] - q[0]), M = up.length, Du = new Float32Array(M * 8);
        up.forEach(([t0, q], k) => { const an = -1.05 + (r() - .5) * 1.1, sp = u * (1.2 + r() * 2.2); Du.set([q[0], q[1], Math.cos(an) * sp, Math.sin(an) * sp, t0, .7 + r() * .5, q[2], q[3]], k * 8); });
        // coming down: onto the lesson, as many as it takes to find it (and no more than the slate can bear)
        const N = Math.min(1500, tg.length, Math.round(h.box.w * h.box.h / (u * u * .8))), Dn = new Float32Array(N * 8), rt = Math.max(3, step * tg.length / N * .8 + 1.5);
        const dn = Array.from({ length: N }, (_, i) => tg[Math.floor(i * tg.length / N)]).map(q => [o0 + .95 + f(q[0], q[1]) * (o1 - o0 - 1.2) + r() * .06, q]).sort((p, q) => p[0] - q[0]);
        dn.forEach(([t1, q], k) => { Dn.set([q[0], q[1], u * (.4 + r() * 1.2), -u * (1.4 + r() * 1.8), t1, .65 + r() * .4, q[2], rt], k * 8); });
        pt = h.pt = { cur, M, Du, N, Dn, sk: Math.max(1, Math.ceil(M / (h.box.w * h.box.h / (u * u * 1.1)))), big: Uint8Array.from({ length: Math.max(M, N) }, () => r() < .08 ? 1 : 0), bk: Array.from({ length: 42 }, () => []) };
      }
      const disc = S.disc(), { Du, Dn, M, N } = pt;
      // the proof, crumbling where its dust goes up (what is left of it between the bits, gone at the last)
      const zc = h.zc || (h.zc = S.layer()), zx = zc.x;
      if (pt.zt === undefined || T < pt.zt) { zx.save(); zx.setTransform(1, 0, 0, 1, 0, 0); zx.clearRect(0, 0, zc.c.width, zc.c.height); zx.drawImage(S.proofZ(h).c, 0, 0); zx.restore(); pt.zi = 0; }
      zx.globalCompositeOperation = "destination-out"; while (pt.zi < M && Du[pt.zi * 8 + 4] <= T) { const o = pt.zi * 8, R2 = Du[o + 7]; if (R2 > 0) zx.drawImage(disc, Du[o] - R2, Du[o + 1] - R2, R2 * 2, R2 * 2); pt.zi++; } zx.globalCompositeOperation = "source-over"; pt.zt = T;
      for (const pc of h.pieces) { const k = seg(T, pc.tf, pc.tf + .6, E.in); if (k < 1) drawSpr(pc.sf, pc.dx, pc.dy, a * (1 - k)); }
      S.blit(zc, a * (1 - seg(T, o0 + 1.15, o0 + 1.6, z => z)));
      // the next lesson, there where its dust has settled (and the last of it filled in at the end)
      const mk2 = h.mk || (h.mk = S.layer()), mx = mk2.x, Y = S.hidden(h, cur, T, 0, 0), y2 = h.Y2 || (h.Y2 = S.layer()), yx = y2.x, fin = seg(T, o1 - .45, o1, z => z);
      if (pt.mt === undefined || T < pt.mt) { mx.save(); mx.setTransform(1, 0, 0, 1, 0, 0); mx.clearRect(0, 0, mk2.c.width, mk2.c.height); mx.restore(); pt.mi = 0; }
      while (pt.mi < N && Dn[pt.mi * 8 + 4] <= T) { const o = pt.mi * 8, R2 = Dn[o + 7]; mx.drawImage(disc, Dn[o] - R2, Dn[o + 1] - R2, R2 * 2, R2 * 2); pt.mi++; } pt.mt = T;
      if (pt.mi || fin > 0) { yx.save(); yx.setTransform(1, 0, 0, 1, 0, 0); yx.clearRect(0, 0, y2.c.width, y2.c.height); yx.drawImage(mk2.c, 0, 0); if (fin > 0) { yx.globalAlpha = fin; yx.fillStyle = "#000"; yx.fillRect(0, 0, y2.c.width, y2.c.height); yx.globalAlpha = 1; } yx.globalCompositeOperation = "source-in"; yx.drawImage(Y.c, 0, 0); yx.globalCompositeOperation = "source-over"; yx.restore(); S.blit(y2, a); }
      // the specks, each a short streak the way it is going: up and away, slowing; down and in, settling
      const bk = pt.bk; for (const q of bk) q.length = 0;
      const put = (k, x0, y0, x, y, col, v) => { if (v < .05) return; const dx = x - x0, dy = y - y0, l = Math.hypot(dx, dy), c = l > 3 ? 3 / l : 1; bk[(col * 3 + Math.min(2, Math.floor(v * 3))) * 2 + pt.big[k]].push(x - dx * c, y - dy * c, x, y); };
      for (let k = 0; k < M; k++) { const o = k * 8, t0 = Du[o + 4], d = Du[o + 5]; if (T <= t0) break; if (T >= t0 + d || k % pt.sk) continue; const q = (T - t0) / d, q0 = Math.max(0, q - 1 / 30 / d), e = 1 - (1 - q) * (1 - q), e0 = 1 - (1 - q0) * (1 - q0), w = Math.sin(A * 3 + k) * u * .15 * q;
        const x = Du[o] + Du[o + 2] * e + w, y = Du[o + 1] + Du[o + 3] * e; put(k, Du[o] + Du[o + 2] * e0 + w, Du[o + 1] + Du[o + 3] * e0, x, y, Du[o + 6], (1 - q) * (.55 + .45 * S.lit(x, y)) * S.edge(x, y)); }
      for (let k = 0; k < N; k++) { const o = k * 8, t1 = Dn[o + 4], d = Dn[o + 5]; if (T >= t1) continue; if (t1 - 1.06 > T) break; if (T <= t1 - d) continue; const q = 1 - (t1 - T) / d, q0 = Math.max(0, q - 1 / 30 / d), e = (1 - q) * (1 - q), e0 = (1 - q0) * (1 - q0), w = Math.sin(A * 2.6 + k) * u * .12 * (1 - q);
        const x = Dn[o] + Dn[o + 2] * e + w, y = Dn[o + 1] + Dn[o + 3] * e; put(k, Dn[o] + Dn[o + 2] * e0 + w, Dn[o + 1] + Dn[o + 3] * e0, x, y, Dn[o + 6], clamp(q / .35) * (.55 + .45 * S.lit(x, y)) * S.edge(x, y)); }
      S.roomClip(() => { g.lineCap = "round"; bk.forEach((q, i) => { if (!q.length) return; g.strokeStyle = rgba(INKS[Math.floor(i / 6)]); g.globalAlpha = a * [.3, .55, .85][Math.floor(i / 2) % 3]; g.lineWidth = i % 2 ? 2.3 : 1.2; g.beginPath(); for (let j = 0; j < q.length; j += 4) { g.moveTo(q[j], q[j + 1]); g.lineTo(q[j + 2], q[j + 3]); } g.stroke(); }); });
      g.globalAlpha = 1;
    },
    /* by night, the rocket */
    /** its drawing for this room: the rocket on its pad by its tower, the ground, the moon it is for, the count; its flight
     *  (up off the pad and over toward the moon, smaller and smaller, away into the slate); its flame in four shapes; the
     *  smoke it goes up in; and the stardust the moon goes up in at the end */
    rocketOf(h, r) {
      const H = HB.rocket, b = h.box, u = b.u, tall = b.k === "tall", sd = S.side === "l" ? -1 : 1, X = f => b.x + b.w * (sd > 0 ? f : 1 - f), W = clamp(u * .2, 2.4, 6);
      const s = Math.min(b.h * (tall ? .5 : .56) / 11.2, b.w * (tall ? .28 : .22) / 5.2), gy = b.y + b.h * (tall ? .87 : .9), bx = X(tall ? .38 : .3), by = gy - 1.2 * s;
      const Rk = q => [bx + q[0] * s, by + q[1] * s], wR = [], wB = [], pk = [], bl = [], ye = [], fl = [], put = (list, q, col, k = 1, kind = "l", ex) => { const st = mk(q, col, W * k, kind); if (ex) Object.assign(st, ex); list.push(st); return st; };
      // white: the rocket (its hull, the band under its nose, its fins, its porthole, its nozzle); the pad, the ground, the tower and its arm
      put(wR, curve([[-1.2, -.2], [-1.2, -5.8], [-1.05, -7.4], [-.55, -8.8], [0, -9.9], [.55, -8.8], [1.05, -7.4], [1.2, -5.8], [1.2, -.2]], 6).map(Rk).concat([Rk([-1.2, -.2])]), 0, 1.1);
      put(wR, hline(Rk([-1.12, -7.3]), Rk([1.12, -7.3]), r, .01), 0, .8);
      for (const d of [-1, 1]) put(wR, [Rk([d * 1.2, -3.2]), Rk([d * 2.5, -.2]), Rk([d * 2.4, .4]), Rk([d * 1.2, -.3])], 0, .95);
      put(wR, hring(Rk([0, -5]), .62 * s, .62 * s, r, -2, .05), 0, 1);
      put(wR, [Rk([-.7, -.2]), Rk([-.95, .7]), Rk([.95, .7]), Rk([.7, -.2])], 0, .9);
      put(wB, hbox(bx - 2.7 * s, gy - .5 * s, bx + 2.7 * s, gy, r, .05 * s), 0, .9);
      put(wB, hline([b.x + b.w * .05, gy + .02 * s], [b.x + b.w * .95, gy], r, .003), 0, 1);
      const tx = bx - sd * 4.4 * s, tw = s, ty = gy - 10.4 * s;
      for (const o of [-.5, .5]) put(wB, hline([tx + o * tw, gy], [tx + o * tw, ty], r, .004), 0, .85);
      { const zz = []; for (let y = gy - .1 * s, k = 0; y > ty + .6 * s; y -= 1.05 * s, k++) zz.push([tx + (k % 2 ? .5 : -.5) * tw, y]); put(wB, zz, 0, .6); }
      const arm = []; put(arm, hline([tx + sd * .5 * tw, by - 7.6 * s], [bx - sd * 1.1 * s, by - 7.6 * s], r, .01), 0, .8); h.armP = [tx + sd * .5 * tw, by - 7.6 * s]; h.sd = sd; /* (it swings away as the rocket is lit) */
      // pink: the nose and the fins shaded; blue: the porthole
      const loc = (x, y) => [(x - bx) / s, (y - by) / s];
      put(pk, zigzag((x, y) => { const q = loc(x, y); return q[1] < -7.5 && Math.abs(q[0]) < (q[1] + 9.75) / 2.35; }, [bx - 1.2 * s, by - 10 * s, bx + 1.2 * s, by - 7.3 * s], .26 * s, -.9, r), 3, 1.7, "l", { soft: .72 });
      for (const d of [-1, 1]) put(pk, zigzag((x, y) => { const q = loc(x, y); return q[0] * d > 1.3 && q[1] < .15 && q[1] > -3 + (q[0] * d - 1.2) * 2.3; }, [bx + (d < 0 ? -2.6 : 1.2) * s, by - 3.3 * s, bx + (d < 0 ? -1.2 : 2.6) * s, by + .5 * s], .24 * s, -.6, r), 3, 1.5, "l", { soft: .72 });
      put(bl, spiral(Rk([0, -5]), .46 * s, .46 * s, 2.3, 0, r() * TAU), 1, 1.3);
      // yellow: the moon it is for, then the count, a beat between each
      const M = [X(tall ? .8 : .86), b.y + b.h * (tall ? .13 : .2)], Rm = Math.min(1.7 * s, b.w * .09);
      put(ye, [...harc(M, Rm, Rm, -Math.PI / 2, -Math.PI, r), ...harc([M[0] + .5 * Rm, M[1]], 1.118 * Rm, 1.118 * Rm, 2.034, 2.214, r).slice(1)].map(([x, y]) => [sd > 0 ? x : 2 * M[0] - x, y]), 2, 1.05);
      const cs = clamp(s * 2.1, 14, 46), CX = tall ? [X(.8), X(.8), X(.8)] : [X(.6), X(.72), X(.84)], CY = (tall ? [.42, .58, .74] : [.66, .66, .66]).map(f => b.y + b.h * f);
      ["3", "2", "1"].forEach((n, i) => { const tw2 = width(n, cs); write(n, CX[i] - tw2 / 2, CY[i] + cs * .5, cs, 120 + i).forEach((p, j) => put(ye, p, 2, clamp(cs / u * .7, .9, 1.3), "w", j ? undefined : { wait: i ? .4 : .1 })); });
      // orange: the flame it is lit with
      const FL = j => [[-.8, .75], [-.52, 1.75 + j[0]], [-.26, 1.2 + j[1]], [0, 2.85 + j[2]], [.26, 1.2 + j[3]], [.52, 1.75 + j[4]], [.8, .75]];
      put(fl, curve(FL([0, 0, 0, 0, 0]).map(Rk), 6), 5, 1.2);
      h.phases = [{ col: 0, win: H.white, strokes: [...wR, ...wB, ...arm] }, { col: 3, win: H.pink, strokes: pk }, { col: 1, win: H.blue, strokes: bl }, { col: 2, win: H.count, strokes: ye }, { col: 5, win: H.flame, strokes: fl }];
      pace(h.phases, u); h.board = [...wB, ...ye]; h.rk = [...wR, ...pk, ...bl]; h.fl = fl; h.arm = arm; h.all = [...wR, ...wB, ...arm, ...pk, ...bl, ...ye, ...fl]; h.dust = dustOf(h.all, rng(7300 + h.P % 9973));
      // the flame alive, four shapes of it in turn, the white-hot heart of it yellow
      h.fv = [0, 1, 2, 3].map(() => { const j = Array.from({ length: 5 }, () => (r() - .5) * .7), k = Array.from({ length: 3 }, () => (r() - .5) * .4); return [mk(curve(FL(j).map(Rk), 6), 5, W * 1.25), mk(curve([[-.42, .8], [-.22, 1.45 + k[0]], [0, 2.05 + k[1]], [.22, 1.45 + k[2]], [.42, .8]].map(Rk), 6), 2, W * 1.05)]; });
      // the flight: up off the pad, leaning over toward the moon and away into the slate, smaller and smaller
      const V = [M[0] - sd * Rm * 2.3, M[1] + Rm * 1.1], q1 = [bx, lerp(by, V[1], .6)]; h.base = [bx, by]; h.s = s; h.nz = Rk([0, .7]); h.gy = gy;
      h.fly = t => { const k = clamp((t - H.lift[0]) / (H.lift[1] - H.lift[0])), e = Math.pow(k, 1.65), i1 = 1 - e, tx2 = 2 * i1 * (q1[0] - bx) + 2 * e * (V[0] - q1[0]), ty2 = 2 * i1 * (q1[1] - by) + 2 * e * (V[1] - q1[1]);
        return { x: i1 * i1 * bx + 2 * i1 * e * q1[0] + e * e * V[0], y: i1 * i1 * by + 2 * i1 * e * q1[1] + e * e * V[1], rot: k > 0 ? Math.atan2(tx2, -ty2) * Math.min(1, k * 4) : 0, sc: 1 / (1 + 12 * Math.pow(k, 2.3)) }; };
      // the smoke: billows rolling out from under it along the ground both ways as it lifts, and thinning away
      h.smoke = Array.from({ length: 16 }, (_, i) => { const d = i % 2 ? 1 : -1, far = (i >> 1) / 7; return { x0: bx + d * s * (.3 + r() * .6), y0: gy - .4 * s, x1: bx + d * (s * 1.2 + far * b.w * .5) + (r() - .5) * s, y1: gy - s * (.4 + r() * 1.6) - far * s * 1.2, tb: H.lit + .15 + far * .9 + r() * .2, tm: .45 + r() * .35, r0: .6 * s, r1: s * (1.3 + far * 1.1 + r() * .5), al: .38 + r() * .14, v: Math.floor(r() * 3), out: H.lift[1] - .4 + far * .3 + r() * .4 }; }).sort((p, q) => p.y1 - q.y1);
      // the stardust: the moon breaks up into it, and it spreads out from there over the whole room, the launch going under
      // it and the next lesson there behind it (where, and when, the field says: the way out from the moon, a little ragged)
      const n2 = noise2(41, 32), x0 = S.lx, y0 = S.ly, w = S.live.c.width / px, hh = S.live.c.height / px, Dm = Math.max(...[[x0, y0], [x0 + w, y0], [x0, y0 + hh], [x0 + w, y0 + hh]].map(([x, y]) => Math.hypot(x - M[0], y - M[1])));
      h.M = M; h.ff = (x, y) => clamp(.03 + .9 * Math.hypot(x - M[0], y - M[1]) / Dm + .16 * (n2(x / 26, y / 26) - .5), .001, .999);
      const ns = Math.round(clamp(w * hh / (u * u * 1.6), 300, 1100)), [w0, w1] = H.sweep; h.stars = new Float32Array(ns * 7);
      for (let k = 0; k < ns; k++) { const x = x0 + r() * w, y = y0 + r() * hh, d = Math.hypot(x - M[0], y - M[1]) || 1; h.stars.set([x, y, (x - M[0]) / d * u * (.6 + r() * 1.4), (y - M[1]) / d * u * (.6 + r() * 1.4), w0 + h.ff(x, y) * (w1 - w0) - .12 + r() * .1, .7 + r() * .6, r() < .5 ? 2 : r() < .8 ? 0 : 1], k * 7); }
    },
    /** by night, the rocket: the chalk draws a rocket on its pad by its tower, shades its nose and fins and its porthole,
     *  draws the moon in the corner, counts down from three a beat at a time and draws the flame; the flame comes alive,
     *  the tower's arm swings away,
     *  smoke rolls out from under it and it goes, on its own, up and over toward the moon and away into the slate, smaller
     *  and smaller, until it is a star that winks out by the moon; then the moon breaks up into stardust that spreads out
     *  over the whole room, twinkling, and where it has been the launch is gone and the next lesson is there */
    rocket(T, I, A, on, vis, pp) {
      const H = HB.rocket, X = S.wholeOf(pp.prev), a = vis * I;
      if (!(on && T >= H.wipe[0])) { S.blit(X, vis); return; }
      const h = S.hourOf(pp.P, 2), cur = pp.cur, w1 = S.wiperAt(T, H.wipe), s1 = w1 ? w1.s : T >= H.wipe[1] ? S.wipe.len : 0;
      S.hidden(h, cur, T, H.white[0], H.lift[1]);
      if (T < H.dry[1]) S.eggWet(s1, seg(T, H.dry[0], H.dry[1], x => x), a);
      if (T < H.wipe[1]) S.wiped(s1, vis, I, X);
      else {
        if (I < .99) S.blit(X, vis * (1 - I));
        const [w0, w1] = H.sweep, tau = (T - w0) / (w1 - w0), fd = h.fd || (h.fd = S.fieldOf(h.ff));
        if (tau <= 0) { const st = S.grow(S.live, h.board, T); S.blit(S.live, a); if (st) S.hand(st, T, a); }
        else { if (tau < 1) { S.grow(S.live, h.board, 99); S.through(S.live, fd, tau, true, a); } const Y = S.hidden(h, cur, T, 0, 0); if (tau >= 1) S.blit(Y, a); else S.through(Y, fd, tau, false, a, h.Y2 || (h.Y2 = S.layer())); }
        if (T < w1) S.roomClip(() => { S.launch(h, T, A, a); S.handDust(h.all, h.dust, T, a); });
        S.rocketArm(h, T, a, tau);
        S.roomClip(() => S.stardust(h, T, A, a));
      }
      S.drawWiper(w1, a, A);
      S.tool(S.toolAt(T, h.phases), a);
    },
    /** a billow of chalk dust: round, lit from the window up on the right and shadowed under, grainy with the chalk's own
     *  tooth (three of them) */
    dustSpr() { if (S.dsp) return S.dsp; const n = 96; return (S.dsp = [0, 1, 2].map(v => paint(n, n, (x, y) => { const dx = (x - n / 2 + .5) / (n / 2), dy = (y - n / 2 + .5) / (n / 2), d = Math.hypot(dx, dy); if (d >= 1) return null; const nz = Math.sqrt(1 - d * d), l = clamp(.5 + .5 * (dx * .5 - dy * .7) * (1 - nz * .4) + nz * .2), t = TOOTH.a[((y + v * 37) % TOOTH.n) * TOOTH.n + (x + v * 53) % TOOTH.n], k = .86 + .14 * t;
        return [Math.round(lerp(118, 246, l) * k), Math.round(lerp(134, 248, l) * k), Math.round(lerp(128, 242, l) * k), Math.round(255 * Math.pow(clamp((1 - d) / .5), 1.4) * (.78 + .22 * t))]; }))); },
    /** the tower's arm: drawn with the tower; swinging up and away from the rocket as it is lit; gone under the stardust */
    rocketArm(h, T, a, tau) {
      const H = HB.rocket, L = h.AL || (h.AL = S.layer()); if (T < H.lit - .1) { const st = S.grow(L, h.arm, T); S.blit(L, a); if (st) S.hand(st, T, a, L); return; }
      if (!h.as) { S.grow(L, h.arm, 99); const sp = h.as = boxCanvas(...bboxOf(h.arm), h.box.u); sp.ctx.setTransform(1, 0, 0, 1, 0, 0); sp.ctx.drawImage(L.c, Math.round((sp.x0 - S.lx) * px), Math.round((sp.y0 - S.ly) * px), sp.c.width, sp.c.height, 0, 0, sp.c.width, sp.c.height); }
      const k = clamp((T - H.lit + .1) / .55), fade = tau > 0 ? 1 - clamp((tau - h.ff(...h.armP)) / .1) : 1; drawSpr(h.as, 0, 0, a * fade, 1, -h.sd * 1.05 * E.back(k), h.armP[0], h.armP[1]);
    },
    /** the rocket cut out whole, and its flame's four shapes */
    rocketSpr(h) { if (h.rs) return; const R = h.R || (h.R = S.layer()); S.grow(R, h.rk, 99); const sp = h.rs = boxCanvas(...bboxOf(h.rk), h.box.u); sp.ctx.setTransform(1, 0, 0, 1, 0, 0); sp.ctx.drawImage(R.c, Math.round((sp.x0 - S.lx) * px), Math.round((sp.y0 - S.ly) * px), sp.c.width, sp.c.height, 0, 0, sp.c.width, sp.c.height);
      h.flames = h.fv.map(list => { const f = boxCanvas(...bboxOf(list), h.box.u * .6); strokesOn(f.ctx, list); return f; }); },
    /** the rocket as it is drawn, lit, standing on its flame, and gone; the smoke (swept away with the rest by the
     *  stardust) and the fire's glow in it; its trail; the star it ends as */
    launch(h, T, A, a) {
      const H = HB.rocket, [l0, l1] = H.lift, s = h.s, sp = S.dustSpr();
      for (const c of h.smoke) { const age = T - c.tb; if (age <= 0) continue; const k = 1 - Math.exp(-age / c.tm), out = clamp((T - c.out) / 1.1), x = lerp(c.x0, c.x1, k), y = lerp(c.y0, c.y1, k) - out * s * .8, R2 = lerp(c.r0, c.r1, k) * (1 + .3 * out), al = a * c.al * clamp(age / .2) * (1 - E.in(out)) * (1 - clamp((T - H.sweep[0] - h.ff(x, y) * (H.sweep[1] - H.sweep[0])) / .35)) * S.edge(x, y + R2 * .3); if (al <= .003) continue; g.globalAlpha = al; g.drawImage(sp[c.v], x - R2, y - R2, R2 * 2, R2 * 2); }
      { const gl = a * seg(T, H.lit, l0, E.io) * (1 - seg(T, l0 + .3, l0 + 1.6, E.io)), f = T < l0 ? { x: h.base[0], y: h.base[1] } : h.fly(T); if (gl > .01) { const R2 = s * 5, x = h.nz[0], y = h.nz[1] + s * .4; g.globalCompositeOperation = "lighter"; g.globalAlpha = gl * .55; g.drawImage(S.puffs[5], x - R2 * 1.6, y - R2 * .62, R2 * 3.2, R2 * 1.24); g.globalAlpha = gl * .35; g.drawImage(S.puffs[2], f.x - R2 * .6, f.y + s * 1.5 - R2 * .6, R2 * 1.2, R2 * 1.2); g.globalCompositeOperation = "source-over"; } }
      for (let te = l0 + .02; te < Math.min(T, l1 - .12); te += .05) { const age = T - te; if (age > 1.5) continue; const f = h.fly(te), R2 = s * f.sc * (.8 + 2.2 * E.out(Math.min(1, age / 1.2))), x = f.x - Math.sin(f.rot) * 1.6 * s * f.sc, y = Math.min(f.y + Math.cos(f.rot) * 1.6 * s * f.sc + age * s * .5 * f.sc, h.gy - R2 * .45); /* (never under the ground) */ g.globalAlpha = a * .38 * (1 - E.in(age / 1.5)) * (.4 + .6 * f.sc); g.drawImage(sp[Math.floor(te * 97) % 3], x - R2, y - R2, R2 * 2, R2 * 2); }
      g.globalAlpha = 1;
      if (T < H.lit) { const R = h.R || (h.R = S.layer()), st = S.grow(R, h.rk, T); S.blit(R, a); if (st) S.hand(st, T, a, R); const F2 = h.FL || (h.FL = S.layer()), sf = S.grow(F2, h.fl, T); S.blit(F2, a); if (sf) S.hand(sf, T, a, F2); return; }
      if (T < l1) {
        S.rocketSpr(h); const f = T < l0 ? { x: h.base[0], y: h.base[1], rot: 0, sc: 1 } : h.fly(T), sh = T < l0 ? seg(T, H.lit, l0, z => z) : clamp(1 - (T - l0) / .5), jx = Math.sin(A * 71) * .5 * sh, jy = Math.cos(A * 57) * .35 * sh, fa = a * (1 - seg(T, l1 - .2, l1, z => z));
        // the flame, alive: breathing as it catches, then roaring; four shapes of it in turn, longer as it thrusts
        const thr = .6 * seg(T, H.lit, l0, E.io) + .5 * clamp((T - l0) / .35), fs = h.flames[Math.floor(A * 13) % 4], nx = f.x + jx - Math.sin(f.rot) * (h.nz[1] - h.base[1]) * f.sc, ny = f.y + jy + Math.cos(f.rot) * (h.nz[1] - h.base[1]) * f.sc;
        g.save(); g.globalAlpha = fa; g.translate(nx, ny); g.rotate(f.rot); g.scale(f.sc, f.sc * (1 + thr * (.85 + .15 * Math.sin(A * 31)))); g.drawImage(fs.c, fs.x0 - h.nz[0], fs.y0 - h.nz[1], fs.w, fs.h); g.restore(); g.globalAlpha = 1;
        drawSpr(h.rs, f.x - h.base[0] + jx, f.y - h.base[1] + jy, fa, f.sc, f.rot, h.base[0], h.base[1]);
      }
      const tk = (T - l1 + .12) / .65; if (tk > 0 && tk < 1) { const f = h.fly(l1), R2 = s * 2.3 * Math.sin(Math.PI * tk), al = a * Math.sin(Math.PI * tk); g.globalAlpha = al * .45; g.drawImage(S.puffs[2], f.x - R2 * 1.5, f.y - R2 * 1.5, R2 * 3, R2 * 3); g.save(); g.translate(f.x, f.y); g.rotate(tk * .9); g.globalAlpha = al; g.fillStyle = rgba(INKS[2]); g.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? R2 * .16 : R2, an = i / 8 * TAU; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); g.fill(); g.restore(); g.globalAlpha = 1; }
    },
    /** the stardust: each speck a little four-pointed star that catches as the sweep comes to it, drifts on out from the
     *  moon and down, twinkling, and goes out; brightest at the sweep's front */
    stardust(h, T, A, a) {
      const [w0, w1] = HB.rocket.sweep; if (T < w0 - .2 || T > w1 + 1.4) return; const D = h.stars, n = D.length / 7, bk = h.sbk || (h.sbk = Array.from({ length: 9 }, () => [])), u = h.box.u; for (const q of bk) q.length = 0;
      for (let k = 0; k < n; k++) { const o = k * 7, age = T - D[o + 4], life = D[o + 5]; if (age <= 0 || age >= life) continue; const q = age / life, x = D[o] + D[o + 2] * E.out(q), y = D[o + 1] + D[o + 3] * E.out(q) + u * .9 * q * q, tw = .55 + .45 * Math.sin(A * (9 + k % 7) + k), v = clamp(age / .12) * (1 - E.in(q)) * tw * S.edge(x, y); if (v < .08) continue;
        bk[D[o + 6] * 3 + Math.min(2, Math.floor(v * 3))].push(x, y, (.8 + 1.6 * v) * (k % 9 ? 1 : 1.8)); }
      g.lineCap = "round"; g.lineWidth = 1.1; bk.forEach((q, i) => { if (!q.length) return; g.strokeStyle = rgba(INKS[[0, 1, 2][Math.floor(i / 3)]]); g.globalAlpha = a * [.35, .65, .95][i % 3]; g.beginPath(); for (let j = 0; j < q.length; j += 3) { const x = q[j], y = q[j + 1], r2 = q[j + 2]; g.moveTo(x - r2, y); g.lineTo(x + r2, y); g.moveTo(x, y - r2); g.lineTo(x, y + r2); } g.stroke(); });
      // the moon going up in it: a glow where it was, swelling and going
      const gk = seg(T, w0 - .25, w0 + .15, E.out) * (1 - seg(T, w0 + .2, w0 + 1, E.in)); if (gk > .01) { const R2 = u * 3.2 * (.7 + .5 * gk); g.globalAlpha = a * .4 * gk; g.drawImage(S.puffs[2], h.M[0] - R2, h.M[1] - R2, R2 * 2, R2 * 2); }
      g.globalAlpha = 1;
    },
    /* by day, the opening an hour's egg shares with a pass's: the old plan's notes peeling off, the eraser taking it off */
    /** the board under it: the old plan at rest until the loop has the board, then going under the eraser (a ghost of it
     *  fading); true once the board is clear (with the old plan showing through as far as the loop has given it back) */
    dayRest(T, I, on, vis, rest) {
      const a = vis * I, WP = S.wipeAll, WB = BW.wipe;
      if (!(on && T >= WB[0])) { S.blit(rest, vis); return false; }
      const k = (T - WB[0]) / (WB[1] - WB[0]), s = k <= 0 ? 0 : k >= 1 ? WP.len : WP.at(k) * WP.len, gh = a * env(T, WB[0], WB[0] + .3, BW.ghost[0], BW.ghost[1], E.sine);
      if (gh > .003) { S.blit(rest, gh * .03); g.save(); g.translate(7, 1); S.blit(rest, gh * .02); g.restore(); }
      if (T < WB[1]) { S.wiped(s, vis, I, rest, WP, S.band2); return false; }
      if (I < .99) S.blit(rest, vis * (1 - I));
      return true;
    },
    /** and over it: the old plan's notes peeling off and fluttering away, the eraser going over */
    dayTop(T, I, A, on, vis, pp) {
      const a = vis * I, WP = S.wipeAll, WB = BW.wipe, curl = n => .12 + .025 * Math.sin(A * .9 + n.ph);
      pp.prev.notes.forEach((n, i) => { const tp0 = BW.peel + i * BW.gap, tp1 = tp0 + .55; S.sprOf(n); if (!on || T < tp0) { S.note(n, n.x, n.y, n.rot, 1, curl(n), vis, 0); return; } if (I < .99) S.note(n, n.x, n.y, n.rot, 1, curl(n), vis * (1 - I), 0); S.peel(n, T, tp0, tp1, A, a, curl(n)); });
      if (on) { const k = (T - WB[0]) / (WB[1] - WB[0]); if (k > 0 && k < 1) { const f = WP.at(k), q = along(WP.ride, f * WP.ride.len); S.drawWiper({ x: q[0], y: q[1], dir: q[2] }, a, A, S.sponge2, S.spongeSh2); } }
    },
    /** this pass's notes, slapped on one after another from `t` */
    daySlap(cur, T, A, a, t, gap = .26) { const curl = n => .12 + .025 * Math.sin(A * .9 + n.ph); cur.notes.forEach((n, i) => { const ts = t + i * gap; if (T < ts) return; S.sprOf(n); if (T >= ts + .6) S.note(n, n.x, n.y, n.rot, 1, curl(n), a, 0); else { const sl = S.slap(T - ts); S.note(n, n.x, n.y - sl.lift * n.s * .08, n.rot + sl.lift * .12, sl.sc, curl(n) + sl.flap, a * sl.a, sl.lift); } }); },

    /* by day, the machine */
    /** the machine for this room, laid out tall or wide: what the marker draws that stays put (the shelf, the ramps and
     *  their stops, the floor, the seesaw's block, the switch, the wire, the bulb) and what will move (the dominoes, the
     *  seesaw's plank, the switch's lever, the ball); the ball's run worked out by a little simulation of it (rolling,
     *  dropping, turned back by the stops, bouncing on the floor) until it knocks the first domino; and from that, when
     *  everything after it goes */
    machineOf(h, r) {
      const H = HB.machine, b = h.box, u = b.u, tall = b.k === "tall", FW = tall ? 20 : 26, FH = tall ? 25 : 16, m = Math.min(b.w / FW, b.h / FH), ox = b.x + (b.w - FW * m) / 2, oy = b.y + (b.h - FH * m) / 2, P = (x, y) => [ox + x * m, oy + y * m];
      const G = tall ? { shelf: [1, 3, 4], ball: [2, .75], ramps: [[4.1, 3.5, 12, 6.1], [14.2, 7.6, 4.2, 10.6], [2, 13.9, 7.4, 15.6]], stops: [[14.2, 7.6, 14.2, 4.5], [2, 13.9, 2, 9.4]], floor: [.8, 22.6, 19.4], dom: [12, .95, 4, 2.4, .42], saw: [17.1, 2.2], sw: [19, 17.6, 1.5, 1.4], bulb: [16.3, 3.5, 1.9] }
        : { shelf: [.8, 2.2, 3.2], ball: [1.6, .65], ramps: [[3.3, 2.6, 8.6, 4.1], [10.4, 5.4, 3.6, 7.3], [1.8, 8.6, 8.8, 10.8]], stops: [[10.4, 5.4, 10.4, 2.5], [1.8, 8.6, 1.8, 5.7]], floor: [1, 14, 25], dom: [11, 1.1, 5, 2.3, .45], saw: [18.4, 2.5], sw: [20.65, 8.7, 1.6, 1.3], bulb: [23.3, 2.9, 1.75] };
      const W = clamp(u * .2, 2.4, 6.2), seq = [], st = [], mv = [], put = (list, pts, k = 1, col = 0) => { const s2 = mk(pts, col, W * k); s2.streaks = streaks(s2, r); list.push(s2); seq.push(s2); return s2; }, L = (x0, y0, x1, y1, bw = .008) => hline(P(x0, y0), P(x1, y1), r, bw);
      const fy = G.floor[1], [ax, Lp] = G.saw, ay = fy - 1.1, a0 = Math.asin(1.1 / Lp), [bxc, byc, br] = G.bulb, [swx, swy, sww, swh] = G.sw;
      // black, the run from the top down: the shelf (on its bracket), the ramps (each on a leg) and their stops, the floor
      put(st, L(G.shelf[0], G.shelf[1], G.shelf[2], G.shelf[1]), 1.05); put(st, [P(G.shelf[0] + .4, G.shelf[1]), P(G.shelf[0] + .4, G.shelf[1] + 1), P(G.shelf[0] + 1.3, G.shelf[1])], .7);
      G.ramps.forEach(([x0, y0, x1, y1]) => { put(st, L(x0, y0, x1, y1, .004), 1.05); const lx = x1 + (x0 - x1) * .12, ly = y1 + (y0 - y1) * .12; put(st, L(lx, ly, lx, ly + 1.1), .7); });
      for (const [x0, y0, x1, y1] of G.stops) put(st, L(x0, y0, x1, y1), .95);
      put(st, L(G.floor[0], fy, G.floor[2], fy, .002), 1.1);
      // the dominoes standing in a row; the seesaw's block and its plank, lying left end up; the switch on the wall, its
      // lever hanging down to just over the plank's other end (and a knob on it)
      const [dx0, dsp, dn, dh, dw] = G.dom, doms = Array.from({ length: dn }, (_, i) => { const x = dx0 + i * dsp; return { s: put(mv, hbox(...P(x - dw / 2, fy - dh), ...P(x + dw / 2, fy), r, .03 * m), .75), piv: P(x + dw / 2, fy), box0: P(x - dw / 2, fy - dh), box1: P(x + dw / 2, fy) }; });
      put(st, poly([P(ax - .6, fy), P(ax, ay), P(ax + .6, fy), P(ax - .62, fy - .02)], r, .01), .9);
      const plank = put(mv, poly([P(ax - Lp * Math.cos(a0), ay - Lp * Math.sin(a0)), P(ax + Lp * Math.cos(a0), ay + Lp * Math.sin(a0))], r, .003), 1.6);
      put(st, hbox(...P(swx - sww / 2, swy), ...P(swx + sww / 2, swy + swh), r, .03 * m), .9); put(st, hring(P(swx, swy + swh * .45), .22 * m, .22 * m, r, 0, .05), .6);
      const tipY = ay - Lp * Math.sin(a0), lever = put(mv, [P(swx, swy + swh), P(swx, tipY)], 1.25), knob = put(mv, spiral(P(swx, tipY), .2 * m, .2 * m, 1.6), 1.1);
      // the wire from the switch up to the bulb, a turn or two in it; the bulb: its glass, its base, its filament
      const wire = put(st, curve((tall ? [[swx, swy], [swx + .5, swy - 2.2], [swx - .6, swy - 4.4], [swx + .4, swy - 6.4], [bxc + .9, byc + br + 3.6], [bxc, byc + br + 1.6]] : [[swx + sww / 2, swy + swh * .4], [swx + 1.6, swy - .1], [swx + 1.1, swy - 1.5], [bxc - .2, byc + br + 2.4], [bxc, byc + br + 1.35]]).map(q => P(...q)), 10), .8);
      { const gl = []; for (let a = 2.08; a <= TAU + 1.06; a += .1) gl.push(P(bxc + Math.cos(a) * br, byc + Math.sin(a) * br)); put(st, gl, 1.05); }
      put(st, L(bxc - .47 * br, byc + .88 * br, bxc - .42 * br, byc + 1.42 * br), .9); put(st, L(bxc + .47 * br, byc + .88 * br, bxc + .42 * br, byc + 1.42 * br), .9);
      put(st, poly([P(bxc - .5 * br, byc + 1.47 * br), P(bxc + .5 * br, byc + 1.47 * br), P(bxc - .45 * br, byc + 1.68 * br), P(bxc + .45 * br, byc + 1.68 * br)], r), .8);
      { const fil = [P(bxc - .28 * br, byc + .9 * br), P(bxc - .24 * br, byc + .2 * br)]; for (let k = 0; k <= 16; k++) { const t = k / 16, a = t * TAU * 3; fil.push(P(bxc - .24 * br + t * .48 * br + Math.sin(a) * .07 * br, byc + .2 * br - (1 - Math.cos(a)) * .09 * br)); } fil.push(P(bxc + .24 * br, byc + .2 * br), P(bxc + .28 * br, byc + .9 * br)); put(st, fil, .6); }
      const black = seq.filter(q => q !== wire), red = doms.map(d => { const [x0, y0] = d.box0, [x1, y1] = d.box1; return (d.fill = put(mv, zigzag((x, y) => x > x0 + m * .1 && x < x1 - m * .1 && y > y0 + m * .1 && y < y1 - m * .1, [x0, y0, x1, y1], m * .3, -1.2, r), 2.4, 3)); }); for (const d of red) d.a = .34;
      // blue: the ball on the shelf, coloured in; then the tap that sets it going (the marker's, which leaves no mark)
      const [bx0, rb] = G.ball, by0 = G.shelf[1] - rb, bc = P(bx0, by0), ball = [put([], hring(bc, rb * m, rb * m, r, -2.2, .04), 1, 1), put([], spiral(bc, rb * m * .8, rb * m * .8, 2.4, 0, r() * TAU), 1.35, 1)];
      const tap = mk([P(bx0 - rb * 2.1, by0 + .1), P(bx0 - rb * 1.02, by0)], 1, W);
      h.phases = [{ col: 0, win: H.black, strokes: black }, { col: 3, win: H.red, strokes: [...red, wire] }, { col: 1, win: H.blue, strokes: [...ball, tap] }]; wire.col = 3;
      pace(h.phases, u); h.st = st.sort((p, q) => p.t0 - q.t0); h.mv = [...mv, ...ball].sort((p, q) => p.t0 - q.t0); h.ball = ball; h.t0 = tap.t1;
      // the ball's run: from the tap, under gravity, along the shelf and down the ramps, turned by the stops, dropping to
      // the floor and bouncing, until it comes to the first domino and is stopped by it (sampled, to be looked up; its
      // time scaled to about two seconds, as if gravity were a little stronger or weaker in a smaller or larger room)
      const segs = [[G.shelf[0], G.shelf[1], G.shelf[2], G.shelf[1], .1], ...G.ramps.map(q => [...q, .15]), ...G.stops.map(q => [...q, .3]), [G.floor[0], fy, G.floor[2], fy, .38]], face = dx0 - dw / 2, run = [];
      { let x = bx0, y = by0, vx = 3.2, vy = 0, ang = 0, hit = 0; const dt = 1 / 240, g2 = 60;
        for (let k = 0; k < 240 * 7; k++) { vy += g2 * dt; x += vx * dt; y += vy * dt; let on = false;
          for (const [x0, y0, x1, y1, e] of segs) { const dx = x1 - x0, dy = y1 - y0, t = clamp(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)), cx = x0 + dx * t, cy = y0 + dy * t, nx0 = x - cx, ny0 = y - cy, d = Math.hypot(nx0, ny0); if (d >= rb || d < 1e-6) continue; const nx = nx0 / d, ny = ny0 / d, vn = vx * nx + vy * ny; x = cx + nx * rb; y = cy + ny * rb; if (vn < 0) { vx -= (1 + e) * vn * nx; vy -= (1 + e) * vn * ny; } on = true; }
          if (!hit && x + rb >= face && y > fy - dh) { hit = k * dt; vx = -Math.abs(vx) * .22; }
          if (hit && x + rb > face) { x = face - rb; vx = Math.min(0, vx); }
          if (on) { vx *= 1 - .4 * dt; ang += vx / rb * dt; } run.push(x, y, ang); if (hit && k * dt > hit + 4) break; }
        h.hit = hit || 2; }
      h.run = run; h.ks = clamp(h.hit / 2.05, .4, 3); h.bc = bc; h.P = P; h.m = m;
      // the dominoes, each falling into the next, the last onto the seesaw's raised end; the plank thrown, the lever
      // flicked, a spark up the wire, the bulb lit
      const th = h.t0 + h.hit / h.ks; h.Df = .27; h.doms = doms.map((d, i) => ({ ...d, t: th + i * .12, end: i < dn - 1 ? Math.acos(clamp(dw / dsp)) * .97 : (tall ? .98 : 1.12) }));
      const tp = h.doms[dn - 1].t + h.Df * .4; h.saw = { s: plank, piv: P(ax, ay), a0, t: tp }; h.lev = { s: [lever, knob], piv: P(swx, swy + swh), t: tp + .12 };
      h.wire = wire; h.spark = [tp + .18, tp + .62]; h.lit = tp + .62; h.bulb = { c: P(bxc, byc), r: br * m };
      h.rays = Array.from({ length: 7 }, (_, i) => { const a = -Math.PI / 2 + (i - 3) * .5, s2 = mk(hline(P(bxc + Math.cos(a) * br * 1.3, byc + Math.sin(a) * br * 1.3), P(bxc + Math.cos(a) * br * (i % 2 ? 1.75 : 2.05), byc + Math.sin(a) * br * (i % 2 ? 1.75 : 2.05)), r, .01), 5, W * .95); s2.streaks = streaks(s2, r); return s2; });
    },
    /** by day, the machine: the old plan comes off as ever; the marker draws a contraption, a ball on a shelf at the top, a
     *  run of ramps zigzagging down, a row of dominoes, a seesaw, a switch on the wall wired to a light bulb; it colours the
     *  dominoes in and the wire, red, and the ball, blue, and taps it, and the machine runs on its own: the ball rolls down the ramps, turned at each stop, drops to
     *  the floor and bounces, and knocks the first domino; they go over one into the next, the last onto the seesaw, which
     *  throws its other end up into the switch's lever; a spark runs up the wire, and the bulb lights; then the eraser goes
     *  over it all, and behind the eraser is the plan, its notes slapped on as it goes */
    machine(T, I, A, on, vis, pp) {
      const H = HB.machine, a = vis * I, rest = S.wholeOf(pp.prev), cur = pp.cur, h = S.hourOf(pp.P, 1), [e0, e1] = H.wipe;
      S.hidden(h, cur, T, H.black[0], e0);
      if (S.dayRest(T, I, on, vis, rest)) { if (T < e0) S.machineBoard(h, T, A, a); else S.machineOut(h, cur, T, a); }
      S.dayTop(T, I, A, on, vis, pp);
      if (!on) return;
      S.daySlap(cur, T, A, a, e0 + .95);
      if (T > e0 && T < e1) { const WP = S.wipeAll, q = along(WP.ride, WP.at((T - e0) / (e1 - e0)) * WP.ride.len); S.drawWiper({ x: q[0], y: q[1], dir: q[2] }, a, A, S.sponge2, S.spongeSh2); }
      S.tool(S.toolAt(T, h.phases), a);
    },
    /** the machine as it is drawn, and from the tap on, running */
    machineBoard(h, T, A, a) {
      if (T < h.t0) { const s1 = S.grow(S.live, h.st, T); S.blit(S.live, a); if (s1) S.hand(s1, T, a); const M = h.M || (h.M = S.layer()), s2 = S.grow(M, h.mv, T); S.blit(M, a); if (s2) S.hand(s2, T, a, M); return; }
      S.grow(S.live, h.st, 99); S.blit(S.live, a); S.roomClip(() => S.machineParts(h, T, A, a));
    },
    /** what moves, at time T, on a context of its own or the frame's: the dominoes going over, the plank thrown, the lever
     *  flicked, the ball where its run has it (turning as it rolls); the spark on its way up the wire; the bulb lit */
    machineParts(h, T, A, a, x = g) {
      if (!h.sp) { const one = list => { const sp = boxCanvas(...bboxOf(list), h.box.u * .6); strokesOn(sp.ctx, list); return sp; }; h.sp = { doms: h.doms.map(d => one([d.s, d.fill])), saw: one([h.saw.s]), lev: one(h.lev.s), ball: one(h.ball) }; }
      const sp = h.sp;
      h.doms.forEach((d, i) => { const q = (T - d.t) / h.Df, th = q <= 0 ? 0 : q < 1 ? d.end * q * q : d.end * (1 - .05 * Math.sin(Math.PI * clamp((q - 1) * 4))); drawSpr(sp.doms[i], 0, 0, a, 1, th, d.piv[0], d.piv[1], x); });
      { const q = (T - h.saw.t) / .16, ph = q <= 0 ? 0 : q < 1 ? -2 * h.saw.a0 * q * q : -2 * h.saw.a0 * (1 + .07 * Math.sin(Math.PI * clamp((q - 1) * 3.5)) * Math.exp(-(q - 1) * 2)); drawSpr(sp.saw, 0, 0, a, 1, ph, h.saw.piv[0], h.saw.piv[1], x); }
      { const q = (T - h.lev.t) / .14; drawSpr(sp.lev, 0, 0, a, 1, q <= 0 ? 0 : 2.5 * E.back(Math.min(1, q)), h.lev.piv[0], h.lev.piv[1], x); }
      { const n = h.run.length / 3, i = clamp(Math.floor((T - h.t0) * h.ks * 240), 0, n - 1), p = h.P(h.run[i * 3], h.run[i * 3 + 1]); drawSpr(sp.ball, p[0] - h.bc[0], p[1] - h.bc[1], a, 1, h.run[i * 3 + 2], h.bc[0], h.bc[1], x); }
      const [s0, s1] = h.spark; if (x === g && T > s0 && T < s1 + .2) { const w = h.wire, e = q => along(w, E.io(clamp((q - s0) / (s1 - s0))) * w.len), p = e(T), fade = 1 - clamp((T - s1) / .2);
        g.lineCap = "round"; g.strokeStyle = "rgb(255,196,60)"; for (let j = 1; j <= 6; j++) { const p0 = e(T - j * .02), p1 = e(T - (j - 1) * .02); g.globalAlpha = a * fade * (1 - j / 7) * .8; g.lineWidth = 4 - j * .45; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); }
        const R2 = h.box.u * 1.5; g.globalAlpha = a * fade * .8; g.drawImage(S.puffs[5], p[0] - R2, p[1] - R2, R2 * 2, R2 * 2); g.fillStyle = "#FFF6D8"; g.beginPath(); g.arc(p[0], p[1], 2.4, 0, TAU); g.fill(); g.globalAlpha = 1; }
      const lk = seg(T, h.lit, h.lit + .3, E.out); if (lk > 0) S.bulbLit(h, T, A, a, lk, x);
    },
    /** the bulb, lit: a yellow glow round it, the glass filled with the light (the marker's ink over it, so its lines show
     *  through), the rays drawn out from it one by one, and the glow breathing a little */
    bulbLit(h, T, A, a, lk, x) {
      const { c, r: R } = h.bulb, gs = S.glowY || (S.glowY = K.glowSpr(40, [255, 214, 72], 1)), br2 = .9 + .1 * Math.sin(A * 2.6);
      x.globalAlpha = a * lk * .55 * br2; x.drawImage(gs, c[0] - R * 2.3, c[1] - R * 2.3, R * 4.6, R * 4.6);
      x.globalCompositeOperation = "multiply"; x.globalAlpha = a * lk * .75; x.fillStyle = "rgb(255,226,96)"; x.beginPath(); x.arc(c[0], c[1], R * .9, 0, TAU); x.fill(); x.globalCompositeOperation = "source-over";
      h.rays.forEach((s2, i) => { const k = seg(T, h.lit + .05 + i * .045, h.lit + .3 + i * .045, E.out); if (k <= 0) return; x.globalAlpha = a; markerLine(x, s2, s2.len * k); });
      x.globalAlpha = 1;
    },
    /** the machine as it stands at the end, on a layer of its own */
    machineZ(h) { if (h.Z) return h.Z; const Z = h.Z = S.layer(); S.grow(S.live, h.st, 99); Z.x.save(); Z.x.setTransform(1, 0, 0, 1, 0, 0); Z.x.drawImage(S.live.c, 0, 0); Z.x.restore(); S.machineParts(h, 99, 0, 1, Z.x); return Z; },
    /** the eraser going over the machine, and behind it, where it has been, the plan */
    machineOut(h, cur, T, a) {
      const [e0, e1] = HB.machine.wipe, WP = S.wipeAll, k = (T - e0) / (e1 - e0), s = k <= 0 ? 0 : k >= 1 ? WP.len : WP.at(k) * WP.len, Y = S.hidden(h, cur, T, 0, 0);
      if (k >= 1) { S.blit(Y, a); return; }
      if (s > 0) { const l = h.Y2 || (h.Y2 = S.layer()), x = l.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, l.c.width, l.c.height); x.drawImage(Y.c, 0, 0); x.setTransform(px, 0, 0, px, -S.lx * px, -S.ly * px); x.globalCompositeOperation = "destination-in"; x.strokeStyle = "#000"; x.lineWidth = S.band2; x.lineCap = "butt"; x.lineJoin = "miter"; trace(x, WP, 0, s); x.stroke(); x.globalCompositeOperation = "source-over"; x.lineCap = "round"; x.lineJoin = "round"; S.blit(l, a); }
      S.wiped(s, a, 1, S.machineZ(h), WP, S.band2);
    },
    /* by day, the maze */
    /** the maze for this room: its box, its walls (a perfect maze, dug out by a walk that doubles back, dealt), and how they
     *  grow in from the box's sides (each run of wall a stroke, starting from the wall it grows out of when the growth
     *  reaches it); the way through, and the line's search for it: along the way, now and then a wrong turn into a dead
     *  end close by, and back */
    mazeOf(h, r) {
      const H = HB.maze, b = h.box, u = b.u, tall = b.k === "tall", nc = tall ? 6 : 8, nr = tall ? 8 : 5, c = Math.min(b.w / (nc + 2.5), b.h / (nr + .7)), x0 = b.x + (b.w - nc * c) / 2, y0 = b.y + (b.h - nr * c) / 2;
      const W = clamp(u * .2, 2.4, 6.2), Cn = (i, j) => [x0 + i * c, y0 + j * c], Cc = k => [x0 + (k % nc + .5) * c, y0 + (Math.floor(k / nc) + .5) * c], put = (pts, k = 1, col = 0) => { const s2 = mk(pts, col, W * k); s2.streaks = streaks(s2, r); return s2; };
      // dug out: a walk from a dealt cell, on to a neighbour not yet dug (dealt), back when there is none
      const open = new Set(), seen = new Uint8Array(nc * nr), stack = [Math.floor(r() * nc * nr)], key = (p, q) => p < q ? p + "," + q : q + "," + p; seen[stack[0]] = 1;
      while (stack.length) { const k = stack[stack.length - 1], i = k % nc, j = Math.floor(k / nc), nb = [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].filter(([p, q]) => p >= 0 && q >= 0 && p < nc && q < nr && !seen[q * nc + p]).map(([p, q]) => q * nc + p);
        if (!nb.length) { stack.pop(); continue; } const n = nb[Math.floor(r() * nb.length)]; open.add(key(k, n)); seen[n] = 1; stack.push(n); }
      // the walls: every inside edge not dug through, a graph on the grid's corners, grown out from the box's sides
      const V = (i, j) => j * (nc + 1) + i, adj = new Map(), link = (p, q) => { (adj.get(p) || adj.set(p, []).get(p)).push(q); (adj.get(q) || adj.set(q, []).get(q)).push(p); };
      for (let j = 0; j < nr; j++) for (let i = 0; i < nc; i++) { const k = j * nc + i; if (i < nc - 1 && !open.has(key(k, k + 1))) link(V(i + 1, j), V(i + 1, j + 1)); if (j < nr - 1 && !open.has(key(k, k + nc))) link(V(i, j + 1), V(i + 1, j + 1)); }
      const depth = new Map(), q0 = []; for (const v of adj.keys()) { const i = v % (nc + 1), j = Math.floor(v / (nc + 1)); if (i === 0 || j === 0 || i === nc || j === nr) { depth.set(v, 0); q0.push(v); } }
      const kids = new Map(); for (let qi = 0; qi < q0.length; qi++) { const v = q0[qi]; for (const w of adj.get(v) || []) if (!depth.has(w)) { depth.set(w, depth.get(v) + 1); (kids.get(v) || kids.set(v, []).get(v)).push(w); q0.push(w); } }
      // each run of wall a stroke: on from where it leaves the box as straight as it can go, each other turning a run of its own
      const VP = v => Cn(v % (nc + 1), Math.floor(v / (nc + 1))), chains = [], todo = []; for (const v of q0) if (depth.get(v) === 0) for (const w of kids.get(v) || []) todo.push([v, w]);
      while (todo.length) { const [p, v] = todo.shift(), ch = [p, v]; let prev = p, cur = v; for (;;) { const ks = kids.get(cur) || []; if (!ks.length) break; const nx = ks.find(w => w - cur === cur - prev) ?? ks[0]; for (const w of ks) if (w !== nx) todo.push([cur, w]); ch.push(nx); prev = cur; cur = nx; } chains.push(ch); }
      const md = Math.max(1, ...depth.values()), [g0, g1] = H.grow, dt = (g1 - g0) / md;
      h.walls = chains.map(ch => { const pts = [VP(ch[0])]; for (let n = 1; n < ch.length; n++) pts.push(...hline(VP(ch[n - 1]), VP(ch[n]), r, .01).slice(1)); const s2 = put(pts, .95); s2.t0 = g0 + depth.get(ch[0]) * dt; s2.t1 = s2.t0 + (ch.length - 1) * dt; return s2; });
      // black: the box, open at the top of its left side and the foot of its right; orange: the star past the way out;
      // blue: the dot the line sets off from
      const box = [put(poly([Cn(0, 1), Cn(0, nr), Cn(nc, nr)], r, .004), 1.15), put(poly([Cn(0, 0), Cn(nc, 0), Cn(nc, nr - 1)], r, .004), 1.15)];
      const star = Cn(nc + .8, nr - .5), go = [x0 - c * .55, y0 + c * .5], st2 = put(hstar(star, c * .42, (r() - .5) * .3), 1.15, 5), dot = put(spiral(go, c * .13, c * .13, 1.8), 1.6, 1);
      h.phases = [{ col: 0, win: H.box, strokes: box }, { col: 5, win: H.star, strokes: [st2] }, { col: 1, win: H.dot, strokes: [dot] }];
      pace(h.phases, u); h.board = [...box, st2, dot]; h.star = star; h.go = go; h.c = c;
      // the way through, from the first cell to the last; and the search: along it, at a turning with a dead end close by
      // off it (one in each of the way's first two stretches, where there is one, dealt), into the dead end and back
      const nbr = k => { const i = k % nc, j = Math.floor(k / nc); return [[i - 1, j], [i + 1, j], [i, j - 1], [i, j + 1]].filter(([p, q]) => p >= 0 && q >= 0 && p < nc && q < nr && open.has(key(k, q * nc + p))).map(([p, q]) => q * nc + p); };
      const end = nc * nr - 1, par = new Int32Array(nc * nr).fill(-1); { const qq = [0]; par[0] = 0; for (let qi = 0; qi < qq.length; qi++) for (const w of nbr(qq[qi])) if (par[w] < 0) { par[w] = qq[qi]; qq.push(w); } }
      const way = [end]; while (way[way.length - 1] !== 0) way.push(par[way[way.length - 1]]); way.reverse(); const onWay = new Set(way);
      const deadEnd = (from, k, lim) => { const p = [k]; let prev = from, cur = k; for (let n = 0; n < lim; n++) { const nx = nbr(cur).filter(w => w !== prev); if (!nx.length) return p; if (nx.length > 1) return null; prev = cur; cur = nx[0]; p.push(cur); } return nbr(cur).filter(w => w !== prev).length ? null : p; };
      const cand = []; way.forEach((k, n) => { if (n && n < way.length - 1) for (const w of nbr(k)) if (!onWay.has(w)) { const de = deadEnd(k, w, 5); if (de) cand.push({ n, de }); } });
      const pick = new Map(); for (const third of [0, 1]) { const cs = cand.filter(q => Math.floor(q.n / way.length * 2.4) === third && !pick.has(q.n)); if (cs.length) { const q = cs[Math.floor(r() * cs.length)]; pick.set(q.n, q.de); } }
      const moves = [0]; way.forEach((k, n) => { if (n) moves.push(k); const de = pick.get(n); if (de) moves.push(...de, ...de.slice(0, -1).reverse(), k); });
      // paced: a cell a step, quicker back out of a dead end, a pause at each turning and at the end of each dead end
      const steps = [], stk = [0]; let t = 0; for (let n = 1; n < moves.length; n++) { const back = stk.length > 1 && moves[n] === stk[stk.length - 2], tn = nbr(moves[n - 1]).length > 2 ? .16 : 0, de = n > 1 && nbr(moves[n - 1]).length === 1 ? .26 : 0; if (back) stk.pop(); else stk.push(moves[n]); t += tn + de; steps.push([moves[n], t, back]); t += back ? .55 : 1; }
      const [sv0, sv1] = H.solve, k2 = (sv1 - sv0 - .25) / t; h.steps = steps.map(([k, t2, back]) => [k, sv0 + .25 + t2 * k2, back]); h.dur = k2; h.way = way; h.Cc = Cc;
      h.found = h.steps[h.steps.length - 1][1] + k2; h.out = [x0 + nc * c + c * .42, Cc(end)[1]]; h.green = put([go, ...way.map(Cc), h.out], 1.9, 2); /* the way, gone over bold in green */
      h.full = [go, ...way.map(Cc), h.out]; h.fullL = h.full.reduce((m, p, i) => i ? m + Math.hypot(p[0] - h.full[i - 1][0], p[1] - h.full[i - 1][1]) : 0, 0);
    },
    /** where the line has got to at time t: the cells it is through (the dead ends it has backed out of left behind as
     *  tries), and how far into its next step its head is */
    mazeLine(h, t) {
      const path = [0], tries = []; let head = null; for (const [k, t0, back] of h.steps) { const d = h.dur * (back ? .55 : 1); if (t < t0) break; if (t < t0 + d) { head = [k, E.io((t - t0) / d), back]; break; } if (back) tries.push([path.pop(), path[path.length - 1]]); else path.push(k); }
      return { path, tries, head };
    },
    /** the line, the marker's blue, drawn through points as far as `len` along them, with its round head */
    mazeStroke(h, pts, len, a, head = 1, from = 0) {
      if (len <= from || a <= .003) return; const c = h.c; g.lineCap = "round"; g.lineJoin = "round"; g.globalCompositeOperation = "multiply"; g.globalAlpha = a; g.strokeStyle = rgba(INKS[1], .9); g.fillStyle = rgba(INKS[1], .9); g.lineWidth = Math.max(2.6, c * .13);
      g.beginPath(); let s = 0, e = pts[0], started = false; for (let i = 1; i < pts.length && s < len; i++) { const p = pts[i - 1], q = pts[i], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1e-6, a0 = clamp((from - s) / l), a1 = clamp((len - s) / l); if (a1 > a0) { const p0 = [lerp(p[0], q[0], a0), lerp(p[1], q[1], a0)]; e = [lerp(p[0], q[0], a1), lerp(p[1], q[1], a1)]; if (!started) { g.moveTo(p0[0], p0[1]); started = true; } g.lineTo(e[0], e[1]); } s += l; } g.stroke();
      g.beginPath(); g.arc(e[0], e[1], Math.max(2.4, c * .12) * head, 0, TAU); g.fill(); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    },
    /** by day, the maze: the old plan comes off as ever; the marker draws a box, open at two corners, puts a star past one
     *  opening and a dot at the other; and the box grows its own walls, in from its sides all at once, into a maze; then
     *  the dot sets off on its own, a line feeling its way through, stopping at each turning, now and then trying a dead
     *  end and drawing back out of it, until it finds its way out to the star; the star lights, the way is gone over in
     *  green; then the maze winds itself back up into nothing, the way it came, and the plan draws itself, every line of
     *  it at once, its notes slapped on */
    maze(T, I, A, on, vis, pp) {
      const H = HB.maze, a = vis * I, rest = S.wholeOf(pp.prev), cur = pp.cur, h = S.hourOf(pp.P, 2), [r0, r1] = H.rewind, [b0, b1] = H.bloom;
      S.hidden(h, cur, T, H.box[0], b0);
      if (S.dayRest(T, I, on, vis, rest)) {
        if (T < r0) { const st = S.grow(S.live, h.board, T); S.blit(S.live, a); if (st) S.hand(st, T, a); S.mazeWalls(h, T, a); S.mazeRun(h, T, A, a); }
        else if (T < r1) S.mazeUnwind(h, T, A, a);
        if (T >= b0) S.bloom(h, cur, T, a);
      }
      S.dayTop(T, I, A, on, vis, pp);
      if (!on) return;
      S.daySlap(cur, T, A, a, b0 + (b1 - b0) * .55, .2);
      S.tool(S.toolAt(T, h.phases), a);
    },
    /** the walls: growing out from the box, each run at the pace the growth reaches along it; whole, on a layer of their own */
    mazeWalls(h, T, a) {
      if (T >= HB.maze.grow[1]) { if (!h.WL) { h.WL = S.layer(); for (const s2 of h.walls) markerLine(h.WL.x, s2, s2.len); } S.blit(h.WL, a); return; }
      g.globalAlpha = a; for (const s2 of h.walls) { const f = clamp((T - s2.t0) / (s2.t1 - s2.t0)); if (f > 0) markerLine(g, s2, s2.len * f); } g.globalAlpha = 1;
    },
    /** the line: its tries, dotted; the line itself, its head going on a cell at a time and drawing back out of dead ends;
     *  out through the way out to the star, which lights; the way gone over in green */
    mazeRun(h, T, A, a) {
      if (T < HB.maze.solve[0]) return; const { path, tries, head } = S.mazeLine(h, T), Cc = h.Cc, c = h.c;
      if (tries.length) { g.lineCap = "round"; g.strokeStyle = rgba(INKS[1], .5); g.lineWidth = Math.max(1.8, c * .08); g.setLineDash([.1, c * .17]); g.globalAlpha = a; g.beginPath(); for (const [k, k0] of tries) { const p = Cc(k0), q = Cc(k); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); } g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
      const pts = [h.go, ...path.map(Cc)]; if (head) { const p = Cc(path[path.length - 1]); if (head[2]) { pts.pop(); const p0 = Cc(path[path.length - 2] ?? 0); pts.push([lerp(p[0], p0[0], head[1]), lerp(p[1], p0[1], head[1])]); } else { const q = Cc(head[0]); pts.push([lerp(p[0], q[0], head[1]), lerp(p[1], q[1], head[1])]); } }
      const fk = clamp((T - h.found) / .4); if (fk > 0) { const e = Cc(h.way[h.way.length - 1]); pts.push([lerp(e[0], h.out[0], E.out(fk)), e[1]]); }
      const gk = clamp((T - h.found - .55) / .6), gl = h.fullL * E.io(gk); S.mazeStroke(h, pts, 1e9, a, 1 + .2 * Math.max(0, Math.sin(A * 7)) * (head ? 0 : 1), gk > 0 ? gl : 0); /* (the green going over it takes its place) */
      // found: the star lights and turns over; the way gone over in green, start to finish
      const sk = clamp((T - h.found - .35) / .5); if (sk > 0) S.roomClip(() => S.mazeStar(h, a, sk));
      if (gk > 0) { g.globalAlpha = a; markerLine(g, h.green, h.green.len * E.io(gk)); g.globalAlpha = 1; }
    },
    /** the star, lit: a glow round it, filled in yellow (under its lines), a little larger for a moment, turned a little */
    mazeStar(h, a, sk) {
      const c = h.c, R2 = c * .62 * (1 + .25 * Math.sin(Math.PI * Math.min(1, sk))), gs = S.glowY || (S.glowY = K.glowSpr(40, [255, 214, 72], 1)); g.globalAlpha = a * .7 * Math.min(1, sk * 2); g.drawImage(gs, h.star[0] - R2 * 1.6, h.star[1] - R2 * 1.6, R2 * 3.2, R2 * 3.2);
      g.globalCompositeOperation = "multiply"; g.globalAlpha = a * Math.min(1, sk * 2); g.fillStyle = "rgb(255,214,72)"; g.beginPath(); hstar(h.star, R2 * .66, Math.min(1, sk) * .6).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    },
    /** the maze winding itself back up the way it came: the green back along the way, the line back to its dot, the
     *  walls back into the box's sides, the box, the star and the dot back into nothing */
    mazeUnwind(h, T, A, a) {
      const [r0, r1] = HB.maze.rewind, k = (T - r0) / (r1 - r0), f = z => 1 - clamp(z);
      if (k < .4) S.roomClip(() => S.mazeStar(h, a * (1 - k / .4), 1));
      const gl = h.green.len * f(k * 2.4); g.globalAlpha = a; markerLine(g, h.green, gl); g.globalAlpha = 1;
      S.mazeStroke(h, h.full, h.fullL * f(k * 1.9 - .1), a, 1, h.fullL * gl / h.green.len);
      g.globalAlpha = a; for (const s2 of h.walls) markerLine(g, s2, s2.len * f(k * 1.7 - .2)); for (const s2 of h.board.slice(0, 2)) markerLine(g, s2, s2.len * f(k * 1.5 - .45)); markerLine(g, h.board[2], h.board[2].len * f(k * 2 - .6)); markerLine(g, h.board[3], h.board[3].len * f(k * 2 - .9)); g.globalAlpha = 1;
    },
    /** the plan drawing itself, every line at once (each a little after the one before it, in the order the hand would
     *  have drawn them); the lines done, on a layer of their own */
    bloom(h, cur, T, a) {
      const [b0, b1] = HB.maze.bloom, all = cur.all, n = all.length; if (T >= b1) { S.blit(S.hidden(h, cur, T, 0, 0), a); return; }
      const win = i => { const s0 = b0 + (b1 - b0 - .55) * i / Math.max(1, n - 1); return [s0, s0 + .55]; }, L = h.BL || (h.BL = S.layer()); if (h.blT === undefined || T < h.blT) { L.x.save(); L.x.setTransform(1, 0, 0, 1, 0, 0); L.x.clearRect(0, 0, L.c.width, L.c.height); L.x.restore(); h.blN = 0; } h.blT = T;
      while (h.blN < n && win(h.blN)[1] <= T) { markerLine(L.x, all[h.blN], all[h.blN].len); h.blN++; }
      S.blit(L, a); g.globalAlpha = a; for (let i = h.blN; i < n; i++) { const [s0, s1] = win(i); if (T <= s0) break; markerLine(g, all[i], all[i].len * jerk((T - s0) / (s1 - s0))); } g.globalAlpha = 1;
    },
  };
  return S;
}
