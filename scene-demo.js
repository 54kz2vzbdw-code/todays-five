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
      if (dealt && K.egg(P)) { // 1.12 b414: the egg — the plasma; a bar brings in the room, the ball bounces through, a bar brings the plasma back
        const room = T >= 2.1 && T < 14.2;
        if (room) S.room(T, S.bufA, S.gly); else S.fill("plasma", S.bufA, S.gly, t, 0);
        if ((T >= 2.1 && T < 2.8) || (T >= 13.5 && T < 14.2)) { q = (T - (T < 3 ? 2.1 : 13.5)) / BAR; if (T < 3) { S.bufB.set(S.bufA); S.glyB.set(S.gly); S.fill("plasma", S.bufA, S.gly, t, 0); } else S.fill("plasma", S.bufB, S.glyB, t, 0); S.mix("bar", q, t); bar = q; }
        if (I < .6) { S.fill("plasma", S.bufB, S.glyB, A * .25, 0); const e = 1 - I / .6; for (let i = 0; i < S.bufA.length; i++) if (S.hsh[i] < e) { S.bufA[i] = S.bufB[i]; S.gly[i] = 0; } } // the list in use: back to the slow plasma, a dissolve
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
