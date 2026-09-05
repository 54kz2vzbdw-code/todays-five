# Today's Five v2 — plan

Written before the build. Empirical findings that shaped it are in the "Probes" section at the end.

## Shape of the app

Build-less ES modules, all static, served from the repo root by GitHub Pages:

| file | role |
|---|---|
| `index.html` | shell. Inline head script: theme boot (no flash, no layout shift) + dynamic manifest. Body skeleton. `<script type="module" src="app.js">` |
| `styles.css` | all styling; tokens are CSS custom properties written by the theme engine |
| `app.js` | UI: views, rendering, inline editing, drag, keyboard, undo, rollover, panels, list switcher |
| `model.js` | pure data: ids, document shape, merge, rollover, ordering. No DOM. Unit-tested in Node |
| `sync.js` | persistence (localStorage), Supabase transport, realtime, offline queue, status |
| `theme.js` | curated themes, OKLCH derivation, contrast guarantees, font loading, codes |
| `sound.js` | knock/bell engines with per-theme parameters, volume, haptics |
| `fx.js` | confetti canvas |
| `qr.js` | vendored `qrcode-generator` (MIT), wrapped as an ES module. Generates client-side |
| `config.js` | `{ url, anonKey }` — empty until Supabase is set up |
| `sw.js` | service worker: offline shell, versioned cache |
| `manifest.webmanifest` | static fallback only (JS builds the real one) |
| `supabase/schema.sql` | table + RPCs to paste into the SQL editor |
| `test/` | Node unit tests for `model.js`/`theme.js`, Playwright end-to-end against the local transport |

## Data

```
list doc (what is stored locally and on the server)
{
  v: 2,
  id, name,
  sections: { [id]: { id, name, order, collapsed, updatedAt, deleted? } },
  items:    { [id]: { id, sectionId, text, note, done, doneAt, today, order, todayOrder, updatedAt, deleted? } },
  history:  { 'YYYY-MM-DD': [ { id, text, doneAt, section } ] },
  themes:   { [id]: { id, name, code, updatedAt, deleted? } },
  updatedAt
}
```

- Maps keyed by id (not arrays) so merge is a per-key operation and never duplicates.
- `sectionId: ''` is the implicit section. No section headers render until an explicit section exists; then loose items show under "Unsorted".
- `order` is a float; reorder sets it to the midpoint between neighbours. `todayOrder` orders the Today view independently, because Today spans sections.
- Tombstones: `{ id, deleted: true, updatedAt }` (other fields stripped). Purged after 30 days.
- `rev` (server revision) and `dirty` live beside the doc in localStorage, not inside it.

### Merge — per record, last writer wins, tombstones win ties

`merge(a, b)` walks the union of keys in `sections`, `items`, `themes`; for each key takes the record with the larger `updatedAt`; on an exact tie takes the deleted one, else the lexically larger JSON (deterministic, so both sides converge). `history` merges per day as a union by item id. The result is commutative, associative and idempotent, which is what makes the rest simple:

- Offline writes need no op log. Edits land in the local doc, which is marked dirty. Reconnect = one `put_list` of the whole doc. Conflicts merge and retry.
- Two devices editing offline then reconnecting: each pushes; the second one conflicts, merges the server doc into its own, pushes again. Nothing is lost (every record survives by timestamp), nothing duplicates (keys), and nothing flickers (the UI diffs by id and only animates records whose content changed).
- Rollover is idempotent by definition (see below), so both devices can run it.

### Server (Supabase, free tier)

One table `lists(id text pk, doc jsonb, rev bigint, updated_at)`. RLS on, zero policies, all grants revoked from `anon`/`authenticated`, so the REST endpoint for the table is dead. Three `security definer` functions with `search_path` pinned:

- `get_list(p_id)` → `{ doc, rev }` or `null`
- `put_list(p_id, p_doc, p_base_rev)` → `{ ok: true, rev }` or `{ ok: false, rev, doc }` (stale base). Inserts when `p_base_rev = 0` and the row does not exist.
- `delete_list(p_id)` → used by "Rotate link" so the old id is dead.

Ids are validated in SQL (22–64 base62 chars) and docs capped at 256 KB. Nobody can enumerate ids; the id is the secret.

### Sync loop

- **Instant paint**: `app.js` renders from localStorage before any import of the Supabase client (which loads lazily from the jsDelivr `+esm` build).
- **Transport interface**: `sync.js` talks to `{ get(id), put(id, doc, baseRev), subscribe(id, onChange), send(id, msg) }`. Production = Supabase RPC + Broadcast. Test = `local` transport backed by BroadcastChannel + a localStorage row per list, selected with `?transport=local`. The queue, merge, conflict and quiet-apply code paths are identical for both.
- **Pull** on boot, on `visibilitychange` → visible, `focus`, `online`, `pageshow`, on a realtime message, and every 60 s while visible as a safety net.
- **Push** debounced 250 ms after a local change; coalesced; conflict → merge → retry (max 5).
- **Realtime**: Broadcast channel `list:<id>`. After a successful push, `send({ rev, from: deviceId })`. Receivers ignore their own device id and pull. The channel is (re)subscribed whenever the page becomes visible or comes online and its state is not `joined`.
- **Status dot**: synced / syncing / offline, plus "Sync off — finish setup" when `config.js` is empty.
- **Remote changes** apply through the same diff renderer with `quiet: true`: no sound, no confetti, no kick; rows animate position (FLIP) and strikes draw.

### Ids and URLs

- `#/l/<id>`; id = 22 base62 chars from `crypto.getRandomValues` (≈131 bits).
- The current id is mirrored into the hash with `history.replaceState` so the address bar and bookmarks always carry it.
- Boot: hash id → use it. Else stored current id → use it. Else v1 data → migrate into a new list. Else Welcome: "Start a new list" / "Paste a link". Never silently create a list on a device that has neither.

### iPhone install path (verified, see Probes)

An inline script in `<head>` builds the manifest as a Blob URL with **absolute** `start_url = origin + path + '#/l/<id>'`, absolute `scope` and icon URLs, and inserts `<link rel="manifest">` before the parser reaches the body. iOS Safari reads the manifest once at load and honours its `start_url` including the fragment; Chrome re-evaluates the manifest whenever the link changes. When the id changes after load (paste, rotate, switch) the link is regenerated and, on iOS, the page reloads so the next Add to Home Screen sees the right id. The Welcome screen's "Paste a link" is the fallback for an installed app that has no id.

## Views and interaction

- **Today** (default): items with `today`, huge type as v1 (`--unit` scale by count; past 8 items the unit keeps shrinking as `41vh / n`, floor at v1's minimum). Optional tiny section caption. Done items sink by `doneAt`. Progress bar and finale count Today only. Pencil (hover on desktop, always on phone) or double-click edits in place.
- **Everything**: sections in rail-style uppercase headers, each collapsible; items with star (Today), checkbox, pencil, drag handle on hover. "+ Add" per section, "+ Section" at the end.
- `A` toggles views; `N` new Today item; `E` edit focused; `1–9` toggle by position; `T` theme panel; `M` mute; `F` full screen; `?` help; `Cmd/Ctrl+Z` undo; `Option+↑/↓` move.
- **Inline edit**: an auto-growing textarea in the row's own type. Enter commits and opens a new line below; Escape cancels; Backspace on empty removes. Text changes never reset `done` (v1 did; that was an artefact of the all-or-nothing editor).
- **Drag**: pointer events. Desktop: handle. Phone: long-press 400 ms anywhere on the row (with `-webkit-touch-callout: none`, non-passive touchmove guard). FLIP animation for displaced rows. Drop targets include other sections' headers. Keyboard: Option+↑/↓.
- **Undo**: toast with Undo for delete and done; Cmd/Ctrl+Z pops a snapshot stack of local ops.
- **Rollover**: for every item with `done && doneAt` on an earlier local date, append `{ id, text, doneAt, section }` to `history[thatDate]` and tombstone the item. Checked on boot, on visibility, and once a minute. Idempotent, so any device can do it. Undone Today items stay. "Start again" unchecks Today (v1 semantics).
- **Lists**: local registry `{ id, name, archived }`. Switcher in the rail's ⋯ menu, only visible once there are two lists.

## Theme engine

- 12 curated kits: Dark, Light, Pink (unchanged) + Midnight, Forest, Paper, Terminal, Sunset, Dusk, Harbor, Ember, Cocoa. Each: palette tokens, font pair, sound kit (engine + parameters), confetti palette.
- Custom: accent (picker/hex) + base (dark/light). All tokens derived in OKLCH; backgrounds tinted toward the accent hue at low chroma; gamut-mapped by chroma reduction. Contrast enforced by nudging lightness: text ≥ 7:1, muted ≥ 4.5:1, control hairlines ≥ 3:1, accent-as-text ≥ 4.5:1, accent fill ≥ 3:1. Font pair auto-picked from 6 curated pairs by base + hue warmth; overridable. Live preview; save with a name (synced in the doc); export/import as `T1:<base>:<hex>:<pair>:<name>`.
- "Surprise me": hue uniform, chroma 0.12–0.20, lightness banded by base; always passes the same contrast pass.
- Active theme per device. "Follow system" keeps a dark slot and a light slot; choosing a theme fills the slot matching its base.
- `theme-color` meta updated on every change. Fonts: only the active theme's families are loaded (one Google Fonts stylesheet link, swapped per theme). The boot script re-applies the cached token CSS synchronously so first paint is already themed.

## Polish

Service worker (network-first shell, cache-first assets, versioned cache, no forced reload); icons; `display: standalone`; safe areas; one-time iOS install hint; Screen Wake Lock toggle (re-requested on visibility); ≥44 px targets; volume control; haptics on Android; notes; History panel with streak; help overlay; reduced motion everywhere; visible focus; all controls keyboard-reachable.

## Verification plan

1. Node: `model.js` merge properties (commutative, idempotent, tombstones, convergence under random concurrent ops), rollover idempotence, id entropy; `theme.js` contrast across all curated themes and 2 000 random custom themes.
2. Transport is an interface (`get`, `put`, `subscribe`). Two implementations: `supabase` (production) and `local` (a BroadcastChannel + localStorage "server" shared by tabs of one origin). No mock of Supabase's realtime server is built; the real backend is tested by hand after `SETUP.md`.
3. Playwright + installed Chrome, on the local transport: two tabs on one link (check in one → appears in the other < 1 s, no sound); offline edits in both → reconnect → no loss/dupes; every shortcut; screenshots at 1440×900 and 390×844 for Today, Everything, theme panel, custom theme, edit-in-place, mid-drag.
4. Lighthouse 12 on the local build: Performance, Accessibility, Best Practices ≥ 95; CDP `Page.getInstallabilityErrors` empty.
5. Deploy, then curl + browser check of the live URL.

## Probes (done before writing code)

iPhone 16 Pro simulator, iOS 18.1 — Add to Home Screen:

| manifest | result |
|---|---|
| none | page URL kept, hash included |
| static, `start_url` with hash | manifest `start_url` used (hash kept) |
| static, no `start_url` | page URL kept, hash included; but Chrome refuses to install without `start_url` |
| link href swapped by JS after load (static→static or →blob) | ignored; Safari reads the manifest at load |
| blob manifest inserted by a head script, relative `start_url` | manifest read (name used) but `start_url` dropped (cannot resolve against `blob:`) — same complaint from Chrome |
| blob manifest inserted by a head script, absolute URLs | launches at the manifest's `#/l/<id>` in standalone mode — Chrome: zero installability errors |

Home Screen apps have their own localStorage (confirmed empty on first launch). Simulator driven via the Simulator app in the background because the native simulator tool needs `xcode-select`.

---

# Today's Five v3 — plan

v3 opens the app to anyone with the URL. Two things follow: nobody but a link-holder may be able to read a list (not even the operator), and strangers must not be able to run up a bill on the free tier. Everything below was designed before the code was written; the v2 sections above still hold unless this one overrides them.

## Threat model

- The server (Supabase) and its operator are honest-but-curious: they must see nothing readable. They may also be assumed to lose data or return stale data; the client never trusts the server for anything but storage and wake-ups.
- Anyone on the internet has the publishable key and can call the RPCs. They must not be able to read, change or delete a list without its link, nor fill the database, nor generate meaningful egress.
- The user's own device is trusted (as in v2): localStorage holds the decrypted list for instant paint and the link so the list can be found again.
- Out of scope: a compromised device, a malicious link-holder (by definition they are allowed to read), traffic analysis of *which* list ids are polled.

## Links, keys and what the server sees

Every secret in the system is derived from one random string with HKDF-SHA256 (Web Crypto), so a link is the whole credential and a view link can be handed out without leaking the edit link.

```
W          = 22 base62 chars from crypto.getRandomValues (≈131 bits)      → edit link   #/l/<W>
R          = b62( HKDF(ikm = utf8(W), salt, info = "read"),   22 chars )  → view link   #/r/<R>
lookupId   = b62( HKDF(ikm = utf8(R), salt, info = "lookup"), 32 chars )  → the row id on the server
key        =      HKDF(ikm = utf8(R), salt, info = "key",  256 bits)      → AES-256-GCM, non-extractable
writeToken = b64url( HKDF(ikm = utf8(W), salt, info = "write", 256 bits) ) → 43 chars, sent on every write
salt       = utf8("todays-five/v3")   (fixed application salt)
```

- `b62(bytes, n)` maps HKDF output to base62 by rejection sampling (byte < 248 → `B62[byte % 62]`), deterministic, unbiased. It asks HKDF for more output than it can need (64 bytes for 22 chars, 96 for 32); if a block ever fell short it derives another with `info + "/2"`, `"/3"`… The test suite pins vectors for three fixed `W` values so any future refactor that changes a byte of the derivation fails loudly (a silent change would orphan every list).
- The edit link can always produce the view link (W → R); nothing can go the other way (HKDF is one-way). The view link derives `lookupId` and `key`, so it can find and read the row, but not `writeToken`, so the server refuses its writes.
- The server stores `sha256(writeToken)` (hex) with the row at creation and compares on every `put`/`delete`. It never sees `W`, `R` or the key: fragments are not part of HTTP requests, the app never sends them anywhere, and `<meta name="referrer" content="no-referrer">` covers the rest.
- What the server has per list: `id` (lookupId), `doc` (envelope), `rev`, `updated_at`, `last_seen` (day granularity), `token_hash`. Nothing in it is readable.

### Envelope

```
{ "v": 3, "alg": "A256GCM", "z": "deflate-raw", "iv": <base64, 12 bytes>, "ct": <base64> }
```

- Plaintext = `JSON.stringify(doc)`, deflated (`CompressionStream("deflate-raw")`, available in every browser this app targets; the flag `z` is present only when it was used) and encrypted with a fresh random iv per write. Compression is not for egress (the poll already transfers nothing when idle) but for the storage cap: a year of history shrinks 5–8×, so the per-row cap can be small and the row cap large.
- Additional authenticated data = `utf8("v3:A256GCM:" + (z || "json"))`, so the header cannot be flipped without failing authentication.
- The whole document is encrypted: items, sections, history, saved themes, name.
- Merge stays client-side on plaintext. On a `put` conflict the server returns its envelope; the client decrypts, merges (same `model.merge` as v2), re-encrypts and retries. The inner doc keeps `v: 2`; nothing about its shape changed.

### Server contract (`supabase/migrations/002_v3.sql`)

Additive to v2 so the live v2 app keeps working until v3 deploys: two new columns (`token_hash`, `last_seen`), three new functions, a `private` schema for limits; the v2 functions keep their signatures and are only taught to refuse rows that carry a token. `003_v2_cleanup.sql` drops them after the deploy.

| call | behaviour |
|---|---|
| `get_list_v3(p_id, p_rev)` | `null` if missing; `{unchanged:true, rev}` when `rev = p_rev`; else `{doc, rev}`. Touches `last_seen` at most once a day per row (and runs the daily reaper when it does). |
| `put_list_v3(p_id, p_doc, p_base_rev, p_token)` | `p_doc` must be an envelope (`iv` and `ct` present) ≤ 96 KB. Missing row + `p_base_rev = 0` → rate limit + row cap, then insert with `sha256(p_token)`. Missing row + other base → `{ok:false, rev:0}` (never recreate a rotated list). Existing row: token mismatch → HTTP 403; stale base → `{ok:false, rev, doc}`; else update, `last_seen = now()`, `{ok:true, rev}`. |
| `delete_list_v3(p_id, p_token)` | token must match (403 otherwise). A legacy plaintext row (`token_hash is null`) may be deleted by id alone, as in v2: that is how migration retires the old row. |

Errors use PostgREST's `PTxxx` errcodes so the client sees real HTTP statuses: 400 bad input, 403 forbidden, 413 too large, 429 rate limited, 507 full. The app shows a sentence for each and keeps working locally.

### Migration of v2 lists

A legacy list is any `#/l/<id>` whose row (or local copy) is a plaintext doc. Edit and legacy ids are both 22 characters, so the client resolves an unknown link in order: local v3 record → local v2 record → server row under `lookupId(W)` → server row under the raw id (legacy) → gone.

Migration is client-side and never destroys anything before its replacement exists:

1. Read the legacy doc (local copy merged with the server row if reachable).
2. Generate a new `W`, derive, save the doc locally under the new link as `dirty + created` (this alone guarantees the data survives: the sync engine will insert it whenever it can).
3. Rewrite the registry: new entry replaces the old, `redirect[old] = new` so a stale Home Screen icon still lands on the list, `dead += old`.
4. Open the new list; the normal push creates the encrypted row. Only after that succeeds: re-read the legacy row, merge any edit another device made in between, then `delete_list_v3(old)` (queued and retried if it fails) and drop the legacy local copy.
5. Show the one-time sheet: "Your link changed. Save it, and re-add the phone." The other device sees "This link no longer works" and pastes the new link.

The v1 → v2 migration (localStorage `todays-five/v1`) still exists and now produces a v3 list directly.

### Rotate

New `W` → everything re-derived → the doc re-encrypted under the new key → `put` under the new lookupId → `delete_list_v3(oldLookupId, oldToken)`. Because `R` derives from `W`, rotating also revokes every view link; the confirm dialog says so. If the delete fails it is queued (`pendingKill` holds `{lookupId, token}`, never `W`) and retried as in v2.

### View-only mode (`#/r/<R>`)

No editing affordances at all (CSS by `html[data-mode="view"]`, and every mutating path in `app.js` checks the mode), a quiet "View only" pill in the rail, no sound or confetti (nothing to do), no rollover (the doc is shown as the editors left it), live updates as usual. Opening a view link registers it in the list switcher marked view-only. The sync engine never pushes in view mode.

## Abuse and cost (free tier, $0)

Budget: 5 GB/month egress, 500 MB database, 200 concurrent realtime connections, project pauses after 7 idle days.

- **Egress.** v2's 60-second poll fetched the whole doc: one open tab ≈ 1 GB/month. v3 polls with the known rev and gets `{unchanged:true, rev}` (≈ 30 bytes of body, a few hundred of headers). Poll every 60 s only while realtime is not joined, every 4 min while it is; wake handlers (visibility, focus, online, pageshow) unchanged. Verified with a network log: a steady-state poll transfers bytes, not kilobytes.
- **Storage.** Per-row cap 96 KB (envelope, i.e. `octet_length(doc::text)`), row cap 2400: worst case 2400 × 96 KB = 230 MB, under half of 500 MB with room for indexes. 96 KB of deflated JSON holds several hundred KB of history, far past the 365-day cap in `model.js`.
- **Creates per IP.** Inserts (new list, migration, rotate) are counted in `private.creates(ip_hash, at)`: at most 12 per hour and 40 per 24 h per address. The address comes from `request.headers` (`cf-connecting-ip`, else the first `x-forwarded-for` entry); only `sha256(salt || ip)` is stored, with a random salt generated once at migration time and kept in `private.state`; rows older than 24 h are deleted on every insert and by the reaper. If no address header is present, everything shares one bucket with 10× the limits, so abuse stays bounded without choking normal use.
- **Reaping.** Lists with no read or write for 12 months are deleted (`last_seen`). A `pg_cron` job runs daily if the extension is available; independently, the RPCs run the reaper opportunistically at most once a day (checked against `private.state.last_reap`). Disclosed on the About page.
- **Realtime ceiling.** If a channel cannot join (200-connection limit, paused project), the poll carries on at 60 s and the dot shows "live updates paused"; nothing else changes. The vendored client keeps retrying with backoff.
- **Graceful over-limit UI.** 429 → "Try again in a few minutes"; 507 → "The service is full"; 413 → "This list is too large to sync"; 403 → the list is shown as view-only. Never a blank screen: the local copy is always painted first.

## No third parties

- **Fonts** are self-hosted: every family the 12 kits and the 6 custom pairings use, woff2, latin subset, only the declared weights, variable where Google serves one (Lato, PT Sans, IBM Plex Mono and DM Serif Display are static). One block of `@font-face` rules with `unicode-range` and `font-display: swap` lives in `styles.css`; a face is downloaded only when a theme actually uses it, and the service worker caches it on first use.
- **Realtime client** is vendored: `vendor/realtime.js` is `@supabase/realtime-js` (MIT) bundled with its `@supabase/phoenix` dependency (MIT) into one ES module; licences in `vendor/LICENSES.md`. It is imported lazily after first paint, as the CDN build was, and only to receive broadcasts. Sends fall back to Realtime's REST endpoint when the socket is not joined.
- **CSP**: `default-src 'self'`; `script-src 'self' 'sha256-…'` (the inline boot script, hashed); `style-src 'self' 'sha256-…'` (the inline token stylesheet, hashed; later theme changes go through the CSSOM, which CSP does not govern); `connect-src 'self'` plus the project's Supabase host over https and wss; `font-src 'self'`; `img-src 'self' data:`; `manifest-src blob: 'self'`; `worker-src 'self'`; `object-src 'none'`. No third-party host anywhere.

## Verification plan

1. Node: HKDF/AES round trip; pinned derivation vectors; view derivation exposes no token; envelope tamper (AAD, iv, ct) fails; compression flag round trip; migration of a v2 doc through a fake server; minimal-move reordering; the sync engine against a fake encrypting transport (view mode never puts; conflicts merge on plaintext).
2. Real Supabase after Checkpoint 1: view link `put` refused (403); wrong token refused; rate limit trips at 12 and recovers; unchanged poll returns no doc and its size is measured; rotate kills the old id and the old view link; two devices converge after offline edits, with envelopes on the server.
3. Browser suite (Playwright, local transport): everything v2 checked, plus view-only mode, share sheet, save-your-link sheet, migration sheet, bottom-sheet menu at 390×844 with a safe area, the click-after-sync regression, no request ever leaves for Google or jsDelivr, zero CSP violations.
4. Lighthouse desktop and mobile ≥ 95; installability errors empty; iOS install path re-checked in the simulator because the head script changed.
5. Live URL after deploy: fresh device gets the new welcome; a new list is created encrypted (`doc` on the server is an envelope).

## The click swallowed after a remote change (fix 1)

Cause: every render re-appended every row (`orderInto` called `appendChild` on each row in order). A remote apply within a press detaches and re-attaches the row under the pointer; Chrome, Safari and Firefox all drop the `click` when the mousedown node leaves the DOM before mouseup. The FLIP animation that follows (520 ms) also slides rows under a still pointer, so mousedown and mouseup can land on different rows and the click fires on their common ancestor instead of the checkbox. Fix: rows are reordered with the minimum number of DOM moves (rows already in place are not touched), and a tap is recognised from its own pointer events (`pointerdown` on a row, `pointerup` within a few pixels or over the same row, no drag) instead of relying on the synthesised `click`; keyboard and assistive-technology clicks still work through the `click` path, and a pointer tap suppresses the click that follows it so nothing toggles twice.

## Verification results (v3, 2026-09-04)

What was actually run, and what it found.

| suite | result |
|---|---|
| Node `test/model.test.js` | 22 pass (merge properties, rollover, `reorderPlan` minimal moves, v3 seed) |
| Node `test/theme.test.js` | 12 pass (contrast floors incl. the elevated greys, every pair's fonts self-hosted, no Google Fonts left) |
| Node `test/crypto.test.js` | 9 pass (pinned vectors for three `W`, view link derives no token, envelope tamper fails, a year of history → 20 KB envelope) |
| Node `test/sync.test.js` | 10 pass (envelopes on the wire without the secret, view refs never push, 403 → readonly with no retry storm, unchanged polls, live/dead poll intervals, conflict merge on plaintext, gone, legacy read/delete, 429 hold) |
| Migrations against a local Postgres | 35 pass (both files idempotent; PT status codes; per-IP limit trips at the 13th create and recovers; reaper; anon denied everywhere but the RPCs) |
| Browser suite, local transport (`tools/e2e3.js`) | 84 pass: welcome, save sheet, tour (desktop keys / touch gestures, replay, never again), encrypted local rows, cold boot straight into a link, the click-after-sync regression (press spanning a remote re-render; list re-ordering under the pointer; keyboard path), labelled Today toggle + tooltip, share sheet (edit/view, sharing model), view-only mode, rotate killing both links, v2 migration with a late edit and the one-time sheet, migration fork guard, undo isolation, drag abort on remote change, carry-over after a paste, 429 → busy → recovery, realtime failure → "live updates paused", phone bottom sheet (52 px rows, icons, no key hints, swipe-down, tap outside, safe-area), gesture help, 44 px targets, touch affordances, manifest + installability, zero CSP violations, zero third-party requests, zero page errors |
| Real Supabase (`tools/realsync3.js`) | 28 pass: envelope rows keyed by lookup id, decryptable only with the link key, 403 for a view link's put and a wrong token's delete, unchanged poll = 29 bytes (vs 681 for the doc), realtime joined → 4-minute poll, two devices + a viewer converge with live updates, offline edits merge, rotate kills the old edit and view links, old key cannot read the rotated row, 429 at the 13th create with a plain message and the app degrading to "busy" |
| Lighthouse 12 (Chrome 152, gzip like GitHub Pages) | desktop 100 / 100 / 100, desktop warm 100 / 100 / 100, mobile cold 97 / 100 / 100, mobile warm 95 / 100 / 100 (performance / accessibility / best practices); installability errors: none beyond the harness's own |
| iOS 18.1 simulator, iPhone 16 Pro | Safari: welcome → Start a list → bottom-sheet save sheet → tour with gesture wording. Add to Home Screen → the icon launches standalone straight into the list (the head-script change kept `start_url` with the fragment working); the engine ran and reported the list's real server state |
| Reviews | UI-state (13 findings) and accessibility (13 findings, axe clean in 20 states) — all fixed, see DECISIONS.md |

Mobile warm performance sits at the 95 bar with run-to-run variance of ±2; the remaining cost is the module graph on a simulated slow phone (FCP 1.7–1.9 s). Splitting `app.js` so panels and the tour load on first use would buy a few points and is the next lever if it is ever needed.

Not verified in this build: the project's hosting region (the About page says "United States", inferred from round-trip latency, not read from the dashboard); Lighthouse's `bf-cache` audit (disabled by flags in the test Chrome); a real iPhone (the simulator stood in, as in v2).

---

# Today's Five v4 — plan

v4 is fixes, sixteen features, and a structure that keeps the app from ballooning. Everything here was designed
before the code, with two constraints ahead of every feature: other people's lists, links and Home Screen icons
must survive a mixed-version period (COMPATIBILITY.md, written first), and nothing may be glued on. The v2 and v3
sections above still hold unless this one overrides them.

## Information architecture

Three surfaces, and what each may hold:

| surface | rule | v4 change |
|---|---|---|
| the rail | never gains a control | presence dots beside the sync dot; the count becomes a button (one-thing mode) |
| Today | never gains a control | one-thing mode is `O` or the count; the day review card sits under "That's the list" |
| ⋯ | short and contextual | Share · How it works · Lists · Settings · About · Delete this list |

Everything else lives in one Settings sheet with five sections: **Appearance** (theme, follow system, schedule) ·
**Sound** (pack, volume, celebrate changes from other devices) · **Behavior** (day review, keep screen awake,
not-today swipe, single-key shortcuts, full screen where the platform has it) · **Lists** (templates, removed
lists, history) · **Advanced** (add from anywhere, export / import, who's here). The v3 menu items that were
settings (wake lock, sound, volume, single-key shortcuts) move there; Theme keeps its rail chip and `T`; History
moves under Lists because it is a per-list record, not a control.

Features live where they are used: the repeat rule inside the line editor, templates and "Put all on Today" in the
section header menu, search at the top of Everything, "Move to…" and "Not today" in the line's own menu, presence
in the rail. New behaviours default off; a v3 user who updates sees the what's-new toast and nothing else.

One visual language: the same bottom sheet, chip, tab strip, toggle row and list row everywhere. v4 adds two
primitives that v3 lacked and uses them in every new surface: a **toggle row** (label, optional sub-line, on/off
state as `aria-pressed`) and a **line menu** (a sheet listing what a line can do). The section menu, the ⋯ menu and
the Lists panel already use the list-row component; Settings and the new sheets reuse it unchanged.

## Structure of the code

`app.js` was one 100 KB module. Today's first paint must not get slower, so v4 splits it by *when the code is
needed*, not by feature:

| module | loaded | holds |
|---|---|---|
| `app.js` | always | boot, registry, open/switch lists, rendering, toggle, edit, drag, keyboard, undo, rollover tick, sync wiring, status, the ⋯ menu, one-thing mode, search, not-today, presence painting, add-from-URL, celebrate-remote, the what's-new toast |
| `panels.js` | first panel | theme picker, share and save sheets, Lists, History, Settings, section and line menus, templates, delete-everywhere and its undo, move-to-list, the tour, How it works |
| `exporter.js` | first export / import | JSON and Markdown export, import, share/download/clipboard hand-off |
| `packs.js` | first sound | the six engines; `sound.js` keeps only the audio-context state machine and the API |
| `qr.js`, `vendor/realtime.js` | as in v3 | QR encoder; realtime client (presence rides on it) |
| `panels.css` | after first paint | every dialog's styles (sheets, the theme picker, Settings, the tour, How it works); `styles.css` keeps only what Today needs, so the render-blocking CSS is no larger than v3's |

`app.js` hands the lazy modules one object (`api`) with live getters for its state (`doc`, `listId`, `ref`,
`sync`, `theme`, `view`…) and the actions they need (`afterChange`, `toast`, `ask`, `showPanel`, `render`,
`switchTo`, `openList`…). Nothing else is exported; the DOM for the panels stays in `index.html` (hidden dialogs
cost nothing at first paint) so the lazy code only wires behaviour.

## Document shape (inner `v: 3`, additive)

```
{
  v: 3, id, name, nameAt, updatedAt,
  sections, items, history, themes,                    (v2 shape, unchanged)
  items[id]  += nothing; a tombstone may carry { text, note, sectionId }   (Recently deleted)
  rules:     { [itemId]: { id, kind, days?, day?, text, note, sectionId, updatedAt, deleted? } }
  returns:   { [itemId]: { id, on: "YYYY-MM-DD", updatedAt, deleted? } }
  templates: { [id]: { id, name, lines: [{ text, note }], updatedAt, deleted? } }
}
```

- **Why side collections.** A v3 client's `normalize()` rebuilds every record from the fields it knows, so any
  new field on an item is stripped the moment the old phone re-emits the record, and a check-off on that phone
  re-emits it with a newer timestamp. The recurrence rule and the not-today return are therefore records of their
  own, keyed by the item id: the old client drops the collection and never sends it back, and every v4 client keeps
  its copy through the per-key union in `merge`. Only data that merely has to *pass through* an old client (a
  tombstone's text) rides on the record itself, protected by the new tie-break.
- **Tie-break.** Equal `updatedAt`: tombstone, then the longer canonical JSON, then the lexically larger. A record
  an old client stripped is shorter, so the v4 copy wins the tie and is pushed back. Still a total order, so merge
  stays commutative, associative and idempotent (fuzzed in `test/model.test.js`).
- **`normalize()` keeps unknown keys** on the document, on records and on tombstones, so the same courtesy v4
  needed from v3 is given to v5. `v: 2` documents are accepted as they are (a v3 client rewrites `v` to 2 on every
  push, so `v` can never gate a feature).
- **Recurrence and rollover.** `rollover(doc, today)` stays a pure, idempotent function:
  1. a done item finished on an earlier date goes to History for that date; if it has a live rule it is *reset*
     (`done: false, doneAt: 0, today: due(rule, today)`, stamped `updatedAt + 2`), otherwise tombstoned (`+ 1`) as
     in v3. The reset beats the tombstone a v3 device produces from the same done record (`+ 1`), so a mixed pair
     converges on the reset;
  2. an undone recurring line that is off Today and due today goes on Today (`+ 1`);
  3. a return whose date has come puts its line back on Today (`+ 1`) and tombstones itself;
  4. **revival**: a live rule whose item is a tombstone stamped one or two milliseconds above the item's latest
     History entry is a v3 rollover that ran before any v4 device saw the done record (a deliberate delete is
     stamped with the wall clock, minutes or days later). The line is recreated under its id from the rule's
     snapshot (`text`, `note`, `sectionId`), stamped `tombstone.updatedAt + 1`. Deterministic, so two v4 devices
     produce the identical record.
  Due dates: `daily` every day; `weekdays` Monday–Friday; `weekly` on `days` (0 = Sunday); `monthly` on `day`,
  clamped to the month's length. The rule keeps a snapshot of the line's text so revival has something to say.
- **Not today** sets `today: false` on the item (an old client sees it leave Today too) and writes `returns[id]`
  for tomorrow's local date; rollover puts it back. The Everything marker reads the return record.
- **Recently deleted** are tombstones that carry `text`; rollover tombstones and moves carry none, so History and
  moved lines do not show up as deleted. Restore re-creates the line from the tombstone with the current time.
- **Templates** are lines without state (`text`, `note`), named, stored in the document so they sync and are
  encrypted with it.
- **Budget.** A typical list (five sections, forty lines, a few rules and templates, ninety days of history) is
  measured on the live backend in the real-backend suite; the target is under 20 KB encrypted.

## Fixes

- **iPhone sound.** iOS suspends the `AudioContext` on background and *interrupts* it (state `interrupted`, or
  `suspended` on older builds) on calls, Siri and other apps' audio; a `resume()` after an interruption can fail
  silently, and v1's code only resumed from `suspended`. v4's `sound.js` is a state machine run inside every tap:
  if the context is not `running`, call `resume()`; if the previous tap's resume did not lead to `running` by the
  time of this tap, or the state is `closed`, close the context and create a fresh one inside this gesture. On
  return to the foreground the context is resumed as well (outside a gesture that is allowed after the first
  gesture). Tested in Node against a fake context that models suspend, interrupt, refuse and close.
  One-time hint: the first check-off with sound on, on iOS, shows a toast that the ring/silent switch mutes web
  audio; iOS exposes no signal for the switch, so the hint is shown once rather than detected.
- **View-only lists celebrate.** `applyRemote` diffs the previous and the next document; a Today line that became
  done plays the check sound and a burst at its row, and the finale fires when everything is done. Always on a view
  link (watching is the point); on an edit link only with Settings → Sound → "Celebrate changes from other devices",
  off by default, because a Mac left open all day would otherwise chime for every phone tap.
- **Line at the bottom.** Reproduced in the iOS 18.1 simulator: the empty progress track (`#bar`, 3 px of
  `--ink-3`) sits at `bottom: 0`, under the home indicator, and reads as a hairline in both Safari and the
  installed app. Fix: the track is transparent (only the fill draws), the bar sits above the safe-area inset, and the
  shell's background is the page's, seamless to the edge.
- **Menu's first item.** "Share this list" on a phone (a QR code for someone else's camera, copy, and the system
  share sheet), "Share & open on phone" on a desktop. Same sheet underneath.
- **Remove from this device.** Archive renamed; it only hides the list from this device's switcher. Lists →
  Removed restores it. How it works says so.
- **Delete this list everywhere.** ⋯ → bottom, destructive; a sheet naming the list; `delete_list_v3` with the write
  token; local copy and registry entry cleared; `announceGone` so other devices show "This link no longer works"
  at once. Undo for ten seconds re-creates it under the same link: the client still holds `W` and the document,
  and a `put` with `base_rev = 0` inserts it again (counted as a create by the rate limit). Offline: the revocation
  is queued in `pendingKill` exactly like Rotate. View links have no token and no Delete entry.

## Features

1. **Recurring lines** — above. A repeat glyph on the line; the rule is set in the line editor (never · every day ·
   weekdays · chosen days · monthly on a date).
2. **Add from anywhere** — `…/#/l/<W>/add?text=…&section=…`. `hashRef` reads the id as before and the `/add`
   suffix separately; newlines make several lines. The app opens the list (registering it if the device lacked
   it), waits for a document (local, or the first pull), adds the lines to Today (into `section` when it names an
   existing one), pushes, highlights the new lines with an "Added" toast, and rewrites the address to the plain
   link so a reload cannot repeat it. Empty text opens the new-line editor. A view link is refused with a sentence.
   Settings → Advanced shows the personalised URL with copy; How it works documents an iOS Shortcut (Ask for Input →
   URL Encode → Open URL) and a Mac bookmarklet.
3. **One-thing mode** — `O` or a tap on the count: Today shows only the top undone line, enormous; crossing it off
   slides the next in; the finale ends it; `O` or the count toggles it. Remembered per device (`dev.oneThing`).
4. **Day review** — Settings → Behavior, off by default. A quiet card under "That's the list": streak, days finished
   this week, today's lines. No modal, no sound; any key or tap dismisses it until the next finale.
5. **Who's here** — Realtime Presence on the existing `list:<lookupId>` channel. Each page load tracks a random
   session id and nothing else; the transport reports the number of other keys on `sync`; the rail shows one dot
   per other device (five, then "+n"), tooltip "n others have this list open", fading in and out. View-only devices
   count. Settings → Advanced → "Show who's here", on by default; off means this device neither tracks nor shows.
   The client's default heartbeat only; a presence join per page load is the only added traffic.
6. **Time-of-day theme** — Settings → Appearance → Schedule: off, or a day time and a night time with a theme for
   each. Per device. Mutually exclusive with Follow system: turning one on turns the other off and the row says so.
   Applied at boot and checked by the minute tick.
7. **Sound packs** — three new engines beside knock, bell and blip: **typewriter** (key strike; carriage return on
   the finale), **marble** (a glass marble dropped on wood, with bounces; a cascade on the finale), and **pop** (a
   soft bubble; a fizz on the finale). Every pack has check, uncheck and finale, parameterised per theme. Best-fit
   packs: Paper → typewriter, Forest → marble, Harbor → pop; the other kits keep theirs. Settings → Sound overrides
   the pack per device, with a preview on select.
8. **Templates** — section menu → "Save as template" (name, lines, no state) and "Insert template" into any section
   of any list; managed in Settings → Lists.
9. **Export / import** — Settings → Advanced. JSON is the full, versioned document (`{ app, format, exportedAt,
   doc }`) written with sorted keys so a round trip is byte-identical; Markdown is readable (sections, lines, notes,
   done state, history). Import JSON into a new list or merge into the current one (`merge`). iOS hands the file to
   the share sheet (`navigator.share` with a file), elsewhere a download, and the clipboard is the fallback. The
   sheet says plainly that this is the only backup that exists.
10. **Not today** — swipe left on a phone, `-` on a keyboard, or the line menu. The swipe can be turned off in
    Settings → Behavior.
11. **Move to…** — line menu → list picker. The line is added to the target list's local copy (new id, rule
    carried along) and saved dirty, then tombstoned in the source; `flushOthers` pushes the target when it can, so
    offline the move waits in the target's local copy exactly like any other unsynced edit.
12. **Recently deleted** — Everything ends with "Recently deleted (n)" and Restore.
13. **Search** — `/` or the search icon in the Everything header; live filter on text and notes; Escape clears.
14. **Put all on Today / Take all off Today** — section menu.
15. **iOS haptics** — a visually hidden `<input type="checkbox" switch>` toggled inside the tap. Ships only if it
    has no visual or focus side effect in the simulator; the haptic itself cannot be observed there (DECISIONS.md).
16. **What's new** — `whatsnew.json`; `dev.seenVersion`; a toast on the first open after an update, never on first
    run; About shows the version and the changelog; `sw.js`'s cache name carries the app version.

## Verification plan

1. Node: audio-context state machine; recurring rollover (pure, idempotent, converges from two devices, beats a
   v3 tombstone, revival); not-today; templates; move between lists; delete and undo re-creation; export → import
   byte-identical; add-URL parsing; what's-new shows once; the frozen-v3 compatibility test; version numbers agree.
2. Real backend: presence dots across two clients; delete everywhere and the ten-second undo; add-from-URL end to
   end; unchanged polls still 29 bytes; the doc-size measurement.
3. Browser suite (`tools/e2e4.js`, local transport, 1440×900 and 390×844): every feature, one-thing mode, search,
   recently deleted, the Settings sheet on both, view-only celebration, every sound pack without console errors,
   the bottom-of-screen line (a pixel probe), audio recovery after a simulated interruption.
4. A device with a v3 list opens v4: the what's-new toast, nothing else, list intact. Lighthouse before and after.
5. Live URL after deploy: fresh device and v3 device.

## Verification results (v4, 2026-09-05)

What was actually run, and what it found.

| suite | result |
|---|---|
| Node `test/model.test.js` | 22 pass (v3's merge, rollover, reorder and seed tests, unchanged, against the v4 model) |
| Node `test/features.test.js` | 18 pass (pass-through of unknown keys, the richer-record tie-break fuzzed for commutativity and associativity, `isDue` for every rule kind including the 31st in February, rollover reset at +2 and convergence from two devices, weekly lines leaving and returning to Today once per day, not-today and its return, recently deleted and restore, templates, put-all-on-Today, move between lists with rule and return, export → import byte-identical without the secret, add-URL parsing with newlines and a view link, what's-new once per version, the day review, orphan purge, the version in three files) |
| Node `test/compat.test.js` | 6 pass (a v4 document with rules, returns, templates, a remembering tombstone and a field from the future through the frozen v3 model: nothing the old client can see is dropped, its edits survive, every v4 field comes back after a merge; both rollovers converge on the reset; revival after a v3 rollover; a deliberate old-client delete is honoured) |
| Node `test/sound.test.js` | 8 pass (the state machine against a fake context: first gesture, background resume, an interruption whose resume never lands → a fresh context on the next tap, a closed context, foreground, every pack's check/uncheck/finale, the override, an unknown engine) |
| Node `test/sync.test.js` | 13 pass (v3's ten, plus presence only when enabled, delete then re-create under the same lookup id with the same token, a device that never created the list cannot re-create it) |
| Node `test/theme.test.js`, `test/crypto.test.js` | 13 and 9 pass (best-fit packs; the pinned derivation vectors untouched) |
| Browser suite `tools/e2e4.js` (Chrome 152, local transport, 1440×900 mouse and 390×844 touch) | 46 pass: new list and tour; the six-row ⋯ menu worded per device; Settings' five sections, toggles that hold across a reload, schedule and follow-system exclusive; a repeat rule from the line menu, the glyph, History and the reset after a rollover; not today by `-` and by a real left swipe, the tomorrow tag, the return; one-thing mode (one row, enormous, the next slides in, the finale ends it, remembered); search; recently deleted and restore; section menu templates and put-all-on-Today; move to another list and back; delete everywhere and the undo; add from anywhere (two lines, a cleaned address, a reload that adds nothing, a view link refused out loud, on the phone through the iOS reload); a view link that plays the check, bursts and gets the finale from the editor's taps, an edit link quiet by default and celebrating with the setting; presence dots between two tabs, the cap at five, fade-out, and off; every sound pack scheduling audio with zero console errors; audio recovery from a suspended and from a dead context; the bottom edge is the page background pixel for pixel and the track is transparent; export byte-identical, Markdown, a download, an import merged; the day review card; remove from this device and restore; a v3 device updating sees the what's-new toast once and nothing else; How it works with the Shortcut recipe and bookmarklet, replaying the five-mark tour; zero page errors, CSP violations and third-party requests |
| Real Supabase `tools/realsync4.js` | 6 pass: envelopes on the wire; a view link's put refused with 403; the unchanged poll is **29 bytes** (the same as v3); presence between two sockets, the count dropping on leave, an opted-out device invisible; delete everywhere then re-creation under the same link with the same token, and a device that never created the list reports "gone"; add from a URL end to end with a second device seeing the line; the doc-size measurement below |
| Doc size on the live backend | a realistic list (5 sections, 40 lines with notes, 2 rules, a template, 90 days × 5 lines of history): **69,636 bytes plain → 6,505 bytes encrypted** (envelope as stored); the seed list is 697 bytes. Budget: under 20 KB |
| Lighthouse 12 (Chrome 152, gzip like GitHub Pages, same harness for both, two runs each) | v3 baseline: desktop 100 / 100 / 100, mobile cold 99 / 100 / 100, mobile warm 100 / 100 / 100 (perf / a11y / best practices), mobile-cold FCP 1.43–1.73 s. v4 before the stylesheet split: mobile cold 98–99, FCP 1.66–1.85 s. v4 final (panel CSS off the critical path, two identical runs): desktop 100 / 100 / 100, mobile cold 99 / 100 / 100 with FCP 1.58 s, mobile warm 100 / 100 / 100 with FCP 1.24 s; TBT 0 everywhere; installability errors none beyond the harness's own |
| iOS 18.1 simulator, iPhone 16 Pro (Safari and a fresh Home Screen clip of the v4 build) | Safari: the bottom-edge pixel probe reads `#1A1D21` (the page's ink) to the last row, no `#2E343A` hairline (v3 read 9 device px of it). Home Screen app, standalone: the same, seamless to the edge; the only rows that differ are the home-indicator pill. Audio: the first gesture's context stayed `suspended` with its resume pending; the next tap closed it and made a fresh one that reports `running`; after Device → Home and a relaunch the context is still `running` and the next tap counts a check — the machine does on WebKit what the Node test models. The Add to Home Screen path still carries `start_url` with the list's fragment (the head script is byte-identical, its CSP hash unchanged) |
| A device carrying a v3 list, after the deploy (live URL) | Chrome profile that made its list on v3: opens on 4.0.0 synced, the five lines and the v3 edit intact, one done; the what's-new toast is the only new thing (no tour, no sheet, no sound); gone on the second open. The simulator's Safari, which made its own list on v3: a re-fronted tab and even a reload still ran v3 (Safari answered the old worker's fetch from its HTTP cache); the next fresh navigation ran 4.0.0 with the list intact and the toast — which is where the toast's phone width bug showed and was fixed (a `left: 50%` fixed box shrinks to half the viewport without an explicit width) |
| A fresh device, after the deploy (live URL) | welcome → new list → save sheet → the five-mark tour → 4.0.0 synced with presence on, the version marked seen silently, no toast. The first attempts hit the server's per-address create limit (this session's suites had spent the hour's dozen), the app said "Server busy" and kept the list locally exactly as designed; once the window cleared (second attempt, five minutes later) the same flow ended synced at rev 1 with an encrypted row of 669 bytes on the server, and ⋯ → Delete this list everywhere left the server row `null` |

Found and fixed along the way: two module-level `let`s below the boot call (the temporal dead zone the v3 notes warn about — the smoke test caught it on the first run); the view-link refusal toast dying in the reload iOS Safari needs (a notice that survives it); one-thing type too small on a phone (`13vw`/`18vh`); a presence peer that closed its tab without a leave on the local transport (pagehide says goodbye, as a closed socket does on the real server).

Standalone viewport note: in the simulator's Home Screen app the layout viewport (`inset: 0`, `100dvh`) ends 62 pt above the screen's bottom edge, so fixed elements sit that much higher than in Safari; the body background paints the rest, which is why the edge is seamless and why the v3 track showed as a floating hairline there. Whether a real iPhone does the same could not be checked in this build.
