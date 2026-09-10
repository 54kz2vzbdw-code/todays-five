# INK — second look at `derive-ink3-next` (report written from the predecessors' evidence, gaps closed cheaply)

- Written 2026-09-10, 14:35–15:10, by the INK track after two predecessors were cut off by an API outage. Their evidence is `review/raw/ink/` (89 entries + `tools/` 6 + `merged-node/` 8, all stamped 01:17–01:31); everything I added is prefixed `z-`.
- Shell `pwd`: `/Users/pricebrannen/Today's Five/Swift Code`. Worktree `/Users/pricebrannen/Today's Five/todays-five-review-ink`: `rev-parse HEAD` = `7341981…` (detached, == `main`), `rev-parse derive-ink3-next` = `3adf295…`, `merge-base main derive-ink3-next` = `1aada68…`; `main` is 2 commits past the branch (the b212→b216 stamps). `git status --short` is empty before and after this pass; nothing was checked out, merged, stashed or committed anywhere.
- The branch is three commits: `917278b` (the fix + its test), `e90005f` (merge of main into the branch), `3adf295` (the builder's contrast row, and the commit message that carries the 38.4 % / 56.4 % line).
- Instruments (all in `review/raw/ink/tools/`, read in full): `census.mjs` (imports main's and the branch's `theme.js` side by side and counts, per accent, whether `derive({accent, base}).colors.accent` differs — "moves" — plus main's accent-on-`--ink-3` ratio, which tokens differ, `danger`, confetti, sound, the whole `cssText`); `ring.mjs` (Playwright + installed Chrome, `?transport=local`, applies a `T2:` code, Tabs to the Delete row and the two confirm chips, reads the computed outline and the nearest painted ground, then the actual pixels); `firstpaint.mjs` (seeds `tf/v2/themecss` with **main's** CSS for a made theme at the current `tf/v2/themerev`, loads the served tree, records `--accent` every animation frame); `run-e2e4-slices.sh` (`tools/e2e4.js` with `ONLY=`). Node is the codex runtime's v24.19.0; my port was 8895 only, and it is closed.
- Scratch for this pass: `…/scratchpad/ink2/` — `merged/` is `git archive main` + the branch's diff applied with `patch` (see (d)); nothing in the worktree was touched.

## (a) The figures: 38.4 % / 56.4 %

**Claimed.** Three different statements exist, and they are not the same statement:
1. The tip commit `3adf295`'s message: "Full census at stride 2, 2,097,152 colours per base: dark 804,483 move — 38.4 % … light 1,182,394 move — 56.4 %", plus "this repo's own hexes 39 %/59 %", "Three of the four T2 codes in the repo move", "58 % to 63 % of hand-made ones change at least one colour".
2. The tree (`theme.js` derive() note and the new test, both from `917278b`): "over 3,000 seeded accents per base the worst `accent` against `--ink-3` was 2.18:1 on dark and 2.45:1 on light, and 1,139 / 1,690 of 3,000 were under the 3:1 floor."
3. The earlier commit `917278b`'s message and `apple/PLAN-apple-phase4.md:506–507` (identical on `main` and on the branch, which merged main): "Surprise me over 2,000 themes moved 0, and the four real-shaped `T2:` codes in the repo moved 0. The ~47 % figure came from uniform-random hex, which is the wrong denominator." `PLAN:157` separately says 1,152 / 1,687 of 3,000.

The brief's phrasing "the share of 2,000 generated themes whose ink3 moves" is not anything the branch says: nothing in the branch computes 38.4 / 56.4 from 2,000 themes. The "2,000" in its history is the Surprise-me sweep (statement 3, which returned 0) and the pre-existing "2000 random accents" test. **The 38.4 / 56.4 line describes a stride-2 grid census of the hex space, and says so.**

**Measured, with what** (all `census.mjs`, main's `theme.js` vs the branch's, run by `tools/run-census.sh` and, for the three exhaustive runs after a `Math.max(...arr)` stack overflow, `run-census-2.sh`; every `.err` is empty; the JSON is the evidence):

| instrument | population | dark: moved | light: moved | main's worst accent on `--ink-3` dark / light |
|---|---|---|---|---|
| `census-stride2-{dark,light}.json` — `--mode stride --stride 2` | r,g,b ∈ {0,2,…,254}: 2,097,152 per base (the even-channel eighth of the cube) | 804,483 = **38.361 %** | 1,182,394 = **56.381 %** | 2.1796 (#066A4E) / 2.4360 (#FE7C8C) |
| `census-stride4-*.json` — `--stride 4` | 262,144 per base | 102,169 = 38.974 % | 146,083 = 55.726 % | 2.1804 / 2.4375 |
| `census-sample-*.json` — `--mode sample --n 200000 --seed 20260910` | uniform over all 16,777,216 colours (mulberry32) | 76,078 = 38.039 % ± 0.109 (1σ) | 113,194 = 56.597 % ± 0.111 | 2.1793 (#026F38) / 2.4367 (#F57185) |
| `census-seed-*.json` — `--mode seed` | the committed test's generator: fresh LCG(4242) per base, `floor(x*0xffffff)`, 3,000 per base (+14 variants) | 1,139 = 37.97 % | 1,690 = 56.33 % | 2.1825 (#11735B) / 2.4531 (#DA6D7F) |
| `census-surprise-*.json` — `--mode surprise --n 2000` | 2,000 seeded draws of `theme.js`'s own `surprise()` per base, plus a scan of its whole L/C/h range (24,361 / 19,686 in-gamut points) | **0** | **0** | min 4.2374 / 3.0985 (range floor 4.1388 / 3.0569) |
| `census-repohexes-*.json` — `--mode list` | the 217 distinct 6-digit hex literals in the repo's own `theme.js`/`styles.css`/`panels.css` | 86 = 39.6 % | 127 = 58.5 % | 2.2063 / 2.4443 |
| `census-codes.json` — `--mode codes` | the 11 real-shaped `T2:` codes found in the repo (8 distinct accent+base; one 12th entry is a split-on-comma fragment of "Slate green, day" and parses as nothing) | 4 of 8 dark codes | 1 of 3 light codes | — |

Facts the JSON pins down:
- The stride-2 counts are **byte-for-byte the commit's**: 804,483 / 2,097,152 and 1,182,394 / 2,097,152. On the branch the worst accent on `--ink-3` is 3.0000 in every census (the floor binds exactly), and `--ink` comes free (branch worst on `--ink-2` 3.55 dark / 3.36 light).
- In every census `moved == under3OnMain` with `movedNotUnder3 = 0` and `under3NotMoved = 0`: **the set that moves is exactly the set main left under 3:1 on `--ink-3`** — nothing else moves, nothing failing stays.
- The grid is not an unbiased estimate of the uniform-cube share: stride-2 38.361 vs the sample's 38.039 ± 0.109 is 3σ; 56.381 vs 56.597 ± 0.111 is 2σ; stride-4 lands 39.0 / 55.7. The figure is instrument-dependent at the ±0.5-point level, so it is honest to a whole percent, not to a tenth.
- The tree's 1,139 / 1,690 is what the committed generator produces, against today's main **and** against `theme.js` at `176e022` (Sep 7, "Phase 4 begins", an ancestor of main — `census-seed-*-theme-at-176e022.json` are identical to the main files, so `derive()` has not moved since the plan was written). `PLAN:157`'s 1,152 / 1,687 is reproduced by **none** of the 15 generator variants (1,687 matches `floor(x*0x1000000)` on light; nothing gives 1,152 on dark). Stale by 13 and 3 themes — immaterial, but wrong.
- `surprise()` cannot emit a mover: it draws L 0.68–0.80 (dark) / 0.45–0.58 (light), and the floor of that whole range is 4.14:1 / 3.06:1 on `--ink-3`. So "0 of 2,000" measured the generator, not the fix — the tip commit says exactly this. But "moved 0" is not even true of the whole theme: 777 of the 2,000 dark Surprise-me draws move `danger` (below).
- The repo's codes do move: `T2:l:FF3D9A:…:Mine · day` (#FF3D9A → #ED268B), `T2:d:3366FF:…:Blue` and `…:Marbles` (#3366FF → #3C6FFF), `T2:d:2F7F6F:…:Slate green` (#2F7F6F → #398878, danger too), `T2:d:11735B:…:Teal` (#11735B → #338B72, danger too); the other six are unchanged. "Four … moved 0" (PLAN) and "three of the four move" (tip commit) count a different four; by this instrument it is 5 of 11.
- Beyond the accent: `danger` moves on **40.4 % of all dark made themes** (847,772 of 2,097,152; on light never), always by one OKLCH L step, +0.009 (#F2716A → #F5746D) — main's worst dark danger on `--ink-3` was 4.374 < 4.5, the branch's 4.500. Counting any token, **72.4 % of dark and 56.4 % of light made themes get different CSS** (`cssDiff`), not "58–63 %". When the accent moves, seven tokens follow it (accent, accentHi, accentDeep, glow, strikeShadow on dark, boxDoneBg, strikeBg) and the confetti; `accentText` moves in 43–45 % of movers; sound never.
- The ~47 % "wrong denominator" figure is the uniform sample averaged over both bases ((38.0 + 56.6) / 2 = 47.3). It was the right denominator: the builder's accent input is an OS colour picker plus a free hex field, so the population is the cube.

**What the instrument cannot see.** The share of *saved* themes — they live in end-to-end-encrypted documents whose keys are other people's links — and how people actually distribute over the cube (a dark-theme picker reaching for deep saturated colours will sit far above 38 %; the tip commit's "6,246 of 6,246" for that region is not in the evidence and I did not reproduce it). A grid census weights every colour equally; a person does not.

**Verdict.** The 38.4 % / 56.4 % line is a correct report of a stride-2 grid census (`census.mjs --mode stride --stride 2`), reproduced to the count; it is not "2,000 themes". The honest sentence is: *"Of every accent the builder accepts, about 38 % on a dark base and about 56 % on a light base derive a different accent on the branch — exactly the ones main left under 3:1 on `--ink-3` (worst 2.18:1 dark, 2.44:1 light) — and, counting the one-step `danger` shift, about 72 % of dark and 56 % of light made themes get different CSS; Surprise-me themes never move their accent, the repo's own hex literals move 40 % / 59 %, 5 of the 11 codes in the repo move, curated kits never do, and the share of saved themes cannot be measured."* The PLAN's "moved 0" paragraph is false in both of its clauses (replacement line at the end).

## (b) The focus ring on Remove / Delete

**Claimed.** Tip commit: "`--accent` is the focus ring on every danger confirm chip … on a hand-picked dark theme that ring sits at 2.18:1 against WCAG 2.1 SC 1.4.11's normative 3:1." The brief: 2.18:1 against 3:1.

**Measured, with what.** `ring.mjs` against the predecessor's served trees (`serve-8893-main.log`, `serve-8893-branch.log`: scratch copies of main's and the branch's files), six accents — the two worst dark (#026F38 from the sample, #11735B from the seed test), the two worst light (#F57185, #DA6D7F), Pink's #FF3D9A on light, and the suite's #3366FF on dark — three surfaces each: the ⋯ menu's "Delete this list everywhere" row (`#menu-delete`), the "Delete everywhere" confirm chip (`#ask-ok.danger`), the "Remove from this device" confirm chip (`#ask-ok.danger`). Outputs `ring-{main,branch}.json`, `ring-{main,branch}.log`, 36 PNGs. Every measurement: ring = 2 px solid `--accent`, offset 2 px (`styles.css:81`, `panels.css:38`), `:focus-visible` true, 0 page errors, and the ground is `dialog.panel`'s background = **`--ink-2`** (`panels.css:8`) — not `--ink-3`.

| accent (base) | main `--accent` | ring : `--ink-2` on main | branch `--accent` | ring : `--ink-2` on branch |
|---|---|---|---|---|
| #026F38 (dark) | #10753E | **2.6559** | #328D54 | 3.7059 |
| #11735B (dark) | #11735B | **2.6590** | #338B72 | 3.7217 |
| #3366FF (dark) | #3366FF | 3.3260 (passes; 2.79 on `--ink-3`) | #3C6FFF | 3.6409 |
| #F57185 (light) | #E76479 | **2.7680** | #D25168 | 3.5142 |
| #DA6D7F (light) | #DA6D7F | **2.7889** | #C55B6D | 3.5468 |
| #FF3D9A (light) | #FF3D9A | **2.8191** | #ED268B | 3.4286 |

The same ratio holds on all three surfaces of an accent (same ring, same ground). So **on main 5 of 6 accents fail on all three surfaces — 15 of 18 — minimum 2.66:1 (dark) / 2.77:1 (light); on the branch 0 of 18 fail, minimum 3.43:1** (#FF3D9A light), maximum 3.72:1. The pixel probe agrees with the computed value to four decimals on both confirm chips (both edges). On the menu row the probe 8 px outside the row lands on the blurred `::backdrop` beyond the popover's rounded edge (`ring-main-11735B-dark-menu-delete.png`, cropped and inspected), so its 1.05–1.55:1 figures are ring-vs-backdrop, not ring-vs-ground; the computed value is the honest one there, and the geometry is identical on both trees.

**What the instrument cannot see.** Only three flows on one viewport (1200×900 desktop, headless Chrome); no surface where the ring sits on `--ink-3` (a control inside an `--ink-3` container) was in these flows — the 2.18:1 is that surface's number and it was not found under a Delete/Remove ring. Safari's own focus ring rules are not measured.

**Verdict.** The brief's "2.18:1" is the accent-on-`--ink-3` figure; the ring on the Remove / Delete confirms sits on `--ink-2` at **2.66:1 (dark) / 2.77:1 (light)** for the worst accents — still a WCAG 1.4.11 failure on a destructive control. The branch **fixes** every measured surface (min 3.43:1), worsens none, and by construction cannot leave a ring under 3:1 on `--ink-2` or `--ink` (both are easier grounds than `--ink-3` in the same direction). Note that the confirm chips' own red text/border (`--danger`) also moves on dark (#F2716A → #F5746D).

## (c) Scope

**Claimed.** Commit `917278b`: "the four ensure() grounds, the 3,000-accent test, and accent3/danger3 in THRESH"; `3adf295`: the builder's contrast row.

**Measured.** `git -C "$W" diff main...derive-ink3-next --stat` (== `diff 1aada68..derive-ink3-next --stat`):
```
 panels.js          | 10 +++++++++-
 test/theme.test.js | 46 +++++++++++++++++++++++++++++++++++-----------
 theme.js           | 36 ++++++++++++------------------------
 3 files changed, 56 insertions(+), 36 deletions(-)
```
Hunks, from the full diff: `theme.js` — the 19-line "known gap, deliberately not closed" note replaced by an 8-line note, and four one-token edits `c.ink` → `c.ink3` on the `accent` and `danger` `ensure()` lines, dark and light (lines 557/562 and 571/576). `test/theme.test.js` — `THRESH` gains `accent3: 3` and `danger3: 4.5`, the 11-line "deliberately NOT in this table" comment becomes 4 lines, and one 30-line test is added (3,000 seeded accents per base, worst printed, plus a `T2:d:11735B:…:Teal` round-trip). `panels.js` — the `#c-contrast` template literal now prints `accent` on the page and on a panel, plus `accent text`, with a 6-line comment. Nothing else. The branch's *tree* also lags main by main's two later commits (b212→b216 in `version.js`, `sw.js`, `whatsnew.json`, `index.html data-build`, `panels.js PANELS_BUILD`, comments) — main-side, excluded by the three-dot diff, and brought in by the merge.

Not in the tree though promised or implied: the `COMPATIBILITY.md` line `917278b` lists as "still to do on this branch before it ships" (the branch does not touch `COMPATIBILITY.md`); any correction to `PLAN:506–507` (still "moved 0" on the branch); a build bump; a `whatsnew.json`/CHANGELOG line. The test labels say "1.12 b202" for a change that ships after b216.

**Verdict.** Yes — three files, the hunks are exactly the four grounds, the table, one test and one string. The scope claim holds for code; the branch's own to-do list does not.

## (d) Applies cleanly on today's main

**Claimed.** "Ships alone" after main; the predecessor's trial merge was clean and aborted.

**Measured.** `merge-trial.log` (01:18): `Auto-merging panels.js / test/theme.test.js / theme.js — Automatic merge went well; stopped before committing`, exit 0, no conflicts; then aborted — the worktree is clean now (`git status --short | wc -l` = 0). Not redone. Instead: `git -C "$W" archive main | tar -x -C …/ink2/merged` (1,657 files), `git -C "$W" diff main...derive-ink3-next > …/ink2/branch.diff` (154 lines), then `patch -p1 --dry-run -d …/merged < branch.diff` and `patch -p1 -d …/merged < branch.diff` — both print exactly `patching file panels.js / patching file 'test/theme.test.js' / patching file theme.js`, exit 0, no `.rej`/`.orig`. The three patched files differ from the branch's blobs only by main's b212→b216 comment renames, as expected. Node suites on that tree (`z-merged-node-summary.txt`, `z-merged-node-theme.log`, `z-merged-node-features.log`): theme 34/0 — the new test prints `derived dark: worst accent on --ink-3 3.0000, 0 of 3000 below 3:1; worst danger 4.5001` and `light: 3.0000 … 4.9517` — features 30/0, compat 9/0. The predecessor's `merged-node/summary.txt` on the trial-merged worktree: all seven suites, 137 ok / 0 fail.

**Verdict.** Yes.

## (e) `data-tokens-rev` per COMPATIBILITY.md §5

**Claimed.** §5: "a round that moves a curated kit's palette must re-stamp `data-tokens-rev` in both pages, and the suite fails if it does not." The branch says nothing about stamps.

**Measured.** `git show {main,derive-ink3-next}:{index.html,about.html} | grep data-tokens-rev` → `"1ptwfkh"` in all four; `PALETTE_REV` evaluated from main's `theme.js` and from the patch-built merged tree → `1ptwfkh` both; `test/features.test.js` "the cached token CSS is stamped with the palette it was computed from, and both pages agree" passes on the merged tree (also in the predecessor's `merged-node/node-features.log`). `PALETTE_REV` is a hash over the **curated kits'** tokens (`theme.js:837`), and the branch moves no curated kit (the 18-kit table in `node-theme.log` is unchanged; the Swift side reads the same kit fixture and has no `derive()` of its own — `grep` over `apple/` for `derive|parseCode|T2:` finds only kit colour fields). `sw.js` is `tf-v1.12` + `BUILD` on both; `version.js` says 216 on main, 212 on the branch (no bump of its own).

**What it cannot see.** §5's stamp was designed for kits; a made theme's cached CSS is computed by whichever `derive()` wrote it and carries the same stamp either way — so the stamp does not, and cannot, distinguish main's derivation from the branch's. That is the case (f) measures.

**Verdict.** **No re-stamp, and none is owed by §5's letter.** A re-stamp would also not help (see (f), scenario C). But the branch ships with no build bump at all, and that is not optional: `app.js:179` imports `panels.js?v=<BUILD>` and `sw.js:50` answers a same-build `?v=` module **cache-first** from the precached shell, while `theme.js` is a plain static import (`app.js:10`, network-first). Deployed as-is, an installed PWA would get the new `derive()` on its next load and keep b216's `panels.js` (the old contrast row) until some later build — and a byte-identical `sw.js` means no service-worker update at all. The five homes (`version.js`, `sw.js`, `whatsnew.json`, `index.html data-build`, `panels.js PANELS_BUILD`) must move at the merge; `features.test.js` catches a missed one.

## (f) The morning after: a returning device with `tf/v2/themecss` cached at the old `themerev`

**Claimed.** `917278b`: "a `T2:` code on a shared list would render differently on every device the morning after the deploy." Tip: "only pixels move."

**Measured, with what.** `firstpaint.mjs` (`firstpaint-branch.log`, `firstpaint-branch-11735B-dark.json`, `firstpaint-branch-DA6D7F-light.json`; control `firstpaint-main-11735B-dark.json`): seeds a fresh context exactly as main's build leaves a device — `tf/v2/themecss` = main's `cssText` for the made theme, `tf/v2/themerev` = `1ptwfkh`, both slots on the code — loads the served tree, records `--accent` on every animation frame, at DOMContentLoaded, at load, then reads the cache and reloads.
- **A, normal load on the branch, dark `T2:d:11735B`**: first frame at 27 ms paints the stale **#11735B**, held 2 frames (27–40 ms); from 79 ms **#338B72**; DOMContentLoaded (75 ms) and load (76 ms) already show the new; cache rewritten to #338B72 during that load; the reload paints #338B72 from its first frame (22 ms). Light `T2:l:DA6D7F`: #DA6D7F for 2 frames (13–20 ms), #C55B6D from 39 ms, DCL 38 ms; reload clean.
- **B, `app.js` blocked**: the stale colour persists for the whole 1.5 s — the boot script alone repaints the cache and cannot know better; only `applyTheme` fixes it.
- **C, stamp mismatch (what a re-stamp would do)**: the boot script drops the cache and paints the brand fallback **#A86014** for 1–2 frames (15–22 ms), then the new accent from 41 ms. A different flash, not no flash.
- **Control, main**: #11735B throughout, on every scenario except C, which flashes #A86014 on main too.

**Which themes, by how much.** Only made themes whose accent main left under 3:1 on `--ink-3` — the (a) population: ~38 % dark / ~56 % light of the cube, 0 % of Surprise-me accents, 5 of the 11 codes in the repo, never a curated kit. The accent's OKLCH L moves **+0.059 mean on dark (median +0.069, max +0.083)** — #11735B → #338B72, #026F38's #10753E → #328D54 — and **−0.045 mean on light (median −0.049, to −0.0625)** — #DA6D7F → #C55B6D, #FF3D9A → #ED268B; hue is kept. Seven tokens and the confetti follow; `accentText` in 43–45 % of movers. Separately, `danger` on 40 % of dark made themes (777 of 2,000 Surprise-me dark ones included) by one step, #F2716A → #F5746D — not visible.

**What it cannot see.** Headless Chrome on a loaded Mac at 1000×800; not Safari/WebKit or iOS standalone, where frame timing and the first paint differ; not a device whose page stays open across the deploy (COMPATIBILITY §6 keeps its own code until reload). Two other devices on one shared list disagree only until each has loaded once.

**Verdict.** A returning device sees at most two frames (13–50 ms here) of the old accent, then the new one before the DOM is even parsed; the cache is rewritten on that load; the second visit is clean. The change is a shade lighter (dark) or deeper (light) on the accent family of the affected themes. The stamp should be left alone.

## (g) The e2e4 slices on the merged tree

**Claimed.** Baseline main `169 passed, 0 failed` (`review/raw/baseline/e2e4.log`, run 2, 1-min load ≈ 5).

**Measured.** `run-e2e4-slices.sh` against the trial-merged worktree served at 8893 (`e2e4-merged-run.log`): `ONLY=theme` 17 passed / 1 failed at load `7.70 19.86 21.49`; `ONLY=accent` 2/0; `ONLY=builder` 6/0 (the "1.7: one design language — the danger confirm, accent focus rings …" test passed in both). The one failure (`e2e4-merged-only-theme.log:7`): desktop "the flip — T, or a click on the sun/moon crossfades the whole palette" at `tools/e2e4.js:1309`: `the row text is at the token, not trailing it expected "rgb(215, 212, 205)" got "rgb(223, 220, 212)"`. That assertion reads `#list .row`'s colour and `body`'s colour in **two separate Playwright round trips** 110 ms into a 400 ms crossfade whose tokens are interpolated every frame; a frame boundary between the two reads yields exactly this one-step (8/255 per channel) difference. The phone copy of the same test passed in the same run; the flip crossfades curated Dark → Light and touches nothing the branch changes (`derive()`'s grounds, the builder row, a test file).

Settled by one re-run, as the brief allows: `BASE=http://127.0.0.1:8895/ ONLY="crossfades the whole palette" node tools/e2e4.js` on the patch-built merged tree served at 8895 (`z-e2e4-flip-8895.log`, `z-serve-8895.log`): **2 passed, 0 failed**; `uptime` before `load averages: 12.04 30.00 44.03`, after `13.00 29.37 43.56`; server killed, no listener left.

**What it cannot see.** About 145 of the 169 test executions were not run on the merged tree; no e2e4 assertion reads `#c-contrast` at all (grep: none), so the builder's new row text is covered only by `report()`'s node tests; Chrome, not Safari.

**Verdict.** The failure was the load acting on a timing-fragile assertion, not the branch. Everything the branch touches that the browser suite exercises passed.

## (h) Recommendation

**Ship alone, after five changes that touch neither `derive()` nor the measurements** — the build bump (mandatory, (e)); the `COMPATIBILITY.md` §5 line the branch itself promised; the PLAN corrections (506–507, 157); a one-line what's-new/CHANGELOG item; relabel "1.12 b202" to the shipping build. Then it can go as the branch intends, attributable to one commit.

For shipping: the fix is four identifiers in the direction of the harder ground, so it can only tighten; every census puts the branch's worst accent exactly at 3.00:1 and never moves a colour that was already at the floor; the focus ring on *Delete this list everywhere* goes from 2.66:1 to ≥ 3.43:1 on the worst accents a person can pick; codes round-trip byte for byte; the merge is clean; 137/0 node, and 26 browser-test executions with one load-induced failure that passed on re-run; and the morning-after cost is two frames once per device per theme. Every day it waits, more saved codes render a sub-3:1 ring on a destructive control.

For holding: the change reaches other people's screens without their action — its own reason for a separate release — and the branch's paperwork is not ready: its earlier commit lists an unmet to-do, the PLAN still contradicts its tip commit ("moved 0" vs 38 %), the tip commit's magnitudes are loose (2.18 vs 2.66 for the ring, "three of four" vs 5 of 11, "58–63 %" vs 72/56), and nothing tells a person why their teal is lighter. None of that argues the fix is wrong; all of it argues the branch should not be merged *as is*.

## Findings

1. **Medium · `apple/PLAN-apple-phase4.md:506–507` (main and branch) · "moved 0" twice** · `census-surprise-*.json` (0 accents, 777 of 2,000 dark `danger`s, and a generator whose range floor is 4.14:1), `census-codes.json` (5 of 11 codes move) · Replace the two lines (below). Other side: the paragraph was true of the instrument it named; the tip commit already retracts it; a doc fix, not a hold.
2. **Medium · no build bump on the branch** (`version.js` 212 vs main 216; `sw.js` cache `tf-v1.12-b<BUILD>`; `app.js:179` `panels.js?v=BUILD` cache-first per `sw.js:50`) · Bump all five homes at the merge. Other side: normal release procedure, not a defect of the diff — but "as is" would leave installed devices with the new `derive()` and the old builder row.
3. **Low–Medium · `917278b`'s "still to do on this branch before it ships: a line in COMPATIBILITY.md"** · `git diff main...derive-ink3-next --stat` has no `COMPATIBILITY.md` · Add to §5: *"A theme code is transport and shape: what a `T2:` code renders to is derive()'s business and may change between builds; the cache stamp covers curated kits only, so a made theme's cached CSS is refreshed by `applyTheme` on the first load after such a change (≤ 2 frames of the previous colours)."* Other side: §5's letter is satisfied today; this is documentation of a gap.
4. **Low · commit `3adf295`'s magnitudes** · (b): ring 2.66:1 on `--ink-2`, not 2.18:1; (a): 5 of 11 codes, 72 % / 56 % any-token · Put the measured numbers in the PLAN/CHANGELOG line; a commit message cannot be amended without rewriting the branch. Other side: every direction is right.
5. **Low · `PLAN:157` 1,152 / 1,687** · no generator variant reproduces 1,152; the committed test prints 1,139 / 1,690 · Change to 1,139 / 1,690.
6. **Low · test labels "1.12 b202"** (`test/theme.test.js` new test and `THRESH` comment; `theme.js` note) · relabel to the shipping build; `features.test.js` does not read them.
7. **Low · `tools/e2e4.js:1309`** · two round-trip reads of a per-frame-interpolated token; failed at load 7.7 / 19.9, passed at 12 / 30 · read both colours in one `evaluate`. Both sides: not this branch's code; it will produce another false alarm.
8. **Info · `#c-contrast` is asserted by no e2e4 test** · the `panels.js` change is browser-untested beyond "the builder opens and saves" · one assertion on the row's shape in the builder test.
9. **Info · `T2:d:D26128:lato:pop:A:B` does not round-trip** on main or branch (`census-codes.json` `codeRoundTrips: false`; `test/theme.test.js:270` carries the same code) · pre-existing and unchanged; noted only so nobody attributes it to the branch.
10. **Info · the stamp** · scenario C shows a re-stamp trades a 2-frame old-accent flash for a 2-frame `#A86014` flash · leave `data-tokens-rev` alone.
11. **Info · what's new** · `whatsnew.json` untouched; a person whose accent moved has nothing to read · one "Fixed" item in the app's register, e.g. *"A colour you picked sits a shade lighter on panels and confirms, so it always reads."*

## The PLAN line (`apple/PLAN-apple-phase4.md`, lines 506–507, identical on main and on the branch)

Old, quoted exactly from the file (two physical lines):
```
the builder's own **Surprise me over 2,000 themes moved 0**, and the four real-shaped `T2:` codes in
the repo moved 0. The ~47 % figure came from uniform-random hex, which is the wrong denominator.
```
New (instrument: `review/raw/ink/tools/census.mjs` — `--mode surprise` → `census-surprise-{dark,light}.json`; `--mode stride --stride 2` → `census-stride2-{dark,light}.json`; `--mode list` → `census-repohexes-*.json`; `--mode codes` → `census-codes.json`; the ~47 % is `census-sample-*.json` averaged over both bases):
```
the builder's own **Surprise me cannot produce a moving accent** (0 of 2,000, because it draws L from
0.68–0.80 on dark and 0.45–0.58 on light, above the failing region — though 777 of the 2,000 dark draws
move `danger` by one step), while a stride-2 census of everything the picker accepts (2,097,152 colours
per base) moves the accent of **38.4 % on dark and 56.4 % on light**; this repo's own hex literals move
40 % / 59 %, and 5 of the 11 real-shaped `T2:` codes in the repo move. The ~47 % figure was that same
population averaged over both bases — the right denominator, since the builder's input is a free picker.
```
(`PLAN:157` separately: "1,152 of 3,000" → "1,139 of 3,000", "1,687 of 3,000" → "1,690 of 3,000".)

## Evidence added by this pass (`review/raw/ink/z-*`)

- `z-merged-node-summary.txt`, `z-merged-node-theme.log`, `z-merged-node-features.log` — theme 34/0, features 30/0, compat 9/0 on the patch-built merged tree (15:04, load 7.4 / 29.4 / 43.9).
- `z-e2e4-flip-8895.log`, `z-serve-8895.log` — the flip slice, 2/0, uptime bookends inside.
- Scratch (not evidence, disposable): `…/scratchpad/ink2/merged/` (archive + patch), `branch.diff`, `png/` (crops of two ring PNGs).

Housekeeping: port 8895 closed (`lsof` 0 listeners); the worktree's `git status` is empty and HEAD is still `7341981`; no `xcodebuild`, `swift test` or simulator was run; one Chrome-driving script ran, once; `grep -E '[0-9A-Za-z]{22,}'` over this file is clean.
