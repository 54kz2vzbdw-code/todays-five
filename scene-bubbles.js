// scene-bubbles.js — 1.12 b353: Blush's scene (scenes.js loads it; Pink keeps the neon heart). Soap bubbles in the
// morning light. Each one's film is coloured the way a real one is: light comes back off the film's two faces and
// interferes, so the colour at each point is set by how thick the film is there, summed over the spectrum; the film
// drains, thicker low down, and swirls, and at the rim, seen slant, its colours crowd into rings. A window shines in each,
// and each wobbles as it goes. Small bubbles drift up the page all the time, and now and then one pops. The loop,
// fifteen seconds: a pink wand comes in; a big bubble swells out of its ring, wobbling, pinches off and floats; the wand
// sweeps and a stream of small bubbles pours out of it; the wand goes; the big bubble's film thins to gold at the top and
// it pops in a spray of droplets; the small ones pop, one by one. While the list is in use they hang, barely drifting.
// The finale: a flurry of bubbles rises and pops. The wand and the big bubble keep to the largest open space on the page
// (scenes.js, `words`), and the lines sit on pads, so the small ones can drift behind them. The beats are a table, so
// they can be dealt differently each time round.
// 1.12 b369: the forever cycle. The loop above is pass 0. Each pass after it the wand comes in a colour of its own (every
// run of six passes shows all six), its frame now and then a star, and blows the pass's own: two bubbles in turn that
// float together and join, a wall between them, until one pops and the other snaps round; a heart-shaped bubble out of
// a heart-shaped frame, which rounds as it floats free, and a stream after it; a shake that throws out a flurry, which
// packs into a raft of foam and pops away from its edge in; a long stream a breeze curls into a whirl and carries off
// the edge; a chain of bubbles blown one onto the next, wriggling, popping one after another down its length. Every run
// of five such passes shows all five. One pass in four, never two running, is a rare one instead, the two taking turns:
// a big bubble with a small one blown inside it, let out when the big one pops; or a big bubble that freezes, frost
// feathering up its film from below, glitters, and shatters, the pieces falling. The small ones drift up all through,
// as they always have. Every pass starts and ends with the wand off the page and only the small ones up; nothing carries.
// 1.12 b416: the egg. Every twelfth pass (K.egg: three minutes of the list left alone) no wand comes. Among the small ones
// drifting up, a bubble comes up from below the page that is a cube, which no bubble can be: turning slowly, its film
// coloured as every film here is, clear across its faces and bright along its edges, its colours running along them,
// the window caught flat in its faces and slipping from one to the next as it turns. It hangs in the open a while; then
// it gives in — its faces swell and its edges round off until it is a ball, wobbling as it settles, an ordinary bubble
// after all, the window bowed round it like the rest — its film thins at the top, and it pops.
export default function bubbles(K) {
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  // a soap film's colour for each thickness (nm, in steps of 2): reflectance sin²(2πnd/λ) at each wavelength, weighed
  // into red, green and blue and pushed a little brighter; the fourth byte is how much light comes back at all
  const FILM = new Uint8ClampedArray(600 * 4);
  for (let i = 0; i < 600; i++) {
    const d = i * 2, c = [0, 0, 0], w = [0, 0, 0];
    for (let l = 400; l <= 700; l += 6) { const R = Math.sin(TAU * 1.33 * d / l) ** 2, k = [Math.exp(-(((l - 602) / 40) ** 2)) + .3 * Math.exp(-(((l - 445) / 24) ** 2)), Math.exp(-(((l - 548) / 42) ** 2)), Math.exp(-(((l - 452) / 30) ** 2))]; for (let j = 0; j < 3; j++) { c[j] += k[j] * R; w[j] += k[j]; } }
    const m = (c[0] / w[0] + c[1] / w[1] + c[2] / w[2]) / 3;
    for (let j = 0; j < 3; j++) FILM[i * 4 + j] = Math.round(255 * Math.pow(clamp(m + (c[j] / w[j] - m) * 2.3), .85));
    FILM[i * 4 + 3] = Math.round(255 * m);
  }
  /** a bubble's film, N across, into `im`: thicker low down where it drains, swirling as t goes round (a full turn loops),
   *  thinned from the top by `thin` (to gold, to nothing); seen slant at the rim, and brighter there */
  const film = (im, N, t, thin = 0) => {
    const d = im.data, h = (N - 1) / 2; d.fill(0);
    for (let j = 0; j < N; j++) { const v = (j - h) / h; for (let i = 0; i < N; i++) {
      const u = (i - h) / h, rr = Math.hypot(u, v); if (rr >= 1) continue;
      const a = u * 2.6 + .8 * Math.sin(v * 3.4 + t), b = v * 2.3 + .8 * Math.sin(u * 3.1 - t), sw = Math.sin(a * 2.6 + Math.sin(b * 2.1 + t) * 1.7) + .55 * Math.sin(b * 3.7 - a * 1.5 + 2 * t);
      const th = (520 + 170 * v + 150 * sw) * (1 - thin * clamp(.8 - v * 1.2)) * Math.sqrt(1 - rr * rr / 1.77), k = clamp(Math.round(th / 2), 0, 599) * 4;
      const al = clamp((.05 + .85 * rr ** 3.2) * (.3 + 1.1 * FILM[k + 3] / 255)) * clamp(th / 70) * clamp((1 - rr) * h);
      const o = (j * N + i) * 4; d[o] = FILM[k]; d[o + 1] = FILM[k + 1]; d[o + 2] = FILM[k + 2]; d[o + 3] = 255 * al;
    } }
  };
  // the loop: when each beat happens (the wand in and out, the big bubble blown, let go, thinning and popping, the stream)
  const B = { in: [.5, 1.6], blow: [1.8, 4.3], free: 4.3, stream: [6.1, 8.1], out: [8.5, 9.7], thin: [9.4, 10.9], pop: 10.9 };
  // 1.12 b369: the forever cycle. The wand's colours (the signature's pink first: its dark, its body, its shine), the
  // frames a wand may have besides the ring (a heart, its point at the handle; a star), and the heart a bubble blown out
  // of a heart-shaped frame is, until it rounds: its radius all the way round, from the top, as big in area as the circle
  const WANDS = [["#A8145A", "#E02A80", "rgba(255,160,205,.8)"], ["#177A60", "#34C29A", "rgba(190,255,232,.85)"], ["#5B35A6", "#8F63E6", "rgba(226,208,255,.85)"], ["#1B64A6", "#3A9AE6", "rgba(200,232,255,.85)"], ["#A8700C", "#E6A92A", "rgba(255,236,186,.85)"], ["#A83A26", "#EE6A4C", "rgba(255,212,198,.85)"]];
  const HPT = Array.from({ length: 240 }, (_, i) => { const u = i / 240 * TAU; return [16 * Math.sin(u) ** 3, 5 * Math.cos(2 * u) - 13 * Math.cos(u) + 2 * Math.cos(3 * u) + Math.cos(4 * u) - 2.5]; });
  const HR = (() => { const pol = HPT.map(([x, y]) => [Math.atan2(x, -y), Math.hypot(x, y)]).sort((a, b) => a[0] - b[0]), at = t => { const a = t > Math.PI ? t - TAU : t; let j = pol.findIndex(p => p[0] >= a); if (j <= 0) j = j < 0 ? 0 : 1; const p = pol[j - 1] || pol[pol.length - 1], q = pol[j]; return lerp(p[1], q[1], clamp((a - p[0]) / ((q[0] - p[0]) || 1))); }, r = Array.from({ length: 48 }, (_, i) => at(i / 48 * TAU)), m = Math.sqrt(r.reduce((s, v) => s + v * v, 0) / 48); return r.map(v => v / m); })();
  const FRAME = { heart: HPT.filter((_, i) => i % 8 === 0).map(([x, y]) => [y / 14.5, x / 16]), star: Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU, k = i % 2 ? .46 : 1; return [Math.cos(a) * k, Math.sin(a) * k]; }) };
  const HEADS = ["double", "heart", "foam", "vortex", "train"], rareAt = p => K.bag(p, 4, 21) === 2; // a rare pass: one in every four, never two running
  /** pass `P`'s plan (pass 0 is the signature, B): what its wand blows — two bubbles that join, a heart that rounds, a raft
   *  of foam, a stream a breeze whirls away, a chain — or, about once in eight passes each, a bubble with another inside
   *  it, or one that freezes; the wand's colour and frame; when it comes and goes, and when things pop */
  const dealPass = P => {
    let q = P, n = 0; for (let p = 1; p < P; p++) if (rareAt(p)) { q--; n++; } // the pass's own beat is dealt over the passes that have one; the rare two take turns
    const rare = rareAt(P) ? ((n + (K.deal(0, 77)() < .5 ? 1 : 0)) % 2 ? "nest" : "frost") : null;
    const head = rare || HEADS[K.bag(q, HEADS.length, 9)], r = K.deal(P, 41), col = K.bag(P, WANDS.length, 5), frame = head === "heart" ? "heart" : r() < .35 ? "star" : "ring";
    const pl = { P, head, col, frame, spin: r() < .5 ? 1 : -1, win: [.5, 1.6], wout: [8.5, 9.7], sweeps: [], pop: 10.9 };
    if (head === "double") Object.assign(pl, { wout: [6.1, 7.3], side: .3 + r() * .5, popA: 10.1 + r() * .5, popB: 11.8 + r() * .6 });
    else if (head === "heart") Object.assign(pl, { sweeps: [[6.1, 8.1, .42, 1.5]], pop: 10.6 + r() * .6 });
    else if (head === "nest") Object.assign(pl, { wout: [6.4, 7.6], pop: 10.2 + r() * .4, popIn: 12.2 + r() * .6 });
    else if (head === "frost") Object.assign(pl, { wout: [5.2, 6.4], pop: 11.2 + r() * .5 });
    else if (head === "foam") { const d = S.foam.map(([x, y], k) => [Math.hypot(x, y) + r() * .15, k]).sort((a, b) => b[0] - a[0]), fpop = []; d.forEach(([, k], i) => { fpop[k] = 8.2 + i * .3 + r() * .12; }); Object.assign(pl, { sweeps: [[1.8, 3.2, .3, 3]], wout: [4.4, 5.6], fpop }); }
    else if (head === "vortex") Object.assign(pl, { sweeps: [[1.9, 5.4, .3, 2]], wout: [5.8, 7], spop: S.swirl.map(() => r() < .4 ? 6.5 + r() * 5 : 99) });
    else if (head === "train") Object.assign(pl, { sweeps: [[1.9, 4.5, .12, .5]], wout: [5.2, 6.4], chainA: -1.94 + (r() - .5) * .5, cpop: 9.6 + r() * .6 });
    return pl;
  };
  /* ---------------- 1.12 b416: the egg ---------------- */
  // A bubble that is a cube, which no bubble can be. It comes up from below the page among the small ones, turning slowly,
  // its six faces flat and its film coloured as a film is (the same reckoning as every bubble here: the light off its two
  // faces interfering, by how thick it is, drained thicker low down, swirling) — thinner and brighter along its edges,
  // where a real film is drawn into the borders, so its colours run along them; the window shines in its faces, a flat
  // pane of light that slips from one face to the next as it turns. It hangs in the open a while; then it gives in: its
  // faces swell and its edges round off until it is a sphere, wobbling as it settles, an ordinary bubble after all, whose
  // film thins to gold at the top; and it pops. The cube is worked out by tracing a ray from each point of a small image
  // to a box whose edges are rounded (rounded more and more, until it is a ball), its film's colour found where the ray
  // goes in and where it comes out; its edges and outline drawn over it in lines.
  const EGB = { rise: [.35, 4.1], relax: [8.6, 10.3], thin: [10.4, 12.0], pop: 12.0 };
  /** where a ray o + t·d (in the box's own frame, d of unit length) first meets a box of half-size b whose edges are
   *  rounded by r: t, or -1 (Inigo Quilez's rounded-box intersector: the faces, then the edges as cylinders, the corners
   *  as spheres) */
  const rbox = (ox, oy, oz, dx, dy, dz, b, r) => {
    const mx = 1 / dx, my = 1 / dy, mz = 1 / dz, nx = mx * ox, ny = my * oy, nz = mz * oz, kx = Math.abs(mx) * (b + r), ky = Math.abs(my) * (b + r), kz = Math.abs(mz) * (b + r);
    const tN = Math.max(-nx - kx, -ny - ky, -nz - kz), tF = Math.min(-nx + kx, -ny + ky, -nz + kz); if (tN > tF || tF < 0) return -1;
    let t = tN; const px = ox + t * dx, py = oy + t * dy, pz = oz + t * dz, sx = px < 0 ? -1 : 1, sy = py < 0 ? -1 : 1, sz = pz < 0 ? -1 : 1;
    const qx = sx * px - b, qy = sy * py - b, qz = sz * pz - b; if (Math.min(Math.max(qx, qy), Math.max(qy, qz), Math.max(qz, qx)) < 0 || r < 1e-6) return t; // on a face
    const rox = sx * ox - b, roy = sy * oy - b, roz = sz * oz - b, rdx = sx * dx, rdy = sy * dy, rdz = sz * dz, ra2 = r * r; // into the first octant, from the corner
    const ddx = rdx * rdx, ddy = rdy * rdy, ddz = rdz * rdz, odx = rox * rdx, ody = roy * rdy, odz = roz * rdz, oox = rox * rox, ooy = roy * roy, ooz = roz * roz;
    t = 1e20;
    { const B = odx + ody + odz, h = B * B - (oox + ooy + ooz - ra2); if (h > 0) t = -B - Math.sqrt(h); } // the corner
    { const a = ddy + ddz, B = ody + odz, h0 = B * B - a * (ooy + ooz - ra2); if (h0 > 0) { const h = (-B - Math.sqrt(h0)) / a; if (h > 0 && h < t && Math.abs(rox + b + rdx * h) < b) t = h; } } // the edges
    { const a = ddz + ddx, B = odz + odx, h0 = B * B - a * (ooz + oox - ra2); if (h0 > 0) { const h = (-B - Math.sqrt(h0)) / a; if (h > 0 && h < t && Math.abs(roy + b + rdy * h) < b) t = h; } }
    { const a = ddx + ddy, B = odx + ody, h0 = B * B - a * (oox + ooy - ra2); if (h0 > 0) { const h = (-B - Math.sqrt(h0)) / a; if (h > 0 && h < t && Math.abs(roz + b + rdz * h) < b) t = h; } }
    return t > 1e19 ? -1 : t;
  };
  /** a turn, as a matrix (rows): about the vertical first, then tipped toward us by `tip`, then leant by `roll` */
  const turn = (yaw, tip, roll) => { const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(tip), sx = Math.sin(tip), cz = Math.cos(roll), sz = Math.sin(roll);
    const Ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]], Rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]], Rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]], mul = (A2, B2) => A2.map(r2 => [0, 1, 2].map(j => r2[0] * B2[0][j] + r2[1] * B2[1][j] + r2[2] * B2[2][j]));
    return mul(Rz, mul(Rx, Ry)); };

  const S = {
    res: "dpr",
    wash: 1.6, veil: 1, hug: .85, hugFinale: true, // a light kit: the lines and the finale's words sit on pads, and Everything shows the plain ground
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, m = Math.min(W, H), r = rng(41);
      Object.assign(S, { W, H, pr, m, Rmin: pr ? 60 : 80, Rmax: pr ? 170 : 260 });
      if (!S.placed) Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .74 : H * .55, R: pr ? W * .36 : H * .3 }); if (S.vis === undefined) S.vis = 1;
      // the film: six turns of it for the small bubbles, drawn once; the big one's is drawn each frame, as it moves
      S.smalls = Array.from({ length: 6 }, (_, k) => { const [c, x] = canvas(40, 40), im = x.createImageData(40, 40); film(im, 40, k / 6 * TAU); x.putImageData(im, 0, 0); return c; });
      [S.bigC, S.bigX] = canvas(64, 64); S.bigIm = S.bigX.createImageData(64, 64);
      // the window each one shines with: four panes bowed round it up on the left, a fainter one low on the right
      const N = 176, c0 = N / 2, R0 = N / 2 - 2; [S.shine] = canvas(N, N); const x = S.shine.getContext("2d");
      const pane = (a0, a1, r0, r1) => { x.beginPath(); x.arc(c0, c0, R0 * r1, a0, a1); x.arc(c0, c0, R0 * r0, a1, a0, true); x.closePath(); x.fill(); };
      x.shadowColor = "rgba(255,255,255,.9)"; x.shadowBlur = 3.5; x.fillStyle = "rgba(255,255,255,.82)";
      const A0 = -2.64, A1 = -1.8, Am = (A0 + A1) / 2, gp = .035; pane(A0, Am - gp, .5, .64); pane(Am + gp, A1, .5, .64); pane(A0, Am - gp, .67, .82); pane(Am + gp, A1, .67, .82);
      x.shadowBlur = 0; x.fillStyle = "rgba(255,255,255,.42)"; pane(.3, .95, .8, .9);
      const gl = x.createRadialGradient(c0 - R0 * .45, c0 - R0 * .5, 0, c0 - R0 * .45, c0 - R0 * .5, R0 * .55); gl.addColorStop(0, "rgba(255,255,255,.34)"); gl.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gl; x.fillRect(0, 0, N, N);
      // the small bubbles that are always drifting up the page, and the ones the wand streams out
      const nd = pr ? 7 : 10; S.drift = Array.from({ length: nd }, (_, i) => ({ x: (i + .5) / nd + (r() - .5) * .06, y0: r(), R: m * (.02 + r() * .04), v: .045 + r() * .03, sw: .01 + r() * .02, f: .3 + r() * .4, ph: r() * TAU, tex: i % 6, spin: (r() - .5) * .5, pop: null, cyc: -1 }));
      S.stream = Array.from({ length: 14 }, (_, k) => ({ te: B.stream[0] + .1 + k * .13, a: (r() - .5) * .9, v: .8 + r() * .7, R: .12 + r() * .2, pop: 9.2 + k * .34 + r() * .2, tex: k % 6, ph: r() * TAU }));
      S.flurry = Array.from({ length: pr ? 22 : 32 }, () => ({ x: r(), d: r() * .45, R: m * (.016 + r() * .035), top: .1 + r() * .55, sw: (r() - .5) * .08, tex: Math.floor(r() * 6), ph: r() * TAU }));
      S.drops = Array.from({ length: 16 }, (_, k) => ({ a: k / 16 * TAU + (r() - .5) * .5, v: .3 + r() * 1.5, s: .5 + r() * .8 }));
      S.flash = K.glowSpr(48, [255, 255, 255], .7); /* the moment it goes */
      // 1.12 b369: the dealt passes' bubbles, drawn from a sequence of their own: the whirl's stream, the chain, the raft of
      // foam (each one touching those it packs against), the frost's branches (grown from one side, sorted by how far
      // along they are) and the shards it shatters into
      const r2 = rng(1041);
      S.swirl = Array.from({ length: 24 }, (_, k) => { const rad = .64 - .42 * k / 23 + (r2() - .5) * .05; return { te: 2 + k * .135, rad, w: .62 / Math.pow(rad, .85), R: .13 + r2() * .19, tex: k % 6, ph: r2() * TAU }; }); /* the first out circle widest; the inner ones turn faster, so the stream winds into an arm */
      S.chain = [.74, .68, .63, .58, .54];
      S.foam = [[0, 0, .38]]; for (let n = 0; S.foam.length < 13 && n < 600; n++) { const b = S.foam[Math.floor(r2() * S.foam.length)], rr = .24 + r2() * .13, a = r2() * TAU, x = b[0] + Math.cos(a) * (b[2] + rr) * .84, y = b[1] + Math.sin(a) * (b[2] + rr) * .84; if (Math.hypot(x, y) < 1.35 && S.foam.every(f => Math.hypot(f[0] - x, f[1] - y) > (f[2] + rr) * .8)) S.foam.push([x, y, rr]); }
      S.foamPairs = []; S.foam.forEach((f, j) => S.foam.forEach((h, k) => { if (k > j && Math.hypot(f[0] - h[0], f[1] - h[1]) < (f[2] + h[2]) * .97) S.foamPairs.push([j, k]); }));
      S.frost = []; const stem = (x, y, a, len, d, cv) => { for (let s = 0, side = 1; s < len; s += .032, side = -side) { a += cv + (r2() - .5) * .1; const x1 = x + Math.cos(a) * .032, y1 = y + Math.sin(a) * .032; if (Math.hypot(x1, y1) > .98) return; S.frost.push([x, y, x1, y1, d + s]);
          for (const sd of [side, -side]) { if (r2() < .25) continue; const b = a + sd * (.95 + r2() * .2), bl = (.025 + r2() * .045) * (1 - s / len * .6); S.frost.push([x1, y1, x1 + Math.cos(b) * bl, y1 + Math.sin(b) * bl, d + s + bl]); }
          if (r2() < .04) stem(x1, y1, a + (r2() < .5 ? 1 : -1) * .9, len * .45, d + s, -cv); x = x1; y = y1; } };
      for (const [sx, sy] of [[0, .93], [-.52, .76], [.56, .72]]) for (let k = 0; k < 4; k++) stem(sx, sy, -Math.PI / 2 + (k - 1.5) * .55 + (r2() - .5) * .2, 1.5 + r2() * .5, 0, (r2() - .5) * .09);
      S.frost.sort((a, b) => a[4] - b[4]);
      S.shards = Array.from({ length: 18 }, () => { const a = r2() * TAU, d = Math.sqrt(r2()) * .8, x = Math.cos(a) * d, y = Math.sin(a) * d, s = .12 + r2() * .14, p = [0, 1, 2].map(k => { const b = a + k * 2.1 + (r2() - .5); return [Math.cos(b) * s, Math.sin(b) * s]; }).flat(); return { x, y, p, vx: x * (.3 + r2() * .4) + (r2() - .5) * .2, vy: y * (.3 + r2() * .4) - .2, r: (r2() - .5) * 6 }; });
      if (S.air === undefined) S.air = 0;
      // the room: the page's blush, warmer where the light comes in, and a few soft spots of sun
      bg.fillStyle = "#FFF5F8"; bg.fillRect(0, 0, W, H);
      const sun = bg.createRadialGradient(W * .92, H * .02, 0, W * .92, H * .02, Math.hypot(W, H) * .75); sun.addColorStop(0, "rgba(255,212,170,.75)"); sun.addColorStop(.45, "rgba(255,200,218,.4)"); sun.addColorStop(1, "rgba(240,180,212,.5)"); bg.fillStyle = sun; bg.fillRect(0, 0, W, H);
      const low = bg.createLinearGradient(0, H * .55, 0, H); low.addColorStop(0, "rgba(232,150,196,0)"); low.addColorStop(1, "rgba(232,150,196,.28)"); bg.fillStyle = low; bg.fillRect(0, 0, W, H);
      for (let k = 0; k < (pr ? 5 : 8); k++) { const bx = W * (.55 + r() * .45), by = H * r(), br = m * (.06 + r() * .1), c = [[255, 214, 170], [236, 200, 255], [255, 190, 215], [205, 228, 255]][k % 4], gr = bg.createRadialGradient(bx, by, 0, bx, by, br); gr.addColorStop(0, `rgba(${c},.34)`); gr.addColorStop(.7, `rgba(${c},.2)`); gr.addColorStop(1, `rgba(${c},0)`); bg.fillStyle = gr; bg.fillRect(bx - br, by - br, br * 2, br * 2); }
      S.fit();
    },
    /** where the wand and the big bubble go, in the room the words leave (words, below) */
    fit() { const { cx, cy, R, pr } = S; S.Rr = clamp(R * .32, pr ? 22 : 30, pr ? 54 : 84); S.ring = [cx + R * .12, cy + R * .5 - S.Rr * .3]; S.home = [cx - R * .08, cy - R * .12]; },
    /** where the words are (scenes.js): find the largest circle of empty page, clear of the words, the edges and the
     *  footer's pool; the wand and the big bubble go there, as big as the room allows, and glide there when it moves */
    words(rects) {
      S.wr = rects.map(([x0, y0, x1, y1]) => [x0 - 6, y0 - 4, x1 + 6, y1 + 4]);
      const { W, H, pr } = S; if (!W) return; const gap = pr ? 12 : 22, top = pr ? 12 : 20, foot = H - (pr ? 96 : 104);
      let best = 0, bx = S.cx, by = S.cy;
      for (let gy = 0; gy <= 24; gy++) for (let gx = 0; gx <= 32; gx++) {
        const x = W * (.04 + .92 * gx / 32), y = top + (foot - top) * gy / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y);
        for (const [x0, y0, x1, y1] of rects) { const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1); rad = Math.min(rad, Math.hypot(dx, dy) - gap); if (rad <= best) break; }
        if (rad > best) { best = rad; bx = x; by = y; }
      }
      Object.assign(S, { tx: bx, ty: by, tR: clamp(best, S.Rmin, S.Rmax), room: best >= S.Rmin ? 1 : 0 }); if (!S.placed) { S.cx = bx; S.cy = by; S.R = S.tR; S.placed = true; S.fit(); }
    },
    /** where the wand and the big bubble are (the stage's `spot`), or nothing while there's no room for them */
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    /** 1 clear of the words, down to a trace behind them: a bubble drifting past a word fades there */
    shade(x, y, r) { let d = 1e9; for (const [x0, y0, x1, y1] of S.wr || []) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))); return lerp(.15, 1, clamp((d - r * .2) / (r + 8))); },
    /** a dealt pass (1.12 b369): the wand in the pass's colour and frame, and the pass's own bubbles out of it */
    pass2(T, I, A, pl, bubble, pop, on, V) {
      const { W, Rr, ring, home, R } = S, L = Rr * 4.4, hyp = Math.hypot(L, L * .2), bt = on ? T : 0, hd = pl.head;
      /** where the wand is at loop time t: in and out when the pass says, swept when it says */
      const wandAt = t => { const off = W - ring[0] + Rr * 6, wx = ring[0] + (on ? off * (1 - seg(t, pl.win[0], pl.win[1], E.back) + seg(t, pl.wout[0], pl.wout[1], E.in)) : off);
        let sweep = 0; for (const [t0, t1, amp, cyc] of pl.sweeps) sweep += env(t, t0, t0 + .4, t1 - .4, t1, E.sine) * Math.sin((t - t0) / (t1 - t0) * TAU * cyc) * amp;
        const tilt = -.12 + sweep, pivot = [wx + L, ring[1] + L * .2], ang = Math.atan2(-L * .2, -L) + sweep;
        return { wx, pivot, rx: pivot[0] + Math.cos(ang) * hyp, ry: pivot[1] + Math.sin(ang) * hyp, tilt, dir: [Math.sin(tilt), -Math.cos(tilt)] }; };
      /** a bubble blown out of the wand from b0 to b1 and let go at fr, `ce` rings deep: on the wand, or free and where from */
      const blowAt = (b0, b1, fr, ce) => { if (bt <= b0) return null;
        if (bt < fr) { const wa = wandAt(bt), grow = seg(bt, b0, b1, E.sine), c = lerp(-2.4, ce, grow) * Rr + Math.sin(A * 7) * Rr * .05 * grow, Rb = Math.hypot(Rr, c); return { on: true, wa, c, Rb, neck: seg(bt, fr - .45, fr, E.in) * (Rb - c) }; }
        const wf = wandAt(fr), c1 = ce * Rr, since = bt - fr; return { on: false, since, p0: [wf.rx + wf.dir[0] * c1, wf.ry + wf.dir[1] * c1], R1: Math.hypot(Rr, c1) * lerp(1, .92, E.out(clamp(since / .35))) }; };
      /** the part of a bubble on the wand beyond the frame's plane, its neck pinching as it's let go; heart-shaped if `hs` */
      const attached = (st, tex, hs) => { const { wa, c, Rb, neck } = st, dir = wa.dir, ccx = wa.rx + dir[0] * c, ccy = wa.ry + dir[1] * c, bx0 = wa.rx - dir[0] * neck, by0 = wa.ry - dir[1] * neck;
        g.save(); g.globalAlpha = V; g.beginPath(); const nx = -dir[1], ny = dir[0], Lb = Rb * 3; g.moveTo(bx0 + nx * Lb, by0 + ny * Lb); g.lineTo(bx0 - nx * Lb, by0 - ny * Lb); g.lineTo(bx0 - nx * Lb + dir[0] * Lb, by0 - ny * Lb + dir[1] * Lb); g.lineTo(bx0 + nx * Lb + dir[0] * Lb, by0 + ny * Lb + dir[1] * Lb); g.closePath(); g.clip();
        if (hs) S.shaped(ccx, ccy, Rb, tex, V, 0, 0); else bubble(ccx, ccy, Rb, tex, 0, 0, V); g.restore(); };
      /** where a bubble let go floats: toward `to`, bobbing, and lifting a little as it waits */
      const float = (st, to, lift = 0) => { const go = E.out(clamp(st.since / 2.6)); return [lerp(st.p0[0], to[0], go) + Math.sin(A * .6) * R * .06 * go, lerp(st.p0[1], to[1], go) + Math.sin(A * .47 + 1) * R * .04 * go - lift * R * .12]; };
      const wob = st => Math.exp(-st.since * 2.2) * .14 * Math.sin(st.since * 13) + Math.sin(A * 3.1) * .012;
      // the big film, swirling, redrawn about fifteen times a second as the signature's is (only while a big bubble is up)
      const big = hd === "double" || hd === "heart" || hd === "nest" || hd === "frost", filmT = A * .35, thin = hd === "heart" || hd === "nest" ? seg(bt, 9.4, pl.pop, E.in) : 0;
      if (on && big && bt > 1.8 && bt < 13 && (S.filmAt === undefined || Math.abs(filmT - S.filmAt) > .02 || Math.abs(thin - S.thinAt) > .02)) { film(S.bigIm, 64, filmT, thin); S.bigX.putImageData(S.bigIm, 0, 0); S.filmAt = filmT; S.thinAt = thin; }
      let flat = 1; // the film across the wand's frame, gone while a bubble is blown out of it
      if (!on) { /* the list is in use: nothing of the pass's own is up */ }
      else if (hd === "double") { // two bubbles blown in turn; the second floats to the first and they join, a wall between them; one pops, the other snaps round
        const a = blowAt(1.8, 3.3, 3.4, .95), b = blowAt(3.8, 5.3, 5.4, .6), gap = (t0, t1) => bt > t0 && bt < t1 + .25 ? (bt < t1 ? 0 : (bt - t1) / .25) : 1;
        flat = Math.min(gap(1.8, 3.4), gap(3.8, 5.4));
        let pa = null, pb = null, ra = 0, rb = 0; const drift = [Math.sin(A * .37) * R * .04, -seg(bt, 7, 12.5, E.sine) * R * .14];
        if (a && a.on) attached(a, S.bigC); else if (a) { pa = float(a, [home[0] - R * .2, home[1]]); ra = a.R1; }
        if (b && b.on) attached(b, S.bigC); else if (b) { rb = b.R1; const to = [pa[0] + (ra + rb) * .74 * Math.cos(pl.side), pa[1] + (ra + rb) * .74 * Math.sin(pl.side)], go = E.io(clamp(b.since / 1.4)); pb = [lerp(b.p0[0], to[0], go), lerp(b.p0[1], to[1], go)]; }
        if (pa) { pa[0] += drift[0]; pa[1] += drift[1]; } if (pb) { pb[0] += drift[0]; pb[1] += drift[1]; }
        const joined = pb && b.since > 1.25, bump = joined ? Math.exp(-(b.since - 1.25) * 3.5) * .09 * Math.sin((b.since - 1.25) * 15) : 0, snap = bt > pl.popA ? Math.exp(-(bt - pl.popA) * 3.2) * .16 * Math.sin((bt - pl.popA) * 15) : 0;
        const meet = pa && pb && bt < pl.popA && Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) < ra + rb; // joined: each film stops at the wall between them
        if (pb && bt < pl.popB + .1) { g.save(); if (meet) S.side(pb, pa, ra, rb); bubble(pb[0], pb[1], rb, S.bigC, 2.1, (b.since < 1.25 ? wob(b) : bump) + snap, V, clamp((bt - pl.popB) / .1), -2.2); g.restore(); }
        if (pa && bt < pl.popA + .1) { g.save(); if (meet) S.side(pa, pb, rb, ra); bubble(pa[0], pa[1], ra, S.bigC, 0, (a.since < 1.25 ? wob(a) : 0) - bump, V, clamp((bt - pl.popA) / .1), 2.6); g.restore(); }
        if (meet) S.wall(pa, ra, pb, rb, V);
        if (pa && bt >= pl.popA) pop(pa[0], pa[1], ra, bt - pl.popA, V);
        if (pb && bt >= pl.popB) pop(pb[0], pb[1], rb, bt - pl.popB, V);
      } else if (hd === "heart" || hd === "nest" || hd === "frost") { // one big bubble blown and let go to hang in the room: heart-shaped until it rounds; with one inside it; or frozen
        const h = blowAt(1.8, 4.3, 4.3, 1.25); flat = bt < 1.8 || bt > 4.55 ? 1 : bt > 4.3 ? (bt - 4.3) / .25 : 0;
        if (h && h.on) attached(h, S.bigC, hd === "heart");
        else if (h) {
          const p = float(h, home, seg(bt, 7, pl.pop, E.sine)), tear = clamp((bt - pl.pop) / .1), w = wob(h);
          if (hd === "heart" && h.since < 1.6) S.shaped(p[0], p[1], h.R1, S.bigC, V, E.out(clamp(h.since / 1.5)), w);
          else if (hd === "frost") S.frosty(p[0], p[1], h.R1, bt, V, pl, A);
          else bubble(p[0], p[1], h.R1, S.bigC, 0, w, V, tear, -1.9);
          if (hd === "nest") S.inner(p, h.R1, bt, A, V, pl, bubble, pop);
          if (hd !== "frost" && bt >= pl.pop) pop(p[0], p[1], h.R1, bt - pl.pop, V);
        }
        // the heart pass pours a stream as the signature does, the wand sweeping
        if (hd === "heart") for (const s of S.stream) { const age = bt - s.te; if (age < 0) continue;
          const w0 = wandAt(s.te), Rs = s.R * Rr, sp = Rr * 3.2 * s.v, a0 = w0.tilt + s.a - Math.PI / 2, far = (1 - Math.exp(-age * 1.8)) / 1.8, x = w0.rx + Math.cos(a0) * sp * far + Math.sin(A * .9 + s.ph) * Rr * .3 * clamp(age), y = w0.ry + Math.sin(a0) * sp * far - age * Rr * .35;
          if (bt < s.pop) bubble(x, y, Rs, S.smalls[s.tex], A * .4 + s.ph, Math.sin(A * 6 + s.ph) * .04, V * clamp(age * 6) * S.shade(x, y, Rs)); else pop(x, y, Rs, bt - s.pop, V); }
      } else if (hd === "foam") { // a shake of the wand throws out a flurry that packs into a raft of foam, drifts, and pops away from its edge in
        flat = bt < 1.9 || bt > 3.4 ? 1 : 0;
        const c0 = wandAt(2.3), to = [home[0] + R * .05, home[1] + R * .02], go = E.io(clamp((bt - 2.2) / 2.8)), rot = (bt - 2) * .09 * pl.spin;
        const cen = [lerp(c0.rx + c0.dir[0] * Rr * 1.7, to[0], go) + Math.sin(A * .5) * R * .03, lerp(c0.ry + c0.dir[1] * Rr * 1.7, to[1], go) - seg(bt, 5, 13, E.sine) * R * .15];
        const pos = S.foamPos = S.foamPos || S.foam.map(() => [0, 0, 0, 0]);
        S.foam.forEach((f, k) => { const tb = 1.95 + k * .09, e = E.out(clamp((bt - tb) / .75)), wk = wandAt(tb), cs = Math.cos(rot), sn = Math.sin(rot), sx = cen[0] + (f[0] * cs - f[1] * sn) * Rr, sy = cen[1] + (f[0] * sn + f[1] * cs) * Rr;
          pos[k][0] = lerp(wk.rx, sx, e); pos[k][1] = lerp(wk.ry, sy, e); pos[k][2] = f[2] * Rr * clamp((bt - tb) / .3); pos[k][3] = bt > tb ? pl.fpop[k] : -1; });
        S.foam.forEach((f, k) => { const [x, y, r, pk] = pos[k]; if (pk < 0) return; if (bt < pk) bubble(x, y, r, S.smalls[k % 6], A * .3 + k, Math.sin(A * 4 + k) * .025, V * S.shade(x, y, r), clamp((bt - pk) / .1), k); else pop(x, y, r, bt - pk, V); });
        S.foamWalls(pos, bt, V);
      } else if (hd === "vortex") { // the wand sweeps a long stream that a breeze curls into a whirl and carries away off the edge
        const v0 = [home[0] + R * .08, home[1] - R * .1], vcAt = t => [v0[0] + seg(t, 6.4, 12.6, E.in) * (W - v0[0] + R * 1.6), v0[1] - seg(t, 6.4, 12.6, E.sine) * R * .35], vc = vcAt(bt);
        S.swirl.forEach((s, k) => { const age = bt - s.te, pk = pl.spop[k]; if (age < 0 || bt > pk + .5) return;
          const w0 = wandAt(s.te), l0 = [w0.rx + w0.dir[0] * Rr * .6, w0.ry + w0.dir[1] * Rr * .6], c0 = vcAt(s.te), r0 = Math.hypot(l0[0] - c0[0], (l0[1] - c0[1]) / .7), a0 = Math.atan2((l0[1] - c0[1]) / .7, l0[0] - c0[0]);
          const rr = lerp(r0, s.rad * R, E.out(clamp(age / 1.6))), an = a0 + pl.spin * s.w * age, x = vc[0] + Math.cos(an) * rr, y = vc[1] + Math.sin(an) * rr * .7 - age * R * .025, Rs = s.R * Rr; // the whirl lifts them a little as it turns
          if (bt < pk) bubble(x, y, Rs * clamp(age * 5), S.smalls[s.tex], A * .5 + s.ph, Math.sin(A * 5 + s.ph) * .04, V * S.shade(x, y, Rs)); else pop(x, y, Rs, bt - pk, V); });
      } else if (hd === "train") { // a chain of bubbles blown one onto the next, let go, wriggling, and popping one after another down its length
        const N = S.chain.length, tb = j => 1.9 + j * .42, tf = tb(N) + .1; flat = bt < 1.9 || bt > tf + .25 ? 1 : 0;
        const wf = wandAt(Math.min(bt, tf)), free = clamp((bt - tf) / 2.8), go = E.io(free);
        const fit = Math.min(1, R * 1.45 / (S.chain.reduce((s, r) => s + r, 0) * Rr * 1.72)), half = S.chain.reduce((s, r) => s + r, 0) * Rr * .8 * fit, anchor = [lerp(wf.rx + wf.dir[0] * Rr * .7, home[0] - Math.cos(pl.chainA) * half, go), lerp(wf.ry + wf.dir[1] * Rr * .7, home[1] - Math.sin(pl.chainA) * half, go) - seg(bt, 6, 13, E.sine) * R * .12], swing = go * Math.sin(A * .5) * .12; // once let go, its middle floats to the middle of the room
        const ca = Math.cos(pl.chainA + swing), sa = Math.sin(pl.chainA + swing), pts = [];
        let s0 = 0; for (let j = N - 1; j >= 0; j--) { const born = bt - tb(j); if (born < 0) { pts[j] = null; continue; } const r = S.chain[j] * Rr * fit * clamp(born / .35); s0 += j === N - 1 || !pts[j + 1] ? r : (pts[j + 1][2] + r) * .8; const wig = Math.sin(A * 2.6 - j * .9) * Rr * .14 * go; pts[j] = [anchor[0] + ca * s0 - sa * wig, anchor[1] + sa * s0 + ca * wig, r, pl.cpop + j * .24]; }
        for (let j = 0; j < N; j++) { const p = pts[j]; if (!p) continue; if (bt < p[3]) bubble(p[0], p[1], p[2], S.smalls[(j + 2) % 6], A * .3 + j, Math.sin(A * 4.2 + j) * .03, V * S.shade(p[0], p[1], p[2]), clamp((bt - p[3]) / .1), j * 1.3); else pop(p[0], p[1], p[2], bt - p[3], V); }
        for (let j = 0; j < N - 1; j++) { const p = pts[j], q = pts[j + 1]; if (p && q && bt < Math.min(p[3], q[3])) S.wall(p, p[2], q, q[2], V); }
      }
      // the wand over them, in the pass's colour, its frame a ring, a star or a heart
      const wa = wandAt(bt); if (on && wa.wx < W + Rr * 2) S.wand2(wa, pl, flat, V);
    },
    /** 1.12 b416: the egg's cube at T: where it is, how big, how it's turned, how far it has rounded (0 a cube … 1 a ball),
     *  its wobble, how thin its film has worn at the top; null when it's gone */
    cubeAt(T, A, P) {
      if (T < EGB.rise[0] || T > EGB.pop + .5) return null;
      const r = K.deal(P, 97), spin = r() < .5 ? 1 : -1, yaw0 = r() * TAU, { home, R, H } = S, a = clamp(R * .4, 34, 84), s = seg(T, EGB.relax[0], EGB.relax[1], E.io);
      const up = E.out(seg(T, EGB.rise[0], EGB.rise[1], x => x)), y = lerp(H + a * 2.4, home[1] + R * .06, up) - seg(T, EGB.rise[1], EGB.pop, E.sine) * R * .12 + Math.sin(A * .47 + 1) * R * .03 * up, x = home[0] + Math.sin(A * .6) * R * .05 * up;
      const set = T > EGB.relax[1] - .25 ? T - EGB.relax[1] + .25 : -1, shiver = env(T, EGB.relax[0] - .5, EGB.relax[0] - .4, EGB.relax[0] - .2, EGB.relax[0] - .05) * Math.sin(T * 42) * .03; // a shiver as if caught at it; then it settles, jelly-like, as it rounds
      const wob = shiver + (set > 0 ? Math.exp(-set * 3.2) * .1 * Math.sin(set * 13) : 0) + Math.sin(A * 3.1) * .01 * s;
      return { x, y, a, s, wob, rot: turn(yaw0 + spin * (T * .34 + .25 * Math.sin(T * .5)), .56 + .1 * Math.sin(T * .63), .1 * Math.sin(T * .41 + 1)), thin: seg(T, EGB.thin[0], EGB.thin[1], E.in), ts: T * .9 };
    },
    /** the cube's film, traced: a small image, `N` across, of the cube (or the rounded box it's becoming) as the film's
     *  colour where each ray goes in and where it comes out, the window's panes caught in it */
    cubeImg(c, N) {
      const L = S.cubeL || (S.cubeL = (() => { const [cv2, x2] = canvas(N, N); return { cv: cv2, x: x2, im: x2.createImageData(N, N) }; })());
      const { a, s, rot: M, thin, ts } = c, b = a * (1 - s), ext = Math.sqrt(3) * b + a * 1.2407 * s + 3, rr = a * 1.2407 * s + ext * 1.4 / N, d = L.im.data, half = N / 2; d.fill(0); L.ext = ext; // (traced a hair fat: the outline's clip trims it)
      const dx = M[2][0], dy = M[2][1], dz = M[2][2], fz = Math.max(dx * dx, dy * dy, dz * dz) > .999 ? 1e-4 : 0; // the view's way in the cube's own frame (never exactly along an axis)
      const shadeAt = (px2, py2, pz2, wy, back) => { // the film at a point of the box (its own frame): its colour [r,g,b] and how much light it sends back
        let nx2 = Math.abs(px2) - b, ny2 = Math.abs(py2) - b, nz2 = Math.abs(pz2) - b; nx2 = Math.max(nx2, 0) * Math.sign(px2); ny2 = Math.max(ny2, 0) * Math.sign(py2); nz2 = Math.max(nz2, 0) * Math.sign(pz2);
        let nl = Math.hypot(nx2, ny2, nz2); if (nl < 1e-6) { const m2 = Math.max(Math.abs(px2), Math.abs(py2), Math.abs(pz2)); nx2 = Math.abs(px2) === m2 ? Math.sign(px2) : 0; ny2 = nx2 ? 0 : Math.abs(py2) === m2 ? Math.sign(py2) : 0; nz2 = nx2 || ny2 ? 0 : Math.sign(pz2); nl = 1; }
        nx2 /= nl; ny2 /= nl; nz2 /= nl;
        const Nx = M[0][0] * nx2 + M[0][1] * ny2 + M[0][2] * nz2, Ny = M[1][0] * nx2 + M[1][1] * ny2 + M[1][2] * nz2, Nz = (M[2][0] * nx2 + M[2][1] * ny2 + M[2][2] * nz2) * (back ? -1 : 1), cs = Math.min(1, Math.abs(Nz));
        const u = px2 / a, v = py2 / a, w = pz2 / a, au = Math.abs(u), av = Math.abs(v), aw = Math.abs(w), mx2 = Math.max(au, av, aw), edge = 1 - Math.min(1, mx2 === au ? Math.max(av, aw) : mx2 === av ? Math.max(au, aw) : Math.max(au, av)); // how near an edge, across the face it's on
        const sw = Math.sin(u * 2.6 + .8 * Math.sin(v * 3.4 + ts) + w * 1.3) + .55 * Math.sin(w * 3.1 - u * 1.5 + 2 * ts + v), vy = clamp(wy / (a * 1.6), -1, 1), near = Math.exp(-edge * 4.5) * (1 - s);
        const th = (520 + 160 * vy + 140 * sw + 120 * near * Math.sin((u + v + w) * 4 - ts * 2.6)) * (1 - .45 * near) * (1 - thin * clamp(.8 - vy * 1.2)), te = th * Math.sqrt(1 - (1 - cs * cs) / 1.77), k = clamp(Math.round(te / 2), 0, 599) * 4;
        const al = clamp((.07 + .78 * Math.pow(1 - cs, 1.6)) * (.3 + 1.05 * FILM[k + 3] / 255) * (back ? .6 : 1) + near * .4 + s * .06 * Math.pow(1 - cs, 3)) * clamp(th / 70); // clear across a face, bright where it's seen slant and along its edges
        const cr = FILM[k], cg = FILM[k + 1], cb = FILM[k + 2];
        return [cr, cg, cb, al]; };
      for (let j = 0; j < N; j++) { const wy = (j + .5 - half) / half * ext; for (let i = 0; i < N; i++) {
        const wx = (i + .5 - half) / half * ext; if (wx * wx + wy * wy > ext * ext) continue;
        const ox = M[0][0] * wx + M[1][0] * wy - dx * ext * 2, oy = M[0][1] * wx + M[1][1] * wy - dy * ext * 2, oz = M[0][2] * wx + M[1][2] * wy - dz * ext * 2; // the ray, in the cube's frame
        const tf = rbox(ox, oy, oz, dx + fz, dy + fz, dz + fz, b, rr); if (tf < 0) continue;
        const f = shadeAt(ox + dx * tf, oy + dy * tf, oz + dz * tf, wy, false), ex = ox + dx * ext * 4, ey = oy + dy * ext * 4, ez = oz + dz * ext * 4, tb = rbox(ex, ey, ez, -dx - fz, -dy - fz, -dz - fz, b, rr);
        const bk = tb < 0 ? [0, 0, 0, 0] : shadeAt(ex - dx * tb, ey - dy * tb, ez - dz * tb, wy, true), A2 = f[3] + bk[3] * (1 - f[3]); if (A2 <= .002) continue;
        const o = (j * N + i) * 4; for (let q = 0; q < 3; q++) d[o + q] = (f[q] * f[3] + bk[q] * bk[3] * (1 - f[3])) / A2; d[o + 3] = 255 * A2; } }
      L.x.putImageData(L.im, 0, 0); return L;
    },
    /** 1.12 b416: the egg's pass (see EGB): the small ones drifting up as always, and the cube */
    eggCube(T, I, A, P, pop, on, V) {
      const c = on ? S.cubeAt(T, A, P) : null; if (!c) return;
      const { x, y, a, s, wob, rot: M } = c, rs = a * 1.2407, tear = clamp((T - EGB.pop) / .1), sh = V * S.shade(x, y, a * 1.4);
      if (T >= EGB.pop) pop(x, y, rs * (1 + wob), T - EGB.pop, V);
      if (tear >= 1) return;
      const key = Math.round(T * (s > 0 && s < 1 ? 30 : 15)) + ":" + P + ":" + Math.round(a), N = 80; // (a trace of 80: 96 cost the pass 9 % of a core against the others' 4)
      if (S.cubeK !== key) { S.cubeImg(c, N); S.cubeK = key; }
      const L = S.cubeL, ext = L.ext, b = a * (1 - s), rr = rs * s, P3 = (u, v, w) => [M[0][0] * u + M[0][1] * v + M[0][2] * w, M[1][0] * u + M[1][1] * v + M[1][2] * w, M[2][0] * u + M[2][1] * v + M[2][2] * w];
      // its outline: the hull of the box's corners, rounded out by its rounding
      const hull = []; for (const u of [-1, 1]) for (const v of [-1, 1]) for (const w of [-1, 1]) { const q = P3(u * b, v * b, w * b); hull.push([q[0], q[1]]); }
      hull.sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]), lo = [], hi = [];
      for (const p of hull) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
      for (const p of [...hull].reverse()) { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
      const H2 = lo.slice(0, -1).concat(hi.slice(0, -1)), rim = new Path2D();
      if (H2.length < 3 || b < .4) rim.arc(0, 0, Math.max(rr, b), 0, TAU); // a ball by now (its corners all but met)
      else if (rr < .5) H2.forEach(([u, v], i) => i ? rim.lineTo(u, v) : rim.moveTo(u, v)); else H2.forEach((p, i) => { const q = H2[(i + 1) % H2.length], o = H2[(i + H2.length - 1) % H2.length], a0 = Math.atan2(o[0] - p[0], p[1] - o[1]), a1 = Math.atan2(p[0] - q[0], q[1] - p[1]); let da = a1 - a0; while (da < 0) da += TAU; rim.arc(p[0], p[1], rr, a0, a0 + da); });
      rim.closePath();
      g.save(); g.translate(x, y); g.scale(1 + wob, 1 - wob * .9); g.globalAlpha = sh;
      if (tear > 0) { const hx = Math.cos(-1.9) * rs, hy = Math.sin(-1.9) * rs; g.beginPath(); g.arc(0, 0, ext + 2, 0, TAU); g.moveTo(hx + tear * 2.2 * rs, hy); g.arc(hx, hy, tear * 2.2 * rs, 0, TAU, true); g.clip("evenodd"); } // torn open from the top as it pops
      g.save(); g.clip(rim); g.imageSmoothingEnabled = true; g.drawImage(L.cv, -ext, -ext, ext * 2, ext * 2);
      // the window, caught flat in each face that turns to it: four panes lying on the face, sliding across it as it turns
      const fk = Math.pow(1 - s, 2); if (fk > .01) for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) {
        const n = [0, 0, 0]; n[ax] = sg; const N3 = P3(...n); if (N3[2] > -.12) continue;
        const j = (ax + 1) % 3, k2 = (ax + 2) % 3, e1 = [0, 0, 0], e2 = [0, 0, 0], o = [0, 0, 0]; e1[j] = b; e2[k2] = b; o[ax] = sg * b;
        const C = P3(...o), U = P3(...e1), V2 = P3(...e2), rx = -2 * N3[2] * N3[0], ry = -2 * N3[2] * N3[1], dxw = rx + .49, dyw = ry + .57, det = U[0] * V2[1] - U[1] * V2[0]; if (Math.abs(det) < 1e-3) continue;
        const sx2 = -dxw * a * 1.3, sy2 = -dyw * a * 1.3, u0 = (sx2 * V2[1] - sy2 * V2[0]) / det, v0 = (U[0] * sy2 - U[1] * sx2) / det, lit = clamp(1 - Math.hypot(dxw, dyw) * 1.1) * fk * clamp((-N3[2] - .12) * 3);
        if (lit < .02) continue;
        g.save(); g.beginPath(); for (const [p2, q2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.lineTo(C[0] + U[0] * p2 + V2[0] * q2, C[1] + U[1] * p2 + V2[1] * q2); g.closePath(); g.clip();
        g.fillStyle = `rgba(255,255,255,${(.78 * lit).toFixed(3)})`; g.shadowColor = "rgba(255,255,255,.9)"; g.shadowBlur = 3 * px;
        for (const pu of [-1, 1]) for (const pv of [-1, 1]) { const cu = u0 + pu * .17, cv = v0 + pv * .21, hu = .14, hv = .18; g.beginPath(); for (const [p2, q2] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.lineTo(C[0] + U[0] * (cu + p2 * hu) + V2[0] * (cv + q2 * hv), C[1] + U[1] * (cu + p2 * hu) + V2[1] * (cv + q2 * hv)); g.closePath(); g.fill(); }
        g.restore(); }
      if (s > .01) { g.globalAlpha = sh * s * s; g.drawImage(S.shine, -rs, -rs, 2 * rs, 2 * rs); g.globalAlpha = sh; } // round now: the window bowed round it, as in every bubble
      g.restore();
      // its edges, where its faces meet (fading as they round off), and its outline
      const ek = Math.pow(1 - s, 1.6); if (ek > .01) for (let ax = 0; ax < 3; ax++) for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
        const j = (ax + 1) % 3, k = (ax + 2) % 3, n = [0, 0, 0], p0 = [0, 0, 0], p1 = [0, 0, 0]; n[j] = s1 * Math.SQRT1_2; n[k] = s2 * Math.SQRT1_2;
        for (const [p, e] of [[p0, -1], [p1, 1]]) { p[ax] = e * b; p[j] = s1 * b + n[j] * rr; p[k] = s2 * b + n[k] * rr; }
        const nz = P3(n[0], n[1], n[2])[2], front = nz < .05, q0 = P3(...p0), q1 = P3(...p1);
        g.lineCap = "round"; g.lineWidth = clamp(a * .028, .8, 2.2); g.strokeStyle = `rgba(160,64,112,${((front ? .32 : .14) * ek).toFixed(3)})`; g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.stroke();
        g.lineWidth *= .5; g.strokeStyle = `rgba(255,246,252,${((front ? .9 : .4) * ek).toFixed(3)})`; g.stroke(); }
      g.lineWidth = clamp(rs * .02, .6, 1.6); g.strokeStyle = "rgba(160,64,112,.3)"; g.stroke(rim);
      g.restore();
    },
    /** the wall between two bubbles joined: an arc across where they meet, bowed into the bigger one */
    wall(pa, ra, pb, rb, V) {
      const dx = pb[0] - pa[0], dy = pb[1] - pa[1], d = Math.hypot(dx, dy); if (d >= ra + rb || d <= Math.abs(ra - rb) || d < 1) return;
      const a = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - a * a)), mx = pa[0] + dx * a / d, my = pa[1] + dy * a / d, nx = -dy / d, ny = dx / d, p1 = [mx + nx * h, my + ny * h], p2 = [mx - nx * h, my - ny * h];
      g.save(); g.globalAlpha = V; g.lineCap = "round"; g.beginPath();
      if (Math.abs(ra - rb) < 1.5) { g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); }
      else { const rw = ra * rb / Math.abs(ra - rb), s = ra > rb ? 1 : -1, off = Math.sqrt(Math.max(0, rw * rw - h * h)), ux = dx / d * s, uy = dy / d * s, wx = mx + ux * off, wy = my + uy * off, a1 = Math.atan2(p1[1] - wy, p1[0] - wx), a2 = Math.atan2(p2[1] - wy, p2[0] - wx); let da = a2 - a1; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; g.arc(wx, wy, rw, a1, a1 + da, da < 0); }
      g.lineWidth = clamp(Math.min(ra, rb) * .035, .9, 2.2); g.strokeStyle = "rgba(160,64,112,.34)"; g.stroke(); g.lineWidth *= .55; g.strokeStyle = "rgba(255,240,252,.85)"; g.stroke(); g.restore();
    },
    /** clip to the side of the wall between two joined bubbles that the one at `p` is on (the other at `q`) */
    side(p, q, rq, rp) {
      const dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1, a = (rp * rp - rq * rq + d * d) / (2 * d), mx = p[0] + dx * a / d, my = p[1] + dy * a / d, ux = dx / d, uy = dy / d, L = (rp + rq) * 3;
      g.beginPath(); g.moveTo(mx - uy * L, my + ux * L); g.lineTo(mx + uy * L, my - ux * L); g.lineTo(mx + uy * L - ux * L, my - ux * L - uy * L); g.lineTo(mx - uy * L - ux * L, my + ux * L - uy * L); g.closePath(); g.clip();
    },
    /** the walls of the raft of foam: between each two bubbles still up that touch */
    foamWalls(pos, bt, V) { for (const [j, k] of S.foamPairs) { const p = pos[j], q = pos[k]; if (p[3] < 0 || q[3] < 0 || bt >= p[3] || bt >= q[3] || p[2] < 2 || q[2] < 2) continue; S.wall(p, p[2], q, q[2], V * .9); } },
    /** a bubble drawn in a shape between a heart (`round` 0) and a sphere (1), squashed by `w` */
    shaped(x, y, R, tex, a, round, w) {
      if (a <= .01 || R < 1) return; g.save(); g.translate(x, y); g.globalAlpha = clamp(a); g.scale(1 + w, 1 - w * .9);
      g.beginPath(); for (let i = 0; i < 48; i++) { const t = i / 48 * TAU, rr = lerp(HR[i], 1, round) * R; if (i) g.lineTo(Math.sin(t) * rr, -Math.cos(t) * rr); else g.moveTo(0, -rr); } g.closePath();
      g.save(); g.clip(); g.drawImage(tex, -R * 1.1, -R * 1.1, 2.2 * R, 2.2 * R); g.drawImage(S.shine, -R, -R, 2 * R, 2 * R); g.restore();
      g.lineWidth = clamp(R * .02, .6, 1.6); g.strokeStyle = "rgba(160,64,112,.3)"; g.stroke(); g.restore();
    },
    /** the bubble inside the bubble: blown in through its skin, bobbing inside it, let out when the big one pops */
    inner(p, R1, bt, A, V, pl, bubble, pop) {
      const t0 = 5.6, ri = R1 * .36 * E.out(clamp((bt - t0) / .8)); if (bt < t0 || ri < 1) return;
      const ent = [Math.cos(.7), Math.sin(.7)], inside = E.io(clamp((bt - t0 - .5) / 1.2)), bob = [Math.sin(A * .9) * R1 * .16, Math.sin(A * 1.3 + 1) * R1 * .12];
      let x = p[0] + lerp(ent[0] * (R1 - ri * .6), bob[0] - R1 * .08, inside), y = p[1] + lerp(ent[1] * (R1 - ri * .6), bob[1] + R1 * .1, inside);
      if (bt > pl.pop) { const f = bt - pl.pop, go = E.out(clamp(f / 2.2)); x += Math.sin(A * .7) * S.R * .03 * go; y -= f * S.R * .045; }
      const wo = bt > pl.pop ? Math.exp(-(bt - pl.pop) * 3) * .14 * Math.sin((bt - pl.pop) * 14) : 0;
      if (bt < pl.popIn) bubble(x, y, ri, S.smalls[1], A * .5, wo, V * (bt > pl.pop ? 1 : .85), clamp((bt - pl.popIn) / .1), .4); else pop(x, y, ri, bt - pl.popIn, V);
    },
    /** the frozen bubble: frost growing across its film from one side, a glitter, and then it shatters, the pieces falling */
    frosty(x, y, R1, bt, V, pl, A) {
      const f0 = 6, fz = seg(bt, f0, f0 + 3.2, E.io), sh = pl.pop;
      if (bt < sh) {
        g.save(); g.translate(x, y); g.globalAlpha = V * (1 - .55 * fz); g.drawImage(S.bigC, -R1, -R1, 2 * R1, 2 * R1); g.globalAlpha = V; g.drawImage(S.shine, -R1, -R1, 2 * R1, 2 * R1);
        if (fz > 0) {
          g.beginPath(); g.arc(0, 0, R1 * .99, 0, TAU); g.clip();
          const fr = fz * 1.9; g.fillStyle = `rgba(238,247,255,${(.34 * fz).toFixed(3)})`; g.fillRect(-R1, -R1, 2 * R1, 2 * R1);
          g.globalCompositeOperation = "lighter"; g.drawImage(S.frostTo(R1, fr, pl.P), -R1, -R1, 2 * R1, 2 * R1);
          if (fz > .6) for (let k = 0; k < 9; k++) { const s = S.frost[k * 31 % S.frost.length], tw = Math.max(0, Math.sin(A * 2.3 + k * 1.9)) * (fz - .6) / .4; if (tw < .05) continue; g.globalAlpha = V * tw; g.drawImage(S.flash, s[2] * R1 - R1 * .12, s[3] * R1 - R1 * .12, R1 * .24, R1 * .24); }
          g.globalCompositeOperation = "source-over";
        }
        g.restore(); g.save(); g.globalAlpha = V; g.lineWidth = clamp(R1 * .02, .6, 1.6); g.strokeStyle = `rgba(${Math.round(lerp(160, 190, fz))},${Math.round(lerp(64, 200, fz))},${Math.round(lerp(112, 230, fz))},${(.3 + .3 * fz).toFixed(3)})`; g.beginPath(); g.arc(x, y, R1 * .985, 0, TAU); g.stroke(); g.restore();
        return;
      }
      // shattered: the shards fall, turning, and glint as they go
      const d = bt - sh; if (d > 1.6) return; g.save(); g.globalAlpha = V * (1 - d / 1.6);
      for (const s of S.shards) { const sx = x + s.x * R1 + s.vx * R1 * d, sy = y + s.y * R1 + s.vy * R1 * d + 1.3 * S.R * d * d, an = s.r * d; g.save(); g.translate(sx, sy); g.rotate(an); g.beginPath(); g.moveTo(s.p[0] * R1, s.p[1] * R1); g.lineTo(s.p[2] * R1, s.p[3] * R1); g.lineTo(s.p[4] * R1, s.p[5] * R1); g.closePath(); g.fillStyle = "rgba(232,244,255,.55)"; g.fill(); g.lineWidth = .8; g.strokeStyle = "rgba(255,255,255,.8)"; g.stroke(); g.restore(); }
      g.restore();
    },
    /** the frost's branches grown as far as `fr`, on a layer of their own that only adds what grew since the last frame
     *  (drawn again from nothing when the pass or the bubble's size changes, or time goes back) */
    frostTo(R1, fr, P) {
      const n = Math.max(2, Math.round(R1 * 2 * px)), L = S.fl || (S.fl = { c: null, x: null, at: 0, key: "" }), key = n + ":" + P;
      if (!L.c || L.key !== key || fr < L.fr) { [L.c, L.x] = canvas(n, n); L.x.lineCap = "round"; L.x.strokeStyle = "rgba(240,250,255,.7)"; L.x.lineWidth = clamp(R1 * .008, .5, 1.1) * px; L.at = 0; L.key = key; }
      const x = L.x, h = n / 2; x.beginPath(); let i = L.at; for (; i < S.frost.length && S.frost[i][4] <= fr; i++) { const [x0, y0, x1, y1] = S.frost[i]; x.moveTo(h + x0 * h, h + y0 * h); x.lineTo(h + x1 * h, h + y1 * h); } if (i > L.at) x.stroke(); L.at = i; L.fr = fr;
      return L.c;
    },
    /** the wand, in the pass's colour, its frame a ring, a star or a heart, seen slant, the film across it */
    wand2(wa, pl, flat, V) {
      const { Rr } = S, L = Rr * 4.4, hyp = Math.hypot(L, L * .2), { rx, ry, pivot, dir } = wa, [dk, md, hi] = WANDS[pl.col];
      g.save(); g.globalAlpha = V; g.lineCap = "round"; g.lineJoin = "round";
      g.strokeStyle = dk; g.lineWidth = Rr * .24; const h0 = Rr * .95 / hyp; g.beginPath(); g.moveTo(rx + (pivot[0] - rx) * h0, ry + (pivot[1] - ry) * h0); g.lineTo(pivot[0], pivot[1]); g.stroke();
      g.strokeStyle = md; g.lineWidth = Rr * .17; g.stroke(); g.strokeStyle = hi; g.lineWidth = Rr * .05; g.beginPath(); g.moveTo(rx + (pivot[0] - rx) * h0 * 1.1, ry + (pivot[1] - ry) * h0 * 1.1 - Rr * .04); g.lineTo(pivot[0], pivot[1] - Rr * .04); g.stroke();
      g.translate(rx, ry); g.rotate(Math.atan2(dir[1], dir[0]) + Math.PI / 2);
      const fr = FRAME[pl.frame], path = () => { g.beginPath(); if (!fr) g.ellipse(0, 0, Rr, Rr * .42, 0, 0, TAU); else { fr.forEach(([x, y], i) => i ? g.lineTo(x * Rr, y * Rr * .42) : g.moveTo(x * Rr, y * Rr * .42)); g.closePath(); } };
      if (flat > 0) { g.save(); path(); g.clip(); g.scale(1, .42); g.globalAlpha = V * flat * .9; g.drawImage(S.smalls[3], -Rr, -Rr, 2 * Rr, 2 * Rr); g.restore(); }
      g.globalAlpha = V; path(); g.strokeStyle = dk; g.lineWidth = Rr * (fr ? .17 : .2); g.stroke(); g.strokeStyle = md; g.lineWidth = Rr * (fr ? .11 : .13); g.stroke();
      if (!fr) { g.strokeStyle = hi; g.lineWidth = Rr * .04; g.beginPath(); g.ellipse(0, -Rr * .02, Rr * .98, Rr * .4, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      g.restore();
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H, m } = S;
      g.clearRect(0, 0, W, H);
      const dt = S.lastA === undefined ? 0 : clamp(A - S.lastA, 0, .1); S.lastA = A;
      if (S.tx !== undefined) { const k = 1 - Math.exp(-dt * 1.6); S.cx = lerp(S.cx, S.tx, k); S.cy = lerp(S.cy, S.ty, k); S.R = lerp(S.R, S.tR, k); S.fit(); } // it glides to new room
      S.air += dt * (.25 + .75 * I); /* the small ones drift slower while the list is in use */
      S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (1 - Math.exp(-dt * 4)); /* no room on the page: the wand and its bubbles go, the small ones stay */
      const on = I > .01, V = I * S.vis;
      // a bubble at (x, y), radius R: its film (turned by `rot`), the window shining in it, its rim; squashed by `w`, and
      // torn open by `tear` (0 … 1) from the point at angle `ta`
      const bubble = (x, y, R, tex, rot, w, a, tear = 0, ta = -1) => {
        if (a <= .01 || R < 1 || tear >= 1) return;
        g.save(); g.translate(x, y); g.globalAlpha = clamp(a); const sx = 1 + w, sy = 1 - w * .9; g.scale(sx, sy);
        if (tear > 0) { const hx = Math.cos(ta) * R, hy = Math.sin(ta) * R; g.beginPath(); g.arc(0, 0, R + 1, 0, TAU); g.moveTo(hx + tear * 2.2 * R, hy); g.arc(hx, hy, tear * 2.2 * R, 0, TAU, true); g.clip("evenodd"); }
        g.save(); g.rotate(rot); g.drawImage(tex, -R, -R, 2 * R, 2 * R); g.restore();
        g.drawImage(S.shine, -R, -R, 2 * R, 2 * R);
        if (R > 7) { g.lineWidth = clamp(R * .02, .6, 1.6); g.strokeStyle = "rgba(160,64,112,.3)"; g.beginPath(); g.arc(0, 0, R * .985, 0, TAU); g.stroke(); } /* (the smallest need no rim) */
        g.restore();
      };
      // a pop: droplets flung out from the rim, falling, and a faint ring where the film was
      const pop = (x, y, R, age, a) => {
        if (age < 0 || age > .45 || a <= .01) return; const q = age / .45;
        if (q < .25) { g.globalAlpha = clamp(a * (1 - q / .25) * .5); g.drawImage(S.flash, x - R * 1.2, y - R * 1.2, R * 2.4, R * 2.4); }
        g.fillStyle = "#E4579B";
        for (const d of S.drops) { const rr = R * (.85 + d.v * E.out(q) * 1.3), xx = x + Math.cos(d.a) * rr, yy = y + Math.sin(d.a) * rr + q * q * R * 1.1; g.globalAlpha = clamp(a * (1 - q * q) * .85); g.beginPath(); g.arc(xx, yy, clamp(R * .03, .7, 2.2) * d.s * (1 - q * .5), 0, TAU); g.fill(); }
        g.globalAlpha = 1;
      };
      // the small bubbles, always drifting up the page: each comes up from below the foot and goes off the top, or pops
      // on the way (while the loop plays); a popped one waits below for its next time round
      const span = H + 2 * m * .06;
      for (const b of S.drift) {
        const trip = b.y0 + S.air * b.v * H / span, cyc = Math.floor(trip), y = H + m * .06 - (trip - cyc) * span, hsh = Math.abs(Math.sin(cyc * 12.9898 + b.ph * 78.233) * 43758.5453) % 1;
        if (cyc !== b.cyc) { b.popY = b.cyc >= 0 && hsh < .45 ? H * (.2 + hsh * 1.2) : -1e9; b.cyc = cyc; b.pop = null; } /* (one already on its way when the scene starts goes on up) */
        const x = W * b.x + Math.sin(S.air * b.f + b.ph) * b.sw * W, wob = Math.sin(A * 5.3 + b.ph) * .03;
        if (b.pop === null && y < b.popY && I > .5) { b.pop = A; b.py = y; }
        if (b.pop !== null) { pop(x, b.py, b.R, A - b.pop, 1); continue; }
        bubble(x, y, b.R, S.smalls[b.tex], A * b.spin + b.ph, wob, .9 * S.shade(x, y, b.R));
      }
      if (P > 0 && K.egg(P)) S.eggCube(T, I, A, P, pop, on, V); // b416: every twelfth pass, the egg
      else if (P > 0) S.pass2(T, I, A, S.plan && S.plan.P === P ? S.plan : (S.plan = dealPass(P)), bubble, pop, on, V); // a dealt pass
      else {
      // the wand: in from the right, still while the bubble is blown, sweeping for the stream, and out again
      const { Rr, ring } = S, L = Rr * 4.4, hyp = Math.hypot(L, L * .2);
      /** where the wand is at loop time t: its pivot (the hand, off to the right), its ring, and which way it blows */
      const wandAt = t => { const off = W - ring[0] + Rr * 6, wx = ring[0] + (on ? off * (1 - seg(t, B.in[0], B.in[1], E.back) + seg(t, B.out[0], B.out[1], E.in)) : off);
        const sweep = env(t, B.stream[0], B.stream[0] + .5, B.stream[1] - .5, B.stream[1], E.sine) * Math.sin((t - B.stream[0]) / (B.stream[1] - B.stream[0]) * TAU * 1.5) * .42, tilt = -.12 + sweep;
        const pivot = [wx + L, ring[1] + L * .2], ang = Math.atan2(-L * .2, -L) + sweep;
        return { wx, pivot, rx: pivot[0] + Math.cos(ang) * hyp, ry: pivot[1] + Math.sin(ang) * hyp, tilt, dir: [Math.sin(tilt), -Math.cos(tilt)] }; };
      const { wx, pivot, rx, ry, tilt, dir } = wandAt(T); /* it blows up, leaning with the wand */
      // the big bubble: swelling out of the ring along `dir`, a cap of a sphere whose rim is the ring; let go, it floats
      // to the middle of the room and hangs there, its film thinning, and pops
      const bt = on ? T : 0, grow = seg(bt, B.blow[0], B.blow[1], E.sine), c = lerp(-2.4, 1.25, grow) * Rr + Math.sin(A * 7) * Rr * .05 * grow, Rb = Math.hypot(Rr, c);
      const filmT = A * .35, thin = seg(bt, B.thin[0], B.thin[1], E.in);
      const bigOn = on && bt > B.blow[0] && bt < B.pop + .1;
      if (bigOn && (S.filmAt === undefined || Math.abs(filmT - S.filmAt) > .02 || Math.abs(thin - S.thinAt) > .02)) { film(S.bigIm, 64, filmT, thin); S.bigX.putImageData(S.bigIm, 0, 0); S.filmAt = filmT; S.thinAt = thin; } /* the film swirls slowly: redrawn about fifteen times a second */
      if (bigOn && bt < B.free) {
        // still on the ring: the part of the sphere beyond the ring's plane
        const ccx = rx + dir[0] * c, ccy = ry + dir[1] * c;
        const neck = seg(bt, B.free - .45, B.free, E.in) * (Rb - c), bx0 = rx - dir[0] * neck, by0 = ry - dir[1] * neck; /* the neck pinching: the plane it's cut by slides back */
        g.save(); g.globalAlpha = V; g.beginPath(); const nx = -dir[1], ny = dir[0], Lb = Rb * 3; g.moveTo(bx0 + nx * Lb, by0 + ny * Lb); g.lineTo(bx0 - nx * Lb, by0 - ny * Lb); g.lineTo(bx0 - nx * Lb + dir[0] * Lb, by0 - ny * Lb + dir[1] * Lb); g.lineTo(bx0 + nx * Lb + dir[0] * Lb, by0 + ny * Lb + dir[1] * Lb); g.closePath(); g.clip();
        bubble(ccx, ccy, Rb, S.bigC, 0, 0, V); g.restore();
      } else if (bigOn) {
        const since = bt - B.free, c1 = 1.25 * Rr, R1 = Math.hypot(Rr, c1) * lerp(1, .92, E.out(clamp(since / .35))), p0 = [ring[0] + dir[0] * c1, ring[1] + dir[1] * c1], go = E.out(clamp(since / 2.6));
        const hx = lerp(p0[0], S.home[0], go) + Math.sin(A * .6) * S.R * .06 * go, hy = lerp(p0[1], S.home[1], go) + Math.sin(A * .47 + 1) * S.R * .04 * go - seg(bt, 7, B.pop, E.sine) * S.R * .12;
        const wob = Math.exp(-since * 2.2) * .14 * Math.sin(since * 13) + Math.sin(A * 3.1) * .012, tear = clamp((bt - B.pop) / .1);
        bubble(hx, hy, R1, S.bigC, 0, wob, V, tear, -1.9);
        S.big = [hx, hy, R1];
      }
      if (on && bt >= B.pop && S.big) pop(S.big[0], S.big[1], S.big[2], bt - B.pop, V);
      // the stream: small bubbles poured out of the ring as it sweeps, flying out and slowing, then drifting up; each pops
      if (on) for (const s of S.stream) {
        const age = bt - s.te; if (age < 0) continue;
        const w0 = wandAt(s.te), R = s.R * Rr, sp = Rr * 3.2 * s.v, a0 = w0.tilt + s.a - Math.PI / 2, far = (1 - Math.exp(-age * 1.8)) / 1.8;
        const x = w0.rx + Math.cos(a0) * sp * far + Math.sin(A * .9 + s.ph) * Rr * .3 * clamp(age), y = w0.ry + Math.sin(a0) * sp * far - age * Rr * .35;
        if (bt < s.pop) bubble(x, y, R, S.smalls[s.tex], A * .4 + s.ph, Math.sin(A * 6 + s.ph) * .04, V * clamp(age * 6) * S.shade(x, y, R));
        else pop(x, y, R, bt - s.pop, V);
      }
      // the wand over them: its handle, the ring seen slant, the film across the ring (gone while the bubble is blown)
      if (on && wx < W + Rr * 2) {
        g.save(); g.globalAlpha = V; g.lineCap = "round";
        g.strokeStyle = "#A8145A"; g.lineWidth = Rr * .24; const h0 = Rr * .95 / hyp; g.beginPath(); g.moveTo(rx + (pivot[0] - rx) * h0, ry + (pivot[1] - ry) * h0); g.lineTo(pivot[0], pivot[1]); g.stroke();
        g.strokeStyle = "#E02A80"; g.lineWidth = Rr * .17; g.stroke(); g.strokeStyle = "rgba(255,160,205,.8)"; g.lineWidth = Rr * .05; g.beginPath(); g.moveTo(rx + (pivot[0] - rx) * h0 * 1.1, ry + (pivot[1] - ry) * h0 * 1.1 - Rr * .04); g.lineTo(pivot[0], pivot[1] - Rr * .04); g.stroke();
        g.translate(rx, ry); g.rotate(Math.atan2(dir[1], dir[0]) + Math.PI / 2);
        const flat = bt < B.blow[0] || bt > B.free + .25 ? 1 : bt > B.free ? (bt - B.free) / .25 : 0;
        if (flat > 0) { g.save(); g.scale(1, .42); g.globalAlpha = V * flat * .9; g.drawImage(S.smalls[3], -Rr, -Rr, 2 * Rr, 2 * Rr); g.restore(); }
        g.globalAlpha = V; g.strokeStyle = "#A8145A"; g.lineWidth = Rr * .2; g.beginPath(); g.ellipse(0, 0, Rr, Rr * .42, 0, 0, TAU); g.stroke();
        g.strokeStyle = "#E02A80"; g.lineWidth = Rr * .13; g.stroke(); g.strokeStyle = "rgba(255,170,210,.85)"; g.lineWidth = Rr * .04; g.beginPath(); g.ellipse(0, -Rr * .02, Rr * .98, Rr * .4, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
        g.restore();
      }
      }
      // the finale: a flurry of bubbles up from below the foot, each popping on its way up
      if (F >= 0) for (const f of S.flurry) {
        const k = (F - f.d) / (1 - f.d); if (k <= 0) continue;
        const y = lerp(H + f.R * 2, H * f.top, E.out(clamp(k / .7))), x = W * f.x + Math.sin(k * 6 + f.ph) * f.sw * W;
        if (k < .7) bubble(x, y, f.R, S.smalls[f.tex], A * .5 + f.ph, Math.sin(A * 6 + f.ph) * .04, S.shade(x, y, f.R));
        else pop(x, y, f.R, (k - .7) * (1 - f.d) * 3.4, 1);
      }
    },
  };
  return S;
}
