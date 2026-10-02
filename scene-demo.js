// scene-demo.js — 1.12 b356: Terminal's scene (scenes.js loads it). The whole page is a phosphor screen running a demo,
// the kind the demoscene made in the nineties, in characters: every cell a letter from a ramp of ten, light to dense
// (" .:-=+*#%@"), so an effect is drawn the way ASCII art draws a picture, in the kit's green, dim, with a soft bloom
// and scanlines over it. The characters under the words (and round them) are always blank (scenes.js, `words`), so the
// effects flow round the list. The loop, fifteen seconds: a plasma; a raster bar sweeps down and behind it a tunnel
// rushes toward you; the next bar brings a checkerboard turning and zooming; then fire, rising from the foot of the
// screen; then the stars stream out from the middle, faster, and the plasma comes back. While the list is in use the
// plasma drifts, slowly. The finale: a shockwave of characters rings out from the middle, twice. Each effect is a
// function of where a cell is and the time, and the order they come in is a table: they can be dealt differently each
// time round.
//
// 1.12 b381: the forever cycle. Every pass after the first opens and closes on the plasma, as the first does, and deals
// three effects between from fifteen: the first pass's tunnel, checkerboard, fire and stars, and a donut spinning in
// shaded characters, metaballs melting into one another, a twister, a rain of glyphs down the columns, copper bars
// bouncing, hills flown over in contour lines, a zoom into the Mandelbrot set, two sets of rings making moiré, a mandala
// of petals flowing outward, a wireframe cube drawn in slashes and bars, and a sphere of dots turning. The things (the
// donut, the cube, the sphere, the twister) sit in the open part of the screen, away from the list. Each change comes in
// its own way, dealt from six: the first pass's raster bar, a dissolve, a melt down the columns, a wipe, an iris opening
// from the middle, a glitch. No effect follows itself from one pass to the next. About one pass in eight the middle
// effect is a rare one: the screen crashes, tearing and filling with garbage, goes dark with a cursor blinking, a bar
// fills and the stars come back; and about one in eight a big five drops in, made of characters, wobbling, and falls
// away. Nothing on the screen is ever a word. A touch mid-pass dissolves it back to the slow plasma. It still works the
// screen out a dozen times a second and holds it between.
//
// 1.12 b414: the egg. Every twelfth pass left alone (three minutes of the list untouched), the demo plays its hidden part:
// the Amiga's ball, 1984. A raster bar brings in a room — a wall ruled in squares, dotted with its paint, a floor running
// away from it in perspective — and the checked ball bounces in from the left, spinning about its leaning axis the way it
// travels, its shadow falling on the wall behind it; off the far wall, back, and out at a side, and a bar brings the
// plasma back. Its light checks are drawn from the dense end of the ramp and its dark ones in dots, never in a glyph the
// room is drawn in, so it reads as a ball against the lines. It bounces in the open space under the list — smaller, and
// lower, when the list leaves it little — and the characters under the words stay blank, as they always do.
//
// 1.12 b426: the long day's hour eggs. Left up for hours, the demo plays two more hidden parts, one in an hour, taking
// turns (scenes.js, `K.long`). The first is Conway's Life. A raster bar brings in a dark board ruled in dots, and a
// cursor sets the cells of Bill Gosper's glider gun (1970) one by one, where it shows whole; it runs, slowly at first —
// its two shuttles knocking back and forth between their blocks — then at a working pace, a glider leaving it every
// thirty generations with a phosphor trail behind it, the stream going off across the screen. The camera swoops in on
// the first glider, up to four times the size, its cells come out as tiles, and it follows it down the screen but not
// across, so the glider strides through the open space and out over the edge with the board's ruling sliding by behind
// it; the camera pulls back to the gun still firing, and a bar brings the plasma back. The second is the Utah teapot,
// Martin Newell's of 1975, from its own patches. The plasma dissolves, the teapot is sketched in dots and rendered by a
// scanline sweeping down, shaded from the ramp with its highlight in the screen's bright intensity; it turns once round
// on the spot; comes to the boil, steam from its spout and its lid rattling harder and harder, until the lid pops off,
// flips over in the air and comes down on it again with a clatter in a burst of steam; and the scanline takes it away
// and the plasma dissolves back. Each keeps to the open part of the screen (the teapot to the biggest box of it, the
// glider to the longest run of it), the characters under the words stay blank, and nothing on the screen is a word.
export default function demo(K) {
  const { clamp, lerp, E, seg, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  const RAMP = " .:-=+*#%@", NR = RAMP.length;
  // the effects: each a brightness 0…1 for the cell at (x, y) (in cells, from the screen's middle), at time t
  const FX = {
    plasma: (x, y, t) => { const v = Math.sin(x * .16 + t) + Math.sin(y * .23 - t * 1.3) + Math.sin((x + y) * .09 + t * .7) + Math.sin(Math.hypot(x, y * 1.8) * .2 - t * 2); return .5 + v / 8; },
    tunnel: (x, y, t) => { const d = Math.hypot(x, y * 1.9) + .01, a = Math.atan2(y * 1.9, x), u = a / Math.PI * 8 + t * .9, v = 60 / d + t * 7, c = ((Math.floor(u) + Math.floor(v / 4)) % 2 + 2) % 2; return clamp((c ? .85 : .25) * clamp(d / 30) * clamp(3 - d / 30)); },
    roto: (x, y, t) => { const s = 1.4 + Math.sin(t * .8) * .6, a = t * .5, X = (x * Math.cos(a) - y * 1.8 * Math.sin(a)) / (s * 3), Y = (x * Math.sin(a) + y * 1.8 * Math.cos(a)) / (s * 3), c = ((Math.floor(X) + Math.floor(Y)) % 2 + 2) % 2; return c ? .8 : .12; },
    fire: (x, y, t, S) => { const h = (y + S.rows / 2) / S.rows, n = S.fbm(x * .11 + Math.sin(t * .7) * .4, (S.rows - (y + S.rows / 2)) * .09 + t * 2.6), base = Math.pow(h, 2.2); return clamp(base * 1.35 * (.45 + n) - .12); },
  };
  /** the stars, streaming out from the middle: each laid into the buffer where it is, with a short trail behind it */
  const stars = (buf, t, S) => { buf.fill(0); const { cols, rows } = S;
    for (const st of S.stars) { const z = ((st.z - t * st.v) % 1 + 1) % 1; for (let k = 0; k < 4; k++) { const zz = Math.min(1, z + k * .025), q = 1 / (zz * 1.8 + .12), c = Math.round(cols / 2 + st.x * q), r2 = Math.round(rows / 2 + st.y * q * .55); if (c < 0 || c >= cols || r2 < 0 || r2 >= rows) continue; const i = r2 * cols + c; buf[i] = Math.max(buf[i], (1 - z) * (1 - k * .28)); } } };
  // the loop: each effect's start; a raster bar sweeps down the screen and the next effect shows behind it
  const PLAN = [[0, "plasma"], [2.8, "tunnel"], [5.8, "roto"], [8.8, "fire"], [11.7, "stars"], [14.2, "plasma"]], BAR = .7;
  // b381: the glyphs past the ramp, for effects drawn in lines and for the rain: a cell's glyph, if it has one, is GL[its number]
  const GL = [...RAMP, "/", "\\", "|", "_", "o", "0", "1", "<", ">", "{", "}", "[", "]", "(", ")", "$", "&", "~", "^", ";", "x", "█"], G_SLASH = 10, G_BACK = 11, G_BAR = 12, G_DASH = 3, G_O = 14, G_RAIN = 15, G_BLOCK = GL.length - 1;
  const FIVE = ["#######", "#......", "#......", "######.", "......#", "......#", "......#", "#.....#", ".#####."]; // the rare logo: a five
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  // 1.12 b426: the long day's first hour egg, Conway's Life: Bill Gosper's glider gun (1970), as Life's pattern files write
  // it, its cells in the order the cursor sets them (left to right, the way the machine is built: block, shuttle, shuttle,
  // block); the egg's beats; and how bright a cell that died k generations ago still glows on the phosphor
  const GOSPER = "24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4bobo$10bo5bo7bo$11bo3bo$12b2o!";
  const GUN = (() => { const out = []; let x = 0, y = 0, n = ""; for (const ch of GOSPER) { if (ch >= "0" && ch <= "9") { n += ch; continue; } const k = n ? +n : 1; n = ""; if (ch === "b") x += k; else if (ch === "o") { for (let j = 0; j < k; j++) out.push([x + j, y]); x += k; } else if (ch === "$") { y += k; x = 0; } } return out.sort((a, b) => a[0] - b[0] || a[1] - b[1]); })();
  const LIFE = { in0: 2.1, type0: 2.95, type1: 4.15, run: 4.4, z0: 7.6, z1: 8.6, z3: 11.9, z4: 12.9 }, AFTER = [1, .7, .5, .35, .23, .14];
  // 1.12 b426: the long day's second hour egg, the Utah teapot: Martin Newell's (1975), as the graphics libraries have
  // carried it ever since — its control points, and its patches (the rim, the body twice, the lid twice, the bottom, the
  // handle twice, the spout twice), the first six turned four ways round, the rest mirrored. The lid's are 3 and 4.
  const TCP = [.2,0,2.7,.2,-.112,2.7,.112,-.2,2.7,0,-.2,2.7,1.3375,0,2.53125,1.3375,-.749,2.53125,.749,-1.3375,2.53125,0,-1.3375,2.53125,1.4375,0,2.53125,1.4375,-.805,2.53125,.805,-1.4375,2.53125,0,-1.4375,2.53125,1.5,0,2.4,1.5,-.84,2.4,.84,-1.5,2.4,0,-1.5,2.4,1.75,0,1.875,1.75,-.98,1.875,.98,-1.75,1.875,0,-1.75,1.875,2,0,1.35,2,-1.12,1.35,1.12,-2,1.35,0,-2,1.35,2,0,.9,2,-1.12,.9,1.12,-2,.9,0,-2,.9,-2,0,.9,2,0,.45,2,-1.12,.45,1.12,-2,.45,0,-2,.45,1.5,0,.225,1.5,-.84,.225,.84,-1.5,.225,0,-1.5,.225,1.5,0,.15,1.5,-.84,.15,.84,-1.5,.15,0,-1.5,.15,-1.6,0,2.025,-1.6,-.3,2.025,-1.5,-.3,2.25,-1.5,0,2.25,-2.3,0,2.025,-2.3,-.3,2.025,-2.5,-.3,2.25,-2.5,0,2.25,-2.7,0,2.025,-2.7,-.3,2.025,-3,-.3,2.25,-3,0,2.25,-2.7,0,1.8,-2.7,-.3,1.8,-3,-.3,1.8,-3,0,1.8,-2.7,0,1.575,-2.7,-.3,1.575,-3,-.3,1.35,-3,0,1.35,-2.5,0,1.125,-2.5,-.3,1.125,-2.65,-.3,.9375,-2.65,0,.9375,-2,-.3,.9,-1.9,-.3,.6,-1.9,0,.6,1.7,0,1.425,1.7,-.66,1.425,1.7,-.66,.6,1.7,0,.6,2.6,0,1.425,2.6,-.66,1.425,3.1,-.66,.825,3.1,0,.825,2.3,0,2.1,2.3,-.25,2.1,2.4,-.25,2.025,2.4,0,2.025,2.7,0,2.4,2.7,-.25,2.4,3.3,-.25,2.4,3.3,0,2.4,2.8,0,2.475,2.8,-.25,2.475,3.525,-.25,2.49375,3.525,0,2.49375,2.9,0,2.475,2.9,-.15,2.475,3.45,-.15,2.5125,3.45,0,2.5125,2.8,0,2.4,2.8,-.15,2.4,3.2,-.15,2.4,3.2,0,2.4,0,0,3.15,.8,0,3.15,.8,-.45,3.15,.45,-.8,3.15,0,-.8,3.15,0,0,2.85,1.4,0,2.4,1.4,-.784,2.4,.784,-1.4,2.4,0,-1.4,2.4,.4,0,2.55,.4,-.224,2.55,.224,-.4,2.55,0,-.4,2.55,1.3,0,2.55,1.3,-.728,2.55,.728,-1.3,2.55,0,-1.3,2.55,1.3,0,2.4,1.3,-.728,2.4,.728,-1.3,2.4,0,-1.3,2.4,0,0,0,1.425,-.798,0,1.5,0,.075,1.425,0,0,.798,-1.425,0,0,-1.5,.075,0,-1.425,0,1.5,-.84,.075,.84,-1.5,.075];
  const TPATCH = "102 103 104 105 4 5 6 7 8 9 10 11 12 13 14 15|12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27|24 25 26 27 29 30 31 32 33 34 35 36 37 38 39 40|96 96 96 96 97 98 99 100 101 101 101 101 0 1 2 3|0 1 2 3 106 107 108 109 110 111 112 113 114 115 116 117|118 118 118 118 124 122 119 121 123 126 125 120 40 39 38 37|41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56|53 54 55 56 57 58 59 60 61 62 63 64 28 65 66 67|68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83|80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95".split("|").map(r => r.split(" ").map(Number));
  // its beats: the plasma dissolves to the dark; the teapot is sketched in dots, then rendered by a scanline sweeping down;
  // it turns once round on the spot, the light sliding over it; comes to the boil, the lid rattling harder and harder
  // and steam from the spout, until the lid pops off, flips over in the air and lands back on with a bounce, in a burst
  // of steam; and it is gone the way it came, the scanline sweeping back up, before the plasma returns
  const TEA = { dots: 2.8, scan0: 3.35, scan1: 4.55, turn0: 4.65, turn1: 7.95, boil0: 8.2, pop: 10.05, land: 10.85, boil1: 11.5, gone0: 12.15, gone1: 13.3, hero: -.3 };
  /** b381: the effects the passes after the first add. Each fills the screen's brightness (0…1 a cell) and, where it draws
   *  in lines or glyphs, `gly`; `t` is the wall clock (for what drifts), `lt` the seconds since the effect came up (for what
   *  runs its course), `an` where a thing sits in the open part of the screen: [col, row, size in columns] */
  const NEW = {
    donut(S, t, buf, gly, an) { const { cols, rows } = S, zb = S.zb, [ax, ay, sz] = an; zb.fill(0); const A2 = t * .9, B2 = t * .55, cA = Math.cos(A2), sA = Math.sin(A2), cB = Math.cos(B2), sB = Math.sin(B2), k1 = sz / 2.6; // the torus, lit from above and behind
      for (let th = 0; th < TAU; th += .085) { const ct = Math.cos(th), st = Math.sin(th), hx = 2.2 + ct;
        for (let ph = 0; ph < TAU; ph += .03) { const cp = Math.cos(ph), sp = Math.sin(ph), x = hx * (cB * cp + sA * sB * sp) - st * cA * sB, y = hx * (sB * cp - sA * cB * sp) + st * cA * cB, oz = 1 / (6 + cA * hx * sp + st * sA);
          const xp = Math.round(ax + k1 * 2 * x * oz), yp = Math.round(ay - k1 * y * oz); if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue; const i = yp * cols + xp; if (oz <= zb[i]) continue; zb[i] = oz;
          const L = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp); buf[i] = L > 0 ? .3 + .7 * Math.min(1, L / 1.3) : .15; } } },
    metaballs(S, t, buf) { const { cols, rows } = S, B = S.balls; // five, orbiting, melting together where they meet
      for (let k = 0; k < 5; k++) { B[k * 3] = cols / 2 + Math.sin(t * (.5 + k * .13) + k * 1.7) * cols * .34; B[k * 3 + 1] = rows / 2 + Math.cos(t * (.43 + k * .11) + k * 2.3) * rows * .34; B[k * 3 + 2] = (rows * (.13 + .03 * k)) ** 2; }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { let f = 0; for (let k = 0; k < 15; k += 3) { const dx = (c - B[k]) * .5, dy = r - B[k + 1]; f += B[k + 2] / (dx * dx + dy * dy + 1); } buf[r * cols + c] = f < .7 ? 0 : f < 1 ? (f - .7) / .3 * .55 : Math.min(1, .6 + (f - 1) * .25); } },
    twister(S, t, buf, gly, an) { const { cols, rows } = S, ax = an[0], hw = Math.max(5, an[2] * .26); // a bar of four faces, twisting as it goes up
      for (let r = 0; r < rows; r++) { const a0 = t * 1.3 + Math.sin(t * .7 + r * .05) * 1.6 + r * .06;
        for (let k = 0; k < 4; k++) { const a1 = a0 + k * Math.PI / 2, x1 = ax + Math.cos(a1) * hw, x2 = ax + Math.cos(a1 + Math.PI / 2) * hw; if (x2 <= x1) continue; const lum = (.3 + .7 * Math.abs(Math.cos(a1 + Math.PI / 4 - .6))) * (k % 2 ? .78 : 1);
          for (let c = Math.max(0, Math.ceil(x1)); c < Math.min(cols, x2); c++) buf[r * cols + c] = c - x1 < 1 ? 1 : lum; } } },
    rain(S, t, buf, gly) { const { cols, rows } = S, cr = S.colr; // a stream down every column, its head bright, glyphs changing in it
      for (let c = 0; c < cols; c++) { const sp = 7 + cr[c] * 11, len = 6 + Math.floor(cr[c] * 14), head = (t * sp + cr[c] * 97) % (rows + len);
        for (let k = 0; k < len; k++) { const r = Math.floor(head - k); if (r < 0 || r >= rows) continue; const i = r * cols + c; buf[i] = k === 0 ? 1 : .9 * (1 - k / len) + .06; gly[i] = k && k < len * .55 ? G_RAIN + ((c * 31 + r * 17 + Math.floor(t * 7 + c)) % 6) : 0; } } },
    copper(S, t, buf) { const { cols, rows } = S; // bars of light, bouncing past one another
      for (let k = 0; k < 6; k++) { const cy = rows / 2 + Math.sin(t * (1.1 + k * .07) + k * .95) * rows * .38, th = 2.2 + (k % 3) * .6;
        for (let r = Math.max(0, Math.floor(cy - th)); r <= Math.min(rows - 1, Math.ceil(cy + th)); r++) { const v = Math.cos((r - cy) / th * Math.PI / 2); if (v <= 0) continue; for (let c = 0; c < cols; c++) { const i = r * cols + c, w = v * (.85 + .15 * Math.sin(c * .12 + t * 2 + k)); if (w > buf[i]) buf[i] = w; } } } },
    voxel(S, t, buf) { const { cols, rows } = S, hor = rows * .44, cz = t * 6, cx = Math.sin(t * .21) * 24; // hills flown over, drawn in contour lines, the far ones dim
      for (let c = 0; c < cols; c++) { const dx = (c / cols - .5) * 1.3; let yb = rows;
        for (let z = 1.2; z < 55 && yb > 0; z *= 1.035) { const h = S.hill(cx + dx * z, cz + z), yp = Math.floor(hor + (1.35 - h) / z * rows * 1.7); if (yp >= yb) continue; const fog = 1 - z / 55, top = Math.max(0, yp), band = (h * 3.2) % 1 < .2;
          for (let r = top; r < yb; r++) buf[r * cols + c] = (r === top ? .95 : band ? .72 : .14 + .22 * h / 3.4) * fog; yb = top; } }
      for (const [sx, sy] of S.sky) { const c = Math.floor(sx * cols), r = Math.floor(sy * hor * .8); if (!buf[r * cols + c]) buf[r * cols + c] = .12 + .08 * Math.sin(t * 3 + sx * 40); } }, // and stars over them
    mandel(S, t, buf, gly, an, lt) { const { cols, rows } = S, u = clamp(lt / 3.8), sc = 1.6 * Math.pow(.004, u), mx = Math.round(20 + u * 16), st = sc * 2 / cols; // zooming into the seahorse valley
      for (let r = 0; r < rows; r++) { const y0 = .131825904 + (r - rows / 2) * st * 2; for (let c = 0; c < cols; c++) { const i = r * cols + c; if (S.mask[i]) continue; const x0 = -.743643887 + (c - cols / 2) * st; let x = 0, y = 0, n = 0;
          for (; n < mx && x * x + y * y < 16; n++) { const xt = x * x - y * y + x0; y = 2 * x * y + y0; x = xt; } buf[i] = n >= mx ? 0 : clamp((n + 1 - Math.log2(Math.log2(x * x + y * y + 1e-9) + 1e-9)) / mx * 1.4); } } },
    moire(S, t, buf) { const { cols, rows } = S, ax = cols * (.5 + .22 * Math.sin(t * .5)), ay = rows * (.5 + .25 * Math.cos(t * .37)), bx = cols * (.5 + .22 * Math.sin(t * .41 + 2)), by = rows * (.5 + .25 * Math.cos(t * .6 + 1)); // two sets of rings, drifting through each other
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const v = (Math.sin(Math.hypot((c - ax) * .5, r - ay) * 1.1) * Math.sin(Math.hypot((c - bx) * .5, r - by) * 1.1) + 1) / 2; buf[r * cols + c] = v * v; } },
    kaleido(S, t, buf) { const { cols, rows } = S, w = Math.PI / 4; // a mandala: rings bent into eight petals, flowing out and turning
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x = (c - cols / 2) * .5, y = r - rows / 2, d = Math.hypot(x, y); let th = ((Math.atan2(y, x) + t * .15) % w + w) % w; if (th > w / 2) th = w - th;
        buf[r * cols + c] = clamp(.42 + .5 * Math.sin(d * .45 - t * 2 + Math.cos(th * 8) * 2.4) + .15 * Math.sin(d * .12 - t * .7)); } },
    cube(S, t, buf, gly, an) { const { cols, rows } = S, [ax, ay, sz] = an, V = S.cubeV, a1 = t * .7, a2 = t * .45, c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2); // a wireframe cube, its edges in slashes and bars
      for (let k = 0; k < 8; k++) { const x = k & 1 ? 1 : -1, y = k & 2 ? 1 : -1, z = k & 4 ? 1 : -1, x1 = x * c1 + z * s1, z1 = -x * s1 + z * c1, y1 = y * c2 - z1 * s2, z2 = y * s2 + z1 * c2, oz = 3.2 / (z2 + 4.2); V[k * 3] = ax + x1 * oz * sz * .38; V[k * 3 + 1] = ay + y1 * oz * sz * .19; V[k * 3 + 2] = z2; }
      for (const [p, q] of EDGES) { const x0 = V[p * 3], y0 = V[p * 3 + 1], x1 = V[q * 3], y1 = V[q * 3 + 1], dx = x1 - x0, dy = y1 - y0, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)))), gi = Math.abs(dy) * 2.2 < Math.abs(dx) * .6 ? G_DASH : Math.abs(dx) < Math.abs(dy) * 2.2 * .4 ? G_BAR : dx * dy > 0 ? G_BACK : G_SLASH, near = .45 + .3 * (1 - (V[p * 3 + 2] + V[q * 3 + 2]) / 4);
        for (let j = 0; j <= n; j++) { const c = Math.round(x0 + dx * j / n), r = Math.round(y0 + dy * j / n); if (c < 0 || c >= cols || r < 0 || r >= rows) continue; const i = r * cols + c; if (near > buf[i]) { buf[i] = near; gly[i] = gi; } } }
      for (let k = 0; k < 8; k++) { const c = Math.round(V[k * 3]), r = Math.round(V[k * 3 + 1]); if (c >= 0 && c < cols && r >= 0 && r < rows) { buf[r * cols + c] = 1; gly[r * cols + c] = 0; } } },
    sphere(S, t, buf, gly, an) { const { cols, rows } = S, [ax, ay, sz] = an, P = S.dots, a = t * .6, b = t * .31, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b); // a globe of dots, turning
      for (let k = 0; k < P.length; k += 3) { const x = P[k] * ca + P[k + 2] * sa, z0 = -P[k] * sa + P[k + 2] * ca, y = P[k + 1] * cb - z0 * sb, z = P[k + 1] * sb + z0 * cb, c = Math.round(ax + x * sz * .46), r = Math.round(ay + y * sz * .23); if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
        const i = r * cols + c, v = .3 + .7 * (z + 1) / 2; if (v > buf[i]) { buf[i] = v; gly[i] = z > .2 ? G_O : 0; } } },
  };
  const POOL = ["tunnel", "roto", "fire", "stars", ...Object.keys(NEW)], TRANS = ["bar", "dissolve", "melt", "wipe", "iris", "glitch"];
  const OBJ = { donut: 1, twister: 1, cube: 1, sphere: 1 }; // the things, which sit in the open part of the screen
  /** pass P's cards: `per` different ones from a deck of `n`, dealt in shuffled rounds (the whole pool comes round before any
   *  card comes again), none of them one the pass before dealt (`sig`: the first pass's own, which pass 1 follows). Dealt
   *  from pass 1 on, remembering how far it got, so a pass costs next to nothing and any pass can be worked out alone */
  const dealt = new Map();
  const cards = (P, n, per, salt, sig = []) => { const deck = k => { const r = K.deal(-3000 - k, salt), a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const q = Math.floor(r() * (i + 1)); [a[i], a[q]] = [a[q], a[i]]; } return a; };
    const pick = (p, before) => { const out = []; for (let j = 0; j < per; j++) { const q = (p - 1) * per + j, dk = deck(Math.floor(q / n)); let c = dk[q % n]; for (let z = 1; (out.includes(c) || before.includes(c)) && z < n; z++) c = dk[(q + z) % n]; out.push(c); } return out; };
    let m = dealt.get(salt); if (!m || m.p > P) m = { p: 0, cur: sig }; for (let p = m.p + 1; p <= P; p++) m = { p, cur: pick(p, m.cur) }; dealt.set(salt, m); return m.cur; };
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .8, list: .4, // a dark kit: the screen runs behind the words, which sit on pads, and the characters under them are blank
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(23), ch = pr ? 17 : 21; /* a cell a little larger than a line of text: fewer characters to draw */
      g.font = `600 ${ch * .82}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`; const cw = Math.max(6, g.measureText("M").width);
      const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);
      Object.assign(S, { W, H, pr, ch, cw, cols, rows, font: g.font });
      S.stars = Array.from({ length: pr ? 70 : 120 }, () => ({ x: (r() - .5) * cols * .5, y: (r() - .5) * rows * .5, z: r(), v: .25 + r() * .35 }));
      const n1 = K.noise1(31, 64), n2 = K.noise1(37, 64); S.fbm = (x, y) => (K.fbm(n1, x + y * .37, 3) * .6 + K.fbm(n2, y * 1.3 - x * .21, 3) * .4);
      S.mask = new Uint8Array(cols * rows); if (S.raw) S.words(S.raw);
      // the screen: its dark, the scanlines, the curve of the glass darkening its corners
      bg.fillStyle = "#050806"; bg.fillRect(0, 0, W, H);
      bg.fillStyle = "rgba(0,0,0,.35)"; for (let y = 0; y < H; y += 3) bg.fillRect(0, y, W, 1);
      const vg = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .62); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.6)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      [S.glowC, S.glowX] = canvas(Math.ceil(W / 8), Math.ceil(H / 8)); S.glowX.imageSmoothingEnabled = true;
      S.tick = -1; /* drawn again at once */
      // b381: what the new effects need, made once with dice of their own (the stars above deal as they always have)
      const q = rng(41), n = cols * rows; S.zb = new Float32Array(n); S.gly = new Uint8Array(n); S.bufC = new Float32Array(n); S.hsh = Float32Array.from({ length: n }, () => q()); S.colr = Float32Array.from({ length: cols }, () => q());
      S.balls = new Float32Array(15); S.cubeV = new Float32Array(24); S.sky = Array.from({ length: pr ? 30 : 60 }, () => [q(), q()]);
      S.dots = new Float32Array(3 * 260); for (let k = 0; k < 260; k++) { const y = 1 - 2 * (k + .5) / 260, rr = Math.sqrt(1 - y * y), th = k * 2.39996; S.dots.set([Math.cos(th) * rr, y, Math.sin(th) * rr], k * 3); } // a sphere of points, evenly
      const HN = 64, hm = new Float32Array(HN * HN), grid = n => { const g2 = Float32Array.from({ length: n * n }, () => q()), sm = v => v * v * (3 - 2 * v), at = (x, y) => g2[(((y % n) + n) % n) * n + ((x % n) + n) % n]; return (x, y) => { const X = x * n / HN, Y = y * n / HN, x0 = Math.floor(X), y0 = Math.floor(Y), fx = sm(X - x0), fy = sm(Y - y0); return lerp(lerp(at(x0, y0), at(x0 + 1, y0), fx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), fx), fy); }; };
      const oct = [grid(4), grid(8), grid(16)]; for (let y = 0; y < HN; y++) for (let x = 0; x < HN; x++) hm[y * HN + x] = Math.pow(oct[0](x, y) * .55 + oct[1](x, y) * .3 + oct[2](x, y) * .15, 1.7) * 3.4; // value noise, its peaks sharpened
      S.hill = (x, z) => { const X = ((x % HN) + HN) % HN, Z = ((z % HN) + HN) % HN, x0 = Math.floor(X), z0 = Math.floor(Z), fx = X - x0, fz = Z - z0, x1 = (x0 + 1) % HN, z1 = (z0 + 1) % HN; return lerp(lerp(hm[z0 * HN + x0], hm[z0 * HN + x1], fx), lerp(hm[z1 * HN + x0], hm[z1 * HN + x1], fx), fz); };
      S.pl = null; S.place();
    },
    /** where the words are (scenes.js): the characters under them, and a cell round them, are blank */
    words(rects) {
      S.raw = rects; if (!S.W) return;
      const { cols, rows, cw, ch } = S; S.mask.fill(0);
      if (!S.soft) { const [c, x] = canvas(160, 80); x.imageSmoothingEnabled = true; for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(0,0,0,.2)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } S.soft = c; } /* even along a line, soft at its edges */
      for (const [x0, y0, x1, y1] of rects) { const c0 = Math.max(0, Math.floor(x0 / cw) - 1), c1 = Math.min(cols - 1, Math.ceil(x1 / cw)), r0 = Math.max(0, Math.floor(y0 / ch) - 1), r1 = Math.min(rows - 1, Math.ceil(y1 / ch)); for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) S.mask[rr * cols + c] = 1; }
      S.tick = -1; /* worked out again at once */
      if (S.zb) S.place();
    },
    /** b381: where a thing (the donut, the cube…) sits: the middle of the biggest open square of the screen, the words
     *  kept out of it (with no words known yet — the lab — a list's usual place stands in for them) */
    place() {
      const { cols, rows, pr, mask } = S, m = new Uint8Array(cols * rows);
      if (S.raw) m.set(mask); else for (let r = Math.round(rows * (pr ? .33 : .3)); r <= Math.round(rows * (pr ? .58 : .65)); r++) for (let c = 0; c <= Math.round(cols * (pr ? 1 : .64)); c++) if (c < cols) m[r * cols + c] = 1;
      const ps = new Int32Array((cols + 1) * (rows + 1)); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ps[(r + 1) * (cols + 1) + c + 1] = m[r * cols + c] + ps[r * (cols + 1) + c + 1] + ps[(r + 1) * (cols + 1) + c] - ps[r * (cols + 1) + c];
      const clear = (c0, r0, w, h) => !(ps[(r0 + h) * (cols + 1) + c0 + w] - ps[r0 * (cols + 1) + c0 + w] - ps[(r0 + h) * (cols + 1) + c0] + ps[r0 * (cols + 1) + c0]);
      let best = [cols * (pr ? .5 : .8), rows * (pr ? .8 : .5), Math.min(cols * .3, rows * .8)], bs = 0; // a square h rows by 2h columns (the cells are twice as tall as they are wide)
      for (let h = Math.min(rows - 2, Math.floor((cols - 2) / 2)); h >= 6 && !bs; h--) for (let r0 = 1; r0 + h <= rows - 1; r0++) for (let c0 = 1; c0 + 2 * h <= cols - 1; c0++) if (clear(c0, r0, 2 * h, h)) { const sc = 1 + (pr ? r0 / rows : c0 / cols); if (sc > bs) { bs = sc; best = [c0 + h, r0 + h / 2, 2 * h * .92]; } }
      S.an = best;
    },
    /** b381: pass P — its three effects and the ways each change comes in; a rare one in the middle about once in eight */
    plan(P) {
      if (S.pl && S.pl.P === P) return S.pl;
      const r = K.deal(P, 51), fx = cards(P, POOL.length, 3, 52, [0, 1, 2, 3]).map(i => POOL[i]), rare = K.bag(P, 8, 53), tr = [];
      if (rare === 1) fx[1] = "crash"; else if (K.bag(P, 8, 54) === 5) fx[1] = "logo"; // each about once in eight passes, apart
      for (let k = 0; k < 4; k++) { let x; do x = TRANS[Math.floor(r() * TRANS.length)]; while (k && x === tr[k - 1]); tr.push(x); }
      return S.pl = { P, fx: ["plasma", ...fx, "plasma"], at: [0, 2.8, 6.6, 10.4, 14.2], tr };
    },
    /** b381: one effect into a buffer (and its glyphs) */
    fill(name, buf, gly, t, lt) {
      const { cols, rows } = S; buf.fill(0); gly.fill(0);
      if (name === "stars") return stars(buf, t, S);
      if (FX[name]) { for (let rr = 0; rr < rows; rr++) { const y = rr - rows / 2; for (let c = 0; c < cols; c++) { const i = rr * cols + c; buf[i] = S.mask[i] ? 0 : FX[name](c - cols / 2, y, t, S); } } return; }
      if (NEW[name]) return NEW[name](S, t, buf, gly, S.an, lt);
      const [ax, ay, sz] = S.an;
      if (name === "crash") { // it tears, fills with garbage, goes dark with a cursor blinking, a bar fills, and the stars come up
        if (lt < .55) { FX.plasma && S.fill("plasma", buf, gly, t, 0); const tick = Math.floor(t * 12); for (let rr = 0; rr < rows; rr++) { const h = S.hsh[(rr * 7 + tick * 13) % S.hsh.length], sh = Math.floor((h - .5) * cols * lt * 1.4); if (h > .45) { const row = buf.slice(rr * cols, rr * cols + cols); for (let c = 0; c < cols; c++) buf[rr * cols + c] = row[((c - sh) % cols + cols) % cols]; } for (let c = 0; c < cols; c++) if (S.hsh[(rr * cols + c + tick * 97) % S.hsh.length] < lt * .8) { buf[rr * cols + c] = .6; gly[rr * cols + c] = G_RAIN + ((c + rr + tick) % 8); } } return; }
        if (lt < 1.7) { if ((lt - .55) % .5 < .25) { const i = Math.round(ay) * cols + Math.round(ax - sz * .3); buf[i] = 1; gly[i] = G_BLOCK; } return; }
        if (lt < 2.7) { const r0 = Math.round(ay), c0 = Math.round(ax - sz * .3), w = Math.round(sz * .6), fillTo = Math.floor(w * seg(lt, 1.8, 2.6, x => x)); for (let c = 0; c <= w + 1; c++) { const i = r0 * cols + c0 + c; if (c0 + c < 0 || c0 + c >= cols) continue; buf[i] = c === 0 || c === w + 1 ? .7 : c <= fillTo ? 1 : .15; gly[i] = c === 0 ? 21 : c === w + 1 ? 22 : 0; } return; }
        return stars(buf, t, S);
      }
      if (name === "logo") { // a big five drops in, wobbles, and falls away, over the stars
        stars(buf, t * .5, S); for (let i = 0; i < buf.length; i++) buf[i] *= .5;
        const cs = Math.max(2, Math.round(sz / 11)), rs = Math.max(1, Math.round(cs / 2)), hgt = FIVE.length * rs, drop = lt < .9 ? -hgt - 2 + (ay - hgt / 2 + hgt + 2) * E.back(clamp(lt / .9)) : lt < 3.0 ? ay - hgt / 2 : ay - hgt / 2 + (lt - 3.0) * (lt - 3.0) * rows * 1.6;
        for (let fr = 0; fr < FIVE.length; fr++) for (let fc = 0; fc < 7; fc++) { if (FIVE[fr][fc] !== "#") continue; for (let dy = 0; dy < rs; dy++) { const rr = Math.round(drop + fr * rs + dy), wob = Math.round(Math.sin(rr * .35 + t * 4) * 2); for (let dx = 0; dx < cs; dx++) { const c = Math.round(ax - 3.5 * cs + fc * cs + dx + wob); for (const [oc, or, v] of [[2, 1, .3], [0, 0, 1]]) { const cc = c + oc, r2 = rr + or; if (cc < 0 || cc >= cols || r2 < 0 || r2 >= rows) continue; const i = r2 * cols + cc; if (v > buf[i]) { buf[i] = v; gly[i] = 0; } } } } }
        return;
      }
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H, cols, rows, cw, ch } = S;
      const on = I > .01, fin = F >= 0, dealt = P > 0 && on;
      // which effect, and where the raster bar is that brings in the next
      let cur = "plasma", next = null, bar = -1;
      if (on && !dealt) for (let k = 0; k < PLAN.length; k++) { const [t0, name] = PLAN[k]; if (T >= t0) { cur = name; next = null; bar = -1; } const nx = PLAN[k + 1]; if (nx && T >= nx[0] - BAR && T < nx[0]) { next = nx[1]; bar = (T - (nx[0] - BAR)) / BAR; } }
      const t = on ? A : A * .25, dim = on ? .5 + .2 * I : .42; /* in use: the plasma, drifting slowly */
      // the screen: worked out and drawn twelve times a second, the way the demos ran (half that while the list is in use),
      // and between those ticks left as it is; the bloom is made from the characters as they're drawn
      const tick = Math.floor(A * (on || fin ? 12 : 6));
      if (tick === S.tick && Math.abs(T - (S.tickT || 0)) <= .2 && Math.abs(F - (S.tickF === undefined ? F : S.tickF)) <= .05 && P === S.tickP) return; /* between ticks the screen holds its picture: nothing is drawn */
      S.tick = tick; S.tickT = T; S.tickF = F; S.tickP = P; g.clearRect(0, 0, W, H);
      if (!S.bufA || S.bufA.length !== cols * rows) { S.bufA = new Float32Array(cols * rows); S.bufB = new Float32Array(cols * rows); S.row = new Array(cols); S.glyB = new Uint8Array(cols * rows); }
      let tr = null, q = 0; // b381: a pass after the first — its own effects, and the way each comes in
      const hl = dealt ? K.long(P) : 0, hr = hl === 1 || hl === 2 ? hl : 0; // 1.12 b426: an hour egg's pass (the crown, 3, plays as a dealt pass still)
      if (hr !== 1 && S.lb) S.lb = null; if (hr !== 2 && S.tm) S.tm = S.tz = S.tv = S.ts = null; // (an hour egg's working memory — the board's history, the teapot's surface — goes with it)
      if (dealt && K.egg(P)) { // 1.12 b414: the egg — the plasma; a bar brings in the room, the ball bounces through, a bar brings the plasma back
        const room = T >= 2.1 && T < 14.2;
        if (room) S.room(T, S.bufA, S.gly); else S.fill("plasma", S.bufA, S.gly, t, 0);
        if ((T >= 2.1 && T < 2.8) || (T >= 13.5 && T < 14.2)) { q = (T - (T < 3 ? 2.1 : 13.5)) / BAR; if (T < 3) { S.bufB.set(S.bufA); S.glyB.set(S.gly); S.fill("plasma", S.bufA, S.gly, t, 0); } else S.fill("plasma", S.bufB, S.glyB, t, 0); S.mix("bar", q, t); bar = q; }
        if (I < .6) { S.fill("plasma", S.bufB, S.glyB, A * .25, 0); const e = 1 - I / .6; for (let i = 0; i < S.bufA.length; i++) if (S.hsh[i] < e) { S.bufA[i] = S.bufB[i]; S.gly[i] = 0; } } // the list in use: back to the slow plasma, a dissolve
      }
      else if (hr) { // 1.12 b426: an hour egg — the plasma; a bar brings in the egg's screen, another takes it away again
        if (!S.hiG || S.hiG.length !== cols * rows) S.hiG = new Uint8Array(cols * rows);
        if (T >= LIFE.in0 && T < 14.2) (hr === 1 ? S.life : S.teapot)(T, S.bufA, S.gly, S.hiG); else { S.fill("plasma", S.bufA, S.gly, t, 0); S.hiG.fill(0); }
        if ((T >= 2.1 && T < 2.8) || (T >= 13.5 && T < 14.2)) { q = (T - (T < 3 ? 2.1 : 13.5)) / BAR; const to = Math.ceil(q * rows) * cols, kind = hr === 1 ? "bar" : "dissolve"; // the Life by a raster bar, the teapot by a dissolve
          if (T < 3) { S.bufB.set(S.bufA); S.glyB.set(S.gly); S.fill("plasma", S.bufA, S.gly, t, 0); if (kind === "bar") S.hiG.fill(0, to); else for (let i = 0; i < S.hiG.length; i++) if (S.hsh[i] >= q) S.hiG[i] = 0; } else { S.fill("plasma", S.bufB, S.glyB, t, 0); if (kind === "bar") S.hiG.fill(0, 0, to); else for (let i = 0; i < S.hiG.length; i++) if (S.hsh[i] < q) S.hiG[i] = 0; }
          S.mix(kind, q, t); if (kind === "bar") bar = q; }
        if (I < .6) { S.fill("plasma", S.bufB, S.glyB, A * .25, 0); const e = 1 - I / .6; for (let i = 0; i < S.bufA.length; i++) if (S.hsh[i] < e) { S.bufA[i] = S.bufB[i]; S.gly[i] = 0; S.hiG[i] = 0; } } // the list in use: back to the slow plasma, a dissolve
      }
      else if (dealt) {
        const pl = S.plan(P); let k = 0; while (k < 4 && T >= pl.at[k + 1]) k++;
        cur = pl.fx[k]; S.fill(cur, S.bufA, S.gly, t, T - pl.at[k]);
        if (k < 4 && T >= pl.at[k + 1] - BAR) { tr = pl.tr[k]; q = (T - (pl.at[k + 1] - BAR)) / BAR; next = pl.fx[k + 1]; S.fill(next, S.bufB, S.glyB, t, 0); S.mix(tr, q, t); if (tr === "bar") bar = q; }
        if (I < .6) { S.fill("plasma", S.bufB, S.glyB, A * .25, 0); const e = 1 - I / .6; for (let i = 0; i < S.bufA.length; i++) if (S.hsh[i] < e) { S.bufA[i] = S.bufB[i]; S.gly[i] = 0; } } // the list in use: back to the slow plasma, a dissolve
      }
      {
        const fill = (name, buf, rowTo) => { if (name === "stars") return stars(buf, t, S); for (let rr = 0; rr < rowTo; rr++) { const y = rr - rows / 2; for (let c = 0; c < cols; c++) { const i = rr * cols + c; buf[i] = S.mask[i] ? 0 : FX[name](c - cols / 2, y, t, S); } } };
        if (!dealt) { fill(cur, S.bufA, rows); }
        const barTo = !dealt && bar >= 0 && next ? Math.ceil(bar * rows) : 0; if (barTo) fill(next, S.bufB, barTo);
        const tx = g, row = S.row; tx.font = S.font; tx.textBaseline = "top"; tx.fillStyle = `rgba(90,245,135,${(.42 * dim / .6).toFixed(3)})`;
        // 1.12 b426: an hour egg's bright cells (the screen's high intensity, as text mode had it) come off the ordinary
        // rows and are drawn after them, in a brighter green, and the hottest nearly white
        let hiRows = null;
        if (hr) { hiRows = []; for (let rr = 0; rr < rows; rr++) { let a1 = null, a2 = null; for (let c = 0; c < cols; c++) { const i = rr * cols + c, h = S.hiG[i]; if (!h || S.mask[i]) continue; if (fin) { const d = Math.hypot(c - cols / 2, (rr - rows / 2) * 1.9); if (Math.max(Math.exp(-Math.pow(d - F * 1.4 * cols, 2) / 30), Math.exp(-Math.pow(d - (F - .3) * 1.4 * cols, 2) / 30)) > .12) continue; } /* (where the finale's ring passes, the ring has the cell) */ const k = Math.min(NR - 1, Math.floor(clamp(S.bufA[i]) * NR)), chr = S.gly[i] && k ? GL[S.gly[i]] : RAMP[k]; if (h === 1) (a1 || (a1 = Array(cols).fill(" ")))[c] = chr; else (a2 || (a2 = Array(cols).fill(" ")))[c] = chr; S.bufA[i] = 0; } if (a1 || a2) hiRows.push([rr, a1 && a1.join(""), a2 && a2.join("")]); } }
        for (let rr = 0; rr < rows; rr++) {
          const y = rr - rows / 2, src = rr < barTo ? S.bufB : S.bufA; let any = false;
          for (let c = 0; c < cols; c++) {
            const i = rr * cols + c; if (S.mask[i]) { row[c] = " "; continue; }
            let v = src[i];
            if (fin) { const x = c - cols / 2, d = Math.hypot(x, y * 1.9), ring = Math.max(Math.exp(-Math.pow(d - F * 1.4 * cols, 2) / 30), Math.exp(-Math.pow(d - (F - .3) * 1.4 * cols, 2) / 30)); v = Math.max(v * (1 - F), ring); }
            const k = Math.min(NR - 1, Math.floor(clamp(v) * NR)); row[c] = dealt && S.gly[i] && k ? GL[S.gly[i]] : RAMP[k]; if (k) any = true;
          }
          if (any) tx.fillText(row.join(""), 0, rr * ch);
        }
        if (hiRows) { const fa = fin ? 1 - F : 1, c1 = `rgba(150,255,180,${(.86 * fa * (.55 + .45 * I)).toFixed(3)})`, c2 = `rgba(215,255,228,${(.95 * fa * (.55 + .45 * I)).toFixed(3)})`; for (const [rr, s1, s2] of hiRows) { if (s1) { tx.fillStyle = c1; tx.fillText(s1, 0, rr * ch); } if (s2) { tx.fillStyle = c2; tx.fillText(s2, 0, rr * ch); } } }
        const gx = S.glowX; gx.clearRect(0, 0, S.glowC.width, S.glowC.height); gx.drawImage(g.canvas, 0, 0, S.glowC.width, S.glowC.height);
      }
      // the raster bar: a band of light sweeping down, the next effect showing above it
      if (bar >= 0) { const y = bar * H, gr = g.createLinearGradient(0, y - ch * 2, 0, y + ch * .6); gr.addColorStop(0, "rgba(74,240,122,0)"); gr.addColorStop(.8, "rgba(120,255,160,.22)"); gr.addColorStop(1, "rgba(200,255,215,.4)"); g.fillStyle = gr; g.fillRect(0, y - ch * 2, W, ch * 2.6); }
      // the bloom: the characters drawn small and laid back over themselves, soft
      g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .6; g.imageSmoothingEnabled = true; g.drawImage(S.glowC, 0, 0, W, H); g.restore();
      // under the words, the screen's own dark: the bloom and the raster bar spill light into the blank cells round them,
      // so it is taken out again there, soft at the edges
      g.save(); g.globalCompositeOperation = "destination-out"; for (const [x0, y0, x1, y1] of S.raw || []) { const mx = 16 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.soft, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } g.restore();
    },
    /** 1.12 b414: the egg's room, worked out for the screen and the words: the floor the ball lands on (clear of the
     *  footer's wash), where the wall meets the floor behind it, how big the ball is, and how high it bounces — clear of
     *  the words where there's room, and a little up behind them where there isn't */
    boingRoom() {
      const o = S.br; if (o && o.raw === S.raw && o.W === S.W && o.H === S.H) return o;
      const { W, H, ch, pr } = S, want = clamp(pr ? W * .46 : H * .27, (pr ? 9 : 10) * ch, (pr ? 12 : 13) * ch), least = 7.5 * ch;
      let open = H * (pr ? .58 : .65); // the top of the open space under the lines (no words known yet, the lab: a list's usual place)
      if (S.raw) { open = 0; for (const [, y0, , y1, kind] of S.raw) if (kind === 1) open = Math.max(open, (Math.ceil(y1 / ch) + 1) * ch); }
      let floorY = H - (pr ? 82 : 70), D = Math.min(want, (floorY - open) / 1.3); // the floor clear of the footer's wash, if the ball fits over it
      if (D < least) { floorY = H - 30; D = clamp((floorY - open) / 1.3, least, want); } // if not, down into it, and a smaller ball
      return S.br = { raw: S.raw, W, H, floorY, wallY: floorY - D * .3, D, Hb: clamp(floorY - D - open, D * .25, D * .9), nl: D < 9 * ch ? 5 : 6 };
    },
    /** 1.12 b414: where the ball is at loop time T, or null: in at the left at the top of a bounce, bouncing on the floor as
     *  it goes, off the far wall (and on a narrow screen off the near one too), and out at a side; it spins about its
     *  leaning axis the way it travels, turning back when it does */
    boingBall(T, br) {
      const { W, D, Hb, floorY } = br, R = D / 2, t0 = 3.2, t1 = 12.8; if (T <= t0 || T >= t1) return null;
      const legs = W < 800 ? [W, W - 2 * R, W] : [W, W], s = (T - t0) / (t1 - t0) * legs.reduce((a, b) => a + b, 0);
      let k = 0, s0 = s; while (k < legs.length - 1 && s0 > legs[k]) { s0 -= legs[k]; k++; }
      const x = k === 0 ? -R + s0 : k === 1 ? W - R - s0 : R + s0, Tb = W < 800 ? .86 : 1.02;
      return { x, y: floorY - R - Hb * Math.abs(Math.cos(Math.PI * (T - t0) / Tb)), R, spin: x / R };
    },
    /** 1.12 b414: the egg, in characters: the room (a wall ruled in squares, a floor running away from it, dots for the
     *  wall's paint), the ball (twelve checks round and six from pole to pole — ten and five on a small one — lit from the top left, a glint), and its shadow on the wall */
    room(T, buf, gly) {
      const { cols, rows, cw, ch, W, H, mask } = S, br = S.boingRoom(), { wallY } = br, gr = S.pr ? 3 : 4, gc = Math.max(4, Math.round(gr * ch / cw)), wr = Math.floor(wallY / ch), c0 = Math.round(cols / 2), b = S.boingBall(T, br);
      buf.fill(0); gly.fill(0);
      const sh = b && { x: b.x + b.R * .38, y: b.y + b.R * .16, r2: b.R * b.R };
      for (let r = 0; r < Math.min(rows, wr); r++) for (let c = 0; c < cols; c++) { // the wall
        const i = r * cols + c; if (mask[i]) continue;
        const v = ((c - c0) % gc + gc) % gc === 0, h = (wr - r) % gr === 0;
        let k = v && h ? .52 : h ? .34 : v ? .36 : (c + r) % 2 ? 0 : .11; if (v && !h) gly[i] = G_BAR;
        if (sh && k) { const dx = (c + .5) * cw - sh.x, dy = (r + .5) * ch - sh.y; if (dx * dx + dy * dy < sh.r2) { k = 0; gly[i] = 0; } } // the ball's shadow falls on it
        buf[i] = k;
      }
      const vpY = wallY - (H - wallY) * 2.4, u = y => 1 / (wallY - vpY) - 1 / (y - vpY), du = u(wallY + gr * ch * 1.15); // the floor, in perspective
      for (let r = wr; r < rows; r++) {
        const y = (r + .5) * ch, line = Math.floor(u(r * ch) / du) !== Math.floor(u((r + 1) * ch) / du);
        if (line) for (let c = 0; c < cols; c++) { const i = r * cols + c; if (!mask[i]) buf[i] = .34; }
        for (let j = -Math.ceil(c0 / gc) - 4; j <= Math.ceil(c0 / gc) + 4; j++) {
          const xw = (c0 + j * gc + .5) * cw, x = W / 2 + (xw - W / 2) * (y - vpY) / (wallY - vpY), c = Math.floor(x / cw); if (c < 0 || c >= cols) continue;
          const i = r * cols + c; if (mask[i]) continue; const sl = (xw - W / 2) / (wallY - vpY) * ch / cw;
          buf[i] = line ? .52 : .36; gly[i] = line ? 0 : Math.abs(sl) < .35 ? G_BAR : sl > 0 ? G_BACK : G_SLASH;
        }
      }
      if (!b) return;
      const tl = .3, ct = Math.cos(tl), st = Math.sin(tl), Lx = -.42, Ly = .52, Lz = .74; // the axis leans to the right; the light from the top left
      for (let r = Math.max(0, Math.floor((b.y - b.R) / ch)); r <= Math.min(rows - 1, Math.ceil((b.y + b.R) / ch)); r++) for (let c = Math.max(0, Math.floor((b.x - b.R) / cw)); c <= Math.min(cols - 1, Math.ceil((b.x + b.R) / cw)); c++) {
        const i = r * cols + c; if (mask[i]) continue;
        const dx = ((c + .5) * cw - b.x) / b.R, dy = (b.y - (r + .5) * ch) / b.R, d2 = dx * dx + dy * dy; if (d2 >= 1) continue;
        const z = Math.sqrt(1 - d2), X = dx * ct - dy * st, Y = dx * st + dy * ct, lon = Math.atan2(X, z) + b.spin, lat = Math.asin(clamp(Y, -1, 1));
        const chk = (Math.floor(lon / (Math.PI / br.nl)) + Math.floor(lat / (Math.PI / br.nl)) + 60) & 1, l = clamp(dx * Lx + dy * Ly + z * Lz);
        buf[i] = l > .97 ? 1 : chk ? .72 + .27 * l : .2 + .09 * l; gly[i] = 0; // the light checks in the dense end of the ramp, the dark ones in dots, never a glyph the room is drawn in
      }
    },
    /** 1.12 b426: the first hour egg's board, worked out once for the screen and the words: Life on the screen's own cells
     *  (two characters a cell, square, where the gun fits clear that way; one where only that fits), with a margin round
     *  the screen where gliders that leave it die quietly; the gun, placed where it shows whole (or, with no room for
     *  that, where least of it is hidden), out of the washes if it can be, turned the way its stream crosses the most open
     *  screen; and the close-up's stage: the longest run of open screen as tall as a glider can be made there */
    lifeBoard() {
      const o = S.lb, { cols, rows, pr, mask, ch } = S; if (o && o.raw === S.raw && o.cols === cols && o.rows === rows) return o;
      const MG = 8, m = new Uint8Array(cols * rows);
      if (S.raw) m.set(mask); else for (let r = Math.round(rows * (pr ? .33 : .3)); r <= Math.round(rows * (pr ? .58 : .65)); r++) for (let c = 0; c <= Math.round(cols * (pr ? 1 : .64)); c++) if (c < cols) m[r * cols + c] = 1; // (the lab: a list's usual place, as place() has it)
      const ps = new Int32Array((cols + 1) * (rows + 1)); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ps[(r + 1) * (cols + 1) + c + 1] = m[r * cols + c] + ps[r * (cols + 1) + c + 1] + ps[(r + 1) * (cols + 1) + c] - ps[r * (cols + 1) + c];
      const busy = (c0, r0, c1, r1) => ps[(r1 + 1) * (cols + 1) + c1 + 1] - ps[r0 * (cols + 1) + c1 + 1] - ps[(r1 + 1) * (cols + 1) + c0] + ps[r0 * (cols + 1) + c0]; // masked cells in a box (inclusive)
      const top = Math.ceil(120 / ch), foot = rows - 1 - Math.ceil(96 / ch); // under the bar along the top and the footer's pool the washes would dim it
      const place = kx => { const NX = Math.ceil(cols / kx) + 2 * MG; let best = null, bs = -1e9;
        for (let ori = 0; ori < 4; ori++) { const fx = ori & 1, fy = ori & 2, dx = fx ? -1 : 1, dy = fy ? -1 : 1, ex = fx ? 11 : 24, ey = fy ? -2 : 10; // the stream's way, and where its gliders are born (gun cells)
          for (let gy = MG; gy + 9 <= MG + rows; gy++) for (let gx = MG; gx + 36 <= NX - MG; gx++) {
            const c0 = (gx - MG) * kx, c1 = (gx + 36 - MG) * kx - 1, r0 = gy - MG, r1 = gy + 8 - MG; if (c1 >= cols) continue;
            const hid = busy(c0, r0, c1, r1) / kx; let sc = -1.5 * hid - 6 * (Math.max(0, top - r0) + Math.max(0, r1 - foot)); // the gun whole, out of the washes, if it can be
            for (let s = 0; s < 400; s++) { const ux = gx + ex + s * dx, uy = gy + ey + s * dy, c = (ux - MG) * kx, r = uy - MG; if (c < 0 || c >= cols || r < 0 || r >= rows) break; sc += m[r * cols + c] ? .2 : 1; } // its stream: every step of it on the screen, the open ones most
            if (sc > bs) { bs = sc; best = { gx, gy, ori, hid, kx, NX }; }
          } }
        return best; };
      const p2 = cols >= 84 ? place(2) : null, p1 = p2 && !p2.hid ? null : place(1), pl = !p1 ? p2 : !p2 || !p1.hid || p1.hid <= p2.hid ? p1 : p2;
      const { gx, gy, ori, kx, NX } = pl, NY = rows + 2 * MG, cells = GUN.map(([x, y]) => [gx + (ori & 1 ? 35 - x : x), gy + (ori & 2 ? 8 - y : y)]);
      const a = new Uint8Array(NX * NY); for (const [x, y] of cells) a[y * NX + x] = 1;
      const age = new Uint8Array(NX * NY).fill(255); for (const [x, y] of cells) age[y * NX + x] = 0;
      // the close-up: as big as a run of open screen at least six of its cells long allows (four times down to twice), the
      // run that goes off the screen's edge the way the glider walks if one does, out of the washes if it can be
      const dir = [ori & 1 ? -1 : 1, ori & 2 ? -1 : 1]; let band = null, Z = 2;
      for (const z of [4, 3, 2]) { const zx = 2 * z, gh = Math.ceil(3 * z) + 1; let bb = -1e9;
        for (let r0 = 0; r0 + gh <= rows; r0++) { const r1 = r0 + gh - 1, pen = 6 * (Math.max(0, top - r0) + Math.max(0, r1 - foot)); let a0 = -1;
          for (let c = 0; c <= cols; c++) { const open = c < cols && !busy(c, r0, c, r1); if (open && a0 < 0) a0 = c; if (!open && a0 >= 0) { const b0 = c - 1, len = b0 - a0 + 1, sc = len + ((dir[0] > 0 ? b0 === cols - 1 : a0 === 0) ? 3 * zx : 0) - pen * zx / 4; if (len >= 6 * zx && sc > bb) { bb = sc; band = [a0, b0, r0, r1]; } a0 = -1; } } }
        if (band) { Z = z; break; } }
      if (!band) band = [0, cols - 1, Math.max(0, foot - 6), Math.min(rows - 1, foot)];
      const [ba, bz, br0, br1] = band, zx = 2 * Z, run = Math.min(bz - ba + 1, 15 * zx), x0 = dir[0] > 0 ? bz + 1 - run + 1.5 * zx : ba + run - 1.5 * zx; // where it comes into the close-up: at most fifteen cells from the run's far end
      const pace = clamp(4 * run / zx / (LIFE.z3 - LIFE.z1 + .1), 7, 22); // generations a second as it crosses, so it is over the edge as the camera pulls back
      return S.lb = { raw: S.raw, cols, rows, kx, MG, NX, NY, cells, ori, gx, gy, born: [gx + (ori & 1 ? 11 : 24), gy + (ori & 2 ? -2 : 10)], dir, Z, x0, yb: (br0 + br1 + 1) / 2, pace, hist: [age], cur: a, nxt: new Uint8Array(NX * NY) };
    },
    /** 1.12 b426: the board's generations up to n, each kept as how long ago each cell was last alive (0: alive now) */
    lifeGen(n) {
      const lb = S.lifeBoard(), { NX, NY, hist } = lb; let a = lb.cur, b = lb.nxt;
      while (hist.length <= n) {
        for (let y = 1; y < NY - 1; y++) for (let x = 1; x < NX - 1; x++) { const i = y * NX + x, k = a[i - NX - 1] + a[i - NX] + a[i - NX + 1] + a[i - 1] + a[i + 1] + a[i + NX - 1] + a[i + NX] + a[i + NX + 1]; b[i] = k === 3 || (k === 2 && a[i]) ? 1 : 0; }
        for (let x = 0; x < NX; x++) b[x] = b[NX + x] = b[(NY - 1) * NX + x] = b[(NY - 2) * NX + x] = 0; // the margin's far edge: what reaches it dies there
        for (let y = 0; y < NY; y++) b[y * NX] = b[y * NX + 1] = b[y * NX + NX - 1] = b[y * NX + NX - 2] = 0;
        const prev = hist[hist.length - 1], age = new Uint8Array(NX * NY); for (let i = 0; i < age.length; i++) age[i] = b[i] ? 0 : prev[i] === 255 ? 255 : Math.min(254, prev[i] + 1);
        hist.push(age); [a, b] = [b, a];
      }
      lb.cur = a; lb.nxt = b; return hist[n];
    },
    /** 1.12 b426: how many generations the gun has run by loop time T: slowly at first, so the shuttles can be seen to
     *  move, then quickening to its working pace */
    lifeG(T) {
      if (T <= LIFE.run) return 0;
      const pc = S.lifeBoard().pace, RATE = [[LIFE.run, 4], [4.95, 4], [5.9, 22], [7.5, 22], [8.2, pc], [LIFE.z3, pc], [12.6, 22], [99, 22]]; // slow as it starts, then at work, then the close-up's pace
      let g = 0; for (let k = 0; k < RATE.length - 1; k++) { const [t0, r0] = RATE[k], [t1, r1] = RATE[k + 1]; if (T <= t0) break; const u = Math.min(T, t1); g += (u - t0) * (r0 + (r1 - r0) * ((u - t0) / (t1 - t0)) / 2); }
      return g;
    },
    /** 1.12 b426: the first hour egg's camera at loop time T (g generations in): the whole board, cell for cell, until it
     *  swoops in on the first glider the gun made, as big as the open screen allows (up to four times), setting it down at
     *  the start of the longest run of open screen; then it follows the glider down (or up) the screen but not across, so the glider strides across the
     *  screen and out over its edge, the board's ruling sliding past behind it; and pulls back. On a screen of one
     *  character a cell (a phone), the close-up's cells come out square, as two characters. Returns the point followed (in
     *  cells), where it is on the screen (in characters), and how many characters a cell is across and down. */
    lifeCam(T, g, lb) {
      const { kx, MG, born, dir, x0, yb, Z } = lb, at = gg => [born[0] + .5 + dir[0] * (gg - 30) / 4, born[1] + .5 + dir[1] * (gg - 30) / 4]; // the gun's first glider (out at generation 30), its middle as it goes
      const f = at(g), nat = [(f[0] - MG) * kx, f[1] - MG], g1 = S.lifeG(LIFE.z1);
      const u = T <= LIFE.z0 || T >= LIFE.z4 ? 0 : T < LIFE.z1 ? E.io((T - LIFE.z0) / (LIFE.z1 - LIFE.z0)) : T < LIFE.z3 ? 1 : 1 - E.io((T - LIFE.z3) / (LIFE.z4 - LIFE.z3));
      const z = 1 + (Z - 1) * u, zx = z * (kx + (2 - kx) * u), cross = [x0 + dir[0] * (g - g1) / 4 * 2 * Z, yb];
      return { fx: f[0], fy: f[1], ax: lerp(nat[0], cross[0], u), ay: lerp(nat[1], cross[1], u), zx, zy: z, u };
    },
    /** 1.12 b426: the first hour egg, the board at loop time T into the buffers: the cursor setting the gun's cells, then
     *  the generations, live cells at the bright end (`hiG`, drawn in the screen's bright intensity), the dead fading
     *  through the ramp behind them, the board's ruling in dots — every fourth cell, and every cell once they're big */
    life(T, buf, gly, hiG) {
      const { cols, rows, mask } = S, lb = S.lifeBoard(), { kx, MG, NX, NY } = lb; buf.fill(0); gly.fill(0); hiG.fill(0);
      const typing = T < LIFE.run, set = typing ? Math.floor(clamp((T - LIFE.type0) / (LIFE.type1 - LIFE.type0)) * GUN.length) : GUN.length;
      const gf = S.lifeG(T), age = S.lifeGen(Math.floor(gf)), cur = T >= LIFE.type0 - .25 && T < LIFE.type1 ? lb.cells[Math.min(set, GUN.length - 1)] : null;
      const cam = S.lifeCam(T, gf, lb), { fx, fy, ax, ay, zx, zy } = cam, fine = zy >= 1.9, big = zx >= 3.5 && zy >= 2.5, ux0 = new Int16Array(cols + 2);
      for (let c = -1; c <= cols; c++) ux0[c + 1] = Math.floor(fx + (c + .5 - ax) / zx);
      for (let r = 0; r < rows; r++) { const uy = Math.floor(fy + (r + .5 - ay) / zy); if (uy < 0 || uy >= NY) continue; const top = Math.floor(fy + (r - .5 - ay) / zy) !== uy, bot = Math.floor(fy + (r + 1.5 - ay) / zy) !== uy;
        for (let c = 0; c < cols; c++) { const i = r * cols + c; if (mask[i]) continue; const ux = ux0[c + 1]; if (ux < 0 || ux >= NX) continue;
          let a = age[uy * NX + ux];
          if (typing && a === 0) { a = 255; for (let j = 0; j < set; j++) if (lb.cells[j][0] === ux && lb.cells[j][1] === uy) { a = 0; break; } }
          const left = ux0[c] !== ux;
          if (a === 0) { const e = big ? (left || ux0[c + 2] !== ux ? 1 : 0) + (top || bot ? 1 : 0) : 0; buf[i] = e === 2 ? .75 : e ? .86 : 1; hiG[i] = 1; } // a live cell, and big, a tile: dense in the middle, its rim and corners a step lighter
          else if (a < AFTER.length) buf[i] = AFTER[a];
          else if (top && left && (fine || ((ux - lb.gx) % 4 === 0 && (uy - lb.gy) % 2 === 0))) buf[i] = .11; // the board's ruling
        } }
      if (cur) { const r = cur[1] - MG; for (let d = 0; d < kx; d++) { const c = (cur[0] - MG) * kx + d; if (r >= 0 && r < rows && c >= 0 && c < cols && !mask[r * cols + c]) { buf[r * cols + c] = 1; gly[r * cols + c] = G_BLOCK; hiG[r * cols + c] = 2; } } } // the cursor
    },
    /** 1.12 b426: the teapot's surface, sampled once: every patch at a grid of points, each with its normal (outward:
     *  the patches wind the other way round, as the libraries drew them), and which of them are the lid's */
    teaModel() {
      if (S.tm) return S.tm;
      const N = 22, n = 32 * (N + 1) * (N + 1), P = new Float32Array(n * 3), Nm = new Float32Array(n * 3), lid = new Uint8Array(n);
      const B = t => { const u = 1 - t; return [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]; }, dB = t => { const u = 1 - t; return [-3 * u * u, 3 * u * u - 6 * u * t, 6 * u * t - 3 * t * t, 3 * t * t]; };
      const BU = Array.from({ length: N + 1 }, (_, a) => B(a / N)), DU = Array.from({ length: N + 1 }, (_, a) => dB(a / N)), cp = new Float32Array(48); // the bases at the grid's steps, worked out once
      let m = 0;
      TPATCH.forEach((pd, i) => { for (const [sx, sy, rev] of i < 6 ? [[1, 1, 0], [1, -1, 1], [-1, 1, 1], [-1, -1, 0]] : [[1, 1, 0], [1, -1, 1]]) {
        for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) { const q = pd[j * 4 + (rev ? 3 - k : k)] * 3, o = (j * 4 + k) * 3; cp[o] = TCP[q] * sx; cp[o + 1] = TCP[q + 1] * sy; cp[o + 2] = TCP[q + 2]; }
        const at = (bu, du, bv, dv) => { const o = [0, 0, 0, 0, 0, 0, 0, 0, 0]; for (let j = 0; j < 4; j++) for (let k = 0; k < 4; k++) { const c = (j * 4 + k) * 3, f = bu[j] * bv[k], fu = du[j] * bv[k], fv = bu[j] * dv[k]; for (let l = 0; l < 3; l++) { o[l] += f * cp[c + l]; o[3 + l] += fu * cp[c + l]; o[6 + l] += fv * cp[c + l]; } } return o; };
        for (let a = 0; a <= N; a++) for (let b = 0; b <= N; b++) { const o = at(BU[a], DU[a], BU[b], DU[b]); let w = o; if (Math.hypot(o[3], o[4], o[5]) <= 1e-6) { const u2 = a ? (a / N) - .03 : .03; w = at(B(u2), dB(u2), BU[b], DU[b]); } // (where the patch closes to a point, the normal from beside it)
          const nx = w[5] * w[7] - w[4] * w[8], ny = w[3] * w[8] - w[5] * w[6], nz = w[4] * w[6] - w[3] * w[7], L = Math.hypot(nx, ny, nz) || 1; // (v across u: outward)
          P[m * 3] = o[0] - .25; P[m * 3 + 1] = o[1]; P[m * 3 + 2] = o[2] - 1.55; Nm[m * 3] = nx / L; Nm[m * 3 + 1] = ny / L; Nm[m * 3 + 2] = nz / L; lid[m] = i === 3 || i === 4 ? 1 : i < 3 ? 2 : 0; m++; } } });
      return S.tm = { n: m, P, N: Nm, lid }; // (lid: 1 the lid's, 2 the wall's, whose inside shows when the lid is off)
    },
    /** 1.12 b426: where the teapot stands: the biggest box of open screen about twice as wide as it is tall (in pixels),
     *  the right of a wide screen and the foot of a tall one preferred, as place() finds its square; and how big it is */
    teaRoom() {
      const o = S.tr, { cols, rows, pr, mask, cw, ch } = S; if (o && o.raw === S.raw && o.cols === cols && o.rows === rows) return o;
      const m = new Uint8Array(cols * rows); if (S.raw) m.set(mask); else for (let r = Math.round(rows * (pr ? .33 : .3)); r <= Math.round(rows * (pr ? .58 : .65)); r++) for (let c = 0; c <= Math.round(cols * (pr ? 1 : .64)); c++) if (c < cols) m[r * cols + c] = 1;
      const ps = new Int32Array((cols + 1) * (rows + 1)); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ps[(r + 1) * (cols + 1) + c + 1] = m[r * cols + c] + ps[r * (cols + 1) + c + 1] + ps[(r + 1) * (cols + 1) + c] - ps[r * (cols + 1) + c];
      const clear = (c0, r0, w, h) => !(ps[(r0 + h) * (cols + 1) + c0 + w] - ps[r0 * (cols + 1) + c0 + w] - ps[(r0 + h) * (cols + 1) + c0] + ps[r0 * (cols + 1) + c0]), asp = 2.1 * ch / cw;
      let best = null; for (let h = rows - 2; h >= 5 && !best; h--) { const w = Math.min(cols - 2, Math.round(h * asp)); let bs = 0; for (let r0 = 1; r0 + h <= rows - 1; r0++) for (let c0 = 1; c0 + w <= cols - 1; c0++) if (clear(c0, r0, w, h)) { const sc = 1 + (pr ? r0 / rows : c0 / cols); if (sc > bs) { bs = sc; best = [c0, r0, w, h]; } } }
      if (!best) best = [1, rows - 9, cols - 2, 7];
      const [c0, r0, w, h] = best;
      return S.tr = { raw: S.raw, cols, rows, cx: (c0 + w / 2) * cw, cy: (r0 + h / 2) * ch + ch * .3, s: Math.min(w * cw / 7.3, h * ch / 3.45), box: best };
    },
    /** 1.12 b426: the teapot at loop time T: how far round it has turned (from three-quarters on, spout toward you), and
     *  in the boil, how far its lid has hopped and tipped */
    teaPose(T) {
      const th = TEA.hero + TAU * E.io(clamp((T - TEA.turn0) / (TEA.turn1 - TEA.turn0))) + .5 * E.io(clamp((T - TEA.boil1) / (TEA.gone1 - TEA.boil1)));
      let lift = 0, tilt = 0, flip = 0, jolt = 0;
      if (T > TEA.boil0 && T < TEA.pop) { const k = (T - TEA.boil0) / (TEA.pop - TEA.boil0), hop = (T - TEA.boil0) / (.26 - .1 * k); lift = (.04 + .3 * k * k) * Math.abs(Math.sin(Math.PI * hop)); tilt = (.03 + .14 * k) * Math.sin(Math.PI * hop / 2); } // rattling, harder and quicker
      else if (T >= TEA.pop && T < TEA.land) { const q = (T - TEA.pop) / (TEA.land - TEA.pop); lift = 7.6 * q * (1 - q); flip = TAU * E.io(q); jolt = .12 * Math.max(0, 1 - q * 5); } // off it goes, over in the air, and down
      else if (T >= TEA.land && T < TEA.land + .5) { const q = (T - TEA.land) / .5; lift = .42 * Math.abs(Math.sin(Math.PI * q * 2)) * (1 - q); tilt = .12 * Math.sin(Math.PI * q * 4) * (1 - q); jolt = .05 * Math.max(0, 1 - q * 4); } // a bounce and a clatter
      return { th, lift, tilt, flip, jolt };
    },
    /** 1.12 b426: a point of the teapot's (its own units, the lid's moved with it if `lid`) on the screen: [x, y, depth] */
    teaProj(x, y, z, pose, lid) {
      const tr = S.teaRoom(), ph = .34, c = Math.cos(pose.th), s = Math.sin(pose.th);
      if (lid) { const a = pose.tilt + pose.flip, ct = Math.cos(a), st = Math.sin(a), zz = z - 1.25; [x, z] = [x * ct - zz * st, x * st + zz * ct + 1.25 + pose.lift]; } // the lid tips (or flips) about its middle, and hops
      z += pose.jolt;
      const X = x * c - y * s, Y = x * s + y * c, Y2 = Y * Math.cos(ph) - z * Math.sin(ph), Z2 = Y * Math.sin(ph) + z * Math.cos(ph), f = 20 / (20 + Y2);
      return [tr.cx + X * f * tr.s, tr.cy - Z2 * f * tr.s, Y2];
    },
    /** 1.12 b426: the steam: puffs from the spout as it comes to the boil, quicker and fuller; from under the lid as it
     *  rattles; a burst from the open top as the lid goes, and the spout steaming on after; each rises, drifts, swells and
     *  thins, worked out once */
    teaPuffs() {
      if (S.tpf) return S.tpf; const r = rng(77), out = [], add = (te, src, k, big = 1) => out.push({ te, src, k, vy: (55 + r() * 55) * (.7 + k * .3), side: (r() - .5) * 30, r0: (5 + r() * 4) * big, gr: (8 + r() * 9 * k) * big, life: (1.4 + r() * 1.2) * (.8 + .2 * big), ph: r() * 40 });
      for (let t = TEA.boil0; t < TEA.pop; t += .26 - .15 * (t - TEA.boil0) / (TEA.pop - TEA.boil0)) add(t + r() * .05, 0, .45 + .55 * (t - TEA.boil0) / (TEA.pop - TEA.boil0)); // from the spout, quicker and fuller
      for (let t = TEA.boil0 + 1; t < TEA.pop; t += .3) add(t, r() < .5 ? 1 : 2, .5); // from under the rattling lid
      for (let k = 0; k < 9; k++) add(TEA.pop + k * .045, 3, 1, 1.6 + r() * .8); // the burst as the lid goes
      for (let t = TEA.pop; t < TEA.boil1 + .6; t += .2) add(t, 0, .9 - .6 * (t - TEA.pop) / (TEA.boil1 + .6 - TEA.pop));
      return S.tpf = out;
    },
    /** 1.12 b426: the second hour egg, the teapot at loop time T into the buffers: sketched in dots, rendered by a scanline,
     *  shaded from a light above it to the left with its highlight at the bright end (`hiG`), turning, boiling, steaming,
     *  and gone the way it came. The characters under the words stay blank, as ever. */
    teapot(T, buf, gly, hiG) {
      const { cols, rows, mask, cw, ch, hsh } = S, tm = S.teaModel(), n = cols * rows; buf.fill(0); gly.fill(0); hiG.fill(0);
      if (!S.tz || S.tz.length !== n) { S.tz = new Float32Array(n); S.tv = new Float32Array(n); S.ts = new Float32Array(n); }
      const tz = S.tz, tv = S.tv, ts = S.ts; tz.fill(1e9);
      const pose = S.teaPose(T), ph = .34, c = Math.cos(pose.th), s = Math.sin(pose.th), cp = Math.cos(ph), sp = Math.sin(ph), tr = S.teaRoom(), { P, N: Nm, lid } = tm;
      const L = [-.48, -.66, .58], H = [-.48 / 1.94, -1.66 / 1.94, .58 / 1.94]; // the light, from above and to the left of you; the half-way vector for its highlight
      const la = pose.tilt + pose.flip, ct = Math.cos(la), st = Math.sin(la);
      let rTop = rows, rBot = -1, cL = cols, cR = -1; const back = [];
      for (let k = 0; k < tm.n; k++) {
        let x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2], nx = Nm[k * 3], ny = Nm[k * 3 + 1], nz = Nm[k * 3 + 2];
        if (lid[k] === 1 && (pose.lift || la)) { const zz = z - 1.25; [x, z] = [x * ct - zz * st, x * st + zz * ct + 1.25 + pose.lift]; [nx, nz] = [nx * ct - nz * st, nx * st + nz * ct]; }
        z += pose.jolt;
        const X = x * c - y * s, Y = x * s + y * c, Y2 = Y * cp - z * sp, Z2 = Y * sp + z * cp, NY = nx * s + ny * c, NY2 = NY * cp - nz * sp;
        if (NY2 > .05) { if (lid[k] === 2 && pose.lift > .05) back.push(k); continue; } // facing away (the wall's inside kept for when the lid is up)
        const f = 20 / (20 + Y2), col = Math.floor((tr.cx + X * f * tr.s) / cw), row = Math.floor((tr.cy - Z2 * f * tr.s) / ch); if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
        const i = row * cols + col; if (Y2 >= tz[i]) continue; tz[i] = Y2;
        const NX = nx * c - ny * s, NZ2 = NY * sp + nz * cp, d = Math.max(0, NX * L[0] + NY2 * L[1] + NZ2 * L[2]), sh = Math.max(0, NX * H[0] + NY2 * H[1] + NZ2 * H[2]), rim = Math.pow(1 - Math.min(1, -NY2), 3);
        tv[i] = .07 + .8 * d + .13 * rim; ts[i] = Math.pow(sh, 24);
        if (row < rTop) rTop = row; if (row > rBot) rBot = row; if (col < cL) cL = col; if (col > cR) cR = col;
      }
      for (const k of back) { const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2] + pose.jolt, X = x * c - y * s, Y = x * s + y * c, Y2 = Y * cp - z * sp, Z2 = Y * sp + z * cp, f = 20 / (20 + Y2), col = Math.floor((tr.cx + X * f * tr.s) / cw), row = Math.floor((tr.cy - Z2 * f * tr.s) / ch); // the dark inside, through the open top
        if (col < 0 || col >= cols || row < 0 || row >= rows) continue; const i = row * cols + col; if (tz[i] < 1e8) continue; tz[i] = Y2 + 50; tv[i] = .13 + .05 * Math.max(0, -z); ts[i] = 0; }
      for (let r = Math.max(0, rTop); r <= Math.min(rows - 1, rBot); r++) for (let cc = Math.max(1, cL); cc <= Math.min(cols - 2, cR); cc++) { const i = r * cols + cc; if (tz[i] < 1e8) continue; // a cell between two of its own the samples missed
        if (tz[i - 1] < 1e8 && tz[i + 1] < 1e8) { tz[i] = (tz[i - 1] + tz[i + 1]) / 2; tv[i] = (tv[i - 1] + tv[i + 1]) / 2; ts[i] = (ts[i - 1] + ts[i + 1]) / 2; }
        else if (r > 0 && r < rows - 1 && tz[i - cols] < 1e8 && tz[i + cols] < 1e8) { tz[i] = (tz[i - cols] + tz[i + cols]) / 2; tv[i] = (tv[i - cols] + tv[i + cols]) / 2; ts[i] = (ts[i - cols] + ts[i + cols]) / 2; } }
      // the scanline that renders it, down, and that takes it away again, up; above the one and below the other, dots
      const span = rBot - rTop + 1, down = T < TEA.scan1 ? rTop + span * clamp((T - TEA.scan0) / (TEA.scan1 - TEA.scan0)) : 1e9, up = T > TEA.gone0 ? rBot + 1 - span * clamp((T - TEA.gone0) / (TEA.gone1 - TEA.gone0)) : 1e9;
      const dotIn = clamp((T - TEA.dots) / (TEA.scan0 - TEA.dots)), dotOut = 1 - clamp((T - TEA.gone1) / .3);
      for (let r = Math.max(0, rTop); r <= Math.min(rows - 1, rBot); r++) { const solid = r < down && r < up, line = (T >= TEA.dots && Math.floor(down) === r) || (T < TEA.gone1 && Math.floor(up) === r); // (the line poised at the top as the dots come, then sweeping)
        for (let cc = Math.max(0, cL); cc <= Math.min(cols - 1, cR); cc++) { const i = r * cols + cc; if (tz[i] > 1e8 || mask[i]) continue;
          if (line) { buf[i] = 1; gly[i] = G_DASH; hiG[i] = 2; continue; }
          if (solid) { buf[i] = clamp(tv[i] + .55 * ts[i]); hiG[i] = ts[i] > .45 ? 2 : 1; } // rendered: the screen's bright intensity, its highlight the hottest
          else if ((r + cc) % 2 === 0 && hsh[i] < Math.min(dotIn, dotOut)) buf[i] = .13 + .1 * tv[i];
        } }
      // the steam, where the teapot isn't
      for (const p of S.teaPuffs()) { const age = T - p.te; if (age <= 0 || age >= p.life) continue;
        const pz = S.teaPose(p.te), o = p.src === 0 ? S.teaProj(3.2, 0, .95, pz, 0) : p.src === 3 ? S.teaProj(0, 0, .95, { th: pz.th, lift: 0, tilt: 0, flip: 0, jolt: 0 }, 0) : S.teaProj(p.src === 1 ? -1.25 : 1.25, 0, .88, pz, 1), sw = p.src === 0 ? Math.sign(Math.cos(pz.th)) : p.src === 1 ? -1 : p.src === 2 ? 1 : (p.ph % 2 > 1 ? 1 : -1) * .6; // from the spout's mouth, the lid's edge, or the open top
        const R = p.r0 + p.gr * age, cx = o[0] + sw * 22 * (1 - Math.exp(-2.5 * age)) + p.side * age + Math.sin(age * 2.6 + p.ph) * 5 * age, cy = o[1] - p.vy * age, w = p.k * (1 - age / p.life) ** 2 * clamp(age / .12);
        for (let r = Math.max(0, Math.floor((cy - R) / ch)); r <= Math.min(rows - 1, Math.floor((cy + R) / ch)); r++) for (let cc = Math.max(0, Math.floor((cx - R) / cw)); cc <= Math.min(cols - 1, Math.floor((cx + R) / cw)); cc++) {
          const i = r * cols + cc; if (mask[i] || tz[i] < 1e8) continue; const dx = ((cc + .5) * cw - cx) / R, dy = ((r + .5) * ch - cy) / R, d2 = dx * dx + dy * dy; if (d2 >= 1) continue;
          const v = w * (1 - d2) * (.45 + 1.2 * S.fbm(cc * .19 + p.ph, r * .42 - age * 1.7)); if (v > buf[i]) buf[i] = Math.min(.66, v);
        } }
    },
    /** b381: the change from the effect in bufA to the one in bufB, `q` of the way: the raster bar, a dissolve, a melt, a
     *  wipe, an iris or a glitch; the result in bufA */
    mix(kind, q, t) {
      const { cols, rows } = S, A0 = S.bufA, B0 = S.bufB, gA = S.gly, gB = S.glyB, take = i => { A0[i] = B0[i]; gA[i] = gB[i]; };
      if (kind === "bar") { const to = Math.ceil(q * rows) * cols; for (let i = 0; i < to; i++) take(i); return; } // the bar's own light is drawn over it
      if (kind === "dissolve") { for (let i = 0; i < A0.length; i++) if (S.hsh[i] < q) take(i); return; }
      if (kind === "melt") { const C0 = S.bufC; C0.set(A0); for (let c = 0; c < cols; c++) { const off = Math.floor(clamp(q * (1.3 + S.colr[c] * .9) - S.colr[c] * .3) * rows); for (let r = 0; r < rows; r++) { const i = r * cols + c; if (r < off) take(i); else { A0[i] = C0[(r - off) * cols + c]; } } } return; } // the old picture slides down the columns, each at its own pace
      if (kind === "wipe") { const edge = q * (cols + 2) - 1; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * cols + c; if (c < edge - .5) take(i); else if (c < edge + .5) { A0[i] = 1; gA[i] = G_BAR; } } return; }
      if (kind === "iris") { const R = q * Math.hypot(cols / 4, rows / 2) * 1.05; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const i = r * cols + c, d = Math.hypot((c - cols / 2) * .5, r - rows / 2); if (d < R - .7) take(i); else if (d < R + .3) { A0[i] = .95; gA[i] = 0; } } return; }
      if (kind === "glitch") { if (q > .8) { for (let i = 0; i < A0.length; i++) take(i); return; } const tick = Math.floor(t * 12); for (let r = 0; r < rows; r++) { const h = S.hsh[(r * 13 + tick * 7) % S.hsh.length]; if (h < .3 + q * .4) { const sh = Math.floor((h - .35) * cols * .5), src = h < .2 ? B0 : A0, C0 = S.bufC; for (let c = 0; c < cols; c++) C0[c] = src[r * cols + ((c - sh) % cols + cols) % cols]; for (let c = 0; c < cols; c++) { A0[r * cols + c] = C0[c]; gA[r * cols + c] = 0; } } } } // rows torn sideways, and the next showing through
    },
  };
  return S;
}
