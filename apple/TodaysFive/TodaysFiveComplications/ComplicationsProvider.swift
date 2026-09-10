// ComplicationsProvider.swift — the timeline, read from the App Group.
//
// **Freshness is the complication's whole problem**, and `WidgetCenter.reloadAllTimelines()` does not
// solve it: it needs a running app, and a watch left on a bedside table all night is not running one.
// A face showing yesterday's count at nine in the morning is the failure this file exists to prevent.
//
// So the timeline is not one entry. It carries one for **now** and one for the list's **next midnight
// in its home zone**, where rollover empties Today — worked out by the Watch app, which has the
// document and the core's date helpers, and handed over in the snapshot as `rollsAt`. The count on
// the face is then right through the night with nothing running at all. Beyond that: a phone send
// wakes the app through `.backgroundTask(.watchConnectivity)`, and the app asks for one background
// refresh a day at that same midnight.
//
// The extension reads `WatchSnapshot` and **never a link**. It does not depend on `TodaysFiveCore`,
// it never talks to the server, and it cannot reach the Keychain where the secrets are.
import AppIntents
import Foundation
import SwiftUI
import WidgetKit

/// One moment on the face.
struct SnapshotEntry: TimelineEntry {
    let date: Date
    let snapshot: WatchSnapshot
    /// Only the rectangular family asks, and only it reads this.
    var showLine = false

    /// What the face shows before there is anything to show — the gallery, and the moment a
    /// complication is added.
    static func placeholder(_ date: Date = Date()) -> SnapshotEntry {
        var snap = WatchSnapshot()
        snap.hasList = true
        snap.name = "Today's Five"
        snap.done = 2
        snap.total = 5
        snap.next = "One thing at a time"
        snap.at = date.timeIntervalSince1970 * 1000
        return SnapshotEntry(date: date, snapshot: snap)
    }
}

// ---------------------------------------------------------------- the shared reading

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
            // The midnight this snapshot named has passed and the app has not written a newer one,
            // so the count on disk is yesterday's. This is the reload the policy below asked for,
            // and every hourly one after it until the app runs: hand back what the midnight entry
            // showed, not the evening's count. `afterRollover` zeroes `rollsAt`, so the same stale
            // file gives the same answer every time.
            let rolled = SnapshotEntry(date: now, snapshot: snapshot.afterRollover, showLine: showLine)
            return ([rolled], .after(now.addingTimeInterval(3600)))
        }
        let second = SnapshotEntry(date: midnight, snapshot: snapshot.afterRollover, showLine: showLine)
        // A minute past, so the reload never lands in the same second as the entry it would replace.
        return ([first, second], .after(midnight.addingTimeInterval(60)))
    }

    /// What is on disk, or a snapshot that says plainly there is no list. Never a guess: an unreadable
    /// container and an empty list are different things and the face says so.
    static func current() -> WatchSnapshot {
        WatchSnapshot.read() ?? WatchSnapshot()
    }
}

// ---------------------------------------------------------------- the count families

/// `.accessoryCircular`, `.accessoryCorner`, `.accessoryInline`: no configuration, because there is
/// nothing to choose. A count is not somebody's words.
struct CountProvider: TimelineProvider {
    func placeholder(in context: Context) -> SnapshotEntry {
        SnapshotEntry.placeholder()
    }

    func getSnapshot(in context: Context, completion: @escaping (SnapshotEntry) -> Void) {
        completion(context.isPreview ? .placeholder()
                                     : SnapshotEntry(date: Date(), snapshot: SnapshotTimeline.current()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SnapshotEntry>) -> Void) {
        let (entries, policy) = SnapshotTimeline.entries(SnapshotTimeline.current())
        completion(Timeline(entries: entries, policy: policy))
    }
}

// ---------------------------------------------------------------- the rectangular one

/// `.accessoryRectangular`, the only family that can put a line of somebody's list on a watch face,
/// and therefore the only one with a configuration: `NextLineConfiguration.showLine`, off by default.
struct NextLineProvider: AppIntentTimelineProvider {
    typealias Entry = SnapshotEntry
    typealias Intent = NextLineConfiguration

    func placeholder(in context: Context) -> SnapshotEntry {
        SnapshotEntry.placeholder()
    }

    /// What the gallery offers with one tap. **Only the count**, deliberately: a recommendation is a
    /// configuration somebody adds without opening the editor, and offering the line there would put
    /// somebody's words on their face without them ever having said yes — which is the exact thing
    /// the switch exists to prevent.
    func recommendations() -> [AppIntentRecommendation<NextLineConfiguration>] {
        [AppIntentRecommendation(intent: NextLineConfiguration(showLine: false),
                                 description: Text("Today's Five"))]
    }

    func snapshot(for configuration: NextLineConfiguration, in context: Context) async -> SnapshotEntry {
        if context.isPreview {
            var entry = SnapshotEntry.placeholder()
            entry.showLine = configuration.showLine
            return entry
        }
        return SnapshotEntry(date: Date(), snapshot: SnapshotTimeline.current(),
                             showLine: configuration.showLine)
    }

    func timeline(for configuration: NextLineConfiguration, in context: Context) async -> Timeline<SnapshotEntry> {
        let (entries, policy) = SnapshotTimeline.entries(SnapshotTimeline.current(),
                                                        showLine: configuration.showLine)
        return Timeline(entries: entries, policy: policy)
    }
}

// ---------------------------------------------------------------- the Add complication

/// The Add complication has nothing to read: it is a button, and its timeline is one entry that never
/// goes stale.
struct AddProvider: TimelineProvider {
    func placeholder(in context: Context) -> SnapshotEntry { SnapshotEntry.placeholder() }

    func getSnapshot(in context: Context, completion: @escaping (SnapshotEntry) -> Void) {
        completion(SnapshotEntry.placeholder())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SnapshotEntry>) -> Void) {
        completion(Timeline(entries: [SnapshotEntry.placeholder()], policy: .never))
    }
}
