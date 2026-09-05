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

## The first minute

- **The welcome is the Today renderer with a local document.** `showWelcome` sets `doc` to `seedDoc("")` (no id, no secret), flags `demo`, shows `#welcome` (the title and one sentence) above `#today` and `#demo-foot` (Keep, Skip, Paste, the About link) below it, ordered by CSS. Every tap goes through `toggle`, every add through `newItem`; `afterChange` skips storage while `demo` is on, so nothing is written anywhere and nothing reaches the server. Everything else the renderer does (the strike, the knock, the burst, the finale's volley) comes for free, which is what "reuse the Today renderer" was for.
- **Keep is Skip with a reason.** Both hand the same local document to the ordinary create path (`normalize` under a fresh id, `createList`, `switchTo`), so a person who played and then tapped Skip keeps what they did; the seed lines are the three the welcome shows, so a list started with Skip is the untouched demo. Keep appears once the person has made the list theirs — a line of their own (any live line whose text is not a seed line), or all three crossed off — and stays; Skip and Paste are always there as quiet links.
- **Three seed lines, not five.** The welcome has a title and a sentence above the list and three links below it, and all of it must fit a phone without scrolling; three lines teach a tap, a line of your own and the finale, which is what the demo is for. Everything, notes, the star and the rest are still taught by the hints on the real list.
- **The demo is Today, whole, and nothing else.** `A`, `O`, `/` and `-` do nothing on the welcome; the hints, the install hint and the minute tick's rollover stay off; the line menu works (it is part of a line) and whatever it does travels with Keep.
- **The paste form waits behind its link**, as the old welcome's did behind its button, so the welcome reads as a list first.

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
- **The permission hint is its own bar**, shaped like the install hint, because a hint with a button is not a mark (1.1's marks never have buttons). It shows the first time one-thing mode opens on a phone that has `requestPermission` (iOS), asks once and remembers either answer in `dev.shake`; × counts as declined, and declined means ↻ only. Android has no permission to ask for, so the listener starts silently. A device that said yes starts listening again on the next open when one-thing mode is on.

## The changelog

- **The headline is about the first minute** ("A better first minute."), with three items: the welcome you can try, the links named for what they do with the save sheet fitting the device, and shuffle. The card a texted link shows is not something a person does in the app, so it is not an item; the full record is in `CHANGELOG.md`.

## Process

- **The Simulator was driven from the outside.** The native simulator tool refused (it wants `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`, which needs a password), so the booted iPhone 16 Pro was driven with `simctl` (open a URL, screenshot) and, for the taps and the Shake menu, the Simulator app's own window through screen control, as the earlier rounds did.
- **The browser suite emulates the three devices** with init scripts (`navigator.platform` iPhone, `navigator.standalone`), stubs `navigator.share` and the clipboard to read what was handed over, and fires `DeviceMotionEvent`s by hand for the shake, with `requestPermission` stubbed to grant or deny.
