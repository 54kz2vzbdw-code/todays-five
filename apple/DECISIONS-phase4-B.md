# Track B — the kit table reaches the core

## A build-time generator cannot parse `theme.js`, and the reason is arithmetic

The obvious shape was ConfigGen's: a plugin that reads the repo's own file at build time, so no
value is ever typed into Swift. It cannot work here, and not for a plumbing reason.

**62 of the 314 hex colour tokens in the finished kit table appear nowhere in `theme.js`'s source,
and all 18 of 18 kits have at least one.** Every `hairSolid` is computed. So are Harbor's
`accentText` `#046D6D`, Teletype's accent `#119449`, Sketch's `#9D7700`, and every one of Dark's
greys. They come out of `finalize()` → `elevated()` → `hairSolidFor()` → `ensure()` → `oklch()`:
sRGB→linear→OKLab with cube roots, a 14-iteration binary-search gamut clamp, WCAG contrast, and a
60-step lightness nudge loop.

A Swift plugin would have to reimplement all of that and match JavaScript doubles bit for bit. It
would *look* like it worked — sixteen kits' worth of literals extract cleanly with a regex — and be
silently wrong on exactly the derived greys that carry the contrast floors. That is the forbidden
second copy of the palette in its worst possible form: one that passes its own tests.

And `node` is genuinely out of reach: `/usr/bin/env -i /bin/sh -c 'command -v node'` exits 1 on the
`PATH` a build sees.

**How to apply:** before writing a generator, count how much of the output is *computed* rather than
*written*. A generator can extract literals; it cannot re-derive a pipeline. If the fraction is not
zero, generate from a fixture the owning language wrote.

## JavaScriptCore is what keeps the fixture honest

A fixture alone does not satisfy "one source of truth". There is no `package.json`, no CI, and every
generator in this repo is run by hand — so a committed `kits.json` would drift the first time
somebody edited a colour and did not regenerate, which is precisely the failure Track B exists to
prevent.

`theme.js` has no imports and touches `localStorage` only inside `applyTheme`, so it is
self-contained. Stripping the `export ` keyword and evaluating it in a Swift `JSContext` reproduces
`CURATED` exactly — byte-identical to Node, 17,674 bytes, about 6 ms. So `KitFixtureTests` asserts
the fixture still equals **live `theme.js`**, not a snapshot of it.

The platform split is the part that makes this safe rather than clever: **`JavaScriptCore.framework`
is present in the macOS and iPhoneOS SDKs and absent from the watchOS SDK.** The check can never
ship to a wrist. It is guarded `#if canImport(JavaScriptCore)` regardless, so a test target built
for watchOS would drop it rather than fail to link.

The mapping from `CURATED` to the fixture lives *in* the fixture, as `expr`, so the generator, the
Node test and the Swift drift test run one definition of it instead of three that can disagree.

**How to apply:** a fixture pins a value; it does not pin the *relationship* between two
implementations. If nothing re-derives the fixture on every run, add the thing that does.

## A second prebuild plugin on one target does not collide

Phase 3 discovered that a build-tool plugin's work directory is keyed by package, target and plugin
and **not by platform**, so two targets linking one package planned the same producer twice and the
build refused: *"Multiple commands produce …/ConfigGen/Config.generated.swift"*. The fix was a
prebuild command, which hands the build system a *directory to glob* rather than a file it promises
to produce.

The open question this round was whether adding `KitsGen` beside `ConfigGen` would bring the
collision back. It does not. Measured, on the condition that produced the original failure — both
platforms, both targets:

```
xcodebuild -scheme TodaysFive      -destination 'generic/platform=iOS Simulator'      ** BUILD SUCCEEDED **
xcodebuild -scheme TodaysFiveWatch -destination 'generic/platform=watchOS Simulator'  ** BUILD SUCCEEDED **
```

The reason is the same one that fixed Phase 3: each plugin gets its own
`pluginWorkDirectoryURL`, and a prebuild command declares no output *path* to collide on. Two
plugins are two globbed directories, and the build system is content with both.

**How to apply:** the Phase 3 lesson generalises further than it was written. A prebuild command is
not merely a workaround for two platforms — it is what makes plugins on a shared package compose at
all.

## The font names in `theme.js` are a fiction `styles.css` invents

`PAIRS` names CSS families — "Outfit", "Manrope", "DM Sans" — and those names exist only because
`styles.css` declares them in 26 `@font-face` rules. **No Apple API does that rename.** Registering
all 26 files and asking `CTFontCreateWithName` for each of the 22 families `theme.js` records
resolves **10 of 22 to Helvetica**: Quicksand, Space Grotesk, Manrope, DM Sans, Outfit, Nunito Sans,
Cormorant Garamond, Josefin Sans, Archivo and Fredoka. Those are the *task* faces of midnight,
harbor, forest, sketch, arcade, dusk, ember and superpink — the list text of eight kits, in the
system font, with **no log and no error**.

The real names are inside the binaries: `outfit-500-800.woff2` is family "Outfit Thin",
`manrope-500-800` is "Manrope ExtraLight", `nunito-sans-400-700` is "Nunito Sans 12pt ExtraLight
12pt".

So `gen-watch-fonts.py` writes the TTFs and then **reads the family and PostScript name back out of
the file it just produced**, into `test/fixtures/watch-fonts.json`. Nothing is derived from
`theme.js` and nothing is guessed. Renaming the families to match the CSS names was considered and
rejected: these are OFL 1.1 faces and rewriting a name table to impersonate the upstream name is the
one thing that licence is careful about. Generating the map costs a fixture; renaming would cost a
licensing argument.

The variable faces are instanced to the weights `theme.js` actually asks for
(`fontTools.varLib.instancer`), because `.weight()` is a measured no-op on a variable file with no
`fvar` named instances — which is exactly what `fraunces-500-700` and `source-serif-4-400-600` are,
and Fraunces is Pink's and Blush's task face. 33 static faces, 1.3 MB, from 732 KB of woff2.
`updateFontNames=True` raises `ValueError: Cannot find Axis Values` on a face whose STAT table lacks
the weight, so the naming is done by hand and read back.

**How to apply:** when a name crosses from CSS into a native toolkit, check that the name is a
property of the file and not of the stylesheet. A wrong font name does not fail; it falls back.

## The Secret pair reaches a wrist without ever being in a binary

The generated table holds **16** kits. `superpink` and `birthday` are in the fixture — the tests
measure all 18 — and in no shipped binary at all, which `KitFixtureTests` asserts directly so it
cannot regress quietly.

They arrive over the channel instead. The phone's `WebViewController.reconcileVault()` already pulls
the whole `tf/v2/meta` string and parses it; `meta.device.secret` is a sibling key in the JSON it
already has in hand, so reading it is two lines and no new bridge and no web change. When it is set,
`WatchLinkSender` puts the two kits' tokens into `WatchLinkPayload.extra`, which has passed unknown
keys through since Phase 3 — `COMPATIBILITY.md` §3's rule applied to a channel, paying for itself a
second time. Absent means remove, the same authority rule links already follow, so re-locking on the
phone reaches the wrist.

**The trap:** `WatchLinkPayload`'s decode sorts its keys and its encode preserves insertion order,
and `JSONObject`'s `==` compares order. Inserting the new keys unsorted silently breaks round-trip
equality — the same class of bug as Phase 3's nondeterministic codec, arriving at the same file from
the other direction. The keys are inserted sorted, and a test says so.

Worth writing down plainly: **the Secret palettes are not cryptographically secret.** `theme.js`
ships to every browser and the gate is an FNV-hashed passphrase. "A Watch that has not unlocked them
does not carry them" is a stricter product rule than the web's own model. It is kept because it was
asked for, not because the data would otherwise leak.
