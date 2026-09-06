// The differential tests: every case in test/fixtures/merge-cases.json.deflate was run through
// model.js by test/tools/gen-merge-cases.mjs, and its answer written down. Here the Swift core
// replays it and compares. A mismatch is a bug in the port until proven otherwise.
//
// The first 120 cases of each kind carry their expected canonical JSON verbatim, so an ordinary
// failure shows the difference; the rest carry a digest (length in UTF-16 code units, then a SHA-256
// prefix). To see any case in full:
//   TZ=America/Chicago node test/tools/gen-merge-cases.mjs --explain sequence 417
import CryptoKit
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("Differential: the web's answers, replayed")
struct DifferentialTests {

    static let fixture: JSONObject = {
        let url = Fixtures.repoRoot.appendingPathComponent("test/fixtures/merge-cases.json.deflate")
        guard let deflated = try? Data(contentsOf: url) else {
            fatalError("missing merge-cases.json.deflate — run `TZ=America/Chicago node test/tools/gen-merge-cases.mjs`")
        }
        guard let json = try? Deflate.decompress(deflated),
              let o = (try? JSONReader.parse(json))?.objectValue else {
            fatalError("merge-cases.json.deflate did not inflate into a JSON object")
        }
        return o
    }()

    static let dates: CalendarDates = {
        let name = fixture.str("timezone").string
        guard let tz = TimeZone(identifier: name) else { fatalError("unknown timezone \(name)") }
        return CalendarDates(timeZone: tz)
    }()

    /// The generator's `answer`: `{ d: "<utf16 length>:<sha256 prefix>" }`, plus `canon` when detailed.
    static func check(_ got: JSString, _ expected: JSONValue?, _ label: @autoclosure () -> String) {
        guard let e = expected?.objectValue else {
            Issue.record("no expected answer for \(label())")
            return
        }
        if let canon = e.stringOrNil("canon") {
            if got != canon {
                Issue.record("\(label()):\n  got  \(got.string)\n  want \(canon.string)")
            }
            return
        }
        let want = e.str("d").string
        let mine = digest(got)
        if mine != want {
            Issue.record("\(label()): digest \(mine) != \(want)\n  got \(got.string.prefix(600))")
        }
    }

    static func digest(_ s: JSString) -> String {
        let hex = SHA256.hash(data: Data(s.string.utf8)).map { String(format: "%02x", $0) }.joined()
        return "\(s.count):\(hex.prefix(32))"
    }

    // ------------------------------------------------------------------ merge

    @Test("merge, normalize, purge and diff on random document pairs")
    func mergeCases() throws {
        let cases = Self.fixture.arr("mergeCases")
        #expect(cases.count >= 1000, "the fixture should carry a thousand-odd pairs")
        for (i, c) in cases.enumerated() {
            let o = try #require(c.objectValue)
            let a = o["a"], b = o["b"]
            Self.check(Model.normalize(a).canon, o["normalizeA"], "merge case \(i): normalize(a)")
            Self.check(Model.normalize(b, "OtherId").canon, o["normalizeB"], "merge case \(i): normalize(b, id)")
            Self.check(Model.merge(a, b).canon, o["mergeAB"], "merge case \(i): merge(a,b)")
            Self.check(Model.merge(b, a).canon, o["mergeBA"], "merge case \(i): merge(b,a)")
            Self.check(Model.merge(a, a).canon, o["mergeAA"], "merge case \(i): merge(a,a)")
            let purged = Model.purgeTombstones(Model.normalize(a), 1_735_000_000_000,
                                               ttl: Model.tombstoneTTL, dates: Self.dates).doc
            Self.check(purged.canon, o["purgeA"], "merge case \(i): purgeTombstones(a)")

            let wantDiff = try #require(o["diffAB"]?.objectValue)
            let gotDiff = Doc.diff(Model.normalize(a), Model.normalize(b))
            for key in Model.collections {
                let want = wantDiff.arr(key).map { $0.jsString?.string ?? "" }
                #expect(gotDiff[key] ?? [] == want, "merge case \(i): diff.\(key)")
            }
        }
    }

    @Test("merge is commutative, associative and idempotent on every fixture document")
    func mergeIsALattice() throws {
        let cases = Self.fixture.arr("mergeCases")
        for (i, c) in cases.prefix(400).enumerated() {
            let o = try #require(c.objectValue)
            let a = Model.normalize(o["a"]), b = Model.normalize(o["b"])
            let ab = Model.merge(a, b)
            #expect(ab.canon == Model.merge(b, a).canon, "commutative at \(i)")
            #expect(Model.merge(ab, b).canon == ab.canon, "absorbing at \(i)")
            #expect(Model.merge(a, a).canon == a.canon, "idempotent at \(i)")
        }
        // associativity needs a third document: pair the cases up
        for i in stride(from: 0, to: min(300, cases.count - 1), by: 2) {
            let x = Model.normalize(cases[i].objectValue?["a"])
            let y = Model.normalize(cases[i].objectValue?["b"])
            let z = Model.normalize(cases[i + 1].objectValue?["a"])
            #expect(Model.merge(Model.merge(x, y), z).canon == Model.merge(x, Model.merge(y, z)).canon,
                    "associative at \(i)")
        }
    }

    // ------------------------------------------------------------------ operation sequences

    @Test("operation sequences step for step")
    func sequenceCases() throws {
        let cases = Self.fixture.arr("sequenceCases")
        #expect(cases.count >= 500)
        var operations = 0
        for (i, c) in cases.enumerated() {
            let o = try #require(c.objectValue)
            var doc = Model.normalize(o["start"], o.str("id").string)
            var dst = Model.normalize(o["startDst"], o.str("dstId").string)
            let steps = o.arr("steps")
            for (k, opValue) in o.arr("ops").enumerated() {
                let op = try #require(opValue.objectValue)
                (doc, dst) = Self.apply(op, doc, dst)
                operations += 1
                let step = try #require(steps[k].objectValue)
                Self.check(doc.canon, step["doc"], "sequence \(i) step \(k) (\(op.str("op").string)): doc")
                Self.check(dst.canon, step["dst"], "sequence \(i) step \(k) (\(op.str("op").string)): dst")
            }
            let today = o.str("today").string
            let q = try #require(o["queries"]?.objectValue)
            func ids(_ key: String) -> [String] { q.arr(key).map { $0.jsString?.string ?? "" } }
            #expect(doc.todayItems.map(\.id) == ids("today"), "sequence \(i): todayItems")
            #expect(doc.itemsInSection("").map(\.id) == ids("unsorted"), "sequence \(i): itemsInSection('')")
            #expect(doc.itemsInSection("s1").map(\.id) == ids("s1"), "sequence \(i): itemsInSection(s1)")
            #expect(doc.sectionsOrdered.map(\.id) == ids("sections"), "sequence \(i): sectionsOrdered")
            #expect(doc.recentlyDeleted.map(\.id) == ids("recentlyDeleted"), "sequence \(i): recentlyDeleted")
            #expect(doc.historyDays == ids("historyDays"), "sequence \(i): historyDays")
            #expect(doc.liveTemplates.map(\.id) == ids("templates"), "sequence \(i): liveTemplates")
            #expect(doc.streak(today, dates: Self.dates) == Int(q.num("streak")), "sequence \(i): streak")
            Self.check(JSString(Model.exportJSON(doc, at: 123)), q["exportJSON"], "sequence \(i): exportJSON")
            Self.check(Model.exportMarkdown(doc, today: today), q["exportMarkdown"], "sequence \(i): exportMarkdown")
        }
        #expect(operations >= 3000, "a few thousand operations, replayed: \(operations)")
    }

    @Test("two lines revived into one section take their order from Object.keys")
    func revivalCollisions() throws {
        for c in Self.fixture.arr("revivalCases") {
            let o = try #require(c.objectValue)
            let doc = Model.normalize(o["doc"], "Revival")
            let rolled = Model.rollover(doc, today: o.str("today").string, at: o.num("ts"), dates: Self.dates)
            let ids = o.arr("ids").map { $0.jsString?.string ?? "" }
            Self.check(rolled.doc.canon, o["rolled"], "revival \(ids)")
        }
    }

    /// The generator's `apply`, in Swift. Anything model.js does through a function goes through the
    /// same function here; the raw edits are spelled out identically on both sides.
    static func apply(_ o: JSONObject, _ docIn: Doc, _ dstIn: Doc) -> (Doc, Doc) {
        var doc = docIn
        let dst = dstIn
        let ts = o.num("ts")
        let id = o.str("id").string

        switch o.str("op").string {
        case "rollover":
            doc = Model.rollover(doc, today: o.str("today").string, at: ts, dates: dates).doc
        case "purge":
            doc = Model.purgeTombstones(doc, o.num("now"), ttl: o.num("ttl"), dates: dates).doc
        case "setRule":
            doc = Model.setRule(doc, id, o["rule"]?.objectValue, at: ts, today: o.str("today").string)
        case "refreshRuleSnapshot":
            doc = Model.refreshRuleSnapshot(doc, id, at: ts)
        case "notToday":
            doc = Model.notToday(doc, id, today: o.str("today").string, at: ts, dates: dates)
        case "backToday":
            doc = Model.backToday(doc, id, at: ts)
        case "tombstoneItem":
            if let it = doc.items[id]?.objectValue, !it.truthy("deleted") {
                doc.items[id] = .object(Model.tombstone(it, at: ts))
                doc.updatedAt = max(doc.updatedAt, ts)
            }
        case "restoreItem":
            doc = Model.restoreItem(doc, id, at: ts)
        case "templateFromSection":
            doc = Model.templateFromSection(doc, o.str("sectionId").string, name: o.str("name").string,
                                            id: id.isEmpty ? o.str("id").string : id, at: ts)
        case "insertTemplate":
            if let tpl = doc.templates[o.str("tplId")]?.objectValue, !tpl.truthy("deleted") {
                var k = 0
                let prefix = o.str("idPrefix").string
                doc = Model.insertTemplate(doc, tpl, sectionId: o.str("sectionId").string,
                                           today: o.truthy("today"), at: ts,
                                           idFn: { k += 1; return prefix + String(k) }).doc
            }
        case "deleteTemplate":
            doc = Model.deleteTemplate(doc, id, at: ts)
        case "setSectionToday":
            doc = Model.setSectionToday(doc, o.str("sectionId").string, o.truthy("on"), at: ts)
        case "moveItem":
            if let r = Model.moveItem(doc, dst, id, at: ts, idFn: { o.str("newId").string }) {
                return (r.src, r.dst)
            }
        case "editText":
            if let it = doc.items[id]?.objectValue, !it.truthy("deleted") {
                var r = it
                r["text"] = o["text"] ?? .string("")
                r.set("updatedAt", ts)
                doc.items[id] = .object(r)
            }
        case "check":
            if let it = doc.items[id]?.objectValue, !it.truthy("deleted") {
                var r = it
                r.set("done", true)
                r.set("doneAt", o.num("doneAt"))
                r.set("updatedAt", ts)
                doc.items[id] = .object(r)
            }
        case "uncheck":
            if let it = doc.items[id]?.objectValue, !it.truthy("deleted") {
                var r = it
                r.set("done", false)
                r.set("doneAt", 0)
                r.set("updatedAt", ts)
                doc.items[id] = .object(r)
            }
        case "setToday":
            if let it = doc.items[id]?.objectValue, !it.truthy("deleted") {
                var r = it
                r.set("today", o.truthy("on"))
                r.set("updatedAt", ts)
                doc.items[id] = .object(r)
            }
        case "deleteSection":
            var t = JSONObject()
            t.set("id", id)
            t.set("deleted", true)
            t.set("updatedAt", ts)
            doc.sections[id] = .object(t)
        case "addItem":
            var r = JSONObject()
            r.set("id", id)
            r["sectionId"] = o["sectionId"] ?? .string("")
            r["text"] = o["text"] ?? .string("")
            r.set("note", "")
            r.set("done", false)
            r.set("doneAt", 0)
            r.set("today", o.truthy("today"))
            r.set("order", o.num("order"))
            r.set("todayOrder", o.num("order"))
            r.set("updatedAt", ts)
            doc.items[id] = .object(r)
        case "mergeWith":
            doc = Model.merge(.object(doc.json), o["doc"])
        default:
            break
        }
        return (doc, dst)
    }
}
