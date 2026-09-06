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
  PLAN-apple.md        the design, and the results of the round
  DECISIONS-apple.md   the calls made, and why
  TodaysFiveCore/      the package
  tools/interop.mjs    the live interop run, against the deployed site and the real backend
```

## Running the tests

```bash
cd apple/TodaysFiveCore
swift test
```

72 tests in six suites, about eight seconds. They read fixtures from the repo, not from a resource
bundle, because the fixtures are the shared contract:

| what | where | written by |
| --- | --- | --- |
| the pinned key vectors, envelopes, links, dates, the zone | `test/fixtures/vectors.json` | `test/tools/gen-vectors.mjs` |
| golden merge / normalize / rollover cases | `test/fixtures/merge/*.json` | `tools/merge-fixtures.js` |
| ~1,200 random document pairs and ~900 operation sequences | `test/fixtures/merge-cases.json.deflate` | `test/tools/gen-merge-cases.mjs` |

`test/fixtures/merge/` and `test/fixtures/vectors.json` are read by the **Node** suites too
(`test/compat.test.js`, `test/crypto.test.js`), so neither implementation can drift from the other
without a suite going red on both sides.

Regenerating them (only needed when the web's own behaviour changes, which
`COMPATIBILITY.md` says must be additive):

```bash
TZ=America/Chicago node test/tools/gen-vectors.mjs
TZ=America/Chicago node test/tools/gen-merge-cases.mjs
node tools/merge-fixtures.js
```

`gen-vectors.mjs` refuses to write if `crypto.js` no longer reproduces the pinned derivation values.
The zone is pinned because rollover is a function of the local calendar.

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

Read `PLAN-apple.md` before changing any of it, and `DECISIONS-apple.md` for why the JS layer exists.
