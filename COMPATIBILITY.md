# Compatibility — the rules every change must keep

Other people use this app. Their lists, links and Home Screen icons must keep working through every
change, including while one of their devices runs old code and another runs new. These are the
invariants, and the checklist to run before anything reaches `main`. Read this before touching
`crypto.js`, `model.js`, `sync.js`, `sw.js`, the migrations, or the link handling in `app.js`.

## 1. Links never change

- `#/l/<W>` is an edit link and `#/r/<R>` is a view link. `W` and `R` are 22 base62 characters.
  The format and the meaning are frozen: an icon added to a Home Screen in v2 still opens the list in
  every later version (the registry's `redirect` map carries rotated and migrated ids forward).
- Anything appended after the id (v4 adds `/add?text=…`) must leave the id readable by an old
  client, which matches only the prefix, and must be stripped from the address bar once handled so a
  reload cannot repeat it.
- New link kinds need a new letter, never a new meaning for `l` or `r`.

## 2. Key derivation is frozen

- The HKDF-SHA256 scheme in `crypto.js` (`W → R → lookupId, key; W → writeToken`, the salt
  `todays-five/v3`, the base62 mapping, the AES-256-GCM envelope and its additional data) never
  changes. A change orphans every list in existence: the server would look the row up under a
  different id and the key would not open it.
- The pinned vectors in `test/crypto.test.js` are the proof. If that file fails after a change,
  fix the code, never the vectors. A new scheme would be a new link letter with its own vectors,
  and the old one would stay readable forever.

## 3. The document shape only grows

- The inner document carries `v`. Changes are additive: new fields on existing records, new
  collections keyed by id, new optional top-level keys. Nothing is renamed or removed; a rename or a
  removal needs migrate-on-read in `model.js` that accepts both shapes for as long as any device
  might hold the old one, which is forever.
- `normalize()` passes unknown fields and unknown collections through untouched, and `merge()` keeps
  them, because an old client receives new-shape documents from a device that updated first and
  pushes them back. A client must never drop what it does not understand.
- On an exact `updatedAt` tie a tombstone wins, then the record that carries more (the longer
  canonical JSON), then the lexically larger one. The middle rule exists so a field an old client
  stripped is restored by the next new client that merges, without a timestamp bump that would let an
  old client's re-emitted record win.
- Data that must survive an old client *editing* the record it belongs to lives in its own
  collection keyed by the record id (v4: `rules`, `returns`), because an old client rewrites the
  whole record with a newer timestamp. Data that only has to survive an old client *passing the
  document through* may live on the record (v4: `text`, `note`, `sectionId` on tombstones).
- The document's one top-level addition since v4 is `zone` (1.9): the list's home time zone, an IANA
  name written when the list is made (or by the device that made it, on its first 1.9 open of a list
  from before). Every device computes "today" and the day a line was finished on in that zone, so a
  shared list rolls over once, at home midnight, not at the earliest midnight among its devices. An
  old client passes the key through; two values merge by the larger string, which is exactly the rule
  every client applies to a top-level key it does not know, so 1.8 and 1.9 agree. The value is kept as
  written even when the platform cannot compute in it, and used only when it can. A document with no
  zone still rolls on each device's own clock, behind a guard: a line finished under six hours ago is
  never rolled. The merge fixtures in `test/fixtures/merge/` (written by `tools/merge-fixtures.js`,
  replayed by `test/compat.test.js`) pin all of this for any other implementation of the document.
- Rollover and every other pure function of the document stay deterministic and idempotent: two
  devices running them on the same input produce identical records, stamped relative to the record
  they replace (`updatedAt + 1`, `+ 2`), never with the current time, so a stale device cannot erase
  a real edit and two devices need no coordination to agree.
- Old clients never crash on new documents: v3's `normalize()` strips what it does not know and
  carries on. The frozen copy of that code lives in `test/fixtures/model-v3.js`; `test/compat.test.js`
  runs v4 documents through it and asserts that nothing an old client can see is dropped, that
  the old client's own edits survive, and that a v4 client merging the result back recovers every
  v4-only field.
- Storage budget: a typical list stays under 20 KB encrypted. The 96 KB server cap is a ceiling,
  not a target; History is capped at 365 days and tombstones purge after 30.

## 4. The server contract changes only additively

- `get_list_v3`, `put_list_v3` and `delete_list_v3` keep their signatures and their semantics.
  A new behaviour is a new function (or a new optional parameter with a default that preserves the
  old behaviour), deployed before the client that calls it. PostgREST resolves overloads by the
  JSON keys of the call, so prefer new names over overloads.
- Retiring an old function is a separate clean-up migration run only after every client has rolled
  (the `002` / `003` pattern). Migrations are idempotent and carry a one-line header saying what they
  do and when to paste them.
- The realtime channel is `list:<lookupId>`; broadcasts stay a doorbell (`{ rev, from }`, optionally
  `gone`), never the document. Presence (v4) carries a random session id and nothing else.
- Every feature since v3 fits inside the encrypted document, the three RPCs and that channel. A
  server schema change is the exception, not the rule, and stops at a checkpoint.

## 5. Local storage migrates on read, never wipes

- Keys: `tf/v2/meta` (device settings and the list registry), `tf/v3/list/<link>` (each list's
  decrypted copy with `rev`, `dirty`, `created`, `mode`), `tf/v2/themecss` (the token CSS the boot
  script re-applies), `tf/v2/localserver/<id>` (the test transport). The keys never change; the boot
  script in `index.html` reads two of them before any module loads.
- **`tf/app/seen` is the iPhone shell's, and the web must never touch it.** The app writes it into
  this same store so it can tell "the person removed their last list" from "the web store was
  cleared" — two states the registry alone cannot separate (§8). Its whole job is to be destroyed
  along with everything else, so the web may not write it, read it, or clear it, and must go on
  clearing only its own keys rather than the whole store. The `tf/app/` prefix belongs to the
  clients.
- A missing setting gets its default when it is read. An unknown entry in the registry is kept.
  Nothing is deleted except by an explicit user action (Remove from this device, Delete this list)
  and the legacy plaintext copy a migration has already replaced on the server.
- Anything the app writes to localStorage that another version might read (the registry, the
  theme cache) keeps its shape; new per-device settings are new keys inside `meta.device`.

## 6. An open page keeps its own code; a reload is the last resort

- The shell (HTML, JS, CSS) is network-first with a cache fallback, so a deploy lands on the next open and never
  interrupts a list left on screen. Assets (fonts, icons, the vendored client) are cache-first. The cache name is
  per build (`tf-v<version>-b<build>`) and only the app's own `tf-*` caches are reaped, because the origin is shared.
- Every module a page loads later — `panels.js` and `panels.css`, the sound packs, the QR maker, the exporter, the
  realtime client — is asked for with the page's own build (`?v=<build>`), and the service worker answers from that
  build's cache, so a page open across a deploy keeps loading its own code. The previous build's cache is kept for
  exactly that; older generations are reaped on activation. Every new module must be listed in the shell precache
  so an installed app works offline after its first online open of the new version, and so its build's cache can
  answer for it later.
- A module asked for with the page's *own* build is answered from this build's cache first, the network only when
  the cache has nothing (1.9). Its content is immutable by construction — a new build gets a new number and a new
  cache — so re-fetching it bought no freshness, only the round trip a slow connection paid on every open of Settings
  or Share. The shell files themselves (the page, `app.js`, `styles.css`, everything the first paint needs) stay
  network-first: their freshness is the deploy signal.
- The cache holds one copy of each file (1.9): a navigation is stored as `index.html` whatever address it came in on
  (neither the query nor the fragment reaches the key, so every list a device opens shares one shell entry, and the
  Private link never touches disk), and a module asked for by build is stored under its plain name. The precache
  lists `./index.html`, never a bare `./`.
- A reload is the last resort, only when a module truly cannot be served from its own build (a page two deploys old,
  a cache the browser evicted): the page flushes what is pending (an edit in progress is committed, the sync engine
  is given a moment), remembers its view and the panel that was asked for, reloads, and comes back to that view
  with that panel open. Nothing else may reload a page: no `skipWaiting`-driven reload, no `postMessage` telling the
  page to refresh, no "update available" banner. An old page and a new service worker coexist until the page is
  next opened or a module forces the one reload above.
- The worker fetches shell files with `cache: "no-cache"` — a revalidation, never a stale hit from the HTTP cache (GitHub
  Pages marks every file `max-age=600`, and iOS serves recently fetched scripts from that cache on a reload) — and its
  fallback looks in one build's cache only, so a page is never a mix of builds. The guard's reload first fetches every
  shell file with `cache: "reload"` for the same reason.
- `<html data-build>` says which build a page's markup is and `panels.js` says which build it wires
  (`PANELS_BUILD`); `test/features.test.js` keeps them in step with `version.js`. A mismatch is what triggers the
  reload above, once per build (`sessionStorage`), never a loop.
- What "next open" means on iOS, observed on the v3 → v4 deploy: a tab Safari merely re-fronted still ran the old
  code, and so did a tap on Safari's reload (the old worker's network-first fetch was answered from Safari's HTTP
  cache); the first fresh navigation to the URL brought the new version, intact list and what's-new toast included.
  A Home Screen app relaunched from its icon is a fresh navigation. So: never promise a user that a refresh updates
  them; the next open does — and, since 1.4, an open page's panels keep working until then.

## 7. Release checklist

Run all of it, in this order, for every change that reaches `main`:

1. Work on a branch; push after each logical commit.
2. Node suites pass: `node test/model.test.js`, `test/theme.test.js`, `test/crypto.test.js`
   (the pinned vectors), `test/sync.test.js`, `test/sound.test.js`, `test/features.test.js`.
   The Swift core's suite passes too: `cd apple/TodaysFiveCore && swift test` (§8). It is quick, and
   it is the only thing that says the second implementation still agrees.
3. The compatibility test passes: `node test/compat.test.js` (a v4 document through the frozen v3
   model, both directions).
4. The browser suite passes at 1440×900 and 390×844 on the local transport
   (`node tools/e2e4.js`), with zero page errors, zero CSP violations and zero third-party requests.
5. The real-backend suite passes against the live Supabase project (`node tools/realsync4.js`):
   envelopes on the wire, view links refused, unchanged polls still tens of bytes, presence,
   delete and undo, add-from-URL. When the change touched anything in §1–§4, the interop run goes
   with it (`node apple/tools/interop.mjs`): the Swift core and the web against each other on the
   deployed site. Both spend from the create limit — twelve an hour per address, and the interop run
   uses three of them — so run them once, in this order, and not in a loop.
6. Lighthouse desktop and mobile ≥ 95, installability errors empty; the mobile cold and warm
   numbers are not worse than the previous release's.
7. Bump the version in `version.js`, `sw.js` and `whatsnew.json` together (`test/features.test.js`
   checks they agree). The marketing version is semver for people (`1.0.x` a fix, `1.x` a design or
   feature round, `2.0` a redesign) and the what's-new toast keys on the string *changing*, never on
   its order. The build number (`BUILD` in `version.js`, `build` in `whatsnew.json`; About shows
   `1.1 (build N)`) is the commit count on `main` after the merge: merge fast-forward, and write
   `38 + <commits on the branch>` in the branch's last commit, then confirm with
   `git rev-list --count main`. No dates anywhere.
8. Merge to `main`, wait for Pages (about a minute; poll `sw.js` for the new cache name), then check
   the live URL on a fresh device (welcome → new list → encrypted row) and on a device that still
   holds a previous version's list (open the URL fresh, not a refresh: it opens, the list is intact,
   the what's-new toast is the only new thing it sees). If the change touched the check-off, finale
   or shuffle paths, the registry's shape or the precache list, open the iPhone shell on a simulator
   against the deployed site as well (§8) — the browser suite proves the events fire, only the app
   proves they still arrive. Mind the server's create limit (12 per hour
   per address): a day of suites can spend it, and a fresh device then reports "busy" until it clears.

## 8. Other clients

The web app is no longer the only thing that reads this contract. `apple/` holds two more, and the
rules above are now the agreement between all three rather than a description of one codebase.

**Any change to the document shape, the keys, the links, the RPCs or the `tf:*` event names updates
every client and every suite in the same change.** A change that lands on the web alone is a change
that will split a person's list between their phone and their laptop, silently, on the next merge.

### The Swift core — `apple/TodaysFiveCore`

A second implementation of §1–§4: links, keys, the envelope, the document, merge, rollover, the three
RPCs, a local store and a sync loop, for the Apple apps.

- **The shared fixtures are the single source of truth.** `test/fixtures/vectors.json` (the pinned
  derivation values, real envelopes, the canonical-JSON cases, the link grammar, the dates and the
  zone) and `test/fixtures/merge/*.json` (golden merge, normalize and rollover cases) are read by
  both suites: `test/crypto.test.js` and `test/compat.test.js` on one side, `swift test` on the
  other. Neither implementation can drift without a suite going red on both. Regenerate with
  `test/tools/gen-vectors.mjs` and `tools/merge-fixtures.js`; the first refuses to write if
  `crypto.js` no longer reproduces the pinned values, which §2 says it never will.
- A rollover fixture records the **device zone it was written in**. It changes nothing for a list
  with a home zone — that is what one is for — but a list without one rolls on the device's own
  clock, so an expectation written in Chicago is not the one Kiritimati produces. A replay that can
  compute in a named zone uses it; one that cannot skips a case written in another and says so.
- Beyond the fixtures, `test/tools/gen-merge-cases.mjs` runs a few thousand random operation
  sequences through `model.js` and writes the answers down for the Swift suite to replay. It is the
  net under the fixtures: it is what caught canonical JSON differing on an item id of `"2"` against
  `"10"`, and a string cut in the middle of a surrogate pair.
- `apple/tools/interop.mjs` runs the two against each other on the deployed site and the real
  backend. It creates three lists and deletes all three; mind the create limit in §7 step 8.

### The iPhone shell — `apple/TodaysFive`

A `WKWebView` on **the live site**, not a copy of it, plus the three things a browser cannot do:
haptics, a Keychain link vault, and links that open in the app. It is an old client the moment it
stops loading the current page, which is why it never bundles one.

- **The `tf:*` events are the contract.** The page dispatches four `CustomEvent`s on `window`, from
  the same places the sound plays: **`tf:check`, `tf:uncheck`, `tf:finale`, `tf:shuffle`**. They
  carry **no `detail`** — a haptic needs the moment, never the list. Renaming one, or dropping a
  dispatch, silently takes a feeling away from the app; `tools/e2e4.js` asserts all four at both
  viewports so it cannot happen quietly.
- The shell announces itself with a **user-agent token** (`TodaysFive/…`), not an injected flag, so
  the page's CSP never comes into it. `SHELL` in `app.js` reads it, and exactly two things turn on
  it: `HAPTIC` stands down (the shell has real generators; without this a check-off buzzes twice) and
  `STANDALONE` is true (no Add-to-Home-Screen hint inside the app, the save sheet leads with the
  link, and a list switch does not reload the page).
- The shell reads `tf/v2/meta` to keep its vault in step. **The registry's shape is therefore load-
  bearing outside the browser too**: an entry's `id`, `mode`, `origin`, `nickname`, `name` and
  **`archived`** are what the vault reads. §5's rule — the keys never change, unknown entries are
  kept — now protects the app as well as an old browser.
- **`archived` says the device does not hold that list.** *Remove from this device* sets the flag and
  leaves the entry in `lists`, because the server and the person's other devices still have it and
  Lists brings it back. The app reads an archived entry as *not held* and lets go of the secret:
  anything else would leave the phone holding the key to a list it was told to forget. A future
  release that expressed "removed here" some other way would have to say so here first.
- The vault has to tell two states apart that the registry cannot: **the person removed their last
  list** (`lists: []`, and the vault must drop it too, or the next launch resurrects it) and **the
  web store was cleared** (`lists: []` again, and the vault must give the list back). Reading a
  *missing* `tf/v2/meta` as the second does not work: the page writes a registry the moment it boots,
  so on a real wipe the key is never missing. The app therefore keeps a mark of its own in the same
  storage — **`tf/app/seen`**, holding nothing, whose whole job is to be destroyed along with
  everything else. Mark there: the page is speaking, and the vault follows it. Mark gone: the store
  is new to the app, nothing is removed, and the most recently seen link is offered back.
- **The `tf/app/` prefix belongs to the clients, not to the page.** The web must never write, read or
  clear a key under it — and must go on clearing only its own keys, never the whole store, or it
  would tell every client that its storage had been wiped.
- `WKAppBoundDomains` is what lets the service worker run inside the web view at all, so §6's whole
  story — a deploy landing on the next open, a page keeping its own build — holds in the app exactly
  as it does in Safari. A change to the precache list or the cache naming reaches the app too.
- **Nothing about the app may leak a link**: no URL in any log, no analytics, no crash reporting, no
  `NSUserActivity`, and Keychain items that are not synchronizable. iCloud Keychain would put list
  secrets on Apple's servers and change what `about.html` promises.

### What that adds to the checklist

§7 step 2 already asks for `swift test` when the shared parts move. Beyond that, a change to
`app.js`'s check-off, finale or shuffle paths, to the registry's shape, or to the precache list
should be run past the app on a simulator before it ships — the browser suite proves the events fire,
but only the app proves they still arrive.
