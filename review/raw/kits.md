# KITS — Phase 4, the theme kits (`4962f97..7341981`): second-look report

- **pwd** `/Users/pricebrannen/Today's Five/todays-five-review-kits` (detached worktree, read-only)
- **HEAD** `[REDACTED]` = `7341981` "Measured on the live build: what a returning device actually sees"
- **Range** `4962f97..7341981`: four track branches merged (`542b697` p4-a-web-accent, `20e45d3` p4-d-latency, `e855ad8` p4-b-core-kits, `9326ebf` p4-c-watch-look) plus the integration commits; `git diff --stat` 106 files, +10,117 / −205.
- **Written** 2026-09-10, 15:35 CDT, by the third agent on this track. Two predecessors gathered evidence and were terminated before writing. Every number below is either theirs (file named) or mine (file named, prefix `q-`/`r-`); quoting a write-up back is not counted as a measurement anywhere in this report.

## 0. What was run, and by whom

**The predecessors** (mtimes under `review/raw/kits/`, all 2026-09-10):

| when | what | instrument → evidence |
| --- | --- | --- |
| 01:11:42–01:11:55 | cssText diff base→head; clock contrast; accent/danger ratios; the hex population; `PALETTE_REV`; self-test count structure; `gen-kits.mjs` on a scratch copy | `tools/csstext-diff.mjs` → `a-`; `clock-contrast.mjs` → `c-`; `accent-contrast.mjs` → `g-`; `hex-population.mjs` → `e-hex-population`; `palette-rev.mjs` → `j-`; `selftest-counts.mjs` → `m-`; `e-gen-kits.txt` |
| 01:13:37–01:13:59 | mutation 1 (Terminal accent `#4AF07A→#4AF07B` in a scratch `theme.js`, fixture not regenerated) through the seven Node suites and `swift test --filter KitFixtureTests` on that scratch copy — **the one Swift build on this track**, at load 4.9, before the memory-pressure rule; macOS CoreText resolution of the 22 CSS family names | `d-mutation-node.txt`, `d-mutation-swift.log`; `tools/ctfont-resolve.swift` → `f-ctfont-resolve.txt` |
| 01:14:32 | `tools/kitshots.js` three times against a scratch static server (port 8892); `JSON.stringify` sizes | `o-kitshots-*`, `tools/json-sizes.mjs` → `o-json-sizes.txt` |
| 01:16:19–01:18:11 | `tools/polld.js` fg-live for seeds 20260907 / 11 / 4242 and the doorbell condition, port 8892; mutation 2 (Sunset `ink2`, a token no test pins); `mark.mjs --trace` at head and at the base; CoreText against the 26 un-instanced conversions and against the shipped 33 with file URLs; the "314" population | `i-polld-*`; `d-mutation2-node.txt`; `h-mark-trace.txt`; `f-ctfont-resolve-26.txt`, `f-ctfont-resolve-33.txt`; `tools/hex-314.mjs` → `e-hex-314.txt` |
| 01:20:27 | `derive()` on 3,000 uniform-random accents per base, two seeds | `tools/derive-ink3.mjs` → `p-derive-ink3.txt` |
| 01:28:02–01:30:43 | `tools/sim-session.sh` on the review pair (Apple Watch Series 11 **42 mm** simulator, watchOS 26.5, the baseline track's Debug-watchsimulator product built at 7341981): three launches each of `-TFKit dark/paper/terminal` with a screenshot, the picker-persistence sequence (`-TFThemeSet day:harbor`, then a bare relaunch, then the restore), the App Group file listing | **left in the scratchpad and never copied to evidence** — copied now, demo-list token redacted, as `r-sim-*` (14 PNG, 14 consoles, session log, `r-sim-n-appgroup.txt`, `r-sim-README.txt`) |

Nothing after 01:30:43. The predecessors also wrote `tools/drive.mjs` (mean linear panel drive of a PNG, the clock's white glyph box, the colour under it) and never ran it.

**What I added** (15:01–15:33 CDT; Node only — no `xcodebuild`, no `swift test`, no simulator; git read-only; `?transport=local` only; no list created; nothing under `todays-five/` or `.tf-worktrees/` touched):

| file | what |
| --- | --- |
| `q-drive-frames.txt` | `tools/drive.mjs` over HEAD's committed `apple/shots/watch/today-{dark,paper,terminal}.png` (416×496, `b6ce079`) and over `a4f180a`'s own `today-kit-*.png`, extracted with `git show a4f180a:<path>` |
| `r-drive-sim.txt` | the same instrument over the 14 simulator frames of the predecessors' session (374×446, the 42 mm case) |
| `q-surprise-ink3.txt` + `tools/surprise-ink3.mjs` | 2,000 `surprise()` themes per seed (4242, 20260907, `Math.random`): accent < 3:1 and danger < 4.5:1 on `--ink-3` at HEAD |
| `q-scrim-contrast.txt` + `tools/scrim-contrast.mjs` | white on every kit's `ink` and on its `text` (the `ClockScrim` fill), with `theme.js`'s own `contrast()` |
| `q-font-bytes.txt` | `stat -f %z` sums: the 33 `.ttf`, the 26 `.woff2`, the predecessors' 26 un-instanced conversions; `UIAppFonts` and `pbxproj` counts |
| `q-polld-fg-dead.txt`, `q-polld-fg-dead-{20260907,11}.json` | the condition the predecessors did not run: `BASE=http://127.0.0.1:8893/ node tools/polld.js --trials 10 --only fg-dead --seed <s>`, server `node tools/serve.js 8893 .` started and killed inside the same command (verified stopped) |
| `q-shapes-literals.txt`, `q-shapes-and-pairs.txt` + tools | the `shapes` literal each `kit()` block carries; which pairs the 16 open kits name |

Baseline tallies (`review/raw/baseline.md`, `review/raw/baseline/`) are reused, not re-run: Node 136 ok-lines, `swift test` 130 in 10 suites, five `xcodebuild`s including the archive with zero warnings, `-TFFontSelfTest 96/96`, `-TFConfettiSelfTest 96/96`, `-TFFaceProbe`, `-TFThemeSet` ×3.

## 1. Findings

No blocker. Three bugs — all in what the record says, none in what the code does — thirteen papercuts, and the design calls in §3. Repairs are proposed only for files **not** on Phase 5's overlap list (`project.pbxproj`, `TodayView.swift`, `WatchApp.swift`, `Complications.swift`, `WatchSnapshot.swift`, `KitFixtureTests.swift`, `TodayOpsTests.swift`, `WatchLinkTests.swift`, `sync.js`, `test/sync.test.js`, `AddFlowView.swift`, `WatchDictation.swift`, `ListPickerView.swift`, `WatchStore.swift`, `AddToTodaysFive.swift`, `WatchDiagnostics.swift`); for those the entry is a write-up.

### Bugs

**B1 — "Surprise me over 2,000 themes moved 0" measures a population that cannot fail, and it is the number the next release note would be written from.**
- Where: `apple/PLAN-apple-phase4.md:505-508`; commit `fb018ce` ("Against what the builder actually produces — Surprise me, 2,000 themes — it is zero, and zero for the four real-shaped T2 codes").
- Claimed: the pulled `derive()` floor fix (`0c83a5d`, parked on `derive-ink3-next`) moves 0 of 2,000 Surprise-me themes and 0 of 4 real codes; "the ~47 % figure came from uniform-random hex, which is the wrong denominator."
- Measured now: `node review/raw/kits/tools/surprise-ink3.mjs theme.js` at HEAD → **0 / 2,000 accents under 3:1 on `--ink-3`** on both seeds and with `Math.random` (worst 3.108, 3.125). So the sentence is literally true — and it is true because `surprise()` draws L in 0.68–0.80 (dark) / 0.45–0.58 (light) at C ≥ 0.10 (`theme.js:630-645`), which starts above the region that fails, so it cannot emit a failing accent and says nothing about the fix. The builder's actual input is an OS colour picker plus a hex field — the whole cube — and on that population the predecessors' `tools/derive-ink3.mjs` (`p-derive-ink3.txt`) gives **1,137–1,142 / 3,000 dark (37.9 %) and 1,681–1,686 / 3,000 light (56.0 %)** under floor at HEAD, worst 2.18 / 2.45 — the same figures `derive()`'s own doc comment and `DECISIONS-apple.md:962-963` carry. And inside the Surprise-me population, **416–423 / 2,000 have `danger` under 4.5:1 on `--ink-3`** (dark only; light 0), which the same parked commit also re-grounds (`git diff 7341981..derive-ink3-next -- theme.js`: `c.danger = ensure(…, c.ink3, 4.5, …)`), so even Surprise-me does not "move 0".
- The round found this itself, after the range: `derive-ink3-next` at `3adf295` ("The real numbers … the framing was wrong, not the fix") reports an exhaustive census — 38.4 % dark, 56.4 % light, three of the four `T2:` codes move. That correction lives only on the unmerged branch; `PLAN-apple-phase4.md` at HEAD still says 0.
- What the instruments cannot see: how many saved `T2:` codes exist in real documents (none are in the repo's fixtures).
- Evidence: `q-surprise-ink3.txt`, `p-derive-ink3.txt`, `git show 3adf295`.
- Repair: replace PLAN:505-508 with the census figures and one sentence — "`surprise()` cannot produce a failing accent, so it measures nothing here" — and keep the ships-alone decision (right; §3 D2). Both sides: the 0 costs nothing today because nothing has shipped from it; left standing it becomes the risk statement of the next build. A doc edit; not on the overlap list.

**B2 — The decision record still says the white clock is an accepted, unfixable cost; the shipped build has a scrim.**
- Where: `apple/README.md:447-449` ("the two things it cost that nobody can fix — the system clock stays white on a light kit's ground …"); `apple/PLAN-apple-phase4.md:256` ("no API to change it — accepted, in writing") and `:473` ("1.12:1, which no API can change"); `apple/DECISIONS-apple.md:1321-1326` ("A light kit on this device ships with an illegible clock. Accepted, in writing"). `ed89bd7` ("The white clock gets something to sit on") changed **only** `WatchTheme.swift` (+66): `grep -in scrim` over DECISIONS, README, both PLANs and CHANGELOG finds nothing but an unrelated word.
- Measured: `r-drive-sim.txt` — on the review pair's build at 7341981 the clock on Paper sits on `#1F1B16` (the kit's `text`, 1,252–1,255 px of it in the glyph box) → white on it **17.12:1**; on Harbor `#123A3E` → **12.35:1**; Dark and Terminal carry no patch (ground `#070A08` under the clock, 19.89:1). `q-scrim-contrast.txt`: light 8.29, blush 15.89, teletype 15.88, sketch 14.29, birthday 16.19 — `ed89bd7`'s "paper 17.12, light 8.29, terminal unchanged" holds. `WatchTheme.swift:643-667` carries the whole argument; the record the round calls "the record they belong in" (`70d29ea`) does not.
- The round's own rule, from the same document (`DECISIONS-apple.md:950-951`): "when a change reverses a decision, rewrite the paragraph that argued for it. A stale block beside correct code is worse than no block."
- Evidence: `r-drive-sim.txt`, `q-scrim-contrast.txt`, `git show --stat ed89bd7`.
- Repair: a Track C stage-3 entry in DECISIONS (the `ed89bd7` message is already written in that register — it names the alternatives it measured and rejected), and one clause each in README:448 and PLAN:256/473. Both sides: the code comment is complete on its own; the cost of leaving the record contradicting it is that the next reader of DECISIONS believes a light kit ships illegible. None of the three files is on the overlap list.

**B3 — `Kit.shapes`'s doc comment teaches a shape vocabulary that is wrong on every entry — the exact confusion behind the round's "one real defect" — and the folded DECISIONS still says that defect is unfixed.**
- Where: `apple/TodaysFiveCore/Sources/TodaysFiveCore/Kits.swift:164-165` — "Which shapes the finale throws: 1 dot, 2 ribbon, 3 heart/star, 4 the Birthday set — `fx.js` is the reference." `fx.js:2-4`: as a list, **0 ribbon, 1 heart, 2 star, 3 sparkle, 4 sprinkle**; as a count, 1 ribbons, 2 +hearts, 3 +stars. Neither reading matches the comment. And `apple/DECISIONS-apple.md:1803-1804` ("`Kit.shapes` is still a flattened union … not fixed at the source") contradicts `:1539-1594` ("… and now it does") in the same file; both were folded in by `3ac91b2`, the commit that fixed it at the generator.
- Measured: `q-shapes-and-pairs.txt` — the fixture at HEAD holds 12 kits at `[0]`, pink/dusk/blush `[0,1,2]`, sunset `[0,1]`, superpink `[1,2,3]`, birthday `[4]`; the baseline's confetti self-test drew exactly those (`review/raw/baseline/watch-confetti-selftest.log`, 16/16 "drew" = "shapes"). The code is right; the comment would send a reader to the wrong table.
- Evidence: `q-shapes-literals.txt`, `q-shapes-and-pairs.txt`; `fx.js:1-4`.
- Repair: rewrite the comment to `fx.js`'s list vocabulary; delete DECISIONS:1803-1804 or append "— fixed at `3ac91b2`". Both sides: two doc edits; the failure mode of leaving it is a future "fix" to a renderer against the wrong meaning, which is precisely how the fifteen-kits (in fact sixteen, P12) bug happened. Neither file is on the overlap list.

### Papercuts

**P1 — "`cssText()` moved on exactly two of the eighteen kits": three.**
- Where: `DECISIONS-apple.md:931-932`; `PLAN-apple-phase4.md:430` and `:549-550` (which then describes Light's change itself at `:559-562`).
- Measured: `tools/csstext-diff.mjs <base theme.js> <head theme.js>` (`a-csstext-diff.txt`): **3 of 18 differ** — paper 7 tokens, terminal 8, **light 1 (`--danger: #B8402A → #B13924`)**; 15 byte-identical (dark 856 B … superpink 1,014 B). "Only three kits carried `#A86014`" holds (dark, paper, terminal at base; dark at head).
- Repair: "three — Paper and Terminal's accent families, and one token on Light". The user-facing sentence "fifteen of eighteen see nothing" is right and can stay.

**P2 — `-TFFontSelfTest 98/98` and `-TFConfettiSelfTest 108/108` are the tallies with the Secret pair injected; the record does not say so, and its own "final tally" says 96/96.**
- Where: `PLAN-apple-phase4.md:425`; `fb018ce`; against `DECISIONS-apple.md:1278-1281` (`faces=33 end pass=96/96`).
- Measured from the code, not the write-up: `WatchTheme.swift:734-793` counts 1 (bundled) + 2 per distinct face (33 → 66) + 1 per pair whose two ui faces differ (13) + 1 per kit this device may render → **96 with 16 kits, 98 with 18**; `TodayView.swift:684-758` counts 6 per kit → **96 / 108**. `tools/selftest-counts.mjs` derives the same from the fixtures (`m-selftest-counts.txt`). The baseline ran both at `unlocked=0 offered=16` → **96/96 and 96/96** (`review/raw/baseline/watch-font-selftest.log`, `watch-confetti-selftest.log`); every launch on this review printed `offered=16`.
- What cannot be seen: the injected state — nobody on this review put the pair into the group container.
- Repair (write-up; `TodayView.swift` is on the overlap list but needs no change): PLAN:425 → "96/96 and 96/96; 98/98 and 108/108 with the Secret pair unlocked". As written a verifier reads 96 as a regression.

**P3 — The panel-drive ratio has three values in three homes; the two in code and the README are the one the round itself said the method cannot support.**
- Where: `WatchTheme.swift:36-37` and `README.md:449` "about 17×"; `DECISIONS-apple.md:1344-1368` and `PLAN:471` "27.5–27.6×" (dark 0.0285, cream 0.7868); `PLAN:261` (checkpoint) "17.5×" (dark 0.0466, cream 0.8146). Same method every time — mean per-channel linear drive at γ 2.2, cream ÷ dark — so the denominator is always the dark frame's drive, and that is what moved (0.0466 → 0.0285), not the cream (0.8146 → 0.7868, 3.5 %).
- Measured: `node review/raw/kits/tools/drive.mjs <png> <ground> <scrim>` — on `a4f180a`'s own frames: dark **0.0285**, terminal **0.0284**, paper **0.7868**, ground share 51.1 % = 105,390 / 105,373 / 105,401 of 206,336 — DECISIONS reproduced to every digit (`q-drive-frames.txt`). On HEAD's committed stage-2 frames: 0.0289 / 0.0289 / 0.7869 → 27.2×. On the review's own 42 mm frames, three launches each: **0.0380 / 0.0379 / 0.7214 → 19.0× flat, 18.9× Rec.709, 19.6× max-channel**, identical across the three launches (`r-drive-sim.txt`). The 17.5× frames were never committed and cannot be re-measured; `c-clock-contrast.txt` is about the clock, not drive, and does not bear on this.
- Verdict: 27.6× is reproducible on its inputs; the quantity is not stable (19–28× over three frame sets, and the round's own paragraph says why); "about 17×" is the number that survives nowhere.
- Repair: `WatchTheme.swift:36-37` and `README.md:449` → "one to two orders of magnitude (19–28× on three frame sets)" and point at DECISIONS "Paper's ground, measured" instead of the missing C1 file (P4). Both sides: one number reads cleaner; it is the wrong kind of number. Neither file is on the overlap list.

**P4 — Four dangling references to `apple/DECISIONS-phase4-C1.md` / `C2.md`, deleted by `3ac91b2` (not `70d29ea`, which folded A, B and D).**
- Where: `WatchTheme.swift:37`; `README.md:447`, `:454`; `DECISIONS-apple.md:1394` ("Stage 1 is [`DECISIONS-phase4-C1.md`] and this does not repeat it" — stage 1 is now `:1200-1387` of the same file).
- Measured: `ls` (absent); `git log --all -- apple/DECISIONS-phase4-C1.md apple/DECISIONS-phase4-C2.md` → `3ac91b2` last (−188 / −412, +606 to DECISIONS); `grep -rn DECISIONS-phase4-C` → exactly these four.
- Repair: point at the headings "Track C, stage 1 / stage 2". Not on the overlap list.

**P5 — `WatchTheme.swift:31-32` gives Paper's white-on-cream as 1.06:1; Paper is 1.12, 1.06 is Light — the same file says so at `:648-649`.**
- Measured: `tools/clock-contrast.mjs` (`c-clock-contrast.txt`) light 1.0607 … paper 1.1158; the pixels on both Paper frames read `#F7F2E8` under a `(255,255,255)` glyph → 1.12 (`q-drive-frames.txt`). `ed89bd7` corrected the framing; the file header was not updated.
- Repair: "1.12:1 — and Light, the worst of the seven, 1.06". Not on the overlap list.

**P6 — "62 of the 314 hex tokens appear nowhere in the source" was true at the base; at HEAD it is 58.**
- Where (six homes): `Kits.swift:9`, `KitsGen.swift:5`, `test/tools/gen-kits.mjs:6`, `README.md:45`, `DECISIONS-apple.md:1078`, `test/theme.test.js:504`.
- Measured: `tools/hex-314.mjs` (`e-hex-314.txt`) — population = 16 hex tokens × 18 kits (288) + the 26 bare-hex `boxDoneBg`/`strikeBg`/`barBg` = **314** at both commits; absent from the source **62 at 4962f97, 58 at 7341981** (the accent revert made four of Paper's and Terminal's family hexes literal again). "Every kit has at least one" holds, 18/18 (`e-hex-population.txt`: dark 11 of 16, harbor 8, every `hairSolid`).
- The argument holds at either number. Repair: "58 of 314 (62 before the accent revert)" or keep only "every kit has at least one". None on the overlap list.

**P7 — "33 static faces, 1.3 MB": 1,238,128 B = 1.24 MB = 1.18 MiB; and the plan mixes units.**
- Where: `DECISIONS-apple.md:1169`, `PLAN:458`; `PLAN:35-36` "26 faces, 732 KB of woff2 → 1.54 MB of TTF".
- Measured (`q-font-bytes.txt`, `stat -f %z`): 33 `.ttf` = 1,238,128 B (= `watch-fonts.json` totals); 26 `.woff2` = 732,924 B = 732.9 KB (holds, decimal); the predecessors' 26 un-instanced conversions = 1,610,380 B = **1.61 MB = 1.54 MiB** (so "1.54 MB" is MiB); the 24 sources actually used = 704,776 B. `UIAppFonts` 33 entries in `apple/TodaysFive/Config/WatchInfo.plist`; 132 `.ttf` lines in `project.pbxproj` (33 × 4).
- Repair: "1.24 MB (1.18 MiB)"; one unit throughout. Not on the overlap list.

**P8 — `WatchFaceType.register` returns `files.count`; the face probe's `registered=33` is a file count; DECISIONS names the plural API the code no longer calls.**
- Where: `apple/TodaysFive/Shared/WatchSnapshot.swift:215-237` — singular `[REDACTED]` per file, result and error discarded, `return files.count`; `DECISIONS-apple.md:1697` writes `[REDACTED](_:.process:_:)`; `a902805` made the switch and says so ("the count returned stays what it was: how many faces are on disk").
- Measured: code read; the predecessors' `tools/ctfont-resolve.swift` does count outcomes (33 registered, 0 already, 0 failed on macOS) — the app's probe cannot.
- What cannot be seen: the appex's registrations on a device (inside the app they all answer already-registered, by design).
- **`WatchSnapshot.swift` is on the overlap list — write-up only.** DECISIONS:1697 → the singular name; the probe's field → `filesOnDisk=`, or count `true` and already-registered separately so a real failure shows. Both sides: the current return is honest inside the app; in the appex it hides a failure behind a 33.

**P9 — The Swift drift test prints its success line after recording the failure.**
- Where: `KitFixtureTests.swift:65-79` — `Issue.record(…)` inside the `if`, then an unconditional `print("drift: live theme.js reproduced the fixture — …")`.
- Measured: `d-mutation-swift.log:143-146` — `✘ … parted company (terminal)` followed by `drift: live theme.js reproduced the fixture — 21396 bytes, 18 kits, 13 pairs`. The test does fail (exit 1) — the guard works; the log lies.
- **On the overlap list — write-up only:** `return` after `Issue.record`, or print "did not reproduce".

**P10 — `Kits.swift:99-100` "twelve of the twenty-two resolve to something else"; the round's number is ten; the shipped statics give eighteen on this macOS.**
- Measured: `swift tools/ctfont-resolve.swift <Fonts dir> <watch-fonts.json>` (macOS CoreText, after registering the files for the process) — against the 26 un-instanced conversions (the checkpoint's experiment, rebuilt by the predecessors in `scratchpad/kits/ttf26`): **10 of 22** CSS names → Helvetica, the same ten `DECISIONS:1150` lists (`f-ctfont-resolve-26.txt`); against the shipped 33 statics: **18 of 22** (`f-ctfont-resolve-33.txt`); "12" is a third count — CSS names that differ from the family name inside the file (`m-selftest-counts.txt`, twelve listed).
- What cannot be seen: watchOS's CoreText answer (the self-test never asks by CSS name, so nothing shipped can be wrong this way).
- The design conclusion — read the names out of the binaries — holds, and the shipped-set number makes it stronger. Repair: "ten of twenty-two in the round's experiment; eighteen of twenty-two for the shipped statics on macOS". Not on the overlap list.

**P11 — `secretKitsAreAbsent`'s comment claims "every hex the two Secret kits carry, against every hex in the table"; it checks six tokens, and could not check all — Birthday's `danger #B93225` is Blush's `danger`.**
- Where: `KitFixtureTests.swift:160-177`. Measured: `e-hex-population.txt` (blush `danger=#B93225`, birthday `danger=#B93225`). **On the overlap list — write-up only:** say "the six identifying tokens" and why `danger` is excluded.

**P12 — "fifteen of the eighteen kits read as hearts-only": twelve did; sixteen were misread.**
- Where: `DECISIONS-apple.md:1558`; `3ac91b2`'s message; `test/tools/gen-kits.mjs:33`.
- Measured: `tools/shapes-literals.mjs` (`q-shapes-literals.txt`) — 12 kits carry no `shapes` (→ count 1 → the old `[t.shapes]` gave `[1]` = hearts only); pink, dusk, blush carry `3` (→ `[3]` sparkle only), sunset `2` (→ `[2]` star only); superpink and birthday are lists. **12 hearts-only; 16 of 18 misread.**
- Repair: "sixteen misread — twelve as hearts-only". Not on the overlap list.

**P13 — "Node 137" (`948a905`, `1aada68`): the baseline counted 136.**
- `review/raw/baseline/node-*.log`: model 28 + theme 33 + crypto 10 + sync 14 + sound 12 + features 30 + compat 9 = **136** ok-lines (`baseline.md:37`); `PLAN:421` says 136. The baseline track's domain; recorded because two commit messages in range carry 137.

**P14 — Two picker-persistence checks in the record are weaker than they read.**
- `README.md:387` and `DECISIONS-apple.md:1456-1468` say persistence was "verified across a cold launch" with `day:harbor` — true, and reproduced here (`r-sim-k-A.console` → `r-sim-k-B.console`: `slot=day day=harbor night=terminal → kit=harbor` on a bare relaunch after `simctl terminate`). But the baseline track's own run (`watch-themeset-day-paper.log` → `night:terminal` → readback) chose the two default kits and the default slot (`WatchThemeStore.init`: `?? "paper"`, `?? "terminal"`, `?? .night`, `WatchTheme.swift:387-389`), so its readback cannot distinguish "persisted" from "fresh". Not a code defect; a note for whoever re-runs it: use a non-default id and the non-default slot (`day`).

### Not findings — settled, recorded so nobody re-derives them
- `PALETTE_REV` = `1ptwfkh` in `theme.js`, `index.html`, `about.html`; the boot guard is in both pages; the stamp hashes all 18 kits including the Secret pair (`j-palette-rev.txt`). A Terminal-accent mutation moved it to `1m520bw`, a Sunset-`ink2` mutation to `1dg76d4`, and `features.test.js` failed on both (`d-mutation-node.txt`, `d-mutation2-node.txt`). Holds.
- The drift test: both mutations failed `theme.test.js` at the `parted company` assertion; the Swift suite failed with "parted company (terminal)" (`d-mutation-swift.log`); `gen-kits.mjs` on HEAD writes a fixture byte-identical to the committed one (`e-gen-kits.txt`: 252 assertions cleared, tightest light dim on ink 4.500). Holds — the fixture cannot go stale silently while either suite is run.
- The accent revert is a restoration: `paper`/`terminal` RAW `accent/accentHi/accentDeep/accentText` equal `curated()`'s after `finalize()` (`g-accent-contrast.txt`, `unchanged=true` ×2). Holds for the four hexes per kit the instrument reaches; `glow`/`strikeShadow` are strings built from `accent`.
- The Secret kits ride `WatchLinkPayload.extra["kits"]`, inserted sorted, read sorted (`WatchLink.swift:104-130`); the table holds 16, the types 13, `fredoka`/`baloo` used by the Secret pair only (`q-shapes-and-pairs.txt`: the 16 open kits name 11 of 13 pairs). Holds.

## 2. Claims table

Every number or checkable assertion in the Phase 4 write-ups that this track could reach. "Then" is how the round measured it; "now" is the instrument and file here.

| # | claimed | where | measured then | measured now | verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | only three kits carry `#A86014` (dark, paper, terminal) | PLAN:118, DECISIONS:1217 | grep | `csstext-diff.mjs`: cssText carriers dark/paper/terminal at base, dark at head (`a-`) | holds |
| 2 | `cssText()` moved on exactly two kits | DECISIONS:931, PLAN:430/549 | cssText diff | 3 of 18 — light's `--danger` too (`a-`) | doesn't (P1) |
| 3 | fifteen of eighteen byte-identical | PLAN:548 | same | 15 (`a-`) | holds |
| 4 | terminal accent 4.12→13.29 on `--ink`, 3.48→11.22 on `--ink-3` | PLAN:125/434, `176e022` | `contrast()` | `accent-contrast.mjs`: 4.1178→13.2924, 3.4762→11.2212 (`g-`) | holds |
| 5 | paper 4.33→4.79, 3.48→3.85 | PLAN:126/435 | same | 4.3284→4.7867, 3.4793→3.8477 (`g-`) | holds |
| 6 | dark unchanged 4.12 / 3.48 | PLAN:127 | same | 4.1178 / 3.4762 at both commits (`g-`) | holds |
| 7 | light.danger `#B8402A` 4.12 → `#B13924` 4.5050 on `--ink-3`; 5.2034→5.6889 on `--ink` | DECISIONS:987/994, `2dbdfd9` | same | 4.1205→4.5050; 5.2034→5.6889 (`g-`) | holds |
| 8 | light accent on `--ink-3` 3.0016; pink accentText 4.5069 | DECISIONS:1005, PLAN:153/448 | same | 3.0016; 4.5069 (`g-`; the Swift suite prints 3.0016, `d-mutation-swift.log:139`) | holds |
| 9 | `finalize()` returns the six reverted hexes unchanged | PLAN:129/438, DECISIONS:929 | fix3 by hand | RAW == curated for accent/accentHi/accentDeep/accentText, paper and terminal (`g-`) | holds (4 of 6 per kit reachable) |
| 10 | 14 floors × 18 kits = 252 cleared; tightest light dim on ink 4.500; danger/ink3 worst light 4.5050 | `2dbdfd9`, gen-kits output | generator | `gen-kits.mjs` on a scratch copy: identical output, fixture byte-identical (`e-gen-kits.txt`) | holds |
| 11 | 288 hex tokens, 96 confetti colours | gen-kits output | generator | same (`e-gen-kits.txt`) | holds |
| 12 | 62 of 314 hex tokens absent; every kit ≥ 1 | Kits.swift:9, KitsGen.swift:5, gen-kits.mjs:6, README:45, DECISIONS:1078, theme.test.js:504 | ad hoc | `hex-314.mjs`: 314 = 288 + 26; absent 62 @base, **58 @HEAD**; 18/18 kits (`e-hex-314.txt`, `e-hex-population.txt`) | 314 and ≥1 hold; 62 held at the base, 58 now (P6) |
| 13 | `JSON.stringify(CURATED)` 17,674 B; ~6 ms in a JSContext | PLAN:98, DECISIONS:1106 | JSC | `json-sizes.mjs`: 17,674 @base, **17,676 @HEAD**; the drift object 21,396 = the Swift log (`o-json-sizes.txt`) | 17,674 held at the checkpoint; 6 ms can't (no swift test here) |
| 14 | `KitFixtureTests` fails when a colour drifts; so does `theme.test.js` | PLAN:216-223, `295134a` | the integration failure | mutations 1 and 2: Node theme + features fail; Swift "parted company (terminal)" (`d-*`) | holds (P9: the success line prints too) |
| 15 | `PALETTE_REV` in both pages, boot guard, features enforces; stamp moves with a palette | `59ef2ee`, `948a905` | features test | `palette-rev.mjs`: 1ptwfkh ×3, guard ×2; mutations moved it and features failed (`j-`, `d-*`) | holds |
| 16 | `mark.mjs --trace` 0.30 % at HEAD, 93.84 % at the base, 1.60 % before 1.11 | README:269/275; PLAN:179 | run | 0.30 exit 0 @HEAD; 93.84 exit 1 @base (`h-mark-trace.txt`) | holds; PLAN:179's "1.60 — verified" was the plan's expectation, corrected by `7a8936c` |
| 17 | `kitshots.js`: 18 kits in 9.4 s; plan's "about 20 seconds" | DECISIONS:906; PLAN:186 | one run | 9.07 / 9.06 / 9.02 s, 18 shots each (`o-kitshots-timing.txt`) | 9.4 holds (±4 %); 20 s was the estimate |
| 18 | 33 faces, 1.3 MB; 26 faces 732 KB woff2 → 1.54 MB TTF; Google's 6.23 MB | DECISIONS:1169, PLAN:35-36/458 | du | 1,238,128 B = 1.24 MB / 1.18 MiB; 732,924 B; 1,610,380 B = 1.61 MB = 1.54 MiB (`q-font-bytes.txt`) | 33 holds; 1.3 doesn't; 732 holds; 1.54 is MiB; 6.23 can't (no network) |
| 19 | 10 of 22 CSS families → Helvetica (the named ten) | PLAN:47, DECISIONS:1150; Kits.swift:100 says twelve | CoreText on 26 conversions | macOS CoreText: 26 conversions → the same ten; shipped 33 → 18; "12" = names that differ (`f-*`, `m-`) | holds for the experiment; "twelve" doesn't; shipped set 18/22; watchOS can't (P10) |
| 20 | `UIAppFonts` is the whole registration; 33 `.ttf` in the bundle; refs 264–296, build files 436–468, group 312 | `295134a`, PLAN:210-212 | plutil, built product | plist 33 entries; `Fonts/` 33 files; pbxproj 132 `.ttf` lines (`q-font-bytes.txt`) | holds (the id bands not re-checked) |
| 21 | reserved font names: 15 faces / 9 families; all 22 families OFL | `1aada68` | fontTools + google/fonts | `selftest-counts.mjs` over `watch-fonts.json`: 15 of 33, 9 families (`m-`) | 15/9 hold; OFL can't (no network) |
| 22 | `-TFFontSelfTest` 98/98; `-TFConfettiSelfTest` 108/108 | PLAN:425, `fb018ce` | sim, pair injected | count structure from `WatchTheme.swift:734-793` and `TodayView.swift:684-758`: 96/98 and 96/108; baseline 96/96 and 96/96 at 16 kits | hold only with 18 kits, unstated (P2) |
| 23 | bundled 33/33; weights told apart advance=12 ink=1; familiesOnDevice=75; the mono pair is the ink one | DECISIONS:1278-1292 | sim | baseline identical lines (`watch-font-selftest.log`) | holds |
| 24 | 17 pt `.title3` scales to 16.00; tracking −0.400; task line height 19.20; extra leading 0.00 | DECISIONS:1255/1260/1282 | 46 mm sim | baseline 42 mm sim: 17.00, −0.425, 20.40, 0.00 | the mechanism holds (em × scaled size = −0.425 at 17.00); the numbers are the 46 mm's |
| 25 | clock: Paper 1.12; the seven light kits 1.06–1.12; the eleven dark 16.0–19.9; `needsClockScrim` selects exactly the seven | `ed89bd7`, WatchTheme.swift:64-68/648-651 | screenshots | `clock-contrast.mjs` (`c-`); glyph `(255,255,255)` on `#F7F2E8` in both Paper frames (`q-drive-frames.txt`) | holds |
| 26 | WatchTheme.swift:32: Paper's cream "about 1.06:1" | WatchTheme.swift:31-32 | — | 1.12; 1.06 is Light (`c-`) | doesn't (P5) |
| 27 | scrim: paper 17.12, light 8.29, terminal unchanged 19.89 with no patch; overlay, not background | `ed89bd7`, WatchTheme.swift:656 | sim probe | arithmetic (`q-scrim-contrast.txt`); the review's frames: `#1F1B16` under the clock on Paper, `#123A3E` on Harbor, none on dark/terminal (`r-drive-sim.txt`) | holds; overlay-vs-background can't |
| 28 | glyph box pt (151,20)–(191,31) on the 46 mm; 76×44 covers it; a first 62×26 did not | WatchTheme.swift:675-679, `ed89bd7` | screenshot | HEAD `today-paper.png` bbox exactly (151,20)–(191,31); the 42 mm sim: (144.5,17.5)–(172,27.5), inside the patch (`q-`, `r-drive-sim`) | holds; 62×26 can't |
| 29 | drive dark 0.0285 / terminal 0.0284 / paper 0.7868; 27.5–27.6×; 51.1 % ground = 105,390 / 105,373 / 105,401 | DECISIONS:1344-1353, `a4f180a` | 416×496 frames | `drive.mjs` on `a4f180a`'s frames: identical to every digit (`q-drive-frames.txt`) | holds on its inputs |
| 30 | drive 17.5× (0.0466 / 0.8146); "about 17×" | PLAN:261; README:449; WatchTheme.swift:36 | checkpoint frames | frames not committed; the review's 42 mm frames 19.0× ×3 (`r-drive-sim.txt`) | can't; superseded (P3) |
| 31 | the three frames are the same layout to the pixel | DECISIONS:1352 | ground share | 51.1 / 51.1 / 51.1 % (a4f180a); 51.0 % ×3 (HEAD); 51.4 / 51.4 / 44.4 % on the 42 mm (the scrim and the smaller case) | holds for the round's frames |
| 32 | polld checkpoint medians 54 s (live) / 32 s (dead); backgrounded never 10/10 | PLAN:89-91 | polld, pre-round | fg-live 132 / 103 / 111 (seeds 20260907 / 11 / 4242, `i-`); fg-dead 16 / 36 (20260907 / 11, `q-polld-fg-dead`); bg not run | 54/32 not reproduced by any seed here; never can't |
| 33 | "three runs gave 132 s and 16 s, and 144 s and 12 s"; maxima 238 vs 240 and 60 vs 60; the 4× ratio | DECISIONS:1929-1938 | polld | seed 20260907: fg-live **132**, fg-dead **16** — exact; the second seed is not named; maxima 238/238/230 and 60/60; median ratios 2.9–8.3×, maxima 3.97× | 132/16 reproduced; 144/12 can't; maxima hold; 4× holds as the ratio of periods and of maxima, not of samples |
| 34 | doorbell condition 0.1 s in all ten | DECISIONS:1967-1968 | polld | 0.1 ×10 (`i-polld-doorbell.json`) | holds |
| 35 | live run: put 0.52 s, the line 0.63 s, 29-byte poll, 138-byte doorbell body | PLAN:523-526, `5cd559f`, DECISIONS:1906 | real backend | not run (no creates); 137/138 pinned in `SyncTests`, green in the baseline's `swift test` | 0.63/0.52/29 can't; 138 holds via the suite |
| 36 | the picker persists across a cold launch (`day:harbor`) | DECISIONS:1456-1462, PLAN:466, README:387 | `-TFThemeSet` | predecessors' k-A → k-B on the review pair: harbor read back after `simctl terminate` (`r-sim-k-*.console`) | holds (P14 on the baseline's own run) |
| 37 | 16 kits in the table, the Secret pair in no binary; 13 pairs incl. `fredoka`/`baloo`; the 16 open kits name 11 pairs | DECISIONS:1178-1180, 1294-1295 | `KitFixtureTests` | baseline `swift test` green (130 / 10 suites); `q-shapes-and-pairs.txt`: 11 of 13, unused fredoka/baloo | holds |
| 38 | injected pair → `unlocked=2 offered=18`; `simctl spawn defaults` lands in the wrong plist | DECISIONS:1727-1742 | plutil into the container | not injected here; every launch `unlocked=0 offered=16` | can't |
| 39 | 222 particles; ends at frame 147 on every kit; ~52 fps; k = 0.310 | DECISIONS:1477/1507/1524-1528 | sim | 7 × 26 + 40 = 222 (`TodayView.swift:305`); baseline: 147 for all 16, k = 0.310, 52.0/s once | 222/147/k hold; fps holds on a Mac at load 150, not on a wrist |
| 40 | face probe: `.fullColor` and `.accented` renderings identical; `facesOnDisk=33 registered=33` | DECISIONS:1623-1626, 1705-1706 | sim | baseline identical (with `#C8321F`); `registered` = `files.count` | holds (P8) |
| 41 | `derive()`: 1,139 / 3,000 dark (worst 2.18), 1,690 / 3,000 light (2.45); danger 1,222 / 3,000 dark, light 0 | DECISIONS:962-963/998, `0c83a5d` | seeded LCG | `derive-ink3.mjs` at HEAD: 1,137–1,142 / 1,681–1,686; worst 2.18 / 2.45; danger 1,210–1,231 / 0 (`p-`) | holds (±5, a different LCG stream) |
| 42 | Surprise me over 2,000 themes moved 0; the four `T2:` codes moved 0 | PLAN:506-507, `fb018ce` | `surprise()` | 0 / 2,000 accents ×3 runs — a population that cannot fail; 416–423 / 2,000 danger under floor; `3adf295`: 38.4 % / 56.4 %, three of four codes move (`q-surprise-ink3.txt`) | the literal accent count holds; as a blast radius doesn't (B1); the four codes can't here |
| 43 | fifteen of eighteen kits read as hearts-only | DECISIONS:1558, `3ac91b2`, gen-kits.mjs:33 | reading | 12 hearts-only, 16 misread (`q-shapes-literals.txt`) | doesn't (P12) |
| 44 | Node 137; `swift test` 130 in 10 suites; e2e4 169/0 at two viewports; both builds zero warnings; the archive | `948a905`, PLAN:421-425 | suites | baseline: 136 ok-lines; 130 in 10 suites; e2e4 169 / 0; five `xcodebuild`s, 0 warnings, ARCHIVE SUCCEEDED | 137 doesn't (136, P13); the rest hold via the baseline |
| 45 | a watchOS device has a 32-bit `Int`; only the archive says so | `923714c` | archive | the baseline's archive at HEAD succeeded (the fix is in); the failing form not re-tried | holds as far as it goes |
| 46 | `WatchLinkPayload.extra` round-trips a nested kit, 394 bytes; keys must be inserted sorted | PLAN:228-231, DECISIONS:1190-1193 | swift test | `WatchLinkTests` in the baseline's green run; 394 asserted nowhere (grep) | sorted-keys holds via the suite; 394 can't |
| 47 | the white clock is an accepted, unfixable cost | README:448, PLAN:256/473, DECISIONS:1321-1326 | — | `ed89bd7` shipped the scrim; measured on the review's frames | stale (B2) |
| 48 | `.listStyle(.carousel)` leaves a ~50 % grey band on every light kit (`#807C75` on Paper) | DECISIONS:1759-1770 | 6 frames | not re-measured (the frames here are the top of the list, in focus) | can't — a wrist item (§4) |
| 49 | the tightest floor after the round: light accent on `--ink-3` 3.0016 against 3.0 (Swift) / light dim on ink 4.500 (generator) | `d-mutation-swift.log:139`, `e-gen-kits.txt` | suites | both printed here | holds (two different floor tables, both true) |

## 3. Design calls

`review/raw/calls.md` (01:07–01:45, the CALLS track) already judges the eight big calls with alternatives and costs; its #3 (fixture + KitsGen + JSC drift test), #4 (33 fonts), #5 (the Watch's own picker), #6 (accent unpin vs ships-alone) and #27 (the scrim) are the ones in this track's scope. I do not repeat them; below is what this track's measurements add to each, and my recommendation where it differs or sharpens.

**D1 — The kit table as a hand-regenerated fixture + `KitsGen` + the JSC drift test** (calls.md #3).
- *What this track adds.* The drift guard was exercised, not read: two mutations, one on a pinned token and one on a token nothing pins, both caught by `theme.test.js` and by `KitFixtureTests` (and, incidentally, by `features.test.js` through the palette stamp — a third net the round did not advertise). The generator refuses to write on a broken palette and reproduces the committed fixture byte for byte. The one honest gap calls.md names — a build that does not run either suite ships a stale table — stands; the hash-stamp fix it proposes (fifteen lines of pure Swift in the plugin) is the right size.
- *Bought:* one source of truth that is actually enforced twice. *Costs now:* two generators, one plugin, a Python dependency to regenerate, and a dozen pinned counts when a nineteenth kit arrives. *Alternative:* parse `theme.js` in the plugin — ruled out by the 58-of-314 arithmetic (a regex would be right on the literals and wrong on every `hairSolid`). *Cost of changing today:* nil for the shape; ~30 lines for the stamp and the pair-data cross-check.
- *Recommendation:* keep; add the stamp. Both sides in calls.md #3.

**D2 — Accent unpin, and the ships-alone rule** (calls.md #6, and this track's B1).
- *What this track adds.* The 216 deploy moved three kits' `cssText`, not two (P1), and the returning-device path was defended by `PALETTE_REV` only between builds 212 and 216 — the stamp is what makes the accent change safe to ship inside a bigger build, and it did ship with it. On the other half of the rule: the change that was held back, `derive-ink3-next`, has a blast radius of **38–56 % of hand-picked accents** (`3adf295`), not 0 — so the round's instinct (ship it alone, with its own note) was right for a stronger reason than its write-up gave, and the write-up at HEAD (B1) would have that note say the wrong thing.
- *Bought:* Terminal's check is Terminal's; the picture in `kitshots` is the finding. *Costs now:* one frame of the old accent on a returning Paper/Terminal device, defended by the stamp. *Alternative:* an accent-only deploy at 202 — which would have gone out without the stamp. *Cost of changing today:* none in code; one written rule in `COMPATIBILITY.md §7` naming the unit it applies to (calls.md's recommendation, which I share).
- *Recommendation:* keep the design; write the rule down; and before `derive-ink3-next` ships, replace PLAN:505-508 with the census so the release note is the true one.

**D3 — Thirty-three faces** (calls.md #4).
- *What this track adds.* The size is 1.24 MB, not 1.3; the un-instanced alternative would have been 1.61 MB (1.54 MiB) and would have left `.weight()` a no-op on Fraunces and Source Serif 4, so instancing to 33 statics is smaller *and* correct. The name-fiction argument is stronger than stated: on the shipped statics 18 of 22 CSS names resolve to Helvetica on macOS (P10). The self-test's count structure (P2) is sound; the one thing it cannot tell you is whether the bold ui weight is visible at 12–16 pt on a wrist (calls.md's "24 files" question).
- *Recommendation:* keep the 33; the 24-file option is a wrist decision. Both sides in calls.md #4.

**D4 — The Watch's own Day/Night picker** (calls.md #5; the scrim is #27).
- *What this track adds.* Persistence across a cold launch holds on a second machine and a second case size (`r-sim-k-*`), and the App Group holds exactly four files (`r-sim-n-appgroup.txt`: the container metadata, the group prefs plist with the three kit keys, one demo list, `snapshot.json`). The scrim is measured on the review's own frames (B2). calls.md's cost — a wrist with no automation, so the second slot is mostly ornamental — is the right one and this track has nothing to add to it.
- *Recommendation:* keep; "follow the phone's slot only" (calls.md's option c) is the honest next question, and it is a separate build.

## 4. Not verified here — and what would

Simulator and device items this track never reached, each with the check in pass/fail form. The first three were on this track's list and are now **verified on the review pair** by the predecessors' recovered session (`r-sim-*`): panel drive (19.0× on the 42 mm, three identical launches), the clock scrim (Paper 17.12:1, Harbor 12.35:1, no patch on dark), the picker persisting across a cold launch (Harbor read back). What remains:

| item | why not here | the check (pass / fail) |
| --- | --- | --- |
| the scrim on a wrist — bar or smudge | a screenshot cannot say whether a 76×44 dark tab on cream reads as a design or a defect | Paper by day on a real Watch, raise the wrist: **pass** if the time is legible and the tab reads as a header bar; **fail** if a person's first remark is the smudge |
| the scrim on the 41 mm and 49 mm cases | only the 46 mm (round) and 42 mm (here) were measured; `WatchTheme.swift:676-678` reasons about the other two | `-TFWatchDemo -TFKit paper` on a 41 mm and a 49 mm simulator, screenshot, `drive.mjs <png> '#F7F2E8' '#1F1B16'`: **pass** if "under/around the clock" is `#1F1B16`; **fail** if any pure-white pixel of the glyph box lies outside the patch |
| the picker by finger | `simctl` cannot tap a watch; `-TFThemeSet` calls the store's methods, not the rows | on a wrist: hold the count, *Theme*, *Day*, choose Harbor, force-quit, relaunch: **pass** if Harbor is on screen and the complication redrew; **fail** otherwise. Then choose Paper again: **pass** if the slot's checkmark moved |
| the Secret pair arriving and leaving | nobody injected it here; `offered=16 unlocked=0` on every launch | unlock on the phone, open the Watch app: **pass** if the picker offers 18 and `-TFKit superpink` resolves; re-lock: **pass** if it offers 16 and a slot left on superpink falls back to that slot's default (`resolved()`), **fail** if the wrist keeps the palette |
| `-TFFontSelfTest` and `-TFConfettiSelfTest` with the pair unlocked | the 98/98 and 108/108 state was never reproduced here | with the pair unlocked, run both: **pass** at exactly 98/98 and 108/108 (the formula in P2); **fail** at any other count |
| the complication on a face | the face editor is unreachable from `simctl` | add the complication to a face on a wrist under Terminal: **pass** if the count is set in IBM Plex Mono SemiBold (numbers, not a ring) and the face's own palette colours it; **fail** if it is the system font (the fallback in `Complications.swift:93-95`) |
| the fonts on a real device | registration and `UIAppFonts` were only ever seen on simulators | `-TFFontSelfTest` on the device: **pass** at 96/96 with `familiesOnDevice` ≥ 33 custom; **fail** on any `FAILED` line |
| Always-On | no launch argument, no `simctl` mode for luminance reduction | on a wrist, finish the list, drop the wrist during the confetti: **pass** if the field parks (no motion) and the ground is the kit's `ink`; **fail** if particles keep moving |
| the carousel's out-of-focus grey on light kits | measured by the round on six frames; not re-measured (the review's frames show the in-focus band) | scroll a Paper list until a row leaves focus, screenshot: **pass** if the row's platter is the kit's `ink2` `#EFE8DA`; **fail** if it is ~`#807C75` (the round's number) — this is a product decision either way (calls.md #12) |
| 222 particles at 60 fps on watch silicon | 52 fps was a Mac at load 150 | `-TFWatchSelfTest` on a device: **pass** if "10 confetti" reports ≥ 55/s; **fail** below 45/s |
| the doorbell on a real socket after suspend/resume | local transport, virtual clock; the one live run used the real backend once (`5cd559f`) | `apple/tools/interop.mjs` step 5b, or: background the phone's page 30 s, tap a line on the Watch, foreground the phone: **pass** if the line appears within the doorbell's second, not the poll's minutes |
| the returning-device first paint on iOS | reported once in the field, not reproduced in five configurations | on a phone that last ran b158 on Paper: open the deployed site; **pass** if `data-tokens-rev` on the page is `1ptwfkh` and the strike is `#C8321F` on the first frame; **fail** if the attribute is absent (it is b158's `app.js` — §6 of COMPATIBILITY) or present with amber (a bug still unfound) |
| the `~6 ms` JSC evaluation and the 394-byte payload | need `swift test`, forbidden here | `swift test --filter KitFixtureTests` prints the drift line; a `WatchLinkTests` assertion on the encoded length would settle 394 |

## 5. Evidence index (`review/raw/kits/`)

| file | what | who |
| --- | --- | --- |
| `a-csstext-diff.txt` | 18 kits' `cssText()` base→head; `#A86014` carriers | predecessors |
| `c-clock-contrast.txt` | white on each kit's `ink`, both formulas | predecessors |
| `d-mutation-node.txt`, `d-mutation2-node.txt`, `d-mutation-swift.log` | the two mutations through Node; the Swift drift test on mutation 1 | predecessors |
| `e-gen-kits.txt`, `e-hex-314.txt`, `e-hex-population.txt` | generator output on a scratch copy; the 314 population; which tokens are computed | predecessors |
| `f-ctfont-resolve*.txt` | macOS CoreText on the shipped 33 and on the 26 conversions | predecessors |
| `g-accent-contrast.txt` | the ratios PLAN/DECISIONS quote, base and head; `finalize()` idempotence | predecessors |
| `h-mark-trace.txt` | `mark.mjs --trace` at HEAD and at the base | predecessors |
| `i-polld-*.json`, `i-polld-run.log` | fg-live ×3 seeds, doorbell; port 8892 | predecessors |
| `j-palette-rev.txt` | the stamp in three files, the guard, the persist line | predecessors |
| `m-selftest-counts.txt` | the self-tests' count structure; the 12 renamed families; reserved names; byte totals | predecessors |
| `o-json-sizes.txt`, `o-kitshots-*` | `JSON.stringify` sizes; kitshots ×3 | predecessors |
| `p-derive-ink3.txt` | `derive()` on 3,000 uniform accents ×2 seeds | predecessors |
| `q-drive-frames.txt` | `drive.mjs` on HEAD's and `a4f180a`'s committed frames | this agent |
| `q-surprise-ink3.txt`, `q-scrim-contrast.txt`, `q-font-bytes.txt`, `q-shapes-literals.txt`, `q-shapes-and-pairs.txt` | see §0 | this agent |
| `q-polld-fg-dead.txt`, `q-polld-fg-dead-*.json` | fg-dead ×2 seeds; port 8893 | this agent |
| `r-sim-*` | the predecessors' simulator session, copied and redacted; `r-sim-README.txt` explains | predecessors (run), this agent (copy) |
| `r-drive-sim.txt` | `drive.mjs` over the 14 simulator frames | this agent |
| `tools/` | every instrument named above, including `sim-session.sh` and `drive.mjs` | both |

Privacy: no list id or secret appears in this report or in the copied evidence; the demo list's token in the App Group listing was replaced with `[demo-list-id]`. A `grep -E '[0-9A-Za-z]{22,}'` over this file matches only HEAD's 40-character commit hash and the two CoreText API identifiers `[REDACTED]`/`…URLs` — hashes and identifiers, not ids.
