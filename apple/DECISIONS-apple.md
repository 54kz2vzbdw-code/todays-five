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

## The vault keys on the registry existing, not on it holding anything

Corrected at checkpoint 1, and the correction was right. Restore fires only when `tf/v2/meta` is
missing or unreadable; removals reconcile whenever it parses, `lists: []` included.

Keying on `lists` being non-empty instead is a bug with teeth: removing the **only** list leaves
`lists: []`, restore would fire on the next launch, and the list a person had just removed would come
back. Existence of the key means the page's store is intact and speaking for itself; its contents are
the answer.

A link the app has vaulted but the page has never registered is exempt from removal until it has been
seen in a registry once — a link tapped from Notes is vaulted before the page finishes opening it,
and must not be dropped in that window.

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
