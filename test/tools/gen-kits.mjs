// test/tools/gen-kits.mjs — writes test/fixtures/kits.json, the single source of truth for the kit
// table on the Apple side: the KitsGen plugin generates Swift from it, and both suites read it.
// Run: node test/tools/gen-kits.mjs
//
// Why a fixture at all, when theme.js is right there. **A build-time generator cannot parse
// theme.js.** 62 of the 314 hex tokens in the finished table appear nowhere in the source — every kit
// has at least one — because they come out of finalize() → ensure() → oklch(): cube roots, a
// 14-iteration gamut search, WCAG contrast and a 60-step lightness loop. Reimplementing that in a
// Swift plugin and matching JavaScript doubles bit for bit is the forbidden second copy of the
// palette in its worst form. And node is genuinely unreachable from an Xcode build
// (`/usr/bin/env -i /bin/sh -c 'command -v node'` exits 1). So: this generator runs by hand, and the
// drift is caught by a test rather than by a build step — see `expr` below.
//
// Modelled on gen-vectors.mjs, including its **refusal to write**: a fixture that can be regenerated
// into a worse state than the one it replaced is not a source of truth. Nothing is written unless
// there are 18 kits, exactly 2 of them secret, and every kit clears its own grounds.
import assert from "node:assert/strict";
import fs from "node:fs";
import { CURATED, PAIRS, CURATED_DAY, CURATED_NIGHT, SECRET_IDS, SLOT_DEFAULT, contrast } from "../../theme.js";

/* ---------------- the mapping, written down once ----------------

   The fixture is CURATED with two fields made regular, and nothing else: `shapes` is always an array
   of ints (kits spell it `1` or `[1,2,3]`) and `secret` is always a bool (open kits omit it). Both
   are for the readers — a Swift decoder should not have to know that one field is sometimes a
   number, and "is this kit secret" should never be a question about whether a key exists.

   The source of that mapping goes into the fixture as `expr`, and `KitFixtureTests.swift` evaluates
   **it** against live theme.js in a JSContext rather than a copy of its own. That is deliberate: the
   alternative is three lines of JavaScript duplicated in a Swift test file, where a change here
   would break a test that a person then "fixes" by editing the copy. One definition, carried beside
   the data it produced. */
const normalizeKit = t => ({ ...t, shapes: Array.isArray(t.shapes) ? t.shapes : [t.shapes], secret: t.secret === true });

/** The whole table as the fixture holds it, as a JavaScript expression over theme.js's own globals.
    Evaluated by the Swift drift test; evaluated here only in the sense that the same function runs. */
const EXPR = `({ kits: CURATED.map(${String(normalizeKit)}), pairs: PAIRS })`;

const kits = CURATED.map(normalizeKit);

/** The 16 tokens that are really `#RRGGBB`. The other ten in `colors` are CSS — two rgba() strings,
    a gradient, a shadow, three that are a hex *or* a gradient, two animation parameters and a
    font-style keyword — and what a reader can do with those is its own business, not this file's. */
const HEX_TOKENS = ["ink", "ink2", "ink3", "text", "muted", "dim", "done", "accent", "accentHi",
  "accentDeep", "accentText", "danger", "hairSolid", "muted2", "dim2", "done2"];

/** The floors every kit clears **on its own grounds** — which is the point of the round: until 1.13
    the accent was one brand hex measured against four fixed grounds, and now each kit answers for
    itself. `--ink` is the page and `--ink-3` the elevated surface (panels, filled chips, a hovered
    star), and text that clears the floor on only one of them disappears on the other. These are the
    floors finalize() actually enforces, so a failure here means theme.js moved, not that the table
    needs a new exemption.

    `danger` against `--ink-3` is **not** in this table, and that is a stated gap rather than an
    oversight: light and pink are exempt from finalize()'s nudging (ORIGINAL in theme.js), and
    `light.danger` #B8402A measures 4.12 there. Track A of this round raises it. This generator does
    not gate on another branch's commit; when the fix lands the number simply gets better and the
    line can be added here in the same breath. */
const FLOORS = [
  ["text",       "ink",  7],
  ["muted",      "ink",  4.5],
  ["dim",        "ink",  4.5],
  ["done",       "ink",  4.5],
  ["muted2",     "ink3", 4.5],
  ["dim2",       "ink3", 4.5],
  ["done2",      "ink3", 4.5],
  ["accent",     "ink",  3],
  ["accent",     "ink3", 3],     // 1.7 added this to finalize(); 1.13 makes every reader check it
  ["accentText", "ink",  4.5],
  ["accentText", "ink3", 4.5],
  ["hairSolid",  "ink",  3],
  ["danger",     "ink",  4.5]
];

/* ---------------- refuse to write on anything less ---------------- */

assert.equal(kits.length, 18, "18 kits");
assert.equal(kits.filter(k => k.secret).length, 2, "exactly 2 secret kits");
assert.deepEqual(kits.filter(k => k.secret).map(k => k.id), SECRET_IDS, "the secret pair is the one theme.js names");
assert.equal(new Set(kits.map(k => k.id)).size, 18, "ids are unique");
assert.equal(Object.keys(PAIRS).length, 13, "13 font pairs");
assert.equal(CURATED_DAY.length, 8, "eight day kits in the picker's order");
assert.equal(CURATED_NIGHT.length, 8, "eight night kits");

for (const k of kits) {
  assert.ok(typeof k.name === "string" && k.name.length, `${k.id}: a name`);
  assert.ok(k.base === "dark" || k.base === "light", `${k.id}: base is dark or light`);
  assert.ok(k.lean === "day" || k.lean === "night", `${k.id}: lean is day or night`);
  assert.ok(PAIRS[k.pair], `${k.id}: names a pair that exists`);
  const partner = kits.find(o => o.id === k.partner);
  assert.ok(partner, `${k.id}: names a partner that exists`);
  assert.equal(partner.partner, k.id, `${k.id}: the partnership is mutual`);
  assert.equal(partner.secret, k.secret, `${k.id}: a secret kit's partner is secret too`);
  assert.ok(Array.isArray(k.shapes) && k.shapes.length && k.shapes.every(Number.isInteger), `${k.id}: shapes is a non-empty array of ints`);
  assert.ok(Array.isArray(k.confetti) && k.confetti.length >= 5, `${k.id}: at least five confetti colours`);
  assert.ok(k.finaleStyle === undefined, `${k.id}: finaleStyle lives in colors`);
  assert.ok(["italic", "normal"].includes(k.colors.finaleStyle), `${k.id}: finaleStyle is italic or normal`);
  for (const key of HEX_TOKENS) assert.match(k.colors[key], /^#[0-9A-F]{6}$/i, `${k.id}: ${key} is a plain hex`);
  for (const hex of k.confetti) assert.match(hex, /^#[0-9A-F]{6}$/i, `${k.id}: confetti hex`);
}

const ratios = {};
let worst = { slack: Infinity };
for (const k of kits) {
  const r = ratios[k.id] = {};
  for (const [token, ground, floor] of FLOORS) {
    const got = contrast(k.colors[token], k.colors[ground]);
    r[`${token}/${ground}`] = +got.toFixed(4);
    assert.ok(got >= floor - 1e-9,
      `${k.id}: ${token} on ${ground} is ${got.toFixed(3)}, under ${floor} — fix theme.js, not this file`);
    if (got / floor < worst.slack) worst = { slack: got / floor, id: k.id, token, ground, got, floor };
  }
}

/* ---------------- hairlines: an alpha over --text, always ----------------
   `hair` and `hairHi` are rgba() strings, not colours, and a Watch has no CSS to hand them to. They
   are always the kit's own --text at an alpha, so the plugin emits the two alphas and the reader
   composes `text.opacity(a)`. Asserted here rather than assumed there: light and pink write their
   rgba by hand (theme.js's ORIGINAL pair), and pink writes .16/.42 despite being a dark base — so
   deriving the alpha from `base`, which is the obvious shortcut, would give Pink the wrong hairline
   and nothing would say so. */
const RGBA = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/;
for (const k of kits) {
  for (const key of ["hair", "hairHi"]) {
    const m = RGBA.exec(k.colors[key]);
    assert.ok(m, `${k.id}: ${key} is an rgba() string`);
    const rgb = "#" + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, "0")).join("").toUpperCase();
    assert.equal(rgb, k.colors.text.toUpperCase(), `${k.id}: ${key} is an alpha over --text, not a colour of its own`);
    assert.ok(+m[4] > 0 && +m[4] < 1, `${k.id}: ${key} alpha in (0,1)`);
  }
}

/* ---------------- write ---------------- */

const out = {
  note: "Generated by test/tools/gen-kits.mjs from theme.js. Read by test/theme.test.js and by "
      + "apple/TodaysFiveCore's KitFixtureTests, and turned into Swift by the KitsGen plugin — which "
      + "reads this file and never theme.js, because the palette cannot be recomputed at build time. "
      + "`expr` is the mapping that produced `kits` and `pairs`, kept here so the drift test can run "
      + "it against live theme.js in a JSContext instead of holding a second copy of it. Regenerate "
      + "with `node test/tools/gen-kits.mjs`; it refuses to write unless every kit clears its floors.",
  expr: EXPR,
  ids: kits.map(k => k.id),
  openIds: kits.filter(k => !k.secret).map(k => k.id),
  secretIds: kits.filter(k => k.secret).map(k => k.id),
  day: CURATED_DAY.map(t => t.id),
  night: CURATED_NIGHT.map(t => t.id),
  slotDefault: { day: SLOT_DEFAULT.day.split(":").pop(), night: SLOT_DEFAULT.night.split(":").pop() },
  hexTokens: HEX_TOKENS,
  floors: FLOORS.map(([token, ground, floor]) => ({ token, ground, floor })),
  ratios,
  kits,
  pairs: PAIRS
};

const path = new URL("../fixtures/kits.json", import.meta.url);
fs.writeFileSync(path, JSON.stringify(out, null, 2) + "\n");
console.log("wrote test/fixtures/kits.json");
console.log(`  ${kits.length} kits (${out.openIds.length} open, ${out.secretIds.length} secret), ${Object.keys(PAIRS).length} font pairs`);
console.log(`  ${FLOORS.length} floors × ${kits.length} kits = ${FLOORS.length * kits.length} contrast assertions, all cleared`);
console.log(`  tightest: ${worst.id} ${worst.token} on ${worst.ground} ${worst.got.toFixed(3)} against a floor of ${worst.floor}`);
console.log(`  ${kits.length * HEX_TOKENS.length} hex tokens, ${kits.reduce((n, k) => n + k.confetti.length, 0)} confetti colours`);
