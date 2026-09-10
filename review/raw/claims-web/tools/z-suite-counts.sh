#!/bin/sh
# suite-counts.sh — materialise each commit read-only (git archive | tar) and run the seven Node suites,
# recording each suite's tally line and its count of "ok -" lines. Usage: suite-counts.sh <sha>...
W="/Users/pricebrannen/Today's Five/todays-five-review-claims-web"
S="/private/tmp/claude-501/-Users-pricebrannen-Today-s-Five-Swift-Code/785dcc72-e6dc-4e1d-ba89-702b481a76d0/scratchpad/claims-web2/trees"
NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
export NODE_PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
mkdir -p "$S"
for sha in "$@"; do
  d="$S/$sha"; mkdir -p "$d"
  [ -f "$d/version.js" ] || git -C "$W" archive "$sha" | tar -x -C "$d"
  build=$(grep -o 'BUILD = [0-9]*' "$d/version.js" | grep -o '[0-9]*')
  total=0; line=""
  for t in model theme crypto sync sound features compat; do
    if [ -f "$d/test/$t.test.js" ]; then
      out=$(cd "$d" && "$NODE" "test/$t.test.js" 2>&1); rc=$?
      n=$(printf '%s\n' "$out" | grep -c '^ok -')
      tally=$(printf '%s\n' "$out" | grep -E '^[0-9]+ .*tests passed' | tail -1)
      fails=$(printf '%s\n' "$out" | grep -c -E '^not ok|FAIL|AssertionError')
      total=$((total+n)); line="$line $t=$n(rc=$rc,fail=$fails,tally='$tally')"
    else line="$line $t=absent"; fi
  done
  echo "$sha build=$build total_ok=$total ::$line"
done
