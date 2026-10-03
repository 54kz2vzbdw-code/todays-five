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
//
// 1.12 b413: the egg. Every twelfth pass (K.egg: three minutes of the list left alone), the clearing has a visitor. A bank
// of fog rolls in, moonlit, and a shaft of moonlight comes down through it; the boughs of the near pine shake; and out of the
// pines steps a big, hairy shape that crosses the clearing in the stride of the Patterson–Gimlin film (1967) — the long swing
// of the arms, the knees never straight — a silhouette against the fog with the moon along its head and back. In the shaft
// of light it stops mid-stride, turns its head and shoulders to look straight out, the moon in its eyes, holds it, and walks
// on into the pines across the way, their boughs shaking after it; the fireflies scatter round it and flare, startled. The
// fog thins and the night is as it was. The walker is a rig of round limbs on a stride worked out from the ground it covers
// (so its feet never slide), set down in whole pixels with a head drawn by hand, the first time an egg plays.
//
// 1.12 b429: the long day's hour eggs. For a list left up for hours, once an hour (K.long, the stage's clock of the loops
// left alone) a night of its own in place of the one it would have dealt. In the odd hours, the pack: three wolves come
// out along the ridge from behind the near pine, black against a moonlit mist lying along it, the moon bright along their
// backs, and stand among the spires of the pines, lifting their heads to the moon, their eyes catching it; the leader
// howls, and the moon answers — it comes down the sky toward them, growing as it comes, its face filling in, until it
// stands enormous behind the ridge with the pack black against it; the leader sits and they howl together, the pup's yips
// among the long notes, while the fireflies go quiet; then they trot back into the pines and the moon climbs back to its
// place. (On a phone, where the ridge lies under the list, the moon swells over the list and the pack howls up at it out in
// the clearing, in its light.) In the even hours, the visitors: a light comes swaying down across the face of the moon,
// nearer and nearer, and is a saucer — its dome lit from inside, someone at the glass who blinks, amber and cyan lights
// running round its rim — that comes to hover high beside the moon; below it the fireflies gather and dance in rings,
// a light chasing round each, and it lets a beam all the way down into the middle of them, lighting the grass and the pines
// either side; in the light lies a pine cone, which rises up the beam, turning, and is taken in; the beam draws up, the
// rings break and drift away, and with a little hop it tips and is gone up the sky in a streak.
// Neither is dealt; each keeps back from the words as the dealt nights do, and opens and closes on the resting picture.
//
// 1.12 b446: the crown. In the sixth hour of the list left alone, and every sixth after (K.long 3), for whoever has had it up
// all day, the day goes round: a whole day over the forest in fifteen seconds. The moon sets into the pines, dawn warms
// the sky, the sun comes up past the tall pine with a glint and its light runs down the trees; birds dart out; the forest
// turns green under a blue day, clouds racing over with their shadows on the meadow, the pines' shadows wheeling, geese in
// a V; then the light goes gold, the sun sets into a bank of cloud over the pines with beams fanning up behind it and the
// pines rimmed in fire, the sky burns down through red and violet, and the night comes back — the stars, the moon rising
// out of the trees, the fireflies — to rest as it began. The words stay on the stage's own pad and washes through the
// day; what is bright in it keeps back from them, and the day's zenith deepens as a real sky's does, so that the bar's
// small words keep a dark ground from dawn to dusk.
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
    bfFar: rgb("#0A0806"), bfFur: rgb("#140F0B"), bfEdge: rgb("#211812"), bfRim: rgb("#33402F"), bfRimL: rgb("#6E9A84"), bfRimH: rgb("#C4E3CF"), // b413: the egg's walker, brown under the moon's silver
    bfL1: rgb("#241A12"), bfL2: rgb("#3F2F22"), bfL3: rgb("#5E4733"), bfL4: rgb("#8D7A64"), bfL5: rgb("#C9D6C6"), // and in a shaft of its light
    ufo: ["#4C6773", "#7E9EAB", "#BCD6DE", "#F4FEFF", "#43DCCE", "#EAFFFC", "#1C9E94", "#06221F", "#FFF7B8", "#18252B", "#A8FFF4", "#2E444C", "#FFFFFF", "#9FBAC4", "#A6FFF4"].map(rgb), // the saucer: its hull lit by the moon, its glass lit from inside, someone at it, its underside and port
    ufoA: rgb("#FFA81E"), ufoM: rgb("#22F2FF"), ufoAc: rgb("#FFE6A8"), ufoMc: rgb("#D8FFFF"), ufoBeam: rgb("#BFFFF4"), ufoGlow: rgb("#5CF6E8"), // its running lights (amber and cyan, and their hot cores), its beam and its glow
    cone: ["#1E140D", "#4A3322", "#7A5838", "#A9805A", "#E8D2A8"].map(rgb), // the pine cone: the gaps between its scales, their bodies, their lips, and the lips in the beam
    wolfEye: rgb("#F6EC9A"), wolf: rgb("#030907"), wolfRim: rgb("#86B29B"), moonDeep: rgb("#A3B99C"), moonHi: rgb("#F6FBF1"), // the hour eggs: the pack, black against the moon; the moon's face, close
  };
  const midsLayer = layer(), nearsLayer = layer(), grassLayer = layer();
  // b446: the crown's day — the colours of the land and the trees by daylight, and the hours it goes through (seconds of the
  // pass: the sky's four colours from the top down, the light laid over the land, how much of the trees' daylight shows)
  const DAYC = { ridge: "#5A8494", ridgeHi: "#8AB0B6", farTree: "#3E6A60", farHi: "#5E8C78", haze: "#E2EEF2", groundHi: "#6E9A4E", ground: "#4A7838", groundLo: "#22422A",
    mid: "#2E6240", midHi: "#5E9C5E", midShade: "#1E4632", trunk: "#4A3424", near: "#1E482E", nearHi: "#3C7846", grass: "#3A6C30", grassHi: "#9ACC5E",
    dawn: "#FFD486", dusk: "#FF8C46", cloud: "#FFFFFF", cloudMid: "#E6EEF6", cloudSh: "#B4C6DA", cloudLo: "#8A9EBA", cloudW: "#FFE6B0", cloudWMid: "#FFB27E", cloudWSh: "#D86A6A", cloudWLo: "#5E3E72", goose: "#1C2830", shadow: "#16321E", dawnGlow: "#FFB27A",
    sun: "#FFFBEA", sunRim: "#FFE7A8", sunW: "#FFC870", sunWRim: "#FF8A3C", sunGlow: "#FFF2CE", fireGlow: "#FF7A34" };
  const DAY = Object.fromEntries(Object.entries(DAYC).map(([k, v]) => [k, rgb(v)]));
  const SKYK = [[.8, [P.skyTop, P.skyMid, P.skyLow, P.horizon]], [2.4, ["#0A1430", "#1A2C54", "#384A7E", "#7E6A96"]], [3.5, ["#142A62", "#3A4E96", "#B07494", "#F09A86"]], [4.3, ["#1C3A7A", "#4A6EB4", "#E8908E", "#FFC27A"]],
    [5.4, ["#2058B4", "#5A94DC", "#A8D0EE", "#F0E6C8"]], [6.8, ["#1E56B4", "#4A8EE0", "#8EC6F2", "#D8ECF6"]], [8.6, ["#2552A8", "#5E8AC6", "#E6B888", "#FFD27E"]], [9.9, ["#2C2A6C", "#9A4A86", "#FF7A48", "#FFC25A"]],
    [10.8, ["#1E1C50", "#5E2E68", "#C8484A", "#F07A4A"]], [11.7, ["#121838", "#2E2652", "#64385C", "#A85A52"]], [13.0, [P.skyTop, P.skyMid, P.skyLow, P.horizon]]].map(([t, c]) => [t, c.map(v => typeof v === "string" ? rgb(v) : v)]);
  const LIGHTK = [[.8, "#0A1028", .8], [2.4, "#141E46", .74], [3.5, "#2A2442", .62], [4.4, "#5A3A3E", .5], [5.4, "#FFE2A6", .12], [6.8, "#FFFFFF", 0], [8.6, "#FFC06C", .2], [9.6, "#E0703C", .36], [10.4, "#4A1E30", .56], [11.4, "#121636", .74], [13.0, "#0A1020", .82]].map(([t, c, a]) => [t, rgb(c), a]);
  const AMBK = [[.8, 0], [2.4, .08], [3.6, .3], [4.6, .74], [5.4, .96], [8.8, 1], [9.8, .42], [10.6, .18], [11.4, .07], [12.4, 0]];
  const DAYT = { sky: [.8, 2.0, 12.4, 14.0], sun: [3.9, 11.6], moonSet: [.8, 3.4], moonRise: [11.7, 13.9], creep: [4.0, 5.6], dawnLit: [4.0, 4.5, 5.3, 6.5], duskLit: [8.8, 9.8, 10.6, 11.6], warm: [8.6, 9.8, 10.8, 12.0], geese: [5.6, 8.8], birds: [3.9, 5.6], bank: [8.4, 9.4, 11.6, 12.6], shadows: [4.3, 5.2, 9.6, 10.6], dawnGlow: [2.6, 3.9, 4.6, 6.0], burst: [4.25, 4.55, 4.7, 5.35], fan: [9.1, 9.8, 10.5, 11.3] };
  /** where T falls among keyframes: the one before, the one after, and how far between (eased) */
  const keyf = (T, ks) => { if (T <= ks[0][0]) return [0, 0, 0]; for (let i = 0; i < ks.length - 1; i++) if (T < ks[i + 1][0]) { const u = (T - ks[i][0]) / (ks[i + 1][0] - ks[i][0]); return [i, i + 1, u * u * (3 - 2 * u)]; } const n = ks.length - 1; return [n, n, 0]; };
  const SL = .5; // b413: the egg's shaft of moonlight, how far it leans (across for each pixel down)
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
      S.skyC = sky; S.ridgeY = ridgeY; // (the hour eggs': the sky to lay over the moon's place when it moves, the ridge it moves behind)
      S.land = { far, farTrees }; S.dayB = null; // (the crown's: the far hills and their pines, for the day's colours of them)
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
    /** 1.12 b413: the egg's night (every twelfth pass, K.egg): the clearing to itself and the one who crosses it. A breath of
     *  wind; a bank of fog rolling into the clearing, moonlit, so that what crosses it is a shape against the light; a shaft
     *  of moonlight let down through it where it will stop to look; the fireflies. Its stride is worked out from the ground it
     *  covers, so its feet never slide, and set so that it stops in the famous stride, its feet apart and its arms swung */
    eggPlan(n) {
      const { W, hz, portrait: pr, nears } = S, k = pr ? 1.15 : 1.4, v = pr ? 22 : 33, fr = S.walker(k), w = fr.w;
      const near = (f, b) => nears.reduce((a, t, i) => f(t.x) && (a < 0 || b(t.x, nears[a].x)) ? i : a, -1), inL = near(x => x < W / 2, (x, y) => x > y), inR = near(x => x > W / 2, (x, y) => x < y);
      const t0 = pr ? 3.8 : 1.2, x0 = -w + fr.ox - 2, x1 = W + fr.ox + 2, at = pr ? W * .5 : W * .68, cx = fr.w * .5 - fr.ox, d = new Float32Array(15 * 60 + 2);
      const walk = look => { for (let i = 1; i < d.length; i++) { const t = (i - 1) / 60; d[i] = d[i - 1] + (t < t0 ? 0 : v * (1 - .93 * env(t, look[0] - .4, look[0] + .2, look[2], look[3] + .3, E.sine)) * (1 + .22 * seg(t, look[3], look[3] + 1.2, E.sine)) / 60); } }; // how far it has come, a sixtieth of a second at a time: it slows to a stop to look, and walks on, a little quicker for having been seen
      let tl = t0 + (at - cx - x0) / v - 1.2, look;
      for (let it = 0; it < 5; it++) { look = [tl, tl + .35, tl + 1.75, tl + 2.1]; walk(look); tl += (at - (x0 + d[Math.round((tl + 1.05) * 60) + 1] + cx)) / v; } // the look comes in the middle of the light: worked out by walking it there
      look = [tl, tl + .35, tl + 1.75, tl + 2.1]; walk(look);
      const y = hz + (pr ? 24 : 22), e = { k, x0, x1, d, look, y, v };
      e.po = ((.06 - d[Math.round((tl + 1.05) * 60) + 1] / (fr.S * 2)) % 1 + 1) % 1; // its stride set so that it stands in the stride of that film while it looks
      let tin = t0; while (tin < 15 && S.walkAt(tin, e)[0] - fr.ox + fr.w * .5 < (inR < 0 ? W : nears[inR].x - 20 * k)) tin += 1 / 30; // when it reaches the pines across the way
      let tex = tin; while (tex < 15 && S.walkAt(tex, e)[0] < x1) tex += 1 / 30; // and when it is gone
      e.rus = [[inL, Math.max(.3, t0 - 1.3), t0 + .9], [inR, tin - .2, Math.min(14.6, tin + 1.6)]]; // (still at either end of the pass)
      // the moonlight: a shaft down through the fog from the moon's side, on the clearing where it looks, there before it and after
      const bw = fr.bw, yc = Math.round(y - fr.h * .55), Y0 = fr.bY, bh = y + 4 - Y0;
      e.beam = { t: [tl - 3.2, tl - .9, tl + 2.9, tl + 5.2], bw, bh, X0: Math.round(at + (yc - Y0 - bh) * SL - bw / 2), Y0, gx: Math.round(at + (yc - y) * SL) };
      return { dealt: true, gust: { t: [.5, 1.4, 1.9, 3.3], dir: 1, amp: .5 }, fph: 2.1, fog: [tl - 3.4, tl - 1, tl + 3, tl + 5.6], wake: [1.2, 3.7], settle: [12.3, 14.6],
        bank: [Math.max(.3, t0 - 3), Math.max(1.5, t0 - 1), Math.min(12.2, tex), Math.min(14.6, tex + 2.4)], egg: e };
    },
    /** where the walker is at T: its hip's x, and how far through its stride */
    walkAt(T, e) { const i = clamp(T * 60, 0, e.d.length - 2), j = Math.floor(i), d = lerp(e.d[j], e.d[j + 1], i - j); return [Math.min(e.x1, e.x0 + d), d]; },
    /** the boughs it pushes through: before it steps out of the pines, and as it goes into the ones across the clearing */
    rustle(T, I, e) {
      const out = S.nears.map(() => 0); let on = 0;
      for (const [i, a, b] of e.rus) { if (i < 0) continue; const k = env(T, a, a + .25, b - .6, b, E.sine) * I; if (k > .02) { out[i] = Math.round(k * 7); on = 1; } }
      out.push(on ? Math.floor(T * 15) : 0); return out;
    },
    /** the fireflies near it scatter, and flare startled; a moment after it, as if from its wake */
    scatter(T, x, y, e) {
      const o = S.sc || (S.sc = [0, 0, 0]); o[0] = o[1] = o[2] = 0;
      const fr = S.walker(e.k), [hx] = S.walkAt(Math.max(0, T - .2), e); if (hx <= e.x0 || hx >= e.x1) return o;
      const cx = hx - fr.ox + fr.w * .45, cy = e.y - fr.h * .5, R = fr.h * .75, dx = x - cx, dy = (y - cy) * 1.3, dd = Math.hypot(dx, dy) / R;
      if (dd >= 1 || dd < 1e-3) return o;
      const k = E.out(1 - dd); o[0] = dx / (dd * R) * k * R * .45; o[1] = (dy / (dd * R) - .6) * k * R * .3; o[2] = k * .95; return o;
    },
    /** the shaft of moonlight, in front of the walker as the fog is (it lights the air round it too) */
    beamAt(T, I, e, x, front) { const b = e.beam, k = env(T, ...b.t, E.sine) * I * (front ? .35 : 1); if (k < .01) return; const fr = S.walker(e.k); x.globalAlpha = k; x.drawImage(fr.beam, b.X0, b.Y0); x.globalAlpha = 1; }, // (most of it behind the walker, a veil of it in front)
    /** the walker: out of the pines on one side, across the clearing in that famous film's stride — the long swing of the
     *  arms, the knees never straight — into the moonlight, where it turns its head and shoulders mid-stride to look straight
     *  out, the moon in its eyes, and on out of the light into the pines across the way */
    walkerAt(T, I, e) {
      const fr = S.walker(e.k), b = e.beam, bk = env(T, ...b.t, E.sine) * I;
      if (bk > .01) { S.beamAt(T, I, e, g, 0); g.globalAlpha = bk * .55; g.drawImage(fr.pool, b.gx - (fr.pool.width >> 1), e.y - (fr.pool.height >> 1) + 1); } // the shaft behind it, and where its light falls on the grass
      const [hx, d] = S.walkAt(T, e); if (hx <= e.x0 || hx >= e.x1) { g.globalAlpha = 1; return; }
      const tu = env(T, ...e.look, E.sine), ph = (d / (fr.S * 2) + e.po) % 1, f = fr.frame(tu < .3 ? 0 : tu < .75 ? 1 : 2, Math.floor(ph * 12) % 12), X = Math.round(hx) - fr.ox, Y = e.y - fr.h + 1;
      g.globalAlpha = I; g.drawImage(f.c, X, Y);
      if (bk > .01) { const s = fr.sx; s.globalCompositeOperation = "source-over"; s.globalAlpha = 1; s.clearRect(0, 0, fr.w, fr.h); s.drawImage(f.lit, 0, 0); s.globalCompositeOperation = "destination-in"; s.drawImage(fr.mask, b.X0 - X, b.Y0 - Y); s.globalCompositeOperation = "source-over"; g.globalAlpha = bk * .4; g.drawImage(fr.sc, X, Y); } // its coat glimpsed where the shaft falls on it
      if (tu > .75 && f.eyes.length) { const [ex, ey] = f.eyes.reduce((a, p) => [a[0] + p[0] / f.eyes.length, a[1] + p[1] / f.eyes.length], [0, 0]); g.globalAlpha = I * .8 * (tu - .75) / .25; g.drawImage(S.eyeGlow, Math.round(X + ex) - 3, Math.round(Y + ey) - 3); }
      g.globalAlpha = 1;
    },
    /** the walker's frames, drawn once the first time an egg plays (and again at a new size): twelve steps of the stride, each
     *  in profile, turning, and looking out, in the dark and in the moonlight — a rig of round limbs set down in whole pixels,
     *  a head drawn by hand on top; and the shaft of light, its mask, its pool on the grass */
    walker(k) {
      if (S.wk && S.wk.k === k && S.wk.W === S.W && S.wk.H === S.H) return S.wk;
      const w = Math.ceil(28 * k), h = Math.ceil(35 * k), [sc, sx] = canvas(w, h), sets = [[], [], []]; // (each of the 36 frames drawn the first time it is wanted, so no one frame pays for them all)
      const wk = { k, W: S.W, H: S.H, w, h, ox: Math.round(w * .4), S: 12 * k, sc, sx, frame: (t, i) => sets[t][i] || (sets[t][i] = S.rig(i / 12, [0, .5, 1][t], k)) };
      const r0 = wk;
      const pr = S.portrait, M = S.moon, y = S.hz + (pr ? 24 : 22), bw = wk.bw = Math.round(r0.w * 1.05), Y0 = wk.bY = M.y + M.r + 3, bh = y + 4 - Y0, c = P.shaft;
      const shape = (fn) => paint(bw + Math.ceil(bh * SL) + 1, bh, (x, yy) => { const u = x - (bh - yy) * SL; if (u < 0 || u > bw) return null; return fn(Math.sin(Math.PI * u / bw), yy / bh); });
      wk.beam = shape((s, t) => [c[0], c[1], c[2], Math.round(255 * Math.pow(s, 1.4) * Math.min(1, t / .3) * (.45 + .55 * t) * (pr ? .3 : .27))]); // brighter low down, where the fog lies
      wk.mask = shape(s => [255, 255, 255, Math.round(255 * Math.min(1, s * 1.5))]);
      const prx = Math.round(bw * .95), pry = pr ? 3 : 4; wk.pool = paint(prx * 2 + 1, pry * 2 + 1, (x, yy) => { const q = Math.hypot((x - prx) / (prx + .5), (yy - pry) / (pry + .5)); return q >= 1 ? null : [c[0], c[1], c[2], Math.round(255 * .32 * Math.pow(1 - q, 1.5))]; });
      return (S.wk = wk);
    },
    rig(ph, tu, K0) {
      const SS = 4, w = Math.ceil(28 * K0), h = Math.ceil(35 * K0), W2 = w * SS, H2 = h * SS, cov = new Uint8Array(W2 * H2), ox = Math.round(w * .4), gy = h - 1;
      // which part is nearest at each subpixel: 1 the far arm, 2 the far leg, 3 the near leg, 4 the body, 5 the head, 6 the near arm
      const cap = (p, ax, ay, ar, bx, by, br) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6, x0 = Math.max(0, Math.floor((Math.min(ax - ar, bx - br) + ox) * SS) - 1), x1 = Math.min(W2, Math.ceil((Math.max(ax + ar, bx + br) + ox) * SS) + 1), y0 = Math.max(0, Math.floor((gy - Math.max(ay + ar, by + br)) * SS) - 1), y1 = Math.min(H2, Math.ceil((gy - Math.min(ay - ar, by - br)) * SS) + 1);
        for (let Y = y0; Y < y1; Y++) for (let X = x0; X < x1; X++) { const px = (X + .5) / SS - ox, py = gy - (Y + .5) / SS, t = clamp(((px - ax) * dx + (py - ay) * dy) / L2), rr = lerp(ar, br, t), qx = ax + dx * t - px, qy = ay + dy * t - py; if (qx * qx + qy * qy <= rr * rr) cov[Y * W2 + X] = p; } };
      const ell = (p, cx, cy, rx, ry, rot = 0) => { const c = Math.cos(rot), s = Math.sin(rot), R = Math.max(rx, ry);
        for (let Y = Math.max(0, Math.floor((gy - cy - R) * SS) - 1); Y < Math.min(H2, Math.ceil((gy - cy + R) * SS) + 1); Y++) for (let X = Math.max(0, Math.floor((cx - R + ox) * SS) - 1); X < Math.min(W2, Math.ceil((cx + R + ox) * SS) + 1); X++) { const px = (X + .5) / SS - ox - cx, py = gy - (Y + .5) / SS - cy, u = px * c + py * s, q = -px * s + py * c; if ((u / rx) ** 2 + (q / ry) ** 2 <= 1) cov[Y * W2 + X] = p; } };
      const k = K0, St = 12 * k, lift = 3.2 * k, th = 7.6 * k, c4 = Math.cos(4 * Math.PI * ph), hipH = (13.2 + .35 * c4) * k;
      const foot = s => { s = ((s % 1) + 1) % 1; if (s < .5) return [St / 2 - St * s / .5, 0, 0]; const u = (s - .5) / .5, e = u * u * (3 - 2 * u); return [-St / 2 + St * e, Math.sin(Math.PI * Math.pow(u, .75)) * lift, Math.sin(Math.PI * clamp(u * 1.5))]; }; // planted and sliding back under it, then lifted and swung through
      const knee = (fx, fy) => { const dy = fy - hipH, dd = Math.min(th * 2 - .05, Math.hypot(fx, dy)), a = Math.atan2(dy, fx), b = Math.acos(clamp(dd / (2 * th), -1, 1)); return [Math.cos(a + b) * th, hipH + Math.sin(a + b) * th]; };
      const leg = (p, s) => { const [fx, fl, toe] = foot(s), ay = 1.2 * k + fl, [kx, ky] = knee(fx, ay), ta = -toe * 1.1;
        cap(p, 0, hipH, 3.2 * k, kx, ky, 2.2 * k); cap(p, kx, ky, 2.1 * k, fx, ay, 1.4 * k); const mx = lerp(kx, fx, .4) - 1.4 * k, my = lerp(ky, ay, .4); cap(p, mx, my, .7 * k, mx - 1.3 * k, my - 1.2 * k, .3 * k); // the calf, and the hair off the back of it
        cap(p, fx - .8 * k, ay - .4 * k, k, fx + Math.cos(ta) * 2.4 * k, ay + Math.sin(ta) * 2.4 * k - .5 * k, .75 * k); }; // the foot: flat in the stance, its sole turned up as it lifts
      const sx0 = 3 * k, sy0 = hipH + 9 * k + .25 * k * c4;
      const arm = (p, a, near) => { const sx = sx0 + (near ? .2 : -1.2) * k, sy = sy0 - .3 * k, bend = .14 + Math.max(0, a) * .38, ex = sx + Math.sin(a) * 6.4 * k, ey = sy - Math.cos(a) * 6.4 * k, wx = ex + Math.sin(a + bend) * 6.2 * k, wy = ey - Math.cos(a + bend) * 6.2 * k, mx = lerp(ex, wx, .5), my = lerp(ey, wy, .5), cb = Math.cos(a + bend), sb = Math.sin(a + bend);
        cap(p, sx, sy, 2.6 * k, ex, ey, 1.95 * k); cap(p, ex, ey, 1.85 * k, wx, wy, 1.5 * k); ell(p, wx + sb * .9 * k, wy - cb * .9 * k, 1.6 * k, 1.7 * k); // the arm, the forearm, the hand
        cap(p, ex - Math.cos(a) * .6 * k, ey - Math.sin(a) * .6 * k, .9 * k, ex - Math.cos(a) * 1.9 * k + Math.sin(a) * .4 * k, ey - Math.sin(a) * 1.9 * k - .9 * k, .4 * k); cap(p, mx - cb * .8 * k, my - sb * .8 * k, .65 * k, mx - cb * 1.8 * k - .3 * k, my - sb * 1.8 * k - .9 * k, .25 * k); }; // hair at the elbow, under the forearm
      const sw = Math.cos(2 * Math.PI * ph), A = .78; // the near foot strikes at 0, the near arm back then
      arm(1, A * sw, false); leg(2, ph + .5); leg(3, ph);
      ell(4, -1 * k, hipH + .9 * k, 4.2 * k, 3.7 * k); cap(4, -.2 * k, hipH + 1.6 * k, 4.4 * k, sx0 - .6 * k, sy0 - 2.2 * k, 5.1 * k); ell(4, sx0 - 1.7 * k - .5 * k * tu, sy0 + .4 * k, (5.0 + .8 * tu) * k, 3.6 * k, -.42); // the rump, the belly and chest, the great hump of the shoulders
      const tuft = (x, y, dx, dy, L) => cap(4, x, y, .75 * k, x + dx * L * k, y + dy * L * k, .3 * k); tuft(sx0 - 5 * k, sy0 - .2 * k, -.75, -.65, 1.9); tuft(sx0 - 4.3 * k, sy0 - 3.4 * k, -.9, -.45, 1.6); tuft(-4.2 * k, hipH + 1.6 * k, -.75, -.65, 1.6);
      const hx = sx0 + (1.7 - 1.1 * tu) * k, hy = sy0 + 2.7 * k;
      arm(6, -A * sw, true);
      const part = new Uint8Array(w * h), px = new Uint8Array(w * h), lt = new Uint8Array(w * h), n = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { n.fill(0); let tot = 0; for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) { const v = cov[(y * SS + j) * W2 + x * SS + i]; if (v) { n[v]++; tot++; } } if (tot < SS * SS * .5) continue; let best = 0; for (let v = 1; v < 7; v++) if (!best && n[v] || n[v] > n[best]) best = v; part[y * w + x] = best; }
      // the head, by hand: in profile the skull slopes back to the crest and the brow juts over the face; turning, an eye
      // comes round; looking out, a round head with the crest over its middle
      const HD = tu < .3 ? ["..##....", ".####...", ".#####..", "#######.", "########", "#####f#.", "########", "#######."] : tu < .75 ? ["..##....", ".####...", ".#####..", "#######.", "###fefe.", "####fff.", "#######.", ".#####.."] : ["...##...", "..####..", ".######.", "########", "#feffef#", "#ffffff#", ".#ffff#.", "..####.."];
      const eyes = [], face = [], hX = Math.round(hx + ox - 3.5 + (tu < .3 ? .5 : 0)), hY = Math.round(gy - hy - 4.2); // (f: the face in the shadow of the brow, darker than the coat; e: an eye)
      HD.forEach((row, j) => { for (let i = 0; i < row.length; i++) { if (row[i] === ".") continue; const X = hX + i, Y = hY + j; if (X < 0 || Y < 0 || X >= w || Y >= h || part[Y * w + X] === 6) continue; part[Y * w + X] = 5; if (row[i] === "e") eyes.push([X, Y]); if (row[i] === "f" || row[i] === "e") face.push(Y * w + X); } });
      const at = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? 0 : part[y * w + x];
      for (let i = 0; i < w * h; i++) if (part[i]) px[i] = part[i] <= 2 ? 1 : 2;
      // in the dark: the moon behind it rims the outline, brightest along the tops of the head and shoulders, broken where the
      // hair catches it
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = at(x, y); if (!p) continue; const up = !at(x, y - 1), rt = !at(x + 1, y), ur = !at(x + 1, y - 1), hair = (x * 7 + y * 13) % 5 === 0, i = y * w + x;
        if (p <= 2) { if (up && rt) px[i] = 3; continue; }
        if (up) px[i] = y < h * .55 ? 5 : 4; else if (rt) px[i] = hair ? 7 : y < h * .5 ? 4 : 3; else if (ur) px[i] = 3; }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (at(x, y) !== 6) continue; const r2 = at(x + 1, y), u2 = at(x, y - 1), i = y * w + x; if (px[i] === 2 && ((r2 && r2 !== 6) || (u2 && u2 !== 6 && u2 !== 5))) px[i] = 7; } // the near arm's front, dimly, so its swing reads across the dark of the body
      // in the light, from up and to the right: each part a round thing lit along its upper side (how far in from its lit edge,
      // counting what stands in front of it as itself), its coat in strands
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const p = at(x, y); if (!p) continue; let s = 1; while (s < 7) { const q = at(x + s, y - s); if (!q || q < p) break; s++; }
        let v = s === 1 ? (at(x, y - 1) ? 4 : 5) : s <= 3 ? 3 : s <= 5 ? 2 : 1; if (p <= 2) v = Math.max(1, v - 1); if (v >= 2 && v <= 4 && ((x * 5 + (y >> 1) * 3) & 3) === 0) v--; lt[y * w + x] = v; }
      for (const i of face) { px[i] = 1; lt[i] = 1; }
      if (tu > .75) for (const [X, Y] of eyes) px[Y * w + X] = lt[Y * w + X] = 6;
      const C = [null, P.bfFar, P.bfFur, P.bfRim, P.bfRimL, P.bfRimH, P.eye, P.bfEdge], L = [null, P.bfL1, P.bfL2, P.bfL3, P.bfL4, P.bfL5, P.eye];
      return { c: paint(w, h, (x, y) => C[px[y * w + x]]), lit: paint(w, h, (x, y) => L[lt[y * w + x]]), w, h, ox, S: St, eyes: tu > .75 ? eyes : [] };
    },
    /** 1.12 b429: the first hour egg (K.long 1, once in an odd hour of the list left alone): the pack, and the moon that comes
     *  to it. Three wolves come out along the ridge from behind the near pine past the moon, black against the moonlit mist
     *  lying along it, two pixels of the moon's light along their backs and heads, and stop among the spires of the pines on
     *  it, lifting their heads to the moon, their eyes catching it; the leader lifts its head again and howls at the moon; and
     *  the moon answers — it comes down the sky toward them, swelling as it comes, until it stands over the ridge enormous and
     *  they are black against it; the leader sits, and the pack howls in chorus, the pup's short yips among the long ones,
     *  while the fireflies go quiet; then the wolves turn and trot back the way they came, and the moon climbs back to its
     *  place. On a phone, where the ridge lies under the list, the moon swells over the list and the pack howls up at it out in
     *  the clearing, in its light. Composed, not dealt */
    wolfPlan() {
      const { W, H, hz, portrait: pr } = S, k = pr ? 1.1 : 1.3, mx = Math.round(W * (pr ? .58 : .78)), mr = Math.round(pr ? W * .21 : H * .2), my = pr ? Math.round(H * .19) : S.ridgeY(mx) - Math.round(H * .1);
      const hide = S.nears.filter(t => t.x > (pr ? W * .7 : mx)).reduce((a, t) => !a || t.x < a.x ? t : a, null), x0 = hide ? hide.x + (pr ? 4 : 0) : W + 20; // out from behind the near pine past the moon, and back behind it
      const at = pr ? [W * .2, W * .45, W * .63] : [mx - mr * .64, mx, mx + mr * .48], v = pr ? 24 : 21, vo = pr ? 28 : 26;
      const pack = [[k * .82, at[0], .4, [[7.5, 8.1, 10.1, 10.7]], 11.4, 0], [k, at[1], 1.7, [[4.0, 4.6, 5.8, 6.3], [7.1, 7.7, 10.3, 10.9]], 11.1, [6.25, 6.85, 10.95, 11.25]], [k * .62, at[2], 2.8, [[8.15, 8.4, 8.85, 9.15], [9.35, 9.6, 10.2, 10.55]], 10.8, 0]] // the first out goes furthest; the leader, in the middle, howls first and sits for the chorus; the pup's are yips
        .map(([kk, x1, a, howl, o, sit], i) => ({ k: kk, x1: Math.round(x1), howl, sit, y: pr ? hz + [15, 19, 23][i] : 0, t: [a, a + (x0 - x1) / v, o, o + (x0 - x1) / vo] })); // (on a phone, out in the clearing, under the list)
      return { dealt: true, gust: { t: [.4, 1.4, 1.9, 3.3], dir: -1, amp: .45 }, fph: 1.3, fog: [5.4, 7.6, 10.6, 13.4], wake: [.8, 3.3], settle: [12.4, 14.6], hush: [4.6, 6.6, 10.6, 12.4],
        wolves: { mx, my, mr, x0, pack, moon: [4.8, 7.4, 11.1, 13.9], glow: [[.2, 1.6, 4.9, 6.9], [11.2, 12.2, 13.0, 14.3]] } }; // (glow: the moonlight in the mist behind the ridge as they come out and as they go, the moon's own light between)
    },
    /** 1.12 b429: the second hour egg (K.long 2, once in an even hour): the visitors. A light high over the trees that is not
     *  a star comes swaying down the sky across the face of the moon, nearer and nearer, and is a saucer — a disc with a glass
     *  dome lit from inside, someone at the glass, its lights running round its rim — that comes to hover high beside the moon,
     *  the brightest thing in the forest. Below it the fireflies gather and dance in rings, blinking in time with its lights;
     *  it lets a beam all the way down into the middle of them, and in the light on the grass lies a pine cone, which rises up
     *  the beam, turning, and is taken in; the beam draws up, the rings break and the fireflies drift away, and the saucer
     *  hops, tips and is gone up the sky in a streak. On a phone it hovers low over the clearing under the list. Composed,
     *  not dealt */
    ufoPlan() {
      // where it hovers, out of the band the list's pad darkens: on a desktop high in the sky beside the moon, its beam all the
      // way down to the clearing below the list; on a phone low over the clearing under the list, its beam a short one
      const { W, H, hz, portrait: pr, moon: M } = S, w = pr ? 24 : 34, hx = Math.round(W * (pr ? .42 : .735)), hy = pr ? Math.min(H - 54, hz + 18) : Math.max(M.y + 2, Math.round(H * .2)), gy = pr ? Math.min(H - 30, hz + 42) : Math.min(Math.round(H * .835), hz + 35);
      const path = pr ? [[W + 14, -12], [M.x + 7, M.y - 8], [M.x - 1, M.y + 5], [W * .7, H * .5], [W * .5, hy - 12], [hx, hy]] : [[W + 16, -18], [M.x + 15, M.y - 15], [M.x - 2, M.y + 3], [M.x - 22, M.y + 12], [hx + 7, hy + 5], [hx, hy]];
      const tin = [1.5, 4.7], out = [11.0, 11.85], bob = t => [Math.sin((t - tin[1]) * 1.3) * 1.3, Math.sin((t - tin[1]) * 2.1) * 1.1], [ex, ey] = bob(out[0]);
      const exit = [[hx + ex, hy + ey], [hx + ex + 1, hy + ey - 5], [hx + W * (pr ? .2 : .12), hy - H * (pr ? .45 : .16)], [W + 40, -50]];
      const ufo = { w, hx, hy, gy, path, exit, bob, in: tin, out, dance: [4.6, 6.4, 10.2, 11.6], beam: [6.9, 7.5, 9.95, 10.4], lift: [7.7, 9.85], hop: [10.45, 10.9], blink: [5.35, 9.95] };
      S.ufoSpill(ufo); S.coneSpr(0); // (the light it will throw on the pines, worked out now, at the quiet start of the pass)
      return { dealt: true, gust: { t: [.6, 1.6, 2.1, 3.5], dir: 1, amp: .5 }, fph: .7, fog: [3.5, 6, 9, 12], wake: [1.4, 4.0], settle: [11.4, 14.6], more: true, ufo };
    },
    /** where the saucer is at T, how near (its size, 0 … 1) and how it tips; null when it is not there */
    ufoPos(T, u) {
      const o = S.uo || (S.uo = [0, 0, 0, 0]); if (T <= u.in[0] || T >= u.out[1]) return null;
      if (T < u.in[1]) { const q = seg(T, u.in[0], u.in[1], v => 1 - Math.pow(1 - v, 2.2)), [x, y] = along(u.path, q); o[0] = x; o[1] = y; o[2] = lerp(.32, 1, Math.pow(q, 1.3)); o[3] = Math.sin(q * Math.PI * 3) * 13 * (1 - q); return o; } // swaying down like a leaf, nearer and nearer
      if (T < u.out[0]) { const [bx, by] = u.bob(T), hop = Math.sin(Math.PI * seg(T, u.hop[0], u.hop[1], x => x)); o[0] = u.hx + bx; o[1] = u.hy + by - hop * 3.5; o[2] = 1; o[3] = Math.sin((T - u.in[1]) * 1.7) * 3 + hop * 4; return o; } // hovering (and once it has what it came for, a little hop)
      const q = seg(T, u.out[0], u.out[1], v => v * v * v), [x, y] = along(u.exit, q); o[0] = x; o[1] = y; o[2] = lerp(1, .5, q); o[3] = -12 * Math.min(1, q * 5); return o; // and away
    },
    /** the saucer at width w, tipped by ti × 6°: a lens of a hull lit from above by the moon, the bright edge of its rim and
     *  the moon's glint on its shoulder, the underside dark round a glowing port, and a glass dome lit from inside, someone at
     *  the glass; where its belly, dome and port are */
    ufoSpr(w, ti) {
      const key = w + "|" + ti, c = S.ufoC || (S.ufoC = new Map()); let o = c.get(key); if (o) return o;
      const rx = w / 2, rT = w * .19, rB = w * .13, dR = w * .2, dH = w * .22, vd = -rT * .72, pad = Math.ceil(w * .12) + 2, cw = w + pad * 2, ch = Math.ceil(rT + dH + rB) + pad * 2, cx = cw / 2, cy = pad + Math.ceil(dH - vd) + 1;
      const a = ti * Math.PI / 30, ca = Math.cos(a), sa = Math.sin(a), C = P.ufo, eyes = [];
      const spr = paint(cw, ch, (px, py) => {
        const dx = px + .5 - cx, dy = py + .5 - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, e = clamp(1 - (u / rx) ** 2);
        const dd = (u / dR) ** 2 + ((v - vd) / dH) ** 2;
        if (v <= vd + .3 && dd <= 1) { // the dome: glass lit from inside, someone at it, head and shoulders
          const fig = (fu, fv) => w >= 16 && ((fu / (dR * .3)) ** 2 + ((fv - vd + dH * .4) / (dH * .33)) ** 2 < 1 || ((fu / (dR * .52)) ** 2 + ((fv - vd + dH * .02) / (dH * .24)) ** 2 < 1 && fv > vd - dH * .2)); // a round head on narrow shoulders
          if (w >= 16 && Math.abs(Math.abs(u) - dR * .2) < .5 && Math.abs(v - vd + dH * .42) < .5) { eyes.push([px, py]); return C[8]; }
          if (fig(u, v)) return C[7];
          if (dd > .78) return C[6]; // the rim of the glass
          if (u < -dR * .3 && v < vd - dH * .45 && dd < .66) return C[5]; // its glint
          return fig(u + 1, v) || fig(u - 1, v) || fig(u, v + 1) || fig(u, v - 1) ? C[14] : C[4]; } // the glass lit from inside, brightest round the one at it
        const top = rT * Math.pow(e, .75), bot = rB * Math.pow(e, .55);
        if (v >= -.5 && v < .5 && e > 0) return u > -rx * .25 ? C[3] : C[13]; // the edge of the rim, catching the moon
        if (v < 0 && v >= -top) { const t = -v / (top + .01); if (w >= 16 && t > .3 && t < .78 && Math.abs(u - rx * (.42 + (t - .54) * .3)) < .75) return C[12]; return t > .62 ? C[2] : t > .28 ? C[1] : C[0]; } // the upper hull, lit from above, the moon's glint on its shoulder
        if (v > 0 && v <= bot) return Math.abs(u) < w * .1 && v > bot * .4 ? C[10] : v > bot - 1 ? C[11] : C[9]; // the underside round its port
        return null;
      });
      o = { c: spr, w: cw, h: ch, cx, cy, rx, ca, sa, belly: rB, eyes, dome: [cx - (vd - dH * .25) * sa, cy + (vd - dH * .25) * ca], port: [cx - rB * .75 * sa, cy + rB * .75 * ca] }; c.set(key, o); return o;
    },
    /** the glows that go with the saucer at width w: the air round it, its dome's light, its port's */
    ufoGlows(w) { const c = S.ufoGs || (S.ufoGs = new Map()); let o = c.get(w); if (!o) { o = { aura: glowSpr(Math.max(3, Math.round(w * .95)), P.ufoGlow, .2), dome: glowSpr(Math.max(2, Math.round(w * .36)), P.ufoGlow, .7), port: glowSpr(Math.max(2, Math.round(w * .2)), P.ufoGlow, .85) }; c.set(w, o); } return o; },
    /** a pine cone of a size to read, its scales in rows, f (0 … 3) how far round it has turned */
    coneSpr(f) {
      const c = S.cones || (S.cones = new Map()), key = (S.portrait ? "p" : "d") + f; let o = c.get(key); if (o) return o;
      const w = S.portrait ? 9 : 11, h = S.portrait ? 12 : 15, cx = (w - 1) / 2, ph = f * .75, C = P.cone;
      o = paint(w, h, (x, y) => {
        if (y < 2) return x === Math.round(cx) ? C[y ? 1 : 0] : null; // the stem
        const t = (y - 2) / (h - 3), half = (w / 2 - .2) * Math.pow(Math.sin(Math.PI * Math.min(1, .14 + t * .9)), .7), dx = x - cx; if (Math.abs(dx) > half) return null;
        const r = Math.floor((y - 2) / 2), sy = (y - 2) % 2, s = (((dx + (r & 1) * 1.5 + ph) % 3) + 3) % 3, side = Math.abs(dx) / (half + .01); // each row of scales half a scale round from the one above
        let v = sy ? (s > .8 && s < 2.2 ? 3 : 2) : (s < .9 ? 0 : 1); // a scale: the gap beside it, its body, its lip
        if (side > .72) v = Math.max(0, v - 1); // round the curve, darker
        if (v === 3 && dx > -half * .15) v = 4; // the lips toward the light
        return C[v];
      });
      c.set(key, o); return o;
    },
    /** the light the beam throws on the pines round it (the ones behind it, and the near ones in front): the edges of their
     *  boughs and trunks facing it, brighter the nearer and the lower down, worked out once for where it hovers */
    ufoSpill(u) {
      const key = S.W + "|" + S.H + "|" + u.hx + "|" + u.gy + "|" + u.w; if (S.spill && S.spill.key === key) return S.spill;
      const { W, H } = S, top = u.hy + Math.round(u.w * .13) + 1, hw0 = u.w * .17, hw1 = u.w * .56, R = u.w * .6, c = P.ufoBeam;
      const build = trees => { const [cv, cx] = canvas(W, H), im = cx.createImageData(W, H), d = im.data;
        for (const t of trees) { const sp = t.spr, w = sp.width, h = sp.height, x0 = t.x - (w >> 1), y0 = t.base - h; if (x0 > u.hx + hw1 + R + 2 || x0 + w < u.hx - hw1 - R - 2) continue;
          const sd = sp.getContext("2d").getImageData(0, 0, w, h).data, on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && sd[(y * w + x) * 4 + 3] > 0;
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!on(x, y)) continue; const X = x0 + x, Y = y0 + y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
            const sd2 = X < u.hx ? 1 : -1, e1 = !on(x + sd2, y), e2 = !e1 && !on(x + 2 * sd2, y); if (!e1 && !e2) continue; // the edge toward the beam, two pixels deep
            const tt = clamp((Y - top) / (u.gy - top)), dist = Math.abs(X - u.hx) - lerp(hw0, hw1, tt); if (dist < 1) continue; const L = Math.pow(clamp(1 - dist / R), 1.6) * clamp((Y - top + 4) / 12) * clamp((u.gy + 8 - Y) / 10); // (beside it, not behind it: there the beam itself is the light)
            const k = (Y * W + X) * 4, al = Math.round(255 * L * (e1 ? .9 : .42)); if (al > d[k + 3]) { d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = al; } } }
        cx.putImageData(im, 0, 0); return cv; };
      return (S.spill = { key, mid: build(S.mids), near: build(S.nears) });
    },
    /** how far the beam is let down (0 … 1) */
    beamExt(T, u) { return seg(T, u.beam[0], u.beam[1], E.out) * (1 - seg(T, u.beam[2], u.beam[3], E.in)); },
    /** the near pines in the beam's light (drawn over them) */
    ufoNear(T, I, u) { const ext = S.beamExt(T, u); if (ext <= .01) return; g.globalAlpha = ext * I; g.drawImage(S.ufoSpill(u).near, 0, 0); g.globalAlpha = 1; },
    /** the saucer: the air round it lit, the beam it lets down and the pines and grass in its light, the pine cone in it, the
     *  port and the dome glowing, the hull, and its lights running round the rim, amber and cyan, a light chasing round them */
    ufoAt(T, I, A, u) {
      const p = S.ufoPos(T, u); if (!p) return;
      const [x, y, sc, tilt] = p, w = Math.max(6, Math.round(u.w * sc / 2) * 2), sp = S.ufoSpr(w, clamp(Math.round(tilt / 6), -2, 2)), X = Math.round(x), Y = Math.round(y), G = S.ufoGlows(w), ox0 = X - Math.round(sp.cx), oy0 = Y - Math.round(sp.cy);
      const L = S.ufoL || (S.ufoL = { A: glowSpr(4, P.ufoA, 1), M: glowSpr(4, P.ufoM, 1), s: glowSpr(3, P.ufoGlow, .9) });
      const add = (spr, cx, cy, k) => { if (k <= .01) return; g.globalCompositeOperation = "lighter"; g.globalAlpha = Math.min(1, k); g.drawImage(spr, Math.round(cx) - (spr.width >> 1), Math.round(cy) - (spr.height >> 1)); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; };
      add(G.aura, X, Y, I); // the air round it, lit
      // the beam: down from its belly to the grass, a bright core and a soft edge, a pool of light where it lands, the pines
      // round it catching it; drawn down, and drawn up again from the bottom
      const ext = S.beamExt(T, u), top = Y + Math.round(sp.belly) + 1;
      if (ext > 0 && I > .01) {
        g.globalAlpha = ext * I; g.drawImage(S.ufoSpill(u).mid, 0, 0); g.globalAlpha = 1; // the pines behind it in its light
        const hw0 = w * .17, hw1 = w * .56, bw = Math.ceil(hw1 * 2.8) + 2, bh = Math.max(1, u.gy - u.hy + 12), bx0 = X - (bw >> 1), lim = top + (u.gy - top) * ext, c = P.ufoBeam; // (a buffer as tall as the beam can be, made once: the beam bobs with the saucer)
        if (!S.beamB || S.beamB.w !== bw || S.beamB.h !== bh) { const [cv, cx] = canvas(bw, bh); S.beamB = { w: bw, h: bh, c: cv, x: cx, im: cx.createImageData(bw, bh) }; }
        const beam = S.beamB.c, bx = S.beamB.x, im = S.beamB.im, d = im.data; d.fill(0);
        for (let yy = 0; yy < bh; yy++) { const Yy = top + yy; if (Yy > lim + 3 || Yy > u.gy + 4) break; const t = clamp(yy / Math.max(1, u.gy - top)), hw = lerp(hw0, hw1, t), band = .9 + .1 * Math.sin(Yy * .75 - T * 9), cut = clamp((lim + 3 - Yy) / 3), fall = 1 - .35 * t;
          for (let xx = 0; xx < bw; xx++) { const q = Math.abs(xx + bx0 + .5 - x) / hw; let al = q < 1.3 ? ((q < 1 ? .8 * Math.pow(1 - q * q, 1.5) : 0) + .2 * Math.exp(-(((q - .95) / .18) ** 2))) * band * fall : 0;
            if (ext > .9) { const pq = ((xx + bx0 + .5 - x) / (hw1 * 1.4)) ** 2 + ((Yy - u.gy) / 2.8) ** 2; if (pq < 1) al += .7 * Math.pow(1 - pq, 1.2) * clamp((ext - .9) * 10); } // the pool on the grass
            if (al > .004) { const k = (yy * bw + xx) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = Math.round(255 * clamp(al * cut * I)); } } }
        bx.putImageData(im, 0, 0); g.drawImage(beam, bx0, top);
        if (ext > .9) { const gw = S.groundGlow && S.groundGlow.width === Math.round(hw1 * 2.6) * 2 + 1 ? S.groundGlow : (S.groundGlow = paint(Math.round(hw1 * 2.6) * 2 + 1, 13, (gx, gy2) => { const r = Math.round(hw1 * 2.6), q = ((gx - r) / (r + .5)) ** 2 + ((gy2 - 6) / 6.5) ** 2; return q >= 1 ? null : [P.ufoGlow[0], P.ufoGlow[1], P.ufoGlow[2], Math.round(255 * .5 * Math.pow(1 - q, 1.6))]; }));
          add(gw, X, u.gy, I * clamp((ext - .9) * 10)); } // the grass round the pool, lit
      }
      // the pine cone, lying in the grass where the light falls, then up the beam, turning, and in
      const lq = seg(T, u.lift[0], u.lift[1], E.io), seen = T < u.lift[0] ? clamp((ext - .9) * 10) : 1;
      if (ext > .9 && lq < .97 && seen > 0) { const cf = S.coneSpr(lq > 0 ? Math.floor(T * 8) & 3 : 0);
        g.globalAlpha = I * seen; g.drawImage(cf, Math.round(x + (lq > 0 ? Math.sin(T * 5) * .7 : 0)) - (cf.width >> 1), Math.round(lerp(u.gy - cf.height + 2, top - (cf.height >> 1), lq))); g.globalAlpha = 1; }
      // the streak it leaves as it goes
      if (T > u.out[0]) for (let k = 1; k < 6; k++) { const q = S.ufoPos(T - k * .022, u); if (!q) break; add(L.s, q[0], q[1], I * .8 * (1 - k / 6)); }
      // the port and the dome glowing, the hull, and someone at the glass, who blinks
      add(G.port, ox0 + sp.port[0], oy0 + sp.port[1], I * (.75 + .25 * ext)); add(G.dome, ox0 + sp.dome[0], oy0 + sp.dome[1], I);
      g.globalAlpha = I; g.drawImage(sp.c, ox0, oy0);
      if (u.blink.some(b => T > b && T < b + .16)) { g.fillStyle = css(P.ufo[7]); for (const [ex, ey] of sp.eyes) g.fillRect(ox0 + ex, oy0 + ey, 1, 1); }
      // the running lights round the rim, the near ones bright, a light chasing round them
      const spin = T * 2.4 + 7 * E.io(seg(T, u.hop[0] - .2, u.out[1], x => x)), n = 10;
      for (let j = 0; j < n; j++) { const th = j / n * 6.2832 + spin, fr = Math.sin(th); if (fr < .05) continue; const lu = Math.cos(th) * sp.rx * .88, lv = 1.2, lx = Math.round(X + lu * sp.ca - lv * sp.sa), ly = Math.round(Y + lu * sp.sa + lv * sp.ca), am = (j & 1) === 0;
        const chase = Math.pow(.5 + .5 * Math.sin(j * 1.2566 - T * 6.5), 3), br = (.55 + .45 * fr) * (.45 + .55 * chase);
        add(am ? L.A : L.M, lx + (w >= 20 ? .5 : 0), ly, I * br); g.globalAlpha = I * Math.min(1, .35 + br); g.fillStyle = css(am ? P.ufoAc : P.ufoMc); g.fillRect(lx, ly, w >= 20 ? 2 : 1, 1); }
      g.globalAlpha = 1;
    },
    /** a firefly's place in the rings under the saucer, and how bright: three rings, widening downward like the beam, the
     *  middle one turning the other way, a light running round each in time with the saucer's */
    ringAt(T, i, n, u, x, y, b) {
      const o = S.ro || (S.ro = [0, 0, 0]); o[0] = x; o[1] = y; o[2] = b;
      const k = env(T, ...u.dance, E.io), p = k > 0 ? S.ufoPos(T, u) : null; if (!p) return o;
      const ring = i % 3, m = Math.ceil(n / 3), j = Math.floor(i / 3), dir = ring === 1 ? -1 : 1, ang = dir * T * [1.5, 1.15, .95][ring] + j / m * 6.2832 + ring * .7;
      const top = u.hy + u.w * .14, ry = u.gy - Math.min(u.gy - top - 4, 20) * [.7, .4, .1][ring], R = lerp(u.w * .17, u.w * .56, clamp((ry - top) / (u.gy - top))) + u.w * [.16, .3, .44][ring]; // round the foot of the beam, the lowest the widest
      const fr = Math.sin(ang), chase = Math.pow(Math.max(0, Math.sin(ang * 2 - dir * T * 5)), 3);
      o[0] = lerp(x, p[0] + Math.cos(ang) * R, k); o[1] = lerp(y, ry + fr * R * .12, k); o[2] = lerp(b, (fr > 0 ? 1 : .5) * (.42 + .58 * chase), k); return o;
    },
    /** moonlit mist lying along the ridge among the pine tops, so that what comes out along it stands black against it
     *  (strongest on the moon's side, fading toward the words); a sprite made once */
    ridgeGlow(T, I, w) {
      const k = S.portrait ? 0 : Math.max(env(T, ...w.glow[0], E.sine), env(T, ...w.glow[1], E.sine)) * I; if (k <= .01) return; // (on a phone the pack is out in the clearing, in the moonlight, and the ridge lies under the list)
      const { W, hz } = S; if (!S.rgS || S.rgS.width !== W || S.rgS.height !== hz + 4) { const x0 = w.mx - w.mr * 1.7, c = P.fog; S.rgS = paint(W, hz + 4, (x, y) => { const d = S.ridgeY(x) - y, a = (d >= 0 ? .24 * Math.exp(-d / 5) + .32 * Math.exp(-d / 15) : .5 * Math.exp(d / 2.5)) * Math.pow(clamp((x - x0) / (w.mr * 1.1)), 1.5); return a < .004 ? null : [c[0], c[1], c[2], Math.round(255 * a)]; }); }
      S.masked(v => { v.globalAlpha = k; v.drawImage(S.rgS, 0, 0); v.globalAlpha = 1; });
    },
    /** 1.12 b446: the crown (K.long 3: the sixth hour of the list left alone, and every sixth after): the day goes round. A
     *  whole day over the forest in fifteen seconds, as a time-lapse. The moon sets into the pines and the sky pales; dawn
     *  warms the sky at the left, where the sun comes up past the tall pine with a glint, and its light runs down the pines
     *  from their tops; birds dart out of the trees; the sun climbs over the words, its rays turning, and the forest is green
     *  under a blue day, clouds racing over it with their shadows sliding across the meadow, the pines' shadows wheeling
     *  round, geese crossing in a V; the light goes gold, the sun comes down the sky to the right into a long bank of cloud
     *  over the pines, lighting it from below, beams of light fanning up from behind it, the pines rimmed in fire; the sky
     *  burns down through red and violet to night, the stars come back, the moon rises out of the pines to its place, and the
     *  fireflies come out and settle. On a phone the moon stays, paling to a daytime moon. The day's versions of the land and
     *  the trees are made once, a part a frame in the first moments of the pass, and each frame mixes them by the hour.
     *  Composed; its clouds from dice of their own */
    crownPlan(n) {
      const { W, H, portrait: pr, moon: M } = S, r = deal(n, 71);
      const sun = pr ? [[-9, 62], [8, 46], [30, 33], [50, 29], [70, 34], [86, 46], [96, 60], [104, 74], [112, 88]] // (desktop: up past the left edge high over the words, over the top between the bar and the list, down under the cloud, into the tall pines and behind the hills on the right; on a phone away past the right edge)
        : [[-14, 46], [12, 34], [60, 25], [118, 20], [176, 23], [218, 30], [244, 40], [258, 52], [266, 68], [270, 88], [272, 116]];
      const clouds = (pr ? [[24, 1], [33, .8]] : [[19, 1], [31, .85], [24, .9]]).map(([y, k], i) => ({ y: y + Math.floor(r() * 4), k, t0: (pr ? 5.2 : 5.4) + i * (pr ? 1.9 : 1.45) + r() * .4, dur: pr ? 3.2 : 3.8, s: i })); // (none of them over the sun as it comes up)
      S.crownBuild();
      return { dealt: true, gust: { t: [5.4, 6.4, 7.0, 8.4], dir: 1, amp: 0 }, fph: 2.2, fog: [20, 21, 22, 23], wake: [11.9, 12.9], settle: [13.5, 14.6],
        crown: { sun, clouds, moon: pr ? null : [[M.x, M.y], [M.x + 12, M.y + 10], [M.x + 26, M.y + 26], [M.x + 36, M.y + 46], [M.x + 40, M.y + 58]] } };
    },
    /** the day's versions of everything that the day lights, made once a layout: the far hills and their pines, the ground,
     *  the haze; each pine in daylight, and the edges of it the low sun catches, gold from the left in the morning and fire
     *  from the right in the evening; the grass; the sun, its glow; clouds; the sky's column; buffers */
    crownBuild() {
      const { W, H, hz, portrait: pr, moon: M } = S; if (S.dayB && S.dayB.W === W && S.dayB.H === H) return S.dayB;
      const D = DAY, key = c => (c[0] << 16) | (c[1] << 8) | c[2], map = pairs => new Map(pairs.map(([a, b]) => [key(a), b]));
      const read = c => c.getContext("2d").getImageData(0, 0, c.width, c.height).data; // (each sprite read back once)
      const put = (w, h, fill) => { const [o, x] = canvas(w, h), im = x.createImageData(w, h); fill(im.data); x.putImageData(im, 0, 0); return o; };
      const recolor = (c, m, a = read(c)) => put(c.width, c.height, d => { for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const v = m.get((a[i] << 16) | (a[i + 1] << 8) | a[i + 2]) || [a[i], a[i + 1], a[i + 2]]; d[i] = v[0]; d[i + 1] = v[1]; d[i + 2] = v[2]; d[i + 3] = a[i + 3]; } });
      const edge = (c, a, dir, col) => { const w = c.width, h = c.height, on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 0;
        return put(w, h, d => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!on(x, y)) continue; const e1 = !on(x + dir, y), e2 = !e1 && !on(x + 2 * dir, y); if (!e1 && !e2) continue; const k = (y * w + x) * 4; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = e1 ? (on(x, y - 1) ? 200 : 255) : 70; } }); }; // the edge toward the sun, the outer pixel lit and the next one a little, the tips of the boughs brightest
      const mm = map([[P.mid, D.mid], [P.midHi, D.midHi], [P.midShade, D.midShade], [P.trunk, D.trunk]]), nm = map([[P.near, D.near], [P.nearHi, D.nearHi], [P.trunk, D.trunk]]);
      const trees = (list, m) => list.map(t => { const a = read(t.spr); return { x: t.x, base: t.base, d: recolor(t.spr, m, a), l: edge(t.spr, a, -1, D.dawn), r: edge(t.spr, a, 1, D.dusk) }; });
      const R = pr ? 6 : 8, disc = (r, core, rim) => paint(r * 2 + 3, r * 2 + 3, (x, y) => { const d = Math.hypot(x - r - 1, y - r - 1); return d > r + .3 ? null : d > r - 1.2 ? rim : core; });
      const cloud = (w, h, seed, c0, c1, c2, c3) => { const q = rng(seed), n = 6, puffs = Array.from({ length: n }, (_, i) => { const u = (i + .5) / n, big = Math.sin(Math.PI * u); return [w * (.08 + .84 * u) + (q() - .5) * 2, h * .72, h * (.2 + .42 * big + q() * .1)]; }), flat = Math.round(h * .8);
        const inside = (x, y) => { if (y > flat) return false; for (const [px, py, pr2] of puffs) if (Math.hypot((x - px) * .82, y - py) <= pr2) return true; return false; };
        return paint(w, h, (x, y) => { if (!inside(x, y)) return null; const top = !inside(x, y - 1), sh = !inside(x - 1, y - 1) && !top; if (y >= flat - 1) return c3; if (top || (y < flat * .45 && !inside(x, y - 2))) return c0; return y > flat * .62 ? c2 : sh ? c0 : c1; }); }; // heaped puffs on a flat base: the tops in the sun, the bodies, the shaded underside, the base line
      const cw = pr ? 30 : 46, ch = pr ? 11 : 15, bw = pr ? 72 : 132, bh = pr ? 12 : 14;
      const B = S.dayB = { W, H, R, mL: [layer(), layer(), layer()], nL: [layer(), layer(), layer()], gL: layer(), top: Math.min(...S.nears.concat(S.mids).map(t => t.base - t.h)), bankAt: pr ? [W - 54, 57] : [Math.round(W * .59), 39] };
      [B.colC, B.colX] = canvas(1, hz + 4); B.colI = B.colX.createImageData(1, hz + 4); [B.c, B.x] = canvas(W, H);
      if (!S.halo2) S.halo2 = glowSpr(Math.round(M.r * 2.2), P.moon, .22);
      // made in four parts, a frame apiece in the night before the day begins (crownStep), so that no one frame pays for all
      B.todo = [() => { // the land by day: the far hills, their haze, their pines, the meadow
        const [land, lx] = canvas(W, H);
        lx.drawImage(recolor(S.land.far, map([[P.ridge, D.ridge], [P.ridgeHi, D.ridgeHi]])), 0, 0);
        lx.drawImage(paint(W, 26, (x, y) => [D.haze[0], D.haze[1], D.haze[2], Math.round(255 * .42 * Math.exp(-Math.pow((y - 17) / 7, 2)))]), 0, hz - 20);
        lx.drawImage(recolor(S.land.farTrees, map([[P.farTree, D.farTree], [P.farHi, D.farHi]])), 0, 0);
        lx.drawImage(paint(W, H - hz, (x, y) => { const t = Math.pow(y / (H - hz), .7); return t < .5 ? mixc(D.groundHi, D.ground, t / .5) : mixc(D.ground, D.groundLo, (t - .5) / .5); }), 0, hz);
        lx.drawImage(paint(W, 18, (x, y) => [D.haze[0], D.haze[1], D.haze[2], Math.round(255 * .18 * Math.exp(-Math.pow((y - 5) / 6, 2)))]), 0, hz - 2);
        B.land = land; B.grass = S.grass.map(c => recolor(c, map([[P.grass, D.grass], [P.grassHi, D.grassHi]]))); },
      () => { B.mids = trees(S.mids, mm); }, () => { B.nears = trees(S.nears, nm); },
      () => Object.assign(B, { // the sun and its light, the clouds, the birds
        sun: disc(R, D.sun, D.sunRim), sunW: disc(R + 1, D.sunW, D.sunWRim), glow: glowSpr(Math.round(R * 3.6), D.sunGlow, .55), fire: glowSpr(Math.round(R * 7.5), D.fireGlow, .7), dawnG: glowSpr(pr ? 60 : 96, D.dawnGlow, .75),
        rays: Array.from({ length: 6 }, (_, ph) => { const L = Math.round(R * 3.4), n = 12; return paint(L * 2 + 1, L * 2 + 1, (x, y) => { const dx = x - L, dy = y - L, d = Math.hypot(dx, dy); if (d < R + 2 || d > L) return null; const a = Math.atan2(dy, dx) - ph / 6 * (Math.PI * 2 / n), k = Math.round(a / (Math.PI * 2 / n)), off = Math.abs(a - k * Math.PI * 2 / n) * d, len = (k & 1) ? L * .62 : L; if (off > .6 || d > len) return null; return [D.sunGlow[0], D.sunGlow[1], D.sunGlow[2], Math.round(255 * .5 * Math.pow(1 - (d - R - 2) / (len - R - 2), 1.3))]; }); }), // twelve rays, long and short by turns, in six steps of their turning
        burst: (() => { const L = Math.round(R * 4.2); return paint(L * 2 + 1, L * 2 + 1, (x, y) => { const dx = Math.abs(x - L), dy = Math.abs(y - L), d = Math.max(dx, dy), diag = dx === dy && d <= L * .55, axis = (dx === 0 || dy === 0) && d <= L; if (!diag && !axis) return null; return [255, 250, 226, Math.round(255 * Math.pow(1 - d / (L + 1), 1.2) * (axis ? 1 : .7))]; }); })(), // the glint as it clears the pines: a cross of light and its diagonals
        fan: (() => { const L = pr ? 80 : 120, a0 = -Math.PI * .97, a1 = -Math.PI * .28, n = 6; return paint(L * 2 + 1, L + 1, (x, y) => { const dx = x - L, dy = y - L, d = Math.hypot(dx, dy); if (d < 6 || d > L || dy > 0) return null; const a = Math.atan2(dy, dx); if (a < a0 || a > a1) return null; const f = (a - a0) / (a1 - a0) * n, w = Math.abs(f - Math.round(f)), k = Math.max(0, 1 - w / .2); return k <= 0 ? null : [D.fireGlow[0], D.fireGlow[1], D.fireGlow[2], Math.round(255 * .32 * k * Math.pow(1 - d / L, 1.1) * Math.min(1, d / 20))]; }); })(), // the evening's beams of light fanned up from behind the cloud
        clouds: [0, 1, 2].map(i => [cloud(cw + i * 6, ch + (i & 1) * 2, 900 + i, D.cloud, D.cloudMid, D.cloudSh, D.cloudLo), cloud(cw + i * 6, ch + (i & 1) * 2, 900 + i, D.cloudW, D.cloudWMid, D.cloudWSh, D.cloudWLo)]),
        cshade: paint(cw * 2, 9, (x, y) => { const q = Math.hypot((x - cw) / cw, (y - 4) / 4.5); return q >= 1 ? null : [0, 0, 0, Math.round(255 * Math.pow(1 - q, .7))]; }), // a cloud's shadow on the meadow
        bank: [cloud(bw, bh, 930, rgb("#7686A6"), rgb("#5C6C8C"), rgb("#4A5878"), rgb("#3A4664")), cloud(bw, bh, 930, rgb("#FFD890"), rgb("#F4885A"), rgb("#A84E6A"), rgb("#523866"))], // the long bank of cloud the sun sets into, over the pines
        goose: [sprite(["#...#", ".#.#.", "..#.."], { "#": D.goose }), sprite(["..#..", ".#.#.", "#...#"], { "#": D.goose }), sprite([".....", "#####", "..#.."], { "#": D.goose })],
        bird: [sprite(["#.#", ".#."], { "#": D.goose }), sprite(["...", "###"], { "#": D.goose })] })];
      return B;
    },
    /** the next part of the day's making: one a frame while it is still night, the rest at once if the day is wanted now */
    crownStep(T) { const B = S.dayB; if (!B || !B.todo.length) return; if (T < .7) B.todo.shift()(); else while (B.todo.length) B.todo.shift()(); },
    /** how much of the day's light is on the land and the trees at T (0 … 1) */
    dayAmb(T) { const [i, j, f] = keyf(T, AMBK); return lerp(AMBK[i][1], AMBK[j][1], f); },
    /** the moon's place, bare while the moon is away from it (on a desktop it sets into the pines and rises out of them) */
    crownUnmoon(T, I, c) { if (!c.moon || T <= DAYT.moonSet[0] || T >= DAYT.moonRise[1]) return; const M = S.moon, r = S.halo.width >> 1, x0 = Math.max(0, M.x - r), y0 = Math.max(0, M.y - r), x1 = Math.min(S.W, M.x + r + 1), y1 = Math.min(S.skyC.height, M.y + r + 1); g.globalAlpha = I; g.drawImage(S.skyC, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); g.globalAlpha = 1; },
    /** the sky at this hour, the land in its light, the sun and its glow behind the land; then the moon, clouds and birds */
    crownSky(T, I, A, c) {
      const { W, H, hz, portrait: pr, moon: M } = S, B = S.dayB, a = env(T, ...DAYT.sky, E.sine) * I; S.dayK = S.dayAmb(T) * I;
      if (a > .005) {
        const [i, j, f] = keyf(T, SKYK), cs = [0, 1, 2, 3].map(k => mixc(SKYK[i][1][k], SKYK[j][1][k], f)), d = B.colI.data; // the sky's colours now, a column of them stretched across
        const zen = cs[0].map(v => v * .4), zh = pr ? 30 : 34; // the zenith deeper, as a real sky's is, so that the bar's small words keep their dark ground all day
        for (let y = 0; y < hz + 4; y++) { const t = y / hz; let v = t < .55 ? mixc(cs[0], cs[1], t / .55) : t < .9 ? mixc(cs[1], cs[2], (t - .55) / .35) : mixc(cs[2], cs[3], clamp((t - .9) / .1)); if (y < zh) v = mixc(v, zen, .9 * Math.pow(1 - y / zh, 1.2)); const k = y * 4; d[k] = v[0]; d[k + 1] = v[1]; d[k + 2] = v[2]; d[k + 3] = 255; }
        B.colX.putImageData(B.colI, 0, 0);
        const x = B.x, [li, lj, lf] = keyf(T, LIGHTK), la = lerp(LIGHTK[li][2], LIGHTK[lj][2], lf);
        x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.clearRect(0, 0, W, H); x.drawImage(B.land, 0, 0);
        if (la > .004) { x.globalCompositeOperation = "source-atop"; x.globalAlpha = la; x.fillStyle = css(mixc(LIGHTK[li][1], LIGHTK[lj][1], lf)); x.fillRect(0, 0, W, H); } // the light on the land: dark before dawn, gold, clear, gold, dark and red, blue
        S.crownShadows(T, c, x);
        x.globalCompositeOperation = "destination-over"; // and behind the land: the sun, its glow, the dawn's glow, the sky
        const sp = S.crownSun(T, c); if (sp) { const [sx, sy, w] = sp, X = Math.round(sx), Y = Math.round(sy);
          x.globalAlpha = 1 - w; x.drawImage(B.sun, X - B.R - 1, Y - B.R - 1); x.globalAlpha = w; x.drawImage(B.sunW, X - B.R - 2, Y - B.R - 2);
          x.globalAlpha = .9 * (1 - w); x.drawImage(B.glow, X - (B.glow.width >> 1), Y - (B.glow.height >> 1)); x.globalAlpha = w; x.drawImage(B.fire, X - (B.fire.width >> 1), Y - (B.fire.height >> 1)); }
        const dg = env(T, ...DAYT.dawnGlow, E.sine); if (dg > .01) { x.globalAlpha = dg; x.drawImage(B.dawnG, c.sun[0][0] - (B.dawnG.width >> 1) + 6, c.sun[0][1] + 30 - (B.dawnG.height >> 1)); } // where the sun is coming up, the sky warming before it (low, clear of the bar)
        x.globalAlpha = 1; x.drawImage(B.colC, 0, 0, 1, hz + 4, 0, 0, W, hz + 4);
        x.globalCompositeOperation = "source-over";
      }
      if (a > .005) { g.globalAlpha = a; g.drawImage(B.c, 0, 0); g.globalAlpha = 1; } // (the day itself over the words, under the stage's own pad and washes, which keep them readable)
      const busy = S.crownSun(T, c) || (c.moon ? T > DAYT.moonSet[0] && T < DAYT.moonRise[1] : a > .005) || c.clouds.some(cl => T > cl.t0 && T < cl.t0 + cl.dur) || (T > DAYT.bank[0] && T < DAYT.bank[3]) || (T > DAYT.birds[0] && T < DAYT.birds[1]) || (T > DAYT.geese[0] && T < DAYT.geese[1]); if (!busy) return; // (nothing of its own to lay through the mask)
      S.masked(v => {
        // the moon: on a desktop down into the pines in the morning and up out of them in the evening; on a phone it stays,
        // paling in the day
        const sp = S.crownSun(T, c); if (sp) { const [sx, sy, w] = sp, X = Math.round(sx), Y = Math.round(sy); // the sun's light in the sky, kept back from the words (the bar's small ones above all)
          const ray = clamp(1 - w * 1.6) * env(T, 4.6, 5.6, 8.4, 9.3, E.sine) * I; if (ray > .01) { const rs = B.rays[Math.floor(T * 5) % 6]; v.globalAlpha = ray; v.drawImage(rs, X - (rs.width >> 1), Y - (rs.height >> 1)); } // its rays by day, turning
          const bu = env(T, ...DAYT.burst, E.sine) * I; if (bu > .01) { v.globalAlpha = bu; v.drawImage(B.burst, X - (B.burst.width >> 1), Y - (B.burst.height >> 1)); } // the glint as it clears the pines
          const fa = env(T, ...DAYT.fan, E.sine) * I; if (fa > .01) { v.globalAlpha = fa; v.drawImage(B.fan, X - (B.fan.width >> 1), Y - B.fan.height + 1); } } // the evening's beams, fanned up from behind the cloud
        if (c.moon) { const u = T < 7 ? seg(T, ...DAYT.moonSet, E.io) : 1 - seg(T, ...DAYT.moonRise, E.io); if (T > DAYT.moonSet[0] && T < DAYT.moonRise[1] && u < 1) { const [mx, my] = along(c.moon, u); S.crownMoon(v, mx, my, I); } } // (while it is set, nothing)
        else if (a > .005) S.crownMoon(v, M.x, M.y, a * (1 - .45 * S.dayK));
        // clouds racing over in the day, and fire-lit at evening; on a phone the bank the sun sets into
        const warm = env(T, ...DAYT.warm, E.sine);
        for (const cl of c.clouds) { const u = (T - cl.t0) / cl.dur; if (u <= 0 || u >= 1) continue; const [c0, c1] = B.clouds[cl.s % 3], X = Math.round(lerp(-c0.width - 2, W + 2, u)); v.globalAlpha = I * cl.k * (1 - warm); v.drawImage(c0, X, cl.y); if (warm > .01) { v.globalAlpha = I * cl.k * warm; v.drawImage(c1, X, cl.y); } }
        { const k = env(T, ...DAYT.bank, E.sine) * I; if (k > .01) { const X = B.bankAt[0] + Math.round(24 * (1 - seg(T, DAYT.bank[0], DAYT.bank[1] + .6, E.out))), Y = B.bankAt[1]; v.globalAlpha = k * (1 - warm); v.drawImage(B.bank[0], X, Y); v.globalAlpha = k * warm; v.drawImage(B.bank[1], X, Y); } } // (drifting in from the right as the afternoon goes)
        // the birds: a few dart out of the pines at dawn; geese cross in a V in the morning
        const ub = seg(T, ...DAYT.birds, x => x); if (!pr && ub > 0 && ub < 1) for (let k = 0; k < 3; k++) { const q = clamp(ub * 1.25 - k * .12); if (q <= 0 || q >= 1) continue; const bx = lerp(262 * W / 288 - k * 6, 150 * W / 288 - k * 22, q), by = lerp(62 - k * 4, -8 - k * 3, Math.pow(q, .8)) + Math.sin(q * 20 + k) * 1.5; v.globalAlpha = I; v.drawImage(B.bird[(Math.floor(T * 11) + k) & 1], Math.round(bx), Math.round(by)); } // (the birds: out of the pines and away up over the top)
        const ug = seg(T, ...DAYT.geese, x => x); if (ug > 0 && ug < 1) { const gy = pr ? 23 : 28, lead = lerp(-12, W + 40, ug); for (let k = 0; k < 7; k++) { const row = Math.ceil(k / 2), side = k % 2 ? -1 : 1, bx = lead - row * (pr ? 4 : 6), by = gy + side * row * (pr ? 2 : 3) + Math.sin(T * 3 + k) * .6; v.globalAlpha = I; v.drawImage(B.goose[(Math.floor(T * 6) + k) % 3], Math.round(bx), Math.round(by)); } }
        v.globalAlpha = 1;
      });
    },
    /** the shadows on the meadow (x: the day's buffer, the land in it): each middle pine's, long to the side away from the sun
     *  in the morning and the evening, short at noon, sweeping round with it; and the clouds' as they race over */
    crownShadows(T, c, x) {
      const k = env(T, ...DAYT.shadows, E.sine), sp = S.crownSun(T, c); if (k < .02 || !sp) return;
      const { W, hz } = S, u = (T - DAYT.sun[0]) / (DAYT.sun[1] - DAYT.sun[0]), len = .5 + 2.4 * Math.pow(Math.abs(u - .42) * 1.9, 1.6), sx = sp[0];
      x.globalCompositeOperation = "source-atop"; x.fillStyle = css(DAY.shadow); x.globalAlpha = .42 * k;
      for (const t of S.mids) { const bx = t.x, by = t.base - 1, w = t.spr.width * .42, dir = clamp((bx - sx) / (W * .35), -1, 1), tx = bx + dir * t.h * len, ty = by + t.h * (.1 + .12 * len);
        x.beginPath(); x.moveTo(bx - w, by); x.lineTo(bx + w, by); x.lineTo(tx, ty); x.closePath(); x.fill(); }
      const B = S.dayB; x.globalAlpha = .3 * k; // the clouds' shadows, sliding over the meadow under them
      for (const cl of c.clouds) { const q = (T - cl.t0) / cl.dur; if (q <= 0 || q >= 1) continue; const cw = B.clouds[cl.s % 3][0].width, X = lerp(-cw - 2, W + 2, q) + cw * .5 - (sx - W * .5) * .25; x.drawImage(B.cshade, Math.round(X - B.cshade.width / 2), Math.round(hz + 10 + cl.s * 7)); }
      x.globalAlpha = 1;
    },
    /** where the sun is at T, and how low and warm (0 … 1); null when it is not up */
    crownSun(T, c) { const u = (T - DAYT.sun[0]) / (DAYT.sun[1] - DAYT.sun[0]); if (u <= 0 || u >= 1) return null; const [x, y] = along(c.sun, u), o = S.sunO || (S.sunO = [0, 0, 0]); o[0] = x; o[1] = y; o[2] = clamp(Math.max(1 - u / .14, (u - .62) / .3)); return o; },
    /** the moon, as the backdrop has it, at x, y */
    crownMoon(v, x, y, k) { if (k <= .01) return; const M = S.moon, X = Math.round(x), Y = Math.round(y); v.globalAlpha = .75 * k; v.drawImage(S.halo, X - (S.halo.width >> 1), Y - (S.halo.height >> 1)); v.globalAlpha = k; v.drawImage(S.halo2, X - (S.halo2.width >> 1), Y - (S.halo2.height >> 1)); v.drawImage(S.moonSpr(M.r)[0], X - M.r, Y - M.r); v.globalAlpha = 1; },
    /** the pines by daylight (which: 0 the middle ones, 1 the near), laid over them by the hour: green in the day, the morning's
     *  gold running down their sunward edges from the tops, the evening's fire along the other edges */
    crownTrees(T, I, which, sway) {
      const B = S.dayB, a = S.dayAmb(T) * I, mo = env(T, ...DAYT.dawnLit, E.sine) * I, ev = env(T, ...DAYT.duskLit, E.sine) * I; if (a + mo + ev <= .01) return;
      const list = which ? B.nears : B.mids, Ls = which ? B.nL : B.mL, key = sway.map(v => Math.round(v * 4)).join(), W = S.W, H = S.H;
      const lay = (k, pick) => Ls[k](W, H, key, x => list.forEach((t, i) => S.tree(x, { x: t.x, base: t.base, spr: t[pick] }, sway[i])));
      const yl = Math.round(lerp(B.top - 2, H, seg(T, ...DAYT.creep, E.sine)));
      if (a > .01) { g.globalAlpha = a; g.drawImage(lay(0, "d"), 0, 0); g.globalAlpha = 1; }
      if (mo > .01 || ev > .01) S.masked(v => {
        if (mo > .01 && yl > 0) { const L = lay(1, "l"); v.globalAlpha = mo * .8; v.drawImage(L, 0, 0, W, yl, 0, 0, W, yl); const y2 = Math.min(H, yl + 3); if (y2 > yl) { v.globalAlpha = mo * .4; v.drawImage(L, 0, yl, W, y2 - yl, 0, yl, W, y2 - yl); } } // the morning's light, run down from the tops
        if (ev > .01) { v.globalAlpha = ev; v.drawImage(lay(2, "r"), 0, 0); }
        v.globalAlpha = 1;
      });
    },
    /** the grass by daylight */
    crownGrass(T, I, leans) { const B = S.dayB, a = S.dayAmb(T) * I; if (a <= .01) return; S.masked(v => { v.globalAlpha = a; v.drawImage(B.gL(S.W, 11, leans.join(), x => leans.forEach((l, i) => x.drawImage(B.grass[l + 1], i * 6, 0, 6, 11, i * 6, 0, 6, 11))), 0, S.H - 11); v.globalAlpha = 1; }); },
    /** where the moon is: 0 … 1 of the way from its place to the ridge, and its centre and radius there */
    moonAt(T, I, w) { const M = S.moon, q = env(T, ...w.moon, E.io) * I, o = S.mo || (S.mo = [0, 0, 0, 0]); o[0] = q; o[1] = lerp(M.x, w.mx, q); o[2] = lerp(M.y, w.my, q); o[3] = lerp(M.r, w.mr, Math.pow(q, 1.25)); return o; },
    /** its place in the sky, bare, once it has left it (the sky laid back over the moon and its halo in the backdrop) */
    unmoon(T, I, w) { if (S.moonAt(T, I, w)[0] <= 0) return; const M = S.moon, r = S.halo.width >> 1, x0 = Math.max(0, M.x - r), y0 = Math.max(0, M.y - r), x1 = Math.min(S.W, M.x + r + 1), y1 = Math.min(S.skyC.height, M.y + r + 1); g.drawImage(S.skyC, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); },
    /** the moon where it is now, with its halo, behind the ridge (a layer of its own, cut to the sky above the ridge) */
    bigMoon(T, I, w) {
      const [q, cx, cy, Rf] = S.moonAt(T, I, w); if (q <= 0) return;
      const { W, hz } = S, M = S.moon, R = Math.round(Rf), X = Math.round(cx), Y = Math.round(cy);
      if (!S.mL || S.mL.width !== W || S.mL.height !== hz + 4) { [S.mL, S.mLx] = canvas(W, hz + 4); S.skyMask = paint(W, hz + 4, (x, y) => y < S.ridgeY(x) ? [255, 255, 255] : null); S.halo2 = glowSpr(Math.round(M.r * 2.2), P.moon, .22); }
      const x = S.mLx, sz = (c, s) => { const n = Math.round(c.width * s) | 1; return [X - (n >> 1), Y - (n >> 1), n]; };
      x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.clearRect(0, 0, W, hz + 4); x.imageSmoothingEnabled = true;
      let [a, b, n] = sz(S.halo, Math.pow(R / M.r, .62)); x.globalAlpha = .75; x.drawImage(S.halo, a, b, n, n); // as the backdrop lays it: the halo, the glow round the disc, the disc
      [a, b, n] = sz(S.halo2, R / M.r); x.globalAlpha = 1; x.drawImage(S.halo2, a, b, n, n);
      if (q > .02) { [a, b, n] = sz(S.halo2, R / M.r * 1.5); x.globalAlpha = q * .6; x.drawImage(S.halo2, a, b, n, n); x.globalAlpha = 1; } // and close, brighter
      const [old, neu] = S.moonSpr(R), f = clamp((R - M.r) / (M.r * 1.3)); x.imageSmoothingEnabled = false; x.drawImage(old, X - R, Y - R); if (f > 0) { x.globalAlpha = f; x.drawImage(neu, X - R, Y - R); x.globalAlpha = 1; } // its face as the backdrop has it, and the near one fading in over it as it grows
      x.globalCompositeOperation = "destination-in"; x.drawImage(S.skyMask, 0, 0); x.globalCompositeOperation = "source-over";
      S.masked(v => v.drawImage(S.mL, 0, 0));
    },
    /** the moon at radius R, twice: its face as the backdrop has it (at its own size, the very same pixels), and its face
     *  close — the seas where they are on the real one, their shores worn, the bright craters, small ones scattered over the
     *  highlands, the limb dimmer */
    moonSpr(R) {
      const c = S.moonSprs || (S.moonSprs = new Map()); let s = c.get(R); if (s) return s;
      const n = S.moonN || (S.moonN = noise1(171, 64)), n2 = S.moonN2 || (S.moonN2 = noise1(173, 64)), hash = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
      const SEAS = [[-.3, -.34, .27, .23], [.12, -.37, .17, .15], [.28, -.08, .19, .16], [.64, -.2, .09, .12], [-.56, .05, .26, .4], [-.18, .3, .17, .13], [.47, .15, .12, .15], [.32, .33, .08, .08], [-.43, .38, .09, .08], [-.06, -.66, .32, .07]]; // Imbrium, Serenitatis, Tranquillitatis, Crisium, Procellarum, Nubium, Fecunditatis, Nectaris, Humorum, Frigoris
      const SPOTS = [[-.1, .63, .065], [-.25, -.06, .05], [-.47, -.03, .035], [-.62, -.22, .04]]; // Tycho, Copernicus, Kepler, Aristarchus
      const disc = fn => paint(R * 2 + 1, R * 2 + 1, (x, y) => { const dx = x - R, dy = y - R, d = Math.hypot(dx, dy); if (d > R + .25) return null; if (d > R - 1.1 && dx + dy < 0) return P.moonLo; return fn(x, y, dx / R, dy / R, d); });
      const old = disc((x, y, u, v) => (Math.hypot(u + .28, v + .12) < .3) || (Math.hypot(u - .05, v + .32) < .18) || (Math.hypot(u + .02, v - .38) < .16) ? P.moonMare : P.moon);
      const neu = disc((x, y, u, v, d) => {
        const wu = u + (fbm(n, v * 3.1 + 5, 2) - .5) * .16, wv = v + (fbm(n2, u * 3.3 + 9, 2) - .5) * .16; // the shores worn
        let m = 0; for (const [a, b, rx, ry] of SEAS) m = Math.max(m, 1 - ((wu - a) / rx) ** 2 - ((wv - b) / ry) ** 2);
        for (const [a, b, r] of SPOTS) { const e = Math.hypot(u - a, v - b) / r; if (e < 1) return e < .55 || R < 20 ? P.moonHi : P.moon; }
        if (m > .5) return P.moonDeep;
        if (m > .06) return P.moonMare;
        if (R > 16 && d > R - 1.6) return P.moonLo; // the limb
        if (R > 14) { if (hash(x, y) < .016) return P.moonLo; if (hash(x + 1, y + 1) < .016) return P.moonHi; } // small craters, lit on the upper side
        return P.moon;
      });
      s = [old, neu]; c.set(R, s); return s;
    },
    /** a wolf: a rig of round parts set down in whole pixels, k its size, drawn the first time each pose is wanted — trotting
     *  (ph, how far through its stride, in eighths) or standing (ph -1), its head lifted to howl (lift, in eighths), sat down
     *  (sit, in quarters) — facing right and a copy facing left, each with the moonlight along its upper edges */
    wolfSpr(k, ph, lift, sit = 0) {
      const key = k + "|" + ph + "|" + lift + "|" + sit, c = S.wolfC || (S.wolfC = new Map()); let f = c.get(key); if (f) return f;
      const SS = 4, w = Math.ceil(27 * k) + 3, h = Math.ceil(21 * k) + 2, ox = Math.ceil(12.5 * k) + 1, gy = h - 1, W2 = w * SS, H2 = h * SS, cov = new Uint8Array(W2 * H2);
      const cap = (ax, ay, ar, bx, by, br) => { ax *= k; ay *= k; ar *= k; bx *= k; by *= k; br *= k; const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6, X0 = Math.max(0, Math.floor((Math.min(ax - ar, bx - br) + ox) * SS) - 1), X1 = Math.min(W2, Math.ceil((Math.max(ax + ar, bx + br) + ox) * SS) + 1), Y0 = Math.max(0, Math.floor((gy - Math.max(ay + ar, by + br)) * SS) - 1), Y1 = Math.min(H2, Math.ceil((gy - Math.min(ay - ar, by - br)) * SS) + 1);
        for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) { const px = (X + .5) / SS - ox, py = gy - (Y + .5) / SS, t = clamp(((px - ax) * dx + (py - ay) * dy) / L2), rr = lerp(ar, br, t), qx = ax + dx * t - px, qy = ay + dy * t - py; if (qx * qx + qy * qy <= rr * rr) cov[Y * W2 + X] = 1; } };
      const ell = (cx, cy, rx, ry, rot = 0) => { cx *= k; cy *= k; rx *= k; ry *= k; const cs = Math.cos(rot), sn = Math.sin(rot), R = Math.max(rx, ry);
        for (let Y = Math.max(0, Math.floor((gy - cy - R) * SS) - 1); Y < Math.min(H2, Math.ceil((gy - cy + R) * SS) + 1); Y++) for (let X = Math.max(0, Math.floor((cx - R + ox) * SS) - 1); X < Math.min(W2, Math.ceil((cx + R + ox) * SS) + 1); X++) { const px = (X + .5) / SS - ox - cx, py = gy - (Y + .5) / SS - cy, u = px * cs + py * sn, v = -px * sn + py * cs; if ((u / rx) ** 2 + (v / ry) ** 2 <= 1) cov[Y * W2 + X] = 1; } };
      const L = lift, s = sit, trot = ph >= 0, sw = trot ? Math.sin(2 * Math.PI * ph) : 0, P2 = (a, b) => [lerp(a[0], b[0], s), lerp(a[1], b[1], s)];
      // the body: the rump, the back, the deep chest, the ruff over the shoulders; sitting, the hindquarters down on the ground
      const [rx0, ry0] = P2([-4.4, 8.5], [-2.9, 3.3]), [bx0, by0] = P2([-4.1, 8.9], [-2.6, 4.3]), [bx1, by1] = P2([3.6, 9.2], [3.8, 10.5]), [cx0, cy0] = P2([4.4, 7.9], [4.6, 8.5]), [wx0, wy0] = P2([4.5, 10.4], [4.4, 11.6]), [nx0, ny0] = P2([5.1, 10.0], [5.0, 11.3]);
      ell(rx0, ry0, 2.5, 2.3); cap(bx0, by0, 2.1, bx1, by1 + .3 * L, 2.4); ell(cx0, cy0 + .3 * L, 2.3, 3.0, -.2 - .15 * L); ell(wx0, wy0 + .4 * L, 2.2, 1.7, -.3 - .3 * L);
      if (s > 0) ell(-1.3, 2.4, 3.0 * s, 1.9 * s, .12); // the haunch, folded
      // the neck and the head: carried level as it trots, thrown back to howl, the jaw dropped open and the ears laid back
      const a = lerp(-.2, 1.25, L), hx = lerp(8.5, 6.9, L) - .3 * s, hy = lerp(11.2, 16.2, L) + 1.2 * s, ca = Math.cos(a), sa = Math.sin(a);
      cap(nx0, ny0 + .3 * L, 2.1, hx, hy, 1.45); ell(hx, hy, 1.9, 1.6, a);
      cap(hx + ca * .9, hy + sa * .9, 1.1, hx + ca * 4.1, hy + sa * 4.1, .45);
      if (L > 0) { const jb = a - .55 * L; cap(hx + ca * .8 + sa * .5, hy + sa * .8 - ca * .5, .65, hx + Math.cos(jb) * 3.1 + sa * .4, hy + Math.sin(jb) * 3.1 - ca * .4, .3); }
      for (const [ex0, ey0, ea, el] of [[-.4, 1.2, 1.65, 2.2], [-1.15, 1.0, 1.9, 1.8]]) { const ex = hx + ex0 * ca - ey0 * sa, ey = hy + ex0 * sa + ey0 * ca, e = a + ea + .6 * L; cap(ex, ey, .75, ex + Math.cos(e) * el, ey + Math.sin(e) * el, .15); }
      cap(cx0 + 1.2, cy0 + .8, .8, cx0 + 2.2, cy0 - .9 + .2 * L, .3); cap(cx0 + 1.9, cy0 + 1.7, .7, cx0 + 3.2, cy0 + .5 + .3 * L, .25); // the ruff under the throat
      // the tail: low and bushy, swinging a little with the trot; sitting, laid along the ground
      const T1 = P2([-5.8, 9.2], [-4.6, 3.4]), T2 = P2([-7.3, 7.6 + sw * .35], [-7.0, 1.6]), T3 = P2([-8.1, 5.0 + sw * .5], [-9.2, 1.0]), T4 = P2([-8.2, 3.3 + sw * .6], [-10.4, 1.5]);
      cap(T1[0], T1[1], .75, T2[0], T2[1], 1.25); cap(T2[0], T2[1], 1.25, T3[0], T3[1], 1.05); cap(T3[0], T3[1], 1.05, T4[0], T4[1], .4);
      // the legs, across the body in pairs as it trots: each foot planted and sliding back under it, then lifted and swung
      // through; the front ones fold at the wrist, the hind ones at the hock (and, sitting, all the way)
      const St = 5, foot = (q, up) => { q = ((q % 1) + 1) % 1; if (q < .5) return [St / 2 - St * q / .5, 0]; const u = (q - .5) / .5, e = u * u * (3 - 2 * u); return [-St / 2 + St * e, Math.sin(Math.PI * Math.pow(u, .75)) * up]; };
      const leg = (jx, jy, up, lo, rx, q, fwd, r1, r2, r3) => { const [fx, fl] = trot ? foot(q, fwd ? 1.9 : 1.6) : [0, 0], Fx = rx + fx, Fy = .45 + fl, dx = Fx - jx, dy = Fy - jy, d = Math.max(.5, Math.min(up + lo - .05, Math.hypot(dx, dy))), a0 = Math.atan2(dy, dx), b = Math.acos(clamp((up * up + d * d - lo * lo) / (2 * up * d), -1, 1)), kb = fwd ? a0 + b : a0 - b, kx = jx + Math.cos(kb) * up, ky = jy + Math.sin(kb) * up;
        cap(jx, jy, r1, kx, ky, r2); cap(kx, ky, r2 * .8, Fx, Fy, r3); ell(Fx + (fwd ? .3 : .2), Fy - .05, .8, .42); };
      const [fj, fjy] = P2([4.3, 7.0], [4.4, 7.4]), [hj, hjy] = P2([-3.9, 7.3], [-2.2, 3.4]);
      leg(fj, fjy, 3.4, 3.3, lerp(4.5, 4.9, s), ph, true, .9, .65, .42); leg(fj, fjy, 3.4, 3.3, lerp(5.8, 5.9, s), ph + .5, true, .9, .65, .42);
      leg(hj, hjy, 3.9, 3.3, lerp(-4.8, .6, s), ph + .5, false, 1.55, .7, .4); leg(hj, hjy, 3.9, 3.3, lerp(-3.5, 1.5, s), ph, false, 1.55, .7, .4);
      const on = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let m = 0; for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) m += cov[(y * SS + j) * W2 + x * SS + i]; if (m >= 7) on[y * w + x] = 1; }
      const at = (x, y, fl) => x >= 0 && y >= 0 && x < w && y < h && on[y * w + (fl ? w - 1 - x : x)], rim = fl => paint(w, h, (x, y) => { if (!at(x, y, fl)) return null; const t1 = !at(x, y - 1, fl), t2 = !t1 && !at(x, y - 2, fl), r1 = !at(x + 1, y, fl) || !at(x + 1, y - 1, fl); return t1 ? P.moon : t2 ? P.moonLo : r1 ? P.wolfRim : null; }); // the moon is up and to the right of the ridge: two pixels of its own light along the backs and heads, and a third down the side toward it
      const spr = paint(w, h, (x, y) => on[y * w + x] ? P.wolf : null), dep = new Uint8Array(w * h); for (let x = 0; x < w; x++) for (let y = 0, d = 0; y < h; y++) { d = on[y * w + x] ? d + 1 : 0; dep[y * w + x] = d; }
      const LIT = [null, P.coatH, P.coatH, P.coatL, P.coatL, P.coatL, P.coat], lit = paint(w, h, (x, y) => { const d = dep[y * w + x]; return d ? (y + 1 < h && !on[(y + 1) * w + x] && d > 3 ? P.coat : LIT[Math.min(6, d)]) : null; }); // out in the clearing, lit from above: the moon along its back, its coat, its underside in shadow
      const ex = hx + ca * 1.1 + sa * .4, ey = hy + sa * 1.1 - ca * .4, eX = Math.round(ox + ex * k - .5), eY = Math.round(gy - ey * k - .5); // the eye, forward of the middle of the head, under the moonlit edge
      f = { c: spr, l: flip(spr), rc: rim(0), rl: rim(1), lc: lit, ll: flip(lit), w, h, ox, gy, eye: [eX, eY] }; c.set(key, f); return f;
    },
    /** the pack: out along the ridge from behind the pine, a stand among the spires to howl, and back the way they came; dark
     *  shapes with the moonlight along their backs, black against the moon when it has come */
    packAt(T, I, w, q) {
      for (const p of w.pack) {
        if (T <= p.t[0] || T >= p.t[3]) continue;
        let x, ph = -1, dir = -1, lift = 0, sit = 0;
        if (T < p.t[1]) { const d = (w.x0 - p.x1) * seg(T, p.t[0], p.t[1], u => 1 - Math.pow(1 - u, 1.6)); x = w.x0 - d; ph = d / (10 * p.k); }
        else if (T < p.t[2]) { x = p.x1; for (const hw of p.howl) lift = Math.max(lift, env(T, ...hw, E.sine)); lift = Math.max(lift, .375 * env(T, p.t[1], p.t[1] + .35, p.t[1] + 1.0, p.t[1] + 1.45, E.sine)); if (p.sit) sit = env(T, ...p.sit, E.sine); } // (as each arrives it lifts its head to the moon)
        else { const d = (w.x0 - p.x1) * seg(T, p.t[2], p.t[3], u => Math.pow(u, 1.6)); x = p.x1 + d; ph = d / (10 * p.k); dir = 1; }
        const f = S.wolfSpr(p.k, ph < 0 ? -1 : Math.floor((ph % 1) * 8) / 8, Math.round(lift * 8) / 8, Math.round(sit * 4) / 4), X = Math.round(x), y = p.y || S.ridgeY(X), dx = dir > 0 ? X - f.ox : X - (f.w - 1 - f.ox), dy = y - f.gy;
        g.globalAlpha = I; if (S.portrait) g.drawImage(dir > 0 ? f.lc : f.ll, dx, dy); // (on a phone, out in the clearing, in the moonlight)
        else { g.drawImage(dir > 0 ? f.c : f.l, dx, dy); const rk = 1 - q; if (rk > .02) { g.globalAlpha = I * rk; g.drawImage(dir > 0 ? f.rc : f.rl, dx, dy); } } // the moonlight along their backs, gone when the moon is behind them
        const gl = (T < p.t[2] ? env(T, p.t[1] + .15, p.t[1] + .45, p.t[1] + 1.0, p.t[1] + 1.5, E.sine) : 0) * (1 - q) * I; // the eyes catch the moon as they look up at it
        if (gl > .02) { const ex = dx + (dir > 0 ? f.eye[0] : f.w - 1 - f.eye[0]), ey = dy + f.eye[1], es = S.eyeShine || (S.eyeShine = glowSpr(4, P.wolfEye, .75)); g.globalAlpha = gl; g.drawImage(es, ex - 4, ey - 4); g.fillStyle = css(P.wolfEye); g.fillRect(ex, ey, 1, 1); } // (eyeshine: the moon caught at the back of the eye)
        g.globalAlpha = 1;
      }
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; N: the pass (0, the signature) */
    draw(T, I, A, F, N = 0) {
      const { W, H, hz, moon: M } = S;
      if (N !== S.planP) { const h = N > 0 ? K.long(N) : 0; S.pl = N > 0 ? (h === 1 ? S.wolfPlan(N) : h === 2 ? S.ufoPlan(N) : h === 3 ? S.crownPlan(N) : K.egg(N) ? S.eggPlan(N) : S.dealPass(N)) : S.sig(); S.planP = N; }
      const pl = S.pl;
      g.drawImage(S.bg, 0, 0);
      if (pl.wolves && I > .01) S.unmoon(T, I, pl.wolves); // the first hour egg: the moon's place in the sky, when it has left it
      const dayA = pl.crown ? env(T, ...DAYT.sky, E.sine) * I : 0; S.dayK = 0; // the crown: how much of the sky is the day's
      if (pl.crown) S.crownStep(T); // (the day's making, a part a frame)
      if (pl.crown && I > .01) S.crownUnmoon(T, I, pl.crown);
      // a colour string is parsed each time it is set, so two fixed ones and the twinkle in globalAlpha
      const cS = css(P.star), cH = css(P.starHi);
      if (dayA < .995) for (const s of S.stars) { const tw = .55 + .45 * Math.sin(A * s.f + s.ph), a = s.b * tw; g.fillStyle = a > .78 ? cH : cS; g.globalAlpha = dayA ? clamp(a) * (1 - dayA) : clamp(a); g.fillRect(s.x, s.y, 1, 1); if (s.big && tw > .9) { g.fillStyle = cS; g.globalAlpha = dayA ? .3 * (1 - dayA) : .3; g.fillRect(s.x - 1, s.y, 3, 1); g.fillRect(s.x, s.y - 1, 1, 3); } } // (the crown's day puts them out)
      g.globalAlpha = 1;
      if (pl.wolves && I > .01) S.bigMoon(T, I, pl.wolves); // the first hour egg: the moon, come down to the ridge
      if (pl.crown && I > .01) S.crownSky(T, I, A, pl.crown); // the crown: the day's sky, its sun and moon, its clouds and birds, the land in its light
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
      if (pl.crown && I > .01) S.crownTrees(T, I, 0, mSway); // (the crown: by daylight)
      if (pl.wolves && I > .01) { S.ridgeGlow(T, I, pl.wolves); S.masked(() => S.packAt(T, I, pl.wolves, S.moonAt(T, I, pl.wolves)[0])); } // and the pack on the ridge, among the spires, against the moonlit mist
      if (dm) { S.fog(S.fogBands[1], hz - 1, o1, .25); if (fogE > 0) S.masked(x => S.fog(S.fogBands[1], hz - 1, o1, fogE * .5, x)); } else S.fog(S.fogBands[1], hz - 1, o1, .25 + fogE * .5);
      const bank = pl.bank ? env(T, ...pl.bank, E.sine) * I : 0;
      if (bank > 0) S.masked(x => S.fog(S.bankBands[0], hz - 4, A * 2.2 + T * 5 * I, bank, x));
      if (bank > 0 && pl.egg) S.masked(x => S.fog(S.bankBands[1], hz - (S.portrait ? 15 : 19), -A * 1.3 - T * 3 * I, bank * .85, x)); // the egg: the fog banked high behind the one who crosses it
      if (I > .01 && (pl.fox || pl.rabbits || pl.stag || pl.egg)) S.masked(() => { if (pl.fox) S.foxAt(T, I, pl.fox); if (pl.rabbits) S.rabbitsAt(T, I, pl.rabbits); if (pl.stag) S.stagAt(T, I, pl.stag); if (pl.egg) S.walkerAt(T, I, pl.egg); }); // the clearing's new animals keep back from the words
      const fb = pl.egg ? .35 : 1; // (thinner in front of it)
      if (bank > 0) S.masked(x => { S.fog(S.bankBands[1], hz + 9, -A * 1.7 - T * 4 * I, bank * .9 * fb, x); S.fog(S.fogBands[1], hz + 24, A * 1.2 + T * 3 * I, bank * .5 * fb, x); });
      if (shaftE > 0) { const sw = S.shaft.width, lay = x => { for (let k = 0; k < 3; k++) { x.globalAlpha = pl.shaftK ? clamp(shaftE * [1, .7, .5][k] * pl.shaftK) : shaftE * [1, .7, .5][k]; x.drawImage(N > 0 ? S.shaftSoft : S.shaft, Math.round(M.x - sw * .62 - k * W * (S.portrait ? .17 : .1) + Math.sin(T * .7 + k) * 1.5), Math.round(M.y)); } x.globalAlpha = 1; }; if (N > 0) S.masked(lay); else lay(g); }
      if (pl.egg && I > .01) S.masked(x => S.beamAt(T, I, pl.egg, x, 1)); // the egg's shaft of moonlight, the air in front of the walker
      if (pl.ufo && I > .01) S.masked(() => S.ufoAt(T, I, A, pl.ufo)); // the second hour egg: the saucer over the clearing
      const nSway = S.nears.map(t => gust(t.x) * 2.2);
      if (pl.owl && I > .01) S.owlAt(T, I, pl.owl, 0, nSway);
      const rus = pl.egg && I > .01 ? S.rustle(T, I, pl.egg) : null; // the egg: the boughs it pushes through
      g.drawImage(nearsLayer(W, H, nSway.map(q).join() + (rus ? "|" + rus.join() : ""), x => S.nears.forEach((t, i) => S.tree(x, t, nSway[i], rus && rus[i] ? [rus[i] / 4, Math.floor(T * 15)] : null))), 0, 0);
      if (pl.owl && I > .01) S.owlAt(T, I, pl.owl, 1, nSway);
      if (pl.crown && I > .01) S.crownTrees(T, I, 1, nSway);
      if (pl.ufo && I > .01) S.masked(() => S.ufoNear(T, I, pl.ufo)); // the second hour egg: the near pines in its beam's light
      const leans = []; for (let x = 0; x < W + 8; x += 6) leans.push(Math.round(clamp(gust(x) * 1.7 - .35, -1, 1)));
      g.drawImage(grassLayer(W, 11, leans.join(), x => leans.forEach((l, i) => x.drawImage(S.grass[l + 1], i * 6, 0, 6, 11, i * 6, 0, 6, 11))), 0, H - 11);
      if (pl.crown && I > .01) S.crownGrass(T, I, leans);
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
    tree(x2, t, sway, sh) { const s = t.spr, h = s.height, w = s.width, x0 = t.x - (w >> 1), y0 = t.base - h; for (let y = 0; y < h; y += 3) { const dx = Math.round(sway * Math.pow(1 - y / h, 1.6) + (sh ? sh[0] * clamp((y / h - .4) / .25) * Math.sin(sh[1] * 2.3 + y * 1.9) : 0)), hh = Math.min(3, h - y); x2.drawImage(s, 0, y, w, hh, x0 + dx, y0 + y, w, hh); } }, // (sh, the egg's: the lower boughs shaken, as by something pushing through them)
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
        if (pl.egg) { const s = S.scatter(T, x, y, pl.egg); x += s[0]; y += s[1]; b = Math.max(b, s[2] * up); } // the egg: they scatter from it, startled bright
        if (pl.hush) b *= 1 - .92 * env(T, ...pl.hush, E.sine); // the first hour egg: they go quiet while the pack howls
        if (pl.ufo) { const r = S.ringAt(T, i, n, pl.ufo, x, y, b); x = r[0]; y = r[1]; b = r[2]; } // the second: they dance round under the saucer
        if (f.amb) glow(f.hx + Math.sin(A * .4 + f.ph) * 4, f.hy - 2 + Math.sin(A * .3 + f.ph) * 2, Math.pow(Math.max(0, Math.sin(A * (.8 + f.m * .06) + f.ph)), 10) * .75 * (1 - I * up) * (pl.crown ? 1 - S.dayK : 1)); // (none by day: the crown's)
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
