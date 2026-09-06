# Today's Five for Apple — Phase 1: the Swift core

The plan, and at the end the results. This phase builds `apple/TodaysFiveCore`: a Swift package that
does everything the web's data layer does — links, keys, the envelope, the document, merge, rollover,
the three RPCs, a local store and a sync loop — and proves it against the web, not against itself.
No UI, no app target, no signing. Read `COMPATIBILITY.md` first; it is the contract this implements.

## Why a Swift core at all

The Apple apps are a native shell around the web UI. The shell needs the data layer natively so that a
Watch complication, a widget and a Siri intent can read and change a list without a WKWebView being
alive. That means a second implementation of a contract that until now had exactly one — and a second
implementation is where a contract stops being a description of the code and starts being a contract.
So this phase spends most of its effort not on writing Swift but on proving the Swift agrees with the
JavaScript, byte for byte, on the things the two will exchange.

## The shape of the risk

Everything here is a port, and every port is a chance to be *almost* right. Three places are where
almost-right costs a list:

1. **Key derivation.** A byte wrong and the server looks the row up under a different id and the key
   does not open it. Pinned vectors, shared with the Node suite, are the answer.
2. **The envelope.** A wrong compression variant or a wrong additional-data string means a document
   sealed on the Mac cannot be opened on the phone. Real ciphertexts crossing both ways are the answer.
3. **Canonical JSON.** `merge()`'s tie-break compares canonical JSON — its *length* first, then the
   string itself. If the two clients canonicalise differently they can disagree about which of two
   records with the same `updatedAt` wins, and the disagreement does not converge: each client keeps
   pushing its own answer. Nothing in the wire format reveals this. It shows up as a line that flips
   back and forth between two devices forever.

The third is the one worth being paranoid about, because it is invisible until it isn't. Three
JavaScript details leak into the answer and none of them are what a Swift programmer would write:

- **`String.prototype.slice` counts UTF-16 code units.** `normalize()` truncates `text` at 200 and
  `note` at 300 with `slice`. A note whose 300th code unit is the first half of an emoji is cut in the
  middle of a surrogate pair, and JavaScript keeps the lone surrogate; `JSON.stringify` then writes it
  as `\ud83d` (well-formed stringify, ES2019). Swift's `String` cannot hold a lone surrogate at all.
- **String comparison and `Array.sort()` order by UTF-16 code unit.** `"~" < "😀"` is true in
  JavaScript. In Swift, `"~" < "😀"` is also true, but `"é"` vs a decomposed `"é"` is not — Swift
  compares by Unicode canonical equivalence, JavaScript by raw code units. `canon()` sorts keys and
  `pickRecord` compares canonical strings with `>=`.
- **`Object.keys()` order is insertion order, except that array-index-like keys come first in
  ascending numeric order.** This mostly does not matter, because `canon()` sorts. It matters in
  exactly one place: rollover's step 4 (revival) computes `lastOrder` over `items` *as it mutates
  `items`*, so two lines revived into the same section get their `order` in iteration order.

So the core carries a small JavaScript-semantics layer underneath the model, and the model is written
on top of it. That is the central design decision of this phase.

## The package

```
apple/TodaysFiveCore/
  Package.swift                     swift-tools 6.0, Swift 6 language mode, strict concurrency
  Sources/TodaysFiveCore/
    JS/JSString.swift               a string as [UInt16], the way JavaScript holds one
    JS/JSNumber.swift               ECMAScript Number::toString(x, 10)
    JS/JSONValue.swift              ordered objects with JavaScript key order
    JS/JSONParse.swift              a JSON reader that keeps key order and lone surrogates
    JS/Canonical.swift              canon(), docEquals(), JSON.stringify()
    Base62.swift                    the alphabet and the rejection sampling
    Links.swift                     #/l/<W>, #/r/<R>, the suffixes
    Keys.swift                      HKDF-SHA256: W → R → lookupId, key; W → writeToken
    Deflate.swift                   raw DEFLATE over Compression
    Envelope.swift                  the v3 envelope
    Document.swift                  the document, the records, normalize()
    Merge.swift                     merge(), the tie-break
    Dates.swift                     localDate, addDays, weekdayOf, isDue
    Queries.swift                   today, sections, history, streak, recently deleted
    Ops.swift                       setRule, notToday, templates, move, restore, purge
    Rollover.swift                  the four steps, +1 / +2
    Transport.swift                 the protocol, SyncError, the error mapping
    SupabaseTransport.swift         the three RPCs over URLSession
    MemoryTransport.swift           the local test transport
    Store.swift                     one JSON file per list under Application Support
    SyncEngine.swift                pull / merge / push / retry, an actor
    Config.swift                    url and key, read from ../../../config.js at build time
  Sources/tfive/                    the CLI
  Tests/TodaysFiveCoreTests/
  Plugins/ConfigGen/                the build-tool plugin that reads config.js
```

Targets: `TodaysFiveCore`, `TodaysFiveCoreTests`, `tfive`. Zero third-party dependencies: Foundation,
CryptoKit, Compression, and the toolchain's own `Testing`. Platforms iOS 17, watchOS 10, macOS 14.

## What each piece must match, exactly

### 1. Links

`#/l/<W>` edit, `#/r/<R>` view, the id `[0-9A-Za-z]{22,64}` matched as a **prefix** so a suffix from a
later version leaves the id readable. The grammar is `model.js`'s, character for character:

```
^#\/(l|r)\/([0-9A-Za-z]{22,64})(?:\/([A-Za-z]*)(?:\?([^#]*))?)?
```

`/add?text=…&section=…` splits on `\r?\n`, trims, collapses runs of whitespace, drops empties, cuts
each line at 200 code units. `/mine` and `/shared` are origin hints and only on an `l` link. Anything
else — `/tv` among them — parses as a suffix that leaves the id readable and carries no meaning, which
is exactly what an old web client does with it. `/tv` does not exist in the web app today; the port
implements the *grammar*, not a list of known suffixes, so it behaves as the web will when `/tv`
arrives. `hashHasExtras` and `hintLink` come across too, plus `parseLink` (the paste box, which also
accepts a bare id).

### 2. Keys

HKDF-SHA256, salt `todays-five/v3`, over CryptoKit's `HKDF<SHA256>`:

- `R = b62(HKDF(W, "read"), 22)`
- `lookupId = b62(HKDF(R, "lookup"), 32)`
- `key = HKDF(R, "key", 32)` — AES-256-GCM
- `writeToken = b64url(HKDF(W, "write", 32))`

`b62` asks for 64 bytes (22 chars) or 96 (32 chars), takes `bytes[i] % 62` for every byte under 248,
and if the block falls short continues with `info + "/2"`, `"/3"`, … up to 31. The three pinned
vectors in `test/crypto.test.js` move to `test/fixtures/vectors.json` and both suites read them; the
Node suite keeps passing on the same numbers it always did.

### 3. Envelope

`{ v: 3, alg: "A256GCM", z?: "deflate-raw", iv, ct }`, keys in that order, `iv` and `ct` standard
base64 with padding. Additional data is `utf8("v3:A256GCM:" + (z || "json"))` — so dropping the `z`
flag fails authentication, which is a property the web tests and this one will too.

`deflate-raw` is **raw DEFLATE, no zlib wrapper** — checked, not assumed: the web calls
`new CompressionStream("deflate-raw")`, which RFC 1951 defines with no header and no Adler-32 tail.
Apple's `COMPRESSION_ZLIB` is the same thing (the framework's "zlib" is raw DEFLATE, RFC 1951).
The proof is not the reading, though: a Node script seals real documents with `crypto.js` and the
Swift tests open them, and vice versa.

`ct` is ciphertext ‖ tag, because that is what WebCrypto's `encrypt` returns; CryptoKit keeps them
apart, so seal writes `sealedBox.ciphertext + sealedBox.tag` and open splits the last 16 bytes off.

### 4. Document

The inner document as JSON with **every unknown key kept** — on the document, on every record and on
tombstones, and whole unknown collections through `merge`. `COMPATIBILITY.md` §3 says an old client
must never drop what it does not understand, and this client is the one that will be old.

So records are `JSONObject` with typed accessors, not structs:

```swift
public struct Item: Sendable {
    public var json: JSONObject
    public var id: String { json.string("id") ?? "" }
    public var text: String { json.string("text") ?? "" }
    public var done: Bool  { json.bool("done") }
    …
}
```

`normalize()` is ported line by line, including the order in which it inserts keys, because that order
is what `Object.keys` will hand back later. `canon()` sorts keys by UTF-16 code unit, formats numbers
by ECMAScript's `Number::toString`, and escapes strings the way `JSON.stringify` does — `"`, `\`, the
C0 controls as `\b \f \n \r \t` or `\u00xx`, lone surrogates as `\udxxx`, everything else raw.

### 5. Merge and rollover

`merge` is `pickRecord` per record over the six collections, `mergeHistory` for history, the name by
`nameAt` then the lexically larger, unknown top-level keys by the larger canonical value. `pickRecord`
is `updatedAt`, then tombstone, then **longer canonical JSON measured in UTF-16 code units**, then the
lexically larger. Rollover is the four steps, stamped `+1` and `+2` off the record it replaces.

The proof is differential. `test/tools/gen-merge-cases.mjs` generates a few thousand cases with a
seeded PRNG and writes, for each, the inputs and the web's answers as canonical JSON:

- **merge cases**: random document pairs — ties on `updatedAt`, tombstones with and without text,
  unknown fields, unknown collections, fractional `order` values, strings that truncate in the middle
  of a surrogate pair, decomposed and precomposed accents — and `canon(merge(a,b))`, `canon(merge(b,a))`,
  `canon(normalize(a))`.
- **sequence cases**: a random document and a random script of operations with explicit ids and
  timestamps (`setRule`, `notToday`, `backToday`, `rollover`, `purgeTombstones`, `restoreItem`,
  `templateFromSection`, `insertTemplate`, `deleteTemplate`, `setSectionToday`, `moveItem`, plus raw
  edits), with `canon(doc)` after every step and the query answers (`todayItems`, `itemsInSection`,
  `recentlyDeleted`, `historyDays`, `streak`, `exportJSON`).

The Swift tests replay each case and compare strings. A mismatch is a bug in the port until proven
otherwise. The generator pins `TZ` so the date functions are deterministic, and the Swift side takes
the same zone explicitly.

The rollover cases in `test/model.test.js` and the v4 ones in `test/features.test.js` are ported
one-to-one as hand-written tests as well, because a named test says what broke and a fuzz case does not.

### 6. Server

`Transport` is a protocol so realtime and the local test transport can arrive later without touching
callers, the way `sync.js` does it:

```swift
public protocol Transport: Sendable {
    var kind: String { get }
    func get(_ id: String, knownRev: Int?) async throws -> GetResult?
    func put(_ id: String, envelope: Envelope, baseRev: Int, token: String?) async throws -> PutResult
    func delete(_ id: String, token: String?) async throws -> Bool
}
```

`SupabaseTransport` posts to `/rest/v1/rpc/<fn>` with the publishable key. The real signature is
`get_list_v3(p_id, p_rev)` — **`p_rev`, not `p_known_rev`**; the unchanged short-circuit answers
`{unchanged:true, rev}` in a few dozen bytes. `put_list_v3(p_id, p_doc, p_base_rev, p_token)` returns
`{ok:true, rev}` or `{ok:false, rev, doc}` for a stale base. `delete_list_v3(p_id, p_token)`.

Errors map from the PostgREST codes the migration raises: `PT429` busy, `PT507` full, `PT403` bad
token, `PT413` too large, `PT400` bad request, plus network. "Gone" is not an error code — it is a
`null` from `get`, or a `rev` that went backwards, exactly as in `sync.js`.

### 7. Store and sync

One JSON file per list under `Application Support/TodaysFive/lists/<id>.json`, holding the document
with `rev`, `dirty`, `created`, `mode` and `origin`. (`sync.js` keeps `origin` in the device registry
rather than the list record; here it rides with the list, because a Watch app has no registry panel.
The other four fields are the web's, spelled the same.)

`SyncEngine` is an actor: pull, decrypt, merge on plaintext, persist, push dirty, and on a stale base
fold the server document in and retry up to six times. The subtle rules come across with a test each:

- a rotated or deleted id is **gone** and is never resurrected — `null` from `get`, or `rev` lower
  than the one we hold;
- **only a list this device created** may be inserted (`rev == 0 && created && mode == .edit`);
- a view ref never pushes and its local edits never mark it dirty;
- 403 and 413 hold the list off the wire until the next local change; 429 and 507 hold it for five and
  ten minutes and schedule one retry, so a refusal cannot become a burst.

No realtime in this phase. The poll delays (`POLL_MS`, `POLL_LIVE_MS`) come across so the CLI's
`watch` behaves like the web's safety-net poll.

### 8. `tfive`

`tfive show <link>`, `tfive check <link> <n>`, `tfive add <link> "text"`, `tfive watch <link>`, plus
`tfive new`, `tfive delete <link>` and `tfive raw <link>` for the interop run. Printing is Today's
order: Today first, then each section, done lines sunk. It is also the interop proof — every command
goes through the same store and engine an app will use.

### Config

`config.js` is read at build time by a SwiftPM build-tool plugin that emits `Config.generated.swift`,
so the URL and the publishable key are never copied by hand and never drift. If the plugin sandbox
refuses to read a file above the package directory the fallback is a symlink to `config.js` inside the
package, parsed at load; whichever lands is recorded in `DECISIONS-apple.md` with the reason.

## The deployed site must not move

`apple/` is a new directory at the repo root. Nothing in `sw.js`'s precache list changes, no module is
added to the shell, `version.js`, `sw.js` and `whatsnew.json` keep their numbers, and no file the
service worker precaches is touched. **No version bump**: the what's-new toast keys on `VERSION`
changing, and showing every user a toast for a change they cannot see would be a lie. That is a
deliberate exception to `COMPATIBILITY.md` §7 step 7, recorded in `DECISIONS-apple.md`. The check is a
`git diff --stat main` restricted to the precached paths, expected empty, plus the seven Node suites.

`test/fixtures/vectors.json` and `test/tools/gen-merge-cases.mjs` are new files under `test/`, which
the service worker does not precache and the site does not load.

## Verification

1. `swift test` on macOS: the shared vectors byte for byte; the envelope both directions against real
   ciphertexts a Node script produced with `crypto.js`; the differential merge and sequence cases; the
   rollover cases from `test/model.test.js` and `test/features.test.js` one-to-one; link parsing;
   canonical JSON against fixtures the web wrote.
2. `xcodebuild -scheme TodaysFiveCore -destination` for iOS Simulator, watchOS Simulator and macOS —
   not only the Mac host.
3. The seven Node suites still green, and the precached files byte-identical.
4. Live interop against the real backend, **three list creations** (the create limit is 12 an hour per
   address):
   - **A.** Playwright creates a list on the live site on the real transport (creation 1). `tfive show`
     reads it; `tfive check` crosses a line off; the web sees the check.
   - Both sides edit offline, reconnect, converge with no loss.
   - **B.** `tfive new` creates a list from Swift (creation 2); the web opens the link and shows it.
   - The view link of B: `tfive show` reads it, a write is refused 403.
   - **C.** New keys on the web for A (creation 3, and the old row deleted); the Swift side reports gone.
   - Every list deleted afterwards with `delete_list_v3`.

## Results

### What the round found

The branch was cut from a checkout forty-three commits behind `main`: the repo was at 1.5 (build 76)
and the deployed site runs **1.9 (build 119)**. Caught by the first Playwright run, whose selectors
did not match the live page. The port was rebased onto 1.9 and re-done against it. `crypto.js`,
`config.js` and `supabase/` had not moved a byte in four releases — §2 and §4 held exactly as they
promise — so the keys, the envelope and the RPCs needed nothing. `model.js` had: the home zone, the
six-hour roll guard, `moveToSection`, `moveItem`'s target section, bidi stripping on the way in, a
Markdown export that lists a Today line once, `lostEdits`, and 1.7's purge fix. All ported.

Three real divergences were caught by machine, not by reading:

1. **`exportJSON` is `JSON.stringify(JSON.parse(canon(body)), null, 2)`, and the parse in the middle
   is not decoration.** `canon()` sorts keys as strings; re-parsing hands them back in `Object.keys`
   order, which puts array-index-like keys first *numerically*. So an item id of `"2"` comes out
   before one of `"10"` — the opposite of the sort. Writing sorted keys straight out was wrong.
2. **Swift `String` cannot hold what the document can.** `normalize()` truncates a note at 300 UTF-16
   code units, which can cut an emoji in half, and JavaScript keeps the lone surrogate. Swift's
   `String` turns it into U+FFFD, and its `==` calls a precomposed and a decomposed accent equal
   where JavaScript does not. `exportMarkdown` and several comparison paths went through it. Every
   compared, sorted or written-back value now stays in UTF-16.
3. **`stripBidiDeep` gave a template tombstone an empty `lines` key.** The JavaScript iterates
   `t.lines || []` and mutates in place, so it never creates the key; the Swift rewrote it
   unconditionally. A one-key difference, and enough to lose a tie-break.

And one gap in the web's own fixtures. `test/fixtures/merge/rollover-guard.json` pins answers for a
list with **no** home zone, which by design rolls on the device's own clock — so the expectations
depend on the machine, and `node test/compat.test.js` failed under `TZ=Pacific/Kiritimati`. Every
rollover case now records the device zone it was written in: the Swift replay computes in that zone,
which it can; the Node replay skips a case written in another and says so. No expected value moved —
the regenerated files differ only by the new key — and `compat.test.js` now passes in Chicago, UTC,
Tokyo, Niue and Kiritimati.

### The suites

| | |
| --- | --- |
| `swift test` | **72 tests in 6 suites**, ~8 s on the Mac host |
| the pinned derivation vectors | 3, byte for byte, from `test/fixtures/vectors.json` |
| envelopes | the web's `deflate-raw` and uncompressed envelopes open in Swift; sealing the same bytes under the same iv reproduces the web's uncompressed ciphertext **exactly**; three Swift-sealed envelopes open in `crypto.js` (`node test/tools/check-swift-envelopes.mjs`) |
| the contract's golden cases | `test/fixtures/merge/*.json`, 6 files, **26 cases**, replayed byte for byte |
| differential | **1,200 random document pairs** and **900 operation sequences — 3,930 operations —** replayed step for step against `model.js`'s answers, plus 5 revival collisions that turn on `Object.keys` hoisting `"2"` before `"10"` |
| canonical JSON | 54 cases the web's `canon()` wrote |
| links, dates, the zone | 23 link cases, 126 `addDays`, 144 `isDue`, 12 `isZone`, 35 `localDateIn`, 20 `todayFor`/`dayOf` |
| rollover and sync | the cases from `test/model.test.js`, `test/features.test.js` and `test/sync.test.js`, ported one to one |
| Node suites | model 27, theme 30, crypto 10, sync 14, sound 11, features 28, compat 9 — all green |
| destinations | `generic/platform=iOS Simulator`, `generic/platform=watchOS Simulator`, `platform=macOS` — all build |

### The live interop run

Against `https://54kz2vzbdw-code.github.io/todays-five/` and the real Supabase project. **Ten checks,
ten passed, three lists created and all three deleted.**

```
ok  - the web created a list on the real backend
        status synced, rev 2, row RfAF2wbXOkbnqQWkIi1YRAhHqnjD7WHX, zone America/Chicago
ok  - the row on the wire is an envelope and carries no secret or plaintext
        437 bytes, z=deflate-raw
ok  - tfive read the web's list
ok  - tfive crossed a line off and the web shows it            the web is at rev 3, synced
ok  - both sides edited while apart and converged with no loss  rev 3 → 5; both lines on both sides
ok  - tfive made a list and the web opened it
        crypto.js opened the Swift envelope (533 bytes, z=deflate-raw); the web is at rev 1,
        zone America/Chicago; it asked whose list it was, once
ok  - a view link can read and cannot write
        tfive refused it locally; put_list_v3 with a forged token answered 403
ok  - the unchanged short-circuit still costs bytes, not the document   full 533, unchanged 29
ok  - New keys on the web, and the Swift side reports gone
        the old row answers null and tfive says gone
ok  - the rotated link opens on the Swift side with the list intact
```

The web learns of a change made by `tfive` on its next poll, or at once when the tab is fronted:
this phase has no realtime, so the Swift side rings no doorbell. The run dispatches the focus event a
person's tab switch would.

### The deployed site did not move

Every file the service worker precaches, plus `sw.js`, `version.js`, `whatsnew.json`, `index.html`
and the manifest — **28 files, 0 moved** against `main`. `version.js` stays 1.9 build 119, so no
what's-new toast fires for a change nobody can see. Outside `apple/`, the branch touches only
`test/` and `tools/merge-fixtures.js`, none of which the site loads. The browser suite
(`node tools/e2e4.js`) passes on the local transport with zero page errors, zero CSP violations and
zero third-party requests.

### What Phase 2 will find here

The `Transport` protocol has one implementation for the server and one in memory; realtime is a
second protocol a transport may also conform to, so adding it touches the transport and no caller.
`SyncEngine` is an actor with no timer of its own — the caller drives, which is what a shell, a
background refresh, a widget and a complication all want, and what let the CLI drive it here.
