# Fonts — the bundled copies

**Generated. Do not edit a file here by hand.** `python3 apple/tools/gen-watch-fonts.py` produces
every `.ttf` in this directory from the repo's own `fonts/*.woff2` — the same latin subset the web
serves — and writes `test/fixtures/watch-fonts.json`, which is the only place a family or PostScript
name should ever be read from.

The Watch app has no `@font-face` and no CSS, so it lists these files in `UIAppFonts` and asks
CoreText for them by name.

## The one thing to know

**The family names in `theme.js` are a fiction that `styles.css` invents.** An `@font-face` rule
renames whatever file it points at, so the web can call `outfit-500-800.woff2` "Outfit" while the
binary calls itself **Outfit Thin**. CoreText asks the file. Twelve of the twenty-two families
`theme.js` names are not what the file says:

| `theme.js` says | the file says |
|---|---|
| Archivo | Archivo SemiBold |
| Cormorant Garamond | Cormorant Garamond Light |
| DM Sans | DM Sans 9pt |
| Fredoka | Fredoka Light |
| IBM Plex Mono (at 600) | IBM Plex Mono SemiBold |
| Josefin Sans | Josefin Sans Thin |
| Lato (at 900) | Lato Black |
| Manrope | Manrope ExtraLight |
| Nunito Sans | Nunito Sans 12pt ExtraLight 12pt |
| Outfit | Outfit Thin |
| Quicksand | Quicksand Light |
| Space Grotesk | Space Grotesk Light |

A missing custom font on Apple platforms renders the system face with **no log and no error**, so
guessing a name here fails silently and looks like a design choice. Read the map.

Variable files are instanced to static weights (`Font.custom(…).weight(…)` is a measured no-op on a
variable file with no `fvar` named instances, which is Fraunces and Source Serif 4), and an instance
carries its weight in its name — "Outfit Thin 800", `Outfit-Thin-800` — because two instances of one
file would otherwise share a PostScript name and CoreText refuses a duplicate registration. Statics
keep their names untouched.

## What is here

33 faces, 1.18 MB, instanced from 24 of the repo's 26 woff2 files (688 KB). `lato-400` and
`lato-700` are deliberately absent: Lato is a task face in one pair and that pair draws it at 900.

| source | produced | family | size |
|---|---|---|---|
| archivo-500-800.woff2 | archivo-500.ttf, archivo-800.ttf | Archivo SemiBold 500 / 800 | 80 KB |
| baloo-2-500-800.woff2 | baloo-2-700.ttf | Baloo 2 700 | 44 KB |
| cormorant-garamond-600-700.woff2 | cormorant-garamond-700.ttf | Cormorant Garamond Light 700 | 75 KB |
| dm-sans-400-700.woff2 | dm-sans-400.ttf, dm-sans-700.ttf | DM Sans 9pt 400 / 700 | 65 KB |
| dm-serif-display-400.woff2 | dm-serif-display-400.ttf | DM Serif Display | 38 KB |
| fraunces-500-700.woff2 | fraunces-600.ttf | Fraunces 600 | 35 KB |
| fredoka-500-700.woff2 | fredoka-600.ttf | Fredoka Light 600 | 35 KB |
| ibm-plex-mono-400.woff2 | ibm-plex-mono-400.ttf | IBM Plex Mono | 23 KB |
| ibm-plex-mono-600.woff2 | ibm-plex-mono-600.ttf | IBM Plex Mono SemiBold | 23 KB |
| ibm-plex-sans-400-600.woff2 | ibm-plex-sans-400.ttf, ibm-plex-sans-600.ttf | IBM Plex Sans 400 / 600 | 90 KB |
| jetbrains-mono-500-800.woff2 | jetbrains-mono-800.ttf | JetBrains Mono 800 | 56 KB |
| josefin-sans-400-700.woff2 | josefin-sans-400.ttf, josefin-sans-700.ttf | Josefin Sans Thin 400 / 700 | 54 KB |
| karla-400-700.woff2 | karla-400.ttf, karla-700.ttf | Karla 400 / 700 | 53 KB |
| lato-900.woff2 | lato-900.ttf | Lato Black | 28 KB |
| lora-500-700.woff2 | lora-700.ttf | Lora 700 | 46 KB |
| manrope-500-800.woff2 | manrope-500.ttf, manrope-800.ttf | Manrope ExtraLight 500 / 800 | 70 KB |
| nunito-sans-400-700.woff2 | nunito-sans-400.ttf, nunito-sans-700.ttf | Nunito Sans 12pt ExtraLight 12pt 400 / 700 | 65 KB |
| outfit-500-800.woff2 | outfit-800.ttf | Outfit Thin 800 | 32 KB |
| playfair-display-700-800.woff2 | playfair-display-800.ttf | Playfair Display 800 | 52 KB |
| pt-sans-400.woff2 | pt-sans-400.ttf | PT Sans | 22 KB |
| pt-sans-700.woff2 | pt-sans-700.ttf | PT Sans (Bold) | 22 KB |
| quicksand-500-700.woff2 | quicksand-500.ttf, quicksand-700.ttf | Quicksand Light 500 / 700 | 67 KB |
| source-serif-4-400-600.woff2 | source-serif-4-400.ttf, source-serif-4-600.ttf | Source Serif 4 400 / 600 | 103 KB |
| space-grotesk-500-700.woff2 | space-grotesk-700.ttf | Space Grotesk Light 700 | 31 KB |

## Licence

Every face here is **SIL Open Font License 1.1** (<https://openfontlicense.org>), as distributed by
Google Fonts. The table below is `fonts/README.md`'s, carried with the copies so the provenance
travels with the bytes.

| family | licence |
|---|---|
| Lato | SIL Open Font License 1.1 |
| PT Sans | SIL Open Font License 1.1 |
| Fraunces | SIL Open Font License 1.1 |
| Quicksand | SIL Open Font License 1.1 |
| Space Grotesk | SIL Open Font License 1.1 |
| IBM Plex Sans / IBM Plex Mono | SIL Open Font License 1.1 |
| Playfair Display | SIL Open Font License 1.1 |
| Source Serif 4 | SIL Open Font License 1.1 |
| Manrope | SIL Open Font License 1.1 |
| DM Serif Display / DM Sans | SIL Open Font License 1.1 |
| Outfit | SIL Open Font License 1.1 |
| Nunito Sans | SIL Open Font License 1.1 |
| JetBrains Mono | SIL Open Font License 1.1 |
| Cormorant Garamond | SIL Open Font License 1.1 |
| Josefin Sans | SIL Open Font License 1.1 |
| Archivo | SIL Open Font License 1.1 |
| Lora | SIL Open Font License 1.1 |
| Karla | SIL Open Font License 1.1 |
| Fredoka | SIL Open Font License 1.1 |
| Baloo 2 | SIL Open Font License 1.1 |

The OFL permits bundling and redistribution with software as long as the fonts are not sold on their
own. The copyright notices are embedded in each file's `name` table and are carried through the
conversion untouched. **No family has been renamed to the CSS name** — a weight suffix on an instance
is the only naming change this pipeline makes, and it exists so CoreText can tell two instances of
one file apart.

### One question left open, on purpose

OFL 1.1 calls a format change a Modified Version, and §3 says a Modified Version may not carry the
family's **Reserved Font Name**. Ten of these 33 faces declare one — Lato, DM Serif Display, Josefin
Sans, Lora, Playfair Display, Quicksand and Source Serif 4 — and they keep their names here. The
repo's own `fonts/*.woff2` are in exactly the same position and have been since v4: Google's subsets
are themselves modified versions distributed under those names. `reservedFontName` is recorded per
face in `test/fixtures/watch-fonts.json` so the question stays visible rather than folded away. If
the answer ever comes back "no" — App Store review is where it would — the remedy is one line in
`set_names` and a regenerated map, and the map is what makes it one line rather than 26 hand edits.
