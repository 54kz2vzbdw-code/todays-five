# Today's Five 1.7 — the Feel lens

Measured with instrumented Playwright runs (scripts and logs in `$OUT`): `timing.mjs`, `timing2.mjs` →
`timing2.log`, `feel3.mjs` → `feel3.log`, `empty.mjs` → `empty.log`, `empty2.mjs` → `empty2.log`. Every run
installs a `MutationObserver`, `transitionstart/end`, `animationstart/end` and pointer listeners *before* acting,
and wraps `AudioContext.prototype.createOscillator/createBufferSource` so a sound's schedule time is recorded
against the same `performance.now()` clock as the DOM change. Pack envelopes were rendered offline
(`OfflineAudioContext`) and measured for onset, peak and length.

**The measured check-off (desktop, warm, one-line item)** — `timing2.log`, "SECOND check-off":

| t (ms from pointerdown) | what happens |
|---|---|
| 0 | pointerdown |
| +2 | knock scheduled, `lead=0` (plays now) |
| +3 | row gets `.done .kick`, box gets `.pop` |
| +65 | strike transition starts |
| ~+110 | the knock is over (108 ms long, peak at 6.6 ms) |
| +300 / +340 | `kick` / `pop` end |
| +432 | strike ends (`.38s` + a frame; a second wrapped line adds `.13s`) |
| +520 | `afterChange` re-renders (`delay: it.done ? 520 : 200`, app.js:1082) |
| +598 | the sink's first frame (WAAPI FLIP, **duration 520**, app.js:915) |
| +1040 | the row is at rest |

---

### The first check-off on a cold page makes no sound at all
- severity: bug
- environment: desktop and phone, fixture `longtime` (any page where the first gesture is the check-off)
- steps:
  1. Open a saved list on a cold page.
  2. Tap a line — the very first gesture on the page.
  3. Count the audio nodes the tap creates.
- evidence: `$OUT/empty2.log` ("audio nodes made by the FIRST check-off: **0** | sound state: packs:true"; second
  check-off: 2 nodes; `stats.check` is 2 either way) and `$OUT/timing2.log` (the COLD trace has `rowclass`,
  `ink-start`, `anim=kick`, `anim=pop` and **no `audio` line**; the SECOND trace has `audio kind=osc lead=0` at +2 ms).
- why it matters: the knock is the app's signature. On a phone opened from the Home Screen to cross one thing
  off and put the phone down — the app's whole use case — that one tap is silent, every time. The line strikes,
  the box pops, confetti flies, and nothing is heard.
- proposed fix: in `sound.js` `play()`, replay instead of dropping:
  `if (!packs) { const t0 = performance.now(); loadPacks().then(() => { if (performance.now() - t0 < 400) play(fn, step); }); return false; }`
  — the context is already open inside the gesture, so a resolved import can still play through it. Better still,
  start `loadPacks()` from a `requestIdleCallback` after first paint (only `ctx()` needs the gesture, the module does not).
  DECISIONS.md "Sound" says *"the first check-off on a cold page can arrive a beat late; nothing else is lost"* —
  that is not what the code does. `play()` returns `false` and never comes back, so the sound is lost, not late.
  The decision (lazy engines, no first-paint cost) is right; the implementation does not honour it.

### Under reduced motion the finale's glow flare still fades in, then cuts off
- severity: bug
- environment: desktop, fixture `fresh`, `reducedMotion: "reduce"`
- steps:
  1. Open with `prefers-reduced-motion: reduce`.
  2. Cross off the last line so the finale fires (app.js:1096 adds `.flare` to `#glow`, removes it 900 ms later).
- evidence: `$OUT/empty2.log` — `{"restDuration":"0s","whileFlare":"0.22s opacity=0.62","settledOpacity":"1",`
  `"durationWhenFlareRemoved":"0s","opacityOneFrameAfterRemoval":"0.62"}`; and `$OUT/feel3.log` section C, which
  records `trans:opacity:flare` starting under `reduce`. Screenshot `$OUT/reduced-motion-finale-desktop.png`.
- why it matters: `styles.css:448` turns the glow's transition off under reduced motion, but `#glow.flare`
  (`styles.css:45`, specificity 1-1-0 vs 1-0-0) wins, so a full-viewport wash ramps 0.62 → 1 over 220 ms and then
  drops back to 0.62 in a single frame 900 ms later. A large-area brightness step is precisely what a
  reduced-motion reader has asked not to be shown, and the asymmetry makes it read as a flash.
- proposed fix: inside the reduce block, `#glow,#glow.flare{transition:none}` and skip adding `.flare` at all
  when `RM.matches` (app.js:1096 and app.js:1057).

### Rows pass through each other during the sink; two lines of type superimpose
- severity: papercut
- environment: desktop 1440×900, fixture `fresh` (any reorder that moves more than one row)
- steps:
  1. Cross off a line that is not last.
  2. Look at the screen ~350 ms into the sink.
- evidence: `$OUT/finale-desktop-f03.png` — "Cross off all three and see" and "Tap or click to cross this off"
  are drawn on top of one another at the same baseline, both struck, unreadable. Frame burst
  `$OUT/finale-desktop-f00..f11.png`.
- why it matters: `orderInto` (app.js:906-916) FLIPs every row whose position changed, and `.row` has no
  background at rest, so two rows crossing render as one double-exposed line for ~150 ms. It reads as a
  rendering fault, not as motion.
- proposed fix: add the `.moving` class around the FLIP — `styles.css:330` already reserves it — and give it
  `background:var(--bg);z-index:2` for the length of the animation, or dip the moving rows to `opacity:.45`
  while they cross.

### Tap to rest takes 1.04 s, and 170 ms of it is dead air
- severity: papercut
- environment: desktop 1440×900 and phone 390×844, fixtures `fresh` and `longtime`
- steps:
  1. Cross off one line.
  2. Read the frame-by-frame trace of the row's `top` and `transform`.
- evidence: `$OUT/feel3.log` section A — the row's top is unchanged until **+598 ms**, then eases to rest at
  **+981 ms**; `$OUT/timing2.log` shows the strike ending at +432 ms. Frame burst `$OUT/sink-desktop-f0..f8.png`.
- why it matters: the ink finishes at 432 ms, then nothing at all happens for 170 ms, then a 520 ms sink starts.
  A gesture that is over in 110 ms of sound takes a full second to settle, and the pause in the middle makes the
  app feel like it is thinking. Note also that `styles.css:330` (`.row.moving{transition:transform .26s}`) is dead
  code — nothing ever adds `.moving`; the shipped FLIP is `duration: 520` (app.js:915), twice what that rule intends.
- proposed fix: `delay: it.done ? 320 : 160` (app.js:1082) and FLIP `duration: 300` (app.js:915), so the sink
  starts as the last of the ink lands and the whole gesture rests at ~620 ms.

### Today with nothing on it is a blank screen with no words
- severity: papercut
- environment: desktop 1440×900 and phone 390×844, fixture `fresh`
- steps:
  1. Open the line menu on each line and choose "Not today", until Today holds nothing.
- evidence: `$OUT/empty-today-desktop.png`, `$OUT/empty-today-phone.png`; `$OUT/empty2.log` — "rows on Today: 0 /
  screen: `Today's Five ⏎ + NEW LINE`".
- why it matters: this is reachable on any morning where nothing repeated into Today, not only by taking lines
  off by hand. Every other empty surface in the app says something — `Nothing here yet` (app.js:881),
  `Nothing matches “…”` (app.js:838), `Nothing finished on a previous day yet.` (panels.js:448) — and this one,
  the screen a person looks at all day, says nothing at all.
- proposed fix: render one line in the list area when Today is empty and no search is running:
  **"Nothing on Today yet. Add a line, or bring one over from Everything."**
- copy line: no current string; the empty case is unhandled in `render()` (app.js:774-838). The sibling strings
  are app.js:881 and app.js:838.

### After a sink, whatever row lands under a motionless cursor lights up
- severity: papercut
- environment: desktop 1440×900, fixture `fresh` (pointer devices only)
- steps:
  1. Cross off the top line with the mouse.
  2. Do not move the mouse. Watch the row that slides up into that position.
- evidence: `$OUT/sink-desktop-f4.png` — "Add a line of your own" carries the `.row:hover` background
  (`styles.css:141`) and its box shows the hover accent, though the pointer has not moved.
- why it matters: the app appears to be pointing at a line the person is not pointing at, one frame after they
  crossed off a different one. It undercuts the calm the rest of the screen is built for.
- proposed fix: add a `no-hover` class to `#list` for the length of the FLIP (cleared on the next real
  `pointermove`), guarding `.row:hover{background:var(--ink-2)}` and `.row:hover .box{border-color:var(--accent)}`.

### The first Settings open on the phone is ~450 ms with no sign the tap landed
- severity: papercut
- environment: phone 390×844, fixture `longtime`
- steps:
  1. Tap ⋯ (the sheet opens in 45 ms).
  2. Tap Settings and time it to `#p-settings[open]`.
- evidence: `$OUT/feel3.log` section E — "⋯ sheet open (first): 45 ms", "Settings from ⋯ (first, lazy panels.js):
  **453 ms**"; on desktop `$OUT/timing2.log` shows 297 ms first vs 253 ms second.
- why it matters: for nearly half a second the ⋯ sheet just sits there, the tapped row does not stay pressed,
  and nothing moves. On a slow connection (`panels.js` is 53 KB per DECISIONS.md "Structure") it is worse. Every
  other tap in the app answers in under 80 ms.
- proposed fix: warm the module on the first gesture beside the sound — `document.addEventListener("pointerdown",
  () => { sound.prime(); panels(); }, { once: true, capture: true })` (app.js:2023) — and hold the tapped row in
  its pressed state until the next panel opens.

### The knock is a 108 ms sound under a 380 ms stroke
- severity: proposal
- environment: desktop, fixture `fresh`; packs rendered offline at 44.1 kHz
- steps:
  1. Render each pack's `check` into an `OfflineAudioContext` and measure onset, peak and the point the signal
     falls below 0.01.
  2. Compare against the strike (`transition:transform .38s cubic-bezier(.16,1,.3,1)`, styles.css:201).
- evidence: `$OUT/feel3.log` section D —
  `knock: onset 0.1 ms, peak 6.6 ms, length 108 ms` · `bell: onset 0.1 ms, peak 6.5 ms, length 480 ms` ·
  `pencil: onset 3 ms, peak 112.5 ms, length 232 ms`.
- why it matters: the default pack is the one that feels earliest. The knock lands on the *start* of the strike
  and is gone before the ink is a third of the way across; the line then keeps drawing for another 270 ms in
  silence. Bell is the only pack whose tail outlives the stroke, and it is the only one that feels like the sound
  and the mark are the same event. Pencil is the closest fit (its energy centre at 112 ms, running to 232 ms).
- proposed fix: bring the strike to `.22s` so the ink lands inside the knock's decay, or give `knock.check` a
  second, quieter body at `t + 0.09` (a `tone` at `f0: 130 * bend, peak: 0.12, len: 0.16`) so the sound covers the
  stroke. DECISIONS.md "A sound that lives with the theme" says *"The accent still sets pitch and decay; the pack
  only sets the voice."* That is a good rule and this does not break it — the change is to the motion's duration,
  or to one pack's envelope, not to who owns pitch and decay.

### The finale card is fully on screen 110 ms before the sound and the confetti
- severity: proposal
- environment: desktop 1440×900, fixture `fresh`
- steps:
  1. Cross off the last remaining line on Today.
  2. Trace `animationstart/end` on `#finale` against the scheduled audio.
- evidence: `timing.mjs` output (frame burst `$OUT/finale-desktop-f00..f11.png`,
  `$OUT/finale-desktop-settled.png`): pointerdown at +203 ms; `astart finale-in` at +233; `aend finale-in` at
  +733; `sound.finish()` schedules its four tones at **+847** (644 ms after the tap, matching the
  `setTimeout(..., 640)` at app.js:1093).
- why it matters: the celebration screen arrives, finishes its half-second fade, sits still for a beat, and *then*
  the confetti and the chord arrive. Confetti and sound are perfectly together with each other (`fx.volley()` and
  `sound.finish()` are in the same callback) — it is the card that is early. The finale reads as two separate
  events instead of one.
- proposed fix: fire `sound.finish()` + `fx.volley()` at ~260 ms (as the last strike lands) and let `finale-in`
  run underneath it; or leave the sound at 640 ms and delay `#finale.on` (app.js:967) to ~500 ms so the card
  arrives *on* the chord.

### No haptic at the moment a gesture commits
- severity: proposal
- environment: phone 390×844 / android, fixture `longtime`
- steps:
  1. Swipe a line left past the 90 px "Not today" threshold and hold — nothing.
  2. Drag a sheet down past its dismiss threshold and hold — nothing.
- evidence: source, `app.js:1154` (the swipe commits on `pointerup`, `s.dx < -90`, no `buzz`) and `app.js:1723`
  (the sheet's dismiss test `dy > 90 || (dy > 30 && dy/dt > 0.5)`, no `buzz`); `sound.js` calls `navigator.vibrate`
  only from `check` (`buzz(8)`) and `finish` (`buzz([12,40,12,40,24])`).
- why it matters: on a phone the app's two commit-on-release gestures give no sign that the threshold has been
  crossed, so a person has to guess whether letting go will do the thing. A 6–8 ms tick at the crossing is the
  standard answer and costs nothing.
- proposed fix: `buzz(6)` once when `s.dx` first passes −90 in the swipe handler and once when the sheet drag
  first passes its dismiss test, latched so it fires on the crossing rather than every move.

---

## The five a AAA app would change, concretely

1. **Never drop the first knock.** Queue the check through the pack import (`sound.js` `play()`), or preload
   `packs.js` at idle. Today the app's most-repeated moment is silent on every cold page.
2. **Halve the gesture.** `delay: 320` (app.js:1082) and FLIP `duration: 300` easing `cubic-bezier(.2,.9,.25,1)`
   (app.js:915): sink starts as the ink lands, whole thing rests at ~620 ms instead of 1040 ms, no dead air.
3. **Shorten the strike to `.22s` and stagger wrapped lines at `.08s` instead of `.13s`** (styles.css:201,
   app.js:937). The ink then finishes inside the knock's 108 ms decay rather than 270 ms after it, and a
   three-line item stops taking 640 ms to cross out.
4. **Make the reorder read as one object moving past another.** `.moving` class on the FLIPping rows with an
   opaque background and `z-index`, plus a 20 ms per-row stagger so the list resettles as a wave rather than a
   block. Evidence: `finale-desktop-f03.png`.
5. **Choreograph the finale from the sound backwards.** Chord and volley at ~260 ms; `#finale` fades in over
   500 ms *starting* at 260 ms so it arrives with the confetti's peak; the glow flare rides the same envelope
   (and is skipped entirely under reduced motion). Add one 12 ms haptic at the chord on touch.

---

## What feels right, and what I could not measure

The strike itself is the best thing in the app: measuring a real overlay per rendered line (`layoutStrikes`,
app.js:921-942) and staggering the wrapped lines by 130 ms means a two-line task crosses out like a pen, not like
a CSS property, and the `cubic-bezier(.16,1,.3,1)` on the ink genuinely reads as a stroke slowing at the end of a
line. The `kick`/`pop` pair fires in the same frame as the class change (+3 ms after pointerdown) and the knock is
scheduled at `lead=0` in the same tick, so the *beginning* of the gesture is instantaneous and perfectly
synchronised — the problems are all in what happens after. Reduced motion is handled seriously and almost
completely: confetti is genuinely suppressed (0 non-transparent pixels sampled off the canvas, `feel3.log` C), the
FLIP is skipped, `kick`/`pop`/`arrive`/`sheet-in`/`pop-in` are all off, and the strike is kept at 80 ms so the
feedback still exists — only the glow flare escapes. The idle fade measured 4016 ms to the class and behaves
exactly as DECISIONS.md "Rail diet and the idle fade" describes, with the asymmetry the right way round (1.4 s out,
0.25 s and a 5 ms class flip back). The theme crossfade is clean: the `fading` class is on for 405 ms, the tick
sound fires at +0, and nothing trails, which is the `body.fading` decision working. Popovers (`pop-in .16s`) and
sheets (`sheet-in .26s`) both feel immediate — 45 ms to an open ⋯ sheet on the phone. And the no-result search
reads well (`Nothing matches “zzzqqq”` sitting under the field, `empty-search-desktop.png`).

What I could not measure. Screenshot capture costs 150–250 ms per frame in this harness, so the frame bursts are
coarser than the 60–100 ms I aimed for; every timing claim above therefore comes from the instrumented event
trace, not from the images, and the images are illustrations. I could not judge the *audible* result of any pack —
only its envelope, rendered offline — so "feels late" is an inference from onset/length against motion duration,
not a listening test; three packs were measured (knock, bell, pencil) and nine were not. I never reached
History-with-no-days or Removed-with-nothing-in-it: on the `fresh` fixture the Lists panel offers only
`["×","New list","Rename this list","Remove from this device","Open"]` (`empty.log`) and both live behind the
per-list `›` chevron, which I ran out of budget to open — `empty-lists-desktop.png` and `empty-history-desktop.png`
show how far I got. The "Shared with me" group simply does not render when there is nothing shared, so there is no
empty state to judge. I did not test `android`, `ipad` or `phoneLandscape`, nor sound behaviour after a
backgrounding/interruption (`sound.foreground`), nor haptics on real hardware. One thing outside this lens that I
noticed and did not verify: in `$OUT/popover-desktop-f1.png` the rail count reads `0/0` while four undone lines are
on the Today tab — the Structure or Model lens should confirm whether that is real or a misreading of 11 px type.
