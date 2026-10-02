// scene-heart.js — 1.12 b334: Pink's scene (scenes.js loads it). A candy heart as a neon sign on a brick wall, an arrow
// through it, sparkles round it, its glow on the bricks; it keeps to the largest open space on the page (scenes.js,
// `words`). The loop, fifteen seconds: the power cuts; the tubes relight a stretch at a time, stuttering; the arrow's
// chase lights run through it; it beats; small neon hearts float up; its colour cycles. The finale: neon hearts burst
// round it like fireworks. (1.12 b353: Blush, its day, has soap bubbles now, scene-bubbles.js; the gummy heart that was
// Blush's is gone from here.)
// 1.12 b369: the forever cycle. The loop above is pass 0. In each pass after it the heart stays lit all through, and the
// arrow blinks out and hands over to a neon of the pass's own, one of seven, lit where it was a stretch at a time and put
// out again before the arrow comes back: a crown set on the heart at an angle, its gems lit one by one; flames, in three
// frames that take turns as a sign's do; a heartbeat's trace running across it, the heart beating as the spike goes
// through; lips that pucker and blow a small heart away; marquee bulbs chasing round it; hearts inside the heart, lit
// from the outside in; a crescent moon, stars pricking out and one shooting across. Every run of seven such passes shows
// all seven. A pass is dealt a tint for the heart through its middle, a beat, small hearts, a flicker of its own. Two
// rare ones take a pass's place about once in eight passes each: a stretch of the tube fails in a shower of sparks and
// catches again, or a moth comes in off the edge to the light, knocks against it twice and goes. Every pass starts and
// ends on the lit heart and its arrow; nothing carries.
// 1.12 b414: the egg. Every twelfth pass left alone (three minutes of the list untouched), the sign shows where its arrow
// came from. The arrow goes out, leaving its empty glass; Cupid flies in off the nearer edge — a neon sign of his own, his
// wings in three frames that take turns as an animated sign's do, the unlit frames' glass dark on the bricks — settles
// behind the arrow's tail, draws his bow a notch at a time and looses: his arrow streaks in and runs along the empty
// glass, lighting the sign's arrow behind it as it goes, and flares at the head. The heart beats twice for it, small
// hearts rise, and he hops, blows it a kiss and flies off the way he came. Where the words leave no room behind the tail
// he shoots from the nearest place round it that is clear (overhead, if it's below), and his arrow curves in; he fades
// where he passes a word, as the moth does.
// 1.12 b426: the long day's hour eggs. Left up for hours, the sign shows two more of its own, one in an hour, taking turns
// (scenes.js, `K.long`). The first is a neon cat. Its glass shows on the arrow's shaft by the feathers and it lights a
// part at a time, asleep, and opens its eyes; a butterfly comes in and settles on the arrow's head; the cat gets up and
// goes up the arrow after it, crouches, wiggles and swipes — and the butterfly is off, and the cat slides all the way
// back down the arrow, scrabbling, into the feathers, and sees stars. The butterfly comes down and sits on its head a
// moment and goes; the cat curls up to sleep again, and its sign goes out a part at a time and its glass leaves the wall.
// The second is an aquarium. Bubbles come up and kelp grows round the heart; a school of little fish swims in and once
// round it; a jellyfish pulses up past it; a pufferfish comes and noses at the tube — and the heart beats: the puffer
// blows up into a ball of spines and the school scatters and comes back together. The puffer goes down with a puff of
// bubbles and swims off, the school leaves, the kelp goes out from its tips and the last bubbles pop. Whatever lights
// catches once and comes on, never flashing, and fades where it passes a word, as the moth does.
export default function heart(K) {
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  // the heart: a closed outline sampled from four curves, in units where it's about a unit wide
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };
  const CURVES = [[[0, .36], [-.56, .02], [-.56, -.44], [-.26, -.44]], [[-.26, -.44], [-.1, -.44], [0, -.33], [0, -.22]], [[0, -.22], [0, -.33], [.1, -.44], [.26, -.44]], [[.26, -.44], [.56, -.44], [.56, .02], [0, .36]]];
  const HEART = []; CURVES.forEach((c, k) => { for (let i = k ? 1 : 0; i <= 30; i++) HEART.push(bez(c[0], c[1], c[2], c[3], i / 30)); });
  const HL = [0]; for (let i = 1; i < HEART.length; i++) HL.push(HL[i - 1] + Math.hypot(HEART[i][0] - HEART[i - 1][0], HEART[i][1] - HEART[i - 1][1]));
  const inHeart = (u, v) => { // even-odd test against the outline
    let c = false; for (let i = 0, j = HEART.length - 1; i < HEART.length; j = i++) { const [xi, yi] = HEART[i], [xj, yj] = HEART[j]; if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi) + xi) c = !c; } return c; };
  // 1.12 b369: the forever cycle. The pass's own neon, one of seven, lit where the arrow was and put out again before it
  // comes back; the sparkles each would crowd go out with the arrow
  const HEADS = ["crown", "flames", "trace", "lips", "marquee", "nested", "moon"], QUIET = { crown: [0, 4], flames: [0, 1, 4], trace: [2, 3], lips: [], marquee: [0, 1, 2, 3, 4], nested: [], moon: [1] };
  /** the marquee's thirty bulbs, spaced evenly round the heart's outline a fifth outside it */
  const MQ = Array.from({ length: 30 }, (_, j) => { const d = j / 30 * HL[HL.length - 1]; let i = 1; while (i < HL.length - 1 && HL[i] < d) i++; const f = (d - HL[i - 1]) / ((HL[i] - HL[i - 1]) || 1), u = lerp(HEART[i - 1][0], HEART[i][0], f), v = lerp(HEART[i - 1][1], HEART[i][1], f); return [u * 1.2, (v + .04) * 1.2 - .04]; });
  /** a heartbeat's trace, across the heart (units of R about its middle), and how far along it the spike stands */
  const TRACE = [[-1, 0], [-.42, 0], [-.34, -.07], [-.26, 0], [-.12, 0], [-.07, .1], [.02, -.5], [.1, .27], [.17, 0], [.3, 0], [.4, -.1], [.5, 0], [1, 0]].map(([x, y]) => [x * .95, .07 + y * .9]);
  const SPIKE = (() => { let L = 0, at = 0; for (let i = 1; i < TRACE.length; i++) { L += Math.hypot(TRACE[i][0] - TRACE[i - 1][0], TRACE[i][1] - TRACE[i - 1][1]); if (i === 6) at = L; } return at / L; })();
  /** pass `P`'s plan (pass 0 is the signature): its neon, or one of the rare two in its place; when the arrow goes out and
   *  comes back; a tint for the heart through the middle of the pass, a beat, small hearts, a flicker of its own */
  const dealPass = P => {
    const rareAt = p => K.bag(p, 4, 13) === 2; // a rare pass: one in every four, never two running, the rare two taking turns
    let q = P, n = 0; for (let p = 1; p < P; p++) if (rareAt(p)) { q--; n++; } // the neon is dealt over the passes that have one, so each run of seven shows all seven
    const rare = rareAt(P) ? ((n + (K.deal(0, 77)() < .5 ? 1 : 0)) % 2 ? "moth" : "spark") : null;
    const r = K.deal(P, 31), head = rare ? null : HEADS[K.bag(q, HEADS.length, 7)];
    const off = 1 + r() * .5, back = 11.8 + r() * .5, tint = r() < .45 ? 0 : (r() < .5 ? -1 : 1) * (18 + r() * 20), beat = r() < .6 ? 3.2 + r() * 6 : -1;
    const float = (head === "trace" || head === "marquee" || head === "nested" || rare === "spark") && r() < .6 ? 5 + r() * 3 : -1, flick = r() < .5 ? 2.5 + r() * 8 : -1;
    const sparks = Array.from({ length: 20 }, () => ({ a: -Math.PI / 2 + (r() - .5) * 2.6, v: .45 + r() * .9, t: r() * .3, l: .45 + r() * .5, e: r() < .5 ? 0 : 1 }));
    const moth = { y0: (r() - .5) * .5, turns: 2 + r() * .8, th0: r() * TAU, dir: r() < .5 ? 1 : -1, y1: -1.2 - r() * .4 };
    const mir = r() < .5 ? -1 : 1; // the crown and the moon on the other side, the nested hearts lit the other way, the bulbs chasing the other way
    return { P, head, rare, off, back, tint, beat, float, flick, sparks, moth, mir };
  };
  // 1.12 b414: the egg's beats: the arrow out, Cupid in, the bow drawn, loosed, the arrow's flight, the kiss, Cupid away
  const EGG = { out: 1.1, in0: 1.6, in1: 3.9, loose: 5.6, fly: .5, kiss: 7.7, off0: 8.9, off1: 10.9 };
  // 1.12 b426: the long day's hour eggs. Their drawing kit: a smooth line through points (Catmull-Rom; closed, a loop), a
  // two-bone reach (where the joint sits for a paw to land where it's put), and the cat's poses in its own units — its body
  // one long, facing forward, y down, the ground its paws stand on at 0 — hip and shoulder, its four paws (near and far,
  // front and hind), its back's arch and belly's hang, its head's nod and tilt, its tail (an angle, then each bend), its
  // ears (pricked 1), its eye (open 1, a happy shut curve 0), a bend in the front legs' elbows (`elb`) and the hind feet's
  // hocks (`hockA`)
  const CR = (P0, n, closed) => { const out = [], m = P0.length, at = i => closed ? P0[(i + m) % m] : P0[Math.max(0, Math.min(m - 1, i))]; for (let i = 0; i < (closed ? m : m - 1); i++) { const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2); for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } } out.push(closed ? out[0] : P0[m - 1]); return out; };
  const IK = (a, t, l1, l2, bend) => { const dx = t[0] - a[0], dy = t[1] - a[1], d = Math.min(l1 + l2 - 1e-4, Math.max(1e-4, Math.hypot(dx, dy))), an = Math.atan2(dy, dx), k = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)); return [a[0] + Math.cos(an + bend * k) * l1, a[1] + Math.sin(an + bend * k) * l1]; };
  const VA = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k], VR = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const CATP = {
    loaf: { hip: [0, -.36], sh: [1, -.38], arch: .1, nod: -.15, tilt: 0, fn: [1.36, 0], ff: [1.28, -.02], elb: 1, hn: [.12, -.02], hf: [0, 0], hockA: -1.2, tail: [3.05, -.15, -.12, -.1], eye: 0, ears: .85, belly: -.4 },
    alert: { hip: [0, -.36], sh: [1, -.4], arch: .1, nod: -.38, tilt: -.1, fn: [1.36, 0], ff: [1.28, -.02], elb: 1, hn: [.12, -.02], hf: [0, 0], hockA: -1.2, tail: [3.0, -.2, -.4, -.5], eye: 1, ears: 1.1, belly: -.4 },
    stand: { hip: [0, -.62], sh: [1, -.66], arch: 0, nod: 0, tilt: 0, fn: [.98, 0], ff: [.84, 0], elb: 1, hn: [.06, 0], hf: [-.08, 0], hockA: 0, tail: [-2.3, .45, .55, .65], eye: 1, ears: 1, belly: 0 },
    prowl: { hip: [0, -.5], sh: [1.02, -.46], arch: .2, nod: .55, tilt: 0, fn: [1.08, 0], ff: [.9, -.02], elb: 1, hn: [.02, 0], hf: [.12, -.04], hockA: 0, tail: [-2.95, .15, -.2, -.25], eye: 1, ears: .7, belly: 0 },
    crouch: { hip: [0, -.46], sh: [1, -.26], arch: -.25, nod: .6, tilt: .15, fn: [1.25, 0], ff: [1.14, 0], elb: 1, hn: [.2, 0], hf: [.1, 0], hockA: -.4, tail: [-3.0, -.12, .15, .25], eye: 1, ears: .4, belly: .3 },
    swipe: { hip: [0, -.5], sh: [.98, -.62], arch: -.1, nod: -.35, tilt: -.15, fn: [1.38, -.95], ff: [1.14, 0], elb: -1, hn: [.2, 0], hf: [.08, 0], hockA: 0, tail: [-2.6, .3, .3, .4], eye: 1, ears: 1, belly: 0 },
    slide: { hip: [0, -.3], sh: [1, -.24], arch: .15, nod: .2, tilt: .35, fn: [1.42, -.02], ff: [1.3, -.12], elb: 1, hn: [-.48, -.06], hf: [-.36, -.18], hockA: -1.0, tail: [-2.2, .8, .7, .6], eye: 1, ears: .1, belly: -.2 },
  };
  // the cat's film: its glass comes up and it lights a part at a time, asleep; wakes; gets up and goes up the arrow after
  // a butterfly on its head; crouches and wiggles; swipes; slides all the way back down and bumps into the feathers; sees
  // stars; the butterfly settles on its head and leaves; and it goes back to sleep and its sign goes off, part by part
  const CATK = [[0, "loaf"], [2.45, "loaf"], [2.8, "alert"], [3.3, "alert"], [3.75, "stand"], [5.35, "stand"], [5.9, "prowl"], [6.1, "crouch"], [6.9, "crouch"], [7.08, "swipe"], [7.45, "swipe"], [7.62, "slide"], [8.75, "slide"], [9.3, "alert"], [10.95, "alert"], [11.4, "loaf"]];
  const CATB = { glass: .9, on: 1.45, eyes: 2.32, walk0: 3.75, walk1: 5.95, swipe: 6.95, flee: 7.04, slide0: 7.55, bonk: 8.72, land: 10.1, leave: 10.9, off: 11.9, gone: 12.75 };
  // the second, the aquarium: bubbles rise and kelp grows round the heart; a school of fish swims once round it; a
  // jellyfish pulses up past it; a pufferfish comes to nose at the tube — the heart beats, the puffer blows up into a
  // ball of spines and the school scatters, and comes back together; the puffer goes down again and swims off, the school
  // leaves, the kelp goes out from its tips, the last bubbles pop
  const SEA = { bub0: .8, bub1: 10.3, kelp0: 1.0, kelp1: 11.2, school0: 2.0, school1: 11.0, jelly0: 2.9, jelly1: 12.1, puff0: 4.7, nose: 6.0, beat: 6.62, deflate: 8.7, puff1: 10.9 };
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .72, list: .4, // the wall is behind the words and the lines sit on pads
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(29);
      Object.assign(S, { W, H, pr, Rmin: pr ? 34 : 40, Rmax: pr ? 150 : 240 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .32, 120) : Math.min(W * .15, H * .3); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .76 : H * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: pr ? H * .76 : H * .5, tR: R0 }); }
      // the draws the day's heart once took from this sequence (1.12 b353) are still taken, so the sign's bubbles and fire
      // fall where they always have: its seven sweets, its sprinkles (each placed inside the heart), its small hearts
      for (let i = 0; i < 28; i++) r();
      for (let i = 0; i < (pr ? 54 : 72); i++) { let u, v; do { u = (r() - .5) * 1.1; v = -.46 + r() * .82; } while (!inHeart(u, v)); for (let k = 0; k < 6; k++) r(); }
      for (let i = 0; i < 132; i++) r();
      S.bubbles = Array.from({ length: 7 }, (_, i) => ({ x: (r() - .5) * .9, t0: 7.6 + i * .4 + r() * .2, s: .09 + r() * .07, sway: r() * TAU }));
      S.sparks = [[-.62, -.58, .09], [.66, -.62, .07], [.72, .2, .06], [-.7, .12, .065], [.08, -.78, .05]];
      S.bulb = K.paint(33, 33, (x, y) => { const d = Math.hypot(x - 16, y - 16) / 16.5; if (d >= 1) return null; const core = clamp((.3 - d) / .12); return [255, Math.round(lerp(200, 250, core)), Math.round(lerp(140, 235, core)), Math.round(255 * clamp(Math.pow(1 - d, 2.4) * .8 + core))]; }); /* a marquee's bulb, a hot core in a warm glow (1.12 b369) */
      S.fire = [0, 1, 2].map(k => ({ a: -Math.PI / 2 + (k - 1) * 1.1, t: k * .16, parts: Array.from({ length: 12 }, () => ({ a: r() * TAU, v: .7 + r() * .3 })) }));
      // the backdrop
      // a brick wall, dark plum, a little uneven, lit by nothing but the sign
      bg.fillStyle = "#1E0714"; bg.fillRect(0, 0, W, H);
      const bw2 = pr ? 34 : 46, bh2 = bw2 * .42, rr2 = rng(5);
      for (let row = 0, y = 0; y < H; row++, y += bh2) for (let x = -(row % 2) * bw2 / 2; x < W; x += bw2) { const k = rr2(); bg.fillStyle = `rgb(${46 + k * 16 | 0},${14 + k * 6 | 0},${32 + k * 10 | 0})`; bg.beginPath(); bg.roundRect(x + 1.5, y + 1.5, bw2 - 3, bh2 - 3, 2); bg.fill(); bg.fillStyle = "rgba(255,255,255,.035)"; bg.fillRect(x + 2, y + 2, bw2 - 4, 1.2); }
      const vg = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, "rgba(10,2,8,.35)"); vg.addColorStop(1, "rgba(10,2,8,.8)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      S.built = 0; if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the largest circle of open page; the heart settles there, as big as it allows */
    words(rects) {
      S.raw = rects; if (!S.W) return;
      const { W, H, pr } = S, gap = pr ? 14 : 26, top = pr ? 96 : 122, foot = H - (pr ? 104 : 128);
      let best = 0, bx = S.tx, by = S.ty;
      for (let gy2 = 0; gy2 <= 24; gy2++) for (let gx2 = 0; gx2 <= 32; gx2++) {
        const x = W * (.04 + .92 * gx2 / 32), y = top + (foot - top) * gy2 / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y);
        for (const [x0, y0, x1, y1] of rects) { rad = Math.min(rad, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1)) - gap); if (rad <= best) break; }
        if (rad > best) { best = rad; bx = x; by = y; }
      }
      Object.assign(S, { tx: bx, ty: by, tR: clamp(best, S.Rmin, S.Rmax), room: best >= S.Rmin ? 1 : 0 });
      if (!S.placed) { Object.assign(S, { cx: S.tx, cy: S.ty, R: S.tR }); S.placed = true; }
    },
    /** where it has settled, for the suite */
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    // ---- by night: the neon sign
    /** a tube along points, lit by lv (0 dark glass … 1 full), in hue h; `upto` draws only that much of it lit */
    tube(pts, lv, h, w, upto = 1, chase = null, from = 0, glass = 1) {
      const path = (a0, a1) => { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const tot = L[L.length - 1], s0 = a0 * tot, s1 = a1 * tot; g.beginPath(); let st = false; for (let i = 1; i < pts.length; i++) { if (L[i] < s0 || L[i - 1] > s1) continue; const f0 = clamp((s0 - L[i - 1]) / ((L[i] - L[i - 1]) || 1)), f1 = clamp((s1 - L[i - 1]) / ((L[i] - L[i - 1]) || 1)); if (!st) { g.moveTo(lerp(pts[i - 1][0], pts[i][0], f0), lerp(pts[i - 1][1], pts[i][1], f0)); st = true; } g.lineTo(lerp(pts[i - 1][0], pts[i][0], f1), lerp(pts[i - 1][1], pts[i][1], f1)); } };
      // the glass, always there
      g.globalCompositeOperation = "source-over"; if (glass > 0) { g.strokeStyle = glass === 1 ? "rgba(70,30,52,.95)" : `rgba(70,30,52,${(.95 * glass).toFixed(3)})`; g.lineWidth = w * 1.25; path(0, 1); g.stroke(); g.strokeStyle = glass === 1 ? "rgba(255,255,255,.08)" : `rgba(255,255,255,${(.08 * glass).toFixed(3)})`; g.lineWidth = w * .3; path(0, 1); g.stroke(); }
      if (lv <= .01 || upto <= from) return;
      g.globalCompositeOperation = "lighter";
      for (const [k, a] of [[7, .06], [3.6, .12], [1.9, .3]]) { g.strokeStyle = hsl(h, 100, 62, a * lv); g.lineWidth = w * k; path(from, upto); g.stroke(); }
      g.strokeStyle = hsl(h, 100, 66, .95 * lv); g.lineWidth = w; path(from, upto); g.stroke();
      g.strokeStyle = hsl(h, 100, 92, .9 * lv); g.lineWidth = w * .35; path(from, upto); g.stroke();
      if (chase !== null) for (const d of [0, .33, .66]) { const c0 = (chase + d) % 1; g.strokeStyle = hsl(h, 100, 96, .95 * lv); g.lineWidth = w * .9; path(c0, Math.min(1, c0 + .07)); g.stroke(); }
      g.globalCompositeOperation = "source-over";
    },
    neon(T, I, A, F) {
      const { cx, cy, R } = S, on = I > .01, s = R * 1.5;
      const buzz = t => (Math.sin(t * 67) > .96 ? .55 : 1) * (Math.sin(t * 13.3) > .985 ? .3 : 1); // now and then it dips
      // the power cut and the relighting, a stretch at a time, stuttering
      const cut = on ? seg(T, .4, 1.3, x => x) * I : 0, dark = on && T > 1.3 && T < 1.7;
      const stutter = (t0, t1) => { if (!on) return 1; if (T < 1.3) return 1 - cut; const k = seg(T, t0, t1, x => x); return k <= 0 ? 0 : k >= 1 ? 1 : (Math.sin(T * 90 + t0 * 7) > .1 ? 1 : .15); };
      const heartUpto = on && T > 1.3 && T < 3.4 ? seg(T, 1.8, 3.2, E.io) : 1, heartLv = on && T > 1.3 ? (T < 1.8 ? 0 : stutter(1.8, 3.3)) * buzz(A) : (1 - cut) * buzz(A);
      const arrowLv = on && T > 1.3 ? stutter(3.4, 4.2) : (1 - cut), arrowUpto = on && T > 1.3 && T < 4.3 ? seg(T, 3.4, 4.2, E.io) : 1;
      const beat = on ? Math.max(env(T, 5.0, 5.08, 5.12, 5.3), env(T, 5.38, 5.46, 5.5, 5.75) * .7, env(T, 6.2, 6.28, 6.32, 6.5), env(T, 6.58, 6.66, 6.7, 6.95) * .7) * I : 0;
      const cycle = on ? env(T, 11.0, 11.6, 12.6, 13.2, E.io) * I : 0, hue = 330 + cycle * Math.sin((T - 11) * 2.4) * 60 + (F >= 0 ? Math.sin(F * 20) * 25 : 0);
      const pulse = 1 + beat * .07 + (F >= 0 ? env(F, 0, .05, .2, .5) * .06 : 0);
      // its glow on the bricks
      const glowA = (.28 * heartLv + .1 * arrowLv) * (1 + beat * .8) * (dark ? 0 : 1), gr = g.createRadialGradient(cx, cy, R * .2, cx, cy, R * 2.3);
      gr.addColorStop(0, hsl(hue, 100, 55, .5 * glowA)); gr.addColorStop(.5, hsl(hue, 100, 45, .18 * glowA)); gr.addColorStop(1, hsl(hue, 100, 40, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6); g.globalCompositeOperation = "source-over";
      // the heart, in its tube, beating
      const pts = HEART.map(([u, v]) => [cx + u * s * pulse, cy + v * s * pulse + R * .05]);
      const w = clamp(R * .045, 2.2, 7);
      S.tube(pts, heartLv, hue, w, heartUpto);
      // the arrow through it: a shaft with chase lights running along it, a head and a tail
      const a0 = [cx - R * .9, cy + R * .52], a1 = [cx + R * .86, cy - R * .6], shaft = Array.from({ length: 24 }, (_, i) => [lerp(a0[0], a1[0], i / 23), lerp(a0[1], a1[1], i / 23)]);
      const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), hd = R * .16, head = [[a1[0] - Math.cos(ang - .5) * hd, a1[1] - Math.sin(ang - .5) * hd], a1, [a1[0] - Math.cos(ang + .5) * hd, a1[1] - Math.sin(ang + .5) * hd]];
      const tail = [0, 1, 2].map(k => { const b0 = [lerp(a0[0], a1[0], .04 + k * .05), lerp(a0[1], a1[1], .04 + k * .05)]; return [[b0[0] - Math.cos(ang - 2.4) * hd * .8, b0[1] - Math.sin(ang - 2.4) * hd * .8], b0, [b0[0] - Math.cos(ang + 2.4) * hd * .8, b0[1] - Math.sin(ang + 2.4) * hd * .8]]; });
      const chase = on && T > 4.2 ? ((T - 4.2) * .9) % 1 : A * .25 % 1;
      S.tube(shaft, arrowLv * buzz(A + 3), 45, w * .8, arrowUpto, arrowLv > .5 ? chase : null); S.tube(head, arrowLv, 45, w * .8, arrowUpto >= 1 ? 1 : 0); tail.forEach(t2 => S.tube(t2, arrowLv, 45, w * .7, arrowUpto > .1 ? 1 : 0));
      // the sparkles, popping on one by one after the relight, twinkling
      S.sparks.forEach(([u, v, sz], i) => { const lv = on && T > 1.3 ? stutter(4.3 + i * .25, 4.6 + i * .25) : 1 - cut; if (lv <= .01) return; const k = .75 + .25 * Math.sin(A * 3 + i * 2), sx = cx + u * R, sy = cy + v * R, r2 = sz * R * k; const star = [[sx, sy - r2], [sx + r2 * .22, sy - r2 * .22], [sx + r2, sy], [sx + r2 * .22, sy + r2 * .22], [sx, sy + r2], [sx - r2 * .22, sy + r2 * .22], [sx - r2, sy], [sx - r2 * .22, sy - r2 * .22], [sx, sy - r2]]; S.tube(star, lv * (dark ? 0 : 1), 190 + i * 20, w * .5); });
      // small neon hearts floating up
      if (on) for (const b of S.bubbles) { const k = seg(T, b.t0, b.t0 + 2.4, x => x); if (k <= 0 || k >= 1) continue; const bx = cx + b.x * R + Math.sin(k * 5 + b.sway) * R * .08, by = cy - R * .2 - k * R * .95, sc = b.s * R * 1.1, lv = (1 - seg(k, .7, 1)) * I * (Math.sin(T * 40 + b.sway) > -.9 ? 1 : .3);
        S.tube(HEART.filter((_, i) => i % 3 === 0).map(([u, v]) => [bx + u * sc * 2, by + v * sc * 2]).concat([[bx, by + .36 * sc * 2]]), lv, hue + 20, w * .45); }
      // the finale: neon hearts bursting round it like fireworks
      if (F >= 0) for (const f of S.fire) { const k = clamp((F - f.t) / .7); if (k <= 0 || k >= 1) continue; const fx = cx + Math.cos(f.a) * R * .75, fy = cy + Math.sin(f.a) * R * .75;
        for (const p of f.parts) { const d = E.out(k) * R * .55 * p.v, hx = fx + Math.cos(p.a) * d, hy2 = fy + Math.sin(p.a) * d + k * k * R * .2, sc = R * .045 * (1 - k * .4); S.tube(HEART.filter((_, i) => i % 4 === 0).map(([u, v]) => [hx + u * sc * 2, hy2 + v * sc * 2]), (1 - k), (hue + p.a * 40) % 360, w * .35); } }
    },
    /** a dealt pass (1.12 b369): the heart stays lit all through; the arrow blinks out and hands over to the pass's own
     *  neon, which lights a stretch at a time, plays, and goes out before the arrow comes back — or, one pass in four, a
     *  rare one: a stretch of the tube failing in a shower of sparks and catching again, or a moth come to the light */
    neon2(T, I, A, F, pl) {
      const { cx, cy, R } = S, on = I > .01, s = R * 1.5, w = clamp(R * .045, 2.2, 7), at = (x, y) => [cx + x * R, cy + y * R];
      const buzz = t => (Math.sin(t * 67) > .96 ? .55 : 1) * (Math.sin(t * 13.3) > .985 ? .3 : 1); // now and then it dips
      // a tube switched on at t0 comes on with two slow blinks and a dip; one switched off dips, catches, and goes
      const lit = t0 => { const d = T - t0; return d < .12 ? 0 : d < .26 ? 1 : d < .55 ? 0 : d < .68 ? 1 : d < .82 ? .3 : 1; };
      const out = t0 => { const d = T - t0; return d < .12 ? 1 : d < .24 ? .15 : d < .42 ? .9 : 0; };
      const ring = (x, y, r, n = 10) => Array.from({ length: n + 1 }, (_, i) => [x + Math.cos(i / n * TAU) * r, y + Math.sin(i / n * TAU) * r]);
      const glow2 = (x, y, rad, h, a) => { if (a <= .005) return; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, hsl(h, 100, 55, .5 * a)); gr.addColorStop(1, hsl(h, 100, 45, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.globalCompositeOperation = "source-over"; };
      const hd = on ? pl.head : null, t0 = pl.off + .75, k = T - t0, H = hd ? I * lit(t0) * (T < pl.back - .8 ? 1 : out(pl.back - .8)) : 0; // the pass's neon, and how long since it was switched on
      const gA = hd ? I * clamp(Math.min(T - pl.off - .5, pl.back - .2 - T) / .3) : 0; // its glass, there only while it is
      const arrowLv = lerp(1, hd ? (T < pl.back ? out(pl.off) : lit(pl.back)) : 1, I), arrowUpto = hd && on && T > pl.back ? lerp(1, seg(T, pl.back, pl.back + .8, E.io), I) : 1;
      // the heart: lit all through, with the pass's own tint, beat and flicker
      const fl = on && pl.flick >= 0 ? 1 - I * .65 * env(T, pl.flick, pl.flick + .04, pl.flick + .14, pl.flick + .5) : 1;
      let beat = on && pl.beat >= 0 ? Math.max(env(T, pl.beat, pl.beat + .08, pl.beat + .12, pl.beat + .3), env(T, pl.beat + .38, pl.beat + .46, pl.beat + .5, pl.beat + .75) * .7) * I : 0;
      const per = 1.55, head = hd === "trace" && k > .5 ? ((k - .5) % per) / per * 1.4 : -1; // the heartbeat trace's head, sweeping across and off the end
      if (head >= 0) beat = Math.max(beat, H * Math.exp(-(((head - SPIKE) / .035) ** 2))); // the heart beats as the spike runs through it
      const hue = 330 + pl.tint * env(T, 2, 4, 10.5, 12.5, E.sine) * I + (F >= 0 ? Math.sin(F * 20) * 25 : 0);
      const pulse = 1 + beat * .07 + (F >= 0 ? env(F, 0, .05, .2, .5) * .06 : 0);
      // the spark: a stretch of the heart's tube fails, sputters, dies, and catches again
      const f0 = 4.2, f1 = 7.4, fail = on && pl.rare === "spark" ? lerp(1, T < f0 ? 1 : T < f1 ? (T - f0 < .1 ? .2 : T - f0 < .3 ? 1 : T - f0 < .45 ? .1 : T - f0 < .55 ? .6 : 0) : lit(f1), I) : 1;
      const heartLv = buzz(A) * fl;
      // its glow on the bricks
      const glowA = (.28 * heartLv * (.85 + .15 * fail) + .1 * arrowLv) * (1 + beat * .8), gr = g.createRadialGradient(cx, cy, R * .2, cx, cy, R * 2.3);
      gr.addColorStop(0, hsl(hue, 100, 55, .5 * glowA)); gr.addColorStop(.5, hsl(hue, 100, 45, .18 * glowA)); gr.addColorStop(1, hsl(hue, 100, 40, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6); g.globalCompositeOperation = "source-over";
      // the moth's shadow falls on the wall behind it, before anything is drawn over it
      const mo = on && pl.rare === "moth" ? S.mothAt(T, A, pl.moth) : null;
      if (mo) { const sx = mo.x + (mo.x - cx) * .22, sy = mo.y + (mo.y - cy) * .22 + R * .04; g.save(); g.globalAlpha = .42 * I * mo.a * S.vis; g.translate(sx, sy); g.rotate(mo.ang); g.scale(1.35, 1.35); S.mothShape(mo.flap, R, "#0c0207"); g.restore(); }
      // the heart, in its tube, beating
      const pts = HEART.map(([u, v]) => [cx + u * s * pulse, cy + v * s * pulse + R * .05]);
      if (fail < 1) { S.tube(pts, heartLv, hue, w, .55); S.tube(pts, heartLv * fail, hue, w, .68, null, .55, 0); S.tube(pts, heartLv, hue, w, 1, null, .68, 0); }
      else S.tube(pts, heartLv, hue, w, 1);
      // the arrow through it: out while the pass's neon is lit, back after, its chase lights running as they do at rest
      const a0 = [cx - R * .9, cy + R * .52], a1 = [cx + R * .86, cy - R * .6], shaft = Array.from({ length: 24 }, (_, i) => [lerp(a0[0], a1[0], i / 23), lerp(a0[1], a1[1], i / 23)]);
      const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), hdl = R * .16, ahead = [[a1[0] - Math.cos(ang - .5) * hdl, a1[1] - Math.sin(ang - .5) * hdl], a1, [a1[0] - Math.cos(ang + .5) * hdl, a1[1] - Math.sin(ang + .5) * hdl]];
      const tail = [0, 1, 2].map(q => { const b0 = [lerp(a0[0], a1[0], .04 + q * .05), lerp(a0[1], a1[1], .04 + q * .05)]; return [[b0[0] - Math.cos(ang - 2.4) * hdl * .8, b0[1] - Math.sin(ang - 2.4) * hdl * .8], b0, [b0[0] - Math.cos(ang + 2.4) * hdl * .8, b0[1] - Math.sin(ang + 2.4) * hdl * .8]]; });
      S.tube(shaft, arrowLv * buzz(A + 3), 45, w * .8, arrowUpto, arrowLv > .5 && arrowUpto >= 1 ? A * .25 % 1 : null); S.tube(ahead, arrowLv, 45, w * .8, arrowUpto >= 1 ? 1 : 0); tail.forEach(t2 => S.tube(t2, arrowLv, 45, w * .7, arrowUpto > .1 ? 1 : 0));
      // the sparkles: those the pass's neon would crowd go out with the arrow, and come back after it, one by one
      const quiet = !hd ? [] : pl.mir < 0 && hd === "crown" ? [1, 4] : pl.mir < 0 && hd === "moon" ? [0] : QUIET[hd];
      S.sparks.forEach(([u, v, sz], i) => { const lv = quiet.includes(i) ? lerp(1, T < pl.back ? out(pl.off + i * .1) : lit(pl.back + .5 + i * .15), I) : 1; if (lv <= .01) return; const kk = .75 + .25 * Math.sin(A * 3 + i * 2), sx = cx + u * R, sy = cy + v * R, r2 = sz * R * kk; S.tube([[sx, sy - r2], [sx + r2 * .22, sy - r2 * .22], [sx + r2, sy], [sx + r2 * .22, sy + r2 * .22], [sx, sy + r2], [sx - r2 * .22, sy + r2 * .22], [sx - r2, sy], [sx - r2 * .22, sy - r2 * .22], [sx, sy - r2]], lv, 190 + i * 20, w * .5); });
      // the pass's own neon
      if (hd && gA > 0) S.head(hd, k, H, gA, A, w, pl.mir, (x, y) => at(pl.mir * x, y), at, ring, glow2, head);
      // small neon hearts floating up
      if (on && pl.float >= 0) for (const b of S.bubbles) { const kk = seg(T, b.t0 - 7.6 + pl.float, b.t0 - 7.6 + pl.float + 2.4, x => x); if (kk <= 0 || kk >= 1) continue; const bx = cx + b.x * R + Math.sin(kk * 5 + b.sway) * R * .08, by = cy - R * .2 - kk * R * .95, sc = b.s * R * 1.1, lv = (1 - seg(kk, .7, 1)) * I * (Math.sin(T * 40 + b.sway) > -.9 ? 1 : .3);
        S.tube(HEART.filter((_, i) => i % 3 === 0).map(([u, v]) => [bx + u * sc * 2, by + v * sc * 2]).concat([[bx, by + .36 * sc * 2]]), lv, hue + 20, w * .45); }
      // the spark's shower: a pop where the stretch dies, sparks out of it falling and cooling, and a few more as it catches
      if (on && pl.rare === "spark" && T > f0 && T < f1 + 1.2) {
        const e0 = pts[Math.round(.55 * (pts.length - 1))], e1 = pts[Math.round(.68 * (pts.length - 1))], pop = env(T, f0 + .42, f0 + .46, f0 + .5, f0 + .7) * I;
        if (pop > .01) glow2(lerp(e0[0], e1[0], .5), lerp(e0[1], e1[1], .5) - R * .05, R * .45, 40, .7 * pop);
        g.globalCompositeOperation = "lighter"; g.lineCap = "round";
        for (const [tb, n0] of [[f0 + .08, 8], [f0 + .44, 20], [f1 + .1, 8]]) for (let j = 0; j < n0; j++) { const p = pl.sparks[j], d = T - tb - p.t * .4; if (d <= 0 || d >= p.l) continue; const o = p.e ? e1 : e0, pos = t => [o[0] + Math.cos(p.a) * p.v * R * 1.5 * t, o[1] + Math.sin(p.a) * p.v * R * 1.5 * t + 1.9 * R * t * t], q = pos(d), q0 = pos(Math.max(0, d - .07)), c = 1 - d / p.l;
          g.strokeStyle = hsl(32, 100, 60, .8 * c * I); g.lineWidth = clamp(R * .016, 1.2, 3); g.beginPath(); g.moveTo(q0[0], q0[1]); g.lineTo(q[0], q[1]); g.stroke();
          g.fillStyle = hsl(48, 100, 88, c * I); g.beginPath(); g.arc(q[0], q[1], clamp(R * .012, 1, 2.4) * (.6 + .4 * c), 0, TAU); g.fill(); }
        g.globalCompositeOperation = "source-over"; g.lineCap = "round";
      }
      // the moth itself, lit on its near side by the sign
      if (mo) { const near = clamp(1.6 - Math.hypot(mo.x - cx, mo.y - cy) / R); g.save(); g.globalAlpha = I * mo.a * S.vis; g.translate(mo.x, mo.y); g.rotate(mo.ang); S.mothShape(mo.flap, R, "#a88c92"); g.globalCompositeOperation = "lighter"; g.globalAlpha = (.18 + .3 * near) * I * mo.a * S.vis; S.mothShape(mo.flap, R, hsl(hue, 90, 62, 1)); g.globalAlpha = (.4 + .4 * near) * I * mo.a * S.vis; S.mothShape(mo.flap, R, null, hsl(hue, 100, 78, 1), Math.atan2(cy - mo.y, cx - mo.x) - mo.ang); g.restore(); }
      // the finale: neon hearts bursting round it like fireworks
      if (F >= 0) for (const f of S.fire) { const kk = clamp((F - f.t) / .7); if (kk <= 0 || kk >= 1) continue; const fx = cx + Math.cos(f.a) * R * .75, fy = cy + Math.sin(f.a) * R * .75;
        for (const p of f.parts) { const d = E.out(kk) * R * .55 * p.v, hx = fx + Math.cos(p.a) * d, hy2 = fy + Math.sin(p.a) * d + kk * kk * R * .2, sc = R * .045 * (1 - kk * .4); S.tube(HEART.filter((_, i) => i % 4 === 0).map(([u, v]) => [hx + u * sc * 2, hy2 + v * sc * 2]), (1 - kk), (hue + p.a * 40) % 360, w * .35); } }
    },
    /** the pass's own neon, `k` seconds after it was switched on, lit `H`, its glass `gA` */
    head(hd, k, H, gA, A, w, m, atm, at, ring, glow2, trace) {
      const { cx, cy, R } = S, s = R * 1.5;
      if (hd === "crown") { // a crown set on the heart at an angle, drawn round a stretch at a time, its gems lit one by one
        const c = Math.cos(-.16), sn = Math.sin(-.16), T2 = (x, y) => atm(-.1 + x * c - y * sn, -.6 + x * sn + y * c);
        glow2(...T2(0, -.18), R * .75, 45, .22 * H);
        S.tube([[-.26, 0], [-.3, -.32], [-.14, -.13], [0, -.38], [.14, -.13], [.3, -.32], [.26, 0], [-.26, 0]].map(p => T2(p[0], p[1])), H, 45, w * .8, seg(k, 0, 1.2, E.io), null, 0, gA);
        [[-.3, -.36], [0, -.42], [.3, -.36]].forEach(([x, y]) => { const b = T2(x, y); S.tube(ring(b[0], b[1], R * .028, 8), H * clamp((k - 1.15) / .1), 45, w * .5, 1, null, 0, gA); });
        [[-.13, -.06, 330], [0, -.07, 190], [.13, -.06, 130]].forEach(([x, y, h], i) => { const b = T2(x, y); S.tube(ring(b[0], b[1], R * .03, 8), H * clamp((k - 1.4 - i * .3) / .12) * (.72 + .28 * Math.sin(A * 3.3 + i * 2.1)), h, w * .5, 1, null, 0, gA); });
      } else if (hd === "flames") { // a flaming heart: three tongues and a yellow core, in three frames that take turns, as a sign's do
        const fr = Math.floor(Math.max(0, k) / .34) % 3, sw = [[-.05, .04, -.03, .02], [0, -.04, .04, -.02], [.05, 0, 0, 0]][fr], ht = [[1, .9, 1.05, .95], [.93, 1.06, .95, 1.05], [1.05, .98, .9, 1]][fr];
        const tongue = (bx, by, h, wd, sway) => { const L2 = [], R2 = []; for (let j = 0; j <= 8; j++) { const t = j / 8, hw = wd * Math.sin(Math.PI * Math.pow(t, .75)) * (1 - t * .3); L2.push(at(bx - hw + sway * t * t, by - h * t)); R2.push(at(bx + hw + sway * t * t, by - h * t)); } return L2.concat(R2.reverse()); };
        glow2(...at(0, -.66), R * .85, 26, .26 * H);
        S.tube(tongue(0, -.3, .66 * ht[0], .12, sw[0]), H, 16, w * .8, seg(k, 0, .9), null, 0, gA);
        S.tube(tongue(-.37, -.6, .3 * ht[1], .075, sw[1] - .05), H, 16, w * .7, seg(k, .2, 1.1), null, 0, gA);
        S.tube(tongue(.37, -.6, .3 * ht[2], .075, sw[2] + .05), H, 16, w * .7, seg(k, .2, 1.1), null, 0, gA);
        S.tube(tongue(0, -.36, .36 * ht[3], .055, sw[3]), H, 46, w * .6, seg(k, .5, 1.2), null, 0, gA);
      } else if (hd === "trace") { // a heartbeat's trace across it, the spike beating the heart as it runs through
        const TR = TRACE.map(([x, y]) => at(x, y));
        S.tube(TR, 0, 140, w * .6, 1, null, 0, gA);
        if (trace >= 0) for (const [a, b, m] of [[.4, .23, .22], [.23, .09, .5], [.09, 0, 1]]) S.tube(TR, H * m, 140, w * .6, clamp(trace - b), null, clamp(trace - a), 0);
        glow2(...at(clamp(trace, 0, 1) * 1.9 - .95, .07), R * .6, 140, .2 * H);
      } else if (hd === "lips") { // lips inside it that pucker twice and blow a small heart up and away
        const pk = [3.2, 6.6].some(t => k > t && k < t + .9), Lw = pk ? .15 : .27, up = pk ? .075 : .1, lo = pk ? .085 : .11;
        glow2(...at(0, -.02), R * .6, 350, .2 * H);
        S.tube([[-Lw, 0], [-Lw * .45, -up], [0, -up * .55], [Lw * .45, -up], [Lw, 0], [Lw * .45, lo], [0, lo * 1.1], [-Lw * .45, lo], [-Lw, 0]].map(([x, y]) => at(x, -.02 + y)), H, 352, w * .75, seg(k, 0, 1), null, 0, gA);
        S.tube([[-Lw * .9, 0], [0, pk ? 0 : .018], [Lw * .9, 0]].map(([x, y]) => at(x, -.02 + y)), H * (pk ? .5 : 1), 352, w * .5, seg(k, .5, 1.1), null, 0, gA);
        for (const t of [3.45, 6.85]) { const q = (k - t) / 1.9; if (q <= 0 || q >= 1) continue; const bx = cx + R * (.06 + q * .5), by = cy - R * (.06 + q * .78), sc = R * (.035 + q * .05); S.tube(HEART.filter((_, i) => i % 3 === 0).map(([u, v]) => [bx + u * sc * 2, by + v * sc * 2]).concat([[bx, by + .36 * sc * 2]]), H * (1 - q * q), 340, w * .45, 1, null, 0, 0); }
      } else if (hd === "marquee") { // bulbs round it chasing, then all on, then every other one in turn
        const step = m * Math.floor(Math.max(0, k) * 6.5) + 300, alt = Math.floor(Math.max(0, k) * 1.4), a0 = g.globalAlpha; g.globalCompositeOperation = "lighter";
        MQ.forEach(([u, v], j) => { const ph = k < 4.6 ? ((j + step) % 3 === 0 ? 1 : .14) : k < 5.8 ? 1 : ((j + alt) % 2 ? 1 : .14), bl = H * ph; if (bl <= .01) return; const bx = cx + u * s, by = cy + v * s + R * .05, br = R * .085; g.globalAlpha = a0 * bl; g.drawImage(S.bulb, bx - br, by - br, br * 2, br * 2); });
        g.globalAlpha = a0; g.globalCompositeOperation = "source-over";
      } else if (hd === "nested") { // hearts inside the heart, lit one after another from the outside in, and out from the inside
        [[.74, 312], [.5, 292], [.27, 268]].forEach(([sc, h], j0) => { const j = m > 0 ? j0 : 2 - j0, cyc = Math.max(0, k - .1) % 2.4, lv = cyc > j * .3 && cyc < 1.5 + (2 - j) * .2 ? 1 : 0; S.tube(HEART.filter((_, i) => i % 2 === 0).map(([u, v]) => [cx + u * s * sc, cy + (-.04 + (v + .04) * sc) * s + R * .05]).concat([[cx, cy + (-.04 + .4 * sc) * s + R * .05]]), H * lv, h, w * (.75 - j * .12), 1, null, 0, gA); });
      } else if (hd === "moon") { // a crescent moon, stars pricking out one by one, and one shooting across
        const mx = .62, my = -.74, mr = .19, cres = [];
        for (let j = 0; j <= 14; j++) { const a = Math.PI * (.55 + j / 14 * .9); cres.push(atm(mx + Math.cos(a) * mr, my + Math.sin(a) * mr)); }
        for (let j = 14; j >= 0; j--) { const a = Math.PI * (.62 + j / 14 * .76); cres.push(atm(mx + .075 + Math.cos(a) * mr * .8, my - .01 + Math.sin(a) * mr * .8)); }
        cres.push(cres[0]); glow2(...atm(mx, my), R * .55, 52, .2 * H);
        S.tube(cres, H, 52, w * .75, seg(k, 0, 1.1), null, 0, gA);
        [[-.52, -.86, .055], [-.2, -.97, .04], [.18, -.9, .05], [-.82, -.42, .045], [.9, -.22, .04]].forEach(([u, v, sz], i) => { const tw = H * clamp((k - .9 - i * .35) / .12) * (.6 + .4 * Math.sin(A * 2.2 + i * 1.7)), sx = cx + m * u * R, sy = cy + v * R, r2 = sz * R; S.tube([[sx, sy - r2], [sx + r2 * .22, sy - r2 * .22], [sx + r2, sy], [sx + r2 * .22, sy + r2 * .22], [sx, sy + r2], [sx - r2 * .22, sy + r2 * .22], [sx - r2, sy], [sx - r2 * .22, sy - r2 * .22], [sx, sy - r2]], tw, 55, w * .45, 1, null, 0, gA); });
        const sh = (k - 5.4) / .8; if (sh > 0 && sh < 1.35) S.tube([atm(-.78, -1.0), atm(-.4, -.93), atm(-.05, -.82)], H, 55, w * .5, clamp(sh), null, clamp(sh - .35), 0);
      }
    },
    /** where the moth is at loop time T: in off the edge, round and round the light (knocking against it twice), and off again */
    mothAt(T, A, m) {
      const { cx, cy, R, W } = S, q = (T - 3) / 8.5; if (q <= 0 || q >= 1) return null;
      const orbit = t => { const th = m.th0 + m.dir * t * m.turns * TAU, knock = Math.max(env(t, .3, .34, .36, .44), env(t, .62, .66, .68, .76)), rr = R * (.9 + .07 * Math.sin(th * 2.3 + 1) - .32 * knock); return [cx + Math.cos(th) * rr, cy - R * .05 + Math.sin(th) * rr * .82]; };
      const ein = [W + R * .3, cy + m.y0 * R], eout = [W + R * .3, cy + m.y1 * R];
      const pos = q => { if (q < .14) { const e = E.io(q / .14), o = orbit(0); return [lerp(ein[0], o[0], e), lerp(ein[1], o[1], e) + Math.sin(q * 40) * R * .03]; } if (q < .86) return orbit((q - .14) / .72); const e = E.io((q - .86) / .14), o = orbit(1); return [lerp(o[0], eout[0], e), lerp(o[1], eout[1], e)]; };
      const [x0, y0] = pos(q), [x1, y1] = pos(Math.min(1, q + .003)), x = x0 + Math.sin(A * 7.3) * R * .025, y = y0 + Math.sin(A * 9.1 + 1) * R * .03; // fluttering
      let d = 1e9; for (const [a0, b0, a1, b1] of S.raw || []) d = Math.min(d, Math.hypot(Math.max(a0 - x, 0, x - a1), Math.max(b0 - y, 0, y - b1))); // it fades as it passes a word
      return { x, y, ang: Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2 + Math.sin(A * 5.3) * .25, flap: Math.abs(Math.sin(A * 26)), a: clamp(Math.min(q, 1 - q) / .02) * lerp(.2, 1, clamp((d - R * .06) / (R * .2))) };
    },
    /** a moth, its wings `flap` open (0 … 1), in `fill`; or, with `rim`, just the edge the light catches, toward `lit` */
    mothShape(flap, R, fill, rim, litAng = 0) {
      const sz = R * .115, op = .35 + .65 * flap;
      const wing = (sx, a0, ln, wd) => { g.beginPath(); g.ellipse(sx * ln * .55 * op, 0, ln * .6 * op + sz * .08, wd, a0 * sx, 0, TAU); };
      if (fill) { g.fillStyle = fill; for (const sx of [-1, 1]) { g.save(); g.translate(0, -sz * .12); wing(sx, -.35, sz, sz * .42); g.fill(); g.restore(); g.save(); g.translate(0, sz * .18); wing(sx, .4, sz * .75, sz * .3); g.fill(); g.restore(); } g.beginPath(); g.ellipse(0, 0, sz * .12, sz * .42, 0, 0, TAU); g.fill(); return; }
      g.strokeStyle = rim; g.lineWidth = Math.max(1, sz * .06); const ca = Math.cos(litAng), sa = Math.sin(litAng); g.beginPath(); for (const sx of [-1, 1]) { if (sx * ca < -.2) continue; g.save(); g.translate(0, -sz * .12); wing(sx, -.35, sz, sz * .42); g.restore(); } g.stroke();
    },
    /** 1.12 b414: Cupid as a neon sign of his own, in his own units (his head a unit round, y down), at (x, y), `u` px a
     *  unit, facing `mir` (1 right, -1 left), leaning `tilt`, aiming along `aim` (screen radians) with the bow drawn `dr`
     *  (0 … 1) and an arrow on the string while `nock`; his wings at frame `wf` (0 up, 1 level, 2 down: the other two
     *  frames' glass stays dark on the wall, as an animated sign's does); his drawing hand `arm` (0 on the string, 1 at
     *  rest, 2 at his lips, 3 blowing the kiss); lit `lv`. Returns where the arrow's head is, for the shot. */
    cupid(c) {
      const { x, y, u, mir, tilt, lv, dr, wf } = c, w = clamp(S.R * .045, 2.2, 7), ct = Math.cos(tilt), st = Math.sin(tilt), gl = .5;
      const parts = [], tb = (pts, lv2, h, w2, glass) => parts.push([pts, lv2, h, w2, glass]); // his tubes, gathered and drawn by colour at the end
      const Q = ([lx, ly]) => { const rx = lx * ct - ly * st, ry = lx * st + ly * ct; return [x + mir * rx * u, y + ry * u]; };
      const ad = [mir * Math.cos(c.aim), Math.sin(c.aim)], d = [ad[0] * ct + ad[1] * st, -ad[0] * st + ad[1] * ct], p = [-d[1], d[0]]; // the aim in his own frame, and across it
      const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k], T2 = pts => pts.map(Q);
      const ring = (cx2, cy2, r, n = 16) => Array.from({ length: n + 1 }, (_, i) => [cx2 + Math.cos(i / n * TAU) * r, cy2 + Math.sin(i / n * TAU) * r]);
      const smooth = (P0, n = 6) => { const out = [], m = P0.length; for (let i = 0; i < m; i++) { const p0 = P0[(i - 1 + m) % m], p1 = P0[i], p2 = P0[(i + 1) % m], p3 = P0[(i + 2) % m]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } } out.push(out[0]); return out; };
      // his glow on the bricks, a warm one
      const [gx, gy] = Q([.2, -1.4]), gr = g.createRadialGradient(gx, gy, 0, gx, gy, u * 4.6); gr.addColorStop(0, hsl(28, 100, 60, .2 * lv)); gr.addColorStop(1, hsl(28, 100, 50, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(gx - u * 4.6, gy - u * 4.6, u * 9.2, u * 9.2); g.globalCompositeOperation = "source-over";
      // the wings, three frames (the far one a little behind the near), each frame's glass there whether it's lit or not
      const WING = [[0, 0], [-.8, -1.2], [-1.9, -2.1], [-2.55, -2.2], [-2.2, -1.55], [-2.5, -1.3], [-1.85, -.95], [-2.0, -.6], [-1.3, -.45], [-1.2, -.1], [-.5, -.05], [0, 0]];
      for (const [ox, oy, k, h, f] of [[.3, -.18, .82, 200, .7], [0, 0, 1, 192, 1]]) [-.8, -.15, .5].forEach((a, i) => { const ca = Math.cos(a), sa = Math.sin(a); tb(T2(WING.map(([wx, wy]) => [-.55 + ox + (wx * ca - wy * sa) * k, -1.55 + oy + (wx * sa + wy * ca) * k])), i === wf ? lv * f : 0, h, w * .55, gl * .8); });
      // the legs, the body, the head and its curls, a happy closed eye
      const cv = (P0, n = 5) => { const out = []; for (let i = 0; i < P0.length - 1; i++) { const p0 = P0[Math.max(0, i - 1)], p1 = P0[i], p2 = P0[i + 1], p3 = P0[Math.min(P0.length - 1, i + 2)]; for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } } out.push(P0[P0.length - 1]); return out; }; // a smooth stroke through points
      tb(T2(cv([[-.3, .05], [-.42, .62], [-.78, 1.02], [-1.28, 1.08], [-1.52, .9]])), lv, 22, w * .7, gl); // the far leg, trailing
      tb(T2(cv([[.55, -.12], [1.15, -.12], [1.58, .18], [1.45, .62], [1.12, .82], [1.42, .98]])), lv, 22, w * .7, gl); // the near one, its knee up
      tb(T2(smooth([[.2, -2.12], [.78, -1.85], [1.05, -1.0], [.86, -.18], [.22, .16], [-.48, .02], [-.8, -.7], [-.52, -1.72]])), lv, 22, w * .7, gl); // the body
      tb(T2(ring(.32, -3.15, 1.06, 18)), lv, 22, w * .7, gl); // the head
      for (const [hx, hy, r0] of [[.12, -4.28, .36], [-.58, -3.98, .32], [.78, -4.12, .28]]) tb(T2(Array.from({ length: 12 }, (_, i) => { const a = -Math.PI / 2 + i / 11 * TAU * 1.15, r = r0 * (1 - i / 16); return [hx + Math.cos(a) * r, hy + .1 + Math.sin(a) * r]; })), lv, 46, w * .55, gl); // his curls
      tb(T2([[.74, -3.32], [.9, -3.44], [1.06, -3.32]]), lv, 22, w * .45, 0); tb(T2(ring(1.0, -2.78, .2, 8)), lv * .8, 345, w * .4, 0); // a happy closed eye, a blush
      // the bow arm, the bow and its string, the arrow on it
      const sb = [.5, -1.75], hb = add(sb, d, 2.15 + 1.6 * Math.max(0, -d[1] - .55)), back = .7 + .3 * dr, t1 = add(add(hb, d, -back), p, 2.1), t2 = add(add(hb, d, -back), p, -2.1), nk = add(add(hb, d, -back), d, c.nock || c.arm === 0 ? -1.35 * dr : 0);
      const bow = Array.from({ length: 11 }, (_, i) => { const t = i / 10, m = add(hb, d, .75); return [(1 - t) * (1 - t) * t1[0] + 2 * (1 - t) * t * m[0] + t * t * t2[0], (1 - t) * (1 - t) * t1[1] + 2 * (1 - t) * t * m[1] + t * t * t2[1]]; });
      tb(T2([sb, add(sb, d, 1.05), hb]), lv, 22, w * .62, gl); tb(T2(bow), lv, 42, w * .7, gl); tb(T2([t1, nk, t2]), lv * .8, 335, w * .3, 0);
      let tip = null;
      if (c.nock) { tip = add(nk, d, 3.0); const hd = [add(add(tip, d, -.45), p, .3), tip, add(add(tip, d, -.45), p, -.3)]; tb(T2([nk, tip]), lv, 45, w * .5, gl); tb(T2(hd), lv, 45, w * .5, gl); tb(T2([add(add(nk, d, .45), p, .28), add(nk, d, .1), add(add(nk, d, .45), p, -.28)]), lv, 45, w * .4, gl); }
      // the drawing arm: on the string, at rest, at his lips, out with the kiss
      const sd = [.2, -1.85], hd2 = c.arm === 0 ? nk : [[0, 0], [.95, -.95], [1.15, -2.85], [2.05, -2.6]][c.arm], el = c.arm === 0 ? add(add(sd, add(hd2, sd, -1), .5), p, -.55) : [[0, 0], [.85, -1.45], [.95, -1.95], [1.3, -2.05]][c.arm];
      tb(T2([sd, el, hd2]), lv, 22, w * .62, gl);
      // the glass, all of it, then each colour's light, every tube of it in one stroke a layer (his tubes are many and small)
      const poly = (path, pts) => { path.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]); }, glass = new Map(), lit = new Map();
      for (const [pts, l2, h, w2, gs0] of parts) { const gs = gs0 * Math.min(1, lv * 2); if (gs > .005) { const k = w2 + "|" + gs; if (!glass.has(k)) glass.set(k, [w2, gs, new Path2D()]); poly(glass.get(k)[2], pts); } if (l2 > .01) { const k = h + "|" + w2 + "|" + l2.toFixed(3); if (!lit.has(k)) lit.set(k, [h, w2, l2, new Path2D()]); poly(lit.get(k)[3], pts); } }
      g.globalCompositeOperation = "source-over"; for (const [w2, gs, path] of glass.values()) { g.strokeStyle = `rgba(70,30,52,${(.95 * gs).toFixed(3)})`; g.lineWidth = w2 * 1.25; g.stroke(path); g.strokeStyle = `rgba(255,255,255,${(.08 * gs).toFixed(3)})`; g.lineWidth = w2 * .3; g.stroke(path); }
      g.globalCompositeOperation = "lighter"; for (const [h, w2, l2, path] of lit.values()) { for (const [k, a2] of [[7, .06], [3.6, .12], [1.9, .3]]) { g.strokeStyle = hsl(h, 100, 62, a2 * l2); g.lineWidth = w2 * k; g.stroke(path); } g.strokeStyle = hsl(h, 100, 66, .95 * l2); g.lineWidth = w2; g.stroke(path); g.strokeStyle = hsl(h, 100, 92, .9 * l2); g.lineWidth = w2 * .35; g.stroke(path); }
      g.globalCompositeOperation = "source-over";
      return tip && Q(tip);
    },
    /** 1.12 b414: the egg's plan for pass P: where Cupid stops to shoot (just behind the arrow's tail when that's clear of
     *  the words and the screen's edges, else the nearest place round the tail that is), the side he comes in from and goes
     *  out at (the nearer), and so where his arrow flies from */
    cupidPlan(P) {
      const o = S.ep; if (o && o.P === P && o.raw === S.raw && o.tx === S.tx && o.ty === S.ty && o.tR === S.tR && o.W === S.W) return o;
      const { W, H, tx, ty, tR: R, raw } = S, a0 = [tx - R * .9, ty + R * .52], dir = [.8437, -.5369];
      let best = null, bs = -1e9;
      const tg = [a0[0] - dir[0] * R * .2, a0[1] - dir[1] * R * .2]; // what he aims at (cupidAim)
      for (const z of [1, .82]) for (const dist of [.62, .5, .8, .98]) for (const k of [0, -.4, .4, -.8, .8, -1.2, 1.2, -1.6, 1.6]) {
        const v = [-dir[0] * Math.cos(k) + dir[1] * Math.sin(k), -dir[0] * Math.sin(k) - dir[1] * Math.cos(k)], sx = a0[0] + v[0] * R * dist * z, sy = a0[1] + v[1] * R * dist * z, rc = R * .45 * z, cxs = sx, cys = sy - R * .12 * z;
        let room = Math.min(cxs - rc, W - rc - cxs, cys - rc - 84, H - 72 - rc - cys); // the screen's edges, the bar along the top, the footer
        for (const [x0, y0, x1, y1] of raw || []) room = Math.min(room, Math.hypot(Math.max(x0 - cxs, 0, cxs - x1), Math.max(y0 - cys, 0, cys - y1)) - rc - 8);
        const steep = Math.abs(Math.cos(Math.atan2(tg[1] - (sy - 1.75 * R * .11 * z), tg[0] - sx))) < .45; // a shot nearly straight up is a last resort
        const sc = room >= 0 ? 100 - Math.abs(k) * 12 - (1 - z) * 40 - Math.abs(.62 - dist) * 30 - (steep ? 30 : 0) : room; if (sc > bs) { bs = sc; best = [sx, sy, z]; } // behind the tail, full size, if he can
      }
      const side = best[0] < W / 2 ? -1 : 1;
      return S.ep = { P, raw, tx, ty, tR: S.tR, W, spot: best, z: best[2], side };
    },
    /** 1.12 b414: Cupid at loop time T of the egg, or null while he's off the wall: in from the nearer side on a swoop,
     *  settling where he shoots from and turning his bow on the sign, drawing it a notch at a time, loosing, hopping when
     *  it lands, blowing the heart a kiss, and up and away the way he came. The aim and the arrow's way are worked out
     *  from where he hovers. */
    cupidAt(T, A, ep) {
      const { R, W } = S, u = R * .11 * ep.z, [sx, sy] = ep.spot, sd = ep.side; if (T < EGG.in0 || T > EGG.off1) return null;
      const bz = (q, a, b, c2, d2) => { const m = 1 - q; return [0, 1].map(k => m * m * m * a[k] + 3 * m * m * q * b[k] + 3 * m * q * q * c2[k] + q * q * q * d2[k]); };
      const ent = [sd < 0 ? -u * 7 : W + u * 7, sy + R * .35], ext = [sd < 0 ? -u * 7 : W + u * 7, sy + R * .15];
      const aim = S.cupidAim(ep), hover = [sx, sy + Math.sin(A * TAU * .62) * u * .22];
      let pos = hover, vel = [0, 0], mir = S.cupidFace(ep, aim), ang = aim, k = 0;
      if (T < EGG.in1) { k = clamp((T - EGG.in0) / (EGG.in1 - EGG.in0)); const q = 1 - Math.pow(1 - k, 2.2), q2 = 1 - Math.pow(1 - Math.min(1, k + .01), 2.2), C = [ent, [ent[0] + (sx - ent[0]) * .35, ent[1] + R * .55], [sx - sd * R * .45, sy + R * .3], [sx, sy]]; pos = bz(q, ...C); const nx = bz(q2, ...C); vel = [nx[0] - pos[0], nx[1] - pos[1]]; pos = [pos[0] + (hover[0] - sx) * k, pos[1] + (hover[1] - sy) * k]; }
      else if (T > EGG.off0) { k = clamp((T - EGG.off0) / (EGG.off1 - EGG.off0)); const q = Math.pow(k, 2), q2 = Math.pow(Math.min(1, k + .01), 2), C = [hover, [sx + sd * R * .3, sy + R * .25], [sx + (ext[0] - sx) * .45, sy + R * .6], ext]; pos = bz(q, ...C); const nx = bz(q2, ...C); vel = [nx[0] - pos[0], nx[1] - pos[1]]; }
      const sp = Math.hypot(vel[0], vel[1]);
      if (sp > .01) { if (T < EGG.in1 && k > .82) { ang = aim; mir = S.cupidFace(ep, aim); } else { ang = Math.atan2(vel[1], vel[0]); mir = vel[0] < 0 ? -1 : 1; } } // flying: facing the way he goes, the bow leading; turning to his aim as he arrives
      const fly = clamp(sp / (u * .5), 0, 1), tilt = fly * .22 + (1 - fly) * S.cupidLean(aim) * env(T, EGG.in1 - .4, EGG.in1, EGG.loose + .1, EGG.loose + .6), dr = T < 4.6 ? 0 : T < 5.0 ? .33 : T < 5.35 ? .67 : T < EGG.loose ? 1 : 0, hop = env(T, 6.15, 6.3, 6.4, 6.75) * u * .9;
      const arm = T < EGG.loose ? 0 : T < EGG.kiss ? 1 : T < EGG.kiss + .35 ? 2 : T < EGG.kiss + .9 ? 3 : 1, wf = [0, 1, 2, 1][Math.floor(A * 5) % 4];
      return { x: pos[0], y: pos[1] - hop, u, mir, tilt, aim: ang, dr, nock: T < EGG.loose, arm, wf };
    },
    /** 1.12 b414: how far Cupid leans back to shoot: as an archer at the sky does, when he aims nearly straight up */
    cupidLean(aim) { return Math.abs(Math.cos(aim)) < .45 ? -.25 : 0; },
    /** 1.12 b414: which way Cupid faces as he shoots: the way he aims, or toward the heart when he aims nearly straight up */
    cupidFace(ep, aim) { const c = Math.cos(aim); return Math.abs(c) < .45 ? (S.tx >= ep.spot[0] ? 1 : -1) : c < 0 ? -1 : 1; },
    /** 1.12 b414: the way Cupid aims from where he hovers: at the line of the sign's arrow, a little behind its tail */
    cupidAim(ep) { const { tx, ty, tR: R } = S, [sx, sy] = ep.spot, u = R * .11 * ep.z, tg = [tx - R * .9 - .8437 * R * .2, ty + R * .52 + .5369 * R * .2]; return Math.atan2(tg[1] - (sy - 1.75 * u), tg[0] - sx); },
    /** 1.12 b414: the arrow's way: from the head of the arrow on his string, curving into the line of the sign's arrow at its
     *  tail, and along it through the heart to where its head sits — sampled, with how far along it the tail is */
    shotPath(ep) {
      const { cx, cy, R } = S, u = R * .11 * ep.z, [sx, sy] = ep.spot, aim = S.cupidAim(ep), mir = S.cupidFace(ep, aim), d = [Math.cos(aim), Math.sin(aim)], tl = S.cupidLean(aim), ct = Math.cos(tl), st = Math.sin(tl);
      const dl1 = -(mir * d[0]) * st + d[1] * ct, arm = 2.15 + 1.6 * Math.max(0, -dl1 - .55) + .65; // his drawn arrow's head: the shoulder, out along the aim (as cupid() lays it)
      const p0 = [sx + mir * (.5 * ct + 1.75 * st) * u + d[0] * arm * u, sy + (.5 * st - 1.75 * ct) * u + d[1] * arm * u], a0 = [cx - R * .9, cy + R * .52], a1 = [cx + R * .86, cy - R * .6], dv = [.8437, -.5369], kk = Math.hypot(a0[0] - p0[0], a0[1] - p0[1]) * .45 + R * .05;
      const c1 = [p0[0] + d[0] * kk, p0[1] + d[1] * kk], c2 = [a0[0] - dv[0] * kk, a0[1] - dv[1] * kk], pts = [];
      for (let i = 0; i <= 16; i++) { const q = i / 16, m = 1 - q; pts.push([0, 1].map(k => m * m * m * p0[k] + 3 * m * m * q * c1[k] + 3 * m * q * q * c2[k] + q * q * q * a0[k])); }
      let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); const La = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
      for (let i = 1; i <= 12; i++) pts.push([a0[0] + (a1[0] - a0[0]) * i / 12, a0[1] + (a1[1] - a0[1]) * i / 12]);
      return { pts, at: L / (L + La) }; // `at`: the share of the way at which it reaches the sign's arrow's tail
    },
    /** 1.12 b414: the egg's pass. The heart lit all through; its arrow goes out, leaving its empty glass; Cupid flies in,
     *  draws, and looses: his arrow streaks in on a curve and runs through the heart along the empty glass, lighting the
     *  sign's arrow behind it; the heart beats for it and small hearts rise; he hops, blows it a kiss, and flies off. */
    eggPass(T, I, A, F, P) {
      const { cx, cy, R } = S, on = I > .01, s = R * 1.5, w = clamp(R * .045, 2.2, 7), ep = S.cupidPlan(P);
      const buzz = t => (Math.sin(t * 67) > .96 ? .55 : 1) * (Math.sin(t * 13.3) > .985 ? .3 : 1);
      const out = t0 => { const d = T - t0; return d < .12 ? 1 : d < .24 ? .15 : d < .42 ? .9 : 0; };
      const glow2 = (x, y, rad, h, a) => { if (a <= .005) return; const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, hsl(h, 100, 55, .5 * a)); gr.addColorStop(1, hsl(h, 100, 45, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.globalCompositeOperation = "source-over"; };
      // the shot: how far along its way the arrow's head is (0 … 1, -1 before it's loosed), and so how much of the sign's arrow is lit
      const sh = S.shotPath(ep), q = T < EGG.loose ? -1 : clamp((T - EGG.loose) / EGG.fly), f = q < 0 ? 0 : clamp((q - sh.at) / (1 - sh.at));
      const gone = T < EGG.out ? 1 : T < EGG.out + .5 ? out(EGG.out) : q < sh.at ? 0 : 1; // out, then back as the shot reaches it
      const arrowLv = lerp(1, gone, I), arrowUpto = lerp(1, T < EGG.out + .5 ? 1 : f, I), headLit = lerp(1, T < EGG.out + .5 ? gone : f >= 1 ? 1 : 0, I);
      const beat = on ? Math.max(env(T, 6.2, 6.28, 6.32, 6.5), env(T, 6.58, 6.66, 6.7, 6.95) * .7) * I : 0, hue = 330 + beat * 12 + (F >= 0 ? Math.sin(F * 20) * 25 : 0), pulse = 1 + beat * .07 + (F >= 0 ? env(F, 0, .05, .2, .5) * .06 : 0);
      const heartLv = buzz(A);
      // its glow on the bricks, swelling with the beat
      const glowA = (.28 * heartLv + .1 * arrowLv) * (1 + beat * .75), gr = g.createRadialGradient(cx, cy, R * .2, cx, cy, R * 2.3);
      gr.addColorStop(0, hsl(hue, 100, 55, .5 * glowA)); gr.addColorStop(.5, hsl(hue, 100, 45, .18 * glowA)); gr.addColorStop(1, hsl(hue, 100, 40, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6); g.globalCompositeOperation = "source-over";
      // the heart, in its tube
      S.tube(HEART.map(([u2, v]) => [cx + u2 * s * pulse, cy + v * s * pulse + R * .05]), heartLv, hue, w, 1);
      // the sign's arrow: its glass always, its light out while Cupid comes, back behind his arrow as it runs through
      const a0 = [cx - R * .9, cy + R * .52], a1 = [cx + R * .86, cy - R * .6], shaft = Array.from({ length: 24 }, (_, i) => [lerp(a0[0], a1[0], i / 23), lerp(a0[1], a1[1], i / 23)]);
      const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), hdl = R * .16, ahead = [[a1[0] - Math.cos(ang - .5) * hdl, a1[1] - Math.sin(ang - .5) * hdl], a1, [a1[0] - Math.cos(ang + .5) * hdl, a1[1] - Math.sin(ang + .5) * hdl]];
      const tail = [0, 1, 2].map(k => { const b0 = [lerp(a0[0], a1[0], .04 + k * .05), lerp(a0[1], a1[1], .04 + k * .05)]; return [[b0[0] - Math.cos(ang - 2.4) * hdl * .8, b0[1] - Math.sin(ang - 2.4) * hdl * .8], b0, [b0[0] - Math.cos(ang + 2.4) * hdl * .8, b0[1] - Math.sin(ang + 2.4) * hdl * .8]]; });
      S.tube(shaft, arrowLv * buzz(A + 3), 45, w * .8, arrowUpto, arrowLv > .5 && arrowUpto >= 1 ? A * .25 % 1 : null); S.tube(ahead, arrowLv * headLit, 45, w * .8, 1); tail.forEach(t2 => S.tube(t2, arrowLv * (arrowUpto > .05 ? 1 : 0), 45, w * .7, 1));
      // the sparkles, as they always are
      S.sparks.forEach(([u2, v, sz], i) => { const kk = .75 + .25 * Math.sin(A * 3 + i * 2), sx2 = cx + u2 * R, sy2 = cy + v * R, r2 = sz * R * kk; S.tube([[sx2, sy2 - r2], [sx2 + r2 * .22, sy2 - r2 * .22], [sx2 + r2, sy2], [sx2 + r2 * .22, sy2 + r2 * .22], [sx2, sy2 + r2], [sx2 - r2 * .22, sy2 + r2 * .22], [sx2 - r2, sy2], [sx2 - r2 * .22, sy2 - r2 * .22], [sx2, sy2 - r2]], 1, 190 + i * 20, w * .5); });
      if (on) {
        // Cupid, fading where he passes a word (as the moth does)
        const cu = S.cupidAt(T, A, ep);
        if (cu) { let dw = 1e9; const mx = cu.x, my = cu.y - R * .12; for (const [x0, y0, x1, y1] of S.raw || []) dw = Math.min(dw, Math.hypot(Math.max(x0 - mx, 0, mx - x1), Math.max(y0 - my, 0, my - y1))); cu.lv = I * lerp(.2, 1, clamp((dw - R * .3) / (R * .25))); S.cupid(cu); }
        // the arrow in flight: a streak of light, brightest at its head, fading behind
        if (q >= 0 && T < EGG.loose + EGG.fly + .2) { const fade = 1 - clamp((T - EGG.loose - EGG.fly) / .2); for (const [a, b, m] of [[.3, .14, .2], [.14, .05, .5], [.05, 0, 1]]) S.tube(sh.pts, I * m * fade, 45, w * .75, clamp(q - b), null, clamp(q - a), 0); }
        // where it lands, a flare at the head; the kiss, a small heart flying to the big one
        const pop = env(T, EGG.loose + EGG.fly - .05, EGG.loose + EGG.fly, EGG.loose + EGG.fly + .05, EGG.loose + EGG.fly + .35) * I; if (pop > .01) glow2(a1[0], a1[1], R * .45, 45, .75 * pop);
        const kq = (T - EGG.kiss - .55) / 1.3; if (kq > 0 && kq < 1) { const c0 = S.cupidAt(EGG.kiss + .5, A, ep); if (c0) { const h0 = [c0.x + c0.mir * 2.05 * c0.u, c0.y - 2.6 * c0.u], e2 = E.out(kq), bx = lerp(h0[0], cx, e2), by = lerp(h0[1], cy - R * .1, e2) - Math.sin(kq * Math.PI) * R * .25, sc = R * (.035 + .05 * kq); S.tube(HEART.filter((_, i) => i % 3 === 0).map(([u2, v]) => [bx + u2 * sc * 2, by + v * sc * 2]).concat([[bx, by + .36 * sc * 2]]), I * (1 - Math.pow(kq, 3)), 340, w * .45, 1, null, 0, 0); } }
        // small hearts rising from it after the beat
        for (const b of S.bubbles) { const kk = seg(T, b.t0 - 7.6 + 6.5, b.t0 - 7.6 + 6.5 + 2.4, x => x); if (kk <= 0 || kk >= 1) continue; const bx = cx + b.x * R + Math.sin(kk * 5 + b.sway) * R * .08, by = cy - R * .2 - kk * R * .95, sc = b.s * R * 1.1, lv = (1 - seg(kk, .7, 1)) * I * (Math.sin(T * 40 + b.sway) > -.9 ? 1 : .3);
          S.tube(HEART.filter((_, i) => i % 3 === 0).map(([u2, v]) => [bx + u2 * sc * 2, by + v * sc * 2]).concat([[bx, by + .36 * sc * 2]]), lv, hue + 20, w * .45); }
      }
      // the finale: neon hearts bursting round it like fireworks
      if (F >= 0) for (const f2 of S.fire) { const kk = clamp((F - f2.t) / .7); if (kk <= 0 || kk >= 1) continue; const fx = cx + Math.cos(f2.a) * R * .75, fy = cy + Math.sin(f2.a) * R * .75;
        for (const p of f2.parts) { const d = E.out(kk) * R * .55 * p.v, hx = fx + Math.cos(p.a) * d, hy2 = fy + Math.sin(p.a) * d + kk * kk * R * .2, sc = R * .045 * (1 - kk * .4); S.tube(HEART.filter((_, i) => i % 4 === 0).map(([u2, v]) => [hx + u2 * sc * 2, hy2 + v * sc * 2]), (1 - kk), (hue + p.a * 40) % 360, w * .35); } }
    },
    /** 1.12 b426: the sign as it rests through an hour egg — its glow on the bricks, the heart, the arrow and its chase
     *  lights, the sparkles — drawn as a dealt pass draws it at rest, so the egg starts and ends where they do; `beat`
     *  swells it. Returns the heart's hue. */
    restSign(I, A, F, beat = 0) {
      const { cx, cy, R } = S, s = R * 1.5, w = clamp(R * .045, 2.2, 7);
      const buzz = t => (Math.sin(t * 67) > .96 ? .55 : 1) * (Math.sin(t * 13.3) > .985 ? .3 : 1);
      const hue = 330 + beat * 12 + (F >= 0 ? Math.sin(F * 20) * 25 : 0), pulse = 1 + beat * .07 + (F >= 0 ? env(F, 0, .05, .2, .5) * .06 : 0), heartLv = buzz(A);
      const glowA = (.28 * heartLv + .1) * (1 + beat * .8), gr = g.createRadialGradient(cx, cy, R * .2, cx, cy, R * 2.3);
      gr.addColorStop(0, hsl(hue, 100, 55, .5 * glowA)); gr.addColorStop(.5, hsl(hue, 100, 45, .18 * glowA)); gr.addColorStop(1, hsl(hue, 100, 40, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6); g.globalCompositeOperation = "source-over";
      S.tube(HEART.map(([u, v]) => [cx + u * s * pulse, cy + v * s * pulse + R * .05]), heartLv, hue, w, 1);
      const a0 = [cx - R * .9, cy + R * .52], a1 = [cx + R * .86, cy - R * .6], shaft = Array.from({ length: 24 }, (_, i) => [lerp(a0[0], a1[0], i / 23), lerp(a0[1], a1[1], i / 23)]);
      const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]), hdl = R * .16, ahead = [[a1[0] - Math.cos(ang - .5) * hdl, a1[1] - Math.sin(ang - .5) * hdl], a1, [a1[0] - Math.cos(ang + .5) * hdl, a1[1] - Math.sin(ang + .5) * hdl]];
      const tail = [0, 1, 2].map(k => { const b0 = [lerp(a0[0], a1[0], .04 + k * .05), lerp(a0[1], a1[1], .04 + k * .05)]; return [[b0[0] - Math.cos(ang - 2.4) * hdl * .8, b0[1] - Math.sin(ang - 2.4) * hdl * .8], b0, [b0[0] - Math.cos(ang + 2.4) * hdl * .8, b0[1] - Math.sin(ang + 2.4) * hdl * .8]]; });
      S.tube(shaft, buzz(A + 3), 45, w * .8, 1, A * .25 % 1); S.tube(ahead, 1, 45, w * .8, 1); tail.forEach(t2 => S.tube(t2, 1, 45, w * .7, 1));
      S.sparks.forEach(([u, v, sz], i) => { const kk = .75 + .25 * Math.sin(A * 3 + i * 2), sx = cx + u * R, sy = cy + v * R, r2 = sz * R * kk; S.tube([[sx, sy - r2], [sx + r2 * .22, sy - r2 * .22], [sx + r2, sy], [sx + r2 * .22, sy + r2 * .22], [sx, sy + r2], [sx - r2 * .22, sy + r2 * .22], [sx - r2, sy], [sx - r2 * .22, sy - r2 * .22], [sx, sy - r2]], 1, 190 + i * 20, w * .5); });
      return hue;
    },
    /** 1.12 b426: the finale's fireworks over an hour egg, as over every pass */
    finaleFire(F, hue) {
      const { cx, cy, R } = S, w = clamp(R * .045, 2.2, 7); if (F < 0) return;
      for (const f2 of S.fire) { const kk = clamp((F - f2.t) / .7); if (kk <= 0 || kk >= 1) continue; const fx = cx + Math.cos(f2.a) * R * .75, fy = cy + Math.sin(f2.a) * R * .75;
        for (const q of f2.parts) { const d = E.out(kk) * R * .55 * q.v, hx = fx + Math.cos(q.a) * d, hy2 = fy + Math.sin(q.a) * d + kk * kk * R * .2, sc = R * .045 * (1 - kk * .4); S.tube(HEART.filter((_, i) => i % 4 === 0).map(([u2, v]) => [hx + u2 * sc * 2, hy2 + v * sc * 2]), (1 - kk), (hue + q.a * 40) % 360, w * .35); } }
    },
    /** 1.12 b426: neon drawn many tubes at once, as Cupid's is: [points, lit, hue, width, glass] each; the glass first, then
     *  each colour's light, every tube of a colour in one stroke a layer (`only`: 1 the glass alone, 2 the light alone) */
    batch(parts, only = 0) {
      const poly = (path, pts) => { path.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]); }, glass = new Map(), lit = new Map();
      for (const [pts, l2, h, w2, gs0] of parts) { const gs = only === 2 ? 0 : gs0; if (only === 1) { if (gs > .005) { const k = w2.toFixed(2) + "|" + gs.toFixed(3); if (!glass.has(k)) glass.set(k, [w2, gs, new Path2D()]); poly(glass.get(k)[2], pts); } continue; } if (gs > .005) { const k = w2.toFixed(2) + "|" + gs.toFixed(3); if (!glass.has(k)) glass.set(k, [w2, gs, new Path2D()]); poly(glass.get(k)[2], pts); } if (l2 > .01) { const lq = Math.round(l2 * 24) / 24, k = h + "|" + w2.toFixed(2) + "|" + lq; if (!lit.has(k)) lit.set(k, [h, w2, lq, new Path2D()]); poly(lit.get(k)[3], pts); } } // (levels in 24 steps: a fade is a few strokes, not one a tube)
      g.globalCompositeOperation = "source-over"; for (const [w2, gs, path] of glass.values()) { g.strokeStyle = `rgba(70,30,52,${(.95 * gs).toFixed(3)})`; g.lineWidth = w2 * 1.25; g.stroke(path); g.strokeStyle = `rgba(255,255,255,${(.08 * gs).toFixed(3)})`; g.lineWidth = w2 * .3; g.stroke(path); }
      g.globalCompositeOperation = "lighter"; for (const [h, w2, l2, path] of lit.values()) { for (const [k, a2] of [[7, .06], [3.6, .12], [1.9, .3]]) { g.strokeStyle = hsl(h, 100, 62, a2 * l2); g.lineWidth = w2 * k; g.stroke(path); } g.strokeStyle = hsl(h, 100, 66, .95 * l2); g.lineWidth = w2; g.stroke(path); g.strokeStyle = hsl(h, 100, 92, .9 * l2); g.lineWidth = w2 * .35; g.stroke(path); }
      g.globalCompositeOperation = "source-over";
    },
    /** 1.12 b426: the cat's tubes for pose `p`, in its own units: [points, part, hue, width, how lit] — the part says when it
     *  lights (0 the body, 1 the tail, 2 the head, 3 the legs, 4 the whiskers, 5 the eye); and where its head is */
    catParts(p) {
      const parts = [], tb = (pts, part, h = 186, w = 1, lv = 1) => parts.push([pts, part, h, w, lv]);
      const { hip, sh } = p, ax = [sh[0] - hip[0], sh[1] - hip[1]], L = Math.hypot(ax[0], ax[1]), up = [ax[1] / L, -ax[0] / L], B = (f, h) => VA(VA(hip, ax, f), up, h);
      const S0 = B(.9, -.1), H0 = B(.08, -.08), elb = p.elb >= 0 ? 1 : -1;
      const fleg = (paw, far) => { const j = IK(S0, paw, .34, .3, elb); tb(CR([S0, j, paw], 4), 3, 186, .9, far ? .45 : 1); tb([VA(paw, [-.04, 0]), VA(paw, [.08, 0])], 3, 186, .9, far ? .45 : 1); };
      const hleg = (paw, far) => { const hock = VA(paw, VR([-.09, -.19], p.hockA)), kn = IK(H0, hock, .32, .29, 1); tb(CR([H0, kn, hock], 4).concat([paw]), 3, 186, .9, far ? .45 : 1); tb([VA(paw, [-.04, 0]), VA(paw, [.08, 0])], 3, 186, .9, far ? .45 : 1); };
      fleg(p.ff, 1); hleg(p.hf, 1);
      tb(CR([B(-.14, .02), B(-.06, .2), B(.22, .27), B(.52, .25 + p.arch * .14), B(.82, .3), B(1.04, .2), B(1.13, -.02), B(1, -.19), B(.7, -.15 - p.belly * .1), B(.42, -.12 - p.belly * .08), B(.16, -.19), B(-.06, -.17)], 4, true), 0); // the body: a round haunch, a waist, a deep chest
      fleg(p.fn, 0); hleg(p.hn, 0);
      const ta = p.tail; let a = ta[0], q = B(-.12, .1); const tp = [q]; for (let i = 1; i < ta.length; i++) { q = VA(q, [Math.cos(a) * .21, Math.sin(a) * .21]); tp.push(q); a += ta[i]; } q = VA(q, [Math.cos(a) * .15, Math.sin(a) * .15]); tp.push(q); tb(CR(tp, 5), 1);
      const hc = VA(B(1.04, .34), VR([.2, -.14], p.nod)), hr = .26, HP = (x, y) => VA(hc, VR([x * hr, y * hr], p.tilt)), ear = p.ears;
      tb(CR([HP(-.1, .92), HP(-.78, .6), HP(-.98, -.1), HP(-.78, -.6), HP(-.62, -1.05 - .5 * ear), HP(-.22, -.84), HP(.28, -.86), HP(.6, -1.1 - .5 * ear), HP(.78, -.5), HP(1.08, -.08), HP(1.2, .22), HP(.96, .52), HP(.5, .84)], 4, true), 2);
      if (p.eye > .3) tb(CR([HP(.3, -.16), HP(.48, -.3 * p.eye), HP(.68, -.18), HP(.49, -.04 * p.eye), HP(.3, -.16)], 3), 5, 78, .72); else tb(CR([HP(.3, -.1), HP(.49, -.26), HP(.68, -.1)], 3), 5, 78, .66);
      tb([HP(1.12, .14), HP(1.62, .04)], 4, 330, .5, .75); tb([HP(1.1, .3), HP(1.6, .4)], 4, 330, .5, .75);
      return { parts, head: HP(-.1, -1.1 - .5 * ear) };
    },
    /** 1.12 b426: the cat at loop time T: its pose (the film's poses eased one into the next, a walk's paws going round as it
     *  goes, a wiggle, a scrabble, a shake of the head) and how far up the arrow it stands, from the feathers' end (0) */
    catAt(T) {
      let k = 0; while (k < CATK.length - 2 && T >= CATK[k + 1][0]) k++;
      const [t0, n0] = CATK[k], [t1, n1] = CATK[k + 1], q = E.io(clamp((T - t0) / (t1 - t0))), A0 = CATP[n0], B0 = CATP[n1], p = {};
      for (const key in A0) { const a = A0[key], b = B0[key]; p[key] = key === "elb" ? (q < .5 ? a : b) : Array.isArray(a) ? a.map((v, i) => Array.isArray(v) ? [lerp(v[0], b[i][0], q), lerp(v[1], b[i][1], q)] : lerp(v, b[i], q)) : lerp(a, b, q); }
      const b = CATB, s = T < b.walk0 ? .2 : T < b.walk1 ? lerp(.2, .55, E.io((T - b.walk0) / (b.walk1 - b.walk0))) : T < b.swipe ? .55 : T < b.swipe + .15 ? lerp(.55, .6, E.out((T - b.swipe) / .15)) : T < b.slide0 ? .6 : T < b.bonk ? lerp(.6, .16, Math.pow((T - b.slide0) / (b.bonk - b.slide0), 1.7)) : .16 + .03 * Math.sin(Math.PI * clamp((T - b.bonk) / .32)) * (T < b.bonk + .32 ? 1 : 0);
      const ww = env(T, b.walk0, b.walk0 + .3, b.walk1 - .3, b.walk1), dist = (s - .2) * 2.086 / .37; // the walk: each paw planted, then lifted and swung through
      if (ww > 0) for (const [key, off] of [["hn", 0], ["fn", .25], ["hf", .5], ["ff", .75]]) { const ph = ((dist / .667 + off) % 1 + 1) % 1, st = ph < .6, dx = st ? .4 * (.5 - ph / .6) : .4 * (-.5 + (ph - .6) / .4), dy = st ? 0 : -.13 * Math.sin(Math.PI * (ph - .6) / .4); p[key] = [p[key][0] + dx * ww, p[key][1] + dy * ww]; }
      const wig = env(T, 6.15, 6.3, 6.72, 6.9); if (wig > 0) { p.hip = [p.hip[0], p.hip[1] - .06 * wig * Math.sin(TAU * 3.4 * (T - 6.15))]; p.tail = p.tail.map((v, i) => i === 3 ? v + .5 * wig * Math.sin(TAU * 3.4 * (T - 6.15)) : v); } // the wiggle before the swipe
      if (T > b.slide0 && T < b.bonk) { const sc = Math.min(1, (T - b.slide0) / .2); p.fn = [p.fn[0], p.fn[1] - .16 * sc * Math.abs(Math.sin(T * 17))]; p.ff = [p.ff[0], p.ff[1] - .16 * sc * Math.abs(Math.sin(T * 17 + 1.6))]; } // scrabbling as it slides
      if (T > b.bonk + .1 && T < b.bonk + .9) p.tilt += .3 * Math.sin(TAU * 4 * (T - b.bonk - .1)) * (1 - (T - b.bonk - .1) / .8); // a shake of the head
      if (T > b.land - .2 && T < b.leave + .1) p.nod -= .22 * env(T, b.land - .2, b.land + .1, b.leave - .2, b.leave + .1); // looking up at what has landed on its head
      p.eye = T < b.eyes ? 0 : T > 4.75 && T < 4.87 ? 0 : T > b.leave + .2 ? p.eye : Math.max(p.eye, 1); // its eyes open, and blink once
      return { p, s };
    },
    /** 1.12 b426: a butterfly from above, its wings `open` (foreshortened as they beat), in its own units (its body two long) */
    bflyParts(open) {
      const parts = [], k = Math.max(.12, Math.abs(open)), tb = (pts, h, w = 1) => parts.push([pts, h, w]);
      for (const sx of [-1, 1]) { const W = (x, y) => [sx * (.08 + x * k), y]; tb(CR([W(0, -.05), W(.35, -.75), W(.85, -.95), W(1.05, -.6), W(.8, -.2), W(.95, .1), W(.85, .55), W(.45, .7), W(.1, .35), W(0, .05)], 4, true), 88); tb(CR([W(.25, -.45), W(.55, -.55), W(.6, -.35)], 3), 288, .55); }
      tb([[0, -.35], [0, .45]], 88, 1.2); for (const sx of [-1, 1]) tb(CR([[sx * .03, -.35], [sx * .18, -.75], [sx * .3, -.95]], 3), 88, .5);
      return parts;
    },
    /** 1.12 b426: where the cat's butterfly is at loop time T: in from the open side to the arrow's head, sitting there
     *  opening and closing its wings; off as the cat swipes, round over the heart, down onto the cat's head; and away */
    bflyAt(T, ck) {
      const { cx, cy, R, W } = S, a1 = [cx + R * .86, cy - R * .6], sd = cx > W / 2 ? 1 : -1, edge = sd > 0 ? W + R * .4 : -R * .4, b = CATB;
      if (T < 1.8 || T > 12.4) return null;
      const perch = [a1[0] - R * .02, a1[1] - R * .1], head = ck(b.land), onHead = [head[0], head[1] - R * .05];
      const K2 = [[1.8, [edge, cy - R * 1.1]], [2.4, [cx + sd * R * 1.25, cy - R * 1.3]], [2.85, [perch[0] + sd * R * .28, perch[1] - R * .38]], [3.05, perch], [b.flee, perch], [7.4, [perch[0] - R * .08, perch[1] - R * .62]], [7.95, [cx - R * .15, cy - R * 1.2]], [8.55, [cx - R * .95, cy - R * .85]], [9.2, [cx - R * .5, cy - R * 1.15]], [9.7, [onHead[0] + R * .1, onHead[1] - R * .45]], [b.land, onHead], [b.leave, onHead], [11.3, [onHead[0] + sd * R * .35, onHead[1] - R * .55]], [11.85, [cx + sd * R * 1.05, cy - R * 1.3]], [12.4, [edge, cy - R * 1.2]]];
      let k = 0; while (k < K2.length - 2 && T >= K2[k + 1][0]) k++;
      const at = (tt, kk) => { const p0 = K2[Math.max(0, kk - 1)][1], p1 = K2[kk][1], p2 = K2[kk + 1][1], p3 = K2[Math.min(K2.length - 1, kk + 2)][1], u = clamp((tt - K2[kk][0]) / (K2[kk + 1][0] - K2[kk][0])), t2 = u * u, t3 = t2 * u; return [0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)); };
      const sit = (T >= 3.05 && T < b.flee) || (T >= b.land && T < b.leave), pos = at(T, k), nx = at(Math.min(K2[k + 1][0], T + .03), k), fl = sit ? 0 : 1;
      const x = pos[0] + fl * Math.sin(T * 7.3) * R * .04, y = pos[1] + fl * Math.sin(T * 9.1 + 1) * R * .05, ang = sit ? (T < b.flee ? .45 : -.2) : Math.atan2(nx[1] - pos[1], nx[0] - pos[0]) + Math.PI / 2;
      return { x, y, ang: sit ? ang : clamp(((ang + Math.PI) % TAU + TAU) % TAU - Math.PI, -1.1, 1.1), open: sit ? .3 + .7 * (.5 + .5 * Math.cos(TAU * .55 * T)) : Math.sin(TAU * 5.5 * T) };
    },
    /** 1.12 b426: the first hour egg, the neon cat. A cat of glass on the arrow's shaft by the feathers, asleep, lights a part
     *  at a time and opens its eyes; a butterfly comes in and settles on the arrow's head; the cat gets up and goes up the
     *  arrow after it, crouches, wiggles and swipes — and the butterfly is off, and the cat slides all the way back down the
     *  arrow, scrabbling, into the feathers, and sees stars. The butterfly comes down and sits on its head a moment, and
     *  goes; the cat curls up to sleep again, and its sign goes out a part at a time, its glass fading from the wall. */
    hourCat(T, I, A, F) {
      const { cx, cy, R } = S, on = I > .01, w = clamp(R * .045, 2.2, 7), b = CATB, parts = [];
      if (on) {
        const a0 = [cx - R * .9, cy + R * .52], dv = [.8437, -.5369], nv = [-.5369, -.8437], ang = Math.atan2(dv[1], dv[0]), u = R * .37, Ls = R * 2.086;
        const ck = tt => { const c2 = S.catAt(tt), o = VA(VA(a0, dv, c2.s * Ls), nv, w * .55), hd = S.catParts(c2.p).head; return VA(o, VR([hd[0] * u, hd[1] * u], ang)); };
        const ct = S.catAt(T), O = VA(VA(a0, dv, ct.s * Ls), nv, w * .55), toS = ([x, y]) => VA(O, VR([x * u, y * u], ang)), cp = S.catParts(ct.p);
        // how lit: the glass comes up, each part catches as it lights (one dip, never a flash) and drops as it goes out
        const gA = clamp((T - b.glass) / .55) * (1 - clamp((T - b.gone) / .5)), catchOn = t0 => { const d = T - t0; return d < 0 ? 0 : d < .2 ? .8 * d / .2 : d < .45 ? .8 - .5 * (d - .2) / .25 : d < .7 ? .3 + .7 * (d - .45) / .25 : 1; }, dropOff = t0 => { const d = T - t0; return d < 0 ? 1 : d < .15 ? 1 - .6 * d / .15 : d < .35 ? .4 + .3 * (d - .15) / .2 : d < .55 ? .7 * (1 - (d - .35) / .2) : 0; };
        let dw = 1e9; const mid = toS([.6, -.55]); for (const [x0, y0, x1, y1] of S.raw || []) dw = Math.min(dw, Math.hypot(Math.max(x0 - mid[0], 0, mid[0] - x1), Math.max(y0 - mid[1], 0, mid[1] - y1)));
        const fade = I * lerp(.2, 1, clamp((dw - R * .3) / (R * .25)));
        for (const [pts, part, h, wk, lv] of cp.parts) { const L2 = catchOn(b.on + part * .16) * dropOff(b.off + (5 - part) * .15) * lv * fade; parts.push([pts.map(toS), L2, h, w * .74 * wk, .5 * gA * fade]); }
        // its bump into the feathers, and the stars it sees
        const bump = env(T, b.bonk - .02, b.bonk, b.bonk + .04, b.bonk + .3) * I; if (bump > .01) { const pt = toS([-.15, -.25]), gr = g.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], R * .3); gr.addColorStop(0, hsl(186, 100, 60, .45 * bump)); gr.addColorStop(1, hsl(186, 100, 50, 0)); g.globalCompositeOperation = "lighter"; g.fillStyle = gr; g.fillRect(pt[0] - R * .3, pt[1] - R * .3, R * .6, R * .6); g.globalCompositeOperation = "source-over"; }
        const st = env(T, b.bonk + .05, b.bonk + .25, b.bonk + 1.05, b.bonk + 1.4) * fade; if (st > .01) { const hc = ck(T); for (let j = 0; j < 3; j++) { const a = T * 4.2 + j * TAU / 3, sx = hc[0] + Math.cos(a) * R * .2, sy = hc[1] - R * .09 + Math.sin(a) * R * .06, r2 = R * .045 * (.8 + .25 * Math.sin(a)); parts.push([[[sx, sy - r2], [sx + r2 * .25, sy - r2 * .25], [sx + r2, sy], [sx + r2 * .25, sy + r2 * .25], [sx, sy + r2], [sx - r2 * .25, sy + r2 * .25], [sx - r2, sy], [sx - r2 * .25, sy - r2 * .25], [sx, sy - r2]], st, 52, w * .4, 0]); } }
        // the butterfly
        const bf = S.bflyAt(T, ck); if (bf) { let dwb = 1e9; for (const [x0, y0, x1, y1] of S.raw || []) dwb = Math.min(dwb, Math.hypot(Math.max(x0 - bf.x, 0, bf.x - x1), Math.max(y0 - bf.y, 0, bf.y - y1))); const fb = I * lerp(.2, 1, clamp((dwb - R * .12) / (R * .2))), ub = R * .12;
          for (const [pts, h, wk] of S.bflyParts(bf.open)) parts.push([pts.map(([x, y]) => { const r = VR([x * ub, y * ub], bf.ang); return [bf.x + r[0], bf.y + r[1]]; }), fb, h, w * .45 * wk, .4 * fb]); }
      }
      S.batch(parts, 1); // the cat's glass on the wall, behind the sign's light
      const hue = S.restSign(I, A, F, 0);
      S.batch(parts, 2);
      S.finaleFire(F, hue);
    },
    /** 1.12 b426: a small fish, in its own units (a body long, facing forward, its tail swung `sw`): body, tail, eye */
    fishParts(sw) {
      const tj = [-.32, 0], tr = q => VA(tj, VR([q[0] - tj[0], q[1] - tj[1]], sw)), body = CR([[.5, 0], [.32, -.17], [.05, -.22], [-.22, -.13], tj, [-.22, .13], [.05, .2], [.32, .15]], 4, true);
      return [[body, 0, 1], [[tj, [-.55, -.2], [-.47, 0], [-.55, .2], tj].map(tr), 0, .9], [CR([[.27, -.05], [.3, -.09], [.34, -.05], [.3, -.01]], 2, true), 1, .55], [CR([[.0, -.21], [-.08, -.33], [-.2, -.24]], 3), 0, .7]];
    },
    /** 1.12 b426: the pufferfish, in its own units, blown up `b` (0 a fish … 1 a ball of spines), its spines lit `sp` */
    pufferParts(sw, b, sp) {
      const out = [], rx = lerp(.42, .5, b), ry = lerp(.3, .5, b), cxp = lerp(.05, 0, b), body = Array.from({ length: 21 }, (_, i) => { const a = i / 20 * TAU; return [cxp + Math.cos(a) * rx, Math.sin(a) * ry]; });
      out.push([body, 0, 1]);
      const tj = [cxp - rx + .02, 0], tr = q => VA(tj, VR([q[0] - tj[0], q[1] - tj[1]], sw)); out.push([[tj, [tj[0] - .2, -.16], [tj[0] - .14, 0], [tj[0] - .2, .16], tj].map(tr), 0, .9]);
      out.push([CR([[cxp + rx * .45, -ry * .35], [cxp + rx * .55, -ry * .5], [cxp + rx * .68, -ry * .35], [cxp + rx * .55, -ry * .2]], 2, true), 1, .6]); // a big round eye
      out.push([[[cxp + rx * .9, ry * .05], [cxp + rx * 1.02, ry * .12]], 0, .55]); // its little mouth
      if (sp > 0) for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + .1, on = clamp(sp * 14 - k * .6); if (on <= 0) continue; const r0 = 1.02, r1 = 1.02 + .3 * on; out.push([[[cxp + Math.cos(a) * rx * r0, Math.sin(a) * ry * r0], [cxp + Math.cos(a) * rx * r1, Math.sin(a) * ry * r1]], 2, .55]); }
      return out;
    },
    /** 1.12 b426: the jellyfish, in its own units (its bell one wide), squeezed `c` (0 open … 1 shut), its tentacles trailing
     *  with the time `t` */
    jellyParts(c, t) {
      const out = [], bw = .5 * (1 - .22 * c), bh = .38 * (1 + .3 * c), bell = [];
      for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; bell.push([Math.cos(a) * bw, Math.sin(a) * bh]); }
      for (let i = 1; i < 8; i++) { const x = bw - i / 8 * 2 * bw; bell.push([x, (i % 2 ? .07 : 0) + .02]); } bell.push(bell[0]);
      out.push([CR(bell, 2), 0, 1]); out.push([CR([[-bw * .55, -bh * .15], [0, -bh * .55], [bw * .55, -bh * .15]], 4), 0, .55]); // the bell, and a line inside it
      for (let k = 0; k < 5; k++) { const x0 = (k / 4 - .5) * bw * 1.6, pts = []; for (let j = 0; j <= 7; j++) { const f = j / 7; pts.push([x0 * (1 - .25 * f) + Math.sin(t * 3.1 - f * 4.5 + k * 1.3) * .07 * f, .06 + f * (.7 + .1 * (k % 2)) * (1 - .25 * c)]); } out.push([CR(pts, 2), 1, .6]); }
      return out;
    },
    /** 1.12 b426: the second hour egg, the aquarium. The wall round the heart goes under water: bubbles come up from below it
     *  and kelp grows a stretch at a time either side; a school of little fish swims in from the open side and once round
     *  the heart; a jellyfish pulses up past its far side; a pufferfish comes and noses at the tube, twice — and the heart
     *  beats: the puffer blows up into a ball of spines, lit one by one round it, and the school scatters and comes back
     *  together. The puffer goes down again with a puff of bubbles and swims off, the school goes, the kelp goes out from
     *  its tips and the last bubbles pop. Everything fades where it passes a word, as the moth does. */
    hourSea(T, I, A, F) {
      const { cx, cy, R, W } = S, on = I > .01, w = clamp(R * .045, 2.2, 7), b = SEA, sd = cx > W / 2 ? 1 : -1, edge = sd > 0 ? W + R * .5 : -R * .5, parts = [];
      const beat = on ? Math.max(env(T, b.beat, b.beat + .08, b.beat + .12, b.beat + .3), env(T, b.beat + .38, b.beat + .46, b.beat + .5, b.beat + .75) * .7) * I : 0;
      if (on) {
        const near = (x, y, k) => { let d = 1e9; for (const [x0, y0, x1, y1] of S.raw || []) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))); return I * lerp(.2, 1, clamp((d - R * k) / (R * .2))); }; // fading by a word
        const catchOn = t0 => { const d = T - t0; return d < 0 ? 0 : d < .2 ? .8 * d / .2 : d < .45 ? .8 - .5 * (d - .2) / .25 : d < .7 ? .3 + .7 * (d - .45) / .25 : 1; }, dropOff = t0 => { const d = T - t0; return d < 0 ? 1 : d < .15 ? 1 - .6 * d / .15 : d < .35 ? .4 + .3 * (d - .15) / .2 : d < .55 ? .7 * (1 - (d - .35) / .2) : 0; };
        const put = (list, x, y, u, ang, mir, lv, gl, hues, wk) => { for (const [pts, part, wq] of list) parts.push([pts.map(([px2, py2]) => { const r = VR([px2 * u * mir, py2 * u], ang); return [x + r[0], y + r[1]]; }), lv, hues[part], w * wk * wq, gl]); };
        const floor = cy + R * 1.02;
        // the kelp: four fronds from the floor, lit from the root up a stretch at a time, swaying in the current, and out from
        // the tip down; each a stem with long blades off it, turn and turn about
        [[-1.2, 1.0, 0], [-.94, .68, 1.7], [.96, .76, .9], [1.22, 1.04, 2.6]].forEach(([fx, fh, ph], k) => {
          const x0 = cx + sd * fx * R, grow = clamp((T - b.kelp0 - k * .22) / 1.4), gone = clamp((T - b.kelp1 + (3 - k) * .15) / .8), upto = E.io(grow) * (1 - E.io(gone)); if (upto <= 0) return;
          const lv = .82 * near(x0, floor - fh * R * .5, .2), pts = []; for (let j = 0; j <= 12; j++) { const f = j / 12; pts.push([x0 + Math.sin(A * 1.1 + ph - f * 2.6) * R * .13 * Math.pow(f, 1.4) + Math.sin(A * .6 + ph * 2 - f * 1.3) * R * .05 * f, floor - f * fh * R]); }
          const n = Math.max(2, Math.round((pts.length - 1) * upto) + 1), stem = CR(pts.slice(0, n), 3); parts.push([stem, lv, 140, w * .5, .45 * lv]);
          for (const [f, sx] of [[.22, 1], [.42, -1], [.6, 1], [.78, -1]]) { if (f > upto - .06) continue; const j = Math.round(f * 12), q = pts[j], q2 = pts[Math.min(12, j + 1)], a = Math.atan2(q2[1] - q[1], q2[0] - q[0]), L = R * .3 * fh * (1 - f * .35), bend = Math.sin(A * 1.4 + ph + f * 3) * .25, B2 = (t2, o) => { const aa = a + sx * (.42 - .25 * t2) + bend * t2; return [q[0] + Math.cos(aa) * L * t2 + Math.cos(aa + sx * 1.57) * o * L, q[1] + Math.sin(aa) * L * t2 + Math.sin(aa + sx * 1.57) * o * L]; };
            parts.push([CR([q, B2(.3, .07), B2(.65, .08), B2(1, 0), B2(.62, -.03), B2(.3, -.02), q], 3), lv, 152, w * .4, .4 * lv]); } // a blade, long and curved
        });
        // the bubbles: two streams, each bubble lit as it appears, wobbling up, and popping
        const BR = rng(91); for (let k = 0; k < 44; k++) { const st = k % 2, te = b.bub0 + Math.floor(k / 2) * .45 + BR() * .3, life = 2.4 + BR() * 1.0, r0 = R * (.032 + BR() * .03), ph = BR() * TAU, age = T - te; if (te > b.bub1 || age < 0 || age > life + .25) continue;
          const x = cx + sd * (st ? .72 : -.62) * R + Math.sin(age * 3.4 + ph) * R * .05, y = floor - R * .1 - age * R * .55, lv = near(x, y, .1);
          if (age < life) { const c = catchOn(te) * lv, ring = Array.from({ length: 11 }, (_, i) => [x + Math.cos(i / 10 * TAU) * r0, y + Math.sin(i / 10 * TAU) * r0]); parts.push([ring, c, 195, w * .4, .35 * lv]); parts.push([[[x - r0 * .45, y - r0 * .2], [x - r0 * .3, y - r0 * .5]], c, 195, w * .3, 0]); }
          else { const q = (age - life) / .25; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + ph, d0 = r0 * (1 + 1.4 * q), d1 = r0 * (1.3 + 1.6 * q); parts.push([[[x + Math.cos(a) * d0, y + Math.sin(a) * d0], [x + Math.cos(a) * d1, y + Math.sin(a) * d1]], (1 - q) * lv, 195, w * .3, 0]); } } } // a pop
        // the jellyfish: up past the far side, pulsing, its tentacles trailing
        if (T > b.jelly0 && T < b.jelly1 + .6) { const tt = T - b.jelly0, per = 1.45, ph = tt / per, c = Math.pow(Math.max(0, Math.sin(Math.PI * (ph % 1))), 3) * (ph % 1 < .5 ? 1 : 0), rise = R * (.62 * tt + .16 * Math.sin(TAU * ph) / TAU * 0) - R * .1 * (Math.floor(ph) + E.io(clamp((ph % 1) * 2))) * 0;
          const jy = cy + R * 1.35 - R * .3 * (Math.floor(ph) + E.io(clamp((ph % 1) * 2))) - R * .08 * tt, jx = cx - sd * R * (.98 - .12 * Math.sin(tt * .5)), u = R * .42, lv = near(jx, jy, .2) * catchOn(b.jelly0 + .1) * dropOff(b.jelly1), gl = .4 * near(jx, jy, .2) * clamp(tt / .5) * (1 - clamp((T - b.jelly1 - .1) / .5));
          put(S.jellyParts(c, A), jx, jy, u, Math.sin(tt * .8) * .12, 1, lv, gl, [292, 312], .5); }
        // the school: five little fish, each on the one path round the heart, a moment behind the one before, to one side of it
        const SC = [[cx + edge - cx, cy + R * .45], [cx + sd * R * 1.28, cy + R * .78], [cx + sd * R * .3, cy + R * 1.0], [cx - sd * R * .75, cy + R * .88], [cx - sd * R * 1.3, cy + R * .2], [cx - sd * R * 1.08, cy - R * .58], [cx - sd * R * .28, cy - R * .98], [cx + sd * R * .58, cy - R * .92], [cx + sd * R * 1.32, cy - R * .38], [cx + sd * R * 1.38, cy + R * .38], [edge, cy + R * .2]];
        const ST = [b.school0, 2.9, 3.7, 4.4, 5.15, 5.85, 6.6, 7.6, 8.55, 9.5, b.school1];
        const path = tt => { let k = 0; while (k < ST.length - 2 && tt >= ST[k + 1]) k++; const p0 = SC[Math.max(0, k - 1)], p1 = SC[k], p2 = SC[k + 1], p3 = SC[Math.min(SC.length - 1, k + 2)], u2 = clamp((tt - ST[k]) / (ST[k + 1] - ST[k])), t2 = u2 * u2, t3 = t2 * u2; return [0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * u2 + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)); };
        const burst = tt => tt < b.beat + .04 ? 0 : tt < b.beat + .34 ? E.out((tt - b.beat - .04) / .3) : tt < b.beat + .55 ? 1 : 1 - E.io(clamp((tt - b.beat - .55) / 1.2));
        [[0, 0, 12], [.28, -.17, 22], [.33, .19, 16], [.6, .02, 26], [.7, -.28, 14]].forEach(([lag, side, hue], k) => {
          const pos = tt => { const q = path(tt - lag), q2 = path(tt - lag + .02), dx = q2[0] - q[0], dy = q2[1] - q[1], L = Math.hypot(dx, dy) || 1, wob = Math.sin(tt * 2.3 + k * 1.7) * .03; let x = q[0] - dy / L * R * (side + wob), y = q[1] + dx / L * R * (side + wob); const bu = burst(tt); if (bu > 0) { const ox = x - cx, oy = y - cy, ol = Math.hypot(ox, oy) || 1, j = .2 + .08 * (k % 3); x += ox / ol * R * j * bu; y += oy / ol * R * j * bu * .7; } return [x, y]; };
          const tt = T; if (tt - lag < b.school0 || tt - lag > b.school1) return; const [x, y] = pos(tt), [x2, y2] = pos(tt + .03), mir = x2 < x ? -1 : 1, ang = Math.atan2(y2 - y, (x2 - x) * mir) * mir, sp = Math.hypot(x2 - x, y2 - y) / .03 / R;
          const lv = near(x, y, .1), sw = Math.sin(A * (7 + sp * 5) + k * 1.9) * (.35 + .2 * Math.min(1, sp));
          put(S.fishParts(sw), x, y, R * .26, ang, mir, lv, .35 * lv, [hue, 52], .5); });
        // the pufferfish: in from the open side, noses at the tube twice; blown up by the beat; down again, and away
        if (T > b.puff0 && T < b.puff1) { const nose = [cx + sd * R * .86, cy + R * .04], rest = [cx + sd * R * 1.12, cy - R * .04];
          const PP = [[b.puff0, [edge, cy + R * .1]], [5.4, [cx + sd * R * 1.45, cy + R * .2]], [b.nose, [nose[0] + sd * R * .1, nose[1]]], [b.beat + .02, [nose[0] + sd * R * .1, nose[1]]], [b.beat + .5, rest], [b.deflate + .6, [rest[0], rest[1] - R * .05]], [9.6, [cx + sd * R * 1.5, cy + R * .3]], [b.puff1, [edge, cy + R * .45]]];
          let k = 0; while (k < PP.length - 2 && T >= PP[k + 1][0]) k++; const p0 = PP[Math.max(0, k - 1)][1], p1 = PP[k][1], p2 = PP[k + 1][1], p3 = PP[Math.min(PP.length - 1, k + 2)][1], u2 = clamp((T - PP[k][0]) / (PP[k + 1][0] - PP[k][0])), t2 = u2 * u2, t3 = t2 * u2;
          let [x, y] = [0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * u2 + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3));
          if (T > b.nose && T < b.beat) x -= sd * R * .1 * Math.pow(Math.abs(Math.sin(Math.PI * (T - b.nose) / ((b.beat - b.nose) / 2))), 2); // two nudges at the tube
          const bl = T < b.beat + .04 ? 0 : T < b.deflate ? E.back(clamp((T - b.beat - .04) / .35)) : 1 - E.io(clamp((T - b.deflate) / .5)), spn = T < b.deflate ? clamp((T - b.beat - .1) / .45) : 1 - clamp((T - b.deflate) / .3);
          const fwd = T < b.beat + .2 ? -sd : T < b.deflate + .4 ? -sd : sd, bob = bl * Math.sin(T * 2.6) * R * .03, lv = near(x, y + bob, .15) * catchOn(b.puff0 + .05), sw = Math.sin(A * 6.5) * .3 * (1 - bl);
          put(S.pufferParts(sw, bl, spn), x, y + bob, R * .34, bl * Math.sin(T * 1.7) * .25, fwd, lv, .35 * lv, [50, 30, 40], .55);
          if (T > b.deflate && T < b.deflate + 1.2) for (let j = 0; j < 4; j++) { const age = T - b.deflate - j * .1; if (age <= 0 || age > 1) continue; const bx = x + fwd * R * (.2 + age * .25) + Math.sin(age * 9 + j) * R * .03, by = y - R * (.05 + age * .45), r0 = R * (.025 + .01 * j), lvb = (1 - age) * near(bx, by, .1); parts.push([Array.from({ length: 9 }, (_, i) => [bx + Math.cos(i / 8 * TAU) * r0, by + Math.sin(i / 8 * TAU) * r0]), lvb, 195, w * .35, 0]); } } // a puff of bubbles as it goes down
      }
      S.batch(parts, 1);
      const hue = S.restSign(I, A, F, beat);
      S.batch(parts, 2);
      S.finaleFire(F, hue);
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl;
      S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4)); if (S.vis < .01) return;
      const hl = P > 0 ? K.long(P) : 0; // 1.12 b426: an hour egg's pass (the crown, 3, plays as a dealt pass still)
      g.save(); g.globalAlpha = S.vis; if (P > 0 && K.egg(P)) S.eggPass(T, I, A, F, P); else if (hl === 1) S.hourCat(T, I, A, F); else if (hl === 2) S.hourSea(T, I, A, F); else if (P > 0) S.neon2(T, I, A, F, S.plan && S.plan.P === P ? S.plan : (S.plan = dealPass(P))); else S.neon(T, I, A, F); g.restore();
    },
  };
  return S;
}
