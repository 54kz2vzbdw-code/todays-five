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

## Track C, stage 1 — the kit reaches the screen

What was decided on the Watch's look, and what each decision cost. Everything with a number in it
was measured on the Apple Watch Series 11 46mm simulator (watchOS 26.5, `4594CB69`) on this machine,
against `Kits`' generated table at build 158.

---

### The constant did not merely need replacing; its argument had stopped being true

`WatchTheme.swift` shipped in Phase 3 holding `#A86014`, and it argued for it:

> The fallback is a good one and was chosen, not fallen into: `#A86014` is the brand accent that
> **Dark, Paper and Terminal all carry** — the day default since 1.11, the night default, and the
> app's own — so the three likeliest themes are already right.

Track A made that false in the same round. Terminal has its own `#4AF07A` back and Paper its own
`#C8321F`; **only Dark carries `#A86014` now**, and it carries it as its own colour rather than as a
pin over somebody else's. The premise of the fallback was that three kits agreed. They no longer do.

So the file holds a resolved `Kit` — palette as `Color`s, font pair as `Font`s — and the constant is
gone from the Watch entirely. Which is worth saying plainly: a comment that argues for a decision is
the best kind, and it is also the kind that can go stale in a way a bare constant cannot. **A
premise written down is a premise something else can invalidate**, and the only defence is to check
the premises of a file you are about to leave alone.

### The phone-follows channel is still not built, and that is now a decision

Phase 3 recorded "written down as not built" because the payload carried no colour. The payload
could carry one today — `WatchLinkPayload.extra` passes unknown keys through, which is how the
Secret kits already cross — so the honest version of this round's answer is not "we cannot" but "we
will not".

**Theme is a per-device preference in this app, and a Watch is a device.** The web's own model says
so: two slots and a switch live in `meta.device`, per device, and nothing about them syncs. A Watch
that inherited a phone's kit would be the one surface in the product where a theme travels.

What *does* cross is narrower and is a permission rather than a preference: the two **Secret** kits'
palettes, from a phone whose person has unlocked them, so a wrist can render them at all. A phone
that re-locks takes them off the wrist on the next payload. `WatchThemeStore` reads them from the
same App Group key `WatchLinkReceiver` writes rather than from the receiver itself, because a theme
has to resolve on a launch that never starts a `WCSession` (`-TFWatchDemo`), and one reader of one
key is a smaller thing to keep true than two objects agreeing.

### The type, and the one number that is not the obvious one

`Font.custom(face.postScriptName, size:relativeTo:)` at every call site, so the Watch's own text-size
setting still moves the type. The name is `KitFace.postScriptName` from the generated table and never
the family in `theme.js` — those are the fiction `styles.css`'s `@font-face` rules invent, and ten of
twenty-two resolve to Helvetica.

`tracking` is a multiplication and needs no argument: `theme.js` records em, `.tracking()` takes
points, so it is `em × size` — except that it must be the **scaled** size, or the letter-spacing
stays put while the type grows. `UIFontMetrics(forTextStyle:).scaledValue(for:)` is the same
machinery `relativeTo:` uses, asked directly. Measured on this device at the default watch text size:
**17pt relative to `.title3` renders at 16.00**, so Lato's `-0.025em` is **−0.400 pt** and not −0.425.

**`lineHeight` is the one that is not obvious, and the naive version is wrong in the same direction on
every kit.** `theme.js`'s `lh` is a multiple of the point size; SwiftUI's `.lineSpacing` is *extra
space added to the face's own line height*, which is already 1.2–1.4× the point size. Measured: **Lato
Black at 16.00pt stands 19.20 points tall** (`CTFontGetAscent + Descent + Leading`) against the lato
pair's target of `1.14 × 16.00 = 18.24`. So the correct answer is **0.00** extra leading — and
`(lh − 1) × size` would have added **2.24 points** of air to every line of every list, on a screen
where five lines is the whole product. The face is therefore measured, and the result floored at
zero, because SwiftUI will not tighten a line below its face's own metrics.

### `-TFFontSelfTest`, and the two things it found

A missing custom font renders the system face with **no log and no error**. A screenshot of Terminal
set in Helvetica looks like a screenshot of Terminal. So the self-test is the only mechanism in the
round that turns a silent fallback into a failure, and it asks three questions per face: is the
family in `CTFontManagerCopyAvailableFontFamilyNames()`, does `CTFontCreateWithName` hand back the
PostScript name it was asked for rather than a fallback's, and do the pair's two ui weights actually
render differently.

**Final tally, on the watch simulator:**

```
[tfive] font self-test: begin kits=16 pairs=13 files=33 familiesOnDevice=75
[tfive] font self-test: bundled=33/33
[tfive] font self-test: weights told apart by advance=12 ink=1
[tfive] font self-test: faces=33 end pass=96/96
[tfive] font self-test: at 17pt title3 scales to 16.00, task line height 19.20,
                        tracking -0.400, extra leading 0.00
```

**1. Advance width cannot tell two weights apart, and the first run failed because of it.**
`IBMPlexMono-Regular` and `IBMPlexMono-SemiBold` set the same 21-character ruler to the same
**214.20** points. That is not a bug in the fonts; that is what monospaced *means*. The check now
falls back to the **ink** — `CTLineGetImageBounds`, the box the drawn glyphs actually cover, which is
wider in the heavier face even when the cell it sits in is not — and the tally says which
discriminator settled each pair, because "told apart by ink" on a pair that is *not* monospaced would
itself be worth looking at. Twelve by advance, one by ink, and the one is `mono`.

**2. Walking the kits leaves two of the thirty-three bundled faces untested.** The 16 open kits name
only **11** of the 13 pairs: `baloo` and `fredoka` belong to the two Secret kits and to nothing else.
A self-test that iterated kits would have covered 31 faces and reported a clean 74/74 while two files
in the bundle had never been asked to resolve — and the day they are asked is the day somebody
unlocks a Secret kit, which is precisely when no console is attached. **A font pair is not a secret**
(all 33 files ship to every wrist; the Secret rule is about palettes), so the test walks all thirteen
pairs. That took it from 74 checks to **96**.

The first run also printed the `mono` failure twice, once for Terminal and once for Teletype, which
reads like two bugs. Pairs are deduped now.

### The ground, and the two costs that cannot be paid off

`.preferredColorScheme(.light)` is **inert** on watchOS — measured in the Phase 4 checkpoint, over a
cream ground, leaving every `.primary` white and invisible. `.environment(\.colorScheme, .light)`
works. watchOS has no light appearance at all, which is why **every** `.primary`, `.secondary` and
system colour is gone from every Watch screen: fourteen call sites across five files, each of which
was right only for as long as nobody chose a light kit.

The ground itself is set three ways, because one is not enough: `.containerBackground(_:for:
.navigation)` paints the watchOS screen including its corners, `.background` covers the views that
are not in a navigation container (the sheets, the Always-On frame), and `.listRowBackground` is
separate again — `.listStyle(.carousel)` draws its own translucent grey platter, which on Paper's
cream is a grey card on paper. The platters are now the kit's `ink2`. On Dark that is `#0E140F`
against a `#070A08` ground, which is a quieter separation than the system's and is the intended
trade: the platter belongs to the kit or it belongs to the system, and it cannot belong to both.

**Cost 1: the system clock stays white, and it is worse than "low contrast".** Measured on the Paper
screenshot: the glyph core of the time is exactly `(255, 255, 255)` and the ground behind it is
exactly `(247, 242, 232)` — Paper's `#F7F2E8`, byte for byte. That is **1.12:1**. There is no API for
it: not `.tint`, not a toolbar item, not an `Info.plist` key; the time is drawn by the system outside
the app's layer. **A light kit on this device ships with an illegible clock.** Accepted, in writing,
because the brief asked for Paper's cream and this is what Paper's cream costs.

The one place that *does* have a door out of it is the navigation title, which the string-taking
`.navigationTitle("Lists")` also draws in the system's colour. The watchOS-exclusive view-taking
overload takes a `Text` we can colour, and the picker now uses it. Same failure, one of the two has
a fix, and the difference is worth naming rather than lumping together.

**Cost 2: the ground is the battery.** Below.

### Paper's ground, measured — and it is not a battery number

`simctl` models no OLED power and nothing on this machine produces watts. What a screenshot *can*
say honestly is how hard the panel is being driven. The same five-line demo Today, rendered under
three kits, screenshotted at native **416×496**, mean per-channel **linear drive at γ 2.2** as a
fraction of a full-white panel:

| kit | flat | Rec.709 luma | OLED-weighted | max channel |
| --- | --- | --- | --- | --- |
| **dark** (`#070A08`) | 0.0285 | 0.0293 | 0.0281 | 0.0306 |
| **terminal** (`#070A08`) | 0.0284 | 0.0323 | 0.0276 | 0.0352 |
| **paper** (`#F7F2E8`) | **0.7868** | **0.8033** | **0.7755** | **0.8450** |

**Paper ÷ dark: 27.6, 27.5, 27.6, 27.6 — 27.5–27.6× across all four weightings.**
Paper ÷ terminal: 27.7, 24.9, 28.1, 24.0 — 24–28×, the spread being Terminal's green text, which the
luma and max weightings notice and the flat one does not.

The three frames are the same layout to the pixel: **51.1%** of the 206,336 pixels are exactly the
kit's ground in each (105,390 / 105,373 / 105,401), so what is being compared is one screen's two
paint jobs and not two different screens.

**It is not a battery number, and it must never be quoted as one.** Three reasons, and all three
apply every time it is repeated:

1. **No panel calibration.** A screenshot is sRGB values, not emitted photons. The real transfer
   curve of the Series 11's panel, its per-primary efficiency and its brightness setting are all
   absent from the arithmetic.
2. **No static floor.** Panel driver, backplane, SoC and radios draw power that has nothing to do
   with what is on screen. A 27× ratio in the emissive term is a much smaller ratio in the total.
3. **No duty cycle.** The Watch's screen is off, or Always-On dimmed, for the overwhelming majority
   of the day. The ratio applies only while a person is looking at Today.

**The prior measurement in `PLAN-apple-phase4.md` was dark 0.0466, cream 0.8146, 17.5×; this one is
dark 0.0285, cream 0.7868, 27.6×.** The cream agrees to within 3.5%. The dark does not, and the
denominator is where a ratio like this is fragile: a dark frame is *almost all* ground, so its drive
is dominated by how much bright chrome happens to be on screen — the white system clock, the scroll
indicator, how far the carousel has scrolled a bright row into view. The lesson is in the ratio's
sensitivity rather than in either number: **a ratio whose denominator is near zero is not a stable
quantity, and reporting it to three significant figures is a claim the method cannot support.** Both
runs support the same sentence, which is the one worth keeping: *a cream ground drives this panel
between one and two orders of magnitude harder than a near-black one.*

### What stage 1 did not settle

- **Always-On was not rendered.** `simctl` cannot put a watch simulator into luminance-reduced mode,
  and there is no launch argument for it. The flattening rule is written and its colour is now the
  kit's own `dim` rather than `Color(white: 0.62)`, but no screenshot of it exists.
- **Only Today was screenshotted.** The picker sheet, the add sheet and the one-thing page are all
  behind a tap or a scroll, and `simctl` has no `ui tap` for a watch. Their grounds are set the same
  way Today's is; that they *look* right is a stage-2 question and a wrist question.
- **Three kits, not eighteen.** Dark, Paper and Terminal — the three the old constant claimed to
  serve — as a smoke test. The full eighteen are stage 2's, along with the picker that makes choosing
  one a thing a person can do rather than a launch argument.

## Track C, stage 2 — the picker, the confetti, the complications

What was decided about the Watch's second half, and what each decision cost. Everything with a
number in it was measured on the Apple Watch Series 11 46mm simulator (watchOS 26.5, `4594CB69`) on
this machine, against `Kits`' generated table at build 158. Stage 1 is
[`DECISIONS-phase4-C1.md`](DECISIONS-phase4-C1.md) and this does not repeat it.

---

### The one settings screen, and why it is the only one

Phase 3 wrote a sentence and meant it:

> There is no settings screen, no Everything, no sections, no History, no rules, no templates and no
> themes: those live on a phone-sized screen because they need one.

**That sentence is now wrong about exactly one word, and the reason is not that themes are more
important than templates.** It is that a theme is the only item on that list which is a property of
the *device you are looking at*. History belongs to a list. Rules belong to a list. Templates belong
to an account. Every one of them has a phone to be configured on, and configuring it there is not a
compromise — it is where it belongs. The kit a wrist is drawn in has nowhere else it could be
chosen, because there is no other wrist.

So: two slots, a Day/Night switch, and every available kit. `theme.js`'s shape, minus two things.

* **`switch: "system"` cannot exist here.** watchOS has no light appearance at all, so
  `\.colorScheme` reads `.dark` at the root of every app on the device forever. A mode that followed
  the system would pin every Watch permanently to its night slot and present that as a feature. This
  is a platform fact, not a decision.
* **`switch: "schedule"` was dropped, and that *is* a decision.** It needs two time pickers on a
  screen two inches across, a stored `holdAuto` so a manual flip survives until the automation next
  changes its mind, and `settleHold` run on every occasion the app wakes — for a preference somebody
  changes by looking at their wrist and deciding they would rather it were dark. If it is ever
  wanted here, the place to put it is the phone's device record and it is a different round.

**One control does two jobs and that is the design, not a shortcut.** The Day/Night buttons choose
which slot is *on* and simultaneously choose which slot the list below is editing. Both slots stay
reachable in one extra tap, and the row you press is the thing that happens, immediately, on the
screen you are standing on. Showing somebody a kit they are not currently looking at while they
choose it is the worse trade on a screen this size.

Both leans are offered in both slots, which is the web's own rule — "any theme, light or dark: the
slot is about *when*, not *what*". What the ordering does is put the eight kits designed for the
current slot first, which on a crown is the whole of the affordance.

### It hangs off the long press, and that cost Start again a tap

The count was already this app's one long-press surface, and it held Start again. It now opens a
two-row sheet: Start again, and Theme. **A gesture that used to do a thing and now opens a menu is a
small regression for the person who had learned it**, and it is named here rather than left to be
discovered. The alternative the plan allowed — a third page — would have cost Today a swipe every
time anybody scrolls, forever, to reach a screen they will open twice a year.

**It also fixed something that would otherwise have shipped as a bug.** The old hold was gated on
`store.canEdit`, so a view-only list had no long press at all. Once the theme lives behind that
gesture, a person whose only list is shared read-only could never have changed their Watch's theme —
and a theme is not a property of the list. The hold is ungated now and *Start again* is the row that
is disabled.

### Stored in the App Group, and that is not where the other Watch preference lives

`UserDefaults(suiteName: "group.com.pricebrannen.todaysfive")`, three keys under `tf/app/watch/kit/`.
Deliberately unlike `WatchLinkReceiver`'s selected-list key, which is in `.standard` **because** it
is a secret. A kit id is not a secret: `theme.js` ships all eighteen to every browser, and the two
Secret kits are withheld from a wrist as a product rule rather than a cryptographic one. The
complication is another process and has to be able to see the theme; `.standard` is invisible to it.

**Verified across a cold launch**, which is the only way to verify persistence at all:

```
launch A  -TFThemeSet day:harbor
  theme: slot=day day=harbor night=terminal → kit=harbor pair=manrope base=light unlocked=0 offered=16
launch B  (no argument)
  theme: slot=day day=harbor night=terminal → kit=harbor pair=manrope base=light unlocked=0 offered=16
```

`-TFThemeSet` calls `show(_:)` and `choose(_:for:)` — the identical two methods the picker's buttons
call, not a copy of them — so what the two launches prove about the store is true of the picker.
It exists because `simctl` cannot tap a watch simulator: there is no `simctl ui tap` and no
accessibility bridge, so nothing can press a row and then relaunch to see whether it stuck.

---

### The volley, and the one number that had to move

Every constant in `ConfettiField` is `fx.js`'s, read across rather than invented: gravity `0.30`,
drag `0.992` on both axes, seven bursts of 26 at `w * (0.08 + 0.14i)`, `h * 0.97`, power 19, spread
1.15, fired `i * 65` ms apart, then one of 40 at `w/2`, `h * 0.6`, power 14, spread 2.6, at 210 ms.
222 particles. `life` from 1 decaying `0.0075 + rand * 0.008` a frame, alpha `life * 1.7` clamped,
`rib` on 45% of pieces and its flutter `h * |cos(r * 1.7)|`. The four shapes are ported curve for
curve.

**Exactly one thing was rescaled, and the alternative would have broken something that matters.**
`fx.js`'s speeds are in browser pixels. A piece launched at 19 px/frame against 0.30 px/frame² of
gravity reaches its apex `19² / (2 × 0.30) = 601` px up; on a 208×248 pt watch screen that is two
and a half screens, so the whole volley would leave through the top on frame one and the screen
would be empty for a second and a half before anything came back.

The port scales **every length by one factor** — positions, velocities, gravity and particle sizes
alike — and scales nothing else. `k = height / 800`, 800 being a browser viewport's working height;
on this simulator **k = 0.310**. That is the only rescaling that leaves the choreography alone: an
apex is `v² / 2g`, so multiplying `v` and `g` by the same `k` multiplies the apex by `k` and leaves
every *time* exactly where `fx.js` put it.

**Why the times had to be left alone.** The obvious alternative — keep the speeds, shrink gravity —
changes the timing, and the volley's timing is the half of it `WatchHaptics` is already playing:
seven `WKInterfaceDevice.play(.click)` 65 ms apart and the chord at 700. Those two must not drift
apart, and a scale factor that touches only lengths is the one guarantee that they cannot.

Measured piece sizes at k = 0.310: ribbons **0.93–2.48 pt wide by 1.86–5.27 pt tall**, polygons
**1.55–3.41 pt** across. On a 2× panel that is 2–11 device pixels, which is what the finale
screenshots show and is the same fraction of the screen the web's are of a browser's.

### It ends, and the mechanism for ending is the whole point

A `TimelineView` has no "stop". Left mounted it holds a redraw source open on a live screen for as
long as the app is in front, which on a watch is a battery bug with no symptom. So `ConfettiField`
reports `isAlive`, the view clears the binding when it goes false, and the parent removes it.
**Measured: the field is empty at frame 147** — 2.45 s, and `1 / 0.0075` = 133 frames is the slowest
possible decay, so 147 is the arithmetic and not a guess. The same number for all eighteen kits.

### Always-On is not gated, on purpose

`AnimationTimelineSchedule.entries(from:mode:)` returns **zero entries** in `.lowFrequency`, so
`TimelineView(.animation)` parks itself the moment the wrist drops. An `isLuminanceReduced` check
would be a second mechanism doing the same job, and the failure mode of two mechanisms is that one
of them is wrong. (A hand-rolled `PeriodicTimelineSchedule` would **not** self-park — it ignores the
mode and keeps ticking. That is the trap and this is not one.)

**The haptic half did not change and the code goes on saying why.** `CoreHaptics` is still absent
from the watchOS SDK. Sound stays out.

### 222 particles at 51–53 frames a second

```
[tfive] watch selftest: 10 confetti: run=1 frames=132 over 2.49s = 52.6/s
[tfive] watch selftest: 10 confetti: run=1 frames=128 over 2.48s = 51.1/s
```

Two runs. The plan's checkpoint had rendered 180; this is 222 and the simulator holds ~52 Hz, which
is what a `Canvas` doing 222 rotate-and-fill operations per frame costs on this runtime. The field
is rebuilt from its seed on every frame rather than held in state — a `Canvas` closure cannot mutate
view state and a `TimelineView` may draw the same date twice — so the arithmetic per frame is up to
147 steps of 222 particles, and that is what those numbers already include.

**The field is deterministic from a seed** (SplitMix64), which is what makes eighteen screenshots of
the same volley worth comparing: they differ in colour and shape and in nothing else.

---

### `Kit.shapes` could not say what `fx.js` needs it to say, and now it does

**This is the round's one real defect, Track C is the first thing in the project that could have
found it, and it was fixed at the source at integration rather than worked around.**

`fx.js` reads a kit's `shapes` as **either** a count — v1's meaning, 1 ribbons, 2 ribbons and
hearts, 3 ribbons hearts and stars — **or**, since 1.6, a list to draw from: 0 ribbon, 1 heart,
2 star, 3 sparkle, 4 sprinkle. The two readings of the same value disagree completely. As a count,
`1` is ribbons only. As a list, `1` is *hearts* only.

The loss happened at the fixture, in one expression:

```js
shapes: Array.isArray(t.shapes) ? t.shapes : [t.shapes]        // before
```

A number and a one-element array are the same value by the time the fixture is written, so `KitsGen`
could not emit the difference and `Kit(json:)` could not read it. A **union type flattened at a
boundary** — and nothing downstream said so, because nothing downstream had ever drawn a particle.
It read **fifteen of the eighteen kits as hearts-only**.

Track C first recovered it with a rule (`fx.js`'s count vocabulary stops at 3, so a one-element
`[n]` with `n` in 1…3 was a count), which was right for all eighteen kits and had a real argument
behind it. But it left a residue — a kit that one day wrote `shapes: [2]` *as a list* would be drawn
as a count — and it put a heuristic in a renderer to compensate for a lossy generator. So at
integration the generator was fixed instead:

```js
shapes: Array.isArray(t.shapes) ? t.shapes : Array.from({ length: t.shapes || 1 }, (_, i) => i)
```

A count is **resolved** rather than wrapped, which is exactly what `fx.js`'s `shapeOf()` does with
it: `n` draws uniformly from `0 … n-1`, and its `n === 2` special case (0 or 1, evenly) is that same
uniform draw written out. So `shapes` now means one thing everywhere — the list of indices to draw
from — the fifteen kits read `[0]` instead of `[1]`, and `ConfettiField.readsAsList` and its
`listSemantics` flag are deleted rather than documented.

The self-test still walks every kit and prints what each drew, because it is the single thing about
the port a reader cannot check by looking at the screen:

```
dark:      shapes=[0]       → drew [0]        · palette=5 · ends at frame 147
sunset:    shapes=[0, 1]    → drew [0, 1]     · palette=5 · ends at frame 147
pink:      shapes=[0, 1, 2] → drew [0, 1, 2]  · palette=6 · ends at frame 147
superpink: shapes=[1, 2, 3] → drew [1, 2, 3]  · palette=6 · ends at frame 147
birthday:  shapes=[4]       → drew [4]        · palette=6 · ends at frame 147
```

Birthday is the one that proves the union was real: `[4]` as a count would have thrown ribbons,
hearts, stars and sparkles; as the list it is, it throws hundreds-and-thousands and nothing else,
which is what `apple/shots/watch/finale-birthday.png` shows.

**How to apply:** when a generator normalises a union, check that the normal form can still express
both arms. `[t.shapes]` looked like a widening and was a narrowing, and the only reason it was ever
caught is that something finally consumed the field.

---

### The complication can have the kit's type. It can never have its accent.

**This was the round's one brief line that could not be delivered as written, and it is written down
here rather than discovered by somebody later.**

`WidgetRenderingMode.accented` — the mode every watchOS complication is drawn in on the great
majority of faces — says in its own words that the system

> treats the widget's views as if they were template images. It replaces the view's color —
> rendering the new colors while preserving the view's alpha channel.

The colour that replaces it is the one the wearer chose in the **face editor**. The escape hatch that
exists on the phone, `WidgetAccentedRenderingMode.fullColor`, is documented in one sentence: *"Only
applies to iOS."* There is no watchOS equivalent, no opt-out and no entitlement. A view's **shape**
crosses to the face; its **colour** does not. `.widgetAccentable()` does not add a colour either — it
moves a subview from the face's neutral group into the face's accent group, and both of those groups
are the face's.

### Observed, not trusted

`-TFFaceProbe` renders a rectangle filled in the kit's accent, with a mark in the kit's danger colour
on top of it, through `ImageRenderer` twice — once at `.fullColor`, once at `.accented` — and reads
two pixels back out of each. Two pixels rather than one, because a mode that flattened everything to
a single colour and a mode that changed nothing both leave one pixel looking plausible.

```
face probe: accent asked for #4AF07A
face probe: fullColor  corner=#4AF07A@255 centre=#FF6B57@255
face probe: accented   corner=#4AF07A@255 centre=#FF6B57@255
face probe: the two renderings are IDENTICAL
```

Repeated on a second kit (`#0F8C8C`): identical again.

**What that rules out is the cheerful hypothesis.** If `.accented` were a SwiftUI-side treatment, an
`ImageRenderer` handed the environment value would show it, and an app could see it coming and
compensate. It is not: SwiftUI passes the colours through untouched, which means the flattening is
done by the widget host at composite time, and is therefore not reachable, not overridable, and not
visible to any test that does not involve a watch face and a finger.

### What was built instead

| the **type**            | the count is set in the kit's own ui face, by PostScript name              |
| **gauge or text**       | a monospaced pair gets the numbers; every other pair gets the ring         |
| the **glyph**           | a finished list puts a check in the middle of a full ring                  |
| **`.widgetAccentable`** | the count is accented; anybody's words are not                            |

The gauge-vs-text choice is worth naming as a choice. Nothing in the SDK says a mono kit should
prefer text, and a ring is the better glance for most people most of the time. It is the one
structural thing a kit can change on a face at all, and spending it on the pair whose whole identity
is setting numbers in a grid is more interesting than spending it on nothing.

**A per-kit glyph was considered and rejected.** It would need an id-to-symbol table inside the
appex: eighteen rows of design decision with nothing generating it, nothing checking it, and nothing
to notice when a nineteenth kit is added. The extension does not link `TodaysFiveCore` and must not
grow a hand-written copy of a table that lives somewhere else. `pair` is the one kit-shaped input it
can act on without one.

### The theme reaches the face additively, with `v` left at 1

`WatchSnapshot` grew `kit`, `pair` and `face`. `read()` already defaults every field it cannot find,
so an old extension reading a new snapshot gets `kit: ""` and draws the way it always did, and a new
extension reading an old snapshot gets the same. **Bumping `version` would have turned the first of
those into a refusal** — the face would have dropped to its placeholder — in order to announce a
field that older code does not read. That is `COMPATIBILITY.md` §3's rule applied to a file rather
than to the wire, and it is the whole reason the rule exists.

`face` carries a PostScript name because **`pair` alone is not actionable in the extension**: mapping
`"lato"` to `"Lato-Black"` needs the generated table, the extension does not link `TodaysFiveCore`,
and a hand-written copy of that mapping in the appex is precisely the second copy of generated data
`KitsGen` exists to prevent. `pair` still travels — it is what a log and a person diffing two
snapshots want — but `face` is what draws.

### The redraw is `publish()`, and there is no second door

`publish()` writes the snapshot and calls `WidgetCenter.shared.reloadAllTimelines()` in the same
breath, so routing a theme change through it is the entire mechanism that makes the face redraw on
the change rather than at its next reload. Verified end to end, on a slot flip through `show(_:)` —
the picker's own call:

```
watch selftest: 11 theme change: harbor/Manrope-ExtraLight-800 → terminal/IBMPlexMono-SemiBold changed=true
```

### The appex needs no fonts of its own, and the plan's premise was wrong in a checkable way

The plan budgeted **1.5 MB and 26 hand edits** to duplicate the 33 faces into the extension, on the
grounds that "the appex is a separate bundle with its own Info.plist and its own Resources phase, so
the Watch app's fonts are NOT visible to it". The first half is true and was verified on the built
product — **33 `.ttf` in `TodaysFiveWatch.app`, zero in `PlugIns/TodaysFiveComplications.appex`**.
The second half does not follow:

```
TodaysFiveWatch.app/                 ← the 33 .ttf are here
  PlugIns/
    TodaysFiveComplications.appex/   ← Bundle.main, inside the extension
```

An extension's bundle is *inside* its containing app's bundle. Two `deletingLastPathComponent()` and
the fonts are right there, in the same signed container, readable.
`CTFontManagerRegisterFontsForURLs(_:.process:_:)` makes them resolvable for the life of the
process, which is exactly as long as a widget rendering lasts. **No copy, no `UIAppFonts` entry, no
second Resources phase, and nothing for the orchestrator to register.**

Verified from the Watch app, against the extension's own bundle URL so the arithmetic under test is
the extension's arithmetic and not a re-derivation of it:

```
face probe: appex=TodaysFiveComplications.appex ttfInAppex=0 fontsRoot=TodaysFiveWatch.app
            facesOnDisk=33 registered=33 wantedFaceOnDisk=true
```

`facesOnDisk` is read with `CTFontManagerCreateFontDescriptorsFromURL`, not with
`CTFontCreateWithName`, and the distinction is the point: inside the app all 33 are already
registered by `UIAppFonts`, so a resolution check would answer yes whether or not the path worked.
Opening the file at the computed URL and reading its name back takes the app's own registration out
of the answer.

**What could not be observed** is a complication actually drawing on a face. That needs the face
editor, and `simctl` cannot tap a watch simulator. So the extension asks for the face and **falls
back to the system font when it does not resolve** — which costs nothing if the last link turns out
to be closed, and is why this shipped rather than being deferred.

---

### The eighteen screenshots, and how the two Secret ones got there

`apple/shots/watch/today-<kit id>.png`, all eighteen, each launched under `-TFKit <id>`. Filenames
are kit ids, which are not the word that unlocks anything and were never typed by a person.

The Secret pair reached the wrist the way it will in the field: as JSON under `tf/app/watch/kits` in
the App Group — the key `WatchLinkReceiver` writes and `WatchThemeStore` reads — after which
`-TFKit superpink` resolves like any other id and the picker offers eighteen instead of sixteen.

**The injection took two goes and the failure is worth recording.** `xcrun simctl spawn <udid>
defaults write group.com.pricebrannen.todaysfive …` appears to work — `defaults read` reads it back
— and the app does not see it. There are **two plists with the same name** on a booted simulator:

```
<data>/Library/Preferences/group.com.pricebrannen.todaysfive.plist                      ← simctl spawn writes here
<data>/Containers/Shared/AppGroup/<id>/Library/Preferences/group.…todaysfive.plist      ← the app reads here
```

`UserDefaults(suiteName:)` resolves to the group *container*; a spawned process is not a member of
the group, so its `defaults` lands in the device's own domain. `plutil -replace` straight into the
group container's plist works, and the confirmation is `unlocked=2 offered=18` in the theme line.

Also photographed: the two screens behind the long press, which had never been photographed because
they are behind a gesture, and four finales. Those last are frozen at 0.55 s by `-TFFinaleHold`,
because **a screenshot of an animation is otherwise a coin toss** and eighteen of them would be
eighteen tosses. Held, every kit is photographed at the same instant of the same deterministic field.

---

### What eighteen screenshots found that three could not

Stage 1 photographed dark, paper and terminal, fixed the carousel's row platter to the kit's own
`ink2`, and moved on. **Eighteen frames show that the platter was only half the problem.**

`.listStyle(.carousel)` composites its own treatment onto a row as that row leaves the focus band,
*over* whatever `.listRowBackground` put there. Measured at the same three points on six frames:

| kit | ground | platter in focus (kit's `ink2`) | the row leaving focus |
| --- | --- | --- | --- |
| sketch | `#F8F6F1` | `#EFECE5` | **`#807F7B`** |
| paper | `#F7F2E8` | `#EFE8DA` | **`#807C75`** |
| light | `#FAF8F4` | `#F1ECE3` | **`#817F7A`** |
| birthday | `#FFF3F8` | `#FDE9F2` | **`#80767B`** |
| dark | `#070A08` | `#0E140F` | `#080B08` |
| terminal | `#070A08` | `#0E140F` | `#080B08` |

The in-focus platters are the kit's, exactly — stage 1's fix works. The row on its way out lands at
**about 50% grey on every light kit**, which is a grey slab across the foot of a cream screen, and on
a dark kit is indistinguishable from the ground. It is the same failure stage 1 fixed one layer up:
a system treatment tuned for a platform that is always dark, applied over a kit that is not.

**It is not fixed here and the reason is that the fix is a bigger decision than it looks.**
`.listStyle(.carousel)` has no API for the out-of-focus treatment — no modifier, no environment
value, nothing on the row. Escaping it means leaving `.carousel`, which is the scroll behaviour the
whole Watch app is built around: rows that snap, grow into focus and give the crown something to
land on. Trading that for a flat list to get rid of a grey band is a product decision and belongs to
somebody who has held the thing.

What it is worth on its own is the method: **a three-kit smoke test cannot find a bug that only
light kits have, and six of the eighteen kits are light.** The screenshots were asked for as
evidence and turned out to be a test.

---

### What stage 2 did not settle

* **A complication has still never been seen on a face.** Everything about the extension that can be
  checked without tapping a watch has been; the face editor cannot be reached at all. Whether a
  custom face renders under the widget host, and what `.accented` does to it there, remain open, and
  the fallback to the system font is the answer to both being no.
* **Always-On was still not rendered.** `simctl` cannot put a watch simulator into luminance-reduced
  mode and there is no launch argument for it. The confetti's Always-On behaviour rests on
  `AnimationTimelineSchedule` returning zero entries in `.lowFrequency`, which was measured, and not
  on a screenshot of a dimmed screen, which does not exist.
* **The picker was never touched by a finger.** `-TFThemeSet` calls the picker's own two store
  methods and `-TFShow theme` puts the picker on screen to be photographed, but no gesture on this
  machine has ever pressed one of its rows. The crown scroll, the hit targets and whether eighteen
  rows is too many to get through are wrist questions.
* **The carousel's out-of-focus grey is still there on every light kit.** Measured above, no API to
  reach it, and the only escape is leaving `.listStyle(.carousel)` — which is a bigger trade than
  this round should make on its own.
* **`Kit.shapes` is still a flattened union.** Read correctly here, by a rule with an argument behind
  it; not fixed at the source, which is Track B's fixture and Track B's generator.

## Integration — what only the device build could say

### A watchOS device has a 32-bit `Int`, and the archive is the only thing that knows

The confetti's seed mixed the run index with Knuth's golden-ratio constant:

```swift
UInt64(bitPattern: Int64(run &* 2_654_435_761))       // run is Int
```

Every simulator in this project is 64-bit, so `swift test`, both `xcodebuild` simulator builds and
four self-tests on a booted watch all took it without a murmur. `xcodebuild archive` for
`generic/platform=iOS` — which builds the embedded watch app for a real device — refused it outright:

```
error: integer literal '2654435761' overflows when stored into 'Int'
```

**A watchOS device is `arm64_32`: 64-bit registers, 32-bit pointers, and therefore a 32-bit `Int`.**
`0x9E3779B1` is larger than `Int32.max`, so the expression is not a runtime overflow that a test
might miss — it does not compile for the target at all. Fixed by doing the multiply in `UInt64`
explicitly.

The whole of `apple/` was then swept for integer literals above `Int32.max`, and the other five are
all safe for a reason rather than by luck: `9007199254740992.0` is a `Double` literal, `Document.swift`'s
three are `Double` arithmetic inside `toInt32()`, and `JSONValue.swift`'s is compared against a
`UInt64`.

**How to apply:** a green simulator run says nothing about `Int` width on a watch. The device
archive is not just the last step before Organizer — for a watchOS target it is a *compiler* pass
that nothing else in the loop performs, so run it before believing a round is finished.

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


---

# Phase 5 — the wrist, from a real wrist

Every round before this one was verified on a simulator. This one began with four findings from a real
Apple Watch, and two of them were features that looked present and did nothing.

**The round's discipline, and it is the reason this section reads the way it does: every claim names
the instrument that measured it and what that instrument cannot see.** The simulator had already lied
to this project twice — once about dictation, on a machine with no microphone, and once about a 32-bit
`Int` — and this round caught itself doing the same thing three more times before it finished. Those
three are written up rather than tidied away, because each of them is the same lesson arriving from a
new direction and the pattern is worth more than any one of them.

Four tracks in worktrees, each read by an independent reviewer who owed it no deference, each repaired
against what that reader found. What follows is each track's own entries, then integration's.


## Track A — add-by-voice
### The five-second Undo window belongs to the coordinator, not to a view

Phase 5 moved `AddFlowView` out of `.sheet(isPresented: $showAdd)` and into Today's `List`. The
countdown moved with it, and it should not have: it was a `.task(id: pending.id)` on the confirmation
view, which is safe only while that view is presented content. `RootView.content` is an `if/else`
ViewBuilder — empty state, else `AlwaysOnTodayView` when `isLuminanceReduced`, else the `TabView` — and
switching branches destroys the other branch's views and cancels their tasks. Lowering the wrist inside
five seconds, which is the ordinary gesture after adding a line, therefore cancelled the window with
`AddCoordinator.pending` still set. An hour later Today drew a live Undo for an hour-old line, and
pressing it tombstoned that line. The App Intent had the same hole from the other end: it calls `note`
with no view anywhere, so Siri's adds never had a window at all.

The window is now a `Task` on the `AddCoordinator` singleton, which nothing tears down. It is also
*arithmetic*: `Pending` carries the moment it was made, the view draws the confirmation only while
`isLive()`, and an `onAppear` sweep clears an expired one. That second half is not belt-and-braces
fussiness — a watch app is suspended seconds after a wrist drops, and what the runtime does with the
remainder of a `Task.sleep` across a suspend-resume is not something any instrument on this machine can
measure. Where the timing cannot be trusted, the timestamp can.

Cost: two extra checks in `-TFAddSelfTest`, one of which sleeps five real seconds, and one sentence on
Today for those five seconds during a self-test launch.

**How to apply:** a countdown that decides whether a *destructive* control is live must not be scoped to
a view, and "it worked in the sheet" is not evidence it works in a row. Ask what happens to the timer
when the wrist drops — on this platform that question has a different answer for every kind of
container, and the wrong answer is silent.

### An instrument whose only witness is a mechanism you cannot test is not yet an instrument

On the shipping path, `add.tap` is written from `configuration.isPressed` on a `ButtonStyle` applied to
a `TextFieldLink`. Nothing here can press a watch control, so if that mechanism does not fire, a wrist
reporting `asked 0` reads identically to a wrist where nobody pressed anything — and `asked 0 · heard 0`
was the exact failure signature this round predicted. One mechanism carrying the whole question is the
same shape as Phase 3's `visibleInterfaceController=present`.

So the question was split. `add.style` is written from the style's own `onAppear`, which can only run if
watchOS called `makeBody` and mounted its result — that is the same as saying the custom style is
honoured. Measured on the watch simulator: `add.style` at +69 ms on a plain launch. What remains
unmeasured is only whether `isPressed` toggles, and that is separated by *looking* rather than by the
trace: a press that reaches this style fades the row to 0.55 while the finger is down.

Rejected: a `.simultaneousGesture` or `.onTapGesture` to catch the press directly. A second recogniser
competing with the control's own risks the one thing this round may not ship — a control that looks
right and does not activate — on a device nobody here can test. An observer that cannot interfere,
answering a smaller question, beats a reporter that might break the thing it reports on.

**How to apply:** when one signal carries a whole finding and you cannot exercise it, add a second signal
that asks a *narrower* question you can exercise, and write down which of the two answers each reading
admits. Do not add a second signal that is also untested — that is two guesses, not a cross-check.

### Four trace rows and a whole outcome cannot happen on a wrist, and the files now say so

`WatchDictation.Gate`, the 60-second deadline, `AddOutcome.inputTimedOut` and the rows `add.present`,
`add.presented`, `add.nopresenter` and `add.timeout` are reachable only through the WatchKit seam, and
`WatchDictation.preferred` never selects it unless something wrote `tf/app/watch/addinput` — which
nothing in a shipping build does. The gate is a genuine repair of Phase 3's one-way latch and it is
tested; it is *not* part of what a wrist exercises, and the earlier write-up counted it among the fixes
and asked Price to check the timeout sentence on his wrist, which he cannot produce. The Diagnostics
screen's `presented 0` and `timed out 0` are health, not findings.

The statement that survives is narrower and blunter: on the shipping path there is no latch because
nothing is presented.

**How to apply:** unreachable-in-Release code is not a bug, but describing it as a fix is. Every seam
kept for a future flip should name, in its own file, the exact condition that would make it live — and
anything the seam writes into a shared instrument should say it will read zero.

### A cap can only be checked by going past it

The first version of the ring check asserted `all.count <= limit && all.count >= nService` against a
trace holding about eleven rows with a cap of sixty: 11 ≤ 60 and 11 ≥ 4, both true by construction.
Deleting the eviction line from `WatchDiagnostics.record` altogether left it printing `ok`, which was
measured, not reasoned. It now writes `limit + 5` rows — five of one code, then `limit` of another — and
asks two questions: is the count exactly `limit`, and is what survived the *newest* end. With the
eviction line removed it prints `trace-ring FAILED wrote=65 entries=65 cap=60 oldest-evicted=false`.

It runs last and clears afterwards, because it floods the ring on purpose.

**How to apply:** a check on a bound must cross the bound. If the assertion is satisfied by the state the
test happens to be in, it is a sentence, not a check — and the way to know which you have written is to
break the thing and watch it fail.

### The complication opens the app on Today; it did not put Today at the top

`onOpenURL` did `page = .today` and nothing more, and "from the face the cost is one tap" was stated as
fact. A resumed watch app comes back with the scroll offset it had, so a list left showing line five had
the add control — the second row, above the lines — off screen, and the true cost was a crown turn plus
a tap. The complication now bumps `AddCoordinator.focusTick` and Today's `List` answers with
`ScrollPosition.scrollTo(edge: .top)`. Nothing else writes it, so a person's own crown is never
overridden.

What that is worth is limited and should be read that way: `simctl openurl` on a watch simulator fails
outright (LSApplicationWorkspaceErrorDomain code 115), so `todaysfive://add` cannot be delivered on this
machine at all. Neither the scroll nor the `add.face` row has been exercised by any instrument in this
round.

**How to apply:** "the control is on screen" is a claim about scroll state, not about view order, and on
a watch the scroll state outlives the app being in front.

### Two paragraphs in this file are now false, and this section does not fix them by itself

The branch reverses a decision recorded here, and this file is not on the branch — the orchestrator
integrates it, which is why nothing above edited it. Until the two passages below are amended, a reader
who comes here looking for the flip finds Phase 3's superseded reasoning:

* **line 669**, in *No API forces dictation…*: "falls back to `TextFieldLink` if that is ever nil" — the
  precedence is now the reverse, and `TextFieldLink` is not a fallback but the path;
* **line 884**, at the end of the Phase 3 self-test entry: "`visibleInterfaceController=present`, so the
  wrist takes the WatchKit dictation path rather than the `TextFieldLink` fallback" — this is the exact
  over-read Phase 5 exists to correct, and leaving it unmarked is how it gets cited again.

The replacement wording is in this round's `patchSpec`.

**How to apply:** already written down in this file and worth repeating: a stale paragraph beside correct
code is worse than no paragraph. A round that reverses a decision owes the reversal to the place the
decision is kept, not only to the round's own results.
## Track B — the list picker
### A control that refuses must still leave a line, or the trace it writes is not evidence

Phase 5 §2's fail criterion is "no `picker.title.tap` after a press ⇒ the navigation bar is not hit-testable". The caret came off the title and `.disabled(store.links.count < 2)` was left on it. The caret had been the guard: while it was drawn you knew the button was enabled and the wrist held two lists, so a press that recorded nothing could only be the bar. Remove the caret, keep the disable, and a wrist holding one list — a link removed on the phone, or a payload that has not landed — presses a control SwiftUI declines, reads `title tap  0`, and the conclusion is about watchOS when the truth is "this file asked SwiftUI to ignore it". The disable is gone. The cost is that a one-list wrist can open a picker with one row in it: a true screen, and not a press anybody makes by accident on a title that no longer looks like a control.

The same shape sat in `WatchStore.select`: `guard id != openId else { return }`, silent, on the most reachable tap in the picker — the row that already has the tick. The trace read `picker.shown 2 3` and then nothing, and under this round's own rules the *absence* of a line is unclassified, with "the Button never fired" as its nearest reading. Every path out of `select` now writes something.

**How to apply:** when a diagnostic's conclusion is drawn from an event being *absent*, the absence is only evidence if every path that could have produced the event is known to write one. Audit the guards and the modifiers between the finger and the recorder — `.disabled`, `.allowsHitTesting`, an early `return` — before trusting a zero. A zero on a screen is a claim about the world, and a control that refuses in silence makes it a false one.

### `picker.already` rather than a `picker.selected` with `b` of 1

The review's suggested repair was `record(listSelected, canEdit ? 1 : 0, 1)` on the already-open path. That closes the silence, and it spends the one reading that matters: `picker.selected` with `b` of 1 means *a list changed*, and reusing it for "you pressed the list you are already on" makes a real switch and a no-op the same row. So the no-op got its own code — `a` the edit flag, `b` how many lists the Watch holds — which is the one edit a track may make to `WatchDiagnostics.swift` and is worth the line in the vocabulary a person reads.

**How to apply:** when an event code would need a second meaning to cover a new outcome, add the code instead. A vocabulary where one line means two things costs a reader more than a longer list does.

### One name for one list, and the open one is named by its document

`store.title` prefers the document's name; `ListPickerView.name(of:)` read `VaultedLink.name`, which is whatever the phone's registry last sent. Rename a list on a laptop, let the Watch pull the document, and Today's new row said *Groceries* while the picker's row for that same list, one push away, said *Errands* — or *Untitled list*, which is the case that fallback exists for. `name(of:)` now returns `store.title` for the list that is open, so all three places are one expression, last resort included. Rows for lists that are *not* open still carry the registry's name: their documents are on disk, and a row builder on a watch is not the place to read five of them. The row is picked by `store.selected` rather than `openId` because that is the field the tick is drawn from six lines above — the name and the tick must not be two opinions about which list you are on.

**How to apply:** two views that name the same object must read one expression, not two rules that agree today. Where a rule has to differ, differ on something the reader can see (here: the list you are on has a document loaded, the others do not) and say so where it is written.

### `.onAppear` says the view was inserted; it does not say anything was drawn

`picker.shown` was written up as "the picker **actually presented** … this fires when the view is on screen". `.onAppear` fires when SwiftUI inserts the view into the hierarchy. A view inserted behind a failed presentation would fire it, and no hook in this SDK can tell the difference. The weaker true statement — the content closure was evaluated and the view was inserted — still separates "the press never arrived" from "the press arrived and the sheet did not come up", which is the whole job. So the hook stayed and the sentence changed.

Two neighbours got the same treatment. The wrist's caret-and-no-response was written into two source comments as established fact; it is Price's report, and both now say so in the line that carries it. And "a `List` row is the most reliably tappable thing watchOS has" is an argument from every control in this app that is known to work, not a measured fact about watchOS hit-testing — nothing in this round has tapped the new rows either.

**How to apply:** write the claim the hook can support, then check that the weaker claim still does the job. It usually does, and a comment that overstates its instrument is the same failure as a test that passes for the wrong reason — Phase 5 has two of those in its history already.

### A sentence about ordering, withdrawn rather than defended

A docstring said every local change "persists it inside the actor before this method can be called". It does not: `apply(local: true)` calls `chain`, which *enqueues* a `Task`, and `SyncEngine.persist()` runs inside it, while `openList` reads `store?.load(id)` synchronously. What `chain` does give is ordering — the old engine's `update` and `push` complete before the new engine's `open`. What makes a pending write safe is that `persist()` goes through `ListStore.merge`, a CRDT merge rather than an overwrite (`Store.swift:91`), and that `sync()` compares `doc.canon` before and after and declines a read that predates an edit. Nothing in this round raced them, so the comment now says it is reading and the race is on the unverified list.

**How to apply:** a claim of the form "X has already happened by the time Y runs" is a claim about a schedule, and an enqueued `Task` is not a schedule. Either measure it or describe the invariant that makes the order not matter.

### A step number is part of the instrument

The new self-test step was numbered 10, and `WatchApp.swift` prints a 10 (confetti) and an 11 (theme) after `runSelfTest` returns. Three steps answering to "10" in output a person greps to decide pass or fail, and a step that silently failed to print is invisible while another 10 is there. It is 12 now, so the console reads 1–9, 12, 10–11. Out of order beats ambiguous; renumbering the other two is a region this track does not own, so it is offered to the orchestrator as a patch instead.

**How to apply:** numbered output is an index, and an index with duplicates is worse than one with gaps. When the fix crosses an ownership line, take the gap and hand over the patch.

### A test count is not coverage, and the test should say whose code it cannot see

`swift test` went from 130 to 131 and the new test cannot reach one line this round changed: `apple/TodaysFiveCore/Package.swift:21` gives the test target `TodaysFiveCore` and nothing else, while every changed file lives in the `TodaysFiveWatch` Xcode target. The test compiles and passes byte-identically on the branch this one came from. It was kept — it is the regression guard for the property the new controls lean on, that a switch onto a view link lands on a view link with its mode intact and the core still refuses the write — and its docstring now states plainly what it cannot do and names the only instrument that can.

**How to apply:** when a suite cannot reach the target you changed, say so in the test, next to the assertions, where the next reader will be standing. A number at the bottom of a test run is read as coverage whether or not it is, and the correction has to live where the misreading happens.
## Track C — the complications
### A size that cannot grow is not a size, and a floor that only shrinks it is worse

Phase 5's first pass at the rectangular complication replaced `.font(.system(.body, design: .rounded))` with `.font(.system(size: 13, design: .rounded)).minimumScaleFactor(0.75)`, to pin a number a macOS probe had measured. Both halves were wrong on a wrist, and a review that had not written the code found both.

`Font.system(size:)` is a **fixed-size** font. `Font.system(.body)` is not. So the line a wearer has to go into the face editor and switch on became the one thing on the complication that did not respond to Watch > Settings > Display & Brightness > Text Size — while the count beside it, still `relativeTo: .headline`, did. The file's own comment had it exactly inverted: it called the count "the one thing here small enough to grow". The line is the part a low-vision wearer needs to grow.

And the floor made it smaller. Measured on the probe: with `minimumScaleFactor(0.75)` an 86-character line came back as three ink bands whose text glyphs were **8.75 pt** tall; with the floor gone, two bands and a **12.00 pt** glyph band. The second line was being bought with three points of glyph height, putting list text at 9.75 pt when watchOS's own smallest text style is about 13.

The repair is not a text style either, because a text style moves the number between the machine that measures and the wrist that shows: `.caption2` is about 11 pt here and about 13 there. Every size in the file is now a `@ScaledMetric` point value — the measured number at the default Text Size, scaled by the style beside it. `.custom(_:size:)` and `.system(size:)` are both fixed-size and `Font` has no `.system(size:relativeTo:)`, so one `@ScaledMetric` per size is the only arrangement that holds the measured number and the wearer's setting at the same time. Two exceptions are named rather than overlooked: the SF Symbols stay fixed, because an `Image` has no `minimumScaleFactor` to catch it if it grows past a slot a few points wide; and whether the widget host hands a complication the wearer's Text Size at all is not observable from here.

**How to apply:** `.system(size:)` and `.custom(_:size:)` are fixed-size fonts. Pinning a measured point value is right and dropping Dynamic Type to do it is not — `@ScaledMetric` gives you both, and `minimumScaleFactor` on a line of somebody's text buys characters with legibility, which on a watch is the wrong direction to trade.

### The fallback path was the one the measurement did not describe

`FaceType.count` took `size:` and `relativeTo:` and, when the kit's face did not resolve, returned `.system(style, design: .rounded, weight: .semibold)` — dropping the size entirely. So the 17 pt the corner's whole width argument rests on described the **custom-face** path, and the default path drew at the text style's own size.

Default is not an edge here. `WatchSnapshot.face` defaults to `""` and `WatchFaceType.resolves("")` is false, so every snapshot from a build older than Phase 4 takes it — and so does the one thing this round could never observe, a widget host refusing a custom face at render time. The round named that refusal as its open question and then published a size that would not apply if the answer came back no.

Both paths take the size now. Rendered on the fallback path in a 32 pt square: `3/5` inks 26.5 pt, `12/15` inks 30.2 pt with the scale floor doing the last of the work, `—` inks 17.0 pt.

**How to apply:** when a function has a documented fallback, check that the number in the write-up survives it. A measurement that describes only the branch you hope is taken is a measurement of the hope.

### `0/0` is the same sentence as the bare digit the round was replacing

The corner was changed because `Text("\(snapshot.done)")` put a number on a face with nothing to divide it by. A list that exists and has no lines — `hasList` true, `total` 0 — then got `0/0`, which is a denominator that carries exactly as little, and it is the state a brand-new list sits in before its first line is added.

The three families that spell the fraction out now read `glance`: the fraction when there is one, the em dash when there is not. The **bezel** is what tells the two silent states apart — *Today's Five* when no phone has named a list, *Nothing today* when one has and the day is empty. The circular family keeps `0` inside an empty ring for the same state, deliberately: there the ring **is** the denominator, so an unfilled ring around a zero is already the whole sentence. It is the families that write the denominator out that need the em dash.

`glance` lives in the extension, not in `WatchSnapshot.swift`, because it is a reading and not a wire format: that file's job is what two builds have to agree about forever, and this is what one extension chose to draw. No field was added and `v` stays 1.

**How to apply:** when you replace a reading because it says nothing, enumerate the states of the replacement. `done` with no `total` and `0/0` fail for the same reason, and the second one looks like it is working.

### Three claims the round published that no instrument backed

Written down because the round's discipline is that this is the expensive kind of mistake, not the embarrassing kind.

* *"Two things the pixels found that reading had not."* One thing. The circular family's `0`-should-be-`—` is a one-line `hasList` omission found by reading, and an accessory `Gauge` style draws nothing at all outside a widget context — so the view it lives in is in none of this round's pictures. Only the rectangular defect came off pixels, and the commit message said otherwise.
* *The bezel label is "at the largest type of anything this extension draws."* Nothing here measured the bezel label. The same file says plainly that no instrument in this project has ever drawn one. The privacy argument the sentence was supporting — a label with no opt-in in front of it holds strictly less than a family that has one — never needed a size, and now does not carry one.
* *The `Gauge` in `.widgetLabel` is "a three-point arc."* Its thickness and length are host compositing, which Phase 4 established is invisible to everything here: `ImageRenderer` at `.fullColor` and at `.accented` came back byte-identical. "A bare digit beside a mark that is not a reading" is the whole diagnosis and it needs no number.

**How to apply:** an invented number inside a correct argument is worse than no number, because it makes the argument checkable and then fails the check. When the mechanism carries the conclusion, delete the figure.

### Two character counts, retracted and re-measured, and a face nobody here can stop

The round published a 34-character line truncating at "17, 19 and 21 characters" before and reaching "27, 34 and 34" after. Both are withdrawn. The before column was not the `.body` render the probe made — SwiftUI resolves `.body` to about 13 pt on macOS, and 17/19/21 is exactly the **16 pt** column of today's advance-width table, i.e. a hand model of watchOS's `.body` printed in a column headed with the shipped code. The after column came off the renders that still had the 0.75 floor in them, so it was counting characters at 9.75 pt.

Two blind spots were behind it, and both are now written into the file:

* **this machine cannot see Dynamic Type at all.** Measured: `Text("Hxy").font(.system(.body))` and a `@ScaledMetric` 13 pt both draw an 11.75 pt glyph band at every `DynamicTypeSize` from `.large` to `.accessibility5`, because macOS has no Dynamic Type to set. So a probe here cannot tell a scaling font from a fixed one — which is exactly the defect it was being used to rule out;
* **`design: .rounded` is SF Pro Rounded here and SF Compact Rounded on a watch.** Measured off `/System/Library/Fonts/SFCompactRounded.ttf`: the same line is 194.6 pt in the first and 185.6 pt in the second at 13 pt. The wrist fits about 5% more, so the direction is safe and the numbers still do not transfer.

**How to apply:** before quoting a character count from a transcription, ask which font and which point size the transcription actually resolved. A stand-in is fine; a stand-in in a column headed "shipped" is a different claim from the one you measured.

### A figure in the plan, a figure in the sweep, and nothing between them

`apple/PLAN-apple-phase5.md` §3 gives `.accessoryRectangular` as "~72 × 32 pt, three short lines". This round swept 140×38, 160×44 and 176×50 and called it "my bracket, not Apple's figure" without ever naming the figure in its own brief. They cannot both be right.

Nothing here can settle it. The one measurement available is that the booted Series 11 46 mm's screen is **416×496 px, 208×248 pt** (a `simctl io screenshot`, which is the one thing `simctl` will do to a watch), so 72 pt is 35% of its width and 176 pt is 85%. At 13 pt the first holds about ten characters of a line and the second about 26.

The change survives either answer, which is why it shipped: at 72 pt the line fits 9 characters at 16 pt against 10-11 at 13, and the Dynamic Type repair is a gain at any width. But if 72 pt is the real one, then the opt-in line is two words and the reason for the opt-in is thinner than the round assumed. It is on the unverified list and it is the only item there a single screenshot of a face would settle.

**How to apply:** when your own sweep disagrees with the brief you were handed, say which two numbers disagree before you report either. "My bracket, not Apple's figure" is a sentence that sounds like reconciliation and performs none.

### The suite asserts bytes, and the views have no test target

`swift test` gained one assertion this round: every `.ttf` in `apple/TodaysFive/Fonts` carries the ten digits, `U+002F` and `U+2014`, read out of the files with `CTFontManagerCreateFontDescriptorsFromURL`. That is real and it is worth having — a latin subset that dropped the solidus would put a blank box on one kit's watch face and the first person to find out would be wearing it.

It is not coverage of this round's behaviour, and the write-up should not have been readable as though it were. `TodaysFiveCore` does not compile the appex, the appex has no test target, and giving it one means editing `project.pbxproj`, which is not a track's file. Reverting the corner's fraction, the text bezel label and the em dash leaves the suite green at 131/131. The detectors for those are a wrist and the unverified list. That is now said in the test's own doc comment, so the next reader finds the limit next to the assertion rather than in a report.

A grep-the-source test was considered and rejected: it would pass by matching text, fail on a rename nobody should fear, and teach the suite to assert about formatting.

**How to apply:** name what a new test does not cover in the same breath as what it does, especially when it is the only new test in a round that changed behaviour elsewhere.
## Track D — the unfocused window
### A channel's own opinion of itself, and the one number that can disagree with it

`alive()` asked the channel what it thought of itself. `channelAlive` asks a second question that does not
depend on the realtime client having noticed anything: has anything at all come the other way recently? The
evidence is free — the client has sent a phoenix heartbeat every 30 s since v3 and waited to be answered,
and `sync.js` had simply never looked at whether the answer came. `heartbeatCallback` stamps it, the channel
handle stamps its own join and every message on it, and the stamp is believed over the opinion. Three missed
beats is 95 s, which is inside one 240 s safety poll, so the first poll after the silence is the one that
finds it. Nothing new goes on the wire. A transport that cannot say when it last heard is believed exactly
as before, which is every transport but the real one.

**How to apply:** when a component's health check is the component's own self-report, look for a signal that
is already crossing the boundary for another reason. The cheapest independent witness is usually a
keep-alive somebody is already paying for and nobody is reading.

### What the tick is actually worth, narrowed twice, by two instruments

The round began with a hypothesis — the channel drops or is throttled and the client does not notice — and
four readings of the minified `vendor/realtime.js` supporting it. `tools/socketd.mjs` put the client on a
real phoenix socket and took three of the four away: a socket that answers nothing IS noticed and reported
as `CHANNEL_ERROR`; `removeChannel` on a joined channel closes it in the same tick so a rejoin needs no new
client (`reset()` deleted, before it could throw away the temporary channel `announceGone` holds); and after
a rude cut the client reconnects **and rejoins by itself**, re-firing `SUBSCRIBED` into `onState`.

That last one was measured early and then mis-quoted twice — in a commit message and in `ticks.mjs`'s
closing line — as "before this change a page had no way back to live except a click". An independent
reviewer caught it by re-running this track's own instrument. It is false: `onState` has mapped a re-fired
`SUBSCRIBED` to `setLive(true); pull()` since v3, so that page was already repairing itself. What this
round buys is narrower: the case where the client reports **nothing at all** because none of its machinery
ran. That case is a reading, not a measurement, and it is on the unverified list.

**How to apply:** the instrument you wrote is not read once and retired. When a claim is quoted from it,
re-read the output that is supposed to support the sentence. A finding that flatters the change is the one
to re-read first — this one survived four commits because it was the answer the round wanted.

### A silence test that can be wrong must be cheap to be wrong

The silence test has exactly one failure mode: if an answered heartbeat never reached `heartbeatCallback` on
the live socket, the stamp would freeze at the join while the channel was carrying perfectly well. The
write-up costed that at "one socket join every four minutes" — the poll's period — and the review pointed
out that `subscribe()` is also reached from `wake()`, which `visibilitychange` calls with no throttle at all.
The reviewer's own figure (a join per tab switch, ~2 s) was too high, because both transports stamp their
own birth so a fresh channel was already believed for 95 s; the real bound was one join per 95 s. But a
bound that depends on a convention in another file is not a bound. `channelAlive` now takes `heldSince` and
the engine passes it: a channel may not be called quiet until it has been **held** for `CHANNEL_SILENCE_MS`,
and its replacement is born held-since-now. A channel that reports `channel_error` is still replaced as fast
as it was before 1.12 — the floor rescues nothing that says no.

Measured, on the frozen clock: 81 wakes across 257 s on a page whose stamp never moves cost **one** join
(`tools/ticks.mjs`), and the suite holds the same bound.

**How to apply:** when a check can be wrong about a healthy thing, the design question is not only "how
likely" but "what does one wrong answer cost, and how often can it be given?" Put the ceiling in the code
that owns the decision, and measure the ceiling rather than reasoning about it.

### A double that is wrong in the flattering direction

`ticks.mjs`'s fake channel handle never re-fired `onState` after `channel_error`, and its header defended
that as "a state the real client does not have". Backwards: the real channel does come back, and re-firing
`SUBSCRIBED` is exactly what it does. The double therefore reported the tick as the thing that rescued a
repaired socket, which is the round's own change taking credit for work the vendored client was already
doing. It now fires the state the real client fires — the state `socketd.mjs` printed — and measures the
tick's contribution to that case as zero joins and one poll.

**How to apply:** a test double must be modelled on the instrument that watched the real thing, not on the
reading that motivated the change. And say in the double what it does and what it refuses to do, so the
next person can check the model instead of trusting it.

### A harness's integrity rule that was only a comment

`quietd.js`'s CONDITIONS comment said a trial where the page no longer believes it is live "is thrown and
marked, never quietly averaged in". The pre-write check was a throw; the post-preroll check incremented a
counter and pushed the latency in anyway. The trap is specific: such a trial has fallen to the 60 s poll, so
its latency is drawn against a 60 s bound while its whole column was drawn against 240 s — and a mixed
column reads exactly like the uniform one the argument rests on. It is now a `NotTheCondition` throw, kept
apart from "could not run": excluded from the distribution, printed as its own count in the cell, and an
exit code. Verified by inverting the guard on a scratch copy so every trial took the path.

**How to apply:** an integrity rule written in a comment is a wish. If the harness can print a mixed result
that looks like a clean one, it will, on the run you most want to believe.

### The instrument that was never run, and says so

`tools/beatd.mjs` asks the round's one gating question of the live endpoint: does an answered heartbeat
reach `heartbeatCallback("ok")`? One WebSocket with the public key from `config.js` — the connection every
visitor's browser makes — no channel, no broadcast, no RPC, no row, so it spends none of the twelve lists an
hour. It has produced no output: the session that wrote it had no outbound network. Its first paragraph says
so, along with what a pass prints and what each failure would mean. It is shipped unrun on purpose, because
the alternative was leaving the question with no way to ask it.

**How to apply:** an instrument that has not run is not evidence, and shipping it is only honest if the file
itself refuses to be mistaken for a result.

### What was left alone

* **`POLL_LIVE_MS` and `POLL_MS` do not move.** A rejoin that fails reports `channel_error` and `live` goes
  false, which puts the wait back to 60 s through machinery that was already there.
* **No throttle on `wake()`.** `onVisible` is still ungated and `onFocus` still has its 2 s gate, exactly as
  before; the ceiling is on channel replacement, not on the wake. `wake()`'s own pull per visibilitychange
  is unchanged since v3 and is measured as such.
* **There is no `focused` condition in `quietd.js`.** An OS-level unfocused window is not producible under
  Playwright — measured: both contexts report `hasFocus()` true and a `bringToFront` round trip delivers
  zero `focus` events — so the brief's focused condition is stood in for by `heard`, and every number quoted
  for it says so.
* **`current()` grows two additive fields** (`quietFor`, `channelAlive`) and nothing else about the link
  travels with them.
## Integration — the instrument, three harnesses that lied, and the half of §4 nobody had measured

### Every diagnostic this project had was invisible where the bugs were

Eleven launch arguments, all `#if DEBUG`: `-TFSelfTest`, `-TFWatchSelfTest`, `-TFAddSelfTest`,
`-TFFontSelfTest`, `-TFConfettiSelfTest`, `-TFFaceProbe`, `-TFKit`, `-TFShow`, `-TFThemeSet`,
`-TFFinale`, `-TFFinaleHold`. **A TestFlight build is Release and takes no launch arguments**, so on
the one device where this round's four findings were found, the project was blind — and had been for
three phases.

That is not a missing feature. It is the reason a feature could look present and do nothing for a whole
round with nothing going red: the only instrument ever pointed at dictation printed
`visibleInterfaceController=present` from a machine with no microphone, and a wrist had no way to
disagree with it because a wrist had no way to say anything at all.

So `WatchDiagnostics` ships: a bounded trace in the App Group under `tf/app/watch/trace`, and one
screen behind the long press on the count, in **every** configuration.

**The privacy rule is the type rather than the call sites.** `record` takes a `StaticString`, which the
compiler accepts only as a literal written in this repository — it cannot be built from a variable,
interpolated, concatenated or derived from input — and the only runtime payload an entry can hold is
two `Int`s. Every other `print` in this project obeys the no-secrets rule by *convention*, each call
site written to pass a fixed string and counts, and a convention is a thing that holds until somebody is
in a hurry. There is no field in this type that can hold a secret, so no call site can put one there and
a photograph of that screen is safe to send.

The codes are `static let`s in one `Code` enum rather than literals scattered across four files, and
that is not tidiness: it is what lets the *screen* compute a verdict. "asked 3, presented 3, heard 0" is
the answer to this round's first question and it can only be counted if the writer and the reader name
the event the same way. A `StaticString` constant is still a `StaticString`, so naming them centrally
gives up none of the guarantee.

**No timestamp in it is an epoch**, which is Phase 4's integration lesson applied before it could bite
rather than after. A watchOS device is `arm64_32` and its `Int` is 32 bits: `Int32.max` is 2,147,483,647
and epoch milliseconds are about 1.76 × 10¹², three orders of magnitude past it. It would not be a
runtime overflow a test might miss — it would not compile for the target, and only `xcodebuild archive`
would ever have said so. An entry carries a session number and milliseconds since that session's first
entry, both of which stay small.

**How to apply:** before building an instrument, ask which build it exists in. A diagnostic that is only
in Debug is a diagnostic that is never where the bug is.

### A seam a finger cannot reach is the same mistake one level along

Track A built the WatchKit path as a seam: `WatchDictation.prefer(.watchKit)` writes a key and the add
control changes. Reachable by editing a line and making a build — which, for a wrist that gets its
builds through TestFlight, means another upload and another day.

The round's own first unverified item is *does the input screen offer the microphone*, and if the answer
is no, the very next thing anybody wants is to try the other path. On the wrist that is already in the
room. So it is a button on the Diagnostics screen, next to the numbers that would make somebody want it,
and `WatchDictation.prefer` is still the only writer of the key.

Worth naming as the same failure this whole file exists to answer: **a diagnostic nobody can reach is
worth exactly what one that is only in Debug is worth.** Phase 3 shipped a fallback nobody could reach
and it took two rounds to find out.

### `visibleInterfaceController` is documented as a *stale* cache, and that is the add bug's mechanism

Phase 3's results line has been read three times as evidence that dictation worked:

> `add self-test: visibleInterfaceController=present so the wrist takes the WatchKit path`

Apple's own header says what that property answers with. `WKApplication.h:37`:

    @property (nonatomic, readonly, nullable) WKInterfaceController *visibleInterfaceController;
    // in the cases when queried after an app launch we will return the instance of the last visible
    // interface controller

**"The *last* visible interface controller"** — not the currently visible one. Non-nil never meant *on
screen*, and a modal sent to a controller that is not the visible one presents into nothing while the
system, which owns the input UI and the microphone both, still lights the indicator. Microphone on,
screen unchanged, which is what a wrist reported.

Two corroborations, both read rather than assumed. `Config/WatchInfo.plist` declares no
`NSMicrophoneUsageDescription` and `otool -L` on the device build lists no AVFAudio, no AVFoundation and
no Speech — so an app that reached the microphone would have been terminated rather than record, which
makes it very unlikely the app itself acquired it. (`otool -L` lists direct link-time dependencies only,
so that is "very unlikely", not "cannot".) And `WKInterfaceController.h:132` says of the *other* overload
that it "will never go straight to dictation because allows for switching input language" — Apple
stating in the negative that the overload this app calls **can**.

**So Phase 3 read the API correctly, and the bug is not the call — it is what the call is sent to.** That
distinction is the whole reason to write this down: "Phase 3 picked the wrong API" would be the wrong
lesson and would send the next round at the wrong thing.

**How to apply:** when a measurement says a pointer is non-nil, read what the pointer is documented to
point *at*. "Present" and "current" are different claims, and an SDK comment will often say which one
you actually have.

### Three harnesses lied in three different ways in one round, and only the third was caught by a test

This round set out to catch a simulator lying and then caught itself three times. They are worth reading
together, because the shapes are different and the fix is the same shape each time.

**One: the harness measured the control condition and called it the condition.** §4's whole subject is a
window that is visible but not focused. Producing that state in a headless Chromium takes two levers and
neither works alone — measured, four attempts:

| attempt | `visibilityState` / `hasFocus()` |
| --- | --- |
| a plain headless page | visible / **true** |
| `Emulation.setFocusEmulationEnabled({enabled:false})` alone | visible / **true** |
| a second page in the same context, fronted, alone | visible / **true** (stable at +1 s, +6 s, +27 s) |
| **both, in that order** | visible / **false**; one `blur`, never a `focus`; stable at +8 s and +38 s |

Playwright turns Chromium's focus emulation *on* so headless pages behave as if frontmost, which is why
every single-lever attempt reports a focused page with no window manager anywhere. The first probe used
the second lever only and printed `hasFocus=true` on every row while calling itself the unfocused arm.
`tools/quietd.js` had made the opposite version of the same mistake — it had *measured* that the state
was unproducible, from `bringToFront` alone, and written that into the file as a limit. Both are fixed,
and `quietd.js` now prints `50/50 trials ran on a page reporting visibilityState "visible" with
hasFocus() false` above its table. It changed none of its numbers, which is the part worth keeping:
`sync.js` has no notion of *is focused*, only of *just gained focus*, so the difference was never the
state and always the transition.

**Two: the harness reported its own starvation as the server's silence.** Two 45-minute channel probes,
one focused and one unfocused, two independent browsers on two independent topics, came back identical:
both lost rings 2, 5, 6 and 7 of ten, both raised `CHANNEL_ERROR` at 985–986 s and again at 3253–3254 s,
both ran 54.4/54.5 minutes against a 45-minute schedule. Two independent clients do not agree to that
precision about a server. The per-event timeline is what gave it away, and only the timeline:

    986.0s   STATUS CHANNEL_ERROR
    987.2s   STATUS SUBSCRIBED
    994.7s   heard rev 3
    994.8s   heard rev 4          ← rings five minutes apart, arriving a tenth of a second apart

Rings scheduled five minutes apart cannot arrive a tenth of a second apart, and a run cannot take nine
minutes longer than a schedule built from absolute targets. Four Xcode builds and two headless
Chromiums on one Mac starved the page; it missed its own 30-second heartbeats, declared a heartbeat
timeout, rejoined, and then processed a queue of arrivals in a burst when it next got CPU. **Those runs
cannot distinguish "the channel lost a message" from "the harness could not observe one", and the honest
verdict on them is `NOT MEASURED`.** The probe now carries a 1 Hz liveness counter and prints
`NOT OBSERVED (starved)` where it used to print `NOT HEARD`.

**Three: the check that could not fail.** Track A's own ring-buffer assertion compared eleven written
entries against a cap of sixty and passed by construction. Its reviewer found it; the track then
rewrote it *and falsified it* — deleted the eviction line, rebuilt, and watched the check go red
(`wrote=65 entries=65 cap=60 oldest-evicted=false`) before restoring it. That is the only one of the
three that a test caught, and the only one that was proved to work rather than argued to.

**How to apply, and it is one rule with three faces:** a harness must print its own evidence that it was
measuring what it says it measured — that the condition held, that it was awake, that it would have
failed. Phase 4 learned that a harness must not be able to report "nothing ran" as "nothing happened".
This round is the same rule applied to the condition, to the observer, and to the assertion.

### The half of §4 nobody had measured is the wrist ringing the bell

Phase 4's live run reads:

> `tfive add` | the put returned in **0.52 s** · the line on the page | **0.63 s**

**That writer is `tfive`, on a Mac.** The doorbell went into `SyncEngine.push()`, which the Watch, the
CLI and the App Intent share — so the *code* is shared, exactly as Phase 4 said — but the only writer
ever measured ringing the bell is a command-line process with a live network and no suspension model.
A watchOS app is suspended seconds after the wrist drops, and `ringDoorbell()` is an awaited round trip
*after* the put has already succeeded. A wrist that drops in between writes the list and tells nobody;
the page then waits out `POLL_LIVE_MS`, which is the reported second-monitor symptom exactly.

And nothing could have said so: `SupabaseTransport.ring` logs its status `#if DEBUG`, which on a
TestFlight build is nowhere. So the core grows `SupabaseTransport.Doorbell.report` — an HTTP status and
a body length, or `0` and a `URLError` code — set once at launch, and the Watch points it at the trace.
The id never crosses: it is a channel name derived from a link.

**How to apply:** when a fix is shared by three clients, it has been verified on the clients you
measured and on no others. "The code is shared" is a statement about the code, not about the hosts —
and `SyncEngine.push()` runs in a process macOS will keep alive and watchOS will not.

### The one thing that could have made Track D's fix wrong does not happen

`channelAlive` believes a healthy socket stamps `heard` through `heartbeatCallback("ok")`. If the live
endpoint never delivered that, every real page would replace a channel that was fine — bounded by the
`heldSince` floor to one join per 95 s per list, but a rejoin nobody needed.

`tools/beatd.mjs` asks it in one command, opens one socket, joins no channel and creates no row.
Track D shipped it having never run it, because its session had no outbound network. Integration ran it:

    socket connected: true
    callback fired 4 time(s): sent, ok, sent, ok
    first "ok" after 30.6 s, and there were 2 of them

So on this network the silence test's stamp moves on a healthy socket and the misfire does not happen.
It says nothing about a socket with a channel on it, a proxy, or an iOS app coming back from suspend.

**How to apply:** a tool shipped without ever being run is a hypothesis with a filename. Run it before
the round closes, or say in the file that nobody has.

### The trap this repository documents, walked into by someone who had just read it

`new URL(…, import.meta.url).pathname` percent-encoded the space in `Today's Five`, and the first run of
integration's own probe died on `/Today's%20Five/todays-five/config.js`. That is the
`fileURLToPath`-never-`URL.pathname` entry in this file, word for word, an hour after reading it.

**How to apply:** a warning in a decisions file is not a defence. The path is passed in now, which is.
