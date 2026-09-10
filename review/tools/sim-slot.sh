#!/bin/sh
# review/tools/sim-slot.sh — run a command holding the review's ONE simulator-pair slot.
# The review owns exactly one iPhone+Watch pair (created by UDID, never Phase 5's) and one agent
# drives it at a time (review prompt §3). Usage: review/tools/sim-slot.sh <label> -- <command...>
label="$1"; shift; [ "$1" = "--" ] && shift
d=/tmp/tf-review/sim-slot
mkdir -p /tmp/tf-review
until mkdir "$d" 2>/dev/null; do
  if [ -f "$d/owner" ] && [ "$(( $(date +%s) - $(cut -d' ' -f3 "$d/owner") ))" -gt 3600 ]; then rm -rf "$d"; continue; fi
  sleep 15
done
echo "$label $$ $(date +%s)" > "$d/owner"
trap 'rm -rf "$d"' EXIT INT TERM
echo "[sim-slot] $label acquired at $(date '+%H:%M:%S')"
"$@"; rc=$?
echo "[sim-slot] $label released; exit $rc"
exit $rc
