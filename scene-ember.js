// scene-ember.js — 1.12 b358: Ember's scene (scenes.js loads it). A campfire by a lake at night, in colour-cycling pixel
// art, the way the games of the early nineties made a picture live: it is painted once, at a low resolution, in a small
// palette, and then its colours are turned rather than its pixels — so the stars twinkle, the moon glitters on the water,
// the embers breathe and the firelight flickers on the ground, the rocks, the tent and the trees with nothing redrawn but
// the palette. The flames are the one thing drawn each frame: a small field of heat, each cell rising into the one above,
// cooling a little and drifting a little sideways, fed from the logs, and coloured through the fire's own ramp. Sparks
// ride up out of it. The sky goes from deep blue overhead to a last warm glow at the horizon, the Milky Way across it, a
// full moon over the far hills, pines framing it, the lake between. While the list is in use it all turns slowly and the
// fire burns low. The loop, fifteen seconds: the fire flares; a log settles in a burst of sparks; a star falls; an owl
// crosses the moon; a fish jumps and its rings spread; and the fire settles. The finale: a column of sparks goes up and
// opens into new stars. The lines sit on pads of the night (scenes.js, `hug`). The beats are a table, so they can be
// dealt differently each time round.
//
// 1.12 b378: the forever cycle. That loop is the first pass; each pass after it deals a night of its own from a pool
// about three times what one pass plays, painted the same way: what is new is put in at the picture's own pixels, and
// its shimmer and blinking come from little ramps of colour that turn. The fire keeps its heartbeat every time, burning
// a little higher or lower than on the first pass, flaring when it will, and then either settling a log in a burst of
// sparks or popping, a spray of sparks straight up and one ember thrown out to land in the dirt, glow a while and go
// out. In the sky: the falling star from anywhere, the owl across either way (now and then both, as in the first pass),
// or a cloud drifting in over the moon, its rim silvering, the moon glowing through it, and the glitter on the water
// and the moon's halo going out under it. On the lake: a fish or two, wherever; a canoe paddled across the moon's path,
// a lantern at its bow and its light trembling on the water behind a wake; a loon that comes up, rears to beat its
// wings, dives, and comes up again further on; a deer, moonlit, who steps out of the dark of the far trees into the
// shallows to drink, her reflection under her. On most nights mist comes up, lavender in the moonlight and warm near
// the fire: a thin one along whichever shore the list leaves open (on a phone the far one, over the hills' reflection;
// on a desktop ours), or a thick one filling the lake in long wisps. Some nights fireflies come out over the grass. The
// rare ones, each about once in eight passes: the northern lights over the far hills, in the palette, their light
// running along them and again in the lake; a meteor shower; a moose wading out of the far shore to drink, lifting his
// head with the water running off. Every pass opens and closes on the same resting picture.
//
// 1.12 b413: the egg. Every twelfth pass (K.egg: three minutes of the list left alone), someone just out of the picture, on
// the log by the fire, toasts a marshmallow. A green stick comes in from the edge away from the words with a marshmallow on
// its tip and holds it at the flames' edge; it goes golden, then brown on the side toward the fire; the fire flares, the
// flames lick it, and it catches, a little fire of its own in the fire's own colours; the stick whips it up out of the heat,
// the flame streaming, waves it, and it goes out in a puff of smoke; and the stick goes back the way it came, the
// marshmallow burnt black on one side, an ember winking out in the char. Drawn at the picture's own pixels, like the rest.
//
// 1.12 b429: the long day's hour eggs. For a list left up for hours, once an hour (K.long, the stage's clock of the loops
// left alone) a night of its own in place of the one it would have dealt, with only the fire's heartbeat about it. In the
// odd hours, the sky's pictures: stars leave their places and slide across the sky to one another, the seven of the Plough
// first and then the rest, lines running between them as they arrive, and the Great Bear is drawn in round them in pale
// gold from the tail, as on an old star chart, and comes alive: it walks along the sky, the stars at its paws stepping, to
// the moon, and stretches up to sniff at it, the moon glowing where its nose touches; then the picture fades, the lines
// let go and the stars slide home — all of it in the lake too, broken by the ripples. In the even hours, a launch: far off
// behind the hills a light comes up, and a rocket climbs out of it on a pillar of fire, slowly and then faster, leaning over
// onto its long arc; two boosters fall away glowing; and as it climbs out of the earth's shadow into the sunlight still up
// there, its plume opens behind it into a vast pale-blue bell, the jellyfish of a launch at dusk, the rocket a spark at its
// tip going on alone over the edge of the sky; the plume drifts and thins and is gone, and its light lies in the lake all
// the while. The sound never arrives. Painted as the rest is, at the picture's own pixels; each keeps back from the words
// as the dealt nights do, and opens and closes on the resting picture.
//
// 1.12 b446: the crown. In the sixth hour of the list left alone, and every sixth after (K.long 3), for whoever has had it up
// all day, the sky puts on its crown: a green glow comes up over the far hills and rises into a curtain of the northern
// lights, then another above it and a third higher still — not the rare night's band over the hills but the whole sky,
// the curtains folding and rippling, their rays of every height running along them, a pink fringe on their lower borders,
// their tops dissolving into violet; the lake mirrors them, and the hills' ridge, the pines' rims and the tent catch their
// green, the colours turned as the rest are; the fire burns up and sends a column of sparks climbing into it, cooling from
// orange to green as they rise; and the curtains gather overhead into a corona, a crown of rays turning slowly round a
// point in the sky, before it all thins and sinks away to the night as it was. Its brightness keeps back from the words
// as the dealt nights' does, and fades out before it reaches the bar.
export default function ember(K) {
  const { clamp, lerp, E, seg, env, rng, canvas, noise1, fbm, dith, deal, bag } = K;
  let g = null;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pack = c => (255 << 24 | c[2] << 16 | c[1] << 8 | c[0]) >>> 0; /* a colour as the ImageData's 32 bits (little-endian) */
  const mix = (a, b, t) => [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], clamp(t))));
  // the palette's ranges: where each thing's colours sit
  const SKY = 1, STAR = 17, ARM = 25, MOON = 33, MILKY = 38, MTN = 42, TREEF = 46, LAKE = 48, GLIT = 64, FREF = 72, GND = 80, LIT = 84, PINE = 108, PLIT = 112, ROCK = 118, LOG = 124, COAL = 128, TENT = 136, GRASS = 140, NL = 6;
  const SKYC = ["#05061A", "#090A25", "#0E0E2F", "#141239", "#1A1542", "#221949", "#2A1B4E", "#331D52", "#3D2053", "#482352", "#54264F", "#60294B", "#6C2D46", "#793340", "#853A3A", "#904333"].map(hex);
  const TW = ["#2A2758", "#56508A", "#7A74AE", "#A49ED6", "#F6F2FF", "#A49ED6", "#7A74AE", "#56508A"].map(hex); /* a star, round its twinkle */
  const GL = ["#14132F", "#1E1B46", "#36305F", "#6C6499", "#D2CAF3", "#6C6499", "#36305F", "#1E1B46"].map(hex); /* the moon's glitter on the water */
  const FR = ["#1A0F18", "#3A1618", "#6C2414", "#B8461C", "#F28C2C", "#B8461C", "#6C2414", "#3A1618"].map(hex); /* the firelight on the water */
  const CO = ["#3A0C06", "#6A1406", "#A8280A", "#E8541A", "#FF9A3A", "#E8541A", "#A8280A", "#6A1406"].map(hex); /* the coals */
  const GNDC = ["#110B0E", "#170F11", "#1E1413", "#261A16"].map(hex), GLOW = hex("#E0702A");
  const FIRE = (() => { const st = [[0, "#1F0707"], [.12, "#4A0B06"], [.25, "#8A1706"], [.38, "#C22B08"], [.5, "#E5470E"], [.62, "#F76D19"], [.74, "#FF9530"], [.86, "#FFC45A"], [.95, "#FFE9A0"], [1, "#FFF8E0"]].map(([t, c]) => [t, hex(c)]);
    return Array.from({ length: 37 }, (_, i) => { const t = i / 36; let k = 0; while (k < st.length - 2 && t > st[k + 1][0]) k++; return pack(mix(st[k][1], st[k + 1][1], (t - st[k][0]) / (st[k + 1][0] - st[k][0]))); }); })();
  // the loop's beats: when each happens (the forever cycle can deal them differently)
  const B = { flare: [.8, 1.4, 2.6, 3.4], log: 4.6, star: [6.2, 7.0], owl: [8.3, 11.3], fish: 12.0 };
  // b446: the crown's aurora, from its lower border up: a pink fringe, white-green, green, teal, violet, a deep red crest
  const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16); // (the kit's dither, for the crown's hot loop)
  const CRN = ["#FF7AC8", "#D8FFE8", "#9CFFC4", "#44E896", "#24B48C", "#2E6CB0", "#6A3EA6", "#8E2A6E"].map(hex), CRNP = CRN.map(pack);
  const BEAR = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3], [4, 7], [7, 8], [8, 9], [8, 10], [5, 11], [11, 12], [12, 13], [6, 14], [14, 15]]; // the hour egg's Great Bear: the Plough, then the bear round it
  // the forever cycle's colours: a firefly's blink, round its ramp; the northern lights from the hem up, and the light
  // that runs along them; a cloud's body and its lit rim; ripples and a wake catching the moon
  const blend = (a, b, k) => { k = k < 0 ? 0 : k > 1 ? 1 : k; const r = a & 255, gg = a >> 8 & 255, bl = a >> 16 & 255; return (255 << 24 | Math.round(bl + ((b >> 16 & 255) - bl) * k) << 16 | Math.round(gg + ((b >> 8 & 255) - gg) * k) << 8 | Math.round(r + ((b & 255) - r) * k)) >>> 0; }; /* no arrays: it runs for every pixel a new thing tints */
  const addc = (v, r, gg, b) => (255 << 24 | Math.min(255, (v >> 16 & 255) + b) << 16 | Math.min(255, (v >> 8 & 255) + gg) << 8 | Math.min(255, (v & 255) + r)) >>> 0;
  const FFP = ["#10140A", "#1E2C0E", "#3E5A18", "#86BA38", "#E4FF8C", "#9ACC44", "#4A6A1C", "#1E2C0E"].map(h => pack(hex(h)));
  const AURC = ["#3E2466", "#40338A", "#2E58A6", "#2296A0", "#26BC88", "#40E08A", "#8CFFB8", "#D8FFE8"].map(hex), RAY = [.25, .4, .72, 1, .82, .55, .34, .2];
  const STREAKC = pack(hex("#FFF4E0")), STREAK = Array.from({ length: 17 }, (_, i) => [pack(mix(SKYC[3], hex("#FFE8C8"), i / 16)), pack(mix(SKYC[3], hex("#FFFFFF"), i / 16))]), CLOUDC = pack(hex("#1B1733")), RIMC = pack(hex("#A8A2D8")), RINGC = pack(hex("#C8C4E0")), WAKEC = pack(hex("#6C6499")), FRP = FR.map(pack);
  const S = {
    res: "dpr",
    wash: 1, veil: .6, hug: .72, hugFinale: true, list: .4, // a dark kit: the night is behind the words, and the lines and the finale's words sit on pads
    bind(ctx) { g = ctx; },
    layout(W, H) {
      const pr = H > W * 1.05, PS = pr ? 3 : 4, bw = Math.ceil(W / PS), bh = Math.ceil(H / PS), r = rng(53);
      const [pc, px2] = canvas(bw, bh), img = px2.createImageData(bw, bh);
      Object.assign(S, { W, H, pr, PS, bw, bh, pc, px2, img, out: new Uint32Array(img.data.buffer), idx: new Uint8Array(bw * bh), pal: new Uint32Array(256) });
      [S.bc] = canvas(Math.ceil(bw / 4), Math.ceil(bh / 4)); S.bc.getContext("2d").imageSmoothingEnabled = true; /* the bloom */
      if (!S.pad) { const [c, x] = canvas(160, 80); for (let q = 0; q < 12; q++) { x.fillStyle = "rgba(27,15,13,.16)"; x.beginPath(); x.roundRect(q * 2.4, q * 1.8, 160 - q * 4.8, 80 - q * 3.6, 34 - q * 2); x.fill(); } S.pad = c; } /* the shade under a line: the kit's own dark */
      const I8 = S.idx, at = (x, y) => y * bw + x, inb = (x, y) => x >= 0 && x < bw && y >= 0 && y < bh, set = (x, y, v) => { if (inb(x, y)) I8[at(x, y)] = v; };
      const hy = Math.round(bh * (pr ? .55 : .56)), sy = Math.round(bh * (pr ? .76 : .8)); // the far shore (the horizon), the near shore
      const fx = Math.round(bw * (pr ? .5 : .74)), fy = Math.round(sy + (bh - sy) * (pr ? .5 : .5)); // the fire's foot
      const mx = Math.round(bw * (pr ? .7 : .77)), my = Math.round(bh * (pr ? .13 : .17)), mr = pr ? 7 : 9; // the moon, over the fire: the flames stand against its path
      Object.assign(S, { hy, sy, fx, fy, mx, my, mr });
      const n1 = noise1(7, 64), n2 = noise1(11, 64), n3 = noise1(13, 64), n4 = noise1(17, 64), n5 = noise1(19, 64);
      // the sky: sixteen bands from the zenith to the glow at the horizon, dithered into each other
      for (let y = 0; y < hy; y++) { const f = Math.pow(y / hy, 1.3) * 15; for (let x = 0; x < bw; x++) { const k = Math.floor(f); I8[at(x, y)] = SKY + Math.min(15, k + (f - k > dith(x, y) ? 1 : 0)); } }
      // the Milky Way, rising from the far hills on the left across the dark part of the sky, a rift down its middle
      for (let y = 0; y < hy; y++) for (let x = 0; x < bw; x++) {
        const u = x / bw, v = y / hy, c = lerp(.95, -.05, u) + .04 * Math.sin(u * 6), d = Math.abs(v - c), w = .15; if (d > w || v > .7) continue;
        const dens = (1 - d / w) * (.5 + .5 * fbm(n1, x * .07 + y * .04, 3)) * clamp((.7 - v) / .25) - .5 * Math.exp(-(((v - c + .02) / .025) ** 2)) * fbm(n2, x * .15, 2);
        const lv = dens * 4 - dith(x, y) * 1.1; if (lv > 0) I8[at(x, y)] = MILKY + Math.min(3, Math.floor(lv));
      }
      // the moon, its seas, its halo
      for (let y = my - mr * 3; y <= my + mr * 3; y++) for (let x = mx - mr * 3; x <= mx + mr * 3; x++) { if (!inb(x, y)) continue; const d = Math.hypot(x - mx, y - my);
        if (d <= mr) I8[at(x, y)] = MOON + (fbm(n3, (x - mx) * .35 + (y - my) * .21 + 20, 2) > .56 ? (fbm(n4, x * .5 + y * .3, 2) > .6 ? 2 : 1) : 0);
        else if (d < mr * 2.6 && dith(x, y) < (1 - (d - mr) / (mr * 1.6)) * .9) I8[at(x, y)] = MOON + (d < mr * 1.5 ? 4 : 3); }
      // the stars (the big ones with arms), each at its own place round the twinkle
      S.stars = []; for (let i = 0; i < (pr ? 70 : 150); i++) { const x = Math.floor(r() * bw), y = Math.floor(r() * hy * .86), ph = Math.floor(r() * 8); if (Math.hypot(x - mx, y - my) < mr * 3) continue; set(x, y, STAR + ph); if (r() < .12) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) set(x + dx, y + dy, ARM + ph); } S.stars.push([x, y]); }
      // the far hills, lit along their ridges on the moon's side, and a haze low down
      const ridge = x => Math.round(hy - bh * (pr ? .05 : .07) - bh * (pr ? .09 : .12) * fbm(n5, x * .025, 4));
      S.ridge = ridge;
      for (let x = 0; x < bw; x++) { const t = ridge(x); for (let y = t; y < hy; y++) I8[at(x, y)] = y === t && (x < mx ? ridge(x + 1) <= t : ridge(x - 1) <= t) ? MTN + 2 : y > hy - 4 && dith(x, y) < (y - hy + 4) / 5 ? MTN + 3 : MTN; }
      // a line of small pines along the far shore
      for (let x = 0; x < bw; x++) { const h = Math.round(1 + 5 * fbm(n2, x * .31 + 7, 2) * (x % 3 === 0 ? 1.3 : .7)); for (let y = hy - h; y < hy + 1; y++) { const half = (y - (hy - h)) * .45; if (half >= 0) for (let dx = -Math.floor(half); dx <= Math.floor(half); dx++) set(x + dx, y, TREEF); } }
      // the lake: the sky again, darker and upside down, the hills in it; the moon's path glittering down it, and near
      // the shore behind the fire, its light on the ripples
      for (let y = hy + 1; y < sy; y++) { const m = hy - (y - hy) * 1.7; for (let x = 0; x < bw; x++) {
        const mi = Math.round(m); let v;
        if (mi >= ridge(x) - 0 && mi < hy) v = TREEF + 1; /* the hills' reflection */
        else { const f = clamp(Math.pow(Math.max(0, m) / hy, 1.3)) * 15, k = Math.floor(f); v = LAKE + Math.min(15, k + (f - k > dith(x, y) ? 1 : 0)); }
        const gw = 3 + (y - hy) * .55, gd = Math.abs(x - mx + Math.sin(y * 1.3) * 1.2), seg2 = Math.floor((x + (y * 7 % 5)) / 4); /* the moon's path: glints a few pixels long, a few to a row */
        if (gd < gw && (y - hy) % 2 === 0 && fbm(n3, seg2 * 1.7 + y * 2.3, 2) > .36 + gd / gw * .32) v = GLIT + ((seg2 * 3 + y * 5) & 7);
        const fd = Math.hypot((x - fx) * .4, (y - sy) * 2.2); if (y > sy - 7 && fd < (pr ? 12 : 16) && (y - sy) % 2 === 0 && fbm(n1, Math.floor(x / 3) * 1.3 + y * 3, 2) > .4 + fd * .018) v = FREF + ((Math.floor(x / 3) * 3 + y) & 7); /* the firelight on the ripples by the shore */
        I8[at(x, y)] = v; } }
      // the near shore: dark earth, a wet line at the water, pebbles; the ground round the fire in four rings of its light
      const Rg = pr ? 40 : 50;
      for (let y = sy; y < bh; y++) for (let x = 0; x < bw; x++) {
        const tone = y === sy ? 3 : clamp(Math.floor(fbm(n4, x * .045 + y * .5, 3) * 3.2 + (dith(x, y) - .5) * .9 - .2), 0, 3);
        const d = Math.hypot((x - fx) * .7, (y - fy) * 1.7), lv = Math.floor((1 - d / Rg) * NL + dith(x, y) - .5);
        I8[at(x, y)] = lv >= 0 ? LIT + tone * NL + Math.min(NL - 1, lv) : GND + tone;
      }
      for (let x = 0; x < bw; x++) { const h = Math.round(fbm(n5, x * .23 + 3, 2) * 4 - .5); for (let k = 1; k <= h; k++) if ((x + k) % 2 === 0 || k === 1) set(x, sy + 1 - k, GRASS + (k === h ? 1 : 0)); } /* grass along the water */
      for (let k = 0; k < (pr ? 26 : 50); k++) { const x = Math.floor(r() * bw), y = sy + 3 + Math.floor(r() * (bh - sy - 4)); if (Math.hypot((x - fx) * .7, (y - fy) * 1.7) < 12) continue; set(x, y, GND + 3); set(x + 1, y, GND + 3); set(x, y - 1, GND + 2); } /* pebbles */
      // the tent beside the fire: the face toward the fire lit, the far one dark, the door open
      { const tx = fx + (pr ? -24 : -36), ty = fy + 1, tw = pr ? 16 : 22, th = pr ? 11 : 15;
        for (let y = 0; y < th; y++) { const half = Math.round(y * tw / 2 / th); for (let dx = -half; dx <= half; dx++) set(tx + dx, ty - th + y, dx > 0 ? TENT + 1 : TENT); }
        for (let y = Math.round(th * .4); y < th; y++) { const half = Math.round((y - th * .4) * .35); for (let dx = -half; dx <= half; dx++) set(tx + 1 + dx, ty - th + y, TENT + 2); }
        for (let k = 1; k < 5; k++) set(tx + Math.round(tw / 2) + k, ty - Math.round(th * .5) + k * 2, TENT + 1); }
      // the pines framing it all: tall, in tiers, their edges toward the fire catching its light, the moon's side rimmed
      const pine = (x0, base, h, s) => { const rr = rng(s), tiers = Math.max(4, Math.round(h / 7));
        for (let y = 0; y < h; y++) { const ti = Math.floor(y / h * tiers), ty = (y / h * tiers) - ti, half = (1 + (ti + 1) * h * .2 / tiers) * (.35 + .65 * ty) + (rr() < .3 ? 1 : 0);
          for (let dx = -Math.round(half); dx <= Math.round(half); dx++) { const hw = Math.max(1, Math.round(half)), toward = (dx > 0) === (x0 < fx) ? Math.abs(dx) / hw : 0, near = clamp(1 - Math.abs(x0 - fx) / (bw * .5)) * clamp((y / h) * 1.4 - .1);
            const lit = toward * near * 1.6 - (1 - toward) * .5, lv = Math.floor(lit * 4 + dith(x0 + dx, base - h + y) - .5), rim = Math.abs(dx) >= hw && (dx > 0) === (x0 < mx);
            set(x0 + dx, base - h + y, lv > 0 ? PLIT + Math.min(3, lv - 1) : rim ? PINE + 3 : PINE + (y % 3 === 0 ? 1 : 0)); } }
        for (let y = 0; y < 3; y++) set(x0, base + y - 1, PINE); };
      const tall = pr ? [[.04, .5], [.14, .36], [.9, .42], [.98, .56]] : [[.02, .62], [.07, .44], [.12, .3], [.92, .38], [.97, .55]];
      for (const [u, hh] of tall) pine(Math.round(bw * u), sy + 2, Math.round(bh * hh), Math.floor(u * 1000));
      // the fire pit: stones in a ring, the logs crossed, cracked with coals
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, x = Math.round(fx + Math.cos(a) * (pr ? 6 : 8)), y = Math.round(fy + Math.sin(a) * (pr ? 2 : 2.6)); for (const [dx, dy] of [[0, 0], [1, 0], [0, -1], [1, -1], [-1, 0]]) set(x + dx, y + dy, Math.sin(a) < 0 || dx < 0 ? ROCK + (dy ? 2 : 3) : ROCK + (dy ? 0 : 1)); }
      const log = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = Math.round(lerp(x0, x1, i / n)), y = Math.round(lerp(y0, y1, i / n)); set(x, y, LOG + (i % 4 === 1 ? 2 : 1)); set(x, y + 1, i % 5 === 2 ? COAL + ((i * 3) & 7) : LOG); } };
      const lw = pr ? 6 : 8; log(fx - lw, fy + 1, fx + lw - 2, fy - 3); log(fx + lw, fy + 1, fx - lw + 2, fy - 3); log(fx - lw + 1, fy - 1, fx + lw - 1, fy - 1);
      for (let k = -3; k <= 3; k++) set(fx + k, fy, COAL + ((k * 5 + 8) & 7));
      { const bx = fx + (pr ? 14 : 18), by = fy + (pr ? 4 : 5), bl = pr ? 9 : 13; for (let k = 0; k < bl; k++) { set(bx + k, by, k < 2 ? ROCK + 2 : LOG + 1); set(bx + k, by + 1, LOG); set(bx + k, by - 1, k < bl / 2 ? ROCK + 2 : LOG + 2); } set(bx - 1, by, ROCK + 3); } /* a log to sit on, its near end and top catching the light */
      // the flames' field of heat, and the sparks
      S.FW = pr ? 22 : 24; S.FH = pr ? 40 : 44; S.cool = pr ? .64 : .62; S.heat = new Uint8Array(S.FW * S.FH); S.frng = rng(97); S.ft = 0;
      for (let k = 0; k < 90; k++) S.fire(.75, k / 30); /* lit before the page shows it */
      S.sparks = Array.from({ length: 18 }, () => ({ p: 1.3 + r() * 1.1, o: r() * 3, sw: 2 + r() * 4, dr: (r() - .5) * 10, ph: r() * 6 }));
      S.burst = Array.from({ length: 26 }, () => ({ a: -Math.PI / 2 + (r() - .5) * 1.6, v: 20 + r() * 34, l: .7 + r() * 1.1 }));
      S.fan = Array.from({ length: pr ? 40 : 64 }, () => ({ x: (r() - .5) * bw * .9, y: bh * (.06 + r() * .4), d: r() * .3, tw: Math.floor(r() * 8) }));
      S.owlPath = pr ? [[-12, bh * .17], [bw + 12, bh * .09]] : [[-12, bh * .25], [bw + 12, bh * .15]];
      S.fishAt = [Math.round(bw * (pr ? .3 : .36)), Math.round(lerp(hy, sy, .55))];
      S.turn = 0; S.lastA = undefined;
      S.cast(bw, bh, pr); S.planP = -1; S.maskWords();
    },
    /** one step of the flames: each cell's heat rises into the one above, cooling a little and drifting a little sideways;
     *  the bottom row is fed from the logs, hottest in the middle, by `feed` (0 … 1) */
    fire(feed, t) {
      const { FW, FH, heat, frng } = S;
      for (let x = 0; x < FW; x++) { const u = (x - (FW - 1) / 2) / (FW / 2), c = 1 - Math.abs(u), tongues = .72 + .28 * Math.cos(u * Math.PI * 2.6 + Math.sin(t * 2.3) * .8); /* three tongues, swaying */
        heat[(FH - 1) * FW + x] = c > .12 ? Math.round(36 * clamp(feed * (Math.pow(c, .6) * 1.2 * tongues + (frng() - .5) * .35))) : 0; }
      for (let y = 1; y < FH; y++) for (let x = 0; x < FW; x++) {
        const src = y * FW + x, h = heat[src]; if (!h) { heat[src - FW] = 0; continue; }
        const rn = Math.floor(frng() * 3), dst = Math.min(FW * FH - 1, Math.max(FW, src - rn + 1)), edge = Math.abs(x - (FW - 1) / 2) / (FW / 2); /* each cell drifts one either way, or none */
        heat[dst - FW] = Math.max(0, h - (frng() < .5 ? 1 : 0) - (frng() < S.cool + edge * .5 ? 1 : 0));
      }
    },
    words(rects) { S.raw = rects; S.maskWords(); },
    /** where the words are, at the picture's own pixels: in the passes after the first, what is new keeps back from them
     *  (the pad under a line leaves a quarter of the picture showing; nothing new is in that quarter) */
    maskWords() {
      const { bw, bh, PS } = S; if (!bw) return;
      const rs = S.raw || [], R = 2, F = 4;
      if (!S.em || S.em.length !== bw * bh) S.em = new Float32Array(bw * bh);
      const m = S.em; m.fill(1);
      for (const [x0, y0, x1, y1] of rs) { const a0 = x0 / PS, b0 = y0 / PS, a1 = x1 / PS, b1 = y1 / PS;
        for (let y = Math.max(0, Math.floor(b0 - R - F)); y <= Math.min(bh - 1, Math.ceil(b1 + R + F)); y++) for (let x = Math.max(0, Math.floor(a0 - R - F)); x <= Math.min(bw - 1, Math.ceil(a1 + R + F)); x++) {
          const d = Math.hypot(Math.max(a0 - x - .5, 0, x + .5 - a1), Math.max(b0 - y - .5, 0, y + .5 - b1)), v = clamp((d - R) / F), i = y * bw + x; if (v < m[i]) m[i] = v; } }
      S.emOn = rs.length > 0;
    },
    /** the forever cycle's cast, drawn once at the picture's own pixels, from dice of their own (the signature's are left as they were) */
    cast(bw, bh, pr) {
      const q = rng(211), P2 = { "#": "#07060C", L: "#FFD27A", o: "#B8461C", p: "#1A1420", w: "#C8C4E0", m: "#2E2952", l: "#57508C", h: "#A49ED6", d: "#15122C", a: "#C9C2EE" };
      const px = (rows, pal = P2) => { const list = []; rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) list.push([x, y, pack(hex(pal[ch]))]); })); const lx = rows[0].indexOf("L"); return { w: Math.max(...rows.map(r => r.length)), h: rows.length, px: list, lx }; };
      // a canoe, a paddler in the stern, a lantern on a pole at the bow; three strokes of the paddle
      S.canoe = [["............oLo", "....#........#.", "...###.......#.", "...###p......#.", "#..###.p.....#.", "##############.", ".############..", "........p......"],
        ["............oLo", "....#........#.", "...###.......#.", "..p###.......#.", "#p.###.......#.", "##############.", ".############..", "..............."],
        ["............oLo", "..p.#........#.", "...p##.......#.", "...###.......#.", "#..###.......#.", "##############.", ".############..", "..............."]].map(r => px(r));
      const dT = [".......h.", "......hl.", ".....lmm.", "hhhhhlm..", "lmmmmmm..", "dmmmmmd.."], dS = dT.concat(["m.d...m.d", "m.d...m.d"]);
      S.deer = { walk: [px(dS), px(dT.concat([".m.d.m.d.", "m...d.m.d"]))], drink: px(["........." , ".........", ".........", "hhhhhh...", "lmmmmmlh.", "dmmmmmmlm", "m.d...m.dm", "m.d...m.d."]), stand: px(dS) };
      const mo = ["..........a.a.a", ".........aaaaa.", "..........hlh..", ".........lmmmh.", "..h......mmmmm.", ".hhhhhhhhlmmm..", "hllllllllmmm...", "lmmmmmmmmmm....", "dmmmmmmmmmd....", "m.dm...m.d.....", "m.d....m.d.....", "m.d....m.d....."];
      S.moose = { walk: [px(mo), px(mo.slice(0, 9).concat([".md.m..m..d....", ".m...d.m...d...", ".m...d.m...d..."]))], drink: px(["...............", "...............", "...............", "...............", "..h............", ".hhhhhhhhh.a.a.", "hllllllllmaaa..", "lmmmmmmmmmhlh..", "dmmmmmmmmmmmmh.", "m.dm...m.dmmmm.", "m.d....m.d.mm..", "m.d....m.d....."]), stand: px(mo) };
      S.loon = { sit: px([".....##", "....###", ".....#.", "#w#w##.", "w#w#w#.", ".####.."]), up: px(["#.....#..", "##...##..", ".##.##...", "..####.##", "...##.###", "..#w#w##.", "..w#w#w#.", "...####.."]) };
      // a thin cloud for the moon: lumpy, its upper rim lit where the moon is behind it
      const cl = pr ? 38 : 58, ch = pr ? 17 : 22, n1 = noise1(301, 64), n2 = noise1(303, 64);
      const dens = (x, y) => { const body = Math.pow(Math.sin(Math.PI * clamp(x / (cl - 1))), .6), top = ch * (.6 - .5 * body * (.55 + .45 * Math.abs(Math.sin(x * .23 + fbm(n1, x * .1, 2) * 3)))), bot = ch * (.66 + .3 * body * fbm(n2, x * .2, 2)); return y < top || y > bot ? 0 : clamp(Math.min(y - top + .6, bot - y + .5)); };
      S.ecl = []; S.erim = []; for (let y = 0; y < ch; y++) for (let x = 0; x < cl; x++) { const v = dens(x, y); if (v <= 0 || (v < .4 && dith(x, y) > v * 1.5)) continue; S.ecl.push([x, y, v]); if (dens(x, y - 1) <= 0) S.erim.push([x, y]); }
      Object.assign(S, { cl, ch });
      // fireflies over the grass by the water and the shore
      S.ffl = Array.from({ length: pr ? 10 : 16 }, (_, i) => { let x; do { x = bw * (.04 + q() * .92); } while (Math.abs(x - S.fx) < (pr ? 10 : 14)); return { x, y: i < (pr ? 3 : 5) ? S.sy - 2 - q() * 5 : S.sy + 3 + q() * (bh - S.sy - 10), ax: 2 + q() * 5, ay: 1 + q() * 3, fx: .3 + q() * .5, fy: .4 + q() * .6, rise: 2 + q() * 7, p: Math.floor(q() * 8), s: 1.6 + q() * 1.2 }; });
      // the pop: a spray of sparks straight up
      S.popSparks = Array.from({ length: 18 }, () => ({ a: -Math.PI / 2 + (q() - .5) * .8, v: 34 + q() * 30, l: .55 + q() * .6 }));
      // the northern lights: a curtain over the far hills (on a phone, high up, above the list) as an index map, each pixel a
      // level up from its hem and a phase along it; the colours of its sixty-four entries turn, and the light runs along it
      const x0 = pr ? 0 : Math.round(bw * .52), w = bw - x0, hem0 = pr ? Math.round(bh * .25) : S.hy - 38, len = pr ? 34 : 50, y0 = Math.max(0, hem0 - len - 30), h = hem0 + 8 - y0, na = noise1(307, 64), nb = noise1(309, 64), map = new Uint8Array(w * h);
      for (let x = 0; x < w; x++) { const hem = hem0 + Math.sin(x * .05 + 1.3) * (pr ? 3 : 5) + Math.sin(x * .13 + .4) * 2.5 - (pr ? 0 : (1 - x / w) * 20), tall = len * (.45 + .55 * fbm(na, x * .06, 2)), fade = Math.min(1, x / (w * (pr ? .12 : .3)), (w - x) / (w * .06));
        const bend = Math.round(fbm(nb, x * .08, 2) * 9); for (let y = Math.max(0, Math.round(hem - tall)); y <= Math.min(h + y0 - 1, Math.round(hem)); y++) { const lv = Math.min(7, Math.floor((1 - (hem - y) / tall) * 8 * (.3 + .7 * fade))); if (lv < 1 && dith(x, y) > .5) continue; map[(y - y0) * w + x] = 1 + Math.max(0, lv) * 8 + ((x * 2 + bend + ((hem - y) >> 2)) & 7); } }
      S.aur = { x0, y0, w, h, map }; S.aurR = new Float32Array(64); S.aurG = new Float32Array(64); S.aurB = new Float32Array(64);
      // mist on the lake: long wisps lying on the water, twice the lake's width so they can drift, in four levels; lavender
      // in the moonlight, warming to the fire's orange near it
      const mh = S.sy - S.hy, mw = bw * 2, nm = noise1(311, 64), nm2 = noise1(313, 64), mm = new Uint8Array(mw * mh);
      for (let y = 0; y < mh; y++) { const low = Math.pow(y / mh, .7), band = Math.floor(y / 3), bf = Math.sin(Math.PI * ((y % 3) + .5) / 3); for (let x = 0; x < mw; x++) { const u = x / mw * 64, v = (fbm(nm, u * .6 + band * 7.31, 3) * .75 + fbm(nm2, u * .23 + band * 3.17, 2) * .25 - .47) * 3.2 * bf * (.3 + .7 * low); mm[y * mw + x] = v <= 0 ? 0 : Math.min(4, 1 + Math.floor(v * 4)); } } // each band of three rows a wisp of its own, lying along the water
      S.mist = { mm, mw, mh, col: Array.from({ length: bw }, (_, x) => pack(mix(hex("#8E88C0"), hex("#E08A4A"), clamp(1 - Math.abs(x - S.fx) / (pr ? 34 : 48)) * .8))) };
    },
    /** the first pass, number for number the loop this scene has always played */
    sig() {
      const { bw, bh, pr } = S;
      return { flare: B.flare, log: B.log, star: { t: B.star, path: pr ? [bw * .15, bh * .07, bw * .55, bh * .18] : [bw * .3, bh * .07, bw * .62, bh * .24] }, owl: { t: B.owl, path: S.owlPath }, fish: [{ t: B.fish, at: S.fishAt, d: 1 }] };
    },
    /** pass n's night, from its own dice: the fire's heartbeat, what the sky does, what happens on the lake, and when */
    dealPass(n) {
      const r = deal(n, 3), { bw, bh, hy, sy, mx, my, mr, pr } = S, pick = (a, b) => a + r() * (b - a), side = () => r() < .5 ? 1 : -1;
      const rare = bag(n, 8, 7), sky = rare === 1 ? 3 : rare === 2 ? 4 : bag(n, 3, 2), lake = rare === 3 ? 4 : bag(n, 4, 1);
      const a = pick(.3, 1.3), pl = { dealt: true, flare: [a, a + .6, a + 1.8, a + 2.6], heat: (r() < .5 ? -1 : 1) * pick(.06, .16) }; // some nights the fire burns higher, some lower
      const m0 = pick(.8, 2.4), misty = bag(n, 3, 5); if (misty && sky !== 3) pl.mist = { t: [m0, m0 + 3, m0 + 8.6, m0 + 11.6], k: misty === 2 ? 1.2 : 1, band: misty === 2 ? [-1, 2] : pr ? [-1, .5] : [.45, 2], v: side() * pick(1.2, 2.6) }; // mist on the lake: a thin one along the shore the list leaves open (on a phone the far one, on a desktop ours), or a thick one filling it
      // the fire's second beat: a log settles in a burst of sparks, or the fire pops and throws an ember
      if (r() < .55) pl.log = pick(3.9, 5.4); else pl.pop = { t: pick(3.9, 5.6), dx: side() * pick(pr ? 7 : 10, pr ? 11 : 16), dy: pick(pr ? 5 : 6, pr ? 8 : 10), h: pick(6, 12) };
      // the sky: the falling star, the owl, a cloud over the moon (or, rarely, the northern lights, a meteor shower)
      const star = t0 => { const d = side(), x0 = bw * (pr ? pick(.1, .8) : pick(.3, .62)), y0 = bh * pick(.04, .1); let x1 = clamp(x0 + d * bw * (pr ? pick(.3, .42) : pick(.2, .3)), bw * .04, bw * .96), y1 = y0 + bh * pick(.06, .12); if (Math.hypot(x1 - mx, y1 - my) < mr * 3) { x1 = lerp(x0, x1, .55); y1 = lerp(y0, y1, .55); } return { t: [t0, t0 + pick(.7, .9)], path: [x0, y0, x1, y1] }; };
      const owl = t0 => { const d = side(), ya = bh * (pr ? pick(.1, .19) : pick(.15, .26)), yb = ya - bh * pick(.02, .1); return { t: [t0, t0 + pick(2.7, 3.3)], path: d > 0 ? [[-12, ya], [bw + 12, yb]] : [[bw + 12, ya], [-12, yb]] }; };
      const s1 = pick(5.4, 7.2);
      if (sky === 0) { pl.star = star(s1); if (r() < .5) pl.owl = owl(s1 + pick(1.8, 2.6)); }
      else if (sky === 1) { pl.owl = owl(s1); if (r() < .5) pl.star = star(s1 + pick(3.4, 4.2)); }
      else if (sky === 2) { const c0 = pick(1.4, 3.2); pl.cloud = { t: [c0, c0 + (pr ? 8.8 : 10)], x0: bw + 2, x1: mx - S.cl - (pr ? 10 : 18), y: my - Math.round(S.ch * .55) + Math.round(pick(-1, 1)) }; }
      else if (sky === 3) { const a3 = pick(1.2, 2.2); pl.aurora = { t: [a3, a3 + 3, a3 + 8.4, a3 + 11.4] }; }
      else { const k = pr ? 6 : 9, rx = bw * (pr ? pick(.3, .6) : pick(.5, .7)), ry = bh * pick(.04, .09), t0 = pick(5.4, 6.6), list = [];
        for (let j = 0; j < k; j++) { const tj = t0 + j * (4.6 / k) + pick(0, .3), th = pick(-.15, 1.15) * Math.PI, s0 = pick(pr ? 4 : 6, pr ? 14 : 24), L = pick(pr ? 14 : 22, pr ? 28 : 48), c = Math.cos(th), sn = Math.sin(th);
          list.push({ t: [tj, tj + pick(.35, .6)], path: [rx + c * s0, ry + sn * s0, rx + c * (s0 + L), ry + sn * (s0 + L)] }); }
        pl.meteors = list; }
      // the lake: the fish, a canoe with a lantern, a loon, a deer at the far shore (or, rarely, a moose)
      if (lake === 0) { const lt = pick(9.6, 10.6), k = r() < .5 ? 1 : 2; pl.fish = Array.from({ length: k }, (_, i) => ({ t: lt + i * pick(.8, 1.3), at: [Math.round(bw * (pr ? pick(.15, .75) : pick(.2, .62))), Math.round(lerp(hy, sy, pick(.48, .8)))], d: side() })); }
      else if (lake === 1) { const t0 = pick(.5, 1.6); pl.canoe = { t: [t0, t0 + (pr ? 10.4 : 12.4)], dir: side(), y: sy - (pr ? 13 : 16) }; }
      else if (lake === 2) { const t0 = pick(6.0, 7.2), d = side(), x = bw * (pr ? pick(.2, .6) : pick(.24, .5)), y = Math.round(lerp(hy, sy, pick(.55, .75))); pl.loon = [{ t0, d: 3.4, x, y, dir: d, flap: pick(1.2, 1.8) }, { t0: t0 + 4.6, d: 1.6, x: x + d * (pr ? 16 : 26), y: y + (r() < .5 ? 2 : -2), dir: d, flap: -9 }]; }
      else if (lake === 3) pl.deer = { t0: pick(5.6, 7.4), x: Math.round(bw * (pr ? pick(.2, .55) : pick(.62, .68))), dir: side() };
      else pl.moose = { t0: pick(5.2, 6.4), x: Math.round(bw * (pr ? pick(.2, .5) : pick(.6, .66))), dir: side() };
      // and some nights fireflies come out over the grass
      if (r() < .5) { const f0 = pick(1.6, 3.4); pl.flies = { t: [f0, f0 + 2.2, 11.6, 13.6], ph: Math.floor(pick(0, 8)) }; }
      return pl;
    },
    /** 1.12 b413: the egg's night (every twelfth pass, K.egg): the fire to itself, and someone just out of the picture on the
     *  log beside it. A green stick comes in from the edge away from the words with a marshmallow on it and holds it at the
     *  flames' edge; it goes golden, then brown; the fire flares, the flames lick it, and it catches, a little fire of its own;
     *  the stick whips it up out of the heat and it goes out in a puff of smoke, and the stick goes back the way it came, the
     *  marshmallow black on the side that faced the fire, a last ember winking out in the char. Its own dice; nothing else */
    eggPlan(n) {
      const { bw, fx, fy, pr } = S, tip = [fx + (pr ? 6 : 7), fy - (pr ? 14 : 17)], hand = [bw + (pr ? 3 : 5), fy + (pr ? 19 : 15)];
      const L = Math.hypot(tip[0] - hand[0], tip[1] - hand[1]), th = Math.atan2(tip[1] - hand[1], tip[0] - hand[0]);
      return { dealt: true, flare: [6.05, 6.4, 6.9, 8.0], heat: .05, egg: { hand, L, th, in: [1.1, 3.3], toast: [3.4, 6.3], fire: 6.45, whip: [7.15, 7.5], wave: [7.5, 8.3], back: [10.4, 12.9] } };
    },
    /** where the stick is at T: its hand end and its tip, and how fast the tip is going */
    stickAt(T, e) {
      const o = S.sk || (S.sk = [0, 0, 0, 0, 0]), ext = E.out(seg(T, e.in[0], e.in[1], x => x)) * (1 - E.io(seg(T, e.back[0], e.back[1], x => x))), whip = E.back(seg(T, e.whip[0], e.whip[1], x => x)) * (1 - seg(T, e.back[0] + .4, e.back[1], E.sine) * .5);
      const wave = Math.sin(seg(T, e.wave[0], e.wave[1], x => x) * Math.PI * 4) * .075 * (1 - seg(T, e.wave[0], e.wave[1], x => x) * .5); // waved, to put it out
      const shake = Math.sin(T * 2.3) * .012 + Math.sin(T * 5.1 + 1) * .006, a = e.th + whip * .3 + wave + shake, slide = (e.L + 6) * (1 - ext); // held in a hand: a little tremble; whipped up out of the heat, and lowered a little as it goes
      o[0] = e.hand[0] - Math.cos(e.th) * slide; o[1] = e.hand[1] - Math.sin(e.th) * slide; o[2] = o[0] + Math.cos(a) * e.L; o[3] = o[1] + Math.sin(a) * e.L; o[4] = a; return o;
    },
    mallowAt(T, I, A, e) {
      if (T < e.in[0] || T > e.back[1]) return;
      const M = S.mal || (S.mal = { stick: [pack(hex("#22180E")), pack(hex("#3A2E18")), pack(hex("#4C4A22")), pack(hex("#A8642C"))], raw: [hex("#FFE7C4"), hex("#F2EAE0"), hex("#C9BFB6")], gold: hex("#E2A452"), brown: hex("#8E4E22"), char: hex("#1E120C"), charL: hex("#33200F"), crust: hex("#5C3A22"), smoke: pack(hex("#B2AECC")), edge: hex("#FFF3DA") });
      const [x0, y0, tx, ty, a] = S.stickAt(T, e), { fx, fy } = S, put = (x, y, c, k = 1) => S.tint(x, y, c, k * I);
      // the stick: green wood, its bark darker toward the hand, the firelight along it near the flames
      const n = Math.ceil(Math.hypot(tx - x0, ty - y0));
      for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(x0, tx, u), y = lerp(y0, ty, u), near = clamp(1 - Math.hypot(x - fx, y - fy + 12) / 40); put(x, y, near > .45 ? M.stick[3] : u > .55 ? M.stick[2] : (i & 3) ? M.stick[1] : M.stick[0]); if (u < .55) put(x, y + 1, M.stick[0], .85); } // (thicker toward the hand)
      // the marshmallow, on the tip: white, lit from the fire's side; golden, brown, then black where it faced the flames
      const k = seg(T, e.toast[0], e.toast[1], E.sine), burn = env(T, e.fire, e.fire + .45, e.wave[1] - .45, e.wave[1] - .05, E.sine), ch = seg(T, e.fire, e.wave[1], E.out);
      const cx = Math.round(tx - Math.cos(a) * 2.5), cy = Math.round(ty - Math.sin(a) * 2.5), fs = fx < cx ? -1 : 1, MS = [".#####.", "#######", "#######", "#######", "#######", ".#####."]; // fs: the side that faces the fire
      for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) { if (MS[j][i] === ".") continue; const side = (i - 3) * fs, fire = side >= .5 ? 1 : side >= -.5 ? .45 : 0; // 1 the face toward the fire, 0 the far one
        let c = side >= 1 ? M.raw[0] : side >= 0 ? M.raw[1] : M.raw[2]; if (j === 0 && side < 1) c = mix(c, M.edge, .4);
        c = mix(c, M.gold, k * (.35 + .65 * fire)); c = mix(c, M.brown, clamp(k * 1.6 - .6) * fire); c = mix(c, j === 0 || MS[j - 1][i] === "." ? M.crust : (i + j) & 1 ? M.char : M.charL, ch * (fire > .9 ? 1 : fire > .3 ? .55 : .12)); /* the crust: black, flecked, its top edge catching the light */
        put(cx - 3 + i, cy - 3 + j, pack(c)); }
      if (T > e.wave[1] - .1) { const em = env(T, e.wave[1] - .1, e.wave[1] + .1, e.wave[1] + 1.2, e.wave[1] + 2.8); for (const [i, j] of [[0, 1], [1, 3], [0, 2]]) { const fl = .5 + .5 * Math.sin(A * 9 + i * 2 + j); if (em * fl > .05) put(cx + (fs < 0 ? -3 + i : 3 - i), cy - 3 + j, FIRE[Math.round(18 + 12 * em * fl)], em * fl); } } // an ember left in the char, winking out
      // its own little fire: up from the face toward the flames, leaning away from where the tip is going
      if (burn > .02) { const [, , px, py] = S.stickAt(T - 1 / 30, e), vx = (tx - px) * 30, H = Math.round(4 + 15 * burn), base = cy - 4;
        for (let r = 0; r < H; r++) { const q = r / H, hw = Math.pow(1 - q, .55) * 3.9 * Math.min(1, burn * 1.5) + .4, mid = cx + fs * 1.3 - clamp(vx * .012, -1, 1) * r + Math.sin(T * 14 + r * .9) * .55 * q; // (streaming back as it is whipped through the air)
          for (let x = Math.floor(mid - hw); x <= Math.ceil(mid + hw); x++) { const d = Math.abs(x - mid) / hw; if (d > 1) continue; const nz = Math.sin(x * 12.9898 + r * 78.233 + Math.floor(T * 15) * 37.719) * 43758.5453, h = Math.round(36 * burn * Math.pow(1 - q, .7) * Math.pow(1 - d, .45) * (.66 + .14 * Math.sin(T * 23 + x * 3.1 + r * 1.7) + .26 * (nz - Math.floor(nz)))); /* ragged, as the fire's own flames are */ if (h > 7) put(x, base - r, FIRE[Math.min(36, h)]); } } }
      // the puff of smoke as it goes out, rising and spreading and thinning, and a wisp after it
      const t0 = e.wave[1] - .15, [, , sx, sy] = S.stickAt(t0, e);
      for (let i = 0; i < 20; i++) { const ag = T - t0 - i * .02; if (ag <= 0 || ag > 2.8) continue; const q = ag / 2.8, ang = -1.57 + (i - 9.5) * .15, sp = 3 + (i % 3) * 1.5, x = sx + Math.cos(ang) * sp * Math.sqrt(ag) * 2 + ag * 2.4, y = sy - 4 - ag * (5 + (i % 4)) + Math.sin(ang) * sp * .5 * Math.sqrt(ag), k2 = Math.pow(1 - q, 1.5) * .8;
        put(x, y, M.smoke, k2); put(x + 1, y, M.smoke, k2 * .8); if (q > .12) { put(x, y - 1, M.smoke, k2 * .7); put(x + 1, y - 1, M.smoke, k2 * .55); } if (q > .3) { put(x - 1, y, M.smoke, k2 * .45); put(x + 2, y - 1, M.smoke, k2 * .35); } } // (each a little cloud that grows as it rises)
      for (let i = 0; i < 6; i++) { const ag = ((T - t0 - .4) * .9 + i * .32) % 2; if (T < t0 + .4 || T > e.back[0] + 1 || ag < 0) continue; const k3 = (1 - ag / 2) * .35 * (1 - seg(T, e.back[0], e.back[0] + 1, x => x)); put(cx + fs * .5 + Math.sin(ag * 3 + i) * ag * .9 + ag * 1.2, cy - 4 - ag * 6, M.smoke, k3); } // the wisp
    },
    /** 1.12 b429: the first hour egg (K.long 1, once in an odd hour of the list left alone): the sky's pictures. Stars leave
     *  their places and slide across the sky to one another, and lines run between them, the Plough first and then the rest
     *  of the Great Bear round it; the bear is drawn in about them from the tail in a pale gold line, as on an old star chart, and comes
     *  alive — it walks along the sky over the hills, the stars at its paws stepping, until it stands under the moon and
     *  lifts its nose to sniff at it; then the picture fades, the lines let go, and the stars slide home. Composed, not dealt */
    bearPlan() {
      const { bw, mx, my, mr, pr } = S, sc = .85, dx = pr ? 16 : 36, ex = mx - mr * (pr ? .75 : .85), ey = my + mr * (pr ? .65 : -.55), ox = Math.round(ex - 26.1 * sc) - dx, oy = Math.round(ey + 13.3 * sc); // it walks to where, nose up, it touches the moon's edge (on a desktop its upper edge, so that its paws stay above the list)
      // the figure's stars as it stands to be drawn, and for each a star of the sky far enough off to be seen coming
      const pts = S.bearPts(0, 0), used = new Set(), minD = pr ? 14 : 24, stars = [], idx = S.idx;
      const free = ([x, y]) => { const v = idx[y * bw + x] - STAR; if (v < 0 || v > 7) return false; for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const w = idx[(y + ay) * bw + x + ax] - ARM; if (w >= 0 && w <= 7) return false; } return true; }; // (one still showing, and without arms)
      pts.forEach(([px, py], k) => { const tx = ox + px * sc, ty = oy + py * sc; let best = -1, bd = 1e9; S.stars.forEach((st, i) => { if (used.has(i) || !free(st)) return; const d = Math.hypot(st[0] - tx, st[1] - ty); if (d >= minD && d < bd) { bd = d; best = i; } });
        if (best < 0) return; used.add(best); const [hx, hy] = S.stars[best], a = k < 7 ? .5 + k * .28 : 2.6 + (k - 7) * .14, b = 11.2 + (k * 5 % 18) * .07;
        stars.push({ k, home: [hx, hy], ph: idx[hy * bw + hx] - STAR, under: S.skyAt(hx, hy), t: [a, a + 1.2, b, b + 1.3], bend: (k % 2 ? 1 : -1) * .16 }); });
      return { dealt: true, flare: [.6, 1.2, 2.2, 3.0], heat: .04, bear: { sc, ox, oy, dx, stars, trace: [4.6, 5.6], walk: [5.8, 9.6], sniff: [9.5, 9.9, 10.5, 10.9], fade: [10.8, 11.6] } };
    },
    /** what the sky is at a pixel under a star (the backdrop's sky and Milky Way, worked out again) */
    skyAt(x, y) {
      const { bw, hy } = S, n1 = S.n7 || (S.n7 = noise1(7, 64)), n2 = S.n11 || (S.n11 = noise1(11, 64)), f = Math.pow(y / hy, 1.3) * 15, k = Math.floor(f); let v = SKY + Math.min(15, k + (f - k > dith(x, y) ? 1 : 0));
      const u = x / bw, vv = y / hy, c = lerp(.95, -.05, u) + .04 * Math.sin(u * 6), d = Math.abs(vv - c), w = .15;
      if (d <= w && vv <= .7) { const dens = (1 - d / w) * (.5 + .5 * fbm(n1, x * .07 + y * .04, 3)) * clamp((.7 - vv) / .25) - .5 * Math.exp(-(((vv - c + .02) / .025) ** 2)) * fbm(n2, x * .15, 2), lv = dens * 4 - dith(x, y) * 1.1; if (lv > 0) v = MILKY + Math.min(3, Math.floor(lv)); }
      return v;
    },
    /** the Great Bear's stars, for a step of its walk (ph) and how far its nose is lifted (look): the Plough's handle its tail
     *  and its bowl the bear's back and haunch, then its shoulder, head, nose and ear, and the legs, near ones joined up */
    bearPts(ph, look) {
      const o = S.bp || (S.bp = Array.from({ length: 18 }, () => [0, 0])), A = Math.PI * 2 * ph, bob = -Math.abs(Math.sin(A)) * .7, sw = Math.sin(A) * .7, set = (i, x, y) => { o[i][0] = x; o[i][1] = y; };
      set(0, -47, -16 + sw); set(1, -38, -10 + sw * .6); set(2, -29, -5 + sw * .3); set(3, -20, -4 + bob); set(4, -4, -6 + bob); set(5, -5, 9 + bob); set(6, -19, 8 + bob);
      const hx = 17, hy = -6 + bob * .6 - look * 2.5, a0 = Math.atan2(5, 9) - 1.0 * look; set(7, 7, -6 + bob); set(8, hx, hy); set(9, hx + Math.cos(a0) * 10.3, hy + Math.sin(a0) * 10.3); set(10, hx - 3 - look, hy - 5.5 + look);
      const leg = (j0, j1, kx, ky, px, py, a, bend, far) => { const k1x = j0 + Math.sin(a) * 7, k1y = j1 + Math.cos(a) * 7, b = a + bend; if (!far) { set(kx, k1x, k1y); set(px, k1x + Math.sin(b) * 7.2, k1y + Math.cos(b) * 7.2); } else set(px, k1x + Math.sin(b) * 7.2 + 2.5, k1y + Math.cos(b) * 7.2); };
      const aF = .45 * Math.sin(A), lF = Math.max(0, Math.cos(A)), aH = .45 * Math.sin(A + Math.PI), lH = Math.max(0, -Math.cos(A));
      set(11, 6, 7 + bob); leg(6, 7 + bob, 12, null, 13, null, aF, -.7 * lF, 0); leg(-19, 8 + bob, 14, null, 15, null, aH, .6 * lH, 0);
      leg(6, 7 + bob, null, null, 16, null, aH, -.7 * lH, 1); leg(-19, 8 + bob, null, null, 17, null, aF, .6 * lF, 1);
      return o;
    },
    /** the bear as an old chart draws it, round its stars: which of the figure's pixels are its outline (2) and inside it (1),
     *  for a step of its walk and a lift of its nose, worked out the first time each is wanted */
    bearShape(sc, phi, li) {
      const key = sc + "|" + phi + "|" + li, c = S.bearC || (S.bearC = new Map()); let m = c.get(key); if (m) return m;
      const p = S.bearPts(phi / 16, li / 4).map(([x, y]) => [x * sc, y * sc]), A = Math.PI * 2 * phi / 16, bob = -Math.abs(Math.sin(A)) * .7 * sc, X0 = Math.floor(-52 * sc), Y0 = Math.floor(-24 * sc), w = Math.ceil(84 * sc), h = Math.ceil(50 * sc), sh = [];
      const cap = (ax, ay, ar, bx, by, br) => sh.push([ax, ay, ar * sc, bx, by, br * sc]), circ = (x, y, r) => cap(x, y, r, x, y, r), at = (x, y) => [x * sc, y * sc + bob];
      cap(...at(-18, 2), 8.4, ...at(3, 1), 9); circ(...at(-7, 5), 8.8); circ(...at(3, -2.5), 8.6); // the haunch, the heavy barrel, the hump over the shoulders
      cap(...at(8, 0), 6.4, p[8][0], p[8][1] + 1.4 * sc, 5); circ(p[8][0], p[8][1] + .4 * sc, 5.6); cap(p[8][0] + .8 * sc, p[8][1] + 1 * sc, 3.9, p[9][0], p[9][1], 2.5); circ(p[10][0], p[10][1] + .8 * sc, 1.7); // the neck, the broad head, the long muzzle, a small round ear
      cap(...at(-24, -1), 2.2, p[2][0], p[2][1], 1.6); cap(p[2][0], p[2][1], 1.6, p[1][0], p[1][1], 1.2); cap(p[1][0], p[1][1], 1.2, p[0][0], p[0][1], .8); // the long tail of the old charts, along the Plough's handle
      cap(p[11][0], p[11][1], 4.9, p[12][0], p[12][1], 4); cap(p[12][0], p[12][1], 4, p[13][0], p[13][1], 3.3); cap(p[6][0], p[6][1], 6, p[14][0], p[14][1], 4.2); cap(p[14][0], p[14][1], 4.2, p[15][0], p[15][1], 3.3); // the near legs, thick
      cap(p[11][0] + 2 * sc, p[11][1], 4, p[16][0], p[16][1], 2.9); cap(p[6][0] + 2 * sc, p[6][1], 4.8, p[17][0], p[17][1], 2.9); // the far ones
      for (const i of [13, 15, 16, 17]) cap(p[i][0] - .5 * sc, p[i][1] + .6 * sc, 2.4, p[i][0] + 2.6 * sc, p[i][1] + .9 * sc, 1.8); // and the paws, flat on the sky
      const inn = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const px = X0 + x + .5, py = Y0 + y + .5; for (const [ax, ay, ar, bx, by, br] of sh) { const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6, t = clamp(((px - ax) * dx + (py - ay) * dy) / L2), rr = lerp(ar, br, t), qx = ax + dx * t - px, qy = ay + dy * t - py; if (qx * qx + qy * qy <= rr * rr) { inn[y * w + x] = 1; break; } } }
      m = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!inn[i]) continue; m[i] = x && y && x < w - 1 && y < h - 1 && inn[i - 1] && inn[i + 1] && inn[i - w] && inn[i + w] ? 1 : 2; }
      m = { m, w, h, X0, Y0 }; c.set(key, m); return m;
    },
    /** the stars come, the lines run, the picture is drawn in and walks, sniffs at the moon, and comes apart */
    bearAt(T, I, A, b) {
      const { bw, out, pal } = S, sc = b.sc, wk = seg(T, ...b.walk, E.sine), ph = (wk * b.dx) / (14 * sc), look = env(T, ...b.sniff, E.sine), sn = look > .5 ? Math.max(0, Math.sin(T * 19)) * .25 : 0, fade = 1 - seg(T, ...b.fade, E.sine);
      const OX = Math.round(b.ox + wk * b.dx), OY = b.oy, phi = Math.round(ph * 16) % 16, li = Math.round((look + sn) * 4), pts = S.bearPts(phi / 16, (look + sn)), at = new Map();
      const BL = S.bearL || (S.bearL = { line: pack(hex("#A9B8F2")), gold: pack(hex("#E9C77E")), fill: pack(hex("#5B4F95")), star: pack(hex("#FFFFFF")), arm: pack(hex("#BDB6EE")), halo: pack(hex("#E8E2FF")) });
      const { hy, sy, idx } = S, put = (x, y, c, k) => { S.tint(x, y, c, k); const yr = Math.round(hy + (hy - y) / 1.7); if (yr <= hy + 1 || yr >= sy || (yr - hy) & 1) return; const xr = Math.round(x + Math.sin(yr * 1.3 + T * 2.2) * .9), ix = idx[yr * bw + xr]; if (ix >= LAKE && ix < FREF) S.tint(xr, yr, c, k * .42); }; // and again in the lake, broken by the ripples
      const boop = env(T, b.sniff[1] - .05, b.sniff[1] + .15, b.sniff[1] + .35, b.sniff[2] + .2, E.sine) * I; // the moon glows where its nose touches it
      if (boop > .01) { const { mx, my, mr } = S; for (let y = Math.floor(my - mr * 2.4); y <= my + mr * 2.4; y++) for (let x = Math.floor(mx - mr * 2.4); x <= mx + mr * 2.4; x++) { const d = Math.hypot(x - mx, y - my) / mr; if (d > 1 && d < 2.4) S.tint(x, y, BL.halo, boop * .5 * Math.pow((2.4 - d) / 1.4, 1.6)); } }
      // where each of the figure's stars is: on its way from its place, in the picture, or on its way home
      for (const st of b.stars) {
        const [h0, h1] = st.home, tx = OX + pts[st.k][0] * sc, ty = OY + pts[st.k][1] * sc, q1 = seg(T, st.t[0], st.t[1], E.io), q2 = seg(T, st.t[2], st.t[3], E.io);
        if (q1 <= 0 || q2 >= 1) continue;
        const [fx, fy] = q2 > 0 ? [tx, ty] : [h0, h1], [gx, gy] = q2 > 0 ? [h0, h1] : [tx, ty], q = q2 > 0 ? q2 : q1, mx = (fx + gx) / 2 - (gy - fy) * st.bend, my = (fy + gy) / 2 + (gx - fx) * st.bend, u = q, x = (1 - u) * (1 - u) * fx + 2 * u * (1 - u) * mx + u * u * gx, y = (1 - u) * (1 - u) * fy + 2 * u * (1 - u) * my + u * u * gy;
        { const i = h1 * bw + h0; out[i] = blend(pal[st.under], out[i], 1 - I); } // its place, bare while it is away (and the star back in it as a touch eases the picture out)
        const lit = q2 > 0 ? 1 - q2 : q1, tw = pal[STAR + st.ph]; at.set(st.k, [x, y, lit]);
        const mv = q > 0 && q < 1 ? Math.sin(Math.PI * q) : 0; // (how fast it is going)
        if (mv > 0) for (let j = 1; j < 7; j++) { const v = Math.max(0, u - j * .03), tx2 = (1 - v) * (1 - v) * fx + 2 * v * (1 - v) * mx + v * v * gx, ty2 = (1 - v) * (1 - v) * fy + 2 * v * (1 - v) * my + v * v * gy; put(tx2, ty2, BL.arm, I * (1 - j / 7) * .8 * mv); } // a trail as it slides
        put(x, y, blend(tw, BL.star, Math.max(lit, mv)), I);
        const arm = Math.max((lit - .5) * 1.3, mv * .7); if (arm > 0) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + ax, y + ay, BL.arm, I * Math.min(1, arm));
      }
      // the lines between them, run out as both ends are in place, let go as the picture comes apart
      const lf = 1 - seg(T, 11.0, 11.8, E.sine);
      for (const [a, c] of BEAR) { const pa = at.get(a), pc = at.get(c); if (!pa || !pc) continue; const arr = Math.max(b.stars.find(s => s.k === a).t[1], b.stars.find(s => s.k === c).t[1]), q = seg(T, arr - .1, arr + .35, E.out) * lf; if (q <= 0) continue;
        const n = Math.ceil(Math.hypot(pc[0] - pa[0], pc[1] - pa[1]) * q); for (let i = 1; i < n; i++) { const f = i / Math.max(1, Math.hypot(pc[0] - pa[0], pc[1] - pa[1])); put(lerp(pa[0], pc[0], f), lerp(pa[1], pc[1], f), BL.line, I * .5 * Math.min(pa[2], pc[2], 1)); } }
      // the picture round them: a pale gold line traced in from the tail, a light running along it, and a haze inside
      const tr = seg(T, ...b.trace, E.sine) * fade; if (tr <= 0) return;
      const sh = S.bearShape(sc, phi, li), { m, w, h, X0, Y0 } = sh;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = m[y * w + x]; if (!v) continue; const gx = OX + X0 + x, gy = OY + Y0 + y; if (v === 2) { const run = .7 + .3 * Math.sin((x + y) * .55 - T * 4); put(gx, gy, BL.gold, I * .5 * run * clamp(tr * 2.2 - (x / w) * 1.2)); } else S.tint(gx, gy, BL.fill, I * .22 * tr); }
    },
    /** 1.12 b429: the second hour egg (K.long 2, once in an even hour): a launch. Far off behind the hills a light comes up
     *  under the sky, and a rocket climbs out of it on a pillar of fire, slowly and then faster, its light running down the
     *  lake; it leans over on its long arc, drops two boosters that fall away glowing, and as it climbs into the sunlight
     *  still up there its plume opens behind it into a vast pale-blue bell, the jellyfish of a launch at dusk, the rocket a
     *  spark at its tip going on alone; the plume drifts and thins and is gone. The sound never arrives. Composed; the
     *  plume's own dice */
    launchPlan(n) {
      const { bw, bh, pr } = S, lx = Math.round(bw * (pr ? .62 : .83)), ly = S.ridge(lx) - 1, sgn = pr ? -1 : 1, r = deal(n, 61);
      const ctl = pr ? [[lx, ly + 3], [lx - 1, ly - 28], [lx - 8, ly - 56], [lx - 22, ly - 80], [lx - 42, ly - 96], [lx - 66, ly - 106], [lx - 100, ly - 113]] : [[lx, ly + 3], [lx + 1, ly - 28], [lx + 7, ly - 53], [lx + 21, ly - 73], [lx + 43, ly - 86], [lx + 73, ly - 94], [lx + 110, ly - 99]]; // up out of the light, leaning over onto its long arc, across the sky and away over the edge
      const path = []; for (let i = 0; i <= 96; i++) { const f = i / 96 * (ctl.length - 1), j = Math.min(ctl.length - 2, Math.floor(f)), t = f - j, a = ctl[Math.max(0, j - 1)], b = ctl[j], c = ctl[j + 1], d = ctl[Math.min(ctl.length - 1, j + 2)]; path.push([0, 1].map(k => .5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t * t + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t * t * t))); } // the arc, smoothed
      const t0 = 2.1, t1 = 9.8, NP = pr ? 150 : 210, parts = Array.from({ length: NP }, (_, i) => ({ tb: t0 + .15 + (i + r() * .8) / NP * (t1 - t0 - .3), side: (i & 1 ? 1 : -1) * Math.pow(r(), .6), back: .2 + r() * .8, wob: r() * 6.28 }));
      return { dealt: true, flare: [.4, 1.0, 2.0, 2.8], heat: .03, launch: { lx, ly, path, t0, t1, sun: Math.round(bh * (pr ? .2 : .26)), sep: .34, parts, glow: [.7, 2.1, 3.6, 5.2], fade: [10.8, 14.3], sgn } };
    },
    /** where the rocket is on its arc at progress u (0 … 1), and which way it is going */
    arcAt(L, u) { const p = L.path, f = clamp(u) * (p.length - 1), i = Math.min(p.length - 2, Math.floor(f)), t = f - i, o = S.ao || (S.ao = [0, 0, 0, 0]), dx = p[i + 1][0] - p[i][0], dy = p[i + 1][1] - p[i][1], l = Math.hypot(dx, dy) || 1; o[0] = lerp(p[i][0], p[i + 1][0], t); o[1] = lerp(p[i][1], p[i + 1][1], t); o[2] = dx / l; o[3] = dy / l; return o; },
    /** its progress at T: slow off the pad, faster and faster */
    arcU(L, T) { return T <= L.t0 ? 0 : Math.pow((T - L.t0) / (L.t1 - L.t0), 1.7); },
    /** the launch: the light behind the hills, the climb, the boosters, the plume in the sunlight, and all of it in the lake */
    launchAt(T, I, A, L) {
      const { bw, bh, hy, sy, idx, out } = S, C = S.lc || (S.lc = { glow: pack(hex("#F2A04E")), core: pack(hex("#FFF8E2")), flame: [pack(hex("#FFE7A0")), pack(hex("#FFB24A")), pack(hex("#F06A22")), pack(hex("#9C3418"))], smoke: pack(hex("#5A4E6E")), ramp: ["#1C2C78", "#2E5CC0", "#5C9CEA", "#A8D4FF", "#E8F6FF", "#FFFFFF"].map(h => pack(hex(h))), pink: pack(hex("#E9A6D8")) });
      const sky = i => { const v = idx[i]; return v < MTN || (v >= MOON + 3 && v <= MOON + 4); }, lake = i => { const v = idx[i]; return v >= LAKE && v < FREF; };
      const rip = S.rip && S.rip.length === bh ? S.rip : (S.rip = new Int8Array(bh)); for (let y = hy; y < sy; y++) rip[y] = Math.round(Math.sin(y * 1.1 + T * 2.6) * 1.1);
      const put = (x, y, c, k) => { x = Math.round(x); y = Math.round(y); if (x < 0 || x >= bw || y < 0 || y >= bh || k <= 0) return; const i = y * bw + x; if (y < hy && !sky(i)) return; S.tint(x, y, c, k); const yr = Math.round(hy + (hy - y) / 1.7); if (yr <= hy + 1 || yr >= sy || (yr - hy) & 1) return; const xr = x + rip[yr]; if (xr >= 0 && xr < bw && lake(yr * bw + xr)) S.tint(xr, yr, c, k * .45); }; // (behind the hills, not over them; and again in the lake)
      const fade = 1 - seg(T, ...L.fade, E.sine);
      // the light coming up behind the hills, and lighting the underside of the smoke as it goes
      const gl = env(T, ...L.glow, E.sine) * I, R = S.pr ? 16 : 22;
      if (gl > .01) for (let y = Math.max(0, L.ly - R); y < L.ly + 3; y++) for (let x = L.lx - R * 1.6; x <= L.lx + R * 1.6; x++) { const d = Math.hypot((x - L.lx) / 1.6, y - L.ly) / R; if (d < 1) put(x, y, C.glow, gl * .5 * Math.pow(1 - d, 1.8)); }
      // the plume: each puff left where the rocket was, spreading; in the dark below a smoke lit by the flame while it is new,
      // above the shadow line out in the sunlight, opening wide into the bell
      const u = S.arcU(L, T), pb = S.plumeB || (S.plumeB = { w: 0, h: 0 }), PW = S.pr ? 60 : 96, PH = S.pr ? 96 : 80; // (gathered at half the picture's pixels: it is soft, and the dither lays it back at whole ones)
      if (pb.w !== PW) { pb.w = PW; pb.h = PH; pb.sun = new Float32Array(PW * PH); pb.dim = new Float32Array(PW * PH); pb.hot = new Float32Array(PW * PH); }
      const bx0 = L.sgn > 0 ? L.lx - 40 : L.lx - PW * 2 + 40, by0 = L.ly + 6 - PH * 2; let x0 = PW, x1 = -1, y0 = PH, y1 = -1; // (the part of the buffer the puffs touch, and only that, mapped and cleared)
      for (const q of L.parts) {
        const age = T - q.tb; if (age <= 0 || T > L.fade[1]) continue;
        const [px0, py0, dx, dy] = S.arcAt(L, S.arcU(L, q.tb)), lit = py0 < L.sun ? clamp((L.sun - py0) / 14) : 0, alt = clamp((L.sun - py0) / (L.sun * .75)), sp = lerp(1.1, 3.5 + 7 * alt, lit), nx = -dy, ny = dx; // (the higher, the thinner the air and the wider it opens)
        const x = px0 + nx * q.side * sp * Math.pow(age, .7) - dx * q.back * (2 + 5 * lit) * Math.pow(age, .6) + Math.sin(age * .8 + q.wob) * .6 + age * .9 * L.sgn, y = py0 + ny * q.side * sp * Math.pow(age, .7) - dy * q.back * (2 + 5 * lit) * Math.pow(age, .6) + age * .25, rr = Math.min(10, 1.5 + (lit ? 2.4 + 2.4 * alt : .55) * Math.pow(age, .7));
        const br = (lit ? 1.5 : .7) * 1.33 * Math.min(1, age * 3) * Math.exp(-age / (lit ? 7 : 2.6)) / (.6 + rr * .25), hot = Math.exp(-age / .35); if (br < .012 && hot < .03) continue; // (fewer, and none of them too wide: a puff past its size adds nothing but cost)
        const cx = (x - bx0) / 2 - .25, cy = (y - by0) / 2 - .25, rh = Math.max(.8, rr / 2), r0 = Math.ceil(rh), ya = Math.max(0, Math.floor(cy - r0)), yb = Math.min(PH - 1, Math.ceil(cy + r0)), xa = Math.max(0, Math.floor(cx - r0)), xb = Math.min(PW - 1, Math.ceil(cx + r0)); if (xa > xb || ya > yb) continue; if (xa < x0) x0 = xa; if (xb > x1) x1 = xb; if (ya < y0) y0 = ya; if (yb > y1) y1 = yb;
        for (let yy = ya; yy <= yb; yy++) for (let xx = xa; xx <= xb; xx++) { const d2 = ((xx - cx) ** 2 + (yy - cy) ** 2) / (rh * rh); if (d2 >= 1) continue; const k = (1 - d2) * (1 - d2), i = yy * PW + xx; if (lit > 0) pb.sun[i] += k * br * lit; if (lit < 1) pb.dim[i] += k * br * (1 - lit); pb.hot[i] += k * hot; }
      }
      if (x1 >= 0) { const sa = pb.sun, da = pb.dim, ha = pb.hot; // read back smoothly between its cells
        if (x1 > x0 && y1 > y0)
        for (let Y = by0 + y0 * 2; Y <= by0 + y1 * 2; Y++) { const fy = Math.min((Y - by0) / 2, y1 - .001), iy = fy | 0, ty = fy - iy;
          for (let X = bx0 + x0 * 2; X <= bx0 + x1 * 2; X++) { const fx = Math.min((X - bx0) / 2, x1 - .001), ix = fx | 0, tx = fx - ix, i = iy * PW + ix, j = i + PW;
            if (sa[i] + sa[i + 1] + sa[j] + sa[j + 1] + da[i] + da[i + 1] + da[j] + da[j + 1] + ha[i] + ha[i + 1] + ha[j] + ha[j + 1] < .02) continue;
            const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty, s2 = sa[i] * w00 + sa[i + 1] * w10 + sa[j] * w01 + sa[j + 1] * w11, d2 = da[i] * w00 + da[i + 1] * w10 + da[j] * w01 + da[j + 1] * w11, h2 = ha[i] * w00 + ha[i + 1] * w10 + ha[j] * w01 + ha[j + 1] * w11;
            if (d2 > .02) put(X, Y, C.smoke, I * fade * Math.min(.55, d2 * .5));
            if (h2 > .03) put(X, Y, C.flame[1 + (h2 < .5) + (h2 < .2)], I * Math.min(.9, h2 * .9));
            if (s2 > .03) { const v = Math.min(1, s2 * .5), q = Math.min(4, Math.floor(v * 4 + dith(X, Y))) / 4; if (q > 0) put(X, Y, q < .5 ? blend(C.ramp[3], C.pink, .45 - q * .5) : blend(C.ramp[3], C.ramp[5], (q - .5) * 2), I * fade * (.18 + .72 * q)); } } } // in the sun: a pale blue light in four steps, dithered, whitest where it is thickest, its thin edges warm
        for (let yy = y0; yy <= y1; yy++) { sa.fill(0, yy * PW + x0, yy * PW + x1 + 1); da.fill(0, yy * PW + x0, yy * PW + x1 + 1); ha.fill(0, yy * PW + x0, yy * PW + x1 + 1); } }
      // the boosters, falling away glowing, and a puff where they part
      const ts = L.t0 + (L.t1 - L.t0) * Math.pow(L.sep, 1 / 1.7);
      if (T > ts && T < ts + 2.6) { const [sx, sy2, dx, dy] = S.arcAt(L, L.sep), a = T - ts; for (const sd of [-1, 1]) { for (let j = 0; j < 4; j++) { const aj = Math.max(0, a - j * .06), x = sx + (-dy * sd * 5 - dx * 2) * aj, y = sy2 + (dx * sd * 5 - dy * 2) * aj + 6 * aj * aj; put(x, y, C.flame[Math.min(3, 1 + j)], I * (1 - a / 2.6) * (1 - j / 4)); } }
        if (a < .5) for (let k = 0; k < 12; k++) { const th = k / 12 * 6.283, rr = 1 + a * 9; put(sx + Math.cos(th) * rr, sy2 + Math.sin(th) * rr * .7, C.ramp[4], I * (1 - a / .5) * .6); } }
      // the rocket: a white spark on a flame that lengthens as the air thins, flickering, gone over the edge
      if (T > L.t0 - .2 && u < 1) { const [x, y, dx, dy] = S.arcAt(L, u), on = clamp((T - L.t0 + .2) / .4), len = 2 + Math.round(u * 7), fl = .82 + .18 * Math.sin(A * 13) * Math.sin(A * 7.3); // (a gentle flicker, slower than three a second)
        for (let j = len; j >= 1; j--) put(x - dx * j, y - dy * j, C.flame[Math.min(3, Math.floor(j / len * 3.2))], I * on * fl * (1 - j / (len + 1)) * 1.1);
        put(x, y, C.core, I * on); for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + ax, y + ay, C.flame[0], I * on * .55 * fl); }
    },
    /** 1.12 b446: the crown (K.long 3: the sixth hour of the list left alone, and every sixth after): the sky's crown. A
     *  green glow comes up over the far hills and rises into a curtain of light, then another above it and a third higher
     *  still, folding and rippling, their rays running along them, a pink fringe along their lower borders; the lake mirrors
     *  them, and the hills, the pines and the tent catch their green; the fire burns up and sends a column of sparks climbing
     *  into it, cooling from orange to the aurora's green as they rise; and the curtains gather overhead into a corona, a
     *  crown of rays turning slowly round a point in the sky, before it all thins and sinks away to the night as it was.
     *  Painted as the rest is, at the picture's own pixels; its rays and folds from dice of their own */
    crownPlan(n) {
      const { bw, bh, hy, pr, fx } = S, r = deal(n, 83), pick = (a, b) => a + r() * (b - a);
      const cur = (pr ? [[hy - 57, 3, 70, .5, 20, 0, 1, [1.6, 4.0, 11.4, 13.6], .7, 0], [hy - 79, 5, 95, .9, 26, 0, 1, [3.2, 5.6, 10.8, 13.0], 1, 1], [hy - 97, 4, 80, -.7, 16, 0, 1, [5.6, 7.4, 10.0, 12.2], .85, 1]]
        : [[hy - 34, 4, 90, .5, 26, .42, 1, [1.6, 4.0, 11.4, 13.6], .7, 0], [hy - 60, 7, 130, .9, 34, .16, 1, [3.2, 5.6, 10.8, 13.0], 1, 1], [hy - 80, 5, 110, -.7, 22, .38, 1, [5.6, 7.4, 10.0, 12.2], .85, 1]])
        .map(([base, a, wl, w, tall, x0, x1, e, k, pink]) => ({ base, a, k2: Math.PI * 2 / wl, w, tall, x0: Math.round(x0 * bw), x1: Math.round(x1 * bw), e, k, pink, ph: pick(0, 6.283), ph2: pick(0, 6.283), n: noise1(400 + Math.floor(r() * 1000), 64) }));
      const cx = Math.round(bw * (pr ? .46 : .64)), cy = pr ? hy - 92 : 40, rays = Array.from({ length: pr ? 26 : 40 }, (_, i) => ({ a: (i + pick(-.25, .25)) / (pr ? 26 : 40) * Math.PI * 2, r0: pick(7, 12), r1: pick(pr ? 28 : 44, pr ? 46 : 80), ph: pick(0, 6.283), sp: pick(.8, 1.6) })); // (the crown's rays, all round)
      const sparks = Array.from({ length: 70 }, () => ({ t0: pick(5.8, 10.8), d: pick(2.2, 3.4), sw: pick(2, 5), ph: pick(0, 6.283), dx: pick(-8, 8), big: r() < .35 }));
      return { dealt: true, flare: [6.0, 6.8, 9.6, 11.0], heat: .12, crown: { cur, cx, cy, rays, crown: [7.4, 8.8, 10.0, 11.6], sparks, top: pr ? [26, 18] : [22, 16], lake: [2.4, 5.0, 11.2, 13.6] } };
    },
    /** how bright the aurora is over all at T (0 … 1): what lights the land */
    crownK(T, c) { let k = 0; for (const u of c.cur) k = Math.max(k, env(T, ...u.e, E.sine) * u.k); return Math.max(k, env(T, ...c.crown, E.sine)); },
    /** the land, the lake and the low sky in its light: their colours mixed toward its green by how bright it is */
    crownPal(T, I, pal) {
      const k = S.crownK(T, S.pl.crown) * I; if (k < .01) return; const G = CRN[3], G2 = CRN[2];
      for (let j = 8; j < 16; j++) pal[SKY + j] = pack(mix(SKYC[j], mix(SKYC[j], G, .55), k * (j - 7) / 8 * .6)); // the low sky, greening toward the hills
      for (let j = 0; j < 16; j++) pal[LAKE + j] = pack(mix(mix(SKYC[j], [4, 6, 20], .4), [12, 60, 52], k * .5 * (j / 15))); // the lake, the green in it
      pal[MTN + 2] = pack(mix(hex("#3B3264"), G2, k * .5)); pal[MTN] = pack(mix(hex("#1A1535"), [18, 52, 54], k * .5)); // the hills' ridge, lit
      pal[PINE + 3] = pack(mix(hex("#1C1A3A"), G, k * .7)); pal[TENT] = pack(mix(hex("#1E1418"), [20, 64, 52], k * .45)); pal[TREEF] = pack(mix(hex("#0E0B1E"), [10, 40, 34], k * .4)); // the pines' rims, the tent's far face, the far trees
    },
    /** the curtains, the corona, and all of it in the lake */
    crownAt(T, I, A, c) {
      const { bw, out, idx, hy, sy } = S, [tc, tf] = c.top, dm = S.dm, em = S.em;
      const R = S.crR && S.crR.bw === bw && S.crR.hy === hy ? S.crR : (S.crR = { bw, hy, c: new Int16Array(bw * 4), k: new Float32Array(bw * 4), h: new Float32Array(bw * 4), t: new Float32Array(bw * 4),
        top: Float32Array.from({ length: hy }, (_, y) => clamp((y - tc) / tf)), sky: Uint8Array.from(idx.subarray(0, hy * bw), v => v < MTN && (v < MOON || v > MOON + 2) ? 1 : 0), water: Uint8Array.from(idx, v => v >= LAKE && v < FREF ? 1 : 0),
        cr: Float32Array.from(CRN, q => q[0]), cg: Float32Array.from(CRN, q => q[1]), cb: Float32Array.from(CRN, q => q[2]), band: Uint8Array.from({ length: 129 }, (_, q) => { const v = q / 128; return v < .07 ? 0 : v < .2 ? 1 : v < .38 ? 2 : v < .56 ? 3 : v < .7 ? 4 : v < .84 ? 5 : v < .94 ? 6 : 7; }) }); // per curtain and column: its border, brightness, how tall; and, once, what is sky and what is water, its colours, its bands from the border up
      const { top: TOP, sky: SK, water: WA, cr: CR, cg: CG, cb: CB, band: BAND } = R;
      const add = (i, b, a) => { if (dm) { a *= em[i]; if (a <= .01) return; } const v = out[i], r = (v & 255) + CR[b] * a, gg = (v >> 8 & 255) + CG[b] * a, bl = (v >> 16 & 255) + CB[b] * a; out[i] = (255 << 24 | (bl > 255 ? 255 : bl) << 16 | (gg > 255 ? 255 : gg) << 8 | (r > 255 ? 255 : r)) >>> 0; };
      const prof = [1, .95, .82, .62, .42, .3, .22, .14], dimC = 1 - .4 * env(T, ...c.crown, E.sine), lift = 4 * env(T, 5.4, 7.6, 9.8, 12.4, E.sine), pinkE = env(T, 5.4, 6.8, 9.6, 11.2, E.sine);
      for (let j = 0; j < c.cur.length; j++) {
        const u = c.cur[j], e = env(T, ...u.e, E.sine) * I * u.k * dimC, o = j * bw; if (e < .01) { R.k.fill(0, o, o + bw); continue; } // (dimmer while the corona gathers overhead)
        const pinkK = u.pink ? pinkE : 0, w1 = T * 1.1 * u.w, w2 = T * .8 + u.ph2, w3 = T * 5.5 * u.w - u.ph2, w4 = T * 1.4 * u.w, w5 = T * .25, w6 = T * .9 * u.w;
        for (let x = 0; x < bw; x++) {
          const i0 = o + x; if (x < u.x0 || x > u.x1) { R.k[i0] = 0; continue; }
          const ends = Math.min(1, (x - u.x0) / 24, (u.x1 - x) / 10 + (u.x1 >= bw - 1 ? 1 : 0)), ph = u.k2 * x - w1 + u.ph;
          const hem = u.base + Math.sin(ph) * u.a + Math.sin(x * u.k2 * 2.3 + w2) * u.a * .45 - lift, fold = .45 + .55 * Math.abs(Math.cos(ph)), rays = .62 + .38 * (.5 + .5 * Math.sin(x * 1.9 - w3)) * (.4 + .6 * fbm(u.n, x * .21 - w4, 2));
          const k = e * ends * ends * fold * rays; R.k[i0] = k; R.h[i0] = pinkK; if (k < .02) continue;
          const tall = u.tall * (.5 + .5 * fbm(u.n, x * .045 - w5, 2)) * (.55 + .7 * fbm(u.n, x * .37 + 31 - w6, 2)) * (.8 + .2 * e); // its rays, of all heights
          const yb = Math.round(hem), ya = Math.max(0, Math.round(hem - tall)), span = Math.max(1, yb - ya); R.c[i0] = yb; R.t[i0] = tall;
          const yTop = Math.max(ya, k < .1 ? yb - Math.round(span * .55) : ya); // (where it is faint, its upper reaches would add nothing to see: left out)
          const yEnd = Math.min(yb + 3, hy - 1), x3 = x & 3, x13 = (x + 1) & 3;
          for (let y = yTop; y <= yEnd; y++) { const i = y * bw + x; if (!SK[i]) continue; let tp = TOP[y]; if (dm) tp *= em[i]; if (tp <= .01) continue; // (nothing behind the words, nor up behind the bar)
            let b, a;
            if (y > yb) { b = 2; a = k * .22 * (1 - (y - yb) / 4) * tp; } // the light spilling below its border
            else { const v = (yb - y) / span, dd = BAYER4[(y & 3) * 4 + x3]; if (v > .62 && dd < (v - .62) / .38 * .95) continue; // (its top dissolving into the sky)
              b = BAND[Math.max(0, Math.min(128, ((v + (dd - .5) * .12) * 128) | 0))]; a = k * prof[b] * tp; if (b === 0) b = pinkK > .02 && BAYER4[(y & 3) * 4 + x13] < pinkK ? 0 : 1; }
            if (a < .02) continue;
            const o0 = out[i], r = (o0 & 255) + CR[b] * a, gg = (o0 >> 8 & 255) + CG[b] * a, bl = (o0 >> 16 & 255) + CB[b] * a; out[i] = (255 << 24 | (bl > 255 ? 255 : bl) << 16 | (gg > 255 ? 255 : gg) << 8 | (r > 255 ? 255 : r)) >>> 0; } // (added in place: the light of it)
        }
      }
      // the corona: rays turning slowly round a point overhead, brightest at their outer ends, where the curtains are
      const ck = env(T, ...c.crown, E.sine) * I;
      if (ck > .01) { for (const ry of c.rays) { const a = ry.a + T * .06, ca = Math.cos(a), sa = Math.sin(a), pulse = .6 + .4 * Math.sin(T * ry.sp + ry.ph), len = ry.r1 * (.7 + .3 * ck);
          for (let rr = ry.r0; rr <= len; rr++) { const x = Math.round(c.cx + ca * rr), y = Math.round(c.cy + sa * rr * .72); if (x < 0 || x >= bw || y < 0 || y >= hy) continue; const i = y * bw + x, tp = TOP[y]; if (!SK[i] || tp <= 0) continue;
            const v = (rr - ry.r0) / Math.max(1, len - ry.r0), b = v > .9 ? 1 : v > .7 ? 2 : v > .5 ? 3 : v > .3 ? 4 : v > .15 ? 5 : 6, a2 = ck * pulse * (.25 + .75 * v) * .8 * tp; add(i, b, a2);
            const x2 = Math.round(c.cx + ca * rr - sa), y2 = Math.round(c.cy + sa * rr * .72 + ca * .72); if (x2 >= 0 && x2 < bw && y2 >= 0 && y2 < hy) { const i2 = y2 * bw + x2; if (SK[i2]) add(i2, Math.min(7, b + 1), a2 * .45); } } } // (each ray two pixels wide, the second dimmer)
        for (let dy = -5; dy <= 5; dy++) for (let dx = -7; dx <= 7; dx++) { const d = Math.hypot(dx / 7, dy / 5); if (d >= 1) continue; const x = c.cx + dx, y = c.cy + dy; if (x < 0 || x >= bw || y < 0 || y >= hy) continue; const i = y * bw + x; if (SK[i]) add(i, 5, ck * .3 * (1 - d) * TOP[y]); } } // the glow at its heart
      // in the lake, every other row, broken by the ripples, half as bright: each column's curtain mirrored, the rows it covers
      const lk = env(T, ...c.lake, E.sine) * I; if (lk < .01) return;
      const SH = S.crSH || (S.crSH = new Int8Array(sy + 1)); for (let y = hy + 2; y < sy; y += 2) SH[y] = Math.round(Math.sin(y * 1.3 + T * 2.4) * 1.2);
      for (let j = 0; j < c.cur.length; j++) { const o = j * bw; for (let x = 0; x < bw; x++) { const k = R.k[o + x]; if (k < .03) continue; const yb = R.c[o + x], ya = yb - R.t[o + x], pink = R.h[o + x] > .3;
        let y0 = Math.ceil(hy + (hy - yb) / 1.7), y1 = Math.min(sy - 1, Math.floor(hy + (hy - ya) / 1.7)); if (y0 < hy + 2) y0 = hy + 2; if ((y0 - hy) & 1) y0++;
        for (let y = y0; y <= y1; y += 2) { const ys = Math.round(hy - (y - hy) * 1.7); if (ys > yb || ys < ya) continue; const X = x + SH[y]; if (X < 0 || X >= bw) continue; const i = y * bw + X; if (!WA[i]) continue;
          const b = BAND[Math.max(0, Math.min(128, ((yb - ys) / Math.max(1, yb - ya) * 128) | 0))]; add(i, b === 0 ? (pink ? 0 : 1) : b, k * prof[b] * .5 * lk); } } }
    },
    /** the fire sends a column of sparks climbing into it, cooling from the fire's orange to the aurora's green as they rise */
    crownSparks(T, I, A, c) {
      const { fx, fy, hy, pr } = S, top = pr ? hy - 80 : hy - 70;
      for (const s of c.sparks) { const q = (T - s.t0) / s.d; if (q <= 0 || q >= 1) continue; const lift = Math.pow(q, .8), y = lerp(fy - S.FH * .5, top, lift), x = S.fx + Math.sin(q * s.sw * 2 + s.ph) * (2 + q * 4) + s.dx * q;
        const col = q < .45 ? FIRE[Math.round(34 - q * 30)] : blend(FIRE[20], CRNP[2], (q - .45) / .3), k = I * (q > .8 ? (1 - q) / .2 : 1);
        S.tint(x, y, col, k); if (s.big) { S.tint(x + 1, y, col, k * .6); S.tint(x, y + 1, q < .45 ? FIRE[14] : CRNP[4], k * .45); } if (q > .5) S.tint(x, y - 1, CRNP[3], k * .5); } // (some of them bigger, a tail of their light under them)
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; N: the pass (0, the signature) */
    draw(T, I, A, F, N = 0) {
      const { W, H, bw, bh, PS, out, idx, pal, fx, fy } = S;
      if (N !== S.planP) { const h = N > 0 ? K.long(N) : 0; S.pl = N > 0 ? (h === 1 ? S.bearPlan(N) : h === 2 ? S.launchPlan(N) : h === 3 ? S.crownPlan(N) : K.egg(N) ? S.eggPlan(N) : S.dealPass(N)) : S.sig(); S.planP = N; }
      const pl = S.pl;
      g.clearRect(0, 0, W, H);
      const dt = S.lastA === undefined ? 0 : clamp(A - S.lastA, 0, .1); S.lastA = A;
      const on = I > .01; S.turn += dt * (.35 + .65 * I); const tn = S.turn;
      const flare = on ? env(T, ...pl.flare, E.sine) * I : 0, settle = on && pl.log ? env(T, pl.log - .15, pl.log, pl.log + .1, pl.log + .9, E.sine) * I : 0;
      const pop = on && pl.pop ? env(T, pl.pop.t - .04, pl.pop.t, pl.pop.t + .1, pl.pop.t + .8, E.out) * I : 0, cov = on && pl.cloud ? S.cover(T, pl.cloud) * I : 0;
      const flick = .72 + .16 * Math.sin(A * 11.3) + .08 * Math.sin(A * 7.1 + 1) + .06 * Math.sin(A * 17.9 + 2); let glow = clamp(flick * (.72 + .28 * I) + flare * .35 - settle * .25);
      if (pop > 0) glow = clamp(glow + pop * .5);
      const heat = pl.heat ? pl.heat * env(T, .6, 3, 11.6, 14.4, E.sine) * I : 0; // the fire's mood for the pass, gone again at either end of it
      if (heat) glow = clamp(glow + heat * .9); // and its light on the ground, the tent and the pines with it
      // the palette: the still colours, and the ranges that turn
      for (let k = 0; k < 16; k++) { pal[SKY + k] = pack(SKYC[k]); pal[LAKE + k] = pack(mix(SKYC[k], [4, 6, 20], .4)); }
      const t8 = n => Math.floor(tn * n);
      for (let k = 0; k < 8; k++) { pal[STAR + k] = pack(TW[(k + t8(3)) & 7]); pal[ARM + k] = pack(mix(TW[(k + t8(3)) & 7], SKYC[2], .55)); pal[GLIT + k] = pack(GL[(k + t8(7)) & 7]); pal[FREF + k] = pack(mix(FR[(k + t8(9)) & 7], FR[0], 1 - glow)); pal[COAL + k] = pack(CO[(k + t8(5)) & 7]); }
      [["#FFF4DA", 0], ["#E6D3AC", 1], ["#CDB88E", 2], ["#231F4E", 3], ["#312A62", 4]].forEach(([c, k]) => { pal[MOON + k] = pack(hex(c)); });
      ["#221F52", "#2D2964", "#3A3576", "#4B4589"].forEach((c, k) => { pal[MILKY + k] = pack(hex(c)); });
      ["#1A1535", "#15112E", "#3B3264", "#26204A"].forEach((c, k) => { pal[MTN + k] = pack(hex(c)); });
      pal[TREEF] = pack(hex("#0E0B1E")); pal[TREEF + 1] = pack(hex("#0B0918"));
      for (let t = 0; t < 4; t++) { pal[GND + t] = pack(GNDC[t]); for (let lv = 0; lv < NL; lv++) pal[LIT + t * NL + lv] = pack(mix(GNDC[t], mix(GLOW, GNDC[t], .3 + t * .06), glow * Math.pow((lv + 1) / NL, 1.3) * .7)); }
      pal[PINE] = pack(hex("#06050C")); pal[PINE + 1] = pack(hex("#0A0814")); pal[PINE + 3] = pack(hex("#1C1A3A"));
      for (let k = 0; k < 4; k++) pal[PLIT + k] = pack(mix(hex("#0C0710"), hex("#9A4420"), glow * (k + 1) / 4 * .85)); /* the pines' faces toward the fire */
      pal[GRASS] = pack(mix(hex("#15120E"), hex("#3A2414"), glow * .3)); pal[GRASS + 1] = pack(mix(hex("#1E1A12"), hex("#5A3418"), glow * .4));
      ["#2A2226", "#3A2E30"].forEach((c, k) => { pal[ROCK + k] = pack(hex(c)); }); pal[ROCK + 2] = pack(mix(hex("#3A2A26"), hex("#C0683A"), glow)); pal[ROCK + 3] = pack(mix(hex("#4A3630"), hex("#F09050"), glow));
      ["#2A1A12", "#3A2416", "#4A2E1A"].forEach((c, k) => { pal[LOG + k] = pack(hex(c)); });
      pal[TENT] = pack(hex("#1E1418")); pal[TENT + 1] = pack(mix(hex("#2E1E1C"), hex("#B0582E"), glow * .9)); pal[TENT + 2] = pack(hex("#0C080A"));
      if (cov > 0) { for (let k = 0; k < 8; k++) pal[GLIT + k] = pack(mix(GL[(k + t8(7)) & 7], GL[0], cov * .85)); pal[MOON + 3] = pack(mix(hex("#231F4E"), SKYC[1], cov * .8)); pal[MOON + 4] = pack(mix(hex("#312A62"), SKYC[1], cov * .8)); } /* under the cloud the glitter and the halo go out */
      if (on && pl.crown) S.crownPal(T, I, pal); // the crown: the land, the lake and the low sky lit green by it
      // the picture, through the palette
      for (let i = 0; i < out.length; i++) out[i] = pal[idx[i]];
      const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < bw && y >= 0 && y < bh) out[y * bw + x] = c; };
      S.dm = !!pl.dealt && !!S.emOn; const putB = S.dm ? (x, y, c) => S.tint(x, y, c, 1) : put; // a dealt pass's beats keep back from the words
      S.put = putB;
      if (on) { if (pl.aurora) S.auroraAt(T, I, pl.aurora, t8); if (pl.cloud) S.cloudAt(T, I, pl.cloud); if (pl.deer) S.deerAt(T, I, pl.deer, 0); if (pl.moose) S.deerAt(T, I, pl.moose, 1); if (pl.loon) S.loonAt(T, I, pl.loon); if (pl.canoe) S.canoeAt(T, I, pl.canoe, t8); if (pl.mist) S.mistAt(T, I, A, pl.mist); if (pl.bear) S.bearAt(T, I, A, pl.bear); if (pl.launch) S.launchAt(T, I, A, pl.launch); if (pl.crown) S.crownAt(T, I, A, pl.crown); }
      // the flames: stepped at thirty a second, fed harder in the flare and after the log settles, low while the list is in use
      S.ft += dt; while (S.ft > 1 / 30) { S.ft -= 1 / 30; S.fire(clamp(.62 + .3 * I + flare * .3 + (on && pl.log ? env(T, pl.log + .1, pl.log + .4, pl.log + .9, pl.log + 1.8) * .25 * I : 0) + pop * .45 - settle * .35 + Math.min(0, heat)), A); } // a higher night swells the light, not the flames: they never stand taller than the first pass's
      { const { FW, FH, heat } = S, x0 = fx - Math.floor(FW / 2), y0 = fy - FH + 1; for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const h = heat[y * FW + x]; if (h > 7) put(x0 + x, y0 + y, FIRE[h]); /* the dark tips left out */ } }
      // the sparks, riding up out of it
      const n = Math.round(S.sparks.length * (.4 + .6 * I));
      for (let k = 0; k < n; k++) { const s = S.sparks[k], q = ((A + s.o) / s.p) % 1, y = fy - S.FH * .55 - q * (S.pr ? 50 : 70), x = fx + Math.sin(q * s.sw + s.ph) * 2 + s.dr * q; if (q < .85 || ((A * 20 + k) & 1)) put(x, y, FIRE[Math.round(34 - q * 20)]); }
      if (on && pl.log && T > pl.log && T < pl.log + 2) { const q = T - pl.log; for (const s of S.burst) { if (q > s.l) continue; const k = q / s.l; put(fx + Math.cos(s.a) * s.v * q, fy - 6 + Math.sin(s.a) * s.v * q + 18 * q * q, FIRE[Math.round(35 - k * 22)]); } }
      if (on && pl.pop) S.popAt(T, pl.pop, I);
      if (on && pl.crown) S.crownSparks(T, I, A, pl.crown); // the crown: a column of sparks rising into it
      if (on && pl.egg) S.mallowAt(T, I, A, pl.egg); // the egg
      // a star falls
      const st = pl.star;
      if (on && st && T > st.t[0] && T < st.t[1]) { const k = (T - st.t[0]) / (st.t[1] - st.t[0]), [x0, y0, x1, y1] = st.path;
        for (let j = 0; j < 9; j++) { const kk = k - j * .018; if (kk < 0) break; const fade = (1 - j / 9) * (k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1); if (fade > .25) putB(lerp(x0, x1, kk), lerp(y0, y1, kk), pack(mix(SKYC[2], hex("#FFF4E0"), fade))); } }
      if (on && pl.meteors) for (const m of pl.meteors) S.streak(T, m, I);
      // an owl crosses the moon, from past one edge to past the other
      const ow = pl.owl;
      if (on && ow && T > ow.t[0] && T < ow.t[1]) { const k = (T - ow.t[0]) / (ow.t[1] - ow.t[0]), [[ax, ay], [bx, by]] = ow.path, x = lerp(ax, bx, k), y = lerp(ay, by, k) + Math.sin(k * 20) * 1.2, up = Math.floor(A * 6) & 1, c = pack(hex("#07060C"));
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [2, 0], ...(up ? [[-2, -1], [-3, -2], [3, -1], [4, -2]] : [[-2, 1], [-3, 1], [3, 1], [4, 1]])]) putB(x + dx, y + dy, c); }
      // a fish jumps, and its rings spread across the water
      for (const f of pl.fish || []) if (on && T > f.t && T < f.t + 2.6) { const q = T - f.t, [lx, ly] = f.at, d = f.d;
        if (q < .5) { const k = q / .5; for (let j = 0; j < 3; j++) putB(d > 0 ? lx + k * 6 + j : lx - k * 6 - j, ly - Math.sin(k * Math.PI) * 5 + j * .4, pack(hex("#C8C4E0"))); }
        for (const [t0, a] of [[.45, 1], [.8, .7], [1.15, .5]]) { const rq = (q - t0) / 1.4; if (rq <= 0 || rq >= 1) continue; const rx = 2 + rq * 12, ry = rx * .28, c = pack(mix(hex("#1A1838"), hex("#C8C4E0"), a * (1 - rq))); for (let j = 0; j < 40; j++) { const th = j / 40 * Math.PI * 2; putB((d > 0 ? lx + 8 : lx - 8) + Math.cos(th) * rx, ly + Math.sin(th) * ry, c); } } }
      if (on && pl.flies) S.fliesAt(T, I, pl.flies, t8);
      // the finale: a column of sparks goes up and opens into new stars, twinkling, then gone
      if (F >= 0) for (const s of S.fan) { const k = clamp((F - s.d) / (1 - s.d)); if (k <= 0 || k >= 1) continue; const up = E.out(clamp(k / .45)), open = E.out(clamp((k - .3) / .35)), x = fx + s.x * lerp(.06, 1, open), y = lerp(fy - 10, s.y, up);
        const c = k < .5 ? FIRE[Math.round(34 - k * 20)] : pack(mix(SKYC[3], TW[Math.max(3, (s.tw + t8(3)) & 7)], k > .85 ? (1 - k) / .15 : 1)); put(x, y, c);
        if (k >= .5 && (s.tw & 1)) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(x + dx, y + dy, pack(mix(SKYC[3], TW[2], k > .85 ? (1 - k) / .15 : .8))); } /* new stars, some with arms */
      // up to the screen, crisp, with a soft bloom over it
      S.px2.putImageData(S.img, 0, 0);
      g.imageSmoothingEnabled = false; g.drawImage(S.pc, 0, 0, bw * PS, bh * PS);
      const bx = S.bc.getContext("2d"); bx.clearRect(0, 0, S.bc.width, S.bc.height); bx.drawImage(S.pc, 0, 0, S.bc.width, S.bc.height);
      g.save(); g.globalCompositeOperation = "lighter"; g.globalAlpha = .3; g.imageSmoothingEnabled = true; g.drawImage(S.bc, 0, 0, bw * PS, bh * PS); g.restore();
      // under each line, the night in shade: a long list's last lines lie over the fire and its sparks on a phone, and the
      // finale's column of sparks rises behind the lines (the stage lays its pad over this)
      g.save(); g.imageSmoothingEnabled = true; g.globalAlpha = .75; for (const [x0, y0, x1, y1, kind] of S.raw || []) if (kind === 1) { const mx = 18 + (y1 - y0) * .5, my = 6 + (y1 - y0) * .3; g.drawImage(S.pad, x0 - mx, y0 - my, x1 - x0 + mx * 2, y1 - y0 + my * 2); } g.restore();
    },
    /** a sprite of the picture's own pixels put in, mirrored or not, and faded by k */
    blit(sp, x, y, fl, k = 1) { const { bw, bh, out } = S; x = Math.round(x); y = Math.round(y); for (const [dx, dy, c] of sp.px) { const X = x + (fl ? sp.w - 1 - dx : dx), Y = y + dy; if (X < 0 || X >= bw || Y < 0 || Y >= bh) continue; const i = Y * bw + X, kk = S.dm ? k * S.em[i] : k; if (kk <= 0) continue; out[i] = kk >= 1 ? c : blend(out[i], c, kk); } },
    /** a pixel mixed toward a colour, by k */
    tint(x, y, c, k) { const { bw, bh, out } = S; x = Math.round(x); y = Math.round(y); if (x < 0 || x >= bw || y < 0 || y >= bh || k <= 0) return; const i = y * bw + x; if (S.dm) { k *= S.em[i]; if (k <= 0) return; } out[i] = blend(out[i], c, k); },
    /** rings spreading on the water from x, y */
    rings(x, y, q, a, w = 12) { if (q <= 0 || q >= 1) return; const rx = 1.5 + q * w, ry = rx * .28, c = RINGC; for (let j = 0; j < 36; j++) { const th = j / 36 * Math.PI * 2; S.tint(x + Math.cos(th) * rx, y + Math.sin(th) * ry, c, a * (1 - q)); } },
    /** a meteor: a short streak, brightest at its head */
    streak(T, m, I) { if (T <= m.t[0] || T >= m.t[1]) return; const k = (T - m.t[0]) / (m.t[1] - m.t[0]), [x0, y0, x1, y1] = m.path, edge = (k < .12 ? k / .12 : k > .8 ? (1 - k) / .2 : 1) * I;
      for (let j = 0; j < 12; j++) { const kk = k - j * .032; if (kk < 0) break; const fade = Math.pow(1 - j / 12, 1.3) * edge; if (fade > .15) S.put(lerp(x0, x1, kk), lerp(y0, y1, kk), STREAK[Math.round(fade * 16)][j < 2 ? 1 : 0]); }
      const hx = lerp(x0, x1, k), hy = lerp(y0, y1, k); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) S.tint(hx + dx, hy + dy, STREAKC, edge * .5); }, // a bright head, a little cross of light round it
    /** the fire pops: a spray of sparks straight up, and one ember thrown out to land in the dirt, glow a while and go out */
    popAt(T, p, I) {
      const q = T - p.t; if (q <= 0 || q >= 3) return;
      const { fx, fy } = S, put = (x, y, c) => S.tint(x, y, c, I); // eased with I, as the rest of the new beats
      if (q < 1.2) for (const s of S.popSparks) { if (q > s.l) continue; const k = q / s.l; put(fx + Math.cos(s.a) * s.v * q, fy - 10 + Math.sin(s.a) * s.v * q + 16 * q * q, FIRE[Math.round(35 - k * 24)]); }
      const fl = .55; if (q < fl) { const k = q / fl; put(fx + p.dx * k, fy - 6 - Math.sin(k * Math.PI) * p.h + (p.dy + 6) * k, FIRE[32]); }
      else { const k = (q - fl) / (3 - fl), c = FIRE[Math.round(31 - k * 23)]; put(fx + p.dx, fy + p.dy, c); if (k < .5) { S.tint(fx + p.dx - 1, fy + p.dy, FIRE[20], (.5 - k) * I); S.tint(fx + p.dx + 1, fy + p.dy, FIRE[20], (.5 - k) * I); } }
    },
    /** how much of the moon the cloud hides (0 … 1) */
    cover(T, c) {
      const u = (T - c.t[0]) / (c.t[1] - c.t[0]); if (u <= 0 || u >= 1) return 0;
      const x = lerp(c.x0, c.x1, u), o = clamp((Math.min(x + S.cl * .86, S.mx + S.mr) - Math.max(x + S.cl * .14, S.mx - S.mr)) / (S.mr * 2));
      return E.sine(o) * (1 - seg(u, .7, 1, E.sine));
    },
    /** a thin cloud drifts in from past the edge and over the moon, its rim silvering where the moon is behind it, and thins away */
    cloudAt(T, I, c) {
      const u = (T - c.t[0]) / (c.t[1] - c.t[0]); if (u <= 0 || u >= 1) return;
      const x = Math.round(lerp(c.x0, c.x1, u)), y = c.y, a = (1 - seg(u, .7, 1, E.sine)) * I, { mx, my, mr } = S;
      for (const [dx, dy, v] of S.ecl) S.tint(x + dx, y + dy, CLOUDC, a * Math.min(.95, .45 + v * .7));
      for (const [dx, dy] of S.erim) { const d = Math.hypot(x + dx - mx, y + dy - my), near = clamp(1 - (d - mr) / (mr * 3.2)); S.tint(x + dx, y + dy, RIMC, a * (.22 + .78 * near * near)); }
    },
    /** a canoe paddled across the lake, through the moon's path; its lantern's light trembling on the water under it, its wake */
    canoeAt(T, I, c, t8) {
      const u = (T - c.t[0]) / (c.t[1] - c.t[0]); if (u <= 0 || u >= 1) return;
      const { bw, sy } = S, sp = S.canoe[Math.floor(T * 2.4) % 3], w = sp.w, fl = c.dir < 0, x = Math.round(lerp(fl ? bw + 3 : -w - 3, fl ? -w - 3 : bw + 3, u)), y = c.y - sp.h + 2;
      for (let k = 1; k < 9; k++) { const sx = fl ? x + w + k * 2 - 2 : x - k * 2 + 1; for (const s of [-1, 1]) S.tint(sx, c.y + Math.round(s * k * .5), WAKEC, I * .55 * (1 - k / 9)); } // the wake: a V of ripples catching the moon
      S.blit(sp, x, y, fl, I);
      const lx = x + (fl ? w - 1 - sp.lx : sp.lx);
      for (let j = 0; j < 8; j++) { const Y = c.y + 2 + j * 2; if (Y >= sy) break; S.tint(lx + Math.sin(T * 8 + j * 1.9) * (.6 + j * .35), Y, FRP[(j + t8(9)) & 7], I * (1 - j / 9)); } // the lantern's light on the water, turning
    },
    /** a deer (or the moose) steps out of the dark of the far trees into the shallows, drinks, looks up, and goes back; its reflection under it */
    deerAt(T, I, d, big) {
      const k = T - d.t0, D = big ? S.moose : S.deer, [e1, e2, e3, e4] = big ? [1.6, 5.0, 6.0, 7.6] : [1.2, 3.9, 4.7, 6.2]; if (k <= 0 || k >= e4) return;
      const { hy, sy, bw } = S, fl = d.dir < 0; let lift, spr;
      if (k < e1) { lift = E.sine(k / e1); spr = D.walk[Math.floor(T * 5) % 2]; }
      else if (k < e2) { lift = 1; spr = D.drink; }
      else if (k < e3) { lift = 1; spr = D.stand; }
      else { lift = 1 - E.sine((k - e3) / (e4 - e3)); spr = D.walk[Math.floor(T * 5) % 2]; }
      const wade = big ? 9 : 7, feet = hy + Math.round(lift * wade), x = Math.round(d.x + d.dir * lift * (big ? 4 : 3)), y = feet - spr.h + 1;
      S.blit(spr, x, y, fl, I);
      for (const [dx, dy, c] of spr.px) { const Y = feet + (spr.h - dy); if ((Y - hy) & 1 || Y >= sy) continue; S.tint(x + (fl ? spr.w - 1 - dx : dx), Y, c, I * .5 * lift); } // its reflection, broken by the ripples
      const mz = x + (fl ? 0 : spr.w - 1), my = feet;
      if (k > e1 && k < e2) S.rings(mz, my + 1, ((k - e1) % 1.3) / 1.3, I * .8, 7);
      if (big && k > e2 && k < e2 + 1) { for (let i = 0; i < 3; i++) { const q = (k - e2 + i * .3) % 1; S.tint(mz + (fl ? 1 : -1) * i, feet - 6 + q * 6, RINGC, I * (1 - q)); } } // the water running off his muzzle
    },
    /** a loon comes up, swims a little, rears up and beats its wings, and dives; and comes up again further on */
    loonAt(T, I, list) {
      for (const s of list) {
        const k = T - s.t0; if (k <= 0 || k >= s.d + 1.2) continue;
        S.rings(s.x, s.y + 1, k / 1.2, I * .9, 9); S.rings(s.x + s.dir * s.d * 2.2, s.y + 1, (k - s.d) / 1.2, I * .9, 9);
        if (k >= s.d) continue;
        const x = s.x + s.dir * k * 2.2, flap = k > s.flap && k < s.flap + .9, spr = flap && (Math.floor(T * 7) & 1) ? S.loon.up : S.loon.sit, a = I * Math.min(1, k / .2, (s.d - k) / .2);
        S.blit(spr, x - (spr.w >> 1), s.y - spr.h + 1, s.dir < 0, a);
        for (let j = 1; j < 5; j++) for (const sd of [-1, 1]) S.tint(x - s.dir * (j * 2 + 2), s.y + 1 + Math.round(sd * j * .4), WAKEC, a * .45 * (1 - j / 5));
      }
    },
    /** mist lying on the lake: the wisp map drifting, each level a little more of the mist's colour over the water and the
     *  far hills' reflection in it (not over the moon's glitter or the firelight on the ripples, which shine through) */
    mistAt(T, I, A, m) {
      const e = env(T, ...m.t, E.sine) * I * m.k; if (e < .01) return;
      const { bw, out, idx, hy } = S, { mm, mw, mh, col } = S.mist, off = ((Math.floor(A * m.v * .6 + T * m.v) % mw) + mw) % mw, lv = S.pr ? [0, .08 * e, .15 * e, .23 * e, .32 * e] : [0, .1 * e, .2 * e, .3 * e, .42 * e];
      for (let y = 1; y < mh; y++) { const reach = clamp((y - m.band[0] * mh) / (mh * .2)) * clamp((m.band[1] * mh - y) / (mh * .2)); if (reach <= 0) continue; const row = (hy + y) * bw, mrow = y * mw; for (let x = 0; x < bw; x++) { const v = mm[mrow + ((x + off) % mw)]; if (!v) continue; const i = row + x, ix = idx[i]; if (ix !== TREEF + 1 && (ix < LAKE || ix >= LAKE + 16)) continue; const e2 = S.dm ? S.em[i] : 1; if (e2 > 0) out[i] = blend(out[i], col[x], lv[v] * reach * e2); } }
    },
    /** fireflies over the grass: each blinks round a little ramp of its own that turns, and drifts */
    fliesAt(T, I, f, t8) {
      const e = env(T, ...f.t, E.sine) * I; if (e < .02) return;
      for (const q of S.ffl) { const stp = (q.p + f.ph + t8(q.s)) & 7; if (stp < 2 || stp > 6) continue; const x = q.x + Math.sin(T * q.fx + q.p) * q.ax, y = q.y + Math.sin(T * q.fy + q.p * 1.7) * q.ay - e * q.rise;
        S.tint(x, y, FFP[stp], e); if (stp === 4) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) S.tint(x + dx, y + dy, FFP[3], e * .45); }
    },
    /** the northern lights: this frame's sixty-four colours from the turning ramp, laid over the sky behind the hills (not over
     *  the moon), and again in the lake, broken by the ripples, half as bright */
    auroraAt(T, I, au, t8) {
      const e = env(T, ...au.t, E.sine) * I; if (e < .01) return;
      const { bw, out, idx, hy, sy } = S, { x0, y0, w, h, map } = S.aur, R = S.aurR, G = S.aurG, Bl = S.aurB, sh = t8(3.2);
      for (let lv = 0; lv < 8; lv++) { const c = AURC[lv], br = .7 + .3 * Math.sin(T * .8 + lv * .6); for (let ph = 0; ph < 8; ph++) { const k = e * RAY[(ph + sh) & 7] * br, j = lv * 8 + ph; R[j] = c[0] * k; G[j] = c[1] * k; Bl[j] = c[2] * k; } }
      for (let y = 0; y < h; y++) { const row = (y0 + y) * bw + x0, mrow = y * w; for (let x = 0; x < w; x++) { const v = map[mrow + x]; if (!v) continue; const i = row + x, ix = idx[i]; if (ix >= MTN || (ix >= MOON && ix <= MOON + 2)) continue; const e2 = S.dm ? S.em[i] : 1; if (e2 > 0) out[i] = addc(out[i], R[v - 1] * e2, G[v - 1] * e2, Bl[v - 1] * e2); } }
      for (let y = hy + 2; y < sy; y += 2) { const m = Math.round(hy - (y - hy) * 1.7) - y0; if (m < 0 || m >= h) continue; const row = y * bw + x0, mrow = m * w; for (let x = 0; x < w; x++) { const v = map[mrow + x]; if (!v) continue; const i = row + x, ix = idx[i]; if (ix < LAKE || ix >= FREF) continue; const e2 = S.dm ? S.em[i] * .45 : .45; if (e2 > 0) out[i] = addc(out[i], R[v - 1] * e2, G[v - 1] * e2, Bl[v - 1] * e2); } }
    },
  };
  return S;
}
