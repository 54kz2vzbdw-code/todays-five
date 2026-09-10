# Review — 1.12, Phase 3 and Phase 4, a second look — ROUGH NOTES (stopped mid-way at the owner's request)

Worked from `734198124e6f135287c2c85149f950a07d043ed7` (`origin/main` at 2026-09-10 00:44, the head the
brief expected: `7341981`). Range `0e03143..7341981`: 66 commits, 322 files, 17,748 insertions; the code
diff (docs, screenshots, fonts and fixtures excluded) is about 14,000 lines and was read whole before any
write-up was opened.

Isolation, as run: `git fetch`; worktree `../todays-five-review` on branch `review-1.12` at that commit;
one detached worktree per agent (`todays-five-review-<name>`) at the same commit, each with its own derived
data under `/tmp/tf-review-<name>`; the review's own simulator pair, created and addressed by UDID (now shut
down, not deleted — see "Cleanup still owed"); the archive at `/tmp/tf-review/7341981.xcarchive`; the web
served on ports 8890–8898 with `BASE=` explicit. The clone on `watch-fixes` and the `p5-*` worktrees were
read (`git log/diff/grep`) and never checked out. Builds serialized by `review/tools/build-slot.sh`, the pair
by `review/tools/sim-slot.sh`; `uptime` beside every timed number.

**Stopped 2026-09-10 ~16:10 CDT.** Everything below is what exists; nothing has been polished. Track
reports and evidence are under `review/raw/` (redacted with `watchsim.mjs`'s `safe()` rule before commit,
so identifiers of 22+ characters read `[REDACTED]` — that is the rule striking identifiers, not secrets).
`review/notes/s2-design-calls.md` is the drafted design-calls section (§2), complete.

Environment notes that affect the numbers: an API outage at ~08:50 killed every running agent (five tracks,
three verifiers) — they were relaunched from their own evidence at 14:30; the machine's 1-minute load
reached 624 at 14:30 with swap 11.3/12 GB (Phase 5's e2e4 and simulators plus this review's), so timed
figures from that window are not comparable; the review's own pair boot at 01:17 pushed the load to ~220
and coincides with the window Phase 5 later withdrew its "starved" channel probes from.

---

## 0. What was reviewed, and what was not

Done (reports complete, in `review/raw/`):
- `baseline.md` — the whole battery on the untouched head: nothing red. Node 136 (model 28, theme 33,
  crypto 10, sync 14, sound 12, features 30, compat 9); `swift test` 130 tests / 10 suites, 8.4 s;
  e2e4 169/0 at both viewports (1117 s); iOS/watchOS simulator + device builds and the archive, 0
  warnings; Watch self-tests on the review pair (three runs each: finale `after=0.364/0.331/0.328 s`,
  taps 8/8 `0.713/0.710/0.709 s`, shuffle distinct 5/4/5 sameTwiceInARow 0, confetti 54.5/51.8/52.0 /s,
  theme change true, add 5/5, font 96/96, confetti 96/96, face probe 33/33 registered=files.count).
- `cleanup.md` (1.12 web cleanup, `0e03143..67f35a5`) — verified by `verify-a.md` (all four bugs HOLD)
  and `verify-c.md` (all seven papercuts HOLD). A second opinion on the bugs (verifier B) was running when
  stopped; if `verify-b.md` exists it landed after this note.
- `watch.md` (Phase 3) — F1–F5 verified by `verify-w1.md` (all HOLD; F5 refined). Second opinion (W2, also
  the F1 repair check) was running when stopped.
- `kits.md` (Phase 4) — verifier K1 was running when stopped.
- `ink.md` (`derive-ink3-next`, unshipped) — complete, two independent measurements agree.
- `calls.md` (design calls) — complete; §2 drafted from it in `review/notes/s2-design-calls.md`.
- `claims-web.md` — complete: 154 rows, holds 96 / doesn't 32 / can't 26.
- `claims-apple.md` — landed as this note was being written: 324 rows, holds 227 / doesn't 40 / can't 57
  (its top "doesn't hold": "never a link"; `PLAN4:173-175` "`WebViewController.swift:57` paints `#1A1D21` …
  Fixed" — HEAD `:61` still paints it; the through-the-night claim; the injected tallies; 135/136/137;
  `PLAN4:179` `--trace` 1.60 % vs 93.84 % then / 0.30 % now; "about 17×" also at `TodayView.swift:229`;
  `DECISIONS:1255,1282` 16.00/19.20/−0.400 vs the simulator's 17.00/20.40/−0.425 — a text-size setting;
  `PLAN3:190` footer strings that do not exist; `TextFieldLink` "four initializers" (SDK has 3)).

Not done:
- The completeness critic — never launched.
- Second-opinion verifiers for anything above papercut (rule: two per finding) — only the cleanup bugs (A
  done, B running), Watch F1–F4 (W1 done, W2 running). Nothing from Kits/Ink/claims has a second opinion.
- Repair verification (base vs repair by two verifiers) — none completed for any of the five commits below.
- The post-repair battery, side by side — not run (only per-repair checks: one watch simulator build, the
  sound suite, two e2e4 ONLY-slices).
- The live run (`review/tools/live-doorbell.mjs`, one create, three trials re-measuring `5cd559f`'s
  0.63 s) — NOT run; nothing was created on the real backend by this review (the claims-web predecessor
  fetched the deployed site's static pages once — no create).
- Lighthouse: not installed here; §7 step 6 unverified. §7 step 5's two scripts: not run, unverified.
- Wrist-only items: collected per report (`watch.md` "Wrist only", `kits.md` §4, `calls.md` 4/12/27) —
  not consolidated.

---

## 1. The paragraph (draft)

What I would have done differently, overall: named the instrument I was not using before choosing the one
I was. Three rounds tested the Watch through launch arguments because "`simctl` cannot tap a watch
simulator", and `XCUIAutomation.framework` sat in the watch platform the whole time with `tap`,
`press(forDuration:)` and `perform(handGesture: .doubleTap)` (`API_AVAILABLE(watchos(10.0))`); both of
Phase 5's "looks present, does nothing" bugs are controls nobody pressed. On the web, the 1.12 cleanup
fixed the cross-tab union for `dead` and shipped the same hole for `removed` (a stale tab re-removes a
re-added list), and the suite's assertions for exactly the two things the round said it was careful about
(the repaint on Back; the Undo across a switch) could not fail. The write-ups are the best thing in the
range — they say what an instrument cannot see — and their numbers are the weakest: a byte table from the
wrong commit, a font size in the wrong unit, a self-test tally with the Secret pair injected, a
"moved 0" that measured a population that cannot fail, a 17× that reproduces nowhere. Measure, then write
the sentence; then, when the next call changes what the sentence rests on, re-read it.

---

## 2. Design disagreements

See `review/notes/s2-design-calls.md` (complete draft: the eight, plus 22 of my own, each with bought /
costs / alternative / cost of changing / recommendation / pushback). Recommend change on: 3 (hash-stamp
the fixtures; pair data in one place), 6 (write the ships-alone rule once, apply to the deploy unit), 7
(synchronized folders, archive as judge), 8 (an XCUITest target; correct the Double Tap claim), 9
(`openAppWhenRun = false`), 11 (documents out of the App Group), 17 (ring timeout), 18 (delete
`RealtimeTransport`), 26 (Secret word out of `shots.js`). Genuinely open: 5c, 12, 16. Keep the rest.

---

## 3. Findings so far, ranked (evidence path · verified by)

No blocker.

**Bugs**
1. **C-BUG-1 — a stale tab's `removed` mark re-removes a list another tab re-added.** `app.js`
   `saveDevice()` unions this tab's in-memory `meta.removed` into storage on every save (47 call sites + a
   minute timer); no `storage` listener. Tab A removes, tab B pastes the link back, A's next ordinary save
   removes it again, B's next save drops it from B's own Lists while on screen, reloads ask "Whose list is
   this?" (dismissing files it as "Someone else's"). `review/raw/cleanup/a-crosstab-v2.log`,
   `review/raw/verify-a.md` (reproduced + phone viewport + roles reversed). NOT repaired (see "What's left"
   for the designed fix).
2. **iOS Safari loses the ten-second Undo after Remove / Delete everywhere of the open list when another
   list exists** (my own finding, found while repairing P7; one opinion only). `app.js:2088–2107`
   `switchTo`: when `IOS && !STANDALONE` it reloads the page and returns `undefined`; `panels.js:489` and
   `:994` `await A.switchTo(...)` then raise the Undo toast, which the reload destroys. The harness's phone
   viewport (Mac user agent + touch) takes that path, which is how it showed: toast never raised within 6 s,
   page reloaded, list switched. `review/raw/orchestrator/ios-undo-peek-saved-links.log`,
   `ios-undo-peek-unsaved-next.log`. Standalone / the iPhone shell (`SHELL`) are exempt. Needs a real
   iPhone in Safari to confirm; the code path is unconditional.
3. **W-F1 — the complication goes back to yesterday's count a minute after midnight.**
   `ComplicationsProvider.swift:59–61`: the reload at 00:01 re-reads the stale snapshot and returns the
   unrolled count; the file header, `PLAN-apple-phase3.md:244`, `DECISIONS-apple.md:742–743` claim "right
   through the night". `review/raw/watch/probe.log` (g), `review/raw/verify-w1.md` (HOLDS, other zones,
   days-stale). **Repaired: `93cabdd`** with `review/tools/timeline-probe.sh` (FAIL(8) on base, PASS at the
   repair; watchOS-simulator build 0 warnings). Repair unverified by a second party (W2 was running).
4. **W-F2 — the Watch screen never learns about the line the + or the intent added.**
   `AddCoordinator.onChange` declared (`AddFlowView.swift:53`) and called, assigned nowhere; `WatchStore.add`
   dead and its comment (`:509–510`) false; `AddService.add` runs its own engine, screen refreshes only on
   the next sync occasion; offline the dirty record sits in no engine's memory until relaunch/list switch.
   `review/raw/watch/onchange-grep.txt`, `verify-w1.md` HOLDS. Files on Phase 5's overlap → **For Phase 5**:
   at `watch-fixes` 16cd038 the hook is still declared (`AddFlowView.swift:127`, called `:153/:211`) and
   still assigned nowhere.
5. **C-BUG-2 — a 1.11 tab open across the deploy undoes a 1.12 removal** (its `saveDevice` filters only
   `dead`, writes back `removed: []`); ping-pong; reload reopens. `a2-crossbuild.log`, `verify-a.md` HOLDS
   (both directions). Design/write-up; no repair possible on the 1.11 side.
6. **C-BUG-3 — "This device forgets the link" is false**: `tf/v3/list/<W>` (857 B plaintext, keyed by the
   secret) and the id in `meta.removed` survive past the Undo and reloads; `removeLocal` is only called by
   Delete everywhere and New keys. `verify-a.md` HOLDS exactly. Decision pending (data-loss risk for a
   never-synced list if `removeLocal` is called) — write-up.
7. **W-F3 — the App Group holds the edit secret** (`lists/<W>.json`, filename = document id = W), while
   `PLAN-apple-phase3.md:463–464`, `apple/README.md:478–479` ("never a link") and entitlement comments say
   otherwise; the selected id also in `UserDefaults` (`WatchLinkReceiver.swift:66,106,157`) and the phone's
   open id in `UserDefaults` (`WebViewController.swift:194`); no backup exclusion anywhere.
   `review/raw/watch/appgroup-container.txt`, `verify-w1.md` HOLDS. Design + §8 replacements.
8. **W-F4 — a phone clock ever ahead poisons the link channel for exactly the error**
   (`WatchLinkSender.swift:70`, `WatchLink.swift:300`, persistent `appliedAt`); removals refused silently
   during the outage. `probe.log` (f), `verify-w1.md` HOLDS (10 min / 1 h / 3 days). Admitted at
   `DECISIONS-apple.md:789–799`; fix is a `seq` in `extra` (additive) — write-up.
9. **K-B2 — the record says the white clock over light kits is unfixable; `ed89bd7` shipped a scrim**
   (Paper 17.12:1 measured on the pair). `apple/README.md:447–449`, `PLAN-apple-phase4.md:256,473`,
   `DECISIONS-apple.md:1321–1326`. `review/raw/kits/r-drive-sim.txt`, `q-scrim-contrast.txt`. One opinion.
10. **K-B3 — `Kits.swift:164–165` teaches a `shapes` vocabulary wrong on every entry** vs `fx.js:2–4`;
    `DECISIONS-apple.md:1803–1804` says the union defect is unfixed after `3ac91b2` fixed it.
    `q-shapes-literals.txt`. One opinion.
11. **C-BUG-4 — ‹ Back from the builder on the Night step lands on the Day step**; the `p-theme` opener
    (`panels.js:38`) sets `flow.step = 1` on any frame restore. Correct state is Night with
    `["p-menu","p-theme","p-theme"]`. `b-builder-back.log`, `verify-a.md` HOLDS (Back / Escape /
    history.back, both slots, phone). Low. Not repaired (designed: see "What's left").

**Papercuts** (all verified unless marked)
- C-P5 the 700 ms "chord" attributed to `packs.js` (`sound.js:17,104`, `Haptics.swift:30–35`,
  `WatchHaptics.swift:43,49`, `DECISIONS-apple.md:466,471`, `PLAN.md:1641`) exists only in Arcade;
  Paper→typewriter ends 0.62 s, Terminal→blip 0.28 s; `fx.js` has nothing at 700 (`h-pack-onsets.log`;
  verify-c).
- C-P6 the sound test could not fail for the chord — **repaired `e6f0da4`** (three mutations green on base,
  red at the repair: `review/raw/verify-c/p6-repair-mutations.txt`).
- C-P7 two inert e2e4 assertions — **repaired `2e8384a`** (Back repaint: mutation red,
  `p7a-repair-mutation.log`) and **`705c49f`** (Undo across a real switch: mutation red,
  `p7b-repair-mutation.log`; skipped where the switch is a reload, see bug 2).
- C-P8 `PLAN.md:1731–1734` byte table is `67cdf4b`'s not `67f35a5`'s (app.js +1,610 not +1,423; total
  +2,043 B; `i-gzip-sizes.txt`, `p8-gzip.txt`). Not yet repaired (non-overlap; 10 min).
- C-P9 the FCP/LCP table's script exists nowhere in history (`p9-history-grep.txt`). Write-up.
- C-P10 false comments: `app.js:1790–1791` (menu "is a launcher, not a parent" — measured stack
  `["p-menu","p-settings"]` with Back); `Vault.swift:142–143,169–172` and `VaultTests.swift:283`
  (`archiveList` removed in `67cdf4b`); fourth site `DECISIONS-apple.md:272–276`. Not yet repaired.
- C-P11 Copy link's accent unreachable (`ask()` toggles accent only when `!danger`; sole caller passes
  `danger: true`); grey rgb(143,140,132) beside red Remove in both variants (`p11-copylink-accent.log`).
  Write-up (changes what a person sees).
- W-F5 `afterRollover` under-counts recurring lines: two daily lines → short by two; off-Today rule and
  `return` +1 each; no-zone list keeps 1/5 for six hours while the face says 0/4 (`probe.log` (d), W1).
  `WatchSnapshot.swift` is overlap → write-up.
- W-F6 `-TFWatchSelfTest` prints and never judges; W-F7 three constants duplicated; W-F8 false comments
  (`WatchStore.swift:509`, `WatchLinkReceiver.swift:218`, `watchsim.mjs:779` "1.12 (158)"); W-F9
  `watchsim.mjs` picks a pair by runtime → Phase 5's on this Mac; W-F10 Siri add with the app cold leaves
  the face stale; W-F11 `lastSeenAt` persisted only when details changed.
- K-P1 `cssText()` moved on 3 kits not "exactly two" (Light's `--danger`); K-P2 98/98 and 108/108 are the
  Secret-pair-injected tallies, default 96/96 and 96/96 (`PLAN-apple-phase4.md:425`); K-P3 panel drive
  27.6× reproduces on `a4f180a`'s frames, 19.0× on the review's, "17×" (`WatchTheme.swift:36–37`,
  `README.md:449`) nowhere; K-P4 four dangling `DECISIONS-phase4-C1/C2` refs (deleted by `3ac91b2`);
  K-P5 `WatchTheme.swift:32` gives Light's 1.06 as Paper's (1.12); K-P6 "62 of 314" is 58 at HEAD (six
  homes); K-P7 fonts 1.24 MB not "1.3 MB", "1.54 MB" is MiB; K-P8 `register()` returns `files.count`,
  DECISIONS:1697 names the plural API (overlap); K-P9 drift test prints success after failing (overlap);
  K-P10 "twelve of twenty-two" vs 10 (experiment) vs 18 (shipped statics on macOS); K-P11
  `secretKitsAreAbsent` overstates (overlap); K-P12 "fifteen hearts-only" is 12 (16 misread); K-P13 "Node
  137" is 136; K-P14 picker-persistence proof is the predecessors' `day:harbor` run, not the baseline's.
- Ink 1–11 (`review/raw/ink.md` "Findings"): the PLAN "moved 0" — **repaired `e1a8395`** (also
  1,152/1,687 → 1,139/1,690); no build bump on the branch; the promised COMPATIBILITY §5 line missing;
  `3adf295`'s 2.18:1 is the `--ink-3` figure (ring is on `--ink-2`: main 15/18 fail, min 2.66/2.77; branch
  0/18, min 3.43); `e2e4.js:1309` flaky under load; `#c-contrast` untested; a `T2:` code that does not
  round-trip (pre-existing).
- Claims-web "doesn't hold" (32 rows, `review/raw/claims-web.md`): "52 ms apart" is 26 ms with overlap;
  Node 137/136/135 across commit messages; the 54 s / 32 s medians do not match their own trial lists
  (50 / 29) and are single-harness-state figures; "fifteen … hearts-only" is twelve; "one frame of the old
  accent" superseded by the stamp refusal; "62 of 314" → 58; the chord at 700; README `tools/` list and
  version bullets stale; "688 KB" woff2 is 716 KiB / 733 kB; "six of eighteen light kits" is seven.

**Design / process** (see §2): the accent change shipped inside a five-thing deploy while `derive()` was
held back under the same rule; the Watch picker flips the live slot while the web picker was rewritten not
to; the App Group opened for a reader that does not read it.

---

## 4. Claims table

Per-track tables, each with claimed · where · then · now · verdict: `review/raw/claims-web.md` (154 rows:
96 / 32 / 26), `review/raw/claims-apple.md` (324 rows: 227 / 40 / 57), `review/raw/kits.md` §2,
`review/raw/watch.md` "Claims table", `review/raw/cleanup.md`, `review/raw/ink.md` (a)–(g). Not merged
into one table.
Known-wrong items, what became of each: "0 of 2,000" — still in `PLAN-apple-phase4.md` at HEAD, fixed on
this branch (`e1a8395`); 54 s median (`fb018ce`) — not reproducible under `polld`'s own `median()`,
three seeds now give fg-live 83/131/100 s (claims-web F38); reserved names 15/9 — claims-web/kits say the
new numbers are consistent web-side, Apple side unchecked; the coincidental crash fix and the simulator
lying twice — noted in `calls.md` 30 and `watch.md`, not re-found; `923714c`'s 32-bit Int — the archive
is the only pass that speaks for it (baseline archived: `arm64_32 arm64`).

---

## 5. `derive-ink3-next` (from `review/raw/ink.md`)

(a) 38.4 % / 56.4 % hold as a stride-2 grid census of the picker's hex space (804,483 and 1,182,394 of
2,097,152), not "2,000 themes"; sample 38.0 ± 0.1 / 56.6 ± 0.1; every mover is an accent under 3:1 on
`--ink-3`; `surprise()` cannot reach the failing region (0/2,000 by construction), 5 of 11 repo codes
move. (b) The ring on Remove/Delete sits on `--ink-2`: main fails 15/18 (min 2.66 dark / 2.77 light), the
branch 0/18 (min 3.43); the brief's 2.18 is the `--ink-3` figure. (c) Scope limited: three files, four
`c.ink → c.ink3` edits, `THRESH` + one test, one builder string. (d) Applies cleanly on today's main
(`patch -p1` on an archive: 3 files, exit 0; node suites pass). (e) No re-stamp of `data-tokens-rev` and
none owed (kits don't move); but no build bump on the branch, and `panels.js?v=BUILD` is cache-first, so
as-is an installed PWA gets the new `derive()` with the old builder row. (f) A returning device paints the
old accent ≤ 2 frames then swaps before DOMContentLoaded. (g) The 17/1 slice failure was load
(`e2e4.js:1309` reads a per-frame token twice); 2/0 on re-run. (h) Ship alone, after: build bump (five
homes), the §5 line, PLAN 506–507/157 (done here), a what's-new line, relabel "1.12 b202".

---

## 6. For Phase 5 (mechanisms with evidence; nothing they already have)

- `AddCoordinator.shared.onChange` is still assigned nowhere at `watch-fixes` 16cd038 (declared
  `AddFlowView.swift:127`, called `:153`, `:211`): whatever refreshes Today after an add is not that hook.
  Trace in `review/raw/watch.md` F2 and `verify-w1.md`.
- Offline add: the dirty record is on disk in no engine's memory; the Watch's next online sync pushes its
  stale doc and not the add (`verify-w1.md` F2) — the add reaches the server only after a relaunch or
  list-switch open.
- The demo `+` cannot reach the demo list (`AddService.live()` → Keychain + `SupabaseTransport`, not the
  demo's `MemoryTransport`): the one list a simulator runs is the one the + cannot add to.
- `ringDoorbell()` has no timeout of its own (`SupabaseTransport` sets none; 60 s default) — a hung
  broadcast holds the chained engine; `calls.md` 17. Relevant to the Release-safe ring hook.
- Complication: `SnapshotTimeline.entries` bug and repair (`93cabdd`, not on your files); `afterRollover`
  under-counts (W-F5) — your `WatchSnapshot.swift` is untouched by this branch.
- `XCUIDevice.perform(handGesture: .doubleTap)` is available on watchOS 10 in the simulator platform
  (`review/raw/calls/xcui-watch-platform.txt`): "cannot be injected" is false.
- `watchsim.mjs` picks a pair by runtime and would take yours on this Mac (W-F9).
- Not repeated: the `visibleInterfaceController` header semantics, the DEBUG-only diagnostics, the
  starvation-sensitive probe, the unfocused-window transition (your Track D refuted it).

---

## 7. Wrist list (rough; pass/fail form to be written)

- Face: at 00:01 with the app not run since evening, does the count read 0/(total−done) (repair) — and
  at 09:00?
- Face after a Siri add with the app cold (W-F10): stale until the app opens?
- 24 font files vs 33: is the bold ui weight distinguishable at 12–16 pt on a 41 mm screen (`calls.md` 4)?
- The clock scrim on Paper/Light: a bar or a smudge (`calls.md` 27)?
- The carousel's grey band on the seven light kits (`calls.md` 12)?
- Does `presentTextInputController` flip `scenePhase` (races the intent's own sync; W-F2)?
- The Add complication's URL opening Today (`simctl openurl` refused here: error 115).
- Remove from this device on iOS Safari (not the app) with two lists: is there an Undo? (bug 2)

---

## 8. Exact replacements (to be written; sources)

`DECISIONS-apple.md`: 272–276 (P10 fourth site), 466/471 (chord), 742–743 (F1), 931–932 ("exactly
two"), 1078 (62→58), 1150 (ten/eighteen), 1169 (1.3 MB), 1278–1281 vs PLAN:425 (tallies), 1321–1326
(clock scrim shipped), 1344–1368 (27.6× and the 17.5×), 1394 (C1 ref), 1558 (fifteen→twelve/sixteen),
1697 (plural API), 1803–1804 (union fixed at `3ac91b2`), 789–799 (clock hazard: name the fix).
`README.md` (apple): 45 (62→58), 387 (persistence proof), 447–449 (C1/C2 refs; 17×; clock), 454, 478–479
("never a link"). Old lines are quoted in the track reports (`kits.md` P-items, `watch.md` F3/F8,
`verify-c.md` P10). Overlap list one-line repairs: `WatchStore.swift:509–511`, `WatchLinkReceiver.swift:218`,
`WatchSnapshot.swift` (F5, P8), `KitFixtureTests.swift` (P9, P11), `TodayView.swift` (none needed).

---

## 9. Repairs made on `review-1.12` (all local checks by the orchestrator; none second-verified; none
pushed before this note)

| commit | what | test / instrument | verified |
| --- | --- | --- | --- |
| `93cabdd` | Complication: stale snapshot after midnight shows the rolled count (W-F1) | `review/tools/timeline-probe.sh` FAIL(8) on 7341981 → PASS; watchOS-sim build 0 warnings | finder + W1 on the bug; repair by me only |
| `e6f0da4` | sound test holds the chord buzz to 700 ms and longest (C-P6) | three mutations green on base, red at repair (`verify-c/p6-repair-mutations.txt`) | finder + C on the bug; repair by me only |
| `2e8384a` | e2e4 "repainted on the way back" checks the name (C-P7a) | `paintMenu()` removed → 0/2 (`verify-c/p7a-repair-mutation.log`) | same |
| `e1a8395` | PLAN Phase 4: "moved 0" → census; 1,152/1,687 → 1,139/1,690 | `review/tools/census.mjs` | Ink ×2 + Kits on the numbers |
| `705c49f` | e2e4 Undo after Remove across a real switch (C-P7b) | `await` removed → desktop red (`verify-c/p7b-repair-mutation.log`) | same as P7a |

Web-side repairs went through §7 steps 2 (sound suite only — the other six suites NOT re-run after the
e2e4 edits, they do not read `tools/`), not 3, not 4 (no full e2e4 after repairs). The version is 1.12
and the build number did not move.

---

## 10. What's left, in pieces (rough sizes)

1. Merge the six claims tables into §4 (and check `claims-apple.md`'s 40 "doesn't hold" rows against the
   text-repair list in item 4 — several are new: `WebViewController.swift:61`, `TodayView.swift:229/388`,
   `PLAN4:179`, `DECISIONS:1255,1282`, `README:336`) — 1 h.
2. Second opinions: cleanup bugs (verifier B), Watch F1–F4 + the `93cabdd` repair (W2), Kits (K1) — if
   `verify-b.md` / `verify-w2.md` / `verify-k1.md` are not in `review/raw/`, 1 h each. Ink and claims:
   none exist — 1 h each.
3. Repair verification, two verifiers per commit, base vs repair — 1–2 h for the five.
4. Text repairs still to make (non-overlap files; each 10–20 min with the report's numbers):
   `PLAN.md:1731–1734` (byte table), `PLAN.md:1641` + `sound.js:17,104` + `Haptics.swift:30–35` +
   `WatchHaptics.swift:43,49` (the chord attribution), `app.js:1790–1791`, `Vault.swift:142–143,169–172`,
   `VaultTests.swift:283`, `WatchTheme.swift:31–37`, `Kits.swift:9,99–100,164–165`,
   `test/theme.test.js:504,994`, `test/tools/gen-kits.mjs:6,33`, `PLAN-apple-phase4.md`
   (35–36 units, 256/473 clock, 261 17.5×, 425 tallies, 430/549 "exactly two", 458 "1.3 MB"),
   `apple/tools/watchsim.mjs:779`.
5. `DECISIONS-apple.md` / `apple/README.md` exact old→new replacements (§8) — 1 h; not commits.
6. C-BUG-1 repair (designed, not written): in `saveDevice()`, keep an in-memory `lastWrittenRemoved`
   set; an id in `meta.removed` that this tab wrote before, that storage no longer lists as removed while
   storage's `lists` names it, was re-added by another tab → drop it from `meta.removed` before the
   union; fresh removals (not yet written) are kept. No stored shape changes. Plus an e2e4 test from
   `a-crosstab-v2.mjs`'s scenario; then full e2e4 at both viewports — 2–3 h.
7. C-BUG-4 repair (designed): the builder opener records `flow.returnStep = flow.step`; the `p-theme`
   opener uses `flow.step = flow.returnStep || 1` and clears it — plus `b-builder-back.mjs` as the test —
   1 h.
8. Bug 2 (iOS Undo): decide — persist the pending Undo across the reload (`sessionStorage`), or make
   `switchTo` await the unwind and skip the toast — 2 h + a real iPhone in Safari.
9. C-BUG-3 decision (call `removeLocal` after the Undo window? data-loss for never-synced lists) —
   write-up, 30 min.
10. Post-repair battery side by side (7 Node suites, `swift test`, e2e4 both viewports ~19 min, five
    xcodebuild + archive in series, Watch self-tests on the pair — boot the pair by UDID from
    `/tmp/tf-review/pair.env`) — 1.5 h.
11. The live run: `swift build` for `tfive` (or use `todays-five-review-baseline/.build/debug/tfive`),
    `review/tools/live-doorbell.mjs` — one create, three trials, deleted after — 30 min.
12. Completeness critic over all reports — 1 h.
13. `REVIEW-1.12.md` proper (this file, nine sections) — 2 h.
14. Cleanup still owed: `xcrun simctl delete` the review pair by UDID (`/tmp/tf-review/pair.env`:
    watch `8F30B5F3-…`, phone `BA7707F5-…`, both shut down); `rm -rf /tmp/tf-review/7341981.xcarchive`
    and `/tmp/tf-review-*` derived data; `git worktree remove` each `todays-five-review-<name>` (never
    `prune`); kill any `serve.js` on 8890–8898 left by abandoned agents — 15 min.
