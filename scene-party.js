// scene-party.js — 1.12 b361: Birthday's and Superpink's scene, one party by day and by night (scenes.js loads it for
// either kit and says which). By day: a bouquet of glossy latex balloons in the largest open space on the page, each lit
// from up on the left, deeper at its edge where the latex is seen edge-on, light coming through it low on the far side, a
// soft shine with a sharp window in it, tied off in a puckered knot with a curl of ribbon, the strings gathered below the
// page; a garland of cloth pennants swagged across the top under the bar's wash. While the list is in use the balloons
// bob on their strings and the pennants stir. The loop, fifteen seconds: a gust runs along the garland; a balloon comes
// up from below and joins the bouquet; a party popper comes up at the foot of the page, shivers, and pops, and the
// bouquet is jostled — curly paper streamers unfurl out of it and confetti tumbles down, flipping as it falls, bright on
// its face and dull on its back, and off the bottom; the popper sinks away; the new balloon swells, trembles and pops in
// a snap of rubber and a ring of rushing air, its string dropping away; the top three of the bouquet slip free and float
// off past the top, and three more come up from below to take their places. The finale, under the kit's cake: the
// bouquet lets go, a flood of balloons near and far goes up past the top, and a new bouquet rises into place. By night:
// a disco. A mirror ball hangs on its chain in the open space, each tile showing what it reflects — a pink light, a gold
// one, a white one that wanders, or the dark room — so they glint in turn as it turns, and it throws round, soft spots of
// pink and gold in rows that slide across the whole room as a wall's spots do, slow behind the ball and quickening toward
// the sides, dim where they pass behind words; a few twinkles of the kit's own. While the list is in use it turns slowly.
// The loop: the ball is let down on its chain from high up; spotlights come up from below and sweep, and where one
// crosses the ball the spots of its colour bloom; they swing onto the ball and it spins up, the spots racing in streaks;
// glitter falls through the beams, catching them; the spin slows, the beams go down, and the ball is taken up again. The
// finale, under the kit's bloom: every beam swings onto the ball, it spins its fastest, and a storm of gold glitter
// falls. The lines sit on pads (scenes.js, `hug`). The beats are a table, so the forever cycle can deal them differently
// each time round.
export default function party(K, id) {
  const night = id === "superpink";
  const { clamp, lerp, E, seg, env, rng, canvas, rgb, mixc, css } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  /** a sprite drawn smooth at the screen's density, `w` by `h` CSS pixels */
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
  /** the same at a fraction `q` of a CSS pixel, for soft light that is stretched when it's drawn */
  const lo = (w, h, q, fn) => { const [c, x] = canvas(Math.ceil(w * q), Math.ceil(h * q)); x.imageSmoothingEnabled = true; x.scale(q, q); fn(x); c.w2 = w; c.h2 = h; return c; };
  /** a sprite at (x, y), its anchor (ax, ay) a fraction of its size, turned and scaled: one transform, no save */
  const put = (s, x, y, ax, ay, rot, sx, sy, a) => { if (a <= .004) return; const c = Math.cos(rot) * px, n = Math.sin(rot) * px; g.globalAlpha = a < 1 ? a : 1; g.setTransform(c * sx, n * sx, -n * sy, c * sy, x * px, y * px); g.drawImage(s, -s.w2 * ax, -s.h2 * ay, s.w2, s.h2); };
  const unit = () => { g.setTransform(px, 0, 0, px, 0, 0); g.globalAlpha = 1; };
  /** how far a thing thrown at v0 has gone along one axis after t seconds, the air slowing it (k) toward a steady vt */
  const fly = (v0, k, vt, t) => vt * t + (v0 - vt) * (1 - Math.exp(-k * t)) / k;
  const tint = (c, k) => mixc(c, [255, 255, 255], k), deep = (c, k) => c.map(v => Math.round(v * k));
  /** canvas shadows are in device pixels whatever the transform: scaled here so they read the same on every screen */
  const soft = (x, blur, dx, dy, col) => { x.shadowColor = col; x.shadowBlur = blur * px; x.shadowOffsetX = dx * px; x.shadowOffsetY = dy * px; };
  const unsoft = x => { x.shadowColor = "transparent"; x.shadowBlur = 0; x.shadowOffsetX = 0; x.shadowOffsetY = 0; };
  // the loop's beats, in seconds (the forever cycle can deal them differently)
  const B = night
    ? { lower: [1.0, 2.9], beams: [2.3, 3.1], sweep: 3.0, aim: [5.5, 6.4, 9.2, 10.3], spin: [5.8, 7.2, 8.9, 10.6], glitter: [6.2, 9.0], dim: [10.9, 12.0], raise: [12.2, 14.6] }
    : { gust: [.5, 2.7], guest: [1.0, 3.5], popper: [3.4, 4.5], pop: 4.75, sink: [5.9, 7.1], tremble: [9.0, 9.55], burst: 9.55, free: 10.3, back: [12.0, 14.95] };

  /* ---------------- by day: the party ---------------- */
  const BAL = ["#FF6FB5", "#4FC3A1", "#F6C84C", "#A98BE6", "#6CBCEB", "#FF7A5C", "#D62E86", "#F2B33A"];
  const CONF = ["#FF7FC4", "#5FC9AC", "#F7D774", "#B79BE8", "#7FC8F0", "#FF8A6B"];
  // the bouquet: where each balloon floats, in the open circle's radii from its middle; how near it is; its colour
  const SLOTS = [{ u: -.36, v: -.44, z: .9, c: 3 }, { u: .34, v: -.5, z: .88, c: 4 }, { u: -.02, v: -.72, z: .96, c: 7 }, { u: -.62, v: -.02, z: .98, c: 1 }, { u: .6, v: -.04, z: .96, c: 5 }, { u: -.22, v: -.1, z: 1.06, c: 0 }, { u: .2, v: -.14, z: 1.04, c: 6 }];
  const TRIO = [2, 0, 1], GUEST = 2; // the three at the top, which slip free; the colour of the one that comes and pops
  /** a latex balloon `w` wide: lit from up on the left, deeper at its edge, light through it low on the far side, a soft
   *  shine with a sharp window in it, its shadow on the wall; tied off in a puckered knot, where the sprite's anchor is */
  const balloon = (hex, w) => {
    const c = rgb(hex), h = w * 1.18, k = w * .075, pad = w * .24, W2 = w + pad * 2, H2 = h + k * 1.6 + pad * 2;
    const s = make(W2, H2, x => {
      x.translate(pad + w / 2, pad + h);
      const body = () => { x.beginPath(); x.moveTo(-w * .045, 0); x.bezierCurveTo(-w * .2, -h * .05, -w * .5, -h * .3, -w * .5, -h * .6); x.bezierCurveTo(-w * .5, -h * .87, -w * .28, -h, 0, -h); x.bezierCurveTo(w * .28, -h, w * .5, -h * .87, w * .5, -h * .6); x.bezierCurveTo(w * .5, -h * .3, w * .2, -h * .05, w * .045, 0); x.closePath(); };
      soft(x, w * .13, w * .06, w * .09, "rgba(150,40,100,.2)"); body(); x.fillStyle = hex; x.fill(); unsoft(x);
      let gr = x.createRadialGradient(-w * .2, -h * .74, w * .02, -w * .04, -h * .52, h * .74);
      gr.addColorStop(0, css(tint(c, .5))); gr.addColorStop(.26, css(tint(c, .06))); gr.addColorStop(.68, css(deep(c, .88))); gr.addColorStop(1, css(deep(c, .64)));
      body(); x.fillStyle = gr; x.fill();
      x.save(); body(); x.clip();
      gr = x.createRadialGradient(w * .16, -h * .24, 0, w * .16, -h * .24, w * .42); gr.addColorStop(0, css(tint(c, .45), .5)); gr.addColorStop(1, css(tint(c, .45), 0)); x.fillStyle = gr; x.fillRect(-w, -h * 1.1, w * 2, h * 1.2); /* light through the latex */
      body(); x.strokeStyle = css(deep(c, .55), .08); for (const lw of [.22, .13, .07, .03]) { x.lineWidth = w * lw; x.stroke(); } /* the edge, deeper where the latex is seen edge-on */
      x.lineWidth = w * .028; x.strokeStyle = css(tint(c, .65), .4); x.beginPath(); x.arc(-w * .02, -h * .56, w * .47, .3, 1.15); x.stroke(); /* the room's light, caught low on the far side */
      x.restore();
      x.save(); x.translate(-w * .2, -h * .71); x.rotate(-.5); x.scale(1, 1.75);
      gr = x.createRadialGradient(0, 0, 0, 0, 0, w * .19); gr.addColorStop(0, "rgba(255,255,255,.72)"); gr.addColorStop(.55, "rgba(255,255,255,.28)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, w * .19, 0, TAU); x.fill(); x.restore();
      x.save(); x.translate(-w * .235, -h * .75); x.rotate(-.5); x.fillStyle = "rgba(255,255,255,.95)"; x.beginPath(); x.ellipse(0, 0, w * .042, w * .095, 0, 0, TAU); x.fill(); x.restore();
      x.strokeStyle = "rgba(255,255,255,.38)"; x.lineWidth = w * .022; x.lineCap = "round"; x.beginPath(); x.arc(-w * .03, -h * .57, w * .41, -.42, .5); x.stroke(); /* a sheen down the far side */
      x.fillStyle = css(deep(c, .7)); x.beginPath(); x.moveTo(-w * .05, -k * .1); x.lineTo(w * .05, -k * .1); x.lineTo(k * .85, k * 1.15); x.quadraticCurveTo(0, k * 1.55, -k * .85, k * 1.15); x.closePath(); x.fill();
      x.fillStyle = css(tint(c, .3), .75); x.beginPath(); x.ellipse(-k * .25, k * .5, k * .16, k * .34, .35, 0, TAU); x.fill();
    });
    s.ax = (pad + w / 2) / W2; s.ay = (pad + h + k * 1.3) / H2; s.bh = h; s.bw = w; s.lift = h * .5 + k * 1.3; // its middle, above the knot
    return s;
  };
  /** a cloth pennant `w` by `h`, hanging from its hem: plain or dotted, lit from the top, its shadow on the wall */
  const pennant = (hex, dots, w, h) => make(w + 8, h + 8, x => {
    const c = rgb(hex); x.translate(4, 2);
    const tri = () => { x.beginPath(); x.moveTo(0, 0); x.lineTo(w, 0); x.lineTo(w * .5, h); x.closePath(); };
    soft(x, 3, 1, 2, "rgba(150,40,100,.2)"); tri(); x.fillStyle = hex; x.fill(); unsoft(x);
    x.save(); tri(); x.clip();
    const gr = x.createLinearGradient(0, 0, w * .4, h); gr.addColorStop(0, "rgba(255,255,255,.32)"); gr.addColorStop(.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(90,20,60,.14)"); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    if (dots) { x.fillStyle = "rgba(255,255,255,.62)"; const d = w / 4.2; for (let yy = d * .9, row = 0; yy < h; yy += d, row++) for (let xx = (row % 2 ? d : d * .5); xx < w; xx += d) { x.beginPath(); x.arc(xx, yy, d * .2, 0, TAU); x.fill(); } }
    x.fillStyle = css(deep(c, .78), .55); x.fillRect(0, 0, w, h * .11); /* the hem, folded over the string */
    x.restore();
  });
  /** a party popper `w` across its mouth and `l` long, in striped foil; its anchor is the middle of its mouth */
  const popperSpr = (w, l) => { const s = make(w * 1.5, l + w * .5, x => {
    x.translate(w * .75, w * .2);
    const cone = () => { x.beginPath(); x.moveTo(-w / 2, 0); x.lineTo(w / 2, 0); x.lineTo(w * .08, l); x.quadraticCurveTo(0, l * 1.02, -w * .08, l); x.closePath(); };
    soft(x, 4, 1, 2, "rgba(120,30,80,.25)"); cone(); x.fillStyle = "#F2B33A"; x.fill(); unsoft(x);
    x.save(); cone(); x.clip();
    x.fillStyle = "#D62E86"; for (let k = -2; k < 9; k++) { const y0 = k * l * .15; x.beginPath(); x.moveTo(-w, y0 + w * .45); x.lineTo(w, y0 - w * .45); x.lineTo(w, y0 - w * .45 + l * .065); x.lineTo(-w, y0 + w * .45 + l * .065); x.closePath(); x.fill(); }
    const gr = x.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, "rgba(80,10,40,.4)"); gr.addColorStop(.28, "rgba(255,255,255,.45)"); gr.addColorStop(.42, "rgba(255,255,255,0)"); gr.addColorStop(.8, "rgba(80,10,40,.12)"); gr.addColorStop(1, "rgba(80,10,40,.45)"); x.fillStyle = gr; x.fillRect(-w, 0, w * 2, l);
    x.restore();
    x.fillStyle = "#FFE3A0"; x.fillRect(-w / 2, 0, w, w * .12); x.fillStyle = "rgba(160,90,10,.4)"; x.fillRect(-w / 2, w * .1, w, w * .03); /* the foil band at the mouth */
  }); s.ax = .5; s.ay = (w * .2) / (l + w * .5); return s; };
  /** a scrap of burst rubber, curled */
  const scrapSpr = (hex, seed, sz) => { const rr = rng(seed), c = rgb(hex); return make(sz * 1.4, sz, x => {
    x.fillStyle = hex; x.beginPath(); x.moveTo(0, sz * (.3 + rr() * .2)); x.quadraticCurveTo(sz * .35, -sz * .1, sz * (.6 + rr() * .2), sz * .2); x.quadraticCurveTo(sz * 1.2, sz * .15, sz * 1.35, sz * (.45 + rr() * .2)); x.quadraticCurveTo(sz * .9, sz * .8, sz * (.35 + rr() * .2), sz * .95); x.quadraticCurveTo(sz * .15, sz * .6, 0, sz * .35); x.fill();
    x.fillStyle = css(deep(c, .65), .55); x.beginPath(); x.ellipse(sz * .7, sz * .55, sz * .35, sz * .12, .3, 0, TAU); x.fill(); }); };

  const layDay = (W, H, bg, r) => {
    const { pr, sc0 } = S;
    S.bw = pr ? 84 : 128; S.bal = BAL.map(c => balloon(c, S.bw)); S.rib = BAL.map(c => css(deep(rgb(c), .62), .72));
    S.scraps = BAL.map((c, i) => [0, 1, 2].map(k => scrapSpr(c, i * 7 + k + 1, (pr ? 10 : 14) * sc0)));
    S.slots = SLOTS.map(s => ({ ...s, ph: r() * TAU, ph2: r() * TAU, f: .8 + r() * .4 }));
    // the garland: swags between tacks just above the top, a pennant every so often along each
    const pw = (pr ? 17 : 24) * sc0, ph = (pr ? 22 : 32) * sc0, gap = (pr ? 25 : 35) * sc0;
    S.flags = CONF.map(c => [0, 1].map(d => pennant(c, d, pw, ph))); S.fax = (4 + pw / 2) / (pw + 8); S.fay = 2 / (ph + 8);
    const tacks = pr ? [-.05, .5, 1.05] : [-.04, .33, .67, 1.04];
    S.swags = tacks.slice(1).map((t1, i) => { const xa = W * tacks[i], xb = W * t1, n = Math.max(3, Math.round((xb - xa) / gap) - 1);
      return { xa, xb, sag: (pr ? 64 : 92) * sc0 * (.92 + r() * .16), ph: r() * TAU, flags: Array.from({ length: n }, (_, j) => ({ t: (j + 1) / (n + 1), c: (i * 4 + j) % 6, d: (i + j) % 3 === 1 ? 1 : 0, ph: r() * TAU })) }; });
    // the popper, and what's in it: confetti and streamers
    S.pw = (pr ? 22 : 30) * sc0; S.pl = (pr ? 48 : 66) * sc0; S.popper = popperSpr(S.pw, S.pl);
    S.conf = Array.from({ length: pr ? 96 : 160 }, () => ({ a: (r() - .5) * 1.4, v: .4 + r() * .7, k: 3 + r() * 2.5, vt: .1 + r() * .06, fl: (8 + r() * 20) * sc0, fw: 2 + r() * 2.5, ph: r() * TAU, c: Math.floor(r() * 6), strip: r() < .38, s: (.75 + r() * .55) * (pr ? 8 : 11) * sc0, spin: (r() - .5) * 7, flip: (4 + r() * 8) * (r() < .5 ? -1 : 1), f0: r() * TAU }));
    S.cq = new Float32Array(S.conf.length * 10);
    const ns = pr ? 6 : 9; S.strm = Array.from({ length: ns }, (_, i) => ({ a: (i / (ns - 1) - .5) * 1.15 + (r() - .5) * .15, v: .7 + r() * .45, c: (i * 5 + 1) % 6, ph: r() * TAU, tw: 6 + r() * 5, cf: .45 + r() * .3, cu: 10 + r() * 9, vt: .11 + r() * .04, dr: (r() - .5) * 30 }));
    S.sq = new Float32Array(41 * 9); /* a streamer's points: where laid, where curled, half its width, its face, its edge, behind a word */
    S.face = CONF.map(c => css(rgb(c))); S.back = CONF.map(c => css(mixc(deep(rgb(c), .86), [196, 150, 178], .38))); /* paper: its colour on the face, dull on the back */
    S.shreds = Array.from({ length: 11 }, (_, i) => ({ a: i / 11 * TAU + (r() - .5) * .5, v: 260 + r() * 320, k: Math.floor(r() * 3), spin: (r() - .5) * 18, flip: 6 + r() * 10 }));
    S.flood = Array.from({ length: pr ? 22 : 36 }, () => { const z = r(); return { x: .03 + r() * .94, d: r(), z, v: .6 + z * .35, s: .5 + z * .7, c: Math.floor(r() * BAL.length), ph: r() * TAU }; }).sort((a, b) => a.z - b.z); /* far to near */
    // the wall: the kit's blush, a warm light from up on the right, rosier low down, and the party's lights out of focus
    bg.fillStyle = "#FFF3F8"; bg.fillRect(0, 0, W, H);
    const m = Math.min(W, H), sun = bg.createRadialGradient(W * .92, -H * .04, 0, W * .92, -H * .04, Math.hypot(W, H) * .8);
    sun.addColorStop(0, "rgba(255,228,200,.7)"); sun.addColorStop(.45, "rgba(255,216,232,.3)"); sun.addColorStop(1, "rgba(247,214,232,.4)"); bg.fillStyle = sun; bg.fillRect(0, 0, W, H);
    const low = bg.createLinearGradient(0, H * .55, 0, H); low.addColorStop(0, "rgba(240,150,196,0)"); low.addColorStop(1, "rgba(240,150,196,.26)"); bg.fillStyle = low; bg.fillRect(0, 0, W, H);
    const WARM = ["#FF9FCF", "#FFC9A0", "#F9DC8A", "#D9B8F2", "#FF8FB8"];
    for (let k = 0; k < (pr ? 7 : 12); k++) { const bx = pr ? W * r() : W * (.56 + r() * .44), by = pr ? H * (.5 + r() * .5) : H * r(), rr = m * (.05 + r() * .09), c = rgb(WARM[k % 5]), gr = bg.createRadialGradient(bx, by, 0, bx, by, rr);
      gr.addColorStop(0, css(c, .22)); gr.addColorStop(.7, css(c, .15)); gr.addColorStop(1, css(c, 0)); bg.fillStyle = gr; bg.fillRect(bx - rr, by - rr, rr * 2, rr * 2); }
  };

  /** the party, at loop time T */
  const drawDay = (T, I, A, F) => {
    const { W, H, pr, sc0, cx, cy, R } = S, on = I > .01, fin = F >= 0, V = I * S.vis;
    // the garland: each swag sways and its sag breathes; the pennants turn on the string; a gust runs along it
    const gustAt = xf => on ? env(T - xf * .9, B.gust[0], B.gust[0] + .5, B.gust[0] + .8, B.gust[1], E.sine) * I : 0, fg = fin ? env(F, 0, .12, .6, 1, E.sine) : 0;
    for (const sw of S.swags) {
      const gm = Math.max(gustAt((sw.xa + sw.xb) / 2 / W), fg), sag = sw.sag * (1 + .04 * Math.sin(A * .8 + sw.ph) + gm * .12 * Math.sin(A * 4.1 + sw.ph)), sh = (sw.xb - sw.xa) * (.025 * Math.sin(A * .55 + sw.ph) + gm * .05 * Math.sin(A * 3.3));
      const at = t => { const q = 4 * t * (1 - t); return [lerp(sw.xa, sw.xb, t) + sh * q, -5 + sag * q]; };
      unit(); g.strokeStyle = "rgba(150,60,110,.55)"; g.lineWidth = pr ? 1 : 1.3; g.beginPath(); for (let k = 0; k <= 16; k++) { const [x, y] = at(k / 16); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      for (const f of sw.flags) { const [x, y] = at(f.t), [x2, y2] = at(f.t + .02), ga = Math.max(gustAt(x / W), fg), wave = Math.sin(A * 1.6 - x * .011 + f.ph * .3), turn = Math.sin(A * 2.2 + f.ph);
        put(S.flags[f.c][f.d], x, y, S.fax, S.fay, Math.atan2(y2 - y, x2 - x) + (.05 + ga * .32) * wave, 1 - (.06 + ga * .4) * (.5 + .5 * turn), 1, 1); }
    }
    unit();
    // where things go: the bouquet in the open circle, its strings gathered below the page; the new balloon beside it on
    // the side with more room; the popper at the foot of the page, in the corner on the bouquet's side
    const side = S.shade(cx + R * .9, cy - R * .3, 30) >= S.shade(cx - R * .9, cy - R * .3, 30) ? 1 : -1;
    const sink = (1 - S.vis) * (H - cy + R + 80), G = [cx + R * .06, H + (pr ? 80 : 120)], bwOf = z => clamp(R * .46, pr ? 38 : 54, pr ? 80 : 122) * z;
    const pside = cx > W / 2 ? 1 : -1, popX = clamp(cx + pside * R * 1.05, S.pw * .9, W - S.pw * .9), mouthY = H - S.pl - 14 * sc0, aim = [cx - pside * R * .15, cy - R * .6], aimRot = Math.atan2(aim[0] - popX, mouthY - aim[1]); /* in the corner on the bouquet's side, clear of the footer's wash, aimed back over it */
    const reach = Math.hypot(aim[0] - popX, mouthY - aim[1]), dir0 = -Math.PI / 2 + aimRot, ox = popX, oy = mouthY, pa = T - B.pop, late = T > 14.6 ? (15 - T) / .4 : 1; // (anything still falling as the loop comes round goes: a fallback, it is all off the foot by then)
    const gsc = bwOf(.95) / S.bw, gspr = S.bal[GUEST], gx = cx + side * R * .92, gy = cy - R * .3 + gspr.lift * gsc + sink, ba = T - B.burst;
    const items = []; // balloons this frame: sprite, colour, knot, turn, scale, alpha, and where its string goes
    const tether = (s, c, kx, ky, sc, a, wob, ph) => items.push({ s, c, kx, ky, sc, a, rot: Math.atan2(kx - G[0], G[1] - ky) + wob, ex: G[0], ey: G[1], qx: (kx + G[0]) / 2 + Math.sin(A * .8 + ph) * R * .06, qy: (ky + G[1]) / 2, ph });
    const trail = (s, c, kx, ky, sc, a, rot, len, lag, ph) => items.push({ s, c, kx, ky, sc, a, rot, ex: kx - lag, ey: ky + len, qx: kx - lag * .3 + Math.sin(A * 1.1 + ph) * len * .05, qy: ky + len * .5, ph });
    // the bouquet at home, bobbing on its strings; jostled by the popper's blast and by the balloon beside it bursting —
    // pushed away from each, and sprung back
    const jolts = on ? [[ox, oy, pa, 1.2], [gx, gy - gspr.lift * gsc, ba, .8]].filter(j => j[2] > 0 && j[2] < 3.5) : [];
    const home = S.slots.map(s => { const sc = bwOf(s.z) / S.bw, spr = S.bal[s.c]; let x = cx + s.u * R + Math.sin(A * .37 * s.f + s.ph) * R * .03, y = cy + s.v * R + Math.sin(A * .6 * s.f + s.ph2) * R * .022 + spr.lift * sc + sink, wob = Math.sin(A * .5 * s.f + s.ph) * .045;
      for (const [x0, y0, t, k] of jolts) { const dx = x - x0, dy = y - spr.lift * sc - y0, d = Math.hypot(dx, dy) || 1, f = k * I * Math.exp(-t * 2.4) * Math.sin(t * 8.5) * clamp(1.5 - d / (R * 2.4)); x += dx / d * f * R * .08; y += dy / d * f * R * .05; wob += (dx > 0 ? 1 : -1) * f * .12; }
      return { sc, spr, x, y, wob }; });
    // the three that come back up, behind the rest, in the bouquet's own order so they overlap as they did: from the
    // moment each slips free it waits below the page for its time; if the list is touched it comes up into place at once
    if (fin || (on && T >= B.free)) TRIO.slice().sort((a, b) => a - b).forEach(i => { const s = S.slots[i], h = home[i], ti = TRIO.indexOf(i);
      if (fin ? F <= .58 + ti * .03 : T <= B.free + ti * .22) return;
      const bt = fin ? seg(F, .58 + ti * .03, .97, E.out) : seg(T, B.back[0] + ti * .25, B.back[1], E.out), y = h.y + (1 - bt) * (H - h.y + h.spr.bh * h.sc + 60) * (fin ? 1 : I);
      if (y - h.spr.bh * h.sc < H + 10) tether(h.spr, s.c, h.x, y, h.sc, 1, h.wob, s.ph); });
    // the bouquet
    S.slots.forEach((s, i) => { const h = home[i], ti = TRIO.indexOf(i);
      if (fin) { const ft = F * 3.4 - .08 - i * .07; if (ft <= 0) { tether(h.spr, s.c, h.x, h.y, h.sc, 1, h.wob, s.ph); return; }
        const up = fly(0, 1.5, H * .8, ft), fx = h.x + Math.sin(ft * 1.3 + s.ph) * R * .08; trail(h.spr, s.c, fx, h.y - up, h.sc, .35 + .65 * S.shade(fx, h.y - up - h.spr.lift * h.sc, 30), Math.sin(ft * 1.9 + s.ph) * .1, H * .5, R * .1 * (s.u < 0 ? -1 : 1), s.ph);
        if (ti < 0 && F > .58 + i * .02) { const bt = seg(F, .58 + i * .02, .97, E.out); tether(h.spr, s.c, h.x, h.y + (1 - bt) * (H - h.y + h.spr.bh * h.sc + 60), h.sc, 1, h.wob, s.ph); }
        return; }
      const ft = ti >= 0 && on ? T - B.free - ti * .22 : -1;
      if (ft <= 0) { tether(h.spr, s.c, h.x, h.y, h.sc, 1, h.wob, s.ph); return; }
      const up = fly(0, 1.1, H * .4, ft), sx = (ti - 1) * R * .3 * E.out(clamp(ft / 3)) + Math.sin(ft * 1.4 + s.ph) * R * .06; /* slipped free: up and away, its string trailing (gone with the loop if the list is touched) */
      trail(h.spr, s.c, h.x + sx, h.y - up, h.sc, I * (.35 + .65 * S.shade(h.x + sx, h.y - up - h.spr.lift * h.sc, 30)), Math.sin(ft * 1.7 + s.ph) * .12 + h.wob, Math.hypot(G[0] - h.x, G[1] - h.y), (ti - 1) * R * .2, s.ph);
    });
    // the balloon that comes up to join them, and pops
    if (on && T > B.guest[0] && T < B.burst) {
      const q = seg(T, B.guest[0], B.guest[1], E.out), tr = seg(T, B.tremble[0], B.tremble[1], E.in), ky = lerp(H + gspr.bh * gsc + 40, gy, q) + Math.sin(A * .7) * R * .02 + Math.cos(T * 39) * tr;
      const kx = gx + Math.sin(T * 1.3) * R * .06 * (1 - q) + Math.sin(A * .45) * R * .02 + Math.sin(T * 47) * 1.6 * tr;
      trail(gspr, GUEST, kx, ky, gsc * (1 + tr * .09), V * (.35 + .65 * S.shade(kx, ky - gspr.lift * gsc, 30)), Math.sin(A * .6) * .05 + (1 - q) * Math.sin(T * 2.2) * .12, H, R * .1 * (1 - q), 1.7);
    }
    // the flood of the finale, in front: far ones small, slow and paler, near ones big and quick
    if (fin) for (const f of S.flood) {
      const t = F * 3.4 - f.d; if (t <= 0) continue;
      const sc = (pr ? 56 : 88) * sc0 * f.s / S.bw, spr = S.bal[f.c], ky = H + spr.bh * sc + 30 - t * f.v * H, len = spr.bh * sc * 1.5; if (ky + len < -10) continue;
      const kx = W * f.x + Math.sin(t * 1.7 + f.ph) * 18 * sc0;
      trail(spr, f.c, kx, ky, sc, (.62 + .38 * f.z) * (.15 + .85 * S.shade(kx, ky - spr.lift * sc, spr.bw * sc * .5)), Math.sin(t * 2.1 + f.ph) * .12, len, Math.sin(t * 1.7 + f.ph) * 10, f.ph);
    }
    // the strings first, each with a curl of ribbon at its knot, then the balloons over them
    g.lineWidth = pr ? 1 : 1.25;
    for (const it of items) {
      if (it.a <= .01) continue; g.globalAlpha = Math.min(1, it.a); g.strokeStyle = S.rib[it.c]; g.beginPath(); g.moveTo(it.kx, it.ky); g.quadraticCurveTo(it.qx, it.qy, it.ex, it.ey);
      const cs = it.sc * S.bw / 100, sw = Math.sin(A * 1.3 + it.ph) * .3; g.moveTo(it.kx, it.ky);
      for (let j = 1; j <= 17; j++) { const p = j * 1.15 + it.ph, d = j * 2.2 * cs, rr = cs * (2.4 + j * .16); g.lineTo(it.kx + Math.sin(p) * rr * 1.25 + Math.sin(sw) * d, it.ky + Math.cos(sw) * d + Math.cos(p) * rr); } /* the cut end of the ribbon, curled */
      g.stroke();
    }
    for (const it of items) put(it.s, it.kx, it.ky, it.s.ax, it.s.ay, it.rot, it.sc, it.sc, it.a);
    unit();
    // the pop: rubber flung out and falling, a snap of lines, and the string dropping away
    const age = T - B.burst;
    if (on && age >= 0 && age < 2.2) {
      const bx = gx, by = gy - gspr.lift * gsc * 1.1, rb = gspr.bw * gsc * .55;
      for (const s of S.shreds) { const x = bx + Math.cos(s.a) * rb * .6 + fly(Math.cos(s.a) * s.v, 4, 0, age), y = by + Math.sin(s.a) * rb * .6 + fly(Math.sin(s.a) * s.v, 4, 620, age); if (y > H + 20) continue;
        put(S.scraps[GUEST][s.k], x, y, .5, .5, s.a + s.spin * age, Math.cos(s.flip * age), 1, V); }
      unit();
      if (age < .22) { const q = age / .22; g.globalAlpha = V * (1 - q) * .8; g.strokeStyle = "#96125A"; g.lineWidth = 2.2 * sc0; g.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + .2, r0 = rb * (1 + q * .9), r1 = r0 + rb * .38 * (1 - q * .6); g.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0); g.lineTo(bx + Math.cos(a) * r1, by + Math.sin(a) * r1); } g.stroke();
        g.globalAlpha = V * (1 - q) * .3; g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(bx, by, rb * (.6 + q * .9), 0, TAU); g.fill();
        g.globalAlpha = V * (1 - q) * .7; g.strokeStyle = BAL[GUEST]; g.lineWidth = 3 * sc0 * (1 - q) + .5; g.beginPath(); g.arc(bx, by, rb * (.9 + E.out(q) * 1.1), 0, TAU); g.stroke(); } /* the air it held, rushing out */
      const ky = gy + fly(0, .8, 1500, age); if (ky < H + 20) { g.globalAlpha = V; g.strokeStyle = S.rib[GUEST]; g.lineWidth = pr ? 1 : 1.25; g.beginPath(); g.moveTo(gx, ky); for (let j = 1; j <= 20; j++) { const d = j * H / 20; g.lineTo(gx + Math.sin(j * .9 + age * 6) * Math.min(1, age * 3) * 9 * sc0, ky + d * (1 - Math.min(.4, age * .5))); } g.stroke(); }
      g.globalAlpha = 1;
    }
    // the popper's burst: up from below the page at the foot of the open space, a shiver, the pop, a kick, and back down
    if (on && pa > 0) {
      // the streamers: each a paper ribbon laid along its head's flight, every point of it falling from the moment it was
      // laid, so it unfurls, then drapes and falls away, curling across its path; it twists as it goes, bright on its
      // face and dull on its back. Its edges are shared point to point, so it bends smoothly
      const n = 40, q = S.sq, rw = (pr ? 3.8 : 5.6) * sc0;
      for (const st of S.strm) {
        const dir = dir0 + st.a, v0 = st.v * reach * 3.2, vx = Math.cos(dir) * v0, vy = Math.sin(dir) * v0, sEnd = Math.min(pa, .8);
        let low = 1e9;
        for (let j = 0; j <= n; j++) { const s = sEnd * j / n, fa = pa - s, o = j * 9; q[o] = ox + fly(vx, 3.2, 0, s) + st.dr * fa + Math.sin(fa * 1.9 + j * .2 + st.ph) * 14 * sc0 * Math.min(1, fa); q[o + 1] = oy + fly(vy, 3.2, 0, s) + 150 * s * s + fly(0, 1.6, st.vt * H, fa); if (q[o + 1] < low) low = q[o + 1]; }
        if (low > H + 10) continue;
        for (let j = 0; j <= n; j++) { const o = j * 9, a = Math.max(0, j - 1) * 9, b = Math.min(n, j + 1) * 9, tx = q[b] - q[a], ty = q[b + 1] - q[a + 1], tl = Math.hypot(tx, ty) || 1, s = sEnd * j / n, off = Math.sin(j * st.cf + st.ph + pa * 1.2) * st.cu * sc0 * Math.min(1, (pa - s) * 1.6 + .3);
          q[o + 2] = q[o] - ty / tl * off; q[o + 3] = q[o + 1] + tx / tl * off; const tw = Math.cos(s * st.tw + pa * 2.4 + st.ph); q[o + 4] = (rw * Math.abs(tw) + .7) / 2; q[o + 5] = tw >= 0 ? 0 : 1; }
        for (let j = 0; j <= n; j++) { const o = j * 9, a = Math.max(0, j - 1) * 9, b = Math.min(n, j + 1) * 9, tx = q[b + 2] - q[a + 2], ty = q[b + 3] - q[a + 3], tl = Math.hypot(tx, ty) || 1; q[o + 6] = -ty / tl * q[o + 4]; q[o + 7] = tx / tl * q[o + 4]; q[o + 8] = S.shade(q[o + 2], q[o + 3], 8) < .5 ? 1 : 0; }
        for (let face = 0; face < 2; face++) for (let lv = 0; lv < 2; lv++) {
          let any = false; g.beginPath();
          for (let j = 0; j < n; j++) { const o = j * 9, o2 = o + 9; if (q[o + 5] !== face || q[o + 8] !== lv) continue; any = true;
            g.moveTo(q[o + 2] + q[o + 6], q[o + 3] + q[o + 7]); g.lineTo(q[o2 + 2] + q[o2 + 6], q[o2 + 3] + q[o2 + 7]); g.lineTo(q[o2 + 2] - q[o2 + 6], q[o2 + 3] - q[o2 + 7]); g.lineTo(q[o + 2] - q[o + 6], q[o + 3] - q[o + 7]); g.closePath(); }
          if (any) { g.fillStyle = face ? S.back[st.c] : S.face[st.c]; g.globalAlpha = V * late * (lv ? .22 : 1); g.fill(); }
        }
      }
      // the confetti: thrown out of the mouth, slowed by the air, then falling at its own steady pace, fluttering side
      // to side, spinning, and tumbling over so it shows its dull back side and its bright face in turn
      const cq = S.cq; let nc = 0;
      for (const p of S.conf) {
        const dir = dir0 + p.a, v0 = p.v * reach * p.k, x = ox + fly(Math.cos(dir) * v0, p.k, 0, pa) + p.fl * (1 - Math.exp(-p.k * pa)) * Math.sin(pa * p.fw + p.ph), y = oy + fly(Math.sin(dir) * v0, p.k, p.vt * H, pa);
        if (y > H + 16) continue;
        const flip = Math.cos(p.f0 + p.flip * pa), spin = p.ph + p.spin * pa, hw = (p.strip ? p.s * .42 : p.s) / 2 * Math.max(.12, Math.abs(flip)), hh = (p.strip ? p.s * 1.5 : p.s) / 2, c = Math.cos(spin), s = Math.sin(spin), o = nc * 10;
        cq[o] = x - c * hw + s * hh; cq[o + 1] = y - s * hw - c * hh; cq[o + 2] = x + c * hw + s * hh; cq[o + 3] = y + s * hw - c * hh; cq[o + 4] = x + c * hw - s * hh; cq[o + 5] = y + s * hw + c * hh; cq[o + 6] = x - c * hw - s * hh; cq[o + 7] = y - s * hw + c * hh;
        cq[o + 8] = p.c * 2 + (flip >= 0 ? 0 : 1); cq[o + 9] = S.shade(x, y, p.s) < .5 ? 1 : 0; nc++;
      }
      for (let grp = 0; grp < 12; grp++) for (let lv = 0; lv < 2; lv++) {
        let any = false; g.beginPath();
        for (let i = 0; i < nc; i++) { const o = i * 10; if (cq[o + 8] !== grp || cq[o + 9] !== lv) continue; any = true; g.moveTo(cq[o], cq[o + 1]); g.lineTo(cq[o + 2], cq[o + 3]); g.lineTo(cq[o + 4], cq[o + 5]); g.lineTo(cq[o + 6], cq[o + 7]); g.closePath(); }
        if (!any) continue; g.fillStyle = grp & 1 ? S.back[grp >> 1] : S.face[grp >> 1]; g.globalAlpha = V * late * (lv ? .22 : 1); g.fill();
      }
      g.globalAlpha = 1;
    }
    if (on && T > B.popper[0] && T < B.sink[1]) {
      const up = seg(T, B.popper[0], B.popper[1], E.back) * (1 - seg(T, B.sink[0], B.sink[1], E.in)), rot = aimRot * seg(T, B.popper[0] + .2, B.popper[1] + .1, E.io) + env(T, B.pop - .6, B.pop - .45, B.pop - .12, B.pop) * Math.sin(T * 38) * .06;
      const kick = pa > 0 ? 9 * sc0 * Math.exp(-pa * 6) * Math.cos(pa * 22) : 0, ax = Math.sin(rot), ay = -Math.cos(rot);
      const mx = popX - ax * kick, my = lerp(H + S.pl + 30, mouthY, up) - ay * kick;
      unit(); g.globalAlpha = V; g.strokeStyle = "rgba(122,58,99,.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(mx - ax * S.pl, my - ay * S.pl); g.lineTo(mx - ax * S.pl + (pa > 0 ? 6 : 2) * sc0, H + 20); g.stroke(); /* its string, pulled from below */
      put(S.popper, mx, my, S.popper.ax, S.popper.ay, rot, 1, 1, V);
      unit(); const ca = pa > 0 ? pa : 0, cxp = mx + fly(ax * 700, 2.5, 0, ca), cyp = my + fly(ay * 700, 2.5, 900, ca); /* the paper cap, blown off */
      if (cyp < H + 10) { g.globalAlpha = V; g.save(); g.translate(cxp, cyp); g.rotate(rot + ca * 9); g.fillStyle = "#FFF6FA"; g.beginPath(); g.ellipse(0, 0, S.pw / 2, S.pw * .14, 0, 0, TAU); g.fill(); g.strokeStyle = "#D62E86"; g.lineWidth = 1.4; g.stroke(); g.restore(); }
      if (pa > 0 && pa < .35) { const q = pa / .35; g.globalAlpha = V * (1 - q) * .45; g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(ox + Math.cos(dir0) * q * 30 * sc0, oy + Math.sin(dir0) * q * 30 * sc0, S.pw * (.5 + q * 1.4), 0, TAU); g.fill(); } /* a puff of paper dust */
      g.globalAlpha = 1;
    }
  };

  /* ---------------- by night: the disco ---------------- */
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const LP = nrm([-.62, .4, .68]), LG = nrm([.66, .36, .66]); // the pink light and the gold one, from the ball toward each (the white one moves: drawNight)
  // the tiles' colours: the dark room in five greys, then each light's colour at three strengths
  const FILL = ["#1E0618", "#3A1233", "#653A5C", "#9C7894", "#D6C4D3", "#B8246F", "#FF67B2", "#FFD2EA", "#B5822B", "#FFCB5C", "#FFF2CC", "#8E7FA6", "#E2D6EE", "#FFFFFF"];
  const DOTC = ["#FF6FB8", "#FFD06A"], GLIT = ["#FFD36E", "#FF7FC4", "#FFFFFF", "#FFC2E2"];
  const layNight = (W, H, bg, r) => {
    const { pr } = S;
    // the ball's tiles: rows of them, fewer toward the poles, each a little askew, a line of grout round each
    S.facets = []; const rows = 18, eq = 36, gp = .016;
    for (let j = 1; j < rows - 1; j++) {
      const p0 = -Math.PI / 2 + Math.PI * j / rows, p1 = p0 + Math.PI / rows, pm = (p0 + p1) / 2, n = Math.max(6, Math.round(eq * Math.cos(pm))), e = gp / Math.max(.3, Math.cos(pm));
      for (let i = 0; i < n; i++) { const l0 = (i + (j % 2) * .5) / n * TAU, l1 = l0 + TAU / n;
        S.facets.push({ c0: Math.cos(p0 + gp), y0: -Math.sin(p0 + gp), c1: Math.cos(p1 - gp), y1: -Math.sin(p1 - gp), cm: Math.cos(pm), ym: -Math.sin(pm), l0: l0 + e, l1: l1 - e, lm: (l0 + l1) / 2, jx: (r() - .5) * .16, jy: (r() - .5) * .16, b: r() }); }
    }
    S.fq = new Float32Array(S.facets.length * 9); S.tilt = .36; if (S.th === undefined) S.th = 1.3;
    // the spots it throws: two lattices of directions from the ball, the pink light's and the gold one's, in rows as its
    // tiles lie, turning with it; each lands where it meets the wall behind
    S.dots = []; const per = pr ? 19 : 21; /* (a lattice a third sparser than the first cut's: the same room of spots at two thirds the drawing) */
    for (let fam = 0; fam < 2; fam++) for (let j = -5; j <= 5; j++) { const phi = (j + fam * .5) * .22, cp = Math.cos(phi), n = Math.max(4, Math.round(per * cp));
      for (let i = 0; i < n; i++) { const lam = (i + (j & 1) * .5) / n * TAU + fam * .31 + (r() - .5) * .06; S.dots.push({ x: cp * Math.sin(lam), y: -Math.sin(phi), z: cp * Math.cos(lam), c: fam, s: .85 + r() * .3, b: .75 + r() * .25 }); } }
    S.Dz = Math.max(W, H) * (pr ? .5 : .36); S.spotR = pr ? 7.5 : 10;
    S.spots = DOTC.map(c => make(32, 32, x => { const cc = rgb(c), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, css(tint(cc, .4))); gr.addColorStop(.5, css(tint(cc, .12), .95)); gr.addColorStop(.72, css(cc, .55)); gr.addColorStop(.88, css(cc, .14)); gr.addColorStop(1, css(cc, 0)); x.fillStyle = gr; x.fillRect(0, 0, 32, 32); }));
    // the glints on the tiles, a star of light each, in each light's colour
    S.glints = ["#FFD2EA", "#FFF2CC", "#FFFFFF"].map(c => make(64, 64, x => { const cc = rgb(c); let gr = x.createRadialGradient(32, 32, 0, 32, 32, 14); gr.addColorStop(0, css(cc, 1)); gr.addColorStop(1, css(cc, 0)); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      for (const [a, l] of [[0, 30], [Math.PI / 2, 30], [Math.PI / 4, 12], [-Math.PI / 4, 12]]) { x.save(); x.translate(32, 32); x.rotate(a); gr = x.createLinearGradient(-l, 0, l, 0); gr.addColorStop(0, css(cc, 0)); gr.addColorStop(.5, css(cc, .9)); gr.addColorStop(1, css(cc, 0)); x.fillStyle = gr; x.beginPath(); x.ellipse(0, 0, l, 1.3, 0, 0, TAU); x.fill(); x.restore(); } }));
    S.halo = make(128, 128, x => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,90,170,.55)"); gr.addColorStop(.4, "rgba(255,60,150,.2)"); gr.addColorStop(1, "rgba(255,46,154,0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); });
    S.rim = make(100, 100, x => { let gr = x.createRadialGradient(50, 50, 0, 50, 50, 50); gr.addColorStop(0, "rgba(14,0,9,0)"); gr.addColorStop(.62, "rgba(14,0,9,0)"); gr.addColorStop(.88, "rgba(14,0,9,.38)"); gr.addColorStop(1, "rgba(14,0,9,.75)"); x.fillStyle = gr; x.beginPath(); x.arc(50, 50, 50, 0, TAU); x.fill();
      x.lineWidth = 2.2; x.strokeStyle = "rgba(255,80,165,.5)"; x.beginPath(); x.arc(50, 50, 48.5, Math.PI * .55, Math.PI * .95); x.stroke(); x.strokeStyle = "rgba(255,210,110,.42)"; x.beginPath(); x.arc(50, 50, 48.5, Math.PI * .08, Math.PI * .42); x.stroke(); });
    // the spotlights, from below the page: soft cones, brightest at their foot, with haze drifting in them
    const LB = Math.hypot(W, H) * 1.05, ha = .075, wB = LB * Math.tan(ha) * 2.6 + 8, cols = pr ? ["#FF2E9A", "#FFD36E"] : ["#FF2E9A", "#FFD36E", "#FF7FC4"];
    S.beamSpr = cols.map((col, ci) => lo(wB, LB, .16, x => { const c = rgb(col), m = wB / 2, rb = rng(61 + ci);
      for (let q = 0; q < 7; q++) { const a = ha * (1.3 - q * .16); x.beginPath(); x.moveTo(m - 3, LB); x.lineTo(m - LB * Math.tan(a), 0); x.lineTo(m + LB * Math.tan(a), 0); x.lineTo(m + 3, LB); x.closePath(); const gr = x.createLinearGradient(0, LB, 0, 0); gr.addColorStop(0, css(c, .2)); gr.addColorStop(.3, css(c, .1)); gr.addColorStop(.75, css(c, .03)); gr.addColorStop(1, css(c, 0)); x.fillStyle = gr; x.fill(); }
      for (let k = 0; k < 9; k++) { const t = .15 + rb() * .75, yy = LB * (1 - t), ww = LB * t * Math.tan(ha) * .7, gr = x.createRadialGradient(m + (rb() - .5) * ww, yy, 0, m + (rb() - .5) * ww, yy, ww * (.5 + rb() * .5)); gr.addColorStop(0, css(tint(c, .3), .1)); gr.addColorStop(1, css(c, 0)); x.fillStyle = gr; x.fillRect(0, yy - ww, wB, ww * 2); } }));
    const xs = pr ? [.04, .96] : [.02, .86, .99];
    S.beams = xs.map((f, i) => ({ x: W * f, y: H + 30, spr: i, fam: pr ? i : [0, 1, 0][i], base: f < .5 ? .5 : -.42 - (f > .95 ? .12 : 0), amp: .34 + i * .06, f: .85 + i * .17, ph: i * 2.1 }));
    // the glitter that falls through the beams, and the finale's storm of it; a few twinkles of the kit's own field
    S.glit = Array.from({ length: pr ? 120 : 200 }, () => ({ x: r(), t: r(), v: .2 + r() * .1, fw: 1 + r() * 2, ph: r() * TAU, c: Math.floor(r() * 4), s: 1.8 + r() * 2.2, f: .5 + r() * .6 }));
    S.storm = Array.from({ length: pr ? 130 : 220 }, () => ({ x: r(), t: r(), v: .62 + r() * .25, fw: 1 + r() * 2, ph: r() * TAU, c: r() < .6 ? 0 : Math.floor(r() * 4), s: 2 + r() * 2.4, f: .5 + r() * .6 }));
    S.tw = Array.from({ length: pr ? 14 : 24 }, () => ({ x: r() * W, y: H * (.12 + r() * .82), c: Math.floor(r() * 4), s: 1.4 + r() * 2, f: TAU / (2.4 + r() * 4), ph: r() * TAU }));
    S.pad = make(160, 80, x => { for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(63,0,38,.16)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } }); /* the room in shadow under a line */
    // the room: deep plum velvet in folds, darker overhead and in the corners, a pink haze low down where the lights are
    bg.fillStyle = "#3F0026"; bg.fillRect(0, 0, W, H);
    const fw = pr ? 52 : 78; for (let x0 = -fw * r(); x0 < W; x0 += fw * (.7 + r() * .6)) { const w = fw * (.8 + r() * .5), gr = bg.createLinearGradient(x0, 0, x0 + w, 0); gr.addColorStop(0, "rgba(20,0,12,.18)"); gr.addColorStop(.42, "rgba(255,120,200,.045)"); gr.addColorStop(.6, "rgba(255,120,200,.025)"); gr.addColorStop(1, "rgba(20,0,12,.18)"); bg.fillStyle = gr; bg.fillRect(x0, 0, w, H); }
    let gr = bg.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(18,0,11,.5)"); gr.addColorStop(.18, "rgba(18,0,11,0)"); gr.addColorStop(.7, "rgba(255,46,154,0)"); gr.addColorStop(1, "rgba(255,46,154,.12)"); bg.fillStyle = gr; bg.fillRect(0, 0, W, H);
    gr = bg.createRadialGradient(W * .6, H * .45, Math.min(W, H) * .3, W * .55, H * .5, Math.hypot(W, H) * .62); gr.addColorStop(0, "rgba(14,0,8,0)"); gr.addColorStop(1, "rgba(14,0,8,.5)"); bg.fillStyle = gr; bg.fillRect(0, 0, W, H);
  };

  /** the disco, at loop time T */
  const drawNight = (T, I, A, F, dt) => {
    const { W, H, pr, cx, cy, R } = S, on = I > .01, fin = F >= 0 ? env(F, 0, .16, .7, 1, E.sine) : 0;
    // the ball: let down on its chain from its resting height, swinging a little, and back up; turning, faster in the race
    const br = S.ballR(R), yRest = Math.min(S.rest, cy), yLow = cy + (R - br) * .3;
    const drop = on ? seg(T, B.lower[0], B.lower[1], E.back) * (1 - seg(T, B.raise[0], B.raise[1], E.io)) * I : 0, after = T - B.lower[1];
    const sw = Math.sin(A * .7) * .01 + (on && after > 0 ? Math.sin(after * 5.2) * Math.exp(-after * 1.5) * .035 * I : 0);
    const L = lerp(yRest, yLow, drop) + 12 - (1 - S.vis) * (yRest + br + 80), bx = cx + Math.sin(sw) * L, by = -12 + Math.cos(sw) * L;
    const race = on ? env(T, B.spin[0], B.spin[1], B.spin[2], B.spin[3], E.sine) * I : 0, w = .045 + race * 1.3 + fin * 2.2;
    S.th = (S.th + dt * w) % (TAU * 100);
    // the beams: up from below one by one, sweeping; then onto the ball, and apart again, and down
    const aimK = Math.max(on ? env(T, B.aim[0], B.aim[1], B.aim[2], B.aim[3], E.sine) * I : 0, fin);
    const lit = [.85 + fin * .5, .75 + fin * .5, .55 + fin * .3];
    let most = 0;
    for (const [i, b] of S.beams.entries()) {
      b.inten = Math.max(on ? env(T, B.beams[0] + i * .35, B.beams[1] + i * .35, B.dim[0] + i * .2, B.dim[1] + i * .2, E.sine) * I : 0, fin);
      const toBall = Math.atan2(bx - b.x, b.y - by), sweep = b.base + b.amp * Math.sin((T - B.sweep) * b.f + b.ph);
      b.ang = lerp(sweep, toBall, aimK); b.hit = b.inten * Math.exp(-(((b.ang - toBall) / .15) ** 2)); lit[b.fam] += b.hit * .9; most = Math.max(most, b.inten);
    }
    for (let k = 0; k < 3; k++) lit[k] = Math.min(lit[k], 1.9);
    g.globalCompositeOperation = "lighter";
    for (const b of S.beams) if (b.inten > .004) put(S.beamSpr[b.spr], b.x, b.y, .5, 1, b.ang, 1, 1, b.inten * .62);
    g.globalCompositeOperation = "source-over";
    // under each line the room steps back into shadow, the beams with it (the stage lays its pads over this)
    for (const [x0, y0, x1, y1, kind] of S.raw || []) if (kind === 1) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; put(S.pad, x0 - mx, y0 - my, 0, 0, 0, (x1 - x0 + mx * 2) / 160, (y1 - y0 + my * 2) / 80, .45 + most * .45); }
    g.globalCompositeOperation = "lighter";
    put(S.halo, bx, by, .5, .5, 0, br * 2.6 / 64, br * 2.6 / 64, .5 + (lit[0] + lit[1] - 1) * .35);
    // the spots on the walls: each a direction from the ball, turning with it, where it meets the wall behind; round and
    // soft, larger and drawn out the farther off they land, streaking when the ball races, dim behind the words
    const cs = Math.cos(S.th), sn = Math.sin(S.th), Dz = S.Dz;
    for (const d of S.dots) {
      const dx = d.x * cs + d.z * sn, dz = d.z * cs - d.x * sn; if (dz > -.3) continue;
      const k = 1 / -dz, x = bx + dx * Dz * k, y = by + d.y * Dz * k; if (x < -80 || x > W + 80 || y < -80 || y > H + 80) continue;
      const rr = S.spotR * d.s * Math.sqrt(k), el = Math.pow(k, .55), vX = -w * Dz * (dx * dx + dz * dz) * k * k, vY = -w * Dz * d.y * dx * k * k, streak = Math.hypot(vX, vY) / 30 * 1.5;
      const long = streak > rr * (el - 1), ang = long ? Math.atan2(vY, vX) : Math.atan2(y - by, x - bx), maj = long ? rr + streak : rr * el;
      const a = lit[d.c] * .7 * d.b * clamp((-dz - .3) / .15) * S.shade(x, y, rr) * (long ? rr * el / maj : 1);
      put(S.spots[d.c], x, y, .5, .5, ang, maj / 16, rr / 16, a);
    }
    // the twinkles
    unit(); for (const t of S.tw) { const a = (.15 + .85 * Math.pow(.5 + .5 * Math.sin(A * t.f + t.ph), 3)) * S.shade(t.x, t.y, 6) * .8; if (a < .02) continue; g.globalAlpha = a; g.fillStyle = GLIT[t.c]; g.fillRect(t.x - t.s / 2, t.y - t.s / 2, t.s, t.s); g.fillRect(t.x - t.s * 1.6, t.y - .35, t.s * 3.2, .7); g.fillRect(t.x - .35, t.y - t.s * 1.6, .7, t.s * 3.2); }
    // the glitter: falling from above the page and off the foot, glinting as it turns, bright where a beam catches it
    const fleck = (p, y, x) => { let inB = 0; for (const b of S.beams) { if (b.inten < .02) continue; const d = Math.abs(Math.atan2(x - b.x, b.y - y) - b.ang); if (d < .1) inB = Math.max(inB, (1 - d / .1) * b.inten); }
      return (.25 + .75 * Math.pow(Math.abs(Math.sin(A * p.f * Math.PI + p.ph)), 6)) * (.45 + 1.4 * inB) * S.shade(x, y, 6); };
    const spark = (p, x, y, a) => { if (a < .02) return; g.globalAlpha = Math.min(1, a); g.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s); if (a > .7) { const l = p.s * 2.2 * a; g.fillRect(x - l, y - .4, l * 2, .8); g.fillRect(x - .4, y - l, .8, l * 2); } }; /* a fleck, and a cross of light on the brightest */
    const gx0 = pr ? 0 : clamp(bx - W * .3, 0, W * .4), gw = pr ? W : Math.min(W - gx0, W * .6);
    for (let c = 0; c < 4; c++) {
      g.fillStyle = GLIT[c];
      if (on) for (const p of S.glit) { if (p.c !== c) continue; const age = T - lerp(B.glitter[0], B.glitter[1], p.t); if (age < 0) continue; const y = -8 + age * p.v * H; if (y > H + 8) continue; const x = gx0 + p.x * gw + Math.sin(age * p.fw + p.ph) * 12;
        spark(p, x, y, I * fleck(p, y, x)); }
      if (F >= 0) for (const p of S.storm) { if (p.c !== c) continue; const age = F * 3.4 - p.t * 1.6; if (age < 0) continue; const y = -8 + age * p.v * H; if (y > H + 8) continue; const x = p.x * W + Math.sin(age * p.fw + p.ph) * 14;
        spark(p, x, y, fleck(p, y, x)); }
    }
    g.globalCompositeOperation = "source-over";
    // the chain, from past the top of the page down to the ball's cap
    { const ux = Math.sin(sw), uy = Math.cos(sw), step = pr ? 6 : 7.5, capX = bx - ux * br * .98, capY = by - uy * br * .98;
      g.lineWidth = pr ? 1.2 : 1.5; g.strokeStyle = "#E6C6DC"; const links = [];
      for (let k = 1; ; k++) { const x = capX - ux * (k * step), y = capY - uy * (k * step); if (y < -10) break; const s = S.shade(x, y, 6); links.push(x, y, k % 2, s > .9 ? 0 : s > .4 ? 1 : 2); }
      for (let lv = 0; lv < 3; lv++) { g.beginPath(); let any = false; /* its links, a ring and one seen edge-on in turn, fainter behind the words */
        for (let i = 0; i < links.length; i += 4) { if (links[i + 3] !== lv) continue; any = true; const x = links[i], y = links[i + 1];
          if (links[i + 2]) { g.moveTo(x + Math.cos(sw) * step * .3, y + Math.sin(sw) * step * .3); g.ellipse(x, y, step * .3, step * .58, sw, 0, TAU); } else { g.moveTo(x - ux * step * .55, y - uy * step * .55); g.lineTo(x + ux * step * .55, y + uy * step * .55); } }
        if (any) { g.globalAlpha = [.75, .45, .19][lv]; g.stroke(); } }
      g.globalAlpha = 1; g.fillStyle = "#6E4A64"; g.save(); g.translate(capX, capY); g.rotate(sw); g.fillRect(-br * .1, -br * .02, br * .2, br * .1); g.fillStyle = "#C9A9C0"; g.fillRect(-br * .1, -br * .02, br * .2, br * .03); g.restore(); }
    // the ball: its tiles, grouped by colour and each group filled at once; which colour a tile shows is what it
    // reflects of the room — the pink light, the gold one, the white one, or the dark room and its lit floor
    g.fillStyle = "#14030E"; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
    const cT = Math.cos(S.tilt), sT = Math.sin(S.tilt), th = S.th, q = S.fq, gl = []; let nq = 0;
    const ka = A * .23, LK = nrm([Math.sin(ka) * .5, -.58 + Math.cos(ka * .7) * .14, .72]); /* the white light wanders, and its highlight travels over the upper tiles */
    const calm = 1 / (1 + w * .7), hotAt = .45 + (1 - calm) * .35; /* the faster it turns the more often a tile passes the light: softer glints then, a shimmer and never a flashing */
    for (const f of S.facets) {
      const lm = f.lm + th, sl = Math.sin(lm), cl = Math.cos(lm), Zc = f.ym * sT + f.cm * cl * cT; if (Zc < .03) continue;
      const Xc = f.cm * sl, Yc = f.ym * cT - f.cm * cl * sT; let nx = Xc + f.jx, ny = Yc + f.jy, nz = Zc; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;
      const dP = Math.max(0, rx * LP[0] + ry * LP[1] + rz * LP[2]), dG = Math.max(0, rx * LG[0] + ry * LG[1] + rz * LG[2]), dK = Math.max(0, rx * LK[0] + ry * LK[1] + rz * LK[2]);
      const hp = lit[0] * Math.pow(dP, 9), hg = lit[1] * Math.pow(dG, 9), hk = lit[2] * Math.pow(dK, 12);
      let fam = 0, m = hp, d = dP; if (hg > m) { fam = 1; m = hg; d = dG; } if (hk > m) { fam = 2; m = hk; d = dK; }
      const hot = Math.pow(d, 50); /* only a tile turned just so throws the light straight back: a glint, as bright as the light */
      const grp = m > .1 ? 5 + fam * 3 + (hot > hotAt ? 2 : m > .4 ? 1 : 0) : clamp(Math.floor((.08 + .5 * f.b + .5 * Math.max(0, ry) + .12 * Zc) * 5), 0, 4);
      const a0 = f.l0 + th, a1 = f.l1 + th, s0 = Math.sin(a0), c0 = Math.cos(a0), s1 = Math.sin(a1), c1 = Math.cos(a1), o = nq * 9;
      q[o] = bx + br * f.c0 * s0; q[o + 1] = by + br * (f.y0 * cT - f.c0 * c0 * sT); q[o + 2] = bx + br * f.c0 * s1; q[o + 3] = by + br * (f.y0 * cT - f.c0 * c1 * sT);
      q[o + 4] = bx + br * f.c1 * s1; q[o + 5] = by + br * (f.y1 * cT - f.c1 * c1 * sT); q[o + 6] = bx + br * f.c1 * s0; q[o + 7] = by + br * (f.y1 * cT - f.c1 * c0 * sT); q[o + 8] = grp; nq++;
      if (hot > .3 && m > .1 && gl.length < 40) gl.push(bx + br * Xc, by + br * Yc, hot * Math.min(1.4, lit[fam]), fam);
    }
    for (let grp = 0; grp < FILL.length; grp++) { let any = false; g.beginPath(); for (let i = 0; i < nq; i++) { const o = i * 9; if (q[o + 8] !== grp) continue; any = true; g.moveTo(q[o], q[o + 1]); g.lineTo(q[o + 2], q[o + 3]); g.lineTo(q[o + 4], q[o + 5]); g.lineTo(q[o + 6], q[o + 7]); g.closePath(); } if (any) { g.fillStyle = FILL[grp]; g.fill(); } }
    put(S.rim, bx, by, .5, .5, 0, br * 2 / 100, br * 2 / 100, 1);
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < gl.length; i += 4) { const k = clamp((gl[i + 2] - .3) / 1.1), z = br * (.28 + .5 * k) / 32 * (.6 + .4 * calm); put(S.glints[gl[i + 3]], gl[i], gl[i + 1], .5, .5, .2, z, z, (.45 + .55 * k) * calm); }
    g.globalCompositeOperation = "source-over";
  };

  const S = {
    res: "dpr",
    wash: night ? 1 : 1.6, veil: night ? .6 : 1, // a light kit's small words have no room for a picture under them; a dark kit's have
    hug: night ? .72 : .8, hugFinale: true, list: .4, // the lines and the finale's words sit on pads, so the list's band keeps only a light wash
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, sc0 = pr ? clamp(W / 390, .85, 1.3) : clamp(Math.min(W / 1440, H / 900), .75, 1.35);
      Object.assign(S, { W, H, pr, sc0, Rmin: pr ? 60 : 80, Rmax: pr ? 170 : 270 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .36, 140) : Math.min(W * .16, H * .3), x0 = pr ? W * .5 : W * .8, y0 = pr ? H * .74 : H * .5; Object.assign(S, { cx: x0, cy: y0, R: R0, tx: x0, ty: y0, tR: R0, rest: y0 - R0 * .6, trest: y0 - R0 * .6 }); }
      (night ? layNight : layDay)(W, H, bg, rng(night ? 229 : 131));
      if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the largest circle of open page, clear of them, the edges, the bar and the
     *  footer's pool; the showpiece settles there, as big as it allows, and glides when it moves. By night the chain runs
     *  up from it to the top of the page, and by day the strings run down from it off the foot: better not through a line */
    words(rects) {
      S.raw = rects; S.wr = rects.map(([x0, y0, x1, y1]) => [x0 - 8, y0 - 6, x1 + 8, y1 + 6]); if (!S.W) return;
      { // how far every point of the page is from a word, worked out once here on a grid of 8 px, so what crosses the page
        // asks it for the price of a lookup rather than a walk past every word (the spots, the glitter, the confetti)
        const gw = Math.ceil(S.W / 8) + 1, gh = Math.ceil(S.H / 8) + 1, df = new Float32Array(gw * gh);
        for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) { const x = i * 8, y = j * 8; let d = 1e9; for (const [x0, y0, x1, y1] of S.wr) { const e = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)); if (e < d) d = e; } df[j * gw + i] = d; }
        Object.assign(S, { df, dfW: gw, dfH: gh }); }
      const { W, H, pr } = S, gap = pr ? 14 : 24, top = pr ? 92 : 104, foot = H - (pr ? 96 : 100), lines = rects.filter(q => q[4] === 1);
      const crosses = (x, y0, y1) => lines.some(([a, b, c, d]) => x > a - 10 && x < c + 10 && d > y0 && b < y1);
      let best = 0, bx = S.tx, by = S.ty, brad = 0;
      for (let j = 0; j <= 24; j++) for (let i = 0; i <= 32; i++) {
        const x = W * (.04 + .92 * i / 32), y = top + (foot - top) * j / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y); if (rad <= 0) continue;
        for (const [x0, y0, x1, y1] of rects) { rad = Math.min(rad, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)) - gap); if (rad <= 0) break; }
        if (rad <= 0) continue; const score = rad * (crosses(x, night ? 0 : y, night ? y : H) ? .6 : 1);
        if (score > best) { best = score; bx = x; by = y; brad = rad; }
      }
      Object.assign(S, { tx: bx, ty: by, tR: clamp(brad, S.Rmin, S.Rmax), room: brad >= S.Rmin ? 1 : 0 });
      // by night the ball rests as high up its column as the words let it, under the bar, and is let down from there
      if (night) { const br = S.ballR(S.tR), top0 = top + br * 1.2, clear = y => !rects.some(([x0, y0, x1, y1]) => Math.hypot(Math.max(x0 - bx, 0, bx - x1), Math.max(y0 - y, 0, y - y1)) < br + gap); let y = by; while (y - 4 > top0 && clear(y - 4)) y -= 4; S.trest = y; }
      if (!S.placed) { Object.assign(S, { cx: S.tx, cy: S.ty, R: S.tR, rest: S.trest }); S.placed = true; }
    },
    /** the mirror ball's radius, for an open circle of radius R */
    ballR(R) { return clamp(R * .42, S.pr ? 30 : 44, S.pr ? 66 : 100); },
    /** 1 clear of the words, down to nothing behind them: for what crosses the page */
    shade(x, y, r) {
      let d = 1e9;
      if (S.df) { const fx = clamp(x / 8, 0, S.dfW - 1.001), fy = clamp(y / 8, 0, S.dfH - 1.001), i = fx | 0, j = fy | 0, ax = fx - i, ay = fy - j, o = j * S.dfW + i, df = S.df; /* the grid, read smoothly */
        d = (df[o] * (1 - ax) + df[o + 1] * ax) * (1 - ay) + (df[o + S.dfW] * (1 - ax) + df[o + S.dfW + 1] * ax) * ay; }
      else for (const [x0, y0, x1, y1] of S.wr || []) { const e = Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)); if (e < d) d = e; }
      return clamp((d - r * .3) / (r + 6));
    },
    /** where the showpiece is (the stage's `spot`), or nothing while there's no room for it */
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      unit(); g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, S.W, S.H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl; S.rest += (S.trest - S.rest) * gl;
      S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 3));
      if (night) drawNight(T, I, A, F, dt); else drawDay(T, I, A, F);
      unit(); g.globalCompositeOperation = "source-over";
    },
  };
  return S;
}
