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
//
// 1.12 b413: the egg. Every twelfth pass (K.egg: three minutes of the list left alone), the bay has its monster. Something
// moves under the water, a V of ripples running before it; three humps break the surface and glide, rising and falling as it
// swims, and go under; bubbles; then a head on a long neck comes straight up out of the water in the pose of the "surgeon's
// photograph" (1934), the water running off it. It looks round one way and the other, turns to look straight at you, cocks
// its head, blinks, and sinks straight down without a splash, the rings spreading after it. Nothing else is on the water
// that morning, and it keeps back from the words as the boats do.
//
// 1.12 b424: the long day's hour eggs. For a list left up through a long day, once in each hour of the loops left alone
// (K.long) the bay has a visitor that has no business in a quiet morning harbour, the two taking turns. The first is a
// pirate: round the headland comes a galleon under black sails, ragged and shot through. She rounds to broadside on, runs
// the skull and crossbones up her main, opens her ports (red inside), and fires her four guns one after another — a
// flash, a burst of smoke, the ball arcing out toward you and a plume of water thrown up short, its rings spreading — and
// her smoke rolls up her side as she gets under way again and stands off for the horizon, smaller and smaller, until the
// morning haze takes her; the swell from the shots rocks the boat at the pier, and the lighthouse flashes after her, twice.
// The second is the giant rubber duck that tugs have towed into harbours the world over (Florentijn Hofman's, since 2007):
// a little tug comes in round the headland with it on a long line, swings round toward you and heads back out, and the
// duck comes round after it, turning until it looks you in the eye — a gull drops onto its head, the swell lifts it, the
// tug toots twice — then on round and out the way they came, the gull riding. The duck and the tug are ray-cast at their
// size the first time they are wanted, every few degrees of their turn, and kept; the ship is painted by rule at every
// size she is seen at. Each has the bay to itself and keeps back from the words as the boats do; the crown's pass, and
// every pass either side, deal as they always have.
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
    nes: rgb("#456F6B"), nesD: rgb("#3A605C"), nesHi: rgb("#7FA8A3"), nesEye: rgb("#FFFFFF"), // b413: the egg's visitor, in the whale's greys
  };
  const flip = c => { const [o, x] = canvas(c.width, c.height); x.setTransform(-1, 0, 0, 1, c.width, 0); x.drawImage(c, 0, 0); return o; };
  // 1.12 b424: the second hour egg's toys, ray-cast at their size the first time they are wanted (S.toy): a rubber duck —
  // its body, breast, tail, head and two-part bill, its eyes painted on the head, glossy — and the tug that tows it, a dark
  // hull with a red boot-top cut flat at its deck, a cream deckhouse with portholes, a wheelhouse with its windows, a black
  // funnel with a red band, a stub of a mast
  const TOY = (() => {
    const T5 = (...h) => h.map(rgb), headC = [.3, .8, 0], eye = sd => { const v = [.62, .36, sd * .62], l = Math.hypot(...v); return v.map(a => a / l); };
    const dm = {
      y: { tones: T5("#BD7A00", "#E89B00", "#FFC000", "#FFD83A", "#FFEC8A", "#FFFFFF"), shiny: true, paint: (h, q) => { if (!q.head) return null; const v = [h[0] - headC[0], h[1] - headC[1], h[2] - headC[2]], l = Math.hypot(...v);
        for (const sd of [-1, 1]) { const e = eye(sd); if ((v[0] * e[0] + v[1] * e[1] + v[2] * e[2]) / l > Math.cos(.27)) { const gq = [e[0] - .04, e[1] + .2, e[2]], gl = Math.hypot(...gq); return (v[0] * gq[0] + v[1] * gq[1] + v[2] * gq[2]) / (l * gl) > Math.cos(.09) ? "w" : "k"; } } return null; } },
      b: { tones: T5("#B5480E", "#DB6418", "#FF8A2A", "#FFA851", "#FFC98A", "#FFFFFF"), shiny: true },
      k: { tones: T5("#1B1712", "#1B1712", "#241E17", "#2E2720", "#3A3128", "#3A3128") }, w: { tones: T5("#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF") } };
    const duck = [{ c: [0, .25, 0], r: [.54, .3, .4], m: "y" }, { c: [.2, .33, 0], r: [.34, .3, .36], m: "y" }, { c: [-.42, .42, 0], r: [.2, .12, .2], tilt: .6, m: "y" },
      { c: headC, r: [.26, .26, .26], m: "y", head: true }, { c: [.57, .74, 0], r: [.18, .075, .19], tilt: -.12, m: "b" }, { c: [.53, .685, 0], r: [.14, .05, .15], tilt: -.05, m: "b" }];
    const tm = {
      h: { tones: T5("#1E2928", "#26332F", "#2F3F3C", "#3B4D4A", "#4B605C", "#4B605C"), paint: (p, q, n) => n[1] > .9 ? "d" : p[1] < .075 ? "r" : p[1] > .175 ? "l" : null },
      l: { tones: T5("#8E9D99", "#A6B4B0", "#BCC8C4", "#D0D9D6", "#E2E9E6", "#E2E9E6") },
      r: { tones: T5("#7A2E28", "#94392F", "#AE4639", "#C25647", "#D46A5A", "#D46A5A") }, d: { tones: T5("#3E4A47", "#46524F", "#4E5B58", "#586663", "#62706D", "#62706D") },
      c: { tones: T5("#AEB9B4", "#C3CCC7", "#D8DFDA", "#E8EDE9", "#F6F8F6", "#FFFFFF"), paint: (p, q, n) => n[1] > .5 ? null : q.wh ? (p[1] > .53 && p[1] < .62 ? "g" : null) : Math.abs(n[2]) > .5 && p[1] > .29 && p[1] < .36 && ((p[0] * 10 + 20) % 2.2) < .9 ? "g" : null },
      g: { tones: T5("#1F3331", "#26403D", "#2C4946", "#355653", "#6E918C", "#9DBDB8") },
      f: { tones: T5("#151B1A", "#1B2322", "#222C2A", "#2C3836", "#3A4845", "#3A4845"), paint: p => p[1] > .66 && p[1] < .77 ? "r" : null } };
    const tug = [{ c: [0, .04, 0], r: [1, .3, .36], top: .22, m: "h" }, { c: [.97, .14, 0], r: [.07, .08, .13], m: "f" },
      { box: [-.48, .21, -.24, .25, .44, .24], m: "c" }, { box: [-.04, .44, -.19, .28, .66, .19], m: "c", wh: true }, { box: [-.07, .66, -.22, .31, .7, .22], m: "c" },
      { cyl: [-.3, 0, .115, .44, .9], m: "f" }, { cyl: [.16, 0, .022, .7, 1.02], m: "f" }];
    return { duck, dm, dInk: rgb("#7A4C06"), tug, tm, tInk: rgb("#1A2322") };
  })();
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
    /** 1.12 b413: the egg's morning (every twelfth pass, K.egg): the bay to itself and the one who lives in it. Something
     *  moves under the water, a V of ripples running before it; three humps break the surface and glide, rising and falling
     *  one after another as it swims, and go under; bubbles; then a head on a long neck comes straight up out of the water as
     *  in that famous photograph, the water running off it, looks round one way and the other, turns to look straight at you,
     *  blinks, and sinks straight down without a splash, the rings spreading after it. Its own dice; nothing else on the water */
    eggPlan(n) {
      const { W, hz, portrait: pr } = S, k = pr ? 1.2 : 1.3, dir = -1;
      const nx = Math.round(W * (pr ? .58 : .71)), ny = hz + (pr ? 34 : 34), hy = hz + (pr ? 27 : 27), v = pr ? 6.5 : 9.5, sp = Math.round(10 * k);
      const ht = [2.6, 6.5], hx0 = nx - dir * (v * (ht[1] - ht[0]) * .5 + sp * 1.2); // the humps come up behind where the neck will, and swim toward it
      return { dealt: true, flashes: [], sweep: { t: [20, 21, 22, 23], lag: 1.4 }, set: { t: [20, 21, 22, 23], t0: 20, dur: 3 },
        egg: { k, dir, nx, ny, hy, v, sp, ht, hx0, vw: [.6, ht[0] + .6], bub: [6.7, 7.5], rise: [7.4, 8.9], turn: [8.9, 9.3, 9.6, 10.0], at: [10.0, 10.3, 11.3, 11.6], tilt: [10.45, 10.8], blink: 11.05, sink: [11.8, 13.0] } };
    },
    /** where the humps are at T (the front one's x), and whether the swimmer is under the V of ripples before them */
    humpX(T, e) { return e.hx0 + e.dir * e.v * (T - e.ht[0]); },
    nessieAt(T, I, A, e) {
      const ns = S.nessie(e.k), dir = e.dir, foam = S.cFoam; S.cTrough = S.cTrough || css(P.hullD);
      // under the water: a V of ripples running ahead of the humps, nothing to be seen of what makes it
      const vk = env(T, e.vw[0], e.vw[0] + .6, e.vw[1] - .5, e.vw[1], E.sine) * I;
      if (vk > .01) { const x = S.humpX(T, e) + dir * 4 * e.k, y = e.hy; g.fillStyle = foam;
        for (let j = 0; j < 13; j++) { const a = vk * (1 - j / 13) * (j < 1 ? 1 : .9); if (a <= .02) continue; const bx = Math.round(x - dir * (j * 2.2 + 1)), dy = Math.round(j * .55); g.fillStyle = S.cTrough; g.globalAlpha = a * .5; g.fillRect(bx, y - dy + 1, 2, 1); g.fillRect(bx, y + dy + (j ? 1 : 2), 2, 1); g.fillStyle = foam; g.globalAlpha = a; g.fillRect(bx, y - dy, 2, 1); g.fillRect(bx, y + dy + (j ? 0 : 1), 2, 1); } // each ripple a crest of foam over its trough
        g.globalAlpha = vk * .8; g.fillRect(Math.round(x) - 1, y - 1, 3, 1); g.globalAlpha = 1; } // (the bulge of water over it)
      // the three humps: up one after another, gliding, rising and falling as it swims, and under again, front first
      const [h0, h1] = e.ht;
      if (T > h0 && T < h1 + 1.5) for (let i = 0; i < 3; i++) {
        const up = env(T, h0 + i * .45, h0 + i * .45 + .8, h1 - .9 + i * .4, h1 + i * .4, E.sine), sw = .8 + .2 * Math.sin(T * 3.4 - i * 1.4), hh = up * sw * I; if (hh <= .03) continue; // (the swell running back along it as it swims)
        const sp = ns.hump, x = Math.round(S.humpX(T, e) - dir * i * e.sp), h = Math.max(1, Math.round(sp.height * up * sw)), y = e.hy;
        g.globalAlpha = I; g.drawImage(sp, 0, 0, sp.width, h, x - (sp.width >> 1), y - h + 1, sp.width, h);
        S.wake(x - dir * (sp.width >> 1), y + 1, dir, 5, I * up * .9); g.fillStyle = foam; g.globalAlpha = I * up * .85; g.fillRect(x + dir * ((sp.width >> 1) + 1) - (dir > 0 ? 1 : 0), y, 2, 1); // its wake, and the water breaking at its front
      }
      // bubbles where it went down, then the neck straight up out of the water
      for (let j = 0; j < 4; j++) { const t = e.bub[0] + j * .21, q = (T - t) / .5; if (q <= 0 || q >= 1) continue; g.fillStyle = foam; g.globalAlpha = I * (1 - q) * .95; g.fillRect(e.nx + [-2, 1, -1, 2][j] * e.k | 0, e.ny - Math.round(q * 2), 1, 1); }
      const [r0, r1] = e.rise, [s0, s1] = e.sink, up = T < r0 || T > s1 ? 0 : T < r1 ? E.out(seg(T, r0, r1, x => x)) : T < s0 ? 1 : 1 - E.in(seg(T, s0, s1, x => x)) * 1;
      if (up > 0) {
        const tl = env(T, ...e.turn, E.sine), at = env(T, ...e.at, E.sine), pose = at > .5 ? (Math.abs(T - e.blink) < .09 ? ns.B : T > e.tilt[0] && T < e.tilt[1] ? ns.T : ns.F) : tl > .5 ? ns.R : ns.L, sp = pose.c; // round one way, the other, at you; its head on one side; a blink
        const bob = Math.round(Math.sin(A * 1.6) * .6 * up), H = sp.height, h = Math.round(H * up), X = e.nx - pose.ox, Y = e.ny + bob;
        if (h > 0) {
          g.globalAlpha = I * .2; for (let r = 1; r < Math.min(h, 12); r += 2) g.drawImage(sp, 0, H - 1 - r, sp.width, 1, X + Math.round(Math.sin(A * 3 + r) * .8), Y + r + 1, sp.width, 1); // its reflection, broken by the ripples
          g.globalAlpha = I; g.drawImage(sp, 0, 0, sp.width, h, X, Y - h + 1, sp.width, h);
          if (T < r1 + 1) { g.fillStyle = foam; for (let j = 0; j < 3; j++) { const q = ((T - r0) * 1.3 + j * .33) % 1, yy = Y - h + 2 + Math.round(q * (h - 2)); g.globalAlpha = I * (1 - q) * .8 * clamp((r1 + 1 - T) * 2); g.fillRect(X + pose.ox + (j - 1) - 1, yy, 1, 1); } } // the water running off it
          g.globalAlpha = I * .85 * Math.min(1, up * 3); g.fillStyle = foam; g.fillRect(e.nx - 3 * e.k | 0, e.ny + 1, Math.round(6 * e.k) + 1, 1); // the water round it
        }
      }
      // rings: as it comes up, and spreading after it as it goes down
      for (const [t, w] of [[r0, 1], [s0 + .3, 1], [s0 + .8, .8], [s1, .7]]) { const q = (T - t) / 1.7; if (q <= 0 || q >= 1) continue; const rx = (2 + q * 14) * e.k, ry = rx * .26; g.fillStyle = foam;
        for (let j = 0; j < 30; j++) { const th = j / 30 * 6.283, px = Math.round(e.nx + Math.cos(th) * rx), py = Math.round(e.ny + 1 + Math.sin(th) * ry); g.globalAlpha = I * w * (1 - q) * (Math.sin(th) > 0 ? .9 : .55); g.fillRect(px, py, 1, 1); } }
      g.globalAlpha = 1;
    },
    /** the visitor, drawn once the first time an egg plays (and again at a new size): its neck and head in four poses —
     *  looking one way, the other, at you, and blinking — set down in whole pixels, lit along its top; and one of its humps */
    nessie(k) {
      if (S.ns && S.ns.k === k && S.ns.W === S.W) return S.ns;
      const C = { 1: P.nesD, 2: P.nes, 3: P.nesHi, 4: P.nesEye }, sunLeft = S.sun.x < S.W * .72 && !S.portrait;
      const neck = pose => {
        const w = Math.ceil(18 * k), h = Math.ceil(24 * k), SS = 4, cov = new Uint8Array(w * h * SS * SS), ox = Math.round(w * .55), gy = h - 1;
        const cap = (ax, ay, ar, bx, by, br) => { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6; for (let Y = 0; Y < h * SS; Y++) for (let X = 0; X < w * SS; X++) { const px = (X + .5) / SS - ox, py = gy - (Y + .5) / SS, t = clamp(((px - ax) * dx + (py - ay) * dy) / L2), rr = lerp(ar, br, t), qx = ax + dx * t - px, qy = ay + dy * t - py; if (qx * qx + qy * qy <= rr * rr) cov[Y * w * SS + X] = 1; } };
        const ell = (cx, cy, rx, ry, rot = 0) => { const c = Math.cos(rot), s = Math.sin(rot); for (let Y = 0; Y < h * SS; Y++) for (let X = 0; X < w * SS; X++) { const px = (X + .5) / SS - ox - cx, py = gy - (Y + .5) / SS - cy, u = px * c + py * s, q = -px * s + py * c; if ((u / rx) ** 2 + (q / ry) ** 2 <= 1) cov[Y * w * SS + X] = 1; } };
        const tip = pose === "L" ? [[-2.3, 17.4], [-3.8, 19.1]] : pose === "R" ? [[.6, 17.5], [2.0, 19.2]] : pose === "T" ? [[-.5, 17.5], [.3, 19.3]] : [[-1.5, 17.5], [-2.0, 19.4]]; // its head turned one way or the other on the top of its neck, or up and looking out (T: its head on one side)
        const C0 = [[0, -1, 2.6], [-.2, 4, 2.3], [-.1, 9, 1.9], [-.8, 14, 1.6], [...tip[0], 1.4], [...tip[1], 1.35]].map(([x, y, r]) => [x * k, y * k, r * k]); // the neck, up out of the water and over at the top
        for (let i = 1; i < C0.length; i++) cap(...C0[i - 1], ...C0[i]);
        ell(3.4 * k, -.7 * k, 4.8 * k, 2.5 * k); // the back behind it, just breaking the water
        const top = C0[C0.length - 1];
        if (pose === "L") ell(top[0] - 1.5 * k, top[1] + .5 * k, 2.5 * k, 1.5 * k, .18); else if (pose === "R") ell(top[0] + 1.5 * k, top[1] + .5 * k, 2.5 * k, 1.5 * k, -.18); else ell(top[0], top[1] + 1.1 * k, 2.1 * k, 1.8 * k, pose === "T" ? -.35 : 0); // the head: its snout one way or the other, or round, looking out
        const m = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let n = 0; for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) n += cov[(y * SS + j) * w * SS + x * SS + i]; if (n >= SS * SS * .5) m[y * w + x] = 2; }
        const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] > 0;
        const px = m.slice(); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!at(x, y)) continue; const i = y * w + x; if (!at(x, y - 1)) px[i] = 3; else if (sunLeft ? !at(x + 1, y) : !at(x - 1, y)) px[i] = 1; } // lit along its top, shaded on the side away from the sun
        const hx = Math.round(ox + top[0] + (pose === "L" ? -1.5 : pose === "R" ? 1.5 : 0) * k), hy2 = Math.round(gy - top[1] - (pose === "L" || pose === "R" ? .8 : 1.3) * k);
        if (pose === "L") px[hy2 * w + hx - 1] = 4; else if (pose === "R") px[hy2 * w + hx + 1] = 4; else if (pose === "B") { px[hy2 * w + hx - 1] = 2; px[hy2 * w + hx + 1] = 2; } else { px[hy2 * w + hx - 1] = 4; px[(hy2 + (pose === "T" ? 1 : 0)) * w + hx + 1] = 4; } // an eye, two eyes on you, or shut
        return { c: paint(w, h, (x, y) => C[px[y * w + x]]), ox };
      };
      const hw = Math.round(11 * k) | 1, hh = Math.round(4 * k), hump = paint(hw, hh, (x, y) => { const u = (x - (hw - 1) / 2) / (hw / 2), top = hh * (1 - Math.pow(Math.abs(u), 1.8)); if (hh - y > top + .4) return null; return hh - y > top - .8 ? P.nesHi : u * (sunLeft ? 1 : -1) > .55 ? P.nesD : P.nes; });
      return (S.ns = { k, W: S.W, L: neck("L"), R: neck("R"), F: neck("F"), B: neck("B"), T: neck("T"), hump });
    },
    /** 1.12 b424: the long day's hour eggs (K.long: one pass in each hour of the list left alone, the two taking turns). The
     *  bay to itself but for what the egg brings — no boats, no gulls, no sweep of light — and the lighthouse and the wave set
     *  as the egg asks. Its own dice (the passes either side deal as they always have) */
    hourPlan(n, h) {
      const off = [20, 21, 22, 23], pl = { dealt: true, hour: h, flashes: [], sweep: { t: off, lag: 1.4 }, set: { t: off, t0: 20, dur: 3 } };
      if (h === 2) { pl.duck = S.duckPlan(); pl.set = { t: [6.8, 7.6, 8.8, 10.0], t0: 6.8, dur: 3.2 }; } // a swell rolls in under the duck as it turns to you
      else { pl.pirate = S.piratePlan(deal(n, 41)); pl.set = { t: [7.1, 7.9, 9.1, 10.3], t0: 7.1, dur: 3.2 }; pl.flashes = [[10.2, 10.42, 10.5, 11.1], [11.5, 11.72, 11.8, 12.4]]; } // the swell from the shots; the lighthouse flashes after her
      return pl;
    },
    /** the duck's course (the second hour egg): a little tug comes in round the headland towing, on a long line, a rubber duck
     *  as tall as the lighthouse (Florentijn Hofman's, which tugs have towed into harbours the world over since 2007); the tug
     *  swings round toward you and heads back out, and the duck comes round after it, turning till it faces you square on —
     *  the moment a gull drops onto its head, the swell lifts it and the tug toots twice — then on round, and out the way they
     *  came, nearer, the gull riding. The way is in along the bay, a half turn toward you, and out again; the tug's place on it
     *  eases in, slows through the turn and goes out at a clip, the duck a towline behind */
    duckPlan() {
      const { W, hz, portrait: pr } = S, k = pr ? 27 : 41, tk = pr ? 11.5 : 16.5, y1 = hz + (pr ? 11 : 12), xc = Math.round(W * (pr ? .54 : .7)), rx = pr ? 17 : 23, ry = pr ? 10 : 9, X0 = W + 60;
      const n = 48, arc = [0]; for (let i = 1; i <= n; i++) { const a0 = Math.PI / 2 + Math.PI * (i - 1) / n, a1 = Math.PI / 2 + Math.PI * i / n; arc.push(arc[i - 1] + Math.hypot(rx * (Math.cos(a1) - Math.cos(a0)), ry * (Math.sin(a1) - Math.sin(a0)))); }
      const L1 = X0 - xc, LA = arc[n];
      const at = s => { if (s < L1) return [X0 - s, y1, -1, 0]; if (s > L1 + LA) return [xc + s - L1 - LA, y1 + 2 * ry, 1, 0]; let i = 1; while (i < n && arc[i] < s - L1) i++; const f = (s - L1 - arc[i - 1]) / (arc[i] - arc[i - 1]), a = Math.PI / 2 + Math.PI * (i - 1 + f) / n; return [xc + rx * Math.cos(a), y1 + ry - ry * Math.sin(a), -rx * Math.sin(a), -ry * Math.cos(a)]; }; // [x, y, and which way]
      const lag = Math.round(tk + (pr ? 6 : 9) + k * .6), s0 = X0 - W - tk - 3, s1 = L1 + LA / 2 + lag, s2 = L1 + LA + W + Math.ceil(k * .8) + 3 - xc + lag; // the tug just out of sight; the duck at the turn's far side; the duck just out of sight
      const T0 = .3, T1 = 8.0, T2 = 14.8, a1 = (s1 - s0) / (T1 - T0), a2 = (s2 - s1) / (T2 - T1), v0 = a1 * 1.22, v1 = Math.min(a1, a2) * .36, v2 = a2 * 1.22;
      const herm = (t, ta, tb, sa, sb, va, vb) => { const h = tb - ta, u = (t - ta) / h, u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * sa + (u3 - 2 * u2 + u) * h * va + (-2 * u3 + 3 * u2) * sb + (u3 - u2) * h * vb; };
      const sAt = t => t < T0 ? s0 + v0 * (t - T0) : t < T1 ? herm(t, T0, T1, s0, s1, v0, v1) : t < T2 ? herm(t, T1, T2, s1, s2, v1, v2) : s2 + v2 * (t - T2);
      return { k, tk, at, sAt, lag, gull: [5.2, 7.7], toots: [8.15, 8.62] };
    },
    /** a toy, ray-cast once at its size and kept (the duck and the tug): ellipsoids (cut flat at `top` if asked), boxes and
     *  upright cylinders, each with a material; seen square on from a little above the water, turned to `phi` (−90 facing
     *  left, 0 facing you, 90 facing right), lit from the right and the front; the water cuts it at its line. Three by three
     *  samples a pixel, five tones a material and a glint, a pixel of ink round it. `ox`, `oy`: where its middle meets the water */
    toy(parts, mats, phi, s, ink) {
      const p = 13 * Math.PI / 180, th = (phi - 90) * Math.PI / 180, ct = Math.cos(th), st = Math.sin(th), D = [0, -Math.sin(p), -Math.cos(p)], U = [0, Math.cos(p), -Math.sin(p)];
      const nv = v => { const l = Math.hypot(...v) || 1; return v.map(a => a / l); }, L = nv([.5, .78, .62]), Hh = nv(L.map((v, i) => v - D[i]));
      const ext = q => q.box ? { c: [(q.box[0] + q.box[3]) / 2, (q.box[1] + q.box[4]) / 2, (q.box[2] + q.box[5]) / 2], R: Math.hypot(q.box[3] - q.box[0], q.box[4] - q.box[1], q.box[5] - q.box[2]) / 2, top: q.box[4] } : q.cyl ? { c: [q.cyl[0], (q.cyl[3] + q.cyl[4]) / 2, q.cyl[1]], R: Math.max(q.cyl[2], (q.cyl[4] - q.cyl[3]) / 2), top: q.cyl[4] } : { c: q.c, R: Math.max(...q.r), top: q.c[1] + Math.max(...q.r) };
      let x0 = 1e9, x1 = -1e9, y1 = -1e9, zr = 0; for (const q of parts) { const e = ext(q), cx = e.c[0] * ct + e.c[2] * st; x0 = Math.min(x0, cx - e.R); x1 = Math.max(x1, cx + e.R); y1 = Math.max(y1, e.top); zr = Math.max(zr, Math.abs(-e.c[0] * st + e.c[2] * ct) + e.R); }
      const ox = Math.ceil(-x0 * s) + 2, w = Math.ceil((x1 - x0) * s) + 4, h = Math.ceil(y1 * Math.cos(p) * s + zr * s * Math.sin(p)) + 3, oy = Math.ceil(y1 * Math.cos(p) * s) + 1;
      const hit = (q, Pm, Dm) => {
        if (q.box) { const b = q.box; let t0 = -1e9, t1 = 1e9, ax = -1; for (let i = 0; i < 3; i++) { if (Math.abs(Dm[i]) < 1e-9) { if (Pm[i] < b[i] || Pm[i] > b[i + 3]) return null; continue; } let a = (b[i] - Pm[i]) / Dm[i], c = (b[i + 3] - Pm[i]) / Dm[i]; if (a > c) [a, c] = [c, a]; if (a > t0) { t0 = a; ax = i; } t1 = Math.min(t1, c); } if (t0 > t1) return null; const n = [0, 0, 0]; n[ax] = Dm[ax] > 0 ? -1 : 1; return [t0, n]; }
        if (q.cyl) { const [cx, cz, r, ya, yb] = q.cyl, ox2 = Pm[0] - cx, oz = Pm[2] - cz, a = Dm[0] * Dm[0] + Dm[2] * Dm[2], b = 2 * (ox2 * Dm[0] + oz * Dm[2]), c = ox2 * ox2 + oz * oz - r * r, disc = b * b - 4 * a * c; if (disc < 0) return null; const t = (-b - Math.sqrt(disc)) / (2 * a), y = Pm[1] + Dm[1] * t;
          if (y >= ya && y <= yb) return [t, [(ox2 + Dm[0] * t) / r, 0, (oz + Dm[2] * t) / r]]; if (y > yb && Dm[1] < 0) { const t2 = (yb - Pm[1]) / Dm[1], xx = ox2 + Dm[0] * t2, zz = oz + Dm[2] * t2; if (xx * xx + zz * zz <= r * r) return [t2, [0, 1, 0]]; } return null; }
        const c = Math.cos(-(q.tilt || 0)), sn = Math.sin(-(q.tilt || 0)), ox2 = Pm[0] - q.c[0], oy2 = Pm[1] - q.c[1], oz = Pm[2] - q.c[2];
        const o = [(ox2 * c - oy2 * sn) / q.r[0], (ox2 * sn + oy2 * c) / q.r[1], oz / q.r[2]], d = [(Dm[0] * c - Dm[1] * sn) / q.r[0], (Dm[0] * sn + Dm[1] * c) / q.r[1], Dm[2] / q.r[2]];
        const a = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], b = 2 * (o[0] * d[0] + o[1] * d[1] + o[2] * d[2]), cc = o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - 1, disc = b * b - 4 * a * cc; if (disc < 0) return null;
        const t = (-b - Math.sqrt(disc)) / (2 * a);
        if (q.top !== undefined && Pm[1] + Dm[1] * t > q.top) { if (Dm[1] >= 0) return null; const t2 = (q.top - Pm[1]) / Dm[1], t3 = (-b + Math.sqrt(disc)) / (2 * a); return t2 > t3 ? null : [t2, [0, 1, 0]]; } // cut flat: a deck
        const n = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t].map((v, i) => v / q.r[i]), c2 = Math.cos(q.tilt || 0), s2 = Math.sin(q.tilt || 0); return [t, [n[0] * c2 - n[1] * s2, n[0] * s2 + n[1] * c2, n[2]]]; };
      const Dm = [D[0] * ct - D[2] * st, D[1], D[0] * st + D[2] * ct];
      const sample = (u, v) => {
        const P0 = [u - D[0] * 10, v * U[1] - D[1] * 10, v * U[2] - D[2] * 10], Pm = [P0[0] * ct - P0[2] * st, P0[1], P0[0] * st + P0[2] * ct];
        let best = null, bt = -P0[1] / D[1]; // nothing under the water
        for (const q of parts) { const r = hit(q, Pm, Dm); if (r && r[0] < bt) { bt = r[0]; best = [q, r[1]]; } }
        if (!best) return null;
        const [q, nm] = best, nw = nv([nm[0] * ct + nm[2] * st, nm[1], -nm[0] * st + nm[2] * ct]), dif = nw[0] * L[0] + nw[1] * L[1] + nw[2] * L[2], spec = Math.pow(Math.max(0, nw[0] * Hh[0] + nw[1] * Hh[1] + nw[2] * Hh[2]), 36);
        let m = q.m; if (mats[m].paint) m = mats[m].paint([Pm[0] + Dm[0] * bt, Pm[1] + Dm[1] * bt, Pm[2] + Dm[2] * bt], q, nm) || m;
        const kk = .3 + .7 * Math.max(0, dif); return mats[m].tones[spec > .5 && mats[m].shiny ? 5 : kk < .42 ? 0 : kk < .6 ? 1 : kk < .8 ? 2 : kk < .94 ? 3 : 4];
      };
      const [c, x] = canvas(w, h), im = x.createImageData(w, h), d = im.data, tally = new Map();
      for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) { tally.clear(); let nn = 0, bk = null, bn = 0;
        for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const col = sample((xx + (i + .5) / 3 - ox) / s, (oy - (y + (j + .5) / 3)) / s); if (!col) continue; nn++; const v = (tally.get(col) || 0) + 1; tally.set(col, v); if (v > bn) { bn = v; bk = col; } }
        if (nn < 5) continue; const k2 = (y * w + xx) * 4; d[k2] = bk[0]; d[k2 + 1] = bk[1]; d[k2 + 2] = bk[2]; d[k2 + 3] = 255; }
      const on = (xx, y) => xx >= 0 && y >= 0 && xx < w && y < h && d[(y * w + xx) * 4 + 3] > 0, edge = [];
      for (let y = 0; y < h; y++) for (let xx = 0; xx < w; xx++) if (!on(xx, y) && (on(xx - 1, y) || on(xx + 1, y) || on(xx, y - 1) || (on(xx, y + 1) && y < oy - 1))) edge.push((y * w + xx) * 4);
      for (const k2 of edge) { d[k2] = ink[0]; d[k2 + 1] = ink[1]; d[k2 + 2] = ink[2]; d[k2 + 3] = 255; }
      x.putImageData(im, 0, 0);
      let a0 = w, a1 = -1; for (let xx = 0; xx < w; xx++) if (on(xx, Math.min(h - 1, oy))) { a0 = Math.min(a0, xx); a1 = xx; } // where it meets the water, for its foam
      return { c, ox, oy, wl: [a0 - ox, a1 - ox] };
    },
    /** a model point of a toy turned to `phi`, where it falls on the screen from the toy's middle at the water (pixels) */
    proj(m, phi, s) { const p = 13 * Math.PI / 180, th = (phi - 90) * Math.PI / 180, wx = m[0] * Math.cos(th) + m[2] * Math.sin(th), wz = -m[0] * Math.sin(th) + m[2] * Math.cos(th); return [wx * s, -(m[1] * Math.cos(p) - wz * Math.sin(p)) * s]; },
    /** the duck and the tug, each frame of their turn ray-cast the first time it is wanted (a few thousandths of a second
     *  each, once a visit at most) and kept: every 7.5 degrees from facing left to facing right */
    toyFrame(kind, s, i) {
      const key = kind + s + ":" + S.W; let set = S.toys && S.toys[key]; if (!set) { S.toys = S.toys && Object.keys(S.toys).length < 6 ? S.toys : {}; set = S.toys[key] = []; }
      if (!set[i]) set[i] = kind === "duck" ? S.toy(TOY.duck, TOY.dm, -90 + i * 7.5, s, TOY.dInk) : S.toy(TOY.tug, TOY.tm, -90 + i * 7.5, s, TOY.tInk);
      return set[i];
    },
    /** an hour egg, drawn in two layers: what is out beyond the headland (`front` false), behind its cliff; what is in the bay */
    hourAt(T, I, A, pl, setE, front) { if (pl.duck && front) S.duckAt(T, I, A, pl.duck, setE); if (pl.pirate) S.pirateAt(T, I, A, pl.pirate, front); },
    /** the black ship's course (the first hour egg). She comes in from past the headland under all her black sail, slowing,
     *  and rounds to broadside on; she shows her colours, the skull and crossbones run up her main; her ports open; she fires
     *  her four guns one after another — a flash, a burst of smoke, the
     *  ball arcing out and a column of water thrown up short of you — and the smoke rolls up her side; then she gets under way
     *  again and stands off, away from you, smaller and smaller toward the horizon, until the morning haze takes her. The swell
     *  from the shots rocks the boat at the pier; the lighthouse flashes after her, twice. `r`: her dice, for the smoke */
    piratePlan(r) {
      const { W, hz, portrait: pr } = S, k = pr ? .66 : 1, sw = Math.ceil(72 * k), sh = Math.ceil(67 * k), yw = hz + (pr ? 19 : 18), xs = Math.round(W * (pr ? .2 : .585));
      const fire = [5.5, 5.95, 6.4, 6.85], ports = [26.5, 31.5, 36.5, 41.5].map(x => Math.round(x * k)), py = Math.round(yw - 4.4 * k);
      const splash = fire.map((t, i) => ({ t: t + .55, x: xs + ports[i] + Math.round((i * 2.6 - 4.2) * k + (r() - .5) * 4 * k), y: yw + Math.round((pr ? 22 : 30) + (i % 2 ? 4 : 0) * k + r() * 3), h: Math.round((pr ? 9 : 14) + r() * 3) }));
      const smoke = []; // a burst out of each port, then the bank rolling up her side and over her waist, thinning off downwind
      fire.forEach((t, i) => { smoke.push({ t, x: xs + ports[i] + 1, y: py + 2, vx: 1.2 + r(), vy: -1.4 - r(), r1: (6 + r() * 2) * k, out: 9.8 + r() * 1.4 }); smoke.push({ t: t + .05, x: xs + ports[i] - 2 * k, y: py + 5 * k, vx: -.6 - r(), vy: -.4, r1: (4 + r() * 2) * k, out: 9 + r(), grey: true }); });
      for (let j = 0; j < 13; j++) { const u = (j % 5 + .5) / 5, v = Math.floor(j / 5); smoke.push({ t: 5.75 + j * .12 + r() * .1, x: xs + sw * (.16 + .62 * u) + (r() - .5) * 4 * k, y: yw - (3 + v * 9 + r() * 3) * k, vx: 1.4 + r() * 1.4, vy: -1.2 - r() * 1.6, r1: (7 + r() * 3) * k, out: 10 + r() * 2, grey: j % 3 === 1 }); }
      return { k, sw, sh, yw, xs, fire, ports, py, splash, smoke, sail: [.5, 4.6], away: [7.8, 13.9] };
    },
    /** the black ship, side on, bow to the left, painted by rule at scale k (1: a desktop's): her hull and castles, a wale
     *  along her, her gun ports (shut, or open with the red of their lids up and the guns' mouths dark), the stern gallery's
     *  lit windows and its gilt rail; her masts, yards and rigging, her black sails bellied out and ragged along their feet, a
     *  shot-hole or two, a jib to the bowsprit and a lateen on the mizzen. Her flags are laid on live. Kept by size */
    shipSide(k, open) {
      k = Math.round(k * 40) / 40; const key = k * 40 + (open ? "o" : "s"); S.ships = S.ships && S.ships.W === S.W ? S.ships : { W: S.W }; if (S.ships[key]) return S.ships[key]; // (sizes in fortieths, so a moment draws the same however it was reached)
      const C = { hull: rgb("#3A302B"), hullLo: rgb("#2A2320"), rail: rgb("#6E5D50"), wale: rgb("#56473D"), port: rgb("#121817"), lid: rgb("#8E3B33"), lidHi: rgb("#B4544A"), gun: rgb("#3C4544"),
        win: rgb("#FFE3A0"), winLo: rgb("#C9A35E"), gold: rgb("#B89A5A"), mast: rgb("#2A2F2E"), rig: rgb("#56625F"), sail: rgb("#232A29"), sailHi: rgb("#36403E"), sailLo: rgb("#171C1C"), sailEdge: rgb("#11171A") };
      const Wd = Math.ceil(72 * k), Hd = Math.ceil(67 * k), wl = Hd - 1, X = v => v * k, Y = v => wl - (58 - v) * k; // design units (58: the waterline) → pixels
      const hullPts = [[17, 58], [13.5, 54], [11, 50.5], [8.5, 47.2], [14, 47.2], [15, 45.6], [22, 45.6], [23, 48.6], [46, 48.6], [47, 46.6], [55, 46.6], [56, 43.6], [66, 42.8], [68.2, 43.8], [67, 50], [65.4, 55], [63.6, 58]].map(([x, y]) => [X(x), Y(y)]);
      const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
      const sails = [[21, 13, 18, 4], [21, 20, 28.5, 6.2], [21, 31, 42, 8.4], [37, 6, 12.5, 5.6], [37, 15, 25.5, 8.4], [37, 28, 41, 10.4]]; // [mast, top, foot, half width]: the fore (the farther), then the main
      const masts = [[21, 8, 45.6], [37, -2, 48.6], [55, 15, 43.6]], jib = [[20, 17], [5, 37.2], [14.5, 41.4]].map(([x, y]) => [X(x), Y(y)]), lateen = [[50.5, 39.5], [61.5, 17.5], [62.6, 40.5]].map(([x, y]) => [X(x), Y(y)]);
      const lines = [[[21, 8], [2, 37.4]], [[37, 1], [21.5, 44]], [[55, 15], [67.4, 42.8]], [[37, 27], [31, 48.6]], [[37, 27], [43, 48.6]], [[21, 30], [16, 45.6]], [[21, 30], [26.5, 45.6]], [[55, 29], [51, 43.6]], [[55, 29], [59.5, 43.6]], [[13.5, 46.6], [1, 37], 1]].map(([a, b, w]) => [[X(a[0]), Y(a[1])], [X(b[0]), Y(b[1])], w]);
      const px = new Array(Wd * Hd).fill(null), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < Wd && y < Hd) px[y * Wd + x] = c; };
      const ln = ([x0, y0], [x1, y1], c, w) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; set(x, y, c); if (w && k > .8) set(x, y + 1, c); } };
      for (const [a, b, w] of lines) ln(a, b, w ? C.mast : C.rig, w); // the rigging (behind the sails), the bowsprit
      for (const [mx, top, bot] of masts) for (let y = Math.round(Y(top)); y <= Math.round(Y(bot)); y++) set(X(mx), y, C.mast);
      for (const [mx, top, bot, hw] of sails) { const cx = X(mx), t = Y(top), b = Y(bot), h2 = X(hw);
        for (let y = Math.floor(t); y <= Math.ceil(b); y++) { const v = clamp((y - t) / (b - t)), bulge = Math.sin(Math.PI * v) * 1.3 * k;
          for (let x = Math.floor(cx - h2 - 2); x <= Math.ceil(cx + h2 + 2); x++) { const u = (x + .5 - cx) / (h2 + bulge), foot = b - 1.6 * k * (1 - u * u); if (Math.abs(u) > 1 || y + .5 < t || y + .5 > foot + .5) continue;
            if (y + .5 > foot - .6 && ((Math.floor(x / Math.max(1, k * 2.2)) * 7 + mx) % 5 === 0)) continue; // ragged along the foot
            const sh2 = u * .55 + (v - .35); set(x, y, u < -.88 ? C.sailEdge : Math.abs(u) > .88 || y + 1.5 > foot || sh2 > .62 ? C.sailLo : sh2 < -.18 ? C.sailHi : C.sail); } }
        if (k > .8 && hw > 7) for (const [hx, hy] of [[mx - hw * .3, top + (bot - top) * .55], [mx + hw * .45, top + (bot - top) * .3]]) set(X(hx), Y(hy), null); // a shot-hole or two
        ln([cx - h2 - 1.2, t], [cx + h2 + 1.2, t], C.mast); } // its yard
      for (const pts of [jib, lateen]) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) if (inPoly(pts, x + .5, y + .5)) set(x, y, inPoly(pts, x + 1.5, y + .5) && inPoly(pts, x - .5, y + .5) && inPoly(pts, x + .5, y + 1.5) ? C.sail : C.sailLo); }
      ln(lateen[0], lateen[1], C.mast);
      for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { if (!inPoly(hullPts, x + .5, y + .5)) continue; set(x, y, !inPoly(hullPts, x + .5, y - .5) ? C.rail : wl - y < 1 ? C.hullLo : Math.abs(y - Y(51.8)) < .55 * Math.max(1, k) && x > X(15) && x < X(62) ? C.wale : C.hull); }
      for (const [x, y] of [[57.5, 45.6], [60, 45.4], [62.5, 45.2], [64.6, 45]]) { set(X(x), Y(y), C.win); if (k > .8) set(X(x), Y(y) + 1, C.winLo); } // the stern gallery's windows
      for (let x = X(56.4); x < X(66); x++) set(x, Y(44.4), C.gold); set(X(9.4), Y(47.8), C.gold); // its gilt rail; the figurehead
      if (k > .45) for (const x of [26.5, 31.5, 36.5, 41.5, 50.5]) { const y = Y(x > 45 ? 51.6 : 53.6), s2 = k < .8 ? 1 : 2; for (let j = 0; j < s2; j++) for (let i = 0; i < s2; i++) set(X(x) + i, y + j, open ? C.port : C.hullLo);
        if (open) { for (let i = 0; i < s2; i++) set(X(x) + i, y - 1, i ? C.lid : C.lidHi); set(X(x) + s2 - 1, y + s2 - 1, C.gun); } } // the ports: open, the lid up and the gun's mouth in the dark
      return (S.ships[key] = { c: paint(Wd, Hd, (x, y) => px[y * Wd + x]), wl, flag: [X(37), Y(-2)], pennant: [X(21), Y(8)] });
    },
    /** the black ship's morning */
    pirateAt(T, I, A, e, front) {
      if (!front) return;
      const { W, hz, portrait: pr } = S, foam = S.cFoam, k0 = e.k, [a0, a1] = e.away, [s0, s1] = e.sail;
      const gsm = S.gunsmoke || (S.gunsmoke = S.puffs(rgb("#FFFFFF"), rgb("#ECF3F1"), rgb("#C6D8D4"), 12)), gsg = S.gunsmokeG || (S.gunsmokeG = S.puffs(rgb("#F2F6F5"), rgb("#D5E1DE"), rgb("#AEC2BE"), 12));
      // where she is: in under sail, slowing to rest broadside on; then away, smaller toward the horizon, into the haze
      const inU = seg(T, s0, s1, E.out), awU = seg(T, a0, a1, x => x * x * (3 - 2 * x)), kk = k0 * lerp(1, .3, awU), fade = 1 - seg(T, a1 - 2.2, a1, E.sine);
      const sp = S.shipSide(kk, T > 4.95 && T < a0 + 2), kick = e.fire.reduce((m, t) => Math.max(m, env(T, t, t + .03, t + .08, t + .26)), 0);
      const xL = T < a0 ? lerp(W + 2, e.xs, inU) - (T > s1 ? (T - s1) * .5 : 0) : e.xs - (a0 - s1) * .5 - awU * e.sw * .2 + (e.sw - sp.c.width) * .5; // (drifting a little while hove to; then away, mostly toward the horizon)
      const yw = Math.round(lerp(e.yw, hz + 2, E.out(awU))), bob = Math.round(Math.sin(A * 1.1) * .7 * (1 - awU)), X0 = Math.round(xL), Y0 = yw - sp.wl + bob + Math.round(kick), al = I * fade;
      if (T > s0 && fade > 0 && X0 < W) {
        const moving = T < s1 - .3 || T > a0 + .2, roll = Math.sin(A * .9) * .8 * (1 - awU); // her masts rock a little as she rolls
        g.globalAlpha = al * .2; for (let rr = 1; rr < Math.min(12, sp.wl); rr += 2) g.drawImage(sp.c, 0, sp.wl - rr, sp.c.width, 1, X0 + Math.round(Math.sin(A * 3 + rr) * .8), Y0 + sp.wl + rr, sp.c.width, 1); // her reflection, broken
        g.globalAlpha = al; const bands = 4, bh = Math.ceil(sp.c.height / bands); for (let b2 = 0; b2 < bands; b2++) { const o = Math.round(roll * (1 - (b2 + .5) / bands) * 1.6); g.drawImage(sp.c, 0, b2 * bh, sp.c.width, bh, X0 + o, Y0 + b2 * bh, sp.c.width, bh); }
        // the skull and crossbones at her main (once she shows it), and a red pennant at the fore, streaming out and rippling
        const fl = S.jolly || (S.jolly = sprite(["###########", "####WWW####", "###WWWWW###", "###W#W#W###", "####WWW####", "##W##W##W##", "###WW#WW###", "##W#####W##", "###########"], { "#": rgb("#141918"), W: rgb("#F2F5F4") }));
        const hoist = seg(T, 4.55, 5.2, E.out), fk = Math.max(.34, kk * (pr ? 1.1 : 1)), fw = Math.max(3, Math.round(fl.width * fk * (.3 + .7 * hoist))), fh = Math.max(2, Math.round(fl.height * fk)), fx = X0 + Math.round(sp.flag[0] + roll * 1.4), fy = Y0 + Math.round(lerp(sp.wl - 14 * kk - fh, sp.flag[1], hoist));
        if (hoist > 0) for (let c = 0; c < fw; c++) { const dy = Math.round(Math.sin(A * 7 - c * .7) * Math.min(1, c / 4) * fk * 1.2 * hoist); g.drawImage(fl, Math.floor(c * fl.width / fw), 0, 1, fl.height, fx + 1 + c, fy + dy, 1, fh); } // she shows her colours as she rounds to: up her main from the deck, bunched, and out at the top
        g.fillStyle = S.cPen || (S.cPen = css(rgb("#A8443A"))); const pl2 = Math.round(10 * kk), pxx = X0 + Math.round(sp.pennant[0] + roll * 1.2), pyy = Y0 + Math.round(sp.pennant[1]); for (let c = 0; c < pl2; c++) { if (c > pl2 * .7 && c % 2) continue; g.fillRect(pxx + 1 + c, pyy + Math.round(Math.sin(A * 8 - c * .8) * Math.min(1, c / 3)), 1, 1); }
        g.globalAlpha = al; g.fillStyle = foam; // the water at her bow and her wake, under way
        if (moving) { const sp2 = T < s1 ? 1 - inU : awU < 1 ? .6 : 0; g.globalAlpha = al * clamp(sp2 * 2); g.fillRect(X0 + Math.round(14 * kk), Y0 + sp.wl, Math.round(4 * kk) + 1, 1); g.fillRect(X0 + Math.round(12 * kk), Y0 + sp.wl - 1, 2, 1); S.wake(X0 + Math.round(64 * kk), Y0 + sp.wl + 1, -1, Math.round(8 * kk) + 2, al * clamp(sp2 * 2)); }
        g.globalAlpha = al * .7; g.fillRect(X0 + Math.round(16 * kk), Y0 + sp.wl + 1, Math.round(48 * kk), 1);
      }
      // her guns: a flash at the port, the ball out toward you, a column of water thrown up short, rings spreading
      e.fire.forEach((t, i) => { const q = T - t, px2 = e.xs + e.ports[i], sp3 = e.splash[i];
        if (q > 0 && q < .1) { const big = q < .05 ? 1 : 0; g.globalAlpha = I; g.fillStyle = S.cFlash || (S.cFlash = css(rgb("#FF9F43"))); g.fillRect(px2 - 1 - big, e.py, 4 + big * 2, 2); g.fillRect(px2, e.py - 1 - big, 2, 4 + big * 2); g.fillStyle = S.cFlashHi || (S.cFlashHi = css(rgb("#FFF4C8"))); g.fillRect(px2, e.py, 2, 2); }
        const u = q / .55; if (u > 0 && u < 1) { const bx = lerp(px2 + 1, sp3.x, u), by = lerp(e.py + 1, sp3.y, u * u) - Math.sin(Math.PI * u) * 7 * k0; g.globalAlpha = I; g.fillStyle = S.cBall || (S.cBall = css(rgb("#1E2422"))); const bs = u > .5 && k0 > .8 ? 2 : 1; g.fillRect(Math.round(bx), Math.round(by), bs, bs); }
        S.splashAt(T - sp3.t, sp3, I); });
      // the smoke: out of each port in a burst, then rolling up her side, swelling, drawing apart as it thins off downwind —
      // laid on one layer first, so the bank thins as one cloud and not as a heap of discs
      const sl = S.smokeL && S.smokeL[0].width === W ? S.smokeL : (S.smokeL = canvas(W, S.H)), sx = sl[1], keep = g; let any = false;
      sx.clearRect(0, 0, W, S.H); g = sx;
      for (const m of e.smoke) { const q = T - m.t; if (q <= 0) continue; const thin = seg(T, m.out - 2.2, m.out, E.sine); if (thin >= 1) continue; any = true;
        const rr = Math.max(1, Math.min(12, Math.round(m.r1 * (.3 + .7 * E.out(clamp(q / .45))) * (1 - .55 * thin)))), spr = (m.grey ? gsg : gsm)[rr - 1];
        g.globalAlpha = Math.min(1, q * 10) * (1 - thin * thin); g.drawImage(spr, Math.round(m.x + m.vx * q * (1 + q * .15) - rr), Math.round(m.y + m.vy * q - rr)); }
      g = keep; if (any) { g.globalAlpha = I * .97; g.drawImage(sl[0], 0, 0); }
      g.globalAlpha = 1;
    },
    /** a cannonball's splash, `q` seconds after it lands: a plume of water up out of the bay — a foot of foam, a narrow
     *  stem, a crown that widens and spills — spray flung out of the crown and falling back in drops, the plume falling in on
     *  itself, and a ring spreading after */
    splashAt(q, s, I) {
      if (q <= 0 || q > 1.8) return; const foam = S.cFoam, hi = S.cSpout, lo = S.cSpoutLo, x = s.x, y = s.y, h = s.h, k = S.portrait ? .7 : 1;
      const up = q < .2 ? E.out(q / .2) : 1, down = E.in(clamp((q - .45) / .6)), top = Math.round(h * up * (1 - down * .9)), spread = E.out(clamp((q - .06) / .45));
      g.globalAlpha = I;
      for (let r = 0; r < top; r++) { const f = r / Math.max(1, top - 1), hw = (f < .16 ? 2.6 - f * 8 : f < .62 ? 1.1 + f * .6 : 1.5 + (f - .62) * (4 + 5 * spread)) * (k < 1 ? .8 : 1), jig = (((r * 7 + x * 3) % 5) - 2) * .22;
        const x0 = Math.round(x - hw + jig), x1 = Math.round(x + hw + jig); g.fillStyle = hi; g.fillRect(x0, y - r, Math.max(1, x1 - x0), 1); g.fillStyle = lo; g.fillRect(x1 - 1, y - r, 1, 1); }
      if (top > 2) { const cw = Math.round((1.5 + .38 * (4 + 5 * spread)) * (k < 1 ? .8 : 1)); g.fillStyle = hi; g.fillRect(x - cw + 1, y - top, cw * 2 - 1, 1); } // its rounded top
      for (let j = 0; j < 12; j++) { const t = q - .14 - (j % 4) * .05; if (t <= 0) continue; const side = j & 1 ? 1 : -1, vx = side * (4 + (j * 7 % 9)) * k, x2 = x + vx * t, y2 = y - h * (.75 + (j % 3) * .1) - h * 1.6 * t + 46 * k * t * t; if (y2 > y + 1) continue; // spray
        g.globalAlpha = I * (j % 3 ? .95 : .7); g.fillStyle = j % 4 ? hi : lo; g.fillRect(Math.round(x2), Math.round(y2), 1, 1); }
      const mound = q < 1.15 ? 1 - seg(q, .75, 1.15, x2 => x2) : 0; if (mound > 0) { g.globalAlpha = I * mound; g.fillStyle = foam; g.fillRect(x - 4, y + 1, 9, 1); g.fillRect(x - 2, y, 5, 1); }
      const rq = clamp((q - .25) / 1.55), rr = Math.round(3 + rq * 10 * k); if (rq > 0) { g.globalAlpha = I * (1 - rq) * .9; g.fillStyle = foam; g.fillRect(x - rr, y + 1, rr * 2 + 1, 1); g.fillRect(x - rr + 1, y, 2, 1); g.fillRect(x + rr - 2, y, 2, 1); }
      g.globalAlpha = 1;
    },
    /** puffs for the hour eggs, drawn once: a little cloud lit along its top, shaded under (steam, smoke, gunsmoke), radius 1 to n */
    puffs(lit, mid, shade, n = 9) { const out = []; for (let r = 1; r <= n; r++) out.push(paint(r * 2 + 1, r * 2 + 1, (x, y) => { const dx = x - r, dy = y - r, d = Math.hypot(dx, dy); if (d > r + .25) return null; return Math.hypot(dx + r * .28, dy + r * .42) < r * .82 ? lit : dy > r * .22 && Math.hypot(dx - r * .2, dy - r * .55) < r * .78 ? shade : mid; })); return out; },
    /** the duck's morning: the tug, the line, the duck, their reflections and wakes, the gull, the toots */
    duckAt(T, I, A, e, setE) {
      const sinp = Math.sin(13 * Math.PI / 180), face = (dx, dy) => Math.atan2(dx, dy / sinp) * 180 / Math.PI, fi = q => clamp(Math.round((q + 90) / 7.5), 0, 24), foam = S.cFoam, W = S.W;
      const st = e.sAt(T), sd = st - e.lag, [tx, ty, tdx, tdy] = e.at(st), [dx, dy, ddx, ddy] = e.at(sd), tf = fi(face(tdx, tdy)), df = fi(face(ddx, ddy)), tphi = -90 + tf * 7.5, dphi = -90 + df * 7.5;
      const steam = S.steam || (S.steam = S.puffs(rgb("#FFFFFF"), rgb("#F1F7F6"), rgb("#C9DCD8"))), smoke = S.smokeP || (S.smokeP = S.puffs(rgb("#C9D6D3"), rgb("#AFC0BC"), rgb("#97ABA7")));
      const end = clamp((14.85 - T) / .8); // whatever trails after them is gone with the pass
      // the tug's smoke, chugged out as it goes (drawn first: it drifts up behind)
      for (let t0 = .1; t0 < Math.min(T, 13.8); t0 += .5) { const age = T - t0; if (age > 2.4) continue; const s2 = e.sAt(t0), [px, py, pdx, pdy] = e.at(s2), [fx, fy] = S.proj([-.3, .9, 0], -90 + fi(face(pdx, pdy)) * 7.5, e.tk), sp = smoke[Math.min(3, 1 + Math.floor(age * 1.4))];
        g.globalAlpha = I * .55 * (1 - age / 2.4) * Math.min(1, age * 6); g.drawImage(sp, Math.round(px + fx + age * 2.6) - (sp.width >> 1), Math.round(py + fy - 1 - age * 3.6) - (sp.height >> 1)); }
      if (tx - e.tk * 1.3 > W && dx - e.k * .9 > W) { g.globalAlpha = 1; return; } // both out past the headland
      const tb = Math.round(Math.sin(A * 2.2 + 1) * .6), db = Math.round(Math.sin(A * 1.3) * .7 + setE * Math.sin(T * 4.4) * 1.6); // the tug's chop; the duck's slow bob, and the swell under it
      const TG = S.toyFrame("tug", e.tk, tf), DK = S.toyFrame("duck", e.k, df), TX = Math.round(tx), TY = Math.round(ty) + tb, DX = Math.round(dx), DY = Math.round(dy) + db;
      const wake = (s0, n, a, gap) => { g.fillStyle = foam; for (let j = 0; j < n; j++) { const [x, y] = e.at(s0 - j * gap); g.globalAlpha = I * a * end * (1 - j / n); g.fillRect(Math.round(x) - 1 + (j & 1), Math.round(y) + 1 + (j % 3 === 2 ? 1 : 0), 2, 1); } };
      const boat = (B, X, Y, wa) => { // its broken reflection, then it, then the water breaking round it
        g.globalAlpha = I * .22; for (let r = 1; r < Math.min(B.oy, 16); r += 2) g.drawImage(B.c, 0, B.oy - r, B.c.width, 1, X - B.ox + Math.round(Math.sin(A * 3 + r * .9) * .8), Y + r, B.c.width, 1);
        g.globalAlpha = I; g.drawImage(B.c, X - B.ox, Y - B.oy);
        g.fillStyle = foam; g.globalAlpha = I * wa; g.fillRect(X + B.wl[0] - 1, Y + 1, B.wl[1] - B.wl[0] + 3, 1); g.globalAlpha = I * wa * .6; g.fillRect(X + B.wl[0] - 2, Y + 2, 2, 1); g.fillRect(X + B.wl[1] + 1, Y + 2, 2, 1); };
      const line = () => { const [ax, ay] = S.proj([-1.02, .14, 0], tphi, e.tk), [bx, by] = S.proj([.5, .16, 0], dphi, e.k), x0 = TX + ax, y0 = TY + ay, x1 = DX + bx, y1 = DY + by, n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
        g.globalAlpha = I * .9; g.fillStyle = S.cLine || (S.cLine = css(P.nesD)); for (let j = 0; j <= n; j++) { const u = j / n; g.fillRect(Math.round(lerp(x0, x1, u)), Math.round(lerp(y0, y1, u) + Math.sin(u * Math.PI) * 2.2), 1, 1); } };
      wake(st - e.tk * 1.1, 9, .85, 2.6); wake(sd - e.k * .55, 12, .9, 3);
      // as it comes round, the water rings out from under it
      for (const t0 of [6.9, 7.8, 8.7]) { const q = (T - t0) / 1.9; if (q <= 0 || q >= 1) continue; const rx = e.k * (.42 + q * .5), ry = rx * .24; g.fillStyle = foam; for (let j = 0; j < 40; j++) { const th = j / 40 * 6.283, sy = Math.sin(th); g.globalAlpha = I * (1 - q) * (sy > 0 ? .85 : .45); g.fillRect(Math.round(dx + Math.cos(th) * rx), Math.round(dy + 1 + sy * ry), 1, 1); } }
      if (ty <= dy) { boat(TG, TX, TY, .7); line(); boat(DK, DX, DY, .9); } else { boat(DK, DX, DY, .9); line(); boat(TG, TX, TY, .7); } // the nearer one in front
      // two toots of steam from the tug's whistle
      for (const t0 of e.toots) { const age = T - t0; if (age <= 0 || age > 1.3) continue; const [fx, fy] = S.proj([-.14, .96, 0], tphi, e.tk), sp = steam[Math.min(S.portrait ? 3 : 4, 1 + Math.floor(age * 5))], X = TX + fx, Y = TY + fy;
        g.globalAlpha = I * (1 - age / 1.3) * Math.min(1, age * 10); g.drawImage(sp, Math.round(X + age * 2) - (sp.width >> 1), Math.round(Y - 2 - age * 8) - (sp.height >> 1));
        if (age < .32) { g.globalAlpha = I * (1 - age / .32); g.fillStyle = S.cLine || (S.cLine = css(P.nesD)); const o = Math.round(age * 6); g.fillRect(X - 3 - o, Y - 4 - o, 1, 2); g.fillRect(X + 3 + o, Y - 4 - o, 1, 2); g.fillRect(X - 1, Y - 6 - o, 2, 1); } } // and its toot, in three strokes
      // the gull: in from the sky, a swoop round, down onto its head as it faces you; then it rides
      const [g0, g1] = e.gull, [hx, hy] = S.proj([.3, 1.07, 0], dphi, e.k), HX = DX + hx, HY = DY + hy;
      if (T > g0) { if (T < g1) { const u = E.sine(seg(T, g0, g1, x => x)), P0 = [W + 10, S.hz - 58], P1 = [W * .88, S.hz - 74], P2 = [HX + 26, HY - 34], P3 = [HX, HY - 4], b = i2 => (1 - u) ** 3 * P0[i2] + 3 * (1 - u) ** 2 * u * P1[i2] + 3 * (1 - u) * u * u * P2[i2] + u ** 3 * P3[i2];
          const fr = u > .86 ? 1 : [0, 1, 2, 1][Math.floor(T * 7) % 4]; g.globalAlpha = I; g.drawImage(S.gull[fr], Math.round(b(0)) - 3, Math.round(b(1)) - 2); }
        else { const sit = S.sitGull || (S.sitGull = sprite([".##.....", "####....", ".#####..", "..######", "...##..."], { "#": P.nesD })); g.globalAlpha = I; g.drawImage(sit, HX - 3, HY - 5); } }
      g.globalAlpha = 1;
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; N: the pass (0, the signature) */
    draw(T, I, A, F, N = 0) {
      const { W, H, hz, pier: pr, light: L } = S, TAU = 6.283;
      if (N !== S.planP) { const h = N > 0 ? K.long(N) : 0; S.pl = N > 0 ? (K.egg(N) ? S.eggPlan(N) : h === 1 || h === 2 ? S.hourPlan(N, h) : S.dealPass(N)) : S.sig(); S.planP = N; } // (b424: an hour egg; the crown's pass, 3, deals as it did)
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
      if (pl.egg && I > .01) S.masked(() => S.nessieAt(T, I, A, pl.egg)); // the egg, out on the bay
      if (pl.hour && I > .01) S.masked(() => S.hourAt(T, I, A, pl, setE, false)); // b424: an hour egg, what of it is out beyond the headland
      g.drawImage(S.bgFront, 0, 0);
      // the lamp: a slow glow always, its flashes in the loop
      let fsum = 0; for (const f of pl.flashes) fsum += env(T, f[0], f[1], f[2], f[3], E.sine);
      const flash = fsum * I, ly = S.lampY;
      g.fillStyle = css(P.lamp, clamp((.25 + .12 * Math.sin(A * 1.6) + flash * .75) * .6)); g.fillRect(L.x - 2, ly, 5, 1);
      if (flash > .08) { g.fillStyle = css(P.lampHi, clamp(flash)); g.fillRect(L.x - 1, ly, 3, 1); g.fillStyle = css(P.lamp, flash * .45); const k = Math.round(10 * flash); g.fillRect(L.x - k, ly, k * 2 + 1, 1); g.fillRect(L.x, ly - Math.round(k * .5), 1, k + 1); }
      g.drawImage(S.moored, pr.x1 - S.moored.width - 2, pr.y + 3 + Math.round(Math.sin(A * 1.6) * .8 + setE * Math.sin(T * 6) * 1.2));
      if (pl.hour && I > .01) S.masked(() => S.hourAt(T, I, A, pl, setE, true)); // and what of it is in the bay
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
