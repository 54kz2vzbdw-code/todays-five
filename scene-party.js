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
//
// 1.12 b371: the forever cycle. Pass 0 is the loop above, as it was; each pass after it is dealt its own (dealDay,
// dealNight), and nothing carries: every pass rests on the same picture. By day a pass takes its headline from a bag of
// five: the popper, from either side, in another foil, loaded with stars, hearts or sequins in foil or bright colours; a
// clear balloon full of confetti that comes up, trembles and pops, the confetti bursting out of it every way at once; a
// balloon whose knot gives, so it zips round the bouquet in tightening loops, emptying, and drops limp off the foot; foil
// balloons — a star, a heart, a round, in gold, silver, rose or pink — that come up to join the bouquet, turn on their
// ribbons catching the light, and float away at the close; or party horns poked in from the edge that toot in turn,
// jostling the balloons, then all together. Around it the pass deals the gust's side, the guest's colour and whether it
// pops or slips its string and floats off, and whether three of the top balloons slip free at the close or one or two.
// About one pass in eight a gift box comes up instead: its lid hops twice and flies off in a fountain of confetti, and
// balloons float up out of it. By night each pass turns the spots over, in a wave across the room, into its own shape —
// round, hearts, stars or sparkles — and its second light's colour (gold, violet, aqua, silver or coral, in the beams and
// the tiles too), gives the beams their own dance (sweeping, leaning together, scissoring, passing over the ball in
// turn), and takes a headline from a bag: the ball spun up in glitter; lasers fanned through the haze and closed onto the
// ball, which throws them round the room as sharp points; a confetti cannon of foil streamers; a balloon drop; or the pin
// spot, the room's lights down and one white light on the ball. About one pass in eight a second, smaller ball is let
// down beside the first, or the spots gather into a heart round the ball, beat twice, and fly apart.
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
  const hex = c => "#" + c.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
  /** canvas shadows are in device pixels whatever the transform: scaled here so they read the same on every screen */
  const soft = (x, blur, dx, dy, col) => { x.shadowColor = col; x.shadowBlur = blur * px; x.shadowOffsetX = dx * px; x.shadowOffsetY = dy * px; };
  const unsoft = x => { x.shadowColor = "transparent"; x.shadowBlur = 0; x.shadowOffsetX = 0; x.shadowOffsetY = 0; };
  // the loop's beats, in seconds (the forever cycle can deal them differently)
  const B = night
    ? { lower: [1.0, 2.9], beams: [2.3, 3.1], sweep: 3.0, aim: [5.5, 6.4, 9.2, 10.3], spin: [5.8, 7.2, 8.9, 10.6], glitter: [6.2, 9.0], dim: [10.9, 12.0], raise: [12.2, 14.6] }
    : { gust: [.5, 2.7], guest: [1.0, 3.5], popper: [3.4, 4.5], pop: 4.75, sink: [5.9, 7.1], tremble: [9.0, 9.55], burst: 9.55, free: 10.3, back: [12.0, 14.95] };
  const NEVER = 99; // a beat a pass doesn't play is put off past its end
  /** about one pass in eight turns up something rare, never two running: worked out from the pass alone */
  const rolls = (P, salt) => P > 0 && K.deal(P, salt)() < .125;
  const rareAt = (P, salt) => rolls(P, salt) && !rolls(P - 1, salt);
  let plan = null; // the pass being played, dealt once when it comes up (dealDay / dealNight, below)

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
  /** a clear balloon `w` wide with confetti in it (a dealt pass's): the latex all but invisible but for a milky rim where
   *  it's seen edge-on, the confetti heaped low in it and stuck up its sides, seen through the film, the room's light
   *  caught low on the far side, the same shine and window as the others; its anchor where theirs is */
  const clearBalloon = (w, r) => {
    const h = w * 1.18, k = w * .075, pad = w * .24, W2 = w + pad * 2, H2 = h + k * 1.6 + pad * 2;
    const s = make(W2, H2, x => {
      x.translate(pad + w / 2, pad + h);
      const body = () => { x.beginPath(); x.moveTo(-w * .045, 0); x.bezierCurveTo(-w * .2, -h * .05, -w * .5, -h * .3, -w * .5, -h * .6); x.bezierCurveTo(-w * .5, -h * .87, -w * .28, -h, 0, -h); x.bezierCurveTo(w * .28, -h, w * .5, -h * .87, w * .5, -h * .6); x.bezierCurveTo(w * .5, -h * .3, w * .2, -h * .05, w * .045, 0); x.closePath(); };
      soft(x, w * .13, w * .06, w * .09, "rgba(150,40,100,.1)"); body(); x.fillStyle = "rgba(255,246,251,.3)"; x.fill(); unsoft(x);
      x.save(); body(); x.clip();
      for (let i = 0; i < 86; i++) { // the confetti: most of it settled low, the rest stuck up the sides
        const heap = i < 50, px0 = (r() - .5) * w * (heap ? .74 : .96), py0 = heap ? -h * (.1 + .3 * Math.pow(r(), 1.4)) : -h * (.16 + r() * .76), sz = w * (.036 + r() * .03), a = r() * TAU, f = .25 + r() * .75;
        x.save(); x.translate(px0, py0); x.rotate(a); x.globalAlpha = heap ? .92 : .72; x.fillStyle = CONF[i % 6]; if (r() < .3) x.fillRect(-sz * .2 * f, -sz * .8, sz * .4 * f, sz * 1.6); else x.fillRect(-sz / 2 * f, -sz / 2, sz * f, sz); x.restore(); }
      x.globalAlpha = 1;
      body(); x.strokeStyle = "rgba(255,255,255,.2)"; for (const lw of [.2, .12, .06, .025]) { x.lineWidth = w * lw; x.stroke(); } /* the film, milky where it's seen edge-on */
      body(); x.strokeStyle = "rgba(214,120,170,.35)"; x.lineWidth = w * .012; x.stroke();
      x.lineWidth = w * .028; x.strokeStyle = "rgba(255,190,225,.5)"; x.beginPath(); x.arc(-w * .02, -h * .56, w * .47, .3, 1.15); x.stroke(); /* the room's light, caught low on the far side */
      x.restore();
      x.save(); x.translate(-w * .2, -h * .71); x.rotate(-.5); x.scale(1, 1.75);
      const gr = x.createRadialGradient(0, 0, 0, 0, 0, w * .19); gr.addColorStop(0, "rgba(255,255,255,.8)"); gr.addColorStop(.55, "rgba(255,255,255,.3)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, w * .19, 0, TAU); x.fill(); x.restore();
      x.save(); x.translate(-w * .235, -h * .75); x.rotate(-.5); x.fillStyle = "rgba(255,255,255,.97)"; x.beginPath(); x.ellipse(0, 0, w * .042, w * .095, 0, 0, TAU); x.fill(); x.restore();
      x.strokeStyle = "rgba(255,255,255,.55)"; x.lineWidth = w * .022; x.lineCap = "round"; x.beginPath(); x.arc(-w * .03, -h * .57, w * .41, -.42, .5); x.stroke();
      x.fillStyle = "rgba(236,214,228,.9)"; x.beginPath(); x.moveTo(-w * .05, -k * .1); x.lineTo(w * .05, -k * .1); x.lineTo(k * .85, k * 1.15); x.quadraticCurveTo(0, k * 1.55, -k * .85, k * 1.15); x.closePath(); x.fill();
    });
    s.ax = (pad + w / 2) / W2; s.ay = (pad + h + k * 1.3) / H2; s.bh = h; s.bw = w; s.lift = h * .5 + k * 1.3;
    return s;
  };
  // a foil's colours (a dealt pass's): its body, its light, its shadow, its seam — gold, silver, rose, pink
  const FOIL = [["#E8B84A", "#FFF3C2", "#8E5F10", "#F7D985"], ["#C4C9D6", "#FFFFFF", "#6F7487", "#EEF1F7"], ["#EBA0A4", "#FFE8E6", "#9A4E56", "#F8CACB"], ["#FF5CAB", "#FFD6EC", "#9C1259", "#FF9FCF"]];
  /** a foil balloon `w` across: a star (0), a heart (1) or a round (2), two sheets sealed at the edge and puffed, so it
   *  darkens toward the seam and catches the room in bright streaks; its crimped seam; its tab at the foot, where the
   *  ribbon is tied and the sprite's anchor is */
  const foilSpr = (kind, tone, w) => {
    const [base, lite, dark, seam] = FOIL[tone], h = kind === 2 ? w : w * .96, pad = w * .22, tab = w * .07, W2 = w + pad * 2, H2 = h + tab * 2 + pad * 2;
    const foot = kind === 0 ? w * .52 * .47 + h * .04 : h * .5; // the lowest middle of it, where the tab hangs
    const s = make(W2, H2, x => {
      x.translate(pad + w / 2, pad + h / 2);
      const shape = () => { x.beginPath();
        if (kind === 0) { const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? .47 : 1) * w * .52; pts.push([Math.cos(a) * rr, Math.sin(a) * rr + h * .04]); }
          x.moveTo((pts[9][0] + pts[0][0]) / 2, (pts[9][1] + pts[0][1]) / 2); for (let i = 0; i < 10; i++) { const p = pts[i], q = pts[(i + 1) % 10]; x.arcTo(p[0], p[1], q[0], q[1], i % 2 ? w * .04 : w * .075); } x.closePath(); }
        else if (kind === 1) { x.moveTo(0, h * .5); x.bezierCurveTo(-w * .1, h * .37, -w * .5, h * .12, -w * .5, -h * .15); x.bezierCurveTo(-w * .5, -h * .44, -w * .2, -h * .56, 0, -h * .3); x.bezierCurveTo(w * .2, -h * .56, w * .5, -h * .44, w * .5, -h * .15); x.bezierCurveTo(w * .5, h * .12, w * .1, h * .37, 0, h * .5); x.closePath(); }
        else x.arc(0, 0, w / 2, 0, TAU); };
      soft(x, w * .12, w * .05, w * .08, "rgba(150,40,100,.22)"); shape(); x.fillStyle = base; x.fill(); unsoft(x);
      x.save(); shape(); x.clip();
      let gr = x.createRadialGradient(-w * .2, -h * .24, w * .02, -w * .04, -h * .04, w * .7); gr.addColorStop(0, lite); gr.addColorStop(.32, base); gr.addColorStop(.78, dark); gr.addColorStop(1, dark);
      shape(); x.fillStyle = gr; x.fill();
      shape(); x.strokeStyle = css(rgb(dark), .18); for (const lw of [.28, .17, .09]) { x.lineWidth = w * lw; x.stroke(); } /* puffed: deeper toward the seam */
      gr = x.createRadialGradient(-w * .2, -h * .22, 0, -w * .2, -h * .22, w * .34); gr.addColorStop(0, "rgba(255,255,255,.85)"); gr.addColorStop(.5, "rgba(255,255,255,.3)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(-w, -h, w * 2, h * 2); /* the room caught in it: a bright bloom up on the left, */
      x.save(); x.scale(1, h / w); x.strokeStyle = "rgba(255,255,255,.95)"; x.lineCap = "round"; x.lineWidth = w * .035; x.beginPath(); x.arc(0, 0, w * .36, Math.PI * 1.08, Math.PI * 1.42); x.stroke(); x.lineWidth = w * .018; x.beginPath(); x.arc(0, 0, w * .36, Math.PI * 1.5, Math.PI * 1.56); x.stroke(); x.restore(); /* a crisp streak inside the rim there, */
      x.save(); x.rotate(-.5); gr = x.createLinearGradient(0, h * .02, 0, h * .3); gr.addColorStop(0, css(rgb(dark), 0)); gr.addColorStop(.5, css(rgb(dark), .28)); gr.addColorStop(1, css(rgb(dark), 0)); x.fillStyle = gr; x.fillRect(-w, h * .02, w * 2, h * .28); x.restore(); /* the darker room across its middle, */
      gr = x.createRadialGradient(w * .22, h * .26, 0, w * .22, h * .26, w * .22); gr.addColorStop(0, "rgba(255,240,248,.45)"); gr.addColorStop(1, "rgba(255,240,248,0)"); x.fillStyle = gr; x.fillRect(-w, -h, w * 2, h * 2); /* and the pink wall low on the right */
      x.restore();
      shape(); x.lineWidth = w * .03; x.strokeStyle = seam; x.globalAlpha = .75; x.stroke(); /* the seam, crimped all round */
      x.setLineDash([w * .014, w * .02]); x.lineWidth = w * .05; x.strokeStyle = css(rgb(dark), .32); x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
      x.fillStyle = dark; x.fillRect(-w * .035, foot - w * .01, w * .07, tab * 1.5); x.fillStyle = seam; x.fillRect(-w * .035, foot - w * .01, w * .02, tab * 1.5);
    });
    s.ax = .5; s.ay = (pad + h / 2 + foot + tab * 1.4) / H2; s.bh = h; s.bw = w; s.lift = foot + tab * 1.4; s.hy = -h * .2 - foot - tab * 1.4; // hy: its shine, from the anchor
    return s;
  };
  /** a balloon gone empty: a crumpled sleeve of rubber and its knot */
  const limpSpr = (hex, w) => { const c = rgb(hex), s = make(w * .6, w * .8, x => {
    x.translate(w * .3, w * .06); x.fillStyle = hex; x.beginPath(); x.moveTo(-w * .04, w * .64); x.quadraticCurveTo(-w * .24, w * .42, -w * .15, w * .2); x.quadraticCurveTo(-w * .24, w * .04, -w * .02, 0); x.quadraticCurveTo(w * .22, w * .02, w * .16, w * .22); x.quadraticCurveTo(w * .25, w * .44, w * .04, w * .64); x.closePath(); x.fill();
    x.strokeStyle = css(deep(c, .62), .55); x.lineWidth = w * .02; x.lineCap = "round"; for (const [a, b2, d] of [[-.1, .16, .05], [.02, .3, -.06], [-.08, .44, .04]]) { x.beginPath(); x.moveTo(w * a, w * b2); x.quadraticCurveTo(w * (a + .08), w * (b2 + d), w * (a + .16), w * b2); x.stroke(); }
    x.fillStyle = "rgba(255,255,255,.4)"; x.beginPath(); x.ellipse(-w * .07, w * .16, w * .025, w * .07, .3, 0, TAU); x.fill();
    x.fillStyle = css(deep(c, .7)); x.beginPath(); x.ellipse(0, w * .66, w * .05, w * .04, 0, 0, TAU); x.fill(); }); s.ax = .5; s.ay = .5; return s; };
  // the rare gift box's wrappings: its paper, its ribbon, the dots on the paper
  const GIFT = [["#FF6FB5", "#F6C84C", "#FFE3F0"], ["#4FC3A1", "#FF6FB5", "#E3FFF6"], ["#A98BE6", "#F6C84C", "#F1EAFF"]];
  /** a gift box `w` wide, wrapped: the box (its anchor the middle of its top) and its lid with the bow (its anchor the
   *  middle of the lid's foot), apart so the lid can fly */
  const giftSprs = (cw, w) => {
    const [paper, rib, dot] = GIFT[cw], h = w * .72, lh = h * .26, ov = w * .05, bow = w * .44, p = rgb(paper);
    const box = make(w + 16, h + 16, x => { x.translate(8, 8);
      soft(x, 7, 2, 5, "rgba(120,30,80,.26)"); x.fillStyle = paper; x.fillRect(0, 0, w, h); unsoft(x);
      x.save(); x.beginPath(); x.rect(0, 0, w, h); x.clip(); x.fillStyle = css(rgb(dot), .6); for (let yy = w * .09, row = 0; yy < h; yy += w * .13, row++) for (let xx = row % 2 ? w * .06 : w * .125; xx < w; xx += w * .13) { x.beginPath(); x.arc(xx, yy, w * .022, 0, TAU); x.fill(); }
      let gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(255,255,255,.22)"); gr.addColorStop(.35, "rgba(255,255,255,0)"); gr.addColorStop(1, css(deep(p, .5), .22)); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, css(deep(p, .45), .28)); gr.addColorStop(.12, "rgba(0,0,0,0)"); gr.addColorStop(1, css(deep(p, .6), .16)); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.restore();
      x.fillStyle = rib; x.fillRect(w * .42, 0, w * .16, h); x.fillStyle = "rgba(255,255,255,.32)"; x.fillRect(w * .44, 0, w * .035, h); x.fillStyle = "rgba(120,60,20,.14)"; x.fillRect(w * .54, 0, w * .04, h); });
    box.ax = .5; box.ay = 8 / (h + 16);
    const lid = make(w + ov * 2 + 16, lh + bow + 16, x => { x.translate(8 + ov, 8 + bow);
      soft(x, 5, 1, 3, "rgba(120,30,80,.24)"); x.fillStyle = css(tint(p, .08)); x.fillRect(-ov, 0, w + ov * 2, lh); unsoft(x);
      const gr = x.createLinearGradient(0, 0, 0, lh); gr.addColorStop(0, "rgba(255,255,255,.3)"); gr.addColorStop(.3, "rgba(255,255,255,0)"); gr.addColorStop(1, css(deep(p, .5), .25)); x.fillStyle = gr; x.fillRect(-ov, 0, w + ov * 2, lh);
      x.fillStyle = rib; x.fillRect(w * .42, 0, w * .16, lh); x.fillStyle = "rgba(255,255,255,.3)"; x.fillRect(w * .44, 0, w * .035, lh);
      const rc = rgb(rib), dk = css(deep(rc, .72)); /* the bow: two loops, two tails, a knot */
      x.fillStyle = rib; x.strokeStyle = dk; x.lineWidth = w * .012;
      for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(w * .5, -w * .02); x.quadraticCurveTo(w * (.5 + sd * .12), bow * .05, w * (.5 + sd * .2), bow * .12 - w * .02); x.lineTo(w * (.5 + sd * .16), -w * .01); x.closePath(); x.fill(); x.stroke();
        x.beginPath(); x.moveTo(w * .5, -w * .04); x.bezierCurveTo(w * (.5 + sd * .08), -bow * 1.05, w * (.5 + sd * .32), -bow * .9, w * (.5 + sd * .06), -w * .05); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = css(deep(rc, .8), .5); x.beginPath(); x.ellipse(w * (.5 + sd * .1), -bow * .55, w * .025, bow * .2, sd * .5, 0, TAU); x.fill(); x.fillStyle = rib; }
      x.fillStyle = css(tint(rc, .2)); x.beginPath(); x.ellipse(w * .5, -w * .04, w * .06, w * .05, 0, 0, TAU); x.fill(); x.stroke(); });
    lid.ax = (8 + ov + w / 2) / (w + ov * 2 + 16); lid.ay = (8 + bow + lh) / (lh + bow + 16); lid.lh = lh;
    return { box, lid, w, h };
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
  const popperSpr = (w, l, body = "#F2B33A", stripe = "#D62E86", band = "#FFE3A0") => { const s = make(w * 1.5, l + w * .5, x => {
    x.translate(w * .75, w * .2);
    const cone = () => { x.beginPath(); x.moveTo(-w / 2, 0); x.lineTo(w / 2, 0); x.lineTo(w * .08, l); x.quadraticCurveTo(0, l * 1.02, -w * .08, l); x.closePath(); };
    soft(x, 4, 1, 2, "rgba(120,30,80,.25)"); cone(); x.fillStyle = body; x.fill(); unsoft(x);
    x.save(); cone(); x.clip();
    x.fillStyle = stripe; for (let k = -2; k < 9; k++) { const y0 = k * l * .15; x.beginPath(); x.moveTo(-w, y0 + w * .45); x.lineTo(w, y0 - w * .45); x.lineTo(w, y0 - w * .45 + l * .065); x.lineTo(-w, y0 + w * .45 + l * .065); x.closePath(); x.fill(); }
    const gr = x.createLinearGradient(-w / 2, 0, w / 2, 0); gr.addColorStop(0, "rgba(80,10,40,.4)"); gr.addColorStop(.28, "rgba(255,255,255,.45)"); gr.addColorStop(.42, "rgba(255,255,255,0)"); gr.addColorStop(.8, "rgba(80,10,40,.12)"); gr.addColorStop(1, "rgba(80,10,40,.45)"); x.fillStyle = gr; x.fillRect(-w, 0, w * 2, l);
    x.restore();
    x.fillStyle = band; x.fillRect(-w / 2, 0, w, w * .12); x.fillStyle = "rgba(160,90,10,.4)"; x.fillRect(-w / 2, w * .1, w, w * .03); /* the foil band at the mouth */
  }); s.ax = .5; s.ay = (w * .2) / (l + w * .5); s.cap = stripe; return s; };
  /** a scrap of burst rubber, curled */
  const scrapSpr = (hex, seed, sz) => { const rr = rng(seed), c = rgb(hex); return make(sz * 1.4, sz, x => {
    x.fillStyle = hex; x.beginPath(); x.moveTo(0, sz * (.3 + rr() * .2)); x.quadraticCurveTo(sz * .35, -sz * .1, sz * (.6 + rr() * .2), sz * .2); x.quadraticCurveTo(sz * 1.2, sz * .15, sz * 1.35, sz * (.45 + rr() * .2)); x.quadraticCurveTo(sz * .9, sz * .8, sz * (.35 + rr() * .2), sz * .95); x.quadraticCurveTo(sz * .15, sz * .6, 0, sz * .35); x.fill();
    x.fillStyle = css(deep(c, .65), .55); x.beginPath(); x.ellipse(sz * .7, sz * .55, sz * .35, sz * .12, .3, 0, TAU); x.fill(); }); };

  /** the streamers of a burst `pa` seconds old from (ox, oy), thrown toward dir0 to carry about `reach`: each a paper
   *  ribbon laid along its head's flight, every point of it falling from the moment it was laid, so it unfurls, then
   *  drapes and falls away, curling across its path; it twists as it goes, bright on its face (fc) and dull on its back
   *  (bk). Its edges are shared point to point, so it bends smoothly */
  const streamers = (pa, ox, oy, dir0, reach, V, late, fc, bk) => {
    const { H, pr, sc0 } = S, n = 40, q = S.sq, rw = (pr ? 3.8 : 5.6) * sc0;
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
        if (any) { g.fillStyle = face ? bk[st.c] : fc[st.c]; g.globalAlpha = V * late * (lv ? .22 : 1); g.fill(); }
      }
    }
  };
  // a confetti shape's outline, round from its middle in a unit square: a five-pointed star, a heart
  const STAR = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? .44 : 1.08; return [Math.cos(a) * rr, Math.sin(a) * rr + .1]; });
  const HEART = Array.from({ length: 16 }, (_, i) => { const t = i / 16 * TAU, x = Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16; return [x * 1.08, y * 1.08 - .1]; });
  /** confetti thrown from (ox, oy) `pa` seconds ago toward dir0 (`spread` 1: a popper's cone; wider, a balloon's burst
   *  every way at once, each piece starting up to `from` out, inside it), slowed by the air, then falling at its own
   *  steady pace, fluttering side to side, spinning, and tumbling over so it shows its dull back side and its bright
   *  face in turn. Squares and strips (`shape` 0, the signature's), or a dealt pass's stars (1), hearts (2) or sequins (3) */
  const confetti = (pa, ox, oy, dir0, reach, V, late, fc, bk, shape, spread, from) => {
    const { H } = S, cq = S.cq; let nc = 0;
    for (const p of S.conf) {
      const dir = dir0 + p.a * spread, v0 = p.v * reach * p.k, x0 = from ? ox + Math.cos(dir) * from * (p.v - .3) : ox, y0 = from ? oy + Math.sin(dir) * from * (p.v - .3) : oy;
      const x = x0 + fly(Math.cos(dir) * v0, p.k, 0, pa) + p.fl * (1 - Math.exp(-p.k * pa)) * Math.sin(pa * p.fw + p.ph), y = y0 + fly(Math.sin(dir) * v0, p.k, p.vt * H, pa);
      if (y > H + 16) continue;
      const flip = Math.cos(p.f0 + p.flip * pa), spin = p.ph + p.spin * pa, o = nc * 10;
      if (shape) { const r = p.s * (shape === 3 ? .42 : .62); cq[o] = x; cq[o + 1] = y; cq[o + 2] = r * Math.max(.12, Math.abs(flip)); cq[o + 3] = r; cq[o + 4] = Math.cos(spin); cq[o + 5] = Math.sin(spin); cq[o + 6] = spin; }
      else { const hw = (p.strip ? p.s * .42 : p.s) / 2 * Math.max(.12, Math.abs(flip)), hh = (p.strip ? p.s * 1.5 : p.s) / 2, c = Math.cos(spin), s = Math.sin(spin);
        cq[o] = x - c * hw + s * hh; cq[o + 1] = y - s * hw - c * hh; cq[o + 2] = x + c * hw + s * hh; cq[o + 3] = y + s * hw - c * hh; cq[o + 4] = x + c * hw - s * hh; cq[o + 5] = y + s * hw + c * hh; cq[o + 6] = x - c * hw - s * hh; cq[o + 7] = y - s * hw + c * hh; }
      cq[o + 8] = p.c * 2 + (flip >= 0 ? 0 : 1); cq[o + 9] = S.shade(x, y, p.s) < .5 ? 1 : 0; nc++;
    }
    const tpl = shape === 1 ? STAR : HEART;
    for (let grp = 0; grp < 12; grp++) for (let lv = 0; lv < 2; lv++) {
      let any = false; g.beginPath();
      for (let i = 0; i < nc; i++) { const o = i * 10; if (cq[o + 8] !== grp || cq[o + 9] !== lv) continue; any = true;
        if (!shape) { g.moveTo(cq[o], cq[o + 1]); g.lineTo(cq[o + 2], cq[o + 3]); g.lineTo(cq[o + 4], cq[o + 5]); g.lineTo(cq[o + 6], cq[o + 7]); g.closePath(); continue; }
        const x = cq[o], y = cq[o + 1], hw = cq[o + 2], hh = cq[o + 3], c = cq[o + 4], s = cq[o + 5];
        if (shape === 3) { g.moveTo(x + c * hw, y + s * hw); g.ellipse(x, y, hw, hh, cq[o + 6], 0, TAU); continue; }
        for (let k = 0; k < tpl.length; k++) { const [tx, ty] = tpl[k], vx = x + c * hw * tx - s * hh * ty, vy = y + s * hw * tx + c * hh * ty; k ? g.lineTo(vx, vy) : g.moveTo(vx, vy); }
        g.closePath(); }
      if (!any) continue; g.fillStyle = grp & 1 ? bk[grp >> 1] : fc[grp >> 1]; g.globalAlpha = V * late * (lv ? .22 : 1); g.fill();
    }
  };

  /** the popper at the foot of the page: up from below, turning to its aim, a shiver, the pop (`pa` seconds ago, from
   *  (ox, oy) toward dir0), a kick, its paper cap blown off, a puff of paper dust, and back down (the beats in `b`) */
  const popperUp = (T, V, b, popX, mouthY, aimRot, pa, ox, oy, dir0, pop) => {
    const { H, sc0 } = S;
    const up = seg(T, b.popper[0], b.popper[1], E.back) * (1 - seg(T, b.sink[0], b.sink[1], E.in)), rot = aimRot * seg(T, b.popper[0] + .2, b.popper[1] + .1, E.io) + env(T, b.pop - .6, b.pop - .45, b.pop - .12, b.pop) * Math.sin(T * 38) * .06;
    const kick = pa > 0 ? 9 * sc0 * Math.exp(-pa * 6) * Math.cos(pa * 22) : 0, ax = Math.sin(rot), ay = -Math.cos(rot);
    const mx = popX - ax * kick, my = lerp(H + S.pl + 30, mouthY, up) - ay * kick;
    unit(); g.globalAlpha = V; g.strokeStyle = "rgba(122,58,99,.7)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(mx - ax * S.pl, my - ay * S.pl); g.lineTo(mx - ax * S.pl + (pa > 0 ? 6 : 2) * sc0, H + 20); g.stroke(); /* its string, pulled from below */
    put(pop, mx, my, pop.ax, pop.ay, rot, 1, 1, V);
    unit(); const ca = pa > 0 ? pa : 0, cxp = mx + fly(ax * 700, 2.5, 0, ca), cyp = my + fly(ay * 700, 2.5, 900, ca); /* the paper cap, blown off */
    if (cyp < H + 10) { g.globalAlpha = V; g.save(); g.translate(cxp, cyp); g.rotate(rot + ca * 9); g.fillStyle = "#FFF6FA"; g.beginPath(); g.ellipse(0, 0, S.pw / 2, S.pw * .14, 0, 0, TAU); g.fill(); g.strokeStyle = pop.cap; g.lineWidth = 1.4; g.stroke(); g.restore(); }
    if (pa > 0 && pa < .35) { const q = pa / .35; g.globalAlpha = V * (1 - q) * .45; g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(ox + Math.cos(dir0) * q * 30 * sc0, oy + Math.sin(dir0) * q * 30 * sc0, S.pw * (.5 + q * 1.4), 0, TAU); g.fill(); } /* a puff of paper dust */
    g.globalAlpha = 1;
  };
  /* ---------------- by day: what the dealt passes bring ---------------- */
  /** a balloon let go untied: the path it zips along, worked out once for the pass — in the open circle's radii from its
   *  middle, `x` toward the side the guest hangs on (that side is only known when it's drawn), from where the guest hangs,
   *  turning in loops that tighten as it empties and swing back whenever it strays from the bouquet; x, y and its heading,
   *  sixty to the second */
  const zipPath = (r, zt) => {
    const n = Math.ceil(zt * 60), q = new Float32Array((n + 1) * 3), dir = r() < .5 ? 1 : -1, a1 = 4.2 + r() * 1.8, a2 = 1.4 + r() * 1.4, f1 = 1.8 + r() * 1.4, f2 = 4.4 + r() * 2.2, p1 = r() * TAU, p2 = r() * TAU;
    let x = .92, y = -.3, hd = -.35 + (r() - .5) * .4;
    for (let i = 0; i <= n; i++) { const t = i / 60, sp = 2.5 * Math.pow(Math.max(0, 1 - t / zt), .5) + .3, tx = -x, ty = -.2 - y, far = Math.hypot(tx, ty);
      q[i * 3] = x; q[i * 3 + 1] = y; q[i * 3 + 2] = hd;
      let turn = dir * a1 * (.65 + .35 * Math.sin(f1 * t + p1)) + a2 * Math.sin(f2 * t + p2);
      if (far > .55) { let d = Math.atan2(tx, -ty) - hd; d = Math.atan2(Math.sin(d), Math.cos(d)); turn += d * 10 * Math.min(1, (far - .55) * 3); } /* strayed: back toward the bouquet */
      hd += turn / 60; x += Math.sin(hd) * sp / 60; y -= Math.cos(hd) * sp / 60; }
    return q;
  };
  /** the balloon let go (from its knot at kx0, ky0): it zips off along its path, its top leading and its neck flapping,
   *  shrinking as it empties, a faint trail of its last loops behind it; its string drops away; then, empty, it falls
   *  fluttering off the foot of the page */
  const zipAt = (pl, T, V, kx0, ky0, spr, sc, side) => {
    const { W, H, R, pr, sc0 } = S, z = pl.zip, n = z.length / 3 - 1, t = T - pl.b.leave, zt = pl.zt, cx0 = kx0, cy0 = ky0 - spr.lift * sc, at = m => [clamp(cx0 + side * (z[m * 3] - .92) * R, 30, W - 30), cy0 + (z[m * 3 + 1] + .3) * R];
    const sy = ky0 + fly(0, .8, 1500, t); /* the string, let go where it was tied */
    if (sy < H + 20) { unit(); g.globalAlpha = V; g.strokeStyle = S.rib[pl.gc]; g.lineWidth = pr ? 1 : 1.25; g.beginPath(); g.moveTo(kx0, sy); for (let j = 1; j <= 20; j++) { const d = j * H / 20; g.lineTo(kx0 + Math.sin(j * .9 + t * 6) * Math.min(1, t * 3) * 9 * sc0, sy + d * (1 - Math.min(.4, t * .5))); } g.stroke(); }
    const fade = t < zt ? 1 : 0, lim = clamp((t - zt + .2) / .3);
    if (t < zt) {
      const f = Math.min(n, t * 60), i = Math.floor(f), u = f - i, j = Math.min(n, i + 1), [x0, y0] = at(i), [x1, y1] = at(j), x = lerp(x0, x1, u), y = lerp(y0, y1, u), k = t / zt;
      const s = sc * (1 - .62 * Math.pow(k, .75)), rot = side * lerp(z[i * 3 + 2], z[j * 3 + 2], u) + Math.sin(t * 38) * .12 * (1 - k * .4), l = spr.lift * s;
      unit(); g.strokeStyle = S.rib[pl.gc]; g.lineCap = "round"; /* its trail, strongest close behind it */
      for (const [from, to, lw, al] of [[i, i - 24, 2 * sc0, .16], [i, i - 7, 3.2 * sc0, .22]]) { g.globalAlpha = V * al; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); for (let m = from; m >= Math.max(0, to); m--) { const [xx, yy] = at(m); g.lineTo(xx, yy); } g.stroke(); }
      const nx = x - Math.sin(rot) * l * 1.9, ny = y + Math.cos(rot) * l * 1.9; g.strokeStyle = "#FFFFFF"; g.lineWidth = 1.6 * sc0; g.globalAlpha = V * .6 * (1 - k * .5); g.beginPath(); /* the air rushing out of its neck */
      for (let m = -1; m <= 1; m++) { const a = rot + m * .32 + Math.sin(t * 7 + m) * .1, len = (11 + 5 * Math.sin(t * 5.5 + m * 2)) * sc0; g.moveTo(nx - Math.sin(a) * 3, ny + Math.cos(a) * 3); g.lineTo(nx - Math.sin(a) * len, ny + Math.cos(a) * len); } g.stroke(); g.lineCap = "butt";
      put(spr, x - Math.sin(rot) * l, y + Math.cos(rot) * l, spr.ax, spr.ay, rot, s * (1 - .1 * k), s, V * fade * (1 - lim) * (.1 + .9 * S.shade(x, y, spr.bw * s * .8)));
      if (lim <= 0) return;
    }
    const [ex, ey] = at(n), tl = Math.max(0, t - zt + .2), y = ey + fly(-60, 1.6, 420, tl), x = ex + Math.sin(tl * 3.2) * 18 * sc0 + side * tl * 20 * sc0; /* gone empty: down it goes */
    if (y < H + 50) put(S.limp[pl.guest], x, y, .5, .5, Math.sin(tl * 2.4) * .9 + side * .4, sc * 1.1, sc * 1.1, V * lim * (.1 + .9 * S.shade(x, y, 20)));
  };
  /** a party horn: its paper tube `L` long and `w` wide from its mouthpiece at (x, y), along `ang` from straight up,
   *  unrolled `u` of the way and the rest coiled at its tip, tighter toward the end, curling to `curl` (±1); striped in
   *  two colours that stay put on the paper as it unrolls */
  const HQ = new Float32Array(2 * 64);
  const horn = (x, y, ang, L, w, u, curl, cA, cB, a) => {
    if (a <= .004) return;
    const n = 46, straight = L * u, coil = L - straight; let hd = ang, m = 2;
    HQ[0] = x; HQ[1] = y; HQ[2] = x + Math.sin(ang) * straight; HQ[3] = y - Math.cos(ang) * straight;
    if (coil > .5) { let px0 = HQ[2], py0 = HQ[3]; const r0 = Math.max(coil * .15, w * .95), ds = coil / n;
      for (let i = 0; i < n; i++) { const f = (i + .5) / n; hd += curl * ds / (r0 * (1 - .8 * f)); px0 += Math.sin(hd) * ds; py0 -= Math.cos(hd) * ds; HQ[m * 2] = px0; HQ[m * 2 + 1] = py0; m++; } }
    unit(); g.globalAlpha = a; g.lineJoin = "round"; g.beginPath(); g.moveTo(HQ[0], HQ[1]); for (let i = 1; i < m; i++) g.lineTo(HQ[i * 2], HQ[i * 2 + 1]);
    g.strokeStyle = "rgba(120,40,80,.3)"; g.lineWidth = w + 2.2; g.stroke(); /* its edge */
    g.strokeStyle = cA; g.lineWidth = w; g.stroke();
    g.setLineDash([w * .75, w * .85]); g.strokeStyle = cB; g.stroke(); g.setLineDash([]);
    g.strokeStyle = "rgba(255,255,255,.34)"; g.lineWidth = w * .26; g.stroke(); /* the shine along it */
    g.lineJoin = "miter"; g.globalAlpha = 1;
  };
  /** a toot's shape: how far a horn is unrolled at time t, from keyframes [time, unrolled] */
  const keyed = (t, ks) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t < ks[i][0]) { const [t0, u0] = ks[i - 1], [t1, u1] = ks[i]; return lerp(u0, u1, (u1 > u0 ? E.out : E.io)(clamp((t - t0) / (t1 - t0)))); } return ks[ks.length - 1][1]; };
  /** where a horn is: its mouthpiece past the page's edge at the bouquet's height, pointing in at it (the side nearer
   *  the bouquet, or on a phone the side the plan gives); how long and wide it is */
  const hornAt = h => { const { W, pr, cx, cy, R, sc0 } = S, sd = pr ? h.sd : (cx > W / 2 ? 1 : -1), L = clamp(R * (pr ? .95 : .9), pr ? 110 : 150, pr ? 170 : 240), y = cy + h.dy * R;
    return { sd, L, w: (pr ? 9 : 13) * sc0, x: sd > 0 ? W + 4 : -4, y, ang: sd > 0 ? -Math.PI / 2 + h.tilt : Math.PI / 2 - h.tilt }; };
  /** a horn's toots: two in turn, then all of them together, and it curls up again (keyframes, from its own start) */
  const tootsOf = (hn, h) => { const c = hn.chord - h.d; return [[0, 0], [.17, 1], [.48, 1], [.68, .3], [.8, 1], [1.12, 1], [1.5, .06], [c, .06], [c + .2, 1], [c + .75, 1], [c + 1.3, 0]]; };
  /** party horns poked in from the edge of the page beside the bouquet: each toots twice in turn — jostling the balloons
   *  near its tip — then all together, and they curl up and are drawn back out */
  const hornsAt = (hn, T, V) => {
    for (const h of hn.list) {
      const tau = T - hn.t0 - h.d, slide = seg(tau, -.7, -.1, E.out) * (1 - seg(T, hn.end, hn.end + .6, E.in)); if (slide <= 0) continue;
      const P0 = hornAt(h), u = keyed(tau, h.keys), back = (1 - slide) * (P0.L * .35 + 50);
      let room = 1; for (const f of [.25, .55, .9]) room = Math.min(room, S.shade(P0.x - P0.sd * P0.L * f * Math.max(u, .3), P0.y, 26)); /* (faded by the words anywhere along it) */
      horn(P0.x + P0.sd * back, P0.y + Math.sin(T * 2.3 + h.ph) * 3, P0.ang + Math.sin(T * 2.1 + h.ph) * .04 * u, P0.L, P0.w, u, P0.sd > 0 ? -1 : 1, h.cA, h.cB, V * (.12 + .88 * room));
    }
  };
  /** the rare gift box: up from below the foot beside the bouquet; the lid hops twice, then flies off, and out come
   *  balloons, one after another, up and away past the top of the page; the box goes down again */
  const giftAt = (gf, T, V, cx, R, bw) => {
    const { W, H, sc0 } = S, sp = S.gifts[gf.cw], { box, lid, w, h } = sp, x = clamp(cx + gf.side * R * .66, w * .62, W - w * .62);
    const up = seg(T, gf.t0, gf.t0 + .9, E.back) * (1 - seg(T, gf.sink, gf.sink + .8, E.in)), top = lerp(H + lid.lh + w * .5 + 20, H - h * 1.02 - 16 * sc0, up), pt = T - gf.pop;
    if (up <= 0 && pt < 1.5) return;
    unit();
    for (const bl of gf.bl) { const t = pt - bl.d; if (t <= 0) continue; /* the balloons, out of it and away */
      const spr = S.bal[bl.c], sc = bw * bl.z / S.bw, rise = fly(0, 1.5, H * .44, t) + t * 40, kx = x + bl.dx * w * .3 + Math.sin(t * 1.4 + bl.ph) * 14 * sc0 + bl.drift * R * E.out(clamp(t / 3)), ky = top + spr.lift * sc * .4 + 16 - rise;
      if (ky + 90 * sc0 < -10) continue; const a = V * (.1 + .9 * S.shade(kx, ky - spr.lift * sc, spr.bw * sc * .8)), rot = Math.sin(t * 1.9 + bl.ph) * .14;
      g.globalAlpha = a; g.strokeStyle = S.rib[bl.c]; g.lineWidth = 1.1; g.beginPath(); g.moveTo(kx, ky); g.quadraticCurveTo(kx + Math.sin(t * 3 + bl.ph) * 8 * sc0, ky + 40 * sc0, kx - Math.sin(rot) * 20 * sc0, ky + 80 * sc0); g.stroke();
      put(spr, kx, ky, spr.ax, spr.ay, rot, sc, sc, a); unit(); }
    const jig = pt < 0 ? Math.abs(Math.sin((pt + .95) * Math.PI * 2.4)) * env(pt, -.95, -.85, -.25, -.08) * 8 * sc0 : 0, sq = pt < 0 ? jig * .004 : 0;
    const room = .12 + .88 * S.shade(x, top + h * .35, w * .75); /* (faded by the words near it, as everything is) */
    put(box, x, top, box.ax, box.ay, 0, 1 + sq, 1 - sq, V * up * room);
    if (pt < 0) put(lid, x, top - jig, lid.ax, lid.ay, Math.sin(pt * 21) * jig * .006, 1, 1, V * up * room);
    else { const lx = x + fly(gf.lv * 260 * sc0, 1.2, 0, pt), ly = top + fly(-760 * sc0, .9, 1400 * sc0, pt); if (ly < H + 140) put(lid, lx, ly, lid.ax, lid.ay, gf.lv * pt * 3.2, 1, 1, V * (.12 + .88 * S.shade(lx, ly, w * .6))); }
    if (pt > 0 && pt < .4) { const q = pt / .4; unit(); g.globalAlpha = V * (1 - q) * .5; g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x, top - 6, w * (.3 + q * .5), 0, TAU); g.fill(); g.globalAlpha = 1; } /* a puff of air from it */
    if (pt > 0) { unit(); confetti(pt, x, top - 4, -Math.PI / 2 - gf.lv * .12, R * .75, V, T > 14.6 ? (15 - T) / .4 : 1, S.faces[gf.pal], S.backs[gf.pal], gf.shape, .8, w * .3); g.globalAlpha = 1; } /* and a fountain of confetti */
  };

  /** a popper's load: its confetti (where each piece goes, how it falls and turns) and its streamers */
  const confOf = (r, pr, sc0) => Array.from({ length: pr ? 96 : 160 }, () => ({ a: (r() - .5) * 1.4, v: .4 + r() * .7, k: 3 + r() * 2.5, vt: .1 + r() * .06, fl: (8 + r() * 20) * sc0, fw: 2 + r() * 2.5, ph: r() * TAU, c: Math.floor(r() * 6), strip: r() < .38, s: (.75 + r() * .55) * (pr ? 8 : 11) * sc0, spin: (r() - .5) * 7, flip: (4 + r() * 8) * (r() < .5 ? -1 : 1), f0: r() * TAU }));
  const strmOf = (r, pr) => { const ns = pr ? 6 : 9; return Array.from({ length: ns }, (_, i) => ({ a: (i / (ns - 1) - .5) * 1.15 + (r() - .5) * .15, v: .7 + r() * .45, c: (i * 5 + 1) % 6, ph: r() * TAU, tw: 6 + r() * 5, cf: .45 + r() * .3, cu: 10 + r() * 9, vt: .11 + r() * .04, dr: (r() - .5) * 30 })); };

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
    S.conf = confOf(r, pr, sc0);
    S.cq = new Float32Array(S.conf.length * 10);
    S.strm = strmOf(r, pr);
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
    layDealt(W, H, rng(733));
  };
  // what the dealt passes bring, made once here from a stream of their own (the signature's draws stay as they were):
  // confetti in foil and in brights, poppers in other foils, the clear balloon full of confetti and its rubber
  const METAL = ["#F2C14E", "#E3E7EF", "#F4A6B8", "#FF6FB5", "#F3D9A6", "#C9B2F0"], BRIGHT = ["#FF3D8B", "#14C0A0", "#FFC21A", "#7A5CFF", "#1FA2FF", "#FF6A3D"];
  const layDealt = (W, H, r) => {
    const { pr, sc0 } = S;
    S.faces = [S.face, METAL.map(c => css(rgb(c))), BRIGHT.map(c => css(rgb(c)))];
    S.backs = [S.back, METAL.map(c => css(deep(rgb(c), .6))), BRIGHT.map(c => css(mixc(deep(rgb(c), .8), [196, 150, 178], .3)))];
    S.poppers = [S.popper, popperSpr(S.pw, S.pl, "#7FC8F0", "#FFFFFF", "#E6F4FF"), popperSpr(S.pw, S.pl, "#A98BE6", "#F6C84C", "#FFF1C0"), popperSpr(S.pw, S.pl, "#4FC3A1", "#FF6FB5", "#FFE3F0")];
    S.poppers[1].cap = "#4A9CC8";
    S.rib[8] = "rgba(168,140,176,.72)"; // the clear balloon's ribbon, and a foil one's
    S.scraps[8] = [0, 1, 2].map(k => { const rr = rng(90 + k), sz = (pr ? 10 : 14) * sc0; return make(sz * 1.4, sz, x => {
      x.fillStyle = "rgba(255,255,255,.62)"; x.strokeStyle = "rgba(200,160,190,.7)"; x.lineWidth = 1; x.beginPath(); x.moveTo(0, sz * (.3 + rr() * .2)); x.quadraticCurveTo(sz * .35, -sz * .1, sz * (.6 + rr() * .2), sz * .2); x.quadraticCurveTo(sz * 1.2, sz * .15, sz * 1.35, sz * (.45 + rr() * .2)); x.quadraticCurveTo(sz * .9, sz * .8, sz * (.35 + rr() * .2), sz * .95); x.quadraticCurveTo(sz * .15, sz * .6, 0, sz * .35); x.fill(); x.stroke(); }); });
    S.clear = clearBalloon(S.bw, r);
    S.foils = [0, 1, 2].map(k => [0, 1, 2, 3].map(t => foilSpr(k, t, S.bw)));
    S.limp = BAL.map(c => limpSpr(c, S.bw * .72));
    S.gifts = [0, 1, 2].map(k => giftSprs(k, (pr ? 92 : 132) * sc0));
    S.dglint = make(48, 48, x => { let gr = x.createRadialGradient(24, 24, 0, 24, 24, 9); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.fillRect(0, 0, 48, 48);
      for (const [a, l] of [[0, 23], [Math.PI / 2, 23], [Math.PI / 4, 9], [-Math.PI / 4, 9]]) { x.save(); x.translate(24, 24); x.rotate(a); gr = x.createLinearGradient(-l, 0, l, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(.5, "rgba(255,255,255,.95)"); gr.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = gr; x.beginPath(); x.ellipse(0, 0, l, 1.2, 0, 0, TAU); x.fill(); x.restore(); } });
  };

  /** the party, at loop time T */
  const drawDay = (T, I, A, F) => {
    const { W, H, pr, sc0, cx, cy, R } = S, on = I > .01, fin = F >= 0, V = I * S.vis, pl = plan, b = pl.b;
    // the garland: each swag sways and its sag breathes; the pennants turn on the string; a gust runs along it (from
    // the side the pass deals)
    const gustAt = xf => on ? env(T - (pl.gdir > 0 ? xf : 1 - xf) * .9, b.gust[0], b.gust[0] + .5, b.gust[0] + .8, b.gust[1], E.sine) * I * pl.gk : 0, fg = fin ? env(F, 0, .12, .6, 1, E.sine) : 0;
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
    const side = (S.shade(cx + R * .9, cy - R * .3, 30) >= S.shade(cx - R * .9, cy - R * .3, 30) ? 1 : -1) * pl.gside;
    const sink = (1 - S.vis) * (H - cy + R + 80), G = [cx + R * .06, H + (pr ? 80 : 120)], bwOf = z => clamp(R * .46, pr ? 38 : 54, pr ? 80 : 122) * z;
    const pside = (cx > W / 2 ? 1 : -1) * pl.pflip, popX = clamp(cx + pside * R * 1.05, S.pw * .9, W - S.pw * .9), mouthY = H - S.pl - 14 * sc0, aim = [cx - pside * R * .15, cy - R * .6], aimRot = Math.atan2(aim[0] - popX, mouthY - aim[1]); /* in the corner on the bouquet's side, clear of the footer's wash, aimed back over it */
    const reach = Math.hypot(aim[0] - popX, mouthY - aim[1]), dir0 = -Math.PI / 2 + aimRot, ox = popX, oy = mouthY, pa = T - b.pop, late = T > 14.6 ? (15 - T) / .4 : 1; // (anything still falling as the loop comes round goes: a fallback, it is all off the foot by then)
    const gsc = bwOf(pl.gz) / S.bw, gspr = pl.clear ? S.clear : S.bal[pl.guest < 0 ? GUEST : pl.guest], gx = cx + side * R * .92, gy = cy - R * .3 + gspr.lift * gsc + sink, ba = T - b.burst;
    const items = []; // balloons this frame: sprite, colour, knot, turn, scale, alpha, and where its string goes
    const tether = (s, c, kx, ky, sc, a, wob, ph) => items.push({ s, c, kx, ky, sc, a, rot: Math.atan2(kx - G[0], G[1] - ky) + wob, ex: G[0], ey: G[1], qx: (kx + G[0]) / 2 + Math.sin(A * .8 + ph) * R * .06, qy: (ky + G[1]) / 2, ph });
    const trail = (s, c, kx, ky, sc, a, rot, len, lag, ph) => items.push({ s, c, kx, ky, sc, a, rot, ex: kx - lag, ey: ky + len, qx: kx - lag * .3 + Math.sin(A * 1.1 + ph) * len * .05, qy: ky + len * .5, ph });
    // the bouquet at home, bobbing on its strings; jostled by the popper's blast and by the balloon beside it bursting —
    // pushed away from each, and sprung back
    const jolts = on ? [[ox, oy, pa, 1.2], [gx, gy - gspr.lift * gsc, ba, .8]].filter(j => j[2] > 0 && j[2] < 3.5) : [];
    if (on && pl.horns) for (const h of pl.horns.list) { const P0 = hornAt(h), tx = P0.x - P0.sd * P0.L * .9, t0 = pl.horns.t0 + h.d; for (const tt of [t0 + .1, t0 + .76, t0 + pl.horns.chord - h.d + .14]) { const a = T - tt; if (a > 0 && a < 3.5) jolts.push([tx, P0.y, a, .55]); } } /* (a dealt pass's horns jostle them too, */
    if (on && pl.gift) { const a = T - pl.gift.pop; if (a > 0 && a < 3.5) jolts.push([cx + pl.gift.side * R * .66, H - R * .2, a, .5]); } /* and the gift's lid flying off) */
    const home = S.slots.map(s => { const sc = bwOf(s.z) / S.bw, spr = S.bal[s.c]; let x = cx + s.u * R + Math.sin(A * .37 * s.f + s.ph) * R * .03, y = cy + s.v * R + Math.sin(A * .6 * s.f + s.ph2) * R * .022 + spr.lift * sc + sink, wob = Math.sin(A * .5 * s.f + s.ph) * .045;
      for (const [x0, y0, t, k] of jolts) { const dx = x - x0, dy = y - spr.lift * sc - y0, d = Math.hypot(dx, dy) || 1, f = k * I * Math.exp(-t * 2.4) * Math.sin(t * 8.5) * clamp(1.5 - d / (R * 2.4)); x += dx / d * f * R * .08; y += dy / d * f * R * .05; wob += (dx > 0 ? 1 : -1) * f * .12; }
      return { sc, spr, x, y, wob }; });
    // the three that come back up, behind the rest, in the bouquet's own order so they overlap as they did: from the
    // moment each slips free it waits below the page for its time; if the list is touched it comes up into place at once
    const trio = fin ? TRIO : pl.trio; // (the ones a pass lets go: the signature's three, or one or two of them)
    if (fin || (on && T >= b.free)) trio.slice().sort((p, q) => p - q).forEach(i => { const s = S.slots[i], h = home[i], ti = trio.indexOf(i);
      if (fin ? F <= .58 + ti * .03 : T <= b.free + ti * .22) return;
      const bt = fin ? seg(F, .58 + ti * .03, .97, E.out) : seg(T, b.back[0] + ti * .25, b.back[1], E.out), y = h.y + (1 - bt) * (H - h.y + h.spr.bh * h.sc + 60) * (fin ? 1 : I);
      if (y - h.spr.bh * h.sc < H + 10) tether(h.spr, s.c, h.x, y, h.sc, 1, h.wob, s.ph); });
    // the bouquet
    S.slots.forEach((s, i) => { const h = home[i], ti = trio.indexOf(i);
      if (fin) { const ft = F * 3.4 - .08 - i * .07; if (ft <= 0) { tether(h.spr, s.c, h.x, h.y, h.sc, 1, h.wob, s.ph); return; }
        const up = fly(0, 1.5, H * .8, ft), fx = h.x + Math.sin(ft * 1.3 + s.ph) * R * .08; trail(h.spr, s.c, fx, h.y - up, h.sc, .35 + .65 * S.shade(fx, h.y - up - h.spr.lift * h.sc, 30), Math.sin(ft * 1.9 + s.ph) * .1, H * .5, R * .1 * (s.u < 0 ? -1 : 1), s.ph);
        if (ti < 0 && F > .58 + i * .02) { const bt = seg(F, .58 + i * .02, .97, E.out); tether(h.spr, s.c, h.x, h.y + (1 - bt) * (H - h.y + h.spr.bh * h.sc + 60), h.sc, 1, h.wob, s.ph); }
        return; }
      const ft = ti >= 0 && on ? T - b.free - ti * .22 : -1;
      if (ft <= 0) { tether(h.spr, s.c, h.x, h.y, h.sc, 1, h.wob, s.ph); return; }
      const up = fly(0, 1.1, H * .4, ft), sx = (ti - 1) * R * .3 * E.out(clamp(ft / 3)) + Math.sin(ft * 1.4 + s.ph) * R * .06; /* slipped free: up and away, its string trailing (gone with the loop if the list is touched) */
      trail(h.spr, s.c, h.x + sx, h.y - up, h.sc, I * (pl.sig ? .35 + .65 * S.shade(h.x + sx, h.y - up - h.spr.lift * h.sc, 30) : .1 + .9 * S.shade(h.x + sx, h.y - up - h.spr.lift * h.sc, h.spr.bw * h.sc * .8)), /* (a dealt pass's fade further by the words, as its own beats do) */ Math.sin(ft * 1.7 + s.ph) * .12 + h.wob, Math.hypot(G[0] - h.x, G[1] - h.y), (ti - 1) * R * .2, s.ph);
    });
    // the balloon that comes up to join them, and pops
    const gend = pl.fate === "pop" ? b.burst : b.leave; // (it pops, or it leaves another way: dealt, below)
    if (on && pl.guest >= 0 && T > b.guest[0] && T < gend) {
      const q = seg(T, b.guest[0], b.guest[1], E.out), tr = seg(T, b.tremble[0], b.tremble[1], E.in), ky = lerp(H + gspr.bh * gsc + 40, gy, q) + Math.sin(A * .7) * R * .02 + Math.cos(T * 39) * tr;
      const kx = gx + Math.sin(T * 1.3) * R * .06 * (1 - q) + Math.sin(A * .45) * R * .02 + Math.sin(T * 47) * 1.6 * tr;
      trail(gspr, pl.gc, kx, ky, gsc * (1 + tr * .09), V * (.35 + .65 * S.shade(kx, ky - gspr.lift * gsc, 30)), Math.sin(A * .6) * .05 + (1 - q) * Math.sin(T * 2.2) * .12, H, R * .1 * (1 - q), 1.7);
    }
    // (a dealt pass's guest may slip its string instead, and float off the top with its ribbon trailing)
    if (on && pl.fate === "float" && T >= b.leave) { const ft = T - b.leave, kx0 = gx + Math.sin(A * .45) * R * .02, ky0 = gy + Math.sin(A * .7) * R * .02, up = fly(0, 1.1, H * .42, ft), x = kx0 + side * R * .3 * E.out(clamp(ft / 3)) + Math.sin(ft * 1.5) * R * .06;
      if (ky0 - up + H > -10) trail(gspr, pl.gc, x, ky0 - up, gsc, V * (.1 + .9 * S.shade(x, ky0 - up - gspr.lift * gsc, gspr.bw * gsc * .8)), Math.sin(A * .6) * .05 + Math.sin(ft * 1.7) * .12, H, side * R * .16 * E.out(clamp(ft)), 1.7); }
    // (a dealt pass's foil balloons: up from below to join the bouquet, turning on their ribbons and catching the light,
    // then away past the top)
    if (on && pl.foils) for (const f of pl.foils) { if (T <= f.t0) continue;
      const spr = S.foils[f.kind][f.tone], sc = bwOf(f.z) / S.bw, q = seg(T, f.t0, f.t1, E.out), hx = clamp(cx + f.du * R, spr.bw * sc * .6, W - spr.bw * sc * .6), hy = cy + (pr ? Math.max(f.dv, -.94) : f.dv) * R + spr.lift * sc + sink; /* (on a phone, not up under the list) */
      const ky = lerp(H + spr.bh * sc + 50, hy, q) + Math.sin(A * .6 + f.ph) * R * .02, kx = hx + Math.sin(A * .4 + f.ph) * R * .02 + Math.sin(T * 1.2 + f.ph) * R * .05 * (1 - q);
      const tw = f.tw * Math.sin((T - f.t0) * f.tf + f.ph), ct = Math.cos(tw), ft = T - f.leave, lean = Math.atan2(kx - G[0], G[1] - ky);
      if (ft <= 0) tether(spr, 8, kx, ky, sc, V * (.1 + .9 * S.shade(kx, ky - spr.lift * sc, spr.bw * sc * .8)), Math.sin(A * .5 + f.ph) * .04, f.ph);
      else { const up = fly(0, 1.15, H * .44, ft), x = kx + f.dx * R * .35 * E.out(clamp(ft / 3)) + Math.sin(ft * 1.3 + f.ph) * R * .05; if (ky - up + H < -10) continue;
        trail(spr, 8, x, ky - up, sc, V * (.1 + .9 * S.shade(x, ky - up - spr.lift * sc, spr.bw * sc * .8)), lean * (1 - E.out(clamp(ft))) + Math.sin(ft * 1.6) * .1, Math.hypot(G[0] - kx, G[1] - ky), f.dx * R * .2 * E.out(clamp(ft / 2)), f.ph); }
      const it = items[items.length - 1]; it.fx = Math.max(.18, Math.abs(ct)); it.gl = Math.pow(clamp((ct - .94) / .06), 2); it.hx = -spr.bw * .2 * sc; it.hy = spr.hy * sc; }
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
    for (const it of items) put(it.s, it.kx, it.ky, it.s.ax, it.s.ay, it.rot, it.fx === undefined ? it.sc : it.sc * it.fx, it.sc, it.a);
    for (const it of items) if (it.gl > .01) { const c = Math.cos(it.rot), n = Math.sin(it.rot), hx = it.hx * it.fx; put(S.dglint, it.kx + hx * c - it.hy * n, it.ky + hx * n + it.hy * c, .5, .5, 0, it.sc * .9, it.sc * .9, it.gl * it.a); }
    unit();
    // (in front: a dealt pass's balloon let go untied, its party horns, the rare gift box)
    if (on && pl.fate === "zip" && T >= b.leave) zipAt(pl, T, V, gx + Math.sin(A * .45) * R * .02, gy + Math.sin(A * .7) * R * .02, gspr, gsc, side);
    if (on && pl.horns) hornsAt(pl.horns, T, V);
    if (on && pl.gift) giftAt(pl.gift, T, V, cx, R, bwOf(1));
    unit();
    // the pop: rubber flung out and falling, a snap of lines, and the string dropping away
    const age = T - b.burst;
    if (on && age >= 0 && age < 2.2) {
      const bx = gx, by = gy - gspr.lift * gsc * 1.1, rb = gspr.bw * gsc * .55;
      for (const s of S.shreds) { const x = bx + Math.cos(s.a) * rb * .6 + fly(Math.cos(s.a) * s.v, 4, 0, age), y = by + Math.sin(s.a) * rb * .6 + fly(Math.sin(s.a) * s.v, 4, 620, age); if (y > H + 20) continue;
        put(S.scraps[pl.gc][s.k], x, y, .5, .5, s.a + s.spin * age, Math.cos(s.flip * age), 1, V); }
      unit();
      if (age < .22) { const q = age / .22; g.globalAlpha = V * (1 - q) * .8; g.strokeStyle = "#96125A"; g.lineWidth = 2.2 * sc0; g.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + .2, r0 = rb * (1 + q * .9), r1 = r0 + rb * .38 * (1 - q * .6); g.moveTo(bx + Math.cos(a) * r0, by + Math.sin(a) * r0); g.lineTo(bx + Math.cos(a) * r1, by + Math.sin(a) * r1); } g.stroke();
        g.globalAlpha = V * (1 - q) * .3; g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(bx, by, rb * (.6 + q * .9), 0, TAU); g.fill();
        g.globalAlpha = V * (1 - q) * .7; g.strokeStyle = pl.ring; g.lineWidth = 3 * sc0 * (1 - q) + .5; g.beginPath(); g.arc(bx, by, rb * (.9 + E.out(q) * 1.1), 0, TAU); g.stroke(); } /* the air it held, rushing out */
      const ky = gy + fly(0, .8, 1500, age); if (ky < H + 20) { g.globalAlpha = V; g.strokeStyle = S.rib[pl.gc]; g.lineWidth = pr ? 1 : 1.25; g.beginPath(); g.moveTo(gx, ky); for (let j = 1; j <= 20; j++) { const d = j * H / 20; g.lineTo(gx + Math.sin(j * .9 + age * 6) * Math.min(1, age * 3) * 9 * sc0, ky + d * (1 - Math.min(.4, age * .5))); } g.stroke(); }
      g.globalAlpha = 1;
    }
    // (a dealt pass's clear balloon held confetti: out it comes, every way at once, and down)
    if (on && pl.clear && age >= 0) confetti(age, gx, gy - gspr.lift * gsc, -Math.PI / 2, gspr.bw * gsc * 1.3, V, late, S.faces[pl.pal], S.backs[pl.pal], pl.cshape, 4.2, gspr.bw * gsc * .42);
    // the popper's burst: up from below the page at the foot of the open space, a shiver, the pop, a kick, and back down
    if (on && pa > 0) {
      streamers(pa, ox, oy, dir0, reach, V, late, S.faces[pl.pal], S.backs[pl.pal]);
      confetti(pa, ox, oy, dir0, reach, V, late, S.faces[pl.pal], S.backs[pl.pal], pl.cshape, 1, 0);
      g.globalAlpha = 1;
    }
    if (on && T > b.popper[0] && T < b.sink[1]) popperUp(T, V, b, popX, mouthY, aimRot, pa, ox, oy, dir0, S.poppers[pl.popC]);
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
    layNightDealt(W, H, LB, ha, wB, rng(947));
  };
  // the second light's colour a pass deals (the first is always the kit's pink): its spots, its beam, the tiles that catch
  // it at three strengths, its glitter
  const HUES = [
    { spot: "#FFD06A", beam: "#FFD36E", tiles: ["#B5822B", "#FFCB5C", "#FFF2CC"], glit: "#FFD36E" }, // gold, the signature's
    { spot: "#B991FF", beam: "#A77BFF", tiles: ["#5E3AA6", "#B18CFF", "#EFE6FF"], glit: "#CDB2FF" }, // violet
    { spot: "#72E4EE", beam: "#4FD6E6", tiles: ["#1C6F7C", "#6FDDEA", "#DDFAFF"], glit: "#A6F2F8" }, // aqua
    { spot: "#F3ECFF", beam: "#EDE4FF", tiles: ["#7F7496", "#DCD2EE", "#FFFFFF"], glit: "#FFFFFF" }, // silver
    { spot: "#FF9A6A", beam: "#FF8A5A", tiles: ["#A4482A", "#FF9A6A", "#FFE0D0"], glit: "#FFB08A" }, // coral
  ];
  /** a spot's shape a dealt pass throws, 64 wide, soft at its edge: round, a heart, a star, a sparkle */
  const shapeSpr = (kind, col) => make(64, 64, x => {
    const cc = rgb(col); x.translate(32, 32); x.beginPath();
    if (kind === 0) x.arc(0, 0, 22, 0, TAU);
    else if (kind === 1) { x.moveTo(0, 21); x.bezierCurveTo(-4, 15, -25, 4, -25, -8); x.bezierCurveTo(-25, -19, -12, -25, -5, -19); x.quadraticCurveTo(-2, -16.5, 0, -12.5); x.quadraticCurveTo(2, -16.5, 5, -19); x.bezierCurveTo(12, -25, 25, -19, 25, -8); x.bezierCurveTo(25, 4, 4, 15, 0, 21); x.closePath(); }
    else if (kind === 2) for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 10.5 : 25, px0 = Math.cos(a) * rr, py0 = Math.sin(a) * rr + 2; i ? x.lineTo(px0, py0) : x.moveTo(px0, py0); }
    else { x.moveTo(0, -26); x.quadraticCurveTo(3, -3, 26, 0); x.quadraticCurveTo(3, 3, 0, 26); x.quadraticCurveTo(-3, 3, -26, 0); x.quadraticCurveTo(-3, -3, 0, -26); x.closePath(); }
    const gr = x.createRadialGradient(0, -2, 0, 0, 0, 26); gr.addColorStop(0, css(tint(cc, .55))); gr.addColorStop(.45, css(tint(cc, .18), .96)); gr.addColorStop(1, css(cc, .8));
    x.shadowColor = css(cc, .85); x.shadowBlur = 7 * px; x.fillStyle = gr; x.fill(); unsoft(x);
  });
  /** a spotlight's cone from below, `LB` long: soft, brightest at its foot, with haze drifting in it */
  const beamOf = (col, seed, LB, ha, wB) => lo(wB, LB, .16, x => { const c = rgb(col), m = wB / 2, rb = rng(seed);
    for (let q = 0; q < 7; q++) { const a = ha * (1.3 - q * .16); x.beginPath(); x.moveTo(m - 3, LB); x.lineTo(m - LB * Math.tan(a), 0); x.lineTo(m + LB * Math.tan(a), 0); x.lineTo(m + 3, LB); x.closePath(); const gr = x.createLinearGradient(0, LB, 0, 0); gr.addColorStop(0, css(c, .2)); gr.addColorStop(.3, css(c, .1)); gr.addColorStop(.75, css(c, .03)); gr.addColorStop(1, css(c, 0)); x.fillStyle = gr; x.fill(); }
    for (let k = 0; k < 9; k++) { const t = .15 + rb() * .75, yy = LB * (1 - t), ww = LB * t * Math.tan(ha) * .7, gr = x.createRadialGradient(m + (rb() - .5) * ww, yy, 0, m + (rb() - .5) * ww, yy, ww * (.5 + rb() * .5)); gr.addColorStop(0, css(tint(c, .3), .1)); gr.addColorStop(1, css(c, 0)); x.fillStyle = gr; x.fillRect(0, yy - ww, wB, ww * 2); } });
  /** a mirror ball's tiles: rows of them, fewer toward the poles, each a little askew, a line of grout round each */
  const facetsOf = (rows, eq, r) => { const out = [], gp = .016;
    for (let j = 1; j < rows - 1; j++) {
      const p0 = -Math.PI / 2 + Math.PI * j / rows, p1 = p0 + Math.PI / rows, pm = (p0 + p1) / 2, n = Math.max(6, Math.round(eq * Math.cos(pm))), e = gp / Math.max(.3, Math.cos(pm));
      for (let i = 0; i < n; i++) { const l0 = (i + (j % 2) * .5) / n * TAU, l1 = l0 + TAU / n;
        out.push({ c0: Math.cos(p0 + gp), y0: -Math.sin(p0 + gp), c1: Math.cos(p1 - gp), y1: -Math.sin(p1 - gp), cm: Math.cos(pm), ym: -Math.sin(pm), l0: l0 + e, l1: l1 - e, lm: (l0 + l1) / 2, jx: (r() - .5) * .16, jy: (r() - .5) * .16, b: r() }); }
    }
    return out; };
  // what the dealt passes bring by night, made once here from a stream of their own: the spots' shapes in every colour,
  // the hues' glints and beams, the lasers' glare, the pin spot and its halo, the drop's balloons, a second ball's tiles,
  // and a cannon's load of foil confetti and streamers with the popper that fires it
  const layNightDealt = (W, H, LB, ha, wB, r) => {
    const { pr, sc0 } = S, cols = ["#FF6FB8", ...HUES.map(h => h.spot)];
    S.shapes = [0, 1, 2, 3].map(k => cols.map(c => shapeSpr(k, c)));
    S.glints.length = 3; for (const h of HUES.slice(1)) S.glints.push(make(64, 64, x => { const cc = rgb(h.tiles[2]); let gr = x.createRadialGradient(32, 32, 0, 32, 32, 14); gr.addColorStop(0, css(cc, 1)); gr.addColorStop(1, css(cc, 0)); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      for (const [a, l] of [[0, 30], [Math.PI / 2, 30], [Math.PI / 4, 12], [-Math.PI / 4, 12]]) { x.save(); x.translate(32, 32); x.rotate(a); gr = x.createLinearGradient(-l, 0, l, 0); gr.addColorStop(0, css(cc, 0)); gr.addColorStop(.5, css(cc, .9)); gr.addColorStop(1, css(cc, 0)); x.fillStyle = gr; x.beginPath(); x.ellipse(0, 0, l, 1.3, 0, 0, TAU); x.fill(); x.restore(); } }));
    S.nb = S.beamSpr.length; // the hues' beams after the signature's
    HUES.slice(1).forEach((h, hi) => S.beamSpr.push(beamOf(h.beam, 71 + hi, LB, ha, wB)));
    S.beamW = beamOf("#FFF3FA", 81, LB, ha * .85, wB);
    S.ldirs = []; for (let j = -12; j <= 12; j++) { const phi = j * .1, cp = Math.cos(phi), n = Math.round(48 * cp); for (let i = 0; i < n; i++) { const lam = (i + (j & 1) * .5) / n * TAU + (r() - .5) * .05; S.ldirs.push({ x: cp * Math.sin(lam), y: -Math.sin(phi), z: cp * Math.cos(lam) }); } }
    S.lglow = LASER.map(c => make(64, 64, x => { const cc = rgb(c), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, css(tint(cc, .75), .95)); gr.addColorStop(.18, css(cc, .55)); gr.addColorStop(1, css(cc, 0)); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }));
    S.haloW = make(128, 128, x => { const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,244,252,.6)"); gr.addColorStop(.4, "rgba(255,230,246,.22)"); gr.addColorStop(1, "rgba(255,230,246,0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); });
    S.nbal = ["#E0217A", "#FF5FAE", "#D9A441", "#9C6ADE", "#CFC6E6"].map(c => balloon(c, pr ? 52 : 72));
    S.facets2 = facetsOf(12, 22, r); S.fq2 = new Float32Array(S.facets2.length * 9);
    S.conf = confOf(r, pr, sc0); S.cq = new Float32Array(S.conf.length * 10); S.strm = strmOf(r, pr); S.sq = new Float32Array(41 * 9);
    S.pw = (pr ? 24 : 32) * sc0; S.pl = (pr ? 52 : 70) * sc0; S.npopper = popperSpr(S.pw, S.pl, "#D8CFE6", "#FF3DA8", "#FFE9F6");
    const NM = ["#FFD36E", "#FF5FB0", "#EEEAF7", "#C9A6FF", "#FF9FCF", "#FF2E9A"];
    S.faces = [NM.map(c => css(rgb(c)))]; S.backs = [NM.map(c => css(deep(rgb(c), .5)))];
  };
  /** the rare second ball: a smaller one let down on its own chain beside the first, turning the other way and throwing
   *  spots of its own in the second light's colour (a third as many as the first's), and taken up again */
  const twinAt = (tw, pl, T, I, A, bx, by, br, lit, w, fill, glint1) => {
    const e = seg(T, tw.t[0], tw.t[1], E.back) * (1 - seg(T, tw.t[2], tw.t[3], E.io)) * I; if (e <= .002) return;
    const { W, H } = S, br2 = br * .6, off = (br + br2) * 1.35, yy = S.cy + tw.dy * br;
    // it hangs on the side whose column, from the top of the page down to where it stops, keeps farthest from the words
    // (the bar's included: its chain and the ball on the way down pass through it), worked out from the page, not the swing
    const room = x => { let m = 1; for (let y = 0; y <= yy + br2; y += 14) m = Math.min(m, S.shade(x, y, br2 * .8)); return m; };
    const xa = clamp(S.cx + off, br2 + 10, W - br2 - 10), xb = clamp(S.cx - off, br2 + 10, W - br2 - 10), ra = room(xa), rb = room(xb), side = ra > rb + .02 ? 1 : rb > ra + .02 ? -1 : tw.side;
    const x2 = clamp(bx + side * off, br2 + 10, W - br2 - 10), sw2 = Math.sin(A * .8 + 1.3) * .012;
    const L2 = lerp(-br2 * 2.4 - 30, yy + 12, e), X = x2 + Math.sin(sw2) * L2, Y = -12 + Math.cos(sw2) * L2, th2 = 2.1 - S.th * 1.35;
    const cs = Math.cos(th2), sn = Math.sin(th2), Dz = S.Dz * .78, spr = S.shapes[pl.shape][pl.col];
    g.globalCompositeOperation = "lighter";
    for (let i = 1; i < S.dots.length; i += 3) { const d = S.dots[i], dx = d.x * cs + d.z * sn, dz = d.z * cs - d.x * sn; if (dz > -.3) continue;
      const k = 1 / -dz, x = X + dx * Dz * k, y = Y + d.y * Dz * k; if (x < -60 || x > W + 60 || y < -60 || y > H + 60) continue;
      const rr = S.spotR * .8 * d.s * Math.sqrt(k), el = Math.pow(k, .55);
      upright(spr, x, y, Math.atan2(y - Y, x - X), rr * el / 32 * 1.2, rr / 32 * 1.2, 1, e * lit[1] * .6 * d.b * clamp((-dz - .3) / .15) * S.shade(x, y, rr)); }
    g.globalCompositeOperation = "source-over";
    // (faded wherever it passes near words: the chain link by link, the ball as a whole, as it comes down past the bar)
    chain(X, Y, br2, sw2, Math.min(1, e * 3), .03);
    ballAt(X, Y, br2, th2, w * 1.35, lit, A, S.facets2, S.fq2, fill, glint1, .05 + .95 * S.shade(X, Y, br2 * 1.5));
  };
  /* ---------------- by night: what the dealt passes bring ---------------- */
  const LASER = ["#FF2FB0", "#FFD02E", "#8F62FF", "#1FE6FF", "#FFFFFF", "#FF4A30"]; // the kit's pink, then each hue's
  /** the lasers' fan: from the foot of the page under the ball, switched on one after another, scanning the haze (they
   *  fade as it thins, away from their source), then closing onto the ball (which throws them round the room:
   *  laserDots), and off */
  const LZ = new Float32Array(16); // each line's length this frame
  const laserFan = (L, T, I, bx, by, br) => {
    const t = L.t, on = env(T, t[0], t[0] + .3, t[4], t[5], E.sine) * I; if (on <= .004) return;
    const { W, H, R, pr } = S, n = L.n, sx = clamp(bx + L.side * R * .3, 16, W - 16), sy = H + 4, toBall = Math.atan2(bx - sx, sy - by), tt = T - t[0];
    const close = seg(T, t[2], t[3], E.io), far = Math.hypot(W, H) * .9, reach = Math.hypot(bx - sx, sy - by) - br * .8, lean = pr ? 0 : (bx > W / 2 ? .16 : -.16);
    const c = lerp(toBall + lean + .3 * Math.sin(tt * .8 + L.ph), toBall, close), spread = lerp(.15 + .1 * Math.sin(tt * 1.25 + L.ph * 2), 0, close), fade = Math.max(reach * 1.25, H * (pr ? .62 : .8));
    for (let i = 0; i < n; i++) { const a = c + (i / (n - 1) - .5) * 2 * spread, sa = Math.sin(a), ca = Math.cos(a); let len = lerp(far, reach, close) * E.out(clamp((tt - i * L.stag) / .16)); /* (stopping short of any words it would cross) */
      for (let d = 30; d < len; d += 18) if (S.shade(sx + sa * d, sy - ca * d, 10) < .45) { len = Math.max(0, d - 14); break; } LZ[i] = len; }
    unit(); g.globalCompositeOperation = "lighter"; g.lineCap = "round";
    for (let layer = 0; layer < 3; layer++) {
      g.beginPath();
      for (let i = 0; i < n; i++) { const len = LZ[i]; if (len <= 0) continue; const a = c + (i / (n - 1) - .5) * 2 * spread;
        g.moveTo(sx, sy); g.lineTo(sx + Math.sin(a) * len, sy - Math.cos(a) * len); }
      const gr = g.createRadialGradient(sx, sy, 0, sx, sy, fade), cc = layer === 2 ? L.core : L.col; gr.addColorStop(0, cc); gr.addColorStop(.55, css(rgb(cc), .55)); gr.addColorStop(1, css(rgb(cc), 0));
      g.globalAlpha = on * [.1, .26, 1][layer] * (1 + close * .4); g.strokeStyle = gr; g.lineWidth = [16, 5.5, 1.6][layer]; g.stroke();
    }
    g.lineCap = "butt"; put(S.lglow[L.ci], sx, sy, .5, .5, 0, 1.6, 1.6, on * (.15 + .85 * S.shade(sx, H - 14, 40)));
    g.globalCompositeOperation = "source-over";
  };
  /** where the closed fan meets the turning ball: the room full of its points, sharp and bright, turning with it (a
   *  lattice finer than the spots', one point to a tile; a hot core and a little glow each, all drawn at once) */
  const laserDots = (L, T, I, bx, by, cs, sn) => {
    const t = L.t, k = env(T, t[3] - .15, t[3] + .2, t[4], t[5], E.sine) * I; if (k <= .004) return;
    const { W, H, pr } = S, Dz = S.Dz * .8, rc = pr ? 1.25 : 1.5, rg = pr ? 3.4 : 4.2, core = new Path2D(), glow = new Path2D(), dim = new Path2D();
    for (const d of S.ldirs) { const dx = d.x * cs + d.z * sn, dz = d.z * cs - d.x * sn; if (dz > -.28) continue;
      const q = 1 / -dz, x = bx + dx * Dz * q, y = by + d.y * Dz * q; if (x < -6 || x > W + 6 || y < -6 || y > H + 6) continue;
      if (S.shade(x, y, 4) < .5) { dim.moveTo(x + rc, y); dim.arc(x, y, rc, 0, TAU); continue; }
      core.moveTo(x + rc, y); core.arc(x, y, rc, 0, TAU); glow.moveTo(x + rg, y); glow.arc(x, y, rg, 0, TAU); }
    unit(); g.globalCompositeOperation = "lighter";
    g.fillStyle = L.col; g.globalAlpha = k * .22; g.fill(glow); g.globalAlpha = k * .08; g.fill(dim);
    g.fillStyle = L.core; g.globalAlpha = k; g.fill(core);
    g.globalCompositeOperation = "source-over";
  };
  /** the pin spot: one white light finding the ball (the room's lights are down: drawNight) — from above, or on a phone,
   *  where the list fills the top of the page, from the side */
  const pinBeam = (p, bx, by) => {
    const { W, pr } = S, sy = pr ? by - W * .45 : -40; let sx = pr ? (bx > W / 2 ? -40 : W + 40) : bx, best = -1;
    if (!pr) for (const f of [-.06, .06, -.1, .1, 0]) { const x = bx + (bx > W / 2 ? 1 : -1) * f * W, r = S.shade(x, 36, 40) + S.shade(x, 90, 30) * .5; if (r > best + .01) { best = r; sx = x; } } /* (as far from the bar's words as it can) */
    g.globalCompositeOperation = "lighter"; put(S.beamW, sx, sy, .5, 1, Math.atan2(bx - sx, -(by - sy)), 1, 1, p * .95); g.globalCompositeOperation = "source-over";
  };
  /** a balloon drop: let go from above the page, drifting down through the lights and turning over, out at the foot;
   *  the far ones behind the ball, the near ones in front */
  const dropAt = (D, T, I, near) => {
    const { W, H, pr, cx, R } = S, x0 = pr ? W * .07 : Math.max(W * .5, cx - R * 1.3), x1 = pr ? W * .93 : Math.min(W - 36, cx + R * 1.3);
    for (const d of D) { if ((d.z > .55) !== near) continue; const t = T - d.t0; if (t <= 0) continue;
      const spr = S.nbal[d.c], sc = d.s, y = -30 + t * d.v * H + Math.sin(t * d.bf + d.ph) * 6; if (y - spr.bh * sc > H + 30) continue;
      const x = lerp(x0, x1, d.x) + Math.sin(t * d.sf + d.ph) * d.sw, rot = Math.sin(t * d.rf + d.ph) * .32 + d.r0;
      put(spr, x, y, spr.ax, spr.ay, rot, sc, sc, I * (.5 + .5 * d.z) * (.08 + .92 * S.shade(x, y - spr.lift * sc, spr.bw * sc * .6)) * (pr ? .3 + .7 * seg(y, H * .3, H * .6, E.sine) : 1)); } /* (faint through a phone's list) */
  };
  /** the heart of light (rare): the ball's spots gather into a heart round it, it beats twice, and they fly apart off
   *  the page; returns how far it's up, so the room's spots can step back */
  const heartAt = (hp, T, I, bx, by, br) => {
    const t = hp.t; if (T <= t[0] || T >= t[3]) return 0;
    const { W, H, R, pr } = S, n = hp.n, Rh = Math.min(R * (pr ? .95 : 1.02), br * 2.9), hy0 = by + br * .08;
    const bump = u => Math.exp(-(((T - u) / .085) ** 2)), beat = 1 + .12 * (bump(t[1] + .6) + .7 * bump(t[1] + .86) + bump(t[1] + 1.9) + .7 * bump(t[1] + 2.16));
    const sz = (pr ? 13 : 17) / 32;
    for (let i = 0; i < n; i++) {
      const u = i / n * TAU, hx = 16 * Math.pow(Math.sin(u), 3), hy = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
      const tx = bx + hx / 16 * Rh * beat, ty = hy0 + (hy / 16 + .12) * Rh * beat, k = seg(T, t[0] + i * .016, t[0] + i * .016 + .85, E.out), out = Math.max(0, T - t[2] - ((i * 7) % n) / n * .35);
      let x = lerp(bx, tx, k), y = lerp(by, ty, k);
      if (out > 0) { const dx = tx - bx, dy = ty - hy0, dl = Math.hypot(dx, dy) || 1, f = 260 * out + 700 * out * out; x += dx / dl * f; y += dy / dl * f; }
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
      upright(S.shapes[1][i % 2 ? hp.col : 0], x, y, 0, sz * (.6 + .4 * k), sz * (.6 + .4 * k), 1, I * (.3 + .7 * k) * S.shade(x, y, 10));
    }
    return env(T, t[0], t[0] + .5, t[2], t[2] + .4) * I;
  };
  /** a sprite at (x, y) stretched `s1` along the direction `ang` and `s2` across it, but kept upright (a heart thrown on
   *  a wall at a slant is drawn out, not turned), and narrowed to `fx` across itself as it turns over */
  const upright = (s, x, y, ang, s1, s2, fx, a) => {
    if (a <= .004) return; const cu = Math.cos(ang), su = Math.sin(ang), m00 = s1 * cu * cu + s2 * su * su, m01 = (s1 - s2) * cu * su, m11 = s1 * su * su + s2 * cu * cu;
    g.globalAlpha = a < 1 ? a : 1; g.setTransform(m00 * fx * px, m01 * fx * px, m01 * px, m11 * px, x * px, y * px); g.drawImage(s, -s.w2 / 2, -s.h2 / 2, s.w2, s.h2);
  };
  /** where a dealt pass's beam `b` (the i-th) points at loop time T before it's drawn onto the ball: the signature's
   *  sweep at the pass's own pace, all of them leaning together, scissoring from the two sides, or passing over the ball
   *  one after another */
  const swing = (pl, b, i, T, toBall) => {
    const t = T - pl.b.sweep;
    if (pl.choreo === 1) return b.base * .3 + .52 * Math.sin(t * .85 + pl.cph);
    if (pl.choreo === 2) return (b.x < S.W / 2 ? 1 : -1) * (.44 + .3 * Math.sin(t * 1.05 + pl.cph));
    if (pl.choreo === 3) return toBall + (b.amp + .22) * Math.sin(t * .75 + i * 2.1 + pl.cph);
    return b.base + b.amp * Math.sin(t * b.f * pl.cf + b.ph + pl.cph);
  };

  /** a ball's chain, from past the top of the page down to its cap (the ball at (bx, by), radius br, swung sw); `k` fades
   *  it all, `low` is how faint its links are beside words */
  const chain = (bx, by, br, sw, k = 1, low = .19) => {
    unit(); const { pr } = S, ux = Math.sin(sw), uy = Math.cos(sw), step = pr ? 6 : 7.5, capX = bx - ux * br * .98, capY = by - uy * br * .98;
    g.lineWidth = pr ? 1.2 : 1.5; g.strokeStyle = "#E6C6DC"; const links = [];
    for (let k = 1; ; k++) { const x = capX - ux * (k * step), y = capY - uy * (k * step); if (y < -10) break; const s = S.shade(x, y, 6); links.push(x, y, k % 2, s > .9 ? 0 : s > .4 ? 1 : 2); }
    for (let lv = 0; lv < 3; lv++) { g.beginPath(); let any = false; /* its links, a ring and one seen edge-on in turn, fainter behind the words */
      for (let i = 0; i < links.length; i += 4) { if (links[i + 3] !== lv) continue; any = true; const x = links[i], y = links[i + 1];
        if (links[i + 2]) { g.moveTo(x + Math.cos(sw) * step * .3, y + Math.sin(sw) * step * .3); g.ellipse(x, y, step * .3, step * .58, sw, 0, TAU); } else { g.moveTo(x - ux * step * .55, y - uy * step * .55); g.lineTo(x + ux * step * .55, y + uy * step * .55); } }
      if (any) { g.globalAlpha = [.75, .45, low][lv] * k; g.stroke(); } }
    g.globalAlpha = k; g.fillStyle = "#6E4A64"; g.save(); g.translate(capX, capY); g.rotate(sw); g.fillRect(-br * .1, -br * .02, br * .2, br * .1); g.fillStyle = "#C9A9C0"; g.fillRect(-br * .1, -br * .02, br * .2, br * .03); g.restore();
  };
  /** a mirror ball at (bx, by), radius br, turned to th and turning at w: its tiles, grouped by colour and each group
   *  filled at once; which colour a tile shows is what it reflects of the room — the pink light, the second one, the
   *  white one, or the dark room and its lit floor (`fill`, the colours); the brightest throw a glint; `a` fades it all */
  const ballAt = (bx, by, br, th, w, lit, A, facets, q, fill, glint1, a = 1) => {
    unit(); if (a < 1) g.globalAlpha = a; g.fillStyle = "#14030E"; g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fill();
    const cT = Math.cos(S.tilt), sT = Math.sin(S.tilt), gl = []; let nq = 0;
    const ka = A * .23, LK = nrm([Math.sin(ka) * .5, -.58 + Math.cos(ka * .7) * .14, .72]); /* the white light wanders, and its highlight travels over the upper tiles */
    const calm = 1 / (1 + w * .7), hotAt = .45 + (1 - calm) * .35; /* the faster it turns the more often a tile passes the light: softer glints then, a shimmer and never a flashing */
    for (const f of facets) {
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
    for (let grp = 0; grp < FILL.length; grp++) { let any = false; g.beginPath(); for (let i = 0; i < nq; i++) { const o = i * 9; if (q[o + 8] !== grp) continue; any = true; g.moveTo(q[o], q[o + 1]); g.lineTo(q[o + 2], q[o + 3]); g.lineTo(q[o + 4], q[o + 5]); g.lineTo(q[o + 6], q[o + 7]); g.closePath(); } if (any) { g.fillStyle = fill[grp]; g.fill(); } }
    put(S.rim, bx, by, .5, .5, 0, br * 2 / 100, br * 2 / 100, a);
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < gl.length; i += 4) { const k = clamp((gl[i + 2] - .3) / 1.1), z = br * (.28 + .5 * k) / 32 * (.6 + .4 * calm); put(S.glints[gl[i + 3] === 1 ? glint1 : gl[i + 3]], gl[i], gl[i + 1], .5, .5, .2, z, z, (.45 + .55 * k) * calm * a); }
    g.globalCompositeOperation = "source-over";
  };
  /** a confetti cannon: a popper comes up at the foot beside the ball and fires foil streamers and confetti up through
   *  the lights, and goes down again */
  const cannonAt = (C, T, I, bx, by) => {
    const { W, H, R, sc0 } = S, on = I > .01, pa = T - C.b.pop, popX = clamp(bx + C.side * R * .75, S.pw, W - S.pw), mouthY = H - S.pl - 14 * sc0;
    const aim = [bx - C.side * R * .15, by - R * .75], aimRot = Math.atan2(aim[0] - popX, mouthY - aim[1]), reach = Math.hypot(aim[0] - popX, mouthY - aim[1]) * 1.05, dir0 = -Math.PI / 2 + aimRot, late = T > 14.6 ? (15 - T) / .4 : 1;
    unit(); g.globalCompositeOperation = "source-over";
    if (on && pa > 0) { streamers(pa, popX, mouthY, dir0, reach, I, late, S.faces[0], S.backs[0]); confetti(pa, popX, mouthY, dir0, reach, I, late, S.faces[0], S.backs[0], C.shape, 1, 0); g.globalAlpha = 1; }
    if (on && T > C.b.popper[0] && T < C.b.sink[1]) popperUp(T, I, C.b, popX, mouthY, aimRot, pa, popX, mouthY, dir0, S.npopper);
  };
  /** the disco, at loop time T */
  const drawNight = (T, I, A, F, dt) => {
    const { W, H, pr, cx, cy, R } = S, on = I > .01, fin = F >= 0 ? env(F, 0, .16, .7, 1, E.sine) : 0, pl = plan, bt = pl.b;
    // the ball: let down on its chain from its resting height, swinging a little, and back up; turning, faster in the race
    const br = S.ballR(R), yRest = Math.min(S.rest, cy), yLow = cy + (R - br) * .3 * pl.depth;
    const drop = on ? seg(T, bt.lower[0], bt.lower[1], E.back) * (1 - seg(T, bt.raise[0], bt.raise[1], E.io)) * I : 0, after = T - bt.lower[1];
    const sw = Math.sin(A * .7) * .01 + (on && after > 0 ? Math.sin(after * 5.2) * Math.exp(-after * 1.5) * .035 * I : 0);
    const L = lerp(yRest, yLow, drop) + 12 - (1 - S.vis) * (yRest + br + 80), bx = cx + Math.sin(sw) * L, by = -12 + Math.cos(sw) * L;
    const race = on ? env(T, bt.spin[0], bt.spin[1], bt.spin[2], bt.spin[3], E.sine) * I * pl.spin : 0, w = .045 + race * 1.3 + fin * 2.2;
    S.th = (S.th + dt * w) % (TAU * 100);
    // (a dealt pass's pin spot: the room's lights go down first, under everything)
    const pinK = pl.pin ? env(T, pl.pin[0], pl.pin[1], pl.pin[2], pl.pin[3], E.sine) * I : 0;
    if (pinK > .004) { unit(); g.globalAlpha = pinK * .55; g.fillStyle = "#0B0007"; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    // the beams: up from below one by one, sweeping; then onto the ball, and apart again, and down (a dealt pass moves
    // them its own way: `swing`)
    const aimK = Math.max(on ? env(T, bt.aim[0], bt.aim[1], bt.aim[2], bt.aim[3], E.sine) * I : 0, fin);
    const lit = [.85 + fin * .5, .75 + fin * .5, .55 + fin * .3];
    let most = 0;
    for (const [i, b] of S.beams.entries()) {
      b.inten = Math.max(on ? env(T, bt.beams[0] + i * .35, bt.beams[1] + i * .35, bt.dim[0] + i * .2, bt.dim[1] + i * .2, E.sine) * I * pl.bk : 0, fin);
      const toBall = Math.atan2(bx - b.x, b.y - by), sweep = pl.sig ? b.base + b.amp * Math.sin((T - bt.sweep) * b.f + b.ph) : swing(pl, b, i, T, toBall);
      b.ang = lerp(sweep, toBall, aimK); b.hit = b.inten * Math.exp(-(((b.ang - toBall) / .15) ** 2)); lit[b.fam] += b.hit * .9; most = Math.max(most, b.inten);
    }
    for (let k = 0; k < 3; k++) lit[k] = Math.min(lit[k], 1.9);
    g.globalCompositeOperation = "lighter";
    for (const b of S.beams) if (b.inten > .004) put(S.beamSpr[pl.bspr[b.spr]], b.x, b.y, .5, 1, b.ang, 1, 1, b.inten * .62);
    g.globalCompositeOperation = "source-over";
    if (pl.laser) laserFan(pl.laser, T, I, bx, by, br);
    if (pinK > .004) pinBeam(pinK, bx, by);
    // under each line the room steps back into shadow, the beams with it (the stage lays its pads over this)
    for (const [x0, y0, x1, y1, kind] of S.raw || []) if (kind === 1) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; put(S.pad, x0 - mx, y0 - my, 0, 0, 0, (x1 - x0 + mx * 2) / 160, (y1 - y0 + my * 2) / 80, .45 + most * .45); }
    g.globalCompositeOperation = "lighter";
    put(S.halo, bx, by, .5, .5, 0, br * 2.6 / 64, br * 2.6 / 64, .5 + (lit[0] + lit[1] - 1) * .35);
    if (pinK > .004) put(S.haloW, bx, by, .5, .5, 0, br * 3.2 / 64, br * 3.2 / 64, pinK * .9);
    // the spots on the walls: each a direction from the ball, turning with it, where it meets the wall behind; round and
    // soft, larger and drawn out the farther off they land, streaking when the ball races, dim behind the words
    const cs = Math.cos(S.th), sn = Math.sin(S.th), Dz = S.Dz;
    // (a dealt pass turns each spot over where it lands, in a wave across the room, and it comes up in the pass's shape
    // and colours — a heart, a star, a sparkle — and turns back before the pass is out; `fm` how far that has gone)
    const fm = pl.sig ? 0 : pl.flip ? env(T, pl.flip[0], pl.flip[1], pl.flip[2], pl.flip[3], E.sine) * I : 0;
    const lz = pl.laser, hz = pl.heart, back = pl.sig ? 0 : Math.max(lz ? env(T, lz.t[3] - .15, lz.t[3] + .2, lz.t[4], lz.t[5], E.sine) * I : 0, hz ? env(T, hz.t[0], hz.t[0] + .5, hz.t[2], hz.t[2] + .4) * I : 0);
    const sK = pl.sig ? 1 : pl.spotK * (1 - (lz ? 1 : .8) * back); // (the room's spots step back for the lasers' points, or the heart)
    for (const d of S.dots) {
      const dx = d.x * cs + d.z * sn, dz = d.z * cs - d.x * sn; if (dz > -.3) continue;
      const k = 1 / -dz, x = bx + dx * Dz * k, y = by + d.y * Dz * k; if (x < -80 || x > W + 80 || y < -80 || y > H + 80) continue;
      const rr = S.spotR * d.s * Math.sqrt(k), el = Math.pow(k, .55), vX = -w * Dz * (dx * dx + dz * dz) * k * k, vY = -w * Dz * d.y * dx * k * k, streak = Math.hypot(vX, vY) / 30 * 1.5;
      const long = streak > rr * (el - 1), ang = long ? Math.atan2(vY, vX) : Math.atan2(y - by, x - bx), maj = long ? rr + streak : rr * el;
      const a = lit[d.c] * .7 * d.b * clamp((-dz - .3) / .15) * S.shade(x, y, rr) * (long ? rr * el / maj : 1);
      if (fm <= 0) { put(S.spots[d.c], x, y, .5, .5, ang, maj / 16, rr / 16, a * sK); continue; }
      const kd = clamp(fm * 1.8 - (pl.fdir > 0 ? x / W : 1 - x / W) * .8), fx = Math.abs(Math.cos(Math.PI * kd));
      if (kd < .5) put(S.spots[d.c], x, y, .5, .5, ang, maj / 16 * Math.max(.06, fx), rr / 16, a * sK);
      else upright(S.shapes[pl.shape][d.c ? pl.col : 0], x, y, ang, maj / 32 * pl.shapeZ, rr / 32 * pl.shapeZ, Math.max(.06, fx), a * sK * pl.shapeK);
    }
    // the twinkles
    unit(); for (const t of S.tw) { const a = (.15 + .85 * Math.pow(.5 + .5 * Math.sin(A * t.f + t.ph), 3)) * S.shade(t.x, t.y, 6) * .8; if (a < .02) continue; g.globalAlpha = a; g.fillStyle = GLIT[t.c]; g.fillRect(t.x - t.s / 2, t.y - t.s / 2, t.s, t.s); g.fillRect(t.x - t.s * 1.6, t.y - .35, t.s * 3.2, .7); g.fillRect(t.x - .35, t.y - t.s * 1.6, .7, t.s * 3.2); }
    // the glitter: falling from above the page and off the foot, glinting as it turns, bright where a beam catches it
    const fleck = (p, y, x) => { let inB = 0; for (const b of S.beams) { if (b.inten < .02) continue; const d = Math.abs(Math.atan2(x - b.x, b.y - y) - b.ang); if (d < .1) inB = Math.max(inB, (1 - d / .1) * b.inten); }
      return (.25 + .75 * Math.pow(Math.abs(Math.sin(A * p.f * Math.PI + p.ph)), 6)) * (.45 + 1.4 * inB) * S.shade(x, y, 6); };
    const spark = (p, x, y, a) => { if (a < .02) return; g.globalAlpha = Math.min(1, a); g.fillRect(x - p.s / 2, y - p.s / 2, p.s, p.s); if (a > .7) { const l = p.s * 2.2 * a; g.fillRect(x - l, y - .4, l * 2, .8); g.fillRect(x - .4, y - l, .8, l * 2); } }; /* a fleck, and a cross of light on the brightest */
    const gx0 = pr ? 0 : clamp(bx - W * .3, 0, W * .4), gw = pr ? W : Math.min(W - gx0, W * .6);
    for (let c = 0; c < 4; c++) {
      g.fillStyle = pl.glit[c];
      if (on) for (const p of S.glit) { if (p.c !== c) continue; const age = T - lerp(bt.glitter[0], bt.glitter[1], p.t); if (age < 0) continue; const y = -8 + age * p.v * H; if (y > H + 8) continue; const x = gx0 + p.x * gw + Math.sin(age * p.fw + p.ph) * 12;
        spark(p, x, y, I * fleck(p, y, x)); }
      if (F >= 0) for (const p of S.storm) { if (p.c !== c) continue; const age = F * 3.4 - p.t * 1.6; if (age < 0) continue; const y = -8 + age * p.v * H; if (y > H + 8) continue; const x = p.x * W + Math.sin(age * p.fw + p.ph) * 14;
        spark(p, x, y, fleck(p, y, x)); }
    }
    if (lz) laserDots(lz, T, I, bx, by, cs, sn);
    if (hz) { g.globalCompositeOperation = "lighter"; heartAt(hz, T, I, bx, by, br); }
    g.globalCompositeOperation = "source-over";
    // (a dealt pass's balloons falling behind the ball, and the rare second ball, lit as the first is — or, under the
    // pin spot, white)
    const tl = pinK > .004 ? [lit[0] * (1 - .8 * pinK), lit[1] * (1 - .8 * pinK), lit[2] + 1.3 * pinK] : lit, fill = fm > 0 ? pl.fillAt(fm) : FILL, gl1 = fm > .5 ? pl.glint : 1;
    if (pl.drop) dropAt(pl.drop, T, I, false);
    if (pl.twin) twinAt(pl.twin, pl, T, I, A, bx, by, br, tl, w, fill, gl1);
    // the chain, from past the top of the page down to the ball's cap; the ball
    chain(bx, by, br, sw);
    ballAt(bx, by, br, S.th, w, tl, A, S.facets, S.fq, fill, gl1);
    // (in front of it: where a laser strikes it, the near balloons of a drop, a cannon's burst)
    if (lz) { const k = env(T, lz.t[2] + .3, lz.t[3], lz.t[4], lz.t[5], E.sine) * I; if (k > .004) { const sx = clamp(bx + lz.side * R * .3, 16, W - 16), dx = sx - bx, dy = H + 4 - by, dl = Math.hypot(dx, dy) || 1;
      g.globalCompositeOperation = "lighter"; put(S.lglow[lz.ci], bx + dx / dl * br * .9, by + dy / dl * br * .9, .5, .5, 0, 1.1, 1.1, k * S.shade(bx + dx / dl * br * .9, by + dy / dl * br * .9, 34)); g.globalCompositeOperation = "source-over"; } }
    if (pl.drop) dropAt(pl.drop, T, I, true);
    if (pl.cannon) cannonAt(pl.cannon, T, I, bx, by);
  };


  /* ---------------- the forever cycle: what each pass deals ---------------- */
  /** a pass of the party by day: pass 0 is the signature; the rest deal a headline from a bag (the popper, a clear balloon
   *  of confetti, …) or now and then the rare one, and around it the gust's side, the guest balloon and what becomes of
   *  it, and which of the top three slip free at the close */
  const HEADS_D = ["popper", "clear", "zip", "foil", "horns"];
  const HORNC = [["#F6C84C", "#D62E86"], ["#4FC3A1", "#FFFFFF"], ["#A98BE6", "#F6C84C"], ["#FF6FB5", "#FFFFFF"], ["#6CBCEB", "#F6C84C"]];
  const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const q = Math.floor(r() * (i + 1)); [a[i], a[q]] = [a[q], a[i]]; } return a; };
  const dealDay = P => {
    if (P <= 0) return { P, sig: true, b: B, head: "popper", guest: GUEST, gc: GUEST, gz: .95, clear: false, fate: "pop", ring: BAL[GUEST], gdir: 1, gk: 1, gside: 1, pflip: 1, popC: 0, pal: 0, cshape: 0, trio: TRIO };
    const r = K.deal(P, 21), head = rareAt(P, 86) ? "gift" : HEADS_D[K.bag(P, HEADS_D.length, 23)], sh = (r() - .5) * .6;
    const b = { gust: [.3 + r() * 1.1, 0], guest: [.8 + r() * .6, 0], popper: [NEVER, NEVER], pop: NEVER, sink: [NEVER, NEVER], tremble: [NEVER, NEVER], burst: NEVER, leave: NEVER, free: 10.2 + r() * .4, back: [0, 14.95] };
    b.gust[1] = b.gust[0] + 2 + r() * .5; b.guest[1] = b.guest[0] + 2.3 + r() * .5; b.back[0] = b.free + 1.6 + r() * .3;
    const pl = { P, sig: false, b, head, guest: -1, gc: 8, gz: .95, clear: false, fate: "none", ring: "#FFFFFF", gdir: r() < .5 ? 1 : -1, gk: .8 + r() * .45, gside: r() < .25 ? -1 : 1, pflip: 1, popC: 0, pal: K.bag(P, 3, 25), cshape: K.bag(P, 4, 26), trio: TRIO };
    pl.trio = shuffle([2, 0, 1], r).slice(0, [3, 1, 2][K.bag(P, 3, 24)]); // the ones that slip free at the close: the signature's three, or one or two of them
    const latex = () => { pl.guest = Math.floor(r() * BAL.length); pl.gc = pl.guest; pl.ring = BAL[pl.guest]; };
    const popAt = t => { b.tremble = [t - .55, t]; b.burst = t; pl.fate = "pop"; };
    if (head === "popper") { // the signature's, from either side, in another foil, loaded with other confetti; the guest pops or slips away
      b.popper = [3.4 + sh, 4.5 + sh]; b.pop = 4.75 + sh; b.sink = [5.9 + sh, 7.1 + sh]; pl.pflip = r() < .35 ? -1 : 1; pl.popC = K.bag(P, 4, 27);
      latex(); if (r() < .6) popAt(9.55 + sh * .4); else { pl.fate = "float"; b.leave = 9.1 + r() * .5; }
      if (pl.pal === 0 && pl.cshape === 0 && pl.popC === 0) pl.cshape = 1 + Math.floor(r() * 3); // (never the signature's own popper again)
    } else if (head === "clear") { // a clear balloon full of confetti comes up in the guest's place, trembles, and pops
      pl.clear = true; pl.guest = 0; pl.gc = 8; pl.gz = 1.06; pl.ring = "#FFFFFF"; popAt(5.6 + sh);
    } else if (head === "zip") { // the guest's knot gives: it zips off in loops, emptying, and drops
      latex(); pl.fate = "zip"; b.tremble = [4.25 + sh, 4.85 + sh]; b.leave = 4.85 + sh; pl.zt = 3.0 + r() * .6; pl.zip = zipPath(r, pl.zt);
    } else if (head === "foil") { // foil balloons come up to join the bouquet, turn on their ribbons, and at the close float away
      const kinds = shuffle([0, 1, 2], r), at = shuffle([[-.8, -.6], [.8, -.66], [.04, -1.16]], r), n = r() < .55 ? 3 : 2;
      pl.foils = kinds.slice(0, n).map((k, i) => { const t0 = .8 + i * .6 + r() * .3; return { kind: k, tone: Math.floor(r() * 4), z: 1.06 + r() * .14, du: at[i][0], dv: at[i][1], t0, t1: t0 + 2.3 + r() * .4, leave: 9.2 + i * .55 + r() * .3, tw: .5 + r() * .45, tf: .75 + r() * .5, ph: r() * TAU, dx: at[i][0] > .1 ? 1 : at[i][0] < -.1 ? -1 : (r() < .5 ? -1 : 1) }; });
      pl.trio = [];
    } else if (head === "horns") { // three party horns at the foot toot in turn, then together; the guest pops at the close
      latex(); popAt(9.7 + sh * .3); const cols = shuffle(HORNC.slice(), r), t0 = 4.0 + sh;
      const hy = shuffle([-.62, -.18, .26], r), s0 = r() < .5 ? 1 : -1;
      pl.horns = { t0, chord: 2.9, end: t0 + 4.4, list: [0, 1, 2].map(i => ({ d: i * .45, dy: hy[i] + (r() - .5) * .1, tilt: (r() - .5) * .3 - .08, sd: i % 2 ? -s0 : s0, cA: cols[i][0], cB: cols[i][1], ph: r() * TAU })) }; for (const h of pl.horns.list) h.keys = tootsOf(pl.horns, h);
    } else if (head === "gift") { // the rare one: a gift box comes up, its lid flies off and balloons float out of it
      const side = r() < .5 ? -1 : 1, t0 = 2.5 + sh;
      pl.gift = { t0, pop: t0 + 2.1, sink: t0 + 6.2, side, lv: side, cw: Math.floor(r() * 3), pal: pl.pal, shape: pl.cshape, bl: Array.from({ length: 6 }, (_, i) => ({ d: .08 + i * .2 + r() * .08, c: Math.floor(r() * BAL.length), z: .55 + r() * .22, dx: (r() - .5) * 1.1, drift: (i % 2 ? 1 : -1) * (.25 + r() * .45), ph: r() * TAU })) };
      pl.trio = pl.trio.slice(0, 1);
    }
    return pl;
  };
  /** a pass of the disco: pass 0 is the signature; the rest deal the spots' shape (round, hearts, stars, sparkles) and
   *  the second light's colour from bags, the beams' dance, and a headline from a bag, now and then the rare one */
  const HEADS_N = ["spin", "lasers", "cannon", "drop", "pin"];
  const nightSig = { P: 0, sig: true, b: B, head: "spin", depth: 1, spin: 1, bk: 1, bspr: [0, 1, 2], glit: GLIT, glint: 1, shape: 0, col: 1, flip: null, spotK: 1, shapeK: 1 };
  const dealNight = P => {
    if (P <= 0) return { ...nightSig, P };
    const r = K.deal(P, 31), rare = rareAt(P, 45) ? (K.deal(P, 37)() < .5 ? "twin" : "heart") : null;
    let head = rare || HEADS_N[K.bag(P, HEADS_N.length, 32)], hue = K.bag(P, HUES.length, 33), shape = K.bag(P, 4, 34);
    if (head === "pin") { hue = 3; shape = 3; } // under the pin spot's white light: silver sparkles
    if (head === "heart") shape = 1;
    const j = (r() - .5) * .5, s = (r() - .5) * .6, { pr } = S;
    const b = { lower: [1.0 + j, 2.9 + j], beams: [2.2 + j, 3.0 + j], sweep: 3.0, aim: [NEVER, NEVER, NEVER, NEVER], spin: [NEVER, NEVER, NEVER, NEVER], glitter: [NEVER, NEVER], dim: [10.8 + j * .4, 11.9 + j * .4], raise: [12.2 + j * .3, 14.5] };
    const h = HUES[hue], pl = { P, sig: false, b, head, depth: .75 + r() * .5, spin: 1, bk: 1, bspr: [0, hue ? S.nb + hue - 1 : 1, 2], glit: [h.glit, GLIT[1], GLIT[2], GLIT[3]], glint: hue ? 2 + hue : 1,
      shape, col: 1 + hue, flip: shape || hue ? [.25 + r() * .3, 1.6 + r() * .3, 12.4 + r() * .3, 14.1 + r() * .2] : null, fdir: r() < .5 ? 1 : -1, spotK: 1, shapeK: shape ? 1.15 : 1, shapeZ: shape ? 1.18 : 1,
      choreo: K.bag(P, 4, 35), cph: r() * TAU, cf: .8 + r() * .5 };
    const warm = FILL.slice(0, 8), tiles = h.tiles.map(rgb), gold = FILL.slice(8, 11).map(rgb), rest = FILL.slice(11);
    pl.fillAt = m => { const k = clamp(m * 1.6 - .3); return k <= 0 ? FILL : [...warm, ...gold.map((c, i) => css(mixc(c, tiles[i], k))), ...rest]; };
    const spinShow = () => { b.aim = [5.5 + s, 6.4 + s, 9.2 + s, 10.3 + s]; b.spin = [5.8 + s, 7.2 + s, 8.9 + s, 10.6 + s]; b.glitter = [6.2 + s, 9.0 + s]; };
    if (head === "spin") spinShow();
    else if (head === "lasers") { // the beams step back as the fan closes on the ball, and it turns faster while it throws the points
      const t0 = 3.3 + s * .5, ci = r() < .45 ? 0 : 1 + hue, col = LASER[ci];
      pl.laser = { t: [t0, 0, 6.9 + s, 7.6 + s, 9.8 + s, 10.5 + s], n: pr ? 7 : 9, stag: .09 + r() * .05, side: r() < .5 ? -1 : 1, ph: r() * TAU, ci, col, core: hex(tint(rgb(col), .6)) };
      pl.bk = .6; b.dim = [6.5 + s, 7.5 + s]; b.spin = [7.3 + s, 8.0 + s, 9.6 + s, 10.5 + s]; pl.spin = .6;
    } else if (head === "cannon") {
      const c0 = 4.2 + s; pl.cannon = { b: { popper: [c0, c0 + 1.05], pop: c0 + 1.3, sink: [c0 + 2.5, c0 + 3.7] }, side: r() < .5 ? -1 : 1, shape: [0, 2, 1, 3][shape] };
      b.spin = [c0 + 1.2, c0 + 1.9, c0 + 4.2, c0 + 5.4]; pl.spin = .55;
    } else if (head === "drop") {
      const nd = pr ? 9 : 14; pl.drop = Array.from({ length: nd }, (_, i) => { const z = r(); return { x: (i + .2 + r() * .6) / nd, z, t0: 3.3 + r() * 2.3, c: Math.floor(r() * 5), s: .62 + z * .58, v: .15 + z * .07 + r() * .03, sf: .6 + r() * .6, sw: 10 + r() * 22, rf: .5 + r() * .7, r0: (r() - .5) * .3, bf: 1 + r(), ph: r() * TAU }; });
      b.spin = [4.0, 6.0, 10.0, 11.5]; pl.spin = .3;
    } else if (head === "pin") {
      pl.pin = [2.1 + j, 3.4 + j, 10.3 + j * .4, 11.8 + j * .4]; pl.bk = 0; pl.flip = [2.5 + j, 3.9 + j, 11.4 + j * .4, 13.2]; pl.depth = .6 + r() * .3;
    } else if (head === "twin") {
      spinShow(); pl.twin = { t: [2.6 + j, 4.6 + j, 11.3 + j * .3, 13.4], side: S.cx > S.W / 2 ? -1 : 1, dy: (r() - .5) * 1.1 };
    } else if (head === "heart") {
      const t0 = 4.4 + s; pl.heart = { t: [t0, t0 + 1.0, t0 + 4.2, t0 + 6.0], n: pr ? 26 : 32, col: 1 + hue }; pl.bk = .55; b.spin = [t0 + 3.8, t0 + 4.4, t0 + 5.2, t0 + 6.2]; pl.spin = .4;
    }
    return pl;
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
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      if (!plan || plan.P !== P) plan = night ? dealNight(P) : dealDay(P);
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
