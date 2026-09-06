// Rollover.swift — a pure, idempotent function of (doc, today). Every record it writes is stamped
// relative to the record it replaces (+1, +2), never with the clock, so two devices produce identical
// records and a device waking from days of sleep cannot beat a real edit made elsewhere.
// COMPATIBILITY.md §3. Ported from model.js. The four steps:
//   1. finished on an earlier date → History; a recurring line resets (+2, beating a v3 rollover's
//      tombstone at +1), any other line is tombstoned (+1) as in v3;
//   2. an undone recurring line that is off Today and due today goes on Today (once per day: the rule
//      remembers the date it last placed its line, so taking it off Today sticks);
//   3. a return whose day has come puts its line back on Today and retires itself;
//   4. revival: a live rule whose line was tombstoned by a v3 rollover (a bare tombstone stamped one
//      or two ms above the line's latest History entry) is recreated from the rule's snapshot.
//
// Steps 2, 3 and 4 iterate a *snapshot* of the collection, because Object.values() takes one before
// the loop runs; step 4 reads `items` as it mutates them, so two lines revived into the same section
// take their order from that iteration order. Both are why JSONObject keeps JavaScript's key order.
import Foundation

public extension Model {

    struct RolloverResult: Sendable {
        public let doc: Doc
        public let moved: [JSONObject]
        public let changed: Bool
    }

    static func rollover(_ doc: Doc, today: String, at ts: Double = CalendarDates.now(),
                         dates: CalendarDates = CalendarDates()) -> RolloverResult {
        var moved: [JSONObject] = []
        var items = doc.items
        var history = doc.history
        var rules = doc.rules
        var returns = doc.returns
        var changed = false
        let todayKey = JSString(today)

        func liveRule(_ id: JSString) -> JSONObject? {
            guard let r = rules[id]?.objectValue, !r.truthy("deleted") else { return nil }
            return r
        }
        func stamp(_ o: JSONObject, _ key: String) -> Double {
            o[key]?.isTruthy == true ? o.num(key) : 0
        }
        func placeToday(_ rule: JSONObject, _ it: JSONObject, from: Double) {
            var item = it
            item.set("today", true)
            item.set("updatedAt", from + 1)
            items[it.str("id")] = .object(item)
            var r = rule
            r.set("placed", today)
            r.set("updatedAt", stamp(rule, "updatedAt") + 1)
            rules[rule.str("id")] = .object(r)
            changed = true
        }

        // 1. finished on an earlier date
        for value in doc.items.values {
            guard let it = value.objectValue else { continue }
            if it.truthy("deleted") || !it.truthy("done") || !(it["doneAt"]?.isTruthy ?? false) { continue }
            let id = it.str("id")
            let day = JSString(dates.localDate(it.num("doneAt")))
            if day >= todayKey { continue }

            var entry = JSONObject()
            entry["id"] = .string(id)
            entry["text"] = .string(it.str("text"))
            entry.set("doneAt", it.num("doneAt"))
            entry["section"] = .string(doc.sectionName(it.str("sectionId")))

            var list = (history[day]?.arrayValue ?? []).compactMap { $0.objectValue }
                .filter { $0.str("id") != id }
            list.append(entry)
            list.sort { a, b in
                let da = a.num("doneAt"), db = b.num("doneAt")
                if da != db { return da < db }
                return a.str("id") < b.str("id")
            }
            history[day] = .array(list.map { .object($0) })

            if let rule = liveRule(id) {
                let due = dates.isDue(rule, today)
                var item = it
                item.set("done", false)
                item.set("doneAt", 0)
                item.set("today", due)
                item.set("updatedAt", stamp(it, "updatedAt") + 2)
                items[id] = .object(item)
                if due {
                    var r = rule
                    r.set("placed", today)
                    r.set("updatedAt", stamp(rule, "updatedAt") + 1)
                    rules[rule.str("id")] = .object(r)
                }
            } else {
                var bare = JSONObject()
                bare["id"] = .string(id)
                bare.set("deleted", true)
                bare.set("updatedAt", stamp(it, "updatedAt") + 1)
                items[id] = .object(bare)
            }
            moved.append(entry)
            changed = true
        }

        // 2. due recurring lines that are off Today
        for value in rules.values {
            guard let rule = value.objectValue, !rule.truthy("deleted") else { continue }
            let id = rule.str("id")
            guard let it = items[id]?.objectValue,
                  !it.truthy("deleted"), !it.truthy("done"), !it.truthy("today") else { continue }
            if let placed = rule.stringOrNil("placed"), placed.isTruthy_, placed >= todayKey { continue }
            if let ret = returns[id]?.objectValue, !ret.truthy("deleted"), ret.str("on") > todayKey { continue }
            if dates.isDue(rule, today) { placeToday(rule, it, from: stamp(it, "updatedAt")) }
        }

        // 3. returns whose day has come
        for value in returns.values {
            guard let ret = value.objectValue, !ret.truthy("deleted"), !(ret.str("on") > todayKey) else { continue }
            let id = ret.str("id")
            if let it = items[id]?.objectValue, !it.truthy("deleted"), !it.truthy("done"), !it.truthy("today") {
                var item = it
                item.set("today", true)
                item.set("updatedAt", stamp(it, "updatedAt") + 1)
                items[id] = .object(item)
            }
            var tomb = JSONObject()
            tomb["id"] = .string(id)
            tomb.set("deleted", true)
            tomb.set("updatedAt", stamp(ret, "updatedAt") + 1)
            returns[id] = .object(tomb)
            changed = true
        }

        // 4. revival after a v3 rollover
        for value in rules.values {
            guard let rule = value.objectValue, !rule.truthy("deleted") else { continue }
            let id = rule.str("id")
            guard let t = items[id]?.objectValue, t.truthy("deleted"), !t.truthy("text") else { continue }
            guard let h = latestHistoryFor(history, id) else { continue }
            let gap = t.num("updatedAt") - h.num("doneAt")
            if gap < 1 || gap > 2 { continue }

            let ruleSection = rule.str("sectionId")
            let secItems = items.values.compactMap { $0.objectValue }
                .filter { !$0.truthy("deleted") && $0.str("sectionId") == ruleSection }
            let todayItems = items.values.compactMap { $0.objectValue }
                .filter { !$0.truthy("deleted") && $0.truthy("today") }
            let due = dates.isDue(rule, today)

            var r = JSONObject()
            r["id"] = .string(id)
            r["sectionId"] = .string(ruleSection)
            r["text"] = .string(rule.str("text"))
            r["note"] = .string(rule.str("note"))
            r.set("done", false)
            r.set("doneAt", 0)
            r.set("today", due)
            r.set("order", lastOrder(secItems) { $0.num("order") })
            r.set("todayOrder", lastOrder(todayItems) { $0.num("todayOrder") })
            r.set("updatedAt", t.num("updatedAt") + 1)
            items[id] = .object(r)
            if due {
                var updated = rule
                updated.set("placed", today)
                updated.set("updatedAt", stamp(rule, "updatedAt") + 1)
                rules[id] = .object(updated)
            }
            changed = true
        }

        guard changed else { return RolloverResult(doc: doc, moved: moved, changed: false) }
        var out = doc
        out.items = items
        out.history = history
        out.rules = rules
        out.returns = returns
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return RolloverResult(doc: out, moved: moved, changed: true)
    }

    private static func latestHistoryFor(_ history: JSONObject, _ id: JSString) -> JSONObject? {
        var best: JSONObject? = nil
        for day in history.keys {
            guard let list = history[day]?.arrayValue else { continue }
            for e in list {
                guard let eo = e.objectValue, eo.str("id") == id else { continue }
                if best == nil || eo.num("doneAt") > best!.num("doneAt") { best = eo }
            }
        }
        return best
    }
}

extension JSString {
    /// `if (rule.placed && …)`: a present-but-empty string is falsy in JavaScript.
    var isTruthy_: Bool { !isEmpty }
}
