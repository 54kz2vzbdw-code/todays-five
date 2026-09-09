# Today's Five for Apple

`TodaysFiveCore` is the Swift core of Today's Five: links, keys, the encrypted envelope, the document,
merge and rollover, the three RPCs, a local store and a sync loop. It is the second implementation of
the contract in [`COMPATIBILITY.md`](../COMPATIBILITY.md) — the web app is the first — and everything
here is built to prove the two agree rather than to look like they do.

No UI, no app target, no signing: that is Phase 2. Zero third-party dependencies (Foundation,
CryptoKit, Compression and the toolchain's own Testing). iOS 17, watchOS 10, macOS 14, Swift 6
language mode.

```
apple/
  PLAN-apple.md         Phase 1: the core — the design, and the results
  PLAN-apple-phase2.md  Phase 2: the iPhone shell — the design, and the results
  DECISIONS-apple.md    the calls made, and why
  TodaysFiveCore/       the Swift package
  TodaysFive/           the iOS app
  tools/interop.mjs     the live interop run, against the deployed site and the real backend
```

## Running the tests

```bash
cd apple/TodaysFiveCore
swift test
```

126 tests in ten suites, about nine seconds. They read fixtures from the repo, not from a resource
bundle, because the fixtures are the shared contract:

| what | where | written by |
| --- | --- | --- |
| the pinned key vectors, envelopes, links, dates, the zone | `test/fixtures/vectors.json` | `test/tools/gen-vectors.mjs` |
| golden merge / normalize / rollover cases | `test/fixtures/merge/*.json` | `tools/merge-fixtures.js` |
| ~1,200 random document pairs and ~900 operation sequences | `test/fixtures/merge-cases.json.deflate` | `test/tools/gen-merge-cases.mjs` |
| the 18 kits and the 13 font pairs (1.13) | `test/fixtures/kits.json` | `test/tools/gen-kits.mjs` |
| the Watch's real family and PostScript names (1.13) | `test/fixtures/watch-fonts.json` + `apple/TodaysFive/Fonts/*.ttf` | `apple/tools/gen-watch-fonts.py` |

`test/fixtures/merge/`, `test/fixtures/vectors.json` and `test/fixtures/kits.json` are read by the
**Node** suites too (`test/compat.test.js`, `test/crypto.test.js`, `test/theme.test.js`), so neither
implementation can drift from the other without a suite going red on both sides.

The last two are the palette's road into Swift, and they are a fixture rather than a build step for
one reason: **a build-time generator cannot parse `theme.js`.** 62 of the 314 hex tokens in the
finished table appear nowhere in its source — every kit has at least one — because they come out of
`finalize()` → `ensure()` → `oklch()`, and `node` is unreachable from an Xcode build. So the
`KitsGen` plugin reads the fixtures and never `theme.js`, and `KitFixtureTests` closes the hole a
fixture leaves: it evaluates **live `theme.js`** in a `JSContext` (JavaScriptCore is in the macOS and
iOS SDKs and absent from watchOS, so that check can never ship to a wrist) and asserts it still
produces the fixture. `test/theme.test.js` asserts the same thing from the JavaScript side, so the
web author sees the drift where they work.

Regenerating them (only needed when the web's own behaviour changes, which
`COMPATIBILITY.md` says must be additive):

```bash
TZ=America/Chicago node test/tools/gen-vectors.mjs
TZ=America/Chicago node test/tools/gen-merge-cases.mjs
node tools/merge-fixtures.js
node test/tools/gen-kits.mjs                 # after any colour, font pair or kit moves in theme.js
python3 apple/tools/gen-watch-fonts.py       # after fonts/ or a pair's weights move; needs fontTools + brotli
```

`gen-vectors.mjs` refuses to write if `crypto.js` no longer reproduces the pinned derivation values.
`gen-kits.mjs` refuses on the same principle: 18 kits, exactly 2 secret, and 234 contrast assertions
against each kit's **own** grounds. The zone is pinned because rollover is a function of the local
calendar.

When a differential case fails, the Swift test names it; to see the web's answer in full:

```bash
TZ=America/Chicago node test/tools/gen-merge-cases.mjs --explain sequence 417
```

The other direction of the envelope round trip — envelopes Swift sealed, opened by `crypto.js` — is a
Node script that reads what `swift test` leaves behind:

```bash
node test/tools/check-swift-envelopes.mjs
```

## Building for the other platforms

```bash
xcodebuild -scheme TodaysFiveCore -destination 'generic/platform=iOS Simulator' build
xcodebuild -scheme TodaysFiveCore -destination 'generic/platform=watchOS Simulator' build
xcodebuild -scheme TodaysFiveCore -destination 'platform=macOS' build
```

The tests are host-side: running them on a simulator would prove the simulator.

## `tfive`

The command line over the core. It is a tool for checking things by hand, and it is the interop
proof: every command goes through the same links, keys, envelope, store and sync engine an app will.

```bash
swift build
.build/debug/tfive show   <link>              the list, the way Today shows it
.build/debug/tfive check  <link> <n>          cross off the nth line on Today (again to uncheck)
.build/debug/tfive add    <link> "text"       a line on Today
.build/debug/tfive watch  <link> [seconds]    poll, and print the list when it changes
.build/debug/tfive new    [name]              make a list (prints both links)
.build/debug/tfive links  <link>              the Private and the View link for a secret
.build/debug/tfive rollover <link>            run today's rollover
.build/debug/tfive delete <link>              delete the row on the server
.build/debug/tfive raw    <link>              what the server holds, and what an unchanged poll costs
.build/debug/tfive lists                      the lists this device holds
```

A `<link>` is a full URL, a `#/l/…` or `#/r/…` fragment, or a bare secret — and a **bare** secret is
an edit link, here as in the web's paste box, so a View link must be given as `#/r/<R>`.

Lists live in `~/Library/Application Support/TodaysFive/lists`, one JSON file each. `TFIVE_HOME`
points somewhere else, which is what the tests and the interop run use.

The Supabase project URL and publishable key are read out of the repo's `config.js` **at build time**
by the `ConfigGen` plugin, so neither is ever typed into Swift and neither can drift.

## The live interop run

```bash
swift build                                    # in apple/TodaysFiveCore
node apple/tools/interop.mjs
```

Playwright drives the deployed site while `tfive` works the same lists from the command line: a list
made on the web read and changed from the Mac and back, both sides editing while apart and
converging, a list made by `tfive` opened on the web, a View link that reads and cannot write, the
unchanged poll's byte count, and New keys on the web leaving the Swift side reporting *gone*.

**It creates three lists on the real backend and deletes all three at the end.** The server allows
twelve an hour per address, and a day of suites can spend that, so do not run it in a loop. Every id
is appended to `apple/tools/.interop-created.txt` the instant the row exists, so a crashed run leaves
a list that can be named and cleaned up rather than an orphan nobody can.

## Where things are

| | |
| --- | --- |
| `JS/` | JavaScript's string, number and object semantics — the layer the model stands on |
| `Base62.swift`, `Links.swift`, `Keys.swift` | the link grammar and the frozen derivation |
| `Deflate.swift`, `Envelope.swift` | raw DEFLATE and the v3 envelope |
| `Document.swift`, `Merge.swift`, `Rollover.swift`, `Ops.swift`, `Queries.swift`, `Dates.swift` | the document |
| `Transport.swift`, `SupabaseTransport.swift`, `MemoryTransport.swift` | the three RPCs, and a server for tests |
| `Store.swift`, `SyncEngine.swift` | one file per list, and pull / merge / push |
| `Kits.swift` | the kit table's accessors — **no palette data**: that is `Kits.generated.swift`, written at build time by `Plugins/KitsGen` from the two fixtures |
| `Vault.swift`, `WatchLink.swift` | what the phone holds, and what crosses to the wrist (links, and since 1.13 the two Secret kits) |

Read `PLAN-apple.md` before changing any of it, and `DECISIONS-apple.md` for why the JS layer exists.

---

# The iPhone app

`apple/TodaysFive` is a `WKWebView` on **the live site** — never a copy — plus the three things a
browser cannot do for itself: **haptics**, a **Keychain link vault**, and **links that open in the
app**. No settings screen, no menu, no chrome: the rail, Today, ⋯ and Settings gain nothing.

## Building and running it

`brew` is not installed on this machine, so there is no XcodeGen and no `project.yml` — the
`.xcodeproj` is the source of truth and is committed. Open it, or:

```bash
cd apple/TodaysFive
xcodebuild -scheme TodaysFive -destination 'generic/platform=iOS Simulator' build
```

To put it on a simulator and watch what it says:

```bash
SIM=$(xcrun simctl list devices available | grep -m1 'iPhone 17 Pro (' | grep -o '[0-9A-F-]\{36\}')
xcodebuild -scheme TodaysFive -destination "id=$SIM" -derivedDataPath /tmp/tf-app build
xcrun simctl install "$SIM" /tmp/tf-app/Build/Products/Debug-iphonesimulator/TodaysFive.app
xcrun simctl launch --console-pty "$SIM" com.pricebrannen.todaysfive
```

## Putting it on a phone

`DEVELOPMENT_TEAM` is `T7GTZC5US9` and signing is automatic, so the whole of this runs from the
shell — no Organizer, no Accounts pane. What it needs is an App Store Connect API key; the one in use
is App Manager, and where that is not enough is said plainly below.

```bash
KEY=(-allowProvisioningUpdates
     -authenticationKeyPath "$HOME/.private_keys/AuthKey_X5KNTWX8HB.p8"
     -authenticationKeyID X5KNTWX8HB
     -authenticationKeyIssuerID c94024f5-fd77-46d3-a9f2-1f8404bcd542)

cd apple/TodaysFive
xcodebuild -scheme TodaysFive -destination 'generic/platform=iOS' -derivedDataPath /tmp/tf-dev "${KEY[@]}" build
xcrun devicectl device install app --device <udid> /tmp/tf-dev/Build/Products/Debug-iphoneos/TodaysFive.app
xcrun devicectl device process launch --console --device <udid> com.pricebrannen.todaysfive -- -TFSelfTest
```

The `.p8` lives outside the repository and is read from there. `.gitignore` carries `*.p8` and
`AuthKey_*.p8` so a stray copy cannot be committed; nothing in the tree should ever hold one.

Three things will stop you, in the order you will meet them:

- **Developer Mode.** iOS will not run a development build without it, and until it is on
  `xcodebuild -showdestinations` lists only *Any iOS Device* — the phone is simply not there. It is
  Settings → Privacy & Security → Developer Mode on the phone, and it wants a restart. The toggle
  only appears once a Mac has tried to install a development build, so try the install first.
- **A team with no devices.** Automatic signing answers *"Your team has no devices from which to
  generate a provisioning profile"*, and a generic destination cannot fix it because it names no
  device to register. Register the phone once — `POST /v1/devices` with its UDID
  (`xcrun devicectl device info details --device <udid>`) — and every build after that is ordinary.
- **Cloud-managed distribution certificates.** `-exportArchive` for the App Store needs one, and an
  **App Manager** key is refused: `403 FORBIDDEN_ERROR`, *"You haven't been given access to
  cloud-managed distribution certificates."* An **Admin** key is what lifts it. Everything up to and
  including `xcodebuild archive` works on the App Manager key; only the export does not.

Note the launch arguments go after a `--`, or `devicectl` reads `-TFSelfTest` as its own flag.

Debug launch arguments are listed below; `-TFSelfTest` is the one to reach for first, because it is
the whole bridge end to end on the real page under its real CSP.

**On your iPhone** you need an Apple ID in Xcode → Settings → Accounts (a free one is enough for a
device install; §5's universal links need the paid program). Set `DEVELOPMENT_TEAM` in the target's
build settings, plug the phone in, trust it, and Run.

### Debug launch arguments

Each is `#if DEBUG` only and takes no argument.

| | |
| --- | --- |
| `-TFSelfTest` | dispatches the four events in the page world and reports whether the bridge heard them, plus the service worker, the shell token and what the page thinks `standalone` is |
| `-TFWipeWebStore` | clears `WKWebsiteDataStore` before the first load — the wiped-store half of the vault check |
| `-TFWipeVault` | empties the Keychain items, for a clean run |
| `-TFDumpVault` | prints the vault's *shape* at launch — mode, origin, whether the registry has named it, and the id's **length** and nothing else — and what each reconcile read (`registry=… mark=…`). It is how a check can say a View link was kept as a View link without a secret ever reaching a log. |
| `-TFQuery <query>` | appends a query to the start URL. `-TFQuery transport=local` puts the page on its own localStorage-backed test server, so a simulator pass spends nothing from the real backend's create limit (twelve an hour per address, shared with every other suite). Same host, so app-bound domains is untouched. |

```bash
xcrun simctl launch --console-pty "$SIM" com.pricebrannen.todaysfive -TFSelfTest
```

## The icon

`icons/mark.svg` is the drawing — the mark itself, traced from the geometry this file's own
`make-icon.mjs` had fitted off `icons/apple-touch-icon.png`. That script is gone, and so is
`tools/og.mjs`: since 1.11 the site's icons, the card and the app's three appearances all come out
of **one** script, so the app's icon cannot drift from the site's because there is only one of them.

```bash
node tools/serve.js 8791 . &          # the card wants the stylesheet's @font-face rules
node tools/mark.mjs                   # every raster, in the chosen colourway
node tools/mark.mjs --trace           # prove the drawing is still the icon that shipped
```

`--trace` renders `icons/mark.svg` in the **old** colours (`#1A1D21` ground, `#D26128` check) at 180
and compares it with `icons/apple-touch-icon.png`, failing over 2 % — the same guard the old script
had, kept because it is the only thing that says the trace has not drifted from the artwork. It
currently reports **0.30 %**.

Since 1.13 that comparison is **geometry**, which is what it always claimed to be: both images are
reduced to an ink mask — nearer the mark's colour or the tile's, per pixel — so the two colourways
divide out. Before, it diffed raw colour; and since 1.11 recoloured `apple-touch-icon.png` with this
same script, it had been comparing a charcoal tile with an orange check against a cream tile with an
amber check and reporting **93.84 %** for two files whose drawing is identical. The 1.60 % this
paragraph used to quote was the last number the tool produced before 1.11 broke it. The 0.30 % that
remains is antialiasing at the check's edges.

The app icon is written at 1024 in iOS 18's three appearances — light, dark (the mark on Terminal's
ground) and tinted (the mark alone, on transparency, for the system to tint) — with the
`AppIcon.appiconset/Contents.json` that declares them. The light and dark ones are opaque, because
iOS refuses transparency there; the script counts the transparent pixels and fails if there are any.

## What crosses the bridge

Four `CustomEvent`s the page dispatches on `window`, and nothing else:

| event | what the app does |
| --- | --- |
| `tf:check` | `UIImpactFeedbackGenerator(.medium)` |
| `tf:uncheck` | `UIImpactFeedbackGenerator(.light)` |
| `tf:finale` | `UINotificationFeedbackGenerator(.success)` |
| `tf:shuffle` | `UIImpactFeedbackGenerator(.light)` |

They carry no `detail`. The names are contract — `COMPATIBILITY.md` §8, and `tools/e2e4.js` asserts
all four at both viewports.

The app announces itself with a user-agent token rather than an injected flag, so the site's CSP
never comes into it. In `app.js`, `SHELL` reads it and exactly two things turn on it: `HAPTIC` stands
down, and `STANDALONE` is true.

Everything else the app needs from the page it **reads** rather than being told: `tf/v2/meta` through
`evaluateJavaScript`. No second message channel, no web change, no new contract.

## The vault

One Keychain item per link, `kSecAttrAccessibleAfterFirstUnlock`, **not synchronizable** — iCloud
Keychain would put list secrets on Apple's servers and change what `about.html` promises.

Two states look identical in the registry and mean opposite things: **the person removed their last
list** (drop it, or the next launch resurrects it) and **the web store was cleared** (give it back —
this is what the vault is for). Both leave `lists: []`, and a missing `tf/v2/meta` does not separate
them either, because the page writes a registry the moment it boots. So the app leaves a mark of its
own in the same storage, `tf/app/seen`, whose only job is to be destroyed along with everything else.

The rules are pure and live in the core (`VaultReconciler`), where `swift test` covers them:

- the read **failed** → nothing is decided at all, and it retries after a beat. `localStorage` throws
  a `SecurityError` on a document with no origin yet, and reading that as "the store is gone" made
  the app navigate away from the page the person was on.
- the **mark is there** → the page is speaking for itself, `lists: []` included. Every entry is
  written and every vaulted link it does not name is dropped.
- the **mark is gone** → the store is new to this app: a first launch, or a wipe. Nothing is removed,
  every link has to be named again, and the most recently seen one is offered back if the registry
  names none of them.
- the registry **is not an object** → the page will rewrite it. Nothing is removed, nothing is marked.

"Names a list" excludes an `archived` entry. Since the web's 1.12, *Remove from this device* takes the
entry out of `lists` altogether rather than flagging it, and the reconciler already reads a list the
registry does not name as *not held* — so nothing here had to change. The `archived` check stays
anyway: the registry is device-local and a device can open an older page out of its cache, so the
flag has to go on meaning what it meant. The vault reads both shapes and writes neither.

## Privacy

No URL, fragment or secret is ever printed — the one `print` in the app is `#if DEBUG` and every call
site passes a fixed string with counts. No analytics, no crash reporting, no `NSUserActivity`, and no
network request of the app's own beyond the web view's.

---

# The Watch app

`apple/TodaysFive/TodaysFiveWatch` is Today on your wrist: the lines, the checkbox, the count, one
thing at a time, and four ways to put a line on the list by speaking.
`apple/TodaysFive/TodaysFiveComplications` is the four accessory families on the face.

**The phone hands over links and never data.** The Watch is a client of the server in its own right —
it derives the keys, opens the envelope and merges with the same `TodaysFiveCore` the phone and the
CLI use. That is the whole reason the core is a library. Read `PLAN-apple-phase3.md` before changing
any of it.

## Running it on paired simulators

`apple/tools/watchsim.mjs` is the harness. Node is not on `PATH`; it lives at
`~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`.

```bash
node apple/tools/watchsim.mjs doctor     # what is booted, paired, installed and connected
node apple/tools/watchsim.mjs all        # pair → build → install → launch
node apple/tools/watchsim.mjs shot --name today
```

**`simctl install` of the phone app does not install the watch app.** The watch app must be installed
onto the watch simulator explicitly, and until it is, `isWatchAppInstalled` is false and every
`updateApplicationContext` throws `WCErrorCodeWatchAppNotInstalled` (7006) — which looks exactly like
WatchConnectivity being broken in the simulator and is not. `watchsim.mjs install` does both halves,
and `doctor` names that state when it finds it.

Two more things the harness knows so you do not have to: **`simctl` cannot tap a watch simulator**
(it lists and screenshots and nothing else), and **Keychain entitlements are enforced on the watch
simulator**, so the vault only works from a properly signed target.

### The debug launch arguments

Each is `#if DEBUG` only. They exist because the Watch cannot be driven by hand here.

| | |
| --- | --- |
| `-TFWatchDemo` | seeds a local demo list over `MemoryTransport` — no phone, no network, and nothing spent from the server's create limit |
| `-TFWatchSelfTest` | crosses a line off and back, finishes the list and reports whether the finale fired and after how long, runs Start again, **shuffles ten times and reports how many distinct lines came up and whether one ever came up twice in a row**, shuffles with one line left and reports that nothing moved, then prints the haptic tally, the finale run's duration, whether the store landed in the App Group, and the snapshot's counts |
| `-TFAddSelfTest` | the add path with a canned string, with an empty one, against a view-only list, with no list selected, and Undo — and whether `visibleInterfaceController` is present, which is what decides the dictation path a wrist will take |
| `-TFFontSelfTest` | every one of the 13 font pairs: is each family on the device, does `CTFontCreateWithName` hand back the face it was asked for rather than Helvetica, and do the pair's two ui weights actually render differently. **A wrong font name renders Helvetica with no log and no error**, so this is the only thing that turns a silent fallback into a failure. Prints a tally |
| `-TFKit <id>` | render one kit for this launch, whichever slot is stored. `simctl` cannot tap a watch simulator, so this is the only way a screenshot of a given kit exists |

```bash
xcrun simctl launch --console-pty "$WATCH" com.pricebrannen.todaysfive.watchkitapp -TFWatchDemo -TFWatchSelfTest
```

Everything they print is a count or a fixed string. A screenshot says what is on screen; the tally
says what happened.

## Putting it on a real Watch

Build and run the **TodaysFive** scheme from Xcode with the phone connected and the Watch paired to
it; the watch app is embedded in the phone app and installs with it. From the shell, the phone build
carries it too:

```bash
cd apple/TodaysFive
xcodebuild -scheme TodaysFive -destination 'generic/platform=iOS' -allowProvisioningUpdates build
```

**Which credential you pass matters, and this is the one thing that will stop you.** The App Store
Connect key registers an App ID and **cannot add a capability**: adding App Groups to the Watch app
answers `Authentication failed … bearer token`, which reads like a broken key and is not — it is the
same wall Phase 2b hit on cloud-managed distribution certificates. The Apple ID signed into Xcode can
do it. So: **the key for ordinary builds, and no `-authenticationKey*` flags at all for any build that
changes a capability.**

## Siri, and the Action button

Both are two lines you have to do yourself, and neither can be set for you.

**Siri.** Say any of these, on the Watch or the phone:

> "Add to Today's Five"  ·  "Put something on my five"  ·  "Add a line to Today's Five"

Siri then asks what the line is. **The phrase cannot carry the text** — an App Shortcut phrase may
only interpolate an `AppEntity` or an `AppEnum`, and a free-text parameter inside one is a halting
build error, not a warning. Two beats instead of one, and it is the closest thing watchOS allows.

**The Action button** (Ultra only): Settings → Action Button → Shortcut → *Add to Today's Five*. There
is no developer-facing Action button API anywhere in the watchOS SDK, so an App Shortcut existing is
the whole of what an app can do; the assignment is yours.

**Double Tap** (Series 9 / Ultra 2 and later, watchOS 11+) starts the add flow while the app is open,
because the `+` is the primary action.

## The kit on the wrist

Every colour and every face on the Watch comes from a **kit** — the same 16 `TodaysFiveCore` carries,
plus the two Secret kits when a phone that has unlocked them has said so. The accent, the ground, the
task face and the ui faces all move together; there is no `.primary`, no `.secondary` and no system
colour left on any Watch screen, because watchOS has no light appearance and those were only ever
right by accident.

The choice is the **Watch's own**, stored in the App Group so the complication can read it too —
`tf/app/watch/kit/day`, `…/night`, `…/slot`. **The Watch does not follow the phone's theme, and that
is a decision**: theme is a per-device preference in this app and a Watch is a device.
`DECISIONS-phase4-C1.md` has the argument and what it cost, including the two things it cost that
nobody can fix — the system clock stays white on a light kit's ground, and a light ground drives the
panel about 17× harder than a dark one.

## What the Watch does not have

No Everything, no sections, no History, no rules, no templates, no settings screen. Those need a
phone-sized screen. The Watch shows Today, crosses lines off, and takes a new one.

## Privacy, on a smaller screen

The Watch's Keychain items are `kSecAttrAccessibleAfterFirstUnlock` and **not synchronizable**,
exactly like the phone's. The App Group holds a `WatchSnapshot` — a name, two counts, one line and a
stamp — and **never a link**; the complication cannot reach the Keychain and has no reason to. No
analytics, no crash reporting, no `NSUserActivity`. Every `print` is `#if DEBUG` and passes counts or
a length, never an id, a URL, a fragment or a line of anyone's list.
