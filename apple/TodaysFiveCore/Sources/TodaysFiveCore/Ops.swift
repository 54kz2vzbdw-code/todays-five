// Ops.swift — the operations that change a document: recurrence rules, "not today", tombstones and
// restore, templates, a section on or off Today, a line moved to another list, export and import.
// Ported from model.js. Each returns a new document; each stamps the records it writes with the
// timestamp it was given, never with the clock, so two devices agree.
import Foundation

public extension Model {

    /// Set (or clear, with nil) the recurrence rule of a line. The rule keeps a snapshot of the line
    /// so a revival has text.
    static func setRule(_ doc: Doc, _ id: String, _ rule: JSONObject?,
                        at ts: Double = CalendarDates.now(), today: String) -> Doc {
        guard let it = doc.items[id]?.objectValue, !it.truthy("deleted") else { return doc }
        var out = doc
        var rules = doc.rules
        if let rule {
            var r = JSONObject()
            r.set("id", id)
            r["kind"] = rule["kind"] ?? .string("")
            r["text"] = .string(it.str("text"))
            r["note"] = .string(it.str("note"))
            r["sectionId"] = .string(it.str("sectionId"))
            r.set("updatedAt", ts)
            let kind = rule.stringOrNil("kind")?.string
            if kind == "weekly" {
                var seen = Set<Double>()
                var days: [Double] = []
                for v in rule.arr("days") {
                    guard let d = v.finiteNumber, d == d.rounded(), d >= 0, d <= 6, !seen.contains(d) else { continue }
                    seen.insert(d)
                    days.append(d)
                }
                days.sort()
                r["days"] = .array(days.map { .number($0) })
            }
            if kind == "monthly" {
                let raw = rule["day"]
                let day = (raw?.isTruthy == true) ? (raw?.finiteNumber ?? 1) : 1
                r.set("day", Swift.min(31, Swift.max(1, toInt32(day))))
            }
            // already on Today: the rule must not re-place it today if the user takes it off
            if it.truthy("today") { r.set("placed", today) }
            rules[id] = .object(r)
        } else {
            guard let existing = rules[id]?.objectValue, !existing.truthy("deleted") else { return doc }
            var t = JSONObject()
            t.set("id", id)
            t.set("deleted", true)
            t.set("updatedAt", ts)
            rules[id] = .object(t)
        }
        out.rules = rules
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return out
    }

    /// Keep a rule's snapshot in step with its line, after an edit on this device.
    static func refreshRuleSnapshot(_ doc: Doc, _ id: String, at ts: Double = CalendarDates.now()) -> Doc {
        guard let it = doc.items[id]?.objectValue, !it.truthy("deleted"), let r = doc.rule(of: id) else { return doc }
        if r.str("text") == it.str("text"), r.str("note") == it.str("note"), r.str("sectionId") == it.str("sectionId") {
            return doc
        }
        var updated = r
        updated["text"] = .string(it.str("text"))
        updated["note"] = .string(it.str("note"))
        updated["sectionId"] = .string(it.str("sectionId"))
        updated.set("updatedAt", ts)
        var out = doc
        out.rules[id] = .object(updated)
        return out
    }

    /// Take a line off Today until `on` (tomorrow by default). An old client sees an ordinary
    /// "off Today"; the return is what brings it back.
    static func notToday(_ doc: Doc, _ id: String, today: String,
                         at ts: Double = CalendarDates.now(), dates: CalendarDates = CalendarDates()) -> Doc {
        guard let it = doc.items[id]?.objectValue, !it.truthy("deleted") else { return doc }
        var out = doc
        var item = it
        item.set("today", false)
        item.set("updatedAt", ts)
        out.items[id] = .object(item)
        var ret = JSONObject()
        ret.set("id", id)
        ret.set("on", dates.addDays(today, 1))
        ret.set("updatedAt", ts)
        out.returns[id] = .object(ret)
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return out
    }

    /// Undo of notToday: back on Today now, and the return is dropped.
    static func backToday(_ doc: Doc, _ id: String, at ts: Double = CalendarDates.now()) -> Doc {
        guard let it = doc.items[id]?.objectValue, !it.truthy("deleted") else { return doc }
        var out = doc
        var item = it
        item.set("today", true)
        item.set("updatedAt", ts)
        out.items[id] = .object(item)
        if let ret = doc.returns[id]?.objectValue, !ret.truthy("deleted") {
            var t = JSONObject()
            t.set("id", id)
            t.set("deleted", true)
            t.set("updatedAt", ts)
            out.returns[id] = .object(t)
        }
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return out
    }

    /// Delete a line but remember what it said (a v4 tombstone, which shows in Recently deleted).
    static func tombstone(_ it: JSONObject, at ts: Double = CalendarDates.now()) -> JSONObject {
        var t = JSONObject()
        t["id"] = .string(it.str("id"))
        t.set("deleted", true)
        t["text"] = .string(it.str("text"))
        t["note"] = .string(it.str("note"))
        t["sectionId"] = .string(it.str("sectionId"))
        t.set("updatedAt", ts)
        return t
    }

    /// Bring a deleted line back into its section, undone, at the end.
    static func restoreItem(_ doc: Doc, _ id: String, at ts: Double = CalendarDates.now()) -> Doc {
        guard let t = doc.items[id]?.objectValue, t.truthy("deleted") else { return doc }
        let known = Set(doc.liveSections.map(\.idJS))
        let sectionId = known.contains(t.str("sectionId")) ? t.str("sectionId") : JSString("")
        var r = JSONObject()
        r.set("id", id)
        r["sectionId"] = .string(sectionId)
        r["text"] = .string(t.str("text"))
        r["note"] = .string(t.str("note"))
        r.set("done", false)
        r.set("doneAt", 0)
        r.set("today", false)
        r.set("order", lastOrder(doc.itemsInSection(sectionId)) { $0.order })
        r.set("todayOrder", lastOrder(doc.todayItems) { $0.todayOrder })
        r.set("updatedAt", ts)
        var out = doc
        out.items[id] = .object(r)
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return out
    }

    /// A template from a section's live lines (text and note, no state).
    static func templateFromSection(_ doc: Doc, _ sectionId: String, name: String,
                                    id: String = Model.shortId(), at ts: Double = CalendarDates.now()) -> Doc {
        var lines: [JSONValue] = []
        for i in doc.itemsInSection(sectionId) {
            var l = JSONObject()
            l["text"] = .string(i.json.str("text"))
            l["note"] = .string(i.json.str("note"))
            guard !l.str("text").isEmpty else { continue }
            lines.append(.object(l))
            if lines.count == templateLinesMax { break }
        }
        var t = JSONObject()
        t.set("id", id)
        let trimmed = JSText.trim(JSString(name)).prefix(templateNameMax)
        t["name"] = .string(trimmed.isEmpty ? JSString("Template") : trimmed)
        t["lines"] = .array(lines)
        t.set("updatedAt", ts)
        var out = doc
        out.templates[id] = .object(t)
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return out
    }

    /// Insert a template's lines at the end of a section (and on Today when asked).
    static func insertTemplate(_ doc: Doc, _ tpl: JSONObject, sectionId: String = "", today: Bool = false,
                               at ts: Double = CalendarDates.now(),
                               idFn: () -> String = Model.shortId) -> (doc: Doc, ids: [String]) {
        var out = doc
        var items = doc.items
        var order = lastOrder(doc.itemsInSection(sectionId)) { $0.order }
        var todayOrder = lastOrder(doc.todayItems) { $0.todayOrder }
        var ids: [String] = []
        for l in tpl.arr("lines") {
            guard let lo = l.objectValue else { continue }
            let id = idFn()
            ids.append(id)
            var r = JSONObject()
            r.set("id", id)
            r.set("sectionId", sectionId)
            r["text"] = .string(lo.str("text"))
            r["note"] = .string(lo.str("note"))
            r.set("done", false)
            r.set("doneAt", 0)
            r.set("today", today)
            r.set("order", order)
            r.set("todayOrder", todayOrder)
            r.set("updatedAt", ts)
            items[id] = .object(r)
            order += orderStep
            todayOrder += orderStep
        }
        out.items = items
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return (out, ids)
    }

    static func deleteTemplate(_ doc: Doc, _ id: String, at ts: Double = CalendarDates.now()) -> Doc {
        guard let t = doc.templates[id]?.objectValue, !t.truthy("deleted") else { return doc }
        var out = doc
        var tomb = JSONObject()
        tomb.set("id", id)
        tomb.set("deleted", true)
        tomb.set("updatedAt", ts)
        out.templates[id] = .object(tomb)
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return out
    }

    /// Put a section on Today, or take it off. Done lines are left alone.
    static func setSectionToday(_ doc: Doc, _ sectionId: String, _ on: Bool,
                                at ts: Double = CalendarDates.now()) -> Doc {
        var items = doc.items
        var todayOrder = lastOrder(doc.todayItems) { $0.todayOrder }
        var changed = false
        for it in doc.itemsInSection(sectionId) {
            if it.done || it.today == on { continue }
            var r = it.json
            r.set("today", on)
            if on { r.set("todayOrder", todayOrder); todayOrder += orderStep }
            r.set("updatedAt", ts)
            items[it.idJS] = .object(r)
            changed = true
        }
        guard changed else { return doc }
        var out = doc
        out.items = items
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return out
    }

    /// Copy a line (with its rule and return) into `dst` under a new id, and tombstone it in `src`
    /// without text: a moved line is not a deleted one.
    static func moveItem(_ src: Doc, _ dst: Doc, _ id: String,
                         at ts: Double = CalendarDates.now(),
                         idFn: () -> String = Model.shortId) -> (src: Doc, dst: Doc, newId: String)? {
        guard let it = src.items[id]?.objectValue, !it.truthy("deleted") else { return nil }
        let newId = idFn()
        var copy = it
        copy.set("id", newId)
        copy.set("sectionId", "")
        copy.set("order", lastOrder(dst.itemsInSection("")) { $0.order })
        copy.set("todayOrder", lastOrder(dst.todayItems) { $0.todayOrder })
        copy.set("updatedAt", ts)
        var out = dst
        out.items[newId] = .object(copy)
        out.updatedAt = Swift.max(dst.updatedAt, ts)

        let rule = src.rule(of: id)
        if let rule {
            var r = rule
            r.set("id", newId)
            r.set("sectionId", "")
            r.set("updatedAt", ts)
            out.rules[newId] = .object(r)
        }
        let ret = src.returnOf(id)
        if let ret {
            var r = ret
            r.set("id", newId)
            r.set("updatedAt", ts)
            out.returns[newId] = .object(r)
        }

        var srcOut = src
        var bare = JSONObject()
        bare.set("id", id)
        bare.set("deleted", true)
        bare.set("updatedAt", ts)
        srcOut.items[id] = .object(bare)
        srcOut.updatedAt = Swift.max(src.updatedAt, ts)
        if rule != nil {
            var t = JSONObject(); t.set("id", id); t.set("deleted", true); t.set("updatedAt", ts)
            srcOut.rules[id] = .object(t)
        }
        if ret != nil {
            var t = JSONObject(); t.set("id", id); t.set("deleted", true); t.set("updatedAt", ts)
            srcOut.returns[id] = .object(t)
        }
        return (srcOut, out, newId)
    }

    // ---------------------------------------------------------------- export / import

    static let exportFormat = 1

    /// The document without its secret, keys sorted, so the same document always exports to the same
    /// bytes. `JSON.stringify(JSON.parse(canon(body)), null, 2) + "\n"`.
    ///
    /// The parse in the middle is not decoration: canon() sorts keys as strings, and re-parsing then
    /// hands them back in *Object.keys* order, which puts array-index-like keys first in numeric
    /// order. So an item id of "2" comes out before one of "10", the opposite of the sort. Writing
    /// sorted keys straight out would be wrong.
    static func exportJSON(_ doc: Doc, at: Double = CalendarDates.now()) -> String {
        var d = normalize(.object(doc.json))
        d.json.remove("id")
        var body = JSONObject()
        body.set("app", "todays-five")
        body.set("format", exportFormat)
        body.set("exportedAt", at)
        body["doc"] = .object(d.json)
        let sorted = JSONWriter.canon(.object(body))          // canon() never emits a lone surrogate raw
        let reparsed = (try? JSONReader.parse(sorted.string)) ?? .object(body)
        return JSONWriter.pretty(reparsed) + "\n"
    }

    struct ImportError: Error, CustomStringConvertible {
        public let message: String
        public var description: String { message }
    }

    /// Parse an export. Returns the normalized document, without an id: the caller supplies the list.
    static func importJSON(_ text: String, id: String = "") throws -> Doc {
        guard let v = try? JSONReader.parse(text) else { throw ImportError(message: "That file isn't JSON.") }
        var inner: JSONObject? = nil
        if let o = v.objectValue {
            if o.str("app") == "todays-five", let d = o["doc"]?.objectValue {
                inner = d
            } else if o["items"]?.isObject == true {
                inner = o
            }
        }
        guard let inner else { throw ImportError(message: "That file isn't a Today's Five export.") }
        return normalize(.object(inner), id)
    }

    /// The Markdown export. Built over UTF-16, not Swift String: a note can carry half a surrogate
    /// pair (normalize() truncates at 300 code units) and Swift's String would turn it into U+FFFD.
    static func exportMarkdown(_ doc: Doc, today: String) -> JSString {
        var lines: [JSString] = []
        let name = doc.name
        lines.append(JSString("# ").appending(name.isEmpty ? JSString("Today's Five") : name))
        lines.append(JSString(""))
        lines.append(JSString("_Exported " + today + "_"))
        func line(_ i: Item) -> JSString {
            var s = JSString("- [" + (i.done ? "x" : " ") + "] ").appending(i.textJS)
            if i.today { s.append(JSString(" \u{2605}")) }
            if doc.rule(of: i.idJS) != nil { s.append(JSString(" \u{21BB}")) }
            if !i.noteJS.isEmpty {
                s.append(JSString("\n  ").appending(i.noteJS.replacing(JSString("\n"), with: JSString("\n  "))))
            }
            return s
        }
        let t = doc.todayItems
        if !t.isEmpty {
            lines.append(contentsOf: [JSString(""), JSString("## Today"), JSString("")])
            for i in t { lines.append(line(i)) }
        }
        var secs: [(id: JSString, name: JSString)] = [(JSString(""), JSString("Unsorted"))]
        secs.append(contentsOf: doc.sectionsOrdered.map { ($0.idJS, $0.nameJS) })
        for s in secs {
            let items = doc.itemsInSection(s.id)
            if items.isEmpty { continue }
            lines.append(contentsOf: [JSString(""), JSString("## ").appending(s.name), JSString("")])
            for i in items { lines.append(line(i)) }
        }
        let days = doc.historyDays
        if !days.isEmpty {
            lines.append(contentsOf: [JSString(""), JSString("## History")])
            for day in days {
                lines.append(contentsOf: [JSString(""), JSString("### " + day), JSString("")])
                for e in doc.historyEntries(day) {
                    var s = JSString("- ").appending(e.textJS)
                    if !e.sectionJS.isEmpty { s.append(JSString(" \u{00B7} ").appending(e.sectionJS)) }
                    lines.append(s)
                }
            }
        }
        var out = JSString("")
        for (i, l) in lines.enumerated() {
            if i > 0 { out.append(JSString("\n")) }
            out.append(l)
        }
        out.append(JSString("\n"))
        return out
    }

    /// Show the what's-new toast once per version, never on a device that has never held a list.
    static func whatsNewDue(seenVersion: String?, hasLists: Bool, version: String) -> Bool {
        guard let seenVersion, !seenVersion.isEmpty else { return hasLists }
        return seenVersion != version
    }
}
