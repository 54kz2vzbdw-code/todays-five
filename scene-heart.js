// scene-heart.js — 1.12 b334: Pink's scene (scenes.js loads it). A candy heart as a neon sign on a brick wall, an arrow
// through it, sparkles round it, its glow on the bricks; it keeps to the largest open space on the page (scenes.js,
// `words`). The loop, fifteen seconds: the power cuts; the tubes relight a stretch at a time, stuttering; the arrow's
// chase lights run through it; it beats; small neon hearts float up; its colour cycles. The finale: neon hearts burst
// round it like fireworks. (1.12 b353: Blush, its day, has soap bubbles now, scene-bubbles.js; the gummy heart that was
// Blush's is gone from here.)
// 1.12 b369: the forever cycle. The loop above is pass 0. In each pass after it the heart stays lit all through, and the
// arrow blinks out and hands over to a neon of the pass's own, one of seven, lit where it was a stretch at a time and put
// out again before the arrow comes back: a crown set on the heart at an angle, its gems lit one by one; flames, in three
// frames that take turns as a sign's do; a heartbeat's trace running across it, the heart beating as the spike goes
// through; lips that pucker and blow a small heart away; marquee bulbs chasing round it; hearts inside the heart, lit
// from the outside in; a crescent moon, stars pricking out and one shooting across. Every run of seven such passes shows
// all seven. A pass is dealt a tint for the heart through its middle, a beat, small hearts, a flicker of its own. Two
// rare ones take a pass's place about once in eight passes each: a stretch of the tube fails in a shower of sparks and
// catches again, or a moth comes in off the edge to the light, knocks against it twice and goes. Every pass starts and
// ends on the lit heart and its arrow; nothing carries.
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
  // 1.12 b369: the forever cycle. The pass's own neon, one of seven, lit where the arrow was and put out again before it
  // comes back; the sparkles each would crowd go out with the arrow
  const HEADS = ["crown", "flames", "trace", "lips", "marquee", "nested", "moon"], QUIET = { crown: [0, 4], flames: [0, 1, 4], trace: [2, 3], lips: [], marquee: [0, 1, 2, 3, 4], nested: [], moon: [1] };
  /** the marquee's thirty bulbs, spaced evenly round the heart's outline a fifth outside it */
  const MQ = Array.from({ length: 30 }, (_, j) => { const d = j / 30 * HL[HL.length - 1]; let i = 1; while (i < HL.length - 1 && HL[i] < d) i++; const f = (d - HL[i - 1]) / ((HL[i] - HL[i - 1]) || 1), u = lerp(HEART[i - 1][0], HEART[i][0], f), v = lerp(HEART[i - 1][1], HEART[i][1], f); return [u * 1.2, (v + .04) * 1.2 - .04]; });
  /** a heartbeat's trace, across the heart (units of R about its middle), and how far along it the spike stands */
  const TRACE = [[-1, 0], [-.42, 0], [-.34, -.07], [-.26, 0], [-.12, 0], [-.07, .1], [.02, -.5], [.1, .27], [.17, 0], [.3, 0], [.4, -.1], [.5, 0], [1, 0]].map(([x, y]) => [x * .95, .07 + y * .9]);
  const SPIKE = (() => { let L = 0, at = 0; for (let i = 1; i < TRACE.length; i++) { L += Math.hypot(TRACE[i][0] - TRACE[i - 1][0], TRACE[i][1] - TRACE[i - 1][1]); if (i === 6) at = L; } return at / L; })();
  /** pass `P`'s plan (pass 0 is the signature): its neon, or one of the rare two in its place; when the arrow goes out and
   *  comes back; a tint for the heart through the middle of the pass, a beat, small hearts, a flicker of its own */
  const dealPass = P => {
    const rareAt = p => K.bag(p, 4, 13) === 2; // a rare pass: one in every four, never two running, the rare two taking turns
    let q = P, n = 0; for (let p = 1; p < P; p++) if (rareAt(p)) { q--; n++; } // the neon is dealt over the passes that have one, so each run of seven shows all seven
    const rare = rareAt(P) ? ((n + (K.deal(0, 77)() < .5 ? 1 : 0)) % 2 ? "moth" : "spark") : null;
    const r = K.deal(P, 31), head = rare ? null : HEADS[K.bag(q, HEADS.length, 7)];
    const off = 1 + r() * .5, back = 11.8 + r() * .5, tint = r() < .45 ? 0 : (r() < .5 ? -1 : 1) * (18 + r() * 20), beat = r() < .6 ? 3.2 + r() * 6 : -1;
    const float = (head === "trace" || head === "marquee" || head === "nested" || rare === "spark") && r() < .6 ? 5 + r() * 3 : -1, flick = r() < .5 ? 2.5 + r() * 8 : -1;
    const sparks = Array.from({ length: 20 }, () => ({ a: -Math.PI / 2 + (r() - .5) * 2.6, v: .45 + r() * .9, t: r() * .3, l: .45 + r() * .5, e: r() < .5 ? 0 : 1 }));
    const moth = { y0: (r() - .5) * .5, turns: 2 + r() * .8, th0: r() * TAU, dir: r() < .5 ? 1 : -1, y1: -1.2 - r() * .4 };
    const mir = r() < .5 ? -1 : 1; // the crown and the moon on the other side, the nested hearts lit the other way, the bulbs chasing the other way
    return { P, head, rare, off, back, tint, beat, float, flick, sparks, moth, mir };
  };
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
      S.bulb = K.paint(33, 33, (x, y) => { const d = Math.hypot(x - 16, y - 16) / 16.5; if (d >= 1) return null; const core = clamp((.3 - d) / .12); return [255, Math.round(lerp(200, 250, core)), Math.round(lerp(140, 235, core)), Math.round(255 * clamp(Math.pow(1 - d, 2.4) * .8 + core))]; }); /* a marquee's bulb, a hot core in a warm glow (1.12 b369) */
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
    tube(pts, lv, h, w, upto = 1, chase = null, from = 0, glass = 1) {
      const path = (a0, a1) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const tot = L[L.length - 1], s0 = a0 * tot, s1 = a1 * tot; g.beginPath(); let st = false; for (let i = 1; i < pts.length; i++) { if (L[i] < s0 || L[i - 1] > s1) continue; const f0 = clamp((s0 - L[i - 1]) / ((L[i] - L[i - 1]) || 1)), f1 = clamp((s1 - L[i - 1]) / ((L[i] - L[i - 1]) || 1)); if (!st) { g.moveTo(lerp(pts[i - 1][0], pts[i][0], f0), lerp(pts[i - 1][1], pts[i][1], f0)); st = true; } g.lineTo(lerp(pts[i - 1][0], pts[i][0], f1), lerp(pts[i - 1][1], pts[i][1], f1)); } };
      // the glass, always there
      g.globalCompositeOperation = "source-over"; if (glass > 0) { g.strokeStyle = glass === 1 ? "rgba(70,30,52,.95)" : `rgba(70,30,52,${(.95 * glass).toFixed(3)})`; g.lineWidth = w * 1.25; path(0, 1); g.stroke(); g.strokeStyle = glass === 1 ? "rgba(255,255,255,.08)" : `rgba(255,255,255,${(.08 * glass).toFixed(3)})`; g.lineWidth = w * .3; path(0, 1); g.stroke(); }
      if (lv <= .01 || upto <= from) return;
      g.globalCompositeOperation = "lighter";
      for (const [k, a] of [[7, .06], [3.6, .12], [1.9, .3]]) { g.strokeStyle = hsl(h, 100, 62, a * lv); g.lineWidth = w * k; path(from, upto); g.stroke(); }
      g.strokeStyle = hsl(h, 100, 66, .95 * lv); g.lineWidth = w; path(from, upto); g.stroke();
      g.strokeStyle = hsl(h, 100, 92, .9 * lv); g.lineWidth = w * .35; path(from, upto); g.stroke();
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
    /** a dealt pass (1.12 b369): the heart stays lit all through; the arrow blinks out and hands over to the pass's own
     *  neon, which lights a stretch at a time, plays, and goes out before the arrow comes back — or, one pass in four, a
     *  rare one: a stretch of the tube failing in a shower of sparks and catching again, or a moth come to the light */
    neon2(T, I, A, F, pl) {
      const { cx, cy, R } = S, on = I > .01, s = R * 1.5, w = clamp(R * .045, 2.2, 7), at = (x, y) => [cx + x * R, cy + y * R];
      const buzz = t => (Math.sin(t * 67) > .96 ? .55 : 1) * (Math.sin(t * 13.3) > .985 ? .3 : 1); // now and then it dips
      // a tube switched on at t0 comes on with two slow blinks and a dip; one switched off dips, catches, and goes
      const lit = t0 => { const d = T - t0; return d < .12 ? 0 : d < .26 ? 1 : d < .55 ? 0 : d < .68 ? 1 : d < .82 ? .3 : 1; };
      const out = t0 => { const d = T - t0; return d < .12 ? 1 : d < .24 ? .15 : d < .42 ? .9 : 0; };
      const ring = (x, y, r, n = 10) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(i / n * TAU) * r, y + Math.sin(i / n * TAU) * r]);
      const glow2 = (x, y, rad, h, a) => { if (a <= .005) return; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, hsl(h, 100, 55, .5 * a)); gr.addColorStop(1, hsl(h, 100, 45, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.globalCompositeOperation = "source-over"; };
      const hd = on ? pl.head : null, t0 = pl.off + .75, k = T - t0, H = hd ? I * lit(t0) * (T < pl.back - .8 ? 1 : out(pl.back - .8)) : 0; // the pass's neon, and how long since it was switched on
      const gA = hd ? I * clamp(Math.min(T - pl.off - .5, pl.back - .2 - T) / .3) : 0; // its glass, there only while it is
      const arrowLv = lerp(1, hd ? (T < pl.back ? out(pl.off) : lit(pl.back)) : 1, I), arrowUpto = hd && on && T > pl.back ? lerp(1, seg(T, pl.back, pl.back + .8, E.io), I) : 1;
      // the heart: lit all through, with the pass's own tint, beat and flicker
      const fl = on && pl.flick >= 0 ? 1 - I * .65 * env(T, pl.flick, pl.flick + .04, pl.flick + .14, pl.flick + .5) : 1;
      let beat = on && pl.beat >= 0 ? Math.max(env(T, pl.beat, pl.beat + .08, pl.beat + .12, pl.beat + .3), env(T, pl.beat + .38, pl.beat + .46, pl.beat + .5, pl.beat + .75) * .7) * I : 0;
      const per = 1.55, head = hd === "trace" && k > .5 ? ((k - .5) % per) / per * 1.4 : -1; // the heartbeat trace's head, sweeping across and off the end
      if (head >= 0) beat = Math.max(beat, H * Math.exp(-(((head - SPIKE) / .035) ** 2))); // the heart beats as the spike runs through it
      const hue = 330 + pl.tint * env(T, 2, 4, 10.5, 12.5, E.sine) * I + (F >= 0 ? Math.sin(F * 20) * 25 : 0);
      const pulse = 1 + beat * .07 + (F >= 0 ? env(F, 0, .05, .2, .5) * .06 : 0);
      // the spark: a stretch of the heart's tube fails, sputters, dies, and catches again
      const f0 = 4.2, f1 = 7.4, fail = on && pl.rare === "spark" ? lerp(1, T < f0 ? 1 : T < f1 ? (T - f0 < .1 ? .2 : T - f0 < .3 ? 1 : T - f0 < .45 ? .1 : T - f0 < .55 ? .6 : 0) : lit(f1), I) : 1;
      const heartLv = buzz(A) * fl;
      // its glow on the bricks
      const glowA = (.28 * heartLv * (.85 + .15 * fail) + .1 * arrowLv) * (1 + beat * .8), gr = g.createRadialGradient(cx, cy, R * .2, cx, cy, R * 2.3);
      gr.addColorStop(0, hsl(hue, 100, 55, .5 * glowA)); gr.addColorStop(.5, hsl(hue, 100, 45, .18 * glowA)); gr.addColorStop(1, hsl(hue, 100, 40, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6); g.globalCompositeOperation = "source-over";
      // the moth's shadow falls on the wall behind it, before anything is drawn over it
      const mo = on && pl.rare === "moth" ? S.mothAt(T, A, pl.moth) : null;
      if (mo) { const sx = mo.x + (mo.x - cx) * .22, sy = mo.y + (mo.y - cy) * .22 + R * .04; g.save(); g.globalAlpha = .42 * I * mo.a * S.vis; g.translate(sx, sy); g.rotate(mo.ang); g.scale(1.35, 1.35); S.mothShape(mo.flap, R, "#0c0207"); g.restore(); }
      // the heart, in its tube, beating
      const pts = HEART.map(([u, v]) => [cx + u * s * pulse, cy + v * s * pulse + R * .05]);
      if (fail < 1) { S.tube(pts, heartLv, hue, w, .55); S.tube(pts, heartLv * fail, hue, w, .68, null, .55, 0); S.tube(pts, heartLv, hue, w, 1, null, .68, 0); }
      else S.tube(pts, heartLv, hue, w, 1);
      // the arrow through it: out while the pass's neon is lit, back after, its chase lights running as they do at rest
      const a0 = [cx - R * .9, cy + R * .52], a1 = [cx + R * .86, cy - R * .6], shaft = Array.from({ length: 24 }, (_, i) => [lerp(a0[0], a1[0], i / 23), lerp(a0[1], a1[1], i / 23)]);
      const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), hdl = R * .16, ahead = [[a1[0] - Math.cos(ang - .5) * hdl, a1[1] - Math.sin(ang - .5) * hdl], a1, [a1[0] - Math.cos(ang + .5) * hdl, a1[1] - Math.sin(ang + .5) * hdl]];
      const tail = [0, 1, 2].map(q => { const b0 = [lerp(a0[0], a1[0], .04 + q * .05), lerp(a0[1], a1[1], .04 + q * .05)]; return [[b0[0] - Math.cos(ang - 2.4) * hdl * .8, b0[1] - Math.sin(ang - 2.4) * hdl * .8], b0, [b0[0] - Math.cos(ang + 2.4) * hdl * .8, b0[1] - Math.sin(ang + 2.4) * hdl * .8]]; });
      S.tube(shaft, arrowLv * buzz(A + 3), 45, w * .8, arrowUpto, arrowLv > .5 && arrowUpto >= 1 ? A * .25 % 1 : null); S.tube(ahead, arrowLv, 45, w * .8, arrowUpto >= 1 ? 1 : 0); tail.forEach(t2 => S.tube(t2, arrowLv, 45, w * .7, arrowUpto > .1 ? 1 : 0));
      // the sparkles: those the pass's neon would crowd go out with the arrow, and come back after it, one by one
      const quiet = !hd ? [] : pl.mir < 0 && hd === "crown" ? [1, 4] : pl.mir < 0 && hd === "moon" ? [0] : QUIET[hd];
      S.sparks.forEach(([u, v, sz], i) => { const lv = quiet.includes(i) ? lerp(1, T < pl.back ? out(pl.off + i * .1) : lit(pl.back + .5 + i * .15), I) : 1; if (lv <= .01) return; const kk = .75 + .25 * Math.sin(A * 3 + i * 2), sx = cx + u * R, sy = cy + v * R, r2 = sz * R * kk; S.tube([[sx, sy - r2], [sx + r2 * .22, sy - r2 * .22], [sx + r2, sy], [sx + r2 * .22, sy + r2 * .22], [sx, sy + r2], [sx - r2 * .22, sy + r2 * .22], [sx - r2, sy], [sx - r2 * .22, sy - r2 * .22], [sx, sy - r2]], lv, 190 + i * 20, w * .5); });
      // the pass's own neon
      if (hd && gA > 0) S.head(hd, k, H, gA, A, w, pl.mir, (x, y) => at(pl.mir * x, y), at, ring, glow2, head);
      // small neon hearts floating up
      if (on && pl.float >= 0) for (const b of S.bubbles) { const kk = seg(T, b.t0 - 7.6 + pl.float, b.t0 - 7.6 + pl.float + 2.4, x => x); if (kk <= 0 || kk >= 1) continue; const bx = cx + b.x * R + Math.sin(kk * 5 + b.sway) * R * .08, by = cy - R * .2 - kk * R * .95, sc = b.s * R * 1.1, lv = (1 - seg(kk, .7, 1)) * I * (Math.sin(T * 40 + b.sway) > -.9 ? 1 : .3);
        S.tube(HEART.filter((_, i) => i % 3 === 0).map(([u, v]) => [bx + u * sc * 2, by + v * sc * 2]).concat([[bx, by + .36 * sc * 2]]), lv, hue + 20, w * .45); }
      // the spark's shower: a pop where the stretch dies, sparks out of it falling and cooling, and a few more as it catches
      if (on && pl.rare === "spark" && T > f0 && T < f1 + 1.2) {
        const e0 = pts[Math.round(.55 * (pts.length - 1))], e1 = pts[Math.round(.68 * (pts.length - 1))], pop = env(T, f0 + .42, f0 + .46, f0 + .5, f0 + .7) * I;
        if (pop > .01) glow2(lerp(e0[0], e1[0], .5), lerp(e0[1], e1[1], .5) - R * .05, R * .45, 40, .7 * pop);
        g.globalCompositeOperation = "lighter"; g.lineCap = "round";
        for (const [tb, n0] of [[f0 + .08, 8], [f0 + .44, 20], [f1 + .1, 8]]) for (let j = 0; j < n0; j++) { const p = pl.sparks[j], d = T - tb - p.t * .4; if (d <= 0 || d >= p.l) continue; const o = p.e ? e1 : e0, pos = t => [o[0] + Math.cos(p.a) * p.v * R * 1.5 * t, o[1] + Math.sin(p.a) * p.v * R * 1.5 * t + 1.9 * R * t * t], q = pos(d), q0 = pos(Math.max(0, d - .07)), c = 1 - d / p.l;
          g.strokeStyle = hsl(32, 100, 60, .8 * c * I); g.lineWidth = clamp(R * .016, 1.2, 3); g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q[0], q[1]); g.stroke();
          g.fillStyle = hsl(48, 100, 88, c * I); g.beginPath(); g.arc(q[0], q[1], clamp(R * .012, 1, 2.4) * (.6 + .4 * c), 0, TAU); g.fill(); }
        g.globalCompositeOperation = "source-over"; g.lineCap = "round";
      }
      // the moth itself, lit on its near side by the sign
      if (mo) { const near = clamp(1.6 - Math.hypot(mo.x - cx, mo.y - cy) / R); g.save(); g.globalAlpha = I * mo.a * S.vis; g.translate(mo.x, mo.y); g.rotate(mo.ang); S.mothShape(mo.flap, R, "#a88c92"); g.globalCompositeOperation = "lighter"; g.globalAlpha = (.18 + .3 * near) * I * mo.a * S.vis; S.mothShape(mo.flap, R, hsl(hue, 90, 62, 1)); g.globalAlpha = (.4 + .4 * near) * I * mo.a * S.vis; S.mothShape(mo.flap, R, null, hsl(hue, 100, 78, 1), Math.atan2(cy - mo.y, cx - mo.x) - mo.ang); g.restore(); }
      // the finale: neon hearts bursting round it like fireworks
      if (F >= 0) for (const f of S.fire) { const kk = clamp((F - f.t) / .7); if (kk <= 0 || kk >= 1) continue; const fx = cx + Math.cos(f.a) * R * .75, fy = cy + Math.sin(f.a) * R * .75;
        for (const p of f.parts) { const d = E.out(kk) * R * .55 * p.v, hx = fx + Math.cos(p.a) * d, hy2 = fy + Math.sin(p.a) * d + kk * kk * R * .2, sc = R * .045 * (1 - kk * .4); S.tube(HEART.filter((_, i) => i % 4 === 0).map(([u, v]) => [hx + u * sc * 2, hy2 + v * sc * 2]), (1 - kk), (hue + p.a * 40) % 360, w * .35); } }
    },
    /** the pass's own neon, `k` seconds after it was switched on, lit `H`, its glass `gA` */
    head(hd, k, H, gA, A, w, m, atm, at, ring, glow2, trace) {
      const { cx, cy, R } = S, s = R * 1.5;
      if (hd === "crown") { // a crown set on the heart at an angle, drawn round a stretch at a time, its gems lit one by one
        const c = Math.cos(-.16), sn = Math.sin(-.16), T2 = (x, y) => atm(-.1 + x * c - y * sn, -.6 + x * sn + y * c);
        glow2(...T2(0, -.18), R * .75, 45, .22 * H);
        S.tube([[-.26, 0], [-.3, -.32], [-.14, -.13], [0, -.38], [.14, -.13], [.3, -.32], [.26, 0], [-.26, 0]].map(p => T2(p[0], p[1])), H, 45, w * .8, seg(k, 0, 1.2, E.io), null, 0, gA);
        [[-.3, -.36], [0, -.42], [.3, -.36]].forEach(([x, y]) => { const b = T2(x, y); S.tube(ring(b[0], b[1], R * .028, 8), H * clamp((k - 1.15) / .1), 45, w * .5, 1, null, 0, gA); });
        [[-.13, -.06, 330], [0, -.07, 190], [.13, -.06, 130]].forEach(([x, y, h], i) => { const b = T2(x, y); S.tube(ring(b[0], b[1], R * .03, 8), H * clamp((k - 1.4 - i * .3) / .12) * (.72 + .28 * Math.sin(A * 3.3 + i * 2.1)), h, w * .5, 1, null, 0, gA); });
      } else if (hd === "flames") { // a flaming heart: three tongues and a yellow core, in three frames that take turns, as a sign's do
        const fr = Math.floor(Math.max(0, k) / .34) % 3, sw = [[-.05, .04, -.03, .02], [0, -.04, .04, -.02], [.05, 0, 0, 0]][fr], ht = [[1, .9, 1.05, .95], [.93, 1.06, .95, 1.05], [1.05, .98, .9, 1]][fr];
        const tongue = (bx, by, h, wd, sway) => { const L2 = [], R2 = []; for (let j = 0; j <= 8; j++) { const t = j / 8, hw = wd * Math.sin(Math.PI * Math.pow(t, .75)) * (1 - t * .3); L2.push(at(bx - hw + sway * t * t, by - h * t)); R2.push(at(bx + hw + sway * t * t, by - h * t)); } return L2.concat(R2.reverse()); };
        glow2(...at(0, -.66), R * .85, 26, .26 * H);
        S.tube(tongue(0, -.3, .66 * ht[0], .12, sw[0]), H, 16, w * .8, seg(k, 0, .9), null, 0, gA);
        S.tube(tongue(-.37, -.6, .3 * ht[1], .075, sw[1] - .05), H, 16, w * .7, seg(k, .2, 1.1), null, 0, gA);
        S.tube(tongue(.37, -.6, .3 * ht[2], .075, sw[2] + .05), H, 16, w * .7, seg(k, .2, 1.1), null, 0, gA);
        S.tube(tongue(0, -.36, .36 * ht[3], .055, sw[3]), H, 46, w * .6, seg(k, .5, 1.2), null, 0, gA);
      } else if (hd === "trace") { // a heartbeat's trace across it, the spike beating the heart as it runs through
        const TR = TRACE.map(([x, y]) => at(x, y));
        S.tube(TR, 0, 140, w * .6, 1, null, 0, gA);
        if (trace >= 0) for (const [a, b, m] of [[.4, .23, .22], [.23, .09, .5], [.09, 0, 1]]) S.tube(TR, H * m, 140, w * .6, clamp(trace - b), null, clamp(trace - a), 0);
        glow2(...at(clamp(trace, 0, 1) * 1.9 - .95, .07), R * .6, 140, .2 * H);
      } else if (hd === "lips") { // lips inside it that pucker twice and blow a small heart up and away
        const pk = [3.2, 6.6].some(t => k > t && k < t + .9), Lw = pk ? .15 : .27, up = pk ? .075 : .1, lo = pk ? .085 : .11;
        glow2(...at(0, -.02), R * .6, 350, .2 * H);
        S.tube([[-Lw, 0], [-Lw * .45, -up], [0, -up * .55], [Lw * .45, -up], [Lw, 0], [Lw * .45, lo], [0, lo * 1.1], [-Lw * .45, lo], [-Lw, 0]].map(([x, y]) => at(x, -.02 + y)), H, 352, w * .75, seg(k, 0, 1), null, 0, gA);
        S.tube([[-Lw * .9, 0], [0, pk ? 0 : .018], [Lw * .9, 0]].map(([x, y]) => at(x, -.02 + y)), H * (pk ? .5 : 1), 352, w * .5, seg(k, .5, 1.1), null, 0, gA);
        for (const t of [3.45, 6.85]) { const q = (k - t) / 1.9; if (q <= 0 || q >= 1) continue; const bx = cx + R * (.06 + q * .5), by = cy - R * (.06 + q * .78), sc = R * (.035 + q * .05); S.tube(HEART.filter((_, i) => i % 3 === 0).map(([u, v]) => [bx + u * sc * 2, by + v * sc * 2]).concat([[bx, by + .36 * sc * 2]]), H * (1 - q * q), 340, w * .45, 1, null, 0, 0); }
      } else if (hd === "marquee") { // bulbs round it chasing, then all on, then every other one in turn
        const step = m * Math.floor(Math.max(0, k) * 6.5) + 300, alt = Math.floor(Math.max(0, k) * 1.4), a0 = g.globalAlpha; g.globalCompositeOperation = "lighter";
        MQ.forEach(([u, v], j) => { const ph = k < 4.6 ? ((j + step) % 3 === 0 ? 1 : .14) : k < 5.8 ? 1 : ((j + alt) % 2 ? 1 : .14), bl = H * ph; if (bl <= .01) return; const bx = cx + u * s, by = cy + v * s + R * .05, br = R * .085; g.globalAlpha = a0 * bl; g.drawImage(S.bulb, bx - br, by - br, br * 2, br * 2); });
        g.globalAlpha = a0; g.globalCompositeOperation = "source-over";
      } else if (hd === "nested") { // hearts inside the heart, lit one after another from the outside in, and out from the inside
        [[.74, 312], [.5, 292], [.27, 268]].forEach(([sc, h], j0) => { const j = m > 0 ? j0 : 2 - j0, cyc = Math.max(0, k - .1) % 2.4, lv = cyc > j * .3 && cyc < 1.5 + (2 - j) * .2 ? 1 : 0; S.tube(HEART.filter((_, i) => i % 2 === 0).map(([u, v]) => [cx + u * s * sc, cy + (-.04 + (v + .04) * sc) * s + R * .05]).concat([[cx, cy + (-.04 + .4 * sc) * s + R * .05]]), H * lv, h, w * (.75 - j * .12), 1, null, 0, gA); });
      } else if (hd === "moon") { // a crescent moon, stars pricking out one by one, and one shooting across
        const mx = .62, my = -.74, mr = .19, cres = [];
        for (let j = 0; j <= 14; j++) { const a = Math.PI * (.55 + j / 14 * .9); cres.push(atm(mx + Math.cos(a) * mr, my + Math.sin(a) * mr)); }
        for (let j = 14; j >= 0; j--) { const a = Math.PI * (.62 + j / 14 * .76); cres.push(atm(mx + .075 + Math.cos(a) * mr * .8, my - .01 + Math.sin(a) * mr * .8)); }
        cres.push(cres[0]); glow2(...atm(mx, my), R * .55, 52, .2 * H);
        S.tube(cres, H, 52, w * .75, seg(k, 0, 1.1), null, 0, gA);
        [[-.52, -.86, .055], [-.2, -.97, .04], [.18, -.9, .05], [-.82, -.42, .045], [.9, -.22, .04]].forEach(([u, v, sz], i) => { const tw = H * clamp((k - .9 - i * .35) / .12) * (.6 + .4 * Math.sin(A * 2.2 + i * 1.7)), sx = cx + m * u * R, sy = cy + v * R, r2 = sz * R; S.tube([[sx, sy - r2], [sx + r2 * .22, sy - r2 * .22], [sx + r2, sy], [sx + r2 * .22, sy + r2 * .22], [sx, sy + r2], [sx - r2 * .22, sy + r2 * .22], [sx - r2, sy], [sx - r2 * .22, sy - r2 * .22], [sx, sy - r2]], tw, 55, w * .45, 1, null, 0, gA); });
        const sh = (k - 5.4) / .8; if (sh > 0 && sh < 1.35) S.tube([atm(-.78, -1.0), atm(-.4, -.93), atm(-.05, -.82)], H, 55, w * .5, clamp(sh), null, clamp(sh - .35), 0);
      }
    },
    /** where the moth is at loop time T: in off the edge, round and round the light (knocking against it twice), and off again */
    mothAt(T, A, m) {
      const { cx, cy, R, W } = S, q = (T - 3) / 8.5; if (q <= 0 || q >= 1) return null;
      const orbit = t => { const th = m.th0 + m.dir * t * m.turns * TAU, knock = Math.max(env(t, .3, .34, .36, .44), env(t, .62, .66, .68, .76)), rr = R * (.9 + .07 * Math.sin(th * 2.3 + 1) - .32 * knock); return [cx + Math.cos(th) * rr, cy - R * .05 + Math.sin(th) * rr * .82]; };
      const ein = [W + R * .3, cy + m.y0 * R], eout = [W + R * .3, cy + m.y1 * R];
      const pos = q => { if (q < .14) { const e = E.io(q / .14), o = orbit(0); return [lerp(ein[0], o[0], e), lerp(ein[1], o[1], e) + Math.sin(q * 40) * R * .03]; } if (q < .86) return orbit((q - .14) / .72); const e = E.io((q - .86) / .14), o = orbit(1); return [lerp(o[0], eout[0], e), lerp(o[1], eout[1], e)]; };
      const [x0, y0] = pos(q), [x1, y1] = pos(Math.min(1, q + .003)), x = x0 + Math.sin(A * 7.3) * R * .025, y = y0 + Math.sin(A * 9.1 + 1) * R * .03; // fluttering
      let d = 1e9; for (const [a0, b0, a1, b1] of S.raw || []) d = Math.min(d, Math.hypot(Math.max(a0 - x, 0, x - a1), Math.max(b0 - y, 0, y - b1))); // it fades as it passes a word
      return { x, y, ang: Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2 + Math.sin(A * 5.3) * .25, flap: Math.abs(Math.sin(A * 26)), a: clamp(Math.min(q, 1 - q) / .02) * lerp(.2, 1, clamp((d - R * .06) / (R * .2))) };
    },
    /** a moth, its wings `flap` open (0 … 1), in `fill`; or, with `rim`, just the edge the light catches, toward `lit` */
    mothShape(flap, R, fill, rim, litAng = 0) {
      const sz = R * .115, op = .35 + .65 * flap;
      const wing = (sx, a0, ln, wd) => { g.beginPath(); g.ellipse(sx * ln * .55 * op, 0, ln * .6 * op + sz * .08, wd, a0 * sx, 0, TAU); };
      if (fill) { g.fillStyle = fill; for (const sx of [-1, 1]) { g.save(); g.translate(0, -sz * .12); wing(sx, -.35, sz, sz * .42); g.fill(); g.restore(); g.save(); g.translate(0, sz * .18); wing(sx, .4, sz * .75, sz * .3); g.fill(); g.restore(); } g.beginPath(); g.ellipse(0, 0, sz * .12, sz * .42, 0, 0, TAU); g.fill(); return; }
      g.strokeStyle = rim; g.lineWidth = Math.max(1, sz * .06); const ca = Math.cos(litAng), sa = Math.sin(litAng); g.beginPath(); for (const sx of [-1, 1]) { if (sx * ca < -.2) continue; g.save(); g.translate(0, -sz * .12); wing(sx, -.35, sz, sz * .42); g.restore(); } g.stroke();
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl;
      S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4)); if (S.vis < .01) return;
      g.save(); g.globalAlpha = S.vis; if (P > 0) S.neon2(T, I, A, F, S.plan && S.plan.P === P ? S.plan : (S.plan = dealPass(P))); else S.neon(T, I, A, F); g.restore();
    },
  };
  return S;
}
