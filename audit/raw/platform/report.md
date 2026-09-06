# Today's Five 1.5 (build 76) — platform-seams audit

(The agent could not write this file itself; the text below is its final report, verbatim, saved by the orchestrator. Scripts and screenshots referenced below live in this directory. All testing used the local transport only; nothing reached the live Supabase project except the one required `realsync4.js` run.)

### A repeat rule of kind "weekly" breaks sync (and the deploy-transition resume) for the rest of the session
- severity: bug
- environment: Chrome `desktop`/`phone`, fixture `longtime` (also reproduced against the swap directory, port 8794, build 76)
- steps: 1. Open the app with any list whose Today view includes an item with a **weekly** repeat rule on specific days (the `longtime` fixture's default list has one: "Groceries"; `openApp({fixture:"longtime"})` reproduces it on a bare load, no interaction needed). 2. Watch for a page error, or check `window.__tf().status`.
- evidence: `check-daynames.mjs` output: `ReferenceError: Cannot access 'DAY_NAMES' before initialization` at `app.js:752:121`, thrown from `ruleLabel` → `updateRow` → `renderToday` → `render` → `setView` → `openList` → `boot`, on every load. `check-daynames-precise.mjs` output: the "Groceries" row (`datasetMarks:"r"`) never gets its `.rep` (↻) badge, tooltip, aria-label, **or its section caption** — its `innerHTML` is bare `"Groceries"` — while rows with "daily"/"monthly" rules render fine (only the "weekly" branch of `ruleLabel` touches `DAY_NAMES`). `check-sync-status.mjs` vs `check-sync-control.mjs`: the `longtime` list (has the weekly rule) sits at `status:"off", cur:null, live:false`; the control (`fresh` fixture, no weekly rule) reaches `status:"synced", live:true`. Zero page errors on the control; 2 on the weekly-rule list. `check-sync-recovery.mjs`: switching to a different list and back reproduces the identical error a third time; status stays `"off"` — it does not self-heal within the session. `trans-chrome-cold.mjs`: on the swap-directory deploy-transition test, the forced reload's `sessionStorage["tf/resume"]` (`{"view":"today","panel":"settings"}`) is written but **never consumed** — Settings does not reopen after the reload, because the same throw aborts `openList` before it reaches the resume-restore code.
- why it matters: `setView(view, {force:true})` runs synchronously near the top of `openList` (`app.js` ~423), and `ruleLabel`'s weekly branch (`app.js:752`) reads `const DAY_NAMES` (`app.js:747`) — declared later in the same module. `boot()` calls `openList` before the module's own top-to-bottom evaluation reaches line 747, so the very first render of a weekly-repeat row throws a TDZ `ReferenceError`. Because `openList` is `async` and nothing catches it, the exception silently aborts the rest of that call — `sync = createSync(...)`, `sync.open(...)`, `retryPendingKills`, `settleMigrations`, and the reload-resume restore (`app.js` ~473) never run. A person whose list has a weekly-scheduled repeat item gets a list that never shows as synced, never restores the panel a forced reload promised to reopen, and quietly drops the repeat badge/caption on that row — with nothing surfaced to them. This is a plain repeat feature (a line's ⋯ → Repeat → specific weekdays), not an edge case.
- proposed fix: move `const DAY_NAMES` (and anything else `ruleLabel`/`updateRow` depend on) above `boot()`'s call site, or guard `ruleLabel`'s body so a bad rule can't throw. Separately, `openList` shouldn't let a rendering exception cancel sync setup — wrap the `setView`/render call in its own try/catch.

### `navigator.share` failing on the View-link "Share…" button leaves the user with zero feedback
- severity: bug
- environment: Chrome `phone`, fixture `fresh`, `navigator.share` stubbed to reject with a plain `Error`
- steps: Open Share, tap "Share…" next to the View link (`#share-native`) with `navigator.share` rejecting non-Abort; compare with "Send a note" under the same failure.
- evidence: `share-clipboard-chrome.mjs` output — `"plain Error on Share... (View link) -> toast": "(no toast)"` vs `"plain Error on Tell a friend -> toast": "Note copied—paste it into a message"`; screenshots `share-plainerror-00-view-link.png`, `share-plainerror-01-friend.png`. AbortError is correctly silent on both buttons (`share-abort-01.png`), so this is specific to non-Abort failures.
- why it matters: `app.js:1842-1846`'s `nativeShare()` does `navigator.share({...}).catch(() => {})` — every error, not just a user cancel, is swallowed. The sibling flow (`panels.js` `wireShare`'s friend-note handler) explicitly checks `e.name === "AbortError"` and falls back to copying the note otherwise. A person whose OS share fails for a real reason taps "Share…", sees nothing happen, and has no idea whether it worked, with "Copy link" sitting right there unused.
- proposed fix: give `nativeShare` the same AbortError-aware fallback as the friend-note handler — on a non-Abort rejection, copy the link and toast (reuse `copyText`).

### Custom theme "Copy code" shows the raw theme code as the toast message when clipboard access fails
- severity: bug
- environment: Chrome `desktop`, fixture `fresh`, `navigator.clipboard.writeText` stubbed to reject
- steps: ⋯ → Settings → Day theme → Your own → Copy code, with clipboard writes rejecting.
- evidence: `clipboard-chrome.mjs` output — `"B: Copy code with clipboard rejecting -> toast text": "T2:d:D26128:dmserif::Custom"`; screenshot `clip-B-themecode-toast.png`.
- copy line: `panels.js:207` — `catch (e) { A.toast(T.themeCode(customTheme())); }`
- why it matters: every other Copy control (`copyText` in `app.js:1839-1841`, the note fallback in `panels.js:226-229`) turns a clipboard failure into an instructive toast or a focused, selectable field. This one prints the theme's raw export code as if it were a message, for 2.6 seconds, in a `<div>` a person can't select. Without clipboard access there is no way left to get the code out.
- proposed fix: route `#c-export` through the same fallback pattern as `noteFallback` — a focused, selected, read-only field with "Select the code and copy it".

### The View-link "Share…" payload text doesn't say what the link does
- severity: papercut
- environment: Chrome `phone`, fixture `fresh`, `navigator.share` stubbed to record its argument
- steps: Share → Share… (next to the View link).
- evidence: `share-clipboard-chrome.mjs` output — payload `{"title":"Today's Five","text":"Today's Five list","url":"http://127.0.0.1:8796/#/r/..."}`; screenshot `share-payload-00-sheet.png`.
- copy line: `app.js:1844` — `navigator.share({ title: "Today's Five", text: "Today's Five list", url: text })`
- why it matters: this `text` is what a recipient actually sees in Messages/Mail beside the link. "Today's Five list" doesn't say the link is a live, read-only view that updates as the sender checks things off — exactly the distinction the sheet's own copy takes care to make ("The View link shows the list and can't change it..."). The house rule ("a line about a link must say what the link does") applies here too.
- proposed fix: `text: "A live view of my Today's Five list — updates as I check things off."`

---

## What I checked and confirmed working

**Deploy transition (Chrome, against the swap directory at 8794).** A page on build 72 with the worker on, left open while the directory switched to build 76: when `panels.js` was already fetched before the swap, Settings/Share opened whole from build 72's own cache — no reload (`trans-chrome*.png`). When `panels.js` had not been fetched yet (`trans-chrome-cold.mjs`), the guard correctly detected the build mismatch, wrote the resume bookkeeping, refreshed the shell past the HTTP cache, and reloaded exactly once to build 76 with the same list id — every part of COMPATIBILITY.md §6 matched, except the final "reopen the asked-for panel" step, which failed only because of the DAY_NAMES bug above (this fixture's list has the weekly rule that trips it). A fresh navigation after the swap landed on build 76 with the list intact, both `tf-v1.4-b72` and `tf-v1.5-b76` in `caches.keys()` (only two builds existed to test, so "older generations reaped" beyond one-kept-previous wasn't exercisable).

**Audio state machine (Chrome, local transport).** `suspendAudio()` then a tap recovered to `"running"` immediately; `killAudio()` then a tap produced a fresh context (`made` incremented); a simulated background→foreground cycle correctly asked for resume and recovered (`audio-chrome.mjs`). The very first check-off on a truly cold page (confirmed cold via `audio-cold.mjs`) is not merely "a beat late" as DECISIONS.md's Sound section words it: `play()` (`sound.js:58-65`) returns `false` and starts `loadPacks()` without ever replaying that tap — the sound is dropped, not queued. Too fast to catch the drop empirically on localhost, but the code path is unambiguous; worth a documentation tweak, not a bug.

**Wake lock (Chrome, stubbed).** Toggling "Keep screen awake" calls `request("screen")` once; a spec-faithful stub (auto-releasing on hidden, as real browsers do) showed correct re-request on the next visible and clean release on toggle-off (`wakelock-chrome.mjs`). On the iPhone 16 Pro simulator (18.1) the row is present and toggles in a plain Safari tab; DECISIONS.md already documents that this has no real effect before 18.4/outside a Home Screen app, so not a new finding.

**Motion permission (Chrome, `navigator.platform` spoofed to trip the app's iOS check).** One-thing mode shows `#shake-ask`; Allow calls `requestPermission()`; `"granted"` starts listening and a synthetic `devicemotion` correctly shuffles; `"denied"` leaves it inert. `motion-chrome.mjs`. Same hint text confirmed on the iPhone 16 Pro simulator (`sim161-18.1-04-shake-hint.png`).

**Clipboard fallbacks, elsewhere.** The shared `copyText` helper shows "Select the link and copy it" on a rejected write, and its target fields (`.link` class) auto-select on focus (`clip-A-copyfail-toast.png`). With both share and clipboard entirely absent, "Send a note" correctly falls back to a focused, selected textarea (`clip-C-noclipboard-note.png`).

**Android back (Chrome `android` env, fixture `fresh`).** ⋯ → Settings → Day theme (a stack of two): first `goBack()` closed the top panel back to Settings; the second closed Settings; a third, with nothing open, left the page normally. One level per back, exactly as documented. `android-back*.png`.

**Blob manifest (iPhone 16 Pro, iOS 18.1).** The manifest `<link>` is present and not hidden. Fetching its `href` in-page threw `TypeError: Load failed` in Safari 18.1 — I could not confirm `start_url`/icons/name this way on-device. I can't tell whether that's a WebKit restriction on `fetch()`-ing a same-page `blob:` URL or specific to the WebDriver context, so I'm flagging it as an unresolved limitation of this verification method, not an app defect.

## Ran once, as instructed

**`tools/realsync4.js`** failed immediately: `AssertionError [ERR_ASSERTION]: pushed: busy`. This is the suite's own busy/create-limit signal (COMPATIBILITY.md §7: 12/hour, "a day of suites can spend it"). Run exactly once per the rules; reporting the output as-is, not retrying.

**macOS Safari** via safaridriver on port 4446 refused: `"You must enable 'Allow remote automation'..."`. No Safari setting was changed.

## What I could not check, and why

Budget ran out before I could: repeat the deploy-transition test on either simulator (only ran it in Chrome against the swap directory); run the combined manifest/wake/share/motion/audio pass on the iPhone 17 Pro (iOS 26.5) — only the iPhone 16 Pro (18.1) got the full pass; cleanly catch the silent-switch toast's *first-ever* appearance — two of my simulator scripts shared one device/session, and the one-time hint (`app.js:1072`) had already fired before I isolated the check, so my result (toast stuck on "Done" for 2s) is consistent with, but doesn't newly prove, the "shown once" design; the install hint / "Save your link" row / `navigator.standalone` save-sheet screenshot (item 9); the Android `/add?text=` hashchange path; and planting a real Home Screen icon through WebDriver (expected unreachable this way, and I didn't find a way in the time available).

## What holds up

The platform seams that got a full pass were solid: the deploy-transition guard's mechanics (mismatch detection, the single reload, session-storage resume bookkeeping, per-build cache selection, list-id continuity) matched COMPATIBILITY.md §6 exactly once the unrelated rendering bug was controlled for; `sound.js`'s suspend/resume/close/fresh-context and background/foreground logic behaved correctly under every scripted fault; wake lock request/release/re-request tracks visibility correctly; the motion-permission prompt flow works for both outcomes; Android's one-level-per-back panel history is exactly right, including leaving the page normally once nothing is open; and the ordinary clipboard/share fallback paths (note textarea, link auto-select, AbortError silence) all do what their toasts say. The two clipboard/share bugs above are narrow, single-control regressions sitting right next to correctly-built siblings — itself evidence the underlying pattern (a shared `copyText` helper, an Abort-aware fallback) is right; two call sites just didn't use it.
