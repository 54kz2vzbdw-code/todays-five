#!/bin/zsh
# run-census.sh — runs every census.mjs mode for both bases, three at a time, into review/raw/ink/census-*.json
NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
E="/Users/pricebrannen/Today's Five/todays-five-review/review/raw/ink"
S="/private/tmp/claude-501/-Users-pricebrannen-Today-s-Five-Swift-Code/785dcc72-e6dc-4e1d-ba89-702b481a76d0/scratchpad/ink"
MAIN="$S/main/theme.js"; BR="$S/branch/theme.js"
CODES="T2:d:FF3D9A:fraunces:bell:Name,T2:l:FF3D9A:fraunces::Mine · day,T2:d:3366FF:grotesk::Blue,T2:l:2F7F6F:manrope:kalimba:Slate green, day,T2:d:2F7F6F:manrope:kalimba:Slate green,T2:d:3366FF:grotesk:marble:Marbles,T2:l:3366FF:grotesk:marble:Marbles · day,T2:d:D26128:lato:pop:A:B,T2:d:D26128:dmserif::Custom,T2:d:FF3D9A:fraunces:bell:Mine,T2:d:11735B:grotesk:marble:Teal"
run() { local name=$1; shift; echo "START $name $(date '+%H:%M:%S')"; "$NODE" "$E/tools/census.mjs" --main "$MAIN" --branch "$BR" "$@" --out "$E/census-$name.json" > /dev/null 2> "$E/census-$name.err"; echo "END $name $(date '+%H:%M:%S') exit=$?"; }
cd "$E"
run seed-dark --mode seed --base dark &
run seed-light --mode seed --base light &
run codes --mode codes --base dark --codes "$CODES" &
wait
run sample-dark --mode sample --base dark --n 200000 --seed 20260910 &
run sample-light --mode sample --base light --n 200000 --seed 20260910 &
run surprise-dark --mode surprise --base dark --n 2000 --seed 20260910 &
wait
run surprise-light --mode surprise --base light --n 2000 --seed 20260910 &
run stride4-dark --mode stride --base dark --stride 4 &
run stride4-light --mode stride --base light --stride 4 &
wait
run stride2-dark --mode stride --base dark --stride 2 &
run stride2-light --mode stride --base light --stride 2 &
wait
echo "ALL DONE $(date '+%H:%M:%S')"
