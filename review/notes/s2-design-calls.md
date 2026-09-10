## 2. Design disagreements

Thirty calls were judged, the eight the brief named and twenty-two of my own. The full argument for
each, with the measurements behind it, is `review/raw/calls.md` (evidence under `review/raw/calls/`);
what follows is the judgement, with both sides where I disagree with the round or with the brief.
"Instructed" means the prompt made the call; for those the question is whether the round should have
pushed back. Nothing in this section was changed in code: every one of these changes what a person sees
or adds behaviour, and by the brief's rule that is a write-up.

### The eight

**1. The Watch talks to the server itself.** Instructed. Bought: a wrist that works with the phone
off, the intent on the wrist, one `SyncEngine` fix (the doorbell) reaching the Watch, `tfive` and the
intent at once. Costs now: a second holder of every edit secret (Keychain, `AfterFirstUnlock`, not
synchronizable, the phone's rule), a second radio client, and about 1,100 lines of link hand-off that
exist only because the wrist needs the secrets. Costs later: every server-facing feature must be written
for watchOS suspension; the "occasions, never a timer" rule already carries that. Alternative: the Watch
as a terminal for the phone, which fails exactly where a Watch is useful, and which the phone (a
`WKWebView` with no Swift model) cannot serve anyway. Changing today: a rewrite of about 300 lines of
`WatchStore`, the hand-off deleted, a phone-side model added, the intent lost on the wrist, and every
user sees it. **Keep. No pushback was owed;** the round proved the call on a live list (rev 6 → 13 from
the wrist).

**2. The phone hands only links over `updateApplicationContext`.** Instructed. Bought: one slot, one
shape, last-value-wins replayed on launch, a stamp that makes doubled delivery free; *Remove from this
device* reaches the wrist with no code of its own. Costs now: the stamp is `max(now, lastSentAt + 1)`
and the Watch's high-water mark persists, so a phone clock that ever ran ahead poisons the channel for
exactly the size of the error (finding W-F4 quantifies it); the receiver reads two sources because the
simulator contradicted itself. Costs later: fields are free (`extra` carried the Secret kits with `v`
still 1); a wrist that *originates* a list is a redesign. Alternative: ship the document too (a second
source of truth in a slot that outlives the app), or no Keychain on the wrist (fails when the phone is
away). Changing today: nothing in the shape; the clock hazard is a sequence beside `at`, about twenty
lines and a test, invisible to users. **Keep, with two changes the round should make:** restate the
invariant as "state not events; the phone is the authority; never a document", because the slogan
"only the links" was bent within Phase 4 and the design survived, which shows the slogan was not the
rule; and close the clock hazard while it is additive. Pushback: none owed on the call; the round did
write the hazard down (`DECISIONS-apple.md:789–799`) and should have priced the fix beside it.

**3. The kit table as a hand-regenerated fixture, `KitsGen`, and the JavaScriptCore drift test.**
Chosen from the prompt's two options. The reason given (one token in five is computed in
`finalize() → ensure() → oklch()`, so a regex over `theme.js` would be silently wrong on exactly the
contrast-bearing greys) was checked and holds: 54 of 288 hex slots are absent from the source at HEAD,
every kit has at least one. Bought: the Watch reads a table, and a nineteenth kit touches neither
`KitsGen`, `Kits.swift`, `WatchTheme.swift` nor the picker. Costs now: two fixtures, two generators, a
197-line plugin, `fontTools` to regenerate; regeneration by hand. Costs later: a dozen pinned counts to
edit per kit. Two holes the round did not name: **`KitsGen` reads a pair's `name`, `ls` and `lh` from
`watch-fonts.json`, not `kits.json`,** and no test holds `watch-fonts.json`'s pair block to `theme.js`,
so a tracking change regenerated on one side and not the other passes both drift tests and ships last
week's tracking on every task line (a third copy of pair data, the thing the prompt forbade); and a
`theme.js` edit with neither suite run builds and ships the stale table with nothing red at build time.
Alternative to the second: a hash of `theme.js` stamped into the fixture and checked by the plugin
(pure Swift, no Node in the build, a `Diagnostics.warning` the zero-warnings rule turns into a blocker),
about fifteen lines a side. Node at its cache path in the prebuild, an `xcscheme` pre-action, a git
hook and an mtime check were each considered and are each worse. Changing today: about thirty lines
over two generators, one plugin and one test; nobody sees it. **Keep the shape; change the two
details.** Both are the failure the write-up says the design exists to prevent.

**4. Thirty-three font faces on the Watch.** The prompt said bundle the type; the count, weights and
method were the round's. Bought: the kit's type in both processes, the complication borrowing the 33 by
path instead of carrying 1.5 MB of copies, and the bold ui weight in six call sites where CoreText's
synthetic bold would be visible. Costs now: 1,238,128 bytes (1.24 MB, 1.18 MiB; the write-ups say
"1.3 MB") in an app whose Swift is under 5,000 lines; 132 hand-written `pbxproj` lines; 33 plist
entries; a licence audit that found one real defect (PT Sans without a licence pointer) and one open
question (15 faces across 9 families carry a Reserved Font Name through a format conversion). Instancing
made the bundle *smaller* than the 26 variable files (1.54 MB) while fixing `.weight()` being a no-op on
two families. The options, from `watch-fonts.json`: 31 files / 93 % without the Secret-only pair, 24
files / 76 % with one ui weight, 13 files / 45 % task faces only. **Keep the 33; the one option worth a
wrist's verdict is 24 files** (whether a bold ui weight is distinguishable at 12–16 pt on a 41 mm
screen is the wrist item). Do not drop the Secret-only faces: 80 KB, and a pair is not a secret.

**5. The Watch's own Day/Night picker.** Instructed, with the placement (the long press) the round's.
Bought: Paper on the wrist beside Ocean on the phone, no channel, persistence proven across a cold
launch, and the discovery that the old hold was gated on `canEdit`. Costs now: *Start again* lost its
gesture; changing a theme is a hold, a row, a slot button and a kit row; the slot button flips the live
slot as a side effect of choosing which slot to edit; and, unsaid by the round, **the wrist has no
automation at all.** Costs later: nothing that grows. Alternatives: phone-follows as ruled out (cheaper
than the write-up allows, since `extra` passes unknown keys through, but the phone app only reconciles
on navigation and launch); or (c) follow the phone's *slot* only and choose kits on the wrist, one
additive field and a toggle, about sixty lines and its own build. Changing today: (c) as above.
**Keep the picker; genuinely open on (c).** Pushback: the round's "the honest version is 'we will
not'" was the right register, and it should have added the one sentence that turns the rule into a
trade: without `system` or `schedule`, the Day slot on the wrist is a thing nobody will flip.

**6. Reversing the accent pin, and whether it shipped alone.** Instructed, and right: contrast on
Terminal went 4.12 → 13.29, and the picture (`tools/kitshots.js`, an amber block on a phosphor-green
terminal) was the finding the arithmetic could not produce. The round's own `cssText()` claim ("moved
exactly two kits") is short by one: three of eighteen differ (Light's danger token moved too; Kits
track). The process is where I disagree. The round pulled `derive()` onto its own branch because it
"moves without asking", with a measured reach of 0 of 2,000 *Surprise me* themes and 0 of 4 real
codes, and shipped the accent change, which reaches every device whose slot is Paper or Terminal (since
1.11, every device that never chose), inside a five-thing web deploy at 216. Both sides: the round's
rule ("crosses between people through the shared document") and the owner's ("reaches a screen without
the person's action") are different sentences, and the round was consistent with its own; the accent's
defence, the palette stamp, was only discovered from a field report mid-round and landed between 212 and
216, so an accent-alone deploy at 202 would have had no `data-tokens-rev`; and the round did four stamp
cycles anyway, so one more was cheap. Changing today: nothing in code. **Keep the design; change the
process:** write the rule once, in `COMPATIBILITY.md` §7 beside the checklist, in the owner's phrasing,
and name the unit it applies to (the set of fetched web files, or an app upload), not the build number
that stamps both. Pushback: at `0c83a5d` the round should have said "by this rule the accent goes alone
too, and here is why not"; the argument existed and was not made.

**7. A hand-written `TodaysFive.xcodeproj`.** Chosen in Phase 2, inherited here. Measured: 304 → 708 →
853 lines across the phases; 177 hand-numbered ids, none duplicated; the fonts are 132 of the 145 lines
Phase 4 added; the reserved id bands were respected and are now full (one `PBXFileReference` slot left).
Phase 5's four branches changed the file identically (four lines, the `WatchDiagnostics` registration)
and merge clean, **by discipline, not by format:** "no track adds a Swift file" is the cost, and it is
why `WatchDiagnostics.swift` is 400 lines in one file. Alternatives: XcodeGen (a dependency for three
targets, and commit-or-ignore the output), Tuist (heavier), SwiftPM (cannot make a watch app bundle),
and the one the round did not consider: Xcode 16's `PBXFileSystemSynchronizedRootGroup`
(`objectVersion` 77), still a hand-writable text file, no tool, the folder is the membership. Changing
today: rewrite four groups, bump the version, and let the device archive judge it (the archive is the
only compiler pass that speaks for a real watch, `923714c`). **Change, modestly:** keep it hand-written,
move the four folders to synchronized groups, in a branch, with the archive as the test; fall back to
widening the bands if the archive refuses. Not this review's to do.

**8. Launch-argument self-tests instead of driving the interface.** Chosen, on the stated ground that
"`simctl` cannot tap a watch simulator". Bought: rules a screenshot cannot check (ten shuffles never
repeating, the finale at 0.33 s and not on a remote completion, 96/96 faces by PostScript name, the
confetti arithmetic that found `Kit.shapes` flattened), cheap, no phone, no network, and they found real
bugs. What they cannot see is structural: both of Phase 5's "looks present, does nothing" bugs are
controls that were never *pressed*; `-TFAddSelfTest` called `AddService.add` directly and its
`visibleInterfaceController=present` meant "a branch would be taken". **Measured on this Mac:** the
watch simulator platform ships `XCUIAutomation.framework` and `XCTRunner.app`; `XCUIElement.tap`,
`press(forDuration:)` and the swipes carry only a tvOS exclusion; **`XCUIDevice.perform(handGesture:
.doubleTap)` is `API_AVAILABLE(watchos(10.0))`**, which contradicts Phase 3's "no way to inject the
gesture on a simulator" and Phase 5's plan. `simctl` has no tap subcommand on any platform; it was never
the tool. Cost of the alternative: a UI test target of about 100–130 `pbxproj` lines plus a `Testables`
entry in the shared scheme; 10–20 s a case on the pair. Would it have caught the caret and the +? Hit
testing inside `navigationTitle { }` and a WatchKit modal raised from under a SwiftUI sheet are
view-hierarchy facts, the same code on simulator and device, so probably; what no simulator test sees is
the microphone, Always-On and a completion that never returns. **Change: add both, not either.** Keep
the self-tests for rules; add a small XCUITest target written against Phase 5's controls; and correct
the two write-ups' Double Tap sentence (§8 has the replacement).

### My own list

| # | call | who | recommendation |
| --- | --- | --- | --- |
| 9 | `openAppWhenRun = true` on the iPhone intent | instructed in effect | **change to `false`**, or open if the owner likes seeing it land; since the doorbell the buy shrank to "watch it arrive" and the cost is the screen taken over on every add and every refusal |
| 10 | the complication reads a snapshot, not the core | chosen | keep |
| 11 | the Watch's decrypted documents live in the App Group | chosen | **change**: only `snapshot.json` reads from the group; the documents were put there for a reader that does not read them; `try? ListStore()` in two places (`WatchStore.swift`, Phase 5 overlap, so a write-up) and `next` written only when a rectangular family with `showLine` is configured; see W-F3 |
| 12 | `.listStyle(.carousel)` kept despite the ~50 % grey band on the seven light kits | chosen, deferred to a wrist | genuinely open; `.plain` behind a flag and two screenshots per light kit is an hour |
| 13 | the Watch picker's slot switch flips the live slot while 1.12's web picker was rewritten so that looking does not move the slot | chosen | keep, but write the divergence down beside 1.12's rule; it becomes wrong the day the wrist gains automation |
| 14 | `schedule` dropped from the Watch | chosen | keep; pursue 5(c) |
| 15 | default slot `.night` | chosen | keep |
| 16 | Secret kits cross the pairing as a "permission" (~200 lines with a codec) | instructed | genuinely open; the uncosted alternative is all 18 kits compiled in and one bit on the wire; the round should have priced both |
| 17 | the doorbell awaited inside `push()` with no timeout | chosen | **change**: `timeoutInterval = 5` on the ring; `URLSession`'s 60 s default holds the chained engine behind a hung broadcast; Phase 5 is on this path, so theirs to place |
| 18 | `RealtimeTransport` kept with no conformer | chosen | **change**: delete it (twelve lines) |
| 19 | the 300 ms finale hold on the Watch | chosen | keep |
| 20 | 1.12's `removed` set, never pruned | chosen | keep; ~23 bytes a removal is not real growth; but see C-BUG-1 for the cross-tab hole in the union |
| 21 | the two-step web picker previews without moving the slot | chosen against the prompt's letter | keep |
| 22 | `ask()` grew `extra`/`extraFirst` | chosen | keep; see C-P11 for the accent that cannot be reached |
| 23 | the iPhone finale as a Core Haptics pattern, engine started on touch-down | chosen | keep |
| 24 | the build number is the commit count on `main`, and they part company after the write-up commit | chosen | keep; stop treating equality as a check: §7 should say "at the merge commit" |
| 25 | the version stays 1.12 against the prompt's 1.13 | the round, ratified in the Phase 5 prompt | keep; the round's one true pushback, made by doing and reporting |
| 26 | `tools/shots.js` still types the Secret word | chosen | **change**: read it from the environment and skip the Secret shots when unset; hygiene, since the word is in history forever |
| 27 | the clock scrim as an overlay patch on the seven light kits | chosen | keep; a wrist says whether it reads as a bar or a smudge |
| 28 | three lists created against a two-list budget in Phase 4 | the round | nothing to change; the lesson is written |
| 29 | `Kit.shapes` resolved at the generator | chosen | keep |
| 30 | Phase 3's dictation design, WatchKit from inside a SwiftUI sheet | chosen | already reversed by Phase 5 (`3e17582`); the lesson is in §1 |

The pattern across the three rounds is in `review/raw/calls.md` ("The pattern") and I hold to it: the
measured calls were right; the reasoned ones were right in proportion to how close they stayed to
something the round could touch; and where the rounds went wrong they mistook the instrument they had for
the instruments that existed.
