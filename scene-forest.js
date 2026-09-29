// scene-forest.js — 1.12 b318: Forest's scene (scenes.js loads it). Night, in pixels: a moon over a misty ridge, three
// depths of pines lit along one side, the clearing, the grass. The idle loop, fifteen seconds: a breeze through the layers
// back to front; the fireflies wake and drift up; fog under moonlight in shafts; a doe walks out of the pines, stops, looks,
// and trots off with her tail up; a shooting star, and the fireflies answer it in one flash; then it all settles to where it
// began. The finale: the fireflies swirl up out of the clearing toward the moon. What does not move is drawn once.
//
// 1.12 b378: the forever cycle. That loop is the first pass; each pass after it deals a night of its own from a pool
// about three times what one pass plays. Who comes into the clearing: the doe, from either side; the doe with her
// spotted fawn at her heels; a fox that trots through, noses the grass, looks straight out with the moon in its eyes
// and pounces; rabbits that hop out from under the pines to sit and nibble, white tails bobbing (the fox, the rabbits
// and the stag come out into the open, so they wear the moonlight, a rim of it along their backs). What the sky does:
// the shooting star, from anywhere, and the fireflies' answer; an owl whose eyes open in the tall pine by the moon
// before it drops out and glides across the moon's face (or that glides in across it and settles there, its eyes
// glinting after); a bat looping round the moon. The air: the fog and the shafts of moonlight, the moon breaking
// through more strongly than on the first pass; a cloud drifting in over the moon and swallowing it, its rim silvering,
// the clearing going dark under it and the shafts coming back after; a bank of fog rolling through the clearing in
// wisps along the ground. The breeze comes from either side, sometimes twice, and the fireflies wake to blink, to wind
// up into a slow spiral, or to pass waves of light down the clearing. The one in the clearing and the one in the sky
// take turns, one opening the pass and the other closing it. The rare ones, each about once in eight passes: a stag who
// steps out, lifts his head and bellows, his breath smoking in the cold; a meteor shower the fireflies answer; the
// northern lights rippling over the ridge (on a phone high in the sky, above the list), dimmed behind the lines by
// `words`. Every pass opens and closes on the same resting picture.
export default function forest(K) {
  const { LOOP, clamp, lerp, E, seg, env, rng, dith, rgb, mixc, css, canvas, paint, noise1, fbm, glowSpr, pine, sprite, layer, deal, bag } = K;
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
    eye: rgb("#EEF4B0"), puff: rgb("#C2D6CA"), cloud: rgb("#1A2C23"), cloudD: rgb("#15251E"), cloudL: rgb("#24392E"), cloudHi: rgb("#B8D6C3"),
    coatD: rgb("#101D17"), coat: rgb("#243A2F"), coatL: rgb("#4D7763"), coatH: rgb("#8FBAA3"), white: rgb("#DDE9D5"), antler: rgb("#B9CDB3"),
  };
  const midsLayer = layer(), nearsLayer = layer(), grassLayer = layer();
  const flip = c => { const [o, x] = canvas(c.width, c.height); x.setTransform(-1, 0, 0, 1, c.width, 0); x.drawImage(c, 0, 0); return o; };
  const mirror = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.map(flip) : flip(v)]));
  const pt = [0, 0];
  /** a point on a smooth path through `pts` (Catmull-Rom), u from 0 to 1 spread evenly over its stretches */
  const along = (pts, u) => { const n = pts.length - 1, f = clamp(u) * n, i = Math.min(n - 1, Math.floor(f)), t = f - i, a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(n, i + 2)];
    for (let k = 0; k < 2; k++) pt[k] = .5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t * t * t); return pt; };
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
      S.cast(W, H, portrait); S.planP = -1;
    },
    /** the forever cycle's cast, drawn once, each from dice of its own (the signature's are left as they were) */
    cast(W, H, pr) {
      const M = S.moon, D = { "#": P.deer, "+": P.deerHi, t: P.tail, e: P.eye }, sp = rows => sprite(rows, D), pair = o => [o, mirror(o)]; // facing right, facing left
      S.doeL = mirror(S.doe);
      // a second wave of fireflies for the nights the clearing fills with them: later to wake, never glowing at rest
      const fr = rng(151), hz = S.hz;
      S.flies2 = Array.from({ length: pr ? 12 : 22 }, () => ({ hx: W * (.04 + fr() * .92), hy: hz + 3 + fr() * (H - hz) * .55, rise: 6 + fr() * (hz * (pr ? .36 : .42)), ax: 3 + fr() * 10, ay: 2 + fr() * 6, kx: 1 + Math.floor(fr() * 2), ky: 1 + Math.floor(fr() * 3), m: 4 + Math.floor(fr() * 6), ph: fr() * 6.283, d: .7 + fr() * 1.8, amb: false }));
      S.fliesAll = S.flies.concat(S.flies2);
      // the fawn: smaller, leggy, spotted along the back
      const fT = [".........+.+", ".........+#.", "........####", "........###.", ".......##...", "..+t++t##...", ".##t###t#...", "#########...", "..#####....."];
      const fL = { tog: ["..#.#..#.#..", "..#.#..#.#..", "..#.#..#.#.."], fs: ["..#.#..#.#..", "..#.#.#...#.", "..#.#.#...#."], bs: ["..#.#..#.#..", ".#...#.#.#..", ".#...#.#.#.."], both: ["..#.#..#.#..", ".#...##...#.", "#.....#....#"] };
      S.fawn = pair({ walk: ["tog", "fs", "tog", "bs"].map(k => sp(fT.concat(fL[k]))), bound: ["both", "tog"].map(k => sp(fT.concat(fL[k]))), stand: sp(fT.concat(fL.tog)) });
      // the fox, the rabbits and the stag come out into the open clearing, so they wear the moonlight: a coat lit along the
      // back, a rim toward the moon, the near legs in the coat and the far ones in shadow, a white tail tip, pale antlers
      const C = { d: P.coatD, m: P.coat, l: P.coatL, h: P.coatH, w: P.white, e: P.eye, a: P.antler, k: P.near }, lit = rows => sprite(rows, C);
      const fxT = ["..............h..h..", "..............lh.lh.", ".............mllllm.", "......hhhhhhhmmmmmww", "..hhhhllllllllmmmk..", ".hllllmmmmmmmmmww...", "wwlmm.dmmmmmmmmm...."];
      const nose = lit(["....................", "....................", "....................", "......hhhhhhhhh..h.h", "..hhhhllllllllllhlhl", ".hllllmmmmmmmmmmmlll", "wwlmm.dmmmmmmmmmmmmm", "ww...mm.d....mm.dmww", "......m..d.....m..d."]);
      S.fox = pair({
        trot: [lit(fxT.concat(["ww...mm.d....mm.d...", "......m..d.....m..d."])), lit(fxT.concat(["ww.....dmm....dmm...", ".....mm..d...m...d.."]))],
        sniff: [lit(["....................", "....................", "................h..h", "......hhhhhhhhh.lhlh", "..hhhhllllllllllmlll", ".hllllmmmmmmmmmmmmmm", "wwlmm.dmmmmmmmmm.mww", "ww...mm.d....mm.d...", "......m..d.....m..d."]), nose],
        look: lit([".............h....h.", ".............lh..hl.", ".............mllllm.", "......hhhhhhhmemmem.", "..hhhhllllllllmwwm..", ".hllllmmmmmmmmmww...", "wwlmm.dmmmmmmmmm....", "ww...mm.d....mm.d...", "......m..d.....m..d."]),
        pounce: lit(["...............h..h.", "...............lh.lh", "..............mllllm", "....hhhhhhhhhhmmmmww", ".whhlllllllllllmm...", "wwlllmmmmmmmmm.mm...", "w..mm.dm......m.....", "......d............."]),
        dive: nose,
      });
      S.rab = pair({ sit: lit(["....h.h", "....l.l", "...hllm", "..hlmmk", ".hlmmm.", "wlmmmm.", ".mmdd.."]), ear: lit([".....h.", "....lh.", "...hllm", "..hlmmk", ".hlmmm.", "wlmmmm.", ".mmdd.."]), hop: lit(["......h.h", "......lhl", "...hhhlmm", ".hhllmmmk", "wlmmmmm..", ".dd...m.."]), nib: lit([".......", "....h.h", "..hhl.l", ".hllllm", "hlmmmmk", "wlmmmmm", ".mmdd.m"]) });
      const sgH = ["..........a...a.......", "...........a.a.a......", "............aaa.a.....", ".............aaa......", "..............lh.h....", "..............llll....", "..............lmmmk...", "..............mmmmmm..", ".............lmmm.....", "............lmmm......"];
      const sgHb = ["......a...a...........", ".......a.a.a..........", "........aaa.a.........", ".........aaa..........", "..........lh.h........", "...........llll.......", "............lmmmk.....", "............mmmmmm....", "............lmmm.m....", "............lmmm......"];
      const sgB = ["...hhhhhhhhhlmmm......", "..hllllllllllmm.......", ".hlmmmmmmmmmmmm.......", "wlmmmmmmmmmmmmd.......", "...dmmmmmmmmmd........", "...mm......mm........."];
      const sgL = { tog: ["...m.d.....m.d........", "...m.d.....m.d........", "...m.d.....m.d........"], fs: ["..m...d...m...d.......", ".m....d..m.....d......", "m.....d.m.......d....."], bs: ["...m.d...m...d........", "..m...d.m.....d.......", ".m....dm.......d......"] };
      S.stag = pair({ walk: ["tog", "fs", "tog", "bs"].map(k => lit(sgH.concat(sgB, sgL[k]))), stand: lit(sgH.concat(sgB, sgL.tog)), bellow: lit(sgHb.concat(sgB, sgL.tog)) });
      S.puff = glowSpr(3, P.puff, .8);
      // the owl, seen from below: tufts, a round head, broad wings; smaller on a phone, where the moon is too
      S.owl = pr ? { glide: sp(["...#.#...", "...###...", "#########", ".###.###.", "....#...."]), up: sp(["#.......#", ".##.#.##.", "..#####..", "...###...", "....#...."]), down: sp(["...#.#...", "...###...", "..#####..", ".###.###.", "#.......#"]) }
        : { glide: sp([".....#.#.....", ".....###.....", "..##.###.##..", "#############", ".####.#.####.", "..##..#..##.."]), up: sp(["##.........##", ".##..#.#..##.", "..##.###.##..", "...#######...", ".....###.....", "......#......"]), down: sp([".....#.#.....", ".....###.....", "....#####....", "..#########..", ".###..#..###.", "##....#....##"]) };
      S.eyeGlow = glowSpr(3, P.eye, .45);
      S.bat = pr ? [sp(["#.....#", "##.#.##", ".#####.", "...#..."]), sp(["..#.#..", "#######", ".#...#."]), sp(["...#...", ".#####.", "##...##", "#.....#"])]
        : [sp(["#.......#", "##.#.#.##", ".#######.", "..#####..", "....#...."]), sp(["...#.#...", "#########", "##.###.##", "#...#...#"]), sp(["....#....", "..#####..", ".###.###.", "##.....##", "#.......#"])];
      // a long cloud for the moon: heaped on top, ragged beneath, lit a little along its top; its upper rim silvers as the moon
      // comes behind it (the rim is lit through a mask centred on the moon, in a small buffer of its own)
      const cl = pr ? 50 : 84, ch = pr ? 15 : 24, cn1 = noise1(101, 64), cn2 = noise1(103, 64), cn3 = noise1(105, 64);
      const dens = (x, y) => { const body = Math.pow(Math.sin(Math.PI * clamp(x / (cl - 1))), .55), heaps = .55 + .45 * Math.abs(Math.sin(x * (pr ? .26 : .19) + fbm(cn1, x * .08, 2) * 3));
        const top = ch * (.62 - .52 * body * heaps), bot = ch * (.68 + .3 * body * (.55 + .45 * fbm(cn2, x * .23 + 5, 2))); if (y < top || y > bot) return 0;
        return clamp(Math.min(y - top + .6, (bot - y) * .8 + .4) * (.8 + .4 * fbm(cn3, x * .3 + y * .5, 2))); };
      const edge = (x, y) => dens(x, y) > 0 && dens(x, y - 1) <= 0;
      S.cloudSpr = paint(cl, ch, (x, y) => { const v = dens(x, y); if (v <= 0 || (v < .35 && dith(x, y) > v * 1.6)) return null; return edge(x, y) || dens(x, y - 2) <= 0 ? P.cloudL : v > .7 ? P.cloud : P.cloudD; });
      S.cloudRim = paint(cl, ch, (x, y) => edge(x, y) ? P.cloudHi : null);
      [S.rimC, S.rimX] = canvas(cl, ch); S.rimMask = glowSpr(Math.round(M.r * 3.6), [255, 255, 255], 1); S.rimGlow = glowSpr(Math.round(M.r * 1.9), P.cloudHi, .7);
      Object.assign(S, { cl, ch });
      S.dark = glowSpr(Math.round(M.r * 5.5), P.skyTop, .95); S.moonGlow = glowSpr(Math.round(M.r * 2.4), P.moon, .5);
      { const sh = S.shaft.height, sw = S.shaft.width - sh; S.shaftSoft = paint(sw + sh, sh, (x, y) => { const u = x - (sh - y) * .85; if (u < 0 || u > sw) return null; return [P.shaft[0], P.shaft[1], P.shaft[2], Math.round(255 * .16 * Math.sin(Math.PI * u / sw) * Math.pow(1 - y / sh, .8) * Math.min(1, y / (sh * .16)))]; }); } // the shafts again, fading in below the moon rather than starting at its height
      // the bank of fog: deeper bands than the evening's, rolling through the clearing in front of the pines
      const bn = noise1(111, 40), bn2 = noise1(113, 40);
      S.bankBands = [[bn, pr ? 20 : 26, .58], [bn2, pr ? 16 : 20, .46]].map(([n, h, k]) => { const w = W * 2; return paint(w, h, (x, y) => { const b = y / 4, i = Math.floor(b), f = b - i, u = (x / w) * 30, v = Math.min(1, Math.max(0, lerp(fbm(n, u + i * 5.3, 3), fbm(n, u + (i + 1) * 5.3, 3), f * f * (3 - 2 * f)) - .3) / .45); return [P.fog[0], P.fog[1], P.fog[2], Math.round(255 * k * v * Math.pow(Math.sin(Math.PI * y / h), .8))]; }); }); // the bank's wisps lie along the ground, four rows each, blended into the next
      // the northern lights: a buffer the curtain is written into each frame it shows (over the ridge beside the moon; on a
      // phone high in the sky, above the list), and its colours from the hem up: pale at the hem, green, a violet fringe
      const base = pr ? Math.round(H * .23) : S.hz - 44, len = pr ? 34 : 46, amp = pr ? 4.5 : 5, top = Math.max(0, base - len - Math.ceil(amp) - 6), aw = pr ? W : Math.round(W * .58);
      S.aur = { x: W - aw, y: top, w: aw, h: base + Math.ceil(amp) + (pr ? 20 : 8) - top, base: base - top, amp, len, fadeL: pr ? .12 : .3, freq: pr ? 8 : 5.3, spill: pr ? 7 : 3 };
      [S.aurC, S.aurX] = canvas(aw, S.aur.h); S.aurImg = S.aurX.createImageData(aw, S.aur.h); S.aurD = new Uint32Array(S.aurImg.data.buffer);
      S.aurN = noise1(71, 64); S.aurN2 = noise1(79, 64);
      const ac = [[0, "#E4FFEC", 1], [.05, "#9CFFC4", .95], [.18, "#4EEA96", .75], [.45, "#2FC28E", .45], [.75, "#4E78C8", .2], [1, "#8A5AC8", 0]].map(([t, c, a]) => [t, rgb(c), a]);
      S.aurPal = Array.from({ length: len + 1 }, (_, d) => { const t = d / len; let k = 0; while (k < ac.length - 2 && t > ac[k + 1][0]) k++; const f = (t - ac[k][0]) / (ac[k + 1][0] - ac[k][0]), c = mixc(ac[k][1], ac[k + 1][1], f); return [c[0], c[1], c[2], lerp(ac[k][2], ac[k + 1][2], f)]; });
      S.maskWords();
    },
    /** where the words are (CSS px). In the passes after the first, whatever is new or brighter than the first pass keeps
     *  back from them: a mask at the picture's own pixels, down to a trace behind a word and whole a few pixels clear of it */
    words(rects) { S.raw = rects; S.maskWords(); },
    maskWords() {
      const { W, H } = S; if (!W) return;
      const rs = S.raw || [], px = Math.round(innerWidth / W) || 1, R = 2, F = 4, LO = .08;
      if (S.wmW !== W || S.wmH !== H) { S.wm = new Float32Array(W * H); [S.wmC, S.wmX] = canvas(W, H); S.wmImg = S.wmX.createImageData(W, H); [S.ml, S.mlx] = canvas(W, H); S.wmW = W; S.wmH = H; }
      const m = S.wm; m.fill(1);
      for (const [x0, y0, x1, y1] of rs) { const a0 = x0 / px, b0 = y0 / px, a1 = x1 / px, b1 = y1 / px;
        for (let y = Math.max(0, Math.floor(b0 - R - F)); y <= Math.min(H - 1, Math.ceil(b1 + R + F)); y++) for (let x = Math.max(0, Math.floor(a0 - R - F)); x <= Math.min(W - 1, Math.ceil(a1 + R + F)); x++) {
          const d = Math.hypot(Math.max(a0 - x - .5, 0, x + .5 - a1), Math.max(b0 - y - .5, 0, y + .5 - b1)), v = LO + (1 - LO) * clamp((d - R) / F), i = y * W + x; if (v < m[i]) m[i] = v; } }
      const d = S.wmImg.data; for (let i = 0; i < m.length; i++) { const k = i * 4; d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = Math.round(255 * m[i]); }
      S.wmX.putImageData(S.wmImg, 0, 0); S.wmOn = rs.length > 0;
    },
    /** the mask at a point (1 clear of the words), and the least of it over a box */
    m(x, y) { if (!S.wmOn) return 1; x = Math.round(x); y = Math.round(y); return x < 0 || y < 0 || x >= S.W || y >= S.H ? 1 : S.wm[y * S.W + x]; },
    mb(x, y, w, h) { return S.wmOn ? Math.min(S.m(x, y), S.m(x + w - 1, y), S.m(x, y + h - 1), S.m(x + w - 1, y + h - 1), S.m(x + w / 2, y + h / 2)) : 1; },
    /** drawn through the mask: `draw` paints a layer, the layer is cut back where the words are and laid on the picture */
    masked(draw) { if (!S.wmOn) { draw(g); return; } const x = S.mlx, keep = g; x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.clearRect(0, 0, S.W, S.H); g = x; try { draw(x); } finally { g = keep; } x.globalAlpha = 1; x.globalCompositeOperation = "destination-in"; x.drawImage(S.wmC, 0, 0); x.globalCompositeOperation = "source-over"; g.drawImage(S.ml, 0, 0); }, // (while it paints, the layer is the picture: a beat's own drawing goes there)
    /** the first pass, number for number the loop this scene has always played */
    sig() {
      const pr = S.portrait;
      return { gust: { t: [.4, 1.2, 1.7, 3.0], dir: 1, amp: 1 }, wake: [2.4, 4.9], settle: [12.2, 14.6], fph: 0, sync: [11.05, 11.17, 11.32, 11.8], fog: [4.6, 6.6, 8.6, 11.4], shaft: [5.0, 6.4, 7.8, 9.8],
        doe: { t: [7.0, 9.0, 10.4, 11.8], look: [9.3, 10.1], fade: [7.0, 7.5, 11.3, 11.8], fx: pr ? [.02, .4, 1.04] : [.24, .46, .7], m: 0 }, star: { t: [10.4, 11.15], spark: [11.1, 11.18, 11.3, 11.9], path: S.starPath() } };
    },
    /** pass n's night, from its own dice: who comes into the clearing, what the sky does, the air, the fireflies, and when */
    dealPass(n) {
      const r = deal(n, 3), { W, H, hz, portrait: pr, moon: M } = S, pick = (a, b) => a + r() * (b - a), side = () => r() < .5 ? 1 : -1;
      const rare = bag(n, 8, 7), subj = rare === 1 ? 4 : bag(n, 4, 1), sky = rare === 2 ? 3 : bag(n, 3, 2), air = rare === 3 ? 3 : bag(n, 3, 4), fl = bag(n, 3, 13);
      const g0 = pick(.2, 1.1), pl = { dealt: true, gust: { t: [g0, g0 + .8, g0 + 1.3, g0 + 2.6], dir: side(), amp: pick(.8, 1.3) }, fph: pick(0, 6.283) };
      if (r() < .45) { const g1 = pick(6.2, 9); pl.gust2 = { t: [g1, g1 + .9, g1 + 1.4, g1 + 2.9], dir: side(), amp: pick(.45, .8) }; }
      // the one in the clearing and the one in the sky take turns: one opens the pass, the other closes it
      const Dg = [4.8, pr ? 6.0 : 8.1, 7.8, 5.4, 8.4][subj], Ds = [1.7, 5.9, 4.2, 5.0][sky], skyFirst = sky !== 3 && r() < .5;
      let tg, ts;
      if (skyFirst) { ts = sky === 0 ? pick(3.1, 3.9) : pick(1.3, 2.2); tg = Math.min(ts + Ds + pick(-.6, .3), 14.3 - Dg); }
      else { tg = pick(1.8, 3.0); ts = Math.min(tg + Dg + pick(-.5, .4), 14.2 - Ds); }
      const dir = side();
      if (subj === 0 || subj === 3) { // the doe, and some nights her fawn at her heels
        const fawn = subj === 3, d = fawn ? [2.3, 1.7, 1.4] : [2.0, 1.4, 1.4], a = tg, b = a + d[0], c = b + d[1], e = c + d[2];
        const fx = pr ? (dir > 0 ? [.02, pick(.34, .46), 1.04] : [.8, pick(.3, .42), -.2]) : (dir > 0 ? [pick(.2, .28), pick(.44, .54), .7] : [.72, pick(.5, .58), .26]);
        pl.doe = { t: [a, b, c, e], look: [b + .3, c - .3], fade: [a, a + .5, e - .5, e], fx, m: dir < 0 ? 1 : 0, fawn };
      } else if (subj === 1) { // the fox trots through, from under the pines on one side to under them on the other
        const xa = dir > 0 ? (pr ? -20 : 12) : (pr ? 84 : 262), xb = dir > 0 ? (pr ? 84 : 262) : (pr ? -20 : 12);
        const xs = W * (pr ? (dir > 0 ? pick(.2, .3) : pick(.46, .56)) : (dir > 0 ? pick(.4, .5) : pick(.5, .6)));
        pl.fox = { t0: tg, dir, xa: pr ? xa : xa * W / 288, xb: pr ? xb : xb * W / 288, xs, y: hz + (pr ? 20 : 17), d: pr ? [1.6, 1.1, .8, .5, .45, 1.55] : [2.6, 1.1, .8, .55, .45, 2.6] };
      } else if (subj === 2) { // rabbits come out from under the pines (on a desktop the right-hand ones, clear of the list), sit, nibble, and go back
        const nR = pr ? 2 : 2 + (r() < .5 ? 1 : 0), hl = pr ? 5 : 8, hd = .3, hp = .12, list = [], from = pr ? dir : -1;
        for (let j = 0; j < nR; j++) {
          const y = hz + (pr ? 24 : 27) + j * (pr ? 5 : 4) + (r() < .5 ? 1 : 0), xe = from > 0 ? -6 : (pr ? 82 : W * .89), xs = xe + from * ((pr ? pick(10, 16) : pick(16, 28)) + j * (pr ? 9 : 12));
          const steps = []; let t = tg + j * pick(.4, .8), x = xe;
          const n1 = Math.max(2, Math.ceil(Math.abs(xs - xe) / hl)), dx = (xs - xe) / n1;
          for (let k = 0; k < n1; k++) { steps.push([t, t + hd + hp, x, x + dx, 1, from, hd]); x += dx; t += hd + hp; }
          const tl = tg + 4.3 + j * pick(.2, .35);
          while (t < tl - .2) { const kind = r() < .5 ? 0 : r() < .5 ? 2 : 3, dd = Math.min(tl - t, kind === 2 ? .25 : pick(.45, .9)); steps.push([t, t + dd, x, x, kind, from]); t += dd; }
          if (t < tl) steps.push([t, tl, x, x, 0, from]); t = Math.max(t, tl);
          for (let k = 0; k < n1; k++) { steps.push([t, t + hd + hp, x, x - dx, 1, -from, hd]); x -= dx; t += hd + hp; }
          list.push({ y, steps });
        }
        pl.rabbits = list;
      } else { // the stag steps out, lifts his head and bellows, his breath smoking, and goes back the way he came
        const d = pr ? side() : -1, xa = d > 0 ? -22 : W + 2, xs = W * (pr ? (d > 0 ? pick(.18, .28) : pick(.42, .52)) : pick(.6, .68));
        pl.stag = { t0: tg, dir: d, xa, xs, y: hz + (pr ? 18 : 15), d: [3.0, .7, 2.0, .7, 2.0] };
      }
      if (air === 3) { /* the northern lights are the sky this pass */ } else if (sky === 0) { // a shooting star, from anywhere, and the fireflies answer it
        const t0 = ts + .2, t1 = t0 + pick(.62, .85), d = side();
        let x0 = W * (pr ? pick(.15, .85) : pick(.28, .7)), y0 = H * (pr ? pick(.04, .1) : pick(.015, .06)), x1 = clamp(x0 + d * W * (pr ? pick(.28, .42) : pick(.22, .34)), W * .05, W * .95), y1 = y0 + H * (pr ? pick(.05, .09) : pick(.05, .1));
        if (Math.hypot(x1 - M.x, y1 - M.y) < M.r * 3.5) { x1 = lerp(x0, x1, .6); y1 = lerp(y0, y1, .6); }
        pl.star = { t: [t0, t1], spark: [t1 - .05, t1 + .03, t1 + .15, t1 + .75], path: [x0, y0, x1, y1] }; pl.sync = [t1 - .1, t1 + .02, t1 + .17, t1 + .65];
      } else if (sky === 1) { // the owl: eyes open in the tall pine by the moon, and it drops out across the moon (or comes in across it to settle there)
        const tr = S.nears.reduce((a, t) => Math.abs(t.x - M.x - W * .08) < Math.abs(a.x - M.x - W * .08) ? t : a), tp = tr.base - tr.h, px = tr.x - 1, py = tp + (pr ? 14 : 21);
        const pts = pr ? [[px, py], [px + 1, py - 26], [M.x + M.r + 5, M.y + 3], [M.x, M.y + 1], [M.x - M.r - 7, M.y - 1], [M.x - 34, M.y - 12], [M.x - 70, -12]]
          : [[px, py], [px + 6, py - 26], [M.x + M.r + 8, M.y + 3], [M.x, M.y + 1], [M.x - M.r - 12, M.y - 2], [M.x - 50, M.y - 14], [M.x - 100, -14]];
        const rev = r() < .4, o = { tree: S.nears.indexOf(tr), perch: [px, py], pts, rev, lookDir: -1 };
        if (!rev) Object.assign(o, { eyes: [ts, ts + 1.9], blink: ts + .8, look: ts + 1.25, fly: [ts + 1.75, ts + 5.9] });
        else Object.assign(o, { fly: [ts, ts + 4.1], eyes: [ts + 3.95, ts + 5.9], blink: ts + 4.8, look: ts + 5.1 });
        pl.owl = o;
      } else if (sky === 2) { // a bat, or two, loops round the moon
        const s = side(), R0 = M.r + (pr ? 5 : 7) + r() * 4, ring = [0, 1, 2, 3, 4, 5].map(k => { const a = -.4 * Math.PI + s * k * Math.PI * .42; return [M.x + Math.cos(a) * R0 * 1.15, M.y + Math.sin(a) * R0]; });
        pl.bat = { t0: ts, dur: pick(3.2, 3.7), n: r() < .4 ? 2 : 1, pts: [[W + 8, M.y + (pr ? 18 : 26)], ...ring, [M.x - (pr ? 30 : 56), M.y + pick(-6, 10)], [M.x - (pr ? 64 : 120), -10]] };
      } else { // a meteor shower: streaks one after another out of one point in the sky (the radiant), the fireflies answering the last
        const k = pr ? 7 : 10, rx = W * (pr ? pick(.35, .65) : pick(.6, .72)), ry = H * (pr ? pick(.04, .08) : pick(.05, .1)), list = [];
        for (let j = 0; j < k; j++) { const t0 = ts + j * (4.4 / k) + pick(0, .25), th = pick(-.15, 1.15) * Math.PI, s0 = pick(pr ? 5 : 8, pr ? 16 : 34), L = pick(pr ? 10 : 18, pr ? 22 : 42), c = Math.cos(th), sn = Math.sin(th);
          list.push({ t: [t0, t0 + pick(.35, .6)], path: [rx + c * s0, ry + sn * s0, rx + c * (s0 + L), ry + sn * (s0 + L)], n: 22, dk: .026 }); }
        const last = list.reduce((a, m) => m.t[1] > a.t[1] ? m : a), t1 = last.t[1]; last.spark = [t1 - .05, t1 + .03, t1 + .15, t1 + .7]; pl.meteors = list; pl.sync = [t1 - .1, t1 + .02, t1 + .17, t1 + .65];
      }
      if (air === 0) { const a = pick(3.2, 5.8); pl.fog = [a, a + 2, a + 4, a + 6.8]; pl.shaft = [a + .4, a + 1.8, a + 3.2, a + 5.2]; pl.shaftK = pick(1.3, 1.6); } // the moon breaks through, the shafts stronger than the evening's
      else if (air === 1) { const c0 = pick(1.2, 2.8); pl.cloud = { t: [c0, c0 + (pr ? 9.6 : 10.6)], x0: W + 2, x1: M.x - S.cl - (pr ? 16 : 28), y: M.y - Math.round(S.ch * (pr ? .5 : .52)) + (r() * 3 | 0) - 1 }; pl.shaft = [.8, 2.4, c0 + 8.4, c0 + 10.6]; pl.shaftK = pick(1.2, 1.45); pl.fog = [3.4, 5.4, 8.2, 11]; }
      else if (air === 2) { const a = pick(1.6, 3); pl.bank = [a, a + 2.6, a + 6.6, a + 9.6]; pl.fog = [a, a + 2, a + 6, a + 9]; }
      else { const a = pick(1.4, 2.4); pl.aurora = { t: [a, a + 2.8, a + 7.8, a + 10.8], ph: pick(0, 6.283), k: pick(.85, 1), tilt: (r() < .5 ? -1 : 1) * pick(pr ? 10 : 2, pr ? 16 : 8) }; pl.fog = [4, 6, 8, 11]; }
      const w0 = skyFirst && sky === 0 ? pick(.7, 1.1) : pick(1.8, 3); pl.wake = [w0, w0 + 2.5]; pl.settle = [pick(11.9, 12.5), 14.6];
      if (fl === 1) { const s0 = pick(3.8, 4.8); pl.spiral = { t: [s0, s0 + 2.2, s0 + 5.0, s0 + 7.0], cx: W * (pr ? pick(.35, .65) : pick(.7, .8)), y0: hz + (pr ? 36 : 16), h: pr ? 40 : 60, R: pr ? 9 : 14, spin: side(), w: pick(.7, 1.1), rise: pick(.01, .025), turns: pick(1.6, 2.3) }; }
      else if (fl === 2) { const d0 = side(); pl.waves = [[pick(5.4, 7), d0], [pick(8.8, 10.2), -d0]]; }
      // where they gather as they rise: spread through the clearing as on the first pass, or drawn together over one part of it
      // (on a desktop the right, clear of the list); and some nights a second wave of them comes out and fills the clearing
      const gz = bag(n, 3, 19); if (gz) pl.gather = { gx: W * (pr ? (gz === 1 ? pick(.2, .34) : pick(.64, .8)) : (gz === 1 ? pick(.7, .76) : pick(.82, .88))), k: pick(.38, .52) };
      pl.more = r() < .4;
      return pl;
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; N: the pass (0, the signature) */
    draw(T, I, A, F, N = 0) {
      const { W, H, hz, moon: M } = S;
      if (N !== S.planP) { S.pl = N > 0 ? S.dealPass(N) : S.sig(); S.planP = N; }
      const pl = S.pl;
      g.drawImage(S.bg, 0, 0);
      // a colour string is parsed each time it is set, so two fixed ones and the twinkle in globalAlpha
      const cS = css(P.star), cH = css(P.starHi);
      for (const s of S.stars) { const tw = .55 + .45 * Math.sin(A * s.f + s.ph), a = s.b * tw; g.fillStyle = a > .78 ? cH : cS; g.globalAlpha = clamp(a); g.fillRect(s.x, s.y, 1, 1); if (s.big && tw > .9) { g.fillStyle = cS; g.globalAlpha = .3; g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); } }
      g.globalAlpha = 1;
      if (pl.aurora && I > .01) S.aurora(T, I, pl.aurora);
      if (pl.star) S.shoot(T, I, pl.star);
      if (pl.meteors) for (const m of pl.meteors) S.shoot(T, I, m);
      let shaftE = pl.shaft ? env(T, ...pl.shaft, E.sine) * I : 0;
      const cover = pl.cloud ? S.cover(T, pl.cloud) * I : 0;
      if (cover > 0) shaftE *= 1 - cover;
      if (shaftE > 0) { g.globalAlpha = shaftE * .25; g.drawImage(S.halo, M.x - (S.halo.width >> 1), M.y - (S.halo.height >> 1)); g.globalAlpha = 1; }
      if (pl.cloud && I > .01) S.cloudAt(T, I, pl.cloud, cover);
      if (pl.bat && I > .01) S.batAt(T, I, pl.bat);
      const fogE = env(T, ...pl.fog, E.sine) * I;
      const o0 = A * 1.4 + T * 2.5 * I, o1 = -A * 1.0 - T * 3.5 * I, dm = pl.dealt && S.wmOn; // a dealt pass lays its fog's extra through the mask
      if (dm) { S.fog(S.fogBands[0], hz - 13, o0, .4); if (fogE > 0) S.masked(x => S.fog(S.fogBands[0], hz - 13, o0, fogE * .6, x)); } else S.fog(S.fogBands[0], hz - 13, o0, .4 + fogE * .6);
      if (I > 0 && pl.doe) { if (pl.dealt) S.masked(() => S.deer(T, I, pl.doe)); else S.deer(T, I, pl.doe); }
      const G1 = pl.gust, G2 = pl.gust2, gt = G1.t;
      const gust = x => env(T - (G1.dir > 0 ? x / W : 1 - x / W) * .9, gt[0], gt[1], gt[2], gt[3], E.sine) * I * G1.amp + (G2 ? env(T - (G2.dir > 0 ? x / W : 1 - x / W) * .9, G2.t[0], G2.t[1], G2.t[2], G2.t[3], E.sine) * I * G2.amp : 0) + (Math.sin(A * .7 + x * .05) * .5 + .5) * .15;
      const q = v => Math.round(v * 4);
      const mSway = S.mids.map(t => gust(t.x) * 1.5);
      g.drawImage(midsLayer(W, H, mSway.map(q).join(), x => S.mids.forEach((t, i) => S.tree(x, t, mSway[i]))), 0, 0);
      if (dm) { S.fog(S.fogBands[1], hz - 1, o1, .25); if (fogE > 0) S.masked(x => S.fog(S.fogBands[1], hz - 1, o1, fogE * .5, x)); } else S.fog(S.fogBands[1], hz - 1, o1, .25 + fogE * .5);
      const bank = pl.bank ? env(T, ...pl.bank, E.sine) * I : 0;
      if (bank > 0) S.masked(x => S.fog(S.bankBands[0], hz - 4, A * 2.2 + T * 5 * I, bank, x));
      if (I > .01 && (pl.fox || pl.rabbits || pl.stag)) S.masked(() => { if (pl.fox) S.foxAt(T, I, pl.fox); if (pl.rabbits) S.rabbitsAt(T, I, pl.rabbits); if (pl.stag) S.stagAt(T, I, pl.stag); }); // the clearing's new animals keep back from the words
      if (bank > 0) S.masked(x => { S.fog(S.bankBands[1], hz + 9, -A * 1.7 - T * 4 * I, bank * .9, x); S.fog(S.fogBands[1], hz + 24, A * 1.2 + T * 3 * I, bank * .5, x); });
      if (shaftE > 0) { const sw = S.shaft.width, lay = x => { for (let k = 0; k < 3; k++) { x.globalAlpha = pl.shaftK ? clamp(shaftE * [1, .7, .5][k] * pl.shaftK) : shaftE * [1, .7, .5][k]; x.drawImage(N > 0 ? S.shaftSoft : S.shaft, Math.round(M.x - sw * .62 - k * W * (S.portrait ? .17 : .1) + Math.sin(T * .7 + k) * 1.5), Math.round(M.y)); } x.globalAlpha = 1; }; if (N > 0) S.masked(lay); else lay(g); }
      const nSway = S.nears.map(t => gust(t.x) * 2.2);
      if (pl.owl && I > .01) S.owlAt(T, I, pl.owl, 0, nSway);
      g.drawImage(nearsLayer(W, H, nSway.map(q).join(), x => S.nears.forEach((t, i) => S.tree(x, t, nSway[i]))), 0, 0);
      if (pl.owl && I > .01) S.owlAt(T, I, pl.owl, 1, nSway);
      const leans = []; for (let x = 0; x < W + 8; x += 6) leans.push(Math.round(clamp(gust(x) * 1.7 - .35, -1, 1)));
      g.drawImage(grassLayer(W, 11, leans.join(), x => leans.forEach((l, i) => x.drawImage(S.grass[l + 1], i * 6, 0, 6, 11, i * 6, 0, 6, 11))), 0, H - 11);
      if (cover > 0) { g.globalAlpha = cover * .3; g.fillStyle = css(P.near); g.fillRect(0, 0, W, H); g.globalAlpha = 1; } // the clearing goes dark under the cloud
      S.fireflies(T, I, A, F, pl);
    },
    starPath() { const { W, H } = S; return S.portrait ? [W * .99, H * .24, W * .8, H * .35] : [W * .3, H * .025, W * .63, H * .105]; },
    /** a shooting star: a long trail, and a spark where it ends (a meteor: a short one, and a spark only for the last) */
    shoot(T, I, st) {
      const ss = seg(T, st.t[0], st.t[1], E.in) * (I > .02 ? 1 : 0), [x0, y0, x1, y1] = st.path, n = st.n || 34, dk = st.dk || .012, dm = S.pl.dealt && S.wmOn;
      if (ss > 0 && ss < 1) { for (let k = n - 1; k >= 0; k--) { const t2 = clamp(ss - k * dk); if (t2 <= 0) continue; const px = Math.round(lerp(x0, x1, t2)), py = Math.round(lerp(y0, y1, t2)), a = dm ? Math.pow(1 - k / n, 1.8) * I * S.m(px, py) : Math.pow(1 - k / n, 1.8) * I; g.fillStyle = css(k < 4 ? P.starHi : P.star, a); g.fillRect(px, py, 1, 1); if (k < 3) { g.fillStyle = css(P.star, a * .5); g.fillRect(px, py - 1, 1, 1); } } g.globalAlpha = dm ? .8 * I * S.m(lerp(x0, x1, ss), lerp(y0, y1, ss)) : .8 * I; g.drawImage(S.starGlow, Math.round(lerp(x0, x1, ss)) - 4, Math.round(lerp(y0, y1, ss)) - 4); g.globalAlpha = 1; }
      if (!st.spark) return;
      const spark = env(T, ...st.spark) * I * (dm ? S.m(x1, y1) : 1);
      if (spark > 0) { const X = Math.round(x1), Y = Math.round(y1), k = Math.round(1 + spark * 1.4); g.fillStyle = css(P.starHi, spark); g.fillRect(X - k, Y, k * 2 + 1, 1); g.fillRect(X, Y - k, 1, k * 2 + 1); g.globalAlpha = spark * .5; g.drawImage(S.starGlow, X - 4, Y - 4); g.globalAlpha = 1; }
    },
    fog(band, y, off, a, x = g) { if (a <= 0) return; const w = band.width, o = ((Math.round(off) % w) + w) % w; x.globalAlpha = clamp(a); x.drawImage(band, -o, y); x.drawImage(band, w - o, y); x.globalAlpha = 1; },
    /** a pine in slices of three rows, each leaning a little more toward the top */
    tree(x2, t, sway) { const s = t.spr, h = s.height, w = s.width, x0 = t.x - (w >> 1), y0 = t.base - h; for (let y = 0; y < h; y += 3) { const dx = Math.round(sway * Math.pow(1 - y / h, 1.6)), hh = Math.min(3, h - y); x2.drawImage(s, 0, y, w, hh, x0 + dx, y0 + y, w, hh); } },
    /** the doe walks out of the pines, stops, looks, and trots off with her tail up; some nights her fawn is at her heels */
    deer(T, I, d) {
      const { W, pathY: y } = S, x0 = W * d.fx[0], xs = W * d.fx[1], x1 = W * d.fx[2], D = d.m ? S.doeL : S.doe, [a, b, c, e] = d.t;
      let spr = null, x = 0;
      if (T >= a && T < b) { x = lerp(x0, xs, seg(T, a, b, E.sine)); spr = D.walk[Math.floor(T * 6.5) % 4]; }
      else if (T >= b && T < c) { x = xs; spr = T < d.look[0] || T > d.look[1] ? D.stand : D.look; }
      else if (T >= c && T < e) { x = lerp(xs, x1, seg(T, c, e, E.in)); spr = D.trot[Math.floor(T * 10) % 2]; }
      if (d.fawn) S.fawnAt(T, I, d, x0, xs, x1);
      if (!spr) return;
      g.globalAlpha = env(T, ...d.fade) * I; g.drawImage(spr, Math.round(x), y - spr.height + 1); g.globalAlpha = 1;
    },
    fawnAt(T, I, d, x0, xs, x1) {
      const Fw = S.fawn[d.m], dw = S.doe.stand.width, fw = Fw.stand.width, far = d.m ? dw + 2 : -(fw + 2), close = d.m ? dw - 3 : -(fw - 3), [a, b, c, e] = d.t, lag = .35, y = S.pathY;
      let x = 0, spr = null;
      if (T >= a + lag && T < b + lag) { x = lerp(x0, xs, seg(T - lag, a, b, E.sine)) + far; spr = Fw.walk[Math.floor(T * 7.5) % 4]; }
      else if (T >= b + lag && T < c + .15) { x = xs + lerp(far, close, seg(T, b + lag, b + lag + .7, E.sine)); spr = Fw.stand; }
      else if (T >= c + .15 && T < e + .3) { x = lerp(xs + close, x1 + close, seg(T, c + .15, e + .3, E.in)); spr = Fw.bound[Math.floor(T * 9) % 2]; }
      if (!spr) return;
      g.globalAlpha = env(T, a + lag, a + lag + .5, e - .2, e + .3) * I; g.drawImage(spr, Math.round(x), y - spr.height + 1); g.globalAlpha = 1;
    },
    /** the fox: trots in, noses the grass, looks straight out, pounces, and trots on */
    foxAt(T, I, f) {
      const k = T - f.t0, [d1, d2, d3, d4, d5, d6] = f.d, e1 = d1, e2 = e1 + d2, e3 = e2 + d3, e4 = e3 + d4, e5 = e4 + d5, e6 = e5 + d6; if (k <= 0 || k >= e6) return;
      const Fx = S.fox[f.dir > 0 ? 0 : 1], xp = f.xs + f.dir * 9; let x, y = f.y, spr;
      if (k < e1) { x = lerp(f.xa, f.xs, seg(k, 0, e1, E.sine)); spr = Fx.trot[Math.floor(T * 9) % 2]; }
      else if (k < e2) { x = f.xs; spr = Fx.sniff[Math.floor(T * 3.5) % 2]; }
      else if (k < e3) { x = f.xs; spr = Fx.look; }
      else if (k < e4) { const u = (k - e3) / d4; x = lerp(f.xs, xp, u); y -= Math.round(Math.sin(u * Math.PI) * 6); spr = u < .55 ? Fx.pounce : Fx.dive; }
      else if (k < e5) { x = xp; spr = Fx.sniff[1]; }
      else { x = lerp(xp, f.xb, seg(k, e5, e6, E.sine)); spr = Fx.trot[Math.floor(T * 9) % 2]; }
      const X = Math.round(x) - (spr.width >> 1), Y = y - spr.height + 1; g.globalAlpha = I; g.drawImage(spr, X, Y); g.globalAlpha = 1;
    },
    /** rabbits: hops (the motion in the first part of each, a moment's rest after), sits, a flick of an ear, a nibble */
    rabbitsAt(T, I, list) {
      g.globalAlpha = I;
      for (const rb of list) for (const s of rb.steps) {
        if (T < s[0] || T >= s[1]) continue;
        const R = S.rab[s[5] > 0 ? 0 : 1], hop = s[4] === 1, u = hop ? clamp((T - s[0]) / s[6]) : 0, flying = hop && u < 1, spr = flying ? R.hop : [R.sit, R.sit, R.ear, R.nib][s[4]], x = lerp(s[2], s[3], u);
        const X = Math.round(x) - (spr.width >> 1), Y = rb.y - spr.height + 1 - (flying ? Math.round(Math.sin(u * Math.PI) * 3) : 0); g.globalAlpha = I; g.drawImage(spr, X, Y); break;
      }
      g.globalAlpha = 1;
    },
    /** the stag: walks out, stands, lifts his head and bellows, his breath smoking in the cold, and goes back */
    stagAt(T, I, s) {
      const k = T - s.t0, [dw, ds, db, dt, dout] = s.d, e1 = dw, e2 = e1 + ds, e3 = e2 + db, e4 = e3 + dt, e5 = e4 + dout; if (k <= 0 || k >= e5 + 1.2) return;
      const St = S.stag[s.dir > 0 ? 0 : 1], Sb = S.stag[s.dir > 0 ? 1 : 0]; let x = s.xs, spr = null;
      if (k < e1) { x = lerp(s.xa, s.xs, seg(k, 0, e1, E.sine)); spr = St.walk[Math.floor(T * 5) % 4]; }
      else if (k < e2 || (k >= e3 && k < e4)) spr = St.stand;
      else if (k < e3) spr = St.bellow;
      else if (k < e5) { x = lerp(s.xs, s.xa, seg(k, e4, e5, E.sine)); spr = Sb.walk[Math.floor(T * 5) % 4]; }
      if (spr) { const X = Math.round(x) - (spr.width >> 1), Y = s.y - spr.height + 1; g.globalAlpha = I; g.drawImage(spr, X, Y); }
      // three breaths, rising from his muzzle and thinning
      const mx = Math.round(s.xs) - (St.bellow.width >> 1) + (s.dir > 0 ? 17 : 4), my = s.y - St.bellow.height + 8;
      for (let p = 0; p < 3; p++) { const age = k - e2 - .3 - p * .55; if (age <= 0 || age >= 1.5) continue; g.globalAlpha = I * .75 * Math.sin(Math.PI * Math.pow(age / 1.5, .6)); g.drawImage(S.puff, Math.round(mx + s.dir * (1 + age * 5)) - 3, Math.round(my - age * 4) - 3); if (age > .3) { g.globalAlpha *= .7; g.drawImage(S.puff, Math.round(mx + s.dir * (2 + age * 8)) - 3, Math.round(my - 1 - age * 7) - 3); } }
      g.globalAlpha = 1;
    },
    /** the owl: over the pines its eyes in the dark of the boughs (over: 1); under them, its flight (over: 0) */
    owlAt(T, I, o, over, sway) {
      const tr = S.nears[o.tree], dx = Math.round(sway[o.tree] * Math.pow(1 - (o.perch[1] - (tr.base - tr.h)) / tr.h, 1.6)), px = o.perch[0] + dx, py = o.perch[1];
      if (over) {
        const [a, b] = o.eyes; if (T <= a || T >= b) return;
        const open = env(T, a, a + .3, b - .3, b) * I * (T > o.blink && T < o.blink + .14 ? 0 : 1) * S.m(px, py), lk = T > o.look ? o.lookDir : 0; if (open <= .02) return;
        g.globalAlpha = open * .5; g.drawImage(S.eyeGlow, px - 3 + lk, py - 3); g.globalAlpha = 1;
        g.fillStyle = css(P.eye, open); g.fillRect(px - 1 + lk, py, 1, 1); g.fillRect(px + 1 + lk, py, 1, 1); return;
      }
      const t0 = (T - o.fly[0]) / (o.fly[1] - o.fly[0]); if (t0 <= 0 || t0 >= 1) return;
      const w = t0 + Math.sin(t0 * 6.283) * .08, u = o.rev ? 1 - w : w; // slower across the moon, in the middle of its way
      const [x, y] = along(o.pts, u), O = S.owl, spr = u > .3 && u < .7 ? O.glide : [O.up, O.glide, O.down, O.glide][Math.floor(T * 7) % 4];
      g.globalAlpha = I; g.drawImage(spr, Math.round(x + (u < .12 ? dx * (1 - u / .12) : 0)) - (spr.width >> 1), Math.round(y) - (spr.height >> 1)); g.globalAlpha = 1;
    },
    /** a bat (or two) flickering round the moon, in from past one edge and away past another */
    batAt(T, I, b) {
      g.globalAlpha = I;
      for (let j = 0; j < b.n; j++) {
        const u = (T - b.t0 - j * .32) / b.dur; if (u <= 0 || u >= 1) continue;
        const [x, y] = along(b.pts, u), spr = S.bat[[0, 1, 2, 1][Math.floor(T * 15 + j * 2) % 4]];
        g.drawImage(spr, Math.round(x + Math.sin(T * 19 + j * 2) * 1.3 + Math.sin(T * 31) * .6) - (spr.width >> 1), Math.round(y + Math.cos(T * 23 + j) * 1.4 + j * 3) - (spr.height >> 1));
      }
      g.globalAlpha = 1;
    },
    /** how much of the moon the cloud hides (0 … 1) */
    cover(T, c) {
      const M = S.moon, u = (T - c.t[0]) / (c.t[1] - c.t[0]); if (u <= 0 || u >= 1) return 0;
      const x = lerp(c.x0, c.x1, u), o = clamp((Math.min(x + S.cl * .86, M.x + M.r) - Math.max(x + S.cl * .14, M.x - M.r)) / (M.r * 2));
      return E.sine(o) * (1 - seg(u, .72, 1, E.sine));
    },
    /** a cloud drifts in from past the edge and over the moon: the halo goes out, the rim silvers, and it thins away */
    cloudAt(T, I, c, cover) {
      const M = S.moon, u = (T - c.t[0]) / (c.t[1] - c.t[0]); if (u <= 0 || u >= 1) return;
      const x = Math.round(lerp(c.x0, c.x1, u)), y = c.y, a = (1 - seg(u, .72, 1, E.sine)) * I, cl = S.cl, ch = S.ch;
      if (cover > 0) { g.globalAlpha = cover * .8; g.drawImage(S.dark, M.x - (S.dark.width >> 1), M.y - (S.dark.height >> 1)); }
      g.globalAlpha = a * .96; g.drawImage(S.cloudSpr, x, y);
      const rx = S.rimX, R = S.rimMask.width >> 1; rx.globalCompositeOperation = "source-over"; rx.clearRect(0, 0, cl, ch); rx.drawImage(S.cloudRim, 0, 0); rx.globalCompositeOperation = "destination-in"; rx.drawImage(S.rimMask, M.x - x - R, M.y - y - R); rx.globalCompositeOperation = "source-over";
      S.masked(v => { // its bright parts keep back from the words
        v.globalAlpha = a * .22; v.drawImage(S.cloudRim, x, y); // the moonlight along its tops
        v.globalAlpha = a; v.drawImage(S.rimC, x, y); v.drawImage(S.rimC, x, y); // and the silver lining, brightest where the moon is behind it
        if (cover > .05) { v.globalAlpha = cover * .45; v.drawImage(S.rimGlow, M.x - (S.rimGlow.width >> 1), M.y - (S.rimGlow.height >> 1)); }
        if (cover > 0) { v.globalAlpha = cover * .3; v.drawImage(S.moonGlow, M.x - (S.moonGlow.width >> 1), M.y - (S.moonGlow.height >> 1)); }
        v.globalAlpha = 1; });
      g.globalAlpha = 1;
    },
    /** the northern lights: a curtain whose hem folds and drifts, its rays running along it, written into a small buffer */
    aurora(T, I, au) {
      const e = env(T, ...au.t, E.sine) * I * au.k; if (e < .01) return;
      const { w, h, x: ax, y: ay, base, amp, len, fadeL } = S.aur, d = S.aurD, n1 = S.aurN, n2 = S.aurN2, pal = S.aurPal;
      d.fill(0);
      for (let x = 0; x < w; x++) {
        const u = x / w, ends = Math.min(1, u / fadeL, (1 - u) * 12), ph = u * S.aur.freq + T * .45 + au.ph;
        const hem = base + Math.sin(ph) * amp + Math.sin(u * 13.1 - T * 1.05) * amp * .45 + (u - .5) * au.tilt, fold = .45 + .55 * Math.abs(Math.cos(ph)), shim = .72 + .28 * Math.sin(u * 9 - T * 2.1 + au.ph);
        const k = e * ends * ends * fold * shim * clamp(.2 + 1.9 * (fbm(n1, x * .23 + T * 1.1, 2) - .28)), tall = len * (.5 + .5 * fbm(n2, x * .07 - T * .3, 2)), yb = Math.min(h - 1, Math.round(hem));
        if (k < .02) continue;
        for (let y = Math.max(0, Math.round(hem - tall)); y <= yb; y++) { const c = pal[Math.min(len, Math.round((yb - y) * len / tall))], al = Math.round(255 * clamp(c[3] * k)); if (al > 0) d[y * w + x] = (al << 24 | c[2] << 16 | c[1] << 8 | c[0]) >>> 0; }
        const c0 = pal[2], sp = S.aur.spill; for (let y = yb + 1; y <= Math.min(h - 1, yb + sp); y++) { const al = Math.round(255 * clamp(k * .34 * Math.pow(1 - (y - yb) / (sp + 1), 1.5))); if (al > 0) d[y * w + x] = (al << 24 | c0[2] << 16 | c0[1] << 8 | c0[0]) >>> 0; } // the light spills a little below the hem
      }
      S.aurX.putImageData(S.aurImg, 0, 0);
      if (S.wmOn) { S.aurX.globalCompositeOperation = "destination-in"; S.aurX.drawImage(S.wmC, -ax, -ay); S.aurX.globalCompositeOperation = "source-over"; } // back from the words
      g.save(); g.globalCompositeOperation = "lighter"; g.drawImage(S.aurC, ax, ay); g.restore();
    },
    fireflies(T, I, A, F, pl) {
      const { W, hz } = S, TAU = 6.283, [w0, w1] = pl.wake, [s0, s1] = pl.settle, sy = pl.sync, sp = pl.spiral, wv = pl.waves, list = pl.more ? S.fliesAll : S.flies, n = list.length, G = pl.gather;
      const glow = (x, y, b) => { if (b <= .02) return; x = Math.round(x); y = Math.round(y); g.globalAlpha = clamp(b); g.drawImage(S.flyGlowBig, x - 6, y - 6); g.drawImage(S.flyGlow, x - 3, y - 3); g.globalAlpha = 1; g.fillStyle = css(b > .6 ? P.flyCore : P.fly, clamp(b * 1.15)); g.fillRect(x, y, 1, 1); };
      const gth = sp ? env(T, sp.t[0], sp.t[1], sp.t[2], sp.t[3], E.io) : 0;
      for (let i = 0; i < n; i++) {
        const f = list[i], ph = f.ph + pl.fph;
        const wake = seg(T, w0 + f.d, w1 + f.d, E.out), settle = seg(T, s0 + f.d * .6, s1, E.io), up = wake * (1 - settle);
        const hx = G ? f.hx + (G.gx + (f.hx - G.gx) * G.k - f.hx) * up : f.hx; // drawn toward the gathering as it rises, and back as it settles
        let x = hx + Math.sin(TAU * f.kx * T / LOOP + ph) * f.ax * (.4 + up), y = f.hy - f.rise * up + Math.sin(TAU * f.ky * T / LOOP + ph * 1.3) * f.ay * up;
        let b = Math.pow(Math.max(0, Math.sin(TAU * f.m * T / LOOP + ph)), 4) * up * .95;
        const sync = sy ? env(T - (x / W) * .5, sy[0], sy[1], sy[2], sy[3], E.sine) : 0; b = Math.max(b, sync * up);
        if (gth > 0) { // wound up into a slow spiral: the near side of it brighter, the whole column turning and rising
          const c = clamp(((i + .5) / n) * .92 + (T - sp.t[0]) * sp.rise), ang = sp.spin * (c * sp.turns * TAU + T * sp.w) + f.ph, front = .5 + .5 * Math.sin(ang);
          x = lerp(x, sp.cx + Math.cos(ang) * sp.R * (1 - .45 * c), gth); y = lerp(y, sp.y0 - c * sp.h + Math.sin(T * 1.7 + f.ph) * .8, gth);
          b = lerp(b, (.22 + .78 * front) * (.6 + .4 * Math.pow(Math.max(0, Math.sin(TAU * f.m * T / LOOP + ph)), 2)) * up, gth);
        }
        let wave = 0;
        if (wv) { for (const [t0, dd] of wv) wave = Math.max(wave, env(T - (dd > 0 ? x / W : 1 - x / W) * 1.8, t0, t0 + .2, t0 + .45, t0 + 1.2, E.sine)); b = Math.max(b * .45, wave * up); }
        if (f.amb) glow(f.hx + Math.sin(A * .4 + f.ph) * 4, f.hy - 2 + Math.sin(A * .3 + f.ph) * 2, Math.pow(Math.max(0, Math.sin(A * (.8 + f.m * .06) + f.ph)), 10) * .75 * (1 - I * up));
        const dm = pl.dealt && S.wmOn, mf = dm ? S.m(x, y) : 1, mh = dm ? S.mb(x - 5, y - 5, 11, 11) : 1; // a dealt pass's fireflies keep back from the words
        if (b * I > 0) glow(x, y, dm ? b * I * mf : b * I);
        if (gth > .3 && b * I > .55) { g.globalAlpha = (b * I - .55) * gth * .9 * mh; g.drawImage(S.flyHalo, Math.round(x) - 9, Math.round(y) - 9); g.globalAlpha = 1; } // the near side of the spiral
        const fl = wv ? Math.max(sync, wave) : sync;
        if (fl * up * I > .25) { g.globalAlpha = dm ? fl * up * I * .75 * mh : fl * up * I * .75; g.drawImage(S.flyHalo, Math.round(x) - 9, Math.round(y) - 9); g.globalAlpha = 1; }
      }
      if (F < 0) return;
      const M = S.moon, cx0 = W * .5, cy0 = hz - 2, cx1 = M.x - W * .08, cy1 = M.y + S.H * .12;
      for (const f of S.finaleFlies) { const u = clamp((F - f.d) / (1 - f.d)); if (u <= 0 || u >= 1) continue; const lift = E.io(u), spin = f.a + u * 7 * f.sp, rad = f.r0 * .55 * (1 - .65 * lift) + (u > .78 ? (u - .78) * W * 1.1 : 0); glow(lerp(cx0, cx1, lift) + Math.cos(spin) * rad, lerp(cy0 + (f.y0 - hz) * .3, cy1, lift) + Math.sin(spin) * rad * .38, u < .12 ? u / .12 : u > .82 ? (1 - u) / .18 : 1); }
    },
  };
  return S;
}
