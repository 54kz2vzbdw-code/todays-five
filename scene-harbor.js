// scene-harbor.js — 1.12 b318: Harbor's scene (scenes.js loads it). Morning, in pixels: the sun over a quiet sea, clouds,
// a headland with its lighthouse, a pier and a moored boat, a sail far out. The idle loop, fifteen seconds: a run of
// light down the sun's path; a pair of gulls, one banking; the lighthouse flashes twice; a wave set rolls toward shore;
// a fish jumps by the boat; then it settles. The finale: the gulls lift off the pier. What does not move is drawn once.
export default function harbor(K) {
  const { clamp, lerp, E, seg, env, rng, rgb, mixc, css, canvas, paint, noise1, fbm, glowSpr, sprite } = K;
  let g = null;
  const P = {
    skyTop: rgb("#D8ECE8"), skyLow: rgb("#F3F9F7"), sun: rgb("#FFF9EC"), sunGlow: rgb("#FFEFC9"),
    cloud: rgb("#FAFDFC"), cloudLo: rgb("#E1EEEB"), hill: rgb("#CFE3DF"), hillHi: rgb("#DCECE8"),
    rock: rgb("#B6D0CB"), rockLo: rgb("#A5C4BE"), rockHi: rgb("#CBE0DB"), grass: rgb("#BFD9C9"),
    house: rgb("#F5FAF9"), houseLo: rgb("#DDEBE8"), band: rgb("#9CCBC6"), dome: rgb("#7FA8A4"), lamp: rgb("#FFE3A0"), lampHi: rgb("#FFFFFF"),
    sea: [rgb("#D3E8E4"), rgb("#C4DFDB"), rgb("#B6D6D1")], crest: rgb("#EDF7F5"), crestLo: rgb("#DAEDEA"), glint: rgb("#FFFFFF"), foam: rgb("#F6FBFA"),
    hull: rgb("#8FB8B4"), hullHi: rgb("#B2D1CD"), sail: rgb("#F9FCFB"), sailLo: rgb("#D7E8E5"), mast: rgb("#8FB2AE"), pier: rgb("#9DC0BB"), pierHi: rgb("#C0DAD6"),
    gull: rgb("#5F8C88"), fish: rgb("#7FAAA5"),
  };
  const S = {
    wash: 1.6, // a light kit: the top band and the footer's pool come nearly to the ink under its small words (scenes.js)
    veil: 1,   // and on Everything, a page of them, the plain ground
    bind(ctx) { g = ctx; },
    layout(W, H) {
      const r = rng(31), portrait = H > W * 1.05, hz = Math.round(H * (portrait ? .68 : .6)); Object.assign(S, { W, H, hz, portrait });
      const SUN = S.sun = portrait ? { x: Math.round(W * .82), y: Math.round(H * .2), r: Math.max(4, Math.round(W * .05)) } : { x: Math.round(W * .7), y: Math.round(H * .3), r: Math.max(5, Math.round(H * .045)) };
      const sky = paint(W, hz + 1, (x, y) => mixc(P.skyTop, P.skyLow, Math.pow(y / hz, .8)));
      const sunGlow = glowSpr(Math.round(SUN.r * 5), P.sunGlow, .55), sunDisk = paint(SUN.r * 2 + 1, SUN.r * 2 + 1, (x, y) => Math.hypot(x - SUN.r, y - SUN.r) <= SUN.r + .2 ? P.sun : null);
      const cloud = (w, h, s) => { const q = rng(s), bl = Array.from({ length: 4 }, (_, i) => ({ x: w * (.18 + i * .22 + (q() - .5) * .1), r: h * (.45 + q() * .5) })); return paint(w, h, (x, y) => (bl.some(c => Math.hypot((x - c.x) * .7, y - h) <= c.r) && y > h * .12) ? (y >= h - 2 ? P.cloudLo : P.cloud) : null); };
      S.clouds = Array.from({ length: portrait ? 4 : 6 }, (_, i) => ({ spr: cloud(16 + Math.floor(r() * 18), 6 + Math.floor(r() * 4), 40 + i), x: r() * W, y: Math.round(H * (.08 + r() * .3)), v: .4 + r() * .8 }));
      const hn = noise1(13, 64), hillY = x => Math.round(hz - 2 - fbm(hn, x / 34) * (portrait ? 5 : 8));
      const hills = paint(W, hz + 1, (x, y) => { const hy = hillY(x); if (y < hy) return null; return y === hy ? P.hillHi : P.hill; });
      // the headland: a cliff out of the right edge, the lighthouse on it
      const lx = Math.round(W * (portrait ? .8 : .84)), lw = portrait ? 5 : 7, lh = Math.round(H * (portrait ? .17 : .26));
      const cliffTop = hz - Math.round(H * (portrait ? .05 : .06)), L = S.light = { x: lx, top: cliffTop - lh, w: lw };
      const cn = noise1(17, 32), rn2 = noise1(29, 64), strata = noise1(37, 32);
      const head = paint(W, hz + 3, (x, y) => {
        const edge = lx - Math.round(W * (portrait ? .2 : .13)) + Math.round(fbm(cn, y / 3) * 3), top = cliffTop + Math.max(0, Math.round((edge + 7 - x) * .8)) + Math.round(fbm(rn2, x / 3) * 1.6);
        if (x >= edge && y >= top) { if (y <= top) return P.grass; const v = fbm(strata, x / 5 + y * .45, 2); return v < .38 ? P.rockLo : x < edge + 2 || v > .72 ? P.rockHi : P.rock; }
        const x0 = lx - (lw >> 1);
        if (y >= L.top && y < cliffTop && x >= x0 && x < x0 + lw) return Math.floor((y - L.top) / Math.max(3, Math.round(lh / 5))) % 2 === 1 ? P.band : x === x0 + lw - 1 ? P.houseLo : P.house;
        if (y === L.top - 1 && x >= x0 - 1 && x <= x0 + lw) return P.dome; // the gallery
        if (y >= L.top - 4 && y < L.top - 1 && x >= x0 + 1 && x < x0 + lw - 1) return x === x0 + 1 || x === x0 + lw - 2 ? P.dome : P.lamp;
        if (y >= L.top - 6 && y < L.top - 4 && Math.abs(x - lx) <= (y === L.top - 5 ? 1 : 0)) return P.dome;
        return null;
      });
      S.lampY = L.top - 3;
      const pr = S.pier = { x0: Math.round(W * (portrait ? -.02 : .03)), x1: Math.round(W * (portrait ? .34 : .28)), y: hz + Math.round((H - hz) * .36) };
      const boat = (w, sail) => paint(w, sail ? w + 3 : 5, (x, y) => {
        const hh = sail ? w + 3 : 5, hy = hh - 3;
        if (y >= hy) { const inset = y - hy; if (x >= inset && x < w - inset) return y === hy ? P.hullHi : P.hull; return null; }
        if (!sail) return y === hy - 1 && x === (w >> 1) ? P.mast : null;
        const mx = Math.round(w * .45); if (x === mx) return P.mast; const t = y / hy; if (x > mx && x - mx <= (1 - Math.abs(t - .55) * 1.4) * (w - mx - 1)) return x - mx < 2 ? P.sailLo : P.sail; if (x < mx && mx - x <= t * (mx - 1) * .8) return P.sailLo; return null;
      });
      S.moored = boat(portrait ? 9 : 12, false); S.sail = boat(portrait ? 8 : 11, true);
      const G = { "#": P.gull };
      S.gull = [sprite(["#.....#", ".#...#.", "..#.#..", "...#..."], G), sprite([".......", "###.###", "...#...", "......."], G), sprite([".......", "...#...", ".##.##.", "#.....#"], G)];
      S.crests = [];
      for (let y = hz + 1; y < H; y++) { const d = (y - hz) / (H - hz), gap = Math.round(lerp(5, 16, d)), len = Math.round(lerp(1, 5, d)); if (r() > lerp(.5, .9, d)) continue; for (let x = Math.floor(r() * gap); x < W; x += gap + Math.floor(r() * gap)) S.crests.push({ x, y, len: len + Math.floor(r() * 2), ph: r() * 6.283, d }); }
      S.path = Array.from({ length: Math.round((H - hz) * 1.6) }, () => { const y = hz + 1 + Math.floor(Math.pow(r(), .9) * (H - hz - 1)), spread = lerp(1.5, 9, (y - hz) / (H - hz)); return { x: SUN.x + (r() - .5) * 2 * spread, y, ph: r() * 6.283 }; });
      S.flock = Array.from({ length: 6 }, (_, i) => ({ x: pr.x0 + 4 + i * 5 + r() * 3, y: pr.y - 3, d: i * .07 + r() * .08, dx: (r() - .25) * W * .6, dy: -(H * .3 + r() * H * .25) }));
      // what never moves, in the three depths the moving things sit between: the sky; the hills and the sea; the headland and the pier
      const [sk, a] = canvas(W, H); a.drawImage(sky, 0, 0); a.globalAlpha = .9; a.drawImage(sunGlow, SUN.x - (sunGlow.width >> 1), SUN.y - (sunGlow.height >> 1)); a.globalAlpha = 1; a.drawImage(sunDisk, SUN.x - SUN.r, SUN.y - SUN.r);
      const [sea, b] = canvas(W, H); b.drawImage(hills, 0, 0); for (let y = hz; y < H; y++) { const f = Math.pow((y - hz) / (H - hz), .8) * 2, i = Math.floor(f); b.fillStyle = css(mixc(P.sea[Math.min(i, 2)], P.sea[Math.min(i + 1, 2)], f - i)); b.fillRect(0, y, W, 1); }
      const [front, c] = canvas(W, H); c.drawImage(head, 0, 0); c.fillStyle = css(P.pierHi); c.fillRect(pr.x0, pr.y, pr.x1 - pr.x0, 1); c.fillStyle = css(P.pier); c.fillRect(pr.x0, pr.y + 1, pr.x1 - pr.x0, 1); for (let x = pr.x0 + 1; x < pr.x1; x += 5) c.fillRect(x, pr.y + 2, 1, 3 + ((x >> 2) & 1));
      Object.assign(S, { bgSky: sk, bgSea: sea, bgFront: front });
    },
    draw(T, I, A, F) {
      const { W, H, hz, pier: pr, light: L } = S, TAU = 6.283;
      g.drawImage(S.bgSky, 0, 0);
      for (const cl of S.clouds) g.drawImage(cl.spr, Math.round(((cl.x + A * cl.v * .6) % (W + cl.spr.width)) - cl.spr.width), cl.y);
      g.drawImage(S.bgSea, 0, 0);
      g.drawImage(S.sail, Math.round(((A * 1.1) % (W + 40)) - 20), hz - S.sail.height + 2 + Math.round(Math.sin(A * 1.3) * .6));
      const setE = env(T, 8.4, 9.2, 10.4, 11.6, E.sine) * I;
      // crests drift and breathe; in the wave set a brightness rolls toward the shore
      // (a colour string is parsed each time it is set: two fixed ones, the breathing in globalAlpha)
      const cHi = css(P.crest), cLo = css(P.crestLo); let fs = "";
      for (const c of S.crests) { const roll = setE * Math.max(0, 1 - Math.abs(((T - 8.4) / 3.2) - c.d) * 3), b = .55 + .35 * Math.sin(A * .9 + c.ph) + roll * .8; if (b < .25) continue; const col = roll > .3 ? cHi : cLo; if (col !== fs) g.fillStyle = fs = col; g.globalAlpha = clamp(b); g.fillRect(Math.round(c.x + Math.sin(A * .45 + c.ph) * 1.5), c.y, c.len + (roll > .5 ? 1 : 0), 1); }
      // the sun's path glitters; a sweep of light runs down it in the first beat
      g.fillStyle = css(P.glint);
      for (const s of S.path) { const sweep = env(T - ((s.y - hz) / (H - hz)) * 1.4, .4, .9, 1.3, 2.4, E.sine) * I, b = Math.pow(Math.max(0, Math.sin(A * 2.3 + s.ph)), 8) * .75 + sweep * .9; if (b < .06) continue; g.globalAlpha = clamp(b); g.fillRect(Math.round(s.x), s.y, 1, 1); if (b > .7) { g.globalAlpha = clamp(b * .4); g.fillRect(Math.round(s.x) - 1, s.y, 3, 1); } }
      g.globalAlpha = 1;
      g.drawImage(S.bgFront, 0, 0);
      // the lamp: a slow glow always, two flashes in the loop
      const flash = (env(T, 6.5, 6.72, 6.8, 7.4, E.sine) + env(T, 7.9, 8.12, 8.2, 9.0, E.sine)) * I, ly = S.lampY;
      g.fillStyle = css(P.lamp, clamp((.25 + .12 * Math.sin(A * 1.6) + flash * .75) * .6)); g.fillRect(L.x - 2, ly, 5, 1);
      if (flash > .08) { g.fillStyle = css(P.lampHi, clamp(flash)); g.fillRect(L.x - 1, ly, 3, 1); g.fillStyle = css(P.lamp, flash * .45); const k = Math.round(10 * flash); g.fillRect(L.x - k, ly, k * 2 + 1, 1); g.fillRect(L.x, ly - Math.round(k * .5), 1, k + 1); }
      g.drawImage(S.moored, pr.x1 - S.moored.width - 2, pr.y + 3 + Math.round(Math.sin(A * 1.6) * .8 + setE * Math.sin(T * 6) * 1.2));
      for (const [k, d, yy, amp] of [[0, 0, .22, 5], [1, .35, .28, 3]]) { const u = seg(T, 2.9 + d, 7.6 + d, E.sine); if (u <= 0 || u >= 1) continue; const fr = k === 1 && u > .4 && u < .72 ? 1 : [0, 1, 2, 1][Math.floor(T * (k ? 8 : 7)) % 4]; g.globalAlpha = I; g.drawImage(S.gull[fr], Math.round(lerp(W + 10, -12, u)), Math.round(H * yy + Math.sin(u * TAU * 1.2 + k) * amp)); g.globalAlpha = 1; }
      const fj = seg(T, 10.7, 11.35, E.io) * (I > .01 ? 1 : 0);
      if (fj > 0 && fj < 1) { g.fillStyle = css(P.fish, I); g.fillRect(Math.round(pr.x1 + 4 + fj * 8), Math.round(pr.y + 5 - Math.sin(fj * Math.PI) * 7), 2, 1); }
      const ring = env(T, 11.3, 11.4, 11.5, 11.95) * I; if (ring > 0) { const rr = Math.round(1 + seg(T, 11.3, 11.95) * 4), fx = pr.x1 + 12, fy = pr.y + 5; g.fillStyle = css(P.foam, ring); g.fillRect(fx - rr, fy, rr * 2 + 1, 1); g.fillRect(fx - rr + 1, fy - 1, 1, 1); g.fillRect(fx + rr - 1, fy - 1, 1, 1); }
      if (F >= 0) for (const b of S.flock) { const u = clamp((F - b.d) / .8); if (u <= 0 || u >= 1) continue; g.globalAlpha = u > .8 ? (1 - u) / .2 : 1; g.drawImage(S.gull[[0, 1, 2, 1][Math.floor(u * 28) % 4]], Math.round(b.x + b.dx * E.io(u)), Math.round(b.y + b.dy * E.out(u))); g.globalAlpha = 1; }
    },
  };
  return S;
}
