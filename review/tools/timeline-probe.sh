#!/bin/sh
# review/tools/timeline-probe.sh <tree>
#
# The complication's timeline, run on macOS out of the tree's own source: `SnapshotTimeline.entries`
# is cut out of `ComplicationsProvider.swift` (WidgetKit's two types stubbed) and compiled beside the
# tree's `WatchSnapshot.swift`. It then plays the night the file's header describes: a snapshot written
# at 22:00 (3 of 5 done, `rollsAt` the next midnight), the app never runs again, WidgetKit asks for the
# timeline at 22:00, at the reload the policy itself asked for (00:01), and at 09:00.
#
# Exit 0: every entry dated after midnight shows the rolled count. Exit 1: an entry after midnight
# shows the count from the evening before (the face reverts). Exit 2: could not build.
# What it cannot see: whether WidgetKit honours `.after` on the minute, whether the background refresh
# at midnight lands, and what a real face draws.
set -u
tree="${1:?usage: timeline-probe.sh <tree>}"
src="$tree/apple/TodaysFive/TodaysFiveComplications/ComplicationsProvider.swift"
snap="$tree/apple/TodaysFive/Shared/WatchSnapshot.swift"
[ -f "$src" ] && [ -f "$snap" ] || { echo "timeline-probe: missing $src or $snap"; exit 2; }
dir=$(mktemp -d /tmp/tf-review-timeline.XXXXXX)
trap 'rm -rf "$dir"' EXIT
{ echo "import Foundation"; awk '/^enum SnapshotTimeline \{/{p=1} p{print} p&&/^\}/{exit}' "$src"; } > "$dir/timeline.swift"
grep -q 'static func entries' "$dir/timeline.swift" || { echo "timeline-probe: could not cut SnapshotTimeline out of $src"; exit 2; }
cp "$snap" "$dir/WatchSnapshot.swift"
cat > "$dir/stubs.swift" <<'SWIFT'
import Foundation
// WidgetKit's two types, only as much of them as `entries` touches.
struct SnapshotEntry {
    let date: Date
    let snapshot: WatchSnapshot
    var showLine = false
    init(date: Date, snapshot: WatchSnapshot, showLine: Bool = false) {
        self.date = date; self.snapshot = snapshot; self.showLine = showLine
    }
}
enum TimelineReloadPolicy { case atEnd, never, after(Date) }
SWIFT
cat > "$dir/main.swift" <<'SWIFT'
import Foundation
var failures = 0
func check(_ what: String, _ ok: Bool, _ detail: String = "") {
    print((ok ? "ok   " : "FAIL ") + what + (detail.isEmpty ? "" : "  [" + detail + "]"))
    if !ok { failures += 1 }
}
func fmt(_ d: Date, _ tz: TimeZone) -> String {
    let f = DateFormatter(); f.timeZone = tz; f.dateFormat = "MM-dd HH:mm"; return f.string(from: d)
}
func describe(_ es: [SnapshotEntry], _ tz: TimeZone) -> String {
    es.map { "\(fmt($0.date, tz))→\($0.snapshot.done)/\($0.snapshot.total)" }.joined(separator: ", ")
}
for zone in ["America/Chicago", "Pacific/Kiritimati"] {
    let tz = TimeZone(identifier: zone)!
    var cal = Calendar(identifier: .gregorian); cal.timeZone = tz
    let evening = cal.date(from: DateComponents(year: 2026, month: 9, day: 8, hour: 22))!
    let midnight = cal.nextDate(after: evening, matching: DateComponents(hour: 0, minute: 0, second: 0),
                                matchingPolicy: .nextTime)!
    let snap = WatchSnapshot(hasList: true, name: "List", done: 3, total: 5, next: "Walk",
                             viewOnly: false, at: evening.timeIntervalSince1970 * 1000,
                             rollsAt: midnight.timeIntervalSince1970 * 1000)
    let rolled = snap.afterRollover
    print("\(zone): snapshot written \(fmt(evening, tz)) 3/5, rolls at \(fmt(midnight, tz)); the app never runs again")
    let (e1, _) = SnapshotTimeline.entries(snap, now: evening)
    print("  getTimeline at \(fmt(evening, tz)): " + describe(e1, tz))
    check("\(zone): the evening timeline carries a midnight entry", e1.count == 2)
    check("\(zone): the midnight entry is the rolled count",
          e1.count == 2 && e1[1].snapshot.done == rolled.done && e1[1].snapshot.total == rolled.total)
    for hours in [1.0 / 60.0, 1.0, 9.0, 33.0] {   // the 00:01 reload the policy asked for, 01:00, 09:00, the next evening
        let now = midnight.addingTimeInterval(hours * 3600)
        let (es, _) = SnapshotTimeline.entries(snap, now: now)
        print("  getTimeline at \(fmt(now, tz)): " + describe(es, tz))
        let first = es.first
        check("\(zone): at \(fmt(now, tz)) the face shows the rolled count, not the evening's",
              first != nil && first!.snapshot.done == rolled.done && first!.snapshot.total == rolled.total,
              first.map { "shows \($0.snapshot.done)/\($0.snapshot.total), rolled is \(rolled.done)/\(rolled.total)" } ?? "no entry")
    }
}
print(failures == 0 ? "timeline-probe: PASS" : "timeline-probe: FAIL (\(failures))")
exit(failures == 0 ? 0 : 1)
SWIFT
if ! xcrun swiftc -O -o "$dir/probe" "$dir/stubs.swift" "$dir/timeline.swift" "$dir/WatchSnapshot.swift" "$dir/main.swift" 2> "$dir/build.err"; then
    echo "timeline-probe: build failed"; cat "$dir/build.err"; exit 2
fi
"$dir/probe"
