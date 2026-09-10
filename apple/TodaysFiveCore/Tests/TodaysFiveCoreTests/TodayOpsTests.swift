// The three things a wrist does to a list, and the agreement that lets a wrist and a phone do them
// to the same list without fighting.
//
// The trap the check-off test is written around is the one app.js's own code makes easy to fall into:
// the sink is derived, so writing `todayOrder` on a check-off is an opinion the web never asked for
// and will merge against, on every device, forever. It is asserted here explicitly rather than left
// to be noticed.
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("Today: add, check off, start again")
struct TodayOpsTests {

    static let dates = CalendarDates(timeZone: TimeZone(identifier: "America/Chicago")!)

    static func at(_ s: String) -> Double {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        f.timeZone = dates.timeZone
        f.locale = Locale(identifier: "en_US_POSIX")
        return f.date(from: s)!.timeIntervalSince1970 * 1000
    }

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

    /// Ids in the order they were asked for, so a test can say which line came out.
    static func ids(_ list: [String]) -> () -> String {
        var next = list.makeIterator()
        return { next.next() ?? Model.shortId() }
    }

    // ---------------------------------------------------------------- addToToday

    @Test("addToToday: bidi stripped, trimmed, runs of whitespace collapsed, cut at 200 code units")
    func addCleansTheText() throws {
        let doc = Doc.empty(id: "L", at: 0)

        let plain = try #require(Model.addToToday(doc, text: "  Buy \t milk \n now  ", at: 500, idFn: Self.ids(["i1"])))
        #expect(plain.doc.items["i1"]?.objectValue?.str("text").string == "Buy milk now")

        // U+202E reverses how the rest of a line reads without showing anything, and on a shared list
        // a reader trusts what they see (1.9).
        let bidi = try #require(Model.addToToday(doc, text: "Pay \u{202E}gnihtemos\u{202C}", at: 500, idFn: Self.ids(["i2"])))
        #expect(bidi.doc.items["i2"]?.objectValue?.str("text").string == "Pay gnihtemos")

        // The cut is 200 **UTF-16 code units**, which is `String.prototype.slice`'s unit and can land
        // in the middle of a surrogate pair — JavaScript keeps the lone surrogate, so this must too.
        let long = try #require(Model.addToToday(doc, text: String(repeating: "a", count: 199) + "\u{1F600}",
                                                 at: 500, idFn: Self.ids(["i3"])))
        let cut = try #require(long.doc.items["i3"]?.objectValue?.str("text"))
        #expect(cut.units.count == 200)
        #expect(cut.units.last == 0xD83D, "half an emoji, kept, because that is what the web stores")
    }

    /// **What Phase 5 widened, pinned here rather than assumed.**
    ///
    /// The Watch's add used to go through WatchKit's `presentTextInputController` with
    /// `allowedInputMode: .plain`, which kept emoji and stickers out of a line. Phase 5 makes
    /// `TextFieldLink` the path — the system's own input screen — and that screen has no such
    /// restriction. So a line from a wrist may now carry what a line typed into the web has always been
    /// able to carry, and the Watch stops being the one client with a narrower alphabet than the
    /// document it writes into.
    ///
    /// Nothing in the core changed for that. This test is the net under the claim: a line that is all
    /// emoji is a line (it is not whitespace, so `trim` does not eat it), a ZWJ sequence is carried
    /// through whole rather than split at its joiner, and a variation selector survives. The one place
    /// the widening *can* bite — the 200-code-unit cut landing inside a surrogate pair — is the test
    /// above, and its answer is `String.prototype.slice`'s, which is the answer the web stores.
    @Test("addToToday: an emoji line is a line, and a joined sequence is carried whole")
    func addKeepsWhatAWiderKeyboardCanSend() throws {
        let doc = Doc.empty(id: "L", at: 0)

        let only = try #require(Model.addToToday(doc, text: "🥛", at: 500, idFn: Self.ids(["e1"])))
        #expect(only.doc.items["e1"]?.objectValue?.str("text").string == "🥛")

        // U+200D is a format character, not whitespace, so neither `trim` nor the `\s+` collapse may
        // touch it — a family that arrived as one grapheme has to stay one.
        let family = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}"
        let joined = try #require(Model.addToToday(doc, text: "  Call \(family)  ", at: 500, idFn: Self.ids(["e2"])))
        let text = try #require(joined.doc.items["e2"]?.objectValue?.str("text"))
        #expect(text.string == "Call \(family)")
        #expect(text.units.count == 13, "eight units of family plus five of \"Call \", none inserted")

        // A variation selector is the difference between ✓ and an emoji ✓, and it is one code unit
        // after the base. Dropping it would silently change the glyph on every other client.
        let vs = try #require(Model.addToToday(doc, text: "\u{2714}\u{FE0F} done", at: 500, idFn: Self.ids(["e3"])))
        #expect(vs.doc.items["e3"]?.objectValue?.str("text").units.count == 7)
    }

    @Test("addToToday: nothing left to add is nothing added")
    func addRefusesEmpty() {
        let doc = Doc.empty(id: "L", at: 0)
        #expect(Model.addToToday(doc, text: "") == nil)
        #expect(Model.addToToday(doc, text: "   \t\n ") == nil)
        #expect(Model.addToToday(doc, text: "\u{202E}\u{2066}") == nil, "a line of nothing but overrides is a line of nothing")
    }

    @Test("addToToday writes the ten fields, on Today, past the undone lines")
    func addPlacesPastTheUndone() throws {
        var doc = Doc.empty(id: "L", at: 0)
        doc.items["a"] = .object(Self.item("a", [("order", .number(1000)), ("todayOrder", .number(1000))]))
        // A done line keeps its order while it sinks in the view. Counting it would push every new
        // line past a number nobody can see, so `newItem` counts the undone ones and so does this.
        doc.items["b"] = .object(Self.item("b", [("done", .bool(true)), ("doneAt", .number(9)),
                                                 ("order", .number(50_000)), ("todayOrder", .number(50_000))]))

        let added = try #require(Model.addToToday(doc, text: "Third", at: 7000, idFn: Self.ids(["i1"])))
        let r = try #require(added.doc.items["i1"]?.objectValue)
        #expect(r.keys.map(\.string) == ["id", "sectionId", "text", "note", "done", "doneAt",
                                         "today", "order", "todayOrder", "updatedAt"])
        #expect(r.str("id").string == "i1")
        #expect(r.str("sectionId").isEmpty)
        #expect(r.truthy("done") == false)
        #expect(r.num("doneAt") == 0)
        #expect(r.truthy("today"))
        #expect(r.num("order") == 2000)
        #expect(r.num("todayOrder") == 2000)
        #expect(r.num("updatedAt") == 7000)
        #expect(added.doc.updatedAt == 7000)
        #expect(added.doc.todayItems.map(\.id) == ["a", "i1", "b"], "and it lands above the sunk line")
    }

    @Test("addToToday: a section the list has, and one it does not")
    func addFilesUnderASection() throws {
        var doc = Doc.empty(id: "L", at: 0)
        var sec = JSONObject()
        sec.set("id", "s1"); sec.set("name", "Work"); sec.set("order", 1000); sec.set("updatedAt", 1)
        doc.sections["s1"] = .object(sec)

        let inSection = try #require(Model.addToToday(doc, text: "Ship it", sectionId: "s1", at: 500, idFn: Self.ids(["i1"])))
        #expect(inSection.doc.items["i1"]?.objectValue?.str("sectionId").string == "s1")

        let gone = try #require(Model.addToToday(doc, text: "Ship it", sectionId: "nope", at: 500, idFn: Self.ids(["i2"])))
        #expect(gone.doc.items["i2"]?.objectValue?.str("sectionId").isEmpty == true, "a section that is not there is Unsorted")
    }

    // ---------------------------------------------------------------- setDone

    @Test("setDone writes three fields and leaves today, order and todayOrder alone")
    func setDoneWritesThreeFields() throws {
        var doc = Doc.empty(id: "L", at: 100)
        doc.items["a"] = .object(Self.item("a", [("order", .number(3000)), ("todayOrder", .number(7000))]))
        let before = try #require(doc.items["a"]?.objectValue)

        let done = Model.setDone(doc, "a", true, at: 9000)
        let after = try #require(done.items["a"]?.objectValue)

        #expect(after.truthy("done"))
        #expect(after.num("doneAt") == 9000)
        #expect(after.num("updatedAt") == 9000)
        #expect(done.updatedAt == 9000)

        // The trap, asserted rather than trusted: the sink is derived, and a client that writes
        // todayOrder on a check-off fights the web on every merge.
        #expect(after.truthy("today") == before.truthy("today"))
        #expect(after.num("order") == before.num("order"))
        #expect(after.num("todayOrder") == before.num("todayOrder"))
        #expect(after.keys == before.keys, "and no field the record did not already have")
        for key in before.keys where !["done", "doneAt", "updatedAt"].contains(key.string) {
            #expect(after[key] == before[key], "\(key.string) moved and should not have")
        }

        let back = Model.setDone(done, "a", false, at: 9500)
        let undone = try #require(back.items["a"]?.objectValue)
        #expect(undone.truthy("done") == false)
        #expect(undone.num("doneAt") == 0)
        #expect(undone.num("updatedAt") == 9500)
        #expect(undone.num("todayOrder") == 7000)
    }

    @Test("setDone: an unknown id, a tombstone and a line already in that state are all no-ops")
    func setDoneNoOps() {
        var doc = Doc.empty(id: "L", at: 100)
        doc.items["a"] = .object(Self.item("a"))
        var tomb = JSONObject()
        tomb.set("id", "t"); tomb.set("deleted", true); tomb.set("updatedAt", 1)
        doc.items["t"] = .object(tomb)

        #expect(Model.setDone(doc, "nope", true, at: 9000).canon == doc.canon)
        #expect(Model.setDone(doc, "t", true, at: 9000).canon == doc.canon)
        #expect(Model.setDone(doc, "a", false, at: 9000).canon == doc.canon,
                "re-stamping a line that is already undone would win a tie-break against a real edit for nothing")
    }

    // ---------------------------------------------------------------- startAgain

    @Test("startAgain un-dones only the ids given, each with its own updatedAt")
    func startAgainBringsThemBack() throws {
        var doc = Doc.empty(id: "L", at: 100)
        doc.items["a"] = .object(Self.item("a", [("done", .bool(true)), ("doneAt", .number(500)), ("updatedAt", .number(500))]))
        doc.items["b"] = .object(Self.item("b", [("done", .bool(true)), ("doneAt", .number(600)), ("updatedAt", .number(600))]))
        doc.items["c"] = .object(Self.item("c", [("done", .bool(true)), ("doneAt", .number(700)), ("updatedAt", .number(700))]))
        doc.items["d"] = .object(Self.item("d"))

        let back = Model.startAgain(doc, ids: ["a", "b", "d", "nope"], at: 9000)
        let a = try #require(back.items["a"]?.objectValue)
        let b = try #require(back.items["b"]?.objectValue)
        #expect(a.truthy("done") == false)
        #expect(a.num("doneAt") == 0)
        #expect(a.num("updatedAt") == 9000)
        #expect(b.num("updatedAt") == 9001, "its own stamp, not the batch's")
        #expect(back.items["c"]?.objectValue?.truthy("done") == true, "a line that was not asked for stays crossed off")
        #expect(back.items["d"]?.objectValue?.num("updatedAt") == 1000, "and one that was never done is not rewritten")
        #expect(back.updatedAt == 9001)

        #expect(Model.startAgain(doc, ids: [], at: 9000).canon == doc.canon)
        #expect(Model.startAgain(doc, ids: ["d"], at: 9000).canon == doc.canon, "nothing to bring back changes nothing")
    }

    // ---------------------------------------------------------------- the rollover agreement

    @Test("a Watch and a phone in different zones roll the same list to the same document")
    func rolloverAgreement() throws {
        var doc = Doc.empty(id: "L", at: 0)
        doc.json.set("zone", "America/Chicago")            // 1.9: the list's home zone
        let yesterday = Self.at("2026-09-01T15:00:00")
        doc.items["a"] = .object(Self.item("a", [("done", .bool(true)), ("doneAt", .number(yesterday)),
                                                 ("updatedAt", .number(yesterday))]))
        doc.items["b"] = .object(Self.item("b"))
        var rule = JSONObject()
        rule.set("id", "a"); rule.set("kind", "daily"); rule.set("text", "t-a")
        rule.set("note", ""); rule.set("sectionId", ""); rule.set("updatedAt", yesterday)
        doc.rules["a"] = .object(rule)

        // Same list, same moment, two devices whose own clocks are in different zones. The home zone
        // is what makes the answer one answer: without it each device would roll on its own midnight.
        let ts = Self.at("2026-09-02T09:00:00")
        let phone = Model.rollover(doc, at: ts, dates: Self.dates).doc
        let watch = Model.rollover(doc, at: ts,
                                   dates: CalendarDates(timeZone: TimeZone(identifier: "Pacific/Kiritimati")!)).doc
        #expect(phone.canon == watch.canon, "the same input, byte for byte, on both wrists and in both pockets")

        // and folding one into the other adds nothing: that is what the +1 / +2 stamping is for —
        // a record stamped relative to the one it replaces, never to a clock, so neither device wins.
        let merged = Model.merge(phone, watch)
        #expect(merged.canon == phone.canon)
        #expect(Model.merge(watch, phone).canon == phone.canon)

        // The two clocks are not really the same, of course. Only the document's own top-level stamp
        // moves with them, and the merge takes the later one and nothing else.
        let later = Model.rollover(doc, at: ts + 4000,
                                   dates: CalendarDates(timeZone: TimeZone(identifier: "Pacific/Kiritimati")!)).doc
        let bothClocks = Model.merge(phone, later)
        #expect(bothClocks.updatedAt == later.updatedAt)
        var levelled = bothClocks
        levelled.updatedAt = phone.updatedAt
        #expect(levelled.canon == phone.canon, "every record agrees; only the document's own stamp moved")
    }
}
