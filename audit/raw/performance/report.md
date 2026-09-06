# Performance lens — Today's Five 1.5 (build 76)

(The agent could not write this file itself; the text below is its final report, verbatim, saved by the orchestrator. Scripts, raw JSON and screenshots are under `scripts/`, `data/` and `shots/` in this directory.)

Read first: COMPATIBILITY.md §6 (shell caching), DECISIONS.md v4 "Structure" and "Sound", 1.1 "First paint", and `app.js`'s minute interval (`tickDay`, line 1825), idle fade (`IDLE_MS`, line 1786), `sync.js`'s poll (`schedulePoll`, line 374), and presence beat (line 193).

### 1. Lighthouse — `?sw=1`, two full passes (perf-a, perf-b)

| Run | perf | a11y | best-practices | FCP | LCP | TBT |
|---|---|---|---|---|---|---|
| desktop — a | 100 | 100 | 100 | 368 ms | 464 ms | 8 ms |
| desktop — b | 100 | 100 | 100 | 396 ms | 416 ms | 0 ms |
| **desktop median** | **100** | **100** | **100** | **382 ms** | **440 ms** | **4 ms** |
| mobile cold — a | 99 | 100 | 100 | 1596 ms | 1988 ms | 0 ms |
| mobile cold — b | 99 | 100 | 100 | 1704 ms | 1854 ms | 0 ms |
| **mobile cold median** | **99** | **100** | **100** | **1650 ms** | **1921 ms** | **0 ms** |
| mobile warm — a | 100 | 100 | 100 | 1155 ms | 1177 ms | 0 ms |
| mobile warm — b | 100 | 100 | 100 | 1165 ms | 1190 ms | 0 ms |
| **mobile warm median** | **100** | **100** | **100** | **1160 ms** | **1184 ms** | **0 ms** |

The runner uses a fresh profile, so every pass measures **the welcome**, not a saved list — there is no list on that profile to link to. For scale: 1.1's decisions record a historical mobile LCP of 1.98 s (1.0 baseline) vs. a 2.12 s regression they then fixed; today's 1.92 s median sits at that same level despite four rounds of new features since.

Audits under 100 (both runs agree): render-blocking-resources / -insight (0 / 0.5; `styles.css`, 10.5 KB compressed, deliberately blocking so the app never paints unstyled; not actionable without a critical-CSS split); unminified-javascript (0.5 / 0; no-build-step architecture); unused-javascript (0; `app.js` 26.9 KiB of 42.2 KiB "unused" on one load with no interaction — a coverage artifact); network-dependency-tree-insight (0; informational, one hop deep).

### 2. First paint by theme × viewport (Playwright, local server)

5 runs/cell, median. Cold = fresh profile seeded with the theme code, no `tf/v2/themecss` cached. Warm = `page.reload()` of that same page.

| Theme | Viewport | Cold FCP | Cold LCP | Warm FCP | Warm LCP |
|---|---|---|---|---|---|
| Dark | desktop | 72 ms | 72 ms | 28 ms | 36 ms |
| Dark | phone | 68 ms | 72 ms | 28 ms | 36 ms |
| Light | desktop | 84 ms | 84 ms | 24 ms | 36 ms |
| Light | phone | 72 ms | 72 ms | 28 ms | 40 ms |
| Paper | desktop | 60 ms | 80 ms | 28 ms | 36 ms |
| Paper | phone | 56 ms | 84 ms | 32 ms | 44 ms |
| Midnight | desktop | 68 ms | 72 ms | 24 ms | 36 ms |
| Midnight | phone | 68 ms | 68 ms | 40 ms | 44 ms |
| Custom (T2:d, grotesk) | desktop | 68 ms | 76 ms | 24 ms | 28 ms |
| Custom (T2:d, grotesk) | phone | 64 ms | 80 ms | 44 ms | 44 ms |
| **median (10 cells)** | | **68 ms** | **74 ms** | **28 ms** | **36 ms** |

Warm is ~2.5x faster than cold — pure boot/render cost, no network latency, no theme systematically slower. No FOUT observable in this environment (`fonts.size` counts every `@font-face` descriptor, and on `127.0.0.1` a font downloads in under a millisecond). Screenshots: `shots/firstpaint-<Theme>-<viewport>-<cold|warm>-<50|500>ms.png` (40 files). Data: `data/firstpaint.json`.

### 3. Idle cost — Today visible, nothing changes

**Real time, 5 minutes, `Performance.getMetrics` every 30 s** (fixture `longtime`, desktop): cumulative TaskDuration 0.034 → 0.046 s, ScriptDuration 0.000 → 0.002 s, LayoutDuration ≤ 0.001 s, JS heap 3.51 → 3.78 MB, Nodes 1588 → 1593, zero `localStorage.setItem` calls the entire time. Over the full 5 minutes: **12 ms** total task time, **2 ms** script time, **1 ms** layout — for the whole page. `model.js`'s `rollover()` returns the same document reference when nothing is due (`if (!changed) return { doc, moved };`, model.js:521), so `tickDay()`'s `r.doc !== doc` guard (app.js:1823) short-circuits.

**Fake clock, 8 simulated hours, 30-min steps**: every hour identical — 6 new `setTimeout`, 0 new `setInterval`, 0 new rAF, 0 localStorage writes (the 6 timeouts most likely `sync.js`'s poll re-arming itself; its effective cadence under the local transport in a faked clock came out slower than `POLL_MS`, not fully traced).

**Verdict: idle cost is genuinely near zero**, both by direct measurement and by reading `rollover`/`tickDay`.

### 4. Long lists (fixture ~84 lines, then a synthetic 400-line stress list)

| Size | Everything render | Scroll (CDP gesture) | Check-off | Search ("e") | Long tasks | Heap / Nodes after |
|---|---|---|---|---|---|---|
| 84 lines | 129 ms | 874 ms | 37 ms | 134 ms (84 hits) | 0 | — |
| 400 lines | 206 ms | 902 ms | 41 ms | 169 ms (400 hits) | 0 | 8.84 MB / 18,328 |

Render time grows sub-linearly (129→206 ms for 4.8x rows); check-off stays ~40 ms regardless of length; zero `longtask` entries anywhere.

### 5. Cold lazy modules on slow 3G (400 ms latency, 50 KB/s down)

Fixture `longtime`, phone, `?sw=1`. Share could not be measured (the DAY_NAMES finding). ⋯ tap → menu 363 ms cold / 372 warm; Settings (first `panels.js`) 376 / 384; Settings → Export row 421 / 401; Export → JSON (`exporter.js`) 424 / 444. Cold ≈ warm for everything that worked (see Finding 4). No loading indicator of any kind appears during any wait (`shots/cold5-*-wait.png`). Data: `data/coldmodules.json`.

### 6. Leaks (force GC before/after each round)

| Round | Δ heap | Δ DOM nodes | Δ JS listeners |
|---|---|---|---|
| Settings open/close × 30 | **+368 KB** | **+199** | **+55** |
| Theme picker open/close × 30 | +43 KB | +3 | +0 |
| Today ↔ Everything × 50 | **+184 KB** | **+104** | **+44** |
| Switch lists × 20 | −30 KB | +4 | +0 (not a real test — see Finding 1) |

### 7. Service worker cache (`?sw=1`)

One cache, `tf-v1.5-b76`, **33 entries, 856,643 bytes (~837 KB)** — see Finding 3.

### 8. Bundle budget

Eager (11 requests): 346,013 bytes raw / 102,104 gzip (index.html 43,392/11,120; styles.css 48,282/10,261; app.js 138,419/42,295; model.js 39,604/11,886; theme.js 36,933/12,540; sync.js 23,741/7,490; crypto.js 6,334/2,532; sound.js 5,010/1,968; fx.js 3,288/1,326; config.js/version.js 538/472). Plus 3 fonts fetched cold (+36,812). All-in cold Dark boot ≈ 139 KB over the wire. Lazy: panels.js / panels.css / packs.js 69,620/19,172/20,031 raw (21,392/4,961/5,216 gzip), fetched ~250 ms after `load` by the worker's precache; qr.js / exporter.js 56,681/1,741 on first Share/Export. Lazy total 167,245 raw / 44,322 gzip.

---

## Findings

### DAY_NAMES crash on boot silently kills Share and the list switcher for any list with a repeat
- severity: blocker
- environment: fixture `longtime` (has recurring lines); reproduced on desktop (mouse) and phone (touch), with and without `slow3g`, with and without `?sw=1` — five independent reproductions
- steps: 1. Open any list with at least one recurring ("Repeat") line. 2. Open the ⋯ menu and tap "Share this list" (or tap the rail's own Share chip directly). 3. The sheet never opens — nothing happens, forever, in that session (and again on the next reload).
- evidence: `scripts/share-crash-repro.mjs`, `scripts/listname-hidden-check.mjs`, `scripts/share-works-on-fresh-fixture-check.mjs`, output in `data/share-crash-repro-output.txt`; the two "did not open" rows in section 5 and the hung `switch-lists × 20` round in section 6.
- why it matters: rendering the first list containing a repeating line throws an uncaught `ReferenceError: Cannot access 'DAY_NAMES' before initialization` (`app.js:752`, inside `ruleLabel`, called from `updateRow` → `renderToday` → `render` → `setView` → `openList` → `boot`). `boot()` is called at `app.js:256`; `DAY_NAMES` is declared later, at `app.js:747`. The exception aborts whatever `boot()` was still doing: confirmed downstream effects are the list-switcher chip (`#listname`) staying permanently `hidden` even with four lists on the fixture, and both routes to Share doing nothing at all — no error, no toast, no sheet.
- proposed fix: move `const DAY_NAMES = [...]` above the call to `boot()`. Add a regression test: boot a document with one recurring line and assert zero `pageerror` events, `#listname` visible with >1 list, and Share opens.

### Settings and the Today/Everything toggle leak DOM nodes and listeners on ordinary use
- severity: bug
- environment: desktop, fixture `longtime`
- steps: force GC, snapshot `Performance.getMetrics`; open Settings from ⋯ and close it (Escape) 30 times; force GC, snapshot again. Repeat separately for Today ↔ Everything ×50.
- evidence: `scripts/longlists_leaks.mjs` (`leakRound`), full before/after in `data/leaks.json`.
- why it matters: this app's premise is a tab "left open on screen all day" — Settings and the view toggle are exactly the interactions such a tab accumulates hundreds of over real use. 30 Settings cycles retained 199 DOM nodes and 55 listeners after a forced GC; 50 view switches retained 104 nodes and 44 listeners. The theme picker (same underlying `showPanel`/`closePanel` machinery, a popover instead of a sheet) retained essentially nothing (+3 nodes, +0 listeners) over the same 30 cycles, so the leak is specific to Settings' own paint code and to the Today/Everything render path.
- proposed fix: a Chrome DevTools three-snapshot heap diff around one Settings open/close and one view switch will show the exact retaining reference (candidates: a closure captured by a document/window-level Escape or outside-click handler, or a stale entry in a per-row cache like the `rows` Map `setView` almost-clears at app.js:658). Budget didn't allow chasing it further here.

### The service worker cache stores about a quarter of its bytes twice
- severity: papercut
- environment: `?sw=1`, any fixture, cache `tf-v1.5-b76`
- evidence: `data/coldmodules.json` → `swInfo["tf-v1.5-b76"].entries` (33 entries, 856,643 bytes total).
- why it matters: `sw.js`'s `SHELL` precache list includes both `"./"` and `"./index.html"` as separate targets, storing the same ~43.4 KB document twice; separately, the runtime fetch handler caches navigation requests by their *full* URL including query and hash (`?transport=local&sw=1#/l/MX8U7bEB0BHSa5ZeVYMler` → yet another 43.4 KB copy of the same document) — meaning every distinct link or query string a device ever opens adds its own permanent ~43 KB copy, unbounded over time. The four lazy modules (`panels.js`, `panels.css`, `packs.js`, `exporter.js`) are each also stored under both their plain and `?v=76` names (110.6 KB duplicated). Altogether ~197 KB of the 856 KB cache — about 23% — is a byte-for-byte duplicate of something else in the same cache.
- proposed fix: precache only `"./index.html"` (drop the bare `"./"` entry); for versioned lazy modules, `cache.put` under the unversioned pathname (the build is already encoded in the cache's own name); for navigations, strip search/hash before `cache.put` in the fetch handler's success branch (`sw.js:53-61`) so every list a device opens shares one shell entry.

### Lazy modules are network-first on every open, so a slow connection re-pays their cost every time, not just the first
- severity: proposal
- environment: phone, `slow3g`, fixture `longtime`, `?sw=1`
- steps: see section 5 — Settings (needs `panels.js`) took 376 ms cold, 384 ms warm; ⋯ menu (needs nothing) took 363 ms cold, 372 ms warm; Export took 421/401 ms and 424/444 ms. None improved on a second visit under the identical throttle.
- evidence: `data/coldmodules.json`; `sw.js:36-42` (the `?v=` branch only serves from cache when `+v !== BUILD` — a *stale* page asking for an *old* build; a same-build request, the common case, falls through to the network-first branch at `sw.js:51-61`, same as the eager shell).
- why it matters: COMPATIBILITY.md §6 is explicit that the shell must be network-first — that's right for `index.html`/`app.js`, whose freshness *is* the deploy signal. But `panels.js?v=76` etc. are requested with the page's own current build already pinned in the URL; that content is immutable by construction (a new build gets a new number and a new cache), so re-fetching it over the network buys no freshness — only latency, paid reactively at the moment of a tap, every single visit for as long as the connection is slow.
- proposed fix: in `sw.js`'s fetch handler, treat a `?v=` request where `+v === BUILD` the same as the `!== BUILD` branch (cache-first from this build's own cache, network only as fallback) instead of falling through to network-first.

---

What this lens found genuinely cheap: idle cost measures as near-zero by direct instrumentation, not just by inspection — 12 ms of task time and zero storage writes across a real 5 minutes, and a flat 6 timer reschedulings with zero storage writes in every one of 8 simulated hours, because `rollover()` is a true no-op (same object reference) when nothing is due. Long lists hold up well past the documented ~80-line scale: a synthetic 400-line Everything view renders in 206 ms, scrolls, checks off, and searches with zero long tasks recorded anywhere. The theme picker's open/close cycle is clean (no measurable leak over 30 cycles) even though Settings and the view toggle are not. Lighthouse scores are excellent throughout, and mobile LCP (1.92 s median) sits at the same level as the 1.98 s baseline 1.1's decisions record from two rounds ago, despite real feature growth since.

What I could not measure reliably: true FOUT, because `127.0.0.1` serves fonts in under a millisecond. The exact retaining reference behind the Settings/view-switch leaks (I identified the symptom with forced-GC before/after, not the line). The precise mechanism behind the fake-clock phase's 6 `setTimeout` calls/simulated-hour. And most of task 5 plus part of task 6 (Share timing, list-switching leak behavior) — not because they're hard to measure, but because the feature they depend on doesn't run at all on this fixture; those gaps are themselves evidence for the DAY_NAMES finding. Everything ran on a machine shared with other agents, so I treated cold-vs-warm deltas and the presence/absence of long tasks as the reliable signal, and treated single absolute millisecond figures with suspicion.
