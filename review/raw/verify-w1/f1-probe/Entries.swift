import Foundation
// WidgetKit stubs — only the two types ComplicationsProvider.swift:44-65 touches.
protocol TimelineEntry { var date: Date { get } }
enum TimelineReloadPolicy { case atEnd, never, after(Date) }
struct SnapshotEntry: TimelineEntry { let date: Date; let snapshot: WatchSnapshot; var showLine = false }
// ---- ComplicationsProvider.swift lines 44-65 at 7341981, extracted with sed, unedited: ----
enum SnapshotTimeline {

    /// Now, and the list's next midnight. Nothing between them: the count cannot change without the
    /// app running, and if the app runs it reloads the timeline itself.
    ///
    /// A missing `rollsAt` (a list with a zone this platform cannot compute in, or no snapshot at
    /// all) leaves one entry and a reload asked for in an hour — a face that is merely out of date
    /// rather than confidently wrong.
    static func entries(_ snapshot: WatchSnapshot, showLine: Bool = false,
                        now: Date = Date()) -> ([SnapshotEntry], TimelineReloadPolicy) {
        let first = SnapshotEntry(date: now, snapshot: snapshot, showLine: showLine)
        guard snapshot.hasList, snapshot.rollsAt > 0 else {
            return ([first], .after(now.addingTimeInterval(3600)))
        }
        let midnight = Date(timeIntervalSince1970: snapshot.rollsAt / 1000)
        guard midnight > now else {
            return ([first], .after(now.addingTimeInterval(3600)))
        }
        let second = SnapshotEntry(date: midnight, snapshot: snapshot.afterRollover, showLine: showLine)
        // A minute past, so the reload never lands in the same second as the entry it would replace.
        return ([first, second], .after(midnight.addingTimeInterval(60)))
    }
}
