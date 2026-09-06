# Today's Five 1.7 audit — the Copy lens

Every user-facing string in index.html, app.js, panels.js, model.js, about.html, whatsnew.json, read as someone who
has never seen the app. Evidence is in this directory; the scripts that made it are shots.mjs, shots2.mjs, shots3.mjs,
skip.mjs (phone 390x844, longtime / fresh / none fixtures, ?transport=local).

### The Share sheet's danger warning points at the wrong link
- severity: blocker
- environment: phone 390x844, fixture fresh; same markup everywhere
- steps: 1. Menu -> Share this list. 2. Scroll past "Open on my other device" and "Show it somewhere". 3. Read the red line.
- evidence: share-phone.png, share-private-phone.png
- why it matters: "Careful—this one can change everything, and there is no spare." sits ABOVE the heading it belongs to.
  On screen the sentence follows the View link's Copy buttons, so "this one" points backwards at the View link — the one
  link that cannot change anything. The block that actually hands out the Private link first ("Open on my other device")
  carries no caution at all. The Private link is the only key and there is no spare.
- proposed fix: put the warning under its heading and name the link. Under <h3>Let someone edit</h3>: "Careful: the
  Private link can change everything, and there is no spare." Repeat the same sentence in #share-mine.
- copy line: index.html:364 (warning), index.html:365 (heading), index.html:344-350 (uncautioned block)

### "Skip — start my list" keeps the three tutorial lines
- severity: bug
- environment: phone 390x844, fixture none
- steps: 1. Open with no list. 2. Tap "Skip — start my list". 3. Save sheet -> I've saved it.
- evidence: welcome-phone.png, skip-save-sheet-phone.png, skip-result-phone.png; skip.mjs output:
  lines after Skip: ["Tap or click to cross this off","Add a line of your own","Cross off all three and see"]
- why it matters: "start my list" promises an empty list of my own. What arrives is the demo verbatim as the first real
  list. The code says so: "// Skip is Keep without the play: the same three lines, as they stand".
- proposed fix: "Skip the demo — keep these lines"
- copy line: index.html:162; behaviour at app.js:1902

### Settings shows the streak beside History and calls it days of history
- severity: bug
- environment: phone 390x844, fixture longtime
- steps: 1. Menu -> Settings -> Lists. 2. Chip beside History reads "91 DAYS". 3. Open History: "91-day streak".
- evidence: settings-bottom-phone.png, history-phone.png
- why it matters: "History · 91 days" says you have 91 days of history. The number is the streak.
- proposed fix: set the chip to `${s}-day streak`, so Settings reads "History · 91-day streak".
- copy line: app.js:971 and panels.js:508 (both write #streak-k), row at index.html:247

### "It's mine after all" never changes, and is wrong for half the lists that show it
- severity: bug
- environment: phone 390x844, fixture longtime
- steps: Menu -> Lists -> the chevron beside "Sam's trip".
- evidence: shared-list-detail-phone.png; shots3.mjs output shows the label plus both sub-states.
- why it matters: #list-detail-origin-lb is written once in markup and never touched by JS (the id appears only at
  index.html:441), while the sub-line swaps per state. The row reads "It's mine after all" whether you are claiming a
  shared list or giving your own away — with the switch already ON in the second case.
- proposed fix: label "Mine". Subs: shared -> "On: filed under My lists, with New keys and Delete this list everywhere.
  Off: filed under Shared with me."; mine -> "On: filed under My lists. Off: filed under Shared with me, with no New
  keys and no Delete this list everywhere."
- copy line: index.html:441; subs at panels.js:398

### "Lists can change it later" — the one question a stranger cannot avoid
- severity: bug
- environment: phone 390x844, fixture none, arriving by an unknown link
- steps: Open ?transport=local#/l/<an id this device has never seen>.
- evidence: dead-link-phone.png
- why it matters: the reader parses "Lists" as the plural noun and gets nonsense. It is a panel name in subject
  position, and this dialog cannot be dismissed.
- proposed fix: "Yours from another device, or one somebody sent you. You can change this later in Lists."
- copy line: index.html:522

### "This link can't read this list"
- severity: bug
- environment: the unreadable sync state (read from source, not reproduced)
- evidence: app.js:135; rendered into the dot's title and aria-label at app.js:997-999
- why it matters: links do not read. The sentence gives agency to the wrong thing and leaves no way forward.
- proposed fix: "This link can't open this list"
- copy line: app.js:135

### The welcome's bad-link error is a URL grammar lesson
- severity: bug
- environment: phone 390x844, fixture none
- steps: Welcome -> "Already have a list? Paste your link" -> paste anything -> Open.
- evidence: welcome-paste-phone.png, welcome-bad-link-phone.png
- why it matters: "It ends in #/l/ or #/r/ followed by 22 letters and digits" is addressed to someone who reads URLs for
  a living, on the screen where nothing has been explained. Lists says something different for the same case.
- proposed fix: one string for both: "That doesn't look like a list link. Paste the whole address, including the part
  after the #."
- copy line: app.js:1907; twin at panels.js:439

### "rollover" is the plumbing's name for something the app already says plainly
- severity: papercut
- environment: phone 390x844, fixture longtime
- evidence: settings-bottom-phone.png, help-bottom-phone.png, line-menu-phone.png
- why it matters: the app has "Back on Today tomorrow" (index.html:487) and "Not today. It's back on Today tomorrow."
  (app.js:1172), then four other places say "tomorrow's rollover". Nothing defines a rollover.
- proposed fix: index.html:238 -> "The line comes back tomorrow"; app.js:729 -> "Not today: back on Today tomorrow";
  panels.js:832 -> "...goes to History at the start of the next day..."; panels.js:833 -> "...until tomorrow";
  panels.js:869 -> "Not today: the line leaves Today until tomorrow (Settings -> Behavior turns it off)".
- copy line: index.html:238, app.js:729, panels.js:832, panels.js:833, panels.js:869

### One place, three names: Removed lists / Removed from this device / Lists -> Removed
- severity: papercut
- evidence: settings-bottom-phone.png, lists-phone.png, removed-lists-phone.png, help-bottom-phone.png
- why it matters: the toast is an instruction naming a place that exists under no such name.
- proposed fix: Settings row -> "Removed from this device"; toast -> "...—Lists brings it back."; help the same.
- copy line: index.html:246, index.html:417, panels.js:383, panels.js:839

### "Remove from this device" never says which list, under a heading of nearly the same words
- severity: papercut
- evidence: lists-phone.png
- why it matters: a section headed "Removed from this device" (a place) sits three rows above a button reading "Remove
  from this device" (an act on the open list, named nowhere). Its neighbour manages "Rename this list".
- proposed fix: "Remove this list from this device"
- copy line: index.html:422; heading at index.html:417

### Two identical "Copy link" buttons on the Share sheet, for two different links
- severity: papercut
- evidence: share-phone.png
- why it matters: the first copies the Private link, the second the View link; the fields differ by /#/l/ vs /#/r/ and
  are too narrow to show the end. The third block already says "Copy private link", so the sheet is inconsistent.
- proposed fix: "Copy the Private link" / "Copy the View link" / "Copy the Private link".
- copy line: index.html:349, 358, 369

### Straight quotes in one Settings row; curly everywhere else
- severity: papercut
- evidence: settings-bottom-phone.png
- proposed fix: Swipe left for “Not today”
- copy line: index.html:238

### "view only" is spelled three ways
- severity: papercut
- evidence: index.html:121 (view only), app.js:135 (View only), panels.js:349 (view-only)
- proposed fix: "View only" in the sync label and the Lists tag; the rail pill keeps its lower-case styling.
- copy line: index.html:121, app.js:135, panels.js:349

### Two names for the same button: "+ New line" and "+ Add"
- severity: papercut
- evidence: today-phone.png, everything-phone.png
- proposed fix: "+ New line" in a section too.
- copy line: index.html:146, app.js:881

### Every list row wears six characters of its id
- severity: papercut
- evidence: lists-phone.png ("Work · MX8U7b… ›")
- why it matters: an unlabelled id fragment is the second most prominent thing on each row, and the same column on a
  removed row holds the word "Restore" — one column, an identifier in one group and a verb in the other.
- proposed fix: drop the id fragment; the chevron already says there is more.
- copy line: panels.js:351

### "New keys. The old links aren't revoked yet; that retries on its own."
- severity: papercut
- evidence: panels.js:303; the confirm it follows is new-keys-ask-phone.png
- why it matters: "revoked" appears nowhere else; the second half spends itself on the mechanism.
- proposed fix: "New keys. The old links haven't stopped working yet—this device keeps trying."
- copy line: panels.js:303

### About page: a stale version number and a word the app retired
- severity: papercut
- evidence: about.html:70, about.html:92; version.js:4 says 1.5; settings-bottom-phone.png shows "1.5 (build 76)"
- why it matters: the About page is the page that asks to be believed. "Rotating" is the pre-1.3 name for New keys.
- proposed fix: "Version 1.5"; "New keys deletes the old encrypted blob at once."
- copy line: about.html:70, about.html:92

### Small drift and telegraphese, collected
- severity: papercut
- evidence: settings-bottom-phone.png, share-private-phone.png, lists-phone.png, welcome-phone.png, export-phone.png
- copy line: index.html:256 (Export & import sub), app.js:998 ("Sync status: Sync off"), panels.js:580 ("Handed to the
  share sheet"), index.html:164 and index.html:427 (paste placeholders), model.js:566 ("Tap or click"), panels.js:789
  and panels.js:398 ("Delete everywhere" vs "Delete this list everywhere")

### Proposal: give the New keys block a heading, and say why anyone would want it
- severity: proposal
- evidence: share-private-phone.png, share-bottom-phone.png
- why it matters: four blocks have a heading saying what you are doing; the fifth is a bare button and a grey line that
  repeats the button's own words, describing only the damage.
- proposed fix: add <h3>Start over with new links</h3> and use the confirm dialog's own sentence: "A new View link and a
  new Private link replace the current ones. The old links stop working everywhere."
- copy line: index.html:377-380

### Proposal: the ⋯ row called "Theme" opens Settings
- severity: proposal
- evidence: menu-phone.png, settings-phone.png; app.js:1785 and panels.js:467
- why it matters: argues with DECISIONS.md:315 ("The ⋯ row keeps the label "Theme" with the theme that is on as its
  state, and opens Appearance"). What changed since: the destination now has a name the app uses twice elsewhere — the
  keys sheet ("⇧ T · Appearance: the Day and Night themes, and the switch", panels.js:867) and How it works ("Settings
  -> Appearance holds both slots and the switch", panels.js:861). "Theme" is the only name for that place the place
  itself does not use.
- proposed fix: label the row "Appearance"; the state chip already names the theme.
- copy line: index.html:198

## Table: string · where · problem · rewrite
(see the findings above; grouped by panel in the returned report)
