// WidgetTimeline.swift — what a list widget draws, and when it changes without anything running.
//
// A timeline asks the server for the list (WidgetFeed.refresh) unless the shelf was written in the last twenty
// seconds — by a check-off on a widget, or by the app after a change on the page — and gives up after nine, keeping
// what the shelf has: a widget that cannot reach the network shows the list as it last was, never a blank.
//
// Then it carries the moments the widget has to change on its own: the list's next midnight in its home zone (the
// done lines go to History), and, on a device whose theme switches on a schedule, the switch times. The next read
// is asked for in thirty minutes, or a minute after midnight if that is sooner. The app asks for one whenever the
// list changes under it, and a check-off on a widget is drawn again as soon as its intent returns.
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

struct DayProvider: AppIntentTimelineProvider {
    typealias Entry = DayEntry
    typealias Intent = ListConfiguration

    func placeholder(in context: Context) -> DayEntry { .sample(Date()) }

    func recommendations() -> [AppIntentRecommendation<ListConfiguration>] {
        [AppIntentRecommendation(intent: ListConfiguration(), description: "Today's Five")]
    }

    /// The gallery: the person's own list from the shelf when there is one (no network: the gallery waits for
    /// nobody), else the sample.
    func snapshot(for configuration: ListConfiguration, in context: Context) async -> DayEntry {
        let now = Date(), look = WidgetLook.read() ?? WidgetLook()
        Self.registerType(look)
        if let key = Self.key(configuration), let day = WidgetDay.read(key: key), !day.lines.isEmpty {
            return DayEntry(date: now, state: .list, day: day, look: look)
        }
        return .sample(now, look: look)
    }

    func timeline(for configuration: ListConfiguration, in context: Context) async -> Timeline<DayEntry> {
        let now = Date(), look = WidgetLook.read() ?? WidgetLook()
        Self.registerType(look)
        guard let key = Self.key(configuration) else {
            let empty = DayEntry(date: now, state: .noList, day: WidgetDay(), look: look)
            return Timeline(entries: [empty], policy: .after(now.addingTimeInterval(2 * 3600)))
        }
        var day = WidgetDay.read(key: key)
        let fresh = day.map { now.timeIntervalSince1970 * 1000 - $0.at < 20_000 } ?? false
        if !fresh, let read = await Self.within(9, { await WidgetFeed.live().refresh(key) }) { day = read }
        guard let day else {
            var named = WidgetDay(); named.key = key; named.name = WidgetIndex.read()?.ref(key)?.name ?? ""
            let unread = DayEntry(date: now, state: .unread, day: named, look: look)
            return Timeline(entries: [unread], policy: .after(now.addingTimeInterval(15 * 60)))
        }
        return Self.timeline(day, look: look, now: now)
    }

    /// Now, the schedule's switches, and the list's midnight with the done lines gone from it.
    static func timeline(_ day: WidgetDay, look: WidgetLook, now: Date) -> Timeline<DayEntry> {
        let midnight = day.rollsAt > 0 ? Date(timeIntervalSince1970: day.rollsAt / 1000) : nil
        // a shelf from before a midnight that has passed: what that midnight would have shown
        let current = midnight.map { $0 <= now } ?? false ? day.afterRollover : day
        var entries = [DayEntry(date: now, state: .list, day: current, look: look)]
        var moments = look.switches(after: now)
        if let midnight, midnight > now { moments.append(midnight) }
        for at in Set(moments).sorted() {
            let after = midnight.map { at >= $0 } ?? false
            entries.append(DayEntry(date: at, state: .list, day: after ? day.afterRollover : current, look: look))
        }
        var next = now.addingTimeInterval(30 * 60)
        if let midnight, midnight > now, midnight < next { next = midnight.addingTimeInterval(60) }
        if day.gone { next = now.addingTimeInterval(6 * 3600) }
        return Timeline(entries: entries, policy: .after(next))
    }

    static func key(_ configuration: ListConfiguration) -> String? {
        if let chosen = configuration.list?.id, WidgetFeed.live().link(forKey: chosen) != nil { return chosen }
        return WidgetFeed.live().defaultKey()
    }

    static func registerType(_ look: WidgetLook) {
        KitFonts.register(look.look("day").kit)
        KitFonts.register(look.look("night").kit)
    }

    /// The work, or nil if it has not answered in `seconds`: a timeline must come back whatever the network does.
    static func within<T: Sendable>(_ seconds: Double, _ work: @escaping @Sendable () async -> T?) async -> T? {
        await withTaskGroup(of: T?.self) { group in
            group.addTask { await work() }
            group.addTask { try? await Task.sleep(for: .seconds(seconds)); return nil }
            let first = await group.next() ?? nil
            group.cancelAll()
            return first
        }
    }
}
