// scene-ember.js — 1.12 b358: Ember's scene (scenes.js loads it). A campfire by a lake at night, in colour-cycling pixel
// art, the way the games of the early nineties made a picture live: it is painted once, at a low resolution, in a small
// palette, and then its colours are turned rather than its pixels — so the stars twinkle, the moon glitters on the water,
// the embers breathe and the firelight flickers on the ground, the rocks, the tent and the trees with nothing redrawn but
// the palette. The flames are the one thing drawn each frame: a small field of heat, each cell rising into the one above,
// cooling a little and drifting a little sideways, fed from the logs, and coloured through the fire's own ramp. Sparks
// ride up out of it. The sky goes from deep blue overhead to a last warm glow at the horizon, the Milky Way across it, a
// full moon over the far hills, pines framing it, the lake between. While the list is in use it all turns slowly and the
// fire burns low. The loop, fifteen seconds: the fire flares; a log settles in a burst of sparks; a star falls; an owl
// crosses the moon; a fish jumps and its rings spread; and the fire settles. The finale: a column of sparks goes up and
// opens into new stars. The lines sit on pads of the night (scenes.js, `hug`). The beats are a table, so they can be
// dealt differently each time round.
export default function ember(K) {
  const { clamp, lerp, E, seg, env, rng, canvas, noise1, fbm, dith } = K;
  let g = null;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pack = c => (255 << 24 | c[2] << 16 | c[1] << 8 | c[0]) >>> 0; /* a colour as the ImageData's 32 bits (little-endian) */
  const mix = (a, b, t) => [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], clamp(t))));
  // the palette's ranges: where each thing's colours sit
  const SKY = 1, STAR = 17, ARM = 25, MOON = 33, MILKY = 38, MTN = 42, TREEF = 46, LAKE = 48, GLIT = 64, FREF = 72, GND = 80, LIT = 84, PINE = 108, PLIT = 112, ROCK = 118, LOG = 124, COAL = 128, TENT = 136, GRASS = 140, NL = 6;
  const SKYC = ["#05061A", "#090A25", "#0E0E2F", "#141239", "#1A1542", "#221949", "#2A1B4E", "#331D52", "#3D2053", "#482352", "#54264F", "#60294B", "#6C2D46", "#793340", "#853A3A", "#904333"].map(hex);
  const TW = ["#2A2758", "#56508A", "#7A74AE", "#A49ED6", "#F6F2FF", "#A49ED6", "#7A74AE", "#56508A"].map(hex); /* a star, round its twinkle */
  const GL = ["#14132F", "#1E1B46", "#36305F", "#6C6499", "#D2CAF3", "#6C6499", "#36305F", "#1E1B46"].map(hex); /* the moon's glitter on the water */
  const FR = ["#1A0F18", "#3A1618", "#6C2414", "#B8461C", "#F28C2C", "#B8461C", "#6C2414", "#3A1618"].map(hex); /* the firelight on the water */
  const CO = ["#3A0C06", "#6A1406", "#A8280A", "#E8541A", "#FF9A3A", "#E8541A", "#A8280A", "#6A1406"].map(hex); /* the coals */
  const GNDC = ["#110B0E", "#170F11", "#1E1413", "#261A16"].map(hex), GLOW = hex("#E0702A");
  const FIRE = (() => { const st = [[0, "#1F0707"], [.12, "#4A0B06"], [.25, "#8A1706"], [.38, "#C22B08"], [.5, "#E5470E"], [.62, "#F76D19"], [.74, "#FF9530"], [.86, "#FFC45A"], [.95, "#FFE9A0"], [1, "#FFF8E0"]].map(([t, c]) => [t, hex(c)]);
    return Array.from({ length: 37 }, (_, i) => { const t = i / 36; let k = 0; while (k < st.length - 2 && t > st[k + 1][0]) k++; return pack(mix(st[k][1], st[k + 1][1], (t - st[k][0]) / (st[k + 1][0] - st[k][0]))); }); })();
  // the loop's beats: when each happens (the forever cycle can deal them differently)
  const B = { flare: [.8, 1.4, 2.6, 3.4], log: 4.6, star: [6.2, 7.0], owl: [8.3, 11.3], fish: 12.0 };
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .72, hugFinale: true, list: .4, // a dark kit: the night is behind the words, and the lines and the finale's words sit on pads
    bind(ctx) { g = ctx; },
    layout(W, H) {
      const pr = H > W * 1.05, PS = pr ? 3 : 4, bw = Math.ceil(W / PS), bh = Math.ceil(H / PS), r = rng(53);
      const [pc, px2] = canvas(bw, bh), img = px2.createImageData(bw, bh);
      Object.assign(S, { W, H, pr, PS, bw, bh, pc, px2, img, out: new Uint32Array(img.data.buffer), idx: new Uint8Array(bw * bh), pal: new Uint32Array(256) });
      [S.bc] = canvas(Math.ceil(bw / 4), Math.ceil(bh / 4)); S.bc.getContext("2d").imageSmoothingEnabled = true; /* the bloom */
      if (!S.pad) { const [c, x] = canvas(160, 80); for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(27,15,13,.16)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } S.pad = c; } /* the shade under a line: the kit's own dark */
      const I8 = S.idx, at = (x, y) => y * bw + x, inb = (x, y) => x >= 0 && x < bw && y >= 0 && y < bh, set = (x, y, v) => { if (inb(x, y)) I8[at(x, y)] = v; };
      const hy = Math.round(bh * (pr ? .55 : .56)), sy = Math.round(bh * (pr ? .76 : .8)); // the far shore (the horizon), the near shore
      const fx = Math.round(bw * (pr ? .5 : .74)), fy = Math.round(sy + (bh - sy) * (pr ? .5 : .5)); // the fire's foot
      const mx = Math.round(bw * (pr ? .7 : .77)), my = Math.round(bh * (pr ? .13 : .17)), mr = pr ? 7 : 9; // the moon, over the fire: the flames stand against its path
      Object.assign(S, { hy, sy, fx, fy, mx, my, mr });
      const n1 = noise1(7, 64), n2 = noise1(11, 64), n3 = noise1(13, 64), n4 = noise1(17, 64), n5 = noise1(19, 64);
      // the sky: sixteen bands from the zenith to the glow at the horizon, dithered into each other
      for (let y = 0; y < hy; y++) { const f = Math.pow(y / hy, 1.3) * 15; for (let x = 0; x < bw; x++) { const k = Math.floor(f); I8[at(x, y)] = SKY + Math.min(15, k + (f - k > dith(x, y) ? 1 : 0)); } }
      // the Milky Way, rising from the far hills on the left across the dark part of the sky, a rift down its middle
      for (let y = 0; y < hy; y++) for (let x = 0; x < bw; x++) {
        const u = x / bw, v = y / hy, c = lerp(.95, -.05, u) + .04 * Math.sin(u * 6), d = Math.abs(v - c), w = .15; if (d > w || v > .7) continue;
        const dens = (1 - d / w) * (.5 + .5 * fbm(n1, x * .07 + y * .04, 3)) * clamp((.7 - v) / .25) - .5 * Math.exp(-(((v - c + .02) / .025) ** 2)) * fbm(n2, x * .15, 2);
        const lv = dens * 4 - dith(x, y) * 1.1; if (lv > 0) I8[at(x, y)] = MILKY + Math.min(3, Math.floor(lv));
      }
      // the moon, its seas, its halo
      for (let y = my - mr * 3; y <= my + mr * 3; y++) for (let x = mx - mr * 3; x <= mx + mr * 3; x++) { if (!inb(x, y)) continue; const d = Math.hypot(x - mx, y - my);
        if (d <= mr) I8[at(x, y)] = MOON + (fbm(n3, (x - mx) * .35 + (y - my) * .21 + 20, 2) > .56 ? (fbm(n4, x * .5 + y * .3, 2) > .6 ? 2 : 1) : 0);
        else if (d < mr * 2.6 && dith(x, y) < (1 - (d - mr) / (mr * 1.6)) * .9) I8[at(x, y)] = MOON + (d < mr * 1.5 ? 4 : 3); }
      // the stars (the big ones with arms), each at its own place round the twinkle
      S.stars = []; for (let i = 0; i < (pr ? 70 : 150); i++) { const x = Math.floor(r() * bw), y = Math.floor(r() * hy * .86), ph = Math.floor(r() * 8); if (Math.hypot(x - mx, y - my) < mr * 3) continue; set(x, y, STAR + ph); if (r() < .12) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(x + dx, y + dy, ARM + ph); } S.stars.push([x, y]); }
      // the far hills, lit along their ridges on the moon's side, and a haze low down
      const ridge = x => Math.round(hy - bh * (pr ? .05 : .07) - bh * (pr ? .09 : .12) * fbm(n5, x * .025, 4));
      S.ridge = ridge;
      for (let x = 0; x < bw; x++) { const t = ridge(x); for (let y = t; y < hy; y++) I8[at(x, y)] = y === t && (x < mx ? ridge(x + 1) <= t : ridge(x - 1) <= t) ? MTN + 2 : y > hy - 4 && dith(x, y) < (y - hy + 4) / 5 ? MTN + 3 : MTN; }
      // a line of small pines along the far shore
      for (let x = 0; x < bw; x++) { const h = Math.round(1 + 5 * fbm(n2, x * .31 + 7, 2) * (x % 3 === 0 ? 1.3 : .7)); for (let y = hy - h; y < hy + 1; y++) { const half = (y - (hy - h)) * .45; if (half >= 0) for (let dx = -Math.floor(half); dx <= Math.floor(half); dx++) set(x + dx, y, TREEF); } }
      // the lake: the sky again, darker and upside down, the hills in it; the moon's path glittering down it, and near
      // the shore behind the fire, its light on the ripples
      for (let y = hy + 1; y < sy; y++) { const m = hy - (y - hy) * 1.7; for (let x = 0; x < bw; x++) {
        const mi = Math.round(m); let v;
        if (mi >= ridge(x) - 0 && mi < hy) v = TREEF + 1; /* the hills' reflection */
        else { const f = clamp(Math.pow(Math.max(0, m) / hy, 1.3)) * 15, k = Math.floor(f); v = LAKE + Math.min(15, k + (f - k > dith(x, y) ? 1 : 0)); }
        const gw = 3 + (y - hy) * .55, gd = Math.abs(x - mx + Math.sin(y * 1.3) * 1.2), seg2 = Math.floor((x + (y * 7 % 5)) / 4); /* the moon's path: glints a few pixels long, a few to a row */
        if (gd < gw && (y - hy) % 2 === 0 && fbm(n3, seg2 * 1.7 + y * 2.3, 2) > .36 + gd / gw * .32) v = GLIT + ((seg2 * 3 + y * 5) & 7);
        const fd = Math.hypot((x - fx) * .4, (y - sy) * 2.2); if (y > sy - 7 && fd < (pr ? 12 : 16) && (y - sy) % 2 === 0 && fbm(n1, Math.floor(x / 3) * 1.3 + y * 3, 2) > .4 + fd * .018) v = FREF + ((Math.floor(x / 3) * 3 + y) & 7); /* the firelight on the ripples by the shore */
        I8[at(x, y)] = v; } }
      // the near shore: dark earth, a wet line at the water, pebbles; the ground round the fire in four rings of its light
      const Rg = pr ? 40 : 50;
      for (let y = sy; y < bh; y++) for (let x = 0; x < bw; x++) {
        const tone = y === sy ? 3 : clamp(Math.floor(fbm(n4, x * .045 + y * .5, 3) * 3.2 + (dith(x, y) - .5) * .9 - .2), 0, 3);
        const d = Math.hypot((x - fx) * .7, (y - fy) * 1.7), lv = Math.floor((1 - d / Rg) * NL + dith(x, y) - .5);
        I8[at(x, y)] = lv >= 0 ? LIT + tone * NL + Math.min(NL - 1, lv) : GND + tone;
      }
      for (let x = 0; x < bw; x++) { const h = Math.round(fbm(n5, x * .23 + 3, 2) * 4 - .5); for (let k = 1; k <= h; k++) if ((x + k) % 2 === 0 || k === 1) set(x, sy + 1 - k, GRASS + (k === h ? 1 : 0)); } /* grass along the water */
      for (let k = 0; k < (pr ? 26 : 50); k++) { const x = Math.floor(r() * bw), y = sy + 3 + Math.floor(r() * (bh - sy - 4)); if (Math.hypot((x - fx) * .7, (y - fy) * 1.7) < 12) continue; set(x, y, GND + 3); set(x + 1, y, GND + 3); set(x, y - 1, GND + 2); } /* pebbles */
      // the tent beside the fire: the face toward the fire lit, the far one dark, the door open
      { const tx = fx + (pr ? -24 : -36), ty = fy + 1, tw = pr ? 16 : 22, th = pr ? 11 : 15;
        for (let y = 0; y < th; y++) { const half = Math.round(y * tw / 2 / th); for (let dx = -half; dx <= half; dx++) set(tx + dx, ty - th + y, dx > 0 ? TENT + 1 : TENT); }
        for (let y = Math.round(th * .4); y < th; y++) { const half = Math.round((y - th * .4) * .35); for (let dx = -half; dx <= half; dx++) set(tx + 1 + dx, ty - th + y, TENT + 2); }
        for (let k = 1; k < 5; k++) set(tx + Math.round(tw / 2) + k, ty - Math.round(th * .5) + k * 2, TENT + 1); }
      // the pines framing it all: tall, in tiers, their edges toward the fire catching its light, the moon's side rimmed
      const pine = (x0, base, h, s) => { const rr = rng(s), tiers = Math.max(4, Math.round(h / 7));
        for (let y = 0; y < h; y++) { const ti = Math.floor(y / h * tiers), ty = (y / h * tiers) - ti, half = (1 + (ti + 1) * h * .2 / tiers) * (.35 + .65 * ty) + (rr() < .3 ? 1 : 0);
          for (let dx = -Math.round(half); dx <= Math.round(half); dx++) { const hw = Math.max(1, Math.round(half)), toward = (dx > 0) === (x0 < fx) ? Math.abs(dx) / hw : 0, near = clamp(1 - Math.abs(x0 - fx) / (bw * .5)) * clamp((y / h) * 1.4 - .1);
            const lit = toward * near * 1.6 - (1 - toward) * .5, lv = Math.floor(lit * 4 + dith(x0 + dx, base - h + y) - .5), rim = Math.abs(dx) >= hw && (dx > 0) === (x0 < mx);
            set(x0 + dx, base - h + y, lv > 0 ? PLIT + Math.min(3, lv - 1) : rim ? PINE + 3 : PINE + (y % 3 === 0 ? 1 : 0)); } }
        for (let y = 0; y < 3; y++) set(x0, base + y - 1, PINE); };
      const tall = pr ? [[.04, .5], [.14, .36], [.9, .42], [.98, .56]] : [[.02, .62], [.07, .44], [.12, .3], [.92, .38], [.97, .55]];
      for (const [u, hh] of tall) pine(Math.round(bw * u), sy + 2, Math.round(bh * hh), Math.floor(u * 1000));
      // the fire pit: stones in a ring, the logs crossed, cracked with coals
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, x = Math.round(fx + Math.cos(a) * (pr ? 6 : 8)), y = Math.round(fy + Math.sin(a) * (pr ? 2 : 2.6)); for (const [dx, dy] of [[0, 0], [1, 0], [0, -1], [1, -1], [-1, 0]]) set(x + dx, y + dy, Math.sin(a) < 0 || dx < 0 ? ROCK + (dy ? 2 : 3) : ROCK + (dy ? 0 : 1)); }
      const log = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = Math.round(lerp(x0, x1, i / n)), y = Math.round(lerp(y0, y1, i / n)); set(x, y, LOG + (i % 4 === 1 ? 2 : 1)); set(x, y + 1, i % 5 === 2 ? COAL + ((i * 3) & 7) : LOG); } };
      const lw = pr ? 6 : 8; log(fx - lw, fy + 1, fx + lw - 2, fy - 3); log(fx + lw, fy + 1, fx - lw + 2, fy - 3); log(fx - lw + 1, fy - 1, fx + lw - 1, fy - 1);
      for (let k = -3; k <= 3; k++) set(fx + k, fy, COAL + ((k * 5 + 8) & 7));
      { const bx = fx + (pr ? 14 : 18), by = fy + (pr ? 4 : 5), bl = pr ? 9 : 13; for (let k = 0; k < bl; k++) { set(bx + k, by, k < 2 ? ROCK + 2 : LOG + 1); set(bx + k, by + 1, LOG); set(bx + k, by - 1, k < bl / 2 ? ROCK + 2 : LOG + 2); } set(bx - 1, by, ROCK + 3); } /* a log to sit on, its near end and top catching the light */
      // the flames' field of heat, and the sparks
      S.FW = pr ? 22 : 24; S.FH = pr ? 40 : 44; S.cool = pr ? .64 : .62; S.heat = new Uint8Array(S.FW * S.FH); S.frng = rng(97); S.ft = 0;
      for (let k = 0; k < 90; k++) S.fire(.75, k / 30); /* lit before the page shows it */
      S.sparks = Array.from({ length: 18 }, () => ({ p: 1.3 + r() * 1.1, o: r() * 3, sw: 2 + r() * 4, dr: (r() - .5) * 10, ph: r() * 6 }));
      S.burst = Array.from({ length: 26 }, () => ({ a: -Math.PI / 2 + (r() - .5) * 1.6, v: 20 + r() * 34, l: .7 + r() * 1.1 }));
      S.fan = Array.from({ length: pr ? 40 : 64 }, () => ({ x: (r() - .5) * bw * .9, y: bh * (.06 + r() * .4), d: r() * .3, tw: Math.floor(r() * 8) }));
      S.owlPath = pr ? [[-12, bh * .17], [bw + 12, bh * .09]] : [[-12, bh * .25], [bw + 12, bh * .15]];
      S.fishAt = [Math.round(bw * (pr ? .3 : .36)), Math.round(lerp(hy, sy, .55))];
      S.turn = 0; S.lastA = undefined;
    },
    /** one step of the flames: each cell's heat rises into the one above, cooling a little and drifting a little sideways;
     *  the bottom row is fed from the logs, hottest in the middle, by `feed` (0 … 1) */
    fire(feed, t) {
      const { FW, FH, heat, frng } = S;
      for (let x = 0; x < FW; x++) { const u = (x - (FW - 1) / 2) / (FW / 2), c = 1 - Math.abs(u), tongues = .72 + .28 * Math.cos(u * Math.PI * 2.6 + Math.sin(t * 2.3) * .8); /* three tongues, swaying */
        heat[(FH - 1) * FW + x] = c > .12 ? Math.round(36 * clamp(feed * (Math.pow(c, .6) * 1.2 * tongues + (frng() - .5) * .35))) : 0; }
      for (let y = 1; y < FH; y++) for (let x = 0; x < FW; x++) {
        const src = y * FW + x, h = heat[src]; if (!h) { heat[src - FW] = 0; continue; }
        const rn = Math.floor(frng() * 3), dst = Math.min(FW * FH - 1, Math.max(FW, src - rn + 1)), edge = Math.abs(x - (FW - 1) / 2) / (FW / 2); /* each cell drifts one either way, or none */
        heat[dst - FW] = Math.max(0, h - (frng() < .5 ? 1 : 0) - (frng() < S.cool + edge * .5 ? 1 : 0));
      }
    },
    words(rects) { S.raw = rects; },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, bw, bh, PS, out, idx, pal, fx, fy } = S;
      g.clearRect(0, 0, W, H);
      const dt = S.lastA === undefined ? 0 : clamp(A - S.lastA, 0, .1); S.lastA = A;
      const on = I > .01; S.turn += dt * (.35 + .65 * I); const tn = S.turn;
      const flare = on ? env(T, ...B.flare, E.sine) * I : 0, settle = on ? env(T, B.log - .15, B.log, B.log + .1, B.log + .9, E.sine) * I : 0;
      const flick = .72 + .16 * Math.sin(A * 11.3) + .08 * Math.sin(A * 7.1 + 1) + .06 * Math.sin(A * 17.9 + 2), glow = clamp(flick * (.72 + .28 * I) + flare * .35 - settle * .25);
      // the palette: the still colours, and the ranges that turn
      for (let k = 0; k < 16; k++) { pal[SKY + k] = pack(SKYC[k]); pal[LAKE + k] = pack(mix(SKYC[k], [4, 6, 20], .4)); }
      const t8 = n => Math.floor(tn * n);
      for (let k = 0; k < 8; k++) { pal[STAR + k] = pack(TW[(k + t8(3)) & 7]); pal[ARM + k] = pack(mix(TW[(k + t8(3)) & 7], SKYC[2], .55)); pal[GLIT + k] = pack(GL[(k + t8(7)) & 7]); pal[FREF + k] = pack(mix(FR[(k + t8(9)) & 7], FR[0], 1 - glow)); pal[COAL + k] = pack(CO[(k + t8(5)) & 7]); }
      [["#FFF4DA", 0], ["#E6D3AC", 1], ["#CDB88E", 2], ["#231F4E", 3], ["#312A62", 4]].forEach(([c, k]) => { pal[MOON + k] = pack(hex(c)); });
      ["#221F52", "#2D2964", "#3A3576", "#4B4589"].forEach((c, k) => { pal[MILKY + k] = pack(hex(c)); });
      ["#1A1535", "#15112E", "#3B3264", "#26204A"].forEach((c, k) => { pal[MTN + k] = pack(hex(c)); });
      pal[TREEF] = pack(hex("#0E0B1E")); pal[TREEF + 1] = pack(hex("#0B0918"));
      for (let t = 0; t < 4; t++) { pal[GND + t] = pack(GNDC[t]); for (let lv = 0; lv < NL; lv++) pal[LIT + t * NL + lv] = pack(mix(GNDC[t], mix(GLOW, GNDC[t], .3 + t * .06), glow * Math.pow((lv + 1) / NL, 1.3) * .7)); }
      pal[PINE] = pack(hex("#06050C")); pal[PINE + 1] = pack(hex("#0A0814")); pal[PINE + 3] = pack(hex("#1C1A3A"));
      for (let k = 0; k < 4; k++) pal[PLIT + k] = pack(mix(hex("#0C0710"), hex("#9A4420"), glow * (k + 1) / 4 * .85)); /* the pines' faces toward the fire */
      pal[GRASS] = pack(mix(hex("#15120E"), hex("#3A2414"), glow * .3)); pal[GRASS + 1] = pack(mix(hex("#1E1A12"), hex("#5A3418"), glow * .4));
      ["#2A2226", "#3A2E30"].forEach((c, k) => { pal[ROCK + k] = pack(hex(c)); }); pal[ROCK + 2] = pack(mix(hex("#3A2A26"), hex("#C0683A"), glow)); pal[ROCK + 3] = pack(mix(hex("#4A3630"), hex("#F09050"), glow));
      ["#2A1A12", "#3A2416", "#4A2E1A"].forEach((c, k) => { pal[LOG + k] = pack(hex(c)); });
      pal[TENT] = pack(hex("#1E1418")); pal[TENT + 1] = pack(mix(hex("#2E1E1C"), hex("#B0582E"), glow * .9)); pal[TENT + 2] = pack(hex("#0C080A"));
      // the picture, through the palette
      for (let i = 0; i < out.length; i++) out[i] = pal[idx[i]];
      const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < bw && y >= 0 && y < bh) out[y * bw + x] = c; };
      // the flames: stepped at thirty a second, fed harder in the flare and after the log settles, low while the list is in use
      S.ft += dt; while (S.ft > 1 / 30) { S.ft -= 1 / 30; S.fire(clamp(.62 + .3 * I + flare * .3 + (on ? env(T, B.log + .1, B.log + .4, B.log + .9, B.log + 1.8) * .25 * I : 0) - settle * .35), A); }
      { const { FW, FH, heat } = S, x0 = fx - Math.floor(FW / 2), y0 = fy - FH + 1; for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const h = heat[y * FW + x]; if (h > 7) put(x0 + x, y0 + y, FIRE[h]); /* the dark tips left out */ } }
      // the sparks, riding up out of it
      const n = Math.round(S.sparks.length * (.4 + .6 * I));
      for (let k = 0; k < n; k++) { const s = S.sparks[k], q = ((A + s.o) / s.p) % 1, y = fy - S.FH * .55 - q * (S.pr ? 50 : 70), x = fx + Math.sin(q * s.sw + s.ph) * 2 + s.dr * q; if (q < .85 || ((A * 20 + k) & 1)) put(x, y, FIRE[Math.round(34 - q * 20)]); }
      if (on && T > B.log && T < B.log + 2) { const q = T - B.log; for (const s of S.burst) { if (q > s.l) continue; const k = q / s.l; put(fx + Math.cos(s.a) * s.v * q, fy - 6 + Math.sin(s.a) * s.v * q + 18 * q * q, FIRE[Math.round(35 - k * 22)]); } }
      // a star falls
      if (on && T > B.star[0] && T < B.star[1]) { const k = (T - B.star[0]) / (B.star[1] - B.star[0]), [x0, y0, x1, y1] = S.pr ? [bw * .15, bh * .07, bw * .55, bh * .18] : [bw * .3, bh * .07, bw * .62, bh * .24];
        for (let j = 0; j < 9; j++) { const kk = k - j * .018; if (kk < 0) break; const fade = (1 - j / 9) * (k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1); if (fade > .25) put(lerp(x0, x1, kk), lerp(y0, y1, kk), pack(mix(SKYC[2], hex("#FFF4E0"), fade))); } }
      // an owl crosses the moon, from past one edge to past the other
      if (on && T > B.owl[0] && T < B.owl[1]) { const k = (T - B.owl[0]) / (B.owl[1] - B.owl[0]), [[ax, ay], [bx, by]] = S.owlPath, x = lerp(ax, bx, k), y = lerp(ay, by, k) + Math.sin(k * 20) * 1.2, up = Math.floor(A * 6) & 1, c = pack(hex("#07060C"));
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [2, 0], ...(up ? [[-2, -1], [-3, -2], [3, -1], [4, -2]] : [[-2, 1], [-3, 1], [3, 1], [4, 1]])]) put(x + dx, y + dy, c); }
      // a fish jumps, and its rings spread across the water
      if (on && T > B.fish && T < B.fish + 2.6) { const q = T - B.fish, [lx, ly] = S.fishAt;
        if (q < .5) { const k = q / .5; for (let j = 0; j < 3; j++) put(lx + k * 6 + j, ly - Math.sin(k * Math.PI) * 5 + j * .4, pack(hex("#C8C4E0"))); }
        for (const [t0, a] of [[.45, 1], [.8, .7], [1.15, .5]]) { const rq = (q - t0) / 1.4; if (rq <= 0 || rq >= 1) continue; const rx = 2 + rq * 12, ry = rx * .28, c = pack(mix(hex("#1A1838"), hex("#C8C4E0"), a * (1 - rq))); for (let j = 0; j < 40; j++) { const th = j / 40 * Math.PI * 2; put(lx + 8 + Math.cos(th) * rx, ly + Math.sin(th) * ry, c); } } }
      // the finale: a column of sparks goes up and opens into new stars, twinkling, then gone
      if (F >= 0) for (const s of S.fan) { const k = clamp((F - s.d) / (1 - s.d)); if (k <= 0 || k >= 1) continue; const up = E.out(clamp(k / .45)), open = E.out(clamp((k - .3) / .35)), x = fx + s.x * lerp(.06, 1, open), y = lerp(fy - 10, s.y, up);
        const c = k < .5 ? FIRE[Math.round(34 - k * 20)] : pack(mix(SKYC[3], TW[Math.max(3, (s.tw + t8(3)) & 7)], k > .85 ? (1 - k) / .15 : 1)); put(x, y, c);
        if (k >= .5 && (s.tw & 1)) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + dx, y + dy, pack(mix(SKYC[3], TW[2], k > .85 ? (1 - k) / .15 : .8))); } /* new stars, some with arms */
      // up to the screen, crisp, with a soft bloom over it
      S.px2.putImageData(S.img, 0, 0);
      g.imageSmoothingEnabled = false; g.drawImage(S.pc, 0, 0, bw * PS, bh * PS);
      const bx = S.bc.getContext("2d"); bx.clearRect(0, 0, S.bc.width, S.bc.height); bx.drawImage(S.pc, 0, 0, S.bc.width, S.bc.height);
      g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .3; g.imageSmoothingEnabled = true; g.drawImage(S.bc, 0, 0, bw * PS, bh * PS); g.restore();
      // under each line, the night in shade: a long list's last lines lie over the fire and its sparks on a phone, and the
      // finale's column of sparks rises behind the lines (the stage lays its pad over this)
      g.save(); g.imageSmoothingEnabled = true; g.globalAlpha = .75; for (const [x0, y0, x1, y1, kind] of S.raw || []) if (kind === 1) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } g.restore();
    },
  };
  return S;
}
