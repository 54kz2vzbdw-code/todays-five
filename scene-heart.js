// scene-heart.js — 1.12 b334: Blush's and Pink's scene, one candy heart by day and by night (scenes.js loads it for either
// kit and says which). It keeps to the largest open space on the page (scenes.js, `words`).
// Blush, by day: a glossy gummy heart, lit from the upper left, with a soft shadow on the page, gumballs and sprinkles
// orbiting it in depth. While the list is in use it floats and jiggles. The loop, fifteen seconds: it crouches, hops,
// flips over in the air and lands with a wobble; a ribbon swirls in and wraps it and flies off; the gumballs close into a
// halo, the heart swells and pops into sprinkles that swirl and settle back into its shape; it beats twice. The finale: a
// fountain of small hearts. Pink, by night: the same heart as a neon sign on a brick wall, an arrow through it, sparkles
// round it, its glow on the bricks. The loop: the power cuts; the tubes relight a stretch at a time, stuttering; the
// arrow's chase lights run through it; it beats; small neon hearts float up; its colour cycles. The finale: neon hearts
// burst round it like fireworks.
export default function heart(K, id) {
  const night = id === "pink";
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
  const heartPath = (x, s, ox = 0, oy = 0, sx = 1) => { x.beginPath(); HEART.forEach(([u, v], i) => i ? x.lineTo(ox + u * s * sx, oy + v * s) : x.moveTo(ox + u * s * sx, oy + v * s)); x.closePath(); };
  const inHeart = (u, v) => { // even-odd test against the outline
    let c = false; for (let i = 0, j = HEART.length - 1; i < HEART.length; j = i++) { const [xi, yi] = HEART[i], [xj, yj] = HEART[j]; if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi) + xi) c = !c; } return c; };
  const S = {
    res: "dpr",
    wash: night ? 1 : 1.6, veil: night ? .6 : 1,
    ...(night ? { hug: .72, list: .4 } : { clear: true }), // by night the wall is behind the words and the lines sit on pads; by day it keeps clear
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(29);
      Object.assign(S, { W, H, pr, Rmin: pr ? 34 : 40, Rmax: pr ? 150 : 240 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .32, 120) : Math.min(W * .15, H * .3); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .76 : H * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: pr ? H * .76 : H * .5, tR: R0 }); }
      // what orbits it by day, and the sprinkles it breaks into; where each sprinkle sits inside the heart
      const PAST = [[255, 179, 209], [184, 230, 255], [255, 240, 168], [201, 242, 216], [224, 200, 255], [255, 205, 170]];
      S.balls = Array.from({ length: 7 }, (_, i) => ({ a: i / 7 * TAU, r: .84 + r() * .12, y: (r() - .5) * .5, s: .07 + r() * .04, c: PAST[i % 6], sp: .5 + r() * .3 }));
      const CANDY = [[255, 95, 162], [79, 195, 247], [255, 200, 60], [102, 209, 158], [179, 136, 255], [255, 138, 101]];
      S.sprinkles = Array.from({ length: pr ? 54 : 72 }, (_, i) => { let u, v; do { u = (r() - .5) * 1.1; v = -.46 + r() * .82; } while (!inHeart(u, v)); return { u, v, a: r() * TAU, d: .5 + r() * .5, rot: r() * TAU, spin: (r() - .5) * 8, c: CANDY[i % 6], orb: r() * TAU, ob: .9 + r() * .2 }; });
      S.minis = Array.from({ length: 22 }, () => ({ a: -Math.PI / 2 + (r() - .5) * 2.2, v: .7 + r() * .6, s: .08 + r() * .07, c: PAST[Math.floor(r() * 6)], spin: (r() - .5) * 5, t: r() * .25 }));
      S.bubbles = Array.from({ length: 7 }, (_, i) => ({ x: (r() - .5) * .9, t0: 7.6 + i * .4 + r() * .2, s: .09 + r() * .07, sway: r() * TAU }));
      S.sparks = [[-.62, -.58, .09], [.66, -.62, .07], [.72, .2, .06], [-.7, .12, .065], [.08, -.78, .05]];
      S.fire = [0, 1, 2].map(k => ({ a: -Math.PI / 2 + (k - 1) * 1.1, t: k * .16, parts: Array.from({ length: 12 }, () => ({ a: r() * TAU, v: .7 + r() * .3 })) }));
      // the backdrop
      if (night) {
        // a brick wall, dark plum, a little uneven, lit by nothing but the sign
        bg.fillStyle = "#1E0714"; bg.fillRect(0, 0, W, H);
        const bw2 = pr ? 34 : 46, bh2 = bw2 * .42, rr2 = rng(5);
        for (let row = 0, y = 0; y < H; row++, y += bh2) for (let x = -(row % 2) * bw2 / 2; x < W; x += bw2) { const k = rr2(); bg.fillStyle = `rgb(${46 + k * 16 | 0},${14 + k * 6 | 0},${32 + k * 10 | 0})`; bg.beginPath(); bg.roundRect(x + 1.5, y + 1.5, bw2 - 3, bh2 - 3, 2); bg.fill(); bg.fillStyle = "rgba(255,255,255,.035)"; bg.fillRect(x + 2, y + 2, bw2 - 4, 1.2); }
        const vg = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, "rgba(10,2,8,.35)"); vg.addColorStop(1, "rgba(10,2,8,.8)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      } else {
        bg.fillStyle = "#FFF5F8"; bg.fillRect(0, 0, W, H);
      }
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
    // ---- by day: the gummy heart
    /** the heart drawn glossy at size s (px), turned by flip (its width's cosine), squashed by sq */
    gummy(x, s, flip, sq, a = 1) {
      const sx = flip * (1 + sq * .5), sy = 1 - sq * .5, back = flip < 0;
      x.save(); x.globalAlpha *= a; x.scale(Math.abs(sx) < .02 ? .02 : sx, sy);
      heartPath(x, s);
      const gr = x.createRadialGradient(-s * .16, -s * .22, s * .02, 0, 0, s * .62);
      if (back) { gr.addColorStop(0, "#F79BC2"); gr.addColorStop(1, "#C21E6A"); } else { gr.addColorStop(0, "#FFD6E8"); gr.addColorStop(.35, "#FF86BC"); gr.addColorStop(.8, "#EC3F8E"); gr.addColorStop(1, "#C21E6A"); }
      x.fillStyle = gr; x.fill();
      x.save(); x.clip();
      // light through the jelly, the rim darker, a bounce of light along the lower right
      const inner = x.createRadialGradient(0, s * .02, 0, 0, s * .02, s * .34); inner.addColorStop(0, "rgba(255,210,230,.35)"); inner.addColorStop(1, "rgba(255,210,230,0)"); x.fillStyle = inner; x.fillRect(-s, -s, s * 2, s * 2);
      x.strokeStyle = "rgba(150,10,70,.28)"; x.lineWidth = s * .06; heartPath(x, s); x.stroke();
      x.strokeStyle = "rgba(255,190,220,.55)"; x.lineWidth = s * .018; x.save(); x.translate(s * .012, s * .014); heartPath(x, s * .97); x.restore(); x.stroke();
      if (!back) { // the glints: a broad one on the left lobe, a small one on the right, a sparkle
        const hl = x.createRadialGradient(-s * .25, -s * .28, 0, -s * .25, -s * .28, s * .16); hl.addColorStop(0, "rgba(255,255,255,.95)"); hl.addColorStop(.5, "rgba(255,255,255,.4)"); hl.addColorStop(1, "rgba(255,255,255,0)");
        x.fillStyle = hl; x.beginPath(); x.ellipse(-s * .25, -s * .27, s * .13, s * .075, -.7, 0, TAU); x.fill();
        x.fillStyle = "rgba(255,255,255,.7)"; x.beginPath(); x.ellipse(s * .2, -s * .32, s * .045, s * .025, -.5, 0, TAU); x.fill();
      }
      x.restore(); x.restore();
    },
    /** a small glossy sphere */
    ball(x, bx, by, r2, c, a = 1) { const gr = x.createRadialGradient(bx - r2 * .35, by - r2 * .4, r2 * .05, bx, by, r2); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.35, rgba(c, 1)); gr.addColorStop(1, rgba([c[0] * .78, c[1] * .78, c[2] * .82], 1)); const ga = x.globalAlpha; x.globalAlpha = ga * a; x.fillStyle = gr; x.beginPath(); x.arc(bx, by, r2, 0, TAU); x.fill(); x.globalAlpha = ga; },
    sprinkle(x, sx, sy, rot, s, c, a = 1) { x.save(); x.translate(sx, sy); x.rotate(rot); x.globalAlpha *= a; x.fillStyle = rgba(c, 1); x.beginPath(); x.roundRect(-s, -s * .32, s * 2, s * .64, s * .32); x.fill(); x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(-s * .7, -s * .22, s * 1.2, s * .14); x.restore(); },
    day(T, I, A, F) {
      const { cx, cy, R } = S, on = I > .01, s = R * 1.05;
      // the beats: a hop with a flip, the ribbon, the halo and the pop, the reassembly, the heartbeat
      const hop = on ? seg(T, .6, 2.2, x => x) * I : 0, crouch = env(T, .35, .55, .6, .7) * I, landT = T - 2.2;
      const hopY = hop > 0 && hop < 1 ? Math.sin(hop * Math.PI) * R * .42 : 0, flip = hop > 0 && hop < 1 ? Math.cos(E.io(hop) * TAU) : 1;
      const wob = on && landT > 0 && landT < 1.4 ? Math.exp(-landT * 4) * Math.sin(landT * 22) * .22 * I : 0;
      const breathe = Math.sin(A * 1.6) * .015, beat = on ? Math.max(env(T, 12.0, 12.08, 12.12, 12.3), env(T, 12.38, 12.46, 12.5, 12.75) * .7) * I : 0;
      const swell = on ? env(T, 6.2, 7.2, 7.3, 7.35, E.in) * I : 0, popped = on && T > 7.35 && T < 10.2, rebuild = on ? seg(T, 8.4, 10.1, E.io) : 0, reappear = on ? seg(T, 9.7, 10.3, E.out) : 1;
      const halo = on ? env(T, 5.6, 6.6, 7.3, 8.2, E.io) * I : 0, fin = F >= 0 ? env(F, 0, .08, .55, .9) : 0;
      const sq = crouch * .3 - wob + (hop > 0 && hop < 1 ? -.12 * Math.sin(hop * Math.PI * 2) : 0), scale = (1 + breathe + swell * .22 + beat * .08) * (1 - fin * .15);
      const hy = cy - hopY + Math.sin(A * .9) * R * .02;
      // the shadow on the page
      const shw = s * .42 * (1 - hopY / (R * 1.2)), sha = .18 * (1 - hopY / (R * .9));
      if (!popped) { g.fillStyle = `rgba(160,40,90,${sha.toFixed(3)})`; g.beginPath(); g.ellipse(cx, cy + s * .48, shw, shw * .18, 0, 0, TAU); g.fill(); }
      // what orbits it: behind first, then the heart, then in front
      const spinA = A * .5 + halo * 6, orbit = (front) => {
        for (const b of S.balls) { const a = b.a + spinA * b.sp, rr = lerp(b.r, .66, halo) * R, z = Math.sin(a), x2 = cx + Math.cos(a) * rr, y2 = hy + (b.y * (1 - halo) + z * .18) * R; if ((z > 0) !== front) continue; S.ball(g, x2, y2, b.s * R * (1 + z * .25), b.c, .95); }
        if (!popped && rebuild === 0) for (const p of S.sprinkles.slice(0, 18)) { const a = p.orb + A * .3 * p.ob, rr = R * (.95 + .05 * Math.sin(A + p.orb)), z = Math.sin(a); if ((z > 0) !== front) continue; S.sprinkle(g, cx + Math.cos(a) * rr, hy + z * .22 * R - R * .05, p.rot + A * p.spin * .3, R * .028 * (1 + z * .2), p.c, .9); }
      };
      orbit(false);
      // the ribbon: a twisting band wound round it, back half behind, front half in front
      const rib = on ? env(T, 2.6, 3.6, 4.8, 5.6, E.io) * I : 0, ribPts = [];
      if (rib > .01) { const n = 90, turns = 2.4, spin2 = A * 2.2; for (let i = 0; i <= n; i++) { const t = i / n; if (t > rib) break; const a = t * turns * TAU + spin2, rr = R * (.72 + .12 * Math.sin(t * 9)), yy = hy + (t - .5) * R * 1.1 * (1 - (T > 4.8 ? seg(T, 4.8, 5.6) * .3 : 0)); ribPts.push([cx + Math.cos(a) * rr, yy + Math.sin(a) * R * .16, Math.sin(a), Math.cos(t * 14 + A * 3)]); } }
      const ribbon = front => { for (let i = 1; i < ribPts.length; i++) { const [x0, y0, z0, w0] = ribPts[i - 1], [x1, y1, z1] = ribPts[i]; if ((z0 > 0) !== front) continue; const w = R * .07 * (.25 + .75 * Math.abs(w0)); g.strokeStyle = w0 > 0 ? "#FF9ECB" : "#E9559A"; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } };
      ribbon(false);
      // the heart itself, or the sprinkles it burst into, flying and then settling back into its shape
      if (!popped || reappear > 0) { g.save(); g.translate(cx, hy); g.scale(scale, scale); S.gummy(g, s, flip, sq, popped ? reappear : 1); g.restore(); }
      if (popped) { const burstK = seg(T, 7.35, 8.3, E.out);
        for (const p of S.sprinkles) { const out = [Math.cos(p.a) * p.d * R * 1.1, Math.sin(p.a) * p.d * R * .9], swirl = (1 - rebuild) * (T - 7.35) * 2.2, ca = Math.cos(swirl), sa = Math.sin(swirl), ox = out[0] * ca - out[1] * sa, oy = out[0] * sa + out[1] * ca, home = [p.u * s, p.v * s];
          const x2 = cx + lerp(home[0] * burstK + ox * burstK, home[0], rebuild), y2 = hy + lerp(home[1] * burstK + oy * burstK, home[1], rebuild); S.sprinkle(g, x2, y2, p.rot + (1 - rebuild) * T * p.spin, R * .04, p.c, 1 - reappear * .9); }
        const pop = env(T, 7.35, 7.4, 7.45, 7.7); if (pop > .01) { g.strokeStyle = `rgba(255,120,180,${(pop * .6).toFixed(3)})`; g.lineWidth = 3; g.beginPath(); g.arc(cx, hy, R * (.5 + (T - 7.35) * 2.2), 0, TAU); g.stroke(); } }
      ribbon(true); orbit(true);
      // the finale: a fountain of small hearts
      if (F >= 0) for (const m of S.minis) { const k = clamp((F - m.t) / .75); if (k <= 0 || k >= 1) continue; const d = E.out(k) * R * .95 * m.v, x2 = cx + Math.cos(m.a) * d, y2 = cy + Math.sin(m.a) * d + k * k * R * .5; g.save(); g.translate(x2, y2); g.rotate(k * m.spin); g.globalAlpha *= 1 - seg(k, .7, 1); heartPath(g, m.s * R); const gr = g.createRadialGradient(-m.s * R * .15, -m.s * R * .15, 0, 0, 0, m.s * R * .6); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.4, rgba(m.c, 1)); gr.addColorStop(1, rgba([m.c[0] * .8, m.c[1] * .75, m.c[2] * .8], 1)); g.fillStyle = gr; g.fill(); g.restore(); }
    },
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
      g.save(); g.globalAlpha = S.vis; if (night) S.neon(T, I, A, F); else S.day(T, I, A, F); g.restore();
    },
  };
  return S;
}
