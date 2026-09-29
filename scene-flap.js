// scene-flap.js — 1.12 b356: Teletype's scene (scenes.js loads it). The whole page is a wall of split flaps, the kind a
// railway station hangs over its platforms, each one a tone barely off the page's own cream. Every flap really flips:
// its top half falls over the hinge, shading as it turns, and the next face's bottom half comes down over the last; a
// flap passes through every tone between where it is and where it's going, in order, the way a real one does, so a
// change runs across the wall as a clattering ripple. The flaps under the words always rest page-plain (scenes.js,
// `words`), so the pictures flow round the list, and a line that moves has the flaps under it flip clear. The loop,
// fifteen seconds: a wave from the left draws a sun as big as the page, its rays running out from behind the list; rings
// ripple out from the middle; a diagonal sweep winds a spiral; flaps turn over one by one, here and there, into stripes;
// a wave from the right wipes the wall plain again. While the list is in use it holds still. The finale: rings burst out from the middle. The
// pictures, the order they come in and the shape of each wave are a table, so they can be dealt differently each time.
export default function flap(K) {
  const { clamp, rng, canvas } = K;
  let g = null, px = 1;
  // the tones a flap passes through, in order: the page's cream to a soft green
  const TONE = ["#F3F6EF", "#DDEBD8", "#B9DABD", "#86C39A", "#4DA873"], NT = TONE.length; /* the page's cream to near the kit's green */
  const FLIP = .07; /* seconds a flap takes to fall */
  /** the pictures: a tone for every flap, from where it is on the page (x, y: 0…1) and the page's shape (a = width/height) */
  const PICS = { /* each drawn round the middle of the page, where the list is, so it frames the words rather than hides behind them */
    plain: () => 0,
    sun: (x, y, a) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), th = Math.atan2(Y, X), ray = Math.cos(th * 6) > .55; return d < .3 ? 4 : d < .36 ? 2 : ray ? (d < .62 ? 3 : d < .85 ? 2 : 1) : 0; }, /* a disc behind the list, six broad rays out from it */
    rings: (x, y, a) => { const d = Math.hypot((x - .5) * a, y - .5); return [3, 1, 4, 2, 0, 3, 1, 0, 2, 0][Math.min(9, Math.floor(d * 10))]; },
    spiral: (x, y, a) => { const X = (x - .5) * a, Y = y - .5, d = Math.hypot(X, Y), th = Math.atan2(Y, X), s2 = Math.sin(th * 2 - d * 14); return s2 > .55 ? 4 : s2 > .1 ? 2 : s2 > -.4 ? 1 : 0; },
    stripes: (x, y, a) => [0, 1, 3, 4, 3, 1][((Math.floor((x * a + y) * 5) % 6) + 6) % 6], /* the wall runs past the page's edge: keep the index whole */
    burst: (x, y, a) => { const d = Math.hypot((x - .5) * a, y - .5); return [4, 3, 2, 4, 1, 3, 0, 2][Math.min(7, Math.floor(d * 8))]; },
  };
  /** how a change runs across the wall: each flap's delay, from where it is */
  const WAVES = {
    right: (x, y) => x * 1.5 + y * .3, left: (x, y) => (1 - x) * 1.5 + y * .3, out: (x, y, a) => Math.hypot((x - .5) * a, y - .5) * 1.7,
    diag: (x, y) => (x + y) * .85, scatter: (x, y, a, h) => h * 1.7,
  };
  // the loop: at each time the wall turns to a picture, the change running as a wave; it ends where it began, plain
  const PLAN = [[1.0, "sun", "right"], [4.1, "rings", "out"], [7.0, "spiral", "diag"], [9.9, "stripes", "scatter"], [12.7, "plain", "left"]];
  const S = {
    res: "dpr",
    wash: 1.6, veil: 1, // a light kit: the list's band keeps its wash, and Everything shows the plain ground
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(19), fw = pr ? 30 : 42, fh = pr ? 40 : 56, gap = pr ? 3 : 4;
      const C = Math.ceil((W + gap) / (fw + gap)) + 1, R = Math.ceil((H + gap) / (fh + gap)) + 1, ox = (W - (C * (fw + gap) - gap)) / 2, oy = (H - (R * (fh + gap) - gap)) / 2;
      Object.assign(S, { W, H, pr, fw, fh, gap, C, R, ox, oy, a: W / H });
      S.hash = Array.from({ length: C * R }, () => r());
      S.mask = new Uint8Array(C * R); if (S.raw) S.words(S.raw);
      // each tone drawn once: the flap, lit a little on its top half and shaded on its bottom, and its hinge
      const make = (w, h, fn) => { const [c, x] = canvas(Math.ceil(w * px), Math.ceil(h * px)); x.imageSmoothingEnabled = true; x.scale(px, px); fn(x); c.w2 = w; c.h2 = h; return c; };
      S.faces = TONE.map(col => make(fw, fh, x => { const rr = fw * .1; x.fillStyle = col; x.beginPath(); x.roundRect(0, 0, fw, fh, rr); x.fill();
        const gr = x.createLinearGradient(0, 0, 0, fh); gr.addColorStop(0, "rgba(255,255,255,.35)"); gr.addColorStop(.5, "rgba(255,255,255,0)"); gr.addColorStop(.5, "rgba(20,38,27,.03)"); gr.addColorStop(1, "rgba(20,38,27,.06)"); x.fillStyle = gr; x.beginPath(); x.roundRect(0, 0, fw, fh, rr); x.fill();
        x.fillStyle = "rgba(20,38,27,.1)"; x.fillRect(0, fh / 2 - .5, fw, 1); x.fillStyle = "rgba(255,255,255,.5)"; x.fillRect(0, fh / 2 + .5, fw, .6); }));
      // the wall behind the flaps, and the cache the flaps are kept drawn in
      bg.fillStyle = "#E4EADF"; bg.fillRect(0, 0, W, H);
      [S.wall, S.wx] = canvas(Math.ceil(W * px), Math.ceil(H * px)); S.wx.imageSmoothingEnabled = true; S.wx.setTransform(px, 0, 0, px, 0, 0);
      S.drawn = new Array(C * R).fill(""); S.full = true;
    },
    /** where the words are (scenes.js): the flaps under them (and a little round them) rest page-plain */
    words(rects) {
      S.raw = rects; if (!S.W) return;
      const { C, R, fw, fh, gap, ox, oy } = S, m = 6; S.mask.fill(0);
      for (const [x0, y0, x1, y1] of rects) { const c0 = Math.max(0, Math.floor((x0 - m - ox) / (fw + gap))), c1 = Math.min(C - 1, Math.floor((x1 + m - ox) / (fw + gap))), r0 = Math.max(0, Math.floor((y0 - m - oy) / (fh + gap))), r1 = Math.min(R - 1, Math.floor((y1 + m - oy) / (fh + gap))); for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) S.mask[rr * C + c] = 1; }
    },
    /** what a flap shows at time T of a plan: its tone, and if it's mid-fall the tone it's falling to and how far */
    flapAt(T, plan, i, x, y, start0) {
      const h = S.hash[i], masked = S.mask[i], pic = n => masked ? 0 : PICS[n](x, y, S.a);
      let face = start0;
      for (const [t0, name, wave] of plan) {
        const tgt = pic(name), start = t0 + WAVES[wave](x, y, S.a, h), steps = (tgt - face + NT) % NT;
        if (T < start) return [face, face, 0];
        const done = start + steps * FLIP; if (T < done) { const k = (T - start) / FLIP, j = Math.floor(k); return [(face + j) % NT, (face + j + 1) % NT, k - j]; }
        face = tgt;
      }
      return [face, face, 0];
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, C, R, fw, fh, gap, ox, oy, faces, wx } = S; let moved = S.full;
      const on = I > .01, fin = F >= 0, Tb = fin ? F * 3.4 : on ? T : 0, plan = fin ? [[0, "burst", "out"], [1.9, "plain", "out"]] : PLAN;
      for (let rr = 0; rr < R; rr++) for (let c = 0; c < C; c++) {
        const i = rr * C + c, x = (ox + c * (fw + gap) + fw / 2) / W, y = (oy + rr * (fh + gap) + fh / 2) / H;
        const [a, b, p] = S.flapAt(Tb, plan, i, x, y, 0), key = S.mask[i] ? "m" : a + "," + b + "," + Math.round(p * 16);
        if (!S.full && S.drawn[i] === key) continue; S.drawn[i] = key; moved = true;
        const fx = ox + c * (fw + gap), fy = oy + rr * (fh + gap), hh = fh / 2; wx.clearRect(fx - gap / 2, fy - gap / 2, fw + gap, fh + gap);
        if (S.mask[i]) { wx.fillStyle = TONE[0]; wx.fillRect(fx - gap / 2, fy - gap / 2, fw + gap, fh + gap); continue; } /* under the words the wall is page-plain, its gaps too */
        if (p <= 0) { wx.drawImage(faces[a], fx, fy, fw, fh); continue; }
        const A0 = faces[a], B0 = faces[b], sy = A0.height / 2;
        wx.drawImage(B0, 0, 0, B0.width, sy, fx, fy, fw, hh); wx.drawImage(A0, 0, sy, A0.width, sy, fx, fy + hh, fw, hh); /* behind the falling flap */
        if (p < .5) { const k = Math.cos(p * Math.PI); wx.drawImage(A0, 0, 0, A0.width, sy, fx, fy + hh - hh * k, fw, hh * k); wx.fillStyle = `rgba(20,38,27,${(p * .18).toFixed(3)})`; wx.fillRect(fx, fy + hh - hh * k, fw, hh * k); } /* the last tone's top, falling */
        else { const k = -Math.cos(p * Math.PI); wx.drawImage(B0, 0, sy, B0.width, sy, fx, fy + hh, fw, hh * k); wx.fillStyle = `rgba(20,38,27,${((1 - p) * .18).toFixed(3)})`; wx.fillRect(fx, fy + hh, fw, hh * k); } /* the next tone's bottom, coming down */
      }
      S.full = false;
      if (moved) { g.clearRect(0, 0, W, H); g.drawImage(S.wall, 0, 0, W, H); } /* no flap has moved: the screen already shows the wall */
    },
  };
  return S;
}
