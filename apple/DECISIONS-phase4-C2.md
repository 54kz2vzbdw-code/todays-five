# Track C, stage 2 — the picker, the volley, and the face that cannot have a colour

What was decided about the Watch's second half, and what each decision cost. Everything with a
number in it was measured on the Apple Watch Series 11 46mm simulator (watchOS 26.5, `4594CB69`) on
this machine, against `Kits`' generated table at build 158. Stage 1 is
[`DECISIONS-phase4-C1.md`](DECISIONS-phase4-C1.md) and this does not repeat it.

---

## The one settings screen, and why it is the only one

Phase 3 wrote a sentence and meant it:

> There is no settings screen, no Everything, no sections, no History, no rules, no templates and no
> themes: those live on a phone-sized screen because they need one.

**That sentence is now wrong about exactly one word, and the reason is not that themes are more
important than templates.** It is that a theme is the only item on that list which is a property of
the *device you are looking at*. History belongs to a list. Rules belong to a list. Templates belong
to an account. Every one of them has a phone to be configured on, and configuring it there is not a
compromise — it is where it belongs. The kit a wrist is drawn in has nowhere else it could be
chosen, because there is no other wrist.

So: two slots, a Day/Night switch, and every available kit. `theme.js`'s shape, minus two things.

* **`switch: "system"` cannot exist here.** watchOS has no light appearance at all, so
  `\.colorScheme` reads `.dark` at the root of every app on the device forever. A mode that followed
  the system would pin every Watch permanently to its night slot and present that as a feature. This
  is a platform fact, not a decision.
* **`switch: "schedule"` was dropped, and that *is* a decision.** It needs two time pickers on a
  screen two inches across, a stored `holdAuto` so a manual flip survives until the automation next
  changes its mind, and `settleHold` run on every occasion the app wakes — for a preference somebody
  changes by looking at their wrist and deciding they would rather it were dark. If it is ever
  wanted here, the place to put it is the phone's device record and it is a different round.

**One control does two jobs and that is the design, not a shortcut.** The Day/Night buttons choose
which slot is *on* and simultaneously choose which slot the list below is editing. Both slots stay
reachable in one extra tap, and the row you press is the thing that happens, immediately, on the
screen you are standing on. Showing somebody a kit they are not currently looking at while they
choose it is the worse trade on a screen this size.

Both leans are offered in both slots, which is the web's own rule — "any theme, light or dark: the
slot is about *when*, not *what*". What the ordering does is put the eight kits designed for the
current slot first, which on a crown is the whole of the affordance.

### It hangs off the long press, and that cost Start again a tap

The count was already this app's one long-press surface, and it held Start again. It now opens a
two-row sheet: Start again, and Theme. **A gesture that used to do a thing and now opens a menu is a
small regression for the person who had learned it**, and it is named here rather than left to be
discovered. The alternative the plan allowed — a third page — would have cost Today a swipe every
time anybody scrolls, forever, to reach a screen they will open twice a year.

**It also fixed something that would otherwise have shipped as a bug.** The old hold was gated on
`store.canEdit`, so a view-only list had no long press at all. Once the theme lives behind that
gesture, a person whose only list is shared read-only could never have changed their Watch's theme —
and a theme is not a property of the list. The hold is ungated now and *Start again* is the row that
is disabled.

### Stored in the App Group, and that is not where the other Watch preference lives

`UserDefaults(suiteName: "group.com.pricebrannen.todaysfive")`, three keys under `tf/app/watch/kit/`.
Deliberately unlike `WatchLinkReceiver`'s selected-list key, which is in `.standard` **because** it
is a secret. A kit id is not a secret: `theme.js` ships all eighteen to every browser, and the two
Secret kits are withheld from a wrist as a product rule rather than a cryptographic one. The
complication is another process and has to be able to see the theme; `.standard` is invisible to it.

**Verified across a cold launch**, which is the only way to verify persistence at all:

```
launch A  -TFThemeSet day:harbor
  theme: slot=day day=harbor night=terminal → kit=harbor pair=manrope base=light unlocked=0 offered=16
launch B  (no argument)
  theme: slot=day day=harbor night=terminal → kit=harbor pair=manrope base=light unlocked=0 offered=16
```

`-TFThemeSet` calls `show(_:)` and `choose(_:for:)` — the identical two methods the picker's buttons
call, not a copy of them — so what the two launches prove about the store is true of the picker.
It exists because `simctl` cannot tap a watch simulator: there is no `simctl ui tap` and no
accessibility bridge, so nothing can press a row and then relaunch to see whether it stuck.

---

## The volley, and the one number that had to move

Every constant in `ConfettiField` is `fx.js`'s, read across rather than invented: gravity `0.30`,
drag `0.992` on both axes, seven bursts of 26 at `w * (0.08 + 0.14i)`, `h * 0.97`, power 19, spread
1.15, fired `i * 65` ms apart, then one of 40 at `w/2`, `h * 0.6`, power 14, spread 2.6, at 210 ms.
222 particles. `life` from 1 decaying `0.0075 + rand * 0.008` a frame, alpha `life * 1.7` clamped,
`rib` on 45% of pieces and its flutter `h * |cos(r * 1.7)|`. The four shapes are ported curve for
curve.

**Exactly one thing was rescaled, and the alternative would have broken something that matters.**
`fx.js`'s speeds are in browser pixels. A piece launched at 19 px/frame against 0.30 px/frame² of
gravity reaches its apex `19² / (2 × 0.30) = 601` px up; on a 208×248 pt watch screen that is two
and a half screens, so the whole volley would leave through the top on frame one and the screen
would be empty for a second and a half before anything came back.

The port scales **every length by one factor** — positions, velocities, gravity and particle sizes
alike — and scales nothing else. `k = height / 800`, 800 being a browser viewport's working height;
on this simulator **k = 0.310**. That is the only rescaling that leaves the choreography alone: an
apex is `v² / 2g`, so multiplying `v` and `g` by the same `k` multiplies the apex by `k` and leaves
every *time* exactly where `fx.js` put it.

**Why the times had to be left alone.** The obvious alternative — keep the speeds, shrink gravity —
changes the timing, and the volley's timing is the half of it `WatchHaptics` is already playing:
seven `WKInterfaceDevice.play(.click)` 65 ms apart and the chord at 700. Those two must not drift
apart, and a scale factor that touches only lengths is the one guarantee that they cannot.

Measured piece sizes at k = 0.310: ribbons **0.93–2.48 pt wide by 1.86–5.27 pt tall**, polygons
**1.55–3.41 pt** across. On a 2× panel that is 2–11 device pixels, which is what the finale
screenshots show and is the same fraction of the screen the web's are of a browser's.

### It ends, and the mechanism for ending is the whole point

A `TimelineView` has no "stop". Left mounted it holds a redraw source open on a live screen for as
long as the app is in front, which on a watch is a battery bug with no symptom. So `ConfettiField`
reports `isAlive`, the view clears the binding when it goes false, and the parent removes it.
**Measured: the field is empty at frame 147** — 2.45 s, and `1 / 0.0075` = 133 frames is the slowest
possible decay, so 147 is the arithmetic and not a guess. The same number for all eighteen kits.

### Always-On is not gated, on purpose

`AnimationTimelineSchedule.entries(from:mode:)` returns **zero entries** in `.lowFrequency`, so
`TimelineView(.animation)` parks itself the moment the wrist drops. An `isLuminanceReduced` check
would be a second mechanism doing the same job, and the failure mode of two mechanisms is that one
of them is wrong. (A hand-rolled `PeriodicTimelineSchedule` would **not** self-park — it ignores the
mode and keeps ticking. That is the trap and this is not one.)

**The haptic half did not change and the code goes on saying why.** `CoreHaptics` is still absent
from the watchOS SDK. Sound stays out.

### 222 particles at 51–53 frames a second

```
[tfive] watch selftest: 10 confetti: run=1 frames=132 over 2.49s = 52.6/s
[tfive] watch selftest: 10 confetti: run=1 frames=128 over 2.48s = 51.1/s
```

Two runs. The plan's checkpoint had rendered 180; this is 222 and the simulator holds ~52 Hz, which
is what a `Canvas` doing 222 rotate-and-fill operations per frame costs on this runtime. The field
is rebuilt from its seed on every frame rather than held in state — a `Canvas` closure cannot mutate
view state and a `TimelineView` may draw the same date twice — so the arithmetic per frame is up to
147 steps of 222 particles, and that is what those numbers already include.

**The field is deterministic from a seed** (SplitMix64), which is what makes eighteen screenshots of
the same volley worth comparing: they differ in colour and shape and in nothing else.

---

## `Kit.shapes` cannot say what `fx.js` needs it to say

**This is the round's one real defect and Track C is the first thing in the project that could have
found it.** `fx.js` reads a kit's `shapes` as **either** a count — v1's meaning, 1 ribbons, 2
ribbons and hearts, 3 ribbons hearts and stars — **or**, since 1.6, a list to draw from: 0 ribbon,
1 heart, 2 star, 3 sparkle, 4 sprinkle. The two readings of the same value disagree completely. As a
count, `1` is ribbons only. As a list, `1` is *hearts* only.

`Kit.shapes` is `[Int]` and cannot tell them apart. The loss happens at the fixture:

```js
// test/fixtures/kits.json, "expr"
({ kits: CURATED.map(t => ({ ...t, shapes: Array.isArray(t.shapes) ? t.shapes : [t.shapes] })), … })
```

A number and a one-element array are the same value by the time the fixture is written, so `KitsGen`
cannot emit the difference and `Kit(json:)` cannot read it. It is a **union type flattened at a
boundary**, and nothing downstream said so because nothing downstream had ever drawn a particle.
Fifteen kits carry `[1]`, sunset `[2]`, pink/dusk/blush `[3]`, superpink `[1,2,3]`, birthday `[4]`.

**What is recoverable, and why it is a rule rather than a coincidence.** `fx.js`'s own header calls
the count "v1's meaning, unchanged", and v1 had exactly three shapes; indices 3 (sparkle) and 4
(sprinkle) arrived in 1.6 as list-only. So the count vocabulary stops at 3, and:

> a one-element `[n]` with `n` in 1…3 was a count; anything else was already a list.

That is right for all eighteen kits today, and it is right for the reason the values mean what they
mean rather than because the current table happens to be shaped conveniently. The residue is small
and honest: a kit that one day writes `shapes: [2]` *as a list* would be drawn as a count here.

**The real fix is one line in `test/tools/gen-kits.mjs`** — keep the number a number — plus a field
on `Kit` to hold which it was. That is Track B's file and Track B's table, and it is written up here
rather than done, because a cross-track edit to a generated fixture at merge time is a worse trade
than a rule with an argument behind it and a self-test that walks every kit.

The self-test walks every kit and prints how each one was read, because this is the single thing
about the port a reader cannot check by looking at the screen:

```
[tfive] confetti self-test: begin kits=18 canvas=208x248 k=0.310
  dark:      shapes=[1]       read as count → drew [0]       · palette=5 · ends at frame 147
  sunset:    shapes=[2]       read as count → drew [0, 1]    · palette=5 · ends at frame 147
  pink:      shapes=[3]       read as count → drew [0, 1, 2] · palette=6 · ends at frame 147
  superpink: shapes=[1, 2, 3] read as LIST  → drew [1, 2, 3] · palette=6 · ends at frame 147
  birthday:  shapes=[4]       read as LIST  → drew [4]       · palette=6 · ends at frame 147
[tfive] confetti self-test: end pass=108/108
```

Birthday is the one the rule earns its keep on. `[4]` read as a count would have thrown ribbons,
hearts, stars and sparkles; read as the list it is, it throws hundreds-and-thousands and nothing
else — which is what `apple/shots/watch/finale-birthday.png` shows.

---

## The complication can have the kit's type. It can never have its accent.

**This was the round's one brief line that could not be delivered as written, and it is written down
here rather than discovered by somebody later.**

`WidgetRenderingMode.accented` — the mode every watchOS complication is drawn in on the great
majority of faces — says in its own words that the system

> treats the widget's views as if they were template images. It replaces the view's color —
> rendering the new colors while preserving the view's alpha channel.

The colour that replaces it is the one the wearer chose in the **face editor**. The escape hatch that
exists on the phone, `WidgetAccentedRenderingMode.fullColor`, is documented in one sentence: *"Only
applies to iOS."* There is no watchOS equivalent, no opt-out and no entitlement. A view's **shape**
crosses to the face; its **colour** does not. `.widgetAccentable()` does not add a colour either — it
moves a subview from the face's neutral group into the face's accent group, and both of those groups
are the face's.

### Observed, not trusted

`-TFFaceProbe` renders a rectangle filled in the kit's accent, with a mark in the kit's danger colour
on top of it, through `ImageRenderer` twice — once at `.fullColor`, once at `.accented` — and reads
two pixels back out of each. Two pixels rather than one, because a mode that flattened everything to
a single colour and a mode that changed nothing both leave one pixel looking plausible.

```
face probe: accent asked for #4AF07A
face probe: fullColor  corner=#4AF07A@255 centre=#FF6B57@255
face probe: accented   corner=#4AF07A@255 centre=#FF6B57@255
face probe: the two renderings are IDENTICAL
```

Repeated on a second kit (`#0F8C8C`): identical again.

**What that rules out is the cheerful hypothesis.** If `.accented` were a SwiftUI-side treatment, an
`ImageRenderer` handed the environment value would show it, and an app could see it coming and
compensate. It is not: SwiftUI passes the colours through untouched, which means the flattening is
done by the widget host at composite time, and is therefore not reachable, not overridable, and not
visible to any test that does not involve a watch face and a finger.

### What was built instead

| the **type**            | the count is set in the kit's own ui face, by PostScript name              |
| **gauge or text**       | a monospaced pair gets the numbers; every other pair gets the ring         |
| the **glyph**           | a finished list puts a check in the middle of a full ring                  |
| **`.widgetAccentable`** | the count is accented; anybody's words are not                            |

The gauge-vs-text choice is worth naming as a choice. Nothing in the SDK says a mono kit should
prefer text, and a ring is the better glance for most people most of the time. It is the one
structural thing a kit can change on a face at all, and spending it on the pair whose whole identity
is setting numbers in a grid is more interesting than spending it on nothing.

**A per-kit glyph was considered and rejected.** It would need an id-to-symbol table inside the
appex: eighteen rows of design decision with nothing generating it, nothing checking it, and nothing
to notice when a nineteenth kit is added. The extension does not link `TodaysFiveCore` and must not
grow a hand-written copy of a table that lives somewhere else. `pair` is the one kit-shaped input it
can act on without one.

### The theme reaches the face additively, with `v` left at 1

`WatchSnapshot` grew `kit`, `pair` and `face`. `read()` already defaults every field it cannot find,
so an old extension reading a new snapshot gets `kit: ""` and draws the way it always did, and a new
extension reading an old snapshot gets the same. **Bumping `version` would have turned the first of
those into a refusal** — the face would have dropped to its placeholder — in order to announce a
field that older code does not read. That is `COMPATIBILITY.md` §3's rule applied to a file rather
than to the wire, and it is the whole reason the rule exists.

`face` carries a PostScript name because **`pair` alone is not actionable in the extension**: mapping
`"lato"` to `"Lato-Black"` needs the generated table, the extension does not link `TodaysFiveCore`,
and a hand-written copy of that mapping in the appex is precisely the second copy of generated data
`KitsGen` exists to prevent. `pair` still travels — it is what a log and a person diffing two
snapshots want — but `face` is what draws.

### The redraw is `publish()`, and there is no second door

`publish()` writes the snapshot and calls `WidgetCenter.shared.reloadAllTimelines()` in the same
breath, so routing a theme change through it is the entire mechanism that makes the face redraw on
the change rather than at its next reload. Verified end to end, on a slot flip through `show(_:)` —
the picker's own call:

```
watch selftest: 11 theme change: harbor/Manrope-ExtraLight-800 → terminal/IBMPlexMono-SemiBold changed=true
```

### The appex needs no fonts of its own, and the plan's premise was wrong in a checkable way

The plan budgeted **1.5 MB and 26 hand edits** to duplicate the 33 faces into the extension, on the
grounds that "the appex is a separate bundle with its own Info.plist and its own Resources phase, so
the Watch app's fonts are NOT visible to it". The first half is true and was verified on the built
product — **33 `.ttf` in `TodaysFiveWatch.app`, zero in `PlugIns/TodaysFiveComplications.appex`**.
The second half does not follow:

```
TodaysFiveWatch.app/                 ← the 33 .ttf are here
  PlugIns/
    TodaysFiveComplications.appex/   ← Bundle.main, inside the extension
```

An extension's bundle is *inside* its containing app's bundle. Two `deletingLastPathComponent()` and
the fonts are right there, in the same signed container, readable.
`CTFontManagerRegisterFontsForURLs(_:.process:_:)` makes them resolvable for the life of the
process, which is exactly as long as a widget rendering lasts. **No copy, no `UIAppFonts` entry, no
second Resources phase, and nothing for the orchestrator to register.**

Verified from the Watch app, against the extension's own bundle URL so the arithmetic under test is
the extension's arithmetic and not a re-derivation of it:

```
face probe: appex=TodaysFiveComplications.appex ttfInAppex=0 fontsRoot=TodaysFiveWatch.app
            facesOnDisk=33 registered=33 wantedFaceOnDisk=true
```

`facesOnDisk` is read with `CTFontManagerCreateFontDescriptorsFromURL`, not with
`CTFontCreateWithName`, and the distinction is the point: inside the app all 33 are already
registered by `UIAppFonts`, so a resolution check would answer yes whether or not the path worked.
Opening the file at the computed URL and reading its name back takes the app's own registration out
of the answer.

**What could not be observed** is a complication actually drawing on a face. That needs the face
editor, and `simctl` cannot tap a watch simulator. So the extension asks for the face and **falls
back to the system font when it does not resolve** — which costs nothing if the last link turns out
to be closed, and is why this shipped rather than being deferred.

---

## The eighteen screenshots, and how the two Secret ones got there

`apple/shots/watch/today-<kit id>.png`, all eighteen, each launched under `-TFKit <id>`. Filenames
are kit ids, which are not the word that unlocks anything and were never typed by a person.

The Secret pair reached the wrist the way it will in the field: as JSON under `tf/app/watch/kits` in
the App Group — the key `WatchLinkReceiver` writes and `WatchThemeStore` reads — after which
`-TFKit superpink` resolves like any other id and the picker offers eighteen instead of sixteen.

**The injection took two goes and the failure is worth recording.** `xcrun simctl spawn <udid>
defaults write group.com.pricebrannen.todaysfive …` appears to work — `defaults read` reads it back
— and the app does not see it. There are **two plists with the same name** on a booted simulator:

```
<data>/Library/Preferences/group.com.pricebrannen.todaysfive.plist                      ← simctl spawn writes here
<data>/Containers/Shared/AppGroup/<id>/Library/Preferences/group.…todaysfive.plist      ← the app reads here
```

`UserDefaults(suiteName:)` resolves to the group *container*; a spawned process is not a member of
the group, so its `defaults` lands in the device's own domain. `plutil -replace` straight into the
group container's plist works, and the confirmation is `unlocked=2 offered=18` in the theme line.

Also photographed: the two screens behind the long press, which had never been photographed because
they are behind a gesture, and four finales. Those last are frozen at 0.55 s by `-TFFinaleHold`,
because **a screenshot of an animation is otherwise a coin toss** and eighteen of them would be
eighteen tosses. Held, every kit is photographed at the same instant of the same deterministic field.

---

## What eighteen screenshots found that three could not

Stage 1 photographed dark, paper and terminal, fixed the carousel's row platter to the kit's own
`ink2`, and moved on. **Eighteen frames show that the platter was only half the problem.**

`.listStyle(.carousel)` composites its own treatment onto a row as that row leaves the focus band,
*over* whatever `.listRowBackground` put there. Measured at the same three points on six frames:

| kit | ground | platter in focus (kit's `ink2`) | the row leaving focus |
| --- | --- | --- | --- |
| sketch | `#F8F6F1` | `#EFECE5` | **`#807F7B`** |
| paper | `#F7F2E8` | `#EFE8DA` | **`#807C75`** |
| light | `#FAF8F4` | `#F1ECE3` | **`#817F7A`** |
| birthday | `#FFF3F8` | `#FDE9F2` | **`#80767B`** |
| dark | `#070A08` | `#0E140F` | `#080B08` |
| terminal | `#070A08` | `#0E140F` | `#080B08` |

The in-focus platters are the kit's, exactly — stage 1's fix works. The row on its way out lands at
**about 50% grey on every light kit**, which is a grey slab across the foot of a cream screen, and on
a dark kit is indistinguishable from the ground. It is the same failure stage 1 fixed one layer up:
a system treatment tuned for a platform that is always dark, applied over a kit that is not.

**It is not fixed here and the reason is that the fix is a bigger decision than it looks.**
`.listStyle(.carousel)` has no API for the out-of-focus treatment — no modifier, no environment
value, nothing on the row. Escaping it means leaving `.carousel`, which is the scroll behaviour the
whole Watch app is built around: rows that snap, grow into focus and give the crown something to
land on. Trading that for a flat list to get rid of a grey band is a product decision and belongs to
somebody who has held the thing.

What it is worth on its own is the method: **a three-kit smoke test cannot find a bug that only
light kits have, and six of the eighteen kits are light.** The screenshots were asked for as
evidence and turned out to be a test.

---

## What stage 2 did not settle

* **A complication has still never been seen on a face.** Everything about the extension that can be
  checked without tapping a watch has been; the face editor cannot be reached at all. Whether a
  custom face renders under the widget host, and what `.accented` does to it there, remain open, and
  the fallback to the system font is the answer to both being no.
* **Always-On was still not rendered.** `simctl` cannot put a watch simulator into luminance-reduced
  mode and there is no launch argument for it. The confetti's Always-On behaviour rests on
  `AnimationTimelineSchedule` returning zero entries in `.lowFrequency`, which was measured, and not
  on a screenshot of a dimmed screen, which does not exist.
* **The picker was never touched by a finger.** `-TFThemeSet` calls the picker's own two store
  methods and `-TFShow theme` puts the picker on screen to be photographed, but no gesture on this
  machine has ever pressed one of its rows. The crown scroll, the hit targets and whether eighteen
  rows is too many to get through are wrist questions.
* **The carousel's out-of-focus grey is still there on every light kit.** Measured above, no API to
  reach it, and the only escape is leaving `.listStyle(.carousel)` — which is a bigger trade than
  this round should make on its own.
* **`Kit.shapes` is still a flattened union.** Read correctly here, by a rule with an argument behind
  it; not fixed at the source, which is Track B's fixture and Track B's generator.
