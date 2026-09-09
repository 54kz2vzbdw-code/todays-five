# Track C, stage 1 — the kit reaches the screen

What was decided on the Watch's look, and what each decision cost. Everything with a number in it
was measured on the Apple Watch Series 11 46mm simulator (watchOS 26.5, `4594CB69`) on this machine,
against `Kits`' generated table at build 158.

---

## The constant did not merely need replacing; its argument had stopped being true

`WatchTheme.swift` shipped in Phase 3 holding `#A86014`, and it argued for it:

> The fallback is a good one and was chosen, not fallen into: `#A86014` is the brand accent that
> **Dark, Paper and Terminal all carry** — the day default since 1.11, the night default, and the
> app's own — so the three likeliest themes are already right.

Track A made that false in the same round. Terminal has its own `#4AF07A` back and Paper its own
`#C8321F`; **only Dark carries `#A86014` now**, and it carries it as its own colour rather than as a
pin over somebody else's. The premise of the fallback was that three kits agreed. They no longer do.

So the file holds a resolved `Kit` — palette as `Color`s, font pair as `Font`s — and the constant is
gone from the Watch entirely. Which is worth saying plainly: a comment that argues for a decision is
the best kind, and it is also the kind that can go stale in a way a bare constant cannot. **A
premise written down is a premise something else can invalidate**, and the only defence is to check
the premises of a file you are about to leave alone.

## The phone-follows channel is still not built, and that is now a decision

Phase 3 recorded "written down as not built" because the payload carried no colour. The payload
could carry one today — `WatchLinkPayload.extra` passes unknown keys through, which is how the
Secret kits already cross — so the honest version of this round's answer is not "we cannot" but "we
will not".

**Theme is a per-device preference in this app, and a Watch is a device.** The web's own model says
so: two slots and a switch live in `meta.device`, per device, and nothing about them syncs. A Watch
that inherited a phone's kit would be the one surface in the product where a theme travels.

What *does* cross is narrower and is a permission rather than a preference: the two **Secret** kits'
palettes, from a phone whose person has unlocked them, so a wrist can render them at all. A phone
that re-locks takes them off the wrist on the next payload. `WatchThemeStore` reads them from the
same App Group key `WatchLinkReceiver` writes rather than from the receiver itself, because a theme
has to resolve on a launch that never starts a `WCSession` (`-TFWatchDemo`), and one reader of one
key is a smaller thing to keep true than two objects agreeing.

## The type, and the one number that is not the obvious one

`Font.custom(face.postScriptName, size:relativeTo:)` at every call site, so the Watch's own text-size
setting still moves the type. The name is `KitFace.postScriptName` from the generated table and never
the family in `theme.js` — those are the fiction `styles.css`'s `@font-face` rules invent, and ten of
twenty-two resolve to Helvetica.

`tracking` is a multiplication and needs no argument: `theme.js` records em, `.tracking()` takes
points, so it is `em × size` — except that it must be the **scaled** size, or the letter-spacing
stays put while the type grows. `UIFontMetrics(forTextStyle:).scaledValue(for:)` is the same
machinery `relativeTo:` uses, asked directly. Measured on this device at the default watch text size:
**17pt relative to `.title3` renders at 16.00**, so Lato's `-0.025em` is **−0.400 pt** and not −0.425.

**`lineHeight` is the one that is not obvious, and the naive version is wrong in the same direction on
every kit.** `theme.js`'s `lh` is a multiple of the point size; SwiftUI's `.lineSpacing` is *extra
space added to the face's own line height*, which is already 1.2–1.4× the point size. Measured: **Lato
Black at 16.00pt stands 19.20 points tall** (`CTFontGetAscent + Descent + Leading`) against the lato
pair's target of `1.14 × 16.00 = 18.24`. So the correct answer is **0.00** extra leading — and
`(lh − 1) × size` would have added **2.24 points** of air to every line of every list, on a screen
where five lines is the whole product. The face is therefore measured, and the result floored at
zero, because SwiftUI will not tighten a line below its face's own metrics.

## `-TFFontSelfTest`, and the two things it found

A missing custom font renders the system face with **no log and no error**. A screenshot of Terminal
set in Helvetica looks like a screenshot of Terminal. So the self-test is the only mechanism in the
round that turns a silent fallback into a failure, and it asks three questions per face: is the
family in `CTFontManagerCopyAvailableFontFamilyNames()`, does `CTFontCreateWithName` hand back the
PostScript name it was asked for rather than a fallback's, and do the pair's two ui weights actually
render differently.

**Final tally, on the watch simulator:**

```
[tfive] font self-test: begin kits=16 pairs=13 files=33 familiesOnDevice=75
[tfive] font self-test: bundled=33/33
[tfive] font self-test: weights told apart by advance=12 ink=1
[tfive] font self-test: faces=33 end pass=96/96
[tfive] font self-test: at 17pt title3 scales to 16.00, task line height 19.20,
                        tracking -0.400, extra leading 0.00
```

**1. Advance width cannot tell two weights apart, and the first run failed because of it.**
`IBMPlexMono-Regular` and `IBMPlexMono-SemiBold` set the same 21-character ruler to the same
**214.20** points. That is not a bug in the fonts; that is what monospaced *means*. The check now
falls back to the **ink** — `CTLineGetImageBounds`, the box the drawn glyphs actually cover, which is
wider in the heavier face even when the cell it sits in is not — and the tally says which
discriminator settled each pair, because "told apart by ink" on a pair that is *not* monospaced would
itself be worth looking at. Twelve by advance, one by ink, and the one is `mono`.

**2. Walking the kits leaves two of the thirty-three bundled faces untested.** The 16 open kits name
only **11** of the 13 pairs: `baloo` and `fredoka` belong to the two Secret kits and to nothing else.
A self-test that iterated kits would have covered 31 faces and reported a clean 74/74 while two files
in the bundle had never been asked to resolve — and the day they are asked is the day somebody
unlocks a Secret kit, which is precisely when no console is attached. **A font pair is not a secret**
(all 33 files ship to every wrist; the Secret rule is about palettes), so the test walks all thirteen
pairs. That took it from 74 checks to **96**.

The first run also printed the `mono` failure twice, once for Terminal and once for Teletype, which
reads like two bugs. Pairs are deduped now.

## The ground, and the two costs that cannot be paid off

`.preferredColorScheme(.light)` is **inert** on watchOS — measured in the Phase 4 checkpoint, over a
cream ground, leaving every `.primary` white and invisible. `.environment(\.colorScheme, .light)`
works. watchOS has no light appearance at all, which is why **every** `.primary`, `.secondary` and
system colour is gone from every Watch screen: fourteen call sites across five files, each of which
was right only for as long as nobody chose a light kit.

The ground itself is set three ways, because one is not enough: `.containerBackground(_:for:
.navigation)` paints the watchOS screen including its corners, `.background` covers the views that
are not in a navigation container (the sheets, the Always-On frame), and `.listRowBackground` is
separate again — `.listStyle(.carousel)` draws its own translucent grey platter, which on Paper's
cream is a grey card on paper. The platters are now the kit's `ink2`. On Dark that is `#0E140F`
against a `#070A08` ground, which is a quieter separation than the system's and is the intended
trade: the platter belongs to the kit or it belongs to the system, and it cannot belong to both.

**Cost 1: the system clock stays white, and it is worse than "low contrast".** Measured on the Paper
screenshot: the glyph core of the time is exactly `(255, 255, 255)` and the ground behind it is
exactly `(247, 242, 232)` — Paper's `#F7F2E8`, byte for byte. That is **1.12:1**. There is no API for
it: not `.tint`, not a toolbar item, not an `Info.plist` key; the time is drawn by the system outside
the app's layer. **A light kit on this device ships with an illegible clock.** Accepted, in writing,
because the brief asked for Paper's cream and this is what Paper's cream costs.

The one place that *does* have a door out of it is the navigation title, which the string-taking
`.navigationTitle("Lists")` also draws in the system's colour. The watchOS-exclusive view-taking
overload takes a `Text` we can colour, and the picker now uses it. Same failure, one of the two has
a fix, and the difference is worth naming rather than lumping together.

**Cost 2: the ground is the battery.** Below.

## Paper's ground, measured — and it is not a battery number

`simctl` models no OLED power and nothing on this machine produces watts. What a screenshot *can*
say honestly is how hard the panel is being driven. The same five-line demo Today, rendered under
three kits, screenshotted at native **416×496**, mean per-channel **linear drive at γ 2.2** as a
fraction of a full-white panel:

| kit | flat | Rec.709 luma | OLED-weighted | max channel |
| --- | --- | --- | --- | --- |
| **dark** (`#070A08`) | 0.0285 | 0.0293 | 0.0281 | 0.0306 |
| **terminal** (`#070A08`) | 0.0284 | 0.0323 | 0.0276 | 0.0352 |
| **paper** (`#F7F2E8`) | **0.7868** | **0.8033** | **0.7755** | **0.8450** |

**Paper ÷ dark: 27.6, 27.5, 27.6, 27.6 — 27.5–27.6× across all four weightings.**
Paper ÷ terminal: 27.7, 24.9, 28.1, 24.0 — 24–28×, the spread being Terminal's green text, which the
luma and max weightings notice and the flat one does not.

The three frames are the same layout to the pixel: **51.1%** of the 206,336 pixels are exactly the
kit's ground in each (105,390 / 105,373 / 105,401), so what is being compared is one screen's two
paint jobs and not two different screens.

**It is not a battery number, and it must never be quoted as one.** Three reasons, and all three
apply every time it is repeated:

1. **No panel calibration.** A screenshot is sRGB values, not emitted photons. The real transfer
   curve of the Series 11's panel, its per-primary efficiency and its brightness setting are all
   absent from the arithmetic.
2. **No static floor.** Panel driver, backplane, SoC and radios draw power that has nothing to do
   with what is on screen. A 27× ratio in the emissive term is a much smaller ratio in the total.
3. **No duty cycle.** The Watch's screen is off, or Always-On dimmed, for the overwhelming majority
   of the day. The ratio applies only while a person is looking at Today.

**The prior measurement in `PLAN-apple-phase4.md` was dark 0.0466, cream 0.8146, 17.5×; this one is
dark 0.0285, cream 0.7868, 27.6×.** The cream agrees to within 3.5%. The dark does not, and the
denominator is where a ratio like this is fragile: a dark frame is *almost all* ground, so its drive
is dominated by how much bright chrome happens to be on screen — the white system clock, the scroll
indicator, how far the carousel has scrolled a bright row into view. The lesson is in the ratio's
sensitivity rather than in either number: **a ratio whose denominator is near zero is not a stable
quantity, and reporting it to three significant figures is a claim the method cannot support.** Both
runs support the same sentence, which is the one worth keeping: *a cream ground drives this panel
between one and two orders of magnitude harder than a near-black one.*

## What stage 1 did not settle

- **Always-On was not rendered.** `simctl` cannot put a watch simulator into luminance-reduced mode,
  and there is no launch argument for it. The flattening rule is written and its colour is now the
  kit's own `dim` rather than `Color(white: 0.62)`, but no screenshot of it exists.
- **Only Today was screenshotted.** The picker sheet, the add sheet and the one-thing page are all
  behind a tap or a scroll, and `simctl` has no `ui tap` for a watch. Their grounds are set the same
  way Today's is; that they *look* right is a stage-2 question and a wrist question.
- **Three kits, not eighteen.** Dark, Paper and Terminal — the three the old constant claimed to
  serve — as a smoke test. The full eighteen are stage 2's, along with the picker that makes choosing
  one a thing a person can do rather than a launch argument.
