# Today's Five 1.7 audit — Bug hunt: surfaces

All evidence paths are relative to `$OUT` (…/scratchpad/audit/surfaces/). Source read-only at build 76;
every run on `?transport=local` through `tools/audit/harness.mjs`.

---

### A weekly ("Chosen days") repeat kills the list at boot: half the lines vanish and sync never starts

- severity: blocker
- environment: every environment (shown on desktop 1440×900); fixture `fresh` for the clean repro, and `longtime`, which ships such a rule and is therefore broken on every open
- steps:
  1. Open a fresh list. It reports `status: synced`, `0/3 done`, zero page errors.
  2. Line 1 → line menu → **Repeat** → **Chosen days** → **M** → **Done**. Still fine.
  3. Reload the page.
  4. One page error; the list shows **one** of its three lines, the count reads **0/0**, the top bar reads **SYNC OFF**, the list-name chip is gone.
  5. Nothing recovers it: a view round-trip to Everything and back, and checking a line off, both leave `status: off`. Every later open repeats step 4.
- evidence: `s13-repro2.mjs` + `s13.out.txt` (clean UI-only repro), `tdz-repro-before-reload.png` / `tdz-repro-after-reload.png`, `s11-tdz.mjs` + `tdz-day-names-desktop.png` (same on `longtime`: `status = off`, `live = false`, `cur = null`, 4 of 8 rows)
- why it matters: a person who tells one line to repeat on chosen days loses two thirds of their list from the screen and, silently, all syncing — the list stops reaching their other devices and the server, for good, with no error a person can see.
- root cause: `app.js:256` calls `boot()` at module top level. `boot()` → `openList()` → `setView()` → `render()` → `renderToday()` → `updateRow()` → `ruleLabel()` (`app.js:752`) reads `DAY_NAMES`, a `const` declared 491 lines lower at `app.js:747`, still in its temporal dead zone. `ReferenceError: Cannot access 'DAY_NAMES' before initialization` unwinds out of `render()`, so the rest of the row loop, `paintListName()`, `paintStatus()` and the whole key-derivation / sync start at `app.js:434`ff never run. Only the `weekly` branch touches `DAY_NAMES`; daily/weekdays/monthly are safe — which is why the browser suite (rules made through the UI, after module evaluation) never trips it.
- proposed fix: move `const DAY_NAMES` above the `boot()` call at `app.js:256`, or build the names inside `ruleLabel`. Also guard the first `render()` in `openList` so a render fault cannot take the sync start down with it, and add a suite case that reloads a list holding a `weekly` rule.

---

### A hold released in place does not open the line's menu — it writes a phantom "Moved" edit instead

- severity: bug (the taught gesture fails and mutates the document on every attempt; only swipe-right still reaches the menu)
- environment: phone 390×844 and android (touch); fixtures `longtime` and `fresh`
- steps:
  1. Phone, Today view. Press and hold a line until it lifts. The hint says "Drag to move it. Let go for the menu."
  2. Let go without moving.
  3. No menu. A tick sounds, the toast shows **Moved / Undo**, the line's `todayOrder` is rewritten and `updatedAt` bumped, so the edit syncs everywhere.
  4. Rows 1–4 on `longtime` all behave this way; row 1 actually changes position.
- evidence: `s9-holdbug.mjs` (`hold row 1..4: panel=null … undoUI="Undo"`), `s10.mjs` + `s10.out.txt`, `s8-hold.mjs`, `hold-moved-toast-phone.png`, `hold-first-row-no-menu-phone.png`
- why it matters: on a phone the ⋯ is one pixel wide, so a hold is one of only two doors to Edit / Repeat / Not today / Move / Delete. The app teaches it in three places and it does the opposite of what it says.
- root cause: `app.js:1584-1585` — `const changed = it[key] !== o || …; if (!changed) { render(…); if (fromHold && !moved) openLineMenu(id); return; }` where `o = M.orderBetween(prev[key], next[key])` is the *midpoint* of the neighbours (`model.js:347-354`), equal to the row's stored order only by coincidence, and for a first/last row `next − 100` / `prev + 100` — never its own value. `changed` is therefore true for a row that never moved, and the menu branch is dead.
- proposed fix: decide "did it move?" from the DOM — record the row's siblings at `beginDrag` and compare at `endDrag`; or hoist `if (fromHold && !moved) { render({animate:false}); openLineMenu(id); return; }` above the order computation.
- copy line: the broken promise is `app.js:1471` "Drag to move it. Let go for the menu.", plus `panels.js:827` and `panels.js:869`.

---

### `#/l/<W>/add?text=` with no text adds a blank line and says "Added"

- severity: bug
- environment: desktop 1440×900, fixture `fresh` (any environment)
- steps: open a list, set the hash to `#/l/<W>/add?text=` (or a bare `#/l/<W>/add`). A blank row appears; the toast says "Added" with an Undo.
- evidence: `s16.mjs` + `s16.out.txt` (`empty add: rows = 4 [… , '""']`), `empty-add-blank-line-desktop.png`, `s15.mjs`
- why it matters: add-from-anywhere is fired by shortcuts and share sheets, where an empty field is an easy mistake; the list then carries an invisible blank row. DECISIONS v4 "Features" gives the gone-link case this care ("nothing is added and the toast says so"); the empty-text case has none.
- proposed fix: treat empty or whitespace-only `text` as nothing to do — add no line, and either stay silent or say `Nothing to add.` (The 500-character case is already handled: clipped to the 200-character cap.)

---

### A saved theme's delete × sits on top of the theme's own name — and deletes with no confirmation

- severity: bug
- environment: all; worst on touch (ipad, phone) where the target is 44×44; shown on ipad 1024×1366 and desktop, fixture `longtime`
- steps: ⋯ → Settings → Day theme → scroll to **Yours**. Any saved theme whose name wraps into the top-right ("Slate green, day", "PartnerTest") has the round × drawn over the name. Tapping it deletes immediately — no confirmation, no undo.
- evidence: `theme-15-saved-desktop.png`, `fit-theme-ipad.png`
- why it matters: on a tablet the delete target overlaps the label you tap to *use* the theme, and the delete is unconfirmed and unrecoverable from the panel, so a mis-tap costs a theme the person built.
- root cause: `panels.css:94` `.swatch .del{position:absolute;top:.35rem;right:.35rem;width:28px;height:28px…}` (44 px at `panels.css:213`) over `.swatch .nm` (`panels.css:91`), which reserves no right padding; `panels.js:88-90` deletes on the first click.
- proposed fix: `padding-right: 2.2rem` on `.swatch .nm` (3rem on touch), or move the × below the name; and route the delete through the ten-second Undo toast the rest of the app uses.

---

### On an iPad the panel stack changes shape halfway down: a bottom sheet opens a centred card

- severity: papercut
- environment: ipad 1024×1366 and ipadLandscape 1366×1024, fixture `longtime`
- steps: ⋯ (full-width bottom sheet, `x:0 w:1024`) → Settings (again `x:0 w:1024`, bottom-anchored) → Day theme: a 480 px card floating mid-screen (`x:272 y:267`).
- evidence: the `s5-fit.mjs` measurement table; `fit-menu-ipad.png` vs `fit-theme-ipad.png`, same pair for `ipadLandscape`
- why it matters: the theme picker is a *child* of Settings and carries the ‹ Back that returns to it, but arrives as a different kind of object in a different part of the screen — it reads as a new place, not a step deeper. DECISIONS 1.4 "Panels, one stack" makes the stack one primitive; the shapes should follow.
- proposed fix: on touch widths above the phone breakpoint, give `#p-theme` its parent's sheet treatment (or make the whole tablet stack centred cards). Nothing is clipped — this is consistency, not fit.

---

### The line and note editors stop accepting characters at 200 / 300 with no sign

- severity: papercut
- environment: desktop, fixture `fresh`
- steps: new line → type 208 characters → 200 arrive. Tab to the note → type 304 → 300 arrive. No counter, no colour, no toast; the keyboard simply stops having an effect.
- evidence: `s14.mjs` (`{"tag":"TEXTAREA","len":200,"ml":200}`, `{"cls":"einput note-in","len":300,"ml":300}`), `edit-caps-desktop.png`
- why it matters: on a phone, a field that has silently stopped taking input reads as the app having frozen. The caps themselves are right for a list of short lines.
- proposed fix: keep the `maxLength` (`app.js:1287`, `app.js:1290`) and add the smallest signal — the row's underline flashes, or a right-aligned count appears within the last twenty characters.

---

### Copy: "A View link only shows the list. Open the Private link to add a line."

- severity: papercut
- environment: desktop, fixture `fresh`; the toast after `#/r/<R>/add?text=…`
- steps: hold a view link, set the hash to `#/r/<R>/add?text=Hello`. The refusal appears (correctly — nothing is added).
- evidence: `s16.out.txt`, `add-on-view-link-desktop.png`
- why it matters: "View link" and "Private link" are capitalised mid-sentence as if they were product names, while every Share-panel control spells them lower case ("Copy link", "Copy private link"). The reader has to work out they are the same things.
- proposed fix: `A view link only shows the list. Open the private link to add a line.`
- copy line: `app.js:271`

---

### The welcome's paste error is not cleared by the next, valid, paste

- severity: papercut (with a caveat, below)
- environment: desktop, fixture `none`
- steps: Welcome → "Already have a list? Paste your link" → paste `not a link` → Open (error) → paste `https://example.com/` → Open (same error) → paste a well-formed view link (`https://x/#/r/` + 22 chars) → Open. `#w-err` still holds the old sentence while the app goes on to open the list (the whose dialog appears over it).
- evidence: `s17.out.txt` lines 1-3 against `s18.mjs` in a clean context, where the same input gives `err = ""`, `whose open = 1`
- why it matters: a stale "That doesn't look like a list link" under a link that is in fact being opened says the opposite of what happened.
- proposed fix: clear `#w-err` at the top of the paste form's submit handler, before validating.
- caveat: seen once, in the `s17.mjs` loop; I did not get a second isolated repro before the budget ran out.

---

### phoneLandscape: a sheet takes 88% of the screen and the ⋯ menu has to scroll

- severity: proposal
- environment: phoneLandscape 844×390, fixture `longtime`
- steps: ⋯ in landscape. The sheet is 343 px of a 390 px viewport with 588 px of content, so the launcher scrolls; Settings is 343 px against 1400 px; the theme card is 480×343 against 1666 px.
- evidence: `s5-fit.mjs` measurements; `fit-menu-phoneLandscape.png`, `fit-theme-phoneLandscape.png`, `fit-theme-bottom-phoneLandscape.png`
- why it matters: nothing is clipped and everything scrolls, so this is not a defect — but the launcher meant to be one glance becomes a scroll, and the list behind it is invisible.
- proposed fix: below ~420 px of viewport height, lay the menu out in two columns (the rows fit side by side in 844 px) rather than one tall scroller.

---

## What holds up, and what I could not reach

The panel stack is the strongest thing this lens looked at. Every parent → child pair I opened (Settings → Day theme /
Export & import / Templates / History / Removed lists, Lists → a list's detail, Help → Keys) pushes exactly one level
and grows exactly one ‹ Back; ‹ Back returned the parent with its scroll byte-identical (665 → 665) and a value changed
below already in place; × closed the whole stack from a sub-panel; Escape popped one level and closed at the root; the
browser's Back popped one level and never left the page; the hash was character-for-character unchanged after every
unwind; twenty open/close cycles moved `history.length` from 2 to 4 and left it there. Nothing was clipped or flipped
off-screen anywhere I measured — desktop, narrow 900×700, zoom150, zoom200, phone, android, ipad, ipadLandscape,
phoneLandscape — and every over-tall panel scrolls its own body. The theme engine kept its floors: forty Surprise me
draws with no readout below 4.5:1 (lowest 6.3:1 dark, 5.5:1 light), and six extreme accents on both bases all above
5.5:1. Codes behave: `T3:…` and `T2:d:GGGGGG:…` refused, missing pair/pack fall back to "Custom", a 200-character name
clipped to 40; "Make its partner" twice is idempotent, the same name saved twice replaces rather than duplicates, and
seventeen saved themes lay out and scroll. Thirty shuffles gave zero immediate repeats. Backspace on an empty new line
removes it; Escape after typing leaves the line untouched. Add-from-anywhere strips the address back to `#/l/<W>` every
time and refuses on a view link.

Not reached: the save-sheet variants (§9, needing `navigator.platform` / `navigator.standalone` init scripts) and the
⋯ "Save your link" row disappearing after Copy; presence dots across two and three tabs (§11); Templates end to end
(§6); Removed lines and Restore (§7); the whose question end to end and "It's mine after all" (§10); the
`sessionStorage tf/resume` path; archiving the current list and the four-list switcher chip (§13); the day-review card
and unchecking during the finale (§14); `⌥↑/↓` across sections; and the click iOS synthesises after a hold. My attempt
to paste multi-line text into a line editor did not reach the app (a synthetic `ClipboardEvent` was ignored), so that
case is untested rather than passing. One warning about the rest: the `longtime` fixture trips the first finding on
every load, so anything measured on it *after* boot — the panel-fit table included — deserves a re-run once
`DAY_NAMES` is hoisted, because those pages ran with sync off and a partly-painted list.
