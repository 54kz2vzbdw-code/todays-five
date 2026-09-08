// WatchSnapshot.swift — what the Watch app leaves in the App Group for the complication, and the
// only thing the two processes share.
//
// The obvious design was to link `TodaysFiveCore` into the widget extension and read the store's own
// record out of the group. It was rejected: a widget has a small memory budget and no business
// holding somebody's list, and the narrower the thing in the shared container, the less there is to
// leak. So this is five numbers and two strings, Foundation only, and the extension depends on no
// package at all.
//
// The secrets are not here and never will be. The Keychain items stay in the Watch app's own
// keychain, which is not in the group and which the extension cannot reach — it has no reason to,
// because it never talks to the server.
//
// COMPATIBILITY.md §3's rule about a shape two builds exchange holds here as much as it does on the
// wire: `v` says which build wrote the file, a field that is missing gets its default when it is
// read, and a `v` from a future this build cannot read is refused rather than guessed at. Two
// processes from the *same* build normally write and read this, but "normally" is doing a lot of
// work in that sentence — an extension can outlive an app update by a launch.
import Foundation

/// The App Group both the Watch app and the complication are entitled to.
///
/// `containerURL(forSecurityApplicationGroupIdentifier:)` returns nil **silently** when the
/// entitlement is not in the running binary, which is why everything here has to decide what to do
/// about nil rather than force-unwrap it.
enum WatchGroup {
    static let identifier = "group.com.pricebrannen.todaysfive"

    static var container: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: identifier)
    }
}

/// One glance at the list, as of `at`.
struct WatchSnapshot: Sendable, Equatable {
    static let version = 1

    /// False when no phone has named a list yet. Telling that apart from a list with nothing on it
    /// matters: one says "open a list on your iPhone" and the other says the day is clear, and a
    /// complication that shows the wrong one is telling somebody something untrue about their day.
    var hasList = false
    /// The list's nickname when the phone gave it one, else the document's own name.
    var name = ""
    var done = 0
    var total = 0
    /// The first undone line on Today, "" when there is none. Someone's words — which is exactly why
    /// the rectangular complication that shows them is opt-in.
    var next = ""
    /// A view link cannot be changed, and nothing on the face should imply otherwise.
    var viewOnly = false
    /// When the Watch app wrote this, in milliseconds.
    var at: Double = 0
    /// The list's next midnight in its **home zone**, in milliseconds — the moment rollover empties
    /// Today. 0 when it could not be worked out. This is what lets the timeline carry a second entry
    /// and be right through the night with nothing running; see `ComplicationsProvider`.
    var rollsAt: Double = 0

    init() {}

    init(hasList: Bool, name: String, done: Int, total: Int, next: String,
         viewOnly: Bool, at: Double, rollsAt: Double) {
        self.hasList = hasList
        self.name = name
        self.done = done
        self.total = total
        self.next = next
        self.viewOnly = viewOnly
        self.at = at
        self.rollsAt = rollsAt
    }

    // ---------------------------------------------------------------- the file

    static var fileURL: URL? { WatchGroup.container?.appendingPathComponent("snapshot.json") }

    /// nil when there is no container (no entitlement in this binary), no file yet, or a file this
    /// build cannot read. All three mean the same thing to a complication — show the placeholder —
    /// and none of them is worth a different answer.
    static func read() -> WatchSnapshot? {
        guard let url = fileURL, let data = try? Data(contentsOf: url) else { return nil }
        guard let o = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return nil }
        guard let v = o["v"] as? Int, v >= 1, v <= version else { return nil }
        var s = WatchSnapshot()
        s.hasList = o["hasList"] as? Bool ?? false
        s.name = o["name"] as? String ?? ""
        s.done = (o["done"] as? NSNumber)?.intValue ?? 0
        s.total = (o["total"] as? NSNumber)?.intValue ?? 0
        s.next = o["next"] as? String ?? ""
        s.viewOnly = o["viewOnly"] as? Bool ?? false
        s.at = (o["at"] as? NSNumber)?.doubleValue ?? 0
        s.rollsAt = (o["rollsAt"] as? NSNumber)?.doubleValue ?? 0
        return s
    }

    /// Atomic, because a widget may be reading the file at the moment the app writes it and half a
    /// JSON document is not a snapshot.
    func write() throws {
        guard let url = Self.fileURL else { return }
        let o: [String: Any] = [
            "v": Self.version, "hasList": hasList, "name": name, "done": done, "total": total,
            "next": next, "viewOnly": viewOnly, "at": at, "rollsAt": rollsAt
        ]
        let data = try JSONSerialization.data(withJSONObject: o, options: [.sortedKeys])
        try data.write(to: url, options: .atomic)
    }

    // ---------------------------------------------------------------- reading it

    /// `3/5` — the inline complication, whole.
    var fraction: String { "\(done)/\(total)" }

    /// What Today looks like after the list's next midnight, worked out rather than stored.
    ///
    /// Rollover files every line finished on an earlier day into History and tombstones it, and
    /// leaves the undone lines where they are. So at midnight the done count goes to zero and the
    /// total drops by exactly the number that were done — which the extension can work out from what
    /// it already holds, with no second write from an app that by then is not running. A recurring
    /// line that comes *back* at midnight is not modelled: the face under-counts by one for a
    /// morning rather than over-counting, and the app corrects it on the next launch.
    var afterRollover: WatchSnapshot {
        var out = self
        out.done = 0
        out.total = total - done
        out.at = rollsAt
        out.rollsAt = 0
        return out
    }
}
