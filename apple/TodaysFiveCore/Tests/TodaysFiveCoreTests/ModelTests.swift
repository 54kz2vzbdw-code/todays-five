// The rollover and model cases from test/model.test.js and test/features.test.js, ported one to one.
// The differential suite covers far more ground, but a named test says what broke and a fuzz case
// does not — and these are the rules COMPATIBILITY.md §3 spells out in prose.
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("The document: normalize, merge, rollover")
struct ModelTests {

    static let dates = CalendarDates(timeZone: TimeZone(identifier: "America/Chicago")!)

    /// `at(s)` — the local wall-clock time the Node tests use, in the fixture's zone.
    static func at(_ s: String) -> Double {
        var f = DateFormatter()
        f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        f.timeZone = dates.timeZone
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.date(from: s)!.timeIntervalSince1970 * 1000
    }

    /// The `item(id, over)` helper both Node suites use.
    static func item(_ id: String, _ over: [(String, JSONValue)] = []) -> JSONObject {
        var o = JSONObject()
        o.set("id", id)
        o.set("sectionId", "")
        o.set("text", "t-" + id)
        o.set("note", "")
        o.set("done", false)
        o.set("doneAt", 0)
        o.set("today", true)
        o.set("order", 1000)
        o.set("todayOrder", 1000)
        o.set("updatedAt", 1000)
        for (k, v) in over { o[k] = v }
        return o
    }

    static func doc(_ id: String = "L", name: String = "") -> Doc {
        Doc.empty(id: id, name: name, at: 0)
    }

    // ---------------------------------------------------------------- normalize and merge

    @Test("normalize: junk in, well-formed doc out")
    func normalizeJunk() throws {
        let json = #"{"items":[{"id":"a","text":5,"done":"yes"},null,{"id":"b","deleted":true,"updatedAt":3}],"history":{"2026-01-01":[{"id":"x","doneAt":1},{"id":"x"},7]}}"#
        let d = Model.normalize(try JSONReader.parse(json), "L")
        #expect(d.id == "L")
        #expect(d.items["a"]?.objectValue?.str("text") == "")
        #expect(d.items["a"]?.objectValue?.truthy("done") == true)
        let b = try #require(d.items["b"]?.objectValue)
        #expect(JSONWriter.canon(.object(b)) == #"{"deleted":true,"id":"b","updatedAt":3}"#)
        #expect(d.historyEntries("2026-01-01").count == 1)
    }

    @Test("normalize keeps unknown keys on the document, on records and on tombstones")
    func normalizeKeepsTheFuture() throws {
        let json = """
        {"items":{"a":{"id":"a","text":"t","extra":[1,2]},"t":{"id":"t","deleted":true,"updatedAt":3,"why":"later"}},
         "sections":{"s":{"id":"s","name":"S","order":1,"collapsed":false,"updatedAt":1,"colour":"red"}},
         "rules":{"a":{"id":"a","kind":"daily","updatedAt":1,"every":2}},
         "mystery":{"k":{"id":"k","updatedAt":9}},"flag":true}
        """
        let d = Model.normalize(try JSONReader.parse(json), "L")
        #expect(JSONWriter.canon(try #require(d.items["a"]?.objectValue?["extra"])) == "[1,2]")
        #expect(d.items["t"]?.objectValue?.str("why") == "later")
        #expect(d.sections["s"]?.objectValue?.str("colour") == "red")
        #expect(d.rules["a"]?.objectValue?.num("every") == 2)
        #expect(JSONWriter.canon(try #require(d.json["mystery"])) == #"{"k":{"id":"k","updatedAt":9}}"#)
        #expect(d.json["flag"]?.isTruthy == true)

        let m = Model.merge(d, Self.doc())
        #expect(JSONWriter.canon(try #require(m.items["a"]?.objectValue?["extra"])) == "[1,2]")
        #expect(JSONWriter.canon(try #require(m.json["mystery"])) == JSONWriter.canon(try #require(d.json["mystery"])))
        #expect(m.json["flag"]?.isTruthy == true)
        #expect(Model.normalize(.object(d.json)).canon == d.canon, "normalize is idempotent with unknown keys")
    }

    @Test("merge: last writer wins per item")
    func mergeLastWriterWins() {
        var a = Self.doc(); a.items["x"] = .object(Self.item("x", [("text", .string("old")), ("updatedAt", .number(10))]))
        var b = Self.doc(); b.items["x"] = .object(Self.item("x", [("text", .string("new")), ("updatedAt", .number(20))]))
        #expect(Model.merge(a, b).items["x"]?.objectValue?.str("text") == "new")
        #expect(Model.merge(b, a).items["x"]?.objectValue?.str("text") == "new")
    }

    @Test("merge: tombstones win ties and survive against older edits")
    func mergeTombstonesWinTies() {
        var a = Self.doc(); a.items["x"] = .object(Self.item("x", [("updatedAt", .number(10))]))
        var tomb = JSONObject(); tomb.set("id", "x"); tomb.set("deleted", true); tomb.set("updatedAt", 10)
        var b = Self.doc(); b.items["x"] = .object(tomb)
        #expect(Model.merge(a, b).items["x"]?.objectValue?.truthy("deleted") == true)
        #expect(Model.merge(b, a).items["x"]?.objectValue?.truthy("deleted") == true)
        var c = Self.doc(); c.items["x"] = .object(Self.item("x", [("updatedAt", .number(5))]))
        #expect(Model.merge(c, b).items["x"]?.objectValue?.truthy("deleted") == true)
        var d = Self.doc(); d.items["x"] = .object(Self.item("x", [("text", .string("resurrected on purpose")), ("updatedAt", .number(11))]))
        #expect(Model.merge(d, b).items["x"]?.objectValue?.str("text") == "resurrected on purpose")
    }

    @Test("the tie-break: a tombstone, then the record that carries more, then the lexically larger")
    func tieBreak() {
        var a = Self.doc(), b = Self.doc()
        a.items["x"] = .object(Self.item("x", [("repeat", .string("daily"))]))
        b.items["x"] = .object(Self.item("x"))
        #expect(Model.merge(a, b).items["x"]?.objectValue?.str("repeat") == "daily")
        #expect(Model.merge(b, a).items["x"]?.objectValue?.str("repeat") == "daily")
        var tomb = JSONObject(); tomb.set("id", "x"); tomb.set("deleted", true); tomb.set("updatedAt", 1000)
        b.items["x"] = .object(tomb)
        #expect(Model.merge(a, b).items["x"]?.objectValue?.truthy("deleted") == true)
    }

    @Test("two offline devices converge with no loss and no duplicates")
    func twoDevicesConverge() throws {
        var n = 0
        let base = Doc.seed(id: "L", at: 1000, idFn: { n += 1; return "seed\(n)" })
        var b = base
        for t in ["Four", "Five"] {
            var r = JSONObject()
            r.set("id", "x" + t); r.set("sectionId", ""); r.set("text", t); r.set("note", "")
            r.set("done", false); r.set("doneAt", 0); r.set("today", true)
            r.set("order", Double(9000 + t.count)); r.set("todayOrder", Double(9000 + t.count)); r.set("updatedAt", 1000)
            b.items["x" + t] = .object(r)
        }
        let ids = b.items.keys.map(\.string)
        var mac = Model.normalize(.object(b.json)), phone = Model.normalize(.object(b.json))

        var m0 = try #require(mac.items[ids[0]]?.objectValue)
        m0.set("done", true); m0.set("doneAt", 2000); m0.set("updatedAt", 2000)
        mac.items[ids[0]] = .object(m0)
        var m1 = try #require(mac.items[ids[1]]?.objectValue)
        m1.set("text", "edited on mac"); m1.set("updatedAt", 2001)
        mac.items[ids[1]] = .object(m1)
        var m2 = JSONObject(); m2.set("id", ids[2]); m2.set("deleted", true); m2.set("updatedAt", 2002)
        mac.items[ids[2]] = .object(m2)

        var p0 = try #require(phone.items[ids[0]]?.objectValue)
        p0.set("text", "edited on phone"); p0.set("updatedAt", 1500)
        phone.items[ids[0]] = .object(p0)
        phone.items["new1"] = .object(Self.item("new1", [("text", .string("from phone")), ("updatedAt", .number(2500)), ("order", .number(6000)), ("todayOrder", .number(6000))]))
        var p3 = try #require(phone.items[ids[3]]?.objectValue)
        p3.set("todayOrder", 500); p3.set("updatedAt", 2600)
        phone.items[ids[3]] = .object(p3)

        let m = Model.merge(mac, phone)
        #expect(m.canon == Model.merge(phone, mac).canon)
        let live = m.todayItems
        #expect(live.count == 5, "5 originals minus 1 deleted plus 1 new")
        #expect(m.items[ids[0]]?.objectValue?.truthy("done") == true, "the mac's later check wins")
        #expect(m.items[ids[1]]?.objectValue?.str("text") == "edited on mac")
        #expect(m.items[ids[2]]?.objectValue?.truthy("deleted") == true)
        #expect(m.items["new1"]?.objectValue?.str("text") == "from phone")
        #expect(live[0].id == ids[3], "the phone's reorder puts item 3 first")
        #expect(Model.merge(m, mac).canon == m.canon)
        #expect(Model.merge(m, phone).canon == m.canon)
    }

    @Test("purgeTombstones: old ones go, fresh ones stay, nothing changed means nothing changed")
    func purge() {
        var d = Self.doc()
        var old = JSONObject(); old.set("id", "old"); old.set("deleted", true); old.set("updatedAt", 0)
        var fresh = JSONObject(); fresh.set("id", "fresh"); fresh.set("deleted", true); fresh.set("updatedAt", 1e12)
        d.items["old"] = .object(old)
        d.items["fresh"] = .object(fresh)
        let p = Model.purgeTombstones(d, 1e12 + 1, ttl: Model.tombstoneTTL, dates: Self.dates)
        #expect(p.doc.items["old"] == nil)
        #expect(p.doc.items["fresh"] != nil)
        #expect(Model.purgeTombstones(p.doc, 1e12 + 1, dates: Self.dates).changed == false)
    }

    // ---------------------------------------------------------------- rollover

    @Test("rollover: yesterday's done items move to history and are tombstoned; idempotent")
    func rolloverBasics() throws {
        var d = Self.doc()
        let y = Self.at("2026-09-01T15:00:00")
        d.items["a"] = .object(Self.item("a", [("done", .bool(true)), ("doneAt", .number(y)), ("updatedAt", .number(y))]))
        d.items["b"] = .object(Self.item("b", [("done", .bool(false))]))
        d.items["c"] = .object(Self.item("c", [("done", .bool(true)), ("doneAt", .number(Self.at("2026-09-02T09:00:00"))), ("updatedAt", .number(5))]))
        let r1 = Model.rollover(d, today: "2026-09-02", at: 7e12, dates: Self.dates)
        #expect(r1.moved.count == 1)
        #expect(r1.doc.items["a"]?.objectValue?.truthy("deleted") == true)
        #expect(r1.doc.items["b"]?.objectValue?.truthy("done") == false)
        #expect(r1.doc.items["c"]?.objectValue?.truthy("done") == true, "finished today stays")
        #expect(r1.doc.historyEntries("2026-09-01").first?.id == "a")

        let r2 = Model.rollover(r1.doc, today: "2026-09-02", at: 7e12 + 1, dates: Self.dates)
        #expect(r2.moved.isEmpty)
        #expect(r2.changed == false, "nothing to do leaves the document alone")
        #expect(r2.doc.canon == r1.doc.canon)

        // two devices each rolling over then merging == one device rolling over
        let other = Model.rollover(d, today: "2026-09-02", at: 7e12 + 5, dates: Self.dates).doc
        let m = Model.merge(r1.doc, other)
        #expect(m.historyEntries("2026-09-01").count == 1)
        #expect(m.items["a"]?.objectValue?.truthy("deleted") == true)
    }

    @Test("rollover: a done daily line goes to History and resets undone on Today (+2)")
    func rolloverDaily() throws {
        let y = Self.at("2026-09-01T15:00:00")
        var d = Self.doc()
        d.items["a"] = .object(Self.item("a", [("text", .string("Stretch")), ("done", .bool(true)), ("doneAt", .number(y)), ("updatedAt", .number(y))]))
        var rule = JSONObject(); rule.set("kind", "daily")
        d = Model.setRule(d, "a", rule, at: 100, today: "2026-09-01")

        let r1 = Model.rollover(d, today: "2026-09-02", at: 7e12, dates: Self.dates)
        #expect(r1.moved.count == 1)
        #expect(r1.doc.historyEntries("2026-09-01").first?.text == "Stretch")
        let a = try #require(r1.doc.items["a"]?.objectValue)
        #expect(a.truthy("done") == false)
        #expect(a.num("doneAt") == 0)
        #expect(a.truthy("today") == true)
        #expect(a.num("updatedAt") == y + 2, "+2, so it beats a v3 rollover's tombstone at +1")
        #expect(a.str("text") == "Stretch")
        #expect(r1.doc.rules["a"]?.objectValue?.str("placed") == "2026-09-02")

        let r2 = Model.rollover(r1.doc, today: "2026-09-02", at: 7e12 + 1, dates: Self.dates)
        #expect(r2.changed == false)

        let other = Model.rollover(d, today: "2026-09-02", at: 7e12 + 999, dates: Self.dates).doc
        #expect(Self.records(Model.merge(r1.doc, other)) == Self.records(r1.doc), "identical records from two devices")

        // done again today, rolled tomorrow: another History day, reset again
        var d2 = Model.normalize(.object(r1.doc.json))
        var a2 = try #require(d2.items["a"]?.objectValue)
        a2.set("done", true); a2.set("doneAt", Self.at("2026-09-02T10:00:00")); a2.set("updatedAt", Self.at("2026-09-02T10:00:00"))
        d2.items["a"] = .object(a2)
        let r3 = Model.rollover(d2, today: "2026-09-03", at: 7e12, dates: Self.dates).doc
        #expect(r3.historyEntries("2026-09-02").first?.id == "a")
        #expect(r3.items["a"]?.objectValue?.truthy("done") == false)
        #expect(r3.history.count == 2)
    }

    /// 1.9: the third argument is the clock — the six-hour guard reads it — so every one is a real morning.
    @Test("rollover: a weekly line leaves Today until its next day, then comes back once")
    func rolloverWeekly() throws {
        let mon = Self.at("2026-09-07T10:00:00")                       // a Monday
        var d = Self.doc()
        d.items["a"] = .object(Self.item("a", [("done", .bool(true)), ("doneAt", .number(mon)), ("updatedAt", .number(mon))]))
        var rule = JSONObject(); rule.set("kind", "weekly"); rule["days"] = .array([.number(1), .number(4)])
        d = Model.setRule(d, "a", rule, at: 100, today: "2026-09-07")

        let tue = Model.rollover(d, today: "2026-09-08", at: Self.at("2026-09-08T09:00:00"), dates: Self.dates).doc
        #expect(tue.items["a"]?.objectValue?.truthy("done") == false)
        #expect(tue.items["a"]?.objectValue?.truthy("today") == false, "not due on Tuesday")
        #expect(Model.rollover(tue, today: "2026-09-09", at: Self.at("2026-09-09T09:00:00"), dates: Self.dates).changed == false, "Wednesday: nothing")

        let thuResult = Model.rollover(tue, today: "2026-09-10", at: Self.at("2026-09-10T09:00:00"), dates: Self.dates)
        let thu = thuResult.doc
        #expect(thu.items["a"]?.objectValue?.truthy("today") == true, "Thursday: back on Today")
        #expect(thu.items["a"]?.objectValue?.num("updatedAt")
                == (tue.items["a"]?.objectValue?.num("updatedAt") ?? 0) + 1)
        #expect(thu.rules["a"]?.objectValue?.str("placed") == "2026-09-10")
        #expect(Model.rollover(thu, today: "2026-09-10", at: Self.at("2026-09-10T09:01:00"), dates: Self.dates).changed == false, "same day again")

        // the user takes it off Today that day: the minute tick must not put it back
        var off = Model.normalize(.object(thu.json))
        var a = try #require(off.items["a"]?.objectValue)
        a.set("today", false); a.set("updatedAt", Self.at("2026-09-10T11:00:00"))
        off.items["a"] = .object(a)
        #expect(Model.rollover(off, today: "2026-09-10", at: Self.at("2026-09-10T11:01:00"), dates: Self.dates).changed == false)
        #expect(Model.rollover(off, today: "2026-09-11", at: Self.at("2026-09-11T09:00:00"), dates: Self.dates).changed == false, "Friday: not due")
        #expect(Model.rollover(off, today: "2026-09-14", at: Self.at("2026-09-14T09:00:00"), dates: Self.dates).doc.items["a"]?.objectValue?.truthy("today") == true,
                "next Monday: back")
    }

    @Test("rollover: an unfinished recurring line stays; a plain done line still tombstones (+1)")
    func rolloverPlainTombstone() throws {
        let y = Self.at("2026-09-01T15:00:00")
        var d = Self.doc()
        d.items["a"] = .object(Self.item("a", [("done", .bool(false))]))
        d.items["b"] = .object(Self.item("b", [("done", .bool(true)), ("doneAt", .number(y)), ("updatedAt", .number(y))]))
        var rule = JSONObject(); rule.set("kind", "daily")
        d = Model.setRule(d, "a", rule, at: 1, today: "2026-09-01")
        let r = Model.rollover(d, today: "2026-09-02", at: Self.at("2026-09-02T09:00:00"), dates: Self.dates).doc
        #expect(r.items["a"] == d.items["a"])
        let b = try #require(r.items["b"]?.objectValue)
        #expect(JSONWriter.canon(.object(b)) == #"{"deleted":true,"id":"b","updatedAt":\#(JSNumber.toString(y + 1))}"#)
        #expect(r.recentlyDeleted.isEmpty, "rollover tombstones never show as deleted")
    }

    @Test("not today: off Today now, back at tomorrow's rollover, undo puts it straight back")
    func notToday() throws {
        var d = Self.doc()
        d.items["a"] = .object(Self.item("a", [("todayOrder", .number(3000))]))
        d = Model.notToday(d, "a", today: "2026-09-01", at: 500, dates: Self.dates)
        #expect(d.items["a"]?.objectValue?.truthy("today") == false)
        #expect(JSONWriter.canon(try #require(d.returns["a"])) == #"{"id":"a","on":"2026-09-02","updatedAt":500}"#)
        #expect(Model.rollover(d, today: "2026-09-01", at: 600, dates: Self.dates).changed == false, "today: stays off")

        let back = Model.rollover(d, today: "2026-09-02", at: 700, dates: Self.dates).doc
        #expect(back.items["a"]?.objectValue?.truthy("today") == true)
        #expect(back.items["a"]?.objectValue?.num("todayOrder") == 3000, "keeps its place")
        #expect(back.items["a"]?.objectValue?.num("updatedAt") == 501)
        #expect(back.returns["a"]?.objectValue?.truthy("deleted") == true)
        #expect(Model.rollover(back, today: "2026-09-02", at: 800, dates: Self.dates).changed == false, "idempotent")
        #expect(Self.records(Model.rollover(d, today: "2026-09-03", at: 900, dates: Self.dates).doc)
                == Self.records(Model.rollover(back, today: "2026-09-03", at: 900, dates: Self.dates).doc),
                "a device that slept through a day agrees")

        let undone = Model.backToday(d, "a", at: 550)
        #expect(undone.items["a"]?.objectValue?.truthy("today") == true)
        #expect(undone.returns["a"]?.objectValue?.truthy("deleted") == true)

        // a recurring line that is not-today'd is not re-placed by its rule that day
        var e = Self.doc()
        e.items["a"] = .object(Self.item("a"))
        var rule = JSONObject(); rule.set("kind", "daily")
        e = Model.setRule(e, "a", rule, at: 1, today: "2026-09-01")
        e = Model.notToday(e, "a", today: "2026-09-01", at: 2, dates: Self.dates)
        #expect(Model.rollover(e, today: "2026-09-01", at: 3, dates: Self.dates).changed == false)
    }

    @Test("setRule stores a snapshot; a rule on a line already on Today is marked placed today")
    func setRule() throws {
        var d = Self.doc()
        d.items["a"] = .object(Self.item("a", [("text", .string("Standup")), ("note", .string("9")), ("sectionId", .string("s"))]))
        var weekly = JSONObject(); weekly.set("kind", "weekly")
        weekly["days"] = .array([.number(3), .number(1), .number(1), .number(9)])
        d = Model.setRule(d, "a", weekly, at: 50, today: "2026-09-01")
        #expect(JSONWriter.canon(try #require(d.rules["a"]))
                == #"{"days":[1,3],"id":"a","kind":"weekly","note":"9","placed":"2026-09-01","sectionId":"s","text":"Standup","updatedAt":50}"#)

        var edited = try #require(d.items["a"]?.objectValue)
        edited.set("text", "Standup (short)")
        d.items["a"] = .object(edited)
        d = Model.refreshRuleSnapshot(d, "a", at: 60)
        #expect(d.rules["a"]?.objectValue?.str("text") == "Standup (short)")
        #expect(d.rules["a"]?.objectValue?.num("updatedAt") == 60)

        d = Model.setRule(d, "a", nil, at: 70, today: "2026-09-01")
        #expect(d.rules["a"]?.objectValue?.truthy("deleted") == true)
        #expect(d.rule(of: "a") == nil)

        var monthly = JSONObject(); monthly.set("kind", "monthly"); monthly.set("day", 40)
        d = Model.setRule(d, "a", monthly, at: 80, today: "2026-09-01")
        #expect(d.rules["a"]?.objectValue?.num("day") == 31)

        var daily = JSONObject(); daily.set("kind", "daily")
        #expect(Model.setRule(d, "nope", daily, at: 90, today: "2026-09-01").canon == d.canon, "no such line: unchanged")
    }

    @Test("recently deleted: tombstones with text, newest first; restore brings the line back")
    func recentlyDeletedAndRestore() throws {
        var d = Self.doc()
        var s = JSONObject(); s.set("id", "s"); s.set("name", "S"); s.set("order", 1); s.set("collapsed", false); s.set("updatedAt", 1)
        d.sections["s"] = .object(s)
        d.items["a"] = .object(Model.tombstone(Self.item("a", [("text", .string("Alpha")), ("sectionId", .string("s")), ("note", .string("n"))]), at: 5000))
        d.items["b"] = .object(Model.tombstone(Self.item("b", [("text", .string("Beta"))]), at: 6000))
        var bare = JSONObject(); bare.set("id", "c"); bare.set("deleted", true); bare.set("updatedAt", 7000)
        d.items["c"] = .object(bare)
        #expect(d.recentlyDeleted.map(\.id) == ["b", "a"])
        #expect(JSONWriter.canon(try #require(d.items["a"]))
                == #"{"deleted":true,"id":"a","note":"n","sectionId":"s","text":"Alpha","updatedAt":5000}"#)

        let r = Model.restoreItem(d, "a", at: 8000)
        let a = try #require(r.items["a"]?.objectValue)
        #expect(a.str("text") == "Alpha")
        #expect(a.str("sectionId") == "s")
        #expect(a.truthy("done") == false)
        #expect(a.truthy("today") == false)
        #expect(a.num("updatedAt") == 8000)
        #expect(r.recentlyDeleted.count == 1)

        var deletedSection = JSONObject(); deletedSection.set("id", "s"); deletedSection.set("deleted", true); deletedSection.set("updatedAt", 9)
        d.sections["s"] = .object(deletedSection)
        #expect(Model.restoreItem(d, "a", at: 8000).items["a"]?.objectValue?.str("sectionId") == "",
                "a deleted section falls back to Unsorted")
        #expect(Model.restoreItem(d, "c", at: 8000).items["c"]?.objectValue?.str("text") == "",
                "a bare tombstone restores empty")
        let purged = Model.purgeTombstones(r, 8000 + Model.tombstoneTTL + 1, dates: Self.dates).doc
        #expect(purged.items["b"] == nil && purged.items["c"] == nil && purged.items["a"] != nil)
    }

    @Test("templates: saved from a section without state, inserted anywhere, deleted")
    func templates() throws {
        var d = Self.doc()
        var s = JSONObject(); s.set("id", "s"); s.set("name", "Morning"); s.set("order", 1); s.set("collapsed", false); s.set("updatedAt", 1)
        d.sections["s"] = .object(s)
        d.items["a"] = .object(Self.item("a", [("sectionId", .string("s")), ("text", .string("Coffee")), ("done", .bool(true)), ("doneAt", .number(5)), ("order", .number(2000))]))
        d.items["b"] = .object(Self.item("b", [("sectionId", .string("s")), ("text", .string("Mail")), ("note", .string("inbox")), ("order", .number(1000))]))
        d.items["c"] = .object(Self.item("c", [("text", .string("Elsewhere"))]))
        d = Model.templateFromSection(d, "s", name: "  Morning  ", id: "tp", at: 100)
        #expect(JSONWriter.canon(try #require(d.templates["tp"]))
                == #"{"id":"tp","lines":[{"note":"inbox","text":"Mail"},{"note":"","text":"Coffee"}],"name":"Morning","updatedAt":100}"#)
        #expect(d.liveTemplates.map(\.name) == ["Morning"])

        var n = 0
        let ins = Model.insertTemplate(d, try #require(d.templates["tp"]?.objectValue), sectionId: "", today: true, at: 200,
                                       idFn: { n += 1; return "new\(n)" })
        #expect(ins.ids == ["new1", "new2"])
        let new1 = try #require(ins.doc.items["new1"]?.objectValue)
        #expect(new1.str("text") == "Mail")
        #expect(new1.truthy("today") == true)
        #expect(new1.truthy("done") == false)
        #expect(new1.str("sectionId") == "")
        #expect(ins.doc.itemsInSection("").map(\.id) == ["c", "new1", "new2"])

        let del = Model.deleteTemplate(ins.doc, "tp", at: 300)
        #expect(del.templates["tp"]?.objectValue?.truthy("deleted") == true)
        #expect(del.liveTemplates.isEmpty)
        #expect(Model.normalize(.object(d.json)).templates["tp"]?.objectValue?.arr("lines").count == 2, "survives normalize")
    }

    @Test("put a section on Today / take it off")
    func sectionToday() throws {
        var d = Self.doc()
        var s = JSONObject(); s.set("id", "s"); s.set("name", "S"); s.set("order", 1); s.set("collapsed", false); s.set("updatedAt", 1)
        d.sections["s"] = .object(s)
        d.items["a"] = .object(Self.item("a", [("sectionId", .string("s")), ("today", .bool(false))]))
        d.items["b"] = .object(Self.item("b", [("sectionId", .string("s")), ("today", .bool(false)), ("done", .bool(true)), ("doneAt", .number(5))]))
        d.items["c"] = .object(Self.item("c", [("sectionId", .string("s")), ("today", .bool(true))]))
        let on = Model.setSectionToday(d, "s", true, at: 50)
        #expect(on.items["a"]?.objectValue?.truthy("today") == true)
        #expect(on.items["b"]?.objectValue?.truthy("today") == false, "done lines are left alone")
        #expect(on.items["c"]?.objectValue?.num("updatedAt") == 1000, "already on Today: untouched")
        #expect((on.items["a"]?.objectValue?.num("todayOrder") ?? 0) > (on.items["c"]?.objectValue?.num("todayOrder") ?? 0))
        let off = Model.setSectionToday(on, "s", false, at: 60)
        #expect(off.items["a"]?.objectValue?.truthy("today") == false)
        #expect(Model.setSectionToday(off, "s", false, at: 70).canon == off.canon, "nothing to do: same doc")
    }

    @Test("move to another list: a new id with its rule and return; the source keeps a bare tombstone")
    func moveItem() throws {
        var src = Self.doc("A"), dst = Self.doc("B")
        src.items["a"] = .object(Self.item("a", [("text", .string("Take me")), ("sectionId", .string("s")), ("note", .string("n")), ("today", .bool(true))]))
        var rule = JSONObject(); rule.set("kind", "weekdays")
        src = Model.setRule(src, "a", rule, at: 1, today: "2026-09-01")
        src = Model.notToday(src, "a", today: "2026-09-01", at: 2, dates: Self.dates)
        dst.items["z"] = .object(Self.item("z", [("order", .number(5000)), ("todayOrder", .number(5000))]))

        let r = try #require(Model.moveItem(src, dst, "a", at: 100, idFn: { "fresh" }))
        #expect(r.newId == "fresh")
        let it = try #require(r.dst.items["fresh"]?.objectValue)
        #expect(it.str("text") == "Take me")
        #expect(it.str("note") == "n")
        #expect(it.str("sectionId") == "")
        #expect(it.truthy("today") == false, "state travels as it was (not-today'd)")
        #expect(it.num("order") > 5000)
        #expect(it.num("updatedAt") == 100)
        #expect(r.dst.rules["fresh"]?.objectValue?.str("kind") == "weekdays")
        #expect(r.dst.returns["fresh"]?.objectValue?.str("on") == "2026-09-02")
        #expect(JSONWriter.canon(try #require(r.src.items["a"])) == #"{"deleted":true,"id":"a","updatedAt":100}"#)
        #expect(r.src.rules["a"]?.objectValue?.truthy("deleted") == true)
        #expect(r.src.returns["a"]?.objectValue?.truthy("deleted") == true)
        #expect(r.src.recentlyDeleted.isEmpty, "a moved line is not a deleted one")
        #expect(Model.moveItem(src, dst, "nope", at: 100) == nil)
    }

    @Test("export to import round trip carries no secret and reads back")
    func exportImport() throws {
        var d = Doc.empty(id: "SecretW0000000000000000", name: "Work", at: 0)
        var s = JSONObject(); s.set("id", "s"); s.set("name", "Home"); s.set("order", 1); s.set("collapsed", false); s.set("updatedAt", 1)
        d.sections["s"] = .object(s)
        d.items["a"] = .object(Self.item("a", [("text", .string("Alpha")), ("note", .string("with a note")), ("sectionId", .string("s"))]))
        d.items["b"] = .object(Self.item("b", [("text", .string("Beta")), ("done", .bool(true)), ("doneAt", .number(5))]))
        d.items["t"] = .object(Model.tombstone(Self.item("t", [("text", .string("Gone"))]), at: 9))
        var h = JSONObject(); h.set("id", "h"); h.set("text", "Old"); h.set("doneAt", 4); h.set("section", "Home")
        d.history["2026-08-30"] = .array([.object(h)])
        var rule = JSONObject(); rule.set("kind", "daily")
        d = Model.setRule(d, "a", rule, at: 10, today: "2026-09-01")
        d = Model.templateFromSection(d, "s", name: "T", id: "tp", at: 11)

        let out = Model.exportJSON(d, at: 123)
        #expect(!out.contains("SecretW0000000000000000"), "the list secret never leaves")
        #expect(out.hasSuffix("\n") && out.hasPrefix("{"))
        let back = try Model.importJSON(out, id: "NewList0000000000000000")
        #expect(back.id == "NewList0000000000000000")
        #expect(back.items["a"]?.objectValue?.str("note") == "with a note")
        #expect(back.rules["a"]?.objectValue?.str("kind") == "daily")
        #expect(back.templates["tp"]?.objectValue?.str("name") == "T")
        #expect(Model.exportJSON(back, at: 123) == out, "the round trip is byte-identical")
        #expect(throws: (any Error).self) { try Model.importJSON("not json") }
        #expect(throws: (any Error).self) { try Model.importJSON("{\"nope\":1}") }
    }

    // ---------------------------------------------------------------- ordering and queries

    @Test("today and section ordering: undone by order, done sink by doneAt")
    func ordering() {
        var d = Self.doc()
        d.items["a"] = .object(Self.item("a", [("todayOrder", .number(3000)), ("order", .number(3000))]))
        d.items["b"] = .object(Self.item("b", [("todayOrder", .number(1000)), ("order", .number(1000)), ("done", .bool(true)), ("doneAt", .number(50))]))
        d.items["c"] = .object(Self.item("c", [("todayOrder", .number(2000)), ("order", .number(2000))]))
        d.items["e"] = .object(Self.item("e", [("todayOrder", .number(500)), ("order", .number(500)), ("done", .bool(true)), ("doneAt", .number(10))]))
        #expect(d.todayItems.map(\.id) == ["c", "a", "e", "b"])
        #expect(d.itemsInSection("").map(\.id) == ["c", "a", "e", "b"])
    }

    @Test("items whose section was deleted fall back to Unsorted")
    func deletedSectionFallback() {
        var d = Self.doc()
        var gone = JSONObject(); gone.set("id", "s1"); gone.set("deleted", true); gone.set("updatedAt", 1)
        var kept = JSONObject(); kept.set("id", "s2"); kept.set("name", "Kept"); kept.set("order", 1); kept.set("collapsed", false); kept.set("updatedAt", 1)
        d.sections["s1"] = .object(gone)
        d.sections["s2"] = .object(kept)
        d.items["a"] = .object(Self.item("a", [("sectionId", .string("s1"))]))
        d.items["b"] = .object(Self.item("b", [("sectionId", .string("s2"))]))
        #expect(d.itemsInSection("").map(\.id) == ["a"])
        #expect(d.itemsInSection("s2").map(\.id) == ["b"])
        #expect(d.sectionsOrdered.map(\.id) == ["s2"])
    }

    @Test("orderBetween: midpoint, edges, and precision exhaustion")
    func orderBetween() {
        #expect(Model.orderBetween(nil, nil) == 1000)
        #expect(Model.orderBetween(1000, nil) == 2000)
        #expect(Model.orderBetween(nil, 1000) == 0)
        #expect(Model.orderBetween(1000, 2000) == 1500)
        var lo = 1000.0, hi = 1001.0, n = 0
        while n < 100 {
            guard let m = Model.orderBetween(lo, hi) else { break }
            hi = m
            n += 1
        }
        #expect(n > 40 && n < 100, "runs out eventually: \(n)")
    }

    @Test("localDate is local, not UTC; the streak counts back from today or yesterday")
    func datesAndStreak() {
        #expect(Self.dates.localDate(Self.at("2026-03-05T00:30:00")) == "2026-03-05")
        var d = Self.doc()
        for day in ["2026-08-30", "2026-08-31", "2026-09-01"] {
            var e = JSONObject(); e.set("id", "a"); e.set("text", ""); e.set("doneAt", 1); e.set("section", "")
            d.history[day] = .array([.object(e)])
        }
        #expect(d.streak("2026-09-02", dates: Self.dates) == 3, "yesterday counts when today has nothing yet")
        #expect(d.streak("2026-09-03", dates: Self.dates) == 0)
        d.items["x"] = .object(Self.item("x", [("done", .bool(true)), ("doneAt", .number(Self.at("2026-09-02T10:00:00")))]))
        #expect(d.streak("2026-09-02", dates: Self.dates) == 4)
    }

    @Test("the seed is three Today lines that keep their marks when the list is kept")
    func seed() {
        var n = 0
        let d = Doc.seed(id: "L", at: 1000, idFn: { n += 1; return "s\(n)" })
        #expect(d.todayItems.count == 3)
        #expect(Model.seedLines == ["Tap or click to cross this off", "Add a line of your own", "Cross off all three and see"])
        for l in Model.seedLines { #expect(l.count <= 32, "\(l)") }

        var played = Doc.seed(id: "", at: 1000, idFn: { n += 1; return "p\(n)" })
        let first = played.todayItems[0].id
        var r = played.items[first]!.objectValue!
        r.set("done", true); r.set("doneAt", 5)
        played.items[first] = .object(r)
        let kept = Model.normalize(.object(played.json), "NewList0000000000000000")
        #expect(kept.id == "NewList0000000000000000")
        #expect(kept.todayItems.count == 3)
        #expect(kept.items[first]?.objectValue?.truthy("done") == true)
        #expect(kept.items[first]?.objectValue?.str("text") == JSString(Model.seedLines[0]))
    }

    @Test("diff lists changed ids only")
    func diff() {
        var a = Self.doc()
        a.items["x"] = .object(Self.item("x"))
        a.items["y"] = .object(Self.item("y"))
        var b = Model.normalize(.object(a.json))
        var y = b.items["y"]!.objectValue!
        y.set("text", "changed")
        b.items["y"] = .object(y)
        b.items["z"] = .object(Self.item("z"))
        let df = Doc.diff(a, b)
        #expect((df["items"] ?? []).sorted() == ["y", "z"])
    }

    /// Records compared, the document's own wall-clock stamp ignored (two devices roll at different times).
    static func records(_ d: Doc) -> JSString {
        var copy = d
        copy.updatedAt = 0
        return copy.canon
    }
}
