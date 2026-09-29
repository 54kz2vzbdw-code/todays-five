// scene-orbit.js — 1.12 b328: Light's and Dark's scene (scenes.js loads it for either kit and says which). A throbber you
// could watch for hours, in liquid: a ring of glossy drops with a pulse running round it the way a loader's comet does, the
// swollen drops at its head melting into their neighbours as it passes. The loop, fifteen seconds: the drops pour together
// into one trembling blob; it pinches into three lobes that turn; they run out along a figure of eight, merging where it
// crosses; they string out into a wave that ripples through them in three dimensions; and they flow back into the ring.
// The finale: everything pools into one drop, which splashes, and the ring re-forms out of the splash. It keeps to the
// empty part of the page: the stage says where the words are, and it settles in the largest clear circle — beside short
// lines, under a short list — and glides somewhere else, and to another size, as the list changes; so the words need no
// pad under them. Each drop chases its place on a spring, so the liquid wobbles as it merges and parts.
// 1.12 b345: it steps back behind the page. It is drawn soft, as if out of focus: the drops' summed field, sampled on a
// grid, becomes a small image — the body where the field passes 1, its edge feathered across the field's fall-off, lit
// from the upper left by the field's own slope, its colour drifting slowly toward a second hue — laid down scaled up,
// smooth. No outline, no glint; on Light a pale apricot going to rose over a faint shadow, on Dark a low ember.
export default function orbit(K, id) {
  const night = id === "dark";
  const { clamp, lerp, E, env, rng } = K;
  const TAU = Math.PI * 2;
  let g = null;
  // 1.12 b345: the liquid steps back behind the page — soft, as if out of focus, and nearer the page's own tones
  const P = night
    ? { sh: [66, 32, 15], body: [138, 72, 30], li: [210, 132, 64], drift: [150, 70, 78], a: .8, hi: "#D8955A", lo: "#5A2C12", drop: "#A8622E", glow: .44 }
    : { sh: [226, 162, 118], body: [241, 192, 150], li: [251, 222, 196], drift: [238, 178, 168], a: .8, hi: "#FBE0C8", lo: "#E4A57A", drop: "#F0C09A", glow: .5 };
  // the forms the drops take, in units of the ring's size: [x, y, z, radius] for drop i of n at wall time u
  const FORMS = [
    (i, n) => { const a = i / n * TAU; return [Math.cos(a) * .8, Math.sin(a) * .8, 0, .115]; }, // the ring
    (i, n, u) => { const a = i / n * TAU * 2.3 + u * 1.3, rr = .13 + .06 * Math.sin(i * 1.7 + u * 2.1); return [Math.cos(a) * rr, Math.sin(a) * rr, Math.sin(a * 2) * .1, .2]; }, // one trembling blob
    (i, n, u) => { const lobe = i % 3, k = Math.floor(i / 3), a = lobe * TAU / 3 + u * .7; return [Math.cos(a) * .62 + Math.cos(k * 2.1 + u * 1.6) * .045, Math.sin(a) * .62 + Math.sin(k * 2.1 + u * 1.6) * .045, Math.sin(a + u) * .15, .16]; }, // three lobes, turning
    (i, n, u) => { const t = (i / n + u * .11) * TAU, d = 1 + Math.sin(t) ** 2; return [Math.cos(t) / d * 1.02, Math.sin(t) * Math.cos(t) / d * 1.25, Math.sin(t) * .22, .14]; }, // a figure of eight
    (i, n, u) => { const ph = i * .95 - u * 3.2; return [(i / (n - 1) - .5) * 1.9, Math.sin(ph) * .24, Math.cos(ph) * .22, .13]; }, // a wave running through them
  ];
  const PLAN = [[2.2, 0, 1], [4.6, 1, 2], [7.0, 2, 3], [9.6, 3, 4], [12.4, 4, 0]], MORPH = 1.3, SPREAD = .5;
  const S = {
    res: "dpr",
    wash: night ? 1 : 1.6, veil: night ? .5 : 1,
    clear: true, // it keeps to the empty part of the page (words, below), so the words need no pad and no wash
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      const pr = H > W * 1.05, r = rng(11);
      // where it turns: under the words on a phone, beside them on a wide screen
      const cx = pr ? W * .5 : W * .815, cy = pr ? H * .77 : H * .5, R = pr ? Math.min(W * .25, H * .11) : Math.min(W * .14, H * .3);
      const n = 10, GN = pr ? 60 : 76;
      Object.assign(S, { W, H, pr, n, GN, Rmax: R, Rmin: pr ? 26 : 34 });
      if (!S.placed) Object.assign(S, { cx, cy, R, tx: cx, ty: cy, tR: R }); // until the words say where the room is
      S.field = new Float32Array((GN + 1) * (GN + 1));
      S.balls = Array.from({ length: n }, () => ({ x: 0, y: 0, r: 0, z: 0, vx: 0, vy: 0, vr: 0 })); S.fresh = true;
      // the liquid's shadow (day) or glow (night): a soft round sprite under each drop, which together make the whole's
      S.under = night ? K.glowSpr(64, [245, 140, 48], .5) : K.glowSpr(64, [110, 56, 18], .3);
      S.drops = Array.from({ length: pr ? 18 : 26 }, () => ({ a: r() * TAU, v: .8 + r() * .9, up: .4 + r() * .9, s: .03 + r() * .045, lag: r() * .08 }));
      S.dropSpr = K.paint(48, 48, (x, y) => { const d = Math.hypot(x - 23.5, y - 23.5) / 24; if (d >= 1) return null; const lt = clamp(.7 - ((x - 23.5) * .45 + (y - 23.5) * .55) / 24 * .6); const c = P.body.map((v, i) => Math.round(lt < .62 ? lerp(P.sh[i], v, lt / .62) : lerp(v, P.li[i], (lt - .62) / .38))); return [c[0], c[1], c[2], Math.round(255 * P.a * clamp((1 - d) / .45))]; }); /* a splash drop, as soft as the body */
    },
    /** where the words are (scenes.js): find the largest circle of empty page, clear of every word, the screen's edges and
     *  the footer's pool, and make that where the liquid turns, as big as the room allows; it glides there */
    words(rects) {
      const { W, H, pr } = S, gap = pr ? 14 : 26, top = pr ? 12 : 20, foot = H - (pr ? 96 : 104);
      let best = 0, bx = S.tx, by = S.ty;
      for (let gy = 0; gy <= 24; gy++) for (let gx = 0; gx <= 32; gx++) {
        const x = W * (.04 + .92 * gx / 32), y = top + (foot - top) * gy / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y);
        for (const [x0, y0, x1, y1] of rects) { const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1); rad = Math.min(rad, Math.hypot(dx, dy) - gap); if (rad <= best) break; }
        if (rad > best) { best = rad; bx = x; by = y; }
      }
      Object.assign(S, { tx: bx, ty: by, tR: clamp(best / 1.45, S.Rmin, S.Rmax) }); // all it draws (the pool, the glow, the splash) fits in the circle
      if (!S.placed) { Object.assign(S, { cx: S.tx, cy: S.ty, R: S.tR }); S.placed = true; }
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, n } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.fresh || S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A; S.fresh = false;
      // it glides to wherever the room is, and grows or shrinks to fit it; the grid its surface is found on goes with it
      const glide = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * glide; S.cy += (S.ty - S.cy) * glide; S.R += (S.tR - S.R) * glide;
      const { cx, cy, R } = S, half = R * 1.5; S.gs = half * 2 / S.GN; S.gx0 = cx - half; S.gy0 = cy - half;
      // a soft pool of shadow (day) or of light (night) under it
      g.save(); g.translate(cx, cy + R * 1.18); g.scale(1, .13); const pl = g.createRadialGradient(0, 0, 0, 0, 0, R * 1.05); pl.addColorStop(0, night ? "rgba(243,140,50,.09)" : "rgba(120,70,30,.1)"); pl.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = pl; g.beginPath(); g.arc(0, 0, R * 1.05, 0, TAU); g.fill(); g.restore();
      // the camera tilts and turns slowly; the ring spins; the pulse's head runs round it, faster left alone
      S.yaw = (S.yaw || 0) + dt * (.1 + .12 * I);
      S.spin = (S.spin || 0) + dt * (.3 + .15 * I);
      S.head = (S.head || 0) + dt * (.42 + .3 * I);
      const pitch = .82 + .12 * Math.sin(A * .19) - .3 * I * (.5 + .5 * Math.sin(A * .23)), yaw = .25 * Math.sin(S.yaw);
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cs = Math.cos(S.spin), ss = Math.sin(S.spin);
      // the finale: all of it pools into one drop, trembles, splashes, and the ring comes back out of the splash
      const pool = F >= 0 ? E.io(clamp(F / .3)) * (1 - E.back(clamp((F - .42) / .36))) : 0, tremble = F >= 0 ? env(F, .26, .32, .4, .48) : 0;
      for (let i = 0; i < n; i++) {
        const b = S.balls[i];
        let q = FORMS[0](i, n, A);
        if (I > .005) {
          let cur = 0, mid = null;
          for (const [s, a, bb] of PLAN) { const m = clamp((T - s - (i / n) * SPREAD) / MORPH); if (m <= 0) break; if (m < 1) { const e = E.io(m), A0 = FORMS[a](i, n, A), B0 = FORMS[bb](i, n, A); mid = A0.map((v, k) => lerp(v, B0[k], e)); break; } cur = bb; }
          const L0 = mid || FORMS[cur](i, n, A); q = q.map((v, k) => lerp(v, L0[k], I));
        }
        if (pool > 0) { const C = FORMS[1](i, n, A); q = q.map((v, k) => lerp(v, C[k] * (k < 3 ? .7 : 1.05), pool)); }
        // spin about the ring's axis, then the camera's tilt and turn
        let [x, y, z] = q; const x1 = x * cs - y * ss, y1 = x * ss + y * cs; x = x1; y = y1;
        const y2 = y * cp - z * sp, z2 = y * sp + z * cp; y = y2; z = z2;
        const x3 = x * cyw + z * syw, z3 = -x * syw + z * cyw; x = x3; z = z3;
        const f = 3.4 / (3.4 - z * .9), d = ((S.head - i / n) % 1 + 1) % 1, pulse = Math.exp(-d * 6) * (1 - pool);
        const tx = cx + x * R * f, ty = cy + y * R * f, tr = q[3] * R * f * (1 + .5 * pulse) * (1 + tremble * .12 * Math.sin(A * 31 + i * 1.9));
        // a spring, a little under-damped: the drops overshoot and settle, so the liquid wobbles as it merges and parts
        if (jump) { b.x = tx; b.y = ty; b.r = tr; b.vx = b.vy = b.vr = 0; }
        else { const K2 = 95, C = 11.5; b.vx += ((tx - b.x) * K2 - b.vx * C) * dt; b.vy += ((ty - b.y) * K2 - b.vy * C) * dt; b.vr += ((tr - b.r) * K2 - b.vr * C) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r = Math.max(0, b.r + b.vr * dt); }
        b.z = z;
      }
      // by day a soft shadow under the liquid, by night a low glow: a soft sprite under each drop
      g.globalCompositeOperation = night ? "lighter" : "source-over";
      for (const b of S.balls) { const w = b.r * (night ? 3.9 : 3.2); g.globalAlpha = P.glow; g.drawImage(S.under, b.x - w / 2 + (night ? 0 : b.r * .22), b.y - w / 2 + (night ? 0 : b.r * .5), w, w); }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      S.soft(A);
      // the splash: drops thrown out of the pool, falling
      if (F >= 0 && F > .36) for (const d of S.drops) { const k = clamp((F - .38 - d.lag) / .5); if (k <= .04 || k >= 1) continue; const reach = R * (.3 + d.v * .55) * E.out(k), x = cx + Math.cos(d.a) * reach, y = cy + Math.sin(d.a) * reach * .55 - d.up * R * .45 * Math.sin(k * Math.PI * .9) + k * k * R * .35, rr = d.s * R * (1 - k * .55) * 1.25; /* it stays inside the clear circle it was given */ g.globalAlpha = 1 - k * k; g.drawImage(S.dropSpr, x - rr, y - rr, rr * 2, rr * 2); }
      g.globalAlpha = 1;
    },
    px() { return g.getTransform().a; },
    /** where it has settled, for the suite: its centre and size in CSS pixels */
    spot() { return [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    /** the liquid drawn soft, as if out of focus behind the page: the drops' field sampled on the grid and made into a small
     *  image — the body where the field passes 1, its edge feathered across the field's fall-off, lit from the upper left
     *  by the slope of the field (so it reads as a rounded thing without an outline or a glint), its colour drifting slowly
     *  toward a second hue across it — and laid down scaled up, smooth */
    soft(A) {
      const { GN, gs, gx0, gy0, field, balls } = S, M = GN + 1, LO = .52, HI = 1.5;
      field.fill(0);
      for (const b of balls) { const r2 = b.r * b.r, reach = b.r * 5, i0 = Math.max(0, Math.floor((b.x - reach - gx0) / gs)), i1 = Math.min(GN, Math.ceil((b.x + reach - gx0) / gs)), j0 = Math.max(0, Math.floor((b.y - reach - gy0) / gs)), j1 = Math.min(GN, Math.ceil((b.y + reach - gy0) / gs));
        for (let j = j0; j <= j1; j++) { const dy = gy0 + j * gs - b.y, o = j * M; for (let i = i0; i <= i1; i++) { const dx = gx0 + i * gs - b.x, v = r2 / (dx * dx + dy * dy + 1e-3) - .04; if (v > 0) field[o + i] += v * 1.04; } } }
      if (!S.imgC || S.imgC.width !== M) { const [c, x] = K.canvas(M, M); S.imgC = c; S.imgX = x; S.img = x.createImageData(M, M); }
      const d = S.img.data, { sh, body, li, drift } = P, ph = A * .11;
      for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
        const k = j * M + i, o = k * 4, f = field[k];
        if (f <= LO) { d[o + 3] = 0; continue; }
        const t = f >= HI ? 1 : (f - LO) / (HI - LO), a = t * t * (3 - 2 * t);
        // a rounded surface: its normal from a squashed field's slope (steep at the edge, flat in the body) and facing the
        // viewer where the slope is nothing, lit from the upper left and a little in front
        const h = v => 1 - Math.exp(-v * .8), fx = (h(field[i < GN ? k + 1 : k]) - h(field[i > 0 ? k - 1 : k])) * 6, fy = (h(field[j < GN ? k + M : k]) - h(field[j > 0 ? k - M : k])) * 6; /* a smooth squash: the edge rounds off, the body goes flat without a ridge */
        const inv = 1 / Math.hypot(fx, fy, 1), lit = clamp((-fx * -.45 - fy * -.55 + .7) * inv);
        const m = .5 + .5 * Math.sin(ph + i * .045 + j * .03), w = m * .45;
        for (let c = 0; c < 3; c++) { const base = lit < .62 ? lerp(sh[c], body[c], lit / .62) : lerp(body[c], li[c], (lit - .62) / .38); d[o + c] = lerp(base, drift[c], w); }
        d[o + 3] = a * 255 * P.a;
      }
      S.imgX.putImageData(S.img, 0, 0);
      g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(S.imgC, gx0 - gs / 2, gy0 - gs / 2, M * gs, M * gs); g.restore();
    },
  };
  return S;
}
