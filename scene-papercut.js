// scene-papercut.js — 1.12 b321: Paper's and Midnight's scene, one pop-up paper town by day and by night (scenes.js
// loads it for either kit and says which). Cut paper: flat shapes in paper colours, each laying a soft shadow on the
// layer behind, a grain over all of it; what never moves is laid down once on the backdrop, and each frame moves only
// the rest. The day's loop, fifteen seconds: a breeze through the trees and the windmill; a paper plane loops the loop
// and leaves a dotted line; a house pops up out of the hill like a page turning; a red kite climbs with its bows
// trailing; paper birds cross the sky as the sun's rays turn a notch; everything folds back down. The night's: the
// windows light across the town; a paper train crosses the bridge, its reflection wobbling in the river; a cloud on a
// wire slides over the moon; cut-paper fireworks in glass colours; a star on a wire; the lights go out again. The
// finales: paper cranes fly up past the sun; a fan of paper stars opens out of the moon.
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

  const S = {
    res: "dpr",
    wash: night ? 1 : 1.6, // a light kit's small words have no room for the picture under them (scenes.js)
    veil: night ? .5 : 1,
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
      // the bridge over the river, and the bank the train runs along
      const b0 = W * (pr ? .2 : .28), b1 = W * (pr ? .54 : .5);
      S.deckY = riverY - 1.5 * u; S.bridge = [b0, b1];
      // trees: lollipops on the hills, each swaying from its foot
      const treeSpr = (s, c) => make(4.6 * u * s + 4 * u, 9 * u * s + 3 * u, x => { const w = 4.6 * u * s, pad = 2 * u; shade(x, 5, -1.2, 2.2); x.fillStyle = P.trunk; x.fillRect(pad + w / 2 - .35 * u, pad + w * .8, .7 * u, 9 * u * s - w * .8); x.fillStyle = c; x.beginPath(); x.arc(pad + w / 2, pad + w / 2, w / 2, 0, TAU); x.fill(); unshade(x); x.fillStyle = "rgba(255,255,255,.14)"; x.beginPath(); x.arc(pad + w * .62, pad + w * .38, w * .22, 0, TAU); x.fill(); });
      S.trees = [];
      const treeAt = (x, yf, s) => { const spr = treeSpr(s, P.tree[S.trees.length % 3]); S.trees.push({ x, y: yf(x) + .5 * u, spr, ph: r() * TAU, s }); };
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
        const hw = 7 * u, hh = 7.4 * u;
        S.pop = { x: W * (pr ? .66 : .41), w: hw, h: hh, spr: make(hw + 3 * u, hh + 3 * u, x => { const o = 1.5 * u; shade(x, 5, -1.4, 2.4); x.fillStyle = P.wall; x.fillRect(o, o + hh * .42, hw, hh * .58); x.fillStyle = P.kite; x.beginPath(); x.moveTo(o - .6 * u, o + hh * .44); x.lineTo(o + hw / 2, o); x.lineTo(o + hw + .6 * u, o + hh * .44); x.closePath(); x.fill(); unshade(x);
          x.fillStyle = P.window; x.beginPath(); x.arc(o + hw / 2, o + hh * .27, hh * .07, 0, TAU); x.fill(); x.fillStyle = P.door; x.fillRect(o + hw * .4, o + hh * .72, hw * .2, hh * .28); x.fillStyle = P.window; x.fillRect(o + hw * .12, o + hh * .6, hw * .16, hh * .14); x.fillRect(o + hw * .72, o + hh * .6, hw * .16, hh * .14); }) };
        S.pop.y = frontY(S.pop.x + hw / 2) + .8 * u;
        S.kite = make(5 * u, 6.4 * u, x => { const w = 5 * u, h = 6.4 * u; shade(x, 4, -1, 2); x.fillStyle = P.kite; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w, h * .38); x.lineTo(w / 2, h); x.lineTo(0, h * .38); x.closePath(); x.fill(); unshade(x); x.fillStyle = P.kiteHi; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w, h * .38); x.lineTo(w / 2, h * .38); x.closePath(); x.fill(); x.beginPath(); x.moveTo(w / 2, h); x.lineTo(0, h * .38); x.lineTo(w / 2, h * .38); x.closePath(); x.fill(); x.strokeStyle = "rgba(255,248,236,.7)"; x.lineWidth = .7; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h * .38); x.lineTo(w, h * .38); x.stroke(); });
        S.bows = P.bow.map(c => make(2.6 * u, 1.6 * u, x => { shade(x, 2, -.5, 1); x.fillStyle = c; x.beginPath(); x.moveTo(0, 0); x.lineTo(1.3 * u, .8 * u); x.lineTo(0, 1.6 * u); x.closePath(); x.moveTo(2.6 * u, 0); x.lineTo(1.3 * u, .8 * u); x.lineTo(2.6 * u, 1.6 * u); x.closePath(); x.fill(); }));
        S.kiteAnchor = pr ? [W * .06, frontY(W * .06)] : [W * .68, townY(W * .68)];
        S.kiteTop = pr ? [W * .15, H * .25] : [W * .75, H * .21];
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
      bg.fillStyle = night ? "#141D35" : "#D2C5A6";
      for (let x = r() * 3 * u; x < W; x += (1.6 + r() * 3.4) * u) { const h = (1.8 + r() * 1.6) * u, y = backY(x) + .6 * u; bg.beginPath(); bg.moveTo(x, y - h); bg.lineTo(x + h * .32, y); bg.lineTo(x - h * .32, y); bg.closePath(); bg.fill(); }
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
      bg.fillStyle = P.riverHi; for (let k = 0; k < (pr ? 6 : 10); k++) { const x = r() * W, y = riverY + riverH * (.25 + r() * .55); bg.globalAlpha = .55; bg.fillRect(x, y, (3 + r() * 6) * u, .35 * u); } bg.globalAlpha = 1;
      { const [b0, b1] = S.bridge, top = S.deckY, n = pr ? 2 : 3, span = (b1 - b0) / n;
        shade(bg, 6, -1.4, 2.6); bg.fillStyle = P.bridge; bg.beginPath(); bg.moveTo(b0 - 2 * u, top); bg.lineTo(b1 + 2 * u, top);
        bg.lineTo(b1 + 2 * u, riverY + riverH * .9);
        for (let k = n - 1; k >= 0; k--) { const a0 = b0 + k * span; bg.lineTo(a0 + span * .92, riverY + riverH * .9); bg.quadraticCurveTo(a0 + span * .5, top + 1.2 * u - (riverH * .3), a0 + span * .08, riverY + riverH * .9); }
        bg.lineTo(b0 - 2 * u, riverY + riverH * .9); bg.closePath(); bg.fill(); unshade(bg);
        bg.fillStyle = night ? "#34426A" : "#F8F0E0"; bg.fillRect(b0 - 2 * u, top, b1 - b0 + 4 * u, .5 * u); }
      band(frontY, P.front, 8);
      // the near hill, its top cut with pinking shears
      { shade(bg, 7, -1.4, 3); bg.fillStyle = P.near; bg.beginPath(); bg.moveTo(0, H); const tooth = 1.2 * u;
        for (let x = 0, k = 0; x <= W + tooth; x += tooth, k++) bg.lineTo(x, nearY(x) - (k % 2 ? 0 : .7 * u)); bg.lineTo(W, H); bg.closePath(); bg.fill(); unshade(bg); }
      // grain, the paper's own
      const tile = grain(140, 140, night ? 29 : 11, P.grainK); bg.fillStyle = bg.createPattern(tile, "repeat"); bg.fillRect(0, 0, W, H);
    },

    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, u, orb } = S;
      g.clearRect(0, 0, W, H);
      const dt = S.lastA === null ? 0 : clamp(A - S.lastA, 0, .1); S.lastA = A;
      const breeze = env(T, .2, .9, 1.7, 3.0, E.sine) * I;
      // the sun or the moon on its thread
      const swing = Math.sin(A * .55) * .035 + breeze * .05 * Math.sin(A * 3.1);
      const top = [orb.x, 0], ox = orb.x + Math.sin(swing) * orb.y, oy = Math.cos(swing) * orb.y;
      g.strokeStyle = P.thread; g.lineWidth = .8; g.beginPath(); g.moveTo(top[0], 0); g.lineTo(ox, oy - orb.r); g.stroke();
      if (!night) {
        const turn = A * .04 + seg(T, 11, 12.7, E.back) * (TAU / 12) * (I > .01 ? 1 : 0); // a notch: twelve rays, so a notch looks like none when the loop comes round
        put(S.sunRays, ox, oy, .5, .5, turn); put(S.sunDisk, ox, oy);
      } else {
        const veiled = env(T, 5.6, 6.5, 7.2, 8.1, E.sine) * I;
        g.globalAlpha = .75 - veiled * .45 + (F >= 0 ? env(F, 0, .2, .7, 1) * .25 : 0); g.drawImage(S.moonGlow, ox - S.moonGlow.width / 2, oy - S.moonGlow.height / 2); g.globalAlpha = 1;
        g.fillStyle = P.moon; g.beginPath(); g.arc(ox, oy, orb.r, 0, TAU); g.fill();
        g.fillStyle = P.moonLo; for (const [cx, cy, cr] of [[-.3, -.2, .22], [.25, .15, .16], [-.05, .38, .12]]) { g.beginPath(); g.arc(ox + cx * orb.r, oy + cy * orb.r, cr * orb.r, 0, TAU); g.fill(); }
        // the stars that twinkle (the rest are pinholes in the backdrop)
        for (const s of S.stars) { if (!s.tw) continue; const a = .35 + .65 * Math.pow(Math.max(0, Math.sin(A * s.f + s.ph)), 3); g.globalAlpha = a; g.fillStyle = P.star; g.beginPath(); g.arc(s.x, s.y, s.s * .7, 0, TAU); g.fill(); } g.globalAlpha = 1;
        // the cloud on its wire that slides over the moon
        const mc = seg(T, 5.3, 8.4, E.sine); if (mc > 0 && mc < 1 && I > .01) { const x = orb.x + lerp(-.42, .42, mc) * W * (S.pr ? .9 : .4); g.globalAlpha = I; g.strokeStyle = P.thread; g.beginPath(); g.moveTo(0, oy - orb.r * .1); g.lineTo(W, oy - orb.r * .1); g.stroke(); put(S.moonCloud, x, oy + orb.r * .2, .5, .5, 0, 1, 1, I); g.globalAlpha = 1; }
      }
      // the clouds on their threads
      for (const c of S.clouds) {
        const a = Math.sin(A * .5 + c.ph) * .03 + breeze * .06 * Math.sin(A * 2.6 + c.ph), x = c.x + Math.sin(a) * c.y, y = Math.cos(a) * c.y;
        g.strokeStyle = P.thread; g.lineWidth = .8; g.beginPath(); g.moveTo(c.x, 0); g.lineTo(x, y - c.spr.h2 * .3); g.stroke();
        put(c.spr, x, y, .5, .2, a * .6);
      }
      // the windmill's sails, turning at their own pace and faster in the breeze
      S.millAngle += dt * ((night ? .22 : .42) + breeze * 1.6);
      { const m = S.mill; for (let k = 0; k < 4; k++) put(S.millSail, m.x, m.y + m.h * .12, .1, .5, S.millAngle + k * TAU / 4); g.fillStyle = P.millLo; g.beginPath(); g.arc(m.x, m.y + m.h * .12, .7 * u, 0, TAU); g.fill(); }
      // the trees, each swaying from its foot
      for (const t of S.trees) put(t.spr, t.x, t.y, .5, 1 - 1.4 * u / t.spr.h2, Math.sin(A * 1.1 + t.ph) * .018 + breeze * .09 * Math.sin(A * 3.4 + t.ph));

      if (!night) {
        // the river glints
        g.fillStyle = "rgba(255,255,255,.7)"; for (const s of S.glints) { const a = Math.pow(Math.max(0, Math.sin(A * s.v * 1.6 + s.ph)), 6); if (a < .05) continue; g.globalAlpha = a; g.fillRect((s.x + A * s.v * 4) % W, s.y, s.w, .3 * u); } g.globalAlpha = 1;
        // the paper plane, its loop and its dotted line
        const pp = seg(T, 2.0, 5.6, E.sine) * (I > .01 ? 1 : 0);
        if (pp > 0 && pp < 1) {
          const path = S.planePath, n = path.length - 1, i = Math.min(n - 1, Math.floor(pp * n)), f = pp * n - i, p = [lerp(path[i][0], path[i + 1][0], f), lerp(path[i][1], path[i + 1][1], f)], ang = Math.atan2(path[i + 1][1] - path[i][1], path[i + 1][0] - path[i][0]);
          const from = Math.max(0, i - Math.floor(n * .34)); g.save(); g.setLineDash([1.1 * u, 1.3 * u]); g.lineWidth = .45 * u; g.strokeStyle = P.trail; g.globalAlpha = I * (1 - seg(pp, .75, 1)); g.beginPath(); g.moveTo(path[from][0], path[from][1]); for (let k = from + 1; k <= i; k++) g.lineTo(path[k][0], path[k][1]); g.lineTo(p[0], p[1]); g.stroke(); g.restore();
          put(S.plane, p[0], p[1], .55, .45, ang, 1, 1, I);
        }
        // the house that pops up out of the hill, and folds away again
        const up = seg(T, 5.0, 6.3, E.back) * (1 - seg(T, 13.3, 14.6, E.in)) * I;
        if (up > .01) { const h = S.pop; g.save(); g.translate(h.x + h.w / 2, h.y); g.scale(1, up); g.drawImage(h.spr, -h.spr.w2 / 2, -h.spr.h2 + 1.5 * u, h.spr.w2, h.spr.h2); g.restore(); }
        // the kite: up from the hill, a while in the wind, down again; its bows follow where it has been
        const kiteAt = t => { const k = seg(t, 8.0, 10.2, E.out) * (1 - seg(t, 13.0, 14.8, E.in)); const [ax, ay] = S.kiteAnchor, [tx, ty] = S.kiteTop; return [lerp(ax, tx, k) + Math.sin(t * 1.7) * 1.4 * u * k, lerp(ay + 2 * u, ty, E.sine(k)) + Math.sin(t * 2.3 + 1) * u * k, k]; };
        const [kx, ky, kk] = kiteAt(T);
        if (kk > .01 && I > .01) {
          const [ax, ay] = S.kiteAnchor; g.globalAlpha = I; g.strokeStyle = "rgba(96,74,50,.45)"; g.lineWidth = .7; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(lerp(ax, kx, .6), lerp(ay, ky, .2) + 6 * u, kx, ky + 3 * u); g.stroke(); g.globalAlpha = 1;
          for (let b = 5; b >= 1; b--) { const [bx, by] = kiteAt(T - b * .13); put(S.bows[b % 2], bx + Math.sin(T * 5 + b) * .8 * u, by + 3.2 * u + b * 1.6 * u, .5, .5, Math.sin(T * 4 + b) * .4, 1, 1, I); }
          put(S.kite, kx, ky, .5, .45, Math.sin(T * 2.1) * .14, 1, 1, I);
        }
        // the paper birds, right to left across the sky
        const fb = seg(T, 10.4, 13.9, x => x) * (I > .01 ? 1 : 0);
        if (fb > 0 && fb < 1) { const lx = lerp(W * 1.1, -W * .15, fb), ly = H * (S.pr ? .1 : .08) + Math.sin(fb * 5) * 2 * u; for (const b of S.flock) put(S.bird[Math.floor(A * 7 + b.ph) % 2], lx + b.dx * -1 + (b.dx < 0 ? -b.dx * .2 : 0) + Math.abs(b.dx) * .9, ly + b.dy, .5, .5, 0, 1, 1, I); }
        // the finale: paper cranes up past the sun
        if (F >= 0) for (const c of S.cranes) { const k = clamp((F - c.d) / (1 - c.d)); if (k <= 0 || k >= 1) continue; const e = E.io(k), x = c.x0 + c.dx * e + Math.sin(k * 6 + c.ph) * 2 * u, y = lerp(c.y0, -H * .08, e); put(S.crane[c.c * 2 + Math.floor(A * 8 + c.ph) % 2], x, y, .5, .5, -.25 + Math.sin(k * 5 + c.ph) * .1, c.s, c.s, k < .12 ? k / .12 : k > .86 ? (1 - k) / .14 : 1); }
      } else {
        // the windows: a few lit always, the rest light across the town and go out again
        for (const w of S.windows) {
          const on = seg(T, .2 + w.o * 1.7, .45 + w.o * 1.7, E.back) * (1 - seg(T, 12.3 + (1 - w.o) * 1.6, 12.55 + (1 - w.o) * 1.6, E.in)) * I;
          const base = w.base ? .82 + .18 * Math.sin(A * w.f + w.ph) : (Math.sin(A * w.f + w.ph) > .985 ? .8 : 0);
          const a = Math.max(base, on); if (a <= .02) continue;
          g.globalAlpha = clamp(a) * .55; g.drawImage(S.glow, w.x + w.w / 2 - S.glow.width / 2, w.y + w.h / 2 - S.glow.height / 2); g.globalAlpha = clamp(a); g.fillStyle = P.lit; g.fillRect(w.x, w.y, w.w, w.h); g.globalAlpha = 1;
        }
        // the moon on the river
        g.fillStyle = P.moon; for (const s of S.moonStrips) { const k = .5 + .5 * Math.sin(A * s.v + s.ph), w = s.w * (.55 + .45 * k); g.globalAlpha = (.06 + .22 * k) * (1 - Math.abs(s.dx) / (4.5 * u)); g.fillRect(orb.x - w / 2 + s.dx + Math.sin(A * .7 + s.ph) * .5 * u, s.y, w, .24 * u); } g.globalAlpha = 1;
        // the train along the bank and over the bridge, its reflection wobbling under it
        const tr = seg(T, 2.4, 6.2, x => x); if (tr > 0 && tr < 1 && I > .01) {
          const cars = [S.engine, S.car, S.car, S.car], L = cars.length * (S.carW + .6 * u), x0 = lerp(-L, W + S.carW, tr);
          cars.forEach((c, k) => { const x = x0 - k * (S.carW + .6 * u), y = S.deckY - c.h2 + u; put(c, x, y, 0, 0, 0, 1, 1, I);
            for (let s = 0; s < 2; s++) { const sh = c.h2 / 2, wob = Math.sin(A * 4 + s * 2.1 + k * .7) * .35 * u; g.save(); g.globalAlpha = .2 * I; g.translate(x + wob, S.riverY + .6 * u + s * sh * .6); g.scale(1, -.6); g.drawImage(c, 0, (1 - s) * sh * px, c.width, sh * px, 0, -sh, c.w2, sh); g.restore(); } });
          g.globalAlpha = .4 * I; g.drawImage(S.glow, x0 + S.carW + u - S.glow.width / 2, S.deckY - S.carH * .5 - S.glow.height / 2); g.globalAlpha = 1;
        }
        // cut-paper fireworks in the colours of glass
        for (const b of S.bursts) {
          const k = (T - b.t) / 1.9; if (k <= 0 || k >= 1 || I < .01) continue;
          if (k < .18) { const q = k / .18; g.globalAlpha = I; g.strokeStyle = P.glass[b.c]; g.lineWidth = .5 * u; g.beginPath(); g.moveTo(b.x, b.y + H * .12 * (1 - q) + 3 * u); g.lineTo(b.x, b.y + H * .12 * (1 - q)); g.stroke(); g.globalAlpha = 1; continue; }
          const q = (k - .18) / .82, a = I * (q < .6 ? 1 : (1 - q) / .4);
          if (q < .25) { g.globalAlpha = (1 - q / .25) * .7 * I; g.drawImage(S.glow, b.x - S.glow.width / 2, b.y - S.glow.height / 2); g.globalAlpha = 1; }
          for (const [ring, n, R, sp] of [[0, b.n, 1, 1], [1, Math.round(b.n * .6), .6, .8]]) {
            const rad = E.out(Math.min(1, q * 1.15 * sp)) * R * S.burstR, fall = q * q * 3.2 * u;
            for (let s = 0; s < n; s++) { const an = (s + ring * .5) / n * TAU + b.c * .7, cx = b.x + Math.cos(an) * rad, cy = b.y + Math.sin(an) * rad + fall;
              g.globalAlpha = a * .35; g.strokeStyle = P.glass[(s + b.c + ring) % P.glass.length]; g.lineWidth = .35 * u; g.beginPath(); g.moveTo(b.x + Math.cos(an) * rad * .45, b.y + Math.sin(an) * rad * .45 + fall * .45); g.lineTo(cx, cy); g.stroke(); g.globalAlpha = 1;
              put(S.shards[(s + b.c + ring) % S.shards.length], cx, cy, .75, .5, an, 1, 1, a); } }
        }
        // the star on its wire
        const ws = seg(T, 10.9, 13.1, E.io); if (ws > 0 && ws < 1 && I > .01) {
          const x0 = -W * .08, y0 = H * (S.pr ? .05 : .04), x1 = W * 1.08, y1 = H * (S.pr ? .3 : .26), wa = env(ws, 0, .15, .85, 1);
          g.globalAlpha = .5 * wa * I; g.strokeStyle = P.thread; g.lineWidth = .7; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
          for (let k = 1; k <= 6; k++) { const q = ws - k * .025; if (q <= 0) continue; g.globalAlpha = (1 - k / 7) * .7 * I; g.fillStyle = "#FFE9A8"; g.beginPath(); g.arc(lerp(x0, x1, q), lerp(y0, y1, q) + Math.sin(k * 2.3) * .6 * u, .35 * u, 0, TAU); g.fill(); }
          g.globalAlpha = 1; put(S.wireStar, lerp(x0, x1, ws), lerp(y0, y1, ws), .5, .5, ws * 7, 1, 1, I);
        }
        // the finale: a fan of paper stars opens out of the moon
        if (F >= 0) for (const s of S.fan) { const k = clamp((F - s.lag) / (1 - s.lag)); if (k <= 0 || k >= 1) continue; const e = E.back(Math.min(1, k * 1.6)), x = ox + Math.cos(s.a) * s.d * e, y = oy + Math.sin(s.a) * s.d * e * .75 + (S.pr ? S.orb.r : 0); put(S.fanStars[s.c], x, y, .5, .5, k * 4 + s.a, s.s, s.s, k > .8 ? (1 - k) / .2 : 1); }
      }
    },
  };
  return S;
}
