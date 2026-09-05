# Today's Five

> Other people use this. Before changing anything, read [COMPATIBILITY.md](COMPATIBILITY.md): the invariants (links, key derivation, document shape, server contract, local storage, service worker) and the release checklist every change must pass.

A short list built to be left open on screen all day, on any device, behind a link that is also the key.

Live: https://54kz2vzbdw-code.github.io/todays-five/

## What it does

- **Today** is the hero view: a handful of lines in type that fills the screen. Tap or click a line (or press its number) to cross it off; the strike draws across every wrapped line, the line settles to the bottom, confetti fires. Finish them all and the finale plays. Done lines move to History at the start of the next day; undone ones carry over.
- **Everything** (press `A`) holds the backlog: sections, reorder by drag or `⌥↑/↓`, a labelled **Today** toggle puts a line on Today, notes.
- **Encrypted end to end.** The list is sealed on the device (AES-256-GCM) before it is saved or synced; the server stores ciphertext, a revision number and timestamps. The edit link `#/l/…` is the credential; it derives a view-only link `#/r/…` that can read but never write. Rotate replaces both. Lose the link, lose the list: nobody can recover it.
- **Sync** between devices through Supabase, no accounts. Offline edits merge when you reconnect; nothing is lost or duplicated. Remote changes slide in quietly; sounds and confetti only follow what you did on this device. Idle lists cost bytes, not kilobytes, to poll.
- **Themes**: Dark, Light, Pink plus nine more curated kits, each with its own fonts, sounds and confetti; or derive your own from one accent colour with guaranteed contrast. `T` opens the picker. Fonts are self-hosted; nothing loads from a third party.
- **Installable**: add to the Home Screen on iOS or Install on the Mac; the icon carries the link. Bottom sheets on the phone, popovers on the desktop; `?` is the keys-and-gestures reference, ⋯ → How it works the long-form page.
- **1.0** (it shipped as 4.0.0): lines that repeat (every day, weekdays, chosen days, monthly) and come back undone on their next day; "Not today" (swipe left, `-`, or the line menu); one-thing mode (`O` or the count); search in Everything (`/`); templates saved from a section; a line's menu can move it to another list; Recently deleted with Restore; who's here (a dot per other open device); a day review card, a theme schedule, three new sound packs (typewriter, marble, pop); export as JSON or Markdown and import; an add-from-anywhere URL for Shortcuts and bookmarklets; "Delete this list everywhere" with a ten-second undo; a what's-new toast after an update. One Settings sheet (⋯ → Settings) holds every preference.
- **1.1**: quieter. A line is the checkbox and the words: ⋯ appears on hover on the desktop (click for the menu, drag to move the line), a hold on the phone lifts the line (drag to move, let go for the menu), swipe right opens the menu, swipe left is Not today. The rail is the date, the count with the sync dot, the two views, Share and ⋯; Theme, Sound and Full screen live in ⋯ (`T`, `M`, `F` still work); on the desktop the rail and footer fade when the mouse rests. No tour: the first list is the tutorial and three one-line hints show once each (the star, drag, the menu). A theme you make carries its own sound pack (`T2:` codes; `T1:` codes still import). Versions are a marketing version plus a build number from here on: About shows `1.1 (build N)`, and what shipped as 4.0.0 is 1.0.

## Files

Build-less ES modules served straight from this repo by GitHub Pages: `index.html`, `about.html` (how it works & privacy, version, changelog), `styles.css` (tokens + self-hosted `@font-face`; what Today needs) + `panels.css` (every dialog; loads after first paint), `app.js` (the UI that every open needs), `panels.js` (every panel, the `?` reference and How it works; loads on first use), `exporter.js` (export hand-off and import; lazy), `model.js` (data, merge, rollover, recurrence, templates, export), `sync.js` (persistence + transports + sync engine + presence), `crypto.js` (link derivation + envelope), `theme.js`, `sound.js` (the audio-context state machine) + `packs.js` (the six engines; lazy), `fx.js`, `qr.js` (vendored QR encoder, MIT), `vendor/realtime.js` (vendored Supabase Realtime client, MIT), `fonts/` (latin woff2), `sw.js`, `version.js` (marketing version + build number), `whatsnew.json`, `config.js` (Supabase URL + publishable key), `supabase/` (schema and migrations), `tools/` (the browser and real-backend suites, the dev server, the before/after screenshot tool, the CSP hash tool), `shots/` (the screenshots PLAN.md shows).

- [COMPATIBILITY.md](COMPATIBILITY.md) — the invariants and the release checklist. Read it first.
- [SETUP.md](SETUP.md) — the manual steps: the two SQL pastes, re-adding the phone, pause/resume.
- [PLAN.md](PLAN.md) — architecture, merge design, the iOS install-path probes, the v3 crypto and abuse design, the v4 information architecture and document shape.
- [DECISIONS.md](DECISIONS.md) — the calls made where the briefs left things open.

## Tests

```bash
for t in model theme crypto sync sound features compat; do node test/$t.test.js; done
node tools/serve.js 8790 . &   # then (BASE=http://127.0.0.1:<port>/ if 8790 is taken)
node tools/e2e4.js             # the browser suite: Playwright + the installed Chrome, both viewports, on ?transport=local
node tools/realsync4.js        # the real-backend suite, against the live Supabase project in config.js
node tools/shots.js shots/1.1/after   # a screenshot of every surface at 1440×900 and 390×844
node tools/csp-hash.js index.html about.html   # the hashes the CSP metas need after an inline script changes (--write updates them)
```

The crypto test pins the key-derivation vectors: if it fails after a change, the change would orphan every existing list. `test/compat.test.js` runs v4 documents through the frozen v3 model in `test/fixtures/` (COMPATIBILITY.md §3). The browser suite runs the app with `?transport=local`, a same-origin BroadcastChannel transport that exercises the identical sync and crypto engine; the real-backend suite creates a few throwaway lists on the live project and deletes them.
