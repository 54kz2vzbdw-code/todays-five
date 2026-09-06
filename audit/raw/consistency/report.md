# Today's Five 1.7 — the Consistency lens

(The agent could not write this file itself; the text below is its final report, verbatim, saved by the orchestrator. Evidence files are in this directory: `sweep.mjs`, `measure.mjs`, `probe.mjs`, `light.mjs`, `measure-desktop-dark.txt` and the screenshots named below.)

**The system as written** (from `styles.css` + `panels.css`, build 76). Every colour and font is a token on `#theme-vars` (`--ink/-2/-3`, `--text`, `--muted(-2)`, `--dim(-2)`, `--hair`, `--hair-hi`, `--hair-solid`, `--accent`, `--accent-text`, `--danger`, `--done`, `--font-ui`, `--font-task`). One chip: a 999px pill, 1px `--hair`, transparent, `--dim`, that *inherits* its type from context and floors at 32px (44px on touch); pressed = `--accent-text` + `--accent` border (`styles.css:71-82`). One panel box: `--ink-2`, 1px `--hair-hi`, 18px radius, 480px wide, a bottom sheet on touch and a 14px popover under the control that opened it on the desktop (`panels.css:7-15, 141-158, 222-233`). One heading recipe: 11px / 700 / uppercase / `--dim` for `h2` (.16em) and `h3` (.14em). One focus ring: `outline:2px solid var(--accent); outline-offset:2px`. One danger colour, `--danger`, for destructive rows, warnings and bad sync states. Menu rows step 38 → 44 → 52px from popover to dialog to sheet. Icons are `fill:none; stroke:currentColor`, round caps and joins.

### `.danger` never reaches the confirm button — every irreversible confirm looks like an ordinary OK
- severity: bug
- environment: desktop 1440×900 dark and light, phone 390×844 — fixture `longtime` (theme-independent; it is a missing rule)
- steps: 1. Everything → the ⋯ on the "Calls" section → **Delete section**. 2. Read the confirm's primary button.
- evidence: `danger-confirm2-desktop-dark.png`, `cmp-rings.png` (top-left), `measure-desktop-dark.txt` (`--- DANGER ---`), and the probe line `DELETE SECTION confirm: {"cls":"chip accent danger","colour":"rgb(232, 129, 74)", …, "danger":"#E0745A"}`
- why it matters: `app.js:1738` marks the confirm button `danger` for the four moves you cannot undo — *Delete this list everywhere*, *Delete section*, *Delete template*, *New keys* — but the only rule for that class is `.menu button.danger` (`panels.css:49`), and `#ask-ok` is a `.chip`, not a menu row. It computes to `--accent-text` (#E8814A), the same orange as "Save to this list" or "I've saved it". The one moment the app most needs a different colour is the one moment it does not have one; the ⋯ menu row that *starts* the delete is red, and the button that actually deletes is not.
- proposed fix: add `.chip.danger{color:var(--danger);border-color:var(--danger)}` beside `panels.css:49`, and have `app.js:1738` drop `accent` when `danger` is set so the two never both apply.

### Six kinds of control fall back to Chrome's blue default focus ring
- severity: bug
- environment: desktop dark (and light — the ring is browser chrome, not a token)
- steps: 1. ⋯ → **Settings**, then Tab through the panel. 2. ⋯ → Tab to *About & privacy*. Settings → Day theme → scroll to the builder → Tab to *Dark*.
- evidence: `measure-desktop-dark.txt` (the `== rings …` blocks: every `1px auto rgb(153, 200, 255)` line), `ring-select-desktop-dark.png`, `ring-seg2-desktop-dark.png`, `ring-about-desktop-dark.png`, `ring-range-desktop-dark.png`, `cmp-rings.png` (middle-left, bottom-left)
- why it matters: a keyboard user sees an orange ring on twenty controls and a bright browser-blue ring on six of them, in the same panel, sometimes on adjacent rows. The blue belongs to no theme. The gaps: `.menu a.item` — *About & privacy*, the only link row in the ⋯ menu (`panels.css:36` names `.menu button` only); `.menu label.item select` — *Switch* and *Sound pack* (`panels.css:69` covers `.field select` only, so the builder's two selects *do* get the orange ring and Settings' two do not); `input[type="range"]` — *Volume* (`panels.css:72`); `.swatch .del` (`panels.css:94`); `.seg2 button` — *Dark/Light* (`panels.css:96`, while its twin `.seg button` in the rail has a ring at `styles.css:99`); `.save-more summary` (`panels.css:254`).
- proposed fix: one rule after `panels.css:36` — `dialog.panel :is(a.item,select,input[type=range],.seg2 button,.swatch .del,summary):focus-visible{outline:2px solid var(--accent);outline-offset:2px}`.

### "Choose a file" shows no focus ring at all
- severity: bug
- environment: desktop dark, fixture `longtime`
- steps: 1. ⋯ → Settings → **Export & import**. 2. Tab to *Choose a file*.
- evidence: `ring-file-desktop-dark.png`, `cmp-rings.png` (top-right); probe output `file input focus: {"id":"set-import-file","outline":"auto rgb(153, 200, 255)","opacity":"0","box":"110x38"}`
- why it matters: the real `<input type="file">` is stretched over the chip at `opacity:0` (`panels.css:179`), so focus lands on an element that paints nothing. Tabbing through Export & import, the ring vanishes for one stop. Its two neighbours are disabled at `opacity:.45`, so the chip cannot be told apart by dimming either.
- proposed fix: `.chip.file:focus-within{outline:2px solid var(--accent);outline-offset:2px}` at `panels.css:178`.

### Five chips ignore the chip type style and render as sentence-case body text
- severity: bug
- environment: desktop dark/light, phone dark/light, fixture `longtime`
- steps: 1. Cross every line off → look at **Start again** under the finale. 2. ⋯ → Settings → scroll to *Advanced* → look at **Copy** under the add-from-anywhere field. 3. Settings → Day theme → scroll to the bottom → look at **Import**.
- evidence: `measure-desktop-dark.txt` (`--- CHIPS ---`), `finale-desktop-dark.png`, `settings-bottom-desktop-dark.png`, `theme-builder-desktop-dark.png`
- why it matters: the panel chip is 11px / .14em / uppercase / 40px (`panels.css:63`), the rail chip 12px / .15em / uppercase / 32px. Five chips sit outside `.row-actions`, inherit the panel's 14px body font and come out sentence case with no tracking: `#again` "Start again" (16px / normal / none — `index.html:175`), `#set-addurl-copy` "Copy" (14px / 44px — `index.html:254`), `#c-import-go` "Import" (14px / 32px — `index.html:331`), `#l-paste-go` "Open" (`index.html:428`), the help sheet's "+ Today's Five". In the theme builder six uppercase 11px chips and one sentence-case 14px chip stack one under the other; three min-heights (32 / 40 / 44) appear in one panel.
- proposed fix: move the type onto the chip — `dialog.panel .chip{font-size:11px;letter-spacing:.14em;text-transform:uppercase;min-height:40px}` — and give `#finale .chip` the rail chip's `clamp(10px,1.05vw,12px)` / `.15em` / uppercase.

### `.inline` stretches chips and the segmented control across the panel
- severity: bug
- environment: desktop dark/light 1440×900 and phone, fixture `longtime`
- steps: 1. ⋯ → Settings → Day theme → scroll to *Your own*. 2. Look at the **Dark | Light** control and the **Import** button.
- evidence: `theme-builder-desktop-dark.png`, `cmp-rings.png` (bottom-left), `W-builder-desktop.png` (light)
- why it matters: `panels.css:70-71` gives every child of `.inline` `flex:1 1 auto`, so the two-up segmented control becomes a 440px bar with a 45px "Dark" beside a 390px "Light" — the selected half looks like a chip and the other half like an empty field — and "Import" becomes a full-width pill unlike any other button in the app. The same `.seg2` markup with `.seg2.wide` (`panels.css:57-58`) splits evenly; here it does not. The colour-picker + hex + segment row also wraps onto three lines at 480px.
- proposed fix: `.inline>.chip,.inline>.seg2{flex:0 0 auto}`, and add `wide` to the builder's `.seg2` if the full-width bar is wanted.

### The section ⋯ is the only 28px chip, and it does not share an axis with the row tools
- severity: papercut
- environment: desktop 1440×900 dark and light, zoom200, narrow — fixture `longtime`
- steps: 1. Switch to **Everything**. 2. Compare the ⋯ at the right end of a section header with the star at the right end of a row.
- evidence: `everything-desktop-dark.png`, `W-everything-desktop.png`, `R-everything-zoom200.png`; probe output `secChip: {"h":28,"minH":"28px","right":1382,"cx":1366}` vs `starCx: 1322`
- why it matters: `styles.css:302` sets `.sec-h .chip{min-height:28px}` — the only chip below the 32px floor `styles.css:74` establishes, so the section control is visibly smaller than the identical ⋯ in the rail. Its centre sits 44px right of the row star column, so the right edge of Everything has two ragged control columns instead of one.
- proposed fix: drop the `min-height:28px` override and give `.sec-h` the row's right padding (`padding-right:.3em`).

### `h3` section headings hang 11px left of the rows they head — in some panels but not others
- severity: papercut
- environment: desktop dark/light, phone — fixture `longtime`
- steps: 1. ⋯ → **Settings**; look down the left edge past *Appearance*, *Sound*, *Behavior*, *Lists*, *Advanced*. 2. Compare with **Day theme**, where the same `h3` sits above a swatch grid.
- evidence: `settings-bottom-desktop-dark.png`, `settings-desktop-dark.png`, `theme-desktop-dark.png`; probe output `h3lefts: [500,500,500,500,500]`, `rowLeft: 511`
- why it matters: `dialog.panel h3` (`panels.css:27`) has no left inset while `.menu button` carries `padding:.7em .8em` (`panels.css:41`), so in Settings, Share and the ⋯ stack every heading is outdented 11.2px from its own content; in the theme picker, where the content is a grid with no padding, the same heading aligns. A third inset exists for `.menu .group-h` (`margin:.9rem .2rem` — `panels.css:262`). Three insets for one idea.
- proposed fix: `dialog.panel h3{padding-left:.8em}` and match `.menu .group-h`'s left margin.

### Three stroke widths and four optical sizes in one icon set
- severity: papercut
- environment: every environment
- evidence: `measure-desktop-dark.txt` (`--- ICONS ---`): `.tool svg` 2px, `#daynight svg` 1.9px, `.menu .ic` 1.8px, `.glyph` 1.8px; sizes 15px (sun/moon), 18/20/22px (menu icon by container), ~1.05em (row tools). Screens: `menu-desktop-dark.png`, `cmp-menu.png`, `everything-desktop-dark.png`
- why it matters: `styles.css:229`, `styles.css:635`, `panels.css:45` and `panels.css:271` each pick their own stroke. Side by side in the ⋯ menu (1.8px at 18px) and the rail (1.9px at 15px, 2px on the row tools) the same drawing style reads at three different weights; the sun in the rail is noticeably lighter than the ⋯ beside it.
- proposed fix: one token, `--icon-stroke:1.8`, used by all four rules; let size do the rest.

### The theme picker is the only panel that is not a bottom sheet on the phone
- severity: papercut
- environment: phone 390×844 dark and light, fixture `longtime`
- steps: ⋯ → Settings → **Day theme**.
- evidence: `cmp-light-phone.png` (rightmost pane, beside the ⋯ sheet and the Settings sheet), `theme-phone-dark.png`
- why it matters: `index.html:278` declares `<dialog class="panel" id="p-theme">` with no `sheet`, so on a phone it is a floating card with four rounded corners, no grip, no slide-up and no drag-to-dismiss, while the ⋯ menu, Settings, Share, Lists, History, How it works, the section and line menus all arrive as sheets. It is reached *from* a sheet, so the transition is sheet → card → sheet.
- proposed fix: `class="panel sheet"` on `#p-theme` (`index.html:278`); it already carries a `.back` button, so the stack behaves.

### Two controls stay under the 44px touch floor the rest of the app keeps
- severity: papercut
- environment: phone 390×844 (and any `hover:none`), fixture `longtime`
- steps: ⋯ → **Settings**; look at *Switch*, *Sound pack* and *Volume*.
- evidence: `cmp-light-phone.png` (third pane), `settings-phone-dark.png`
- why it matters: on touch the app raises chips, seg buttons, the ×, ranges and sheet rows to 44–52px (`styles.css:422,438,458,461`; `panels.css:214-215,150`), but `.menu label.item select` is pinned at 36px (`panels.css:176`) and `.menu label.item input[type="range"]` at 32px (`panels.css:47`, which outranks the 44px rules at `panels.css:72` / `styles.css:461`). Inside a 52px sheet row the select is visibly short, and the volume slider is the smallest target in the app.
- proposed fix: add `.menu label.item select,.menu label.item input[type=range]{min-height:44px}` to the `@media (hover:none)` block at `panels.css:207`.

### The way back is a chevron in the app and an arrow on the About page
- severity: papercut
- environment: desktop and phone, both schemes
- steps: ⋯ → Settings → Export & import (header reads `‹ Back`); ⋯ → **About & privacy** (page reads `← Back to the list`).
- evidence: `cmp-misc.png` (top-middle vs bottom-left), `export-desktop-dark.png`, `about-desktop-dark.png`
- why it matters: two glyphs and two label conventions for the same move, one screen apart. The in-app control is `'<span class="chev">‹</span> Back'` in `--accent-text` (`app.js:1606`, `panels.css:23-24`); the About page uses a `.crumb` link with `←` in `--dim` (`styles.css:483-485`).
- proposed fix: make the About crumb match the panel control — `‹ Back to the list`, `--accent-text`, the same `.chev` treatment.
- copy line: `about.html:68` — `<p class="crumb"><a href="./">← Back to the list</a></p>` → `‹ Back to the list`

### The three popovers have three different row anatomies
- severity: proposal
- environment: desktop 1440×900 dark/light, fixture `longtime`
- steps: press ⋯ in the rail; then the ⋯ on a row; then the ⋯ on a section header.
- evidence: `menu-desktop-dark.png`, `line-menu-desktop-dark.png`, `sec-menu-desktop-dark.png`, `sec-menu2-desktop-dark.png`
- why it matters: they share the popover box and nothing else. The ⋯ menu has an icon per row, a state or key on the right, and a red row; the line menu has no icons, a sub-line under some rows and a key on the right; the section menu has no icons, no keys, no sub-lines. The ⋯ and line menus also autofocus their first row, so a mouse click paints a bright orange ring on "Share this list" / "Edit"; the section menu does not.
- proposed fix: pick one — icons everywhere or nowhere in the popovers — and make the autofocus rule the same for all three (`panels.js:595` opens the section menu through the same `showPanel(…, {anchor})` primitive, so it is one place).

### A panel title and its section headings are typographically the same
- severity: proposal
- environment: every panel
- evidence: `measure-desktop-dark.txt` (`--- HEADINGS ---`): `h2` 11px / 1.76px / uppercase / `--dim`; `h3` 11px / 1.54px / uppercase / `--dim`; `.day h4` 11px / 1.54px; `.menu .group-h` 10px / 1.4px
- why it matters: `panels.css:16-19` and `panels.css:27` differ by 0.22px of tracking and nothing else, so in Settings "SETTINGS" and "APPEARANCE" read as peers. Four near-identical uppercase grey labels (h2, h3, h4, `.group-h`) do the work of a hierarchy with no visible steps.
- proposed fix: keep `h3` and give `h2` a step — `--text` instead of `--dim`, or 12px with a hairline under it.

### Four hover treatments across one control language
- severity: proposal
- environment: desktop, both schemes
- evidence: `styles.css:77` (`.chip:hover` fill + border), `panels.css:43` (`.menu button:hover` fill only), `panels.css:33` (`dialog.panel .x:hover` border only), `panels.css:88` (`.swatch:hover` border only), `styles.css:230` (`.tool:hover` fill + border + colour)
- why it matters: hovering a menu row fills it, hovering the × beside that row draws a ring around it, hovering a swatch below it lights only its edge. Together they make the panel feel assembled rather than designed.
- proposed fix: one hover token — `background:var(--ink-3)` plus `color:var(--text)` — for every hit target inside a panel, keeping the border change only for controls that already have a visible border.

---

**What the app does well, and what I could not check.** The core of the language is genuinely one system. Every colour and font is a token, so a theme swap moves the whole app at once and light and dark stay in step — I switched the day/night slot and found no hairline, shadow or state colour that survived only in dark (`W-*` shots). The panel box is one box: 18px radius, `--ink-2`, a `--hair-hi` edge, 480px on the desktop and a full-width sheet with a grip on touch, and the 38 → 44 → 52px row ladder from popover to dialog to sheet is applied consistently everywhere except the two cases above. The `--accent` focus ring is right on twenty-odd controls and its offsets are deliberate (`-2px` inside the rail's clipped segment, `4px` around a task row so it clears the strike). The row, checkbox, strike overlay and caps/notes hierarchy hold at 390px, 1440px, 1920px and 200% zoom. Touch bumps everything but two controls to 44px. And `--danger` is correctly reserved — I found it only on the delete rows, the private-link warning, the paste error and the failed sync states, never decoratively; the defect is that it is missing from the confirm, not that it is over-used.

Not checked, and why: the phone **line menu** and the lifted-row state — the harness's `hold()` gesture timed out on touch in two runs, so my phone evidence for that surface is missing (the desktop popover is covered). The **day review card** — turning it on needs a finished day plus a settings toggle, and I ran out of budget. The **welcome and finale in light**, the **install / what's-new / shake toasts**, and the **iPad/Android** widths were not screenshotted. Motion, sound and the theme crossfade are outside this lens. Where a panel opened only because I called `showModal()` directly (the save sheet in the first sweep), I have not treated the render as evidence.
