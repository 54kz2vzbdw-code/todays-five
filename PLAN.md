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
