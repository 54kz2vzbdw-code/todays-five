// The layer everything else stands on: canonical JSON identical to the web's, because merge()'s
// tie-break compares it. Cases come from test/fixtures/vectors.json, which model.js's own canon()
// produced.
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("JavaScript semantics")
struct JSSemanticsTests {

    @Test("canon matches the web, case for case")
    func canonMatchesTheWeb() throws {
        let cases = Fixtures.vectors.arr("canon")
        #expect(cases.count >= 50)
        for c in cases {
            let o = try #require(c.objectValue)
            let value = try #require(o["value"])
            let expected = try #require(o.stringOrNil("canon"))
            let got = JSONWriter.canon(value)
            #expect(got == expected, "canon of \(JSONWriter.stringify(value)): got \(got.string), want \(expected.string)")
        }
    }

    @Test("numbers print the way JSON.stringify prints them")
    func numbersPrintLikeJavaScript() throws {
        // spot checks that pin the two boundaries the spec draws: fixed up to 1e21, and down to 1e-6
        let pairs: [(Double, String)] = [
            (0, "0"), (-0.0, "0"), (1, "1"), (-1, "-1"), (1000, "1000"), (1500, "1500"),
            (1250.5, "1250.5"), (0.1, "0.1"), (1.5, "1.5"), (-0.5, "-0.5"),
            (1e20, "100000000000000000000"), (1e21, "1e+21"), (-1e21, "-1e+21"),
            (1e-5, "0.00001"), (1e-6, "0.000001"), (1e-7, "1e-7"), (1e-21, "1e-21"),
            (5e-324, "5e-324"), (1.7976931348623157e308, "1.7976931348623157e+308"),
            (1234567890123, "1234567890123"), (9007199254740992, "9007199254740992"),
            (1234.5678, "1234.5678"), (3.141592653589793, "3.141592653589793"),
            (6.02e23, "6.02e+23"), (2.5e-10, "2.5e-10")
        ]
        for (d, want) in pairs {
            #expect(JSNumber.toString(d) == want, "\(d)")
        }
    }

    @Test("strings are UTF-16: slicing splits a surrogate pair and the half survives")
    func stringsAreUTF16() {
        let s = JSString("ab😀cd")
        #expect(s.count == 6)                       // "ab" + a surrogate pair + "cd"
        let cut = s.prefix(3)
        #expect(cut.count == 3)
        #expect(!cut.isWellFormed, "the cut left half an emoji, which JavaScript keeps")
        var out = ""
        JSONWriter.writeString(cut, into: &out)
        #expect(out == "\"ab\\ud83d\"")

        // and a whole one is written raw
        var whole = ""
        JSONWriter.writeString(JSString("ab😀cd"), into: &whole)
        #expect(whole == "\"ab😀cd\"")
    }

    @Test("comparison and sorting are by UTF-16 code unit, not by Swift's collation")
    func comparisonIsByCodeUnit() {
        #expect(JSString("Z") < JSString("a"))
        #expect(JSString("~") < JSString("😀"))
        #expect(JSString("a") < JSString("é"))
        // precomposed é (U+00E9) against decomposed e + U+0301: Swift's String calls these equal,
        // JavaScript orders them by code unit and so must we
        let precomposed = JSString("\u{00E9}")
        let decomposed = JSString(units: [0x0065, 0x0301])
        #expect(precomposed != decomposed)
        #expect(decomposed < precomposed)
        #expect("\u{00E9}" == "e\u{0301}", "Swift's own String comparison would have called these equal")

        let sorted = ["Z", "a", "é", "😀", "~", "0", "10", "2"].map { JSString($0) }.sorted(by: <)
        #expect(sorted.map(\.string) == ["0", "10", "2", "Z", "a", "~", "é", "😀"])
    }

    @Test("object keys come back the way Object.keys does: indices first, then insertion order")
    func objectKeyOrder() {
        var o = JSONObject()
        o.set("b", 1)
        o.set("10", 1)
        o.set("2", 1)
        o.set("0abc", 1)
        o.set("a", 1)
        #expect(o.keys.map(\.string) == ["2", "10", "b", "0abc", "a"])

        // overwriting keeps the key where it was; removing takes it out
        o.set("b", 9)
        #expect(o.keys.map(\.string) == ["2", "10", "b", "0abc", "a"])
        o.remove("10")
        #expect(o.keys.map(\.string) == ["2", "b", "0abc", "a"])
    }

    @Test("the reader keeps key order, repeated keys and lone surrogates")
    func readerKeepsWhatMatters() throws {
        let o = try #require(try JSONReader.parse(#"{"b":1,"a":2,"b":3,"s":"x\ud83dy"}"#).objectValue)
        #expect(o.keys.map(\.string) == ["b", "a", "s"])       // "b" keeps its first position
        #expect(o.num("b") == 3)                               // and takes the last value
        let s = try #require(o.stringOrNil("s"))
        #expect(s.count == 3)
        #expect(!s.isWellFormed)
        #expect(JSONWriter.canon(.string(s)).string == #""x\ud83dy""#)
    }

    @Test("truthiness is JavaScript's")
    func truthiness() {
        #expect(JSONValue.null.isTruthy == false)
        #expect(JSONValue.bool(false).isTruthy == false)
        #expect(JSONValue.number(0).isTruthy == false)
        #expect(JSONValue.number(-0.0).isTruthy == false)
        #expect(JSONValue.number(Double.nan).isTruthy == false)
        #expect(JSONValue.string("").isTruthy == false)
        #expect(JSONValue.string("0").isTruthy == true)
        #expect(JSONValue.array([]).isTruthy == true)
        #expect(JSONValue.object(JSONObject()).isTruthy == true)
    }

    @Test("dates, the home zone and bidi stripping match the web, case for case")
    func datesAndZonesMatchTheWeb() throws {
        let v = Fixtures.vectors
        let tz = try #require(TimeZone(identifier: v.str("timezone").string))
        let dates = CalendarDates(timeZone: tz)
        let d = try #require(v["dates"]?.objectValue)

        for c in d.arr("addDays") {
            let o = try #require(c.objectValue)
            #expect(dates.addDays(o.str("day").string, Int(o.num("n"))) == o.str("out").string,
                    "addDays(\(o.str("day").string), \(Int(o.num("n"))))")
        }
        for c in d.arr("weekdays") {
            let o = try #require(c.objectValue)
            #expect(dates.weekdayOf(o.str("day").string) == Int(o.num("weekday")), "weekdayOf \(o.str("day").string)")
        }
        for c in d.arr("due") {
            let o = try #require(c.objectValue)
            #expect(dates.isDue(o["rule"]?.objectValue, o.str("day").string) == o.truthy("due"),
                    "isDue \(JSONWriter.stringify(o["rule"] ?? .null)) on \(o.str("day").string)")
        }
        for c in d.arr("localDates") {
            let o = try #require(c.objectValue)
            #expect(dates.localDate(o.num("ts")) == o.str("out").string, "localDate \(o.num("ts"))")
        }
        for c in v.arr("zones") {
            let o = try #require(c.objectValue)
            #expect(CalendarDates.isZone(o.str("zone").string) == o.truthy("ok"), "isZone \(o.str("zone").string)")
        }
        for c in v.arr("zoneDays") {
            let o = try #require(c.objectValue)
            #expect(CalendarDates.localDateIn(o.num("ts"), o.str("zone").string) == o.str("out").string,
                    "localDateIn \(o.str("zone").string) \(o.num("ts"))")
        }
        for c in v.arr("zoneDocs") {
            let o = try #require(c.objectValue)
            var doc = Doc.empty(id: "L", at: 0)
            let zone = o.str("zone")
            if !zone.isEmpty { doc.json["zone"] = .string(zone) }
            let normalized = Model.normalize(.object(doc.json), "L")
            #expect(CalendarDates.zoneOf(normalized) == o.str("zoneOf").string, "zoneOf \(zone.string)")
            #expect(dates.todayFor(normalized, o.num("ts")) == o.str("todayFor").string, "todayFor \(zone.string)")
            #expect(dates.dayOf(normalized, o.num("ts")) == o.str("dayOf").string, "dayOf \(zone.string)")
        }
        #expect(Model.rollGuardMs == v.num("rollGuardMs"))
        for c in v.arr("bidi") {
            let o = try #require(c.objectValue)
            #expect(Model.stripBidi(o.str("in")) == o.str("out"), "stripBidi")
        }
        let limits = try #require(v["limits"]?.objectValue)
        #expect(Double(Model.textMax) == limits.num("TEXT_MAX"))
        #expect(Double(Model.noteMax) == limits.num("NOTE_MAX"))
        #expect(Double(Model.templateNameMax) == limits.num("TEMPLATE_NAME_MAX"))
        #expect(Double(Model.templateLinesMax) == limits.num("TEMPLATE_LINES_MAX"))
        #expect(Model.tombstoneTTL == limits.num("TOMBSTONE_TTL"))
        #expect(Double(Model.historyDays) == limits.num("HISTORY_DAYS"))
        #expect(Double(Model.docVersion) == v.num("docVersion"))
        #expect(Model.seedLines == v.arr("seedLines").map { $0.jsString?.string ?? "" })
    }

    @Test("trim, whitespace collapsing and line splitting are JavaScript's")
    func jsTextRules() {
        #expect(JSText.trim(JSString("\u{00A0} hi \u{FEFF}")).string == "hi")
        #expect(JSText.collapseSpaces(JSString("a \t\n b")).string == "a b")
        #expect(JSText.splitLines(JSString("a\r\nb\nc")).map(\.string) == ["a", "b", "c"])
        #expect(JSText.trim(JSString("\u{0085}x")).string == "\u{0085}x", "U+0085 is not JavaScript whitespace")
    }
}
