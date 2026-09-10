# verify-c — independent verification of C-P5 … C-P11

```
$ pwd
/Users/pricebrannen/Today's Five/Swift Code
$ git -C "/Users/pricebrannen/Today's Five/todays-five-review-verify-c" rev-parse HEAD
[REDACTED]
```

Two verifiers worked this contract. **The predecessor** (terminated by an API outage) produced everything under
`review/raw/verify-c/` dated 08:57–09:09 (`p5-*`, `p6-*`, `p7-e2e-base.log`, `p7-mutations.diff`, `p8-*`, `p9-*`,
`serve-8898-base.log`) and the scratch copies. **I** (14:37–15:30) read every one of those files, checked the scratch
copies against the worktree, ran the missing P7 mutation runs, P10 and P11, re-measured P6 and P8 myself, and wrote
this report. Each finding below says who ran what. I was not shown the finder's reasoning, only the claims, their
evidence paths and instruments; `review/raw/cleanup.md` was not read.

Environment: worktree detached at 7341981, `git status` clean, git used read-only. Node v24.19.0 from
`~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node`, Playwright + the installed Chrome (headless) from
that runtime's `node_modules`, Apple gzip 479. Port 8898 only; each server was started by me, its PID recorded, and
killed before this report (`serve-8898-mut.pid` 42927, `serve-8898-base2.pid` 43542; `lsof` shows nothing on 8898).
Load average was 28 (1 min) when I started and 6.6 when the last browser run finished; one Chrome-driving script at a
time; no builds, no simulators, no real backend, no list created.

Scratch (`…/scratchpad/verify-c/`): `diff -rq -x .git <worktree> base` → identical. `diff -ru base e2e-mut` → exactly
the two P7 edits (app.js:1956, panels.js:489). Each `mut-*` differs from `base` in exactly the one line recorded in
`p6-mutations.diff` (checked with `diff` per directory).

---

## C-P5 — the 700 ms "chord" exists in one pack of twelve

**Claim.** The 700 ms chord onset that `Haptics.swift:30–35`, `WatchHaptics.swift:43,49`, `sound.js:17,104` and
`apple/DECISIONS-apple.md:466,471` attribute to `packs.js` ("`t0 + 0.7`") exists in only one of the twelve packs
(Arcade); the default packs' finales end far earlier (Knock at 0.255 s); `fx.js`'s `volley()` schedules nothing at
700 ms.

**What was run.**
- Predecessor: the finder's instrument `review/raw/cleanup/tools/h-pack-onsets.mjs` (a stub AudioContext that records
  every `start(t)` a pack's `finish(env)` schedules, relative to t0) against the worktree →
  `p5-finder-instrument-rerun.log`. `cmp` against the finder's `h-pack-onsets.log`: byte-identical. Twelve lines; the
  only pack with a 0.7 onset is `arcade` (last: 0.7); `knock` last 0.255, `bell` 0.55, `blip` 0.28, `typewriter` 0.62,
  `marble` 0.75, `pop` 0.621, `kalimba` 0.64, `pencil` 0.92, `whistle` 0.76, `bongo` 0.72, `cork` 1.36.
- Me, reading `packs.js` (289 lines) pack by pack, the latest scheduled onset in each `finish`:
  knock `t0 + i*0.085`, i ≤ 3 → 0.255 (l.39) · bell `i*0.055`, i ≤ 10 → 0.55 (l.53) · blip `i*0.07`, i ≤ 4 → 0.28
  (l.76) · typewriter `t0 + 0.62` (l.101–102) · marble `t0 + 0.75` (l.124) · pop `i*0.055 + (i%3)*0.008`, i = 11 →
  0.621 (l.138) · kalimba `t0 + 0.64` (l.174) · pencil `t0 + 0.92` (l.199) · whistle `i*0.19`, i ≤ 4 → 0.76 (l.219) ·
  bongo `t0 + 0.72` (l.236) · cork `t0 + 1.36` (l.260) · **arcade `t0 + 0.7`, "the chord, ringing down" (l.280)**.
  `grep -nE '0\.7\b' packs.js` → lines 138, 181, 192, 228, 235, 236, 280; only 280 is a time. My reading agrees with
  the instrument on all twelve.
- Me: `fx.js` `volley()` (l.122–127): seven `burst`s at `i * 65` ms and one at 210 ms; `grep -nE '700|chord|0\.7\b'
  fx.js` → no match.
- Me: `git grep -nE 't0 \+ 0\.7'` at origin/1.1, 1.4, 1.5, 1.9, 1.11 and HEAD — the `t0 + 0.7` chord appears only in
  Arcade's finale, from 1.5 on; no release ever had a chord common to every pack.
- Me, the citations: `Haptics.swift:14` "packs.js's chord", `:30–31` "The chord is `packs.js`'s, at `t0 + 0.7`",
  `:35` `chord = 0.700`; `WatchHaptics.swift:18` "`packs.js`'s chord" but `:43` files it under "From `fx.js`: … and
  the chord at `t0 + 0.7`", `:49` `chordMs = 700`; `DECISIONS-apple.md:466` "the chord — `packs.js`, `t0 + 0.7`",
  `:471` "seven hundred out of `packs.js`"; `sound.js:16–17` puts "the chord at 700 ms" under "the volley's own rhythm
  (fx.js `volley()`)", `:104` "the chord at 700". All four written 2026-09-07 (`git blame`: ee5a1df, 0354b5f).

**Which pack each default kit selects (me, `theme.js`).** `SLOT_DEFAULT = { day: "T1:curated:paper", night:
"T1:curated:terminal" }` (l.685). `kit("paper", …)` (l.272–279) → `{ engine: "typewriter" }` — finale's last onset
0.62 s. `kit("terminal", …)` (l.281–288) → `{ engine: "blip" }` — 0.28 s. Knock (0.255 s) is the engine of Light and
Dark (l.229, 244), which is the pair `tools/e2e4.js`'s `fresh()` pins for the suite (its comment: "1.11 moved the
default pair from Light/Dark to Paper/Terminal"). Arcade is selected only by the Arcade kit (l.365) or a device
override.

**Verdict: HOLDS.** Every one of the twelve packs' latest onsets matches the instrument; 700 ms is Arcade's alone;
`fx.js` has nothing at 700; the shipped default kits' finales are over by 0.62 s and 0.28 s. The claim's framing
"attribute to packs.js" is right for Haptics.swift and DECISIONS-apple.md; `sound.js:17` and `WatchHaptics.swift:43`
actually file the 700 under `fx.js`'s volley, which is a further step from the truth (fx.js has no 700 at all).

**What the instrument cannot see.** It records scheduled `start(t)` times on a stub, not audible output, and runs
`finish` with `P(k, d) => d` (default parameters) — onsets in `packs.js` are constants, so parameters cannot move them,
but audible tails (decay) are not measured. Whether either Apple app plays audio of its own at 0.7 s was not checked;
`git grep -i chord -- 'apple/**/*.swift'` finds only the two haptics files' comments and WatchStore's 300 ms hold.

**Severity.** The strongest haptic event in both apps (iPhone: intensity 1.00 at 0.700 s plus a ring-down to 1.020 s;
Watch: the `.success` tap at 700 ms) and the web's own `FINALE_BUZZ` (a 60 ms buzz after the 296 ms gap, Android) are
timed to a sound that one pack in twelve makes; on the shipped defaults the audio is finished 80–420 ms earlier and the
confetti's last scheduled burst is at 390 ms. `DECISIONS-apple.md:471` ("None of these numbers is invented … seven
hundred out of `packs.js`") is true of 7, 65 and 210 and false of 700 for eleven packs.

---

## C-P6 — the finale test cannot see the chord's gap

**Claim.** `test/sound.test.js`'s 1.12 finale test stays green when `FINALE_BUZZ`'s 296 ms gap becomes 100, while
three other mutations (first buzz 14→20; `fx.js` `i * 65`→`i * 70`; centre burst 210→250) turn it red.

**What was run.** Each in a scratch copy of 7341981 with one line changed (`p6-mutations.diff`; I re-diffed every
copy against `base`), `node test/sound.test.js`:

| copy | edit | predecessor (`p6-run-*.log`) | finder at 67f35a5 (`g-sound-mut-*.log`) | me (`p6-rerun-verifier.txt`) |
| --- | --- | --- | --- | --- |
| base | — | exit 0, "12 sound tests passed" | — | exit 0, 12 passed |
| mut-chord | gap 296 → 100 | **exit 0, 12 passed** | 12 passed | **exit 0, 12 passed** |
| mut-buzz | first buzz 14 → 20 | exit 1 "buzz 1 lands on burst 1 71 !== 65" | same | exit 1, same |
| mut-step | `i * 65` → `i * 70` | exit 1 "buzz 1 lands on burst 1 65 !== 70" | same | (not rerun) |
| mut-centre | 210 → 250 | exit 1 "the centre burst falls inside one of the buzzes" | same | (not rerun) |
| mut-mine-count | 7 bursts → 8 | exit 1 "one buzz per burst, and one more for the chord 8 !== 9" | — | (not rerun) |
| mut-mine-gap1000 | gap 296 → 1000 | **exit 0, 12 passed** | — | **exit 0, 12 passed** |

**Why (me, reading `test/sound.test.js:158–181`).** The test regex-reads `i * 65` and `210` out of `fx.js`, derives
buzz onsets from `FINALE_BUZZ`, asserts each of the seven lands on its burst, that the centre burst falls inside a
longer buzz, and — the only constraint on the chord — `chord > bursts[count - 1]` (l.181): after 390 ms, anything goes.
Nothing in `fx.js` says 700, so there is nothing for the test to hold the chord to: gap 100 puts it at 504 ms, gap 1000
at 1,404 ms, both green.

**Verdict: HOLDS.** The predecessor's runs (which I verified input-by-input) and the finder's agree on all four
outcomes; my own reruns of base, mut-chord, mut-mine-gap1000 and mut-buzz reproduce them.

**What the instrument cannot see.** Whether another suite would catch the chord moving — `test/features.test.js` and
the Swift `-TFSelfTest` ("finale pattern ok duration=1.020s", which checks the Swift table's own arithmetic) were not
run (no builds); nothing found by reading suggests either reads `FINALE_BUZZ`'s last gap.

**Severity.** `sound.js:17–19` and `:104–105` say "test/sound.test.js holds the two together" and "Change fx.js's
volley() and this changes with it" — true for the run and the centre, false for the chord, which has no source in
`fx.js` to be held to. Same root as P5.

---

## C-P7 — two e2e4 assertions cannot fail for what they say

**Claim.** In "‹ Back on every panel ⋯ opens", `assert.ok((await t.page.textContent("#menu-theme-k")).trim().length >
0, "… repainted …")` passes when `paintMenu();` is removed from the `p-menu` opener in `app.js`; in "Remove asks
first …", `assert.ok(!(await t.page.$eval("#toast-undo", e => e.hidden)), "… not hidden behind the switch")` passes
when the `await` is removed from `removeList`'s `await A.switchTo(...)` in `panels.js`, because the test's device
holds one list.

**What was run.**
- Predecessor, un-mutated: `base` served on 8898, `ONLY="Back on every panel"` then `ONLY="Remove asks first"` →
  `p7-e2e-base.log` (09:08:36–09:09:15): each test ok on desktop 1440×900 and phone 390×844, "2 passed, 0 failed",
  exit 0 both.
- Me, mutated. `p7-mutations.diff` (predecessor) is the same two edits as the finder's `m-e2e4-mutations.diff`
  (app.js:1956 opener without `paintMenu()`; panels.js:489 `switchTo` without `await`; the finder's line numbers were
  67f35a5's). Server: `"$NODE" tools/serve.js 8898 "<scratch>/e2e-mut"` (pid 42927, `serve-8898-mut.log`); `curl`
  confirmed the served app.js and panels.js each carry one `MUTATED (verify-c)` marker. Then, from the mutated copy,
  one at a time:

  ```
  cd <scratch>/e2e-mut && BASE=http://127.0.0.1:8898/ ONLY="Back on every panel" "$NODE" tools/e2e4.js
  → p7-e2e-mut-back.log (15:25:14–15:25:35): ok desktop, ok phone — "2 passed, 0 failed", exit=0
  cd <scratch>/e2e-mut && BASE=http://127.0.0.1:8898/ ONLY="Remove asks first" "$NODE" tools/e2e4.js
  → p7-e2e-mut-remove.log (15:25:45–15:26:03): ok desktop, ok phone — "2 passed, 0 failed", exit=0
  ```

  Both mutations SHOULD have turned their test red if the assertions tested what they say. Neither did.

**Mechanism (me, reading).**
- Back: `#menu-theme-k` is written only by `paintMenu()` (`app.js:1963`), which the `#more` click handler calls
  (`app.js:1952`) — the test presses `#more` before every panel (`e2e4.js:2267`), so the row is painted on the way
  *in* and the text persists; the registered opener (`app.js:1956`, the mutated line) is what runs on ‹ Back. The
  assertion `.trim().length > 0` (`e2e4.js:2273`) is satisfied by the earlier paint regardless of the repaint.
- Remove: `fresh()` (`e2e4.js:35–58`: welcome → Keep → save-done) leaves one list; the test asserts `lists.length ===
  0` after Remove (`:2371`) and 1 after Undo (`:2374`); my P11 run reads "lists on this device: 1" at the same point.
  `removeList` (`panels.js:489`) takes `next = meta().lists[0]` → undefined → `A.showWelcome()` (`app.js:581–585`,
  whose `hideToast()` runs before the toast is raised at `panels.js:490`); the `await A.switchTo(...)` branch never
  executes, so its `await` cannot matter on this device.

**The Delete-everywhere test (me).** `e2e4.js:960` "delete this list everywhere, then undo within ten seconds":
`fresh(opts)` → one list; it confirms `#ask-ok`, asserts "welcome after the last list goes" (`:966`), then clicks
`#toast-undo` (`:969`). So it, too, only exercises the `showWelcome()` branch of `panels.js:989–995` — whose comment
says the hidden-Undo bug appeared "whenever there was another list to switch to". The 1.7 design-language test
(`:237–243`) opens the dialog and reads the OK's colour only; the shared-list test (`:2018`) checks `#menu-delete`'s
visibility. No e2e4 test builds a two-list device and removes or deletes the open one.

**Verdict: HOLDS** (both assertions).

**What the instrument cannot see.** Only the two ONLY-filtered tests were run under each mutation (four test
executions in all); whether any of the other 167 tests would go red was not measured (full suite ≈ 20 min; not run
under the load and budget rules). The real regressions the assertions are named for (a stale menu row after a theme
change above the menu; an Undo hidden behind a switch to a second list) were not exercised in a browser.

**Severity.** Test quality, not app behaviour: in the fixture the suite uses, both assertions are tautologies, and the
1.12 regressions they name are unguarded.

---

## C-P8 — PLAN.md's byte table is 67cdf4b's, not the shipped 67f35a5's

**Claim.** `PLAN.md:1731–1734`'s byte table matches gzip −9 sizes at `67cdf4b`, not the shipped `67f35a5` (app.js
+1,610, index.html −14, panels.js +1,467, total +2,043 B).

**What was run.** Predecessor: `p8-gzip.txt`, `p8-appjs-diff-lines.txt`. Me, independently
(`git show <sha>:<file> | gzip -9 | wc -c`, Apple gzip 479, stdin so no filename in the header):

| file | 0e03143 (1.11) | 67cdf4b | 67f35a5 (shipped) | HEAD | Δ@67cdf4b | Δ@67f35a5 | PLAN.md:1731–1733 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| app.js | 48,465 | 49,888 | 50,075 | 50,075 | +1,423 | **+1,610** | +1,423 |
| model.js | 14,329 | 14,685 | 14,685 | 14,685 | +356 | +356 | +356 |
| styles.css | 12,048 | 12,139 | 12,139 | 12,139 | +91 | +91 | +91 |
| index.html | 12,898 | 12,885 | 12,884 | 13,124 | −13 | **−14** | −13 |
| panels.js | 24,907 | 26,373 | 26,374 | 26,735 | +1,466 | **+1,467** | +1,466 |
| critical path (app+model+css+html) | | | | | +1,857 ("+1.86 KB") | **+2,043** | +1.86 KB |

Identical to the predecessor's numbers. `PLAN.md:1700–1740` is unchanged between 67f35a5 and HEAD; `git blame` puts
lines 1706–1734 in 74bf09f (2026-09-07, "Build 157"). Per commit (me): app.js reached 50,075 (+1,610; 71 lines
added / 22 comment-only) at **cc9c7fe — the commit before 74bf09f added the table** — so the app.js figure was already
187 B stale when committed (it is 67cdf4b's app.js: 65 / 18); index.html −13 → −14 at a53bde8 (build 158); panels.js
1,466 → 1,467 at 74bf09f itself. The same paragraph's "Twenty-two of the seventy-one lines added to app.js are
comments" (`:1739`) matches cc9c7fe onward, not 67cdf4b — the bytes and the line counts were taken from different
trees. The predecessor's line counts (71/22 at 67f35a5, 65/18 at 67cdf4b) agree with mine.

**Verdict: HOLDS.**

**What the instrument cannot see.** The writer's gzip implementation and flags — but all five numbers matching
67cdf4b exactly under gzip 479 −9 settles which tree was measured. PLAN's "on the wire 191.4 / 193.8 KB" figures were
not checked.

**Severity.** Documentation accuracy: the critical-path growth is +2,043 B, 10 % more than stated; the direction of
PLAN's conclusion (≈ 50 ms slower on mobile under 4× CPU) is unaffected, and its "roughly 60 % of the growth is the
explanation" becomes ≈ 55 % on the shipped 1,610 B.

---

## C-P9 — the FCP/LCP table's script exists nowhere in history

**Claim.** The FCP/LCP table in `PLAN.md:1706–1727` was produced by a script that exists nowhere in history.

**What was run.**
- Predecessor: `p9-history-grep.txt` — git grep over every commit reachable from any ref (262) for CDP throttling
  identifiers (only `tools/audit/harness.mjs`), "interleav" (only PLAN.md), the throttling numbers (PLAN.md and
  `tools/quietd.js`), and Lighthouse/FCP/LCP words (docs, `tools/serve.js`'s header, `test/features.test.js`, …).
- Me, all refs (263 commits): `git log --all -S'[REDACTED]'` → 32e5328 only (1.7's audit harness);
  `-S'setCPUThrottlingRate'` → nothing; `-S'first-contentful'`, `-S'largest-contentful'`, `-S'FCP'` restricted to
  `*.js`/`*.mjs` → nothing; `-S'interleav' -- . ':!PLAN.md'` → nothing. `tools/audit/harness.mjs:96` (present at HEAD)
  has one network emulation: a slow-3G option, latency 400 ms / 50 KB s⁻¹ — not 150 ms / 1.6 Mbps — and no CPU
  throttle, no paint timing, no medians. `tools/quietd.js` (the predecessor's other hit) never existed on main — it lives only on the
  `p5-d-latency`/`watch-fixes` branches, is a sync-latency instrument ("how long a page takes to see a write when the
  doorbell was rung"), and its match is the phrase "timer throttling under occlusion" at its line 57 — browser timer
  throttling, nothing to do with CPU or network throttling or paint timing. The commit that added the table, 74bf09f (`git show --stat`): PLAN.md +61,
  174 PNGs under `shots/1.12/`, build-number lines in index.html / sw.js / version.js / whatsnew.json, panels.js (2
  lines), tools/e2e4.js (4) — no script. `PLAN.md:1716–1720` describes the procedure ("measured directly through CDP
  with Lighthouse's own mobile throttling numbers applied — 150 ms RTT, 1.6 Mbps down, 4× CPU. Eight runs a side,
  interleaved and with the order flipped every other pass") and names no tool, unlike the 1.0–1.11 Lighthouse rows,
  which say "same harness".

**Verdict: HOLDS — as far as the repository can show.** No commit on any ref carries code that applies those
throttling numbers, reads FCP/LCP, interleaves runs or takes medians.

**What the instrument cannot see.** A script kept outside the repo or in an uncommitted scratch directory, or a
hand-driven DevTools/CDP session; and the numbers themselves are not reproducible here (Lighthouse absent, machine
under load).

**Severity.** Together with P8, the "before and after" section of PLAN.md rests on measurements whose tool is not in
the repo and whose byte table is from a different tree than the one shipped.

---

## C-P10 — three comments false at 7341981

**Claim.** `app.js:1790–1791` ("The ⋯ menu is a launcher, not a parent: what it opens is a root, and Back appears
only inside a panel"); `Vault.swift:142–143` and `:169–172` (Remove "leaves the entry in `lists` and flags it" / "sets
`archived` … Lists brings it back"); `VaultTests.swift:283` ("Measured, on a simulator: `archiveList` sets
`archived`") state something false at 7341981.

**What was run (me).**
1. `app.js:1790–1791` (blame af32faa, 2026-09-05, the 1.4 stack). Measured in my browser run
   (`p11-copylink-accent.log`, `[P10]` lines; 1440×900, `?transport=local`): after ⋯ → Settings `window.__tf().panels`
   = `["p-menu","p-settings"]` and `#p-settings h2 .back` exists; after ⋯ → Lists `["p-menu","p-lists"]` with a ‹ Back.
   The e2e4 test "1.12: ‹ Back on every panel ⋯ opens…" asserts exactly this for five panels (`e2e4.js:2269–2270`) and
   is green in `review/raw/baseline/e2e4.log:82,168` and in the predecessor's `p7-e2e-base.log`. `app.js`'s own later
   comments (`:1953–1955`, `:1974–1976`) call the menu "the frame below". → false.
2. `Vault.swift:142–143`, `:169–172` (blame 0717746, 2026-09-06). `git grep -n archiveList` at HEAD → only two
   comments (`VaultTests.swift:283`, `DECISIONS-apple.md:274`). `git grep archiveList 67cdf4b^ -- '*.js'` →
   `panels.js:456 async function archiveList(id)` and its caller `:491`; at 67cdf4b (2026-09-07, "Removed means
   removed, and the way back is the link" — one day after the comments) it is gone. Now `removeList`
   (`panels.js:483–486`) filters the entry **out of** `lists` and records the id in `meta.removed`; `app.js:85–92`
   keeps a removed id out of the merged registry; `model.js:858–864` finishes any leftover `archived` entry on read by
   dropping it; no web code writes `archived` (`git grep`). `e2e4.js:2353` asserts there is no `#lists-removed`
   group. The Apple side has no remove-list operation of its own: `Vault.swift:74 remove(id:)` and
   `KeychainLinkVault.swift:80` drop a vault secret, `Store.swift:113 remove` is the store; the vault only reads the
   registry. → false.
3. `VaultTests.swift:283` (blame 0717746). Describes a build before 67cdf4b; at 7341981 nothing named `archiveList`
   exists to measure. The test body (a registry with `archived: true` → `plan.remove`) still passes for its own
   reason (an archived entry is still "not held"); the comment is the false part. → false.

Not in the claim, same commit: `apple/DECISIONS-apple.md:272–276` makes the identical statement ("`archiveList` sets
`archived` on it and leaves it there … Lists brings it back under **Removed from this device**") — a fourth stale
site. `apple/README.md:328–332` (948a905, 2026-09-09) already has it right: "Since the web's 1.12, *Remove from this
device* takes the entry out of `lists` altogether rather than flagging it … so nothing here had to change. The
`archived` check stays anyway".

**Verdict: HOLDS** (all three, plus a fourth).

**What the instrument cannot see.** The simulator measurement cannot be re-run (no builds or simulators); the Apple
reconciler was not executed against a post-1.12 registry here — by reading (`Vault.swift:161–176`) an id absent from
`lists` is "not named" exactly as an archived one is, which is what README says.

**Severity.** Comments only; the code still produces the right plan for the new registry shape. The risk is a reader
or the next reconciler change trusting them. `app.js:1790–1791` is contradicted within its own file.

---

## C-P11 — the Copy-link chip's accent is unreachable

**Claim.** In `app.js`'s `ask()`, `ex.classList.toggle("accent", !!extraFirst && !danger)` makes the Copy-link chip's
accent unreachable because the only caller passing `extra` (`panels.js` `removeList`) always passes `danger: true`;
in the unsaved-link case Copy link is first in reading order but grey beside a red Remove.

**What was run (me).**
- Static: `app.js:1921 function ask({ …, danger = false, extra = null, extraFirst = false })`; `:1936
  ex.classList.toggle("accent", !!extraFirst && !danger)`. Every `ask(` call site (`grep -nE '\bask\('` over app.js and
  panels.js, 12 callers): only `panels.js:471–480` (`removeList`) passes `extra` — `{ label: "Copy link", … }` with
  `extraFirst: unsaved` and `danger: true` unconditionally. The other `danger: true` callers (`:358` New keys, `:792`
  Delete section, `:836` Delete template, `:978` Delete everywhere) pass no `extra`. So `!!extraFirst && !danger` is
  false on the only path that reaches it.
- Browser, one run (`p11-copylink-accent.mjs` → `p11-copylink-accent.log`; Playwright + installed Chrome headless,
  1440×900, `?transport=local`, Dark pinned by `cleanup/tools/lib.mjs`; the unmutated copy on 8898, pid 43542, checked
  byte-identical to the worktree's app.js before the run):
  - E0 saved link — msg "The server and your other devices keep it…"; DOM order **Remove** (`chip danger`,
    rgb(220,94,89)) · **Copy link** (`chip`, rgb(143,140,132)) · Cancel (`chip`, grey); all backgrounds transparent.
  - E1 never-saved — `tf/v2/meta` seeded with `lists[0].linkSaved=false, created=true,
    device.savedGrandfathered=true` and reloaded, as `e2e4.js:2363` does; msg "You've never saved this link. Copy it
    first — without it there is no way back…"; DOM order **Copy link** (left 500, `chip`, rgb(143,140,132)) ·
    **Remove** (left 594, `chip danger`, rgb(220,94,89)) · Cancel. Page errors: none. Same values as the finder's
    `e-copylink-accent.log`.
  - Caveat on my own log: its two "WITH accent (probe)" lines read the colour synchronously after adding the class and
    show no change — an artifact of `.chip`'s `transition: color .18s` (`styles.css:78`). Disregard them.
- Supplementary run (`p11b-accent-probe.mjs` → `p11b-accent-probe.log`), same setup, reading 600 ms after forcing
  `accent` onto `#ask-extra`: colour rgb(191,117,48) = `--accent-text` #BF7530, border rgba(247,242,232,.3); back to
  rgb(143,140,132) once removed. So `.chip.accent{color:var(--accent-text);border-color:var(--hair-hi)}`
  (`styles.css:83`) is a live rule that would have shown had the toggle ever been true.

**Verdict: HOLDS.**

**What the instrument cannot see.** Whether "no accent beside a danger button" was a deliberate rule (the 1.7
design-language test at `e2e4.js:243` asserts the *OK* of Delete everywhere is red and not accent; nothing asserts
anything about `#ask-extra`'s class); light kits and the phone viewport were not read (one desktop run, Dark).

**Severity.** Low, one token. But `app.js:1919–1920` says `extraFirst` is "for when it matters more", the sheet's own
text says "Copy it first", and the only visual weight on that row is the red Remove; `removeList` is the sole user of
`extra`, so the accent branch is dead code in the shipped app.

---

## Evidence files (`review/raw/verify-c/`)

Predecessor: `p5-finder-instrument-rerun.log`, `p6-summary.txt`, `p6-mutations.diff`, `p6-run-base.log`,
`p6-run-mut-{chord,buzz,step,centre,mine-count,mine-gap1000}.log`, `p7-mutations.diff`, `p7-e2e-base.log`,
`p8-gzip.txt`, `p8-appjs-diff-lines.txt`, `p9-history-grep.txt`, `serve-8898-base.log`, `serve-8898.pid` (dead).
Me: `p6-rerun-verifier.txt`, `p7-e2e-mut-back.log`, `p7-e2e-mut-remove.log`, `serve-8898-mut.{log,pid}`,
`serve-8898-base2.{log,pid}`, `p11-copylink-accent.{mjs,log}`, `p11b-accent-probe.{mjs,log}`, this report.
Privacy: `grep -rnoE '[0-9A-Za-z]{22,}'` over the directory and this file finds identifier words
(`[REDACTED]`, `[REDACTED]`, `savedGrandfathered`) and the 40-hex commit hash above — no
list id or secret.

## Verdicts

| finding | verdict |
| --- | --- |
| C-P5 | HOLDS |
| C-P6 | HOLDS |
| C-P7 | HOLDS |
| C-P8 | HOLDS |
| C-P9 | HOLDS (as far as the repository can show) |
| C-P10 | HOLDS (plus a fourth stale site, DECISIONS-apple.md:272–276) |
| C-P11 | HOLDS |
