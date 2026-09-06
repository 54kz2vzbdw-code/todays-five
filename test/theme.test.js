// Node tests for theme.js. Run: node test/theme.test.js
import assert from "node:assert/strict";
import {
  CURATED, CUSTOM_PAIRS, PAIRS, derive, surprise, report, themeCode, parseCode, pairFamilies,
  hexToOklch, oklch, contrast, cssText, normalizeHex, pickPair, PACK_IDS, hueSound,
  CURATED_DAY, CURATED_NIGHT, curated, partnerOf, makePartner, SLOT_DEFAULT, scheduledSlot, autoSlot, activeSlot, slotCode,
  flipSlot, settleHold, setSwitchMode, migrateSlots, mixHex, cssTextBetween,
  SECRET, SECRET_IDS, isSecretTheme, isSecretCode, isSecretKey
} from "../theme.js";
import fs from "node:fs";

let passed = 0;
function test(name, fn) { fn(); passed++; console.log("ok -", name); }

let seed = 4242;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

const THRESH = { text: 7, muted: 4.5, dim: 4.5, accentText: 4.5, accent: 3, hairSolid: 3, danger: 4.5, muted2: 4.5, dim2: 4.5 };
function check(t, label) {
  const r = report(t);
  for (const k of Object.keys(THRESH)) assert.ok(r[k] >= THRESH[k] - 1e-9, `${label}: ${k} ${r[k].toFixed(2)} < ${THRESH[k]}`);
}

test("colour round trip: hex → oklch → hex within 1/255", () => {
  for (const hex of ["#D26128", "#FF3D9A", "#1A1D21", "#FAF8F4", "#000000", "#FFFFFF", "#7FB3FF", "#123456"]) {
    const o = hexToOklch(hex);
    const back = oklch(o.L, o.C, o.h);
    const a = hex.slice(1).match(/../g).map(x => parseInt(x, 16)), b = back.slice(1).match(/../g).map(x => parseInt(x, 16));
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(a[i] - b[i]) <= 1, `${hex} → ${back}`);
  }
});

test("out-of-gamut oklch is mapped by dropping chroma, never NaN", () => {
  for (let i = 0; i < 200; i++) {
    const hex = oklch(rnd(), rnd() * 0.5, rnd() * 360);
    assert.match(hex, /^#[0-9A-F]{6}$/);
  }
  assert.equal(oklch(0.5, 0, 0).length, 7);
});

test("16 curated themes, each a complete kit (the fourteen on offer and the Secret pair)", () => {
  assert.equal(CURATED.length, 16);
  const ids = new Set(CURATED.map(t => t.id));
  assert.equal(ids.size, 16);
  for (const t of CURATED) {
    assert.ok(PAIRS[t.pair], t.id + " pair");
    assert.ok(["knock", "bell", "blip", "typewriter", "marble", "pop", "sparkle", "party"].includes(t.sound.engine), t.id + " sound");
    assert.ok(t.confetti.length >= 4, t.id + " confetti");
    for (const k of ["ink", "ink2", "ink3", "text", "muted", "dim", "done", "muted2", "dim2", "accent", "accentHi", "accentDeep", "accentText", "danger", "hair", "hairHi", "hairSolid", "glow", "strikeShadow", "boxDoneBg", "barBg", "strikeBg", "strikeAnim", "finaleStyle"]) assert.ok(t.colors[k], `${t.id} missing ${k}`);
  }
});

test("dark, light, pink keep v1's primary tokens exactly", () => {
  const d = CURATED.find(t => t.id === "dark").colors, l = CURATED.find(t => t.id === "light").colors, p = CURATED.find(t => t.id === "pink").colors;
  assert.deepEqual([d.ink, d.ink2, d.ink3, d.text, d.muted, d.accent, d.accentHi, d.accentDeep, d.accentText, d.danger], ["#1A1D21", "#23272C", "#2E343A", "#F5F1EA", "#9AA0A8", "#D26128", "#E8814A", "#A34A1C", "#E8814A", "#E0745A"]);
  assert.deepEqual([l.ink, l.ink2, l.ink3, l.text, l.accent, l.accentHi, l.accentDeep, l.accentText, l.danger], ["#FAF8F4", "#F1ECE3", "#E4DED2", "#494F55", "#CB6015", "#E07B33", "#9E4A10", "#9E4A10", "#B8402A"]);
  assert.deepEqual([p.ink, p.ink2, p.ink3, p.text, p.muted, p.dim, p.done, p.accent, p.accentHi, p.accentDeep, p.accentText, p.danger], ["#2E0A1C", "#421029", "#58163A", "#FFF0F6", "#F2A8C8", "#C97A9E", "#C97A9E", "#FF3D9A", "#FFD36E", "#C2185B", "#FF3D9A", "#FF6B8A"]);
  assert.equal(p.strikeAnim, "shimmer 3.4s linear infinite");
  assert.equal(p.boxDoneBg, "linear-gradient(135deg,#FF3D9A,#FFD36E)");
  assert.equal(CURATED.find(t => t.id === "pink").shapes, 3);
  assert.deepEqual(CURATED.find(t => t.id === "pink").confetti, ["#FF3D9A", "#FF8FBE", "#FFD36E", "#FFFFFF", "#FF6FAF", "#FFB8D9"]);
});

test("1.7: every curated kit's accent text and danger clear 4.5:1 and its accent 3:1 on the elevated surface too (the originals keep their tokens)", () => {
  for (const t of CURATED) {
    if (["dark", "light", "pink"].includes(t.id)) continue;
    const c = t.colors;
    assert.ok(contrast(c.accentText, c.ink3) >= 4.5, t.id + " accentText on ink-3: " + contrast(c.accentText, c.ink3).toFixed(2));
    assert.ok(contrast(c.danger, c.ink3) >= 4.5 && contrast(c.danger, c.ink2) >= 4.5, t.id + " danger on ink-2/3: " + contrast(c.danger, c.ink2).toFixed(2));
    assert.ok(contrast(c.accent, c.ink3) >= 3, t.id + " accent (the focus ring) on ink-3: " + contrast(c.accent, c.ink3).toFixed(2));
  }
});

test("best-fit sound packs: Paper types, Forest drops marbles, Harbor pops, the originals keep theirs", () => {
  const eng = id => CURATED.find(t => t.id === id).sound.engine;
  assert.equal(eng("paper"), "typewriter"); assert.equal(eng("forest"), "marble"); assert.equal(eng("harbor"), "pop");
  assert.equal(eng("dark"), "knock"); assert.equal(eng("light"), "knock"); assert.equal(eng("pink"), "bell"); assert.equal(eng("terminal"), "blip");
});

test("every curated theme meets the contrast floors", () => {
  for (const t of CURATED) check(t, t.id);
});

test("custom derivation meets the floors for 2000 random accents on both bases", () => {
  for (let i = 0; i < 2000; i++) {
    const hex = "#" + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, "0");
    const base = i % 2 ? "light" : "dark";
    const t = derive({ accent: hex, base });
    check(t, `${hex}/${base}`);
    assert.ok(CUSTOM_PAIRS.includes(t.pair), "auto pair from the custom set");
    // background is tinted, not flat grey, whenever the accent has chroma
    const ink = hexToOklch(t.colors.ink), acc = hexToOklch(hex);
    if (acc.C > 0.05) assert.ok(ink.C > (base === "dark" ? 0.011 : 0.0075), `${hex}/${base} ink is flat grey (C=${ink.C.toFixed(4)})`);
  }
});

test("surprise me always passes and stays inside the tasteful ranges", () => {
  for (let i = 0; i < 500; i++) {
    const t = surprise(rnd);
    check(t, "surprise " + t.accent);
    const o = hexToOklch(t.accent);
    assert.ok(o.C >= 0.09 && o.C <= 0.21, "chroma " + o.C.toFixed(3));
    if (t.base === "dark") assert.ok(o.L >= 0.62 && o.L <= 0.83, "dark L " + o.L);
    else assert.ok(o.L >= 0.4 && o.L <= 0.62, "light L " + o.L);
  }
});

test("codes round-trip for curated and custom themes", () => {
  for (const t of CURATED) assert.equal(parseCode(themeCode(t)).id, t.id);
  for (const t of CURATED) assert.equal(themeCode(t), "T1:curated:" + t.id, "curated codes are unchanged, so every device reads them");
  const c = derive({ accent: "#3366FF", base: "light", pair: "playfair", name: "Blue: sky" });
  const back = parseCode(themeCode(c));
  assert.equal(back.accent, "#3366FF"); assert.equal(back.base, "light"); assert.equal(back.pair, "playfair"); assert.equal(back.name, "Blue  sky");
  assert.equal(cssText(back), cssText(c));
  assert.equal(parseCode("garbage"), null);
  assert.equal(parseCode("T1:d:zzzzzz:lato:x"), null);
  assert.ok(parseCode("T1:d:abc:nope:Short").pair, "3-digit hex and unknown pair fall back sanely");
});

test("a theme you make carries a sound pack: T2 codes round-trip, T1 codes still import and get the hue rule", () => {
  assert.deepEqual(PACK_IDS, ["knock", "bell", "blip", "typewriter", "marble", "pop", "kalimba", "pencil", "whistle", "bongo", "cork", "arcade"]); // 1.5: six more
  const m = derive({ accent: "#3366FF", base: "dark", pair: "grotesk", name: "Marbles", pack: "marble" });
  assert.equal(m.pack, "marble"); assert.equal(m.sound.engine, "marble"); assert.ok(m.sound.pitch > 0 && m.sound.decay > 0, "the accent still sets pitch and decay");
  const code = themeCode(m);
  assert.equal(code, "T2:d:3366FF:grotesk:marble:Marbles");
  const back = parseCode(code);
  assert.equal(back.pack, "marble"); assert.equal(back.sound.engine, "marble"); assert.equal(back.name, "Marbles"); assert.equal(cssText(back), cssText(m));
  assert.equal(themeCode(parseCode(code)), code, "byte-identical after a round trip");
  // no pack chosen: the hue rule (blue rings a bell, orange knocks), and the code says so with an empty field
  const auto = derive({ accent: "#3366FF", base: "dark", pair: "grotesk", name: "Auto" });
  assert.equal(auto.pack, ""); assert.equal(auto.sound.engine, "bell"); assert.equal(themeCode(auto), "T2:d:3366FF:grotesk::Auto");
  assert.equal(parseCode(themeCode(auto)).sound.engine, "bell"); assert.equal(hueSound("#D26128", "dark"), "knock"); assert.equal(hueSound("#3366FF", "light"), "bell");
  // a code from before 1.1 imports as it always did: the hue rule picks the sound
  const old = parseCode("T1:d:FF3D9A:fraunces:Pink one");
  assert.ok(old); assert.equal(old.pack, ""); assert.equal(old.sound.engine, "bell"); assert.equal(old.name, "Pink one"); assert.equal(old.pair, "fraunces");
  assert.equal(parseCode("T1:l:D26128:lato:Warm").sound.engine, "knock");
  // an unknown pack falls back to the hue rule; a name with colons survives
  assert.equal(parseCode("T2:d:D26128:lato:kazoo:X").sound.engine, "knock");
  assert.equal(parseCode("T2:d:D26128:lato:pop:A:B").name, "A:B");
  assert.equal(parseCode("T3:d:D26128:lato:pop:X"), null, "a code from the future is refused, not misread");
});

test("normalizeHex", () => {
  assert.equal(normalizeHex(" #abc "), "#AABBCC");
  assert.equal(normalizeHex("ff3d9a"), "#FF3D9A");
  assert.equal(normalizeHex("#12345"), null);
});

test("every family a pair names is self-hosted: declared in styles.css and present in fonts/", () => {
  const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  const files = new Set(fs.readdirSync(new URL("../fonts", import.meta.url)));
  assert.deepEqual(pairFamilies("lato"), ["Lato", "PT Sans"]);
  assert.deepEqual(pairFamilies("manrope"), ["Manrope"]);
  for (const id of Object.keys(PAIRS)) for (const fam of pairFamilies(id)) {
    const faces = [...css.matchAll(new RegExp('@font-face\\{font-family:"' + fam.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '";[^}]*\\}', "g"))].map(m => m[0]);
    assert.ok(faces.length >= 1, fam + " has no @font-face in styles.css");
    for (const f of faces) {
      assert.ok(/font-display:swap/.test(f), fam + " must use font-display: swap");
      assert.ok(/unicode-range:U\+0000-00FF/.test(f), fam + " must be the latin subset");
      const file = f.match(/url\(fonts\/([^)]+)\)/)[1];
      assert.ok(files.has(file), fam + ": missing " + file);
    }
  }
  assert.ok(!/googleapis|gstatic/.test(css), "no Google Fonts left in the stylesheet");
});

test("pair auto-pick varies with base and warmth", () => {
  const picks = new Set([pickPair("dark", "#FF3D9A"), pickPair("dark", "#D26128"), pickPair("dark", "#7FB3FF"), pickPair("light", "#D26128"), pickPair("light", "#0F8C8C")]);
  assert.ok(picks.size >= 4);
});

test("cssText contains every token once and a color-scheme", () => {
  const css = cssText(CURATED[0]);
  for (const v of ["--ink:", "--text:", "--accent:", "--dim-2:", "--muted-2:", "--font-task:", "--task-w:", "--bar-bg:", "--strike-anim:", "color-scheme:dark"]) assert.ok(css.includes(v), v);
  assert.equal((css.match(/--ink:/g) || []).length, 1);
});

/* ---------------- 1.2: Day and Night ---------------- */

test("every curated theme leans day or night and names a partner that names it back; the pairs are the designed ones", () => {
  for (const t of CURATED) {
    assert.ok(t.lean === "day" || t.lean === "night", t.id + " lean");
    const p = partnerOf(t);
    assert.ok(p && p.id !== t.id, t.id + " has a partner");
    assert.equal(p.partner, t.id, t.id + "'s partner names it back");
    assert.notEqual(p.lean, t.lean, t.id + " and " + p.id + " lean different ways");
  }
  const pairs = CURATED_DAY.map((d, i) => d.id + "↔" + CURATED_NIGHT[i].id);
  assert.deepEqual(pairs, ["light↔dark", "paper↔midnight", "harbor↔forest", "blush↔pink", "teletype↔terminal", "sunset↔dusk", "cocoa↔ember"]);
  assert.equal(CURATED_DAY.length + CURATED_NIGHT.length + SECRET.length, CURATED.length, "every kit is in exactly one group");
  assert.ok(CURATED_DAY.every(t => !t.secret) && CURATED_NIGHT.every(t => !t.secret), "the Secret pair is in neither of the two open groups");
  assert.ok(CURATED_DAY.every(t => t.lean === "day") && CURATED_NIGHT.every(t => t.lean === "night"));
  assert.equal(partnerOf(derive({ accent: "#3366FF" })), null, "a theme you make has no curated partner");
});

test("the two new kits reach the curated bar and share their partner's DNA: Blush is Pink's day, Teletype is Terminal's day", () => {
  const blush = curated("blush"), pink = curated("pink"), tele = curated("teletype"), term = curated("terminal");
  check(blush, "blush"); check(tele, "teletype");
  assert.equal(blush.base, "light"); assert.equal(blush.pair, pink.pair); assert.equal(blush.sound.engine, "bell"); assert.equal(blush.shapes, 3); assert.ok(blush.confetti.length >= 5);
  assert.equal(blush.colors.strikeAnim, pink.colors.strikeAnim, "the same shimmer strike as Pink");
  assert.equal(tele.base, "light"); assert.equal(tele.pair, term.pair); assert.equal(tele.sound.engine, "blip"); assert.ok(tele.sound.pitch < 1, "a lower, softer blip"); assert.ok(tele.confetti.length >= 5);
  for (const t of [blush, tele]) assert.equal(themeCode(t), "T1:curated:" + t.id, "a curated code like any other");
  const ink = hexToOklch(blush.colors.ink); assert.ok(ink.L > 0.95 && ink.h > 330, "blush paper: very light, pink-leaning");
});

test("the partner of a theme you make: same accent and pack, flipped base, a chosen pair kept and an automatic one re-picked; it round-trips", () => {
  const m = derive({ accent: "#3366FF", base: "dark", pair: "grotesk", name: "Marbles", pack: "marble" });
  const p = makePartner({ ...m, pairChosen: true });
  assert.equal(p.base, "light"); assert.equal(p.accent, "#3366FF"); assert.equal(p.pack, "marble"); assert.equal(p.sound.engine, "marble"); assert.equal(p.pair, "grotesk"); assert.equal(p.name, "Marbles · day");
  assert.equal(themeCode(p), "T2:l:3366FF:grotesk:marble:Marbles · day");
  assert.equal(cssText(parseCode(themeCode(p))), cssText(p), "the saved code rebuilds the same tokens");
  const back = makePartner({ ...p, pairChosen: true });
  assert.equal(back.base, "dark"); assert.equal(back.name, "Marbles · night"); assert.equal(cssText(back), cssText(derive({ accent: "#3366FF", base: "dark", pair: "grotesk", name: "x", pack: "marble" })), "the partner's partner is the original palette");
  const auto = makePartner({ accent: "#3366FF", base: "dark", pair: "", pack: "", name: "Auto", pairChosen: false });
  assert.equal(auto.pair, pickPair("light", "#3366FF"), "an automatic pair is picked again for the new base"); assert.equal(auto.pack, ""); assert.equal(themeCode(auto), "T2:l:3366FF:" + auto.pair + "::Auto · day");
  check(p, "partner light"); check(back, "partner dark");
  for (const t of CURATED) assert.equal(themeCode(t), "T1:curated:" + t.id, "curated codes unchanged by 1.2");
  assert.equal(themeCode(parseCode("T2:d:3366FF:grotesk:marble:Marbles")), "T2:d:3366FF:grotesk:marble:Marbles", "T2 codes unchanged by 1.2");
});

/* ---------------- 1.6: the Secret pair ---------------- */

test("the Secret pair reaches the curated bar: two complete kits, partners of each other, in neither open group", () => {
  const [sp, bd] = SECRET;
  assert.deepEqual(SECRET_IDS, ["superpink", "birthday"]);
  check(sp, "superpink"); check(bd, "birthday");                       // the same floors as every other kit
  assert.equal(sp.base, "dark"); assert.equal(bd.base, "light");
  assert.equal(sp.partner, "birthday"); assert.equal(bd.partner, "superpink");
  assert.equal(partnerOf(sp).id, "birthday"); assert.equal(partnerOf(bd).id, "superpink");
  assert.notEqual(sp.lean, bd.lean, "one leans day, the other night, so the sun and moon flip between them");
  for (const t of SECRET) {
    assert.ok(isSecretTheme(t), t.id + " is marked secret");
    assert.equal(themeCode(t), "T1:curated:" + t.id, "a curated code like any other, so a slot holding one reloads");
    assert.equal(parseCode(themeCode(t)).id, t.id);
    assert.ok(isSecretCode(themeCode(t)));
    assert.ok(PAIRS[t.pair] && !CUSTOM_PAIRS.includes(t.pair), t.id + ": its own pair, and not one the builder offers");
    assert.ok(Array.isArray(t.shapes) && t.shapes.length, t.id + " draws its own shapes");
    assert.ok(t.finaleText && /[.!?]$/.test(t.finaleText), t.id + " carries its own finale line");
    assert.ok(t.confetti.length >= 5, t.id + " confetti");
    assert.ok(!CURATED_DAY.includes(t) && !CURATED_NIGHT.includes(t), t.id + " is not in the open groups");
  }
  assert.equal(sp.sound.engine, "sparkle"); assert.equal(bd.sound.engine, "party");
  assert.ok(!PACK_IDS.includes("sparkle") && !PACK_IDS.includes("party"), "their engines are not offered to a theme you make, so a T2 code means the same thing on every device");
  assert.equal(sp.field, "sparkle"); assert.equal(bd.field, undefined, "only Superpink carries a background layer");
  assert.equal(sp.finale, "bloom"); assert.equal(bd.finale, "cake");
  // pink to the maximum the derivation allows: a deeper, more saturated ink than Pink's, and text that still reads
  const ink = hexToOklch(sp.colors.ink), pink = hexToOklch(curated("pink").colors.ink);
  assert.ok(ink.C > pink.C, "a more saturated ink than Pink's: " + ink.C.toFixed(3) + " vs " + pink.C.toFixed(3));
  assert.ok(ink.L < 0.25 && ink.h > 330, "deep, and tinted toward the accent");
  assert.ok(report(sp).text >= 7 && report(bd).text >= 7);
  assert.ok(/gradient/.test(sp.colors.barBg) && /gradient/.test(bd.colors.barBg), "each names its own progress bar");
  assert.ok(/gradient/.test(sp.colors.strikeBg) && sp.colors.strikeAnim !== "none", "Superpink's strike shimmers");
  assert.ok(/repeating-linear-gradient/.test(bd.colors.strikeBg), "Birthday's strike is a candy stripe");
});

test("every other kit keeps the default progress bar, and it is the fallback styles.css paints the first frame with", () => {
  for (const t of CURATED) if (!isSecretTheme(t)) assert.equal(t.colors.barBg, "linear-gradient(90deg,var(--accent-deep),var(--accent) 55%,var(--accent-hi))", t.id);
  assert.equal(derive({ accent: "#3366FF" }).colors.barBg, curated("dark").colors.barBg, "a theme you make too");
  const css = fs.readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.ok(css.includes("var(--bar-bg,linear-gradient(90deg,var(--accent-deep),var(--accent) 55%,var(--accent-hi)))"), "styles.css repeats it as the fallback");
});

test("the key is a key, not a theme code: trimmed, case-insensitive, and parseCode has never heard of it", () => {
  assert.equal(isSecretKey("superpink"), true);
  assert.equal(isSecretKey("SUPERPINK"), true);
  assert.equal(isSecretKey("  SuperPink\n"), true);
  assert.equal(isSecretKey("super pink"), false, "the space is not it");
  assert.equal(isSecretKey("superpin"), false); assert.equal(isSecretKey("superpinks"), false);
  assert.equal(isSecretKey(""), false); assert.equal(isSecretKey(null), false); assert.equal(isSecretKey(42), false);
  assert.equal(parseCode("superpink"), null, "typed on its own it is not a theme code");
  assert.equal(parseCode("T1:curated:superpink").id, "superpink", "the theme's own code still parses, so a slot survives a reload");
  for (const t of CURATED) assert.equal(isSecretKey(themeCode(t)), false, t.id + ": no code is ever mistaken for the key");
  assert.equal(isSecretCode("T1:curated:pink"), false); assert.equal(isSecretCode("nonsense"), false);
  // nothing else a person might plausibly type collides with it
  const words = ["pink", "superpink!", "super-pink", "SuperPink1", "birthday", "secret", "sparkle", "party", "todays-five", "open sesame", "T2:d:FF3D9A:fraunces:bell:Superpink"];
  for (const w of words) assert.equal(isSecretKey(w), false, w);
});

const at = s => new Date(s);
const DARK = { systemDark: true, now: at("2026-09-05T15:00:00") }, LIGHT = { systemDark: false, now: at("2026-09-05T15:00:00") };

test("migration: a by-hand device keeps its theme in the slot matching its base, the other slot gets the partner", () => {
  const dev = { theme: "T1:curated:pink", darkSlot: "T1:curated:dark", lightSlot: "T1:curated:light", follow: false, schedule: { on: false, dayAt: "07:00", nightAt: "19:00", day: "T1:curated:light", night: "T1:curated:dark" }, tourDone: true };
  assert.equal(migrateSlots(dev, { returning: true, env: DARK }), true);
  assert.equal(dev.switch.mode, "hand"); assert.equal(dev.night, "T1:curated:pink"); assert.equal(dev.day, "T1:curated:blush"); assert.equal(dev.slot, "night");
  assert.equal(slotCode(dev, DARK), "T1:curated:pink", "no visual change"); assert.equal(slotCode(dev, LIGHT), "T1:curated:pink", "by hand ignores the system");
  assert.equal(dev.theme, "T1:curated:pink", "the old key is untouched"); assert.equal(dev.follow, false); assert.equal(dev.schedule.on, false);
  assert.equal(migrateSlots(dev, { returning: true, env: DARK }), false, "runs once");
  // a light theme lands in Day; a custom theme's other slot gets that side's default
  const l = { theme: "T1:curated:paper", tourDone: true }; migrateSlots(l, { returning: true, env: DARK });
  assert.equal(l.slot, "day"); assert.equal(l.day, "T1:curated:paper"); assert.equal(l.night, "T1:curated:midnight"); assert.equal(slotCode(l, DARK), "T1:curated:paper");
  const c = { theme: "T2:d:3366FF:grotesk:marble:Marbles", tourDone: true }; migrateSlots(c, { returning: true, env: DARK });
  assert.equal(c.night, "T2:d:3366FF:grotesk:marble:Marbles"); assert.equal(c.day, SLOT_DEFAULT.day); assert.equal(slotCode(c, LIGHT), "T2:d:3366FF:grotesk:marble:Marbles");
});

test("migration: Follow system becomes With the system with both slots carried over; the theme on screen does not change", () => {
  const dev = { theme: "T1:curated:midnight", follow: true, darkSlot: "T1:curated:midnight", lightSlot: "T1:curated:harbor", schedule: { on: false, dayAt: "07:00", nightAt: "19:00" } };
  migrateSlots(dev, { returning: true, env: DARK });
  assert.equal(dev.switch.mode, "system"); assert.equal(dev.day, "T1:curated:harbor"); assert.equal(dev.night, "T1:curated:midnight"); assert.equal(dev.holdAuto, null);
  assert.equal(slotCode(dev, DARK), "T1:curated:midnight", "dark system: what Follow system showed"); assert.equal(slotCode(dev, LIGHT), "T1:curated:harbor", "light system: likewise");
  const bare = { follow: true }; migrateSlots(bare, { returning: true, env: LIGHT }); assert.equal(bare.day, SLOT_DEFAULT.day); assert.equal(bare.night, SLOT_DEFAULT.night, "missing slots get the defaults 1.1 used");
});

test("migration: the schedule becomes On a schedule with its themes and times; the clock decides as before", () => {
  const dev = { theme: "T1:curated:harbor", follow: false, schedule: { on: true, dayAt: "08:00", nightAt: "18:30", day: "T1:curated:harbor", night: "T1:curated:forest" } };
  migrateSlots(dev, { returning: true, env: DARK });
  assert.equal(dev.switch.mode, "schedule"); assert.equal(dev.switch.dayAt, "08:00"); assert.equal(dev.switch.nightAt, "18:30"); assert.equal(dev.day, "T1:curated:harbor"); assert.equal(dev.night, "T1:curated:forest");
  assert.equal(slotCode(dev, { now: at("2026-09-05T15:00:00") }), "T1:curated:harbor"); assert.equal(slotCode(dev, { now: at("2026-09-05T18:30:00") }), "T1:curated:forest"); assert.equal(slotCode(dev, { now: at("2026-09-05T07:59:00") }), "T1:curated:forest");
  assert.equal(scheduledSlot({ dayAt: "22:00", nightAt: "06:00" }, at("2026-09-05T23:00:00")), "day", "a schedule that wraps midnight");
  assert.equal(scheduledSlot({ dayAt: "22:00", nightAt: "06:00" }, at("2026-09-05T07:00:00")), "night");
  assert.equal(scheduledSlot({ dayAt: "x", nightAt: "06:00" }), "day", "junk times mean day");
});

test("a fresh device: Light by day, Dark by night, with the system, so the first open matches the device", () => {
  const dev = {}; assert.equal(migrateSlots(dev, { returning: false, env: DARK }), true);
  assert.equal(dev.switch.mode, "system"); assert.equal(dev.day, "T1:curated:light"); assert.equal(dev.night, "T1:curated:dark");
  assert.equal(slotCode(dev, DARK), "T1:curated:dark"); assert.equal(slotCode(dev, LIGHT), "T1:curated:light");
  const d2 = { theme: "T1:curated:dark" }; migrateSlots(d2, { returning: false, env: LIGHT }); assert.equal(d2.switch.mode, "system", "the default theme key 1.1 wrote on first load does not make a device a returning one");
});

test("the hold rule: a manual flip under an automation holds until the automation next switches, then it resumes", () => {
  const dev = { day: "D", night: "N", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }, slot: "day", holdAuto: null };
  assert.equal(activeSlot(dev, DARK), "night");
  flipSlot(dev, DARK);                                            // the user wants Day on a dark system
  assert.equal(activeSlot(dev, DARK), "day"); assert.equal(dev.holdAuto, "night"); assert.equal(slotCode(dev, DARK), "D");
  assert.equal(settleHold(dev, DARK), false, "still dark: the hold stands");
  assert.equal(settleHold(dev, LIGHT), true, "the system went light: the hold is spent"); assert.equal(dev.holdAuto, null);
  assert.equal(activeSlot(dev, LIGHT), "day"); assert.equal(activeSlot(dev, DARK), "night", "and the automation is back in charge");
  flipSlot(dev, DARK); flipSlot(dev, DARK);                       // flip away and back
  assert.equal(dev.holdAuto, null, "flipping back to what the automation wants holds nothing"); assert.equal(activeSlot(dev, DARK), "night");
  // the same under a schedule, with the clock moving
  const s = { day: "D", night: "N", switch: { mode: "schedule", dayAt: "07:00", nightAt: "19:00" }, slot: "day", holdAuto: null };
  const noon = { now: at("2026-09-05T12:00:00") }, evening = { now: at("2026-09-05T19:00:00") };
  flipSlot(s, noon); assert.equal(activeSlot(s, noon), "night"); assert.equal(s.holdAuto, "day");
  assert.equal(activeSlot(s, evening), "night", "still night when the schedule catches up"); assert.equal(settleHold(s, evening), true);
  assert.equal(activeSlot(s, { now: at("2026-09-06T08:00:00") }), "day", "the next morning the schedule switches as usual");
  // by hand there is nothing to hold
  const h = { day: "D", night: "N", switch: { mode: "hand" }, slot: "day" }; flipSlot(h, DARK); assert.equal(h.slot, "night"); assert.equal(h.holdAuto, null); assert.equal(activeSlot(h, LIGHT), "night");
  assert.equal(autoSlot(h, DARK), null);
});

test("the switch: turning an automation off keeps what is on; turning one on forgets a hold", () => {
  const dev = { day: "D", night: "N", switch: { mode: "system", dayAt: "07:00", nightAt: "19:00" }, slot: "day", holdAuto: "night" };
  assert.equal(activeSlot(dev, DARK), "day", "held on Day");
  setSwitchMode(dev, "hand", DARK); assert.equal(dev.switch.mode, "hand"); assert.equal(dev.slot, "day"); assert.equal(dev.holdAuto, null); assert.equal(activeSlot(dev, LIGHT), "day");
  setSwitchMode(dev, "schedule", { now: at("2026-09-05T23:00:00") }); assert.equal(dev.switch.mode, "schedule"); assert.equal(dev.switch.dayAt, "07:00"); assert.equal(activeSlot(dev, { now: at("2026-09-05T23:00:00") }), "night");
  setSwitchMode(dev, "nonsense", DARK); assert.equal(dev.switch.mode, "schedule", "an unknown mode is ignored");
});

test("the crossfade: colours interpolate in OKLab, the rest swaps at the midpoint, the ends are the themes themselves", () => {
  assert.equal(mixHex("#000000", "#FFFFFF", 0), "#000000"); assert.equal(mixHex("#000000", "#FFFFFF", 1), "#FFFFFF");
  const mid = hexToOklch(mixHex("#000000", "#FFFFFF", 0.5)); assert.ok(mid.L > 0.45 && mid.L < 0.55, "perceptual midpoint " + mid.L);
  const a = curated("light"), b = curated("dark");
  assert.equal(cssTextBetween(a, b, 0), cssText(a)); assert.equal(cssTextBetween(a, b, 1), cssText(b));
  const q = cssTextBetween(a, b, 0.3), h = cssTextBetween(a, b, 0.7);
  const ink = css => css.match(/--ink:(#[0-9A-F]{6})/)[1];
  assert.ok(ink(q) !== a.colors.ink && ink(q) !== b.colors.ink, "an in-between ink");
  assert.ok(hexToOklch(ink(q)).L > hexToOklch(ink(h)).L, "darker as it goes");
  assert.ok(q.includes("color-scheme:light") && q.includes("--strike-shadow:none"), "before the midpoint: the first theme's fonts, scheme and shadows");
  assert.ok(h.includes("color-scheme:dark") && h.includes("--strike-shadow:0 0 10px"), "after it: the second's");
  assert.ok(/--hair:rgba\(\d+,\d+,\d+,0\.\d+\)/.test(q), "rgba hairlines interpolate too");
  for (const t of [0.1, 0.5, 0.9]) assert.equal((cssTextBetween(a, b, t).match(/--ink:/g) || []).length, 1);
});

console.log(`\n${passed} theme tests passed`);
