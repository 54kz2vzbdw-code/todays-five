# Today's Five

A short list built to be left open on screen all day, on any device, behind a link that is also the key.

Live: https://54kz2vzbdw-code.github.io/todays-five/

## What it does

- **Today** is the hero view: a handful of lines in type that fills the screen. Tap or click a line (or press its number) to cross it off; the strike draws across every wrapped line, the line settles to the bottom, confetti fires. Finish them all and the finale plays. Done lines move to History at the start of the next day; undone ones carry over.
- **Everything** (press `A`) holds the backlog: sections, reorder by drag or `⌥↑/↓`, a labelled **Today** toggle puts a line on Today, notes.
- **Encrypted end to end.** The list is sealed on the device (AES-256-GCM) before it is saved or synced; the server stores ciphertext, a revision number and timestamps. The edit link `#/l/…` is the credential; it derives a view-only link `#/r/…` that can read but never write. Rotate replaces both. Lose the link, lose the list: nobody can recover it.
- **Sync** between devices through Supabase, no accounts. Offline edits merge when you reconnect; nothing is lost or duplicated. Remote changes slide in quietly; sounds and confetti only follow what you did on this device. Idle lists cost bytes, not kilobytes, to poll.
- **Themes**: Dark, Light, Pink plus nine more curated kits, each with its own fonts, sounds and confetti; or derive your own from one accent colour with guaranteed contrast. `T` opens the picker. Fonts are self-hosted; nothing loads from a third party.
- **Installable**: add to the Home Screen on iOS or Install on the Mac; the icon carries the link. A bottom-sheet menu, gesture help and a five-step tour on the phone; keyboard help and shortcuts on the desktop.

## Files

Build-less ES modules served straight from this repo by GitHub Pages: `index.html`, `about.html` (how it works & privacy), `styles.css` (tokens + self-hosted `@font-face`), `app.js` (UI), `model.js` (data + merge), `sync.js` (persistence + transports + sync engine), `crypto.js` (link derivation + envelope), `theme.js`, `sound.js`, `fx.js`, `qr.js` (vendored QR encoder, MIT), `vendor/realtime.js` (vendored Supabase Realtime client, MIT), `fonts/` (latin woff2), `sw.js`, `config.js` (Supabase URL + publishable key), `supabase/` (schema and migrations).

- [SETUP.md](SETUP.md) — the manual steps: the two SQL pastes, re-adding the phone, pause/resume.
- [PLAN.md](PLAN.md) — architecture, merge design, the iOS install-path probes, and the v3 crypto and abuse design.
- [DECISIONS.md](DECISIONS.md) — the calls made where the briefs left things open.

## Tests

```bash
node test/model.test.js
node test/theme.test.js
node test/crypto.test.js
node test/sync.test.js
```

The crypto test pins the key-derivation vectors: if it fails after a change, the change would orphan every existing list. The browser suite (two tabs, offline merge, view-only mode, migration of a v2 list, the phone sheets and tour, CSP and third-party-request checks) and the real-backend suite live outside the repo; they run the app with `?transport=local`, a same-origin BroadcastChannel transport that exercises the identical sync and crypto engine, and against the live Supabase project respectively.
