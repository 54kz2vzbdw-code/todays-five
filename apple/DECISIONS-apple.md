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
