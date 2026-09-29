// scene-cocoa.js — 1.12 b336: Cocoa's scene (scenes.js loads it). A café table seen from above, dark walnut planks,
// and on it, in the largest open space on the page (scenes.js, `words`), a cup of cocoa on its saucer with latte art on
// top — a stacked heart, a line of crema between one pour and the next — a spoon, a few beans. The morning's light falls
// across the table through a window, in four soft panes, round the cup: the leaves outside move their shadows through it,
// dust drifts in it, the cup's shadow lies in it. While the list is in use it steams and the foam shimmers. The loop,
// fifteen seconds: the spoon stirs the old pattern away into a swirl; a new pour blooms on the surface, rings pushed into
// rings, and the pull-through turns them into a heart; marshmallows drop in, bob and drift and melt; a cloud goes over and
// the light dims and comes back; cinnamon dusts the top; the steam curls up. The finale: small foam hearts bloom round
// the big one and the steam rises in a heart.
//
// 1.12 b375: the forever cycle. The latte art carries: what a pass pours stays on the cocoa through the quiet after it,
// its dusting with it, until the next pass's spoon stirs them in, one way round or the other. The heart is the
// signature, the first pass of every visit, poured as it always was. After it each pass pours one of four with the same
// fluid, dealt so a run of passes pours them all before one comes round again and never the same one twice running,
// each turned a little its own way: the heart; a rosetta, small pushes of foam each landing just behind the last and
// shoving it into a crescent, swinging side to side as it steps back, then pulled through into a fern; a tulip, big
// pushes pressed into each other and pulled through into stacked hearts; and a big heart on a stem over a few fern
// leaves. Then it deals what follows the pour: three marshmallows, five, a scatter of small ones, or none; cinnamon,
// cocoa sifted on from one side, chocolate shavings, or nothing; a cloud over the window, two small ones, a bird's
// shadow flitting up the light, or a gust in the leaves. The rare ones, about one pass in eight each: a swan, a rosetta
// bent into a wing, a neck drawn up in an S, a head and a flick of a beak; and a ginger cat's paw, reaching in from the
// edge away from the words to pat the saucer.
export default function cocoa(K) {
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  let g = null, px = 1;
  /** a sprite drawn smooth at the screen's density, `w` by `h` CSS pixels */
  const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
  const FOAM = "#F3E4CC", CREMA = "rgba(112,58,28,.82)";
  // 1.12 b351: the latte art is poured, not drawn. Each pour's edge is a closed line of points on the surface, carried
  // along by the flow of that moment (each point moved where the surface takes it, and a point put in wherever the line
  // stretches), so nothing smears and every line stays drawn. The flows are the pour's own: the spoon's swirl, which
  // winds the old art into spirals as it goes; the stream, pushing the surface out from where it lands, so a pour of foam
  // opens into a disc, a breath of crema into a ring inside it, the next foam inside that, and the rings stack; the
  // pull-through, dragging a narrow band of the surface along behind it, which pulls the stack into a heart and draws its
  // point. The pour always starts from a clear surface, so it always ends in the same heart, and the loop starts from
  // that heart: seamless, and seekable.
  const DT = 1 / 60, POUR0 = 2.3, KS = 24, K0 = 138, K1 = 354; /* in steps: the stir from .4 s, the pour 2.3 – 5.9 s */
  /** where the stream lands at loop time t, in the surface's units (the cup's radius is 1) */
  const pourAt = t => t < 5.25 ? [0, lerp(-.16, .06, seg(t, 2.3, 5.1, E.sine))] : [0, lerp(-.66, .5, seg(t, 5.3, 5.8, E.sine))];
  /** what the stream lays down at t: foam, with breaths of crema between pushes so the rings stack; -1 when it isn't pouring */
  const pourIs = t => t < POUR0 || t > 5.8 ? -1 : t < 2.75 ? 1 : t < 2.91 ? 0 : t < 3.45 ? 1 : t < 3.61 ? 0 : t < 4.2 ? 1 : t < 4.36 ? 0 : t < 5.1 ? 1 : t < 5.3 ? -1 : 1; /* each push longer than the last, so the first rings are pushed out wide */
  /** the surface's flow at (x, y), loop time t: [vx, vy] in radii a second */
  const flow = (x, y, t) => {
    let vx = 0, vy = 0; const r = Math.hypot(x, y);
    const sw = env(t, .4, .9, 1.8, 2.25, E.sine) * 5.2; if (sw > 0) { const w = sw * (1.25 - r); vx += -y * w; vy += x * w; } /* the spoon's swirl, faster in the middle */
    if (t >= POUR0 && t < 5.15) { const [px, py] = pourAt(t), dx = x - px, dy = y - py, d2 = dx * dx + dy * dy + .012, q = .07 * (t < 2.5 ? (t - POUR0) / .2 : 1); vx += q * dx / d2; vy += q * dy / d2; } /* the stream, pushing the surface out from where it lands */
    if (t >= 5.3 && t < 5.85) { const [px, py] = pourAt(t), dx = x - px, dy = y - py, k = Math.exp(-(dx * dx) / .007 - (dy * dy) / .045); vy += 1.5 * k; } /* the pull-through, dragging a narrow band behind it */
    const wall = clamp((1.02 - r) / .1); return [vx * wall, vy * wall];
  };
  /** carry a line of points along the flow for one step (a midpoint step), and put a point in wherever it has stretched */
  const move = (pts, t, closed) => {
    for (const p of pts) { const [vx, vy] = flow(p[0], p[1], t), [wx, wy] = flow(p[0] + vx * DT / 2, p[1] + vy * DT / 2, t + DT / 2); p[0] += wx * DT; p[1] += wy * DT; }
    if (pts.length >= 700) return;
    const out = [], n = pts.length; /* in one pass, not one splice at a time */
    for (let i = 0; i < n; i++) { const a = pts[i]; out.push(a); if (i === n - 1 && !closed) break; const b = pts[(i + 1) % n]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > .016 && out.length + (n - i) < 700) out.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
    if (out.length !== n) { pts.length = 0; for (const p of out) pts.push(p); }
  };
  /** one step of the surface at time t: a new edge where a layer starts, the pull-through's thread laid, all of it carried */
  const step = (art, t) => {
    const pour = pourIs(t);
    if (pour >= 0 && t < 5.2 && pour !== pourIs(t - DT)) { const [px, py] = pourAt(t); art.edges.push({ foam: pour === 1, pts: Array.from({ length: 20 }, (_, i) => [px + Math.cos(i / 20 * TAU) * .012, py + Math.sin(i / 20 * TAU) * .012]) }); }
    if (t >= 5.3 && t < 5.8) art.pull.push(pourAt(t).slice());
    for (const e of art.edges) move(e.pts, t, true);
    move(art.pull, t, false);
  };
  const copy = art => ({ edges: art.edges.map(e => ({ foam: e.foam, pts: e.pts.map(p => p.slice()) })), pull: art.pull.map(p => p.slice()) });
  /** a ring of foam at radius r about (0, cy), pulled into a heart by `pull` (0 round … 1 heart), stirred by `twist` */
  const shape = (r, cy, pull, twist, wob, n = 72) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU; let x = Math.cos(a) * r * (1 + wob * Math.sin(a * 5 + r * 20)), y = cy + Math.sin(a) * r * (1 + wob * Math.cos(a * 4 + r * 13));
    const top = y < cy, gx = Math.exp(-Math.pow(x / (r * (top ? .24 : .22)), 2)); y += pull * r * (top ? .34 : .5) * gx; // the notch where the pour came in, the point where it left
    if (twist) { const d = Math.hypot(x, y), t = twist * (1.4 - d) * 2.2, c = Math.cos(t), s = Math.sin(t); [x, y] = [x * c - y * s, x * s + y * c]; }
    return [x, y]; });

  /* ---------------- 1.12 b375: the forever cycle — the other pours ---------------- */
  const { bag, deal } = K;
  // Each pour after the heart is a program for the same fluid: pushes of foam, [t0, t1, x, y, strength], each opening a
  // fresh edge where the stream lands and pushing the surface out from there; and lines, [t0, t1, path, drag, width, lays,
  // widths], the stream drawn along a path, dragging a narrow band of the surface with it (a pull-through) and, if it
  // lays, leaving a thread of foam. A rosetta is small pushes, each landing just behind the last and shoving it into a
  // crescent, swinging side to side as it steps back, then pulled through into a fern; a tulip is a few big pushes pressed
  // into each other, pulled through into stacked hearts; the swan is a rosetta bent into a wing, a neck drawn up in an S,
  // a head and a flick of a beak. What they end in is what they pour, so nothing is stamped.
  const LR_ = (a, b, t) => a + (b - a) * t;
  const ROSETTA = (() => { const p = []; let t = 2.3, y = .44; p.push([t, t + .45, 0, y, .11]); t += .465; y -= .15;
    for (let i = 0; i < 15; i++) { const f = i / 14, sd = i % 2 ? 1 : -1; p.push([t, t + .16, sd * .06 * (1 - .5 * f), y, .14]); t += .175; y -= .062; }
    return { push: p, lines: [[t + .04, t + .59, [[0, y - .2], [0, .74]], 1.5, .006, true]] }; })();
  const TULIP = { push: [[2.3, 3.0, 0, .3, .14], [3.14, 3.74, 0, -.02, .13], [3.88, 4.38, 0, -.3, .12], [4.5, 4.86, 0, -.52, .11]], lines: [[5.0, 5.55, [[0, -.82], [0, .72]], 1.25, .007, true]] };
  const CROWNED = (() => { const p = []; let t = 2.3, y = .58; p.push([t, t + .42, 0, y, .11]); t += .435; y -= .15; // a big heart on a stem, over a few fern leaves
    for (let i = 0; i < 6; i++) { const f = i / 5, sd = i % 2 ? 1 : -1; p.push([t, t + .17, sd * .07 * (1 - .3 * f), y, .14]); t += .185; y -= .075; }
    y -= .2; p.push([t, t + .85, 0, y, .11]); t += .85; // the heart, notched by a short pull of its own before the long one draws its stem
    return { push: p, lines: [[t + .03, t + .42, [[0, y - .38], [0, y + .14]], .95, .007, false], [t + .46, t + .9, [[0, y + .5], [0, .84]], 1.5, .006, true]] }; })();
  const SWAN = (() => { const p = [], arc = f => [LR_(-.02, -.42, f) - .16 * Math.sin(f * Math.PI), LR_(.36, -.34, f)]; let t = 2.3; p.push([t, t + .42, .12, .56, .1]); t += .435;
    for (let i = 0; i < 15; i++) { const f = i / 14, [x, y] = arc(f), [x2, y2] = arc(Math.min(1, f + .05)), l = Math.hypot(x2 - x, y2 - y) || 1, nx = -(y2 - y) / l, ny = (x2 - x) / l, sd = i % 2 ? 1 : -1, a = .05 * (1 - .5 * f); p.push([t, t + .15, x + nx * a * sd, y + ny * a * sd, .14]); t += .162; }
    const wing = [...Array.from({ length: 13 }, (_, k) => arc(1.1 - k / 12 * 1.1)), [.14, .68]], l1 = [t + .03, t + .5, wing, 1.35, .006, true]; t = l1[1] + .06;
    const l2 = [t, t + .55, [[.18, .52], [.3, .36], [.4, .12], [.38, -.08], [.28, -.24], [.29, -.36]], .45, .005, true, [.03, .026]]; t = l2[1];
    p.push([t, t + .4, .29, -.39, .09]); t += .42; // the head, where the neck ends
    return { push: p, lines: [l1, l2, [t, t + .14, [[.34, -.39], [.51, -.34]], .9, .003, true, [.02, .006]]] }; })();
  /** a program made ready to run: where its lines run, and when it's done (in steps) */
  const ready = pr => { pr.T0 = pr.push[0][0]; pr.LL = pr.lines.map(([, , p]) => { const L = [0]; for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return L; }); pr.end = Math.max(...pr.lines.map(l => l[1])); pr.k1 = Math.ceil((pr.end + .12) / DT); return pr; };
  const PROGS = [null, ready(ROSETTA), ready(TULIP), ready(CROWNED), ready(SWAN)], SWAN_ID = 4; // 0, the heart, is the signature's own pour
  const alongP = (pr, k, f) => { const p = pr.lines[k][2], L = pr.LL[k], s = L[L.length - 1] * clamp(f); let i = 1; while (i < L.length - 1 && L[i] < s) i++; const q = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1); return [lerp(p[i - 1][0], p[i][0], q), lerp(p[i - 1][1], p[i][1], q), p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]]; };
  const pushAt = (pr, t) => pr.push.find(e => t >= e[0] && t < e[1]), lineAt = (pr, t) => pr.lines.findIndex(l => t >= l[0] && t < l[1]);
  /** where a program's stream is at t, and whether it is pouring there */
  const progAt = (pr, t) => { const e = pushAt(pr, t); if (e) return [e[2], e[3], 1]; const k = lineAt(pr, t); if (k >= 0) { const [x, y] = alongP(pr, k, seg(t, pr.lines[k][0], pr.lines[k][1], E.sine)); return [x, y, pr.lines[k][5] ? 2 : 0]; } return [0, 0, 0]; };
  /** a program's flow at (x, y), t: the push's stream, the line's drag, held off at the wall */
  const progFlow = (pr, x, y, t) => { let vx = 0, vy = 0; const r = Math.hypot(x, y), e = pushAt(pr, t);
    if (e) { const dx = x - e[2], dy = y - e[3], d2 = dx * dx + dy * dy + .012, q = e[4] * clamp((t - pr.T0) / .2); vx += q * dx / d2; vy += q * dy / d2; }
    const k = lineAt(pr, t); if (k >= 0) { const [, , , drag, w] = pr.lines[k], [px2, py2, tx, ty] = alongP(pr, k, seg(t, pr.lines[k][0], pr.lines[k][1], E.sine)), tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, dx = x - px2, dy = y - py2, a = dx * ux + dy * uy, c = -dx * uy + dy * ux, kk = Math.exp(-(c * c) / w - (a * a) / .045); vx += drag * ux * kk; vy += drag * uy * kk; }
    const wall = clamp((1.02 - r) / .1); return [vx * wall, vy * wall]; };
  /** the spoon's swirl, one way or the other */
  const stirFlow = (x, y, t, dir) => { const sw = env(t, .4, .9, 1.8, 2.25, E.sine) * 5.2 * dir, r = Math.hypot(x, y), w = sw * (1.25 - r), wall = clamp((1.02 - r) / .1); return [-y * w * wall, x * w * wall]; };
  /** carry a line along a flow `fl` for one step, as `move` does */
  const moveBy = (pts, t, closed, fl) => {
    for (const p of pts) { const [vx, vy] = fl(p[0], p[1], t), [wx, wy] = fl(p[0] + vx * DT / 2, p[1] + vy * DT / 2, t + DT / 2); p[0] += wx * DT; p[1] += wy * DT; }
    if (pts.length >= 700) return;
    const out = [], n = pts.length; for (let i = 0; i < n; i++) { const a = pts[i]; out.push(a); if (i === n - 1 && !closed) break; const b = pts[(i + 1) % n]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > .016 && out.length + (n - i) < 700) out.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
    if (out.length !== n) { pts.length = 0; for (const p of out) pts.push(p); }
  };
  /** one step of a program's pour: a fresh edge where a push lands, a thread where a line lays, all of it carried */
  const progStep = (art, pr, t) => {
    const e = pushAt(pr, t), was = pushAt(pr, t - DT), fresh = pr.push.some(q => Math.abs(t - q[0]) < DT / 2);
    if (e && (!was || fresh)) art.edges.push({ foam: true, pts: Array.from({ length: 20 }, (_, i) => [e[2] + Math.cos(i / 20 * TAU) * .012, e[3] + Math.sin(i / 20 * TAU) * .012]) });
    const k = lineAt(pr, t); if (k >= 0 && pr.lines[k][5]) { const [x, y] = alongP(pr, k, seg(t, pr.lines[k][0], pr.lines[k][1], E.sine)); if (Math.abs(t - pr.lines[k][0]) < DT / 2 || !art.pulls.length || art.pulls[art.pulls.length - 1].k !== k) art.pulls.push(Object.assign([[x, y]], { k, w: pr.lines[k][6] || null })); else art.pulls[art.pulls.length - 1].push([x, y]); }
    const fl = (x, y, t2) => progFlow(pr, x, y, t2); for (const ed of art.edges) moveBy(ed.pts, t, true, fl); for (const pl of art.pulls) moveBy(pl, t, false, fl);
  };
  /** the old art, stirred: every edge and thread carried round by the spoon */
  const stirStep = (art, t, dir) => { const fl = (x, y, t2) => stirFlow(x, y, t2, dir); for (const ed of art.edges) moveBy(ed.pts, t, true, fl); if (art.pull) moveBy(art.pull, t, false, fl); for (const pl of art.pulls || []) moveBy(pl, t, false, fl); };
  const copy2 = art => ({ edges: art.edges.map(e => ({ foam: e.foam, pts: e.pts.map(p => p.slice()) })), pull: (art.pull || []).map(p => p.slice()), pulls: (art.pulls || []).map(pl => Object.assign(pl.map(p => p.slice()), { k: pl.k, w: pl.w })) });
  const NART = 4; // the heart, the rosetta, the tulip, the heart on a fern; the swan is the rare one
  const swanP = P => P > 1 && deal(P, 61)() < .125 && !(deal(P - 1, 61)() < .125);
  const pawP = P => P > 1 && !swanP(P) && deal(P, 71)() < .11 && !(deal(P - 1, 71)() < .11); // the other rare one: a cat's paw
  /** what pass P pours and what goes with it, worked out from P alone: the art (from the bag, now and then the swan), the
   *  way it points, the way the spoon stirs, what drops in, what's dusted on, what passes over the window's light */
  const planOf = P => {
    if (P <= 0) return { P: 0, art: 0, ang: 0, stir: 1, drop: 0, dust: 0, light: 0, seed: 0 }; // the signature's: its heart, three marshmallows, cinnamon, a cloud
    const r = deal(P, 37), art = swanP(P) ? SWAN_ID : bag(P, NART, 9);
    return { P, art, ang: (r() - .5) * .9, stir: r() < .5 ? 1 : -1, drop: bag(P, 4, 17), dust: bag(P, 4, 19), light: bag(P, 4, 13), seed: Math.floor(r() * 1e6) }; // the extras from bags too: none the same two passes running
  };
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .7, hugFinale: true, list: .4, // a dark kit; the table is behind the words, and the lines and the finale's words sit on pads
    carry: true, // the art a pass pours stays on the cocoa through the quiet after it, until the next pass stirs it away (b375)
    bind(ctx) { g = ctx; g.lineCap = "round"; g.lineJoin = "round"; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(97);
      Object.assign(S, { W, H, pr, Rmin: pr ? 40 : 46, Rmax: pr ? 150 : 240 }); if (S.vis === undefined) S.vis = 1;
      if (!S.placed) { const R0 = pr ? Math.min(W * .32, 120) : Math.min(W * .15, H * .3); Object.assign(S, { cx: pr ? W * .5 : W * .8, cy: pr ? H * .76 : H * .5, R: R0, tx: pr ? W * .5 : W * .8, ty: pr ? H * .76 : H * .5, tR: R0 }); }
      S.mallows = [[.28, -.3, 0, 6.2], [-.3, .05, .6, 6.7], [.1, .34, 1.2, 7.2]].map(([u, v, rot, t]) => ({ u, v, rot, t, ph: r() * TAU }));
      S.dust = Array.from({ length: 160 }, () => { const a = r() * TAU, d = Math.sqrt(r()) * .78; return { u: Math.cos(a) * d, v: Math.sin(a) * d, s: .006 + r() * .008, t: 9.0 + r() * 1.3 }; });
      S.minis = Array.from({ length: 6 }, (_, i) => { const a = i / 6 * TAU + .3; return { u: Math.cos(a) * .7, v: Math.sin(a) * .7, t: .1 + i * .07 }; });
      S.beans = [[-.95, .72, .6], [-1.02, .52, 2.1], [.98, -.78, 1.3]].map(([u, v, a]) => ({ u, v, a }));
      // the window's light, drawn once: four panes, soft at the edges, skewed as it falls across the table; a leaf's shadow
      S.win = make(280, 184, x => { x.transform(1, 0, -.28, 1, 54, 0); for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const w = 96, h = 78, ox = 14 + i * (w + 12), oy = 8 + j * (h + 12); for (let q = 0; q < 9; q++) { x.fillStyle = "rgba(255,176,96,.12)"; x.beginPath(); x.roundRect(ox + q * 1.6, oy + q * 1.6, w - q * 3.2, h - q * 3.2, 6); x.fill(); } } });
      S.pad = make(160, 80, x => { for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(24,16,11,.15)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } }); /* the shade under a line */
      S.soft = make(64, 64, x => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(.5, "rgba(0,0,0,.75)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });
      S.leaves = Array.from({ length: 16 }, () => ({ u: (r() - .5) * 4.2, v: (r() - .5) * 3, s: .22 + r() * .4, ph: r() * TAU, f: .35 + r() * .5, a: .3 + r() * .4 }));
      // the heart the loop starts from: the pour, run once from a clear surface; the loop's own pour ends in the same one
      const art = { edges: [], pull: [] }; for (let k = K0; k < K1; k++) step(art, k * DT);
      S.HEART = art; S.art = copy(art); S.k = K1;
      { const r2 = rng(4142), side = r2() * TAU; S.cocoaD = Array.from({ length: 240 }, () => { const a = side + (r2() - .5) * 2.4, d = .3 + Math.sqrt(r2()) * .5; return { u: Math.cos(a) * d, v: Math.sin(a) * d, s: .004 + r2() * .006, t: 9.0 + r2() * 1.4 }; }); // cocoa, sifted from one side (b375)
        S.shav = Array.from({ length: 13 }, () => { const a = r2() * TAU, d = Math.sqrt(r2()) * .6; return { u: Math.cos(a) * d, v: Math.sin(a) * d, r: .034 + r2() * .022, a: r2() * TAU, l: 2.2 + r2() * 1.8, w: .02 + r2() * .01, t: 9.0 + r2() * 1.2 }; });
        // a ginger cat's foreleg and paw seen from above, its tip at the right, drawn in fur: a lighter underside along one
        // flank, tabby bands, hairs laid toward the paw and spilling past the edge so its outline is soft; its four toes,
        // and a toe bean, drawn apart, so the toes can splay on a pat and show the pink beneath
        const r3 = rng(4747), DW = 448, DH = 64, px0 = DW - 38, inPaw = (u, v) => (u <= DW - 40 && u >= 0 && v >= 9 && v <= 55) || ((u - px0) * (u - px0)) / (34 * 34) + ((v - 32) * (v - 32)) / (29 * 29) <= 1;
        const furAt = (u, v, band) => band ? [[190, 94, 34], [176, 84, 30]] : v < 15 ? [[250, 190, 118], [240, 164, 88]] : v > 49 ? [[248, 224, 190], [238, 204, 164]] : [[232, 142, 64], [218, 124, 50]];
        const stripe = (u, v) => { for (let k = 0; k < 7; k++) { const c = DW - 112 - k * 48 + (v - 32) * (v - 32) * .014; if (Math.abs(u - c) < 8 && v < 48) return true; } return false; };
        const hairs = (x, n, inside, dirAt, colAt, len0, len1, w0, w1) => { x.lineCap = "round"; for (let k = 0; k < n; k++) { let u, v, tries = 0; do { u = r3() * DW; v = r3() * DH; } while (!inside(u, v) && ++tries < 40); if (tries >= 40) continue; const a = dirAt(u, v) + (r3() - .5) * .5, l = len0 + r3() * (len1 - len0), c = colAt(u, v)[r3() < .5 ? 0 : 1]; x.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(.55 + r3() * .45).toFixed(2)})`; x.lineWidth = w0 + r3() * (w1 - w0); x.beginPath(); x.moveTo(u, v); x.lineTo(u + Math.cos(a) * l, v + Math.sin(a) * l); x.stroke(); } };
        S.pawLeg = make(DW, DH, x => {
          const base = x.createLinearGradient(0, 8, 0, 58); base.addColorStop(0, "#EFA45A"); base.addColorStop(.6, "#DC8840"); base.addColorStop(.86, "#E9B884"); base.addColorStop(1, "#F2D6B2"); x.fillStyle = base;
          x.beginPath(); x.rect(0, 11, DW - 40, 42); x.ellipse(px0, 32, 31, 26.5, 0, 0, TAU); x.fill();
          hairs(x, 3400, inPaw, () => 0, (u, v) => furAt(u, v, stripe(u, v)), 3, 6, .7, 1.2); // the coat, laid toward the paw
          hairs(x, 420, (u, v) => inPaw(u, v) && !inPaw(u + 4, v + (v < 32 ? -3.5 : 3.5)), (u, v) => (v < 32 ? -.28 : .28) * (u > px0 - 20 ? 1.5 : 1), (u, v) => furAt(u, v, stripe(u, v)), 2, 4, .6, 1); // the soft edge, a few hairs spilling past it
          const sh = x.createLinearGradient(0, 0, 0, DH); sh.addColorStop(0, "rgba(255,236,200,.18)"); sh.addColorStop(.35, "rgba(255,236,200,0)"); sh.addColorStop(.7, "rgba(120,56,18,0)"); sh.addColorStop(.86, "rgba(120,56,18,.14)"); sh.addColorStop(1, "rgba(120,56,18,0)");
          x.globalCompositeOperation = "source-atop"; x.fillStyle = sh; x.fillRect(0, 0, DW, DH); x.globalCompositeOperation = "source-over"; });
        S.pawToe = make(30, 26, x => { const base = x.createRadialGradient(13, 10, 2, 15, 13, 13); base.addColorStop(0, "#F4B470"); base.addColorStop(.7, "#E0904A"); base.addColorStop(1, "#D07A36"); x.fillStyle = base; x.beginPath(); x.ellipse(15, 13, 12, 10, 0, 0, TAU); x.fill();
          const inT = (u, v) => ((u - 15) * (u - 15)) / (12 * 12) + ((v - 13) * (v - 13)) / (10.5 * 10.5) <= 1, DWs = 30, DHs = 26; for (let k = 0; k < 170; k++) { let u, v, t2 = 0; do { u = r3() * DWs; v = r3() * DHs; } while (!inT(u, v) && ++t2 < 30); if (t2 >= 30) continue; const a = Math.atan2(v - 13, u - 9) * .5 + (r3() - .5) * .4, l = 2 + r3() * 2.5, c = v < 8 ? [250, 196, 128] : v > 19 ? [238, 200, 160] : [226, 136, 60]; x.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(.6 + r3() * .4).toFixed(2)})`; x.lineWidth = .7 + r3() * .6; x.lineCap = "round"; x.beginPath(); x.moveTo(u, v); x.lineTo(u + Math.cos(a) * l, v + Math.sin(a) * l); x.stroke(); }
          x.strokeStyle = "rgba(120,52,16,.42)"; x.lineWidth = 1.3; x.beginPath(); x.ellipse(15, 13, 11.6, 9.8, 0, Math.PI * .28, Math.PI * 1.72, true); x.stroke(); }); // its round edge, darker, so the toes part
        S.pawBean = make(16, 14, x => { const gr = x.createRadialGradient(9, 6, 1, 8, 7, 7.5); gr.addColorStop(0, "#F9B4C1"); gr.addColorStop(.6, "#E97C93"); gr.addColorStop(1, "#CC5E78"); x.fillStyle = gr; x.beginPath(); x.ellipse(8, 7, 6.5, 5.5, 0, 0, TAU); x.fill(); x.fillStyle = "rgba(255,255,255,.55)"; x.beginPath(); x.ellipse(6.3, 5.2, 2, 1.2, -.4, 0, TAU); x.fill(); });
        S.pawDim = [DW, DH, px0]; }
      S.motes = Array.from({ length: 34 }, () => ({ u: (r() - .5) * 3.6, v: (r() - .5) * 3.2, s: .6 + r() * 1.3, ph: r() * TAU, f: .5 + r() * 1.2, dr: .03 + r() * .05 }));
      // the table: walnut planks, their grain, their seams, a warm light falling off toward the edges
      const bw = pr ? 70 : 90;
      bg.fillStyle = "#24170F"; bg.fillRect(0, 0, W, H);
      const n1 = K.noise1(3, 64), n2 = K.noise1(8, 64);
      for (let y = 0, k = 0; y < H; y += bw, k++) {
        const base = [41 + r() * 9, 28 + r() * 5, 20 + r() * 4]; bg.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`; bg.fillRect(0, y, W, bw - 1.5);
        for (let l = 0; l < 14; l++) { const yy = y + 3 + l * (bw - 6) / 14, ph = r() * 50; bg.strokeStyle = `rgba(${l % 3 ? "20,12,8" : "84,58,40"},${(.16 + r() * .14).toFixed(3)})`; bg.lineWidth = .6 + r() * .9; bg.beginPath(); for (let x = 0; x <= W; x += 12) { const w = K.fbm(n1, (x + ph * 40) / 180, 3) * 7 + Math.sin(x / 90 + ph) * 1.5; x ? bg.lineTo(x, yy + w) : bg.moveTo(x, yy + w); } bg.stroke(); }
        const knot = r() < .5; if (knot) { const kx = r() * W, ky = y + bw * (.3 + r() * .4); for (let q = 0; q < 5; q++) { bg.strokeStyle = `rgba(18,10,6,${(.35 - q * .05).toFixed(3)})`; bg.lineWidth = 1; bg.beginPath(); bg.ellipse(kx, ky, 8 + q * 5, 3 + q * 2, 0, 0, TAU); bg.stroke(); } }
        bg.fillStyle = "rgba(10,6,4,.8)"; bg.fillRect(0, y + bw - 1.5, W, 1.5);
      }
      const vg = bg.createRadialGradient(W * .55, H * .45, Math.min(W, H) * .2, W * .5, H * .5, Math.max(W, H) * .8); vg.addColorStop(0, "rgba(8,4,2,0)"); vg.addColorStop(1, "rgba(8,4,2,.62)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      // the bar along the top and the keyboard line along the foot keep to the kit's ink: the planks go into shadow there
      for (const [y0, y1] of [[0, pr ? 150 : 110], [H, H - (pr ? 120 : 130)]]) { const sg = bg.createLinearGradient(0, y0, 0, y1); sg.addColorStop(0, "rgba(42,31,26,1)"); sg.addColorStop(.45, "rgba(42,31,26,1)"); sg.addColorStop(.75, "rgba(42,31,26,.5)"); sg.addColorStop(1, "rgba(42,31,26,0)"); bg.fillStyle = sg; bg.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)); }
      if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the largest circle of open table; the cup settles there, as big as it allows */
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
    spot() { return S.vis < .05 ? null : [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    /** bring the surface to loop time t: from the heart when the loop has come round or been sought back */
    sim(t) {
      const kt = Math.min(Math.floor(t / DT + 1e-6), K1);
      if (kt < S.k) { S.art = copy(S.HEART); S.k = 0; }
      for (; S.k < kt; S.k++) { const k = S.k; if (k < KS) continue; if (k === K0) S.art = { edges: [], pull: [] }; step(S.art, k * DT); }
    },
    /** the heart drawn once at the cup's size and held: what shows while the list is in use, and before the stir and after
     *  the pour, when the surface is still (1 across = the cup's radius) */
    heartImg(LR) {
      const k = Math.max(2, Math.round(LR * px));
      if (!S.hImg || S.hImg.k !== k) { const [c, x] = canvas(2 * k, 2 * k); x.imageSmoothingEnabled = true; x.setTransform(k, 0, 0, k, k, k);
        const foam = x.createRadialGradient(-.16, -.2, .04, 0, .05, .75); foam.addColorStop(0, "#FFF9EE"); foam.addColorStop(.65, "#F6E7CF"); foam.addColorStop(1, "#E8CFA8");
        const held = g; g = x; S.lay(S.HEART, 1, foam); g = held; c.k = k; S.hImg = c; }
      return S.hImg;
    },
    /** the art a pass ends in: the heart the signature's pour ends in, or a program's pour run through once (b375) */
    artOf(id) {
      if (!id) return S.HEART;
      S.arts = S.arts || {}; if (S.arts[id]) return S.arts[id];
      const pr = PROGS[id], art = { edges: [], pull: [], pulls: [] }; for (let k = K0; k < pr.k1; k++) progStep(art, pr, k * DT);
      return (S.arts[id] = art);
    },
    /** an art drawn once at the cup's size and held, as heartImg is (1 across = the cup's radius) */
    artImg(id, LR) {
      if (!id) return S.heartImg(LR);
      const k = Math.max(2, Math.round(LR * px)); S.imgs = S.imgs || {}; let c = S.imgs[id];
      if (!c || c.k !== k) { const [c2, x] = canvas(2 * k, 2 * k); x.imageSmoothingEnabled = true; x.setTransform(k, 0, 0, k, k, k);
        const foam = x.createRadialGradient(-.16, -.2, .04, 0, .05, .75); foam.addColorStop(0, "#FFF9EE"); foam.addColorStop(.65, "#F6E7CF"); foam.addColorStop(1, "#E8CFA8");
        const held = g; g = x; S.lay(S.artOf(id), 1, foam); g = held; c2.k = k; S.imgs[id] = c = c2; }
      return c;
    },
    /** a pass's plan, dealt once and held while the pass lasts: its pour, what drops in and when (after the pour is done),
     *  what goes over the light and when, whether the cat comes */
    passPlan(P) {
      if (S.plP === P && S.pl) return S.pl;
      const cur = planOf(P), prev = planOf(P - 1), pr = PROGS[cur.art], end = pr ? pr.end : 5.8, r = rng(cur.seed + 7), t0 = Math.max(6.25, end + .4);
      const n = [3, 5, 9, 0][cur.drop], small = cur.drop === 2, o = r() * TAU;
      const mallows = Array.from({ length: n }, (_, i) => { const a = o + i / Math.max(1, n) * TAU + (r() - .5) * .6, d = small ? .2 + r() * .34 : .22 + r() * .22; return { u: Math.cos(a) * d, v: Math.sin(a) * d, rot: r() * TAU, t: t0 + i * (small ? .08 : .4) + r() * .08, ph: r() * TAU, s: small ? .06 + r() * .025 : .14 + r() * .025, pink: r() < .45 }; });
      S.pl = { P, cur, prev, end, mallows, lt: cur.light, c0: 8.0 + r() * 1.3, deep: .55 + r() * .4, paw: pawP(P) }; S.plP = P;
      return S.pl;
    },
    /** how far the window's light is dimmed at T: a cloud going over, or two small ones, or none (the bird and the gust are drawn) */
    dimOf(pl, T) { const c = pl.c0; return pl.lt === 0 ? env(T, c, c + .8, c + 1.4, c + 2.4, E.sine) * pl.deep : pl.lt === 3 ? env(T, c, c + .45, c + .7, c + 1.3, E.sine) * .6 + env(T, c + 1.5, c + 1.9, c + 2.2, c + 2.9, E.sine) * .75 : 0; },
    /** a bird's shadow crossing the window's light, taken out of it (drawn in the light's own frame), from past its edge on the open side */
    birdShadow(t, R, I) {
      const ww = R * 4.8, wh = ww * 184 / 280, f = t / 1.7, x = lerp(ww * .17, ww * .1, f) + Math.sin(f * Math.PI) * R * .18, y = lerp(wh * .62, -wh * .68, f), s = R * .27, fl = Math.sin(t * 13) * .7; // up the table on the side away from the words
      g.fillStyle = "#000"; for (const [k, a] of [[1.3, .35], [1, .75]]) { const q = s * k; g.globalAlpha = a * I; g.beginPath(); g.moveTo(x - q, y - q * fl * .5); g.quadraticCurveTo(x - q * .4, y - q * (.18 + fl * .3), x, y); g.quadraticCurveTo(x + q * .4, y - q * (.18 + fl * .3), x + q, y - q * fl * .5); g.quadraticCurveTo(x + q * .3, y + q * .12, x, y + q * .2); g.quadraticCurveTo(x - q * .3, y + q * .12, x - q, y - q * fl * .5); g.fill(); }
    },
    /** a pass's surface, in the surface's units: the art the pass before left (still, then stirred away), this pass's pour
     *  (live, then still), each turned the way it was poured; the stream where it lands */
    surface(pl, T, I, A, on, LR, foam) {
      const { cur, prev } = pl, pr = PROGS[cur.art], k1 = pr ? pr.k1 : K1, imgO = S.artImg(prev.art, LR), imgN = S.artImg(cur.art, LR);
      const put = (img, ang, a) => { g.save(); g.rotate(ang); g.globalAlpha = a; g.drawImage(img, -1, -1, 2, 2); g.restore(); };
      if (on) { S.simPass(T, cur, prev);
        if (T < KS * DT) put(imgO, prev.ang, S.vis); else if (T >= k1 * DT) put(imgN, cur.ang, S.vis);
        else { g.save(); g.rotate(T < POUR0 ? prev.ang : cur.ang); S.lay(S.pa, S.vis * (T < POUR0 ? 1 - seg(T, 1.2, 2.25, E.in) * I : 1), foam); g.restore(); } }
      if (I < .99) put(imgO, prev.ang, S.vis * (1 - (on ? I : 0)));
      const [sx, sy, kind] = pr ? progAt(pr, T) : pourIs(T) >= 0 ? [...pourAt(T), T > 5.25 ? 2 : 1] : [0, 0, 0];
      if (on && kind && T >= POUR0) { const c = Math.cos(cur.ang), sn = Math.sin(cur.ang), px2 = sx * c - sy * sn, py2 = sx * sn + sy * c; g.globalAlpha = S.vis * I; for (let q = 0; q < 3; q++) { const rr = ((A * 1.6 + q / 3) % 1) * .2; g.strokeStyle = `rgba(250,240,222,${(.45 * (1 - rr / .2)).toFixed(3)})`; g.lineWidth = .012; g.beginPath(); g.arc(px2, py2, rr, 0, TAU); g.stroke(); } g.fillStyle = "#FFF9EE"; g.beginPath(); g.arc(px2, py2, kind === 2 ? .035 : .06, 0, TAU); g.fill(); }
      g.globalAlpha = S.vis;
    },
    /** the dusts: the pass before's, there until the spoon stirs it in; this pass's, sifted on at its moment */
    dusts(pl, T, I, on, stir) {
      const kp = lerp(1, T < 2.3 ? 1 - stir : 0, I); S.dustOf(pl.prev.dust, () => kp); if (on) S.dustOf(pl.cur.dust, d => T >= d.t ? I : 0);
      g.globalAlpha = S.vis;
    },
    /** one dust: cinnamon (the signature's), cocoa sifted from one side, chocolate shavings, or none */
    dustOf(type, kf) {
      if (type === 0) { g.fillStyle = "rgba(140,70,30,.55)"; for (const d of S.dust) { const k = kf(d); if (k <= .01) continue; g.globalAlpha = S.vis * k; g.fillRect(d.u - d.s / 2, d.v - d.s / 2, d.s, d.s); } }
      else if (type === 1) { g.fillStyle = "rgba(58,28,16,.6)"; for (const d of S.cocoaD) { const k = kf(d); if (k <= .01) continue; g.globalAlpha = S.vis * k; g.fillRect(d.u - d.s / 2, d.v - d.s / 2, d.s, d.s); } }
      else if (type === 2) { g.lineCap = "round"; for (const c of S.shav) { const k = kf(c); if (k <= .01) continue; g.globalAlpha = S.vis * k; g.strokeStyle = "rgba(70,36,20,.95)"; g.lineWidth = c.w; g.beginPath(); g.arc(c.u, c.v, c.r, c.a, c.a + c.l); g.stroke(); g.strokeStyle = "rgba(118,66,38,.95)"; g.lineWidth = c.w * .6; g.beginPath(); g.arc(c.u, c.v, c.r, c.a + .1, c.a + c.l - .1); g.stroke(); g.strokeStyle = "rgba(196,142,100,.6)"; g.lineWidth = c.w * .22; g.beginPath(); g.arc(c.u, c.v, c.r - c.w * .18, c.a + .3, c.a + c.l * .6); g.stroke(); } } // curls of milk chocolate, their lips catching the light
    },
    /** a pass's drops: marshmallows (three, five, or a scatter of small ones) dropped in after its pour, bobbing, drifting the
     *  way it was stirred, melting */
    mallowsOf(pl, T, I, A, on) {
      if (!on) return;
      for (const m of pl.mallows) { const k = seg(T, m.t, m.t + .45, E.in), melt = seg(T, 11.5, 14.3, E.io); if (k <= 0 || melt >= 1) continue; const drift = (T - m.t) * .12 * pl.cur.stir, a = Math.atan2(m.v, m.u) + drift, d = Math.hypot(m.u, m.v), u = Math.cos(a) * d, v = Math.sin(a) * d, sc = lerp(2.4, 1, k) * (1 - melt * .6), s = m.s * sc, bob = Math.sin(A * 3 + m.ph) * .01;
        if (k >= 1) { const rp = clamp((T - m.t - .45) / .8); if (rp < 1) { g.globalAlpha = S.vis * I; g.strokeStyle = `rgba(243,228,204,${(.6 * (1 - rp)).toFixed(3)})`; g.lineWidth = .014; g.beginPath(); g.arc(u, v, m.s * .8 + rp * m.s * 1.7, 0, TAU); g.stroke(); } }
        g.save(); g.translate(u, v + bob); g.rotate(m.rot + drift * 2); g.globalAlpha = S.vis * I * (1 - melt * .5); const gr = g.createLinearGradient(-s, -s, s, s); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(1, melt > .3 ? "#F6E9D8" : m.pink ? "#F4D2D8" : "#F1EBE2"); g.fillStyle = gr; g.beginPath(); g.roundRect(-s / 2, -s / 2, s, s, s * (.22 + melt * .3)); g.fill(); g.strokeStyle = "rgba(160,120,100,.3)"; g.lineWidth = .008; g.stroke(); g.restore(); }
      g.globalAlpha = S.vis;
    },
    /** the rare one: a ginger cat's paw reaching in from the nearer edge away from the words, patting the saucer's rim twice,
     *  and drawing back out of sight */
    pawAt(pl, T, I, cx, cy, R) {
      const k = I * (seg(T, 10.3, 11.25, E.out) - seg(T, 12.5, 13.5, E.in)); if (k <= .002) return;
      const { W, H } = S, right = W - cx < H - cy, ux = right ? -.985 : -.24, uy = right ? -.17 : -.97, SR = R * .92, [DW, DH, px0] = S.pawDim;
      const tip = [cx - ux * SR * .8, cy - uy * SR * .8], far = Math.hypot(W, H), start = [tip[0] - ux * far * .6, tip[1] - uy * far * .6];
      const pat = Math.max(env(T, 11.3, 11.46, 11.5, 11.62, E.sine), env(T, 11.8, 11.96, 12.0, 12.12, E.sine)); // lifted a little, and down on the rim, twice
      const splay = Math.max(env(T, 11.58, 11.66, 11.74, 11.92, E.sine), env(T, 12.08, 12.16, 12.24, 12.42, E.sine)); // the toes giving as it presses: they splay and the beans show
      const x = lerp(start[0], tip[0], k), y = lerp(start[1], tip[1], k), h = R * .36, s = h / DH, lift = pat * R * .05;
      g.save(); g.globalAlpha = S.vis * .45; g.translate(x + R * .06 + lift, y + R * .09 + lift); g.rotate(Math.atan2(uy, ux)); g.drawImage(S.soft, -DW * s, -h * .62, DW * s + h * .2, h * 1.24); g.restore(); // its shadow on the table
      g.save(); g.globalAlpha = S.vis; g.translate(x, y - lift * .4); g.rotate(Math.atan2(uy, ux)); const sc = 1 + pat * .05 - splay * .02; g.scale(sc, sc * (1 + splay * .03));
      g.drawImage(S.pawLeg, -DW * s, -DH * s / 2, DW * s, DH * s);
      const pcx = (px0 - DW) * s, tw = 30 * s, th = 26 * s, bw = 21 * s, bh = 18 * s;
      [-.66, -.22, .22, .66].forEach((a0, i) => { const a = a0 * (1 + .34 * splay), rr = (24 + 3 * splay - pat * 2) * s, tx = pcx + Math.cos(a) * rr, ty = Math.sin(a) * rr;
        if (splay > .01) { g.save(); g.globalAlpha = S.vis * splay; g.translate(pcx + Math.cos(a) * (rr + (4 + 5 * splay) * s), Math.sin(a) * (rr + (4 + 5 * splay) * s)); g.rotate(a); g.drawImage(S.pawBean, -bw / 2, -bh / 2, bw, bh); g.restore(); } // its bean, under the toe, showing in front of it as the toe lifts
        g.save(); g.globalAlpha = S.vis; g.translate(tx, ty); g.rotate(a * .9); const ts = 1 + .05 * splay - .06 * pat; g.scale(ts, ts); g.drawImage(S.pawToe, -tw / 2, -th / 2, tw, th); g.restore(); });
      g.restore();
    },
    /** bring pass `cur`'s surface to loop time t: the art the pass before left, stirred away its own way, then this pass's
     *  pour from a clear surface; from the start again when the pass changes or the time is sought back */
    simPass(t, cur, prev) {
      const pr = PROGS[cur.art], k1 = pr ? pr.k1 : K1, kt = Math.min(Math.floor(t / DT + 1e-6), k1);
      if (S.pP !== cur.P || kt < S.pk) { S.pa = copy2(S.artOf(prev.art)); S.pk = 0; S.pP = cur.P; }
      for (; S.pk < kt; S.pk++) { const k = S.pk; if (k < KS) continue; const t2 = k * DT;
        if (k < K0) stirStep(S.pa, t2, cur.stir); else { if (k === K0) S.pa = { edges: [], pull: [], pulls: [] }; if (pr) progStep(S.pa, pr, t2); else step(S.pa, t2); } }
      if (pr && S.pk >= k1 && !(S.arts && S.arts[cur.art])) { S.arts = S.arts || {}; S.arts[cur.art] = copy2(S.pa); } // the pour just done is the art it ends in: kept, so the next pass needn't pour it again to rest on it
    },
    /** the latte art, in the surface's units: the layers from the first poured out to the last in, foam and crema in
     *  turn, each foam's edge going caramel where it meets the crema, as poured milk does; the pull-through's thread */
    lay(art, a, foam) {
      const path = pts => { g.beginPath(); pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.closePath(); };
      for (const e of art.edges) {
        path(e.pts);
        if (e.foam) { g.globalAlpha = a * .5; g.strokeStyle = "#B98556"; g.lineWidth = .05; g.stroke(); g.globalAlpha = a; g.strokeStyle = "#D9B48A"; g.lineWidth = .022; g.stroke(); g.fillStyle = foam; g.fill(); }
        else { g.globalAlpha = a; g.fillStyle = "#7A4526"; g.fill(); g.globalAlpha = a * .7; g.strokeStyle = "#9A6440"; g.lineWidth = .014; g.stroke(); }
      }
      const pl = art.pull; if (pl.length > 1) { g.globalAlpha = a; g.lineCap = "round"; g.strokeStyle = "#F7EBD6"; for (let i = 1; i < pl.length; i++) { g.lineWidth = lerp(.034, .01, i / pl.length); g.beginPath(); g.moveTo(pl[i - 1][0], pl[i - 1][1]); g.lineTo(pl[i][0], pl[i][1]); g.stroke(); } }
      for (const th of art.pulls || []) if (th.length > 1) { const w = th.w || [.034, .01]; g.globalAlpha = a; g.lineCap = "round"; g.strokeStyle = "#F7EBD6"; for (let i = 1; i < th.length; i++) { g.lineWidth = lerp(w[0], w[1], i / th.length); g.beginPath(); g.moveTo(th[i - 1][0], th[i - 1][1]); g.lineTo(th[i][0], th[i][1]); g.stroke(); } } // a program's threads (b375)
      g.globalAlpha = a;
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass (b375) */
    draw(T, I, A, F, P = 0) {
      const { W, H } = S;
      g.clearRect(0, 0, W, H);
      const jump = S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A;
      const gl = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * gl; S.cy += (S.ty - S.cy) * gl; S.R += (S.tR - S.R) * gl;
      S.vis += ((S.room === 0 ? 0 : 1) - S.vis) * (jump ? 1 : 1 - Math.exp(-dt * 4));
      /** under each line, the table in shadow: the planks and the window's light step back from the words (the stage lays its pads over this) */
      const shade = () => { g.save(); g.globalCompositeOperation = "source-over"; g.globalAlpha = .82; for (const [x0, y0, x1, y1, kind] of S.raw || []) if (kind === 1) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } g.restore(); };
      if (S.vis < .01) { shade(); return; }
      const { cx, cy, R } = S, on = I > .01, L = v => lerp(1, v, I), pl = P > 0 ? S.passPlan(P) : null; // pl: what a pass after the signature deals
      g.save(); g.globalAlpha = S.vis;
      const SR = R * .92, CR = R * .6, LR = R * .52; // the saucer, the cup's rim, the cocoa's surface
      // the morning's light through a window, across the table round the cup; the leaves outside moving their shadows
      // through it; the cup's shadow in it; a cloud goes over and it dims and comes back
      const sun = 1 - .72 * (on ? (pl ? S.dimOf(pl, T) : env(T, 8.2, 9.0, 9.7, 10.7, E.sine)) * I : 0), ww = R * 4.8, wh = ww * 184 / 280, gust = pl && pl.lt === 2 && on ? env(T, pl.c0, pl.c0 + .5, pl.c0 + 1.6, pl.c0 + 2.6, E.sine) * I : 0;
      g.save(); g.translate(cx + R * .3, cy + R * .12); g.rotate(-.16 + Math.sin(A * .05) * .02); g.globalAlpha = S.vis * .62 * sun; g.drawImage(S.win, -ww / 2, -wh / 2, ww, wh);
      g.globalCompositeOperation = "destination-out"; for (const l of S.leaves) { const z = l.s * R * 2, x = l.u * R + Math.sin(A * l.f + l.ph) * R * .12 + (gust ? gust * Math.sin(A * l.f * 6 + l.ph) * R * .1 : 0), y = l.v * R + Math.sin(A * l.f * .8 + l.ph * 2) * R * .07 + (gust ? gust * Math.sin(A * l.f * 5 + l.ph * 2) * R * .06 : 0); g.globalAlpha = l.a; g.drawImage(S.soft, x - z / 2, y - z / 2, z, z * .8); }
      if (pl && pl.lt === 1 && on && T > pl.c0 && T < pl.c0 + 1.7) S.birdShadow(T - pl.c0, R, I); // a bird's shadow flits across the light (b375)
      g.restore(); g.save(); g.globalCompositeOperation = "destination-out"; g.globalAlpha = .92; g.translate(cx + R * .22, cy + R * .3); g.rotate(.9); g.drawImage(S.soft, -SR * 1.25, -SR * 1.05, SR * 2.5, SR * 2.1); g.restore(); /* the cup's shadow: the light taken away */
      g.globalCompositeOperation = "destination-out"; for (const [y0, y1] of [[0, S.pr ? 150 : 110], [H, H - (S.pr ? 120 : 130)]]) { const eg = g.createLinearGradient(0, y0, 0, y1); eg.addColorStop(0, "#000"); eg.addColorStop(.45, "#000"); eg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = eg; g.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)); } g.globalCompositeOperation = "source-over"; /* nor into the shadow at the top and the foot */
      shade();
      let gr;
      // shadows on the table, the saucer, its rim
      g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(cx + R * .06, cy + R * .09, SR * 1.02, SR * 1.02, 0, 0, TAU); g.fill();
      gr = g.createRadialGradient(cx - SR * .3, cy - SR * .35, SR * .1, cx, cy, SR); gr.addColorStop(0, "#FBF6EE"); gr.addColorStop(.7, "#E9DFD0"); gr.addColorStop(1, "#C9BBA6");
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, SR, 0, TAU); g.fill();
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = SR * .02; g.beginPath(); g.arc(cx, cy, SR * .97, Math.PI * 1.05, Math.PI * 1.65); g.stroke();
      g.strokeStyle = "rgba(120,95,70,.25)"; g.lineWidth = SR * .03; g.beginPath(); g.arc(cx, cy, SR * .76, 0, TAU); g.stroke();
      // the beans on the table
      for (const b of S.beans) { const bx = cx + b.u * R, by = cy + b.v * R, s = R * .06; g.save(); g.translate(bx, by); g.rotate(b.a); gr = g.createRadialGradient(-s * .3, -s * .3, s * .1, 0, 0, s); gr.addColorStop(0, "#7A4A2A"); gr.addColorStop(1, "#2E170C"); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, s, s * .68, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(20,8,4,.8)"; g.lineWidth = s * .12; g.beginPath(); g.moveTo(-s * .7, 0); g.quadraticCurveTo(0, s * .25, s * .7, 0); g.stroke(); g.restore(); }
      // the spoon, resting on the saucer
      g.save(); g.translate(cx - SR * .62, cy + SR * .5); g.rotate(-.75); gr = g.createLinearGradient(0, -R * .03, 0, R * .03); gr.addColorStop(0, "#F0F0F4"); gr.addColorStop(.5, "#A9AAB4"); gr.addColorStop(1, "#E4E4EA");
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, R * .09, R * .055, 0, 0, TAU); g.fill(); g.fillRect(R * .08, -R * .012, R * .4, R * .024); g.restore();
      // the cup: its shadow on the saucer, its handle, its rim, the wall inside
      g.fillStyle = "rgba(90,60,35,.3)"; g.beginPath(); g.arc(cx + R * .04, cy + R * .06, CR * 1.02, 0, TAU); g.fill();
      g.save(); g.translate(cx, cy); g.rotate(.62); gr = g.createLinearGradient(CR, 0, CR + R * .26, 0); gr.addColorStop(0, "#EDE5D8"); gr.addColorStop(1, "#C8BBA8"); g.strokeStyle = gr; g.lineWidth = R * .075; g.beginPath(); g.ellipse(CR + R * .1, 0, R * .13, R * .1, 0, -1.9, 1.9); g.stroke(); g.restore();
      gr = g.createRadialGradient(cx - CR * .35, cy - CR * .4, CR * .2, cx, cy, CR); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(.8, "#EFE7DA"); gr.addColorStop(1, "#CDBFAC"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, CR, 0, TAU); g.fill();
      gr = g.createRadialGradient(cx + LR * .15, cy + LR * .2, LR * .7, cx, cy, LR * 1.08); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(60,35,20,.4)"); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, LR * 1.08, 0, TAU); g.fill();
      g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = R * .012; g.beginPath(); g.arc(cx, cy, CR * .985, Math.PI * 1.1, Math.PI * 1.55); g.stroke();
      // the cocoa's surface: poured, stepped to the loop's time; when the list is touched it settles back to the heart
      const stir = on ? seg(T, .4, 2.2, E.io) * I : 0, milky = on ? env(T, .4, 2.2, 2.4, 4.0) * I : 0;
      g.save(); g.beginPath(); g.arc(cx, cy, LR * .995, 0, TAU); g.clip();
      gr = g.createRadialGradient(cx - LR * .2, cy - LR * .25, LR * .05, cx, cy, LR); gr.addColorStop(0, `rgb(${lerp(110, 150, milky) | 0},${lerp(64, 98, milky) | 0},${lerp(38, 62, milky) | 0})`); gr.addColorStop(.75, "#4A2918"); gr.addColorStop(1, "#8A5A38");
      g.fillStyle = gr; g.fillRect(cx - LR, cy - LR, LR * 2, LR * 2); /* the cocoa, milkier where it's been stirred, its crema at the wall */
      g.translate(cx, cy); g.scale(LR, LR);
      const foam = g.createRadialGradient(-.16, -.2, .04, 0, .05, .75); foam.addColorStop(0, "#FFF9EE"); foam.addColorStop(.65, "#F6E7CF"); foam.addColorStop(1, "#E8CFA8");
      if (!pl) {
        const still = T < KS * DT || T >= K1 * DT, img = S.heartImg(LR); /* before the stir and after the pour the surface is the heart */
        if (on) { S.sim(T); if (still) { g.globalAlpha = S.vis; g.drawImage(img, -1, -1, 2, 2); } else S.lay(S.art, S.vis * (T >= KS * DT && T < POUR0 ? 1 - seg(T, 1.2, 2.25, E.in) * I : 1), foam); } /* stirred in, the old art goes */
        if (I < .99) { g.globalAlpha = S.vis * (1 - (on ? I : 0)); g.drawImage(img, -1, -1, 2, 2); }
        g.globalAlpha = S.vis;
        // the stream, seen from above, where it lands; rings spreading from it
        const pz = pourIs(T); if (on && pz >= 0) { const [px2, py2] = pourAt(T); g.globalAlpha = S.vis * I; for (let q = 0; q < 3; q++) { const rr = ((A * 1.6 + q / 3) % 1) * .2; g.strokeStyle = `rgba(250,240,222,${(.45 * (1 - rr / .2)).toFixed(3)})`; g.lineWidth = .012; g.beginPath(); g.arc(px2, py2, rr, 0, TAU); g.stroke(); } g.fillStyle = "#FFF9EE"; g.beginPath(); g.arc(px2, py2, T > 5.25 ? .035 : .06, 0, TAU); g.fill(); }
      } else S.surface(pl, T, I, A, on, LR, foam); // a pass after the signature: its own pour over the art the pass before left (b375)
      // cinnamon, dusted on
      if (!pl) {
        for (const d of S.dust) { const k = L(T < 2.3 ? 1 - stir : T >= d.t ? 1 : 0); if (k <= .01) continue; g.globalAlpha = S.vis * k; g.fillStyle = "rgba(140,70,30,.55)"; g.fillRect(d.u - d.s / 2, d.v - d.s / 2, d.s, d.s); } g.globalAlpha = S.vis;
      } else S.dusts(pl, T, I, on, stir);
      // the marshmallows: dropped in, bobbing, drifting round, melting
      if (!pl) {
        if (on) for (const m of S.mallows) { const k = seg(T, m.t, m.t + .45, E.in), melt = seg(T, 11.5, 14.3, E.io); if (k <= 0 || melt >= 1) continue; const drift = (T - m.t) * .12, a = Math.atan2(m.v, m.u) + drift, d = Math.hypot(m.u, m.v), u = Math.cos(a) * d, v = Math.sin(a) * d, sc = lerp(2.4, 1, k) * (1 - melt * .6), s = .15 * sc, bob = Math.sin(A * 3 + m.ph) * .01;
          if (k >= 1) { const rp = clamp((T - m.t - .45) / .8); if (rp < 1) { g.strokeStyle = `rgba(243,228,204,${(.6 * (1 - rp)).toFixed(3)})`; g.lineWidth = .014; g.beginPath(); g.arc(u, v, .12 + rp * .25, 0, TAU); g.stroke(); } }
          g.save(); g.translate(u, v + bob); g.rotate(m.rot + drift * 2); g.globalAlpha = S.vis * I * (1 - melt * .5); gr = g.createLinearGradient(-s, -s, s, s); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(1, melt > .3 ? "#F6E9D8" : "#F4DCDF"); g.fillStyle = gr; g.beginPath(); g.roundRect(-s / 2, -s / 2, s, s, s * (.22 + melt * .3)); g.fill(); g.strokeStyle = "rgba(160,120,100,.3)"; g.lineWidth = .008; g.stroke(); g.restore(); }
      } else S.mallowsOf(pl, T, I, A, on);
      // the finale: small foam hearts bloom round the big one
      if (F >= 0) for (const m of S.minis) { const k = seg(F, m.t, m.t + .25, E.back), s = .1 * k * (1 - seg(F, .85, 1)); if (s <= 0) continue; g.globalAlpha = S.vis; g.fillStyle = FOAM; g.beginPath(); shape(s, 0, 1, 0, 0, 32).forEach(([u, v], j) => j ? g.lineTo(m.u + u, m.v + v) : g.moveTo(m.u + u, m.v + v)); g.closePath(); g.fill(); }
      g.restore();
      if (pl && pl.paw && on) S.pawAt(pl, T, I, cx, cy, R); // the rare one: a cat's paw reaching in from the edge (b375)
      // the steam, curling up off it; stronger at first and in the finale, a heart in the finale
      const hot = .55 + (on ? env(T, 11.5, 12.5, 14, 15) * .45 * I : 0) + (F >= 0 ? .5 : 0);
      g.lineCap = "round"; for (let w = 0; w < 3; w++) { const ph = w * 1.7, y0 = cy - LR * .3, rise = R * 1.05, pts = Array.from({ length: 26 }, (_, i) => { const t = i / 25, sway = Math.sin(t * 5.5 - A * 1.4 + ph) * R * .09 * t + Math.sin(t * 2.2 + A * .5 + ph) * R * .05 * t; return [cx + (w - 1) * R * .17 + sway, y0 - t * rise]; });
        const fin = F >= 0 ? env(F, .1, .35, .7, 1) : 0; if (fin > 0 && w === 1) { const hs = R * .22; pts.forEach((p, i) => { const t = i / 25 * TAU, hx = 16 * Math.pow(Math.sin(t), 3) / 16, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16; p[0] = lerp(p[0], cx + hx * hs, fin); p[1] = lerp(p[1], cy - R * .75 + hy * hs, fin); }); }
        const sg = g.createLinearGradient(0, y0, 0, y0 - rise); sg.addColorStop(0, "rgba(255,246,232,0)"); sg.addColorStop(.15, "rgba(255,246,232,1)"); sg.addColorStop(1, "rgba(255,246,232,0)"); g.strokeStyle = sg;
        for (const [lw, a] of [[.2, .05], [.11, .08], [.045, .12]]) { g.globalAlpha = S.vis * a * (.7 + .6 * hot) * (1 + fin); g.lineWidth = R * lw; g.beginPath(); pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.stroke(); } }
      // motes in the light, drifting, catching it
      g.globalCompositeOperation = "lighter"; g.fillStyle = "#FFE2B8";
      for (const m of S.motes) { const u = m.u + Math.sin(A * m.dr * 3 + m.ph) * .25, v = m.v - ((A * m.dr + m.ph) % 3.2), vv = v < -1.6 ? v + 3.2 : v, x = cx + u * R, y = cy + vv * R, d = Math.hypot(u, vv) / 1.9; if (d >= 1 || (S.raw || []).some(q => x > q[0] - 8 && x < q[2] + 8 && y > q[1] - 8 && y < q[3] + 8)) continue; /* never behind the words */ const a = (1 - d) * (.25 + .5 * Math.pow(.5 + .5 * Math.sin(A * m.f * 2 + m.ph), 3)) * sun; g.globalAlpha = S.vis * a; g.beginPath(); g.arc(x, y, m.s, 0, TAU); g.fill(); }
      g.globalCompositeOperation = "source-over";
      g.restore();
    },
  };
  return S;
}
