# Today's Five for Apple — Phase 3: the Watch

The plan, and at the end the results. This phase builds the Apple Watch app: Today on your wrist,
crossing a line off with a tap, one thing at a time, complications on the face, and four ways to put
a line on the list by speaking. It is the reason we went native.

Read `COMPATIBILITY.md` first — all of it, §8 included — then `apple/PLAN-apple.md` (the core) and
`apple/PLAN-apple-phase2.md` (the iPhone shell). This phase adds a third client of the same contract.

Phase 1, 2 and 2b are on `main`: the Swift core with 94 tests and live interop; the iPhone shell on
the live site with haptics, the Keychain vault and universal links; the paid team, the association
file, and an archive staged for TestFlight. The 1.12 round added a Core Haptics finale to the phone
that has never been uploaded. **This round's upload carries it.**

---

## Checkpoint report: what was measured before anything was written

Everything in this table was run on this machine, not remembered. Where a claim could not be settled
here it says so, and where it can only be settled on a wrist it says that too.

| | |
| --- | --- |
| Xcode | **26.6** (17F113), Swift **6.3.3**, licence accepted |
| Simulator runtimes | iOS **18.1** / **26.5**, watchOS **11.1** / **26.5** |
| Pairs | three pre-existing 18.1 + 11.1 pairs; a new **26.5 pair** made for this round (Apple Watch Series 11 46mm + iPhone 17), which reports `active, connected` |
| git | clean on `main`, the web at **1.12 build 158**, 160 commits |
| Node | still not on `PATH`; `~/.cache/codex-runtimes/…/node/bin/node` (v24.19.0) is what the web suites run under |
| `brew`, `gh` | still absent. The `.xcodeproj` is still hand-written and committed |
| baseline | `swift test` **94 tests in 7 suites**, green; `xcodebuild -scheme TodaysFiveCore -destination 'generic/platform=watchOS'` builds |

### The four things a reading could not have told us

**1. `WatchConnectivity` works between paired simulators.** This was the single biggest risk in the
round — the whole of §2 stands on it, and the fallback (a debug launch argument injecting a link
straight into the Watch's vault) would have made every check a check of the harness. A throwaway
probe settled it: the phone reported `activation=2 paired=true installed=true`, sent an application
context carrying a nested array of dictionaries, and the watch app printed it back. No fallback is
needed. Three things the probe turned up that the design has to carry:

- **Installing the phone app on a paired simulator does not install the watch app.** `simctl install`
  on the phone leaves `isWatchAppInstalled == false` and every `updateApplicationContext` throws
  `WCErrorCodeWatchAppNotInstalled` (7006). The watch app must be installed onto the watch simulator
  explicitly. This is the failure that looks exactly like "WatchConnectivity is broken in the sim".
- **`receivedApplicationContext` was empty at activation** even with a context pending; delivery came
  through `session(_:didReceiveApplicationContext:)`. The Watch reads the callback, not the property.
- **The callback fired twice for every send.** Reproduced across separate runs. Whatever the cause,
  **the receiver must be idempotent**, and §2's payload carries a stamp so that it is.

**2. The `ConfigGen` build-tool plugin could not survive a second target.** The moment the Watch app
also depends on `TodaysFiveCore`, one build plans the plugin twice — once per platform — and the
build system refuses outright:

```
error: Multiple commands produce '…/BuildToolPluginIntermediates/todaysfivecore.output/TodaysFiveCore/ConfigGen/Config.generated.swift'
    note: Target 'TodaysFiveCore': CustomTask Reading config.js e35cce56…
    note: Target 'TodaysFiveCore': CustomTask Reading config.js 21f1759e…
```

The plugin work directory is keyed by package, target and plugin — **not by platform** — and nothing
in `PluginContext` or the plugin's environment distinguishes the two invocations (the plugin process
inherits the login environment and sees no build settings at all; measured). A *build* command
declares the file it produces, so two producers of one path is a hard error. A **prebuild** command
hands over a directory the build system globs instead, and the collision cannot arise. That change
forced a second: *"a prebuild command cannot use executables built from source"*, which is the build
system's own sentence about `tfconfiggen` — so the writer is now `/bin/sh` and `tfconfiggen` is gone.
`config.js` is still read at build time and neither value is ever typed into Swift, which was the
whole point of the plugin.

**3. The App Store Connect key can use capabilities but cannot add them.** Registering the watch
app's App ID with `-allowProvisioningUpdates` and the App Manager key worked first time. Adding
**App Groups** to it did not, twice:

```
error: Authentication failed: Make sure a bearer token was provided, it is properly configured and signed, and it has not expired.
error: Provisioning profile "iOS Team Provisioning Profile: *" doesn't include the App Groups capability.
```

That is the same wall Phase 2b hit on cloud-managed distribution certificates, one level along: an
**App Manager** key may consume a capability and may not create one. What lifts it is the Apple ID
now signed into Xcode — `-allowProvisioningUpdates` with **no** `-authenticationKey*` flags at all
uses the account instead of the key, and `group.com.pricebrannen.todaysfive` is now in the watch
app's signed entitlements. **So the build recipe splits**: the key for ordinary builds, the account
for any build that changes a capability.

**4. Neither `Speech.framework` nor `CoreHaptics.framework` exists in the watchOS SDK.** The first
is §3's premise, now grounded rather than assumed. The second is new and it costs something: 1.12's
finale pattern — the volley in the hand, seven transients 65 ms apart with a chord under it — is a
`CHHapticPattern`, and the Watch cannot play one. The Watch's finale is `WKInterfaceDevice`'s
vocabulary on the volley's rhythm and nothing finer. Written up in §1.

---

## What the Watch app is, and what it is not

A watchOS target in `apple/TodaysFive.xcodeproj`, SwiftUI, depending on `TodaysFiveCore`. It shows
Today and lets you cross things off and add things from your wrist. **Resist the rest.** There is no
Everything, no sections, no History, no rules, no templates, no themes, no settings screen. Those
live on a phone-sized screen because they need one.

| | |
| --- | --- |
| target | `TodaysFiveWatch`, `com.pricebrannen.todaysfive.watchkitapp` |
| deployment | **watchOS 11.0** — Double Tap's `.handGestureShortcut` is `@available(watchOS 11.0, *)` and there is no earlier spelling. The package floor stays watchOS 10; a target may sit above its package |
| complications | `TodaysFiveComplications`, `…watchkitapp.complications`, a widget extension embedded in the **watch app** (not the phone app) |
| version | `MARKETING_VERSION 1.12`, `CURRENT_PROJECT_VERSION 158` on all three bundles — the web's numbers, per Phase 2b's rule that the app's version is the page's version |

### 1. Today

The Today lines in the app's own type feel — large, the checkbox, the count.

- The list is `doc.todayItems` — the core's `sortSink` already sinks done lines by `doneAt`, which is
  the web's rule, so nothing about ordering is re-derived here.
- **Tap to cross off**: strike, the row settles, `WKInterfaceDevice.current().play(.success)`. Tap
  again to uncheck: `.click`.
- **The check-off writes exactly three fields** — `done`, `doneAt`, `updatedAt` — and then stamps
  `doc.updatedAt`. It does **not** touch `today`, `order` or `todayOrder`: the sink is derived, not
  stored, and a client that writes new `todayOrder` values on a check-off fights the web on every
  merge. (This is the trap the web's own code makes easy to fall into and the CLI already avoids.)
- **The settle** is the web's 320 ms after a check-off and 160 ms after an uncheck. The document
  changes at once; only the re-order waits.
- **The count** is done-over-total for what is on screen, the way the rail's `d/n` is.
- **The finale.** When every line on Today is done and one was not a moment ago, the count fills, a
  haptic run plays, and the card reads **That's the list.** — the web's own default string. The web
  holds the chord 300 ms after the check-off that caused it; the Watch holds the same 300 ms, for the
  same reason, so the two feel like one product.
- **Start again** lives behind a **long press on the count**. Worth saying plainly: *the web has no
  long press on the count* — there a plain tap toggles one-thing mode, and Start again is a button
  under the finale card reading "Bring them all back". The long press is a Watch idiom for a Watch
  that has no room for a second button; the *action* is the web's `startAgain()`, which un-dones
  every done line in the view with a fresh `updatedAt` each and dispatches the uncheck moment.

**The haptic vocabulary**, and it is narrower than the phone's on purpose:

| moment | phone (1.12) | Watch |
| --- | --- | --- |
| check | `UIImpactFeedbackGenerator(.medium)` | `.play(.success)` |
| uncheck | `.light` | `.play(.click)` |
| shuffle | `.light` | `.play(.click)` |
| finale | a `CHHapticPattern`: 7 transients at 65 ms, a fuller one at 210, the chord at 700 with a 320 ms roll | **a timed run of `.play(_:)`** on the same onsets — seven `.click` 65 ms apart, then `.success` at 700 |

The finale run is an **approximation and is labelled one**. `CoreHaptics` is not in the watchOS SDK,
`WKInterfaceDevice.play(_:)` takes no time argument and no intensity, and watchOS coalesces haptics
that arrive too close together. The rhythm is still `fx.js`'s volley — seven, sixty-five, seven
hundred, read across rather than invented, exactly as `Haptics.swift` reads them — so if the volley
is ever re-choreographed both clients are wrong together and `test/sound.test.js` says so. What the
Watch cannot claim is the shape of each tap. A simulator has no motor, so what a simulator run proves
is the *count and the spacing of the calls*; whether it feels like the confetti looks is a wrist
question.

The web's own buzz table is the cross-check: `sound.js`'s `FINALE_BUZZ` is fifteen values whose
onsets are those same seven plus a long one on the chord, a check-off is `buzz(8)`, an uncheck has no
buzz at all, and shuffle is `navigator.vibrate(10)`. The Watch gives the uncheck a `.click` where the
web gives it silence — a deliberate divergence, because a wrist that answers a tap with nothing reads
as a tap that missed.

### 2. One thing

A second page — swipe, or the Crown — carrying the top undone line, huge.

- `TabView` with `.tabViewStyle(.verticalPage)` (watchOS 10, and watchOS-only).
- The shown line is `undone.first(where: { $0.id == shuffled }) ?? undone.first`, computed at render
  time, which is the web's `renderToday`.
- Cross it off and the next slides in.
- **Shuffle** — a firm swipe or a Crown flick — is the web's rule, ported exactly:
  - the pool is the **undone Today lines minus the one currently shown**;
  - 0 or 1 undone: a wobble, and no state change at all;
  - the pick is uniform over the pool, so with exactly two undone lines it is deterministic;
  - **nothing is written to the document** — shuffle is pure view state;
  - the shuffle pick is cleared **lazily, inside render**, the moment the shuffled line stops being
    undone, and eagerly when a list is opened or one-thing mode is entered or left. Clearing it
    lazily is what makes a remote pull that deletes or un-stars the shuffled line fall back to the
    top undone line on the very next render with no extra bookkeeping.
  - the haptic fires **on the gesture**, not after the 160 ms settle.
- The footer is the web's words: **"N more after this"**, or **"Last one"**.

### 3. Lists

If the phone holds more than one list, a picker behind the title.

- watchOS has no SwiftUI `Menu`, so the picker cannot be a dropdown. It is the watchOS-exclusive
  `navigationTitle { }` overload — the title itself is a `Button` — pushing a list of the vaulted
  links.
- **Shared** and **view-only** are two independent pills and both can be on at once, as on the web.
  The words are the web's: **"Shared"**, and **"view only"**.
- A view-only list **cannot be changed**: no check-off, no add, no Start again. The core already
  refuses to push a view ref; the Watch refuses before the document is touched, so the person is
  never shown a line crossing itself off that will not stay crossed off.
- **Nicknames come from the phone's registry**: a shared list goes by `nickname` when it has one,
  else by the document's name, which is `app.js`'s own rule.
- **1.12's Remove on the phone removes the list from the Watch.** There is nothing special about
  this — it falls out of §2's rule that the Watch's vault is whatever the phone last named.

### 4. Complications

A widget extension embedded in the watch app. Every family below is grounded in the watchOS SDK:
there are exactly four accessory families, and every `system*` family is explicitly unavailable.

| family | what it shows |
| --- | --- |
| `.accessoryCircular` | the count, with the accent ring — `Gauge` + `.gaugeStyle(.accessoryCircularCapacity)`, over `AccessoryWidgetBackground`, the number `.widgetAccentable()` |
| `.accessoryRectangular` | the next undone line, **opt-in** |
| `.accessoryCorner` | the count again, with `.widgetLabel` along the bezel |
| `.accessoryInline` | `3/5` and nothing else |

- **The rectangular one is opt-in when it is added**, because it puts a person's words on their watch
  face where anyone glancing can read them. That is an `AppIntentConfiguration` (watchOS 10) whose
  `WidgetConfigurationIntent` carries a Bool the person sets when adding the complication; off, it
  shows the count and the list's name instead of the line. The SDK proves the mechanism; only a face
  editor can prove the form renders, so that is a verification item and not an assumption.
- **An Add complication** opens the app straight into dictation (§3), through `.widgetURL`.
  `WKApplicationDelegate` has **no** URL callback — the whole optional list was read, and the only
  `openURL` in WatchKit sends a URL *out* — so the app receives it with SwiftUI's `onOpenURL`.
- The extension reads the list from the **App Group container**, never the Keychain: what it needs is
  the count and one line, which live in the decrypted document the store already writes to disk. The
  secrets stay in the watch app's Keychain, which the extension has no access to and no reason to.
- The app reloads timelines with `WidgetCenter.shared.reloadAllTimelines()` after any change.

### 5. What the Watch does not get

No settings screen. **Theme follows the phone's day/night slot accent when the phone has told us,
else the app's Dark accent — which is `#A86014`,** the brand accent that Dark, Paper and Terminal all
carry, so the fallback and the common case agree. Haptics only: no sound, no confetti.

---

## §2. Where the links come from, and where the data lives

**The phone hands over links. It never hands over data.** The Watch is a client of the server in its
own right — that is the whole reason the core exists as a library rather than as the phone's private
business.

### From the phone

`updateApplicationContext` on first pairing and whenever the vault changes, carrying the vault's
links: the secret, the mode, the origin, the nickname. The Watch writes them into **its own
Keychain**, `kSecAttrAccessibleAfterFirstUnlock`, **not synchronizable** — the phone's rule, for the
phone's reason: iCloud Keychain would put list secrets on Apple's servers and change what
`about.html` promises.

The payload is a codec in the core (Track A), not a dictionary assembled at two call sites:

```
{ v: 1, at: <ms>, links: [ { id, mode, origin, nickname, name }, … ] }
```

- `v` and `at` are the whole of the idempotence story. The probe showed the delivery callback firing
  **twice per send**, and an application context is a last-value-wins slot that is also replayed to a
  watch app on launch — so **a payload is applied only when its `at` is newer than the last applied
  `at`**. Repeat delivery is then free, and out-of-order delivery is safe.
- An **empty `links` array is a real state** and means the phone holds no lists. This is the same
  shape of trap as the vault's `lists: []` (§8, and Phase 2's fourth bug), and it is answered the
  same way rather than by guessing: the phone always sends a stamped payload, so "no links" is
  something the phone *said*, never something the Watch inferred from silence. The Watch changes
  nothing until a payload arrives.
- Unknown keys are kept and unknown `v` is refused, which is `COMPATIBILITY.md` §3's rule applied to
  a channel rather than to a document.
- Property-list types only. Anything else is refused synchronously with
  `WCErrorCodePayloadUnsupportedTypes`, measured.

### To the server

The Watch talks to the server itself, through the core's `SupabaseTransport` over whatever network
watchOS provides.

- Pull on foreground and on every wrist raise that shows the app; push on every change.
- The core's store queues offline edits and merges on reconnect — this is `SyncEngine` unchanged, and
  it is why the engine was built with no timer of its own.
- **No realtime.** A poll while the app is on screen, with `p_rev`, so an unchanged poll costs bytes
  rather than a document. (`p_rev` — not `p_known_rev`; the deployed function's parameter name is
  part of the contract, per `DECISIONS-apple.md`.)
- **A quiet sync mark**: synced, syncing, offline, busy. Four states, one glyph, no sentence.

### Rollover

Rollover runs on the Watch too — the core's pure function, in the list's home zone.

The web runs it in **two** places and the Watch needs both: on opening a list (edit links only — a
view link never rolls), and inside a once-a-minute tick. A Watch that only rolled on open would show
yesterday's finished lines to anyone who left the app on their wrist across midnight.

The test that matters is not that rollover runs but that **a Watch and a phone rolling the same list
produce identical documents**, which is what `+1 / +2` stamping is for. That is a core test.

---

## §3. Say it, and it's on the list

The ask: press or hold something, speak, and the line lands — without opening Shortcuts.

### What watchOS does not allow, recorded rather than attempted

**There is no custom live speech recognition on watchOS.** `Speech.framework` is not in the watchOS
SDK — checked on disk, not recalled — so a hold-to-talk with our own transcription cannot be built
natively. Not attempted.

A phone-relay version — record on the wrist, transcribe on the phone — is possible and is **not**
built this round: it is slow, it needs the phone awake and in range, and it turns the Watch back into
a terminal for the phone, which is the thing §2 spends its whole design avoiding. Recorded in
`DECISIONS-apple.md` as a later option.

**And no SwiftUI API on watchOS can force dictation.** `TextFieldLink` has exactly four initializers
and none takes an input-mode. `WKTextInputMode` has exactly three cases — `.plain`, `.allowEmoji`,
`.allowAnimatedEmoji` — and none of them means "dictation only"; the mode widens what characters may
come back, it never picks the input method. The one lever that exists is WatchKit's
`presentTextInputController(withSuggestions:allowedInputMode:completion:)`, where a **nil**
suggestions array skips the chooser screen. In both the watchOS 11.1 and the watchOS 26.5 simulator
that landed on the QWERTY keyboard — but **a simulator has no microphone**, so that is not the
answer to the question that was asked. So:

- the `+` presents the WatchKit controller with `withSuggestions: nil, allowedInputMode: .plain`,
  reached from the SwiftUI app through `WKApplication.shared().visibleInterfaceController` (public
  API, non-nil from a pure SwiftUI `WindowGroup` — measured);
- if that controller is ever nil, it falls back to `TextFieldLink`, which is the sanctioned path;
- and **what a real wrist shows is a verification item**, written down as unresolved rather than
  claimed. If the mic is not the first thing on screen there, the honest answer is the chooser
  defaulted to dictation, and that is what the results section will say.

### The four ways in, and the one path out

All four end in the **same core call**: `Model.addToToday(_:text:at:)`, new in the core this round,
with tests, which adds a line to Today and leaves the engine to push it. Today `tfive add` has its
own copy of that logic and the web has another; after this round there is one in Swift and `tfive`
uses it, which is the brief's rule that the core is the only data path.

The core call also fixes three ways `tfive add` quietly differs from the web, all caught by reading
the two side by side: it does not strip bidi overrides from entered text, it computes `order` and
`todayOrder` over *all* items rather than the undone ones, and it hard-codes the section. The web's
own bulk add path is the reference, because it writes the whole record in one pass.

1. **Siri, hands-free.** An `AppIntent` — *Add to Today's Five* — with a text parameter, registered
   as an App Shortcut with natural phrases (*"Add ⟨text⟩ to Today's Five"*, *"Put ⟨text⟩ on my
   five"*). App Intents live in the **app target** on watchOS; no extension is required and on
   watchOS 11 none is even possible. The same Swift file compiles unchanged into the iOS and the
   watchOS target — the two module interfaces differ by one declaration this file does not use.
   Every phrase carries `\(.applicationName)`, which is the toolchain's rule.
   It handles **"no list yet"** and **view-only** by saying so, with a dialog, rather than by
   failing silently.
2. **The + in the app**, which opens dictation as above. Empty input adds nothing.
3. **Double Tap** (Series 9 / Ultra 2, watchOS 11+): the `+` is the primary action —
   `.handGestureShortcut(.primaryAction)` — so a double tap starts dictation while the app is open.
   `.scrollInputBehavior(.enabled, for: .handGestureShortcut)` decides whether Double Tap scrolls
   instead of activating, and this app wants the activation.
4. **The Action button** (Ultra): the intent from (1) is assignable to it in
   Settings → Action Button → Shortcut. **There is no developer-facing Action button API anywhere in
   the watchOS 26.5 SDK** — checked — so there is nothing to write and nothing to verify here beyond
   the App Shortcut existing. The two-line instruction goes in `apple/README.md`; we cannot set it
   for you.

The **Add complication** from §1 opens the app straight into (2), so from the watch face it is tap,
speak, done.

**Every path gives the same haptic on success and the same one-line confirmation showing the text it
heard, with Undo for five seconds.** The Undo is the web's own: it un-does the add rather than
deleting the line, so a merge from another device cannot lose someone else's edit to it.

---

## §4. The iPhone app's part

Three changes, and nothing visible.

1. **Send the vault to the Watch.** A `WCSession` delegate that activates at launch, sends the
   vault's links on activation and whenever the vault changes, and does nothing else. The phone's
   shell stays the live site; there is no new screen and no new setting.
   A debug launch argument, `-TFDumpWatchSend`, prints what was sent — **shape and counts only, never
   a secret** — which is `-TFDumpVault`'s rule and the reason that argument prints an id's *length*.
2. **The App Intent is shared code.** On the phone it opens the app on the list after adding, and
   the web view picks the line up through sync — no bridge, no web change.
3. **The version.** `MARKETING_VERSION` → `1.12` and `CURRENT_PROJECT_VERSION` → `158`, so About,
   the bundle and App Store Connect agree, and the 1.12 finale haptic rides along.

The web app does not change. Not a byte.

---

## The core's additions

Everything below is `TodaysFiveCore`, covered by `swift test`, and is the reason the Watch has no
rules of its own.

| what | why it is in the core |
| --- | --- |
| `WatchLinkPayload` — encode / decode, `v`, `at`, unknown-key pass-through | a codec that two processes read is a contract, and a contract is testable |
| `WatchLinkStore` rules — payload + current vault → a plan (upsert / remove / select) | the same shape as `VaultReconciler`, for the same reason: the part that can be wrong in a way a test catches |
| `Model.addToToday(_:text:at:)` | four ways in, one path out — and it is the only add in Swift after this round |
| `Model.setDone(_:id:done:at:)` | the check-off's three fields, in one place, so the Watch cannot invent a fourth |
| the rollover agreement test | a Watch and a phone rolling the same list produce identical documents |

Tests use `MemoryTransport`. One live run at the end creates at most two lists and deletes them.

---

## Privacy — the same rules, on a smaller screen

- **No secret ever reaches a log, a screenshot filename, a crash report, or iCloud.** The Watch's
  Keychain items are `AfterFirstUnlock` and **not synchronizable**, exactly like the phone's.
- The App Group container holds the **decrypted document**, which is what the complication needs, and
  never a link. The Keychain items are not in the group.
- No analytics, no crash reporting, no `NSUserActivity` the app creates.
- Every `print` is `#if DEBUG` and every call site passes a fixed string with counts or a length.
- Screenshots go in `apple/shots/watch/` and are named for the screen, never for the list.

---

## The tracks

Four, in worktrees, each with a written contract and a budget. **Sub-agents never merge**; I do,
after `swift test`, both Xcode builds and the paired-simulator pass are green on the integrated
branch. Branch `apple-watch`, pushed after each logical commit.

The `.xcodeproj` is **mine**, not any track's: it is hand-written, it has no XcodeGen to regenerate
it, and four agents editing one `project.pbxproj` in four worktrees is a merge conflict with a build
system attached. The targets, the file references and the build phases are in place before any track
starts; a track adds source files to paths that are already registered.

| track | what |
| --- | --- |
| **A — core and connectivity** | the payload codec, the Watch-side store rules, `addToToday`, `setDone`, the rollover agreement, and `tfive` re-pointed at the new ops. Tests for all of it |
| **B — the Watch UI** | Today, one thing, the list picker, the complications |
| **C — voice and intents** | §3: the shared `AppIntent`, the App Shortcut, the dictation presenter, Double Tap, the confirmation and Undo |
| **D — the harness** | paired-simulator install and drive, the checks in Verification, the screenshots |

---

## Verification — do it, don't just say you did

**`swift test`** for everything added to the core: the connectivity payload codec (including a
replayed payload and an out-of-order one), the Watch store rules, the rollover agreement, and the
intent's add path.

**Paired simulators** — an iPhone and a Watch on the current runtimes, and once on 18.x / 11.x:

- both apps installed (the watch app explicitly — see the checkpoint report);
- the phone's vault reaches the Watch;
- Today shows;
- a tap crosses a line off, with the haptic call counted and the row settling;
- the finale;
- one thing, and shuffle;
- **each of the four ways in from §3** — dictation simulated as text input; the intent invoked
  through the Shortcuts app on the simulator; Double Tap by its accessibility action;
- a view-only list cannot be changed;
- a list removed on the phone leaves the Watch;
- the complications update, and the Add complication opens into dictation;
- offline edits on the Watch converge after reconnect against a change made with `tfive`;
- an unchanged poll's byte count.

Two things about that list are known to be harder than they read, and are written down now rather
than discovered later: **`simctl` cannot tap a watch simulator** — it lists and screenshots and
nothing else — so driving the Watch needs the Simulator app itself; and **Keychain entitlements are
enforced on the watch simulator**, so the vault can only be exercised from a properly signed target,
which is what the project builds.

**Screenshots** of every Watch screen and every complication family in `apple/shots/watch/`.

**One live run** against the real backend with `tfive` on the other side, lists deleted after.

**Builds**: the Watch app for `generic/platform=watchOS`, and an archive of the iOS app with the
Watch app embedded, ready for Organizer.

### What only a wrist can answer

Written here in advance so the results cannot quietly absorb them:

- whether the `+` opens **dictation** or a keyboard;
- whether **Double Tap** fires (no way to inject the gesture);
- whether the **Action button** takes the intent;
- whether **Siri** hears the phrases, and whether the intent's dialog is spoken or only shown;
- whether the finale run **feels** like the volley looks.

---

## Results

*(written when the round is run)*
