# Baseline — the untouched commit 7341981, every instrument, what each actually printed

- `pwd` (inside the worktree): `/Users/pricebrannen/Today's Five/todays-five-review-baseline`
- `git -C "/Users/pricebrannen/Today's Five/todays-five-review-baseline" rev-parse HEAD`: `[REDACTED]`
- `git status --short` in the worktree: empty (clean, detached at 7341981)
- Start: `Thu Sep 10 00:48:35 CDT 2026` — `0:48  up 92 days, 22:54, 2 users, load averages: 8.53 5.78 5.75`
- End: (see the last section)
- Toolchain: `Xcode 26.6` / `Build version 17F113`; node `v24.19.0` (off PATH, `~/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`); playwright `1.62.1` from `NODE_PATH`
- Simulator runtimes present: `iOS 26.5 (26.5 - 23F77)`, `watchOS 26.5 (26.5 - 23T570)` (also iOS 18.1, watchOS 11.1)
- Booted simulators that are NOT mine and were not touched: `2100CA85-0891-41BF-B128-B8EA38AD1F3F` (iPhone 16 Pro), `A0F5091F-0A4E-4AF1-81ED-953FB3F96592` (iPhone 17 Pro), `C33542F5-1D08-439D-B47B-E61355E3C07C` (iPhone 17), `4594CB69-FD2A-404B-9364-9F7BD070AAC4` (Apple Watch Series 11 46mm) — the last two are pair `4B6A97F5-32AB-408A-9E2A-5F8917031CE8 (active, connected)`, Phase 5's.
- `version.js` at this commit: `VERSION = "1.12"`, `BUILD = 216`; `project.pbxproj`: `MARKETING_VERSION = 1.12` ×6, `CURRENT_PROJECT_VERSION = 216` ×6 (three targets × two configurations).
- Every command below was run with `cd "/Users/pricebrannen/Today's Five/todays-five-review-baseline"` (or an absolute path into it); nothing was edited, committed, or checked out.

## 1. The seven Node suites

Command (from inside the worktree, `NODE` and `NODE_PATH` exported as above):

```
for t in model theme crypto sync sound features compat; do
  "$NODE" "/Users/pricebrannen/Today's Five/todays-five-review-baseline/test/$t.test.js" > review/raw/baseline/node-$t.log 2>&1
done
```

`STEP1 START 2026-09-10 00:49:17 |  0:49  up 92 days, 22:54, 2 users, load averages: 6.36 5.59 5.69`
`STEP1 END 2026-09-10 00:49:19 |  0:49  up 92 days, 22:55, 2 users, load averages: 6.36 5.59 5.69`

| suite | exit | wall | `ok -` lines | tally line(s), verbatim | FAIL lines | lines matching warning/error/deprecat |
|---|---|---|---|---|---|---|
| model | 0 | 0s | 28 | `28 model tests passed` | 0 | 0 |
| theme | 0 | 1s | 33 | `33 theme tests passed` | 0 | 0 |
| crypto | 0 | 0s | 10 | `10 crypto tests passed` | 0 | 0 |
| sync | 0 | 1s | 14 | `10 sync tests passed` then `14 sync tests passed (with v4)` | 0 | 0 |
| sound | 0 | 0s | 12 | `12 sound tests passed` | 0 | 0 |
| features | 0 | 0s | 30 | `30 feature tests passed` | 0 | 0 |
| compat | 0 | 0s | 9 | `9 compatibility tests passed` | 0 | 0 |

Total: 136 `ok -` lines across the seven suites, 0 `FAIL`/`not ok` lines, 0 warnings. The theme log's 23 non-`ok` lines are a 19-row contrast table (kit / accent / a/ink / a/ink-3 / aT/ink / aT/ink-3 / danger/ink-3) that one theme test prints — informational, not a failure. Logs: `review/raw/baseline/node-<suite>.log`, summary `review/raw/baseline/node-summary.txt`.

## 2. `swift test` (TodaysFiveCore)

Command: `cd "/Users/pricebrannen/Today's Five/todays-five-review-baseline/apple/TodaysFiveCore" && review/tools/build-slot.sh baseline-swift-test -- swift test` (absolute path to build-slot.sh). Log: `review/raw/baseline/swift-test.log`.

- `SWIFT-TEST START 2026-09-10 00:49:45 |  0:49  up 92 days, 22:55, 2 users, load averages: 4.85 5.30 5.58`
- `[build-slot] baseline-swift-test acquired 1 at 00:49:45; load: 5.02 5.33 5.59`
- `Build complete! (9.23s)`
- `[build-slot] baseline-swift-test released after 19s; exit 0; load: 6.58 5.68 5.71`
- `SWIFT-TEST END 2026-09-10 00:50:04 exit=0 wall=19s |  0:50  up 92 days, 22:55, 2 users, load averages: 6.58 5.68 5.71`
- Wall: **19 s** (build 9.23 s + test run 8.389 s), a warm `.build` did not exist before this run (fresh worktree).

Tally lines, verbatim:

- `✔ Test run with 130 tests in 10 suites passed after 8.389 seconds.`
- `Executed 0 tests, with 0 failures (0 unexpected) in 0.000 (0.001) seconds` — this is XCTest's runner reporting that the package has no XCTest tests; every test is Swift Testing. There is no other "Executed N tests" line.

The ten suite lines, verbatim:

```
✔ Suite "Today: add, check off, start again" passed after 0.020 seconds.
✔ Suite "JavaScript semantics" passed after 0.020 seconds.
✔ Suite "Sync: the engine against a server that behaves like the real one" passed after 0.020 seconds.
✔ Suite "The Watch link hand-off" passed after 0.020 seconds.
✔ Suite "The link vault" passed after 0.020 seconds.
✔ Suite "The kit table" passed after 0.020 seconds.
✔ Suite "The document: normalize, merge, rollover" passed after 0.020 seconds.
✔ Suite "The contract's own merge fixtures" passed after 0.036 seconds.
✔ Suite "Keys, links and the envelope" passed after 0.096 seconds.
✔ Suite "Differential: the web's answers, replayed" passed after 8.389 seconds.
```

`✘` lines: 0. `error:` lines: 0. Lines matching `deprecated`: 0.

**KitFixtureTests** ran: `[49/58] Compiling TodaysFiveCoreTests KitFixtureTests.swift`, `◇ Suite "The kit table" started.`, `✔ Suite "The kit table" passed after 0.020 seconds.` The file declares 6 `@Test`s (`@Suite("The kit table")`), and all six have a ✔ line:

```
✔ Test "live theme.js still produces the fixture, token for token" passed after 0.019 seconds.
✔ Test "the generated table is the fixture's 16 open kits, token for token" passed after 0.018 seconds.
✔ Test "neither Secret kit is in the table, and neither is anywhere in this binary" passed after 0.018 seconds.
✔ Test "every kit clears its own grounds — all 18, the Secret pair included" passed after 0.018 seconds.
✔ Test "every kit survives the representation it crosses in" passed after 0.018 seconds.
✔ Test "every pair resolves to faces that are actually in the repo" passed after 0.018 seconds.
```

(The first of these is behind `#if canImport(JavaScriptCore)` and evaluates live `theme.js` in a `JSContext`; it ran here because the suite runs on macOS.)

**KitsGen plugin**: the log has `[1/1] Compiling plugin ConfigGen`, `[2/2] Compiling plugin KitsGen`, `[38/44] Compiling TodaysFiveCore Config.generated.swift`, `[39/44] Compiling TodaysFiveCore Kits.generated.swift`. The plugin's command display name (`Reading the kit table`) does not appear — SwiftPM's non-verbose output does not echo prebuild command names — so the evidence that the plugin ran is its output file `Kits.generated.swift` being compiled and the six table tests passing against it.

**Warnings**: 4 lines match `warning:`, which are 2 distinct warnings each printed twice (once as the macro-expansion header, once inside the diagnostic art), both in the test target:

```
macro expansion #expect:1:22: warning: no 'async' operations occur within 'await' expression
`- /Users/pricebrannen/Today's Five/todays-five-review-baseline/apple/TodaysFiveCore/Tests/TodaysFiveCoreTests/SyncTests.swift:122:63: note: expanded code originates here
macro expansion #expect:1:22: warning: no 'async' operations occur within 'await' expression
`- /Users/pricebrannen/Today's Five/todays-five-review-baseline/apple/TodaysFiveCore/Tests/TodaysFiveCoreTests/SyncTests.swift:123:77: note: expanded code originates here
```

## 3. Serving the worktree on 8890

Command: `cd "/Users/pricebrannen/Today's Five/todays-five-review-baseline" && nohup "$NODE" tools/serve.js 8890 "/Users/pricebrannen/Today's Five/todays-five-review-baseline" > review/raw/baseline/serve.log 2>&1 &` — PID 87440; `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8890/version.js` → `200`. serve.log: `serving /Users/pricebrannen/Today's Five/todays-five-review-baseline on http://127.0.0.1:8890`.

**That server was killed from outside about two minutes later** (see 4, run 1). For run 2 it was restarted under a one-line supervisor that logs every exit and restarts in 1 s, and invoked through a symlink (`/tmp/tf-review/baseline-static.mjs -> …/todays-five-review-baseline/tools/serve.js`, `cmp` identical) so that a name-based `pkill -f serve.js` from another round cannot match it. Supervisor PID 89574, node child 89577. Same root, same port, same file.

## 4. The browser suite (`tools/e2e4.js`)

Command: `cd "/Users/pricebrannen/Today's Five/todays-five-review-baseline" && BASE=http://127.0.0.1:8890/ NODE_PATH=… "$NODE" tools/e2e4.js > review/raw/baseline/e2e4.log 2>&1`. Playwright 1.62.1 driving the installed Chrome, headless; both viewports in one invocation.

### Run 1 — not a measurement of the code: the server was SIGTERMed mid-run

- `E2E4 START 2026-09-10 00:51:30 |  0:51  up 92 days, 22:57, 2 users, load averages: 5.04 5.41 5.60`
- `E2E4 END 2026-09-10 00:54:10 exit=1 wall=160s |  0:54  up 92 days, 22:59, 2 users, load averages: 6.96 5.46 5.54`
- Tally line: `19 passed, 150 failed`
- The wrapper's stderr: `run-e2e4.sh: line 17: 87440 Terminated: 15          nohup "$NODE" "$W/tools/serve.js" 8890 "$W" > "$R/serve.log" 2>&1` — signal 15 (SIGTERM) delivered to the server process alone; the e2e4 child of the same wrapper kept running, so this was not a process-group kill and not a crash (no stack trace in serve.log). Consistent with another round's cleanup killing `serve.js` by name.
- The 150 failure messages, counted: `140 × page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8890/?transport=local`, `3 × … ?transport=local&sw=1`, `2 × … /tools/og.html`, `2 × … /about.html`, `2 × fetch failed`, `1 × page.waitForSelector: Timeout 6000ms exceeded.` (the test in flight when the server died: `desktop 1440×900: 1.9: a sound for Day and one for Night — …`). All 19 passes were desktop tests before the kill; the phone pass never had a server.
- Kept as `review/raw/baseline/e2e4-run1-server-killed.log`, `e2e4-run1-summary.txt`, `serve-run1.log`, `serve-run1-wrapper.txt`. **Nothing in run 1 says anything about 7341981.**

### Run 2 — the measurement (server supervised, never died)

- `SERVE supervisor PID=89574 node child PID(s)=89577  curl version.js => HTTP 200`
- `E2E4 RUN2 START 2026-09-10 00:56:43 |  0:56  up 92 days, 23:02, 2 users, load averages: 10.53 6.26 5.77` (the 10.53 is run 1's Chrome teardown plus whatever else the Mac was doing; it fell to ~3–5 within five minutes and stayed there)
- `E2E4 RUN2 END 2026-09-10 01:15:20 exit=0 wall=1117s |  1:15  up 92 days, 23:21, 2 users, load averages: 4.76 4.83 4.94`
- Wall: **1117 s (18 min 37 s)** for both viewports; load samples during the run (from the monitor): `3.09 4.78 5.35`, `4.35 4.39 4.97`, `3.65 4.31 4.80`.
- Tally line, verbatim: `169 passed, 0 failed`
- `ok -` lines: 85 under `== desktop 1440×900`, 84 under `== phone 390×844` (169 total, the same 169 the aborted run 1 counted); `FAIL -` lines: 0. Every line in the log is an `ok -` line, a viewport marker, the tally, or blank — nothing else was printed (the 12 lines that match `warning|error` are test names such as "no page errors" and "under the warning").
- The safety lines, verbatim:
  - `ok - desktop 1440×900: no page errors, CSP violations or third-party requests across a full session`
  - `ok - phone 390×844: no page errors, CSP violations or third-party requests across a full session`
  - `ok - desktop 1440×900: 1.9: a page another site has framed leaves the frame (the boot script's framebust, hashed in the CSP)`
  - `ok - phone 390×844: 1.9: a page another site has framed leaves the frame (the boot script's framebust, hashed in the CSP)`
- The test run 1 timed out on (`desktop 1440×900: 1.9: a sound for Day and one for Night — …`) passed here: line 22 of `e2e4.log` is its `ok -` line. That confirms run 1's timeout was the server dying under it, not the test.
- serve.log for run 2: one `starting …` line, one `serving … on http://127.0.0.1:8890` line, no `serve.js exited` line — the server was never killed during run 2.
- Log: `review/raw/baseline/e2e4.log`; bookends: `review/raw/baseline/e2e4-summary.txt`; server: `review/raw/baseline/serve.log`.

## 5. The five xcodebuild invocations (in series, each under build-slot.sh)

Wrapper: each `xcodebuild` ran as `review/tools/build-slot.sh baseline-<n> -- xcodebuild …` from inside the worktree, fresh `-derivedDataPath /tmp/tf-review-baseline` (did not exist before 5a). Nothing else heavy ran alongside (the browser suite had finished at 01:15:20). Full logs: `review/raw/baseline/xcodebuild-<n>.log`; bookends: `review/raw/baseline/xcodebuild-summary.txt`. The device and archive logs contain `Signing Identity:` / `Provisioning Profile:` lines (9 / 9 in 5c, 3 / 3 in 5d and 5e); they are deliberately not quoted here.

`XCODEBUILD BATTERY START 2026-09-10 01:15:51 |  1:15  up 92 days, 23:21, 2 users, load averages: 3.96 4.63 4.86`
`XCODEBUILD BATTERY END 2026-09-10 01:16:56 |  1:16  up 92 days, 23:22, 2 users, load averages: 8.82 5.93 5.33`

| step | command (after `xcodebuild -project …/apple/TodaysFive/TodaysFive.xcodeproj`) | result line | exit | wall | load before → after | `warning:` | `error:` | `deprecated` |
|---|---|---|---|---|---|---|---|---|
| 5a | `-scheme TodaysFive -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/tf-review-baseline build` | `** BUILD SUCCEEDED **` | 0 | 16 s | `3.96 4.63 4.86` → `5.54 4.96 4.97` | 0 | 0 | 0 |
| 5b | `-scheme TodaysFiveWatch -destination 'generic/platform=watchOS Simulator' -derivedDataPath /tmp/tf-review-baseline build` | `** BUILD SUCCEEDED **` | 0 | 2 s | `5.54 4.96 4.97` → `5.54 4.96 4.97` | 0 | 0 | 0 |
| 5c | `-scheme TodaysFive -destination 'generic/platform=iOS' -derivedDataPath /tmp/tf-review-baseline -[REDACTED] build` | `** BUILD SUCCEEDED **` | 0 | 13 s | `5.54 4.96 4.97` → `7.55 5.47 5.16` | 0 | 0 | 0 |
| 5d | `-scheme TodaysFiveWatch -destination 'generic/platform=watchOS' -derivedDataPath /tmp/tf-review-baseline -[REDACTED] build` | `** BUILD SUCCEEDED **` | 0 | 4 s | `7.55 5.47 5.16` → `7.27 5.45 5.15` | 0 | 0 | 0 |
| 5e | `-scheme TodaysFive -destination 'generic/platform=iOS' -derivedDataPath /tmp/tf-review-baseline -archivePath /tmp/tf-review/7341981.xcarchive -[REDACTED] archive` | `** ARCHIVE SUCCEEDED **` | 0 | 30 s | `7.27 5.45 5.15` → `8.82 5.93 5.33` | 0 | 0 | 0 |

- Why the wall times are small: 5a is a real cold build — its log has 286 `SwiftCompile`/`CompileSwift` lines, 22 `Ld`, 9 `CodeSign`, a 9-target dependency graph, and it emplaced the Watch app and the appex into `Debug-watchsimulator/` as embedded dependencies — so 5b found its targets already built (564-line log, 0 `Ld`, `** BUILD SUCCEEDED **`). Likewise 5c (3478 lines, 225 compile steps, 18 `Ld`, 9 `CodeSign`) built `Debug-iphoneos/` and `Debug-watchos/`, so 5d was incremental (754 lines, 0 `Ld`). 5e is a separate Release configuration (`-O -whole-module-optimization`) and compiled everything again, including the `arm64_32` slice (`SwiftDriver\ Compilation [REDACTED] normal arm64_32 …` and the matching lines for the Watch app).
- Signing: no signing failure on 5c, 5d or 5e, so the `CODE_SIGNING_ALLOWED=NO` fallback was never used — every device build and the archive is signed (Automatic, the team in the project).
- Warnings, all five logs: **0 lines match `warning:`**, 0 match `error:`, 0 match `deprecated` (case-insensitive). The case-insensitive `warning` hits (18 / 6 / 15 / 8 / 15) are all `actool` and `swiftc` command lines carrying warning-related flags, not diagnostics; there is nothing to deduplicate. `note:` lines in 5a: `Target dependency graph (9 targets)`, three `Using stub executor library with Swift entry point.` (one per app target), and two `Emplaced …/Assets.car`.

### The archive, verified

- `find /tmp/tf-review/7341981.xcarchive -maxdepth 6 -name '*.app'`:
  - `/tmp/tf-review/7341981.xcarchive/Products/Applications/TodaysFive.app`
  - `/tmp/tf-review/7341981.xcarchive/Products/Applications/TodaysFive.app/Watch/TodaysFiveWatch.app`
- `find … -name '*.appex'`: `/tmp/tf-review/7341981.xcarchive/Products/Applications/TodaysFive.app/Watch/TodaysFiveWatch.app/PlugIns/[REDACTED].appex`
- PlistBuddy, `[REDACTED]` / `CFBundleVersion` / `CFBundleIdentifier`:
  - iOS app: `1.12` / `216` / `com.pricebrannen.todaysfive`
  - Watch app: `1.12` / `216` / `com.pricebrannen.todaysfive.watchkitapp`
  - appex: `1.12` / `216` / `com.pricebrannen.todaysfive.watchkitapp.complications`
  - **All three agree, and agree with `version.js` (1.12 / 216) and the pbxproj.** The archive's own `Info.plist` `ApplicationProperties` says `[REDACTED] = 1.12`, `CFBundleVersion = 216`, `Architectures = [arm64]`.
- `du -sh`: `29M` (29268 KiB). dSYMs: `TodaysFive.app.dSYM`, `[REDACTED].appex.dSYM`, `TodaysFiveWatch.app.dSYM`.
- Fonts in the Watch app (excluding PlugIns): **33 `.ttf`, 1,238,128 bytes**, at the bundle root of `TodaysFiveWatch.app` — identical in count and bytes to the source `apple/TodaysFive/Fonts/` (33 `.ttf`, 1,238,128 bytes) and to `test/fixtures/watch-fonts.json` `totals` (`{"faces":33,"bytes":1238128,…}`). The round's "33 faces, ~1.3 MB" is 33 faces and 1.24 MB (1.18 MiB); `du -sk` of the source directory with its `OFL.txt` and `README.md` is 1300 KiB, which is where "~1.3 MB" comes from.
- Fonts in the appex: **0 `.ttf`, 0 bytes** — the appex carries no fonts of its own, as the round claimed. Fonts in the iOS app outside `Watch/`: 0.
- Architectures (`lipo -info`): `TodaysFiveWatch`: `arm64_32 arm64`; `[REDACTED]`: `arm64_32 arm64`; `TodaysFive` (iOS): `arm64` only. So this archive is the one instrument in the battery that compiled the Watch code with a 32-bit `Int`, and it compiled clean.

## 6. The Watch and phone self-tests on my own simulator pair (under sim-slot.sh)

Wrapper: `review/tools/sim-slot.sh baseline -- run-sims.sh` (the script creates the pair by UDID, boots by UDID, installs by UDID, and never names any other device). Bookends and every `[tfive]` line: `review/raw/baseline/sim-summary.txt`. Each console was captured with `xcrun simctl launch --console-pty <UDID> <bundle> <args>` run in the background, capped at 90 s, the app terminated between runs, and the console passed through the repo's `safe()` rule (`perl -pe 's/(?<![0-9A-Za-z])[0-9A-Za-z]{22,}(?![0-9A-Za-z])/[REDACTED]/g'`) before being saved as `review/raw/baseline/<name>.log`.

- `SIM START 2026-09-10 01:17:42 |  1:17  up 92 days, 23:23, 2 users, load averages: 7.26 5.93 5.36`
- `create watch => 8F30B5F3-A512-4CA6-90CA-C596689046DB` (`"tf-review watch"`, `Apple Watch Series 11 (42mm)`, `com.apple.CoreSimulator.SimRuntime.watchOS-26-5`)
- `create phone => BA7707F5-B082-41EB-92A5-04E586CB0D55` (`"tf-review phone"`, `iPhone 17 Pro Max`, `com.apple.CoreSimulator.SimRuntime.iOS-26-5`)
- `pair => E7F29476-51EC-4C21-A95C-C5A2D43C282B`; saved to `/tmp/tf-review/pair.env` as `WATCH=… PHONE=… PAIR=…` lines. **The pair is left booted for the orchestrator; it was not deleted.**
- `pair state: E7F29476-51EC-4C21-A95C-C5A2D43C282B (active, connected)  Watch: tf-review watch (8F30B5F3-…) (Booted)  Phone: tf-review phone (BA7707F5-…) (Booted)` — the pair reported active, connected on the first try.
- **Load**: booting two fresh 26.5 simulators sent the 1-minute load to `149.92 40.28 17.82` at 01:18:21 and it was still `99.95 67.62 31.94` at 01:19:58. Every timing in this section sits under that load, and Phase 5's latency round shared the Mac with it for those minutes.
- `install watch app: (rc=0)` from `/tmp/tf-review-baseline/Build/Products/Debug-watchsimulator/TodaysFiveWatch.app` (the 5a/5b product); `get_app_container watch: …/Devices/8F30B5F3-A512-4CA6-90CA-C596689046DB/data/Containers/Bundle/Application/…/TodaysFiveWatch.app`.

### 6a. `-TFWatchDemo -TFWatchSelfTest` → `review/raw/baseline/watch-demo-selftest.log`

`-- watch-demo-selftest START 2026-09-10 01:18:21 | load averages: 149.92 40.28 17.82` … `still running at 90s cap; terminating the app` … `END 2026-09-10 01:19:55 lines=21 tfive-lines=19`. The demo idles after its tally, so the cap is the normal end. Screenshot at t=30 s: `review/raw/baseline/watch-demo.png` (27,305 bytes) — the paper kit, the title `Demo`, a `4 /5` counter, `Ten minutes outside` unchecked, `Water the plants` checked and struck through, the clock reading 1:18.

Every `[tfive]` line, verbatim (there is no single pass/fail tally — this self-test prints eleven numbered observations):

```
[tfive] theme: slot=night day=paper night=terminal → kit=terminal pair=mono base=dark unlocked=0 offered=16
[tfive] watch: store=appGroup
[tfive] watch: demo list seeded, lines=5 mark=synced
[tfive] face: kit=terminal pair=mono face=IBMPlexMono-SemiBold → snapshot written, reloadAllTimelines requested
[tfive] watch selftest: store=appGroup
[tfive] watch selftest: list=open editable=true lines=5
[tfive] watch selftest: 1 check: modelDone=true done=1/5
[tfive] watch selftest: 2 uncheck: modelUndone=true done=0/5
[tfive] watch selftest: 3 finale: fired=yes after=0.510s done=5/5
[tfive] watch selftest: 4 startAgain: done=0/5 finaleCard=false
[tfive] watch selftest: 5 shuffle x10: distinct=5 sameTwiceInARow=0 undone=5
[tfive] watch selftest: 6 wobble: undone=1 moved=false changed=false wobbled=true
[tfive] watch selftest: 7 haptics: check=10 uncheck=2 finale=1 shuffle=10
[tfive] watch selftest: 7 finale run: taps=8/8 duration=0.707s (approximation: no CoreHaptics on watchOS)
[tfive] watch selftest: 8 appGroup=true
[tfive] watch selftest: 9 snapshot: hasList=true done=4/5 nextLine=19 chars viewOnly=false rollsAt=set kit=terminal pair=mono face=IBMPlexMono-SemiBold
[tfive] watch selftest: 10 confetti: run=1 frames=134 over 2.56s = 52.0/s
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
[tfive] watch selftest: 11 theme change: terminal/IBMPlexMono-SemiBold → paper/SourceSerif4-Regular-600 changed=true
```

The two non-`[tfive]` lines: `[REDACTED] failed e00002c7` (a system console line whose leading token the `safe()` rule struck; `e00002c7` is an IOKit/Mach status, not app output) and `com.pricebrannen.todaysfive.watchkitapp: 8295` (simctl's launch line with the PID).

### 6b. `-TFWatchDemo -TFAddSelfTest` → `review/raw/baseline/watch-add-selftest.log`

`-- watch-add-selftest START 2026-09-10 01:19:58 |  1:19  up 92 days, 23:25, 2 users, load averages: 99.95 67.62 31.94`
`still running at 90s cap; terminating the app`
`-- watch-add-selftest END 2026-09-10 01:21:30 lines=13 tfive-lines=12`

The demo idles after its tally, so the 90 s cap is the normal end.

Every `[tfive]` line, verbatim:

```
[tfive] add self-test: begin
[tfive] add self-test: [REDACTED]=present so the wrist takes the WatchKit path
[tfive] theme: slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16
[tfive] watch: store=appGroup
[tfive] add self-test: canned ok outcome=added today=1 was=0
[tfive] add self-test: empty ok outcome=nothing-said today=1 unchanged=true
[tfive] add self-test: view-only ok outcome=view-only today=1
[tfive] add self-test: no-list ok outcome=no-list
[tfive] watch: demo list seeded, lines=5 mark=synced
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
[tfive] add self-test: undo ok today=0 was=0 tombstoned=true
[tfive] add self-test: end pass=5/5
```

Non-`[tfive]` lines: 1 — com.pricebrannen.todaysfive.watchkitapp: 10728

### 6c. `-TFFontSelfTest` → `review/raw/baseline/watch-font-selftest.log`

`-- watch-font-selftest START 2026-09-10 01:21:33 |  1:21  up 92 days, 23:27, 2 users, load averages: 24.02 50.48 29.07`
`still running at 90s cap; terminating the app`
`-- watch-font-selftest END 2026-09-10 01:23:06 lines=9 tfive-lines=8`

The app stays up after the tally, so the 90 s cap is the normal end.

Every `[tfive]` line, verbatim:

```
[tfive] theme: slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16
[tfive] font self-test: begin kits=16 pairs=13 files=33 familiesOnDevice=75
[tfive] font self-test: bundled=33/33
[tfive] font self-test: weights told apart by advance=12 ink=1
[tfive] font self-test: faces=33 end pass=96/96
[tfive] font self-test: at 17pt title3 scales to 17.00, task line height 20.40, tracking -0.425, extra leading 0.00
[tfive] watch: store=appGroup
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
```

Non-`[tfive]` lines: 1 — com.pricebrannen.todaysfive.watchkitapp: 12040

### 6d. `-TFConfettiSelfTest` → `review/raw/baseline/watch-confetti-selftest.log`

`-- watch-confetti-selftest START 2026-09-10 01:23:09 |  1:23  up 92 days, 23:28, 2 users, load averages: 11.00 39.32 27.04`
`still running at 90s cap; terminating the app`
`-- watch-confetti-selftest END 2026-09-10 01:24:42 lines=22 tfive-lines=21`

The app stays up after the tally, so the 90 s cap is the normal end.

Every `[tfive]` line, verbatim:

```
[tfive] theme: slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16
[tfive] confetti self-test: begin kits=16 canvas=208x248 k=0.310
[tfive] confetti self-test: dark: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: light: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: pink: shapes=[0, 1, 2] → drew [0, 1, 2] · palette=6 · ends at frame 147
[tfive] confetti self-test: midnight: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: forest: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: paper: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: terminal: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: sunset: shapes=[0, 1] → drew [0, 1] · palette=5 · ends at frame 147
[tfive] confetti self-test: dusk: shapes=[0, 1, 2] → drew [0, 1, 2] · palette=5 · ends at frame 147
[tfive] confetti self-test: harbor: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: ember: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: cocoa: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: blush: shapes=[0, 1, 2] → drew [0, 1, 2] · palette=6 · ends at frame 147
[tfive] confetti self-test: teletype: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: sketch: shapes=[0] → drew [0] · palette=6 · ends at frame 147
[tfive] confetti self-test: arcade: shapes=[0] → drew [0] · palette=6 · ends at frame 147
[tfive] confetti self-test: end pass=96/96
[tfive] watch: store=appGroup
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
```

Non-`[tfive]` lines: 1 — com.pricebrannen.todaysfive.watchkitapp: 14733

### 6e. `-TFFaceProbe` → `review/raw/baseline/watch-face-probe.log`

`-- watch-face-probe START 2026-09-10 01:24:45 |  1:24  up 92 days, 23:30, 2 users, load averages: 7.76 30.43 24.88`
`still running at 90s cap; terminating the app`
`-- watch-face-probe END 2026-09-10 01:26:18 lines=10 tfive-lines=8`

The probe prints its verdict and the app stays up, so the 90 s cap is the normal end.

Every `[tfive]` line, verbatim:

```
[tfive] theme: slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16
[tfive] watch: store=appGroup
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
[tfive] face probe: appex=[REDACTED].appex ttfInAppex=0 fontsRoot=TodaysFiveWatch.app facesOnDisk=33 registered=33 wantedFaceOnDisk=true
[tfive] face probe: accent asked for #C8321F
[tfive] face probe: fullColor  corner=#C8321F@255 centre=#B02A1A@255
[tfive] face probe: accented   corner=#C8321F@255 centre=#B02A1A@255
[tfive] face probe: the two renderings are IDENTICAL — SwiftUI did not flatten anything; the treatment is the widget host's
```

Non-`[tfive]` lines: 2 — [REDACTED] failed e00002c7;com.pricebrannen.todaysfive.watchkitapp: 15688

### 6f. `-TFSelfTest (on my phone simulator, Debug-iphonesimulator/TodaysFive.app)` → `review/raw/baseline/phone-selftest.log`

`-- phone-selftest START 2026-09-10 01:26:26 |  1:26  up 92 days, 23:32, 2 users, load averages: 8.18 24.01 22.98`
`still running at 90s cap; terminating the app`
`-- phone-selftest END 2026-09-10 01:27:58 lines=11 tfive-lines=10`

The phone self-test loads the live site over the network; the app stays up after its lines, so the 90 s cap is the normal end. The `[REDACTED]=string` token is the identifier `[REDACTED]` (31 characters), struck by the `safe()` rule.

Every `[tfive]` line, verbatim:

```
[tfive] registry: unreadable
[tfive] bridge: ready
[tfive] haptic: check=1 uncheck=0 finale=0 shuffle=0
[tfive] haptic: check=1 uncheck=1 finale=0 shuffle=0
[tfive] haptic: check=1 uncheck=1 finale=1 shuffle=0
[tfive] haptic: check=1 uncheck=1 finale=1 shuffle=1
[tfive] selftest: bridge=ready heard=4/4 check=1 uncheck=1 finale=1 shuffle=1
[tfive] selftest: finale pattern ok duration=1.020s hardware=no
[tfive] selftest: [REDACTED]=string
[tfive] selftest: shellToken=true serviceWorker=true standaloneSeenByPage=false
```

Non-`[tfive]` lines: 1 — com.pricebrannen.todaysfive: 16872


---

# BASELINE-2 — the rest of the battery (appended by the second baseline agent)

- `pwd` (inside the worktree): `/Users/pricebrannen/Today's Five/todays-five-review-baseline`
- `git -C "/Users/pricebrannen/Today's Five/todays-five-review-baseline" rev-parse HEAD`: `[REDACTED]`
- `git status --short` in the worktree: still empty (0 paths); nothing was checked out, edited or committed by BASELINE-2.
- BASELINE-2 start: `2026-09-10 01:14:28 |  1:14  up 92 days, 23:20, 2 users, load averages: 5.97 4.93 4.97`
- Same toolchain as the header. The Bash tool's shell on this Mac is zsh (it bit once, see the process notes); every script BASELINE-2 wrote runs under `/bin/sh` explicitly. Scratch: `…/scratchpad/baseline2/`.

## 4 (continued). The browser suite — run 2

### Run 2 — the measurement (BASELINE-2 picks up here)

Run 1 (`e2e4-run1-server-killed.log`) lost its static server to an outside SIGTERM two minutes in and says nothing about the code; **run 2 is the measurement.** Same command, same worktree, same port; the server for run 2 ran under the supervisor described in §3 (supervisor PID 89574, node child 89577) and was never restarted during the run (`serve.log` has exactly one `[supervisor] … starting` line and one `serving …` line).

- `E2E4 RUN2 START 2026-09-10 00:56:43 |  0:56  up 92 days, 23:02, 2 users, load averages: 10.53 6.26 5.77`
- `E2E4 RUN2 END 2026-09-10 01:15:20 exit=0 wall=1117s |  1:15  up 92 days, 23:21, 2 users, load averages: 4.76 4.83 4.94`
- BASELINE-2 polled `ps -p 89624` every 60 s (never signalled it); it was gone at the `01:15:31` poll: ` 1:15  up 92 days, 23:21, 2 users, load averages: 4.87 4.85 4.94`.
- Exit code **0**, wall **1117 s** (18 min 37 s) for both viewports in one invocation.

Tally line, verbatim (line 175, the last line of `e2e4.log`):

```
169 passed, 0 failed
```

- `ok -` lines: **169** (85 `desktop 1440×900`, 84 `phone 390×844`); `FAIL -` lines: **0** (none to quote). Section headers in the log: `== desktop 1440×900`, `== phone 390×844`. No other non-`ok` lines.
- The suite's own error-class assertions (`tools/e2e4.js` keeps per-page `pageerror`, CSP-console and non-localhost request lists and asserts all three empty), verbatim from the log:

```
ok - desktop 1440×900: a long-time device opens whole — four lists, a chosen-days repeat on the current one, 90 days of history: no page error, every Today line, the count, sync running
ok - desktop 1440×900: 1.9: a page another site has framed leaves the frame (the boot script's framebust, hashed in the CSP)
ok - desktop 1440×900: no page errors, CSP violations or third-party requests across a full session
ok - phone 390×844: a long-time device opens whole — four lists, a chosen-days repeat on the current one, 90 days of history: no page error, every Today line, the count, sync running
ok - phone 390×844: 1.9: a page another site has framed leaves the frame (the boot script's framebust, hashed in the CSP)
ok - phone 390×844: no page errors, CSP violations or third-party requests across a full session
```

- Log: `review/raw/baseline/e2e4.log` (175 lines); wrapper stamps: `review/raw/baseline/e2e4-summary.txt`.
- After the exit, BASELINE-2 killed **only** PIDs 89574 (supervisor) and 89577 (node child) at `2026-09-10 01:16:14` (` 1:16  up 92 days, 23:21, 2 users, load averages: 8.30 5.54 5.18`); `ps -p 89574,89577` then listed neither and `lsof -nP -iTCP:8890 -sTCP:LISTEN` listed nothing. PID 89624 (the suite) exited on its own and was never signalled.
- Note: `/tmp/tf-review/baseline-e2e4.done` was written at 00:54 by run 1's wrapper — i.e. **before** the real measurement finished; anything that keyed on that file at 00:54 keyed on the killed run.

## 5. The xcodebuild battery — who ran it, and what BASELINE-2 adds

**What actually happened.** The first baseline agent had queued two scripts in this session's scratchpad before it stopped — `run-xcodebuilds.sh` (the five xcodebuilds in series, each under `build-slot.sh`) and `run-sims.sh` (the pair, the Watch self-tests, the phone self-test, under `sim-slot.sh`) — chained on `/tmp/tf-review/baseline-e2e4-run2.done`. That marker landed at 01:15:20, and the build battery started on its own at **01:15:51**, thirty seconds before BASELINE-2 could start anything. BASELINE-2 found this out when its own first build finished in 6 s on a tree that was supposed to be empty. Everything below is therefore reported from the pipeline's own logs (cold tree, one build at a time, under the slot), with BASELINE-2's one duplicate build labelled for what it is. The pipeline's file names differ from the ones this brief specified; the mapping is in the table. No build was re-run: a second run on the warm tree would have been a no-op that re-emits no diagnostics, i.e. a worse measurement.

`/tmp/tf-review-baseline` was empty at 01:11 (checked); the pipeline's first build created `Build/` at 01:15:53. Xcode `26.6 (17F113)`. All five commands ran from inside the worktree with the absolute `-project` path shown in `xcodebuild-summary.txt`.

| step (this brief) | pipeline log (`review/raw/baseline/…`) | command (after `xcodebuild -project <worktree>/apple/TodaysFive/TodaysFive.xcodeproj`) | result | exit | wall | load at start → end | `warning:` | `error:` | `deprecated` |
|---|---|---|---|---|---|---|---|---|---|
| 2 Watch, sim | `xcodebuild-5b-watch-sim.log` | `-scheme TodaysFiveWatch -destination 'generic/platform=watchOS Simulator' -derivedDataPath /tmp/tf-review-baseline build` | `** BUILD SUCCEEDED **` | 0 | **2 s** (no-op: see note) | 5.54 4.96 4.97 → 5.54 4.96 4.97 | 0 | 0 | 0 |
| 6a iOS, sim | `xcodebuild-5a-ios-sim.log` | `-scheme TodaysFive -destination 'generic/platform=iOS Simulator' -derivedDataPath /tmp/tf-review-baseline build` | `** BUILD SUCCEEDED **` | 0 | **16 s** (cold) | 3.96 4.63 4.86 → 5.54 4.96 4.97 | 0 | 0 | 0 |
| 6b iOS, device | `xcodebuild-5c-ios-device.log` | `-scheme TodaysFive -destination 'generic/platform=iOS' -derivedDataPath /tmp/tf-review-baseline -[REDACTED] build` | `** BUILD SUCCEEDED **` (signed; no unsigned retry was needed) | 0 | **13 s** (cold for the device slices) | 5.54 4.96 4.97 → 7.55 5.47 5.16 | 0 | 0 | 0 |
| 6c Watch, device | `xcodebuild-5d-watch-device.log` | `-scheme TodaysFiveWatch -destination 'generic/platform=watchOS' -derivedDataPath /tmp/tf-review-baseline -[REDACTED] build` | `** BUILD SUCCEEDED **` (signed) | 0 | **4 s** (no-op: see note) | 7.55 5.47 5.16 → 7.27 5.45 5.15 | 0 | 0 | 0 |
| 6d archive | `xcodebuild-5e-archive.log` | `-scheme TodaysFive -destination 'generic/platform=iOS' -derivedDataPath /tmp/tf-review-baseline -archivePath /tmp/tf-review/7341981.xcarchive -[REDACTED] archive` | `** ARCHIVE SUCCEEDED **` (signed; never `-exportArchive`d) | 0 | **30 s** (cold: Release, whole-module) | 7.27 5.45 5.15 → 8.82 5.93 5.33 | 0 | 0 | 0 |
| (BASELINE-2's duplicate of 2) | `xcodebuild-watchsim.log` | same as step 2 | `** BUILD SUCCEEDED **` | 0 | 6 s — **not a measurement** | 8.03 5.53 5.18 → 7.55 5.47 5.16 | 0 | 0 | 0 |

Wrapper stamps, verbatim from `xcodebuild-summary.txt`: `XCODEBUILD BATTERY START 2026-09-10 01:15:51 |  1:15  up 92 days, 23:21, 2 users, load averages: 3.96 4.63 4.86` … `XCODEBUILD BATTERY END 2026-09-10 01:16:56 |  1:16  up 92 days, 23:22, 2 users, load averages: 8.82 5.93 5.33`. The whole battery, five builds in series, took **65 s** on a tree that started empty. Slot lines: `baseline-5a-ios-sim acquired 1 at 01:15:51` → `released after 16s`; `5b … 01:16:07 → 2s`; `5c … 01:16:09 → 13s`; `5d … 01:16:22 → 4s`; `5e … 01:16:26 → 30s` — all slot 1, strictly one after another.

**Why 2 s and 4 s are honest numbers.** The `TodaysFive` scheme embeds the Watch app, so building it for a platform builds `TodaysFiveWatch` and `[REDACTED]` for the matching Watch platform first: `5a-ios-sim` compiled 143 files × {`arm64`, `x86_64`} with 22 `Ld` steps and left `Debug-watchsimulator/TodaysFiveWatch.app` behind; `5c-ios-device` compiled 143 × `arm64` + 82 × `arm64_32` with 18 `Ld` steps and left `Debug-watchos/TodaysFiveWatch.app`. The two `TodaysFiveWatch`-scheme builds that followed (5b, 5d) found everything up to date: 4 + 4 and 8 + 8 `SwiftCompile` planning lines, **0 `Ld`**. So the Watch's own cold compile — and any warning it would print — is inside the 5a and 5c logs, and those are the ones the warning counts above were taken from as well. Every one of the six logs has **0 `warning:`, 0 `error:`, 0 lines matching `deprecated`** (`grep -c`; the deduplicated list is therefore empty). The only `note:` lines are the build system's own (`Building targets in dependency order`, `Using stub executor library with Swift entry point`, `Emplaced … Assets.car`).

**BASELINE-2's duplicate** (`baseline2-watchsim`, slot 2, 01:16:18–01:16:24) ran *concurrently* with the pipeline's `5c` in slot 1, both into the same derived data; it compiled 8 + 8 planning lines, linked nothing, and its 6 s says nothing about the code. It is kept because it was run, and labelled so nobody quotes it.

**Signing.** Both device builds and the archive signed with Automatic signing under the team named in the brief (`-[REDACTED]`, no `-authenticationKey*` flags); the logs show `iOS Team Provisioning Profile` entries for all three bundle ids and no provisioning error, so the `CODE_SIGNING_ALLOWED=NO` fallback was never exercised and there is no unsigned log. The signing identity's name appears in the logs and is deliberately not reproduced here. Simulator builds are `Sign to Run Locally` (ad-hoc, `--sign -`).

**Products checked (step 2's verification).** `/tmp/tf-review-baseline/Build/Products/Debug-watchsimulator/TodaysFiveWatch.app` exists, `PlugIns/[REDACTED].appex` inside it; **33** `.ttf` (`find … -name '*.ttf' | wc -l`), **1,272 KB** by `du -k` summed over the 33 files; the app is 10,444 KB by `du -sk`; `lipo -info` on its binary: `x86_64 arm64`; `Info.plist` says `1.12` / `216`. The iOS Simulator app (`Debug-iphonesimulator/TodaysFive.app`, `CFBundleVersion` 216) carries the same Watch app under `Watch/` with the same 33 fonts. Step 6c's device Watch binary, `Debug-watchos/TodaysFiveWatch.app/TodaysFiveWatch`: `lipo -info` → `arm64_32 arm64` (a fat file; the expected `arm64_32` slice is there, with an `arm64` slice beside it); its appex likewise `arm64_32 arm64`; `Debug-iphoneos/TodaysFive.app/TodaysFive` is thin `arm64`.

## 6. The archive, verified (step 6d) (`/tmp/tf-review/7341981.xcarchive`, left in place for the orchestrator)

`ARCHIVE VERIFY 2026-09-10 01:21:57 |  1:21  up 92 days, 23:27, 2 users, load averages: 22.60 47.96 28.78` (the load is the pair booting, §7).

- `find … -maxdepth 7 \( -name '*.app' -o -name '*.appex' \)` — exactly three bundles:
  ```
  Products/Applications/TodaysFive.app
  Products/Applications/TodaysFive.app/Watch/TodaysFiveWatch.app
  Products/Applications/TodaysFive.app/Watch/TodaysFiveWatch.app/PlugIns/[REDACTED].appex
  ```
- PlistBuddy `[REDACTED]` / `CFBundleVersion`: `TodaysFive.app: 1.12 / 216`, `TodaysFiveWatch.app: 1.12 / 216`, `[REDACTED].appex: 1.12 / 216` — **all three agree**, and match `version.js` (`1.12`, `216`) and the six pbxproj pairs from the report header. The archive's own `Info.plist`: `[REDACTED] 1.12`, `CFBundleVersion 216`, `Architectures [arm64]`, `CreationDate 2026-09-10 06:16:56 +0000`, `SchemeName TodaysFive`.
- `du -sh`: **29M** (29,268 KB). dSYMs: `TodaysFive.app.dSYM`, `TodaysFiveWatch.app.dSYM`, `[REDACTED].appex.dSYM`.
- `.ttf` in the archived Watch app: **33**, **1,238,128 bytes** total (`stat -f %z`, summed). `.ttf` in the appex: **0** (as expected). `.ttf` in the iOS app outside `Watch/`: 0.
- `lipo -info` on the archived Watch binary: `arm64_32 arm64` (fat); the archived appex: `arm64_32 arm64`; the archived iOS binary: thin `arm64`.
- Configuration: the archive log mentions `Release-iphoneos` 115× and `Release-watchos` 247×, `Debug-iphoneos` 0× — a Release archive. Whole-module: 8 `SwiftCompile` lines (5 `arm64`, 3 `arm64_32`) and 8 `Ld` lines — `TodaysFive` (arm64), `TodaysFiveCore` for iOS (arm64) and for watchOS (arm64 + arm64_32), `TodaysFiveWatch` (arm64 + arm64_32), `[REDACTED]` (arm64 + arm64_32). This is the one build in the battery that compiles the Watch app in Release for `arm64_32`.
- `codesign -d --entitlements :-` on the archived Watch app: `com.apple.security.application-groups = [group.com.pricebrannen.todaysfive]` — **App Group present** — plus `get-task-allow = true` (development signing, expected for an un-exported archive) and the team/app identifiers (not reproduced). The appex carries the same App Group. The iOS app's entitlements: one `com.apple.developer.associated-domains` entry (`applinks:` the site's host) and `get-task-allow`; **no App Group on the iOS app** — noted as observed, not judged here.
- `codesign -dv` on the iOS app: `Identifier=com.pricebrannen.todaysfive`, `Format=app bundle with Mach-O thin (arm64)`.

## 7. The simulator pair (steps 3–4)

Created by the pipeline's `run-sims.sh` under `sim-slot.sh baseline` (PID 6230, acquired 01:17:42), by the exact commands in this brief (`simctl create "tf-review watch" "Apple Watch Series 11 (42mm)" com.apple.CoreSimulator.SimRuntime.watchOS-26-5`, `simctl create "tf-review phone" "iPhone 17 Pro Max" com.apple.CoreSimulator.SimRuntime.iOS-26-5`, `simctl pair`, `boot` ×2, `bootstatus -b` ×2), and `/tmp/tf-review/pair.env` written at **01:17:42** (`SIM START 2026-09-10 01:17:42 |  1:17  up 92 days, 23:23, 2 users, load averages: 7.26 5.93 5.36`):

```
WATCH=8F30B5F3-A512-4CA6-90CA-C596689046DB
PHONE=BA7707F5-B082-41EB-92A5-04E586CB0D55
PAIR=E7F29476-51EC-4C21-A95C-C5A2D43C282B
```

`xcrun simctl list pairs | grep -A2 "$PAIR"` (pipeline, right after boot, and again by BASELINE-2 at 01:19):

```
E7F29476-51EC-4C21-A95C-C5A2D43C282B (active, connected)
    Watch: tf-review watch (8F30B5F3-A512-4CA6-90CA-C596689046DB) (Booted)
    Phone: tf-review phone (BA7707F5-B082-41EB-92A5-04E586CB0D55) (Booted)
```

- BASELINE-2 had launched its own pair-creating session at 01:17:53 (`sim-slot.sh baseline2`); it was still waiting for the slot when the pipeline's `pair.env` was found, and was killed at **01:20:15** *before* acquiring — the slot owner stayed `baseline 6230`, `simctl list devices` still shows exactly the two `tf-review` devices, and `pair.env` is unchanged (md5 `[REDACTED]`). No second pair was ever created. Its empty log is `review/raw/baseline/sim-session1.log` (0 bytes).
- Booting the pair cost the machine dearly: the 1-minute load went from 7.3 at 01:17:42 to **149.92** at 01:18:21 (`sim-summary.txt`, the first self-test's START stamp) and was still 99.95 at 01:19:58 and 11.0 at 01:23:09. Every timed number from the self-tests below was taken under that load.
- Step 4, from `sim-summary.txt`: `install watch app:  (rc=0)`; `get_app_container watch: …/Devices/8F30B5F3-A512-4CA6-90CA-C596689046DB/data/Containers/Bundle/Application/<container>/TodaysFiveWatch.app` — installed from `/tmp/tf-review-baseline/Build/Products/Debug-watchsimulator/TodaysFiveWatch.app`.
- Phase 5's pair (`4B6A97F5-…`: Watch `4594CB69-…`, iPhone `C33542F5-…`) and the other booted iPhones (`2100CA85-…`, `A0F5091F-…`) were never addressed by any command in this section; nothing used `simctl … all`, `delete unavailable`, `killall Simulator`, or `watchsim.mjs`.
- The pair is **left booted and paired** for the orchestrator to delete.

## 8. The five Watch self-tests (step 5) — on the review Watch `8F30B5F3-…`, from the pipeline's `run-sims.sh`

Each was its own `xcrun simctl launch --console-pty "$WATCH" com.pricebrannen.todaysfive.watchkitapp <args>` in the background, capped at **90 s** by the pipeline (this brief said 75 s; the app never exits on its own — it is a SwiftUI app whose test prints and then sits on screen — so every run hit the cap and was `simctl terminate`d; the pipeline's stamp for each is `still running at 90s cap; terminating the app`). Output redacted with the brief's `perl` expression before saving; the pipeline deleted its raw captures, so the redacted files are the only record. Each file was published under the name in this brief the moment its run ended (byte-identical `cp`; md5 shown), and the pipeline's original name is kept beside it.

| run | args | START (load) | END | lines / `[tfive]` lines | this brief's file (= pipeline's file) | md5 |
|---|---|---|---|---|---|---|
| 1 | `-TFWatchDemo -TFWatchSelfTest` | 01:18:21 (149.92 40.28 17.82) | 01:19:55 | 21 / 19 | `watch-selftest.log` (= `watch-demo-selftest.log`) | `[REDACTED]` |
| 2 | `-TFWatchDemo -TFAddSelfTest` | 01:19:58 (99.95 67.62 31.94) | 01:21:30 | 13 / 12 | `watch-addselftest.log` (= `watch-add-selftest.log`) | `[REDACTED]` |
| 3 | `-TFFontSelfTest` | 01:21:33 | 01:23:06 | 9 / 8 | `watch-fontselftest.log` (= `watch-font-selftest.log`) | `[REDACTED]` |
| 4 | `-TFConfettiSelfTest` | 01:23:09 (11.00 39.32 27.04) | 01:24:42 | 22 / 21 | `watch-confettiselftest.log` (= `watch-confetti-selftest.log`) | `[REDACTED]` |
| 5 | `-TFFaceProbe` | 01:24:45 (7.76 30.43 24.88) | 01:26:18 | 10 / 8 | `watch-faceprobe.log` (= `watch-face-probe.log`) | `[REDACTED]` |

None printed nothing. The last line of every file is `simctl`'s own `com.pricebrannen.todaysfive.watchkitapp: <pid>`.

### Run 1 — `-TFWatchDemo -TFWatchSelfTest` — the eleven, verbatim

```
[tfive] theme: slot=night day=paper night=terminal → kit=terminal pair=mono base=dark unlocked=0 offered=16
[tfive] watch: store=appGroup
[tfive] watch: demo list seeded, lines=5 mark=synced
[tfive] face: kit=terminal pair=mono face=IBMPlexMono-SemiBold → snapshot written, reloadAllTimelines requested
[tfive] watch selftest: store=appGroup
[tfive] watch selftest: list=open editable=true lines=5
[tfive] watch selftest: 1 check: modelDone=true done=1/5
[tfive] watch selftest: 2 uncheck: modelUndone=true done=0/5
[REDACTED] failed e00002c7
[tfive] watch selftest: 3 finale: fired=yes after=0.510s done=5/5
[tfive] watch selftest: 4 startAgain: done=0/5 finaleCard=false
[tfive] watch selftest: 5 shuffle x10: distinct=5 sameTwiceInARow=0 undone=5
[tfive] watch selftest: 6 wobble: undone=1 moved=false changed=false wobbled=true
[tfive] watch selftest: 7 haptics: check=10 uncheck=2 finale=1 shuffle=10
[tfive] watch selftest: 7 finale run: taps=8/8 duration=0.707s (approximation: no CoreHaptics on watchOS)
[tfive] watch selftest: 8 appGroup=true
[tfive] watch selftest: 9 snapshot: hasList=true done=4/5 nextLine=19 chars viewOnly=false rollsAt=set kit=terminal pair=mono face=IBMPlexMono-SemiBold
[tfive] watch selftest: 10 confetti: run=1 frames=134 over 2.56s = 52.0/s
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
[tfive] watch selftest: 11 theme change: terminal/IBMPlexMono-SemiBold → paper/SourceSerif4-Regular-600 changed=true
```

All eleven numbered lines are present (1–11; 7 prints twice by design). The self-test has no `pass=N/M` tally of its own — each line is its own assertion; nothing in it says `FAILED`. The one non-`[tfive]` line, `[REDACTED] failed e00002c7`, is a system message whose leading token the redaction removed (it recurs in run 5 at the same point, right after launch); with the raw capture deleted it cannot be attributed further, and it is recorded here rather than explained. The frame rate in line 10 (`52.0/s`) was measured with the Mac's 1-minute load at ~150 (§7); it is a floor, not a characterisation. Line 11 flipped the stored slot from night to day — which is why every later launch prints `slot=day` — and is what the theme-set launches in §8b put back.

`watch-demo.png` (27,305 bytes) was taken at t=30 s of this run: the Demo list in the paper kit, `4 / 5`, "Ten minutes outside" unchecked, "Water the plants" crossed off, the clock reading 1:18 — the demo was up, mid-self-test (consistent with line 9's `done=4/5`).

### Run 2 — `-TFWatchDemo -TFAddSelfTest`

```
[tfive] add self-test: begin
[tfive] add self-test: [REDACTED]=present so the wrist takes the WatchKit path
[tfive] theme: slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16
[tfive] watch: store=appGroup
[tfive] add self-test: canned ok outcome=added today=1 was=0
[tfive] add self-test: empty ok outcome=nothing-said today=1 unchanged=true
[tfive] add self-test: view-only ok outcome=view-only today=1
[tfive] add self-test: no-list ok outcome=no-list
[tfive] watch: demo list seeded, lines=5 mark=synced
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
[tfive] add self-test: undo ok today=0 was=0 tombstoned=true
[tfive] add self-test: end pass=5/5
```

Tally: **`add self-test: end pass=5/5`**. (The `[REDACTED]=present` token is the name of the interface-controller class the redaction caught — 22+ alphanumerics — not a secret.)

### Run 3 — `-TFFontSelfTest`

```
[tfive] theme: slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16
[tfive] font self-test: begin kits=16 pairs=13 files=33 familiesOnDevice=75
[tfive] font self-test: bundled=33/33
[tfive] font self-test: weights told apart by advance=12 ink=1
[tfive] font self-test: faces=33 end pass=96/96
[tfive] font self-test: at 17pt title3 scales to 17.00, task line height 20.40, tracking -0.425, extra leading 0.00
[tfive] watch: store=appGroup
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
```

Tally: **`font self-test: faces=33 end pass=96/96`**; metrics line: `at 17pt title3 scales to 17.00, task line height 20.40, tracking -0.425, extra leading 0.00`. No `FAILED` line.

### Run 4 — `-TFConfettiSelfTest`

```
[tfive] theme: slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16
[tfive] confetti self-test: begin kits=16 canvas=208x248 k=0.310
[tfive] confetti self-test: dark: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: light: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: pink: shapes=[0, 1, 2] → drew [0, 1, 2] · palette=6 · ends at frame 147
[tfive] confetti self-test: midnight: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: forest: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: paper: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: terminal: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: sunset: shapes=[0, 1] → drew [0, 1] · palette=5 · ends at frame 147
[tfive] confetti self-test: dusk: shapes=[0, 1, 2] → drew [0, 1, 2] · palette=5 · ends at frame 147
[tfive] confetti self-test: harbor: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: ember: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: cocoa: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: blush: shapes=[0, 1, 2] → drew [0, 1, 2] · palette=6 · ends at frame 147
[tfive] confetti self-test: teletype: shapes=[0] → drew [0] · palette=5 · ends at frame 147
[tfive] confetti self-test: sketch: shapes=[0] → drew [0] · palette=6 · ends at frame 147
[tfive] confetti self-test: arcade: shapes=[0] → drew [0] · palette=6 · ends at frame 147
[tfive] confetti self-test: end pass=96/96
[tfive] watch: store=appGroup
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
```

Tally: **`confetti self-test: end pass=96/96`**; sixteen `ends at frame 147` lines, one per open kit (the two Secret kits are not in the table, as the `swift test` kit suite also asserts); every kit `drew` exactly the shapes it asked for. Canvas `208x248` is the 42 mm Watch's.

### Run 5 — `-TFFaceProbe` (no `-TFWatchDemo`: the real store path, no phone app installed yet)

```
[tfive] theme: slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16
[tfive] watch: store=appGroup
[tfive] face: kit=paper pair=playfair face=SourceSerif4-Regular-600 → snapshot written, reloadAllTimelines requested
[tfive] face probe: appex=[REDACTED].appex ttfInAppex=0 fontsRoot=TodaysFiveWatch.app facesOnDisk=33 registered=33 wantedFaceOnDisk=true
[REDACTED] failed e00002c7
[tfive] face probe: accent asked for #C8321F
[tfive] face probe: fullColor  corner=#C8321F@255 centre=#B02A1A@255
[tfive] face probe: accented   corner=#C8321F@255 centre=#B02A1A@255
[tfive] face probe: the two renderings are IDENTICAL — SwiftUI did not flatten anything; the treatment is the widget host's
```

Five `face probe:` lines; `ttfInAppex=0 … facesOnDisk=33 registered=33 wantedFaceOnDisk=true` agrees with the archive count (33 in the Watch app, 0 in the appex). The redacted `appex=` token is the appex's bundle name (`[REDACTED]` is 23 characters, so the expression ate it), not a secret. The probe's verdict line is quoted as printed; it is the app's own claim about the widget host, not something this baseline verified on a face.

**`theme:` lines across the five runs** — run 1: `slot=night day=paper night=terminal → kit=terminal pair=mono base=dark unlocked=0 offered=16`; runs 2–5: `slot=day day=paper night=terminal → kit=paper pair=playfair base=light unlocked=0 offered=16`. The stored day/night ids were already the defaults (`paper` / `terminal`) on this fresh simulator; only the slot moved, by run 1's step 11.

## 8b. The two theme-set launches (step 5, last part) — queued, see the addendum at the end

`-TFWatchDemo -TFThemeSet day:paper` and `-TFWatchDemo -TFThemeSet night:terminal` (plus one plain `-TFWatchDemo` launch to read the stored values back) are scripted in BASELINE-2's `sim-session-3.sh`, queued under `sim-slot.sh baseline2-themeset` at 01:26 behind the pipeline's slot. The pipeline released the slot at 01:28:02 and another agent (`kits`, PID 11240) took it in the same second, so at the time of this append the session is still waiting. Its result is appended below as **§8b addendum** when it runs; until then the stored values on the review Watch are what run 1 left: `slot=day day=paper night=terminal` (the ids already at their defaults; only the slot flipped by the self-test's step 11).

## 9. The phone self-test (step 7) — on the review iPhone `BA7707F5-…`, from the pipeline's `run-sims.sh`

- Installed from `/tmp/tf-review-baseline/Build/Products/Debug-iphonesimulator/TodaysFive.app` (`CFBundleVersion` 216): `install phone app:  (rc=0)`; `get_app_container phone: …/Devices/BA7707F5-B082-41EB-92A5-04E586CB0D55/data/Containers/Bundle/Application/<container>/TodaysFive.app`.
- `xcrun simctl launch --console-pty "$PHONE" com.pricebrannen.todaysfive -TFSelfTest`, 90 s cap (`still running at 90s cap; terminating the app`); `-- phone-selftest START 2026-09-10 01:26:26 |  1:26  up 92 days, 23:32, 2 users, load averages: 8.18 24.01 22.98` → `-- phone-selftest END 2026-09-10 01:27:58 lines=11 tfive-lines=10`. Log: `review/raw/baseline/phone-selftest.log` (md5 `[REDACTED]`), redacted by the pipeline, raw deleted.
- It loads the live site over the network (the real page under its real CSP), and it did: the `serviceWorker=true` below is the live page's service worker in control.

The whole file, verbatim:

```
[tfive] registry: unreadable
[tfive] bridge: ready
[tfive] haptic: check=1 uncheck=0 finale=0 shuffle=0
[tfive] haptic: check=1 uncheck=1 finale=0 shuffle=0
[tfive] haptic: check=1 uncheck=1 finale=1 shuffle=0
[tfive] haptic: check=1 uncheck=1 finale=1 shuffle=1
[tfive] selftest: bridge=ready heard=4/4 check=1 uncheck=1 finale=1 shuffle=1
[tfive] selftest: finale pattern ok duration=1.020s hardware=no
[tfive] selftest: [REDACTED]=string
[tfive] selftest: shellToken=true serviceWorker=true standaloneSeenByPage=false
com.pricebrannen.todaysfive: 16872
```

- All four `selftest:` lines printed. `bridge=ready heard=4/4` — the four haptic moments dispatched in the page world were all heard in the client world; `finale pattern ok duration=1.020s hardware=no` — the volley's pattern builds where it cannot be felt (`hardware=no`: no Taptic Engine on a simulator); `[REDACTED]=string` — the key the redaction ate is `[REDACTED]` (31 characters, from `WebViewController.swift`), so the line says `typeof localStorage.getItem('tf/v2/meta')` in the client world returned `string`: the registry is readable from that world; `shellToken=true serviceWorker=true standaloneSeenByPage=false` — the shell's user-agent token is seen by the page, the service worker controls it, and the page does not see standalone display mode inside a `WKWebView` (a web view is not a home-screen PWA).
- The first line, `[tfive] registry: unreadable`, is the native side's own line before the bridge came up; it is recorded as printed and not interpreted here (see the addendum for what the source says it means).

## 10. Step 8 — the sweep of every build log

`grep -c` per file (`warning:` / `error:` / `deprecated`, the last case-insensitive):

| log | lines | `warning:` | `error:` | `deprecated` |
|---|---|---|---|---|
| `xcodebuild-5a-ios-sim.log` | 4133 | 0 | 0 | 0 |
| `xcodebuild-5b-watch-sim.log` | 564 | 0 | 0 | 0 |
| `xcodebuild-5c-ios-device.log` | 3478 | 0 | 0 | 0 |
| `xcodebuild-5d-watch-device.log` | 754 | 0 | 0 | 0 |
| `xcodebuild-5e-archive.log` | 2512 | 0 | 0 | 0 |
| `xcodebuild-watchsim.log` (BASELINE-2's duplicate) | 747 | 0 | 0 | 0 |

Deduplicated list of matching lines: **empty** — there is nothing to list. Per destination the counts are therefore: watchOS Simulator 0 (5a's embedded compile + 5b), iOS Simulator 0, iOS device 0, watchOS device 0 (5c's embedded compile + 5d), archive 0. The only diagnostics anywhere in the Apple toolchain output for 7341981 are the two `swift test` warnings already quoted in §2 (`no 'async' operations occur within 'await' expression`, `SyncTests.swift:122` and `:123`, test target only), which xcodebuild never sees because the test target is not in any scheme it built.

## Already red on 7341981

**Nothing failed on the untouched head.** 0 failures in the seven Node suites (136 ok), 0 in `swift test` (130 tests), `169 passed, 0 failed` in the browser suite's measured run, five `SUCCEEDED` builds and one `ARCHIVE SUCCEEDED` with 0 warnings, the Watch's five self-tests (11 numbered lines; `5/5`; `96/96`; `96/96`; five probe lines) and the phone's four `selftest:` lines all printed with no `FAILED` anywhere. Not red, but noted for the reviewers because a baseline should not swallow them:

1. `swift test`: 2 distinct warnings, `no 'async' operations occur within 'await' expression` at `SyncTests.swift:122:63` and `:123:77` (test target).
2. Two Watch launches (runs 1 and 5) printed one system line, `[REDACTED] failed e00002c7`, right after launch; its origin was redacted with the raw capture gone. It did not stop either run.
3. The phone printed `[tfive] registry: unreadable` before its bridge came up (§9).
4. Environmental, not the code: e2e4 run 1's static server was SIGTERMed from outside two minutes in (§4); the pair's boot pushed the 1-minute load to 149.92 during the first Watch self-test (§7), so its `52.0/s` confetti figure was taken on a saturated machine.

## Could not run / could not measure

- **A cold wall time for the `TodaysFiveWatch` scheme on its own:** could not be measured. The pipeline built `TodaysFive` for the iOS Simulator first, which compiled and linked the embedded Watch app; the `TodaysFiveWatch`-scheme build that followed was a 2 s no-op. The cold number that exists is 5a's **16 s** for the iOS Simulator app *with* its Watch app (and 5c's 13 s for the device pair). Re-running on the warm tree was deliberately not done — it would print a no-op and no diagnostics.
- **The 75 s cap and the file names in this brief:** the pipeline used a 90 s cap and its own names; the content is the same run, and the copies under this brief's names are byte-identical (md5s in §8).
- **The theme-set launches:** queued, not yet run at the time of this append (§8b, addendum below).
- `-exportArchive`: forbidden by the brief and not attempted; the archive is unverified for distribution.
- Nothing else in the brief was skipped.

## Closing table — instrument | what it printed | what it cannot see

| instrument | what it printed on 7341981 | what it cannot see |
|---|---|---|
| the seven Node suites (`test/*.test.js`, node v24.19.0) | 136 `ok -`, 0 failures, seven tally lines (`28 model … 9 compatibility tests passed`) | a browser: no DOM, no CSS, no service worker, no real clock or network; they exercise the modules, not the page |
| `swift test` (TodaysFiveCore, macOS host) | `Test run with 130 tests in 10 suites passed after 8.389 seconds`, 2 distinct `await` warnings in the test target | runs on a 64-bit Mac: it cannot see a 32-bit-`Int` overflow that only the `arm64_32` device slice raises; it never touches WatchConnectivity, the App Group container, or a Watch |
| `tools/e2e4.js` (Playwright 1.62.1, headless Chrome, both viewports, run 2) | `169 passed, 0 failed`; both "no page errors, CSP violations or third-party requests across a full session" tests passed | Safari/WebKit and iOS standalone mode; a real backend (it runs `?transport=local`); a real phone's touch, haptics or sound; anything about the native apps |
| xcodebuild ×5 (sim ×2, device ×2, archive) | five `SUCCEEDED`, 0 `warning:` / `error:` / `deprecated` in six logs; 65 s for the whole cold battery | a generic device build proves compilation and signing, not installation or launch on a device; the simulator builds prove nothing about `arm64_32` (they are `x86_64 arm64`) |
| the archive (Release, `arm64` + `arm64_32`) | three bundles all `1.12 / 216`; 33 fonts (1,238,128 B) in the Watch app, 0 in the appex; App Group on Watch app and appex | never exported (`-exportArchive` was forbidden), so App Store validation, symbol upload and the distribution profile were not tested |
| `-TFWatchSelfTest` / `-TFAddSelfTest` (Watch simulator, demo store over `MemoryTransport`) | 11 numbered tally lines; `add self-test: end pass=5/5` | a microphone (dictation is stubbed on the simulator), a Taptic motor (haptics are counted, not felt — the log says so: "approximation: no CoreHaptics on watchOS"), a phone: the demo never opens a `WCSession`, so the real hand-off is untested here |
| `-TFFontSelfTest` / `-TFConfettiSelfTest` / `-TFFaceProbe` | `font self-test: faces=33 end pass=96/96` + the metrics line; the confetti and face-probe lines quoted in §8 | a real Watch face: the probe renders into its own view, not a complication slot on watchOS's face; frame rates were measured on a Mac at load 7–150, not on a Series 11 |
| `-TFSelfTest` (iPhone simulator, the real page over the network) | the `selftest:` lines quoted in §9 | a Taptic Engine (the phone counts moments, cannot feel them), a real 5G/offline transition, App Store receipt or TestFlight install |
| `simctl` screenshots | `watch-demo.png`: the Demo list, 4/5 done, paper theme, at 01:18 | colour on an OLED wrist, always-on dimming, the Digital Crown |

## Process notes (so the next reader is not surprised)

- Two agents worked this baseline. The first ran §1–§4 and, before it stopped, queued `run-xcodebuilds.sh` → `run-sims.sh` on the e2e4 done-marker; those ran unattended from 01:15:51 and produced every build, the archive, the pair and the self-test logs under their own names. BASELINE-2 (this section) waited out the suite, killed only the static server, verified every product and the archive, published the self-test logs under the names this brief specified, queued the two theme-set launches behind the next agent's slot (§8b), swept the logs, and wrote this report. Nothing was rebuilt on the warm tree.
- BASELINE-2's one duplicate build (`xcodebuild-watchsim.log`) and one near-miss (its own pair session, killed while still waiting for the slot) are both recorded above.
- Files under `review/raw/baseline/` written by BASELINE-2: `watch-selftest.log`, `watch-addselftest.log`, `watch-fontselftest.log`, `watch-confettiselftest.log`, `watch-faceprobe.log` (byte-identical copies of the pipeline's `watch-demo-selftest.log`, `watch-add-selftest.log`, `watch-font-selftest.log`, `watch-confetti-selftest.log`, `watch-face-probe.log`; md5s in §8), `sim-session3-themeset.log` and the `watch-themeset-*.log`s it produces (§8b), `sim-session1.log` (empty), `xcodebuild-watchsim.log`. One mistake, corrected within three minutes: a shell-quoting bug in a copy loop briefly (01:21:40–01:24:10) left a copy of the *add* self-test log under the name `watch-faceprobe.log`; it was moved out of the directory, and the name now holds the real face-probe output.
- Git was never touched: `git status --short` in the worktree is still empty; nothing under `todays-five` or `.tf-worktrees/` was read or written by BASELINE-2.

## End of the first BASELINE-2 append

- `2026-09-10 01:30:15 |  1:30  up 92 days, 23:35, 2 users, load averages: 11.16 16.29 19.76`
- Left running on purpose: the review pair (Watch `8F30B5F3-A512-4CA6-90CA-C596689046DB`, iPhone `BA7707F5-B082-41EB-92A5-04E586CB0D55`, pair `E7F29476-51EC-4C21-A95C-C5A2D43C282B`), booted and paired, with the Watch app and the iPhone app installed and both apps terminated; `/tmp/tf-review/7341981.xcarchive`; `/tmp/tf-review-baseline`; BASELINE-2's queued theme-set session waiting for the sim slot. Killed by BASELINE-2: only the static-server supervisor 89574 and its node child 89577, and its own never-acquired pair session 6907.

## 7. Shutdown, and what was left running

- serve.js: stopped at `SERVE STOPPED 2026-09-10 01:21:08 |  1:21  up 92 days, 23:26, 2 users, load averages: 34.42 54.54 29.82` — see "Already red" item 2: it had already died on its own after the suite finished; nothing listens on 8890 now.
- Apps: the sim script ran `xcrun simctl terminate` on each app after each run (every run reached the 90 s cap and was terminated). At 01:28:43 `launchctl list` on my watch showed `UIKitApplication:com.pricebrannen.todaysfive.watchkitapp` running again — the "kits" agent took the sim-slot at 01:28:02, the second mine was released (`/tmp/tf-review/sim-slot/owner` = `kits 11240 …`), so that launch is theirs and I left it alone. My phone simulator has no app process.
- The pair is **left booted**, as instructed: `tf-review watch (8F30B5F3-A512-4CA6-90CA-C596689046DB) (Booted)`, `tf-review phone (BA7707F5-B082-41EB-92A5-04E586CB0D55) (Booted)`, pair `E7F29476-51EC-4C21-A95C-C5A2D43C282B (active, connected)`; `/tmp/tf-review/pair.env` holds the three UDIDs. Two sibling sessions ("watch", "baseline2-themeset") were already queued on the sim-slot behind "kits" at 01:28.
- Phase 5's pair `4594CB69-…` + `C33542F5-…` and the other two iPhones `2100CA85-…`, `A0F5091F-…` were still `(Booted)` at the end and were never named by any command of mine.
- Both build slots empty at the end; nothing of mine still running (the wrappers exited; the only processes matching my patterns belong to the "kits", "watch", "baseline2" and "ink" agents).
- Derived data `/tmp/tf-review-baseline` and the archive `/tmp/tf-review/7341981.xcarchive` are left in place for later agents. No `-exportArchive` was run.
- **Files in `review/raw/baseline/` that are NOT mine** (sibling agents wrote into this directory while I worked; do not read them as baseline evidence): `watch-selftest.log` (byte-identical to my `watch-demo-selftest.log`), `watch-addselftest.log` (byte-identical to my `watch-add-selftest.log`), `watch-fontselftest.log` (byte-identical to my `watch-font-selftest.log`), `watch-confettiselftest.log` (byte-identical to my `watch-confetti-selftest.log`), `watch-faceprobe.log` (byte-identical to my `watch-face-probe.log`), `xcodebuild-watchsim.log` (155,259 bytes, mtime Sep 10 01:16:24 2026, 1 result line(s) — not one of my five builds, whose logs are `xcodebuild-5a…5e-*.log`), `sim-session1.log` and `sim-session3-themeset.log` (both 0 bytes; the "baseline2" agent's redirect target). My files are exactly: `node-*.log`, `node-summary.txt`, `swift-test.log`, `serve.log`, `serve-run1.log`, `serve-run1-wrapper.txt`, `e2e4.log`, `e2e4-summary.txt`, `e2e4-run1-server-killed.log`, `e2e4-run1-summary.txt`, `xcodebuild-5a-ios-sim.log`, `xcodebuild-5b-watch-sim.log`, `xcodebuild-5c-ios-device.log`, `xcodebuild-5d-watch-device.log`, `xcodebuild-5e-archive.log`, `xcodebuild-summary.txt`, `sim-summary.txt`, `watch-demo-selftest.log`, `watch-add-selftest.log`, `watch-font-selftest.log`, `watch-confetti-selftest.log`, `watch-face-probe.log`, `phone-selftest.log`, `watch-demo.png`.
- End: `2026-09-10 01:28:43 CDT |  1:28  up 92 days, 23:34, 2 users, load averages: 6.91 17.76 20.62` (start was 00:48:35 at `8.53 5.78 5.75`; 40 minutes wall, of which the browser suite was 18.6 min + the 2.7 min aborted run, and the simulator step 10.3 min).

## Already red on 7341981

Nothing in the code's own instruments was red on the untouched head:

- Node suites: 7 of 7 exit 0, 136 `ok -` lines, 0 `FAIL`.
- `swift test`: `✔ Test run with 130 tests in 10 suites passed after 8.389 seconds.`, 0 `✘`.
- Browser suite, run 2: `169 passed, 0 failed`, both "no page errors, CSP violations or third-party requests across a full session" lines present.
- Five xcodebuilds: 4 × `** BUILD SUCCEEDED **`, 1 × `** ARCHIVE SUCCEEDED **`, 0 `warning:` lines in all five, no signing fallback needed.
- Archive: 1.12 / 216 on all three bundles; 33 fonts / 1,238,128 bytes in the Watch app, 0 in the appex; `arm64_32 arm64` Watch slices.

What was red was the environment, and the orchestrator should know it before reading any other agent's numbers:

1. **Browser suite run 1 was destroyed by an external SIGTERM to my `serve.js`** (`87440 Terminated: 15`, about two minutes into the run, ~00:53:30): `19 passed, 150 failed`, 149 of the 150 by `net::ERR_CONNECTION_REFUSED`. Nothing in that run is evidence about the code. Run 2 (server supervised, invoked through a symlink so a name-based `pkill -f serve.js` cannot match) ran to completion untouched.
2. **The run-2 server was found dead again at 01:21:08** — no child under its supervisor, nothing listening on 8890, no `serve.js exited` line in `serve.log` (so supervisor and child went together), and nothing on the wrapper's stderr (so it happened after the wrapper exited at 01:15:20, i.e. after the suite's last request). It did not touch the measurement; it means something on this Mac kills processes in bulk, and any agent whose server "mysteriously" stops should suspect that before suspecting the code. Four sibling review servers were up at that moment on 8891, 8893, 8894, 8895 (not mine; not touched).
3. **Booting my fresh simulator pair drove the 1-minute load to `149.92`** (01:18:21) and it was still `99.95` at 01:19:58 and `34.42` at 01:21:08. Phase 5's latency round shared the Mac with that spike; any latency number it took between about 01:17:45 and 01:22 is suspect for that reason alone.
4. Two compiler warnings in the Swift test target (`SyncTests.swift:122:63` and `:123:77`, `no 'async' operations occur within 'await' expression`) — warnings, not failures; they were there before anything was touched.
5. The `safe()` redaction rule strikes any 22+-character alphanumeric run, so it also struck the Swift identifier `[REDACTED]` in the add self-test's console (`[REDACTED]=present …`), the bundle name `[REDACTED].appex` in the face probe's console (`appex=[REDACTED].appex`), and the leading token of one IOKit console line (`[REDACTED] failed e00002c7`) in the demo and face-probe runs. None is a secret; all are the rule working as written.

## Instrument | what it printed | what it cannot see

| instrument | what it printed (this run) | what it cannot see |
|---|---|---|
| Node suites ×7 (`test/*.test.js`, Node 24.19) | `28 model`, `33 theme`, `10 crypto`, `10`+`14 sync (with v4)`, `12 sound`, `30 feature`, `9 compatibility tests passed`; 0 FAIL | No browser, DOM, CSS, service worker or real server: pure module logic under V8, not under Safari's JavaScriptCore, and only the fixtures' idea of the wire. |
| `swift test` (macOS arm64) | `✔ Test run with 130 tests in 10 suites passed after 8.389 seconds.`; 2 `await` warnings in `SyncTests.swift` | Runs with a 64-bit `Int` on a Mac: a 32-bit-`Int` overflow that only the `arm64_32` slice raises, watchOS's missing frameworks (JavaScriptCore, CoreHaptics), WatchConnectivity, any UI, any real network. |
| Browser suite `tools/e2e4.js` (Playwright 1.62.1, installed Chrome, headless, `?transport=local`) | run 2: `169 passed, 0 failed`; both "no page errors, CSP violations or third-party requests across a full session" lines | Chrome, not Safari/WebKit (the platform the PWA actually ships on); the local BroadcastChannel transport, not Supabase; no real audio, touch hardware, network latency, or install-to-Home-Screen; and run 1 shows it also cannot tell a dead server from a broken app. |
| `xcodebuild` sim builds 5a/5b (`x86_64 arm64`) | `** BUILD SUCCEEDED **` ×2, 0 `warning:` | Compiles for 64-bit simulators only — no `arm64_32`; says nothing about runtime behaviour, signing for a device, or App Store rules. |
| `xcodebuild` device builds 5c/5d (`arm64` iOS, `arm64_32 arm64` Watch, Debug, signed) | `** BUILD SUCCEEDED **` ×2, 0 `warning:`; 140 / 30 `normal arm64_32` compile steps | Debug (`-Onone`), so an optimiser-only diagnostic or a Release-only behaviour is invisible; never runs the binary; a build for one *connected* device would build only that device's arch and lose the `arm64_32` check these generic builds kept. |
| Archive 5e (Release, `-O -whole-module-optimization`, signed, `arm64_32 arm64` Watch slices) | `** ARCHIVE SUCCEEDED **`, 0 `warning:`; 1.12/216 on all three bundles; 33 fonts / 1,238,128 B in the Watch app, 0 in the appex | Never exported or validated (`-exportArchive` was not run): App Store validation, provisioning for distribution, and TestFlight are unseen; it is a compile-and-sign proof, not a runtime one. |
| Watch self-tests on my simulator pair (`-TFWatchSelfTest`, `-TFAddSelfTest`, `-TFFontSelfTest`, `-TFConfettiSelfTest`, `-TFFaceProbe`) | 11 numbered observations (`3 finale: fired=yes`, `7 haptics: check=10 uncheck=2 finale=1 shuffle=10`, `10 confetti: … 52.0/s`, `11 theme change: … changed=true`); `add self-test: end pass=5/5`; `font self-test: faces=33 end pass=96/96`; `confetti self-test: end pass=96/96`; `face probe: the two renderings are IDENTICAL …` | A simulator on an arm64 Mac: no 32-bit `Int`, no Taptic Engine (`approximation: no CoreHaptics on watchOS`, `hardware=no`), no real microphone or dictation, no real watch face or complication host on a wrist, no real paired iPhone's WCSession (MemoryTransport), and no real GPU/frame timing; the screenshot is one frame, not motion. |
| Phone self-test on my simulator (`-TFSelfTest`, live site) | `selftest: bridge=ready heard=4/4 check=1 uncheck=1 finale=1 shuffle=1`; `finale pattern ok duration=1.020s hardware=no`; `shellToken=true serviceWorker=true standaloneSeenByPage=false`; `registry: unreadable` | The simulator's WebKit, not a real iPhone's; no haptic hardware; the App Group / registry as a device would have it (`registry: unreadable` here); and it measures the *live* deployed site, not this commit's web tree. |
