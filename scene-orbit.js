// scene-orbit.js — 1.12 b328: Light's and Dark's scene (scenes.js loads it for either kit and says which). A throbber you
// could watch for hours, in liquid: a ring of glossy drops with a pulse running round it the way a loader's comet does, the
// swollen drops at its head melting into their neighbours as it passes. The loop, fifteen seconds: the drops pour together
// into one trembling blob; it pinches into three lobes that turn; they run out along a figure of eight, merging where it
// crosses; they string out into a wave that ripples through them in three dimensions; and they flow back into the ring.
// The finale: everything pools into one drop, which splashes, and the ring re-forms out of the splash. Light's liquid is
// an orange glaze throwing a soft shadow; Dark's is molten amber, glowing. It keeps to the empty part of the page: the
// stage says where the words are, and it settles in the largest clear circle — beside short lines, under a short list —
// and glides somewhere else, and to another size, as the list changes; so the words need no pad under them. The surface
// is found each frame on a grid (marching squares, where the drops' summed field is 1) and drawn as a smooth vector
// outline, so its edge is crisp at any density; it is lit from the outline itself: bright just inside where it faces the
// light (the upper left), shaded where it faces away, a soft sheen in each body and one glint where it faces the light
// most. Each drop chases its place on a spring, so the liquid wobbles as it merges and parts.
export default function orbit(K, id) {
  const night = id === "dark";
  const { clamp, lerp, E, env, rng } = K;
  const TAU = Math.PI * 2;
  let g = null;
  const P = night
    ? { hi: "#FFD89E", base: "#F08E3A", lo: "#7E330A", shade: [60, 18, 0], rim: [255, 226, 176], spec: [255, 248, 232], glow: "rgba(245,140,48,.55)", shadow: null, drop: "#F29A45" }
    : { hi: "#FFBE82", base: "#F27A30", lo: "#BF4A12", shade: [120, 40, 6], rim: [255, 240, 222], spec: [255, 255, 255], glow: null, shadow: "rgba(120,60,20,.28)", drop: "#F08240" };
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
      const M = GN + 1, EDGES = 2 * GN * M;
      S.field = new Float32Array(M * M); S.ex = new Float32Array(EDGES); S.ey = new Float32Array(EDGES); S.link = new Int32Array(EDGES * 2); S.seen = new Uint8Array(EDGES); S.used = new Int32Array(EDGES); S.nUsed = 0;
      S.balls = Array.from({ length: n }, () => ({ x: 0, y: 0, r: 0, z: 0, vx: 0, vy: 0, vr: 0 })); S.fresh = true;
      // the liquid's shadow (day) or glow (night): a soft round sprite under each drop, which together make the whole's
      S.under = night ? K.glowSpr(64, [245, 140, 48], .5) : K.glowSpr(64, [110, 56, 18], .3);
      S.drops = Array.from({ length: pr ? 18 : 26 }, () => ({ a: r() * TAU, v: .8 + r() * .9, up: .4 + r() * .9, s: .03 + r() * .045, lag: r() * .08 }));
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
        const tx = cx + x * R * f, ty = cy + y * R * f, tr = q[3] * R * f * (1 + .95 * pulse) * (1 + tremble * .12 * Math.sin(A * 31 + i * 1.9));
        // a spring, a little under-damped: the drops overshoot and settle, so the liquid wobbles as it merges and parts
        if (jump) { b.x = tx; b.y = ty; b.r = tr; b.vx = b.vy = b.vr = 0; }
        else { const K2 = 95, C = 11.5; b.vx += ((tx - b.x) * K2 - b.vx * C) * dt; b.vy += ((ty - b.y) * K2 - b.vy * C) * dt; b.vr += ((tr - b.r) * K2 - b.vr * C) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r = Math.max(0, b.r + b.vr * dt); }
        b.z = z;
      }
      const { path, loops } = S.surface();
      // by day a soft shadow under the liquid, by night its glow: a soft sprite under each drop
      g.globalCompositeOperation = night ? "lighter" : "source-over";
      for (const b of S.balls) { const w = b.r * (night ? 3.9 : 3.2); g.globalAlpha = night ? .85 : 1; g.drawImage(S.under, b.x - w / 2 + (night ? 0 : b.r * .22), b.y - w / 2 + (night ? 0 : b.r * .5), w, w); }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      const gr = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R); gr.addColorStop(0, P.hi); gr.addColorStop(.5, P.base); gr.addColorStop(1, P.lo);
      g.fillStyle = gr; g.fill(path, "evenodd");
      // the light off the outline itself: bright just inside where it faces the light (the upper left), shaded where it
      // faces away, a broad soft sheen in each body and one sharp glint where it faces the light most
      g.save(); g.clip(path, "evenodd"); const LX = -.6, LY = -.8, U = S.pr ? .55 : 1;
      for (const lp of loops) {
        const { xs, ys, nx, ny, x0, y0, x1, y1 } = lp, m = xs.length, bw = x1 - x0, bh = y1 - y0, sz = Math.min(bw, bh);
        const sh = g.createRadialGradient(x0 + bw * .32, y0 + bh * .3, 0, x0 + bw * .32, y0 + bh * .3, sz * .55); sh.addColorStop(0, `rgba(${P.spec.join(",")},.32)`); sh.addColorStop(1, `rgba(${P.spec.join(",")},0)`); g.fillStyle = sh; g.beginPath(); g.arc(x0 + bw * .32, y0 + bh * .3, sz * .55, 0, TAU); g.fill();
        for (const [lo, hi2, col, a, inset, lw] of [[.25, .55, P.rim, .45, 3.2, 2.2], [.55, 1.01, P.rim, .85, 2.6, 2.4], [-1.01, -.2, P.shade, .1, 6, 12]]) {
          g.beginPath(); let on = false;
          for (let k = 0; k < m; k++) { const k2 = (k + 1) % m, face = (nx[k] + nx[k2]) / 2 * LX + (ny[k] + ny[k2]) / 2 * LY; if (face < lo || face >= hi2) { on = false; continue; }
            const ax = xs[k] - nx[k] * inset * U, ay = ys[k] - ny[k] * inset * U, bx = xs[k2] - nx[k2] * inset * U, by = ys[k2] - ny[k2] * inset * U; if (!on) { g.moveTo(ax, ay); on = true; } g.lineTo(bx, by); }
          g.strokeStyle = `rgba(${col.join(",")},${a})`; g.lineWidth = lw * U; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
        }
        let best = 0, bf = -2; for (let k = 0; k < m; k++) { const face = nx[k] * LX + ny[k] * LY; if (face > bf) { bf = face; best = k; } }
        const gx = xs[best] - nx[best] * sz * .16, gy = ys[best] - ny[best] * sz * .16, gs2 = Math.max(2.5, sz * .085), gl = g.createRadialGradient(gx, gy, 0, gx, gy, gs2 * 2); gl.addColorStop(0, `rgba(${P.spec.join(",")},.95)`); gl.addColorStop(.4, `rgba(${P.spec.join(",")},.6)`); gl.addColorStop(1, `rgba(${P.spec.join(",")},0)`);
        g.fillStyle = gl; g.beginPath(); g.ellipse(gx, gy, gs2 * 2, gs2 * 1.3, -.65, 0, TAU); g.fill();
      }
      g.restore();
      // the splash: drops thrown out of the pool, falling
      if (F >= 0 && F > .36) for (const d of S.drops) { const k = clamp((F - .38 - d.lag) / .5); if (k <= .04 || k >= 1) continue; const reach = R * (.3 + d.v * .55) * E.out(k), x = cx + Math.cos(d.a) * reach, y = cy + Math.sin(d.a) * reach * .55 - d.up * R * .45 * Math.sin(k * Math.PI * .9) + k * k * R * .35, rr = d.s * R * (1 - k * .55); /* it stays inside the clear circle it was given */ const dg = g.createRadialGradient(x - rr * .35, y - rr * .4, 0, x, y, rr); dg.addColorStop(0, P.hi); dg.addColorStop(.6, P.drop); dg.addColorStop(1, P.lo); g.globalAlpha = 1 - k * k; g.fillStyle = dg; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); }
      g.globalAlpha = 1;
    },
    px() { return g.getTransform().a; },
    /** where it has settled, for the suite: its centre and size in CSS pixels */
    spot() { return [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    /** the liquid's outline: the drops' field sampled on the grid, the level 1 traced by marching squares, smoothed */
    surface() {
      const { GN, gs, gx0, gy0, field, ex, ey, link, seen, used, balls } = S, M = GN + 1, HO = GN * M;
      field.fill(0);
      for (const b of balls) { const r2 = b.r * b.r, reach = b.r * 5, i0 = Math.max(0, Math.floor((b.x - reach - gx0) / gs)), i1 = Math.min(GN, Math.ceil((b.x + reach - gx0) / gs)), j0 = Math.max(0, Math.floor((b.y - reach - gy0) / gs)), j1 = Math.min(GN, Math.ceil((b.y + reach - gy0) / gs));
        for (let j = j0; j <= j1; j++) { const dy = gy0 + j * gs - b.y, o = j * M; for (let i = i0; i <= i1; i++) { const dx = gx0 + i * gs - b.x, v = r2 / (dx * dx + dy * dy + 1e-3) - .04; if (v > 0) field[o + i] += v * 1.04; } } }
      link.fill(-1); S.nUsed = 0;
      const pt = (e, i0, j0, i1, j1) => { if (seen[e] !== 2) { const f0 = field[j0 * M + i0], f1 = field[j1 * M + i1], t = clamp((1 - f0) / (f1 - f0 || 1e-6)); ex[e] = gx0 + lerp(i0, i1, t) * gs; ey[e] = gy0 + lerp(j0, j1, t) * gs; seen[e] = 2; used[S.nUsed++] = e; } };
      const join = (a, b) => { link[a * 2 + (link[a * 2] === -1 ? 0 : 1)] = b; link[b * 2 + (link[b * 2] === -1 ? 0 : 1)] = a; };
      for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
        const a = field[j * M + i], b = field[j * M + i + 1], c = field[(j + 1) * M + i + 1], d = field[(j + 1) * M + i];
        const code = (a > 1 ? 8 : 0) | (b > 1 ? 4 : 0) | (c > 1 ? 2 : 0) | (d > 1 ? 1 : 0); if (code === 0 || code === 15) continue;
        const Tp = j * GN + i, Bt = (j + 1) * GN + i, Lf = HO + j * M + i, Rt = HO + j * M + i + 1;
        const e = { T: () => pt(Tp, i, j, i + 1, j), B: () => pt(Bt, i, j + 1, i + 1, j + 1), L: () => pt(Lf, i, j, i, j + 1), R: () => pt(Rt, i + 1, j, i + 1, j + 1) };
        const id = { T: Tp, B: Bt, L: Lf, R: Rt }, seg2 = (p, q) => { e[p](); e[q](); join(id[p], id[q]); };
        const mid = (a + b + c + d) / 4 > 1;
        switch (code) {
          case 1: seg2("L", "B"); break; case 2: seg2("B", "R"); break; case 3: seg2("L", "R"); break; case 4: seg2("T", "R"); break;
          case 5: if (mid) { seg2("T", "L"); seg2("B", "R"); } else { seg2("T", "R"); seg2("L", "B"); } break;
          case 6: seg2("T", "B"); break; case 7: seg2("T", "L"); break; case 8: seg2("T", "L"); break; case 9: seg2("T", "B"); break;
          case 10: if (mid) { seg2("T", "R"); seg2("L", "B"); } else { seg2("T", "L"); seg2("B", "R"); } break;
          case 11: seg2("T", "R"); break; case 12: seg2("L", "R"); break; case 13: seg2("R", "B"); break; case 14: seg2("L", "B"); break;
        }
      }
      // walk each loop, smooth it once (Chaikin), find its outward normals and bounds, and draw it with quadratic curves
      const path = new Path2D(), loops = [];
      for (let u = 0; u < S.nUsed; u++) {
        const e0 = used[u]; if (seen[e0] !== 2) continue;
        const xs = [], ys = []; let cur = e0, prev = -1;
        for (let guard = 0; guard < 4000; guard++) { seen[cur] = 1; xs.push(ex[cur]); ys.push(ey[cur]); const a = link[cur * 2], b = link[cur * 2 + 1], nx = a !== prev ? a : b; prev = cur; cur = nx; if (cur === -1 || cur === e0 || seen[cur] === 1) break; }
        if (xs.length < 3) continue;
        const sx = [], sy = []; for (let k = 0; k < xs.length; k++) { const k2 = (k + 1) % xs.length; sx.push(xs[k] * .75 + xs[k2] * .25, xs[k] * .25 + xs[k2] * .75); sy.push(ys[k] * .75 + ys[k2] * .25, ys[k] * .25 + ys[k2] * .75); }
        const m = sx.length; let area = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let k = 0; k < m; k++) { const k2 = (k + 1) % m; area += sx[k] * sy[k2] - sx[k2] * sy[k]; x0 = Math.min(x0, sx[k]); y0 = Math.min(y0, sy[k]); x1 = Math.max(x1, sx[k]); y1 = Math.max(y1, sy[k]); }
        const sgn = area > 0 ? 1 : -1, nx = new Float32Array(m), ny = new Float32Array(m);
        for (let k = 0; k < m; k++) { const a = (k - 1 + m) % m, b = (k + 1) % m, tx = sx[b] - sx[a], ty = sy[b] - sy[a], l = Math.hypot(tx, ty) || 1; nx[k] = sgn * ty / l; ny[k] = -sgn * tx / l; }
        loops.push({ xs: sx, ys: sy, nx, ny, x0, y0, x1, y1 });
        path.moveTo((sx[m - 1] + sx[0]) / 2, (sy[m - 1] + sy[0]) / 2);
        for (let k = 0; k < m; k++) { const k2 = (k + 1) % m; path.quadraticCurveTo(sx[k], sy[k], (sx[k] + sx[k2]) / 2, (sy[k] + sy[k2]) / 2); }
        path.closePath();
      }
      for (let u = 0; u < S.nUsed; u++) seen[used[u]] = 0;
      return { path, loops };
    },
  };
  return S;
}
