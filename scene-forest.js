// scene-forest.js — 1.12 b318: Forest's scene (scenes.js loads it). Night, in pixels: a moon over a misty ridge, three
// depths of pines lit along one side, the clearing, the grass. The idle loop, fifteen seconds: a breeze through the layers
// back to front; the fireflies wake and drift up; fog under moonlight in shafts; a doe walks out of the pines, stops, looks,
// and trots off with her tail up; a shooting star, and the fireflies answer it in one flash; then it all settles to where it
// began. The finale: the fireflies swirl up out of the clearing toward the moon. What does not move is drawn once.
export default function forest(K) {
  const { LOOP, clamp, lerp, E, seg, env, rng, rgb, mixc, css, canvas, paint, noise1, fbm, glowSpr, pine, sprite, layer } = K;
  let g = null;
  const P = {
    skyTop: rgb("#07110D"), skyMid: rgb("#0D1D16"), skyLow: rgb("#18332A"), horizon: rgb("#24463A"),
    star: rgb("#A9C4A2"), starHi: rgb("#EAF2E6"),
    moon: rgb("#E6F0DF"), moonLo: rgb("#CAD9C2"), moonMare: rgb("#BACDB1"), halo: rgb("#9FD78F"),
    ridge: rgb("#1B3A2F"), ridgeHi: rgb("#2A4E40"), mist: rgb("#6E9282"),
    farTree: rgb("#15302A"), farHi: rgb("#22453A"),
    mid: rgb("#0C1B15"), midHi: rgb("#24473A"), midShade: rgb("#08130F"),
    near: rgb("#050D0A"), nearHi: rgb("#15291F"), trunk: rgb("#0A1510"),
    ground: rgb("#0B1813"), groundHi: rgb("#12261D"), grass: rgb("#0B1A13"), grassHi: rgb("#2B4F3A"),
    fog: rgb("#A3BEAF"), shaft: rgb("#E6F2DE"), fly: rgb("#D2F7BE"), flyCore: rgb("#F6FFEE"), flyGlow: rgb("#9EE38A"),
    deer: rgb("#060E0A"), deerHi: rgb("#43705A"), tail: rgb("#C9DCC0"),
  };
  const midsLayer = layer(), nearsLayer = layer(), grassLayer = layer();
  const S = {
    bind(ctx) { g = ctx; },
    layout(W, H) {
      const r = rng(11), portrait = H > W * 1.05;
      const hz = Math.round(H * (portrait ? .66 : .64)); Object.assign(S, { W, H, hz, portrait });
      const M = S.moon = portrait ? { x: Math.round(W * .8), y: Math.round(H * .15), r: Math.max(5, Math.round(W * .05)) } : { x: Math.round(W * .84), y: Math.round(H * .18), r: Math.max(6, Math.round(H * .042)) };
      const sky = paint(W, hz + 4, (x, y) => { const t = y / hz; return t < .55 ? mixc(P.skyTop, P.skyMid, t / .55) : t < .9 ? mixc(P.skyMid, P.skyLow, (t - .55) / .35) : mixc(P.skyLow, P.horizon, clamp((t - .9) / .1)); });
      S.halo = glowSpr(Math.round(M.r * 5.5), P.halo, .32); S.starGlow = glowSpr(4, P.starHi, .5);
      const halo2 = glowSpr(Math.round(M.r * 2.2), P.moon, .22);
      const moon = paint(M.r * 2 + 1, M.r * 2 + 1, (x, y) => {
        const dx = x - M.r, dy = y - M.r, d = Math.hypot(dx, dy); if (d > M.r + .25) return null;
        if (d > M.r - 1.1 && dx + dy < 0) return P.moonLo;
        const u = dx / M.r, v = dy / M.r;
        return (Math.hypot(u + .28, v + .12) < .3) || (Math.hypot(u - .05, v + .32) < .18) || (Math.hypot(u + .02, v - .38) < .16) ? P.moonMare : P.moon;
      });
      S.stars = []; const sr = rng(5);
      for (let i = 0; i < Math.round(W * H / 430); i++) { const x = Math.floor(sr() * W), y = Math.floor(Math.pow(sr(), 1.25) * hz * .8); if (Math.hypot(x - M.x, y - M.y) < M.r * 3.2) continue; S.stars.push({ x, y, ph: sr() * 6.283, f: .5 + sr() * 1.3, big: sr() < .07, b: .3 + sr() * .7 }); }
      const rn = noise1(3, 64), ridgeY = x => Math.round(hz - 7 - fbm(rn, x / 24) * (portrait ? 10 : 14));
      const far = paint(W, hz + 3, (x, y) => { const ry = ridgeY(x); if (y < ry || y > hz + 2) return null; return y === ry ? P.ridgeHi : P.ridge; });
      const mist = paint(W, 26, (x, y) => [P.mist[0], P.mist[1], P.mist[2], Math.round(255 * .36 * Math.exp(-Math.pow((y - 17) / 7, 2)))]);
      const ft = []; for (let x = -3; x < W + 3;) { ft.push({ x, h: 4 + Math.floor(r() * 7) }); x += 2 + Math.floor(r() * 3); }
      const ftN = noise1(7, 64);
      const farTrees = paint(W, hz + 3, (x, y) => {
        for (const t of ft) { const base = hz + 1 - Math.round(fbm(ftN, t.x / 18) * 3), top = base - t.h, dx = x - t.x; if (y >= top && y <= base && Math.abs(dx) <= (y - top) * .42 + (y === base ? 1 : 0)) return dx > (y - top) * .42 - 1 && dx > -.2 ? P.farHi : P.farTree; }
        return null;
      });
      const midZones = portrait ? [[-.05, .3], [.7, 1.05]] : [[-.03, .28], [.62, 1.03]];
      S.mids = [];
      for (const [a, b] of midZones) { let x = W * a; while (x < W * b) { const h = Math.round(lerp(portrait ? 24 : 26, portrait ? 44 : 50, r())); const s = Math.floor(r() * 1e6); S.mids.push({ x: Math.round(x), base: hz + 4 + Math.floor(r() * 5), h, spr: pine(h, s, P.mid, P.midHi, P.trunk, P.midShade) }); x += h * (.38 + r() * .3); } }
      S.mids.sort((p, q) => p.base - q.base);
      const nearDef = portrait ? [[-.12, .56], [.95, .62]] : [[-.04, .82], [.06, .62], [.91, .72], [.99, .9]];
      S.nears = nearDef.map(([fx, fh], i) => { const h = Math.round(H * fh); return { x: Math.round(W * fx), base: H + 3, h, spr: pine(h, 900 + i * 77, P.near, P.nearHi, P.trunk, null) }; });
      S.pathY = hz + 1; // the doe walks the horizon: in front of the mist, behind the mid pines
      const ground = paint(W, H - hz, (x, y) => { const t = Math.pow(y / (H - hz), .7); return t < .5 ? mixc(P.groundHi, P.ground, t / .5) : mixc(P.ground, P.near, (t - .5) / .5); });
      const groundMist = paint(W, 18, (x, y) => [P.mist[0], P.mist[1], P.mist[2], Math.round(255 * .14 * Math.exp(-Math.pow((y - 5) / 6, 2)))]);
      const blades = new Map(); for (let x = 0; x < W + 8; x++) if (r() < .74) blades.set(x, 2 + Math.floor(r() * (portrait ? 6 : 8)));
      S.grass = [-1, 0, 1].map(l => { const [c, x2] = canvas(W + 8, 11); for (const [bx, hh] of blades) { const top = 11 - hh; x2.fillStyle = css(P.grass); x2.fillRect(bx, top + 1, 1, hh - 1); x2.fillStyle = css(P.grassHi); x2.fillRect(bx + l, top, 1, 1); } return c; }); // each blade, its tip leaning with the wind
      const fn = noise1(9, 40), fn2 = noise1(21, 40);
      S.fogBands = [[fn, 18, .2], [fn2, 13, .16]].map(([n, h, k]) => { const w = W * 2; return paint(w, h, (x, y) => { const v = Math.max(0, fbm(n, (x / w) * 40 + y * .07, 3) - .35) / .65; return [P.fog[0], P.fog[1], P.fog[2], Math.round(255 * k * v * Math.sin(Math.PI * y / h))]; }); });
      const sh = Math.round(hz * 1.05), sw = Math.max(6, Math.round(W * (portrait ? .12 : .07)));
      S.shaft = paint(sw + sh, sh, (x, y) => { const u = x - (sh - y) * .85; if (u < 0 || u > sw) return null; return [P.shaft[0], P.shaft[1], P.shaft[2], Math.round(255 * .16 * Math.sin(Math.PI * u / sw) * Math.pow(1 - y / sh, .8))]; });
      const D = { "#": P.deer, "+": P.deerHi, "t": P.tail };
      const top = ["............+..+", "............+##.", "...........####.", "...........#####", "..........###...", ".........###....", "..++++++++##....", ".##########.....", "###########.....", "..#######......."];
      const looking = ["...........+..+.", "...........####.", "...........####.", "............##..", "..........###...", ".........###....", "..++++++++##....", ".##########.....", "###########.....", "..#######......."];
      const flag = top.map((r2, i) => i === 7 || i === 8 ? "t" + r2.slice(1) : r2);
      const L = { tog: ["..##....##......", "..#.#...#.#.....", "..#.#...#.#.....", "..#.#...#.#....."], fs: ["..##....##......", "..#.#..#...#....", "..#.#..#...#....", "..#.#.#.....#..."], bs: ["..##....##......", ".#...#..#.#.....", ".#...#..#.#.....", "#.....#.#.#....."], both: ["..##....##......", ".#...#.#...#....", ".#...#.#...#....", "#.....##.....#.."] };
      S.doe = { walk: ["tog", "fs", "tog", "bs"].map(k => sprite(top.concat(L[k]), D)), trot: ["both", "tog"].map(k => sprite(flag.concat(L[k]), D)), stand: sprite(top.concat(L.tog), D), look: sprite(looking.concat(L.tog), D) };
      S.flyGlow = glowSpr(3, P.flyGlow, .6); S.flyGlowBig = glowSpr(6, P.flyGlow, .3); S.flyHalo = glowSpr(9, P.flyGlow, .35);
      S.flies = Array.from({ length: portrait ? 20 : 32 }, (_, i) => ({ hx: W * (.04 + r() * .92), hy: hz + 3 + r() * (H - hz) * .55, rise: 6 + r() * (hz * (portrait ? .36 : .42)), ax: 3 + r() * 10, ay: 2 + r() * 6, kx: 1 + Math.floor(r() * 2), ky: 1 + Math.floor(r() * 3), m: 4 + Math.floor(r() * 6), ph: r() * 6.283, d: r() * 1.4, amb: i < 5 }));
      S.finaleFlies = Array.from({ length: 30 }, () => ({ a: r() * 6.283, r0: 10 + r() * W * .32, sp: .7 + r() * .8, y0: hz + r() * (H - hz), d: r() * .3 }));
      // everything that never moves, composed once: the sky, the moon, the ridge and its mist, the far pines, the ground
      const [bg, b] = canvas(W, H);
      b.fillStyle = css(P.near); b.fillRect(0, 0, W, H); b.drawImage(sky, 0, 0);
      b.globalAlpha = .75; b.drawImage(S.halo, M.x - (S.halo.width >> 1), M.y - (S.halo.height >> 1)); b.globalAlpha = 1;
      b.drawImage(halo2, M.x - (halo2.width >> 1), M.y - (halo2.height >> 1)); b.drawImage(moon, M.x - M.r, M.y - M.r);
      b.drawImage(far, 0, 0); b.drawImage(mist, 0, hz - 20); b.drawImage(farTrees, 0, 0); b.drawImage(ground, 0, hz); b.drawImage(groundMist, 0, hz - 2);
      S.bg = bg;
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, hz, moon: M } = S;
      g.drawImage(S.bg, 0, 0);
      // a colour string is parsed each time it is set, so two fixed ones and the twinkle in globalAlpha
      const cS = css(P.star), cH = css(P.starHi);
      for (const s of S.stars) { const tw = .55 + .45 * Math.sin(A * s.f + s.ph), a = s.b * tw; g.fillStyle = a > .78 ? cH : cS; g.globalAlpha = clamp(a); g.fillRect(s.x, s.y, 1, 1); if (s.big && tw > .9) { g.fillStyle = cS; g.globalAlpha = .3; g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); } }
      g.globalAlpha = 1;
      // the shooting star, a long trail and a spark where it ends
      const ss = seg(T, 10.4, 11.15, E.in) * (I > .02 ? 1 : 0);
      if (ss > 0 && ss < 1) { const [x0, y0, x1, y1] = S.starPath(), n = 34; for (let k = n - 1; k >= 0; k--) { const t2 = clamp(ss - k * .012); if (t2 <= 0) continue; const a = Math.pow(1 - k / n, 1.8) * I, px = Math.round(lerp(x0, x1, t2)), py = Math.round(lerp(y0, y1, t2)); g.fillStyle = css(k < 4 ? P.starHi : P.star, a); g.fillRect(px, py, 1, 1); if (k < 3) { g.fillStyle = css(P.star, a * .5); g.fillRect(px, py - 1, 1, 1); } } g.globalAlpha = .8 * I; g.drawImage(S.starGlow, Math.round(lerp(x0, x1, ss)) - 4, Math.round(lerp(y0, y1, ss)) - 4); g.globalAlpha = 1; }
      const spark = env(T, 11.1, 11.18, 11.3, 11.9) * I;
      if (spark > 0) { let [, , x1, y1] = S.starPath(); x1 = Math.round(x1); y1 = Math.round(y1); const k = Math.round(1 + spark * 1.4); g.fillStyle = css(P.starHi, spark); g.fillRect(x1 - k, y1, k * 2 + 1, 1); g.fillRect(x1, y1 - k, 1, k * 2 + 1); g.globalAlpha = spark * .5; g.drawImage(S.starGlow, x1 - 4, y1 - 4); g.globalAlpha = 1; }
      const shaftE = env(T, 5.0, 6.4, 7.8, 9.8, E.sine) * I;
      if (shaftE > 0) { g.globalAlpha = shaftE * .25; g.drawImage(S.halo, M.x - (S.halo.width >> 1), M.y - (S.halo.height >> 1)); g.globalAlpha = 1; }
      const fogE = env(T, 4.6, 6.6, 8.6, 11.4, E.sine) * I;
      S.fog(S.fogBands[0], hz - 13, A * 1.4 + T * 2.5 * I, .4 + fogE * .6);
      if (I > 0) S.deer(T, I);
      const gust = x => env(T - (x / W) * .9, .4, 1.2, 1.7, 3.0, E.sine) * I + (Math.sin(A * .7 + x * .05) * .5 + .5) * .15;
      const q = v => Math.round(v * 4);
      const mSway = S.mids.map(t => gust(t.x) * 1.5);
      g.drawImage(midsLayer(W, H, mSway.map(q).join(), x => S.mids.forEach((t, i) => S.tree(x, t, mSway[i]))), 0, 0);
      S.fog(S.fogBands[1], hz - 1, -A * 1.0 - T * 3.5 * I, .25 + fogE * .5);
      if (shaftE > 0) { const sw = S.shaft.width; for (let k = 0; k < 3; k++) { g.globalAlpha = shaftE * [1, .7, .5][k]; g.drawImage(S.shaft, Math.round(M.x - sw * .62 - k * W * (S.portrait ? .17 : .1) + Math.sin(T * .7 + k) * 1.5), Math.round(M.y)); } g.globalAlpha = 1; }
      const nSway = S.nears.map(t => gust(t.x) * 2.2);
      g.drawImage(nearsLayer(W, H, nSway.map(q).join(), x => S.nears.forEach((t, i) => S.tree(x, t, nSway[i]))), 0, 0);
      const leans = []; for (let x = 0; x < W + 8; x += 6) leans.push(Math.round(clamp(gust(x) * 1.7 - .35, -1, 1)));
      g.drawImage(grassLayer(W, 11, leans.join(), x => leans.forEach((l, i) => x.drawImage(S.grass[l + 1], i * 6, 0, 6, 11, i * 6, 0, 6, 11))), 0, H - 11);
      S.fireflies(T, I, A, F);
    },
    starPath() { const { W, H } = S; return S.portrait ? [W * .99, H * .24, W * .8, H * .35] : [W * .3, H * .025, W * .63, H * .105]; },
    fog(band, y, off, a) { if (a <= 0) return; const w = band.width, o = ((Math.round(off) % w) + w) % w; g.globalAlpha = clamp(a); g.drawImage(band, -o, y); g.drawImage(band, w - o, y); g.globalAlpha = 1; },
    /** a pine in slices of three rows, each leaning a little more toward the top */
    tree(x2, t, sway) { const s = t.spr, h = s.height, w = s.width, x0 = t.x - (w >> 1), y0 = t.base - h; for (let y = 0; y < h; y += 3) { const dx = Math.round(sway * Math.pow(1 - y / h, 1.6)), hh = Math.min(3, h - y); x2.drawImage(s, 0, y, w, hh, x0 + dx, y0 + y, w, hh); } },
    deer(T, I) {
      const { W, pathY: y, portrait: pr } = S, x0 = W * (pr ? .02 : .24), xs = W * (pr ? .4 : .46), x1 = W * (pr ? 1.04 : .7);
      let spr = null, x = 0;
      if (T >= 7.0 && T < 9.0) { x = lerp(x0, xs, seg(T, 7.0, 9.0, E.sine)); spr = S.doe.walk[Math.floor(T * 6.5) % 4]; }
      else if (T >= 9.0 && T < 10.4) { x = xs; spr = T < 9.3 || T > 10.1 ? S.doe.stand : S.doe.look; }
      else if (T >= 10.4 && T < 11.8) { x = lerp(xs, x1, seg(T, 10.4, 11.8, E.in)); spr = S.doe.trot[Math.floor(T * 10) % 2]; }
      if (!spr) return;
      g.globalAlpha = env(T, 7.0, 7.5, 11.3, 11.8) * I; g.drawImage(spr, Math.round(x), y - spr.height + 1); g.globalAlpha = 1;
    },
    fireflies(T, I, A, F) {
      const { W, hz } = S, TAU = 6.283;
      const glow = (x, y, b) => { if (b <= .02) return; x = Math.round(x); y = Math.round(y); g.globalAlpha = clamp(b); g.drawImage(S.flyGlowBig, x - 6, y - 6); g.drawImage(S.flyGlow, x - 3, y - 3); g.globalAlpha = 1; g.fillStyle = css(b > .6 ? P.flyCore : P.fly, clamp(b * 1.15)); g.fillRect(x, y, 1, 1); };
      for (const f of S.flies) {
        const wake = seg(T, 2.4 + f.d, 4.9 + f.d, E.out), settle = seg(T, 12.2 + f.d * .6, 14.6, E.io), up = wake * (1 - settle);
        const x = f.hx + Math.sin(TAU * f.kx * T / LOOP + f.ph) * f.ax * (.4 + up), y = f.hy - f.rise * up + Math.sin(TAU * f.ky * T / LOOP + f.ph * 1.3) * f.ay * up;
        let b = Math.pow(Math.max(0, Math.sin(TAU * f.m * T / LOOP + f.ph)), 4) * up * .95;
        const sync = env(T - (x / W) * .5, 11.05, 11.17, 11.32, 11.8, E.sine); b = Math.max(b, sync * up);
        if (f.amb) glow(f.hx + Math.sin(A * .4 + f.ph) * 4, f.hy - 2 + Math.sin(A * .3 + f.ph) * 2, Math.pow(Math.max(0, Math.sin(A * (.8 + f.m * .06) + f.ph)), 10) * .75 * (1 - I * up));
        if (b * I > 0) glow(x, y, b * I);
        if (sync * up * I > .25) { g.globalAlpha = sync * up * I * .75; g.drawImage(S.flyHalo, Math.round(x) - 9, Math.round(y) - 9); g.globalAlpha = 1; }
      }
      if (F < 0) return;
      const M = S.moon, cx0 = W * .5, cy0 = hz - 2, cx1 = M.x - W * .08, cy1 = M.y + S.H * .12;
      for (const f of S.finaleFlies) { const u = clamp((F - f.d) / (1 - f.d)); if (u <= 0 || u >= 1) continue; const lift = E.io(u), spin = f.a + u * 7 * f.sp, rad = f.r0 * .55 * (1 - .65 * lift) + (u > .78 ? (u - .78) * W * 1.1 : 0); glow(lerp(cx0, cx1, lift) + Math.cos(spin) * rad, lerp(cy0 + (f.y0 - hz) * .3, cy1, lift) + Math.sin(spin) * rad * .38, u < .12 ? u / .12 : u > .82 ? (1 - u) / .18 : 1); }
    },
  };
  return S;
}
