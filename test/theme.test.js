// Node tests for theme.js. Run: node test/theme.test.js
import assert from "node:assert/strict";
import {
  CURATED, CUSTOM_PAIRS, PAIRS, derive, surprise, report, themeCode, parseCode, pairFamilies,
  hexToOklch, oklch, contrast, cssText, normalizeHex, pickPair
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

test("12 curated themes, each a complete kit", () => {
  assert.equal(CURATED.length, 12);
  const ids = new Set(CURATED.map(t => t.id));
  assert.equal(ids.size, 12);
  for (const t of CURATED) {
    assert.ok(PAIRS[t.pair], t.id + " pair");
    assert.ok(["knock", "bell", "blip"].includes(t.sound.engine), t.id + " sound");
    assert.ok(t.confetti.length >= 4, t.id + " confetti");
    for (const k of ["ink", "ink2", "ink3", "text", "muted", "dim", "done", "muted2", "dim2", "accent", "accentHi", "accentDeep", "accentText", "danger", "hair", "hairHi", "hairSolid", "glow", "strikeShadow", "boxDoneBg", "strikeBg", "strikeAnim", "finaleStyle"]) assert.ok(t.colors[k], `${t.id} missing ${k}`);
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
  const c = derive({ accent: "#3366FF", base: "light", pair: "playfair", name: "Blue: sky" });
  const back = parseCode(themeCode(c));
  assert.equal(back.accent, "#3366FF"); assert.equal(back.base, "light"); assert.equal(back.pair, "playfair"); assert.equal(back.name, "Blue  sky");
  assert.equal(cssText(back), cssText(c));
  assert.equal(parseCode("garbage"), null);
  assert.equal(parseCode("T1:d:zzzzzz:lato:x"), null);
  assert.ok(parseCode("T1:d:abc:nope:Short").pair, "3-digit hex and unknown pair fall back sanely");
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
  for (const v of ["--ink:", "--text:", "--accent:", "--dim-2:", "--muted-2:", "--font-task:", "--task-w:", "--strike-anim:", "color-scheme:dark"]) assert.ok(css.includes(v), v);
  assert.equal((css.match(/--ink:/g) || []).length, 1);
});

console.log(`\n${passed} theme tests passed`);
