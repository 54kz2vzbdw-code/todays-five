# VERIFIER W1 — independent check of five Watch findings at 7341981

Worktree `/Users/pricebrannen/Today's Five/todays-five-review-verify-b`, HEAD `7341981 (full hash in commands.txt)` (detached, read-only, `git status` clean).
Evidence: `review/raw/verify-w1/` — `commands.txt` (exact commands, build-slot lines with load), `greps.txt` (raw grep output), `f1-probe/` + `f1-probe.log` (W-F1), `w1probe/` + `w1probe.log` (W-F2/W-F4/W-F5). Load during the work: 14/30/44 at start, 3.6/7/21 at the builds (1 s and 7 s).
Method: for each finding I read the code path and wrote the prediction down first, then measured. Line numbers below are from `awk '{print NR, $0}'` on the worktree files. Nothing here was driven on a wrist or a simulator; every "cannot see" line says what would settle it.
Note on spelling: a few long *non-secret* identifiers (`scheduleBackground­Refresh`, `kSecAttr­Synchronizable`, …) are written with a soft hyphen so the privacy grep runs clean.

---

## W-F1 — the complication shows yesterday's count from the 00:01 reload until the app runs

**Claim.** `SnapshotTimeline.entries` returns `[now → 3/5, midnight → 0/2]` with `.after(midnight+60 s)`; the 00:01 reload re-reads the same file, takes the `midnight > now` else-branch and returns one entry with the *unrolled* `3/5`; every hourly reload repeats it. The header (`:5`, `:10`), `PLAN-apple-phase3.md:244`, `DECISIONS-apple.md:742–743` say the face is "right through the night with nothing running".

**Prediction from the code** (`apple/TodaysFive/…Complications/ComplicationsProvider.swift:52–65`, `Shared/WatchSnapshot.swift:156–163`). `first` is built from the snapshot as read (`:54`). `rollsAt > 0` and `midnight > now` → two entries, the second `snapshot.afterRollover` (`:62`), policy `.after(midnight + 60)` (`:64`). Nothing in the extension writes the file; `afterRollover` sets `rollsAt = 0` (`:161`) only on the in-memory second entry. So at 00:01 the file still carries the old `rollsAt`; `midnight > now` is false; `:60` returns `[first]` = the unrolled counts, `.after(+1 h)`; and the same at every later reload, including 09:00. Predicted: the face is right only between midnight and the first reload after it.

**What I ran.** A standalone `swiftc` build of the *real* `WatchSnapshot.swift` (copied verbatim) plus lines 44–65 of the provider extracted with `sed` (unedited; `f1-probe/Entries.swift`) with the two WidgetKit types stubbed, driven by `f1-probe/main.swift` with the same snapshot passed at every `.after` date (the app never runs). Raw output `f1-probe.log`; the decisive lines:
```
S1 Chicago  written 09-08 22:00 3/5 rollsAt 09-09 00:00
  getTimeline(now 09-08 22:00:00): [22:00:00→3/5, 00:00:00→0/2] policy=after(00:01:00)
  getTimeline(now 09-09 00:01:00): [00:01:00→3/5]               policy=after(01:01:00)
  getTimeline(now 09-09 01:01:00): [01:01:00→3/5]               policy=after(02:01:00)
  [at 09:00 next morning]        : [09:00:00→3/5]               policy=after(10:00:00)
  [now == rollsAt exactly]       : [00:00:00→3/5]               policy=after(01:00:00)
S2 Tokyo (UTC+9), S3 Kolkata (UTC+5:30): identical shape (the arithmetic is epoch ms; the zone only sets rollsAt)
S4 rollsAt two days stale, now 09-09 10:00: [10:00:00→3/5] after(11:00) — never rolled, ever
S7 viewOnly=true: [22:00→3/5, 00:00→0/2] — the function ignores viewOnly
```
The finder's `probe.log` §(g) shows the same four lines; my instrument differs in that it compiles the real `afterRollover` rather than a stub, and adds the zones, the stale case, the boundary and the view-only case.

**Verdict: HOLDS.** Code-structural and measured. Two sharpenings: (1) the failure is not "from 00:01" but "from whenever WidgetKit performs the reload the code asks for at 00:01" — the more punctual WidgetKit is, the shorter the face is right; (2) the boundary is exact: a snapshot published at the rollover instant itself (`now == rollsAt`) is already unrolled.

**What my instrument cannot see.** (a) WidgetKit's treatment of `.after` — it is a request, budgeted and possibly late; lateness only *delays* the regression, it cannot prevent it, because the entries array ends at midnight and WidgetKit reloads at or after the policy date. (b) Whether the daily background refresh lands: `WatchStore.swift:287–298` asks `WKApplication.scheduleBackground­Refresh(withPreferredDate: <that midnight>)`, requested at launch (`WatchApp.swift:52`) and re-armed in `wokeInBackground()` (`:284`); if it is honoured, `wokeInBackground()` rolls over, syncs, `publish()`es a fresh snapshot with the rolled counts and next `rollsAt`, and calls `reloadAllTimelines()` (`:594–611`) — the face is then right. The code's own comment says watchOS "may honour it late" (`:288–289`); nothing here can say how often it lands on a watch charging overnight. (c) A phone send overnight (`.backgroundTask(.watchConnectivity)`, `WatchApp.swift:115–117`) would also correct it. So the window is: from the first post-midnight reload until the first of {background refresh lands, phone sends, app opens}. The header's promise is precisely the case where none of those happen, and in that case it is false.

**Severity.** Unchanged (bug). The fix is small — the `midnight <= now` branch should hand out `afterRollover` whenever `rollsAt > 0` (one rollover is right for any staleness ≥ one midnight, modulo W-F5) — which is worth saying because the header calls this "the failure this file exists to prevent".

---

## W-F2 — `AddCoordinator.onChange` is never assigned; `WatchStore.add` has no caller; the + writes past the on-screen model

**Claim.** Declared `AddFlowView.swift:53`, called `:71`, `:89`, never assigned; `WatchStore.swift:509–510`'s "Track C's `AddFlowView` calls this, and so does the App Intent" is false; both call `AddService.live().add`; the on-screen `doc` is not told until `WatchStore.sync()` runs from `start()`, `linksChanged()`, `sceneBecameActive()` or `wokeInBackground()`; offline, the dirty record sits on disk in no engine's memory until a relaunch or list switch; in `-TFWatchDemo` the + cannot reach the demo list.

**Prediction from the code.** All of it, plus one thing the claim does not examine: whether the Watch engine's later `persist()` *clobbers* the queued add on disk. `SyncEngine.persist()` (`:312–315`) calls `ListStore.merge` (`Store.swift:88–111`), which merges documents and ORs `dirty`, so I predicted the add survives on disk but stays out of the Watch engine's memory — and that the Watch's next online sync pushes its own stale doc, not the add.

**What I ran (structural).** `greps.txt`: every `onChange` in `apple/` (tests included) — the only assignment is `WatchStore.swift:187 receiver.onChange = …`; `AddCoordinator` is referenced outside its file only at `AddToTodaysFive.swift:340` (`note(outcome)`); `.add(` callers under `apple/TodaysFive` are `AddFlowView.swift:221` (`submit`, `:218–225`), the self-test, `AddToTodaysFive.swift:335` (`perform`, `:334–343`) and a WebKit `userContent­Controller.add`; `store.add(` / `WatchStore.add` callers: none. `sync()` is called at `WatchStore.swift:190, 204, 277, 283` (and `:682`, the demo) and nowhere else; no `.refreshable`, no sync on the add sheet closing (`WatchApp.swift:207` only clears `openedFromFace`). `WatchStore.swift:509–511` reads exactly as claimed. `AddService.live()` (`:139–147`) is `KeychainLinkVault()` + `liveStore()` + `try? SupabaseTransport()`; `liveStore()` (`:152–164`) is the same App Group `lists` directory as `WatchStore.makeStore()` (`:161–167`); `KeychainLinkVault.swift` is in both app targets (pbxproj). The demo: `startDemo()` puts the demo link only in `WatchStore.links` (`:672`) — never in the vault — and `selectedList` (`:177–188`) reads `UserDefaults.standard` + `vault.all()`, so `live()` cannot see it.

**What I ran (measured), `w1probe.log` §W-F2** — two `SyncEngine`s over one on-disk `ListStore`, `MemoryTransport` toggled offline:
```
watch engine after start(): memory today=3  disk today=3
AddService.add offline: status=offline ('…on this watch, not up yet')  disk today=4 disk dirty=true
   WatchStore.doc (its engine's memory) today=3   ← the screen; nothing told it
after a Watch check-off offline: disk today=4 done=1 dirty=true diskHasAdd=true  watch memory today=3
after the Watch's next sync online: SERVER hasAdd=false today=3  watch memory today=3  disk dirty=true diskHasAdd=true
after a relaunch (open from disk + sync): SERVER hasAdd=true today=4  disk dirty=false
```

**Verdict: HOLDS** (every structural sentence verified line by line; the offline consequence measured through the core). Two precisions: (1) the queued line is **not lost** — `ListStore.merge` keeps it and its `dirty` flag through the Watch engine's later persists, and the phrase "in no engine's memory" is exact: even the Watch's next *online* sync leaves the add on disk and pushes only its own stale document; the add reaches the server only after an `open()` from disk (relaunch or list switch). (2) Online, the line reaches the screen on the next wrist raise (`sceneBecameActive` → `sync()` pulls the server copy the add pushed) — so the on-screen gap is "until the next scene activation", not indefinite.

**Needs a wrist.** Whether presenting WatchKit's text-input controller (`WatchDictation.swift:49–61`) flips `scenePhase` to inactive and back: if it does, `sceneBecameActive()` fires when the controller dismisses — *before* `AddService.add` has pulled and pushed — so its sync would usually race ahead of the push and still not show the line; a second raise would. Also the literal observation "the line is not on the Today screen after the confirmation" — code-structurally certain, not watched here. And the demo: the + resolves to `.noList` on an empty Keychain, or — the part that changes the severity — to a **real** list over the real transport if the device/simulator Keychain holds one from an earlier non-demo run.

**Severity.** Unchanged (bug), with one addition: the `-TFWatchDemo` path can write to a real list. And two comments are false as written: `WatchStore.swift:509–511` and `AddFlowView.swift:11–12` ("Track B hangs `onChange` off it").

---

## W-F3 — the App Group holds `lists/<W>.json`: the edit secret as a filename and as the document's `id`

**Claim.** `Store.swift:53` names the file `id + ".json"`, `:76` writes `record.doc.json` whole; `Document.swift:95–99`; `SyncEngine.swift:207` strips `id` for the wire ("a viewer must never learn W"); `WatchStore.openList :219–251`, `makeStore :161–167`, `AddService.liveStore :153–165`. Three sentences say otherwise; two `UserDefaults` writes hold ids.

**Code trail (all quoted from the worktree).**
- `Store.swift:53` `func file(_ id: String) -> URL { directory.appendingPath­Component(id + ".json") }`; `:76` `o["doc"] = .object(record.doc.json)`; `:63` re-stamps the doc with the filename's id on load.
- The id *is* the secret: `Keys.swift:28` `public let id: String // the secret the link carries: W on the edit path, R on the view path`; `:69` `ListKeys(mode: .edit, id: W, W: W, …)`; `SyncEngine.persist :312–315` writes under `keys.id`; `WatchStore.openList :220–221, :231` loads/derives from the vault link's `id`; `Document.swift:98` `o.set("id", id)` — so W is in the filename **and** in the JSON's `id` field. `SyncEngine.swift:207` `wire.remove("id") // forWire(): a viewer must never learn W` — the wire is protected, the disk is not. A view link stores R the same way (still "a link").
- Directory: `WatchStore.makeStore :162–163` and `AddService.liveStore :154–155` — the App Group container, `lists/`.
- The sentences: `PLAN-apple-phase3.md:463–464` "The App Group container holds the **decrypted document** … and never a link"; `apple/README.md:478–479` "The App Group holds a `WatchSnapshot` — a name, two counts, one line and a stamp — and **never a link**" (doubly wrong: it holds `lists/` too); `Config/TodaysFiveWatch.entitlements:5–7` "The secrets never cross: … what is shared is the decrypted document the store already keeps on disk". Two more the finder did not cite: `AddToTodaysFive.swift:109–110` "what is shared is the decrypted document …, never a secret" and `Complications.swift:26` "never a link".
- The two `UserDefaults` writes are real: `WatchLinkReceiver.swift:106` `defaults.set(id, forKey: Self.selectedKey)` and `:157`, with `defaults` = `.standard` (`:73`) and `selectedKey = "tf/app/watch/selected"` (`:66`) — its own comment (`:63–65`) says "The selection *is* a secret"; `WebViewController.swift:194` `UserDefaults.standard.set(parsed.id, forKey: AddService.openListKey)` (`"tf/app/phone/open"`, `AddToTodaysFive.swift:123`).
- `COMPATIBILITY.md` §8 (`:265–267`): "Nothing about the app may leak a link: no URL in any log, no analytics, no crash reporting, no `NSUserActivity`, and Keychain items that are not synchronizable. iCloud Keychain would put list secrets on Apple's servers". It speaks only to `kSecAttr­Synchronizable` / iCloud Keychain; it says nothing about device backups. And `grep` finds no `isExcluded­FromBackup` anywhere in `apple/`; the Keychain items are `kSecAttrAccessible­AfterFirstUnlock` (`KeychainLinkVault.swift:75`), not a `ThisDeviceOnly` class.

**Verdict: HOLDS** (from the code alone; consistent with the finder's simulator listing `appgroup-container.txt`: filename == doc.id, 22 chars, `mode: edit`). The design's stated guarantee — secrets only in the Keychain — is not what the store does, and the three sentences (five, counting the two extra) are false.

**Cannot see here.** Whether a watchOS App Group container and `UserDefaults.standard` ride in the paired iPhone's (iCloud) backup — a platform fact; the code sets nothing to keep them out. The App Group is reachable only by the two same-team binaries, so the on-device exposure is backup, forensics, and any future extension that joins the group.

**Severity.** Unchanged (design / false claim). Worth adding that the exposure is not confined to the Watch: the phone keeps the open list's id in its `UserDefaults` too (`:194`), so "the secrets are only in the Keychain" is false on both devices.

---

## W-F4 — a stamp ahead of the Watch's clock silences the channel for exactly the clock error

**Claim.** `WatchLinkSender.swift:70` `at = max(now, lastSentAt + 1)` (instance property); `WatchLinkReceiver.swift:62,117,149` persist `tf/app/watch/appliedAt`; `WatchLink.swift:300` `guard let payload, payload.at > lastAppliedAt`; nothing compares `at` to the receiver's clock or lowers the mark; outage = the clock error to the millisecond; `DECISIONS-apple.md:789–799` admits it.

**Code trail.** `WatchLinkSender.swift:70` `let at = max(CalendarDates.now(), lastSentAt + 1)`, `lastSentAt` a `private var` (`:47`, so per-process). `WatchLinkReceiver.swift:62` `appliedAtKey = "tf/app/watch/appliedAt"`, `:117` `lastAppliedAt: defaults.double(forKey: Self.appliedAtKey)`, `:148` (the finder wrote 149) `defaults.set(plan.appliedAt, forKey: Self.appliedAtKey)` — the only writer. `WatchLink.swift:300` `guard let payload, payload.at > lastAppliedAt else { return plan }`; `:304` `plan.appliedAt = payload.at`; `now` is used only for `lastSeenAt`/`addedAt` (`:326, :330–331`), never compared with `at`. The mark therefore only ever rises. `Dates.swift:26` `now()` is whole milliseconds (`.rounded(.down)`), so "to the millisecond" is literal. `DECISIONS-apple.md:789–795`: "a phone clock that ever runs ahead … poisons the channel for as long as it takes real time to catch up".

**Prediction.** A payload at `now + Δ` applies and sets the mark to `now + Δ`; every honest payload with `at ≤ mark` is ignored; `at = mark + 1 ms` applies; independent of Δ.

**What I ran**, `w1probe.log` §W-F4, `reconcile` driven directly with Δ = 10 min, 1 h, 3 days:
```
-- 1 hour ahead: first payload stamped now+3600000 ms → applied=true, mark = now+3600000 ms
   honest removal (links=[]) 1 s later        : applied=false remove=0
   honest new list at half the error          : applied=false
   honest new list at mark − 1 ms             : applied=false
   honest new list at mark exactly (at == mark): applied=false
   honest new list at mark + 1 ms             : applied=true upsert=1
(10 minutes and 3 days: the same six lines)
```

**Verdict: HOLDS.** Measured at three offsets, the boundary exact (an equal stamp is refused; +1 ms applies). One line-number slip (`:149` → `:148`), immaterial.

**Cannot see here.** How a real iPhone's clock gets ahead (NTP-disciplined phones seldom do; a manual date change — a common way to test "tomorrow" — does exactly this) and `WCSession` delivery itself. The receiver's half is pure code and was fully exercised.

**Severity.** One thing to add: during the outage *Remove from this device* on the phone silently does not reach the wrist (measured: `remove=0`), which is the privacy-relevant direction; recovery is only real time passing or the app's defaults being wiped (reinstall).

---

## W-F5 — `afterRollover`'s `0 / (total − done)` vs what `Model.rollover` actually does

**Claim.** A finished line with a live rule is reset in place (`Rollover.swift:86–99`), not tombstoned; case B (daily rule) `0/4` vs face `0/3`; C (due rule off Today) `0/5` vs `0/4`; D (no zone, done 23:30) `1/5` at 00:05, `0/4` at 09:00; a view-only list is never rolled by the Watch (`rollIfNeeded` guards `canEdit`, `:302–303`) but the face's midnight entry rolls it.

**Prediction from the code.** `Rollover.swift:59–109` step 1: a finished line with a live rule → `done=false, doneAt=0, today=due` (`:88–93`) — on Today tomorrow iff the rule is due tomorrow; no rule → tombstone (`:101–105`). Step 2 (`:111–120`) puts an off-Today undone line back if its rule is due, not placed today, no future return. Step 3 (`:122–138`) puts a `return` back on its day. No zone: `:68` skips a line finished under `rollGuardMs` (6 h, `Document.swift:20`). So the face's total is short by one per line rollover puts (back) on Today, and "every recurring line" is not exact (a finished weekly line not due tomorrow rolls off — the face agrees; a return is not a recurring line and also adds one). `afterRollover` (`WatchSnapshot.swift:156–163`) has none of this; `WatchStore.publish :604` sets `rollsAt` for any open list with no mode check, `rollIfNeeded :303` `guard canEdit`, and `entries` never reads `viewOnly` (measured S7 above).

**What I ran**, `w1probe.log` §W-F5, my own shapes through the public `Model.rollover(doc, at:, dates:)`, rules via `Model.setRule`, today → 2026-09-09 (a Wednesday):
```
A  3 done, no rules                        before=3/5 face 0/2 rollover 0/2  AGREE
B1 2 done, one of them daily               before=2/5 face 0/3 rollover 0/4  face total short by 1
B2 3 done, two of them daily               before=3/5 face 0/2 rollover 0/4  short by 2
B3 1 done, weekly rule NOT due tomorrow    before=1/5 face 0/4 rollover 0/4  AGREE
B4 1 done, weekly rule due tomorrow        before=1/5 face 0/4 rollover 0/5  short by 1
C  1 done + off-Today daily line (step 2)  before=1/5 face 0/4 rollover 0/5  short by 1
R  1 done + off-Today line returning       before=1/5 face 0/4 rollover 0/5  short by 1
D  NO zone, done 23:30, rollover 00:05     before=1/5 face 0/4 rollover 1/5 changed=false
D  … 05:29                                 rollover 1/5 changed=false
D  … 05:31 / 09:00                         rollover 0/4  AGREE
Z  zoned, done 23:30, rollover 00:05       rollover 0/4  AGREE
```
(My probe's "off by 0" label on the D rows compares undone counts only; the raw numbers are the finding: the list is still `1/5` while the face says `0/4`.)

**Verdict: HOLDS**, and "wrong by one for every recurring line" is **not exact**. Exact statement: the face's morning total is short by one for each line rollover puts (back) on Today — a finished line whose live rule is due tomorrow, an off-Today undone line whose live rule is due tomorrow (not placed today, no future return), and a `return` falling due — and is right for a finished recurring line not due tomorrow (B3); two qualifying lines → short by two (B2). For a list with **no home zone** the midnight entry is premature by up to six hours after the last check-off, and both numbers are wrong (`0/4` shown, `1/5` true) until `doneAt + 6 h`. The direction is always an under-count of the total (as `:153–155` says) except that no-zone window, where `done` is under-counted too. The view-only point holds structurally (three quoted lines): the app's own screen and its face disagree for the morning until the owner's device rolls the list and the Watch pulls it.

**Cannot see here.** Nothing material — this is a pure function and was exercised directly; whether real lists from before 1.9 still lack a `zone` is a data question, not a code one.

**Severity.** Papercut stands for recurring lines (acknowledged at `:153–155`); the six-hour no-zone window and returns are *not* acknowledged there and are a little more than a papercut (an 23:30 check-off shows `0/4` at 00:00 against `1/5` in the app until 05:30).
