// scene-arcade.js — 1.12 b332: Arcade's scene (scenes.js loads it). A game's attract mode in chunky pixel art, under neon
// bloom and CRT scanlines: a dithered sky, a big pixel moon, a city in two layers of parallax with lit windows and a neon
// sign, a glowing platform, and a small hero in a helmet and a magenta scarf. While the list is in use the hero waits,
// breathing, blinking, its antenna light pulsing. The loop, fifteen seconds: READY? — the hero crouches and springs off
// at GO!, the world scrolling; it jumps through an arc of coins, heads a block and a coin spins out, stomps a slime flat
// and bounces high off it; a star bounces in and it takes it, flashing through the colours with afterimages and speed
// lines; WARNING — a boss saucer drops in, its eye on the hero; the hero jumps its shots and answers with lasers, three
// hits, and it bursts in a shockwave of pixels; HIGH SCORE. The finale: LEVEL CLEAR drops in letter by letter under
// fireworks in pixels, and the hero jumps with a trophy. The kit's own finale line is "Level clear."
// Everything is drawn into a small pixel buffer and scaled up crisp; the bloom is that buffer again, blurred by drawing it
// small and stretching it back. Every beat is a function of the loop's time, so any moment can be held (tools/scene-lab).
//
// 1.12 b381: the forever cycle. Every pass after the first is the next level of the game, in the same frame: the level's
// number where READY? was, GO!, a run past obstacles, a power-up, WARNING and a boss, a score to close. A level deals
// its sky from five — a night of shooting stars; a synthwave sun coming up behind the towers as the moon gives way (it
// finds a place clear of the words); a storm, clouds over the moon, rain streaking the screen and lightning striking
// behind the city as the boss arrives; snow falling and settling on the roofs and the bricks; the northern lights in
// neon curtains — three obstacles from ten (the coin arc, the block and the slime, blue or pink now and then, and a
// spiked shell to leap, bats swooping down, bricks to smash, a spring that flings the hero somersaulting up through a
// column of coins, a pit, a pipe with a snapping plant, a cannon whose bullet it stomps), a power-up from four (the
// star; a mushroom that makes it twice the size; a fire flower, and fireballs bouncing at the boss; a jetpack, a flight
// over the city through a string of coins), a boss from four (the saucer; a robot that stomps in and lobs bouncing bombs,
// losing its head at the end; a dragon whose body follows its head round a swooping loop, lunging at each hit and
// popping tail first; a slime king who hops in and spits slimes, bursts into four and leaves the hero his crown), and its
// closing words. The sky, the power-up and the boss each come round their whole pool before repeating and never twice
// running, and no obstacle follows itself from one level to the next, so every level looks new at a glance. About one
// level in eight hides a block with a 1UP in it; about one in eight has a warp pipe down to a bonus room: an iris closes
// on the city and opens on a dark room of blue bricks, the hero drops from a pipe in the ceiling, runs a trail of coins
// and goes down another, and pops up out of a pipe in the city, which has moved on while the screen was black. Every
// obstacle comes on from past the right edge wherever the hero stands, the weather arrives from the top and drains away,
// and the score counts back to nothing, so each pass ends on the picture the next begins with. The first pass is the
// signature loop, as it was (its two shakes now a jitter of the frame's time, which no two loads shared before).
//
// 1.12 b382: no star behind the header's small words. The count is eight pixels wide, so one of the sky's stars behind
// it cost it nearly half its contrast (and which star it was changed with the length of the day's date): the stars, the
// twinkling ones too, go out behind the date, the count, the pills and the hint (the small words `words` is told of),
// fading as they drift toward them, in every pass; so do the shooting stars, the lightning, the rain and the snow as
// they pass.
export default function arcade(K) {
  const { clamp, lerp, E, seg, env, rng, canvas, sprite } = K;
  const TAU = Math.PI * 2;
  let g = null, b = null, pb = null, px = 1;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pal = o => { const m = {}; for (const k in o) m[k] = hex(o[k]); return m; };
  const NEON = ["#FF2BD6", "#2BE8FF", "#FFE14D", "#7CFF6B", "#FF7A3C", "#B388FF"];
  // the hero, 12×15, facing right: a helmet with a visor, a jacket, a scarf that trails, yellow boots
  const HP = pal({ H: "#EAF6FF", h: "#9FB6DC", V: "#1B2466", v: "#8FF3FF", J: "#2BE8FF", j: "#1A8FB0", S: "#FF2BD6", s: "#B1168F", P: "#6B55E0", B: "#FFE14D" });
  const HEAD = ["....HHHH....", "..HHHHHHHH..", ".HHHHHHHHHh.", ".HHHVVVVVvh.", ".HHHVVVVVVh.", ".hHHHHHHHhh.", "..hhhhhhhh.."];
  const BODY = { idle: [".SSJJJJJJ...", "SS.JJJJJJj..", "S..jJJJJJj..", "...JJJJJJ..."], flut: ["SSsJJJJJJ...", "s..JJJJJJj..", "...jJJJJJj..", "...JJJJJJ..."],
    a: ["SSSJJJJJJ...", "s..JJJJJJJj.", "...jJJJJJ...", "...JJJJJJ..."], b: ["sSSJJJJJJ...", "S..JJJJJJj..", "...jJJJJJj..", "...JJJJJJ..."], c: ["SSsJJJJJJ...", "..jJJJJJJ...", "..jJJJJJJj..", "...JJJJJJ..."],
    jump: ["SSSJJJJJJj..", "s..JJJJJJJ..", "...JJJJJJ...", "...JJJJJJ..."] };
  const LEGS = { idle: ["...PPPPPP...", "...PP..PP...", "...PP..PP...", "..BBB..BBB.."], r1: ["...PPPPPP...", "..PP....PP..", ".PP......PP.", ".BB......BBB"],
    r2: ["...PPPPPPP..", "....PP.PPP..", "....PP......", "...BBB......"], r3: ["...PPPPPP...", "..PP...PP...", ".PP.....PP..", "BBB.....BB.."],
    r4: ["..PPPPPPP...", "..PPP.PP....", "......PP....", "......BBB..."], jump: ["..PPPPPPP...", ".PP...PPP...", ".BB....BB...", "............"] };
  const hero = (head, body, legs, p = HP) => sprite([...head, ...body, ...legs], p);
  const BLINK = HEAD.map(r => r.replace("v", "V"));
  // the slime, the block, the coin, the star, the trophy
  const SLIME = ["...GGGG...", "..GGGGGG..", ".GGWWGWWG.", ".GGWKGWKG.", "GGGGGGGGGG", "GGGMMMMGGG", "GGGGGGGGGG", ".gggggggg."];
  const SP = pal({ G: "#7CFF6B", g: "#2FB84A", W: "#FFFFFF", K: "#0B0820", M: "#16662A" });
  const BLOCK = ["DDDDDDDDDDDD", "DYYYYYYYYYYD", "DYQQQQQQQQqD", "DYQQWWWWQQqD", "DYQWWQQWWQqD", "DYQQQQQWWQqD", "DYQQQQWWQQqD", "DYQQQWWQQQqD", "DYQQQQQQQQqD", "DYQQQWWQQQqD", "DYqqqqqqqqqD", "DDDDDDDDDDDD"];
  const COIN = [["..YYYY..", ".YWYYYY.", "YWYYYYYy", "YYYYYYYy", "YYYYYYYy", "YYYYYYyy", ".YYYYyy.", "..yyyy.."], ["...YY...", "..YWYY..", "..YYYy..", "..YYYy..", "..YYYy..", "..YYyy..", "..YYyy..", "...yy..."], ["...Y....", "...W....", "...Y....", "...Y....", "...Y....", "...Y....", "...y....", "...y...."]];
  const STAR = [".....Y.....", "....YYY....", "....YYY....", "YYYYYYYYYYY", ".YYYYYYYYY.", "..YYKYKYY..", "...YYYYY...", "..YYYYYYY..", ".YYY...YYY.", "YY.......YY"];
  const CUP = ["YYYYYYY", "yYYYYYy", "y.YYY.y", "..YYY..", "...Y...", "...Y...", "..YYY..", ".yyyyy."];
  // a 5×7 face for everything the game says
  const F5 = {};
  "A .###./#...#/#...#/#####/#...#/#...#/#...#|C .####/#..../#..../#..../#..../#..../.####|D ####./#...#/#...#/#...#/#...#/#...#/####.|E #####/#..../#..../####./#..../#..../#####|G .####/#..../#..../#..##/#...#/#...#/.####|H #...#/#...#/#...#/#####/#...#/#...#/#...#|I #####/..#../..#../..#../..#../..#../#####|L #..../#..../#..../#..../#..../#..../#####|N #...#/##..#/#.#.#/#..##/#...#/#...#/#...#|O .###./#...#/#...#/#...#/#...#/#...#/.###.|R ####./#...#/#...#/####./#.#../#..#./#...#|S .####/#..../#..../.###./....#/....#/####.|V #...#/#...#/#...#/#...#/#...#/.#.#./..#..|W #...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#|Y #...#/#...#/.#.#./..#../..#../..#../..#..|P ####./#...#/#...#/####./#..../#..../#....|U #...#/#...#/#...#/#...#/#...#/#...#/.###.|T #####/..#../..#../..#../..#../..#../..#..|? .###./#...#/....#/..##./..#../...../..#..|! ..#../..#../..#../..#../..#../...../..#..|+ ...../..#../..#../#####/..#../..#../.....|0 .###./#...#/#..##/#.#.#/##..#/#...#/.###.|1 ..#../.##../..#../..#../..#../..#../.###.|2 .###./#...#/....#/...#./..#../.#.../#####|3 ####./....#/....#/.###./....#/....#/####.|4 ...#./..##./.#.#./#..#./#####/...#./...#.|5 #####/#..../####./....#/....#/#...#/.###.|6 .###./#..../#..../####./#...#/#...#/.###.|7 #####/....#/...#./..#../.#.../.#.../.#...|8 .###./#...#/#...#/.###./#...#/#...#/.###.|9 .###./#...#/#...#/.####/....#/....#/.###.|B ####./#...#/#...#/####./#...#/#...#/####.|F #####/#..../#..../####./#..../#..../#....|K #...#/#..#./#.#../##.../#.#../#..#./#...#|M #...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#|X #...#/#...#/.#.#./..#../.#.#./#...#/#...#|Z #####/....#/...#./..#../.#.../#..../#####"
    .split("|").forEach(e => { F5[e[0]] = e.slice(2).split("/"); });
  // 1.12 b381: the forever cycle's cast — the hero in the fire flower's colours, the run's obstacles, the power-ups and
  // three more bosses (the robot and the slime king are drawn by rule, in layout)
  const HPF = pal({ H: "#FFFFFF", h: "#FFC2A8", V: "#5A0F2E", v: "#FFE14D", J: "#FF7A3C", j: "#C23A12", S: "#FFE14D", s: "#E0A800", P: "#FF2B5E", B: "#FFFFFF" });
  const SHELL = [["..W...W...W.", ".WW..WW..WW.", ".RRRRRRRRRR.", "RRhRRRRRRhRR", "RRRRRhRRRRRR", "RRRRRRRRRRRR", "DDDDDDDDDDDD", ".DDDDDDDDDD."],
    ["W...W...W...", "WW..WW..WW..", ".RRRRRRRRRR.", "RRRRRhRRRRRR", "RhRRRRRRRhRR", "RRRRRRRRRRRR", "DDDDDDDDDDDD", ".DDDDDDDDDD."]];
  const SHP = pal({ W: "#FFFFFF", R: "#FF2B5E", h: "#FFA3BD", D: "#8A0E33" });
  const BAT = [["B.........B", "BB.......BB", ".BBbbbbbBB.", "..bEbbbEb..", "...bbbbb...", "....b.b...."], ["...........", "...bbbbb...", "..bEbbbEb..", ".BBbbbbbBB.", "BB.......BB", "B.........B"]];
  const BTP = pal({ B: "#D9C2FF", b: "#7B4DE8", E: "#FF3BD9" });
  const BRICK = ["HHHHHHHm", "HbbbbbbM", "HbbbbbbM", "mmmmmmmm", "bbbmHbbb", "bbbmHbbb", "bbbmbbbb", "mmmmmmmm"];
  const BRP = pal({ H: "#FF9ADF", b: "#D02E9C", m: "#4A0B38", M: "#7A1560" });
  const CHIPS = [["HHHm", "Hbbm", "Hbbm", "mmmm"], ["HHHH", "bbbm", "bbbm", "mmmm"]];
  const PLANT = [["..MMMMMM..", ".MMWMMMWM.", "MMMMMMMMMM", "MMMMMMMMMM", "WWWWWWWWWW", "MMMMMMMMMM", ".MMMMMMMM.", "..MMMMMM..", "....GG....", "..GGGG.GG.", ".GG.GG.GG.", "....GG...."],
    ["..MMMMMM..", ".MMWMMMWM.", "MMMMMMMMMM", "WVWVWVWVWV", "KKKKKKKKKK", "VWVWVWVWVW", ".MMMMMMMM.", "..MMMMMM..", "....GG....", "..GGGG.GG.", ".GG.GG.GG.", "....GG...."]];
  const PLP = pal({ M: "#FF2B5E", W: "#FFFFFF", V: "#FFD6E0", K: "#1A0414", G: "#2FB84A" });
  const CANNON = ["...KKKKKKK", ".KKkkkkkkK", "KHHkkkkkkK", "KHkkkkkkkK", "KkkkkkkkkK", ".KKkkkkkkK", "...KKKKKKK", "....BBBB..", "...BBBBBB.", "..BBbbbbBB", "..BbbbbbbB", "..BBBBBBBB"];
  const BULLET = ["..KKKKKK.W", ".KkkkkkkKW", "KkWRkkkkKW", "KkkkkkkkKW", ".KHHHHHkKW", "..KKKKKK.W"];
  const CNP = pal({ K: "#15122E", k: "#4F48A0", H: "#8C86D8", B: "#6B66A8", b: "#4A4588", W: "#FFFFFF", R: "#FF2B5E" });
  const BOMB = ["..W..", ".KKK.", "KkKKK", "KKKKK", ".KKK."], BMP = pal({ K: "#4A4590", k: "#B8B2F0", W: "#FFE14D" });
  const SHROOM = ["...RRRR...", ".RRWWRRRR.", "RRWWWWRRRR", "RRRWWRRWWR", "RRRRRRRWWR", ".RRRRRRRR.", "..SSSSSS..", "..SKSSKS..", "..SSSSSS.."];
  const MUP = pal({ R: "#FF2BD6", W: "#FFFFFF", S: "#FFE8D0", K: "#0B0820" }), M1UP = pal({ R: "#3FE05A", W: "#FFFFFF", S: "#FFE8D0", K: "#0B0820" });
  const FLOWER = ["..OOOOO..", ".OYYYYYO.", "OYWWWWWYO", "OYWKWKWYO", ".OYYYYYO.", "..OOOOO..", "....G....", "GG..G..GG", ".GGGGGGG.", "...GGG..."];
  const FLP = pal({ O: "#FF7A3C", Y: "#FFE14D", W: "#FFFFFF", K: "#0B0820", G: "#2FB84A" });
  const JET = [".HHHHH.", "HhhhhhH", "HhCChhH", "HhCChhH", "HhhhhhH", "HhhhhhH", "HHHHHHH", ".NN.NN.", ".NN.NN."], JTP = pal({ H: "#58538A", h: "#A8A2E0", C: "#2BE8FF", N: "#403C6E" });
  // the dragon's head, 20×14, facing the hero: a horn curling back, a red eye, a cyan mane, a row of teeth; the jaw drops
  // open on fire
  const DHEAD = [["..............YY....", "............YYY..cc.", "........OOOMMMO.ccc.", "......OOMMMMMMMOccc.", "....OOMMMMMWWMMMOcc.", "..OOMMMMMMMWRMMMMOc.", "OOMKMMMMMMMMMMMMMMO.", "OMMMMMMMMMMMMMMMMO..", "OhhhhMMMMMMMMMMmO...", ".OTOTOTOTmmmmmmO....", "..OmmmmmmmmmmmO.....", "...OOcOOOcOOOO......", "....................", "...................."],
    ["..............YY....", "............YYY..cc.", "........OOOMMMO.ccc.", "......OOMMMMMMMOccc.", "....OOMMMMMWWMMMOcc.", "..OOMMMMMMMWRMMMMOc.", "OOMKMMMMMMMMMMMMMMO.", "OMMMMMMMMMMMMMMMMO..", "OhhhhMMMMMMmmmO.....", ".OTOTOTOKKKmmO......", "FFFFFFKKKKKmO.......", ".OTOTOTKKmmO........", "..OmmmmmmmO.........", "...OcOOOcO.........."]];
  const DHP = pal({ Y: "#FFE14D", M: "#FF2BD6", m: "#A8127F", h: "#FF9AF0", W: "#FFFFFF", K: "#1A0414", T: "#FFFFFF", c: "#2BE8FF", O: "#3A0A3A", F: "#FFB02E", R: "#FF2B4E" });
  // a segment of its body, 9×9: a spine spike, a paler belly
  const DSEG = ["....YY....", "...OYYO...", "..OSSSSO..", ".OSSsSSSO.", "OSSSSSSSSO", "OSSSSSSsSO", ".ObbbbbbO.", "..OOOOOO.."];
  const CROWN = ["Y...Y...Y", "YY.YYY.YY", "YYYYRYYYY", "YYYYYYYYY", "yyyyyyyyy"], CRP = pal({ Y: "#FFE14D", y: "#C9A21A", R: "#FF2B5E" });
  const OBST = ["coins", "block", "slime", "shell", "bats", "bricks", "spring", "pit", "pipe", "cannon"];
  const PRE = { coins: .31, block: .28, slime: .416, shell: .3, bats: .38, bricks: .25, spring: .32, pit: .35, pipe: .33, cannon: .38, oneup: .28 }; // from the jump to the moment it meets the thing
  const POST = { coins: .31, block: .28, slime: .56, shell: .3, bats: .5, bricks: .25, spring: 1.1, pit: .35, pipe: .33, cannon: .62, oneup: .28 }; // and from then to the landing
  const ENDS = ["HIGH SCORE!", "NEW RECORD!", "PERFECT!", "BOSS DOWN!", "YOU WIN!"];
  // the first level's points, each at the moment it is scored: five coins, the block, the slime, the star, the boss
  const SIGPTS = [[2.25 + .62 * .12, 10], [2.25 + .62 * .31, 10], [2.25 + .62 * .5, 10], [2.25 + .62 * .69, 10], [2.25 + .62 * .88, 10], [4.4, 100], [4.62 + .52 * .8, 200], [6.55, 1000], [11.3, 5000]];
  const BURST = [{ ring: ["#FF2BD6", "#FFFFFF"], bits: ["#DAD6F5", "#3FB8E0", "#FF2BD6", "#FFE14D"] }, { ring: ["#FF7A3C", "#FFFFFF"], bits: ["#DAD6F5", "#9B96C8", "#FF2B4E", "#2BE8FF"] },
    { ring: ["#B388FF", "#FFFFFF"], bits: ["#FF2BD6", "#B388FF", "#FFE14D", "#7C4DFF"] }, { ring: ["#7CFF6B", "#FFFFFF"], bits: ["#7CFF6B", "#2FB84A", "#D8FFD0", "#FFE14D"] }];
  /** a sprite's pixels moved one to one — turned a quarter at a time, or flipped — so pixel art keeps its pixels */
  const xform = (s, w2, h2, map) => { const d = s.getContext("2d").getImageData(0, 0, s.width, s.height).data, [c, x] = canvas(w2, h2), im = x.createImageData(w2, h2);
    for (let y = 0; y < s.height; y++) for (let xx = 0; xx < s.width; xx++) { const [X2, Y2] = map(xx, y), i = (y * s.width + xx) * 4, j = (Y2 * w2 + X2) * 4; im.data[j] = d[i]; im.data[j + 1] = d[i + 1]; im.data[j + 2] = d[i + 2]; im.data[j + 3] = d[i + 3]; }
    x.putImageData(im, 0, 0); return c; };
  const turn = (s, q) => q === 1 ? xform(s, s.height, s.width, (x, y) => [s.height - 1 - y, x]) : q === 2 ? xform(s, s.width, s.height, (x, y) => [s.width - 1 - x, s.height - 1 - y]) : xform(s, s.height, s.width, (x, y) => [y, s.width - 1 - x]);
  const flipV = s => xform(s, s.width, s.height, (x, y) => [x, s.height - 1 - y]), flipH = s => xform(s, s.width, s.height, (x, y) => [s.width - 1 - x, y]);
  const whiten = s => { const [c, x] = canvas(s.width, s.height); x.drawImage(s, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, s.width, s.height); return c; };
  /** pass P's cards: `per` different ones from a deck of `n`, dealt in shuffled rounds (the whole pool comes round before any
   *  card comes again), none of them one the pass before dealt (`sig`: the first pass's own, which pass 1 follows). Dealt
   *  from pass 1 on, remembering how far it got, so a pass costs next to nothing and any pass can be worked out alone */
  const dealt = new Map();
  const cards = (P, n, per, salt, sig = []) => { const deck = k => { const r = K.deal(-3000 - k, salt), a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const q = Math.floor(r() * (i + 1)); [a[i], a[q]] = [a[q], a[i]]; } return a; };
    const pick = (p, before) => { const out = []; for (let j = 0; j < per; j++) { const q = (p - 1) * per + j, dk = deck(Math.floor(q / n)); let c = dk[q % n]; for (let z = 1; (out.includes(c) || before.includes(c)) && z < n; z++) c = dk[(q + z) % n]; out.push(c); } return out; };
    let m = dealt.get(salt); if (!m || m.p > P) m = { p: 0, cur: sig }; for (let p = m.p + 1; p <= P; p++) m = { p, cur: pick(p, m.cur) }; dealt.set(salt, m); return m.cur; };
  /** a jump as the hero's height through it (unscaled pixels): up `h` over a line from y0 to y1, cut short at `cut` (a stomp) */
  const arc = (s, d, h, y0 = 0, y1 = 0, cut = 1, tag = "") => [s, d * cut, h, k => { const u = k * cut; return 4 * u * (1 - u) * h + y0 + (y1 - y0) * u; }, tag];
  const S = {
    res: "dpr",
    wash: 1, veil: .66, list: .35, hug: .86, hugFinale: true, // a dark kit; a darker pad hugs the lines and the finale's words, so the rest keeps its colour
    bind(ctx) { g = ctx; },
    layout(W, H, bg) {
      px = bg.getTransform().a;
      const pr = H > W * 1.05, PS = pr ? 5 : 6, bw = Math.ceil(W / PS), bh = Math.ceil(H / PS), gy = Math.floor(bh * (pr ? .93 : .9)), r = rng(77);
      const D = pr ? 400 : 800, PF = pr ? 80 : 160, PN = pr ? 200 : 400; // how far the loop runs, and each layer's period: the loop wraps without a seam
      Object.assign(S, { W, H, pr, PS, bw, bh, gy, D, PF, PN, jk: pr ? .75 : 1 });
      if (S.heroX === undefined || S.lastBw !== bw) { S.heroX = S.heroTx = Math.round(bw * (pr ? .26 : .7)); S.lastBw = bw; }
      if (!S.bx) { S.bx = S.btx = bw * (pr ? .5 : .8); S.by = S.bty = bh * (pr ? .22 : .32); }
      [pb, b] = canvas(bw, bh); b.imageSmoothingEnabled = false; S.tcache = new Map();
      [S.tiny1] = canvas(Math.ceil(bw / 2), Math.ceil(bh / 2)); [S.tiny2] = canvas(Math.ceil(bw / 6), Math.ceil(bh / 6));
      for (const t of [S.tiny1, S.tiny2]) t.getContext("2d").imageSmoothingEnabled = true;
      // how the world scrolls: still, a run from GO!, faster with the star, easing to a stop for the boss; normalised so
      // the loop covers D exactly, a multiple of every layer's period
      const vp = t => t < 1.2 ? 0 : t < 1.7 ? E.out((t - 1.2) / .5) : t < 6.6 ? 1 : t < 6.9 ? lerp(1, 1.7, (t - 6.6) / .3) : t < 7.8 ? 1.7 : t < 8.5 ? 1.7 * (1 - E.io((t - 7.8) / .7)) : 0;
      const N = 15 * 240, cum = new Float32Array(N + 1); for (let k = 1; k <= N; k++) cum[k] = cum[k - 1] + vp(k / 240) / 240;
      S.X = t => { const f = clamp(t / 15) * N, i = Math.min(N - 1, Math.floor(f)); return D * lerp(cum[i], cum[i + 1], f - i) / cum[N]; };
      // sprites
      S.hIdle = [hero(HEAD, BODY.idle, LEGS.idle), hero(HEAD, BODY.flut, LEGS.idle)]; S.hBlink = hero(BLINK, BODY.idle, LEGS.idle);
      S.hRun = [hero(HEAD, BODY.a, LEGS.r1), hero(HEAD, BODY.b, LEGS.r2), hero(HEAD, BODY.c, LEGS.r3), hero(HEAD, BODY.b, LEGS.r4)]; S.hJump = hero(HEAD, BODY.jump, LEGS.jump);
      const tint = (spr, col) => { const [c, x] = canvas(spr.width, spr.height); x.drawImage(spr, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, spr.width, spr.height); return c; };
      S.hGhost = NEON.map(c => [...S.hRun, S.hJump].map(s2 => tint(s2, c)));
      S.slime = sprite(SLIME, SP); S.flat = sprite([".GGGGGGGG.", "GWKGGGGWKG", "gggggggggg"], SP);
      S.block = sprite(BLOCK, pal({ D: "#8A4B00", Y: "#FFE08A", Q: "#FFB02E", q: "#C77A0A", W: "#FFFFFF" }));
      S.used = sprite(BLOCK, pal({ D: "#2E1E10", Y: "#8A6A48", Q: "#6B4E32", q: "#4A3522", W: "#6B4E32" }));
      S.coin = COIN.map(rows => sprite(rows, pal({ Y: "#FFE14D", y: "#C9A21A", W: "#FFFFFF" }))); S.coin.push(S.coin[1]);
      S.star = NEON.map(c => sprite(STAR, pal({ Y: c, K: "#0B0820" })));
      S.cup = sprite(CUP, pal({ Y: "#FFE14D", y: "#C9A21A" }));
      // the boss: a saucer with a glass dome, drawn by rule so it's symmetric; its eye, lights and flames are drawn live
      const bossPix = (x, y, white) => {
        const dx = (x + .5 - 15) / 8.6, dy = (y + .5 - 8.2) / 7.8, sx = (x + .5 - 15) / 15, sy = (y + .5 - 11) / 3.6, w = [255, 255, 255];
        if (y <= 8 && dx * dx + dy * dy <= 1) return white ? w : dx < -.35 && dy < -.25 && dx * dx + dy * dy > .45 ? hex("#CFFBFF") : dx * dx + dy * dy > .7 ? hex("#1E6F9E") : hex("#3FB8E0");
        if (sx * sx + sy * sy <= 1) return white ? w : y < 10 ? hex("#DAD6F5") : y < 12 ? hex("#9B96C8") : hex("#58538A");
        if (y >= 14 && y <= 15 && [5, 6, 11, 12, 17, 18, 23, 24].includes(x)) return white ? w : hex("#403C6E");
        return null;
      };
      S.boss = K.paint(30, 16, (x, y) => bossPix(x, y, false)); S.bossWhite = K.paint(30, 16, (x, y) => bossPix(x, y, true));
      // the moon, big and pale, with its craters
      const mr = pr ? 8 : 12; S.moonR = mr;
      S.moon = K.paint(mr * 2 + 1, mr * 2 + 1, (x, y) => { const dx = x - mr, dy = y - mr, d = Math.hypot(dx, dy); if (d > mr + .3) return null; for (const [cx, cy, cr] of [[-.35, -.2, .22], [.25, .3, .16], [.1, -.45, .12]]) if (Math.hypot(dx - cx * mr, dy - cy * mr) < cr * mr) return hex("#A89EE2"); return dx + dy * .3 > mr * .45 ? hex("#9A90D6") : hex("#CFC8F5"); });
      S.moonAt = pr ? [Math.round(bw * .74), Math.round(bh * .12)] : [Math.round(bw * .84), Math.round(bh * .16)];
      // the city: a far layer and a near one, each a strip one period wide that repeats
      const strip = (Pw, hMax, near) => { const Hh = Math.ceil(hMax) + 8; return [K.paint(Pw, Hh, () => null), Hh]; };
      const [far, fh] = strip(PF, gy * .42), fx = far.getContext("2d"); S.far = far; S.farH = fh;
      for (let x = 0; x < PF;) { const w = 6 + Math.floor(r() * 10), h = Math.floor(fh * (.3 + r() * .6)); if (x + w > PF) break; fx.fillStyle = "#170F3D"; fx.fillRect(x, fh - h, w, h); fx.fillStyle = "#231958"; fx.fillRect(x, fh - h, w, 1); fx.fillStyle = "#3A2C80"; for (let wy = fh - h + 3; wy < fh - 2; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 2) if (r() < .18) fx.fillRect(wx, wy, 1, 1); x += w + Math.floor(r() * 3); }
      const [nearS, nh] = strip(PN, gy * .58), nx = nearS.getContext("2d"); S.near = nearS; S.nearH = nh; S.wins = []; S.antennas = [];
      const LIT = ["#FF2BD6", "#2BE8FF", "#FFE14D", "#FF2BD6", "#2BE8FF"];
      const F3 = { A: [".#.", "#.#", "###", "#.#", "#.#"], R: ["##.", "#.#", "##.", "#.#", "#.#"], C: [".##", "#..", "#..", "#..", ".##"], D: ["##.", "#.#", "#.#", "#.#", "##."], E: ["###", "#..", "##.", "#..", "###"] };
      let signDone = false;
      for (let x = 1; x < PN;) {
        const w = 10 + Math.floor(r() * 14), h = Math.floor(nh * (.35 + r() * .62)); if (x + w > PN - 1) break; const top = nh - h;
        nx.fillStyle = "#0E0927"; nx.fillRect(x, top, w, h); nx.fillStyle = "#20174A"; nx.fillRect(x, top, 1, h); nx.fillStyle = "#2A1F5E"; nx.fillRect(x, top, w, 1);
        for (let wy = top + 3; wy < nh - 3; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) { const lit = r() < .42; nx.fillStyle = lit ? LIT[Math.floor(r() * LIT.length)] : "#1B1346"; nx.fillRect(wx, wy, 1, 2); if (lit && r() < .2) S.wins.push({ x: wx, y: wy, ph: r() * 40 }); }
        if (r() < .45) { const ax = x + 2 + Math.floor(r() * (w - 4)), ah = 3 + Math.floor(r() * 5); nx.fillStyle = "#2A1F5E"; nx.fillRect(ax, top - ah, 1, ah); S.antennas.push({ x: ax, y: top - ah - 1, ph: r() * TAU }); }
        if (!signDone && h > 42 && w >= 12) { // a vertical neon sign: ARCADE
          const sx2 = x + Math.floor(w / 2) - 2, sy2 = top + 4; nx.fillStyle = "#1A0B2E"; nx.fillRect(sx2 - 1, sy2 - 1, 5, 37); S.sign = { x: sx2, y: sy2 }; signDone = true;
        }
        x += w + 1 + Math.floor(r() * 3);
      }
      S.F3 = F3;
      // the ground: a neon edge, and bricks under it, one period of them
      const gh = bh - gy; S.ground = K.paint(16, gh, (x, y) => { if (y === 0) return hex("#FF8AE8"); if (y === 1) return hex("#E020C0"); if (y === 2) return hex("#6A1890"); const yy = y - 3, row = Math.floor(yy / 4), off = row % 2 ? 8 : 0, bx2 = (x + off) % 16; if (yy % 4 === 3 || bx2 === 0) return hex("#0C0620"); return yy % 4 === 0 ? hex("#3F2388") : yy % 4 === 2 ? hex("#1C0D44") : hex("#2A1461"); });
      // the stars, in two depths
      S.stars = Array.from({ length: Math.round(bw * gy / (pr ? 60 : 70)) }, () => ({ x: r() * bw, y: r() * gy * .75, p: r() < .5 ? .04 : .08, c: r() < .15 ? 1 : r() < .15 ? 2 : 0, ph: r() * TAU, f: .5 + r() * 2 }));
      // the stars that don't twinkle are drawn once, a layer for each depth, and scrolled; a sixth of them twinkle live
      S.starL = [.04, .08].map(p => { const [c, x] = canvas(bw, gy); for (const st of S.stars) if (st.p === p && Math.round(st.ph * 10) % 6) { x.globalAlpha = .55 + .35 * ((st.ph * 7) % 1); x.fillStyle = ["#FFFFFF", "#9AE7FF", "#FF9AF0"][st.c]; x.fillRect(Math.round(st.x), Math.round(st.y), 1, 1); } return c; });
      S.twinkle = S.stars.filter(st => !(Math.round(st.ph * 10) % 6));
      S.bits = Array.from({ length: 48 }, () => ({ a: r() * TAU, v: .4 + r() * .8, c: Math.floor(r() * 4), s: r() < .3 ? 2 : 1 }));
      S.fire = Array.from({ length: 5 }, (_, i) => ({ dx: [-.9, .9, -.5, .55, 0][i], dy: [-.3, -.4, -1.1, -1.15, -1.5][i], t: .12 + i * .1, c: i, parts: Array.from({ length: 26 }, () => ({ a: r() * TAU, v: .6 + r() * .4 })) }));
      S.confetti = Array.from({ length: pr ? 40 : 70 }, () => ({ x: r(), d: r() * .4, v: .6 + r() * .6, c: Math.floor(r() * 6), w: r() < .5 }));
      // the backdrop: a dithered sky in bands, a haze of magenta at the horizon, a glow behind the moon, a vignette
      const SKY = ["#05041A", "#0B0828", "#140B3A", "#221050", "#34125E", "#4A1470"].map(hex);
      const sky = K.paint(bw, gy, (x, y) => { const t = y / gy * (SKY.length - 1) + K.dith(x, y) - .5; return SKY[clamp(Math.round(t), 0, SKY.length - 1)]; });
      bg.imageSmoothingEnabled = false; bg.drawImage(sky, 0, 0, bw * PS, gy * PS); bg.imageSmoothingEnabled = true;
      bg.fillStyle = "#0C0620"; bg.fillRect(0, gy * PS, W, H - gy * PS);
      bg.imageSmoothingEnabled = false; bg.drawImage(S.moon, S.moonAt[0] * PS, S.moonAt[1] * PS, S.moon.width * PS, S.moon.height * PS); bg.imageSmoothingEnabled = true; // on the backdrop, so the bloom leaves its craters
      const [mx, my] = S.moonAt, mg = bg.createRadialGradient((mx + mr) * PS, (my + mr) * PS, mr * PS * .8, (mx + mr) * PS, (my + mr) * PS, mr * PS * 3.2); mg.addColorStop(0, "rgba(190,170,255,.22)"); mg.addColorStop(1, "rgba(190,170,255,0)"); bg.fillStyle = mg; bg.fillRect(0, 0, W, H);
      const hz = bg.createLinearGradient(0, gy * PS - H * .3, 0, gy * PS); hz.addColorStop(0, "rgba(255,43,214,0)"); hz.addColorStop(1, "rgba(255,43,214,.16)"); bg.fillStyle = hz; bg.fillRect(0, gy * PS - H * .3, W, H * .3);
      const vg = bg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .78); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.5)"); bg.fillStyle = vg; bg.fillRect(0, 0, W, H);
      // the scanlines: one dark line under every row of the game's pixels
      const [sl, sx] = canvas(1, Math.max(2, Math.round(PS * px))); sx.fillStyle = "rgba(0,0,0,.34)"; sx.fillRect(0, sl.height - Math.max(1, Math.round(PS * px * .3)), 1, Math.max(1, Math.round(PS * px * .3))); S.scan = sl;
      // 1.12 b381: the dealt levels' sprites, drawn once, with dice of their own (so the city above deals as it always has)
      const q = rng(78);
      const kit = p => ({ idle: [hero(HEAD, BODY.idle, LEGS.idle, p), hero(HEAD, BODY.flut, LEGS.idle, p)], run: [hero(HEAD, BODY.a, LEGS.r1, p), hero(HEAD, BODY.b, LEGS.r2, p), hero(HEAD, BODY.c, LEGS.r3, p), hero(HEAD, BODY.b, LEGS.r4, p)], jump: hero(HEAD, BODY.jump, LEGS.jump, p) });
      S.norm = { idle: S.hIdle, run: S.hRun, jump: S.hJump }; S.fireSet = kit(HPF);
      for (const st of [S.norm, S.fireSet]) st.spin = [1, 2, 3].map(k => turn(st.jump, k));
      S.shell = SHELL.map(rows => sprite(rows, SHP)); S.bat = BAT.map(rows => sprite(rows, BTP)); S.brick = sprite(BRICK, BRP); S.chip = CHIPS.map(rows => sprite(rows, BRP));
      S.plant = PLANT.map(rows => sprite(rows, PLP)); S.cannon = sprite(CANNON, CNP); S.bullet = sprite(BULLET, CNP); S.bulletF = flipV(S.bullet); S.bomb = sprite(BOMB, BMP);
      S.shroom = sprite(SHROOM, MUP); S.oneup = sprite(SHROOM, M1UP); S.flower = sprite(FLOWER, FLP); S.jet = sprite(JET, JTP);
      S.slimes = [{ n: S.slime, f: S.flat, c: "#7CFF6B" }, ...[["#4DD8FF", "#1A8FB0", "#0E4A6E"], ["#FF8AE8", "#C0268F", "#6A0A55"]].map(([G, g2, M]) => { const p = pal({ G, g: g2, W: "#FFFFFF", K: "#0B0820", M }); return { n: sprite(SLIME, p), f: sprite([".GGGGGGGG.", "GWKGGGGWKG", "gggggggggg"], p), c: G }; })];
      S.dhead = DHEAD.map(rows => sprite(rows, DHP)); S.dheadW = S.dhead.map(whiten);
      S.dseg = [sprite(DSEG, pal({ S: "#8F5CFF", s: "#BBA0FF", b: "#FF8AD8", Y: "#FFE14D", O: "#2A0F4A" })), sprite(DSEG, pal({ S: "#D8249F", s: "#FF7AD9", b: "#FFB0E0", Y: "#FFE14D", O: "#2A0F4A" }))];
      S.crown = sprite(CROWN, CRP); S.crownE = sprite(["..Y..", ".YYY.", ".YRY.", ".YYY.", ".yyy."], CRP);
      // the robot, 26×22 above its legs (drawn live, so it can walk): a visor, a cannon arm, a core that glows
      const RL = hex("#DAD6F5"), RM = hex("#9B96C8"), RD = hex("#58538A"), RO = hex("#2A2650"), WH = [255, 255, 255];
      const robotPix = (x, y) => {
        if (x === 13 && y <= 2) return y === 0 ? hex("#FF2B5E") : RD;
        if (x >= 8 && x <= 18 && y >= 3 && y <= 10) { if (x === 8 || x === 18 || y === 3 || y === 10) return RO; if (y >= 6 && y <= 7 && x >= 9 && x <= 17) return y === 6 && x <= 11 ? hex("#FFB0C0") : hex("#FF2B4E"); return y === 4 ? RL : RM; }
        if (x >= 11 && x <= 15 && y === 11) return RD;
        if (y >= 12 && y <= 15 && (x <= 5 || x >= 21)) return y === 12 ? RL : (x === 0 || x === 25 || y === 15) ? RO : RM;
        if (x >= 4 && x <= 22 && y >= 12 && y <= 21) { if (x === 4 || x === 22 || y === 21) return RO; if (x >= 11 && x <= 15 && y >= 14 && y <= 17) return x === 13 && (y === 15 || y === 16) ? WH : hex("#2BE8FF"); if (y === 12) return RL; return y > 18 ? RD : RM; }
        if (x <= 3 && y >= 16 && y <= 21) { if (x === 0 && (y === 18 || y === 19)) return hex("#0B0820"); return x === 0 || y === 21 ? RO : RM; }
        if (x >= 23 && x <= 25 && y >= 16 && y <= 20) return x === 25 || y === 20 ? RO : RD;
        return null; };
      S.robot = K.paint(26, 22, robotPix); S.robotW = whiten(S.robot); S.robotHead = K.paint(11, 11, (x, y) => robotPix(x + 8, y)); S.robotHeadF = flipH(S.robotHead);
      // the slime king: a dome of jelly looking at the hero, a crown on top (drawn apart, so it can fly)
      const KG = hex("#7CFF6B"), Kg = hex("#2FB84A"), KD = hex("#16662A"), KH = hex("#D8FFD0");
      S.king = K.paint(28, 20, (x, y) => { const cx = 14, t = (y + .5) / 20, hw = 13.6 * Math.sqrt(clamp(1 - (1 - t) * (1 - t))) + (y >= 18 ? .6 : 0), dx = x + .5 - cx; if (Math.abs(dx) > hw) return null;
        for (const ex of [cx - 5.5, cx + 2.5]) { const ddx = (x + .5 - ex) / 2.3, ddy = (y + .5 - 9.5) / 2.7; if (ddx * ddx + ddy * ddy <= 1) return x + .5 < ex && y >= 9 && y <= 10 ? hex("#0B0820") : WH; } // its pupils on the hero, to the left
        if (y === 14 && dx > -6 && dx < 4) return hex("#0B3A18"); if (y === 15 && dx > -5 && dx < 3) return dx > -2 && dx < 1 ? hex("#FF6FA0") : hex("#0B3A18");
        if (Math.abs(dx) > hw - 1 || y === 19) return KD;
        if (y <= 6 && dx < -2 && dx > -8 && (x + y) % 3 === 0) return KH;
        return dx > hw * .45 || y > 16 ? Kg : KG; });
      S.kingW = whiten(S.king);
      // the synthwave sun for a level at sunset: yellow to magenta, sliced by the sky toward its foot
      const R = pr ? 13 : 20, SUNC = ["#FFF6B8", "#FFE14D", "#FFB02E", "#FF7A3C", "#FF4F86", "#FF2BD6"].map(hex); S.sunR = R;
      S.sun = K.paint(R * 2 + 1, R * 2 + 1, (x, y) => { const dx = x - R, dy = y - R; if (dx * dx + dy * dy > (R + .4) * (R + .4)) return null;
        if (dy > R * .12) { const band = (dy - R * .12) / (R * .88), per = Math.max(3, Math.round(R / 4)), gap = 1 + Math.floor(band * (per - 1.2)); if (Math.floor(dy - R * .12) % per < gap) return null; }
        return SUNC[clamp(Math.round(clamp(y / (1.55 * R)) * (SUNC.length - 1) + K.dith(x, y) - .5), 0, SUNC.length - 1)]; });
      // a storm's clouds: rounded heaps, lit along their tops
      const cloudOf = (w, h) => { const n = 6, bl = Array.from({ length: n }, (_, i) => { const mid = 1 - Math.abs(i - (n - 1) / 2) / (n / 2), r0 = h * (.24 + .24 * mid + q() * .08); return [w * (.1 + .8 * i / (n - 1)) + (q() - .5) * 2, h - r0 - 1, r0]; }), inside = (x, y) => y < h - 1 && bl.some(([cx, cy, r0]) => Math.hypot(x + .5 - cx, (y + .5 - cy) * 1.15) < r0);
        return K.paint(w, h, (x, y) => !inside(x, y) ? null : !inside(x, y - 1) ? hex("#3A3574") : !inside(x, y - 2) ? hex("#252050") : y > h * .7 ? hex("#0F0C24") : hex("#17132F")); };
      S.clouds = (pr ? [[28, 12], [22, 10], [32, 13]] : [[48, 18], [36, 14], [58, 20]]).map(([w, h]) => cloudOf(w, h));
      // snow settling along the roofs: the top pixel of every column of each city layer
      const capOf = (st, col) => { const w = st.width, h = st.height, d = st.getContext("2d").getImageData(0, 0, w, h).data, [c, x] = canvas(w, h); x.fillStyle = col; for (let xx = 0; xx < w; xx++) for (let y = 0; y < h; y++) if (d[(y * w + xx) * 4 + 3]) { x.fillRect(xx, y, 1, 1); if (y > 0 && (xx * 7) % 5 < 2) x.fillRect(xx, y - 1, 1, 1); break; } return c; };
      S.nearCap = capOf(S.near, "#EEF4FF"); S.farCap = capOf(S.far, "#9AA6D8");
      S.groundB = K.paint(16, gh, (x, y) => { if (y === 0) return hex("#9AE6FF"); if (y === 1) return hex("#2BA8E8"); if (y === 2) return hex("#123E80"); const yy = y - 3, row = Math.floor(yy / 4), bx2 = (x + (row % 2 ? 8 : 0)) % 16; if (yy % 4 === 3 || bx2 === 0) return hex("#050A20"); return yy % 4 === 0 ? hex("#3A6FD0") : yy % 4 === 2 ? hex("#16336E") : hex("#24509E"); }); // the bonus room's
      S.drops = Array.from({ length: pr ? 46 : 110 }, () => ({ x: q() * (bw + 30), ph: q(), l: 3 + Math.floor(q() * 3), a: .3 + q() * .4, v: .9 + q() * .25 }));
      S.flakes = Array.from({ length: pr ? 44 : 100 }, () => ({ x: q() * (bw + 20), ph: q(), s: q() < .3 ? 2 : 1, v: .9 + q() * .35, sw: q() * TAU, a: .5 + q() * .45 }));
      // the skies laid over the backdrop: a sunset's glow up from the horizon, a storm's dark, the cold haze of snow, the
      // aurora's green at the top of the sky
      const gyC = gy * PS, sg = b.createLinearGradient(0, bh * .28, 0, gy); sg.addColorStop(0, "rgba(255,43,150,0)"); sg.addColorStop(.6, "rgba(255,43,140,.095)"); sg.addColorStop(1, "rgba(255,122,60,.24)");
      const ng = b.createLinearGradient(0, bh * .35, 0, gy); ng.addColorStop(0, "rgba(160,200,255,0)"); ng.addColorStop(1, "rgba(160,200,255,.075)");
      const ag = b.createLinearGradient(0, 0, 0, bh * .5); ag.addColorStop(0, "rgba(60,255,170,.065)"); ag.addColorStop(1, "rgba(60,255,170,0)");
      S.skyG = [null, sg, "rgba(3,4,16,.52)", ng, ag]; // laid first into the game's pixels, under everything, so they cost nothing to show
      // the sky where the moon is, drawn again without it: laid over the backdrop, it lets the moon give way to the sunset
      { const rr0 = mr * 3.3 * PS, cx0 = (mx + mr) * PS, cy0 = (my + mr) * PS, x0 = Math.max(0, Math.floor(cx0 - rr0)), y0 = Math.max(0, Math.floor(cy0 - rr0)), x1 = Math.min(W, Math.ceil(cx0 + rr0)), y1 = Math.min(gyC, Math.ceil(cy0 + rr0));
        const [pc, pxc] = canvas(Math.ceil((x1 - x0) * px), Math.ceil((y1 - y0) * px)); pxc.setTransform(px, 0, 0, px, -x0 * px, -y0 * px);
        pxc.imageSmoothingEnabled = false; pxc.drawImage(sky, 0, 0, bw * PS, gy * PS); pxc.imageSmoothingEnabled = true;
        const hz2 = pxc.createLinearGradient(0, gyC - H * .3, 0, gyC); hz2.addColorStop(0, "rgba(255,43,214,0)"); hz2.addColorStop(1, "rgba(255,43,214,.16)"); pxc.fillStyle = hz2; pxc.fillRect(0, gyC - H * .3, W, H * .3);
        const vg2 = pxc.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .78); vg2.addColorStop(0, "rgba(0,0,0,0)"); vg2.addColorStop(1, "rgba(0,0,0,.5)"); pxc.fillStyle = vg2; pxc.fillRect(0, 0, W, H);
        S.noMoon = [pc, x0, y0, x1 - x0, y1 - y0]; }
      // the aurora: two curtains, each one screen wide and tiling — rays standing up from a bright hem that waves, green
      // under violet, and cyan under magenta
      const AH = pr ? 26 : 34, fq = TAU / bw, cyc = pr ? [1, 2, 3, 9, 4] : [2, 3, 5, 37, 11];
      S.aurH = AH; S.aur = [0, 1].map(k => K.paint(bw, AH, (x, y) => { const rays = .5 + .5 * Math.sin(x * fq * cyc[3] + k * 4) * Math.sin(x * fq * cyc[4] + k * 1.7), hem = AH * (.74 + .12 * Math.sin(x * fq * cyc[0] + k * 2.1) + .06 * Math.sin(x * fq * cyc[2] + k)), len = AH * (.22 + .5 * rays) * (.7 + .3 * Math.sin(x * fq * cyc[1] + k)), d = hem - y;
        if (d < 0 || d > len) return null; const u = d / len, al = (1 - u) * (1 - u) * (.5 + .5 * rays);
        return [...(u < .14 ? (k ? [205, 255, 250] : [205, 255, 215]) : u < .6 ? (k ? [80, 225, 255] : [70, 240, 150]) : (k ? [255, 90, 220] : [185, 110, 255])), Math.round(255 * al * .85)]; }));
      S.plans = []; S.sigL = { P: 0, sig: true, X: S.X }; S.placeSun();
      S.hz = null; S.scanPat = null; if (S.raw) S.words(S.raw);
    },
    /** where the words are (scenes.js): the hero stands where the column above its ground is clear of them, and the
     *  banners go up in the clearest open space */
    words(rects) {
      S.raw = rects; S.wr = rects.map(([x0, y0, x1, y1, k]) => [x0 - 8, y0 - 8, x1 + 8, y1 + 8, k]); if (!S.bw) return;
      const { PS, bw, bh, gy, pr } = S, top = (gy - (pr ? 58 : 48)) * PS, hit = (x0, y0, x1, y1) => S.wr.some(r => r[0] < x1 && r[2] > x0 && r[1] < y1 && r[3] > y0);
      // the small words (kind 0: the date, the count, the pills, the hint) keep the sky behind them starless — each one's
      // box and a pixel round it, in the game's pixels, and three more for the stars to fade across
      S.hz = []; for (const [x0, y0, x1, y1, k] of S.wr) { if (k !== 0 || y0 >= gy * PS) continue; const c0 = Math.floor(x0 / PS) - 1, r0 = Math.floor(y0 / PS) - 1, c1 = Math.ceil(x1 / PS) + 1, r1 = Math.ceil(y1 / PS) + 1; S.hz.push([c0, r0, c1, r1, c0 - 3, r0 - 3, c1 + 3, r1 + 3]); }
      const inRows = y => S.hz.some(z => y >= z[5] && y < z[7]);
      S.hzStars = [.04, .08].map(p => S.stars.filter(st => st.p === p && Math.round(st.ph * 10) % 6 && inRows(Math.round(st.y)))); for (const st of S.twinkle) st.hz = inRows(Math.round(st.y));
      let hx = null; for (let x = pr ? 12 : 10; x < bw - (pr ? 40 : 76); x += 2) if (!hit((x - 2) * PS, top, (x + 16) * PS, gy * PS)) { hx = x; break; }
      S.heroTx = hx === null ? Math.round(bw * (pr ? .26 : .7)) : hx;
      // the banners: a panel 70×15 of the game's pixels, wherever it is furthest from any word
      let best = -1e9, bx = S.btx, by = S.bty; const pw = 72 * PS, ph = 17 * PS;
      for (let gx = 0; gx <= 16; gx++) for (let gy2 = 0; gy2 <= 12; gy2++) {
        const cx = pw / 2 + 8 + (S.W - pw - 16) * gx / 16, cy = S.H * .1 + ph / 2 + ((gy - (pr ? 46 : 52)) * PS - ph - S.H * .1) * gy2 / 12;
        let d = 1e9; for (const r of S.wr) d = Math.min(d, Math.hypot(Math.max(r[0] - (cx + pw / 2), 0, (cx - pw / 2) - r[2]), Math.max(r[1] - (cy + ph / 2), 0, (cy - ph / 2) - r[3])));
        if (d > best + 1) { best = d; bx = cx; by = cy; }
      }
      S.btx = bx / PS; S.bty = by / PS;
      S.placeSun();
    },
    /** b381: the sunset's sun sits on the skyline as near its place as it can without coming behind a word; failing that
     *  up in the open sky (where it fades up rather than rising through the list), or else low behind the towers */
    placeSun() {
      const { PS, bw, gy, pr, sunR: R } = S, cx0 = Math.round(bw * (pr ? .5 : .7)), cyT = Math.round(gy - S.nearH * .76);
      const hit = (x0, y0, x1, y1) => (S.wr || []).some(r => r[0] / PS < x1 && r[2] / PS > x0 && r[1] / PS < y1 && r[3] / PS > y0);
      let best = null, bs = -1e9; for (let cy = R + 3; cy <= gy - R * .4; cy += 3) for (let cx = R + 2; cx <= bw - R - 2; cx += 3) { if (hit(cx - R - 3, cy - R - 3, cx + R + 3, cy + R + 3)) continue; const sc = -Math.abs(cx - cx0) * .4 - Math.abs(cy - cyT) * 1.2 - (cy > cyT + R * .35 ? 100 : 0); if (sc > bs) { bs = sc; best = [cx, cy]; } }
      S.sunC = best || [cx0, gy - Math.round(R * .45)]; S.sunHigh = S.sunC[1] < cyT - R;
    },
    /** how much of a star at (x, y), in the game's pixels, shows beside the small words: none behind one, all of it three
     *  pixels off */
    hzFade(x, y) { let f = 1; for (const z of S.hz || []) { if (x < z[4] || x >= z[6] || y < z[5] || y >= z[7]) continue; f = Math.min(f, clamp(Math.max(z[0] - x, 0, x - z[2] + 1, z[1] - y, y - z[3] + 1) / 3.5)); } return f; },
    /** 1 clear of the words, down to a trace behind them (CSS pixels) */
    shade(x, y, rad) { let d = 1e9; for (const [x0, y0, x1, y1] of S.wr || []) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))); return lerp(.15, 1, clamp(d / rad)); }, // full once clear of the word, faint only behind it
    /** for the instruments (the stage's state().info, b397): the level on screen, the score shown, the bank, the boss */
    info() { return S.lastInfo || null; },
    /** a level's points scored by loop time t, each counted up over .4 s as the signature always counted them */
    earned(L, t) { return Math.round((L.sig ? SIGPTS : L.pts).reduce((s, [t0, p]) => s + p * clamp((t - t0) / .4), 0) / 10) * 10; },
    /** 1.12 b397: the score carries from level to level, as a game's does. The level being played is pass P; when the pass
     *  moves on, the bank takes what the last one scored — all of it when it played out, what the hero had when the loop
     *  let go when the list cut it short (the next stretch left alone plays the next level either way) — and a pass the
     *  instruments skip past counts whole. A page opens on nothing; a quiet page shows the bank. */
    bankTo(P, hx) {
      if (S.bankP === undefined || P < S.bankP) { S.bank = 0; for (let p = 0; p < P; p++) S.bank += S.earned(S.level0(p, hx), 15); }
      else { S.bank += S.earned(S.bankL, S.bankT); for (let p = S.bankP + 1; p < P; p++) S.bank += S.earned(S.level0(p, hx), 15); }
      S.bankP = P;
    },
    level0(p, hx) { return p > 0 ? S.level(p, hx) : S.sigL; },
    /** the level pass P deals, for a hero standing in column hx (b381); pass 0 is the signature, drawn as it always was */
    plan(P, hx) {
      if (!(P > 0)) return S.sigL;
      for (const L of S.plans) if (L.P === P && L.hx === hx) return L;
      const L = S.level(P, hx); S.plans.unshift(L); if (S.plans.length > 4) S.plans.length = 4; return L;
    },
    level(P, hx) {
      const { bw, gy, D, pr } = S, r = K.deal(P, 301);
      // the sky from five (a night of shooting stars, a synthwave sunset, a storm, snow, the aurora: never the signature's
      // plain night, so no level looks like the first), the power-up and the boss from four each, the closing words from five
      const L = { P, hx, sig: false, sky: K.bag(P, 5, 302), power: K.bag(P, 4, 303), boss: K.bag(P, 4, 304), end: K.bag(P, 5, 305) }, oneUp = K.bag(P, 8, 307) === 3;
      // the scroll: still until GO!, a run, faster with the star or the jetpack, easing to a stop for the boss — covering
      // D like the signature's, so the city comes to rest where it began
      const vp = t => t < 1.2 ? 0 : t < 1.7 ? E.out((t - 1.2) / .5) : L.power === 0 ? (t < 6.6 ? 1 : t < 6.9 ? lerp(1, 1.7, (t - 6.6) / .3) : t < 7.8 ? 1.7 : t < 8.5 ? 1.7 * (1 - E.io((t - 7.8) / .7)) : 0)
        : L.power === 3 ? (t < 6.6 ? 1 : t < 6.9 ? lerp(1, 1.6, (t - 6.6) / .3) : t < 7.7 ? 1.6 : t < 8.5 ? 1.6 * (1 - E.io((t - 7.7) / .8)) : 0)
        : (t < 7.8 ? 1 : t < 8.5 ? 1 - E.io((t - 7.8) / .7) : 0);
      const N = 15 * 240, cum = new Float32Array(N + 1); for (let k = 1; k <= N; k++) cum[k] = cum[k - 1] + vp(k / 240) / 240;
      let X = t => { const f = clamp(t / 15) * N, i = Math.min(N - 1, Math.floor(f)); return D * lerp(cum[i], cum[i + 1], f - i) / cum[N]; };
      // about one level in eight hides a warp pipe down to a bonus room (if the hero stands far enough from the edge for the
      // pipe to come on from past it): the world stands still while the hero is below, and catches up while the room hides
      // it (a quick pan, should the room be fading because the list was touched), so the level still covers D
      let tb0 = 2.6; for (let i = 0; i < 12 && X(tb0) < bw - hx + 12; i++) tb0 += .05; // as soon as the pipe can come on from past the edge, and back up before the power-up
      if (K.bag(P, 8, 309) === 6 && X(tb0) >= bw - hx + 12 && tb0 <= (L.power === 1 || L.power === 2 ? 2.7 : 3.1)) {
        const vb = t => t < tb0 - .15 ? vp(t) : t < tb0 ? vp(t) * (tb0 - t) / .15 : t < tb0 + 2.8 ? 0 : t < tb0 + 3.1 ? vp(t) * (t - tb0 - 2.8) / .3 : vp(t);
        const cb = new Float32Array(N + 1); for (let k = 1; k <= N; k++) cb[k] = cb[k - 1] + vb(k / 240) / 240;
        const kx = D / cum[N], warp = D - kx * cb[N]; X = t => { const f = clamp(t / 15) * N, i = Math.min(N - 1, Math.floor(f)); return kx * lerp(cb[i], cb[i + 1], f - i) + warp * E.io(clamp((t - tb0 - .75) / 1.6)); };
        L.bonus = { t0: tb0, n: pr ? 11 : 17 }; }
      L.X = X;
      const tAt = x => { let a = 0, c = 15; for (let i = 0; i < 30; i++) { const m = (a + c) / 2; if (X(m) < x) a = m; else c = m; } return c; }; // (the warp only jumps forward, so X still climbs)
      // the run: obstacles from the pool one after another, each met only once it has come on from past the right edge
      const jumps = [[1.2, .34, 5]], pts = [], beats = [], kinds = cards(P, OBST.length, 3, 308, [0, 1, 2]).map(i => OBST[i]); if (oneUp) kinds[1] = "oneup"; if (L.bonus) kinds.length = 0; // the bonus room is the run
      const cmin = tAt(bw - hx + 14); let next = 1.8 + r() * .3;
      for (const k of kinds) {
        const c = Math.max(cmin, next + PRE[k]); if (c + POST[k] > 5.72) continue;
        const bt = { k, c, s: c - PRE[k] }; beats.push(bt);
        if (k === "coins") { bt.d = .62; bt.h = 13 + Math.round(r() * 5); bt.n = r() < .5 ? 6 : 5; jumps.push([bt.s, bt.d, bt.h]); for (let i = 0; i < bt.n; i++) pts.push([bt.s + bt.d * (.12 + .76 * i / (bt.n - 1)), 10]); }
        else if (k === "block" || k === "oneup") { jumps.push([bt.s, .56, 16]); if (k === "block") pts.push([c, 100]); }
        else if (k === "slime") { bt.v = Math.floor(r() * 3); jumps.push(arc(bt.s, .52, 12, 0, 0, .8), arc(c, .56, 18, 7.68)); pts.push([c, 200]); }
        else if (k === "shell") { jumps.push([bt.s, .6, 20]); pts.push([c + .3, 100]); }
        else if (k === "bats") { jumps.push(arc(bt.s, .5, 16, 0, 0, .76), arc(c, .5, 14, 11.67)); pts.push([c, 200]); }
        else if (k === "bricks") { bt.h = 14; jumps.push([bt.s, .5, 14]); pts.push([c, 50]); }
        else if (k === "spring") { jumps.push(arc(bt.s, .32, 5, 0, 8), [c, .1, 0, u => 8 - 3 * Math.sin(u * Math.PI / 2)], arc(c + .1, 1.0, 44, 5, 0, 1, "spin")); for (let i = 0; i < 5; i++) pts.push([c + .24 + .18 * i, 10]); }
        else if (k === "pit") { jumps.push([bt.s, .7, 13]); for (let i = 0; i < 3; i++) pts.push([c - .18 + .18 * i, 10]); }
        else if (k === "pipe") jumps.push([bt.s, .66, 26]);
        else if (k === "cannon") { jumps.push(arc(bt.s, .5, 14, 0, 0, .76), arc(c, .62, 18, 10.21)); pts.push([c, 200]); }
        next = c + POST[k] + .3 + r() * .25;
      }
      if (L.bonus) { const B0 = L.bonus.t0, PHu = (pr ? 13 : 17) / S.jk; // onto the pipe, down it; up out of another, and off
        jumps.push(arc(B0 - .35, .35, 6, 0, PHu), [B0, .1, 0, () => PHu], [B0 + .1, .35, 0, k => PHu - (PHu + 16) * k], [B0 + .45, 2.15, 0, () => -16], [B0 + 2.6, .2, 0, k => -16 + (PHu + 16) * k], arc(B0 + 2.8, .4, 8, PHu, 0));
        for (let j = 0; j < L.bonus.n; j++) pts.push([B0 + .95 + .9 * (j + .5) / L.bonus.n, 50]); }
      // the power-up, met at 6.55: the star bouncing in, a block with a mushroom or a flower in it, a jetpack floating in
      const fly = u => { const t = u * 1.75, up = 12 + 16 * E.out(clamp(t / .35)), cruise = Math.sin(t * 5) * 3 * clamp(t / .35) * (1 - seg(t, 1.1, 1.5)); return (up + cruise) * (1 - E.io(seg(t, 1.1, 1.75))); };
      if (L.power === 3) { jumps.push(arc(6.3, .5, 12, 0, 0, .5), [6.55, 1.75, 0, fly]); for (let i = 0; i < 7; i++) pts.push([6.95 + .1 * i, 10]); }
      else if (L.power) jumps.push([5.92, .56, 16]);
      pts.push([6.55, 1000]);
      // the boss: three shots jumped, three hits, the burst; a hop to close
      jumps.push([9.4, .46, 12], [10.0, .46, 12], [10.6, .46, 12], [11.75, .44, 9]); pts.push([11.3, 5000]);
      L.jumps = jumps; L.pts = pts; L.beats = beats; L.lands = jumps.filter(j => !jumps.some(o => o !== j && Math.abs(o[0] - (j[0] + j[1])) < 1e-6)).map(j => j[0] + j[1]);
      // the storm's clouds cross the moon and are gone by the end; lightning once in the run and once as the boss arrives
      if (L.sky === 0) L.meteors = Array.from({ length: 7 }, (_, i) => { const big = i === 3, v = (pr ? 95 : 190) * (.85 + r() * .35), an = Math.PI * (.12 + r() * .1);
        return { t: 1.5 + i * 1.62 + r() * .9, x: bw * (pr ? .2 + r() * .9 : .5 + r() * .55), y: gy * (.02 + r() * (pr ? .16 : .26)), dx: -Math.cos(an) * v, dy: Math.sin(an) * v, life: big ? 1.1 : .55 + r() * .3, len: big ? (pr ? 16 : 26) : (pr ? 8 : 12) + r() * 6 }; });
      if (L.sky === 2) {
        L.clouds = [0, 1, 2, 0].map((i, j) => { const x0 = bw + 4 + j * (pr ? 18 : 44) + r() * 10, w = S.clouds[i].width; return { i, x0, v: (x0 + w + 10 + r() * 30) / 14.5, y: Math.round(gy * (.04 + r() * .2)) }; });
        L.bolts = [2.6 + r() * 2.6, 8.32].map(t => { const x0 = Math.round(bw * (pr ? .2 + r() * .6 : .5 + r() * .42)), y1 = gy - S.farH * .45, pts2 = [[x0, 0]]; let x = x0; for (let i = 1; i <= 9; i++) { x += Math.round((r() - .5) * (pr ? 6 : 10)); pts2.push([x, Math.round(y1 * i / 9)]); } return { t, pts: pts2 }; });
      }
      return L;
    },
    /** T: loop time; I: how idle (0 in use … 1 the loop); A: wall time; F: finale progress, or -1; P: the pass */
    draw(T, I, A, F, P = 0) {
      const { W, H, PS, bw, bh, gy, D, PF, PN, jk, pr } = S, on = I > .01;
      // glide to where the words leave room; the world's scroll, kept where it was if the loop is cut short (b381: by the
      // scroll of the pass drawn last — every level covers D, so the city rests where it began)
      if (S.lastT !== undefined && T < S.lastT - 1) S.base = ((S.base || 0) + S.lastX(S.lastT)) % (PF * PN * 16); S.lastT = T;
      const dt = S.lastA === undefined ? 0 : clamp(A - S.lastA, 0, .1); S.lastA = A; const glide = 1 - Math.exp(-dt * 3);
      S.heroX += (S.heroTx - S.heroX) * glide; S.bx += (S.btx - S.bx) * glide; S.by += (S.bty - S.by) * glide;
      const hx = Math.round(S.heroX), L = S.plan(P, hx), sig = L.sig, XF = L.X; S.lastX = XF;
      if (P !== S.bankP) S.bankTo(P, hx); S.bankL = L; S.bankT = T; // b397: the score carries on
      const X = (S.base || 0) + XF(T), wX = t => XF(t) - XF(T); // where a thing placed at loop time t is now, relative to then
      b.clearRect(0, 0, bw, bh); b.globalAlpha = 1;
      const put = (spr, x, y, a = 1, sx = 1, sy = 1) => { if (a <= .01) return; b.globalAlpha = clamp(a); const w = spr.width * sx, h = spr.height * sy; b.drawImage(spr, Math.round(x + (spr.width - w) / 2), Math.round(y + spr.height - h), Math.round(w), Math.round(h)); b.globalAlpha = 1; };
      const dot = (x, y, col, a = 1, s = 1) => { if (a <= .01) return; b.globalAlpha = clamp(a); b.fillStyle = col; b.fillRect(Math.round(x), Math.round(y), s, s); b.globalAlpha = 1; }; // and back to 1, or whatever is drawn next inherits it
      const txt = (s, x, y, col, a = 1, sc = 1, rainbow = false) => { if (a <= .01) return; const ph = rainbow ? Math.floor(A * 10) % 6 : -1, key = s + "|" + col + "|" + sc + "|" + ph; let c = S.tcache.get(key);
        if (!c) { const w = s.length * 6 * sc + 1, h = 7 * sc + 1; let x2; [c, x2] = canvas(w, h); [...s].forEach((ch, i) => { const gl = F5[ch]; if (!gl) return; const cc = rainbow ? NEON[(i + ph) % 6] : col; gl.forEach((row, j) => { for (let k = 0; k < 5; k++) if (row[k] === "#") { x2.fillStyle = "#0B0820"; x2.fillRect(i * 6 * sc + k * sc + 1, j * sc + 1, sc, sc); } }); gl.forEach((row, j) => { for (let k = 0; k < 5; k++) if (row[k] === "#") { x2.fillStyle = cc; x2.fillRect(i * 6 * sc + k * sc, j * sc, sc, sc); } }); }); if (S.tcache.size > 300) S.tcache.clear(); S.tcache.set(key, c); }
        b.globalAlpha = clamp(a); b.drawImage(c, Math.round(x), Math.round(y)); b.globalAlpha = 1; };
      const tw = (s, sc = 1) => s.length * 6 * sc - sc;
      const shadeB = (x, y, r = 6) => S.shade(x * PS, y * PS, r * PS);
      // b381: the level's sky — how far it has come in, its tint under everything, and how much it dims the stars
      const sk = sig ? 0 : L.sky, skyK = sk && on ? env(T, .15, 1.3, 13.1, 14.6) * I : 0, starA = 1 - (sk === 1 ? .7 : sk === 2 ? .75 : sk === 4 ? .35 : 0) * skyK;
      if (skyK > .01) { b.globalAlpha = skyK; b.fillStyle = S.skyG[sk]; b.fillRect(0, 0, bw, gy); b.globalAlpha = 1; }
      // the stars, twinkling
      if (starA < 1) b.globalAlpha = starA;
      [.04, .08].forEach((p, i) => { const o = -(((X * p) % bw) + bw) % bw; b.drawImage(S.starL[i], Math.round(o), 0); b.drawImage(S.starL[i], Math.round(o) + bw, 0); });
      b.globalAlpha = 1;
      const hz = S.hz && S.hz.length ? S.hz : null;
      if (hz) { // no star behind the small words: their zones cleared, the level's tint laid back, the stars at their edges put back fading
        b.globalCompositeOperation = "destination-out"; b.fillStyle = "#000"; for (const z of hz) b.fillRect(z[4], z[5], z[6] - z[4], z[7] - z[5]); b.globalCompositeOperation = "source-over"; // (an opaque fill: the level's tint, if it's the fill still, is clear up here)
        if (skyK > .01) { b.globalAlpha = skyK; b.fillStyle = S.skyG[sk]; for (const z of hz) b.fillRect(z[4], z[5], z[6] - z[4], z[7] - z[5]); b.globalAlpha = 1; }
        [.04, .08].forEach((p, i) => { const o = Math.round(-(((X * p) % bw) + bw) % bw); for (const st of S.hzStars[i]) { let x = o + Math.round(st.x); if (x < 0) x += bw; const y = Math.round(st.y), f = S.hzFade(x, y); if (f > 0 && f < 1) dot(x, y, ["#FFFFFF", "#9AE7FF", "#FF9AF0"][st.c], (.55 + .35 * ((st.ph * 7) % 1)) * starA * f); } });
      }
      for (const s of S.twinkle) { const x = ((s.x - X * s.p) % bw + bw) % bw, k = .45 + .55 * Math.pow(Math.max(0, Math.sin(A * s.f + s.ph)), 3); dot(x, s.y, ["#FFFFFF", "#9AE7FF", "#FF9AF0"][s.c], k * starA * (hz && s.hz ? S.hzFade(Math.round(x), Math.round(s.y)) : 1)); }
      // b381: behind the city — the sun going down, the storm's lightning and its clouds
      if (sk === 1 && skyK > .01) { const rise = S.sunHigh ? E.out(seg(T, 1.5, 3.0)) * (1 - E.io(seg(T, 10.9, 11.9))) : E.out(seg(T, .15, 1.9)) * (1 - E.io(seg(T, 12.8, 14.6))), R = S.sunR, [scx, scy] = S.sunC; b.globalAlpha = I * (S.sunHigh ? rise : 1); b.drawImage(S.sun, scx - R, Math.round(S.sunHigh ? scy - R + (1 - rise) * 8 : lerp(gy + 1, scy - R, rise))); b.globalAlpha = 1; }
      if (!sig && sk === 0 && on) for (const m of L.meteors) { const age = T - m.t; if (age <= 0 || age >= m.life) continue; // a shooting star: it lights, streaks and burns out
        const k = env(age, 0, .08, m.life - .22, m.life) * I, hx2 = m.x + m.dx * age, hy2 = m.y + m.dy * age, v = Math.hypot(m.dx, m.dy), ux = m.dx / v, uy = m.dy / v, n = Math.round(m.len * clamp(age / .15));
        for (let j = n; j >= 0; j--) { const x = hx2 - ux * j, y = hy2 - uy * j, a = k * (1 - j / (m.len + 1)) * shadeB(x, y, 5) * S.hzFade(Math.round(x), Math.round(y)); if (a < .03) continue; b.globalAlpha = a; b.fillStyle = j < 2 ? "#FFFFFF" : j < m.len * .45 ? "#9AE7FF" : "#FF9AF0"; b.fillRect(Math.round(x), Math.round(y), 1, 1); } b.globalAlpha = 1; }
      if (sk === 4 && on) { const k = env(T, .3, 2.4, 12.4, 14.5) * I; // the aurora: two curtains drifting apart, breathing
        if (k > .01) for (let i = 0; i < 2; i++) { const o = (((i ? -3.2 : 4.4) * A) % bw + bw) % bw, y = Math.round(gy * (i ? .13 : .05)); b.globalAlpha = k * (.6 + .3 * Math.sin(A * (.6 + .25 * i) + i * 2)); b.drawImage(S.aur[i], Math.round(o) - bw, y); b.drawImage(S.aur[i], Math.round(o), y); } b.globalAlpha = 1; }
      if (sk === 2 && on) {
        for (const bo of L.bolts) { const k = env(T, bo.t, bo.t + .02, bo.t + .1, bo.t + .3) * I; if (k < .02) continue;
          for (const [col, a, w] of [["#8FB8FF", .45, 3], ["#FFFFFF", 1, 1]]) { b.fillStyle = col; b.globalAlpha = k * a; for (let i = 1; i < bo.pts.length; i++) { const [x0, y0] = bo.pts[i - 1], [x1, y1] = bo.pts[i], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let j = 0; j <= n; j++) { const x = Math.round(lerp(x0, x1, j / n)), y = Math.round(lerp(y0, y1, j / n)); b.globalAlpha = k * a * shadeB(x, y, 6) * S.hzFade(x, y); b.fillRect(x - (w - 1) / 2, y, w, 1); } } } b.globalAlpha = 1; }
        for (const cl of L.clouds) { const c = S.clouds[cl.i], x = Math.round(cl.x0 - cl.v * T); if (x < bw && x + c.width > 0) { b.globalAlpha = I * .94; b.drawImage(c, x, cl.y); } } b.globalAlpha = 1;
      }
      // the city: the far layer, the near one with its flickering windows, antenna lights and the sign (b381: snow on the roofs)
      const capA = sk === 3 && on ? env(T, 2.5, 7.0, 12.4, 14.2) * I : 0;
      for (let x = -(((X * .2) % PF) + PF) % PF; x < bw; x += PF) { b.drawImage(S.far, Math.round(x), gy - S.farH); if (capA > .01) { b.globalAlpha = capA * .8; b.drawImage(S.farCap, Math.round(x), gy - S.farH); b.globalAlpha = 1; } }
      const nOff = -(((X * .5) % PN) + PN) % PN;
      for (let x = nOff; x < bw; x += PN) {
        b.drawImage(S.near, Math.round(x), gy - S.nearH);
        if (capA > .01) { b.globalAlpha = capA; b.drawImage(S.nearCap, Math.round(x), gy - S.nearH); b.globalAlpha = 1; }
        for (const w of S.wins) { const on2 = Math.sin(A * .7 + w.ph) > .82; if (on2) dot(x + w.x, gy - S.nearH + w.y, "#0E0927", 1, 1), dot(x + w.x, gy - S.nearH + w.y + 1, "#0E0927", 1, 1); }
        for (const a2 of S.antennas) dot(x + a2.x, gy - S.nearH + a2.y, "#FF3B5C", .4 + .6 * (Math.sin(A * 3 + a2.ph) > .3 ? 1 : 0));
        if (S.sign) { const flick = Math.sin(A * 23) > -.85 || Math.sin(A * 3.1) > .5 ? 1 : .25, sx2 = x + S.sign.x, sy2 = gy - S.nearH + S.sign.y; [..."ARCADE"].forEach((ch, i) => S.F3[ch].forEach((row, j) => { for (let k = 0; k < 3; k++) if (row[k] === "#") dot(sx2 + k, sy2 + i * 6 + j, i % 2 ? "#2BE8FF" : "#FF2BD6", flick); })); }
      }
      // speed lines while the star lasts (b381: and while the jetpack flies)
      const pow = on && (sig || L.power === 0) ? env(T, 6.55, 6.7, 8.9, 9.3) * I : 0, lines = Math.max(pow, !sig && on && L.power === 3 ? env(T, 6.6, 6.8, 7.7, 8.05) * I : 0);
      if (lines > .02) { const r2 = rng(Math.floor(A * 30)); for (let k = 0; k < 14; k++) { const y = 6 + r2() * (gy - 14), x = r2() * bw, l = 8 + r2() * 20; if (shadeB(x + l / 2, y, l / 2 + 4) < .95) continue; b.globalAlpha = lines * .55; b.fillStyle = NEON[k % 6]; b.fillRect(Math.round(x), Math.round(y), Math.round(l), 1); } b.globalAlpha = 1; }
      // the ground, scrolling
      for (let x = -((X % 16) + 16) % 16; x < bw; x += 16) b.drawImage(S.ground, Math.round(x), gy);
      // b381: the level's pits in it, and snow along its edge
      if (!sig) {
        if (capA > .01) { b.globalAlpha = capA; b.fillStyle = "#EEF4FF"; b.fillRect(0, gy - 1, bw, 1); for (let x = -((X % 16) + 16) % 16; x < bw; x += 16) { b.fillRect(Math.round(x) + 3, gy - 2, 3, 1); b.fillRect(Math.round(x) + 11, gy - 2, 2, 1); } b.globalAlpha = 1; }
        if (on) for (const bt of L.beats) if (bt.k === "pit") { const w = pr ? 16 : 24, x0 = Math.round(hx + 6 + wX(bt.c) - w / 2); if (x0 < bw && x0 + w > 0) { b.globalAlpha = I; b.fillStyle = "#04020C"; b.fillRect(x0, gy, w, bh - gy); b.fillStyle = "#2A1461"; b.fillRect(x0, gy + 3, 1, bh - gy - 3); b.fillRect(x0 + w - 1, gy + 3, 1, bh - gy - 3); b.fillStyle = "#FF8AE8"; b.fillRect(x0 - 1, gy, 1, 3); b.fillRect(x0 + w, gy, 1, 3); b.globalAlpha = 1; } }
      }
      // the neon edge dims under words that sit right on it (a long list's last lines), so they keep their contrast
      for (const [x0, y0, x1, y1] of S.wr || []) if (y1 > gy * PS - 70 && y1 < gy * PS + 12) { b.globalAlpha = .82; b.fillStyle = "#1C0D44"; b.fillRect(Math.floor(x0 / PS) - 2, gy, Math.ceil((x1 - x0) / PS) + 4, 3); b.globalAlpha = 1; }
      const top0 = gy - 15, tp = 6.55;
      let warn = 0, shake = 0, sc = "000000", flashL = 0;
      // the banners, in their panel: READY?, GO!, WARNING, HIGH SCORE!, and the finale's LEVEL CLEAR
      const panel = (s, a, sc2 = 1, col = "#FFFFFF", rainbow = false, drop2 = null) => {
        if (a <= .01) return; const w = tw(s, sc2), h = 7 * sc2, x0 = Math.round(S.bx - w / 2), y0 = Math.round(S.by - h / 2);
        b.globalAlpha = a * .82; b.fillStyle = "#0B0820"; b.fillRect(x0 - 5, y0 - 5, w + 10, h + 10); b.globalAlpha = 1;
        const per = 2 * (w + 10) + 2 * (h + 10); for (let q = 0; q < per; q += 2) { const lit = (q / 2 + Math.floor(A * 18)) % 3 === 0, qq = q; let xx, yy; if (qq < w + 10) { xx = x0 - 5 + qq; yy = y0 - 5; } else if (qq < w + 10 + h + 10) { xx = x0 + w + 4; yy = y0 - 5 + qq - (w + 10); } else if (qq < 2 * (w + 10) + h + 10) { xx = x0 + w + 4 - (qq - (w + 10 + h + 10)); yy = y0 + h + 4; } else { xx = x0 - 5; yy = y0 + h + 4 - (qq - (2 * (w + 10) + h + 10)); } dot(xx, yy, lit ? "#FFE14D" : "#FF2BD6", a * (lit ? 1 : .55)); }
        if (!drop2) txt(s, x0, y0, col, a, sc2, rainbow);
        else [...s].forEach((ch, i) => { const k = drop2(i); if (k <= 0) return; txt(ch, x0 + i * 6 * sc2, y0 - Math.round((1 - E.back(k)) * 24), rainbow ? NEON[(i + Math.floor(A * 10)) % 6] : col, a * clamp(k * 3), sc2); });
      };
      if (sig) {
        // ---- the signature: the first level, as it has always been ----
        // the hero's height above the ground at loop time t: its jumps, each [start, length, height]
        const JUMPS = [[1.2, .34, 5], [2.25, .62, 14], [3.6, .56, 16], [4.62, .52, 12], [5.04, .56, 18], [9.4, .46, 12], [10.0, .46, 12], [10.6, .46, 12], [11.75, .44, 9]];
        const jumpAt = t => { for (const [s, d, h] of JUMPS) if (t >= s && t < s + d) { const k = (t - s) / d; return { y: 4 * k * (1 - k) * h * jk, k, s, d }; } return null; };
        // coins in an arc, taken on the first jump
        if (on) for (let k = 0; k < 5; k++) { const tk = 2.25 + .62 * (.12 + .19 * k), sx2 = hx + 2 + wX(tk), jy = jumpAt(tk), y = top0 - (jy ? jy.y : 0) + 3;
          if (T < tk) { if (sx2 < bw + 8) put(S.coin[Math.floor(A * 10 + k) % 4], sx2, y + Math.round(Math.sin(A * 5 + k) * .6), I * shadeB(sx2, y)); }
          else if (T < tk + .45) { const p = (T - tk) / .45; for (let q = 0; q < 6; q++) { const a = q / 6 * TAU; dot(sx2 + 4 + Math.cos(a) * p * 7, y + 4 + Math.sin(a) * p * 7, "#FFE14D", I * (1 - p)); } txt("+10", sx2 - 3, y - 6 - p * 8, "#FFFFFF", I * (1 - p) * .9); } }
        // the block the hero heads, and the coin that spins out of it
        const tb = 3.88, bxs = hx + wX(tb), byk = top0 - 3 - Math.round(16 * jk) - 12;
        if (on && bxs > -14 && bxs < bw + 2) { const bump = env(T, tb, tb + .05, tb + .06, tb + .16) * 3; put(T < tb ? S.block : S.used, bxs, byk - bump, I * shadeB(bxs + 6, byk + 6, 8));
          const ck = seg(T, tb, tb + .7, x => x); if (ck > 0 && ck < 1) { const cy = byk - 9 - Math.sin(ck * Math.PI) * 16; put(S.coin[Math.floor(A * 20) % 4], bxs + 2, cy, I); if (ck > .75) txt("+100", bxs - 5, cy - 8, "#FFE14D", I); } }
        // the slime, hopping in, stomped flat, gone in a puff
        const ts = 4.62 + .52 * .8, sxs = hx + 1 + wX(ts) + 12 * (ts - T);
        if (on && T > 3.9 && T < ts + .9) {
          if (T < ts) { const hop = Math.abs(Math.sin(T * 7)), sq = hop < .15 ? 1.2 : 1; put(S.slime, sxs, gy - 8 - Math.round(hop * 4), I * shadeB(sxs + 5, gy - 6), sq, 2 - sq); }
          else if (T < ts + .5) put(S.flat, hx + 1 + wX(ts), gy - 3, I);
          else { const p = (T - ts - .5) / .4; for (let q = 0; q < 8; q++) { const a = q / 8 * TAU; dot(hx + 6 + wX(ts) + Math.cos(a) * p * 8, gy - 3 + Math.sin(a) * p * 4, "#7CFF6B", I * (1 - p)); } }
          if (T > ts && T < ts + .8) txt("+200", hx - 2 + wX(ts), gy - 26 - (T - ts) * 10, "#7CFF6B", I * (1 - seg(T, ts + .5, ts + .8))); }
        // the star, bouncing in
        const tp = 6.55, sxp = hx + 2 + wX(tp) + 20 * (tp - T);
        if (on && T > 5.6 && T < tp) put(S.star[Math.floor(A * 12) % 6], sxp, gy - 11 - Math.round(Math.abs(Math.sin((tp - T) * 8)) * 12), I);
        if (on && T >= tp && T < tp + .6) txt("+1000", hx - 6, top0 - 12 - (T - tp) * 12, "#FFFFFF", I * (1 - seg(T, tp + .3, tp + .6)), 1, true);
        // WARNING, and the edges pulsing red
        warn = on ? env(T, 7.9, 8.0, 8.8, 9.0) * I : 0;
        if (warn > .02) { const blink = Math.floor(A * 6) % 2; b.globalAlpha = warn * (blink ? .8 : .3); b.fillStyle = "#FF2B4E"; b.fillRect(0, gy - 1, bw, 1); b.fillRect(0, 0, 1, gy); b.fillRect(bw - 1, 0, 1, gy); b.globalAlpha = 1; }
        // the boss: down with a wobble, its eye on the hero; shots, lasers, hits; the burst
        const bossX = Math.round(Math.min(hx + (pr ? 34 : 40), bw - 31)), hover = gy - 30, drop = seg(T, 8.3, 9.0, E.back), dead = seg(T, 11.25, 11.3, x => x) >= 1;
        const HITS = [10.36, 10.96, 11.56].map(t => t - .5), SHOTS = [9.2, 9.8, 10.4];
        if (on && T > 8.3 && !dead) {
          const hitNow = HITS.some(t => T > t && T < t + .12), knock = HITS.reduce((m, t) => Math.max(m, env(T, t, t + .03, t + .06, t + .2) * 2), 0), dying = seg(T, 11.1, 11.3, x => x);
          const by2 = Math.round(lerp(-20, hover, drop) + Math.sin(A * 3) * 1.2), bx2 = bossX + Math.round(knock) + (dying > 0 ? Math.round((rng(Math.floor(A * 30) + 3)() - .5) * 3) : 0), a = I * shadeB(bx2 + 15, by2 + 8, 16); // b381: the dying shudder a jitter of the frame's time, not Math.random
          put(hitNow || (dying > 0 && Math.floor(A * 30) % 2) ? S.bossWhite : S.boss, bx2, by2, a);
          // its eye, its lights, its flames
          const ex = bx2 + 15 + (hx < bx2 ? -1 : 1), ey = by2 + 4; for (let q = -2; q <= 2; q++) for (let w = -2; w <= 2; w++) if (q * q + w * w <= 5) dot(bx2 + 15 + q, ey + w, "#FFFFFF", a); dot(ex - 1, ey - 1, "#FF2B5E", a, 2); dot(ex - 1, ey, "#FF2B5E", a, 2); dot(ex - (hx < bx2 ? 1 : 0), ey, "#0B0820", a);
          for (let k = 0; k < 7; k++) dot(bx2 + 3 + k * 4, by2 + 10, NEON[(k + Math.floor(A * 8)) % 3], a);
          for (const fx2 of [5, 11, 17, 23]) { const f = Math.floor(A * 20 + fx2) % 3; dot(bx2 + fx2, by2 + 16, f ? "#FFE14D" : "#FF7A3C", a, 2); if (f) dot(bx2 + fx2, by2 + 18, "#FF7A3C", a * .6, 2); }
          // its health, in three
          if (T > 9.0) { const hp = 3 - HITS.filter(t => T > t).length; b.globalAlpha = a; b.fillStyle = "#0B0820"; b.fillRect(bx2 - 1, by2 - 6, 32, 4); for (let k = 0; k < 3; k++) { b.fillStyle = k < hp ? "#FF2B5E" : "#3A1024"; b.fillRect(bx2 + k * 10, by2 - 5, 9, 2); } b.globalAlpha = 1; }
          if (T > 9.0 && T < 9.12) shake = 1.5;
          if (hitNow) shake = 1.2;
        }
        // its shots, which the hero jumps
        if (on && !dead) for (const t of SHOTS) { const k = seg(T, t, t + .7, x => x); if (k <= 0 || k >= 1) continue; const x = lerp(bossX + 2, hx - 26, k), y = gy - 7; dot(x - 1, y - 1, "#FF5A8A", I, 3); dot(x, y, "#FFFFFF", I); for (let q = 1; q < 4; q++) dot(x + q * 3, y, "#FF5A8A", I * (1 - q / 4)); }
        // the hero's lasers, and the sparks where they land
        if (on) for (const t of HITS) { const k = seg(T, t - .08, t + .1, x => x); if (k > 0 && k < 1) { b.globalAlpha = I * (1 - k); b.fillStyle = "#2BE8FF"; b.fillRect(hx + 12, gy - 9, bossX - hx - 10, 2); b.fillStyle = "#FFFFFF"; b.fillRect(hx + 12, gy - 9, bossX - hx - 10, 1); b.globalAlpha = 1; }
          const sp = seg(T, t, t + .3, x => x); if (sp > 0 && sp < 1) for (let q = 0; q < 8; q++) { const a = q / 8 * TAU + t; dot(bossX + 2 + Math.cos(a) * sp * 7, gy - 12 + Math.sin(a) * sp * 7, q % 2 ? "#FFFFFF" : "#2BE8FF", I * (1 - sp)); } }
        // the burst: a flash, a ring, pieces, +5000
        const boom = on ? seg(T, 11.25, 12.1, x => x) : 0;
        if (boom > 0 && boom < 1) { const cx = bossX + 15, cy = hover + 8, rr = E.out(boom) * 34;
          for (let q = 0; q < 48; q++) { const a = q / 48 * TAU; dot(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .7, q % 2 ? "#FFFFFF" : "#FF2BD6", I * (1 - boom)); }
          for (const p of S.bits) { const d = E.out(boom) * 30 * p.v; dot(cx + Math.cos(p.a) * d, cy + Math.sin(p.a) * d * .8 + boom * boom * 20, ["#DAD6F5", "#3FB8E0", "#FF2BD6", "#FFE14D"][p.c], I * (1 - boom), p.s); }
          if (boom < .2) shake = 2.5 * (1 - boom / .2);
          txt("+5000", cx - 14, cy - 18 - boom * 10, "#FFE14D", I * (1 - seg(boom, .7, 1)), 1, true); }
        // the hero: waiting, crouching, running, jumping; lit up by the star, its afterimages; the finale's jump with a trophy
        const jy = on ? jumpAt(T) : null, run = on && T > 1.2 && T < 8.6, spd = S.X(T + .05) - S.X(T);
        let spr = S.hIdle[Math.floor(A * 1.6) % 2], y = top0, sx = 1, sy = 1;
        if (!on && (A % 4.2) < .14) spr = S.hBlink;
        if (run && spd > .2) spr = S.hRun[Math.floor(A * (7 + spd * 3)) % 4];
        if (jy) { spr = S.hJump; y -= Math.round(jy.y * I); if (jy.k < .12) { sx = .88; sy = 1.14; } }
        else if (on && JUMPS.some(([s, d]) => T > s + d && T < s + d + .08)) { sx = 1.18; sy = .84; }
        if (on && T > .95 && T < 1.2) { sx = 1.16; sy = .82; }
        if (F >= 0) { const fj = seg(F, 0, .5, x => x); if (fj > 0 && fj < 1) { spr = S.hJump; y = top0 - Math.round(4 * fj * (1 - fj) * 26 * jk); } }
        if (pow > .02 && spr !== S.hIdle[0]) { const set = S.hGhost; for (let q = 3; q >= 1; q--) { const gi = spr === S.hJump ? 4 : S.hRun.indexOf(spr); if (gi < 0) continue; put(set[(q + Math.floor(A * 10)) % 6][gi], hx - q * 4, y, pow * .35 * (1 - q / 4)); } }
        const ha = shadeB(hx + 6, y + 7, 10);
        put(spr, hx, y, ha, sx, sy);
        if (pow > .02 && Math.floor(A * 16) % 2) { const gi = spr === S.hJump ? 4 : Math.max(0, S.hRun.indexOf(spr)); put(S.hGhost[Math.floor(A * 12) % 6][gi], hx, y, pow * .55 * ha, sx, sy); }
        dot(hx + 6, y - 2, "#9FB6DC", ha); dot(hx + 6, y - 3, "#9FB6DC", ha); dot(hx + 6, y - 4, "#FF2BD6", ha * (.5 + .5 * Math.sin(A * 4))); // its antenna, the light pulsing
        if (F >= 0 && F < .92) put(S.cup, hx + 3, y - 12, 1);
        // dust when it lands or sets off
        if (on) for (const [s, d] of [[1.2, .01], ...JUMPS.map(([s2, d2]) => [s2 + d2, 0])]) { const p = seg(T, s, s + .3, x => x); if (p > 0 && p < 1) for (const q of [-1, 1]) dot(hx + 6 + q * (3 + p * 6), gy - 2 - p * 3, "#B388FF", I * (1 - p)); }
        if (on && F < 0) {
          const ready = env(T, .3, .4, 1.0, 1.15) * I; if (ready > .02 && Math.floor(A * 5) % 3) panel("READY?", ready);
          const go = env(T, 1.2, 1.26, 1.7, 1.9) * I; if (go > .02) panel("GO!", go, 2, "#7CFF6B");
          if (warn > .02 && Math.floor(A * 6) % 2) panel("WARNING", warn, 1, "#FF2B4E");
          const hs = env(T, 12.0, 12.2, 13.8, 14.3) * I; if (hs > .02) panel("HIGH SCORE!", hs, 1, "#FFFFFF", true);
        }
      } else {
        // ---- a dealt level (b381) ----
        const U = D / 800, jumps = L.jumps, SH = [9.2, 9.8, 10.4], HT = [9.86, 10.46, 11.06];
        const jumpAt = t => { for (const j of jumps) if (t >= j[0] && t < j[0] + j[1]) { const k = (t - j[0]) / j[1]; return { y: (j[3] ? j[3](k) : 4 * k * (1 - k) * j[2]) * jk, k, j }; } return null; };
        const hY = t => { const q = jumpAt(t); return q ? q.y : 0; };
        const ring = (x, y, p, n, rad, col, a, sq = 1) => { if (p <= 0 || p >= 1) return; for (let q = 0; q < n; q++) { const an = q / n * TAU; dot(x + Math.cos(an) * p * rad, y + Math.sin(an) * p * rad * sq, col, a * (1 - p)); } };
        const float = (s, x, y, t0, col, dur = .8) => { if (T > t0 && T < t0 + dur) txt(s, x, y - (T - t0) * 10, col, I * (1 - seg(T, t0 + dur * .6, t0 + dur))); };
        // coins strung along the hero's path, taken as it passes through them
        const string = tks => tks.forEach((tk, k) => { const x = hx + 2 + wX(tk), y = Math.round(top0 - hY(tk) + 3);
          if (T < tk) { if (x < bw + 8 && x > -9) put(S.coin[Math.floor(A * 10 + k) % 4], x, y + Math.round(Math.sin(A * 5 + k) * .6), I * shadeB(x + 4, y + 4)); }
          else if (T < tk + .45) { const p = (T - tk) / .45; ring(x + 4, y + 4, p, 6, 7, "#FFE14D", I); txt("+10", x - 3, y - 6 - p * 8, "#FFFFFF", I * (1 - p) * .9); } });
        const pipeAt = (x0, top, pw, ph, a, down = false) => { const rim = down ? top + ph - 4 : top, b0 = down ? top : top + 4; b.globalAlpha = a;
          b.fillStyle = "#2FB84A"; b.fillRect(x0, b0, pw, ph - 4); b.fillStyle = "#7CFF6B"; b.fillRect(x0 + 2, b0, 2, ph - 4); b.fillStyle = "#16662A"; b.fillRect(x0 + pw - 2, b0, 1, ph - 4);
          b.fillRect(x0 - 1, rim, pw + 2, 4); b.fillStyle = "#3FD85A"; b.fillRect(x0, rim, pw, 3); b.fillStyle = "#D8FFD0"; b.fillRect(x0, down ? rim + 3 : rim, pw, 1); b.fillStyle = "#9CFF8E"; b.fillRect(x0 + 1, rim + 1, 2, 2); b.globalAlpha = 1; };
        // the run's obstacles
        if (on) for (const bt of L.beats) { const c = bt.c;
          if (bt.k === "coins") string(Array.from({ length: bt.n }, (_, k) => bt.s + bt.d * (.12 + .76 * k / (bt.n - 1))));
          else if (bt.k === "block" || bt.k === "oneup") { const hid = bt.k === "oneup", bxs = hx + wX(c), byk = top0 - 3 - Math.round(16 * jk) - 12, bump = env(T, c, c + .05, c + .06, c + .16) * 3;
            if (hid) { const u = seg(T, c, c + .5, x => x); if (u > 0 && u < 1) put(S.oneup, hx + 1, Math.round(u < .35 ? byk + 3 - u / .35 * 12 : lerp(byk - 9, top0 - 7, E.in((u - .35) / .65))), I); }
            if ((!hid || T >= c) && bxs > -14 && bxs < bw + 2) put(T < c ? S.block : S.used, bxs, byk - bump, I * shadeB(bxs + 6, byk + 6, 8));
            if (hid) { ring(bxs + 6, byk + 6, seg(T, c, c + .35, x => x), 10, 11, "#FFFFFF", I); if (T > c + .5 && T < c + 1.5) { const p = T - c - .5; txt("1UP", hx - 2, top0 - 12 - p * 14, "#7CFF6B", I * (1 - seg(p, .6, 1))); ring(hx + 6, top0 + 7, seg(T, c + .5, c + .9, x => x), 12, 13, "#7CFF6B", I); } }
            else { const ck = seg(T, c, c + .7, x => x); if (ck > 0 && ck < 1) { const cy = byk - 9 - Math.sin(ck * Math.PI) * 16; if (ck < .9) put(S.coin[Math.floor(A * 20) % 4], bxs + 2, cy, I); else ring(bxs + 6, cy + 4, (ck - .9) / .1, 6, 6, "#FFE14D", I); } float("+100", bxs - 5, byk - 22, c + .45, "#FFE14D"); } }
          else if (bt.k === "slime") { const sp = S.slimes[bt.v], xs = hx + 1 + wX(c) + 12 * U * (c - T);
            if (T < c) { if (xs < bw + 2) { const hop = Math.abs(Math.sin(T * 7)), sq = hop < .15 ? 1.2 : 1; put(sp.n, xs, gy - 8 - Math.round(hop * 4), I * shadeB(xs + 5, gy - 6), sq, 2 - sq); } }
            else if (T < c + .5) put(sp.f, hx + 1 + wX(c), gy - 3, I);
            else ring(hx + 6 + wX(c), gy - 3, (T - c - .5) / .4, 8, 8, sp.c, I, .5);
            float("+200", hx - 2 + wX(c), gy - 26, c, sp.c); }
          else if (bt.k === "shell") { const x = hx + wX(c) + 70 * U * (c - T);
            if (x > -14 && x < bw + 2) { put(S.shell[Math.floor(A * 14) % 2], x, gy - 8, I * shadeB(x + 6, gy - 4, 8)); dot(x + 13 + Math.floor(A * 20) % 2, gy - 2, "#FFA3BD", I * .45); }
            const al = env(T, c - .8, c - .74, c - .44, c - .36) * I; if (al > .02) txt("!", hx + 4, top0 - 11, "#FFE14D", al);
            float("+100", hx - 2, top0 - 30, c + .3, "#FFA3BD"); }
          else if (bt.k === "bats") { const fr = Math.floor(A * 10) % 2, y0 = gy - Math.round(64 * jk), yh = gy - Math.round(.73 * 16 * jk) - 1;
            if (T < c) { const u = seg(T, c - 1.4, c, x => x); if (u > 0) { const x = lerp(bw + 12, hx + 1, u), y = lerp(y0, yh, E.in(u)) - Math.sin(u * Math.PI * 2) * 5 * (1 - u); put(S.bat[fr], x, y, I * shadeB(x + 5, y + 3, 6)); } }
            else ring(hx + 6 + wX(c), yh + 3, seg(T, c, c + .4, x => x), 8, 8, "#A77BFF", I, .7);
            for (let j = 1; j <= 2; j++) { const u = seg(T, c - 1.35 + .22 * j, c + .9 + .3 * j, x => x); if (u <= 0 || u >= 1) continue; const a0 = (1 - u) * (1 - u), m = 2 * u * (1 - u), z = u * u, x = a0 * (bw + 12) + m * (hx + 8) + z * -14, y = a0 * (y0 - 8 * j) + m * (gy - 14 - 6 * j) + z * (y0 - 34 - 10 * j); put(S.bat[(fr + j) % 2], x, y, I * shadeB(x + 5, y + 3, 6)); }
            float("+200", hx - 2 + wX(c), yh - 14, c, "#B388FF"); }
          else if (bt.k === "bricks") { const bx0 = Math.round(hx + 2 + wX(c)) - 8, by0 = top0 - Math.round(bt.h * jk) - 10;
            for (let k = 0; k < 3; k++) { if (k === 1 && T >= c) continue; const x = bx0 + k * 8; if (x > -9 && x < bw + 1) put(S.brick, x, by0, I * shadeB(x + 4, by0 + 4, 6)); }
            if (T >= c && T < c + 1.6) { const t = T - c; for (let k = 0; k < 4; k++) { const hi = k < 2, dir = k % 2 ? 1 : -1, x = bx0 + 8 + (k % 2) * 4 + dir * (hi ? 20 : 32) * U * t, y = by0 + (hi ? 0 : 4) - (hi ? 72 : 50) * t + 200 * t * t; if (y < bh) put(S.chip[k % 2], x, y, I); } }
            float("+50", bx0 + 6, by0 - 9, c, "#FF9ADF"); }
          else if (bt.k === "spring") { const xs = Math.round(hx + 1 + wX(c)), t = T - c, hgt = t < 0 ? 8 : t < .1 ? 8 - 3 * Math.sin(t / .1 * Math.PI / 2) : 8 + 4 * Math.exp(-(t - .1) * 7) * Math.sin((t - .1) * 26);
            if (xs > -11 && xs < bw + 1) { const hh = Math.round(hgt); b.globalAlpha = I * shadeB(xs + 5, gy - 5, 8); b.fillStyle = "#58538A"; b.fillRect(xs, gy - 2, 10, 2); for (let y = gy - 3; y > gy - hh + 1; y--) { const o = (gy - y) % 2; b.fillStyle = o ? "#DAD6F5" : "#8F8AC0"; b.fillRect(xs + (o ? 1 : 2), y, o ? 8 : 6, 1); } b.fillStyle = "#FF2B4E"; b.fillRect(xs, gy - hh, 10, 1); b.fillStyle = "#8A0E33"; b.fillRect(xs, gy - hh + 1, 10, 1); b.globalAlpha = 1; }
            ring(xs + 5, gy - 9, (t - .1) / .3, 8, 9, "#FFE14D", I, .5);
            string([0, 1, 2, 3, 4].map(k => c + .24 + .18 * k)); }
          else if (bt.k === "pit") string([c - .18, c, c + .18]);
          else if (bt.k === "pipe") { const pw = pr ? 10 : 12, ph = pr ? 13 : 16, x0 = Math.round(hx + 6 + wX(c) - pw / 2);
            if (x0 > -pw - 3 && x0 < bw + 2) { const a = I * shadeB(x0 + pw / 2, gy - ph, 10), up = env(T, c - 1.2, c - .9, c - .62, c - .3); if (up > .01) put(S.plant[Math.floor(A * 4) % 2], x0 + Math.round(pw / 2) - 5, Math.round(lerp(gy - 12, gy - ph - 8, up)), a);
              pipeAt(x0, gy - ph, pw, ph, a); } }
          else if (bt.k === "cannon") { const ub = 90 * U, tc = c + .31, xc = Math.round(hx + 1 + wX(tc)), tf = c - (XF(tc) - XF(c)) / ub, yb = gy - Math.round(.73 * 14 * jk);
            if (xc > -11 && xc < bw + 1) put(S.cannon, xc, gy - 12, I * shadeB(xc + 5, gy - 6, 8));
            if (T >= tf && T < c) { const x = hx + 1 + XF(tc) - XF(T) - ub * (T - tf); if (x < bw + 1) put(S.bullet, x, yb, I * shadeB(x + 5, yb + 3, 6)); }
            else if (T >= c) { const t = T - c, y = yb + 40 * t + 220 * t * t; if (y < bh) put(S.bulletF, hx + 1 - (XF(T) - XF(c)) - 10 * U * t, y, I); }
            ring(xc - 1, gy - 9, seg(T, tf, tf + .35, x => x), 7, 6, "#9B96C8", I);
            const al = env(T, tf - .05, tf, tf + .25, tf + .33) * I; if (al > .02) txt("!", hx + 4, top0 - 11, "#FFE14D", al);
            float("+200", hx - 2, yb - 16, c, "#FFFFFF"); }
        }
        // the power-up, met at 6.55
        if (on) {
          if (L.power === 0) { const sxp = hx + 2 + wX(tp) + 20 * U * (tp - T); if (T < tp && sxp < bw + 2) put(S.star[Math.floor(A * 12) % 6], sxp, gy - 11 - Math.round(Math.abs(Math.sin((tp - T) * 8)) * 12 * jk), I); }
          else if (L.power === 3) { const jxp = hx - 1 + wX(tp) + 14 * U * (tp - T), jyp = top0 - Math.round(12 * jk) + 4 + Math.round(Math.sin(A * 5) * 1.5); if (T < tp && jxp < bw + 2) { put(S.jet, jxp, jyp, I * shadeB(jxp + 3, jyp + 4, 6)); for (let q = 0; q < 3; q++) { const an = A * 4 + q * TAU / 3; dot(jxp + 3 + Math.cos(an) * 6, jyp + 4 + Math.sin(an) * 6, "#2BE8FF", I * .8); } } }
          else { const tb = 6.2, bxs = hx + wX(tb), byk = top0 - 3 - Math.round(16 * jk) - 12, u = seg(T, tb, tp, x => x);
            if (u > 0 && u < 1) put(L.power === 1 ? S.shroom : S.flower, hx + 1, Math.round(u < .4 ? byk + 3 - u / .4 * 12 : lerp(byk - 9, top0 - 7, E.in((u - .4) / .6))), I);
            if (bxs > -14 && bxs < bw + 2) put(T < tb ? S.block : S.used, bxs, byk - env(T, tb, tb + .05, tb + .06, tb + .16) * 3, I * shadeB(bxs + 6, byk + 6, 8)); }
          if (T >= tp && T < tp + .6) txt("+1000", hx - 6, top0 - 12 - (T - tp) * 12, "#FFFFFF", I * (1 - seg(T, tp + .3, tp + .6)), 1, true);
        }
        // WARNING, and the edges pulsing red
        warn = on ? env(T, 7.9, 8.0, 8.8, 9.0) * I : 0;
        if (warn > .02) { const blink = Math.floor(A * 6) % 2; b.globalAlpha = warn * (blink ? .8 : .3); b.fillStyle = "#FF2B4E"; b.fillRect(0, gy - 1, bw, 1); b.fillRect(0, 0, 1, gy); b.fillRect(bw - 1, 0, 1, gy); b.globalAlpha = 1; }
        // the boss
        const bossX = Math.round(Math.min(hx + (pr ? 34 : 40), bw - 31)), hover = gy - 30, dead = T >= 11.3, dying = seg(T, 11.1, 11.3, x => x);
        const big = L.power === 1 && on ? 1 + (E.back(seg(T, tp, 7.0, x => x)) - E.io(seg(T, 12.35, 12.75))) * I : 1, ly = big > 1.5 ? gy - 18 : gy - 9, gun = hx + (big > 1.5 ? 20 : 12);
        const hitNow = HT.some(t => T > t && T < t + .12), knock = HT.reduce((m, t) => Math.max(m, env(T, t, t + .03, t + .06, t + .2) * 2), 0), jit = dying > 0 ? Math.round((rng(Math.floor(A * 30) + 3)() - .5) * 3) : 0, flick = hitNow || (dying > 0 && Math.floor(A * 30) % 2);
        let hpX = bossX + 2, hpY = gy - 12, bcx = bossX + 15, bcy = hover + 8;
        const health = (x, y, a) => { if (T <= 9.0) return; const hp = 3 - HT.filter(t => T > t).length; b.globalAlpha = a; b.fillStyle = "#0B0820"; b.fillRect(Math.round(x) - 1, Math.round(y), 32, 4); for (let k = 0; k < 3; k++) { b.fillStyle = k < hp ? "#FF2B5E" : "#3A1024"; b.fillRect(Math.round(x) + k * 10, Math.round(y) + 1, 9, 2); } b.globalAlpha = 1; };
        if (L.boss === 0) { // the saucer
          const drop = seg(T, 8.3, 9.0, E.back);
          if (on && T > 8.3 && !dead) {
            const by2 = Math.round(lerp(-20, hover, drop) + Math.sin(A * 3) * 1.2), bx2 = bossX + Math.round(knock) + jit, a = I * shadeB(bx2 + 15, by2 + 8, 16);
            put(flick ? S.bossWhite : S.boss, bx2, by2, a);
            const ex = bx2 + 15 + (hx < bx2 ? -1 : 1), ey = by2 + 4; for (let q = -2; q <= 2; q++) for (let w = -2; w <= 2; w++) if (q * q + w * w <= 5) dot(bx2 + 15 + q, ey + w, "#FFFFFF", a); dot(ex - 1, ey - 1, "#FF2B5E", a, 2); dot(ex - 1, ey, "#FF2B5E", a, 2); dot(ex - (hx < bx2 ? 1 : 0), ey, "#0B0820", a);
            for (let k = 0; k < 7; k++) dot(bx2 + 3 + k * 4, by2 + 10, NEON[(k + Math.floor(A * 8)) % 3], a);
            for (const fx2 of [5, 11, 17, 23]) { const f = Math.floor(A * 20 + fx2) % 3; dot(bx2 + fx2, by2 + 16, f ? "#FFE14D" : "#FF7A3C", a, 2); if (f) dot(bx2 + fx2, by2 + 18, "#FF7A3C", a * .6, 2); }
            health(bx2, by2 - 6, a);
            if (T > 9.0 && T < 9.12) shake = 1.5; if (hitNow) shake = 1.2;
          }
          if (on) for (const t of SH) { const k = (T - t) / .7; if (k <= 0) continue; const x = lerp(bossX + 2, hx - 26, k), y = gy - 7; if (x < -4) continue; dot(x - 1, y - 1, "#FF5A8A", I, 3); dot(x, y, "#FFFFFF", I); for (let q = 1; q < 4; q++) dot(x + q * 3, y, "#FF5A8A", I * (1 - q / 4)); }
        } else if (L.boss === 1) { // the robot: three heavy strides in, bombs bouncing at the hero, its head off at the end
          const u = seg(T, 8.3, 9.1, x => x), st = Math.min(2, Math.floor(u * 3)), f = u * 3 - st, moving = u > 0 && u < 1, stride = u >= 1 ? 1 : (st + E.io(f)) / 3;
          const rx0 = Math.round(lerp(bw + 2, bossX - 1, stride)), rx = rx0 + Math.round(knock) + jit, ry = gy - 30 - (moving ? Math.round(Math.sin(f * Math.PI)) : 0), lift = moving ? Math.round(Math.sin(f * Math.PI) * 2) : 0;
          for (let s2 = 1; s2 <= 3; s2++) { const tfall = 8.3 + .8 * s2 / 3; if (T > tfall && T < tfall + .08) shake = Math.max(shake, 1.2); if (on) ring(rx0 + (s2 % 2 ? 8 : 18), gy - 1, seg(T, tfall, tfall + .3, x => x), 8, 7, "#B388FF", I, .35); }
          hpX = rx + 5; bcx = rx + 13; bcy = ry + 14;
          if (on && T > 8.3 && !dead) {
            const a = I * shadeB(rx + 13, ry + 15, 18), leg = (x0, up) => { b.globalAlpha = a; b.fillStyle = flick ? "#FFFFFF" : "#9B96C8"; b.fillRect(x0 + 2, ry + 22 - up, 4, 4); b.fillStyle = flick ? "#FFFFFF" : "#58538A"; b.fillRect(x0, ry + 26 - up, 8, 3); b.fillStyle = flick ? "#FFFFFF" : "#2A2650"; b.fillRect(x0, ry + 29 - up, 8, 1); b.globalAlpha = 1; };
            leg(rx + 5, st % 2 ? 0 : lift); leg(rx + 14, st % 2 ? lift : 0);
            put(flick ? S.robotW : S.robot, rx, ry, a);
            if (!flick) { dot(rx + 13, ry, "#FF2B5E", a * (.5 + .5 * Math.sin(A * 6))); dot(rx + 9 + Math.floor(A * 10) % 9, ry + 6, "#FFFFFF", a * .9); }
            for (const t of SH) ring(rx - 1, ry + 18, seg(T, t, t + .12, x => x), 6, 4, "#FFE14D", I);
            health(rx - 2, ry - 7, a); if (hitNow) shake = 1.2;
            for (const [dx, dy, t] of [[6, 8, 11.1], [18, 14, 11.16], [11, 22, 11.22]]) ring(rx + dx, ry + dy, seg(T, t, t + .25, x => x), 8, 6, "#FFE14D", I);
          }
          if (on && T >= 11.25) { const t = T - 11.25, x = bossX + 7 + 45 * U * t, y = gy - 30 - 110 * t + 170 * t * t; if (x < bw + 1 && y < bh) put(Math.floor(t * 10) % 2 ? S.robotHeadF : S.robotHead, x, y, I); }
          if (on) for (const t of SH) { const k = (T - t) / .7; if (k <= 0) continue; const x = lerp(bossX - 3, hx - 26, k); if (x < -6) continue; const y = gy - 5 - Math.round(Math.abs(Math.sin(k * Math.PI * 2.5)) * 7 * Math.max(.35, 1 - k * .5)); put(S.bomb, x - 2, y, I); }
        } else if (L.boss === 2) { // the dragon: its body strung along the path its head has flown — swooping in, circling, lunging at the hero; it pops tail first
          const nS = pr ? 6 : 8, gap = pr ? 6 : 7, cx = Math.min(bossX + 4, bw - (pr ? 32 : 46)), cy = hover - (pr ? 8 : 12), rx = pr ? 10 : 18, ry = pr ? 6 : 9;
          const P0 = [bw + 30, gy - Math.round(100 * jk)], P1 = [cx + (pr ? 6 : 26), gy - Math.round(12 * jk)];
          const hp = S.hp || (S.hp = [0, 0]), head = (t, o = [0, 0]) => { if (t < 9.0) { const u = (t - 8.3) / .7; if (u < 0) { o[0] = P0[0] + 2 * (P1[0] - P0[0]) * u; o[1] = P0[1] + 2 * (P1[1] - P0[1]) * u; return o; } const a0 = (1 - u) * (1 - u), m = 2 * u * (1 - u), z = u * u; o[0] = a0 * P0[0] + m * P1[0] + z * cx; o[1] = a0 * P0[1] + m * P1[1] + z * cy; return o; }
            const w = t - 9.0; let dp = 0; for (const h of HT) dp = Math.max(dp, env(t, h - .36, h - .08, h + .02, h + .32)); o[0] = lerp(cx + rx * Math.sin(w * 1.8), Math.max(hx + (pr ? 18 : 28), cx - rx), dp); o[1] = lerp(cy + ry * Math.sin(w * 3.6), ly - 8, dp); return o; };
          // the body: a segment every `gap` pixels back along the way the head came (walked without making a thing a step)
          const body = S.dbody || (S.dbody = Array.from({ length: 8 }, () => [0, 0])); let nb = 0; { head(T, hp); let x0 = hp[0], y0 = hp[1], acc = 0; for (let t = T - .01; nb < nS && t > 7.2; t -= .01) { head(t, hp); acc += Math.hypot(hp[0] - x0, hp[1] - y0); x0 = hp[0]; y0 = hp[1]; while (nb < nS && acc >= gap * (nb + 1)) { body[nb][0] = x0; body[nb][1] = y0; nb++; } } }
          const pops = i => 11.02 + (nS - i) * (.2 / nS), [hxN, hyN] = head(T), hb = head(11.25);
          hpX = Math.round(hxN) + 1; hpY = Math.round(hyN) + 8; bcx = hb[0] + 10; bcy = hb[1] + 7;
          if (on && T > 8.3) {
            for (let i = nb; i >= 1; i--) { const sx2 = body[i - 1][0], sy2 = body[i - 1][1], t2 = pops(i); if (T >= t2) { ring(sx2 + 10, sy2 + 7, seg(T, t2, t2 + .3, x => x), 8, 8, i % 2 ? "#B388FF" : "#FF5AD9", I); continue; } if (sx2 > bw + 1 || sx2 < -14) continue; const sc3 = i === nS ? .66 : i === nS - 1 ? .82 : 1; put(S.dseg[i % 2], sx2 + 5, sy2 + 3, I * shadeB(sx2 + 10, sy2 + 7, 8), sc3, sc3); }
            if (!dead) { const open = SH.some(t => T > t - .15 && T < t + .14), a = I * shadeB(hxN + 10, hyN + 7, 10); put(flick ? S.dheadW[open ? 1 : 0] : S.dhead[open ? 1 : 0], hxN, hyN, a); health(hxN - 6, hyN - 7, a); if (hitNow) shake = 1.2; }
          }
          if (on) for (const t of SH) { const k = (T - t) / .7; if (k <= 0) continue; const [mx, my] = head(t), x = lerp(mx + 1, hx - 26, k); if (x < -5) continue; const y = k < .25 ? lerp(my + 10, gy - 5, (k / .25) * (k / .25)) : gy - 5 - Math.abs(Math.sin((k - .25) * Math.PI * 4)) * 3; dot(x - 1, y - 1, "#FF7A3C", I, 4); dot(x, y, "#FFE14D", I, 2); dot(x + 3, y - 1, "#FF7A3C", I * .55); dot(x + 5, y, "#FF2B4E", I * .3); }
        } else { // the slime king: two hops in, a slime spat at each shot, a wobble at each hit; four little slimes and a crown at the end
          const kx0 = bossX - 1; let kx = kx0, lift = 0;
          if (T < 8.66) { const u = seg(T, 8.3, 8.66, x => x); kx = lerp(bw + 4, kx0 + 16, u); lift = Math.sin(u * Math.PI) * 22 * jk; }
          else if (T < 8.72) kx = kx0 + 16;
          else if (T < 9.06) { const u = seg(T, 8.72, 9.06, x => x); kx = lerp(kx0 + 16, kx0, u); lift = Math.sin(u * Math.PI) * 14 * jk; }
          const land = Math.max(env(T, 8.66, 8.69, 8.7, 8.78), env(T, 9.06, 9.09, 9.1, 9.22)), spit = SH.reduce((m, t) => Math.max(m, env(T, t - .2, t - .06, t - .03, t + .06)), 0);
          const wob = HT.reduce((m, h) => m + (T > h ? Math.exp(-9 * (T - h)) * Math.sin((T - h) * 28) * .14 : 0), 0);
          const sqy = (1 - .25 * land - .16 * spit + wob + (T > 9.2 ? .03 * Math.sin(A * 5) : 0)) * (1 + .14 * dying), sqx = (1 + .25 * land + .12 * spit - wob) * (1 + .14 * dying);
          if (T > 9.06 && T < 9.14) shake = Math.max(shake, 1.5); if (T > 8.66 && T < 8.72) shake = Math.max(shake, .8);
          hpX = kx0 + 2; bcx = kx0 + 14; bcy = gy - 10;
          if (on && T > 8.3 && T < 11.25) { const a = I * shadeB(kx + 14, gy - 10, 16), yb = Math.round(gy - lift), x = Math.round(kx) + jit + Math.round(knock); put(flick ? S.kingW : S.king, x, yb - 20, a, sqx, sqy); put(S.crown, x + 10, yb - Math.round(20 * sqy) - 4, a); health(kx0 - 1, gy - 40, a); if (hitNow) shake = 1.2;
            for (const tl of [8.66, 9.06]) ring(kx0 + 14 + (tl < 9 ? 16 : 0), gy - 1, seg(T, tl, tl + .35, x2 => x2), 10, 12, "#7CFF6B", I, .3); }
          if (on) for (const t of SH) { const k = (T - t) / .7; if (k <= 0) continue; const x = lerp(kx0 - 8, hx - 26, k); if (x < -11) continue; put(S.slime, x, gy - 8 - Math.round(Math.abs(Math.sin(k * Math.PI * 3)) * 6), I); }
          if (on && T >= 11.25) { const t = T - 11.25; for (let m = 0; m < 4; m++) { const dir = m < 2 ? -1 : 1, x = kx0 + 9 + dir * (70 + 30 * (m % 2)) * U * t, y = gy - 8 - Math.round(Math.abs(Math.sin(t * 8 + m)) * (7 + 4 * (m % 2))); if (x > -11 && x < bw + 1) put(S.slime, x, y, I); } }
        }
        // the hero's answer — lasers, or with the flower, fireballs bouncing along — and the sparks where they land
        if (on) for (const t of HT) {
          if (L.power === 2) { const k = seg(T, t - .35, t, x => x); if (k > 0 && k < 1) { const x = lerp(gun, hpX, k), y = ly + 3 - Math.abs(Math.sin(k * Math.PI * 2)) * 9; dot(x - 1, y - 1, "#FF7A3C", I, 3); dot(x, y, "#FFE14D", I); dot(x - 3, y, "#FF7A3C", I * .5); } }
          else { const k = seg(T, t - .08, t + .1, x => x); if (k > 0 && k < 1 && hpX > gun) { b.globalAlpha = I * (1 - k); b.fillStyle = "#2BE8FF"; b.fillRect(gun, ly, hpX - gun, 2); b.fillStyle = "#FFFFFF"; b.fillRect(gun, ly, hpX - gun, 1); b.globalAlpha = 1; } }
          const sp = seg(T, t, t + .3, x => x); if (sp > 0 && sp < 1) for (let q = 0; q < 8; q++) { const an = q / 8 * TAU + t; dot(hpX + Math.cos(an) * sp * 7, hpY + Math.sin(an) * sp * 7, q % 2 ? "#FFFFFF" : L.power === 2 ? "#FF7A3C" : "#2BE8FF", I * (1 - sp)); }
        }
        // the burst: a ring, pieces, +5000, in the boss's colours
        const boom = on ? seg(T, 11.25, 12.1, x => x) : 0;
        if (boom > 0 && boom < 1) { const bu = BURST[L.boss], rr = E.out(boom) * 34;
          for (let q = 0; q < 48; q++) { const an = q / 48 * TAU; dot(bcx + Math.cos(an) * rr, bcy + Math.sin(an) * rr * .7, bu.ring[q % 2], I * (1 - boom)); }
          for (const p of S.bits) { const d2 = E.out(boom) * 30 * p.v; dot(bcx + Math.cos(p.a) * d2, bcy + Math.sin(p.a) * d2 * .8 + boom * boom * 20, bu.bits[p.c], I * (1 - boom), p.s); }
          if (boom < .2) shake = 2.5 * (1 - boom / .2);
          txt("+5000", bcx - 14, bcy - 18 - boom * 10, "#FFE14D", I * (1 - seg(boom, .7, 1)), 1, true); }
        // the hero: its jumps from the level's table, a somersault off the spring; big with the mushroom, in fire colours
        // with the flower, flying with the jetpack; wearing the slime king's crown
        const jy = on ? jumpAt(T) : null, run = on && T > 1.2 && T < 8.6, spd = XF(T + .05) - XF(T), fire = L.power === 2 && on && T >= 6.8 && T < 12.47, set = S.norm;
        let pick = st => st.idle[Math.floor(A * 1.6) % 2], y = top0, sx = 1, sy = 1, spin = false;
        if (!on && (A % 4.2) < .14) pick = () => S.hBlink;
        if (run && spd > .2) pick = st => st.run[Math.floor(A * (7 + spd * 3)) % 4];
        if (jy) { pick = st => st.jump; y -= Math.round(jy.y * I); if (jy.k < .12) { sx = .88; sy = 1.14; } if (jy.j[4] === "spin" && jy.k > .3 && jy.k < .6) { const f2 = Math.min(2, Math.floor((jy.k - .3) / .1)); pick = st => st.spin[f2]; spin = true; sx = sy = 1; } }
        else if (on && L.lands.some(t => T > t && T < t + .08)) { sx = 1.18; sy = .84; }
        if (on && T > .95 && T < 1.2) { sx = 1.16; sy = .82; }
        if (F >= 0) { const fj = seg(F, 0, .5, x => x); if (fj > 0 && fj < 1) { pick = st => st.jump; spin = false; y = top0 - Math.round(4 * fj * (1 - fj) * 26 * jk); } }
        const spr = pick(set), sprF = fire ? pick(S.fireSet) : null; // in the flower's colours, laid over the plain ones as the loop lets go
        const hide = !!(L.bonus && jy && jy.y < -.5); // down a warp pipe (and back at its post, fading in, if the loop lets go meanwhile)
        if (hide && I < 1) put(set.idle[0], hx, top0, shadeB(hx + 6, top0 + 7, 10) * (1 - I));
        if (pow > .02 && !spin && !hide && spr !== set.idle[0]) { for (let q = 3; q >= 1; q--) { const gi = spr === set.jump ? 4 : set.run.indexOf(spr); if (gi < 0) continue; put(S.hGhost[(q + Math.floor(A * 10)) % 6][gi], hx - q * 4, y, pow * .35 * (1 - q / 4)); } }
        const ha = shadeB(hx + 6, y + 7, 10), flying = L.power === 3 && on && T >= tp && T < 8.3, hTop = y + 15 - Math.round(15 * big);
        if (flying) put(S.jet, hx - 5, y + 4, ha * I);
        if (!hide) { const ox2 = hx + (spin ? Math.round((12 - spr.width) / 2) : 0), oy2 = y + (spin ? Math.round((15 - spr.height) / 2) : 0); put(spr, ox2, oy2, ha, sx * big, sy * big); if (sprF) put(sprF, ox2, oy2, ha * I, sx * big, sy * big); }
        if (pow > .02 && !spin && Math.floor(A * 16) % 2) { const gi = spr === set.jump ? 4 : Math.max(0, set.run.indexOf(spr)); put(S.hGhost[Math.floor(A * 12) % 6][gi], hx, y, pow * .55 * ha, sx, sy); }
        if (!spin && !hide) { const ab = Math.round(big), ax = hx + 6 - (ab > 1 ? 1 : 0); dot(ax, hTop - 2 * ab, "#9FB6DC", ha, ab); dot(ax, hTop - 3 * ab, "#9FB6DC", ha, ab); dot(ax, hTop - 4 * ab, "#FF2BD6", ha * (.5 + .5 * Math.sin(A * 4)), ab); }
        if (flying) { const fl = Math.floor(A * 16) % 2; dot(hx - 4, y + 13, fl ? "#FFE14D" : "#FF7A3C", ha * I, 2); dot(hx - 1, y + 13, fl ? "#FF7A3C" : "#FFE14D", ha * I, 2); dot(hx - 3 + fl, y + 15, "#FF7A3C", ha * .7 * I); }
        if (L.power === 3 && on && T > 6.6) { for (let q = Math.max(0, Math.floor((T - .5 - 6.6) / .07)); ; q++) { const te = 6.6 + q * .07; if (te > T || te >= 8.3) break; const age = T - te; if (age > .5) continue; dot(hx - 2 - (XF(T) - XF(te)) - age * 6, top0 - hY(te) + 17 + age * 8, age < .12 ? "#FFE14D" : "#9B96C8", I * (1 - age / .5) * .7, age > .2 ? 2 : 1); }
          if (T >= 8.3 && T < 8.9) { const t = T - 8.3; if (t < .22) put(S.jet, hx - 6 - t * 12, top0 + 4 + t * t * 120, I); else ring(hx - 5, gy - 5, (t - .22) / .38, 8, 7, "#9B96C8", I); } }
        if (L.power === 1 && on) { ring(hx + 6, top0 + 2, seg(T, tp, 6.95, x => x), 12, 16, "#FF2BD6", I); ring(hx + 6, top0 + 5, seg(T, 12.35, 12.8, x => x), 10, 14, "#FFFFFF", I); }
        if (L.power === 2 && on) { ring(hx + 6, y + 7, seg(T, 6.7, 7.05, x => x), 10, 12, "#FFE14D", I); ring(hx + 6, y + 7, seg(T, 12.4, 12.75, x => x), 10, 12, "#FF7A3C", I); }
        if (L.boss === 3 && on && T >= 11.25 && T < 14.35) { const t = T - 11.25, ho = T >= 12.15; let cx = hx + 1 + Math.round(4.5 * (big - 1)), cy = hTop - 4 * big;
          if (!ho) { const u = t / .9; cx = lerp(bossX + 9, cx, u); cy = lerp(gy - 26, cy, u) - Math.sin(u * Math.PI) * 26 * jk; }
          if (T < 13.9) put(!ho && Math.floor(T * 10) % 2 ? S.crownE : S.crown, ho ? cx : cx + (Math.floor(T * 10) % 2 ? 2 : 0), cy, I, ho ? big : 1, ho ? big : 1); else ring(cx + 4, cy + 2, seg(T, 13.9, 14.3, x => x), 8, 9, "#FFE14D", I); }
        if (sk === 3 && on) for (let q = 0; q < 12; q++) { const te = 1.6 + q * 1.05, age = T - te; if (age < 0 || age > .7) continue; dot(hx + 12 + age * 5 - (XF(T) - XF(te)) * .5, top0 - hY(te) + 5 - age * 5, "#FFFFFF", I * .55 * (1 - age / .7), age > .3 ? 2 : 1); } // its breath, in the cold
        if (F >= 0 && F < .92) put(S.cup, hx + 3, y - 12, 1);
        if (on) for (const s of [1.2, ...L.lands]) { const p = seg(T, s, s + .3, x => x); if (p > 0 && p < 1) for (const q of [-1, 1]) dot(hx + 6 + q * (3 + p * 6), gy - 2 - p * 3, "#B388FF", I * (1 - p)); }
        if (L.bonus && on) { const B0 = L.bonus.t0, pw = pr ? 10 : 12, PH = pr ? 13 : 17; // the warp pipes: down one, and up out of the next
          for (const tq of [B0, B0 + 2.8]) { const x0 = Math.round(hx + 6 + wX(tq) - pw / 2); if (x0 > -pw - 3 && x0 < bw + 2) pipeAt(x0, gy - PH, pw, PH, I * shadeB(x0 + pw / 2, gy - PH, 10)); } }
        // the weather, in front of it all: rain streaking down and splashing on the bricks; snow drifting down
        if (sk === 2 && on) {
          const v0 = (gy + 10) / .5, per = .78; b.fillStyle = "#A9C8FF";
          for (const d of S.drops) { const t0 = .45 + d.ph * per; if (T < t0) continue; const s = t0 + Math.floor((T - t0) / per) * per; if (s > 12.4) continue; const age = T - s, v = v0 * d.v, tg = (gy + 6) / v, x = Math.round(((d.x - (XF(T) - XF(s)) * .8 - age * 30 * U) % (bw + 30) + bw + 30) % (bw + 30) - 15);
            if (age < tg) { const y2 = Math.round(age * v - 6), hl = Math.floor(d.l / 2); b.globalAlpha = d.a * I * S.hzFade(x, y2); b.fillRect(x, y2, 1, d.l - hl); b.fillRect(x + 1, y2 - hl, 1, hl); }
            else if (age < tg + .07) { b.globalAlpha = d.a * I; b.fillRect(x - 1, gy - 1, 1, 1); b.fillRect(x + 1, gy - 1, 1, 1); b.fillRect(x, gy - 2, 1, 1); } }
          b.globalAlpha = 1;
          flashL = Math.max(...L.bolts.map(bo => env(T, bo.t, bo.t + .02, bo.t + .06, bo.t + .45))) * .1 * I;
        }
        if (sk === 3 && on) {
          for (const sz of [1, 2]) { b.fillStyle = sz === 1 ? "#BFD6FF" : "#FFFFFF";
            for (const f of S.flakes) { if (f.s !== sz) continue; const vs = (sz > 1 ? 46 : 36) * f.v * gy / 135, per = (gy + 6) / vs + .25, t0 = .3 + f.ph * per; if (T < t0) continue; const s = t0 + Math.floor((T - t0) / per) * per; if (s > 10.2) continue; const age = T - s, y2 = age * vs - 3; if (y2 > gy) continue;
              const x = ((f.x - (XF(T) - XF(s)) * (sz > 1 ? .75 : .45) + Math.sin(A * 1.3 + f.sw) * 3) % (bw + 20) + bw + 20) % (bw + 20) - 10; b.globalAlpha = f.a * I * S.hzFade(Math.round(x), Math.round(y2)); b.fillRect(Math.round(x), Math.round(y2), sz, sz); } }
          b.globalAlpha = 1;
        }
        if (L.bonus && on) { const B0 = L.bonus.t0, u = T - B0; // the bonus room, through an iris: dark, blue bricks, a trail of coins to run through
          if (u > .35 && u < 2.75) { const pw = pr ? 10 : 12, PH = pr ? 13 : 17, cy0 = gy - (pr ? 46 : 58), ex = pr ? 6 : Math.round(bw * .12), xx = bw - (pr ? 16 : 30), n = L.bonus.n;
            const rx = t => { const k = t - B0; return k < .95 ? ex + 1 : k < 1.85 ? lerp(ex + 1, xx - 13, (k - .95) / .9) : lerp(xx - 13, xx + 1, clamp((k - 1.85) / .25)); };
            const rh = t => { const k = t - B0; if (k < .95) return (gy - cy0 - 12) * (1 - Math.pow(clamp((k - .65) / .3), 2)); // down from the pipe in the ceiling, two jumps along the coins, up onto the way out and down it
              if (k < 1.85) { const q2 = (k - .95) / .9; return q2 > .08 && q2 < .44 ? 72 * ((q2 - .08) / .36) * (1 - (q2 - .08) / .36) * jk : q2 > .54 && q2 < .92 ? 88 * ((q2 - .54) / .38) * (1 - (q2 - .54) / .38) * jk : 0; }
              if (k < 2.1) { const q2 = (k - 1.85) / .25; return 32 * q2 * (1 - q2) + PH * q2; } return PH - (PH + 16) * clamp((k - 2.1) / .2); };
            if (u > .65 && u < 2.45) { b.globalAlpha = I; b.fillStyle = "#04030E"; b.fillRect(0, 0, bw, bh);
              for (let x = 0; x < bw; x += 16) { b.drawImage(S.groundB, x, gy); b.drawImage(S.groundB, 0, 3, 16, 8, x, cy0 - 8, 16, 8); } b.globalAlpha = 1;
              for (let j = 0; j < n; j++) { const tk = B0 + .95 + .9 * (j + .5) / n, x = rx(tk) + 2, yy = Math.round(gy - 15 - rh(tk) + 3); if (T < tk) put(S.coin[Math.floor(A * 10 + j) % 4], x, yy + Math.round(Math.sin(A * 5 + j) * .6), I); else if (T < tk + .45) { ring(x + 4, yy + 4, (T - tk) / .45, 6, 7, "#FFE14D", I); if (j % 3 === 1) txt("+50", x - 3, yy - 6 - (T - tk) * 16, "#FFFFFF", I * (1 - (T - tk) / .45) * .9); } }
              const h2 = rh(T); if (h2 > -.5) put(h2 > .5 ? S.norm.jump : S.norm.run[Math.floor(A * 11) % 4], Math.round(rx(T)), Math.round(gy - 15 - h2), I);
              pipeAt(ex, cy0, pw, 12, I, true); pipeAt(xx, gy - PH, pw, PH, I); }
            const R0 = Math.hypot(bw, bh), iris = (cx, cy, rr) => { b.globalAlpha = I; b.fillStyle = "#020108"; for (let yy = 0; yy < bh; yy++) { const dy = yy + .5 - cy; if (Math.abs(dy) >= rr) { b.fillRect(0, yy, bw, 1); continue; } const dx = Math.sqrt(rr * rr - dy * dy); b.fillRect(0, yy, Math.max(0, Math.round(cx - dx)), 1); b.fillRect(Math.round(cx + dx), yy, bw, 1); } b.globalAlpha = 1; };
            if (u < .65) iris(hx + 6, gy - PH, R0 * (1 - E.io(seg(u, .35, .65)))); else if (u < .95) iris(ex + pw / 2, cy0 + 10, R0 * E.io(seg(u, .65, .95)));
            else if (u > 2.2 && u < 2.45) iris(xx + pw / 2, gy - PH, R0 * (1 - E.io(seg(u, 2.2, 2.45)))); else if (u >= 2.45) iris(hx + 6, gy - PH, R0 * E.io(seg(u, 2.5, 2.75))); } }
        if (on && F < 0) {
          const lv = env(T, .3, .4, 1.0, 1.15) * I; if (lv > .02) panel("LEVEL " + (L.P + 1), lv);
          if (L.bonus) { const B0 = L.bonus.t0, bb = env(T, B0 + .95, B0 + 1.05, B0 + 1.85, B0 + 2.0) * I; if (bb > .02) panel("BONUS!", bb, 1, "#7CFF6B", true); }
          const go = env(T, 1.2, 1.26, 1.7, 1.9) * I; if (go > .02) panel("GO!", go, 2, "#7CFF6B");
          if (warn > .02 && Math.floor(A * 6) % 2) panel("WARNING", warn, 1, "#FF2B4E");
          const hs = env(T, 12.0, 12.2, 13.8, 14.3) * I; if (hs > .02) panel(ENDS[L.end], hs, 1, "#FFFFFF", true);
        }
      }
      if (F >= 0) {
        const a = 1 - seg(F, .88, 1); panel("LEVEL CLEAR", a, 1, "#FFFFFF", true, i => seg(F, .05 + i * .035, .17 + i * .035, x => x));
        for (const f of S.fire) { const k = seg(F, f.t, f.t + .55, x => x); if (k <= 0 || k >= 1) continue; const cx = S.bx + f.dx * 40, cy = S.by + f.dy * 16;
          if (k < .2) { dot(cx, cy + (1 - k / .2) * 20, "#FFFFFF", 1); dot(cx, cy + (1 - k / .2) * 20 + 2, "#FFE14D", .6); continue; }
          const q = (k - .2) / .8; for (const p of f.parts) { const d = E.out(q) * 14 * p.v; dot(cx + Math.cos(p.a) * d, cy + Math.sin(p.a) * d + q * q * 6, NEON[(f.c + (p.v > .8 ? 1 : 0)) % 6], (1 - q) * shadeB(cx, cy, 14)); } }
        for (const c of S.confetti) { const k = seg(F, .25 + c.d, 1, x => x); if (k <= 0 || k >= 1) continue; const x = c.x * bw + Math.sin(k * 12 + c.x * 30) * 2, yy = k * c.v * gy; dot(x, yy, NEON[c.c], (1 - k) * shadeB(x, yy, 3), c.w ? 2 : 1); }
      }
      // the score, on the bricks: the bank and what this level has scored so far (b397: it carries from level to level)
      const score = S.bank + (T > 0 ? S.earned(L, T) : 0); sc = String(score).padStart(6, "0"); S.lastInfo = { level: P + 1, score, bank: S.bank, boss: sig ? -1 : L.boss };
      txt(pr ? sc : "SCORE " + sc, bw - tw(pr ? sc : "SCORE " + sc) - 4, gy + (pr ? 3 : 5), "#FFE14D", 1);
      // under the words the moving picture is cut back, so the backdrop's dark sky is what's behind them (and the bloom with it)
      b.globalCompositeOperation = "destination-out"; for (const [x0, y0, x1, y1, k] of S.wr || []) { b.globalAlpha = k === 1 ? .7 : .4; b.fillRect(Math.floor(x0 / PS), Math.floor(y0 / PS), Math.ceil((x1 - x0) / PS) + 1, Math.ceil((y1 - y0) / PS) + 1); } b.globalCompositeOperation = "source-over"; b.globalAlpha = 1;
      // the frame: crisp, then bloom, then scanlines; a shake when things hit (a jitter of the frame's time — b381: it was
      // Math.random, so no two loads shook alike); a glitch at GO!, the burst and the finale
      if (F >= 0 && F < .05) shake = 2;
      if (!sig) shake *= I; // b381: a level's shakes ease away with it when the list is used
      const jr = shake ? rng(Math.floor(A * 30) + 7) : null, ox = shake ? Math.round((jr() - .5) * 2 * shake) * PS : 0, oy = shake ? Math.round((jr() - .5) * 2 * shake) * PS : 0;
      g.clearRect(0, 0, W, H); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
      if (sk === 1 && skyK > .01) { const [pc, x0, y0, w0, h0] = S.noMoon; g.globalAlpha = skyK; g.drawImage(pc, x0, y0, w0, h0); g.globalAlpha = 1; } // b381: at sunset the moon gives way
      g.imageSmoothingEnabled = false; g.drawImage(pb, ox, oy, bw * PS, bh * PS);
      g.imageSmoothingEnabled = true; g.globalCompositeOperation = "lighter";
      for (const [t, a] of [[S.tiny1, .42], [S.tiny2, .5]]) { const x = t.getContext("2d"); x.clearRect(0, 0, t.width, t.height); x.drawImage(pb, 0, 0, t.width, t.height); g.globalAlpha = a; g.drawImage(t, ox, oy, bw * PS, bh * PS); }
      g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
      const flash = Math.max(on ? env(T, tp, tp + .03, tp + .05, tp + .18) * .08 * I : 0, on ? env(T, 11.25, 11.27, 11.3, 11.5) * .14 * I : 0, F >= 0 ? env(F, 0, .02, .04, .16) * .12 : 0, flashL); // brief, and light: the words stay put
      if (flash > .01) { g.globalCompositeOperation = "lighter"; g.globalAlpha = flash; g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, W, H); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; }
      const glitch = (on && (sig || I > .5) && ((T > 1.2 && T < 1.32) || (T > 11.25 && T < 11.4))) || (F >= 0 && F < .05);
      if (glitch) { const r2 = rng(Math.floor(A * 40)); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); for (let k = 0; k < 5; k++) { const h = Math.round((2 + r2() * 6) * PS * px), y2 = Math.round(r2() * (g.canvas.height - h)), d = Math.round((r2() - .5) * 12 * PS * px); g.drawImage(g.canvas, 0, y2, g.canvas.width, h, d, y2, g.canvas.width, h); } g.restore(); }
      if (!S.scanPat) S.scanPat = g.createPattern(S.scan, "repeat"); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = S.scanPat; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
    },
  };
  return S;
}
