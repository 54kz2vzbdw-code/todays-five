// scene-heart.js — 1.12 b334: Pink's scene (scenes.js loads it). A candy heart as a neon sign on a brick wall, an arrow
// through it, sparkles round it, its glow on the bricks; it keeps to the largest open space on the page (scenes.js,
// `words`). The loop, fifteen seconds: the power cuts; the tubes relight a stretch at a time, stuttering; the arrow's
// chase lights run through it; it beats; small neon hearts float up; its colour cycles. The finale: neon hearts burst
// round it like fireworks. (1.12 b353: Blush, its day, has soap bubbles now, scene-bubbles.js; the gummy heart that was
// Blush's is gone from here.)
export default function heart(K) {
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  // the heart: a closed outline sampled from four curves, in units where it's about a unit wide
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
  const CURVES = [[[0, .36], [-.56, .02], [-.56, -.44], [-.26, -.44]], [[-.26, -.44], [-.1, -.44], [0, -.33], [0, -.22]], [[0, -.22], [0, -.33], [.1, -.44], [.26, -.44]], [[.26, -.44], [.56, -.44], [.56, .02], [0, .36]]];
  const HEART = []; CURVES.forEach((c, k) => { for (let i = k ? 1 : 0; i <= 30; i++) HEART.push(bez(c[0], c[1], c[2], c[3], i / 30)); });
  const HL = [0]; for (let i = 1; i < HEART.length; i++) HL.push(HL[i - 1] + Math.hypot(HEART[i][0] - HEART[i - 1][0], HEART[i][1] - HEART[i - 1][1]));
  const inHeart = (u, v) => { // even-odd test against the outline
    let c = false; for (let i = 0, j = HEART.length - 1; i < HEART.length; j = i++) { const [xi, yi] = HEART[i], [xj, yj] = HEART[j]; if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi) + xi) c = !c; } return c; };
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .72, list: .4, // the wall is behind the words and the lines sit on pads
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(29);
      Object.assign(S, { W, H, pr, Rmin: pr ? 34 : 40, Rmax: pr ? 150 : 240 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .32, 120) : Math.min(W * .15, H * .3); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .76 : H * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: pr ? H * .76 : H * .5, tR: R0 }); }
      // the draws the day's heart once took from this sequence (1.12 b353) are still taken, so the sign's bubbles and fire
      // fall where they always have: its seven sweets, its sprinkles (each placed inside the heart), its small hearts
      for (let i = 0; i < 28; i++) r();
      for (let i = 0; i < (pr ? 54 : 72); i++) { let u, v; do { u = (r() - .5) * 1.1; v = -.46 + r() * .82; } while (!inHeart(u, v)); for (let k = 0; k < 6; k++) r(); }
      for (let i = 0; i < 132; i++) r();
      S.bubbles = Array.from({ length: 7 }, (_, i) => ({ x: (r() - .5) * .9, t0: 7.6 + i * .4 + r() * .2, s: .09 + r() * .07, sway: r() * TAU }));
      S.sparks = [[-.62, -.58, .09], [.66, -.62, .07], [.72, .2, .06], [-.7, .12, .065], [.08, -.78, .05]];
      S.fire = [0, 1, 2].map(k => ({ a: -Math.PI / 2 + (k - 1) * 1.1, t: k * .16, parts: Array.from({ length: 12 }, () => ({ a: r() * TAU, v: .7 + r() * .3 })) }));
      // the backdrop
      // a brick wall, dark plum, a little uneven, lit by nothing but the sign
      bg.fillStyle = "#1E0714"; bg.fillRect(0, 0, W, H);
      const bw2 = pr ? 34 : 46, bh2 = bw2 * .42, rr2 = rng(5);
      for (let row = 0, y = 0; y < H; row++, y += bh2) for (let x = -(row % 2) * bw2 / 2; x < W; x += bw2) { const k = rr2(); bg.fillStyle = `rgb(${46 + k * 16 | 0},${14 + k * 6 | 0},${32 + k * 10 | 0})`; bg.beginPath(); bg.roundRect(x + 1.5, y + 1.5, bw2 - 3, bh2 - 3, 2); bg.fill(); bg.fillStyle = "rgba(255,255,255,.035)"; bg.fillRect(x + 2, y + 2, bw2 - 4, 1.2); }
      const vg = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, "rgba(10,2,8,.35)"); vg.addColorStop(1, "rgba(10,2,8,.8)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      S.built = 0; if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the largest circle of open page; the heart settles there, as big as it allows */
    words(rects) {
      S.raw = rects; if (!S.W) return;
      const { W, H, pr } = S, gap = pr ? 14 : 26, top = pr ? 96 : 122, foot = H - (pr ? 104 : 128);
      let best = 0, bx = S.tx, by = S.ty;
      for (let gy2 = 0; gy2 <= 24; gy2++) for (let gx2 = 0; gx2 <= 32; gx2++) {
        const x = W * (.04 + .92 * gx2 / 32), y = top + (foot - top) * gy2 / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y);
        for (const [x0, y0, x1, y1] of rects) { rad = Math.min(rad, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)) - gap); if (rad <= best) break; }
        if (rad > best) { best = rad; bx = x; by = y; }
      }
      Object.assign(S, { tx: bx, ty: by, tR: clamp(best, S.Rmin, S.Rmax), room: best >= S.Rmin ? 1 : 0 });
      if (!S.placed) { Object.assign(S, { cx: S.tx, cy: S.ty, R: S.tR }); S.placed = true; }
    },
    /** where it has settled, for the suite */
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    // ---- by night: the neon sign
    /** a tube along points, lit by lv (0 dark glass … 1 full), in hue h; `upto` draws only that much of it lit */
    tube(pts, lv, h, w, upto = 1, chase = null) {
      const path = (a0, a1) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const tot = L[L.length - 1], s0 = a0 * tot, s1 = a1 * tot; g.beginPath(); let st = false; for (let i = 1; i < pts.length; i++) { if (L[i] < s0 || L[i - 1] > s1) continue; const f0 = clamp((s0 - L[i - 1]) / ((L[i] - L[i - 1]) || 1)), f1 = clamp((s1 - L[i - 1]) / ((L[i] - L[i - 1]) || 1)); if (!st) { g.moveTo(lerp(pts[i - 1][0], pts[i][0], f0), lerp(pts[i - 1][1], pts[i][1], f0)); st = true; } g.lineTo(lerp(pts[i - 1][0], pts[i][0], f1), lerp(pts[i - 1][1], pts[i][1], f1)); } };
      // the glass, always there
      g.globalCompositeOperation = "source-over"; g.strokeStyle = "rgba(70,30,52,.95)"; g.lineWidth = w * 1.25; path(0, 1); g.stroke(); g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = w * .3; path(0, 1); g.stroke();
      if (lv <= .01 || upto <= 0) return;
      g.globalCompositeOperation = "lighter";
      for (const [k, a] of [[7, .06], [3.6, .12], [1.9, .3]]) { g.strokeStyle = hsl(h, 100, 62, a * lv); g.lineWidth = w * k; path(0, upto); g.stroke(); }
      g.strokeStyle = hsl(h, 100, 66, .95 * lv); g.lineWidth = w; path(0, upto); g.stroke();
      g.strokeStyle = hsl(h, 100, 92, .9 * lv); g.lineWidth = w * .35; path(0, upto); g.stroke();
      if (chase !== null) for (const d of [0, .33, .66]) { const c0 = (chase + d) % 1; g.strokeStyle = hsl(h, 100, 96, .95 * lv); g.lineWidth = w * .9; path(c0, Math.min(1, c0 + .07)); g.stroke(); }
      g.globalCompositeOperation = "source-over";
    },
    neon(T, I, A, F) {
      const { cx, cy, R } = S, on = I > .01, s = R * 1.5;
      const buzz = t => (Math.sin(t * 67) > .96 ? .55 : 1) * (Math.sin(t * 13.3) > .985 ? .3 : 1); // now and then it dips
      // the power cut and the relighting, a stretch at a time, stuttering
      const cut = on ? seg(T, .4, 1.3, x => x) * I : 0, dark = on && T > 1.3 && T < 1.7;
      const stutter = (t0, t1) => { if (!on) return 1; if (T < 1.3) return 1 - cut; const k = seg(T, t0, t1, x => x); return k <= 0 ? 0 : k >= 1 ? 1 : (Math.sin(T * 90 + t0 * 7) > .1 ? 1 : .15); };
      const heartUpto = on && T > 1.3 && T < 3.4 ? seg(T, 1.8, 3.2, E.io) : 1, heartLv = on && T > 1.3 ? (T < 1.8 ? 0 : stutter(1.8, 3.3)) * buzz(A) : (1 - cut) * buzz(A);
      const arrowLv = on && T > 1.3 ? stutter(3.4, 4.2) : (1 - cut), arrowUpto = on && T > 1.3 && T < 4.3 ? seg(T, 3.4, 4.2, E.io) : 1;
      const beat = on ? Math.max(env(T, 5.0, 5.08, 5.12, 5.3), env(T, 5.38, 5.46, 5.5, 5.75) * .7, env(T, 6.2, 6.28, 6.32, 6.5), env(T, 6.58, 6.66, 6.7, 6.95) * .7) * I : 0;
      const cycle = on ? env(T, 11.0, 11.6, 12.6, 13.2, E.io) * I : 0, hue = 330 + cycle * Math.sin((T - 11) * 2.4) * 60 + (F >= 0 ? Math.sin(F * 20) * 25 : 0);
      const pulse = 1 + beat * .07 + (F >= 0 ? env(F, 0, .05, .2, .5) * .06 : 0);
      // its glow on the bricks
      const glowA = (.28 * heartLv + .1 * arrowLv) * (1 + beat * .8) * (dark ? 0 : 1), gr = g.createRadialGradient(cx, cy, R * .2, cx, cy, R * 2.3);
      gr.addColorStop(0, hsl(hue, 100, 55, .5 * glowA)); gr.addColorStop(.5, hsl(hue, 100, 45, .18 * glowA)); gr.addColorStop(1, hsl(hue, 100, 40, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6); g.globalCompositeOperation = "source-over";
      // the heart, in its tube, beating
      const pts = HEART.map(([u, v]) => [cx + u * s * pulse, cy + v * s * pulse + R * .05]);
      const w = clamp(R * .045, 2.2, 7);
      S.tube(pts, heartLv, hue, w, heartUpto);
      // the arrow through it: a shaft with chase lights running along it, a head and a tail
      const a0 = [cx - R * .9, cy + R * .52], a1 = [cx + R * .86, cy - R * .6], shaft = Array.from({ length: 24 }, (_, i) => [lerp(a0[0], a1[0], i / 23), lerp(a0[1], a1[1], i / 23)]);
      const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), hd = R * .16, head = [[a1[0] - Math.cos(ang - .5) * hd, a1[1] - Math.sin(ang - .5) * hd], a1, [a1[0] - Math.cos(ang + .5) * hd, a1[1] - Math.sin(ang + .5) * hd]];
      const tail = [0, 1, 2].map(k => { const b0 = [lerp(a0[0], a1[0], .04 + k * .05), lerp(a0[1], a1[1], .04 + k * .05)]; return [[b0[0] - Math.cos(ang - 2.4) * hd * .8, b0[1] - Math.sin(ang - 2.4) * hd * .8], b0, [b0[0] - Math.cos(ang + 2.4) * hd * .8, b0[1] - Math.sin(ang + 2.4) * hd * .8]]; });
      const chase = on && T > 4.2 ? ((T - 4.2) * .9) % 1 : A * .25 % 1;
      S.tube(shaft, arrowLv * buzz(A + 3), 45, w * .8, arrowUpto, arrowLv > .5 ? chase : null); S.tube(head, arrowLv, 45, w * .8, arrowUpto >= 1 ? 1 : 0); tail.forEach(t2 => S.tube(t2, arrowLv, 45, w * .7, arrowUpto > .1 ? 1 : 0));
      // the sparkles, popping on one by one after the relight, twinkling
      S.sparks.forEach(([u, v, sz], i) => { const lv = on && T > 1.3 ? stutter(4.3 + i * .25, 4.6 + i * .25) : 1 - cut; if (lv <= .01) return; const k = .75 + .25 * Math.sin(A * 3 + i * 2), sx = cx + u * R, sy = cy + v * R, r2 = sz * R * k; const star = [[sx, sy - r2], [sx + r2 * .22, sy - r2 * .22], [sx + r2, sy], [sx + r2 * .22, sy + r2 * .22], [sx, sy + r2], [sx - r2 * .22, sy + r2 * .22], [sx - r2, sy], [sx - r2 * .22, sy - r2 * .22], [sx, sy - r2]]; S.tube(star, lv * (dark ? 0 : 1), 190 + i * 20, w * .5); });
      // small neon hearts floating up
      if (on) for (const b of S.bubbles) { const k = seg(T, b.t0, b.t0 + 2.4, x => x); if (k <= 0 || k >= 1) continue; const bx = cx + b.x * R + Math.sin(k * 5 + b.sway) * R * .08, by = cy - R * .2 - k * R * .95, sc = b.s * R * 1.1, lv = (1 - seg(k, .7, 1)) * I * (Math.sin(T * 40 + b.sway) > -.9 ? 1 : .3);
        S.tube(HEART.filter((_, i) => i % 3 === 0).map(([u, v]) => [bx + u * sc * 2, by + v * sc * 2]).concat([[bx, by + .36 * sc * 2]]), lv, hue + 20, w * .45); }
      // the finale: neon hearts bursting round it like fireworks
      if (F >= 0) for (const f of S.fire) { const k = clamp((F - f.t) / .7); if (k <= 0 || k >= 1) continue; const fx = cx + Math.cos(f.a) * R * .75, fy = cy + Math.sin(f.a) * R * .75;
        for (const p of f.parts) { const d = E.out(k) * R * .55 * p.v, hx = fx + Math.cos(p.a) * d, hy2 = fy + Math.sin(p.a) * d + k * k * R * .2, sc = R * .045 * (1 - k * .4); S.tube(HEART.filter((_, i) => i % 4 === 0).map(([u, v]) => [hx + u * sc * 2, hy2 + v * sc * 2]), (1 - k), (hue + p.a * 40) % 360, w * .35); } }
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl;
      S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4)); if (S.vis < .01) return;
      g.save(); g.globalAlpha = S.vis; S.neon(T, I, A, F); g.restore();
    },
  };
  return S;
}
