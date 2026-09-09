# Decisions — the Apple core

Calls made while building `apple/TodaysFiveCore`, and why. The web's own record is `DECISIONS.md`;
this file is the Swift side's, and points back at the contract in `COMPATIBILITY.md`.

## Toolchain on this Mac (checked before anything was written)

```
xcode-select -p        /Applications/Xcode.app/Contents/Developer
xcodebuild -version    Xcode 26.6 (17F113)
swift --version        Apple Swift 6.3.3 (swiftlang-6.3.3.1.3), arm64-apple-macosx26.0
xcodebuild -license    accepted (exit 0)
simctl runtimes        iOS 18.1, iOS 26.5, watchOS 11.1, watchOS 26.5, visionOS 2.1, visionOS 26.5
```

Nothing needed `sudo`. Node is not on the login `PATH`; it lives at
`~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` (v24.19.0), which is what
the Node suites and the fixture generators run under.

## Built against 1.9, after starting against 1.5

The checkout this round began in was forty-three commits behind `main`. The repo said 1.5 (build 76);
the deployed site runs 1.9 (build 119). The first Playwright run found it — its selectors did not
match the live page — and the port was rebased onto 1.9 and re-done.

Worth recording because of what it showed: `crypto.js`, `config.js` and `supabase/` had not changed a
byte across four releases. §2 and §4 are not aspirations. `model.js` had grown, all of it additively,
exactly as §3 requires.

**How to apply:** fetch before starting a round, and check the deployed `version.js` against the
checkout. A port is a port of what is *running*.

## The rollover fixtures now name their device zone

`test/fixtures/merge/rollover-guard.json` pins the behaviour of a list with **no** home zone, which
by design rolls on the device's own clock. So its expectations depend on the machine that wrote them,
and `node test/compat.test.js` failed under `TZ=Pacific/Kiritimati` — a fixture whose whole purpose
(COMPATIBILITY.md §3) is to pin the document's behaviour "for any other implementation".

Every rollover case now carries `deviceZone`. The Swift replay computes in it, because its date
functions take a zone; the Node replay skips a case written in another zone and says so, because
`model.js`'s `localDate` reads the process's. No expected value moved — the regenerated files differ
only by the new key — and `compat.test.js` passes in Chicago, UTC, Tokyo, Niue and Kiritimati.

**How to apply:** a golden case that a second implementation is meant to replay must name every input
it depends on, and the device's clock is an input.

## The JavaScript-semantics layer

**A small layer under the model reproduces JavaScript's string, number and object semantics, rather
than the model being written in idiomatic Swift.**

Why: `merge()`'s tie-break compares canonical JSON — its length first, then the string. Two clients
that canonicalise differently disagree about which of two records stamped with the same `updatedAt`
wins, and the disagreement never converges: each keeps pushing its own answer and the line flips
between devices forever. Nothing on the wire shows it. Three JavaScript details decide the answer:

1. **Strings are UTF-16.** `normalize()` truncates with `String.prototype.slice`, which counts UTF-16
   code units, so a note cut at 300 can end in half a surrogate pair, and JavaScript keeps the lone
   surrogate (`JSON.stringify` writes `\ud83d`). Swift's `String` cannot hold one. So `JSString` wraps
   `[UInt16]`, and slicing, length, comparison and escaping all work on code units. Swift `String`
   conversion is there for the accessors and the CLI, and is the only lossy edge — deliberately, since
   nothing but display goes through it.
2. **Order is by UTF-16 code unit.** `canon()` sorts keys with `Array.prototype.sort`, and
   `pickRecord` compares canonical strings with `>=`. Swift's `String` comparison is by Unicode
   canonical equivalence, which orders a decomposed and a precomposed "é" the same and code units
   differently. `JSString` compares code units.
3. **`Object.keys()` hoists array-index-like keys.** Insertion order otherwise. This is invisible to
   `canon()`, which sorts — but rollover's step 4 computes `lastOrder` over `items` while it mutates
   `items`, so two lines revived into the same section take their `order` from iteration order.
   `JSONObject` therefore preserves insertion order and hoists canonical integer keys, and every
   ported function inserts keys in the same order `model.js` does.

**How to apply:** anything that will be compared, sorted, measured or hashed goes through the JS layer.
Anything shown to a person may use Swift `String`.

## Records are JSON objects with typed accessors

`COMPATIBILITY.md` §3: an old client must never drop what it does not understand, and this client will
be the old one. A Swift struct with stored properties silently discards every key it has no field for,
which is exactly the failure §3 forbids. So a record is a `JSONObject` plus typed accessors, and
`normalize()` ports `passThrough` verbatim.

## The shared vectors file

The three pinned derivation vectors moved from `test/crypto.test.js` into `test/fixtures/vectors.json`,
which both suites read. Two implementations of a frozen derivation with two copies of the numbers is
two chances to edit one of them. The file also carries the canonical-JSON cases, the link cases, the
date cases and real envelopes sealed by `crypto.js`, so "what the web does" is written down once.

`COMPATIBILITY.md` §2 still holds: if a suite fails on these numbers, fix the code, never the vectors.

## `p_rev`, not `p_known_rev`

The round's brief called the read RPC `get_list_v3(p_id, p_known_rev)`. The deployed function in
`supabase/migrations/002_v3.sql` is `get_list_v3(p_id text, p_rev bigint default null)`, and PostgREST
resolves overloads by the JSON keys of the call, so the name is part of the contract. The Swift
transport sends `p_rev`.

## `/tv` is a grammar, not a suffix

The brief listed `/tv` among the link suffixes. It does not exist in the web app: `parseHash` knows
`add`, `mine` and `shared`, and anything else matches `\/([A-Za-z]*)` and is ignored with the id left
readable — which is the §1 rule that lets a later version append whatever it likes. The Swift parser
ports the grammar, not a list, so `/tv` behaves here exactly as it does on the web today, and will
keep behaving the same when `/tv` means something.

## `origin` rides with the list record

`sync.js` keeps `mine` / `shared` in the device registry (`tf/v2/meta`) and the list record holds
`rev`, `dirty`, `created`, `mode`. The Swift store keeps all four and adds `origin`, because a Watch
app or a widget reads one list and has no registry panel to consult. The registry stays the phone
shell's business in a later phase; nothing about the document or the wire changes.

## No version bump

`COMPATIBILITY.md` §7 step 7 bumps `version.js`, `sw.js` and `whatsnew.json` together for every change
that reaches `main`. This one does not: `apple/` adds no module to the shell, changes no precached
file, and the what's-new toast keys on `VERSION` changing — bumping it would show every user a toast
for a change they cannot see. The rest of the checklist is run. The check that the site did not move
is a diff of the precached paths against `main`, expected empty, plus the seven Node suites.

## What was deliberately not ported

- `reorderPlan` / `applyPlan` — the fewest DOM moves that turn one row order into another. Pure
  functions, but purely a rendering concern: nothing about the document depends on them, and the
  Apple shell renders the web UI. If a native list view ever needs them they are twenty lines.
- `migrateV1` — the v1 localStorage shape. It reads a key only a browser that ran v1 has ever held.
- `normalizeRegistry` — the device registry (`tf/v2/meta`) is the shell's, and Phase 2's. The Swift
  store keeps `origin` on the list record instead (above).

Everything else in `model.js` is here, including the parts an app has no use for yet (`lostEdits`,
`dayReview`, `exportMarkdown`), because a second implementation that covers most of the contract is
one that will disagree with the first somewhere nobody is looking.

## A bare secret is an edit link

`tfive show <22 characters>` opens it as a Private link, because that is what `parseLink` in `app.js`
does with a bare id pasted into the welcome's box. A View link therefore has to be given in full, as
`#/r/<R>`. Matching the web here matters more than being clever: a person who pastes a secret into
either gets the same answer.

## The interop run writes down every id before it asserts anything

A row exists on the server the moment the page pushes it, which is before any assertion about it can
run. An early debug probe of this round created a list and threw the secret away when it exited — the
row cannot be named, so it cannot be deleted, and it will sit until the reaper takes it at twelve
months idle (`private.limits`). `apple/tools/interop.mjs` now appends every id to
`apple/tools/.interop-created.txt` the instant the row exists, and refuses to start if `tfive` is not
built.

**How to apply:** when a probe can create something on a real server, write down what it created
before doing anything else with it.

## `fileURLToPath`, never `URL.pathname`

This repo lives under `Today's Five`. `new URL(...).pathname` percent-encodes the space, and the path
that comes out is one no `exec` will find — which is how the first full interop run failed every
`tfive` call with an empty error message.

## Testing with the toolchain's own framework

`import Testing` (swift-testing), not XCTest and not a third-party runner: it ships with Swift 6.3, so
"zero third-party dependencies" holds, and `swift test` runs it. The iOS and watchOS destinations are
built, not tested — the tests are host-side and prove the logic; running them on a simulator would
prove the simulator.

## The differential fixture is stored deflated

`test/fixtures/merge-cases.json.deflate` is 1.7 MB where the JSON is 20 MB, and twenty megabytes of
generated documents is not a thing to put in a repository. Raw DEFLATE is a format both sides already
speak — `crypto.js`'s envelope, `Compression` on the Swift side — so reading it needs no new code and
exercises that path a little more. The inputs are written in full; the answers are digested (length
in UTF-16 code units, then a SHA-256 prefix) except for the first 120 cases of each kind, which keep
their canonical JSON so the ordinary failure is diagnosed where it is read.
`node test/tools/gen-merge-cases.mjs --explain sequence 417` prints any case in full.

## The repository's git identity

`user.email` was unset in this checkout while every commit in the history is authored
`Price Brannen <pricebrannen@gmail.com>`, so `git cherry-pick` and `git rebase` refused to run. Set
locally in this repository only (`git config user.email`), to the address the history already uses.

---

# Phase 2 — the iPhone shell

## The page already had a haptic, and it had to stand down

`app.js` has fired an iOS haptic on check-off since before this phase, through a hidden
`<input type="checkbox" switch>` — toggling it inside a tap makes iOS play the switch tick. It is
also called on shuffle, and `dev.haptics` is a kill switch with no UI behind it.

Good news and a trap. Good, because the web already feels right on one moment. A trap, because in the
app a check-off would fire the tick **and** the native generator: two buzzes. And the trick cannot do
the job on its own — one tick, no distinct un-check, no finale, no control of intensity.

So 1.10's `HAPTIC` gains `&& !SHELL`. The native haptics **replace** it inside the app rather than
stacking on it, and `tf:shuffle` exists at all because turning the trick off would otherwise have
taken away a tick the page has today.

**How to apply:** before adding a native version of something, check whether the web already has a
poor version of it. Two implementations firing at once is worse than either alone.

## A user-agent token, not an injected flag

The page needs to know it is in the shell. The obvious way — inject `window.__tfShell = true` — runs
into two walls at once: the site's CSP is `script-src 'self' 'sha256-…'` with no `unsafe-inline`, and
a script injected into a *client* content world (which is not subject to that CSP) has separate JS
globals, so the page would never see the flag.

`WKWebViewConfiguration.applicationNameForUserAgent` sidesteps both. The token is in
`navigator.userAgent` before the first byte of script runs, no injection, no CSP, no world. The page
reads `/ TodaysFive\//.test(navigator.userAgent)` once.

## The bridge is in a client content world, and that was measured

DOM events cross content worlds because the DOM is shared; JS globals do not. That is the whole
reason the flag above is a user-agent token and the *listener* is a user script in
`WKContentWorld.defaultClient`. Neither half of that was safe to assume, so `-TFSelfTest` dispatches
the four events in the **page** world and counts what the client world heard:

```
bridge=ready heard=4/4  registryReadableFromClientWorld=string
shellToken=true serviceWorker=true standaloneSeenByPage=false
```

That one run settled the CSP question, the cross-world question, whether `localStorage` is reachable
from a client world, whether app-bound domains really does buy the service worker, and §3a.

## The async `evaluateJavaScript` throws on a null result

Found by the self-test, not by reading. `webView.evaluateJavaScript(_:in:contentWorld:)` in its
`async` form returns a non-optional `Any` and **throws** when the script evaluates to `null` — which
is exactly what `localStorage.getItem("tf/v2/meta")` returns on a device that has never held a list.
The catch swallowed it and returned, so a fresh install never reconciled its vault at all: the one
case the vault exists for.

The script now always answers a string, and `""` is the absent case.

**How to apply:** a `catch` that logs and returns is a place a bug can live quietly. When the failure
mode and the empty result mean different things, make the script incapable of the ambiguous answer.

## The vault keeps a mark of its own, because the registry cannot answer the question

*(This supersedes the section below it, which was right about removal and wrong about wipes.)*

The vault has to tell two things apart, and they leave **the same registry**:

* the person removed their last list — `{"lists":[]}`, and the vault must drop it too, or the next
  launch resurrects what they just removed;
* the web store was cleared — `{"lists":[]}`, and the vault must give the list back, which is the
  only reason the vault exists.

Checkpoint 1's correction said to key on `tf/v2/meta` *existing*. That is unreachable in practice:
`persistMeta()` runs on the page's first boot, so a wiped store has a registry within a frame or two
of loading, and the app never sees the key missing. Measured on a simulator, the app read a wiped
store as "the page removed everything" and logged `vault: +0 −1` — it deleted the only copy of the
link, in the exact case it was built for. Reading it as *absent* is not a design that can be tuned;
it is a design that cannot fire.

So the app writes **`tf/app/seen`** into the same `localStorage`. It holds nothing. Its entire job is
to be destroyed by the one event the app cannot otherwise observe, and it is destroyed by exactly
that event and no other — the page clears only its own keys, never the whole store. Mark there: the
page is speaking, and `lists: []` means a removal. Mark gone: the store is new to this app, nothing
is removed, and the most recently seen link is offered back.

It is written **after** the plan is applied, so a crash in between leaves the cautious answer rather
than the destructive one. `tf/app/` is now the clients' prefix, and §8 of COMPATIBILITY.md says the
web may not write, read or clear anything under it.

## `archived` is how the page says "not on this device"

*Remove from this device* does not take the entry out of `lists`. `archiveList` sets `archived` on it
and leaves it there, because the server and the person's other devices still have the list and Lists
brings it back under **Removed from this device**. Reading `lists` naively — which the first version
did — the phone went on holding the key to a list it had been told to forget, and the next wipe would
have offered it back.

This is the cost of observing rather than relaying, stated plainly: the app has to know not just the
registry's keys but what the page *means* by them. Two of this round's five bugs were that. The
alternative — a second bridge message from the page saying "I removed this" — was rejected in the
plan and is still the wrong trade, because a message can be missed and a state cannot; but the state
has to be read for what it says.

## What checkpoint 1 got right, and what it could not have known

The correction at checkpoint 1 was that `lists` being non-empty is the wrong thing to key on:
removing the **only** list leaves `lists: []`, and a rule that read that as a wiped store would
resurrect what the person had just removed. That is exactly right, and it still holds — it is the
"mark there" half above.

What the amendment proposed instead, keying on `tf/v2/meta` *existing*, turned out to be a test that
never fires: the page writes a registry on its first boot. Only running it on a device showed that,
and the mark is what replaced it. Both requirements the checkpoint set are met; the mechanism is one
level further down than either of us wrote.

A link the app has vaulted but the page has never registered is exempt from removal until it has been
seen in a registry once — a link tapped from Notes is vaulted before the page finishes opening it,
and must not be dropped in that window. That rule is unchanged, and it does double duty: it is also
what stops the reconcile after a restore from deleting the link it just restored.

## The events go on `window`

`app.js` already dispatches `tf:theme` and `tf:settings` on `window`. A second convention in the same
file would be a trap for whoever comes next, so the four new ones join them. Settled at checkpoint 1.

## `STANDALONE` learns about the shell

Without it the app is treated as Safari on iPhone, and three things follow that a person would
notice: an *"Add this to your Home Screen"* hint **inside the app**, a save sheet leading with Home
Screen steps, and a full page reload on every list switch. One term on an existing constant removes a
branch rather than adding one. Settled at checkpoint 1.

## No XcodeGen, so the project file is written by hand

`brew` is not installed, so XcodeGen is not available. The `.xcodeproj` is hand-written and committed,
and there is no `project.yml` to be the source of truth instead. It is a small project — one target,
five sources, one local package — and `xcodebuild -list` says immediately when it is malformed.

## The launch screen is a colour, not the mark

A mark on the launch screen would flash and vanish; a flat `#1A1D21` that matches the page's own first
paint is invisible, which is what a launch screen should be.

## `.ambient`, and the silent switch is not fought

The page already carries a one-time hint that the ring/silent switch mutes its sounds. `.playback`
would play over the switch and make that hint a lie. `.mixWithOthers` because a check-off should not
stop someone's music.

## Lighthouse ran after all, from where 1.9 left it

The first pass of this round recorded the ≥ 95 gate as unverified: there is no `npm` on this Mac and
nothing in the repo installs Lighthouse. It was there all along — 12.8.2 in an earlier session's
scratchpad, with 1.1's `run.sh` beside it, which is the harness every round since v4 has used. Same
tool, same flags, same machine, so the numbers are comparable rather than merely present.

The result is worth writing down precisely, because a single pass would have read as a regression:
1.10's first mobile-warm run scored 98 against 1.9's 99. Ten runs each say otherwise. Every mobile
run lands in one of two clusters — FCP ≈ 1584 ms, which scores 99, or FCP ≈ 1776 ms, which scores 98
— and which one it lands in is a coin flip that has nothing to do with the build: **1.9 and 1.10 both
came out six 98s and four 99s.** Desktop is 100 / 100 / 100 on both. The lesson is the harness's
spread has to be measured before a one-point difference is allowed to mean anything.

---

# Phase 2b — signed, linked, on TestFlight

## The app's version is the web's version, not one of its own

`MARKETING_VERSION` is `1.10` and `CURRENT_PROJECT_VERSION` is `139` because that is what
`version.js` says is deployed. The app is the live page, so About is the *page's* About: it reads
"1.10 (build 139)" because the page is 1.10 build 139, and App Store Connect now says the same.

An app version counting on its own would give two answers to "what am I running" and only one of them
would be true. The cost is that the app's build number has to be bumped with the web's on any round
that ships both, and that a build already uploaded to TestFlight pins that number — App Store Connect
refuses a second build 139 for version 1.10. If a phase ever needs a second upload against an
unchanged web version, the app's build number is the one that has to move, and it stops being the
web's. That would be worth a line here when it happens.

## The device was registered through the API, not by Xcode

Automatic signing with `-allowProvisioningUpdates` and the App Store Connect key gets exactly one
error from a team with no devices: *"Your team has no devices from which to generate a provisioning
profile."* `generic/platform=iOS` cannot fix it, because a generic destination names no device to
register — and `xcodebuild` never saw the phone as a destination at all until Developer Mode was on,
which is a switch only a hand on the phone can throw.

So the phone was registered with `POST /v1/devices` and the build went through unchanged. That keeps
the whole of §1 in the shell, which is the point: no Organizer, no Accounts pane, nothing that has to
be described in prose instead of run.

## A token that expires in exactly twenty minutes is refused

Apple's limit on an App Store Connect JWT is twenty minutes, and `exp = iat + 20 * 60` is over it
once the two clocks disagree by a second — the answer is `401 NOT_AUTHORIZED`, which reads exactly
like a malformed key and sent the first attempt looking in the wrong place. Ten minutes works and
there is no reason to want more. Written down because the next person to sign a token here will
reach for twenty.

## The association file names the bare path as well as the wildcard

The file had one component, `/todays-five/*`. Every Today's Five URL — Private, View, `/add?text=`,
`/mine`, `/shared` — has the path `/todays-five/` and *nothing else*: the id and the entire grammar
live in the fragment (`model.js`'s `parseHash` matches on `#/…`), and Apple matches on the path with
the fragment stripped. So the pattern that has to match is the bare `/todays-five/`, and whether `*`
matches an empty string is not a thing to leave to a reading of Apple's matcher when naming both
costs a line.

Nothing else on the origin is claimed. `astraeus` is a separate project page under the same host, and
no rule here touches it.

## GitHub's content type is not refused by Apple's CDN

Pages serves `.well-known/apple-app-site-association` as `application/octet-stream`, which is the one
thing that could have made a user-site repo the wrong answer. It is not: Apple's CDN had already
fetched and parsed the file, and picked up an edit to it within minutes. No redirect, no worker, no
second host — the plain file at the origin root is enough.

## `--payload-url` is not a stand-in for a universal-link tap

`devicectl device process launch --payload-url` hands the app a URL at launch and is tempting as a way
to test link handling without a hand on the phone. It is a fair test of *the app's* half — the URL is
parsed and vaulted every time, which is `open(_:)` doing its job — and it is not a fair test of the
whole: across otherwise identical runs the page opened the list once and then stopped doing so, with
no difference in the app's own log. `-TFWipeWebStore` also fights it outright, because the wipe's
completion handler loads the start URL *after* the scene delegate has loaded the link, and the start
URL wins.

Whatever that is, it is the harness rather than the app, and nothing was concluded from it either
way. The check that counts is a real tap from Messages and from Notes, which is what §5 records.

## The distribution certificate is not this key's to make

`xcodebuild archive` works on the App Manager key. `-exportArchive` for the App Store does not:

```
403 FORBIDDEN_ERROR — You haven't been given access to cloud-managed distribution certificates.
Please contact your team's Account Holder or an Admin to give you access.
```

That is a permission on the key's **role**, not a mistake in the export options, and no amount of
`-allowProvisioningUpdates` argues with it. An **Admin** key lifts it. The alternatives were to cut
one, or to hand the archive to Xcode's Organizer and press the button — and the call was Organizer
for this build, so the round ends with the archive staged in
`~/Library/Developer/Xcode/Archives/` rather than with a build number in App Store Connect.

Worth being precise about what that costs: everything up to the archive is reproducible from the
shell, and only the last step is a hand on a button. A second Admin key would make the whole of it
one command, and that stays available whenever it is wanted.

## TestFlight's app-level information can be set before a build exists

The feedback email, the privacy-policy URL (About's own page) and the app description are
`betaAppLocalizations` and belong to the **app**, so they were set over the API with no build
uploaded. The internal group **Family** is a `betaGroups` record and likewise. What could *not* be
set is **What to Test**: that is a `betaBuildLocalizations` record, it hangs off a build, and there is
no build until the upload happens. The three lines are written and waiting rather than invented later.

## The Messages half was not run, and is recorded as not run

The §5 check asks for a tap from Messages as well as from Notes. A tappable link in Messages requires
*sending* a message, which is not something to do on someone's behalf uninvited even when the only
recipient is themselves. Asked at the checkpoint, the answer was to skip it.

Notes exercises the identical path — the same `NSUserActivityTypeBrowsingWeb`, the same `webpageURL`,
the same `open(_:)` — so what is untested is iOS's routing from one particular app, not anything here.
It is written down as unrun rather than folded into the passing checks, because a checklist that
quietly absorbs what it skipped is worth nothing the next time it is read.

---

# 1.12 — a finale you can feel

## The pattern, and where its numbers come from

`tf:finale` was one `UINotificationFeedbackGenerator(.success)`. The page is throwing confetti in a
shape at that moment, and a single tap said none of it. The pattern is the volley, in the hand:

| at | event | intensity | sharpness | what it is |
| --- | --- | --- | --- | --- |
| 0.000, 0.065, 0.130, 0.195, 0.260, 0.325, 0.390 | transient ×7 | 0.55 | 0.45 | the run along the bottom — `fx.js`: `for (let i = 0; i < 7; i++) … i * 65` |
| 0.210 | transient | 0.80 | 0.30 | the burst through the middle — forty pieces to the run's twenty-six, so fuller and rounder |
| 0.700 | transient | 1.00 | 0.25 | the chord — `packs.js`, `t0 + 0.7` |
| 0.700 – 1.020 | continuous | 0.45 | 0.15 | the ring-down under it |

Total duration 1.020 s, which `-TFSelfTest` prints back so the arithmetic is checked rather than
asserted. **None of these numbers is invented**: seven, sixty-five and two hundred and ten are read
out of `fx.js`, and seven hundred out of `packs.js`. If the volley is ever re-choreographed, this
table is wrong and the feeling stops matching the picture — `test/sound.test.js` holds the web half
to the same source, and this file is the note for the Swift half.

The web's Android vibration follows the same rhythm: `FINALE_BUZZ` in `sound.js`, buzz/gap pairs
whose onsets are those same seven, with the centre burst inside the fourth (`navigator.vibrate`
cannot overlap two buzzes, and a longer fourth is the honest way to say "and one more here") and a
long one on the chord.

## CoreHaptics needed nothing from the project file

`import CoreHaptics` is the whole of it. The project links no system framework explicitly — UIKit,
WebKit, AVFoundation and Security are all already used and none appears in the `.pbxproj`; Swift
autolinking with `CLANG_ENABLE_MODULES` brings them in. The deployment target is iOS 17 and Core
Haptics is iOS 13, so there is no availability guard either. Worth writing down because the project
file is hand-edited here (no XcodeGen), and the instinct is to reach for it.

## No stopped or reset handler

`CHHapticEngine` offers `stoppedHandler` and `resetHandler`, and under Swift 6's complete concurrency
both are closures that would have to hop back to the main actor to touch anything on this class. They
buy nothing on the path that matters: `startEngine()` is idempotent and called on every touch-down,
so an engine the system shut down is started again before the next finale, and one that will not
start at all is dropped so the next attempt builds a fresh one. A finale that still cannot play falls
back to 1.10's `.success` tap rather than going silent.

## What the simulator can and cannot say

A simulator reports `supportsHaptics == false`, so `playFinale()` returns false there and the
fallback runs — which means nothing would ever have touched the pattern until it reached a phone.
`-TFSelfTest` therefore **builds** the pattern whatever the hardware says and prints the result:

```
selftest: bridge=ready heard=4/4 check=1 uncheck=1 finale=1 shuffle=1
selftest: finale pattern ok duration=1.020s hardware=no
```

That is the whole of what a simulator can prove: the four moments arrive, and the pattern is
well-formed and the length it should be. **Whether it feels like the confetti looks is a question
only a phone can answer**, and this round did not get to ask it — see PLAN.md's verification notes.

---

# Phase 3 — the Watch

## The plugin became a prebuild command, and `tfconfiggen` is gone

A build-tool plugin's work directory is keyed by package, target and plugin — **not by platform**. So
the moment a second target in the same project depends on `TodaysFiveCore` (the Watch app does, and
the iPhone app already did), one build plans the `ConfigGen` command twice, once per platform, both
declaring the same output file, and the build system refuses:

```
error: Multiple commands produce '…/BuildToolPluginIntermediates/todaysfivecore.output/TodaysFiveCore/ConfigGen/Config.generated.swift'
    note: Target 'TodaysFiveCore': CustomTask Reading config.js e35cce56…
    note: Target 'TodaysFiveCore': CustomTask Reading config.js 21f1759e…
```

Nothing available to the plugin distinguishes the two invocations. `PluginContext` has the package
and the target and no platform, and the plugin *process* — dumped, not assumed — inherits the login
environment and sees no build settings at all: no `PLATFORM_NAME`, no `SDKROOT`, nothing. So the
output path cannot be made unique, and a build command cannot be used.

A **prebuild** command hands the build system a *directory* to glob rather than a file it promises to
produce, and the collision cannot arise. That forced the second half: *"a prebuild command cannot use
executables built from source, including executable target 'tfconfiggen'"* — the build system's own
sentence. So the writer is `/bin/sh` with the three values passed as **arguments** rather than
interpolated into the script (a value can then never become shell), and the `tfconfiggen` target is
deleted. `config.js` is still read at build time and neither value is ever typed into Swift, which is
the whole reason the plugin exists.

The cost is that a prebuild command runs on every build. It writes about two hundred bytes.

**How to apply:** a build-tool plugin that generates source is fine until a second platform wants the
same package. If a package will ever be linked by two targets, its plugins must not declare a fixed
output path.

## The App Store Connect key can use a capability and cannot add one

Registering the Watch app's App ID with `-allowProvisioningUpdates` and the App Manager key worked
first time. Adding **App Groups** to that App ID failed twice, identically:

```
error: Authentication failed: Make sure a bearer token was provided, it is properly configured and signed, and it has not expired.
error: Provisioning profile "iOS Team Provisioning Profile: *" doesn't include the App Groups capability.
```

The first line reads like a broken key and is not one — the same key had just registered an App ID.
It is Phase 2b's wall one level along: an **App Manager** key may consume a capability and may not
create one, exactly as it may use a distribution certificate and not make one.

What lifts it is the Apple ID now signed into Xcode. `-allowProvisioningUpdates` with **no**
`-authenticationKey*` flags at all uses the account rather than the key, and it created the group:
`group.com.pricebrannen.todaysfive` is in the Watch app's signed entitlements.

So the recipe splits, and `README.md` says so: **the key for ordinary builds, the account for any
build that changes a capability.**

## The Watch's finale is an approximation, and says so

`CoreHaptics.framework` is not in the watchOS SDK. 1.12's finale — seven transients 65 ms apart, a
fuller one at 210, the chord at 700 with a 320 ms roll under it — is a `CHHapticPattern` and cannot
be played on a wrist. `WKInterfaceDevice.play(_:)` takes a type and nothing else: no time, no
intensity, no sharpness, and watchOS coalesces haptics that arrive too close together.

So the Watch plays the volley's *rhythm* — seven `.click` on the same onsets, `.success` on the chord
— and the plan calls it an approximation rather than claiming the pattern. The numbers are still read
out of `fx.js` and `packs.js`, so if the volley is re-choreographed every client is wrong together
and `test/sound.test.js` says so.

The Watch also answers an **uncheck** with `.click` where the web's `sound.js` gives an uncheck no
buzz at all. Deliberate: a wrist that answers a tap with nothing reads as a tap that missed.

## The payload is stamped, and the stamp is not justified by a claim about WatchConnectivity

The first measurement said one `updateApplicationContext` produced **two**
`session(_:didReceiveApplicationContext:)` callbacks on a cold-launched watch, and that
`receivedApplicationContext` was empty at activation with a context pending. A second, independent
measurement said the opposite in both halves: eleven updates produced exactly eleven callbacks in
order against an already-running watch app, and on a **cold launch** the property read after
activation was the only reliable source of an already-delivered context.

Both are probably true of different moments, and the useful thing is that **the design does not
depend on knowing which**. The receiver reads `receivedApplicationContext` after activation *and*
handles the callback, and the payload carries `v` and `at` so it is applied only when `at` is newer
than the last applied `at`. Applying the same payload twice is then free, and out-of-order delivery
is safe.

The first version of this note asserted the doubling as a fact about the framework and used it to
justify the stamp. That was the wrong shape of argument even while the observation stood: a stamp is
right because a channel whose delivery you do not control should not be trusted to deliver once, not
because you have proved it delivers twice.

**How to apply:** justify defensive design by what you are not entitled to assume, never by a
measurement that a second run can take away from you.

## Three more numbers, and one gate never to write

* `WCPayloadSizeLimitApplicationContext` is **262144** (256 KiB), against 65536 for `sendMessage` and
  for `transferUserInfo` — on disk in both the iOS and the watchOS runtimes, and identical in both. A
  vault of links is a few hundred bytes, so there is nothing to manage; it is a number to know.
* `transferUserInfo` **did not deliver at all** on this simulator pair, at any size, while
  `updateApplicationContext` was demonstrably arriving. Not used here, and now there is a reason
  written down rather than a preference.
* **`isReachable` is asymmetric.** At the same instant the phone logged `reachable=true`, the watch
  logged `reachable=false`. `updateApplicationContext` does not consult it — which is exactly why it
  is the channel this design uses — but a reachability gate on either side would have failed
  silently and intermittently. Do not write one.

## An App Shortcut phrase cannot carry a line of someone's list

The brief asked for *"Add ⟨text⟩ to Today's Five"* and that phrase cannot be built. An App Shortcut
phrase may only interpolate a parameter whose type is an `AppEntity` or an `AppEnum`; a free-text
`String` parameter inside a phrase is a **halting build error** — *"Invalid parameter type. AppEntity
and AppEnum are the only allowed types"* — not a warning to be lived with. Modelling a line of
someone's to-do list as an enumeration is not a design, it is a workaround with no set to enumerate.

So the phrases are parameterless — *"Add to Today's Five"* — and Siri asks for the line afterwards,
with the prompt coming from the parameter's `requestValueDialog`. It is two beats where the brief
wanted one, and it is the closest thing watchOS allows.

Two neighbouring rules found the same way, both build failures rather than warnings: every phrase
must contain `\(.applicationName)`, and the intent and its `AppShortcutsProvider` must be in the same
target (compiling the shared file into both targets satisfies that). An app may register at most ten
App Shortcuts.

## An empty `links` array is a state the phone said, not one the Watch inferred

The trap that cost Phase 2 its worst bug — reading "the registry is empty" as "the store is gone" —
has an exact analogue here: a payload with no links, and a Watch that has heard nothing, look the
same if you let them. They are separated the same way, and the separation is cheaper here than it was
on the phone: the phone always sends a **stamped** payload, so "no links" is something it said. A
Watch that has heard nothing has no stamp and changes nothing.

## The simulator does not install the watch app for you

`simctl install` of the iPhone app onto a paired phone simulator leaves the watch untouched, so
`isWatchAppInstalled` is false and every `updateApplicationContext` throws
`WCErrorCodeWatchAppNotInstalled` (7006). This looks exactly like WatchConnectivity being broken in
the simulator, which it is not. The watch app must be installed onto the watch simulator explicitly,
and `apple/README.md`'s Watch section leads with it.

Two more harness facts from the same afternoon: **`simctl` cannot tap a watch simulator** (it lists
and screenshots and nothing else), and **Keychain entitlements are enforced on the watch simulator**,
so the vault can only be exercised from a properly signed target rather than a hand-assembled bundle.

## No API forces dictation, and the simulator cannot settle what happens instead

`TextFieldLink` has four initializers and none takes an input mode. `WKTextInputMode` has three cases
and none of them means "dictation only" — the mode widens what characters may come back, it never
picks the input method. The one lever is WatchKit's
`presentTextInputController(withSuggestions:allowedInputMode:completion:)`, where a **nil**
suggestions array skips the chooser screen; in both the watchOS 11.1 and the watchOS 26.5 simulator
that landed on the QWERTY keyboard.

That is not the answer to the question, because **a simulator has no microphone**. So the app
presents the WatchKit controller (reached from the SwiftUI app through
`WKApplication.shared().visibleInterfaceController`, which is public API and non-nil from a pure
`WindowGroup` — measured), falls back to `TextFieldLink` if that is ever nil, and the round records
what a real wrist shows rather than claiming it.

**No custom speech recognition was attempted**: `Speech.framework` is not in the watchOS SDK, checked
on disk. A phone-relay version — record on the wrist, transcribe on the phone — is possible and was
not built: it is slow, it needs the phone awake and in range, and it turns the Watch back into a
terminal for the phone, which is the thing the data path spends its whole design avoiding. Worth
revisiting only if the wrist says dictation is genuinely out of reach.

## There is no Action button API to write against

Nothing developer-facing for the Ultra's Action button exists anywhere in the watchOS 26.5 SDK, and
the simulator runtimes ship no Ultra hardware support. So there is nothing to implement and nothing
to verify: an App Shortcut is what makes an intent assignable, and the assignment is two taps in
Settings that only the owner of the watch can make. `README.md` carries the two lines.

## The long press on the count is a Watch idiom, and the web has no such thing

On the web a plain tap on the count toggles one-thing mode, and Start again is a button under the
finale card reading *Bring them all back*. The Watch has no room for a second button, so Start again
lives behind a long press on the count — but the *action* is the web's `startAgain()` exactly:
un-done every done line in the view, each with its own fresh `updatedAt`, and the uncheck moment.

Worth writing down because it is the one place the Watch's gesture vocabulary and the web's part
company, and someone reading the two side by side deserves to know it was a choice.

## The theme the Watch cannot have this round, said out loud

The brief asks the Watch to follow the phone's day/night slot accent when it knows it. The payload in
§2 carries links and nothing else — no slot, no accent, no `dev.switch` — so there is no channel for
it, and building the codec from §2 and then discovering that at integration would have let the
promise degrade to the fallback with nobody noticing it had been dropped.

So it is written down as not built, and the fallback is chosen rather than defaulted into:
**`#A86014`**, the brand accent that Dark, Paper *and* Terminal all carry — the day default since
1.11, the night default, and the app's own. The three likeliest themes are already right; only a
person on Pink or Ocean sees a Watch that does not match their phone.

Adding `slot` and `accent` to the payload later costs nothing, because the codec keeps keys it does
not understand — which is `COMPATIBILITY.md` §3 applied to a channel instead of a document, and this
is the first time that rule has paid for itself here.

## A minute timer is not a beat on a watch

The web rolls a list over in two places, and one of them is `setInterval(…, 60000)`. Copying that to
the Watch would produce a timer that is suspended seconds after the wrist drops and **fails
silently** — no log, no crash, just yesterday's finished lines still on Today at nine in the morning,
which is the exact bug the second call site exists to prevent.

So the Watch's recurring rollover is a list of moments rather than a clock: the scene becoming
active, a sync completing, and a background refresh. Between them they cover a Watch left on a wrist
across midnight without pretending anything runs while the screen is off.

**How to apply:** when porting a periodic task to a platform that suspends, port the *occasions*, not
the interval.

## The complication holds a snapshot, not a list

The obvious design — link `TodaysFiveCore` into the widget extension and read the store's own record
out of the App Group — was rejected. A widget has a small memory budget and no business holding
somebody's list, and the narrower the thing in the shared container the less there is to leak. So the
Watch app writes a `WatchSnapshot`: the list's name, the done count, the total, the next undone line,
a stamp. Foundation only, no package dependency, and the extension cannot reach the Keychain where
the secrets are.

The other half is that the **Watch app's own store** has to live in the App Group for any of this to
work — `ListStore` already takes a directory, so the Watch passes the group container instead of
Application Support. `containerURL(forSecurityApplicationGroupIdentifier:)` returns nil *silently*
whenever the entitlement is not in the running binary, and a complication reading an empty directory
looks exactly like a list with nothing on it, so the fallback to Application Support says so in a
debug line rather than pretending.

And a complication only reloaded by a running app shows yesterday's count all morning. The timeline
carries an entry for now **and one for the list's next midnight in its home zone**, where rollover
empties Today — so the face is right through the night with nothing running at all.

## The web's two add paths disagree, so the reference is named

`newItem()` — a person typing a line — filters to the **undone** lines before taking the last order.
`applyPendingAdd()` — a URL landing several lines at once — does not. They have disagreed for
releases and it has never mattered, because the orders they produce are both past everything.

It matters here because the core is about to have exactly one add. The rule is `newItem()`'s
undone-only filter, because a line added by voice is a line a person is adding now; `applyPendingAdd()`
is the reference only for the *shape*, being the path that writes the text and the record in one pass.
Worth a line because "match the web" was not a well-formed instruction until one of the two was named.

## An unordered dictionary made the codec nondeterministic, and a suite caught it

`WatchLinkPayload.init?(dictionary:)` built its `extra` — the keys a later build might send that this
one keeps, per `COMPATIBILITY.md` §3 — by iterating a Swift `Dictionary`. That iteration order varies
per process; `JSONObject` remembers insertion order and its `==` compares it. So two decodes of the
same bytes were unequal about a third of the time, and `swift test` failed three runs in eight.

It is the same family as the bug Phase 1 spent its whole design avoiding — canonical JSON differing
between two implementations that both look right — arriving from a direction nobody was watching: not
the document, a *channel*, and not two clients disagreeing, one client disagreeing with itself. The
nested helper in the same file already sorted, for exactly this reason. The top-level loop did not.

**How to apply:** the moment a type's equality depends on order, every loop that builds one sorts.
And a test that fails one run in three is worth more than a test that passes: this one was written by
the track that wrote the bug, and it still caught it.

## A failed Keychain read is not an empty vault, one channel further along

`WatchLinkSender.sendVault()` was `send((try? vault.all()) ?? [])`. `SecItemCopyMatching` answers
`errSecInteractionNotAllowed` before the first unlock after a reboot, and iOS launches this app in the
background for a universal link or for its counterpart on the wrist — so that line would have put a
**stamped, authoritative** "this phone holds no lists" in the slot, and the Watch, believing it,
would have dropped every link it had.

This is Phase 2's fourth bug wearing different clothes, and it is worth noticing how the shape
survived a change of medium: there the app inferred an event from a state (`lists: []`) and the answer
was a mark; here the app was about to *assert* a state it had not read, and the answer is to say
nothing. Silence changes nothing on the other side — that is what the stamp buys.

The receiver had the mirror image: it wrote its high-water mark unconditionally while every vault
write above it was `try?`. Ordering covers a *crash*; only checking covers a *failure*, and a mark
written over failed writes records a payload the Watch did not keep and will never be sent again.

## The clock is the channel's weakest part, and nothing here fixes it

The sender's stamp is `max(now, lastSentAt + 1)`, which is monotonic **per process**. The Watch's
high-water mark is **persistent**. The two do not have the same lifetime, so a phone clock that ever
runs ahead — a manual date change, a bad correction — poisons the channel for as long as it takes
real time to catch up: the Watch records a stamp from next year and ignores every honest payload
until then.

Nothing in this round fixes it, and it is written down rather than left to be discovered. The cheap
answer when it is wanted is a counter rather than a clock, or a sender-identity plus a sequence, and
either is an additive change the codec already tolerates.

## `tfive check` did the thing the Watch is forbidden to do

`add` has refused a View link since Phase 1. `check` never did — it relied on `SyncEngine` refusing to
push a view ref, so a check-off on a View link was written locally, never sent, and replaced by the
next pull. Silently losing an edit is worse than refusing one, and this round makes
refuse-before-the-document-is-touched a rule for the Watch. The CLI should not be the client that
breaks it, so it has the guard now — one line, and the same sentence `add` says.

## The cleaning pipeline's order differs from the web's URL path, deliberately

`addToToday` does stripBidi → trim → collapse → cut at 200. The web's `/add?text=` path trims,
collapses and cuts in `parseHash`, and strips bidi *afterwards* in `applyPendingAdd`. The difference
shows on two inputs: a line with an override between two words keeps a double space on the web and a
single one here, and a 205-character line with an override inside the first 200 loses a different
character to the cut.

The core's order is the better one — stripping first means the cut counts characters a person can see
— and it is the order the web's own `+` uses, which is the path this round sided with everywhere else.
Written down as deliberate so that the next person to diff the two does not "fix" it.

## The complication's twenty-four crashes, and the fix that was not one

Track B's review found twenty-four crash reports for `TodaysFiveComplications`, all identical, all
before a line of our code runs:

```
EXC_BREAKPOINT (SIGTRAP) in -[_EXConnectionHandlerExtension willFinishLaunching]
   ← _EXRunningExtension.resume() ← EXExtensionMain ← NSExtensionMain
```

The crash report names no cause — the whole backtrace is above us. The unified log on the watch
simulator does:

```
E  TodaysFiveComplications: EXExtensionContextClass not defined or invalid type
E  TodaysFiveComplications: Connection handler class unspecified.
```

Read together those say the bundle was claimed by ExtensionKit's *generic* host instead of by
WidgetKit, so the obvious fix was to declare the extension point in ExtensionKit's own vocabulary:
`EXAppExtensionAttributes` → `EXExtensionPointIdentifier`. Adding it alongside `NSExtension` stopped
the crashes — twenty-four before, twenty-four after — and the extension got as far as running its
configuration intent and asking for a display.

**It was not the fix.** Three measurements say so, in the order they arrived:

1. Declaring **both** keys earns a build warning that reads like an instruction: *"Application
   extensions cannot contain both the NSExtension and EXAppExtensionAttributes top-level Info.plist
   keys."*
2. Declaring **`EXAppExtensionAttributes` alone** will not install at all: *"Invalid placeholder
   attributes … Failed to create app extension placeholder."*
3. So the control that should have been run first: back to **`NSExtension` alone**, clean build,
   uninstall, install, launch — and **no new crash either**, with `com.apple.chrono:widget` archiving
   views and `Request ended for TodaysFiveNextLine:accessoryRectangular - success` in the log.

The twenty-four crashes were an artefact of the round itself. Track B and Track C each installed the
watch app repeatedly from *different* derived-data paths while working, and the log shows the system
launching the extension for placeholder and icon work against bundles being replaced underneath it.
They stopped when the installs stopped, not when the plist changed.

`NSExtension` alone is the shape — what every source said, and what the installer requires.

**How to apply:** a change that coincides with a symptom disappearing has not been shown to have
caused it. The cheap control here — put the original back and measure again — took four minutes, and
it is the only reason this file does not now contain a confident paragraph about a key that would
have broken the build.


## A self-test inside a sheet nobody opens proves nothing

`-TFAddSelfTest` was wired to `AddFlowView`'s `.task`, which is correct-looking and useless:
`AddFlowView` only ever exists inside a sheet, and nothing opens that sheet on launch. The argument
ran, the app started, and the log was two lines long — the seed and nothing else.

It was caught by running it at integration rather than by reading it, which is the same lesson Phase 2
wrote down about a `catch` that logs and returns: **the failure mode of a check that does not run is
silence, and silence looks like a pass.** The self-test now hangs off the app's root view, where the
app always is.

Worth pairing with what it then reported, because the five answers are the ones a person actually
meets: `added`, `nothing-said` for an empty string, `view-only`, `no-list`, and an Undo that
tombstones rather than rewrites. And one line that only a device can confirm but which the simulator
could at least ask: `visibleInterfaceController=present`, so the wrist takes the WatchKit dictation
path rather than the `TextFieldLink` fallback.


---

# Phase 4 — the kits on the wrist, and an accent that isn't locked in

Phase 3 shipped mechanism and deferred appearance. This round is the bill: the web's UI accent, which
1.11 pinned to the brand, and the Watch, which shipped one hex and the system font.

Four tracks in worktrees. What follows is each track's own entries, in the order they were written.


## Track A — the web accent, unpinned from the brand

### The render pass came before the test file, and it is what settled the change

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

### The premise, not the arithmetic, and the comment block says so now

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

### `derive()` was measuring one token against the wrong ground, and half the accents were under the floor

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

### A token nothing reports is a token nothing holds to a floor

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

### The Secret group had three doors, and the third had no guard

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

### `tools/mark.mjs --trace` has been broken since 1.11, and it is not this round's doing

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

### The Secret key is in plaintext in the repo, and it is not in `theme.js`

`theme.js` says of the key that "The word is not written down here — a casual reader of this file
should not trip over it", and that is true of `theme.js`. It is not true of the repo:
`tools/shots.js` types the word into `#c-import` in plain text to take the Secret group's shots.
`tools/kitshots.js` deliberately does not need it — `CURATED` already holds both kits and
`applyTheme` does not ask — which is why the new tool takes every kit's picture without going near
the key. `tools/shots.js` is left alone: changing it would break the shots tool, and whether the key
should live there at all is the orchestrator's call, not this track's.

## Track B — the kit table reaches the core

### A build-time generator cannot parse `theme.js`, and the reason is arithmetic

The obvious shape was ConfigGen's: a plugin that reads the repo's own file at build time, so no
value is ever typed into Swift. It cannot work here, and not for a plumbing reason.

**62 of the 314 hex colour tokens in the finished kit table appear nowhere in `theme.js`'s source,
and all 18 of 18 kits have at least one.** Every `hairSolid` is computed. So are Harbor's
`accentText` `#046D6D`, Teletype's accent `#119449`, Sketch's `#9D7700`, and every one of Dark's
greys. They come out of `finalize()` → `elevated()` → `hairSolidFor()` → `ensure()` → `oklch()`:
sRGB→linear→OKLab with cube roots, a 14-iteration binary-search gamut clamp, WCAG contrast, and a
60-step lightness nudge loop.

A Swift plugin would have to reimplement all of that and match JavaScript doubles bit for bit. It
would *look* like it worked — sixteen kits' worth of literals extract cleanly with a regex — and be
silently wrong on exactly the derived greys that carry the contrast floors. That is the forbidden
second copy of the palette in its worst possible form: one that passes its own tests.

And `node` is genuinely out of reach: `/usr/bin/env -i /bin/sh -c 'command -v node'` exits 1 on the
`PATH` a build sees.

**How to apply:** before writing a generator, count how much of the output is *computed* rather than
*written*. A generator can extract literals; it cannot re-derive a pipeline. If the fraction is not
zero, generate from a fixture the owning language wrote.

### JavaScriptCore is what keeps the fixture honest

A fixture alone does not satisfy "one source of truth". There is no `package.json`, no CI, and every
generator in this repo is run by hand — so a committed `kits.json` would drift the first time
somebody edited a colour and did not regenerate, which is precisely the failure Track B exists to
prevent.

`theme.js` has no imports and touches `localStorage` only inside `applyTheme`, so it is
self-contained. Stripping the `export ` keyword and evaluating it in a Swift `JSContext` reproduces
`CURATED` exactly — byte-identical to Node, 17,674 bytes, about 6 ms. So `KitFixtureTests` asserts
the fixture still equals **live `theme.js`**, not a snapshot of it.

The platform split is the part that makes this safe rather than clever: **`JavaScriptCore.framework`
is present in the macOS and iPhoneOS SDKs and absent from the watchOS SDK.** The check can never
ship to a wrist. It is guarded `#if canImport(JavaScriptCore)` regardless, so a test target built
for watchOS would drop it rather than fail to link.

The mapping from `CURATED` to the fixture lives *in* the fixture, as `expr`, so the generator, the
Node test and the Swift drift test run one definition of it instead of three that can disagree.

**How to apply:** a fixture pins a value; it does not pin the *relationship* between two
implementations. If nothing re-derives the fixture on every run, add the thing that does.

### A second prebuild plugin on one target does not collide

Phase 3 discovered that a build-tool plugin's work directory is keyed by package, target and plugin
and **not by platform**, so two targets linking one package planned the same producer twice and the
build refused: *"Multiple commands produce …/ConfigGen/Config.generated.swift"*. The fix was a
prebuild command, which hands the build system a *directory to glob* rather than a file it promises
to produce.

The open question this round was whether adding `KitsGen` beside `ConfigGen` would bring the
collision back. It does not. Measured, on the condition that produced the original failure — both
platforms, both targets:

```
xcodebuild -scheme TodaysFive      -destination 'generic/platform=iOS Simulator'      ** BUILD SUCCEEDED **
xcodebuild -scheme TodaysFiveWatch -destination 'generic/platform=watchOS Simulator'  ** BUILD SUCCEEDED **
```

The reason is the same one that fixed Phase 3: each plugin gets its own
`pluginWorkDirectoryURL`, and a prebuild command declares no output *path* to collide on. Two
plugins are two globbed directories, and the build system is content with both.

**How to apply:** the Phase 3 lesson generalises further than it was written. A prebuild command is
not merely a workaround for two platforms — it is what makes plugins on a shared package compose at
all.

### The font names in `theme.js` are a fiction `styles.css` invents

`PAIRS` names CSS families — "Outfit", "Manrope", "DM Sans" — and those names exist only because
`styles.css` declares them in 26 `@font-face` rules. **No Apple API does that rename.** Registering
all 26 files and asking `CTFontCreateWithName` for each of the 22 families `theme.js` records
resolves **10 of 22 to Helvetica**: Quicksand, Space Grotesk, Manrope, DM Sans, Outfit, Nunito Sans,
Cormorant Garamond, Josefin Sans, Archivo and Fredoka. Those are the *task* faces of midnight,
harbor, forest, sketch, arcade, dusk, ember and superpink — the list text of eight kits, in the
system font, with **no log and no error**.

The real names are inside the binaries: `outfit-500-800.woff2` is family "Outfit Thin",
`manrope-500-800` is "Manrope ExtraLight", `nunito-sans-400-700` is "Nunito Sans 12pt ExtraLight
12pt".

So `gen-watch-fonts.py` writes the TTFs and then **reads the family and PostScript name back out of
the file it just produced**, into `test/fixtures/watch-fonts.json`. Nothing is derived from
`theme.js` and nothing is guessed. Renaming the families to match the CSS names was considered and
rejected: these are OFL 1.1 faces and rewriting a name table to impersonate the upstream name is the
one thing that licence is careful about. Generating the map costs a fixture; renaming would cost a
licensing argument.

The variable faces are instanced to the weights `theme.js` actually asks for
(`fontTools.varLib.instancer`), because `.weight()` is a measured no-op on a variable file with no
`fvar` named instances — which is exactly what `fraunces-500-700` and `source-serif-4-400-600` are,
and Fraunces is Pink's and Blush's task face. 33 static faces, 1.3 MB, from 732 KB of woff2.
`updateFontNames=True` raises `ValueError: Cannot find Axis Values` on a face whose STAT table lacks
the weight, so the naming is done by hand and read back.

**How to apply:** when a name crosses from CSS into a native toolkit, check that the name is a
property of the file and not of the stylesheet. A wrong font name does not fail; it falls back.

### The Secret pair reaches a wrist without ever being in a binary

The generated table holds **16** kits. `superpink` and `birthday` are in the fixture — the tests
measure all 18 — and in no shipped binary at all, which `KitFixtureTests` asserts directly so it
cannot regress quietly.

They arrive over the channel instead. The phone's `WebViewController.reconcileVault()` already pulls
the whole `tf/v2/meta` string and parses it; `meta.device.secret` is a sibling key in the JSON it
already has in hand, so reading it is two lines and no new bridge and no web change. When it is set,
`WatchLinkSender` puts the two kits' tokens into `WatchLinkPayload.extra`, which has passed unknown
keys through since Phase 3 — `COMPATIBILITY.md` §3's rule applied to a channel, paying for itself a
second time. Absent means remove, the same authority rule links already follow, so re-locking on the
phone reaches the wrist.

**The trap:** `WatchLinkPayload`'s decode sorts its keys and its encode preserves insertion order,
and `JSONObject`'s `==` compares order. Inserting the new keys unsorted silently breaks round-trip
equality — the same class of bug as Phase 3's nondeterministic codec, arriving at the same file from
the other direction. The keys are inserted sorted, and a test says so.

Worth writing down plainly: **the Secret palettes are not cryptographically secret.** `theme.js`
ships to every browser and the gate is an FNV-hashed passphrase. "A Watch that has not unlocked them
does not carry them" is a stricter product rule than the web's own model. It is kept because it was
asked for, not because the data would otherwise leak.

## Track D — the poll papercut

### A narrow `DoorbellTransport`, because the protocol already there would have lied

`RealtimeTransport` has been declared in `Transport.swift` since Phase 1 with zero conformers, and
conforming `SupabaseTransport` to it would have been the tidier-looking move. It promises `subscribe`,
and nothing on the Apple side intends to write one: the Watch, `tfive` and the App Intent are the
*writing* half of realtime and never the listening half. A conformer whose `subscribe` returned a
stub would have type-checked, read as complete to anybody grepping for conformances, and been false.

So `DoorbellTransport` is one method wide — `func ring(_ id: String, _ payload: JSONObject) async` —
and `RealtimeTransport` keeps its no-conformer comment, now saying so out loud. The cost is a second
protocol in a file that already had one, which is the smaller ugliness.

`ring` cannot throw. The write already reached the server; a bell that did not ring costs somebody
else's screen a poll interval and takes nothing away from what was stored, so a caller has nothing to
decide and `push()` has no new failure to map.

**How to apply:** when an existing protocol covers half of what you need, ask whether you will really
implement the other half. A protocol whose conformer stubs a method is worse than a new protocol
narrow enough to be true, because the stub is invisible at every call site.

### The ring is awaited, where `sync.js`'s is deliberately not

`sync.js:331` is `try { me.channel.send(...) } catch {}` — fire and forget, which is right for a page
that stays alive. The Swift callers are not pages. `tfive add` is a process that writes once and
returns, and an App Intent is a process iOS may suspend the moment it answers; an unawaited task in
either is a request that dies before the socket is written.

So `ringDoorbell()` is awaited inside `push()`. It costs one round trip on a write and nothing at all
at idle. It also means a slow broadcast endpoint slows a write — accepted, because the alternative is
a fix that works on the web's lifetime model and silently does not work on any of the three clients
it was written for.

**How to apply:** fire-and-forget is a property of the *host*, not of the call. The same line is
correct in a long-lived page and a no-op in a CLI.

### The fix went into the writer, and `POLL_LIVE_MS` did not move

The measurement said the phone was slow, and the cheap reading of that is "poll more often". Rejected,
on three numbers:

* shortening `POLL_LIVE_MS` costs 4× the polls at idle **forever, on every device**, including every
  web device that has no Watch and no Mac and will never receive a Swift write;
* it does nothing for a backgrounded page. Measured 20/20 "never" in 600 s of virtual time at *either*
  interval, because `schedulePoll`'s `visible()` gate is upstream of the timer — no interval reaches
  a hidden page. What rescues one is the `visibilitychange` or `focus` that comes with looking at it
  (`wake()` → `subscribe()` → `pull()`), so a person sees a fresh list when they look and never
  before, which is the design and not a bug;
* the writer's fix costs **zero requests at idle** and one 138-byte body per successful write.

A database-side broadcast — a trigger, or a `put_list_v4` beside the frozen RPC — is parked. It would
mean turning on a realtime feature the project does not configure at all, on a schema whose entire
security story is that the table is unreachable except through three `SECURITY DEFINER` functions.

**How to apply:** when a latency number points at a poller, check whether it is really pointing at the
writer. Making the reader work harder taxes every device; making the writer speak taxes the one that
had something to say.

### The 29-byte poll could not have moved, and here is why that is checkable

`realsync4.js` and `apple/tools/interop.mjs` both weigh the unchanged poll and both assert it stays
under 60 bytes; the number this project has defended across three phases is 29. A doorbell is a POST
to `/realtime/v1/api/broadcast`; a poll is a POST to `/rest/v1/rpc/get_list_v3` with `p_rev`, answered
by the migration's `jsonb_build_object`. Different service, different function, and `rawGet` — the
method both suites weigh — is untouched. The doc comment on `rawGet` now says so, so the next person
reading the two together does not have to re-derive it.

The doorbell body has its own pinned number instead: 137 bytes at a one-digit revision, 138 at two,
asserted in `SyncTests` against the exact string `JSON.stringify` produces for the object
`sync.js:121` builds. `SupabaseTransport.doorbellBody` exists as a separate `static` for exactly that
reason — a cost you can weigh without a network is a cost that stays weighed.

### The status code is written down, because the web's never was

`sync.js`'s REST fallback ends in `.catch(() => {})`. Nothing in the repo has ever exercised it, and
because the answer was thrown away, nobody could have said whether that endpoint had ever replied to
this project in its life. It does: **HTTP 202**, with `{ apikey, Content-Type }` and no
`Authorization: Bearer`, and 202 with the bearer header too.

The Swift version logs the status behind `#if DEBUG`. What it logs is the status and the body length
and nothing else — not the id, which is a channel name derived from a link — and a failure logs the
`URLError` code rather than the error object, because an error object printed whole carries its
failing URL.

**How to apply:** `.catch(() => {})` on a request is not error handling, it is deleting the only
evidence that the request exists. One line that records the answer is the difference between a
mechanism and a hope.

### The median was not the finding

The checkpoint recorded medians of 54 s (realtime connected) and 32 s (not connected). Three runs of
`tools/polld.js` on this machine gave 132 s and 16 s, and 144 s and 12 s on a second seed. None of the
three is wrong and none of them is the result: ten draws from a uniform distribution have a sampling
error of tens of seconds, and the median is the statistic most exposed to it.

What reproduces exactly, every time, is the shape. The latency of a write nobody rang the bell for is
uniform on (0, the poll period], so it is bounded by the period, averages half of it, and the ratio
between the two foreground conditions is `POLL_LIVE_MS / POLL_MS` — arithmetic, not a sample. The
maxima land where they must: 238 s against a 240 s period, 60 s against 60. "A phone whose realtime
is working is four times slower to see a wrist tap than one whose realtime is dead" survives all
three runs; "54 seconds" survives none of them.

**How to apply:** report the distribution and the mechanism that produces it. A median quoted from ten
samples of a wide distribution is a number the next run will take away from you.

### A harness that reported nothing, and looked like it had reported something

Between the before run and the after run the static server died. `polld.js` answered with a clean
table — "never, 0/0" in every condition, zero page errors, exit 0 — which is very nearly what the bug
being measured looks like when the harness *works*. Every trial had thrown `ERR_CONNECTION_REFUSED`.

This is Phase 3's `-TFAddSelfTest` lesson arriving from a new direction: the failure mode of a check
that does not run is silence, and silence looks like a pass. The fix is to make the two states print
differently and never alike — a thrown trial is counted and marked `x`, a condition with no measured
trials prints `NOT MEASURED` rather than `never, 0/0`, and the run exits 1 naming the likely cause.

**How to apply:** any harness that can report "nothing happened" as a *result* must be unable to report
"nothing ran" the same way. If the two render alike, the harness will one day tell you the answer you
were hoping for and be describing its own absence.

### What the local transport proves, and what it cannot

`tools/polld.js` runs against `?transport=local` with `page.clock.install`, so it models the app's
timer arithmetic **exactly** — `POLL_MS`, `POLL_LIVE_MS`, `setLive`, the `visible()` gate, the phase of
a sawtooth — and the network **not at all**. There are no round trips in it, no radio wake, no
`WKWebView` suspend and resume.

So the "after" it can show is not a network measurement. It is the `doorbell` condition: a writer that
rings `list:<lookupId>` the way `sync.js:331` does, and a subscribed page that pulls on it — 0.1 s in
all ten trials, which is the harness's finest slice and contains the local transport's simulated 15 ms
lag. It proves the arrival path (a broadcast reaching a live page turns into a pull immediately) and
says nothing about what a real socket costs to carry it. `apple/tools/interop.mjs` step 5b is where
that is asserted against the real backend, and whether the win survives a real suspend/resume cycle is
on the plan's list of things only a wrist can answer.

The write in the harness is done the way `SupabaseTransport.put` does it — import the app's own
`crypto.js`, decrypt the `tf/v2/localserver/<lookupId>` row, add a line, re-seal, write it back at
`rev + 1`. A `BroadcastChannel.postMessage` would have been three lines and would have simulated away
the exact bug.

**How to apply:** a harness for a missing notification must not be allowed to send the notification.
Write the state the way the real writer writes it, and let the reader find out however it finds out.

### What was left alone

* **`announceGone` has no Swift mirror.** `sync.js` broadcasts `{ rev: 0, from, gone: true }` after a
  rotate, and nothing on the Apple side rotates a link. `removeRemote()` could ring the same bell and
  does not; other devices find out on their next poll, exactly as they did before this round. Adding
  it later is one call in one place and no contract change.
* **`MemoryTransport` is untouched and does not conform**, so every test in the package is still
  offline with no flag to set and no stub to remember. The three behavioural tests use a
  `DoorbellRecorder` that wraps it. Deliberate: the moment the shared test double can broadcast, a
  test can reach the network by forgetting something.
* **`SyncEngine` still has no timer.** The caller drives, which is what a CLI, a background refresh
  and a widget all want, and `pollDelay(live:)` still only *says* what the web would wait.

