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

## From the two review passes (UI state, accessibility)

- **Undo is per list.** The undo stack and the toast are cleared whenever a list opens or the welcome screen shows; a stale "Undo" could otherwise replay one list's history into another.
- **A render never leaves a drag hanging.** A remote change, the day rollover or a view switch during a drag aborts the drag (the row snaps back, nothing is committed) instead of re-rendering under the finger, which used to leave the app swallowing every tap until a reload. A dragged row that loses pointer capture because it left the DOM aborts the same way.
- **Migration does not fork.** A legacy copy this device only ever opened from a link, whose plaintext row has already been retired by another device, is kept under its old link and reported as "This link no longer works" rather than being turned into a second encrypted list; pasting the successor carries its unsynced edits over. A legacy copy created on this device migrates as before. If the check cannot reach the server the copy migrates anyway (the alternative is a list stuck offline), which can produce a fork in the rare case of an offline first open after another device migrated; documented rather than solved.
- **Carry-over waits for real data.** The lineage check runs against the pulled document, not the empty placeholder a freshly pasted link starts from, and only an explicit paste (welcome or Lists panel) records a redirect and a carry; New list, Archive and the switcher no longer redirect a dead icon somewhere it should not go.
- **Engine callbacks are generation-checked** on both sides: the sync engine drops results for a closed engine after every await (including decrypt and seal), and the app ignores status, live and remote callbacks from a superseded `openList`.
- **Leaving the last list forgets it** (`meta.current` cleared on the welcome screen), so a reload does not reopen an archived list.
- **View-only collapse is device-local** (a session set), never a mutation of the doc: a viewer's timestamp must not win a merge against the editors.
- **Sync status is never colour alone**: offline and error show a short text label next to the dot; a visually hidden status region announces only when the category changes (ok / offline / trouble / gone), not on every syncing flip. The sync dot paints "syncing" the moment a list opens instead of showing the previous list's state.
- **Single-key shortcuts can be switched off** (⋯ → Single-key shortcuts; WCAG 2.1.4). Cmd/Ctrl+Z, Escape and ⌥↑/↓ keep working; the switch is hidden on touch, where there are no shortcuts.
- **The tour is modal for everyone**: the page behind it is `inert`, the card takes focus and is described by the step text, a hidden "Step n of m" is read on each step, and focus returns to where it was when the tour ends. Steps that point at a line are skipped when the list has none.
- **View-only checkboxes are `aria-readonly`**, the lists are described by the "View only" pill, and deleting a line by keyboard moves focus to a neighbour (or the add button) instead of dropping it on the body.
- **Dialogs are named by their title only** (the × button no longer leaks "Close" into the name); the confirm dialog and the save sheet are described by their message; the link is a read-only text field that selects on focus, and the save sheet starts reading at its title rather than at the link.
- **The Today toggle keeps a stable name** ("Today", state in `aria-pressed`, the action in `aria-description`); its hover tooltip stays while hovered and hides on Escape.
- **Remaining contrast spots fixed**: the footer hint no longer relies on opacity, placeholders are opaque, tour progress dots use the elevated grey; all touch targets in sheets, the tour and the volume slider are 44 px on touch; text fields show a real focus ring.
- **Everything `boot()` can reach is declared above the boot call.** The accessibility pass briefly introduced module-level `let`/`const` bindings below it; a page that boots straight into a link (a Home Screen icon) then died in a temporal dead zone while the welcome-first test path never touched it. The browser suite now boots a fresh page directly into a link and fails on any page error.

---

# v4 decisions

Calls made where the v4 brief left things open. The design is in PLAN.md, "Today's Five v4 — plan"; the rules every change must keep are in COMPATIBILITY.md.

## Compatibility and the document

- **New per-line data lives in side collections keyed by the line id** (`rules`, `returns`), not on the line. A v3 client rebuilds every record from the fields it knows, and a check-off on the old phone re-emits the line with a newer timestamp, which would win the merge and silently drop a field on it. A collection the old client never knew is dropped by it and never sent back, so every v4 device keeps its copy through the per-key union.
- **The tie-break gained a middle rule**: on equal `updatedAt`, a tombstone wins, then the record with the longer canonical JSON, then the lexically larger. A record an old client stripped is shorter, so the richer copy wins the tie and is pushed back. It stays a total order, so merge stays commutative, associative and idempotent (fuzzed). Without it, every stripped record would have won its tie, because `}` sorts after `,`.
- **`normalize()` keeps unknown keys** on the document, on records and on tombstones, so v5 gets from v4 the courtesy v4 needed from v3. The compat test runs a document with a field from the future through both models.
- **The inner document says `v: 3`, and `v` gates nothing.** A v3 client rewrites it to 2 on every push, so a feature that depended on `v` would flicker between devices.
- **Recurring lines reset at `updatedAt + 2`, plain lines still tombstone at `+ 1`**, so a v4 rollover beats the tombstone a v3 rollover produces from the same done record, and two v4 devices produce identical records. Rollover also **revives** a recurring line whose bare tombstone sits one or two milliseconds above its latest History entry: that is the fingerprint of a v3 rollover that ran before any v4 device saw the check-off (a real delete is stamped with the clock, minutes or days later). A deliberate v4 delete also tombstones the rule, so nothing revives it.
- **A rule remembers the date it last put its line on Today** (`placed`). Rollover runs every minute, so without a marker a due line the user had just taken off Today would jump back a minute later. Taking a line off Today sticks until its next due day.
- **Not today is `today: false` plus a return record.** The old phone sees the line leave Today (it understands `today`); the v4 rollover puts it back. A line that was finished in the meantime just retires its return.
- **Tombstones carry `text`, `note` and `sectionId` only when a user deleted the line.** Rollover tombstones and moved lines stay bare, so History and moves never show up as "Recently deleted". Restore re-creates the line at the end of its section, off Today.
- **The doc-level `updatedAt` is still stamped with the clock** on rollover (as in v3). It is informational; the compat and feature tests compare records and ignore it.
- **Purge drops rules and returns whose line is gone for good** (its tombstone already purged), so a side collection cannot grow orphans.

## Sound

- **Every tap runs the state machine, and a resume that never landed is the signal.** iOS reports `interrupted` on some builds and `suspended` on others, and neither is reliable after a call, so the code does not branch on the name: if the context is not running, ask for a resume and remember that we asked; if it is still not running on the next tap, close it and make a fresh one inside that gesture. The Node test models suspend, interrupt-with-no-resume and close against a fake context.
- **The silent-switch hint is shown once, not detected.** iOS exposes nothing about the ring/silent switch to a page, and an output-level probe would need a permission prompt for nothing. The first check-off with sound on, on iOS, shows one toast.
- **The engines load on the first gesture** (`packs.js`, from `sound.prime`), so the first check-off on a cold page can arrive a beat late; nothing else is lost, and Today's first paint never pays for six engines.
- **Best-fit packs**: Paper types (a pencil scratch was always the wrong sound for a typewriter theme), Forest drops marbles (wood and glass), Harbor pops (water). The other nine kits keep what they had; a device override in Settings → Sound keeps the theme's pitch and decay parameters.
- **Celebrating remote changes is on for a view link and off by default for an edit link.** Watching is the point of a view link; a Mac left open all day would otherwise chime for every tap on the phone.

## Structure

- **The count in the rail is the one-thing toggle.** It was already the one control that means "how far through Today am I"; making it a button adds no new control. `O` does the same.
- **History lives under Settings → Lists**, because ⋯ is fixed at six rows and History is a per-list record, not a control. The day review card links there in spirit; Settings → Lists → History opens the panel.
- **Full screen is a row in Settings → Behavior** where the platform has the API. It is an action, not a setting, but ⋯ stays short and the rail chip covers the desktop.
- **The search field lives in a header row inside Everything**, not the rail. The rail never gains a control.
- **The line menu is a ⋯ tool on the row**, on Today and in Everything. Today's screen gains no control; the row already had tools, and the menu is where "Not today", "Repeat", "Move to…" and "Delete" belong without four more icons.
- **The section menu also exists for Unsorted** once a section exists (v3 hid it), because templates and "Put all on Today" apply there too. A list with no sections has no headers and therefore no section menu; Settings → Lists → Templates offers "Insert into Unsorted" for that case.
- **Panels load lazily as one module** (`panels.js`, 53 KB) rather than one file per panel. One request on first use, cached by the service worker after; splitting further would add round trips for no first-paint gain.
- **Dialog markup stays in `index.html`, dialog styles do not.** Hidden dialogs cost nothing at first paint, and injecting markup from the lazy module would have doubled the surface for id typos. Their CSS is another matter: Lighthouse's simulated slow phone painted v4 about 8% later than v3 with everything in one render-blocking stylesheet, so `panels.css` (15 KB: sheets, the theme picker, Settings, the tour, How it works) loads right after boot and every panel waits for it; `styles.css` is back to v3's size.

## Features

- **Add from anywhere waits for a real document** on a device that never held the list: the lines are added after the first pull, so they land on the list rather than on an empty placeholder that would then merge oddly. On a link that turns out to be gone, nothing is added and the toast says so. The address is rewritten to the plain link the moment the add is read, so a reload cannot repeat it.
- **The add URL puts the text in the fragment**, so it never reaches the server (the same reason the list secret lives there).
- **Move to another list needs the target on this device**, because both lists are encrypted with their own keys and only a device holding both can write both. The picker says "Not on this device yet" for a list the registry knows but has never opened. The moved line keeps its done and Today state; it lands at the end of the target's Unsorted. Undo moves it back the same way.
- **Delete everywhere adds the id to `dead`** so another tab's copy of the registry cannot resurrect the entry, and the ten-second undo removes it from `dead` again. The undo re-creates the row with `base_rev = 0`, which the server counts as a create (the per-address rate limit applies).
- **The what's-new toast treats a device that holds a list but no version marker as a returning v3 device** and a device with neither as a first run. First run marks the version seen silently.
- **Export strips the list id** before serialising, because the id is the edit secret and a JSON file travels. Import sets the id from the list it lands in. Byte-identical round trips come from sorted keys and an idempotent `normalize`.
- **Templates hold text and note only.** No done state, no Today flag, no order: inserted lines start fresh at the end of their section.
- **One-thing mode exits at the finale and saves the exit**, so the next day starts with the whole list; a new line also leaves the mode (it is written in the full list). The toggle itself is remembered per device.
- **Presence tracks an empty payload under a random per-load key.** The key is the only identifier; it never touches storage. "Show who's here" off means the channel is joined without presence at all: nothing is tracked, nothing is listened to.
- **The theme schedule and Follow system are exclusive by construction**: turning one on turns the other off with a toast, and the Settings sub-line says which one holds the theme right now. The schedule is checked by the same minute tick as rollover.
- **The iOS haptic switch ships**, guarded to iOS with the `switch` attribute supported: a visually hidden `<input type="checkbox" switch>` is clicked inside the tap. The simulator shows no visual or focus side effect (focus is handed back if the click moved it); the haptic itself cannot be observed in the simulator, so whether it fires on hardware is unverified (final message).
- **The swipe for Not today is touch-only and leftwards**, past 90 px; a scroll (vertical first) or a long-press (drag) wins over it, and the click iOS synthesises afterwards is swallowed like the one after a drag.

## Process

- **The suites now live in the repo** (`tools/e2e4.js`, `tools/realsync4.js`, `tools/serve.js`, `tools/smoke.mjs`) because the release checklist in COMPATIBILITY.md depends on them; the v3 suites lived outside the repo and were lost with that session.
- **Playwright drives the installed Chrome** (`channel: "chrome"`) from a package already on this Mac; nothing was downloaded for the browser suite. Lighthouse 12 was installed into the session scratchpad.
- **The simulator was driven with `simctl` only** (open URL, screenshot, pixel probe). The native simulator tool needs `xcode-select`, as in v2 and v3.

---

# 1.1 decisions

Calls made where the 1.1 brief left things open. The design is in PLAN.md, "Today's Five 1.1 — plan"; the rules every change must keep are in COMPATIBILITY.md.

## Version scheme

- **The build number is written by hand at release, not computed at load.** The app has no build step, so `BUILD` in `version.js` and `build` in `whatsnew.json` carry the commit count on `main` after the merge. The merge is a fast-forward, so the number in the branch's last commit is the count; COMPATIBILITY.md §7 says how, and `test/features.test.js` checks the two agree and that About shows one file's number.
- **The service worker's cache name carries the marketing version only** (`tf-v1.1`). The shell is network-first, so a deploy lands on the next open whatever the cache is called; the name only decides which old caches are reaped. A build with the same marketing version reuses the cache, a fix (`1.0.x`) or a round (`1.x`) gets a new one.
- **What's-new keys on the string changing, never on its order**, which is why the renumbering (4.0.0 → 1.0) fires the toast exactly once on every existing device and never again. The toast shows the first line, which says the app got quieter and nothing about numbers; the third line, on the About page only, says what 4.0.0 became so the renumbered changelog reads right.
- **The deploy record costs one build.** The live checks can only be run after the merge, and recording them in PLAN.md is one more commit on `main`, so the checks were made at build 48 and the commit that records them stamps build 49 (what About shows). A round ends with two deploys, the second one docs and the number.
- **No dates anywhere**: the `date` field left `whatsnew.json`, the About changelog and its CSS lost the date column, and the About script was re-hashed for the CSP (`tools/csp-hash.js`, which the v3 comment in `index.html` always referred to and which now exists).

## One teaching channel per moment

- **The seed lines** are "Tap or click to cross this off · Add a line with + New line · The rest lives in Everything · Save your link. It's the key. · Cross off all five and see", 26–30 characters each, one line at 1440×900 and two at 390×844, all five and the add button on screen without scrolling on both. Editing is not taught by a seed line: the desktop footer says `E edit`, the ⋯ and the hold are one hover or one press away, and the menu hint arrives with the first edit.
- **Hints are remembered per device in `dev.hints`** (`{ today, drag, menu }`), a new key inside `meta.device` as COMPATIBILITY.md §5 allows. A hint counts as seen the moment it is shown, read to the end or not. Any tap, any key, a release after a hold, or the control going away dismisses it; a mark never has buttons.
- **A device that held a list before 1.1 starts with every hint seen.** It went through the tour (or knows the app), and the non-negotiable is that it sees exactly one new thing on update, the what's-new toast. The same latch the tour used (`tourDone`, or a list that was not registered moments ago) decides it; the first-run reload iOS Safari does after the first list is created still does not look like a returning device.
- **The drag hint on the phone shows during the hold**, on the lifted line ("Drag to move it. Let go for the menu."), and goes when the finger lifts; on the desktop it shows on the first hover of a line's ⋯ ("Drag ⋯ to move the line. Click it for the menu."). One key, two moments, because the control is the same.
- **The menu hint waits for the editor to close.** "The first time a line is edited" means an existing line's editor closed by hand (Enter, Escape, a tap elsewhere); a new line being written does not count, and Enter that opens the next line defers the hint until no editor is open, so it never sits beside a field being typed in. On the desktop it points at the line's ⋯ (forced visible meanwhile); on the phone, where there is nothing on the row, at the line itself and it says to hold it.
- **`?` is a reference sheet of its own** (`#p-keys`: every key and the mouse on the desktop, every gesture on touch) rather than a scroll into How it works, which stays the long-form page (⋯ → How it works) and links to the reference instead of listing the keys twice. "Replay the tour" is gone with the tour.
- **The Today footer says `1–n check off`** for the lines on screen (`1–5` with five, the brief's literal), `1 check off` with one.

## Quiet rows

- **⋯ is also the drag handle on the desktop.** One control on hover: click it for the menu, press and move it to drag (four pixels of movement decide). Nothing else appears on a row, so the brief's "exactly one control" holds and the pencil, the delete cross, the note chevron and the six-dot handle are gone. `⌥↑/↓` still moves from the keyboard.
- **On the phone the ⋯ stays in the DOM, visually hidden** (one pixel, clipped, no pointer events), so VoiceOver still finds "Line menu"; a person gets the menu from a hold released in place or a swipe right, and "Not today" from a swipe left as before. The Settings switch for the swipe governs the left one only.
- **A hold on a done line opens its menu straight away** (done lines cannot be dragged); a hold on an undone line lifts it, a move drags, a release without moving opens the menu.
- **Notes show under the line on Today** now that the chevron is gone; Everything always did. A line with a note reads the same in both views.
- **The star**: hollow in the dim grey when off, filled in the muted grey when on, the accent only on hover or press. `aria-pressed`, the stable name "Today" and the hover tooltip stay from v3.
- **Double-click still edits on the desktop but is no longer documented.** Its first click toggles the line and its second toggles it back before the editor opens, a v2 artefact of tap-from-pointer-events; `E` and ⋯ → Edit are the taught paths.
- **Two clicks a browser makes up are now swallowed.** The click iOS synthesises after a hold released in place used to land on the sheet the release had just opened and close it; the click it synthesises after a tap can land on a neighbouring line when the page moved in between (the finale's review card re-centres the list; v4's taller rows hid this). Both are ignored: the first through the drag-ended window the sheet already respects, the second by dropping any click that follows a touch tap and lands on another line.
- **A closed panel is forgotten at once**, not when the dialog's `close` event lands a task later: `closePanel()` and the `cancel` Escape fires both null the state, so a keystroke or a hint right after a sheet closes is not refused.

## Rail diet and the idle fade

- **The list-name chip and the "View only" marker stay in the rail** as plain text (no border, no fill on touch): the first is the switcher for people with several lists, the second is the state assistive tech and the v3 accessibility pass rely on. Neither is a control the brief listed, and both go quiet.
- **The Sound row in ⋯ is a toggle that keeps the menu open** and shows On/Off; Theme shows the current theme's name and opens the picker; Full screen is hidden where the platform has no API (an iPhone shows eight rows). The Settings › Behavior "Full screen" row went with it, so nine stays the ceiling.
- **The section header's ⋯ stays at rest.** It is the only way into templates and "Put all on Today", it sits in a header rather than on a line, and it is quiet (a dim glyph, no fill).
- **The idle fade is four seconds and a 1.4 s fade, desktop only** (`hover: hover`); touch never fades because nothing can be hovered back. Mouse movement, a press, a key or keyboard focus resets it; it never starts with a panel open, during the finale, while dragging, under `prefers-reduced-motion`, or with Behavior → "Fade controls when idle" off. The presence dots live in the count-and-dot group and stay.

## Menus and panels

- **Popovers are still `<dialog>`s opened modally**, so Escape and a click outside close them exactly as the sheets do; only the backdrop is transparent and the box is positioned under the control that opened it, right-aligned to it and flipped above when there is no room below. The dialog's own title row is hidden in a popover (the anchor is the context) but keeps naming the dialog for assistive tech.
- **The search affordance appears past eight live lines** in the list, hidden otherwise, and `/` opens the field regardless (the header row shows for as long as the field is open). It is a worded chip ("Search /", the key hint hidden on touch), not an icon.
- **Export & import keeps its element ids** inside the new sub-sheet, so the wiring, the browser suite's download check and the import flow did not change; only where the controls live did.
- **The About row in ⋯ lost a stray `link` class** that had given it the monospace input style since v4.

## A sound that lives with the theme

- **The pack is a field on the custom theme (`pack`) and a fifth field in the code** (`T2:<d|l>:<hex>:<pair>:<pack>:<name>`, empty pack = the hue rule). Curated codes are unchanged (`T1:curated:<id>`), so every device reads them; a `T1:` custom code parses as it always did and gets the hue rule; a `T3:` is refused rather than misread.
- **The accent still sets pitch and decay; the pack only sets the voice.** The builder's Auto option names what the hue rule picks for the current accent ("Auto · Bell"), and a pick previews through the app's sound machine inside the change gesture.
- **A 1.0 device shown a saved `T2:` theme skips it in its picker** (its parser returns null and the list filters nulls), never crashes, and the theme is back when that device updates. Documented rather than solved: a code written for 1.1 has to carry the pack somewhere, and the theme record's `code` string is that somewhere.
- **Settings › Sound says which pack wins**: "Theme's pick (Marble)" names the theme's pack, and the sub-line reads either "Marbles picks Marble, and that's what plays" or "Marbles picks Marble; this device plays Pop".

## First paint

- **The first Lighthouse pass came out a point behind 1.0 on mobile** (LCP 2.12 s against 1.98 s, deterministic run after run) although the CPU profile showed the boot doing the same work in both. Lighthouse simulates a slow connection from the recorded request graph, and the graph told the story: `app.js` (2.7 KB larger, compressed) is the long pole, its download stretched by everything sharing the connection, and two requests hung off its arrival for one more round trip: `version.js`, which `app.js` imports but nothing preloaded, and `panels.css`, appended the moment the module evaluated. Three things changed, each worth having on a real slow connection: `version.js` is preloaded with the other modules; `panels.css` is asked for a beat (250 ms) after `load`, so it never competes with the first paint and no panel can open before it anyway; and the invisible finale row is no longer laid out until it is on (it was `opacity: 0`, and being in the row font it pulled Lato 900 and, through its chip, Lato 400 in at first paint), while the screen-reader-only heading and the footer use the UI font, which the rail needs anyway, so Lato 700 stops loading at boot too. Two font files (28 KB) fewer at every cold open. The numbers are in PLAN.md.
- **The footer's finale now fades in and cuts out.** `display: none` until it is on, a half-second fade in; taking a line back removes it at once instead of fading it. Nobody watches a finale disappear.

## Process

- **Node came from the Codex runtime cache on this Mac** (`~/.cache/codex-runtimes/…/node`, v24, with Playwright 1.62 and pngjs beside it); Lighthouse 12 was installed into the session scratchpad with the bundled pnpm, as in v4. The earlier session's dev server was still listening on 8790 and serving the 1.0 clone, so this round's server ran on 8791 (`BASE=…` for the suites) and the old one doubled as the Lighthouse baseline.
- **Edits were applied as exact-match patches** (a small scratchpad tool that refuses to write unless every old text matches exactly once), one logical commit per brief section, each pushed.
- **Before/after screenshots are taken by `tools/shots.js`** into `shots/1.1/{before,after}` at both viewports, quantised PNGs (about 40 KB each) so the repo stays small; PLAN.md shows them side by side.

---

# 1.2 decisions

Calls made where the 1.2 brief left things open. The design is in PLAN.md, "Today's Five 1.2 — plan"; the rules every change must keep are in COMPATIBILITY.md.

## The pairs

- **Every curated kit names a designed partner, and the partner names it back.** The brief fixed three pairs (Light ↔ Dark, Paper ↔ Midnight, Sunset ↔ Dusk); the rest were judged from the palettes and the sound kits:
  - **Harbor (day) ↔ Forest (night)**: the outdoors pair. Teal water by day, deep green woods after dark; two geometric sans pairs (Manrope, Outfit) that read as siblings; two playful percussive kits (pop, marble).
  - **Cocoa (day) ↔ Ember (night)**: the warm pair, both dark. The softer, lighter one (caramel, a low soft knock, Lora) is the afternoon; the hotter, darker one (red-orange, a heavy crackling knock, Archivo) is the fire after dark. Both leanings are defensible; the sound kits decided it, and a day slot that is dark is exactly what the model allows.
  - **Blush (day) ↔ Pink (night)** and **Teletype (day) ↔ Terminal (night)**: the two kits the brief allowed. Pink and Terminal had no convincing partner among the twelve (nothing else is magenta with hearts, nothing else is monospace), so each got a day sibling built the way Light relates to Dark: the same font pair and the same sound engine with its own parameters, its own palette run through the same contrast floors, its own confetti. Blush is Fraunces, a lighter and quicker bell, the shimmer strike and the hearts and stars, on blush paper; Teletype is the mono pair, a lower and softer blip (paper, not phosphor), green ink on printout paper.
- **Sunset leans day.** It is a dark kit, but Sunset comes before Dusk, and the brief paired them. A dark theme under "Made for day" is the model's point, not a mistake: the slot is about when, not what.
- **The picker lists the two groups in pair order** (a day kit and its night partner share an index: Light/Dark, Paper/Midnight, Harbor/Forest, Blush/Pink, Teletype/Terminal, Sunset/Dusk, Cocoa/Ember), so the pairs read across the groups. `CURATED` itself keeps its order with the two new kits appended, so nothing that indexed it changed.
- **A curated kit's tag says its lean and its partner** ("Night · pairs with Light"); a saved theme's says "Yours" and, once it has one, its partner. The lean repeats the group heading on purpose: the tag is what a person reads on the swatch.

## The model

- **The glyph shows where a tap goes**: the moon while Day is on ("Night · T"), the sun while Night is on ("Day · T"), the way most sites' theme toggles do. The tooltip is the brief's literal and reads as the action.
- **A manual flip holds until the automation next changes its mind, and the hold survives a reload.** The device remembers the automation's slot at the moment of the flip (`holdAuto`); while the automation still wants that slot, the flip stands; the minute tick and the system's own change compare and let go. Flipping back to what the automation wants holds nothing. A flip while the switch is by hand is just the slot.
- **Every slot switch crossfades, not only the tap.** The brief specified the crossfade for the tap; a switch by the system or the schedule is the same one control moving, so it gets the same ~400 ms fade (instant under reduced motion). Picking a different theme for the slot that is on applies at once with the tick, as the picker always did: that is a change of theme, not of slot.
- **The crossfade interpolates the colour tokens in OKLab** (hex and rgba alike) and swaps everything that cannot be interpolated — gradients, shadows, the fonts, the colour scheme — at the midpoint, while the glow dips out and back. The tokens go through the CSSOM rule every frame, exactly as a theme change does; nothing is written to storage until the fade lands. A second flip mid-fade restarts from the previous theme.
- **Turning an automation off keeps what is on.** By hand takes the slot that is showing (so the Switch row never changes the screen by itself); turning an automation on forgets any hold and applies the automation's pick.
- **The migration keeps the theme on screen, and only that theme is guaranteed.** A by-hand device puts its theme in the slot matching the theme's base; the other slot gets the theme's partner, or that side's default for a theme with none (a theme you made has no partner yet: Light or Dark fills the other slot rather than a derived theme nobody saved). Follow system's two slots carry over as they were; the schedule's themes and times likewise. The old keys (`theme`, `darkSlot`, `lightSlot`, `follow`, `schedule`) stay where they are, never wiped, and `theme` is kept mirrored to the code that is on, so a device that ever ran the old code again would open on the theme it last saw.
- **A returning device is one that holds a list or went through the tour** (the latch the hints and the what's-new toast use). The default theme key 1.1 wrote on first load does not make a fresh device a returning one.
- **A fresh device paints the first frame from `prefers-color-scheme`.** With the system as the default switch, a light-system device would otherwise paint Dark from the inline tokens and flip to Light a beat later, on its very first open only. A media rule with the Light kit's exact token text sits beside the Dark tokens in the hashed inline stylesheet; the boot script and theme.js replace both the moment they run. The boot script is byte-identical (its CSP hash unchanged); the stylesheet's hash was re-written with `tools/csp-hash.js`.
- **The partner is an offer, not an automatic fill**, for curated kits and for Make its partner alike: choosing a theme for a slot shows "Use ⟨partner⟩ for ⟨other slot⟩" under the group the choice came from; nothing happens to the other slot until it is tapped. Make its partner saves the theme you were building (asking for a name if it has none), saves the partner linked to it through the additive `partner` field on both records, fills the slot you were filling with the theme itself, and offers the partner for the other slot like any other. The partner is named "⟨name⟩ · day" or "⟨name⟩ · night"; a pair you chose by hand is kept, an automatic one is picked again for the new base.
- **`partner` links saved records by id, both ways, and a deleted partner just stops showing.** The other record keeps a dangling id (rewriting it would cost an old client nothing and gain nothing); the picker looks the link up in both directions and ignores tombstones. `T2:` codes carry no partner: the relationship is between saved themes, never part of a code, so every device reads every code as before. The frozen v3 model strips the field and the richer record wins the tie on the way back, as the compatibility test shows.
- **The ⋯ row keeps the label "Theme"** with the theme that is on as its state, and opens Appearance; Settings' Appearance rows say "Light · on" beside the slot that is showing. `T` flips; `Shift+T` opens Appearance; both obey the single-key-shortcuts switch.
- **A sheet opens at its top.** A closed `<dialog>` keeps the scroll position it was closed at, so ⋯ → Theme on a Settings sheet last left at Advanced reopened it at Advanced, with Appearance out of sight (the after screenshots caught it). `showPanel` now resets the body's scroll after `showModal()`, for every panel; the two callers that scroll to a section (How it works, Lists → Removed) do so afterwards, as before.
- **The rows' own colour transitions are off while the palette crossfades.** `.row` (and the chips, the tabs, the checkbox) transition their colours over 0.2–0.3 s; with the tokens moving every frame those transitions trailed the fade, and for a beat after it landed the text was pale on a pale ground (the first after set caught that too). A `fading` class on the body turns `transition-property` off for everything but the glow's own dip until the fade lands; nothing jumps at the end because the tokens are already there.
- **The footers did not change.** Neither footer ever named T (Today: 1–n, N, E, ?; Everything: A, N, /, ?), so there was nothing to update; the `?` reference and How it works carry the new keys and the model.
- **The what's-new toast keeps its "New in 1.2:" prefix** in front of the headline; the button reads "What's new" and opens the About changelog.
- **The About page's version line and changelog rules moved into `styles.css`.** They had lived in `panels.css`, which About never loads, so the version line rendered as body text since 1.1; the tagged changelog needed real styles, and About's only stylesheet is the right home.

## The changelog

- **Three items for 1.2**: the flip, the partners, and the shorter notes. The switch modes (with the system, on a schedule) are one row in Settings that a returning user finds where Follow system and Schedule were; partners are the one thing nobody would go looking for, so they got the third slot. 1.1 and 1.0 were rewritten in the same shape from what those rounds shipped, nothing added.
- **`CHANGELOG.md` holds the full history**, the 0.x entries verbatim from the old `whatsnew.json` and, under each public version, its three items followed by a "for the record" paragraph in the old narrative style. No dates there either.
- **The schema is enforced by a test**: 1.0 and later only, a one-sentence headline of twelve words or fewer, one to three items tagged New, Improved or Fixed of fourteen words or fewer, and none of the words the brief banned (fonts, CDN, service worker, tests, Lighthouse, renumbering, migrations, merges).

## Process

- **The suites' contexts emulate a dark system** unless a test says otherwise, and the screenshot tool does the same, so a fresh device in the suite starts on Dark as it always did and the after set is comparable with the before set; the 1.2 tests emulate both schemes where the switch is the point. The schedule is tested with Playwright's clock (`page.clock.install` and `fastForward`), the system switch with `emulateMedia`.
- **Node, Playwright and Chrome are the ones 1.1 used** (the Codex runtime cache's Node 24 with Playwright 1.62, the installed Chrome 152); Lighthouse 12 was copied from the previous session's scratchpad rather than downloaded. The earlier sessions' dev server was still listening on 8790 (serving the 1.0 clone), so this round's working copy ran on 8791 and an untouched clone of `main` on 8792 as the 1.1 baseline for the browser suite and Lighthouse.
- **Before/after screenshots** are `shots/1.2/{before,after}` at both viewports, the before set taken from the untouched code before the first change; the after set adds the flip (mid-crossfade and landed), Appearance and the picker with a partner on offer.

---

# 1.3 decisions

Calls made where the 1.3 brief left things open. The design is in PLAN.md, "Today's Five 1.3 — plan"; the rules every change must keep are in COMPATIBILITY.md.

## The card a texted link shows

- **The tags are static HTML and nothing else.** Previewers fetch the page and read the head; they run no script, so the tags sit in `index.html` and `about.html` as plain metas with absolute URLs (`og:url`, `og:image`, the canonical link). The description is one sentence in Price's voice, and the image alt names what the card shows. `og:type`, the image's width and height and an alt were added beside the five the brief named: they cost nothing and stop some previewers guessing.
- **The card is the Today screen, staged.** `tools/og.html` is a small standalone page that borrows the app's stylesheet for the fonts and paints the Dark tokens by hand: a rail, four lines in the row type with one crossed off, the title and one line of copy at the foot. `tools/og.mjs` renders it at 1200×630 with the installed Chrome and quantises it with sharp (34 KB, against a 150 KB ceiling). The lines on it are made up on purpose (a bank call, a walk) so nobody reads the seed lines as the app's idea of a day. It is not in `sw.js`'s shell list.
- **A list link previews as the app, not the list.** Fragments never reach a server, so a `#/l/…` link shows the same card as the bare URL; that is right, since the card must never hint at a list's contents.
- **The card keeps its title off the list (build 71).** Price sent a screenshot of the card with the title over the last line and the lines squeezed against the rail. Two causes: the title was placed over the fourth line by design, and the app’s stylesheet, borrowed for the fonts, brought its `.lines`, `.row` and `.box` rules along (`.lines` is the confetti layer, absolute at inset 0), which painted the lines from the card’s corner instead of under the rail. The card’s classes now carry an `og-` prefix so only the fonts come from the app, it shows three lines instead of four, and “Today’s Five” and the tagline share a band under a divider at the bottom, in flow. Same size, same tags; only the image changed.

## The first minute

- **The welcome is the Today renderer with a local document.** `showWelcome` sets `doc` to `seedDoc("")` (no id, no secret), flags `demo`, shows `#welcome` (the title and one sentence) above `#today` and `#demo-foot` (Keep, Skip, Paste, the About link) below it, ordered by CSS. Every tap goes through `toggle`, every add through `newItem`; `afterChange` skips storage while `demo` is on, so nothing is written anywhere and nothing reaches the server. Everything else the renderer does (the strike, the knock, the burst, the finale's volley) comes for free, which is what "reuse the Today renderer" was for.
- **Keep is Skip with a reason.** Both hand the same local document to the ordinary create path (`normalize` under a fresh id, `createList`, `switchTo`), so a person who played and then tapped Skip keeps what they did; the seed lines are the three the welcome shows, so a list started with Skip is the untouched demo. Keep appears once the person has made the list theirs — a line of their own (any live line whose text is not a seed line), or all three crossed off — and stays; Skip and Paste are always there as quiet links.
- **Three seed lines, not five.** The welcome has a title and a sentence above the list and three links below it, and all of it must fit a phone without scrolling; three lines teach a tap, a line of your own and the finale, which is what the demo is for. Everything, notes, the star and the rest are still taught by the hints on the real list.
- **The demo is Today, whole, and nothing else.** `A`, `O`, `/` and `-` do nothing on the welcome; the hints, the install hint and the minute tick's rollover stay off; the line menu works (it is part of a line) and whatever it does travels with Keep.
- **The paste form waits behind its link**, as the old welcome's did behind its button, so the welcome reads as a list first.
- **The welcome's foot takes the UI font.** The About link, moved from `#welcome` into the foot below the live list, fell back to the body's Lato 400 and pulled that face (14 KB) in at first paint: Lighthouse's mobile page weight read 165 KB against 1.2's 146 and the LCP sat about 100 ms later. The paragraph rule now covers the foot, and the welcome fetches the same three faces 1.2 did (Lato 900, PT Sans 400 and 700); the browser suite checks the list of faces at first paint from now on.
- **The boot script guesses the welcome.** With the rail in the first paint and gone once the welcome took over, everything under it moved up by the rail's height; 1.2 paid that too (a shift of 0.03–0.07 when the first paint beat the app) and 1.3's taller welcome made it 0.10–0.13, enough to cost Lighthouse two or three points. The inline boot script, which already reads the registry for the theme, now adds `html.welcome` when there is no list and no link in the hash; that class hides the rail, the footer and the empty Today view until the app decides, then the app drops it in favour of `body.welcome` or, on a list, of nothing. A wrong guess only means the rail appears a beat later, as it always did. The welcome's shift on a slow first paint went from 0.10 to 0.001 (the font swap).

## Save your link

- **Saved means copied or confirmed.** `linkSaved` turns true on Copy and on I've saved it, and on nothing else; closing the sheet any other way leaves ⋯ carrying a Save your link row with a dot and the Share sheet repeating the key line with a chip. The row is a temporary tenth row: the brief's nine-row ceiling is about what lives in ⋯ for good, and this one leaves the moment the link is saved.
- **Grandfathering keys on the what's-new toast.** A device sees the 1.3 toast exactly once, on its first open after the update, and that is the moment every list it holds with `linkSaved: false` is marked saved. The obvious alternative — any returning device — was wrong: the reload iOS Safari does right after a fresh device's first list is made makes that device look returning, and the smoke test caught the new list being grandfathered on the spot.
- **The device decides the lead.** Safari on a phone (touch, not standalone) leads with the two Home Screen steps, worded for iOS and for other phones' browser menus, then Copy, no QR and no link field; the installed app says the icon holds the link with Copy as a backup; a desktop leads with Bookmark this page and the platform's shortcut, shows the link the bookmark holds, then Copy, then the QR behind an "Open it on your phone" expander. The native Share… button left the sheet: the brief listed what each variant holds, and one fewer choice is the point.
- **New keys shows the save sheet, not the Share sheet.** The new Private link is a new key that wants saving like a first one, so the rotated list is registered unsaved and marked `migrated`, and the sheet opens as "Your link changed" with a line about the old link being dead everywhere. On iOS Safari the reload happens first and the sheet follows it, so the `reopenShare` hop is gone.
- **The word encrypted stays off the welcome and the save sheet**; How it works and About keep it.

## Tell a friend, and the names

- **The note is about the app and carries the app's own address**, `A.BASE` (the origin and path the app runs at, never a fragment), handed to the system share sheet as `text` plus `url` so messaging apps compose the link properly; without a share sheet the note and the URL land on the clipboard on two lines. It sits in its own block at the bottom of the Share sheet, under a rule, after the two link blocks.
- **The View link is the sheet's default and the first Copy.** The Private link block is last, under a warning line in the danger colour, with its own Copy and New keys; its copy is the key sentence and the one-line redirect to the View link. The View link keeps its name, "view only" beside it, and its description names both uses in one breath, with the check-offs line where the sheet has room. The QR is drawn for the View link on the desktop only: the desktop is where a code is useful (the phone or a TV's browser can scan it), and the phone's sheet has Copy and Share… in less space.
- **The pill names the link on the desktop and keeps the state alone on the phone** ("View link · view only" against "View only"), because the phone's rail has no room for the name beside count · dot · views · sun/moon · ⋯.
- **The names went everywhere they were due**: the Share sheet, the save sheet, How it works (Private link, View link with a Second screen example and a Let someone watch example of the same length, New keys), About, Settings › Advanced, the refusal toast for an add on a View link, the ⋯ Share row. "This link no longer works" never named a link and stands. Nothing about a URL changed.

## Shuffle

- **A shuffle is a pinned id, not a reorder.** `renderToday` in one-thing mode prefers `shuffledId` when that line is still undone and falls back to the top undone line; a check-off, a shuffled line going away, leaving the mode or opening another list clears it. Nothing in the document moves.
- **Never the same line twice in a row**: the pick is random among the undone lines other than the one on screen; with one undone line the row wobbles and nothing changes. The shown line slides out over 160 ms and the next slides in; under reduced motion both are instant. The theme's soft tick plays (the same `sound.tick` a theme change uses), the iOS haptic fires through the hidden switch, and Android vibrates for 10 ms.
- **The triggers are `S`, the ↻ beside the count (rendered only inside one-thing mode, so Today gains no control), and a shake.** `S` obeys the single-key-shortcuts switch and does nothing outside the mode.
- **The shake is a delta between two samples**: the magnitude of `acceleration` (gravity excluded, with `accelerationIncludingGravity` as the fallback) compared with the previous sample's, over 15 m/s²; a walk moves a few m/s² between samples and never trips it. One shuffle a second, nothing while a panel is open or on the welcome.
- **The permission hint is its own bar**, shaped like the install hint, because a hint with a button is not a mark (1.1's marks never have buttons). It shows the first time one-thing mode opens on a phone that has `requestPermission` (iOS), asks once and remembers either answer in `dev.shake`; × counts as declined, and declined means ↻ only. Android has no permission to ask for, so the listener starts silently; Chrome 152 exposes `requestPermission` on the desktop and on Android as well, so the hint is gated to iOS and everywhere else the listener just starts. The hint belongs to the mode: leaving one-thing mode hides it unanswered, and it comes back with the mode. A device that said yes starts listening again on the next open when one-thing mode is on.
- **The hints stack.** The shake hint has the install hint's shape and sat on the install hint's spot, and in one-thing mode the toast sat on both (the Simulator showed it). When they are up together (iOS Safari, the first time one-thing mode opens) the shake hint moves above the install hint and the toast above both, with a `shake-on` body class the way 1.1's `install-on` lifts the toast.

## The changelog

- **The headline is about the first minute** ("A better first minute."), with three items: the welcome you can try, the links named for what they do with the save sheet fitting the device, and shuffle. The card a texted link shows is not something a person does in the app, so it is not an item; the full record is in `CHANGELOG.md`.

## Process

- **The Simulator was driven through WebDriver.** The native simulator tool refused (it wants `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`, which needs a password) and screen control of the Simulator window was declined, so the booted iPhone 16 Pro ran the local build in its own Safari under `safaridriver` (`safari:useSimulator`), with `simctl` for the screenshots and for posting the Simulator's shake notification. WebDriver's taps reach the page as touches that the app's pointer handling does not take, so the flow was driven with DOM clicks and checked in the DOM and on screenshots: the welcome's live lines, Skip, the Safari save sheet (Add to Home Screen first, no QR), one-thing mode, the ↻. The touch action on Allow did count as a gesture and raised iOS's motion prompt, which nothing available could accept, so the shake itself, the Home Screen app's save sheet and its shake stayed unverified there; the browser suite covers them with mocks.
- **The server's create limit shaped the afternoon.** 12 new lists an hour and 40 a day per address (1.0's numbers) cover a person many times over and one machine running the real-backend suite (about eight creates a run), the live checks (two) and a probe or two only a few times; the day's runs used them up, the third run came back "busy" for an hour and a half, and Price cleared this address's rows from `private.creates` in the SQL editor (the log holds salted hashes and timestamps, nothing about lists). Not a reason to raise the limits; a reason to run the real-backend suite once, early, and keep the live checks' creates in reserve.
- **A page open across a deploy reloads itself (build 61).** The shell is network-first and the panels load on first use, so a page that stayed open through the 1.3 deploy (Price's phone, the Home Screen app) fetched 1.3's `panels.js` into 1.2's markup on its first panel: the wiring threw on missing elements and every panel showed "Couldn't load that part of the app" until the app was closed and reopened. Now the page carries `data-build` on `<html>`, `panels.js` carries the build whose markup it wires (`PANELS_BUILD`, checked against version.js by the features test), and on a mismatch `init` reloads the page once, remembered in `sessionStorage` so a page that already reloaded gets the plain failure rather than a loop; app.js skips the failure toast while the reload is on its way. Pages open across this deploy (build 60 markup, no `data-build`) heal the same way on their next panel. Nothing else changes: same version, same cache name.
- **The browser suite emulates the three devices** with init scripts (`navigator.platform` iPhone, `navigator.standalone`), stubs `navigator.share` and the clipboard to read what was handed over, and fires `DeviceMotionEvent`s by hand for the shake, with `requestPermission` stubbed to grant or deny.

# 1.4 decisions

Calls made where the 1.4 brief left things open. The design is in PLAN.md, "Today's Five 1.4 — plan"; the rules every change must keep are in COMPATIBILITY.md.

## Mine and shared with me

- **Origin lives in the registry entry**, `origin: "mine" | "shared"`, migrated on read by `normalizeRegistry` (a missing origin is `mine`, so a device that updates sees nothing move); `nickname` is only ever set by hand and never written otherwise. Both are device-local: nothing about them reaches the document or the wire.
- **The hint is a path segment after the id** (`#/l/<W>/mine`, `#/l/<W>/shared`), like `/add`, stripped from the address bar as soon as it is read, and the hash parser now matches the id as a prefix, so anything a later version appends still opens the list here (§1 of COMPATIBILITY.md). View links carry no hint; a hint on an `r` link is ignored.
- **A page still running 1.3 does not open a hinted link.** 1.3's parser wanted an exact match (`/add` only), so a 1.3 page that receives `/mine` or `/shared` without a reload stays on its current list; a fresh navigation loads 1.4 first, so only an already-open old tab is affected. The frozen parser sits in `test/fixtures/parse-1.3.js` and the model test records exactly this; 1.4's parser is the prefix one §1 describes, so from here on the rule holds.
- **The question is a dialog of its own, not cancelable.** It opens before the list does (in `openList`, before anything on screen changes), with the two answers as menu rows; Escape does nothing, because the answer is how the list is filed from then on and Lists can change it. On iOS Safari, where switching lists reloads the page, the question comes after the reload; a hint pasted into the paste box is registered before the reload so it survives it.
- **A list made here is `mine` with no question; so is a migrated or rotated list.** Only `openList` for an id the registry does not hold asks, so Lists → Restore, a redirected link and the reload iOS does after a first list never ask.
- **The nickname wins in the rail and the switcher; the document's own name shows under it in Lists.** Rename on a shared list is Nickname (in any mode, since it is local); on a list of one's own it is Rename, which edits the document as before. Flipping a shared list to mine drops the nickname: a list of one's own goes by its name.
- **The switch is "It's mine after all", and it is a real switch**: on means mine. A shared list shows it off; a list opened from a link and filed as mine shows it on, so a mistake can go either way. A list made on this device has no switch. It lives in a list's detail (Lists → ›), a sub-panel that also carries Open, Rename or Nickname, and Remove from this device.
- **What a shared list loses**: New keys (its block is hidden in Share and `rotateLink` refuses), Delete everywhere (the ⋯ row is hidden and `deleteEverywhere` refuses), and every save-your-link nudge (`unsavedEntry` excludes it; a shared list was never `created` here anyway). Everything else the link allows works.
- **The undo after Delete everywhere resurrects the entry properly.** The question exposed a latent gap: the registry merge on every save unions this tab's dead list with the stored one, so the undo's re-registered entry was dropped again at once and the list came back through `openList`'s own registration — and in 1.4 that meant the question. The undo now marks the id `undead` for the next save (the dead mark goes in storage too) and hands the origin it had to the switch.
- **The groups appear only when there is something to group**: with no shared list, Lists looks exactly as it did.

## The Share sheet, by intent

- **Four blocks, one sheet, the same links.** Open on my other device carries the Private link marked `/mine`; Show it somewhere the View link; Let someone edit the Private link marked `/shared` under the warning; Tell a friend the note. New keys sits last, on its own, and never on a shared list. In view mode only Show it somewhere and Tell a friend remain.
- **The codes keep 1.3's rule**: on a desktop the first two blocks show a QR (the code first, then Copy — the phone-from-the-Mac flow); on a phone the sheet has Copy (and Share… for the View link), because a phone showing a code to another phone is the rare case and the sheet is long enough.
- **A QR code on request, beside Copy (build 71).** Price asked for the codes back on the phone. The rule above stands, and a QR code button now sits to the right of every Copy: on a phone in all three link blocks, on a desktop only in Let someone edit, since the first two already show theirs. It is a toggle (`aria-pressed`): the first tap draws the code from the link in the box at that moment and shows it above the link, the next hides it; nothing is drawn until asked, so the sheet opens as fast as before. This is the one place a code appears under the warning, and only when someone asks for it. The button’s label says what it does (“Show a QR code of this link”), like every other line about a link.
- **`navigator.share` runs in the tap's own tick.** The handler calls it synchronously and handles the promise afterwards; iOS refuses a share sheet that comes after an await. The browser suite proves it by marking whether the call happened inside the click dispatch.
- **The fallback shows the note, not "the link."** Without a system sheet the note goes to the clipboard ("Note copied—paste it into a message"); if the clipboard refuses too, the note appears in a field to select, and the toast says so.

## Panels, one stack

- **One primitive in `showPanel`.** A panel opened while another is open pushes the parent (its id and its scroll) and takes one ‹ Back button, moved into whichever panel sits on a parent; × closes the whole stack; Escape goes back a level (the dialog's `cancel` is prevented and turned into a pop) and closes at the root. `closePanel()` closes everything, so a "done" action inside a sub-panel ends the flow as before.
- **Back repaints the parent through its own opener** (registered from panels.js: the theme picker with its slot, Lists, a list's detail with its id, the pick sheet with its last rows, a line's menu with its line…), then restores the scroll position, so a value changed below is in place when the parent comes back.
- **A traversal is never doubled, and the entry below gets the app's own URL back.** The unwind lands on the entry the stack was opened over, whose URL can be stale by then (a list switched or deleted from a panel), so the landing writes the app's current place back over it and the hashchange that follows is not read as a link. A dialog the browser closes on its own while a Back is already travelling (Chrome honours a prevented Escape only with fresh user activation) must not unwind a second time, or the page would leave itself; `closeAll` never starts a traversal while one is in flight, and the reload iOS Safari does on a list switch waits for the unwind to land.
- **One history entry per level, state only.** `history.pushState({ tfPanel: depth })` keeps the URL and the hash as they are; popstate pops levels down to the state's depth, closing at zero, so Android's back button and the browser's Back go back a level instead of leaving the list. Closing the stack unwinds its entries with one `history.go(-n)` (guarded so its popstate is ignored, and a panel opened in that instant gets its entry once the unwind lands).
- **The ⋯ menu is a launcher, not a parent.** What it opens is a root with no Back; the sub-panels are inside panels: Settings → Day or Night theme, Export & import, Templates, History, Removed lists; Lists → a list's detail; Help → shortcuts and back; Share → Save your link.
- **On a phone the sheet still closes on a swipe down, and a swipe in from within 28 px of the left edge goes back a level.** Where the system has its own edge gesture (Safari), it lands as history and does the same; the page's own handler covers the installed app. The dialogs take `touch-action: pan-y`, because without it Chrome hands a horizontal touch to its own pan handling after the first move (a `pointercancel`) and the swipe never reaches the page; vertical scrolling inside a sheet is untouched.

## iOS 26

- **The save sheet's phone steps name no layout.** Three steps with inline glyphs — the Share square with the arrow (behind ⋯ in the compact layout, so "if you don't see it, tap ⋯ first"), scroll down, Add to Home Screen — read the same in Compact, Bottom and Top. Other phones keep the browser's-menu sentence.
- **The Home Screen name is the full name.** `short_name` in the boot script's manifest and in `manifest.webmanifest` becomes "Today's Five" (it was "Five", which the simulator showed under the icon); `apple-mobile-web-app-title` already said so.

## Pages open across a deploy

- **Modules are pinned to the page's build and served from that build's cache.** Every lazy import carries `?v=<build>` (panels.js and panels.css from app.js, the packs from sound.js, the QR maker, the exporter from panels.js by its own `PANELS_BUILD`, the realtime client from sync.js); the worker's cache is `tf-v<version>-b<build>`, a request for another build is answered from that build's cache when it exists (the previous generation is kept on activation, older ones reaped), and only then from the network. The `data-build` / `PANELS_BUILD` guard from build 61 stays as the detector of the case that is left: a page whose build the worker can no longer serve.
- **The reload is the last resort and it restores.** Before reloading the page commits an edit in progress, gives the sync engine a moment (`flushQuick`), and writes the view and the panel it was asked for to `sessionStorage`; after the reload `openList` puts the view back and opens that panel. The loader shows no failure toast while a reload is on its way and swallows the marker error, so the console stays clean.
- **iOS hands a reloaded page a mix of builds (build 67).** Price's phone had the app open through the 1.4 deploy; its first panel took the reload path, and the reloaded page came back with 1.4's markup but 1.3's `app.js` — Safari revalidates the page on a reload and serves the scripts it fetched within the last ten minutes from its HTTP cache (GitHub Pages marks every file `max-age=600`), and the Share sheet opened empty on that mix. Reproduced in the simulator (a 1.3 page with the worker on, the directory swapped to 1.4 under it: after a plain reload the page said build 66 with version 1.3). Two changes: the guard compares `app.js`'s build too (`api.BUILD`), and before its one reload the page fetches every shell file with `cache: "reload"`, which refreshes the HTTP cache the reload will read — in the simulator that brought a whole 1.4 page back and Share with all five blocks; and the worker fetches shell files with `cache: "no-cache"` (a revalidation, a 304 when nothing changed) and falls back within one build's cache only (`caches.match` across caches could mix generations), so a page controlled by this worker never sees a stale file again. A page still under an older worker heals through the guard's refresh on its next panel.
- **A content blocker was hiding the Share sheet (build 69).** After the cache fix Price's Home Screen app still opened Share as a header with nothing under it, on a freshly launched page. The simulator (no blocker) and Chrome (none) never showed it. The generic cosmetic rule `##.share-block` sits in Fanboy's Social and AdGuard's Social lists with no domain restriction, and Safari's content blockers (AdGuard among them) apply to Home Screen web apps too — so every section of the sheet, 1.3's and 1.4's, was `display:none !important` on his phone from the day 1.3 shipped. The class is `.lk-block` now; every class and id in both pages was checked against the six common lists (EasyList, Fanboy Social and Annoyance, AdGuard Base, Social and Annoyances) and that was the only hit; the features test keeps a list of blocker-prone names that must never come back. Lesson for the record: a name that reads like a social-sharing widget gets hidden on phones with a blocker, and no suite here would have caught it — only a device with one.
- **The ⋯ menu hands over without a traversal (build 69).** Opening a panel or the About page from the menu used to unwind the menu's history entry with `history.go(-1)` and then push a new one; the entry now carries over to the new root, so nothing travels through history while the next panel opens or a navigation starts.
- **A 1.3 page across the 1.4 deploy still takes the reload path**: its `app.js` asks for `panels.js` without a build, gets 1.4's, and 1.4's guard reloads it once with the view restored. From 1.4 on, an open page keeps its own code through the next deploy.

## The changelog

- **The headline is about shared lists** ("Yours, and shared with you."), with three items: mine and shared, Share by intent, and the way back with the iOS 26 steps; the panel stack shares its line because a person meets it as "every panel has a way back."

# 1.5 decisions

Calls made where the 1.5 brief—one line, "more sounds in the sound pack, surprise me"—left things open. The design is in PLAN.md, "Today's Five 1.5 — plan"; the rules every change must keep are in COMPATIBILITY.md.

## Six more voices

- **A version, not a build.** New sounds are news for a person with a saved list, and the what's-new toast is how the app tells them; a hotfix build would have added them silently. So this is 1.5 with a two-line entry (the six names, and that each has its own finale), and the twelve curated themes keep the sounds they had: a person on Cocoa or Sunset hears tomorrow what they heard today, and the new packs are a pick away in Settings → Sound.
- **The six were chosen to be unlike each other and unlike the six there were.** A kalimba (a plucked tine that climbs a pentatonic scale—the one musical instrument), a pencil (the sound of the thing the app replaces: a check mark drawn on paper, an eraser, a page torn off the pad), a whistle (the one human sound), bongos (a hand drum, alternating hands), a cork (the little pop, and a finale that pops, fizzes, pours and clinks two glasses) and an arcade (the coin, the hurt blip, the level-clear jingle—a cousin of Blip with a tune). Left out: a drip (Pop already is one), a wind chime (Bell already is one), a woodblock (Knock), a music box (too near the kalimba).
- **Made the same way, no files.** Each is a few oscillators and shaped noise in `packs.js`, twenty lines or so; nothing is downloaded, the packs still load on the first gesture, and Today's first paint pays nothing. One helper was added (`noiseShape`: a noise stroke with attack, hold and release and a filter that can glide) because a pencil stroke, a tear, a fizz and a palm on a drum all need noise with a shape, which the 1.1 burst (a decay only) could not give.
- **Every check-off changes with the count**, the way the 1.1 packs' pitch rises a quarter tone: the kalimba climbs the scale, the bongos alternate the high and the low drum, the arcade coin rises a semitone, the pencil's strokes wobble, the whistle and the cork shift a little. The theme's pitch and decay still reach them all (Midnight's low, slow bell becomes a low, slow kalimba), so a device override keeps the theme's character.
- **Levels were matched by rendering, not by ear.** `tools/sounds.js` renders every pack through an OfflineAudioContext in Chrome (three check-offs, an uncheck, the finale) to WAV, draws its loudness envelope and prints peak and RMS per sound; the six new ones were tuned until their check-offs peaked between 0.07 and 0.39 like the old six (the arcade's square wave carries more than its peak says, so it sits lowest), no finale clipped (the first kalimba and bongo finales summed past 1.0), and the whistle, a pure tone in the ear's most sensitive band, was brought down twice. The pictures are in `shots/1.5/sounds/`.
- **A code with a new pack on a 1.4 device gets the hue rule.** `packOf` already returned "" for a name it did not know, so a theme made on 1.5 with a cork in it imports on a 1.4 device with the accent's own sound and nothing else lost; the theme's record, links and keys are untouched. The three lists (packs.js, theme.js, panels.js) stay three, mirrored by hand and checked by the tests.
- **The simulator's clicks are not gestures for audio on iOS 26.5.** Through WebDriver a click makes the context and asks it to resume, and the resume never lands, on 1.5 and on 1.4 alike (18.1 runs it); the state machine does what it should—asks once, then makes a fresh context per tap—and the picker, the preview call and the saved pick were verified there, the sound itself on 18.1 and in Chrome.

# 1.7 decisions

Calls made where the 1.7 brief (the full pass: UI, feel, copy and bugs, no features) left things open. The plan is in PLAN.md, "Today's Five 1.7 — plan"; the audit itself is AUDIT.md; the rules every change must keep are in COMPATIBILITY.md.

## Running the audit

- **The round is 1.7.** The brief says 1.6 in places and 1.7 in others and explains why (Price flipped the two; 1.6 is another session's secret super-pink mode, still running). Branch, version string, cache name, the what's-new entry and About all say 1.7; if 1.6 lands on `main` first, 1.7 rebases onto it and its entry sits above 1.6's.
- **The harness and the fixture live in the repo** (`tools/audit/harness.mjs`, `tools/fixture.js`, `test/fixtures/longtime.json`), not in the session's scratch, so the next round can reuse them and the browser suite can boot the long-time fixture; the agents' reports and evidence go under `audit/`. The fixture stores times relative to its generation moment and the harness shifts them at load, because a "done today" that turns into "done last Tuesday" the morning after would make every rollover check meaningless.
- **Agents read a frozen clone, not the working copy.** A fix landing while a lens is mid-run would change what it sees; the clone of `main` at build 76 on its own port is the thing under audit, the working copy on another port is where fixes are verified. Agents write nothing into either tree.
- **Twelve at once rather than in queued waves.** The first six went first to learn the load; at about five on fourteen cores the rest followed without waiting, because the serial lenses (the simulators, eight simulated idle hours) are the long poles and starting them late would have cost an hour. The performance lens was told the machine is shared and to report medians and relative numbers.
- **One agent runs the real-backend suite, once** (the platform lens, from the frozen clone), as the brief asks; every other run is on the local transport. The create limit stays for the live checks.
- **The first bug was fixed before the agents started**, because the fixture would not load whole without it and every lens would have reported the same broken open. The fix is the smallest one — the constant moved above the boot block — rather than moving the boot block to the end of the file: several module-level listeners below it are registered after boot on purpose (a hashchange listener registered before boot would fire on boot's own hash rewrite), and a static test now keeps the list of bindings below `boot()` explicit.

## What shipped and what waits

- **The line was drawn by the brief and kept.** Bugs the orchestrator reproduced, copy that failed an unfamiliar reader, and cosmetic defects that are not taste calls shipped; everything that changes design waits in AUDIT.md. Two calls sat on the line and were made toward shipping because the app's own decisions already argued for them: the theme picker became a sheet on the phone (every other panel is one; the card was an omitted class, not a design), and a saved theme's × moved beside its swatch with an Undo (a button inside a button is invalid markup, and the app's rule since v2 is a ten-second undo for anything deleted). Two sat on the line and waited: the save sheet's × and Not yet (the 1.3 sheet was meant to be one you cannot miss), and Skip making an empty list (the 1.3 decision "Keep is Skip with a reason" is a design, so the label was made honest and the behaviour is proposal 1).
- **Considered and left as designed.** A View link asks Whose list is this? (the agent called the answer "Mine" impossible for a view link, but a view link on your own work computer is exactly that, and the answer files it); the sync dot on a phone shows no word while healthy (the label appears for every trouble state, as the v3 decision promised); the seed lines stay as 1.1 wrote them; the URL-shaped placeholders in the paste fields stay.
- **The panels warm on the first gesture, and the deploy guard moved with them.** The first Settings on a phone waited 450 ms for a fetch, so the module now loads 300 ms after the first pointerdown, and the sound engines at idle. A consequence: a page open across a deploy meets the build guard at its first gesture rather than at its first panel, reloads once and comes back to its view, and the panel it then opens loads on the new page. The browser suite's deploy test sets the stale build before the first gesture now. The 1.4 promise (a page open across a deploy keeps loading its own build's modules from its own cache) is untouched: the warm-up asks for the page's own build.
- **A toast raised under a sheet moves inside it.** A modal dialog makes the rest of the document inert, and the top layer is no exception (a manual popover above the sheet rendered and stayed unclickable, tried and dropped); the toast is re-parented into the open panel's body while it shows and back to the page after its fade. The a11y lens's proposal of a live slot per sheet would have been the same thing with twelve slots.
- **The hold's "moved" is the finger's, not the neighbours'.** The old test compared the row's stored order with its neighbours' midpoint, which no first or last row and no row after a reorder ever equals, so a hold released in place wrote a phantom move and never opened the menu; the neighbours were tried next and failed the moment a remote check-off changed them mid-hold. A finger that never travelled moved nothing, whatever happened around the row, and an unmoved hold now rides a remote render (its row is kept) instead of being aborted — the v3 abort stays for a moved drag and a row that left the DOM.
- **The test hook hands out no secret off the local transport.** The harness and the suites run on the local transport and still read the list id; the live checks read the link from the address bar instead. Gating the sibling hook was already the rule.
- **The curated kits were nudged, the originals were not.** Harbor's accent text and danger, Teletype's accent (the focus ring) and danger, and Cocoa's and Blush's danger were under the floors on --ink-3, the surface those tokens actually sit on (a hovered star, a panel's danger row, the Share warning); a theme you make was always checked there. They now are too — Harbor's accent text #0C7070 → #046D6D, its danger #BF4737 → #AD3728, Teletype's accent #1E9A4F → #119449 — small nudges of the kind v2 made to Dark and Light. Dark, Light and Pink keep v1's exact tokens, so Pink's accent text on a hovered star stays at 4.01:1 and is proposal 29.
- **The audit's own findings on the fixture were real.** Several lenses reported "Share never opens", "the switcher chip is hidden", "sync is off" on the long-time fixture; every one of them was the boot bug, fixed before the agents ran on the working copy but present in the frozen clone they audited. The reports were kept as written and the duplicates folded into the one fix.
- **The real-backend suite ran twice.** The one run the brief allows, by the platform lens, came back "busy": the 1.5 round's live checks had spent the hour. It was run again an hour later, by the orchestrator, and passed.
- **The welcome stays one sentence.** The fix for the unfamiliar reader ("nothing is saved until you keep it") first landed as a second sentence, and the suite's rule from 1.3 (the title and one sentence above the list) caught it; the fact now rides in a parenthetical on the one sentence. The rule is a design, the fact is copy, and both fit.
- **The save sheet hands focus to the list, not to a line.** The first draft focused the first line's checkbox, and on a mouse the row then showed its ⋯ at rest (a focused row reveals its control, by the v4 rule); `#list` takes focus itself (tabindex −1, no ring), so a screen reader hears the list and the next Tab is the first line. For the same reason the star keeps its place only after a keyboard press (a click's `detail` is never 0): a click never had a place to keep, and the re-rendered row used to drop it for everyone.
- **The fixture's days move with its times.** The long-time fixture shifted its timestamps to load time but left its day strings (a line's return date, a rule's placement) as generated, so a suite that crossed midnight saw two "Not today" lines come back — and what is on Today depends on the weekday anyway (Groceries repeats on Saturdays). The seed now shifts day strings by the same number of local days and takes the fake clock's time when one is installed (the order of init scripts is not defined), and the long-time test runs under a fixed Saturday.

# 1.8 decisions

Calls made where the 1.6 and 1.8 briefs left things open. The design is in PLAN.md, "Today's Five 1.8 — plan"; the rules every change must keep are in COMPATIBILITY.md. The brief asked for one thing—a secret pair of themes, undocumented, unlocked by a word—and for nothing else, so nothing else was added.

## Where this round starts, and what landing it on 1.7 reconciled

- **The pair was built against 1.5 and landed on 1.7.** It began as 1.6, branched from 1.5's branch rather than from `main` (1.5 was finished but unmerged then, and the brief takes its twelve sound packs as given). 1.5 shipped on its own from another session while the pair was being built, so 1.6 rebased onto it and was finished, verified and stamped at build 79 — and then never merged. `main` went on through 1.7, the audit round. This round lands the same pair on top of that work as 1.8. There is no 1.6 in the changelog, because there was no 1.6.
- **A merge, not a rebase.** The pair is six commits and 1.7 is twelve, and they touch fourteen files in common. One conflict pass says plainly what had to be reconciled; five replays of the same conflicts would have said it five times and invited a different answer each time. `main` still fast-forwards onto the result, as COMPATIBILITY.md §7 asks.
- **Where the two touched the same thing, the audit won**, and the pair was re-applied on top of its version:
  - `finalize()` now fixes accent text, accent and danger against `--ink-3`, the elevated surface, not `--ink`. Both kits went through the stricter floor with their written values intact except Birthday's danger, which the engine darkened one step (`#C0392B` → `#B93225`) to clear 4.5:1 there. Nothing else moved.
  - The finale's glow flare is inside `if (!RM.matches)` (1.7: it flared under reduced motion), and `finaleFx()` — the volley, or a Secret kit's bloom or cake — is called inside that same block.
  - The test hook hands out no list secret off the local transport (1.7). `secret` and `field` join it: they are device state, not the list's, and the browser suite reads them on the local transport where everything else is readable too.
  - A saved theme's `×` moved beside its swatch in a wrapper (1.7). The Secret pair's swatches are not saved themes, so they stay the bare buttons — which is also what keeps the partner chip landing under the right group, and the suite now asserts it.
  - The picker is a sheet with a grip on touch (1.7). The Secret group is inside it, above *Yours*, and the suite asserts that on the phone viewport.
  - 1.7 made the first check-off on a cold page play as soon as the engines land instead of being dropped. That was wired to `loadPacks` only, so a Secret kit's first sound would still have been swallowed; the same wait now covers `packs-secret.js`. `preload()` warms a Secret kit's engine the way `prime()` does.
- **What a person with a saved list sees is one new thing.** The what's-new toast keys on the version string and shows the newest entry only, so the toast is the wink.

## The key

- **A key, not a theme code.** `SUPERPINK` typed into the theme builder's *Import a code* unlocks the group; `parseCode` has never heard of it and returns null for it, so nothing about the codes changed and no device reads it as a theme. Import checks for the key first, then falls through to the ordinary parse, so a bad code still says "That code doesn't parse".
- **The word is not written down in the source.** `isSecretKey` is two 32-bit FNV-1a passes with different offset bases over the trimmed, lower-cased input, compared against two constants: 64 bits, which nothing a person could plausibly type collides with (the test tries the near misses). A casual reader of `theme.js` does not trip over the word. What that does *not* do is hide it from someone determined: the theme is called Superpink, and the name is in the same file. That is inherent to an easter egg in an unminified client, and it is the right trade—obfuscating the name would have made the kit worse to work on for the sake of a secret that was never a security boundary. Nothing in the app's own strings gives it away: the picker, How it works, About, Settings and the changelog say nothing.
- **Trimmed and case-insensitive**, as the brief asked. Four to forty characters, so a stray keystroke costs nothing.
- **The code, spelled out, is the same secret.** `T1:curated:superpink` pasted into Import unlocks the group and then applies the theme, rather than quietly applying a theme from a group that is not on offer. Anyone who has that code has the word inside it.
- **The unlock is a latch in `meta.device` (`secret: true`), COMPATIBILITY.md §5.** It is device-local, migrated on read like every other device setting, and never enters the document, so it is never encrypted, never pushed and never seen by anyone a list is shared with. Sharing a list reveals nothing; sharing the word is the whole mechanism.
- **Forget the secret** is a quiet chip under the group. It deletes the latch (an explicit user action, the only kind that deletes anything, §5) and returns any slot holding one of the two to that slot's default—Light by day, Dark by night—so the device is exactly as it was. It does not ask twice: the word puts it back.

## The two kits

- **They are curated kits, not a special case.** Both go through `finalize()` with every other kit: the same OKLCH derivation, the same contrast floors enforced token by token, the same `T1:curated:<id>` code (so a slot holding one survives a reload), the same partner field, the same `theme-color` meta, the same schedule and system switches, the same Settings → Sound override. The only difference is `secret: true`, which keeps them out of *Made for day* and *Made for night* and puts them in `SECRET`, which the picker only paints once the device has the key.
- **Partners of each other**, so choosing one offers the other for the opposite slot in one tap and the sun and moon flip between them. Superpink leans night and Birthday day, but either goes in either slot, like every theme since 1.2.
- **Superpink is as pink as the derivation allows.** The ink is OKLCH L .24 / C .10 at hue 356—more saturated than Pink's (.063) and light enough to read as a magenta room rather than a black one. Pushing further (L .265, C .112) drops `accentText` against the elevated surfaces below 4.5:1, which is where the engine says stop. Text lands at 15.2:1, muted 9.3:1, the accent 4.9:1.
- **Birthday's base is frosting, not white.** OKLCH L .985 / C .014 at hue 349 is the most pink sRGB holds that close to white; the mint, butter and lavender live in the confetti and the cake, where they can be themselves without dragging the type down.
- **A `--bar-bg` token, defaulting to what the bar already was.** The brief asked for a gradient progress bar; the bar was already `accent-deep → accent → accent-hi`, so rather than special-case it, every kit now names its own and the default is that same three-stop rule written in terms of the tokens—which means it still crossfades with them. `styles.css` repeats the default as `var(--bar-bg, …)`, so the first frame paints correctly before `theme.js` has run and the CSP-hashed inline stylesheet did not have to change.

## The type

- **Two new files, one each, both OFL.** Superpink is Fredoka (variable 500–700) over Quicksand; Birthday is Baloo 2 (variable 500–800) over Quicksand. Latin subsets from Google Fonts, self-hosted like the other twenty-two faces, 30 KB and 33 KB. Quicksand was already in the tree (Pink and Blush use it), so the pair cost two files, not four.
- **Why not Fraunces italic.** The brief called Fraunces italic and Quicksand the floor. Fraunces is already Pink's, so the secret pair would have looked like a recolour of a kit that ships; and Fraunces's glamour is not what Superpink is. Two rounded faces that are unlike each other—Fredoka geometric and even, Baloo 2 chunky with a taller x-height—give each kit its own voice and read at the sizes this app sets type at.
- **The partners do not share a pair**, unlike Blush/Pink and Teletype/Terminal. Those two were derived from their partners; these two are designed as a pair of different rooms, and they already share the family feeling through Quicksand.

## The sounds

- **Their own module.** `packs-secret.js` holds Sparkle and Party, and `sound.js` fetches it only when the kit that is on asks for one of them (`warm` on a theme change, `ready` for the unlock chime). A device that never unlocks never sends the request. They are built from `packs.js`'s own two builders, handed over as `HELPERS` rather than imported, so nothing pulls a second copy of `packs.js` in under a URL without the build query (COMPATIBILITY.md §6).
- **They are not in `PACK_IDS` and never in a `T2` code.** A theme code has to mean the same thing on every device; a code naming an engine a locked device does not have would either leak the pair or fall back silently. Settings → Sound lists them—but only on a device that has the key—so someone who unlocks can put the glitter chime on Cocoa if they like. The builder's Sound select stays at twelve.
- **Levelled by rendering, as 1.5 was.** `tools/sounds.js` now renders fourteen. Sparkle's check-off peaks at 0.21 / RMS 0.027 and Party's at 0.25 / 0.026, inside the twelve's range (0.07–0.42 peak, 0.014–0.066 RMS) and near their middle; unchecks and finales likewise. The envelopes are in `shots/1.8/sounds/`.
- **The birthday phrase is a flourish, not a song.** "Happy birthday to you" is 5 5 6 5 8 7—dotted eighth, sixteenth, three quarters and a held note—at a quarter of 0.235 s, with the last note shortened to a dotted half and the sprinkles finishing before it does: 1.11 s all told, under the bell shimmer's 1.35 s, as the brief asked. The melody is public domain; no lyrics, no recording, three oscillators.

## The sparkle field

- **CSS, not a frame loop.** Twenty-six twinkles, two elements each: the outer drifts (`transform: translate3d`), the inner fades and swells (`opacity`, `scale`). Both are the compositor's, so a list left open all day asks the main thread for nothing—measured at 0.078% of one core over five minutes against 0.017% for the same list under Dark, a difference of about six hundredths of a percentage point. A canvas loop at even fifteen frames a second would have cost hundreds of times that for a result nobody would look at.
- **A keyframe that reads a custom property is not composited.** The first cut put the per-twinkle drift in the keyframe (`translate3d(var(--x), var(--y), 0)` → `calc(var(--x) + var(--mx))`) and the peak opacity in `opacity: var(--o)`, which reads beautifully and costs 7% of a core: Chrome has to resolve those properties on the main thread every frame, and it showed up as `RecalcStyleDuration`, not script. Every animated value is a literal now—six fixed drift paths handed out at random with a random duration and a negative delay, and the per-twinkle position, size, colour and brightness written straight onto the element as static styles. Twenty-six twinkles, no two moving alike, and the recalc is gone.
- **Which turned up the one real idle cost in the app, and it was not the field.** `--strike-anim` (Pink's shimmer since 1.2, and Blush's, Sunset's and now these two) animates `background-position`, which the compositor also cannot take: a style recalc and a repaint of a gradient three times the row's width, every frame, on every row—including rows that are not struck, whose overlay sits at `scaleX(0)` where the animation was invisible and cost exactly the same. A list left open on Pink cost 4.7% of a core doing nothing. The animation runs on `.row.done .ink` only now, one selector, and a list with things still to do costs what Dark costs: Pink 0.04%, Superpink 0.08%, Birthday 0.03%, Dark 0.02%. Fixing it was not in the brief, but the brief made idle CPU a non-negotiable and this round adds two more kits that shimmer.
- **What it still costs with every line struck: about 9% of a core**, which is the shimmer, not the field (the same list with the shimmer forced off is 0.08%). That is the finale sitting on screen after the day is done, and it is the state 1.2 has always paid for on Pink; making the shimmer itself cheap means moving the gradient onto a child and animating a transform, which changes a mechanism four shipping kits use and is not this round's work. Recorded here rather than quietly left.
- **Its rules are a stylesheet of their own, and they cannot be built at runtime.** The first attempt made a `<style>` element and inserted the rules through the CSSOM, the way `theme.js` swaps the token rule. That fails: an empty `<style>` element is itself inline style, and the CSP refused it (the browser reported the hash of the empty string). They then lived in `styles.css`, which cost Lighthouse's mobile-cold score a point once this landed on 1.7: the chain to the largest paint is `index.html` → `styles.css` → the font the welcome's heading needs, and a kilobyte gzipped was enough to push the font into another simulated round trip — 150 ms on that profile, across three runs each. So they are `secretfx.css`, linked from `secretfx.js` with the page's build the way `panels.css` is linked from `app.js`, precached beside the two modules, and fetched only by a device that has chosen the kit. styles.css is 274 gzipped bytes over 1.7's now instead of 1034, and the score is 99 either way. The two `@font-face` rules stay in `styles.css`: beside their twenty-two siblings they cost 31 gzipped bytes, and moving them would have swapped the first frame's type on the one device that wants it.
- **Behind the words, always.** `#field` sits at z-index 1: above `#glow` (0), below `#shell` (2), `pointer-events: none`.
- **Still under reduced motion, paused with the tab.** `prefers-reduced-motion` puts the twinkles at their base opacity with no animation, and the module re-reads the query when it changes. A hidden tab gets `animation-play-state: paused` explicitly rather than trusting the browser to stop compositing.

## The finales

- **`fx.scene()`, not a second system.** `fx.js` gained one primitive: a `draw(ctx, seconds, w, h)` callback that runs in the same frame loop, on the same canvas, and is dropped when it returns false. It is suppressed under reduced motion like every other effect there. The bloom and the cake are drawn through it from `secretfx.js`, which is fetched at the first such finale and never on a device that has not unlocked.
- **The cake is paths, never emoji**, as the brief insisted: a plate, five layers whose colours read as sponge, cream, sponge, a pink band and frosting, a frosted top with nine drips, and five candles in two candy colours with flames that flicker. It arrives, the candles blow out one after another—each leaving three smoke circles that climb and spread—and then the cake opens into six wedges that fan out and tilt, so the layers show across the cut. It is sized off the shorter side of the viewport and set low, so on both viewports it lands in the gap between the last line and the footer rather than across the list.
- **Superpink's bloom** is the confetti it already throws, choreographed: the middle opens, eight bursts go up around the edge, two more open outward at the centre, and two rings—hot pink, then gold—expand and fade over a second.
- **Shapes are a list now.** `shapes` was a count (1 ribbons, 2 ribbons and hearts, 3 ribbons, hearts and stars); it still is, and it can also be the list of shapes to draw from. Superpink throws hearts, stars and sparkles (a four-point twinkle) and no ribbons; Birthday throws sprinkles only—short rounded bars in its six candy colours.
- **`fx.burst` takes an override.** The sparkle that answers the key has to be in the Secret pair's colours whatever theme is on, so `burst` accepts a palette and a shape list for one throw. Nothing else uses it.

## The finale lines

- **Superpink: "Everything crossed off but you."** It is a list joke and a compliment in six words, it is the only line in the app that is about a person rather than the list, and it reads in Fredoka italic at the size the finale sets.
- Not picked: **"Done, and still the brightest thing here."**—true to the palette, but it praises the room as much as the person. **"The list is done. You were always the point."**—the best of the three read cold, and the worst read out loud: two sentences where the finale has room for one, and "the point" lands as an argument, not a wink.
- **Birthday: "Make a wish. The list can wait."** The brief offered "Make a wish." and asked for better. The second sentence is what makes it this app's line rather than any birthday card's: the whole app is about the list, and this is the one day it is told to wait.
- Not picked: **"Make a wish."**—the floor, and it leaves the app out of it. **"That's the list. Now the cake."**—funny, but it keeps the default line's shape and the cake is already on screen saying so.

## Discretion

- **Nowhere a reader of the app can find it.** Not on How it works (which still counts twelve sound packs, because twelve is what is on offer), not on About, not in Settings, not in the README beyond the same wink, and not in `CHANGELOG.md` beyond a heading and one item—no "For the record" paragraph, which every other version has. A Node test asserts all of that, and a browser test walks a device that never gives the key through the picker, Settings and How it works and asserts it fetched nothing of the pair and was told nothing about it.
- **The what's-new entry is one line and a wink**, exactly as the brief wrote it: "A little something for someone in particular." / "If you know, you know."
- **The markup carries the group's heading and its way out, and neither theme's name.** The swatches are built from `theme.js` when the picker paints, so a reader of `index.html` learns that there is a group called Secret and nothing else.

# 1.9 decisions

Calls made where the 1.9 brief — the 1.7 audit's proposals 1–31 and its open bug, the guards Price put on them, and one addition (the sound packs redistributed, and a sound for Day and one for Night) — left things open. The design is in PLAN.md, "Today's Five 1.9 — plan"; the audit is AUDIT.md; the rules every change must keep are in COMPATIBILITY.md.

## Running the round

- **In the audit's rank order, one logical commit per item, pushed as it lands.** The branch is `1.9`; an untouched clone of `main` (1.8, build 99) sits on port 8792 as the baseline for the browser suite, the before GIF, the before screenshots and Lighthouse, the working copy on 8791. Node 24 and Playwright 1.62 come from the Codex runtime cache as in 1.1–1.8; Lighthouse 12.8 from the 1.7 session's scratchpad.
- **Proposal 4 stops at a checkpoint.** The motion is Price's to approve: it was built, the two GIFs recorded, and the round paused there. If the answer is no, the commit is reverted and the round goes on from proposal 5.
- **The suites keep the seed lines the way Keep does.** Skip starts an empty list now (proposal 1), so every place a suite pressed Skip to get the three lines presses the hidden Keep instead (`document.getElementById("w-keep").click()`, which keepDemo honours whether or not the button is showing). The Skip test itself covers both of Skip's meanings.

## The welcome (proposal 1)

- **Skip's label says which of two things it does.** "Skip — start with an empty list" until the person has made the welcome theirs; "Skip — keep these lines" once Keep is offered (a line of their own, or all three crossed off), when Skip is Keep without the ceremony, as the 1.3 decision meant it. One line of the person's own is the threshold, not one check mark: a tap is trying, a line is work.
- **An in-progress line counts.** Skip commits an open editor first, and decides after: a person who typed a line and reached for Skip keeps it.
- **An empty first list opens on the empty-Today line** ("Nothing on Today yet…", 1.7's) with + New line under it, and the save sheet follows as for any new list.

## The save sheet (proposal 2)

- **× and Not yet are the same exit.** Both close the sheet and leave `linkSaved` false, so ⋯ keeps its Save your link row with the dot and the Share sheet repeats the key line — exactly what Escape and a swipe already did invisibly. Copy and I've saved it remain the only two things that count as saved (the 1.3 decision stands).
- **Focus goes to the list however the sheet closes.** 1.7 put it there for I've saved it; the `close` event covers ×, Not yet, Escape and the swipe now.

## The home zone (proposal 3)

- **The key is `zone`, an IANA name, on the document.** Written by `createList` when a list is made, so the maker's zone is home. A list from before 1.9 gets its zone from the device that made it (the registry's `created`), on that device's next open, and pushed; a device that only holds the link never writes one. The alternative — the first 1.9 device to open the list pins it — would let the phone in Tokyo make Tokyo the home of a Chicago list; the maker is the one device with a claim. A list whose maker is gone stays unzoned, behind the guard, and is documented rather than solved.
- **Two zones merge by the larger string.** That is the rule `merge()` has applied to any top-level key it does not know since v4, so a 1.8 client carrying the key agrees with a 1.9 client about which value wins; the test pins it in both orders. It is arbitrary and it converges, which is what a merge rule is for.
- **The value is kept as written and used only when the platform can compute in it.** A zone from a future version's spelling (an offset, say) must survive a 1.9 client's pass; `zoneOf()` returns "" for what `Intl` refuses, and the document rolls as if unzoned.
- **"Today" is a function of the document now**: `todayFor(doc)` for rollover, not-today's return date, a rule's placement, the streak, the day review and the Markdown export; `dayOf(doc, ts)` for the day a line was finished on. History's day keys are home days; the panel still shows the *time* in the device's clock, which is what a person expects of a time.
- **The guard applies only to a document without a zone.** With a zone there is nothing to guard against: a line finished two hours ago is today at home unless home midnight passed, and then it should roll. Without one, a line finished under six hours ago is never rolled, whatever `today` the caller passes — so `rollover`'s third argument is the clock, and the two tests that passed small integers for it pass a real morning now.
- **The merge fixtures are for the Swift core.** `test/fixtures/merge/` holds golden cases for merge (records, the zone), normalize and rollover (the zone, the guard, repeats, returns, revival), every input spelled out, `today` and `ts` given, `expect` what model.js produced; `tools/merge-fixtures.js` writes them and `test/compat.test.js` replays them. Another implementation that reproduces every file agrees with this one about the document.

## The check-off, choreographed (proposal 4)

- **The numbers are the audit's.** The re-render after a check-off at 320 ms (520), after an uncheck at 160 (200); the FLIP 300 ms (520) on the app's own curve; the strike .22 s (.38) with wrapped lines at .08 s (.13); the chord and the volley at 300 ms (640) as the ink lands, the card starting its fade there rather than 110 ms before the sound. Tap to rest on the desktop measured 1.04 s in 1.7 and 0.65 s now, with no dead air between the ink and the move.
- **A moving row carries the page's ground and a z-index, from the first frame.** `.row.moving` (a class the FLIP adds and removes) paints `--ink` and sits at 2, the crossed-off line at 3, so a sink reads as one object passing another instead of two lines of type drawn over each other; the first cut let the row's own .2 s background fade run and the rows showed through while they crossed, so the class turns that transition off. The displaced rows follow in a 20 ms wave, the crossed-off line first.
- **No chord for a finale that is not there.** The 300 ms hold checks that the list is still all done, in Today, and the same list; an undo or a switch inside the window paints the plain footer and plays nothing (the 640 ms version played regardless).
- **Everything's cross-section FLIP takes the same 300 ms and the same class.** It was 420 and had no ground; a line struck in a section sinks the same way a Today line does.
- **The GIFs are Chrome's own screencast**, real frames with real timestamps assembled at half size (`tools/motion.mjs`), not screenshots taken in a loop, which cost 150–250 ms a frame in 1.7 and would have shown a choreography that never existed.

## The sound packs (the addition)

- **Change only where the new pack is clearly the better fit.** Five kits changed engine — Harbor whistles, Sunset uncorks, Ember drums, Cocoa plays the kalimba, Blush pops — and nine kept theirs, Dark, Light and Pink among them by the 1.0 decision. The table with the reasons is in PLAN.md. A changed kit keeps every parameter it had, so the old engine on the new kit (the pinned override below) is byte-for-byte the 1.8 sound.
- **Two new kits, the most the brief allowed, because two packs fit nothing.** A pencil belongs on paper, and Paper types on purpose (1.0: "a pencil scratch was always the wrong sound for a typewriter theme"); a coin belongs in an arcade, and Terminal beeps as a terminal should. Sketch (day) and Arcade (night) are a pair — every kit names a partner since 1.2 — on the Outfit pair; they went through the same floors as every kit and their engines play the packs' own parameters, so 1.5's level table applies.
- **The pin is per slot and lifts with the theme.** "A device whose active theme changes pack gets the old pack pinned as its override for that theme": both slots are checked (Day and Night can each hold a changed kit), the pin is recorded beside the override (`dev.soundPins`), and it goes when that slot gets a different theme or when the person picks anything in the sheet — an override a person never chose should not outlive the theme it was protecting.
- **One row, a sheet behind it.** The Sound section keeps its rows; the Sound pack row's sub-line reads both slots and opens a sheet with a picker for each. The old inline select would have needed a second row.
- **The sub-line names which one wins, per slot**: "Light picks Knock, and that's what plays by day" / "…; this device plays Kalimba by day" / "Cocoa picks Kalimba since 1.9; this device keeps Knock at night, as before". A theme you made reads the same way with the builder's Sound choice as its pick.
- **`dev.soundPack` stays.** The migration writes `dev.soundPacks` (both slots) and `dev.soundPins` once and leaves the 1.8 key in place, the way 1.2 left the slot keys, so a rollback reads what it wrote.

## Settings, Lists and the panels (proposals 5–10, 18–21)

- **Three groups, one row each way.** Settings is Appearance / This device / This list; the Lists group's three redirects went (removed lists sit in Lists itself, a list's history in its detail), Templates shows only for a list with no sections (a section's ⋯ carries them otherwise), and Lists' bottom buttons went with the id fragments — the chevron says there is more.
- **Move to… is one picker with two groups**: this list's sections first, then the other lists on the device, the row's sub-line saying so. The line menu shows the row only when there is somewhere to move to.
- **The builder is a sheet behind the picker's last row** (Make your own ›), not a card inside it; Back returns to the picker with the partner offer intact (`keepOffer`).
- **Share's order is what a person came for**: Show it somewhere (view only) · Open on my other device — the same list, with full control · Let someone edit · Replace both links. The qualifier sits in the heading, so the private link cannot be grabbed by a newcomer looking for something to share.
- **Whose list is this? is a radiogroup in the list's detail**, the same question the arrival asked, answerable later.
- **⋯ › Theme opens the picker**, the one place the Theme row led that was not a redirect.

## Feel and the small copy (proposals 11–13, 16, 17, 22)

- **The count and shuffle read as controls on touch** (a hairline, a fill), because a tap is the only way to find out otherwise.
- **The shake hint waits for the second visit** to one-thing mode: the first is often an accident, and a permission prompt on an accident is a cost.
- **The losing side of a simultaneous edit gets a word.** A pull that replaces words this device wrote in the last minute toasts once — "Another device changed “…” after you did" — with an Undo that writes them back as a new edit, so they win. Nothing else about merge changed.
- **Bidi controls are stripped everywhere text comes in** (import, the editor, add-from-anywhere, names), never stored.
- **An import over the envelope cap is refused with its size**, before anything is written; the cap is the server's.
- **A counter inside the last twenty characters** (`181/200`), not before: the cap is invisible until it is near.

## The worker (proposals 14, 15)

- **Own-build modules are cache-first.** A `?v=<this build>` request is immutable by construction, so the worker serves it from this build's cache and goes to the network only when it is missing; the shell stays network-first (COMPATIBILITY.md §6, updated in the same commit).
- **One copy of each file**: navigations store under the index key, modules under their path, so a device that opens ten links holds one shell.

## The design language (proposals 23–31)

- **One popover anatomy** — an icon, the label with a sub-line where it helps, the state or key slot, the destructive row in red — on the ⋯, line and section menus alike.
- **A panel's title is a step above its headings** (13 px at .14em in `--muted`; the h3s stay 11 px in `--dim`).
- **One hover treatment: the fill.** A menu row fills, the × fills the same way, a swatch lifts its own fill a shade (it paints its own colours, so a tint of its text colour at 9 % rather than `--ink-3`); the toasts' × fill too.
- **The idle fade rests at 0.2**, the audit's number, so a slow mouse user can still see what is there to click.
- **The rail wraps by its own width, not the viewport's.** Page margins grow with the text, so 200 % text on a 390 px phone leaves a 332 px rail; a container query (a wrapper `div`, `container-type:inline-size`) puts the list chip on its own line, the count and the tools on the next, and the tabs below them, whole, under 341 px. At 341 px and up nothing moves; a browser without container queries keeps 1.8's rail. The three tools became one unit so they wrap together.
- **The Undo chip names its key** (⌘Z or Ctrl+Z where there is a keyboard, `aria-keyshortcuts` everywhere) instead of moving focus to it: the promise that delete moves focus to a neighbour stands. An action toast's chip names none — the key does not run it.
- **`--done-2` joins `--dim-2` and `--muted-2`**: the done grey nudged to 4.5:1 on `--ink-3`, used by a dragged line and inside a panel. **Pink's accent text moved from #FF3D9A to #FF58A2** (4.51:1 on ink-3, the engine's own lighter step); nothing else in Pink changed, per the 1.0 decision.
- **The Markdown export prints a Today line once**, marked ★ under its section; the separate Today block is gone.
- **The ⋯ menu is two columns in phone landscape** (under 421 px of height on a touch device), 44 px rows, one glance again.

## The open bug

- **It was not a leak.** The audit's baseline was taken before panels.js had ever loaded: the first Settings loads the module and wires its dialogs once (58 listeners, ~200 nodes — the pack options, the theme swatches, the lists rows), the first Everything builds its scaffolding and the just-in-time hint once; thirty more cycles add nothing. `tools/leak.mjs` takes three snapshots (after a warm-up, after N cycles, after N more), diffs them by object id and walks retainers: zero detached DOM nodes, zero growth in nodes and listeners between the second and third, on 1.8 and 1.9 alike. The measurement joined the browser suite with a ceiling (10 nodes, 4 listeners over 20 Settings cycles and 30 view switches, after a double forced GC).

## The first paint's bytes

- **The first paint carries 9.3 KB more, gzipped, and Lighthouse notices.** The request graph is the same eighteen requests, the unthrottled first paint the same 40 ms, the scores the same; the simulated network charges the bytes — +50 ms desktop FCP, +60–150 ms mobile, inside the spread the same build shows between two of its own runs. About half the growth is comments in the house style (the rationale sits in the code as well as here); the rest is the two kits, the zone, the choreography and the Sound sheet's markup. The call was to ship and say so rather than strip the comments or defer panel markup out of index.html, a structural change no proposal asked for. If Price wants the bytes back, that is the lever: index.html holds every panel's markup and could hand the lazy ones to panels.js.

## 1.11 — a look of its own

- **The mark does not change.** The first pass drew three new marks — five lines struck, the numeral,
  a tally — on the brief's "no checkmark, draw five lines and a strike". That was reversed: the tile
  and the check stay exactly as they are, same geometry and same proportions, and only the two
  colours move. `icons/mark.svg` is therefore a **trace**, not a redrawing: the numbers are the ones
  `apple/TodaysFive/tools/make-icon.mjs` had fitted by least squares off `icons/apple-touch-icon.png`,
  as fractions of the side times 1024. `node tools/mark.mjs --trace` renders it in the *old* colours
  and diffs it against the icon that shipped — **1.60 %** of pixels differ, inside the 2 % that
  script allowed. That test is the only thing that says the drawing has not drifted from the artwork.
- **The brand is Paper's two colours.** `BRAND.paper` and `BRAND.ink` are getters onto
  `curated("paper")`; `PAPER_GROUND`, `PAPER_TEXT` and `TERMINAL_GROUND` are shared by the kits and
  the brand so neither can drift, and `test/theme.test.js` asserts they agree. The old pair —
  `#D26128` on `#1A1D21` — came from a law firm's logo and was never designed for this.
- **No single colour can be 4.5:1 text on both Paper and Terminal, and this is arithmetic, not
  taste.** 4.5:1 against Paper's `#F7F2E8` needs a relative luminance of at most **0.159**; 4.5:1
  against Terminal's `#070A08` needs at least **0.188**. The interval is empty. So the brief's
  "passes 4.5:1 as text and 3:1 as a UI colour on both" is met the way this codebase has always met
  it: **one** accent hex used as a *UI* colour, held to WCAG's 3:1 non-text floor on four grounds
  (each theme's `--ink` and its elevated `--ink-3`), and **per-theme** `accentText` at 4.5:1, which
  every curated kit already carries. Written down rather than quietly satisfied.
- **The accent is `#A86014`.** Hue 60. Balancing for the best *weakest* contrast pins any accent near
  L 0.57 in OKLCH; there it clears the floor on all four grounds by 16 % (min **3.48**) while holding
  C 0.124, which is as much chroma as a warm hue has at that lightness. The round began in the
  blue-violets, which hold about twice that chroma (C 0.24) — the "not orange" line in the brief was
  later withdrawn, leaving only "not the law firm's pair", and the warm direction won on taste with
  the contrast cost stated: a warm brand accent is quieter than a violet one would have been.
- **Cocoa's own tones cannot do the UI job.** `#D9A066` is **2.05:1 on Paper**, `#F0C48A` 1.45:1,
  `#E4AE76` 1.77:1 — they are built for a dark ground only. `#A66A34` (accent-deep) is the single
  Cocoa tone that passes, at 3.20:1 on Paper's `--ink-3`, 0.20 above the floor. `#A86014` was chosen
  over it for the 0.48 of headroom.
- **The app icon's dark appearance is Cocoa's, and it is a deliberate exception.** Tile `#2A1F1A`,
  check `#D9A066` — **7.00:1**, the strongest tile drawn in either round. iOS composites the dark
  variant on its own dark surround, so the check's contrast there is against Cocoa's ground and not
  against Paper's, and the 2.05:1 that disqualifies `#D9A066` from the UI never comes into it. The
  icon's dark half is the only place this colour appears. **The UI accent is `#A86014` on both
  themes regardless**, so nothing in the app follows the icon here.
- **Dark is recoloured in place, not replaced.** It keeps its id and its name, so a device that chose
  Dark explicitly is not moved off it; it keeps its Lato pair, its knock and its confetti shapes.
  Only colour moved: Terminal's grounds, the brand's paper as ink, the brand accent. Terminal's
  phosphor `#D8FFD8` was *not* carried over — that is Terminal's identity, not the brand's, and
  against the accent it clashed outright (the first render of the 1.11 card had green type under a
  warm strike and it was ugly). Cream on near-black makes Paper and Dark the same two colours
  inverted, which is what a pair should be.
- **Dark left the `ORIGINAL` set.** That set exempts v1's three kits from the contrast enforcement in
  `finalize()`. Dark no longer carries v1's tokens, so it is held to the same floors as every other
  kit rather than grandfathered past them. Light and Pink are untouched, as is every other theme.
- **The default pair is Paper and Terminal, and only for a device that never chose.** Every read is
  `dev[slot] || SLOT_DEFAULT[slot]`, so an explicit choice wins; `test/theme.test.js` asserts both
  halves — a fresh device gets Paper/Terminal, and a device holding Light/Dark keeps them.
- **The first-paint block changed, so its CSP hash did.** `index.html`'s inline `<style
  id="theme-vars">` is pinned by a sha256 in the meta CSP, and so is the boot script (which carries
  the `#1A1D21` fallback). Both were re-hashed with `node tools/csp-hash.js index.html about.html
  --write`. The block keeps the exact shape it shipped with — the same variables in the same order,
  minus `--done-2` and `--bar-bg`, which it never carried — so the diff is colour and nothing else.
- **One script, three retired.** `tools/mark.mjs` writes the favicon and the manifest set, the
  maskable variant, the apple-touch-icon, the card, and the app icon in iOS 18's three appearances.
  `tools/og.mjs`, `tools/og.html` and `apple/TodaysFive/tools/make-icon.mjs` are deleted. The old
  arrangement had two raster paths and neither started from a drawing, which is why the app icon
  needed a `--check` flag to stop two copies of one mark drifting apart. There is one copy now.
- **The mark is not scaled per surface, and the maskable variant is the same picture.** The check's
  worst painted radius is **0.316** of the tile against the **0.400** a maskable icon allows, so one
  geometry serves the favicon, the maskable icon and the app icon alike. `icon-512.png` and
  `icon-512-maskable.png` are byte-identical by construction, and that is correct rather than lazy:
  making the unmasked one bigger would change the mark's proportions, which this round does not do.
- **The card is rendered by navigating to a file, never by `setContent`.** The page's own CSP — the
  `<meta>` in `index.html` — survives a `setContent` on the same document and silently blocks the
  card's inline `<style>`, which renders it unstyled black-on-white. The card is written to
  `tools/.og-render.html`, served, screenshotted and deleted. The same wall is why the finalists
  sheet applied its accents through `sheet.insertRule` on the existing `theme-vars` stylesheet — the
  route `theme.js`'s own `setTokenCss` already uses.
- **The card does not carry the mark.** 1.11 puts the mark where the old one was and nowhere new,
  and the old card never carried one. It is the Today screen on the new palette, as it always was.

---

# 1.12 decisions

## Back from ⋯ was a deletion, not an addition

The ⋯ menu has been a panel since 1.4, and `showPanel` renders ‹ Back for any panel with a frame
below it. Everything opened from ⋯ had no Back for one reason: the menu's click handler called
`closeForSwitch()` first, which emptied the stack on the way out. Removing that line is the feature.
`closeForSwitch` had no other caller and went with it.

What *was* missing is smaller and was hiding behind a comment. `openers` — panel id → how to repaint
it when Back lands there — has said since 1.4 that "the ⋯ menu's is in this file", and it never was.
Without it Back reopened the menu unpainted and unanchored: a sheet in the middle of a desktop screen
instead of a popover under the button.

Two rows still close the menu. **Full screen** opens no panel at all. **Delete this list everywhere**
opens a confirmation, and a confirmation is a decision rather than a place worth stepping back from —
Back there would read as "no", which Cancel already says. **About & privacy** is an `<a href>` to a
page, not a panel; its Back is the browser's, and making it a panel to give it an in-app one is a
larger change than this round is.

## The picker asks Day before Night, and previews rather than moves the slot

⋯ → Theme opened the picker for whichever slot was on, so choosing a night theme began by switching
to night. The slot is about *when*, not *what*, and the two slots are set together or not at all.

The step is a frame in the same stack, which is why `showPanel` grew `restack`: a panel that is a
flow of steps can push the step it is leaving without closing itself. That keeps one idea of Back
rather than giving the picker a private one. Settings → Appearance is untouched and still fills one
slot at a time.

"The slot that is on updates live as each step is chosen" could have meant moving `dev.slot` to the
slot being picked. It does not. Someone who opens ⋯ → Theme at two in the afternoon would have been
left sitting in their night theme, and under an automation the flip would have set `holdAuto` as a
side effect of *looking*. The picker previews instead — the theme being chosen is on screen, the
slot is not moved, and the picker's own close handler puts the real one back. The purpose the brief
gives for the rule ("so the person sees what they're picking") is met either way; only one of them
also changes a setting nobody asked to change.

## Each view finishes on its own

`paint()` read `todayList()` whatever was on screen, so Everything showed Today's numbers under
Everything's lines. Both views now read `viewList()`. The finale follows, and so does Start again,
which on Everything brings everything back.

The review card does not. A streak, this week and today's lines are a *day's*, and Everything's
finale is about a list.

The bar's width has a half-second ease, so switching views slid between two unrelated percentages
and read as progress being made or lost. It lands instead, and animates only when something is
actually crossed off. One frame of `transition:none`, dropped on the frame after.

Two consequences that had to be handled rather than noticed later: the finale fires 300 ms after the
last check-off, so it now remembers **which view** it fired in and cancels if the view changed in
between; and every `wasAll` — open, remote, undo, rollover, Start again, the test hook — is about
the view on screen, or the first check-off after a switch would read as a finale that already
happened.

## Removal had to be named, not just done

`saveDevice()` unions the registry with another tab's stored copy — that is what makes two tabs
safe — so taking an entry out of `meta.lists` and saving handed it straight back. **That is why the
old code used a flag rather than removing anything**, and it is the thing that would have shipped
looking fine and quietly failing on a second tab.

Removal is named the way Delete everywhere names a dead id: a `removed` set the merge honours. It is
deliberately *not* `dead` — that list is gone from the server and this one is not — and
`registerList` clears it, because pasting the link again is the way back and `registerList` is the
one door into the registry. The migration for an older build's `archived` entry does the same rather
than only filtering, or the union would restore what it had just finished.

## The ten-second Undo was invisible, here and next door

Opening a list clears the toast on screen; `openList` is async; `switchTo` did not return it. So a
toast raised beside a switch was wiped a moment later. `switchTo` returns its promise now and Remove
waits for it.

**Delete this list everywhere had the same bug and has had it for some time.** It promises ten
seconds to undo, in the sheet and in How it works, and its Undo chip was hidden whenever there was
another list to switch to. Found by writing the same code next to it. Fixed here rather than left
alone on the grounds that it was not this round's five things — a promise the app makes and does not
keep is worth one word.

## The finale's two haptics read the same source

The pattern is in `apple/DECISIONS-apple.md`; what belongs here is that neither half invents numbers.
`test/sound.test.js` reads the volley's schedule back out of `fx.js` with a regex and asserts the
vibration still lands on it, so re-choreographing the confetti and leaving the feeling behind is a
red suite rather than something only an Android owner ever notices.

# 1.12 b262 decisions — the Extra category, pair one

Calls made where the brief for the Extra themes left things open. The brief asked for a second hidden category beside Secret — materials rather than colours, in designed pairs, each pair behind its own word — built so six fit, with two shipped: Chalkboard and Whiteboard. Nothing else was added. The rules every change must keep are in COMPATIBILITY.md; the Secret pair's decisions (1.8 above) are the pattern this round holds to.

## The category

- **The group is called Extra.** The brief named it. It sits after Secret in the picker, and only when a pair is unlocked; a device with the Secret word and no Extra word sees Secret alone, and the other way round. Neither word opens the other group, and a Node test says so.
- **Words are a table, not a second FNV pair.** `isSecretKey` stays exactly as it was — one word, two hashes, unchanged constants. Beside it, `EXTRA_KEYS` is a list of `[hash, hash, pairId]` over the same two FNV-1a passes, trimmed and lower-cased, four to forty characters, and `extraKeyPair()` answers with the pair id or nothing. Adding pair two is one line there and one in `EXTRA_PAIRS`. The same caveat as 1.8: the word is hashed out of `theme.js` and typed in plain text by `tools/shots.js`, so it is hidden from a reader of the palette and from nobody who reads the repository.
- **The unlock is `meta.device.extras`, a list of pair ids beside the Secret latch.** A new key inside `meta.device` (COMPATIBILITY.md §5), never in the document, never synced, never a flag on the Watch. Forget is per pair, and empties the key rather than leaving `[]` behind, so a device that forgets its only pair has the record it had before. **A 1.12 (261) page keeps the key it does not understand**, and keeps an unknown `T1:curated:chalkboard` in a slot: measured, not assumed — a build-261 worktree on a second port, the registry a b262 page wrote carried across, the old page used (a theme change writes the device record) and reloaded, and the record read back with `extras` and the unknown code intact; the old page fell back to its default for the slot it could not parse and raised no error. The script is in the write-up.
- **The kits are not in `CURATED`.** `CURATED` is what `test/fixtures/kits.json` and `PALETTE_REV` are computed over, and both are contracts — with the Swift side and with every older page's theme cache. An Extra kit lives in `EXTRA`, goes through the same `finalize()` as the other twenty, and answers to the same `T1:curated:<id>` code because `curated()` looks in both tables. `kits.json` did not move (regenerated, `git diff` empty), `data-tokens-rev` is still `1ptwfkh`, and the drift test on the Apple side stays green without a change. The generator refuses on a malformed Extra table the way it refuses on a malformed open one — pairs of two, partners within the pair, one Day and one Night, no id shared with the 18 — but writes none of it.
- **The type is `EXTRA_TYPE`, not `PAIRS`, for the same reason:** `kits.json` carries `PAIRS` whole. `pairOf()` reads both. The Watch's font fixture, which `gen-watch-fonts.py` regenerates by reading the tables out of the source, carries all fifteen, so `Kits.types` on the Apple side is 15 and its test moved from 13 with the reason written beside it.
- **One gate for both hidden groups.** `themeShown(t, dev)` answers for a Secret kit (the latch), an Extra kit (its pair in the list) and everything else (always). Yours goes through it; the group and the import field keep their own spelling of the same latch, and `test/features.test.js` walks all three doors for the Extra pair the way 1.12 b216 did for Secret.

## The grain rule, and every measured floor

- **A texture is not a hex, so a kit declares the hexes its texture is allowed to be.** `grain`: at most six colours, the first the kit's own `--ink`. The ground is one SVG built only from them — flat fills, gradients between two of them, a Gaussian blur, an opacity, and turbulence quantised to solid-or-clear alpha over a flood of one grain colour — so every pixel it renders is a channel-wise mix of grain colours, and its luminance lies between the darkest and the lightest of them. That is what lets the floors be held with flat hexes like every other token.
- **Every grain colour clears the kit's own floors** (`test/theme.test.js`, printed per colour): text, muted, dim, done and their elevated variants at 4.5:1, accent and hairline at 3:1, accent text and danger at 4.5:1, and text at 7:1 on the ink itself. Chalkboard's four grains (`#1C2724 #22302C #2A3B35 #33463F`) put text at 13.6 → 8.9, dim at 7.2 → 4.7, hairline at 5.1 → 3.3 across the range; Whiteboard's (`#FBFBFA #F4F5F3 #ECEEEB #E2E5E1`) put text at 14.3 → 11.7, dim at 6.0 → 4.9, accent at 6.3 → 5.1, hairline at 4.1 → 3.4. Two tokens had to be chosen for the grain rather than the ink: Whiteboard's danger (`#B02A20`; `#C8362B` was 4.11 on the darkest grain) and both kits' hairlines, written by hand because `hairSolidFor()` measures against the ink only.
- **And the picture is rasterised, because the rule is about pixels.** `tools/grain.mjs` draws exactly what `#field` shows (the same `groundUrl`, cover-scaled and centred, at 1440×900 and 390×844), reads every pixel back and prints the darkest and the lightest against the grain's, plus the worst contrast every token reaches on the ground as drawn. The browser suite does the same once per viewport. Measured: Chalkboard renders 0.0183…0.0452 inside a grain of 0.0183…0.0544; Whiteboard 0.8337…0.9703 against 0.7764…0.9641. The Whiteboard maximum is **one sRGB step above its lightest grain** — `rgb(251,252,250)` beside `#FBFBFA`, the rounding a premultiplied gradient is allowed — and one green step at the light end is 0.0063 of luminance, so the tolerance is 0.0065 and written down as that, not as "about". Worst case on the ground as drawn: Chalkboard text 9.77, dim 5.19, hairline 3.63; Whiteboard text 12.48, dim 5.21, accent 5.45, hairline 3.60.
- **The ground does not move.** The brief allowed compositor motion; nothing here needs it. A still picture costs no frames (the suite counts `requestAnimationFrame` over three seconds at rest: zero), has nothing to pause when the tab hides and nothing to still under reduced motion. The only motion an Extra kit adds is the finale line writing itself, once, which reduced motion turns off. Idle CPU over five minutes is in the plan, measured with the 1.8 instrument.

## The material tokens

- **Eight web-only tokens, written only when a kit names them.** `strikeH`, `strikeDy`, `strikeMask`, `strikeBlend`, `strikeExit`, `strikeExitOp`, `boxCheck`, `boxCheckW`. `cssText()` appends them for a kit that has them and nothing for one that does not, so the `:root` rule the 18 kits write is byte for byte what it was, the fixture never sees them, and the crossfade swaps them at the midpoint like any non-colour token.
- **The rules that consume them live in `extrafx.css`, not `styles.css`.** The first cut put them in `styles.css` with fallbacks; the fallbacks rendered the 18 identically, but the sheet grew 277 gzipped bytes on every first paint, and 1.8 recorded a Lighthouse point going to a kilobyte in the same place. So `styles.css` is byte for byte 261's — checked with `git diff` against `main` — and the material rules, the Caveat `@font-face` and the ground's positioning are in the sheet `extrafx.js` links when an Extra kit goes on. A device on one of these kits gets one frame of plain strikes before the sheet lands; a device on any other kit never fetches it (the suite reads the network log).
- **The strike's edge is a mask, as a data: URI.** Turbulence stretched sixfold along the stroke and quantised to solid-or-clear alpha, so the edge tears and the line holds. The CSP allows `img-src data:` and refuses inline `<style>`, which is why a mask URL inside a custom property was the way and a stylesheet rule built at runtime was not.
- **Chalk is thick, dusty and leaves on uncheck by fading as it shrinks** (`strikeExit .42s`, `strikeExitOp 0`). The marker is fat (`.34em`), lifted to sit on the words, `multiply`-blended so the words read through it where it crosses them, and smears off over half a second. The box: Chalkboard's fills with the board's own colour and takes a chalk check at 3.6; Whiteboard's stays white and takes a marker check at 4. Chalk dust is a sixth shape in `fx.js` — a dot — because the five it had were all the wrong shape for dust.

## The two kits

- **Names are the working names.** Chalkboard and Whiteboard say what they are, which is what the swatch needs to do at fourteen pixels. "Slate" and "Dry-erase" were considered and dropped: Slate reads as a colour in a list of colours, and nobody calls the board a dry-erase.
- **Whiteboard's marker is blue.** The brief offered blue or the classic red. Red is already this app's danger colour, and a red line through a task reads as a mistake rather than a finish; blue is the marker everyone reaches for first. Danger stays a marker red (`#B02A20`) and the check-off's sprinkles throw the whole tray — blue, red, green, black, sky, orange.
- **Chalkboard's accent is a pale chalk yellow, and its strike is chalk white.** Two different sticks. A white accent would have made the focus ring, the filled chip and the strike the same thing, and the accent's yellow reads on the board at 7.8:1 against its lightest grain.
- **Partners of each other**, lean night and day, so choosing one offers the other for the opposite slot and the sun and moon flip between them — the suite walks it at both viewports.

## The type

- **One family, Caveat, at two weights.** The brief asked for one open-licensed hand-drawn family, at most two files, shared by both kits with Whiteboard heavier. Caveat (SIL OFL 1.1, from the Google Fonts repository) is one variable file, 400–700, and the two kits draw it at 500 and 700: chalk held lightly and the same hand with a marker in it. It carries no Reserved Font Name (the generator reads the notice and the upstream licence, and the fixture records `false`), so the subsetting below is inside the licence. Considered and not chosen: Patrick Hand and Gochi Hand (one weight each, so two families or a faked bold), Fredericka the Great (chalky, but one weight and 100 KB), Permanent Marker (Apache, not OFL, and one weight).
- **The budget was 60 KB gzipped per pair, and Caveat's latin subset alone is 74.6 KB.** Google's latin cut is 352 glyphs: every letter has contextual alternates behind `calt`, and the variable outlines carry them all twice. Subsetting to ASCII kept 223 glyphs and 60.9 KB. What fits is the same latin range with `kern` and `liga` kept and the contextual alternates dropped — **228 glyphs, 39.9 KB** — so the hand joins its letters but does not vary them. The pair, everything included: extrafx.js 4.66 KB, extrafx.css 1.33 KB, packs-extra.js 1.65 KB and the face 39.9 KB, **47.5 KB gzipped**, all of it fetched only by a device that chose one of these kits. The category's own cost is in `theme.js`, +3.6 KB gzipped, shared by every pair and mostly comments. Measured with `gzip -9` on the files in the tree.
- **The UI face is Nunito Sans**, which the app already has, at 400 and 700. The Watch gets Caveat 500 and 700 instanced from the same file through `gen-watch-fonts.py` — 56.9 KB and 56.9 KB on disk, two files, 35 faces in the bundle — and `-TFFontSelfTest` counts the new family.

## The sounds

- **`packs-extra.js`, the shape of `packs-secret.js`.** Chalk and Marker, built from `packs.js`'s own two builders handed in, fetched by `sound.js` only when the kit that is on asks — a third late module beside the Secret pair's, never the same one, so a device that unlocks Extra and not Secret fetches nothing of Secret (the sound suite counts loads of each). Not in `PACK_IDS`, never in a `T2` code; Settings → Sound lists them once the pair's word has been given, after the twelve and after the Secret pair's two.
- **Chalk** is a tap and a squeak — a band-passed burst and a short low tone, then a sine that rises as the stroke ends, a step higher on each consecutive check-off (a semitone, where the knock's is a quarter tone; the brief said a step). Uncheck is a low-passed brush. The finale is the eraser's thump, a clap of dust and its settling. **Marker** is the cap's pop and a squeak-stroke; an eraser swipe on uncheck; three rising strokes and the cap clicking back on, with the board ringing under it.
- **Levelled by rendering, as 1.5 and 1.8 were.** `tools/sounds.js` renders sixteen now. Chalk's check-off peaks at 0.25 / RMS 0.0164 and Marker's at 0.20 / 0.0159, inside the twelve's range (0.07–0.42 peak, 0.014–0.066 RMS); unchecks 0.074 / 0.008 and 0.099 / 0.0102 (range 0.070–0.161 / 0.0075–0.047); finales 0.315 / 0.025 over 0.71 s and 0.324 / 0.0179 over 0.89 s (range 0.11–0.42 / 0.017–0.059, 0.46–1.92 s). Two passes were needed: the first cut put Chalk's check at 0.0129 RMS and Marker's finale at 0.0097, both under the floor of the range. The envelopes are in `shots/extra-1/sounds/`.

## The finales

- **Chalkboard: an eraser sweeps the board in three passes**, each laying a band of haze in the kit's dustiest grain that settles as it goes, with a puff of dust as each pass ends and a cloud as the eraser lifts; then the line writes itself in chalk (a `clip-path` reveal in thirty steps, in `extrafx.css`). Drawn through `fx.scene()` on the confetti canvas, as the cake is. **Whiteboard: one big marker check** drawn stroke by stroke across the board, `multiply`-blended so the words show through it, held two seconds and wiped by a band of the board's own white; then the line, the same way.
- **The finale lines.** Chalkboard: **"Class dismissed."** Not picked: "Board's clear. Go home." — two sentences where the finale has room for one, and it tells rather than winks; "Nothing left on the board." — true and flat, the default line's shape with a prop in it. Whiteboard: **"Meeting's over."** Not picked: "Whole board, one check." — describes the drawing that is already on screen; "Wipe it. You're done." — the eraser is the app's job, not an instruction to the person.

## Discretion

- **Nowhere a reader of the app can find it**, held to the same test as the Secret pair: `test/features.test.js` reads About, the changelog, the README and the long-form help for either name, for "Chalkdust", and for "extra theme / group / pair", and the markup carries the group's heading and an empty actions row — the Forget chips are built per unlocked pair at render time, so a reader of `index.html` learns that there is a group called Extra and nothing else. The version holds at 1.12, so there is no what's-new entry and no toast, and a person with a saved list opens this build and sees nothing new. The browser suite walks a device that never gives a word through the picker, Settings, How it works and About and asserts it fetched nothing of the pair and was told nothing about it.

## First paint, held to the byte where it could be and not where it could not

- **Zero new requests and a byte-identical `styles.css`** for a device that never unlocked — both measured, both in the suite. What could not be held is the size of `theme.js`: the kits, their strike masks and the words are in it, and it is the module the boot path parses, so a device that has never heard the word still downloads 3.6 KB more of it gzipped. `tools/paint.mjs` (Lighthouse's mobile numbers over CDP, eight runs a side, interleaved) puts that at **+40 ms of mobile first paint at the median, ranges not overlapping**; the desktop number did not move. Recorded rather than argued away; the fix — resolving a hidden kit's code lazily — changes how every code resolves and belongs to a round about that.
- **Idle CPU over five minutes is Dark's**: 0.009 % and 0.012 % of one core against Dark's 0.010 %, because the ground is a picture and nothing on it moves. The 1.8 field cost 0.078 % for the same reason in reverse.

# 1.12 b268 decisions — the Extra category, pair two

Calls made where the brief for Bark and Char left things open. The category itself is b262's and every call in the
entry above stands; this is the sequel it said would be "one line in `EXTRA_KEYS` and one in `EXTRA_PAIRS`" plus two
kits and their material, and that is what it was. Nothing else was added.

## The family, and why this pair brought none

- **Both kits are Lora + Karla, one of the thirteen `PAIRS` the app already carries.** The brief said no new family,
  and the budget is the reason it is worth saying twice: pair one's Caveat cost 39.9 KB gzipped after a subsetting
  fight, and it is the single largest thing in the category. This pair's type costs **nothing** — no file, no
  `@font-face`, no line in `gen-watch-fonts.py`, and the Watch bundle holds at 35 faces and 102/102, which §1 of the
  Apple README asks for. Lora rather than the other twelve because its serifs are wedged and its stems are heavy
  enough to hold a one-pixel highlight over a one-pixel shadow, which is the whole of the carve; Karla under it is a
  plain workshop grotesque. Considered and not chosen: Playfair (the hairlines vanish under a relief shadow),
  Fraunces (closer, but its wonk reads as hand-drawn rather than cut), Cormorant (far too fine), Archivo and Manrope
  (no serifs to catch light on).
- **The type is in `PAIRS`, not `EXTRA_TYPE`, and that is the rule rather than an exception.** `EXTRA_TYPE` exists so
  a family an Extra kit brings does not move `test/fixtures/kits.json`, which carries `PAIRS` whole. A kit that
  brings no family has nothing to keep out of the fixture, so it names its type where every other kit does.
  `pairOf()` already read both tables; the suite's assertion moved from "in `EXTRA_TYPE` and not in `PAIRS`" to
  "resolves, and is in exactly one of the two".
- **The carve is a token, `taskShadow`.** `0 -1px 0` of near-white over `0 1px 0` of a warm dark on `.row .tx` and on
  the finale line, written only for a kit that names it. **The floor is still text on ground**: every contrast
  number in this round is `--text` against a grain hex, never against the shadow, which is a pixel of relief and
  is not what makes a word readable.

## The burn: what could not express "run once and hold", and what could

- **Neither `strikeAnim` nor a transition on the strike survives a check-off, because the strike does not.**
  `layoutStrikes()` throws away every `.ink` of a row whose content changed and builds new ones, and a check-off
  changes it. Measured rather than assumed: the overlay is born at `#FF7A18`, is `rgb(222,113,32)` at 272 ms, and at
  **477 ms is a different element**, already cold. An animation is worse than a transition here, not better: it also
  re-fires on every later relayout — a resize, `document.fonts.ready` — and `nofx`, the one-frame guard app.js has,
  silences transitions only.
- **So the heat lives on `.lines`, the container, which is never replaced — only emptied.** `--burn` is a registered
  `<number>` (`@property`, inherits) that goes 1 → 0 over `--strike-cool` on the row being struck, and `.ink::after`
  is that much ember over the char. A rebuilt strike reads the value mid-fall and carries on; a row rendered already
  struck never crosses the boundary, so nothing fires on a reload or a resize (the browser suite resizes the window
  mid-test and asserts the line does not light again). Three tokens, all optional: `strikeHot` (a gradient, so the
  band is shaded across its height), `strikeHotShadow`, `strikeCool`. The 20 kits that name none of them get an
  `::after` that is transparent with no shadow at an opacity nothing reads, and their `:root` rule is unchanged.
- **Where `@property` is not implemented the number is not interpolable and the line is simply born cooled** — which
  is exactly the reduced-motion presentation, and reduced motion gets it by the same route (`transition:none`).
- **Uncheck cannot re-light it**: the ember layer is visible only under `.row.done`, so sanding the char back is a
  fade, not a flare. Asserted.

## The accent: the blade, not the fresh cut

The brief offered either. **Fresh-cut wood is a paler shade of the plank** — on Bark's lightest grain (`#F3E7D3`)
the brightest honest fresh-cut hex reads about 1.1:1, and to clear the 3:1 an accent has to clear it would have to
stop being fresh-cut wood. The blade can: `#3F6076`, a blued steel, **5.46:1 on the lightest grain** and 3.93:1 on
the darkest, with `accentText` at 7.00 and 5.03. It also earns its place twice — the focus ring and the filled chip
are the one cool thing in a warm kit, and the chisel in the finale is drawn in it. Char's accent is the ember
(`#FF8A3C`, 7.70:1 on its own ink and 5.77:1 on its lightest grain), which is what the brief asked for and what the
sparks and the check are.

## Two engines, not one parameterised Wood

`Carve` and `Burn`, both in `packs-extra.js` beside `Chalk` and `Marker`. One engine reading the kit's `pitch`,
`decay`, `bright` and `noise` would have been fewer lines, and it was the wrong shape: **Settings → Sound offers a
pack per slot**, independent of the kit, so a person who picks "Wood" on Char would be handed the blade. The two
share no generator anyway — a band-passed scrape over a low resonant body against a hiss with short random crackles
in it — so one name would have been two engines wearing it. Eighteen packs now: twelve, the Secret pair's two, and
two per Extra pair. `tools/sounds.js` reads `ORDER` and took them without a change.

## The group with two pairs in it

- **The order is the table's, not the order the words arrived.** `unlockedExtras()` answered with
  `meta.device.extras` as stored, which is the order a device happened to be given the words in — so two devices
  with both pairs would show the picker's Extra group, Settings → Sound's last four entries and the kits handed to
  the Watch in two different orders. It now filters `EXTRA_PAIRS`' own keys instead. The record keeps what it was
  given (nothing about the stored shape changed, COMPATIBILITY.md §5); only the reading is sorted. It could not have
  come up in b262, which had one pair.
- **Forget stays per pair, and it is now visibly per pair**: two chips, and forgetting one takes back only the slots
  holding that pair's kits. The browser suite puts a kit from each pair in a slot, forgets one, and asserts the
  other slot did not move.
- **One group, not two.** Both pairs sit under the single **Extra** heading rather than one heading per pair: the
  heading names a category, and a person who has two words has found more of the same thing, not a second thing.

## The two kits

- **Names.** Bark and Char say the material and the state it is in, which is what a swatch has to do at fourteen
  pixels. "Pine" and "Ash" were considered and dropped: Pine is a colour in a list of colours, and Ash is the thing
  left over rather than the wood.
- **Partners of each other**, lean day and night, so choosing one offers the other and the sun and moon flip
  between them — the suite walks it at both viewports, and either goes in either slot.
- **Bark's ground is a plank with the grain running the long way**, a knot low and right where it is out of the
  words' way, and the sawn ends a shade darker. **Char's is the same plank smoked**: the grain only just there,
  blotches of the deepest char where the fire took hold, and ash caught in the grain. Both are built at run time
  from four grain hexes each and nothing else, which is what lets `tools/grain.mjs` hold them to flat floors.
- **`grainLines()` is deterministic** — a fixed wobble per line, no `Math.random` — so it is the same plank every
  open, and the rasterised measurement means the same thing twice.

## What the eye caught and no test did

Four passes with the page served and the images read, in the order they were found:

- **The first Bark ground smeared a diagonal across the plank.** Three blurred "cathedral" arcs read as a scuff
  rather than as figure, and the knot beside them read as a stain on the first line. Both gone.
- **Char's soot came back olive.** SVG filters interpolate in linearRGB by default; near-black colours have almost
  no distinct levels there in eight bits, so an 88 px blur over `#1B1512` quantised into a green-yellow cast — a
  colour that is in no grain and that `tools/grain.mjs` would have failed on only by luminance, not by hue.
  `color-interpolation-filters="sRGB"` on this pair's filters. `speckle()` takes it as an opt-in flag, so b262's two
  grounds are byte for byte what they were.
- **The gouge read as a coloured rule**, exactly the way b262's first chalk strike "read as beads": the fresh core
  was barely paler than the plank. A deeper lip, a brighter core, `max(9px,.24em)`, and lifted to `-.13em` so it
  crosses the words rather than the baseline.
- **Char's ember never drew at all.** `strikeHot` became a gradient for the strike's shading and the canvas was
  still parsing it as a hex — `rgba(NaN,NaN,NaN,…)` into `addColorStop`. The finale takes its hex from the kit's own
  confetti now. Nothing reported it: the throw is inside a `requestAnimationFrame` callback and the suite's page
  error count stayed at zero.
- **The chisel was a pen nib.** Redrawn as a hand tool — a bevelled blade, a collar, a turned handle, held at an
  angle.

## The finale lines

- **Bark: "Whittled down."** It is the only one of the three that is about the list as well as the wood. Not picked:
  "Blade down." — the act, and it describes the sound rather than the person's afternoon; "Cut and dried." — a pun
  about seasoning lumber, which is a fact about timber and not about finishing anything.
- **Char: "Burned through it."** Not picked: "Nothing left to burn." — true and flat, the same fault b262 named in
  "Nothing left on the board."; "Out cold." — the fire is out, but the phrase means unconscious, which is not a
  finish.

## Discretion, unchanged

`test/features.test.js` reads About, the changelog, the README and the long-form help for both new names and for
"sawdust", word-bounded so `charAt` in a script is not a leak. The version holds at 1.12, so there is no what's-new
entry and no toast, and a person with a saved list opens this build and sees nothing new. The browser suite walks a
device that has given one word and asserts it is told nothing of the other pair — not in the picker, not in
Settings → Sound, not in How it works.

## First paint, and the one number that is not zero

The pair adds **no file**: its material is in `extrafx.js`, `extrafx.css` and `packs-extra.js`, which the category
already had and which the service worker already precaches, so the shell's request list does not change and neither
does `styles.css` (`git diff main -- styles.css`, empty). What grows is `theme.js`, because the kits, their masks
and the words are in the module the boot path parses — the number and its instrument are in `PLAN.md`.

**Landed as build 278.** The full browser suite ran end to end on this tree before the stamp (185 passed, 0
failed), and first paint measured unchanged against 266 (desktop FCP 56 → 52 ms, mobile 1216 → 1212 ms, medians of
eight a side). Idle CPU was not measured: Price skipped it at landing. The pair runs nothing at rest by construction.

# 1.12 b279 decisions — motion, round one: cross it off by hand

The brief is `L3/todays-five-1.12-motion-1-prompt.md`, the first of six rounds meant to give the app a moat. Price
changed two things at the checkpoint: a wrapped line is struck as one stroke in reading order, and "make all your
suggested changes." The brief asked for Fable; this round ran on Opus.

**The gesture.** A horizontal drag on an undone line draws its strike. It is recognised the way `swipeStart` already
recognised a swipe: 14 px sideways before 12 px down, never while dragging or editing. Touch, pen and mouse all draw.
On release the strike lands when 55 % of the stroke is drawn. That is by distance and never by speed: swipe right used
to open the line's menu, and a flick meant for that must not cross a line off. Landing is `toggle()`'s check-off,
unchanged. Short of 55 %, the ink pulls back on a critically damped spring (~275 ms) and nothing is written. A done
line gives up to 14 px and springs back. Swipe left is untouched. The menu keeps the hold.

**The mouse draws.** `DRAW_MOUSE` is on, because a trackpad drag across a line's words is the same gesture, and it
survived the checkpoint. Two tests guard it: a click that wobbles a few pixels is still a click, and a drag out of the
row draws nothing. A press released on its own row's words has always been a click (1.9), so a drag that ends there is
a click, not a strike.

**The wrap (Price's call).** The first cut struck every wrapped line at once at the finger's x, like a rake. Now a strike
is one stroke through the text in reading order.
- *Drawn:* the finger's sweep across the row is the whole stroke, so a wrapped line is crossed off in one pass without
  the finger having to wrap. The ink runs ahead of the finger on the early lines and meets it on the last.
- *Tapped:* `layoutStrikes` gives each line a delay, a share of the time in proportion to its width, and an easing
  (the last line eases out). One line keeps 1.9's .22 s and sets no variables. Two lines take .28 s and three or more
  .32 s, so the ink still lands inside the knock. Unchecking unwinds the stroke from the last line (`--dr`).

**The ink while it is drawn.** A flat ink grows with `scaleX`, as a tapped strike always has. A textured ink would
squash under a scale — a gradient (Pink, Blush, Sunset, the Secret pair) or a mask (the Extra kits) — so it is shown
whole and revealed with a clip. The Extra kits fade an unstruck ink out (`--strike-exit-op`), so a line being drawn is
held at opacity 1. Chalkboard drew nothing mid-stroke until that was found, and it was found by looking. Every inline
style is gone when the ink lands, and a test compares the computed ink of a drawn strike with a tapped one.

**The landing carries the finger.** The rest of the stroke runs at the finger's release speed: 0.8–3.2 px/ms, landing in
70–240 ms, so a flick lands faster than a slow hand.

**Char's hot tip.** While a strike is being drawn, Char's burn glows only at the tip and cools behind the finger.
`extrafx.css` reads `--hot` and `--tip`, and since that is the Extra module's own stylesheet, no other kit pays for it.
After the lift, the tip cools over .9 s, and the check-off does not reheat the line: `--burn` is set to 0 on `.lines`
while the strike is drawn. A tapped strike on Char still burns and cools over 1.5 s, as b268 designed it.

**The scratch.** One shaped-noise voice serves all eighteen engines, each with a row of filter settings. Its level and
brightness follow the finger's speed, and it pans with the finger. It was levelled with `tools/sounds.js` at three
speeds. The first render had fifteen engines louder than their own check-off: a continuous hiss measured against a
knock's decaying window. So each level was scaled to 80 % of its check-off's loudness and 90 % of its peak. The whistle
and the coin get more margin, because a pure tone peaks low and noise does not. Result: 0 of 18 over, on three
renders. It is levelled by the numbers, not by ear; `shots/motion-1/strokes.m4a` is for the ear.

**The hand.** The page sends `tf:draw` and `tf:lift` and never a speed; the shell measures the finger itself. The three
Apple calls are in `apple/DECISIONS-apple.md`.

**The hint.** A device that saw the old menu hint (`dev.hints.menu`) gets one mark on its first drawn strike: "A swipe
across a line crosses it off now—hold it for the menu." The wording went through the voice skill. A new device is never
told, because it never knew the old gesture.

**`motion.js`.** It is fetched 600 ms after load, or on the first press on a row. It is version-pinned and in `SHELL`.
`spring()` solves a spring once into a CSS `linear()` easing and ends it when it is settled to the eye (within 0.4 %),
because a longer tail is time nobody sees. It weighs 3.9 KB gzipped.

**Budgets.**
- `app.js`: +1,158 bytes gzipped against a 1 KB budget, 134 over. The overage is the wrapped tap strike, which has to
  be in `app.js` because strikes are laid out at first render, before `motion.js` is fetched.
- `styles.css`: +95 bytes.
- `motion.js`: 3,890 bytes gzipped, under its 4 KB.
- Idle CPU: not measured, because Price said to skip the idle tests. Nothing in the round runs at rest.

# 1.12 b293 decisions — each kit ends its own way

Price's call after round one's checkpoint: "Feel free to experiment with the celebratory endings differently per
theme and add a nice little animation if it makes sense to do so." This is bet 5 of the moat proposal, the finish
line, pulled forward. It ships with the rest of the round below on one build, at Price's word.

**Where it lives.** `finale.js` is new and lazy. It is fetched in the same idle beat as `motion.js`, pinned to the
build, and in `sw.js`'s `SHELL`. `finaleFx()` hands a curated kit to it; until it has arrived, the volley plays as it
always did. The Secret and Extra kits keep the finales they were designed with. A theme you make ends Clean.

**The line, in the material's hand.** "That's the list." arrives a letter at a time, each material its own way:
- Ink (Paper, Cocoa): written in, with a pen's swash drawn under it.
- Phosphor (Terminal, Teletype): typed, a caret blinking three times. Terminal adds a CRT flash.
- Candy (Pink, Blush): popped in.
- Tide (Harbor, Forest): floated up in a wave.
- Glass (Midnight): brought into focus.
- Glow (Sunset, Dusk): risen into light.
- Ember: kindled orange, then cooled to the kit's colour.
- Pencil (Sketch): scribbled in.
- Pixel (Arcade): typed like a game.
- Clean (Light, Dark): dropped in.

Every letter lands as plain text again, so the card at rest is what it always was. A typed line keeps its full width
from the first frame, with the untyped part invisible, so the card never reflows as it types.

**One line changes: Arcade's, to "Level clear."** It is the one kit whose ending is a game's. It lives in `app.js`
(`FINALE_LINES`), where `applyThemeCode` sets the line, and not in `theme.js`. Adding `finaleText` to a curated kit
would move `test/fixtures/kits.json` and the Swift kit table, a cross-client change for a joke. Terminal keeps "That's
the list.", because it is the night default and that is the brand's line.

**The confetti, in the material's own particles, on the volley's own rhythm.** Terminal and Arcade throw pixels on a
3 px grid, Midnight glass shards, Harbor and Forest rising bubbles, Ember rising sparks, Sunset and Dusk sparkles, and
Sketch graphite. Paper, Cocoa, Pink, Blush, Light and Dark keep their own ribbons and hearts. The new particles are
drawn through `fx.scene()` by `motion.js`, which hands `emit` to `finale.js` (a line a material erases throws the same
ones), so `fx.js`, which is on the first-paint path, does not grow. Every burst
keeps the volley's timing: seven along the bottom 65 ms apart, one through the middle at 210 ms. The iPhone's finale
pattern is that rhythm, so the hand still lands with the eye. Nothing native changed.

**Reduced motion** keeps the quiet card: `finale()` returns false, and the volley it falls back to does nothing under
reduced motion, as it never has.

**An older overlap, fixed on its own commit.** On a phone, a mono kit's line and its chip don't fit one row, so the card
wraps and its line sits under the Done toast the last check-off raises. Terminal's finale, the night default, was
drawn half under "Done · Undo". `paint()` now measures the card's extra row (`--fin-extra`), and `body.fin-tall` lifts
the toast by it, the pattern of `--shake-h` and `--install-h`.

# 1.12 b293 decisions — the materials, the menus, the unseal

Price's word at the checkpoint: "Love it, keep going. Make all your suggested changes." Then: "Let's do this whole
build and then run the tests at the end rather than a bunch of tests as we build." So bets 2, 3 and 4 of the moat
proposal and the sound refinements were built straight through on the branch the endings began, with syntax checks
only, and the battery ran once at the end. TV and the widgets (bet 6) wait for a round of their own.

**One build, and what that costs.** The rule is that a change that moves other people's screens ships on its own build,
so a report can be pinned to it. This round moves nearly everything that moves, on one build, at Price's word. The
cost: a report against this build names the build and not the piece, and most of the pieces share `app.js`, so the
entry below is the map from what someone saw to where it lives.

**The material is a kit token.** `theme.js` names each kit's material (`MATERIALS`, `materialOf`): Clean (Light, Dark),
Ink (Paper, Cocoa), Glass (Midnight), Tide (Harbor, Forest), Candy (Pink, Blush and the Secret pair), Phosphor
(Terminal, Teletype), Glow (Sunset, Dusk), Ember, Pencil (Sketch), Pixel (Arcade). A theme you make is Clean; an Extra
kit is its pair's (chalk, wood), whose inks extrafx.css already draws. `applyTheme` writes it as `html[data-mat]`, and
the crossfade swaps it at its midpoint with the fonts. It is not in the theme code, the kit fixture or the Swift kit
table: nothing outside this page reads it, and a device that never loads this build never needs it. Each material has
three springs (move, snap, pop) and a tempo in `motion.js`, solved into `linear()` easings once; Pixel has none and
moves in steps.

**The strike in the material's own hand.** Ink is a pen: heavier, uneven, each wrapped line a hair off level (the
independent `rotate` property, so every transform on the ink is untouched). Pixel is square and thick and lands in
steps, drawn by hand in tenths. Pencil is a scribble: `layoutStrikes` draws a zigzag through the words as an SVG,
seeded by the line's id so a line always gets the same one, and it is revealed by a clip rather than stretched —
`motion.js` treats it as it treats a gradient. Every other material keeps the kit's bar. The struck row at rest is
still what a tap leaves.

**Surfaces come from what you touched and go back to it.** Dialogs still open and close synchronously, as the panel
stack and everything that calls it expect; `motion.js` only animates them. A panel grows out of its control (⋯, a
line's ⋯, Share) by a clip and a short translate, or out of the panel it replaces — a push, a Back, the ⋯ menu turning
into what it launched — and a sheet with neither rises on the material's spring. Menus deal their rows in. Closing,
the real dialog closes at once and an inert copy folds back into its control over a fading copy of the backdrop (a
sheet drops away), and the control bumps as it lands. A panel opened in the same moment the last one closed takes the
copy's place and grows from it, which is how the ⋯ menu becomes Settings instead of folding away and reappearing. A
sheet dragged down keeps its own drag. The copy never holds focus, never reads as open (`[open]` is not on it) and is
gone in under 300 ms.

**A line's menu comes from the line.** On a phone its words rise out of the list into the menu's title (a popover, so
the sheet's backdrop does not cover them) and go back into the line when the menu closes with nothing chosen. The
actions send them where they go: Take off Today flies them to the Everything tab, Put on Today to the Today tab (a
star's tap in Everything does the same); Not today sends them off to the right while a moon rises where they were
(a swipe left, which has already carried them off, gets only the moon); Delete takes them home and the line is erased
in its material — Clean folds it away, Ink smears it, Glass shatters it, Tide sinks it, Candy bursts it, Phosphor
backspaces it, Glow dissolves it, Ember burns it, Pencil rubs it out, Pixel explodes it. The data changes at once, the
toast and Undo with it; only the row waits, out of the renderer's hands, and the lines below close the gap after it
has gone. Undo while a line is still leaving takes the copy away and brings the line back in its place.

**Today is a close-up of Everything, so the tabs zoom.** The View Transitions API, only for the tabs and A: the lines on
Today are named for the moment of the switch, so they travel between their places in the two views, the rest scales
away and in, and the chosen tab's pill (the seg's tabs are pills now) slides across. The names are taken off when it
ends. Every other switch of view is instant, as it was. A view transition takes no input while it runs — Chrome sends
every tap to the page's root, whatever `pointer-events` says, which a hold 400 ms after a tab caught — so the zoom is
over in 0.34 s and the theme's reveal in 0.46 s, both under the time a person takes to look and then tap.

**A theme you pick opens from what you touched.** The sun or moon, T, and a swatch in the picker: the new theme grows as
a circle from the control over the old one (Phosphor arrives as a raster sweeping down, Pixel in steps). The change
itself lands inside the transition, a frame later, and the sun or moon's tick with it (the tap primes the audio
first). The clock's and the system's switches keep the crossfade.

**The count rolls like an odometer.** Its text is the count from the first frame; the old number rides above or below
the new one in a window one line tall, from `data-was` and a pseudo-element, so nothing that reads the count ever reads
two numbers. A new view or a new list does not roll.

**The unseal.** The list is ciphertext until it reaches the device, so a list opened here — cold, or switched to —
arrives in its material's way while a lock over the sync dot opens: Clean rises, Ink develops, Glass comes into
focus, Tide lifts out of a mist, Candy pops, Phosphor and Pixel type out, Glow dawns, Ember kindles, Pencil is
sketched in. It is CSS (`html.unseal`, a stagger per row) so a cold open needs no module; a touch or a key ends it at
once, and the welcome's list, a list just kept from the welcome, and reduced motion never see it. The lock's click is a
cue that plays only on an audio context that is already running, so a cold open makes none.

**The keys.** Share's links come up as ciphertext the length of the link and decode into it; Copy, the QR code and
Share read what the field holds (`data-v`), which is the link from the first frame. New keys, confirmed, sweeps a band
of the accent down the screen as the list is sealed under its new key; the list unseals as it opens, and on the desktop
the new link decodes in the save sheet. The prototype's crossing-off of the old links is not here: production asks
first, and a strike through links that a No keeps would say the wrong thing.

**Sound.** The engines are unchanged; the stage around them is new. A room per material, an impulse response of
decaying noise made the first time a sound plays in it (Glass rings, Tide and Glow are long, Phosphor and Pixel nearly
dry). Each check-off and uncheck is placed in stereo where it was struck. A limiter sits in front of the volume, at
-3 dB with a hard knee, so a check-off on a finale's tail never clips. The day's check-offs climb a major pentatonic
into the finale's chord, in each engine's own units of pitch (a knock's steps are quarter tones, a blip's semitones,
a marble's thirds of one); the kalimba already did, and the rest keep their own steps. Four cues of the app's own, the
same for every pack and quieter than any of them: a whoosh for a surface opening, a tick for a step inside one, a key,
and the lock. A context without a limiter, a convolver or a panner plays dry, as before. `tools/sounds.js` renders the
engines dry, so the level table stands.

**The app switcher.** On the iPhone the switcher's picture of the app is now a card, the theme's own ink and a lock,
put in place as the scene resigns active and lifted as it comes back. Nothing is read or kept; it is a colour and a
symbol. It is not a setting.

**What waits.** Static grounds per kit (the prototype's paper grain, scan lines and waves) need the grain rule's
contrast measurements on every surface first. TV and the widgets are bet 6. The prototype's ten-second undo for Delete
everywhere touches the server's side of deletion and is not motion.

**Reduced motion.** Everything above is off: panels are simply there and simply gone, lines simply leave, the count
simply changes, no unseal, no reveal, no zoom. The drawn strike still follows the finger, as round one decided.

# 1.12 b309 decisions — Settings as a hub

Price, after 308: the page between Settings and the picker that showed the Day and Night choices with a sliding switch
(the prototype had it; 306 did not build it), and then "re-do my settings menu as you see fit … Combine where it makes
sense to combine, separate where things that shouldn't be combined are … you can also reorganize the suggested day and
night themes if there's any that seem to be in the wrong spot." Total freedom, in his words. Nothing moves on anyone's
screen until they open Settings or ⋯ → Theme, so it shares a build.

**A hub, not a form.** 1.9's Settings was one long sheet: Appearance with a select for the switch, then "This device",
ten unrelated rows (sound, its pack, a volume slider, celebrate, day review, wake, swipe, keys, fade, who's here), then
This list with the add-from-anywhere URL field open between rows. It is now a short hub. Two rows at the top say what
is set and open pages of their own — Appearance ("Paper · Terminal", with a dot of each where there is room) and Sound
("On · Kalimba", or "Off"). Then the switches stay switches, grouped by what they are about: **Screen** (keep awake,
the day review, the idle fade), **Other devices** (who's here, and celebrating their check-offs, which 1.9 kept apart),
**Gestures** on a phone or **Keyboard** on a computer (the swipe or the single keys; each only exists on one, so the
heading follows). Last, **This list · its name**, because those three rows belong to the list and travel with it:
Add from anywhere, Export & import, Templates. A line under them says which is which. No select, slider or field is
left on the hub; every row is a switch or a way in.

**Appearance is a page, and it is what ⋯ → Theme opens.** 1.12's ⋯ → Theme was two steps, Day and then Night, which
walked through both slots to change one. The page shows both at once: two tiles, each its theme in miniature — its
ground and glow, three lines in its colours, the middle one crossed off in its own ink, the name in its own face — the
one on now marked. A tile opens the picker for that slot, and Back comes back to the tiles. Under them, how the two
switch: By hand, With the system, On a schedule, as a small switch whose pill slides to the choice (a radio group to
a screen reader, arrow keys on a computer), with a note saying what that way does and whether a tap on the sun or moon
is holding an automation off; the times show only for a schedule. Then the designed pairs, one tap for both slots,
the change revealed from the pair that was tapped — the six that are light by day and dark by night, then the two that
are always dark, then a Secret or Extra pair on a device that holds its word, as the picker already does. Make your own
is the last row. Shift+T opens it too, and a page that has to reload itself on the way to ⋯ → Theme comes back to it
(§6's resume). The two-step flow and its state are gone.

**The picker groups themes by what they are.** It grouped by `lean`, "Made for day" and "Made for night", and so filed
Sunset and Cocoa — both dark — under day, because each is the day half of a dark pair. Those were the two in the wrong
spot. The groups are now Light and Dark, by base, with the slot's own kind first (a Day picker opens on Light, a Night
picker on Dark), and every swatch says what it pairs with instead of repeating its group. Only the web's grouping moved.
`lean` stays in the kit data, the fixture and the Swift kit table, because it still says which half of a pair is the
day one — the pairs above, the partner the picker offers, the Watch's order. The Watch's picker has no headings: it
lists the slot's eight by lean, then the other eight, so Sunset and Cocoa come early in its Day list and nothing there
calls them light. Changing that order is a Watch build, and is not in this one.

**Sound is one page.** The switch and the volume moved in with the packs, since they are one subject. The pack is per
slot, as 1.9 made it: a small switch for By day or At night (it opens on the slot that is on), the same note as before
saying what the slot's theme picks and what this device plays instead, and the packs as rows — Theme's pick naming its
pack, the twelve, and any unlocked by a word — that play as they are chosen. 1.9 did this with two selects.

**Add from anywhere is a page.** The URL and Copy one level down, with a row that opens How it works at the section that
sets one up. A View link's page says to open the Private link, and Copy is off, as the row was.

**Templates shows when a list has one.** 1.9 showed the row only on a list with no sections, because a section's ⋯
saves and inserts templates. But the row is the only place one can be deleted, so a list with sections had no way to
delete a template at all. It now shows on any list that has templates, too. Its own commit.

**A row lit under the finger.** The menu rows' fill was a plain `:hover`, which a touch screen leaves on whatever row
ends up under the last tap. The new pages open where the finger was, so Sound's Volume row arrived lit. The fill is now
for a pointer that can hover, and a finger has it while it presses. It predates the round — 1.9's Settings did the same
to Sound pack, which the before shots show — and it is its own commit.

**The keyboard keeps its place.** Choosing a pair or a pack repaints its rows, which dropped focus to the page; the row
that was chosen takes it back. The switch's pill follows its button's size rather than only the window's, so a theme
whose font arrives after the pill was measured does not leave it a few pixels off.

**Paths that had gone stale.** How it works, the gestures reference and About still sent people to Settings → Advanced,
→ Behavior and → Lists, none of which has existed since 1.9. They name the new places.

**What did not change.** No setting is stored differently: the device record has the same keys and values, so nothing
migrates, and an older build reading this device's settings finds what it wrote. `COMPATIBILITY.md` does not mention
Settings. The iPhone shell and the Watch read nothing from these screens. The version stays 1.12.

# 1.12 b315 decisions — the menu, round two

Price, after 314: "the landing looks a little cluttered now with the suggested themes. I like the idea of suggesting
pairs but putting all of them in that landing is a little cluttered… Make the menu amazing, the whole thing, and you
have freedom to fix whatever. But I want it incredible." So this round takes the whole menu — ⋯ and everything it
opens — to one design, and moves the pairs off the landing.

**The pairs, a page of their own.** Appearance is the two slots, the switch, and two rows: Theme pairs and Make your
own. The eight designed pairs (and a Secret or Extra pair where a device holds its word) are on the Theme pairs page,
one tap for both slots as before. The suggestion stays one row away instead of eight cards deep.

**Every page, one shape.** Fourteen panels are pages now (Settings, Appearance, Theme pairs, Add from anywhere, Sound,
Export & import, the picker, the builder, Share, Lists, a list's detail, History, How it works, Keys). A page has a bar
that keeps ‹ Back and × in reach while it scrolls, and its title large in the list's own face — Paper's serif, Terminal's
mono — so the menu reads like the list it belongs to. When the large title scrolls under the bar, the bar shows it
small. The large one is a copy the reader skips; the heading is still the h2, so every name and test that reads it
reads the same thing. Menus (⋯, a line's, a section's) are not pages and keep their shape.

**Rows on cards, explanations under the group.** A row is an icon on a tile tinted with the theme's accent, a name, what
is set, and a chevron or a switch; rows sit on cards, a hairline between them that starts where the words do. A
switch's explanation moved from under every row to one line under its group, and each switch it explains points at it
(`aria-describedby`), so a screen reader still hears it. The one warning that matters stayed on its row: Export &
import is "The only backup there is".

**Settings.** Appearance is the hero: both slots in miniature, their names, a chevron. Then Sound, then Screen, Other
devices, Gestures or Keyboard, and This list, as before.

**The ⋯ menu.** Four tiles for what is reached for most — Share, Theme (naming the theme that is on), Sound (filled and
naming its state; it still toggles in place, and shows the speaker muted when off) and Full screen, which a phone
without the API does not show — then the places as rows (Lists, Settings, How it works, About & privacy), then Delete
this list everywhere on a card of its own, and no empty card where it is hidden. Save your link, while the link is
unsaved, heads it all. On a computer the tiles carry their keys (M, F); in phone landscape they become one-line chips
and the rows two columns, so it is one glance, as 1.9 made it.

**The builder.** The theme first, as it will look; then Accent (the well, the hex, and a die for Surprise me), Base,
Fonts, Sound and Name as rows of one card; then Use for Day or Night as the one filled button, with Save to this list
and Make its partner beside each other under it; the code last, Import and Copy this theme's code together.

**Share, Lists, the rest.** Share's five blocks are cards, each headed by an icon and what it is for; the Private link
marked as shared keeps its warning, and its card is tinted toward danger. Lists is a card per list with its initial
on a tile (the current one filled), New list as a row, and Open a link as a field. A list's detail, Export & import and
Add from anywhere take the same rows and cards. How it works opens with its sections as chips.

**A swipe back from inside a page.** The left-edge swipe that goes back a level only worked when it began on the
backdrop: the page's scrolling body reset `touch-action` to auto, so the browser took a sideways touch that began
inside a sheet. The taller pages put the test's touch inside one, which is how it showed. The body says `pan-y` too
now; a volume drag still works. It predates the round and is its own commit.

**What did not change.** No setting is stored differently, no id a test or the shell reads went away (the new ones are
additions), and nothing in `apple/` changed but the stamp. `whatsnew.json` keeps its three 1.12 lines, which are still
true; the changelog's last paragraph now describes this menu.

# 1.12 b318 decisions — Scenes

Price, after 317: "I want to add ambient animations and background scenes to some of the themes. We can keep it gated
behind a setting for simple themes so they'll be fast-loading for people who aren't interested in the idle animations.
But my thought is to have a just absolutely stunning theme for people who want the stuff turned on. Like for forest I'm
picturing some sort of pixel art forest in the background with an idle animation paired to the theme… Make it elegant
and in the background like it should be (and is). For the idle animation: make a dynamic 15-second motion graphics
video that shows what an incredible motion designer you are." A prototype came first, as a page of its own (both
scenes, the loop and the finale, at phone and desktop sizes); his answer was "Love it. Incredible." This round builds
it into the app: Forest, and Harbor, its Day partner.

**A setting, off, and nothing paid for it on the page.** Scenes is a switch on Appearance, the first row of its lower
card, and it is this device's, like the other device settings: a phone can have it and a laptop not. Off is no key at
all, as on a new device. With it off the page never asks for any of it or runs a line of it: the stage (`scenes.js`), a
scene (`scene-forest.js`, `scene-harbor.js`) and the words' side (`scenes.css`) are asked for with the page's build
only when a scene goes up. The first paint carries one row of markup and the switch's wiring; `styles.css` is
untouched. The service worker precaches the four like every module — 16 KB, in the background, never on the first
paint — because COMPATIBILITY.md §6 asks it to, for a reason this app has more than most: a list left open all day
flips to Harbor at seven, and a page open across a deploy has to be answered from its own build's cache, not handed the
next build's scene. (The round's first cut left them out of the precache to keep "nothing extra loaded" literal; that
is not what "fast-loading for people who aren't interested" was about, and it would have cost the open page its scene.)
The picker marks the two kits that have a scene, and turning Scenes on while a theme without one is on says where one
shows.

**Where a scene lives, and how it draws.** In `#field`, the layer between the glow and the words that Superpink's
sparkles and the Extra grounds use; Forest and Harbor have no field of their own, so nothing competes for it. A scene
is a canvas about 190 pixels tall — five screen pixels to one on a 900-pixel desktop, four on a phone — scaled up
crisp, its still layers composited once and a moving layer redrawn only when what is in it moves. Two moods, as in the
prototype: while the list is in use, nearly still at 15 frames a second (stars, a firefly now and then, crests
breathing); left alone twenty seconds on Today, the fifteen-second loop at 30, beat by beat, easing back the moment
anything is touched. The finale has a moment of its own (Forest's fireflies swirl up to the moon, Harbor's gulls lift
off the pier). Reduced motion gets one still frame, and a hidden page nothing at all. Each scene hands the stage a
draw function and a layout; a new pair is a module each and its name in three lists (the stage's, app.js's, the
worker's).

**Two ways of asking for frames, each where it is cheaper.** The first build asked for a frame on every display
refresh and drew one in four (quiet) or one in two (the loop). The instrument (`tools/idle.mjs`, brought up to date
this round; it now reads every Chrome process as well as the renderer, because raster and compositing happen outside
it) showed that at 15 a second the refreshes cost more than the drawing. An A against B on the same build settled it:
quiet, a timer that wakes half a refresh before the next frame is due and asks for that one frame costs 1.6 % of a
core against 2.4 %; in the loop the refresh-by-refresh callback stays, 2.8 % against 4.1 % for the timer, whose
stopping and starting of Chrome's frame pipeline thirty times a second cost more than it saved. Harbor's crests and
glints and Forest's stars had each built a colour string per dot per frame (a few hundred); they set a colour once
and vary the alpha now. With both, Harbor's loop went from 5.8 % of a core to 2.9 %. The final numbers are in PLAN.md.

**The words stay on a quiet ground.** The grain rule holds a still ground to the kit's ink; a scene moves, so the rule
for it is measured instead, by a new instrument, `tools/contrast.mjs`: every piece of text on screen against the
pixels actually behind it, frame by frame, through the quiet mode, the whole loop and the finale, beside the same text
on the plain ground on the same clock. It counts a frame for a text only while that text is showing (the tools' own
idle fade and a line fading in are not being read), and it holds each text to its 1st percentile of pixels, so a
firefly passing under the edge of one letter is not a line nobody can read. What it found, and what answers each:

- The ground behind the list: the prototype's single wash of the kit's ink, an ellipse where the list sits, kept the
  big lines above 7:1. Kept.
- The bar along the top and the footer's row sit outside that ellipse, and on desktop the keyboard line fell to 3.5:1
  on Forest's grass. A band of the same ink along the top and a pool of it at the bottom's centre answer it; the
  corners keep the most picture.
- Harbor is a light kit whose small words (the date, the tabs, + New line, the keyboard line) are 4.6:1 on their own
  ground, so any picture under them at all costs AA. Its scene weighs its two bands (`wash`) nearly to the ink, like a
  morning haze at the top and a pale near sea, and the pills — the view tabs, the chips, + New line — carry the kit's
  own ground whenever a scene is up (`scenes.css`), so what is in them reads exactly as without one.
- The small loose words (the date, the count, the keyboard line, and the notes, captions and repeat marks that ride
  in a line) carry a soft halo of the ink. On the big lines a halo read as a smudge — a dark outline around every
  letter where the picture was lighter than the ink — so they have none.
- Today's lines sit on a pad of the ink at 45 %, soft-edged and always the size of the list (a background on the
  list's own container, so it grows and scrolls with it), which is what keeps a long list's last lines — down where the
  doe walks and the waves break — as quiet behind as its first. Harbor tried 70 % to win the last few hundredths on a
  repeat mark; on a desktop the pad is as wide as the page, and it read as a pale card across the lighthouse, so it
  went back to 45 %.
- The footer's pool is at least 360 pixels across, because a phone's footer row is as wide as the phone and the
  finale's line sits at its left end. It is computed in pixels by the stage: written as `max(70%, 360px)` inside the
  gradient, the parser refused the value, and a refused value drops the whole declaration — all three washes went at
  once, which only the instrument noticed. The suite now checks the three are there.
- Everything is a page of words from top to bottom, over every part of the picture, the moon included. There the scene
  steps back behind a veil of the ink and its loop waits for Today: half for Forest, and all the way for Harbor, whose
  small section words had no room for any picture at all — and a veil that covers the picture stops the drawing under
  it too, so Harbor costs nothing on Everything.

The finale is the one moment that dips: Forest's fireflies rise through the list on their way to the moon, for a
moment, over lines that are all crossed off. It is the moment Price approved in the prototype, and it stays.
The numbers, per text, phase and kit, are in PLAN.md.

**What did not change.** No stored setting moved and no id went away; `styles.css`, the first paint's stylesheet, is
byte for byte what it was. Nothing in `apple/` changed but the stamp: the app loads the live site, so the iPhone gets
Scenes with the deploy. `whatsnew.json` keeps its three 1.12 lines — the suite holds a version to three — so Scenes is
in the changelog, How it works and Appearance, and not on What's new; which line it should replace, if any, is
Price's call.

# 1.12 b321 decisions — Scenes for every theme, round one: Paper and Midnight

Price, after 320: "Let's do this for every theme now. First, create a plan for what each theme's idle scene will be,
then plan an accompanying dynamic 15-second motion graphics video… Use pixel art where it makes sense (but in other
themes, feel free to experiment with the art style where another makes sense for the theme). Give me a plan (not for my
approval, just so I can see the plan) and then let's start building." The plan: one art style per designed pair and
one pair per build — Paper/Midnight, Teletype/Terminal, Light/Dark, Sunset/Dusk, Arcade/Sketch, Blush/Pink, Cocoa/Ember
— each pair's world, loop and finale written out before the first one was drawn. This is the first.

**One town, two moods, one module.** Paper and Midnight are a designed pair, so they share a world: a pop-up paper town
— hills in layers, a river under an arched bridge, houses with red roofs, a windmill, lollipop trees — cream by day and
navy by night. One module (`scene-papercut.js`) draws both; the stage now tells a scene which kit it is drawing. Cut
paper: flat shapes in paper colours, each laying a soft shadow on the layer behind, a hairline catching the light along
each cut edge, a grain over all of it. The day's loop: a breeze through the trees and the windmill; a paper plane loops
the loop and leaves a dotted line; a house pops up out of the hill like a page turning, overshooting a little; a red kite
climbs, its bows following where it has been; kraft-paper birds cross as the sun's rays turn one notch (twelve rays, so a
notch looks like none when the loop comes round); the house folds away. Its finale: origami cranes in four papers fly up
past the sun. The night's loop: the windows light across the town and go out again; a paper train crosses the bridge, its
reflection wobbling in the river; a cloud on a wire slides over the moon and dims it; fireworks in the colours of glass,
Midnight's material, as streaks flying out in two rings; a star on a wire. Its finale: a fan of paper stars opens out of
the moon.

**The stage learns a smooth mode.** Forest and Harbor are pixel art: a canvas about 190 pixels tall, redrawn whole every
frame. Cut paper wants crisp edges and soft shadows at the screen's own density, so a scene can now name its `res`
(canvas pixels per CSS pixel, or "dpr", at most 2): it draws in CSS pixels, lays what never moves on a backdrop canvas
once, at layout, and each frame clears and redraws only what moves — the clouds on their threads, the sails, the trees,
the plane, the kite, the train, the fireworks. On a phone at twice the density it costs what pixel art does: Paper's loop
2.4 % of a core, Midnight's 3.0 %, Forest's 2.8 %. Canvas shadows are in device pixels whatever the transform, so every
blur and offset is scaled by the density by hand; unscaled, a phone's shadows came out half a desktop's.

**The words.** Paper is a light kit, weighed like Harbor (washes near the ink, the plain ground on Everything); Midnight
a dark one (half a veil). The instrument now takes any kit. The lines hold at 12:1 and better and the small words at or
above their plain values. It found three things. On a wide screen the town sat right under the list's last line, so the
land lies lower there. Midnight's finale fan flew up behind the count, which on a wide screen is plain text (on a phone
it sits on a pill), so there the fan opens right and down; the count went from 4.19 back to 9.26. And with seven lines, a
long list's small print sat over the town and dipped under 4.5 — Paper's caption 4.86 → 4.10, a note on the phone 6.03
→ 4.44 — so notes and captions now sit on a soft cloud of the ground whenever a scene is up, a shadow and not padding,
so nothing moves: 4.75 and 5.79. That reaches Forest and Harbor too, so it is a commit of its own.

**A frame lab.** Fourteen scenes are too many to judge in real time, fifteen seconds at a go. `tools/scene-lab.html`
mounts one through the real stage beside three sample lines in its kit's colours, and the stage's new
`seek(t, i, a, f)` holds any moment; `tools/scene-frames.mjs` tiles the quiet picture, the loop at the seconds asked for
and three points of the finale onto one sheet per kit and viewport. Every revision of this round was judged that way
first and in the app second.

**Copy, and the screenshots.** With four kits and more to come, the Appearance line, the toast and How it works say "the
themes tagged Scene", and the changelog names the town; each went through Price's voice. The round's screenshots are
JPEG from here: cut paper's grain is noise, and noise is 1.3 MB a frame as PNG against 150 KB.

**What did not change.** First paint (`index.html` +3 bytes gzipped, `app.js` +25; the ranges overlap); `styles.css`;
no stored setting; nothing in `apple/` but the stamp.

# 1.12 b324 decisions — Scenes for every theme, round two: Teletype and Terminal

The second pair of the plan in "1.12 b321 decisions". Teletype and Terminal are one design in two moods (the same mono
pair, the same blip), so, like Paper and Midnight, they share a world: a coast with two ranges of mountains, a sea, a
shore with a railway along it, and something round in the sky. Both are seeded alike, so the night's ridge is the day's.

**Two modules this time, because two media.** Paper and Midnight are one material lit two ways, so one module draws
both. Teletype and Terminal are two machines. Teletype (`scene-teletype.js`) types its coast: every mark is a character
in the kit's own mono face on green-bar continuous paper, tractor holes down both edges, and everything moves the way a
printer can—a character at a time, a cell at a time, the print head sliding along a row. Terminal (`scene-terminal.js`)
draws the same coast at night on a vector display in green phosphor: every line a bright core over a faint wide bloom,
and what moves leaves a trail. The day's loop: the head types a flight of gulls across the sky; a boat made of
characters sails the sea, typing its wake; the sun flares from o to @ as its rays turn round it a turn and a quarter,
retyped cell by cell, while its reflection is typed down the sea in green; a train chugs along the shore puffing o O (
); a cloud decodes into noise and settles; the head backs over the gulls and erases them. Its finale: the head types a
row of stars along the shore and each pops up and falls like chad from a tape. The night's loop: a scan beam sweeps the
ridge and it burns brighter where it has passed; a ship banks round the planet; the rings tilt and a moon comes round;
an oscilloscope blooms on the horizon, its figure turning through its ratios down to a dot; the stars stretch into warp
lines toward the planet as the grid races, and snap back in a flash. Its finale: fireworks in the sky, the last one
behind the planet, and a shock ring running out across the grid.

**Around the words, not through them.** Round one's rule, that the busy parts live around the list, held here, and the
first drafts broke it. Terminal's oscilloscope and its finale's firework both sat on the list's last line, and the warp
streaked stars through the words. Now the oscilloscope sits on the horizon under the list (with a graticule, so it reads
as a screen); the warp streaks only above the list's band and stops at its edge; the fireworks go off in the band above
the list; and the ring runs out across the grid below it. On a wide screen the horizon sits a little lower and the ridge
a little flatter, so it clears the last line. Teletype counts its rows up from the foot of the page, so its shore and
its train clear the pool of ground the footer's small words sit in.

**Teletype had to be legible as a picture.** The first draft typed in 11-pixel characters at weight 500, most at half
strength, and under a light kit's washes it read as a faint texture, not a coast. Now 12.5 pixels on a phone and 15 on a
wide screen, at 600 in IBM Plex Mono (the kit's own UI face, already loaded), the ridge at full strength, the faces
turned from the sun shaded denser, a second, fainter range behind the first, the sea thicker toward you, and the sun a
ring of rays round a body. Its first flare changed every ray's character in place, the old spinner trick, and a ring of
`|` or `-` all at once read as scattered marks, not a sun; the rays now move round, each keeping the character for its
own direction. Each glyph is drawn once, at the screen's density, and stamped per cell, never set as text per frame; a
cell that changes is laid over with its own paper first (a green bar or plain), so the backdrop's character under it
goes. The face may still be loading the first time the scene lays out, so it lays out again when the face arrives.

**What never moves is typed in the kit's dim.** In the text's own near-black, the landscape cost the long list's quieter
marks: a struck line fell to 3.1 (Paper's is 3.5), and the ↻ beside a line to 3.4, where every other kit holds 4.2 or
better. What never moves is now typed in the kit's dim (#4B6753)—a ribbon wearing thin—and whatever is being typed right
now is fresh and black, which also makes it the thing you look at. The struck line came back to 3.6–3.9 and the ↻ to 3.8
on a wide screen. On a phone a ↻ in the long list's fourth line sits in the sea's rows, and when the boat's mast passes
behind it the one frame that catches it reads 3.6 (another run, 5.2). The ↻ is small print riding in a line, like a note
or a caption, and those sit on a soft cloud of the ground; the ↻ doesn't. It will, but that reaches every kit with a
scene on screens that already have Scenes on, so it goes out on its own build, right after this one.

**What it costs.** First measured, the loops on a wide screen ran at 4.0 % (Teletype) and 4.4 % (Terminal) of a core,
half again round one's 2.7–2.8 %. Neither needed a new frame rate. Terminal was drawing a whole ridge as ninety separate
strokes every frame, plus the far ridge, the grid's rails and the planet's rim, none of which move; they now lie on the
backdrop, drawn once, and the moving canvas has only what changes (the beam's burn and the finale's flare lie over the
ridge while they last). Teletype was typing three clouds and its sun glyph by glyph every frame; a picture of cells that
holds still for seconds is now typed once into its own canvas and stamped whole, and the sea turns over a quarter of the
cells it did, which is calmer too. After: the loops 2.7 % and 3.0 %, in use 1.9 % and 2.3 %; on a phone 2.6 % and 2.7 %.

**The words.** Teletype is a light kit, weighed like Paper (washes near the ink, the plain ground on Everything);
Terminal a dark one, at the defaults (half a veil). The lines hold at 10.3 and better (Teletype's long list left alone,
over the mountains; round one's floor was Midnight's 8.9), and the small words at their plain values, give or take the
keyboard line over Terminal's grid (7.08 → 6.38). The finale's line on a phone dips from 13.4 to 6.8 as the fireworks go
off behind it, and stays far above the floor.

**What did not change.** First paint (`app.js` +13 bytes gzipped, `index.html` +0); `styles.css`; `scenes.css`; the
stage but for two names in its map; no stored setting; nothing in `apple/` but the stamp.

# 1.12 b326 decisions — The repeat mark on the soft cloud

Round two left one thing for its own build. Over a long list the ↻ beside a line is small print, like a note or a
caption, and those have sat on a soft cloud of the ground whenever a scene is up since round one; the ↻ had only the
halo. In Teletype's scene that was not enough: 3.8 on a wide screen over the typed ridge, and 3.6 on a phone on the frame
where the boat's mast passed behind it. Now it sits on the same cloud (`scenes.css`, one selector). A shadow, not
padding, so nothing moves; over the plain ground it is invisible.

**On its own build.** It changes how every kit with a scene draws a list that has a repeating line, on screens that
already have Scenes on, with nothing done on them, so it ships alone, after the round it came out of: if someone says
their list looks different, it is this one commit.

**What it did.** The ↻ over the long list, left alone, on a wide screen: Forest 5.28 → 5.78, Harbor 4.24 → 4.37 (its
plain ground is 4.51), Paper 4.81 → 4.98, Midnight 5.19 → 5.71, Teletype 3.76 → 4.87, Terminal 5.71 → 6.06; on a phone
Forest 4.60 → 5.64, Harbor 4.44 → 4.54, Paper 4.51 → 4.82, Midnight 5.74 → 6.00, Teletype 3.62–5.15 → 5.05, Terminal
6.29 → 6.78. Notes and captions unchanged. `scenes.css` +17 bytes gzipped; nothing on the first-paint path.

# 1.12 b328 decisions — Scenes for every theme, round three: Light and Dark

The plan had one room for the pair: a window's light on a wall, sun and leaves by day, headlights and rain by night. It
was built and looked at, and Price, from the screenshots: "I don't like what you've done for light/dark. Light in
particular looks like trash… Remember, make a dynamic motion graphics animation that shows what an incredible motion
designer you are… go all out." Then the direction: "since they are just generic light/dark, a throbber-type animation or
something would work fine. But extremely high quality… for the idle maybe just a fascinating shape (or morphing series
of spheres or something) that is easy to look at for hours… Run with that and make something just show-stopping
amazing."

**What was dropped, and why.** The room was ambience, not motion design: a pale patch on a pale wall, muddy under a
light kit's washes, most of its events too small to see. The first answer to the new brief, a string of ninety beads in
three dimensions flowing between knots, was elegant and read as a necklace, or a molecular model. Both stayed out.

**A throbber in liquid.** `scene-orbit.js`, one module for the pair. Ten glossy drops on a ring, a pulse running round
them the way a loader's comet does; the swollen drops at its head melt into their neighbours as it passes. Left alone,
the drops pour together into one trembling blob, pinch into three lobes that turn, run out along a figure of eight
(merging where it crosses), string out into a wave that ripples through them in three dimensions, and flow back into the
ring. The finale: everything pools into one drop, which splashes, and the ring re-forms out of the splash. Light's
liquid is an orange glaze with a soft shadow; Dark's is molten amber, glowing. The drops are metaballs: their summed
field is found on a grid each frame, the level where it is 1 traced by marching squares, smoothed, and drawn as a vector
outline, so the edge is crisp at any density; the light comes off the outline itself (bright just inside where it faces
the upper left, shaded where it faces away, a sheen in each body and one glint where it faces the light most), so a
merged blob has one glint, not one per drop. Each drop chases its place on a spring, a little under-damped, so the
liquid wobbles as it merges and parts.

**It keeps to the empty part of the page.** The pad under the list and the wash over its band are there to quiet a
picture behind the words; they dimmed a single bright object beside them to peach, and Dark's amber to mud. So the stage
learned to say where the words are: a scene with `words(rects)` is told each line's text and its tools, the pills, the
date, the count, the keyboard line and the finale's words, measured again (once a frame at most) whenever the page's
words change, move or scroll. The liquid settles in the largest circle of empty page, as big as it allows, and glides
there, resizing, as the list changes — beside short lines on a wide screen, under a short list on a phone, beside "+ New
line" under a long one. A scene that declares `clear` keeps out of the words' way, so for it the stage drops the pad and
the list's wash. The suite now checks it: no pad, and clear of every line before and after a long line is added.
Everything it draws, the pool of shadow or light under it, the glow and the splash, fits inside that circle. A row that
is hovered or focused lights its whole width and covers part of it for the moment; that is how the page is layered, and
it is left so.

**The words.** Every line reads exactly as on the plain ground, in every configuration, on both viewports: the seed
lines, the long list and Everything. The small words and a long list's small print are at or above their plain values.
One reading dips: on a wide screen, Light's finale line "That's the list." is 4.23 with the liquid and 4.47–4.84
without, across runs. The settled finale is pixel for pixel the same with the scene and without, where that line is; the
with-scene value never moves while the plain one swings, so it is the finale's entrance sampled at different moments,
not the liquid.

**What it costs.** First measured, the loop took 5.9–6.0 % of a core on a wide screen. A canvas shadow blur for the
liquid's shadow and glow went (a soft sprite under each drop makes the same thing), the field is summed only where each
drop reaches (a kernel that falls to nothing, so no seam), and the grid it is traced on is as coarse as keeps a drop
round: the loop now 4.4–4.8 %, in use 3.1–3.2 %, on a phone 4.2 %. That is half again the other scenes, the price of a
surface found anew every frame, and the loop plays only when nothing is being touched. A profile of the page puts its
own script at about 1.5 % of that; the rest is drawing.

**Two traps.** `node --check` on these `.js` modules (no package.json, so no "type": "module") passes a real syntax
error; a module that fails to parse fails silently in the app, the scene simply never laying out. Every module is now
checked as an `.mjs` copy. And a `//` comment put in the middle of one of these one-line loops swallows the rest of the
line; it did, twice. The b318 test's "a theme without one" was Light, and Light has one now: it takes the first light
kit still without a scene, and will want a theme you make when there are none.

**What did not change.** First paint (`app.js` +5 bytes gzipped, `index.html`, `styles.css` unchanged); no stored
setting; the other scenes (the stage's new hooks do nothing for a scene without them); nothing in `apple/` but the
stamp.

# 1.12 b330 decisions — Scenes for every theme, round four: Sunset and Dusk

**One bay, redrawn to the bar Light and Dark set.** The parked module had the plan's picture (a retro-poster bay, a
striped sun by day, lanterns at blue hour) and none of its force: in the app the sun was a dim disc with no stripes to
see, the lanterns flat beige shapes, the moon a ring, the whole of it muddy under the washes. `scene-bay.js` is
rewritten for both kits. Sunset: a sky in one long gradient from plum to gold with a band of halftone where it turns, a
huge sun with slits sliding down through it, glowing, with rays turning slowly round it, its reflection a column of
shimmering bars; headlands with their rims lit, palms with leaflets. The loop: the slits quicken and the horizon
shimmers; a flock crosses the sun; a bank of stratus (strips stacked like a poster's) slides over it and its underside
catches fire; a sailboat crosses the reflection; a flare streaks across as the palms toss. The finale: crisp fireworks —
bright streaks with hot heads and a flash where each bursts — and the same, dimmer, in the water. Dusk: the same bay at
blue hour, a crescent moon (cut clean out of its disc; the first one's even-odd fill left a second sliver, and read as a
ring) and its silver path, and paper sky lanterns lit from inside, rising and swaying, each with its light in the water
under it. The loop: the stars prick in; one lantern goes up from the beach; the whole shore lets theirs go; an egret
lifts off the shallows and its rings spread; a star falls. The finale: the whole festival goes up at once.

**The pad hugs the lines.** Vivid was the easy half. The first vivid version failed the words: lines from 12–14:1 down
to 4–6, a struck line to 1.5, Dusk's count under a lantern to 3.5. The pad under the list, the full width of the page,
was what had kept the old version legible and what had made it muddy. So the stage learned `hug`: for a scene that asks,
the pad under the list gives way to a soft pad under each line's words (the kit's ground at 72 %, blurred, measured with
the same hook that tells the liquid where the words are, and moved when they move), and the rest of the picture keeps
its colour. A new test checks there is one over each line's words, before and after a line is added.

**And bright things keep out of the words.** The bay takes the words too. The sun slides along the horizon clear of the
lines' ends (and ignores a row's small tools, which are hidden until you point at the row; counting them pushed the sun
off the screen); the fireworks go off in the four points of sky furthest from any word, the header and each other, and a
spark over a word is left out; the lanterns fade as their glow nears a word and are gone before the header; the egret,
the twinkling stars and the falling star fade the same way. On Everything, a dense list, the picture gets more veil
(.66). After: the lines hold at 7.1 and better (Sunset's long list on a phone) and at 10 and better for Dusk; a struck
line 4.4 and better; the header's small words at or above their plain values; a long list's small print at 4.7 and
better.

**What it costs.** The loop 3.1 % (Sunset) and 3.5 % (Dusk) of a core on a wide screen, in use 2.2 %, on a phone 3.1 %
and 3.5 %: in line with the rounds before the liquid.

**What did not change.** First paint (`app.js` +12 bytes gzipped, `index.html`, `styles.css` unchanged); no stored
setting; the other scenes (the stage's `hug` does nothing for a scene without it); nothing in `apple/` but the stamp.


# 1.12 b332 decisions — Scenes for every theme, round five: Arcade and Sketch

**Both parked modules fell below the bar, and both were redrawn.** The plan had a pixel attract mode for Arcade and a
pencil page with line boil for Sketch, and the modules written for it did those things; in the app, Arcade was a dim
strip of city along the floor with a hero six pixels tall, and Sketch was thin grey doodles spread thin across the page
— pale the way the first Light was. After "Light in particular looks like trash", neither was put in front of Price.

**Arcade: an attract mode worth watching.** `scene-arcade.js` draws into a pixel buffer a sixth of the screen's size (a
fifth on a phone) and scales it up crisp; the bloom is the same buffer drawn small twice and stretched back over it; CRT
scanlines lie under every row of the game's pixels; the sky is dithered in bands. A city in two layers of parallax, lit
windows flickering, antenna lights, a vertical ARCADE sign; a big pixel moon on the backdrop, out of the bloom so its
craters stay. The hero — a helmet with a visor, a magenta scarf, yellow boots — waits, breathing and blinking, its
antenna light pulsing. The loop: READY?; it crouches and springs off at GO! (a glitch across the frame); it jumps
through an arc of coins placed on the arc itself, heads a block and a coin spins out, stomps a slime flat and bounces
high off it; a star bounces in and it flashes through the colours with afterimages and speed lines; WARNING; a saucer
drops in with its eye on the hero; it jumps three shots and answers each with a laser, the health bar going down in
thirds; the saucer bursts in a shockwave of pixels (+5000); HIGH SCORE!, the score rolling up on the bricks. The finale:
LEVEL CLEAR drops in letter by letter in a marquee under fireworks in pixels, and the hero jumps with a trophy. Every
beat is a function of the loop's time; the world's scroll is a table over it, normalised so the loop covers a distance
that is a multiple of every layer's period, so the loop wraps without a seam, and a loop cut short keeps the city where
it stopped.

**Sketch: the drawing that draws itself.** `scene-sketch.js` keeps to the empty part of the page, like Light's liquid: a
hot-air balloon in pencil and watercolour in a round vignette of pale sky, with two clouds, three birds and a few
splatters. It floats while the list is in use, its lines boiling a little. The loop: an eraser scrubs it out, crumbs
falling, a ghost of it left on the paper; the pencil draws it again — a light guide, the envelope in one line, the seams
in perspective, the ropes, the basket's weave, the shading hatched down one side, the clouds, the birds — each line
tapering where it starts and ends, with graphite's second, fainter line beside it; the brush floods the sky in, then
each gore, the wet front spreading from where it touched, the paint darker while wet and lighter as it dries, flicking
drops off as it goes; the burner roars, the balloon lifts and the birds wheel; it settles. The finale: a burst of colour
thrown round it, the flame roaring as it rises, gold stars sketched in. The watercolour is drawn once per size: a wash
with its edge darker where the pigment dried, granulation, a bloom where water crept back, its edge a little off the
pencil line.

**The words.** Arcade is a dark kit, and a vivid one behind the words: at first the lines held, but the small words
dipped as speed lines crossed the header, the WARNING frame's top edge glowed by it and the white flashes (the star, the
burst, LEVEL CLEAR) washed the page; and on a phone the app's own finale line, "Level clear.", sat on the glowing floor
at 3.4. So the flashes are about a third as strong, the frame has no top edge, speed lines skip the words, the neon
floor dims under words that sit right on it, and the stage learned two things a scene may ask for: `hug` as a number
(how dark the pad under each line is; Arcade's is .86) and `hugFinale` (the finale's words get a pad too). And the stage
now tells a scene which of the rects it measures are a line's words, so Arcade cuts its own moving picture back under
them before it composites — the backdrop's dark sky is what's behind the lines, and the bloom goes with it. After: the
lines read better than on the plain ground (15.3 → 16.1–16.6 in the seed lines, 15.3–16.8 in the long list), the small
words at or above plain, the struck lines 4.8–5.2 (plain 4.5–5.2), the finale's line 7.2–7.6.

**A bug the instrument found.** One reading made no sense: in the long list the city vanished from the right-hand side
of the screen, where there are no words at all. A probe of the scene's own pixels over the loop found it drawn at 2–10 %
with the long list and 88–96 % with the seed lines. The helper that draws a single pixel set the buffer's alpha and left
it there, and the city is drawn straight after the stars: with the long list the last star lay behind a word, dimmed to
near nothing, and the whole city inherited it. The helper puts the alpha back now; the city is drawn at 92–97 %
throughout.

**Sketch keeps clear, and when there's no room it goes.** Its words are all at or above their plain values (the lines
12.5–12.9 against 12.6–12.8) but one: on a phone, where the balloon sits under the list, the pencil and the brush
reached up into it (12.7 → 8.2); they're now held from the side away from the words. The suite's keep-clear test,
extended to the balloon, found that after a long fourth line there was no circle as big as its minimum and it
overlapped; it now shrinks to 36 px (30 on a phone) and fades away when even that won't fit, until there's room again.

**What it costs.** Arcade's loop first measured 7.4 % of a core on a wide screen: every star was drawn pixel by pixel
each frame, and every pixel of the score twice, for its shadow. Now the stars are two layers drawn once and scrolled, a
sixth of them twinkling live, and each string of text is drawn once and kept: 4.2 %, in use 2.3 %, on a phone 3.9 %.
Sketch: 4.6 %, in use 2.8 %, on a phone 4.7 % — the liquid's range, the price of a line that boils and a wash that
floods.

**One more trap, caught.** A `//` comment added mid-line in the stage swallowed the rest of its line again; the module
check as `.mjs` caught it before anything ran.

**What did not change.** First paint (`app.js` +8 bytes gzipped; `index.html`, `styles.css` unchanged); no stored
setting; the other scenes (the stage's new options do nothing for a scene that doesn't ask, and the fifth number in each
rect is ignored by the ones that don't read it); nothing in `apple/` but the stamp.


# 1.12 b334 decisions — Scenes for every theme, round six: Blush and Pink

**The fairground went, for a heart.** The plan had a clay pastel fairground by day and a neon carnival by night, and the
parked module drew it: in the app Blush was a pale pink wash with a faint Ferris wheel, a box for a booth and a hot-air
balloon (Sketch's, the round before), and bunting strung right across the header's small words; Pink was a ring of dim
bulbs in the dark. Both were redrawn around one subject the two kits share — a candy heart — in `scene-heart.js`, which
keeps to the largest open space on the page like the liquid and the balloon.

**Blush, by day: a gummy heart.** Glossy, lit from the upper left: a gradient through the jelly, the rim darker, a
bounce of light along the lower right, a broad glint on the left lobe and a small one on the right, a soft shadow on the
page that shrinks as it rises. Gumballs and candy sprinkles orbit it in depth, behind it and in front. The loop: it
crouches, hops, flips over in the air (its back a darker, flatter pink) and lands with a wobble that dies away; a ribbon
swirls in and winds round it, twisting as it goes, and flies off; the gumballs close into a halo, the heart swells and
pops into sprinkles that swirl and settle back into its shape before the gloss comes back; it beats twice. The finale: a
fountain of small hearts.

**Pink, by night: the same heart in neon.** A brick wall, dark plum, uneven, lit by nothing but the sign. Each tube is
drawn the way neon looks: the dark glass always there, and when lit a wide faint bloom, a narrower one, the tube's
colour and a near-white core; the sign's glow falls on the bricks. An arrow in gold through the heart, sparkles round
it. The loop: the power cuts; the heart relights a stretch at a time from one electrode, stuttering, then the arrow,
whose chase lights run along it, then the sparkles one by one; it beats twice, twice; small neon hearts float up; its
colour cycles. The finale: neon hearts burst round it like fireworks.

**The words.** Both keep to the empty page; Pink's wall is behind the words and its lines sit on pads (.72). Every
reading is at or above its plain value, in the seed lines, the long list and Everything, on both viewports — the lines
13.1–14.0 plain, 14.8–16.2 over the scenes — but one: Blush's footer hint in the long list, left alone, 5.85 → 5.04,
which follows the app's own idle fade. The cleanest round of the seven.

**What it costs.** The cheapest pair yet: the loop 2.6 % (Blush) and 2.9 % (Pink) of a core on a wide screen, in use 2.0
% and 2.2 %, on a phone 2.5 % and 3.1 %.

**Blush and Pink were the last light kits without a scene.** The b318 test's "a theme without one takes it down" now
takes the first kit still without a scene from Cocoa and Ember, in the picker's dark group; after the last round it will
want a theme you make.

**What did not change.** First paint (`app.js` +9 bytes gzipped; `index.html`, `styles.css` unchanged); no stored
setting; the other scenes; the stage but for two names in its map; nothing in `apple/` but the stamp.

# 1.12 b336 decisions — Scenes for every theme, round seven: Cocoa and Ember

**Both were redrawn before Price saw them.** The first cut of Ember was a small fire low in its circle under a sky all
but black — the quiet the Light round was sent back for — and Cocoa, a cup on walnut planks, read but was the quiet one
beside anything vivid. So Ember went out under the Milky Way, and Cocoa got a morning's light through a window.

**Cocoa: latte art in the morning light.** `scene-cocoa.js` keeps to the largest open space on the page, like the
liquid, the balloon and the heart. A café table of dark walnut planks seen from above, and on it a cup of cocoa on its
saucer, a spoon, a few beans. The window's light falls across the table in four soft panes; the leaves outside move
their shadows through it, dust drifts in it, and the cup's shadow lies in it. The latte art is a stacked heart: four
pours, a line of crema between each and the next, the foam lighter in the middle. The loop: the spoon stirs the old
pattern away into a swirl; a new pour blooms, rings pushed into rings, and the pull-through turns them into a heart;
three marshmallows drop in, bob, drift round and melt; a cloud goes over and the light dims and comes back; cinnamon
dusts the top; the steam curls up, soft, fading as it rises. The finale: small foam hearts bloom round the big one and
the steam rises in a heart.

**Ember: a campfire under the Milky Way.** `scene-ember.js`. The sky goes from deep blue overhead to wine at the
treeline; the Milky Way rises out of the trees across it — clouds of light brightest low down, a dark rift wandering up
its middle, its stars thick along it — with a crescent moon in a halo, a hazed ridge and two lines of pines, the near
one taller toward the edges. The fire keeps to the largest open space where it can stand on the ground, below the
treeline and never in the sky: logs in a ring of stones, two crossed behind the flame and one across its foot, their
char cracked into glowing blocks; a bed of embers; and the flame in four layers of tongues — deep red, orange, yellow, a
near-white core — each swaying on its own time, the inner ones a beat behind, licks breaking off the tops, sparks rising
in spirals high into the night. Its light falls on the trees and in a pool on the ground, flickering, and stops at the
ground beyond the pool. The stars twinkle. The loop: it roars up; a log settles with a burst of sparks; a gust leans the
flames over and streams the sparks sideways; a star falls; it pulses on a beat, three and rest, twice (the kit's sound
is bongos), its light on the trees pulsing with it; it sinks to its coals, smoking; it catches again with a whoosh. The
finale: a column of sparks goes up, opens, and hangs in the sky as stars, twinkling, before it fades.

**The words.** Cocoa's planks and Ember's sky are both brighter than their kits' inks, so each scene puts its own
picture in shadow where the words are, on its own canvas and under the stage's pads: under every line, and in Ember
under the small words too. The bar along the top and the keyboard line keep to Cocoa's ink, the window's light stays out
of them, and the planks came down a shade so Everything's section names held. Ember's firelight stops at the ground
beyond its pool, so the finale's words at the foot keep their ground. Every reading is at or above its plain value, in
the seed lines, the long list and Everything, on both viewports, but for three things. Two are not the picture: Cocoa's
keyboard line, 6.12 → 6.05 (and by as much in the finale and left alone), over pixels identical to the plain ground's
(the ink, 42,31,26), with Ember's struck line in a phone's long list, 6.30 → 6.28, inside the instrument's noise; and a
few finale rows, where the instrument caught the words fading in at a different alpha in each run — frame by frame,
settled, they match (6.03 and 6.03, 7.61 and 7.61), and at the same alpha the scene's is the higher (4.44 against 4.39).
The third is the picture: Ember's section names in Everything, 6.30 → 6.21 on a wide screen and 6.22 → 6.01 on a phone,
where the fire finds room beside "Calls" and its light reaches the name. The fix is in the stage, not the scene (below),
and it ships alone.

**The stage.** The fifth element of each rect the stage measures now says 2 for a line's tools, which are there only
when the line is hovered: Ember's shade under the small words skips them — under nothing it was a dark box beside every
row — and Arcade and Cocoa, which read the flag as "a line's words" or not, now read `kind === 1`, so nothing changes
for them. A section's name and count in Everything are not among the words the stage measures, so a scene keeping clear
doesn't know they are there. Measuring them lifts Ember's section names to 6.56 and 6.54; but it moves where the liquid,
the balloon and the heart settle in Everything, and what Arcade cuts back there, so it goes out on a build of its own
after this one — with a fix for Arcade, whose section names in Everything read 5.18 → 2.57 on a phone in the live build,
335 (the instrument found it while checking this round; the stage change alone brings it to 3.41).

**What it costs.** Cocoa's loop 3.5 % of a core on a wide screen, in use 2.4 %, on a phone 3.5 %; Ember's 3.8 %, 2.5 %
and 4.1 %. Ember's loop first measured 4.7 %: every stone of the ring built a gradient each frame and every ember a
colour string. Both are sprites now, drawn once — a stone dark, and a stone lit laid over it as the fire flares — which
took a fifth of a point off in back-to-back runs. Those first runs, and one of Cocoa's at 4.3 %, were taken while
another program held a core of the machine (a load of 14); the numbers above are from a quiet one.

**Every curated kit has a scene now.** The b318 test's theme without one is a theme you make (Make your own, an accent,
Light, Use for Day), and the picker is checked for a kit without the tag: none. The keep-clear test takes Cocoa's cup
and Ember's fire, and, in a commit of its own, Blush's and Pink's heart, which b334 had missed.

**What did not change.** First paint; no stored setting; the other scenes; nothing in `apple/` but the stamp.

# 1.12 b339 decisions — Scenes: a section's name reads like a line

**What the instrument found.** Checking round seven, `tools/contrast.mjs` over Everything (the long-time fixture) found
section names reading under their plain value over three scenes in the live build: Arcade's on a phone at 2.57 against
5.18 — under 4.5 — with the city and its stars coming through behind "Unsorted" and "Calls"; Dusk's caret at 4.85
against 6.65 on a wide screen; Ember's names at 6.01 against 6.22 on a phone, where the fire found room beside "Calls".

**The cause was the stage's.** The stage tells a scene where the words are, so it can keep clear of them, lay a pad
under them or cut its picture back under them. It measured a line's words and tools, the pills, the date, the count, the
keyboard line and the finale's words — not a section's name or count, which only Everything has. No scene knew the
headings were there.

**The fix.** The stage measures a section's name and count and treats them as it treats a line's words (the rect's fifth
element is 1): the scenes with pads lay one under each (Dusk, Pink, Arcade, Cocoa, Ember), Arcade cuts its moving
picture back under them as it does under a line, Ember and Cocoa put their picture in shadow there, and the scenes that
keep clear settle clear of them (the liquid, the balloon, the heart, the cup, the fire). No scene's code changed.

**Tried first, and dropped.** Measured as small words (0), they brought Arcade's phone reading only to 3.41, because
Arcade cuts back less under small words. Cutting back all the way under every small word brought it to 5.37, but cut
dark boxes out of the brick floor under the keyboard line and out of the city round "+ New line", in Today. Read as a
line, a section's name gets what the lines get, in Everything only; Today has no sections and is untouched.

**After.** Arcade's section names 2.57 → 5.67 on a phone and 5.02 → 5.72 on a wide screen (plain 5.18), their counts
5.37 → 9.15; Dusk's caret 4.85 → 6.32 and its names 5.37 → 6.51 on a wide screen, 5.50 → 6.55 and 6.61 on a phone;
Ember's 6.01 → 6.52; Pink's 5.77–5.82 → 5.73–5.75 (plain 4.95–5.03: the pad is the ink, and the wall behind is darker in
places); Cocoa and Dark within a few hundredths of where they were; the lines in Everything unchanged. Dusk's caret and
name on a wide screen still sit a little under plain (6.32 and 6.51 against 6.65 and 6.64). Midnight's, Terminal's and
Forest's section names read under plain too (Midnight's caret 5.08 against 6.04 at worst), unchanged by this: those
scenes don't ask where the words are. That's for another build.

**Why it ships alone.** It changes what several scenes look like in Everything — where the liquid, the balloon, the
heart, the cup and the fire settle, and a pad under each heading — on screens that asked for nothing new. So it goes out
on a build of its own, after round seven.

**The test.** New: with the long-time fixture in Everything, Dusk lays a pad under each section's name and count on
screen. It fails on 338 (four on screen, none padded) and passes here.

**What did not change.** Today; any scene's code; first paint; no stored setting; nothing in `apple/` but the stamp.

# 1.12 b341 decisions — Scenes for every theme: the last word

**Every built-in theme has a scene, so the copy says so.** "The themes tagged Scene" was right while the rounds were
under way; after 338 it describes all sixteen. Appearance's row reads "A moving picture behind every built-in theme",
How it works says the same, and the changelog opens "every built-in theme gets a moving picture behind the list". The
toast shows only when Scenes are turned on under a theme with none — now only a theme you make — and says "Scenes are
on. Every built-in theme has one." All four went through Price's voice and came back as drafted.

**The tags stay.** The picker's Scene tag now sits on every built-in swatch, and no theme you make carries one. Whether
it still earns its place is Price's call; nothing here removes it.

**The whole suite, at the end of the rounds.** The browser suite ran in full on this change, in four slices, both
viewports: 228 passed, none failed. The Node suites passed.

**What did not change.** Anything but the four strings and the two tests that read them; nothing in `apple/` but the
stamp.

# 1.12 b343 decisions — Scenes, polished: Paper and Midnight

**What Price asked for.** He loves the papercraft; a few things that move when the list is left alone vanished before
they were off the page (Midnight's train and its shooting star), a couple of moments were janky, and by day the kite
just appeared and flew. He suggested a train going by in place of the pop-up house.

**By day.** The pop-up house is gone. A red steam engine and three cream cars run the viaduct right to left, from past
the right edge to past the left, puffing steam in paper puffs that start at the chimney, swell as they rise and thin
away; the near bank's trees stand in front of it. The kite lies on the near bank, tied to its peg, its bows along the
grass, until the wind lifts it; it climbs, flies a while and comes down to rest, and if the list is touched mid-flight
it settles. It flies no higher than clears the lines, looking above and below where it likes to fly for the nearest
clear height; with no clear sky it stays on the bank. Its string goes behind the words. The paper birds cross from past
the right edge to past the left.

**By night.** The train comes on from past one edge and goes all the way off the other; it had vanished with its last
cars still on the page. The viaduct now spans the river from edge to edge, so both trains run on it (the night train
had run on past the bridge's end over water). The cloud is let down across the moon on its thread and taken up again.
The star on its wire starts below the bar along the top, which it had crossed (the date read 6.12 → 3.11 as it went
over); its tail is a fixed length behind it, so it goes off the edge with it rather than vanishing mid-page, and it
fades behind the words. The fireworks' rockets fade in.

**The words.** In a long list the last lines lie over the town, where the trains now run: the train behind a crossed-off
line took it to 2.95 against 5.08 plain on a phone. So each line sits on a pad of the ground (`hug`, .82) in place of
the pad across the list, and a train dims to under half where it passes behind a line, as if under vellum; clear of
the words, the picture keeps its colour. It also lays a pad under each section's name in Everything on Midnight, the
leftover from b339.

**What it costs.** Measured back to back with the live build, 342, on the same machine, with another program holding a
core of it throughout (a load of 3.4–5, so the numbers read high; the difference is what counts): Paper's loop 2.49 →
2.94 % of a core (every Chrome process 13.18 → 13.38 %), in use 2.55 → 2.83 %, on a phone 2.62 → 2.91 %; Midnight's
2.88 → 2.96 %, 2.70 → 2.75 % and 3.04 → 3.03 %. The day's train, its steam and the kite are what Paper adds.

**Contrast.** Every reading at or above the live build's, but for the tools in the app's own idle fade, whose plain
readings swing as far (±0.4): Midnight's pills and keyboard line on a wide screen left alone, 5.92–8.46 plain against
5.74–7.90 (in use they read 6.31 and 8.71, as they did). In a long list, a crossed-off line over the town reads 2.49 →
5.60 on Midnight's wide screen and 2.53 → 5.58 on its phone (plain 6.15 and 6.08), and 3.50 → 4.37 and 4.32 → 4.49 on
Paper's (plain 5.12 and 5.08); Paper's small print there 4.02 → 4.63 and 3.97 → 4.65; the lines themselves 11.93 →
14.03 on Paper's wide screen and 6.42 → 11.62 on Midnight's phone. Midnight's section names in Everything: the caret
5.08 → 6.03 against 6.04 plain, the name 5.50 → 6.19 against 6.03 (before the pads, as b339 found them).

**What did not change.** The sun, the paper plane and the rest of the day's loop; the finales; first paint; no stored
setting; nothing in `apple/` but the stamp.
