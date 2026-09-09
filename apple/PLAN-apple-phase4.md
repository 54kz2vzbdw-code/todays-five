# Today's Five for Apple — Phase 4: the kits on the wrist, and an accent that isn't locked in

The plan, and at the end the results. This phase is about how the thing looks. Phase 3 shipped
mechanism and deferred appearance, which was the right order; the bill is now due, on two surfaces —
the web's UI accent, which has been pinned to the brand since 1.11, and the Watch, which ships one
hard-coded hex and the system font.

Read `COMPATIBILITY.md` first — all of it, §7 and §8 included — then `apple/PLAN-apple.md`,
`apple/PLAN-apple-phase2.md`, `apple/PLAN-apple-phase3.md`, `apple/DECISIONS-apple.md`, and
`theme.js`. **This round changes the web app**, which makes §7's release checklist binding in a way
Phase 3's was not.

---

## Checkpoint report: what was measured before anything was written

Everything in this table was run on this machine. Where a claim could not be settled here it says
so, and where it can only be settled on a wrist it says that too.

| | |
| --- | --- |
| Xcode | **26.6** (17F113), Swift **6.3.3** |
| Simulator runtimes | iOS 18.1 / 26.5, watchOS **11.1** (22R581) / **26.5** (23T570) |
| the pair | Apple Watch Series 11 46mm `4594CB69` + iPhone 17 `C33542F5`, pair `4B6A97F5`, active and connected |
| git | clean on `main`, `git rev-list --count main` = **169** |
| the web | **1.12 (158)**, and the deployed `version.js` and `sw.js` match the checkout byte for byte |
| baseline suites | Node **132 tests** across seven suites (model 28, theme 31, crypto 10, sync 14, sound 12, features 28, compat 9) — green. `swift test` **116 tests in 9 suites**, 8.5 s — green |
| `brew`, `gh`, `npm` | still absent. The `.xcodeproj` is still hand-written and committed |
| new tool | `fontTools` 4.60.2 + `brotli`, installed into the user's Python 3.9 (`pip install --user`). Needed only to **regenerate** the Watch's fonts, never to build |

### The seven things a reading could not have told us

**1. The Watch can have the real type, and it costs 1.5 MB.** This was the round's biggest unknown
and it is settled. The repo's own `fonts/*.woff2` — the latin subsets the web serves — convert to
TTF with `fontTools` (`f = TTFont(src); f.flavor = None; f.save(dst)`): **26 faces, 732 KB of woff2
→ 1.54 MB of TTF**, the same glyphs the web renders. Downloading Google's own TTFs instead would
have been **6.23 MB** and a different subset. A hand-assembled watchOS app with `UIAppFonts` in its
`Info.plist` and no registration code rendered a bundled face on **both** the 11.1 and the 26.5
runtimes. (watchOS also loads `.woff2` directly — `libFontParser.dylib` carries `WOFF2Container` —
but that acceptance is undocumented and buys nothing without a download, so we ship TTF.)

**2. The font *names* are a trap, and it is the round's sharpest.** `theme.js`'s `PAIRS` carry CSS
family names, and those names are a fiction invented by `styles.css`'s 26 `@font-face` rules. The
names inside the binaries are different: `outfit-500-800.woff2` is family **"Outfit Thin"**,
`manrope-500-800` is **"Manrope ExtraLight"**, `dm-sans-400-700` is **"DM Sans 9pt"**. Registering
all 26 files and then asking `CTFontCreateWithName` for each of the 22 families `theme.js` names
resolves **10 of 22 to Helvetica** — including the *task* face of midnight, harbor, forest, sketch,
arcade, dusk, ember and superpink. A missing custom font on Apple platforms renders the system face
with **no log and no error**. So: the name table is **generated from the binaries**, never from
`theme.js`, and a launch-time self-test asserts every family actually resolved.

**3. `.weight()` is a no-op on two of our faces.** A variable font answers `Font.custom(…).weight(…)`
only if it carries named instances in `fvar`. Measured: Outfit (9 instances) moves ink fraction
0.055 → 0.147 → 0.230 → 0.253 across ultraLight→black; **Fraunces (0 instances)** is byte-identical
at `.light`, default and `.black`. `source-serif-4` is the same. Fraunces is Pink's and Blush's task
face. So variable files get **instanced to static weights** at exactly the weights `theme.js`
records.

**4. watchOS has no light appearance, and `.preferredColorScheme(.light)` is inert.** Measured: at
the root of a live watchOS app `\.colorScheme` reads `.dark`, and putting
`.preferredColorScheme(.light)` over a cream ground left the text white and invisible.
`.environment(\.colorScheme, .light)` **does** work. And the system-drawn clock in the top-right
stays white and is not themeable at all — on Paper's cream it is nearly illegible. That is a design
consequence of what the brief asked for and it is written down here rather than discovered.

**5. A complication cannot follow the kit's accent, and no amount of work fixes it.** The brief asks
for "all four families, accent and type both". The SDK's own words for `WidgetRenderingMode.accented`
are that the system "treats the widget's views as if they were template images. It replaces the
view's color — rendering the new colors while preserving the view's alpha channel."
`WidgetAccentedRenderingMode.fullColor` says "Only applies to iOS." **The face's palette wins.** What
a kit genuinely *can* change on the face is the **type**, the glyph, the gauge-versus-text choice,
and which subview carries `.widgetAccentable()`. This is read from the SDK, not observed — nothing on
this machine can put a complication on a face — so Track C attempts an observation and, either way,
the limit is written into `Complications.swift` in the same register `WatchTheme.swift` used for the
phone-accent promise. **Half of that brief line is delivered; the other half is recorded as not
possible.**

**6. The latency hypothesis is right, and the mechanism is worse than "the Watch doesn't ring the
bell".** `sync.js:331` is the only line in the system that broadcasts, and `SyncEngine.push()` is
that same block with the line absent. `put_list_v3` (`002_v3.sql:195-243`) ends at an `update` and a
`jsonb_build_object` — no trigger, no `realtime.send`, no `pg_notify`; a grep of the whole `supabase/`
tree for `realtime|publication|pg_notify` returns zero hits. So the phone subscribes, the channel
joins, `setLive(true)` moves the poll from 60 s to **240 s**, and nobody ever rings the bell that
240 s assumes. **A phone whose realtime is working is four times slower to see a wrist tap than one
whose realtime is dead.** Measured on the local transport with a virtualised clock, ten trials each:

| condition | trials (s) | median |
| --- | --- | --- |
| foreground, realtime **connected** | 6, 26, 32, 44, 46, 54, 174, 186, 218, 230 | **54 s** (max 230) |
| foreground, realtime **not** connected | 8, 8, 10, 14, 26, 32, 36, 52, 56, 58 | **32 s** (max 58) |
| backgrounded, either way | **never**, 10/10 in 600 s of virtual time | — |

And it is not only the wrist: `tfive add` from the Mac and the *Add to Today's Five* App Intent push
through the same silent `SyncEngine.push()`.

**7. `JavaScriptCore` is in the macOS and iOS SDKs and absent from watchOS.** `theme.js` has no
imports and touches `localStorage` only inside `applyTheme`, so stripping three `export ` keywords
and evaluating it in a `JSContext` reproduces `CURATED` exactly — **byte-identical to Node, 17,674
bytes, ~6 ms**. That means a Swift test can compare the generated table against **live `theme.js`**
rather than against a snapshot somebody forgot to regenerate — and the framework can never ship to a
wrist, which is exactly the shape we want.

---

## §1. Unpin the UI accent from the brand

Since 1.11 the strike, the filled checkbox and the mark have been `BRAND_ACCENT = "#A86014"`. The
reasoning is in `theme.js` and it is arithmetically sound: 4.5:1 against Paper's `#F7F2E8` needs
relative luminance ≤ 0.159, against Terminal's `#070A08` ≥ 0.188, so **no single colour can be text
on both**; the accent was therefore demoted to a non-text UI colour at WCAG's 3:1 floor and
`#A86014` clears all four grounds by 16 %.

**The premise is what is wrong, not the arithmetic.** One accent across every kit means Terminal — a
green-on-black terminal — draws an amber check.

### What actually changes

Measured first: of the 18 kits, **only three carry `#A86014`** — dark, paper and terminal. The other
fifteen already drive their own accent and are untouched. So this is a three-kit change, not
eighteen.

| kit | today | after | accent on `--ink` | on `--ink-3` |
| --- | --- | --- | --- | --- |
| **terminal** | `#A86014` | **`#4AF07A`** (its own, pre-1.11) | 4.12 → **13.29** | 3.48 → **11.22** |
| **paper** | `#A86014` | **`#C8321F`** (its own, pre-1.11) | 4.33 → **4.79** | 3.48 → **3.85** |
| **dark** | `#A86014` | **`#A86014`** — unchanged | 4.12 | 3.48 |

The accent families go back with them (`accentHi`, `accentDeep`, `accentText`, `glow`,
`strikeShadow`, and each kit's confetti palette). **`finalize()` leaves all six untouched** — I ran
the exact `fix3` nudge on each and every one returned itself, so reverting is arithmetically free and
the hexes people already know are the hexes that ship.

**Dark keeps the brand accent, and that is a decision.** Dark is not a kit that happens to carry the
brand colour; since 1.11 Dark *is* the brand's dark — Terminal's grounds, Paper's paper as its ink,
the brand accent. Reverting it would mean going back to `#D26128`, the borrowed law-firm orange that
1.11 deliberately removed, which is not what this round is for. So `#A86014` stays alive in exactly
one kit, where it is that kit's own colour rather than a pin over somebody else's.

**The mark does not change.** `icons/mark.svg`, `BRAND_ACCENT`, `BRAND_COLOURWAYS`, `BRAND.accent`,
the app icon and its three appearances all stay `#A86014`. The in-app echo of the icon is what we are
trading away, knowingly, and `DECISIONS-apple.md` says so.

### The floors, re-pointed

`test/theme.test.js` moves from *one accent against four grounds* to *each kit against its own
grounds*, and every kit is held to it — curated, Secret, and derived-from-one-accent.

- Add `accent3: contrast(c.accent, c.ink3)` to `report()` and `accent3: 3` to `THRESH`. Today
  `report()` measures the accent against `--ink` only, which is why the elevated-surface floor is
  enforced in one test and absent from the shared threshold table.
- **The `ORIGINAL` exemption does not get to skip the accent floor.** Light and pink are exempt from
  `finalize()`'s nudging; they are not exempt from being *measured*. Both pass as written — light
  3.0016 on ink-3 (by 0.0016) and pink 4.0144 — so nothing has to move, but the test now says so
  instead of assuming it.
- **The derived path's guarantee is measured against a different rule, and that is a real bug.**
  `derive()` calls `ensure(…, c.ink, 3, dir)` — against `--ink`, never `--ink-3`. Over 3,000 seeded
  accents per base: worst `accent` vs `ink3` is **2.18 on dark** (1,152 of 3,000 below 3:1) and
  **2.45 on light** (1,687 of 3,000). Fixed by nudging against `ink3` as the curated path already
  does. **This lands as its own commit**, because saved theme codes live in the encrypted document
  (`model.js:104`, the `themes` collection) and this changes what another person's device renders on
  a shared list — a compatibility decision that must be revertible without reverting the palette.
- **One genuine pre-existing failure, found by the re-pointing:** `light.danger` `#B8402A` on
  `light.ink3` is **4.12**, short of 4.5. Invisible today because `report()` measures danger against
  `ink` only and light is exempt from the nudge. Fixed, with its measured ratio logged.

### The three stale hexes nobody was looking at

- `panels.js`'s `#sw-yours` fill renders every saved theme record with **no `dev.secret` guard**,
  unlike the group (`:130`) and the import field (`:278`). A record whose code names a secret kit
  survives `normalize()` intact — measured — and theme codes *do* enter the encrypted document. It
  is unreachable through today's UI because `saveCustom()` only ever writes a `T2` code, and it is
  one line to close. Closed.
- `WebViewController.swift:57` paints **`#1A1D21`** behind the web view before first paint — Dark's
  *pre-1.11* ground, stale since 1.11 and disagreeing with both `LaunchBackground.colorset` and
  `index.html`'s `theme-color`, which are `#070A08`. Fixed.
- `tools/mark.mjs --trace` renders the mark in hard-coded `#1A1D21`/`#D26128` and pixel-diffs it
  against `icons/apple-touch-icon.png` with a **colour** threshold, despite a comment saying
  "Geometry only". Since `BRAND.accent` and the colourways do not move this round, `--trace` should
  still report 1.60 % — **verified, not assumed.**

### Look at it before believing the arithmetic

Contrast arithmetic cannot tell you whether `#C8321F` on Paper's cream still reads as this product.
Before Track A writes a test file, it renders **all 18 kits** on `main` and again on the candidate
palette, side by side: `node tools/serve.js`, a Playwright page at `?transport=local`, `applyTheme`
in a loop, PNGs written **outside the repo**. Measured to take about 20 seconds with no network and
no list creations.

---

## §2. The kit table reaches the core

The Watch cannot import `theme.js`. Today it has one hex baked in.

**A build-time generator cannot parse `theme.js`, and the reason is arithmetic, not plumbing.** 62 of
the 314 hex tokens in the finished table appear nowhere in the source — every kit has at least one.
Harbor's `accentText` `#046D6D`, Teletype's accent `#119449`, Sketch's `#9D7700`, every one of Dark's
greys and every `hairSolid` come out of `finalize()` → `ensure()` → `oklch()`: cube roots, a
14-iteration gamut binary search, WCAG contrast and a 60-step lightness loop. A Swift plugin would
have to reimplement all of it and match JavaScript doubles bit for bit — which is the forbidden
second copy of the palette in its worst possible form. And `node` is genuinely unreachable from a
build: `/usr/bin/env -i /bin/sh -c 'command -v node'` exits 1.

So the chain is **generate from a fixture, and let JavaScriptCore be what guarantees one source of
truth**:

| file | what |
| --- | --- |
| `test/tools/gen-kits.mjs` | **new.** Imports `theme.js`, writes `test/fixtures/kits.json` — 18 kits, the 13 pairs, `shapes` normalised, `secret` always present. Modelled on `gen-vectors.mjs` including its **refusal to write** if the invariants no longer hold |
| `apple/tools/gen-watch-fonts.py` | **new.** woff2 → TTF, variable faces instanced at `theme.js`'s weights, into `apple/TodaysFive/Fonts/`; writes `test/fixtures/watch-fonts.json` — the **real** family and PostScript names, read out of the binaries |
| `apple/TodaysFiveCore/Plugins/KitsGen/` | **new** prebuild plugin. Reads the two fixtures — never `theme.js` — and emits `Kits.generated.swift` holding the **16 open kits only**. Prebuild over `/bin/sh` for exactly ConfigGen's Phase 3 reason |
| `Sources/TodaysFiveCore/Kits.swift` | **new.** The doc comment and the accessors, the way `Config.swift` wraps `GeneratedConfig`. No palette data |
| `Tests/…/KitFixtureTests.swift` | **new**, and load-bearing — see below |

**Tests.** `#if canImport(JavaScriptCore)`, evaluate live `theme.js` in a `JSContext` and assert
`JSON.stringify(CURATED)` equals the fixture — **this is the thing that fails when somebody edits a
colour and does not regenerate**, which a fixture alone never would (there is no `package.json`, no
CI, and the generators are run by hand). Then: the Swift table equals the fixture's 16 open kits
token for token; `superpink` and `birthday` appear in **neither** the table nor any binary; every kit
in the fixture — all 18 — clears the 3:1 floor **computed in Swift**, which is a second implementation
of the contrast function and therefore a real cross-check rather than a restatement. And the same
fixture-versus-live assertion from the JS side in `test/theme.test.js`, so the web author sees drift
where they work.

**Secret kits stay behind the key.** They are absent from the generated table and from every binary.
A phone whose `meta.device.secret` is set — a sibling key in the `tf/v2/meta` JSON
`WebViewController.reconcileVault()` already has in hand, so two lines and no new bridge — sends the
two kits' tokens in `WatchLinkPayload.extra`, which passes unknown keys through today (measured: a
nested kit object with string arrays, number arrays and a bool survives encode→decode intact,
payload 394 bytes). **Keys must be inserted in sorted order** — `decode` sorts and `encode` preserves
insertion order, so an unsorted insert silently breaks round-trip equality.

Worth stating plainly: the secret palettes are not cryptographically secret — `theme.js` ships to
every browser. "A Watch that has not unlocked them does not carry them" is a stricter product rule
than the web's own model, and we are keeping it because it was asked for.

---

## §3. The Watch gets the kits — and its own picker

Phase 3 said the Watch would follow the phone's slot accent, nothing ever made it known, and a
constant shipped. **We are not building the phone-follows channel.** Theme is a per-device preference
in this app and the Watch is a device.

- **A theme picker on the Watch.** Day and Night slots, chosen on the Watch, stored on the Watch.
  This reverses Phase 3's "no settings screen" for this one screen and nothing else. It hangs off
  **the long press that already holds Start again** — the count is already the Watch's one long-press
  surface and a third page would cost Today a swipe. Stored in
  `UserDefaults(suiteName: "group.com.pricebrannen.todaysfive")`, because the complication has to be
  able to see it and cannot read `.standard`. (Deliberately unlike `WatchLinkReceiver`'s selected-list
  key, which is in `.standard` *because* it is a secret. A kit id is not.)
- **What crosses:** the accent (strike, filled box, count, sync mark), the **type**, and the ground —
  including Paper's cream. The light ground needs `.environment(\.colorScheme, .light)` at the root
  of every screen, explicit `.listRowBackground` on every row, and every `.primary`/`.secondary` call
  site replaced with a kit token; twelve of them are only right today because watchOS is permanently
  dark. **The system clock stays white on a cream ground and there is no API to change it** — accepted,
  in writing.
- **Battery, measured rather than asserted.** `simctl` models no OLED power and nothing on this
  machine produces watts. What it *can* produce honestly: render the same five-line Today twice on
  the watch simulator, screenshot both at native 416×496, and compute mean per-channel linear drive
  at γ 2.2 as a fraction of a full-white panel. Dark **0.0466**, cream **0.8146** — a **17.5×**
  emissive-drive ratio, stable at 17.2–17.8× across four channel weightings. It is **not** a battery
  number: no panel calibration, no static panel/SoC floor, no duty cycle. It goes in the results with
  those three caveats attached or not at all.
- **The finale gets its confetti.** `Canvas` inside `TimelineView(.animation)` — both watchOS 8.0+,
  and 180 rotating particles rendered live on a 26.5 sim. Always-On handles itself:
  `AnimationTimelineSchedule.entries(from:mode:)` returns **zero entries** in `.lowFrequency`
  (iterated, empty on both runtimes), so the timeline self-parks and must **not** be gated on
  `isLuminanceReduced`. The rules come from `fx.js`. `CoreHaptics` is still absent from watchOS, so
  the haptic half stays `WKInterfaceDevice.play` and the code goes on saying so. Sound stays out.
- **Complications follow the kit's *type*, and cannot follow its accent** (checkpoint 5). The theme
  reaches the face through **`WatchSnapshot`** — additively, `v` staying 1, since `read()` already
  defaults every missing field, which is `COMPATIBILITY.md` §3's rule applied to a file. `publish()`
  already writes the snapshot and calls `reloadAllTimelines()` in the same breath, so a theme change
  is a redraw, not a reload-next-time. Fonts must be **duplicated into the appex** (its own bundle,
  its own `Info.plist`, its own Resources phase) — deferred until Track C has confirmed a custom face
  renders in a complication at all, because that is 1.5 MB and 26 hand edits on an unmeasured bet.
- **Screenshots of every kit on the Watch** — all 18, named by kit id.

---

## §4. The poll papercut

The hypothesis is confirmed (checkpoint 6). **The fix goes where the numbers point: the writer, not
the poller.**

**Step 0, before a line of Swift.** One `curl` against one throwaway list settles the round's one
load-bearing unknown: `sync.js:121`'s REST broadcast fallback posts to `/realtime/v1/api/broadcast`
with `{ apikey, Content-Type }`, **no `Authorization: Bearer`**, and swallows the response with
`.catch(() => {})`. Nothing in the repo has ever exercised it. If it returns 401/403 we have found a
second bug — the web's own fallback has been dead its whole life — and the fix is one header in both
places. Either outcome is worth one create.

**Step 1.** A narrow `DoorbellTransport { func ring(_ id:, _ payload:) async }` on `SupabaseTransport`
— narrow rather than conforming to the declared-but-unimplemented `RealtimeTransport`, which promises
a `subscribe` the Swift side has no intention of writing, and a protocol that lies is worse than a
small new one. Then the mirror of `sync.js:331` in **`SyncEngine.push()`**, so the Watch, the Mac CLI
and the App Intent all get it at once. `MemoryTransport` is untouched, so every test stays offline.

**Cost: zero at idle.** No extra request unless a write succeeded; ~138 bytes per write. The poll
stays at 240 s and the unchanged poll stays **29 bytes** — the number this project has defended
across three phases. `COMPATIBILITY.md` §4 does not merely permit this, it specifies it: "broadcasts
stay a doorbell (`{ rev, from }`, optionally `gone`), never the document."

Shortening `POLL_LIVE_MS` is **rejected**: it costs 4× the polls at idle forever, on every device
including web devices with no Watch, and it does nothing for the backgrounded case, which is 10/10
"never" regardless of interval because `visible()` gates the pull upstream of the timer. A
database-side broadcast is parked — it would need a trigger or a `put_list_v4` against a frozen RPC,
and turning on a realtime feature currently not configured at all, on a project whose whole security
story is that the table is unreachable except through three `SECURITY DEFINER` functions.

The harness (`tools/polld.js`) keeps the numbers reproducible: one Playwright context per trial with
`page.clock.install`, a random phase offset into the poll period, and `page.clock.runFor` turning
four minutes of waiting into a few hundred milliseconds — 40 trials in about six minutes instead of
two hours, with no backend and no creates.

---

## §5. This ships as a build of 1.12, not as 1.12 b207

Decided mid-round, and it changes the release step more than it looks like it should.

**The marketing version stays `1.12`. Only `BUILD` moves.** From here on that is the standing rule:
increment the build, leave the version alone until something genuinely warrants a new one.

What that buys, measured against `test/features.test.js` and `tools/e2e4.js`:

- `whatsnew.json`'s `versions` array is **untouched**, so `features.test.js:243` and `:296` — the two
  copies of the public history — need no edit, and neither do `e2e4.js:1265`/`:1637`.
- **No headline moves**, so `features.test.js:225` and `e2e4.js:1248`/`:1674`/`:2175` stand.
- **No `nth-child` renumbering.** Leading with a new version would have pushed the 1.8 wink from
  `nth-child(5)` to `(6)` in two assertions 370 lines apart, and shifted what `nth-child(2)` must
  match — a silent renumbering that no grep for "1.12" would have found. That whole trap is simply
  not entered.
- `about.html`'s static `Version 1.12` line stands.
- **The what's-new toast does not fire**, because it keys on the version string *changing*. That is
  the right answer for a build: nobody is told "what's new" about a round whose user-visible change
  is that their theme's accent is their theme's again.

So the release step is four build homes — `version.js`, `sw.js`, `whatsnew.json`'s `build`,
`index.html`'s `data-build`, `panels.js`'s `PANELS_BUILD` — plus the sixth home no suite checks:
`project.pbxproj`'s **six** `CURRENT_PROJECT_VERSION` lines (three targets × two configurations).
`MARKETING_VERSION` stays `1.12` on all six. The cache name still changes, because
`sw.js`'s `CACHE` is `VERSION + "-b" + BUILD`, so the deploy still lands on the next open exactly as
§6 describes.

**The narrative tags.** Tracks A, B and D wrote `1.12 b207` into about thirty code comments — the repo's
habit of tagging a change with the release it landed in. Those resolve to **`1.12 b<N>`** at
stamping, which is unambiguous against what shipped as 1.12 build 158 and matches the unit that is
actually incrementing.

**If a new version number is ever needed**, the public history has a gap to close first: the array
runs `1.12, 1.11, 1.10, 1.9, 1.8, 1.7, 1.5, …` — **there is no 1.6**, in `whatsnew.json` or in
`CHANGELOG.md`. It was not skipped; it was vacated. The Secret pair went out as 1.6 (`12e62e3`,
`version.js` reading `1.6` at build 76) with the entry *"A little something for someone in
particular. — If you know, you know."*, and that entry now sits at **1.8**, which is what
`test/features.test.js:233` pins as "the wink". The number was spent and then the round it named
moved.

So the instruction for that day is: **cycle the later numbers down to fill 1.6** rather than
appending a new one on the end. Both pinned copies of the array move together
(`features.test.js:243` and `:296`), and so do `e2e4.js:1265`/`:1637`, the `nth-child` positions at
`e2e4.js:1638`/`:1639`, and every `wn.versions.find(v => v.version === …)` lookup in the suite.

---

## The tracks

Four, in worktrees, each with a written contract and a budget. **Sub-agents never merge**; I do,
after `swift test`, the Node suites, both Xcode builds and the paired-simulator pass are green on the
integrated branch. Branch `apple-themes`, pushed after each logical commit.

The `.xcodeproj` is **mine**, not any track's — it is hand-written, there is no XcodeGen, and four
agents editing one `project.pbxproj` is a merge conflict with a build system attached. Its object ids
are `TF` + nineteen `0`s + a 3-digit number, banded by concern; free bands are 264–299 for
`PBXFileReference` and 436+ for `PBXBuildFile`.

| track | what |
| --- | --- |
| **A — the web accent** | §1. `theme.js`, `styles.css`, `test/theme.test.js`, the `panels.js` gate. The visual probe first |
| **B — the kits in the core** | §2. The two generators, the plugin, `Kits.swift`, the JavaScriptCore drift test |
| **C — the Watch's look** | §3. Accent, type, ground, the picker, the confetti, the complications, the screenshots |
| **D — the latency** | §4. The endpoint probe, `tools/polld.js`, the doorbell in `SyncEngine`, the interop assertion |

---

## Verification — do it, don't just say you did

- `swift test` and all seven Node suites green, with `test/theme.test.js` re-pointed and **every kit's
  measured ratio in the output**.
- The web on Terminal: the check and the strike are Terminal's green, the mark is still `#A86014`,
  both stated with their measured contrast. And the 18-kit render pass, before and after.
- `node tools/e2e4.js` at 1440×900 and 390×844 — zero page errors, zero CSP violations, zero
  third-party requests. ~25 minutes, nothing else competing.
- Paired simulators: every kit on the Watch; the picker persisting across launch; a complication
  redrawn on a theme change; the finale's confetti; the font self-test; Paper's ground measured.
- The §4 latency table, and the same table after the fix.
- One live run against the real backend with `tfive` on the other side, lists deleted after.
- The archive, with the Watch app embedded.

### What only a wrist can answer

Written here in advance so the results cannot quietly absorb them:

- whether an accessory complication really discards a custom accent (read from the SDK, not observed
  — nothing here can put a complication on a face);
- whether a widget extension honours its **own** `UIAppFonts`, or can read the app's bundle;
- whether Paper's cream reads as warm or as *broken* next to a white system clock;
- whether 180 particles hold 60 fps on real watch silicon;
- whether the doorbell's latency win survives a real WKWebView suspend/resume cycle;
- whether bundled fonts survive App Store review.

---

## Results

### The suites

| | |
| --- | --- |
| Node | **136 tests** — model 28, theme 33, crypto 10, sync 14, sound 12, features 29, compat 9 |
| `swift test` | **130 tests in 10 suites**, 8.3 s (116 before the round) |
| `tools/e2e4.js` | **169 passed, 0 failed** at 1440×900 and 390×844, with zero page errors, zero CSP violations and zero third-party requests |
| builds | iOS Simulator and watchOS Simulator, `BUILD SUCCEEDED`, **zero warnings** in either |
| the Watch | `-TFFontSelfTest` **98/98**, `-TFConfettiSelfTest` **108/108**, `-TFWatchSelfTest` and `-TFAddSelfTest` green |

### §1 — the accent is the kit's again

Only three kits ever carried `#A86014`, so this was a three-kit change and fifteen kits are
byte-identical before and after. The `cssText()` diff over all eighteen confirms it: two kits moved.

| | accent on `--ink` | on `--ink-3` |
| --- | --- | --- |
| **terminal** `#A86014` → `#4AF07A` | 4.12 → **13.29** | 3.48 → **11.22** |
| **paper** `#A86014` → `#C8321F` | 4.33 → **4.79** | 3.48 → **3.85** |
| **dark** — unchanged, and that is the decision | 4.12 | 3.48 |

`finalize()` returns all six reverted hexes unchanged — verified by running its own `fix3` nudge on
each rather than assuming — so this is a restoration, not a re-derivation, and the hexes people knew
before 1.11 are the hexes that ship.

**The mark did not move.** `BRAND_ACCENT`, `BRAND_COLOURWAYS`, `BRAND`, `brandTiles()`, `brandDark()`
and `icons/mark.svg` are all untouched, and `tools/mark.mjs --trace` confirms the drawing is the one
that shipped.

**Every kit is now measured against its own grounds**, printed on every run, and the `ORIGINAL`
exemption exempts light and pink from *nudging* rather than from being *measured*: light's accent
clears by 0.0016 and pink's accent text by 0.0069, asserted rather than assumed.

### §2 — the kit table in the core

18 kits and 13 pairs into `test/fixtures/kits.json`; **16** into `Kits.generated.swift`, the Secret
pair into no binary at all and a compiled assertion saying so. The drift test evaluates **live
`theme.js`** in a `JSContext` and compares — which is what caught the fixture going stale at
integration the moment Track A's palette met Track B's table, exactly the failure a snapshot alone
would have shipped.

The type: **33 static faces, 1.3 MB**, converted from the repo's own woff2 latin subsets and
instanced to the weights `theme.js` records. The family names are read back out of the produced
files, never from `theme.js`, because ten of the twenty-two CSS names resolve to Helvetica on Apple
platforms — silently.

### §3 — the Watch

Kit-driven accent, ground and type; a Day/Night picker behind the long press on the count, stored in
the App Group and **verified to persist across a cold launch**; the confetti as a `Canvas` in a
`TimelineView(.animation)`, `fx.js` port for port at **222 particles holding ~52 fps**; and all
**eighteen** kits screenshotted.

**Paper's cream ground, measured rather than assumed:** mean linear drive at γ 2.2, same layout to
the pixel, 416×496 native — dark **0.0285**, cream **0.7868**, a ratio of **27.5–27.6×** across four
channel weightings. It is **not a battery number**: no panel calibration, no static panel/SoC floor,
no duty cycle. And the system clock over Paper's cream measures **1.12:1**, which no API can change.

**The complication takes the kit's type and can never take its accent.** Observed, not merely read:
rendering the views under `.accented` and under `fullColor` came back **byte-identical**, which
proves SwiftUI passes the colours through untouched and the flattening is the widget host's at
composite time. There is no app-side compensation, so none was attempted.

### §4 — the papercut

Confirmed, and the mechanism is worse than "the Watch does not ring the bell": `sync.js:331` is the
only line in the system that broadcasts, `SyncEngine.push()` is that block with the line absent, and
`put_list_v3` does not broadcast either. So joining the realtime channel moved the poll from 60 s to
240 s and nobody rang the bell it assumed.

**The median was not the finding.** Three runs of the same condition gave 54 s, 132 s and 144 s.
What reproduces is the shape — the wait is uniform on (0, the poll period], bounded by it and
averaging half of it — so the number to quote is the **4× ratio** between realtime-connected and
realtime-dead, and the backgrounded answer, which is **never, 10/10**, because `schedulePoll`'s
`visible()` gate sits upstream of the interval.

The fix is in the writer, not the poller: a narrow `DoorbellTransport` on `SupabaseTransport` and the
mirror of `sync.js:331` in `SyncEngine.push()`, so the Watch, the Mac CLI and the App Intent all get
it at once. **138 bytes per successful write, zero at idle**, and the 29-byte unchanged poll does not
move.

### What was pulled from this build

**`derive()`'s `--ink-3` fix**, onto `derive-ink3-next`. It is right and measured, but it is the only
change in the round that reaches another person's screen without any action of theirs — saved theme
codes live in the encrypted document — and it should be attributable to one commit rather than to a
round that also moved Paper, Terminal, the type and the sync path.

Measured against realistic codes rather than synthetic ones, which moved the risk a long way down:
the builder's own **Surprise me over 2,000 themes moved 0**, and the four real-shaped `T2:` codes in
the repo moved 0. The ~47 % figure came from uniform-random hex, which is the wrong denominator.

And the plain answer to whether the contract would have caught it: **no.** `COMPATIBILITY.md` never
mentions theme codes or what one renders to — §5 pins the shape of `tf/v2/themecss`, §3 passes the
`themes` collection through untouched. That is transport and shape; rendering is neither.

### The live run — one list created, one deleted

Against the real Supabase project, with `tfive` on one side and the **deployed** site on the other,
which is exactly the shape this fix ships into: the new Swift rings the bell, the page that hears it
is the one already in the world.

| | |
| --- | --- |
| `tfive new` | created one list on the real backend |
| the deployed site | opened it, asked whose list it was once, answered — then **`status=synced`, `live=true`** |
| `tfive add` | the put returned in **0.52 s** |
| the line on the page | **0.63 s** after the write began — against **240 s** before, under identical conditions |
| the unchanged poll | **29 bytes** (`{"rev": 2, "unchanged": true}`) against 593 for the document; the envelope is 565 stored, v3 A256GCM, `z=deflate-raw` |
| page errors | 0 |
| cleanup | deleted, and a read afterwards says *gone* |

`live=true` is asserted **before** the write on purpose: a page that never joined the channel cannot
observe a broadcast at all, so without it the check would have had no witness and would have passed
on a poll instead.

**The create budget, honestly.** Three lists were created in total and all three are confirmed gone.
Only the third produced the numbers above; the first two were spent on a harness that could not
launch a browser — `playwright` resolved through `createRequire` rather than an ESM import, and the
system Chrome channel rather than the missing headless shell — and then on the "whose list is this?"
dialog, which a bare private link raises and which blocks the list until it is answered.
`apple/tools/interop.mjs` already knew that and this script did not. Two creates for harness
mistakes is two more than it should have cost.
