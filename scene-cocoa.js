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
//
// 1.12 b416: the egg. Every twelfth pass (K.egg: three minutes of the list left alone) the spoon stirs and the new art
// is poured as on any pass, and then, in place of what drops in and what crosses the window's light, a little cat of milk
// foam rises out of the cup, the way a barista builds one up out of a cup's foam: the art's foam draws up into a dome,
// ears prick up, a sleepy face; it climbs to the rim and hooks its paws over it, its tail curling up out of the foam
// behind it; it opens its eyes, looks one way and the other, tilts its head at you and gives you a slow blink (the way a
// cat says it's fond of you), a small mew, an ear flicked; then it lets go and slides back down into the cup, the foam
// closes over it in rings, and the art comes back together as it was. It peeks out on the side away from the words. The
// pass's dusting falls after it, so the pass ends on the very picture the next one starts from.
//
// 1.12 b427: the long day's hour eggs. Once in each hour of the list left alone (K.long), one of two, by turns, plays while
// the spoon stirs and the new art is poured as on any pass, in place of what drops in and what crosses the window's
// light. The first, a dragon of steam: the spoon winds the cup's steam up into a column and the dragon comes up out of
// the cocoa in it — antlers, a mane, long whiskers, an eye like an ember — hooks over the top, flies once round the cup
// while the pour opens, and coils beside it on the side away from the words; it lifts its head to look at you, blinks
// slowly, blows two smoke rings, and goes away up in a spiral, coming apart into steam from its tail, and the cup's own
// steam comes back. The second, a blue tit, after the ones that learned to open the milk on the doorstep for its cream:
// it flies in over the table from the side away from the words and lands on the saucer's rim, watches the pour, hops up
// onto the cup, takes the foam in two sips, comes up with some on its beak and shakes it off into the cup, cocks its head
// at you and is gone the way it came. The pass's dusting falls after either, so it ends where the next pass starts.
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

  /* ---------------- 1.12 b427: the long day's hour eggs ---------------- */
  /** Hour egg 1, the dragon: its flight, in the cup's radii about its middle (y down), worked out for where the cup is —
   *  up out of the cocoa in its steam (no higher than the words above leave room for), a hook over the top toward the open
   *  side, down and once round the cup a little outside the saucer and out to rest beyond it on the side away from the
   *  words (`side` 1 the right, -1 the left), then up and away — as points along a smooth curve through these, with the
   *  length to each, and where on it the head comes to rest */
  const drgPath = (th, room) => {
    const sd = Math.cos(th) >= 0 ? 1 : -1, v = clamp((room - .45) / .88, .4, 1), deg = Math.PI / 180;
    const key = [[0, .14], [.01 * sd, -.2 * v], [-.03 * sd, -.46 * v], [.02 * sd, -.66 * v], [.14 * sd, -.86 * v], [.36 * sd, -.9 * v], [.53 * sd, -.72 * v], [.64 * sd, -.47 * v]];
    const a0 = Math.atan2(-.47 * v, .64 * sd), aE = (() => { let e = th; while ((e - a0) * sd < 2 * Math.PI) e += 2 * Math.PI * sd; while ((e - a0) * sd >= 4 * Math.PI) e -= 2 * Math.PI * sd; return e; })(); // round once, and on to the open side
    const off = .1 + .12 * (1 - clamp((room - .9) / .6)), co = [Math.cos(th) * off, Math.sin(th) * off], n = Math.ceil(Math.abs(aE - a0) / (12 * deg)); // round a circle set a little toward the open side, so it keeps off the words (the more so the less room they leave)
    for (let i = 1; i <= n; i++) { const a = a0 + (aE - a0) * i / n, out = clamp(1 - (aE - a) * sd / (100 * deg)), r = .97 + .15 * out * out * (3 - 2 * out), w = clamp(i / 3); key.push([co[0] * w + Math.cos(a) * r, co[1] * w + Math.sin(a) * r]); }
    const restK = key.length - 1, rp = key[restK], tg = [-Math.sin(aE) * sd, Math.cos(aE) * sd]; // then on a little the way it was going, and up and away into the air
    key.push([rp[0] + tg[0] * .22, rp[1] + tg[1] * .22]); for (const [f, g2] of [[.1, .3], [.36, .62], [.4, .98], [.18, 1.28], [-.04, 1.62]]) key.push([rp[0] + tg[0] * .22 + sd * f, rp[1] + tg[1] * .22 - g2]);
    const pts = [];
    for (let i = 0; i < key.length - 1; i++) { const p0 = key[Math.max(0, i - 1)], p1 = key[i], p2 = key[i + 1], p3 = key[Math.min(key.length - 1, i + 2)];
      for (let k = 0; k < 8; k++) { const t = k / 8, t2 = t * t, t3 = t2 * t, cr = j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3); pts.push([cr(0), cr(1)]); } }
    pts.push(key[key.length - 1]);
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, L, rest: L[restK * 8], end: L[L.length - 1], sd };
  };
  /** where on a flight a length along it is: [x, y, the way it heads] */
  const drgAt = (D, s) => { const { pts, L } = D; s = clamp(s, 0, L[L.length - 1]); let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m; else hi = m; } const f = (s - L[lo]) / ((L[hi] - L[lo]) || 1), a = pts[lo], b = pts[hi]; return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0])]; };
  /** its beats, in the pass's seconds: the steam thickens as the spoon goes round (`gather`), and the dragon comes up out
   *  of it and flies (`fly`), once round the cup as the new pour opens, to coil round it (`rest`); it lifts its head to look
   *  at you (`look`), blinks slowly, blows a smoke ring (`ring`); it goes away up in a spiral (`away`), coming apart into
   *  steam (`fade`), the cup's own steam coming back (`back`); the pass's dusting falls after it, `dust` seconds late */
  const DB = { gather: [.3, 1.4], fly: [1.15, 6.3], rest: [6.3, 9.6], look: [6.7, 7.1], blink: 7.6, ring: [8.1, 9.4], away: [9.6, 12.0], fade: [10.6, 12.1], back: [11.2, 12.7], dust: 3.15, LB: 3.4 };
  /** Hour egg 2, the blue tit, after the ones that learned to open the milk on doorsteps for its cream: its beats, in the
   *  pass's seconds — in over the light from the side away from the words (`in`), down on the saucer's rim; it watches the
   *  pour (`watch`), hops up onto the cup (`hop`), takes the foam in two sips (`sips`), comes up with some on its beak
   *  (`foam`), shakes it off (`shake`), cocks its head at you (`cock`) and is off the way it came (`off`) */
  const TS = 1.9; // the tit's size: its own units to the cup's radii
  const TB = { in: [.7, 2.15], fold: [2.1, 2.45], watch: [2.45, 6.0], hops: [3.3, 4.6], hop: [6.05, 6.45], sips: [6.6, 7.55], foam: [8.0, 9.3], shake: [8.45, 8.85], cock: [9.15, 9.75], off: [9.9, 11.1], dust: 3.15 };

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
      if (K.egg(P)) { S.pl = S.eggPlanOf(P); S.plP = P; return S.pl; } // b416: every twelfth pass, the egg
      { const L = K.long(P); if (L === 1 || L === 2) { S.pl = S.hourPlanOf(P, L); S.plP = P; return S.pl; } } // b427: once an hour, an hour egg
      const cur = planOf(P), prev = planOf(P - 1), pr = PROGS[cur.art], end = pr ? pr.end : 5.8, r = rng(cur.seed + 7), t0 = Math.max(6.25, end + .4);
      const n = [3, 5, 9, 0][cur.drop], small = cur.drop === 2, o = r() * TAU;
      const mallows = Array.from({ length: n }, (_, i) => { const a = o + i / Math.max(1, n) * TAU + (r() - .5) * .6, d = small ? .2 + r() * .34 : .22 + r() * .22; return { u: Math.cos(a) * d, v: Math.sin(a) * d, rot: r() * TAU, t: t0 + i * (small ? .08 : .4) + r() * .08, ph: r() * TAU, s: small ? .06 + r() * .025 : .14 + r() * .025, pink: r() < .45 }; });
      S.pl = { P, cur, prev, end, mallows, lt: cur.light, c0: 8.0 + r() * 1.3, deep: .55 + r() * .4, paw: pawP(P) }; S.plP = P;
      return S.pl;
    },
    /** 1.12 b416: the egg's pass. It pours as any pass pours (the art the pass before left stirred away, this pass's poured
     *  in its place), and then, instead of what drops in and what crosses the window's light, the cat (see `catAt`); its
     *  dusting comes after it, so the pass ends where the next one starts. `te` when the cat starts, `k` how its six seconds
     *  are squeezed if the pour ran long (the swan's), `dust` how much later than a pass's the dusting falls */
    eggPlanOf(P) {
      const cur = planOf(P), prev = planOf(P - 1), pr = PROGS[cur.art], still = (pr ? pr.k1 : K1) * DT, te = Math.max(6.45, still + .35), dur = Math.min(6.2, 13.1 - te);
      return { P, cur, prev, end: pr ? pr.end : 5.8, mallows: [], lt: -1, c0: 0, deep: 0, paw: false, egg: { te, k: dur / 6.2, dust: Math.min(te + dur + .15, 13.3) - 9.0 } };
    },
    /** which way the cat peeks out: away from the words, and down the page if it can, so its face stays the right way up */
    eggDir() {
      const { cx, cy } = S, key = Math.round(cx) + "," + Math.round(cy) + ":" + (S.raw ? S.raw.length : 0); if (S.eggD && S.eggD.key === key && S.eggD.raw === S.raw) return S.eggD.a;
      let near = null, nd = 1e9; for (const [x0, y0, x1, y1] of S.raw || []) { const qx = clamp(cx, x0, x1), qy = clamp(cy, y0, y1), d = Math.hypot(qx - cx, qy - cy); if (d < nd) { nd = d; near = [qx, qy]; } }
      const ax = near && nd > 1 ? (cx - near[0]) / nd : 0, ay = near && nd > 1 ? (cy - near[1]) / nd : 1, a = clamp(Math.atan2(ay + .9, ax), .45, Math.PI - .45);
      S.eggD = { key, raw: S.raw, a }; return a;
    },
    /** 1.12 b427: an hour egg's pass (K.long: one pass in each hour of the list left alone, 1 and 2 by turns). It stirs and
     *  pours as any pass does, and the egg plays over it in place of what drops in and what crosses the window's light; its
     *  dusting falls after the egg, `dust` seconds late, so the pass ends on the very picture the next one starts from */
    hourPlanOf(P, which) {
      const cur = planOf(P), prev = planOf(P - 1), pr = PROGS[cur.art];
      return { P, cur, prev, end: pr ? pr.end : 5.8, mallows: [], lt: -1, c0: 0, deep: 0, paw: false, hour: { which, dust: which === 1 ? DB.dust : TB.dust } };
    },
    /** a puff of steam, soft, in a colour, drawn once */
    puffS(c = [255, 248, 236]) { const key = "pf" + c.join(","); if (!S[key] || S[key].k !== px) { S[key] = make(64, 64, x => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${c},1)`); gr.addColorStop(.35, `rgba(${c},.62)`); gr.addColorStop(.7, `rgba(${c},.18)`); gr.addColorStop(1, `rgba(${c},0)`); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); }); S[key].k = px; } return S[key]; },
    /** hour egg 1: how much of the cup's own steam shows — thicker as the spoon winds it up, gone into the dragon, back after */
    dragonSteam(T, I) { return lerp(1, (1 + .8 * env(T, DB.gather[0], DB.gather[0] + .5, DB.gather[1] - .3, DB.gather[1])) * (1 - seg(T, DB.gather[1] - .4, DB.gather[1] + .5) * (1 - seg(T, DB.back[0], DB.back[1]))), I); },
    /** hour egg 1: the dragon's flight for where the cup sits now (made again when it moves): the words above it say how
     *  high it may hook over, the side away from them where it comes to rest */
    drgFlight() {
      const { cx, cy, R } = S, key = [cx, cy, R].map(Math.round).join(",") + ":" + (S.raw ? S.raw.length : 0);
      if (S.dp && S.dp.key === key && S.dp.raw === S.raw) return S.dp;
      let top = null; for (const [x0, , x1, y1] of S.raw || []) if (x1 > cx - R && x0 < cx + R && y1 < cy) top = top === null ? y1 : Math.max(top, y1);
      return (S.dp = Object.assign(drgPath(S.eggDir(), top === null ? 3 : (cy - top) / R), { key, raw: S.raw }));
    },
    /** hour egg 1: how far along its flight the dragon's head is at T */
    drgHead(D, T) { return T < DB.rest[0] ? D.rest * E.io(seg(T, DB.fly[0], DB.rest[0], z => z)) : T < DB.away[0] ? D.rest : lerp(D.rest, D.end, E.in(seg(T, DB.away[0], DB.away[1], z => z))); },
    /** Hour egg 1 at T: the dragon of steam. The spoon winds the cup's steam up into a column and the dragon comes up out
     *  of the cocoa in it, hooks over the top and flies once round the cup while the new pour opens, and coils beside it on
     *  the side away from the words; it lifts its head to look at you, blinks slowly, blows a smoke ring, and goes away up,
     *  coming apart into steam from its tail. Drawn in the cup's radii: its body soft puffs of steam along its flight, grey
     *  along its belly as a cloud is, edged, with a ripple running down it; fins, legs and a tufted tail; its head a solid
     *  shape of steam in profile, kept the right way up (it turns over as it heads up or down), antlers, a mane, whiskers,
     *  an eye like an ember; its shadow under it; wisps peeling off it and drifting up */
    dragonAt(pl, T, I, A, cx, cy, R) {
      const kk = I * S.vis, k = kk * env(T, DB.fly[0] - .1, DB.fly[0] + .45, DB.fade[0], DB.fade[1]), vx = kk * env(T, DB.gather[0] + .2, DB.gather[1] - .25, DB.fly[0] + .25, DB.fly[0] + .85);
      if (k <= .004 && vx <= .004) return;
      const D = S.drgFlight(), sh = S.drgHead(D, T), LB = DB.LB, pf = S.puffS(), pg = S.puffS([168, 150, 140]), N = 72, fq = seg(T, DB.fade[0] - .5, DB.fade[1], z => z), rest = env(T, DB.rest[0] - .4, DB.rest[0] + .2, DB.away[0], DB.away[0] + .4);
      const OUT = [92, 70, 58], WH = [255, 251, 245], col = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;
      const flip = a => clamp(Math.cos(a) * 2.6, -1, 1), wd = s => (s < .14 ? lerp(.062, .07, s / .14) : s < .75 ? lerp(.07, .098, E.sine((s - .14) / .61)) : .084 * Math.pow(1 - (s - .75) / (LB - .75), .9) + .014) * (1 + .16 * Math.sin(s * 13 + 1.3) * Math.min(1, s / .3) + .08 * Math.sin(s * 29)); // full in the body, lumpy as a cloud, thin to its tail
      const puff = (x, y, r, a, sp = pf) => { if (a <= .002) return; g.globalAlpha = a; g.drawImage(sp, x - r, y - r, r * 2, r * 2); };
      const q2 = (p0, p1, p2, n = 10) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; });
      const path = pts => { g.beginPath(); pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); };
      const line = (c, a, w, pts) => { if (a <= .002) return; g.globalAlpha = 1; g.strokeStyle = col(c, a); g.lineWidth = w; path(pts); g.stroke(); };
      const tube = (p0, p1, p2, w0, w1 = 0, n = 10) => { const c = q2(p0, p1, p2, n), Lf = [], Rt = []; c.forEach((q, i) => { const a = c[Math.max(0, i - 1)], b2 = c[Math.min(n, i + 1)], dx = b2[0] - a[0], dy = b2[1] - a[1], l = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / n); Lf.push([q[0] - dy / l * w, q[1] + dx / l * w]); Rt.push([q[0] + dy / l * w, q[1] - dx / l * w]); }); return [...Lf, ...Rt.reverse()]; };
      const shape = (pts, fill, a, lw) => { if (a <= .002) return; g.globalAlpha = 1; path(pts); g.closePath(); g.fillStyle = col(fill, .9 * a); g.fill(); g.strokeStyle = col(OUT, .6 * a); g.lineWidth = lw; g.stroke(); };
      g.save(); g.translate(cx, cy); g.scale(R, R); g.lineCap = "round"; g.lineJoin = "round"; const px1 = 1 / R; // a CSS pixel, in the cup's radii
      for (let j = 0; j < 12 && vx > .004; j++) { const a = A * 4.6 + j * .95, h = .1 + j * .07, r = .07 + .05 * Math.sin(j * .8 + A); puff(Math.cos(a) * r * (1 + j * .06), -h + Math.sin(a) * r * .3, .1 + j * .006, vx * .16 * (1 - j / 14)); } // the steam wound up into a column as the spoon goes round
      if (k > .004) {
        const body = []; for (let i = 0; i <= N; i++) { const s = i / N * LB, sig = sh - s; if (sig < 0) break; const [x, y, a] = drgAt(D, sig), n = [-Math.sin(a), Math.cos(a)], und = (.024 * (1 - rest) + .009 * rest) * Math.sin(s * 5.5 - A * 4.6) * Math.min(1, s / .2), e = clamp(sig / .35), lo = .55 * (1 - s / LB);
          body.push({ s, x: x + n[0] * und, y: y + n[1] * und, a, n, w: wd(s), fl: flip(a), al: e * e * (3 - 2 * e) * (1 - seg(fq, lo, lo + .45)) }); }
        const dor = b => [-b.n[0] * b.fl, -b.n[1] * b.fl], at = (b, f) => { const d = dor(b); return [b.x + d[0] * b.w * f, b.y + d[1] * b.w * f]; }, av = body.length ? body.reduce((m, b) => m + b.al, 0) / body.length : 0;
        for (const b of body) puff(b.x + .05, b.y + .08, b.w * 1.6, k * b.al * .1, S.soft); // its shadow, on the saucer and the table
        for (const b of body) puff(b.x, b.y, b.w * 2.3, k * b.al * .07); // a glow round it,
        for (const b of body) { const [u, v] = at(b, -.48); puff(u, v, b.w * .95, k * b.al * .15, pg); } // grey along its belly,
        for (const b of body) { const [u, v] = at(b, .12); puff(u, v, b.w * 1.25, k * b.al * .28); } // and white over it
        if (body.length > 2) { line(OUT, k * .42 * av, 1.4 * px1, body.map(b => at(b, -.92))); line(WH, k * .6 * av, 1.3 * px1, body.map(b => at(b, .88))); } // edged: its belly darker, its back catching the light
        body.forEach((b, i) => { if (i < 4 || i % 5 || b.s > LB * .86 || b.al < .5) return; const dx = Math.cos(b.a), dy = Math.sin(b.a), b0 = at(b, .78), tp = at(b, 1.75); // fins along its back, like flames
          shape([[b0[0] - dx * .028, b0[1] - dy * .028], [tp[0] - dx * .06, tp[1] - dy * .06], [b0[0] + dx * .022, b0[1] + dy * .022]], WH, k * b.al * .8, 1.1 * px1); });
        for (const ls of [.62, 1.72]) { const b = body[Math.round(ls / LB * N)]; if (!b) continue; const dx = Math.cos(b.a), dy = Math.sin(b.a), d = dor(b), hip = at(b, -.65), knee = [hip[0] - d[0] * .07 - dx * .02, hip[1] - d[1] * .07 - dy * .02], ft = [knee[0] - d[0] * .025 - dx * .06, knee[1] - d[1] * .025 - dy * .06], a2 = k * b.al; // its legs, tucked back as it flies
          if (b.al < .3) continue; shape(tube(hip, [lerp(hip[0], knee[0], .6) - dx * .015, lerp(hip[1], knee[1], .6) - dy * .015], knee, .03, .016, 8), WH, a2 * .9, 1.2 * px1); shape(tube(knee, [lerp(knee[0], ft[0], .5), lerp(knee[1], ft[1], .5)], ft, .016, .011, 6), WH, a2 * .9, 1.1 * px1); // its legs, tucked back as it flies: a haunch, a shin,
          for (const c of [-.7, 0, .7]) { const cl = [ft[0] - dx * .04 + d[0] * c * .03, ft[1] - dy * .04 + d[1] * c * .03], mid = [lerp(ft[0], cl[0], .5) - d[0] * .01, lerp(ft[1], cl[1], .5) - d[1] * .01]; line(OUT, a2 * .7, 2.6 * px1, q2(ft, mid, cl, 4)); line(WH, a2 * .9, 1.4 * px1, q2(ft, mid, cl, 4)); } } // and three claws
        const tb = body[body.length - 1]; if (tb && tb.s > LB * .95) { const dx = Math.cos(tb.a), dy = Math.sin(tb.a); for (let m = -1; m <= 1; m++) shape(tube([tb.x, tb.y], [tb.x - dx * .06 + tb.n[0] * m * .03, tb.y - dy * .06 + tb.n[1] * m * .03], [tb.x - dx * .13 + tb.n[0] * m * .07 + Math.sin(A * 3 + m) * .012, tb.y - dy * .13 + tb.n[1] * m * .07], .022, 0, 8), WH, k * tb.al * .75, 1 * px1); } // the tuft at its tail
        for (let j = 0; j < 30; j++) { const t0 = DB.fly[0] + .3 + j * .36, age = T - t0; if (age < 0 || age > 1.3) continue; const s = (j * .61) % (LB * .9), sig = S.drgHead(D, t0) - s; if (sig < .2) continue; const [x, y] = drgAt(D, sig), up = age * .3, cu = Math.sin(age * 4.5 + j) * .04 * age, a = k * (1 - age / 1.3) * .5 * (1 - seg(fq, .6, 1));
          puff(x + cu, y - up, .045 + age * .05, a * .22); line(WH, a * .5, 1 * px1, q2([x + cu * .5, y - up * .6], [x + cu * 2 + .03, y - up * .85], [x + cu, y - up - .05], 6)); } // wisps peeling off it, drifting up
        if (body.length && sh > .08) { const h = body[0], fl = h.fl < 0 ? Math.min(-.3, h.fl) : Math.max(.3, h.fl), look = -.34 * env(T, DB.look[0], DB.look[1], DB.ring[1], DB.ring[1] + .45, E.sine), hk = k * clamp((sh - .08) / .4), hs = lerp(.55, 1, seg(T, DB.fly[0] + .3, DB.fly[0] + 2.3, E.io)), lw = px1 / hs;
          g.save(); g.translate(h.x, h.y); g.rotate(h.a); g.scale(1, fl); g.rotate(look); g.scale(hs, hs);
          puff(.22, .06, .3, hk * .16, S.soft); // its shadow
          const open = .2 * env(T, DB.ring[0] - .25, DB.ring[0], DB.ring[0] + .3, DB.ring[0] + .55);
          const mane = (y0, len, ph, a) => shape(tube([-.04, y0], [-.04 - len * .5, y0 - .05 + Math.sin(A * 3.3 + ph) * .025], [-.04 - len, y0 + .02 + Math.sin(A * 3.3 + ph + 1) * .04], .032, 0, 10), WH, hk * a, 1.1 * lw);
          mane(.07, .2, 0, .7); mane(.03, .26, 1.2, .75); mane(-.02, .28, 2.1, .8); mane(-.065, .22, 3, .8); // its mane, streaming back
          shape(tube([.02, -.1], [-.08, -.17], [-.31, -.2], .022, .003), [224, 214, 204], hk * .8, 1.2 * lw); // its antlers, the far one first
          shape(tube([.07, -.11], [-.02, -.21], [-.26, -.29], .026, .003), WH, hk * .95, 1.3 * lw); shape(tube([-.07, -.205], [-.1, -.25], [-.13, -.31], .013, .002, 6), WH, hk * .95, 1.1 * lw);
          const C = (x0, y0) => { const c = Math.cos(open), sn = Math.sin(open); return [.15 + (x0 - .15) * c - (y0 - .02) * sn, .02 + (x0 - .15) * sn + (y0 - .02) * c]; }; // its lower jaw, hinged at the corner of its mouth
          shape([[.14, .018], [.25, .02], [.34, .022], [.378, .036], [.358, .062], [.27, .076], [.18, .076], [.11, .062]].map(([u, v]) => C(u, v)), [236, 226, 216], hk, 1.5 * lw);
          if (open > .02) shape([[.16, .02], [.37, .02], ...[[.37, .03], [.16, .03]].map(([u, v]) => C(u, v))], [96, 46, 36], hk * open * 4, .8 * lw); // the dark of its mouth as it opens
          const top = [[-.08, -.05], [-.02, -.1], [.05, -.132], [.13, -.118], [.2, -.088], [.27, -.084], [.33, -.106], [.385, -.092], [.42, -.052], [.408, -.012], [.33, -.002], [.24, .006], [.16, .016], [.1, .044], [.02, .072], [-.07, .07]]; // a short, deep head: a big brow, a bulb of a nose
          const sm = []; for (let i = 0; i < top.length; i++) { const p0 = top[(i - 1 + top.length) % top.length], p1 = top[i], p2 = top[(i + 1) % top.length], p3 = top[(i + 2) % top.length]; for (let j = 0; j < 4; j++) { const t = j / 4, t2 = t * t, t3 = t2 * t, cr = q => .5 * (2 * p1[q] + (p2[q] - p0[q]) * t + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * t2 + (3 * p1[q] - p0[q] - 3 * p2[q] + p3[q]) * t3); sm.push([cr(0), cr(1)]); } }
          const hg = g.createLinearGradient(0, -.12, 0, .08); hg.addColorStop(0, "rgba(255,252,246,.95)"); hg.addColorStop(1, "rgba(212,198,186,.92)"); path(sm); g.closePath(); g.globalAlpha = hk; g.fillStyle = hg; g.fill(); g.strokeStyle = col(OUT, .62); g.lineWidth = 1.6 * lw; g.stroke(); // its head
          line(OUT, hk * .5, 1.2 * lw, q2([.15, .016], [.1, -.012], [.05, -.04])); line(OUT, hk * .6, 1.3 * lw, q2([.355, -.086], [.375, -.07], [.36, -.058])); // its cheek, its nostril
          shape(tube([.085, -.105], [.15, -.15], [.22, -.112], .016, .004, 8), WH, hk * .95, 1.1 * lw); // a bushy brow
          for (const [x0, l] of [[.33, .024], [.27, .018]]) shape([[x0 - .008, .004], [x0, .004 + l], [x0 + .009, .004]], WH, hk, .8 * lw); // its fangs
          const bl = 1 - .9 * env(T, DB.blink, DB.blink + .14, DB.blink + .2, DB.blink + .44), ex = .15, ey = -.072, eg = g.createRadialGradient(ex, ey, 0, ex, ey, .085); eg.addColorStop(0, "rgba(255,190,90,.6)"); eg.addColorStop(1, "rgba(255,170,70,0)"); // its eye, an ember
          g.globalAlpha = hk; g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, .085, 0, TAU); g.fill();
          g.save(); g.translate(ex, ey); g.rotate(-.14); g.scale(1, bl); const ig = g.createRadialGradient(0, 0, 0, 0, 0, .034); ig.addColorStop(0, "rgb(255,216,124)"); ig.addColorStop(1, "rgb(228,126,30)"); g.fillStyle = ig; g.beginPath(); g.ellipse(0, 0, .034, .021, 0, 0, TAU); g.fill(); g.strokeStyle = col(OUT, .85); g.lineWidth = 1.3 * lw; g.stroke();
          g.fillStyle = "rgba(40,18,8,.92)"; g.beginPath(); g.ellipse(.003, 0, .006, .017, 0, 0, TAU); g.fill(); g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.arc(.012, -.008, .005, 0, TAU); g.fill(); g.restore();
          for (const [y0, ph, l] of [[-.03, 0, .7], [-.01, 1.7, .56]]) { const pts = []; for (let i = 0; i <= 26; i++) { const t = i / 26; pts.push([.39 - t * l, y0 + t * .15 + Math.sin(t * 5.5 - A * 3.1 + ph) * .05 * t]); } line(OUT, hk * .32, 3 * lw, pts); line(WH, hk * .92, 1.7 * lw, pts); } // its whiskers, from its nose, waving
          for (let m = 0; m < 3; m++) shape(tube([.2 + m * .05, .072], [.17 + m * .05, .11], [.12 + m * .05, .14 + m * .01], .014, 0, 6), WH, hk * .8, 1 * lw); // a beard
          g.restore();
          const nose = (() => { const sx = .42 * hs, lx = sx * Math.cos(look), ly = sx * Math.sin(look) * fl; return [h.x + lx * Math.cos(h.a) - ly * Math.sin(h.a), h.y + lx * Math.sin(h.a) + ly * Math.cos(h.a)]; })(), fw = Math.cos(h.a) < 0 ? -1 : 1;
          for (const [r0, big] of [[DB.ring[0], 1], [DB.ring[0] + .42, .7]]) { const rq = seg(T, r0, r0 + (DB.ring[1] - DB.ring[0]), z => z); if (rq <= 0 || rq >= 1) continue; const c = [nose[0] + fw * .16 * rq, nose[1] - .5 * E.out(rq) * big], rx = (.05 + .17 * E.out(rq)) * big, a = k * Math.pow(1 - rq, 1.1); // smoke rings, floating up and opening, the second smaller
            for (const [w, al, cc] of [[11, .1, WH], [6, .22, WH], [2.6, .4, OUT], [2, .8, WH]]) { g.globalAlpha = 1; g.strokeStyle = col(cc, a * al); g.lineWidth = w * px1; g.beginPath(); g.ellipse(c[0], c[1], rx, rx * .42, 0, 0, TAU); g.stroke(); } }
          for (let j = 0; j < 3; j++) { const t0 = DB.rest[0] + .5 + j * 1.25, age = T - t0; if (age < 0 || age > 1 || (t0 > DB.ring[0] - .3 && t0 < DB.ring[1])) continue; puff(nose[0] + fw * .02 * age, nose[1] - age * .16, .035 + age * .045, k * (1 - age) * .22); } } // and its breath, between
      }
      g.restore(); g.globalAlpha = S.vis;
    },
    /** hour egg 2: the blue tit, painted once at the cup's size, `TS` times the size of its own little units, facing +x —
     *  its back, its folded wings and its tail (`body`); its head (`head`, about its own middle): a cobalt cap ringed white,
     *  a dark stripe through each eye, white cheeks, a dark collar, a short dark beak; its right wing spread (`wing`, from
     *  the shoulder, the left one drawn mirrored) — each filled in soft gradients and feathered with short strokes */
    titSprites(R) {
      const kq = Math.round(R * px / 3); if (S.tit && S.tit.k === kq) return S.tit; // (made again only when the cup's size has changed by a few pixels)
      const U = R * TS, sp = (w, h, fn) => { const c = make(w * U, h * U, x => { x.translate(w * U / 2, h * U / 2); x.scale(U, U); x.lineCap = "round"; x.lineJoin = "round"; fn(x); }); c.uw = w; c.uh = h; return c; };
      const r = rng(6161), smooth = (pts, closed = true) => { const out = [], n = pts.length; for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; for (let j = 0; j < 5; j++) { const t = j / 5, t2 = t * t, t3 = t2 * t, cr = q => .5 * (2 * p1[q] + (p2[q] - p0[q]) * t + (2 * p0[q] - 5 * p1[q] + 4 * p2[q] - p3[q]) * t2 + (3 * p1[q] - p0[q] - 3 * p2[q] + p3[q]) * t3); out.push([cr(0), cr(1)]); } } return out; };
      const fillP = (x, pts, fill) => { x.beginPath(); pts.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); x.closePath(); x.fillStyle = fill; x.fill(); };
      const feather = (x, pts, n, cols, len, dir = Math.PI, spread = .5, w0 = .0025) => { x.save(); x.beginPath(); pts.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); x.closePath(); x.clip(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [u, v] of pts) { x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
        for (let i = 0; i < n; i++) { const u = x0 + r() * (x1 - x0), v = y0 + r() * (y1 - y0), a = dir + (r() - .5) * spread, l = len * (.6 + r() * .7); x.strokeStyle = cols[Math.floor(r() * cols.length)]; x.lineWidth = w0 * (.7 + r() * .8); x.beginPath(); x.moveTo(u, v); x.quadraticCurveTo(u + Math.cos(a) * l * .5 - Math.sin(a) * l * .12, v + Math.sin(a) * l * .5 + Math.cos(a) * l * .12, u + Math.cos(a) * l, v + Math.sin(a) * l); x.stroke(); } x.restore(); };
      const edge = (x, pts, col, w) => { x.beginPath(); pts.forEach(([u, v], i) => i ? x.lineTo(u, v) : x.moveTo(u, v)); x.closePath(); x.strokeStyle = col; x.lineWidth = w; x.stroke(); };
      const mir = pts => pts.map(([u, v]) => [u, -v]), both = half => [...half, ...mir(half).reverse()];
      const body = sp(.44, .24, x => {
        const TAIL = smooth([[-.075, .017], [-.135, .023], [-.168, .03], [-.176, .012], [-.172, -.012], [-.168, -.03], [-.135, -.023], [-.075, -.017]]), tg = x.createLinearGradient(-.175, 0, -.075, 0); tg.addColorStop(0, "#284A80"); tg.addColorStop(1, "#4A79BE");
        fillP(x, TAIL, tg); feather(x, TAIL, 40, ["rgba(150,186,236,.5)", "rgba(20,36,70,.45)"], .03, Math.PI, .15); edge(x, TAIL, "rgba(18,32,64,.5)", .003); // its tail
        const half = [[.066, .03], [.042, .063], [.0, .077], [-.04, .072], [-.072, .051], [-.09, .024]], BODY = smooth([...half, [-.097, 0], ...mir(half).reverse()]), bg = x.createRadialGradient(-.005, -.016, .006, -.008, 0, .1); bg.addColorStop(0, "#C6D266"); bg.addColorStop(.55, "#9EB246"); bg.addColorStop(1, "#6F842C");
        fillP(x, BODY, bg); for (const sg of [-1, 1]) { const fl = smooth([[.03, .054 * sg], [-.01, .075 * sg], [-.05, .068 * sg], [-.03, .058 * sg], [.0, .058 * sg]]); fillP(x, fl, "#F0CF3E"); } // its back, green, and a glimpse of its yellow sides
        feather(x, BODY, 140, ["rgba(222,232,140,.55)", "rgba(92,112,36,.5)", "rgba(180,196,84,.5)"], .018, Math.PI, .5);
        for (const sg of [-1, 1]) { const W = smooth([[.046, .031], [.034, .068], [-.02, .079], [-.068, .064], [-.108, .033], [-.098, .012], [-.055, .02], [-.008, .026], [.03, .022]].map(([u, v]) => [u, v * sg])), wg = x.createLinearGradient(.05, 0, -.12, 0); wg.addColorStop(0, "#6FA2E8"); wg.addColorStop(.38, "#4A80CC"); wg.addColorStop(.42, "#2F5EA8"); wg.addColorStop(1, "#26467C");
          fillP(x, W, wg); feather(x, W, 50, ["rgba(170,206,250,.5)", "rgba(20,40,84,.45)"], .02, Math.PI, .2); // its wing, folded: bright coverts, darker flight feathers
          x.strokeStyle = "rgba(182,210,248,.75)"; x.lineWidth = .0028; for (let i = 0; i < 4; i++) { const v0 = (.028 + i * .0105) * sg; x.beginPath(); x.moveTo(-.012, v0); x.quadraticCurveTo(-.06, v0 + .003 * sg, -.1 + i * .006, v0 * .62); x.stroke(); } // the pale edges of its flight feathers
          x.strokeStyle = "rgba(246,247,242,.92)"; x.lineWidth = .007; x.beginPath(); x.moveTo(.002, .027 * sg); x.quadraticCurveTo(-.004, .052 * sg, -.012, .074 * sg); x.stroke(); // its white wing bar
          edge(x, W, "rgba(18,34,70,.55)", .0032); }
        x.strokeStyle = "rgba(26,38,66,.85)"; x.lineWidth = .012; x.beginPath(); x.arc(.075, 0, .042, Math.PI * .6, Math.PI * 1.4); x.stroke(); }); // the dark collar its head sits in
      const head = sp(.15, .15, x => {
        const HD2 = smooth([[.06, 0], [.045, .04], [.0, .054], [-.042, .038], [-.054, 0], [-.042, -.038], [.0, -.054], [.045, -.04]]), fg = x.createRadialGradient(-.012, -.012, .008, 0, 0, .06); fg.addColorStop(0, "#FFFFFF"); fg.addColorStop(.7, "#EEF1F2"); fg.addColorStop(1, "#C9D0D6");
        fillP(x, HD2, fg); feather(x, HD2, 40, ["rgba(255,255,255,.6)", "rgba(170,180,190,.4)"], .012, Math.PI, 1.2, .002); // its white cheeks
        x.strokeStyle = "#1C2744"; x.lineWidth = .011; for (const sg of [-1, 1]) { x.beginPath(); x.moveTo(.05, .01 * sg); x.quadraticCurveTo(.022, .044 * sg, -.03, .042 * sg); x.quadraticCurveTo(-.048, .03 * sg, -.054, 0); x.stroke(); } // a dark stripe through each eye, round to its nape
        const CAP = smooth([[.04, 0], [.026, .026], [-.006, .033], [-.038, .022], [-.046, 0], [-.038, -.022], [-.006, -.033], [.026, -.026]]), cg = x.createRadialGradient(-.006, -.01, .004, -.004, 0, .042); cg.addColorStop(0, "#69A8F6"); cg.addColorStop(1, "#2B5FC0");
        edge(x, CAP, "rgba(255,255,255,.95)", .009); fillP(x, CAP, cg); feather(x, CAP, 26, ["rgba(150,200,255,.55)", "rgba(24,60,140,.45)"], .01, Math.PI, .3, .0018); // its cobalt cap, ringed white
        for (const sg of [-1, 1]) { x.fillStyle = "#0B0E12"; x.beginPath(); x.ellipse(.022, .039 * sg, .0062, .005, .3 * sg, 0, TAU); x.fill(); x.fillStyle = "rgba(255,255,255,.9)"; x.beginPath(); x.arc(.024, .037 * sg, .0018, 0, TAU); x.fill(); } // its eyes, in the stripes
        const BK = [[.052, -.009], [.08, 0], [.052, .009]]; fillP(x, BK, "#33333A"); x.strokeStyle = "rgba(210,210,220,.55)"; x.lineWidth = .002; x.beginPath(); x.moveTo(.055, -.002); x.lineTo(.077, 0); x.stroke(); }); // its beak
      const wing = sp(.36, .56, x => {
        const WG = smooth([[.012, 0], [.02, .05], [.014, .1], [-.006, .155], [-.034, .21], [-.056, .245], [-.072, .252], [-.082, .238], [-.094, .224], [-.104, .2], [-.11, .156], [-.116, .108], [-.108, .06], [-.094, .02]]), wg = x.createLinearGradient(0, 0, -.1, .12); wg.addColorStop(0, "#73A6EA"); wg.addColorStop(.42, "#4C80CA"); wg.addColorStop(.46, "#2E5CA3"); wg.addColorStop(1, "#203E70");
        fillP(x, WG, wg); feather(x, WG, 70, ["rgba(170,206,250,.45)", "rgba(16,32,70,.45)"], .03, Math.PI * .62, .25);
        x.strokeStyle = "rgba(14,26,54,.55)"; x.lineWidth = .0028; for (let i = 0; i < 8; i++) { const t = i / 7, u0 = lerp(-.04, -.012, t), v0 = lerp(.05, .2, t); x.beginPath(); x.moveTo(u0, v0); x.lineTo(u0 - .07 + t * .01, v0 + .01 + t * .04); x.stroke(); } // its flight feathers, fingered at the tip
        x.strokeStyle = "rgba(246,247,242,.8)"; x.lineWidth = .006; x.beginPath(); x.moveTo(-.008, .02); x.quadraticCurveTo(-.014, .08, -.03, .13); x.stroke(); // the white bar
        edge(x, WG, "rgba(16,30,62,.6)", .0035); });
      S.tit = { k: kq, body, head, wing }; return S.tit;
    },
    /** hour egg 2: where the tit is at T, in the cup's radii about its middle — its place, the way it faces, how high (0 on
     *  the saucer), its head's turn, reach and dip, its wings (0 folded … 1 spread, and their beat), the foam on its beak */
    titAt(pl, T, I, A, cx, cy, R) {
      const k = I * S.vis * env(T, TB.in[0], TB.in[0] + .05, TB.off[1] - .05, TB.off[1]); if (k <= .004) return;
      const th = S.eggDir(), d = [Math.cos(th), Math.sin(th)], p = [-d[1], d[0]], L0 = [d[0] * .93, d[1] * .93], L1 = [d[0] * .8, d[1] * .8];
      const bzq = (a, c, b, t) => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
      let pos, head = 0, hgt = 0, wing = 0, beat = 0, reach = 0, dip = 0, face = th + Math.PI, sc = 1;
      if (T < TB.in[1]) { const q = seg(T, TB.in[0], TB.in[1], E.out), S0 = [d[0] * 2.8 + p[0] * .8, d[1] * 2.8 + p[1] * .8], C = [d[0] * 1.6 - p[0] * .45, d[1] * 1.6 - p[1] * .45], a = bzq(S0, C, L0, q), b = bzq(S0, C, L0, Math.min(1, q + .02)); // in over the table, down onto the saucer's rim
        pos = a; face = Math.atan2(b[1] - a[1], b[0] - a[0]); hgt = 1 - q; wing = 1; beat = q < .82 ? Math.sin(T * 41) : 1; }
      else if (T < TB.hop[0]) { const h1 = env(T, TB.hops[0], TB.hops[0] + .1, TB.hops[0] + .12, TB.hops[0] + .24), h2 = env(T, TB.hops[1] - .24, TB.hops[1] - .12, TB.hops[1] - .1, TB.hops[1]), da = .16 * seg(T, TB.hops[0], TB.hops[0] + .24) - .1 * seg(T, TB.hops[1] - .24, TB.hops[1]), a = th + da; // on the rim, two little hops along it
        pos = [Math.cos(a) * .93, Math.sin(a) * .93]; face = a + Math.PI; hgt = .06 * (h1 + h2); wing = 1 - seg(T, TB.in[1], TB.fold[1], E.io); beat = 1; // its wings folding away
        const tgt = (() => { const pr = PROGS[pl.cur.art], [sx, sy, kind] = pr ? progAt(pr, T) : pourIs(T) >= 0 ? [...pourAt(T), 1] : [0, 0, 0], c = Math.cos(pl.cur.ang), s = Math.sin(pl.cur.ang); return kind ? [(sx * c - sy * s) * .52, (sx * s + sy * c) * .52] : [0, 0]; })(); // watching the pour
        const want = Math.atan2(tgt[1] - pos[1], tgt[0] - pos[0]) - face, wr = Math.atan2(Math.sin(want), Math.cos(want)); head = clamp(wr, -1.1, 1.1) * seg(T, TB.watch[0], TB.watch[0] + .3) + .25 * Math.sin(T * 1.7) * env(T, TB.watch[0], TB.watch[0] + .4, TB.watch[1] - .3, TB.watch[1]); }
      else if (T < TB.off[0]) { const q = seg(T, TB.hop[0], TB.hop[1], E.io); pos = [lerp(L0[0], L1[0], q), lerp(L0[1], L1[1], q)]; hgt = .3 * Math.sin(q * Math.PI) + .08 * q; // up onto the cup's rim
        const s1 = env(T, TB.sips[0], TB.sips[0] + .12, TB.sips[0] + .25, TB.sips[0] + .38), s2 = env(T, TB.sips[1] - .4, TB.sips[1] - .28, TB.sips[1] - .14, TB.sips[1]); dip = Math.max(s1, s2); reach = .012 * env(T, TB.sips[0] - .15, TB.sips[0], TB.sips[1], TB.sips[1] + .2) + .018 * dip; // two sips, its head tipped back to swallow between
        const back = Math.max(env(T, TB.sips[0] + .38, TB.sips[0] + .48, TB.sips[0] + .58, TB.sips[0] + .7), env(T, TB.sips[1], TB.sips[1] + .1, TB.sips[1] + .2, TB.sips[1] + .34)); sc = 1 + .05 * back - .06 * dip;
        head = .5 * Math.sin((T - TB.shake[0]) * TAU * 7.5) * env(T, TB.shake[0], TB.shake[0] + .05, TB.shake[1] - .05, TB.shake[1]) + 1.05 * env(T, TB.cock[0], TB.cock[0] + .15, TB.cock[1] - .2, TB.cock[1], E.sine) * (Math.sin(th) > 0 ? -1 : 1); }
      else { const q = seg(T, TB.off[0] + .15, TB.off[1], E.in), a = L1, C = [d[0] * 1.4 + p[0] * .5, d[1] * 1.4 + p[1] * .5], b = [d[0] * 3 - p[0] * .3, d[1] * 3 - p[1] * .3], c0 = bzq(a, C, b, q), c1 = bzq(a, C, b, Math.min(1, q + .02)); // and off, the way it came
        pos = c0; const turn = seg(T, TB.off[0], TB.off[0] + .14, E.io); face = q > .005 ? Math.atan2(c1[1] - c0[1], c1[0] - c0[0]) : th + Math.PI - turn * Math.PI * (Math.sin(th) > 0 ? 1 : -1); hgt = .08 + q * 1.3; /* round, and up and away */ sc = 1 - .06 * env(T, TB.off[0], TB.off[0] + .08, TB.off[0] + .12, TB.off[0] + .18); wing = seg(T, TB.off[0] + .1, TB.off[0] + .2); beat = Math.sin(T * 43); }
      const spr = S.titSprites(R), sz = (1 + .55 * hgt) * sc * TS;
      g.save(); g.translate(cx, cy); g.scale(R, R);
      g.globalAlpha = k * .42 * (1 - .55 * Math.min(1, hgt)); const so = [.04 + .3 * hgt, .06 + .42 * hgt], sl = .13 * sz * (1 + .4 * hgt); g.drawImage(S.soft, pos[0] + so[0] - sl, pos[1] + so[1] - sl * .7, sl * 2, sl * 1.4); // its shadow
      g.translate(pos[0], pos[1]); g.rotate(face); g.scale(sz, sz); g.globalAlpha = k;
      if (wing > .01) for (const sg of [-1, 1]) { const spn = wing * (.35 + .65 * Math.abs(beat)), w = spr.wing; g.save(); g.translate(.01, sg * .03); g.scale(1, sg * spn); g.drawImage(w, -w.uw / 2, -w.uh / 2, w.uw, w.uh); g.restore(); } // its wings, beating
      g.drawImage(spr.body, -spr.body.uw / 2, -spr.body.uh / 2, spr.body.uw, spr.body.uh);
      g.save(); g.translate(.085 + reach, 0); g.rotate(head); const hs = 1 - .08 * dip; g.scale(hs, hs); g.drawImage(spr.head, -spr.head.uw / 2, -spr.head.uh / 2, spr.head.uw, spr.head.uh); // its head
      const fm = env(T, TB.sips[1] + .05, TB.sips[1] + .15, TB.shake[0] + .12, TB.shake[0] + .16); if (fm > .01) { g.fillStyle = `rgba(250,240,222,${fm.toFixed(3)})`; g.beginPath(); g.ellipse(.07, 0, .016, .013, 0, 0, TAU); g.fill(); g.fillStyle = `rgba(255,255,255,${(fm * .8).toFixed(3)})`; g.beginPath(); g.arc(.066, -.004, .005, 0, TAU); g.fill(); } // foam on its beak
      g.restore();
      g.restore();
      const fl = seg(T, TB.shake[0] + .14, TB.shake[0] + .5, z => z); if (fl > 0 && fl < 1) { const b0 = [L1[0] - d[0] * .33, L1[1] - d[1] * .33], b1 = [L1[0] - d[0] * .58 + p[0] * .08, L1[1] - d[1] * .58 + p[1] * .08], x = cx + lerp(b0[0], b1[0], fl) * R, y = cy + (lerp(b0[1], b1[1], fl) - Math.sin(fl * Math.PI) * .12) * R; g.globalAlpha = I * S.vis; g.fillStyle = "rgba(250,240,222,.95)"; g.beginPath(); g.arc(x, y, R * .011, 0, TAU); g.fill(); } // the foam it shook off, flying back into the cup
      g.globalAlpha = S.vis;
    },
    /** hour egg 2: rings where the tit sips (in the surface's units, inside the cocoa), and where the foam it shook off lands */
    titRipples(pl, T, I, A) {
      const th = S.eggDir(), d = [Math.cos(th), Math.sin(th)], p = [-d[1], d[0]], at = [d[0] * .43 / .52, d[1] * .43 / .52], land = [(d[0] * .22 + p[0] * .08) / .52, (d[1] * .22 + p[1] * .08) / .52];
      g.lineWidth = .012;
      for (const [t0, c, big] of [[TB.sips[0] + .14, at, 1], [TB.sips[1] - .26, at, 1], [TB.shake[0] + .5, land, .6]]) for (const dl of [0, .14]) { const q = seg(T, t0 + dl, t0 + dl + 1.1, z => z); if (q <= 0 || q >= 1) continue; g.strokeStyle = `rgba(250,240,222,${(.5 * (1 - q) * I * S.vis).toFixed(3)})`; g.beginPath(); g.arc(c[0], c[1], (.03 + E.out(q) * .3) * big, 0, TAU); g.stroke(); }
      g.globalAlpha = S.vis;
    },
    /** The cat, at T: a little cat of foam, the way a barista builds one up out of a cup, but alive. A dome of foam swells
     *  out of the cup's middle and rises into a round head, ears pricking up, eyes shut, wobbling as it comes up; it climbs
     *  to the rim and hooks its paws over it, its tail curling up out of the foam behind it; it opens its eyes, looks one
     *  way and the other, tilts its head at you and gives you a slow blink (a cat's way of saying it's fond of you), a
     *  small mew, an ear flicked; and it lets go and slides back down into the cup, and the foam closes over it, rings
     *  going out, the art as it was. Its own seconds, `u`, 0 → 6.2; null before and after. */
    catAt(pl, T, A, I) {
      const e = pl.egg, u = (T - e.te) / e.k; if (u <= 0 || u >= 6.2 || I <= .01) return null;
      const th = S.eggDir(), dir = [Math.cos(th), Math.sin(th)], peek = env(u, 1.35, 2.05, 4.95, 5.45, E.io);
      const h = seg(u, 0, 1.25, E.back) * (1 - seg(u, 5.25, 6.0, E.in)), at = [dir[0] * .56 * peek, dir[1] * .56 * peek - .04 * (1 - peek)];
      const land = u > .95 ? Math.sin((u - .95) * 15) * Math.exp(-(u - .95) * 4.2) * .07 : 0; // the wobble as it comes up
      const close = env(u, 3.75, 4.05, 4.18, 4.5, E.sine) + env(u, 2.88, 2.92, 2.95, 3.0) * .9;
      return { u, th, dir, peek, h, at, I, s: (.4 + .6 * h) * (1 + .07 * peek), sq: 1 + land, alpha: I * seg(u, 0, .32) * (1 - seg(u, 5.8, 6.05)),
        tilt: peek * dir[0] * -.12 + .2 * env(u, 3.25, 3.42, 3.62, 3.8, E.sine) * (dir[0] >= 0 ? -1 : 1), ears: seg(u, .48, .95, E.back), flick: env(u, 4.58, 4.62, 4.65, 4.8),
        open: seg(u, 2.12, 2.32) * (1 - close), look: [env(u, 2.4, 2.52, 2.62, 2.74, E.sine) * -1 + env(u, 2.78, 2.9, 3.02, 3.14, E.sine), 0], mew: env(u, 4.72, 4.8, 4.9, 5.02),
        face: seg(u, .7, 1.1) * (1 - seg(u, 5.35, 5.75)), paws: env(u, 1.8, 2.12, 4.92, 5.2, E.out), tail: env(u, 1.55, 1.95, 4.85, 5.3, E.sine), sway: Math.sin(A * 2.3) * .3 + Math.sin(A * 3.7) * .1,
        rings: [seg(u, .05, 1.35, x => x), seg(u, 5.5, 6.2, x => x)] };
    },
    /** the cat's pieces, drawn once for a size: its head — a ball of milk foam, full at the cheeks, glossy where the
     *  window catches it and warmer where it turns away, its fine bubbles — at `r` CSS px */
    catHead(r) {
      const k = Math.round(r * px * 4); if (S.catH && S.catH.k === k) return S.catH;
      const c = r * 1.25, spr = make(c * 2, c * 2, x => {
        const shape = () => { x.beginPath(); x.ellipse(c, c - r * .03, r, r * .92, 0, 0, TAU); x.moveTo(c + r * .06 + r * .5, c + r * .34); x.ellipse(c + r * .4, c + r * .34, r * .5, r * .42, 0, 0, TAU); x.moveTo(c - r * .4 + r * .5, c + r * .34); x.ellipse(c - r * .4, c + r * .34, r * .5, r * .42, 0, 0, TAU); };
        const gr = x.createRadialGradient(c - r * .38, c - r * .42, r * .04, c - r * .05, c, r * 1.32); gr.addColorStop(0, "#FFFEF9"); gr.addColorStop(.42, "#FBF1E0"); gr.addColorStop(.78, "#EDD6B4"); gr.addColorStop(1, "#D6B48A");
        shape(); x.strokeStyle = "rgba(160,112,72,.4)"; x.lineWidth = Math.max(1.4, r * .05); x.stroke(); x.fillStyle = gr; x.fill("nonzero"); // its edge: the stroke's outer half, the fill over the rest
        x.save(); shape(); x.clip("nonzero");
        const ao = x.createRadialGradient(c - r * .25, c - r * .3, r * .55, c, c + r * .1, r * 1.3); ao.addColorStop(0, "rgba(150,100,60,0)"); ao.addColorStop(1, "rgba(150,100,60,.32)"); x.fillStyle = ao; x.fillRect(0, 0, c * 2, c * 2); // warmer as it turns away
        const r2 = rng(5151); for (let i = 0; i < 70; i++) { const a = r2() * TAU, d = Math.sqrt(r2()) * r * 1.05, bx = c + Math.cos(a) * d, by = c + Math.sin(a) * d * .95, br = r * (.012 + r2() * .03); x.fillStyle = "rgba(255,255,255,.45)"; x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill(); x.strokeStyle = "rgba(180,135,95,.2)"; x.lineWidth = Math.max(.5, br * .3); x.stroke(); } // the foam's fine bubbles
        const hl = x.createRadialGradient(c - r * .36, c - r * .44, 0, c - r * .36, c - r * .44, r * .34); hl.addColorStop(0, "rgba(255,255,255,.95)"); hl.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = hl; x.fillRect(0, 0, c * 2, c * 2); // the window's gloss
        x.restore(); });
      spr.k = k; spr.c = c; return (S.catH = spr);
    },
    /** the cat, drawn in the surface's units (the cup's middle at the origin, the cocoa's radius 1): under the foam's edge
     *  the rings and the shade where it comes up through it (`under`, inside the cocoa's clip), else its shadow, tail, paws,
     *  ears, head and face */
    drawCat(c, LR, under) {
      if (!c) return;
      const a = S.vis * c.alpha, r = .46 * c.s, [hx, hy] = c.at;
      if (under) { // rings going out where it comes up and where it goes down, and the foam darker round its foot
        g.lineWidth = .012; for (const [q, x0] of [[c.rings[0], [0, -.04]], [c.rings[1], [0, -.04]]]) if (q > 0 && q < 1) for (const d of [0, .22]) { const k = clamp(q - d), rr = .1 + k * .75; if (k <= 0) continue; g.strokeStyle = `rgba(250,240,222,${(.5 * (1 - k) * S.vis * c.I).toFixed(3)})`; g.beginPath(); g.arc(x0[0], x0[1], rr, 0, TAU); g.stroke(); }
        if (c.h > .01) { g.globalAlpha = S.vis * c.I * .35 * Math.min(1, c.h * 2); g.drawImage(S.soft, hx - r * 1.35, hy - r * 1.2, r * 2.7, r * 2.5); g.globalAlpha = S.vis; }
        return; }
      const sh = .05 + .16 * c.h; // its shadow, on the cocoa and, when it peeks, over the rim
      g.globalAlpha = a * .4 * c.h; g.drawImage(S.soft, hx - r * 1.2 + sh * .9, hy - r * 1.1 + sh * 1.2, r * 2.4, r * 2.3); g.globalAlpha = a;
      const foam = (x0, y0, rr) => { const gr = g.createRadialGradient(x0 - rr * .4, y0 - rr * .45, rr * .05, x0, y0, rr * 1.15); gr.addColorStop(0, "#FFFDF7"); gr.addColorStop(.6, "#F6E8D0"); gr.addColorStop(1, "#DDBF96"); return gr; };
      if (c.tail > .01) { // its tail, up out of the foam behind it (the rest of it under the foam), the tip curling and swaying
        const tb = [-c.dir[0] * .5, -c.dir[1] * .5];
        const base = [tb[0] - c.dir[0] * .06 - c.dir[1] * .05, tb[1] - c.dir[1] * .06 + c.dir[0] * .05], a0 = c.th + Math.PI + .55, L2 = .5 * c.tail, curl = 2.3 + c.sway * 1.3, n = 14, mid = [], wd = [];
        let p0 = base.slice(), ang = a0; for (let i = 0; i <= n; i++) { const f = i / n; mid.push(p0.slice()); wd.push(lerp(.072, .03, f) * (.6 + .4 * c.tail)); ang += curl * Math.pow(f, 1.6) / n * 2.2; p0 = [p0[0] + Math.cos(ang) * L2 / n, p0[1] + Math.sin(ang) * L2 / n]; }
        const side = (k) => mid.map((q, i) => { const d = mid[Math.min(n, i + 1)], e = mid[Math.max(0, i - 1)], tx = d[0] - e[0], ty = d[1] - e[1], tl = Math.hypot(tx, ty) || 1; return [q[0] - ty / tl * wd[i] * k, q[1] + tx / tl * wd[i] * k]; });
        const L = side(1), Rr = side(-1), tip = mid[n], outline = () => { g.beginPath(); L.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.arc(tip[0], tip[1], wd[n], 0, TAU); [...Rr].reverse().forEach(([u, v]) => g.lineTo(u, v)); g.closePath(); };
        g.globalAlpha = a * .35; g.save(); g.translate(.025, .035); outline(); g.fillStyle = "rgba(40,20,10,.6)"; g.fill(); g.restore(); g.globalAlpha = a; // its shadow on the foam
        outline(); g.strokeStyle = "rgba(160,112,72,.45)"; g.lineWidth = .02; g.stroke(); g.fillStyle = foam(mid[6][0], mid[6][1], .32); g.fill();
        g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = .014; g.beginPath(); L.slice(2, n - 1).forEach(([u, v], i) => i ? g.lineTo(u * .6 + mid[i + 2][0] * .4, v * .6 + mid[i + 2][1] * .4) : g.moveTo(u * .6 + mid[i + 2][0] * .4, v * .6 + mid[i + 2][1] * .4)); g.stroke(); // its sheen
        g.fillStyle = "#FBF1E0"; g.beginPath(); g.arc(base[0], base[1], wd[0] * 1.25, 0, TAU); g.fill(); } // where it comes out of the foam
      if (c.paws > .01) for (const sd of [-1, 1]) { // its front paws, hooked over the rim
        const pa = c.th + sd * .36, out = lerp(.88, 1.12, c.paws), px2 = Math.cos(pa) * out, py2 = Math.sin(pa) * out, pr = .13 * (.6 + .4 * c.paws);
        g.save(); g.translate(px2, py2); g.rotate(pa - Math.PI / 2);
        g.globalAlpha = a * .35 * c.paws; g.drawImage(S.soft, -pr * 1.2 + .03, -pr + .045, pr * 2.4, pr * 2.1); g.globalAlpha = a * Math.min(1, c.paws * 1.6);
        g.fillStyle = foam(0, 0, pr); g.beginPath(); g.ellipse(0, 0, pr, pr * .82, 0, 0, TAU); g.fill(); g.strokeStyle = "rgba(160,112,72,.4)"; g.lineWidth = .01; g.stroke();
        g.strokeStyle = "rgba(92,50,26,.55)"; g.lineWidth = .011; for (const tx of [-.045, .045]) { g.beginPath(); g.moveTo(tx, pr * .82); g.lineTo(tx * .8, pr * .3); g.stroke(); } // its toes, in cocoa
        g.restore(); g.globalAlpha = a; }
      g.save(); g.translate(hx, hy); g.rotate(c.tilt); g.scale(1 / c.sq, c.sq);
      for (const sd of [-1, 1]) { // ears, pricking up (one flicks)
        const k = c.ears * (1 + (sd > 0 ? .08 * c.flick : 0)), rot = sd * (.18 + (sd > 0 ? .35 * c.flick : 0)); if (k <= .01) continue;
        g.save(); g.translate(sd * r * .52, -r * .62); g.rotate(rot); g.scale(k, k);
        g.fillStyle = foam(-sd * r * .05, -r * .1, r * .45); g.beginPath(); g.moveTo(-r * .3, r * .12); g.quadraticCurveTo(-r * .2, -r * .38, -r * .02, -r * .5); g.quadraticCurveTo(r * .06, -r * .52, r * .1, -r * .42); g.quadraticCurveTo(r * .24, -r * .16, r * .32, r * .12); g.closePath(); g.fill(); g.strokeStyle = "rgba(160,112,72,.38)"; g.lineWidth = .012; g.stroke();
        g.fillStyle = "rgba(150,82,58,.42)"; g.beginPath(); g.moveTo(-r * .16, r * .06); g.quadraticCurveTo(-r * .1, -r * .24, r * .02, -r * .33); g.quadraticCurveTo(r * .12, -r * .14, r * .18, r * .06); g.closePath(); g.fill(); // cocoa dusted in it
        g.restore(); }
      const Rp = .5 * LR, hs = S.catHead(Rp), half = hs.c * r / Rp; g.globalAlpha = a; g.drawImage(hs, -half, -half, half * 2, half * 2); // the head, drawn once at its biggest and scaled
      if (c.face > .01) { // its face, drawn in chocolate as a barista draws one: eyes, a nose, a mouth, whiskers, cocoa on its cheeks
        const fa = a * c.face, ey = -r * .02, ex = r * .36, ew = r * .17, eh = r * .2;
        g.globalAlpha = fa * .5; g.fillStyle = "rgba(214,120,96,.55)"; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * r * .52, r * .3, r * .15, r * .09, 0, 0, TAU); g.fill(); } g.globalAlpha = fa;
        for (const sd of [-1, 1]) { const x0 = sd * ex, o = c.open;
          if (o > .08) { g.save(); g.beginPath(); g.ellipse(x0, ey, ew, eh, 0, 0, TAU); g.clip(); g.fillStyle = "#3A1D0F"; g.fillRect(x0 - ew, ey - eh, ew * 2, eh * 2);
            const lx = x0 + c.look[0] * ew * .35; g.fillStyle = "rgba(255,255,255,.95)"; g.beginPath(); g.arc(lx - ew * .32, ey - eh * .38, ew * .34, 0, TAU); g.fill(); g.beginPath(); g.arc(lx + ew * .3, ey + eh * .32, ew * .14, 0, TAU); g.fill(); // its eyes, a glint in each
            if (o < .99) { const ly = ey - eh + eh * 1.75 * (1 - o), sag = eh * (.4 + .7 * (1 - o)); g.fillStyle = foam(x0, ey - eh, ew * 1.6); g.beginPath(); g.moveTo(x0 - ew - .01, ey - eh - .01); g.lineTo(x0 + ew + .01, ey - eh - .01); g.lineTo(x0 + ew + .01, ly); g.quadraticCurveTo(x0, ly + sag, x0 - ew - .01, ly); g.closePath(); g.fill(); g.strokeStyle = "#3A1D0F"; g.lineWidth = .016; g.beginPath(); g.moveTo(x0 - ew, ly); g.quadraticCurveTo(x0, ly + sag, x0 + ew, ly); g.stroke(); } // the lid coming down, its edge curved like the eye's foot: a content squint
            g.restore(); }
          else { g.strokeStyle = "#3A1D0F"; g.lineWidth = .02; g.lineCap = "round"; g.beginPath(); g.moveTo(x0 - ew * .9, ey - eh * .05); g.quadraticCurveTo(x0, ey + eh * .55, x0 + ew * .9, ey - eh * .05); g.stroke(); } } // shut: a curve
        g.fillStyle = "#B8665A"; g.beginPath(); g.moveTo(-r * .075, r * .17); g.lineTo(r * .075, r * .17); g.quadraticCurveTo(r * .02, r * .26, 0, r * .27); g.quadraticCurveTo(-r * .02, r * .26, -r * .075, r * .17); g.fill(); // its nose
        g.strokeStyle = "#4A2614"; g.lineWidth = .014; g.lineCap = "round"; g.beginPath(); g.moveTo(0, r * .27); g.lineTo(0, r * .33); g.quadraticCurveTo(-r * .06, r * .41, -r * .14, r * .36); g.moveTo(0, r * .33); g.quadraticCurveTo(r * .06, r * .41, r * .14, r * .36); g.stroke();
        if (c.mew > .01) { g.fillStyle = "#7A2E2A"; g.beginPath(); g.ellipse(0, r * .4, r * .07 * c.mew, r * .09 * c.mew, 0, 0, TAU); g.fill(); g.fillStyle = "#E58A8F"; g.beginPath(); g.ellipse(0, r * .43, r * .045 * c.mew, r * .04 * c.mew, 0, 0, TAU); g.fill(); } // a small mew
        g.strokeStyle = "rgba(74,38,20,.6)"; g.lineWidth = .009; for (const sd of [-1, 1]) for (const [dy, d2] of [[-.02, -.08], [.04, .02], [.1, .12]]) { g.beginPath(); g.moveTo(sd * r * .22, r * (.3 + dy)); g.quadraticCurveTo(sd * r * .5, r * (.28 + (dy + d2) / 2), sd * r * .78, r * (.28 + d2)); g.stroke(); } // whiskers
      }
      g.restore(); g.globalAlpha = S.vis;
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
        const drawn = pl.egg ? (c2 => c2 ? 1 - .86 * clamp(c2.h * 1.15) * c2.I : 1)(S.catAt(pl, T, A, I)) : 1; // (b416: the art's foam drawn up into the egg's cat, and back)
        if (T < KS * DT) put(imgO, prev.ang, S.vis); else if (T >= k1 * DT) put(imgN, cur.ang, S.vis * drawn);
        else { g.save(); g.rotate(T < POUR0 ? prev.ang : cur.ang); S.lay(S.pa, S.vis * (T < POUR0 ? 1 - seg(T, 1.2, 2.25, E.in) * I : 1), foam); g.restore(); } }
      if (I < .99) put(imgO, prev.ang, S.vis * (1 - (on ? I : 0)));
      const [sx, sy, kind] = pr ? progAt(pr, T) : pourIs(T) >= 0 ? [...pourAt(T), T > 5.25 ? 2 : 1] : [0, 0, 0];
      if (on && kind && T >= POUR0) { const c = Math.cos(cur.ang), sn = Math.sin(cur.ang), px2 = sx * c - sy * sn, py2 = sx * sn + sy * c; g.globalAlpha = S.vis * I; for (let q = 0; q < 3; q++) { const rr = ((A * 1.6 + q / 3) % 1) * .2; g.strokeStyle = `rgba(250,240,222,${(.45 * (1 - rr / .2)).toFixed(3)})`; g.lineWidth = .012; g.beginPath(); g.arc(px2, py2, rr, 0, TAU); g.stroke(); } g.fillStyle = "#FFF9EE"; g.beginPath(); g.arc(px2, py2, kind === 2 ? .035 : .06, 0, TAU); g.fill(); }
      g.globalAlpha = S.vis;
    },
    /** the dusts: the pass before's, there until the spoon stirs it in; this pass's, sifted on at its moment */
    dusts(pl, T, I, on, stir) {
      const kp = lerp(1, T < 2.3 ? 1 - stir : 0, I), late = pl.egg ? pl.egg.dust : pl.hour ? pl.hour.dust : 0; S.dustOf(pl.prev.dust, () => kp); if (on) S.dustOf(pl.cur.dust, d => T >= d.t + late ? I : 0); // (b416: in the egg's pass, after the cat)
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
      const cat = pl && pl.egg && on ? S.catAt(pl, T, A, I) : null; if (cat) S.drawCat(cat, LR, true); // b416: the egg's cat, where it comes up through the foam
      const hr = pl && pl.hour && on ? pl.hour.which : 0; if (hr === 2) S.titRipples(pl, T, I, A); // b427: rings where the tit sips
      g.restore();
      if (cat) { g.save(); g.translate(cx, cy); g.scale(LR, LR); g.lineCap = "round"; g.lineJoin = "round"; S.drawCat(cat, LR, false); g.restore(); } // and the cat itself, over the rim
      if (pl && pl.paw && on) S.pawAt(pl, T, I, cx, cy, R); // the rare one: a cat's paw reaching in from the edge (b375)
      if (hr === 2) S.titAt(pl, T, I, A, cx, cy, R); // b427: hour egg 2, the blue tit
      const sk = hr === 1 ? S.dragonSteam(T, I) : 1; // b427: hour egg 1 gathers the cup's steam into the dragon, and gives it back
      // the steam, curling up off it; stronger at first and in the finale, a heart in the finale
      const hot = .55 + (on ? env(T, 11.5, 12.5, 14, 15) * .45 * I : 0) + (F >= 0 ? .5 : 0);
      g.lineCap = "round"; for (let w = 0; w < 3; w++) { const ph = w * 1.7, y0 = cy - LR * .3, rise = R * 1.05, pts = Array.from({ length: 26 }, (_, i) => { const t = i / 25, sway = Math.sin(t * 5.5 - A * 1.4 + ph) * R * .09 * t + Math.sin(t * 2.2 + A * .5 + ph) * R * .05 * t; return [cx + (w - 1) * R * .17 + sway, y0 - t * rise]; });
        const fin = F >= 0 ? env(F, .1, .35, .7, 1) : 0; if (fin > 0 && w === 1) { const hs = R * .22; pts.forEach((p, i) => { const t = i / 25 * TAU, hx = 16 * Math.pow(Math.sin(t), 3) / 16, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16; p[0] = lerp(p[0], cx + hx * hs, fin); p[1] = lerp(p[1], cy - R * .75 + hy * hs, fin); }); }
        const sg = g.createLinearGradient(0, y0, 0, y0 - rise); sg.addColorStop(0, "rgba(255,246,232,0)"); sg.addColorStop(.15, "rgba(255,246,232,1)"); sg.addColorStop(1, "rgba(255,246,232,0)"); g.strokeStyle = sg;
        for (const [lw, a] of [[.2, .05], [.11, .08], [.045, .12]]) { g.globalAlpha = S.vis * a * (.7 + .6 * hot) * (1 + fin) * sk; g.lineWidth = R * lw; g.beginPath(); pts.forEach(([u, v], i) => i ? g.lineTo(u, v) : g.moveTo(u, v)); g.stroke(); } }
      if (hr === 1) S.dragonAt(pl, T, I, A, cx, cy, R); // b427: hour egg 1, the dragon
      // motes in the light, drifting, catching it
      g.globalCompositeOperation = "lighter"; g.fillStyle = "#FFE2B8";
      for (const m of S.motes) { const u = m.u + Math.sin(A * m.dr * 3 + m.ph) * .25, v = m.v - ((A * m.dr + m.ph) % 3.2), vv = v < -1.6 ? v + 3.2 : v, x = cx + u * R, y = cy + vv * R, d = Math.hypot(u, vv) / 1.9; if (d >= 1 || (S.raw || []).some(q => x > q[0] - 8 && x < q[2] + 8 && y > q[1] - 8 && y < q[3] + 8)) continue; /* never behind the words */ const a = (1 - d) * (.25 + .5 * Math.pow(.5 + .5 * Math.sin(A * m.f * 2 + m.ph), 3)) * sun; g.globalAlpha = S.vis * a; g.beginPath(); g.arc(x, y, m.s, 0, TAU); g.fill(); }
      g.globalCompositeOperation = "source-over";
      g.restore();
    },
  };
  return S;
}
