#!/bin/zsh
# run-e2e4-slices.sh — tools/e2e4.js on the merged worktree served at 8893, three ONLY slices (a substring each), both viewports
NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
export NODE_PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
E="/Users/pricebrannen/Today's Five/todays-five-review/review/raw/ink"
W="/Users/pricebrannen/Today's Five/todays-five-review-ink"
cd "$W"
for only in theme accent builder; do
  echo "E2E4 ONLY=$only START $(date '+%Y-%m-%d %H:%M:%S') | $(uptime | sed 's/.*load/load/')"
  BASE=http://127.0.0.1:8893/ ONLY="$only" "$NODE" "$W/tools/e2e4.js" > "$E/e2e4-merged-only-$only.log" 2>&1
  x=$?
  echo "E2E4 ONLY=$only END $(date '+%Y-%m-%d %H:%M:%S') exit=$x | ok=$(grep -c '^ok -' "$E/e2e4-merged-only-$only.log") fail=$(grep -c '^FAIL -' "$E/e2e4-merged-only-$only.log") | tally: $(grep -E 'passed' "$E/e2e4-merged-only-$only.log" | tail -1)"
done
echo "E2E4 ALL DONE $(date '+%H:%M:%S')"
