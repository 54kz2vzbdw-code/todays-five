// Merge.swift — merge(), the tie-break, and purgeTombstones(), ported from model.js.
//
// Per record, last writer wins by updatedAt. Ties: a tombstone beats a live record; then the record
// that carries more (the longer canonical JSON) wins, so a field an old client stripped is restored
// by the next merge; then the lexically larger. A total order, so merge(a,b) === merge(b,a), it is
// associative, and merging twice changes nothing.
//
// "Longer" is measured in UTF-16 code units and "larger" is by code unit, because that is what
// String.prototype.length and JavaScript's >= mean. COMPATIBILITY.md §3.
import Foundation

public extension Model {

    static func canon(_ v: JSONValue) -> JSString { JSONWriter.canon(v) }
    static func canon(_ o: JSONObject) -> JSString { JSONWriter.canon(.object(o)) }
    static func docEquals(_ a: Doc, _ b: Doc) -> Bool { a.canon == b.canon }

    static func pickRecord(_ x: JSONObject?, _ y: JSONObject?) -> JSONObject? {
        guard let x else { return y }
        guard let y else { return x }
        // `x.updatedAt || 0`: a falsy stamp is zero
        let tx = x["updatedAt"]?.isTruthy == true ? x.num("updatedAt") : 0
        let ty = y["updatedAt"]?.isTruthy == true ? y.num("updatedAt") : 0
        if tx != ty { return tx > ty ? x : y }
        let dx = x.truthy("deleted"), dy = y.truthy("deleted")
        if dx != dy { return dx ? x : y }
        let cx = canon(x), cy = canon(y)
        if cx.count != cy.count { return cx.count > cy.count ? x : y }
        return cx >= cy ? x : y
    }

    static func mergeMap(_ a: JSONObject, _ b: JSONObject) -> JSONObject {
        var out = JSONObject()
        var keys: [JSString] = []
        var seen = Set<JSString>()
        for k in a.keys where !seen.contains(k) { seen.insert(k); keys.append(k) }
        for k in b.keys where !seen.contains(k) { seen.insert(k); keys.append(k) }
        for k in keys {
            if let picked = pickRecord(a[k]?.objectValue, b[k]?.objectValue) {
                out[k] = .object(picked)
            } else {
                out[k] = a[k] ?? b[k]           // neither side held an object: keep what there was
            }
        }
        return out
    }

    static func mergeHistory(_ a: JSONObject, _ b: JSONObject) -> JSONObject {
        var out = JSONObject()
        var days: [JSString] = []
        var seenDays = Set<JSString>()
        for k in a.keys where !seenDays.contains(k) { seenDays.insert(k); days.append(k) }
        for k in b.keys where !seenDays.contains(k) { seenDays.insert(k); days.append(k) }
        for day in days {
            var order: [JSString] = []
            var seen: [JSString: JSONObject] = [:]
            for src in [a[day], b[day]] {
                guard let list = src?.arrayValue else { continue }
                for e in list {
                    guard let eo = e.objectValue, eo["id"]?.isTruthy == true else { continue }
                    let id = eo.str("id")
                    guard let cur = seen[id] else {
                        seen[id] = eo
                        order.append(id)
                        continue
                    }
                    // the same item recorded twice for one day: the later doneAt, then the canonical max
                    let ed = eo.num("doneAt"), cd = cur.num("doneAt")
                    if ed > cd || (ed == cd && canon(eo) > canon(cur)) { seen[id] = eo }
                }
            }
            var list = order.map { seen[$0]! }
            list.sort { x, y in
                let dx = x.num("doneAt"), dy = y.num("doneAt")
                if dx != dy { return dx < dy }
                return x.str("id") < y.str("id")
            }
            if !list.isEmpty { out[day] = .array(list.map { .object($0) }) }
        }
        return out
    }

    static func merge(_ rawA: JSONValue?, _ rawB: JSONValue?) -> Doc {
        let a = normalize(rawA), b = normalize(rawB)
        let sameNameAt = a.nameAt == b.nameAt
        let nameWinner: Doc = sameNameAt ? (a.name >= b.name ? a : b) : (a.nameAt > b.nameAt ? a : b)

        var o = JSONObject()
        o.set("v", docVersion)
        o["id"] = a.json["id"]?.isTruthy == true ? a.json["id"] : b.json["id"]
        o["name"] = .string(nameWinner.name)
        o.set("nameAt", nameWinner.nameAt)
        o["sections"] = .object(mergeMap(a.sections, b.sections))
        o["items"] = .object(mergeMap(a.items, b.items))
        o["history"] = .object(mergeHistory(a.history, b.history))
        o["themes"] = .object(mergeMap(a.themes, b.themes))
        o["rules"] = .object(mergeMap(a.rules, b.rules))
        o["returns"] = .object(mergeMap(a.returns, b.returns))
        o["templates"] = .object(mergeMap(a.templates, b.templates))
        o.set("updatedAt", Swift.max(a.updatedAt, b.updatedAt))
        // 1.9: the home zone merges by the larger string — the very rule a client that has never heard
        // of it applies below, so 1.8 and 1.9 agree on the answer
        let za = a.json["zone"], zb = b.json["zone"]
        if za != nil || zb != nil {
            if za == nil { o["zone"] = zb }
            else if zb == nil { o["zone"] = za }
            else { o["zone"] = canon(za!) >= canon(zb!) ? za : zb }
        }

        // keys neither side of this code knows: keep the larger canonical value so both sides agree
        var seen = Set<JSString>()
        var unknown: [JSString] = []
        for k in a.json.keys where !docKeys.contains(k) && !seen.contains(k) { seen.insert(k); unknown.append(k) }
        for k in b.json.keys where !docKeys.contains(k) && !seen.contains(k) { seen.insert(k); unknown.append(k) }
        for k in unknown {
            let va = a.json[k], vb = b.json[k]
            if va == nil { o[k] = vb }
            else if vb == nil { o[k] = va }
            else { o[k] = canon(va!) >= canon(vb!) ? va : vb }
        }
        return Doc(o)
    }

    static func merge(_ a: Doc, _ b: Doc) -> Doc { merge(.object(a.json), .object(b.json)) }

    /// `purgeTombstones(doc, now, ttl)` — tombstones past their TTL and history past a year go, and a
    /// rule or return whose line is long gone is an orphan. Reports whether anything changed, which is
    /// what model.js says by returning the same object.
    static func purgeTombstones(_ doc: Doc, _ nowTs: Double = CalendarDates.now(),
                                ttl: Double = Model.tombstoneTTL,
                                dates: CalendarDates = CalendarDates()) -> (doc: Doc, changed: Bool) {
        var changed = false
        var out = doc
        let cutoff = JSString(dates.localDate(nowTs - Double(historyDays) * 24 * 3600 * 1000))
        var hist = JSONObject()
        for day in doc.history.keys {
            if day >= cutoff { hist[day] = doc.history[day] } else { changed = true }
        }
        out.json["history"] = .object(hist)
        for key in collections {
            let m = doc.json.obj(key)
            var kept = JSONObject()
            for id in m.keys {
                guard let r = m[id]?.objectValue else { kept[id] = m[id]; continue }
                if r.truthy("deleted") {
                    let stamp = r["updatedAt"]?.isTruthy == true ? r.num("updatedAt") : 0
                    if nowTs - stamp > ttl { changed = true; continue }
                } else if key == "rules" || key == "returns" {
                    // 1.7: against the items kept in *this* pass, so a second pass is a no-op
                    if out.items[id] == nil { changed = true; continue }
                }
                kept[id] = .object(r)
            }
            out.json[key] = .object(kept)
        }
        return changed ? (out, true) : (doc, false)
    }
}
