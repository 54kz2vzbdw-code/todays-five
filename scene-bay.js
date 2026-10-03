// scene-bay.js — 1.12 b330: Sunset's and Dusk's scene (scenes.js loads it for either kit and says which). One bay, at the
// end of the day and just after it, drawn like a travel poster: flat headlands in layers, palms, still water, a sky in one
// long gradient with a band of halftone where it turns, and grain over all of it. The pad under the list hugs each line
// (scenes.js, `hug`), so the rest of the picture keeps its colour.
// Sunset: a huge sun going down between the headlands, cut into slits that slide, glowing, with rays turning slowly round
// it; its reflection a column of light on the water. The loop, fifteen seconds: the slits quicken and the horizon shimmers;
// a flock crosses the sun; a bank of cloud slides over it and its lower edge catches fire; a sailboat crosses the
// reflection; a flare streaks across as the palms toss; it settles. The finale: fireworks over the bay, and in the water.
// Dusk: the same bay at blue hour, a crescent moon and its path, and paper lanterns lit from inside, rising. The loop: the
// stars prick in; one lantern goes up from the beach, swaying, its light in the water under it; then the whole shore lets
// theirs go, near and far; an egret lifts off the shallows and its rings break the reflections; a star falls; the lanterns
// drift up and away. The finale: the whole festival goes up at once.
// (b347: whatever comes and goes does it whole — the flock off past the right edge, the egret away past one edge and
// home from the other to land in its rings, the loop's new stars gone again before it comes round.)
// 1.12 b384: the forever cycle. The first pass is the loop above, beat for beat; each pass after it deals its own, one
// beat to each of its parts from that part's pool (a pool plays through before any of it comes round again, and never
// the same beat twice running), each with its own side, height, count, colours and timing, so the bay never plays the
// same fifteen seconds twice. At sunset the slits quicken at the start or later; then something in the air: the flock in
// its V either way, a pelican that glides in low and folds and plunges into the sun's path, or a line of flamingos, pink
// with black-tipped wings; something by the sun: the cloud bank from either side, a liner with its portholes lit and its
// smoke trailing or a junk under batten sails the sun shows through, along the horizon across the sun (on a wide screen
// from behind one headland to behind the other), or a jet high up drawing a contrail that glows and spreads; something
// on the water: the sailboat (or two racing), a windsurfer with the sun through its sail, or dolphins leaping through the
// reflection; and to close, the flare as the palms toss, a run of light down the sun's path, or flying fish skimming it.
// At dusk the stars prick in; the lanterns go up from the beach and the whole shore in orange, rose or gold, or from
// both headlands at once, or are set floating on the water to drift and gutter; on the water the egret flies off and
// home, or stands and fishes, or a rowboat comes along the shore under its lantern and puts it up (or rows far out),
// or fireflies blink along the shore; in the sky a star falls, bats flit across the moon, a veil of cloud is drawn
// across it, or a lighthouse out on the point sweeps its beam over the bay. Rare, about once in eight passes each: a
// whale's spout and its flukes out of the sun's path, and a seaplane coming in to land and taxiing away, at sunset; a
// meteor shower, and the shallows glowing blue as the ripples run, at dusk. Everything comes on from past an edge (or
// out of the water, or from behind a headland, or lights) and goes all the way off (or under, or out); nothing carries.
// 1.12 b415: the egg. Every twelfth pass (K.egg), for whoever has left the list alone three minutes. At sunset the sun
// goes all the way down: it slows for its last sliver, which reddens as it nears the sea, and as it slips under, the
// sliver turns green from its top — the green flash — and a lens of green stands a moment on the horizon, a ray straight
// up from it and its light in the water; then the night comes on in a breath, stars and a falling star, and goes again
// through a rose dawn, and the sun comes back up to where it was. At dusk a dragon of paper lanterns, red and gold — the
// festival's dragon dance, flying by itself — rises from behind a headland, skims the bay with its light in the water,
// turns toward us along the near water, climbs the open side of the sky, flies a whole circle hung from the moon (across
// its face) and away past the edge, sparks falling from it, its body rolling over to keep its back to the sky.
// 1.12 b425: the long day's hour eggs. For whoever leaves the list up through a long day: one pass in each hour (K.long)
// plays a film of its own in place of the dealt beats, the kit's two taking turns hour by hour. At sunset, the surfer: a
// set rolls in out of the sun and a surfer paddles out to meet it; the biggest wave of it stands up in front of the sun
// with the light coming through its top, and he springs up and drops in; it peels across the bay with him just ahead of
// the curl — a bottom turn, a snap that throws a fan of gold spray — and the lip throws over him, so that he rides in the
// tube, a shadow behind a curtain of lit water with the sun behind it, until it spits him out in a burst of spray; he
// rides up and over the top against the sky, and the wave closes out behind him and its whitewater rolls in and spreads
// to nothing (The Endless Summer's poster, 1966, had the sun and the surfers). And the balloon: a hot-air balloon comes
// down out of the sky from the right, nearer and nearer, into the sun, which lights its gores like stained glass, until
// its basket touches the water in the sun's path — a splash, rings, its reflection broken under it; the burner roars and
// it glows, someone in the basket waves, and it lifts off dripping and climbs away past the edge it came by, while far off
// a few more of the fiesta drift small across the sun, up from behind one headland and down behind the other. At dusk,
// the fireworks: a slow show over the bay from the far shore — a gold chrysanthemum, peonies that change colour as they
// fall, a palm over the palms, a heart, a ring that frames the moon, and a golden willow that hangs and drips to the
// horizon — each shell opening over a second and drifting as it fades, its smoke left in the sky in halftone, its light
// and its trails in the water; never a flash, and each finds the clearest sky near its place and keeps its size to its
// distance from the words. And the moonrise: the crescent dims away as the sea begins to glow between the headlands, and
// a huge moon rises out of it where the sunset's sun sits, amber, its seas in halftone where they lie on the near side,
// its light a road of broken bars across the bay; a junk under battened sails crosses its face from behind one headland
// to behind the other; then it settles back into the sea, and the crescent is in the sky again. Nothing carries: each
// begins and ends on the bay at rest, and a touch eases it out; a crown's pass (K.long 3) is dealt as it always was.
export default function bay(K, id) {
  const dusk = id === "dusk";
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  const P = dusk
    ? { sky: [[0, "#07061A"], [.34, "#15113D"], [.6, "#2C2364"], [.82, "#654790"], [.94, "#AE709C"], [1, "#DE98A4"]], sea: [[0, "#8C6CA0"], [.22, "#473472"], [.6, "#1C1644"], [1, "#0A0820"]], far: "#3A2C68", near: "#0D0B22", rim: "rgba(190,170,255,.55)", palm: "#0A081A" }
    : { sky: [[0, "#1E0F2E"], [.3, "#4A1846"], [.55, "#9C2A58"], [.74, "#E2544E"], [.9, "#F89B4E"], [1, "#FFC76E"]], sea: [[0, "#F28A4C"], [.2, "#C9445A"], [.58, "#6E1F48"], [1, "#2A0E26"]], far: "#8A2E52", near: "#2A0C22", rim: "rgba(255,170,110,.8)", palm: "#1C0716", sun: [[0, "#FFF7C0"], [.3, "#FFD55E"], [.55, "#FF9C45"], [.8, "#F4584F"], [1, "#D6336A"]] };
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
  const grad = (x, x0, y0, x1, y1, stops) => { const gr = x.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) gr.addColorStop(o, c); return gr; };
  /** a soft glow: a radial gradient of one colour, from `a` at the middle to nothing, `r` CSS pixels across its radius */
  const glow = (r, [cr, cg, cb], a) => make(r * 2, r * 2, x => { const gr = x.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`); gr.addColorStop(.35, `rgba(${cr},${cg},${cb},${a * .45})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`); x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2); });
  /* 1.12 b384, the forever cycle: the plan of the pass that is up, dealt once when it comes up (and again after a layout) */
  let plan = null, gen = 0;
  /** a flat silhouette with the light along its top: the shape once in the rim's colour a hair higher, then itself */
  const sil = (x, path, col, rim, u) => { if (rim) { x.fillStyle = rim; x.save(); x.translate(0, -.16 * u); x.fill(path); x.restore(); } x.fillStyle = col; x.fill(path); };
  /** a path from a list of commands in units of `u`: ["M", x, y], ["L", x, y], ["Q", …], ["C", …], ["E", cx, cy, rx, ry, rotation], ["Z"] */
  const bez = (pts, u) => { const p = new Path2D(); for (const s of pts) { const [c, ...v] = s, a = v.map(n => n * u);
    if (c === "M") p.moveTo(a[0], a[1]); else if (c === "L") p.lineTo(a[0], a[1]); else if (c === "Q") p.quadraticCurveTo(a[0], a[1], a[2], a[3]); else if (c === "C") p.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]);
    else if (c === "E") { p.moveTo(a[0] + a[2] * Math.cos(v[4]), a[1] + a[2] * Math.sin(v[4])); p.ellipse(a[0], a[1], a[2], a[3], v[4], 0, TAU); } else if (c === "Z") p.closePath(); } return p; };

  const S = {
    res: "dpr",
    wash: 1, veil: .66, list: .35, hug: true, // dark kits; the pad hugs the lines, so the list's wash can be light; Everything, a dense list, gets more veil
    bind(ctx) { g = ctx; },
    /** where the words are (scenes.js): the sun slides along the horizon clear of the lines' ends, the fireworks go off in
     *  the clearest sky, and anything bright that passes behind a word fades there */
    words(rects) {
      S.wr = rects.map(([x0, y0, x1, y1]) => [x0 - 12, y0 - 8, x1 + 12, y1 + 8]); S.lines = rects.filter(r => r[4] === 1);
      S.barB = rects.reduce((m, r) => r[4] !== 1 && r[1] < 90 ? Math.max(m, r[3] + 8) : m, 0); /* (b384) the bottom of the bar's words */
      if (!S.W) return;
      const { W, H, hz, pr } = S;
      if (!dusk) { const R = S.sun.R, band = S.wr.filter(([x0, y0, x1, y1]) => y1 > hz - R * 1.05 && y0 < hz && x1 - x0 > 84); /* lines and pills, not a row's small tools */ const xr = band.reduce((m, r) => Math.max(m, r[2]), 0); S.sunTx = clamp(Math.max(pr ? W * .5 : W * .74, xr + R * 1.02), pr ? W * .5 : W * .6, W - R * .45); }
      // the fireworks: the four points of sky furthest from any word, the header and each other
      const pts = []; for (let gy = 1; gy < 9; gy++) for (let gx = 1; gx < 12; gx++) { const x = W * gx / 12, y = H * (.17 + gy / 9 * (hz / H - .3)); pts.push([x, y, S.clear(x, y) ]); }
      const pick = []; for (let k = 0; k < 4; k++) { let best = null, bs = -1; for (const p of pts) { const apart = pick.reduce((m, q) => Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1])), 1e9), sc = Math.min(p[2], 400) + Math.min(apart, W * .3) * .6; if (sc > bs) { bs = sc; best = p; } } pick.push(best); }
      if (S.fire) S.fire.forEach((f, i) => { f.x = pick[i][0]; f.y = pick[i][1]; });
    },
    /** how far (CSS pixels) a point is from the nearest word */
    clear(x, y) { let d = 1e9; for (const [x0, y0, x1, y1] of S.wr || []) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))); return d; },
    /** 1 clear of the words, down to a trace behind them */
    shade(x, y, r) { return lerp(.1, 1, clamp((S.clear(x, y) - r * .5) / (r * 1.2 + 10))); },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, u = Math.sqrt(W * H) / 100, r = rng(61);
      const hz = Math.round(H * (pr ? .73 : .78));
      Object.assign(S, { W, H, pr, u, hz });
      S.sun = pr ? { x: W * .5, y: hz, R: Math.min(W * .3, H * .15) } : { x: W * .72, y: hz, R: Math.min(W * .14, H * .21) };
      { const [r0, g0, b0] = K.rgb(P.near); S.pad = make(160, 80, x => { for (let q = 0; q < 12; q++) { x.fillStyle = `rgba(${r0},${g0},${b0},.15)`; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } }); } /* the shade under a line low on the page */
      S.moon = pr ? { x: W * .76, y: H * .25, r: 3.6 * u } : { x: W * .8, y: H * .2, r: 2.6 * u };
      // the headlands: a far range, hazy, and a near one, dark, each a line of noise falling toward the middle
      const nL = K.noise1(3, 64), nR = K.noise1(5, 64), nF = K.noise1(9, 64);
      const ridge = (n, x0, x1, peak, fall, sc) => { const pts = []; for (let x = x0; x <= x1; x += 4) { const t = clamp((x - x0) / (x1 - x0)), shape = fall < 0 ? Math.pow(1 - t, 1.3) : Math.pow(t, 1.2); pts.push([x, hz - peak * shape * (.82 + .36 * K.fbm(n, x / sc, 3))]); } return pts; };
      S.left = ridge(nL, -8, W * (pr ? .42 : .36), (pr ? 20 : 17) * u, -1, 7 * u);
      S.right = ridge(nR, W * (pr ? .62 : .8), W + 8, (pr ? 17 : 15) * u, 1, 7 * u);
      S.farL = ridge(nF, -8, W * (pr ? .62 : .55), (pr ? 9 : 8) * u, -1, 11 * u);
      S.palms = (pr ? [[.84, 1], [.93, .86]] : [[.9, 1], [.955, .85], [.99, .7]]).map(([f, k], i) => { const x = W * f, top = S.right.reduce((a, p) => Math.abs(p[0] - x) < Math.abs(a[0] - x) ? p : a); return { x, y: top[1] + 1.5 * u, h: (pr ? 21 : 18) * u * k, lean: .42 - i * .3, ph: r() * TAU }; });
      // the backdrop: the sky, halftone where it turns, the far range, the sea, the near headlands with light on their rims, grain
      bg.fillStyle = grad(bg, 0, 0, 0, hz, P.sky); bg.fillRect(0, 0, W, hz);
      bg.fillStyle = grad(bg, 0, hz, 0, H, P.sea); bg.fillRect(0, hz, W, H - hz);
      for (const band of [.55, .74]) { const y0 = hz * band, step = pr ? 5 : 6, col = P.sky.find(([o]) => o >= band)[1]; bg.fillStyle = col; for (let row = 0; row < 5; row++) { const y = y0 - (row + .5) * step, rad = step * .42 * (1 - row / 5); if (rad < .3) continue; for (let x = (row % 2) * step / 2; x < W; x += step) { bg.beginPath(); bg.arc(x, y, rad, 0, TAU); bg.fill(); } } }
      if (dusk) for (let i = 0; i < (pr ? 110 : 220); i++) { const x = r() * W, y = r() * hz * .82, s = .4 + r() * .8; bg.globalAlpha = .15 + r() * .4 * (1 - y / hz); bg.fillStyle = "#EDE6FF"; bg.fillRect(x, y, s, s); } bg.globalAlpha = 1;
      const shape = (pts, col, closeY = hz + 1) => { bg.fillStyle = col; bg.beginPath(); bg.moveTo(pts[0][0], closeY); for (const p of pts) bg.lineTo(p[0], Math.min(closeY, p[1])); bg.lineTo(pts[pts.length - 1][0], closeY); bg.closePath(); bg.fill(); };
      shape(S.farL, P.far);
      for (const pts of [S.left, S.right]) { shape(pts, P.near); bg.strokeStyle = P.rim; bg.lineWidth = 1.2; bg.beginPath(); pts.forEach((p, i) => i ? bg.lineTo(p[0], p[1] + .6) : bg.moveTo(p[0], p[1] + .6)); bg.stroke(); }
      // the headlands in the water, dimmer
      bg.globalAlpha = .38; for (const pts of [S.left, S.right]) { bg.fillStyle = P.near; bg.beginPath(); bg.moveTo(pts[0][0], hz); for (const p of pts) bg.lineTo(p[0], hz + (hz - Math.min(hz, p[1])) * .5); bg.lineTo(pts[pts.length - 1][0], hz); bg.closePath(); bg.fill(); } bg.globalAlpha = 1;
      const tile = K.grain(120, 120, 5, dusk ? .07 : .09); bg.fillStyle = bg.createPattern(tile, "repeat"); bg.fillRect(0, 0, W, H);
      // what moves, made once: glows, the sun's disc, the clouds, the lanterns
      S.glints = Array.from({ length: pr ? 34 : 64 }, () => ({ y: r(), w: .3 + r(), ph: r() * TAU, f: .8 + r() * 1.6, s: r() - .5 }));
      S.sparkles = Array.from({ length: pr ? 26 : 50 }, () => ({ x: r(), y: r(), ph: r() * TAU, f: 1 + r() * 2 }));
      if (!dusk) {
        const { R } = S.sun;
        S.halo = glow(R * 2.4, [255, 150, 90], .55); S.core = glow(R * 1.25, [255, 214, 140], .6);
        S.disc = make(R * 2, R * 2, x => { x.fillStyle = grad(x, 0, 0, 0, R * 2, P.sun); x.beginPath(); x.arc(R, R, R, 0, TAU); x.fill(); const rim = x.createRadialGradient(R, R, R * .78, R, R, R); rim.addColorStop(0, "rgba(255,240,200,0)"); rim.addColorStop(1, "rgba(255,240,200,.45)"); x.fillStyle = rim; x.beginPath(); x.arc(R, R, R, 0, TAU); x.fill(); });
        const cloud = (x0, yf, k, v) => ({ x0: x0 * W, y: hz * yf, w: (pr ? 34 : 30) * u * k, h: (pr ? 3.4 : 2.6) * u * k, v: v * W / 10, lobes: Array.from({ length: 5 }, () => [.1 + r() * .8, .5 + r() * .5]) });
        S.clouds = [cloud(.55, .44, .9, .045), cloud(-.2, .2, 1.1, .03)]; S.hero = cloud(0, 0, 1.25, 0); // the hero crosses the sun in the loop
        S.flock = Array.from({ length: 9 }, (_, i) => ({ dx: -Math.abs(i - 4) * 3.2 * u, dy: (i - 4) * 1.9 * u, ph: r() * TAU, s: .8 + r() * .4 }));
        S.fire = [[.26, .22, 0], [.64, .14, .16], [.45, .3, .32], [.82, .26, .48]].map(([fx, fy, t], i) => ({ x: W * fx, y: H * fy, t, c: i, sparks: Array.from({ length: 44 }, () => ({ a: r() * TAU, v: .55 + r() * .45 })) }));
        S.fireRGB = ["255,214,120", "255,120,150", "255,246,230", "255,160,90"]; S.fireFlash = [[255, 214, 120], [255, 120, 150], [255, 246, 230], [255, 160, 90]].map(c => glow(9 * u, c, .8));
        S.flare = glow(12 * u, [255, 200, 150], .5);
      } else {
        const lr = (pr ? 3.6 : 2.8) * u;
        // a sky lantern: paper, taller than wide, narrower at its open foot where the flame is; lit from inside
        const lantern = () => make(lr * 3.2, lr * 4.2, x => {
          const w = lr * 2, h = lr * 2.7, ox = lr * .6, oy = lr * .6;
          x.save(); x.translate(ox, oy);
          const body = new Path2D(); body.moveTo(w * .08, 0); body.lineTo(w * .92, 0); body.quadraticCurveTo(w, 0, w * .96, h * .12); body.lineTo(w * .8, h); body.lineTo(w * .2, h); body.lineTo(w * .04, h * .12); body.quadraticCurveTo(0, 0, w * .08, 0); body.closePath();
          const gr = x.createRadialGradient(w * .5, h * .95, 0, w * .5, h * .6, h * .95); gr.addColorStop(0, "#FFF6CC"); gr.addColorStop(.35, "#FFC663"); gr.addColorStop(.75, "#F58A3C"); gr.addColorStop(1, "#C5502E");
          x.fillStyle = gr; x.fill(body);
          x.strokeStyle = "rgba(150,60,20,.35)"; x.lineWidth = Math.max(.6, lr * .06); for (const f of [.35, .65]) { x.beginPath(); x.moveTo(w * (.08 + f * .84), 0); x.lineTo(w * (.2 + f * .6), h); x.stroke(); }
          x.fillStyle = "#FFFBEA"; x.beginPath(); x.ellipse(w * .5, h * .93, w * .13, h * .05, 0, 0, TAU); x.fill();
          x.restore();
        });
        S.lantern = lantern(); S.lr = lr; S.lglow = glow(lr * 3.4, [255, 170, 80], .5);
        S.moonGlow = glow(S.moon.r * 6, [200, 190, 255], .35);
        const mr = S.moon.r; S.moonDisc = make(mr * 2 + 2, mr * 2 + 2, x => { x.fillStyle = "#F4EEFF"; x.beginPath(); x.arc(mr + 1, mr + 1, mr, 0, TAU); x.fill(); x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(mr + 1 + mr * .5, mr + 1 - mr * .22, mr * .92, 0, TAU); x.fill(); });
        const pool = (n, d0, d1) => Array.from({ length: n }, () => ({ x: r(), z: d0 + r() * (d1 - d0), ph: r() * TAU, sw: .5 + r() * 1.2, t: r() }));
        S.quietL = pool(pr ? 6 : 9, .2, .7);
        S.cascade = pool(pr ? 22 : 34, .15, 1).map((c, i) => Object.assign(c, { start: 4.6 + (i / (pr ? 22 : 34)) * 3.4 + r() * .4 }));
        S.festival = pool(pr ? 50 : 84, .1, 1).map(c => Object.assign(c, { lag: r() * .35 }));
        S.egret = { x: W * (pr ? .16 : .24), y: hz + (pr ? 8 : 6) * u };
      }
      gen++; extras(W, H, u, pr, hz); /* b384: what the passes after the first bring (nothing here draws on the backdrop) */
    },
    /** a palm frond from the crown `top` at angle `a`, length `L`: an arching spine, with leaflets hanging from it */
    frond(top, a, L) {
      const tip = [top[0] + Math.cos(a) * L, top[1] + Math.sin(a) * L * .55 + L * .26], mid = [(top[0] + tip[0]) / 2, Math.min(top[1], tip[1]) - L * .18];
      g.lineWidth = Math.max(1, L * .045); g.beginPath(); g.moveTo(top[0], top[1]); g.quadraticCurveTo(mid[0], mid[1], tip[0], tip[1]); g.stroke();
      g.beginPath();
      for (let i = 1; i <= 7; i++) { const t = i / 8, x = (1 - t) * (1 - t) * top[0] + 2 * (1 - t) * t * mid[0] + t * t * tip[0], y = (1 - t) * (1 - t) * top[1] + 2 * (1 - t) * t * mid[1] + t * t * tip[1], len = L * .2 * (1 - t * .55), side = Math.cos(a) >= 0 ? 1 : -1;
        g.moveTo(x - side * L * .03, y); g.lineTo(x + side * len * .35, y + len); g.lineTo(x + side * L * .05, y + L * .01); }
      g.fill();
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; pass: which time round
     *  (b384: pass 0 is the loop, the passes after it are dealt) */
    draw(T, I, A, F, pass = 0) {
      const { W, H, u, hz, pr } = S, on = I > .01;
      if (!plan || plan.pass !== pass || plan.gen !== gen) { const hr = K.egg(pass) ? 0 : K.long(pass); plan = K.egg(pass) ? eggPlan(pass) : hr === 1 || hr === 2 ? longPlan(pass, hr) : dusk ? dealDusk(pass) : dealSunset(pass); } /* (b415) the egg's pass deals no beats; (b425) nor does an hour egg's */
      const pl = plan;
      g.clearRect(0, 0, W, H);
      const add = (spr, x, y, a, s = 1) => { if (a <= .005) return; g.globalAlpha = clamp(a); g.drawImage(spr, x - spr.w2 * s / 2, y - spr.h2 * s / 2, spr.w2 * s, spr.h2 * s); };
      if (!dusk) {
        if (S.sunTx !== undefined) { const dt2 = S.lastA === undefined ? 1 : clamp(A - S.lastA, 0, .1); S.sun.x += (S.sunTx - S.sun.x) * (1 - Math.exp(-dt2 * 2)); } // it slides clear of the lines
        const { x: sx, R } = S.sun, ev = pl.egg ? eggSun(T, I) : null, sy = S.sun.y + (ev ? ev.dy : 0), cl = pl.close; /* (b415) the egg: the sun goes down, and up again */
        // rays turning slowly round the sun, only in the sky
        g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip(); g.globalCompositeOperation = "lighter";
        const rot = A * .035, flare = cl.k === "flare" ? env(T, cl.f[0], cl.f[1], cl.f[2], cl.f[3], E.sine) * I : 0;
        const fl2 = pl.pass > 0 ? flare : 0; /* (b384) a dealt pass brightens its rays for the flare apart: not over the bar's words */
        if (!ev || ev.glow > .15) for (let k = 0; k < 14; k++) { const a = rot + k / 14 * TAU, w = .07; g.globalAlpha = (.05 + .05 * (flare - fl2)) * (ev ? ev.glow : 1); g.fillStyle = "#FFB070"; g.beginPath(); g.moveTo(sx, sy); g.arc(sx, sy, Math.max(W, H) * 1.2, a - w, a + w); g.closePath(); g.fill(); }
        if (fl2 > .001) { const b0 = S.barB || 0; if (!S.flareFill || S.flareFill.b !== b0) { const gr = g.createLinearGradient(0, b0, 0, b0 + 70); gr.addColorStop(0, "rgba(255,176,112,0)"); gr.addColorStop(1, "rgba(255,176,112,1)"); S.flareFill = { b: b0, gr }; }
          g.globalAlpha = .05 * fl2; g.fillStyle = S.flareFill.gr; for (let k = 0; k < 14; k++) { const a = rot + k / 14 * TAU, w = .07; g.beginPath(); g.moveTo(sx, sy); g.arc(sx, sy, Math.max(W, H) * 1.2, a - w, a + w); g.closePath(); g.fill(); } }
        add(S.halo, sx, sy, (.85 + .15 * Math.sin(A * .7)) * (ev ? ev.glow : 1)); add(S.core, sx, sy, .9 * (ev ? ev.glow : 1));
        // the disc, and its slits sliding down through the lower half, faster in the loop's first beat
        g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.drawImage(S.disc, sx - R, sy - R, R * 2, R * 2);
        const speed = .16 + env(T, pl.q[0], pl.q[1], pl.q[2], pl.q[3], E.sine) * I * .5; S.slide = (S.slide || 0) + (S.lastA === undefined ? 0 : clamp(A - S.lastA, 0, .1)) * speed; S.lastA = A;
        g.save(); g.beginPath(); g.arc(sx, sy, R + 1, 0, TAU); g.clip(); g.globalCompositeOperation = "destination-out";
        for (let k = 0; k < 9; k++) { const f = (k + (S.slide % 1)) / 8, yy = sy - R * .55 + f * R * .6, h = .6 + f * R * .085; g.fillRect(sx - R - 2, yy, R * 2 + 4, h); }
        g.restore(); g.restore();
        // a shimmer of heat along the horizon
        const heat = (.5 + env(T, pl.h[0], pl.h[1], pl.h[2], pl.h[3], E.sine) * I * .5) * (ev ? ev.vis : 1); g.globalCompositeOperation = "lighter";
        for (let k = 0; k < 4; k++) { const y = hz - (k + 1) * .9 * u, w = R * (1.3 - k * .22); g.globalAlpha = .12 * heat; g.fillStyle = "#FFD08A"; g.fillRect(sx - w + Math.sin(A * 3 + k * 1.7) * 2 * u, y, w * 2, .8); }
        // its reflection: a column of light on the water, bars wider near the horizon and further apart below
        for (const s of S.glints) { const y = hz + 2 + Math.pow(s.y, 1.5) * (H - hz) * .85, spread = R * (1.05 - s.y * .6), k = .5 + .5 * Math.sin(A * s.f + s.ph), w = spread * s.w * (.55 + .45 * k); g.globalAlpha = (.22 + .55 * k) * (1 - s.y * .6) * (ev ? ev.vis : 1); g.fillStyle = s.y < .25 ? "#FFE3A0" : "#FFA864"; g.fillRect(sx - w / 2 + s.s * spread * .5, y, w, 1 + (1 - s.y) * 1.6); }
        for (const p of S.sparkles) { const k = Math.pow(Math.max(0, Math.sin(A * p.f + p.ph)), 8); if (k < .05) continue; const x = p.x * W, y = hz + 4 + p.y * (H - hz) * .9; g.globalAlpha = k * .8 * (ev ? ev.vis : 1); g.fillStyle = "#FFF1D0"; g.fillRect(x - 1, y - .5, 2 + k * 3, 1); }
        if (cl.k === "run") sRun(T, I, cl, sx, R); /* (b384) a run of light down the sun's path */
        g.globalCompositeOperation = "source-over";
        const sn = pl.sun; if (sn.k === "contrail") sContrail(T, I, sn); else if (sn.k === "liner") sLiner(T, I, A, sn); else if (sn.k === "junk") sJunk(T, I, A, sn); /* (b384) high up a jet's contrail; on the horizon a liner, or a junk */
        // the clouds: flat banks, magenta, their undersides catching fire where they cross the sun
        const bank = (c, x0, y, a) => { if (a <= .01) return; const near = clamp(1 - Math.abs(x0 + c.w / 2 - sx) / (R * 2.2)) * clamp(1 - Math.abs(y - sy) / (R * 1.4)); g.globalAlpha = a;
          // three strips, each shorter and further in than the one below it; each lit along its lower edge
          for (const [k, off, dy] of [[1, 0, 0], [.72, .1, -1.05], [.42, .26, -2.1]]) { const w = c.w * k, x = x0 + c.w * off + c.lobes[0][0] * c.h * (k < 1 ? 1 : 0), yy = y + dy * c.h, hh = c.h;
            g.fillStyle = "#6A1F4E"; g.beginPath(); g.roundRect(x, yy - hh / 2, w, hh, hh / 2); g.fill();
            g.fillStyle = `rgba(255,${Math.round(140 + 90 * near)},${Math.round(80 + 70 * near)},${(.35 + .6 * near).toFixed(3)})`; g.beginPath(); g.roundRect(x + hh * .3, yy + hh * .18, w - hh * .6, hh * .32, hh * .16); g.fill(); } };
        for (const c of S.clouds) bank(c, ((c.x0 + A * c.v) % (W + c.w * 2)) - c.w, c.y, 1);
        if (sn.k === "cloud" && !sn.full) { const across = seg(T, sn.a[0], sn.a[1], E.io); if (on && across > 0 && across < 1) bank(S.hero, lerp(sx - R * 2.4 - S.hero.w, sx + R * 1.6, across), sy - R * sn.y, I * env(across, 0, .12, .88, 1)); }
        else if (sn.k === "cloud") { const across = seg(T, sn.a[0], sn.a[1], x => x), w = S.hero.w + 2 * u; if (on && across > 0 && across < 1) bank(S.hero, sn.dir > 0 ? lerp(-w, W + 2 * u, across) : lerp(W + 2 * u, -w, across), sy - R * sn.y, I); } /* (b384) the whole way across, at a steady drift */
        g.globalAlpha = 1;
        // in the air: a flock across the sun (b384: or a pelican, flamingos, a seaplane)
        const sk = pl.sky; if (sk.k === "flock") sFlock(T, I, A, sk, sy, R); else if (sk.k === "pelican") sPelican(T, I, A, sk); else if (sk.k === "flamingos") sFlamingos(T, I, A, sk); else sSeaplane(T, I, A, sk);
        // on the water: a sailboat across the reflection (b384: or two, a windsurfer, dolphins, the whale)
        const wt = pl.water; if (wt.k === "sail") for (const b of wt.boats) sSail(T, I, b); else if (wt.k === "windsurf") sWindsurf(T, I, A, wt); else if (wt.k === "dolphins") sDolphins(T, I, A, wt); else if (wt.k === "whale") sWhale(T, I, A, wt);
        if (cl.k === "fish") sFish(T, I, A, cl); /* (b384) flying fish skimming the sun's path */
        if (ev) eggSunset(T, I, A, ev, sx, sy, R); /* (b415) the egg: the dusk coming on, the green flash, the stars */
        if (pl.long === 1) lSurf(T, I, A, pl, sx, sy, R); else if (pl.long === 2) lBalloon(T, I, A, pl, sx, sy, R); /* (b425) the hour eggs, under the finale */
        // a flare streaking across, and the ghosts it leaves
        if (flare > .01) { g.globalCompositeOperation = "lighter"; const fx = lerp(sx - R * 3, sx + R * 3, seg(T, cl.fx[0], cl.fx[1], E.io)); g.globalAlpha = flare * .5; g.fillStyle = "#FFD6A0"; g.fillRect(0, sy - R * .08, W, 1.4); add(S.flare, sx, sy - R * .05, flare * .7, 1.6); for (const [k, s2] of [[.4, .5], [.8, .8], [1.3, .35]]) add(S.flare, lerp(sx, W - fx, k), lerp(sy, H * .3, k), flare * .35, s2); g.globalCompositeOperation = "source-over"; }
        // the finale: fireworks over the bay, and in the water
        // crisp sparks streaking out with hot heads, a flash where each bursts, and all of it again, dimmer, in the water
        if (F >= 0) { g.globalCompositeOperation = "lighter"; g.lineCap = "round";
          for (const f of S.fire) { const k = clamp((F - f.t) / .5); if (k <= 0 || k >= 1) continue; const rad = E.out(k) * Math.min((pr ? 21 : 16) * u, Math.max(40, S.clear(f.x, f.y) * .9)), a = k < .55 ? 1 : (1 - k) / .45, drop = k * k * 6 * u;
            if (k < .2) add(S.fireFlash[f.c], f.x, f.y, (1 - k / .2) * .9, .7 + k * 2);
            for (const [mirror, am] of [[false, 1], [true, .28]]) {
              const Y = y => mirror ? hz + (hz - y) * .38 : y; if (mirror && f.y > hz) continue;
              g.strokeStyle = `rgba(${S.fireRGB[f.c]},${(a * am).toFixed(3)})`; g.lineWidth = mirror ? 1 : 1.7; g.beginPath();
              for (const sp of f.sparks) { const d = rad * sp.v, d0 = Math.max(0, d - rad * .3), c = Math.cos(sp.a), s2 = Math.sin(sp.a), hx = f.x + c * d, hy = f.y + s2 * d + drop; if (!mirror && S.shade(hx, hy, 6) < .5) continue; g.moveTo(f.x + c * d0, Y(f.y + s2 * d0 + drop * .6)); g.lineTo(hx, Y(hy)); }
              g.stroke();
              if (!mirror) { g.fillStyle = `rgba(255,250,236,${a.toFixed(3)})`; for (const sp of f.sparks) { const d = rad * sp.v, hx = f.x + Math.cos(sp.a) * d, hy = f.y + Math.sin(sp.a) * d + drop; if (S.shade(hx, hy, 6) < .5) continue; g.fillRect(hx - 1.2, hy - 1.2, 2.4, 2.4); } }
            } }
          g.globalCompositeOperation = "source-over"; }
        // the palms, their fronds in the breeze; a gust as the flare passes
        const gust = cl.k === "flare" ? env(T, cl.g[0], cl.g[1], cl.g[2], cl.g[3], E.sine) * I : 0; g.globalAlpha = 1; g.fillStyle = g.strokeStyle = P.palm;
        for (const p of S.palms) { const top = [p.x + p.lean * p.h * .45, p.y - p.h]; g.lineWidth = 1.1 * u; g.lineCap = "round"; g.beginPath(); g.moveTo(p.x, p.y); g.quadraticCurveTo(p.x + p.lean * p.h * .05, p.y - p.h * .5, top[0], top[1]); g.stroke();
          for (let k = 0; k < 8; k++) S.frond(top, -Math.PI * .98 + k / 7 * Math.PI * .96 + Math.sin(A * 1.1 + p.ph + k) * .05 + gust * .25 * Math.sin(A * 6 + k), p.h * (.44 + (k % 2) * .08)); }
      } else {
        // the stars that twinkle, pricking in at the loop's start
        const pk = pl.prick, prick = seg(T, pk[0], pk[1], x => x) * I * (1 - seg(T, pk[2], pk[3], E.sine)); /* the new ones gone again before the loop comes round */
        g.fillStyle = "#F4F0FF"; for (const p of S.sparkles) { const shown = p.ph < 3.6 ? 1 : clamp((3.6 + prick * 2.7 - p.ph) / .35); if (shown <= 0) continue; const k = .35 + .65 * Math.pow(Math.max(0, Math.sin(A * p.f + p.ph)), 3); const x = p.x * W, y = H * .09 + p.y * (hz * .75 - H * .09), s = 1 + (p.f > 2.4 ? 1 : 0); g.globalAlpha = k * shown * S.shade(x, y, 4); g.fillRect(x, y, s, s); }
        // the moon, a crescent with its halo, and its path on the water
        const { x: mx, y: my, r: mr } = S.moon; if (pl.long === 2) lMoon(T, I, A, pl); else { g.globalCompositeOperation = "lighter"; add(S.moonGlow, mx, my, .8); g.globalCompositeOperation = "source-over"; /* (b425) the moonrise draws the moon itself */
        g.globalAlpha = 1; g.drawImage(S.moonDisc, mx - mr - 1, my - mr - 1, S.moonDisc.w2, S.moonDisc.h2);
        g.globalCompositeOperation = "lighter"; for (const s of S.glints) { const y = hz + 2 + Math.pow(s.y, 1.3) * (H - hz) * .85, k = .5 + .5 * Math.sin(A * s.f + s.ph), w = (4 + s.w * 9) * u * (1 - s.y * .5) * k; g.globalAlpha = (.12 + .2 * k) * (1 - s.y * .5); g.fillStyle = "#CFC6FF"; g.fillRect(mx - w / 2 + s.s * 5 * u, y, w, .9); } }
        if (pl.long === 1) lFireworks(T, I, A, pl); /* (b425) the fireworks, over the bay and in it */
        const sk = pl.sky, wt = pl.water, hd = pl.head;
        if (wt.k === "glow") dGlow(T, I, A, wt); /* (b384) the shallows glowing blue */
        if (sk.k === "beam") dBeam(T, I, A, sk); /* (b384) a lighthouse's beam over the bay */
        // a star falls (b384: from either side; or a shower of them)
        if (sk.k === "fall") { const fall = seg(T, sk.t[0], sk.t[1], E.in) * I; if (fall > 0 && fall < 1) { const x = lerp(W * sk.x[0], W * sk.x[1], fall), y = lerp(H * sk.y[0], H * sk.y[1], fall), fa = S.shade(x, y, 14 * u), tx = sk.x[1] > sk.x[0] ? -14 * u : 14 * u; const gr = g.createLinearGradient(x, y, x + tx, y - 7 * u); gr.addColorStop(0, `rgba(255,255,255,${(.9 * (1 - fall) * fa).toFixed(3)})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.globalAlpha = 1; g.strokeStyle = gr; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + tx, y - 7 * u); g.stroke(); } }
        else if (sk.k === "meteors") dMeteors(T, I, sk);
        g.globalCompositeOperation = "source-over";
        if (sk.k === "bats") dBats(T, I, A, sk); else if (sk.k === "veil") dVeil(T, I, A, sk); /* (b384) bats, or a veil of cloud, across the moon */
        // lanterns: a few far ones always, one from the beach, the whole shore's, the festival's; each with its light in the water
        const lant = (xn, rise, z, sw, ph, a, spr = S.lantern, glw = S.lglow, rc = "#FFB45C", drift = 0) => {
          if (a <= .01) return; const s = lerp(.35, 1.45, z), x = xn * W + Math.sin(A * .9 * sw + ph) * 1.6 * u * s + drift * rise * W, y = lerp(hz - 1.4 * u, H * .1, rise), flick = .88 + .12 * Math.sin(A * 13 + ph * 3) * Math.sin(A * 7.3 + ph);
          a *= S.shade(x, y, S.lr * s * 3.4) * (1 - clamp((H * .32 - y) / (H * .14))); if (a <= .01) return; // it fades as its glow nears a word; it's gone well before the header
          g.globalCompositeOperation = "lighter"; add(glw, x, y, a * .75 * flick, s); g.globalCompositeOperation = "source-over"; add(spr, x, y, a * clamp(1.2 - z * .2), s);
          if (y < hz && rise < .45) { g.globalCompositeOperation = "lighter"; g.globalAlpha = a * .35 * (1 - rise / .45) * flick; g.fillStyle = rc; const ry = hz + (hz - y) * .45, rw = S.lr * s * 1.1; g.fillRect(x - rw / 2 + Math.sin(A * 3 + ph) * u * .6, ry, rw, 1.2 + s); g.fillRect(x - rw * .3, ry + 3 * s, rw * .6, 1); g.globalCompositeOperation = "source-over"; }
        };
        for (const q of S.quietL) { const rq = (q.t + A * .006 * (1 + q.z)) % 1 * .75 + .15; lant(q.x, rq, q.z * .6, q.sw, q.ph, .85 * clamp((rq - .15) / .09)); } /* each fades in as it leaves the water */
        if (hd.first) { const L = S.lcols[hd.first.c]; const first = seg(T, hd.first.t0, hd.first.t1, E.sine); if (on && first > 0 && first < 1) lant(hd.first.x, first, .95, 1, 0, I * (1 - seg(first, .85, 1)) * clamp(first * 12), L[0], L[1], L[2]); }
        if (hd.casc) for (const c of hd.casc) { const k = seg(T, c.start, c.start + 6.5, E.sine); if (!on || k <= 0 || k >= 1) continue; const L = S.lcols[c.c || 0]; lant(c.x, k, c.z, c.sw, c.ph, I * (1 - seg(k, .82, 1)) * clamp(k * 14), L[0], L[1], L[2], c.dx || 0); }
        if (hd.k === "flotilla") dFlotilla(T, I, A, hd); /* (b384) lanterns set floating on the water */
        if (wt.k === "row" && wt.far) dRow(T, I, A, wt); /* (b384) a rowboat far out on the bay, behind the egret */
        if (pl.egg) eggDragon(T, I, A); /* (b415) the egg: the lantern dragon */
        if (F >= 0) for (const f of S.festival) { const k = clamp((F - f.lag) / (1 - f.lag)); if (k <= 0 || k >= 1) continue; lant(f.x, E.sine(k), f.z, f.sw, f.ph, clamp(k * 10) * (1 - seg(k, .8, 1))); }
        // the egret: standing in the shallows, then up and away, its rings spreading (b384: or it stands and fishes)
        const es = u * (pr ? 1.15 : .95), x0 = S.egret.x, y0 = S.egret.y, fly = wt.k === "egret" || !!wt.flush, away = fly ? seg(T, wt.away[0], wt.away[1], E.in) : 0, home = fly ? seg(T, wt.home[0], wt.home[1], E.out) : 0;
        let ex = x0, ey = y0, up = 0; /* up: 0 standing … 1 in the air */
        if (home > 0) { ex = lerp(-10 * es, x0, home); ey = y0 - (1 - home) * H * .2 - Math.sin(home * Math.PI) * H * .03; up = 1 - seg(home, .85, 1); }
        else if (away > 0) { ex = lerp(x0, W + 10 * es, away); ey = y0 - Math.sin(away * Math.PI / 2) * H * .28; up = away >= 1 ? 2 : 1; }
        ex = lerp(x0, ex, I); ey = lerp(y0, ey, I); if (I < .99 && up === 2) up = 1; /* touched, it settles back where it stands */
        const flap = up > 0 && up <= 1 ? Math.sin(A * 9) * (home > 0 ? 1 - home * .6 : 1) : 0, nk = wt.k === "fishing" ? env(T, wt.ts, wt.ts + .22, wt.ts + .5, wt.ts + 1.05, E.io) * I : 0; /* nk: its neck down to the water */
        if (up < 2) { g.globalAlpha = S.shade(ex, ey, 8 * es); g.fillStyle = "#EFE8FF"; g.beginPath(); g.ellipse(ex, ey, 2.4 * es, 1 * es, -.2, 0, TAU); g.fill(); g.strokeStyle = "#EFE8FF"; g.lineWidth = .55 * es; g.beginPath(); g.moveTo(ex + 1.8 * es, ey - .4 * es); g.quadraticCurveTo(ex + (2.6 + .9 * nk) * es, ey - (3.4 - 3.0 * nk) * es, ex + (3.4 + .6 * nk) * es, ey - (3.2 - 5.4 * nk) * es); g.stroke();
          if (up > 0) { g.beginPath(); g.moveTo(ex - 1.5 * es, ey); g.quadraticCurveTo(ex - 3 * es, ey - 3.2 * es * flap, ex - 6 * es, ey - 4.4 * es * flap); g.quadraticCurveTo(ex - 2 * es, ey - .5 * es, ex, ey); g.fill(); }
          else { g.strokeStyle = "#CFC5E6"; g.lineWidth = .3 * es; g.beginPath(); g.moveTo(ex, ey + .8 * es); g.lineTo(ex, ey + 3 * es); g.stroke(); } }
        if (wt.k === "fishing") dCatch(T, I, A, wt, ex, ey, es);
        const land = fly ? seg(T, wt.land[0], wt.land[1], E.out) * I : 0; if (land > 0 && land < 1) for (let k = 0; k < 2; k++) { const q = clamp(land * 1.2 - k * .2); if (q <= 0) continue; g.globalAlpha = (1 - q) * .4; g.strokeStyle = "#C4B4E8"; g.lineWidth = .7; g.beginPath(); g.ellipse(x0, y0 + 3 * es, q * 11 * u, q * 2 * u, 0, 0, TAU); g.stroke(); } /* a ring or two as it lands */
        const rip = fly ? seg(T, wt.rip[0], wt.rip[1], E.out) * I : 0; if (rip > 0 && rip < 1) for (let k = 0; k < 3; k++) { const q = clamp(rip * 1.3 - k * .15); if (q <= 0) continue; g.globalAlpha = (1 - q) * .55; g.strokeStyle = "#C4B4E8"; g.lineWidth = .8; g.beginPath(); g.ellipse(S.egret.x, S.egret.y + 3 * es, q * 18 * u, q * 3 * u, 0, 0, TAU); g.stroke(); }
        if (wt.k === "row" && !wt.far) dRow(T, I, A, wt); /* (b384) a rowboat under its lantern, nearer than the egret's shallows */
        if (wt.k === "fireflies") dFireflies(T, I, A, wt); /* (b384) fireflies along the shore */
        // the palms, dark against the last light
        g.globalAlpha = 1; g.fillStyle = g.strokeStyle = P.palm;
        for (const p of S.palms) { const top = [p.x + p.lean * p.h * .45, p.y - p.h]; g.lineWidth = 1.1 * u; g.lineCap = "round"; g.beginPath(); g.moveTo(p.x, p.y); g.quadraticCurveTo(p.x + p.lean * p.h * .05, p.y - p.h * .5, top[0], top[1]); g.stroke();
          for (let k = 0; k < 8; k++) S.frond(top, -Math.PI * .98 + k / 7 * Math.PI * .96 + Math.sin(A * .9 + p.ph + k) * .04, p.h * (.44 + (k % 2) * .08)); }
      }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      // 1.12 b348: a long list's last lines lie over the brightest part of the picture — the sun on the horizon, its
      // reflection, the moon's path — and on a narrow screen the sun has nowhere clear of them to go; there the picture
      // is put in shade under each line (the stage lays its pad over this), and elsewhere it keeps its colour
      const lowY = S.hz - (S.pr ? S.H * .12 : S.H * .14); g.globalAlpha = .8;
      for (const [x0, y0, x1, y1] of S.lines || []) if (y1 > lowY) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); }
      g.globalAlpha = 1;
    },
  };

  /* ---------------- 1.12 b384: the forever cycle ---------------- */
  /** a sprite at (x, y), anchored at (ax, ay) of its size, turned and scaled */
  const stamp = (spr, x, y, ax, ay, rot, sx, sy, a) => { if (a <= .005) return; g.save(); g.globalAlpha = clamp(a); g.translate(x, y); if (rot) g.rotate(rot); g.scale(sx, sy); g.drawImage(spr, -spr.w2 * ax, -spr.h2 * ay, spr.w2, spr.h2); g.restore(); };
  /** what only the passes after the first bring, made once at layout (nothing here touches the backdrop or the first
   *  pass's dice) */
  function extras(W, H, u, pr, hz) {
    const dark = P.palm, rim = P.rim;
    const shape = (w, h, ox, oy, fn) => { const s = make(w * u, h * u, x => { x.translate(ox * u, oy * u); fn(x); }); s.ox = ox / w; s.oy = oy / h; return s; };
    if (!dusk) {
      // the headlands and their reflections, which what sails along the horizon passes behind
      { const c = new Path2D(); c.rect(-20, -20, W + 40, H + 40); for (const pts of [S.left, S.right]) { c.moveTo(pts[0][0], hz + 1); for (const p of pts) c.lineTo(p[0], Math.min(hz + 1, p[1])); c.lineTo(pts[pts.length - 1][0], hz + 1); c.closePath(); c.moveTo(pts[0][0], hz); for (const p of pts) c.lineTo(p[0], hz + (hz - Math.min(hz, p[1])) * .5); c.lineTo(pts[pts.length - 1][0], hz); c.closePath(); } S.headClip = c; }
      // a pelican (facing right): gliding, wings up, folded for the dive
      const pBody = [["E", 0, 0, 1.9, .78, -.06], ["M", 1.2, -.5], ["Q", 1.8, -1.05, 2.3, -.95], ["Q", 2.8, -.9, 2.75, -.45], ["L", 1.5, .1], ["Z"], ["M", 2.45, -.95], ["L", 5.0, -.5], ["L", 5.05, -.36], ["Q", 3.9, .3, 2.55, -.3], ["Z"], ["M", -1.7, -.25], ["L", -2.8, -.42], ["L", -2.7, .12], ["L", -1.7, .25], ["Z"]];
      const pWing = [[["M", .9, -.55], ["Q", -1.4, -1.9, -4.9, -1.45], ["L", -5.4, -1.2], ["L", -4.9, -1.02], ["L", -5.25, -.78], ["L", -4.7, -.66], ["L", -4.95, -.42], ["Q", -2.2, -.2, -.5, .1], ["Z"]],
        [["M", .8, -.6], ["Q", -.4, -2.8, -2.4, -4.6], ["L", -2.9, -4.4], ["L", -2.6, -3.9], ["L", -3.2, -3.7], ["L", -2.8, -3.2], ["L", -3.3, -2.9], ["Q", -2.2, -1.1, -.7, .05], ["Z"]],
        [["M", .9, -.45], ["Q", -1.1, -1.05, -3.6, -.62], ["L", -3.8, -.3], ["Q", -1.6, .15, -.4, .2], ["Z"]]];
      S.pel = pWing.map(wing => shape(12, 8, 6.2, 4.8, x => { const p = bez(pBody, u); const w2 = bez(wing, u); p.addPath(w2); sil(x, p, dark, rim, u); }));
      // flamingos (facing right), pink with black flight feathers: wings up, wings down
      S.flam = [0, 1].map(f => shape(10, 6, 5.2, 3, x => { const pink = "#F4879F", deep = "#D9607E";
        x.strokeStyle = deep; x.lineCap = "round"; x.lineWidth = .14 * u; x.beginPath(); x.moveTo(-.9 * u, .15 * u); x.lineTo(-4.4 * u, .42 * u); x.moveTo(-.9 * u, .28 * u); x.lineTo(-4.3 * u, .66 * u); x.stroke(); // legs trailing
        x.strokeStyle = pink; x.lineWidth = .3 * u; x.beginPath(); x.moveTo(.9 * u, -.12 * u); x.quadraticCurveTo(2.2 * u, -.2 * u, 3.4 * u, -.42 * u); x.stroke(); // the neck
        x.fillStyle = pink; x.beginPath(); x.arc(3.55 * u, -.45 * u, .28 * u, 0, TAU); x.fill(); x.fillStyle = "#1C0716"; x.beginPath(); x.moveTo(3.7 * u, -.58 * u); x.quadraticCurveTo(4.3 * u, -.55 * u, 4.35 * u, -.12 * u); x.quadraticCurveTo(4.05 * u, -.3 * u, 3.72 * u, -.3 * u); x.closePath(); x.fill(); // the head, its bent black bill
        x.fillStyle = pink; x.beginPath(); x.ellipse(0, 0, 1.25 * u, .55 * u, -.05, 0, TAU); x.fill();
        const tip = f ? [-.9, 2.4] : [-1.1, -2.6], wing = new Path2D(); wing.moveTo(.4 * u, -.25 * u); wing.quadraticCurveTo(-.1 * u, tip[1] * .55 * u, tip[0] * u, tip[1] * u); wing.quadraticCurveTo(-1.2 * u, tip[1] * .45 * u, -.9 * u, 0); wing.closePath();
        x.fillStyle = pink; x.fill(wing); x.save(); x.clip(wing); x.fillStyle = "#1C0716"; x.beginPath(); x.rect(-3 * u, f ? 1.1 * u : -4 * u, 6 * u, 2.9 * u); x.fill(); x.restore(); // its wing, the outer half black
        x.fillStyle = "rgba(255,210,220,.45)"; x.beginPath(); x.ellipse(.2 * u, -.2 * u, .8 * u, .2 * u, -.05, 0, TAU); x.fill(); }));
      // a liner (facing left): hull, decks, three raked funnels with their bands, masts, rows of lit portholes
      S.liner = shape(18, 7.5, 8.6, 6.2, x => { const hull = bez([["M", -7.0, 0], ["L", -7.7, -1.6], ["L", 6.3, -1.3], ["Q", 7.5, -1.25, 7.35, -.55], ["L", 6.6, 0], ["Z"]], u), deck = bez([["M", -4.7, -1.4], ["L", -4.7, -2.3], ["L", 4.6, -2.3], ["L", 4.6, -1.3], ["Z"], ["M", -3.4, -2.3], ["L", -3.4, -3.05], ["L", 3.1, -3.05], ["L", 3.1, -2.3], ["Z"], ["M", -4.5, -2.3], ["L", -4.5, -3.55], ["L", -3.2, -3.55], ["L", -3.2, -2.3], ["Z"]], u);
        const col = "#3A1030"; hull.addPath(deck); for (const fx of [-1.9, .5, 2.9]) hull.addPath(bez([["M", fx - .48, -3.05], ["L", fx + .48, -3.05], ["L", fx + .8, -5.1], ["L", fx - .12, -5.1], ["Z"]], u)); sil(x, hull, col, rim, u);
        x.fillStyle = "#E2544E"; for (const fx of [-1.9, .5, 2.9]) { x.beginPath(); x.moveTo((fx - .3) * u, -4.1 * u); x.lineTo((fx + .63) * u, -4.1 * u); x.lineTo((fx + .7) * u, -4.55 * u); x.lineTo((fx - .22) * u, -4.55 * u); x.closePath(); x.fill(); } // the funnels' red bands, catching the light
        x.strokeStyle = col; x.lineWidth = .12 * u; x.beginPath(); x.moveTo(-5.9 * u, -1.5 * u); x.lineTo(-5.7 * u, -5.6 * u); x.moveTo(5.3 * u, -1.3 * u); x.lineTo(5.1 * u, -5.1 * u); x.stroke(); x.lineWidth = .04 * u; x.beginPath(); x.moveTo(-7.6 * u, -1.6 * u); x.lineTo(-5.7 * u, -5.6 * u); x.lineTo(-1.9 * u, -5.1 * u); x.moveTo(2.9 * u, -5.1 * u); x.lineTo(5.1 * u, -5.1 * u); x.lineTo(7.2 * u, -1.3 * u); x.stroke(); // masts and rigging
        x.fillStyle = "#FFD08A"; for (let k = 0; k < 20; k++) x.fillRect((-6.2 + k * .65) * u, -.85 * u, .16 * u, .14 * u); for (let k = 0; k < 13; k++) x.fillRect((-4.3 + k * .7) * u, -1.95 * u, .2 * u, .16 * u); for (let k = 0; k < 8; k++) x.fillRect((-3.0 + k * .78) * u, -2.75 * u, .2 * u, .15 * u); }); // its portholes, lit
      S.liner.funnels = [[-1.6, -5.1], [.8, -5.1], [3.2, -5.1]];
      // a junk (facing left): its high stern, three masts, lug sails stiffened with battens that the low sun shows through
      S.junk = shape(15, 11.5, 7, 10.4, x => { const col = "#34102C", p = bez([["M", -6.4, -1.05], ["L", -5.5, 0], ["L", 4.5, 0], ["L", 5.9, -1.3], ["L", 6.3, -2.4], ["L", 4.3, -1.7], ["L", -4.2, -1.35], ["Z"]], u);
        const sails = [[-3.0, 7.0, 2.6], [.5, 9.2, 3.1], [3.7, 6.2, 2.3]];
        for (const [mx, h, w] of sails) p.addPath(bez([["M", mx - .15, -1.3], ["L", mx - .15, -h - .4], ["L", mx + .1, -h - .4], ["L", mx + .1, -1.3], ["Z"], ["M", mx - .5, -h], ["L", mx + w, -h + .9], ["Q", mx + w * 1.35, -h * .55, mx + w * 1.12, -1.9], ["L", mx - .4, -1.95], ["Z"]], u));
        p.addPath(bez([["M", .6, -9.6], ["L", 1.9, -9.25], ["L", .6, -8.9], ["Z"]], u)); sil(x, p, col, rim, u);
        x.strokeStyle = "rgba(255,170,110,.55)"; x.lineWidth = .07 * u; for (const [mx, h, w] of sails) for (let k = 1; k < 7; k++) { const f = k / 7, yy = lerp(-h + .45, -1.95, f); x.beginPath(); x.moveTo((mx - .45) * u, yy * u); x.lineTo((mx + w * (1.02 + .25 * Math.sin(f * Math.PI))) * u, (yy + .45 * (1 - f)) * u); x.stroke(); } // its battens
        x.fillStyle = "#FFD08A"; for (let k = 0; k < 3; k++) x.fillRect((4.2 + k * .45) * u, -1.55 * u, .18 * u, .14 * u); }); // lanterns at the stern
      S.flyfish = shape(4, 2, 2, 1, x => sil(x, bez([["M", 1.4, 0], ["Q", .6, -.28, -.9, -.12], ["L", -1.5, -.45], ["L", -1.35, 0], ["L", -1.5, .4], ["L", -.9, .12], ["Q", .6, .25, 1.4, 0], ["Z"], ["M", .5, -.1], ["L", -.4, -.95], ["L", -.2, -.1], ["Z"], ["M", .5, .05], ["L", -.2, .55], ["L", -.1, .05], ["Z"]], u), "#2A0C22", "rgba(255,210,150,.85)", u));
      // a windsurfer (moving right): the board, the rider leaning out, the sail with the low sun through it
      S.surf = shape(8, 9, 4.2, 7.9, x => { const sail = new Path2D(); sail.moveTo(.1 * u, -.4 * u); sail.lineTo(-.5 * u, -7.2 * u); sail.quadraticCurveTo(-2.4 * u, -4.2 * u, -3.5 * u, -2.3 * u); sail.quadraticCurveTo(-1.6 * u, -.9 * u, .1 * u, -.4 * u); sail.closePath();
        const gr = x.createLinearGradient(0, -7 * u, -3.5 * u, -1 * u); gr.addColorStop(0, "#FFE9A0"); gr.addColorStop(.45, "#FFB25E"); gr.addColorStop(1, "#F2585A"); x.globalAlpha = .93; x.fillStyle = gr; x.fill(sail); x.globalAlpha = 1;
        x.save(); x.clip(sail); x.strokeStyle = "rgba(120,30,50,.45)"; x.lineWidth = .1 * u; for (const k of [.3, .52, .74]) { x.beginPath(); x.moveTo(lerp(.1, -.5, k) * u, lerp(-.4, -7.2, k) * u); x.lineTo(lerp(-.2, -3.4, 1 - k) * u, lerp(-.9, -2.6, 1 - k) * u - .6 * u); x.stroke(); } x.fillStyle = "rgba(255,255,255,.25)"; x.fillRect(-4 * u, -4.6 * u, 5 * u, .5 * u); x.restore(); // battens, a light panel
        const body = bez([["E", 0, 0, 2.7, .24, 0], ["M", -.35, -.15], ["L", -1.25, -2.55], ["L", -.85, -2.7], ["L", .05, -.2], ["Z"], ["E", -1.3, -3.0, .32, .34, 0], ["M", -1.1, -2.4], ["L", -.6, -3.3], ["L", -.45, -3.2], ["L", -.95, -2.3], ["Z"]], u); sil(x, body, dark, rim, u);
        x.strokeStyle = dark; x.lineWidth = .14 * u; x.beginPath(); x.moveTo(.1 * u, -.3 * u); x.lineTo(-.5 * u, -7.2 * u); x.moveTo(-.2 * u, -3.4 * u); x.lineTo(-3.4 * u, -2.3 * u); x.stroke(); }); // mast and boom
      // a dolphin (facing right), and a whale's flukes
      S.dolph = shape(7, 3.4, 3.2, 1.6, x => sil(x, bez([["M", 2.7, .05], ["Q", 2.3, -.25, 1.9, -.42], ["Q", .5, -.95, -1.4, -.5], ["Q", -2.1, -.3, -2.35, -.2], ["L", -3.0, -.75], ["Q", -2.75, -.1, -2.95, .45], ["L", -2.3, .05], ["Q", -1, .5, .6, .42], ["L", .3, .95], ["L", 1.0, .38], ["Q", 2.1, .3, 2.7, .05], ["Z"], ["M", .1, -.8], ["Q", -.3, -1.55, -.85, -1.55], ["Q", -.55, -1.1, -.7, -.62], ["Z"]], u), dark, rim, u));
      S.fluke = shape(11, 6, 5.5, 5.4, x => sil(x, bez([["M", -.55, 0], ["Q", -.45, -1.6, -.3, -2.3], ["Q", -2.2, -2.3, -4.6, -3.9], ["Q", -3.2, -4.9, -1.1, -4.3], ["Q", -.3, -3.9, 0, -3.5], ["Q", .3, -3.9, 1.1, -4.3], ["Q", 3.2, -4.9, 4.6, -3.9], ["Q", 2.2, -2.3, .3, -2.3], ["Q", .45, -1.6, .55, 0], ["Z"]], u), dark, rim, u));
      // a seaplane (facing right): its high wing, floats and struts; a jet, a glint of gold high up
      S.plane = shape(9, 4.2, 4.4, 2.2, x => { const p = bez([["M", -3.5, -.55], ["L", -3.9, -1.7], ["L", -3.2, -1.7], ["L", -2.3, -.65], ["L", 1.6, -.8], ["Q", 2.6, -.75, 3.1, -.3], ["Q", 3.0, .15, 2.2, .25], ["L", -2.6, .05], ["Z"], ["M", -1.3, -1.35], ["L", 3.1, -1.35], ["L", 3.1, -1.05], ["L", -1.3, -1.05], ["Z"], ["M", -2.2, 1.05], ["L", 2.6, 1.05], ["Q", 3.3, 1.1, 3.4, 1.3], ["Q", 2.8, 1.55, 2.1, 1.55], ["L", -2.0, 1.5], ["Z"]], u); sil(x, p, dark, rim, u);
        x.strokeStyle = dark; x.lineWidth = .1 * u; x.beginPath(); x.moveTo(-.3 * u, .1 * u); x.lineTo(-.9 * u, 1.05 * u); x.moveTo(1.4 * u, .15 * u); x.lineTo(1.9 * u, 1.05 * u); x.moveTo(.4 * u, -1.05 * u); x.lineTo(1.0 * u, -.75 * u); x.moveTo(2.4 * u, -1.05 * u); x.lineTo(2.2 * u, -.6 * u); x.stroke(); x.fillStyle = "#FFD08A"; for (const k of [0, 1, 2]) x.fillRect((.2 + k * .5) * u, -.6 * u, .28 * u, .2 * u); });
      S.jet = shape(3, 1.6, 1.5, .8, x => { x.fillStyle = "#FFE7B0"; x.beginPath(); x.moveTo(1.3 * u, 0); x.lineTo(-1.2 * u, -.1 * u); x.lineTo(-1.2 * u, .1 * u); x.closePath(); x.moveTo(.3 * u, -.05 * u); x.lineTo(-.5 * u, -.7 * u); x.lineTo(-.2 * u, 0); x.lineTo(-.5 * u, .7 * u); x.closePath(); x.moveTo(-1.0 * u, 0); x.lineTo(-1.35 * u, -.35 * u); x.lineTo(-1.35 * u, .35 * u); x.closePath(); x.fill(); });
    } else {
      // lanterns in rose and in gold beside the orange ones, their glows and the light they lay on the water
      const lr = S.lr, lanternOf = (stops, rib) => make(lr * 3.2, lr * 4.2, x => { const w = lr * 2, h = lr * 2.7; x.save(); x.translate(lr * .6, lr * .6);
        const body = new Path2D(); body.moveTo(w * .08, 0); body.lineTo(w * .92, 0); body.quadraticCurveTo(w, 0, w * .96, h * .12); body.lineTo(w * .8, h); body.lineTo(w * .2, h); body.lineTo(w * .04, h * .12); body.quadraticCurveTo(0, 0, w * .08, 0); body.closePath();
        const gr = x.createRadialGradient(w * .5, h * .95, 0, w * .5, h * .6, h * .95); stops.forEach((c, i) => gr.addColorStop([0, .35, .75, 1][i], c)); x.fillStyle = gr; x.fill(body);
        x.strokeStyle = rib; x.lineWidth = Math.max(.6, lr * .06); for (const f of [.35, .65]) { x.beginPath(); x.moveTo(w * (.08 + f * .84), 0); x.lineTo(w * (.2 + f * .6), h); x.stroke(); }
        x.fillStyle = "#FFFBEA"; x.beginPath(); x.ellipse(w * .5, h * .93, w * .13, h * .05, 0, 0, TAU); x.fill(); x.restore(); });
      S.lcols = [[S.lantern, S.lglow, "#FFB45C"], [lanternOf(["#FFF0F4", "#FFB0C6", "#EE6F8E", "#B23E5E"], "rgba(140,30,60,.35)"), glow(lr * 3.4, [255, 130, 175], .5), "#FF9DBB"], [lanternOf(["#FFFFF2", "#FFE8A6", "#F0C25C", "#B4862C"], "rgba(130,90,20,.35)"), glow(lr * 3.4, [255, 222, 140], .5), "#FFE2A0"]];
      // a lantern set floating on the water: a paper box lit inside, on its little float
      S.wlant = make(lr * 2.8, lr * 2.6, x => { const w = lr * 1.7, h = lr * 1.3, ox = lr * .55, oy = lr * .5; x.fillStyle = "#1A1430"; x.fillRect(ox - lr * .12, oy + h, w + lr * .24, lr * .28);
        const gr = x.createRadialGradient(ox + w / 2, oy + h * .8, 0, ox + w / 2, oy + h * .5, h * 1.1); gr.addColorStop(0, "#FFF6CC"); gr.addColorStop(.45, "#FFC663"); gr.addColorStop(1, "#E07A3A"); x.fillStyle = gr; x.beginPath(); x.moveTo(ox + w * .08, oy); x.lineTo(ox + w * .92, oy); x.lineTo(ox + w, oy + h); x.lineTo(ox, oy + h); x.closePath(); x.fill();
        x.strokeStyle = "rgba(150,60,20,.4)"; x.lineWidth = Math.max(.6, lr * .06); x.beginPath(); x.moveTo(ox + w * .5, oy); x.lineTo(ox + w * .5, oy + h); x.stroke(); x.fillStyle = "#2A1F3E"; x.fillRect(ox + w * .02, oy - lr * .1, w * .96, lr * .14); });
      S.wglow = glow(lr * 2.4, [255, 170, 80], .45);
      // a rowboat (facing right) with its rower; the lantern at its bow is drawn with its light
      S.row = shape(10, 5, 5, 3.4, x => sil(x, bez([["M", -3.9, -.55], ["L", 3.7, -.8], ["Q", 3.2, .5, 2.2, .55], ["L", -2.9, .5], ["Q", -3.7, .3, -3.9, -.55], ["Z"], ["M", -.9, -.6], ["L", -1.25, -2.2], ["Q", -1.0, -2.55, -.55, -2.3], ["L", -.2, -.65], ["Z"], ["E", -1.05, -2.75, .34, .36, 0], ["M", 3.2, -.75], ["L", 3.35, -3.4], ["L", 3.5, -3.4], ["L", 3.4, -.75], ["Z"], ["M", 3.35, -3.35], ["L", 4.1, -3.2], ["L", 4.1, -3.05], ["L", 3.4, -3.15], ["Z"]], u), dark, rim, u));
      // bats: wings up, spread, down
      S.bat = [-1, 0, 1].map(f => make(5 * u, 3.6 * u, x => { x.translate(2.5 * u, 1.8 * u); const p = new Path2D(); p.ellipse(0, 0, .35 * u, .55 * u, 0, 0, TAU); p.moveTo(-.25 * u, -.45 * u); p.lineTo(-.3 * u, -.85 * u); p.lineTo(-.05 * u, -.5 * u); p.lineTo(.05 * u, -.5 * u); p.lineTo(.3 * u, -.85 * u); p.lineTo(.25 * u, -.45 * u); p.closePath();
        for (const sd of [-1, 1]) { const ty = f * 1.4, tx = 2.3 - Math.abs(f) * .5; p.moveTo(sd * .25 * u, -.2 * u); p.quadraticCurveTo(sd * 1.2 * u, (-.6 + ty * .3) * u, sd * tx * u, ty * u - .4 * u); p.quadraticCurveTo(sd * (tx - .35) * u, (ty * .6 + .15) * u, sd * (tx - .7) * u, (ty * .45 + .25) * u); p.quadraticCurveTo(sd * (tx - 1.05) * u, (ty * .35 + .05) * u, sd * (tx - 1.35) * u, (ty * .3 + .3) * u); p.quadraticCurveTo(sd * .8 * u, (ty * .15 + .1) * u, sd * .25 * u, .2 * u); p.closePath(); }
        sil(x, p, "#07061A", "rgba(190,170,255,.55)", u); }));
      S.veil = make(30 * u, 6 * u, x => { const bands = [[0, 3.6, 26, 1.1], [3.5, 2.5, 18, 1.0], [7.5, 1.4, 10, .9]]; for (const [ox, oy, w, h] of bands) { x.fillStyle = "#2E2458"; x.beginPath(); x.roundRect(ox * u, oy * u, w * u, h * u, h * u / 2); x.fill(); x.fillStyle = "rgba(200,185,255,.55)"; x.beginPath(); x.roundRect((ox + .5) * u, (oy + h * .62) * u, (w - 1) * u, h * .24 * u, h * .12 * u); x.fill(); } }); // flat strips, moonlight along their lower edges
      S.fish = make(1.6 * u, .7 * u, x => { x.fillStyle = "#DCE6FF"; x.beginPath(); x.ellipse(.7 * u, .35 * u, .55 * u, .18 * u, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(.2 * u, .35 * u); x.lineTo(0, .12 * u); x.lineTo(0, .58 * u); x.closePath(); x.fill(); });
      { const gl = glow(2.6 * u, [200, 245, 150], .7); S.ffGlow = make(gl.w2, gl.w2, x => { x.globalAlpha = .8; x.drawImage(gl, 0, 0, gl.w2, gl.w2); x.globalAlpha = 1; x.fillStyle = "#F6FFC8"; x.beginPath(); x.arc(gl.w2 / 2, gl.w2 / 2, .28 * u, 0, TAU); x.fill(); }); } /* its glow and its dot in one */
      S.lampGlow = glow(5 * u, [255, 236, 190], .8);
    }
  }

  /* ---------------- sunset's beats ---------------- */
  /** the flock across the sun in its V, either way */
  function sFlock(T, I, A, b, sy, R) {
    const { W, u } = S, on = I > .01, fb = seg(T, b.t0, b.t1, x => x); if (on && fb > 0 && fb < 1) { const lx = lerp(-4 * u, W + b.tail, fb), /* the last of the V off the right before it is gone */ ly = sy - R * b.dy + Math.sin(fb * 5) * 2 * u; g.fillStyle = P.palm; g.globalAlpha = I;
      for (const f of b.flock) { const x0 = lx + f.dx, x = b.dir > 0 ? x0 : W - x0, y = ly + f.dy, s = f.s * u, fl = Math.sin(A * 11 + f.ph); g.beginPath(); g.moveTo(x - 2.4 * s, y - fl * 1.3 * s); g.quadraticCurveTo(x - 1 * s, y - .8 * s, x, y + .3 * s); g.quadraticCurveTo(x + 1 * s, y - .8 * s, x + 2.4 * s, y - fl * 1.3 * s); g.quadraticCurveTo(x + 1 * s, y + .1 * s, x, y + .9 * s); g.quadraticCurveTo(x - 1 * s, y + .1 * s, x - 2.4 * s, y - fl * 1.3 * s); g.fill(); } }
  }
  /** a sailboat across the reflection, right to left (the first pass's) or mirrored */
  function sSail(T, I, b) {
    const on = I > .01, sb = seg(T, b.t0, b.t1, x => x); if (on && sb > 0 && sb < 1) { const bx = lerp(b.xs, b.xe, sb), by = b.by, s = b.s, m = b.m; g.globalAlpha = I; g.fillStyle = P.palm;
      g.beginPath(); g.moveTo(bx - m * 3.2 * s, by); g.lineTo(bx + m * 3.2 * s, by); g.lineTo(bx + m * 2.3 * s, by + 1.3 * s); g.lineTo(bx - m * 2.3 * s, by + 1.3 * s); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(bx - m * .2 * s, by - .2 * s); g.lineTo(bx - m * .2 * s, by - 8.5 * s); g.lineTo(bx + m * 3.6 * s, by - .8 * s); g.closePath(); g.fill(); g.beginPath(); g.moveTo(bx - m * .6 * s, by - 7.5 * s); g.lineTo(bx - m * .6 * s, by - 1 * s); g.lineTo(bx - m * 3 * s, by - 1 * s); g.closePath(); g.fill();
      g.globalAlpha = .35 * I; g.fillRect(bx - 2.8 * s, by + 1.8 * s, 5.6 * s, .5 * s); }
  }
  /** a run of light down the sun's path, from the horizon to the foot of the page (the glints there flare as it passes) */
  function sRun(T, I, b, sx, R) {
    const { H, hz } = S, band = (H - hz) * .2;
    for (const t0 of b.runs) { const k = seg(T, t0, t0 + 1.9, x => x); if (k <= 0 || k >= 1) continue; const yc = lerp(hz - band, H + band, E.io(k)), e0 = I * Math.sin(k * Math.PI);
      g.fillStyle = "#FFF3D6"; for (const s of S.glints) { const y = hz + 2 + Math.pow(s.y, 1.5) * (H - hz) * .85, d = Math.abs(y - yc) / band; if (d >= 1) continue; const spread = R * (1.05 - s.y * .6), w = spread * s.w * 1.35; const bx = sx - w / 2 + s.s * spread * .5; g.globalAlpha = Math.min(1, e0 * (1 - d) * 1.15) * S.shade(bx + w / 2, y, w * .3); g.fillRect(bx, y - .8, w, 2.6 + (1 - s.y) * 2.2); } /* faded by the words: the footer's too */
      g.globalAlpha = e0 * .35 * Math.min(S.shade(sx - R * 1.1, yc, 8), S.shade(sx, yc, 8), S.shade(sx + R * 1.1, yc, 8)); g.fillRect(sx - R * 1.1, yc - 1, R * 2.2, 2); } /* the crest of it, a line of light across the path */
  }
  /** a jet high up, a glint of gold, drawing a contrail that glows in the low sun and spreads and fades */
  function sContrail(T, I, b) {
    if (I <= .01 || T <= b.t0 || T >= b.t1) return;
    const { u } = S, k = seg(T, b.t0, b.t0 + b.fly, x => x), n = 28, yAt = x => b.y + (x - b.xs) * b.slope, age0 = T - b.t0, head = Math.min(age0, b.fly);
    // a ribbon from where it came in to where the jet is (or went out): wider and fainter the older it is
    const xAt = t => lerp(b.xs, b.xe, clamp(t / b.fly)), top = [], bot = [];
    for (let i = 0; i <= n; i++) { const t = head * i / n, x = xAt(t), age = T - (b.t0 + t), w = (.14 + age * .16) * u, sag = Math.sin(age * 1.3 + i * .8) * age * .1 * u; top.push([x, yAt(x) + sag - w]); bot.push([x, yAt(x) + sag + w]); }
    const xh = xAt(head), xt = xAt(0), a = I * S.shade((xh + xt) / 2, yAt((xh + xt) / 2), 4 * u);
    const gr = g.createLinearGradient(xh, 0, xt, 0), agefade = t => clamp(1 - t / b.life);
    gr.addColorStop(0, `rgba(255,222,190,${(.75 * agefade(age0 - head)).toFixed(3)})`); gr.addColorStop(.5, `rgba(255,205,180,${(.45 * agefade(age0 - head / 2)).toFixed(3)})`); gr.addColorStop(1, `rgba(255,190,175,${(.2 * agefade(age0)).toFixed(3)})`);
    g.save(); g.globalAlpha = clamp(a); g.fillStyle = gr; g.beginPath(); top.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); for (let i = n; i >= 0; i--) g.lineTo(bot[i][0], bot[i][1]); g.closePath(); g.fill(); g.restore();
    if (k > 0 && k < 1) { const x = lerp(b.xs, b.xe, k); stamp(S.jet, x, yAt(x), .5, .5, Math.atan(b.slope) * (b.xe > b.xs ? 1 : -1), b.xe > b.xs ? 1 : -1, 1, I * S.shade(x, yAt(x), 2 * u)); }
  }
  /** a liner along the horizon, its smoke trailing, its portholes lit; on a wide screen from behind one headland to
   *  behind the other, across the sun */
  function sLiner(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, x = lerp(b.xs, b.xe, k), y = b.y + Math.sin(A * .8) * .08 * u, s = b.s, sx = -b.dir * s, a = clamp(I * (b.clip ? 1 : .35 + .65 * S.shade(x, y - 3 * u * s, 6 * u * s)));
    g.save(); if (b.clip) g.clip(S.headClip, "evenodd");
    // its smoke, in soft puffs drifting back from the funnels and up
    const thin = clamp((T - b.t0) / 1.2) * clamp((b.t1 - T) / 1.2); /* it thins at the ends, where the ship is behind a headland */
    g.fillStyle = "#8A4466"; for (const [fx, fy] of S.liner.funnels) for (let j = 0; j < 6; j++) { const age = (A * .5 + j / 6 + fx * .13) % 1, px2 = x + sx * (fx + age * 7) * u, py2 = y + (fy - age * 2.6) * u * s, r = (.35 + age * 1.1) * u * s; g.globalAlpha = a * (1 - age) * .42 * thin; g.beginPath(); g.ellipse(px2, py2, r * 1.4, r, 0, 0, TAU); g.fill(); }
    // its reflection, dim and broken
    g.globalAlpha = a * .22; g.save(); g.translate(x, y + .2 * u); g.scale(sx, -s * .55); g.drawImage(S.liner, -S.liner.w2 * S.liner.ox, -S.liner.h2 * S.liner.oy, S.liner.w2, S.liner.h2); g.restore();
    g.globalAlpha = a; g.save(); g.translate(x, y); g.scale(sx, s); g.drawImage(S.liner, -S.liner.w2 * S.liner.ox, -S.liner.h2 * S.liner.oy, S.liner.w2, S.liner.h2); g.restore();
    g.restore();
  }
  /** a pelican: it glides in low, rises, tips over and plunges into the sun's path; a crown of spray and its rings */
  function sPelican(T, I, A, b) {
    if (I <= .01 || T <= b.t0 || T >= b.t1) return;
    const { u } = S, t = T - b.t0, s = b.s, d = b.dir; let x, y, rot = 0, f = 0, show = true;
    if (t < b.g1) { const k = t / b.g1; x = lerp(b.xs, b.xa, k); y = b.yg + Math.sin(t * 1.3) * .35 * u; f = t > b.g1 * .35 && t < b.g1 * .55 ? (Math.sin(t * 9) > 0 ? 1 : 0) : 0; }
    else if (t < b.g2) { const k = (t - b.g1) / (b.g2 - b.g1); x = lerp(b.xa, b.xb, k); y = b.yg - E.out(k) * 2.4 * u; rot = d * lerp(-.12, 1.1, E.in(k)); f = k > .55 ? 2 : 0; }
    else if (t < b.g3) { const k = (t - b.g2) / (b.g3 - b.g2); x = lerp(b.xb, b.xd, k); y = lerp(b.yg - 2.4 * u, b.yw, E.in(k)); rot = d * 1.25; f = 2; }
    else show = false;
    if (show) { g.save(); g.beginPath(); g.rect(0, 0, S.W, b.yw); g.clip(); stamp(S.pel[f], x, y, S.pel[f].ox, S.pel[f].oy, rot, d * s, s, I * (.35 + .65 * S.shade(x, y, 4 * u))); g.restore(); }
    const sp = (t - b.g3) / 1.3; if (sp > 0 && sp < 1) splash(b.xd, b.yw, sp, s * 1.2, I); // the spray where it went in
    const rg = (t - b.g3) / 2.4; if (rg > 0 && rg < 1) rings(b.xd, b.yw, rg, 3, 9 * u * s, I * .6);
  }
  /** a crown of flat spray thrown up where something goes into the water, falling back */
  function splash(x, y, k, s, a) {
    const { u } = S; g.fillStyle = "#FFE6B0";
    for (let i = 0; i < 9; i++) { const an = -Math.PI / 2 + (i - 4) * .26, v = (i % 2 ? 4.6 : 6.4) * u * s, px2 = x + Math.cos(an) * v * k * .9, py2 = y + Math.sin(an) * v * Math.sin(k * Math.PI) * 1.3, r = (.5 - k * .28) * u * s; if (r <= 0) continue; g.globalAlpha = a * (1 - k * k); g.beginPath(); g.ellipse(px2, py2, r, r * 1.8, an + Math.PI / 2, 0, TAU); g.fill(); }
    const col = Math.sin(clamp(k * 1.6) * Math.PI) * 3.6 * u * s; if (col > .5) { g.globalAlpha = a * (1 - k) * .9; g.beginPath(); g.moveTo(x - .7 * u * s, y); g.quadraticCurveTo(x, y - col * 1.2, x + .7 * u * s, y); g.closePath(); g.fill(); } // a column of spray
    g.globalAlpha = a * (1 - k) * .8; g.beginPath(); g.ellipse(x, y, (1.2 + k * 2.6) * u * s, .4 * u * s, 0, 0, TAU); g.fill();
  }
  /** rings spreading on the water, flattened */
  function rings(x, y, k, n, R, a, col = "#FFD9A0") { g.strokeStyle = col; g.lineWidth = .8; for (let i = 0; i < n; i++) { const q = clamp(k * 1.3 - i * .15); if (q <= 0) continue; g.globalAlpha = a * (1 - q); g.beginPath(); g.ellipse(x, y, q * R, q * R * .2, 0, 0, TAU); g.stroke(); } }
  /** flamingos in a line across the sun, pink, their wingbeats out of step */
  function sFlamingos(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S;
    for (const f of b.birds) { const x = lerp(b.xs, b.xe, k) - b.dir * f.dx, y = b.y + f.dy + Math.sin(A * 2.2 + f.ph) * .4 * u, fr = Math.sin(A * 5.5 + f.ph) > 0 ? 0 : 1; stamp(S.flam[fr], x, y, S.flam[fr].ox, S.flam[fr].oy, 0, b.dir * b.s, b.s, I * (.35 + .65 * S.shade(x, y, 3 * u))); }
  }
  /** a seaplane: in from past one edge, down to the water in the sun's path in a burst of spray, and away along it */
  function sSeaplane(T, I, A, b) {
    if (I <= .01 || T <= b.t0 || T >= b.t1) return;
    const { u } = S, t = T - b.t0, s = b.s, d = b.dir; let x, y, rot = 0;
    if (t < b.g1) { const k = t / b.g1; x = lerp(b.xs, b.xt, k); y = lerp(b.ya, b.yw - 1.55 * u * s, E.out(k)); rot = d * lerp(.1, -.02, k); }
    else { const k = (t - b.g1) / (b.dur - b.g1); x = lerp(b.xt, b.xe, k * (.6 + .4 * k)); y = b.yw - 1.55 * u * s + Math.sin(A * 3) * .06 * u; rot = 0; }
    const a = I * (.4 + .6 * S.shade(x, y, 5 * u));
    if (t > b.g1 - .2) { const w = clamp((t - b.g1 + .2) / .6); g.fillStyle = "#FFE0A6"; g.globalAlpha = a * .5 * w; g.fillRect(Math.min(x, b.xt) , b.yw - .15 * u, Math.abs(x - b.xt) * (1 - clamp((t - b.g1) / 6)), .5); } // its wake
    stamp(S.plane, x, y, S.plane.ox, S.plane.oy, rot, d * s, s, a);
    g.save(); g.globalAlpha = a * .4; g.fillStyle = "#FFF1D6"; g.beginPath(); g.ellipse(x + d * 3.2 * u * s, y - .25 * u * s, .12 * u * s, .9 * u * s, 0, 0, TAU); g.fill(); g.restore(); // the propeller
    const sp = (t - b.g1) / 1.4; if (sp > 0 && sp < 1) { splash(x - d * 1.5 * u * s, b.yw, sp, s * .5, I * .75); splash(x + d * .8 * u * s, b.yw, Math.min(1, sp * 1.2), s * .38, I * .65); }
  }
  /** a windsurfer across the bay, the low sun through its sail, spray at the bow and a wake behind */
  function sWindsurf(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, x = lerp(b.xs, b.xe, k), y = b.y + Math.sin(A * 2.4) * .15 * u, s = b.s, d = b.dir, a = I * (.4 + .6 * S.shade(x, y - 4 * u * s, 5 * u * s));
    g.fillStyle = "#FFE7B8"; g.globalAlpha = a * .5; g.fillRect(d > 0 ? x - 16 * u * s : x + 2 * u * s, y + .1 * u, 14 * u * s, .12 * u * s + .5); // its wake
    for (let i = 0; i < 5; i++) { const q = (A * 2.6 + i / 5) % 1; g.globalAlpha = a * (1 - q) * .8; g.beginPath(); g.arc(x + d * (2.4 + q * 1.2) * u * s, y - (Math.sin(q * Math.PI) * 1.1 + .1) * u * s, (.18 - q * .1) * u * s + .3, 0, TAU); g.fill(); } // spray at the bow
    stamp(S.surf, x, y, S.surf.ox, S.surf.oy, d * (-.05 + Math.sin(A * 1.7) * .03), d * s, s, a);
  }
  /** dolphins leaping one after another through the sun's path, splashing in and out */
  function sDolphins(T, I, A, b) {
    if (I <= .01) return; const { u } = S;
    for (const l of b.leaps) { const k = (T - l.t0) / l.d; if (k <= -.2 || k >= 1.5) continue;
      if (k > 0 && k < 1) { const x = l.x + b.dir * l.L * k, y = l.y - Math.sin(k * Math.PI) * l.h, dx = b.dir * l.L, dy = -Math.cos(k * Math.PI) * Math.PI * l.h, rot = Math.atan2(dy, Math.abs(dx)) * b.dir;
        g.save(); g.beginPath(); g.rect(0, 0, S.W, l.y); g.clip(); stamp(S.dolph, x, y, S.dolph.ox, S.dolph.oy, rot, b.dir * l.s, l.s, I * (.4 + .6 * S.shade(x, y, 3 * u))); g.restore(); }
      const s1 = k / .3; if (s1 > 0 && s1 < 1) splash(l.x + b.dir * l.L * .06, l.y, s1, l.s * .6, I * .8); const s2 = (k - .92) / .35; if (s2 > 0 && s2 < 1) splash(l.x + b.dir * l.L * .94, l.y, s2, l.s * .7, I * .8);
      const rg = (k - .9) / .6; if (rg > 0 && rg < 1) rings(l.x + b.dir * l.L * .94, l.y, rg, 2, 6 * u * l.s, I * .5); }
  }
  /** the whale: a spout far out in the sun's path, its back rolling, then its flukes up out of the water, streaming,
   *  and down again */
  function sWhale(T, I, A, b) {
    if (I <= .01 || T <= b.t0 || T >= b.t1) return;
    const { u } = S, t = T - b.t0, s = b.s, x = b.x, y = b.y;
    // the spout: two plumes of mist fanning up out of the water and curling over, drifting on the wind and thinning
    const sp = t / 2.4; if (sp > 0 && sp < 1) { g.fillStyle = "#FFF1D8"; const sx0 = x - b.dir * 2.2 * u * s, rise = E.out(clamp(sp / .45)), thin = 1 - clamp((sp - .35) / .65);
      for (const side of [-1, 1]) for (let i = 0; i < 8; i++) { const q = (i + 1) / 8 * rise, px2 = sx0 + side * q * q * 2.4 * u * s + sp * 1.6 * u * s * b.dir * -1, py2 = y - q * 7 * u * s + q * q * q * 2.2 * u * s, r = (.35 + q * .75) * u * s; g.globalAlpha = I * thin * (.25 + .5 * (1 - q)) ; g.beginPath(); g.ellipse(px2, py2, r * 1.15, r, 0, 0, TAU); g.fill(); }
      g.globalAlpha = I * thin * .5; g.beginPath(); g.ellipse(sx0, y - .2 * u * s, 1.2 * u * s, .35 * u * s, 0, 0, TAU); g.fill(); }
    g.save(); g.beginPath(); g.rect(0, 0, S.W, y); g.clip(); g.fillStyle = P.palm;
    // its back, rolling over
    const bk = (t - 1.2) / 2.2; if (bk > 0 && bk < 1) { const h = Math.sin(bk * Math.PI) * 1.4 * u * s, cx = x + b.dir * lerp(-3, 3, bk) * u * s; g.globalAlpha = I; g.beginPath(); g.ellipse(cx, y, 4.5 * u * s, h, 0, Math.PI, TAU); g.fill(); if (bk > .3 && bk < .8) { g.beginPath(); g.moveTo(cx - b.dir * .5 * u * s, y - h * .9); g.lineTo(cx - b.dir * 1.5 * u * s, y - h * .9 - .7 * u * s * Math.sin((bk - .3) / .5 * Math.PI)); g.lineTo(cx - b.dir * 1.6 * u * s, y - h * .6); g.closePath(); g.fill(); } }
    // its flukes: up out of the water, held, and down
    const fk = (t - 3.2) / 4.4; if (fk > 0 && fk < 1) { const rise = fk < .3 ? E.out(fk / .3) : fk > .72 ? 1 - E.in((fk - .72) / .28) : 1, fx = x + b.dir * 3.2 * u * s, fy = y + (1 - rise) * 6 * u * s;
      stamp(S.fluke, fx, fy, S.fluke.ox, S.fluke.oy, b.dir * (.08 + (1 - rise) * .25), s, s, I);
      if (rise > .5) { g.fillStyle = "#FFE3A8"; for (let i = 0; i < 10; i++) { const q = (A * 1.6 + i / 10) % 1, dx2 = (i - 4.5) * .8 * u * s, px2 = fx + dx2, py2 = fy - (4.1 - Math.abs(i - 4.5) * .12) * u * s + q * 4.4 * u * s; g.globalAlpha = I * (rise - .5) * 2 * (1 - q) * .8; g.fillRect(px2, py2, .12 * u * s + .4, (.5 + q * .8) * u * s); } } }
    g.restore();
    const rg = (t - 6.8) / 2.6; if (rg > 0 && rg < 1) rings(x + b.dir * 3.2 * u * s, y, rg, 3, 12 * u * s, I * .6);
  }

  /** a junk along the horizon under its batten sails, across the sun (on a wide screen from behind one headland to behind
   *  the other) */
  function sJunk(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, x = lerp(b.xs, b.xe, k), y = b.y + Math.sin(A * .9) * .1 * u, s = b.s, sx = -b.dir * s, a = clamp(I * (b.clip ? 1 : .35 + .65 * S.shade(x, y - 4 * u * s, 6 * u * s))), roll = Math.sin(A * 1.1) * .015;
    g.save(); if (b.clip) g.clip(S.headClip, "evenodd");
    g.globalAlpha = a * .22; g.save(); g.translate(x, y + .2 * u); g.scale(sx, -s * .5); g.drawImage(S.junk, -S.junk.w2 * S.junk.ox, -S.junk.h2 * S.junk.oy, S.junk.w2, S.junk.h2); g.restore(); // its reflection
    g.globalAlpha = a; g.save(); g.translate(x, y); g.rotate(roll); g.scale(sx, s); g.drawImage(S.junk, -S.junk.w2 * S.junk.ox, -S.junk.h2 * S.junk.oy, S.junk.w2, S.junk.h2); g.restore();
    g.restore();
  }
  /** flying fish skimming the sun's path: out of the water, a long glide, down, and out again, each with its splash */
  function sFish(T, I, A, b) {
    if (I <= .01) return; const { u } = S;
    for (const f of b.fish) { const k = (T - f.t0) / f.d; if (k <= 0 || k >= 1.25) continue;
      const hop = Math.min(.999, k) * f.hops, h = Math.floor(hop), q = hop - h, x = lerp(f.xs, f.xe, Math.min(1, k)), y = f.y - Math.sin(q * Math.PI) * f.h * (1 - h * .15);
      if (k < 1) { const dy = -Math.cos(q * Math.PI) * Math.PI * f.h, rot = Math.atan2(dy, Math.abs(f.xe - f.xs) / f.hops) * .6 * (f.xe > f.xs ? 1 : -1); g.save(); g.beginPath(); g.rect(0, 0, S.W, f.y); g.clip(); stamp(S.flyfish, x, y, .5, .5, rot, (f.xe > f.xs ? 1 : -1) * f.s, f.s, I * (.4 + .6 * S.shade(x, y, 2 * u))); g.restore(); }
      for (let j = 1; j <= f.hops; j++) { const tj = f.t0 + f.d * j / f.hops, rg = (T - tj) / 1.1; if (rg <= 0 || rg >= 1) continue; const xj = lerp(f.xs, f.xe, j / f.hops); rings(xj, f.y, rg, 2, 3 * u * f.s, I * .55); } }
  }

  /* ---------------- dusk's beats ---------------- */
  /** a veil of cloud drawn slowly across the moon, its lower edges lit, and on past it */
  function dVeil(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, E.io); if (k <= 0 || k >= 1 || I <= .01) return;
    const { x: mx, y: my } = S.moon, x = lerp(b.x0, b.x1, k), a = I * (b.dir < 0 ? 1 - seg(k, .78, 1, E.sine) : seg(k, 0, .22, E.sine)) * .92; /* from past the edge, or away past it; it forms or thins on the far side of the moon */
    stamp(S.veil, x, my + b.dy, .5, .5, 0, b.dir, 1, a * (.45 + .55 * S.shade(x, my + b.dy, 10 * S.u)));
  }

  /** lanterns set on the water one after another across the bay, each lit as it is set down; they drift, and gutter out */
  function dFlotilla(T, I, A, b) {
    if (I <= .01) return; const { u } = S;
    for (const f of b.lan) { if (T <= f.t0 || T >= f.out + 1.4) continue;
      const lit = clamp((T - f.t0) / .7) * (1 - clamp((T - f.out) / 1.4)), x = f.x + f.vx * (T - f.t0) + Math.sin(A * .5 + f.ph) * .5 * u, y = f.y + Math.sin(A * 1.2 + f.ph) * .12 * u * f.s, a = I * lit * S.shade(x, y, 4 * u * f.s); if (a <= .01) continue;
      const flick = .9 + .1 * Math.sin(A * 11 + f.ph * 3); g.globalCompositeOperation = "lighter";
      g.globalAlpha = a * .5 * flick * S.shade(x, y + S.wglow.h2 * f.s * .3, 4 * u); g.drawImage(S.wglow, x - S.wglow.w2 * f.s / 2, y - S.wglow.h2 * f.s / 2, S.wglow.w2 * f.s, S.wglow.h2 * f.s); /* its halo, faded by the words below it */
      g.fillStyle = "#FFB45C"; const rw = S.lr * 1.3 * f.s; for (let i = 0; i < 4; i++) { const by = y + (1 + i * 1.3) * u * f.s; g.globalAlpha = a * .4 * flick * S.shade(x, by, 2 * u); g.fillRect(x - rw * (.5 - i * .08) + Math.sin(A * 3 + f.ph + i) * .4 * u, by, rw * (1 - i * .16), .8 + f.s * .6); } // its light on the water, faded by the words bar by bar
      g.globalCompositeOperation = "source-over"; g.globalAlpha = a; g.drawImage(S.wlant, x - S.wlant.w2 * f.s / 2, y - S.wlant.h2 * f.s * .72, S.wlant.w2 * f.s, S.wlant.h2 * f.s); }
    g.globalAlpha = 1;
  }
  /** a rowboat across the bay under the lantern at its bow; the oars dip and leave their rings */
  function dRow(T, I, A, b) {
    const k = seg(T, b.t0, b.t1, x => x); if (k <= 0 || k >= 1 || I <= .01) return;
    const { u } = S, s = b.s, d = b.dir, st = A * 2.1 + b.ph, surge = Math.sin(st) * .5 * u * s, x = lerp(b.xs, b.xe, k) + d * surge, y = b.y, a = I * (.4 + .6 * S.shade(x, y - 2 * u * s, 5 * u * s));
    // the lantern's light on the water, and its glow
    const L = S.lcols[b.c || 0], lg = L[1], lx = x + d * 3.95 * u * s, ly = y - 3.05 * u * s, flick = .9 + .1 * Math.sin(A * 12 + b.ph); g.globalCompositeOperation = "lighter"; g.globalAlpha = a * .8 * flick * S.shade(lx, ly + lg.h2 * s * .3, 4 * u); g.drawImage(lg, lx - lg.w2 * s * .9 / 2, ly - lg.h2 * s * .9 / 2, lg.w2 * s * .9, lg.h2 * s * .9); /* its halo, faded by the words below it (the footer's) */
    g.fillStyle = L[2]; for (let i = 0; i < 5; i++) { const by = y + (.8 + i * 1.1) * u * s; g.globalAlpha = a * .55 * flick * S.shade(lx, by, 2 * u); g.fillRect(lx - (1.3 - i * .18) * u * s + Math.sin(A * 2.6 + i * 1.3) * .5 * u, by, (2.6 - i * .36) * u * s, .7 + s * .5); } g.globalCompositeOperation = "source-over"; /* faded by the words bar by bar */
    // the oars: they sweep, dip and lift (the far one first, a shade darker), and the boat
    const sw = Math.sin(st), dip = Math.max(0, Math.cos(st)), cap = g.lineCap; g.strokeStyle = P.palm; g.lineCap = "round";
    for (const [dx0, w] of [[-.5, .16], [-.75, .2]]) { const px0 = x + d * dx0 * u * s, py0 = y - 1.2 * u * s, ex2 = px0 + d * (sw * 2.4 - .6) * u * s, ey2 = y + (dip * .7 - .2) * u * s; g.globalAlpha = a; g.lineWidth = w * u * s; g.beginPath(); g.moveTo(px0, py0); g.lineTo(ex2, ey2); g.stroke(); }
    g.lineCap = cap; stamp(S.row, x, y, S.row.ox, S.row.oy, Math.sin(st) * .02, d * s, s, a);
    g.fillStyle = ["#FFE1A0", "#FFD3E0", "#FFF1BE"][b.c || 0]; g.globalAlpha = a * flick; g.beginPath(); g.arc(lx, ly, .38 * u * s, 0, TAU); g.fill(); // the lantern itself
    const age = (((st - Math.PI * 1.5) / TAU) % 1 + 1) % 1; rings(x - d * (3.5 + age * 2) * u * s, y + .4 * u * s, age, 2, 4 * u * s, a * .45, "#C9B8F0"); // where the oars went in
  }
  /** the egret, standing, strikes at the water and comes up with a fish, and swallows it */
  function dCatch(T, I, A, b, ex, ey, es) {
    const t = T - b.ts; if (t <= 0 || t >= 3 || I <= .01) return;
    const wx = ex + 4.0 * es, wy = ey + 2.3 * es;
    const sp = t / .9 - .45; if (sp > 0 && sp < 1) { g.fillStyle = "#EDE6FF"; for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + (i - 2) * .45, v = 2.2 * es; g.globalAlpha = I * (1 - sp) * .8; g.beginPath(); g.arc(wx + Math.cos(an) * v * sp, wy + Math.sin(an) * v * Math.sin(sp * Math.PI), .22 * es, 0, TAU); g.fill(); } }
    const rg = (t - .4) / 2.2; if (rg > 0 && rg < 1) for (let k = 0; k < 3; k++) { const q = clamp(rg * 1.3 - k * .15); if (q <= 0) continue; g.globalAlpha = I * (1 - q) * .55; g.strokeStyle = "#C4B4E8"; g.lineWidth = .8; g.beginPath(); g.ellipse(wx, wy, q * 12 * S.u, q * 2 * S.u, 0, 0, TAU); g.stroke(); }
    const fk = (t - .75) / 1.6; if (fk > 0 && fk < 1) { const hx = ex + 3.4 * es, hy = ey - 3.2 * es, sc = 1 - E.in(clamp((fk - .7) / .3)); if (sc > .02) { g.save(); g.globalAlpha = I * clamp(fk * 8); g.translate(hx + .3 * es, hy + .1 * es); g.rotate(.5 + Math.sin(A * 14) * .25 * (1 - fk)); g.scale(sc, sc); g.drawImage(S.fish, -S.fish.w2 * .2, -S.fish.h2 / 2, S.fish.w2, S.fish.h2); g.restore(); } } // in its bill, wriggling, and swallowed
  }
  /** fireflies along the shore, blinking each in its own time over the water's edge */
  function dFireflies(T, I, A, b) {
    const k = env(T, b.t0, b.t0 + 1.4, b.t1 - 1.6, b.t1, E.sine) * I; if (k <= .01) return;
    const { u } = S, gw = S.ffGlow.w2; g.globalCompositeOperation = "lighter";
    for (const f of b.flies) { const x = f.x + Math.sin(A * f.f1 + f.p1) * f.ax, y = f.y + Math.sin(A * f.f2 + f.p2) * f.ay, bl = Math.pow(Math.max(0, Math.sin(A * f.fb + f.pb)), 2), a = k * (.1 + .9 * bl) * S.shade(x, y, 2 * u); if (a < .03) continue; g.globalAlpha = a; g.drawImage(S.ffGlow, x - gw / 2, y - gw / 2, gw, gw); }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  }
  /** bats flitting across the sky and over the moon */
  function dBats(T, I, A, b) {
    if (I <= .01) return; const { u } = S;
    for (const bt of b.bats) { const k = (T - bt.t0) / bt.d; if (k <= 0 || k >= 1) continue;
      const x = lerp(bt.xs, bt.xe, k) + Math.sin(k * bt.w1 + bt.p1) * bt.a1 * Math.sin(k * Math.PI), y = bt.y + Math.sin(k * bt.w2 + bt.p2) * bt.a2 + Math.sin(k * 23 + bt.p1) * .5 * u, fr = Math.floor(((A * 9 + bt.ph) % 3 + 3) % 3);
      stamp(S.bat[fr], x, y, .5, .5, Math.cos(k * bt.w2 + bt.p2) * .25, bt.s, bt.s, I * (.4 + .6 * S.shade(x, y, 3 * u))); }
  }
  /** a lighthouse's light on the far headland comes on, and its beam sweeps across the bay as it turns, flaring as it
   *  faces us; then it goes out */
  function dBeam(T, I, A, b) {
    const k = env(T, b.t0, b.t0 + 1.2, b.t1 - 1.2, b.t1, E.sine) * I; if (k <= .01) return;
    const { W, u } = S, [lx, ly] = b.at, th = b.a0 + (T - b.t0) * b.spin, face = Math.sin(th);
    for (const off of [0, Math.PI]) { const c = Math.cos(th + off), L = W * 1.25 * Math.abs(c), dir = c > 0 ? 1 : -1; if (L < 4 * u) continue;
      const vis = clamp(.3 + .7 * Math.max(0, Math.sin(th + off) + .35)), ex = lx + dir * L, spread = L * .05 + 1.2 * u, drop = L * .07; /* it leans down to the water */
      const gr = g.createLinearGradient(lx, ly, ex, ly + drop); gr.addColorStop(0, `rgba(255,240,205,${(.55 * k * vis).toFixed(3)})`); gr.addColorStop(.45, `rgba(255,236,200,${(.18 * k * vis).toFixed(3)})`); gr.addColorStop(1, "rgba(255,240,205,0)");
      g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.moveTo(lx, ly - .15 * u); g.lineTo(ex, ly + drop - spread); g.lineTo(ex, ly + drop + spread); g.lineTo(lx, ly + .15 * u); g.closePath(); g.fill(); }
    add2(S.lampGlow, lx, ly, k * (.35 + .65 * Math.pow(Math.max(0, face), 6)), .5 + Math.pow(Math.max(0, face), 6) * .9);
    g.fillStyle = "#FFF6DA"; g.globalAlpha = k; g.beginPath(); g.arc(lx, ly, .22 * u, 0, TAU); g.fill();
  }
  const add2 = (spr, x, y, a, s = 1) => { if (a <= .005) return; g.globalAlpha = clamp(a); g.drawImage(spr, x - spr.w2 * s / 2, y - spr.h2 * s / 2, spr.w2 * s, spr.h2 * s); };
  /** a meteor shower: streaks one after another from the same quarter of the sky */
  function dMeteors(T, I, b) {
    const { u } = S;
    for (const m of b.ms) { const k = (T - m.t0) / m.d; if (k <= 0 || k >= 1) continue; const e = E.in(k), x = m.x + m.vx * e, y = m.y + m.vy * e, l = Math.hypot(m.vx, m.vy), tx = -m.vx / l * m.len, ty = -m.vy / l * m.len, fa = I * (1 - k) * Math.min(S.shade(x, y, 10 * u), S.shade(x + tx * .6, y + ty * .6, 6 * u)); if (fa <= .01) continue;
      const gr = g.createLinearGradient(x, y, x + tx, y + ty); gr.addColorStop(0, `rgba(255,255,255,${(.95 * fa).toFixed(3)})`); gr.addColorStop(1, "rgba(200,190,255,0)"); g.globalAlpha = 1; g.strokeStyle = gr; g.lineWidth = m.w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + tx, y + ty); g.stroke(); }
  }
  /** the shallows glowing blue: ripples lit as they run along the water, one after another toward us, sparks in them */
  function dGlow(T, I, A, b) {
    if (I <= .01) return; const { u } = S, cap = g.lineCap; /* (the egret's strokes take the cap the frame leaves them: put it back) */
    g.lineCap = "round";
    for (const w of b.waves) { const k = (T - w.t0) / w.d; if (k <= 0 || k >= 1) continue; const xc = lerp(w.x0, w.x1, E.io(k)), fade = Math.sin(k * Math.PI) * I, lo = Math.max(w.xa, xc - w.band * 2.2), hi = Math.min(w.xb, xc + w.band * 2.2); if (hi <= lo) continue;
      const n = 18, yAt = x => w.y + Math.sin(x * w.f + A * 1.3) * w.amp;
      for (const [lw, al, col] of [[1.6 * u, .16, "#3FD8F0"], [.32 * u, .8, "#9AF8FF"]]) { g.strokeStyle = col; g.lineWidth = lw;
        for (let i = 0; i < n; i++) { const xa = lerp(lo, hi, i / n), xb2 = lerp(lo, hi, (i + 1) / n), e = Math.exp(-Math.pow(((xa + xb2) / 2 - xc) / w.band, 2)) * fade; if (e < .03) continue; g.globalAlpha = e * al * S.shade((xa + xb2) / 2, w.y, 3 * u); g.beginPath(); g.moveTo(xa, yAt(xa)); g.lineTo(xb2, yAt(xb2)); g.stroke(); } } /* faded by the words: the footer's too */
      g.fillStyle = "#E4FFFF"; for (let i = 0; i < 9; i++) { const q = ((i * .618 + A * .9 + w.f * 50) % 1), x = xc + (q - .5) * w.band * 2.4, e = Math.exp(-Math.pow((x - xc) / w.band, 2)) * fade; if (e < .2) continue; g.globalAlpha = e * (.5 + .5 * Math.sin(A * 7 + i * 2.3)) * S.shade(x, w.y, 2 * u); g.fillRect(x, yAt(x) - (.4 + (i % 3) * .3) * u, 1.6, 1.6); } }
    g.lineCap = cap;
  }

  /* ---------------- the passes: what each one deals ---------------- */
  function dealSunset(pass) {
    const { W, H, u, hz, pr } = S;
    if (pass <= 0) return { pass, gen, q: [.2, .8, 2.0, 2.8], h: [.2, .8, 2.2, 3.0], // the first pass: the loop, beat for beat
      sky: { k: "flock", t0: 2.4, t1: 5.8, dir: 1, dy: .6, tail: 17 * u, flock: S.flock },
      sun: { k: "cloud", a: [4.6, 9.4], dir: 1, y: .42 },
      water: { k: "sail", boats: [{ t0: 7.4, t1: 11.0, xs: W * 1.06, xe: -W * .08, by: hz + 1.6 * u, s: u * (pr ? 1.1 : .9), m: 1 }] },
      close: { k: "flare", f: [10.6, 11.2, 12.0, 13.0], fx: [10.6, 13.0], g: [10.8, 11.6, 12.6, 13.6] } };
    const r = K.deal(pass, 7400), rare = K.bag(pass, 8, 7401), pick = (list, salt) => list[K.bag(pass, list.length, salt)], pl = { pass, gen }, { R } = S.sun, sx = S.sunTx !== undefined ? S.sunTx : S.sun.x; /* where the sun comes to rest clear of the lines, so the deal doesn't hang on how far it has slid */
    { const t = r() < .55 ? 0 : 3 + r() * 5; pl.q = [.2 + t, .8 + t, 2.0 + t, 2.8 + t]; pl.h = [.2 + t, .8 + t, 2.2 + t, 3.0 + t]; } // the slits quicken, at the start or later
    const skK = rare === 2 ? "seaplane" : pick(["flock", "pelican", "flamingos"], 7402), snK = pick(["cloud", "liner", "contrail", "junk"], 7403), wtK = rare === 1 ? "whale" : skK === "seaplane" ? "none" : pick(["sail", "windsurf", "dolphins"], 7404), late = skK === "pelican" ? 1.8 : 0, clK = pick(["flare", "run", "fish"], 7405);
    // in the air
    if (skK === "flock") { const n = 5 + 2 * Math.floor(r() * 3), t0 = 2.0 + r() * .9, flock = []; for (let i = 0; i < n; i++) { const j = i - (n - 1) / 2; flock.push({ dx: -Math.abs(j) * 3.2 * u, dy: j * 1.9 * u, ph: r() * TAU, s: .8 + r() * .4 }); } pl.sky = { k: skK, t0, t1: t0 + 3.2 + r() * .8, dir: r() < .5 ? 1 : -1, dy: .35 + r() * .6, tail: 17 * u, flock }; }
    else if (skK === "pelican") { const d = sx > W * .5 ? 1 : -1, dir = r() < .7 ? d : -d, s = pr ? 1.2 : 1.15, yw = hz + (H - hz) * (.2 + r() * .12), xd = sx + (r() - .5) * R * .6; pl.sky = { k: skK, t0: 1.6 + r() * .8, t1: 0, dir, s, xs: dir > 0 ? -7.5 * u * s : W + 7.5 * u * s, xa: xd - dir * 5 * u, xb: xd - dir * 2.2 * u, xd, yg: yw - (6 + r() * 3) * u, yw, g1: 4.4, g2: 5.1, g3: 5.55 }; pl.sky.t1 = pl.sky.t0 + 8.2; }
    else if (skK === "flamingos") { const dir = r() < .5 ? 1 : -1, n = 5 + Math.floor(r() * 3), s = pr ? 1.05 : 1.0, birds = []; for (let i = 0; i < n; i++) birds.push({ dx: i * 5.6 * u * s + r() * 1.5 * u, dy: (i % 2 ? 1 : -1) * r() * 1.2 * u + i * .5 * u, ph: r() * TAU }); const back = (n * 5.6 + 6) * u * s, t0 = 2.2 + r() * .8;
      pl.sky = { k: skK, t0, t1: t0 + 5.6, dir, s, birds, y: S.sun.y - R * (.14 + r() * .3), xs: dir > 0 ? -6 * u * s : W + 6 * u * s, xe: dir > 0 ? W + back : -back }; }
    else { const dir = r() < .5 ? 1 : -1, s = pr ? 1.5 : 1.4, yw = hz + (H - hz) * (.26 + r() * .08), xt = sx - dir * R * .3; pl.sky = { k: skK, t0: 1.2, t1: 13.8, dur: 12.6, dir, s, g1: 4.2, xs: dir > 0 ? -5.4 * u * s : W + 5.4 * u * s, xt, xe: dir > 0 ? W + 5.4 * u * s : -5.4 * u * s, ya: hz - (10 + r() * 6) * u, yw }; }
    // by the sun
    if (snK === "cloud") { const t = (r() - .5) * 1.4; pl.sun = { k: snK, full: true, a: [3.4 + t, 10.8 + t], dir: r() < .5 ? 1 : -1, y: .2 + r() * .45 }; }
    else if (snK === "liner" || snK === "junk") { const jk = snK === "junk", s = pr ? 1.05 : .95, half = (jk ? 7.4 : 8.6) * u * s, dir = r() < .6 ? -1 : 1; if (!pr) { const need = (jk ? 9.8 : 9) * u * s, /* its sails, or its smoke */ hAt = (pts, x) => { let b = pts[0]; for (const q of pts) if (Math.abs(q[0] - x) < Math.abs(b[0] - x)) b = q; return hz - b[1]; }; let xr = S.right[0][0], xl = S.left[S.left.length - 1][0]; while (xr < W && hAt(S.right, xr) < need) xr += 4; while (xl > 0 && hAt(S.left, xl) < need) xl -= 4; /* from where each headland stands taller than the ship */
      const a0 = xr + half + u, a1 = xl - half - u; pl.sun = { k: snK, t0: .8, t1: 14.2, dir, s, clip: true, y: hz - .05 * u, xs: dir < 0 ? a0 : a1, xe: dir < 0 ? a1 : a0 }; } else pl.sun = { k: snK, t0: .8, t1: 14.2, dir, s, clip: false, y: hz + .8 * u, xs: dir < 0 ? W + half + 7 * u : -half - 7 * u, xe: dir < 0 ? -half - 7 * u : W + half + 7 * u }; }
    else { const dir = r() < .5 ? 1 : -1, y = H * (pr ? .1 + r() * .08 : .08 + r() * .08); pl.sun = { k: snK, t0: 1.2 + r() * 1.2, t1: 14.6, fly: 5.2 + r() * 1.2, life: 5.5, y, slope: (r() - .3) * .06 * (dir > 0 ? 1 : -1), xs: dir > 0 ? -3 * u : W + 3 * u, xe: dir > 0 ? W + 3 * u : -3 * u }; }
    // on the water
    if (wtK === "sail") { const two = r() < .4, boats = []; for (let i = 0; i < (two ? 2 : 1); i++) { const dir = i ? boats[0].m > 0 ? -1 : 1 : (r() < .5 ? -1 : 1), t0 = 6.8 + r() * .8 + i * .9 + late * .5, s = u * (pr ? 1.1 : .9) * (i ? .72 : 1), by = hz + (i ? .9 : 1.6) * u; boats.push({ t0, t1: t0 + 3.4 + r() * .6, xs: dir < 0 ? W * 1.06 : -W * .06, xe: dir < 0 ? -W * .08 : W * 1.08, by, s, m: dir < 0 ? 1 : -1 }); } pl.water = { k: wtK, boats }; }
    else if (wtK === "windsurf") { const dir = r() < .5 ? 1 : -1, s = pr ? 1.05 : .95, t0 = 6.4 + r() * .8 + late; pl.water = { k: wtK, t0, t1: t0 + 4.6, dir, s, y: hz + (H - hz) * (.3 + r() * .12), xs: dir > 0 ? -6 * u : W + 6 * u, xe: dir > 0 ? W + 18 * u : -18 * u }; } /* its wake off the edge with it */
    else if (wtK === "dolphins") { const dir = r() < .5 ? 1 : -1, leaps = [], y = hz + (H - hz) * (.18 + r() * .1), s = pr ? 1.2 : 1.15; let x = sx - dir * R * .9, t = 6.6 + r() * .6 + late * 1.45; for (let i = 0; i < 6; i++) { const L = (7 + r() * 3) * u * s; leaps.push({ t0: t + (i % 3) * .28, d: 1.05 + r() * .2, x: x + (i % 3) * 2.6 * u * s * -dir, y: y + (i % 3) * .6 * u, L, h: (3 + r() * 1.6) * u * s, s: s * (1 - (i % 3) * .08) }); if (i % 3 === 2) { x += dir * L * 1.25; t += 1.7 + r() * .4; } } pl.water = { k: wtK, dir, leaps }; }
    else if (wtK === "none") pl.water = { k: wtK }; /* the seaplane has the water to itself */
    else { const dir = r() < .5 ? 1 : -1; pl.water = { k: wtK, t0: 5.0, t1: 14.6, dir, s: pr ? 1.35 : 1.55, x: sx + (r() - .5) * R * .5, y: hz + (H - hz) * (.26 + r() * .08) }; }
    if (pl.sky.k === "pelican" && (pl.sun.k === "liner" || pl.sun.k === "junk")) { /* it dives clear of the ship going by */
      const b = pl.sky, n = pl.sun, td = b.t0 + b.g3, shipX = lerp(n.xs, n.xe, clamp((td - n.t0) / (n.t1 - n.t0))), gap = (n.k === "junk" ? 7.4 : 8.6) * u * n.s + 8 * u;
      if (Math.abs(shipX - b.xd) < gap) { b.xd = shipX + (b.xd >= shipX ? 1 : -1) * gap; b.xa = b.xd - b.dir * 5 * u; b.xb = b.xd - b.dir * 2.2 * u; } }
    // to close
    if (clK === "flare") { const t = (r() - .5) * 1.2; pl.close = { k: clK, f: [10.6 + t, 11.2 + t, 12.0 + t, 13.0 + t], fx: [10.6 + t, 13.0 + t], g: [10.8 + t, 11.6 + t, 12.6 + t, 13.6 + t] }; }
    else if (clK === "run") { const t0 = 10.2 + r() * .8; pl.close = { k: clK, runs: [t0, t0 + 1.2 + r() * .4] }; }
    else { const fish = [], dir = r() < .5 ? 1 : -1, n = 4 + Math.floor(r() * 3), y0 = hz + (H - hz) * (.14 + r() * .1), s = pr ? 1.15 : 1.05; for (let i = 0; i < n; i++) { const span = R * (1.6 + r() * .8), x0 = sx - dir * span / 2 + (r() - .5) * R * .4; fish.push({ t0: 10.0 + i * .25 + r() * .25, d: 1.9 + r() * .4, /* the last rings gone by 14.9 */ xs: x0, xe: x0 + dir * span, y: y0 + (r() - .5) * 2.4 * u, h: (2.2 + r() * 1.4) * u * s, hops: 2 + Math.floor(r() * 2), s }); } pl.close = { k: clK, fish }; }
    return pl;
  }
  function dealDusk(pass) {
    const { W, H, u, hz, pr } = S;
    if (pass <= 0) return { pass, gen, prick: [.2, 2.6, 13.3, 14.9], // the first pass: the loop, beat for beat
      head: { k: "cascade", first: { t0: 2.4, t1: 9.4, x: .5, c: 0 }, casc: S.cascade },
      water: { k: "egret", away: [9.0, 11.3], home: [12.3, 14.6], land: [14.2, 15.0], rip: [9.0, 12.0] },
      sky: { k: "fall", t: [11.2, 12.1], x: [.38, .7], y: [.2, .4] } };
    const r = K.deal(pass, 7500), rare = K.bag(pass, 8, 7501), pick = (list, salt) => list[K.bag(pass, list.length, salt)], pl = { pass, gen };
    { const t = (r() - .3) * .8; pl.prick = [.2 + Math.max(0, t), 2.6 + t, 13.3, 14.9]; }
    const hdK = pick(["cascade", "flotilla", "twin"], 7502), wtK = rare === 2 ? "glow" : pick(["egret", "fishing", "row", "fireflies"], 7503), skK = rare === 1 ? "meteors" : pick(["fall", "bats", "beam", "veil"], 7504);
    const col = K.bag(pass, 4, 7505), lc = i => col < 3 ? col : i % 3; // orange, rose, gold, or all three
    // the lanterns
    if (hdK === "cascade") { const n = pr ? 18 : 28, from = r() < .34 ? -1 : r() < .5 ? 1 : 0, t0 = 4.2 + r() * .6, casc = []; for (let i = 0; i < n; i++) { const z = .15 + r() * .85, x0 = r(), x = from < 0 ? x0 * .6 : from > 0 ? .4 + x0 * .6 : x0; casc.push({ x, z, ph: r() * TAU, sw: .5 + r() * 1.2, start: t0 + (from ? (from < 0 ? x / .6 : (1 - x) / .6) * 3.0 : i / n * 3.2) + r() * .4, c: lc(i) }); } /* the last away by the time the loop comes round, as the first pass's are */
      pl.head = { k: hdK, first: { t0: 2.0 + r() * .8, t1: 9.0 + r() * .6, x: .35 + r() * .3, c: lc(0) }, casc }; }
    else if (hdK === "twin") { const n = pr ? 16 : 28, t0 = 3.2 + r() * .6, casc = []; for (let i = 0; i < n; i++) { const side = i % 2, z = .15 + r() * .7, x = side ? .72 + r() * .26 : .02 + r() * .26; casc.push({ x, z, ph: r() * TAU, sw: .5 + r() * 1.2, start: t0 + Math.floor(i / 2) / (n / 2) * 4.0 + r() * .4, c: lc(i), dx: side ? -(.1 + r() * .12) : .1 + r() * .12 }); } pl.head = { k: hdK, casc }; }
    else { const n = pr ? 11 : 16, lan = [], dir = r() < .5 ? 1 : -1, t0 = 2.4 + r() * .6; for (let i = 0; i < n; i++) { const f = (i + r() * .6) / n, x = dir > 0 ? W * (.04 + f * .92) : W * (.96 - f * .92), depth = .08 + r() * .5, s = lerp(.55, 1.25, depth / .58); lan.push({ t0: t0 + f * 3.4 + r() * .3, out: 11.2 + f * 1.6 + r() * .4, x, y: hz + (H - hz) * depth, vx: dir * (2 + r() * 4) * u * .1 * (1 + depth), s, ph: r() * TAU }); } pl.head = { k: hdK, lan }; }
    // on the water
    if (wtK === "egret") { const t = (r() - .5) * .8; pl.water = { k: wtK, away: [9.0 + t, 11.3 + t], home: [12.3 + t * .5, 14.6], land: [14.2, 15.0], rip: [9.0 + t, 12.0 + t] }; }
    else if (wtK === "fishing") pl.water = { k: wtK, ts: 8.6 + r() * 2 };
    else if (wtK === "row") { /* along the shore from the left, flushing the egret, which flies off ahead of it and comes home behind; or far out across the bay, behind it */
      const near = r() < .55, dir = near ? 1 : -1, s = (pr ? 1.35 : 1.4) * (near ? 1 : .72), t0 = near ? 3.4 + r() * .8 : 3.0 + r(), t1 = 14.3, m = 3.95 * u * s + S.lr * 3.4 * .9 * s + 2 * u, /* its lantern's glow ahead of it, too */
        xs = dir > 0 ? -m : W + m, xe = dir > 0 ? W + m : -m, row = { k: wtK, far: !near, t0, t1, dir, s, ph: r() * TAU, y: hz + (H - hz) * (near ? .5 + r() * .1 : .09 + r() * .05), xs, xe, c: lc(0) };
      if (near) { const tf = t0 + (S.egret.x - 11.95 * u * s - xs) / (xe - xs) * (t1 - t0); Object.assign(row, { flush: true, away: [tf, tf + 2.3], home: [12.3, 14.6], land: [14.2, 15.0], rip: [tf, tf + 3.0] }); }
      pl.water = row; }
    else if (wtK === "fireflies") { const flies = []; for (let i = 0; i < (pr ? 12 : 18); i++) { const side = r() < .5 ? S.left : S.right, p = side[Math.floor(side.length * (side === S.left ? .55 + r() * .45 : r() * .45))]; flies.push({ x: p[0] + (r() - .5) * 4 * u, y: lerp(p[1], hz, .5 + r() * .5) - r() * 2 * u, ax: (1 + r() * 3) * u, ay: (.6 + r() * 1.5) * u, f1: .3 + r() * .5, f2: .4 + r() * .6, p1: r() * TAU, p2: r() * TAU, fb: .9 + r() * .9, pb: r() * TAU }); } pl.water = { k: wtK, t0: 8.4 + r() * .8, t1: 14.6, flies }; }
    else { const waves = []; for (let i = 0; i < 7; i++) { const y = hz + (H - hz) * (.06 + i * .1 + r() * .04), /* clear of the footer's pool */ t0 = 7 + i * .55 + r() * .4; waves.push({ t0, d: 2.6 + r() * .6, y, xa: -2 * u, xb: W + 2 * u, x0: r() < .5 ? -W * .2 : W * 1.2, x1: 0, f: .01 + r() * .015, amp: (.3 + r() * .5) * u, band: W * (pr ? .14 : .08) * (1 + r() * .4) }); waves[i].x1 = waves[i].x0 < 0 ? W * 1.2 : -W * .2; } pl.water = { k: "glow", waves }; }
    // in the sky
    if (skK === "fall") { const t = 10.4 + r() * 1.6, m = r() < .5, x0 = .3 + r() * .2, y0 = .14 + r() * .1; pl.sky = { k: skK, t: [t, t + .9], x: m ? [1 - x0, 1 - x0 - .32] : [x0, x0 + .32], y: [y0, y0 + .2] }; }
    else if (skK === "bats") { const bats = [], dir = r() < .5 ? 1 : -1; for (let i = 0; i < (pr ? 4 : 6); i++) { const t0 = 8.6 + i * .3 + r() * .4; bats.push({ t0, d: 3.0 + r() * 1.0, /* the last off the far edge by 14.5 */ xs: dir > 0 ? -3 * u : W + 3 * u, xe: dir > 0 ? W + 3 * u : -3 * u, y: S.moon.y + (r() - .5) * H * .12, w1: 3 + r() * 5, p1: r() * TAU, a1: (2 + r() * 4) * u, w2: 2 + r() * 4, p2: r() * TAU, a2: (2 + r() * 4) * u, ph: r() * 3, s: (pr ? .75 : .65) * (.8 + r() * .4) }); } pl.sky = { k: skK, bats }; }
    else if (skK === "beam") { const x0 = S.right[0][0], want = x0 + (W - x0) * .22, p = S.right.reduce((a, q) => Math.abs(q[0] - want) < Math.abs(a[0] - want) ? q : a); pl.sky = { k: skK, t0: 8.6 + r() * .8, t1: 14.4, at: [p[0], p[1] - .5 * u], a0: -Math.PI * (.05 + r() * .1), spin: .75 + r() * .15 }; /* it turns to face us (a flare), then sweeps across the bay, then away */ } /* a lighthouse out on the point of the right headland, well away from the words */
    else if (skK === "veil") { const dir = r() < .5 ? 1 : -1, w = 30 * u, edge = W + w * .5 + 2 * u, far = S.moon.x - (w * .5 + S.moon.r * 3); pl.sky = { k: skK, t0: 8.8 + r() * .8, t1: 14.4, dir, dy: (r() - .45) * S.moon.r * 1.6, x0: dir < 0 ? edge : far, x1: dir < 0 ? far : edge }; }
    else { const ms = [], vx = (r() < .5 ? 1 : -1) * W * .16, vy = H * .12; for (let i = 0; i < 13; i++) ms.push({ t0: 9.2 + i * .3 + r() * .25, d: .55 + r() * .3, x: W * (vx > 0 ? .3 + r() * .5 : .2 + r() * .5), y: H * (.14 + r() * .18), /* their tails reach back up: clear of the bar */ vx: vx * (.8 + r() * .4), vy: vy * (.8 + r() * .4), len: (8 + r() * 10) * u, w: .8 + r() * .9 }); pl.sky = { k: skK, ms }; }
    return pl;
  }
  /* ---------------- 1.12 b415: the egg ---------------- */
  /** the egg's pass: none of the dealt beats, only the bay's quiet life — the egg is the pass */
  function eggPlan(pass) {
    const no = 99, quiet = [no, no + 1, no + 2, no + 3];
    return dusk ? { pass, gen, egg: true, prick: quiet, head: { k: "none" }, water: { k: "none" }, sky: { k: "none" } }
      : { pass, gen, egg: true, q: quiet, h: quiet, sky: { k: "flock", t0: no, t1: no + 1, dir: 1, dy: 0, tail: 0, flock: [] }, sun: { k: "none" }, water: { k: "none" }, close: { k: "none" } };
  }
  let EG = null; // what the egg draws with, made when its pass first comes up (and again after a layout)

  /* Sunset's: the sun goes all the way down, and as its last sliver meets the sea it turns green — the green flash; the
     night comes on in a breath, stars and all, and goes again, and the sun comes back up to where it was */
  const ES = { set: [1.0, 8.0], tint: [7.12, 7.6], flash: [7.35, 7.6, 7.9, 8.6], dark: [1.4, 8.05, 10.1, 10.9, 14.2], rise: [11.0, 14.3], meteor: [9.9, 10.5] };
  /** where the sun is in its going down and coming up, as fractions of its glow, its light on the water and the dark. It
   *  goes down steadily and slows for its last sliver, which slips under at a few pixels a second, so the flash has time */
  function eggSun(T, I) {
    const R = S.sun.R, v = seg(T, ES.set[0], ES.set[1], x => x), m1 = 13 * (ES.set[1] - ES.set[0]), down = (R + 4) * (3 * v * v - 2 * v * v * v) + m1 * (v * v * v - v * v);
    const dy = down * (1 - seg(T, ES.rise[0], ES.rise[1], E.out)) * I, h = R - dy;
    const d = ES.dark, night = (T < d[1] ? .32 * seg(T, d[0], d[1], E.sine) : T < d[2] ? lerp(.32, .9, seg(T, d[1], d[2], E.sine)) : T < d[3] ? .9 : .9 * (1 - seg(T, d[3], d[4], E.sine))) * I;
    const dawn = env(T, d[3], d[3] + 1.6, d[4] - 1.4, d[4], E.sine) * I;
    return { dy, h, night, dawn, vis: Math.pow(clamp(h / R), .6), glow: clamp(.12 + .88 * clamp((h + R * .5) / (R * 1.5))) * (1 - .7 * night), tint: seg(T, ES.tint[0], ES.tint[1], E.sine) * (T < ES.flash[3] ? 1 : 0) * I, flash: env(T, ES.flash[0], ES.flash[1], ES.flash[2], ES.flash[3], E.sine) * I };
  }
  /** over the sun and the sea: the dark coming on (or the dawn's pink), the stars, a star falling, and the flash */
  function eggSunset(T, I, A, ev, sx, sy, R) {
    const { W, H, u, hz, pr } = S;
    if (ev.h > .2 && ev.h < R * .55) { const k = Math.pow(1 - ev.h / (R * .55), 1.4) * (1 - ev.tint) * I; if (k > .004) { g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip(); g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.clip(); g.globalAlpha = .62 * k; g.fillStyle = "#FF4A2E"; g.fillRect(sx - R, sy - R, R * 2, R); g.restore(); g.globalAlpha = 1; } } // the last of it red as it nears the sea
    if (!EG || EG.gen !== gen) { const r = rng(4021); EG = { gen, stars: Array.from({ length: pr ? 70 : 130 }, () => ({ x: r() * W, y: H * .05 + r() * (hz * .82 - H * .05), s: .6 + r() * 1.1, f: .6 + r() * 1.6, ph: r() * TAU, on: r() })), glowG: glow(R * .62, [70, 255, 150], .9), glowW: glow(R * .3, [210, 255, 220], .9) }; }
    // the dark: deepest overhead, a little warmth left along the horizon; by dawn a rose glow comes up into it
    if (ev.night > .004) { const n = ev.night, dw = ev.dawn, gr = g.createLinearGradient(0, 0, 0, H), c = (r0, g0, b0, a) => `rgba(${Math.round(lerp(r0, 120, dw * .55))},${Math.round(lerp(g0, 46, dw * .55))},${Math.round(lerp(b0, 98, dw * .55))},${(a * n).toFixed(3)})`;
      gr.addColorStop(0, c(6, 4, 24, .93)); gr.addColorStop(hz / H * .55, c(12, 8, 40, .86)); gr.addColorStop(hz / H * .97, c(34, 14, 54, .64 - dw * .2)); gr.addColorStop(hz / H, c(28, 12, 48, .7)); gr.addColorStop(Math.min(1, hz / H + .04), c(10, 6, 28, .82)); gr.addColorStop(1, c(4, 2, 14, .9));
      g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    // the stars, coming out one by one as it gets dark (and going as it gets light)
    const sv = clamp((ev.night - .45) / .4); if (sv > .005) { g.fillStyle = "#FFF1E6"; for (const s of EG.stars) { const k = clamp((sv - s.on * .7) / .3); if (k <= 0) continue; const tw = .55 + .45 * Math.pow(Math.max(0, Math.sin(A * s.f + s.ph)), 2); g.globalAlpha = k * tw * S.shade(s.x, s.y, 4); g.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s); } }
    // and a star falls, high up and clear of the words
    { const k = seg(T, ES.meteor[0], ES.meteor[1], E.in); if (k > 0 && k < 1 && sv > .3) { const x0 = W * (pr ? .78 : .7), y0 = H * (pr ? .06 : .09), x = lerp(x0, x0 + W * (pr ? .14 : .12), k), y = lerp(y0, y0 + H * .1, k), tx = -W * .05, ty = -H * .04, fa = sv * (1 - k) * S.shade(x, y, 12 * u);
      const gr = g.createLinearGradient(x, y, x + tx, y + ty); gr.addColorStop(0, `rgba(255,250,240,${(.9 * fa).toFixed(3)})`); gr.addColorStop(1, "rgba(255,220,200,0)"); g.globalAlpha = 1; g.strokeStyle = gr; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + tx, y + ty); g.stroke(); } }
    g.globalAlpha = 1;
    // the green flash: the last sliver greens from its top down; as it slips under, a lens of green stands just off the sea
    // a moment (the mirage lifts it), with a bloom about it, a ray straight up and its light in the water; then it is gone
    const f = ev.flash, tn = ev.tint; if (f > .004 || tn > .004) {
      const hh = Math.max(ev.h, 0), half = Math.sqrt(Math.max(0, 2 * R * hh - hh * hh));
      if (hh > .2 && tn > .004) { g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip(); g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.clip();
        const gr = g.createLinearGradient(0, sy - R, 0, hz); gr.addColorStop(0, `rgba(70,255,150,${tn.toFixed(3)})`); gr.addColorStop(Math.min(.98, .3 + .7 * tn), `rgba(150,255,175,${(tn * .9).toFixed(3)})`); gr.addColorStop(1, `rgba(230,255,190,${(tn * .25).toFixed(3)})`); g.fillStyle = gr; g.fillRect(sx - R, sy - R, R * 2, R + 4); g.restore(); }
      if (f > .004) {
        g.save(); g.clip(S.headClip, "evenodd"); g.globalCompositeOperation = "lighter"; { const gw = EG.glowG.w2 * 2.3, gh = EG.glowG.h2 * .42, ww = EG.glowW.w2 * 1.9, wh = EG.glowW.h2 * .5; g.globalAlpha = f * .8; g.drawImage(EG.glowG, sx - gw / 2, hz - 2 - gh / 2, gw, gh); g.globalAlpha = f * .65; g.drawImage(EG.glowW, sx - ww / 2, hz - 2 - wh / 2, ww, wh); } g.restore(); // its bloom, along the sea
        g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip();
        const rx = Math.max(half, R * .17) * (.85 + .15 * f), ry = (1.2 + 1.3 * f) * (pr ? .8 : 1), ly = hz - ry - .4 - (1 - f) * 1.5;
        g.fillStyle = `rgba(80,255,160,${f.toFixed(3)})`; g.beginPath(); g.ellipse(sx, ly, rx, ry, 0, 0, TAU); g.fill(); g.fillStyle = `rgba(232,255,240,${(f * .9).toFixed(3)})`; g.beginPath(); g.ellipse(sx, ly, rx * .55, ry * .45, 0, 0, TAU); g.fill(); // the lens of green, its white heart
        const rh = R * (.45 + .55 * f), rw = Math.max(1.3, R * .014), gr2 = g.createLinearGradient(0, ly, 0, ly - rh); gr2.addColorStop(0, `rgba(190,255,210,${(.9 * f).toFixed(3)})`); gr2.addColorStop(.25, `rgba(100,255,165,${(.5 * f).toFixed(3)})`); gr2.addColorStop(1, "rgba(60,255,150,0)");
        g.fillStyle = gr2; g.fillRect(sx - rw / 2, ly - rh, rw, rh); g.globalAlpha = .3; g.fillRect(sx - rw * 3, ly - rh * .5, rw * 6, rh * .5); g.globalAlpha = 1; // its ray
        const ew = rx * (1.6 + 1.6 * f), gr3 = g.createLinearGradient(sx - ew, 0, sx + ew, 0); gr3.addColorStop(0, "rgba(120,255,180,0)"); gr3.addColorStop(.5, `rgba(200,255,215,${(.85 * f).toFixed(3)})`); gr3.addColorStop(1, "rgba(120,255,180,0)"); g.fillStyle = gr3; g.fillRect(sx - ew, hz - 1.4, ew * 2, 1.4); // and along the sea
        g.restore();
        g.save(); g.globalCompositeOperation = "lighter"; g.fillStyle = "#7DFFB4"; for (let k = 0; k < 6; k++) { const y = hz + 2 + k * k * .55 * u * (pr ? 1.2 : 1), w = (rx * 1.1 + R * .08) * (1 - k * .13) * (.7 + .3 * Math.sin(A * 6 + k * 1.7)); g.globalAlpha = f * (.6 - k * .08); g.fillRect(sx - w / 2 + Math.sin(A * 3 + k) * .4 * u, y, w, 1 + (k < 2 ? 1 : 0)); } g.restore(); // in the water
      }
    }
  }

  /* Dusk's: the lantern dragon. A dragon of paper lanterns — the festival's dragon dance, flying by itself — rises from behind
     a headland, skims the bay with its light in the water, climbs and winds itself once round the moon like the pearl it
     chases, and flies off past the edge, sparks falling from it */
  const ED = { t: [1.1, 13.9] };
  /** the dragon's route, made once per layout: a curve through the points it flies by, one turn round the moon, and off;
   *  resampled every two pixels, with the way it faces and whether it rolls over to keep its back to the sky */
  function dragonMake() {
    const { W, H, u, hz, pr } = S, mo = S.moon, lr = S.lr, r = pr ? 68 * u / 5.74 * .99 : mo.r * 4.2, pts = [];
    const loop = (cx, cy, rad, a0, n) => { for (let i = 0; i <= n; i++) { const a = a0 - i / n * TAU; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } };
    if (!pr) { // up from behind the right headland, down to skim the bay leftward, up and round to the right, once round the moon, away right
      const cy = mo.y + r * .92; // its circle hangs from the moon: the top of it passes across the moon's face, clear of the bar's words
      pts.push([W * .95, hz - 3 * u], [W * .87, hz - 7 * u], [W * .75, hz + 1.2 * u], [W * .6, hz + 3 * u], [W * .47, hz + 4 * u], [W * .4, hz + 7 * u], [W * .45, hz + 10.5 * u], [W * .6, hz + 11 * u], [W * .73, hz + 8 * u], [W * .79, hz - 2 * u], [W * .74, H * .6], [mo.x - r * .72, cy + r * 1.02]);
      loop(mo.x, cy, r, Math.PI / 2, 24); pts.push([mo.x + r * 1.45, cy + r * .35], [W + 9 * u, cy - r * .35]);
    } else { // up from behind the right headland by the palms, out along the far water, round toward us, back along the near water, up the open edge, once round the moon, away right
      pts.push([W * .9, hz - 3 * u], [W * .79, hz - 9 * u], [W * .62, hz + 2 * u], [W * .4, hz + 4 * u], [W * .2, hz + 5.5 * u], [W * .1, hz + 9.5 * u], [W * .26, hz + 14 * u], [W * .55, hz + 15 * u], [W * .8, hz + 11 * u], [W * .95, hz - 4 * u], [W * .93, H * .42], [mo.x + r, mo.y + r * .55]);
      loop(mo.x, mo.y, r, 0, 24); pts.push([mo.x + r * .9, mo.y - r * 1.05], [W + 7 * u, mo.y - r * 1.5]);
    }
    // a Catmull–Rom curve through them, resampled by arc length
    const dense = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < 16; k++) { const t = k / 16, t2 = t * t, t3 = t2 * t, f = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3); dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); } }
    dense.push(pts[pts.length - 1]);
    const X = [], Y = [], step = 2; let acc = 0, need = 0; X.push(dense[0][0]); Y.push(dense[0][1]);
    for (let i = 1; i < dense.length; i++) { const [ax, ay] = dense[i - 1], [bx, by] = dense[i], l = Math.hypot(bx - ax, by - ay); while (need + step <= acc + l) { need += step; const k = (need - acc) / l; X.push(lerp(ax, bx, k)); Y.push(lerp(ay, by, k)); } acc += l; }
    const n = X.length, A2 = new Float32Array(n), roll = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2); A2[i] = Math.atan2(Y[b] - Y[a], X[b] - X[a]); }
    // its back to the sky: rolled over while it flies leftward (a wide screen's swoop), righting itself in the turn
    let turn = -1, lo = 1e9; for (let i = 0; i < n * .5; i++) if (X[i] < lo) { lo = X[i]; turn = i; }
    const tw = pr ? 26 : 40; for (let i = 0; i < n; i++) roll[i] = i < turn - tw ? -1 : i > turn + tw ? 1 : -Math.cos(Math.PI * (i - turn + tw) / (tw * 2));
    // what it is made of: lit paper, sized to the lanterns
    const lantern = (k, gold) => make(lr * 2.6 * k, lr * 2.6 * k, x => { const c = lr * 1.3 * k, rx = lr * .82 * k, ry = lr * .7 * k;
      x.fillStyle = gold ? "#FFD27A" : "#FFC45C"; x.beginPath(); x.moveTo(c - rx * .45, c - ry * .78); x.quadraticCurveTo(c - rx * .1, c - ry * 1.75, c + rx * .5, c - ry * 1.62); x.quadraticCurveTo(c + rx * .1, c - ry * 1.15, c + rx * .45, c - ry * .8); x.closePath(); x.fill(); // its fin
      x.fillStyle = "#C2402A"; x.beginPath(); x.moveTo(c - rx * .45, c - ry * .78); x.quadraticCurveTo(c - rx * .05, c - ry * 1.4, c + rx * .5, c - ry * 1.62); x.quadraticCurveTo(c - rx * .2, c - ry * 1.12, c - rx * .1, c - ry * .8); x.closePath(); x.fill();
      const gr = x.createRadialGradient(c + rx * .05, c + ry * .25, 0, c, c, rx * 1.05); /* red, and gold, by turns: the festival's dragon */
      if (gold) { gr.addColorStop(0, "#FFFBE6"); gr.addColorStop(.42, "#FFD877"); gr.addColorStop(.8, "#F29A3A"); gr.addColorStop(1, "#C2602A"); } else { gr.addColorStop(0, "#FFF2D2"); gr.addColorStop(.36, "#FFB25C"); gr.addColorStop(.74, "#EC5A34"); gr.addColorStop(1, "#AE2A26"); }
      x.fillStyle = gr; x.beginPath(); x.ellipse(c, c, rx, ry, 0, 0, TAU); x.fill();
      x.strokeStyle = "rgba(150,52,24,.42)"; x.lineWidth = Math.max(.6, lr * .055 * k); for (const f of [-.42, 0, .42]) { x.beginPath(); x.ellipse(c + f * rx, c, rx * .16, ry * .96, 0, 0, TAU); x.stroke(); } // its ribs
      x.fillStyle = "rgba(255,246,214,.55)"; x.beginPath(); x.ellipse(c, c + ry * .55, rx * .62, ry * .2, 0, 0, TAU); x.fill(); // its belly, lightest where the flame is
      x.fillStyle = "#7A2A20"; x.fillRect(c - rx * 1.02, c - ry * .4, rx * .1, ry * .8); x.fillRect(c + rx * .92, c - ry * .4, rx * .1, ry * .8); }); // its rims
    const D = { gen, X, Y, A: A2, roll, n, step, lr, N: pr ? 13 : 18, sp: lr * (pr ? 1.18 : 1.25) };
    D.segs = [lantern(1, false), lantern(1, true)]; D.L = (n - 1) * step;
    D.head = make(lr * 4.4, lr * 3.2, x => { const o = [lr * .7, lr * 1.75]; x.translate(o[0], o[1]); // its neck at the origin, facing +x
      for (let k = 0; k < 6; k++) { const a = -2.1 - k * .22, l = lr * (1.05 + (k % 2) * .35); x.fillStyle = k % 2 ? "#FFD27A" : "#F2823A"; x.beginPath(); x.moveTo(lr * .55, -lr * .2); x.quadraticCurveTo(lr * .35 + Math.cos(a) * l * .5, -lr * .35 + Math.sin(a) * l * .6, lr * .2 + Math.cos(a) * l, Math.sin(a) * l * .9); x.quadraticCurveTo(lr * .2 + Math.cos(a) * l * .4, Math.sin(a) * l * .3, lr * .1, lr * .25); x.closePath(); x.fill(); } // its mane
      x.strokeStyle = "#FFE9B0"; x.lineCap = "round"; x.lineWidth = lr * .13; for (const [dx, dy] of [[0, 0], [.22, .06]]) { x.beginPath(); x.moveTo(lr * (1.05 + dx), -lr * (.5 + dy)); x.quadraticCurveTo(lr * (.7 + dx), -lr * (1.15 + dy), lr * (.05 + dx), -lr * (1.15 + dy)); x.stroke(); x.beginPath(); x.moveTo(lr * (.62 + dx), -lr * (.98 + dy)); x.lineTo(lr * (.45 + dx), -lr * (1.4 + dy)); x.stroke(); } // its horns
      const gr = x.createRadialGradient(lr * 1.3, lr * .15, 0, lr * 1.25, 0, lr * 1.6); gr.addColorStop(0, "#FFF8D8"); gr.addColorStop(.38, "#FFC663"); gr.addColorStop(.75, "#F2823A"); gr.addColorStop(1, "#C24A2C");
      const skull = new Path2D(); skull.moveTo(lr * .1, -lr * .45); skull.quadraticCurveTo(lr * .6, -lr * .95, lr * 1.35, -lr * .62); skull.quadraticCurveTo(lr * 1.85, -lr * .45, lr * 2.75, -lr * .32); skull.quadraticCurveTo(lr * 3.25, -lr * .3, lr * 3.2, lr * .05); skull.lineTo(lr * 2.6, lr * .12); skull.quadraticCurveTo(lr * 1.6, lr * .25, lr * 1.25, lr * .55); skull.quadraticCurveTo(lr * .55, lr * .72, lr * .1, lr * .45); skull.closePath();
      const jaw = new Path2D(); jaw.moveTo(lr * 1.15, lr * .5); jaw.quadraticCurveTo(lr * 1.9, lr * .42, lr * 2.75, lr * .52); jaw.quadraticCurveTo(lr * 2.9, lr * .62, lr * 2.7, lr * .78); jaw.quadraticCurveTo(lr * 1.8, lr * .95, lr * 1.0, lr * .78); jaw.closePath();
      x.fillStyle = "#FFF4DC"; x.beginPath(); for (let k = 0; k < 5; k++) { const tx2 = lr * (1.75 + k * .2); x.moveTo(tx2, lr * .18); x.lineTo(tx2 + lr * .08, lr * .42); x.lineTo(tx2 + lr * .16, lr * .18); } x.fill(); // its teeth
      x.fillStyle = gr; x.fill(jaw); x.fill(skull);
      x.strokeStyle = "rgba(150,52,24,.45)"; x.lineWidth = Math.max(.6, lr * .05); x.stroke(skull); for (const f of [.75, 1.45, 2.15]) { x.beginPath(); x.moveTo(lr * f, -lr * (.75 - f * .16)); x.quadraticCurveTo(lr * (f + .1), -lr * .1, lr * (f - .05), lr * (.45 - f * .05)); x.stroke(); } // the frame of it
      x.fillStyle = "#FFF6E0"; x.beginPath(); x.ellipse(lr * 1.62, -lr * .3, lr * .24, lr * .15, -.25, 0, TAU); x.fill(); x.fillStyle = "#2A1020"; x.beginPath(); x.arc(lr * 1.68, -lr * .31, lr * .1, 0, TAU); x.fill(); x.fillStyle = "#FFFFFF"; x.beginPath(); x.arc(lr * 1.71, -lr * .35, lr * .035, 0, TAU); x.fill(); // its eye
      x.strokeStyle = "#7A2A20"; x.lineWidth = lr * .09; x.beginPath(); x.moveTo(lr * 1.3, -lr * .45); x.quadraticCurveTo(lr * 1.6, -lr * .68, lr * 1.95, -lr * .5); x.stroke(); // its brow
      x.fillStyle = "#7A2A20"; x.beginPath(); x.arc(lr * 3.02, -lr * .14, lr * .06, 0, TAU); x.fill(); // its nostril
      x.fillStyle = "#FFD27A"; for (let k = 0; k < 4; k++) { const bx = lr * (1.3 + k * .32); x.beginPath(); x.moveTo(bx, lr * .78); x.lineTo(bx - lr * .22, lr * (1.15 + (k % 2) * .2)); x.lineTo(bx + lr * .18, lr * .8); x.closePath(); x.fill(); } }); // its beard
    D.head.o = [lr * .7, lr * 1.75];
    D.tail = make(lr * 2.4, lr * 2.4, x => { const c = lr * 1.2; for (let k = 0; k < 5; k++) { const a = Math.PI + (k - 2) * .38, l = lr * (1.05 - Math.abs(k - 2) * .18); x.fillStyle = k % 2 ? "#FFD27A" : "#F2823A"; x.beginPath(); x.moveTo(c + lr * .15, c - lr * .12); x.quadraticCurveTo(c + Math.cos(a) * l * .5, c + Math.sin(a) * l * .5 - lr * .12, c + Math.cos(a) * l, c + Math.sin(a) * l); x.quadraticCurveTo(c + Math.cos(a) * l * .45, c + Math.sin(a) * l * .45 + lr * .12, c + lr * .15, c + lr * .12); x.closePath(); x.fill(); } });
    D.glow = glow(lr * 3, [255, 170, 80], .55); D.spark = glow(Math.max(2, lr * .3), [255, 226, 150], .95);
    D.legs = pr ? [3, 8] : [3, 10];
    D.leg = make(lr * 1.6, lr * 1.6, x => { const o = lr * .3; x.translate(o, o); x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#E86A2E"; x.lineWidth = lr * .26; x.beginPath(); x.moveTo(0, 0); x.lineTo(lr * .38, lr * .55); x.lineTo(lr * .12, lr * .95); x.stroke(); // a leg, from its hip down and back
      x.strokeStyle = "#FFD27A"; x.lineWidth = lr * .09; for (const a of [-.5, 0, .5]) { x.beginPath(); x.moveTo(lr * .12, lr * .95); x.lineTo(lr * .12 + Math.sin(a) * lr * .28 - lr * .12, lr * .95 + Math.cos(a) * lr * .26); x.stroke(); } }); // its claws
    D.leg.o = lr * .3;
    // the headlands it rises from behind: what is drawn outside them
    { const c = new Path2D(); c.rect(-20, -20, W + 40, H + 40); for (const pts2 of [S.left, S.right]) { c.moveTo(pts2[0][0], hz + 1); for (const p of pts2) c.lineTo(p[0], Math.min(hz + 1, p[1])); c.lineTo(pts2[pts2.length - 1][0], hz + 1); c.closePath(); } D.clip = c; }
    return D;
  }
  /** the dragon at loop time T: its head along the route, each lantern of it where the head was a little before, swaying */
  function eggDragon(T, I, A) {
    if (I <= .01 || T <= ED.t[0] || T >= ED.t[1]) return;
    if (!EG || EG.gen !== gen) EG = { gen, D: dragonMake() };
    const D = EG.D, { u, hz, pr } = S, lr = D.lr, total = D.L + D.sp * (D.N + 1.5), sh = total * E.sine(seg(T, ED.t[0], ED.t[1], x => x));
    const at = s => { const k = clamp(s / D.step, 0, D.n - 1), i = Math.floor(k), f = k - i, j = Math.min(D.n - 1, i + 1); return [lerp(D.X[i], D.X[j], f), lerp(D.Y[i], D.Y[j], f), D.A[i], D.roll[i]]; };
    const near = y => 1 + .45 * clamp((y - hz) / (S.H - hz)); // over the near water it is nearer: larger
    const body = []; for (let i = 0; i <= D.N; i++) { const s = sh - i * D.sp - (i ? lr * .55 : 0), [x, y, a, rl] = at(s), w = Math.sin(A * 3.1 - i * .62) * lr * .28 * Math.min(1, i / 3); body.push([x - Math.sin(a) * w, y + Math.cos(a) * w, a + Math.cos(A * 3.1 - i * .62) * .18 * Math.min(1, i / 3), rl, s, near(y)]); }
    g.save(); g.clip(D.clip, "evenodd");
    // its light: glows on the air, and in the water under it
    g.globalCompositeOperation = "lighter";
    for (let i = D.N - (D.N % 2); i >= 0; i -= 2) { const [x, y, , , s, nz] = body[i]; if (s < 0) continue; const k = (i ? 1 - .55 * i / D.N : 1.25) * nz * 1.12, a = I * S.shade(x, y, lr * 2.6 * k) * (.85 + .15 * Math.sin(A * 9 + i * 1.7)), gw = D.glow; /* every other lantern's, the stronger: they overlap */
      g.globalAlpha = a * .8; g.drawImage(gw, x - gw.w2 * k / 2, y - gw.h2 * k / 2, gw.w2 * k, gw.h2 * k);
      const ry = y < hz ? hz + (hz - y) * .45 : y + 3 * u, fade = y < hz ? 1 - clamp((hz - y) / (S.H * .26)) : 1; if (fade > .01) { g.globalAlpha = a * .45 * fade; g.drawImage(gw, x - gw.w2 * k * .55 + Math.sin(A * 3 + i) * .6 * u, ry - gw.h2 * k * .12, gw.w2 * k * 1.1, gw.h2 * k * .24); } }
    // sparks falling from it
    g.fillStyle = "#FFE29A"; for (let j = 0; j < 22; j++) { const P2 = .9 + (j % 5) * .13, born = Math.floor((T - j * .173) / P2) * P2 + j * .173, age = T - born; if (born < ED.t[0] + .4) continue;
      const s0 = total * E.sine(seg(born, ED.t[0], ED.t[1], x => x)) - (1 + j % (D.N - 1)) * D.sp, [x0, y0] = at(s0); if (s0 < 0 || s0 > D.L) continue; const x = x0 + Math.sin(j * 2.3) * lr * .9 * age, y = y0 + age * age * 3.2 * u + age * u, a = I * (1 - age / P2) * S.shade(x, y, 2 * u);
      if (a > .02) { g.globalAlpha = a; g.drawImage(D.spark, x - D.spark.w2 / 2, y - D.spark.h2 / 2); } }
    g.globalCompositeOperation = "source-over";
    // the tail, the lanterns from the tail up, the head and its whiskers
    { const [x, y, a, rl, , nz] = body[D.N]; if (body[D.N][4] >= 0) { g.globalAlpha = I * S.shade(x, y, lr * 2); g.save(); g.translate(x, y); g.rotate(a); g.scale(.62 * nz, rl * .62 * nz); g.drawImage(D.tail, -D.tail.w2 * .5 - lr * .9, -D.tail.h2 / 2); g.restore(); } }
    for (let i = D.N; i >= 1; i--) { const [x, y, a, rl, s, nz] = body[i]; if (s < 0) continue; const k = (1 - .55 * (i - 1) / (D.N - 1)) * nz, spr = D.segs[i % 2];
      g.globalAlpha = I * S.shade(x, y, lr * 2 * k); g.save(); g.translate(x, y); g.rotate(a); g.scale(k, rl * k);
      if (D.legs.includes(i)) for (const [dx, ph] of [[-.15, 0], [.25, Math.PI]]) { g.save(); g.translate(dx * lr, lr * .38); g.rotate(Math.sin(A * 5.2 + ph + i) * .45 - .1); g.drawImage(D.leg, -D.leg.o, -D.leg.o, D.leg.w2, D.leg.h2); g.restore(); } // its legs, paddling the air
      g.drawImage(spr, -spr.w2 / 2, -spr.h2 / 2, spr.w2, spr.h2); g.restore(); }
    { const [x, y, a, rl, , nz] = body[0], hd = D.head, hk = nz * 1.32; g.globalAlpha = I * S.shade(x, y, lr * 2.2); g.save(); g.translate(x, y); g.rotate(a); g.scale(hk, rl * hk);
      g.strokeStyle = "#FFD27A"; g.lineWidth = Math.max(1, lr * .07); g.lineCap = "round"; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(lr * 2.95, lr * .02); for (let k = 1; k <= 8; k++) g.lineTo(lr * (2.95 - k * .42), lr * (.1 + sd * .05 + k * .08) + Math.sin(A * 4 - k * .7 + sd) * lr * .1 * k / 4); g.stroke(); } g.lineCap = "butt"; // its whiskers, streaming back
      g.drawImage(hd, -hd.o[0], -hd.o[1], hd.w2, hd.h2); g.restore(); }
    g.restore(); g.globalAlpha = 1;
  }
  /* ---------------- 1.12 b425: the long day's hour eggs ---------------- */
  /** an hour egg's pass (K.long 1 or 2): none of the dealt beats, only the bay's quiet life — the hour egg is the pass */
  function longPlan(pass, n) { const pl = eggPlan(pass); pl.egg = false; pl.long = n; return pl; }
  let LG = null; // what the hour eggs draw with, made when one first comes up (and again after a layout)
  const lgGet = () => { if (!LG || LG.gen !== gen) LG = { gen, grain: g.createPattern(K.grain(120, 120, 77, .1), "repeat") }; return LG; };

  /* Sunset's first: the surfer. A set rolls in out of the sun and a surfer paddles in from the left edge to meet it; the
     third wave, the biggest, stands up in front of the sun with the light coming through its top; he springs up and drops
     in, and it peels across the bay with him just ahead of the curl — a bottom turn, a snap off the top that throws a fan of
     gold spray, then the lip throws over him and he is in the tube, a shadow behind a curtain of lit water in front of the
     sun; it spits him out in a burst of spray; he rides up and over the top and is gone behind it, and the wave closes out,
     its whitewater rolling in and spreading to nothing. (The Endless Summer's poster, 1966: a sun, and surfers.) */
  const LSF = { paddle: [.3, 3.3], set: [[.5, 3.5], [1.6, 4.6]], swell: [2.5, 4.7], stand: [4.0, 5.8], pop: [5.0, 5.45], peel: [5.4, 11.4], close: [11.4, 12.5], fade: [12.0, 14.6],
    /* the ride: t, how far ahead of the curl (in wave heights), how far up the face (0 the trough, 1 the crest, past it in the air), how crouched */
    ride: [[5.3, -.1, .76, .9], [5.45, -.02, .74, .72], [5.75, .22, .36, .6], [6.05, .42, .12, .85], [6.4, .58, .2, .9], [6.8, .66, .6, .6], [7.12, .62, .9, .45], [7.32, .54, .84, .7],
      [7.8, .3, .45, .75], [8.25, .03, .38, .85], [8.65, -.2, .36, .95], [9.15, -.27, .35, .95], [9.5, -.18, .36, .9], [9.75, .1, .32, .7], [10.05, .36, .3, .65],
      [10.4, .46, .58, .55], [10.62, .42, .8, .5], [10.85, .38, .56, .7], [11.05, .36, .64, .55], [11.25, .34, .98, .35], [11.45, .32, 1.24, .3], [11.7, .3, 1.12, .4], [11.95, .28, .76, .5]],
    snaps: [[7.22, 1], [10.64, .7]], spit: 9.67, over: 11.45 };
  /** the wave at loop time t: everything else is drawn from this. It is worked out (and drawn) in a mirrored frame, x
   *  counted from the right: the wave peels toward the right, so the ride ends in the open by the right headland, never
   *  under the list's words */
  function surfState(t, I) {
    const { W, H, hz } = S, R = S.sun.R, sx = W - S.sun.x, yB = hz + (H - hz) * .6, Hm = yB - (hz - R * .72);
    const xp = Math.min(W - R * .3, sx + R * (S.pr ? .7 : 1.3)), xe = Math.max(sx - R * (S.pr ? .45 : .52), Hm * .32 + 46), xL = xe - R * 1.6; /* (the kick-out kept inside the page's edge) */
    const [P0, P1] = LSF.peel, C1 = LSF.close[1];
    const xcAt = t2 => t2 <= P0 ? xp : t2 <= P1 ? lerp(xp, xe, (t2 - P0) / (P1 - P0)) : lerp(xe, xL, E.in(clamp((t2 - P1) / (C1 - P1))));
    const tbAt = x => x > xp ? (x < xp + R * 1.6 ? P0 + .05 + (x - xp) / R * .5 : 99) : x >= xe ? P0 + (xp - x) / Math.max(1, xp - xe) * (P1 - P0) : x >= xL ? P1 + Math.cbrt(clamp((xe - x) / (xe - xL))) * (C1 - P1) : 99;
    const Hc = x => Hm * (.55 + .45 * Math.exp(-Math.pow((x - sx - R * .15) / (R * 1.6), 2)));
    const a = clamp(.03 + .2 * E.io(seg(t, LSF.swell[0], LSF.swell[1], x => x)) + .77 * E.io(seg(t, LSF.stand[0], LSF.stand[1], x => x))) * I;
    const base = lerp(hz + 1.5, yB, E.out(seg(t, LSF.swell[0], LSF.swell[1], x => x)));
    const xc = xcAt(t), hcx = Hc(Math.max(xc, xe)) * a * (xc < xe ? lerp(1, .55, clamp((xe - xc) / (xe - xL))) : 1) * (xc > xL ? 1 : 0);
    const q = t < P0 ? 0 : seg(t, P0, P0 + .55, E.out) * (1 - seg(t, C1 - .25, C1, x => x)), Lc = Math.min((S.pr ? .66 : .82) * hcx * q, Math.max(0, (xp + R * .55 - xc) / 1.45)); /* the lip, pitching: never longer than the stretch that has broken */
    /** the unbroken face's height at x */
    const sink = 1 - seg(t, P1, C1 + .8, E.sine), far = x => Hc(xp) * a * (.12 + .88 * Math.exp(-Math.pow((x - xp) / (R * .8), 2))) * (1 - seg(t, P0, P0 + 1.6, E.sine)), hU = x => x <= xc ? (xc > xL ? hcx : Hc(xe) * a * .55 * sink) * (.36 + .64 * Math.exp(-Math.pow((Math.max(xc, xL) - x) / (R * 1.5), 2))) : t < P0 ? far(x) : hcx * (1 - .3 * clamp((x - xc) / Math.max(1, Lc * 1.2)));
    return { W, H, hz, R, sx, yB, Hm, xp, xe, xL, xc, hcx, Lc, q, a, base, hU, tbAt, Hc, far, xland: xc + Lc * .95 };
  }
  /** a Catmull–Rom curve through the ride's keys: column `c` at loop time t */
  const rideAt = (t, c) => { const R2 = LSF.ride, n = R2.length; let i = 0; while (i < n - 2 && t > R2[i + 1][0]) i++; const k = clamp((t - R2[i][0]) / (R2[i + 1][0] - R2[i][0])), v = j => R2[clamp(j, 0, n - 1)][c], p0 = v(i - 1), p1 = v(i), p2 = v(i + 1), p3 = v(i + 2);
    return .5 * (2 * p1 + (-p0 + p2) * k + (2 * p0 - 5 * p1 + 4 * p2 - p3) * k * k + (-p0 + 3 * p1 - 3 * p2 + p3) * k * k * k); };
  /** where the surfer is at loop time t: on the flat paddling out, lifted by the wave, then riding it */
  function surferAt(t, I) {
    const w = surfState(t, I), { Hm, xp, base, hU, xc } = w, s = Hm * (S.pr ? .064 : .07);
    if (t < LSF.ride[0][0]) { const k = seg(t, LSF.paddle[0], LSF.paddle[1], E.out), x = lerp(w.W + 4.5 * s, xp + .1 * Hm, k);
      let bob = 0; for (const [t0, t1] of LSF.set) { const e = E.in(seg(t, t0, t1, x2 => x2)), ys = lerp(S.hz + 2, w.H + 30, e), hs = lerp(1.2, .11 * Hm, e); bob += hs * .8 * Math.exp(-Math.pow((ys - w.yB) / Math.max(1, hs * 2.2), 2)); }
      const lift = seg(t, 4.2, LSF.ride[0][0], E.io) * LSF.ride[0][2]; return { w, s, x, y: w.yB - bob * I - (base > w.yB - 4 ? hU(x) * lift : 0), c: .9, prone: 1 - seg(t, LSF.pop[0], LSF.pop[1], E.out), stroke: t * (k < 1 ? 6.4 : 8), f: lift }; }
    const d = rideAt(t, 1), f = rideAt(t, 2), c = clamp(rideAt(t, 3)), x = xc - d * Hm, y = base - hU(x) * Math.min(f, 1) - Math.max(0, f - 1) * Hm * (S.pr ? .5 : .9);
    return { w, s, x, y, c, prone: 1 - seg(t, LSF.pop[0], LSF.pop[1], E.out), stroke: t * 7, f, behind: t > LSF.over && f < 1.24 };
  }
  function lSurf(T, I, A, pl, sx0, sy, R) {
    if (I <= .01 || T <= .2 || T >= 14.9) return;
    g.save(); g.translate(S.W, 0); g.scale(-1, 1); lSurf2(T, I, A, S.W - sx0, sy, R); g.restore();
  }
  function lSurf2(T, I, A, sx, sy, R) {
    const L = lgGet(), { u } = S, w = surfState(T, I), { W, H, hz, Hm, base, xc, hcx, Lc, hU } = w, fade = (1 - seg(T, LSF.fade[0], LSF.fade[1], E.sine)) * clamp(I * 1.5); /* (a touch eases it all out: lower and fainter) */
    const step = 6, x0 = -step, peeled = T >= LSF.peel[0];
    // the set: two smaller waves roll in under him first, a line of dark water with the light along its top
    for (const [t0, t1] of LSF.set) { const k = seg(T, t0, t1, x => x); if (k <= 0 || k >= 1) continue; const e = E.in(k), y = lerp(hz + 2, H + 30, e), h = lerp(1.2, .11 * Hm, e) * I, top = x => y - h * (.45 + .55 * Math.exp(-Math.pow((x - w.xp) / (R * 1.6), 2)));
      g.globalAlpha = Math.min(1, k * 6) * I; g.fillStyle = "#5A1A44"; g.beginPath(); g.moveTo(-4, y); for (let x = -4; x <= W + 12; x += 12) g.lineTo(x, top(x)); g.lineTo(W + 12, y + h * .3); g.lineTo(-4, y + h * .3); g.closePath(); g.fill();
      g.strokeStyle = "rgba(255,196,140,.8)"; g.lineWidth = 1; g.beginPath(); for (let x = -4; x <= W + 12; x += 12) x === -4 ? g.moveTo(x, top(x)) : g.lineTo(x, top(x)); g.stroke(); }
    if (w.a < .005) { lSurfer(T, I, A, L); return; }
    // the face: from the left edge to the curl (and under the lip, the back of the tube); its colour lit through from the top
    const xR = peeled ? xc + Lc * 1.15 : W + step, face = new Path2D(); face.moveTo(x0, base); const top = [];
    for (let x = x0; x <= xR + step; x += step) { const xx = Math.min(x, xR), y = base - hU(xx); top.push([xx, y]); face.lineTo(xx, y); if (xx >= xR) break; }
    face.lineTo(xR, base); face.closePath();
    if (peeled && T < LSF.peel[0] + 1.6) { const x1 = Math.max(xR, w.xp - R * .2); face.moveTo(x1, base); for (let x = x1; x <= W + step; x += step) face.lineTo(x, base - w.far(x) * clamp((x - x1) / (R * .5))); face.lineTo(W + step, base); face.closePath(); } // beyond the peak, its shoulder, sinking back
    const yT = base - hcx, gr = g.createLinearGradient(0, yT, 0, base); gr.addColorStop(0, "#FFC277"); gr.addColorStop(.08, "#F6844C"); gr.addColorStop(.27, "#C33F5C"); gr.addColorStop(.62, "#6A1D47"); gr.addColorStop(1, "#3A1236");
    g.globalAlpha = fade; g.fillStyle = gr; g.fill(face);
    g.save(); g.clip(face);
    g.globalCompositeOperation = "lighter"; { const rg = g.createRadialGradient(sx, yT + hcx * .1, 0, sx, yT + hcx * .1, R * 1.25); rg.addColorStop(0, "rgba(255,200,120,.62)"); rg.addColorStop(.45, "rgba(255,150,90,.25)"); rg.addColorStop(1, "rgba(255,120,80,0)"); g.fillStyle = rg; g.fillRect(sx - R * 1.3, yT - 2, R * 2.6, hcx * .75); } // the sun through the top of it
    // streaks of moving water along the face, following its shape
    g.strokeStyle = "rgba(255,186,140,.22)"; g.lineWidth = Math.max(1, .1 * u); for (let i = 0; i < 9; i++) { const f = .18 + i * .085, x1 = xc - (i % 3 + 1) * R * .35 - ((T * 37 + i * 53) % 60), x2 = x1 + R * (.35 + (i % 4) * .14); g.beginPath(); for (let x = Math.max(x0, x1); x <= Math.min(x2, xR); x += step) { const y = base - hU(x) * f; x <= Math.max(x0, x1) ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = .55 * fade; g.fillStyle = L.grain; g.fillRect(x0, yT - 4, xR - x0 + 4, base - yT + 8); g.restore();
    g.globalAlpha = fade * .9; g.strokeStyle = "#FFD9A0"; g.lineWidth = 1.4; g.beginPath(); top.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); // the light along its crest
    // the tube: in the shadow under the lip's edge, lit through from the far end; the surfer in it against the light
    const lipEdge = (pth, rev) => { const a0 = [xc + Lc * .95, base - hcx * .02], c1 = [xc + Lc * .45, base - hcx * .03], c2 = [xc - Lc * .08, base - hcx * .45], b0 = [xc, base - hcx]; if (rev) { pth.moveTo(b0[0], b0[1]); pth.bezierCurveTo(c2[0], c2[1], c1[0], c1[1], a0[0], a0[1]); } else pth.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], b0[0], b0[1]); };
    let cur = null;
    if (Lc > 2) { cur = new Path2D(); cur.moveTo(xc, base - hcx); cur.quadraticCurveTo(xc + Lc * .75, base - hcx * 1.0, xc + Lc * 1.15, base - hcx * .86); cur.quadraticCurveTo(xc + Lc * 1.42, base - hcx * .5, xc + Lc * 1.3, base); cur.lineTo(xc + Lc * .95, base - hcx * .02); lipEdge(cur, false); cur.closePath();
      const tube = new Path2D(); lipEdge(tube, true); tube.lineTo(xc + Lc * .55, base); tube.bezierCurveTo(xc - Lc * .05, base - hcx * .02, xc - Lc * .22, base - hcx * .52, xc, base - hcx); tube.closePath();
      const tg = g.createLinearGradient(xc - Lc * .1, 0, xc + Lc * 1.4, 0); tg.addColorStop(0, "#2A0A28"); tg.addColorStop(.3, "#64163A"); tg.addColorStop(.7, "#D0503E"); tg.addColorStop(1, "#F68C4C");
      g.globalAlpha = fade * .94; g.fillStyle = tg; g.fill(tube); g.fill(cur);
      g.save(); g.clip(cur); g.globalCompositeOperation = "lighter"; const rg = g.createRadialGradient(sx, base - hcx * .7, 0, sx, base - hcx * .7, R * 1.15); rg.addColorStop(0, "rgba(255,214,140,.6)"); rg.addColorStop(1, "rgba(255,150,90,0)"); g.fillStyle = rg; g.fillRect(xc - 4, base - hcx * 1.2, Lc * 1.6 + 8, hcx * 1.25); g.restore(); } // the sun through it, lighting the tube
    lSurfer(T, I, A, L);
    // the lip: a thin curtain of water thrown out over the tube, landing in the foam: its thick top the brightest, the
    // shadow under its edge, the edge itself lit
    if (cur) { const cg = g.createLinearGradient(0, base - hcx, 0, base); cg.addColorStop(0, "rgba(255,226,160,.85)"); cg.addColorStop(.16, "rgba(255,190,118,.34)"); cg.addColorStop(.7, "rgba(250,132,92,.2)"); cg.addColorStop(1, "rgba(236,96,84,.34)");
      g.globalAlpha = fade; g.fillStyle = cg; g.fill(cur); g.save(); g.clip(cur); g.strokeStyle = "rgba(255,240,205,.32)"; g.lineWidth = Math.max(1, .12 * u); for (let i = 1; i < 7; i++) { const k = i / 7, ph = (T * .35 + k) % 1; g.beginPath(); g.moveTo(xc + Lc * (k * .3 + ph * .05), base - hcx * (.99 - k * .04)); g.bezierCurveTo(xc + Lc * (.55 + k * .35), base - hcx * (.96 - k * .1), xc + Lc * (.95 + k * .2), base - hcx * (.6 - k * .15), xc + Lc * (1.0 + k * .3), base - hcx * .02); g.stroke(); }
      const lg = g.createLinearGradient(0, base - hcx, 0, base - hcx * .78); lg.addColorStop(0, "rgba(255,238,196,.75)"); lg.addColorStop(1, "rgba(255,200,140,0)"); g.fillStyle = lg; g.fillRect(xc, base - hcx * 1.02, Lc * 1.6, hcx * .26); g.restore(); // the lip's thick top
      g.save(); g.clip(cur); g.strokeStyle = "rgba(60,10,40,.45)"; g.lineWidth = Math.max(2, hcx * .07); g.beginPath(); lipEdge(g, true); g.stroke(); g.restore(); // the shadow under its edge
      g.strokeStyle = "#FFF2D2"; g.lineWidth = Math.max(1.4, hcx * .012); g.beginPath(); lipEdge(g, true); g.stroke(); }
    // the whitewater: where it has broken, foam that rolls toward us and settles and spreads
    if (peeled) lFoam(T, I, A, w, fade, L);
    lSpray(T, I, A, w, fade);
    g.restore(); g.save(); padLines(base - Math.max(hcx, w.Hm * .5) - w.Hm * .4, fade * w.a / Math.max(.01, I)); // (back in the page's own frame)
  }
  /** the pad the module lays under a low line over the sun (b348), laid under any line the egg's bright things pass behind
   *  (those low enough already have theirs) */
  function padLines(top, k) {
    if (k <= .01 || !S.lines) return; const lowY = S.hz - (S.pr ? S.H * .12 : S.H * .14); g.globalCompositeOperation = "source-over"; g.globalAlpha = .8 * clamp(k);
    for (const [x0, y0, x1, y1] of S.lines) if (y1 <= lowY && y1 > top) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); }
    g.globalAlpha = 1;
  }
  /** the broken part of the wave: a churning bank of foam, thrown up where the lip lands and rolling in, settling and
   *  breaking up into lace; drawn in layers of puffs, the crown lit from behind and the front of it in shade */
  const hash = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  function lFoam(T, I, A, w, fade, L) {
    const { u } = S, { W, H, base, Lc, tbAt, Hc, yB, a, Hm } = w, st = Math.max(7, Hm * .07), cols = [];
    for (let i = Math.floor((w.xland - Lc * .15) / st) - 1; i * st <= W + st * 3; i++) { const x = i * st, h1 = hash(i), age = T - tbAt(x - Lc * .95) - .05; if (age < -.25) continue;
      const ag = Math.max(0, age), lace = clamp(.2 + 1.2 * (.5 + .5 * Math.sin(x * .019 + T * .35 + 1.7 * Math.sin(x * .0053 + 2))));
      const hF = Hc(clamp(x - Lc, w.xL, W)) * a * (.92 * Math.exp(-ag / 1.3) * (1 - Math.exp(-(age + .3) / .16)) + .1 * Math.exp(-ag / 5)) * lerp(1, lace, clamp((ag - 1.1) / 1.8)) * (x > w.xp ? Math.exp(-Math.pow((x - w.xp) / (w.R * .9), 2)) : 1), yb = base + (H - yB) * .55 * (1 - Math.exp(-ag / 2.2));
      if (hF > .9) cols.push([x + (h1 - .5) * st * .6, yb, hF, ag, h1]); }
    if (!cols.length) return;
    const wob = (x, k) => 1 + .1 * Math.sin(T * 3.3 + x * .071 + k) + .07 * Math.sin(T * 5.1 - x * .13 + k * 2), crown = new Path2D(), front = new Path2D(), foot = new Path2D(), all = new Path2D(); let yt = 1e9, xa = 1e9, xb = -1e9;
    const puff = (p, x, y, r) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); all.moveTo(x + r, y); all.arc(x, y, r, 0, TAU); yt = Math.min(yt, y - r); xa = Math.min(xa, x - r); xb = Math.max(xb, x + r); };
    for (const [x, yb, hF, , h1] of cols) { const h2 = hash(h1 * 91), h3 = hash(h1 * 37), h4 = hash(h1 * 13);
      // the crown: two or three puffs up top, of different sizes; the front: puffs lower down; the foot on the water
      puff(crown, x, yb - hF * (.72 + .12 * h3), hF * (.17 + .1 * h1) * wob(x, 0)); puff(crown, x + st * (.3 + .4 * h2), yb - hF * (.54 + .2 * h4), hF * (.15 + .09 * h2) * wob(x, 1)); if (h4 > .4) puff(crown, x - st * .3, yb - hF * (.86 + .1 * h1), hF * (.09 + .05 * h3) * wob(x, 2));
      puff(front, x + st * .5, yb - hF * (.34 + .08 * h4), hF * (.22 + .1 * h3) * wob(x, 2.2)); puff(front, x + st * (.1 + .3 * h1), yb - hF * .2, hF * (.15 + .08 * h2) * wob(x, 2.9)); puff(foot, x - st * .2, yb - hF * .06, hF * (.12 + .06 * h3) * wob(x, 3.1)); }
    g.globalAlpha = fade * .98; g.fillStyle = "#FFF0D8"; g.fill(crown);
    const fg = g.createLinearGradient(0, yt, 0, base + (H - yB) * .5); fg.addColorStop(0, "#FFD9B2"); fg.addColorStop(.5, "#F2A88A"); fg.addColorStop(1, "#CC6C7C"); g.fillStyle = fg; g.fill(front);
    g.fillStyle = "#B85872"; g.globalAlpha = fade * .9; g.fill(foot);
    g.save(); g.clip(all); g.globalAlpha = fade * .5; g.fillStyle = L.grain; g.fillRect(xa, yt, xb - xa, H - yt);
    g.fillStyle = "#B44E70"; g.globalAlpha = fade * .5; g.beginPath(); for (const [x, yb, hF] of cols) { if (hF < u * 1.5) continue; for (let j = 0; j < 4; j++) { const r = hF * (.06 - j * .012), xx = x + st * (.2 + (j % 2) * .5), yy = yb - hF * (.14 + j * .085); if (r < .45) continue; g.moveTo(xx + r, yy); g.arc(xx, yy, r, 0, TAU); } } g.fill(); g.restore(); // halftone in its shade
  }
  /** spray: off the crest on the wind, thrown up where the lip lands, off his board as he turns, and spat out of the tube;
   *  lit gold by the sun behind */
  function lSpray(T, I, A, w, fade) {
    const { u } = S, { base, hU, xc, hcx, Hm, Lc } = w, [P0, P1] = LSF.peel; g.globalCompositeOperation = "lighter"; g.fillStyle = "#FFDCA6";
    const on = seg(T, 4.6, 5.4, x => x) * (1 - seg(T, 11.2, 12.2, x => x)) * fade * I;
    if (on > .01 && hcx > 4) for (let i = 0; i < 90; i++) { const ph = (i * .6180339) % 1, age = (T / 1.3 + ph) % 1, ex = xc + (hash(i) - .2) * Hm * 1.7, ey = base - hU(ex), x = ex + age * Hm * .22 * (.4 + hash(i + 50)), y = ey - age * Hm * .3 * (.35 + hash(i + 90)) + age * age * Hm * .1, r = (.07 + .14 * hash(i + 130)) * u * (1 + age);
      g.globalAlpha = on * (1 - age) * .5 * S.shade(S.W - x, y, 4); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } // a mist blowing back off the crest
    const vc = (w.xp - w.xe) / (P1 - P0), imp = (T > P0 + .3 && T < LSF.close[1] + .6 ? 1 : 0) * fade * I;
    if (imp > 0 && Lc > 4) for (let i = 0; i < 46; i++) { const life = .8 + .5 * hash(i + 7), age = ((T - P0) / life + hash(i + 3)) % 1, tau = age * life, an = -Math.PI / 2 + (hash(i + 11) - .35) * 1.1, v = Hm * (.45 + .75 * hash(i + 19)), x = w.xland + vc * tau * (T < P1 ? 1 : 2.5) + Math.cos(an) * v * tau + (hash(i + 23) - .5) * Lc * .4, y = base - hcx * .05 + Math.sin(an) * v * tau + .9 * Hm * tau * tau, r = (.12 + .26 * hash(i + 29)) * u;
      g.globalAlpha = imp * (1 - age) * .75 * S.shade(S.W - x, y, 4); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } // thrown up where the lip lands
    const burst = (te, n, x0, y0, a0, spread, v0, life, k) => { const tau = T - te; if (tau <= 0 || tau >= life) return; g.fillStyle = "#FFC98A"; for (let i = 0; i < n; i++) { const h1 = hash(i * 3.17 + te), an = a0 + (h1 - .5) * spread, v = v0 * (.3 + .7 * Math.sqrt(hash(i * 7.31 + te * 3))), lag = hash(i * 1.93 + te) * .12, tt = Math.max(0, tau - lag), x = x0 + Math.cos(an) * v * tt, y = y0 + Math.sin(an) * v * tt + .5 * Hm * 2.2 * tt * tt, r = (.12 + .3 * hash(i * 5.11 + te)) * u * (1 - tau / life * .5);
      g.globalAlpha = k * fade * I * (1 - tau / life) * S.shade(S.W - x, y, 4); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } };
    for (const [te, k] of LSF.snaps) { if (T < te || T > te + 1.4) continue; const sv = surferAt(te, I); burst(te, 46, sv.x + sv.s * 1.5, sv.y - sv.s * .2, -Math.PI / 2 + .5, 1.2, Hm * 1.25, 1.35, k); } // a fan off his tail as he snaps it round
    { const sv = LSF.spit; if (T > sv - .1 && T < sv + 1.8) { const wv = surfState(sv, I), mx = wv.xc + wv.Lc * .1 - (T - sv) * Hm * .7, my = wv.base - wv.hcx * .38 - (T - sv) * Hm * .12, k = env(T, sv - .1, sv + .12, sv + .4, sv + 1.8, E.sine) * fade * I; if (k > .01) { const rg = g.createRadialGradient(mx, my, 0, mx, my, wv.hcx * (.5 + (T - sv) * .35)); rg.addColorStop(0, "rgba(255,232,190,.55)"); rg.addColorStop(1, "rgba(255,200,150,0)"); g.globalAlpha = k * .9; g.fillStyle = rg; const mr = wv.hcx * (.5 + (T - sv) * .35); g.fillRect(mx - mr, my - mr, mr * 2, mr * 2); }
      burst(sv, 110, wv.xc + wv.Lc * .2, wv.base - wv.hcx * .4, Math.PI * 1.03, 1.25, Hm * 2.3, 1.4, 1); } } // spat out of the tube: a cone of spray and a breath of mist
    g.globalCompositeOperation = "source-over";
  }
  /** the surfer: paddling out, springing up, riding; a silhouette with the sun along his edges */
  function lSurfer(T, I, A, L) {
    if (T > LSF.ride[LSF.ride.length - 1][0]) return;
    const sv = surferAt(T, I), sv2 = surferAt(T + .04, I), vx = sv2.x - sv.x, vy = sv2.y - sv.y, ang = lerp(clamp(Math.atan2(vy, Math.abs(vx) + .001), -.5, .5) * .25 + .1 + Math.sin(T * 2.3) * .04 * sv.prone, clamp(Math.atan2(vy, Math.abs(vx) + .001) * .75, -.85, .85), seg(T, 5.35, 5.7, E.sine)); /* flat as the wave lifts him, then along the way he goes */
    const al = I * (1 - seg(T, 11.8, 11.95, x => x));
    if (sv.behind) { g.save(); g.beginPath(); g.rect(sv.x - 6 * sv.s, 0, 12 * sv.s, sv.w.base - sv.w.hU(sv.x)); g.clip(); }
    drawSurfer(sv.x, sv.y, ang, -1, sv.s, sv.c, sv.prone, sv.stroke, al, sv.w.sx > sv.x ? 1 : -1);
    if (sv.behind) g.restore();
  }
  /** a surfer and his board at (x, y) (the middle of the board's foot), the board turned `ang` along the way it goes, facing
   *  `dir`; c how crouched (0 tall … 1 deep), prone 1 lying on it to paddle (stroke: the arms' phase); a flat silhouette of
   *  tapered limbs, with the sun along the edges that face it (`rx`: which way the sun is) */
  function drawSurfer(x, y, ang, dir, s, c, prone, stroke, a, rx = 1) {
    if (a <= .01) return;
    const l2 = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
    // standing: feet on the board, knees forward, the body leaning over the front foot, the arms out
    const hipS = [-.08, -lerp(1.75, 1.0, c)], shS = [hipS[0] + lerp(.22, .72, c), hipS[1] - lerp(1.3, 1.0, c)], hdS = [shS[0] + lerp(.12, .3, c), shS[1] - .58];
    const hip = l2(hipS, [-.5, -.42], prone), sh = l2(shS, [.72, -.52], prone), hd = l2(hdS, [1.2, -.78], prone);
    const fB = l2([-.66, -.12], [-1.8, -.36], prone), fF = l2([.66, -.12], [-1.75, -.3], prone);
    const knee = (h2, f, out) => [(h2[0] + f[0]) / 2 + lerp(.14, .52, c) * (1 - prone) * out, (h2[1] + f[1]) / 2 + .04];
    const kB = knee(hip, fB, .8), kF = knee(hip, fF, 1);
    const hands = prone > .5 ? [0, Math.PI].map(o => [sh[0] + Math.cos(stroke + o) * .78, sh[1] + .3 + Math.sin(stroke + o) * .62]) : [[sh[0] + Math.cos(lerp(-.4, -.1, c)) * 1.3, sh[1] + Math.sin(lerp(-.4, -.1, c)) * 1.3], [sh[0] + Math.cos(lerp(2.75, 3.0, c)) * 1.2, sh[1] + Math.sin(lerp(2.75, 3.0, c)) * 1.2 + .3]];
    const elbow = (hn, out) => { const mx = (sh[0] + hn[0]) / 2, my = (sh[1] + hn[1]) / 2, dx = hn[0] - sh[0], dy = hn[1] - sh[1], L = Math.hypot(dx, dy) || 1; return [mx - dy / L * .16 * out, my + dx / L * .16 * out]; };
    /** a limb: two round ends and the quad between them, filled at once */
    const cap = (ax, ay, ra, bx, by, rb) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-6, nx = -dy / L, ny = dx / L; g.beginPath(); g.moveTo(ax + nx * ra, ay + ny * ra); g.lineTo(bx + nx * rb, by + ny * rb); g.lineTo(bx - nx * rb, by - ny * rb); g.lineTo(ax - nx * ra, ay - ny * ra); g.closePath(); g.moveTo(ax + ra, ay); g.arc(ax, ay, ra, 0, TAU); g.moveTo(bx + rb, by); g.arc(bx, by, rb, 0, TAU); g.fill(); };
    const one = (col, ox, oy) => { g.save(); g.translate(x + ox, y + oy); g.rotate(dir < 0 ? -ang : ang); g.scale(dir * s, s); g.fillStyle = col;
      g.beginPath(); g.moveTo(-1.95, -.1); g.quadraticCurveTo(-2.05, .22, -1.6, .26); g.lineTo(1.4, .24); g.quadraticCurveTo(2.05, .18, 2.15, -.2); g.quadraticCurveTo(1.7, -.12, 1.35, -.1); g.closePath(); g.fill(); // the board, its nose up
      g.rotate(-ang * (1 - prone) * .6); // he stands nearer upright than it tilts
      for (const [k, f] of [[kB, fB], [kF, fF]]) { cap(hip[0], hip[1], .27, k[0], k[1], .2); cap(k[0], k[1], .19, f[0], f[1], .13); g.beginPath(); g.ellipse(f[0] + .12, f[1] + .02, .26, .1, 0, 0, TAU); g.fill(); } // thighs, shins, feet
      cap(hip[0], hip[1], .34, sh[0], sh[1], .44); // the body, broad at the shoulders
      cap(sh[0], sh[1], .16, hd[0], hd[1] + .2, .14); // the neck
      for (const [i, hn] of hands.entries()) { const el = elbow(hn, i ? -1 : 1); cap(sh[0], sh[1], .17, el[0], el[1], .14); cap(el[0], el[1], .13, hn[0], hn[1], .1); } // the arms
      g.beginPath(); g.arc(hd[0], hd[1], .36, 0, TAU); g.fill(); g.beginPath(); g.moveTo(hd[0] - .1, hd[1] - .34); g.quadraticCurveTo(hd[0] - .55, hd[1] - .42, hd[0] - .78, hd[1] - .18); g.quadraticCurveTo(hd[0] - .5, hd[1] - .16, hd[0] - .3, hd[1] + .02); g.closePath(); g.fill(); // the head, the hair streaming back
      g.restore(); };
    g.globalAlpha = a * .9; one("rgb(255,210,150)", rx * .055 * s, -.075 * s); g.globalAlpha = a; one(P.palm, 0, 0);
  }
  /* Sunset's second: the balloon. A hot-air balloon drifts in from the right, high, and comes down across the face of the
     sun — where the sun is behind it its gores light up like stained glass — until its basket touches the water in the
     sun's path: a splash, its rings, its reflection under it ("splash and dash", as balloonists do it); the burner roars
     and the whole envelope glows from inside, someone in the basket waves, and it lifts off dripping and climbs away past
     the edge it came from. */
  const LBA = { in: [.4, 5.9], touch: 5.9, skim: [5.9, 7.5], lift: [7.5, 8.6], out: [8.0, 14.4], burns: [[6.5, 7.9], [10.2, 11.0]], wave: [6.3, 8.4] };
  /** the balloon, made once per layout: its envelope as two sprites, in the dusk's shade and lit through like glass */
  function balloonMake(kH = S.pr ? .86 : .9, shade = ["#3E1440", "#7A2150", "#B8562E", "#C9A07A", "#B8562E", "#7A2150"], lit = ["#E8306A", "#FF5E4A", "#FF9A2E", "#FFD27A", "#FF9A2E", "#FF5E4A"], band = true) {
    const R = S.sun.R, He = R * kH, Rm = He * .4, c = Rm, rt = Rm * .17, n = 30;
    const rAt = y => y <= c ? Math.sqrt(Math.max(0, Rm * Rm - (c - y) * (c - y))) : rt + (Rm - rt) * Math.pow(Math.cos(clamp((y - c) / (He - c)) * Math.PI / 2), 1.15);
    const ys = Array.from({ length: n + 1 }, (_, i) => He * i / n), mer = (sn, pth, rev) => { const list = rev ? [...ys].reverse() : ys; list.forEach((y, i) => { const x = rAt(y) * sn; if (i === 0 && !rev) pth.moveTo(x, y); else pth.lineTo(x, y); }); };
    const outline = () => { const p = new Path2D(); mer(1, p, false); mer(-1, p, true); p.closePath(); return p; };
    const gores = [-1, -.87, -.5, 0, .5, .87, 1];
    const one = (cols, glass) => make(Rm * 2 + 4, He + 4, x => { x.translate(Rm + 2, 2); const o = outline();
      for (let k = 0; k < 6; k++) { const p = new Path2D(); mer(gores[k], p, false); mer(gores[k + 1], p, true); p.closePath(); x.fillStyle = cols[(k + 2) % 6 === 3 ? 3 : k]; x.fill(p); }
      x.save(); x.clip(o);
      // a band of chevrons round its widest part, and its crown
      const by = c * 1.05, bh = He * .07; if (band) { x.fillStyle = glass ? "#FFE6A0" : "#E9C79A"; x.fillRect(-Rm, by, Rm * 2, bh); x.fillStyle = glass ? "#E0306A" : "#5A1A44"; x.beginPath(); for (let k = -8; k <= 8; k++) { const xx = k * Rm / 4; x.moveTo(xx, by); x.lineTo(xx + Rm / 8, by + bh); x.lineTo(xx + Rm / 4, by); } x.fill(); }
      x.fillStyle = glass ? "#FF8A5C" : "#4A1840"; x.beginPath(); x.ellipse(0, 0, Rm * .5, He * .1, 0, 0, TAU); x.fill();
      if (glass) { const rg = x.createRadialGradient(0, c * 1.1, 0, 0, c * 1.1, Rm * 1.15); rg.addColorStop(0, "rgba(255,240,190,.32)"); rg.addColorStop(1, "rgba(255,220,160,0)"); x.fillStyle = rg; x.fillRect(-Rm, 0, Rm * 2, He); }
      else if (He > 30) { x.fillStyle = "rgba(42,12,34,.42)"; for (let row = 0; row < 8; row++) { const yy = He * (.52 + row * .055), rr = He * .0034 * (row + 1.5); for (let xx = -Rm + (row % 2) * Rm * .055; xx < Rm; xx += Rm * .11) { x.beginPath(); x.arc(xx, yy, rr, 0, TAU); x.fill(); } } // halftone: the shade under it
        } if (!glass) { x.globalAlpha = .9; x.strokeStyle = "rgba(255,190,130,.85)"; x.lineWidth = Math.max(1.2, Rm * .06); x.stroke(o); x.globalAlpha = 1; } // the sun along its edges
      x.strokeStyle = glass ? "rgba(90,20,50,.75)" : "rgba(30,8,26,.6)"; x.lineWidth = Math.max(.8, Rm * .022); for (const sn of gores.slice(1, -1)) { const p = new Path2D(); mer(sn, p, false); x.stroke(p); } // its load tapes
      x.globalAlpha = glass ? .3 : .5; x.fillStyle = x.createPattern(K.grain(120, 120, 91, .12), "repeat"); x.fillRect(-Rm - 2, -2, Rm * 2 + 4, He + 4); x.restore(); });
    return { gen, He, Rm, rt, c, shade: one(shade, false), lit: one(lit, true), glow: glow(Rm * 1.1, [255, 190, 110], .75), flame: glow(Rm * .3, [255, 236, 190], .95) };
  }
  /** where the balloon is at loop time t: [x, y] the middle of its basket's foot, how near (its scale), and the water it
   *  touches */
  function balloonAt(t, B) {
    const { W, H, hz, pr } = S, R = S.sun.R, sx = S.sun.x, yw = hz + (H - hz) * (pr ? .22 : .3), xd = sx - R * .06, xin = W + B.Rm + 8, yin = pr ? H * .68 : H * .43, xout = W + B.Rm + 8, yout = pr ? H * .69 : H * .33;
    if (t < LBA.touch) { const k = seg(t, LBA.in[0], LBA.in[1], x => x), e = 1 - Math.pow(1 - k, 2.2); return [lerp(xin, xd + R * .22, e), lerp(yin, yw, Math.pow(e, 1.6)), lerp(.72, 1, e), yw]; }
    if (t < LBA.lift[0]) { const k = seg(t, LBA.skim[0], LBA.skim[1], E.out); return [lerp(xd + R * .22, xd, k), yw, 1, yw]; }
    const k = seg(t, LBA.out[0], LBA.out[1], x => x), e = k * k * (3 - 2 * k) * .55 + k * .45, up = E.io(seg(t, LBA.lift[0], LBA.lift[1], x => x));
    return [lerp(xd, xout, Math.pow(e, 1.35)), lerp(yw, yout, Math.max(up * .12, Math.pow(e, .8))), lerp(1, .8, e), yw];
  }
  function lBalloon(T, I, A, pl, sx, sy, R) {
    if (I <= .01 || T <= LBA.in[0] || T >= LBA.out[1]) return;
    const L = lgGet(); if (!L.bal || L.bal.gen !== gen) { L.bal = balloonMake(); L.far = [[.3, ["#2E1440", "#6A2A5A", "#A84A6A", "#D9A08A", "#A84A6A", "#6A2A5A"], ["#C2306E", "#E8506E", "#FF8A7A", "#FFD0B0", "#FF8A7A", "#E8506E"]], [.24, ["#3A1830", "#8A3A2A", "#C07A30", "#E0B060", "#C07A30", "#8A3A2A"], ["#E8562E", "#FF8A2E", "#FFC04A", "#FFE6A0", "#FFC04A", "#FF8A2E"]], [.2, ["#241030", "#4A2050", "#7A3A6A", "#B07A90", "#7A3A6A", "#4A2050"], ["#B03080", "#D8508A", "#F08AA8", "#FFC8D0", "#F08AA8", "#D8508A"]]].map(([k, sh, li]) => balloonMake(k, sh, li, false)); }
    const B = L.bal, { u, hz, W, H } = S, { He, Rm, rt } = B;
    lFleet(T, I, A, L, sx, sy, R);
    const [bx, by, sc, yw] = balloonAt(T, B), [bx2] = balloonAt(T + .05, B), sway = clamp((bx2 - bx) / 20, -.06, .06), a = I;
    const burn = Math.max(...LBA.burns.map(([b0, b1]) => env(T, b0, b0 + .3, b1 - .4, b1, E.sine))) * a, wv = env(T, LBA.wave[0], LBA.wave[0] + .3, LBA.wave[1] - .3, LBA.wave[1], E.sine);
    const bt = -He * .12, bw = He * .085, th = -He * .46, top = -He * 1.46; // in its own frame: the basket's foot at 0, its top, the envelope's mouth and top
    /** the whole balloon in its own frame, at the basket's foot; `glass` the envelope lit through */
    const whole = (glass, dark) => {
      g.save(); g.translate(0, th); g.rotate(sway); g.translate(0, -th);
      g.drawImage(glass ? B.lit : B.shade, -Rm - 2, top - 2, B.shade.w2, B.shade.h2);
      if (!glass && burn > .01) { const k = g.globalAlpha; g.globalAlpha = k * burn * .7; g.drawImage(B.lit, -Rm - 2, top - 2, B.lit.w2, B.lit.h2); g.globalCompositeOperation = "lighter"; g.globalAlpha = k * burn * .5; g.drawImage(B.glow, -B.glow.w2 / 2, top + He * .72 - B.glow.h2 / 2, B.glow.w2, B.glow.h2); g.globalCompositeOperation = "source-over"; g.globalAlpha = k; } // aglow from inside when it burns
      g.restore(); if (glass) return;
      const swing = Math.sin(A * 1.3) * .03 + sway * .5; g.save(); g.translate(0, th); g.rotate(swing); g.translate(0, -th);
      g.fillStyle = g.strokeStyle = dark; g.beginPath(); g.moveTo(-rt, th - 1); g.lineTo(rt, th - 1); g.lineTo(rt * .8, th + He * .07); g.lineTo(-rt * .8, th + He * .07); g.closePath(); g.fill(); // the skirt
      g.lineWidth = Math.max(.8, He * .008); g.beginPath(); for (const [s0, s1] of [[-.8, -1], [-.3, -.4], [.3, .4], [.8, 1]]) { g.moveTo(rt * s0, th + He * .07); g.lineTo(bw * s1, bt); } g.stroke(); // the cables
      g.fillRect(-bw * .35, bt - He * .1, bw * .7, He * .03); // the burner frame
      if (burn > .01) { const k = g.globalAlpha, fh = He * (.1 + .14 * burn) * (1 + .08 * Math.sin(A * 31)), fy = bt - He * .1; g.globalCompositeOperation = "lighter"; g.globalAlpha = k * burn; g.drawImage(B.flame, -B.flame.w2 / 2, fy - fh * .7 - B.flame.h2 / 2, B.flame.w2, B.flame.h2);
        const fg = g.createLinearGradient(0, fy, 0, fy - fh); fg.addColorStop(0, "rgba(150,190,255,.95)"); fg.addColorStop(.3, "rgba(255,250,225,.95)"); fg.addColorStop(1, "rgba(255,170,80,0)"); g.fillStyle = fg; g.beginPath(); g.moveTo(-bw * .22, fy); g.quadraticCurveTo(-bw * .3, fy - fh * .5, 0, fy - fh); g.quadraticCurveTo(bw * .3, fy - fh * .5, bw * .22, fy); g.closePath(); g.fill(); g.globalCompositeOperation = "source-over"; g.globalAlpha = k; g.fillStyle = dark; } // the flame, up into the mouth
      g.lineCap = "round"; for (const [hx, hh] of [[-.4, 1], [.42, .94]]) { g.beginPath(); g.arc(bw * hx, bt - He * .045 * hh, He * .024, 0, TAU); g.fill(); g.fillRect(bw * hx - He * .03, bt - He * .03 * hh, He * .06, He * .04); } // the two in it
      if (wv > .01) { const an = -Math.PI / 2 - .5 + Math.sin(A * 9) * .45 * wv; g.lineWidth = He * .014; g.beginPath(); g.moveTo(bw * .55, bt - He * .02); g.lineTo(bw * .55 + Math.cos(an) * He * .07 * wv, bt - He * .02 + Math.sin(an) * He * .07 * wv); g.stroke(); } // one of them waves
      g.lineCap = "butt"; g.fillStyle = "#3A1430"; g.fillRect(-bw, bt, bw * 2, He * .12); g.strokeStyle = "rgba(255,190,130,.5)"; g.lineWidth = Math.max(.6, He * .005); for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(-bw, bt + He * .03 * k); g.lineTo(bw, bt + He * .03 * k); g.stroke(); } g.fillStyle = "rgba(255,200,140,.9)"; g.fillRect(-bw * 1.04, bt - 1, bw * 2.08, Math.max(1.2, He * .012)); // the basket, wicker, its rim in the sun
      g.restore(); };
    // its reflection: under it in the sun's path when it is low, broken by the water
    const low = clamp(1 - (yw - by) / (He * .9)); if (low > .01) { g.save(); g.beginPath(); g.rect(0, Math.max(hz + 1, yw - 1), W, H - yw + 1); g.clip(); for (let k = 0; k < 10; k++) { const y0 = yw + k * He * .085, off = Math.sin(A * 2.3 + k * 1.7) * u * .5; g.save(); g.beginPath(); g.rect(0, y0, W, He * .055); g.clip(); g.globalAlpha = a * low * .3 * (1 - k * .07); g.translate(bx + off, yw + (yw - by)); g.scale(sc, -sc * .62); whole(false, "#2A0C22"); g.restore(); } g.restore(); }
    // the balloon: in shade against the sky; lit through like glass where the sun's disc is behind it
    g.save(); g.translate(bx, by); g.scale(sc, sc); g.globalAlpha = a; whole(false, P.palm); g.restore();
    g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip(); g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.clip(); g.translate(bx, by); g.scale(sc, sc); g.globalAlpha = a * (1 - burn * .5); whole(true); g.restore();
    // the water: a splash as it touches, its rings, the wake as it skims; drips as it lifts
    const tk = T - LBA.touch; if (tk > 0 && tk < 1.3) splash(bx, yw, tk / 1.3, He / (7 * u) * .34, a * .55);
    if (tk > 0 && tk < 3.2) rings(bx, yw, tk / 3.2, 3, He * .5, a * .6);
    const sk = seg(T, LBA.skim[0], LBA.skim[1] + .3, x => x); if (sk > 0 && sk < 1) { g.globalAlpha = a * .55 * Math.sin(sk * Math.PI); g.fillStyle = "#FFE3A8"; g.fillRect(bx, yw - .5, (balloonAt(LBA.skim[0], B)[0] - bx) * .9, 1.2); }
    for (let k = 0; k < 6; k++) { const t0 = LBA.lift[0] + .15 + k * .22, tau = T - t0; if (tau < 0) continue; const [dx0, dy0] = balloonAt(t0, B), fall = tau * tau * He * 3.2, x = dx0 + (k - 2.5) * bw * .25, y = dy0 + fall; if (y < yw) { g.globalAlpha = a * .8; g.fillStyle = "#FFE3B0"; g.fillRect(x - .7, y, 1.4, 2.2); } else { const rk = (tau - Math.sqrt((yw - dy0) / (He * 3.2))) / 1.2; if (rk > 0 && rk < 1) rings(x, yw, rk, 1, He * .14, a * .5); } }
    g.globalAlpha = 1;
  }
  /** far off, a few more of the fiesta drift along the horizon, up from behind the right headland and down behind the left,
   *  crossing the sun small; they glow when the near one burns */
  const LFL = [[0, .9, 12.4, .16, .2], [1, 2.2, 13.9, .42, .55], [2, 3.4, 14.6, .28, .9]];
  function lFleet(T, I, A, L, sx, sy, R) {
    const { W, hz } = S, burn = env(T, LBA.burns[0][0] + .15, LBA.burns[0][0] + .5, LBA.burns[0][1] - .3, LBA.burns[0][1] + .2, E.sine) * I;
    g.save(); g.clip(S.headClip, "evenodd");
    const x1 = W * .05, hL = hz - S.left.reduce((m, q) => Math.abs(q[0] - x1) < Math.abs(m[0] - x1) ? q : m)[1]; /* where they come down: behind the left headland, where it stands tallest on the page */
    for (const [i, t0, t1, hy, ph] of LFL) { const k = seg(T, t0, t1, x => x); if (k <= 0 || k >= 1) continue; const B = L.far[i], He = B.He, x = lerp(W + He * .5, x1, k), y = lerp(hz - R * hy - Math.sin(k * Math.PI) * R * .12, hz - hL + He * 1.5 + 3, E.io(seg(k, .74, 1, x2 => x2))) + Math.sin(A * .7 + ph * 6) * He * .02, top = y - He * 1.46, a = I * (.45 + .55 * S.shade(x, y - He * .8, He));
      const whole = (spr, alpha) => { g.globalAlpha = alpha; g.drawImage(spr, x - B.Rm - 2, top - 2, spr.w2, spr.h2); };
      whole(B.shade, a); if (burn > .01) whole(B.lit, a * burn * .8);
      g.save(); g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.clip(); whole(B.lit, a * (1 - burn * .5)); g.restore();
      g.fillStyle = g.strokeStyle = P.palm; g.globalAlpha = a; g.lineWidth = 1; const th = top + He, bt = y - He * .12, bw = He * .09; g.beginPath(); g.moveTo(x - B.rt, th); g.lineTo(x - bw, bt); g.moveTo(x + B.rt, th); g.lineTo(x + bw, bt); g.stroke(); g.fillRect(x - bw, bt, bw * 2, He * .12); }
    g.restore(); g.globalAlpha = 1;
  }
  /* Dusk's first: the fireworks. A slow, gentle show over the bay, from the far shore: shells climb on thin trails and open
     — a gold chrysanthemum, peonies that change colour as they fall, a palm over the palms, a heart, a ring that frames the
     moon, and to close a golden willow that hangs and drips down toward its own reflection — each bloom opening over a
     second and drifting as it fades, its smoke left in the sky in halftone, its light laid on the water. Never a flash: the
     light comes up and goes down; and each shell finds the clearest sky near its place and keeps its size to its distance
     from the words. */
  const LFW = [ // the burst's time, where (wide [x, y] of the page, narrow [x, y]), the kind, its colours (from, to), its size, how long it lasts
    [1.7, [.66, .3], [.3, .61], "kiku", [[255, 233, 168], [255, 196, 92]], 1, 2.8],
    [3.0, [.87, .45], [.72, .64], "peony", [[201, 180, 255], [255, 143, 184]], .78, 2.4],
    [4.2, [.55, .19], [.5, .17], "peony", [[154, 248, 255], [228, 255, 255]], .7, 2.3],
    [5.6, [.87, .5], [.84, .64], "palm", [[255, 210, 122], [255, 180, 92]], .95, 3.0],
    [7.0, [.74, .3], [.4, .6], "heart", [[255, 157, 187], [255, 208, 224]], .82, 2.6],
    [8.5, null, null, "ring", [[237, 230, 255], [201, 180, 255]], 1, 2.5],
    [9.6, [.61, .42], [.22, .66], "kiku", [[255, 143, 184], [255, 233, 168]], .62, 2.4],
    [9.95, [.86, .36], [.8, .62], "kiku", [[201, 180, 255], [237, 230, 255]], .62, 2.4],
    [10.4, [.72, .21], [.52, .58], "willow", [[255, 231, 160], [255, 176, 80]], 1.45, 4.3]];
  /** the show's places, sizes and stars, worked out once per layout and again when the words move. (For cost: each
   *  star's way out is worked out here once, and each shell keeps only the words near enough to fade any of its stars) */
  function showMake() {
    const { W, H, u, hz, pr } = S, base = (pr ? 16.5 : 15) * u, mo = S.moon, out = [];
    for (const [i, [t, wide, narrow, kind, col, size, life]] of LFW.entries()) {
      let x, y; if (kind === "ring") { x = mo.x; y = mo.y; } else { [x, y] = pr ? narrow : wide; x *= W; y *= H; if (S.wr) { let best = null, bs = -1e9; for (let gy = -2; gy <= 2; gy++) for (let gx = -2; gx <= 2; gx++) { const cx = x + gx * W * (pr ? .08 : .05), cy = Math.min(hz - base * .5, y + gy * H * .05), sc = Math.min(S.clear(cx, cy), base * size * 1.2) - Math.hypot(cx - x, cy - y) * .12; if (sc > bs) { bs = sc; best = [cx, cy]; } } [x, y] = best; } }
      const Rm = kind === "ring" ? mo.r * (pr ? 3.4 : 3.8) : Math.max(base * .35, Math.min(base * size, S.clear(x, y) * .9)), n = kind === "willow" ? 54 : kind === "palm" ? 9 : kind === "heart" ? 58 : kind === "ring" ? 54 : kind === "kiku" ? 66 : 58, r = rng(9100 + i * 17), stars = [];
      for (let j = 0; j < n; j++) { const a = j / n * TAU + (r() - .5) * (kind === "ring" || kind === "heart" ? .02 : .2); stars.push({ a, v: kind === "ring" || kind === "heart" ? 1 : .82 + r() * .18, tw: r() * TAU, f: .7 + r() * .9 }); }
      for (const st of stars) if (kind === "heart") { const th = st.a; st.cx = Math.pow(Math.sin(th), 3) * st.v; st.cy = -(13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16 * st.v; } else { st.cx = Math.cos(st.a) * st.v; st.cy = Math.sin(st.a) * st.v * (kind === "palm" ? .85 : 1); } // where it heads, per unit of the burst's spread
      // everything a star of it draws — head, trail, its dash in the water — lies inside this box (open below), and S.shade
      // reaches no further than 21 px for those, so the words more than 24 px from the box can never fade it
      const bx0 = x - Rm * 1.1 - 4, bx1 = x + Rm * 1.1 + 4, by0 = y - Rm * 1.15 - 4, near = (S.wr || []).filter(([x0, , x1, y1]) => Math.hypot(Math.max(x0 - bx1, 0, bx0 - x1), Math.max(by0 - y1, 0)) < 24);
      out.push({ t, x, y, kind, col, Rm, life, stars, lx: x + (r() - .5) * Rm * .3, near });
    }
    return out;
  }
  function lFireworks(T, I, A, pl) {
    if (I <= .01) return;
    const L = lgGet(), { W, H, u, hz } = S;
    if (!L.show || L.wr !== S.wr) { L.show = showMake(); L.wr = S.wr; }
    if (!L.fx) { const c = new Path2D(); c.rect(-20, -20, W + 40, H + 40); for (const pts of [S.left, S.right]) { c.moveTo(pts[0][0], hz + 1); for (const q of pts) c.lineTo(q[0], Math.min(hz + 1, q[1])); c.lineTo(pts[pts.length - 1][0], hz + 1); c.closePath(); }
      L.fx = { clip: c, smoke: make(60, 40, x => { const r = rng(9301); for (let k = 0; k < 90; k++) { const a = r() * TAU, d = Math.sqrt(r()), px2 = 30 + Math.cos(a) * d * 27, py2 = 20 + Math.sin(a) * d * 16, rr = (1 - d) * 2.6 + .4; x.fillStyle = "rgba(170,156,210,.5)"; x.beginPath(); x.arc(px2, py2, rr, 0, TAU); x.fill(); } }),
        glows: {}, dots: {}, pos: new Float64Array(66 * 7 * 2), refl: new Float64Array(66 * 3) }; } // (for cost) its glows made once per colour, and where its stars are kept in place of a new array per star
    const F = L.fx, mirror = y => hz + (hz - y) * .42, sprite = (cache, c, mk) => { const key = c[0] + "," + c[1] + "," + c[2]; return cache[key] || (cache[key] = mk(c)); };
    g.save(); g.lineCap = "round";
    for (const sh of L.show) { const tau = T - sh.t, [c0, c1] = sh.col, smoke = Math.min(sh.life + 3.6, 14.7 - sh.t); /* its smoke gone before the loop comes round */ if (tau < -1.1 || tau > smoke) continue;
      // the launch: a thin trail up from the far shore, its head bright, its light on the water
      if (tau < 0 && tau > -1.05) { const k = E.out(1 + tau / 1.05), hx = lerp(sh.lx, sh.x, k), hy = lerp(hz - 2, sh.y, k), wig = Math.sin(T * 23 + sh.t) * .6 * u * (1 - k), ty = Math.min(hz, hy + (hz - sh.y) * .22);
        g.save(); g.clip(F.clip, "evenodd"); g.globalCompositeOperation = "lighter"; const gr = g.createLinearGradient(0, hy, 0, ty); gr.addColorStop(0, `rgba(255,236,190,${(.85 * I).toFixed(3)})`); gr.addColorStop(1, "rgba(255,200,140,0)"); g.strokeStyle = gr; g.lineWidth = 1.3; g.globalAlpha = S.shade(hx, hy, 6 * u); g.beginPath(); g.moveTo(hx + wig, hy); g.lineTo(hx, ty); g.stroke();
        g.fillStyle = "#FFF4D8"; g.beginPath(); g.arc(hx + wig, hy, 1.4, 0, TAU); g.fill(); g.restore(); continue; }
      if (tau < 0) continue;
      const k = tau / sh.life, Rm = sh.Rm, alive = k < 1, m = clamp(k * 1.3);
      const lum = I * clamp(tau / .2) * (alive ? (k < .55 ? 1 : Math.pow((1 - k) / .45, 1.4)) : 0), col = c0.map((v, i) => Math.round(lerp(v, c1[i], m)));
      // its smoke, drifting off in halftone, and the light it lays about it
      { const sk = clamp(tau / smoke), sa = I * .55 * Math.sin(sk * Math.PI) * (1 - sk); if (sa > .01) { const sw = Rm * (1 + sk * 1.2) * 2, shh = sw * .62; g.globalAlpha = sa * S.shade(sh.x, sh.y, Rm); g.drawImage(F.smoke, sh.x - sw / 2 + sk * Rm * 1.1, sh.y - shh / 2 + Rm * .25 + sk * Rm * .3, sw, shh); } }
      if (!alive) continue;
      const key = col.join(","), gk = lum * .45 * Math.min(1, tau / .5) * S.shade(sh.x, sh.y, Rm * 1.2);
      g.globalCompositeOperation = "lighter";
      if (gk > .01) for (let e = 0; e < 2; e++) { const wgt = e ? m : 1 - m; if (wgt <= .002) continue; const gw = sprite(F.glows, e ? c1 : c0, c => glow(40, c, .6)), my = mirror(sh.y); /* its glow in its two colours, crossfaded: added light, so exactly the glow of the colour between */
        g.globalAlpha = gk * wgt; g.drawImage(gw, sh.x - Rm * 1.5, sh.y - Rm * 1.5, Rm * 3, Rm * 3); g.globalAlpha = gk * .5 * wgt; g.drawImage(gw, sh.x - Rm * 1.3, my - Rm * .35, Rm * 2.6, Rm * .7); }
      // the stars: each at its place along its way, its trail behind it
      const willow = sh.kind === "willow", palm = sh.kind === "palm", tk = willow ? .55 : .38, fk = (willow ? .55 : palm ? .4 : .22) * Rm / Math.max(1, sh.life * .5);
      const trail = willow ? 1.4 : palm ? .6 : sh.kind === "kiku" ? .34 : sh.kind === "ring" ? .14 : .09, segs = willow ? 6 : 3, wid = (palm ? 3.4 : willow ? 1.7 : 2.1) * Math.max(.75, u / 10);
      const stars = sh.stars, n = stars.length, P2 = F.pos, D0 = Rm * (1 - Math.exp(-tau / tk)), DR0 = fk * tau * tau, ex0 = sh.x - D0 - 1, ex1 = sh.x + D0 + 1, ey0 = sh.y - D0 * 1.07 - 1, ey1 = sh.y + D0 * 1.07 + DR0 + 1, ry1 = hz + (hz - ey0) * .42 + 1;
      const near = sh.near.length ? sh.near.filter(([x0, y0, x1, y1]) => { const dx = Math.max(x0 - ex1, 0, ex0 - x1); return Math.hypot(dx, Math.max(y0 - ey1, 0, ey0 - y1)) < 24 || Math.hypot(dx, Math.max(y0 - ry1, 0, hz - y1)) < 24; }) : sh.near; /* of those, the ones near where its stars are now, and their dashes in the water */
      /** S.shade, from the words near enough to matter (the same number it gives) */
      const shade = near.length ? (x, y, r) => { let d = 1e9; for (const [x0, y0, x1, y1] of near) { const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1), q = Math.hypot(dx, dy); if (q < d) d = q; } return lerp(.1, 1, clamp((d - r * .5) / (r * 1.2 + 10))); } : null;
      let steps = 0; for (let j = 0; j <= segs; j++) { const tt = Math.max(0, tau - trail * j / segs), D = Rm * (1 - Math.exp(-tt / tk)), DR = fk * tt * tt, o = j * n * 2; for (let i = 0; i < n; i++) { const st = stars[i]; P2[o + i * 2] = sh.x + st.cx * D; P2[o + i * 2 + 1] = sh.y + st.cy * D + DR; } if (j < segs && tau - trail * j / segs > 0) steps = j + 1; } // where each is, at its head and at each step back along its trail
      g.strokeStyle = `rgb(${key})`; g.save(); g.beginPath(); g.rect(-10, -10, W + 20, hz + 10); g.clip(); /* far out over the bay: what falls to the horizon is in the water */
      for (let sgi = 0; sgi < steps; sgi++) { const o1 = sgi * n * 2, o2 = o1 + n * 2; g.globalAlpha = lum * (1 - sgi / segs) * .95; g.lineWidth = wid * (1 - sgi / segs * .6); g.beginPath(); for (let i = 0; i < n; i++) { const x1 = P2[o1 + i * 2], y1 = P2[o1 + i * 2 + 1]; if (shade && shade(x1, y1, 4) < .5) continue; g.moveTo(x1, y1); g.lineTo(P2[o2 + i * 2], P2[o2 + i * 2 + 1]); } g.stroke(); }
      const mq = Math.round(m * 7) / 7, dot = sprite(F.dots, c0.map((v, i) => Math.round(lerp(v, c1[i], mq))), c => glow(Math.max(4, Math.round(u * .55)), c, .9)), dw = dot.w2 * (palm ? 1.5 : 1), core = `rgb(${col.map(v => Math.round(lerp(v, 255, .55))).join(",")})`, rr = (palm ? 3.2 : 2.3) * Math.max(.8, u / 11); /* (its dots' colour in eighths of the way) */
      const R2 = F.refl; let nr = 0, ga = -1;
      g.fillStyle = core; for (let i = 0; i < n; i++) { const x = P2[i * 2], y = P2[i * 2 + 1], tw = willow ? .55 + .45 * Math.sin(A * 5 * stars[i].f + stars[i].tw) : 1, a = lum * tw * (shade ? shade(x, y, 6) : 1); if (a < .02 || y >= hz) continue; g.globalAlpha = a * .9; g.drawImage(dot, x - dw / 2, y - dw / 2, dw, dw); g.globalAlpha = a; g.fillRect(x - rr / 2, y - rr / 2, rr, rr); R2[nr++] = x; R2[nr++] = y; R2[nr++] = a; } /* each star's glow and then its core (in that order: light that runs to white adds up differently in another) */
      g.restore(); g.fillStyle = core;
      if (willow || palm || sh.kind === "kiku") { g.save(); g.beginPath(); g.rect(-10, hz + 1, W + 20, S.H - hz); g.clip(); g.lineWidth = wid * .7; for (let sgi = 0; sgi < steps; sgi++) { const o1 = sgi * n * 2, o2 = o1 + n * 2; g.globalAlpha = lum * (1 - sgi / segs) * .28; g.beginPath(); for (let i = 0; i < n; i++) { const y2 = P2[o2 + i * 2 + 1]; if (y2 >= hz) continue; g.moveTo(P2[o1 + i * 2], mirror(Math.min(P2[o1 + i * 2 + 1], hz))); g.lineTo(P2[o2 + i * 2], mirror(y2)); } g.stroke(); } g.restore(); } // its trails in the water too
      ga = -1; for (let q = 0; q < nr; q += 3) { const x = R2[q], my = mirror(R2[q + 1]), wv = Math.sin(A * 2.2 + x * .05) * u * .4, a2 = R2[q + 2] * .34 * (shade ? shade(x, my, 4) : 1); if (a2 !== ga) { ga = a2; g.globalAlpha = ga; } g.fillRect(x - 2.5 + wv, my, 5, 1); } // and in the water, a dash each
      g.globalCompositeOperation = "source-over"; }
    g.restore(); g.globalAlpha = 1; g.globalCompositeOperation = "lighter";
  }
  /* Dusk's second: the moonrise. The crescent dims away as a glow gathers on the sea between the headlands, and a huge moon
     rises out of the water there, amber as it clears the sea and paler as it climbs, its seas in halftone, its light a broad
     road of broken bars across the bay; a junk under full sail crosses its face from behind one headland to behind the
     other, its stern lanterns lit, its reflection under it; then the moon settles back into the sea, and the crescent is in
     the sky again. (The old travel posters' moon over a junk, in the same place as the sunset's sun.) */
  const LMR = { cres: [.3, 2.0, 13.0, 14.7], glow: [.9, 2.8, 12.2, 13.9], rise: [2.0, 6.6], set: [10.4, 13.6], junk: [4.6, 14.0] };
  /** the big moon and the junk, made once per layout */
  function moonMake() {
    const { pr } = S, Rb = S.sun.R, u = S.u, D = { gen };
    const disc = (c0, c1, c2, sea) => make(Rb * 2 + 2, Rb * 2 + 2, x => { const c = Rb + 1, gr = x.createRadialGradient(c - Rb * .25, c - Rb * .3, 0, c, c, Rb); gr.addColorStop(0, c0); gr.addColorStop(.7, c1); gr.addColorStop(1, c2); x.fillStyle = gr; x.beginPath(); x.arc(c, c, Rb, 0, TAU); x.fill();
      x.save(); x.beginPath(); x.arc(c, c, Rb, 0, TAU); x.clip(); x.fillStyle = sea;
      // its seas in halftone: a grid of dots, each as big as the sea is dark there — the Ocean of Storms, the Seas of Rains,
      // Serenity, Tranquillity, Crises, Fertility, Clouds, Moisture, Nectar — where they lie on the near side
      const MARIA = [[-.55, -.02, .2, .38, 1], [-.24, -.42, .24, .19, 1], [.17, -.35, .13, .12, .9], [.3, -.08, .17, .14, .9], [.66, -.27, .09, .08, .85], [.52, .14, .1, .14, .7], [-.12, .32, .16, .12, .6], [-.46, .36, .08, .08, .7], [.37, .33, .07, .08, .6], [0, .02, .1, .07, .5]];
      const sp = Math.max(2.2, Rb * .042); for (let gy = -Rb; gy <= Rb; gy += sp) for (let gx = -Rb + ((Math.round(gy / sp) & 1) ? sp / 2 : 0); gx <= Rb; gx += sp) { const nx = gx / Rb, ny = gy / Rb; if (nx * nx + ny * ny > 1) continue; let d = 0; for (const [mx, my, rx, ry, k] of MARIA) { const q = Math.pow((nx - mx) / rx, 2) + Math.pow((ny - my) / ry, 2); d += k * Math.exp(-q * 1.6); } d = clamp(d * 1.1 - .12); if (d < .04) continue; x.beginPath(); x.arc(c + gx, c + gy, sp * .52 * Math.sqrt(d), 0, TAU); x.fill(); }
      x.strokeStyle = "rgba(255,250,230,.45)"; x.lineWidth = Math.max(1.5, Rb * .02); x.beginPath(); x.arc(c, c, Rb - x.lineWidth / 2, 0, TAU); x.stroke(); x.restore();
      x.globalAlpha = .45; x.fillStyle = x.createPattern(K.grain(120, 120, 93, .12), "repeat"); x.beginPath(); x.arc(c, c, Rb, 0, TAU); x.fill(); });
    D.low = disc("#FFD58A", "#FFA453", "#F0703C", "rgba(190,78,50,.55)"); D.high = disc("#FFF4D2", "#FFE2A0", "#F3C27E", "rgba(176,124,84,.5)");
    D.halo = glow(Rb * 2.1, [255, 196, 120], .42); D.sea = glow(Rb * 1.4, [255, 170, 90], .6);
    // the junk (facing left): its high stern, three masts, lug sails stiffened with battens, moonlight along its edges
    const s = pr ? 1.35 : 1.5, J = make(15 * u * s, 11.5 * u * s, x => { x.translate(7 * u * s, 10.4 * u * s); x.scale(s, s); const col = "#0B0920", p = bez([["M", -6.4, -1.05], ["L", -5.5, 0], ["L", 4.5, 0], ["L", 5.9, -1.3], ["L", 6.3, -2.4], ["L", 4.3, -1.7], ["L", -4.2, -1.35], ["Z"]], u);
      const sails = [[-3.0, 7.0, 2.6], [.5, 9.2, 3.1], [3.7, 6.2, 2.3]];
      for (const [mx, h, w] of sails) p.addPath(bez([["M", mx - .15, -1.3], ["L", mx - .15, -h - .4], ["L", mx + .1, -h - .4], ["L", mx + .1, -1.3], ["Z"], ["M", mx - .5, -h], ["L", mx + w, -h + .9], ["Q", mx + w * 1.35, -h * .55, mx + w * 1.12, -1.9], ["L", mx - .4, -1.95], ["Z"]], u));
      p.addPath(bez([["M", .6, -9.6], ["L", 1.9, -9.25], ["L", .6, -8.9], ["Z"]], u)); sil(x, p, col, "rgba(255,214,160,.7)", u);
      x.strokeStyle = "rgba(255,200,150,.42)"; x.lineWidth = .07 * u; for (const [mx, h, w] of sails) for (let k = 1; k < 7; k++) { const f = k / 7, yy = lerp(-h + .45, -1.95, f); x.beginPath(); x.moveTo((mx - .45) * u, yy * u); x.lineTo((mx + w * (1.02 + .25 * Math.sin(f * Math.PI))) * u, (yy + .45 * (1 - f)) * u); x.stroke(); } }); // its battens
    J.ox = 7 / 15; J.oy = 10.4 / 11.5; D.junk = J; D.js = s; D.lamp = glow(Math.max(3, u * .9), [255, 190, 110], .9);
    return D;
  }
  /** where the big moon stands: clear of the lines' ends, as the sunset's sun is */
  function moonX() { const { W, hz, pr } = S, R = S.sun.R, band = (S.wr || []).filter(([x0, y0, x1, y1]) => y1 > hz - R * (pr ? 1.05 : 1.3) && y0 < hz && x1 - x0 > 84), xr = band.reduce((m, r) => Math.max(m, r[2]), 0); return clamp(Math.max(pr ? W * .5 : W * .72, xr + R * 1.02), pr ? W * .5 : W * .6, W - R * .45); }
  function lMoon(T, I, A, pl) {
    const { W, H, u, hz, pr } = S, mo = S.moon, mr = mo.r, L = lgGet(); if (!L.moon || L.moon.gen !== gen) L.moon = moonMake(); const D = L.moon, Rb = S.sun.R;
    if (L.mwr !== S.wr || L.mx === undefined) { L.mx = moonX(); L.mwr = S.wr; } const mx = L.mx;
    // the crescent, dimming away and back
    const cres = 1 - seg(T, LMR.cres[0], LMR.cres[1], E.sine) * (1 - seg(T, LMR.cres[2], LMR.cres[3], E.sine)) * I;
    if (cres > .005) { g.globalCompositeOperation = "lighter"; g.globalAlpha = .8 * cres; g.drawImage(S.moonGlow, mo.x - S.moonGlow.w2 / 2, mo.y - S.moonGlow.h2 / 2, S.moonGlow.w2, S.moonGlow.h2); g.globalCompositeOperation = "source-over";
      g.globalAlpha = cres; g.drawImage(S.moonDisc, mo.x - mr - 1, mo.y - mr - 1, S.moonDisc.w2, S.moonDisc.h2);
      g.globalCompositeOperation = "lighter"; g.fillStyle = "#CFC6FF"; for (const s of S.glints) { const y = hz + 2 + Math.pow(s.y, 1.3) * (H - hz) * .85, k = .5 + .5 * Math.sin(A * s.f + s.ph), w = (4 + s.w * 9) * u * (1 - s.y * .5) * k; g.globalAlpha = (.12 + .2 * k) * (1 - s.y * .5) * cres; g.fillRect(mo.x - w / 2 + s.s * 5 * u, y, w, .9); } }
    if (I <= .01) { g.globalCompositeOperation = "lighter"; return; }
    // the big moon: up out of the sea, held, and down again
    const up = E.out(seg(T, LMR.rise[0], LMR.rise[1], x => x)) * (1 - E.in(seg(T, LMR.set[0], LMR.set[1], x => x))), my = lerp(hz + Rb * 1.06, hz - Rb * (pr ? .3 : .42), up), vis = clamp((hz - (my - Rb)) / (Rb * 2)) * I, hi = clamp((hz - my) / (Rb * .42));
    const sea = env(T, LMR.glow[0], LMR.glow[1], LMR.glow[2], LMR.glow[3], E.sine) * I;
    g.globalCompositeOperation = "lighter";
    if (sea > .005) { g.globalAlpha = sea * .8; g.drawImage(D.sea, mx - Rb * 1.6, hz - Rb * .35, Rb * 3.2, Rb * .7); } // the sea aglow where it will rise
    if (vis > .005) { g.globalAlpha = vis * .9; g.drawImage(D.halo, mx - D.halo.w2 / 2, my - D.halo.h2 / 2, D.halo.w2, D.halo.h2); }
    // its light on the water, a road of broken bars
    if (vis > .005) for (const s of S.glints) { const y = hz + 2 + Math.pow(s.y, 1.5) * (H - hz) * .85, spread = Rb * (1.05 - s.y * .6), k = .5 + .5 * Math.sin(A * s.f + s.ph), w = spread * s.w * (.55 + .45 * k); g.globalAlpha = (.22 + .5 * k) * (1 - s.y * .6) * vis; g.fillStyle = s.y < .25 ? "#FFE3A0" : "#FFA864"; g.fillRect(mx - w / 2 + s.s * spread * .5, y, w, 1 + (1 - s.y) * 1.6); }
    g.globalCompositeOperation = "source-over";
    if (vis > .005) { g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip(); g.globalAlpha = I; g.drawImage(D.low, mx - Rb - 1, my - Rb - 1, D.low.w2, D.low.h2); g.globalAlpha = I * hi; g.drawImage(D.high, mx - Rb - 1, my - Rb - 1, D.high.w2, D.high.h2); g.restore();
      g.globalAlpha = .9 * I; g.fillStyle = "#FFE6B0"; g.fillRect(mx - Math.sqrt(Math.max(0, Rb * Rb - (hz - my) * (hz - my))), hz - .6, Math.sqrt(Math.max(0, Rb * Rb - (hz - my) * (hz - my))) * 2, 1.2); } // where it meets the sea
    // the junk: across its face, from behind one headland to behind the other
    const jk = seg(T, LMR.junk[0], LMR.junk[1], x => x); if (jk > 0 && jk < 1) { const J = D.junk, half = J.w2 * .5, x0 = W + half + 4, x1 = -half - 4, x = lerp(x0, x1, jk), /* in from behind the right headland, on behind the left and past the edge */ y = hz + .05 * u + Math.sin(A * .9) * .08 * u, roll = Math.sin(A * 1.1) * .015;
      if (!L.hc) { const c = new Path2D(); c.rect(-20, -20, W + 40, H + 40); for (const pts of [S.left, S.right]) { c.moveTo(pts[0][0], hz + 1); for (const q of pts) c.lineTo(q[0], Math.min(hz + 1, q[1])); c.lineTo(pts[pts.length - 1][0], hz + 1); c.closePath(); c.moveTo(pts[0][0], hz); for (const q of pts) c.lineTo(q[0], hz + (hz - Math.min(hz, q[1])) * .5); c.lineTo(pts[pts.length - 1][0], hz); c.closePath(); } L.hc = c; }
      g.save(); g.clip(L.hc, "evenodd"); g.globalAlpha = I * .3; g.save(); g.translate(x, y + .2 * u); g.scale(1, -.5); g.drawImage(J, -J.w2 * J.ox, -J.h2 * J.oy, J.w2, J.h2); g.restore(); // its reflection
      g.globalAlpha = I; g.save(); g.translate(x, y); g.rotate(roll); g.drawImage(J, -J.w2 * J.ox, -J.h2 * J.oy, J.w2, J.h2); g.restore();
      g.globalCompositeOperation = "lighter"; for (let k = 0; k < 3; k++) { const lx = x + (4.3 + k * .45) * u * D.js, ly = y - 1.5 * u * D.js; g.globalAlpha = I * (.85 + .15 * Math.sin(A * 7 + k)); g.drawImage(D.lamp, lx - D.lamp.w2 / 2, ly - D.lamp.h2 / 2, D.lamp.w2, D.lamp.h2); } g.restore(); } // its stern lanterns
    g.globalCompositeOperation = "lighter"; g.globalAlpha = 1;
  }

  return S;
}
