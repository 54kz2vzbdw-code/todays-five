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

## The application context is delivered more than once, so the payload is stamped

Measured on the paired simulators, in every run: one `updateApplicationContext` produced **two**
`session(_:didReceiveApplicationContext:)` callbacks. `receivedApplicationContext` was also empty at
activation while a context was pending, so the property is not the delivery path — the callback is.

The cause was not isolated and does not need to be, because the fix is the same either way: the
payload carries `v` and `at`, and **is applied only when `at` is newer than the last applied `at`**.
Repeat delivery is then free and out-of-order delivery is safe. A context is a last-value-wins slot
that is *also* replayed to a watch app on launch, so this was going to be needed regardless.

**How to apply:** a channel whose delivery you do not control needs a stamp, not a promise.

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
