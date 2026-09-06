# Today's Five 1.7 audit — Consolidation lens

Build 76, served locally with `?transport=local`. Fixture `longtime` (four lists, seven sections, 80 lines, notes,
repeats, 91 days of history, saved themes) at desktop 1440x900 and phone 390x844. Everything below was counted by
driving the app, not by reading markup: scripts `inv-desktop.mjs`, `inv2.mjs`, `inv3.mjs`, `inv4.mjs`,
`probe-share.mjs`, `probe-welcome.mjs`; raw counts in `inv-desktop.json`, `inv2.json`, `inv3.json`, `inv4.json`.

## What is there — the count

**Controls per screen** (desktop, a healthy list — `rail-healthy-desktop.png`, `today-rest-desktop.png`, `everything-desktop.png`)

| surface | controls |
|---|---|
| Rail, desktop | 8: list-name chip · count · sync dot · Today · Everything · sun/moon · Share · ⋯ (↻ shuffle and the View-only / Shared pills are conditional) |
| Rail, phone | 7: the same minus Share (`rail-healthy-phone.png`) |
| Footer at rest | 0 controls — a key hint line only; "Start again" appears at the finale |
| Today row, at rest | 1 (the line) — hover adds ⋯ → 2 (`today-row-hover-desktop.png`) |
| Everything row, at rest | 2 (the line, the Today star) — hover adds ⋯ → 3 (`everything-row-hover-desktop.png`) |
| Everything header | 1 ("Search /", past eight lines) |
| Everything, per section | 2 in the header (collapse, ⋯) + "+ Add"; "+ Section" once at the end. Seven sections = 21 controls before a single line |

**Rows per panel** (desktop unless noted)

| panel | rows / controls | evidence |
|---|---|---|
| ⋯ menu | 9 rows (phone: the same 9 + ×) | `menu-desktop.png`, `menu-phone.png` |
| Line menu | 6 rows | `line-menu-desktop.png`, `line-menu-phone.png` |
| Section menu | 8 rows | `section-menu-desktop.png` |
| Repeat | 5 radio rows + Done | `repeat-desktop.png` |
| Move to… (pick) | one row per other list on this device | `pick-move-desktop.png` |
| Share | 5 blocks, 11 controls desktop / 13 phone; **1488 px in a 792 px window** (phone 1094 in 743) | `share-desktop-1.png`, `share-desktop-2.png`, `share-phone-*.png` |
| Settings | **19 controls in 4 groups** (Appearance 3 · Sound 4 · Behavior 4 · Lists 3 · Advanced 4, + ×); phone 18, **1513 px in a 743 px window** | `settings-desktop-1.png`, `-2.png`, `settings-phone-*.png` |
| → Export & import | 5 controls | `settings-export-desktop.png` |
| → Templates | opens the pick sheet: 1 template + "Insert into Unsorted" | `settings-templates-desktop.png` |
| → Removed lists | **opens the Lists panel** (13 controls) | `settings-removed-desktop.png` |
| → History | 0 controls (a record) | `settings-history-desktop.png` |
| Lists | 13: 3 list rows + 3 Details + 1 removed row + New list + Rename this list + Remove from this device + paste field + Open | `lists-desktop.png` |
| A list's detail | 2–4 rows (Open hidden for the current list; the origin switch only on a list opened from a link) | `list-detail-desktop.png` |
| Theme picker + builder | **one sheet, 30–32 controls** (14 swatches, 13 builder controls, Back/×); **1683 px in a 743 px window on the phone** | `theme-picker-desktop-1.png`, `theme-builder-desktop-2.png`, `theme-picker-phone.png`, `theme-builder-phone.png` |
| Save your link | 3 (link, Copy link, I've saved it) | `save-sheet-desktop.png` |
| Keys | a reference table + 1 control ("How it works") | `keys-desktop.png` |
| How it works | 7 headings, 5 controls | `help-desktop.png` |
| Welcome | 10 (3 demo rows × 2, + New line, Skip, Paste, About) — the demo line menu is a trimmed 5 rows | `welcome-desktop.png`, `welcome-line-menu-desktop.png` |

**Taps from Today** (desktop clicks; phone in brackets where it differs)

| task | taps |
|---|---|
| Cross a line off | 1 |
| Add a line | 1 (+ type) |
| Put an existing line on Today | 2 (Everything, the star) |
| Take it off Today | 2 (Everything, the star — or on Today: ⋯, Take off Today) |
| **Move a line to another section** | **no menu path — drag only** (⌥↑/↓ moves one place at a time) |
| Move a line to another list | 3 (row ⋯, Move to another list…, the list) |
| Rename the list | 4 (⋯, Lists, Rename this list, OK) |
| Switch lists | 2 by the rail chip; 3 by ⋯ → Lists |
| Nickname a shared list | 5 (⋯, Lists, Details, Nickname, OK) |
| Tell a friend | 2 + a scroll [3] |
| Show the list on a second screen | 2 (Share, Copy link under "Show it somewhere") [3] |
| Flip Day/Night | 1 |
| Pick a different theme for Night | 4 (⋯, Settings, Night theme, a swatch) |
| Change the sound pack | 3 + the select |
| See History | 3 (⋯, Settings, History) |
| Restore a deleted line | 2 + a scroll (Everything, bottom, Restore) |
| Save a template | 3 (Everything, section ⋯, Save as template) |
| Insert a template | 4 (Everything, section ⋯, Insert template…, the template) |
| New keys | 2 + a full-sheet scroll |
| Delete the list everywhere | 2 + confirm |
| Export | 4 (⋯, Settings, Export & import, JSON) |
| Import | 6 |
| Turn off the idle fade | 3 (⋯, Settings, the row) — the row is desktop-only |
| Find the keyboard reference | 1 (`?`) or 3 (⋯, How it works, Keys and gestures) |

Settings is three taps deep for nine of those tasks, and it is the deepest thing in the app: ⋯ → Settings → a
sub-sheet → an action is four.

---

### A weekly repeat on a list breaks the rest of the boot: no sync, no Share, no list name
- severity: blocker
- environment: desktop 1440x900 and phone 390x844, fixture `longtime` (its first list, "Work", has weekly repeats)
- steps:
  1. Open the app on a list that holds a line with a **weekly** repeat rule (the `longtime` fixture's first list).
  2. Watch the rail: the sync dot reads "Sync off" and the list-name chip never appears.
  3. Click Share in the rail, or ⋯ → Share this list. Nothing opens, ever, with no toast and no console error.
- evidence: `probe-share.mjs` and its output (below), `probe-after-share-click.png`, `probe-after-share-row.png`,
  `today-rest-desktop.png` (broken: "SYNC OFF", no list chip) vs `rail-healthy-desktop.png` (after a list switch:
  "Synced", the chip present). Also `inv-desktop.json` / `inv2.json`: every Share step failed until pass 4 switched lists first.
  ```
  ReferenceError: Cannot access 'DAY_NAMES' before initialization
      at ruleLabel (app.js:752:103) → updateRow (726) → renderToday (778) → render (671)
      → setView (665) → openList (424) → boot (312) → app.js:256
  window.__tf() after boot: { status: "off", panel: null }   // and #share opens nothing
  ```
- why it matters: `boot()` is called at `app.js:256`, before the module body reaches the `const DAY_NAMES` at
  `app.js:747`, so the first paint of any list holding a weekly repeat throws inside `ruleLabel`. `openList` dies at
  the `setView` on line 424, so everything after it — `paintListName`, `paintStatus`, deriving the keys, starting the
  transport — never runs. The list looks normal, but the device is offline until something re-opens the list, and
  Share (the only way to get the link onto another device) is dead. A person who set a Monday/Wednesday repeat has a
  list that silently stops syncing on every load.
- proposed fix: move `const DAY_NAMES` above `boot()` (or make it a `function dayName(d)`); wrap the first render in
  a try/catch so one bad label can never take the rest of `openList` with it.

### ⋯ → "Theme · Dark" opens Settings, not the theme picker
- severity: papercut
- environment: desktop and phone, fixture `longtime`
- steps:
  1. ⋯ (rail) → the second row reads "Theme" with the current theme's name on the right ("Dark").
  2. Click it. The Settings sheet opens at the top, exactly as ⋯ → Settings does.
- evidence: `probe-after-theme-row.png` (Settings, from the Theme row), `menu-desktop.png` (the row and its state),
  `probe-share.mjs` output: `afterThemeRow: ["p-settings"]`. Source: `app.js:1772`
  `else if (act === "theme") panels().then(p => p.openSettings());`
- why it matters: two of the nine rows in a menu that is capped at nine open the same panel. The row shows the current
  theme's name, which promises the picker, and then hands over a sheet whose first two rows ask which slot you meant —
  so the shortest way to a new theme is four taps whichever door you use. DECISIONS 1.1 "Rail diet" still says
  "Theme shows the current theme's name and opens the picker"; the code stopped doing that (the comment cites 1.2's
  "Appearance is the theme's home"). The decision and the label agree with each other and disagree with the behaviour.
- proposed fix: open the picker for the slot that is live right now (`T.activeSlot`) — the panel's own title already
  says "Day theme" / "Night theme", and Back lands in the menu. Theme goes 4 taps → 3, the label becomes true, and
  Settings → Appearance keeps both slots for the person who wants the other one. If instead Settings must own it,
  delete the ⋯ row: 9 rows → 8, and nothing is lost but a signpost.

### Settings' "Lists" group is three redirects
- severity: proposal
- environment: desktop and phone, fixture `longtime`
- steps:
  1. ⋯ → Settings → the group headed **Lists**: Templates, Removed lists, History.
  2. Click "Removed lists": the **Lists panel** opens — the same panel as ⋯ → Lists, one row above in the same menu.
  3. Click "Templates": the pick sheet opens with the saved template and "Insert into Unsorted" — while the ⋯ in every
     section header already has "Save as template" and "Insert template…".
- evidence: `settings-removed-desktop.png` (the panel that opens is `p-lists`, id recorded in `inv-desktop.json`
  → `removed.panel`), `lists-desktop.png` (same panel, with its own "Removed from this device" group),
  `settings-templates-desktop.png`, `section-menu-desktop.png`, `settings-history-desktop.png`.
- why it matters: Settings is where a person looks for switches. This group holds no switches: one row is a redirect
  to a panel that is a sibling in the same menu, one is a second door to templates, and one is a record. Settings is
  19 controls; three of them are navigation. DECISIONS v4 ("Structure") justifies two of them:
  "**History lives under Settings → Lists, because ⋯ is fixed at six rows** and History is a per-list record, not a
  control", and "A list with no sections has no headers and therefore no section menu; **Settings → Lists → Templates
  offers 'Insert into Unsorted' for that case**." The first premise has expired — ⋯ carries nine rows now, not six —
  and the second describes a fallback, not a permanent row.
- proposed fix: delete "Removed lists" (Lists already shows the removed group when there is one); show "Templates"
  only when the list has no sections, which is the case the decision was written for; move "History" into the list's
  detail (Lists → ›), where per-list things live. Settings: 19 → 16 controls, 4 groups → 3. What is lost: History
  costs 4 taps instead of 3, and a person who learned "Settings → Lists" has to relearn one place.

### Lists offers Rename and Remove twice, a row apart
- severity: proposal
- environment: desktop and phone, fixture `longtime`
- steps:
  1. ⋯ → Lists. At the bottom: "New list", "Rename this list", "Remove from this device".
  2. Click the "Details: Work" chevron on the current list's row: the detail sheet offers Rename and
     "Remove from this device" again.
- evidence: `lists-desktop.png` (13 controls), `list-detail-desktop.png` (Rename, Remove from this device;
  "Made on this device").
- why it matters: the same two actions on the same list, two rows apart, worded identically — and the bottom pair
  silently means "the current list" while the ones above it mean "the list you tapped". With four lists on the shelf
  that is a coin toss. DECISIONS 1.4 already made the detail the canonical home:
  "It lives in a list's detail (Lists → ›), a sub-panel that also carries Open, Rename or Nickname, and Remove from
  this device."
- proposed fix: drop the two bottom buttons; leave "New list" and the paste field, which are about the shelf rather
  than about one list. Lists: 13 → 11 controls. What is lost: renaming or removing the list you are on costs one more
  tap (4 → 5 for a rename), unless the current list's row gets a tap straight to its detail.

### A line can be moved to another list, but not to another section
- severity: proposal
- environment: desktop and phone, fixture `longtime` (seven sections, 80 lines)
- steps:
  1. In Everything, hover (or hold) a line in "Calls" and open its ⋯: Edit, Put on Today, Repeat, Not today,
     **Move to another list…**, Delete.
  2. There is no way to file it under "Errands" except dragging it there, past the sections in between.
- evidence: `line-menu-desktop.png`, `line-menu-phone.png`, `pick-move-desktop.png` (the picker that already exists,
  titled "Move to…"), `keys-desktop.png` (the reference offers only "Drag it to move the line" and ⌥↑/↓, one place at
  a time), `section-menu-desktop.png` (the section menu moves sections, not lines).
- why it matters: sections are the app's filing system, and the only way to file is a long drag on a phone across a
  list that is seven sections and 80 lines long — with no path at all for someone who cannot drag. Meanwhile the rarer
  operation (another list entirely) has a menu row and a picker. DECISIONS v4 names the line menu's contents as
  "'Not today', 'Repeat', '**Move to…**' and 'Delete'" — the design already calls this row "Move to…"; only the label
  and the picker's contents narrowed it to other lists.
- proposed fix: rename the row "Move to…" and give the existing pick sheet two groups — this list's sections first,
  then the other lists on this device (the sheet already renders grouped rows with sub-lines). Line menu stays at 6
  rows; the picker gains a group; the drag is untouched.

### The theme picker and the theme builder are one 1683 px sheet
- severity: proposal
- environment: phone 390x844 (and desktop), fixture `longtime`
- steps:
  1. ⋯ → Settings → Night theme.
  2. Scroll: 14 swatches, then "Your own" — colour well, hex field, Dark/Light, Fonts, Sound, a preview, Name,
     and five buttons (Use for Night, Save to this list, Make its partner, Surprise me, Copy code), then
     "Import a code" with its own field and button.
- evidence: `theme-picker-phone.png`, `theme-builder-phone.png` (`.body` scrollHeight 1683 in a 743 px window),
  `theme-picker-desktop-1.png`, `theme-builder-desktop-2.png`; 30–32 controls counted in `inv4.json` / `inv-desktop.json`.
- why it matters: picking one of fourteen ready-made themes is the common job and it is the top third of a sheet whose
  other two thirds are a workshop. On a phone, a saved theme under "Yours" sits below both. DECISIONS 1.4
  "Panels, one stack" built exactly the mechanism for this: "Settings → Day or Night theme, Export & import,
  Templates, History, Removed lists; Lists → a list's detail" — a builder sub-panel is the same shape, and Back
  repaints the parent through its opener, so a theme made below shows up in the swatches above.
- proposed fix: the builder becomes "Make your own ›" — one row under the swatches. Picker: 30 controls → 17;
  the builder keeps all thirteen on a sheet of its own. What is lost: one tap for a person who builds themes often,
  and the swatches are no longer on screen while the accent is being chosen (the builder has its own preview).

### "New keys" is the only untitled block, at the bottom of a 1488 px sheet
- severity: proposal
- environment: desktop and phone, fixture `longtime`
- steps:
  1. Share → scroll to the end.
  2. Under "Tell a friend", with no heading of its own: a "New keys" button and a grey line,
     "New keys: the old links stop working everywhere."
- evidence: `share-desktop-2.png`, `share-phone-2.png`; `inv4.json` → `shareBlocks` (the fifth block, `share-keys`,
  is the only `lk-block` with no `h3`).
- why it matters: every other block in the sheet says what it is for ("Open on my other device", "Show it somewhere",
  "Let someone edit", "Tell a friend"); the one that permanently invalidates every link you have handed out says
  nothing until you read the grey line beside it. DECISIONS 1.4 put it here on purpose — "New keys sits last, on its
  own, and never on a shared list" — and that placement is right; the missing heading is not part of the decision.
- proposed fix: give it a heading in the same voice as the others and let the fine line carry the warning:
  `<h3>Replace both links</h3>` above the button, with the existing note unchanged. Nothing is lost; the block count
  stays five and the sheet gains one line.
- copy line: index.html:369 (`<section class="lk-block keys" id="share-keys">` — the block with no `<h3>`)

### Settings' groups are not the groups a person has in mind
- severity: proposal
- environment: desktop and phone, fixture `longtime`
- steps: ⋯ → Settings, and read the four headings against their rows.
- evidence: `settings-desktop-1.png`, `settings-desktop-2.png`, `settings-phone-1.png`, `settings-phone-2.png`;
  full row list in `inv-desktop.json` → `settings`.
- why it matters: "Behavior" holds four unrelated device habits (Day review, Keep screen awake, Swipe left for
  "Not today", Single-key shortcuts, Fade controls when idle). "Lists" holds no settings at all (see above).
  "Advanced" holds the Add-from-anywhere URL, Export & import — "the only backup there is", which is the least
  advanced thing in the app — and "Show who's here", which is a privacy switch about other people, not an advanced
  one. The axis a person actually has is *this list* (its templates, its history, its backup) versus *this device*
  (its sound, its habits, whether it shows up as a dot).
- proposed fix: three groups instead of four — **Appearance** (unchanged), **This device** (Sound, Sound pack, Volume,
  Celebrate, Day review, Keep screen awake, Swipe/Keys/Fade, Show who's here), **This list** (Export & import,
  Templates or History if they stay, Add from anywhere). Same 16–19 rows, one heading fewer, and nothing under a word
  that tells people not to look. What is lost: "Advanced" as a lid over the two rows that look technical.

---

## What is already tight, and what I could not measure

The two screens themselves are the strongest thing here and the audit did not dent them: a Today row is one control
at rest and two on hover, an Everything row two and three, the footer carries no controls at all, and the rail holds
eight things on a desktop and seven on a phone. Crossing a line off is one tap and adding one is one tap, which is the
whole point of the app, and nothing in six rounds has crept into that path. The line menu is six rows and has stayed
six; the section menu's eight are all about a section; the History panel is a record with no controls, which is right;
the Share sheet's four titled blocks really are four different intentions rather than four link formats; and the save
sheet is three controls. The panel stack does what 1.4 said it would — Back repaints the parent, Escape goes back a
level — which is what makes most of the proposals above cheap to try.

What I could not measure: the Share sheet and the sync dot on the fixture as it boots, because of the blocker above —
every Share number here comes from the state after a list switch, and the same is true of the list-name chip and
therefore of the two-tap list switch. I did not measure the iOS Safari reload path (list switching there reloads the
page, which may add a step to "switch lists" and "rename the list"), the view-only mode's reduced surfaces, a shared
list's detail sheet (the "It's mine after all" switch needs a list arrived at by link, which the fixture does not
hold), or the one-thing mode's rail (the ↻ shuffle chip). Nothing about sound or motion character is in this report:
it is a different lens, and I kept to counting rows and taps.
