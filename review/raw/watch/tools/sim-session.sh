#!/bin/sh
# review/raw/watch/tools/sim-session.sh — the Watch review's ONE simulator session, run as
#   review/tools/sim-slot.sh watch -- /bin/sh review/raw/watch/tools/sim-session.sh
# It touches only the review's own pair ($WATCH/$PHONE from /tmp/tf-review/pair.env), installs the
# baseline's built products (same commit 7341981), runs -TFWatchDemo -TFWatchSelfTest three times,
# lists the App Group container (counts and shapes; the demo id is redacted), opens todaysfive://add,
# and — if the pair is active+connected — reproduces the phone→Watch hand-off with an EMPTY vault
# (`-TFQuery transport=local`; nothing is created anywhere). Every console is redacted before it is
# kept. No other UDID is ever named.
set -u
. /tmp/tf-review/pair.env
R="/Users/pricebrannen/Today's Five/todays-five-review/review/raw/watch"
S="/private/tmp/claude-501/-Users-pricebrannen-Today-s-Five-Swift-Code/785dcc72-e6dc-4e1d-ba89-702b481a76d0/scratchpad/watch/sim"
mkdir -p "$S"
WAPP=/tmp/tf-review-baseline/Build/Products/Debug-watchsimulator/TodaysFiveWatch.app
PAPP=/tmp/tf-review-baseline/Build/Products/Debug-iphonesimulator/TodaysFive.app
WB=com.pricebrannen.todaysfive.watchkitapp
PB=com.pricebrannen.todaysfive
GROUP=group.com.pricebrannen.todaysfive
REDACT='s/(?<![0-9A-Za-z])[0-9A-Za-z]{22,}(?![0-9A-Za-z])/[REDACTED]/g'
log() { echo "[session] $(date '+%H:%M:%S') $*"; }
redact() { perl -pe "$REDACT" "$1" > "$2"; }
snap() { xcrun simctl io "$WATCH" screenshot "$1" >/dev/null 2>&1 && log "screenshot $1" || log "screenshot FAILED $1"; }

log "session start WATCH=$WATCH PHONE=$PHONE"; uptime
xcrun simctl list devices -j | python3 -c '
import json,sys
w,p=sys.argv[1],sys.argv[2]
for rt,devs in json.load(sys.stdin)["devices"].items():
    for d in devs:
        if d["udid"] in (w,p): print("device", d["name"], "|", rt.split(".")[-1], "|", d["state"], "|", "watch" if d["udid"]==w else "phone")
' "$WATCH" "$PHONE"
PAIRSTATE=$(xcrun simctl list pairs -j | python3 -c '
import json,sys
w=sys.argv[1]
for pid,p in json.load(sys.stdin)["pairs"].items():
    if p.get("watch",{}).get("udid")==w: print(p["state"])
' "$WATCH")
log "pair state: ${PAIRSTATE:-not found}"
log "built products:"; ls -d "$WAPP" "$PAPP" 2>&1
for app in "$WAPP" "$WAPP/PlugIns/[REDACTED].appex" "$PAPP"; do
  printf '  %s: ' "$(basename "$app")"; plutil -extract CFBundleIdentifier raw "$app/Info.plist" 2>/dev/null | tr '\n' ' '; plutil -extract [REDACTED] raw "$app/Info.plist" 2>/dev/null | tr '\n' ' '; plutil -extract CFBundleVersion raw "$app/Info.plist" 2>/dev/null; done
ls "$WAPP"/*.ttf 2>/dev/null | wc -l | sed 's/^/  ttf in the watch app: /'
ls "$WAPP/PlugIns/[REDACTED].appex"/*.ttf 2>/dev/null | wc -l | sed 's/^/  ttf in the appex: /'

# ---------------------------------------------------------------- install the Watch app
log "install watch app"; xcrun simctl install "$WATCH" "$WAPP" 2>&1 | sed 's/^/  /'
xcrun simctl terminate "$WATCH" "$WB" >/dev/null 2>&1

# ---------------------------------------------------------------- the self-test, three times
for i in 1 2 3; do
  xcrun simctl terminate "$WATCH" "$WB" >/dev/null 2>&1; sleep 2
  log "selftest run $i start"; uptime
  xcrun simctl launch --console-pty "$WATCH" "$WB" -TFWatchDemo -TFWatchSelfTest > "$S/selftest-run$i.raw" 2>&1 &
  LP=$!
  n=0; while [ $n -lt 60 ]; do sleep 1; n=$((n+1)); grep -q '11 theme change' "$S/selftest-run$i.raw" 2>/dev/null && break; done
  sleep 1
  snap "$R/selftest-run$i.png"
  kill $LP >/dev/null 2>&1; wait $LP 2>/dev/null
  xcrun simctl terminate "$WATCH" "$WB" >/dev/null 2>&1
  redact "$S/selftest-run$i.raw" "$R/selftest-run$i.log"
  log "selftest run $i end after ${n}s wait"; uptime
done

# ---------------------------------------------------------------- the App Group container, after the demo
G=$(xcrun simctl get_app_container "$WATCH" "$WB" "$GROUP" 2>&1)
log "app group container path: $G"
if [ -d "$G" ]; then
  { echo "# App Group container of the demo Watch app on the review pair, $(date)"; echo "# path: $G"; echo "# listing (names redacted where secret-shaped):"; ls -la "$G" "$G/lists" 2>&1; echo; echo "# snapshot.json:"; cat "$G/snapshot.json" 2>&1; echo; echo "# each list file: is the FILENAME equal to the document's own id, and what keys does the record hold"; for f in "$G"/lists/*.json; do [ -f "$f" ] || continue; python3 - "$f" <<'PY'
import json,sys,os
p=sys.argv[1]; o=json.load(open(p)); b=os.path.basename(p)[:-5]; d=o.get("doc",{})
print("file:", b, "| filename==doc.id:", b==d.get("id"), "| id length:", len(d.get("id","")), "| record keys:", sorted(o.keys()), "| doc keys:", sorted(d.keys()), "| items:", len(d.get("items",{})), "| mode:", o.get("mode"), "| dirty:", o.get("dirty"), "| created:", o.get("created"))
PY
  done; } > "$S/appgroup.raw" 2>&1
  redact "$S/appgroup.raw" "$R/appgroup-container.txt"
else
  echo "no container: $G" > "$R/appgroup-container.txt"
fi

# ---------------------------------------------------------------- the URL door: todaysfive://add
xcrun simctl terminate "$WATCH" "$WB" >/dev/null 2>&1; sleep 2
log "openurl test start"; uptime
xcrun simctl launch --console-pty "$WATCH" "$WB" -TFWatchDemo > "$S/openurl.raw" 2>&1 &
LP=$!; sleep 8
snap "$R/openurl-before.png"
xcrun simctl openurl "$WATCH" "todaysfive://add" > "$S/openurl-cmd.txt" 2>&1; echo "openurl exit=$?" >> "$S/openurl-cmd.txt"; cat "$S/openurl-cmd.txt" | sed 's/^/  /'
sleep 5
snap "$R/openurl-after.png"
sleep 1; kill $LP >/dev/null 2>&1; wait $LP 2>/dev/null
xcrun simctl terminate "$WATCH" "$WB" >/dev/null 2>&1
{ cat "$S/openurl-cmd.txt"; echo "--- watch console:"; cat "$S/openurl.raw"; } > "$S/openurl-all.raw"
redact "$S/openurl-all.raw" "$R/openurl.log"
log "openurl test end"

# ---------------------------------------------------------------- the hand-off, empty vault, only if the pair is connected
case "$PAIRSTATE" in
  *connected*)
    log "hand-off start (pair $PAIRSTATE)"; uptime
    log "install phone app"; xcrun simctl install "$PHONE" "$PAPP" 2>&1 | sed 's/^/  /'
    xcrun simctl terminate "$PHONE" "$PB" >/dev/null 2>&1
    xcrun simctl launch --console-pty "$PHONE" "$PB" -TFDumpWatchSend -TFQuery transport=local > "$S/handoff-phone.raw" 2>&1 &
    PP=$!; sleep 12
    xcrun simctl terminate "$WATCH" "$WB" >/dev/null 2>&1; sleep 1
    xcrun simctl launch --console-pty "$WATCH" "$WB" > "$S/handoff-watch.raw" 2>&1 &
    WP=$!; sleep 20
    snap "$R/handoff-watch.png"
    xcrun simctl io "$PHONE" screenshot "$R/handoff-phone.png" >/dev/null 2>&1 && log "screenshot handoff-phone.png"
    kill $PP $WP >/dev/null 2>&1; wait $PP $WP 2>/dev/null
    xcrun simctl terminate "$PHONE" "$PB" >/dev/null 2>&1
    xcrun simctl terminate "$WATCH" "$WB" >/dev/null 2>&1
    redact "$S/handoff-phone.raw" "$R/handoff-phone.log"
    redact "$S/handoff-watch.raw" "$R/handoff-watch.log"
    log "hand-off end"; uptime ;;
  *) log "pair is '$PAIRSTATE' — not connected; the hand-off is skipped" ;;
esac
log "session end"; uptime
