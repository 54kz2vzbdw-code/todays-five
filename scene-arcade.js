// scene-arcade.js — 1.12 b332: Arcade's scene (scenes.js loads it). A game's attract mode in chunky pixel art, under neon
// bloom and CRT scanlines: a dithered sky, a big pixel moon, a city in two layers of parallax with lit windows and a neon
// sign, a glowing platform, and a small hero in a helmet and a magenta scarf. While the list is in use the hero waits,
// breathing, blinking, its antenna light pulsing. The loop, fifteen seconds: READY? — the hero crouches and springs off
// at GO!, the world scrolling; it jumps through an arc of coins, heads a block and a coin spins out, stomps a slime flat
// and bounces high off it; a star bounces in and it takes it, flashing through the colours with afterimages and speed
// lines; WARNING — a boss saucer drops in, its eye on the hero; the hero jumps its shots and answers with lasers, three
// hits, and it bursts in a shockwave of pixels; HIGH SCORE. The finale: LEVEL CLEAR drops in letter by letter under
// fireworks in pixels, and the hero jumps with a trophy. The kit's own finale line is "Level clear."
// Everything is drawn into a small pixel buffer and scaled up crisp; the bloom is that buffer again, blurred by drawing it
// small and stretching it back. Every beat is a function of the loop's time, so any moment can be held (tools/scene-lab).
export default function arcade(K) {
  const { clamp, lerp, E, seg, env, rng, canvas, sprite } = K;
  const TAU = Math.PI * 2;
  let g = null, b = null, pb = null, px = 1;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pal = o => { const m = {}; for (const k in o) m[k] = hex(o[k]); return m; };
  const NEON = ["#FF2BD6", "#2BE8FF", "#FFE14D", "#7CFF6B", "#FF7A3C", "#B388FF"];
  // the hero, 12×15, facing right: a helmet with a visor, a jacket, a scarf that trails, yellow boots
  const HP = pal({ H: "#EAF6FF", h: "#9FB6DC", V: "#1B2466", v: "#8FF3FF", J: "#2BE8FF", j: "#1A8FB0", S: "#FF2BD6", s: "#B1168F", P: "#6B55E0", B: "#FFE14D" });
  const HEAD = ["....HHHH....", "..HHHHHHHH..", ".HHHHHHHHHh.", ".HHHVVVVVvh.", ".HHHVVVVVVh.", ".hHHHHHHHhh.", "..hhhhhhhh.."];
  const BODY = { idle: [".SSJJJJJJ...", "SS.JJJJJJj..", "S..jJJJJJj..", "...JJJJJJ..."], flut: ["SSsJJJJJJ...", "s..JJJJJJj..", "...jJJJJJj..", "...JJJJJJ..."],
    a: ["SSSJJJJJJ...", "s..JJJJJJJj.", "...jJJJJJ...", "...JJJJJJ..."], b: ["sSSJJJJJJ...", "S..JJJJJJj..", "...jJJJJJj..", "...JJJJJJ..."], c: ["SSsJJJJJJ...", "..jJJJJJJ...", "..jJJJJJJj..", "...JJJJJJ..."],
    jump: ["SSSJJJJJJj..", "s..JJJJJJJ..", "...JJJJJJ...", "...JJJJJJ..."] };
  const LEGS = { idle: ["...PPPPPP...", "...PP..PP...", "...PP..PP...", "..BBB..BBB.."], r1: ["...PPPPPP...", "..PP....PP..", ".PP......PP.", ".BB......BBB"],
    r2: ["...PPPPPPP..", "....PP.PPP..", "....PP......", "...BBB......"], r3: ["...PPPPPP...", "..PP...PP...", ".PP.....PP..", "BBB.....BB.."],
    r4: ["..PPPPPPP...", "..PPP.PP....", "......PP....", "......BBB..."], jump: ["..PPPPPPP...", ".PP...PPP...", ".BB....BB...", "............"] };
  const hero = (head, body, legs) => sprite([...head, ...body, ...legs], HP);
  const BLINK = HEAD.map(r => r.replace("v", "V"));
  // the slime, the block, the coin, the star, the trophy
  const SLIME = ["...GGGG...", "..GGGGGG..", ".GGWWGWWG.", ".GGWKGWKG.", "GGGGGGGGGG", "GGGMMMMGGG", "GGGGGGGGGG", ".gggggggg."];
  const SP = pal({ G: "#7CFF6B", g: "#2FB84A", W: "#FFFFFF", K: "#0B0820", M: "#16662A" });
  const BLOCK = ["DDDDDDDDDDDD", "DYYYYYYYYYYD", "DYQQQQQQQQqD", "DYQQWWWWQQqD", "DYQWWQQWWQqD", "DYQQQQQWWQqD", "DYQQQQWWQQqD", "DYQQQWWQQQqD", "DYQQQQQQQQqD", "DYQQQWWQQQqD", "DYqqqqqqqqqD", "DDDDDDDDDDDD"];
  const COIN = [["..YYYY..", ".YWYYYY.", "YWYYYYYy", "YYYYYYYy", "YYYYYYYy", "YYYYYYyy", ".YYYYyy.", "..yyyy.."], ["...YY...", "..YWYY..", "..YYYy..", "..YYYy..", "..YYYy..", "..YYyy..", "..YYyy..", "...yy..."], ["...Y....", "...W....", "...Y....", "...Y....", "...Y....", "...Y....", "...y....", "...y...."]];
  const STAR = [".....Y.....", "....YYY....", "....YYY....", "YYYYYYYYYYY", ".YYYYYYYYY.", "..YYKYKYY..", "...YYYYY...", "..YYYYYYY..", ".YYY...YYY.", "YY.......YY"];
  const CUP = ["YYYYYYY", "yYYYYYy", "y.YYY.y", "..YYY..", "...Y...", "...Y...", "..YYY..", ".yyyyy."];
  // a 5×7 face for everything the game says
  const F5 = {};
  "A .###./#...#/#...#/#####/#...#/#...#/#...#|C .####/#..../#..../#..../#..../#..../.####|D ####./#...#/#...#/#...#/#...#/#...#/####.|E #####/#..../#..../####./#..../#..../#####|G .####/#..../#..../#..##/#...#/#...#/.####|H #...#/#...#/#...#/#####/#...#/#...#/#...#|I #####/..#../..#../..#../..#../..#../#####|L #..../#..../#..../#..../#..../#..../#####|N #...#/##..#/#.#.#/#..##/#...#/#...#/#...#|O .###./#...#/#...#/#...#/#...#/#...#/.###.|R ####./#...#/#...#/####./#.#../#..#./#...#|S .####/#..../#..../.###./....#/....#/####.|V #...#/#...#/#...#/#...#/#...#/.#.#./..#..|W #...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#|Y #...#/#...#/.#.#./..#../..#../..#../..#..|P ####./#...#/#...#/####./#..../#..../#....|U #...#/#...#/#...#/#...#/#...#/#...#/.###.|T #####/..#../..#../..#../..#../..#../..#..|? .###./#...#/....#/..##./..#../...../..#..|! ..#../..#../..#../..#../..#../...../..#..|+ ...../..#../..#../#####/..#../..#../.....|0 .###./#...#/#..##/#.#.#/##..#/#...#/.###.|1 ..#../.##../..#../..#../..#../..#../.###.|2 .###./#...#/....#/...#./..#../.#.../#####|3 ####./....#/....#/.###./....#/....#/####.|4 ...#./..##./.#.#./#..#./#####/...#./...#.|5 #####/#..../####./....#/....#/#...#/.###.|6 .###./#..../#..../####./#...#/#...#/.###.|7 #####/....#/...#./..#../.#.../.#.../.#...|8 .###./#...#/#...#/.###./#...#/#...#/.###.|9 .###./#...#/#...#/.####/....#/....#/.###."
    .split("|").forEach(e => { F5[e[0]] = e.slice(2).split("/"); });
  const S = {
    res: "dpr",
    wash: 1, veil: .66, list: .35, hug: .86, hugFinale: true, // a dark kit; a darker pad hugs the lines and the finale's words, so the rest keeps its colour
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, PS = pr ? 5 : 6, bw = Math.ceil(W / PS), bh = Math.ceil(H / PS), gy = Math.floor(bh * (pr ? .93 : .9)), r = rng(77);
      const D = pr ? 400 : 800, PF = pr ? 80 : 160, PN = pr ? 200 : 400; // how far the loop runs, and each layer's period: the loop wraps without a seam
      Object.assign(S, { W, H, pr, PS, bw, bh, gy, D, PF, PN, jk: pr ? .75 : 1 });
      if (S.heroX === undefined || S.lastBw !== bw) { S.heroX = S.heroTx = Math.round(bw * (pr ? .26 : .7)); S.lastBw = bw; }
      if (!S.bx) { S.bx = S.btx = bw * (pr ? .5 : .8); S.by = S.bty = bh * (pr ? .22 : .32); }
      [pb, b] = canvas(bw, bh); b.imageSmoothingEnabled = false; S.tcache = new Map();
      [S.tiny1] = canvas(Math.ceil(bw / 2), Math.ceil(bh / 2)); [S.tiny2] = canvas(Math.ceil(bw / 6), Math.ceil(bh / 6));
      for (const t of [S.tiny1, S.tiny2]) t.getContext("2d").imageSmoothingEnabled = true;
      // how the world scrolls: still, a run from GO!, faster with the star, easing to a stop for the boss; normalised so
      // the loop covers D exactly, a multiple of every layer's period
      const vp = t => t < 1.2 ? 0 : t < 1.7 ? E.out((t - 1.2) / .5) : t < 6.6 ? 1 : t < 6.9 ? lerp(1, 1.7, (t - 6.6) / .3) : t < 7.8 ? 1.7 : t < 8.5 ? 1.7 * (1 - E.io((t - 7.8) / .7)) : 0;
      const N = 15 * 240, cum = new Float32Array(N + 1); for (let k = 1; k <= N; k++) cum[k] = cum[k - 1] + vp(k / 240) / 240;
      S.X = t => { const f = clamp(t / 15) * N, i = Math.min(N - 1, Math.floor(f)); return D * lerp(cum[i], cum[i + 1], f - i) / cum[N]; };
      // sprites
      S.hIdle = [hero(HEAD, BODY.idle, LEGS.idle), hero(HEAD, BODY.flut, LEGS.idle)]; S.hBlink = hero(BLINK, BODY.idle, LEGS.idle);
      S.hRun = [hero(HEAD, BODY.a, LEGS.r1), hero(HEAD, BODY.b, LEGS.r2), hero(HEAD, BODY.c, LEGS.r3), hero(HEAD, BODY.b, LEGS.r4)]; S.hJump = hero(HEAD, BODY.jump, LEGS.jump);
      const tint = (spr, col) => { const [c, x] = canvas(spr.width, spr.height); x.drawImage(spr, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, spr.width, spr.height); return c; };
      S.hGhost = NEON.map(c => [...S.hRun, S.hJump].map(s2 => tint(s2, c)));
      S.slime = sprite(SLIME, SP); S.flat = sprite([".GGGGGGGG.", "GWKGGGGWKG", "gggggggggg"], SP);
      S.block = sprite(BLOCK, pal({ D: "#8A4B00", Y: "#FFE08A", Q: "#FFB02E", q: "#C77A0A", W: "#FFFFFF" }));
      S.used = sprite(BLOCK, pal({ D: "#2E1E10", Y: "#8A6A48", Q: "#6B4E32", q: "#4A3522", W: "#6B4E32" }));
      S.coin = COIN.map(rows => sprite(rows, pal({ Y: "#FFE14D", y: "#C9A21A", W: "#FFFFFF" }))); S.coin.push(S.coin[1]);
      S.star = NEON.map(c => sprite(STAR, pal({ Y: c, K: "#0B0820" })));
      S.cup = sprite(CUP, pal({ Y: "#FFE14D", y: "#C9A21A" }));
      // the boss: a saucer with a glass dome, drawn by rule so it's symmetric; its eye, lights and flames are drawn live
      const bossPix = (x, y, white) => {
        const dx = (x + .5 - 15) / 8.6, dy = (y + .5 - 8.2) / 7.8, sx = (x + .5 - 15) / 15, sy = (y + .5 - 11) / 3.6, w = [255, 255, 255];
        if (y <= 8 && dx * dx + dy * dy <= 1) return white ? w : dx < -.35 && dy < -.25 && dx * dx + dy * dy > .45 ? hex("#CFFBFF") : dx * dx + dy * dy > .7 ? hex("#1E6F9E") : hex("#3FB8E0");
        if (sx * sx + sy * sy <= 1) return white ? w : y < 10 ? hex("#DAD6F5") : y < 12 ? hex("#9B96C8") : hex("#58538A");
        if (y >= 14 && y <= 15 && [5, 6, 11, 12, 17, 18, 23, 24].includes(x)) return white ? w : hex("#403C6E");
        return null;
      };
      S.boss = K.paint(30, 16, (x, y) => bossPix(x, y, false)); S.bossWhite = K.paint(30, 16, (x, y) => bossPix(x, y, true));
      // the moon, big and pale, with its craters
      const mr = pr ? 8 : 12; S.moonR = mr;
      S.moon = K.paint(mr * 2 + 1, mr * 2 + 1, (x, y) => { const dx = x - mr, dy = y - mr, d = Math.hypot(dx, dy); if (d > mr + .3) return null; for (const [cx, cy, cr] of [[-.35, -.2, .22], [.25, .3, .16], [.1, -.45, .12]]) if (Math.hypot(dx - cx * mr, dy - cy * mr) < cr * mr) return hex("#A89EE2"); return dx + dy * .3 > mr * .45 ? hex("#9A90D6") : hex("#CFC8F5"); });
      S.moonAt = pr ? [Math.round(bw * .74), Math.round(bh * .12)] : [Math.round(bw * .84), Math.round(bh * .16)];
      // the city: a far layer and a near one, each a strip one period wide that repeats
      const strip = (Pw, hMax, near) => { const Hh = Math.ceil(hMax) + 8; return [K.paint(Pw, Hh, () => null), Hh]; };
      const [far, fh] = strip(PF, gy * .42), fx = far.getContext("2d"); S.far = far; S.farH = fh;
      for (let x = 0; x < PF;) { const w = 6 + Math.floor(r() * 10), h = Math.floor(fh * (.3 + r() * .6)); if (x + w > PF) break; fx.fillStyle = "#170F3D"; fx.fillRect(x, fh - h, w, h); fx.fillStyle = "#231958"; fx.fillRect(x, fh - h, w, 1); fx.fillStyle = "#3A2C80"; for (let wy = fh - h + 3; wy < fh - 2; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 2) if (r() < .18) fx.fillRect(wx, wy, 1, 1); x += w + Math.floor(r() * 3); }
      const [nearS, nh] = strip(PN, gy * .58), nx = nearS.getContext("2d"); S.near = nearS; S.nearH = nh; S.wins = []; S.antennas = [];
      const LIT = ["#FF2BD6", "#2BE8FF", "#FFE14D", "#FF2BD6", "#2BE8FF"];
      const F3 = { A: [".#.", "#.#", "###", "#.#", "#.#"], R: ["##.", "#.#", "##.", "#.#", "#.#"], C: [".##", "#..", "#..", "#..", ".##"], D: ["##.", "#.#", "#.#", "#.#", "##."], E: ["###", "#..", "##.", "#..", "###"] };
      let signDone = false;
      for (let x = 1; x < PN;) {
        const w = 10 + Math.floor(r() * 14), h = Math.floor(nh * (.35 + r() * .62)); if (x + w > PN - 1) break; const top = nh - h;
        nx.fillStyle = "#0E0927"; nx.fillRect(x, top, w, h); nx.fillStyle = "#20174A"; nx.fillRect(x, top, 1, h); nx.fillStyle = "#2A1F5E"; nx.fillRect(x, top, w, 1);
        for (let wy = top + 3; wy < nh - 3; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) { const lit = r() < .42; nx.fillStyle = lit ? LIT[Math.floor(r() * LIT.length)] : "#1B1346"; nx.fillRect(wx, wy, 1, 2); if (lit && r() < .2) S.wins.push({ x: wx, y: wy, ph: r() * 40 }); }
        if (r() < .45) { const ax = x + 2 + Math.floor(r() * (w - 4)), ah = 3 + Math.floor(r() * 5); nx.fillStyle = "#2A1F5E"; nx.fillRect(ax, top - ah, 1, ah); S.antennas.push({ x: ax, y: top - ah - 1, ph: r() * TAU }); }
        if (!signDone && h > 42 && w >= 12) { // a vertical neon sign: ARCADE
          const sx2 = x + Math.floor(w / 2) - 2, sy2 = top + 4; nx.fillStyle = "#1A0B2E"; nx.fillRect(sx2 - 1, sy2 - 1, 5, 37); S.sign = { x: sx2, y: sy2 }; signDone = true;
        }
        x += w + 1 + Math.floor(r() * 3);
      }
      S.F3 = F3;
      // the ground: a neon edge, and bricks under it, one period of them
      const gh = bh - gy; S.ground = K.paint(16, gh, (x, y) => { if (y === 0) return hex("#FF8AE8"); if (y === 1) return hex("#E020C0"); if (y === 2) return hex("#6A1890"); const yy = y - 3, row = Math.floor(yy / 4), off = row % 2 ? 8 : 0, bx2 = (x + off) % 16; if (yy % 4 === 3 || bx2 === 0) return hex("#0C0620"); return yy % 4 === 0 ? hex("#3F2388") : yy % 4 === 2 ? hex("#1C0D44") : hex("#2A1461"); });
      // the stars, in two depths
      S.stars = Array.from({ length: Math.round(bw * gy / (pr ? 60 : 70)) }, () => ({ x: r() * bw, y: r() * gy * .75, p: r() < .5 ? .04 : .08, c: r() < .15 ? 1 : r() < .15 ? 2 : 0, ph: r() * TAU, f: .5 + r() * 2 }));
      // the stars that don't twinkle are drawn once, a layer for each depth, and scrolled; a sixth of them twinkle live
      S.starL = [.04, .08].map(p => { const [c, x] = canvas(bw, gy); for (const st of S.stars) if (st.p === p && Math.round(st.ph * 10) % 6) { x.globalAlpha = .55 + .35 * ((st.ph * 7) % 1); x.fillStyle = ["#FFFFFF", "#9AE7FF", "#FF9AF0"][st.c]; x.fillRect(Math.round(st.x), Math.round(st.y), 1, 1); } return c; });
      S.twinkle = S.stars.filter(st => !(Math.round(st.ph * 10) % 6));
      S.bits = Array.from({ length: 48 }, () => ({ a: r() * TAU, v: .4 + r() * .8, c: Math.floor(r() * 4), s: r() < .3 ? 2 : 1 }));
      S.fire = Array.from({ length: 5 }, (_, i) => ({ dx: [-.9, .9, -.5, .55, 0][i], dy: [-.3, -.4, -1.1, -1.15, -1.5][i], t: .12 + i * .1, c: i, parts: Array.from({ length: 26 }, () => ({ a: r() * TAU, v: .6 + r() * .4 })) }));
      S.confetti = Array.from({ length: pr ? 40 : 70 }, () => ({ x: r(), d: r() * .4, v: .6 + r() * .6, c: Math.floor(r() * 6), w: r() < .5 }));
      // the backdrop: a dithered sky in bands, a haze of magenta at the horizon, a glow behind the moon, a vignette
      const SKY = ["#05041A", "#0B0828", "#140B3A", "#221050", "#34125E", "#4A1470"].map(hex);
      const sky = K.paint(bw, gy, (x, y) => { const t = y / gy * (SKY.length - 1) + K.dith(x, y) - .5; return SKY[clamp(Math.round(t), 0, SKY.length - 1)]; });
      bg.imageSmoothingEnabled = false; bg.drawImage(sky, 0, 0, bw * PS, gy * PS); bg.imageSmoothingEnabled = true;
      bg.fillStyle = "#0C0620"; bg.fillRect(0, gy * PS, W, H - gy * PS);
      bg.imageSmoothingEnabled = false; bg.drawImage(S.moon, S.moonAt[0] * PS, S.moonAt[1] * PS, S.moon.width * PS, S.moon.height * PS); bg.imageSmoothingEnabled = true; // on the backdrop, so the bloom leaves its craters
      const [mx, my] = S.moonAt, mg = bg.createRadialGradient((mx + mr) * PS, (my + mr) * PS, mr * PS * .8, (mx + mr) * PS, (my + mr) * PS, mr * PS * 3.2); mg.addColorStop(0, "rgba(190,170,255,.22)"); mg.addColorStop(1, "rgba(190,170,255,0)"); bg.fillStyle = mg; bg.fillRect(0, 0, W, H);
      const hz = bg.createLinearGradient(0, gy * PS - H * .3, 0, gy * PS); hz.addColorStop(0, "rgba(255,43,214,0)"); hz.addColorStop(1, "rgba(255,43,214,.16)"); bg.fillStyle = hz; bg.fillRect(0, gy * PS - H * .3, W, H * .3);
      const vg = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .78); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.5)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      // the scanlines: one dark line under every row of the game's pixels
      const [sl, sx] = canvas(1, Math.max(2, Math.round(PS * px))); sx.fillStyle = "rgba(0,0,0,.34)"; sx.fillRect(0, sl.height - Math.max(1, Math.round(PS * px * .3)), 1, Math.max(1, Math.round(PS * px * .3))); S.scan = sl;
      S.scanPat = null; if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the hero stands where the column above its ground is clear of them, and the
     *  banners go up in the clearest open space */
    words(rects) {
      S.raw = rects; S.wr = rects.map(([x0, y0, x1, y1, k]) => [x0 - 8, y0 - 8, x1 + 8, y1 + 8, k]); if (!S.bw) return;
      const { PS, bw, bh, gy, pr } = S, top = (gy - (pr ? 58 : 48)) * PS, hit = (x0, y0, x1, y1) => S.wr.some(r => r[0] < x1 && r[2] > x0 && r[1] < y1 && r[3] > y0);
      let hx = null; for (let x = pr ? 12 : 10; x < bw - (pr ? 40 : 76); x += 2) if (!hit((x - 2) * PS, top, (x + 16) * PS, gy * PS)) { hx = x; break; }
      S.heroTx = hx === null ? Math.round(bw * (pr ? .26 : .7)) : hx;
      // the banners: a panel 70×15 of the game's pixels, wherever it is furthest from any word
      let best = -1e9, bx = S.btx, by = S.bty; const pw = 72 * PS, ph = 17 * PS;
      for (let gx = 0; gx <= 16; gx++) for (let gy2 = 0; gy2 <= 12; gy2++) {
        const cx = pw / 2 + 8 + (S.W - pw - 16) * gx / 16, cy = S.H * .1 + ph / 2 + ((gy - (pr ? 46 : 52)) * PS - ph - S.H * .1) * gy2 / 12;
        let d = 1e9; for (const r of S.wr) d = Math.min(d, Math.hypot(Math.max(r[0] - (cx + pw / 2), 0, (cx - pw / 2) - r[2]), Math.max(r[1] - (cy + ph / 2), 0, (cy - ph / 2) - r[3])));
        if (d > best + 1) { best = d; bx = cx; by = cy; }
      }
      S.btx = bx / PS; S.bty = by / PS;
    },
    /** 1 clear of the words, down to a trace behind them (CSS pixels) */
    shade(x, y, rad) { let d = 1e9; for (const [x0, y0, x1, y1] of S.wr || []) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))); return lerp(.15, 1, clamp(d / rad)); }, // full once clear of the word, faint only behind it
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, PS, bw, bh, gy, D, PF, PN, jk, pr } = S, on = I > .01;
      // glide to where the words leave room; the world's scroll, kept where it was if the loop is cut short
      if (S.lastT !== undefined && T < S.lastT - 1) S.base = ((S.base || 0) + S.X(S.lastT)) % (PF * PN * 16); S.lastT = T;
      const dt = S.lastA === undefined ? 0 : clamp(A - S.lastA, 0, .1); S.lastA = A; const glide = 1 - Math.exp(-dt * 3);
      S.heroX += (S.heroTx - S.heroX) * glide; S.bx += (S.btx - S.bx) * glide; S.by += (S.bty - S.by) * glide;
      const hx = Math.round(S.heroX), X = (S.base || 0) + S.X(T), wX = t => S.X(t) - S.X(T); // where a thing placed at loop time t is now, relative to then
      b.clearRect(0, 0, bw, bh); b.globalAlpha = 1;
      const put = (spr, x, y, a = 1, sx = 1, sy = 1) => { if (a <= .01) return; b.globalAlpha = clamp(a); const w = spr.width * sx, h = spr.height * sy; b.drawImage(spr, Math.round(x + (spr.width - w) / 2), Math.round(y + spr.height - h), Math.round(w), Math.round(h)); b.globalAlpha = 1; };
      const dot = (x, y, col, a = 1, s = 1) => { if (a <= .01) return; b.globalAlpha = clamp(a); b.fillStyle = col; b.fillRect(Math.round(x), Math.round(y), s, s); b.globalAlpha = 1; }; // and back to 1, or whatever is drawn next inherits it
      const txt = (s, x, y, col, a = 1, sc = 1, rainbow = false) => { if (a <= .01) return; const ph = rainbow ? Math.floor(A * 10) % 6 : -1, key = s + "|" + col + "|" + sc + "|" + ph; let c = S.tcache.get(key);
        if (!c) { const w = s.length * 6 * sc + 1, h = 7 * sc + 1; let x2; [c, x2] = canvas(w, h); [...s].forEach((ch, i) => { const gl = F5[ch]; if (!gl) return; const cc = rainbow ? NEON[(i + ph) % 6] : col; gl.forEach((row, j) => { for (let k = 0; k < 5; k++) if (row[k] === "#") { x2.fillStyle = "#0B0820"; x2.fillRect(i * 6 * sc + k * sc + 1, j * sc + 1, sc, sc); } }); gl.forEach((row, j) => { for (let k = 0; k < 5; k++) if (row[k] === "#") { x2.fillStyle = cc; x2.fillRect(i * 6 * sc + k * sc, j * sc, sc, sc); } }); }); if (S.tcache.size > 300) S.tcache.clear(); S.tcache.set(key, c); }
        b.globalAlpha = clamp(a); b.drawImage(c, Math.round(x), Math.round(y)); b.globalAlpha = 1; };
      const tw = (s, sc = 1) => s.length * 6 * sc - sc;
      const shadeB = (x, y, r = 6) => S.shade(x * PS, y * PS, r * PS);
      // the stars, twinkling
      [.04, .08].forEach((p, i) => { const o = -(((X * p) % bw) + bw) % bw; b.drawImage(S.starL[i], Math.round(o), 0); b.drawImage(S.starL[i], Math.round(o) + bw, 0); });
      for (const s of S.twinkle) { const x = ((s.x - X * s.p) % bw + bw) % bw, k = .45 + .55 * Math.pow(Math.max(0, Math.sin(A * s.f + s.ph)), 3); dot(x, s.y, ["#FFFFFF", "#9AE7FF", "#FF9AF0"][s.c], k); }
      // the city: the far layer, the near one with its flickering windows, antenna lights and the sign
      for (let x = -(((X * .2) % PF) + PF) % PF; x < bw; x += PF) b.drawImage(S.far, Math.round(x), gy - S.farH);
      const nOff = -(((X * .5) % PN) + PN) % PN;
      for (let x = nOff; x < bw; x += PN) {
        b.drawImage(S.near, Math.round(x), gy - S.nearH);
        for (const w of S.wins) { const on2 = Math.sin(A * .7 + w.ph) > .82; if (on2) dot(x + w.x, gy - S.nearH + w.y, "#0E0927", 1, 1), dot(x + w.x, gy - S.nearH + w.y + 1, "#0E0927", 1, 1); }
        for (const a2 of S.antennas) dot(x + a2.x, gy - S.nearH + a2.y, "#FF3B5C", .4 + .6 * (Math.sin(A * 3 + a2.ph) > .3 ? 1 : 0));
        if (S.sign) { const flick = Math.sin(A * 23) > -.85 || Math.sin(A * 3.1) > .5 ? 1 : .25, sx2 = x + S.sign.x, sy2 = gy - S.nearH + S.sign.y; [..."ARCADE"].forEach((ch, i) => S.F3[ch].forEach((row, j) => { for (let k = 0; k < 3; k++) if (row[k] === "#") dot(sx2 + k, sy2 + i * 6 + j, i % 2 ? "#2BE8FF" : "#FF2BD6", flick); })); }
      }
      // speed lines while the star lasts
      const pow = on ? env(T, 6.55, 6.7, 8.9, 9.3) * I : 0;
      if (pow > .02) { const r2 = rng(Math.floor(A * 30)); for (let k = 0; k < 14; k++) { const y = 6 + r2() * (gy - 14), x = r2() * bw, l = 8 + r2() * 20; if (shadeB(x + l / 2, y, l / 2 + 4) < .95) continue; b.globalAlpha = pow * .55; b.fillStyle = NEON[k % 6]; b.fillRect(Math.round(x), Math.round(y), Math.round(l), 1); } b.globalAlpha = 1; }
      // the ground, scrolling
      for (let x = -((X % 16) + 16) % 16; x < bw; x += 16) b.drawImage(S.ground, Math.round(x), gy);
      // the neon edge dims under words that sit right on it (a long list's last lines), so they keep their contrast
      for (const [x0, y0, x1, y1] of S.wr || []) if (y1 > gy * PS - 70 && y1 < gy * PS + 12) { b.globalAlpha = .82; b.fillStyle = "#1C0D44"; b.fillRect(Math.floor(x0 / PS) - 2, gy, Math.ceil((x1 - x0) / PS) + 4, 3); b.globalAlpha = 1; }
      // the hero's height above the ground at loop time t: its jumps, each [start, length, height]
      const JUMPS = [[1.2, .34, 5], [2.25, .62, 14], [3.6, .56, 16], [4.62, .52, 12], [5.04, .56, 18], [9.4, .46, 12], [10.0, .46, 12], [10.6, .46, 12], [11.75, .44, 9]];
      const jumpAt = t => { for (const [s, d, h] of JUMPS) if (t >= s && t < s + d) { const k = (t - s) / d; return { y: 4 * k * (1 - k) * h * jk, k, s, d }; } return null; };
      const top0 = gy - 15;
      // coins in an arc, taken on the first jump
      if (on) for (let k = 0; k < 5; k++) { const tk = 2.25 + .62 * (.12 + .19 * k), sx2 = hx + 2 + wX(tk), jy = jumpAt(tk), y = top0 - (jy ? jy.y : 0) + 3;
        if (T < tk) { if (sx2 < bw + 8) put(S.coin[Math.floor(A * 10 + k) % 4], sx2, y + Math.round(Math.sin(A * 5 + k) * .6), I * shadeB(sx2, y)); }
        else if (T < tk + .45) { const p = (T - tk) / .45; for (let q = 0; q < 6; q++) { const a = q / 6 * TAU; dot(sx2 + 4 + Math.cos(a) * p * 7, y + 4 + Math.sin(a) * p * 7, "#FFE14D", I * (1 - p)); } txt("+10", sx2 - 3, y - 6 - p * 8, "#FFFFFF", I * (1 - p) * .9); } }
      // the block the hero heads, and the coin that spins out of it
      const tb = 3.88, bxs = hx + wX(tb), byk = top0 - 3 - Math.round(16 * jk) - 12;
      if (on && bxs > -14 && bxs < bw + 2) { const bump = env(T, tb, tb + .05, tb + .06, tb + .16) * 3; put(T < tb ? S.block : S.used, bxs, byk - bump, I * shadeB(bxs + 6, byk + 6, 8));
        const ck = seg(T, tb, tb + .7, x => x); if (ck > 0 && ck < 1) { const cy = byk - 9 - Math.sin(ck * Math.PI) * 16; put(S.coin[Math.floor(A * 20) % 4], bxs + 2, cy, I); if (ck > .75) txt("+100", bxs - 5, cy - 8, "#FFE14D", I); } }
      // the slime, hopping in, stomped flat, gone in a puff
      const ts = 4.62 + .52 * .8, sxs = hx + 1 + wX(ts) + 12 * (ts - T);
      if (on && T > 3.9 && T < ts + .9) {
        if (T < ts) { const hop = Math.abs(Math.sin(T * 7)), sq = hop < .15 ? 1.2 : 1; put(S.slime, sxs, gy - 8 - Math.round(hop * 4), I * shadeB(sxs + 5, gy - 6), sq, 2 - sq); }
        else if (T < ts + .5) put(S.flat, hx + 1 + wX(ts), gy - 3, I);
        else { const p = (T - ts - .5) / .4; for (let q = 0; q < 8; q++) { const a = q / 8 * TAU; dot(hx + 6 + wX(ts) + Math.cos(a) * p * 8, gy - 3 + Math.sin(a) * p * 4, "#7CFF6B", I * (1 - p)); } }
        if (T > ts && T < ts + .8) txt("+200", hx - 2 + wX(ts), gy - 26 - (T - ts) * 10, "#7CFF6B", I * (1 - seg(T, ts + .5, ts + .8))); }
      // the star, bouncing in
      const tp = 6.55, sxp = hx + 2 + wX(tp) + 20 * (tp - T);
      if (on && T > 5.6 && T < tp) put(S.star[Math.floor(A * 12) % 6], sxp, gy - 11 - Math.round(Math.abs(Math.sin((tp - T) * 8)) * 12), I);
      if (on && T >= tp && T < tp + .6) txt("+1000", hx - 6, top0 - 12 - (T - tp) * 12, "#FFFFFF", I * (1 - seg(T, tp + .3, tp + .6)), 1, true);
      // WARNING, and the edges pulsing red
      const warn = on ? env(T, 7.9, 8.0, 8.8, 9.0) * I : 0;
      if (warn > .02) { const blink = Math.floor(A * 6) % 2; b.globalAlpha = warn * (blink ? .8 : .3); b.fillStyle = "#FF2B4E"; b.fillRect(0, gy - 1, bw, 1); b.fillRect(0, 0, 1, gy); b.fillRect(bw - 1, 0, 1, gy); b.globalAlpha = 1; }
      // the boss: down with a wobble, its eye on the hero; shots, lasers, hits; the burst
      const bossX = Math.round(Math.min(hx + (pr ? 34 : 40), bw - 31)), hover = gy - 30, drop = seg(T, 8.3, 9.0, E.back), dead = seg(T, 11.25, 11.3, x => x) >= 1;
      const HITS = [10.36, 10.96, 11.56].map(t => t - .5), SHOTS = [9.2, 9.8, 10.4];
      let shake = 0;
      if (on && T > 8.3 && !dead) {
        const hitNow = HITS.some(t => T > t && T < t + .12), knock = HITS.reduce((m, t) => Math.max(m, env(T, t, t + .03, t + .06, t + .2) * 2), 0), dying = seg(T, 11.1, 11.3, x => x);
        const by2 = Math.round(lerp(-20, hover, drop) + Math.sin(A * 3) * 1.2), bx2 = bossX + Math.round(knock) + (dying > 0 ? Math.round((Math.random() - .5) * 3) : 0), a = I * shadeB(bx2 + 15, by2 + 8, 16);
        put(hitNow || (dying > 0 && Math.floor(A * 30) % 2) ? S.bossWhite : S.boss, bx2, by2, a);
        // its eye, its lights, its flames
        const ex = bx2 + 15 + (hx < bx2 ? -1 : 1), ey = by2 + 4; for (let q = -2; q <= 2; q++) for (let w = -2; w <= 2; w++) if (q * q + w * w <= 5) dot(bx2 + 15 + q, ey + w, "#FFFFFF", a); dot(ex - 1, ey - 1, "#FF2B5E", a, 2); dot(ex - 1, ey, "#FF2B5E", a, 2); dot(ex - (hx < bx2 ? 1 : 0), ey, "#0B0820", a);
        for (let k = 0; k < 7; k++) dot(bx2 + 3 + k * 4, by2 + 10, NEON[(k + Math.floor(A * 8)) % 3], a);
        for (const fx2 of [5, 11, 17, 23]) { const f = Math.floor(A * 20 + fx2) % 3; dot(bx2 + fx2, by2 + 16, f ? "#FFE14D" : "#FF7A3C", a, 2); if (f) dot(bx2 + fx2, by2 + 18, "#FF7A3C", a * .6, 2); }
        // its health, in three
        if (T > 9.0) { const hp = 3 - HITS.filter(t => T > t).length; b.globalAlpha = a; b.fillStyle = "#0B0820"; b.fillRect(bx2 - 1, by2 - 6, 32, 4); for (let k = 0; k < 3; k++) { b.fillStyle = k < hp ? "#FF2B5E" : "#3A1024"; b.fillRect(bx2 + k * 10, by2 - 5, 9, 2); } b.globalAlpha = 1; }
        if (T > 9.0 && T < 9.12) shake = 1.5;
        if (hitNow) shake = 1.2;
      }
      // its shots, which the hero jumps
      if (on && !dead) for (const t of SHOTS) { const k = seg(T, t, t + .7, x => x); if (k <= 0 || k >= 1) continue; const x = lerp(bossX + 2, hx - 26, k), y = gy - 7; dot(x - 1, y - 1, "#FF5A8A", I, 3); dot(x, y, "#FFFFFF", I); for (let q = 1; q < 4; q++) dot(x + q * 3, y, "#FF5A8A", I * (1 - q / 4)); }
      // the hero's lasers, and the sparks where they land
      if (on) for (const t of HITS) { const k = seg(T, t - .08, t + .1, x => x); if (k > 0 && k < 1) { b.globalAlpha = I * (1 - k); b.fillStyle = "#2BE8FF"; b.fillRect(hx + 12, gy - 9, bossX - hx - 10, 2); b.fillStyle = "#FFFFFF"; b.fillRect(hx + 12, gy - 9, bossX - hx - 10, 1); b.globalAlpha = 1; }
        const sp = seg(T, t, t + .3, x => x); if (sp > 0 && sp < 1) for (let q = 0; q < 8; q++) { const a = q / 8 * TAU + t; dot(bossX + 2 + Math.cos(a) * sp * 7, gy - 12 + Math.sin(a) * sp * 7, q % 2 ? "#FFFFFF" : "#2BE8FF", I * (1 - sp)); } }
      // the burst: a flash, a ring, pieces, +5000
      const boom = on ? seg(T, 11.25, 12.1, x => x) : 0;
      if (boom > 0 && boom < 1) { const cx = bossX + 15, cy = hover + 8, rr = E.out(boom) * 34;
        for (let q = 0; q < 48; q++) { const a = q / 48 * TAU; dot(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .7, q % 2 ? "#FFFFFF" : "#FF2BD6", I * (1 - boom)); }
        for (const p of S.bits) { const d = E.out(boom) * 30 * p.v; dot(cx + Math.cos(p.a) * d, cy + Math.sin(p.a) * d * .8 + boom * boom * 20, ["#DAD6F5", "#3FB8E0", "#FF2BD6", "#FFE14D"][p.c], I * (1 - boom), p.s); }
        if (boom < .2) shake = 2.5 * (1 - boom / .2);
        txt("+5000", cx - 14, cy - 18 - boom * 10, "#FFE14D", I * (1 - seg(boom, .7, 1)), 1, true); }
      // the hero: waiting, crouching, running, jumping; lit up by the star, its afterimages; the finale's jump with a trophy
      const jy = on ? jumpAt(T) : null, run = on && T > 1.2 && T < 8.6, spd = S.X(T + .05) - S.X(T);
      let spr = S.hIdle[Math.floor(A * 1.6) % 2], y = top0, sx = 1, sy = 1;
      if (!on && (A % 4.2) < .14) spr = S.hBlink;
      if (run && spd > .2) spr = S.hRun[Math.floor(A * (7 + spd * 3)) % 4];
      if (jy) { spr = S.hJump; y -= Math.round(jy.y * I); if (jy.k < .12) { sx = .88; sy = 1.14; } }
      else if (on && JUMPS.some(([s, d]) => T > s + d && T < s + d + .08)) { sx = 1.18; sy = .84; }
      if (on && T > .95 && T < 1.2) { sx = 1.16; sy = .82; }
      if (F >= 0) { const fj = seg(F, 0, .5, x => x); if (fj > 0 && fj < 1) { spr = S.hJump; y = top0 - Math.round(4 * fj * (1 - fj) * 26 * jk); } }
      if (pow > .02 && spr !== S.hIdle[0]) { const set = S.hGhost; for (let q = 3; q >= 1; q--) { const gi = spr === S.hJump ? 4 : S.hRun.indexOf(spr); if (gi < 0) continue; put(set[(q + Math.floor(A * 10)) % 6][gi], hx - q * 4, y, pow * .35 * (1 - q / 4)); } }
      const ha = shadeB(hx + 6, y + 7, 10);
      put(spr, hx, y, ha, sx, sy);
      if (pow > .02 && Math.floor(A * 16) % 2) { const gi = spr === S.hJump ? 4 : Math.max(0, S.hRun.indexOf(spr)); put(S.hGhost[Math.floor(A * 12) % 6][gi], hx, y, pow * .55 * ha, sx, sy); }
      dot(hx + 6, y - 2, "#9FB6DC", ha); dot(hx + 6, y - 3, "#9FB6DC", ha); dot(hx + 6, y - 4, "#FF2BD6", ha * (.5 + .5 * Math.sin(A * 4))); // its antenna, the light pulsing
      if (F >= 0 && F < .92) put(S.cup, hx + 3, y - 12, 1);
      // dust when it lands or sets off
      if (on) for (const [s, d] of [[1.2, .01], ...JUMPS.map(([s2, d2]) => [s2 + d2, 0])]) { const p = seg(T, s, s + .3, x => x); if (p > 0 && p < 1) for (const q of [-1, 1]) dot(hx + 6 + q * (3 + p * 6), gy - 2 - p * 3, "#B388FF", I * (1 - p)); }
      // the banners, in their panel: READY?, GO!, WARNING, HIGH SCORE!, and the finale's LEVEL CLEAR
      const panel = (s, a, sc = 1, col = "#FFFFFF", rainbow = false, drop2 = null) => {
        if (a <= .01) return; const w = tw(s, sc), h = 7 * sc, x0 = Math.round(S.bx - w / 2), y0 = Math.round(S.by - h / 2);
        b.globalAlpha = a * .82; b.fillStyle = "#0B0820"; b.fillRect(x0 - 5, y0 - 5, w + 10, h + 10); b.globalAlpha = 1;
        const per = 2 * (w + 10) + 2 * (h + 10); for (let q = 0; q < per; q += 2) { const lit = (q / 2 + Math.floor(A * 18)) % 3 === 0, qq = q; let xx, yy; if (qq < w + 10) { xx = x0 - 5 + qq; yy = y0 - 5; } else if (qq < w + 10 + h + 10) { xx = x0 + w + 4; yy = y0 - 5 + qq - (w + 10); } else if (qq < 2 * (w + 10) + h + 10) { xx = x0 + w + 4 - (qq - (w + 10 + h + 10)); yy = y0 + h + 4; } else { xx = x0 - 5; yy = y0 + h + 4 - (qq - (2 * (w + 10) + h + 10)); } dot(xx, yy, lit ? "#FFE14D" : "#FF2BD6", a * (lit ? 1 : .55)); }
        if (!drop2) txt(s, x0, y0, col, a, sc, rainbow);
        else [...s].forEach((ch, i) => { const k = drop2(i); if (k <= 0) return; txt(ch, x0 + i * 6 * sc, y0 - Math.round((1 - E.back(k)) * 24), rainbow ? NEON[(i + Math.floor(A * 10)) % 6] : col, a * clamp(k * 3), sc); });
      };
      if (on && F < 0) {
        const ready = env(T, .3, .4, 1.0, 1.15) * I; if (ready > .02 && Math.floor(A * 5) % 3) panel("READY?", ready);
        const go = env(T, 1.2, 1.26, 1.7, 1.9) * I; if (go > .02) panel("GO!", go, 2, "#7CFF6B");
        if (warn > .02 && Math.floor(A * 6) % 2) panel("WARNING", warn, 1, "#FF2B4E");
        const hs = env(T, 12.0, 12.2, 13.8, 14.3) * I; if (hs > .02) panel("HIGH SCORE!", hs, 1, "#FFFFFF", true);
      }
      if (F >= 0) {
        const a = 1 - seg(F, .88, 1); panel("LEVEL CLEAR", a, 1, "#FFFFFF", true, i => seg(F, .05 + i * .035, .17 + i * .035, x => x));
        for (const f of S.fire) { const k = seg(F, f.t, f.t + .55, x => x); if (k <= 0 || k >= 1) continue; const cx = S.bx + f.dx * 40, cy = S.by + f.dy * 16;
          if (k < .2) { dot(cx, cy + (1 - k / .2) * 20, "#FFFFFF", 1); dot(cx, cy + (1 - k / .2) * 20 + 2, "#FFE14D", .6); continue; }
          const q = (k - .2) / .8; for (const p of f.parts) { const d = E.out(q) * 14 * p.v; dot(cx + Math.cos(p.a) * d, cy + Math.sin(p.a) * d + q * q * 6, NEON[(f.c + (p.v > .8 ? 1 : 0)) % 6], (1 - q) * shadeB(cx, cy, 14)); } }
        for (const c of S.confetti) { const k = seg(F, .25 + c.d, 1, x => x); if (k <= 0 || k >= 1) continue; const x = c.x * bw + Math.sin(k * 12 + c.x * 30) * 2, yy = k * c.v * gy; dot(x, yy, NEON[c.c], (1 - k) * shadeB(x, yy, 3), c.w ? 2 : 1); }
      }
      // the score, on the bricks
      const PTS = [[2.25 + .62 * .12, 10], [2.25 + .62 * .31, 10], [2.25 + .62 * .5, 10], [2.25 + .62 * .69, 10], [2.25 + .62 * .88, 10], [4.4, 100], [ts, 200], [tp, 1000], [11.3, 5000]];
      const score = on ? Math.round(PTS.reduce((s, [t, p]) => s + p * clamp((T - t) / .4), 0) / 10) * 10 * I : 0, sc = String(Math.round(score)).padStart(6, "0");
      txt(pr ? sc : "SCORE " + sc, bw - tw(pr ? sc : "SCORE " + sc) - 4, gy + (pr ? 3 : 5), "#FFE14D", 1);
      // under the words the moving picture is cut back, so the backdrop's dark sky is what's behind them (and the bloom with it)
      b.globalCompositeOperation = "destination-out"; for (const [x0, y0, x1, y1, k] of S.wr || []) { b.globalAlpha = k ? .7 : .4; b.fillRect(Math.floor(x0 / PS), Math.floor(y0 / PS), Math.ceil((x1 - x0) / PS) + 1, Math.ceil((y1 - y0) / PS) + 1); } b.globalCompositeOperation = "source-over"; b.globalAlpha = 1;
      // the frame: crisp, then bloom, then scanlines; a shake when things hit; a glitch at GO!, the burst and the finale
      if (F >= 0 && F < .05) shake = 2;
      const ox = shake ? Math.round((Math.random() - .5) * 2 * shake) * PS : 0, oy = shake ? Math.round((Math.random() - .5) * 2 * shake) * PS : 0;
      g.clearRect(0, 0, W, H); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      g.imageSmoothingEnabled = false; g.drawImage(pb, ox, oy, bw * PS, bh * PS);
      g.imageSmoothingEnabled = true; g.globalCompositeOperation = "lighter";
      for (const [t, a] of [[S.tiny1, .42], [S.tiny2, .5]]) { const x = t.getContext("2d"); x.clearRect(0, 0, t.width, t.height); x.drawImage(pb, 0, 0, t.width, t.height); g.globalAlpha = a; g.drawImage(t, ox, oy, bw * PS, bh * PS); }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      const flash = Math.max(on ? env(T, tp, tp + .03, tp + .05, tp + .18) * .08 * I : 0, on ? env(T, 11.25, 11.27, 11.3, 11.5) * .14 * I : 0, F >= 0 ? env(F, 0, .02, .04, .16) * .12 : 0); // brief, and light: the words stay put
      if (flash > .01) { g.globalCompositeOperation = "lighter"; g.globalAlpha = flash; g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; }
      const glitch = (on && ((T > 1.2 && T < 1.32) || (T > 11.25 && T < 11.4))) || (F >= 0 && F < .05);
      if (glitch) { const r2 = rng(Math.floor(A * 40)); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); for (let k = 0; k < 5; k++) { const h = Math.round((2 + r2() * 6) * PS * px), y2 = Math.round(r2() * (g.canvas.height - h)), d = Math.round((r2() - .5) * 12 * PS * px); g.drawImage(g.canvas, 0, y2, g.canvas.width, h, d, y2, g.canvas.width, h); } g.restore(); }
      if (!S.scanPat) S.scanPat = g.createPattern(S.scan, "repeat"); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = S.scanPat; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
    },
  };
  return S;
}
