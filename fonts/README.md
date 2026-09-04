# Fonts

Self-hosted so the app loads nothing from a third party. Every file is the **latin** subset Google Fonts serves,
as woff2, in only the weights the pairs in `theme.js` use; variable files where the family has one. The
`@font-face` rules (with `unicode-range` and `font-display: swap`) live at the top of `styles.css`, so a face is
downloaded the first time a theme renders text in it and the service worker keeps it from then on.

| family | file(s) | licence |
|---|---|---|
| Lato | lato-400/700/900 | SIL Open Font License 1.1 |
| PT Sans | pt-sans-400/700 | SIL Open Font License 1.1 |
| Fraunces | fraunces-500-700 (variable, opsz) | SIL Open Font License 1.1 |
| Quicksand | quicksand-500-700 (variable) | SIL Open Font License 1.1 |
| Space Grotesk | space-grotesk-500-700 (variable) | SIL Open Font License 1.1 |
| IBM Plex Sans / IBM Plex Mono | ibm-plex-sans-400-600 (variable), ibm-plex-mono-400/600 | SIL Open Font License 1.1 |
| Playfair Display | playfair-display-700-800 (variable) | SIL Open Font License 1.1 |
| Source Serif 4 | source-serif-4-400-600 (variable, opsz) | SIL Open Font License 1.1 |
| Manrope | manrope-500-800 (variable) | SIL Open Font License 1.1 |
| DM Serif Display / DM Sans | dm-serif-display-400, dm-sans-400-700 (variable, opsz) | SIL Open Font License 1.1 |
| Outfit | outfit-500-800 (variable) | SIL Open Font License 1.1 |
| Nunito Sans | nunito-sans-400-700 (variable, opsz) | SIL Open Font License 1.1 |
| JetBrains Mono | jetbrains-mono-500-800 (variable) | SIL Open Font License 1.1 |
| Cormorant Garamond | cormorant-garamond-600-700 (variable) | SIL Open Font License 1.1 |
| Josefin Sans | josefin-sans-400-700 (variable) | SIL Open Font License 1.1 |
| Archivo | archivo-500-800 (variable) | SIL Open Font License 1.1 |
| Lora | lora-500-700 (variable) | SIL Open Font License 1.1 |
| Karla | karla-400-700 (variable) | SIL Open Font License 1.1 |

All families are distributed by Google Fonts under the SIL Open Font License 1.1 (https://openfontlicense.org),
which permits bundling and redistribution with software as long as the fonts themselves are not sold on their own.
The copyright notices are embedded in each file's name table. Re-download with a request per family to
`fonts.googleapis.com/css2` using the axes in `theme.js` (a weight range asks for the variable file) and keep the
`/* latin */` block of each response.
