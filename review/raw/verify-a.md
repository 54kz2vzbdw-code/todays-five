# Verifier A — independent check of C-BUG-1 … C-BUG-4

```
$ pwd
/Users/pricebrannen/Today's Five/todays-five-review-verify-a
$ git -C "/Users/pricebrannen/Today's Five/todays-five-review-verify-a" rev-parse HEAD
[REDACTED]
```
Privacy: that 40-hex commit SHA is the only 22+-character run in this report or its evidence (the closing grep is at the end). No list id appears anywhere: the finder's instruments' output was piped through `sed -E 's/[0-9A-Za-z]{22,}/<id>/g'`, and my own helpers print counts and booleans about "X", never the id.

## How every run was made
- Server: `"$NODE" "<worktree>/tools/serve.js" 8896 "<scratch>/xroot"` in the background (pid recorded in scratch; killed at the end). `xroot/` holds three `git archive` trees on ONE origin: `head/` = 7341981 (1.12, build 216; `cmp` says app.js, panels.js, sync.js, model.js, theme.js, index.html and version.js are byte-identical to the worktree), `old/` = 0e03143 (1.11, build 151), `new/` = 67f35a5 (1.12, build 158). Every BUG-1/3/4 script ran with `BASE=http://127.0.0.1:8896/head/`.
- Playwright + the installed Chrome (`channel: "chrome"`, headless) from the codex runtime (`NODE_PATH` set as instructed). Load was 24–100 throughout; one Chrome-driving script at a time; every script closes its browser; after the runs no Playwright Chrome was left (the Chrome processes on the box belong to the user's own browser, up 2 days; two of my scripts died on a Playwright timeout after their useful steps — node exited and took Chrome with it, checked by `ps`).
- The finder's instruments were copied to scratch and run unchanged with `BASE` pointed at my server, except `a2-crossbuild.mjs`, whose hard-coded port 8895 was changed to 8896 (it ignores `BASE`); that copy is in `verify-a/tools/a2-crossbuild.port-8896.mjs`. Their `lib.mjs` was used as is.
- My instruments (copies in `verify-a/tools/`): `vlib.mjs` (wraps `console.log` with the same redaction; a registry reader that returns counts/booleans; an adaptive "ordinary save" that uses ⋯ → Sound when the menu is there, else the sun/moon, and says which it used), `v-bug1.mjs`, `v-bug2.mjs`, `v-bug2b.mjs`, `v-bug3.mjs`, `v-bug4.mjs`.
- Static reading: the worktree files and `git show <sha>:<file>`; git read-only throughout. I did not read `review/raw/cleanup.md`.

Evidence files (all in `review/raw/verify-a/`): `1-finder-a-crosstab-v2-on-head.log`, `1-verifier-v-bug1-phone-reversed.log`, `2-finder-a2-crossbuild-on-8896.log`, `2-verifier-v-bug2.log`, `2-verifier-v-bug2b-scenarios-B-C.log`, `3-verifier-v-bug3.log`, `4-finder-b-builder-back-on-head.log`, `4-verifier-v-bug4.log`.

---

## C-BUG-1 — a stale `removed` mark in one tab re-removes the list the other tab re-added

**Claim as handed to me.** At 7341981, after *Remove from this device* in tab A of a browser profile, the `removed` mark is held in tab A's memory (`saveDevice()` unions it into storage on every save), so when tab B of the same profile re-adds the list by pasting its link (`?transport=local#/l/<id>` as a navigation, Whose? → mine), tab A's next ordinary save (e.g. `#daynight`) removes the list again from the stored registry; tab B's own next save then drops it from B's registry while it is on B's screen (Lists shows 0 rows); after a reload both tabs raise "Whose list is this?". No `storage` event listener in app.js/panels.js/sync.js.

**What I ran.**
1. The finder's instrument against my server (desktop 1440×900, two pages in one context):
   `cd <scratch>/tools && BASE=http://127.0.0.1:8896/head/ "$NODE" a-crosstab-v2.mjs 2>&1 | sed -E 's/[0-9A-Za-z]{22,}/<id>/g' | tee verify-a/1-finder-a-crosstab-v2-on-head.log`
2. My variation — `cd <scratch> && BASE=http://127.0.0.1:8896/head/ "$NODE" v-bug1.mjs … | tee verify-a/1-verifier-v-bug1-phone-reversed.log`: the phone viewport (390×844, `hasTouch`, `isMobile`, dpr 2 — e2e4's "phone", which the app reads as iOS: Mac UA + touch), the roles reversed (tab **B** removes; tab **A** re-adds by a real navigation to the link and answers Whose? → mine), and two different ordinary saves: B's is *Keep* on the welcome (a new list Y → `registerList` → `saveDevice`), A's is ⋯ → Sound (the mute toggle). Then both reload, and A answers the question it is asked.
3. Static: `grep -nE "\"storage\"|'storage'|onstorage|BroadcastChannel" app.js panels.js sync.js theme.js model.js fx.js sw.js index.html`; `grep -nE "saveDevice\(" app.js panels.js theme.js | wc -l`; `saveDevice` (app.js 75–101), `registerList` (463–470), the Remove handler (panels.js 470–496), `boot` (app.js 399), `askWhose` (364–375), `tickDay`/`tickTheme` (2024–2031, 324–329).

**Raw output (redacted).** The finder's instrument on /head/ reproduced their log step for step:
```
[S2] A: Remove from this device → Remove | storage: {"lists":[],"removed":["<id>"],"unremoved":null,"dead":[],"current":null} | this tab: {"listId":null,"demo":true,"whoseOpen":false,"welcome":true}
[S3] B: pasted X's link as a real navigation | storage: {"lists":["<id>"],"removed":[],…,"current":"<id>"} | this tab: {"listId":"<id>",…}
[S4] A: flip → saveDevice | storage: {"lists":[],"removed":["<id>"],…,"current":null}
[S5] B: flip → saveDevice — X is on B's screen | storage: {"lists":[],"removed":["<id>"],…,"current":"<id>"} | this tab: {"listId":"<id>",…}
    B's Lists panel rows: 0
[S6] B: reload | this tab: {"listId":null,"demo":false,"whoseOpen":true,"welcome":false}
[S7] A: reload | this tab: {"listId":null,"demo":false,"whoseOpen":true,"welcome":false}
page errors A: [] B: []
```
My variation (phone, reversed roles, different saves):
```
[R2] B: Remove from this device → Remove | storage: {"lists":0,"listsHasX":false,"removed":1,"removedHasX":true,…,"current":null} | B: welcome
[R3] A: pasted X's link (Whose? asked=true, answered mine) | storage: {"lists":1,"listsHasX":true,"removed":0,"removedHasX":false,…,"current":"X"} | A shows X
[R4] B: Keep on the welcome → a new list Y | storage: {"lists":1,"listsHasX":false,"removed":1,"removedHasX":true,…,"current":"other"} | B shows Y
[R5] A: ordinary save via ⋯→Sound — X is on A's screen | storage: {"lists":1,"listsHasX":false,"removed":1,"removedHasX":true,…,"current":"X"} | A shows X
    A's Lists rows: 1 | rows of X on A's screen: 3 | #listname: List
[R6] A: reload | this tab: {"listId":null,"demo":false,"whoseOpen":true,"welcome":false}
[R7] B: reload (B holds Y; its URL carries Y's fragment) | B shows Y, no question
[R8] A: answered Whose? → mine a second time | storage: {"lists":2,"listsHasX":true,"removed":0,"removedHasX":false,…,"current":"X"} | A shows X
page errors A: [] B: []
```
Static: the grep's only hits are sync.js:131/135 — the local transport's `BroadcastChannel("tf-local-transport")` for list wake-ups. There is no `storage` listener, and nothing re-reads `tf/v2/meta` into a running tab except `saveDevice`'s own `loadMeta()` union (app.js:77). `saveDevice(` has 48 hits: the definition plus 47 call sites — every Settings toggle, the sun/moon, theme picks, volume, mute, wake, one-thing mode, shake, the hints, the what's-new and install-hint dismissals, `openList` (app.js:492, so switching lists), `showWelcome` (586), Keep/New list, Rotate, Delete — and `tickDay` (every 60 s, app.js:2031) → `tickTheme` → `if (T.settleHold(dev, envNow())) saveDevice()` (app.js:326): a save with no user action when a held slot settles.

**Verdict: HOLDS.** Reproduced with the finder's instrument and independently with the roles reversed, on the phone viewport, and with two other ordinary saves (starting a new list from the welcome; the mute toggle). The mechanism is what was claimed: `saveDevice` (app.js:85) unions `stored.removed` with the tab's in-memory `meta.removed`; only `registerList` in the *same* tab clears the mark (app.js:466 → `unremoved`), so the tab that removed the list carries the mark for its lifetime and writes it back on every save. The one part that is sequence-dependent: "after a reload both tabs raise Whose?" held in the finder's sequence (tab A sat on the welcome with no fragment, so its boot fell through to `meta.current`, which B had set to X); in my variation the tab that removed X later held Y and reloaded onto Y's fragment, so only the re-adding tab was asked. The claim's substance is unaffected.

**What my instrument cannot see.** Only the local transport; on the real one `syncStatus === "gone"` changes just the `current` line of `saveDevice` (app.js:98), not the removal. Two tabs of one profile, not two devices — which is the case claimed.

**Anything that changes the severity.**
- It is reachable by a person doing what the app tells them: the Remove sheet says "you'll need [the link] again to open it here", so pasting the link back — in a new tab while the old one is still open — is the documented way back. Two tabs of one browser is a designed-for case (DECISIONS.md:40: "Two tabs of one browser merge on write … and union the registry"), and this release's CHANGELOG (line 25) says the *other* direction of this hand-back was found and fixed in 1.12 — this is the unfixed half of that fix. (How-it-works' "Second screen", panels.js:1034, is the View link on another device — not this case.)
- Silent in both tabs: the re-adding tab keeps the list on screen and usable until it reloads; only Lists (0 or 1 rows) and the reload betray it. The stale tab needs no deliberate act: 47 call sites plus the minute-timer path; whichever tab saves last wins.
- Recovery costs another "Whose list is this?" (R8 shows answering restores it) — and that dialog files the list as *Someone else's* when closed any way but by an answer (app.js:370–371), which strips New keys / Delete everywhere from the person's own list.
- The mark is never pruned from `tf/v2/meta.removed` (still present after two reloads — BUG-3), so the stale tab is not its only long-lived copy.

---

## C-BUG-2 — a 1.11 tab left open across the deploy undoes a 1.12 removal

**Claim as handed to me.** A tab running the 1.11 build (0e03143) that stays open across the deploy and shares the origin with a 1.12 tab (67f35a5) undoes a removal made in the 1.12 tab on its next save (its `saveDevice` writes back the stale `removed: []` it loaded and re-unions the list); the tabs ping-pong on alternate saves; after the 1.12 tab reloads the removed list is open again.

**What I ran.**
1. `git show 0e03143:app.js | awk '/^function saveDevice\(\)/{p=1} p{printf "%d\t%s\n", NR, $0} p&&/^}/{exit}'` — the 1.11 `saveDevice` is lines 75–94 of that file. The load-bearing lines, quoted:
```
77	  const stored = loadMeta();
78	  const undead = new Set(meta.undead || []); // an id this tab brought back (the ten-second undo after Delete everywhere): the dead mark goes, in storage too
79	  const dead = new Set([...(stored.dead || []), ...(meta.dead || [])].filter(id => !undead.has(id)));
81	  const byId = new Map();
82	  for (const l of [...(stored.lists || []), ...(meta.lists || [])]) if (l && l.id && !dead.has(l.id)) byId.set(l.id, { ...(byId.get(l.id) || {}), ...l });
83	  meta.lists = Array.from(byId.values());
93	  saveMeta(meta);
```
   `\bremoved\b` occurs once in 0e03143's app.js (unrelated prose) and never in its model.js; its `registerList` (456–461) has no clearing step. So a 1.11 tab filters only `dead` (82), re-unions any entry its memory still holds, and `saveMeta(meta)` (93) writes its whole in-memory object — including whatever `removed` value it loaded, `[]` or none — over the 1.12 tab's `removed: [X]`. 1.11's own *Remove from this device* is an `archived` flag with no confirmation sheet (0e03143 panels.js:422–429), which 1.12's `normalizeRegistry` (model.js:856–870) "finishes on read" into `removed`.
2. The finder's instrument on my root (old/ = 0e03143, new/ = 67f35a5, one origin): `cd <scratch>/tools && "$NODE" a2-crossbuild.mjs … | tee verify-a/2-finder-a2-crossbuild-on-8896.log` (the port-patched copy).
3. My `v-bug2.mjs` → `verify-a/2-verifier-v-bug2.log`, scenario A: 0e03143 paired with **7341981** (the commit under review, not 67f35a5), ⋯ → Sound as the 1.11 tab's save, and a different order — the 1.11 tab saves twice in a row, the head tab once, the 1.11 tab a third time, then both reload. (Its scenario B died at once: 1.11 has no Remove sheet, and my helper waited for one.)
4. My `v-bug2b.mjs` → `verify-a/2-verifier-v-bug2b-scenarios-B-C.log`, scenario B: the *1.11* tab does the removing (its archive flag), the head tab saves, the 1.11 tab saves, the head tab reloads. Reached B5, then died on the "Whose list is this?" dialog the head tab raised (which is itself the finding); B6/B7 and scenario C (one 1.11 save, then an immediate 1.12 reload) did not run — C is the same sequence as A7 and the finder's X7, which both ran.

**Raw output (redacted).** The finder's instrument reproduced their log step for step:
```
[X2] N (1.12): Remove | storage: {"lists":[],"removed":["<id>"],…,"current":null}
[X3] O (1.11): flip → its saveDevice | storage: {"lists":["<id>"],"removed":[],…,"current":"<id>"}
[X4] N (1.12): flip | storage: {"lists":[],"removed":["<id>"],…,"current":null}    O's Lists rows: 1 | removed-group rows: 0
[X5] O (1.11): another flip | storage: {"lists":["<id>"],"removed":[],…,"current":"<id>"}
[X7] N: reload | this tab: {"version":"1.12","listId":"<id>","demo":false}
```
Mine, scenario A (0e03143 vs 7341981):
```
[A2] N (head): Remove | {"lists":0,"listsHasX":false,"removed":1,"removedHasX":true,…,"current":null}
[A3] O (1.11): ⋯→Sound | {"lists":1,"listsHasX":true,"removed":0,"removedHasX":false,…,"current":"X"}
[A4] O (1.11): ⋯→Sound again | same as A3
[A5] N (head): sun/moon | {"lists":0,"listsHasX":false,"removed":1,"removedHasX":true,…,"current":null}
[A6] O (1.11): ⋯→Sound | {"lists":1,"listsHasX":true,"removed":0,"removedHasX":false,…,"current":"X"}
[A7] N: reload | this tab: {"version":"1.12","listId":"X","demo":false,"whoseOpen":false}   ← the removed list is open again
[A8] O: reload | this tab: {"version":"1.11","listId":"X"}
```
Mine, scenario B (the 1.11 tab removes; `archivedFlags` = the stored entries' `archived` flags, `removedKeyPresent` = whether `removed` exists in storage):
```
[B2] O (1.11): Remove (archives, no sheet) — {"archivedFlags":[true],"removedKeyPresent":true} | {"lists":1,"listsHasX":true,"removed":0,…,"current":null} | O: welcome
[B3] N (head): ⋯→Sound — {"archivedFlags":[],"removedKeyPresent":true} | {"lists":0,"listsHasX":false,"removed":1,"removedHasX":true,…,"current":"X"} | N still shows X
[B4] O (1.11): sun/moon — {"archivedFlags":[true],"removedKeyPresent":true} | {"lists":1,"listsHasX":true,"removed":0,"removedHasX":false,…,"current":null}
[B5] N: reload — {"archivedFlags":[true],"removedKeyPresent":true} | this tab: {"version":"1.12","listId":null,"whoseOpen":true}   ← asks Whose? for the list it had open
```

**Verdict: HOLDS.** Every element of the claim reproduced: the 1.11 tab's first save re-unions the list and writes `removed` back as `[]` (A3/B4: the key is present with 0 entries, not deleted); the tabs alternate (A3–A6, X3–X5); the 1.12 tab's reload opens the removed list again (A7, X7) because the 1.11 tab also wrote `current` back. It holds against 7341981 as well as 67f35a5, and with a different save and order.

**What my instrument cannot see.** Whether a 1.11 tab actually survives a deploy on the live origin (sw.js's update strategy, a person leaving a tab open); serving both builds as subdirectories of one origin shares localStorage the way a deploy does but exercises no service-worker update. B6/B7 and scenario C did not run (see above).

**Anything that changes the severity.** Bounded to the window in which an old tab is still alive; once every tab is 1.12 the person merely has to remove the list again. But it is silent in both tabs, and the 1.12 tab's own reload puts the "removed" list straight back on screen. Not stated by the finder: the fight runs in the other direction too — a 1.11 tab's own Remove (its archive flag) is "finished" into `removed` by the head tab's next save *while the head tab is showing that list* (B3: `listId: "X"` with storage `lists: 0`), restored archived by the 1.11 tab's next save (B4), finished again on the head tab's reload, which then asks "Whose list is this?" for a list it had open (B5).

---

## C-BUG-3 — Remove from this device leaves the plaintext local copy behind

**Claim as handed to me.** After *Remove from this device* (past the 10 s Undo window and across a reload), the list's decrypted local copy `tf/v3/list/<id>` remains in localStorage (~857 bytes, plaintext, keyed by the link's secret) and the id remains in `tf/v2/meta.removed`; the sheet says "This device forgets the link". `sync.js` exports `removeLocal`, used by Delete-everywhere and not by Remove.

**What I ran.**
1. The finder's `a-crosstab-v2.mjs` (above) — its S0/S2/S7 lines.
2. My `v-bug3.mjs` → `verify-a/3-verifier-v-bug3.log`: desktop — the key set, the copy's `length` and its UTF-8 byte count (`TextEncoder`), its line count and how many characters of line text are readable, the registry, and the toast, at M0 (fresh), M1 (+1.5 s after Remove, Undo on screen), M2 (+11.5 s), M3 (after a reload), M4 (after a second reload); the sheet's sentence read from `#ask-msg`. Then the phone viewport with two lists, removing the one NOT open (N1), +11.5 s and a reload (N2), and *Delete this list everywhere* on the other as the control (N3).
3. Static: `git grep -n removeLocal 7341981 -- '*.js'`; `grep -nE "Object\.keys\(localStorage\)|localStorage\.key\(|tf/v3/list|K\.list\(" app.js sync.js panels.js model.js` (is there any sweep of orphaned rows?); crypto.js 72–78 (what the id is); panels.js:475 (the sentence).

**Raw output (redacted).**
```
[M0] fresh | keys: ["tf/v2/localserver/<id>","tf/v2/meta","tf/v2/themecss","tf/v2/themerev","tf/v3/list/<id>"] | local copy of X: {"present":true,"chars":857,"utf8Bytes":857,"topKeys":["doc","rev","dirty","created","mode","savedAt"],"lines":3,"linesWithPlaintext":3,"plaintextChars":79}
    the sheet's sentence: "The server and your other devices keep it. This device forgets the link, so you'll need it again to open this list here."
[M1] +1.5 s after Remove | same keys | local copy: present, 857/857, 3 lines, 79 plaintext chars | registry: {"lists":0,"removed":1,"removedHasX":true,…} | toast: {"on":true,"undoHidden":false,"msg":"Removed from this device"}
[M2] +11.5 s | same | toast: {"on":false,"undoHidden":true}
[M3] after a reload | same keys, same copy | registry: {"lists":0,"removed":1,"removedHasX":true,…}
[M4] after a second reload | same
[N1] phone, two lists, removed the one not open | local copy of X1: present, 857 | registry: {"lists":1,"listsHasX":false,"removed":1,"removedHasX":true} | open: X2
[N2] +11.5 s, reload | local copy of X1: present, 857 | open: X2 | whoseOpen: false
[N3] control — Delete everywhere on X2 | keys: ["tf/v2/localserver/<id>","tf/v2/meta","tf/v2/themecss","tf/v2/themerev","tf/v3/list/<id>"] | local copy of X2: {"present":false} | local copy of X1 (removed earlier): present, 857 | dead-has-X2: true
page errors: [] (both contexts)
```
Static: `removeLocal` is exported at sync.js:35 (`remove(K.list(id))`) and called from exactly two places — panels.js:385 (New keys, the *old* id) and panels.js:986 (Delete everywhere); the Remove handler (panels.js 470–496) never calls it. No code enumerates localStorage or sweeps `tf/v3/list/*`. crypto.js:73–78 `fromWrite(W)` returns `{ mode: "edit", id: W, … }` — the id in the key is the edit link's secret W, the very string a `#/l/<W>` link carries (a view link's copy is keyed by R).

**Verdict: HOLDS, exactly.** 857 chars = 857 UTF-8 bytes for the seed document (a person's own list differs in size, not in kind); present and unchanged at +1.5 s, +11.5 s, after one and two reloads; the id stays in `tf/v2/meta.removed`; the sentence is verbatim; the only two callers of `removeLocal` are the ones claimed; the control shows Delete everywhere does remove the same key.

**What my instrument cannot see.** `tf/v2/localserver/<id>` (also left behind) is the local transport's test double of the server and has no counterpart on the real transport. Whether the browser ever evicts the origin's storage is outside the app.

**Anything that changes the severity.**
- "This device forgets the link" is untrue in the stored sense: the link's secret is the storage key and the plaintext lines sit under it, readable by anyone with the device's storage (a shared computer, a backup, devtools). It is worst for a list *shared with* this device, for which the sheet is the documented way out (How it works: "Remove from this device is the way out"), and the sharer's list stays on the machine that was told to forget it.
- Functional coupling with BUG-1: boot (app.js:399) opens `meta.current` only if `loadLocal(current)` exists. Had Remove dropped the copy, a tab whose `current` still pointed at the removed list would land on the welcome instead of re-opening it and asking "Whose list is this?" (S6/S7, R6).
- A fix has to respect the ten-second Undo (panels.js 488–495 re-registers the entry) and offline use — drop the copy when the window ends, not at the tap.

---

## C-BUG-4 — ‹ Back from the builder on step two lands on Day theme, with a spare frame

**Claim as handed to me.** ⋯ → Theme → pick Paper (now on the Night step) → *Make your own* → ‹ Back lands on the header **Day theme** with `window.__tf().panels` = `["p-menu","p-theme","p-theme"]`, rather than Night theme with `["p-menu","p-theme"]`; a second Back → Day theme `["p-menu","p-theme"]`; a third → the menu. Control: Settings → Appearance → Day → builder → Back → Day theme `["p-menu","p-settings","p-theme"]`.

**What I ran.**
1. The finder's instrument: `cd <scratch>/tools && BASE=http://127.0.0.1:8896/head/ "$NODE" b-builder-back.mjs … | tee verify-a/4-finder-b-builder-back-on-head.log`.
2. My `v-bug4.mjs` → `verify-a/4-verifier-v-bug4.log`, seven scenarios, each in a fresh context: V1 Day slot on (colorScheme light), Back button; V2 Night slot on, Back by **Escape**, picking the first day swatch that is not the current one; V3 Night slot on, Back by **`history.back()`** (the browser's own Back); V4 the phone viewport, Back button; V5 **step one's** builder (⋯ → Theme → Make your own → Back); V6 control from Settings → Appearance → **Night**; V7 contrast: Back from step two itself, no builder. Each line records the header, `panels`, the open panel, `data-theme`, the slot on, day/night codes, and whether the partner chip is hidden.
3. Static: panels.js:38 (the `p-theme` opener), 60–77 (`openTheme`/`openThemeFlow`), 143–156 (`choose`), app.js 1796–1849 (`showPanel` with `restack`, `popPanel`).

**Raw output (redacted).** The finder's instrument reproduced their log line for line (B0–B5, C0–C1). Mine:
```
=== V1 Day slot on (light), Back button
[1] picked Paper on step one | header: Night theme | panels: ["p-menu","p-theme","p-theme"] | partner chip hidden: false   ← the pre-builder state
[2] Make your own | panels: ["p-menu","p-theme","p-theme","p-builder"]
[3] Back via button | header: Day theme | panels: ["p-menu","p-theme","p-theme"] | day/night: T1:curated:paper / T1:curated:dark | partner chip hidden: true
[4] Back again | header: Day theme | panels: ["p-menu","p-theme"]
[5] Back again | panels: ["p-menu"] | open: p-menu
=== V2 Escape, other day theme / V3 history.back() / V4 phone: [3] Day theme ["p-menu","p-theme","p-theme"], [4] Day theme ["p-menu","p-theme"], [5] ["p-menu"] — identical in all three
=== V5 step one's builder: [2] Back | header: Day theme | panels: ["p-menu","p-theme"]; [3] Back | ["p-menu"]   ← fine
=== V6 control Settings → Appearance → Night: [1] Back | header: Night theme | panels: ["p-menu","p-settings","p-theme"]   ← fine
=== V7 Back from step two itself: [0] Night theme ["p-menu","p-theme","p-theme"] → [1] Day theme ["p-menu","p-theme"]   ← the flow's own one-Back rule
page errors: [] in every scenario
```

**Verdict: HOLDS on the behaviour; PARTLY on the stated expectation.** The observed sequence is exactly as claimed on every input path (the Back button, Escape, the browser's own history Back), with either slot on, and on the phone; step one's builder and both Settings controls are fine. But the "rather than" half is mis-stated: the state the builder was opened from is step two — header **Night theme** with panels `["p-menu","p-theme","p-theme"]` (the restacked Day frame is meant to be underneath; B1/V·1) — and that, not `["p-menu","p-theme"]`, is what one Back should restore. `["p-menu","p-theme"]` with Day theme is where the *second* Back belongs (V7: Back from step two → step one, one frame fewer). Mechanism, panels.js:38: the opener registered for restoring a `p-theme` frame is `() => { if (flow) { flow.step = 1; return openTheme("day", { inFlow: true }); } … }` — every restore of a `p-theme` frame during the two-step flow is treated as "Back from step two", including the step-two frame under the builder; `popPanel` (app.js:1835–1849) hands the opener only the frame's id, so it cannot tell the two frames apart.

**What my instrument cannot see.** Real iOS Safari's history-unwind timing (headless Chrome, 800 ms after each Back). Nothing else: the state is deterministic and read from `window.__tf().panels` and the header.

**Anything that changes the severity.** Low — nothing is lost: the day theme picked stays picked (day/night codes unchanged), no page errors. Slightly worse than stated: the leftover frame means three Backs (or Escapes) from the builder to reach the menu instead of two, and the partner chip offered for Night on step two is gone after the Back (`partner chip hidden: false → true`), so the person who went to the builder to look and came back has to find Night's theme unaided.

---

## Closing checks
- Server on 8896 stopped (pid from scratch); no Playwright Chrome left running.
- `grep -rnE '[0-9A-Za-z]{22,}'` over this report and `verify-a/`: output appended below by the closing command — expected to list only the commit SHA in this report's header.

```
$ grep -rnoE '[0-9A-Za-z]{22,}' verify-a.md verify-a/
verify-a.md:7:[REDACTED]
```
One hit: the commit SHA on line 7 (40 hex characters — a git object id, not a 22-character base62 list id; required by the brief's opening lines). Nothing in the evidence directory matches.
- Playwright Chrome after my last run: orphans of my own scripts (parent gone) found: none; headless Chrome still alive that belongs to a live process of another session (not mine, left alone): 2.
