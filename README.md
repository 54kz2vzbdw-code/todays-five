# Today's Five

A short list built to be left open on screen all day, on a Mac and on an iPhone, behind a secret link.

Live: https://54kz2vzbdw-code.github.io/todays-five/

## What it does

- **Today** is the hero view: a handful of lines in type that fills the screen. Click a line (or press its number) to cross it off; the strike draws across every wrapped line, the line settles to the bottom, confetti fires. Finish them all and the finale plays. Done lines move to History at the start of the next day; undone ones carry over.
- **Everything** (press `A`) holds the backlog: sections, reorder by drag or `⌥↑/↓`, star a line to put it in Today, notes.
- **Sync** between devices by a secret link (`#/l/<22 base62 chars>`) through Supabase, no accounts. Offline edits merge when you reconnect; nothing is lost or duplicated. Remote changes slide in quietly; sounds and confetti only follow what you did on this device.
- **Themes**: Dark, Light, Pink plus nine more curated kits, each with its own fonts, sounds and confetti; or derive your own from one accent colour with guaranteed contrast. `T` opens the picker.
- **Installable**: add to the Home Screen on iOS or Install on the Mac; the icon carries the secret link. Keep-screen-awake toggle, offline shell, undo, keyboard help (`?`).

## Files

Build-less ES modules served straight from this repo by GitHub Pages: `index.html`, `styles.css`, `app.js` (UI), `model.js` (data + merge), `sync.js` (persistence + transports + sync engine), `theme.js`, `sound.js`, `fx.js`, `qr.js` (vendored QR encoder, MIT), `sw.js`, `config.js` (Supabase URL + publishable key), `supabase/schema.sql`.

- [SETUP.md](SETUP.md) — the manual steps to connect Supabase.
- [PLAN.md](PLAN.md) — architecture, merge design, and the iOS install-path probes.
- [DECISIONS.md](DECISIONS.md) — the calls made where the brief left things open.

## Tests

```bash
node test/model.test.js
node test/theme.test.js
```

The browser suite (two tabs, offline merge, every shortcut, screenshots) lives outside the repo; it runs the app with `?transport=local`, a same-origin BroadcastChannel transport that exercises the identical sync engine.
