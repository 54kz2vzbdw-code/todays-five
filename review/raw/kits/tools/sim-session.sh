#!/bin/sh
# sim-session.sh — the KITS track's one scripted session on the review pair. Run under sim-slot.sh.
# Launches the baseline's Debug-watchsimulator product with debug arguments, screenshots at native size,
# and never rebuilds. Consoles go to $OUT unredacted; the caller redacts before copying to evidence.
OUT="$1"; BASELINE="$2"
. /tmp/tf-review/pair.env
BUNDLE=com.pricebrannen.todaysfive.watchkitapp
APP=/tmp/tf-review-baseline/Build/Products/Debug-watchsimulator/TodaysFiveWatch.app
mkdir -p "$OUT"
log() { echo "[session $(date '+%H:%M:%S')] $*" | tee -a "$OUT/session.log"; }
log "WATCH=$WATCH"
xcrun simctl list devices | grep -i "$WATCH" | tee -a "$OUT/session.log"
if ! xcrun simctl get_app_container "$WATCH" $BUNDLE >/dev/null 2>&1; then log "app not installed on the pair; installing the baseline product"; xcrun simctl install "$WATCH" "$APP" 2>&1 | tee -a "$OUT/session.log"; fi
xcrun simctl get_app_container "$WATCH" $BUNDLE 2>&1 | sed 's#/Users/[^ ]*/CoreSimulator#…/CoreSimulator#' | tee -a "$OUT/session.log"
run() { name="$1"; secs="$2"; shift 2
  xcrun simctl terminate "$WATCH" $BUNDLE >/dev/null 2>&1; sleep 1
  log "launch $name: $*"
  xcrun simctl launch --console-pty "$WATCH" $BUNDLE "$@" > "$OUT/$name.console" 2>&1 &
  lp=$!; sleep "$secs"
  xcrun simctl io "$WATCH" screenshot "$OUT/$name.png" >/dev/null 2>&1; sleep 1
  xcrun simctl terminate "$WATCH" $BUNDLE >/dev/null 2>&1; sleep 1; kill $lp 2>/dev/null; wait $lp 2>/dev/null
  log "  -> $(grep -c . "$OUT/$name.console") console lines, $(stat -f %z "$OUT/$name.png" 2>/dev/null || echo 0) png bytes"
}
# b. three screenshots per kit, relaunching each time
for n in 1 2 3; do for k in dark paper terminal; do run "b-$k-$n" 9 -TFWatchDemo -TFKit "$k"; done; done
# k. the picker persists across a cold launch, then the pair's default is restored
run k-A 7 -TFWatchDemo -TFThemeSet day:harbor
run k-B 7 -TFWatchDemo
run k-restore1 6 -TFWatchDemo -TFThemeSet day:paper
run k-restore2 6 -TFWatchDemo -TFThemeSet night:terminal
run k-verify 6 -TFWatchDemo
# l/m. the self-tests, only where the baseline has no log of them
if ! grep -l 'face probe' "$BASELINE"/watch-*.log >/dev/null 2>&1; then run l-faceprobe 12 -TFWatchDemo -TFFaceProbe; fi
if ! grep -l 'font self-test' "$BASELINE"/watch-*.log >/dev/null 2>&1; then run m-fontselftest 12 -TFWatchDemo -TFFontSelfTest; fi
if ! grep -l 'confetti self-test' "$BASELINE"/watch-*.log >/dev/null 2>&1; then run m-confettiselftest 14 -TFWatchDemo -TFConfettiSelfTest; fi
# n. what the App Group container holds: names and sizes only
C=$(xcrun simctl get_app_container "$WATCH" $BUNDLE group.com.pricebrannen.todaysfive 2>/dev/null)
log "app group container: ${C:+present}"
if [ -n "$C" ]; then ( cd "$C" && find . -type f -exec stat -f '%z %N' {} \; | sort -k2 ) > "$OUT/n-appgroup.txt"; log "app group files: $(wc -l < "$OUT/n-appgroup.txt")"; fi
xcrun simctl terminate "$WATCH" $BUNDLE >/dev/null 2>&1
log "done"
