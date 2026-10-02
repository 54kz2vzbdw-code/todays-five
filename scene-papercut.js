// scene-papercut.js — 1.12 b321: Paper's and Midnight's scene, one pop-up paper town by day and by night (scenes.js
// loads it for either kit and says which). Cut paper: flat shapes in paper colours, each laying a soft shadow on the
// layer behind, a grain over all of it; what never moves is laid down once on the backdrop, and each frame moves only
// the rest. The day's loop, fifteen seconds: a breeze through the trees and the windmill; a paper plane loops the loop
// and leaves a dotted line; a red steam train runs along the viaduct, puffing paper steam; the kite lying on the near
// bank is lifted by the wind and climbs, its bows streaming, flies a while and comes down to rest; paper birds cross the
// sky as the sun's rays turn a notch. The night's: the windows light across the town; a paper train crosses the
// viaduct, its reflection wobbling in the river; a cloud is let down on its thread across the moon and taken up again;
// cut-paper fireworks in glass colours; a star on a wire; the lights go out again. Whatever crosses the sky comes on
// from past one edge and goes all the way off another. The finales: paper cranes fly up past the sun; a fan of paper
// stars opens out of the moon. (b343: the train by day, the viaduct, the kite at rest, the exits, and the lines on pads.)
// 1.12 b384: the forever cycle. The first pass is the loop above, beat for beat; each pass after it deals its own, one
// beat to each of its parts from that part's pool (a pool plays through before any of it comes round again, and never
// the same beat twice running), each with its own side, height, colours, count and timing, so the town never plays the
// same fifteen seconds twice. By day, something across the sky to open: the paper plane's loop (or two planes in
// coloured paper chasing through a double loop, either way across), or a biplane towing a striped streamer; something
// along the viaduct: the red steam train either way, a blue express, a long goods train (logs, coal, a tanker, a box car
// and the caboose), or a cyclist with flowers in the basket; the showpiece in the open sky: the kite, a dragon kite flown
// from below the page with a tail of paper discs, or a balloon of paper gores that rises from behind the near bank and
// sails off on the wind; and to close: the paper birds, a gust that bends the trees and sends paper leaves tumbling
// across, or butterflies. By night the windows light in an order of the pass's own (across, back, from the middle out,
// here and there); the lit train runs either way, or a cyclist goes by with a lamp; the cloud comes down across the
// moon, or an owl glides across it, or a skein of geese; the fireworks go off as shards, as paper stars or as a
// drooping willow, or a balloon rises lit from inside by its burner, or a needle sews a constellation in gold thread
// and pulls the thread out again; and to close, the star on its wire, fireflies over the bank, or paper snow that
// melts where it lands. Rare, about once in eight passes each: a rainbow of paper bands laid across the valley, and a
// zeppelin, by day; curtains of tissue paper, the northern lights, let down on threads, and a comet on a wire, by
// night. Every one comes on from past an edge (or up from behind the bank, or lights, or is sewn) and goes all the way
// off (or back down, or out, or melts); nothing carries from one pass to the next.
// 1.12 b385: a long list's last lines lie over the town, and a struck line's quiet grey has no room for the hills, the
// trees and the river under it (the stage's pad leaves a fifth of the picture showing). By day the picture is put in
// the paper's own ground under each line that reaches down over the town, softly, over whatever passes there; above
// it, and everywhere else, it keeps its colour.
// 1.12 b415: the egg. Every twelfth pass (K.egg), for whoever has left the list alone three minutes, the town turns out
// to be a page of a pop-up book. The sun (by night the moon) and the clouds are drawn up out of sight on their threads;
// the page turns — its corner lifts, the leaf curls over the screen and lies back, its underside up — and each house,
// tree and the windmill folds flat just before the leaf reaches it; behind the leaf, on the next page, the same town
// springs up in snow, piece by piece: snow on the roofs and the pines, the chimneys smoking, the river frozen and icicles
// under the viaduct, a pale winter sun (by night a great full moon) let down on its thread among snow clouds, paper snow
// falling, and a snowman on the bank who lifts his hat. Then the leaf turns back, the snow folds away ahead of it, and
// the town stands up again behind it as it was. Each page's landscape is printed on it; what stands on it is cut out and
// folds. While the winter's page is up the backdrop holds it (laid in once; the summer's is kept and put back pixel for
// pixel), so a frame draws only what moves.
export default function papercut(K, id) {
  const night = id === "midnight";
  const { clamp, lerp, E, seg, env, rng, canvas, grain, noise1, fbm } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  const DAY = {
    skyTop: "#E9DCC2", skyLow: "#F7F1E5", sun: "#E0603F", sunLo: "#CF5236", ray: "#EE9B7F", thread: "rgba(96,74,50,.32)",
    cloud: "#FFFDF8", cloudLo: "#EFE6D6", back: "#DDC79B", mid: "#C0CEA0", front: "#A7BC88", near: "#92AA77",
    river: "#A6C8CA", riverHi: "#D6E8E4", bridge: "#F3EAD6", wall: "#FFFBF3", wallLo: "#EFE5D0", roof: ["#C8321F", "#B8573E", "#D07C55", "#A84935"],
    window: "#8C7C66", door: "#9A5838", tree: ["#86A36A", "#9AB57C", "#76925E"], trunk: "#8A7258", mill: "#F7EFDF", millLo: "#E3D6BE", sail: "#EFE5D0",
    kite: "#C8321F", kiteHi: "#E46D55", bow: ["#FDF8EF", "#C8321F"], paper: "#FFFFFF", fold: "#E4DBCA", trail: "rgba(200,50,31,.5)", rim: "rgba(255,255,255,.5)",
    bird: "#B39670", birdFold: "#9C7F5B", origami: [["#C8321F", "#A82A1A"], ["#E0A33C", "#C68A2A"], ["#5F8EA6", "#4C7890"], ["#FFFFFF", "#E4DBCA"]],
    shadow: "rgba(92,68,36,.24)", grainK: .07,
  };
  const NIGHT = {
    skyTop: "#0A1020", skyLow: "#1B2745", moon: "#F2E8CC", moonLo: "#DACCA9", thread: "rgba(200,215,255,.2)",
    cloud: "#2A3756", cloudLo: "#212B47", cloudHi: "#5A6DA0", back: "#1B2747", mid: "#213058", front: "#283A69", near: "#1D2A4C",
    river: "#15203D", riverHi: "#2E4070", bridge: "#2D3B62", wall: "#2F3E68", wallLo: "#26335A", roof: ["#1D294A", "#233050", "#1B2645"], rim: "rgba(120,150,220,.55)",
    window: "#141B32", lit: "#FFD98A", litHi: "#FFF3CF", door: "#18203A", tree: ["#1B2845", "#22304F", "#19243F"], trunk: "#131A2F",
    mill: "#2B375C", millLo: "#232E4E", sail: "#364471", star: "#FFF4D6", train: "#2F3D64", trainHi: "#40517F",
    glass: ["#7FB3FF", "#B9A6FF", "#FFD98A", "#8FE3D0", "#FF9FC4"], shadow: "rgba(0,0,0,.42)", grainK: .05,
  };
  const P = night ? NIGHT : DAY;

  /** a sprite drawn in CSS pixels at the screen's own density, with its size remembered */
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
  /** canvas shadows are in device pixels whatever the transform: scaled here so they read the same on every screen */
  const shade = (x, blur = 6, dx = -1.5, dy = 2.5, col = P.shadow) => { x.shadowColor = col; x.shadowBlur = blur * px; x.shadowOffsetX = dx * px; x.shadowOffsetY = dy * px; };
  const unshade = x => { x.shadowColor = "transparent"; x.shadowBlur = 0; x.shadowOffsetX = 0; x.shadowOffsetY = 0; };
  const put = (spr, x, y, ax = .5, ay = .5, rot = 0, sx = 1, sy = 1, a = 1) => {
    if (a <= 0) return; g.save(); g.globalAlpha = clamp(a); g.translate(x, y); if (rot) g.rotate(rot); if (sx !== 1 || sy !== 1) g.scale(sx, sy);
    g.drawImage(spr, -spr.w2 * ax, -spr.h2 * ay, spr.w2, spr.h2); g.restore();
  };

  /* 1.12 b384, the forever cycle: the plan of the pass that is up, dealt once when it comes up (and again after a layout) */
  let plan = null, gen = 0;
  const vel = (x, y, r) => .45 + .55 * S.shade(x, y, r); // under vellum where it passes behind a line
  const turnTo = (a, b, t) => a + (((b - a) % TAU + TAU * 1.5) % TAU - Math.PI) * t;
  /** a thread stroked in short pieces, each as strong as `S.shade` says there, so it fades where it passes near or behind
   *  the words (the bar's small ones too) and comes back past them; pieces of one strength go in one stroke. `pts` holds
   *  `n` points as x, y pairs; each of `passes` is [lineWidth, alpha, colour] */
  const QS = new Uint8Array(4096);
  function fadedLine(pts, n, r, passes) {
    let m = 0; const step = 6;
    for (let i = 0; i < n - 1 && m < QS.length - 64; i++) { const x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[i * 2 + 2], y1 = pts[i * 2 + 3], k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let j = 0; j < k; j++) QS[m++] = Math.round(S.shade(lerp(x0, x1, (j + .5) / k), lerp(y0, y1, (j + .5) / k), r) * 12); }
    for (const [lw, al, col] of passes) {
      g.lineWidth = lw; g.strokeStyle = col; let run = -1, q = 0;
      for (let i = 0; i < n - 1; i++) { const x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[i * 2 + 2], y1 = pts[i * 2 + 3], k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
        for (let j = 0; j < k; j++) { const v = QS[q++];
          if (v !== run) { if (run > 0) { g.globalAlpha = al * run / 12; g.stroke(); } run = v; if (v > 0) { g.beginPath(); g.moveTo(lerp(x0, x1, j / k), lerp(y0, y1, j / k)); } }
          if (v > 0) g.lineTo(lerp(x0, x1, (j + 1) / k), lerp(y0, y1, (j + 1) / k)); } }
      if (run > 0) { g.globalAlpha = al * run / 12; g.stroke(); }
    }
    g.globalAlpha = 1;
  }
  const LP = new Float32Array(256); // the points of a thread being drawn

  const S = {
    res: "dpr",
    wash: night ? 1 : 1.6, // a light kit's small words have no room for the picture under them (scenes.js)
    veil: night ? .5 : 1,
    hug: .82, // each line on a pad of the ground: a long list's last lines lie over the town, where the trains run
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, u = Math.sqrt(W * H) / 100;
      const Y = pr ? { back: .64, town: .675, river: .785, front: .85, near: .93 } : { back: .68, town: .728, river: .822, front: .878, near: .948 }; // on a wide screen, below the list's last line
      const n1 = noise1(5, 64), n2 = noise1(9, 64), n3 = noise1(13, 64), n4 = noise1(21, 64);
      const ridge = (base, amp, n, sc) => x => H * base - amp * fbm(n, x / sc, 3);
      const backY = ridge(Y.back, 6 * u, n1, 10 * u), townY = ridge(Y.town, 2.4 * u, n2, 16 * u), frontY = ridge(Y.front, 3.2 * u, n3, 12 * u), nearY = ridge(Y.near, 1.4 * u, n4, 7 * u);
      const r = rng(17); // the same town by day and by night
      const riverY = H * Y.river, riverH = H * (pr ? .038 : .042);
      Object.assign(S, { W, H, pr, u, backY, townY, frontY, nearY, riverY, riverH });
      S.orb = night ? (pr ? { x: W * .77, y: H * .165, r: 6.8 * u } : { x: W * .86, y: H * .18, r: 4.6 * u }) : (pr ? { x: W * .8, y: H * .205, r: 5.8 * u } : { x: W * .87, y: H * .19, r: 4 * u }); // clear of the top band's wash

      // clouds on threads
      const cloud = s => { const w = 17 * u * s, h = 7.2 * u * s, pad = 2.6 * u; return make(w + pad * 2, h + pad * 2, x => {
        shade(x, 7, -1.5, 3); x.fillStyle = P.cloud; x.beginPath();
        for (const [bx, by, br] of [[.2, .66, .3], [.4, .42, .42], [.63, .5, .36], [.82, .68, .26]]) { x.moveTo(pad + w * bx + h * br, pad + h * by); x.arc(pad + w * bx, pad + h * by, h * br, 0, TAU); }
        x.rect(pad + w * .16, pad + h * .62, w * .7, h * .36); x.fill(); unshade(x);
        x.fillStyle = P.cloudLo; x.fillRect(pad + w * .16, pad + h * .88, w * .7, h * .1);
        if (night) { x.fillStyle = P.cloudHi; x.globalAlpha = .55; x.beginPath(); x.arc(pad + w * .4, pad + h * .42, h * .42, -2.4, -.5); x.lineWidth = 1.2; x.strokeStyle = P.cloudHi; x.stroke(); x.globalAlpha = 1; }
      }); };
      S.clouds = (pr ? [[.17, .11, .95], [.5, .062, .78], [.9, .27, .7]] : [[.1, .085, 1], [.34, .045, .78], [.6, .12, .9], [.97, .33, .72]]).map(([x, y, s], i) => ({ x: W * x, y: H * y, spr: cloud(s), ph: i * 1.9 + .4 }));

      // the houses along the town hill, left of the windmill: the same houses by day and by night
      const span = pr ? [.04, .62] : [.47, .82];
      S.houses = [];
      for (let x = W * span[0]; x < W * span[1];) {
        const w = (3.4 + r() * 2.6) * u * (pr ? 1.25 : 1), h = w * (.72 + r() * .38), base = townY(x + w / 2) + .6 * u, roof = Math.floor(r() * 4);
        const wins = []; const n = w > 4.6 * u ? 2 : 1;
        for (let k = 0; k < n; k++) wins.push({ x: x + w * (n === 2 ? .2 + k * .42 : .36), y: base - h * .62, w: w * .2, h: h * .22, base: r() < .34, f: .05 + r() * .12, ph: r() * TAU });
        S.houses.push({ x, w, h, base, roof, wins, door: r() < .6 ? x + w * (n === 2 ? .42 : .62) : -1 });
        x += w + (.6 + r() * 1.6) * u;
      }
      S.windows = S.houses.flatMap(h => h.wins).map(w => ({ ...w, o: (w.x - W * span[0]) / (W * (span[1] - span[0])) }));
      // the windmill, right of the town
      const mx = W * (pr ? .83 : .91), mb = townY(mx) + .8 * u, mh = (pr ? 13 : 12) * u;
      S.mill = { x: mx, y: mb - mh, base: mb, h: mh, r: mh * .62 };
      S.millSail = make(S.mill.r * 1.1, S.mill.r * .34, x => { shade(x, 4, -1, 2); x.fillStyle = P.sail; x.fillRect(S.mill.r * .1, S.mill.r * .04, S.mill.r * .95, S.mill.r * .24); unshade(x); x.strokeStyle = P.millLo; x.lineWidth = .8; for (let k = 1; k < 5; k++) { const xx = S.mill.r * (.1 + k * .19); x.beginPath(); x.moveTo(xx, S.mill.r * .04); x.lineTo(xx, S.mill.r * .28); x.stroke(); } });
      S.millAngle = 0; S.lastA = null;
      // the viaduct's deck over the river, which the trains run along
      S.deckY = riverY - 1.5 * u;
      // trees: lollipops on the hills, each swaying from its foot
      const treeSpr = (s, c) => make(4.6 * u * s + 4 * u, 9 * u * s + 3 * u, x => { const w = 4.6 * u * s, pad = 2 * u; shade(x, 5, -1.2, 2.2); x.fillStyle = P.trunk; x.fillRect(pad + w / 2 - .35 * u, pad + w * .8, .7 * u, 9 * u * s - w * .8); x.fillStyle = c; x.beginPath(); x.arc(pad + w / 2, pad + w / 2, w / 2, 0, TAU); x.fill(); unshade(x); x.fillStyle = "rgba(255,255,255,.14)"; x.beginPath(); x.arc(pad + w * .62, pad + w * .38, w * .22, 0, TAU); x.fill(); });
      S.trees = [];
      const treeAt = (x, yf, s) => { const spr = treeSpr(s, P.tree[S.trees.length % 3]); S.trees.push({ x, y: yf(x) + .5 * u, spr, ph: r() * TAU, s, front: yf === frontY }); }; /* the near bank's stand in front of the viaduct */
      for (const f of (pr ? [.06, .64, .72] : [.43, .85, .96, .12])) treeAt(W * f, townY, .9 + r() * .3);
      for (const f of (pr ? [.1, .34, .66, .95] : [.06, .2, .56, .7, .9])) treeAt(W * f, frontY, 1 + r() * .35);

      // day: the paper plane's path (in, one loop, out and up), the pop-up house, the kite, the birds, the cranes
      if (!night) {
        const cy = pr ? H * .2 : H * .15, cx = pr ? W * .36 : W * .57, R = pr ? W * .09 : H * .075;
        S.planePath = [];
        for (let i = 0; i <= 160; i++) { const v = i / 160; let x, y;
          if (v < .4) { const k = v / .4; x = lerp(-W * .12, cx, k); y = lerp(cy + H * .035, cy, E.sine(k)); }
          else if (v < .72) { const th = (v - .4) / .32 * TAU; x = cx + R * Math.sin(th); y = cy - R * (1 - Math.cos(th)); }
          else { const k = (v - .72) / .28; x = lerp(cx, W * 1.14, k); y = lerp(cy, cy - H * .09, k * k); }
          S.planePath.push([x, y]); }
        S.plane = make(6 * u, 3 * u, x => { shade(x, 3, -.8, 1.6); x.fillStyle = P.paper; x.beginPath(); x.moveTo(6 * u, 1.3 * u); x.lineTo(0, 0); x.lineTo(1.4 * u, 1.3 * u); x.lineTo(0, 2.6 * u); x.closePath(); x.fill(); unshade(x); x.fillStyle = P.fold; x.beginPath(); x.moveTo(6 * u, 1.3 * u); x.lineTo(1.4 * u, 1.3 * u); x.lineTo(0, 2.6 * u); x.closePath(); x.fill(); });
        // the train: a red engine and three cream cars, right to left along the viaduct; its steam in puffs of paper
        const tW = 9 * u, tH = 3.4 * u, wheel = (x, xs, y, r0) => { x.fillStyle = "#5A4636"; for (const f of xs) { x.beginPath(); x.arc(f, y, r0, 0, TAU); x.fill(); } x.fillStyle = "#B8A58C"; for (const f of xs) { x.beginPath(); x.arc(f, y, r0 * .35, 0, TAU); x.fill(); } };
        S.tW = tW; S.tH = tH;
        S.dcar = make(tW + 2 * u, tH + 2.4 * u, x => { x.translate(u, u); shade(x, 3, -.8, 1.6); x.fillStyle = P.wall; x.beginPath(); x.roundRect(0, 0, tW, tH, .8 * u); x.fill(); unshade(x);
          x.fillStyle = P.kite; x.fillRect(0, tH * .68, tW, .5 * u); x.fillStyle = P.wallLo; x.fillRect(0, 0, tW, .45 * u); x.fillStyle = "#9CC0C8"; for (let k = 0; k < 3; k++) x.fillRect(tW * (.1 + k * .3), tH * .2, tW * .2, tH * .32); wheel(x, [tW * .22, tW * .78], tH, .62 * u); });
        S.dcar.foot = u + tH + .62 * u;
        S.dengine = make(tW + 2.8 * u, tH * 1.5 + 2.6 * u, x => { x.translate(1.8 * u, u); shade(x, 3, -.8, 1.6);
          x.fillStyle = "#4E3E30"; x.fillRect(tW * .1, 0, tW * .15, tH * .55); x.fillRect(tW * .07, 0, tW * .21, tH * .12); /* the chimney, its flared top */
          x.fillStyle = P.kite; x.beginPath(); x.roundRect(0, tH * .45, tW * .66, tH * 1.05, tH * .4); x.fill(); /* the boiler */
          x.fillStyle = P.wall; x.fillRect(tW * .6, tH * .1, tW * .4, tH * 1.4); x.fillStyle = P.kite; x.fillRect(tW * .56, 0, tW * .48, tH * .16); /* the cab and its roof */
          x.fillStyle = "#4E3E30"; x.beginPath(); x.moveTo(0, tH * 1.1); x.lineTo(-tW * .12, tH * 1.5); x.lineTo(0, tH * 1.5); x.closePath(); x.fill(); unshade(x); /* the cowcatcher */
          x.fillStyle = P.kiteHi; x.fillRect(tW * .04, tH * .55, tW * .56, tH * .14); x.fillStyle = "#9CC0C8"; x.fillRect(tW * .7, tH * .32, tW * .2, tH * .34);
          wheel(x, [tW * .12, tW * .34, tW * .56], tH * 1.5, .78 * u); wheel(x, [tW * .82], tH * 1.5, .62 * u); });
        S.dengine.foot = u + tH * 1.5 + .78 * u;
        S.puff = make(7 * u, 5.4 * u, x => { shade(x, 4, -1, 2); x.fillStyle = "#FFFFFF"; x.beginPath(); for (const [bx, by, br] of [[2.3, 3.1, 1.5], [3.6, 2.2, 1.9], [4.9, 3.2, 1.4]]) { x.moveTo((bx + br) * u, by * u); x.arc(bx * u, by * u, br * u, 0, TAU); } x.fill(); unshade(x);
          x.fillStyle = "rgba(170,150,125,.28)"; x.beginPath(); x.arc(3.6 * u, 3.4 * u, 1.9 * u, .15 * Math.PI, .85 * Math.PI); x.fill(); });
        S.kite = make(5 * u, 6.4 * u, x => { const w = 5 * u, h = 6.4 * u; shade(x, 4, -1, 2); x.fillStyle = P.kite; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w, h * .38); x.lineTo(w / 2, h); x.lineTo(0, h * .38); x.closePath(); x.fill(); unshade(x); x.fillStyle = P.kiteHi; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w, h * .38); x.lineTo(w / 2, h * .38); x.closePath(); x.fill(); x.beginPath(); x.moveTo(w / 2, h); x.lineTo(0, h * .38); x.lineTo(w / 2, h * .38); x.closePath(); x.fill(); x.strokeStyle = "rgba(255,248,236,.7)"; x.lineWidth = .7; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h * .38); x.lineTo(w, h * .38); x.stroke(); });
        S.bows = P.bow.map(c => make(2.6 * u, 1.6 * u, x => { shade(x, 2, -.5, 1); x.fillStyle = c; x.beginPath(); x.moveTo(0, 0); x.lineTo(1.3 * u, .8 * u); x.lineTo(0, 1.6 * u); x.closePath(); x.moveTo(2.6 * u, 0); x.lineTo(1.3 * u, .8 * u); x.lineTo(2.6 * u, 1.6 * u); x.closePath(); x.fill(); }));
        S.kiteAnchor = pr ? [W * .06, frontY(W * .06)] : [W * .715, frontY(W * .715)]; /* on the near bank, clear of the houses */
        S.kiteTop0 = pr ? [W * .15, H * .25] : [W * .79, H * .21]; S.kiteTop = S.kiteTop0.slice(); /* where it likes to fly; words() lowers it clear of the lines */
        const bird = up => make(4.4 * u, 2.6 * u, x => { shade(x, 2, -.5, 1.2); x.fillStyle = P.bird; x.beginPath(); x.moveTo(0, up ? .2 * u : 1.4 * u); x.lineTo(2.2 * u, 1.3 * u); x.lineTo(4.4 * u, up ? .2 * u : 1.4 * u); x.lineTo(2.2 * u, 2.2 * u); x.closePath(); x.fill(); unshade(x); x.fillStyle = P.birdFold; x.beginPath(); x.moveTo(2.2 * u, 1.3 * u); x.lineTo(4.4 * u, up ? .2 * u : 1.4 * u); x.lineTo(2.2 * u, 2.2 * u); x.closePath(); x.fill(); });
        S.bird = [bird(true), bird(false)];
        S.flock = Array.from({ length: 6 }, (_, i) => ({ dx: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 3.2 * u, dy: Math.ceil(i / 2) * 2.2 * u, ph: r() * TAU }));
        S.sunRays = make(S.orb.r * 3.4, S.orb.r * 3.4, x => { const c = S.orb.r * 1.7; shade(x, 5, -1, 2); x.fillStyle = P.ray; x.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, a0 = a - .13, a1 = a + .13; x.moveTo(c + Math.cos(a0) * S.orb.r * 1.08, c + Math.sin(a0) * S.orb.r * 1.08); x.lineTo(c + Math.cos(a) * S.orb.r * 1.62, c + Math.sin(a) * S.orb.r * 1.62); x.lineTo(c + Math.cos(a1) * S.orb.r * 1.08, c + Math.sin(a1) * S.orb.r * 1.08); x.closePath(); } x.fill(); });
        S.sunDisk = make(S.orb.r * 2.6, S.orb.r * 2.6, x => { const c = S.orb.r * 1.3, R = S.orb.r; shade(x, 6, -1.2, 2.4); x.fillStyle = P.sunLo; x.beginPath(); x.arc(c + R * .06, c + R * .07, R, 0, TAU); x.fill(); unshade(x); x.fillStyle = P.sun; x.beginPath(); x.arc(c - R * .03, c - R * .04, R * .95, 0, TAU); x.fill(); x.fillStyle = "rgba(255,240,225,.22)"; x.beginPath(); x.arc(c - R * .3, c - R * .32, R * .3, 0, TAU); x.fill(); });
        S.crane = P.origami.flatMap(([c, f]) => [0, 1].map(k => make(7 * u, 5 * u, x => { shade(x, 3, -.8, 1.6); x.fillStyle = c; x.beginPath(); x.moveTo(0, 2.6 * u); x.lineTo(2.6 * u, 3.2 * u); x.lineTo(4.2 * u, 3.2 * u); x.lineTo(7 * u, 1.2 * u); x.lineTo(4.4 * u, 2.4 * u); x.lineTo(3.4 * u, k ? .2 * u : 4.8 * u); x.lineTo(2.8 * u, 2.4 * u); x.closePath(); x.fill(); unshade(x); x.fillStyle = f; x.beginPath(); x.moveTo(2.8 * u, 2.4 * u); x.lineTo(3.4 * u, k ? .2 * u : 4.8 * u); x.lineTo(4.4 * u, 2.4 * u); x.closePath(); x.fill(); })));
        S.cranes = Array.from({ length: 10 }, (_, i) => ({ x0: W * (.08 + r() * .84), y0: H * (1.02 + r() * .1), dx: (r() - .3) * W * .25, d: r() * .3, s: .85 + r() * .5, ph: r() * TAU, c: i % 4 }));
        S.glints = Array.from({ length: pr ? 9 : 16 }, () => ({ x: r() * W, y: riverY + riverH * (.2 + r() * .6), w: (1.4 + r() * 2.4) * u, v: .3 + r() * .7, ph: r() * TAU }));
      } else {
        // night: the stars, the moon's cloud, the train, the fireworks, the star on its wire, the finale's fan
        S.stars = []; for (let i = 0; i < (pr ? 70 : 140); i++) { const x = r() * W, y = r() * backY(x) * .86; if (Math.hypot(x - S.orb.x, y - S.orb.y) < S.orb.r * 2.6) continue; S.stars.push({ x, y, s: .5 + r() * 1.1, tw: r() < .4, f: .6 + r() * 1.8, ph: r() * TAU }); }
        S.moonCloud = cloud(pr ? .72 : .8);
        const carW = 9 * u, carH = 3.4 * u;
        S.car = make(carW + 2 * u, carH + 2 * u, x => { shade(x, 3, -.8, 1.6); x.fillStyle = P.train; x.beginPath(); x.roundRect(u, u, carW, carH, .8 * u); x.fill(); unshade(x); x.fillStyle = P.trainHi; x.fillRect(u, u, carW, .6 * u); x.fillStyle = P.lit; for (let k = 0; k < 3; k++) x.fillRect(u + carW * (.12 + k * .3), u + carH * .32, carW * .16, carH * .3); });
        S.engine = make(carW + 2 * u, carH * 1.3 + 2 * u, x => { shade(x, 3, -.8, 1.6); x.fillStyle = P.train; x.beginPath(); x.roundRect(u, u + carH * .3, carW, carH, .8 * u); x.fill(); x.fillRect(u + carW * .12, u, carW * .28, carH * .4); unshade(x); x.fillStyle = P.lit; x.fillRect(u + carW * .6, u + carH * .55, carW * .22, carH * .3); x.fillStyle = P.litHi; x.beginPath(); x.arc(u + carW - .3 * u, u + carH * .95, .45 * u, 0, TAU); x.fill(); });
        S.carW = carW; S.carH = carH;
        S.glow = K.glowSpr(Math.round(3 * u), K.rgb(P.lit), .55); S.moonGlow = K.glowSpr(Math.round(S.orb.r * 3.2), K.rgb("#9CC2FF"), .32);
        const shard = c => make(3 * u, 1 * u, x => { x.fillStyle = c; x.globalAlpha = .9; x.beginPath(); x.moveTo(0, .5 * u); x.lineTo(2.2 * u, .1 * u); x.lineTo(3 * u, .5 * u); x.lineTo(2.2 * u, .9 * u); x.closePath(); x.fill(); x.globalAlpha = 1; x.fillStyle = "rgba(255,255,255,.7)"; x.beginPath(); x.arc(2.6 * u, .5 * u, .22 * u, 0, TAU); x.fill(); });
        S.shards = P.glass.map(shard);
        S.bursts = (pr ? [[8.1, .27, .17], [8.85, .67, .115], [9.6, .46, .215]] : [[8.1, .82, .27], [8.85, .62, .17], [9.6, .93, .45]]).map(([t, x, y], i) => ({ t, x: W * x, y: H * y, n: 16, c: i })); // in open sky: under the bar, off the list
        S.burstR = (pr ? 8.5 : 6.5) * u;
        const star = (c, s) => make(4 * u * s, 4 * u * s, x => { const c0 = 2 * u * s; shade(x, 3, -.8, 1.4); x.fillStyle = c; x.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = (k % 2 ? .42 : 1) * 1.8 * u * s; x.lineTo(c0 + Math.cos(a) * rr, c0 + Math.sin(a) * rr); } x.closePath(); x.fill(); });
        S.wireStar = star("#FFE9A8", 1); S.fanStars = P.glass.map(c => star(c, .8));
        // (up on a phone, where the bar's words sit on pills; right and down on a wide screen, where the count does not)
        S.fan = Array.from({ length: 16 }, (_, i) => ({ a: pr ? -Math.PI * .95 + (i / 15) * Math.PI * .9 : -Math.PI * .2 + (i / 15) * Math.PI * .85, d: (.5 + r() * .5) * Math.min(W, H) * (pr ? .5 : .36), c: i % 5, s: .8 + r() * .5, lag: r() * .25 }));
        S.moonStrips = Array.from({ length: 8 }, () => ({ y: riverY + riverH * (.12 + r() * .76), w: (.8 + r() * 2.4) * u, dx: (r() - .5) * 7 * u, ph: r() * TAU, v: .6 + r() * 1.4 }));
      }

      // the backdrop: sky, the far things, the hills, the river and its bridge, the houses, grain over all of it
      const sky = bg.createLinearGradient(0, 0, 0, H * .7); sky.addColorStop(0, P.skyTop); sky.addColorStop(1, P.skyLow);
      bg.fillStyle = sky; bg.fillRect(0, 0, W, H);
      if (night) for (const s of S.stars) { bg.fillStyle = P.star; bg.globalAlpha = s.tw ? .3 : .55 + s.s * .3; bg.beginPath(); bg.arc(s.x, s.y, s.s * .75, 0, TAU); bg.fill(); if (s.s > 1.3) { bg.globalAlpha = .12; bg.beginPath(); bg.arc(s.x, s.y, s.s * 2.4, 0, TAU); bg.fill(); } bg.globalAlpha = 1; }
      const band = (yf, col, blur = 8, below = H) => { shade(bg, blur, -1.6, 3); bg.fillStyle = col; bg.beginPath(); bg.moveTo(0, below); for (let x = 0; x <= W + 4; x += 4) bg.lineTo(x, yf(x)); bg.lineTo(W, below); bg.closePath(); bg.fill(); unshade(bg);
        bg.strokeStyle = P.rim; bg.lineWidth = night ? .9 : .7; bg.beginPath(); for (let x = 0; x <= W + 4; x += 4) (x ? bg.lineTo(x, yf(x) + .4) : bg.moveTo(x, yf(x) + .4)); bg.stroke(); };
      band(backY, P.back, 9);
      // little pines along the back hills, too far off to sway
      bg.fillStyle = night ? "#141D35" : "#D2C5A6"; S.pines = []; /* (b415) each one noted as it is drawn, for the egg's page */
      for (let x = r() * 3 * u; x < W; x += (1.6 + r() * 3.4) * u) { const h = (1.8 + r() * 1.6) * u, y = backY(x) + .6 * u; S.pines.push([x, h]); bg.beginPath(); bg.moveTo(x, y - h); bg.lineTo(x + h * .32, y); bg.lineTo(x - h * .32, y); bg.closePath(); bg.fill(); }
      band(townY, P.mid, 9);
      // the houses
      for (const h of S.houses) {
        shade(bg, 5, -1.3, 2.4); bg.fillStyle = P.wall; bg.fillRect(h.x, h.base - h.h * .62, h.w, h.h * .62);
        bg.fillStyle = P.roof[h.roof % P.roof.length]; bg.beginPath();
        if (h.roof === 3) { bg.rect(h.x - .3 * u, h.base - h.h * .74, h.w + .6 * u, h.h * .14); }
        else { bg.moveTo(h.x - .5 * u, h.base - h.h * .6); bg.lineTo(h.x + h.w / 2, h.base - h.h); bg.lineTo(h.x + h.w + .5 * u, h.base - h.h * .6); bg.closePath(); }
        bg.fill(); unshade(bg);
        bg.fillStyle = P.wallLo; bg.fillRect(h.x, h.base - h.h * .62, h.w * .14, h.h * .62);
        bg.fillStyle = P.window; for (const w of h.wins) bg.fillRect(w.x, w.y, w.w, w.h);
        if (h.door >= 0) { bg.fillStyle = P.door; bg.fillRect(h.door, h.base - h.h * .3, h.w * .16, h.h * .3); }
      }
      // the windmill's tower
      { const m = S.mill; shade(bg, 5, -1.3, 2.4); bg.fillStyle = P.mill; bg.beginPath(); bg.moveTo(m.x - m.h * .2, m.base); bg.lineTo(m.x - m.h * .11, m.y + m.h * .12); bg.lineTo(m.x + m.h * .11, m.y + m.h * .12); bg.lineTo(m.x + m.h * .2, m.base); bg.closePath(); bg.fill();
        bg.fillStyle = P.roof[0 % P.roof.length]; bg.beginPath(); bg.moveTo(m.x - m.h * .15, m.y + m.h * .14); bg.lineTo(m.x, m.y - m.h * .02); bg.lineTo(m.x + m.h * .15, m.y + m.h * .14); bg.closePath(); bg.fill(); unshade(bg);
        bg.fillStyle = P.millLo; bg.fillRect(m.x - m.h * .045, m.base - m.h * .28, m.h * .09, m.h * .28); }
      // the river, its bridge, and the bank
      shade(bg, 6, -1, 2); bg.fillStyle = P.river; bg.beginPath(); bg.moveTo(0, riverY); for (let x = 0; x <= W + 4; x += 6) bg.lineTo(x, riverY + Math.sin(x / (9 * u)) * .4 * u); bg.lineTo(W, riverY + riverH); bg.lineTo(0, riverY + riverH); bg.closePath(); bg.fill(); unshade(bg);
      bg.fillStyle = P.riverHi; S.hls = []; for (let k = 0; k < (pr ? 6 : 10); k++) { const x = r() * W, y = riverY + riverH * (.25 + r() * .55), w = (3 + r() * 6) * u; S.hls.push([x, y, w]); bg.globalAlpha = .55; bg.fillRect(x, y, w, .35 * u); } bg.globalAlpha = 1;
      { const top = S.deckY, n = Math.ceil(W / (W * (pr ? .19 : .085))), span = (W + 4 * u) / n, b0 = -2 * u, b1 = W + 2 * u; /* a viaduct right across the river: both trains run on it */
        shade(bg, 6, -1.4, 2.6); bg.fillStyle = P.bridge; bg.beginPath(); bg.moveTo(b0 - 2 * u, top); bg.lineTo(b1 + 2 * u, top);
        bg.lineTo(b1 + 2 * u, riverY + riverH * .9);
        for (let k = n - 1; k >= 0; k--) { const a0 = b0 + k * span; bg.lineTo(a0 + span * .92, riverY + riverH * .9); bg.quadraticCurveTo(a0 + span * .5, top + 1.2 * u - (riverH * .3), a0 + span * .08, riverY + riverH * .9); }
        bg.lineTo(b0 - 2 * u, riverY + riverH * .9); bg.closePath(); bg.fill(); unshade(bg);
        bg.fillStyle = night ? "#34426A" : "#F8F0E0"; bg.fillRect(b0 - 2 * u, top, b1 - b0 + 4 * u, .5 * u);
        bg.fillStyle = night ? "rgba(10,16,34,.55)" : "rgba(110,86,60,.35)"; bg.fillRect(b0 - 2 * u, top - .28 * u, b1 - b0 + 4 * u, .28 * u); } /* the rails */
      band(frontY, P.front, 8);
      // the near hill, its top cut with pinking shears
      { shade(bg, 7, -1.4, 3); bg.fillStyle = P.near; bg.beginPath(); bg.moveTo(0, H); const tooth = 1.2 * u;
        for (let x = 0, k = 0; x <= W + tooth; x += tooth, k++) bg.lineTo(x, nearY(x) - (k % 2 ? 0 : .7 * u)); bg.lineTo(W, H); bg.closePath(); bg.fill(); unshade(bg); }
      // grain, the paper's own
      const tile = grain(140, 140, night ? 29 : 11, P.grainK); bg.fillStyle = bg.createPattern(tile, "repeat"); bg.fillRect(0, 0, W, H); S.grainTile = tile;
      gen++; extras(W, H, u, pr, frontY); /* b384: what the passes after the first bring, made from dice of their own */ S.bgx = bg; EG = null; EGbuf = null; EGbg = "A"; /* (b415) the egg's pages are made again for this size, over this backdrop */
      if (!night) { S.pad = make(160, 80, x => { for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(247,242,232,.15)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } }); /* the paper's ground, soft at its edges */
        let top = 1e9; for (let x = 0; x <= W; x += 8) top = Math.min(top, backY(x)); S.townTop = top; } /* where the town begins: the back hills' highest point */
      if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): by day the kite flies no higher than clears them — it and its tail keep off the lines */
    words(rects) {
      S.raw = rects; S.rects = rects; S.wr = rects.map(([x0, y0, x1, y1]) => [x0 - 10, y0 - 8, x1 + 10, y1 + 8]); S.lines = rects.filter(r => r[4] === 1); if (night || !S.W || !S.kiteTop0) return;
      const { u } = S, x = S.kiteTop0[0];
      const hit = y => rects.some(([x0, y0, x1, y1]) => x > x0 - 9 * u && x < x1 + 9 * u && y + 17 * u > y0 - 2 * u && y - 5 * u < y1 + 2 * u); /* the kite and its tail; the string goes behind the words */
      const y0 = S.kiteTop0[1], lo = S.H * .1 + 5 * u, hi = S.townY(x) - 16 * u; let y = null; /* the nearest clear height, above or below where it likes to be */
      for (let k = 0; k < 400; k++) { const up = y0 - k * u, dn = y0 + k * u; if (up >= lo && !hit(up)) { y = up; break; } if (dn <= hi && !hit(dn)) { y = dn; break; } if (up < lo && dn > hi) break; }
      S.kiteTop = y === null ? null : [x, y]; /* no clear sky for it: it stays on the bank */
      // (b384) the dragon kite's own clear sky: its head and the long tail it streams down the wind to the right
      S.dragonTop = null; for (const f of S.pr ? [.13, .3, .45] : [.66, .72, .58, .78]) { const dx = S.W * f, want = S.pr ? S.H * .17 : S.H * .22, lo2 = S.H * .08 + 4 * u, hi2 = S.townY(dx) - 14 * u; /* the first column with room for it, nearest the height it likes */
        const hit2 = yy => rects.some(([x0, y0, x1, y1]) => dx + 22 * u > x0 - 2 * u && dx - 4 * u < x1 + 2 * u && yy + 12 * u > y0 - 2 * u && yy - 4 * u < y1 + 2 * u);
        let y2 = null; for (let k = 0; k < 400; k++) { const up = want - k * u, dn = want + k * u; if (up >= lo2 && !hit2(up)) { y2 = up; break; } if (dn <= hi2 && !hit2(dn)) { y2 = dn; break; } if (up < lo2 && dn > hi2) break; }
        if (y2 !== null) { S.dragonTop = [dx, y2]; break; } }
    },
    /** 1 clear of the words, down to nothing behind them: for what crosses the sky */
    shade(x, y, r) { let d = 1e9; for (const [x0, y0, x1, y1] of S.wr || []) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))); return clamp((d - r * .3) / (r + 6)); },

    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; pass: which time round
     *  (b384: pass 0 is the loop, the passes after it are dealt) */
    draw(T, I, A, F, pass = 0) {
      const { W, H, u, orb } = S, egg = K.egg(pass);
      if (!plan || plan.pass !== pass || plan.gen !== gen) plan = egg ? eggPlan(pass) : night ? dealNight(pass) : dealDay(pass);
      if (egg) { if (eggDraw(T, I, A, F)) return; } else if (EG) eggOff(); /* (b415) the egg draws its own frames; any other pass lets it go */
      const pl = plan;
      g.clearRect(0, 0, W, H);
      const dt = S.lastA === null ? 0 : clamp(A - S.lastA, 0, .1); S.lastA = A;
      let breeze = env(T, pl.b[0], pl.b[1], pl.b[2], pl.b[3], E.sine) * pl.bk * I;
      if (pl.gust) breeze = Math.max(breeze, env(T, pl.gust[0], pl.gust[1], pl.gust[2], pl.gust[3], E.sine) * pl.gust[4] * I); /* a gust: the leaves go tumbling */
      // the sun or the moon on its thread
      const swing = Math.sin(A * .55) * .035 + breeze * .05 * Math.sin(A * 3.1);
      const top = [orb.x, 0], ox = orb.x + Math.sin(swing) * orb.y, oy = Math.cos(swing) * orb.y;
      if (night && pl.show.k === "aurora") nAurora(T, I, A, pl.show); /* tissue-paper curtains of the northern lights, behind it all */
      g.strokeStyle = P.thread; g.lineWidth = .8; g.beginPath(); g.moveTo(top[0], 0); g.lineTo(ox, oy - orb.r); g.stroke();
      if (!night) {
        const turn = A * .04 + seg(T, pl.n[0], pl.n[1], E.back) * (TAU / 12) * pl.n[2] * (I > .01 ? 1 : 0); // a notch: twelve rays, so a notch looks like none when the loop comes round
        put(S.sunRays, ox, oy, .5, .5, turn); put(S.sunDisk, ox, oy);
      } else {
        const mc = pl.moon && pl.moon.k === "cloud" ? pl.moon : null, veiled = mc ? env(T, mc.v[0], mc.v[1], mc.v[2], mc.v[3], E.sine) * I : 0; /* while the cloud is across it */
        g.globalAlpha = .75 - veiled * .45 + (F >= 0 ? env(F, 0, .2, .7, 1) * .25 : 0); g.drawImage(S.moonGlow, ox - S.moonGlow.width / 2, oy - S.moonGlow.height / 2); g.globalAlpha = 1;
        g.fillStyle = P.moon; g.beginPath(); g.arc(ox, oy, orb.r, 0, TAU); g.fill();
        g.fillStyle = P.moonLo; for (const [cx, cy, cr] of [[-.3, -.2, .22], [.25, .15, .16], [-.05, .38, .12]]) { g.beginPath(); g.arc(ox + cx * orb.r, oy + cy * orb.r, cr * orb.r, 0, TAU); g.fill(); }
        // the stars that twinkle (the rest are pinholes in the backdrop)
        for (const s of S.stars) { if (!s.tw) continue; const a = .35 + .65 * Math.pow(Math.max(0, Math.sin(A * s.f + s.ph)), 3); g.globalAlpha = a; g.fillStyle = P.star; g.beginPath(); g.arc(s.x, s.y, s.s * .7, 0, TAU); g.fill(); } g.globalAlpha = 1;
        // the cloud on its wire that slides over the moon
        if (mc) { const cd = seg(T, mc.d[0], mc.d[1], E.out) * (1 - seg(T, mc.d[2], mc.d[3], E.in)), cs = seg(T, mc.s[0], mc.s[1], E.io);
          if (cd > .001 && I > .01) { const ch = S.moonCloud.h2, x = orb.x + lerp(mc.from, mc.to, cs) * orb.r, y = lerp(-ch * 1.2, oy + orb.r * mc.drop, cd), sw = Math.sin(A * 1.3) * .03 * cd;
            g.globalAlpha = I; g.strokeStyle = P.thread; g.lineWidth = .8; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + Math.sin(sw) * ch, y - ch * .1); g.stroke(); put(S.moonCloud, x + Math.sin(sw) * ch, y, .5, .2, sw, 1, 1, I); g.globalAlpha = 1; } }
        if (pl.show.k === "stitch") nStitch(T, I, A, pl.show); /* a constellation sewn in gold thread */
      }
      // the clouds on their threads
      for (const c of S.clouds) {
        const a = Math.sin(A * .5 + c.ph) * .03 + breeze * .06 * Math.sin(A * 2.6 + c.ph), x = c.x + Math.sin(a) * c.y, y = Math.cos(a) * c.y;
        g.strokeStyle = P.thread; g.lineWidth = .8; g.beginPath(); g.moveTo(c.x, 0); g.lineTo(x, y - c.spr.h2 * .3); g.stroke();
        put(c.spr, x, y, .5, .2, a * .6);
      }
      if (night && pl.moon && pl.moon.k !== "cloud") (pl.moon.k === "owl" ? nOwl : nGeese)(T, I, A, pl.moon); /* an owl or a skein of geese across the moon */
      // the windmill's sails, turning at their own pace and faster in the breeze
      S.millAngle += dt * ((night ? .22 : .42) + breeze * 1.6);
      { const m = S.mill; for (let k = 0; k < 4; k++) put(S.millSail, m.x, m.y + m.h * .12, .1, .5, S.millAngle + k * TAU / 4); g.fillStyle = P.millLo; g.beginPath(); g.arc(m.x, m.y + m.h * .12, .7 * u, 0, TAU); g.fill(); }
      // the trees, each swaying from its foot: the town's now, the near bank's once the trains have been drawn
      const trees = front => { for (const t of S.trees) if (t.front === front) put(t.spr, t.x, t.y, .5, 1 - 1.4 * u / t.spr.h2, Math.sin(A * 1.1 + t.ph) * .018 + breeze * .09 * Math.sin(A * 3.4 + t.ph)); };
      trees(false);

      if (!night) {
        // the river glints
        g.fillStyle = "rgba(255,255,255,.7)"; for (const s of S.glints) { const a = Math.pow(Math.max(0, Math.sin(A * s.v * 1.6 + s.ph)), 6); if (a < .05) continue; g.globalAlpha = a; g.fillRect((s.x + A * s.v * 4) % W, s.y, s.w, .3 * u); } g.globalAlpha = 1;
        // across the sky: the paper plane and its loop (or two chasing through a double loop), a biplane and its streamer, a zeppelin
        const c = pl.cross; if (c.k === "biplane") dBiplane(T, I, A, c); else if (c.k === "zeppelin") dZeppelin(T, I, A, c); else for (const p of c.planes) dPlane(T, I, p);
        // along the viaduct: a train, or a cyclist
        if (pl.deck.k === "cyclist") dCyclist(T, I, A, pl.deck); else dTrain(T, I, A, pl.deck);
        // in the open sky: a balloon or a rainbow from behind the near bank; the kite, which lies on the bank whatever the pass; a dragon kite
        const h = pl.head, rbOk = h.k === "rainbow" && !(S.rects || []).some(([x0, y0, x1, y1, k]) => k === 1 && x1 > h.cx - h.rx - 10 && x0 < h.cx + h.rx + 10 && y1 > h.cy - h.ry - 10 && y0 < h.cy); /* the rainbow stands only where no line lies over it */
        if (h.k === "balloon") dBalloon(T, I, A, h); else if (rbOk) dRainbow(T, I, h);
        dKite(T, I, A, dt, h.k === "kite" ? h.t : (h.k === "dragon" && S.dragonTop === null) || (h.k === "rainbow" && !rbOk) ? h.kt : null); /* no room for the dragon or the rainbow: the kite flies instead */
        if (h.k === "dragon") dDragon(T, I, A, h);
        trees(true);
        // to close: the paper birds, leaves in a gust, butterflies
        const cl = pl.close; if (cl.k === "birds") dBirds(T, I, A, cl); else if (cl.k === "leaves") dLeaves(T, I, cl); else dFlies(T, I, A, cl);
        // the finale: paper cranes up past the sun
        if (F >= 0) for (const c of S.cranes) { const k = clamp((F - c.d) / (1 - c.d)); if (k <= 0 || k >= 1) continue; const e = E.io(k), x = c.x0 + c.dx * e + Math.sin(k * 6 + c.ph) * 2 * u, y = lerp(c.y0, -H * .08, e); put(S.crane[c.c * 2 + Math.floor(A * 8 + c.ph) % 2], x, y, .5, .5, -.25 + Math.sin(k * 5 + c.ph) * .1, c.s, c.s, k < .12 ? k / .12 : k > .86 ? (1 - k) / .14 : 1); }
        // 1.12 b385: the paper's ground under each line that reaches down over the town (the stage lays its pad over this)
        if (S.lines && S.lines.length) { g.globalAlpha = 1; for (const [x0, y0, x1, y1] of S.lines) if (y1 > S.townTop) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } g.globalAlpha = 1; }
      } else {
        // the windows: a few lit always, the rest light across the town (in the pass's own order) and go out again
        for (let i = 0; i < S.windows.length; i++) {
          const w = S.windows[i], wo = pl.won[i], wf = pl.woff[i];
          const on = seg(T, .2 + wo * 1.7, .45 + wo * 1.7, E.back) * (1 - seg(T, 12.3 + wf * 1.6, 12.55 + wf * 1.6, E.in)) * I;
          const base = w.base ? .82 + .18 * Math.sin(A * w.f + w.ph) : (Math.sin(A * w.f + w.ph) > .985 ? .8 : 0);
          const a = Math.max(base, on); if (a <= .02) continue;
          g.globalAlpha = clamp(a) * .55; g.drawImage(S.glow, w.x + w.w / 2 - S.glow.width / 2, w.y + w.h / 2 - S.glow.height / 2); g.globalAlpha = clamp(a); g.fillStyle = P.lit; g.fillRect(w.x, w.y, w.w, w.h); g.globalAlpha = 1;
        }
        // the moon on the river
        g.fillStyle = P.moon; for (const s of S.moonStrips) { const k = .5 + .5 * Math.sin(A * s.v + s.ph), w = s.w * (.55 + .45 * k); g.globalAlpha = (.06 + .22 * k) * (1 - Math.abs(s.dx) / (4.5 * u)); g.fillRect(orb.x - w / 2 + s.dx + Math.sin(A * .7 + s.ph) * .5 * u, s.y, w, .24 * u); } g.globalAlpha = 1;
        // the train along the bank and over the bridge, either way, its reflection wobbling under it; or a cyclist with a lamp
        if (pl.low.k === "cyclist") dCyclist(T, I, A, pl.low); else nTrain(T, I, A, pl.low);
        if (pl.show.k === "balloon") dBalloon(T, I, A, pl.show);
        trees(true);
        if (pl.close.k === "fireflies") nFireflies(T, I, A, pl.close);
        // cut-paper fireworks in the colours of glass, or a comet on its wire
        if (pl.show.k === "fireworks") nFireworks(T, I, pl.show.bursts); else if (pl.show.k === "comet") nComet(T, I, A, pl.show);
        // the star on its wire, or paper snow
        if (pl.close.k === "wire") nWire(T, I, pl.close); else if (pl.close.k === "snow") nSnow(T, I, A, pl.close);
        // the finale: a fan of paper stars opens out of the moon
        if (F >= 0) for (const s of S.fan) { const k = clamp((F - s.lag) / (1 - s.lag)); if (k <= 0 || k >= 1) continue; const e = E.back(Math.min(1, k * 1.6)), x = ox + Math.cos(s.a) * s.d * e, y = oy + Math.sin(s.a) * s.d * e * .75 + (S.pr ? S.orb.r : 0); put(S.fanStars[s.c], x, y, .5, .5, k * 4 + s.a, s.s, s.s, k > .8 ? (1 - k) / .2 : 1); }
      }
    },
  };

  /* ---------------- 1.12 b384: the forever cycle ---------------- */

  /** what only the passes after the first bring, made once at layout from dice of their own, so that the town, which the
   *  first pass shares, is made just as it always was */
  function extras(W, H, u, pr, frontY) {
    S.frontY = frontY; S.bCache = {}; S.dSeg = Array.from({ length: 13 }, () => [0, 0, 0]);
    // what rises from behind the near bank is hidden below its ridge, the very line the backdrop cut it along
    { const c = new Path2D(); let hi = 1e9; c.moveTo(-40, -40); c.lineTo(W + 40, -40); c.lineTo(W + 40, frontY(W + 4)); for (let x = Math.floor((W + 4) / 4) * 4; x >= 0; x -= 4) { const y = frontY(x); c.lineTo(x, y); hi = Math.min(hi, y); } c.lineTo(-40, frontY(0)); c.closePath(); S.frontClip = c; S.frontTop = hi; }
    S.bR = (pr ? 4.8 : 4.4) * u; // a balloon's envelope
    S.bGlow = make(S.bR * 6, S.bR * 6, x => { const c = S.bR * 3, gr = x.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, "rgba(255,190,110,.55)"); gr.addColorStop(.4, "rgba(255,170,90,.2)"); gr.addColorStop(1, "rgba(255,160,80,0)"); x.fillStyle = gr; x.fillRect(0, 0, c * 2, c * 2); });
    // the cyclist: the frame and the rider in one piece; the wheels and the legs apart, for they turn
    const C = S.cC = night ? { frame: "#5A6DA0", shirt: "#3A4A7A", legs: "#1E2846", legs2: "#161E36", cap: "#2B375C", skin: "#8D86A6", tyre: "#10162A", rim: "#46578A", bag: "#2F3E68" }
      : { frame: "#C8321F", shirt: "#5F8EA6", legs: "#4E5B73", legs2: "#3B4557", cap: "#E0A33C", skin: "#E9B99A", tyre: "#4E3E30", rim: "#B8A58C", bag: "#B8864F" };
    S.cyc = make(7.4 * u, 6.6 * u, x => { x.translate(3.1 * u, 5.9 * u); x.lineCap = "round"; x.lineJoin = "round";
      const L = (a, b, c, d, w, col) => { x.strokeStyle = col; x.lineWidth = w * u; x.beginPath(); x.moveTo(a * u, b * u); x.lineTo(c * u, d * u); x.stroke(); };
      shade(x, 3, -.8, 1.6);
      for (const [a, b, c, d] of [[0, -.9, -.4, -2.35], [-.4, -2.35, 1.2, -2.25], [0, -.9, 1.28, -1.8], [1.28, -1.8, 1.55, -.95], [0, -.9, -1.55, -.95], [-.4, -2.35, -1.55, -.95], [1.2, -2.25, 1.28, -1.8]]) L(a, b, c, d, .24, C.frame); // the frame
      L(1.2, -2.25, 1.26, -2.7, .18, C.tyre); L(1.26, -2.7, .96, -2.78, .18, C.tyre); // the handlebars
      x.fillStyle = C.tyre; x.beginPath(); x.roundRect(-.8 * u, -2.56 * u, .7 * u, .2 * u, .1 * u); x.fill(); x.beginPath(); x.arc(0, -.9 * u, .3 * u, 0, TAU); x.fill(); // the saddle, the chainring
      x.fillStyle = C.bag; x.beginPath(); if (!night) x.roundRect(1.4 * u, -2.62 * u, .86 * u, .6 * u, .12 * u); else x.roundRect(1.34 * u, -2.62 * u, .44 * u, .36 * u, .1 * u); x.fill(); // a basket, or a lamp
      L(-.35, -2.55, .48, -3.9, .8, C.shirt); L(.48, -3.78, 1.0, -2.8, .3, C.shirt); // the back, the arm
      x.fillStyle = C.skin; x.beginPath(); x.arc(.86 * u, -4.58 * u, .5 * u, 0, TAU); x.fill(); // the head
      unshade(x);
      x.fillStyle = C.cap; x.beginPath(); x.arc(.82 * u, -4.66 * u, .52 * u, Math.PI * 1.05, Math.PI * 1.95); x.closePath(); x.fill(); x.beginPath(); x.roundRect(.9 * u, -4.76 * u, .7 * u, .15 * u, .07 * u); x.fill(); // a cap and its peak
      x.fillStyle = C.skin; x.beginPath(); x.arc(1.02 * u, -2.76 * u, .15 * u, 0, TAU); x.fill(); // the hand
      if (!night) { for (const [fx, fy, fc] of [[1.6, -2.78, "#E0603F"], [1.86, -2.9, "#E8B64A"], [2.08, -2.74, "#FFFFFF"], [1.74, -2.62, "#8FAF6E"]]) { x.fillStyle = fc; x.beginPath(); x.arc(fx * u, fy * u, .19 * u, 0, TAU); x.fill(); } x.strokeStyle = "rgba(90,60,30,.4)"; x.lineWidth = .06 * u; for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(1.4 * u, (-2.62 + k * .2) * u); x.lineTo(2.26 * u, (-2.62 + k * .2) * u); x.stroke(); } } // flowers in the basket
      else { x.fillStyle = "#FFE9A8"; x.beginPath(); x.arc(1.78 * u, -2.44 * u, .16 * u, 0, TAU); x.fill(); x.fillStyle = "#FF6B5A"; x.beginPath(); x.arc(-.62 * u, -2.12 * u, .12 * u, 0, TAU); x.fill(); } // the lamp lit, and a red one under the saddle
    });
    S.cyc.ox = 3.1 * u; S.cyc.oy = 5.9 * u;
    S.wheel = make(2.3 * u, 2.3 * u, x => { const c = 1.15 * u; x.strokeStyle = C.tyre; x.lineWidth = .2 * u; x.beginPath(); x.arc(c, c, .85 * u, 0, TAU); x.stroke(); x.strokeStyle = C.rim; x.lineWidth = .06 * u; x.beginPath(); x.arc(c, c, .7 * u, 0, TAU); x.stroke(); x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; x.moveTo(c + Math.cos(a) * .7 * u, c + Math.sin(a) * .7 * u); x.lineTo(c - Math.cos(a) * .7 * u, c - Math.sin(a) * .7 * u); } x.stroke(); x.fillStyle = C.tyre; x.beginPath(); x.arc(c, c, .13 * u, 0, TAU); x.fill(); });
    const star = (c, s, pts = 5, k = .42) => make(4 * u * s, 4 * u * s, x => { const c0 = 2 * u * s; shade(x, 3, -.8, 1.4); x.fillStyle = c; x.beginPath(); for (let i = 0; i < pts * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / pts, rr = (i % 2 ? k : 1) * 1.8 * u * s; x.lineTo(c0 + Math.cos(a) * rr, c0 + Math.sin(a) * rr); } x.closePath(); x.fill(); });
    if (!night) {
      const tW = S.tW, tH = S.tH, wheel = (x, xs, y, r0) => { x.fillStyle = "#5A4636"; for (const f of xs) { x.beginPath(); x.arc(f, y, r0, 0, TAU); x.fill(); } x.fillStyle = "#B8A58C"; for (const f of xs) { x.beginPath(); x.arc(f, y, r0 * .35, 0, TAU); x.fill(); } };
      // paper planes in paper of other colours, each with its dotted line
      const planeOf = (face, fold) => make(6 * u, 3 * u, x => { shade(x, 3, -.8, 1.6); x.fillStyle = face; x.beginPath(); x.moveTo(6 * u, 1.3 * u); x.lineTo(0, 0); x.lineTo(1.4 * u, 1.3 * u); x.lineTo(0, 2.6 * u); x.closePath(); x.fill(); unshade(x); x.fillStyle = fold; x.beginPath(); x.moveTo(6 * u, 1.3 * u); x.lineTo(1.4 * u, 1.3 * u); x.lineTo(0, 2.6 * u); x.closePath(); x.fill(); });
      S.planes = [[S.plane, P.trail], [planeOf("#F2B09B", "#DC8C76"), "rgba(200,50,31,.5)"], [planeOf("#CFE0E8", "#A6C2D0"), "rgba(63,110,154,.55)"], [planeOf("#F4D68E", "#DDB560"), "rgba(190,128,34,.6)"]];
      // the engines of the express and the goods, their cars and wagons: the red train's shapes in other colours and loads
      const engine = (body, hi) => { const s = make(tW + 2.8 * u, tH * 1.5 + 2.6 * u, x => { x.translate(1.8 * u, u); shade(x, 3, -.8, 1.6);
        x.fillStyle = "#4E3E30"; x.fillRect(tW * .1, 0, tW * .15, tH * .55); x.fillRect(tW * .07, 0, tW * .21, tH * .12);
        x.fillStyle = body; x.beginPath(); x.roundRect(0, tH * .45, tW * .66, tH * 1.05, tH * .4); x.fill();
        x.fillStyle = P.wall; x.fillRect(tW * .6, tH * .1, tW * .4, tH * 1.4); x.fillStyle = body; x.fillRect(tW * .56, 0, tW * .48, tH * .16);
        x.fillStyle = "#4E3E30"; x.beginPath(); x.moveTo(0, tH * 1.1); x.lineTo(-tW * .12, tH * 1.5); x.lineTo(0, tH * 1.5); x.closePath(); x.fill(); unshade(x);
        x.fillStyle = hi; x.fillRect(tW * .04, tH * .55, tW * .56, tH * .14); x.fillStyle = "#9CC0C8"; x.fillRect(tW * .7, tH * .32, tW * .2, tH * .34);
        x.fillStyle = "#E8B64A"; x.beginPath(); x.arc(tW * .03, tH * .82, .3 * u, 0, TAU); x.fill();
        wheel(x, [tW * .12, tW * .34, tW * .56], tH * 1.5, .78 * u); wheel(x, [tW * .82], tH * 1.5, .62 * u); }); s.foot = u + tH * 1.5 + .78 * u; return s; };
      S.xengine = engine("#3F6E9A", "#6D9CC6"); S.gengine = engine("#557F4F", "#80A878");
      const wagon = draw => { const s = make(tW + 2 * u, tH + 2.4 * u, x => { x.translate(u, u); draw(x); wheel(x, [tW * .22, tW * .78], tH, .62 * u); }); s.foot = u + tH + .62 * u; return s; };
      S.xcar = wagon(x => { shade(x, 3, -.8, 1.6); x.fillStyle = P.wall; x.beginPath(); x.roundRect(0, 0, tW, tH, .8 * u); x.fill(); unshade(x); x.fillStyle = "#3F6E9A"; x.fillRect(0, tH * .68, tW, .5 * u); x.fillStyle = P.wallLo; x.fillRect(0, 0, tW, .45 * u); x.fillStyle = "#9CC0C8"; for (let k = 0; k < 3; k++) x.fillRect(tW * (.1 + k * .3), tH * .2, tW * .2, tH * .32); });
      S.wagons = [
        wagon(x => { shade(x, 3, -.8, 1.6); x.fillStyle = "#6A5240"; x.fillRect(0, tH * .64, tW, tH * .24); for (const [y0, l0, l1] of [[.36, .02, .98], [.08, .1, .9]]) { x.fillStyle = "#A0754E"; x.beginPath(); x.roundRect(tW * l0, tH * y0, tW * (l1 - l0), tH * .28, tH * .14); x.fill(); } unshade(x);
          x.fillStyle = "#D9B98A"; for (const [y0, l1] of [[.36, .98], [.08, .9]]) { x.beginPath(); x.ellipse(tW * l1 - tH * .09, tH * (y0 + .14), tH * .09, tH * .13, 0, 0, TAU); x.fill(); } x.fillStyle = "#4E3E30"; x.fillRect(tW * .03, tH * .02, tW * .03, tH * .64); x.fillRect(tW * .94, tH * .02, tW * .03, tH * .64); }), // logs
        wagon(x => { shade(x, 3, -.8, 1.6); x.fillStyle = "#3A2E26"; x.beginPath(); for (let k = 0; k < 6; k++) { const cx = tW * (.1 + k * .16); x.moveTo(cx + tH * .2, tH * .3); x.arc(cx, tH * .3, tH * .2, 0, TAU); } x.fill(); x.fillStyle = "#5A4636"; x.fillRect(0, tH * .25, tW, tH * .63); unshade(x);
          x.fillStyle = "#6E5846"; x.fillRect(0, tH * .25, tW, tH * .1); x.strokeStyle = "rgba(0,0,0,.18)"; x.lineWidth = .06 * u; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(tW * k / 4, tH * .35); x.lineTo(tW * k / 4, tH * .88); x.stroke(); } }), // coal
        wagon(x => { shade(x, 3, -.8, 1.6); x.fillStyle = "#4E3E30"; x.fillRect(0, tH * .7, tW, tH * .18); x.fillStyle = "#EFE5D0"; x.beginPath(); x.roundRect(tW * .02, tH * .08, tW * .96, tH * .66, tH * .33); x.fill(); x.fillRect(tW * .42, 0, tW * .16, tH * .12); unshade(x);
          x.fillStyle = "#C8321F"; x.fillRect(tW * .2, tH * .08, tW * .06, tH * .66); x.fillRect(tW * .74, tH * .08, tW * .06, tH * .66); x.fillStyle = "rgba(255,255,255,.45)"; x.fillRect(tW * .1, tH * .2, tW * .8, tH * .07); }), // a tanker
        wagon(x => { shade(x, 3, -.8, 1.6); x.fillStyle = "#B8573E"; x.fillRect(0, tH * .02, tW, tH * .86); unshade(x); x.fillStyle = "#8E3F2B"; x.fillRect(-tW * .02, 0, tW * 1.04, tH * .1);
          x.strokeStyle = "rgba(60,20,10,.35)"; x.lineWidth = .08 * u; x.strokeRect(tW * .36, tH * .22, tW * .28, tH * .58); x.beginPath(); x.moveTo(tW * .36, tH * .22); x.lineTo(tW * .64, tH * .8); x.moveTo(tW * .64, tH * .22); x.lineTo(tW * .36, tH * .8); x.stroke(); }), // a box car
      ];
      S.caboose = wagon(x => { shade(x, 3, -.8, 1.6); x.fillStyle = "#C8321F"; x.fillRect(tW * .06, tH * .2, tW * .88, tH * .68); x.fillRect(tW * .32, 0, tW * .34, tH * .24); unshade(x); x.fillStyle = "#8E2A1A"; x.fillRect(tW * .02, tH * .16, tW * .96, tH * .07); x.fillRect(tW * .28, -tH * .04, tW * .42, tH * .07);
        x.fillStyle = "#9CC0C8"; for (const f of [.16, .64]) x.fillRect(tW * f, tH * .36, tW * .18, tH * .24); x.fillRect(tW * .4, tH * .05, tW * .18, tH * .1); x.fillStyle = "#E8B64A"; x.beginPath(); x.arc(tW * .97, tH * .5, .22 * u, 0, TAU); x.fill(); });
      // a biplane, facing right, its streamer and propeller drawn apart
      S.biplane = make(7.4 * u, 4 * u, x => { x.translate(.2 * u, .2 * u); x.lineCap = "round"; shade(x, 3, -.8, 1.6);
        x.fillStyle = "#EFE5D0"; x.beginPath(); x.roundRect(2.3 * u, 2.05 * u, 2.9 * u, .36 * u, .18 * u); x.fill(); // the lower wing
        x.fillStyle = "#C8321F"; x.beginPath(); x.moveTo(.3 * u, 1.3 * u); x.lineTo(1.3 * u, 1.18 * u); x.lineTo(5.3 * u, 1.02 * u); x.quadraticCurveTo(6.1 * u, 1.05 * u, 6.15 * u, 1.55 * u); x.quadraticCurveTo(6.1 * u, 2.02 * u, 5.3 * u, 2.05 * u); x.lineTo(1.3 * u, 1.72 * u); x.lineTo(.3 * u, 1.52 * u); x.closePath(); x.fill(); // the fuselage
        x.fillStyle = "#E0A33C"; x.beginPath(); x.moveTo(.25 * u, 1.35 * u); x.lineTo(.1 * u, .42 * u); x.lineTo(.62 * u, .42 * u); x.lineTo(1.25 * u, 1.2 * u); x.closePath(); x.fill(); // the fin
        x.strokeStyle = "#4E3E30"; x.lineWidth = .12 * u; x.beginPath(); x.moveTo(4.3 * u, 2.0 * u); x.lineTo(4.45 * u, 2.8 * u); x.moveTo(4.8 * u, 1.95 * u); x.lineTo(4.5 * u, 2.8 * u); x.stroke(); x.fillStyle = "#4E3E30"; x.beginPath(); x.arc(4.45 * u, 2.95 * u, .4 * u, 0, TAU); x.fill(); // the wheels
        x.fillStyle = "#FBF3E4"; x.beginPath(); x.roundRect(2.1 * u, .32 * u, 3.5 * u, .42 * u, .21 * u); x.fill(); unshade(x); // the upper wing
        x.fillStyle = "#B8A58C"; x.beginPath(); x.arc(4.45 * u, 2.95 * u, .15 * u, 0, TAU); x.fill();
        x.strokeStyle = "#4E3E30"; x.lineWidth = .1 * u; x.beginPath(); for (const f of [2.6, 4.9]) { x.moveTo(f * u, .74 * u); x.lineTo(f * u, 2.05 * u); } x.stroke(); x.lineWidth = .04 * u; x.beginPath(); x.moveTo(2.6 * u, .74 * u); x.lineTo(4.9 * u, 2.05 * u); x.moveTo(4.9 * u, .74 * u); x.lineTo(2.6 * u, 2.05 * u); x.stroke(); // struts and wires
        x.fillStyle = "#FBF3E4"; x.fillRect(1.3 * u, 1.42 * u, 3.9 * u, .12 * u); x.fillStyle = "#E0A33C"; x.fillRect(2.1 * u, .32 * u, 3.5 * u, .1 * u); x.fillStyle = "#4E3E30"; x.fillRect(5.95 * u, 1.2 * u, .22 * u, .7 * u); // a stripe, the wing's edge, the cowling
        x.fillStyle = "#E9B99A"; x.beginPath(); x.arc(3.55 * u, .98 * u, .26 * u, 0, TAU); x.fill(); x.fillStyle = "#5A4636"; x.beginPath(); x.arc(3.55 * u, .92 * u, .27 * u, Math.PI, TAU); x.fill(); x.fillStyle = "#5F8EA6"; x.fillRect(3.55 * u, .88 * u, .3 * u, .1 * u); // the pilot, in a leather cap and goggles
        x.fillStyle = "#FBF3E4"; x.beginPath(); x.moveTo(3.3 * u, 1.1 * u); x.lineTo(2.55 * u, .95 * u); x.lineTo(3.3 * u, 1.22 * u); x.closePath(); x.fill(); }); // a scarf
      // a zeppelin, facing left: silver-cream paper, a red band, red fins, a gondola and two engines
      S.zep = make(24 * u, 10 * u, x => { const cx = 12.5 * u, cy = 4.2 * u, rx = 10 * u, ry = 2.9 * u, body = new Path2D();
        for (let i = 0; i <= 72; i++) { const t = i / 72 * TAU, co = Math.cos(t), taper = 1 - .3 * Math.max(0, co) * Math.max(0, co); i ? body.lineTo(cx + rx * co, cy + ry * Math.sin(t) * taper) : body.moveTo(cx + rx * co, cy + ry * Math.sin(t) * taper); } body.closePath();
        shade(x, 7, -1.6, 2.8); x.fillStyle = "#C8321F";
        for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(cx + rx * .55, cy + sd * ry * .62); x.lineTo(cx + rx * .98, cy + sd * ry * 1.5); x.lineTo(cx + rx * 1.1, cy + sd * ry * 1.45); x.lineTo(cx + rx * 1.02, cy + sd * ry * .2); x.closePath(); x.fill(); } // the fins above and below
        x.fillStyle = "#8A7258"; x.beginPath(); x.roundRect(cx - rx * .42, cy + ry * .82, rx * .46, ry * .5, ry * .2); x.fill(); for (const f of [.28, .5]) { x.beginPath(); x.ellipse(cx + rx * f, cy + ry * 1.08, rx * .07, ry * .16, 0, 0, TAU); x.fill(); } // the gondola, the engines
        x.fillStyle = "#EFE8DA"; x.fill(body); unshade(x);
        x.save(); x.clip(body); x.fillStyle = "#DDD2BD"; x.fillRect(cx - rx, cy + ry * .25, rx * 2, ry); x.fillStyle = "#C8321F"; x.fillRect(cx - rx, cy - ry * .02, rx * 2, ry * .2); x.fillStyle = "#FBF3E4"; x.fillRect(cx - rx, cy + ry * .18, rx * 2, ry * .06);
        x.strokeStyle = "rgba(110,90,60,.2)"; x.lineWidth = Math.max(.6, .06 * u); for (let k = 1; k < 8; k++) { x.beginPath(); x.ellipse(cx - rx + 2 * rx * k / 8, cy, rx * .06, ry * 1.2, 0, 0, TAU); x.stroke(); } // its ribs
        x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.ellipse(cx - rx * .15, cy - ry * .55, rx * .6, ry * .16, 0, 0, TAU); x.fill(); x.fillStyle = "#D9563F"; x.beginPath(); x.arc(cx - rx, cy, ry * .42, 0, TAU); x.fill(); x.restore(); // the light along its back, its nose cap
        x.fillStyle = "#E8B64A"; x.beginPath(); x.moveTo(cx + rx * .62, cy + ry * .02); x.lineTo(cx + rx * 1.12, cy - ry * .08); x.lineTo(cx + rx * 1.12, cy + ry * .34); x.lineTo(cx + rx * .7, cy + ry * .3); x.closePath(); x.fill(); // the fin on this side
        x.fillStyle = "#9CC0C8"; for (let k = 0; k < 4; k++) x.fillRect(cx - rx * .38 + k * rx * .1, cy + ry * .95, rx * .06, ry * .18); }); // the gondola's windows
      S.zep.props = [[4.0 * u, 3.13 * u], [6.2 * u, 3.13 * u]];
      // a dragon kite: a face in a golden mane, a tail of paper discs and a fin at its end
      S.dHead = make(6.4 * u, 6.4 * u, x => { const c = 3.2 * u; shade(x, 4, -1, 2);
        x.fillStyle = "#E8B64A"; x.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU - Math.PI / 2, rr = (k % 2 ? 2.15 : 2.9) * u; x.lineTo(c + Math.cos(a) * rr, c + Math.sin(a) * rr); } x.closePath(); x.fill();
        x.fillStyle = "#C8321F"; x.beginPath(); x.arc(c, c, 1.9 * u, 0, TAU); x.fill(); unshade(x);
        x.fillStyle = "#FBF3E4"; for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(c + sd * .7 * u, c - 1.5 * u); x.lineTo(c + sd * 1.25 * u, c - 2.75 * u); x.lineTo(c + sd * 1.15 * u, c - 1.3 * u); x.closePath(); x.fill(); } // horns
        x.fillStyle = "#E46D55"; x.beginPath(); x.ellipse(c, c + .72 * u, 1.2 * u, .8 * u, 0, 0, TAU); x.fill();
        x.fillStyle = "#FFFFFF"; for (const sd of [-1, 1]) { x.beginPath(); x.arc(c + sd * .72 * u, c - .38 * u, .5 * u, 0, TAU); x.fill(); } x.fillStyle = "#3A2A20"; for (const sd of [-1, 1]) { x.beginPath(); x.arc(c + sd * .64 * u, c - .32 * u, .25 * u, 0, TAU); x.fill(); }
        x.strokeStyle = "#7A1E12"; x.lineWidth = .14 * u; x.lineCap = "round"; for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(c + sd * .3 * u, c - .98 * u); x.lineTo(c + sd * 1.15 * u, c - 1.12 * u); x.stroke(); }
        x.fillStyle = "#7A1E12"; for (const sd of [-1, 1]) { x.beginPath(); x.arc(c + sd * .3 * u, c + .5 * u, .1 * u, 0, TAU); x.fill(); } x.beginPath(); x.moveTo(c - .7 * u, c + 1.02 * u); x.quadraticCurveTo(c, c + 1.42 * u, c + .7 * u, c + 1.02 * u); x.stroke(); });
      S.dDisc = [["#C8321F", "#E8B64A"], ["#E8B64A", "#C8321F"]].map(([a, b]) => make(2.8 * u, 2.8 * u, x => { const m = 1.4 * u; shade(x, 3, -.8, 1.6); x.fillStyle = a; x.beginPath(); x.arc(m, m, 1.05 * u, 0, TAU); x.fill(); unshade(x); x.fillStyle = b; x.beginPath(); x.arc(m, m, .5 * u, 0, TAU); x.fill(); x.fillStyle = "rgba(255,255,255,.28)"; x.beginPath(); x.arc(m + .32 * u, m - .32 * u, .26 * u, 0, TAU); x.fill(); }));
      S.dFin = make(3.4 * u, 3 * u, x => { shade(x, 3, -.8, 1.6); x.fillStyle = "#E8B64A"; x.beginPath(); x.moveTo(.5 * u, 1.5 * u); for (let k = 0; k <= 4; k++) { const a = -.8 + k * .4; x.lineTo(.5 * u + Math.cos(a) * 2.8 * u, 1.5 * u + Math.sin(a) * 2.8 * u * .55); if (k < 4) x.lineTo(.5 * u + Math.cos(a + .2) * 2.1 * u, 1.5 * u + Math.sin(a + .2) * 2.1 * u * .55); } x.closePath(); x.fill(); });
      // butterflies of cut paper, seen from above (their wings fold as they flap), and leaves, their fronts and paler backs
      S.fly = [["#E8B64A", "#C8321F"], ["#5F8EA6", "#FBF3E4"], ["#E0603F", "#FBF3E4"]].map(([w, s]) => make(3.6 * u, 3 * u, x => { const c = 1.8 * u; shade(x, 2.5, -.6, 1.2); x.fillStyle = w;
        for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(c, 1.35 * u); x.bezierCurveTo(c + sd * .8 * u, -.1 * u, c + sd * 2.0 * u, .05 * u, c + sd * 1.65 * u, 1.3 * u); x.quadraticCurveTo(c + sd * 1.0 * u, 1.6 * u, c, 1.5 * u); x.fill(); x.beginPath(); x.moveTo(c, 1.5 * u); x.quadraticCurveTo(c + sd * 1.55 * u, 1.55 * u, c + sd * 1.15 * u, 2.55 * u); x.quadraticCurveTo(c + sd * .45 * u, 2.7 * u, c, 1.75 * u); x.fill(); }
        unshade(x); x.fillStyle = s; for (const sd of [-1, 1]) { x.beginPath(); x.arc(c + sd * 1.25 * u, .75 * u, .25 * u, 0, TAU); x.fill(); x.beginPath(); x.arc(c + sd * .8 * u, 2.1 * u, .17 * u, 0, TAU); x.fill(); }
        x.fillStyle = "#4E3E30"; x.beginPath(); x.ellipse(c, 1.6 * u, .13 * u, .62 * u, 0, 0, TAU); x.fill(); x.strokeStyle = "#4E3E30"; x.lineWidth = .06 * u; x.beginPath(); x.moveTo(c - .05 * u, 1.05 * u); x.quadraticCurveTo(c - .3 * u, .5 * u, c - .5 * u, .35 * u); x.moveTo(c + .05 * u, 1.05 * u); x.quadraticCurveTo(c + .3 * u, .5 * u, c + .5 * u, .35 * u); x.stroke(); }));
      const pale = (h, t) => { const [r0, g0, b0] = K.rgb(h); return `rgb(${Math.round(r0 + (255 - r0) * t)},${Math.round(g0 + (255 - g0) * t)},${Math.round(b0 + (255 - b0) * t)})`; };
      S.leaf = ["#C8321F", "#E0A33C", "#D07C55", "#8FAF6E"].map(c => [c, pale(c, .32)].map(col => make(4 * u, 2.2 * u, x => { x.scale(1.36, 1.36); shade(x, 2.5, -.6, 1.2); x.fillStyle = col; x.beginPath(); x.moveTo(.3 * u, .8 * u); x.quadraticCurveTo(1.5 * u, -.2 * u, 2.8 * u, .8 * u); x.quadraticCurveTo(1.5 * u, 1.8 * u, .3 * u, .8 * u); x.fill(); unshade(x);
        x.strokeStyle = "rgba(90,50,20,.35)"; x.lineWidth = .08 * u; x.beginPath(); x.moveTo(0, .8 * u); x.lineTo(2.6 * u, .8 * u); for (const f of [.9, 1.5, 2.0]) { x.moveTo(f * u, .8 * u); x.lineTo((f + .35) * u, .45 * u); x.moveTo(f * u, .8 * u); x.lineTo((f + .35) * u, 1.15 * u); } x.stroke(); })));
    } else {
      // the night's: a lamp's beam for the cyclist; an owl, flying, its face turned to us (wings up, spread, down); geese;
      // fireflies; paper snowflakes; a constellation's stars, the needle that sews them, a comet
      S.beam = make(10 * u, 4.4 * u, x => { const gr = x.createRadialGradient(0, .8 * u, 0, 0, .8 * u, 10 * u); gr.addColorStop(0, "rgba(255,236,170,.5)"); gr.addColorStop(1, "rgba(255,236,170,0)"); x.fillStyle = gr; x.beginPath(); x.moveTo(0, .55 * u); x.lineTo(10 * u, -.4 * u); x.lineTo(10 * u, 4.4 * u); x.lineTo(0, 1.05 * u); x.closePath(); x.fill(); });
      const blade = (x, p0, tip, p1, bulge, col, rim) => { const dx = tip[0] - p0[0], dy = tip[1] - p0[1], l = Math.hypot(dx, dy); let nx = -dy / l, ny = dx / l; if (nx * (p1[0] - p0[0]) + ny * (p1[1] - p0[1]) > 0) { nx = -nx; ny = -ny; }
        const ex = p1[0] - tip[0], ey = p1[1] - tip[1], el = Math.hypot(ex, ey); let mx = -ey / el, my = ex / el; if (mx * (p0[0] - tip[0]) + my * (p0[1] - tip[1]) > 0) { mx = -mx; my = -my; }
        const lead = () => { x.moveTo(p0[0], p0[1]); x.quadraticCurveTo((p0[0] + tip[0]) / 2 + nx * bulge, (p0[1] + tip[1]) / 2 + ny * bulge, tip[0], tip[1]); };
        x.fillStyle = col; x.beginPath(); lead(); for (let k = 0; k < 4; k++) { const a0 = k / 4, a1 = (k + 1) / 4; x.quadraticCurveTo(lerp(tip[0], p1[0], (a0 + a1) / 2) + mx * .34 * u, lerp(tip[1], p1[1], (a0 + a1) / 2) + my * .34 * u, lerp(tip[0], p1[0], a1), lerp(tip[1], p1[1], a1)); } x.closePath(); x.fill();
        if (rim) { x.strokeStyle = rim; x.lineWidth = .1 * u; x.beginPath(); lead(); x.stroke(); } };
      S.owl = [0, 1, 2].map(f => make(9 * u, 8 * u, x => { const bx = 4.8 * u, by = 4.4 * u, Wn = [[[.5, -.7], [-1.0, -3.9], [-1.2, -.5]], [[.6, -.6], [-3.6, -1.2], [-.9, .1]], [[.5, -.4], [-.6, 3.2], [-1.3, 0]]][f].map(([a, b]) => [bx + a * u, by + b * u]);
        shade(x, 4, -1, 2, "rgba(0,0,0,.5)");
        blade(x, [Wn[0][0] + .6 * u, Wn[0][1] - .35 * u], [Wn[1][0] + .6 * u, Wn[1][1] - .35 * u], [Wn[2][0] + .6 * u, Wn[2][1] - .35 * u], .9 * u, "#161E36"); // the far wing
        x.fillStyle = "#1E2846"; x.beginPath(); x.moveTo(bx - 1.3 * u, by - .1 * u); x.lineTo(bx - 2.5 * u, by - .5 * u); x.lineTo(bx - 2.4 * u, by + .5 * u); x.closePath(); x.fill(); // the tail
        x.fillStyle = "#26335A"; x.beginPath(); x.ellipse(bx, by, 1.7 * u, 1.05 * u, -.12, 0, TAU); x.fill(); unshade(x);
        x.fillStyle = "#34436F"; x.beginPath(); x.ellipse(bx + .3 * u, by + .35 * u, 1.1 * u, .55 * u, -.12, 0, TAU); x.fill(); // its paler breast
        shade(x, 3, -.8, 1.6, "rgba(0,0,0,.45)"); blade(x, Wn[0], Wn[1], Wn[2], .9 * u, "#2F3E68", "rgba(150,175,235,.6)"); // the near wing
        const hx = bx + 1.5 * u, hy = by - .9 * u; x.fillStyle = "#2F3E68"; x.beginPath(); x.moveTo(hx - .75 * u, hy - .55 * u); x.lineTo(hx - .55 * u, hy - 1.25 * u); x.lineTo(hx - .2 * u, hy - .7 * u); x.lineTo(hx + .2 * u, hy - .7 * u); x.lineTo(hx + .55 * u, hy - 1.25 * u); x.lineTo(hx + .75 * u, hy - .55 * u); x.closePath(); x.fill(); x.beginPath(); x.arc(hx, hy, .9 * u, 0, TAU); x.fill(); unshade(x); // the head, its tufts
        x.fillStyle = "#3E4E82"; for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(hx + sd * .34 * u, hy + .05 * u, .42 * u, .46 * u, 0, 0, TAU); x.fill(); } // the face
        x.fillStyle = "#FFD98A"; for (const sd of [-1, 1]) { x.beginPath(); x.arc(hx + sd * .34 * u, hy, .25 * u, 0, TAU); x.fill(); } x.fillStyle = "#141B32"; for (const sd of [-1, 1]) { x.beginPath(); x.arc(hx + sd * .34 * u + .04 * u, hy + .02 * u, .12 * u, 0, TAU); x.fill(); }
        x.fillStyle = "#B89A5A"; x.beginPath(); x.moveTo(hx - .11 * u, hy + .22 * u); x.lineTo(hx + .11 * u, hy + .22 * u); x.lineTo(hx, hy + .5 * u); x.closePath(); x.fill(); }));
      S.goose = [0, 1].map(f => make(5 * u, 3.6 * u, x => { const bx = 2.2 * u, by = 1.9 * u; shade(x, 2, -.5, 1, "rgba(0,0,0,.45)"); x.fillStyle = "#1B2645";
        x.beginPath(); x.ellipse(bx, by, 1.1 * u, .4 * u, 0, 0, TAU); x.fill(); x.strokeStyle = "#1B2645"; x.lineWidth = .26 * u; x.lineCap = "round"; x.beginPath(); x.moveTo(bx + .8 * u, by - .1 * u); x.quadraticCurveTo(bx + 1.5 * u, by - .25 * u, bx + 2.05 * u, by - .32 * u); x.stroke();
        x.beginPath(); x.arc(bx + 2.1 * u, by - .34 * u, .24 * u, 0, TAU); x.fill(); x.beginPath(); x.moveTo(bx + 2.3 * u, by - .42 * u); x.lineTo(bx + 2.75 * u, by - .3 * u); x.lineTo(bx + 2.3 * u, by - .22 * u); x.closePath(); x.fill(); // the head and bill
        x.beginPath(); x.moveTo(bx - 1 * u, by); x.lineTo(bx - 1.55 * u, by - .25 * u); x.lineTo(bx - 1.5 * u, by + .2 * u); x.closePath(); x.fill(); // the tail
        x.beginPath(); if (f === 0) { x.moveTo(bx + .5 * u, by - .2 * u); x.quadraticCurveTo(bx - .1 * u, by - 1.3 * u, bx - .9 * u, by - 1.7 * u); x.quadraticCurveTo(bx - .5 * u, by - .8 * u, bx - .5 * u, by - .1 * u); } else { x.moveTo(bx + .5 * u, by); x.quadraticCurveTo(bx - .1 * u, by + 1.0 * u, bx - .7 * u, by + 1.5 * u); x.quadraticCurveTo(bx - .45 * u, by + .6 * u, bx - .5 * u, by + .1 * u); } x.closePath(); x.fill(); unshade(x); // the wing
        x.strokeStyle = "rgba(150,175,235,.55)"; x.lineWidth = .08 * u; x.beginPath(); x.moveTo(bx - 1 * u, by - .25 * u); x.quadraticCurveTo(bx, by - .52 * u, bx + .8 * u, by - .3 * u); x.quadraticCurveTo(bx + 1.5 * u, by - .5 * u, bx + 2.05 * u, by - .58 * u); x.stroke(); })); // moonlight along its back
      { const gl = K.glowSpr(Math.round(3.2 * u), [214, 245, 140], .7), r0 = gl.width / 2; S.ffGlow = make(gl.width, gl.width, x => { x.globalAlpha = .9; x.drawImage(gl, 0, 0); x.globalAlpha = 1; x.fillStyle = "#F6FFC8"; x.beginPath(); x.arc(r0, r0, .32 * u, 0, TAU); x.fill(); }); } /* its glow and its dot in one */
      S.flakes = [0, 1, 2].map(v => make(3.2 * u, 3.2 * u, x => { const c = 1.6 * u, L = 1.35 * u, w = .16 * u; shade(x, 2, -.4, .9, "rgba(0,0,0,.4)"); x.fillStyle = "#EEF1FF"; x.beginPath();
        for (let k = 0; k < 6; k++) { x.save(); x.translate(c, c); x.rotate(k / 6 * TAU); x.rect(0, -w / 2, L, w); for (const [f, l] of v === 0 ? [[.5, .38], [.78, .25]] : v === 1 ? [[.4, .3], [.62, .42], [.84, .22]] : [[.66, .5]]) { x.save(); x.translate(L * f, 0); x.rotate(.9); x.rect(0, -w * .4, L * l, w * .8); x.rotate(-1.8); x.rect(0, -w * .4, L * l, w * .8); x.restore(); } x.restore(); }
        x.fill(); x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.lineTo(c + Math.cos(a) * w * 1.6, c + Math.sin(a) * w * 1.6); } x.closePath(); x.fill(); }));
      S.cStar = star("#FFF4D6", .72);
      S.cut = make(160, 80, x => { x.fillStyle = "#000"; for (let q = 0; q < 12; q++) { x.globalAlpha = .26; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } }); /* a soft pad, for cutting away under the words */ S.cometHead = star("#FFE9A8", 1.3, 8, .5); S.cometGlow = K.glowSpr(Math.round(5 * u), [255, 233, 168], .45);
      S.needle = make(6 * u, 1.5 * u, x => { shade(x, 2, -.5, 1, "rgba(0,0,0,.4)"); x.fillStyle = "#E2E7F4"; x.beginPath(); x.moveTo(5.9 * u, .75 * u); x.lineTo(.6 * u, .47 * u); x.quadraticCurveTo(.1 * u, .75 * u, .6 * u, 1.03 * u); x.closePath(); x.fill(); unshade(x);
        x.globalCompositeOperation = "destination-out"; x.beginPath(); x.ellipse(1.05 * u, .75 * u, .32 * u, .09 * u, 0, 0, TAU); x.fill(); x.globalCompositeOperation = "source-over"; x.strokeStyle = "rgba(255,255,255,.8)"; x.lineWidth = .06 * u; x.beginPath(); x.moveTo(1.6 * u, .64 * u); x.lineTo(5.5 * u, .72 * u); x.stroke(); });
    }
  }

  /* the balloons' paper: day's gores in pairs of colours with a band and a skirt; night's dark, and lit from inside */
  const BALLOONS = [["#D9563F", "#FBF3E4", "#E8B64A", "#8E3A2A"], ["#5F8EA6", "#FBF3E4", "#E0603F", "#3F6278"], ["#E8B64A", "#D9563F", "#FBF3E4", "#9A6A2A"], ["#8FAF6E", "#FBF3E4", "#C8321F", "#5E7A48"]];
  const NBALLOONS = [["#2F3E68", "#3A4A7A", "#6E6690", "#1E2846"], ["#3A3458", "#4A4270", "#7A6A5A", "#241F3A"]];
  const LIT = [["#FF9F4A", "#FFD27A", "#FFF1C4", "#8A4A26"], ["#FF8C5A", "#FFC86E", "#FFE8B0", "#7A3A26"]];
  const balloonOf = (ci, lit) => { const key = (lit ? "l" : "d") + ci; return S.bCache[key] || (S.bCache[key] = balloonSpr(lit ? LIT[ci % LIT.length] : night ? NBALLOONS[ci % NBALLOONS.length] : BALLOONS[ci % BALLOONS.length], lit)); };
  /** a hot-air balloon of cut paper: eight gores in two colours, a band round its waist cut with pinking shears, the
   *  skirt, ropes, a wicker basket and its sandbags; `lit`: the envelope alone, glowing from the burner under it */
  function balloonSpr(cols, lit) {
    const { u } = S, R = S.bR, w = R * 2 + 3 * u, h = R * 3.25 + 3 * u, cx = R + 1.5 * u, cy = R + 1.2 * u, mouth = cy + R * 1.32;
    const hw = y => y <= cy ? Math.sqrt(Math.max(0, R * R - (y - cy) * (y - cy))) : R * (1 - .7 * Math.pow(clamp((y - cy) / (mouth - cy)), 1.7));
    const ys = []; for (let i = 0; i <= 24; i++) ys.push(cy - R * Math.cos(i / 24 * Math.PI / 2)); for (let i = 1; i <= 20; i++) ys.push(cy + (mouth - cy) * i / 20);
    const outline = new Path2D(); ys.forEach((y, i) => i ? outline.lineTo(cx - hw(y), y) : outline.moveTo(cx - hw(y), y)); for (let i = ys.length - 1; i >= 0; i--) outline.lineTo(cx + hw(ys[i]), ys[i]); outline.closePath();
    const seam = k => ys.map(y => [cx + hw(y) * Math.sin(-Math.PI / 2 + k * Math.PI / 8), y]);
    const spr = make(w, h, x => {
      if (!lit) { // the basket, its ropes and sandbags, and the skirt, under the envelope
        const by = mouth + R * .5, bw = R * .42, bh = R * .3;
        x.strokeStyle = "rgba(90,70,50,.75)"; x.lineWidth = Math.max(.6, .07 * u); for (const [a, b] of [[-.26, -.2], [-.1, -.08], [.1, .08], [.26, .2]]) { x.beginPath(); x.moveTo(cx + a * R, mouth + R * .1); x.lineTo(cx + b * R * 1.05, by); x.stroke(); }
        shade(x, 4, -1, 2); x.fillStyle = "#B8864F"; x.beginPath(); x.roundRect(cx - bw / 2, by, bw, bh, bh * .18); x.fill(); unshade(x);
        x.fillStyle = "#8E6238"; x.fillRect(cx - bw / 2 - .08 * u, by - .05 * u, bw + .16 * u, bh * .2);
        x.strokeStyle = "rgba(110,72,36,.55)"; x.lineWidth = Math.max(.5, .05 * u); for (let k = 1; k < 3; k++) { x.beginPath(); x.moveTo(cx - bw / 2, by + bh * (.2 + k * .27)); x.lineTo(cx + bw / 2, by + bh * (.2 + k * .27)); x.stroke(); } for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(cx - bw / 2 + bw * k / 4, by + bh * .2); x.lineTo(cx - bw / 2 + bw * k / 4, by + bh); x.stroke(); }
        x.fillStyle = "#CDB48B"; for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(cx + sd * (bw / 2 + .12 * u), by + bh * .55, .13 * u, .2 * u, 0, 0, TAU); x.fill(); }
        x.fillStyle = cols[3]; x.beginPath(); x.moveTo(cx - hw(mouth), mouth - .5); x.lineTo(cx + hw(mouth), mouth - .5); x.lineTo(cx + R * .19, mouth + R * .14); x.lineTo(cx - R * .19, mouth + R * .14); x.closePath(); x.fill();
      }
      if (!lit) shade(x, 7, -1.6, 2.8); x.fillStyle = cols[0]; x.fill(outline); unshade(x);
      x.save(); x.clip(outline);
      x.fillStyle = cols[1]; for (let k = 1; k < 8; k += 2) { const a = seam(k), b = seam(k + 1); x.beginPath(); a.forEach(([p, q], i) => i ? x.lineTo(p, q) : x.moveTo(p, q)); for (let i = b.length - 1; i >= 0; i--) x.lineTo(b[i][0], b[i][1]); x.closePath(); x.fill(); }
      const y1 = cy + R * .1, y2 = cy + R * .32; x.fillStyle = cols[2]; x.beginPath(); x.moveTo(cx - R, y1); x.lineTo(cx + R, y1); x.lineTo(cx + R, y2); for (let k = 12; k >= 0; k--) x.lineTo(cx - R + 2 * R * k / 12, y2 + (k % 2 ? R * .09 : 0)); x.closePath(); x.fill(); // the band, cut with pinking shears
      x.strokeStyle = lit ? "rgba(140,60,10,.3)" : "rgba(80,50,30,.14)"; x.lineWidth = Math.max(.5, .05 * u); for (let k = 1; k < 8; k++) { x.beginPath(); seam(k).forEach(([p, q], i) => i ? x.lineTo(p, q) : x.moveTo(p, q)); x.stroke(); } // the seams
      if (lit) { const gr = x.createRadialGradient(cx, mouth, R * .1, cx, cy, R * 1.6); gr.addColorStop(0, "rgba(255,250,220,.7)"); gr.addColorStop(.5, "rgba(255,220,150,.22)"); gr.addColorStop(1, "rgba(255,200,120,0)"); x.fillStyle = gr; x.fillRect(0, 0, w, h); }
      else { const gr = x.createLinearGradient(cx - R, 0, cx + R, 0); gr.addColorStop(0, "rgba(70,45,25,.22)"); gr.addColorStop(.55, "rgba(70,45,25,0)"); gr.addColorStop(1, "rgba(255,255,255,.12)"); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(255,255,255,.2)"; x.beginPath(); x.ellipse(cx + R * .38, cy - R * .42, R * .2, R * .34, .5, 0, TAU); x.fill(); } // shade on the left, light from the upper right
      x.restore();
    });
    spr.ax = cx / w; spr.ay = cy / h; spr.mouth = mouth - cy; return spr;
  }
  /** a rainbow of six paper bands, arching over the valley from behind the near bank */
  function rainbowSpr(cx, cy, rx, ry, bw, leg) {
    const x0 = cx - rx - 14, y0 = cy - ry - 14, C = ["#D9563F", "#E8904A", "#EBC35A", "#8DB872", "#6FA3C0", "#9B86C0"];
    const spr = make(rx * 2 + 28, ry + leg + 28, x => { x.translate(-x0, -y0); x.clip(S.frontClip); /* its feet behind the near bank */
      for (let k = 0; k < 6; k++) { const oX = rx - k * bw, oY = ry - k * bw, iX = oX - bw, iY = oY - bw; shade(x, 6, -1.4, 2.6); x.fillStyle = C[k]; x.beginPath(); x.ellipse(cx, cy, oX, oY, 0, Math.PI, TAU); x.lineTo(cx + oX, cy + leg); x.lineTo(cx + iX, cy + leg); x.lineTo(cx + iX, cy); x.ellipse(cx, cy, iX, iY, 0, TAU, Math.PI, true); x.lineTo(cx - iX, cy + leg); x.lineTo(cx - oX, cy + leg); x.closePath(); x.fill(); unshade(x);
        x.strokeStyle = "rgba(255,255,255,.4)"; x.lineWidth = .8; x.beginPath(); x.ellipse(cx, cy, oX - .7, oY - .7, 0, Math.PI, TAU); x.stroke(); } });
    spr.x0 = x0; spr.y0 = y0; return spr;
  }

  /* ---------------- the day's beats ---------------- */
  /** a paper plane along `b.path` over [t0, t1], its dotted line behind it */
  function dPlane(T, I, b) {
    const { u } = S, pp = seg(T, b.t0, b.t1, E.sine) * (I > .01 ? 1 : 0);
    if (pp > 0 && pp < 1) {
      const path = b.path, n = path.length - 1, i = Math.min(n - 1, Math.floor(pp * n)), f = pp * n - i, p = [lerp(path[i][0], path[i + 1][0], f), lerp(path[i][1], path[i + 1][1], f)], ang = Math.atan2(path[i + 1][1] - path[i][1], path[i + 1][0] - path[i][0]);
      const from = Math.max(0, i - Math.floor(n * .34)); g.save(); g.setLineDash([1.1 * u, 1.3 * u]);
      if (b.fade) { let m = 0; for (let k = from; k <= i && m < LP.length - 4; k++) { LP[m++] = path[k][0]; LP[m++] = path[k][1]; } LP[m++] = p[0]; LP[m++] = p[1]; fadedLine(LP, m / 2, 2 * u, [[.45 * u, I * (1 - seg(pp, .75, 1)), b.trail]]); }
      else { g.lineWidth = .45 * u; g.strokeStyle = b.trail; g.globalAlpha = I * (1 - seg(pp, .75, 1)); g.beginPath(); g.moveTo(path[from][0], path[from][1]); for (let k = from + 1; k <= i; k++) g.lineTo(path[k][0], path[k][1]); g.lineTo(p[0], p[1]); g.stroke(); }
      g.restore();
      put(b.spr, p[0], p[1], .55, .45, ang, 1, b.sy, I);
    }
  }
  /** a plane's path: in from past one edge, `loops` loops, out past the other and up (mirrored when `dir` < 0) */
  function planePath(dir, cx, cy, R, loops) {
    const { W, H } = S, n = 160 + 80 * (loops - 1), fi = loops > 1 ? .3 : .4, fo = loops > 1 ? .8 : .72, drift = R * .9, pts = [];
    for (let i = 0; i <= n; i++) { const v = i / n; let x, y;
      if (v < fi) { const k = v / fi; x = lerp(-W * .12, cx, k); y = lerp(cy + H * .035, cy, E.sine(k)); }
      else if (v < fo) { const th = (v - fi) / (fo - fi) * TAU * loops; x = cx + R * Math.sin(th) + drift * th / TAU; y = cy - R * (1 - Math.cos(th)); }
      else { const k = (v - fo) / (1 - fo); x = lerp(cx + drift * loops, W * 1.14, k); y = lerp(cy, cy - H * .09, k * k); }
      pts.push([dir < 0 ? W - x : x, y]); }
    return pts;
  }
  /** a train along the viaduct: the engine, then its cars or wagons; right to left (the first pass's) or, mirrored, left
   *  to right. It puffs paper steam that swells as it rises, drifts back and thins away; it comes on from past one edge
   *  and goes all the way off the other before it is gone */
  function dTrain(T, I, A, b) {
    const { u } = S, t0 = b.t0, t1 = b.t1, gap = S.tW + .8 * u, parts = b.parts, xs = b.xs, xe = b.xe, fw = b.dir > 0, trainX = t => lerp(xs, xe, seg(t, t0, t1, x => x));
    if (I > .01 && T > t0 && T < t1 + 1.9) {
      const chimneyTop = S.deckY - parts[0].foot + u; /* the puffs start at the chimney's mouth, swell as they rise and drift back, and thin away */
      for (let te = t0; te < Math.min(T, t1); te += .24) { const age = T - te, q = age / 1.9; if (q >= 1) continue; const cx = fw ? trainX(te) - 1.8 * u - S.tW * .17 : trainX(te) + 1.8 * u + S.tW * .17, sz = .45 + .85 * E.out(q); const px2 = fw ? cx - q * 7 * u : cx + q * 7 * u, py2 = chimneyTop - E.out(q) * 9 * u; put(S.puff, px2, py2, .5, .75, Math.sin(te * 9) * (fw ? -.3 : .3), fw ? -sz : sz, sz, I * (q < .08 ? q / .08 : 1) * (1 - q) * (.45 + .55 * S.shade(px2, py2 - 2 * u, 3 * u))); }
      if (T < t1) { const x0 = trainX(T); parts.forEach((c, k) => { const off = k ? 1.8 * u + S.tW + .8 * u + (k - 1) * gap : 0, x = fw ? x0 - off : x0 + off, y = S.deckY - c.foot; put(c, x, y, 0, 0, 0, fw ? -1 : 1, 1, I * (.45 + .55 * S.shade(fw ? x - c.w2 / 2 : x + c.w2 / 2, y + c.h2 / 2, c.w2 / 2))); /* under vellum where it passes behind a line */
        for (let s2 = 0; s2 < 2; s2++) { const sh = c.h2 / 2, wob = Math.sin(A * 4 + s2 * 2.1 + k * .7) * .35 * u; g.save(); g.globalAlpha = .14 * I; g.translate(fw ? x - wob : x + wob, S.riverY + .6 * u + s2 * sh * .6); g.scale(fw ? -1 : 1, -.6); g.drawImage(c, 0, (1 - s2) * sh * px, c.width, sh * px, 0, -sh, c.w2, sh); g.restore(); } }); }
    }
  }
  /** a leg from the hip to its pedal, bent at the knee (the crank turns about (cx, cy), at angle `ang`) */
  function leg(hx, hy, cx, cy, ang, col, w) {
    const { u } = S, L1 = 1.15 * u, px2 = cx + Math.cos(ang) * .45 * u, py2 = cy + Math.sin(ang) * .45 * u, dx = px2 - hx, dy = py2 - hy, d = Math.min(Math.hypot(dx, dy), 2 * L1 - .01), base = Math.atan2(dy, dx), bend = Math.acos(d / (2 * L1));
    const k1 = base - bend, k2 = base + bend, kk = Math.cos(k1) > Math.cos(k2) ? k1 : k2, kx = hx + Math.cos(kk) * L1, ky = hy + Math.sin(kk) * L1;
    g.strokeStyle = S.cC.tyre; g.lineWidth = .12 * u; g.beginPath(); g.moveTo(cx, cy); g.lineTo(px2, py2); g.stroke(); // the crank
    g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(hx, hy); g.lineTo(kx, ky); g.lineTo(px2, py2); g.lineTo(px2 + .35 * u, py2 + .05 * u); g.stroke();
  }
  /** a cyclist along the viaduct, the wheels turning and the legs pedalling as far as the road goes; by night, a lamp */
  function dCyclist(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, s = b.s, x = lerp(b.xs, b.xe, k), y = S.deckY - .05 * u, wa = Math.abs(x - b.xs) / s / (.95 * u), ca = wa * .42 + b.ph, a = clamp(I * vel(x, y - 3 * u * s, 3 * u * s));
    g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(b.dir * s, s); g.lineCap = "round"; g.lineJoin = "round";
    if (night) { g.globalAlpha = a * .75; g.drawImage(S.beam, 1.78 * u, -3.24 * u, S.beam.w2, S.beam.h2); g.globalAlpha = a; }
    leg(-.35 * u, -2.55 * u, 0, -.9 * u, ca + Math.PI, S.cC.legs2, .34 * u); // the far leg
    for (const hx of [-1.55, 1.55]) { g.save(); g.translate(hx * u, -.95 * u); g.rotate(wa); g.drawImage(S.wheel, -S.wheel.w2 / 2, -S.wheel.h2 / 2, S.wheel.w2, S.wheel.h2); g.restore(); }
    g.drawImage(S.cyc, -S.cyc.ox, -S.cyc.oy, S.cyc.w2, S.cyc.h2);
    leg(-.35 * u, -2.55 * u, 0, -.9 * u, ca, S.cC.legs, .38 * u); // the near one
    g.restore();
  }
  /** the kite: it lies on the hill, tied to its peg, until the wind lifts it (`fly`: its four times; null, a pass it stays
   *  down); it climbs, flies a while and comes down to rest again (and settles if the list is touched mid-flight). Its
   *  tail lies along the grass, and in the air hangs from it, streaming down the wind */
  function dKite(T, I, A, dt, fly) {
    const { u } = S, kg = 1 - Math.exp(-dt * 1.5), goal = S.kiteTop || S.kt || S.kiteTop0; S.kt = S.kt ? [lerp(S.kt[0], goal[0], kg), lerp(S.kt[1], goal[1], kg)] : goal.slice(); /* it glides to a new height when the list changes */
    S.kOk = (S.kOk === undefined ? 1 : S.kOk) + ((S.kiteTop ? 1 : 0) - (S.kOk === undefined ? 1 : S.kOk)) * kg; /* no clear sky: it settles on the bank */
    const [ax, ay] = S.kiteAnchor, [tx, ty] = S.kt, rest = [ax + 3.4 * u, ay - .5 * u];
    const kf = fly ? seg(T, fly[0], fly[1], E.out) * (1 - seg(T, fly[2], fly[3], E.io)) * I * S.kOk : 0, lift = seg(kf, 0, .22, E.sine);
    const kx = lerp(rest[0], tx, E.sine(kf)) + Math.sin(A * 1.7) * 1.4 * u * kf, ky = lerp(rest[1], ty, kf) - Math.sin(kf * Math.PI) * 3 * u + Math.sin(A * 2.3 + 1) * u * kf, rot = lerp(1.32, Math.sin(A * 2.1) * .14, lift);
    { const cx2 = lerp(ax, kx, .6), cy2 = lerp(ay, ky, .25) + 6 * u * lift, ex2 = kx, ey2 = ky + 1.5 * u, at = q => [(1 - q) * (1 - q) * ax + 2 * (1 - q) * q * cx2 + q * q * ex2, (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * cy2 + q * q * ey2];
      g.lineWidth = .7; for (let k = 0; k < 28; k++) { const [x1, y1] = at(k / 28), [x2, y2] = at((k + 1) / 28), a = S.shade((x1 + x2) / 2, (y1 + y2) / 2, 3 * u); if (a < .02) continue; g.strokeStyle = `rgba(96,74,50,${(.45 * a).toFixed(3)})`; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } } /* the string: it goes behind the words */
    for (let b = 5; b >= 1; b--) { const th = Math.PI / 2 - .55 + Math.sin(A * 3.2 + b * .9) * .24 * (b / 5), fx = kx + Math.cos(th) * (b * 2.1 + 1.2) * u, fy = ky + 2.2 * u + Math.sin(th) * (b * 2.1 + 1.2) * u;
      put(S.bows[b % 2], lerp(rest[0] + (b * 2.2 + 2.2) * u, fx, lift), lerp(rest[1] + .3 * u, fy, lift), .5, .5, lerp(0, Math.sin(A * 4 + b) * .4, lift)); }
    put(S.kite, kx, ky, .5, .45, rot);
  }
  /** the paper birds across the sky in a V, right to left (or, mirrored, left to right) */
  function dBirds(T, I, A, b) {
    const { W, u } = S, fb = seg(T, b.t0, b.t1, x => x) * (I > .01 ? 1 : 0);
    if (fb > 0 && fb < 1) { const lx = lerp(W + 4 * u, b.end, fb), ly = b.y + Math.sin(fb * 5) * 2 * u; for (const f of b.flock) { const x = lx + f.dx * -1 + (f.dx < 0 ? -f.dx * .2 : 0) + Math.abs(f.dx) * .9; const bx = b.dir < 0 ? x : W - x; put(S.bird[Math.floor(A * 7 + f.ph) % 2], bx, ly + f.dy, .5, .5, 0, 1, 1, b.fade ? I * S.shade(bx, ly + f.dy, 2 * u) : I); } }
  }
  /** a biplane across the sky, towing a streamer of coral and cream that ripples in its wake; off past the far edge,
   *  streamer and all */
  function dBiplane(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, dir = b.dir, x = lerp(b.xs, b.xe, k), wv = k * TAU * 1.4 + b.ph, y = b.y + Math.sin(wv) * 1.3 * u, pitch = -Math.cos(wv) * .07, a = clamp(I * vel(x, y, 5 * u));
    const tx = x - dir * 3.2 * u, ty = y + .1 * u, n = 18, pts = S.bpts || (S.bpts = Array.from({ length: n + 1 }, () => [0, 0]));
    for (let i = 0; i <= n; i++) { const d = 2.2 * u + i * 1.05 * u, wave = Math.sin(A * 7 - i * .62 + b.ph) * (.12 + i * .05) * u; pts[i][0] = tx - dir * d; pts[i][1] = ty + .5 * u + wave + i * i * .004 * u; }
    const w = .62 * u, edge = (i, s) => { const p = pts[Math.max(0, i - 1)], q = pts[Math.min(n, i + 1)], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [pts[i][0] - (q[1] - p[1]) / l * w * s, pts[i][1] + (q[0] - p[0]) / l * w * s]; };
    g.save(); g.globalAlpha = a;
    g.strokeStyle = "rgba(96,74,50,.6)"; g.lineWidth = .7; g.beginPath(); const e0 = edge(0, 1), e1 = edge(0, -1); g.moveTo(tx, ty); g.lineTo(e0[0], e0[1]); g.moveTo(tx, ty); g.lineTo(e1[0], e1[1]); g.stroke(); // the bridle
    g.beginPath(); for (let i = 0; i <= n; i++) { const e = edge(i, 1); i ? g.lineTo(e[0], e[1]) : g.moveTo(e[0], e[1]); } g.lineTo(pts[n][0] + dir * .8 * u, pts[n][1]); for (let i = n; i >= 0; i--) { const e = edge(i, -1); g.lineTo(e[0], e[1]); } g.closePath(); // a swallowtail at its end
    shade(g, 3, -.8, 1.6); g.fillStyle = "#FBF3E4"; g.fill(); unshade(g);
    g.fillStyle = "#E0603F"; for (let i = 1; i < n - 1; i += 2) { const a0 = edge(i, 1), a1 = edge(i + 1, 1), b1 = edge(i + 1, -1), b0 = edge(i, -1); g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.lineTo(b0[0], b0[1]); g.closePath(); g.fill(); }
    g.restore();
    put(S.biplane, x, y, .5, .44, pitch * dir, dir, 1, a);
    g.save(); g.globalAlpha = a * .45; g.fillStyle = "#FFFDF6"; g.translate(x + dir * 2.72 * u, y + .02 * u); g.rotate(pitch * dir); g.beginPath(); g.ellipse(0, 0, .16 * u, 1.15 * u, 0, 0, TAU); g.fill(); g.globalAlpha = a; g.fillStyle = "#4E3E30"; g.beginPath(); g.arc(0, 0, .16 * u, 0, TAU); g.fill(); g.restore(); // the propeller, a blur of pale paper
  }
  /** a zeppelin, slowly across the whole sky, its engines' propellers a blur */
  function dZeppelin(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, x = lerp(b.xs, b.xe, k), y = b.y + Math.sin(A * .6 + b.ph) * .5 * u, rot = Math.sin(A * .6 + b.ph + 1.2) * .012, sx = -b.dir, a = clamp(I * vel(x, y, 8 * u));
    put(S.zep, x, y, .5, .42, rot, sx, 1, a);
    g.save(); g.globalAlpha = a * .5; g.fillStyle = "#FFFDF6"; for (const [px2, py2] of S.zep.props) { g.beginPath(); g.ellipse(x + sx * px2, y + py2, .12 * u, .75 * u, 0, 0, TAU); g.fill(); } g.restore();
  }
  /** a balloon rising from behind the near bank, slowly and then quicker as it clears it, and away past the side on the
   *  wind, its basket swinging; its burner flares now and then (by night lighting it up from inside) */
  function dBalloon(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, R = S.bR, spr = b.spr, rise = E.io(clamp(k / .62)), away = Math.pow(clamp((k - .16) / .84), 2.1);
    const x = b.x0 + b.dir * away * b.dist + Math.sin(A * .5 + b.ph) * .5 * u, y = lerp(b.yHide, b.yCruise, rise) - away * b.lift + Math.sin(A * .9 + b.ph) * .4 * u * rise;
    const rot = Math.sin(A * .8 + b.ph) * .03 + b.dir * away * .06, f0 = b.flares[0], f1 = b.flares[1], burn = Math.max(env(T, f0, f0 + .2, f0 + .8, f0 + 1.4, E.sine), env(T, f1, f1 + .2, f1 + .8, f1 + 1.4, E.sine));
    const a = clamp(I * vel(x, y, R * 1.3)), low = y + R * (night ? 3.4 : 2.2) > S.frontTop;
    g.save(); if (low) g.clip(S.frontClip);
    if (night) { g.globalAlpha = a * (.4 + .55 * burn); g.drawImage(S.bGlow, x - S.bGlow.w2 / 2, y + R * .3 - S.bGlow.h2 / 2, S.bGlow.w2, S.bGlow.h2); g.globalAlpha = 1; }
    put(spr, x, y, spr.ax, spr.ay, rot, 1, 1, a);
    if (night) put(b.lit, x, y, spr.ax, spr.ay, rot, 1, 1, a * (.62 + .38 * burn)); /* lit from inside, brighter as the burner flares */
    g.translate(x, y); g.rotate(rot); g.globalAlpha = a * (.55 + .45 * burn); const fy = spr.mouth + R * .3, fh = R * (.14 + .3 * burn) * (1 + .1 * Math.sin(A * 17)), fw = R * (.06 + .05 * burn); // the burner's flame
    g.fillStyle = "#F2894A"; g.beginPath(); g.moveTo(0, fy - fh); g.quadraticCurveTo(fw * 1.6, fy - fh * .2, 0, fy + fw * .6); g.quadraticCurveTo(-fw * 1.6, fy - fh * .2, 0, fy - fh); g.fill();
    g.fillStyle = "#FFE27A"; g.beginPath(); g.moveTo(0, fy - fh * .6); g.quadraticCurveTo(fw * .8, fy - fh * .1, 0, fy + fw * .3); g.quadraticCurveTo(-fw * .8, fy - fh * .1, 0, fy - fh * .6); g.fill();
    g.restore();
  }
  /** the rainbow: its six paper bands laid across the valley one after another from one foot to the other, their feet
   *  behind the near bank; later taken up again the same way, each after the last */
  function dRainbow(T, I, b) {
    if (I <= .01 || T <= b.t0 || T >= b.t1) return;
    const { cx, cy, rx, ry, bw, spr } = b, path = new Path2D(); let any = false;
    for (let k = 0; k < 6; k++) {
      const d = k * .2, grow = E.io(seg(T, b.t0 + d, b.t0 + d + 1.7, x => x)), go = E.io(seg(T, b.t1 - 2.4 + d * .6, b.t1 - 2.4 + d * .6 + 1.5, x => x));
      if (grow <= 0 || go >= 1) continue;
      let a0 = Math.PI + go * Math.PI, a1 = Math.PI + grow * Math.PI; if (b.dir < 0) { const q0 = 3 * Math.PI - a1, q1 = 3 * Math.PI - a0; a0 = q0; a1 = q1; }
      if (a1 - a0 < .002) continue; any = true;
      const oX = k ? rx - k * bw : rx + 8, oY = k ? ry - k * bw : ry + 8, iX = k < 5 ? rx - (k + 1) * bw : rx - 6 * bw - 10, iY = k < 5 ? ry - (k + 1) * bw : ry - 6 * bw - 10; /* the outermost and innermost reach out for their shadows */
      path.moveTo(cx + Math.cos(a0) * oX, cy + Math.sin(a0) * oY); path.ellipse(cx, cy, oX, oY, 0, a0, a1); path.lineTo(cx + Math.cos(a1) * iX, cy + Math.sin(a1) * iY); path.ellipse(cx, cy, iX, iY, 0, a1, a0, true); path.closePath();
      if (a0 <= Math.PI + .001) path.rect(cx - oX, cy - 1, oX - iX, b.leg + 1); if (a1 >= TAU - .001) path.rect(cx + iX, cy - 1, oX - iX, b.leg + 1); /* the feet, down behind the bank */
    }
    if (!any) return;
    g.save(); g.clip(path); g.globalAlpha = clamp(I); g.drawImage(spr, spr.x0, spr.y0, spr.w2, spr.h2); g.restore();
  }
  /** a dragon kite flown from below the page: it climbs into the clear sky and weaves there, its tail of paper discs
   *  rippling down the wind, and is hauled down out of sight again */
  function dDragon(T, I, A, b) {
    const goal = S.dragonTop === undefined ? [S.pr ? S.W * .13 : S.W * .66, S.pr ? S.H * .17 : S.H * .22] : S.dragonTop; if (!goal || I <= .01 || T <= b.t0 || T >= b.t1) return; /* no clear sky for it: it isn't flown */
    const { H, u } = S, up = seg(T, b.t0, b.t0 + 3.2, E.out), down = seg(T, b.t1 - 2.8, b.t1, E.in), fly = up * (1 - down), tx = goal[0] + b.dx, ty = goal[1];
    let hx = lerp(tx + b.e0, tx, up) + Math.sin(A * .8 + b.ph) * 3 * u * fly, hy = lerp(H + 6 * u, ty, up) + Math.sin(A * 1.3 + b.ph) * 1.4 * u * fly;
    hx = lerp(hx, tx + b.e1, down); hy = lerp(hy, H + 8 * u, down);
    const a = clamp(I * vel(hx, hy, 3 * u)), sa = [tx + b.sa, H + 2 * u];
    { const cx2 = lerp(sa[0], hx, .45), cy2 = lerp(sa[1], hy, .4) + 7 * u, at = q => [(1 - q) * (1 - q) * sa[0] + 2 * (1 - q) * q * cx2 + q * q * hx, (1 - q) * (1 - q) * sa[1] + 2 * (1 - q) * q * cy2 + q * q * hy];
      g.lineWidth = .7; g.strokeStyle = "rgb(96,74,50)"; let run = -1; for (let k = 0; k <= 24; k++) { let q = -1; if (k < 24) { const [x1, y1] = at(k / 24), [x2, y2] = at((k + 1) / 24); q = Math.round(S.shade((x1 + x2) / 2, (y1 + y2) / 2, 3 * u) * I * 16); }
        if (q !== run) { if (run > 0) { g.globalAlpha = .45 * run / 16; g.stroke(); } run = q; if (q > 0) { const [x1, y1] = at(k / 24); g.beginPath(); g.moveTo(x1, y1); } } if (q > 0) { const [x2, y2] = at((k + 1) / 24); g.lineTo(x2, y2); } } g.globalAlpha = 1; } /* its string, from someone below the page, in runs of one strength; it goes behind the words */
    const sg = S.dSeg, N = sg.length; let x = hx + 1.2 * u, y = hy + .9 * u; for (let i = 0; i < N; i++) { const th = .44 + Math.sin(A * 2.4 - i * .5 + b.ph) * .34 * (i + 3) / (N + 3); x += Math.cos(th) * 1.42 * u * (1 - i * .02); y += Math.sin(th) * 1.42 * u * (1 - i * .02); sg[i][0] = x; sg[i][1] = y; sg[i][2] = th; }
    put(S.dFin, sg[N - 1][0], sg[N - 1][1], .15, .5, sg[N - 1][2], 1, 1, a);
    for (let i = N - 2; i >= 0; i--) { const s = 1.08 - i * .045; put(S.dDisc[i % 2], sg[i][0], sg[i][1], .5, .5, sg[i][2], s, s, a); }
    g.save(); g.globalAlpha = a; g.strokeStyle = "#E8B64A"; g.lineWidth = .22 * u; g.lineCap = "round"; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(hx + sd * 1.3 * u, hy + .5 * u); for (let k = 1; k <= 6; k++) g.lineTo(hx + sd * (1.3 + k * .55) * u + k * .45 * u, hy + .5 * u + k * .5 * u + Math.sin(A * 3 + k * .9 + sd) * .35 * u); g.stroke(); } g.restore(); // its whiskers
    put(S.dHead, hx, hy, .5, .5, Math.sin(A * 1.1 + b.ph) * .1, 1, 1, a);
  }
  /** a gust: paper leaves tumbling across the low part of the page, over and over, from one edge to the other */
  function dLeaves(T, I, b) {
    if (I <= .01) return; const { W, u } = S;
    for (const f of b.leaves) { const k = (T - f.t0) / f.d; if (k <= 0 || k >= 1) continue;
      const x = b.dir > 0 ? lerp(-3 * u, W + 3 * u, k) : lerp(W + 3 * u, -3 * u, k), y = f.y + Math.sin(k * TAU * f.loops + f.ph) * f.amp - Math.sin(k * Math.PI) * f.lift, flip = Math.cos(k * TAU * f.flips + f.ph2);
      put(S.leaf[f.c][flip < 0 ? 1 : 0], x, y, .5, .5, k * TAU * f.spin * b.dir + f.ph, 1, Math.max(.14, Math.abs(flip)), I * vel(x, y, 2 * u)); }
  }
  /** butterflies, fluttering up from below the page and away past the side */
  function dFlies(T, I, A, b) {
    if (I <= .01) return; const { u } = S;
    for (const f of b.flies) { const q = (T - f.t0) / f.d; if (q <= 0 || q >= 1) continue;
      const [p0, p1, p2, p3] = f.p, m = 1 - q, bx = (a, c) => m * m * m * p0[a] + 3 * m * m * q * p1[a] + 3 * m * q * q * p2[a] + q * q * q * p3[a] + c;
      const x = bx(0, Math.sin(A * 3.1 + f.ph) * 1.1 * u), y = bx(1, Math.sin(A * 5.3 + f.ph) * .9 * u), dx = 3 * (m * m * (p1[0] - p0[0]) + 2 * m * q * (p2[0] - p1[0]) + q * q * (p3[0] - p2[0]));
      put(S.fly[f.c], x, y, .5, .5, clamp(dx / 900, -.5, .5), (.2 + .8 * Math.abs(Math.sin(A * 8 + f.ph))) * f.s, f.s, I * vel(x, y, 2 * u)); }
  }

  /* ---------------- the night's beats ---------------- */
  /** the lit train along the bank and over the bridge, left to right (the first pass's) or mirrored; its reflection
   *  wobbling under it, all of it off the edges at both ends */
  function nTrain(T, I, A, b) {
    const { W, u } = S, tr = seg(T, b.t0, b.t1, x => x); if (!(tr > 0 && tr < 1 && I > .01)) return;
    const cars = b.cars, m = b.dir < 0, gap = S.carW + .6 * u, x0 = lerp(-(S.carW + 3 * u), W + (cars.length - 1) * gap + 2 * u, tr);
    cars.forEach((c, k) => { const x = x0 - k * gap, y = S.deckY - c.h2 + u, X = m ? W - x : x; put(c, X, y, 0, 0, 0, m ? -1 : 1, 1, I * (.45 + .55 * S.shade(m ? X - c.w2 / 2 : x + c.w2 / 2, y + c.h2 / 2, c.w2 / 2)));
      for (let s = 0; s < 2; s++) { const sh = c.h2 / 2, wob = Math.sin(A * 4 + s * 2.1 + k * .7) * .35 * u; g.save(); g.globalAlpha = .2 * I; g.translate(m ? X - wob : x + wob, S.riverY + .6 * u + s * sh * .6); g.scale(m ? -1 : 1, -.6); g.drawImage(c, 0, (1 - s) * sh * px, c.width, sh * px, 0, -sh, c.w2, sh); g.restore(); } });
    g.globalAlpha = .4 * I; g.drawImage(S.glow, (m ? W - (x0 + S.carW + u) : x0 + S.carW + u) - S.glow.width / 2, S.deckY - S.carH * .5 - S.glow.height / 2); g.globalAlpha = 1;
  }
  /** cut-paper fireworks in the colours of glass: a rocket's streak, a flash, shards thrown out in two rings that fall a
   *  little as they fade; or paper stars that tumble; or a willow, its shards drooping */
  function nFireworks(T, I, bursts) {
    const { H, u } = S;
    for (const b of bursts) {
      const k = (T - b.t) / 1.9; if (k <= 0 || k >= 1 || I < .01) continue;
      if (k < .18) { const q = k / .18, yh = b.y + H * .12 * (1 - E.out(q)); g.globalAlpha = I * seg(q, 0, .35, E.sine); g.strokeStyle = P.glass[b.c]; g.lineWidth = .5 * u; g.beginPath(); g.moveTo(b.x, yh + 3.5 * u); g.lineTo(b.x, yh); g.stroke(); g.globalAlpha = 1; continue; }
      const q = (k - .18) / .82, a = I * (q < .6 ? 1 : (1 - q) / .4);
      if (q < .25) { g.globalAlpha = (1 - q / .25) * .7 * I * (b.kind ? S.shade(b.x, b.y, 4 * u) : 1); g.drawImage(S.glow, b.x - S.glow.width / 2, b.y - S.glow.height / 2); g.globalAlpha = 1; }
      const R0 = b.R === undefined ? S.burstR : b.R;
      if (b.kind === "stars") { const n = Math.round(b.n * .7); for (let s = 0; s < n; s++) { const an = s / n * TAU + b.c * .7, v = .72 + (s * 7 % 5) * .08, rad = E.out(Math.min(1, q * 1.3)) * R0 * v, sx = b.x + Math.cos(an) * rad, sy = b.y + Math.sin(an) * rad + q * q * 6 * u; put(S.fanStars[(s + b.c) % S.fanStars.length], sx, sy, .5, .5, an + q * 5 * (s % 2 ? 1 : -1), .8, .8, a * S.shade(sx, sy, 2 * u)); } continue; }
      const droop = b.kind === "willow";
      for (const [ring, n, R, sp] of [[0, b.n, 1, 1], [1, Math.round(b.n * .6), .6, .8]]) {
        const rad = E.out(Math.min(1, q * 1.15 * sp)) * R * R0, fall = droop ? q * q * 11 * u : q * q * 3.2 * u;
        for (let s = 0; s < n; s++) { const an = (s + ring * .5) / n * TAU + b.c * .7, cx = b.x + Math.cos(an) * rad, cy = b.y + Math.sin(an) * rad + fall;
          g.globalAlpha = a * .35 * (b.kind ? S.shade(cx, cy, 2 * u) : 1); g.strokeStyle = P.glass[(s + b.c + ring) % P.glass.length]; g.lineWidth = .35 * u; g.beginPath(); g.moveTo(b.x + Math.cos(an) * rad * .45, b.y + Math.sin(an) * rad * .45 + fall * .45); g.lineTo(cx, cy); g.stroke(); g.globalAlpha = 1;
          put(S.shards[(s + b.c + ring) % S.shards.length], cx, cy, .75, .5, droop ? turnTo(an, Math.PI / 2, seg(q, .15, .9)) : an, 1, 1, b.kind ? a * S.shade(cx, cy, 2 * u) : a); } } /* (a dealt burst fades behind words) */
    }
  }
  /** the star on its wire: across the sky, its tail a fixed length behind it, off the edge with it */
  function nWire(T, I, b) {
    const { u } = S, ws = seg(T, b.t0, b.t1, E.sine); if (!(ws > 0 && ws < 1 && I > .01)) return;
    const x0 = b.x0, y0 = b.y0, x1 = b.x1, y1 = b.y1, wa = env(ws, 0, .12, .88, 1), dl = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / dl, uy = (y1 - y0) / dl, sx = lerp(x0, x1, ws), sy = lerp(y0, y1, ws);
    g.globalAlpha = .5 * wa * I; g.strokeStyle = P.thread; g.lineWidth = .7; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    for (let k = 1; k <= 6; k++) { const d = k * 2.2 * u; if (d > ws * dl) break; g.globalAlpha = (1 - k / 7) * .7 * I * S.shade(sx - ux * d, sy - uy * d, 3 * u); g.fillStyle = "#FFE9A8"; g.beginPath(); g.arc(sx - ux * d, sy - uy * d + Math.sin(k * 2.3) * .6 * u, .35 * u, 0, TAU); g.fill(); } /* its tail, a fixed length behind it: off the edge with it */
    g.globalAlpha = 1; put(S.wireStar, sx, sy, .5, .5, ws * 7 * b.spin, 1, 1, I * S.shade(sx, sy, 4 * u));
  }
  /** an owl across the moon, flapping, then gliding with its wings spread as it passes, its eyes on us */
  function nOwl(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, x = lerp(b.xs, b.xe, k), y = b.y + (x - b.mx) * b.slope + Math.sin(A * 2.1 + b.ph) * .35 * u, fl = Math.sin(A * 7.5 + b.ph), f = Math.abs(x - b.mx) < b.gl ? 1 : fl > .35 ? 0 : fl < -.35 ? 2 : 1;
    put(S.owl[f], x, y, .533, .55, b.slope * b.dir * .6, b.dir * b.s, b.s, I * vel(x, y, 3 * u));
  }
  /** a skein of geese in a V across the moon */
  function nGeese(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, lx = lerp(b.xs, b.xe, k), ly = b.y + (lx - b.mx) * b.slope + Math.sin(A * 1.7) * .3 * u;
    for (const q of b.flock) { const x = lx - b.dir * q.dx, y = ly + q.dy + Math.sin(A * 2.3 + q.ph) * .25 * u; put(S.goose[Math.sin(A * 6.5 + q.ph) > 0 ? 0 : 1], x, y, .44, .53, b.slope * b.dir * .6, b.dir * b.s, b.s, I * vel(x, y, 2 * u)); }
  }
  /** a needle comes down from past the top on its gold thread and sews a constellation star by star, each lighting as it
   *  is pierced; away past the top again; the thread glints a while, then is pulled out, and the stars go back to pinholes */
  function nStitch(T, I, A, b) {
    if (I <= .01 || T <= b.t0 || T >= b.t1) return;
    const { u } = S, { route, L, at } = b, total = L[L.length - 1], last = at.length - 1;
    let i = 0; while (i < last - 1 && T >= at[i + 1]) i++;
    const sHead = T >= at[last] ? total : lerp(L[i], L[i + 1], E.io(clamp((T - at[i]) / (at[i + 1] - at[i])))), sTail = total * E.io(seg(T, b.pull[0], b.pull[1], x => x));
    const pt = s => { let j = 0; while (j < L.length - 2 && L[j + 1] < s) j++; const f = clamp((s - L[j]) / ((L[j + 1] - L[j]) || 1)); return [lerp(route[j][0], route[j + 1][0], f), lerp(route[j][1], route[j + 1][1], f), j]; };
    if (sHead - sTail > .5) {
      const p0 = pt(sTail), p1 = pt(sHead); g.save(); g.lineCap = "round"; g.lineJoin = "round"; let n = 0;
      LP[n++] = p0[0]; LP[n++] = p0[1]; for (let j = p0[2] + 1; j <= p1[2]; j++) { LP[n++] = route[j][0]; LP[n++] = route[j][1]; } LP[n++] = p1[0]; LP[n++] = p1[1];
      fadedLine(LP, n / 2, 3 * u, [[1.2 * u, .2 * I, "#FFD98A"], [.27 * u, .95 * I, "#FFD98A"]]); /* its lead-in and lead-out run up past the bar: they fade by its words */
      if (T > b.sewn && T < b.pull[0] + .2) { const q = pt(sTail + (sHead - sTail) * ((A * .22) % 1)); g.globalAlpha = S.shade(q[0], q[1], 2 * u); g.fillStyle = "#FFF6DA"; g.beginPath(); g.arc(q[0], q[1], .3 * u, 0, TAU); g.fill(); g.globalAlpha = 1; } // a glint running along it
      g.restore();
    }
    for (const s of b.stars) { const on = seg(T, s.on - .05, s.on + .35, E.back), off = clamp((sTail - s.off + .5 * u) / (2.5 * u)), a = I * clamp(on) * (1 - off) * S.shade(s.p[0], s.p[1], 3 * u); if (a <= .01) continue; const sc = .55 + .45 * on;
      g.globalAlpha = a * .55; g.drawImage(S.glow, s.p[0] - S.glow.width * sc / 2, s.p[1] - S.glow.height * sc / 2, S.glow.width * sc, S.glow.height * sc); g.globalAlpha = 1; put(S.cStar, s.p[0], s.p[1], .5, .5, s.rot, sc, sc, a); }
    if (sHead < total) { const p = pt(sHead), j = p[2]; put(S.needle, p[0], p[1], .983, .5, Math.atan2(route[j + 1][1] - route[j][1], route[j + 1][0] - route[j][0]), 1, 1, I * S.shade(p[0], p[1], 3 * u)); }
  }
  /** curtains of tissue paper, the northern lights, let down on their threads from past the top: each brightest along
   *  its hem, which waves slowly, its folds drifting along it; taken up again the way they came */
  function nAurora(T, I, A, b) {
    const k = env(T, b.t0, b.t0 + 2.8, b.t1 - 2.6, b.t1, E.io) * I; if (k <= .003) return;
    const { u } = S, down = E.out(k);
    for (const rb of b.rib) {
      const lift = (1 - down) * (rb.y + rb.h + rb.a * 2 + 4 * u), n = 44, top = rb.y - lift - rb.h * .6, span = rb.x1 - rb.x0;
      const hem = x => lerp(top, rb.y + rb.h - lift + Math.sin(x * rb.f + A * rb.v + rb.ph) * rb.a + Math.sin(x * rb.f * 2.7 - A * rb.v * .8 + rb.ph2) * rb.a * .3, Math.pow(Math.sin(Math.PI * clamp((x - rb.x0) / span)), .45)); /* its ends drawn up to where it hangs from */
      const gr = g.createLinearGradient(0, top, 0, rb.y + rb.h - lift + rb.a); gr.addColorStop(0, `rgba(${rb.col},0)`); gr.addColorStop(.55, `rgba(${rb.col},.16)`); gr.addColorStop(.9, `rgba(${rb.col},.62)`); gr.addColorStop(1, `rgba(${rb.col},.8)`);
      g.beginPath(); g.moveTo(rb.x0, top); g.lineTo(rb.x1, top); for (let i = n; i >= 0; i--) { const x = rb.x0 + span * i / n; g.lineTo(x, hem(x)); } g.closePath();
      g.globalAlpha = k * rb.alpha; g.fillStyle = gr; g.fill();
      g.globalAlpha = k * rb.alpha * .7; for (let j = 0; j < 14; j++) { const x = rb.x0 + (((j / 14 + A * rb.drift) % 1 + 1) % 1) * span, w = (1 + (j * 7 % 3) * .6) * u, hy = Math.min(hem(x), hem(x + w)); if (hy > top) g.fillRect(x, top, w, hy - top); } // its folds, lighter, drifting along it (cut to the hem)
      g.globalAlpha = k * rb.alpha; g.strokeStyle = `rgba(${rb.col},.95)`; g.lineWidth = .14 * u; g.beginPath(); for (let i = 0; i <= n; i++) { const x = rb.x0 + span * i / n; i ? g.lineTo(x, hem(x)) : g.moveTo(x, hem(x)); } g.stroke(); // the cut edge of its hem
      g.globalAlpha = k * .4; g.strokeStyle = P.thread; g.lineWidth = .7; g.beginPath(); for (const f of [.12, .88]) { const x = rb.x0 + span * f; g.moveTo(x, 0); g.lineTo(x, Math.max(0, top + rb.h * .5)); } g.stroke(); // the threads it hangs from
    }
    // it hangs behind the bar: under each of the words it is cut away, softly (the frame is empty under it, so only it goes)
    g.globalCompositeOperation = "destination-out"; g.globalAlpha = 1;
    for (const [x0, y0, x1, y1] of S.wr || []) { const mx = 16 + (y1 - y0) * .5, my = 8 + (y1 - y0) * .4; g.drawImage(S.cut, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  }
  /** a comet on a wire across the sky: a gold paper star, streamers of glass colours, sparks falling from it */
  function nComet(T, I, A, b) {
    const ws = seg(T, b.t0, b.t1, E.sine); if (ws <= 0 || ws >= 1 || I <= .01) return;
    const { u } = S, wa = env(ws, 0, .1, .9, 1), sx = lerp(b.x0, b.x1, ws), sy = lerp(b.y0, b.y1, ws), dl = Math.hypot(b.x1 - b.x0, b.y1 - b.y0), ux = (b.x1 - b.x0) / dl, uy = (b.y1 - b.y0) / dl, sh = S.shade(sx, sy, 6 * u);
    LP[0] = b.x0; LP[1] = b.y0; LP[2] = b.x1; LP[3] = b.y1; fadedLine(LP, 2, 2 * u, [[.7, .45 * wa * I, P.thread]]);
    const sh2 = Math.min(sh, S.shade(sx - ux * 30 * u, sy - uy * 30 * u, 4 * u)); /* the streamers' far ends too */
    g.lineCap = "round"; g.lineJoin = "round"; for (let s = 0; s < 5; s++) { g.beginPath(); for (let k = 0; k <= 16; k++) { const d = 1.2 * u + k * 1.5 * u * (1 + s * .1), w = Math.sin(A * 4.5 - k * .5 + s * 1.3) * (.15 + k * .07) * u + (s - 2) * .42 * u * (k / 16), x = sx - ux * d - uy * w, y = sy - uy * d + ux * w; k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.globalAlpha = .85 * I * sh2; g.strokeStyle = P.glass[s]; g.lineWidth = (.95 - s * .1) * u; g.stroke(); g.globalAlpha = .35 * I * sh2; g.strokeStyle = "#FFFFFF"; g.lineWidth = .12 * u; g.stroke(); } g.lineCap = "butt"; g.lineJoin = "miter"; /* streamers of glass-coloured paper, each with its light edge */
    for (let k = 0; k < 7; k++) { const d = ((A * 3 + k * .37) % 1) * 18 * u + 2 * u; g.globalAlpha = I * sh * (1 - d / (20 * u)) * .9; g.fillStyle = k % 2 ? "#FFF4D6" : P.glass[k % 5]; g.beginPath(); g.arc(sx - ux * d + Math.sin(k * 7.1) * 1.2 * u, sy - uy * d + d * d * .004 / u + Math.cos(k * 5.3) * 1.2 * u, .22 * u, 0, TAU); g.fill(); }
    g.globalAlpha = .7 * I * sh; g.drawImage(S.cometGlow, sx - S.cometGlow.width / 2, sy - S.cometGlow.height / 2); g.globalAlpha = 1;
    put(S.cometHead, sx, sy, .5, .5, A * .8, 1, 1, I * sh);
  }
  /** paper fireflies over the bank and the river, drifting in slow loops, each blinking in its own time */
  function nFireflies(T, I, A, b) {
    const k = env(T, b.t0, b.t0 + 1.4, b.t1 - 1.6, b.t1, E.sine) * I; if (k <= .01) return;
    const { u } = S, gw = S.ffGlow.w2;
    for (const f of b.flies) { const x = f.x + Math.sin(A * f.f1 + f.p1) * f.ax, y = f.y + Math.sin(A * f.f2 + f.p2) * f.ay, bl = Math.pow(Math.max(0, Math.sin(A * f.fb + f.pb)), 2), a = k * (.12 + .88 * bl) * S.shade(x, y, 2 * u); if (a < .02) continue;
      g.globalAlpha = a; g.drawImage(S.ffGlow, x - gw / 2, y - gw / 2, gw, gw); }
    g.globalAlpha = 1;
  }
  /** paper snow: flakes come down from past the top, turning and swaying, and melt where they land */
  function nSnow(T, I, A, b) {
    if (I <= .01) return; const { u } = S;
    for (const f of b.flakes) { const k = (T - f.t0) / f.d; if (k <= 0 || k >= 1) continue; const y = lerp(-3 * u, f.y1, k), x = f.x + Math.sin(A * f.sw + f.ph) * f.a + k * f.drift;
      put(S.flakes[f.s], x, y, .5, .5, A * f.rot + f.ph, f.sc, f.sc, I * (1 - seg(k, .86, 1)) * S.shade(x, y, 2 * u)); } /* it falls from past the top: faded by the bar's words and the lines */
  }

  /* ---------------- the passes: what each one deals ---------------- */
  /** a train's plan: its parts, its way, its times; on from past one edge, all the way off the other */
  function trainPlan(parts, dir, t0, t1) {
    const { W, u } = S, gap = S.tW + .8 * u, n = parts.length, total = (n > 1 ? 1.8 * u + S.tW + .8 * u + (n - 2) * gap : 0) + parts[n - 1].w2;
    return { k: "train", t0, t1, dir, parts, xs: dir > 0 ? -u : W + 2 * u, xe: dir > 0 ? W + total + u : -total };
  }
  function cyclistPlan(r, t0) {
    const { W, u, pr } = S, dir = r() < .5 ? 1 : -1, s = pr ? 1.25 : 1, front = (night ? 12.2 : 4.7) * u * s, back = 3.4 * u * s; /* the front wheel, the basket, and by night the lamp's beam, ahead of it */
    return { k: "cyclist", t0, t1: t0 + 6.4 + r() * .8, dir, s, ph: r() * TAU, xs: dir > 0 ? -front : W + front, xe: dir > 0 ? W + back : -back };
  }
  function balloonPlan(r, t0, t1) {
    /* on a phone it climbs past the list (under vellum there) to the open sky over it, and sails off the side away from the sun or the moon */
    const { W, H, u, pr } = S, R = S.bR, ci = Math.floor(r() * (night ? 2 : 4)), x0 = pr ? W * (.34 + r() * .26) : W * (.64 + r() * .15), coin = r(), dir = pr ? -1 : coin < .8 ? 1 : -1;
    let ridge = 0; for (let x = x0 - R; x <= x0 + R; x += 3) ridge = Math.max(ridge, S.frontY(x));
    const f0 = t0 + .5 + r() * .8, f1 = t0 + 3.2 + r() * 1.6;
    return { k: "balloon", t0, t1, x0, dir, ph: r() * TAU, yHide: ridge + R * 1.08 + u, yCruise: pr ? H * (.21 + r() * .05) : H * (.3 + r() * .1), lift: pr ? H * .03 : H * (.06 + r() * .06), dist: (dir > 0 ? S.W - x0 : x0) + R * (night ? 3.2 : 1.3) + 3 * u, flares: [f0, f1], spr: balloonOf(ci, false), lit: night ? balloonOf(ci, true) : null };
  }
  function dealDay(pass) {
    const { W, H, u, pr } = S;
    if (pass <= 0) { const gap = S.tW + .8 * u; return { pass, gen, b: [.2, .9, 1.7, 3.0], bk: 1, n: [11, 12.7, 1], gust: null, // the first pass: the loop, beat for beat
      cross: { k: "plane", planes: [{ t0: 2.0, t1: 5.6, path: S.planePath, spr: S.plane, trail: P.trail, sy: 1 }] },
      deck: { k: "train", t0: 4.4, t1: 9.4, dir: -1, parts: [S.dengine, S.dcar, S.dcar, S.dcar], xs: W + 2 * u, xe: -(3 * gap + S.tW + 3 * u) },
      head: { k: "kite", t: [8.0, 10.3, 12.9, 14.7] },
      close: { k: "birds", t0: 10.3, t1: 14.0, dir: -1, y: H * (S.pr ? .1 : .08), flock: S.flock, end: -26 * u } }; }
    const r = K.deal(pass, 7200), rare = K.bag(pass, 8, 7201), pick = (list, salt) => list[K.bag(pass, list.length, salt)], pl = { pass, gen, gust: null };
    { const late = r() < .45, b0 = late ? 4.2 + r() * 1.6 : 0; pl.b = [b0 + .2, b0 + .9, b0 + 1.7, b0 + 3.0]; pl.bk = .75 + r() * .5; } // the breeze, at the start or later
    { const n0 = 10.2 + r() * 2.2; pl.n = [n0, n0 + 1.7, r() < .5 ? 1 : -1]; } // the sun's notch, either way
    // across the sky, to open
    const ck = rare === 2 ? "zeppelin" : pick(["plane", "planes", "biplane"], 7202);
    if (ck === "zeppelin") { const turn = r(), dir = pr ? 1 : -1, half = 12.5 * u; /* it ends the pass on the side the showpiece doesn't: left on a wide screen, right on a phone */ pl.cross = { k: ck, t0: .8, t1: 14.2, dir, y: pr ? H * .2 : H * (.14 + r() * .04), ph: r() * TAU, xs: dir < 0 ? W + half : -half, xe: dir < 0 ? -half : W + half }; }
    else if (ck === "biplane") { const dir = r() < .5 ? 1 : -1, t0 = 1.2 + r() * .8; pl.cross = { k: ck, t0, t1: t0 + 6.4, dir, y: pr ? H * (.15 + r() * .08) : H * (.11 + r() * .07), ph: r() * TAU, xs: dir > 0 ? -4 * u : W + 4 * u, xe: dir > 0 ? W + 26 * u : -26 * u }; }
    else { const two = ck === "planes", dir = r() < .5 ? 1 : -1, cx = pr ? W * (.3 + r() * .3) : W * (.46 + r() * .16), cy = pr ? H * (.19 + r() * .04) : H * (.15 + r() * .04), R = (pr ? W * .085 : H * .068) * (.85 + r() * .25), /* its loops under the bar, between the date and the pills, as the first pass's are */ path = planePath(dir, cx, cy, R, two ? 2 : 1), t0 = 1.5 + r() * .8, t1 = t0 + (two ? 4.8 : 3.6);
      const c1 = Math.floor(r() * S.planes.length), c2 = (c1 + 1 + Math.floor(r() * (S.planes.length - 1))) % S.planes.length, sy = dir < 0 ? -1 : 1;
      pl.cross = { k: ck, planes: [{ t0, t1, path, spr: S.planes[c1][0], trail: S.planes[c1][1], sy, fade: true }] }; if (two) pl.cross.planes.push({ t0: t0 + .55, t1: t1 + .55, path, spr: S.planes[c2][0], trail: S.planes[c2][1], sy, fade: true }); }
    // along the viaduct
    const dk = pick(["train", "express", "goods", "cyclist"], 7203);
    if (dk === "cyclist") pl.deck = cyclistPlan(r, 3.8 + r() * .8);
    else if (dk === "train") { const n = 3 + (r() < .3 ? 1 : 0), t0 = 4.0 + r() * .8; pl.deck = trainPlan([S.dengine, ...Array(n).fill(S.dcar)], r() < .5 ? 1 : -1, t0, t0 + 4.8 + n * .15); }
    else if (dk === "express") { const t0 = 4.0 + r() * .6; pl.deck = trainPlan([S.xengine, S.xcar, S.xcar, S.xcar], r() < .5 ? 1 : -1, t0, t0 + 4.0); }
    else { const w = S.wagons.slice(), sh = []; while (w.length) sh.push(w.splice(Math.floor(r() * w.length), 1)[0]); const n = 2 + Math.floor(r() * 2), t0 = 3.8 + r() * .6; pl.deck = trainPlan([S.gengine, ...sh.slice(0, n), S.caboose], r() < .5 ? 1 : -1, t0, t0 + 5.8); }
    // the showpiece in the open sky
    const hk = rare === 1 ? "rainbow" : pick(["kite", "dragon", "balloon"], 7204);
    if (hk === "kite") { const t0 = 7.4 + r(); pl.head = { k: hk, t: [t0, t0 + 2.3, Math.min(t0 + 4.9, 12.9), 14.7] }; }
    else if (hk === "dragon") pl.head = { k: hk, kt: [7.6, 9.9, 12.5, 14.7], t0: 6.8 + r() * .8, t1: 14.6, dx: (r() - .5) * 3 * u, e0: (r() - .5) * 10 * u, e1: (r() - .2) * 12 * u, sa: -(8 + r() * 6) * u, ph: r() * TAU };
    else if (hk === "balloon") pl.head = balloonPlan(r, 4.4 + r() * .8, 14.5);
    else { const cx = pr ? W * .5 : W * (.76 + r() * .04), cy = S.frontY(cx) + .5 * u, rx = pr ? W * .46 : W * .19, ry = pr ? H * .2 : H * .38, bw = (pr ? 1.5 : 1.3) * u, leg = 5 * u;
      pl.head = { k: hk, kt: [7.6, 9.9, 12.5, 14.7], t0: 5.8 + r() * .6, t1: 14.4, dir: r() < .5 ? 1 : -1, cx, cy, rx, ry, bw, leg, spr: rainbowSpr(cx, cy, rx, ry, bw, leg) }; }
    // to close
    let lk = pick(["birds", "leaves", "flies"], 7205); if (ck === "zeppelin" && lk === "birds") lk = r() < .5 ? "leaves" : "flies";
    if (lk === "birds") { const n = 5 + Math.floor(r() * 5), t0 = 9.8 + r(), flock = []; for (let i = 0; i < n; i++) flock.push({ dx: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 3.2 * u, dy: Math.ceil(i / 2) * 2.2 * u, ph: r() * TAU });
      pl.close = { k: lk, t0, t1: t0 + 3.3 + r() * .7, dir: r() < .5 ? 1 : -1, y: H * (pr ? .1 + r() * .05 : .08 + r() * .04), fade: true, flock, end: -(Math.max(...flock.map(f => f.dx < 0 ? -2.1 * f.dx : 0)) + 3.5 * u) }; } /* the last of the V off the far edge */
    else if (lk === "leaves") { const t0 = 9.2 + r() * .5, leaves = []; for (let i = 0; i < (pr ? 11 : 16); i++) leaves.push({ t0: t0 + i * .065 + r() * .4, d: 2.4 + r(), y: H * (pr ? .6 + r() * .3 : .56 + r() * .34), amp: (1 + r() * 2.5) * u, lift: r() * 6 * u, loops: .8 + r() * 1.4, ph: r() * TAU, ph2: r() * TAU, flips: 1 + r() * 2.5, spin: (r() < .5 ? -1 : 1) * (.5 + r() * 1.5), c: Math.floor(r() * 4) });
      pl.close = { k: lk, dir: r() < .5 ? 1 : -1, leaves }; pl.gust = [t0 - .5, t0 + .4, t0 + 2.6, t0 + 4.2, 1.9]; }
    else { const flies = [], t0 = 8.8 + r() * .5; for (let i = 0; i < (pr ? 2 : 3); i++) { const side = pr ? (r() < .5 ? 1 : -1) : 1, x0 = pr ? W * (.2 + r() * .6) : W * (.6 + r() * .32), p3 = [side > 0 ? W + 4 * u : -4 * u, H * (pr ? .52 + r() * .12 : .42 + r() * .2)];
        flies.push({ t0: t0 + i * .45, d: 3.6 + r() * .7, p: [[x0, H + 3 * u], [x0 + (r() - .5) * W * .2, H * (.72 + r() * .1)], [lerp(x0, p3[0], .6) + (r() - .5) * W * .1, H * (.55 + r() * .15)], p3], c: Math.floor(r() * 3), ph: r() * TAU, s: pr ? 1.2 : 1 }); }
      pl.close = { k: "flies", flies }; }
    return pl;
  }
  /* constellations: their stars in a unit box, and the order the needle sews them in */
  const SKY = [
    { p: [[0, .32], [.2, .26], [.37, .34], [.53, .44], [.58, .76], [.87, .84], [.95, .5]], o: [0, 1, 2, 3, 4, 5, 6, 3] }, // the Plough
    { p: [[0, .2], [.25, .8], [.5, .38], [.75, .88], [1, .26]], o: [0, 1, 2, 3, 4] }, // Cassiopeia
    { p: [[.5, 0], [.14, .38], [.3, .92], [.72, .92], [.86, .38]], o: [0, 1, 2, 3, 4, 0] }, // the kite of Boötes
  ];
  function dealNight(pass) {
    const { W, H, u, pr } = S;
    if (pass <= 0) return { pass, gen, b: [.2, .9, 1.7, 3.0], bk: 1, gust: null, won: S.windows.map(w => w.o), woff: S.windows.map(w => 1 - w.o), // the first pass: the loop, beat for beat
      low: { k: "train", t0: 2.2, t1: 6.7, dir: 1, cars: [S.engine, S.car, S.car, S.car] },
      moon: { k: "cloud", d: [5.1, 6.1, 7.8, 8.8], s: [5.8, 8.0], from: -2.6, to: 2.6, drop: .15, v: [6.1, 6.6, 7.2, 7.7] },
      show: { k: "fireworks", bursts: S.bursts },
      close: { k: "wire", t0: 10.8, t1: 13.4, x0: -5 * u, y0: H * (S.pr ? .12 : .12), x1: W + 20 * u, y1: H * (S.pr ? .33 : .3), spin: 1 } };
    const r = K.deal(pass, 7300), rare = K.bag(pass, 8, 7301), pick = (list, salt) => list[K.bag(pass, list.length, salt)], pl = { pass, gen, gust: null };
    { const late = r() < .4, b0 = late ? 4.4 + r() * 1.4 : 0; pl.b = [b0 + .2, b0 + .9, b0 + 1.7, b0 + 3.0]; pl.bk = .75 + r() * .5; }
    // the windows: across (as the first pass), back, from the middle out, or here and there; out again in the reverse order or the same
    { const pat = K.bag(pass, 4, 7302), rev = r() < .6, key = S.windows.map(w => pat === 0 ? w.o : pat === 1 ? 1 - w.o : pat === 2 ? Math.abs(w.o - .5) * 2 : r()); pl.won = key; pl.woff = key.map(k => rev ? 1 - k : k); }
    const sk = rare === 1 ? "aurora" : rare === 2 ? "comet" : pick(["fireworks", "balloon", "stitch"], 7303), lk = pick(["train", "trainW", "cyclist"], 7304);
    let mk = pick(["cloud", "owl", "geese"], 7305), ck = pick(["wire", "fireflies", "snow"], 7306);
    if (sk === "aurora") mk = null; // the northern lights have the sky to themselves
    const early = sk === "stitch" || sk === "balloon" || sk === "comet" ? -3.2 : 0; // the moon's beat comes earlier, before the showpiece takes the sky
    if ((sk === "stitch" || sk === "comet" || sk === "aurora") && ck === "wire") ck = r() < .5 ? "fireflies" : "snow";
    // low: the train either way, or a cyclist
    if (lk === "cyclist") pl.low = cyclistPlan(r, 2.0 + r() * .8);
    else { const n = 2 + Math.floor(r() * 4), t0 = 2.0 + r() * 1.2; pl.low = { k: "train", t0, t1: t0 + 4.2 + n * .2, dir: lk === "train" ? 1 : -1, cars: [S.engine, ...Array(n).fill(S.car)] }; }
    // the moon: the cloud from either side, an owl, geese
    if (mk === "cloud") { const s = r() < .5 ? 1 : -1, t = (r() - .5) * 1.2 + early; pl.moon = { k: mk, d: [5.1 + t, 6.1 + t, 7.8 + t, 8.8 + t], s: [5.8 + t, 8.0 + t], from: -2.6 * s, to: 2.6 * s, drop: -.2 + r() * .5, v: [6.1 + t, 6.6 + t, 7.2 + t, 7.7 + t] }; }
    else if (mk === "owl") { const dir = r() < .5 ? 1 : -1, t0 = 4.4 + r() * .8 + early; pl.moon = { k: mk, t0, t1: t0 + (pr ? 4.4 : 5.2), dir, s: pr ? 1.2 : 1.35, xs: dir > 0 ? -11 * u : W + 11 * u, xe: dir > 0 ? W + 11 * u : -11 * u, mx: S.orb.x, y: S.orb.y + (r() - .5) * S.orb.r * .8, slope: (r() - .5) * .14, gl: S.orb.r * 1.7, ph: r() * TAU }; }
    else if (mk === "geese") { const dir = r() < .5 ? 1 : -1, n = 5 + Math.floor(r() * 4), flock = []; for (let i = 0; i < n; i++) flock.push({ dx: Math.ceil(i / 2) * 2.6 * u, dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.5 * u, ph: r() * TAU });
      const gs = pr ? 1.1 : 1.2; for (const q of flock) { q.dx *= gs; q.dy *= gs; } const back = (Math.ceil((n - 1) / 2) * 2.6 * u + 4 * u) * gs, t0 = 4.2 + r() * .8 + early; pl.moon = { k: mk, t0, t1: t0 + (pr ? 4.6 : 5.6), dir, s: gs, flock, xs: dir > 0 ? -4 * u * gs : W + 4 * u * gs, xe: dir > 0 ? W + back : -back, mx: S.orb.x, y: S.orb.y + (r() - .5) * S.orb.r, slope: (r() - .5) * .12 }; }
    else pl.moon = null;
    // the showpiece: fireworks, a lit balloon, a constellation sewn; rare, the northern lights or a comet
    if (sk === "fireworks") { const n = 3 + (r() < .5 ? 1 : 0), spots = [], open = (pr ? [[.27, .18], [.67, .16], [.46, .215], [.8, .2], [.2, .17], [.55, .16], [.36, .26]] : [[.82, .27], [.62, .19], [.93, .45], [.72, .2], [.88, .19], [.77, .38], [.96, .28]]).map(([a, c]) => [a, c, r()]).sort((p, q) => p[2] - q[2]); /* the open sky the first pass's go off in, and more like it, in an order of the pass's own */
      for (const [a, c] of open) { if (spots.length >= n) break; const x = W * (a + (r() - .5) * .04), y = H * (c + (r() - .5) * .03); if (Math.hypot(x - S.orb.x, y - S.orb.y) < S.orb.r * 2.6 || spots.some(([a2, c2]) => Math.hypot(a2 - x, c2 - y) < S.burstR * 1.5)) continue; spots.push([x, y]); }
      const kind = ["shards", "stars", "willow"][Math.floor(r() * 3)], t0 = 7.8 + r() * .6; let t = t0; pl.show = { k: sk, bursts: spots.map(([x, y]) => { const b = { t, x, y, n: 14 + Math.floor(r() * 6), c: Math.floor(r() * 5), R: S.burstR * (.8 + r() * .35), kind: r() < .6 ? kind : "shards" }; t += .6 + r() * .3; return b; }) }; }
    else if (sk === "balloon") pl.show = balloonPlan(r, 3.6 + r() * .8, 13.2);
    else if (sk === "stitch") { const c = SKY[K.bag(pass, 3, 7310)], box = pr ? [W * .1, H * .08, W * .52, H * .15] : [W * .58, H * .09, W * .22, H * .22], flip = r() < .5, pts = c.p.map(([x, y]) => [box[0] + (flip ? 1 - x : x) * box[2], box[1] + y * box[3]]), stars = c.o.map(i => pts[i]);
      const route = [[stars[0][0] + 3 * u, -8 * u], ...stars, [stars[stars.length - 1][0] - 3 * u, -8 * u]], L = [0]; for (let i = 1; i < route.length; i++) L.push(L[i - 1] + Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]));
      const t0 = 6.4 + r() * .6, sew = 3.8, w = route.slice(1).map((p, i) => Math.sqrt(L[i + 1] - L[i])), ws = w.reduce((a, v) => a + v, 0), at = [t0]; for (let i = 0; i < w.length; i++) at.push(at[i] + sew * w[i] / ws);
      pl.show = { k: sk, t0, t1: 13.8, sewn: t0 + sew, pull: [12.0, 13.6], route, L, at, stars: pts.map(p => { let a = -1, z = -1; route.forEach((q, i) => { if (q === p) { if (a < 0) a = i; z = i; } }); return { p, on: at[a], off: L[z], rot: r() * TAU }; }) }; }
    else if (sk === "aurora") { const cols = [["150,255,205", "120,205,255", "205,165,255"], ["120,205,255", "150,255,205", "255,170,215"]][r() < .5 ? 0 : 1], rib = [];
      for (let i = 0; i < 3; i++) rib.push({ x0: pr ? -W * .05 : W * (.3 + i * .06), x1: W * 1.05, y: H * (pr ? .065 + i * .03 : .03 + i * .035), /* on a phone, below the pills */ h: H * (pr ? .06 + r() * .03 : .08 + r() * .04), a: (1.2 + r() * 1.6) * u, f: (pr ? .012 : .005) + r() * .004, v: .35 + r() * .3, ph: r() * TAU, ph2: r() * TAU, drift: (r() < .5 ? -1 : 1) * (.012 + r() * .01), col: cols[i], alpha: .9 - i * .15 });
      pl.show = { k: sk, t0: 4.4 + r() * .6, t1: 14.3, rib }; }
    else { const dir = r() < .5 ? 1 : -1; pl.show = { k: sk, t0: 7.2 + r() * .6, t1: 12.8 + r() * .6, x0: dir > 0 ? -6 * u : W + 6 * u, y0: H * (.13 + r() * .05), x1: dir > 0 ? W + 38 * u : -38 * u, /* its streamers trail up behind it: clear of the bar */ y1: H * (pr ? .26 + r() * .06 : .3 + r() * .1) }; }
    // to close: the star on its wire, fireflies, snow
    if (ck === "wire") { const dir = r() < .5 ? 1 : -1, t0 = 10.4 + r() * .8; pl.close = { k: ck, t0, t1: t0 + 2.6, x0: dir > 0 ? -5 * u : W + 5 * u, y0: H * (.1 + r() * .05), x1: dir > 0 ? W + 20 * u : -20 * u, y1: H * (pr ? .28 + r() * .08 : .26 + r() * .08), spin: dir }; }
    else if (ck === "fireflies") { const flies = []; for (let i = 0; i < (pr ? 16 : 24); i++) flies.push({ x: pr ? W * r() : W * (.42 + r() * .58), y: H * (pr ? .66 + r() * .28 : .7 + r() * .26), ax: (1.5 + r() * 4) * u, ay: (1 + r() * 2.5) * u, f1: .3 + r() * .5, f2: .4 + r() * .6, p1: r() * TAU, p2: r() * TAU, fb: .9 + r() * .9, pb: r() * TAU }); pl.close = { k: ck, t0: 8.8 + r() * .8, t1: 14.6, flies }; }
    else { const flakes = [], base = sk === "fireworks" || sk === "comet" ? 9.6 : 8.6; for (let i = 0; i < (pr ? 12 : 18); i++) { const t0 = base + r() * (base > 9 ? 1.6 : 2); flakes.push({ x: W * r(), t0, d: Math.min(4.2 + r() * 1.6, 14.6 - t0), y1: H * (pr ? .66 + r() * .28 : .68 + r() * .28), a: (1 + r() * 2) * u, sw: .8 + r() * .8, ph: r() * TAU, rot: (r() - .5) * 1.4, s: Math.floor(r() * 3), sc: .7 + r() * .5, drift: (r() - .5) * 4 * u }); } pl.close = { k: ck, flakes }; }
    return pl;
  }
  /* ---------------- 1.12 b415: the egg ---------------- */
  /** when each thing happens: the summer's sky drawn up, the page turned over; the winter's sky let down, its snow, the
   *  snowman's bow, its sky drawn up; the page turned back, the summer's sky let down, all as it was by `end`. Each piece of
   *  the town goes flat just before the turning leaf reaches it and springs up just after it has gone (eggTimes) */
  const EGG = { up0: .55, turn0: [1.75, 3.9], down1: 3.95, snow: [4.0, 9.9], tip: 6.7, up1: 9.75, turn1: [10.55, 12.7], down0: 12.75, end: 14.5 };
  const MIDT = (EGG.turn0[1] + EGG.turn1[0]) / 2, PHI = .21, TILT = .16;
  let EG = null, EGbuf = null, EGw = 1, EGbg = "A"; // EGbg: which page the backdrop holds while the egg plays
  /** how tall a piece looks leaning back by `th` (0 upright … π/2 lying on the page), seen from a little above the page:
   *  it grows a hair as it starts to go, and lying flat shows a fifth of itself */
  const lean = th => Math.cos(th - PHI) / Math.cos(PHI);
  /** a piece folding back flat, falling faster as it goes; and springing up again, swinging a little past upright */
  const foldS = (T, t0, d = .55) => T <= t0 ? 1 : lean(Math.PI / 2 * (T >= t0 + d ? 1 : E.in((T - t0) / d)));
  const popS = (T, t0, d = .62) => T >= t0 + d ? 1 : lean(Math.PI / 2 * (1 - (T <= t0 ? 0 : K.spring((T - t0) / d, 2.5, 5))));
  /** a piece on the summer's page ([fold, pop]: up, flat through the turns, up again), or on the winter's ([pop, fold]) */
  const stA = (T, t) => T < MIDT ? foldS(T, t[0]) : popS(T, t[1]);
  const stB = (T, t) => T < MIDT ? popS(T, t[0]) : foldS(T, t[1]);
  /** how far a hung thing is drawn up (0 where it hangs, 1 out of sight): the summer's go up and come down again with a bob
   *  on their threads, the winter's come down and go up */
  const bob = t => K.spring(t, 2.5, 6.5);
  const upA = (T, i) => T < MIDT ? seg(T, EGG.up0 + i * .12, EGG.up0 + i * .12 + .8, E.in) : 1 - seg(T, EGG.down0 + i * .12, EGG.down0 + i * .12 + 1, bob);
  const upB = (T, i) => T < MIDT ? 1 - seg(T, EGG.down1 + i * .12, EGG.down1 + i * .12 + 1, bob) : seg(T, EGG.up1 + i * .1, EGG.up1 + i * .1 + .7, E.in);
  /** the hills, the river and its viaduct in the order the backdrop lays them: printed on the page, as a pop-up book's
   *  landscape is; what stands on them (the houses, the trees, the windmill) is cut out and folds */
  const BANDS = ["back", "town", "river", "front", "near"];
  /** the leaf at its fraction v of a turn: its fold (along the fold's normal from the middle of the screen) and its roll */
  function leafGeo(v) {
    const { W, H } = S, nl = Math.hypot(1, TILT), D = (W / 2 + TILT * H / 2) / nl, RC = .06 * (W + H) / 2;
    return { f: lerp(D + 2, -D - RC * 1.6 - 6, E.io(v)), rc: RC * Math.min(1, v / .1) };
  }
  /** the fractions of the turn at which the leaf passes a point: `a`, page A there is covered (by the leaf lying back over
   *  it, or lifted with it); `b`, page B there is uncovered (the roll has gone past) */
  function leafAt(x0, y0) {
    const { W, H } = S, nl = Math.hypot(1, TILT), nx = 1 / nl, ny = TILT / nl, P = (x0 - W / 2) * nx + (y0 - H / 2) * ny, far = P + Math.max(0, Math.min((W - x0) / nx, (H - y0) / ny));
    let a = 1, b = 1;
    for (let i = 0; i <= 240 && (a === 1 || b === 1); i++) { const v = i / 240, { f, rc } = leafGeo(v); if (a === 1 && 2 * f + Math.PI * rc - far <= P) a = v; if (b === 1 && f + rc < P - 2) b = v; }
    return [a, b];
  }
  /** when a piece goes on each page — A [fold, pop]: flat just before the leaf covers it (timed by its corner the leaf
   *  reaches first), up as soon as the leaf has uncovered it coming back; B [pop, fold]: up just after the leaf has gone
   *  over it (timed by its middle), flat before it comes back */
  function eggTimes(xa, ya, xb, yb, late = 0) {
    const a = leafAt(xa, ya)[0], b = leafAt(xb, yb)[1], d0 = EGG.turn0[1] - EGG.turn0[0], d1 = EGG.turn1[1] - EGG.turn1[0], fw = v => EGG.turn0[0] + v * d0, bk = v => EGG.turn1[0] + (1 - v) * d1;
    return { A: [fw(a) - .72, bk(a) + .08 + late], B: [fw(b) + .08 + late, bk(b) - .72] };
  }
  const WINTER = night ? {
    skyTop: "#050B1C", skyLow: "#15213F", back: "#2E3E68", mid: "#405487", front: "#5468A0", near: "#667BB4", rim: "rgba(214,228,255,.8)", pine: "#1F2C54", pineTip: "#B8C7EA",
    wall: "#3B4B79", wallLo: "#2F3D66", roof: ["#1F2B4E", "#26335A", "#1C2746"], snow: "#CCD8F3", snowLo: "#8E9FCB", win: "#FFD98A", door: "#1A2340", chim: "#1B2645",
    ice: "#2D3C69", iceHi: "#8197CC", bridge: "#3A4A78", deck: "#CCD8F3", tree: ["#16213F", "#1B2848", "#131C36"], trunk: "#10162A", mill: "#33416B", millLo: "#29365C", sail: "#3B4A78",
    cloud: "#2F3C61", cloudLo: "#242F51", cloudHi: "#93A7DA", shadow: "rgba(0,0,0,.45)", leaf: "#1D2848", body: "#DCE5F7", bodyLo: "#93A4CF", coal: "#121828", scarf: "#E0563F", scarf2: "#B23A28", hat: "#141A2C", band: "#E0563F", carrot: "#E8873E", stick: "#4A3A34", flake: "#EEF2FF", puff: "#8796BF", spark: "#E8F0FF"
  } : {
    skyTop: "#B9D0E3", skyLow: "#EBF2F7", back: "#B4C7D9", mid: "#D3DFEA", front: "#E6EEF4", near: "#F6F9FB", rim: "rgba(255,255,255,1)", pine: "#8FA5BC", pineTip: "#FFFFFF",
    wall: "#FFFBF3", wallLo: "#EFE5D0", roof: ["#C8321F", "#B8573E", "#D07C55", "#A84935"], snow: "#FFFFFF", snowLo: "#D3DCE7", win: "#F2BF5E", door: "#9A5838", chim: "#A84935",
    ice: "#C4D8E2", iceHi: "#F4F9FB", bridge: "#F3EAD6", deck: "#FFFFFF", tree: ["#5C826B", "#4F7460", "#698E76"], trunk: "#8A7258", mill: "#F7EFDF", millLo: "#E3D6BE", sail: "#EFE5D0",
    cloud: "#F9FAFC", cloudLo: "#DEE5EC", shadow: "rgba(52,72,104,.24)", leaf: "#ECE2D0", body: "#FFFFFF", bodyLo: "#D2DCE8", coal: "#2C2622", scarf: "#C8321F", scarf2: "#9E2717", hat: "#2C2622", band: "#C8321F", carrot: "#E07B39", stick: "#7A5A40", flake: "#FFFFFF", puff: "#FFFFFF", spark: "#FFFFFF"
  };

  /** the egg's pass: none of the dealt beats, only the town's quiet life — the egg is the pass. Its snow is dealt from dice
   *  of its own */
  function eggPlan(pass) {
    const { W, H, u, pr } = S, no = 99, r = K.deal(pass, 7600), flakes = [];
    for (let i = 0, n = pr ? 18 : 30; i < n; i++) { const t0 = EGG.snow[0] + (i + r() * .8) / n * (EGG.snow[1] - EGG.snow[0]); flakes.push({ x: W * (.02 + r() * .96), t0, d: 3.4 + r() * 1.8, y1: H * (pr ? .64 + r() * .3 : .6 + r() * .36), a: (1 + r() * 2) * u, sw: .7 + r() * .8, ph: r() * TAU, rot: (r() - .5) * 1.6, s: Math.floor(r() * 3), sc: .6 + r() * .55, drift: (r() - .3) * 5 * u }); }
    const base = { pass, gen, egg: true, flakes, b: [no, no + 1, no + 2, no + 3], bk: 0, gust: null };
    return night ? { ...base, won: S.windows.map(() => no), woff: S.windows.map(() => 0), low: { k: "train", t0: no, t1: no + 1, dir: 1, cars: [S.engine] }, moon: null, show: { k: "none" }, close: { k: "none" } }
      : { ...base, n: [no, no + 1, 0], cross: { k: "plane", planes: [] }, deck: { k: "train", t0: no, t1: no + 1, dir: -1, parts: [S.dengine], xs: W, xe: 0 }, head: { k: "kite", t: null }, close: { k: "birds", t0: no, t1: no + 1, dir: -1, y: 0, flock: [], end: 0 } };
  }

  /* the pages: each piece of the town a card of its own, the summer's drawn as the backdrop draws it, the winter's in snow */
  /** a card: what `fn` draws (in the page's own coordinates) between x0…x1, y0…y1, at the screen's density and lined up
   *  with its pixels, with the paper's grain laid over it as the backdrop lays it; it folds about `base` */
  function cardOf(x0, y0, x1, y1, base, fn) {
    x0 = Math.floor(x0 * px) / px; y0 = Math.floor(y0 * px) / px; const cw = Math.max(1, Math.ceil((x1 - x0) * px)), ch = Math.max(1, Math.ceil((y1 - y0) * px));
    const [c, x] = canvas(cw, ch); x.imageSmoothingEnabled = true; x.setTransform(px, 0, 0, px, -x0 * px, -y0 * px); fn(x);
    x.globalCompositeOperation = "source-atop"; x.fillStyle = x.createPattern(S.grainTile, "repeat"); x.fillRect(x0, y0, cw / px, ch / px); x.globalCompositeOperation = "source-over";
    return { c, x0, y0, w: cw / px, h: ch / px, base };
  }
  /** a band of hills, as the backdrop's `band` lays it (`win`: in snow, lighter along its ridge) */
  function bandOn(x, yf, col, blur, win) {
    const { W, H, u } = S;
    if (win) { let top = 1e9; for (let xx = 0; xx <= W + 4; xx += 8) top = Math.min(top, yf(xx)); const gr = x.createLinearGradient(0, top, 0, top + 9 * u); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.35, col); gr.addColorStop(1, col); x.fillStyle = gr; shade(x, blur, -1.6, 3, WINTER.shadow); }
    else { shade(x, blur, -1.6, 3); x.fillStyle = col; }
    x.beginPath(); x.moveTo(0, H); for (let xx = 0; xx <= W + 4; xx += 4) x.lineTo(xx, yf(xx)); x.lineTo(W, H); x.closePath(); x.fill(); unshade(x);
    x.strokeStyle = win ? WINTER.rim : P.rim; x.lineWidth = win ? 1.2 : night ? .9 : .7; x.beginPath(); for (let xx = 0; xx <= W + 4; xx += 4) (xx ? x.lineTo(xx, yf(xx) + .4) : x.moveTo(xx, yf(xx) + .4)); x.stroke();
  }
  /** one of the town's pieces drawn into `x`: as the backdrop draws it, or (`win`) the same in snow */
  function pieceOn(x, which, win) {
    const { W, H, u, pr, backY, townY, frontY, nearY, riverY, riverH } = S, Q = WINTER;
    if (which === "back") {
      bandOn(x, backY, win ? Q.back : P.back, 9, win);
      x.fillStyle = win ? Q.pine : night ? "#141D35" : "#D2C5A6"; for (const [x0, h] of S.pines) { const y = backY(x0) + .6 * u; x.beginPath(); x.moveTo(x0, y - h); x.lineTo(x0 + h * .32, y); x.lineTo(x0 - h * .32, y); x.closePath(); x.fill(); }
      if (win) { x.fillStyle = Q.pineTip; for (const [x0, h] of S.pines) { const y = backY(x0) + .6 * u; x.beginPath(); x.moveTo(x0, y - h); x.lineTo(x0 + h * .16, y - h * .5); x.lineTo(x0 + h * .05, y - h * .44); x.lineTo(x0 - h * .06, y - h * .52); x.lineTo(x0 - h * .16, y - h * .5); x.closePath(); x.fill(); } }
    } else if (which === "town") bandOn(x, townY, win ? Q.mid : P.mid, 9, win);
    else if (which === "river") {
      shade(x, 6, -1, 2, win ? Q.shadow : P.shadow); x.fillStyle = win ? Q.ice : P.river; x.beginPath(); x.moveTo(0, riverY); for (let xx = 0; xx <= W + 4; xx += 6) x.lineTo(xx, riverY + Math.sin(xx / (9 * u)) * .4 * u); x.lineTo(W, riverY + riverH); x.lineTo(0, riverY + riverH); x.closePath(); x.fill(); unshade(x);
      if (!win) { x.fillStyle = P.riverHi; for (const [x0, y0, w] of S.hls) { x.globalAlpha = .55; x.fillRect(x0, y0, w, .35 * u); } x.globalAlpha = 1; }
      else { x.strokeStyle = Q.iceHi; x.lineCap = "round"; for (const [x0, y0, w] of S.hls) { x.globalAlpha = .8; x.lineWidth = .3 * u; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + w * 1.6, y0 - .25 * u); x.stroke(); x.globalAlpha = .5; x.lineWidth = .18 * u; x.beginPath(); x.moveTo(x0 + w * .4, y0 + .55 * u); x.lineTo(x0 + w * 1.2, y0 + .4 * u); x.stroke(); } x.globalAlpha = 1; x.lineCap = "butt"; } // the ice, scored
      const top = S.deckY, n = Math.ceil(W / (W * (pr ? .19 : .085))), span = (W + 4 * u) / n, b0 = -2 * u, b1 = W + 2 * u;
      shade(x, 6, -1.4, 2.6, win ? Q.shadow : P.shadow); x.fillStyle = win ? Q.bridge : P.bridge; x.beginPath(); x.moveTo(b0 - 2 * u, top); x.lineTo(b1 + 2 * u, top);
      x.lineTo(b1 + 2 * u, riverY + riverH * .9);
      for (let k = n - 1; k >= 0; k--) { const a0 = b0 + k * span; x.lineTo(a0 + span * .92, riverY + riverH * .9); x.quadraticCurveTo(a0 + span * .5, top + 1.2 * u - (riverH * .3), a0 + span * .08, riverY + riverH * .9); }
      x.lineTo(b0 - 2 * u, riverY + riverH * .9); x.closePath(); x.fill(); unshade(x);
      if (!win) { x.fillStyle = night ? "#34426A" : "#F8F0E0"; x.fillRect(b0 - 2 * u, top, b1 - b0 + 4 * u, .5 * u);
        x.fillStyle = night ? "rgba(10,16,34,.55)" : "rgba(110,86,60,.35)"; x.fillRect(b0 - 2 * u, top - .28 * u, b1 - b0 + 4 * u, .28 * u); }
      else { // snow along its parapet, and icicles hanging in each arch
        shade(x, 3, -.8, 1.4, Q.shadow); x.fillStyle = Q.deck; x.beginPath(); x.roundRect(b0 - 2 * u, top - .55 * u, b1 - b0 + 4 * u, .9 * u, .45 * u); x.fill(); unshade(x);
        x.fillStyle = Q.snow; x.globalAlpha = .9; for (let k = 0; k < n; k++) { const cx = b0 + k * span + span * .5, cy = top + 1.2 * u - riverH * .3 + (riverY + riverH * .9 - (top + 1.2 * u - riverH * .3)) * .5 - .1 * u; for (const [dx, l] of [[-.9, .7], [-.3, 1.1], [.35, .85], [.95, .55]]) { const ix = cx + dx * u * (pr ? .8 : 1); x.beginPath(); x.moveTo(ix - .16 * u, cy); x.lineTo(ix + .16 * u, cy); x.lineTo(ix, cy + l * u); x.closePath(); x.fill(); } } x.globalAlpha = 1; }
    } else if (which === "front") bandOn(x, frontY, win ? Q.front : P.front, 8, win);
    else if (which === "near") {
      if (win) { const gr = x.createLinearGradient(0, S.nearTop, 0, S.nearTop + 6 * u); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.4, Q.near); gr.addColorStop(1, Q.near); x.fillStyle = gr; shade(x, 7, -1.4, 3, Q.shadow); }
      else { shade(x, 7, -1.4, 3); x.fillStyle = P.near; }
      x.beginPath(); x.moveTo(0, H); const tooth = 1.2 * u;
      for (let xx = 0, k = 0; xx <= W + tooth; xx += tooth, k++) x.lineTo(xx, nearY(xx) - (k % 2 ? 0 : .7 * u)); x.lineTo(W, H); x.closePath(); x.fill(); unshade(x);
    }
  }
  /** a house, as the backdrop draws it; in winter its roof under snow, a chimney, its windows lit */
  function houseOn(x, h, win) {
    const { u } = S, Q = WINTER, roofPath = () => { x.beginPath(); if (h.roof === 3) x.rect(h.x - .3 * u, h.base - h.h * .74, h.w + .6 * u, h.h * .14); else { x.moveTo(h.x - .5 * u, h.base - h.h * .6); x.lineTo(h.x + h.w / 2, h.base - h.h); x.lineTo(h.x + h.w + .5 * u, h.base - h.h * .6); x.closePath(); } };
    if (win && h.chim) { const c = h.chim; shade(x, 3, -.8, 1.6, Q.shadow); x.fillStyle = Q.chim; x.fillRect(c.x - c.w / 2, c.top, c.w, c.bot - c.top); unshade(x); x.fillStyle = "rgba(0,0,0,.18)"; x.fillRect(c.x - c.w / 2, c.top, c.w * .3, c.bot - c.top); }
    shade(x, 5, -1.3, 2.4, win ? Q.shadow : P.shadow); x.fillStyle = win ? Q.wall : P.wall; x.fillRect(h.x, h.base - h.h * .62, h.w, h.h * .62);
    x.fillStyle = (win ? Q.roof : P.roof)[h.roof % (win ? Q.roof : P.roof).length]; roofPath(); x.fill(); unshade(x);
    x.fillStyle = win ? Q.wallLo : P.wallLo; x.fillRect(h.x, h.base - h.h * .62, h.w * .14, h.h * .62);
    x.fillStyle = win ? Q.win : P.window; for (const w of h.wins) x.fillRect(w.x, w.y, w.w, w.h);
    if (win) { x.fillStyle = night ? "rgba(255,246,214,.55)" : "rgba(255,248,226,.6)"; for (const w of h.wins) { x.fillRect(w.x + w.w * .45, w.y, w.w * .1, w.h); x.fillRect(w.x, w.y + w.h * .45, w.w, w.h * .1); } } // their glazing bars
    if (h.door >= 0) { x.fillStyle = win ? Q.door : P.door; x.fillRect(h.door, h.base - h.h * .3, h.w * .16, h.h * .3); }
    if (!win) return;
    // the snow: along the roof's ridge and down its slopes, hanging over the eaves in drifts, and on the chimney
    shade(x, 3, -.7, 1.4, Q.shadow); x.fillStyle = Q.snow; x.strokeStyle = Q.snow; x.lineJoin = "round"; x.lineCap = "round";
    if (h.roof === 3) { x.beginPath(); x.roundRect(h.x - .5 * u, h.base - h.h * .74 - .42 * u, h.w + 1 * u, .62 * u, .3 * u); x.fill(); }
    else { const L = [h.x - .55 * u, h.base - h.h * .6], M = [h.x + h.w / 2, h.base - h.h - .12 * u], R = [h.x + h.w + .55 * u, h.base - h.h * .6];
      x.lineWidth = .62 * u; x.beginPath(); x.moveTo(L[0], L[1]); x.lineTo(M[0], M[1]); x.lineTo(R[0], R[1]); x.stroke();
      for (const [a, b] of [[L, M], [M, R]]) for (const f of [.2, .45, .7, .9]) { const px2 = lerp(a[0], b[0], f), py2 = lerp(a[1], b[1], f) + .28 * u; x.beginPath(); x.arc(px2, py2, (.2 + .1 * ((f * 10) % 2)) * u, 0, TAU); x.fill(); } } // drifts lumped along it
    if (h.chim) { const c = h.chim; x.beginPath(); x.roundRect(c.x - c.w / 2 - .14 * u, c.top - .3 * u, c.w + .28 * u, .42 * u, .2 * u); x.fill(); }
    unshade(x); x.fillStyle = Q.snowLo; x.globalAlpha = .55; if (h.roof !== 3) { x.beginPath(); x.moveTo(h.x - .2 * u, h.base - h.h * .6 + .3 * u); x.lineTo(h.x + h.w / 2, h.base - h.h + .28 * u); x.lineTo(h.x + h.w / 2, h.base - h.h + .5 * u); x.lineTo(h.x + .1 * u, h.base - h.h * .6 + .45 * u); x.closePath(); x.fill(); } x.globalAlpha = 1; // the snow's shaded side
    x.lineCap = "butt"; x.lineJoin = "miter";
  }
  /** the windmill's tower, as the backdrop draws it; in winter with snow on its cap */
  function millOn(x, win) {
    const m = S.mill, Q = WINTER, { u } = S;
    shade(x, 5, -1.3, 2.4, win ? Q.shadow : P.shadow); x.fillStyle = win ? Q.mill : P.mill; x.beginPath(); x.moveTo(m.x - m.h * .2, m.base); x.lineTo(m.x - m.h * .11, m.y + m.h * .12); x.lineTo(m.x + m.h * .11, m.y + m.h * .12); x.lineTo(m.x + m.h * .2, m.base); x.closePath(); x.fill();
    x.fillStyle = (win ? Q.roof : P.roof)[0]; x.beginPath(); x.moveTo(m.x - m.h * .15, m.y + m.h * .14); x.lineTo(m.x, m.y - m.h * .02); x.lineTo(m.x + m.h * .15, m.y + m.h * .14); x.closePath(); x.fill(); unshade(x);
    x.fillStyle = win ? Q.millLo : P.millLo; x.fillRect(m.x - m.h * .045, m.base - m.h * .28, m.h * .09, m.h * .28);
    if (!win) return;
    shade(x, 3, -.7, 1.4, Q.shadow); x.strokeStyle = Q.snow; x.lineWidth = .55 * u; x.lineJoin = "round"; x.lineCap = "round"; x.beginPath(); x.moveTo(m.x - m.h * .15, m.y + m.h * .135); x.lineTo(m.x, m.y - m.h * .02 - .1 * u); x.lineTo(m.x + m.h * .15, m.y + m.h * .135); x.stroke();
    x.fillStyle = Q.snow; x.beginPath(); x.ellipse(m.x, m.base - .1 * u, m.h * .26, .45 * u, 0, Math.PI, TAU); x.fill(); unshade(x); x.lineCap = "butt"; x.lineJoin = "miter"; // a drift at its foot
    x.fillStyle = Q.win; x.fillRect(m.x - m.h * .035, m.y + m.h * .36, m.h * .07, m.h * .09); // a lit window up the tower
  }
  /** a snowy pine, its trunk's foot where a summer tree's is in its sprite */
  function pineSpr(s, col) {
    const { u } = S, Q = WINTER, w = 5.4 * u * s, h = 9 * u * s, pad = 2 * u;
    return make(w + 4 * u, h + 3 * u, x => { const cx = pad + w / 2, top = pad, crown = h * .84;
      shade(x, 5, -1.2, 2.2, Q.shadow); x.fillStyle = Q.trunk; x.fillRect(cx - .32 * u, top + crown * .9, .64 * u, h - crown * .9);
      const tiers = [[0, .46, .5], [.24, .74, .78], [.46, 1, 1]];
      for (let k = tiers.length - 1; k >= 0; k--) { const [a, b, wf] = tiers[k], y0 = top + crown * a, y1 = top + crown * b, hw = w / 2 * wf; x.fillStyle = col; x.beginPath(); x.moveTo(cx, y0); x.lineTo(cx + hw, y1); x.quadraticCurveTo(cx, y1 + .5 * u * s, cx - hw, y1); x.closePath(); x.fill(); }
      unshade(x);
      for (let k = tiers.length - 1; k >= 0; k--) { const [a, b, wf] = tiers[k], y0 = top + crown * a, y1 = top + crown * b, hw = w / 2 * wf, sy = lerp(y0, y1, .52), sw = hw * .52;
        x.fillStyle = "rgba(0,0,0,.12)"; x.beginPath(); x.moveTo(cx, y0); x.lineTo(cx - hw, y1); x.quadraticCurveTo(cx - hw * .4, y1 + .3 * u * s, cx - hw * .05, y1 + .1 * u * s); x.closePath(); x.fill(); // its shaded side
        x.fillStyle = Q.snow; x.beginPath(); x.moveTo(cx, y0 - .15 * u); x.lineTo(cx + sw, sy); for (let j = 4; j >= 0; j--) { const f = j / 4, xx = cx - sw + 2 * sw * f; x.quadraticCurveTo(xx + sw * .25, sy + .55 * u * s * (j % 2 ? 1 : .5), xx, sy - .05 * u); } x.closePath(); x.fill(); // snow on the tier, its edge in drifts
        x.fillStyle = Q.snowLo; x.globalAlpha = .45; x.beginPath(); x.moveTo(cx, y0); x.lineTo(cx - sw, sy); x.lineTo(cx - sw * .35, sy + .1 * u); x.closePath(); x.fill(); x.globalAlpha = 1; }
    });
  }
  /** the snowman, his scarf and his face (his right arm and his hat are drawn apart: he tips it) */
  function snowmanSpr(q) {
    const Q = WINTER, w = 9 * q, h = 12.5 * q, ox = 4.5 * q, oy = 11.8 * q; // his foot at (ox, oy)
    const s = make(w, h, x => { x.translate(ox, oy);
      const ball = (cy, r) => { shade(x, 4, -1, 2, Q.shadow); x.fillStyle = Q.bodyLo; x.beginPath(); x.arc(0, cy, r, 0, TAU); x.fill(); unshade(x); x.save(); x.beginPath(); x.arc(0, cy, r, 0, TAU); x.clip(); x.fillStyle = Q.body; x.beginPath(); x.arc(r * .16, cy - r * .14, r * .98, 0, TAU); x.fill(); x.restore(); };
      x.strokeStyle = Q.stick; x.lineCap = "round"; x.lineWidth = .3 * q; x.beginPath(); x.moveTo(-1.3 * q, -5.3 * q); x.lineTo(-3.3 * q, -6.9 * q); x.moveTo(-2.6 * q, -6.35 * q); x.lineTo(-2.75 * q, -7.2 * q); x.moveTo(-2.9 * q, -6.6 * q); x.lineTo(-3.55 * q, -6.55 * q); x.stroke(); // his left arm
      ball(-2.05 * q, 2.15 * q); ball(-5.0 * q, 1.6 * q); ball(-7.45 * q, 1.18 * q);
      x.fillStyle = Q.coal; for (const [bx, by, br] of [[.05, -5.55, .17], [.08, -4.75, .17], [.1, -2.9, .19], [-.4, -7.68, .15], [.42, -7.7, .15]]) { x.beginPath(); x.arc(bx * q, by * q, br * q, 0, TAU); x.fill(); } // buttons, eyes
      for (let k = 0; k < 5; k++) { const a = Math.PI * (.2 + k * .15); x.beginPath(); x.arc(Math.cos(a) * .62 * q + .05 * q, -7.2 * q + Math.sin(a) * .42 * q, .07 * q, 0, TAU); x.fill(); } // his smile, in coal
      x.fillStyle = night ? "rgba(255,140,150,.28)" : "rgba(240,120,110,.32)"; for (const sd of [-1, 1]) { x.beginPath(); x.ellipse(sd * .72 * q, -7.28 * q, .26 * q, .17 * q, 0, 0, TAU); x.fill(); } // his cheeks
      x.fillStyle = Q.carrot; x.beginPath(); x.moveTo(.1 * q, -7.42 * q); x.lineTo(1.75 * q, -7.12 * q); x.lineTo(.1 * q, -7.02 * q); x.closePath(); x.fill(); x.fillStyle = "rgba(120,50,10,.35)"; x.beginPath(); x.moveTo(.1 * q, -7.22 * q); x.lineTo(1.75 * q, -7.12 * q); x.lineTo(.1 * q, -7.02 * q); x.closePath(); x.fill(); // his carrot
      shade(x, 3, -.8, 1.5, Q.shadow); x.fillStyle = Q.scarf; x.beginPath(); x.roundRect(-1.3 * q, -6.55 * q, 2.6 * q, .62 * q, .3 * q); x.fill(); // his scarf
      x.beginPath(); x.moveTo(.35 * q, -6.2 * q); x.lineTo(1.0 * q, -6.25 * q); x.lineTo(1.25 * q, -4.75 * q); x.lineTo(.68 * q, -4.62 * q); x.closePath(); x.fill(); unshade(x);
      x.fillStyle = Q.scarf2; for (let k = 0; k < 3; k++) x.fillRect((-1.05 + k * .8) * q, -6.55 * q, .32 * q, .62 * q); x.fillRect(.8 * q, -5.6 * q, .45 * q, .22 * q); // its stripes
      x.strokeStyle = Q.scarf; x.lineWidth = .1 * q; x.beginPath(); for (let k = 0; k < 4; k++) { x.moveTo((.72 + k * .15) * q, -4.65 * q); x.lineTo((.7 + k * .15) * q, -4.35 * q); } x.stroke(); // its fringe
    });
    s.ox = ox; s.oy = oy;
    s.arm = make(4 * q, 2.2 * q, x => { x.strokeStyle = Q.stick; x.lineCap = "round"; x.lineWidth = .3 * q; x.beginPath(); x.moveTo(.2 * q, 1.1 * q); x.lineTo(3.4 * q, 1.1 * q); x.moveTo(2.5 * q, 1.1 * q); x.lineTo(3.1 * q, .35 * q); x.moveTo(2.8 * q, 1.1 * q); x.lineTo(3.7 * q, 1.5 * q); x.stroke(); }); // his right arm, from the shoulder along x
    s.hat = make(3.6 * q, 3.2 * q, x => { x.translate(1.8 * q, 2.7 * q); shade(x, 3, -.8, 1.6, Q.shadow); x.fillStyle = Q.hat; x.beginPath(); x.roundRect(-1.55 * q, -.3 * q, 3.1 * q, .42 * q, .2 * q); x.fill(); x.beginPath(); x.roundRect(-1.0 * q, -2.35 * q, 2.0 * q, 2.15 * q, .16 * q); x.fill(); unshade(x);
      x.fillStyle = Q.band; x.fillRect(-1.0 * q, -.75 * q, 2.0 * q, .4 * q); x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(.45 * q, -2.3 * q, .35 * q, 2.0 * q); }); // its brim at (0, 0) of its own
    return s;
  }
  /** the egg's pieces and its winter, made once per layout: some each frame through the quiet start of the pass, the rest
   *  at once if they are wanted sooner (a moment held out of turn) */
  function eggJobs() {
    const { W, u, pr, frontY, orb } = S, Q = WINTER, jobs = [];
    { let m = 1e9; for (let x = 0; x <= W + 4; x += 4) m = Math.min(m, S.nearY(x)); S.nearTop = m - .7 * u; }
    // the winter's chimneys: on the far slope of each gabled roof
    for (const h of S.houses) h.chim = h.roof === 3 ? null : (() => { const cx = h.x + h.w * .74, cw = Math.max(.55 * u, h.w * .13), sl = lerp(h.base - h.h, h.base - h.h * .6, (cx - (h.x + h.w / 2)) / (h.w / 2 + .5 * u)); return { x: cx, w: cw, top: h.base - h.h * .98, bot: sl + .5 * u }; })();
    const tm = { houses: [], trees: [], mill: null, man: null };
    S.houses.forEach((h, i) => { tm.houses[i] = eggTimes(h.x + h.w, h.base, h.x + h.w / 2, h.base - h.h * .5); });
    S.trees.forEach((t, i) => { tm.trees[i] = eggTimes(t.x + 2 * u, t.y, t.x, t.y - 4 * u, .05); });
    { const m = S.mill; tm.mill = eggTimes(m.x + m.h * .2, m.base, m.x, m.base - m.h * .5, .1); }
    const smx = W * .8, smy = frontY(smx) + .45 * u; tm.man = eggTimes(smx + 3.5 * u, smy, smx, smy - 6 * u, .25);
    EG = { gen, A: { houses: [] }, B: { houses: [] }, jobs, tm, smAt: [smx, smy] };
    /* the summer's town lies baked in the backdrop: while any of it is folded, a strip of the land as it lies behind it
       (the paper, the hills, no houses) is laid over that stretch, and the houses and the mill drawn on it as cards */
    { const m = S.mill; let x0 = m.x - m.h * .2, x1 = m.x + m.h * .2, y0 = m.y - m.h * .02, y1 = m.base; for (const h of S.houses) { x0 = Math.min(x0, h.x); x1 = Math.max(x1, h.x + h.w); y0 = Math.min(y0, h.base - h.h); y1 = Math.max(y1, h.base); }
      jobs.push(["A", 3, () => { EG.A.strip = cardOf(x0 - 2 * u, y0 - 1.5 * u, x1 + 2 * u, y1 + 1.2 * u, 0, x => { printOn(x, false); for (const k of BANDS) pieceOn(x, k, false); }); }]); }
    for (const [pg, win] of [["A", false], ["B", true]]) {
      const c = EG[pg];
      S.houses.forEach((h, i) => jobs.push([pg, 1, () => { c.houses[i] = cardOf(h.x - 1.5 * u, h.base - h.h - 1.2 * u, h.x + h.w + 1.5 * u, h.base + .8 * u, h.base, x => houseOn(x, h, win)); }]));
      jobs.push([pg, 1, () => { const m = S.mill; c.mill = cardOf(m.x - m.h * .2 - 1.2 * u, m.y - m.h * .02 - 1.2 * u, m.x + m.h * .2 + 1.2 * u, m.base + .8 * u, m.base, x => millOn(x, win)); }]);
    }
    jobs.push(["B", 2, () => { const B = EG.B;
      B.trees = S.trees.map((t, i) => pineSpr(t.s, Q.tree[i % 3]));
      B.sail = make(S.mill.r * 1.1, S.mill.r * .34, x => { const r0 = S.mill.r; shade(x, 4, -1, 2, Q.shadow); x.fillStyle = Q.sail; x.fillRect(r0 * .1, r0 * .04, r0 * .95, r0 * .24); unshade(x); x.strokeStyle = Q.millLo; x.lineWidth = .8; for (let k = 1; k < 5; k++) { const xx = r0 * (.1 + k * .19); x.beginPath(); x.moveTo(xx, r0 * .04); x.lineTo(xx, r0 * .28); x.stroke(); } x.fillStyle = Q.snow; x.beginPath(); x.roundRect(r0 * .08, r0 * .01, r0 * .99, r0 * .07, r0 * .035); x.fill(); });
      const cloud = s => { const w = 17 * u * s, h = 7.2 * u * s, pad = 2.6 * u; return make(w + pad * 2, h + pad * 2, x => { shade(x, 7, -1.5, 3, Q.shadow); x.fillStyle = Q.cloud; x.beginPath();
        for (const [bx, by, br] of [[.2, .66, .3], [.4, .42, .42], [.63, .5, .36], [.82, .68, .26]]) { x.moveTo(pad + w * bx + h * br, pad + h * by); x.arc(pad + w * bx, pad + h * by, h * br, 0, TAU); }
        x.rect(pad + w * .16, pad + h * .62, w * .7, h * .36); x.fill(); unshade(x); x.fillStyle = Q.cloudLo; x.fillRect(pad + w * .16, pad + h * .88, w * .7, h * .1);
        if (night) { x.globalAlpha = .55; x.lineWidth = 1.2; x.strokeStyle = Q.cloudHi; x.beginPath(); x.arc(pad + w * .4, pad + h * .42, h * .42, -2.4, -.5); x.stroke(); x.globalAlpha = 1; } }); };
      B.clouds = (pr ? [.95, .78, .7] : [1, .78, .9, .72]).map(s => cloud(s * 1.08));
      if (!night) { const R = orb.r * .92; B.rays = make(R * 3.4, R * 3.4, x => { const c0 = R * 1.7; shade(x, 5, -1, 2, Q.shadow); x.fillStyle = "#F4E6C8"; x.beginPath(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, a0 = a - .11, a1 = a + .11; x.moveTo(c0 + Math.cos(a0) * R * 1.08, c0 + Math.sin(a0) * R * 1.08); x.lineTo(c0 + Math.cos(a) * R * 1.45, c0 + Math.sin(a) * R * 1.45); x.lineTo(c0 + Math.cos(a1) * R * 1.08, c0 + Math.sin(a1) * R * 1.08); x.closePath(); } x.fill(); });
        B.disc = make(R * 2.6, R * 2.6, x => { const c0 = R * 1.3; shade(x, 6, -1.2, 2.4, Q.shadow); x.fillStyle = "#EAC98E"; x.beginPath(); x.arc(c0 + R * .06, c0 + R * .07, R, 0, TAU); x.fill(); unshade(x); x.fillStyle = "#F4DCA8"; x.beginPath(); x.arc(c0 - R * .03, c0 - R * .04, R * .95, 0, TAU); x.fill(); x.fillStyle = "rgba(255,252,240,.35)"; x.beginPath(); x.arc(c0 - R * .3, c0 - R * .32, R * .3, 0, TAU); x.fill(); }); B.R = R; }
      else { const R = orb.r * 1.5; B.R = R; B.glow = K.glowSpr(Math.round(R * 3.4), K.rgb("#A9C8FF"), .4);
        B.disc = make(R * 2.4, R * 2.4, x => { const c0 = R * 1.2; x.fillStyle = "#F7F0DC"; x.beginPath(); x.arc(c0, c0, R, 0, TAU); x.fill();
          x.fillStyle = "#E6DCC0"; for (const [cx, cy, cr] of [[-.3, -.2, .22], [.25, .15, .16], [-.05, .38, .12], [.38, -.34, .08], [-.5, .2, .07]]) { x.beginPath(); x.arc(c0 + cx * R, c0 + cy * R, cr * R, 0, TAU); x.fill(); }
          x.fillStyle = "rgba(255,255,255,.25)"; x.beginPath(); x.arc(c0 + R * .25, c0 - R * .28, R * .5, 0, TAU); x.fill(); }); }
      const sm = (S.pr ? 1.3 : 1.2) * u; B.sm = snowmanSpr(sm); B.smq = sm;
      B.flakes = [0, 1, 2].map(v => make(3.2 * u, 3.2 * u, x => { const c0 = 1.6 * u, L = 1.35 * u, w = .16 * u; shade(x, 2, -.4, .9, Q.shadow); x.fillStyle = Q.flake; x.beginPath();
        for (let k = 0; k < 6; k++) { x.save(); x.translate(c0, c0); x.rotate(k / 6 * TAU); x.rect(0, -w / 2, L, w); for (const [f, l] of v === 0 ? [[.5, .38], [.78, .25]] : v === 1 ? [[.4, .3], [.62, .42], [.84, .22]] : [[.66, .5]]) { x.save(); x.translate(L * f, 0); x.rotate(.9); x.rect(0, -w * .4, L * l, w * .8); x.rotate(-1.8); x.rect(0, -w * .4, L * l, w * .8); x.restore(); } x.restore(); }
        x.fill(); x.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.lineTo(c0 + Math.cos(a) * w * 1.6, c0 + Math.sin(a) * w * 1.6); } x.closePath(); x.fill(); }));
      B.puff = make(4.4 * u, 3.4 * u, x => { shade(x, 3, -.6, 1.2, Q.shadow); x.fillStyle = Q.puff; x.beginPath(); for (const [bx, by, br] of [[1.5, 2.0, 1.0], [2.3, 1.45, 1.2], [3.1, 2.05, .9]]) { x.moveTo((bx + br) * u, by * u); x.arc(bx * u, by * u, br * u, 0, TAU); } x.fill(); unshade(x); });
      B.spark = K.glowSpr(Math.max(2, Math.round(1.1 * u)), K.rgb(Q.spark), .9);
      { const t = S.grainTile, [vc, vx] = canvas(t.width, t.height); vx.fillStyle = Q.leaf; vx.fillRect(0, 0, t.width, t.height); vx.drawImage(t, 0, 0); B.verso = vc; } // the leaf's paper, its grain in it
      if (night) { B.nPad = make(160, 80, x => { for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(14,20,36,.16)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } }); /* the night's ground, soft at its edges */
        let top = 1e9; for (let xx = 0; xx <= S.W + 4; xx += 8) top = Math.min(top, S.backY(xx)); B.landTop = top; }
      B.sparks = Array.from({ length: S.pr ? 10 : 16 }, (_, i) => { const r = rng(91 + i), x = S.W * r(), k = r() < .5; return { x, y: (k ? frontY : S.townY)(x) + (k ? 1.2 : .9) * u + r() * 1.5 * u, f: .8 + r() * 1.2, ph: r() * TAU }; });
    }]);
    const ldPage = c => c.mill && c.houses.length === S.houses.length && c.houses.every(Boolean);
    EG.ready = pg => pg === "B" ? ldPage(EG.B) && !!EG.B.trees : ldPage(EG.A) && !!EG.A.strip;
  }
  /** run the jobs: a few a frame while the pass is quiet, or all of a page's at once when it is wanted */
  function eggMake(need) {
    if (!EG || EG.gen !== gen) eggJobs();
    const J = EG.jobs; let budget = 10;
    while (J.length && (budget > 0 || (need && need.some(p => !EG.ready(p))))) { const [, w, fn] = J.shift(); fn(); budget -= w; }
  }

  /* drawing the pages */
  /** what folds a piece about its foot `y0` (in the frame's transform): s 1 standing, a fifth lying flat (lean) */
  const fold = (y0, s) => { if (s === 1) return; g.translate(0, y0); g.scale(1, s); g.translate(0, -y0); };
  const cardDraw = (cd, s) => { if (s <= .001) return; g.save(); fold(cd.base, s); g.drawImage(cd.c, cd.x0, cd.y0, cd.w, cd.h); g.restore(); };
  /** a page's paper onto `x`: its sky and, by night, its pinholes, as the backdrop lays them (its grain is laid after) */
  function printOn(x, win) {
    const { W, H } = S, Q = WINTER, gr = x.createLinearGradient(0, 0, 0, H * .7); gr.addColorStop(0, win ? Q.skyTop : P.skyTop); gr.addColorStop(1, win ? Q.skyLow : P.skyLow);
    x.fillStyle = gr; x.fillRect(0, 0, W, H);
    if (night) for (const s of S.stars) { x.fillStyle = P.star; x.globalAlpha = s.tw ? .3 : .55 + s.s * .3; x.beginPath(); x.arc(s.x, s.y, s.s * .75, 0, TAU); x.fill(); if (s.s > 1.3) { x.globalAlpha = .12; x.beginPath(); x.arc(s.x, s.y, s.s * 2.4, 0, TAU); x.fill(); } x.globalAlpha = 1; } /* star by star, as the backdrop sets them (an alpha past 1 is ignored there, and the last star's 1 stands) */
  }
  /** the backdrop given over to the winter's page while it is up (its paper and its land laid once, so that each frame
   *  draws only what moves), and given back: the summer's, kept as it was laid, is put back pixel for pixel */
  function bgSwap(want) {
    if (want === EGbg || !S.bgx) return; const x = S.bgx, c = x.canvas;
    if (want === "B") { if (!EG.saved || EG.saved.width !== c.width || EG.saved.height !== c.height) { const [sc, sx] = canvas(c.width, c.height); sx.drawImage(c, 0, 0); EG.saved = sc; }
      x.save(); x.setTransform(px, 0, 0, px, 0, 0); printOn(x, true); for (const k of BANDS) pieceOn(x, k, true); x.globalCompositeOperation = "source-over"; x.fillStyle = x.createPattern(S.grainTile, "repeat"); x.fillRect(0, 0, S.W, S.H); x.restore(); }
    else { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = "copy"; x.drawImage(EG.saved, 0, 0); x.restore(); }
    EGbg = want;
  }
  /** the egg let go: the backdrop as it was, and what it made */
  function eggOff() { if (EGbg === "B" && EG && EG.saved) bgSwap("A"); EG = null; EGbuf = null; }
  /** the fold of each of a page's pieces at loop time T */
  function eggState(T, win, ie = 1) {
    const tm = EG.tm, pg = win ? "B" : "A", st = win ? stB : (T2, t) => 1 - (1 - stA(T2, t)) * ie; /* (ie: as far as the egg has come in) */
    return { houses: tm.houses.map(t => st(T, t[pg])), trees: tm.trees.map(t => st(T, t[pg])), mill: st(T, tm.mill[pg]), man: win ? st(T, tm.man.B) : 0 };
  }
  /** the summer's page: the town as the scene draws it at rest, each piece folded as far as it has gone, its sun (or moon)
   *  and its clouds drawn up as far as they have gone */
  function pageA(T, I, A, F, dt, ie = 1) {
    const { W, u, orb } = S, c = EG.A, st = eggState(T, false, ie);
    if (st.mill < .9999 || st.houses.some(s => s < .9999)) { const sp = c.strip; g.drawImage(sp.c, sp.x0, sp.y0, sp.w, sp.h); S.houses.forEach((h, i) => cardDraw(c.houses[i], st.houses[i])); cardDraw(c.mill, st.mill); } // (the backdrop has the town; this stands in for it while it folds)
    // what the scene draws over the backdrop, in its order: the sun or the moon on its thread, (by night) the stars that
    // twinkle, the clouds, the sails, the trees, (by night) the lit windows, the glints or the moon on the river, the kite
    const swing = Math.sin(A * .55) * .035, ox = orb.x + Math.sin(swing) * orb.y, oy0 = Math.cos(swing) * orb.y, oy = oy0 - upA(T, 0) * ie * (oy0 + orb.r * (night ? 3.4 : 1.8) + 6);
    if (oy - orb.r > 0) { g.strokeStyle = P.thread; g.lineWidth = .8; g.beginPath(); g.moveTo(orb.x, 0); g.lineTo(ox, oy - orb.r); g.stroke(); }
    if (!night) { put(S.sunRays, ox, oy, .5, .5, A * .04); put(S.sunDisk, ox, oy); }
    else { g.globalAlpha = .75 + (F >= 0 ? env(F, 0, .2, .7, 1) * .25 : 0); g.drawImage(S.moonGlow, ox - S.moonGlow.width / 2, oy - S.moonGlow.height / 2); g.globalAlpha = 1;
      g.fillStyle = P.moon; g.beginPath(); g.arc(ox, oy, orb.r, 0, TAU); g.fill(); g.fillStyle = P.moonLo; for (const [cx, cy, cr] of [[-.3, -.2, .22], [.25, .15, .16], [-.05, .38, .12]]) { g.beginPath(); g.arc(ox + cx * orb.r, oy + cy * orb.r, cr * orb.r, 0, TAU); g.fill(); }
      for (const s of S.stars) { if (!s.tw) continue; const a = .35 + .65 * Math.pow(Math.max(0, Math.sin(A * s.f + s.ph)), 3); g.globalAlpha = a; g.fillStyle = P.star; g.beginPath(); g.arc(s.x, s.y, s.s * .7, 0, TAU); g.fill(); } g.globalAlpha = 1; }
    S.clouds.forEach((cl, i) => { const a = Math.sin(A * .5 + cl.ph) * .03, x = cl.x + Math.sin(a) * cl.y, y = Math.cos(a) * cl.y - upA(T, i + 1) * ie * (cl.y + cl.spr.h2 + 6);
      if (y - cl.spr.h2 * .3 > 0) { g.strokeStyle = P.thread; g.lineWidth = .8; g.beginPath(); g.moveTo(cl.x, 0); g.lineTo(x, y - cl.spr.h2 * .3); g.stroke(); }
      put(cl.spr, x, y, .5, .2, a * .6); });
    { const m = S.mill; g.save(); fold(m.base, st.mill); for (let k = 0; k < 4; k++) put(S.millSail, m.x, m.y + m.h * .12, .1, .5, S.millAngle + k * TAU / 4); g.fillStyle = P.millLo; g.beginPath(); g.arc(m.x, m.y + m.h * .12, .7 * u, 0, TAU); g.fill(); g.restore(); }
    S.trees.forEach((t, i) => { if (t.front) return; g.save(); fold(t.y, st.trees[i]); put(t.spr, t.x, t.y, .5, 1 - 1.4 * u / t.spr.h2, Math.sin(A * 1.1 + t.ph) * .018); g.restore(); });
    if (night) { let i = 0; S.houses.forEach((h, hi) => { g.save(); fold(h.base, st.houses[hi]); for (let k = 0; k < h.wins.length; k++, i++) { const w = S.windows[i], base = w.base ? .82 + .18 * Math.sin(A * w.f + w.ph) : (Math.sin(A * w.f + w.ph) > .985 ? .8 : 0); if (base <= .02) continue;
      g.globalAlpha = clamp(base) * .55; g.drawImage(S.glow, w.x + w.w / 2 - S.glow.width / 2, w.y + w.h / 2 - S.glow.height / 2); g.globalAlpha = clamp(base); g.fillStyle = P.lit; g.fillRect(w.x, w.y, w.w, w.h); g.globalAlpha = 1; } g.restore(); }); }
    if (!night) { g.fillStyle = "rgba(255,255,255,.7)"; for (const s of S.glints) { const a = Math.pow(Math.max(0, Math.sin(A * s.v * 1.6 + s.ph)), 6); if (a < .05) continue; g.globalAlpha = a; g.fillRect((s.x + A * s.v * 4) % W, s.y, s.w, .3 * u); } g.globalAlpha = 1; }
    else { g.fillStyle = P.moon; for (const s of S.moonStrips) { const k = .5 + .5 * Math.sin(A * s.v + s.ph), w = s.w * (.55 + .45 * k); g.globalAlpha = (.06 + .22 * k) * (1 - Math.abs(s.dx) / (4.5 * u)); g.fillRect(orb.x - w / 2 + s.dx + Math.sin(A * .7 + s.ph) * .5 * u, s.y, w, .24 * u); } g.globalAlpha = 1; }
    if (!night) dKite(T, I, A, dt, null);
    S.trees.forEach((t, i) => { if (!t.front) return; g.save(); fold(t.y, st.trees[i]); put(t.spr, t.x, t.y, .5, 1 - 1.4 * u / t.spr.h2, Math.sin(A * 1.1 + t.ph) * .018); g.restore(); });
  }
  /** the winter's page: the same town in snow, its pieces springing up, a pale sun (by night a great moon) and snow clouds
   *  let down on their threads, smoke from the chimneys, the snowman, the snow */
  function pageB(T, I, A) {
    const { u, orb } = S, c = EG.B, Q = WINTER, st = eggState(T, true), on = k => (T < MIDT ? clamp((T - EGG.turn0[1] + .3) / .8) : clamp((EGG.turn1[0] + .2 - T) / .5)) * k;
    // the sky's pieces first, behind the hills: the sun or the moon, and the clouds
    const swing = Math.sin(A * .55) * .035, ox = orb.x + Math.sin(swing) * orb.y, oy0 = Math.cos(swing) * orb.y + (night ? orb.r * .15 : 0), R = c.R, oy = oy0 - upB(T, 0) * (oy0 + R * 3.6 + 6);
    if (oy - R > 0) { g.strokeStyle = night ? P.thread : "rgba(80,96,120,.3)"; g.lineWidth = .8; g.beginPath(); g.moveTo(orb.x, 0); g.lineTo(ox, oy - R); g.stroke(); }
    if (!night) { put(c.rays, ox, oy, .5, .5, A * .04); put(c.disc, ox, oy); }
    else { g.globalAlpha = .9; g.drawImage(c.glow, ox - c.glow.width / 2, oy - c.glow.height / 2); g.globalAlpha = 1; put(c.disc, ox, oy);
      for (const s of S.stars) { if (!s.tw) continue; const a = .35 + .65 * Math.pow(Math.max(0, Math.sin(A * s.f * 1.2 + s.ph)), 3); g.globalAlpha = a; g.fillStyle = P.star; g.beginPath(); g.arc(s.x, s.y, s.s * .75, 0, TAU); g.fill(); } g.globalAlpha = 1; }
    S.clouds.forEach((cl, i) => { const spr = c.clouds[i], a = Math.sin(A * .5 + cl.ph) * .03, x = cl.x + Math.sin(a) * cl.y, y = Math.cos(a) * cl.y - upB(T, i + 1) * (cl.y + spr.h2 + 6);
      if (y - spr.h2 * .3 > 0) { g.strokeStyle = night ? P.thread : "rgba(80,96,120,.3)"; g.lineWidth = .8; g.beginPath(); g.moveTo(cl.x, 0); g.lineTo(x, y - spr.h2 * .3); g.stroke(); }
      put(spr, x, y, .5, .2, a * .6); });
    S.houses.forEach((h, i) => cardDraw(c.houses[i], st.houses[i]));
    { const m = S.mill; g.save(); cardDraw(c.mill, st.mill); fold(m.base, st.mill); for (let k = 0; k < 4; k++) put(c.sail, m.x, m.y + m.h * .12, .1, .5, S.millAngle * .6 + k * TAU / 4); g.fillStyle = Q.millLo; g.beginPath(); g.arc(m.x, m.y + m.h * .12, .7 * u, 0, TAU); g.fill(); g.restore(); }
    S.trees.forEach((t, i) => { if (t.front) return; const spr = c.trees[i]; g.save(); fold(t.y, st.trees[i]); put(spr, t.x, t.y, .5, 1 - 1.4 * u / spr.h2, Math.sin(A * 1.1 + t.ph) * .014); g.restore(); });
    // the chimneys' smoke, and by night the lit windows' glow
    S.houses.forEach((h, i) => { const s = st.houses[i], k = on(clamp((s - .9) / .1)); if (k <= .01) return;
      if (night) { g.save(); fold(h.base, s); for (const w of h.wins) { g.globalAlpha = .5 * k * (.85 + .15 * Math.sin(A * 2.3 + w.ph)); g.drawImage(S.glow, w.x + w.w / 2 - S.glow.width / 2, w.y + w.h / 2 - S.glow.height / 2); } g.restore(); g.globalAlpha = 1; }
      if (!h.chim) return; const ch = h.chim;
      for (let j = 0; j < 3; j++) { const age = ((A * .42 + j / 3 + i * .37) % 1), x = ch.x + age * 4.2 * u + Math.sin(age * 5 + i) * .4 * u, y = ch.top - .3 * u - age * 6.5 * u, sc = .35 + age * .75, a = k * (age < .12 ? age / .12 : 1) * (1 - age) * .55 * S.shade(x, y, 3 * u);
        if (a > .01) put(c.puff, x, y, .5, .7, Math.sin(age * 3 + j) * .3, sc, sc, a); } });
    // the snowman on the near bank of the river, and the front's pines
    if (st.man > .001) { const sm = c.sm, q = c.smq, [mx, my] = EG.smAt, t = T - EGG.tip, lift = env(t, .4, .75, 1.1, 1.45, E.io), reach = env(t, 0, .38, 1.45, 1.85, E.io);
      // his hat, raised off his head and tipped; his hand goes up to its brim, holds it through the bow, and comes down
      const hy = -8.55 * q - lift * .55 * q, rot = -.32 * lift, grip = [Math.cos(rot) * .95 * q, hy + Math.sin(rot) * .95 * q], sh = [1.15 * q, -5.7 * q];
      const rest = [sh[0] + Math.cos(-.62) * 3.2 * q, sh[1] + Math.sin(-.62) * 3.2 * q], hx = lerp(rest[0], grip[0], reach), hy2 = lerp(rest[1], grip[1], reach) - Math.sin(reach * Math.PI) * .6 * q * (1 - lift);
      g.save(); fold(my, st.man); g.translate(mx, my);
      g.save(); g.translate(sh[0], sh[1]); g.rotate(Math.atan2(hy2 - sh[1], hx - sh[0])); g.scale(Math.hypot(hx - sh[0], hy2 - sh[1]) / (3.2 * q), 1); g.drawImage(sm.arm, -.2 * q, -1.1 * q, sm.arm.w2, sm.arm.h2); g.restore();
      g.drawImage(sm, -sm.ox, -sm.oy, sm.w2, sm.h2);
      g.save(); g.translate(0, hy); g.rotate(rot); g.drawImage(sm.hat, -1.8 * q, -2.7 * q, sm.hat.w2, sm.hat.h2); g.restore();
      g.restore(); }
    S.trees.forEach((t, i) => { if (!t.front) return; const spr = c.trees[i]; g.save(); fold(t.y, st.trees[i]); put(spr, t.x, t.y, .5, 1 - 1.4 * u / spr.h2, Math.sin(A * 1.1 + t.ph) * .014); g.restore(); });
    // the snow on the banks catching the light
    for (const s of c.sparks) { const k = Math.pow(Math.max(0, Math.sin(A * s.f * 2 + s.ph)), 12) * on(1); if (k < .05) continue; g.globalAlpha = k; g.drawImage(c.spark, s.x - c.spark.width / 2, s.y - c.spark.height / 2); } g.globalAlpha = 1;
    // the snow: paper flakes from past the top, turning and swaying, gone where they land
    for (const f of plan.flakes) { const k = (T - f.t0) / f.d; if (k <= 0 || k >= 1) continue; const y = lerp(-3 * u, f.y1, k), x = f.x + Math.sin(A * f.sw + f.ph) * f.a + k * f.drift;
      put(c.flakes[f.s], x, y, .5, .5, A * f.rot + f.ph, f.sc, f.sc, (1 - seg(k, .84, 1)) * S.shade(x, y, 2 * u)); }
    // by night the snow is brighter than the town it covers: the words that lie over it (a long list's last lines, the
    // footer's) are put on the night's own ground, softly
    if (night && S.rects) { g.globalAlpha = 1; for (const [x0, y0, x1, y1, kd] of S.rects) if (kd !== 2 && y1 > c.landTop) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(c.nPad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } }
  }
  /** the page turning over: its fold `f` along the fold's normal from the middle of the screen, the roll's radius `rc`.
   *  Page A lies where the leaf has not lifted, page B shows where it has, and between them the leaf: curled over in a
   *  roll at the fold, and beyond it lying back, flat, over page A, its underside up */
  function leaf(f, rc, drawA, drawB) {
    const { W, H } = S, k = TILT, nl = Math.hypot(1, k), nx = 1 / nl, ny = k / nl, ex = -k / nl, ey = 1 / nl, ox = W / 2 + nx * f, oy = H / 2 + ny * f, big = (W + H) * 2;
    const fr = (x, y) => [(x - ox) * nx + (y - oy) * ny, (x - ox) * ex + (y - oy) * ey], page = [[0, 0], [W, 0], [W, H], [0, H]].map(([x, y]) => fr(x, y));
    const frame = () => g.transform(nx, ny, ex, ey, ox, oy), half = (a, b) => { g.beginPath(); g.rect(a, -big, b - a, big * 2); };
    const clipX = (poly, x0) => { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = a[0] >= x0, ib = b[0] >= x0; if (ia) out.push(a); if (ia !== ib) { const t = (x0 - a[0]) / (b[0] - a[0]); out.push([x0, a[1] + (b[1] - a[1]) * t]); } } return out; };
    const pr = Math.PI * rc, flap = clipX(page, pr).map(([x, y]) => [pr - x, y]);
    const lead = night ? [8, 12, 26] : [92, 70, 40], verso = g.createPattern(EG.B.verso, "repeat");
    // page A where it still lies, page B where the leaf has lifted from it
    g.save(); frame(); half(-big, 0); g.restore(); g.save(); g.clip(); drawA(); g.restore();
    g.save(); frame(); half(0, big); g.restore(); g.save(); g.clip(); drawB();
    g.restore();
    g.save(); frame();
    // the leaf's shadow on page B, close under the roll
    { const gr = g.createLinearGradient(rc, 0, rc * 2.6 + 6, 0); gr.addColorStop(0, `rgba(${lead},${night ? .55 : .26})`); gr.addColorStop(1, `rgba(${lead},0)`); g.fillStyle = gr; g.fillRect(rc, -big, rc * 1.6 + 6, big * 2); }
    // the leaf lying back over page A: the paper's underside, its shadow on page A along its edge
    if (flap.length > 2) {
      { const [p1, p2] = [[pr - page[1][0], page[1][1]], [pr - page[2][0], page[2][1]]], dx = p2[0] - p1[0], dy = p2[1] - p1[1], l = Math.hypot(dx, dy) || 1, ox2 = dy / l, oy2 = -dx / l, sw = rc * 1.3 + 6, sgn = ox2 > 0 ? -1 : 1; /* its free edge, the screen's right edge turned over; its shadow falls off it on page A */
        const gx = p1[0] + ox2 * sgn * sw, gy = p1[1] + oy2 * sgn * sw, gr = g.createLinearGradient(p1[0], p1[1], gx, gy); gr.addColorStop(0, `rgba(${lead},${night ? .5 : .24})`); gr.addColorStop(1, `rgba(${lead},0)`);
        g.fillStyle = gr; g.beginPath(); g.moveTo(p1[0] - dx / l * big, p1[1] - dy / l * big); g.lineTo(p2[0] + dx / l * big, p2[1] + dy / l * big); g.lineTo(p2[0] + dx / l * big + ox2 * sgn * sw, p2[1] + dy / l * big + oy2 * sgn * sw); g.lineTo(p1[0] - dx / l * big + ox2 * sgn * sw, p1[1] - dy / l * big + oy2 * sgn * sw); g.closePath(); g.fill(); }
      g.beginPath(); flap.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
      g.fillStyle = verso; g.fill();
      g.strokeStyle = night ? "rgba(150,175,235,.35)" : "rgba(255,255,255,.75)"; g.lineWidth = .9; g.beginPath(); let on = false; for (let i = 0; i <= flap.length; i++) { const [x, y] = flap[i % flap.length]; if (Math.abs(x) < .5 && Math.abs(flap[(i + flap.length - 1) % flap.length][0]) < .5) { on = false; continue; } if (!on) { g.moveTo(x, y); on = true; } else g.lineTo(x, y); } g.stroke(); // its cut edge catching the light
    }
    // the roll at the fold: the underside again, lit along its crown and in shade where it turns away
    if (rc > .5) { g.beginPath(); g.rect(0, -big, rc, big * 2); g.save(); g.clip(); g.fillStyle = verso; g.fillRect(0, -big, rc, big * 2);
      const sheen = night ? "150,178,240" : "255,255,255", gr = g.createLinearGradient(0, 0, rc, 0); /* lit most a third of the way over, where it faces the light, and darker as it turns away */
      gr.addColorStop(0, `rgba(${sheen},0)`); gr.addColorStop(.34, `rgba(${sheen},${night ? .22 : .6})`); gr.addColorStop(.6, `rgba(${sheen},0)`); gr.addColorStop(.82, `rgba(${lead},${night ? .28 : .13})`); gr.addColorStop(1, `rgba(${lead},${night ? .62 : .34})`); g.fillStyle = gr; g.fillRect(0, -big, rc, big * 2); g.restore();
      g.strokeStyle = `rgba(${lead},${night ? .7 : .32})`; g.lineWidth = .9; g.beginPath(); g.moveTo(rc, -big); g.lineTo(rc, big); g.stroke(); }
    g.restore();
  }
  /** where the turn is at loop time T: null while the page lies still */
  function turnAt(T) {
    const a = EGG.turn0, b = EGG.turn1;
    return T > a[0] && T < a[1] ? leafGeo((T - a[0]) / (a[1] - a[0])) : T > b[0] && T < b[1] ? leafGeo(1 - (T - b[0]) / (b[1] - b[0])) : null;
  }
  /** the egg's frame on `g`: summer, the turn, or winter, each over the page the backdrop holds (the winter's is laid in it
   *  from the turn over to the turn back; through the turns the summer's comes from the kept copy). `whole`: draw the
   *  backdrop in too (for the sheet laid over the quiet town while I is short of 1) */
  function eggPic(T, I, A, F, dt, ie, whole) {
    const { W, H } = S, tn = turnAt(T), bd = S.bgx.canvas, srcA = EGbg === "A" ? bd : EG.saved;
    const A1 = () => { if (whole || EGbg !== "A") g.drawImage(srcA, 0, 0, W, H); pageA(T, I, A, F, dt, ie); }, B1 = () => { if (whole) g.drawImage(bd, 0, 0, W, H); pageB(T, I, A); };
    g.save();
    if (tn) leaf(tn.f, tn.rc, A1, B1); else if (EGbg === "B") B1(); else A1();
    g.restore();
  }
  /** the day is done: the finale over the egg as over any pass */
  function eggFinale(F, A) {
    if (F < 0) return; const { H, u, orb } = S;
    if (!night) { for (const c of S.cranes) { const k = clamp((F - c.d) / (1 - c.d)); if (k <= 0 || k >= 1) continue; const e = E.io(k), x = c.x0 + c.dx * e + Math.sin(k * 6 + c.ph) * 2 * u, y = lerp(c.y0, -H * .08, e); put(S.crane[c.c * 2 + Math.floor(A * 8 + c.ph) % 2], x, y, .5, .5, -.25 + Math.sin(k * 5 + c.ph) * .1, c.s, c.s, k < .12 ? k / .12 : k > .86 ? (1 - k) / .14 : 1); } return; }
    const swing = Math.sin(A * .55) * .035, ox = orb.x + Math.sin(swing) * orb.y, oy = Math.cos(swing) * orb.y;
    for (const s of S.fan) { const k = clamp((F - s.lag) / (1 - s.lag)); if (k <= 0 || k >= 1) continue; const e = E.back(Math.min(1, k * 1.6)), x = ox + Math.cos(s.a) * s.d * e, y = oy + Math.sin(s.a) * s.d * e * .75 + (S.pr ? S.orb.r : 0); put(S.fanStars[s.c], x, y, .5, .5, k * 4 + s.a, s.s, s.s, k > .8 ? (1 - k) / .2 : 1); }
  }
  /** (by day) the paper's ground under each line that reaches down over the town, as the scene lays it (b385) */
  function eggPads() { if (night || !S.lines || !S.lines.length) return; g.globalAlpha = 1; for (const [x0, y0, x1, y1] of S.lines) if (y1 > S.townTop) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } }
  /** the egg pass at loop time T: false while the town rests (the scene draws it, and the egg's pieces are made a few a
   *  frame), true when the egg has drawn the frame */
  function eggDraw(T, I, A, F) {
    if (T < EGG.up0 || T > EGG.end || I <= .01) { if (EG) bgSwap("A"); if (T < EGG.up0) eggMake(null); return false; }
    eggMake(T < MIDT ? ["A", "B"] : ["B", "A"]);
    bgSwap(T > EGG.turn0[0] && T < EGG.turn1[1] ? "B" : "A");
    const dt = S.lastA === null ? 0 : clamp(A - S.lastA, 0, .1); S.lastA = A; S.millAngle += dt * (night ? .22 : .42);
    const { W, H } = S, k = clamp(I / .85), ie = k * k * (3 - 2 * k); /* the egg's own strength: whole once I is most of the way up (the stretch's first two seconds), down smoothly from there if the list is touched */
    g.clearRect(0, 0, W, H); g.globalAlpha = 1;
    /* while it is short of whole: before the leaf lifts, what has moved goes only as far as it lets it, so it settles back
       if the list is touched; from the turn on, the egg is laid over the quiet town at its strength, coming in by degrees
       about the turn so nothing jumps */
    EGw = ie < .999 ? lerp(1, ie, seg(T, EGG.turn0[0] - .5, EGG.turn0[0] + .1, E.sine)) : 1;
    if (EGw > .999) eggPic(T, I, A, F, dt, ie, false);
    else { const w = Math.round(W * px), h = Math.round(H * px); if (!EGbuf || EGbuf[0].width !== w || EGbuf[0].height !== h) { EGbuf = canvas(w, h); EGbuf[1].imageSmoothingEnabled = true; }
      const [bc, bx] = EGbuf, g0 = g; bx.setTransform(px, 0, 0, px, 0, 0); bx.clearRect(0, 0, W, H);
      g.drawImage(EGbg === "A" ? S.bgx.canvas : EG.saved, 0, 0, W, H); pageA(T, I, A, F, dt, 0); // the quiet town, whole
      g = bx; try { eggPic(T, I, A, F, 0, ie, true); } finally { g = g0; }
      g.save(); g.globalAlpha = clamp(EGw); g.drawImage(bc, 0, 0, W, H); g.restore(); }
    eggFinale(F, A); eggPads();
    return true;
  }
  return S;
}
