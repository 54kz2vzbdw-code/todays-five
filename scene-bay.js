// scene-bay.js — 1.12 b330: Sunset's and Dusk's scene (scenes.js loads it for either kit and says which). One bay, at the
// end of the day and just after it, drawn like a travel poster: flat headlands in layers, palms, still water, a sky in one
// long gradient with a band of halftone where it turns, and grain over all of it. The pad under the list hugs each line
// (scenes.js, `hug`), so the rest of the picture keeps its colour.
// Sunset: a huge sun going down between the headlands, cut into slits that slide, glowing, with rays turning slowly round
// it; its reflection a column of light on the water. The loop, fifteen seconds: the slits quicken and the horizon shimmers;
// a flock crosses the sun; a bank of cloud slides over it and its lower edge catches fire; a sailboat crosses the
// reflection; a flare streaks across as the palms toss; it settles. The finale: fireworks over the bay, and in the water.
// Dusk: the same bay at blue hour, a crescent moon and its path, and paper lanterns lit from inside, rising. The loop: the
// stars prick in; one lantern goes up from the beach, swaying, its light in the water under it; then the whole shore lets
// theirs go, near and far; an egret lifts off the shallows and its rings break the reflections; a star falls; the lanterns
// drift up and away. The finale: the whole festival goes up at once.
// (b347: whatever comes and goes does it whole — the flock off past the right edge, the egret away past one edge and
// home from the other to land in its rings, the loop's new stars gone again before it comes round.)
export default function bay(K, id) {
  const dusk = id === "dusk";
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  const P = dusk
    ? { sky: [[0, "#07061A"], [.34, "#15113D"], [.6, "#2C2364"], [.82, "#654790"], [.94, "#AE709C"], [1, "#DE98A4"]], sea: [[0, "#8C6CA0"], [.22, "#473472"], [.6, "#1C1644"], [1, "#0A0820"]], far: "#3A2C68", near: "#0D0B22", rim: "rgba(190,170,255,.55)", palm: "#0A081A" }
    : { sky: [[0, "#1E0F2E"], [.3, "#4A1846"], [.55, "#9C2A58"], [.74, "#E2544E"], [.9, "#F89B4E"], [1, "#FFC76E"]], sea: [[0, "#F28A4C"], [.2, "#C9445A"], [.58, "#6E1F48"], [1, "#2A0E26"]], far: "#8A2E52", near: "#2A0C22", rim: "rgba(255,170,110,.8)", palm: "#1C0716", sun: [[0, "#FFF7C0"], [.3, "#FFD55E"], [.55, "#FF9C45"], [.8, "#F4584F"], [1, "#D6336A"]] };
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
  const grad = (x, x0, y0, x1, y1, stops) => { const gr = x.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; };
  /** a soft glow: a radial gradient of one colour, from `a` at the middle to nothing, `r` CSS pixels across its radius */
  const glow = (r, [cr, cg, cb], a) => make(r * 2, r * 2, x => { const gr = x.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`); gr.addColorStop(.35, `rgba(${cr},${cg},${cb},${a * .45})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`); x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2); });
  const S = {
    res: "dpr",
    wash: 1, veil: .66, list: .35, hug: true, // dark kits; the pad hugs the lines, so the list's wash can be light; Everything, a dense list, gets more veil
    bind(ctx) { g = ctx; },
    /** where the words are (scenes.js): the sun slides along the horizon clear of the lines' ends, the fireworks go off in
     *  the clearest sky, and anything bright that passes behind a word fades there */
    words(rects) {
      S.wr = rects.map(([x0, y0, x1, y1]) => [x0 - 12, y0 - 8, x1 + 12, y1 + 8]);
      if (!S.W) return;
      const { W, H, hz, pr } = S;
      if (!dusk) { const R = S.sun.R, band = S.wr.filter(([x0, y0, x1, y1]) => y1 > hz - R * 1.05 && y0 < hz && x1 - x0 > 84); /* lines and pills, not a row's small tools */ const xr = band.reduce((m, r) => Math.max(m, r[2]), 0); S.sunTx = clamp(Math.max(pr ? W * .5 : W * .74, xr + R * 1.02), pr ? W * .5 : W * .6, W - R * .45); }
      // the fireworks: the four points of sky furthest from any word, the header and each other
      const pts = []; for (let gy = 1; gy < 9; gy++) for (let gx = 1; gx < 12; gx++) { const x = W * gx / 12, y = H * (.17 + gy / 9 * (hz / H - .3)); pts.push([x, y, S.clear(x, y) ]); }
      const pick = []; for (let k = 0; k < 4; k++) { let best = null, bs = -1; for (const p of pts) { const apart = pick.reduce((m, q) => Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1])), 1e9), sc = Math.min(p[2], 400) + Math.min(apart, W * .3) * .6; if (sc > bs) { bs = sc; best = p; } } pick.push(best); }
      if (S.fire) S.fire.forEach((f, i) => { f.x = pick[i][0]; f.y = pick[i][1]; });
    },
    /** how far (CSS pixels) a point is from the nearest word */
    clear(x, y) { let d = 1e9; for (const [x0, y0, x1, y1] of S.wr || []) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))); return d; },
    /** 1 clear of the words, down to a trace behind them */
    shade(x, y, r) { return lerp(.1, 1, clamp((S.clear(x, y) - r * .5) / (r * 1.2 + 10))); },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, u = Math.sqrt(W * H) / 100, r = rng(61);
      const hz = Math.round(H * (pr ? .73 : .78));
      Object.assign(S, { W, H, pr, u, hz });
      S.sun = pr ? { x: W * .5, y: hz, R: Math.min(W * .3, H * .15) } : { x: W * .72, y: hz, R: Math.min(W * .14, H * .21) };
      S.moon = pr ? { x: W * .76, y: H * .25, r: 3.6 * u } : { x: W * .8, y: H * .2, r: 2.6 * u };
      // the headlands: a far range, hazy, and a near one, dark, each a line of noise falling toward the middle
      const nL = K.noise1(3, 64), nR = K.noise1(5, 64), nF = K.noise1(9, 64);
      const ridge = (n, x0, x1, peak, fall, sc) => { const pts = []; for (let x = x0; x <= x1; x += 4) { const t = clamp((x - x0) / (x1 - x0)), shape = fall < 0 ? Math.pow(1 - t, 1.3) : Math.pow(t, 1.2); pts.push([x, hz - peak * shape * (.82 + .36 * K.fbm(n, x / sc, 3))]); } return pts; };
      S.left = ridge(nL, -8, W * (pr ? .42 : .36), (pr ? 20 : 17) * u, -1, 7 * u);
      S.right = ridge(nR, W * (pr ? .62 : .8), W + 8, (pr ? 17 : 15) * u, 1, 7 * u);
      S.farL = ridge(nF, -8, W * (pr ? .62 : .55), (pr ? 9 : 8) * u, -1, 11 * u);
      S.palms = (pr ? [[.84, 1], [.93, .86]] : [[.9, 1], [.955, .85], [.99, .7]]).map(([f, k], i) => { const x = W * f, top = S.right.reduce((a, p) => Math.abs(p[0] - x) < Math.abs(a[0] - x) ? p : a); return { x, y: top[1] + 1.5 * u, h: (pr ? 21 : 18) * u * k, lean: .42 - i * .3, ph: r() * TAU }; });
      // the backdrop: the sky, halftone where it turns, the far range, the sea, the near headlands with light on their rims, grain
      bg.fillStyle = grad(bg, 0, 0, 0, hz, P.sky); bg.fillRect(0, 0, W, hz);
      bg.fillStyle = grad(bg, 0, hz, 0, H, P.sea); bg.fillRect(0, hz, W, H - hz);
      for (const band of [.55, .74]) { const y0 = hz * band, step = pr ? 5 : 6, col = P.sky.find(([o]) => o >= band)[1]; bg.fillStyle = col; for (let row = 0; row < 5; row++) { const y = y0 - (row + .5) * step, rad = step * .42 * (1 - row / 5); if (rad < .3) continue; for (let x = (row % 2) * step / 2; x < W; x += step) { bg.beginPath(); bg.arc(x, y, rad, 0, TAU); bg.fill(); } } }
      if (dusk) for (let i = 0; i < (pr ? 110 : 220); i++) { const x = r() * W, y = r() * hz * .82, s = .4 + r() * .8; bg.globalAlpha = .15 + r() * .4 * (1 - y / hz); bg.fillStyle = "#EDE6FF"; bg.fillRect(x, y, s, s); } bg.globalAlpha = 1;
      const shape = (pts, col, closeY = hz + 1) => { bg.fillStyle = col; bg.beginPath(); bg.moveTo(pts[0][0], closeY); for (const p of pts) bg.lineTo(p[0], Math.min(closeY, p[1])); bg.lineTo(pts[pts.length - 1][0], closeY); bg.closePath(); bg.fill(); };
      shape(S.farL, P.far);
      for (const pts of [S.left, S.right]) { shape(pts, P.near); bg.strokeStyle = P.rim; bg.lineWidth = 1.2; bg.beginPath(); pts.forEach((p, i) => i ? bg.lineTo(p[0], p[1] + .6) : bg.moveTo(p[0], p[1] + .6)); bg.stroke(); }
      // the headlands in the water, dimmer
      bg.globalAlpha = .38; for (const pts of [S.left, S.right]) { bg.fillStyle = P.near; bg.beginPath(); bg.moveTo(pts[0][0], hz); for (const p of pts) bg.lineTo(p[0], hz + (hz - Math.min(hz, p[1])) * .5); bg.lineTo(pts[pts.length - 1][0], hz); bg.closePath(); bg.fill(); } bg.globalAlpha = 1;
      const tile = K.grain(120, 120, 5, dusk ? .07 : .09); bg.fillStyle = bg.createPattern(tile, "repeat"); bg.fillRect(0, 0, W, H);
      // what moves, made once: glows, the sun's disc, the clouds, the lanterns
      S.glints = Array.from({ length: pr ? 34 : 64 }, () => ({ y: r(), w: .3 + r(), ph: r() * TAU, f: .8 + r() * 1.6, s: r() - .5 }));
      S.sparkles = Array.from({ length: pr ? 26 : 50 }, () => ({ x: r(), y: r(), ph: r() * TAU, f: 1 + r() * 2 }));
      if (!dusk) {
        const { R } = S.sun;
        S.halo = glow(R * 2.4, [255, 150, 90], .55); S.core = glow(R * 1.25, [255, 214, 140], .6);
        S.disc = make(R * 2, R * 2, x => { x.fillStyle = grad(x, 0, 0, 0, R * 2, P.sun); x.beginPath(); x.arc(R, R, R, 0, TAU); x.fill(); const rim = x.createRadialGradient(R, R, R * .78, R, R, R); rim.addColorStop(0, "rgba(255,240,200,0)"); rim.addColorStop(1, "rgba(255,240,200,.45)"); x.fillStyle = rim; x.beginPath(); x.arc(R, R, R, 0, TAU); x.fill(); });
        const cloud = (x0, yf, k, v) => ({ x0: x0 * W, y: hz * yf, w: (pr ? 34 : 30) * u * k, h: (pr ? 3.4 : 2.6) * u * k, v: v * W / 10, lobes: Array.from({ length: 5 }, () => [.1 + r() * .8, .5 + r() * .5]) });
        S.clouds = [cloud(.55, .44, .9, .045), cloud(-.2, .2, 1.1, .03)]; S.hero = cloud(0, 0, 1.25, 0); // the hero crosses the sun in the loop
        S.flock = Array.from({ length: 9 }, (_, i) => ({ dx: -Math.abs(i - 4) * 3.2 * u, dy: (i - 4) * 1.9 * u, ph: r() * TAU, s: .8 + r() * .4 }));
        S.fire = [[.26, .22, 0], [.64, .14, .16], [.45, .3, .32], [.82, .26, .48]].map(([fx, fy, t], i) => ({ x: W * fx, y: H * fy, t, c: i, sparks: Array.from({ length: 44 }, () => ({ a: r() * TAU, v: .55 + r() * .45 })) }));
        S.fireRGB = ["255,214,120", "255,120,150", "255,246,230", "255,160,90"]; S.fireFlash = [[255, 214, 120], [255, 120, 150], [255, 246, 230], [255, 160, 90]].map(c => glow(9 * u, c, .8));
        S.flare = glow(12 * u, [255, 200, 150], .5);
      } else {
        const lr = (pr ? 3.6 : 2.8) * u;
        // a sky lantern: paper, taller than wide, narrower at its open foot where the flame is; lit from inside
        const lantern = () => make(lr * 3.2, lr * 4.2, x => {
          const w = lr * 2, h = lr * 2.7, ox = lr * .6, oy = lr * .6;
          x.save(); x.translate(ox, oy);
          const body = new Path2D(); body.moveTo(w * .08, 0); body.lineTo(w * .92, 0); body.quadraticCurveTo(w, 0, w * .96, h * .12); body.lineTo(w * .8, h); body.lineTo(w * .2, h); body.lineTo(w * .04, h * .12); body.quadraticCurveTo(0, 0, w * .08, 0); body.closePath();
          const gr = x.createRadialGradient(w * .5, h * .95, 0, w * .5, h * .6, h * .95); gr.addColorStop(0, "#FFF6CC"); gr.addColorStop(.35, "#FFC663"); gr.addColorStop(.75, "#F58A3C"); gr.addColorStop(1, "#C5502E");
          x.fillStyle = gr; x.fill(body);
          x.strokeStyle = "rgba(150,60,20,.35)"; x.lineWidth = Math.max(.6, lr * .06); for (const f of [.35, .65]) { x.beginPath(); x.moveTo(w * (.08 + f * .84), 0); x.lineTo(w * (.2 + f * .6), h); x.stroke(); }
          x.fillStyle = "#FFFBEA"; x.beginPath(); x.ellipse(w * .5, h * .93, w * .13, h * .05, 0, 0, TAU); x.fill();
          x.restore();
        });
        S.lantern = lantern(); S.lr = lr; S.lglow = glow(lr * 3.4, [255, 170, 80], .5);
        S.moonGlow = glow(S.moon.r * 6, [200, 190, 255], .35);
        const mr = S.moon.r; S.moonDisc = make(mr * 2 + 2, mr * 2 + 2, x => { x.fillStyle = "#F4EEFF"; x.beginPath(); x.arc(mr + 1, mr + 1, mr, 0, TAU); x.fill(); x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(mr + 1 + mr * .5, mr + 1 - mr * .22, mr * .92, 0, TAU); x.fill(); });
        const pool = (n, d0, d1) => Array.from({ length: n }, () => ({ x: r(), z: d0 + r() * (d1 - d0), ph: r() * TAU, sw: .5 + r() * 1.2, t: r() }));
        S.quietL = pool(pr ? 6 : 9, .2, .7);
        S.cascade = pool(pr ? 22 : 34, .15, 1).map((c, i) => Object.assign(c, { start: 4.6 + (i / (pr ? 22 : 34)) * 3.4 + r() * .4 }));
        S.festival = pool(pr ? 50 : 84, .1, 1).map(c => Object.assign(c, { lag: r() * .35 }));
        S.egret = { x: W * (pr ? .16 : .24), y: hz + (pr ? 8 : 6) * u };
      }
    },
    /** a palm frond from the crown `top` at angle `a`, length `L`: an arching spine, with leaflets hanging from it */
    frond(top, a, L) {
      const tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * .55 + L * .26], mid = [(top[0] + tip[0]) / 2, Math.min(top[1], tip[1]) - L * .18];
      g.lineWidth = Math.max(1, L * .045); g.beginPath(); g.moveTo(top[0], top[1]); g.quadraticCurveTo(mid[0], mid[1], tip[0], tip[1]); g.stroke();
      g.beginPath();
      for (let i = 1; i <= 7; i++) { const t = i / 8, x = (1 - t) * (1 - t) * top[0] + 2 * (1 - t) * t * mid[0] + t * t * tip[0], y = (1 - t) * (1 - t) * top[1] + 2 * (1 - t) * t * mid[1] + t * t * tip[1], len = L * .2 * (1 - t * .55), side = Math.cos(a) >= 0 ? 1 : -1;
        g.moveTo(x - side * L * .03, y); g.lineTo(x + side * len * .35, y + len); g.lineTo(x + side * L * .05, y + L * .01); }
      g.fill();
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, u, hz, pr } = S, on = I > .01;
      g.clearRect(0, 0, W, H);
      const add = (spr, x, y, a, s = 1) => { if (a <= .005) return; g.globalAlpha = clamp(a); g.drawImage(spr, x - spr.w2 * s / 2, y - spr.h2 * s / 2, spr.w2 * s, spr.h2 * s); };
      if (!dusk) {
        if (S.sunTx !== undefined) { const dt2 = S.lastA === undefined ? 1 : clamp(A - S.lastA, 0, .1); S.sun.x += (S.sunTx - S.sun.x) * (1 - Math.exp(-dt2 * 2)); } // it slides clear of the lines
        const { x: sx, y: sy, R } = S.sun;
        // rays turning slowly round the sun, only in the sky
        g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip(); g.globalCompositeOperation = "lighter";
        const rot = A * .035, flare = env(T, 10.6, 11.2, 12.0, 13.0, E.sine) * I;
        for (let k = 0; k < 14; k++) { const a = rot + k / 14 * TAU, w = .07; g.globalAlpha = .05 + .05 * flare; g.fillStyle = "#FFB070"; g.beginPath(); g.moveTo(sx, sy); g.arc(sx, sy, Math.max(W, H) * 1.2, a - w, a + w); g.closePath(); g.fill(); }
        add(S.halo, sx, sy, .85 + .15 * Math.sin(A * .7)); add(S.core, sx, sy, .9);
        // the disc, and its slits sliding down through the lower half, faster in the loop's first beat
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.drawImage(S.disc, sx - R, sy - R, R * 2, R * 2);
        const speed = .16 + env(T, .2, .8, 2.0, 2.8, E.sine) * I * .5; S.slide = (S.slide || 0) + (S.lastA === undefined ? 0 : clamp(A - S.lastA, 0, .1)) * speed; S.lastA = A;
        g.save(); g.beginPath(); g.arc(sx, sy, R + 1, 0, TAU); g.clip(); g.globalCompositeOperation = "destination-out";
        for (let k = 0; k < 9; k++) { const f = (k + (S.slide % 1)) / 8, yy = sy - R * .55 + f * R * .6, h = .6 + f * R * .085; g.fillRect(sx - R - 2, yy, R * 2 + 4, h); }
        g.restore(); g.restore();
        // a shimmer of heat along the horizon
        const heat = .5 + env(T, .2, .8, 2.2, 3.0, E.sine) * I * .5; g.globalCompositeOperation = "lighter";
        for (let k = 0; k < 4; k++) { const y = hz - (k + 1) * .9 * u, w = R * (1.3 - k * .22); g.globalAlpha = .12 * heat; g.fillStyle = "#FFD08A"; g.fillRect(sx - w + Math.sin(A * 3 + k * 1.7) * 2 * u, y, w * 2, .8); }
        // its reflection: a column of light on the water, bars wider near the horizon and further apart below
        for (const s of S.glints) { const y = hz + 2 + Math.pow(s.y, 1.5) * (H - hz) * .85, spread = R * (1.05 - s.y * .6), k = .5 + .5 * Math.sin(A * s.f + s.ph), w = spread * s.w * (.55 + .45 * k); g.globalAlpha = (.22 + .55 * k) * (1 - s.y * .6); g.fillStyle = s.y < .25 ? "#FFE3A0" : "#FFA864"; g.fillRect(sx - w / 2 + s.s * spread * .5, y, w, 1 + (1 - s.y) * 1.6); }
        for (const p of S.sparkles) { const k = Math.pow(Math.max(0, Math.sin(A * p.f + p.ph)), 8); if (k < .05) continue; const x = p.x * W, y = hz + 4 + p.y * (H - hz) * .9; g.globalAlpha = k * .8; g.fillStyle = "#FFF1D0"; g.fillRect(x - 1, y - .5, 2 + k * 3, 1); }
        g.globalCompositeOperation = "source-over";
        // the clouds: flat banks, magenta, their undersides catching fire where they cross the sun
        const bank = (c, x0, y, a) => { if (a <= .01) return; const near = clamp(1 - Math.abs(x0 + c.w / 2 - sx) / (R * 2.2)) * clamp(1 - Math.abs(y - sy) / (R * 1.4)); g.globalAlpha = a;
          // three strips, each shorter and further in than the one below it; each lit along its lower edge
          for (const [k, off, dy] of [[1, 0, 0], [.72, .1, -1.05], [.42, .26, -2.1]]) { const w = c.w * k, x = x0 + c.w * off + c.lobes[0][0] * c.h * (k < 1 ? 1 : 0), yy = y + dy * c.h, hh = c.h;
            g.fillStyle = "#6A1F4E"; g.beginPath(); g.roundRect(x, yy - hh / 2, w, hh, hh / 2); g.fill();
            g.fillStyle = `rgba(255,${Math.round(140 + 90 * near)},${Math.round(80 + 70 * near)},${(.35 + .6 * near).toFixed(3)})`; g.beginPath(); g.roundRect(x + hh * .3, yy + hh * .18, w - hh * .6, hh * .32, hh * .16); g.fill(); } };
        for (const c of S.clouds) bank(c, ((c.x0 + A * c.v) % (W + c.w * 2)) - c.w, c.y, 1);
        const across = seg(T, 4.6, 9.4, E.io); if (on && across > 0 && across < 1) bank(S.hero, lerp(sx - R * 2.4 - S.hero.w, sx + R * 1.6, across), sy - R * .42, I * env(across, 0, .12, .88, 1));
        g.globalAlpha = 1;
        // a flock across the sun
        const fb = seg(T, 2.4, 5.8, x => x); if (on && fb > 0 && fb < 1) { const lx = lerp(-4 * u, W + 17 * u, fb), /* the last of the V off the right before it is gone */ ly = sy - R * .6 + Math.sin(fb * 5) * 2 * u; g.fillStyle = P.palm; g.globalAlpha = I;
          for (const b of S.flock) { const x = lx + b.dx, y = ly + b.dy, s = b.s * u, fl = Math.sin(A * 11 + b.ph); g.beginPath(); g.moveTo(x - 2.4 * s, y - fl * 1.3 * s); g.quadraticCurveTo(x - 1 * s, y - .8 * s, x, y + .3 * s); g.quadraticCurveTo(x + 1 * s, y - .8 * s, x + 2.4 * s, y - fl * 1.3 * s); g.quadraticCurveTo(x + 1 * s, y + .1 * s, x, y + .9 * s); g.quadraticCurveTo(x - 1 * s, y + .1 * s, x - 2.4 * s, y - fl * 1.3 * s); g.fill(); } }
        // a sailboat across the reflection
        const sb = seg(T, 7.4, 11.0, x => x); if (on && sb > 0 && sb < 1) { const bx = lerp(W * 1.06, -W * .08, sb), by = hz + 1.6 * u, s = u * (pr ? 1.1 : .9); g.globalAlpha = I; g.fillStyle = P.palm;
          g.beginPath(); g.moveTo(bx - 3.2 * s, by); g.lineTo(bx + 3.2 * s, by); g.lineTo(bx + 2.3 * s, by + 1.3 * s); g.lineTo(bx - 2.3 * s, by + 1.3 * s); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(bx - .2 * s, by - .2 * s); g.lineTo(bx - .2 * s, by - 8.5 * s); g.lineTo(bx + 3.6 * s, by - .8 * s); g.closePath(); g.fill(); g.beginPath(); g.moveTo(bx - .6 * s, by - 7.5 * s); g.lineTo(bx - .6 * s, by - 1 * s); g.lineTo(bx - 3 * s, by - 1 * s); g.closePath(); g.fill();
          g.globalAlpha = .35 * I; g.fillRect(bx - 2.8 * s, by + 1.8 * s, 5.6 * s, .5 * s); }
        // a flare streaking across, and the ghosts it leaves
        if (flare > .01) { g.globalCompositeOperation = "lighter"; const fx = lerp(sx - R * 3, sx + R * 3, seg(T, 10.6, 13.0, E.io)); g.globalAlpha = flare * .5; g.fillStyle = "#FFD6A0"; g.fillRect(0, sy - R * .08, W, 1.4); add(S.flare, sx, sy - R * .05, flare * .7, 1.6); for (const [k, s2] of [[.4, .5], [.8, .8], [1.3, .35]]) add(S.flare, lerp(sx, W - fx, k), lerp(sy, H * .3, k), flare * .35, s2); g.globalCompositeOperation = "source-over"; }
        // the finale: fireworks over the bay, and in the water
        // crisp sparks streaking out with hot heads, a flash where each bursts, and all of it again, dimmer, in the water
        if (F >= 0) { g.globalCompositeOperation = "lighter"; g.lineCap = "round";
          for (const f of S.fire) { const k = clamp((F - f.t) / .5); if (k <= 0 || k >= 1) continue; const rad = E.out(k) * Math.min((pr ? 21 : 16) * u, Math.max(40, S.clear(f.x, f.y) * .9)), a = k < .55 ? 1 : (1 - k) / .45, drop = k * k * 6 * u;
            if (k < .2) add(S.fireFlash[f.c], f.x, f.y, (1 - k / .2) * .9, .7 + k * 2);
            for (const [mirror, am] of [[false, 1], [true, .28]]) {
              const Y = y => mirror ? hz + (hz - y) * .38 : y; if (mirror && f.y > hz) continue;
              g.strokeStyle = `rgba(${S.fireRGB[f.c]},${(a * am).toFixed(3)})`; g.lineWidth = mirror ? 1 : 1.7; g.beginPath();
              for (const sp of f.sparks) { const d = rad * sp.v, d0 = Math.max(0, d - rad * .3), c = Math.cos(sp.a), s2 = Math.sin(sp.a), hx = f.x + c * d, hy = f.y + s2 * d + drop; if (!mirror && S.shade(hx, hy, 6) < .5) continue; g.moveTo(f.x + c * d0, Y(f.y + s2 * d0 + drop * .6)); g.lineTo(hx, Y(hy)); }
              g.stroke();
              if (!mirror) { g.fillStyle = `rgba(255,250,236,${a.toFixed(3)})`; for (const sp of f.sparks) { const d = rad * sp.v, hx = f.x + Math.cos(sp.a) * d, hy = f.y + Math.sin(sp.a) * d + drop; if (S.shade(hx, hy, 6) < .5) continue; g.fillRect(hx - 1.2, hy - 1.2, 2.4, 2.4); } }
            } }
          g.globalCompositeOperation = "source-over"; }
        // the palms, their fronds in the breeze; a gust as the flare passes
        const gust = env(T, 10.8, 11.6, 12.6, 13.6, E.sine) * I; g.globalAlpha = 1; g.fillStyle = g.strokeStyle = P.palm;
        for (const p of S.palms) { const top = [p.x + p.lean * p.h * .45, p.y - p.h]; g.lineWidth = 1.1 * u; g.lineCap = "round"; g.beginPath(); g.moveTo(p.x, p.y); g.quadraticCurveTo(p.x + p.lean * p.h * .05, p.y - p.h * .5, top[0], top[1]); g.stroke();
          for (let k = 0; k < 8; k++) S.frond(top, -Math.PI * .98 + k / 7 * Math.PI * .96 + Math.sin(A * 1.1 + p.ph + k) * .05 + gust * .25 * Math.sin(A * 6 + k), p.h * (.44 + (k % 2) * .08)); }
      } else {
        // the stars that twinkle, pricking in at the loop's start
        const prick = seg(T, .2, 2.6, x => x) * I * (1 - seg(T, 13.3, 14.9, E.sine)); /* the new ones gone again before the loop comes round */
        g.fillStyle = "#F4F0FF"; for (const p of S.sparkles) { const shown = p.ph < 3.6 ? 1 : clamp((3.6 + prick * 2.7 - p.ph) / .35); if (shown <= 0) continue; const k = .35 + .65 * Math.pow(Math.max(0, Math.sin(A * p.f + p.ph)), 3); const x = p.x * W, y = H * .09 + p.y * (hz * .75 - H * .09), s = 1 + (p.f > 2.4 ? 1 : 0); g.globalAlpha = k * shown * S.shade(x, y, 4); g.fillRect(x, y, s, s); }
        // the moon, a crescent with its halo, and its path on the water
        const { x: mx, y: my, r: mr } = S.moon; g.globalCompositeOperation = "lighter"; add(S.moonGlow, mx, my, .8); g.globalCompositeOperation = "source-over";
        g.globalAlpha = 1; g.drawImage(S.moonDisc, mx - mr - 1, my - mr - 1, S.moonDisc.w2, S.moonDisc.h2);
        g.globalCompositeOperation = "lighter"; for (const s of S.glints) { const y = hz + 2 + Math.pow(s.y, 1.3) * (H - hz) * .85, k = .5 + .5 * Math.sin(A * s.f + s.ph), w = (4 + s.w * 9) * u * (1 - s.y * .5) * k; g.globalAlpha = (.12 + .2 * k) * (1 - s.y * .5); g.fillStyle = "#CFC6FF"; g.fillRect(mx - w / 2 + s.s * 5 * u, y, w, .9); }
        // a star falls
        const fall = seg(T, 11.2, 12.1, E.in) * I; if (fall > 0 && fall < 1) { const x = lerp(W * .38, W * .7, fall), y = lerp(H * .2, H * .4, fall), fa = S.shade(x, y, 14 * u); const gr = g.createLinearGradient(x, y, x - 14 * u, y - 7 * u); gr.addColorStop(0, `rgba(255,255,255,${(.9 * (1 - fall) * fa).toFixed(3)})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.globalAlpha = 1; g.strokeStyle = gr; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 14 * u, y - 7 * u); g.stroke(); }
        g.globalCompositeOperation = "source-over";
        // lanterns: a few far ones always, one from the beach, the whole shore's, the festival's; each with its light in the water
        const lant = (xn, rise, z, sw, ph, a) => {
          if (a <= .01) return; const s = lerp(.35, 1.45, z), x = xn * W + Math.sin(A * .9 * sw + ph) * 1.6 * u * s, y = lerp(hz - 1.4 * u, H * .1, rise), flick = .88 + .12 * Math.sin(A * 13 + ph * 3) * Math.sin(A * 7.3 + ph);
          a *= S.shade(x, y, S.lr * s * 3.4) * (1 - clamp((H * .32 - y) / (H * .14))); if (a <= .01) return; // it fades as its glow nears a word; it's gone well before the header
          const spr = S.lantern; g.globalCompositeOperation = "lighter"; add(S.lglow, x, y, a * .75 * flick, s); g.globalCompositeOperation = "source-over"; add(spr, x, y, a * clamp(1.2 - z * .2), s);
          if (y < hz && rise < .45) { g.globalCompositeOperation = "lighter"; g.globalAlpha = a * .35 * (1 - rise / .45) * flick; g.fillStyle = "#FFB45C"; const ry = hz + (hz - y) * .45, rw = S.lr * s * 1.1; g.fillRect(x - rw / 2 + Math.sin(A * 3 + ph) * u * .6, ry, rw, 1.2 + s); g.fillRect(x - rw * .3, ry + 3 * s, rw * .6, 1); g.globalCompositeOperation = "source-over"; }
        };
        for (const q of S.quietL) { const rq = (q.t + A * .006 * (1 + q.z)) % 1 * .75 + .15; lant(q.x, rq, q.z * .6, q.sw, q.ph, .85 * clamp((rq - .15) / .09)); } /* each fades in as it leaves the water */
        const first = seg(T, 2.4, 9.4, E.sine); if (on && first > 0 && first < 1) lant(.5, first, .95, 1, 0, I * (1 - seg(first, .85, 1)) * clamp(first * 12));
        for (const c of S.cascade) { const k = seg(T, c.start, c.start + 6.5, E.sine); if (!on || k <= 0 || k >= 1) continue; lant(c.x, k, c.z, c.sw, c.ph, I * (1 - seg(k, .82, 1)) * clamp(k * 14)); }
        if (F >= 0) for (const f of S.festival) { const k = clamp((F - f.lag) / (1 - f.lag)); if (k <= 0 || k >= 1) continue; lant(f.x, E.sine(k), f.z, f.sw, f.ph, clamp(k * 10) * (1 - seg(k, .8, 1))); }
        // the egret: standing in the shallows, then up and away, its rings spreading
        const es = u * (pr ? 1.15 : .95), x0 = S.egret.x, y0 = S.egret.y, away = seg(T, 9.0, 11.3, E.in), home = seg(T, 12.3, 14.6, E.out);
        let ex = x0, ey = y0, up = 0; /* up: 0 standing … 1 in the air */
        if (home > 0) { ex = lerp(-10 * es, x0, home); ey = y0 - (1 - home) * H * .2 - Math.sin(home * Math.PI) * H * .03; up = 1 - seg(home, .85, 1); }
        else if (away > 0) { ex = lerp(x0, W + 10 * es, away); ey = y0 - Math.sin(away * Math.PI / 2) * H * .28; up = away >= 1 ? 2 : 1; }
        ex = lerp(x0, ex, I); ey = lerp(y0, ey, I); if (I < .99 && up === 2) up = 1; /* touched, it settles back where it stands */
        const flap = up > 0 && up <= 1 ? Math.sin(A * 9) * (home > 0 ? 1 - home * .6 : 1) : 0;
        if (up < 2) { g.globalAlpha = S.shade(ex, ey, 8 * es); g.fillStyle = "#EFE8FF"; g.beginPath(); g.ellipse(ex, ey, 2.4 * es, 1 * es, -.2, 0, TAU); g.fill(); g.strokeStyle = "#EFE8FF"; g.lineWidth = .55 * es; g.beginPath(); g.moveTo(ex + 1.8 * es, ey - .4 * es); g.quadraticCurveTo(ex + 2.6 * es, ey - 3.4 * es, ex + 3.4 * es, ey - 3.2 * es); g.stroke();
          if (up > 0) { g.beginPath(); g.moveTo(ex - 1.5 * es, ey); g.quadraticCurveTo(ex - 3 * es, ey - 3.2 * es * flap, ex - 6 * es, ey - 4.4 * es * flap); g.quadraticCurveTo(ex - 2 * es, ey - .5 * es, ex, ey); g.fill(); }
          else { g.strokeStyle = "#CFC5E6"; g.lineWidth = .3 * es; g.beginPath(); g.moveTo(ex, ey + .8 * es); g.lineTo(ex, ey + 3 * es); g.stroke(); } }
        const land = seg(T, 14.2, 15.0, E.out) * I; if (land > 0 && land < 1) for (let k = 0; k < 2; k++) { const q = clamp(land * 1.2 - k * .2); if (q <= 0) continue; g.globalAlpha = (1 - q) * .4; g.strokeStyle = "#C4B4E8"; g.lineWidth = .7; g.beginPath(); g.ellipse(x0, y0 + 3 * es, q * 11 * u, q * 2 * u, 0, 0, TAU); g.stroke(); } /* a ring or two as it lands */
        const rip = seg(T, 9.0, 12.0, E.out) * I; if (rip > 0 && rip < 1) for (let k = 0; k < 3; k++) { const q = clamp(rip * 1.3 - k * .15); if (q <= 0) continue; g.globalAlpha = (1 - q) * .55; g.strokeStyle = "#C4B4E8"; g.lineWidth = .8; g.beginPath(); g.ellipse(S.egret.x, S.egret.y + 3 * es, q * 18 * u, q * 3 * u, 0, 0, TAU); g.stroke(); }
        // the palms, dark against the last light
        g.globalAlpha = 1; g.fillStyle = g.strokeStyle = P.palm;
        for (const p of S.palms) { const top = [p.x + p.lean * p.h * .45, p.y - p.h]; g.lineWidth = 1.1 * u; g.lineCap = "round"; g.beginPath(); g.moveTo(p.x, p.y); g.quadraticCurveTo(p.x + p.lean * p.h * .05, p.y - p.h * .5, top[0], top[1]); g.stroke();
          for (let k = 0; k < 8; k++) S.frond(top, -Math.PI * .98 + k / 7 * Math.PI * .96 + Math.sin(A * .9 + p.ph + k) * .04, p.h * (.44 + (k % 2) * .08)); }
      }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    },
  };
  return S;
}
