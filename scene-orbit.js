// scene-orbit.js — 1.12 b328: Light's and Dark's scene (scenes.js loads it for either kit and says which). A throbber you
// could watch for hours, in liquid: a ring of glossy drops with a pulse running round it the way a loader's comet does, the
// swollen drops at its head melting into their neighbours as it passes. The loop, fifteen seconds: the drops pour together
// into one trembling blob; it pinches into three lobes that turn; they run out along a figure of eight, merging where it
// crosses; they string out into a wave that ripples through them in three dimensions; and they flow back into the ring.
// The finale: everything pools into one drop, which splashes, and the ring re-forms out of the splash. It keeps to the
// empty part of the page: the stage says where the words are, and it settles in the largest clear circle — beside short
// lines, under a short list — and glides somewhere else, and to another size, as the list changes; so the words need no
// pad under them. Each drop chases its place on a spring, so the liquid wobbles as it merges and parts.
// 1.12 b345: it steps back behind the page. It is drawn soft, as if out of focus: the drops' summed field, sampled on a
// grid, becomes a small image — the body where the field passes 1, its edge feathered across the field's fall-off, lit
// from the upper left by the field's own slope, its colour drifting slowly toward a second hue — laid down scaled up,
// smooth. No outline, no glint; on Light a pale apricot going to rose over a faint shadow, on Dark a low ember.
// 1.12 b369: the forever cycle. The loop above is pass 0; each pass after it pours through three forms of its own, from
// a pool of fifteen: the signature's blob, lobes, figure of eight and wave, and eleven more — two comets chasing each
// other's tails, a cell dividing in two and then in four, an atom, the ring stood on its edge and spun like a coin, a
// star, a flower opening, a sand-glass turned over and running, a beating heart, a Newton's cradle, a fountain, and a
// pair circling and passing through each other. Every run of five passes shows all fifteen once, and no form turns up
// in two passes running. The upright ones face the page whatever the camera's lean; each drop takes the nearest place
// in the next form, so none cross on the way. A pass is dealt its timings, which way each form turns, now and then a
// pour-together on the way from one form to the next, and a lean and a turn of the camera's own. About one pass in
// eight opens on the rare drop: it swells on nothing over the ring, falls into the middle of it and splashes — a crown,
// a jet, a ripple that throws the ring out and lets it settle. Every pass starts and ends on the ring; nothing carries.
export default function orbit(K, id) {
  const night = id === "dark";
  const { clamp, lerp, E, env, rng } = K;
  const TAU = Math.PI * 2;
  let g = null;
  // 1.12 b345: the liquid steps back behind the page — soft, as if out of focus, and nearer the page's own tones
  const PAL = night
    ? { sh: [66, 32, 15], body: [138, 72, 30], li: [210, 132, 64], drift: [150, 70, 78], a: .8, hi: "#D8955A", lo: "#5A2C12", drop: "#A8622E", glow: .44 }
    : { sh: [226, 162, 118], body: [241, 192, 150], li: [251, 222, 196], drift: [238, 178, 168], a: .8, hi: "#FBE0C8", lo: "#E4A57A", drop: "#F0C09A", glow: .5 };
  // the forms the drops take, in units of the ring's size: [x, y, z, radius] for drop i of n at wall time u
  const FORMS = [
    (i, n) => { const a = i / n * TAU; return [Math.cos(a) * .8, Math.sin(a) * .8, 0, .115]; }, // the ring
    (i, n, u) => { const a = i / n * TAU * 2.3 + u * 1.3, rr = .13 + .06 * Math.sin(i * 1.7 + u * 2.1); return [Math.cos(a) * rr, Math.sin(a) * rr, Math.sin(a * 2) * .1, .2]; }, // one trembling blob
    (i, n, u) => { const lobe = i % 3, k = Math.floor(i / 3), a = lobe * TAU / 3 + u * .7; return [Math.cos(a) * .62 + Math.cos(k * 2.1 + u * 1.6) * .045, Math.sin(a) * .62 + Math.sin(k * 2.1 + u * 1.6) * .045, Math.sin(a + u) * .15, .16]; }, // three lobes, turning
    (i, n, u) => { const t = (i / n + u * .11) * TAU, d = 1 + Math.sin(t) ** 2; return [Math.cos(t) / d * 1.02, Math.sin(t) * Math.cos(t) / d * 1.25, Math.sin(t) * .22, .14]; }, // a figure of eight
    (i, n, u) => { const ph = i * .95 - u * 3.2; return [(i / (n - 1) - .5) * 1.9, Math.sin(ph) * .24, Math.cos(ph) * .22, .13]; }, // a wave running through them
    // 1.12 b369: the forms a dealt pass takes as well (`tau`: how long since the form began to arrive; `st`: its step)
    (s, n, u) => { const c = s % 2, j = s >> 1, a = u * 1.25 + c * Math.PI - j * .44, rr = .52 + j * .035; return [Math.cos(a) * rr, Math.sin(a) * rr, Math.sin(a * 2 + u) * .08, [.2, .15, .115, .09, .07][j]]; }, // 5: two comets, each a drop with a tail, chasing each other round
    (s, n, u, tau) => { const d1 = E.io(clamp((tau - 1.5) / .9)), d2 = E.io(clamp((tau - 2.7) / .9)), h = s % 2 ? 1 : -1, sub = (s >> 1) % 2, w = s * 2.4 + u * 2.2; return [h * .5 * d1 + Math.cos(w) * .045, (sub ? 1 : -1) * .44 * d2 + Math.sin(w) * .045, Math.sin(w + u) * .05, sub ? .155 : .13]; }, // 6: a cell dividing, in two and then in four
    (s, n, u) => { if (s < 4) { const w = s * 1.57 + u * 2.3; return [Math.cos(w) * .06, Math.sin(w) * .06, Math.sin(w * 1.4) * .05, .125]; } const e = s - 4, k = e % 3, tail = e >= 3, ps = u * 2.6 + k * 2.1 - (tail ? .4 : 0), ro = k * TAU / 3 + u * .15, x = Math.cos(ps) * .9, y = Math.sin(ps) * .32; return [x * Math.cos(ro) - y * Math.sin(ro), x * Math.sin(ro) + y * Math.cos(ro), Math.sin(ps) * .4, tail ? .066 : .098]; }, // 7: an atom, upright: a nucleus, three electrons on three orbits, each with a drop trailing it
    (s, n, u, tau) => { const a = s / n * TAU, ps = tau * 2.3 - tau * tau * .1 + .25, x = Math.cos(a) * .78; return [x * Math.cos(ps), Math.sin(a) * .78, x * Math.sin(ps), .115]; }, // 8: a coin, upright: the ring stood on its edge and spun
    (s, n, u) => { const a = s / n * TAU - Math.PI / 2 + u * .2, tip = s % 2 === 0, rr = tip ? .56 + .03 * Math.sin(u * 3 + s) : .22; return [Math.cos(a) * rr, Math.sin(a) * rr, 0, tip ? .128 : .15]; }, // 9: a star, upright: five points swelling out of a body, breathing
    (s, n, u, tau) => { const p = s >> 1, tip = s % 2, open = E.io(clamp((tau - .9) / 1.7)), a = (p + .25) / 5 * TAU + u * .3, rr = tip ? .2 + .5 * open : .14 + .14 * open; return [Math.cos(a) * rr, Math.sin(a) * rr, (tip ? .32 : .1) * open, tip ? .1 + .075 * open : .13]; }, // 10: a flower opening, its petals curling up
    (s, n, u, tau, st) => { const f0 = 2.8, dt = clamp((st.len - f0 - .45) / 9, .1, .2), tl = f0 + (9 - s) * dt, fl = .34; let x, y;
      if (tau < tl) { const k = Math.floor((tau - f0) / dt), e = tau < f0 ? 0 : E.io((tau - f0) / dt - k), a = HG[Math.min(9, s + Math.max(0, k))], b = HG[Math.min(9, s + Math.max(0, k) + (tau < f0 ? 0 : 1))]; x = -lerp(a[0], b[0], e); y = -lerp(a[1], b[1], e); } /* in the upper glass, sliding down as the drops under it run out */
      else { const f = clamp((tau - tl) / fl), h = HG[9 - s]; x = h[0] * f * f; y = lerp(-HG[9][1], h[1], f * f); } /* falling through the neck onto the pile below */
      const ph = (1 - E.io(clamp((tau - 1.6) / 1))) * Math.PI; return [x * Math.cos(ph) - y * Math.sin(ph), x * Math.sin(ph) + y * Math.cos(ph), 0, .125]; }, // 11: a sand-glass, upright: turned over, and running
    (s, n, u, tau) => { const [x, y] = HEARTP[s], ph = tau % 1.15, b = Math.exp(-(((ph - .12) / .05) ** 2)) + .6 * Math.exp(-(((ph - .34) / .06) ** 2)), k = 1 + .07 * b * clamp(tau - 1.4); return [x * k, y * k, 0, .12 * (1 + .12 * b * clamp(tau - 1.4))]; }, // 12: a heart, upright, beating
    (s, n, u, tau) => { const k = s % 5, t = tau - 1.7, amp = .62 * E.io(clamp((tau - 1.1) / .6)), c = Math.cos(t * TAU / 1.3), th = k === 0 ? -amp * (t < 0 ? 1 : Math.max(0, c)) : k === 4 ? (t < 0 ? 0 : amp * Math.max(0, -c)) : 0, knock = t > 0 && k > 0 && k < 4 ? Math.sin(t * TAU / 1.3) * .012 * amp : 0; return [(k - 2) * .27 + Math.sin(th) * .62 + knock, -.47 + Math.cos(th) * .62, 0, .105]; }, // 13: a Newton's cradle, upright, clacking
    (s, n, u, tau) => { if (s < 4) return [(s - 1.5) * .2, .5 + Math.sin(u * 3 + s * 1.7) * .02, 0, .145]; const e = s - 4, side = e % 2 ? 1 : -1, ph = (tau * .72 + e / 6) % 1, on = E.io(clamp((tau - 1.2) / .7)); return [side * (.06 + .36 * ph) * on, .46 - 3.8 * on * ph * (1 - ph), 0, .092]; }, // 14: a fountain, upright, two arcs falling back into its pool
    (s, n, u, tau) => { const side = s < 5 ? 1 : -1, w = (s % 5) / 5 * TAU + u * 2.6, ph = tau * 1.5; return [Math.cos(ph) * .56 * side + Math.cos(w) * .05, Math.sin(ph) * .16 * side + Math.sin(w) * .05, Math.sin(ph) * .5 * side, .105]; }, // 15: a pair, upright, circling each other and passing through
  ];
  const PLAN = [[2.2, 0, 1], [4.6, 1, 2], [7.0, 2, 3], [9.6, 3, 4], [12.4, 4, 0]], MORPH = 1.3, SPREAD = .5;
  // 1.12 b369: the forever cycle. Which forms stand upright in the page (drawn to face it, whatever the tilt), which the
  // drops pour together to reach (they gather in the middle and flow out again), how long each wants to be held
  const UP = [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1], GA = [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const WT = [1, .8, 1, 1, 1, 1, 1.4, 1, 1, 1, 1.2, 1.45, 1.1, 1.35, 1.2, 1.1];
  // the sand-glass's pile, in the order it builds: the bottom row from the middle out, then each row above it
  const HG = [[-.13, .62], [.13, .62], [-.39, .6], [.39, .6], [0, .43], [-.26, .43], [.26, .43], [-.13, .25], [.13, .25], [0, .07]];
  // the heart's ten beads, clockwise from the dip between its lobes (the classic heart curve, y down)
  const HEARTP = [0, .72, 1.32, 1.95, 2.45, Math.PI, -2.45, -1.95, -1.32, -.72].map(t => [16 * Math.sin(t) ** 3 * .053, (5 * Math.cos(2 * t) - 13 * Math.cos(t) + 2 * Math.cos(3 * t) + Math.cos(4 * t) - 3) * .053]);
  /** the three forms pass `P` takes: every run of five passes shows all fifteen once, in an order of its own, and no form
   *  turns up in two passes running (the first three of a run never repeat the last three of the run before) */
  const trio = P => {
    const run = Math.floor((P - 1) / 5), order = k => { const r = K.deal(-2000 - k, 17), a = [...Array(15).keys()].map(v => v + 1); for (let j = 14; j > 0; j--) { const q = Math.floor(r() * (j + 1)); [a[j], a[q]] = [a[q], a[j]]; } return a; };
    const a = order(run);
    if (run > 0) { const last = order(run - 1).slice(12); for (let j = 0; j < 3; j++) if (last.includes(a[j])) { const q = a.findIndex((v, x) => x >= 3 && x < 12 && !last.includes(v)); [a[j], a[q]] = [a[q], a[j]]; } }
    const at = (P - 1) % 5 * 3; return a.slice(at, at + 3);
  };
  /** pass `P`'s plan (pass 0 is the signature, PLAN): its three forms and when each comes, whether the drops pour
   *  together to reach it, which way each turns, how the camera leans and turns, and, about one pass in eight, the drop */
  const dealPass = P => {
    if (P <= 0) return { P, sig: true };
    const r = K.deal(P, 23), rare = K.bag(P, 8, 5) === 1, forms = trio(P), s1 = rare ? 3.5 : 1.7 + r() * .5, end = 12.55 + r() * .3;
    const tot = forms.reduce((s, k) => s + WT[k], 0), steps = []; let t = s1;
    forms.forEach(k => { const len = (end - s1) * WT[k] / tot; steps.push({ s: t, b: k, len, gat: !!(GA[k] || r() < .15), mir: r() < .5, ph: r() * 40 }); t += len; });
    steps.push({ s: end, b: 0, len: 15 - end, gat: r() < .15, mir: false, ph: 0 });
    return { P, steps, rare, tilt: (r() - .5) * .5, turn: (r() - .5) * 2.4 };
  };
  // the rare drop: a drop swells on nothing over the ring, falls into the middle of it, and splashes: a crown, a jet, a ripple
  const RD = { grow: [.45, 1.45], hit: 1.86 };
  /** an upright form's place (x, y across the page, z toward the viewer) turned back through the camera, so that after
   *  the spin, the tilt and the turn it faces the page whatever they are */
  const toWorld = (q, c) => { const x1 = q[0] * c[4] - q[2] * c[5], z2 = q[0] * c[5] + q[2] * c[4], y1 = q[1] * c[2] + z2 * c[3]; return [x1 * c[0] + y1 * c[1], -x1 * c[1] + y1 * c[0], -q[1] * c[3] + z2 * c[2], q[3]]; };
  /** drop `i` in step `st`'s form at loop time T, turned the way the step was dealt */
  const shape = (st, i, T, A, c) => { const k = st.b; if (!k) return FORMS[0](i, S.n, A); const q = FORMS[k](st.perm ? st.perm[i] : i, S.n, A + st.ph, T - st.s, st); if (st.mir) q[0] = -q[0]; return UP[k] ? toWorld(q, c) : q; };
  /** on the way from one form to the next: straight across, or poured together in the middle and flowing out again */
  const blend = (A0, B0, e, gat) => { if (!gat) return A0.map((v, k) => lerp(v, B0[k], e)); const s = Math.sin(Math.PI * e), pull = 1 - .88 * s; return [lerp(A0[0], B0[0], e) * pull, lerp(A0[1], B0[1], e) * pull, lerp(A0[2], B0[2], e) * pull, lerp(A0[3], B0[3], e) * (1 + .3 * s)]; };
  const S = {
    res: "dpr",
    wash: night ? 1 : 1.6, veil: night ? .5 : 1,
    clear: true, // it keeps to the empty part of the page (words, below), so the words need no pad and no wash
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      const pr = H > W * 1.05, r = rng(11);
      // where it turns: under the words on a phone, beside them on a wide screen
      const cx = pr ? W * .5 : W * .815, cy = pr ? H * .77 : H * .5, R = pr ? Math.min(W * .25, H * .11) : Math.min(W * .14, H * .3);
      const n = 10, GN = pr ? 60 : 76;
      Object.assign(S, { W, H, pr, n, GN, Rmax: R, Rmin: pr ? 26 : 34 });
      if (!S.placed) Object.assign(S, { cx, cy, R, tx: cx, ty: cy, tR: R }); // until the words say where the room is
      S.field = new Float32Array((GN + 1) * (GN + 1));
      S.balls = Array.from({ length: n }, () => ({ x: 0, y: 0, r: 0, z: 0, vx: 0, vy: 0, vr: 0 })); S.fresh = true;
      // the liquid's shadow (day) or glow (night): a soft round sprite under each drop, which together make the whole's
      S.under = night ? K.glowSpr(64, [245, 140, 48], .5) : K.glowSpr(64, [110, 56, 18], .3);
      S.drops = Array.from({ length: pr ? 18 : 26 }, () => ({ a: r() * TAU, v: .8 + r() * .9, up: .4 + r() * .9, s: .03 + r() * .045, lag: r() * .08 }));
      S.dropSpr = K.paint(48, 48, (x, y) => { const d = Math.hypot(x - 23.5, y - 23.5) / 24; if (d >= 1) return null; const lt = clamp(.7 - ((x - 23.5) * .45 + (y - 23.5) * .55) / 24 * .6); const c = PAL.body.map((v, i) => Math.round(lt < .62 ? lerp(PAL.sh[i], v, lt / .62) : lerp(v, PAL.li[i], (lt - .62) / .38))); return [c[0], c[1], c[2], Math.round(255 * PAL.a * clamp((1 - d) / .45))]; }); /* a splash drop, as soft as the body */
    },
    /** where the words are (scenes.js): find the largest circle of empty page, clear of every word, the screen's edges and
     *  the footer's pool, and make that where the liquid turns, as big as the room allows; it glides there */
    words(rects) {
      const { W, H, pr } = S, gap = pr ? 14 : 26, top = pr ? 12 : 20, foot = H - (pr ? 96 : 104);
      let best = 0, bx = S.tx, by = S.ty;
      for (let gy = 0; gy <= 24; gy++) for (let gx = 0; gx <= 32; gx++) {
        const x = W * (.04 + .92 * gx / 32), y = top + (foot - top) * gy / 24; let rad = Math.min(x - gap, W - gap - x, y - top, foot - y);
        for (const [x0, y0, x1, y1] of rects) { const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1); rad = Math.min(rad, Math.hypot(dx, dy) - gap); if (rad <= best) break; }
        if (rad > best) { best = rad; bx = x; by = y; }
      }
      Object.assign(S, { tx: bx, ty: by, tR: clamp(best / 1.45, S.Rmin, S.Rmax) }); // all it draws (the pool, the glow, the splash) fits in the circle
      if (!S.placed) { Object.assign(S, { cx: S.tx, cy: S.ty, R: S.tR }); S.placed = true; }
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H, n } = S;
      const plan = S.plan && S.plan.P === P ? S.plan : (S.plan = dealPass(P)), sig = plan.sig; // the pass's plan, dealt once
      g.clearRect(0, 0, W, H);
      const jump = S.fresh || S.lastA === undefined || A < S.lastA || A - S.lastA > .15, dt = jump ? 0 : A - S.lastA; S.lastA = A; S.fresh = false;
      // it glides to wherever the room is, and grows or shrinks to fit it; the grid its surface is found on goes with it
      const glide = jump ? 1 : 1 - Math.exp(-dt * 2.2); S.cx += (S.tx - S.cx) * glide; S.cy += (S.ty - S.cy) * glide; S.R += (S.tR - S.R) * glide;
      const { cx, cy, R } = S, half = R * 1.5; S.gs = half * 2 / S.GN; S.gx0 = cx - half; S.gy0 = cy - half;
      // a soft pool of shadow (day) or of light (night) under it
      g.save(); g.translate(cx, cy + R * 1.18); g.scale(1, .13); const pl = g.createRadialGradient(0, 0, 0, 0, 0, R * 1.05); pl.addColorStop(0, night ? "rgba(243,140,50,.09)" : "rgba(120,70,30,.1)"); pl.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = pl; g.beginPath(); g.arc(0, 0, R * 1.05, 0, TAU); g.fill(); g.restore();
      // the camera tilts and turns slowly; the ring spins; the pulse's head runs round it, faster left alone
      S.yaw = (S.yaw || 0) + dt * (.1 + .12 * I);
      S.spin = (S.spin || 0) + dt * (.3 + .15 * I);
      S.head = (S.head || 0) + dt * (.42 + .3 * I);
      let pitch = .82 + .12 * Math.sin(A * .19) - .3 * I * (.5 + .5 * Math.sin(A * .23)), spin = S.spin; const yaw = .25 * Math.sin(S.yaw);
      // a dealt pass leans the camera its own way and turns the forms a little further, or holds them back, between rings
      if (!sig) { const k = env(T, .6, 3.2, 11.8, 14.4, E.sine) * I; pitch += plan.tilt * k; spin += plan.turn * k; }
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cs = Math.cos(spin), ss = Math.sin(spin);
      const cam = S.cam || (S.cam = []); cam[0] = cs; cam[1] = ss; cam[2] = cp; cam[3] = sp; cam[4] = cyw; cam[5] = syw;
      // the finale: all of it pools into one drop, trembles, splashes, and the ring comes back out of the splash
      const pool = F >= 0 ? E.io(clamp(F / .3)) * (1 - E.back(clamp((F - .42) / .36))) : 0, tremble = F >= 0 ? env(F, .26, .32, .4, .48) : 0;
      if (!sig) for (let j = 0; j < plan.steps.length && plan.steps[j].s <= T; j++) if (plan.steps[j].perm === undefined) S.assign(plan, j, T, A, cam); // who goes where, once a step
      for (let i = 0; i < n; i++) {
        const b = S.balls[i];
        let q = FORMS[0](i, n, A);
        if (I > .005 && !sig) { const L0 = S.dealt(plan, i, T, A, cam); q = q.map((v, k) => lerp(v, L0[k], I)); }
        else if (I > .005) {
          let cur = 0, mid = null;
          for (const [s, a, bb] of PLAN) { const m = clamp((T - s - (i / n) * SPREAD) / MORPH); if (m <= 0) break; if (m < 1) { const e = E.io(m), A0 = FORMS[a](i, n, A), B0 = FORMS[bb](i, n, A); mid = A0.map((v, k) => lerp(v, B0[k], e)); break; } cur = bb; }
          const L0 = mid || FORMS[cur](i, n, A); q = q.map((v, k) => lerp(v, L0[k], I));
        }
        if (pool > 0) { const C = FORMS[1](i, n, A); q = q.map((v, k) => lerp(v, C[k] * (k < 3 ? .7 : 1.05), pool)); }
        // spin about the ring's axis, then the camera's tilt and turn
        let [x, y, z] = q; const x1 = x * cs - y * ss, y1 = x * ss + y * cs; x = x1; y = y1;
        const y2 = y * cp - z * sp, z2 = y * sp + z * cp; y = y2; z = z2;
        const x3 = x * cyw + z * syw, z3 = -x * syw + z * cyw; x = x3; z = z3;
        const f = 3.4 / (3.4 - z * .9), d = ((S.head - i / n) % 1 + 1) % 1, pulse = Math.exp(-d * 6) * (1 - pool);
        const tx = cx + x * R * f, ty = cy + y * R * f, tr = q[3] * R * f * (1 + .5 * pulse) * (1 + tremble * .12 * Math.sin(A * 31 + i * 1.9));
        // a spring, a little under-damped: the drops overshoot and settle, so the liquid wobbles as it merges and parts
        if (jump) { b.x = tx; b.y = ty; b.r = tr; b.vx = b.vy = b.vr = 0; }
        else { const K2 = 95, C = 11.5; b.vx += ((tx - b.x) * K2 - b.vx * C) * dt; b.vy += ((ty - b.y) * K2 - b.vy * C) * dt; b.vr += ((tr - b.r) * K2 - b.vr * C) * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r = Math.max(0, b.r + b.vr * dt); }
        b.z = z;
      }
      const xb = !sig && plan.rare && T < RD.hit + 1.2 && I > .01 ? S.drip(T, I, cx, cy, R) : null; // the rare drop, and the jet out of its splash
      // by day a soft shadow under the liquid, by night a low glow: a soft sprite under each drop
      g.globalCompositeOperation = night ? "lighter" : "source-over";
      for (const b of S.balls) { const w = b.r * (night ? 3.9 : 3.2); g.globalAlpha = PAL.glow; g.drawImage(S.under, b.x - w / 2 + (night ? 0 : b.r * .22), b.y - w / 2 + (night ? 0 : b.r * .5), w, w); }
      if (xb) for (const b of xb) if (b.r > .5) { const w = b.r * (night ? 3.9 : 3.2); g.globalAlpha = PAL.glow; g.drawImage(S.under, b.x - w / 2 + (night ? 0 : b.r * .22), b.y - w / 2 + (night ? 0 : b.r * .5), w, w); }
      g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      S.soft(A, xb);
      if (xb) S.crown(T, I, cx, cy, R);
      // the splash: drops thrown out of the pool, falling
      if (F >= 0 && F > .36) for (const d of S.drops) { const k = clamp((F - .38 - d.lag) / .5); if (k <= .04 || k >= 1) continue; const reach = R * (.3 + d.v * .55) * E.out(k), x = cx + Math.cos(d.a) * reach, y = cy + Math.sin(d.a) * reach * .55 - d.up * R * .45 * Math.sin(k * Math.PI * .9) + k * k * R * .35, rr = d.s * R * (1 - k * .55) * 1.25; /* it stays inside the clear circle it was given */ g.globalAlpha = 1 - k * k; g.drawImage(S.dropSpr, x - rr, y - rr, rr * 2, rr * 2); }
      g.globalAlpha = 1;
    },
    /** where drop `i` is in a dealt pass at loop time T: the form it has reached, or on its way between two */
    dealt(plan, i, T, A, cam) {
      const st = plan.steps, n = S.n; let cur = -1;
      for (let j = 0; j < st.length; j++) { const m = clamp((T - st[j].s - (i / n) * SPREAD) / MORPH); if (m <= 0) break; if (m < 1) return blend(j ? shape(st[j - 1], i, T, A, cam) : S.rest(plan, i, T, A), shape(st[j], i, T, A, cam), E.io(m), st[j].gat); cur = j; }
      return cur < 0 ? S.rest(plan, i, T, A) : shape(st[cur], i, T, A, cam);
    },
    /** which of a form's places each drop takes, worked out once a step from where the drops are as it begins: the nearest,
     *  so that none cross on the way (and the last form before the ring minds the way home too, since each drop must end
     *  on its own place in the ring for the next pass to start from it) — the nearest first, then any two swapped while
     *  that shortens their ways */
    assign(plan, j, T, A, cam) {
      const st = plan.steps[j], n = S.n; if (!st.b) { st.perm = null; return; }
      const last = j === plan.steps.length - 2, A0 = A - (T - st.s), bare = Object.assign({}, st, { perm: null }), from = [], to = [], home = [];
      for (let i = 0; i < n; i++) { from.push(j ? shape(plan.steps[j - 1], i, st.s, A0, cam) : S.rest(plan, i, st.s, A0)); to.push(shape(bare, i, st.s + MORPH + SPREAD, A0 + MORPH + SPREAD, cam)); home.push(FORMS[0](i, n, A0)); }
      const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2, cost = (i, k) => d2(from[i], to[k]) + (last ? d2(to[k], home[i]) : 0);
      const perm = new Array(n).fill(-1), used = new Array(n).fill(false), all = [];
      for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) all.push([cost(i, k), i, k]);
      all.sort((a, b) => a[0] - b[0]); for (const [, i, k] of all) if (perm[i] < 0 && !used[k]) { perm[i] = k; used[k] = true; }
      for (let pass = 0, better = true; better && pass < 8; pass++) { better = false; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (cost(a, perm[b]) + cost(b, perm[a]) < cost(a, perm[a]) + cost(b, perm[b]) - 1e-9) { [perm[a], perm[b]] = [perm[b], perm[a]]; better = true; } }
      st.perm = perm;
    },
    /** the ring a dealt pass opens on — in the pass with the rare drop, drawing in a touch as the drop falls, then thrown
     *  out by the ripple from the splash and settling back */
    rest(plan, i, T, A) {
      const q = FORMS[0](i, S.n, A); if (!plan.rare || T < RD.grow[1] || T > RD.hit + 2) return q;
      const h = T - RD.hit, w = h < 0 ? -.05 * E.io(clamp((T - RD.grow[1]) / (RD.hit - RD.grow[1]))) : -.05 * Math.exp(-h * 9) + .17 * Math.exp(-h * 3) * Math.sin(Math.min(h, 1.9) * 7.5);
      return [q[0] * (1 + w), q[1] * (1 + w), -w * .5, q[3] * (1 + w * .9)];
    },
    /** the rare drop, three more drops in the field: it swells on nothing over the pool, hanging by a neck; lets go and falls,
     *  stretched, as the neck pulls back up and is gone; and out of the splash a jet rises, pinches off a drop at its top,
     *  and falls back into it */
    drip(T, I, cx, cy, R) {
      const X = S.xb || (S.xb = [0, 1, 2].map(() => ({ x: 0, y: 0, r: 0 }))), top = cy - R * 1.12, h = T - RD.hit, fall = .41;
      for (const b of X) { b.x = cx; b.y = cy; b.r = 0; }
      if (h < -fall) { const gw = E.out(clamp((T - RD.grow[0]) / (RD.grow[1] - RD.grow[0]))); X[0].y = top + R * .07 * gw; X[0].r = R * .125 * gw * I; X[1].y = top - R * .06; X[1].r = R * .075 * Math.sqrt(gw) * I; }
      else if (h < 0) { const f = 1 + h / fall, y = lerp(top + R * .07, cy, f * f); X[0].y = y; X[0].r = R * .125 * I; X[1].y = y - R * (.1 + .16 * f); X[1].r = R * .075 * (1 - .3 * f) * I * clamp(f * 6); X[2].y = top - R * (.06 + .12 * f); X[2].r = R * .075 * clamp(1 - f * 2.2) * I; }
      else { X[2].r = R * .125 * clamp(1 - h / .09) * I; /* it bursts where it lands */ const k = clamp((h - .08) / .9), up = Math.sin(Math.PI * k) * R * .42; X[0].y = cy - up; X[0].r = R * .085 * clamp(k * 5) * (k < .7 ? 1 : (1 - k) / .3) * I; X[1].y = cy - up * .4; X[1].r = R * .09 * clamp(k * 5) * clamp(1 - k * 1.8) * I; }
      return X;
    },
    /** the crown the rare drop throws up: drops flung out across the pool, falling back onto the ring as it re-forms */
    crown(T, I, cx, cy, R) {
      const h = T - RD.hit; if (h <= 0 || h > 1.2) return;
      for (let j = 0; j < 14; j++) { const d = S.drops[j], k = clamp((h - d.lag * .6) / .8); if (k <= .02 || k >= 1) continue; const reach = R * (.3 + d.v * .42) * E.out(k), x = cx + Math.cos(d.a) * reach, y = cy + Math.sin(d.a) * reach * .5 - d.up * R * .55 * Math.sin(k * Math.PI) + k * k * R * .08, rr = d.s * R * (1 - k * .45) * 1.35 * I; g.globalAlpha = (1 - k * k) * I; g.drawImage(S.dropSpr, x - rr, y - rr, rr * 2, rr * 2); }
      g.globalAlpha = 1;
    },
    px() { return g.getTransform().a; },
    /** where it has settled, for the suite: its centre and size in CSS pixels */
    spot() { return [Math.round(S.cx), Math.round(S.cy), Math.round(S.R)]; },
    /** the liquid drawn soft, as if out of focus behind the page: the drops' field sampled on the grid and made into a small
     *  image — the body where the field passes 1, its edge feathered across the field's fall-off, lit from the upper left
     *  by the slope of the field (so it reads as a rounded thing without an outline or a glint), its colour drifting slowly
     *  toward a second hue across it — and laid down scaled up, smooth */
    soft(A, extra) {
      const { GN, gs, gx0, gy0, field, balls } = S, M = GN + 1, LO = .52, HI = 1.5;
      field.fill(0);
      for (const b of balls) { const r2 = b.r * b.r, reach = b.r * 5, i0 = Math.max(0, Math.floor((b.x - reach - gx0) / gs)), i1 = Math.min(GN, Math.ceil((b.x + reach - gx0) / gs)), j0 = Math.max(0, Math.floor((b.y - reach - gy0) / gs)), j1 = Math.min(GN, Math.ceil((b.y + reach - gy0) / gs));
        for (let j = j0; j <= j1; j++) { const dy = gy0 + j * gs - b.y, o = j * M; for (let i = i0; i <= i1; i++) { const dx = gx0 + i * gs - b.x, v = r2 / (dx * dx + dy * dy + 1e-3) - .04; if (v > 0) field[o + i] += v * 1.04; } } }
      if (extra) for (const b of extra) { if (b.r <= .5) continue; const r2 = b.r * b.r, reach = b.r * 5, i0 = Math.max(0, Math.floor((b.x - reach - gx0) / gs)), i1 = Math.min(GN, Math.ceil((b.x + reach - gx0) / gs)), j0 = Math.max(0, Math.floor((b.y - reach - gy0) / gs)), j1 = Math.min(GN, Math.ceil((b.y + reach - gy0) / gs)); /* the rare drop's, the same way */
        for (let j = j0; j <= j1; j++) { const dy = gy0 + j * gs - b.y, o = j * M; for (let i = i0; i <= i1; i++) { const dx = gx0 + i * gs - b.x, v = r2 / (dx * dx + dy * dy + 1e-3) - .04; if (v > 0) field[o + i] += v * 1.04; } } }
      if (!S.imgC || S.imgC.width !== M) { const [c, x] = K.canvas(M, M); S.imgC = c; S.imgX = x; S.img = x.createImageData(M, M); }
      const d = S.img.data, { sh, body, li, drift } = PAL, ph = A * .11;
      for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
        const k = j * M + i, o = k * 4, f = field[k];
        if (f <= LO) { d[o + 3] = 0; continue; }
        const t = f >= HI ? 1 : (f - LO) / (HI - LO), a = t * t * (3 - 2 * t);
        // a rounded surface: its normal from a squashed field's slope (steep at the edge, flat in the body) and facing the
        // viewer where the slope is nothing, lit from the upper left and a little in front
        const h = v => 1 - Math.exp(-v * .8), fx = (h(field[i < GN ? k + 1 : k]) - h(field[i > 0 ? k - 1 : k])) * 6, fy = (h(field[j < GN ? k + M : k]) - h(field[j > 0 ? k - M : k])) * 6; /* a smooth squash: the edge rounds off, the body goes flat without a ridge */
        const inv = 1 / Math.hypot(fx, fy, 1), lit = clamp((-fx * -.45 - fy * -.55 + .7) * inv);
        const m = .5 + .5 * Math.sin(ph + i * .045 + j * .03), w = m * .45;
        for (let c = 0; c < 3; c++) { const base = lit < .62 ? lerp(sh[c], body[c], lit / .62) : lerp(body[c], li[c], (lit - .62) / .38); d[o + c] = lerp(base, drift[c], w); }
        d[o + 3] = a * 255 * PAL.a;
      }
      S.imgX.putImageData(S.img, 0, 0);
      g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(S.imgC, gx0 - gs / 2, gy0 - gs / 2, M * gs, M * gs); g.restore();
    },
  };
  return S;
}
