# Phase 4, Track A — the web accent, unpinned from the brand

## The render pass came before the test file, and it is what settled the change

Contrast arithmetic can say `#C8321F` is 3.85:1 on Paper's `#E3DAC8`. It cannot say whether the app
still looks like this product. `tools/shots.js` walks the surfaces in one theme and nothing in the
repo walked the themes on one surface, so `tools/kitshots.js` was written first: one screenshot per
kit, the list on screen with one line struck so the strike, the filled box, the progress bar and the
count all carry the accent, `applyTheme` in a loop over `CURATED` with `persist: false`. 18 kits in
9.4 s, no network, no list creations, zero page errors. It runs before and after and the two sets are
read side by side.

What it showed, which no number in the plan did: on Terminal the amber check does not read as a
brand at all, it reads as a **foreign object** — a rust-orange block dropped into a green-on-black
terminal where every other pixel, the date, the header, the type, the hairlines, is phosphor. On
Paper the amber was defensible, and the change there is a matter of taste rather than of correction.
That asymmetry is the whole finding, and it is why the round is worth doing even though the
arithmetic was never wrong.

**How to apply:** when a change is about how something looks, build the picture before the assertion.
A round justified only by contrast ratios will happily ship a colour that clears every floor and
belongs to nothing.

## The premise, not the arithmetic, and the comment block says so now

1.11's reasoning is sound and still in the file: 4.5:1 on Paper's `#F7F2E8` needs luminance ≤ 0.159
and on Terminal's `#070A08` needs ≥ 0.188, so no single hex is text on both, so a shared accent has
to be a UI colour at 3:1. What was wrong is the sentence before it — that the two default kits should
share an accent at all. Fifteen of the eighteen kits never did.

So the accent is the kit's again: Paper's `#C8321F` and Terminal's `#4AF07A`, byte for byte the
families they carried before 1.11, `accentHi`, `accentDeep`, `accentText`, `glow`, `strikeShadow` and
confetti with them. `finalize()`'s `fix3` nudge was run on each of the six and every one returned
itself, so the revert cost nothing in contrast. Terminal's accent goes 4.12 → 13.29 on `--ink` and
3.48 → 11.22 on `--ink-3`; Paper's 4.33 → 4.79 and 3.48 → 3.85. `cssText()` moved on exactly two of
the eighteen kits.

**Dark keeps `#A86014`, and that is a decision.** Since 1.11 Dark *is* the brand's dark — Terminal's
grounds, Paper's paper as its ink, the brand accent — and reverting it would mean going back to
`#D26128`, the borrowed law-firm orange 1.11 deliberately removed. The hex survives in exactly one
kit, where it is that kit's own colour rather than a pin over somebody else's.

**The mark does not move**: `BRAND_ACCENT`, `BRAND_COLOURWAYS`, `BRAND`, `brandTiles()`,
`brandDark()` and `icons/mark.svg` are untouched, and the suite now asserts that no kit's hex is
written into the SVG at all. The in-app echo of the icon is what is traded away, knowingly.

The long 1.11 comment block is rewritten rather than annotated. It now says what 1.11 solved, why the
premise was wrong, what the accent is now, and that the mark keeps `#A86014` — and the
`BRAND_ACCENT` doc comment says that its four-ground balancing is still what it was chosen for,
because the mark is still drawn on all four grounds; only the number of kits asked to wear it
changed. `brandAccentSet()` lost both its call sites, had no others and was never exported, so it is
deleted rather than left describing a rule the file no longer follows.

**How to apply:** when a change reverses a decision, rewrite the paragraph that argued for it. A
stale block beside correct code is worse than no block, because the next reader trusts it.

## `derive()` was measuring one token against the wrong ground, and half the accents were under the floor

Everything `derive()` builds is nudged against `--ink-3` — the lightest (dark) or darkest (light)
surface a token ever sits on, a panel, a filled chip, a hovered swatch — except `accent`, which was
nudged against `--ink`. The curated path has nudged there since 1.7; this line never caught up. Over
3,000 seeded accents per base:

| | worst `accent` vs `--ink-3` | under 3:1 |
| --- | --- | --- |
| dark, before | **2.18** (`#11735B`) | 1,139 / 3,000 |
| light, before | **2.45** (`#DA6D7F`) | 1,690 / 3,000 |
| both, after | **3.00** | 0 / 3,000 |

`--ink-3` is the harder ground on both bases, so ensuring there implies the old guarantee and can
never weaken it — asserted on all 6,000. Exactly the accents that were under the floor moved, and no
others: 1,139 dark by a mean 0.0594 in OKLCH L (worst 0.082) and 1,690 light by a mean 0.0449 (worst
0.060). The family follows the accent, so `accentHi`, `accentDeep`, `accentText`, the glow and the
strike shadow move on those and only those.

**It is its own commit because saved theme codes live in the encrypted document** (`model.js`, the
`themes` collection), so this changes what another person's device renders on a shared list. Nothing
about the code grammar moves — a `T2` code round-trips byte for byte and still rebuilds exactly what
the builder showed — so an old client reads a new client's code and renders it its old way, a new one
renders it the new way, and neither can fail to parse the other's. The floor is the only thing that
changed hands, which is why this is not a `COMPATIBILITY.md` §3 event: the shape did not move, the
derivation did.

**How to apply:** when two code paths implement the same rule, the shared test table is the only
place the rule can live. A floor enforced in one path's own test is a floor the other path does not
have.

## A token nothing reports is a token nothing holds to a floor

Re-pointing the floors found one kit that could not meet them, and it is neither of the two that
moved. `light.danger` `#B8402A` on `light.ink3` `#E4DED2` is **4.12:1**, short of 4.5, and has been
since v1. It hid behind three things at once: `report()` measured `danger` against `--ink` alone
(5.20, comfortably clear), light is in `ORIGINAL` so `finalize()` never nudged it, and the one test
that did check danger on `--ink-3` skipped dark, light and pink by name.

Fixed minimally to `#B13924` — `finalize()`'s own `fix3` nudge run by hand, two steps of L −0.01, the
smallest move that clears the floor, and already the hex Teletype's identical `#B8402A` finalizes to.
4.1205 → 4.5050 on `--ink-3`, 4.6907 → 5.1284 on `--ink-2`, 5.2034 → 5.6889 on `--ink`. It is the one
v1 token that has moved, and the pinned list in the suite says so where a reader will find it.

`danger3` joins `report()` and `THRESH` so it cannot come back — and adding it turned up the same
wrong ground in `derive()`, whose danger was 4.38 at worst on dark with 1,222 of 3,000 under 4.5:1.
Pointed at `--ink-3` with the accent: 0 of 3,000, worst 4.5001 dark and 4.9517 light. The threshold
and every fix it needs are in one commit, so reverting one never leaves the table asserting a floor
nothing holds.

**The `ORIGINAL` exemption is an exemption from being nudged, never from being measured.** Both
originals pass the accent floors as written, and by margins worth pinning rather than assuming:
light's accent is 3.0016 on `--ink-3` and Pink's accent text is 4.5069. The suite asserts those
numbers now, and prints all eighteen kits' four ratios every run.

**How to apply:** add the token to the report before you add the floor. A contrast function that only
measures against the easy ground will report a healthy number for a colour nobody can read.

## The Secret group had three doors, and the third had no guard

The group is gated on `dev().secret` and so is the import field. `savedThemes()` was not, and the
picker fills **Yours** straight from it. A `themes` record is `{ id, name, code, updatedAt }`; its
`code` is a theme code like any other, and `T1:curated:superpink` parses to a complete kit.
`normalize()` and `merge()` carry such a record through verbatim — measured, and they **must**,
because `COMPATIBILITY.md` §3 says a client never drops what it does not understand. So nothing about
this is fixable in the model; it is a rendering guard or nothing.

Measured in a browser on the local transport, a document carrying one T2 record and one whose code
names a secret kit: **before**, a device without the key rendered 2 swatches in Yours; **after**, 1,
and 2 with the key beside the group's own 2.

Gated inside `savedThemes()` rather than at the `#sw-yours` fill, so every reader is covered at once:
the swatches, the hidden flag on their header, and the partner lookup behind *Make its partner*. The
record is never touched — a device without the key does not show it and does not delete it, so the
device that saved it still has it and a device given the key later gets it back.

The test runs `panels.js`'s own `savedThemes()` expression, lifted out of the file by regex, against
a real normalized document, so it fails if the guard is removed *or* if the function is restructured
past the lift; then it asserts all three doors name the same predicate, so a fourth cannot be opened
without one.

**How to apply:** when a feature is gated in more than one place, the test should enumerate the
places, not check the one you were thinking about. This hole was unreachable through today's UI and
would have stayed invisible until the day it wasn't.

## `tools/mark.mjs --trace` has been broken since 1.11, and it is not this round's doing

`--trace` renders `icons/mark.svg` in hard-coded `#1A1D21` / `#D26128` and pixel-diffs it against
`icons/apple-touch-icon.png` with a **colour** threshold (`d > 90`), under a comment saying "Geometry
only". 1.11 regenerated `apple-touch-icon.png` in the new colours — with this same script — so the
diff has compared a charcoal tile with an orange check against a cream tile with an amber check ever
since. It reports **93.84 %**, and it reports the identical 93.84 % on the untouched Phase 4 base
commit, so nothing this round touched it.

The drawing has **not** drifted, which is what `--trace` exists to say. Rendering the same SVG in the
colours the shipped file actually carries gives **0.00 %** of pixels different, and a real
geometry-only comparison — ink mask against ink mask, colour ignored entirely — is **0.00 %** either
way. `node tools/mark.mjs --check` is byte-for-byte identical on the base and on this branch: safe
zone clear, worst painted radius 0.316 of 0.400, ink 6.6 %.

Not fixed here, deliberately: `tools/mark.mjs` is outside this track's surface and the fix is a
choice between two different tools (diff the ink masks, or render in `brandTiles()`'s colours), which
is the orchestrator's call.

**How to apply:** a regression check whose reference file is regenerated by the same script it checks
will pass until the day the script changes the reference, and then fail forever without anyone
reading the number.

## The Secret key is in plaintext in the repo, and it is not in `theme.js`

`theme.js` says of the key that "The word is not written down here — a casual reader of this file
should not trip over it", and that is true of `theme.js`. It is not true of the repo:
`tools/shots.js` types the word into `#c-import` in plain text to take the Secret group's shots.
`tools/kitshots.js` deliberately does not need it — `CURATED` already holds both kits and
`applyTheme` does not ask — which is why the new tool takes every kit's picture without going near
the key. `tools/shots.js` is left alone: changing it would break the shots tool, and whether the key
should live there at all is the orchestrator's call, not this track's.
