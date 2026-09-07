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

---

# Today's Five 1.1 — plan

A design round, not a feature round. 1.0 taught and offered the same things through several channels at once: a
five-mark tour, seed lines, a nine-item footer, five rail chips, a pencil and a ⋯ on every line, a labelled Today
pill on every line in Everything, a lone search icon. 1.1 subtracts until each moment has one channel, and gives the
app a real version scheme. The v2, v3 and v4 sections above still hold unless this one overrides them; the calls
made where the brief left things open are in DECISIONS.md, "1.1 decisions".

## What changed, by surface

| surface | 1.0 | 1.1 |
|---|---|---|
| a line, at rest | checkbox, words, pencil, ⋯ (always on the phone, on hover on the desktop); a chevron for a note; in Everything also a TODAY pill, a delete cross and a drag handle | the checkbox and the words; in Everything a small star (hollow off, filled on, no colour until hover). Notes show under the line in both views |
| a line, in hand | pencil edits; ⋯ opens the menu; the handle drags; a long-press drags on the phone | desktop: hover shows one ⋯ — click it for the menu (Edit first), drag it to move the line; `E` edits. Phone: a hold lifts the line — drag to move, let go for the menu; swipe right is the menu, swipe left is Not today |
| the rail | date · count · dot · Today/Everything · Theme · Sound · Share · Full screen · ⋯ | date · count with a 6 px sync dot (and the presence dots) · Today/Everything · Share · ⋯; on the phone count · dot · views · ⋯. After four seconds without the mouse the desktop rail and footer fade to the date and the count |
| the welcome | the rail above it | the title, three sentences, two buttons, one link |
| teaching | a five-mark tour after the save sheet; seed lines up to 62 characters; footers of nine and seven items; `?` opened How it works | the five seed lines, 26–30 characters, all on screen on both viewports, the payoff last; nothing after the save sheet; three one-line hints once per device (the star on the first Everything, drag on the first hold or ⋯ hover, the menu after the first edit); footers of four; `?` is a keys-and-gestures reference; ⋯ → How it works stays the long-form page |
| ⋯ | six rows, a centred dialog on the desktop | nine rows — Share · Theme · Sound · Full screen · How it works · Lists · Settings · About · Delete — a popover under the button on the desktop, the sheet on the phone; the line and section menus likewise |
| search | a lone icon at the top of Everything | nothing under nine lines; past eight a worded Search button; `/` always works |
| Settings › Advanced | the URL, export, import, who's here in one column | the URL · Export & import › (a sub-sheet) · Show who's here |
| the theme builder | accent, base, fonts, name | plus a Sound picker (Auto names the hue rule's pick; six packs, a preview on select); the choice rides in the theme record and a `T2:` code, `T1:` codes still import |
| the version | `4.0.0`, a date on every changelog entry | `1.1 (build N)`, the history renumbered (4.0.0 → 1.0, then 0.3, 0.2, 0.1), no dates anywhere; the toast keys on the string changing |

## The interaction model

| intent | desktop | phone |
|---|---|---|
| cross off | click, or `1–9` | tap |
| edit | ⋯ → Edit, or `E` | hold → Edit, or swipe right → Edit |
| the line's menu | hover, ⋯ | hold and let go, or swipe right |
| move a line | drag ⋯, or `⌥↑/↓` | hold, then drag |
| not today | `-`, or the menu | swipe left, or the menu |
| on/off Today | the star in Everything | the star in Everything |
| theme, sound, full screen | ⋯ rows, or `T`, `M`, `F` | ⋯ rows |
| every key or gesture | `?` | ⋯ → How it works → Gestures |

Everything a line can do still lives in its menu (edit, on/off Today, repeat, not today, move to another list,
delete), and everything a section can do in the ⋯ of its header. Nothing was removed from the app; what was removed
was the second and third way of reaching the same thing from the row.

## Structure of the change

- `app.js`: rows are built with the star (Everything) and the ⋯ grip only; `gripPress` turns a mouse press on ⋯ into a
  drag once it moves; `longPressStart` lifts a line and `endDrag` opens the menu when a hold ends where it began;
  `swipeStart` handles both directions; the just-in-time hints (`showMark`, `placeMark`, `hintToday`, `hintMenu`)
  and the idle fade (`idleReset`) sit above `boot()` with their state, as the temporal-dead-zone note demands;
  `showPanel` takes an anchor and positions a popover; the ⋯ menu paints the theme name and the sound state.
- `panels.js`: the tour is gone; `openKeys` is the `?` reference; How it works is rewritten for the new gestures;
  the theme builder carries the pack; `openExport` is the sub-sheet; Settings gained the fade switch and lost Full
  screen.
- `theme.js`: `derive({ pack })`, `PACK_IDS`, `hueSound`, `T2:` codes in `themeCode`/`parseCode`.
- `model.js`: the seed lines. `version.js`: `VERSION`, `BUILD`, `VERSION_LABEL`. `sw.js`: `tf-v1.1`.
- `styles.css` lost the pill, the pencil, the handle and the tour hole and gained the mark, the status group, the
  welcome and idle rules; it is a little smaller than 1.0's. `panels.css` lost the tour and gained the popover.
- `index.html`: the rail, the nine-row menu, the mark, the `?` reference, the export sub-sheet, the Sound select.
  The boot script is byte-identical, so its CSP hash is unchanged; About's script changed and was re-hashed.
- Compatibility: nothing touches links, keys, the document shape or the server. New per-device state (`hints`,
  `idleFadeOff`) are new keys inside `meta.device`; a saved custom theme's `code` may now be a `T2:` string, which a
  1.0 device's picker skips.

## Before and after

Every surface at 1440×900 and 390×844, taken by `tools/shots.js` on the local transport before the first change
and after the last. Before is the left of each pair.

| surface | desktop before | desktop after | phone before | phone after |
|---|---|---|---|---|
| welcome | <img src="shots/1.1/before/desktop-welcome.png" width="300" alt="welcome, desktop, before"> | <img src="shots/1.1/after/desktop-welcome.png" width="300" alt="welcome, desktop, after"> | <img src="shots/1.1/before/phone-welcome.png" width="120" alt="welcome, phone, before"> | <img src="shots/1.1/after/phone-welcome.png" width="120" alt="welcome, phone, after"> |
| save-link | <img src="shots/1.1/before/desktop-save-link.png" width="300" alt="save-link, desktop, before"> | <img src="shots/1.1/after/desktop-save-link.png" width="300" alt="save-link, desktop, after"> | <img src="shots/1.1/before/phone-save-link.png" width="120" alt="save-link, phone, before"> | <img src="shots/1.1/after/phone-save-link.png" width="120" alt="save-link, phone, after"> |
| tour | <img src="shots/1.1/before/desktop-tour.png" width="300" alt="tour, desktop, before"> | — | <img src="shots/1.1/before/phone-tour.png" width="120" alt="tour, phone, before"> | — |
| today | <img src="shots/1.1/before/desktop-today.png" width="300" alt="today, desktop, before"> | <img src="shots/1.1/after/desktop-today.png" width="300" alt="today, desktop, after"> | <img src="shots/1.1/before/phone-today.png" width="120" alt="today, phone, before"> | <img src="shots/1.1/after/phone-today.png" width="120" alt="today, phone, after"> |
| today-hover | <img src="shots/1.1/before/desktop-today-hover.png" width="300" alt="today-hover, desktop, before"> | <img src="shots/1.1/after/desktop-today-hover.png" width="300" alt="today-hover, desktop, after"> | — | — |
| hint-today | — | <img src="shots/1.1/after/desktop-hint-today.png" width="300" alt="hint-today, desktop, after"> | — | <img src="shots/1.1/after/phone-hint-today.png" width="120" alt="hint-today, phone, after"> |
| everything | <img src="shots/1.1/before/desktop-everything.png" width="300" alt="everything, desktop, before"> | <img src="shots/1.1/after/desktop-everything.png" width="300" alt="everything, desktop, after"> | <img src="shots/1.1/before/phone-everything.png" width="120" alt="everything, phone, before"> | <img src="shots/1.1/after/phone-everything.png" width="120" alt="everything, phone, after"> |
| everything-hover | <img src="shots/1.1/before/desktop-everything-hover.png" width="300" alt="everything-hover, desktop, before"> | <img src="shots/1.1/after/desktop-everything-hover.png" width="300" alt="everything-hover, desktop, after"> | — | — |
| hint-drag | — | — | — | <img src="shots/1.1/after/phone-hint-drag.png" width="120" alt="hint-drag, phone, after"> |
| hint-menu | — | <img src="shots/1.1/after/desktop-hint-menu.png" width="300" alt="hint-menu, desktop, after"> | — | <img src="shots/1.1/after/phone-hint-menu.png" width="120" alt="hint-menu, phone, after"> |
| menu | <img src="shots/1.1/before/desktop-menu.png" width="300" alt="menu, desktop, before"> | <img src="shots/1.1/after/desktop-menu.png" width="300" alt="menu, desktop, after"> | <img src="shots/1.1/before/phone-menu.png" width="120" alt="menu, phone, before"> | <img src="shots/1.1/after/phone-menu.png" width="120" alt="menu, phone, after"> |
| line-menu | <img src="shots/1.1/before/desktop-line-menu.png" width="300" alt="line-menu, desktop, before"> | <img src="shots/1.1/after/desktop-line-menu.png" width="300" alt="line-menu, desktop, after"> | <img src="shots/1.1/before/phone-line-menu.png" width="120" alt="line-menu, phone, before"> | <img src="shots/1.1/after/phone-line-menu.png" width="120" alt="line-menu, phone, after"> |
| section-menu | <img src="shots/1.1/before/desktop-section-menu.png" width="300" alt="section-menu, desktop, before"> | <img src="shots/1.1/after/desktop-section-menu.png" width="300" alt="section-menu, desktop, after"> | <img src="shots/1.1/before/phone-section-menu.png" width="120" alt="section-menu, phone, before"> | <img src="shots/1.1/after/phone-section-menu.png" width="120" alt="section-menu, phone, after"> |
| settings | <img src="shots/1.1/before/desktop-settings.png" width="300" alt="settings, desktop, before"> | <img src="shots/1.1/after/desktop-settings.png" width="300" alt="settings, desktop, after"> | <img src="shots/1.1/before/phone-settings.png" width="120" alt="settings, phone, before"> | <img src="shots/1.1/after/phone-settings.png" width="120" alt="settings, phone, after"> |
| settings-advanced | <img src="shots/1.1/before/desktop-settings-advanced.png" width="300" alt="settings-advanced, desktop, before"> | <img src="shots/1.1/after/desktop-settings-advanced.png" width="300" alt="settings-advanced, desktop, after"> | <img src="shots/1.1/before/phone-settings-advanced.png" width="120" alt="settings-advanced, phone, before"> | <img src="shots/1.1/after/phone-settings-advanced.png" width="120" alt="settings-advanced, phone, after"> |
| theme | <img src="shots/1.1/before/desktop-theme.png" width="300" alt="theme, desktop, before"> | <img src="shots/1.1/after/desktop-theme.png" width="300" alt="theme, desktop, after"> | <img src="shots/1.1/before/phone-theme.png" width="120" alt="theme, phone, before"> | <img src="shots/1.1/after/phone-theme.png" width="120" alt="theme, phone, after"> |
| theme-builder | <img src="shots/1.1/before/desktop-theme-builder.png" width="300" alt="theme-builder, desktop, before"> | <img src="shots/1.1/after/desktop-theme-builder.png" width="300" alt="theme-builder, desktop, after"> | <img src="shots/1.1/before/phone-theme-builder.png" width="120" alt="theme-builder, phone, before"> | <img src="shots/1.1/after/phone-theme-builder.png" width="120" alt="theme-builder, phone, after"> |
| share | <img src="shots/1.1/before/desktop-share.png" width="300" alt="share, desktop, before"> | <img src="shots/1.1/after/desktop-share.png" width="300" alt="share, desktop, after"> | <img src="shots/1.1/before/phone-share.png" width="120" alt="share, phone, before"> | <img src="shots/1.1/after/phone-share.png" width="120" alt="share, phone, after"> |
| help | <img src="shots/1.1/before/desktop-help.png" width="300" alt="help, desktop, before"> | <img src="shots/1.1/after/desktop-help.png" width="300" alt="help, desktop, after"> | <img src="shots/1.1/before/phone-help.png" width="120" alt="help, phone, before"> | <img src="shots/1.1/after/phone-help.png" width="120" alt="help, phone, after"> |
| keys | — | <img src="shots/1.1/after/desktop-keys.png" width="300" alt="keys, desktop, after"> | — | <img src="shots/1.1/after/phone-keys.png" width="120" alt="keys, phone, after"> |
| idle | — | <img src="shots/1.1/after/desktop-idle.png" width="300" alt="idle, desktop, after"> | — | — |
| finale | <img src="shots/1.1/before/desktop-finale.png" width="300" alt="finale, desktop, before"> | <img src="shots/1.1/after/desktop-finale.png" width="300" alt="finale, desktop, after"> | <img src="shots/1.1/before/phone-finale.png" width="120" alt="finale, phone, before"> | <img src="shots/1.1/after/phone-finale.png" width="120" alt="finale, phone, after"> |
| about | <img src="shots/1.1/before/desktop-about.png" width="300" alt="about, desktop, before"> | <img src="shots/1.1/after/desktop-about.png" width="300" alt="about, desktop, after"> | <img src="shots/1.1/before/phone-about.png" width="120" alt="about, phone, before"> | <img src="shots/1.1/after/phone-about.png" width="120" alt="about, phone, after"> |

(— means the surface does not exist in that version: the tour is 1.0's, the hints, the reference, the idle state and the export sheet are 1.1's.)

## Verification results (1.1)

What was actually run, and what it found.

| suite | result |
|---|---|
| Node `test/model.test.js` | 22 pass (v3's and v4's, and the seed test rewritten: five lines of 32 characters or fewer that send you to Everything, say to save the link, and end on the payoff) |
| Node `test/features.test.js` | 19 pass: everything v4 checked, plus what's-new firing on a *changed* version string and never on its order (a device at `4.0.0` sees the 1.1 entry once; a `1.0.1` after `1.1` still fires; the toast line says "quieter" and nothing about the renumbering), and the version in three places, the build in two, no `date` field and no date on the About page, the history `1.1, 1.0, 0.3, 0.2, 0.1` |
| Node `test/theme.test.js` | 14 pass: v4's thirteen, plus `T2:` codes round-tripping byte for byte with the pack, an empty pack meaning the hue rule, `T1:` codes importing as before and getting the hue rule, an unknown pack falling back, a `T3:` refused, curated codes unchanged |
| Node `test/crypto.test.js`, `sync.test.js`, `sound.test.js` | 9, 13 and 8 pass, untouched (the pinned derivation vectors included) |
| Node `test/compat.test.js` | 6 pass, untouched: nothing in 1.1 changed the document shape |
| Browser suite `tools/e2e4.js` (Chrome 152, local transport, 1440×900 mouse and 390×844 touch) | 63 pass, zero page errors, CSP violations or third-party requests: the save sheet then five seed lines of ≤ 32 characters all on screen without scrolling, no tour, no mark, no sheet after the save sheet; the welcome with no rail and no footer, both back with a list; the rail as specified with a 6 px dot and no pill; the ⋯ menu's nine rows in order, a popover under the button on the desktop (transparent backdrop) and a bottom sheet on the phone, Sound toggling in place, `M` and `T` still working; quiet rows (nothing at rest on the phone but the checkbox, the words and a small star in Everything; on the desktop nothing at rest, hover revealing exactly one control, the star hollow when off and filled when on with no orange until hover; one add style everywhere); the line menu from ⋯ with Edit first, dragging ⋯ moving the line, the popover by the row; on the phone a hold released in place opening the menu, a swipe right opening it, a hold that moves dragging; the section menu likewise; the three hints once each and never again, on the device after a reload; four-item footers, hidden on the phone, `?` opening the reference and the reference opening How it works; the idle fade in after 4 s and out on a move, a key resetting it, none with a panel open or during the finale, off by the setting; Settings' five sections, Full screen gone from them, the version line, Advanced keeping the URL and who's-here beside Export & import ›; a 1.0 device (seenVersion `4.0.0`) seeing the 1.1 toast once, nothing else, nothing about the renumbering, its list intact, no hints after; About reading `1.1 (build N)` with a renumbered, dateless changelog; How it works with the Shortcut, the bookmarklet, the new gestures and no tour; and everything v4 checked (repeat, not today by key and by swipe, one-thing mode, search past eight lines with `/` always working, recently deleted, templates, move between lists, delete everywhere and undo, add from anywhere, view-only celebration, presence dots beside the sync dot, every sound pack with the theme's pick named and the override winning, the theme builder's pack in a `T2:` record, audio recovery, the bottom-edge pixel probe, export and import from the sub-sheet, the day review, remove from this device) |
| Real Supabase `tools/realsync4.js` | 6 pass, the suite unchanged: envelopes on the wire, a view link's put refused, the unchanged poll still **29 bytes**, presence, delete and undo, add from a URL; the seed list 617 bytes encrypted, the realistic list 6,549 bytes |
| Lighthouse 12 (Chrome 152, gzip like GitHub Pages, the same harness and machine for both, two runs each) | **1.0 baseline** (the untouched 1.0 clone): desktop 100 / 100 / 100 (FCP 0.38–0.40 s); mobile cold 98–99 / 100 / 100 (FCP 1.59–1.85 s, LCP 1.97 s); mobile warm 99 / 100 / 100 (FCP 1.59 s, LCP 1.98 s). **1.1 as first built**: mobile cold 97–98 and warm 98, LCP 2.12 s: a point behind, and deterministic. The cause and the fix are in DECISIONS.md, "First paint" (the dependency graph, not the code: `version.js` never preloaded, `panels.css` requested before the first paint, and three Lato faces pulled in by an invisible row). **1.1 final**: desktop 100 / 100 / 100 (FCP 0.30–0.38 s, LCP 0.40–0.42 s); mobile cold 99 / 100 / 100 (FCP 1.65–1.66 s, LCP 1.88 s); mobile warm 99 and 98 / 100 / 100 (FCP 1.29–1.67 s, LCP 1.82–1.90 s); TBT ≤ 5 ms everywhere; first paint and LCP better than 1.0's in every run, two font files fewer at every cold open. Performance / accessibility / best practices throughout |
| Sizes on the critical path (gzip) | `styles.css` 8.7 KB (1.0: 8.1), `app.js` 34.1 KB (31.3), `index.html` 8.4 KB (8.1); `panels.css` and `panels.js`, off the critical path, smaller than 1.0's (3.9 and 14.9 KB against 4.0 and 15.8) |
| Live check, a 1.1 device (a Chrome profile that made its list on the live site while it ran 1.1 build 49, crossed a line off, saw it synced at rev 2 with `seenVersion` 1.1; then, after the deploy of build 53, opened the URL fresh) | The first navigation already ran **1.2** (Pages served the new worker 45 s after the push; this profile's HTTP cache had nothing to answer with): the list intact (the same link, five lines, one done, synced at rev 2), the what's-new toast the only new thing ("New in 1.2: Day and night, your way."), the sun/moon in the rail between the views and Share, no sheet, no hint, no sound; Dark still on — a by-hand 1.1 device keeps its theme in Night with Light in Day, Switch by hand — and Settings reading "Today's Five 1.2 (build 53)", Day theme Light, Night theme Dark · on. A second open showed no toast. Then ⋯ → Delete this list everywhere cleaned the row up |
| Live check, a fresh device (a new profile on the live URL after the deploy) | The welcome with no rail → Start a list → the save sheet → the five seed lines, no toast, the version marked seen silently; With the system on a dark system, so Night = Dark on and Light waiting in Day; synced at rev 1 with an encrypted row on the server (an envelope of 585 bytes: `v`, `z`, `iv`, `ct`, `alg`, nothing readable); the rail count · dot · views · sun/moon · Share · ⋯; About "Version 1.2 (build 53)" with the three headlines. Then deleted everywhere. This record is the commit that makes `main` 54 commits long, so the live About reads `1.2 (build 54)` from here on |
| Live check, a 1.0 device (a Chrome profile that made its list on the live site while it ran 1.0, crossed a line off, saw its list synced at rev 2 with `seenVersion` `4.0.0`; then, after the deploy of build 48, opened the URL fresh) | The first navigation, six minutes after the profile's last visit, still ran 1.0: GitHub Pages serves the page with a ten-minute lifetime and Chrome answered the navigation from its HTTP cache, the "next open" behaviour COMPATIBILITY.md §6 describes. The navigation after that ran **1.1**: the list intact (five lines, one done, synced), the what's-new toast the only new thing ("New in 1.1: It got quieter…"), no tour, no hint, no sheet, no sound, every hint already counted as seen; a second open showed no toast; opening Everything showed no mark. Then ⋯ → Delete this list everywhere cleaned the row up |
| Live check, a fresh device (a new profile on the live URL after the deploy) | The welcome with no rail → Start a list → the save sheet → the five seed lines, nothing else on screen (no tour, no mark, no toast), the version marked seen silently, synced at rev 1 with an encrypted row on the server; the ⋯ menu's nine rows in order; Settings' line "Today's Five 1.1 (build 48)"; About "Version 1.1 (build 48)". Then deleted everywhere. This record is the commit that makes `main` 49 commits long, so the live About reads `1.1 (build 49)` from here on |

---

# Today's Five 1.2 — plan

Two changes, both simplifications: the theme model becomes two slots with one switch, and the changelog stops
narrating development. Nothing on the server changes. The earlier sections still hold unless this one overrides
them; the calls made where the brief left things open are in DECISIONS.md, "1.2 decisions".

## Day and Night

Every device has a **Day theme** and a **Night theme**. One sun/moon control on the rail flips between them; Settings
decides which theme fills each slot and how the switch happens. "Follow system" and "Schedule" stop being separate
features and become two ways of driving that one switch.

| surface | 1.1 | 1.2 |
|---|---|---|
| the rail | date · count with the sync dot · Today/Everything · Share · ⋯ | the same, with a sun/moon between the views and Share (count · dot · views · sun/moon · ⋯ on the phone). It shows where a tap goes (the moon by day, the sun by night), tooltip "Night · T", and it fades with the rail |
| a tap on it | — | the other slot, with a crossfade of the whole palette (~400 ms; colour tokens interpolated in OKLab, gradients, shadows and the fonts swapped at the midpoint, the glow dipping through; instant under reduced motion) and the incoming theme's soft tick |
| Settings → Appearance | Theme · Follow system · Schedule (day from, night from, a day theme, a night theme) | Day theme · Night theme · Switch. Switch offers By hand / With the system / On a schedule (day from, night from). Under an automation, a manual flip holds until the next automatic switch, then the automation resumes |
| the picker | every theme in one grid, Follow system chip, the builder | opened for one slot (from either row; ⋯ → Theme opens Appearance): every theme grouped Made for day / Made for night / Yours, any theme for either slot, each curated kit tagged with its lean and its partner; choosing one offers "Use ⟨partner⟩ for ⟨other slot⟩" in one tap; the builder fills the same slot and can Make its partner |
| curated kits | twelve | fourteen: every kit has a designed partner (Light ↔ Dark, Paper ↔ Midnight, Harbor ↔ Forest, Blush ↔ Pink, Teletype ↔ Terminal, Sunset ↔ Dusk, Cocoa ↔ Ember); Blush and Teletype are new |
| a theme you make | accent, base, fonts, sound, name; Use, Save, Surprise, Copy code, Import | the same, plus Make its partner: same accent, same pack, flipped base, through the same derivation, saved as a second theme linked to the first |
| keys | `T` opens the picker | `T` flips; `Shift+T` opens Appearance; the `?` reference and How it works say so |
| a new device | Dark | Day = Light, Night = Dark, With the system, and the first frame already follows the device's setting |
| a device from before | — | no visual change: the theme on screen keeps its slot; Follow system → With the system with its slots; the schedule → On a schedule with its themes and times; neither → By hand. The what's-new toast is the only new thing it sees, and the sun/moon where the rail already was |

### Structure of the change

- `theme.js`: `lean` and `partner` on every kit, `CURATED_DAY` / `CURATED_NIGHT` (pair order), `partnerOf`, `makePartner`;
  the pure slot logic (`migrateSlots`, `scheduledSlot`, `autoSlot`, `activeSlot`, `slotCode`, `flipSlot`, `settleHold`,
  `setSwitchMode`) over the device record and an environment `{ systemDark, now }`; `mixHex` and `cssTextBetween` for
  the crossfade. `T2:` codes are unchanged.
- `app.js`: the migration on load, `applyThemeCode` with a crossfade, `flipSlot`, `setSlotTheme`, `setSwitchMode`,
  `setSwitchTimes`, `tickTheme` settling a spent hold on the minute tick and on the system's own change, the glyph, the
  keys, the ⋯ route, the toast reading a headline, `tick` counted for the test hook.
- `panels.js`: the picker for one slot (three groups, the partner offer, Make its partner), Appearance's three rows,
  the Switch select and its times; How it works and the `?` reference.
- `index.html`: the sun/moon, the Appearance rows, the grouped picker, the light tokens under `prefers-color-scheme`
  beside the Dark ones in the hashed inline stylesheet (the boot script is byte-identical; the style hash was re-written).
- Per-device state, all additive inside `meta.device` (COMPATIBILITY.md §5): `day`, `night`, `switch { mode, dayAt,
  nightAt }`, `slot`, `holdAuto`; the 1.1 keys stay in place. The document gains one optional field, `partner`, on a
  saved theme record (COMPATIBILITY.md §3: additive; the frozen v3 model strips it and the richer record wins the tie).

## The changelog

`whatsnew.json` carries 1.0 and later only, each version a `headline` (one sentence, ≤ 12 words) and up to three
`items` tagged New, Improved or Fixed (≤ 14 words, naming something the user can do or will notice). The 0.x entries
moved to `CHANGELOG.md`, which holds the full history for the record and never renders. The toast shows the headline
only, with "What's new" opening the About changelog; About renders the new shape under the version line, whose rules
(with the changelog's) now live in `styles.css`, the only sheet About loads. `test/features.test.js` enforces the
schema and the banned words.

## Before and after

Every surface at 1440×900 and 390×844, taken by `tools/shots.js` on the local transport (a dark system) before the
first change and after the last. Before is the left of each pair.

| surface | desktop before | desktop after | phone before | phone after |
|---|---|---|---|---|
| welcome | <img src="shots/1.2/before/desktop-welcome.png" width="300" alt="welcome, desktop, before"> | <img src="shots/1.2/after/desktop-welcome.png" width="300" alt="welcome, desktop, after"> | <img src="shots/1.2/before/phone-welcome.png" width="120" alt="welcome, phone, before"> | <img src="shots/1.2/after/phone-welcome.png" width="120" alt="welcome, phone, after"> |
| save-link | <img src="shots/1.2/before/desktop-save-link.png" width="300" alt="save-link, desktop, before"> | <img src="shots/1.2/after/desktop-save-link.png" width="300" alt="save-link, desktop, after"> | <img src="shots/1.2/before/phone-save-link.png" width="120" alt="save-link, phone, before"> | <img src="shots/1.2/after/phone-save-link.png" width="120" alt="save-link, phone, after"> |
| today | <img src="shots/1.2/before/desktop-today.png" width="300" alt="today, desktop, before"> | <img src="shots/1.2/after/desktop-today.png" width="300" alt="today, desktop, after"> | <img src="shots/1.2/before/phone-today.png" width="120" alt="today, phone, before"> | <img src="shots/1.2/after/phone-today.png" width="120" alt="today, phone, after"> |
| today-hover | <img src="shots/1.2/before/desktop-today-hover.png" width="300" alt="today-hover, desktop, before"> | <img src="shots/1.2/after/desktop-today-hover.png" width="300" alt="today-hover, desktop, after"> | — | — |
| flip-mid | — | <img src="shots/1.2/after/desktop-flip-mid.png" width="300" alt="flip-mid, desktop, after"> | — | <img src="shots/1.2/after/phone-flip-mid.png" width="120" alt="flip-mid, phone, after"> |
| flip-day | — | <img src="shots/1.2/after/desktop-flip-day.png" width="300" alt="flip-day, desktop, after"> | — | <img src="shots/1.2/after/phone-flip-day.png" width="120" alt="flip-day, phone, after"> |
| hint-today | <img src="shots/1.2/before/desktop-hint-today.png" width="300" alt="hint-today, desktop, before"> | <img src="shots/1.2/after/desktop-hint-today.png" width="300" alt="hint-today, desktop, after"> | <img src="shots/1.2/before/phone-hint-today.png" width="120" alt="hint-today, phone, before"> | <img src="shots/1.2/after/phone-hint-today.png" width="120" alt="hint-today, phone, after"> |
| everything | <img src="shots/1.2/before/desktop-everything.png" width="300" alt="everything, desktop, before"> | <img src="shots/1.2/after/desktop-everything.png" width="300" alt="everything, desktop, after"> | <img src="shots/1.2/before/phone-everything.png" width="120" alt="everything, phone, before"> | <img src="shots/1.2/after/phone-everything.png" width="120" alt="everything, phone, after"> |
| everything-hover | <img src="shots/1.2/before/desktop-everything-hover.png" width="300" alt="everything-hover, desktop, before"> | <img src="shots/1.2/after/desktop-everything-hover.png" width="300" alt="everything-hover, desktop, after"> | — | — |
| hint-drag | — | — | <img src="shots/1.2/before/phone-hint-drag.png" width="120" alt="hint-drag, phone, before"> | <img src="shots/1.2/after/phone-hint-drag.png" width="120" alt="hint-drag, phone, after"> |
| hint-menu | <img src="shots/1.2/before/desktop-hint-menu.png" width="300" alt="hint-menu, desktop, before"> | <img src="shots/1.2/after/desktop-hint-menu.png" width="300" alt="hint-menu, desktop, after"> | <img src="shots/1.2/before/phone-hint-menu.png" width="120" alt="hint-menu, phone, before"> | <img src="shots/1.2/after/phone-hint-menu.png" width="120" alt="hint-menu, phone, after"> |
| menu | <img src="shots/1.2/before/desktop-menu.png" width="300" alt="menu, desktop, before"> | <img src="shots/1.2/after/desktop-menu.png" width="300" alt="menu, desktop, after"> | <img src="shots/1.2/before/phone-menu.png" width="120" alt="menu, phone, before"> | <img src="shots/1.2/after/phone-menu.png" width="120" alt="menu, phone, after"> |
| line-menu | <img src="shots/1.2/before/desktop-line-menu.png" width="300" alt="line-menu, desktop, before"> | <img src="shots/1.2/after/desktop-line-menu.png" width="300" alt="line-menu, desktop, after"> | <img src="shots/1.2/before/phone-line-menu.png" width="120" alt="line-menu, phone, before"> | <img src="shots/1.2/after/phone-line-menu.png" width="120" alt="line-menu, phone, after"> |
| section-menu | <img src="shots/1.2/before/desktop-section-menu.png" width="300" alt="section-menu, desktop, before"> | <img src="shots/1.2/after/desktop-section-menu.png" width="300" alt="section-menu, desktop, after"> | <img src="shots/1.2/before/phone-section-menu.png" width="120" alt="section-menu, phone, before"> | <img src="shots/1.2/after/phone-section-menu.png" width="120" alt="section-menu, phone, after"> |
| settings | <img src="shots/1.2/before/desktop-settings.png" width="300" alt="settings, desktop, before"> | <img src="shots/1.2/after/desktop-settings.png" width="300" alt="settings, desktop, after"> | <img src="shots/1.2/before/phone-settings.png" width="120" alt="settings, phone, before"> | <img src="shots/1.2/after/phone-settings.png" width="120" alt="settings, phone, after"> |
| settings-advanced | <img src="shots/1.2/before/desktop-settings-advanced.png" width="300" alt="settings-advanced, desktop, before"> | <img src="shots/1.2/after/desktop-settings-advanced.png" width="300" alt="settings-advanced, desktop, after"> | <img src="shots/1.2/before/phone-settings-advanced.png" width="120" alt="settings-advanced, phone, before"> | <img src="shots/1.2/after/phone-settings-advanced.png" width="120" alt="settings-advanced, phone, after"> |
| appearance | — | <img src="shots/1.2/after/desktop-appearance.png" width="300" alt="appearance, desktop, after"> | — | <img src="shots/1.2/after/phone-appearance.png" width="120" alt="appearance, phone, after"> |
| theme | <img src="shots/1.2/before/desktop-theme.png" width="300" alt="theme, desktop, before"> | <img src="shots/1.2/after/desktop-theme.png" width="300" alt="theme, desktop, after"> | <img src="shots/1.2/before/phone-theme.png" width="120" alt="theme, phone, before"> | <img src="shots/1.2/after/phone-theme.png" width="120" alt="theme, phone, after"> |
| theme-partner | — | <img src="shots/1.2/after/desktop-theme-partner.png" width="300" alt="theme-partner, desktop, after"> | — | <img src="shots/1.2/after/phone-theme-partner.png" width="120" alt="theme-partner, phone, after"> |
| theme-builder | <img src="shots/1.2/before/desktop-theme-builder.png" width="300" alt="theme-builder, desktop, before"> | <img src="shots/1.2/after/desktop-theme-builder.png" width="300" alt="theme-builder, desktop, after"> | <img src="shots/1.2/before/phone-theme-builder.png" width="120" alt="theme-builder, phone, before"> | <img src="shots/1.2/after/phone-theme-builder.png" width="120" alt="theme-builder, phone, after"> |
| share | <img src="shots/1.2/before/desktop-share.png" width="300" alt="share, desktop, before"> | <img src="shots/1.2/after/desktop-share.png" width="300" alt="share, desktop, after"> | <img src="shots/1.2/before/phone-share.png" width="120" alt="share, phone, before"> | <img src="shots/1.2/after/phone-share.png" width="120" alt="share, phone, after"> |
| help | <img src="shots/1.2/before/desktop-help.png" width="300" alt="help, desktop, before"> | <img src="shots/1.2/after/desktop-help.png" width="300" alt="help, desktop, after"> | <img src="shots/1.2/before/phone-help.png" width="120" alt="help, phone, before"> | <img src="shots/1.2/after/phone-help.png" width="120" alt="help, phone, after"> |
| keys | <img src="shots/1.2/before/desktop-keys.png" width="300" alt="keys, desktop, before"> | <img src="shots/1.2/after/desktop-keys.png" width="300" alt="keys, desktop, after"> | <img src="shots/1.2/before/phone-keys.png" width="120" alt="keys, phone, before"> | <img src="shots/1.2/after/phone-keys.png" width="120" alt="keys, phone, after"> |
| idle | <img src="shots/1.2/before/desktop-idle.png" width="300" alt="idle, desktop, before"> | <img src="shots/1.2/after/desktop-idle.png" width="300" alt="idle, desktop, after"> | — | — |
| finale | <img src="shots/1.2/before/desktop-finale.png" width="300" alt="finale, desktop, before"> | <img src="shots/1.2/after/desktop-finale.png" width="300" alt="finale, desktop, after"> | <img src="shots/1.2/before/phone-finale.png" width="120" alt="finale, phone, before"> | <img src="shots/1.2/after/phone-finale.png" width="120" alt="finale, phone, after"> |
| about | <img src="shots/1.2/before/desktop-about.png" width="300" alt="about, desktop, before"> | <img src="shots/1.2/after/desktop-about.png" width="300" alt="about, desktop, after"> | <img src="shots/1.2/before/phone-about.png" width="120" alt="about, phone, before"> | <img src="shots/1.2/after/phone-about.png" width="120" alt="about, phone, after"> |

(— means the surface does not exist in that version: the flip, Appearance and the partner on offer are 1.2's; the 1.1 picker's Follow system chip is gone.)

## Verification results (1.2)

What was actually run, and what it found.

| suite | result |
|---|---|
| Node `test/theme.test.js` | 24 pass: 1.1's fourteen, plus every kit leaning day or night with a partner that names it back and the seven designed pairs in order; the two new kits meeting the contrast floors and sharing their partner's font pair and engine; the partner of a theme you make (same accent and pack, flipped base, a chosen pair kept and an automatic one re-picked, round-tripping to the original palette) with curated and `T2:` codes unchanged; the migration of a by-hand device (the theme in the slot matching its base, the partner or the default in the other, the old keys untouched, run once), of Follow system (both slots carried, the theme on screen unchanged on a dark and on a light system) and of the schedule (themes and times carried, the clock deciding as before, a schedule that wraps midnight); a fresh device's defaults; the hold rule under the system and under a schedule (a manual flip holds until the automation next switches, flipping back holds nothing, by hand nothing is held); the switch (off keeps what is on, on forgets a hold, an unknown mode is ignored); the crossfade's interpolation (perceptual midpoints, rgba hairlines, the swap at the midpoint, one token each) |
| Node `test/features.test.js` | 20 pass: 1.1's, with what's-new firing for a 1.1 device and for a 1.0 device on the 1.2 headline and never on version numbers; the changelog schema — 1.0 and later only, a one-sentence headline of twelve words or fewer, one to three items tagged New, Improved or Fixed of fourteen words or fewer, none of the banned words, `CHANGELOG.md` holding every version with no dates; the version in three places and the build in two |
| Node `test/compat.test.js` | 7 pass: 1.1's six, plus a saved theme's `partner` field through the frozen v3 model (stripped by the old client, kept by normalize, the richer record winning the tie on the way back) |
| Node `test/model.test.js`, `crypto.test.js`, `sync.test.js`, `sound.test.js` | 22, 9, 13 and 8 pass, untouched (the pinned derivation vectors included) |
| Browser suite `tools/e2e4.js` (Chrome 152, local transport, 1440×900 mouse and 390×844 touch, a dark system unless a test says otherwise) | 78 pass, zero page errors, CSP violations or third-party requests, on the final code (three full passes: the first two turned up only test-helper slips, and the after screenshots turned up the two fixes above): everything 1.1 checked, updated for the model (the rail with the sun/moon between the views and Share, 44 px on touch; `T` flipping instead of opening the picker; Appearance's three rows and the Switch select in place of the two toggles; the builder reached through Appearance → Night theme; a 1.0 device's toast being the 1.2 headline; About's version and tagged changelog with a styled version line), plus 1.2's own: the flip crossfading the whole palette (an in-between ink mid-flip, the glow dipping, the rows' transitions off and the text at the token, the incoming theme's tick counted, the glyph and tooltip flipped, `theme-color` and the boot cache following, the fonts swapping at the midpoint on a Paper day; instant under reduced motion); With the system by an emulated colour scheme (the hold, its survival of a reload, its end when the system changes, the automation resuming, the Switch row's wording, By hand keeping what is on and ignoring the system); On a schedule by Playwright's clock (the minute tick switching at 16:31, a manual flip holding through the evening and spent at the schedule's own switch the next morning, the automation resuming); the picker for one slot (the groups in pair order, the tags, the marked swatch, a night kit chosen for Day, "Use Paper for Night" under the group it came from and applied in one tap, nothing offered when the other slot already holds the partner, the slot's theme staying on when the picker closes, Settings → Sound naming the slot's theme's pack); the builder (Make its partner saving two linked records with the chosen pair kept and the base flipped, filling the slot and offering the partner, a second press finding the link instead of saving a third, a saved theme chosen from Yours offering its partner); `T`, `Shift+T` and ⋯ → Theme (Appearance at its top, wherever Settings was left); a 1.1 device's three migrations (Follow system with the theme on screen unchanged and the old keys left in place, the schedule with its times, by hand with the partner in the other slot) with the toast the only new thing and no hint, sheet or sound; a fresh device on a light system painting Light from the first frame; zero page errors, CSP violations and third-party requests |
| Real Supabase `tools/realsync4.js` | 6 pass, the suite unchanged: envelopes on the wire, a view link's put refused, the unchanged poll still **29 bytes**, presence, delete and undo, add from a URL; the seed list 617 bytes encrypted, the realistic list 6,549 bytes |
| Lighthouse 12 (Chrome 152, gzip like GitHub Pages, the same harness and machine for both, an untouched clone of `main` as the 1.1 baseline, two rounds each) | **1.1 baseline** (the untouched clone of `main`): desktop 100 / 100 / 100 in both rounds (FCP 0.30–0.38 s, LCP 0.41–0.42 s); mobile cold 98, 99, 98, 98 (FCP 1.29–1.66 s, LCP 1.83–1.89 s); mobile warm 98, 99, 98, 99 (FCP 1.28–1.66 s, LCP 1.82–1.88 s). **1.2**: desktop 100 / 100 / 100 in both rounds (FCP 0.30 s, LCP 0.41 s); mobile cold 98, 98, 98, 98 (FCP 1.29–1.51 s, LCP 1.82–1.83 s); mobile warm 99, 99, 98, 99 (FCP 1.29–1.66 s, LCP 1.82–1.88 s). Performance / accessibility / best practices; TBT ≤ 8 ms everywhere. The harness falls into one of two modes on either build — a first paint at 1.29 s with a 0.07 layout shift (Lato arriving after the paint), scored 98, or a paint at 1.66 s with none, scored 99 — and both builds land in both; 1.2 matched the baseline mode for mode (the first cold rounds to the millisecond), the cold medians are the same (98) and the warm median is a point better (99 against 98.5): not worse, on eight mobile runs a side. The six extra kilobytes on the wire (146 KB against 140) sit inside the simulation's granularity. Lighthouse 12 has no installability audit; the install path was not re-checked in this build (the head script and the manifest are byte-identical to 1.1's) |
| Sizes on the critical path (gzip) | `styles.css` 9.2 KB (1.1: 8.8), `app.js` 35.5 KB (34.2), `index.html` 9.1 KB (8.4, the light tokens for the first frame and the new markup), `theme.js` 12.4 KB (8.9, two kits and the slot logic); off the critical path `panels.css` 4.0 KB (3.9) and `panels.js` 16.4 KB (14.9). Lighthouse's mobile page weight 146 KB against 140 |

---

# Today's Five 1.3 — plan

The problem this round solves: a texted link looked like spam, the first thing a person saw after tapping Start
was a QR code, and nobody understood that the edit link is a password. Plus one feature, shuffle in one-thing mode.
Nothing on the server changes; the domain stays as it is. The earlier sections still hold unless this one
overrides them; the calls made where the brief left things open are in DECISIONS.md, "1.3 decisions".

## What changed, by surface

| surface | 1.2 | 1.3 |
|---|---|---|
| a texted link | a bare URL | a card: `og:title`, a one-sentence `og:description`, `og:image` (`icons/og.png`, 1200×630, the Today screen in Dark with the title, 34 KB), `og:url`, `twitter:card`, a canonical link — in the static HTML of `index.html` and `about.html`, which is all a previewer reads |
| the welcome | the title, three sentences, Start a list, Paste a link | the title and one sentence above a live list of three lines (the Today renderer on a local document: a tap strikes, knocks and throws confetti; nothing stored, no secret, nothing on the server) and, below it, Keep this list once a line of your own is added or all three are crossed off, Skip — start my list, Already have a list? Paste your link, and How it works & privacy. No rail, no footer, no tour, no hint, no toast. A link still opens its list as before |
| Keep | Start a list made the seed list | the same document under a real id, lines and check marks included, through the ordinary create path; the save sheet follows |
| Save your link | one sheet: the sentence, a QR, the link, Copy, Share…, three hints, I've saved it; closing it counted as saved | one sentence — this link is your list's only key, anyone holding it can open the list, and there is no spare — then the lead the device calls for: Safari on a phone leads with Add to Home Screen (two steps; the icon carries the link), then Copy, no QR; the installed app says the icon holds the link, with Copy as a backup; a desktop leads with Bookmark this page (⌘D / Ctrl+D), then Copy, then Open it on your phone with the QR. Copy and I've saved it count as saved; until then ⋯ carries a Save your link row with a dot and the Share sheet repeats the key line. Devices from before are grandfathered on update |
| Share | Edit link / View link tabs, a QR for either, Copy, Share…, Rotate links, a "fair warning" line | the View link first and by default (view only beside it; shows the list and can't change it — a second screen, or someone who should watch; check-offs from your other devices show up with the sound and the confetti; the QR on the desktop), Copy grabs it first; the Private link last, under a warning line in the danger colour, with the key sentence, the redirect to the View link, Copy private link and New keys (the old links stop working everywhere); Tell a friend apart at the bottom, handing the system share sheet a two-sentence note about the app and the bare app URL |
| the names | edit link, view link, Rotate links, "View only" | Private link, View link (view only), New keys, everywhere: the sheets, How it works (a Second screen example beside Let someone watch), About, Settings › Advanced, the refusal of an add on a View link, the pill ("View link · view only" on the desktop, "View only" on the phone). No URL changed |
| one-thing mode | the top undone line | plus shuffle: a different undone line, never the same twice in a row, never a reorder, held until crossed off or shuffled again, the top line back after a check-off, a wobble with one line left. `S`, a ↻ beside the count that exists only in the mode, and a shake of the phone (asked once with Allow; declined means ↻ only). The line slides out and the next slides in with the theme's tick and a haptic; instant under reduced motion |
| ⋯ | nine rows | nine rows, with a Save your link row above them only until the link is saved; Share this list on both devices |
| the changelog | 1.2 | 1.3 — A better first minute: the welcome you can try, the links named for what they do with the save sheet fitting the device, shuffle |

## Structure of the change

- `app.js`: `demo` (the welcome's live document), `showWelcome` rendering it through `setView`/`renderToday`, `demoNudge` and `keepDemo`, `afterChange` skipping storage in the demo, the keys and hints held back on the welcome; `unsavedEntry` and the ⋯ row; `shuffledId` in `renderToday`, `shuffle`, the ↻, the `S` key, `onMotion`/`startMotion`/`shakeReady` and the permission hint; the grandfathering on the first open of 1.3; the refusal toast's names.
- `panels.js`: the Share sheet (the View block, the Private block, Tell a friend, `friendNote`), the save sheet by device (`showSaveLink`, `markSaved`), New keys through the save sheet, How it works and the reference with the names and shuffle, Settings › Advanced's wording.
- `index.html`: the tags and the canonical link, the welcome as title + sentence with `#demo-foot` below the list, the ↻ beside the count, the pill, the ⋯ Save row, the two sheets rebuilt, the shake hint bar. `about.html`: the tags, the Sharing section. `model.js`: three seed lines. `styles.css` / `panels.css`: the welcome's layout by `order`, the ↻, the shuffle animations, the hint bar, the sheets' blocks and leads.
- `tools/og.html` + `tools/og.mjs`: the card and its renderer; `icons/og.png` the result. `tools/e2e4.js`: the 1.2 checks updated for the welcome and the names, plus the 1.3 checks. `tools/shots.js`: the welcome played, the save sheet's desktop expander, the Share sheet's foot, one-thing mode.
- Per-device state, additive inside `meta.device`: `savedGrandfathered`, `shake`; the registry's `linkSaved` keeps its meaning with a stricter setter. No document field changed; no server call changed; no URL changed (COMPATIBILITY.md §1, §3, §4).

## Before and after

Every surface at 1440×900 and 390×844, taken by `tools/shots.js` on the local transport (a dark system) before the
first change and after the last. Before is the left of each pair.

| surface | desktop before | desktop after | phone before | phone after |
|---|---|---|---|---|
| welcome | <img src="shots/1.3/before/desktop-welcome.png" width="300" alt="welcome, desktop, before"> | <img src="shots/1.3/after/desktop-welcome.png" width="300" alt="welcome, desktop, after"> | <img src="shots/1.3/before/phone-welcome.png" width="120" alt="welcome, phone, before"> | <img src="shots/1.3/after/phone-welcome.png" width="120" alt="welcome, phone, after"> |
| welcome-played | — | <img src="shots/1.3/after/desktop-welcome-played.png" width="300" alt="welcome-played, desktop, after"> | — | <img src="shots/1.3/after/phone-welcome-played.png" width="120" alt="welcome-played, phone, after"> |
| save-link | <img src="shots/1.3/before/desktop-save-link.png" width="300" alt="save-link, desktop, before"> | <img src="shots/1.3/after/desktop-save-link.png" width="300" alt="save-link, desktop, after"> | <img src="shots/1.3/before/phone-save-link.png" width="120" alt="save-link, phone, before"> | <img src="shots/1.3/after/phone-save-link.png" width="120" alt="save-link, phone, after"> |
| save-link-phone | — | <img src="shots/1.3/after/desktop-save-link-phone.png" width="300" alt="save-link-phone, desktop, after"> | — | — |
| today | <img src="shots/1.3/before/desktop-today.png" width="300" alt="today, desktop, before"> | <img src="shots/1.3/after/desktop-today.png" width="300" alt="today, desktop, after"> | <img src="shots/1.3/before/phone-today.png" width="120" alt="today, phone, before"> | <img src="shots/1.3/after/phone-today.png" width="120" alt="today, phone, after"> |
| today-hover | <img src="shots/1.3/before/desktop-today-hover.png" width="300" alt="today-hover, desktop, before"> | <img src="shots/1.3/after/desktop-today-hover.png" width="300" alt="today-hover, desktop, after"> | — | — |
| one-thing | — | <img src="shots/1.3/after/desktop-one-thing.png" width="300" alt="one-thing, desktop, after"> | — | <img src="shots/1.3/after/phone-one-thing.png" width="120" alt="one-thing, phone, after"> |
| flip-mid | <img src="shots/1.3/before/desktop-flip-mid.png" width="300" alt="flip-mid, desktop, before"> | <img src="shots/1.3/after/desktop-flip-mid.png" width="300" alt="flip-mid, desktop, after"> | <img src="shots/1.3/before/phone-flip-mid.png" width="120" alt="flip-mid, phone, before"> | <img src="shots/1.3/after/phone-flip-mid.png" width="120" alt="flip-mid, phone, after"> |
| flip-day | <img src="shots/1.3/before/desktop-flip-day.png" width="300" alt="flip-day, desktop, before"> | <img src="shots/1.3/after/desktop-flip-day.png" width="300" alt="flip-day, desktop, after"> | <img src="shots/1.3/before/phone-flip-day.png" width="120" alt="flip-day, phone, before"> | <img src="shots/1.3/after/phone-flip-day.png" width="120" alt="flip-day, phone, after"> |
| hint-today | <img src="shots/1.3/before/desktop-hint-today.png" width="300" alt="hint-today, desktop, before"> | <img src="shots/1.3/after/desktop-hint-today.png" width="300" alt="hint-today, desktop, after"> | <img src="shots/1.3/before/phone-hint-today.png" width="120" alt="hint-today, phone, before"> | <img src="shots/1.3/after/phone-hint-today.png" width="120" alt="hint-today, phone, after"> |
| everything | <img src="shots/1.3/before/desktop-everything.png" width="300" alt="everything, desktop, before"> | <img src="shots/1.3/after/desktop-everything.png" width="300" alt="everything, desktop, after"> | <img src="shots/1.3/before/phone-everything.png" width="120" alt="everything, phone, before"> | <img src="shots/1.3/after/phone-everything.png" width="120" alt="everything, phone, after"> |
| everything-hover | <img src="shots/1.3/before/desktop-everything-hover.png" width="300" alt="everything-hover, desktop, before"> | <img src="shots/1.3/after/desktop-everything-hover.png" width="300" alt="everything-hover, desktop, after"> | — | — |
| hint-drag | — | — | <img src="shots/1.3/before/phone-hint-drag.png" width="120" alt="hint-drag, phone, before"> | <img src="shots/1.3/after/phone-hint-drag.png" width="120" alt="hint-drag, phone, after"> |
| hint-menu | <img src="shots/1.3/before/desktop-hint-menu.png" width="300" alt="hint-menu, desktop, before"> | <img src="shots/1.3/after/desktop-hint-menu.png" width="300" alt="hint-menu, desktop, after"> | <img src="shots/1.3/before/phone-hint-menu.png" width="120" alt="hint-menu, phone, before"> | <img src="shots/1.3/after/phone-hint-menu.png" width="120" alt="hint-menu, phone, after"> |
| menu | <img src="shots/1.3/before/desktop-menu.png" width="300" alt="menu, desktop, before"> | <img src="shots/1.3/after/desktop-menu.png" width="300" alt="menu, desktop, after"> | <img src="shots/1.3/before/phone-menu.png" width="120" alt="menu, phone, before"> | <img src="shots/1.3/after/phone-menu.png" width="120" alt="menu, phone, after"> |
| line-menu | <img src="shots/1.3/before/desktop-line-menu.png" width="300" alt="line-menu, desktop, before"> | <img src="shots/1.3/after/desktop-line-menu.png" width="300" alt="line-menu, desktop, after"> | <img src="shots/1.3/before/phone-line-menu.png" width="120" alt="line-menu, phone, before"> | <img src="shots/1.3/after/phone-line-menu.png" width="120" alt="line-menu, phone, after"> |
| section-menu | <img src="shots/1.3/before/desktop-section-menu.png" width="300" alt="section-menu, desktop, before"> | <img src="shots/1.3/after/desktop-section-menu.png" width="300" alt="section-menu, desktop, after"> | <img src="shots/1.3/before/phone-section-menu.png" width="120" alt="section-menu, phone, before"> | <img src="shots/1.3/after/phone-section-menu.png" width="120" alt="section-menu, phone, after"> |
| settings | <img src="shots/1.3/before/desktop-settings.png" width="300" alt="settings, desktop, before"> | <img src="shots/1.3/after/desktop-settings.png" width="300" alt="settings, desktop, after"> | <img src="shots/1.3/before/phone-settings.png" width="120" alt="settings, phone, before"> | <img src="shots/1.3/after/phone-settings.png" width="120" alt="settings, phone, after"> |
| settings-advanced | <img src="shots/1.3/before/desktop-settings-advanced.png" width="300" alt="settings-advanced, desktop, before"> | <img src="shots/1.3/after/desktop-settings-advanced.png" width="300" alt="settings-advanced, desktop, after"> | <img src="shots/1.3/before/phone-settings-advanced.png" width="120" alt="settings-advanced, phone, before"> | <img src="shots/1.3/after/phone-settings-advanced.png" width="120" alt="settings-advanced, phone, after"> |
| appearance | <img src="shots/1.3/before/desktop-appearance.png" width="300" alt="appearance, desktop, before"> | <img src="shots/1.3/after/desktop-appearance.png" width="300" alt="appearance, desktop, after"> | <img src="shots/1.3/before/phone-appearance.png" width="120" alt="appearance, phone, before"> | <img src="shots/1.3/after/phone-appearance.png" width="120" alt="appearance, phone, after"> |
| theme | <img src="shots/1.3/before/desktop-theme.png" width="300" alt="theme, desktop, before"> | <img src="shots/1.3/after/desktop-theme.png" width="300" alt="theme, desktop, after"> | <img src="shots/1.3/before/phone-theme.png" width="120" alt="theme, phone, before"> | <img src="shots/1.3/after/phone-theme.png" width="120" alt="theme, phone, after"> |
| theme-partner | <img src="shots/1.3/before/desktop-theme-partner.png" width="300" alt="theme-partner, desktop, before"> | <img src="shots/1.3/after/desktop-theme-partner.png" width="300" alt="theme-partner, desktop, after"> | <img src="shots/1.3/before/phone-theme-partner.png" width="120" alt="theme-partner, phone, before"> | <img src="shots/1.3/after/phone-theme-partner.png" width="120" alt="theme-partner, phone, after"> |
| theme-builder | <img src="shots/1.3/before/desktop-theme-builder.png" width="300" alt="theme-builder, desktop, before"> | <img src="shots/1.3/after/desktop-theme-builder.png" width="300" alt="theme-builder, desktop, after"> | <img src="shots/1.3/before/phone-theme-builder.png" width="120" alt="theme-builder, phone, before"> | <img src="shots/1.3/after/phone-theme-builder.png" width="120" alt="theme-builder, phone, after"> |
| share | <img src="shots/1.3/before/desktop-share.png" width="300" alt="share, desktop, before"> | <img src="shots/1.3/after/desktop-share.png" width="300" alt="share, desktop, after"> | <img src="shots/1.3/before/phone-share.png" width="120" alt="share, phone, before"> | <img src="shots/1.3/after/phone-share.png" width="120" alt="share, phone, after"> |
| share-bottom | — | <img src="shots/1.3/after/desktop-share-bottom.png" width="300" alt="share-bottom, desktop, after"> | — | <img src="shots/1.3/after/phone-share-bottom.png" width="120" alt="share-bottom, phone, after"> |
| help | <img src="shots/1.3/before/desktop-help.png" width="300" alt="help, desktop, before"> | <img src="shots/1.3/after/desktop-help.png" width="300" alt="help, desktop, after"> | <img src="shots/1.3/before/phone-help.png" width="120" alt="help, phone, before"> | <img src="shots/1.3/after/phone-help.png" width="120" alt="help, phone, after"> |
| keys | <img src="shots/1.3/before/desktop-keys.png" width="300" alt="keys, desktop, before"> | <img src="shots/1.3/after/desktop-keys.png" width="300" alt="keys, desktop, after"> | <img src="shots/1.3/before/phone-keys.png" width="120" alt="keys, phone, before"> | <img src="shots/1.3/after/phone-keys.png" width="120" alt="keys, phone, after"> |
| idle | <img src="shots/1.3/before/desktop-idle.png" width="300" alt="idle, desktop, before"> | <img src="shots/1.3/after/desktop-idle.png" width="300" alt="idle, desktop, after"> | — | — |
| finale | <img src="shots/1.3/before/desktop-finale.png" width="300" alt="finale, desktop, before"> | <img src="shots/1.3/after/desktop-finale.png" width="300" alt="finale, desktop, after"> | <img src="shots/1.3/before/phone-finale.png" width="120" alt="finale, phone, before"> | <img src="shots/1.3/after/phone-finale.png" width="120" alt="finale, phone, after"> |
| about | <img src="shots/1.3/before/desktop-about.png" width="300" alt="about, desktop, before"> | <img src="shots/1.3/after/desktop-about.png" width="300" alt="about, desktop, after"> | <img src="shots/1.3/before/phone-about.png" width="120" alt="about, phone, before"> | <img src="shots/1.3/after/phone-about.png" width="120" alt="about, phone, after"> |

(— means the surface does not exist in that version: the played welcome, the save sheet's phone expander, the bottom of the Share sheet and one-thing mode with its ↻ are 1.3's; 1.2's welcome had no live lines to play.)

## Verification results (1.3)

What was actually run, and what it found.

What was actually run, and what it found.

| suite | result |
|---|---|
| Node `test/model.test.js` | 22 pass: 1.2's, with the seed rewritten for the welcome — three lines of 32 characters or fewer, the last one the payoff, every one on Today and undone, and the same document normalized under a new id the way Keep does it (the lines and their marks carried over, `id` and `created` new); the merge test builds its own five lines |
| Node `test/sync.test.js` | 13 pass, the three-line seed in place of five |
| Node `test/features.test.js` | 20 pass: what's-new fires for a 1.2 device and for a 1.0 device on the 1.3 headline ("A better first minute.") and never on version numbers; the changelog schema holds for 1.3 (headline of twelve words or fewer, three items tagged New, Improved, New, of fourteen words or fewer, none of the banned words); `CHANGELOG.md` holds 1.3 with no date; the version in three places and the build in two |
| Node `test/theme.test.js`, `crypto.test.js`, `sound.test.js`, `compat.test.js` | 24, 9, 8 and 7 pass, untouched (the pinned derivation vectors included) |
| Browser suite `tools/e2e4.js` (Chrome 152, local transport, 1440×900 mouse and 390×844 touch, a dark system unless a test says otherwise) | 99 pass, zero page errors, CSP violations or third-party requests, on the final code. 1.2's checks updated for three seed lines and the new names (the ⋯ row reads "Share this list" on both devices; the toast and About carry 1.3). New: the welcome is a live list — three lines, a tap strikes with the knock and the confetti, the third check-off throws the finale, a line of one's own is kept, nothing in storage and nothing on the wire until Keep, no rail, footer, hint or toast; Keep carries the lines and their marks into a new list and shows the save sheet; Skip starts a fresh list; Paste opens a list from a link; a link arrival never sees the welcome. The save sheet by device (init scripts for `navigator.platform`, `navigator.standalone` and an Android UA): a phone in Safari leads with Add to Home Screen in two steps and no QR, an Android phone with its browser's menu, the installed app with "this icon holds your link", a desktop with Bookmark this page (⌘D or Ctrl+D), the link, Copy and the QR behind Open it on your phone; Copy and I've saved it count as saved, closing does not; ⋯ carries Save your link with a dot until then and the Share sheet repeats the key line; a device from 1.2 is grandfathered on its first open of 1.3 and never sees the row; New keys marks the new list unsaved and reopens the sheet. Tell a friend hands `navigator.share` the note and the bare app URL, never a list link, and the clipboard gets both when the system sheet is missing. The names everywhere (Share, save sheet, How it works with the Second screen example, About, Settings › Advanced, the refusal toast, the "View link · view only" pill); Share defaults to the View link and Copy copies it; the Private link sits last under the warning. Shuffle by `S` and ↻: a different undone line, never the same twice in ten goes, no reorder, the theme's tick each time, the last line wobbles, a check-off puts the top line back, nothing outside the mode, nothing with a panel open; the shake: the hint once, Allow starts the listener, a delta over 15 m/s² shuffles, a walk does not, one a second, ignored with a panel open, remembered across opens, × means ↻ only; the two hints stack with the toast above both; the create limit at Keep leaves the list on the device with the "busy" dot. The OG tags and the canonical link in both pages' static HTML, with `icons/og.png` answering 200 as a 1200×630 PNG |
| Real Supabase `tools/realsync4.js` | 6 pass, the suite unchanged but for the seed count: envelopes on the wire, a view link's put refused with 403, the unchanged poll still **29 bytes**, presence between two sockets, delete everywhere then undo under the same link, add from a URL end to end; the three-line seed is 497 bytes encrypted (five lines were 617), the realistic list 6,501 bytes. It ran last, before the merge: the server allows 12 new lists an hour and 40 a day per address, and the day's runs had spent them (the first run failed on the old five-line expectation after three passes, the second and third on the limit, the staged 1.2 device and the probes counted too); Price cleared this address's rows from `private.creates` in the SQL editor and the suite passed at once |
| Lighthouse 12 (Chrome 152, gzip like GitHub Pages, the same harness and machine for both, an untouched clone of `main` at 1.2 build 54 as the baseline, two rounds each, in sequence on a quiet machine) | **1.2 baseline** (the untouched clone of `main` at build 54, three rounds): desktop 100 / 100 / 100 (FCP 0.34–0.38 s, LCP 0.41–0.46 s); mobile cold 98, 99, 99 (FCP 1.65–1.72 s, LCP 1.88–1.94 s, CLS 0.002); mobile warm 94, 98, 99 (FCP 1.28–1.66 s, LCP 1.82–1.96 s; the 94 is a round with 230 ms of blocking time while a commit and a push ran alongside, plus the 0.07 layout shift the welcome had whenever the first paint beat the app). **1.3 as first measured**: mobile cold 98, 98 with the LCP about 100 ms behind (2.04 s) and 165 KB on the wire against 146 — the welcome's foot was pulling Lato 400 in; with the font fixed and the first paint earlier, 96 and 97 with a 0.10 layout shift (the rail painting, then leaving). Both fixed (DECISIONS.md, The first minute). **1.3 final** (two rounds on a quiet machine): desktop 100 / 100 / 100 (FCP 0.35 s, LCP 0.41 s); mobile cold **99, 99** (FCP 1.51 s, LCP 1.82 s, TBT 0, CLS 0.001); mobile warm **99, 99** (FCP 1.70–1.71 s, LCP 1.85–1.86 s, CLS 0.001); 151 KB on the wire. Accessibility and best practices 100 throughout. Cold and warm are not worse than 1.2's, and the LCP is 60–120 ms earlier |
| Sizes on the critical path (gzip) | `index.html` 10.1 KB (1.2: 8.9 — the card tags, the welcome's foot, the rebuilt Share and save sheets, the boot script's guess), `styles.css` 10.0 KB (9.1), `app.js` 37.3 KB (34.8), `theme.js` 12.1 KB (unchanged), `model.js` 11.1 KB (unchanged); off the critical path `panels.css` 4.4 KB (3.9) and `panels.js` 17.1 KB (16.0). `icons/og.png` is 34 KB, fetched only by link previews and never precached |
| The card (`tools/og.mjs`) | `icons/og.png` rendered from `tools/og.html` with Playwright and quantized with sharp: 1200×630, 8-bit palette, 34 KB; looked at — the Night list with a struck line and the name |
| iOS Simulator (iPhone 16 Pro, iOS 18.1, Safari, the local build through `safaridriver`) | The welcome as a live list with no rail; a DOM click strikes the first line with the knock and the confetti and nothing in storage; Skip makes the list and the save sheet leads with "Add it to your Home Screen — Tap Share, then Add to Home Screen", Copy link and I've saved it, no QR and no link field; the ⋯ row gone after I've saved it; one-thing mode shows the ↻ beside the count and the "Shake to shuffle?" bar under the toast, not behind it (the first run caught them overlapping, fixed); Allow raised iOS's "Would Like to Access Motion and Orientation" prompt. Not reached: the prompt's own Allow (a native sheet, nothing available could tap it), so the shake itself, and the Home Screen app's save sheet and shake — the browser suite covers those with mocks |

## Live checks (1.3)

Against https://54kz2vzbdw-code.github.io/todays-five/ with the installed Chrome and persistent profiles, after `main` moved to build 59 at 16:59; Pages served `tf-v1.3` on the first poll.

- **The static HTML carries the card**: `og:type`, `og:title`, `og:description`, `og:url`, an absolute `og:image` with its width, height and alt, `twitter:card` of `summary_large_image` and the canonical link on both pages, read with plain fetches; `icons/og.png` answers 200 as `image/png`, 34,899 bytes.
- **A 1.2 device** (a profile that made its list on the live 1.2 at build 54 — its create had come back "busy", so the list sat at rev 0): opens 1.3 on the first navigation with the same list (five lines, one done), synced at rev 1 now that the log is clear, and the toast "New in 1.3: A better first minute." is the only new thing — no save sheet, no Save your link row (grandfathered), no shake hint, no install hint, no mark, no dialog, the rail as before, Dark still on with the system switch. ⋯ has its nine rows; Share shows the View link first, the Private link under the warning and Tell a friend last; a second open shows no toast; Settings reads 1.3 (build 59); then deleted everywhere.
- **A fresh device**: the welcome is the three live lines with no rail and no Keep; crossing all three off plays three knocks, the finale and three bursts with nothing in storage and no list anywhere; Keep appears; the save sheet leads with Bookmark this page (⌘D) with Copy and Open it on your phone behind it; Copy keeps the list — three lines with their three marks, synced at rev 1, saved, no toast; the server row is an envelope (`v`, `z`, `ct`, `iv`, `alg`; 501 bytes); About reads Version 1.3 (build 59) with the four headlines; then deleted everywhere. No page errors on either device.
- **The record**: build 60 stamped the live checks and changed nothing else.

## Hotfix — build 61: a page open across a deploy

Price's phone had the app open through the deploy; its first panel afterwards fetched 1.3's `panels.js` into 1.2's markup (the shell is network-first, the panels load on first use), the wiring threw on missing elements, and Share — every panel — answered "Couldn't load that part of the app—check the connection and try again" until the app was closed and reopened. Reproduced with a 1.2 page (the baseline clone) routed to 1.3's `panels.js`: the save sheet and Share both failed with that toast and "Cannot read properties of null (reading 'addEventListener')". A fresh load of the live 1.3 in the simulator's Safari opened Share with all three blocks and no errors.

The fix: `<html data-build>` says the page's build, `panels.js` says the build its wiring expects, and on a mismatch `init` reloads the page once (remembered in `sessionStorage`, so never a loop); app.js holds the failure toast while the reload is on its way. The features test checks the build in four places now; the browser suite opens a panel on a page marked as another build and sees one reload, no toast, and no second reload afterwards.

Run before the deploy: the seven Node suites (22, 24, 9, 13, 8, 20, 7 — the features test now checks the build in four places); the browser suite at both viewports, 101 tests with 100 passes and one failure in 1.2's crossfade timing check (a 400 ms sampling of the row colour mid-flip, untouched code) that passed twice on its own straight after; the real-backend suite was not re-run — the hour's creates were spent by the release's own run and live checks, and the hotfix touches no wire code since that run's six passes at 16:57. Lighthouse and the sizes were not re-run: the change is one attribute on `<html>`, a guard in `panels.js` and a test on the loader's toast. Live, build 61 at 17:47 (Pages served it on the second poll; the local transport, so nothing was created on the server): on both viewports a page marked as build 60 reloaded itself once on its first panel with no failure toast, remembered the reload, and opened Share with all three blocks; the same mismatch on a page that had already reloaded opened its panels with no second reload. A fresh load of the live site in the simulator's Safari opened Share with all three blocks and no errors. The record commit stamps build 62 and changes nothing else.

---

# Today's Five 1.4 — plan

Mine and shared with me, a Share sheet by intent, a way back inside panels, iOS 26, and pages open across a deploy. Every earlier decision stands; the calls made here are in DECISIONS.md under "1.4 decisions". Nothing on the server changes; links, keys and the document shape are untouched (origin and nickname are device-local).

## What changed, by surface

| surface | 1.3 | 1.4 |
|---|---|---|
| A link with no hint on a device that does not hold the list | opens at once | one question first — Whose list is this? Mine, from another device · Someone else's — one tap, not cancelable; hinted links (`/mine`, `/shared`) skip it; view links ask |
| The rail | the view-only pill | a Shared pill beside it for a list shared with this device; a shared list goes by its nickname |
| Lists | one flat menu | My lists and Shared with me once there is something to group; › opens a list's detail (Open, Rename or Nickname, It's mine after all, Remove from this device) |
| ⋯ | nine rows | the same; Delete everywhere hidden on a shared list |
| Share | View link first, Private link last, Tell a friend | Open on my other device (Private link marked as mine, code then Copy) · Show it somewhere (View link) · Let someone edit (Private link marked as shared, under the warning, Copy only) · Tell a friend · New keys last, never on a shared list; the system sheet is called in the tap's own tick; the fallback shows the note |
| Every panel | × only | ‹ Back on a sub-panel returns to its parent with scroll and values, × closes the stack, Escape goes back a level, one history entry per level, an edge swipe on the phone |
| Save your link (phone) | Tap Share, then Add to Home Screen | three steps with glyphs: Tap Share (the square with the arrow) — if you don't see it, tap ⋯ first · Scroll down · Add to Home Screen |
| Home Screen | "Five" under the icon | "Today's Five" |
| A page open across a deploy | reloads once on its first panel | keeps loading its own build's modules from its own cache; reloads only when a module cannot be served, after flushing, and comes back to its view with the panel it asked for |
| How it works | the links | plus Mine and shared with me, and the Share blocks |

## Structure of the change

- `model.js`: `parseHash` reads `/mine` and `/shared` (and matches the id as a prefix, per COMPATIBILITY.md §1), `hintLink`, `hashHasExtras`, `normalizeRegistry`.
- `app.js`: the registry migrated on read; `pendingOrigin` and `askWhose`; `registerList` with an origin; the nickname in the rail; the Shared pill; the ⋯ row and the save nudges gated; the panel stack (`showPanel`, `goBack`, `popPanel`, `closeAll`, the history entries, the edge swipe); every lazy import pinned to `BUILD`; the reload path's flush and `tf/resume`.
- `panels.js`: the Share sheet by intent with the synchronous share; Lists grouped with a detail sub-panel, nicknames, the origin switch; the openers for Back; the three-step save lead; How it works; `PANELS_BUILD` and the reload path.
- `index.html`: the question, the pill, the four Share blocks and the keys block, the steps with inline SVG glyphs, a list's detail, `short_name`, `data-build`.
- `sw.js`: a cache per build, `?v=<build>` answered from that build's cache, the previous generation kept.
- `sound.js`, `sync.js`: their lazy modules pinned to the build.
- `COMPATIBILITY.md` §6 rewritten; `whatsnew.json`, `CHANGELOG.md`, `README.md`; the Node, browser and screenshot suites.

## Before and after

| surface | desktop before | desktop after | phone before | phone after |
|---|---|---|---|---|
| welcome | <img src="shots/1.4/before/desktop-welcome.png" width="300" alt="welcome, desktop, before"> | <img src="shots/1.4/after/desktop-welcome.png" width="300" alt="welcome, desktop, after"> | <img src="shots/1.4/before/phone-welcome.png" width="120" alt="welcome, phone, before"> | <img src="shots/1.4/after/phone-welcome.png" width="120" alt="welcome, phone, after"> |
| welcome-played | <img src="shots/1.4/before/desktop-welcome-played.png" width="300" alt="welcome-played, desktop, before"> | <img src="shots/1.4/after/desktop-welcome-played.png" width="300" alt="welcome-played, desktop, after"> | <img src="shots/1.4/before/phone-welcome-played.png" width="120" alt="welcome-played, phone, before"> | <img src="shots/1.4/after/phone-welcome-played.png" width="120" alt="welcome-played, phone, after"> |
| whose | — | <img src="shots/1.4/after/desktop-whose.png" width="300" alt="whose, desktop, after"> | — | <img src="shots/1.4/after/phone-whose.png" width="120" alt="whose, phone, after"> |
| save-link | <img src="shots/1.4/before/desktop-save-link.png" width="300" alt="save-link, desktop, before"> | <img src="shots/1.4/after/desktop-save-link.png" width="300" alt="save-link, desktop, after"> | <img src="shots/1.4/before/phone-save-link.png" width="120" alt="save-link, phone, before"> | <img src="shots/1.4/after/phone-save-link.png" width="120" alt="save-link, phone, after"> |
| save-link-phone | <img src="shots/1.4/before/desktop-save-link-phone.png" width="300" alt="save-link-phone, desktop, before"> | <img src="shots/1.4/after/desktop-save-link-phone.png" width="300" alt="save-link-phone, desktop, after"> | — | — |
| today | <img src="shots/1.4/before/desktop-today.png" width="300" alt="today, desktop, before"> | <img src="shots/1.4/after/desktop-today.png" width="300" alt="today, desktop, after"> | <img src="shots/1.4/before/phone-today.png" width="120" alt="today, phone, before"> | <img src="shots/1.4/after/phone-today.png" width="120" alt="today, phone, after"> |
| today-shared | — | <img src="shots/1.4/after/desktop-today-shared.png" width="300" alt="today-shared, desktop, after"> | — | <img src="shots/1.4/after/phone-today-shared.png" width="120" alt="today-shared, phone, after"> |
| today-hover | <img src="shots/1.4/before/desktop-today-hover.png" width="300" alt="today-hover, desktop, before"> | <img src="shots/1.4/after/desktop-today-hover.png" width="300" alt="today-hover, desktop, after"> | — | — |
| one-thing | <img src="shots/1.4/before/desktop-one-thing.png" width="300" alt="one-thing, desktop, before"> | <img src="shots/1.4/after/desktop-one-thing.png" width="300" alt="one-thing, desktop, after"> | <img src="shots/1.4/before/phone-one-thing.png" width="120" alt="one-thing, phone, before"> | <img src="shots/1.4/after/phone-one-thing.png" width="120" alt="one-thing, phone, after"> |
| flip-mid | <img src="shots/1.4/before/desktop-flip-mid.png" width="300" alt="flip-mid, desktop, before"> | <img src="shots/1.4/after/desktop-flip-mid.png" width="300" alt="flip-mid, desktop, after"> | <img src="shots/1.4/before/phone-flip-mid.png" width="120" alt="flip-mid, phone, before"> | <img src="shots/1.4/after/phone-flip-mid.png" width="120" alt="flip-mid, phone, after"> |
| flip-day | <img src="shots/1.4/before/desktop-flip-day.png" width="300" alt="flip-day, desktop, before"> | <img src="shots/1.4/after/desktop-flip-day.png" width="300" alt="flip-day, desktop, after"> | <img src="shots/1.4/before/phone-flip-day.png" width="120" alt="flip-day, phone, before"> | <img src="shots/1.4/after/phone-flip-day.png" width="120" alt="flip-day, phone, after"> |
| hint-today | <img src="shots/1.4/before/desktop-hint-today.png" width="300" alt="hint-today, desktop, before"> | <img src="shots/1.4/after/desktop-hint-today.png" width="300" alt="hint-today, desktop, after"> | <img src="shots/1.4/before/phone-hint-today.png" width="120" alt="hint-today, phone, before"> | <img src="shots/1.4/after/phone-hint-today.png" width="120" alt="hint-today, phone, after"> |
| everything | <img src="shots/1.4/before/desktop-everything.png" width="300" alt="everything, desktop, before"> | <img src="shots/1.4/after/desktop-everything.png" width="300" alt="everything, desktop, after"> | <img src="shots/1.4/before/phone-everything.png" width="120" alt="everything, phone, before"> | <img src="shots/1.4/after/phone-everything.png" width="120" alt="everything, phone, after"> |
| everything-hover | <img src="shots/1.4/before/desktop-everything-hover.png" width="300" alt="everything-hover, desktop, before"> | <img src="shots/1.4/after/desktop-everything-hover.png" width="300" alt="everything-hover, desktop, after"> | — | — |
| hint-drag | — | <img src="shots/1.4/after/desktop-hint-drag.png" width="300" alt="hint-drag, desktop, after"> | <img src="shots/1.4/before/phone-hint-drag.png" width="120" alt="hint-drag, phone, before"> | <img src="shots/1.4/after/phone-hint-drag.png" width="120" alt="hint-drag, phone, after"> |
| hint-menu | <img src="shots/1.4/before/desktop-hint-menu.png" width="300" alt="hint-menu, desktop, before"> | <img src="shots/1.4/after/desktop-hint-menu.png" width="300" alt="hint-menu, desktop, after"> | <img src="shots/1.4/before/phone-hint-menu.png" width="120" alt="hint-menu, phone, before"> | <img src="shots/1.4/after/phone-hint-menu.png" width="120" alt="hint-menu, phone, after"> |
| menu | <img src="shots/1.4/before/desktop-menu.png" width="300" alt="menu, desktop, before"> | <img src="shots/1.4/after/desktop-menu.png" width="300" alt="menu, desktop, after"> | <img src="shots/1.4/before/phone-menu.png" width="120" alt="menu, phone, before"> | <img src="shots/1.4/after/phone-menu.png" width="120" alt="menu, phone, after"> |
| line-menu | <img src="shots/1.4/before/desktop-line-menu.png" width="300" alt="line-menu, desktop, before"> | <img src="shots/1.4/after/desktop-line-menu.png" width="300" alt="line-menu, desktop, after"> | <img src="shots/1.4/before/phone-line-menu.png" width="120" alt="line-menu, phone, before"> | <img src="shots/1.4/after/phone-line-menu.png" width="120" alt="line-menu, phone, after"> |
| section-menu | <img src="shots/1.4/before/desktop-section-menu.png" width="300" alt="section-menu, desktop, before"> | <img src="shots/1.4/after/desktop-section-menu.png" width="300" alt="section-menu, desktop, after"> | <img src="shots/1.4/before/phone-section-menu.png" width="120" alt="section-menu, phone, before"> | <img src="shots/1.4/after/phone-section-menu.png" width="120" alt="section-menu, phone, after"> |
| settings | <img src="shots/1.4/before/desktop-settings.png" width="300" alt="settings, desktop, before"> | <img src="shots/1.4/after/desktop-settings.png" width="300" alt="settings, desktop, after"> | <img src="shots/1.4/before/phone-settings.png" width="120" alt="settings, phone, before"> | <img src="shots/1.4/after/phone-settings.png" width="120" alt="settings, phone, after"> |
| settings-theme-back | — | <img src="shots/1.4/after/desktop-settings-theme-back.png" width="300" alt="settings-theme-back, desktop, after"> | — | <img src="shots/1.4/after/phone-settings-theme-back.png" width="120" alt="settings-theme-back, phone, after"> |
| export-back | — | <img src="shots/1.4/after/desktop-export-back.png" width="300" alt="export-back, desktop, after"> | — | <img src="shots/1.4/after/phone-export-back.png" width="120" alt="export-back, phone, after"> |
| settings-advanced | <img src="shots/1.4/before/desktop-settings-advanced.png" width="300" alt="settings-advanced, desktop, before"> | <img src="shots/1.4/after/desktop-settings-advanced.png" width="300" alt="settings-advanced, desktop, after"> | <img src="shots/1.4/before/phone-settings-advanced.png" width="120" alt="settings-advanced, phone, before"> | <img src="shots/1.4/after/phone-settings-advanced.png" width="120" alt="settings-advanced, phone, after"> |
| appearance | <img src="shots/1.4/before/desktop-appearance.png" width="300" alt="appearance, desktop, before"> | <img src="shots/1.4/after/desktop-appearance.png" width="300" alt="appearance, desktop, after"> | <img src="shots/1.4/before/phone-appearance.png" width="120" alt="appearance, phone, before"> | <img src="shots/1.4/after/phone-appearance.png" width="120" alt="appearance, phone, after"> |
| theme | <img src="shots/1.4/before/desktop-theme.png" width="300" alt="theme, desktop, before"> | <img src="shots/1.4/after/desktop-theme.png" width="300" alt="theme, desktop, after"> | <img src="shots/1.4/before/phone-theme.png" width="120" alt="theme, phone, before"> | <img src="shots/1.4/after/phone-theme.png" width="120" alt="theme, phone, after"> |
| theme-partner | <img src="shots/1.4/before/desktop-theme-partner.png" width="300" alt="theme-partner, desktop, before"> | <img src="shots/1.4/after/desktop-theme-partner.png" width="300" alt="theme-partner, desktop, after"> | <img src="shots/1.4/before/phone-theme-partner.png" width="120" alt="theme-partner, phone, before"> | <img src="shots/1.4/after/phone-theme-partner.png" width="120" alt="theme-partner, phone, after"> |
| theme-builder | <img src="shots/1.4/before/desktop-theme-builder.png" width="300" alt="theme-builder, desktop, before"> | <img src="shots/1.4/after/desktop-theme-builder.png" width="300" alt="theme-builder, desktop, after"> | <img src="shots/1.4/before/phone-theme-builder.png" width="120" alt="theme-builder, phone, before"> | <img src="shots/1.4/after/phone-theme-builder.png" width="120" alt="theme-builder, phone, after"> |
| share | <img src="shots/1.4/before/desktop-share.png" width="300" alt="share, desktop, before"> | <img src="shots/1.4/after/desktop-share.png" width="300" alt="share, desktop, after"> | <img src="shots/1.4/before/phone-share.png" width="120" alt="share, phone, before"> | <img src="shots/1.4/after/phone-share.png" width="120" alt="share, phone, after"> |
| share-bottom | <img src="shots/1.4/before/desktop-share-bottom.png" width="300" alt="share-bottom, desktop, before"> | <img src="shots/1.4/after/desktop-share-bottom.png" width="300" alt="share-bottom, desktop, after"> | <img src="shots/1.4/before/phone-share-bottom.png" width="120" alt="share-bottom, phone, before"> | <img src="shots/1.4/after/phone-share-bottom.png" width="120" alt="share-bottom, phone, after"> |
| lists-grouped | — | <img src="shots/1.4/after/desktop-lists-grouped.png" width="300" alt="lists-grouped, desktop, after"> | — | <img src="shots/1.4/after/phone-lists-grouped.png" width="120" alt="lists-grouped, phone, after"> |
| list-detail | — | <img src="shots/1.4/after/desktop-list-detail.png" width="300" alt="list-detail, desktop, after"> | — | <img src="shots/1.4/after/phone-list-detail.png" width="120" alt="list-detail, phone, after"> |
| help | <img src="shots/1.4/before/desktop-help.png" width="300" alt="help, desktop, before"> | <img src="shots/1.4/after/desktop-help.png" width="300" alt="help, desktop, after"> | <img src="shots/1.4/before/phone-help.png" width="120" alt="help, phone, before"> | <img src="shots/1.4/after/phone-help.png" width="120" alt="help, phone, after"> |
| keys | <img src="shots/1.4/before/desktop-keys.png" width="300" alt="keys, desktop, before"> | <img src="shots/1.4/after/desktop-keys.png" width="300" alt="keys, desktop, after"> | <img src="shots/1.4/before/phone-keys.png" width="120" alt="keys, phone, before"> | <img src="shots/1.4/after/phone-keys.png" width="120" alt="keys, phone, after"> |
| idle | <img src="shots/1.4/before/desktop-idle.png" width="300" alt="idle, desktop, before"> | <img src="shots/1.4/after/desktop-idle.png" width="300" alt="idle, desktop, after"> | — | — |
| finale | <img src="shots/1.4/before/desktop-finale.png" width="300" alt="finale, desktop, before"> | <img src="shots/1.4/after/desktop-finale.png" width="300" alt="finale, desktop, after"> | <img src="shots/1.4/before/phone-finale.png" width="120" alt="finale, phone, before"> | <img src="shots/1.4/after/phone-finale.png" width="120" alt="finale, phone, after"> |
| about | <img src="shots/1.4/before/desktop-about.png" width="300" alt="about, desktop, before"> | <img src="shots/1.4/after/desktop-about.png" width="300" alt="about, desktop, after"> | <img src="shots/1.4/before/phone-about.png" width="120" alt="about, phone, before"> | <img src="shots/1.4/after/phone-about.png" width="120" alt="about, phone, after"> |

(— means the surface does not exist in that version: the question, a shared list on Today with its nickname and the Shared pill, Lists grouped, a list's detail, and Back at the top of Day theme and of Export & import are 1.4's.)

## iOS 26 against 18.1

Both runtimes ran the local build in their own Safari under `safaridriver` (the app's pointer handling ignores WebDriver taps, so the flow was driven with DOM clicks and checked in the DOM and in screenshots; `scratchpad/sim14.mjs`). iPhone 16 Pro on iOS 18.1 (Safari 18.1) and iPhone 17 Pro on iOS 26.5 (Safari 26.5).

| item | iOS 18.1 | iOS 26.5 |
|---|---|---|
| The welcome and the demo lines | three live lines, no rail; a tap strikes with the knock and a burst, nothing stored | the same |
| The viewport Safari leaves the page | 402 × 678 | 402 × 714 — the new chrome is shorter, so the page gets 36 px more; the safe-area insets read 0 inside the browser page on both (Safari keeps its own chrome clear) |
| `theme-color` | the Light ink (#FAF8F4) on the welcome, the Dark ink (#1A1D21) after the flip, read from the meta as the app sets it | the same values; on 26 the tint is Safari's to apply behind its translucent chrome, and the screenshots show it |
| The save sheet (Safari on a phone) | Add it to your Home Screen with the three steps and the two glyphs, Copy, I've saved it; no code, no link field | identical |
| The Share sheet | Open on my other device (`/mine`) · Show it somewhere · Let someone edit (`/shared`) · Tell a friend · New keys; no codes on a phone; Share… present | identical |
| Tell a friend | `navigator.share` was called inside the tap's own event (stubbed to record it) | identical |
| The stack | Settings → Day theme shows ‹ Back with two history entries; Back lands on Settings at its scroll (120) with one entry; `history.back()` closes it | identical |
| The sun/moon flip | Light → Dark with the tint following | identical |
| One-thing mode | the ↻ beside the count, the Shake to shuffle? bar under the toast, not behind it | identical |
| A view-only window's celebration | a second Safari window on the View link (own list: no question, view-only pill, no Shared pill) got the editor's check-off with a burst | `window.open` from the page produced no second window on 26.5 (blocked), so not repeated there; the browser suite covers it |
| The Home Screen name | the manifest the boot script builds says name and short_name "Today's Five", the apple title too | identical |

Not reached on either runtime, because nothing available could tap Safari's own chrome or a native sheet (the native simulator tool wants an `xcode-select` that needs a password, and screen control of the Simulator window was declined): the Share and ⋯ menus of the Compact, Bottom and Top layouts, the Add to Home Screen sheet and the name it prefills, the Home Screen label, the standalone launch and its `start_url`, the bottom edge under the standalone chrome, the motion prompt's Allow and a real shake. The wording of the three steps follows Apple's iOS 26 Safari layouts as documented (Compact keeps Share behind ⋯; Bottom and Top show the Share button), and the browser suite covers the sheet's variants and the standalone copy with mocks.

## Verification results (1.4)

What was actually run, and what it found.

| suite | result |
|---|---|
| Node `test/model.test.js` | 25 pass: 1.3's 22, plus the hash parser reading `/mine` and `/shared` on a private link and nothing on a view link, matching the id as a prefix so an unknown suffix still opens the list, `hintLink` and `hashHasExtras`; the registry migrating on read (existing entries become `mine`, a `shared` entry stays, no nickname appears, the entry's shape gains one field and nothing else moves); and the frozen 1.3 parser (`test/fixtures/parse-1.3.js`) against a hinted link — it returns null, so a page still running 1.3 that receives one without a reload ignores it, recorded in DECISIONS.md |
| Node `test/features.test.js` | 20 pass: what's-new fires for a 1.3, 1.2, 1.1 and 1.0 device on the 1.4 headline ("Yours, and shared with you.") and never on version numbers; the changelog shape holds for 1.4; `CHANGELOG.md` holds 1.4; the version in three places and the build in four (`version.js`, `whatsnew.json`, `<html data-build>`, `PANELS_BUILD`), and `sw.js` carries the build for its per-build cache; the parser's shape with `hint` |
| Node `test/theme.test.js`, `crypto.test.js`, `sync.test.js`, `sound.test.js`, `compat.test.js` | 24, 9, 13, 8 and 7 pass, untouched (the pinned derivation vectors included; sound.js and sync.js gained an import of `version.js` for the build their lazy modules ask for) |
| Browser suite `tools/e2e4.js` (Chrome 152, local transport, 1440×900 mouse and 390×844 touch) | 111 pass, zero page errors, CSP violations or third-party requests, on the final code (the first full run turned up eleven things, all fixed and recorded in DECISIONS.md: the parent's scroll losing to the dialog's focus scroll, your own list's View link asking the question, a hinted link losing its origin through the reload iOS Safari does on a switch, a dropped nickname coming back from storage, Chrome taking a horizontal touch before the edge swipe, a history unwind landing on a stale URL and doubling itself when the browser closed a dialog on its own, the undo after Delete everywhere losing its entry to the dead mark). New: the question once for a bare private link and for a view link, never for a hinted link, a list made here or your own list's View link, not cancelable, the answer filing the list and the hint leaving the address bar; Lists grouped under My lists and Shared with me with the Shared pill, a nickname of its own that leaves the synced name alone (checked on a second page), New keys and Delete everywhere absent on a shared list and back after It's mine after all, no save nudge, no switch on a list made here and the reverse switch on one from a link; the four Share blocks in order with `/mine` and `/shared` on the copied private links, the code first on the desktop, Copy only under the warning, the View link the default on a View link holder, `navigator.share` called inside the tap's own event (checked through `window.event`), the clipboard fallback and the note shown to select when the clipboard refuses; the stack at both viewports — ‹ Back on a sub-panel with the parent's scroll and the changed Day theme in place, Escape a level at a time and closed at the root, one history entry per level with the browser's Back going back a level, × closing the stack and its entries, an edge swipe on the phone (CDP touch), Export & import and Removed lists from Settings, a list's detail from Lists; a 1.3 device opening 1.4 with every list mine, no question, no groups and the toast only; the Home Screen name in the apple title and the manifest, the three-step lead on an iPhone with the two glyphs and no layout named, the browser's-menu sentence on Android; the service worker answering `panels.js?v=62` from a seeded build-62 cache while this build's comes fresh and an unknown build falls back to the network, every lazy import asking by build, and a page whose build cannot be served reloading once after flushing and coming back to Everything with Settings open. 1.3's checks retargeted (a Lists row is a button and a › now, the save lead reads its visible steps, Escape in the older checks means close it all, a reload waits for a history unwind to land) |
| Real Supabase `tools/realsync4.js` | 6 pass, the suite unchanged: envelopes on the wire, a view link's put refused with 403, the unchanged poll still **29 bytes**, presence between two sockets, delete everywhere then undo under the same link, add from a URL end to end; the three-line seed is 501 bytes encrypted, the realistic list 6,521 bytes. Nothing in 1.4 touches the wire: origin and nickname stay in the device's registry |
| Lighthouse 12 (Chrome 152, gzip like GitHub Pages, the same harness and machine for both, an untouched clone of `main` at 1.3 build 62 as the baseline, two rounds each, in sequence on a quiet machine) | **1.3 baseline** (the untouched clone of `main` at build 62): desktop 100 / 100 / 100 in both rounds (FCP 0.35–0.38 s, LCP 0.41–0.42 s); mobile cold 99, 99 (FCP 1.51–1.70 s, LCP 1.82–1.85 s); mobile warm 99, 99 (FCP 1.52–1.71 s, LCP 1.83–1.86 s). **1.4**: desktop 100 / 100 / 100 in both rounds (FCP 0.34–0.39 s, LCP 0.41 s); mobile cold **99, 99** (FCP 1.51–1.52 s, LCP 1.82–1.83 s, TBT 0); mobile warm **99, 99** (FCP 1.51–1.52 s, LCP 1.82–1.84 s, TBT 0). Accessibility and best practices 100 throughout. Cold and warm are not worse than 1.3's; Today's first paint is the same markup as before until the app runs |
| Sizes on the critical path (gzip) | `index.html` 10.8 KB (1.3: 10.1 — the question, a list's detail, the Share blocks and the keys block, the three steps with their glyphs), `styles.css` 10.0 KB (10.0), `app.js` 41.1 KB (37.3 — the stack, the origin and the question, the pinned modules and the reload path), `model.js` 11.6 KB (11.1); off the critical path `panels.css` 4.9 KB (4.4), `panels.js` 20.1 KB (17.5), `sw.js` 1.6 KB (1.1), `sound.js` and `sync.js` up by the one import each. The first paint is the same markup as 1.3's until the app runs (the new dialogs are closed and the pill hidden) |
| iOS Simulator (iPhone 16 Pro on iOS 18.1 and iPhone 17 Pro on iOS 26.5, Safari, the local build through `safaridriver`) | See "iOS 26 against 18.1" above: on both, the welcome's live lines, the save sheet's three steps with the glyphs and no code, the Share sheet's five blocks with `/mine` and `/shared` on the private links, `navigator.share` called inside the tap, Settings → Day theme with ‹ Back returning to Settings at its scroll and one history entry per level, the sun/moon flip with the tint following, one-thing mode's ↻ and the shake hint under the toast, and the manifest naming the app in full. Not reached on either: Safari's own menus, the Add to Home Screen sheet, the standalone launch, the motion prompt's Allow |

## Live checks (1.4)

Against https://54kz2vzbdw-code.github.io/todays-five/ with the installed Chrome and persistent profiles (`scratchpad/live14.mjs`), after `main` moved to build 65 at 19:27; Pages served it on the second poll, with `sw.js` at `tf-v1.4` and build 65, `<html data-build="65">`, `PANELS_BUILD = 65` and the manifest's `short_name` "Today's Five" on the live files.

- **A 1.3 device** (a profile that played the welcome and kept its list on the live 1.3 at build 62): opens 1.4 on the first navigation with the same list (three lines, one done), synced at rev 1, filed as mine with no nickname, and the toast "New in 1.4: Yours, and shared with you." is the only new thing — no question, no save sheet, no shake hint, no install hint, no mark, no Shared pill, no dialog; the rail as before. ⋯ has its nine rows; Lists shows one flat list with no groups and Rename this list; the list's detail opens with ‹ Back, says "Made on this device" and has no switch, and Back lands on Lists with one history entry left; Share shows Open on my other device, Show it somewhere, Let someone edit, Tell a friend and New keys, the private links ending in `/mine` and `/shared`; a second open shows no toast; then deleted everywhere. No page errors.
- **A fresh device**: the welcome is the three live lines with no rail and the boot script's manifest names the app in full; crossing all three off, Keep, the save sheet leading with Bookmark this page (the three iOS steps in the markup, hidden on a desktop), Copy; the list kept with its three marks, synced at rev 1, filed as mine, no toast; the server row an envelope (`v`, `z`, `ct`, `iv`, `alg`; 497 bytes); Share from the rail with the five blocks and the code for the first two; About reads Version 1.4 (build 65) with the five headlines; then deleted everywhere. No page errors.
- **The record**: build 66 stamped the live checks and changed nothing else.

## Hotfix — build 67: a reloaded page came back as a mix of builds

Price's phone had the Home Screen app open through the 1.4 deploy. Its first panel took the reload path (the guard from build 61), and the reloaded page came back with 1.4's markup and 1.3's `app.js`: Safari revalidates the page itself on a reload but serves scripts it fetched within the last ten minutes from its HTTP cache (GitHub Pages marks every file `max-age=600`). On that mix the Share sheet opened with nothing in it. Reproduced in the simulator's Safari on iOS 18.1 with the service worker on: a 1.3 page, the served directory swapped to 1.4 underneath it, ⋯ → Share — after the plain reload the page read `data-build="66"` with `version 1.3` and every Share block hidden. Refreshing the shell with `cache: "reload"` before the reload brought a whole 1.4 page back (version 1.4, build 66) and Share opened with all five blocks.

The fix: the guard in `panels.js` compares `app.js`'s build as well as the markup's, and before its one reload fetches every shell file with `cache: "reload"` (capped at six seconds); `sw.js` fetches shell files with `cache: "no-cache"` and falls back within one build's cache only. COMPATIBILITY.md §6 says so.

Run before the deploy: the seven Node suites (25, 24, 9, 13, 8, 20, 7); the browser suite's four tests on the changed paths at both viewports (the service worker and the reload path, the full session, the Share sheet, the question) — 8 passes; the simulator replay on iOS 18.1 and on iOS 26.5 with the service worker on (a 1.3 page, the served directory swapped to the fix underneath it): the first Share tap reloads the page whole (data-build and version agree) and the second opens Share with all five blocks. Live, around the real deploy of build 67 at 19:56 (`scratchpad/sim-live-trans.mjs`, iPhone 16 Pro on iOS 18.1): a page of the live build 66 was opened in the simulator's Safari with the worker on and no panel code loaded, held open while main moved and Pages started serving 67, then ⋯ → Share on that old page — the page reloaded whole (`data-build="67"`, version 1.4) and, since build 67's app.js remembers the panel asked for, Share came back open on that first tap with all five blocks; a second tap opened it again; the worker kept build 66's cache as the previous generation beside 67's. The list was deleted everywhere afterwards. The record commit stamps build 68 and changes nothing else.

## Hotfix — build 69: a content blocker hid the Share sheet

After build 67 Price's Home Screen app, freshly launched, still opened Share as a bare header. Nothing in the app hides every block at once, and the simulator (Safari 18.1 and 26.5, light and dark, the live site) opened the sheet whole every time — so the difference had to be on the device. It was a content blocker: the generic rule `##.share-block` is in Fanboy's Social and AdGuard's Social lists (no domain), Safari applies content blockers to Home Screen web apps, and every section of the sheet carried that class since 1.3. Fix: the class is `.lk-block`; all 157 classes and 236 ids in the two pages were checked against the global rules of EasyList, Fanboy Social and Annoyance, and AdGuard Base, Social and Annoyances (55,671 rules), and `.share-block` was the only hit; `test/features.test.js` now refuses a list of blocker-prone names. Also in this build: the ⋯ menu hands over to a panel without a history traversal, and on the local transport `?open=share` opens the sheet on load (a hook for a Home Screen web app the simulator cannot tap).

Run before the deploy: the seven Node suites (25, 24, 9, 13, 8, 21, 7); the browser suite's Share sheet, shared list, full session, stack, deploy and question tests at both viewports. Live, build 69 at 20:16 (Pages served it on the first poll): the live HTML carries no `share-block` and five `lk-block` sections, the stylesheet ten `lk-block` rules; on the live site with the blocker's rule applied through the CSSOM (`.share-block{display:none!important}`, the way a content blocker applies it), the Share sheet opened at 743 px with all five blocks, and the same rule aimed at the new class left a 105 px sheet — the header alone, which is what the phone showed. The record commit stamps build 70 and changes nothing else.

## Build 71 — a QR code beside Copy, and the card’s title band

Price asked for the codes back on the phone (1.4 left it Copy, and Share… for the View link) and sent the preview card with its title over the last line. Each Copy in the Share sheet now has a QR code button to its right: on a phone in all three link blocks, on a desktop in Let someone edit only, since the first two show their codes inline as in 1.3. The button toggles the code above the link and draws it from the link in the box at that moment; the private link marked as shared gets a code only when someone asks for it. The card: the app’s stylesheet, borrowed for the fonts, brought its `.lines`, `.row` and `.box` rules along, which painted the lines from the card’s corner over the rail, and the title sat over the fourth line by design. The card’s classes carry an `og-` prefix now, it shows three lines, and the title and tagline share a band under a divider at the bottom (`icons/og.png`, still 1200×630). The after shots were retaken with the button in place (same files, same table).

Run before the deploy: the seven Node suites (7, 9, 21, 25, 8, 13, 24) and the browser suite’s ten tests that touch Share, at both viewports, with the Share test extended: the buttons in each block, hidden on a desktop where the code is inline, shown on a phone, the private one everywhere; a tap draws the code and presses the button, another hides it. Live, build 71 at 20:58 (Pages served it on the fifth poll): `icons/og.png` comes back at 28 KB with the three lines and the title band clear of them; in a phone-sized Chrome on the live site the sheet shows Copy link and QR code in the first two blocks, Share… on the View link, and Copy private link and QR code under the warning, and a tap on the first button draws its code (205 px) and presses the button, a second tap hides it; on a desktop the first two codes are inline and only Let someone edit carries the button, which draws its code; on the iOS 26.5 simulator’s Safari the live sheet shows the same buttons and both codes drew on a tap. The record commit stamps build 72 and changes nothing else.


# Today's Five 1.5 — plan

Six more sound packs. The brief was one line ("more sounds in the sound pack—surprise me"); the calls are in DECISIONS.md under "1.5 decisions". Nothing on the server changes; links, keys and the document shape are untouched; the twelve curated themes keep their sounds.

## What changed, by surface

| surface | 1.4 | 1.5 |
|---|---|---|
| Settings → Sound pack | Theme's pick and six packs | Theme's pick and twelve: Knock, Bell, Blip, Typewriter, Marble, Pop, Kalimba, Pencil, Whistle, Bongo, Cork, Arcade; a pick still previews |
| The theme builder's Sound | Auto and six | Auto and twelve; the code carries the pick (`T2:…:cork:…`), and a 1.4 device given it falls back to the hue rule |
| A check-off | the theme's pack | the same, or the device's pick: the kalimba climbs a pentatonic scale, the pencil draws the mark, the whistle slides up, the bongos alternate hands, the cork pops, the arcade drops a coin |
| The finale | the theme's pack | the kalimba rolls to a chord, the pencil tears the page off the pad, the whistle whistles a tune, the bongos play a fill, the cork pops, fizzes, pours and clinks, the arcade plays the level-clear jingle |
| How it works | "Every theme picks a sound pack" | "one of the twelve sound packs" |
| What's new | 1.4's entry | 1.5: "Six more sounds." with two lines |

## Structure of the change

- `packs.js`: `noiseShape` (a noise stroke with attack, hold, release and a filter glide) and six engines (`kalimba`, `pencil`, `whistlePack`, `bongo`, `cork`, `arcade`), each with `check(env, step)`, `uncheck(env)` and `finish(env)` reading `P("pitch")` and `P("decay")` (the pencil `P("noise")` too) like the old six; `PACKS`, `PACK_NAMES` and `PACK_ORDER` carry twelve. 143 → 287 lines, still loaded on the first gesture with `?v=<build>`.
- `theme.js`: `PACK_IDS` and `PACK_NAMES` mirror the twelve; `packOf` unchanged (an unknown name is "", the hue rule).
- `panels.js`: the Settings list of twelve; the How it works sentence.
- `sound.js`, `app.js`, `index.html`, `sw.js`: untouched but the version stamps. No new files in the shell.
- `tools/sounds.js` (new): renders every pack offline to WAV and an envelope picture, prints peak and RMS per sound, joins chosen packs into one file for listening. `tools/shots.js`: a Sound-section shot with a new pack picked.
- Tests: the sound suite's fake context grew a filter `Q`, frequency ramps and `stop()`; a test for the twelve (order, names, every step of the new ones, pitch and decay reaching them); the theme suite's list; the features suite's version lists and the newest headline; the browser suite's two sound tests cover twelve.

## Before and after

Only the Sound section changes on screen; the rest of the after set matches the before set (70 shots each, `shots/1.5/before` from the untouched 1.4 code, `shots/1.5/after` from this branch).

| surface | desktop before | desktop after | phone before | phone after |
|---|---|---|---|---|
| settings-sound | <img src="shots/1.5/before/desktop-settings-sound.png" width="300" alt="Settings, the Sound section, desktop, before"> | <img src="shots/1.5/after/desktop-settings-sound.png" width="300" alt="Settings, the Sound section with Kalimba picked, desktop, after"> | <img src="shots/1.5/before/phone-settings-sound.png" width="300" alt="Settings, the Sound section, phone, before"> | <img src="shots/1.5/after/phone-settings-sound.png" width="300" alt="Settings, the Sound section with Kalimba picked, phone, after"> |

## The sounds, measured

`node tools/sounds.js shots/1.5/sounds` renders each pack over 4.6 s (check-offs at 0, 0.45 and 0.9 s, an uncheck at 1.5 s, the finale at 2.1 s) and draws its loudness (RMS in 4 ms windows). Peak and RMS per sound, after tuning; the old six for the scale:

| pack | check peak / RMS | uncheck peak / RMS | finale peak / RMS | finale length |
|---|---|---|---|---|
| knock | 0.387 / 0.042 | 0.128 / 0.011 | 0.343 / 0.044 | 0.75 s |
| bell | 0.374 / 0.065 | 0.111 / 0.010 | 0.327 / 0.045 | 1.35 s |
| blip | 0.118 / 0.014 | 0.076 / 0.008 | 0.114 / 0.017 | 0.46 s |
| typewriter | 0.445 / 0.023 | 0.159 / 0.008 | 0.309 / 0.021 | 0.69 s |
| marble | 0.365 / 0.029 | 0.141 / 0.009 | 0.365 / 0.035 | 1.17 s |
| pop | 0.281 / 0.023 | 0.156 / 0.011 | 0.342 / 0.030 | 0.80 s |
| kalimba | 0.312 / 0.066 | 0.104 / 0.017 | 0.370 / 0.045 | 1.59 s |
| pencil | 0.301 / 0.048 | 0.133 / 0.017 | 0.389 / 0.040 | 1.06 s |
| whistle | 0.171 / 0.062 | 0.141 / 0.047 | 0.163 / 0.059 | 1.28 s |
| bongo | 0.387 / 0.045 | 0.156 / 0.009 | 0.370 / 0.027 | 1.01 s |
| cork | 0.390 / 0.037 | 0.163 / 0.011 | 0.346 / 0.038 | 1.92 s |
| arcade | 0.074 / 0.026 | 0.070 / 0.030 | 0.119 / 0.021 | 1.23 s |

| pack | the loudness over 4.6 s |
|---|---|
| kalimba | <img src="shots/1.5/sounds/kalimba.png" width="700" alt="kalimba: three tines climbing, a damped one, a roll to a chord"> |
| pencil | <img src="shots/1.5/sounds/pencil.png" width="700" alt="pencil: two strokes per mark, three rubs of the eraser, the page torn off"> |
| whistle | <img src="shots/1.5/sounds/whistle.png" width="700" alt="whistle: held notes, the tune with a long last note"> |
| bongo | <img src="shots/1.5/sounds/bongo.png" width="700" alt="bongo: hits, a fill quickening, both hands"> |
| cork | <img src="shots/1.5/sounds/cork.png" width="700" alt="cork: pops, then the pop, the fizz, five glugs, the clink"> |
| arcade | <img src="shots/1.5/sounds/arcade.png" width="700" alt="arcade: the coin, the hurt blip, the run and the chord"> |

## Verification results (1.5)

- Node suites: model 25, theme 24, crypto 9, sync 13, sound 9 (one new: the twelve, every step of the new six, pitch and decay reaching them), features 21 (the version lists and the newest headline now 1.5), compat 7.
- The browser suite on the local transport: 111 passed, 0 failed at 1440×900 and 390×844 (`tools/e2e4.js`), with zero page errors and CSP violations; the two sound tests cover twelve packs (every pack plays check, uncheck and finale through a running context; the builder lists twelve and a code carries the pick), and five tests that pin the version (the toast's headline, About's changelog order, the worker's cache name) were pointed at 1.5.
- The real-backend suite: 6 passed (envelopes, the refused put, the 29-byte poll, presence, delete and undo, add from a URL); nothing on the server changed.
- Lighthouse 12 on the same machine, minutes apart, the 1.4 code (a clone of `main` at build 72) against this branch: desktop 100/100/100 both; mobile cold 99/100/100 both (FCP 1702 → 1700 ms, LCP 1852 → 1850 ms); mobile warm 100/100/100 both (FCP 1164 → 1155 ms, LCP 1187 → 1170 ms). The packs load on the first gesture, so the first paint carries none of the 144 new lines.
- Simulator, Safari on iOS 26.5 and 18.1 through WebDriver (`sim-sound.mjs` in the session's scratch): Settings → Sound lists Theme's pick and the twelve; picking Cork saves `soundPack: "cork"` and the sub-line reads "Light picks Knock; this device plays Cork"; a check-off after that goes through the sound machine. On 18.1 the context runs and plays; on 26.5 WebDriver's clicks are not gestures for audio (the context stays suspended, the machine asks, then makes a fresh one per tap), on the 1.4 code exactly the same (replayed against the clone), so a limit of the harness, not a change.
- Offline renders (`tools/sounds.js`): no pack clips, the check-offs peak between 0.07 and 0.45 like the old six, and the finales between 0.11 and 0.39 (the table above).
- Screenshots: 70 before (from the untouched 1.4 code) and 70 after; only the Sound section differs.

## Live checks (1.5)

Build 75 went live at 22:02 (Pages served it on the sixth poll; `version.js` 1.5, the worker `tf-v1.5-b75`, `packs.js?v=75` with the twelve). A "1.4 device" (a Chrome profile that made its list on the live site at build 72, six packs in its Settings) opened the URL fresh: the first navigation ran 1.5, the same list with the same rows and check, synced at rev 1, mine, and the what's-new toast the only new thing ("New in 1.5: Six more sounds."; no question, no sheet, no hint, no dialog); its Settings listed Theme's pick (Knock) and the twelve, a pick of Cork saved and the sub-line read "Dark picks Knock; this device plays Cork" with the context running; on the second open the toast stayed hidden. A fresh device: the welcome (three lines, the demo), three check-offs through a running context with the packs loaded, Keep, the save sheet, the list synced at rev 1 as an envelope (`v, z, ct, iv, alg`, 501 bytes, no plaintext), Settings with the twelve, About reading "Version 1.5 (build 75)" with the changelog 1.5 → 1.0. Both lists deleted everywhere afterwards; no page errors. The record commit stamps build 76 and changes nothing else.


# Today's Five 1.7 — plan

The full pass: UI, feel, copy and bugs, with no features. Six rounds in a week grew the app; this round steps back and looks at it through eleven lenses in many environments, ranks what it finds, ships the part that is not a taste call, and puts the rest to Price in AUDIT.md. The brief names the round 1.6 in places and 1.7 in others (Price flipped the two: 1.6 is another session's secret super-pink mode); the branch, the version and the About line are 1.7.

## Process

- **Agents look; the orchestrator judges.** Twelve agents, one lens each (accessibility has two: one measures, one judges), run in parallel with a written brief: the lens, the environments, the fixture, the local-transport rule, a budget (about 60 tool calls or 50 minutes; 80–90 for the serial platform and data lenses) and one output contract per finding (title · severity blocker/bug/papercut/proposal · environment · steps · evidence path · why it matters · proposed fix · the copy line). Nothing without evidence; no agent edits the repo or touches the live server. Their raw reports are kept in `audit/raw/`. Every bug shipped was reproduced here first; every copy change went through the voice skill; every design item got its own judgment before it entered AUDIT.md.
- **The code under audit is frozen**: a clone of `main` at build 76 (1.5) served on its own port, so a fix landing on the 1.7 branch never changes what an agent is looking at mid-run. Fixes go to the working copy on another port and are verified there.
- **Waves**: the first six (never seen it, copy, consolidation, feel, consistency, privacy — the judgment lenses, on opus) went first; the platform and accessibility-tooling lenses (sonnet) followed once the load was known; the accessibility-judgment, sync-and-data, surfaces and performance lenses last. The machine held twelve at a load of about five on fourteen cores, so the waves overlapped rather than queued.
- **Server hygiene**: every agent opens the app with `?transport=local`; only the platform lens runs the real-backend suite, once. Nothing on the server changes.

## Fixtures and harness (committed first)

- `tools/fixture.js` writes `test/fixtures/longtime.json`: a device that has used the app for months — four lists (Work: 84 lines in six sections, fifteen notes, six repeating lines of every kind, two Not today, 90 days of history, two saved themes that are partners, a template; Home; Trip, shared with this device and nicknamed; Old, archived), every hint seen, 1.5 seen, a theme of its own in the Day slot. Times are relative to the moment it was generated; the harness shifts them to load time and buckets the history by local day, so "done today" is today whenever it runs.
- `tools/audit/harness.mjs`: one way to open the app in every environment the brief lists with the installed Chrome — desktop 1440×900 and 1920×1080, a narrow 900×700 window, browser zoom 150% and 200% (a smaller viewport at a higher device scale), phone 390×844 and landscape, Android (Pixel 7), iPad both ways; dark and light, reduced motion, a timezone, a fake clock (Playwright's), offline and slow 3G; the fixtures (`fresh`, `longtime`, `none`), a stranger arriving by a link (a second profile given the first profile's local-server rows), and evidence to a directory. The browser suite reuses its seeding for a new test.
- The simulators (iOS 26.5 and 18.1) through WebDriver, the deploy-transition swap directory, macOS Safari through safaridriver if it allows automation, and Lighthouse's runner are the platform and performance lenses' tools.

## Lenses × environments

| lens | model | environments | fixture |
|---|---|---|---|
| Never seen it | opus | desktop, phone, Android; a stranger by View link and by Private link | none, fresh |
| Copy | opus | every string in the markup, the code and About; desktop and phone for wrapping | longtime |
| Consolidation | opus | desktop, phone; counts of controls, rows and taps | longtime |
| Feel | opus | desktop, phone, reduced motion; three sound packs | fresh, longtime |
| Consistency | opus | desktop dark/light, phone dark/light, 1920×1080, 900×700, zoom | longtime |
| Accessibility, tooling | sonnet | contrast on 12 kits + 20 random themes, targets on phone, keyboard order on desktop, focus rings, the tree, text scaling, reduced motion, announcements | longtime |
| Accessibility, judgment | opus | the tree as spoken, keyboard-only tasks, low vision, reduced motion, touch alternatives | longtime |
| Bugs: sync and data | opus | two devices on one list, offline and lag, a fake clock across midnight, DST and a timezone change, import/export, moves, delete/undo, New keys with a stale device, eight idle hours, sleep and wake, a busy server | longtime |
| Bugs: surfaces | opus | desktop, narrow, zoom, phone, landscape, Android, iPad both ways | longtime, fresh, none |
| Bugs: platform | sonnet | Chrome and both simulators across a deploy, audio after suspend/kill, wake lock, motion permission, share, clipboard, the blob manifest, Android back, standalone; the real-backend suite once | fresh |
| Performance | sonnet | Lighthouse, first paint by theme and viewport, eight idle hours, long lists, cold lazy modules on slow 3G, leaks, the worker cache, byte budget | longtime |
| Privacy and security | opus | code reading, the console, storage and caches, rendering of hostile text, import parsing, the QR and share texts, the RPCs' edges, the CSP | fresh |

## What ships and what waits

Ships on the 1.7 branch, verified per COMPATIBILITY.md §7: bugs the orchestrator reproduced, copy that fails an unfamiliar reader (through the voice skill), and cosmetic defects that are not taste calls. Waits, in AUDIT.md: anything that changes design — combining or removing controls, restructuring a panel, a different interaction, a change to motion or sound character — ranked by impact against effort with evidence and, where it helps, a mockup. Anything on the line waits.

## Found before the agents started

Loading the fixture showed a defect on its first run: a list with a chosen-days repeat opened half done. `DAY_NAMES` was declared five hundred lines below the boot call and the first render reaches it (`ruleLabel`, on every row with a rule), so the open threw after the first rows — the rest of Today missing, the count 0/0, the sync engine never started, "Sync off" in the rail — on every cold open of a device whose current list has a weekly repeat on chosen days. Fixed (moved above the boot block), with a features test that pins the short list of module-level bindings allowed below `boot()` and a browser test that boots the long-time fixture at both viewports and asserts no page error, every Today line, the count and a running engine.

## What the lenses found

Twelve reports, 143 findings before deduplication: 3 blockers (all the same boot bug, seen through five lenses), 41 bugs, 52 papercuts, 47 proposals. Every fix in AUDIT.md's appendix was reproduced on the working copy first (the scripts are in the session's scratch; the harness makes them short), and the fixes landed in seven commits on the branch, each with tests: the boot bug (a static guard and the fixture at boot), thirty-one copy changes, the whose question and the first sound and the flare and the hover and the empty Today and the line menu and the tooltips, the sync and data four, the hold and the add-from-anywhere and the paste error and the sheet and the swatch and the toast, the consistency ten, the accessibility fourteen, the worker and the hook and the share and copy fallbacks and the kits' floors.

## Verification results (1.7)

Checklist §7 of COMPATIBILITY.md, on the working copy served locally (the audit itself ran on a frozen clone of main at build 76, on its own port):

- **Node suites** (`node test/*.test.js`): compat 7, crypto 9, features 23 (a boot-allowlist guard and About's fallback version added), model 27 (moveItem's section and purgeTombstones' fixed point added), sound 10 (the replay and the preload added), sync 13, theme 25 (the curated kits' elevated floors added) — 114 of 114.
- **Browser suite** (`tools/e2e4.js`, 1440×900 mouse and 390×844 touch, the installed Chrome): 131 of 131 (12 minutes, 00:21–00:33 on 2026-09-06). The first full run failed six: four tests pinned the pre-1.7 state (the welcome's one sentence, the Lists switch's old label, and the save sheet's focus landing on a line, whose ⋯ it then showed at rest) and one crossed midnight (the fixture's day strings did not move with its times); each is a decision in DECISIONS.md, and the second run is the number above.
- **Real backend** (`tools/e2e-realsync.js`): 6 of 6, once, at 23:42 on 2026-09-05 (the platform lens's run an hour earlier came back "busy": the 1.5 round's live checks had spent the hour's creates).
- **Lighthouse** (mobile, simulated throttling, cold = first visit, warm = the worker's cache): 1.5 cold 99 (LCP 1852 ms) → 1.7 cold 99 (LCP 1857 ms; an earlier run of the same code read 1830 ms); warm 100 → 100 (LCP 1186 → 1176 ms); desktop 100 → 100. Not worse. app.js stays under the simulated TCP window (44,0xx B gzipped against 1.5's 42,252): the first draft's commentary cost an extra round trip (98, LCP +270 ms) and was trimmed to pointers, with the dead-link carry moved into the lazy panels module.
- **Simulators** (safaridriver, iOS 26.5 and 18.1): the platform lens's pass over the sheets, the hold and the Share sheet; nothing was verified on a physical device (see AUDIT.md, "What no agent could verify").
- **First paint**: the boot script's hash re-computed (`tools/csp-hash.js`); no new fetch before the largest paint (the panels module now loads 300 ms after the first gesture, the sound engines at idle).

## Live checks (1.7)

Build 87 went live at 00:36 on 2026-09-06 (Pages served the worker on the third poll, 50 s after the push; `tf-v1.7-b87`). A "1.5 device" (a Chrome profile that made its list on the live site at build 76 the evening before: three lines, one crossed off) opened the URL fresh: the first navigation ran 1.7; the same list, synced, mine, the what's-new toast the only new thing ("New in 1.7: Sharper all over."), no other sheet or question, and the test hook handing out no secret. The list showed two lines and no check: the day had rolled over at midnight between the staging and the check, and the crossed-off line had gone to History as the rollover does (rev 2 was that write). On the live code: the star's tooltip and the section's, a line's name read as its text, Lists starting at its title with "Remove this list from this device" and the key hints hidden from the reader, the Share sheet's warning under "Let someone edit" and the two Copy buttons named for their links, the toast gone on the second open, the delete confirm in danger rather than orange; Delete everywhere left the welcome. A fresh device: the welcome one sentence over three lines, the three check-offs made sound and the finale announced "3 of 3 done. That's the list.", Keep and the save sheet, the kept list synced at rev 1 with the server row an envelope (v, z, ct, iv, alg — 501 bytes, nothing readable), About "Version 1.7 (build 87)" with the changelog in order and the crumb "‹ Back to the list"; Delete everywhere left the welcome. No page errors on either device. The script (`live17.mjs`) and both screenshots stay in the session's scratch; nothing was left on the server.

# Today's Five 1.8 — plan

A secret pair of themes: undocumented, unlocked by a word, shareable by that word, built to the same bar as every other kit. Nothing else was added. Nothing on the server changes; links, keys, the document shape and the three RPCs are untouched, and the unlock never leaves the device it was given to. The calls are in DECISIONS.md under "1.8 decisions".

The pair was built as 1.6 against 1.5, finished and stamped at build 79, and never merged; `main` went on through 1.7, the audit round, which changed the theme picker (a sheet on the phone), a saved theme's delete, the curated kits' contrast on the elevated surface, the panel machinery and thirty strings. This round merges `main` into the pair's branch, keeps the audit's fix wherever the two touched the same thing, re-applies the pair on top and ships it as 1.8. There is no 1.6 in the changelog, because there was no 1.6. What a person with a saved list meets is one new thing—the what's-new toast, carrying the wink.

## What changed, by surface

| surface | 1.7 | 1.8 |
|---|---|---|
| The theme picker | Made for day · Made for night · Yours | the same, plus **Secret** between Yours and the groups above it — on a device that has been given the key, and only then, with a quiet **Forget the secret** under it |
| Import a code | parses a theme code, or says it doesn't | the same, and it takes the key: the group appears, a sparkle goes up in the pair's own colours, and its own chime plays |
| Themes | fourteen curated kits | sixteen: **Superpink** (night) and **Birthday** (day), partners of each other, in the Secret group only |
| Settings → Sound | Theme's pick and twelve | the same, and **Sparkle** and **Party** once the key has been given |
| The background | the glow | the glow, and under Superpink a field of twenty-six twinkles drifting behind the words |
| A check-off | ribbons, hearts, stars | the same, and sparkles (Superpink) or sprinkles — short rounded bars in six candy colours (Birthday) |
| The strike | a colour, or Pink's shimmer | the same, and Superpink's pink → gold → white shimmer and Birthday's candy stripe |
| The progress bar | the accent's three tones | the same by default (a token now), and each Secret kit names its own |
| The finale | confetti and "That's the list." | the same, and a full-screen bloom under "Everything crossed off but you." or a cake with candles under "Make a wish. The list can wait." |
| What's new | 1.7's entry | 1.8: "A little something for someone in particular." and one line |

## Structure of the change

- `theme.js`: two kits in `RAW` with `secret: true`, so `finalize()` derives, contrast-checks (against `--ink-3` since 1.7) and codes them like every other kit while `CURATED_DAY`/`CURATED_NIGHT` leave them out; `SECRET`, `SECRET_IDS`, `isSecretTheme`, `isSecretCode`; `isSecretKey` (two FNV-1a passes, so the word is not a string in the file); two font pairs (`fredoka`, `baloo`), not in `CUSTOM_PAIRS`; a `barBg` token with the old bar as its default. 586 → 644 lines.
- `packs-secret.js` (new, 80 lines): Sparkle and Party, built from `packs.js`'s `HELPERS` passed in. `sound.js` fetches it only when the kit that is on asks for one of them — `warm(engine)` from `applyThemeCode`, `ready(engine)` for the unlock chime — and `state()` reports whether it arrived.
- `secretfx.js` (new, 188 lines) and `secretfx.css` (new, 13 rules): `createField(host, …)` links the stylesheet by the page's build, builds the twinkles and keeps them in step with `prefers-reduced-motion` and the tab's visibility; `finale(kind, fx, …)` plays the bloom or the cake. Neither is fetched until a kit that carries one goes on.
- `fx.js`: `scene(draw)` — a drawing in the same frame loop on the same canvas, dropped when it returns false, suppressed under reduced motion like everything else there; the sparkle and sprinkle shapes; `shapes` may be a list; `burst` takes a palette-and-shapes override for one throw.
- `app.js`: `finaleFx()` (the volley, or the kit's own finale, inside 1.7's reduced-motion guard); `paintField()`; the finale line per kit; `unlockSecret()` and `forgetSecret()` on the api; `secret` and `field` on the test hook, beside 1.7's redaction of the list's own.
- `panels.js`: the Secret group and its Forget row; the key in Import a code; the two engines in Settings → Sound once unlocked; the two new modules in `SHELL_FILES`.
- `index.html`: `#field` (hidden), the group's heading, its swatch row and its Forget chip, inside 1.7's sheet. `styles.css`: the candy keyframe, the two `@font-face` rules, `--bar-bg` with the old bar as the fallback the first frame paints, and the strike's animation moved to `.row.done .ink`. `sw.js` and `panels.js`: the two modules and the stylesheet in the shell precache.
- Two font files: `fonts/fredoka-500-700.woff2` (30 KB) and `fonts/baloo-2-500-800.woff2` (33 KB), latin subsets, OFL, self-hosted like the rest.
- Tests: three in the theme suite (the pair against the floors, the default bar, the key), one in the sound suite (the engines' own module, warm and ready, never fetched otherwise), two in the features suite (the wink, and nothing about the pair anywhere a reader can find it), eight in the browser suite — 139 there in all, 131 of them 1.7's.

## Before and after

The before set is 1.7's code as `main` shipped it, the after set this branch: 70 shots across 1440×900 and 390×844 before, 80 after — the ten the Secret pair adds are five surfaces at each viewport, and a version without the group skips that step, so one script takes both sets. Every other surface is unchanged.

**The theme picker, before and after.** Before is 1.7's picker (a sheet on the phone since the audit); after is the same picker on a device that has been given the key, with **Secret** between *Made for night* and *Yours* and *Forget the secret* under it. On a device that has not, the after picker is the before picker.

| the picker | desktop | phone |
|---|---|---|
| before — 1.7, and 1.8 before the key | <img src="shots/1.8/before/desktop-theme.png" width="300" alt="The theme picker on 1.7, desktop: Made for day, Made for night, Your own"> | <img src="shots/1.8/before/phone-theme.png" width="300" alt="The theme picker on 1.7, phone: the sheet, Made for day, Made for night, Your own"> |
| after — the same picker, unlocked | <img src="shots/1.8/after/desktop-theme-secret.png" width="300" alt="The theme picker on 1.8 after the key, desktop: the Secret group with two swatches and Forget the secret"> | <img src="shots/1.8/after/phone-theme-secret.png" width="300" alt="The theme picker on 1.8 after the key, phone: the sheet with the Secret group and Forget the secret"> |

What the pair looks like once one is chosen:

| surface | desktop | phone |
|---|---|---|
| the group | <img src="shots/1.8/after/desktop-theme-secret.png" width="300" alt="The theme picker's Secret group, desktop"> | <img src="shots/1.8/after/phone-theme-secret.png" width="300" alt="The theme picker's Secret group, phone"> |
| Superpink | <img src="shots/1.8/after/desktop-superpink.png" width="300" alt="Today under Superpink, desktop"> | <img src="shots/1.8/after/phone-superpink.png" width="300" alt="Today under Superpink, phone"> |
| Birthday | <img src="shots/1.8/after/desktop-birthday.png" width="300" alt="Today under Birthday, desktop"> | <img src="shots/1.8/after/phone-birthday.png" width="300" alt="Today under Birthday, phone"> |
| Superpink's finale, mid-bloom | <img src="shots/1.8/after/desktop-finale-superpink.png" width="300" alt="Superpink's finale mid-bloom, desktop"> | <img src="shots/1.8/after/phone-finale-superpink.png" width="300" alt="Superpink's finale mid-bloom, phone"> |
| Birthday's finale, candles lit | <img src="shots/1.8/after/desktop-finale-birthday.png" width="300" alt="Birthday's cake with its candles lit, desktop"> | <img src="shots/1.8/after/phone-finale-birthday.png" width="300" alt="Birthday's cake with its candles lit, phone"> |

The surfaces that did not change, before and after, for the record (the picker among them, until the key is given):

| surface | desktop before | desktop after | phone before | phone after |
|---|---|---|---|---|
| today | <img src="shots/1.8/before/desktop-today.png" width="240" alt="Today, desktop, before"> | <img src="shots/1.8/after/desktop-today.png" width="240" alt="Today, desktop, after"> | <img src="shots/1.8/before/phone-today.png" width="240" alt="Today, phone, before"> | <img src="shots/1.8/after/phone-today.png" width="240" alt="Today, phone, after"> |
| settings-sound | <img src="shots/1.8/before/desktop-settings-sound.png" width="240" alt="Settings, Sound, desktop, before"> | <img src="shots/1.8/after/desktop-settings-sound.png" width="240" alt="Settings, Sound, desktop, after"> | <img src="shots/1.8/before/phone-settings-sound.png" width="240" alt="Settings, Sound, phone, before"> | <img src="shots/1.8/after/phone-settings-sound.png" width="240" alt="Settings, Sound, phone, after"> |
| about | <img src="shots/1.8/before/desktop-about.png" width="240" alt="About, desktop, before"> | <img src="shots/1.8/after/desktop-about.png" width="240" alt="About, desktop, after"> | <img src="shots/1.8/before/phone-about.png" width="240" alt="About, phone, before"> | <img src="shots/1.8/after/phone-about.png" width="240" alt="About, phone, after"> |

## The two palettes, measured

Both go through `finalize()` with every other kit: text at 7:1 against the background, muted, dim and done at 4.5:1 there, and — since 1.7's audit — accent text and danger at 4.5:1 and the accent at 3:1 against `--ink-3`, the elevated surface a hovered star, a panel's danger row and the Share warning sit on, with the two secondary greys at 4.5:1 there too. Under that stricter floor the pair's written values came through untouched except Birthday's danger, which the engine darkened one step (`#C0392B` → `#B93225`) to clear it.

| kit | background | text ≥7 | muted ≥4.5 | dim ≥4.5 | accent text on a panel ≥4.5 | accent on a panel ≥3 | danger on a panel ≥4.5 | hairline ≥3 | muted on a panel ≥4.5 | dim on a panel ≥4.5 |
|---|---|---|---|---|---|---|---|---|---|---|
| Superpink | `#3F0026` | 15.18:1 | 9.33:1 | 7.24:1 | 4.86:1 | 3.80:1 | 5.69:1 | 3.07:1 | 7.19:1 | 5.58:1 |
| Birthday | `#FFF3F8` | 14.98:1 | 7.44:1 | 6.42:1 | 5.16:1 | 3.54:1 | 4.59:1 | 3.08:1 | 6.22:1 | 5.38:1 |
| Pink (1.2, for the scale) | `#2E0A1C` | 16.19:1 | 9.53:1 | 5.75:1 | 4.01:1 | 4.01:1 | 4.85:1 | 3.13:1 | 7.05:1 | 4.59:1 |
| Blush (1.2, for the scale) | `#FFF5F8` | 14.88:1 | 7.46:1 | 6.16:1 | 5.11:1 | 3.33:1 | 4.51:1 | 3.06:1 | 6.07:1 | 5.01:1 |

**Superpink** — dark, Fredoka + Quicksand, the sparkle pack, confetti #FF2E9A #FF7FC4 #FFC2E2 #FFFFFF #FFD36E #B5116F. Background OKLCH L 0.242 C 0.101 h 350; accent `#FF2E9A`, highlight `#FFC2E2`, deep `#B5116F`, danger `#FF8A76`.
**Birthday** — light, Baloo 2 + Quicksand, the party pack, confetti #FF7FC4 #5FC9AC #F7D774 #B79BE8 #7FC8F0 #FF8A6B. Background OKLCH L 0.975 C 0.014 h 350; accent `#D62E86`, highlight `#F2B33A`, deep `#96125A`, danger `#B93225`.

## The sounds, measured

`node tools/sounds.js shots/1.8/sounds` renders all fourteen over 4.6 s (check-offs at 0, 0.45 and 0.9 s, an uncheck at 1.5 s, the finale at 2.1 s) and draws the loudness. The twelve are 1.5's, re-rendered here; the two are the pair's:

| pack | check peak / RMS | uncheck peak / RMS | finale peak / RMS | finale length |
|---|---|---|---|---|
| knock | 0.425 / 0.042 | 0.128 / 0.011 | 0.343 / 0.044 | 0.75 s |
| bell | 0.385 / 0.065 | 0.111 / 0.010 | 0.327 / 0.045 | 1.35 s |
| blip | 0.118 / 0.014 | 0.076 / 0.008 | 0.114 / 0.017 | 0.46 s |
| typewriter | 0.388 / 0.023 | 0.146 / 0.007 | 0.273 / 0.021 | 0.69 s |
| marble | 0.365 / 0.029 | 0.141 / 0.009 | 0.365 / 0.035 | 1.17 s |
| pop | 0.281 / 0.023 | 0.156 / 0.011 | 0.341 / 0.030 | 0.80 s |
| kalimba | 0.309 / 0.066 | 0.104 / 0.017 | 0.370 / 0.045 | 1.59 s |
| pencil | 0.369 / 0.049 | 0.158 / 0.015 | 0.341 / 0.040 | 1.07 s |
| whistle | 0.170 / 0.062 | 0.139 / 0.047 | 0.164 / 0.059 | 1.28 s |
| bongo | 0.403 / 0.044 | 0.163 / 0.009 | 0.418 / 0.027 | 1.01 s |
| cork | 0.372 / 0.038 | 0.140 / 0.011 | 0.384 / 0.038 | 1.92 s |
| arcade | 0.074 / 0.026 | 0.070 / 0.030 | 0.119 / 0.021 | 1.23 s |
| **sparkle** | **0.197 / 0.027** | **0.100 / 0.011** | **0.210 / 0.028** | **1.33 s** |
| **party** | **0.253 / 0.026** | **0.133 / 0.015** | **0.229 / 0.021** | **1.11 s** |

| pack | the loudness over 4.6 s |
|---|---|
| sparkle | <img src="shots/1.8/sounds/sparkle.png" width="700" alt="sparkle: three glissandi up, a softer one down, a cascade climbing to a shimmer"> |
| party | <img src="shots/1.8/sounds/party.png" width="700" alt="party: a pop and a ta-da per check, a deflating pop, the birthday phrase over sprinkles"> |

## The sparkle field, measured

Twenty-six twinkles, two elements each: the outer drifts across the screen over a minute or two (`transform: translate3d`), the inner fades and swells (`opacity`, `scale`). Both are the compositor's, so the main thread is asked for nothing while a list sits on screen. Chrome's own per-renderer `TaskDuration` over five minutes, the same list under Dark for the scale:

| a list left on screen for five minutes | main-thread task time | of which style recalc | share of one core |
|---|---|---|---|
| Dark, three lines undone | 50 ms | 2 ms | 0.017% |
| Superpink, the field up, three lines undone | 235 ms | 10 ms | 0.078% |
| Superpink, the field up, the shimmer forced off | 253 ms | 11 ms | 0.084% |
| Superpink, all three lines struck (the finale on screen) | 26,754 ms | 8,850 ms | 8.92% |

The field is the difference between the first two rows: about six hundredths of a percentage point, and forcing the
shimmer off changes nothing, so the field is all of it. The last row is the shimmer strike, which is not new — it is
what Pink has cost since 1.2, and until this round it cost it on every row whether struck or not, so a list with
things still to do cost 4.7%. The animation runs on struck rows only now, which is why the first rows are flat.

## Verification results (1.8)

| check | result |
|---|---|
| Node — model, theme, crypto, sync, sound, features, compat | 27 · 28 · 9 · 13 · 11 · 24 · 7, all pass. The crypto vectors are the 1.4 ones, untouched. |
| The key | parses trimmed and in any case, refuses the near misses, is never mistaken for a code, and `parseCode` returns null for it; every curated code round-trips, the pair's included. |
| Contrast, under 1.7's stricter floor | both kits pass every token against the background **and** against the elevated surface (the table above). Their written values came through untouched except Birthday's danger, darkened one step by the engine. The other fourteen pass as they did. 2,000 random accents on both bases still pass. |
| The two sound packs | rendered offline with the twelve and level with them (the table above): Sparkle's check-off peaks at 0.197 / RMS 0.027 and Party's at 0.253 / 0.026, inside the twelve's 0.074–0.425 and 0.014–0.066. Party's finale is 1.11 s against the bell shimmer's 1.35 s. |
| Browser suite, 1440×900 and 390×844 | 139 tests, 0 failures, 0 page errors, 0 CSP violations, 0 third-party requests. 131 are 1.7's; 8 are the pair's. |
| The Secret group | hidden until the key, then a group of two swatches tagged as partners of each other; **inside 1.7's sheet on the phone**, with the grip, above *Yours*; its swatches are the bare buttons, not the wrapper a saved theme's × needs, so the partner chip still lands under the right group. Both themes in both slots; the flip between them; the fonts; the two finale lines; gone after Forget, with the slots back to Light and Dark and the field with them; the key survives a reload. |
| The sparkle field | z-index 1 — above the glow, behind the words, `pointer-events: none`; twenty-six twinkles on six drift paths, no two alike; no keyframe reads a custom property; no `requestAnimationFrame` at rest (exactly none in three seconds, after waiting for the page to go quiet); paused when the tab hides; no animation at all under `prefers-reduced-motion`, and no bloom there either. Its rules are in `secretfx.css`, not in the render-blocking stylesheet, and the suite asserts that too. |
| Idle CPU, five minutes each | the field is 0.078% of one core against Dark's 0.017%; the table above. |
| A device that never gives the key | walked through the picker, Settings and How it works: nothing of the pair fetched (`secretfx.js`, `secretfx.css`, `packs-secret.js`, neither font), Settings → Sound still Theme's pick and twelve, How it works still counts twelve, About's changelog is 1.8's wink and one line above 1.7's entry. |
| Real backend (`tools/realsync4.js`) | 6 tests, unchanged: envelopes on the wire, a view link's put refused with 403, the unchanged poll 29 bytes, presence, delete-and-undo, add-from-URL. A realistic list is 6,493 bytes encrypted. |
| Lighthouse (local, gzip, same machine, 1.7 against this branch) | desktop 100/100/100 both; mobile cold 99/100/100 both (FCP 1509 → 1510, LCP 1816 → 1817); mobile warm 100/100/100 both (1155/1174 → 1155/1177). Three earlier pairs after the stylesheet move: mobile cold 99 every time, LCP 1827/1831/1862 against 1857/1855/1842. |
| Installability | Chrome's own manifest read (`Page.getAppManifest`) returned no errors on either tree in the 1.6 round, with the same name, short name, `display: standalone`, in-scope `start_url` and three icons; nothing about the manifest changed since. (Lighthouse 12 no longer runs the `installable-manifest` audit — the PWA category is gone.) |
| iOS 26.5 simulator | the key typed into Import a code unlocks it, both themes with their fonts and the field, the status bar following the palette, both finales and both lines, the key surviving a reload, Forget putting the group and the slots back. Audio: through WebDriver a click is not a user gesture on 26.5, so the context stays suspended and the machine makes a fresh one per tap — what it should, and the same on 1.4, 1.5 and 1.7 (1.5's decisions record it). |
| iOS 18.1 simulator | all of the above, and the audio context **running** after a background and a return, with the Secret pair's own engine loaded (`extra: true`) and both finales playing through it. |
| Home Screen app | **not verified.** The Simulator's device windows do not enumerate from this session (they sit on another Space), the native simulator integration is unselected on this Mac (`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`, a password the session does not have), and a hand-written web clip is not registered with launch services, so it cannot be launched. From the code: nothing in this round reads `STANDALONE` or `display-mode` — the three places that do are the save-link sheet, the install hint and the wake lock, all untouched — and a web clip has its own storage, so the key has to be given to the installed app as well as to Safari. |
| Sizes | `secretfx.js` 10.7 KB, `secretfx.css` 1.6 KB, `packs-secret.js` 5.3 KB — none fetched until a kit that carries them goes on; `fredoka-500-700.woff2` 30 KB and `baloo-2-500-800.woff2` 33 KB, fetched only when one of the two paints text. The render-critical set is 4.5 KB gzipped over 1.7's, of which the render-blocking stylesheet is 274 bytes. First paint asks for none of the five. |

## Live checks (1.8)

Build 98 went live on the third poll (`version.js` 1.8 build 98, the worker `tf-v1.8-b98`, the modules asked for with `?v=98`). About reads **Version 1.8 (build 98)** with the changelog 1.8 → 1.0 (there is no 1.6 in it), its newest entry the wink and one line, and nothing anywhere on the page names either kit or the group.

**A fresh device** (desktop Chrome, no storage): the welcome, Skip, the save sheet, three seed lines, synced at rev 1. Nothing of the pair fetched. Then the key into Import a code: the group appears with both swatches, Superpink for Night and Birthday offered and taken for Day, and only then do `secretfx.js?v=98`, `secretfx.css?v=98`, `packs-secret.js?v=98` and `fredoka-500-700.woff2` come over the wire (Baloo 2 with them, since the picker paints Birthday's name in it). Superpink on screen with its twenty-six twinkles, its finale line under a bloom, the flip to Birthday, its cake and its line. No page errors, no CSP violations. The list was deleted everywhere afterwards.

**A device that last saw 1.7** (a phone-sized profile that made a list, crossed one line off, and remembers 1.7): a fresh navigation to the URL — not a refresh — brought 1.8 with the list intact, three rows with the one still struck, synced, and the what's-new toast the only new thing: "New in 1.8: A little something for someone in particular." No sheet, no question, no hint, nothing of the pair fetched and nothing of it on screen; on the next open the toast stayed hidden. Deleted everywhere afterwards. (The list *id* could not be compared across the two opens: since 1.7 the test hook reports "held" rather than the id off the local transport. The rows, the struck line and the synced status are the comparison.)

This record commit stamps build 99 and changes nothing else.

# Today's Five 1.9 — plan

The audit's proposals, in rank order: 1–31 and the open bug, with Price's guards, and one addition (the sound packs redistributed across the curated kits, and a sound for Day and one for Night). Nothing on the server changes; links, keys and the three RPCs are untouched; the document gains one optional top-level key (`zone`, proposal 3). The calls are in DECISIONS.md under "1.9 decisions"; each proposal's line in AUDIT.md says whether it shipped.

## The check-off, before and after (proposal 4)

Both GIFs are the three seed lines at 1440×900 on Dark: the first line crossed off (a sink past two rows), the next (a sink past one), then the last (the finale). Recorded from Chrome's own screencast with real timestamps by `tools/motion.mjs`, the before from the untouched 1.8 clone, at half size.

| before (1.8, build 99) | after (1.9) |
|---|---|
| <img src="shots/1.9/motion-before.gif" width="440" alt="the check-off in 1.8: strike, a pause, the sink"> | <img src="shots/1.9/motion-after.gif" width="440" alt="the check-off in 1.9: strike, the sink as the ink lands"> |

What the page itself measured while the GIFs were recorded (ms after the tap, desktop):

| moment | 1.8 | 1.9 |
|---|---|---|
| the knock scheduled | +2 | +2 |
| the ink lands (one line) | +386 to +400 | +235 to +262 |
| the re-render, the sink's first frame | +520 | +320 |
| the sink at rest | ~+1040 (520 + 520) | ~+650 (320 + 300 + the wave) |
| the finale card on screen | +3, fully in by +525 | starts at +303, under the chord |
| the chord and the confetti | +643 | +303 |
| rows crossing | drawn over each other for ~150 ms | the crossed-off line passes over the others on the page's ground |

## The sound packs, redistributed (the addition)

Twelve public packs, sixteen public kits after this round. Until 1.9 the six packs of 1.5 (kalimba, pencil, whistle, bongo, cork, arcade) sat on no kit at all — a person heard one only by overriding — while four kits knocked and five rang bells. The rule was to change a kit only where the new pack is clearly the better fit, and to leave Dark, Light and Pink exactly as 1.0 made them.

| kit | 1.8 | 1.9 | why |
|---|---|---|---|
| Dark | knock | knock | v1's, kept |
| Light | knock | knock | v1's, kept |
| Pink | bell | bell | v1's, kept |
| Midnight | bell (low) | bell | a low bell at midnight is right |
| Forest | marble | marble | 1.0's call (wood and glass) holds |
| Paper | typewriter | typewriter | 1.0's call holds |
| Terminal | blip | blip | a terminal beeps; an arcade is another place |
| Sunset | bell | **cork** | the aperitivo hour: a cork and a glug, in Sunset's lower register |
| Dusk | bell (high) | bell | a high bell at twilight is right |
| Harbor | pop | **whistle** | a ferry, not a splash; the whistle at Harbor's pitch |
| Ember | knock (sawtooth) | **bongo** | hands by a fire; the harsh knock was a stand-in |
| Cocoa | knock (soft) | **kalimba** | warm wood; the soft knock was a stand-in |
| Blush | bell (Pink's) | **pop** | fizz — its own voice instead of a borrowed bell |
| Teletype | blip | blip | Terminal's day keeps Terminal's engine |
| **Sketch** (new) | — | **pencil** | a pencil fits no kit that exists (Paper types, on purpose, since 1.0): a sketchbook by day |
| **Arcade** (new) | — | **arcade** | a coin fits no kit that exists (Terminal beeps): a cabinet in the dark, Sketch's night |

Every changed kit keeps every parameter it had (pitch, decay, and Ember's and Cocoa's knock-only noise, filter and tone), so a device that pins its old pack through the update hears exactly what it heard. Whistle and kalimba are each on a kit (Harbor, Cocoa); every one of the twelve is on at least one.

**The two new kits** went through the same floors as every kit (`report()`): Sketch — text 13.2:1, muted 6.0, dim 4.6, accent text 6.7, accent 3.8, danger 5.8, and 4.6–5.4 for the greys and accent text on ink-3; Arcade — text 17.4, muted 9.2, dim 5.8, accent text 8.0, accent 6.1, danger 6.5. They are a day/night pair (the picker offers one beside the other) on the Outfit pair. Their engines play the packs' own parameters, so 1.5's level table applies unchanged; it was re-rendered for the record (`shots/1.9/sounds/`): pencil peaks 0.376 / 0.143 / 0.421 (check, uncheck, finale), arcade 0.074 / 0.070 / 0.119 — the same figures as 1.5.

| Sketch | Arcade |
|---|---|
| <img src="shots/1.9/kit-sketch-desktop.png" width="440" alt="Sketch: warm paper, graphite text, a mustard accent"> | <img src="shots/1.9/kit-arcade-desktop.png" width="440" alt="Arcade: near-black indigo, neon magenta"> |

## A sound for Day and one for Night (the addition)

The single per-device override became one per slot without a new row: Settings › Sound pack keeps its place, its sub-line reads both slots (`Day: Theme's pick (Knock) · Night: Kalimba`) and opens a sheet with two pickers. Each defaults to Theme's pick with the theme's pack named, each previews on select, and each sub-line says which one wins: "Light picks Knock, and that's what plays by day" or "Light picks Knock; this device plays Kalimba by day". The builder's own Sound choice is what "Theme's pick" means for a theme you made.

| the row | the sheet | a pick |
|---|---|---|
| <img src="shots/1.9/settings-sound-row-phone.png" width="260" alt="Settings: the Sound pack row reads both slots"> | <img src="shots/1.9/sound-sheet-phone.png" width="260" alt="the Sound pack sheet: Day and Night pickers"> | <img src="shots/1.9/sound-sheet-picked-phone.png" width="260" alt="Night set to Kalimba: the sub-line says this device plays it at night"> |

**Nobody hears a change on update.** A device's single override (`dev.soundPack`) lands in both slots. A device with no override whose Day or Night theme is one of the five kits whose pack changed gets the old pack pinned in that slot (`PACK_BEFORE_19`), and the sheet says so: "Cocoa picks Kalimba since 1.9; this device keeps Knock at night, as before". The pin lifts when that slot gets a different theme (the new theme plays its own pack) or when the person picks anything in the sheet. The migration runs once, on the first open of 1.9; the old key stays for a rollback. The browser suite checks all three devices — fresh, one override, two pinned kits — at both viewports.

## Before and after

Every surface at 1440×900 and 390×844 is in `shots/1.9/before` (1.8, build 99) and `shots/1.9/after`, taken by `tools/shots.js`. The ones the round changed:

| surface | before (1.8) | after (1.9) |
|---|---|---|
| the welcome (Skip starts an empty list) | <img src="shots/1.9/before/desktop-welcome.png" width="300" alt="1.8's welcome: Skip keeps the three lines"> | <img src="shots/1.9/after/desktop-welcome.png" width="300" alt="1.9's welcome: Skip — start with an empty list"> |
| the save sheet (a way out) | <img src="shots/1.9/before/desktop-save-link.png" width="300" alt="1.8's save sheet: I've saved it alone"> | <img src="shots/1.9/after/desktop-save-link.png" width="300" alt="1.9's save sheet: ×, Not yet, I've saved it"> |
| Settings, desktop (three groups) | <img src="shots/1.9/before/desktop-settings.png" width="300" alt="1.8's Settings"> | <img src="shots/1.9/after/desktop-settings.png" width="300" alt="1.9's Settings: Appearance, This device, This list"> |
| Settings, phone | <img src="shots/1.9/before/phone-settings.png" width="200" alt="1.8's Settings on the phone"> | <img src="shots/1.9/after/phone-settings.png" width="200" alt="1.9's Settings on the phone"> |
| Settings › Sound (one row, both slots) | <img src="shots/1.9/before/desktop-settings-sound.png" width="300" alt="1.8: an inline select"> | <img src="shots/1.9/after/desktop-settings-sound.png" width="300" alt="1.9: the row reads Day and Night"> |
| Lists (no id fragments, no bottom buttons) | <img src="shots/1.9/before/desktop-lists-grouped.png" width="300" alt="1.8's Lists"> | <img src="shots/1.9/after/desktop-lists-grouped.png" width="300" alt="1.9's Lists"> |
| a list's detail (History, Whose list is this?) | <img src="shots/1.9/before/desktop-list-detail.png" width="300" alt="1.8's list detail"> | <img src="shots/1.9/after/desktop-list-detail.png" width="300" alt="1.9's list detail with History and the whose radiogroup"> |
| Share (view first, then the same list with full control) | <img src="shots/1.9/before/desktop-share.png" width="300" alt="1.8's Share"> | <img src="shots/1.9/after/desktop-share.png" width="300" alt="1.9's Share"> |
| the line menu (icons, one anatomy) | <img src="shots/1.9/before/desktop-line-menu.png" width="300" alt="1.8's line menu"> | <img src="shots/1.9/after/desktop-line-menu.png" width="300" alt="1.9's line menu with icons and Move to…"> |
| the section menu | <img src="shots/1.9/before/desktop-section-menu.png" width="300" alt="1.8's section menu"> | <img src="shots/1.9/after/desktop-section-menu.png" width="300" alt="1.9's section menu with icons and sub-lines"> |
| the theme picker (the builder behind a row, Sketch and Arcade) | <img src="shots/1.9/before/desktop-theme.png" width="300" alt="1.8's picker with the builder inside"> | <img src="shots/1.9/after/desktop-theme.png" width="300" alt="1.9's picker: Make your own › under the swatches"> |
| the ⋯ menu, phone | <img src="shots/1.9/before/phone-menu.png" width="200" alt="1.8's ⋯ menu"> | <img src="shots/1.9/after/phone-menu.png" width="200" alt="1.9's ⋯ menu"> |
| idle (0.2, not 0) | <img src="shots/1.9/before/desktop-idle.png" width="300" alt="1.8 idle: the controls gone"> | <img src="shots/1.9/after/desktop-idle.png" width="300" alt="1.9 idle: the controls at 0.2"> |

The audit's own evidence, re-taken: every `audit/<name>.png|txt|json` has a `-after` twin from `tools/audit/after.mjs`, and `audit/leak-after.json` closes the bug.

## Lighthouse

The 1.8 clone on 8792 and the working copy on 8791, two rounds each in sequence on a quiet machine after the browser suite had finished (the same run.sh as 1.4's, in the session scratch):

| | 1.8 (c) | 1.9 (c) | 1.8 (d) | 1.9 (d) |
|---|---|---|---|---|
| desktop perf / FCP / LCP | 100 / 365 / 447 | 100 / 414 / 454 | 100 / 364 / 446 | 100 / 415 / 455 |
| mobile cold perf / FCP / LCP | 99 / 1699 / 1849 | 98 / 1775 / 2000 | 99 / 1699 / 1849 | 99 / 1585 / 1967 |
| mobile warm perf / FCP / LCP | 99 / 1511 / 1820 | 98 / 1777 / 2002 | 99 / 1701 / 1851 | 98 / 1776 / 2001 |

Scores are the same (the mobile 98 shows up in 1.8's runs too, in an earlier pair). The request graph is identical — eighteen requests in the same order — and the unthrottled first paint is the same 40 ms on both; what moved is bytes: the first paint carries 9.3 KB more gzipped (index.html +1.2, styles.css +1.0, app.js +3.0, model.js +2.4, theme.js +1.1: the two kits, the zone, the choreography, the sheet, and about half of it comments), 168.5 → 177.8 KB, and Lighthouse's simulated network puts that at +50 ms on the desktop and 60–150 ms on mobile, inside the 190 ms the same build varies between two of its own runs (1.9's cold 1585 beats 1.8's 1699). Recorded in DECISIONS.md as the one thing this round could not hold to the byte.



---

# Today's Five 1.11 — a look of its own

The mark and the default dark palette were borrowed from a law firm's logo when this was a toy: a
charcoal tile (`#1A1D21`) with an orange check (`#D26128`). It is going to the App Store, so this
round gives it colours of its own. Nothing else: no features, no copy beyond what the look forces.

## What the mark is, and what it is not

**The mark does not change.** Same tile, same check, same proportions. The first pass drew three new
marks on the brief's "no checkmark — the product is five lines and a strike"; that was reversed, and
`icons/mark.svg` is a **trace** of the artwork rather than a redrawing. Its numbers are the ones
`apple/TodaysFive/tools/make-icon.mjs` had fitted by least squares off `icons/apple-touch-icon.png`,
expressed as fractions of the side times 1024.

```bash
node tools/mark.mjs --trace   # renders it in the OLD colours and diffs it against the shipped icon
```

**1.60 % of pixels differ**, inside the 2 % that script allowed. That is the only thing that says the
drawing has not drifted from the artwork, and it is why the old script's `--check` flag survived the
rewrite in a new form.

## The colourway, and how it was chosen

Two contact sheets, both committed beside the screenshots:

- `shots/1.11-contact-sheet.png` — the first round: three colourways × two accents, at 1024 / 180 /
  circular mask / 32, on a real 26.5 Home Screen, and the card.
- `shots/1.11-finalists.png` — the second: four finalists in context, each with its Home Screen tile,
  its card, and Today's screen on Paper and on Terminal with that colourway's accent doing the work.

The pick is **Paper tile `#F7F2E8`, check `#A86014`**, with the accent carried into the app.

## The accent, and the limit that is arithmetic

The accent has one hard job: read on **Paper** and on **Terminal**, the two default slots from 1.11
on. That job has a limit worth stating plainly, because it is not a matter of taste:

| | needs relative luminance |
|---|---|
| 4.5:1 against Paper's `#F7F2E8` | **≤ 0.159** |
| 4.5:1 against Terminal's `#070A08` | **≥ 0.188** |

The interval is empty. **No single colour is 4.5:1 text on both.** So the brief's "passes 4.5:1 as
text and 3:1 as a UI colour on both" is met the way this codebase has always met it: one accent hex
used as a *UI* colour at WCAG's 3:1 non-text floor, and a **per-theme** `accentText` at 4.5:1, which
every curated kit already carries. `#A86014` has luminance 0.1674 — between the two bounds, as any
colour that reads on both must be.

Balancing for the best *weakest* contrast pins any accent near L 0.57 in OKLCH. There `#A86014`
clears the 3:1 floor on all four grounds by 16 % (**min 3.48**) while holding C 0.124 — as much
chroma as a warm hue has at that lightness. The round began in the blue-violets, which hold about
twice that (C 0.24); the "not orange" line was withdrawn mid-round, and warm won on taste with that
cost stated.

## Contrast, measured

Every token against the surface it is actually painted on — `theme.js` fixes `text`/`muted`/`dim`/
`done` against `--ink` and `accent`/`accentText`/`danger` and the `-2` greys against `--ink-3`, the
elevated surface (panels, filled chips, a lifted row). **Nothing here is eyeballed.**

| theme | token | hex | measured on | ratio | floor |
|---|---|---|---|---|---|
| paper | `text` | `#1F1B16` | `--ink` | **15.34** | 7:1 |
| paper | `muted` | `#5E5749` | `--ink` | **6.41** | 4.5:1 |
| paper | `dim` | `#6C6559` | `--ink` | **5.17** | 4.5:1 |
| paper | `done` | `#6C6559` | `--ink` | **5.17** | 4.5:1 |
| paper | `hairSolid` | `#8E8980` | `--ink` | **3.12** | 3:1 |
| paper | `accent` | `#A86014` | `--ink-3` | **3.48** | 3:1 |
| paper | `accentText` | `#8F4D00` | `--ink-3` | **4.68** | 4.5:1 |
| paper | `danger` | `#B02A1A` | `--ink-3` | **4.74** | 4.5:1 |
| paper | `muted2` | `#5E5749` | `--ink-3` | **5.15** | 4.5:1 |
| paper | `dim2` | `#665F53` | `--ink-3` | **4.55** | 4.5:1 |
| paper | `done2` | `#665F53` | `--ink-3` | **4.55** | 4.5:1 |
| terminal | `text` | `#D8FFD8` | `--ink` | **18.20** | 7:1 |
| terminal | `muted` | `#7FCB86` | `--ink` | **10.22** | 4.5:1 |
| terminal | `dim` | `#67A96E` | `--ink` | **7.08** | 4.5:1 |
| terminal | `done` | `#67A96E` | `--ink` | **7.08** | 4.5:1 |
| terminal | `hairSolid` | `#5A5F5C` | `--ink` | **3.06** | 3:1 |
| terminal | `accent` | `#A86014` | `--ink-3` | **3.48** | 3:1 |
| terminal | `accentText` | `#BF7530` | `--ink-3` | **4.64** | 4.5:1 |
| terminal | `danger` | `#FF6B57` | `--ink-3` | **5.99** | 4.5:1 |
| terminal | `muted2` | `#7FCB86` | `--ink-3` | **8.63** | 4.5:1 |
| terminal | `dim2` | `#67A96E` | `--ink-3` | **5.98** | 4.5:1 |
| terminal | `done2` | `#67A96E` | `--ink-3` | **5.98** | 4.5:1 |
| dark | `text` | `#F7F2E8` | `--ink` | **17.82** | 7:1 |
| dark | `muted` | `#A8A49C` | `--ink` | **8.01** | 4.5:1 |
| dark | `dim` | `#8F8C84` | `--ink` | **5.92** | 4.5:1 |
| dark | `done` | `#8F8C84` | `--ink` | **5.92** | 4.5:1 |
| dark | `hairSolid` | `#5A5F5C` | `--ink` | **3.06** | 3:1 |
| dark | `accent` | `#A86014` | `--ink-3` | **3.48** | 3:1 |
| dark | `accentText` | `#BF7530` | `--ink-3` | **4.64** | 4.5:1 |
| dark | `danger` | `#DC5E59` | `--ink-3` | **4.63** | 4.5:1 |
| dark | `muted2` | `#A8A49C` | `--ink-3` | **6.76** | 4.5:1 |
| dark | `dim2` | `#8F8C84` | `--ink-3` | **5.00** | 4.5:1 |
| dark | `done2` | `#8F8C84` | `--ink-3` | **5.00** | 4.5:1 |

Zero below floor. Reproduce with the snippet in `test/theme.test.js`, which asserts the same floors
on every kit as part of the suite.

## What changed in the themes, and what did not

- **Dark is recoloured in place.** Same id, same name, same Lato pair, same knock, same confetti
  shapes — a device that chose Dark is not moved off it. Only colour moved: Terminal's grounds, the
  brand's paper as ink, the brand accent. It also left the `ORIGINAL` set, so it is now held to the
  same contrast floors as every other kit instead of being grandfathered past them.
- **Paper and Terminal carry the brand accent**, so the app's default look is the brand's. Their
  inks, their type, their sounds and Terminal's phosphor text are untouched.
- **Every other theme is untouched**, Superpink and Birthday included.
- **The default pair is Paper by day and Terminal by night**, and only for a device that never chose:
  every read is `dev[slot] || SLOT_DEFAULT[slot]`.

## One thing this round could not hold to

**The first paint pulls different fonts now**, because the default pair changed and the faces come
with the kit:

| a fresh device's first paint | faces | bytes |
|---|---|---|
| 1.10, either system (Lato + PT Sans) | `lato-900`, `pt-sans-400`, `pt-sans-700` | 36,812 |
| 1.11, dark system (Terminal, mono) | `jetbrains-mono-500-800`, `ibm-plex-mono-400/600`, `pt-sans-700` | 63,136 |
| 1.11, light system (Paper, serif) | `playfair-display-700-800`, `source-serif-4-400-600`, `pt-sans-700` | 101,008 |

Woff2 is already compressed, so those are close to wire bytes. This is the direct cost of making the
typographic kits the defaults, and it is recorded here rather than buried. The Lighthouse numbers
below are what it actually came to.

## Lighthouse, and the one number that went the wrong way

Lighthouse 13.4.1, headless Chrome, twice per form factor, against a local server: 1.10 from a
worktree of `main` on one port, 1.11 from the working tree on another, back to back on the same
machine.

| | 1.10 run 1 | 1.10 run 2 | 1.11 run 1 | 1.11 run 2 |
|---|---|---|---|---|
| desktop perf / a11y / BP / SEO | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| desktop FCP / LCP / TBT / CLS | 368 / 452 / 0 / 0 | 414 / 454 / 0 / 0 | 428 / 494 / 0 / 0.002 | 428 / 495 / 0 / 0.002 |
| mobile perf / a11y / BP / SEO | 98 / 100 / 100 / 100 | 99 / 100 / 100 / 100 | 98 / 100 / 100 / 100 | 98 / 100 / 100 / 100 |
| mobile FCP / LCP / TBT / CLS | 1777 / 2002 / 0 / 0.001 | 1588 / 1973 / 0 / 0.001 | 1810 / 2130 / 0 / **0** | 1811 / 2132 / 0 / **0** |
| total byte weight | 174 KB | 174 KB | 192 KB | 192 KB |

**Mobile is slower, and this is the round's one broken promise.** LCP goes from 1973–2002 ms to
2130–2132 ms (+130 to +160), and the best mobile score drops from 99 to 98 — 98 appears in 1.10's own
runs, so the *score* is inside its usual spread, but the LCP is not: 1.11's two runs are tighter than
1.10's and both sit above 1.10's worse one.

**The cause is exactly one thing, and it is measured, not guessed.** From the runs' own network
records:

| | font files on first paint | transferred |
|---|---|---|
| 1.10 (Lato + PT Sans, whatever the system) | `lato-900`, `pt-sans-400`, `pt-sans-700` | **37 KB** |
| 1.11 (Terminal's mono, on a dark system) | `jetbrains-mono-500-800`, `ibm-plex-mono-400`, `ibm-plex-mono-600`, `pt-sans-700` | **62 KB** |
| 1.11 (Paper's serifs, on a light system) | `playfair-display-700-800`, `source-serif-4-400-600`, `pt-sans-700` | 101 KB on disk |

Moving the default pair from Light/Dark to Paper/Terminal moves the default *typeface* from one sans
pair to a mono pair or a serif pair, and those are bigger files. Nothing else in the round costs
anything: the icons shrank (`apple-touch-icon.png` 3,699 → 1,348 bytes, `icon-512.png` 18,583 →
3,777), the card is the same size, and no module grew.

CLS moved the other way and is worth recording: mobile 0.001 → **0**, desktop 0 → 0.002.

### The preload, and what it did and did not buy

The obvious lever was tried: **preload the default pair's two faces.** The boot script injects them,
not the markup, because it can do something markup cannot — it already reads `tf/v2/themecss` before
the stylesheet is requested, so it preloads **only for a device that has chosen nothing**. A device
carrying its own theme is about to paint something else and would be fetching two files it never
uses. It picks by `prefers-color-scheme`: Playfair + Source Serif for Paper, JetBrains Mono + Plex
Mono for Terminal. Verified in both schemes: the right two links, every preloaded file used, no
"preloaded but not used" warning and no CSP violation.

**At the network layer it did exactly what it says.** From the mobile run's own records, the two mono
files move from discovery-after-CSS to alongside it:

| | starts | ends |
|---|---|---|
| before: `jetbrains-mono-500-800` | 35 ms | 37 ms |
| after: `jetbrains-mono-500-800` | **7 ms** | 13 ms |
| (`styles.css`, for scale) | 8 ms | 11 ms |

**And it did not recover the mobile number**, because the mobile number was never about discovery.
Four runs of each, and the within-build spread is small enough to trust the difference:

| mobile | runs | FCP | LCP |
|---|---|---|---|
| 1.10 | 4 | 1590–1777 | **1977–2002** |
| 1.11, no preload | 2 | 1810–1811 | 2130–2132 |
| 1.11, preloaded | 5 | **1782–1798** | 2157–2173 |

Lighthouse's mobile score throttles *bandwidth*, and the bytes still have to cross it. Fetching them
earlier puts them in contention with the render-blocking CSS instead of after it, which is why FCP
improves by ~24 ms and LCP gets ~30 ms worse — a trade, not a win. Both deltas sit inside 1.10's own
25 ms run-to-run spread on LCP, so neither is worth much on its own.

**Desktop, which is not throttled, is where the preload pays.** FCP 428 → **367–396**, LCP 494 →
**456–491**: back to 1.10's numbers (370–414 / 454–457) after having been behind them.

It stays in. It is the right thing on any connection where discovery is the constraint rather than
throughput, it makes desktop whole again, and it costs nothing to the devices it skips. The mobile
LCP gap is unrecovered and is the round's one broken promise; the only lever that would close it is
keeping Light and Dark as the default pair, which is a look decision rather than a performance one.

## Before and after

`shots/1.11/before` is 1.10 from a worktree of `main`; `shots/1.11/after` is this branch. Eighty
surfaces each, at 1440×900 and 390×844, shot by `tools/shots.js` against a local server.

The pairs that carry the round:

| | before (1.10) | after (1.11) |
|---|---|---|
| Today, phone | `phone-today.png` — charcoal `#1A1D21`, orange strike | `phone-today.png` — Terminal, `#A86014` strike and box |
| Today, desktop | `desktop-today.png` | `desktop-today.png` |
| The welcome | `desktop-welcome.png`, `phone-welcome.png` | the same, in the new pair |
| Day and night | `desktop-flip-day.png` | Paper, not Light |
| The card | `icons/og.png` in the tree | regenerated by `tools/mark.mjs` |

The two contact sheets the choice was made from are `shots/1.11-contact-sheet.png` (three colourways
× two accents) and `shots/1.11-finalists.png` (four finalists, each with its Home Screen tile, its
card, and Today on Paper and on Terminal).

## Verification results

| | |
|---|---|
| `test/model.test.js` | 27 passed |
| `test/theme.test.js` | 31 passed (2 new: the brand's invariants, and Dark recoloured in place) |
| `test/crypto.test.js` | 10 passed — the pinned vectors, untouched |
| `test/sync.test.js` | 14 passed |
| `test/sound.test.js` | 11 passed |
| `test/features.test.js` | 28 passed |
| `test/compat.test.js` | 9 passed |
| `apple/TodaysFiveCore` `swift test` | **94 passed** in 7 suites |
| `tools/e2e4.js` 1440×900 + 390×844 | **159 passed, 0 failed**, zero page errors, zero CSP violations, zero third-party requests |
| `tools/realsync4.js` (live backend, once) | 6 passed, 6 of 6 lists cleaned up |
| Lighthouse desktop / mobile | above |

Two things the browser suite caught that reading would not have:

- **`--done` and `--done-2` are the same colour in the recoloured Dark**, because its grey already
  clears 4.5:1 on `--ink-3`. The test that proves a lifted line reads in `--done-2` was pointed at
  Pink, a night kit where the two genuinely differ, so it still proves something.
- **The shake hint landed on top of the install hint on a phone**, by ten pixels. The stack used a
  96 px constant that was right for Lato at 13 px; Terminal's mono sets that hint taller. It stacks
  on the install hint's *measured* height now (`--install-h`, set by `app.js`), the way the toast has
  stacked on `--shake-h` since 1.9. A real collision, found because the default pair changed.
