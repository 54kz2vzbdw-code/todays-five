// WidgetEntry.swift — one moment of a list widget: what it draws, and the sample the gallery shows before a list has
// been read. Compiled into the widget extension and, in a debug build, into the app for the widget lab (WidgetDebug.swift),
// which is why it holds nothing that is an App Intent: an intent compiled into both would leave the system two types for
// one identifier, and it picks one the extension cannot make (seen 2026-10-01: every timeline failed, `intentNotFound`).
import Foundation
import TodaysFiveCore
import WidgetKit

struct DayEntry: TimelineEntry {
    enum State: Equatable {
        case list       // a list, as read
        case noList     // the phone holds no list
        case unread     // a list that has never been read (offline since it was added)
        case sample     // the gallery and the placeholder
    }
    let date: Date
    let state: State
    let day: WidgetDay
    let look: WidgetLook

    /// The Smart Stack's hint: a day with lines left matters more than a sealed one.
    var relevance: TimelineEntryRelevance? {
        guard state == .list, !day.gone else { return TimelineEntryRelevance(score: 0) }
        return TimelineEntryRelevance(score: day.left > 0 ? Float(10 + day.left) : 1)
    }

    /// What the gallery shows before a list has been read: five lines a person might really have, two done.
    static func sample(_ date: Date, look: WidgetLook = WidgetLook.read() ?? WidgetLook()) -> DayEntry {
        let lines = [("Call the plumber about the sink", false), ("Walk the dog before dinner", false),
                     ("Pick up the prescription", false), ("Reply to Sam", true), ("Empty the dishwasher", true)]
        var day = WidgetDay()
        day.key = "sample"
        day.name = "Today's Five"
        day.lines = lines.enumerated().map { i, l in WidgetLine(id: "s\(i)", text: l.0, done: l.1, order: Double(i), doneAt: l.1 ? Double(i) : 0) }
        day.at = date.timeIntervalSince1970 * 1000
        return DayEntry(date: date, state: .sample, day: day, look: look)
    }
}
