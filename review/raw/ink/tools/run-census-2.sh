#!/bin/zsh
# run-census-2.sh — the three exhaustive runs again after the Math.max(...arr) fix; node's own exit status this time
NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
E="/Users/pricebrannen/Today's Five/todays-five-review/review/raw/ink"
S="/private/tmp/claude-501/-Users-pricebrannen-Today-s-Five-Swift-Code/785dcc72-e6dc-4e1d-ba89-702b481a76d0/scratchpad/ink"
MAIN="$S/main/theme.js"; BR="$S/branch/theme.js"
run() { local name=$1; shift; local t0=$(date '+%H:%M:%S'); "$NODE" "$E/tools/census.mjs" --main "$MAIN" --branch "$BR" "$@" --out "$E/census-$name.json" > /dev/null 2> "$E/census-$name.err"; local x=$?; echo "$name start=$t0 end=$(date '+%H:%M:%S') exit=$x"; }
run stride4-light --mode stride --base light --stride 4 &
run stride2-dark --mode stride --base dark --stride 2 &
run stride2-light --mode stride --base light --stride 2 &
wait
echo "ALL DONE $(date '+%H:%M:%S')"
