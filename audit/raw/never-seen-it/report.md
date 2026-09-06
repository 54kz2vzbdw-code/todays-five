# Today's Five 1.7 audit — "Never seen it"

A person with no context, arriving by a texted link or at the bare URL. Every path below was driven on the local
transport with `tools/audit/harness.mjs`; scripts are `$OUT/s1.mjs`…`s9.mjs`, screenshots `$OUT/*.png`.
`$OUT` = `…/scratchpad/audit/never-seen-it`.

---

### A tap outside "Whose list is this?" ends the arrival: the list never opens, and the app teaches the gesture that does it
- severity: blocker
- environment: desktop 1440×900 and phone 390×844 (also android), fixture `none` arriving by a Private link; the same happens on a View link
- steps:
  1. Make a list in one profile (fixture `fresh`); take its Private link and the local server rows.
  2. Open that link in a fresh profile (`openApp(browser, { fixture: "none", hash: await a.link(), server: await a.exportServer() })`).
  3. "Whose list is this?" opens over an empty app. Click (desktop) or tap (phone) anywhere outside the card.
- evidence: `$OUT/whose-question-desktop.png`, `$OUT/whose-backdrop-dead-end-desktop.png`, `$OUT/whose-question-phone.png`,
  `$OUT/whose-backdrop-dead-end-phone.png`, `$OUT/whose-dead-end-after-reload-desktop.png`; repro `$OUT/s3.mjs`, output:
  `after backdrop click whose open? false` … `DEAD END state: {"listId":null,…}` and, on the phone,
  `after tap outside, whose open? false listId null`.
- why it matters: the question is the first thing a stranger sees after tapping a texted link, and it sits as a small card
  in the middle of a phone screen — most of the glass is "outside" it. One tap there and the card goes, the list never
  opens, and what is left is a rail reading `0/0 · SYNC OFF`, a Today/Everything switch, Share, ⋯ and a `+ NEW LINE`
  button over nothing. No message, no retry, no hint that a reload would bring the question back (it does). The app's own
  reference sheet teaches this exact gesture: `panels.js:869` lists **"Swipe down, or tap outside — Close a sheet like this one."**
  So the person is stuck doing the thing they were told to do.
- cause: `app.js:1691` gives every `dialog.panel` a backdrop-click close (`if (e.target === d) … d.close()`); `#whose` is a
  `dialog.panel` (`index.html:519`). `askWhose()` (`app.js:279–287`) resolves only on a click on `[data-whose]` and
  prevents `cancel`, so the `await askWhose()` in `openList` (`app.js:388`) never settles.
- proposed fix: on `#whose`, swallow the backdrop click the way `cancel` is already swallowed — or, safer, resolve any
  close as `"shared"` (the answer that grants the fewest powers and that Lists can flip) so the list always opens.
- DECISIONS: 1.4 "Mine and shared with me" — "**The question is a dialog of its own, not cancelable.** … Escape does
  nothing, because the answer is how the list is filed from then on and Lists can change it." The Escape door was shut;
  the backdrop door was left open, and it leads nowhere.

---

### "Skip — start my list" hands the person the tutorial's three lines as their real list
- severity: bug
- environment: desktop, phone, android; fixture `none`
- steps:
  1. Open the bare URL. 2. Without touching anything, click "Skip — start my list". 3. The save sheet opens; leave it.
- evidence: `$OUT/welcome-desktop.png` (the three demo lines), `$OUT/first-list-phone.png` (the saved list, one screen later:
  "Tap or click to cross this off / Add a line of your own / Cross off all three and see"); `$OUT/s1.mjs`.
- why it matters: the label promises a clean start ("start **my** list") and delivers a permanent, synced list whose three
  lines are instructions. A newcomer's first job in their own list is deleting three lines one at a time — on a phone,
  three long-presses and three menu taps. It also makes the first shared or bookmarked list read as junk.
- proposed fix: when `#w-keep` is still hidden (nothing of the person's own exists yet), Skip should create the list without
  the untouched seed lines; when Keep is showing, Skip keeps its current meaning. Copy stays as it is.
- copy line: `index.html:162` — `Skip — start my list`
- DECISIONS: 1.3 "The first minute" — "**Keep is Skip with a reason.** Both hand the same local document to the ordinary
  create path … so a person who played and then tapped Skip keeps what they did; the seed lines are the three the welcome
  shows, so a list started with Skip is the untouched demo." The reason for the rule is not losing the person's work — but
  Keep already covers that, and it appears the moment there is any work to keep. Skip's only remaining job is the other
  case, which is exactly the case where the seed lines are noise.

---

### A stranger handed a View link is interrogated about ownership, and offered an answer that cannot be true
- severity: bug
- environment: desktop and phone, fixture `none`, `hash: await a.viewLink()`
- steps:
  1. Make a list in one profile. 2. Open its View link in a fresh profile. 3. Read the first screen.
- evidence: `$OUT/view-link-asks-whose-desktop.png`, `$OUT/view-link-asks-whose-phone.png`, `$OUT/view-link-opened-phone.png`;
  `$OUT/s2b.mjs`, output: `desktop VIEW arrival whose open? true` … `VIEW after answer: mode view origin shared`.
- why it matters: the View link's whole purpose, in the Share sheet's own words, is "hand it to someone who should watch".
  That someone is by definition not the owner, and before they see a single line they must answer "Whose list is this?"
  with "Mine, from another device" or "Someone else's". The first answer is offered to a person for whom it is false; taking
  it files a read-only list under **My lists**, where every action the group promises is refused.
- cause: `app.js:386–388` — `originOfHeldView(R)` returns null on a device that holds no list, so `askWhose()` runs for
  `r` links too.
- proposed fix: a View link on a device that holds no matching Private link is registered `shared` with no question. Nothing
  is lost: Lists' detail can still flip it.
- DECISIONS: 1.4 "Mine and shared with me" — "View links carry no hint; a hint on an `r` link is ignored." The decision
  already treats an `r` link as carrying no ownership claim; the app should stop demanding one.

---

### The whose question paints the wrong answer as the default
- severity: bug
- environment: phone 390×844 and android (Pixel 7), fixture `none`, arriving by a link
- steps: 1. Open a list's Private link (or View link) in a fresh profile on a phone. 2. Look at the two answers.
- evidence: `$OUT/whose-question-phone.png` — "Mine, from another device" carries an orange focus ring; "Someone else's"
  does not. Also `$OUT/whose-question-android.png`, `$OUT/picked-mine-wrongly-android.png`.
- why it matters: the ring is the app's accent colour and reads as "this one is selected / this is the recommended answer".
  On a touch screen there is no keyboard focus to explain it. The emphasised answer is the wrong one for the case the
  question exists to catch — a link that arrived from somebody else — and choosing it files the list under My lists
  silently, with no confirmation and no toast.
- proposed fix: do not autofocus an answer in `#whose` (or suppress the ring when the dialog was opened without a key
  press), so the two answers carry the same weight.

---

### The save sheet is the one panel with no way out but claiming you saved
- severity: bug
- environment: desktop, phone, android; fixture `none` → Keep or Skip
- steps: 1. Bare URL → Skip (or Keep this list). 2. The save sheet opens. 3. Look for a way to close it. 4. Tap "I've saved it". 5. Open ⋯.
- evidence: `$OUT/save-sheet-desktop.png`, `$OUT/save-sheet-phone.png`, `$OUT/save-sheet-android.png`,
  `$OUT/menu-phone-after-saved.png`; `$OUT/s9.mjs`, output: `state unsaved? false` and a ⋯ menu with no "Save your link" row.
- why it matters: `#p-save` (`index.html:383–411`) is the only panel in the app with no `×` and no Back — every other
  dialog has `<button class="x" data-close>×</button>`. The one labelled exit is a claim the person has not necessarily
  made, and pressing it flips `linkSaved` for good: the ⋯ "Save your link" row with its dot, and the Share sheet's chip,
  both disappear. The newcomer meets this sheet in their first thirty seconds, before "the link is the key" means anything
  to them, and the app's only nudge about the only key to their list is one tap from being switched off forever.
  On the phone the sheet also shows no link at all, so "Copy link" copies something they have never seen.
- proposed fix: give `#p-save` the standard `×` (closing that way already leaves `linkSaved` false, which is the behaviour
  the decision below wants), and add a second chip beside it reading "Not yet".
- copy line: `index.html:409` — `I've saved it`
- DECISIONS: 1.3 "Save your link" — "**Saved means copied or confirmed.** `linkSaved` turns true on Copy and on I've saved
  it, and on nothing else; closing the sheet any other way leaves ⋯ carrying a Save your link row with a dot." The
  mechanism is right; the sheet just never shows the person that "any other way" exists.

---

### "Take off Today" and "Not today" sit two rows apart in a line's menu and read the same
- severity: bug
- environment: desktop and phone, fixture `longtime` (and `fresh`), the line menu
- steps: 1. Open a list. 2. Hover a line and click its ⋯ (desktop) or hold the line (phone). 3. Read the rows.
- evidence: `$OUT/line-menu-desktop.png`, `$OUT/line-menu-phone.png`; `$OUT/s5.mjs`, output:
  `LINE MENU: Edit | E | Take off Today | Repeat | Never | Not today | Back on Today tomorrow | - | Move to another list… | Delete`.
- why it matters: to a person who has never seen the app, "Take off Today" and "Not today" are the same sentence. One
  clears the star (the line stays in Everything until they star it again); the other hides the line until tomorrow's
  rollover. "Not today" carries an explaining sub-line; "Take off Today" carries nothing, so the row that needs the
  explanation is the one without it.
- proposed fix: give the star row the same treatment — `Take off Today` with the sub-line `Stays in Everything until you
  star it again`.
- copy line: `panels.js:696` — `$("#line-today-lb").textContent = it.today ? "Take off Today" : "Put on Today";`
  (the "Not today" row and its sub-line are `index.html:487`)

---

### Nothing on the welcome says nothing is saved yet
- severity: papercut
- environment: desktop, phone, android; fixture `none`
- steps: 1. Open the bare URL. 2. Cross a line off. 3. Look for any sign of whether that was recorded anywhere.
- evidence: `$OUT/welcome-desktop.png`, `$OUT/welcome-crossed-phone.png`, `$OUT/welcome-added-phone.png`
- why it matters: crossing lines off, editing them and adding one all behave exactly as they will on a real list — the
  strike, the knock, the confetti. The only signal that this is a demo is the clause "then keep it", and until the person
  adds a line of their own the only button offered is "Skip — start my list", which reads like discarding. Someone who
  spends a minute here does not know whether they have made something or not.
- proposed fix: one clause on the welcome sentence.
- copy line: `index.html:158` — current: `A short list you keep open on screen all day—try it below, then keep it.`
  proposed: `A short list you keep open on screen all day. Try it below—nothing is saved until you keep it.`

---

### The count is a control, and nothing on a phone says so
- severity: papercut
- environment: phone and android (and desktop, without a hover), fixtures `fresh` and `longtime`
- steps: 1. Open a list on a phone. 2. Tap "0/3" in the top bar.
- evidence: `$OUT/first-list-phone.png` (the rail: `0/3` and a dot, nothing else), `$OUT/one-thing-phone.png`;
  `$OUT/s6.mjs`, output: `count:shown "0/3 DONE" aria=null`; `$OUT/s4.mjs`, output:
  `[count] "0/3 DONE" title="One thing at a time (O)"`.
- why it matters: the count looks like a readout. Tapping it replaces the whole screen with one enormous line — the
  biggest state change in the app — and on a phone there is no tooltip and no aria-label to warn or to explain. The way
  back *is* taught once you are in there ("ONE THING AT A TIME. O OR THE COUNT BRINGS THE LIST BACK."), which is why this
  is a papercut rather than worse, but the arrival is a surprise every newcomer gets by accident.
- proposed fix: give `#count` an `aria-label="One thing at a time"` so it at least announces itself, and show the same
  just-in-time mark the star gets the first time the mode opens.
- copy line: `index.html:126` — `<button id="count" class="count" … title="One thing at a time (O)">`

---

### In Everything, nothing has a hover tooltip on the desktop
- severity: papercut
- environment: desktop 1440×900, fixture `longtime`, the Everything view
- steps: 1. Open Everything. 2. Hover the ▾ beside a section name, the section's ⋯, and the star at the end of a line.
- evidence: `$OUT/everything-longtime-desktop.png`; `$OUT/s7.mjs`, output:
  `sec-toggle "▾ UNSORTED" title="" aria=null | chip sec-more "⋯" title="" aria="Section options" | … tool today "" title="" aria="Today"`
- why it matters: the top bar teaches itself by hover — Switch list, One thing at a time (O), Synced, Today (A), Day · T,
  Share this list, More. Everything teaches nothing the same way. The star is the most consequential control on the screen
  (it is what puts a line on Today) and it is an unlabelled outline glyph 1,230 px from the words it belongs to; its only
  explanation is a one-time mark ("The star puts a line on Today, or takes it off.", confirmed in `$OUT/s9.mjs`) that never
  comes back. The section ⋯ has an aria-label but no title, so a sighted person gets nothing.
- proposed fix: `title` on all three — the star `Put this line on Today` / `Take it off Today` (matching its state,
  as `aria-label` already does), the section ⋯ `Section options`, the ▾ `Collapse this section`.
- copy line: `app.js:684` (`today.className = "tool today"`, where the star button is built)

---

### The red warning in the Share sheet arrives before the thing it warns about
- severity: papercut
- environment: desktop and phone, fixture `fresh`, ⋯ → Share this list
- steps: 1. Open Share. 2. Scroll to the end of the "Show it somewhere" block.
- evidence: `$OUT/share-phone.png` (the red line sits under the View link's Copy / QR code / Share… buttons, above the
  "Let someone edit" heading), `$OUT/share-desktop.png`
- why it matters: reading down, the first red words a newcomer meets are "Careful—**this one** can change everything" with
  the last-named link being the View link, which cannot change anything. The rule above the warning helps; the pronoun
  does not.
- proposed fix: name the subject.
- copy line: `index.html:364` — current: `Careful—this one can change everything, and there is no spare.`
  proposed: `Careful—the link below can change everything, and there is no spare.`

---

### The way back from a wrong answer is a switch labelled in the wrong direction
- severity: papercut
- environment: desktop, fixture `none` arriving by a Private link, then ⋯ → Lists → ›
- steps: 1. Arrive by a texted link. 2. Answer "Mine, from another device" (the emphasised one). 3. Realise it is not
  yours. 4. ⋯ → Lists → › beside the list.
- evidence: `$OUT/picked-mine-wrongly-desktop.png`, `$OUT/lists-after-wrong-answer-desktop.png`,
  `$OUT/list-detail-desktop.png`; `$OUT/s7.mjs`, output:
  `DETAIL: ‹ | BACK | UNTITLED LIST | × | Mine, from another device | Rename | It's mine after all | On: mine. Off: someone else's, filed under Shared with me, no New keys and no Delete everywhere. | Remove from this device`
- why it matters: the question was two plain answers; the correction is a switch whose label ("It's mine after all")
  states the option the person is trying to leave, so undoing the mistake means turning off a sentence that already reads
  as a decision. The sub-line then explains both states in one dense clause. Lists also prints a truncated key fragment
  under the name ("Untitled list / yNHhDD…"), which reads as noise to someone who has never seen a list id.
- proposed fix: make the detail row mirror the question — the label "Whose list is this?" over the two answers
  ("Mine, from another device" / "Someone else's") rather than a switch.
- copy line: `index.html:441` — `It's mine after all`

---

### "Start again" at the finale does not say what it starts again
- severity: papercut
- environment: phone and desktop, fixture `fresh`
- steps: 1. Cross off all three lines. 2. Read the footer.
- evidence: `$OUT/finale-phone.png`, `$OUT/start-again-phone.png`, `$OUT/finale-desktop.png`; `$OUT/s8.mjs`, output:
  `after Start again: … rows 3 | done 0`
- why it matters: it un-crosses every line. A newcomer can read "Start again" as "make a new list" or "clear this one",
  and the finale is the moment they are least willing to gamble with what they just did.
- proposed fix: say what it does.
- copy line: `index.html:175` — current: `Start again` — proposed: `Bring them all back`

---

### The sync dot on a phone is a coloured dot and nothing else
- severity: papercut
- environment: phone 390×844, fixture `fresh`
- steps: 1. Open a list on a phone. 2. Look at the top bar.
- evidence: `$OUT/first-list-phone.png` — the rail reads `0/3` then a filled orange dot; the word "done" and the status
  text are visually hidden. `$OUT/s6.mjs`: `dot:shown "" aria="Sync status: Synced"`.
- why it matters: on the desktop the dot carries a title and, in the wide layout, a word beside it; on a phone there is no
  hover and no text, so the only always-visible indicator of whether the person's list is reaching anywhere is an
  unlabelled dot that changes colour. A newcomer will not know it is about sync, or that it is worth watching.
- proposed fix: on a phone, keep one word beside the dot when the state is anything but healthy (the space the hidden
  "done" occupies is enough), so a problem announces itself.
- (caveat: every run here used `?transport=local`, so the healthy/unhealthy states I saw are the local transport's. The
  finding is about the label, not the state.)

---

### The Share sheet leads with the key, with the biggest affordance on it
- severity: proposal
- environment: desktop and phone, fixture `fresh`, ⋯ → Share this list
- steps: 1. Open Share with the intent "send my list to my partner". 2. Take the first Copy.
- evidence: `$OUT/share-desktop.png` (a full-width QR code and "COPY LINK" under "OPEN ON MY OTHER DEVICE", with the link
  box showing `…/#/l/<key>/mine`), `$OUT/share-phone.png`
- why it matters: the first block is the Private link, the desktop draws it as a large QR before any other block, and its
  Copy is the first Copy in the sheet. A newcomer who wants to share a list — the ordinary reason to open a sheet called
  Share — will take it. The consequence is not only edit rights (which "Let someone edit" offers deliberately, under a
  warning) but the `/mine` suffix: the friend's device files the list under **My lists** with no question asked, and the
  friend must find Lists → › to correct something they were never told about. The heading "Open on my other device" is the
  only guard, and it is a heading, not a warning.
- proposed fix: keep the four blocks and the order, but let the first block's heading carry a qualifier the way the View
  block does — `Open on my other device  ·  just for you`, in the same muted style as `view only`.
- DECISIONS: 1.4 "The Share sheet, by intent" — "**Four blocks, one sheet, the same links.** Open on my other device
  carries the Private link marked `/mine`; Show it somewhere the View link; Let someone edit the Private link marked
  `/shared` …" I am not arguing with the intent-ordering; I am arguing that the block whose link is the key and whose
  marking silently changes how the receiving device files the list is the one block with no qualifier beside its name.

---

### "Shake to shuffle?" asks a newcomer about a feature they have not met
- severity: proposal
- environment: phone 390×844, fixture `fresh`, first entry into one-thing mode
- steps: 1. Open a list on a phone. 2. Tap the count. 3. Read the bar at the bottom.
- evidence: `$OUT/one-thing-phone.png`; `$OUT/s6.mjs`, output:
  `ONE THING PHONE: … ONE THING AT A TIME. O OR THE COUNT BRINGS THE LIST BACK. | Shake to shuffle? | ALLOW | ×`
- why it matters: this is the same second in which the person accidentally discovered one-thing mode. "Shuffle" has not
  appeared anywhere they have been; the ↻ beside the count is new too. Being asked to Allow something unnamed, stacked
  under a hint explaining the mode they did not mean to enter, is two unknowns at once, and × is remembered as "declined".
- proposed fix: hold the shake hint until the second visit to one-thing mode, or name what it does:
  `Shake the phone for a different line?`

---

## What the first minute does well, and what I could not check

The welcome is the best thing in the app for this lens: a real list with three lines that teach a tap, a line of your own
and the finale, with no tour, no modal and no account — and it behaves exactly as the real thing will, down to the
confetti. The just-in-time marks are well judged (the star's one-line explanation in Everything is the single best piece
of teaching here), the ⋯ menu is short and plainly worded, "How it works" and the ? reference are unusually complete and
honest, and the two links are named for what they do everywhere they appear, which is rare. The refusal on a View link,
the undo on Not today, and the footer hint inside one-thing mode all catch the newcomer at exactly the moment they need
catching. Where the app fails a stranger, it fails at the seams: the ownership question that stands between a texted link
and the list, and the save sheet that has no door.

Not checked: anything on the live server (local transport only, per the brief), so real sync states, the create limit's
"busy" answer and a real slow first paint are untested — the sync dot findings are about labels, not states. Real iOS
Safari and a real Android handset were emulated, not used, so the save sheet's iOS steps, the install hint, the Home
Screen icon, the system share sheet, the haptics and the shake could not be exercised; whether the focus ring on the
whose question's first answer appears on a real touch device is therefore also unconfirmed (it appears on both emulated
phones). The day review card never rendered on a first day (`#review` hidden, `dev.review` unset), so I could not read it
as a newcomer would; nor could I judge sound, which is where a good part of the first minute's character lives. Templates,
History and Export were opened but read only as a newcomer would glance at them, not exercised.
