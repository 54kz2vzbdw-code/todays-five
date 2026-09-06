# Today's Five 1.7 — Accessibility (judgment lens)

Evidence lives beside this file. Scripts: `t1.mjs`–`t14.mjs`, helpers in `lib.mjs` (a MutationObserver over every live
region, and a focus reporter). Transcripts: `trees-desktop.txt`, `trees2.txt`, `count-and-rows.txt`, `dialogs.txt`,
`keyboard.txt`, `t7.txt`–`t14.txt`. Screenshots as named below.

### A dead-zone error kills the first render: the Today list is short and the count reads 0/0
- severity: blocker
- environment: desktop + phone + zoom200, fixture `longtime` (any list whose Today holds a "chosen days" repeat)
- steps: 1. Open the app on a device that already has a list where a line on Today repeats on chosen days (the
  fixture's "Groceries ↻ Sat"). 2. Read the screen without touching anything.
- evidence: `count-zero-desktop.png` (the ring reads 0/0 above four lines); `count-and-rows.txt` (count `0/0` at boot,
  still `0/0` after an explicit reload and after 62 s; `#fill.style.width` is `""`, so `paint()` never ran); the page
  error captured in the `t5.mjs` run: `ReferenceError: Cannot access 'DAY_NAMES' before initialization at ruleLabel
  (app.js:752) ← updateRow (app.js:726) ← renderToday (app.js:778) ← render ← setView ← openList ← boot (app.js:311)`
- why it matters: `const DAY_NAMES` is declared at app.js:747, `boot()` runs at app.js:256 — a temporal dead zone. The
  first render throws mid-list, so Today shows 4 of its 7 lines, "Groceries" loses its `↻ Repeats: Sat`, and the count
  keeps the literal `0/0` from index.html:126. Nothing is shown or announced. A screen-reader user is read a short
  list and told "0 of 0 done"; the list repairs itself on the first interaction, so testing that starts by clicking
  never sees it.
- proposed fix: hoist `DAY_NAMES` (and `ordinal`) above the boot call — DECISIONS.md v3 already made this rule
  ("Everything `boot()` can reach is declared above the boot call"); extend the suite's boot test with a fixture
  carrying a chosen-days repeat, since the existing guard only covers link arrival.

### Putting a line on / off Today from the keyboard drops focus on `<body>`
- severity: bug
- environment: desktop, fixture `longtime`, Everything view
- steps: 1. Tab or click to a line's Today star in Everything. 2. Press Enter.
- evidence: `t11.txt`, "star after Enter" — focus goes from `BUTTON.tool.today "Today"` to `BODY`; nothing is
  announced (`aria-pressed` flips on an element that no longer has focus).
- why it matters: the row is re-created, so the focused button is thrown away. In the fixture's 80-line Everything
  view the keyboard user is returned to the top of the document, and never hears whether the toggle took. DECISIONS.md
  v3 took exactly this care for deletion ("moves focus to a neighbour … instead of dropping it on the body").
- proposed fix: update the row in place (as check-off already does), or restore focus to the same line's Today button
  after the render and let its `aria-pressed` + description do the announcing.

### The finale is silent
- severity: bug
- environment: desktop, fixture `longtime`, `reducedMotion: reduce` and default
- steps: 1. Cross off every line on Today. 2. Listen.
- evidence: `t7.txt`, "FINALE announcements" — the last event is the same per-line toast, `DONE UNDO`, plus the count.
  `finale-reducedmotion-desktop.png`. Markup index.html:175: `<div id="finale"><span>That's the list.</span>
  <button id="again">Start again</button></div>` — no role, no `aria-live`, revealed by a CSS class.
- why it matters: finishing the list is the point of the app and the one moment conveyed only in pixels, sound and
  confetti. A screen-reader user hears the same "Done" as four times before, and a "Start again" button silently
  appears in the footer.
- proposed fix: make `#finale` a polite live region, or push its text once through the existing `#toast`/`#mark`
  channel on the transition into the finale, so the last check-off says "That's the list." instead of "Done".

### An error raised while a sheet is open lands behind the sheet, outside the modal
- severity: bug
- environment: desktop, fixture `longtime`
- steps: 1. ⋯ → Lists. 2. Type something that is not a link into "Paste a link" and press Open.
- evidence: `toast-behind-modal-desktop.png` — "That doesn't look like a list link" sits at the bottom of the page
  under the sheet's blurred backdrop, illegible. `t11.txt`, "toast while modal": `toastInsideDialog: false`,
  `dialogIsModal: true`, `document.elementFromPoint` at the toast's centre returns `#p-lists`.
- why it matters: `#toast` (index.html:181) is a sibling of `<main>`, so while a `<dialog>` is showModal-ed it is in
  the inert, pruned subtree — a screen reader inside the dialog is not expected to hear it — and everyone else sees it
  through a blur. The same channel carries "Link copied" and the delete notices raised from inside sheets.
- proposed fix: render sheet-level messages inside the open sheet (an `aria-live="polite"` slot in `.panel .body`,
  plus `aria-describedby` and `aria-invalid` on the field that failed); keep `#toast` for the page.

### The phone's hidden ⋯ is `pointer-events: none`, so a VoiceOver activation lands on the line
- severity: bug
- environment: phone, fixture `longtime`
- steps: 1. Find the row's "Line menu" button (in the tree, 2 × 2 px at the row's right edge). 2. Activate it the way
  iOS VoiceOver does — a synthetic touch at the element's position.
- evidence: `t11.txt`, "elementFromPoint at the hidden ⋯": rect `[369, 192, 2, 2]`, `pointer-events: none`,
  `elementFromPoint` at its centre returns `LI.row` (`hitIsRow: true`). Activation through the DOM (`element.click()`)
  and through the keyboard (Enter) both open `p-line` correctly.
- why it matters: DECISIONS.md 1.5 "Quiet rows" promises the hidden ⋯ so "VoiceOver still finds 'Line menu'". Finding
  it is not the hard part. VoiceOver's double-tap sends a real touch at the item's location; with `pointer-events:
  none` that touch passes through and crosses the line off instead of opening the menu — and this is the only path a
  blind phone user has to Repeat / Not today / Move / Delete. (No VoiceOver here; argued from hit-testing.)
- proposed fix: against that half of the decision — drop `pointer-events: none`, keep the 1–2 px clipped box. A 2 px
  target cannot be hit by a stray finger but can be hit by an assistive tap aimed at it, which is the whole point.

### The Share chip is silently inert when the list has never been saved
- severity: bug
- environment: desktop, fixture `longtime` (every list in it reports `status: "off"`)
- steps: 1. Click "Share" in the rail, or ⋯ → "Share this list". 2. Wait.
- evidence: `dialogs.txt` and `t8.txt` ("share after plain click": `open: []`, no toast, no console error, focus stays
  on `#share`). The same click on a saved list opens the sheet (`t13.txt`, `share-desktop.png`). Cause: panels.js:235,
  `if (!A.doc || !A.ref) return;` — a bare return, where the very next line does raise a toast for a missing transport.
- why it matters: a control that is present, focusable, named and completely inert is a dead end. A sighted user
  clicks again; a screen-reader user gets nothing at all and cannot tell it from a broken app.
- proposed fix: give that branch the courtesy its neighbour has — `A.toast("This list isn't saved yet, so there's no
  link to share")`, and ideally offer the Save row from there.

### A delete button nested inside a theme swatch button
- severity: bug
- environment: desktop, fixture `longtime`, Settings › Day theme
- steps: 1. ⋯ → Settings → Day theme. 2. Read the "Yours" section.
- evidence: `t8.txt`, "p-theme tree": `button "Slate green Yours · pairs with Slate green, day Delete Slate green":
  button "Delete Slate green": ×`
- why it matters: a `<button>` inside a `<button>` is invalid and the parent's name absorbs the child's, so the swatch
  announces as "…Delete Slate green" — it sounds as though choosing it deletes it. Nested interactive content is also
  unreliable to reach with touch screen readers.
- proposed fix: make the row a container (`role="group"` or an `<li>`) holding two sibling buttons, the swatch and the ×.

### Where focus lands when a sheet opens is inconsistent, and two sheets open on "Close"
- severity: bug
- environment: desktop, fixture `longtime`
- steps: open, in turn, ⋯; ⋯ → Settings; a line's ⋯; Repeat; ⋯ → Lists; Settings → Day theme.
- evidence: `dialogs.txt`, `t8.txt` — Settings, Day theme and Share focus `div.body` (reading starts at the title, as
  intended); the ⋯ menu and the line menu focus the first row; Repeat and Lists focus the `×` Close button.
- why it matters: DECISIONS.md v3 says "the save sheet starts reading at its title rather than at the link" — the same
  reasoning applies to every sheet. Landing on × means the first word heard after opening Repeat is "Close", and a
  keyboard user's first Enter closes the sheet they just opened.
- proposed fix: route every sheet through the opener that focuses `.body[tabindex="-1"]`; menus may keep first-row
  focus, but Repeat and Lists should not start on ×.

### Line names run together: text, section caption and note with no separator
- severity: papercut
- environment: desktop + phone, fixture `longtime`
- steps: read any line that has a caption or a note in the tree.
- evidence: `trees2.txt` / `t9.txt`: `checkbox "Send the draft to Sam Writing Take the receipt"`,
  `checkbox "Call the bank before noon Calls Their number is on the fridge"`,
  `checkbox "Journal Repeats: Every day Writing"`
- why it matters: the accessible name concatenates line + section caption + note with only spaces. "Call the bank
  before noon calls their number is on the fridge" is one run-on sentence with a section name buried mid-way, and the
  caption reads as part of the task. The repeat glyph itself is handled well (app.js:726, `aria-label="Repeats: …"`);
  it is the ordering and joining that hurt.
- proposed fix: keep only the line's text in the name and move the caption and note to `aria-description` /
  `aria-describedby`, so it speaks "Send the draft to Sam, checkbox — Writing. Take the receipt."

### Key hints, glyphs and ids leak into names and headings
- severity: papercut
- environment: desktop, fixture `longtime`
- steps: open ⋯, Settings, Repeat, Lists, a section's ⋯.
- evidence: `dialogs.txt`, `t9.txt`: `button "Share this list links"`, `button "Full screen F"`, `button "Edit E"`,
  `radio "Never ✓"`, `heading "Settings Close" [level=2]`, `heading "Unsorted 0/6 Section options" [level=2]`,
  `button "Work MX8U7b…"`, `button "Export & import … ›"`.
- why it matters: the app already knows the trick — index.html:196 hides the save dot with `aria-hidden="true"` — but
  the sibling key hints do not. "Share this list links" reads like a mistake, and a heading list of "Settings Close" /
  "Unsorted 0/6 Section options" is hard to skim.
- proposed fix: `aria-hidden="true"` on every `<span class="k key">` and on the `✓` in the Repeat radios; move the `×`
  out of the `<h2>` or label the heading by its title span alone; hide the id fragment in Lists.
- copy line: index.html:197 `<span class="k key">links</span>`; index.html:200 `<span class="k key">F</span>`;
  index.html:194 and the same `<h2>…<button class="x">×</button></h2>` shape at 211, 264, 279, 338, 415, 436, 447,
  454, 460, 467, 482, 495, 513.

### The Keys sheet is one unbroken run of text
- severity: papercut
- environment: desktop, fixture `longtime`
- steps: press `?`.
- evidence: `t10.txt`, "Keys sheet" — the whole reference is a single text node: `"1 – 9 Cross off a line by position
  N New line E Edit the focused line O One thing at a time S Shuffle… A Today ↔ Everything ⌥ ↑ / ↓ Move the focused
  line ⌘ Z Undo T Day ↔ Night …"`
- why it matters: this sheet exists for keyboard users, who disproportionately include screen-reader users. Read as
  one paragraph nothing pairs a key with its action, and you cannot navigate to the entry you want.
- proposed fix: mark it up as a `<dl>` (or a two-column table with a caption).

### Moving a line with ⌥↑/↓ is not announced
- severity: papercut
- environment: desktop, fixture `longtime`
- steps: focus a line's checkbox, press ⌥↓.
- evidence: `keyboard.txt`, "after Alt+ArrowDown" — DOM order changes (`BdWISsJTfG` first → second), focus stays on
  the checkbox, no live region fires.
- why it matters: the one keyboard gesture whose whole purpose is to change position gives no confirmation that it
  worked or where the line now sits, while check-off, delete and Not today all announce.
- proposed fix: push "Moved to 2 of 8" through the existing status channel on each move.

### The toast's Undo is at the far end of the tab order
- severity: papercut
- environment: desktop, fixture `longtime`
- steps: delete a line from its ⋯ menu, then try to reach "Undo" without a mouse.
- evidence: `keyboard.txt` — the toast correctly announces `DELETED "JOURNAL" UNDO` and focus moves to a neighbouring
  checkbox (both promises kept), but Tab #1 goes to that row's Line menu and Tab #2 to the next line; `#toast`
  (index.html:181) sits after `<main>`, so Undo is past every remaining row and `+ New line`, and the toast times out.
- why it matters: the undo offered by eye is not the undo offered by keyboard. Ctrl/Cmd+Z works, so nothing is lost,
  but the visible affordance is decorative for keyboard users.
- proposed fix: move focus to the toast's action when it raises one, or add "Press Cmd+Z to undo" to the toast text.

### The Repeat sheet is named by a truncated title
- severity: papercut
- environment: desktop, fixture `longtime`
- steps: a line's ⋯ → Repeat.
- evidence: `dialogs.txt`: `dialog "Repeat · Reply to Dana about the closing …"` — the ellipsis is real text in the
  DOM, so the accessible name is truncated too. `repeat-desktop.png`.
- why it matters: the dialog's name is the sentence that says which line is about to change; cut short it can be
  ambiguous between two similar lines.
- proposed fix: truncate with CSS `text-overflow: ellipsis` and keep the full text in the DOM, or set an `aria-label`
  on the dialog with the untruncated string.

### At 200 % text on the phone, the list name and the Everything tab are clipped
- severity: papercut
- environment: phone, fixture `longtime`, `document.documentElement.style.fontSize = "200%"`
- steps: set the root font to 200 % and look at the rail.
- evidence: `font200-phone.png` — the list chip reads "W…" and the view tab reads "EVERYT", cut off inside the pill.
  `t10.txt` confirms no page-level horizontal overflow (`scrollW 390 == clientW 390`), so this is the rail's clipping.
- why it matters: at the text size a low-vision user actually runs, the two controls that say which list and which
  view you are in both lose their words.
- proposed fix: let the rail wrap to a second row past a width threshold, or drop the date sooner and give the chips
  the space.

### The idle fade hides controls from anyone who is not moving a mouse
- severity: proposal
- environment: desktop, fixture `longtime`
- steps: leave the pointer still for about five seconds.
- evidence: `idle-before-desktop.png` vs `idle-after-desktop.png`; `t9.txt`, "idle state" — `#listname`, `#daynight`,
  `#share`, `#more` at `opacity: 0`, `visibility: visible`, still in the tab order and still in the accessibility tree
  ("idle tree (rail)"), still clickable where they were.
- why it matters: this is deliberate (DECISIONS.md 1.5 "Rail diet and the idle fade": off under reduced motion, off on
  touch, switchable in Behavior) and screen-reader and keyboard users are unaffected. The group left behind is a
  low-vision or motor-impaired mouse user who reads slowly and holds still: for them ⋯ and Share become
  invisible-but-clickable, the one combination that reads as a broken app rather than a quiet one.
- proposed fix: fade to 0.15–0.25 rather than 0 — the quiet survives and nothing becomes a ghost target.

## What the app does well, and what could not be checked

Much of this was designed on purpose and holds. Every line is a real `checkbox` with `aria-checked`, so "done" is
never strike-through alone; the repeat glyph is spoken ("Repeats: Every day", "Repeats: Monthly on the 1st") rather
than read as "↻"; the Today star keeps the stable name "Today" with the state in `aria-pressed` and the action in a
description ("On Today — click to take it off"); sections are real `<h2>`s with `aria-expanded` toggles; the sync dot,
the search chip, the sun/moon ("Switch to day" — the action, not the state) and the QR images are all named; the Share
sheet is a model of headings, named fields and described links. Check-off, undo, delete and Not today all announce
through `role="status"` once and at the right moment ("Deleted 'Journal' Undo", "Not today. It's back on Today
tomorrow."); deleting by keyboard moves focus to a neighbour exactly as promised; Escape returns focus to the control
that opened the panel (⋯, and a section's ⋯ when properly focused); the theme picker has a real `‹ Back`
(`aria-label="Back"`) distinguishable by name from `×` Close, and its swatches are named by colour and pairing
("Harbor Day · pairs with Forest"). Single keys correctly do nothing inside the line editor and the note field (typing
"tent nest" typed "tent nest"), and the whole add-edit-note-commit path works from the keyboard with a clear 2 px
accent focus ring at every stop. Under `prefers-reduced-motion: reduce` the outcome is immediate — 60 ms after a click
the row already carries `.done`, the grey and a drawn strike — so nothing depends on watching an animation. At browser
zoom 200 % there is no overflow and the count and all seven rows render; at 200 % root text on the phone the page
still fits its width and the sheets are usable. The hold-released-in-place on the phone opens the line menu without
toggling the line, and the swipe for Not today announces itself.

Could not check. There is no screen reader on this machine: everything about what is *spoken* comes from Playwright's
`ariaSnapshot` (Chrome's accessibility tree) read top to bottom plus a MutationObserver on the live regions — so the
VoiceOver double-tap finding is argued from hit-testing, and the modal-inertness of the toast from DOM structure,
neither observed with a reader. The view-only surface would not load over the local transport (`t14.txt`), so the two
view-only promises — `aria-readonly` on the checkboxes and `aria-describedby="ro"` pointing at the "View link · view
only" pill — were confirmed only in the source (app.js:735, index.html:145 and :148), not in use. The sync status
region could not be exercised: every list in the `longtime` fixture reports `status: "off"`, so going offline and back
changed no category and `#dot-sr` never fired; "This link no longer works" and the busy state are likewise untested.
The what's-new toast and the install hint stayed hidden on a fresh profile, so their timing is unverified, and the
shake-ask needs a real device. Contrast ratios, target sizes and the tab-order sweep belong to the tooling lens and
appear here only where they changed a judgment.
