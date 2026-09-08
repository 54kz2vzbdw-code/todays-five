// TodayOps.swift — the three things a wrist does to a list: put a line on Today, cross one off, and
// bring them all back.
//
// They are here rather than in the app because there are now four ways into the first of them — Siri,
// the + in the Watch app, Double Tap, the Action button — plus `tfive add` and the page's own +, and
// six copies of one rule is five chances to write a record the web will not recognise. Every path
// ends in `addToToday`, and after this round there is exactly one add and one check-off in Swift.
//
// The reference for the record is app.js's `applyPendingAdd`: it is the one place the page writes the
// text and the record in a single pass, so the ten fields and their order are read off it rather than
// reconstructed from `newItem` (which writes an empty line) plus `commitEdit` (which fills it in).
import Foundation

public extension Model {

    /// Add a line to Today.
    ///
    /// The text goes through the page's own pipeline, which is `commitEdit`'s: strip the bidi
    /// overrides (1.9 — U+202A–U+202E and U+2066–U+2069 reorder how a line reads without showing, and
    /// on a shared list a reader trusts what they see), trim, collapse runs of whitespace to one
    /// space, and cut at 200 UTF-16 code units. Nothing left to add returns nil, which is
    /// `commitEdit`'s rule too: an empty line is not a line.
    ///
    /// `order` and `todayOrder` are computed over the **undone** lines, as `newItem` does. A done line
    /// keeps its order value while it sinks in the view, so counting it would push every new line past
    /// a number nobody can see.
    static func addToToday(_ doc: Doc, text: String, sectionId: String = "",
                           at ts: Double = CalendarDates.now(),
                           idFn: () -> String = Model.shortId) -> (doc: Doc, id: String)? {
        let clean = JSText.collapseSpaces(JSText.trim(stripBidi(JSString(text)))).prefix(textMax)
        guard !clean.isEmpty else { return nil }

        // A section the list does not have is Unsorted, which is what the page does with an
        // `/add?section=` naming one that is gone.
        let live = doc.sections[sectionId]?.objectValue
        let sec = (!sectionId.isEmpty && !(live?.truthy("deleted") ?? true)) ? JSString(sectionId) : JSString("")

        let id = idFn()
        var r = JSONObject()
        r.set("id", id)
        r["sectionId"] = .string(sec)
        r["text"] = .string(clean)
        r.set("note", "")
        r.set("done", false)
        r.set("doneAt", 0)
        r.set("today", true)
        r.set("order", lastOrder(doc.itemsInSection(sec).filter { !$0.done }) { $0.order })
        r.set("todayOrder", lastOrder(doc.todayItems.filter { !$0.done }) { $0.todayOrder })
        r.set("updatedAt", ts)

        var out = doc
        out.items[id] = .object(r)
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return (out, id)
    }

    /// The check-off. Writes exactly three fields on the item — `done`, `doneAt`, `updatedAt` — and
    /// then `doc.updatedAt`.
    ///
    /// It must **not** touch `today`, `order` or `todayOrder`. The sink is derived — `sortSink` puts
    /// the done lines at the bottom by `doneAt` every time the view is built — so a client that wrote
    /// new `todayOrder` values on a check-off would be pushing an opinion the web never asked for, and
    /// fighting it on every merge. One timestamp for all three fields, so a rollover elsewhere is
    /// recognisable by it.
    ///
    /// A no-op for an unknown or deleted id, and for a line that is already in the state asked for:
    /// re-stamping an unchanged record would win a tie-break against a real edit for no reason.
    static func setDone(_ doc: Doc, _ id: String, _ done: Bool,
                        at ts: Double = CalendarDates.now()) -> Doc {
        guard let it = doc.items[id]?.objectValue, !it.truthy("deleted") else { return doc }
        guard it.truthy("done") != done else { return doc }
        var item = it
        item.set("done", done)
        item.set("doneAt", done ? ts : 0)
        item.set("updatedAt", ts)
        var out = doc
        out.items[id] = .object(item)
        out.updatedAt = Swift.max(doc.updatedAt, ts)
        return out
    }

    /// `startAgain()`: un-done every done line among `ids`, each with its own fresh `updatedAt`.
    ///
    /// The page's own loop reads `M.now()` **inside** it, once per line, so a line's stamp is its own
    /// rather than the batch's. The core steps by a millisecond per line instead of re-reading a
    /// clock, which keeps that property and makes it deterministic: a caller passing one timestamp
    /// gets the same document every time, which is what a test and two devices both need.
    static func startAgain(_ doc: Doc, ids: [String], at ts: Double = CalendarDates.now()) -> Doc {
        var items = doc.items
        var stamp = ts
        var changed = false
        for id in ids {
            guard let it = items[JSString(id)]?.objectValue, !it.truthy("deleted"), it.truthy("done") else { continue }
            var item = it
            item.set("done", false)
            item.set("doneAt", 0)
            item.set("updatedAt", stamp)
            items[JSString(id)] = .object(item)
            stamp += 1
            changed = true
        }
        guard changed else { return doc }
        var out = doc
        out.items = items
        out.updatedAt = Swift.max(doc.updatedAt, stamp - 1)
        return out
    }
}
