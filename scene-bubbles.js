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
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
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
