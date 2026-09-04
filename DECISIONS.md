# Decisions

Calls made where the brief left things open, and the two places it was deliberately bent. Facts behind the install path are in [PLAN.md](PLAN.md).

## Sync and data

- **Records are maps keyed by id, not arrays.** `items`, `sections` and `themes` are `{ id: record }`. Merge becomes a per-key pick and can never duplicate a record.
- **Tie-break.** Same `updatedAt` on both sides: a tombstone beats a live record; otherwise the lexically larger canonical JSON wins. Deterministic, so every device converges on the same doc without coordination.
- **Tombstones live 30 days**, then are purged locally. A device that was offline for longer than that and edited a deleted item would resurrect it. Accepted for a personal two-device list.
- **No op log.** The doc plus a `dirty` flag is the offline queue. Reconnect pushes the whole doc; a stale rev returns the server doc, which is merged and pushed again. Simpler and provably convergent given the merge properties (tested in `test/model.test.js`).
- **`todayOrder` is a second order field.** Today spans sections, so the section order can't order it. Reordering in Today never disturbs the order in Everything and vice versa.
- **Rollover applies to every finished item, not only Today ones.** At the first open on a new local date, any item finished on an earlier date goes to History for that date and is tombstoned. Undone items stay. "Start again" still unchecks Today, as in v1. If you wanted a finished line back, the line's text is in History.
- **Rollover tombstones are stamped just above the record they replace**, not with the current time, so a device waking from days of sleep cannot erase an edit made elsewhere in the meantime, and every device produces the identical tombstone.
- **History keeps 365 days**; older days are dropped at open, so the document stays far below the 256 KB server cap.
- **Rollover needs no marker.** It is a pure function of the doc (`doneAt` earlier than today ⇒ move), so two devices doing it independently merge to the same result.
- **Unsorted comes first** in Everything. New lines from Today land there; keeping them at the top means they are visible without scrolling.
- **Deleted sections don't touch their items.** Items keep their old `sectionId` and render under Unsorted, so a section delete is one record change and never conflicts with concurrent item edits.
- **Broadcast payload is a doorbell** (`{ rev, from }`), never the doc. Devices ignore their own device id and re-fetch. Payloads over a public channel are treated as untrusted hints.
- **A 60-second poll while visible** backs up realtime. Realtime channels can go stale after laptop sleep; the poll and the wake handlers (visibility, focus, online, pageshow) make "left open all day" safe. Cost on the free tier is negligible.
- **`delete_list` RPC exists** so Rotate can kill the old id. The old row is deleted, not forwarded: a forwarding stub would hand the new secret to anyone holding the old link, defeating rotation. Other devices on the old link show "This link no longer works" and keep their local copy until you paste the new link.
- **Only lists this device created are ever inserted on the server.** A local copy carries a `created` flag (new list, migration, rotate). Opening a link whose list is missing on the server shows "This link no longer works" instead of silently creating an empty list under that id, and a server row whose revision is lower than the one a device already saw is treated the same way. Both rules stop a rotated id from being resurrected and refilled by a stale device.
- **Rotate confirms the revocation.** If `delete_list` fails (offline, project paused) the toast says so, the old id is kept in a pending list, and it is retried on reconnect and every minute until it succeeds.
- **`put_list` caps the table at 50 rows.** The publishable key is public, so without a ceiling anyone could fill the free tier's storage with 256 KB junk rows and take sync down.
- **Sync-off mode keeps everything working locally.** Lists still get real ids; the first pull after `config.js` is filled creates them on the server (`put_list` with `base_rev = 0`).
- **`config.js` names the key `key`.** Supabase now issues `sb_publishable_…` keys and is retiring the JWT-style anon key; either value works in that field.
- **The RPCs are called with plain `fetch`; the Supabase client library is loaded lazily and only to receive broadcasts.** `get_list`/`put_list`/`delete_list` are simple HTTP POSTs with the `apikey` header, so the first pull on a cold device does not wait for ~100 KB of client modules from the CDN, and sending the wake-up uses Realtime's REST broadcast endpoint when the socket isn't joined. If the CDN is unreachable, sync still works through the 60-second poll and the wake handlers; only the sub-second live updates are missing until it loads.
- **Broadcast-from-database was not used.** Supabase can broadcast from inside the RPC (`realtime.send`), which would be atomic with the write, but the brief asked for a client broadcast after save and the poll covers the gap. Easy to add later.

## Structure and interaction

- **Checking in Everything is allowed** (sound, a smaller burst, no finale). Confetti volleys and the finale belong to Today only.
- **A toast with Undo appears on done as well as delete**, as asked. It sits above the footer so it never collides with the finale.
- **Text edits no longer reset done.** v1 reset `done` because it replaced the whole list; inline editing has no reason to.
- **Enter on an empty new line just closes it**; Enter on text saves and opens a new line below (as specified). Escape cancels the edit; Backspace on an empty line removes it (with an Undo toast only if it had text before).
- **Notes are edited in the same inline editor** (Tab moves to the note field). In Today a small chevron appears on lines that have a note and expands it; Everything always shows notes.
- **`1–9` works in Everything too**, toggling the nth visible line top-to-bottom.
- **Long-press is 400 ms**, cancelled by 8 px of movement, so a scroll never turns into a drag. Only undone lines can be dragged; done lines always sink. A long-press that ends without moving is not a tap: the click that iOS synthesises afterwards is swallowed, and a `pointercancel` (second finger, notification, system gesture) puts the line back without committing anything.
- **iOS is detected by platform, or Mac UA plus a touch screen** (`maxTouchPoints`), not by the `ontouchend` property, which desktop and headless Chrome expose without any touch hardware; that had sent the desktop down the iOS reload path.
- **Leaving a list flushes first.** Switching, archiving and the iOS reload push any pending edit (bounded to 1.5 s), and on open every other locally dirty list is pushed once, so nothing stays stranded in one device's storage.
- **Two tabs of one browser** merge on write for the list row and union the registry, so neither overwrites the other's unpushed edits or forgets a rotated list.
- **Cmd/Ctrl+Z inside a text field is left to the field**; outside one it undoes the last local list operation (done, delete, edit, move, section delete, start again).
- **List switcher shows only with two or more active lists** or a named list; otherwise the rail is exactly v1's date.
- **Archiving a list keeps its local copy**; it just leaves the switcher. Un-archive from the Lists panel.
- **First run seed** is v1's list rewritten for the new keys (N, double-click, A, T).
- **The v1 localStorage entry is left in place** after migration (harmless; keeps a fallback if anything went wrong).

## Theme engine

- **Dark and Light: two secondary greys were nudged.** v1's Dark `dim` (#6B7178) was 3.4:1 against the ink, Light `muted` (#7A7C7F) 3.9:1 and `dim` (#9EA2A7) 2.4:1. Small rail text at those ratios fails WCAG AA and would sink the Lighthouse Accessibility ≥ 95 requirement. They became #7F858C (Dark dim/done), #707174 / #6F7378 / #6E7278 (Light muted / dim / done), the nearest values that pass 4.5:1. Every other token, both font pairs, both sound sets and all three confetti palettes are byte-for-byte v1. Pink was already compliant and is untouched.
- **Solid hairline token added** (`--hair-solid`, computed to ≥ 3:1) for checkbox borders; the translucent `--hair`/`--hair-hi` stay for decorative rules.
- **Curated kits differ in mood**: Midnight (cool bells), Forest (deep resonant knock), Paper (pencil scratch on newsprint), Terminal (square-wave blip, mono), Sunset (warm bells, gradient strike), Dusk (soft bells, hearts and stars), Harbor (muffled knock), Ember (heavy knock with crackle), Cocoa (soft low knock). Each has its own font pair and confetti palette.
- **Custom sound by hue**: pinks, purples and blues get the bell engine; everything else the knock. Pitch follows the accent's lightness.
- **Font auto-pick by base + warmth** from six pairs (Lato/PT Sans, Fraunces/Quicksand, Space Grotesk/Plex Sans, Playfair/Source Serif, Manrope, DM Serif/DM Sans); overridable in the panel.
- **Follow system uses two slots.** Choosing a theme while it is on fills the dark or light slot according to that theme's base. Simple, and any theme (custom included) can be either slot.
- **Theme codes are short and readable**: `T1:d:FF3D9A:fraunces:Name`. Saved themes live in the doc (so they sync); the active theme is per device.
- **Fonts: one stylesheet link per active pair**, swapped on change; the previous link is removed once the new one loads to avoid a flash.
- **Contrast floors for text tokens are checked against `--ink-3`**, the lightest (dark) / darkest (light) surface they can sit on, such as the selected view tab and hovered rows; passing there implies passing on `--ink` and `--ink-2`.
- **Backgrounds are OKLCH-tinted toward the accent** (chroma ≤ 0.055 dark, ≤ 0.022 light) so no custom theme is flat grey; out-of-gamut colours lose chroma, never hue.
- **Surprise me** samples hue uniformly, chroma 0.12–0.20, lightness banded by base, and re-rolls hues that cannot hold that chroma inside sRGB.

## Install path and PWA

- **Manifest is generated in an inline head script** as a Blob URL with absolute `start_url`/`scope`/icon URLs, because the iOS 18.1 simulator showed: iOS reads the manifest once at page load, honours `start_url` including the fragment, ignores later href changes, and drops a relative `start_url` inside a blob manifest. Chrome behaves the same on the relative-URL point and re-evaluates on link change. The static `manifest.webmanifest` stays as a plain fallback but is not linked when JavaScript runs.
- **Manifest `id` is the app's base URL**, so Chrome treats every list as the same installed app and can update `start_url` after a rotate; on iOS each Add to Home Screen is its own icon anyway.
- **Switching lists in iOS Safari reloads the page** (paste, new list, switcher) so the memoised manifest carries the new id before an Add to Home Screen. Installed apps and desktop browsers just regenerate the link.
- **Service worker is network-first for the shell** and never forces a reload, so a deploy lands on the next open without interrupting a list left on screen. It is opt-in on localhost (`?sw=1`) to keep the dev loop simple.
- **Content-Security-Policy meta.** Scripts only from this origin and jsDelivr (the Supabase client), connections only to this origin, `*.supabase.co`, jsDelivr and Google Fonts, manifests from `blob:`. The boot script is inline, so `script-src` keeps `'unsafe-inline'`; the policy still blocks any foreign script host. Vendoring supabase-js would allow a stricter policy; the brief asked for the CDN import.
- **The service worker only reaps its own `tf-*` caches.** The github.io origin is shared with Astraeus; a blanket `caches.delete` would wipe that app's offline shell.
- **Wake lock** is a toggle in ⋯. On iOS it only works inside a Home Screen app from iOS 18.4; earlier versions silently do nothing.
- **Haptics** use `navigator.vibrate` (Android); iOS has no web API for it.
- **The one-time install hint** shows only in iOS Safari (not in the installed app), after 2.5 s, and never again once dismissed.

## Process

- **Working copy lives in the session scratchpad** on a `v2` branch pushed after each logical commit; `main` only moves after verification passes (your instruction mid-build).
- **No mock Supabase realtime server.** Merge logic is tested in Node; multi-tab and offline behaviour is verified with the local BroadcastChannel transport (`?transport=local`), which exercises the identical engine code; the real backend is for you to try after `SETUP.md` (your instruction mid-build).
- **The native iOS simulator tool could not start** (Xcode is not selected on this Mac; fixing it needs `sudo xcode-select`), so the Simulator app was driven through background screen control instead. Results are in PLAN.md.

---

# v3 decisions

Calls made where the v3 brief left things open, plus the two places it was extended (the first-run tour and the labelled Today toggle, asked for mid-build). The design itself is in PLAN.md, "Today's Five v3 — plan".

## Keys, envelope, server

- **The derivation salt is a fixed string** (`todays-five/v3`), not per-list. Every secret comes from `W`, so a per-list salt would have to be stored next to the row, gaining nothing; a fixed salt keeps the link the whole credential. Vectors are pinned in `test/crypto.test.js` so the derivation can never drift silently.
- **`R` is 22 base62 characters, `lookupId` is 32.** The view link stays as short as the edit link (same entropy as `W`, which bounds everything anyway); the lookup id is longer only because it never has to be typed or scanned. Base62 is produced by rejection sampling so the mapping is unbiased and deterministic.
- **The write token travels as base64url** (43 chars, no padding) and the server stores its hex sha256. The regex on the server pins the format.
- **The envelope compresses before it encrypts** (`z: "deflate-raw"`, absent when the platform lacks `CompressionStream`). The brief's envelope had no such field; it was added because a year of history shrinks 5–11×, which is what lets the per-row cap be 96 KB and the row cap 2400 while staying under half the free database. The header (`v`, `alg`, `z`) is authenticated as additional data, so the flag cannot be flipped.
- **The inner document keeps `v: 2`.** Its shape did not change; `v: 3` on the envelope marks the storage format.
- **`id` is stripped from the document before sealing.** The document used to carry the list id; under v3 that id is `W`, and a view-link holder can decrypt the document, so leaving it in would hand out the edit link. `normalize()` puts the id back from context after decryption.
- **New RPC names (`get_list_v3`, `put_list_v3`, `delete_list_v3`) instead of new overloads.** PostgREST resolves overloads by the JSON keys of the call; a v2 call with `{p_id}` would have matched both `get_list(text)` and a `get_list(text, bigint default null)` and failed with 300. New names keep the live v2 app working until deploy; `003` drops the old ones.
- **Legacy plaintext rows can be deleted by id alone**, exactly as v2 allowed, because that is how migration retires them. Rows with a token need the token. After `003` no legacy rows exist and the branch is dead code.
- **HTTP status codes via PostgREST `PTxxx` errcodes** (400/403/413/429/507) so the client can react to each without parsing messages.
- **Caps: 2400 rows, 96 KB per envelope** (230 MB worst case), **12 creates per hour and 40 per day per address**. The address hash is `sha256(salt || ip)` with a salt generated once at migration; entries older than 24 h are deleted on every create and by the reaper. If no address header is present everyone shares one bucket with 10× the limits, so abuse stays bounded without choking normal use if the gateway ever stops sending it.
- **Reaping runs two ways**: a `pg_cron` job at 04:17 UTC when the extension can be created (the migration tries and reports either way), and opportunistically from the RPCs at most once a day (`private.state.last_reap`). Idle means no read or write for 12 months; `get_list_v3` touches `last_seen` at most once a day per row so a poll never writes.
- **`connect-src` names the exact Supabase host**, not `*.supabase.co`. Tighter, at the cost of one more place to edit if the project ever changes (noted in SETUP.md).

## Migration

- **A migrated list gets a brand-new `W`** rather than reusing the v2 id as `W`. The old id was the row id and travelled in plaintext requests for a year; nothing derived from it should protect the encrypted list.
- **Nothing is deleted before its replacement exists.** The new list is saved locally as dirty + created first; the old server row is deleted only after the new one has been pushed, and only after a final read of the old row folds in anything another device wrote in between. The follow-up is retried every minute and on reconnect until it succeeds; the plaintext local copy is removed only then.
- **Carry-over on paste is guarded by lineage.** When a device whose link died pastes a new one, its unpushed edits are merged in only if the two documents share at least one item id (the same list under a new link). A stranger's list pasted by mistake never receives them.
- **Migration reuses the save-your-link sheet** with a different headline ("Your link changed") and the re-add-the-phone hint. One sheet to learn, one to maintain.

## Sync and status

- **Poll every 60 s only while realtime is not joined, every 4 min while it is.** The brief allowed 3–5; 4 keeps the safety net inside a coffee break without doubling the request count of 3.
- **"Live updates paused" waits 8 s after open** before it can show, so the normal half-second between first pull and channel join never flashes it.
- **Limit responses put the list on hold.** After a 429 the engine waits 5 minutes (10 after a 507) before trying again, whatever else wakes it; after a 403 or 413 it waits for the next local change. One refusal never becomes a burst.
- **The sync dot is a button.** On a phone nothing can be hovered; tapping the dot shows the status as a toast.
- **View mode does not roll over.** Rollover mutates the document; a viewer shows the list exactly as the editors left it and lets them do the rolling. Collapsing a section in view mode is kept locally only.
- **A view link is registered in the switcher marked view-only** and remembered as the device's current list with `currentMode: "view"`, so the boot script builds a `#/r/` manifest for it.

## The swallowed click

- **Taps are recognised from pointer events**, not from `click`. Browsers drop `click` when the mousedown node leaves the DOM before mouseup, and every render used to re-append every row. `pointerdown` inside the checkbox button records the row; `pointerup` toggles it when the pointer is still over the same row or moved less than 10 px (the row slid away under a still finger), unless a drag started or a touch was held long enough to be a drag attempt. Keyboard and assistive-technology activation still arrive as `click` and still toggle; a pointer toggle suppresses the click that follows it for 700 ms so nothing toggles twice.
- **Rows are reordered with the fewest moves** (`model.reorderPlan`, a longest-increasing-subsequence plan): a done line sinking moves one element instead of all of them, and a row already in place is never detached, which also stops renders from stealing keyboard focus.

## Phone

- **Bottom sheets** apply to the ⋯ menu, share, save, help and section panels whenever the device cannot hover or the viewport is 680 px or narrower. Rows are 52 px with an icon and a label; keyboard-shortcut hints are hidden there while state labels (On/Off, streak) stay. Swipe down from the grip, the header, or the body when it is scrolled to the top: closes past 90 px, or 30 px with a quick flick.
- **Help shows gestures on touch and keys on the desktop**, chosen live from `(hover: none)`, so an iPad with a keyboard still gets the right one after rotating.
- **Affordance pass**: on touch every chip, tab, tool and the dot gets a filled background and a stronger hairline; the plain list-name chip gets a border; the hover-only tool fade is disabled; hairlines on inputs are stronger. Nothing depends on hover.
- **The rail gets a Share chip on the desktop**; on the phone it is hidden and Share is the first row of the ⋯ menu, one tap from the rail.

## First-run tour and the Today toggle (added mid-build)

- **Five coach marks over the real controls**: cross a line off; Today vs Everything (on the view tabs); the Today toggle (Everything is shown, the first row's toggle is forced visible); reorder (the drag handle on the desktop, the row itself with "press and hold" on touch); the link is the key (the Share chip, or ⋯ on the phone). One line each, Next/Skip, dots for progress; Escape, Skip or a tap on the backdrop ends it; the view the user was in is restored.
- **Shown automatically once per device**, only when the device's first list appears (created or pasted) and only in edit mode, after the save-your-link sheet has been dismissed so the two never stack. A device that already holds lists is marked as toured at boot: returning users see no new screen, as the brief requires. Replay lives at ⋯ → How it works.
- **Not a dialog element**: a fixed overlay with a box-shadow "hole" so the real control stays visible and in place. Reduced motion disables the sliding transitions.
- **The promote control is a labelled toggle**, a pill reading "Today" with the star, `aria-pressed`, an `aria-label` that says what pressing does, and a hover tooltip on pointer devices ("Put this line on Today" / "On Today — click to take it off"). Toggling it shows a toast ("On Today" / "Off Today"). Today view keeps no toggle, as in v2: lines leave Today from Everything.
- **Seed list rewritten for v3**: it still teaches the basics in the list itself (cross off, add and edit, Everything and the Today toggle, save the link, cross off all five), without naming keys, so it reads the same on a phone.

## Prose and pages

- **User-facing prose is in Price's voice** (welcome, tour, save and share sheets, About), rewritten for tone only; every factual claim and every button label was kept as it was.
- **About page states the hosting region as "the United States"**, inferred from round-trip latency rather than read from the dashboard, which this build could not open. If the project is elsewhere the sentence needs changing.
- **No LICENSE file and no "open source" claim anywhere.** The vendored client and the fonts carry their own licence notes (`vendor/LICENSES.md`, `fonts/README.md`) because their licences require it; that is all.
- **The localStorage key for device meta stays `tf/v2/meta`**: the boot script and every returning device already use it. Lists moved to `tf/v3/list/<link>`; anything still under `tf/v2/list/<id>` is a migration candidate.
