# Today's Five 1.7 audit — the part of the brief every agent shares

You are one lens in an audit of a small web app, Today's Five: a short list kept open on screen all day, behind a link
that is also the key. Six rounds in a week have grown it; this round steps back. You look and report; you do not fix.

## Where things are

- Source, frozen at build 76 (read-only for you): `/Users/pricebrannen/Library/Application Support/Claude/scratch-workspaces/ce0410f8-11ea-4010-885c-507e26b204c4/524dc546-f84c-4f27-af03-576d1f523588/scratch-2026-09-05-9be0bb/todays-five-audit/`
  Read `COMPATIBILITY.md` first (the invariants), then `README.md`, the parts of `PLAN.md` and `DECISIONS.md` your lens
  needs (DECISIONS.md says why things are the way they are — a finding that argues with a decision must say so and
  say why the decision should change), then the code: `index.html` (every panel's markup and copy), `app.js` (the
  Today screen and everything an open needs), `panels.js` (every panel), `model.js` (data, merge, rollover),
  `sync.js`, `theme.js`, `sound.js` + `packs.js`, `styles.css` + `panels.css`, `sw.js`.
- The same code served at `http://127.0.0.1:8796/`. Always open it with `?transport=local` (the harness does): the
  list lives in the browser and nothing reaches the live server. Never open the live site
  (https://54kz2vzbdw-code.github.io/todays-five/) to make or change a list; its create limit is small and shared.
- The harness: `tools/audit/harness.mjs` in that source tree. Read its header. It opens the app in any environment
  with the installed Chrome via Playwright, seeds the fixtures, and saves screenshots to `$OUT`.
  Node: `/Users/pricebrannen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node` (put that bin
  directory on PATH and set `NODE_PATH=/Users/pricebrannen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`).
  A minimal script:
  ```js
  import { launch, openApp } from "/Users/pricebrannen/Library/Application Support/Claude/scratch-workspaces/ce0410f8-11ea-4010-885c-507e26b204c4/524dc546-f84c-4f27-af03-576d1f523588/scratch-2026-09-05-9be0bb/todays-five-audit/tools/audit/harness.mjs";
  const browser = await launch();
  const t = await openApp(browser, { env: "phone", fixture: "longtime", scheme: "light" });
  await t.more("settings"); await t.shot("phone-settings"); await t.close(); await browser.close();
  ```
  Environments: `desktop` 1440×900, `desktopHD`, `narrow` 900×700, `zoom150`, `zoom200`, `phone` 390×844 (touch),
  `phoneLandscape`, `android` (Pixel 7), `ipad`, `ipadLandscape`; options `scheme`, `reducedMotion`, `timezone`,
  `clock` (a fake clock you drive with `t.page.clock`), `offline`, `slow3g`, `hash` (arrive by a link).
  Fixtures: `fresh` (a saved list with the three seed lines), `longtime` (a device that has used the app for months:
  four lists, 80 lines in six sections, notes, repeats, Not today, 90 days of history, saved themes), `none` (the
  welcome, as a stranger sees it). The app's test hook `window.__tf()` (`t.s()`) reports its state.
  The browser suite `tools/e2e4.js` shows how every surface is driven (selectors, gestures, the local transport's
  hooks: `localStorage tf/test/limit` makes every create answer "busy", `tf/test/lag` adds latency).
- Your working directory for scripts and evidence: `$OUT` (given in your task). Write your scripts there, never into the
  source tree. Save every screenshot there, named `<finding-slug>-<env>.png`.

## Rules

- Do not modify anything under the source tree, and never `git` anything. You report.
- Local transport only. No live server. No list is created anywhere but in a browser profile of your own.
- Every finding needs evidence: a screenshot path, or a repro script path plus its output. Nothing without evidence.
- Distinguish a defect (renders wrong, misaligned, a state that breaks, a bug) from a taste call (a design you would
  change). Both are welcome; label them honestly. If DECISIONS.md explains the thing you would change, quote the
  decision and argue against it, or drop the finding.
- Copy: quote the exact string and where it appears (file and line, or the panel and control). Propose the rewrite.
  A line about a link must say what the link does, never who it is for (a house rule since 1.3).
- Budget: about 60 tool calls or 50 minutes, whichever comes first. Spend them on looking, not on prose. When the
  budget is spent, write the report from what you have.

## The report (your final message, and also written to `$OUT/report.md`)

One block per finding, in this exact shape, most severe first:

```
### <short title>
- severity: blocker | bug | papercut | proposal
- environment: <env(s) and fixture>
- steps: <numbered, minimal>
- evidence: <path(s) under $OUT>
- why it matters: <one or two sentences, for someone who has never seen the app>
- proposed fix: <one or two sentences; for copy, the exact new string>
- copy line: <file:line of the current string, when the finding is copy>
```

Severities: **blocker** — data loss, a dead end, a state a person cannot leave; **bug** — wrong behaviour or a
wrong render with a repro; **papercut** — a small defect (alignment, spacing, a truncated label, a wrong state
colour) that is not a taste call; **proposal** — a design change (combine, remove, move, a different interaction,
motion or sound character). Finish with a short paragraph: what this lens found the app does well, and what you could
not check and why.
