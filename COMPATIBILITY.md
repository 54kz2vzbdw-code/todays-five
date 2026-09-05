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
- A missing setting gets its default when it is read. An unknown entry in the registry is kept.
  Nothing is deleted except by an explicit user action (Remove from this device, Delete this list)
  and the legacy plaintext copy a migration has already replaced on the server.
- Anything the app writes to localStorage that another version might read (the registry, the
  theme cache) keeps its shape; new per-device settings are new keys inside `meta.device`.

## 6. The service worker never forces a reload

- The shell (HTML, JS, CSS) is network-first with a cache fallback, so a deploy lands on the next
  open and never interrupts a list left on screen. Assets (fonts, icons, the vendored client) are
  cache-first. The cache name is versioned (`tf-v<app version>`) and only the app's own `tf-*`
  caches are reaped, because the origin is shared.
- No `skipWaiting`-driven reload, no `postMessage` telling the page to refresh, no "update
  available" banner. An old page and a new service worker must coexist until the page is next opened.
- Every new module must be listed in the shell precache so an installed app works offline after
  its first online open of the new version.
- What "next open" means on iOS, observed on the v3 → v4 deploy: a tab Safari merely re-fronted still
  ran the old code, and so did a tap on Safari's reload (the old worker's network-first fetch was
  answered from Safari's HTTP cache); the first fresh navigation to the URL brought the new version,
  intact list and what's-new toast included. A Home Screen app relaunched from its icon is a fresh
  navigation. So: never promise a user that a refresh updates them; the next open does.

## 7. Release checklist

Run all of it, in this order, for every change that reaches `main`:

1. Work on a branch; push after each logical commit.
2. Node suites pass: `node test/model.test.js`, `test/theme.test.js`, `test/crypto.test.js`
   (the pinned vectors), `test/sync.test.js`, `test/sound.test.js`, `test/features.test.js`.
3. The compatibility test passes: `node test/compat.test.js` (a v4 document through the frozen v3
   model, both directions).
4. The browser suite passes at 1440×900 and 390×844 on the local transport
   (`node tools/e2e4.js`), with zero page errors, zero CSP violations and zero third-party requests.
5. The real-backend suite passes against the live Supabase project (`node tools/realsync4.js`):
   envelopes on the wire, view links refused, unchanged polls still tens of bytes, presence,
   delete and undo, add-from-URL.
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
   the what's-new toast is the only new thing it sees). Mind the server's create limit (12 per hour
   per address): a day of suites can spend it, and a fresh device then reports "busy" until it clears.
