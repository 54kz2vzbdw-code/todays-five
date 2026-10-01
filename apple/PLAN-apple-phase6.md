# Today's Five for Apple — Phase 6: own the room

The plan, and at the end the results. Bet 06 of the moat plan (*own the room*): the widget, StandBy, the TV, the
Action button. Its web half shipped as build 404 (the kitchen display, `kitchen.js`); this is the iPhone's half, and
it ships as build 406 with the version holding at 1.12.

Price's brief, in his words: "Do Bet 06 and take it all the way", and then, for the widgets, "they need to be of the
absolute best quality (like everything about this app)… I want the user to have several widget options and they all
should be intuitively perfect for where they are suggested to go."

Read `COMPATIBILITY.md` §8 first (it moved in this round), then `apple/PLAN-apple-phase3.md` (the Watch's data path,
which the widgets follow) and `apple/DECISIONS-apple.md`.

---

## What is offered, and where

Three widgets, each named for what it is for, so the gallery reads as a choice rather than a list of sizes:

| widget | families | where it goes | what it shows |
| --- | --- | --- | --- |
| **Next up** | small, Lock Screen rectangular | Home Screen, StandBy, Lock Screen | the next line, large, and its box; "3 left" / "Last one"; sealed, the kit's finale line and the stamp |
| **Today** | medium, large | Home Screen | the day's lines, each a box; the done ones sink and strike in the accent; large: notes, the bar and the count, the date; sealed, the finale line and the stamp |
| **Progress** | small, Lock Screen circular and inline | Home Screen, StandBy, Lock Screen | what is left as a ring; circular: an open gauge with LEFT in its gap; inline: "2 left · the next line" |

And two **controls** (iOS 18), for Control Center, the Lock Screen's two buttons and the Action button:

| control | what it does |
| --- | --- |
| **Add a line** | opens the app with a native composer up and the keyboard out, in the kit's type; the line goes to the server through the same add path Siri uses (`AddService`) |
| **Today** | says what is left ("2 left", "Sealed"), and opens the list |

Every list widget has one setting, **List** (an `AppEntity` offered by name, stored by key); left alone it follows the
list open in the app. The iPad's extra-large family is not offered: the app is iPhone-only (`TARGETED_DEVICE_FAMILY = 1`).

**The TV.** With the phone on a TV (AirPlay, or a cable), the app gives the screen a scene of its own
(`UIWindowSceneSessionRoleExternalDisplayNonInteractive`): a second web view on the same site, store and worker,
showing the list open on the phone as the kitchen display with `?kitchen=screen` (nothing to touch, no ask for sound).
The phone stays the remote: a line crossed off on it rings the list's doorbell, and the TV plays it the way a kitchen
display plays any device's check-off. The phone does not sleep while a screen is connected.

## How it looks where it lives

The kit is the device's own: its **Day or Night** theme by the device's own switch (by hand, with the system, or on a
schedule — a schedule's switch times are entries in the timeline, so a widget turns at seven with nothing running), its
type (the faces registered from the app's bundle, two directories up from the extension), its box (square in the two
digital materials), its strike, its finale line ("Level clear." for Arcade, a hidden kit's own) and its **sealed
stamp**, with the material's words and the date shortened rather than overflowing on a small widget.

| where | what changes |
| --- | --- |
| Home Screen, full colour | the kit's ground with its glow from the top corner, its ink, its accent |
| **StandBy** (a small widget, ground removed) | the device's **Night** theme on black, whatever the switch says: StandBy is the nightstand |
| tinted and clear Home Screens (`.accented`) | the system's glass; the words in white at four strengths; the boxes, strikes, the bar and the ring accentable, so the tint lands on them |
| Lock Screen (`.vibrant`) | the system's white on the wallpaper; the kit's type stays |

## Privacy, which is the app

- **A list is known outside the app by a key, never its id.** The id is the list's secret; a widget's configuration,
  an intent's parameter and a file name are all kept by the system where this app cannot reach. The key is the first
  ten bytes of a SHA-256 over the id.
- **What is on disk is Today's lines**, in the App Group, for the widgets to draw from — not Everything, not History,
  not the document. The links stay in the Keychain; the extension reads them through a shared keychain access group
  when it has to reach the server.
- **The page sends no list across the bridge.** The widgets read the server through the vault and the core, as the
  Watch does. What the page gives is its look: the device's two slots, resolved by its own `theme.js`.
- **On a locked phone** the Lock Screen's line is marked `privacySensitive`: until the phone knows its person it says
  how many lines are left instead, and the box beside it goes. A widget's check-off requires an unlocked phone
  (`authenticationPolicy = .requiresAuthentication`): StandBy on a nightstand is not a reason for whoever is nearby to
  cross lines off.

## The data path

```
app (WKWebView page) ──tf:check / tf:finale──▶ WidgetPublisher ──1.8 s after the last──▶ WidgetFeed.refresh ─▶ server
                     ──theme-color moves────▶ readLook (theme.js in the page world) ─▶ look.json
vault (Keychain) ─────────────────────────────▶ lists.json (keys and names, which is open)
widget extension: timeline ─▶ WidgetFeed.refresh (vault ─▶ keys ─▶ SyncEngine ─▶ pull) ─▶ day-<key>.json ─▶ views
                  a box     ─▶ CheckLineIntent ─▶ shelf at once, op waiting ─▶ rollover + setDone + push ─▶ doorbell
```

`WidgetShelf.swift` (the four files, Foundation only), `WidgetFeed.swift` (the one way to the list),
`WidgetPublisher.swift` (the app's half), `WidgetTimeline.swift` (what a widget draws and when it changes on its own:
the list's midnight, the schedule's switches; a read every thirty minutes), `WidgetIntents.swift`,
`WidgetViews.swift`, `WidgetStyle.swift`, `TodaysFiveWidgets.swift` (the bundle and the controls), `AppDoor.swift`
(the controls' intents, which open the app), `Composer.swift`, `ExternalDisplay.swift`, `KitFonts.swift`.

**A check-off made on a widget** writes the shelf first (the box ticks under the finger; a `Toggle` with an intent is
drawn in its new state before the intent runs), leaves the op waiting on the shelf, and sends it with a read: pull,
**roll the list over as the page does on opening it**, set the line, push, ring the doorbell. An op that cannot be
sent (offline) waits and goes with the next read. Every widget is drawn again when the intent returns (WidgetKit only
redraws the one tapped by itself).

## Capabilities, and so signing

The iPhone app gains the App Group (`group.com.pricebrannen.todaysfive`, already the Watch's) and a keychain access
group naming its own application identifier, and a new extension (`com.pricebrannen.todaysfive.widgets`) carries both.
**This is a capability change, so the archive is made with the Apple ID signed into Xcode and no `-authenticationKey`
flags** — the App Manager key cannot add a capability (DECISIONS-apple.md, Phase 3).

---

## Results

### What running it found that reading it had not

1. **A repeating line crossed off from a widget the morning after came back.** Rollover keeps a repeating line's id
   and resets it at midnight — on whichever device rolls the list over first. A widget showed the line undone (it draws
   the rolled-over view), but on the server it was still done from yesterday, so `Model.setDone` found it already done
   and wrote nothing. Fixed: a write from a widget rolls the list over first, as the page does on opening it.
   `-TFWidgetSelfTest` fails without the fix (20/22: exactly the two morning-after checks) and passes with it (22/22).
2. **WidgetKit draws again only the widget that was tapped.** Next up beside a Today widget kept showing the line just
   crossed off in Today, until the next reload. Fixed: the intent asks for every timeline and the controls.
3. **A list never read is not a list that is gone.** A list made on the page a moment ago (or offline) is not on the
   server yet, and the server's null read as *gone* would have told the person it "isn't here any more". Gone now means
   it was read before and is not there now.
4. **The gallery's search does not match a typed curly apostrophe** against the app's name ("Today’s Five" finds
   nothing; "Five" finds it). The display name is the system's; nothing to change, worth knowing when describing it.
5. **The ring's number needed a word.** A closed capacity ring with "1" in it does not say whether one is done or left;
   the circular widget is an open gauge with LEFT in its gap.

### The instruments, and what each cannot see

| instrument | what it says | what it cannot see |
| --- | --- | --- |
| `-TFWidgetSelfTest` (22 checks) against `apple/tools/mockserver.mjs` | the data path end to end: read, order, the key, a check-off and its undo, the morning-after repeat, a View link refused, offline and sent later, never-read against gone, a list let go | the real backend (by design: the create limit) |
| `-TFWidgetLab` | every family, every place (Home Screen, StandBy, tinted, Lock Screen), in progress, sealed and empty, for all 16 open kits, rendered by `ImageRenderer` from the extension's own views | the system's own compositing of glass and vibrancy |
| the iPhone 17 simulator (iOS 26.5), driven by the simulator tool | the real gallery, Home Screen, Lock Screen and Control Center: added, tapped and read back | StandBy (it needs a phone charging on its side), the Action button, a TV, Face ID |
| `-TFSelfTest` on the live page | the bridge hears all seven moments, `tf:stamp` among them | the hand (a simulator has no motor) |
| `-TFScreenCheck` | the TV's screen, shown over the app: the second web view opens the list open on the phone as the kitchen display in its no-touch mode | the external display scene being created on a real connection |
| `xcodebuild archive` for `generic/platform=iOS` | that everything compiles for a device, the watch's `arm64_32` included, and signs with the new capabilities | behaviour |

### On the simulator (iPhone 17, iOS 26.5), seen and read back

- The gallery offers **Next up**, **Today** and **Progress** with their descriptions, drawing the person's own list from
  the shelf; the Lock Screen's picker offers Next up (rectangular) and Progress (circular, inline); Control Center's
  offers **Add a line** and **Today**.
- On the Home Screen, a box in Today ticked under the finger in under half a second, the server went from rev 1 to 2
  with its doorbell, and the line sank and struck; Next up's box then crossed off the next line, and both widgets
  followed (4/5, "Last one"); the last box sealed the day on both — "That's the list." and the stamp, the short form on
  the small widget.
- The Today widget's **+** opened the app with the composer up and the keyboard out; a line typed there reached the
  server (rev 5) and both widgets showed it.
- **Add a line** in Control Center opened the composer, in Terminal's type.
- On the Lock Screen, the rectangular widget's box crossed off the last line (rev 6) and both Lock Screen widgets sealed
  — "SEALED · That's the list. · [ sealed 2026-10-01 ]" in Terminal's words, and the seal in the ring.
- Tinted and Clear Home Screens: the system's glass, white words, the boxes and strikes tinted, the hierarchy kept.
- The look followed the page: the simulator's own device (a hidden kit by day, Terminal by night) arrived in
  `look.json` with its finale line and material, and the widgets wore its type and ground.

### The suites

| | |
| --- | --- |
| `swift test` (the core, unchanged) | 134 tests in 10 suites |
| `-TFWidgetSelfTest` | 22/22; 20/22 with the rollover fix taken out |
| `-TFSelfTest` on the live page | bridge ready, heard 7/7 |
| Debug and Release builds, simulator | clean; the lab's code is not in the Release app (`EXCLUDED_SOURCE_FILE_NAMES`, and `nm` finds none of it) |

### What only a phone, a TV or a person can answer

- **StandBy**: the small widgets on the nightstand, the Night theme on black, and night mode's red.
- **The Action button** running **Add a line**, from a locked phone.
- **A TV**: AirPlay the phone to an Apple TV (or plug in a display) with a list open; the TV should show the kitchen
  display, and a line crossed off on the phone should play on the TV.
- **Face ID before a check-off from the Lock Screen and StandBy**, and the line hidden until the phone knows its person.
- The tap of the sealed stamp in the hand (`tf:stamp`: a heavy knock and a soft settle 75 ms later).

### After 406: choosing a widget's list (b407, shipped as build 408)

Price, with three lists: every widget showed his home list and there was no easy way to change it. Two causes, both
fixed (DECISIONS-apple.md, "Choosing a widget's list"): 406 pinned each widget to whichever list was open when it was
added, and a choice made in Edit Widget came back empty wherever the system would not recognise the list entity (the
simulator, at least). The setting is now a plain value offered by name, defaulting to **Same as the app**.

Measured on the iPhone 17 simulator with three lists on the stand-in server ("Home to-do", "Work", "Groceries"):

- Edit Widget → List offers *Same as the app* (with "The list open in Today's Five" under it), then each list by name.
- A Today widget set to Work drew Work (1/4) and its box crossed off "Send the Henderson draft" on Work (2/4 on the
  server, rev 2); Home to-do and Groceries untouched.
- A Next up widget left on Same as the app followed the app from Home to-do to Groceries while the Work widget stayed
  on Work.
- A widget configured under 406's setting kept drawing after the update and offered Same as the app.
- `-TFWidgetSelfTest`: 29/29 (seven new checks: following, pinning, a pin let go, the follow value never a key).
