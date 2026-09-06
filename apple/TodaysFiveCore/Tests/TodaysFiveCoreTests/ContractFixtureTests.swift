// test/fixtures/merge/*.json — the golden cases the web writes for exactly this purpose.
// tools/merge-fixtures.js says so: "language-neutral golden cases for merge, normalize and rollover,
// so another implementation of the document (the Swift core that comes next) can prove it agrees with
// this one byte for byte", and COMPATIBILITY.md §3 points at them. test/compat.test.js replays them
// on the JavaScript side; this replays the same files here, and the two must agree.
//
// Every case names its inputs in full — no clock, no random id, no device zone: `today` and `ts` are
// given — so nothing about the machine running the test can change the answer.
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("The contract's own merge fixtures")
struct ContractFixtureTests {

    static let files: [(name: String, json: JSONObject)] = {
        let dir = Fixtures.repoRoot.appendingPathComponent("test/fixtures/merge")
        let names = ((try? FileManager.default.contentsOfDirectory(atPath: dir.path)) ?? [])
            .filter { $0.hasSuffix(".json") }.sorted()
        return names.compactMap { name in
            guard let data = try? Data(contentsOf: dir.appendingPathComponent(name)),
                  let o = (try? JSONReader.parse(data))?.objectValue else { return nil }
            return (name, o)
        }
    }()

    @Test("every case replays byte for byte")
    func replay() throws {
        #expect(Self.files.count >= 4, "the fixtures are there: \(Self.files.map(\.name))")
        var cases = 0
        for (name, fixture) in Self.files {
            let op = fixture.str("op").string
            for c in fixture.arr("cases") {
                let o = try #require(c.objectValue)
                let label = "\(name): \(o.str("name").string)"
                let got: Doc
                switch op {
                case "merge":
                    got = Model.merge(o["a"], o["b"])
                case "rollover":
                    let doc = try #require(o["doc"]?.objectValue)
                    let normalized = Model.normalize(.object(doc), doc.str("id").string)
                    // a list without a home zone rolls on the device's clock, so the case says which
                    // zone its expectation was written in — and here that zone can simply be used
                    got = Model.rollover(normalized, today: o.str("today").string, at: o.num("ts"),
                                         dates: Self.dates(o.str("deviceZone").string)).doc
                case "normalize":
                    got = Model.normalize(o["doc"], o.str("id").string)
                default:
                    Issue.record("unknown op \(op) in \(name)")
                    continue
                }
                let want = JSONWriter.canon(try #require(o["expect"]))
                if got.canon != want {
                    Issue.record("\(label):\n  got  \(got.canon.string)\n  want \(want.string)")
                }
                cases += 1
            }
        }
        #expect(cases >= 12, "\(cases) cases replayed")
    }

    /// The zone a case names, or this machine's when it names none.
    static func dates(_ zone: String) -> CalendarDates {
        guard let tz = TimeZone(identifier: zone) else { return CalendarDates() }
        return CalendarDates(timeZone: tz)
    }

    @Test("a list with a home zone rolls the same in every device zone; one without does not")
    func homeZoneIsWhatMakesItZoneIndependent() throws {
        var zonedCases = 0, unzonedDiffered = 0
        for (name, fixture) in Self.files where fixture.str("op") == "rollover" {
            for c in fixture.arr("cases") {
                let o = try #require(c.objectValue)
                let doc = try #require(o["doc"]?.objectValue)
                let normalized = Model.normalize(.object(doc), doc.str("id").string)
                let want = JSONWriter.canon(try #require(o["expect"]))
                var answers = Set<JSString>()
                for zone in ["Asia/Tokyo", "America/Chicago", "UTC", "Pacific/Kiritimati", "Pacific/Niue"] {
                    let got = Model.rollover(normalized, today: o.str("today").string, at: o.num("ts"),
                                             dates: Self.dates(zone)).doc
                    answers.insert(got.canon)
                    if !normalized.json.str("zone").isEmpty {
                        #expect(got.canon == want, "\(name) \(o.str("name").string) in \(zone)")
                    }
                }
                if normalized.json.str("zone").isEmpty {
                    if answers.count > 1 { unzonedDiffered += 1 }
                } else {
                    zonedCases += 1
                    #expect(answers.count == 1, "\(name) \(o.str("name").string): the home zone settles it")
                }
            }
        }
        #expect(zonedCases >= 8, "\(zonedCases) zoned rollover cases")
        #expect(unzonedDiffered >= 1,
                "at least one guard case really does turn on the device's clock — which is why the fixture names it")
    }

    // ---------------------------------------------------------------- the zone, in its own right

    @Test("the home zone decides the day, and is kept even when this platform cannot compute in it")
    func homeZone() throws {
        // Chicago crosses a line off at breakfast; Tokyo's clock already says tomorrow
        let doneAt = 1_788_615_000_000.0                      // 2026-09-05 13:30 UTC = 08:30 Chicago
        var chicago = Doc.empty(id: "L", at: 0)
        chicago.json.set("zone", "America/Chicago")
        chicago.items["a"] = .object(ModelTests.item("a", [("done", .bool(true)), ("doneAt", .number(doneAt)), ("updatedAt", .number(doneAt))]))
        let tokyo = CalendarDates(timeZone: TimeZone(identifier: "Asia/Tokyo")!)
        #expect(tokyo.dayOf(chicago, doneAt) == "2026-09-05", "the day is the home zone's, not the device's")
        #expect(tokyo.todayFor(chicago, doneAt + 2 * 3600 * 1000) == "2026-09-05",
                "still the 5th at home while Tokyo says the 6th")

        // a zone the platform does not know is kept on the document and simply not used
        var martian = Doc.empty(id: "L", at: 0)
        martian.json.set("zone", "Mars/Olympus")
        let normalized = Model.normalize(.object(martian.json), "L")
        #expect(normalized.json.str("zone") == "Mars/Olympus", "kept as written")
        #expect(CalendarDates.zoneOf(normalized) == "", "and not used")
        #expect(CalendarDates.isZone("America/Chicago"))
        #expect(CalendarDates.isZone("UTC"))
        #expect(!CalendarDates.isZone("Mars/Olympus"))
        #expect(!CalendarDates.isZone("America/Chicago; DROP"))
        #expect(!CalendarDates.isZone(""))
        #expect(CalendarDates.isZone(CalendarDates.deviceZone()) || CalendarDates.deviceZone().isEmpty)

        // withZone stamps a list that has none and leaves one that has
        let stamped = CalendarDates.withZone(Doc.empty(id: "L", at: 0), "Asia/Tokyo")
        #expect(stamped.json.str("zone") == "Asia/Tokyo")
        #expect(CalendarDates.withZone(stamped, "America/Chicago").json.str("zone") == "Asia/Tokyo")
    }

    @Test("without a home zone, a line finished under six hours ago is never rolled")
    func rollGuard() throws {
        let doneAt = 1_788_615_000_000.0
        var doc = Doc.empty(id: "L", at: 0)
        doc.items["a"] = .object(ModelTests.item("a", [("done", .bool(true)), ("doneAt", .number(doneAt)), ("updatedAt", .number(doneAt))]))
        let tokyo = CalendarDates(timeZone: TimeZone(identifier: "Asia/Tokyo")!)

        // two hours later, Tokyo is already on the 6th and would otherwise file it under the 5th
        let held = Model.rollover(doc, today: "2026-09-06", at: doneAt + 2 * 3600 * 1000, dates: tokyo)
        #expect(held.changed == false, "the guard held it")
        // past six hours it rolls, as 1.8 did
        let rolled = Model.rollover(doc, today: "2026-09-06", at: doneAt + Model.rollGuardMs + 60_000, dates: tokyo)
        #expect(rolled.changed)
        #expect(rolled.doc.items["a"]?.objectValue?.truthy("deleted") == true)
        #expect(rolled.doc.historyEntries("2026-09-05").count == 1)

        // with a home zone there is no guard: the zone already settled which day it was
        var zoned = doc
        zoned.json.set("zone", "America/Chicago")
        let zonedRoll = Model.rollover(zoned, today: "2026-09-06", at: doneAt + 2 * 3600 * 1000, dates: tokyo)
        #expect(zonedRoll.changed, "the home zone says the day is over, so it rolls")
    }

    @Test("bidi overrides are stripped where text enters, never on read")
    func bidi() throws {
        let sneaky = "Pay \u{202E}alice\u{202C} 100"
        #expect(Model.stripBidi(JSString(sneaky)).string == "Pay alice 100")
        #expect(Model.stripBidi(JSString("\u{2066}x\u{2069}")).string == "x")
        #expect(Model.stripBidi(JSString("plain")).string == "plain")

        var doc = Doc.empty(id: "L", name: sneaky, at: 0)
        doc.items["a"] = .object(ModelTests.item("a", [("text", .string(sneaky)), ("note", .string(sneaky))]))
        var section = JSONObject()
        section.set("id", "s"); section.set("name", sneaky); section.set("order", 1)
        section.set("collapsed", false); section.set("updatedAt", 1)
        doc.sections["s"] = .object(section)

        // read: untouched, so a document already holding them is not rewritten on every open
        let read = Model.normalize(.object(doc.json), "L")
        #expect(read.items["a"]?.objectValue?.str("text").string.contains("\u{202E}") == true)

        // in: stripped
        let imported = try Model.importJSON(Model.exportJSON(doc, at: 1), id: "L")
        #expect(imported.name.string == "Pay alice 100")
        #expect(imported.items["a"]?.objectValue?.str("text").string == "Pay alice 100")
        #expect(imported.items["a"]?.objectValue?.str("note").string == "Pay alice 100")
        #expect(imported.sections["s"]?.objectValue?.str("name").string == "Pay alice 100")
    }

    @Test("a line filed under another section of the same list keeps its Today place")
    func moveToSection() throws {
        var doc = Doc.empty(id: "L", at: 0)
        var s = JSONObject()
        s.set("id", "s"); s.set("name", "Work"); s.set("order", 1000); s.set("collapsed", false); s.set("updatedAt", 1)
        doc.sections["s"] = .object(s)
        doc.items["a"] = .object(ModelTests.item("a", [("today", .bool(true)), ("todayOrder", .number(2500))]))
        doc.items["z"] = .object(ModelTests.item("z", [("sectionId", .string("s")), ("order", .number(7000))]))
        var rule = JSONObject(); rule.set("kind", "daily")
        doc = Model.setRule(doc, "a", rule, at: 10, today: "2026-09-01")

        let moved = Model.moveToSection(doc, "a", "s", at: 50)
        let a = try #require(moved.items["a"]?.objectValue)
        #expect(a.str("sectionId") == "s")
        #expect(a.num("order") > 7000, "at the end of its new section")
        #expect(a.truthy("today") == true && a.num("todayOrder") == 2500, "its Today place is untouched")
        #expect(moved.rules["a"]?.objectValue?.str("sectionId") == "s", "the rule's snapshot follows")
        #expect(Model.moveToSection(moved, "a", "s", at: 60).canon == moved.canon, "already there: unchanged")
        #expect(Model.moveToSection(moved, "a", "nosuch", at: 70).items["a"]?.objectValue?.str("sectionId") == "",
                "an unknown section is Unsorted")
        #expect(Model.moveToSection(doc, "nope", "s", at: 80).canon == doc.canon)
    }

    @Test("a moved line can be sent to a named section of the target list")
    func moveItemIntoASection() throws {
        var src = Doc.empty(id: "A", at: 0), dst = Doc.empty(id: "B", at: 0)
        src.items["a"] = .object(ModelTests.item("a", [("text", .string("Take me"))]))
        var s = JSONObject()
        s.set("id", "home"); s.set("name", "Home"); s.set("order", 1); s.set("collapsed", false); s.set("updatedAt", 1)
        dst.sections["home"] = .object(s)
        var rule = JSONObject(); rule.set("kind", "daily")
        src = Model.setRule(src, "a", rule, at: 1, today: "2026-09-01")

        let r = try #require(Model.moveItem(src, dst, "a", at: 100, idFn: { "fresh" }, sectionId: "home"))
        #expect(r.dst.items["fresh"]?.objectValue?.str("sectionId") == "home")
        #expect(r.dst.rules["fresh"]?.objectValue?.str("sectionId") == "home")
        let unknown = try #require(Model.moveItem(src, dst, "a", at: 100, idFn: { "fresh" }, sectionId: "nosuch"))
        #expect(unknown.dst.items["fresh"]?.objectValue?.str("sectionId") == "", "an unknown section is Unsorted")
    }

    @Test("the losing side of a simultaneous edit is reported, once, inside the window")
    func lostEdits() throws {
        var prev = Doc.empty(id: "L", at: 0)
        prev.items["a"] = .object(ModelTests.item("a", [("text", .string("mine")), ("note", .string(""))]))
        var next = prev
        var theirs = try #require(next.items["a"]?.objectValue)
        theirs.set("text", "theirs")
        next.items["a"] = .object(theirs)

        let recent = [(id: "a", edit: Model.RecentEdit(text: "mine", note: "", at: 1000))]
        let lost = Model.lostEdits(prev, next, recent, at: 1500)
        #expect(lost.count == 1)
        #expect(lost.first?.text == "mine")
        #expect(lost.first?.theirsText == "theirs")

        #expect(Model.lostEdits(prev, next, recent, at: 1000 + Model.lostEditMs + 1).isEmpty, "past the window")
        #expect(Model.lostEdits(prev, prev, recent, at: 1500).isEmpty, "nothing changed")
        let notMine = [(id: "a", edit: Model.RecentEdit(text: "someone else's", note: "", at: 1000))]
        #expect(Model.lostEdits(prev, next, notMine, at: 1500).isEmpty, "those were not this device's words")
    }

    @Test("the envelope cap is measured the way the server measures the row")
    func envelopeCap() throws {
        let keys = try Keys.fromWrite(Model.newId())
        let doc = Doc.seed(id: keys.id)
        let bytes = try Crypto.envelopeBytes(key: keys.key, document: doc.json)
        #expect(bytes > 0 && bytes < Crypto.envelopeCap)
        #expect(Crypto.envelopeCap == 96 * 1024)
        var wire = doc.json
        wire.remove("id")                                  // envelopeBytes measures what a push sends
        let env = try Crypto.seal(key: keys.key, document: wire)
        #expect(bytes == env.byteCount + 2 * env.json.count,
                "jsonb spaces its keys, so the row's text is two characters longer per key")
    }
}
