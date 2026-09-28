// scene-cocoa.js — 1.12 b336: Cocoa's scene (scenes.js loads it). A café table seen from above, dark walnut planks,
// and on it, in the largest open space on the page (scenes.js, `words`), a cup of cocoa on its saucer with latte art on
// top — a stacked heart, a line of crema between one pour and the next — a spoon, a few beans. The morning's light falls
// across the table through a window, in four soft panes, round the cup: the leaves outside move their shadows through it,
// dust drifts in it, the cup's shadow lies in it. While the list is in use it steams and the foam shimmers. The loop,
// fifteen seconds: the spoon stirs the old pattern away into a swirl; a new pour blooms on the surface, rings pushed into
// rings, and the pull-through turns them into a heart; marshmallows drop in, bob and drift and melt; a cloud goes over and
// the light dims and comes back; cinnamon dusts the top; the steam curls up. The finale: small foam hearts bloom round
// the big one and the steam rises in a heart.
export default function cocoa(K) {
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  /** a sprite drawn smooth at the screen's density, `w` by `h` CSS pixels */
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
  const FOAM = "#F3E4CC", CREMA = "rgba(112,58,28,.82)";
  /** a ring of foam at radius r about (0, cy), pulled into a heart by `pull` (0 round … 1 heart), stirred by `twist` */
  const shape = (r, cy, pull, twist, wob, n = 72) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; let x = Math.cos(a) * r * (1 + wob * Math.sin(a * 5 + r * 20)), y = cy + Math.sin(a) * r * (1 + wob * Math.cos(a * 4 + r * 13));
    const top = y < cy, gx = Math.exp(-Math.pow(x / (r * (top ? .24 : .22)), 2)); y += pull * r * (top ? .34 : .5) * gx; // the notch where the pour came in, the point where it left
    if (twist) { const d = Math.hypot(x, y), t = twist * (1.4 - d) * 2.2, c = Math.cos(t), s = Math.sin(t); [x, y] = [x * c - y * s, x * s + y * c]; }
    return [x, y]; });
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .7, hugFinale: true, list: .4, // a dark kit; the table is behind the words, and the lines and the finale's words sit on pads
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(97);
      Object.assign(S, { W, H, pr, Rmin: pr ? 40 : 46, Rmax: pr ? 150 : 240 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .32, 120) : Math.min(W * .15, H * .3); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .76 : H * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: pr ? H * .76 : H * .5, tR: R0 }); }
      S.mallows = [[.28, -.3, 0, 6.2], [-.3, .05, .6, 6.7], [.1, .34, 1.2, 7.2]].map(([u, v, rot, t]) => ({ u, v, rot, t, ph: r() * TAU }));
      S.dust = Array.from({ length: 160 }, () => { const a = r() * TAU, d = Math.sqrt(r()) * .78; return { u: Math.cos(a) * d, v: Math.sin(a) * d, s: .006 + r() * .008, t: 9.0 + r() * 1.3 }; });
      S.minis = Array.from({ length: 6 }, (_, i) => { const a = i / 6 * TAU + .3; return { u: Math.cos(a) * .7, v: Math.sin(a) * .7, t: .1 + i * .07 }; });
      S.beans = [[-.95, .72, .6], [-1.02, .52, 2.1], [.98, -.78, 1.3]].map(([u, v, a]) => ({ u, v, a }));
      // the window's light, drawn once: four panes, soft at the edges, skewed as it falls across the table; a leaf's shadow
      S.win = make(280, 184, x => { x.transform(1, 0, -.28, 1, 54, 0); for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const w = 96, h = 78, ox = 14 + i * (w + 12), oy = 8 + j * (h + 12); for (let q = 0; q < 9; q++) { x.fillStyle = "rgba(255,176,96,.12)"; x.beginPath(); x.roundRect(ox + q * 1.6, oy + q * 1.6, w - q * 3.2, h - q * 3.2, 6); x.fill(); } } });
      S.pad = make(160, 80, x => { for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(24,16,11,.15)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } }); /* the shade under a line */
      S.soft = make(64, 64, x => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(.5, "rgba(0,0,0,.75)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });
      S.leaves = Array.from({ length: 16 }, () => ({ u: (r() - .5) * 4.2, v: (r() - .5) * 3, s: .22 + r() * .4, ph: r() * TAU, f: .35 + r() * .5, a: .3 + r() * .4 }));
      S.motes = Array.from({ length: 34 }, () => ({ u: (r() - .5) * 3.6, v: (r() - .5) * 3.2, s: .6 + r() * 1.3, ph: r() * TAU, f: .5 + r() * 1.2, dr: .03 + r() * .05 }));
      // the table: walnut planks, their grain, their seams, a warm light falling off toward the edges
      const bw = pr ? 70 : 90;
      bg.fillStyle = "#24170F"; bg.fillRect(0, 0, W, H);
      const n1 = K.noise1(3, 64), n2 = K.noise1(8, 64);
      for (let y = 0, k = 0; y < H; y += bw, k++) {
        const base = [41 + r() * 9, 28 + r() * 5, 20 + r() * 4]; bg.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`; bg.fillRect(0, y, W, bw - 1.5);
        for (let l = 0; l < 14; l++) { const yy = y + 3 + l * (bw - 6) / 14, ph = r() * 50; bg.strokeStyle = `rgba(${l % 3 ? "20,12,8" : "84,58,40"},${(.16 + r() * .14).toFixed(3)})`; bg.lineWidth = .6 + r() * .9; bg.beginPath(); for (let x = 0; x <= W; x += 12) { const w = K.fbm(n1, (x + ph * 40) / 180, 3) * 7 + Math.sin(x / 90 + ph) * 1.5; x ? bg.lineTo(x, yy + w) : bg.moveTo(x, yy + w); } bg.stroke(); }
        const knot = r() < .5; if (knot) { const kx = r() * W, ky = y + bw * (.3 + r() * .4); for (let q = 0; q < 5; q++) { bg.strokeStyle = `rgba(18,10,6,${(.35 - q * .05).toFixed(3)})`; bg.lineWidth = 1; bg.beginPath(); bg.ellipse(kx, ky, 8 + q * 5, 3 + q * 2, 0, 0, TAU); bg.stroke(); } }
        bg.fillStyle = "rgba(10,6,4,.8)"; bg.fillRect(0, y + bw - 1.5, W, 1.5);
      }
      const vg = bg.createRadialGradient(W * .55, H * .45, Math.min(W, H) * .2, W * .5, H * .5, Math.max(W, H) * .8); vg.addColorStop(0, "rgba(8,4,2,0)"); vg.addColorStop(1, "rgba(8,4,2,.62)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      // the bar along the top and the keyboard line along the foot keep to the kit's ink: the planks go into shadow there
      for (const [y0, y1] of [[0, pr ? 150 : 110], [H, H - (pr ? 120 : 130)]]) { const sg = bg.createLinearGradient(0, y0, 0, y1); sg.addColorStop(0, "rgba(42,31,26,1)"); sg.addColorStop(.45, "rgba(42,31,26,1)"); sg.addColorStop(.75, "rgba(42,31,26,.5)"); sg.addColorStop(1, "rgba(42,31,26,0)"); bg.fillStyle = sg; bg.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)); }
      if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the largest circle of open table; the cup settles there, as big as it allows */
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
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl;
      S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4));
      /** under each line, the table in shadow: the planks and the window's light step back from the words (the stage lays its pads over this) */
      const shade = () => { g.save(); g.globalCompositeOperation = "source-over"; g.globalAlpha = .82; for (const [x0, y0, x1, y1, kind] of S.raw || []) if (kind === 1) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } g.restore(); };
      if (S.vis < .01) { shade(); return; }
      const { cx, cy, R } = S, on = I > .01, L = v => lerp(1, v, I);
      g.save(); g.globalAlpha = S.vis;
      const SR = R * .92, CR = R * .6, LR = R * .52; // the saucer, the cup's rim, the cocoa's surface
      // the morning's light through a window, across the table round the cup; the leaves outside moving their shadows
      // through it; the cup's shadow in it; a cloud goes over and it dims and comes back
      const sun = 1 - .72 * (on ? env(T, 8.2, 9.0, 9.7, 10.7, E.sine) * I : 0), ww = R * 4.8, wh = ww * 184 / 280;
      g.save(); g.translate(cx + R * .3, cy + R * .12); g.rotate(-.16 + Math.sin(A * .05) * .02); g.globalAlpha = S.vis * .62 * sun; g.drawImage(S.win, -ww / 2, -wh / 2, ww, wh);
      g.globalCompositeOperation = "destination-out"; for (const l of S.leaves) { const z = l.s * R * 2, x = l.u * R + Math.sin(A * l.f + l.ph) * R * .12, y = l.v * R + Math.sin(A * l.f * .8 + l.ph * 2) * R * .07; g.globalAlpha = l.a; g.drawImage(S.soft, x - z / 2, y - z / 2, z, z * .8); }
      g.restore(); g.save(); g.globalCompositeOperation = "destination-out"; g.globalAlpha = .92; g.translate(cx + R * .22, cy + R * .3); g.rotate(.9); g.drawImage(S.soft, -SR * 1.25, -SR * 1.05, SR * 2.5, SR * 2.1); g.restore(); /* the cup's shadow: the light taken away */
      g.globalCompositeOperation = "destination-out"; for (const [y0, y1] of [[0, S.pr ? 150 : 110], [H, H - (S.pr ? 120 : 130)]]) { const eg = g.createLinearGradient(0, y0, 0, y1); eg.addColorStop(0, "#000"); eg.addColorStop(.45, "#000"); eg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = eg; g.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)); } g.globalCompositeOperation = "source-over"; /* nor into the shadow at the top and the foot */
      shade();
      let gr;
      // shadows on the table, the saucer, its rim
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx + R * .06, cy + R * .09, SR * 1.02, SR * 1.02, 0, 0, TAU); g.fill();
      gr = g.createRadialGradient(cx - SR * .3, cy - SR * .35, SR * .1, cx, cy, SR); gr.addColorStop(0, "#FBF6EE"); gr.addColorStop(.7, "#E9DFD0"); gr.addColorStop(1, "#C9BBA6");
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, SR, 0, TAU); g.fill();
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = SR * .02; g.beginPath(); g.arc(cx, cy, SR * .97, Math.PI * 1.05, Math.PI * 1.65); g.stroke();
      g.strokeStyle = "rgba(120,95,70,.25)"; g.lineWidth = SR * .03; g.beginPath(); g.arc(cx, cy, SR * .76, 0, TAU); g.stroke();
      // the beans on the table
      for (const b of S.beans) { const bx = cx + b.u * R, by = cy + b.v * R, s = R * .06; g.save(); g.translate(bx, by); g.rotate(b.a); gr = g.createRadialGradient(-s * .3, -s * .3, s * .1, 0, 0, s); gr.addColorStop(0, "#7A4A2A"); gr.addColorStop(1, "#2E170C"); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, s, s * .68, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(20,8,4,.8)"; g.lineWidth = s * .12; g.beginPath(); g.moveTo(-s * .7, 0); g.quadraticCurveTo(0, s * .25, s * .7, 0); g.stroke(); g.restore(); }
      // the spoon, resting on the saucer
      g.save(); g.translate(cx - SR * .62, cy + SR * .5); g.rotate(-.75); gr = g.createLinearGradient(0, -R * .03, 0, R * .03); gr.addColorStop(0, "#F0F0F4"); gr.addColorStop(.5, "#A9AAB4"); gr.addColorStop(1, "#E4E4EA");
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, R * .09, R * .055, 0, 0, TAU); g.fill(); g.fillRect(R * .08, -R * .012, R * .4, R * .024); g.restore();
      // the cup: its shadow on the saucer, its handle, its rim, the wall inside
      g.fillStyle = "rgba(90,60,35,.3)"; g.beginPath(); g.arc(cx + R * .04, cy + R * .06, CR * 1.02, 0, TAU); g.fill();
      g.save(); g.translate(cx, cy); g.rotate(.62); gr = g.createLinearGradient(CR, 0, CR + R * .26, 0); gr.addColorStop(0, "#EDE5D8"); gr.addColorStop(1, "#C8BBA8"); g.strokeStyle = gr; g.lineWidth = R * .075; g.beginPath(); g.ellipse(CR + R * .1, 0, R * .13, R * .1, 0, -1.9, 1.9); g.stroke(); g.restore();
      gr = g.createRadialGradient(cx - CR * .35, cy - CR * .4, CR * .2, cx, cy, CR); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.8, "#EFE7DA"); gr.addColorStop(1, "#CDBFAC"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, CR, 0, TAU); g.fill();
      gr = g.createRadialGradient(cx + LR * .15, cy + LR * .2, LR * .7, cx, cy, LR * 1.08); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(60,35,20,.4)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, LR * 1.08, 0, TAU); g.fill();
      g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = R * .012; g.beginPath(); g.arc(cx, cy, CR * .985, Math.PI * 1.1, Math.PI * 1.55); g.stroke();
      // the cocoa, milkier where it's been stirred, and its crema ring
      const stir = on ? seg(T, .4, 2.2, E.io) * I : 0, pour = on ? seg(T, 2.3, 5.9, x => x) : 1, milky = on ? env(T, .4, 2.2, 2.4, 4.0) * I : 0;
      gr = g.createRadialGradient(cx - LR * .2, cy - LR * .25, LR * .05, cx, cy, LR); gr.addColorStop(0, milky > .01 ? `rgb(${lerp(110, 150, milky) | 0},${lerp(64, 98, milky) | 0},${lerp(38, 62, milky) | 0})` : "#6E4026"); gr.addColorStop(.75, "#4A2918"); gr.addColorStop(1, "#8A5A38");
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, LR, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.arc(cx, cy, LR * .995, 0, TAU); g.clip(); g.translate(cx, cy); g.scale(LR, LR);
      // the latte art: three rings of foam, pulled into a heart; stirred away first, poured again
      const P = L(on && T > 2.2 ? pour : 1), grow = [seg(P, 0, .3, E.out), seg(P, .28, .5, E.out), seg(P, .46, .66, E.out), seg(P, .62, .8, E.out)], pull = seg(P, .82, 1, E.io), shimmer = Math.sin(A * 2) * .006;
      const foam = g.createRadialGradient(-.18, -.22, .04, 0, 0, .8); foam.addColorStop(0, "#FFFAF0"); foam.addColorStop(.6, "#F4E4CA"); foam.addColorStop(1, "#E4CBA6");
      const fade = on && T < 2.3 ? 1 - seg(T, 1.2, 2.2, x => x) * I : 1, twist = on && T < 2.3 ? stir : 0;
      const rings = [[.68, .02], [.53, .06], [.39, .1], [.25, .14]];
      if (fade > .01) rings.forEach(([r2, cy2], i) => { const k = grow[i]; if (k <= 0) return; const pts = shape(r2 * k, cy2 * k, pull, twist, .012 + shimmer, 72); g.globalAlpha = S.vis * fade; g.beginPath(); pts.forEach(([u, v], j) => j ? g.lineTo(u, v) : g.moveTo(u, v)); g.closePath();
        if (i) { g.strokeStyle = CREMA; g.lineWidth = .045; g.stroke(); } else { g.strokeStyle = "rgba(236,214,182,.5)"; g.lineWidth = .05; g.stroke(); } /* a line of crema between one pour and the next; the first one's edge soft */
        g.fillStyle = foam; g.fill(); });
      if (pull > 0 && fade > .01) { g.globalAlpha = S.vis * fade; g.strokeStyle = FOAM; g.lineWidth = .035 * (1 - pull * .5); g.beginPath(); g.moveTo(0, -.72 + (1 - pull) * .4); g.lineTo(0, .74 * pull); g.stroke(); } // the pull-through's thread
      // the pour: a stream seen from above, ripples round it
      if (on && T > 2.3 && T < 5.9) { const pp = seg(T, 2.3, 5.9, x => x), py = lerp(-.2, .55, E.io(pp)); g.globalAlpha = S.vis * I; for (let q = 0; q < 3; q++) { const rr = ((A * 1.6 + q / 3) % 1) * .22; g.strokeStyle = `rgba(243,228,204,${(.5 * (1 - rr / .22)).toFixed(3)})`; g.lineWidth = .012; g.beginPath(); g.arc(0, py, rr, 0, TAU); g.stroke(); } g.fillStyle = "#FFF7EA"; g.beginPath(); g.arc(0, py, .07, 0, TAU); g.fill(); }
      // cinnamon, dusted on
      for (const d of S.dust) { const k = L(T < 2.3 ? 1 - stir : T >= d.t ? 1 : 0); if (k <= .01) continue; g.globalAlpha = S.vis * k; g.fillStyle = "rgba(140,70,30,.55)"; g.fillRect(d.u - d.s / 2, d.v - d.s / 2, d.s, d.s); } g.globalAlpha = S.vis;
      // the marshmallows: dropped in, bobbing, drifting round, melting
      if (on) for (const m of S.mallows) { const k = seg(T, m.t, m.t + .45, E.in), melt = seg(T, 11.5, 14.3, E.io); if (k <= 0 || melt >= 1) continue; const drift = (T - m.t) * .12, a = Math.atan2(m.v, m.u) + drift, d = Math.hypot(m.u, m.v), u = Math.cos(a) * d, v = Math.sin(a) * d, sc = lerp(2.4, 1, k) * (1 - melt * .6), s = .15 * sc, bob = Math.sin(A * 3 + m.ph) * .01;
        if (k >= 1) { const rp = clamp((T - m.t - .45) / .8); if (rp < 1) { g.strokeStyle = `rgba(243,228,204,${(.6 * (1 - rp)).toFixed(3)})`; g.lineWidth = .014; g.beginPath(); g.arc(u, v, .12 + rp * .25, 0, TAU); g.stroke(); } }
        g.save(); g.translate(u, v + bob); g.rotate(m.rot + drift * 2); g.globalAlpha = S.vis * I * (1 - melt * .5); gr = g.createLinearGradient(-s, -s, s, s); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(1, melt > .3 ? "#F6E9D8" : "#F4DCDF"); g.fillStyle = gr; g.beginPath(); g.roundRect(-s / 2, -s / 2, s, s, s * (.22 + melt * .3)); g.fill(); g.strokeStyle = "rgba(160,120,100,.3)"; g.lineWidth = .008; g.stroke(); g.restore(); }
      // the finale: small foam hearts bloom round the big one
      if (F >= 0) for (const m of S.minis) { const k = seg(F, m.t, m.t + .25, E.back), s = .1 * k * (1 - seg(F, .85, 1)); if (s <= 0) continue; g.globalAlpha = S.vis; g.fillStyle = FOAM; g.beginPath(); shape(s, 0, 1, 0, 0, 32).forEach(([u, v], j) => j ? g.lineTo(m.u + u, m.v + v) : g.moveTo(m.u + u, m.v + v)); g.closePath(); g.fill(); }
      g.restore();
      // the steam, curling up off it; stronger at first and in the finale, a heart in the finale
      const hot = .55 + (on ? env(T, 11.5, 12.5, 14, 15) * .45 * I : 0) + (F >= 0 ? .5 : 0);
      g.lineCap = "round"; for (let w = 0; w < 3; w++) { const ph = w * 1.7, y0 = cy - LR * .3, rise = R * 1.05, pts = Array.from({ length: 26 }, (_, i) => { const t = i / 25, sway = Math.sin(t * 5.5 - A * 1.4 + ph) * R * .09 * t + Math.sin(t * 2.2 + A * .5 + ph) * R * .05 * t; return [cx + (w - 1) * R * .17 + sway, y0 - t * rise]; });
        const fin = F >= 0 ? env(F, .1, .35, .7, 1) : 0; if (fin > 0 && w === 1) { const hs = R * .22; pts.forEach((p, i) => { const t = i / 25 * TAU, hx = 16 * Math.pow(Math.sin(t), 3) / 16, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16; p[0] = lerp(p[0], cx + hx * hs, fin); p[1] = lerp(p[1], cy - R * .75 + hy * hs, fin); }); }
        const sg = g.createLinearGradient(0, y0, 0, y0 - rise); sg.addColorStop(0, "rgba(255,246,232,0)"); sg.addColorStop(.15, "rgba(255,246,232,1)"); sg.addColorStop(1, "rgba(255,246,232,0)"); g.strokeStyle = sg;
        for (const [lw, a] of [[.2, .05], [.11, .08], [.045, .12]]) { g.globalAlpha = S.vis * a * (.7 + .6 * hot) * (1 + fin); g.lineWidth = R * lw; g.beginPath(); pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.stroke(); } }
      // motes in the light, drifting, catching it
      g.globalCompositeOperation = "lighter"; g.fillStyle = "#FFE2B8";
      for (const m of S.motes) { const u = m.u + Math.sin(A * m.dr * 3 + m.ph) * .25, v = m.v - ((A * m.dr + m.ph) % 3.2), vv = v < -1.6 ? v + 3.2 : v, x = cx + u * R, y = cy + vv * R, d = Math.hypot(u, vv) / 1.9; if (d >= 1 || (S.raw || []).some(q => x > q[0] - 8 && x < q[2] + 8 && y > q[1] - 8 && y < q[3] + 8)) continue; /* never behind the words */ const a = (1 - d) * (.25 + .5 * Math.pow(.5 + .5 * Math.sin(A * m.f * 2 + m.ph), 3)) * sun; g.globalAlpha = S.vis * a; g.beginPath(); g.arc(x, y, m.s, 0, TAU); g.fill(); }
      g.globalCompositeOperation = "source-over";
      g.restore();
    },
  };
  return S;
}
