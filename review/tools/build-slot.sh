#!/bin/sh
# review/tools/build-slot.sh — run one xcodebuild / swift test under one of TWO machine-wide slots.
# The Mac is shared with a round that is measuring latency, so this review holds itself to at most
# two builds at once (review prompt §3). Slots are directories under /tmp/tf-review made atomically
# with mkdir; a slot older than 40 minutes is treated as abandoned. Usage:
#   review/tools/build-slot.sh <label> -- <command...>
# Prints `uptime` before and after, since a timed number is meaningless without the load beside it.
label="$1"; shift; [ "$1" = "--" ] && shift
mkdir -p /tmp/tf-review/slots
held=""
while [ -z "$held" ]; do
  for s in 1 2; do
    d="/tmp/tf-review/slots/$s"
    if mkdir "$d" 2>/dev/null; then echo "$label $$ $(date +%s)" > "$d/owner"; held="$d"; break; fi
    # abandoned slot: owner file older than 40 minutes
    if [ -f "$d/owner" ] && [ "$(( $(date +%s) - $(cut -d' ' -f3 "$d/owner") ))" -gt 2400 ]; then rm -rf "$d"; fi
  done
  [ -z "$held" ] && sleep 20
done
trap 'rm -rf "$held"' EXIT INT TERM
echo "[build-slot] $label acquired $(basename "$held") at $(date '+%H:%M:%S'); load: $(uptime | sed 's/.*load averages*: //')"
start=$(date +%s)
"$@"; rc=$?
echo "[build-slot] $label released after $(( $(date +%s) - start ))s; exit $rc; load: $(uptime | sed 's/.*load averages*: //')"
exit $rc
