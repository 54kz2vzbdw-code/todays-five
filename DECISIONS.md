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
