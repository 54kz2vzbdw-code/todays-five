// scene-demo.js — 1.12 b356: Terminal's scene (scenes.js loads it). The whole page is a phosphor screen running a demo,
// the kind the demoscene made in the nineties, in characters: every cell a letter from a ramp of ten, light to dense
// (" .:-=+*#%@"), so an effect is drawn the way ASCII art draws a picture, in the kit's green, dim, with a soft bloom
// and scanlines over it. The characters under the words (and round them) are always blank (scenes.js, `words`), so the
// effects flow round the list. The loop, fifteen seconds: a plasma; a raster bar sweeps down and behind it a tunnel
// rushes toward you; the next bar brings a checkerboard turning and zooming; then fire, rising from the foot of the
// screen; then the stars stream out from the middle, faster, and the plasma comes back. While the list is in use the
// plasma drifts, slowly. The finale: a shockwave of characters rings out from the middle, twice. Each effect is a
// function of where a cell is and the time, and the order they come in is a table: they can be dealt differently each
// time round.
export default function demo(K) {
  const { clamp, lerp, E, seg, rng, canvas } = K;
  let g = null, px = 1;
  const RAMP = " .:-=+*#%@", NR = RAMP.length;
  // the effects: each a brightness 0…1 for the cell at (x, y) (in cells, from the screen's middle), at time t
  const FX = {
    plasma: (x, y, t) => { const v = Math.sin(x * .16 + t) + Math.sin(y * .23 - t * 1.3) + Math.sin((x + y) * .09 + t * .7) + Math.sin(Math.hypot(x, y * 1.8) * .2 - t * 2); return .5 + v / 8; },
    tunnel: (x, y, t) => { const d = Math.hypot(x, y * 1.9) + .01, a = Math.atan2(y * 1.9, x), u = a / Math.PI * 8 + t * .9, v = 60 / d + t * 7, c = ((Math.floor(u) + Math.floor(v / 4)) % 2 + 2) % 2; return clamp((c ? .85 : .25) * clamp(d / 30) * clamp(3 - d / 30)); },
    roto: (x, y, t) => { const s = 1.4 + Math.sin(t * .8) * .6, a = t * .5, X = (x * Math.cos(a) - y * 1.8 * Math.sin(a)) / (s * 3), Y = (x * Math.sin(a) + y * 1.8 * Math.cos(a)) / (s * 3), c = ((Math.floor(X) + Math.floor(Y)) % 2 + 2) % 2; return c ? .8 : .12; },
    fire: (x, y, t, S) => { const h = (y + S.rows / 2) / S.rows, n = S.fbm(x * .11 + Math.sin(t * .7) * .4, (S.rows - (y + S.rows / 2)) * .09 + t * 2.6), base = Math.pow(h, 2.2); return clamp(base * 1.35 * (.45 + n) - .12); },
  };
  /** the stars, streaming out from the middle: each laid into the buffer where it is, with a short trail behind it */
  const stars = (buf, t, S) => { buf.fill(0); const { cols, rows } = S;
    for (const st of S.stars) { const z = ((st.z - t * st.v) % 1 + 1) % 1; for (let k = 0; k < 4; k++) { const zz = Math.min(1, z + k * .025), q = 1 / (zz * 1.8 + .12), c = Math.round(cols / 2 + st.x * q), r2 = Math.round(rows / 2 + st.y * q * .55); if (c < 0 || c >= cols || r2 < 0 || r2 >= rows) continue; const i = r2 * cols + c; buf[i] = Math.max(buf[i], (1 - z) * (1 - k * .28)); } } };
  // the loop: each effect's start; a raster bar sweeps down the screen and the next effect shows behind it
  const PLAN = [[0, "plasma"], [2.8, "tunnel"], [5.8, "roto"], [8.8, "fire"], [11.7, "stars"], [14.2, "plasma"]], BAR = .7;
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .8, list: .4, // a dark kit: the screen runs behind the words, which sit on pads, and the characters under them are blank
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, r = rng(23), ch = pr ? 17 : 21; /* a cell a little larger than a line of text: fewer characters to draw */
      g.font = `600 ${ch * .82}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`; const cw = Math.max(6, g.measureText("M").width);
      const cols = Math.ceil(W / cw), rows = Math.ceil(H / ch);
      Object.assign(S, { W, H, pr, ch, cw, cols, rows, font: g.font });
      S.stars = Array.from({ length: pr ? 70 : 120 }, () => ({ x: (r() - .5) * cols * .5, y: (r() - .5) * rows * .5, z: r(), v: .25 + r() * .35 }));
      const n1 = K.noise1(31, 64), n2 = K.noise1(37, 64); S.fbm = (x, y) => (K.fbm(n1, x + y * .37, 3) * .6 + K.fbm(n2, y * 1.3 - x * .21, 3) * .4);
      S.mask = new Uint8Array(cols * rows); if (S.raw) S.words(S.raw);
      // the screen: its dark, the scanlines, the curve of the glass darkening its corners
      bg.fillStyle = "#050806"; bg.fillRect(0, 0, W, H);
      bg.fillStyle = "rgba(0,0,0,.35)"; for (let y = 0; y < H; y += 3) bg.fillRect(0, y, W, 1);
      const vg = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.hypot(W, H) * .62); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.6)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      [S.glowC, S.glowX] = canvas(Math.ceil(W / 8), Math.ceil(H / 8)); S.glowX.imageSmoothingEnabled = true;
      S.tick = -1; /* drawn again at once */
    },
    /** where the words are (scenes.js): the characters under them, and a cell round them, are blank */
    words(rects) {
      S.raw = rects; if (!S.W) return;
      const { cols, rows, cw, ch } = S; S.mask.fill(0);
      if (!S.soft) { const [c, x] = canvas(160, 80); x.imageSmoothingEnabled = true; for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(0,0,0,.2)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } S.soft = c; } /* even along a line, soft at its edges */
      for (const [x0, y0, x1, y1] of rects) { const c0 = Math.max(0, Math.floor(x0 / cw) - 1), c1 = Math.min(cols - 1, Math.ceil(x1 / cw)), r0 = Math.max(0, Math.floor(y0 / ch) - 1), r1 = Math.min(rows - 1, Math.ceil(y1 / ch)); for (let rr = r0; rr <= r1; rr++) for (let c = c0; c <= c1; c++) S.mask[rr * cols + c] = 1; }
      S.tick = -1; /* worked out again at once */
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, cols, rows, cw, ch } = S;
      const on = I > .01, fin = F >= 0;
      // which effect, and where the raster bar is that brings in the next
      let cur = "plasma", next = null, bar = -1;
      if (on) for (let k = 0; k < PLAN.length; k++) { const [t0, name] = PLAN[k]; if (T >= t0) { cur = name; next = null; bar = -1; } const nx = PLAN[k + 1]; if (nx && T >= nx[0] - BAR && T < nx[0]) { next = nx[1]; bar = (T - (nx[0] - BAR)) / BAR; } }
      const t = on ? A : A * .25, dim = on ? .5 + .2 * I : .42; /* in use: the plasma, drifting slowly */
      // the screen: worked out and drawn twelve times a second, the way the demos ran (half that while the list is in use),
      // and between those ticks left as it is; the bloom is made from the characters as they're drawn
      const tick = Math.floor(A * (on || fin ? 12 : 6));
      if (tick === S.tick && Math.abs(T - (S.tickT || 0)) <= .2 && Math.abs(F - (S.tickF === undefined ? F : S.tickF)) <= .05) return; /* between ticks the screen holds its picture: nothing is drawn */
      S.tick = tick; S.tickT = T; S.tickF = F; g.clearRect(0, 0, W, H);
      {
        const fill = (name, buf, rowTo) => { if (name === "stars") return stars(buf, t, S); for (let rr = 0; rr < rowTo; rr++) { const y = rr - rows / 2; for (let c = 0; c < cols; c++) { const i = rr * cols + c; buf[i] = S.mask[i] ? 0 : FX[name](c - cols / 2, y, t, S); } } };
        if (!S.bufA || S.bufA.length !== cols * rows) { S.bufA = new Float32Array(cols * rows); S.bufB = new Float32Array(cols * rows); S.row = new Array(cols); }
        fill(cur, S.bufA, rows); const barTo = bar >= 0 && next ? Math.ceil(bar * rows) : 0; if (barTo) fill(next, S.bufB, barTo);
        const tx = g, row = S.row; tx.font = S.font; tx.textBaseline = "top"; tx.fillStyle = `rgba(90,245,135,${(.42 * dim / .6).toFixed(3)})`;
        for (let rr = 0; rr < rows; rr++) {
          const y = rr - rows / 2, src = rr < barTo ? S.bufB : S.bufA; let any = false;
          for (let c = 0; c < cols; c++) {
            const i = rr * cols + c; if (S.mask[i]) { row[c] = " "; continue; }
            let v = src[i];
            if (fin) { const x = c - cols / 2, d = Math.hypot(x, y * 1.9), ring = Math.max(Math.exp(-Math.pow(d - F * 1.4 * cols, 2) / 30), Math.exp(-Math.pow(d - (F - .3) * 1.4 * cols, 2) / 30)); v = Math.max(v * (1 - F), ring); }
            const k = Math.min(NR - 1, Math.floor(clamp(v) * NR)); row[c] = RAMP[k]; if (k) any = true;
          }
          if (any) tx.fillText(row.join(""), 0, rr * ch);
        }
        const gx = S.glowX; gx.clearRect(0, 0, S.glowC.width, S.glowC.height); gx.drawImage(g.canvas, 0, 0, S.glowC.width, S.glowC.height);
      }
      // the raster bar: a band of light sweeping down, the next effect showing above it
      if (bar >= 0) { const y = bar * H, gr = g.createLinearGradient(0, y - ch * 2, 0, y + ch * .6); gr.addColorStop(0, "rgba(74,240,122,0)"); gr.addColorStop(.8, "rgba(120,255,160,.22)"); gr.addColorStop(1, "rgba(200,255,215,.4)"); g.fillStyle = gr; g.fillRect(0, y - ch * 2, W, ch * 2.6); }
      // the bloom: the characters drawn small and laid back over themselves, soft
      g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .6; g.imageSmoothingEnabled = true; g.drawImage(S.glowC, 0, 0, W, H); g.restore();
      // under the words, the screen's own dark: the bloom and the raster bar spill light into the blank cells round them,
      // so it is taken out again there, soft at the edges
      g.save(); g.globalCompositeOperation = "destination-out"; for (const [x0, y0, x1, y1] of S.raw || []) { const mx = 16 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.soft, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } g.restore();
    },
  };
  return S;
}
