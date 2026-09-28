// scene-ember.js — 1.12 b336: Ember's scene (scenes.js loads it). A campfire in a clearing, at night, under the Milky
// Way. The sky goes from deep blue overhead to wine at the treeline; the Milky Way rises out of the trees across it,
// clouded, with a dark rift down it and thick with stars; a crescent moon; a far ridge and two lines of pines. The fire
// keeps to the largest open space on the page's ground (scenes.js, `words`): logs crossed in a ring of stones, a bed of
// embers, and flame in tongues of light — deep red outside, orange, yellow, a near-white core — each swaying on its own
// time, licks breaking off the tops, sparks rising in spirals, smoke, and its light on the trees and the ground,
// flickering. While the list is in use it burns low and steady and the stars twinkle. The loop, fifteen seconds: it roars
// up; a log settles with a burst of sparks; a gust leans the flames over and streams the sparks sideways; a star falls;
// it pulses on a beat, three and rest, twice (the kit's sound is bongos), its light on the trees pulsing with it; it
// sinks to its coals, smoking; it catches again with a whoosh. The finale: a column of sparks goes up, opens, and hangs
// in the sky as stars before it fades.
export default function ember(K) {
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  /** a sprite drawn smooth at the screen's density, `w` by `h` CSS pixels */
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
  /** a pine's silhouette: tiers that flare and droop, centred on x, standing on b */
  const pine = (x2, x, b, h, col) => { const w = h * .44; x2.fillStyle = col; x2.beginPath(); x2.moveTo(x - w / 2, b); for (let k = 0; k < 6; k++) { const t = k / 6, e = w / 2 * (1 - t); x2.lineTo(x - e, b - h * t); x2.lineTo(x - e * .5, b - h * t - h * .075); } x2.lineTo(x, b - h * 1.05); for (let k = 5; k >= 0; k--) { const t = k / 6, e = w / 2 * (1 - t); x2.lineTo(x + e * .5, b - h * t - h * .075); x2.lineTo(x + e, b - h * t); } x2.closePath(); x2.fill(); };
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .72, hugFinale: true, list: .4, // a dark kit; the night is behind the words, and the lines and the finale's words sit on pads
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(71), hz = Math.round(H * (pr ? .8 : .74));
      Object.assign(S, { W, H, pr, hz, Rmin: pr ? 40 : 46, Rmax: pr ? 150 : 230 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .3, 110) : Math.min(W * .12, H * .2); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: hz - R0 * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: hz - R0 * .5, tR: R0 }); }
      // the flame's tongues: where each rises from, how wide and tall, its own time
      S.tongues = Array.from({ length: 7 }, (_, i) => ({ x: (i - 3) * .12 + (r() - .5) * .05, w: .27 + r() * .12, h: .78 + r() * .42 - Math.abs(i - 3) * .09, ph: r() * TAU, f: 2.2 + r() * 1.6 }));
      S.licks = Array.from({ length: 12 }, () => ({ x: (r() - .5) * .4, ph: r(), sp: .8 + r() * .5, s: .06 + r() * .06 }));
      S.sparks = Array.from({ length: 52 }, () => ({ ph: r(), sp: .16 + r() * .3, x: (r() - .5) * .4, wob: r() * TAU, r2: .08 + r() * .2, top: .35 + r() * .65, s: r() }));
      S.burst = Array.from({ length: 44 }, () => ({ a: -Math.PI / 2 + (r() - .5) * 2.4, v: .6 + r() * 1.1, wob: r() * TAU, s: r() }));
      S.fountain = Array.from({ length: 64 }, () => ({ a: r() * TAU, v: .25 + Math.sqrt(r()) * .95, lag: r() * .12, h: 2.3 + r() * .9, ph: r() * TAU, s: r(), warm: r() < .5 }));
      S.stones = Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (i / 10) * 1.05 - .08 * Math.PI; return { a, s: .1 + r() * .04, k: r() }; });
      S.embers = Array.from({ length: 32 }, () => ({ x: (r() - .5) * .7, y: (r() - .5) * .1, s: .018 + r() * .024, ph: r() * TAU, f: 1 + r() * 3 }));
      // a spark's glow and a star's glint, drawn once
      S.pad = make(160, 80, x => { for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(7,6,20,.15)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } }); /* the shade under a line */
      const stoneSpr = c => make(64, 40, x => { const gr = x.createRadialGradient(32, 8.9, 2.8, 32, 20, 30.6); gr.addColorStop(0, c); gr.addColorStop(1, "#1E1210"); x.fillStyle = gr; x.beginPath(); x.ellipse(32, 20, 32, 20, 0, 0, TAU); x.fill(); });
      S.stoneDim = stoneSpr("rgb(110,60,48)"); S.stoneLit = stoneSpr("rgb(255,124,80)"); /* a stone in the dark, and lit full by the fire: drawn over it as the fire flares */
      S.spk = make(16, 16, x => { const gr = x.createRadialGradient(8, 8, 0, 8, 8, 8); gr.addColorStop(0, "rgba(255,248,226,1)"); gr.addColorStop(.2, "rgba(255,196,96,.9)"); gr.addColorStop(.5, "rgba(255,112,40,.3)"); gr.addColorStop(1, "rgba(255,80,20,0)"); x.fillStyle = gr; x.fillRect(0, 0, 16, 16); });
      S.glint = make(24, 24, x => { let gr = x.createRadialGradient(12, 12, 0, 12, 12, 5); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(214,224,255,.5)"); gr.addColorStop(1, "rgba(200,210,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 24, 24);
        for (const [w, h] of [[24, 1.1], [1.1, 24]]) { gr = w > h ? x.createLinearGradient(0, 0, 24, 0) : x.createLinearGradient(0, 0, 0, 24); gr.addColorStop(0, "rgba(220,230,255,0)"); gr.addColorStop(.5, "rgba(236,242,255,.85)"); gr.addColorStop(1, "rgba(220,230,255,0)"); x.fillStyle = gr; x.fillRect(12 - w / 2, 12 - h / 2, w, h); } });
      // the sky: deep blue overhead going to wine at the treeline
      let gr = bg.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, "#060818"); gr.addColorStop(.36, "#100E2A"); gr.addColorStop(.64, "#1F1234"); gr.addColorStop(.86, "#38142C"); gr.addColorStop(1, "#551C22"); bg.fillStyle = gr; bg.fillRect(0, 0, W, hz + 2);
      // the Milky Way: a band rising out of the trees across the sky, clouded, brightest low where its core is
      const b0 = [pr ? W * .74 : W * .84, hz], b1 = [pr ? W * .08 : W * .34, -H * .06], bl = Math.hypot(b1[0] - b0[0], b1[1] - b0[1]), ux = (b1[0] - b0[0]) / bl, uy = (b1[1] - b0[1]) / bl, nx = -uy, ny = ux, bw = Math.min(W, H) * (pr ? .24 : .2);
      const on = (t, off) => [b0[0] + ux * t * bl + nx * off, b0[1] + uy * t * bl + ny * off], nb = K.noise1(11, 64), nd = K.noise1(23, 64);
      bg.globalCompositeOperation = "lighter";
      for (let i = 0; i < 120; i++) { const t = r(), d = K.fbm(nb, t * 9, 3), core = Math.exp(-Math.pow((t - .2) / .16, 2)), [x, y] = on(t, (r() - .5) * bw * (1.1 - t * .4)), rad = bw * (.2 + r() * .42) * (1 + core * .4), c = r() < core * .9 ? "255,214,172" : r() < .55 ? "140,112,210" : "214,128,168", a = (.012 + .05 * d * d + core * .045) * clamp(1.4 - t) * clamp((y - H * .1) / (H * .2));
        const rg = bg.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, `rgba(${c},${a.toFixed(4)})`); rg.addColorStop(1, `rgba(${c},0)`); bg.fillStyle = rg; bg.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
      // its stars: thick along it, thinning away from the middle
      for (let i = 0; i < (pr ? 900 : 1800); i++) { const t = r(), o = (r() + r() + r() - 1.5) / 1.5, [x, y] = on(t, o * bw * .62); if (y > hz - 2 || y < 76 || x < 0 || x > W) continue; const s = .35 + r() * r() * 1.1; bg.fillStyle = `rgba(${r() < .3 ? "255,226,200" : "236,238,255"},${((.12 + r() * .5) * (1 - Math.abs(o) * .6) * (.3 + .7 * clamp((y - H * .1) / (H * .2)))).toFixed(3)})`; bg.fillRect(x - s / 2, y - s / 2, s, s); }
      // the rift: dark dust down its middle, wandering
      bg.globalCompositeOperation = "source-over";
      const ang = Math.atan2(uy, ux);
      for (let i = 0; i < 70; i++) { const t = r() * .95, [x, y] = on(t, (K.fbm(nd, t * 5, 3) - .5) * bw * .7), rad = bw * (.05 + r() * .09) * (1.3 - t * .5); bg.save(); bg.translate(x, y); bg.rotate(ang); bg.scale(2.4, 1);
        const rg = bg.createRadialGradient(0, 0, 0, 0, 0, rad); rg.addColorStop(0, `rgba(10,7,22,${(.16 + r() * .2).toFixed(3)})`); rg.addColorStop(1, "rgba(10,7,22,0)"); bg.fillStyle = rg; bg.fillRect(-rad, -rad, rad * 2, rad * 2); bg.restore(); }
      // the rest of the sky's stars, fewer toward the haze on the horizon
      for (let i = 0; i < (pr ? 300 : 620); i++) { const x = r() * W, y = r() * hz, s = .45 + r() * r() * 1.5; if (y < 76) continue; /* none behind the bar along the top */ bg.fillStyle = `rgba(${r() < .25 ? "255,220,196" : r() < .4 ? "196,210,255" : "246,244,255"},${((.14 + r() * .62) * clamp(1.25 - y / hz)).toFixed(3)})`; bg.fillRect(x - s / 2, y - s / 2, s, s); }
      // the moon: a crescent, the rest of it faint in earthshine, a halo
      const mr = pr ? 15 : 21, mx = pr ? W * .82 : W * .9, my = pr ? H * .13 : H * .17; S.moon = [mx, my, mr];
      gr = bg.createRadialGradient(mx, my, mr * .8, mx, my, mr * 7); gr.addColorStop(0, "rgba(255,236,214,.2)"); gr.addColorStop(.3, "rgba(190,176,226,.06)"); gr.addColorStop(1, "rgba(150,140,210,0)"); bg.fillStyle = gr; bg.fillRect(mx - mr * 7, my - mr * 7, mr * 14, mr * 14);
      bg.fillStyle = "rgba(58,52,84,.85)"; bg.beginPath(); bg.arc(mx, my, mr, 0, TAU); bg.fill();
      bg.save(); bg.beginPath(); bg.arc(mx, my, mr, 0, TAU); bg.clip(); gr = bg.createLinearGradient(mx - mr, my - mr, mx + mr, my + mr); gr.addColorStop(0, "#FFF8EA"); gr.addColorStop(1, "#EBCFA8"); bg.fillStyle = gr;
      bg.beginPath(); bg.arc(mx, my, mr, 0, TAU); bg.arc(mx - mr * .46, my - mr * .3, mr * .94, 0, TAU); bg.fill("evenodd");
      bg.fillStyle = "rgba(176,142,110,.28)"; for (const [u, v, s] of [[.55, .35, .16], [.28, .66, .11], [.7, -.1, .09], [.6, .6, .07]]) { bg.beginPath(); bg.arc(mx + u * mr, my + v * mr, s * mr, 0, TAU); bg.fill(); }
      bg.restore();
      // the far ridge, hazed; then two lines of pines, the near one taller toward the edges; then the ground
      const nr = K.noise1(5, 64), rh = H * (pr ? .04 : .065);
      bg.beginPath(); bg.moveTo(0, hz + 6); for (let x = 0; x <= W + 8; x += 8) bg.lineTo(x, hz - rh * (.3 + K.fbm(nr, x / (pr ? 130 : 240), 4))); bg.lineTo(W + 8, hz + 6); bg.closePath();
      gr = bg.createLinearGradient(0, hz - rh * 1.4, 0, hz); gr.addColorStop(0, "#2C1838"); gr.addColorStop(1, "#1A0E22"); bg.fillStyle = gr; bg.fill();
      for (let x = -10; x < W + 10; x += (pr ? 6 : 8) + r() * (pr ? 8 : 12)) pine(bg, x, hz + 3, (pr ? 20 : 28) + r() * (pr ? 26 : 44), "#120A1C");
      const nearB = hz + (pr ? 12 : 16);
      for (let x = -30; x < W + 30;) { const e = Math.abs(x - W / 2) / (W / 2), h = (pr ? 44 : 64) + r() * (pr ? 36 : 56) + Math.pow(e, 2.4) * (pr ? 150 : 230) * (.65 + r() * .5); pine(bg, x, nearB, h, "#060409"); x += h * (.15 + r() * .2); }
      gr = bg.createLinearGradient(0, nearB - 4, 0, H); gr.addColorStop(0, "#0A0609"); gr.addColorStop(1, "#050304"); bg.fillStyle = gr; bg.fillRect(0, nearB - 4, W, H);
      // stars that twinkle, a few, kept off the moon
      S.tw = []; for (let i = 0; i < (pr ? 18 : 30); i++) { const x = r() * W, y = r() * hz * .8; if (y < 90 || Math.hypot(x - mx, y - my) < mr * 5) continue; S.tw.push({ x, y, s: 7 + r() * r() * 16, ph: r() * TAU, f: .7 + r() * 2.2 }); }
      if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the largest circle of open ground, its fire standing on the ground below the
        treeline rather than in the sky; the fire settles there, as big as it allows */
    words(rects) {
      S.raw = rects; if (!S.W) return;
      const { W, H, pr, hz } = S, gap = pr ? 14 : 26, top = pr ? 96 : 122, foot = H - (pr ? 104 : 128);
      let best = 0, bx = S.tx, by = S.ty;
      for (let gy2 = 0; gy2 <= 24; gy2++) for (let gx2 = 0; gx2 <= 32; gx2++) {
        const x = W * (.04 + .92 * gx2 / 32), y = top + (foot - top) * gy2 / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y);
        if (rad <= best) continue;
        for (const [x0, y0, x1, y1] of rects) { rad = Math.min(rad, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)) - gap); if (rad <= best) break; }
        if (rad > best && y + .6 * clamp(rad, S.Rmin, S.Rmax) >= hz - 6) { best = rad; bx = x; by = y; } /* only where the fire can stand on the ground */
      }
      Object.assign(S, { tx: bx, ty: by, tR: clamp(best, S.Rmin, S.Rmax), room: best >= S.Rmin ? 1 : 0 });
      S.ceil = rects.reduce((m, q) => q[2] > bx - S.tR * 1.4 && q[0] < bx + S.tR * 1.4 && q[3] < by ? Math.max(m, q[3]) : m, 0); // the lowest words over it: its sparks stop short of them
      if (!S.placed) { Object.assign(S, { cx: S.tx, cy: S.ty, R: S.tR }); S.placed = true; }
    },
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    /** one tongue of flame: base at (x, y), width w, height h, bending by `lean`, in colour c at alpha a */
    tongue(x, y, w, h, lean, sway, c, a) {
      if (a <= .01 || h <= 1) return;
      const tx = x + lean * h * .6 + sway * w * .6, ty = y - h;
      g.fillStyle = c; g.globalAlpha = a; g.beginPath(); g.moveTo(x - w / 2, y);
      g.bezierCurveTo(x - w * .62, y - h * .38, tx - w * .28 + sway * w * .3, ty + h * .32, tx, ty);
      g.bezierCurveTo(tx + w * .28 + sway * w * .2, ty + h * .34, x + w * .62, y - h * .4, x + w / 2, y);
      g.closePath(); g.fill();
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl;
      S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4));
      const on = I > .01, rects = S.raw || [], hidden = (x, y) => { for (const q of rects) if (x > q[0] - 8 && x < q[2] + 8 && y > q[1] - 8 && y < q[3] + 8) return true; return false; };
      // the stars that twinkle, and (in the loop) one that falls, kept from behind the words
      g.save(); g.globalCompositeOperation = "lighter";
      for (const s of S.tw) { if (hidden(s.x, s.y)) continue; const k = .5 + .5 * Math.sin(A * s.f + s.ph), a = .25 + .75 * k * k * k, z = s.s * (.7 + .3 * k); g.globalAlpha = a; g.drawImage(S.glint, s.x - z / 2, s.y - z / 2, z, z); }
      const fall = on ? seg(T, 6.45, 7.25, x => x) * I : 0;
      if (fall > 0 && fall < 1) { const x0 = S.pr ? W * .96 : W * .76, y0 = S.pr ? H * .075 : H * .1, len = S.pr ? W * .6 : W * .36, dx = -.95, dy = .31, p = E.out(fall) * len, hx = x0 + dx * p, hy = y0 + dy * p, tl = Math.min(p, (S.pr ? 70 : 130) * (1 - fall * .4)), fade = 1 - seg(fall, .72, 1, x => x);
        const lg = g.createLinearGradient(hx, hy, hx - dx * tl, hy - dy * tl); lg.addColorStop(0, `rgba(255,250,236,${(.95 * fade).toFixed(3)})`); lg.addColorStop(.3, `rgba(200,210,255,${(.4 * fade).toFixed(3)})`); lg.addColorStop(1, "rgba(160,170,255,0)");
        g.globalAlpha = 1; g.strokeStyle = lg; g.lineWidth = 1.6; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - dx * tl, hy - dy * tl); g.stroke(); g.globalAlpha = fade; g.drawImage(S.glint, hx - 9, hy - 9, 18, 18); }
      g.restore();
      /** under the words, the night in shadow: the Milky Way and the firelight step back from each line (the stage lays its
          pads over this) and from the small words — the pills, a section's name, the keyboard line, the finale's words */
      const shade = () => { g.globalCompositeOperation = "source-over"; g.globalAlpha = .82; for (const [x0, y0, x1, y1, kind] of rects) { if (kind === 2) continue; /* a line's tools: nothing there till it is hovered */ const h = y1 - y0, mx = kind ? 18 + h * .5 : 8 + h * .4, my = kind ? 6 + h * .3 : 4 + h * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, h + my * 2); } };
      if (S.vis < .01) { shade(); return; }
      const { cx, cy, R } = S, base = cy + R * .6; // the fire's foot sits low in its circle; the flame rises into it
      g.save(); g.globalAlpha = S.vis;
      // how the fire burns: its height; a beat; sinking to coals and catching again; a gust
      const beat = t => { const k = ((t % 1.6) + 1.6) % 1.6 / 1.6; return k < .56 ? Math.pow(Math.max(0, Math.sin(k / .56 * Math.PI * 3)), 5) : 0; };
      const roar = on ? env(T, .3, 1.2, 2.2, 3.0, E.sine) * I : 0, pulse = on ? beat(T - 7.4) * env(T, 7.4, 7.5, 10.4, 10.6) * I : 0;
      const sink = on ? env(T, 10.6, 11.3, 11.7, 11.9, E.sine) * I : 0, whoosh = on ? env(T, 11.85, 12.05, 12.3, 13.3, E.out) * I : 0, gust = on ? env(T, 3.8, 4.5, 5.6, 6.6, E.sine) * I : 0;
      const fin = F >= 0 ? env(F, 0, .06, .35, .8) : 0, flick = .92 + .08 * Math.sin(A * 11) * Math.sin(A * 7.3);
      const hk = (.72 + roar * .45 + pulse * .38 + whoosh * .7 + fin * .6) * (1 - sink * .8) * flick, lean = -gust * .55 + Math.sin(A * .7) * .05;
      // its light: on the trees and the sky round it, and a pool on the ground, flickering
      g.globalCompositeOperation = "lighter";
      let gr = g.createRadialGradient(cx, base - R * .5, R * .2, cx, base - R * .3, R * 4.2); gr.addColorStop(0, `rgba(255,128,52,${(.25 * hk * S.vis).toFixed(3)})`); gr.addColorStop(.35, `rgba(230,80,34,${(.11 * hk * S.vis).toFixed(3)})`); gr.addColorStop(1, "rgba(160,40,20,0)");
      g.fillStyle = gr; g.fillRect(cx - R * 4.2, base - R * 4.6, R * 8.4, R * 8.4);
      gr = g.createLinearGradient(0, base + R * .1, 0, base + R * .9); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)"); /* the ground beyond the pool stays dark: the words at the foot keep their ground */
      g.globalCompositeOperation = "destination-out"; g.fillStyle = gr; g.fillRect(cx - R * 4.2, base + R * .1, R * 8.4, R * 4); g.globalCompositeOperation = "lighter";
      gr = g.createRadialGradient(cx, base, R * .1, cx, base, R * 2.7); gr.addColorStop(0, `rgba(255,140,56,${(.4 * hk + .06).toFixed(3)})`); gr.addColorStop(.4, `rgba(210,70,26,${(.13 * hk).toFixed(3)})`); gr.addColorStop(1, "rgba(120,30,10,0)");
      g.fillStyle = gr; g.save(); g.translate(cx, base); g.scale(1, .26); g.translate(-cx, -base); g.fillRect(cx - R * 2.7, base - R * 2.7, R * 5.4, R * 5.4); g.restore();
      g.save(); shade(); g.restore();
      g.globalCompositeOperation = "source-over"; g.globalAlpha = S.vis;
      // the stones at the back of the ring
      const stone = (st, front) => { const th = st.a + (front ? 0 : Math.PI), x = cx + Math.cos(th) * R * .64, y = base + Math.sin(th) * R * .15 + (front ? R * .07 : -R * .02), s = st.s * R * 1.2, lit = clamp((front ? .25 : .8) * hk / 1.6); /* the back half of the ring above the fire's foot, the front half below */
        g.globalAlpha = S.vis; g.drawImage(S.stoneDim, x - s * 1.15, y - s * .72, s * 2.3, s * 1.44); if (lit > .01) { g.globalAlpha = S.vis * lit; g.drawImage(S.stoneLit, x - s * 1.15, y - s * .72, s * 2.3, s * 1.44); } g.globalAlpha = S.vis; };
      S.stones.forEach(st => stone(st, false));
      // the logs: two crossed behind the flame, the top one settling, and one across its foot in front; their cracks glow
      const glowC = `rgba(255,${(90 + 80 * hk) | 0},30,${clamp(.5 + .45 * hk).toFixed(3)})`;
      const log = (a, l, x, y, lh) => { g.save(); g.translate(x, y); g.rotate(a); const lw = l * R;
        gr = g.createLinearGradient(0, -lh / 2, 0, lh / 2); gr.addColorStop(0, "#6A3E2A"); gr.addColorStop(.45, "#3A1E14"); gr.addColorStop(1, "#1C0E09"); g.fillStyle = gr; g.beginPath(); g.roundRect(-lw / 2, -lh / 2, lw, lh, lh / 2); g.fill();
        g.strokeStyle = glowC; g.lineWidth = Math.max(1, R * .008); g.beginPath(); /* the char cracked into blocks, the seams glowing */
        for (let k = 0; k < 6; k++) { const x0 = -lw * .4 + k * lw * .16 + Math.sin(k * 7.1) * lw * .03; g.moveTo(x0, -lh * .36); g.lineTo(x0 + lw * .012, -lh * .02); g.lineTo(x0 - lw * .008, lh * .3); }
        g.moveTo(-lw * .42, -lh * .02); for (let k = 1; k <= 8; k++) g.lineTo(-lw * .42 + k * lw * .105, -lh * .02 + Math.sin(k * 2.3) * lh * .08); g.stroke();
        g.strokeStyle = `rgba(255,${(120 + 70 * hk) | 0},50,${clamp(.25 + .35 * hk).toFixed(3)})`; g.lineWidth = Math.max(1, lh * .12); g.beginPath(); g.moveTo(-lw / 2 + lh * .5, -lh * .44); g.lineTo(lw / 2 - lh * .5, -lh * .44); g.stroke(); /* its top edge, lit by the flame */
        g.fillStyle = "#C47A4A"; g.beginPath(); g.ellipse(lw / 2, 0, lh * .18, lh * .48, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(90,50,30,.8)"; g.beginPath(); g.ellipse(lw / 2, 0, lh * .08, lh * .24, 0, 0, TAU); g.fill(); g.restore(); };
      const settle = on ? env(T, 2.8, 2.95, 3.1, 3.6) * R * .05 : 0;
      log(-.34, 1.12, cx - R * .04, base - R * .12, R * .15); log(.36, 1.08, cx + R * .04, base - R * .14 + settle, R * .15);
      // the flame: each tongue in four layers, outside in, each swaying on its own time, the inner ones a beat behind
      const layers = [["#D8341A", 1, .8], ["#FF6A1E", .78, .85], ["#FFB33A", .56, .9], ["#FFF1B8", .32, .95]];
      layers.forEach(([col, k, a], li) => { const t2 = A - li * .07; for (const t of S.tongues) { const sw = Math.sin(t2 * t.f + t.ph) * .55 + Math.sin(t2 * t.f * 1.7 + t.ph * 2) * .3, h = t.h * R * hk * k * (1 + .12 * Math.sin(t2 * t.f * .8 + t.ph)); S.tongue(cx + t.x * R * (1 - gust * .3), base - R * .05, t.w * R * k * (1 + whoosh * .3), h, lean, sw, col, a * S.vis); } });
      // licks breaking off the tops and rising
      for (const l of S.licks) { const life = (l.ph + A * l.sp) % 1, y = base - R * .08 - R * hk * (.55 + life * .55), x = cx + l.x * R + lean * R * life * .6 + Math.sin(A * 3 + l.ph * 9) * R * .03; S.tongue(x, y, l.s * R * (1 - life), l.s * R * 1.6 * (1 - life), lean, 0, life < .5 ? "#FFB33A" : "#FF6A1E", (1 - life) * .7 * hk * S.vis); }
      // the flame's own glow
      g.globalCompositeOperation = "lighter"; g.globalAlpha = S.vis;
      gr = g.createRadialGradient(cx, base - R * .4 * hk, R * .05, cx, base - R * .35 * hk, R * 1.25 * Math.max(.6, hk)); gr.addColorStop(0, `rgba(255,190,90,${(.3 * hk).toFixed(3)})`); gr.addColorStop(1, "rgba(255,110,40,0)"); g.fillStyle = gr; g.fillRect(cx - R * 2.2, base - R * 3, R * 4.4, R * 3.6);
      // sparks going up in spirals, high into the night; a burst when the log settles; streamed sideways in the gust
      const burst = on ? seg(T, 2.85, 4.4, x => x) * I : 0, sky = Math.max(H * .05, base - R * 3.6, (S.ceil || 0) + 18), lift = Math.max(R * .6, base - R * .85 - sky), spk = (x, y, z, a) => { if (a < .02 || hidden(x, y)) return; g.globalAlpha = Math.min(1, a); g.drawImage(S.spk, x - z / 2, y - z * .6, z, z * 1.5); };
      for (const s of S.sparks) { const life = (s.ph + A * s.sp * (1 + roar * .6 + whoosh * 1.4)) % 1, y = base - R * .2 - life * (base - sky) * s.top, x = cx + s.x * R + Math.sin(life * 9 + s.wob + A) * s.r2 * R * life + lean * R * life * 2.2; spk(x, y, (4 + s.s * 5) * (1 - life * .5), (1 - life) * (.5 + hk * .45) * S.vis); }
      if (burst > 0 && burst < 1) for (const b of S.burst) { const d = E.out(burst) * R * 1.5 * b.v, x = cx + Math.cos(b.a) * d * .8 + Math.sin(burst * 10 + b.wob) * R * .06, y = base - R * .25 + Math.sin(b.a) * d + burst * burst * R * .5; spk(x, y, 4 + b.s * 5, (1 - burst) * 1.1 * S.vis); }
      // the finale: a column of sparks goes up, opens, and hangs in the sky as stars, twinkling, before it fades
      if (F >= 0) for (const f of S.fountain) { const k = clamp((F - f.lag) / (1 - f.lag)); if (k <= 0 || k >= 1) continue; const up = E.out(seg(k, 0, .3, x => x)), open = E.out(seg(k, .24, .52, x => x)), hy = base - R * .4 - up * Math.min(R * f.h, lift), x = cx + Math.cos(f.a) * open * R * f.v * 1.3 + Math.sin(k * 7 + f.ph) * R * .03 * (1 - open), y = hy + Math.sin(f.a) * open * R * f.v * .8 + seg(k, .5, 1, E.in) * R * .12;
        const star = seg(k, .45, .6, x => x), tw = .55 + .45 * Math.sin(A * 9 + f.ph), a = (1 - seg(k, .8, 1, x => x)) * lerp(1, tw, star) * S.vis;
        if (star < 1) spk(x, y, (5 + f.s * 5) * (1 - star * .4), a * (1 - star));
        if (star > 0 && !hidden(x, y)) { const z = (6 + f.s * 10) * star; g.globalAlpha = a * star; if (f.warm) g.drawImage(S.spk, x - z * .3, y - z * .3, z * .6, z * .6); else g.drawImage(S.glint, x - z / 2, y - z / 2, z, z); } }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = S.vis;
      // the smoke, curling up and away, thicker when it sinks
      for (let w = 0; w < 3; w++) { const pts = Array.from({ length: 24 }, (_, i) => { const t = i / 23; return [cx + Math.sin(t * 5 + A * .9 + w * 2) * R * .12 * t + lean * R * t, base - R * .7 * hk - t * R * .55]; }); g.globalAlpha = S.vis * (.05 + sink * .16); g.strokeStyle = "#B8A8B6"; g.lineWidth = R * (.06 + w * .02); g.beginPath(); pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.stroke(); }
      g.globalAlpha = S.vis;
      // the bed of embers at the flame's foot, the log across it, the stones at the front of the ring
      g.globalCompositeOperation = "lighter";
      for (const e of S.embers) { const k = .5 + .5 * Math.sin(A * e.f + e.ph), z = e.s * R * (1 + sink * .6) * 2.8; g.globalAlpha = S.vis * Math.min(1, .45 + .5 * k * (.4 + hk * .6 + sink)); g.drawImage(S.spk, cx + e.x * R - z / 2, base - R * .07 + e.y * R - z / 2, z, z); }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = S.vis;
      log(-.05, 1.22, cx + R * .02, base - R * .01, R * .17);
      S.stones.forEach(st => stone(st, true));
      g.restore();
    },
  };
  return S;
}
