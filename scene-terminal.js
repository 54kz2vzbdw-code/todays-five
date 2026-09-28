// scene-terminal.js — 1.12 b324: Terminal's scene (scenes.js loads it). The same world Teletype types by day, drawn at
// night on a vector display in green phosphor: a grid rolling toward you across the plain, wireframe ridges on the
// horizon, a ringed planet turning in the sky, a scatter of stars. Every line glows (a faint wide stroke under a bright
// core) and what moves leaves the phosphor's trail. The loop, fifteen seconds: a scan beam sweeps the ridge and it burns
// brighter where it passes; a vector ship banks around the planet, its trail fading behind it; the rings tilt and a moon
// comes round; an oscilloscope blooms on the horizon, its figure turning through its ratios and collapsing to a dot; the
// stars stretch into warp lines toward the planet as the grid races, and snap back in a flash. The finale: vector
// fireworks in the sky, the last one behind the planet, and a shock ring running out across the grid.
// Nothing big crosses the band the words keep to, a little above the middle of the screen.
export default function terminal(K) {
  const { clamp, lerp, E, seg, env, rng } = K;
  const TAU = Math.PI * 2;
  const G = "74,240,122", HI = "216,255,216";
  let g = null;
  const col = (a, hi) => `rgba(${hi ? HI : G},${clamp(a).toFixed(3)})`;
  /** a line in phosphor: a faint wide stroke under a bright core */
  const glow = (pts, a, w = 1.1, close = false, hi = false) => {
    if (a <= .01 || pts.length < 2) return;
    for (const [k, wa] of [[4.5, .15], [1, 1]]) { g.strokeStyle = col(a * wa, hi && k === 1); g.lineWidth = w * k; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); g.stroke(); }
  };
  const S = {
    res: "dpr",
    bind(ctx) { g = ctx; g.lineJoin = "round"; g.lineCap = "round"; },
    layout(W, H, bg) {
      const pr = H > W * 1.05, u = Math.sqrt(W * H) / 100, r = rng(41); // Teletype's seed: the same ridge
      const hz = H * (pr ? .69 : .76), band = pr ? [.28 * H, .6 * H] : [.33 * H, .64 * H];
      Object.assign(S, { W, H, pr, u, hz, band });
      const n = K.noise1(7, 64), n2 = K.noise1(19, 64);
      const ridge = (nn, amp, sc, base) => { const pts = []; for (let x = -4; x <= W + 8; x += Math.max(6, W / 90)) pts.push([x, base - amp * K.fbm(nn, x / sc, 3) - (Math.abs(((x / sc) % 2) - 1) < .08 ? amp * .12 : 0)]); return pts; };
      S.ridge = ridge(n, 9 * u, (pr ? 7 : 11) * 6.6, hz);
      S.ridge2 = ridge(n2, (pr ? 5 : 6) * u, 13 * u, hz - .6 * u);
      S.planet = pr ? { x: W * .74, y: H * .19, r: 9.5 * u } : { x: W * .84, y: H * .2, r: 6 * u };
      S.stars = Array.from({ length: pr ? 60 : 120 }, () => ({ x: r() * W, y: r() * hz * .92, s: .4 + r() * 1.1, f: .5 + r() * 2, ph: r() * TAU })).filter(s => Math.hypot(s.x - S.planet.x, s.y - S.planet.y) > S.planet.r * 1.8);
      // the ship's path: in from the left, round the planet, out to the right
      const P0 = S.planet; S.shipPath = [];
      for (let i = 0; i <= 200; i++) { const v = i / 200; let x, y;
        if (v < .35) { const k = v / .35; x = lerp(-W * .1, P0.x - P0.r * 2.2, k); y = lerp(P0.y + P0.r * 1.6, P0.y + P0.r * .6, E.sine(k)); }
        else if (v < .75) { const th = Math.PI * .85 + (v - .35) / .4 * Math.PI * 1.35; x = P0.x + Math.cos(th) * P0.r * 2.2; y = P0.y + Math.sin(th) * P0.r * 1.5; }
        else { const k = (v - .75) / .25; const th = Math.PI * 2.2; const sx = P0.x + Math.cos(th) * P0.r * 2.2, sy = P0.y + Math.sin(th) * P0.r * 1.5; x = lerp(sx, W * 1.12, k); y = lerp(sy, P0.y - P0.r * 2.5, k * k); }
        S.shipPath.push([x, y]); }
      // the finale's fireworks, all above the words' band; the last goes off behind the planet
      const at = pr ? [[.26, .17, .22 * W, 0], [0, 0, .3 * W, .2]] : [[.3, .16, .13 * H, 0], [.56, .12, .1 * H, .12], [0, 0, .15 * H, .26]];
      S.bursts = at.map(([fx, fy, rad, t0]) => ({ x: fx ? W * fx : P0.x, y: fy ? H * fy : P0.y, rad, t0, spokes: Array.from({ length: 22 }, (_, i) => ({ a: i / 22 * TAU + (r() - .5) * .2, v: .7 + r() * .3, hi: r() < .35 })) }));
      // the backdrop: black glass, a faint vignette and a faint phosphor bloom at the horizon; everything else glows live
      bg.fillStyle = "#050806"; bg.fillRect(0, 0, W, H);
      const hzg = bg.createLinearGradient(0, hz - 12 * u, 0, hz + 6 * u); hzg.addColorStop(0, "rgba(74,240,122,0)"); hzg.addColorStop(.7, "rgba(74,240,122,.08)"); hzg.addColorStop(1, "rgba(74,240,122,0)"); bg.fillStyle = hzg; bg.fillRect(0, hz - 12 * u, W, 18 * u);
      const vg = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.45)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      // and what never moves glows there too, drawn once: both ridges at rest, the grid's rails, the planet's rim and parallels
      const live = g; g = bg; bg.lineJoin = "round"; bg.lineCap = "round";
      glow(S.ridge2, .4, .8); glow(S.ridge, .8, 1.2);
      for (let j = -14; j <= 14; j++) { bg.strokeStyle = col(.22); bg.lineWidth = 1; bg.beginPath(); bg.moveTo(W / 2 + j * W * .006, hz); bg.lineTo(W / 2 + j * W * .09, H * 1.05); bg.stroke(); }
      glow(Array.from({ length: 41 }, (_, i) => [P0.x + Math.cos(i / 40 * TAU) * P0.r, P0.y + Math.sin(i / 40 * TAU) * P0.r]), .85, 1.1);
      for (const f of [-.5, 0, .5]) { const yy = P0.y + f * P0.r, rx = Math.sqrt(1 - f * f) * P0.r; glow([[P0.x - rx, yy], [P0.x + rx, yy]], .28, .7); }
      g = live;
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, u, hz, planet: P0, band } = S, on = I > .01;
      g.clearRect(0, 0, W, H);
      const warp = env(T, 11.0, 11.9, 12.6, 13.4, E.sine) * I;
      // the stars, and in the warp their streaks, drawn away from the planet and never into the words' band
      for (const s of S.stars) {
        const tw = .35 + .5 * Math.pow(Math.max(0, Math.sin(A * s.f + s.ph)), 2), inBand = s.y > band[0] && s.y < band[1];
        if (warp > .02 && !inBand) {
          const dx = s.x - P0.x, dy = s.y - P0.y, d = Math.hypot(dx, dy) || 1, lim = s.y < band[0] ? band[0] : hz;
          let L = warp * (14 + d * .3) * u / 6; const ey = s.y + dy / d * L; if (ey > lim) L *= (lim - s.y) / Math.max(1e-3, ey - s.y);
          g.strokeStyle = col(tw * (.5 + warp * .5), true); g.lineWidth = s.s * .8; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + dx / d * L, s.y + dy / d * L); g.stroke();
        } else { g.fillStyle = col(tw * (1 + warp * .6), true); g.fillRect(s.x, s.y, s.s, s.s); }
      }
      // the planet: a globe of meridians and parallels, its rings, and in the loop a moon coming round
      const tilt = -.32 + seg(T, 5.0, 6.6, E.back) * .42 * I * (1 - seg(T, 12.8, 14.6, E.io)), spin = A * .25;
      for (let m = 0; m < 4; m++) { const ph = (spin + m / 4 * Math.PI) % Math.PI, rx = Math.cos(ph) * P0.r; glow(Array.from({ length: 25 }, (_, i) => { const t = -Math.PI / 2 + i / 24 * Math.PI; return [P0.x + rx * Math.cos(t), P0.y + P0.r * Math.sin(t)]; }), .34, .7); }
      const ring = k => { const pts = []; for (let i = 0; i <= 48; i++) { const t = i / 48 * TAU, x = Math.cos(t) * P0.r * k, y = Math.sin(t) * P0.r * k * .28; pts.push([P0.x + x * Math.cos(tilt) - y * Math.sin(tilt), P0.y + x * Math.sin(tilt) + y * Math.cos(tilt)]); } return pts; };
      glow(ring(1.75), .62, 1); glow(ring(2.05), .4, .8);
      const mo = seg(T, 5.3, 8.6, x => x) * I; if (mo > 0 && mo < 1) { const t = mo * TAU * .9 + 2, mx = P0.x + Math.cos(t) * P0.r * 2.4, my = P0.y + Math.sin(t) * P0.r * .8; glow(Array.from({ length: 17 }, (_, i) => [mx + Math.cos(i / 16 * TAU) * P0.r * .16, my + Math.sin(i / 16 * TAU) * P0.r * .16]), .85 * env(mo, 0, .1, .9, 1), .9); }
      // the ridges, the scan beam burning them brighter where it has passed, and all of it flaring as the finale starts
      const beam = seg(T, .3, 2.4, E.io), burn = x => on && beam > 0 && beam < 1 ? clamp(1 - Math.abs(x / W - beam) * 6) * I : 0, flare = F >= 0 ? env(F, 0, .05, .2, .6) * .5 : 0;
      if (on && beam > 0 && T < 4) for (let i = 1; i < S.ridge.length; i++) { const [x0, y0] = S.ridge[i - 1], [x1, y1] = S.ridge[i], b = burn(x1), a = b * .2 + (x1 / W < beam ? .2 * I * (1 - seg(T, 2.4, 4, E.io)) : 0); if (a > .01) glow([[x0, y0], [x1, y1]], a, 1.2, false, b > .5); }
      if (flare > .01) { glow(S.ridge2, flare, .8); glow(S.ridge, flare, 1.2, false, flare > .3); }
      if (on && beam > 0 && beam < 1) { const bx = beam * W; g.strokeStyle = col(.5 * I, true); g.lineWidth = 1; g.beginPath(); g.moveTo(bx, hz - 16 * u); g.lineTo(bx, hz + 2 * u); g.stroke(); g.strokeStyle = col(.12 * I); g.lineWidth = 8; g.stroke(); }
      // the grid rolling toward you, faster in the warp; in the finale a shock ring runs out across it
      S.roll = (S.roll || 0) + (S.lastA === undefined ? 0 : clamp(A - S.lastA, 0, .1)) * (.35 + warp * 3.5); S.lastA = A;
      const depth = d => hz + (H * 1.08 - hz) / (1 + d * .55), rk = F >= 0 ? seg(F, .04, .9, E.out) : -1, ry = rk * (H - hz) * 1.15;
      for (let i = 0; i < 16; i++) { const d = i + 1 - (S.roll % 1), y = depth(d); if (y < hz + 1) continue; const hit = rk > 0 && rk < 1 ? clamp(1 - Math.abs(y - hz - ry) / (14 * u)) * (1 - rk) : 0; g.strokeStyle = col(clamp(.12 + (y - hz) / (H - hz) * .55) + hit * .6, hit > .4); g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      const vx = W / 2;
      if (rk > 0 && rk < 1) for (const [lag, a] of [[0, 1], [.12, .45]]) { const k = clamp(rk - lag), rx2 = k * Math.max(W * .8, (H - hz) * 3), ry2 = k * (H - hz) * 1.15; if (k > 0) glow(Array.from({ length: 49 }, (_, i) => { const t = i / 48 * Math.PI; return [vx + Math.cos(t) * rx2, hz + Math.sin(t) * ry2]; }), (1 - k) * a, 1.3); }
      // the ship, and its phosphor trail
      const sp = seg(T, 2.2, 5.8, E.sine); if (on && sp > 0 && sp < 1) {
        const path = S.shipPath, n = path.length - 1, at = p => { const i = Math.min(n - 1, Math.floor(p * n)), f = p * n - i; return [lerp(path[i][0], path[i + 1][0], f), lerp(path[i][1], path[i + 1][1], f), Math.atan2(path[i + 1][1] - path[i][1], path[i + 1][0] - path[i][0])]; };
        for (let k = 1; k <= 24; k++) { const q = sp - k * .007; if (q <= 0) break; const [ax, ay] = at(q), [bx, by] = at(Math.max(0, q - .007)); g.strokeStyle = col(I * (1 - k / 25) * .7); g.lineWidth = 1.2; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
        const [x, y, ang] = at(sp), s = 2.2 * u, c = Math.cos(ang), si = Math.sin(ang), tf = (px2, py2) => [x + px2 * c - py2 * si, y + px2 * si + py2 * c];
        glow([tf(s, 0), tf(-s * .8, -s * .6), tf(-s * .4, 0), tf(-s * .8, s * .6)], I, 1.2, true); glow([tf(-s * .4, 0), tf(-s * 1.3 - Math.sin(A * 30) * s * .2, 0)], I * .8, 1);
      }
      // the oscilloscope on the horizon, under the words: a graticule, and a Lissajous figure turning through its ratios, then down to a dot
      const lj = seg(T, 7.9, 11.0, x => x) * I; if (lj > 0 && lj < 1) {
        const grow = env(lj, 0, .18, .78, 1, E.io), a = lerp(1, 3, E.io(seg(lj, .15, .7))), b = 2, d = lj * 4, R0 = (S.pr ? 9 : 8) * u, R = R0 * grow, cx = W / 2, cy = hz - R0 * (S.pr ? .55 : .1);
        const box = env(lj, 0, .1, .9, 1) * .3; if (box > .01) { glow([[cx - R0 * 1.5, cy - R0], [cx + R0 * 1.5, cy - R0], [cx + R0 * 1.5, cy + R0], [cx - R0 * 1.5, cy + R0]], box, .7, true); g.setLineDash([2, 4]); glow([[cx - R0 * 1.5, cy], [cx + R0 * 1.5, cy]], box * .8, .6); glow([[cx, cy - R0], [cx, cy + R0]], box * .8, .6); g.setLineDash([]); }
        glow(Array.from({ length: 181 }, (_, i) => { const t = i / 180 * TAU; return [cx + Math.sin(a * t + d) * R * 1.3, cy + Math.sin(b * t) * R * .8]; }), grow * .95, 1.2);
        if (grow < .3) { g.fillStyle = col(1, true); g.fillRect(cx - 1.5, cy - 1.5, 3, 3); }
      }
      // the flash at the end of the warp
      const fl = env(T, 13.2, 13.3, 13.35, 13.8) * I; if (fl > .01) { g.fillStyle = col(fl * .12); g.fillRect(0, 0, W, H); }
      // the finale: vector fireworks in the sky, one after another, their spokes drooping as they fade
      if (F >= 0) {
        for (const bu of S.bursts) { const k = clamp((F - bu.t0) / .62); if (k <= 0 || k >= 1) continue;
          bu.spokes.forEach((s, i) => { const d = E.out(k) * bu.rad * s.v, droop = k * k * bu.rad * .28, t0 = Math.max(0, d - bu.rad * .38), ca = Math.cos(s.a), sa = Math.sin(s.a), x = bu.x + ca * d, y = bu.y + sa * d + droop, a = Math.pow(1 - k, .8);
            glow([[bu.x + ca * t0, bu.y + sa * t0 + droop * .6], [x, y]], a, 1.1, false, s.hi); if (k < .6 || Math.sin(A * 40 + i * 2.3) > 0) { g.fillStyle = col(a, true); g.fillRect(x - 1.1, y - 1.1, 2.2, 2.2); } });
        }
        const fl2 = env(F, 0, .04, .1, .35); if (fl2 > .01) { g.fillStyle = col(fl2 * .07); g.fillRect(0, 0, W, H); }
      }
    },
  };
  return S;
}
