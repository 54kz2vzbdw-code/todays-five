// Document.swift — the list document and normalize(), ported from model.js.
//
// COMPATIBILITY.md §3: the shape only grows, and a client must never drop what it does not
// understand. So a record is a JSON object with typed accessors on top, never a struct with stored
// properties — a struct silently discards every key it has no field for, which is the one thing §3
// forbids. normalize() keeps the keys it does not know, on the document, on every record and on
// tombstones, and inserts the keys it does know in model.js's own order, because that order is what
// Object.keys hands back later (rollover's revival step depends on it).
import Foundation

public enum Model {
    public static let docVersion = 3
    public static let templateNameMax = 40
    public static let templateLinesMax = 60
    public static let textMax = 200
    public static let noteMax = 300
    public static let tombstoneTTL: Double = 30 * 24 * 3600 * 1000
    public static let historyDays = 365
    public static let orderStep: Double = 1000

    /// The collections a document carries, in the order they are merged.
    public static let collections = ["sections", "items", "themes", "rules", "returns", "templates"]

    static let docKeys: Set<JSString> = Set(["v", "id", "name", "nameAt", "updatedAt", "history"].map { JSString($0) }
        + collections.map { JSString($0) })
    static let itemKeys: Set<JSString> = Set(["id", "sectionId", "text", "note", "done", "doneAt", "today", "order", "todayOrder", "updatedAt", "deleted"].map { JSString($0) })
    static let sectionKeys: Set<JSString> = Set(["id", "name", "order", "collapsed", "updatedAt", "deleted"].map { JSString($0) })
    static let themeKeys: Set<JSString> = Set(["id", "name", "code", "updatedAt", "deleted"].map { JSString($0) })
    static let ruleKeys: Set<JSString> = Set(["id", "kind", "days", "day", "text", "note", "sectionId", "placed", "updatedAt", "deleted"].map { JSString($0) })
    static let returnKeys: Set<JSString> = Set(["id", "on", "updatedAt", "deleted"].map { JSString($0) })
    static let templateKeys: Set<JSString> = Set(["id", "name", "lines", "updatedAt", "deleted"].map { JSString($0) })

    public static let ruleKinds = ["daily", "weekdays", "weekly", "monthly"]

    public static let seedLines = [
        "Tap or click to cross this off",
        "Add a line of your own",
        "Cross off all three and see"
    ]

    /// `newId(len)` and `shortId()`.
    public static func newId(_ len: Int = 22) -> String { Base62.randomId(len) }
    public static func shortId() -> String { Base62.randomId(10) }
    public static func isListId(_ s: String) -> Bool { isSecret(s) }
}

/// A list document. The JSON is the document; the accessors are a reading of it.
public struct Doc: Sendable, Hashable {
    public var json: JSONObject

    public init(_ json: JSONObject = JSONObject()) { self.json = json }

    public var id: String { json.str("id").string }
    public var name: JSString { json.str("name") }
    public var nameAt: Double { json.num("nameAt") }
    public var updatedAt: Double {
        get { json.num("updatedAt") }
        set { json.set("updatedAt", newValue) }
    }

    public var items: JSONObject {
        get { json.obj("items") }
        set { json["items"] = .object(newValue) }
    }
    public var sections: JSONObject {
        get { json.obj("sections") }
        set { json["sections"] = .object(newValue) }
    }
    public var themes: JSONObject {
        get { json.obj("themes") }
        set { json["themes"] = .object(newValue) }
    }
    public var rules: JSONObject {
        get { json.obj("rules") }
        set { json["rules"] = .object(newValue) }
    }
    public var returns: JSONObject {
        get { json.obj("returns") }
        set { json["returns"] = .object(newValue) }
    }
    public var templates: JSONObject {
        get { json.obj("templates") }
        set { json["templates"] = .object(newValue) }
    }
    public var history: JSONObject {
        get { json.obj("history") }
        set { json["history"] = .object(newValue) }
    }

    public var canon: JSString { JSONWriter.canon(.object(json)) }

    /// `emptyDoc(id, name)` — the keys in the order model.js writes them.
    public static func empty(id: String, name: String = "", at t: Double = CalendarDates.now()) -> Doc {
        var o = JSONObject()
        o.set("v", Model.docVersion)
        o.set("id", id)
        o.set("name", name)
        o.set("nameAt", t)
        o["sections"] = .object(JSONObject())
        o["items"] = .object(JSONObject())
        o["history"] = .object(JSONObject())
        o["themes"] = .object(JSONObject())
        o["rules"] = .object(JSONObject())
        o["returns"] = .object(JSONObject())
        o["templates"] = .object(JSONObject())
        o.set("updatedAt", t)
        return Doc(o)
    }

    /// `seedDoc(id, ts)` — the welcome, live: three lines that are the first list's lines.
    public static func seed(id: String, at ts: Double = CalendarDates.now(), idFn: () -> String = Model.shortId) -> Doc {
        var doc = empty(id: id, at: ts)
        var items = doc.items
        for (i, text) in Model.seedLines.enumerated() {
            let iid = idFn()
            var r = JSONObject()
            r.set("id", iid)
            r.set("sectionId", "")
            r.set("text", text)
            r.set("note", "")
            r.set("done", false)
            r.set("doneAt", 0)
            r.set("today", true)
            r.set("order", Double(i + 1) * Model.orderStep)
            r.set("todayOrder", Double(i + 1) * Model.orderStep)
            r.set("updatedAt", ts)
            items[iid] = .object(r)
        }
        doc.items = items
        return doc
    }
}

// ---------------------------------------------------------------- normalize

public extension Model {
    /// `str(v, max)` — a string cut at `max` **UTF-16 code units**, or "" for anything else.
    static func str(_ v: JSONValue?, _ max: Int) -> JSString {
        guard let s = v?.jsString else { return JSString("") }
        return s.prefix(max)
    }
    /// `num(v, dflt)` — a finite number, or the default.
    static func num(_ v: JSONValue?, _ dflt: Double) -> Double { v?.finiteNumber ?? dflt }

    /// `x | 0`: ToInt32.
    static func toInt32(_ d: Double) -> Double {
        guard d.isFinite else { return 0 }
        let t = d < 0 ? -floor(-d) : floor(d)
        let m = t.truncatingRemainder(dividingBy: 4_294_967_296)
        let u = m < 0 ? m + 4_294_967_296 : m
        return u >= 2_147_483_648 ? u - 4_294_967_296 : u
    }

    /// `normalize(doc, id)` — coerce whatever came out of storage into a well-formed doc. Never throws.
    static func normalize(_ doc: JSONValue?, _ id: String? = nil) -> Doc {
        let d = doc?.objectValue ?? JSONObject()
        let nameValue = d["name"]?.jsString
        var out: Doc
        if let id, !id.isEmpty {
            out = Doc.empty(id: id, at: 0)
        } else if let inner = d["id"], inner.isTruthy {
            // `id || d.id || ""`: whatever the document carried, even if it is not a string
            var base = Doc.empty(id: "", at: 0)
            base.json["id"] = inner
            out = base
        } else {
            out = Doc.empty(id: "", at: 0)
        }
        out.json["name"] = .string(nameValue ?? JSString(""))
        out.json.set("nameAt", num(d["nameAt"], 0))
        out.json.set("updatedAt", num(d["updatedAt"], 0))
        out.json["sections"] = .object(mapOf(d["sections"], normSection))
        out.json["items"] = .object(mapOf(d["items"], normItem))
        out.json["themes"] = .object(mapOf(d["themes"], normTheme))
        out.json["rules"] = .object(mapOf(d["rules"], normRule))
        out.json["returns"] = .object(mapOf(d["returns"], normReturn))
        out.json["templates"] = .object(mapOf(d["templates"], normTemplate))
        out.json.passThrough(from: d, known: docKeys)

        var history = JSONObject()
        if let h = d["history"]?.objectValue {
            for day in h.keys {
                guard CalendarDates.parts(day.string) != nil, let src = h[day]?.arrayValue else { continue }
                var seen = Set<JSString>()
                var list: [JSONObject] = []
                for e in src {
                    guard let eo = e.objectValue, let eid = eo.stringOrNil("id"), !seen.contains(eid) else { continue }
                    seen.insert(eid)
                    var entry = JSONObject()
                    entry["id"] = .string(eid)
                    entry["text"] = .string(str(eo["text"], textMax))
                    entry.set("doneAt", num(eo["doneAt"], 0))
                    entry["section"] = .string(str(eo["section"], 60))
                    list.append(entry)
                }
                list.sort { a, b in
                    let da = a.num("doneAt"), db = b.num("doneAt")
                    if da != db { return da < db }
                    return a.str("id") < b.str("id")
                }
                if !list.isEmpty { history[day] = .array(list.map { .object($0) }) }
            }
        }
        out.json["history"] = .object(history)
        return out
    }

    /// `mapOf(src, norm)` — an array or an object of records, keyed by each record's own id.
    private static func mapOf(_ src: JSONValue?, _ norm: (JSONObject, JSString?) -> JSONObject?) -> JSONObject {
        var out = JSONObject()
        if let a = src?.arrayValue {
            for r in a {
                guard let ro = r.objectValue, let n = norm(ro, nil) else { continue }
                out[n.str("id")] = .object(n)
            }
        } else if let o = src?.objectValue {
            for k in o.keys {
                guard let ro = o[k]?.objectValue, let n = norm(ro, k) else { continue }
                out[n.str("id")] = .object(n)
            }
        }
        return out
    }

    /// The record's own id, or the key it sat under. Empty means the record is dropped.
    private static func recordId(_ r: JSONObject, _ key: JSString?) -> JSString? {
        let id = r.stringOrNil("id") ?? key ?? JSString("")
        return id.isEmpty ? nil : id
    }

    private static func normItem(_ r: JSONObject, _ key: JSString?) -> JSONObject? {
        guard let id = recordId(r, key) else { return nil }
        if r.truthy("deleted") {
            // a tombstone that remembers its line (v4) shows in Recently deleted; a bare one does not
            var t = JSONObject()
            t["id"] = .string(id)
            t.set("deleted", true)
            t.set("updatedAt", num(r["updatedAt"], 0))
            if let text = r.stringOrNil("text"), !text.isEmpty {
                t["text"] = .string(str(.string(text), textMax))
                t["note"] = .string(str(r["note"], noteMax))
                t["sectionId"] = .string(r.stringOrNil("sectionId") ?? JSString(""))
            }
            t.passThrough(from: r, known: itemKeys)
            return t
        }
        var o = JSONObject()
        o["id"] = .string(id)
        o["sectionId"] = .string(r.stringOrNil("sectionId") ?? JSString(""))
        o["text"] = .string(str(r["text"], textMax))
        o["note"] = .string(str(r["note"], noteMax))
        let done = r.truthy("done")
        o.set("done", done)
        o.set("doneAt", done ? num(r["doneAt"], 0) : 0)
        o.set("today", r.truthy("today"))
        o.set("order", num(r["order"], 0))
        o.set("todayOrder", num(r["todayOrder"], num(r["order"], 0)))
        o.set("updatedAt", num(r["updatedAt"], 0))
        o.passThrough(from: r, known: itemKeys)
        return o
    }

    private static func normSection(_ r: JSONObject, _ key: JSString?) -> JSONObject? {
        guard let id = recordId(r, key) else { return nil }
        if r.truthy("deleted") { return tombstone(id: id, r: r, known: sectionKeys) }
        var o = JSONObject()
        o["id"] = .string(id)
        o["name"] = .string(str(r["name"], 60))
        o.set("order", num(r["order"], 0))
        o.set("collapsed", r.truthy("collapsed"))
        o.set("updatedAt", num(r["updatedAt"], 0))
        o.passThrough(from: r, known: sectionKeys)
        return o
    }

    private static func normTheme(_ r: JSONObject, _ key: JSString?) -> JSONObject? {
        guard let id = recordId(r, key) else { return nil }
        if r.truthy("deleted") { return tombstone(id: id, r: r, known: themeKeys) }
        var o = JSONObject()
        o["id"] = .string(id)
        o["name"] = .string(str(r["name"], 40))
        o["code"] = .string(str(r["code"], 120))
        o.set("updatedAt", num(r["updatedAt"], 0))
        o.passThrough(from: r, known: themeKeys)
        return o
    }

    /// A recurrence rule, keyed by the item it belongs to, carrying a snapshot of the line.
    private static func normRule(_ r: JSONObject, _ key: JSString?) -> JSONObject? {
        guard let id = recordId(r, key) else { return nil }
        if r.truthy("deleted") { return tombstone(id: id, r: r, known: ruleKeys) }
        let kindValue = r.stringOrNil("kind")?.string ?? ""
        let kind = ruleKinds.contains(kindValue) ? kindValue : "daily"
        var o = JSONObject()
        o["id"] = .string(id)
        o.set("kind", kind)
        o["text"] = .string(str(r["text"], textMax))
        o["note"] = .string(str(r["note"], noteMax))
        o["sectionId"] = .string(r.stringOrNil("sectionId") ?? JSString(""))
        o.set("updatedAt", num(r["updatedAt"], 0))
        if kind == "weekly" {
            var seen = Set<Double>()
            var days: [Double] = []
            for v in r.arr("days") {
                guard let d = v.finiteNumber, d == d.rounded(), d >= 0, d <= 6, !seen.contains(d) else { continue }
                seen.insert(d)
                days.append(d)
            }
            days.sort()                                     // single digits: string sort is numeric sort
            o["days"] = .array(days.map { .number($0) })
        }
        if kind == "monthly" {
            o.set("day", Swift.min(31, Swift.max(1, toInt32(num(r["day"], 1)))))
        }
        if let placed = r.stringOrNil("placed"), CalendarDates.parts(placed.string) != nil {
            o["placed"] = .string(placed)                   // the date the rule last put its line on Today
        }
        o.passThrough(from: r, known: ruleKeys)
        return o
    }

    /// "Not today": the line is off Today until `on`. A return with no valid date is not a return.
    private static func normReturn(_ r: JSONObject, _ key: JSString?) -> JSONObject? {
        guard let id = recordId(r, key) else { return nil }
        if r.truthy("deleted") { return tombstone(id: id, r: r, known: returnKeys) }
        guard let on = r.stringOrNil("on"), CalendarDates.parts(on.string) != nil else { return nil }
        var o = JSONObject()
        o["id"] = .string(id)
        o["on"] = .string(on)
        o.set("updatedAt", num(r["updatedAt"], 0))
        o.passThrough(from: r, known: returnKeys)
        return o
    }

    private static func normTemplate(_ r: JSONObject, _ key: JSString?) -> JSONObject? {
        guard let id = recordId(r, key) else { return nil }
        if r.truthy("deleted") { return tombstone(id: id, r: r, known: templateKeys) }
        var lines: [JSONValue] = []
        for l in r.arr("lines") {
            guard let lo = l.objectValue else { continue }
            var line = JSONObject()
            line["text"] = .string(str(lo["text"], textMax))
            line["note"] = .string(str(lo["note"], noteMax))
            guard !line.str("text").isEmpty else { continue }
            lines.append(.object(line))
            if lines.count == templateLinesMax { break }
        }
        var o = JSONObject()
        o["id"] = .string(id)
        o["name"] = .string(str(r["name"], templateNameMax))
        o["lines"] = .array(lines)
        o.set("updatedAt", num(r["updatedAt"], 0))
        o.passThrough(from: r, known: templateKeys)
        return o
    }

    private static func tombstone(id: JSString, r: JSONObject, known: Set<JSString>) -> JSONObject {
        var o = JSONObject()
        o["id"] = .string(id)
        o.set("deleted", true)
        o.set("updatedAt", num(r["updatedAt"], 0))
        o.passThrough(from: r, known: known)
        return o
    }
}
