# Today's Five 1.7 audit — Privacy and security lens

No blocker. The list secret never leaves the fragment on the wire, no XSS anywhere, no crash on any hostile
import. One real defect: the service worker writes the Private link into Cache Storage, where the app's own
"forget this list" actions cannot reach it.

Scripts: `$OUT/p1-leaks.mjs`, `p2-render.mjs`, `p3-cache-share.mjs`, `p4-stranger.mjs`, `p5-view.mjs`.
Transcripts: the matching `.txt` files. All runs local transport, `http://127.0.0.1:8796/?transport=local`.

---

### The service worker writes the Private link (W) into Cache Storage

- severity: bug
- environment: desktop, fixture `fresh`, opened with `?transport=local&sw=1` (i.e. any real deploy, where the worker always registers)
- steps:
  1. Open a list so the worker is installed and controlling; reload once.
  2. `caches.keys()` -> `caches.open(name).keys()` and read the entry URLs.
  3. Remove every `tf/*` key from localStorage — everything "Remove from this device" and "Delete this list everywhere" touch — and read the cache keys again.
- evidence: `$OUT/p4-stranger.txt` (last block), `$OUT/cache-keys.json`, `$OUT/cache-secret-key-desktop.png`, `$OUT/p2-render.txt` ("service worker caches")
  ```
  ### cache key while the list is held: {"tf-v1.5-b76":["http://127.0.0.1:8796/?transport=local&sw=1#/l/3hPNE35YNUlYWOExyhbedm"]}  (W = 3hPNE35YNUlYWOExyhbedm)
  ### after every tf/* localStorage key is removed: {"tf-v1.5-b76":["http://127.0.0.1:8796/?transport=local&sw=1#/l/3hPNE35YNUlYWOExyhbedm"]}
  ### the Private link is STILL in Cache Storage: true
  ```
  Code: `sw.js:57` `caches.open(CACHE).then(c => c.put(req, copy))` — for a navigation, `event.request.url` still
  carries the fragment, so the Cache Storage key is the whole link including W. `grep -n "caches\." app.js panels.js
  sync.js model.js index.html` returns nothing: outside `sw.js` the app never touches Cache Storage, and `sw.js` only
  deletes whole build generations (`sw.js:26`).
- why it matters: the secret in `#/l/<W>` *is* the list — it derives the key, the row id and the write token. The design
  keeps exactly two copies of it on a device (the address bar and `tf/v3/list/<W>` in localStorage), both of which the app
  can and does delete. This is a third copy, written to disk in a store the app never cleans, the user cannot see, and
  neither Remove nor Delete can reach; it survives until two more deploys reap that cache generation. The about page
  promises "Delete this list everywhere removes it from the server and from this device on the spot" (`about.html:104`),
  and this copy is not removed on the spot. `sw.js:22` already notes that the `github.io` origin is shared with the
  author's other Pages projects, so any other page on that origin can read the store and lift the link.
  Because Cache *matching* ignores fragments (`sw.js:45`, `:60` already pass `ignoreSearch`), the fragment in the key
  buys nothing — it is pure residue. Only one navigation key exists at a time (a later `put` replaces the earlier one,
  fragment and all), so it is the most recently opened list that is exposed, not every list ever opened.
- proposed fix: key the shell cache on the fragment-free URL. In `sw.js`, hoist
  `const cacheKey = new Request(url.origin + url.pathname + url.search, { headers: req.headers });`
  and use it in both `c.put(...)` calls (lines 46 and 57) and in the `c.match(...)` lookups. One line of behaviour change,
  none of it observable — matching already ignores the fragment.

### The production test hook hands out W, R and the lookup id

- severity: papercut
- environment: every environment; the hook is defined unconditionally
- steps:
  1. Open any list. 2. Evaluate `typeof window.__tf` and `JSON.stringify(window.__tf())`.
- evidence: `$OUT/p1-leaks.txt`
  ```
  ### window hooks: {"tf":"function","tfTest":"object","tfManifest":"function","keys":["__tfManifest","__tf","__tfTest"]}
  ```
  `app.js:2153` `window.__tf = () => ({ ... listId, mode: listMode, lookupId: ref ? ref.lookupId : null, R: ref ? ref.R : null, ... })`
  — `listId` is W on an edit link. Contrast `app.js:2155`, where the sibling hook is gated:
  `if (TRANSPORT_KIND === "local") window.__tfTest = ...`.
- why it matters: a single global that returns the whole credential set is the shortest path from any future
  script-execution bug — or a browser extension, a bookmarklet, a devtools snippet a user is talked into pasting — to the
  list secret. The CSP makes remote script injection hard today, so this is defence in depth rather than a live hole; but
  the author already decided this class of hook belongs behind the local transport and `__tf` was left outside that rule.
- proposed fix: gate it the same way — `if (TRANSPORT_KIND === "local") window.__tf = ...` — or, if the suites need it
  everywhere, drop `listId`, `R` and `lookupId` from the object outside the local transport and let the harness read them
  from `location.hash`.

### No frame-ancestors: the app can be framed by any site

- severity: proposal
- environment: every environment
- steps: read the CSP metas.
- evidence: `index.html:20` and `about.html:19` — neither carries `frame-ancestors`, and a `<meta http-equiv>` CSP cannot
  carry it (the directive is ignored outside a real header). GitHub Pages serves no custom headers, so no header fix exists.
  Zero CSP violations were observed in every run (`$OUT/p2-render.txt`, `$OUT/p3-cache-share.txt`).
- why it matters: an attacker page can frame the list and overlay its own UI, so a click the user thinks lands on their
  page lands on a destructive control instead — "New keys" (revokes every existing link) or "Delete this list everywhere".
  The attacker never learns W (they cannot read a cross-origin frame's URL), so this is nuisance and destruction, not
  disclosure. The list only opens in the frame if the victim's browser is already holding it, which narrows it further.
- proposed fix: two lines inside the already-hashed boot script in `index.html` (re-run `tools/csp-hash.js` after):
  `if (self !== top) { document.documentElement.hidden = true; try { top.location = location; } catch (e) {} }`.

### Bidi override characters pass through into rendered lines

- severity: papercut
- environment: desktop, fixture `fresh`; via import, the composer, and the add-from-anywhere URL alike
- steps:
  1. Import `$OUT/payloads.json` (item `i3` is `safe<U+202E>gnp.exe<U+202C> tail`) or type the same string into a line.
  2. Read the row's `textContent` and look at the rendered row.
- evidence: `$OUT/p2-render.txt` — the row's html is `safe<U+202E>gnp.exe<U+202C> tail<span class="note">...`
  `model.js:111` `function str(v, max) { return typeof v === "string" ? v.slice(0, max) : ""; }` — truncation only, no
  character filtering, on every text field the app stores.
- why it matters: on a list shared with someone else, the writer can make a line read as one thing and be another
  (`gnp.exe` displays as `exe.png`). Nothing clickable is built from user text, so it stops at reading — but a shared list
  is exactly where a reader trusts what they see.
- proposed fix: strip the bidi controls in `str()` — drop U+202A-U+202E and U+2066-U+2069 before the slice. This is a
  rendering guard, not a document change; existing stored text is cleaned on the next read.

### The create limit is per network address, so a stranger on the same network spends it

- severity: proposal
- environment: server contract only (`supabase/migrations/002_v3.sql`); read, not called
- steps: read `private.check_create()` and `private.client_ip()`.
- evidence: `002_v3.sql:120-151`. `check_create` buckets on `sha256(salt || ip)` with `creates_per_hour = 12`,
  `creates_per_day = 40` (`002_v3.sql:55`). `client_ip()` (`:59-77`) reads
  `coalesce(cf-connecting-ip, split_part(x-forwarded-for, ',', 1), x-real-ip)`.
  `COMPATIBILITY.md:139` already records the operational consequence: "a day of suites can spend it, and a fresh device
  then reports 'busy' until it clears."
- why it matters: two separate edges. (a) The bucket is the *address*, not the person: everyone behind one office NAT,
  cafe, or carrier CGNAT shares 12 new lists an hour. A stranger — or a colleague running the suite — can consume a
  legitimate person's whole allowance, and that person's first list of the day fails to create. Existing lists keep
  working; only creation is denied, and the local copy survives, so it is a bounded denial of onboarding, not data loss.
  (b) `x-forwarded-for`'s *first* hop is whatever the client sent, so if `cf-connecting-ip` is ever absent (a direct
  origin hit, a change of edge provider) an attacker both escapes their own limit — a fresh random header per request —
  and can deliberately burn a chosen victim's bucket by claiming their address. Supabase currently fronts the API with
  Cloudflare, which sets `cf-connecting-ip`, so today (a) is the live edge and (b) is a latent one.
- proposed fix: prefer `cf-connecting-ip` only, and treat a bare `x-forwarded-for` as absent (the `mult := 10` shared
  bucket) rather than as an address.
- copy line: `supabase/migrations/002_v3.sql:147` — "Too many new lists from this network. Try again in a few minutes."
  already says the limit is per network. No copy change needed.

### Import accepts a file that can make a list permanently unsyncable

- severity: proposal
- environment: desktop, fixture `fresh`
- steps:
  1. More -> Settings -> Export & import -> choose `$OUT/huge.json` (1.7 MB, 4,000 lines of 400 characters).
  2. Read the label; press Merge into this list.
- evidence: `$OUT/p1-leaks.txt`
  ```
  import huge.json (1729819B) -> "huge.json: 4000 lines, 0 sections, 0 days of history"  pageErrors:+0
  ```
  Nothing in `panels.js:541-566` or `model.js importJSON` checks the size, and the 96 KB ceiling only exists on the
  server (`002_v3.sql:216`, `PT413`).
- why it matters: the file parses, the label reads like success, and the merge lands — then every push is refused with
  413 and the list is stuck on one device until the user works out what to delete. The failure is graceful (`app.js:134`
  `toolarge: "Too large to sync — saved on this device only"`, `app.js:1003` "This list is too large to sync. Clear out
  some old lines or history."), which is why this is a proposal and not a bug, but it is a foot-gun the app could catch
  a second earlier, where undoing it is one button.
- proposed fix: seal the merged document before committing it and compare `C.envelopeBytes(env)` against the 96 KB cap;
  over it, refuse with the count — e.g. "That import would make this list too big to sync (about 140 KB; the limit is
  96 KB). Import it as a new list instead."

### tools/shots.js will bake a working Private link and its QR into a committed screenshot if BASE is ever pointed at the live site

- severity: papercut
- environment: the release screenshot tool, not the app
- steps: read `tools/shots.js:12` and `:89`, then look at any committed share shot.
- evidence: `tools/shots.js:12` `const BASE = process.env.BASE || "http://127.0.0.1:8790/";` and every navigation is
  `BASE + "?transport=local"`; the committed `shots/1.5/after/desktop-share.png` shows
  `http://127.0.0.1:8791/#/l/b3tuNHkvEvpz0bU3s5BxVr/mine` in the field with a scannable QR of the same link above it.
  Harmless today: that id only ever existed in a throwaway local profile.
- why it matters: the whole safety of publishing these images rests on one env-var default. `BASE=https://.../todays-five/`
  with the same script would publish a live, scannable Private link into a public repo, and QR codes survive image
  compression far better than they look like they should.
- proposed fix: refuse to run against a non-local base — at the top of `tools/shots.js`,
  `if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(BASE)) throw new Error("shots.js only runs against a local server");`

---

## Checks that passed, with what backs them

**1. Logs and errors.** `grep -nE 'console\.(log|warn|error|info|debug)' *.js` over `app.js`, `panels.js`, `model.js`,
`sync.js`, `crypto.js`, `theme.js`, `sw.js`, `qr.js`, `exporter.js` returns **nothing** — the app never writes to the
console. Capturing every console message across an invalid import, an unknown link, an offline push and a reconnect:
`### console lines total: 0  lines containing a secret: 0` (`$OUT/p1-leaks.txt`). Zero page errors, zero console errors,
zero CSP violations in all five runs. Thrown messages are fixed strings that never echo input
(`model.js` "That file isn't JSON.", "That file isn't a Today's Five export."; `crypto.js` "bad link",
"not an envelope"; `sync.js` the four server sentences). An unknown link shows "This link no longer works"
(`app.js:133`) and the screen never echoes the id: `does the screen echo the id? false` (`$OUT/p4-stranger.txt`,
`$OUT/unknown-link-desktop.png`).

**2. Referrers and titles.** `document.title` is set nowhere in any module (`grep -n 'document\.title' *.js` -> nothing);
it stays "Today's Five" with a list open (`$OUT/p3-cache-share.txt`). The only anchors in the app are two same-origin
`about.html` links, no `target`, no `rel` — and none is needed, since there is no `target="_blank"` anywhere
(`grep -nE 'target='` on both HTML files -> nothing) so no `window.opener` exists.
`<meta name="referrer" content="no-referrer">` is present in **both** `index.html:19` and `about.html:18`, and holds in
practice: navigating from a list URL to about.html gives `document.referrer: ""` (`$OUT/p3-cache-share.txt`).
about.html's single outbound link (`about.html:110`, to GitHub) carries no `rel`, which is fine here — same-tab
navigation, no opener, and no-referrer covers the header — but `rel="noopener noreferrer"` would cost nothing.
The secret lives only in the fragment: `parts = {"hash":"#/l/dWclolDSexW6hnOLLuKVPo","search":"?transport=local","path":"/"}`.
The add-from-anywhere extras are stripped from the address bar the moment they are handled — `app.js:275`
`if (M.hashHasExtras(location.hash)) history.replaceState(null, "", BASE + SEARCH + frag(h))` — verified live:
after arriving at `#/l/<W>/add?text=<payload>&section=<payload>` the URL reads
`http://127.0.0.1:8796/?transport=local#/l/icr5UAaBfV18NPsF28UxFj`, with no query and no leftover text
(`$OUT/p2-render.txt`, `$OUT/render-addfromurl-desktop.png`). `frag()` (`app.js:259`) can only ever produce
`#/l/<id>` or `#/r/<id>`, so the panel-stack `pushState` entries (`app.js:1634`) reuse `location.href` and add nothing.

**3. Storage.** `localStorage` holds exactly the four documented keys and nothing else (`$OUT/localstorage.json`):
`tf/v2/meta` (contains W, by design — it is the registry), `tf/v3/list/<W>` (the decrypted copy, keyed by W),
`tf/v2/themecss` (no secret), `tf/v2/localserver/<lookupId>` (the test transport's row). The "server" row holds
`{doc:{v,alg,z,iv,ct}, rev, token}` — an envelope, nothing else — and `server row ct ... contains plaintext 'offline
line'? false`. R and the lookup id appear in no localStorage value. The service worker caches **only the shell**: the 26
`SHELL` entries plus fonts fetched on demand, all `text/javascript`, `text/css`, `image/png`, `font/woff2` (full
inventory in `$OUT/p2-render.txt`). No document, no envelope, no list content is cached anywhere but the app's own
localStorage. The one defect is the *key* of the cached navigation, reported above.

**4. Rendering.** Every payload — `<img src=x onerror=...>`, `"><svg onload=...>`, `<b>bold</b>`, `javascript:`-strings,
a 5,000-character line, the RTL override, multi-codepoint emoji — was entered as a line's text, a note, a list name, a
section name, a template name, a theme name, through the import file, and through `#/l/<W>/add?text=...`. Result:
`FINAL pwn: {"imgs":18,"bolds":1}` with `p1`, `p2`, `p3` all `undefined` — no injected node, no handler fired, no dialog,
zero page errors (`$OUT/p2-render.txt`; the imgs/bolds counts are the app's own chrome). Screenshots:
`$OUT/render-today-desktop.png` (the payload shown as literal text in the list), `render-lists-desktop.png`,
`render-templates-desktop.png`, `render-settings-desktop.png`, `render-theme-desktop.png`, `render-addfromurl-desktop.png`.
The DOM proves the escaping rather than the pixels: the row html reads
`&lt;img src=x onerror="window.__pwn=1"&gt; line<span class="note">...`.
Long text is capped, not rendered whole: `TEXT_MAX = 200`, `NOTE_MAX = 300` in `model.js`, `ta.maxLength = M.TEXT_MAX`
on the editor (`app.js:1287`), `.slice(0, TEXT_MAX)` on the add-from-URL path (`model.js parseHash`), so the
5,000-character line arrives as 200.

Every `innerHTML` / `insertAdjacentHTML` site, with a verdict (no `insertAdjacentHTML`, `outerHTML`, `document.write`,
`createContextualFragment` or `srcdoc` exists anywhere):

| site | content | verdict |
|---|---|---|
| `app.js:421`, `:503`, `:507`, `:658`, `:1318`, `:927`, `:932` | `= ""` | safe (clearing) |
| `app.js:678`, `:685`, `:689`, `:856`, `:881`, `:1606` | fixed markup / `ICONS.*` constants | safe |
| `app.js:956` | `<b>${d}</b>/${n}...` — two integers | safe |
| `app.js:962` | fixed hint markup | safe |
| `app.js:979-981` | day review: `r.streak`/`r.finishedThisWeek` integers, `d.day` an YYYY-MM-DD from `model.js`, line text through `escapeHtml()` | safe |
| `panels.js:95`, `:341`, `:446`, `:490`, `:677`, `:685` | `= ""` | safe (clearing) |
| `panels.js:448` | fixed empty-state markup | safe |
| `panels.js:351` | `A.escapeHtml(name)`, `A.escapeHtml(docName)`; `tags` built from the literal "view-only"; `l.id.slice(0,6)` is base62 | safe |
| `panels.js:680` | `A.escapeHtml(r.label)`, `A.escapeHtml(r.sub)` | safe |
| `panels.js:823`, `:872` | fixed help copy; keys through `esc = A.escapeHtml` | safe |

`escapeHtml` (`app.js:1867`) escapes `& < > " '`, correct for both text and quoted-attribute contexts — the attribute
case is exercised at `panels.js:355` (`aria-label`) and comes back correctly entity-encoded in `$OUT/p2-render.txt`.
History (`panels.js:446-460`) is built entirely with `createElement` + `textContent`. The import label is set with
`.textContent`, so the payload list name shows as literal text.

**5. Import parsing.** Six hostile files, no crash, no page error, in every case
(`$OUT/p1-leaks.txt`, files kept at `$OUT/*.json`):

| file | result |
|---|---|
| `bad-json.json` (malformed) | "That file isn't JSON." |
| `notours.json` (foreign shape) | "That file isn't a Today's Five export." |
| `arrays.json` (arrays where objects go, nulls, numbers, strings for collections) | parsed, 1 line — bad records dropped by `normItem`/`normSection` |
| `foreign-shape.json` (a doc carrying someone else's `id`) | parsed, 0 lines; the foreign id is discarded — both commit paths re-normalize under the local id (`panels.js:552` `M.normalize(importedDoc, id)`, `:560` `M.normalize(M.merge(A.doc, importedDoc), A.listId)`) |
| `proto.json` (`__proto__` / `constructor` keys at doc and collection level) | parsed, 1 line; `prototype polluted? {}` — `Object.prototype` and `Array.prototype` untouched. `passThrough` is protected by its `!(k in out)` test, which sees inherited names |
| `huge.json` (1.7 MB, 4,000 lines) | parsed with no error — see the size proposal above |

A Markdown export re-imported takes the "That file isn't JSON." path — `importJSON` calls `JSON.parse` first — the same
clean refusal as `bad-json.json`. The round trip the suite already pins (`tools/e2e4.js:645`) asserts
`!a.includes(s.listId)`: **no export file ever contains the secret**, and `exporter.js filenameFor` builds the filename
from the list name and a date only.

**6. QR codes and share texts.** Measured from the live share sheet (`$OUT/p3-cache-share.txt`, `$OUT/share-desktop.png`):

| control | string | carries W | carries R |
|---|---|---|---|
| Open on my other device — Copy / QR (`#share-link-mine`, `#qr-mine-c`) | `.../#/l/<W>/mine` | yes (by design) | no |
| Show it somewhere — Copy / Share / QR (`#share-link`, `#qr-c`) | `.../#/r/<R>` | **no** | yes |
| Let someone edit — Copy / QR (`#share-link-private`, `#qr-private-c`) | `.../#/l/<W>/shared` | yes (by design, under the warning) | no |
| Tell a friend (`friendNote()`, `panels.js:224`) | the app note + `A.BASE` — the bare app URL | **no** | **no** |
| Save your link (`#save-link`, `#save-qr-c`) | `editLink()` | yes (by design) | no |
| Add from anywhere (`#set-addurl`) | `.../#/l/<W>/add?text=` | yes (by design) | no |

**The View link's QR never carries W**, and **Tell a friend never carries a list link of any kind**. `nativeShare`
(`app.js:1842`) is only wired to `#share-link` (the View link) and sends the fixed text "Today's Five list".

**7. A view-link holder never learns W.** A stranger profile opened at `#/r/<R>` with only the encrypted row available:
`__tf` reports `{"listId":"eC8...","R":"eC8...","lookupId":"1H0...","mode":"view"}` — `listId` *is* R here — and a scan of
localStorage, the test hook, the whole DOM and the URL for the owner's W returns
`W anywhere on the viewer's device? false` (`$OUT/p5-view.txt`, `$OUT/stranger-view-desktop.png`). The decrypted
document the viewer holds has `id: <R>`, the viewer's own id, because every seal goes through `forWire(doc)`
(`sync.js:219` `delete d.id`), called at both push sites (`sync.js:316`, `app.js:354`). The share sheet in view mode
shows only the View link; both Private fields are empty and hidden (`$OUT/stranger-share-view-desktop.png`), and
Save-your-link and Delete are hidden from the menu.

**8. The server contract, read from the SQL.** What a stranger with the bare URL and the publishable key can do:

- **Read a list** — needs the exact 32-character `lookupId`, which is `b62(HKDF(R,"lookup"),32)`, about 190 bits. Not
  guessable; `get_list_v3` refuses anything outside `^[0-9A-Za-z]{22,64}$` with PT400 and returns null for a miss, so it
  is not even an oracle beyond existence, and naming a row requires R.
- **Change a list** — `put_list_v3` requires `p_token` matching `^[0-9A-Za-z_-]{43}$` and `sha256(p_token)` equal to the
  stored `token_hash`, else PT403 (`002_v3.sql:209`, `:232`). A view-link holder can derive the key and the id but not
  the token, which is the whole point of `W -> writeToken` never being derivable from R. **The edge:** the check is a
  plain `<>` on hex text, so it is not constant-time — irrelevant here (a remote timing attack on 256 bits of HKDF
  output through PostgREST is not a threat), but worth knowing it is not a designed property.
- **Create rows** — `p_base_rev = 0` on a missing id inserts with an attacker-chosen token, bounded by `check_create()`:
  12/hour and 40/day per address hash, and a hard `max_rows = 2400` that raises PT507 first (`002_v3.sql:136`). Filling
  the table needs 60 address-days; the `mult := 10` shared "unknown" bucket (`002_v3.sql:140`) is the widest door at
  120/hour, reachable only if the address headers vanish. See the rate-limit proposal above for the two edges.
- **Oversized payloads** — refused at 96 KB with PT413 before the row is touched (`002_v3.sql:216`), and the shape is
  checked first: the doc must be a JSON object with `iv` and a string `ct` (`:212`), so the table can only hold things
  shaped like envelopes.
- **A replayed old revision** — cannot overwrite: `cur.rev <> p_base_rev` returns `{ok:false, rev, doc}` rather than
  writing (`:235`), and a stranger cannot even reach that branch without the token. A holder of the Private link
  replaying their own old revision is not a stranger and is exactly the merge case the client handles.
- **A delete without the token** — PT403 (`002_v3.sql:263`). The one carve-out is a legacy row with `token_hash IS NULL`,
  deletable by id alone — that is v2's contract, kept so migration can retire the old row, and it needs the v2 id, which
  is itself the secret. `003_v2_cleanup.sql` drops the three v2 functions entirely, so the only remaining plaintext-era
  exposure is rows that predate the migration.
- **Recreating a rotated list** — explicitly blocked: a missing row with a non-zero base returns `{ok:false, rev:0}`
  (`:223`), so a stale device cannot resurrect an id the owner rotated away from.
- The table itself is unreachable: RLS on, no policies, all grants revoked, and only the three SECURITY DEFINER
  functions granted to `anon` (`002_v3.sql:24-25`, `:360-372`).

**The CSP.** `index.html:20`:

| directive | value | verdict |
|---|---|---|
| `default-src` | `'self'` | good — covers frame-src, media-src, child-src |
| `script-src` | `'self' 'sha256-zkz7...'` | good — no `'unsafe-inline'`, no `'unsafe-eval'`, the one inline boot script is hashed |
| `style-src` | `'self' 'sha256-oE1H...'` | good — the inline token stylesheet is hashed; later theme changes go through the CSSOM, which CSP does not govern |
| `img-src` | `'self' data:` | fine — data: is needed and cannot execute |
| `font-src` | `'self'` | good, all fonts self-hosted |
| `connect-src` | `'self' https://xyfjxdbwhysbaltcwvcx.supabase.co wss://...` | good — pinned to the one project host |
| `manifest-src` | `blob: 'self'` | needed for the per-list dynamic manifest (`index.html:94`) |
| `worker-src` | `'self'` | good |
| `base-uri` | `'self'` | present |
| `form-action` | `'self'` | present |
| `object-src` | `'none'` | present |
| `frame-ancestors` | **absent** | see the proposal above; a meta CSP cannot carry it |

`about.html:19` matches on `default-src`, `style-src`, `img-src`, `font-src`, `base-uri`, `form-action`, `object-src`;
it is *stricter* on `script-src` (only the hash, no `'self'`) and `connect-src` (`'self'`, no Supabase), and omits
`manifest-src` and `worker-src`, neither of which that page uses. Consistent and correct.
**No inline event handlers exist**: `grep -nE '\son[a-z]+=' index.html about.html` returns nothing in either file.
Zero CSP violations and zero third-party requests were observed in every run (`thirdParty: []` in `$OUT/p1-leaks.txt`).

---

## What this lens found the app does well, and what it could not check

The core of the design holds up under everything I could throw at it. The secret really does stay in the fragment: it is
never in a query string, never in a title, never in a request, never in a log — the app writes nothing to the console at
all, which removes a whole class of accident before it can happen. `forWire()` deleting `doc.id` before every seal is
the small, easily-forgotten line that makes "hand out a View link" actually safe, and it is applied at both push sites;
a stranger on a View link genuinely cannot reach W from anywhere on their device. The escaping is disciplined rather
than lucky — every one of the twenty-odd `innerHTML` sites is either fixed markup or passes user text through
`escapeHtml`, history is built node-by-node with `textContent`, and hostile input through eight different doors
produced no injected node at all. The import parser refuses what it does not recognise with fixed sentences that never
echo the file, drops malformed records instead of throwing, and is immune to `__proto__` keys by construction rather
than by a special case. The server contract is genuinely tight: three functions, an unguessable id required by each, a
write token the view path cannot derive, a shape check, a size cap, a row cap and a rate limit — and the honest
`{ok:false}`-and-merge answer to a stale revision rather than a silent overwrite. Tell a friend never carries a list
link, and the View link's QR never carries W; those two are easy to get wrong and are right.

What I could not check: anything on the live server. I read `supabase/migrations/002_v3.sql` and `003_v2_cleanup.sql`
and reasoned about them, but I made no call to the real project, so I cannot confirm the deployed functions match these
files, that `003` has actually been run (the v2 RPCs, which delete a token-less row by id alone, would otherwise still
be reachable), that pg_cron is scheduling the reaper, or how Supabase's edge populates `cf-connecting-ip` — which is the
hinge of the rate-limit finding. I also could not exercise the 413 / 429 / 507 responses end to end: the local transport
has no size cap and only fakes 429 via `tf/test/limit`, so I read the client's handling of those statuses rather than
watching it. Clickjacking I reasoned about from the missing `frame-ancestors` rather than building an attacker page.
And I checked the Cache Storage behaviour in Chrome only — whether Safari and Firefox also keep the fragment in a
navigation request's cache key is worth confirming on the iOS simulator before deciding how urgent that fix is, though
the fix is safe to make regardless.
