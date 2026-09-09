# Today's Five for Apple — Phase 5: the wrist, from a real wrist

The plan, and at the end the results. **Every round before this one was verified on a simulator.**
This one begins with four findings from a real Apple Watch, which is a different kind of input: a
simulator can only ever say that code ran, and a wrist says whether the thing works. Two of the four
findings are features that look present and do nothing, which is worse than absent.

Read `COMPATIBILITY.md` first — all of it, §7 and §8 included — then `apple/README.md`,
`apple/PLAN-apple-phase3.md` (the Watch), `apple/PLAN-apple-phase4.md` (the look and the poll) and
`apple/DECISIONS-apple.md`. This round changes the web app in §4, which makes §7's release checklist
binding the way Phase 4's was and Phase 3's was not.

**The version stays 1.12. Only `BUILD` moves.** That is the standing rule from Phase 4 §5 and it is
not a per-round choice.

---

## The instrument rule, and why this plan has it

The simulator has lied to this project twice. Once about dictation: a machine with **no microphone**
reported `visibleInterfaceController=present`, and that line was read as the feature working when all
it ever said was that a branch would be taken. Once about a 32-bit `Int`: every simulator here is
64-bit, so `swift test`, both simulator builds and four on-device self-tests all accepted an integer
literal that `arm64_32` refuses to compile.

So: **every claim in this round names the instrument that measured it and what that instrument cannot
see.** Where only a wrist can answer, it says so and the claim goes on the list at the end rather
than into the results.

The three instruments this round has, and their blind spots:

| instrument | what it can say | what it cannot see |
| --- | --- | --- |
| `swift test` (host, macOS arm64) | every rule in the core, and the new add-path rules | anything about a view, a presentation, a font on a wrist, or `Int` width on `arm64_32` |
| the watch simulator (Series 11 46mm, watchOS 26.5) | that code ran, what it printed, what a screenshot of the app's own layer shows | **no microphone**, **no tap** (`simctl` lists and screenshots and nothing else), no watch face, no Double Tap, no Action button, no Always-On |
| `xcodebuild archive` for `generic/platform=iOS` | that the watch app *compiles for a real watch* — a pass nothing else in the loop performs | nothing about behaviour |

And one instrument this round tried to add and could not:

**Driving the Simulator app through the desktop was asked for and declined.** `request_access` for
Simulator was refused by the user, so Phase 3's wall — *`simctl` cannot tap a watch simulator* —
still stands, and with it every check that needs a finger: whether the title button receives a tap,
what a complication looks like on a face, whether the picker's rows can be reached on a crown. Those
are wrist items in this round exactly as they were in the last two, and they are named as such rather
than approximated.

### The consequence that drives the whole round: the wrist runs Release

Every diagnostic this project has — `-TFSelfTest`, `-TFWatchSelfTest`, `-TFAddSelfTest`,
`-TFFontSelfTest`, `-TFConfettiSelfTest`, `-TFFaceProbe`, `-TFKit`, `-TFShow`, `-TFThemeSet`,
`-TFFinale`, `-TFFinaleHold` — is `#if DEBUG` and reached by a launch argument. **A TestFlight build
is Release and takes no launch arguments**, so on the one device where these four bugs live, the
project is currently blind. That is not a detail; it is why a feature could look present and do
nothing for an entire round without anything going red.

So this round's first deliverable is not a fix. It is an instrument that survives Release:

**`WatchDiagnostics`** — a bounded in-memory trace the shipping app writes on the paths that matter,
and one screen that shows it, reachable from the long press on the count. It is built to the same
privacy rule as every `print` in this project, and built so that the rule is not a habit but a
property of the type: **a trace entry is a fixed `Event` case plus integers.** There is no field that
can hold a line of somebody's list, an id, a link, a URL or a fragment, so none can leak — not into
the screen, not into a screenshot Price sends back, not into a filename.

That is what makes the rest of this round answerable from a wrist at all: Price taps, reads, and
reports, with no Xcode, no cable and no console.

---

## Checkpoint report: what was measured before anything was written

Everything in this table was run on this machine, not remembered.

| | |
| --- | --- |
| Xcode | **26.6** (17F113), Swift **6.3.3** |
| Simulator runtimes | iOS 18.1 / 26.5, watchOS 11.1 (22R581) / **26.5** (23T570) |
| the pair | Apple Watch Series 11 46mm `4594CB69` + iPhone 17 `C33542F5`, pair `4B6A97F5`, **active, connected**, both booted |
| real devices | `xcrun devicectl list devices` reports **one** — *Price's iPhone (2)*, iPhone 17 Pro Max — and its state is **`unavailable`**. No Apple Watch appears at all. **Nothing in this round can reach the real wrist**, so every wrist claim is Price's to settle |
| git | clean on `main`, `git rev-list --count main` = **217** |
| the web | **1.12 (216)**, four build homes plus `PANELS_BUILD` and six `CURRENT_PROJECT_VERSION` lines in `project.pbxproj` |
| baseline Node | **136 tests** — model 28, theme 33, crypto 10, sync 14, sound 12, features 30, compat 9 — green |
| baseline `swift test` | **130 tests in 10 suites**, 8.0 s — green |
| Simulator GUI control | **requested and denied.** `simctl` still cannot tap a watch |
| `brew`, `gh`, `npm`, Lighthouse | still absent. Node is off `PATH` at `~/.cache/codex-runtimes/…/node/bin/node` (v24.19.0) |

### What reading the code already says about the four findings

Each of these is a reading, not a measurement, and each is written here so that the results can
contradict it rather than quietly absorb it.

**1. The add path has three taps in it and a modal presented from inside a modal.** The `+` on Today
is a `Button` that sets `showAdd = true` (`TodayView.swift:113`). That opens a `.sheet` carrying
`AddFlowView` (`WatchApp.swift:200`). Inside that sheet is a *second* button, and only that one calls
`WatchDictation.present`, which calls WatchKit's `presentTextInputController` on
`WKApplication.shared().visibleInterfaceController` — **while a SwiftUI sheet is on screen**.
A WatchKit modal raised from underneath a SwiftUI presentation is the first thing hypothesis (a) would
predict, and the observed symptom — a microphone that lights and a screen that does not change — is
what it looks like.

**2. Nothing in the app asks for the microphone, which narrows the field usefully.**
`Config/WatchInfo.plist` has no `NSMicrophoneUsageDescription` and the watch target links no audio
framework. So the mic Price saw light up is **the system's**, acquired by the system's own dictation
inside the text-input controller. That is evidence *for* "it was presented and is invisible" and
against "an App Intent took the microphone", and it is the one thing about this bug that could be
settled without a wrist.

**3. `working` is a one-way latch.** `AddFlowView.begin()` sets `working = true` before presenting and
clears it only inside the completion handler. If the completion never arrives — hypothesis (c) — the
`+` and its Double Tap shortcut are disabled **for the life of the sheet**, with no sentence and no
timeout. Whatever the root cause is, this turns one failure into a dead control.

**4. The list-picker title is a `Button` inside `navigationTitle { }`.** `WatchApp.swift:273` puts a
`Button` in the watchOS-exclusive view-taking `navigationTitle` overload, shows the chevron when
`store.links.count > 1`, and `.disabled(store.links.count < 2)`. The caret therefore proves the
button is **enabled** and that Price holds at least two lists — so "tapping does nothing" is not the
disable. Phase 3 chose this shape because *watchOS has no SwiftUI `Menu`*, and that reasoning is
sound about `Menu` and says nothing about whether the navigation bar's title area is hit-testable. It
is the prime suspect and the round's own decision is named in §2.

**5. The corner complication shows the done count and nothing else.** `CountView`'s
`.accessoryCorner` arm is `Text("\(snapshot.done)")` with a `Gauge` in `.widgetLabel`
(`Complications.swift:232`). Not `snapshot.fraction` — just `done`. So on a bottom corner the wearer
sees a bare digit with no denominator, and a bezel arc the host draws a few points thick. **"A 1 and
a dot on a line" is an accurate description of what that code asks for**, which is the useful part of
finding 3: it is a design defect, reproducible by reading, and does not need a face to diagnose —
only to confirm the replacement.

**6. Nothing in `sync.js` ever re-subscribes on its own.** `subscribe()` is called from `open()` and
from `wake()`, and `wake()` is called only from `visibilitychange`, `focus`, `pageshow` and `online`
(`sync.js:402-410`). `schedulePoll()` never calls it. And `alive()` is
`!closed && !failed && (ch.state === "joined" || ch.state === "joining")` — **the channel's own
opinion of itself**, which the file's own comment at `sync.js:126` already says can be wrong:
*"After sleep/wake the socket may be dead while channels still say 'joined'; nudge it."* A page that
believes it is live sits on `POLL_LIVE_MS` = 240 000 ms. A visible-but-unfocused window gets no focus
event, so there is no second door. That is the hypothesis §4 tests.

---

## §1. Add-by-voice — the round's first priority

It is the reason the Watch app exists and on a real wrist it does nothing.

### What is known, and by which instrument

| | |
| --- | --- |
| the mic was acquired | **Price's wrist.** And the app asks for no microphone permission and links no audio framework, so it was the **system's** dictation — read off `Config/WatchInfo.plist` and the target's link list |
| no UI appeared | **Price's wrist** |
| no line landed | **Price's wrist** |
| `visibleInterfaceController` is non-nil | **the watch simulator.** It says a branch will be taken. It has never said the branch works, and Phase 3's results line must stop being cited as if it had |
| the WatchKit controller lands on QWERTY | **the watch simulator**, which has no microphone, so this says nothing about what a wrist shows |

### Instrument it before fixing it

`WatchDiagnostics` records the add path as a sequence of fixed events, and the on-wrist screen shows
them. What has to be distinguishable, because these are the three hypotheses and they look identical
from outside:

* `addPresentCalled` / `addPresenterMissing` — was `present` reached, and was there a controller;
* `addControllerPresented` — did `presentTextInputController` return without throwing;
* `addCompletionNil` / `addCompletionEmpty` / `addCompletionText(chars:)` — did the callback fire, and
  with what. **The length only.** A trace that could hold the text would be a trace that could leak
  one;
* `addServiceCalled`, `addLanded(chars:)`, `addRefused(reason:)` — did the core see it;
* `addTimedOut(afterMs:)` — the completion never came.

Those seven answer "presented but invisible", "never presented", and "presented and dropped"
separately, which no amount of reading can.

### The fix, and why it does not depend on which hypothesis is true

We cannot test on a wrist, so a fix that bets on one hypothesis is a fix that might ship wrong again.
Every change below is right under *all three*:

1. **The `+` on Today becomes the input control itself.** No sheet in the way. The three-tap journey
   (+ → sheet → Add → speak) becomes one tap, which is what "tap, speak, done" was always supposed to
   mean — and it removes the sheet-inside-a-presentation from the suspect list entirely.
2. **`TextFieldLink` becomes the path, and WatchKit the fallback** — the exact reverse of Phase 3.
   `TextFieldLink` is the SwiftUI-sanctioned input on watchOS: the system presents its own full-screen
   input screen, from the app's own presentation hierarchy rather than across it, and that screen is
   where dictation lives on a real device. It still **cannot force** dictation — nothing on watchOS
   can, and `WKTextInputMode` widens which characters may come back rather than choosing the method —
   but it cannot be invisible either, which is the failure being fixed.
3. **`working` stops being a latch.** A timeout resets it and records `addTimedOut`, so a failure
   costs one attempt rather than the screen.
4. **The confirmation and the Undo are unchanged.** They were never the bug and they are the half of
   this flow a simulator could prove.

**What this gives up, stated plainly:** with `TextFieldLink` the app no longer chooses the input
method even in principle, so a wrist whose last input was the keyboard gets the keyboard. The WatchKit
path's one theoretical advantage — `withSuggestions: nil` skipping the chooser — was never observed to
produce dictation on any instrument available to this project, and it is what is broken. Trading an
unobserved advantage for a path that reliably renders is the call, and §5 logs it.

**The phone relay, for the third time.** Phase 3 logged it and declined it; Phase 4 did not revisit
it. It is still declined, and the reason is now stronger rather than weaker: `TextFieldLink`'s system
input screen *has* dictation on a real wrist, so the relay would not be buying a capability, it would
be buying a preference for which method opens first — at the cost of a path that needs the phone awake
and in range and turns the Watch back into a terminal for the phone, which is the thing the whole data
path is designed to avoid. If the wrist says `TextFieldLink` opens a keyboard and will not offer the
mic, the relay becomes the only remaining answer and §5 says what it would cost.

### All four ways in, re-verified — and three of them cannot be verified here

| way in | what this round can say | who settles it |
| --- | --- | --- |
| **the `+`** | the control is a `TextFieldLink` in the Today list; the trace records every step | **a wrist** |
| **Siri** | the App Shortcut exists and the intent's add path is covered by `swift test`; the phrases are unchanged | **a wrist** — and whether the dialog is spoken |
| **Double Tap** | `.handGestureShortcut(.primaryAction)` now sits on the one control that *is* the add, rather than on a button that opens a sheet containing another button with the same shortcut — **two primary actions on one screen was itself a defect** | **a wrist.** There is no way to inject the gesture |
| **the Action button** | there is still no developer-facing API in the watchOS 26.5 SDK; an App Shortcut existing is the whole of what an app can do | **a wrist** |

Reported unverified is the rule. A path is not assumed to share a working one.

---

## §2. The list picker looks tappable and isn't

### First, whether the tap arrives

`WatchDiagnostics` gets `titleTapped`, written by the title button's action. Price presses the title,
opens Diagnostics, and reads. That single datum splits the fix in two and neither half is a guess:

* **the event is there** → the tap arrives and the *presentation* fails. The sheet is raised from a
  `navigationTitle` closure, which is a view the navigation bar owns; a presentation anchored there is
  the suspect, and the fix is to raise the sheet from the content instead;
* **the event is absent** → the navigation bar's title is not hit-testable on a real watch, Phase 3's
  "the title itself is a button" was the bug, and the control has to move.

### Then, make it work — and it works either way

The round does not wait on that datum, because list switching can be given a control that is
hit-testable by construction:

1. **A Lists row in the sheet behind the long press on the count.** That gesture is already proven —
   Price reaches the theme picker through it, so the hold works and the sheet presents. Adding *Lists*
   beside *Start again* and *Theme* makes switching reachable on a path that is **known to function on
   his wrist today**. It is two taps where the title was meant to be one, and a working two beats a
   decorative one.
2. **A list row at the top of Today**, carrying the name, the pills and the chevron, when the device
   holds more than one list. A `List` row on watchOS is the most reliably tappable thing the platform
   has — it is what every other control in this app already is — and it puts the affordance where the
   caret was promising it.
3. **The caret leaves the title.** Whatever the diagnosis, a title that advertises an action it may
   not perform is worse than no control, and the title's job is to say which list you are looking at.
   It keeps doing that, in the kit's accent, and stops promising.

**The pills come along and view-only still refuses writes.** `ListPickerView` already draws *view
only* and *Shared* in the rail's order and both can be on at once; the new row draws the same two from
the same `VaultedLink` fields. A view-only list refuses before the document is touched, which is
`store.canEdit` and the core's own guard — unchanged, and covered by `swift test`.

---

## §3. A pass over the complications, at the size they actually render

### What is wrong, and it is readable

The `.accessoryCorner` arm shows `snapshot.done` — a bare digit, no denominator — with a `Gauge` in
`.widgetLabel`. On a bottom corner slot the host draws that gauge as a thin arc along the bezel a few
points long. **"A 1 and a dot on a line" is what that code asks for.** Diagnosing this needed no face;
confirming the replacement does.

### What each family is actually for, at its real size

| family | where it sits | what it can hold | what it should say |
| --- | --- | --- | --- |
| `.accessoryCircular` | a round slot, ~58 pt | a ring and about two characters inside it | the proportion, as a ring, with the count inside — **the glance.** Unchanged in shape |
| `.accessoryCorner` | a screen corner, a few points of content plus a curved bezel label | one glyph or 2–4 characters, and a bezel label | **a glyph and the fraction.** The count alone has no context; `1/5` has all of it in three characters |
| `.accessoryRectangular` | ~72 × 32 pt, three short lines | the most of any family | the name and the count, and the line **only** when the wearer opted in |
| `.accessoryInline` | one line beside the time, the face's own font | text only — it ignores fonts and colours both | `3/5`. It is the one family a kit cannot reach at all, and that is the SDK's, not ours |

### The corner, specifically

The gauge goes and the **fraction** takes the content slot, set in the kit's ui face, with a glyph
beside it when there is room and a check when the list is finished. The bezel label becomes **text**
rather than a gauge: a curved `Text` is legible at that size and a 3-point arc is not. That is a
decision about a rendered thing, and the thing it is decided from is the geometry the host documents
plus the count of characters that fit — **not** a look at a face, which nothing here can take.

`.widgetAccentable()` stays exactly where it is. Phase 4 measured `.accented` flattening colour at
composite time — `ImageRenderer` at `.fullColor` and at `.accented` came back byte-identical — so
**type, glyph and shape are the only levers** and no part of this round spends itself trying to get
colour through.

### The open question a real face can answer

**Does a complication render the kit's type?** Phase 4 built the mechanism and proved every link in it
except the last: the appex is inside the Watch app's bundle, the 33 faces are two directories up,
`CTFontManagerRegisterFontsForURLs` resolves all 33 — *verified from the Watch app against the
extension's own bundle URL* — and `FaceType` falls back to the system face without complaining when
it does not resolve. What could never be observed is the widget host permitting a custom face at
render time on a face. **A wrist settles it, and it is on the list with a pass and a fail that are
told apart by looking**: Terminal's complication in IBM Plex Mono, or Terminal's complication in the
system's rounded face.

---

## §4. The list doesn't move on a screen that isn't focused

The product's premise is a list left open on screen all day. **A second monitor showing the list,
unfocused, is therefore the primary case** — and it is the case that fails. Crossing a line off on the
wrist does not reach that screen until the window is clicked.

### Grounded, so it is not re-derived

* `visible()` is `document.visibilityState !== "hidden"` (`sync.js:47`), so a visible-but-unfocused
  window already counts as visible and the poll runs.
* `listen()` registers `visibilitychange` → `onVisible`, `focus` → `onFocus`, `pageshow` → `onFocus`
  (`sync.js:402-410`). Clicking the window is a **focus wake**, which is exactly why clicking fixes it.
* `POLL_LIVE_MS` is 240 000 against `POLL_MS` 60 000.
* **And the two lines the brief did not have:** `subscribe()` is reachable only from `open()` and
  `wake()`, and `wake()` only from those four events — `schedulePoll()` never re-subscribes. And
  `alive()` trusts `ch.state`, which `sync.js:126`'s own comment says can read `joined` over a dead
  socket.

### The hypothesis, to be tested and not assumed

**The realtime channel drops or is throttled without the client noticing, leaving a page that believes
it is live sitting on a four-minute poll.** It is the same failure family as Phase 4 §4 — trusting a
bell nobody rings — arriving from the receiving end instead of the sending end: there the writer never
rang, here the listener stopped hearing and went on believing.

### Measure first

A harness in the shape of `tools/polld.js`, which already knows how to do this honestly — one context
per trial, a random phase offset into the poll period, and a harness that **cannot report "nothing
ran" as "nothing happened"**, which is the lesson Phase 4 wrote down after a dead static server
produced a clean table.

| condition | what it isolates |
| --- | --- |
| visible, **unfocused**, realtime connected | the reported bug. Ten trials |
| visible, **focused**, realtime connected | Phase 4's sub-second win — **re-measured, to prove it did not regress** |
| visible, unfocused, **socket forcibly dropped** | the hypothesis: does the client notice |
| visible, unfocused, **machine slept and woken** | what a day-long window actually meets |

Reported as a **distribution and the mechanism that produces it**, never a median from ten samples of
a wide distribution — Phase 4 lost three different medians to that and kept the ratio. Browsers named.

### Where the fix belongs

**In channel liveness, not in a shorter poll.** A heartbeat, or treating a long silence as a dropped
channel and rejoining. `POLL_LIVE_MS` does not move: shortening it costs 4× the polls at idle forever
on every device including web devices with no Watch, and Phase 4 rejected it on those numbers. The
**29-byte idle poll does not move** and neither does the sub-second focused case.

The shape, to be confirmed by what the measurement says:

* a channel that has heard nothing for longer than it should have is **not alive**, whatever `ch.state`
  says — so `alive()` gains a silence test, and the client stamps the last thing it heard;
* the 240-second safety poll becomes the occasion to **check liveness and rejoin**, which costs
  nothing at idle because it is a timer that already fires;
* a rejoin that fails drops `live` to false, which puts the poll back to 60 s by itself — the existing
  machinery, reached by telling it the truth.

**Nothing about the contract moves.** The channel is still `list:<lookupId>`, the broadcast is still a
doorbell, the three RPCs are untouched, and `COMPATIBILITY.md` §4 is satisfied by construction: this
changes when a client rejoins a channel, not what crosses it.

---

## §5. Carried from Phase 4, not lost

* **`derive-ink3-next`** is pushed and unshipped, with its real numbers: 38.4 % of pickable accents
  under the floor on dark and 56.4 % on light, and the live risk is the accent focus ring on
  destructive confirms at **2.18:1** against WCAG's 3:1. **It ships alone, in its own build, not folded
  into this round.** This round does not touch it.
* **The 15 Reserved Font Name faces.** Whether they must be renamed is a legal reading Price has not
  answered. The practical reading stays in place and the write-up stays in `Fonts/README.md`. Not this
  round's to decide.
* **`data-tokens-rev`.** If a page ever shows the old amber accent again, that attribute settles
  whether a second bug exists: **absent** means the page is pre-b216 and §6's iOS HTTP-cache behaviour
  is the answer; **`1ptwfkh` with an amber accent** means a bug still unfound. The question stays open
  and stays written down.

---

## Non-negotiables

* **`COMPATIBILITY.md`, all of it.** No document, key, link, RPC or registry shape moves. §4's change
  is to when a client rejoins a channel it already has, and nothing about the channel.
* **No secret in a log, a screenshot, a screenshot filename, a commit or a crash report.** The new
  trace is built so this is a property of the type rather than a habit of its call sites.
* **Create-limit hygiene.** Tests use `MemoryTransport`; the live run creates **at most two** lists and
  deletes them. Phase 4 spent three and said so. If this one spends more, it says so.
* **The version stays 1.12; the build increments.** Four web homes, `PANELS_BUILD`, and six
  `CURRENT_PROJECT_VERSION` lines in `project.pbxproj`.

---

## The tracks

Four, in worktrees, each with a written contract and a budget. **Sub-agents never merge**; the
orchestrator does, after `swift test`, the Node suites, both Xcode builds and the archive are green on
the integrated branch.

Branch **`watch-fixes`**, pushed after each logical commit.

**Two things are the orchestrator's and no track's.** The `.xcodeproj` — hand-written, no XcodeGen, and
four agents editing one `project.pbxproj` is a merge conflict with a build system attached. And
**`WatchDiagnostics.swift`**, because three of the four tracks write to it and it has to exist, be
registered and be committed *before* any of them starts. No track adds a Swift file; new code goes in
the file that owns the concern.

| track | what | files it owns |
| --- | --- | --- |
| **A — the voice path** | §1. Instrument the add path, make the `+` the input, reverse the `TextFieldLink`/WatchKit precedence, unlatch `working`, Double Tap on one control | `WatchDictation.swift`, `AddFlowView.swift`, `Shared/AddToTodaysFive.swift`, and in `TodayView.swift` **only** `addRow`; in `WatchApp.swift` **only** the `showAdd` sheet and `onOpenURL` |
| **B — the picker** | §2. `titleTapped`, the Lists row in the actions sheet, the list row on Today, the caret off the title | `ListPickerView.swift`, and in `TodayView.swift` **only** `CountActionsView` and the header; in `WatchApp.swift` **only** `titleButton` |
| **C — the complications** | §3. The corner redesign, a pass over all four families at their real sizes, the type question written for a wrist | `TodaysFiveComplications/*`, `Shared/WatchSnapshot.swift` (additively, `v` stays 1) |
| **D — the web** | §4. The harness, the four conditions, the liveness fix, the suite | `tools/` (new harness), `sync.js`, `test/sync.test.js` |

A and B both touch two files. The regions are named above and do not overlap; the orchestrator
resolves anything git cannot.

---

## Verification — do it, don't just say you did

* `swift test`, all seven Node suites, `node tools/e2e4.js` at **1440×900 and 390×844** — zero page
  errors, zero CSP violations, zero third-party requests.
* Both Xcode builds, **zero warnings**: iOS Simulator and watchOS Simulator.
* **`xcodebuild archive` for `generic/platform=iOS` before claiming anything compiles.** For a watchOS
  target that is a *compiler pass nothing else in the loop performs* — it is what caught the 32-bit
  `Int`.
* `-TFAddSelfTest`, `-TFWatchSelfTest`, `-TFFontSelfTest`, `-TFConfettiSelfTest` on the paired
  simulators, green, and the new trace visible in `-TFShow diagnostics`.
* **§4's latency table**, browsers named, with the focused case re-measured to prove Phase 4's win did
  not regress, and the same table after the fix.
* **One live run** against the real backend with `tfive` on the other side, lists deleted after.
* The archive staged for Organizer, with the build number.

### What only a wrist can answer

Written here in advance so the results cannot quietly absorb them:

* whether the `+` now opens an input screen at all, and whether that screen offers the microphone;
* whether **Double Tap** starts it;
* whether **Siri** hears the phrases, and whether the dialog is spoken;
* whether the **Action button** takes the intent;
* whether the **title** receives a tap (`titleTapped` in Diagnostics settles it, on his wrist);
* whether the four complications read at the size they render, and **whether a complication renders
  the kit's type**;
* whether the unfocused-window fix survives a real day on a real second monitor.

---

## Results

*(filled in at the end of the round)*
