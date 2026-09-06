// Queries.swift — reading a document: what is on Today, what is in a section, the ordering rules,
// history, the streak, recently deleted. Ported from model.js. Every comparator is a total order
// (ties break on the id, which is unique in a collection), so no sort here depends on stability —
// which matters, because JavaScript's sort is stable and Swift's is not.
import Foundation

/// A record with typed reading on top. The JSON is the record; nothing is discarded.
public struct Item: Sendable, Hashable {
    public var json: JSONObject
    public init(_ json: JSONObject) { self.json = json }

    // The JS-typed accessors are the ones anything compared, sorted or written back must use: a
    // Swift String cannot hold an unpaired surrogate, and its == calls a precomposed and a decomposed
    // accent equal where JavaScript does not. The String ones are for showing a person.
    public var idJS: JSString { json.str("id") }
    public var textJS: JSString { json.str("text") }
    public var noteJS: JSString { json.str("note") }
    public var sectionIdJS: JSString { json.str("sectionId") }
    public var id: String { idJS.string }
    public var text: String { textJS.string }
    public var note: String { noteJS.string }
    public var sectionId: String { sectionIdJS.string }
    public var done: Bool { json.truthy("done") }
    public var doneAt: Double { json.num("doneAt") }
    public var today: Bool { json.truthy("today") }
    public var order: Double { json.num("order") }
    public var todayOrder: Double { json.num("todayOrder") }
    public var updatedAt: Double { json.num("updatedAt") }
    public var deleted: Bool { json.truthy("deleted") }
}

public struct Section: Sendable, Hashable {
    public var json: JSONObject
    public init(_ json: JSONObject) { self.json = json }
    public var idJS: JSString { json.str("id") }
    public var nameJS: JSString { json.str("name") }
    public var id: String { idJS.string }
    public var name: String { nameJS.string }
    public var order: Double { json.num("order") }
    public var collapsed: Bool { json.truthy("collapsed") }
    public var deleted: Bool { json.truthy("deleted") }
}

public struct Template: Sendable, Hashable {
    public var json: JSONObject
    public init(_ json: JSONObject) { self.json = json }
    public var idJS: JSString { json.str("id") }
    public var nameJS: JSString { json.str("name") }
    public var id: String { idJS.string }
    public var name: String { nameJS.string }
    public var lines: [(text: String, note: String)] {
        json.arr("lines").compactMap { v in
            guard let o = v.objectValue else { return nil }
            return (o.str("text").string, o.str("note").string)
        }
    }
}

public struct HistoryEntry: Sendable, Hashable {
    public var json: JSONObject
    public init(_ json: JSONObject) { self.json = json }
    public var idJS: JSString { json.str("id") }
    public var textJS: JSString { json.str("text") }
    public var sectionJS: JSString { json.str("section") }
    public var id: String { idJS.string }
    public var text: String { textJS.string }
    public var doneAt: Double { json.num("doneAt") }
    public var section: String { sectionJS.string }
}

public extension Doc {
    var liveItems: [Item] {
        items.values.compactMap { $0.objectValue }.filter { !$0.truthy("deleted") }.map(Item.init)
    }
    var liveSections: [Section] {
        sections.values.compactMap { $0.objectValue }.filter { !$0.truthy("deleted") }.map(Section.init)
    }
    var liveRules: [JSONObject] {
        rules.values.compactMap { $0.objectValue }.filter { !$0.truthy("deleted") }
    }

    /// `sortSink`: undone by the given key, then done sinking by doneAt. Ties on the id.
    static func sortSink(_ list: [Item], _ keyFn: (Item) -> Double) -> [Item] {
        list.sorted { a, b in
            if a.done != b.done { return !a.done }
            if a.done {
                if a.doneAt != b.doneAt { return a.doneAt < b.doneAt }
                return a.idJS < b.idJS
            }
            let ka = keyFn(a), kb = keyFn(b)
            if ka != kb { return ka < kb }
            return a.idJS < b.idJS
        }
    }

    /// Sections in display order.
    var sectionsOrdered: [Section] {
        liveSections.sorted { a, b in
            if a.order != b.order { return a.order < b.order }
            return a.idJS < b.idJS
        }
    }

    /// Items of one section: undone by manual order, then done by doneAt (they sink). An item whose
    /// section was deleted falls back to Unsorted.
    func itemsInSection(_ sectionId: JSString) -> [Item] {
        let known = Set(liveSections.map(\.idJS))
        let inSec = liveItems.filter { $0.sectionIdJS == sectionId || (sectionId.isEmpty && !known.contains($0.sectionIdJS)) }
        return Self.sortSink(inSec) { $0.order }
    }
    func itemsInSection(_ sectionId: String) -> [Item] { itemsInSection(JSString(sectionId)) }

    /// Today view: starred items; undone by todayOrder, done sink by doneAt.
    var todayItems: [Item] {
        Self.sortSink(liveItems.filter(\.today)) { $0.todayOrder }
    }

    func sectionName(_ sectionId: JSString) -> JSString {
        guard let s = sections[sectionId]?.objectValue, !s.truthy("deleted") else { return JSString("") }
        return s.str("name")
    }
    func sectionName(_ sectionId: String) -> String { sectionName(JSString(sectionId)).string }

    func rule(of id: JSString) -> JSONObject? {
        guard let r = rules[id]?.objectValue, !r.truthy("deleted") else { return nil }
        return r
    }
    func rule(of id: String) -> JSONObject? { rule(of: JSString(id)) }
    func returnOf(_ id: JSString) -> JSONObject? {
        guard let r = returns[id]?.objectValue, !r.truthy("deleted") else { return nil }
        return r
    }
    func returnOf(_ id: String) -> JSONObject? { returnOf(JSString(id)) }

    var liveTemplates: [Template] {
        templates.values.compactMap { $0.objectValue }.filter { !$0.truthy("deleted") }.map(Template.init)
            .sorted { a, b in
                let na = a.nameJS.lowercased, nb = b.nameJS.lowercased
                if na != nb { return na < nb }
                return a.idJS < b.idJS
            }
    }

    /// Tombstones that remember their line, newest first.
    var recentlyDeleted: [Item] {
        items.values.compactMap { $0.objectValue }.map(Item.init)
            .filter { $0.deleted && !$0.textJS.isEmpty }
            .sorted { a, b in
                if a.updatedAt != b.updatedAt { return a.updatedAt > b.updatedAt }
                return a.idJS < b.idJS
            }
    }

    /// Days with at least one finished item, most recent first.
    var historyDays: [String] {
        history.keys.sorted(by: <).reversed().map(\.string)
    }

    func historyEntries(_ day: String) -> [HistoryEntry] {
        history[day]?.arrayValue?.compactMap { $0.objectValue }.map(HistoryEntry.init) ?? []
    }

    /// Consecutive days (ending today or yesterday) with at least one finished item.
    func streak(_ today: String, dates: CalendarDates = CalendarDates()) -> Int {
        var days = Set(historyDays)
        for it in liveItems where it.done && it.doneAt != 0 {
            days.insert(dates.dayOf(self, it.doneAt))     // 1.9: in the list's home zone when it has one
        }
        var day = today
        var count = 0
        if !days.contains(day) { day = dates.addDays(day, -1) }
        while days.contains(day) {
            count += 1
            day = dates.addDays(day, -1)
        }
        return count
    }

    /// `dayReview(doc, today)` — the week's dots, the streak, and Today's lines.
    struct DayReview: Sendable, Equatable {
        public struct Day: Sendable, Equatable {
            public let day: String
            public let finished: Bool
            public let future: Bool
        }
        public struct Line: Sendable, Equatable {
            public let id: String
            public let text: String
            public let done: Bool
        }
        public let streak: Int
        public let days: [Day]
        public let finishedThisWeek: Int
        public let lines: [Line]
    }

    func dayReview(_ today: String, dates: CalendarDates = CalendarDates()) -> DayReview {
        let t = todayItems
        let wd = dates.weekdayOf(today)
        let monday = dates.addDays(today, wd == 0 ? -6 : 1 - wd)
        var days: [DayReview.Day] = []
        for i in 0..<7 {
            let d = dates.addDays(monday, i)
            let finished = d == today ? t.contains(where: \.done) : !historyEntries(d).isEmpty
            days.append(.init(day: d, finished: finished, future: JSString(d) > JSString(today)))
        }
        return DayReview(
            streak: streak(today, dates: dates),
            days: days,
            finishedThisWeek: days.filter(\.finished).count,
            lines: t.map { .init(id: $0.id, text: $0.text, done: $0.done) }
        )
    }

    /// Ids whose records differ between two docs, per collection.
    static func diff(_ prev: Doc, _ next: Doc) -> [String: [String]] {
        var out: [String: [String]] = [:]
        for key in Model.collections {
            let a = prev.json.obj(key), b = next.json.obj(key)
            var ids: [JSString] = []
            var seen = Set<JSString>()
            for k in a.keys where !seen.contains(k) { seen.insert(k); ids.append(k) }
            for k in b.keys where !seen.contains(k) { seen.insert(k); ids.append(k) }
            out[key] = ids.filter { id in
                let x = a[id], y = b[id]
                if x == nil && y == nil { return false }
                guard let x, let y else { return true }        // canon(undefined) is undefined, never equal
                return JSONWriter.canon(x) != JSONWriter.canon(y)
            }.map(\.string)
        }
        return out
    }
}

public extension Model {
    /// `orderBetween(prev, next)` — a value strictly between the two; nil when precision runs out.
    static func orderBetween(_ prev: Double?, _ next: Double?) -> Double? {
        guard let prev else {
            guard let next else { return orderStep }
            return next - orderStep
        }
        guard let next else { return prev + orderStep }
        let mid = (prev + next) / 2
        return (mid > prev && mid < next) ? mid : nil
    }

    /// `lastOrder(items, keyFn)` — one step past the largest, and never below one step.
    static func lastOrder<T>(_ items: [T], _ keyFn: (T) -> Double) -> Double {
        var maxValue: Double = 0
        for i in items { maxValue = Swift.max(maxValue, keyFn(i)) }
        return maxValue + orderStep
    }
}
