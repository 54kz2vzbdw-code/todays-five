// scene-teletype.js — 1.12 b324: Teletype's scene (scenes.js loads it). A landscape typed in monospace on green-bar
// continuous paper, tractor holes down both edges: two ranges of mountains in / \ and ^ with their shadowed faces, a sea of
// ~, clouds in brackets, gulls as \v/, the sun in a ring of rays. Everything moves the way a printer can: a character at a
// time, a cell at a time, the print head sliding along a row. The loop, fifteen seconds: the head types a flight of gulls
// across the sky; a boat made of characters sails the sea, typing its wake behind it; the sun flares from o to @, its rays
// turning round it cell by cell, and its reflection is typed down the sea in green; a train chugs along the shore with puffs
// of o O ( ); a cloud decodes into noise and settles again; the head backs over the gulls, erasing them. The finale: the
// head types a row of stars along the shore and each one pops up and falls like chad from a tape.
// Terminal draws the same world at night, as vectors (scene-terminal.js).
export default function teletype(K) {
  const { clamp, lerp, E, seg, env, rng, canvas } = K;
  const TAU = Math.PI * 2;
  const P = { paper: "#F4F7F0", bar: "#E1EEDF", hole: "#D8E3D4", holeLo: "#C8D6C4", perf: "rgba(40,70,50,.18)", ink: "#14261B", still: "#4B6753", green: "#1E9A4F", head: "#14261B" }; // still: the kit's dim, for all that never moves, so a line over it keeps its contrast
  const SPIN = ["-", "/", "|", "\\"]; // a ray drawn along 0°, 45°, 90°, 135°
  let g = null, px = 1;
  const S = {
    res: "dpr",
    wash: 1.6, // a light kit: its small words have no room for the picture under them (scenes.js)
    veil: 1,
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05;
      const fs = pr ? 12.5 : 15, cw = fs * .6, ch = Math.round(fs * 1.32), margin = pr ? 20 : 34;
      const C = Math.floor((W - margin * 2) / cw), R = Math.ceil(H / ch), x0 = (W - C * cw) / 2;
      Object.assign(S, { W, H, pr, fs, cw, ch, C, R, x0 });
      const r = rng(41);
      // the glyphs, each drawn once at the screen's density; a cell is drawn from here, never with fillText per frame
      const font = `600 ${fs}px "IBM Plex Mono", "JetBrains Mono", ui-monospace, Menlo, monospace`;
      if (document.fonts && !document.fonts.check(font) && !S.waiting) { S.waiting = true; document.fonts.load(font).then(() => { S.waiting = false; bg.clearRect(0, 0, W, H); S.layout(W, H, bg); }, () => {}); } // the face may still be on its way
      S.atlas = {}; S.atlasG = {}; S.atlasS = {};
      const glyph = (c, col) => { const [cv, x] = canvas(Math.ceil(cw * px) + 2, Math.ceil(ch * px) + 2); x.scale(px, px); x.font = font; x.textBaseline = "middle"; x.fillStyle = col; x.fillText(c, 0, ch / 2 + .5); cv.w2 = cv.width / px; cv.h2 = cv.height / px; return cv; };
      const G = c => S.atlas[c] || (S.atlas[c] = glyph(c, P.ink)), GG = c => S.atlasG[c] || (S.atlasG[c] = glyph(c, P.green)), GS = c => S.atlasS[c] || (S.atlasS[c] = glyph(c, P.still));
      S.G = G; S.GG = GG;
      S.cell = (c, col, row, a = 1, green = false, still = false) => { if (c === " " || a <= 0 || col < 0 || col >= C) return; const s = green ? GG(c) : still ? GS(c) : G(c); g.globalAlpha = clamp(a); g.drawImage(s, x0 + col * cw, row * ch, s.w2, s.h2); };
      // a cell's paper, laid over whatever the backdrop typed there
      S.cover = (col, row) => { if (col < 0 || col >= C) return; g.globalAlpha = 1; g.fillStyle = (row % 6) < 3 ? P.bar : P.paper; g.fillRect(x0 + col * cw - .5, row * ch + 1, cw + 1, ch - 1); };
      // a picture of cells that holds still for seconds at a time (a cloud, the sun at rest) is typed once into its own
      // canvas and stamped whole: a frame costs a few stamps, not a few hundred glyphs
      const dev = v => Math.round(v * px) / px;
      S.bake = (w, h, ox, oy, fn) => { ox = dev(ox); oy = dev(oy); const [cv, x] = canvas(Math.ceil(w * px) + 2, Math.ceil(h * px) + 2); x.scale(px, px); x.translate(-ox, -oy); const keep = g; g = x; fn(); g = keep; return Object.assign(cv, { w2: cv.width / px, h2: cv.height / px, ox, oy }); };
      S.stamp = (cv, x, y) => { g.globalAlpha = 1; g.drawImage(cv, dev(x), dev(y), cv.w2, cv.h2); };
      // the world in rows, counted up from the foot of the page so the shore clears the words' pool there (scenes.js)
      const seaRows = Math.min(6, Math.max(3, Math.round(R * .12))), amp = Math.min(pr ? 6 : 7, Math.max(2, Math.round(R * .15)));
      const track = R - Math.ceil(128 / ch) - 1, sea1 = track - 1, sea0 = sea1 - seaRows, ridgeBase = sea0 - 1;
      Object.assign(S, { ridgeBase, sea0, sea1, track });
      const n = K.noise1(7, 64), n2 = K.noise1(23, 64), hgt = c => Math.round(K.fbm(n, c / (pr ? 7 : 11), 3) * amp);
      // the backdrop: paper, the green bars, the holes, the perforation, and every character that never moves
      bg.fillStyle = P.paper; bg.fillRect(0, 0, W, H);
      bg.fillStyle = P.bar; for (let row = 0; row < R; row += 6) bg.fillRect(0, row * ch, W, ch * 3);
      const hr = pr ? 3.2 : 4.2, hx = [margin * .45, W - margin * .45];
      for (const x of hx) for (let y = ch * 1.5; y < H; y += ch * 3) { bg.fillStyle = P.holeLo; bg.beginPath(); bg.arc(x + .6, y + .8, hr, 0, TAU); bg.fill(); bg.fillStyle = P.hole; bg.beginPath(); bg.arc(x, y, hr, 0, TAU); bg.fill(); }
      bg.strokeStyle = P.perf; bg.setLineDash([2, 3]); bg.lineWidth = 1; for (const x of [margin * .9, W - margin * .9]) { bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, H); bg.stroke(); } bg.setLineDash([]);
      const put = (c, col, row, a) => { if (c === " " || col < 0 || col >= C || row < 0 || row >= R) return; const s = GS(c); bg.globalAlpha = a; bg.drawImage(s, x0 + col * cw + (r() - .5) * .5, row * ch + (r() - .5) * .5, s.w2, s.h2); };
      const edge = (a, b, c) => b < a ? "/" : b > a ? "\\" : (c % 5 === 2 ? "^" : "_");
      // the near range: a ridge of / \ _ and ^, the faces under it shaded, the ones turned from the sun darker
      const top = []; for (let c = 0; c <= C; c++) top.push(ridgeBase - hgt(c));
      // the far range first, fainter, only where it shows above the near one
      const far = []; for (let c = 0; c <= C; c++) far.push(ridgeBase - 1 - Math.round(K.fbm(n2, c / (pr ? 5 : 8), 3) * (amp + 3)));
      for (let c = 0; c < C; c++) {
        const a = far[c], b = far[c + 1], lo = Math.min(a, b), near = Math.min(top[c], top[c + 1]);
        if (lo < near - 1) put(edge(a, b, c + 2), c, lo, .45);
        for (let row = lo + 1; row < Math.max(a, b) && row < near - 1; row++) put(b < a ? "/" : "\\", c, row, .38);
        if (b > a) for (let row = Math.max(a, b) + 1; row < near - 1; row++) if (r() < .3) put(".", c, row, .3);
      }
      for (let c = 0; c < C; c++) {
        const a = top[c], b = top[c + 1], lo = Math.min(a, b), hi = Math.max(a, b), shade = b > a;
        put(edge(a, b, c), c, lo, 1);
        for (let row = lo + 1; row < hi; row++) put(shade ? "\\" : "/", c, row, .92);
        for (let row = hi + 1; row < sea0; row++) {
          const d = row - hi, p = shade ? (d <= 1 ? .85 : d <= 3 ? .6 : .38) : (d <= 1 ? .5 : d <= 3 ? .3 : .16);
          if (r() < p) put(shade ? (d <= 1 ? ";" : d <= 3 ? ":" : ".") : (d <= 2 ? "." : ","), c, row, shade ? .78 - d * .05 : .55);
        }
      }
      // the sea: rows of ~, thickening toward you
      S.sea = [];
      for (let row = sea0; row < sea1; row++) { const d = (row - sea0 + 1) / (sea1 - sea0); for (let c = 0; c < C; c++) if (r() < .3 + d * .55) { const k = r() < .8 ? "~" : "-"; if (r() < .28) S.sea.push({ c, row, ph: r() * TAU, f: .3 + r() * .9 }); put(k, c, row, .55 + d * .45); } }
      // the shore and its track
      for (let c = 0; c < C; c++) { put("=", c, track, .9); if (c % 3 === 1) put("'", c, track + 1, .5); }
      for (let row = track + 2; row < R; row++) for (let c = 0; c < C; c++) if (r() < .09) put(r() < .5 ? "," : "'", c, row, .45);
      bg.globalAlpha = 1;
      // what moves: the clouds, the sun, the gulls' row, the boat, the train, the cursor
      const CL = [["   .--.    ", ".-(    ).  ", "(___.__)__)"], ["  _  _     ", " ( `   )_  ", "(    )   `)", " `--'`--'  "]];
      S.clouds = (pr ? [[.04, .11, 0], [.46, .2, 1]] : [[.04, .12, 0], [.34, .2, 1], [.6, .1, 0]]).map(([fx, fy, k]) => ({ c: Math.round(fx * C), row: Math.round(fy * R), rows: CL[k], v: .08 + r() * .08 }));
      S.decode = S.clouds[S.clouds.length - 1];
      const cloudImg = CL.map(rows => S.bake(Math.max(...rows.map(l => l.length)) * cw, rows.length * ch, x0, 0, () => rows.forEach((line, i) => { for (let k = 0; k < line.length; k++) S.cell(line[k], k, i, .85); })));
      S.clouds.forEach(cl => { cl.img = cloudImg[CL.indexOf(cl.rows)]; });
      S.sun = { c: Math.round(C * (pr ? .76 : .86)), row: Math.round(R * (pr ? .16 : .17)) };
      const body = [[-1, -1, "."], [0, -1, "-"], [1, -1, "."], [-2, 0, "("], [2, 0, ")"], [-1, 1, "'"], [0, 1, "-"], [1, 1, "'"]], { c: sc, row: sr } = S.sun;
      const ray = (ang, rr, a, green) => S.cell(SPIN[((Math.round(ang / (Math.PI / 4)) % 4) + 4) % 4], sc + Math.round(Math.cos(ang) * rr * 2.2), sr + Math.round(-Math.sin(ang) * rr), a, green); // a cell is 2.2 times as tall as it's wide
      S.sunAt = (rise, rot, lit, fin) => {
        for (const [dc, dr, c] of body) S.cell(c, sc + dc, sr + dr, .95);
        S.cell(fin ? "@" : [".", "o", "O", "@"][Math.min(3, Math.floor(1 + rise * 2.99))], sc, sr, 1, lit);
        for (let i = 0; i < 8; i++) ray(i * TAU / 8 - rot, 2, .9, lit && i % 2 === 0);
        const out = fin ? 8 : Math.round(rise * 8); for (let i = 0; i < out; i++) ray(i * TAU / 8 + TAU / 16 - rot, 3, .8, i % 2 === 1);
      };
      S.sunImg = S.bake(17 * cw, 9 * ch, x0 + (sc - 8) * cw, (sr - 4) * ch, () => S.sunAt(0, 0, false, false));
      S.gullRow = Math.round(R * .28);
      S.gulls = Array.from({ length: pr ? 7 : 13 }, (_, i) => ({ c: Math.round(C * .05) + Math.round(i * C * (pr ? .1 : .058)), dr: Math.round(Math.sin(i * .9) * 1.2) }));
      S.boat = ["   |\\  ", "   | \\ ", "   |__\\", " \\_____/"];
      S.trainRows = ["  _|_  ____  ____ ", "<[___]=[__]==[__] ", "  o o  o  o  o  o "]; // it runs right to left, so the engine leads on the left
      S.burst = Array.from({ length: pr ? 40 : 72 }, () => { const x = .06 + r() * .88; return { x, ch: "*+xo.'~#@%"[Math.floor(r() * 10)], a: -Math.PI * (.3 + r() * .4), v: .55 + r() * .45, spin: (r() - .5) * 8, green: r() < .45, lag: .06 + x * .42 + r() * .05 }; }); // each goes up just after the head has typed it
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1 */
    draw(T, I, A, F) {
      const { W, H, C, R, cw, ch, x0, cell, cover } = S, on = I > .01;
      g.clearRect(0, 0, W, H);
      // the sea shimmers: now and then a wave slides a cell along
      for (const s of S.sea) { const k = Math.sin(A * s.f + s.ph); if (k < .93 || s.c + 1 >= C) continue; cover(s.c, s.row); cover(s.c + 1, s.row); cell(k > .985 ? "-" : "~", s.c + 1, s.row, .85, false, true); }
      // the clouds, each stamped whole as it steps a cell along; one decodes into noise, a cell at a time, and settles again
      g.save(); g.beginPath(); g.rect(x0, 0, C * cw, H); g.clip();
      for (const cl of S.clouds) {
        const col0 = ((cl.c + Math.floor(A * cl.v)) % (C + 16)) - 13, dec = cl === S.decode ? env(T, 10.9, 11.5, 12.4, 13.3) * I : 0;
        if (dec <= .02) { S.stamp(cl.img, x0 + col0 * cw, cl.row * ch); continue; }
        cl.rows.forEach((line, i) => { for (let k = 0; k < line.length; k++) { let c = line[k]; if (c === " ") continue; const h = Math.sin(k * 12.9 + i * 78.2 + Math.floor(A * 14)) * 43758.5453, f = h - Math.floor(h); if (f < dec) c = "#%&*+=?/\\|<>"[Math.floor(f * 97) % 12]; cell(c, col0 + k, cl.row + i, .85); } });
      }
      g.restore();
      // the sun: it flares from o to @ as its rays turn round it a turn and a quarter, retyped cell by cell, and more come out between them
      const rise = seg(T, 5.0, 7.6, E.io) * (1 - seg(T, 13.4, 14.8, E.in)) * I, lit = rise > .5 || F >= 0, rot = seg(T, 5.0, 12.2, E.io) * TAU * 1.25 * I, sc = S.sun.c;
      if (rise === 0 && rot === 0 && F < 0) S.stamp(S.sunImg, S.sunImg.ox, S.sunImg.oy); else S.sunAt(rise, rot, lit, F >= 0);
      // and its reflection, typed down the sea a row at a time, flickering
      const refl = F >= 0 ? 1 : rise; if (refl > .02) { const rows = S.sea1 - S.sea0, nr = Math.ceil(refl * rows);
        for (let i = 0; i < nr; i++) { const row = S.sea0 + i, w = Math.floor(i / 2); for (let dc = -w; dc <= w; dc++) { cover(sc + dc, row); if (Math.sin(A * 7 + (sc + dc) * 1.7 + row * 2.3) > -.3) cell(i % 2 ? "=" : "-", sc + dc, row, .9, true); } } }
      // the gulls: typed across by the head, flapping, drifting a cell at a time, then backed over and erased
      const typed = seg(T, .3, 2.4, x => x) * I, erased = seg(T, 13.2, 14.6, x => x) * I, drift = on ? Math.floor(clamp(T - 2.4, 0, 10.8) * .7) : 0;
      const n = S.gulls.length, nt = Math.floor(typed * n), ne = n - Math.floor(erased * n), WING = [["\\", "/"], ["-", "-"], ["/", "\\"], ["-", "-"]];
      for (let i = 0; i < Math.min(nt, ne); i++) { const b = S.gulls[i], c0 = b.c + drift, row = S.gullRow + b.dr, [wl, wr] = WING[(Math.floor(A * 4) + i) % 4]; cell(wl, c0 - 1, row, .85); cell("v", c0, row, .95); cell(wr, c0 + 1, row, .85); }
      const typing = typed > 0 && typed < 1, erasing = erased > 0 && erased < 1;
      if (typing || erasing) { const b = S.gulls[clamp(typing ? nt : ne - 1, 0, n - 1)], hx = x0 + (b.c + (typing ? 0 : drift)) * cw; g.globalAlpha = .85 * I; g.fillStyle = P.head; g.fillRect(hx, (S.gullRow + b.dr) * ch + 2, cw, ch - 3); }
      // the boat, a cell at a time, typing its wake
      const bt = seg(T, 2.2, 5.6, x => x); if (bt > 0 && bt < 1 && on) {
        const col = Math.floor(lerp(-10, C + 2, bt)), row = S.sea0 + 2;
        for (let k = 1; k <= 10; k++) { cover(col - k + 1, row + 1); cell(k % 3 === 0 ? "~" : ".", col - k + 1, row + 1, I * (1 - k / 11) * .9); }
        S.boat.forEach((line, i) => { for (let k = 0; k < line.length; k++) { if (line[k] === " ") continue; cover(col + k, row - 3 + i); cell(line[k], col + k, row - 3 + i, I, k === 4 && i === 0); } });
      }
      // the train along the shore, puffing as it goes
      const tt = seg(T, 7.8, 11.4, x => x); if (tt > 0 && tt < 1 && on) {
        const col = Math.floor(lerp(C + 1, -20, tt)), row = S.track - 3;
        S.trainRows.forEach((line, i) => { for (let k = 0; k < line.length; k++) { if (line[k] === " ") continue; cover(col + k, row + i); cell(line[k], col + k, row + i, I, line[k] === "<"); } });
        for (let p = 0; p < 5; p++) { const age = ((T - 7.8) * 2.2 + p * .6) % 3, c = col + 3 + Math.round(age * 2.2), rr = row - 1 - Math.round(age * 1.4); cell("oO()."[Math.min(4, Math.floor(age * 1.6))], c, rr, I * (1 - age / 3) * .8); }
      }
      // the cursor at the end of the last row, blinking while nothing else types
      if (!typing && F < 0 && Math.floor(A * 1.6) % 2 === 0) { g.globalAlpha = .5; g.fillStyle = P.head; g.fillRect(x0 + (C - 2) * cw, (R - 2) * ch + 3, cw * .9, ch - 5); }
      // the finale: the head types a row of stars along the shore, and each pops up and falls like chad
      if (F >= 0) {
        const hc = F / .42, ty = S.track * ch, up = H * (S.pr ? .46 : .3);
        for (const p of S.burst) {
          const col = Math.floor(p.x * C), k = clamp((F - p.lag) / (1 - p.lag));
          if (k <= 0) { if (hc > p.x) { cover(col, S.track); cell("*", col, S.track, 1, p.green); } continue; }
          if (k >= 1) continue;
          const d = E.out(k) * p.v, x = x0 + col * cw + Math.cos(p.a) * d * up * 1.2, y = ty + Math.sin(p.a) * d * up + k * k * up * .8, s = p.green ? S.GG(p.ch) : S.G(p.ch);
          g.save(); g.translate(x + cw / 2, y + ch / 2); g.rotate(k * p.spin); g.globalAlpha = k > .8 ? (1 - k) / .2 : 1; g.drawImage(s, -s.w2 * .8, -s.h2 * .8, s.w2 * 1.6, s.h2 * 1.6); g.restore();
        }
        if (hc < 1) { g.globalAlpha = .9; g.fillStyle = P.head; g.fillRect(x0 + Math.floor(hc * C) * cw, S.track * ch + 2, cw, ch - 3); }
      }
      g.globalAlpha = 1;
    },
  };
  return S;
}
