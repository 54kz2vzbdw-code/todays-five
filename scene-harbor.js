// scene-harbor.js — 1.12 b318: Harbor's scene (scenes.js loads it). Morning, in pixels: the sun over a quiet sea, clouds,
// a headland with its lighthouse, a pier and a moored boat, a sail far out. The idle loop, fifteen seconds: a run of
// light down the sun's path; a pair of gulls, one banking; the lighthouse flashes twice; a wave set rolls toward shore;
// a fish jumps by the boat; then it settles. The finale: the gulls lift off the pier. What does not move is drawn once.
//
// 1.12 b378: the forever cycle. That loop is the first pass; each pass after it deals a morning of its own from a pool
// about three times what one pass plays. A boat crosses the bay: a sailboat that comes in, goes about with its sails
// flapping across and heads back out; a steamer trailing its smoke; a tall ship under all her sail (on a phone those
// two keep to the horizon, out from behind the headland; on a desktop, whose horizon sits behind the list, they cross
// the open bay below it); a fishing boat chugging across with gulls wheeling over its stern. Something in the water: a
// fish jumping, wherever it likes, or two; a pod of dolphins arcing past; a seal who puts his head up by the pier,
// looks about and goes down, and comes up again a little way off. Overhead, one to three gulls from either side; the
// lighthouse flashes once, twice or three times; the wave set comes when it will; the light runs down the sun's path or
// up it; and some mornings a cloud builds over the sun, the glitter goes out under it, and when it thins the sun breaks
// out and the light runs down the water again. The rare ones, each about once in eight passes: a whale in the bay,
// which has it to itself, its spout, its back rolling over, a second spout, its flukes lifting with the water running
// off and sliding under; a seaplane dropping in to land with a V of spray and taxiing away; the tall ship. Every pass
// opens and closes on the same resting picture.
//
// 1.12 b379: under a long list. Harbor's sea lies under the list, and a long list's last lines (the struck ones, the
// small print that rides in a line) sit over it: darker than the kit's ground, it cost them their contrast even with the
// scene still. Under each line the morning lies in a haze of its own, a touch paler than the ground (the stage's washes
// can only bring it to the ground), fuller over the sea than over the sky, which is pale already; elsewhere the picture
// keeps its colour. It is one layer at the picture's own pixels, laid over everything and redrawn only when the words move.
export default function harbor(K) {
  const { clamp, lerp, E, seg, env, rng, rgb, mixc, css, canvas, paint, noise1, fbm, glowSpr, sprite, deal, bag } = K;
  let g = null;
  const P = {
    skyTop: rgb("#D8ECE8"), skyLow: rgb("#F3F9F7"), sun: rgb("#FFF9EC"), sunGlow: rgb("#FFEFC9"),
    cloud: rgb("#FAFDFC"), cloudLo: rgb("#E1EEEB"), hill: rgb("#CFE3DF"), hillHi: rgb("#DCECE8"),
    rock: rgb("#B6D0CB"), rockLo: rgb("#A5C4BE"), rockHi: rgb("#CBE0DB"), grass: rgb("#BFD9C9"),
    house: rgb("#F5FAF9"), houseLo: rgb("#DDEBE8"), band: rgb("#9CCBC6"), dome: rgb("#7FA8A4"), lamp: rgb("#FFE3A0"), lampHi: rgb("#FFFFFF"),
    sea: [rgb("#D3E8E4"), rgb("#C4DFDB"), rgb("#B6D6D1")], crest: rgb("#EDF7F5"), crestLo: rgb("#DAEDEA"), glint: rgb("#FFFFFF"), foam: rgb("#F6FBFA"),
    hull: rgb("#8FB8B4"), hullHi: rgb("#B2D1CD"), sail: rgb("#F9FCFB"), sailLo: rgb("#D7E8E5"), mast: rgb("#8FB2AE"), pier: rgb("#9DC0BB"), pierHi: rgb("#C0DAD6"),
    gull: rgb("#5F8C88"), fish: rgb("#7FAAA5"), haze: rgb("#FAFDFC"),
    hullD: rgb("#7FA8A4"), whale: rgb("#57827E"), whaleHi: rgb("#86AEA9"), spout: rgb("#FFFFFF"), spoutLo: rgb("#BFD9D5"), shade: rgb("#D3E6E2"), window: rgb("#8FB8B4"), funnel: rgb("#6F9A96"), smoke: rgb("#EDF4F2"), dol: rgb("#5F8C88"), dolHi: rgb("#9CC0BC"),
  };
  const flip = c => { const [o, x] = canvas(c.width, c.height); x.setTransform(-1, 0, 0, 1, c.width, 0); x.drawImage(c, 0, 0); return o; };
  const S = {
    wash: 1.6, // a light kit: the top band and the footer's pool come nearly to the ink under its small words (scenes.js)
    veil: 1,   // and on Everything, a page of them, the plain ground
    bind(ctx) { g = ctx; },
    /** where the words are (CSS px). On a light kit a dark thing behind a word costs it; in the passes after the first, the
     *  boats and creatures new to the bay keep back from the words: a mask at the picture's own pixels, down to a trace
     *  behind a word and whole a few pixels clear of it */
    words(rects) { S.raw = rects; S.maskWords(); S.hazeWords(); },
    maskWords() {
      const { W, H } = S; if (!W) return;
      const rs = S.raw || [], px = Math.round(innerWidth / W) || 1, R = 2, F = 4, LO = 0; // on a light kit, not even a trace of a dark thing behind a word
      if (S.wmW !== W || S.wmH !== H) { S.wm = new Float32Array(W * H); [S.wmC, S.wmX] = canvas(W, H); S.wmImg = S.wmX.createImageData(W, H); [S.ml, S.mlx] = canvas(W, H); S.wmW = W; S.wmH = H; }
      const m = S.wm; m.fill(1);
      for (const [x0, y0, x1, y1] of rs) { const a0 = x0 / px, b0 = y0 / px, a1 = x1 / px, b1 = y1 / px;
        for (let y = Math.max(0, Math.floor(b0 - R - F)); y <= Math.min(H - 1, Math.ceil(b1 + R + F)); y++) for (let x = Math.max(0, Math.floor(a0 - R - F)); x <= Math.min(W - 1, Math.ceil(a1 + R + F)); x++) {
          const d = Math.hypot(Math.max(a0 - x - .5, 0, x + .5 - a1), Math.max(b0 - y - .5, 0, y + .5 - b1)), v = LO + (1 - LO) * clamp((d - R) / F), i = y * W + x; if (v < m[i]) m[i] = v; } }
      const d = S.wmImg.data; for (let i = 0; i < m.length; i++) { const k = i * 4; d[k] = d[k + 1] = d[k + 2] = 255; d[k + 3] = Math.round(255 * m[i]); }
      S.wmX.putImageData(S.wmImg, 0, 0); S.wmOn = rs.length > 0;
    },
    /** the haze under the lines: the kit's morning, paler than its ground, fuller over the sea than the sky */
    hazeWords() {
      const { W, H, hz } = S; if (!W) return;
      const rs = (S.raw || []).filter(r => r[4] === 1), px = Math.round(innerWidth / W) || 1, R = 1.5, F = 6, c = P.haze;
      if (S.hzW !== W || S.hzH !== H) { [S.hzC, S.hzX] = canvas(W, H); S.hzImg = S.hzX.createImageData(W, H); S.hzA = new Float32Array(W * H); S.hzW = W; S.hzH = H; }
      const a = S.hzA; a.fill(0);
      for (const [x0, y0, x1, y1] of rs) { const a0 = x0 / px, b0 = y0 / px, a1 = x1 / px, b1 = y1 / px;
        for (let y = Math.max(0, Math.floor(b0 - R - F)); y <= Math.min(H - 1, Math.ceil(b1 + R + F)); y++) { const k = lerp(.6, .86, clamp((y - hz + 8) / 14));
          for (let x = Math.max(0, Math.floor(a0 - R - F)); x <= Math.min(W - 1, Math.ceil(a1 + R + F)); x++) {
            const d = Math.hypot(Math.max(a0 - x - .5, 0, x + .5 - a1), Math.max(b0 - y - .5, 0, y + .5 - b1)), f = clamp(1 - (d - R) / F), v = k * f * f * (3 - 2 * f), i = y * W + x; if (v > a[i]) a[i] = v; } } } // an eased edge, so it thins away rather than stopping
      const d = S.hzImg.data; for (let i = 0; i < a.length; i++) { const j = i * 4; d[j] = c[0]; d[j + 1] = c[1]; d[j + 2] = c[2]; d[j + 3] = Math.round(255 * a[i]); }
      S.hzX.putImageData(S.hzImg, 0, 0); S.hzOn = rs.length > 0;
    },
    /** drawn through the mask: `draw` paints a layer, the layer is cut back where the words are and laid on the picture */
    masked(draw) { if (!S.wmOn) { draw(g); return; } const x = S.mlx, keep = g; x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; x.clearRect(0, 0, S.W, S.H); g = x; try { draw(x); } finally { g = keep; } x.globalAlpha = 1; x.globalCompositeOperation = "destination-in"; x.drawImage(S.wmC, 0, 0); x.globalCompositeOperation = "source-over"; g.drawImage(S.ml, 0, 0); }, // (while it paints, the layer is the picture: a beat's own drawing goes there)
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
      S.cast(W, H, portrait); S.planP = -1; S.maskWords(); S.hazeWords();
    },
    /** the forever cycle's boats and creatures, drawn once, from dice of their own (the signature's are left as they were) */
    cast(W, H, pr) {
      const C = { H: P.hullD, h: P.hullHi, s: P.sail, S: P.shade, m: P.mast, w: P.house, g: P.window, f: P.funnel, d: P.dol, l: P.dolHi, p: P.funnel, D: P.whale, L: P.whaleHi, F: P.gull }, sp = rows => sprite(rows, C), two = c => [c, flip(c)]; // heading left, heading right
      S.sb = { go: two(sp(["......m......", "......mS.....", "......mSs....", ".....SmSss...", "....SSmSsss..", "...SSSmSssss.", "..SSSSmSsssss", ".SSSSSmSsssss", "......mmmmmm.", "hhhhhhhhhhhhh", ".HHHHHHHHHHH.", "..HHHHHHHHH.."])),
        luff: two(sp(["......m......", "......m......", "......ms.....", "......ms.....", ".....Sms.....", ".....Sms.....", "....SSms.....", "....SSms.....", "......m......", "hhhhhhhhhhhhh", ".HHHHHHHHHHH.", "..HHHHHHHHH.."])) };
      S.steamer = two(sp(pr ? [".....f....", ".....w....", "..wwwfww..", ".wgwgwgwg.", "HHHHHHHHHH", ".HHHHHHHH."] : ["..........ff............", "..........ww............", "..........ff............", "...m......ff.......m....", "...m....wwffww.....m....", "..wwwwwwwwwwwwwwwwwww...", ".wgwgwgwgwgwgwgwgwgwgw..", "hhhhhhhhhhhhhhhhhhhhhhhh", ".HHHHHHHHHHHHHHHHHHHHHH.", "..HHHHHHHHHHHHHHHHHHHH.."]));
      S.trawler = two(sp(["..........m.....", ".........mmm....", "..........m.....", "....m.....m.....", "...www....m.....", "..wgwgw...m.....", "..wwwww..mmm....", "hhhhhhhhhhhhhhhh", ".HHHHHHHHHHHHHH.", "..HHHHHHHHHHHH.."]));
      const pb = ["...................f", "..mmmmmmmmmmmm....ff", "...wwwgwgwgwwwwwwwwf", "..wwwwwwwwwwwwwwwww.", ".....m......m.......", "...FFFFFFFFFFFF....."], pl0 = sp(["p" + pb[0].slice(1), pb[1], pb[2], "p" + pb[3].slice(1), pb[4], pb[5]]), pl1 = sp([pb[0], pb[1], "p" + pb[2].slice(1), pb[3], "p" + pb[4].slice(1), pb[5]]);
      S.plane = [two(pl0), two(pl1)];
      S.ship = two(sp(pr ? ["....m....m.....m...", "...sss..sss...sss..", "..sssss.sssss.sssss", "....m....m.....m...", "..sssss.sssss.sssss", "sssssssssssssssssss", "hhhhhhhhhhhhhhhhhhh", ".HHgHHgHHgHHgHHgHH.", "..HHHHHHHHHHHHHHH.."]
        : ["......m......m.......m....", ".....sss....sss.....sss...", "....sssss..sssss...sssss..", "......m......m.......m....", "....sssss..sssss...sssss..", "...sssssss.sssssss.sssssss", "......m......m.......m....", "...sssssss.sssssss.sssssss", "..sssssssssssssssssssssss.", "......m......m.......m....", "hhhhhhhhhhhhhhhhhhhhhhhhhh", ".HHgHHgHHgHHgHHgHHgHHgHH..", "..HHHHHHHHHHHHHHHHHHHHH..."]));
      S.dolphin = [two(sp([".......dd", ".....ddd.", "..dddll..", "ddd......"])), two(sp(["....d....", ".dddddddd", "dddlllll."])), two(sp(["dd.......", ".ddd.....", "..llddd..", "......ddd"]))]; // rising, over the top, going under
      S.whale = pr ? { back: sp(["........D.......", ".......DD.......", "...LLLLLLLLLL....", ".LDDDDDDDDDDDDL..", "DDDDDDDDDDDDDDDDD"]), flukes: sp(["LL.......LL", "DDD.....DDD", ".DDD...DDD.", "..DDD.DDD..", "....DDD....", "....DDD....", "....DDD....", "...DDDDD..."]) }
        : { back: sp(["...........D............", "..........DDD...........", "......LLLLLLLLLLLL......", "...LLDDDDDDDDDDDDDDLL...", ".LDDDDDDDDDDDDDDDDDDDDL.", "DDDDDDDDDDDDDDDDDDDDDDDD"]), flukes: sp(["LLL.........LLL", "DDDD.......DDDD", ".DDDD.....DDDD.", "..DDDD...DDDD..", "...DDDD.DDDD...", ".....DDDDD.....", "......DDD......", "......DDD......", "......DDD......", ".....DDDDD....."]) };
      S.seal = [sp(["..dd..", ".dddd.", "dddddd"]), sp(["..dd..", ".dddd.", "Ldddd.", "dddddd"]), sp(["..dd..", ".dddd.", ".ddddL", "dddddd"])]; // coming up, looking one way, the other
      S.puff = glowSpr(pr ? 2 : 3, P.smoke, .9); S.spray = glowSpr(2, P.foam, 1);
      S.cSpout = css(P.spout); S.cSpoutLo = css(P.spoutLo); S.cFoam = css(P.foam);
      // a cloud that builds over the sun: a big heaped one, its underside in shade
      const cw = pr ? 30 : 46, chh = pr ? 11 : 15, cq = rng(131), bl = Array.from({ length: 6 }, (_, i) => ({ x: cw * (.1 + i * .16 + (cq() - .5) * .06), r: chh * (.42 + cq() * .42) * (i === 0 || i === 5 ? .7 : 1) }));
      S.sunCloud = paint(cw, chh, (x, y) => bl.some(o => Math.hypot((x - o.x) * .72, y - chh) <= o.r) && y > 0 ? (y >= chh - 2 ? P.cloudLo : P.cloud) : null);
    },
    /** the first pass, number for number the loop this scene has always played */
    sig() {
      const pq = S.pier;
      return { sweep: { t: [.4, .9, 1.3, 2.4], lag: 1.4 }, set: { t: [8.4, 9.2, 10.4, 11.6], t0: 8.4, dur: 3.2 }, flashes: [[6.5, 6.72, 6.8, 7.4], [7.9, 8.12, 8.2, 9.0]],
        gulls: { t: [2.9, 7.6], list: [[0, 0, .22, 5], [1, .35, .28, 3]], dir: -1 }, fish: [{ t: [10.7, 11.35], ring: [11.3, 11.4, 11.5, 11.95], x: pq.x1 + 4, y: pq.y + 5, dir: 1 }] };
    },
    /** pass n's morning, from its own dice: the boat, what is in the water, the gulls, the lighthouse, the light, and when */
    dealPass(n) {
      const r = deal(n, 3), { W, H, hz, portrait: pr, pier: pq, sun: SUN } = S, pick = (a, b) => a + r() * (b - a), side = () => r() < .5 ? 1 : -1;
      const rare = bag(n, 8, 7), boat = rare === 1 ? -1 : rare === 2 ? 3 : rare === 3 ? 4 : bag(n, 3, 1), life = rare === 1 ? 3 : bag(n, 3, 2); // the whale has the bay to itself
      const pl = { dealt: true, boat, life };
      // the light: down the sun's path or up it; some mornings a cloud builds over the sun first, and the light runs when it thins
      if (r() < .45) { const c0 = pick(1.2, 2.4); pl.sunCloud = { t: [c0, c0 + 2.6, c0 + 6.4, c0 + 8.8], x: SUN.x - (S.sunCloud.width >> 1) + Math.round(pick(-3, 3)), y: SUN.y - Math.round(S.sunCloud.height * .62), v: pick(-.8, .8) }; const s0 = c0 + 7.6; pl.sweep = { t: [s0, s0 + .5, s0 + .9, s0 + 2.0], lag: pick(1.1, 1.5), up: false }; }
      else { const s0 = pick(.2, 1.2); pl.sweep = { t: [s0, s0 + .5, s0 + .9, s0 + 2.0], lag: pick(1.1, 1.7), up: r() < .4 }; }
      // the wave set, and the lighthouse's flashes (one, two or three)
      const w0 = pick(6.6, 9.0); pl.set = { t: [w0, w0 + .8, w0 + 2.0, w0 + 3.2], t0: w0, dur: pick(2.8, 3.6) };
      const nf = 1 + Math.floor(r() * 3), f0 = pick(4.6, 7.2), gap = pick(1.2, 1.6); pl.flashes = Array.from({ length: nf }, (_, i) => { const a = f0 + i * gap; return [a, a + .22, a + .3, a + .9]; });
      // the gulls: one to three, from either side, high or low (not with the fishing boat, whose gulls wheel over its stern)
      if (boat !== 2) { const k = 1 + Math.floor(r() * 3), g0 = pick(1.4, 4.2); pl.gulls = { t: [g0, g0 + pick(4.2, 5.4)], dir: side(), list: Array.from({ length: k }, (_, i) => [i % 2, i * pick(.28, .45), pick(pr ? .1 : .14, pr ? .2 : .3), pick(2, 5)]) }; }
      // the boat
      const dir = side(), by = hz + (pr ? 15 : 14);
      if (boat === 0) { // a sailboat comes in, goes about, and heads back out
        const from = pr ? -1 : 1, t0 = pick(.6, 2.2), xa = from > 0 ? W + 8 : -8, xt = W * (pr ? pick(.44, .6) : pick(.6, .72)), d1 = pr ? 4.4 : 4.6;
        pl.sb = { t: [t0, t0 + d1, t0 + d1 + 1.1, t0 + d1 * 2 + 1.1], from, xa, xt, y: by };
      } else if (boat === 1) { // a steamer along the horizon from behind the headland, trailing smoke
        const t0 = pick(.3, .9); pl.steamer = pr ? { t: [t0, 14.6], xa: W * .64, xb: -22, y: hz + 1 } : { t: [t0, 14.2], xa: W + 4, xb: -30, y: hz + 17 };
      } else if (boat === 2) { // a fishing boat chugging across the bay, gulls wheeling over its stern
        const t0 = pick(.4, 1.6); pl.trawler = { t: [t0, t0 + pick(11.4, 12.6)], dir, y: hz + (pr ? 17 : 19) };
      } else if (boat === 3) { // the seaplane glides in, lands with a burst of spray and taxis away
        const t0 = pick(1.0, 2.2), xd = W * (pr ? pick(.5, .62) : pick(.6, .7)); pl.plane = { t: [t0, t0 + 3.4, t0 + 11.6], xd, y0: H * (pr ? .12 : .1), y: hz + (pr ? 14 : 16) };
      } else if (boat === 4) { // a tall ship under all her sail, along the horizon from behind the headland (on a desktop, across the open bay)
        const t0 = pick(.3, .8); pl.ship = pr ? { t: [t0, 14.7], xa: W * .66, xb: -24, y: hz + 2 } : { t: [t0, 14.4], xa: W + 4, xb: -32, y: hz + 18 };
      }
      // in the water: the climax of the pass, when the gulls are gone
      const lt = pick(9.2, 10.6);
      if (life === 0) { // a fish (or two) jumps, wherever it likes
        const k = r() < .5 ? 1 : 2; pl.fish = Array.from({ length: k }, (_, i) => { const a = lt + i * pick(.9, 1.4), d = side(), x = W * (pr ? pick(.12, .8) : pick(.4, .88)), y = hz + Math.round((H - hz) * pick(.22, .5)); return { t: [a, a + .65], ring: [a + .6, a + .7, a + .8, a + 1.25], x, y, dir: d }; });
      } else if (life === 1) { // a pod of dolphins arcing past
        const k = 3 + (r() < .5 ? 1 : 0), d = side(), xa = W * (pr ? (d > 0 ? .36 : 1.02) : (d > 0 ? .5 : .96)), xb = W * (pr ? (d > 0 ? 1.04 : .38) : (d > 0 ? .98 : .48)), t0 = lt - 1.8;
        pl.dolphins = { t: [t0, t0 + 4.6], d, k, xa, xb, y: hz + Math.round((H - hz) * (pr ? .2 : .33)) };
      } else if (life === 2) { // a seal puts his head up near the pier, looks about, and goes down; and again a little way off
        const x = pq.x1 + (pr ? 12 : 18), y = pq.y + (pr ? 12 : 10); pl.seal = [{ t: [lt - 1.6, lt + 1.2], x, y, look: side() }, { t: [lt + 1.8, lt + 3.4], x: x + side() * (pr ? 10 : 16), y: y + 2, look: side() }];
      } else { // the whale: far out, its spout, its back rolling, then its flukes lifting and sliding under
        const t0 = pick(5.8, 6.8); pl.whale = { t0, x: W * (pr ? pick(.3, .56) : pick(.72, .8)), y: hz + (pr ? 12 : 18), d: side() };
      }
      return pl;
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; N: the pass (0, the signature) */
    draw(T, I, A, F, N = 0) {
      const { W, H, hz, pier: pr, light: L } = S, TAU = 6.283;
      if (N !== S.planP) { S.pl = N > 0 ? S.dealPass(N) : S.sig(); S.planP = N; }
      const pl = S.pl;
      g.drawImage(S.bgSky, 0, 0);
      for (const cl of S.clouds) g.drawImage(cl.spr, Math.round(((cl.x + A * cl.v * .6) % (W + cl.spr.width)) - cl.spr.width), cl.y);
      const cover = pl.sunCloud && I > .01 ? S.sunCloudAt(T, I, pl.sunCloud) : 0;
      g.drawImage(S.bgSea, 0, 0);
      g.drawImage(S.sail, Math.round(((A * 1.1) % (W + 40)) - 20), hz - S.sail.height + 2 + Math.round(Math.sin(A * 1.3) * .6));
      if (I > .01 && S.portrait && (pl.steamer || pl.ship)) S.masked(() => { if (pl.steamer) S.steamerAt(T, I, A, pl.steamer); if (pl.ship) S.shipAt(T, I, A, pl.ship); }); // far out, behind the headland (the dealt boats and creatures keep back from the words)
      const st = pl.set, setE = env(T, ...st.t, E.sine) * I;
      // crests drift and breathe; in the wave set a brightness rolls toward the shore
      // (a colour string is parsed each time it is set: two fixed ones, the breathing in globalAlpha)
      const cHi = css(P.crest), cLo = css(P.crestLo); let fs = "";
      for (const c of S.crests) { const roll = setE * Math.max(0, 1 - Math.abs(((T - st.t0) / st.dur) - c.d) * 3), b = .55 + .35 * Math.sin(A * .9 + c.ph) + roll * .8; if (b < .25) continue; const col = roll > .3 ? cHi : cLo; if (col !== fs) g.fillStyle = fs = col; g.globalAlpha = clamp(b); g.fillRect(Math.round(c.x + Math.sin(A * .45 + c.ph) * 1.5), c.y, c.len + (roll > .5 ? 1 : 0), 1); }
      // the sun's path glitters; a sweep of light runs down it in the first beat (under a cloud over the sun it goes out)
      g.fillStyle = css(P.glint);
      const sw = pl.sweep, gl = cover > 0 ? 1 - cover * .9 : 1;
      for (const s of S.path) { const sweep = env(T - (sw.up ? 1 - (s.y - hz) / (H - hz) : (s.y - hz) / (H - hz)) * sw.lag, sw.t[0], sw.t[1], sw.t[2], sw.t[3], E.sine) * I, b = Math.pow(Math.max(0, Math.sin(A * 2.3 + s.ph)), 8) * .75 * gl + sweep * .9; if (b < .06) continue; g.globalAlpha = clamp(b); g.fillRect(Math.round(s.x), s.y, 1, 1); if (b > .7) { g.globalAlpha = clamp(b * .4); g.fillRect(Math.round(s.x) - 1, s.y, 3, 1); } }
      g.globalAlpha = 1;
      if (pl.whale && I > .01) S.masked(() => S.whaleAt(T, I, A, pl.whale));
      g.drawImage(S.bgFront, 0, 0);
      // the lamp: a slow glow always, its flashes in the loop
      let fsum = 0; for (const f of pl.flashes) fsum += env(T, f[0], f[1], f[2], f[3], E.sine);
      const flash = fsum * I, ly = S.lampY;
      g.fillStyle = css(P.lamp, clamp((.25 + .12 * Math.sin(A * 1.6) + flash * .75) * .6)); g.fillRect(L.x - 2, ly, 5, 1);
      if (flash > .08) { g.fillStyle = css(P.lampHi, clamp(flash)); g.fillRect(L.x - 1, ly, 3, 1); g.fillStyle = css(P.lamp, flash * .45); const k = Math.round(10 * flash); g.fillRect(L.x - k, ly, k * 2 + 1, 1); g.fillRect(L.x, ly - Math.round(k * .5), 1, k + 1); }
      g.drawImage(S.moored, pr.x1 - S.moored.width - 2, pr.y + 3 + Math.round(Math.sin(A * 1.6) * .8 + setE * Math.sin(T * 6) * 1.2));
      if (I > .01 && (pl.sb || pl.trawler || pl.dolphins || pl.seal || pl.plane || !S.portrait && (pl.steamer || pl.ship))) S.masked(() => {
        if (!S.portrait) { if (pl.steamer) S.steamerAt(T, I, A, pl.steamer); if (pl.ship) S.shipAt(T, I, A, pl.ship); } // across the open bay
        if (pl.sb) S.sailboatAt(T, I, A, pl.sb); if (pl.trawler) S.trawlerAt(T, I, A, pl.trawler); if (pl.dolphins) S.dolphinsAt(T, I, pl.dolphins); if (pl.seal) S.sealAt(T, I, pl.seal); if (pl.plane) S.planeAt(T, I, A, pl.plane); });
      const birds = () => {
        const gs = pl.gulls;
        if (gs) for (const [k, d, yy, amp] of gs.list) { const u = seg(T, gs.t[0] + d, gs.t[1] + d, E.sine); if (u <= 0 || u >= 1) continue; const fr = k === 1 && u > .4 && u < .72 ? 1 : [0, 1, 2, 1][Math.floor(T * (k ? 8 : 7)) % 4]; const X = Math.round(gs.dir < 0 ? lerp(W + 10, -12, u) : lerp(-12, W + 10, u)), Y = Math.round(H * yy + Math.sin(u * TAU * 1.2 + k) * amp); g.globalAlpha = I; g.drawImage(S.gull[fr], X, Y); g.globalAlpha = 1; }
        for (const f of pl.fish || []) {
          const fj = seg(T, f.t[0], f.t[1], E.io) * (I > .01 ? 1 : 0);
          if (fj > 0 && fj < 1) { const X = Math.round(f.x + fj * 8 * f.dir), Y = Math.round(f.y - Math.sin(fj * Math.PI) * 7); g.fillStyle = css(P.fish, I); g.fillRect(X, Y, 2, 1); }
          const ring = env(T, ...f.ring) * I; if (ring > 0) { const rr = Math.round(1 + seg(T, f.ring[0], f.ring[3]) * 4), fx = f.x + 8 * f.dir, fy = f.y; g.fillStyle = css(P.foam, ring); g.fillRect(fx - rr, fy, rr * 2 + 1, 1); g.fillRect(fx - rr + 1, fy - 1, 1, 1); g.fillRect(fx + rr - 1, fy - 1, 1, 1); }
        }
      };
      if (pl.dealt) S.masked(birds); else birds(); // a dealt pass's gulls and fish keep back from the words
      if (cover > 0) S.masked(v => { v.globalAlpha = cover * .08; v.fillStyle = css(P.funnel); v.fillRect(0, 0, W, H); v.globalAlpha = 1; }); // the morning dims a little under the cloud, not behind the words
      if (F >= 0) for (const b of S.flock) { const u = clamp((F - b.d) / .8); if (u <= 0 || u >= 1) continue; g.globalAlpha = u > .8 ? (1 - u) / .2 : 1; g.drawImage(S.gull[[0, 1, 2, 1][Math.floor(u * 28) % 4]], Math.round(b.x + b.dx * E.io(u)), Math.round(b.y + b.dy * E.out(u))); g.globalAlpha = 1; }
      if (S.hzOn) g.drawImage(S.hzC, 0, 0); // under a long list's lines, the morning's haze
    },
    /** a cloud builds over the sun, drifting a little, and thins away; returns how much of the sun it hides */
    sunCloudAt(T, I, c) {
      const a = env(T, c.t[0], c.t[1], c.t[2], c.t[3], E.sine) * I; if (a <= 0) return 0;
      const x = Math.round(c.x + (T - c.t[0]) * c.v);
      g.globalAlpha = a; g.drawImage(S.sunCloud, x, c.y); g.globalAlpha = 1;
      return a;
    },
    /** a little white foam behind a hull, thinning */
    wake(x, y, dir, n, a) { g.fillStyle = css(P.foam); for (let k = 0; k < n; k++) { g.globalAlpha = a * (1 - k / n); g.fillRect(Math.round(x - dir * (k * 2 + 1)), y + (k & 1), 2, 1); } g.globalAlpha = 1; },
    /** the sailboat: in, about (its sails flapping over), and back out the way it came */
    sailboatAt(T, I, A, b) {
      const [t0, t1, t2, t3] = b.t; if (T <= t0 || T >= t3) return;
      let x, spr, head;
      if (T < t1) { x = lerp(b.xa, b.xt, seg(T, t0, t1, u => 1 - (1 - u) * (1 - u))); head = -b.from; spr = S.sb.go[head < 0 ? 0 : 1]; }
      else if (T < t2) { const u = (T - t1) / (t2 - t1); x = b.xt + Math.sin(u * Math.PI) * -b.from * 2; head = u < .5 ? -b.from : b.from; spr = u > .25 && u < .75 ? S.sb.luff[head < 0 ? 0 : 1] : S.sb.go[head < 0 ? 0 : 1]; }
      else { x = lerp(b.xt, b.xa, seg(T, t2, t3, u => u * u)); head = b.from; spr = S.sb.go[head < 0 ? 0 : 1]; }
      const y = b.y + Math.round(Math.sin(A * 1.6 + 1) * .6), X = Math.round(x) - (spr.width >> 1);
      g.globalAlpha = I; g.drawImage(spr, X, y - spr.height + 1); g.globalAlpha = 1;
      if (T < t1 || T > t2) S.wake(Math.round(x) - head * (spr.width >> 1), y, head, 4, I * .9);
    },
    /** the steamer: along the horizon from behind the headland, its smoke streaming back and thinning */
    steamerAt(T, I, A, s) {
      const [t0, t1] = s.t; if (T <= t0 || T >= t1 + 3.2) return;
      const sp = S.steamer[0], v = (s.xb - s.xa) / (t1 - t0), at = t => s.xa + (clamp(t, t0, t1) - t0) * v, fx = sp.width >> 1;
      // the smoke: a puff every little while from the funnel, drifting back and up, growing, gone in a few seconds
      for (let e = t0 + .25; e < Math.min(T, t1 - 1); e += .42) { const life = Math.min(3.2, 14.9 - e), age = T - e; if (age >= life) continue; const u = age / life, x = at(e) + fx + age * 3.2, y = s.y - sp.height - 1 - age * 2.4 - u * u * 3; g.globalAlpha = I * .75 * (1 - u) * Math.min(1, age * 4); g.drawImage(S.puff, Math.round(x) - (S.puff.width >> 1), Math.round(y) - (S.puff.height >> 1)); } // every puff gone before the pass ends
      if (T < t1) { const X = Math.round(at(T)), Y = s.y - sp.height + 1 + Math.round(Math.sin(A * 1.4) * .5); g.globalAlpha = I; g.drawImage(sp, X, Y); if (!S.portrait) S.wake(Math.round(at(T)) + sp.width, s.y, -1, 6, I); }
      g.globalAlpha = 1;
    },
    /** the tall ship, stately along the horizon */
    shipAt(T, I, A, s) {
      const [t0, t1] = s.t; if (T <= t0 || T >= t1) return; const sp = S.ship[0];
      const x = Math.round(lerp(s.xa, s.xb, (T - t0) / (t1 - t0))), Y = s.y - sp.height + 1 + Math.round(Math.sin(A * 1.1) * .5); g.globalAlpha = I; g.drawImage(sp, x, Y); if (!S.portrait) S.wake(x + sp.width - 2, s.y, -1, 7, I); g.globalAlpha = 1;
    },
    /** the fishing boat across the bay, three gulls wheeling over its stern */
    trawlerAt(T, I, A, b) {
      const [t0, t1] = b.t; if (T <= t0 || T >= t1) return; const sp = S.trawler[b.dir > 0 ? 1 : 0], W = S.W;
      const x = lerp(b.dir > 0 ? -sp.width - 20 : W + 20, b.dir > 0 ? W + 20 : -sp.width - 20, (T - t0) / (t1 - t0)), y = b.y + Math.round(Math.sin(A * 1.9) * .7);
      g.globalAlpha = I; g.drawImage(sp, Math.round(x), y - sp.height + 1);
      S.wake(Math.round(x) + (b.dir > 0 ? 0 : sp.width), y, b.dir, 6, I);
      const sx = x + sp.width / 2 - b.dir * 5, sy = y - sp.height - 5;
      for (let k = 0; k < 3; k++) { const a = T * (1.5 + k * .3) * (k === 1 ? -1 : 1) + k * 2.1, R = 7 + k * 3, X = Math.round(sx + Math.cos(a) * R) - 3, Y = Math.round(sy - k * 2 + Math.sin(a) * R * .45) - 2; g.globalAlpha = I; g.drawImage(S.gull[[0, 1, 2, 1][Math.floor(T * (6 + k) + k) % 4]], X, Y); }
      g.globalAlpha = 1;
    },
    /** the dolphins: one after another out of the water in an arc and back in, travelling, a splash each way */
    dolphinsAt(T, I, p) {
      const [t0, t1] = p.t, D = S.dolphin, v = (p.xb - p.xa) / (t1 - t0 - 1.2);
      for (let j = 0; j < p.k; j++) {
        const tj = t0 + j * .34, k = T - tj; if (k <= 0 || k >= t1 - t0 - 1.2) continue;
        const cyc = .95, ph = (k % cyc) / cyc, x = p.xa + k * v - j * p.d * 4, lp = ph < .62 ? ph / .62 : -1; // in the air for most of each bound
        if (lp >= 0) { const spr = D[lp < .36 ? 0 : lp < .64 ? 1 : 2][p.d > 0 ? 0 : 1], y = p.y - Math.round(Math.sin(lp * Math.PI) * (S.portrait ? 4 : 5)), X = Math.round(x) - (spr.width >> 1); g.globalAlpha = I; g.drawImage(spr, X, y - spr.height + 1); }
        const sp = ph < .12 ? ph / .12 : ph > .55 && ph < .75 ? (ph - .55) / .2 : -1; // a splash as it leaves the water and as it goes back in
        if (sp >= 0) { g.globalAlpha = I * (1 - sp) * .9; g.drawImage(S.spray, Math.round(x + (ph > .5 ? p.d * 3 : -p.d * 3)) - 2, p.y - 2 - Math.round(sp * 2)); }
      }
      g.globalAlpha = 1;
    },
    /** the seal: his head comes up, he looks one way and the other, and down again, a ring each time */
    sealAt(T, I, list) {
      for (const s of list) {
        const [a, b] = s.t; if (T <= a || T >= b + .6) continue;
        const k = (T - a) / (b - a), up = k < 1 ? Math.min(1, k * 6, (1 - k) * 6) : 0, spr = S.seal[k < .15 || k > .85 ? 0 : (k < .5) === (s.look > 0) ? 1 : 2];
        if (up > 0) { g.globalAlpha = I; g.drawImage(spr, s.x - 2, s.y - Math.round(spr.height * up) + 1, spr.width, Math.max(1, Math.round(spr.height * up))); }
        for (const t of [a, b]) { const q = (T - t) / .7; if (q <= 0 || q >= 1) continue; const rr = Math.round(1 + q * 4); g.globalAlpha = I * (1 - q); g.fillStyle = css(P.foam); g.fillRect(s.x - rr, s.y + 1, rr * 2 + 1, 1); }
      }
      g.globalAlpha = 1;
    },
    /** the whale: a spout, the back rolling over, a second spout, then the flukes lifting and sliding under */
    whaleAt(T, I, A, w) {
      const k = T - w.t0; if (k <= 0 || k >= 7.4) return;
      const { back, flukes } = S.whale, y = w.y;
      for (const s0 of [0, 2.6]) { const q = (k - s0) / 1.9; if (q <= 0 || q >= 1) continue; // the spout: a column that shoots up, spreads at the top and blows away
        const hgt = (S.portrait ? 10 : 15) * Math.min(1, q * 5), fade = q < .5 ? 1 : 1 - (q - .5) / .5, bx = w.x + w.d * (s0 ? 6 : 0), drift = q * q * 7;
        for (let j = 0; j <= hgt; j++) { const f = j / Math.max(1, hgt), wd = Math.round(1 + f * f * (S.portrait ? 4 : 6) * Math.min(1, q * 3)), x = Math.round(bx + drift * f - wd / 2), yy = y - 1 - j;
          g.globalAlpha = I * fade * (.95 - f * .25); g.fillStyle = css(P.spout); g.fillRect(x, yy, wd, 1); g.fillStyle = css(P.spoutLo); g.fillRect(x + wd, yy, 1, 1); } }
      const roll = (k - .5) / 3.4; // the back: up out of the water and over, travelling a little
      if (roll > 0 && roll < 1) { const h = Math.round(Math.sin(roll * Math.PI) * back.height), x = Math.round(w.x + w.d * roll * 10) - (back.width >> 1); if (h > 0) { g.globalAlpha = I; g.drawImage(back, 0, 0, back.width, h, x, y - h + 1, back.width, h); } }
      const fl = (k - 4.4) / 2.6; // the flukes: up, a moment high with the water running off, and down
      if (fl > 0 && fl < 1) { const h = Math.round(Math.sin(Math.min(1, fl * 1.5) * Math.PI / 2) * flukes.height * (fl < .7 ? 1 : 1 - (fl - .7) / .3)), x = Math.round(w.x + w.d * 10) - (flukes.width >> 1);
        if (h > 0) { g.globalAlpha = I; g.drawImage(flukes, 0, 0, flukes.width, h, x, y - h + 1, flukes.width, h); g.fillStyle = css(P.foam); for (let i = 0; i < 4; i++) { const d = ((k * 3 + i * .27) % 1); g.globalAlpha = I * .9 * (1 - d); g.fillRect(x + [1, 3, 7, 9][i], y - h + 2 + Math.round(d * h), 1, 1); } } }
      for (const t of [.5, 3.9, 6.9]) { const q = (k - t) / .8; if (q <= 0 || q >= 1) continue; const rr = Math.round(2 + q * 6); g.globalAlpha = I * (1 - q) * .9; g.fillStyle = css(P.foam); g.fillRect(Math.round(w.x + w.d * (t > 5 ? 10 : t > 3 ? 8 : 0)) - rr, y + 1, rr * 2 + 1, 1); }
      g.globalAlpha = 1;
    },
    /** the seaplane: glides in, touches down in a burst of spray, and taxis away, its propeller a blur */
    planeAt(T, I, A, p) {
      const [t0, t1, t2] = p.t; if (T <= t0 || T >= t2) return; const W = S.W, fr = Math.floor(T * 14) & 1;
      let x, y;
      if (T < t1) { const u = (T - t0) / (t1 - t0); x = lerp(W + 22, p.xd, u); y = lerp(p.y0, p.y, 1 - Math.pow(1 - u, 3)); } // it drops in steeply and flattens out over the water
      else { const u = (T - t1) / (t2 - t1); x = lerp(p.xd, -26, u * (1.5 - u * .5) / 1); y = p.y + Math.round(Math.sin(A * 2.2) * .5); }
      const sp = S.plane[fr][0], X = Math.round(x) - (sp.width >> 1);
      g.globalAlpha = I; g.drawImage(sp, X, Math.round(y) - sp.height + 1);
      const q = T - t1; // touching down: two arcs of spray thrown up either side of the floats, foam spreading on the water
      if (q > 0 && q < 1.2) { const fx = X + Math.round(sp.width * .5), fade = I * Math.min(1, (1.2 - q) * 2.5);
        for (let i = 0; i < 28; i++) { const side = i & 1 ? 1 : -1, k = (i >> 1) / 14, t = q - k * .08, vx = 4 + k * 14 + (i % 3), vy = 16 + (1 - k) * 14; if (t <= 0) continue; const y = p.y - (vy * t - 32 * t * t); if (y > p.y + .5) continue; const big = i < 8 ? 2 : 1; g.globalAlpha = fade * (i < 14 ? 1 : .75); g.fillStyle = i < 14 ? S.cSpout : S.cSpoutLo; g.fillRect(Math.round(fx + side * vx * t + (1 - Math.min(1, q * 2)) * 3), Math.round(y) - big + 1, big, big); }
        const rr = Math.round(2 + q * 12); g.globalAlpha = fade * .85; g.fillStyle = S.cFoam; g.fillRect(fx - rr, p.y + 1, rr * 2 + 1, 1); g.fillRect(fx - rr + 2, p.y, 2, 1); g.fillRect(fx + rr - 3, p.y, 2, 1);
        g.globalAlpha = I * (1 - q / 1.2) * .9; g.drawImage(S.spray, fx - 3, p.y - 3); g.drawImage(S.spray, fx + 1, p.y - 2); }
      if (T > t1) S.wake(X + sp.width - 2, p.y + 1, -1, 7, I);
      g.globalAlpha = 1;
    },
  };
  return S;
}
