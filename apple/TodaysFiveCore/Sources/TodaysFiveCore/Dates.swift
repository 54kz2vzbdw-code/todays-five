// Dates.swift — model.js's date functions, and the home zone (1.9).
//
// A shared list used to roll over at the earliest midnight among its devices: a phone in Tokyo filed
// a Chicago laptop's breakfast check-off under yesterday at half past ten in the morning. So a list
// carries `zone`, an IANA name, and every device computes "today" and a line's day in that zone.
// A document without one keeps rolling on each device's own clock, behind a guard: a line crossed off
// under six hours ago is never rolled. COMPATIBILITY.md §3.
//
// The calendar arithmetic (addDays, weekdayOf, isDue) anchors at noon so a DST change cannot move a
// day, and runs on the device's own calendar — it is pure arithmetic on YYYY-MM-DD, so the zone does
// not reach it.
import Foundation

public struct CalendarDates: Sendable {
    public let timeZone: TimeZone
    private let calendar: Calendar

    public init(timeZone: TimeZone = .current) {
        self.timeZone = timeZone
        var c = Calendar(identifier: .gregorian)
        c.timeZone = timeZone
        self.calendar = c
    }

    /// `now()` — milliseconds since the epoch, as JavaScript counts them.
    public static func now() -> Double { (Date().timeIntervalSince1970 * 1000).rounded(.down) }

    /// `deviceZone()` — this device's zone as the platform reports it, "" when it cannot say.
    public static func deviceZone() -> String {
        let z = TimeZone.current.identifier
        return isZone(z) ? z : ""
    }

    /// `isZone(z)` — a time zone the platform can compute in. Junk is never thrown on.
    public static func isZone(_ z: String?) -> Bool {
        guard let z, !z.isEmpty, z.utf16.count <= 64 else { return false }
        let u = Array(z.utf16)
        func alpha(_ c: UInt16) -> Bool { (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A) }
        guard alpha(u[0]) else { return false }
        for c in u {
            let ok = alpha(c) || (c >= 0x30 && c <= 0x39) || c == 0x5F || c == 0x2B || c == 0x2D || c == 0x2F
            if !ok { return false }
        }
        return TimeZone(identifier: z) != nil
    }

    /// `localDate(ts)` — the local calendar date as YYYY-MM-DD. Years under 1000 are not padded,
    /// because `d.getFullYear() + "-"` does not pad them either.
    public func localDate(_ ts: Double) -> String {
        Self.date(ts, in: calendar)
    }

    /// `localDateIn(ts, zone)` — the calendar date of a moment in a named zone.
    public static func localDateIn(_ ts: Double, _ zone: String) -> String {
        guard let tz = TimeZone(identifier: zone) else { return "" }
        var c = Calendar(identifier: .gregorian)
        c.timeZone = tz
        return date(ts, in: c)
    }

    private static func date(_ ts: Double, in calendar: Calendar) -> String {
        let d = Date(timeIntervalSince1970: ts / 1000)
        let c = calendar.dateComponents([.year, .month, .day], from: d)
        let m = c.month ?? 1, day = c.day ?? 1
        return "\(c.year ?? 1970)-\(m < 10 ? "0" : "")\(m)-\(day < 10 ? "0" : "")\(day)"
    }

    public func localDateNow() -> String { localDate(Self.now()) }

    // ---------------------------------------------------------------- the home zone (1.9)

    /// `zoneOf(doc)` — the list's home zone when it has one this platform knows, else "".
    /// A zone the platform cannot compute in is still *kept* on the document; it is only not used.
    public static func zoneOf(_ doc: Doc) -> String {
        let z = doc.json.str("zone").string
        return isZone(z) ? z : ""
    }

    /// `todayFor(doc, ts)` — "today" for this list: in its home zone, or on this device's clock.
    public func todayFor(_ doc: Doc, _ ts: Double = CalendarDates.now()) -> String {
        let z = Self.zoneOf(doc)
        return z.isEmpty ? localDate(ts) : Self.localDateIn(ts, z)
    }

    /// `dayOf(doc, ts)` — the day a moment falls on for this list, the same way.
    public func dayOf(_ doc: Doc, _ ts: Double) -> String {
        let z = Self.zoneOf(doc)
        return z.isEmpty ? localDate(ts) : Self.localDateIn(ts, z)
    }

    /// `withZone(doc, zone)` — give a list its home zone at creation; one that has a zone keeps it.
    public static func withZone(_ doc: Doc, _ zone: String = CalendarDates.deviceZone()) -> Doc {
        var out = doc
        if doc.json.str("zone").isEmpty && isZone(zone) { out.json.set("zone", zone) }
        return out
    }

    // ---------------------------------------------------------------- calendar arithmetic

    /// `dateParts(day)` — the `^(\d{4})-(\d{2})-(\d{2})$` shape, and nothing else.
    public static func parts(_ day: String) -> (y: Int, mo: Int, d: Int)? {
        let u = Array(day.utf8)
        guard u.count == 10, u[4] == 0x2D, u[7] == 0x2D else { return nil }
        for i in [0, 1, 2, 3, 5, 6, 8, 9] where !(u[i] >= 0x30 && u[i] <= 0x39) { return nil }
        func n(_ r: Range<Int>) -> Int { r.reduce(0) { $0 * 10 + Int(u[$1] - 0x30) } }
        return (n(0..<4), n(5..<7), n(8..<10))
    }

    /// A local Date at noon on that calendar day, which is what `new Date(y, mo - 1, d, 12)` makes.
    private func noon(_ y: Int, _ mo: Int, _ d: Int) -> Date? {
        var c = DateComponents()
        c.year = y; c.month = mo; c.day = d; c.hour = 12
        return calendar.date(from: c)
    }

    /// `addDays(day, n)` — YYYY-MM-DD in, YYYY-MM-DD out. An unparseable day comes back unchanged.
    public func addDays(_ day: String, _ n: Int) -> String {
        guard let p = Self.parts(day), let base = noon(p.y, p.mo, p.d),
              let moved = calendar.date(byAdding: .day, value: n, to: base) else { return day }
        return localDate(moved.timeIntervalSince1970 * 1000)
    }

    /// `weekdayOf(day)` — 0 is Sunday, as `Date.prototype.getDay()` counts.
    public func weekdayOf(_ day: String) -> Int {
        guard let p = Self.parts(day), let d = noon(p.y, p.mo, p.d) else { return 0 }
        return calendar.component(.weekday, from: d) - 1
    }

    /// `daysInMonth(y, mo)` with mo 1-based.
    public func daysInMonth(_ y: Int, _ mo: Int) -> Int {
        guard let first = noon(y, mo, 1),
              let range = calendar.range(of: .day, in: .month, for: first) else { return 31 }
        return range.count
    }

    /// `isDue(rule, day)` — a monthly rule clamps to the month's last day.
    public func isDue(_ rule: JSONObject?, _ day: String) -> Bool {
        guard let rule, !rule.truthy("deleted"), let p = Self.parts(day) else { return false }
        let wd = weekdayOf(day)
        switch rule.str("kind").string {
        case "daily":
            return true
        case "weekdays":
            return wd >= 1 && wd <= 5
        case "weekly":
            return rule.arr("days").contains { $0.finiteNumber == Double(wd) }
        case "monthly":
            // `p.d === Math.min(rule.day || 1, daysInMonth(...))`: a missing or zero day means the 1st,
            // and a day that is truthy but not a number makes the comparison NaN, so nothing is due.
            let raw = rule["day"]
            let want: Double
            if raw?.isTruthy == true {
                guard let n = raw?.finiteNumber else { return false }
                want = n
            } else {
                want = 1
            }
            return Double(p.d) == min(want, Double(daysInMonth(p.y, p.mo)))
        default:
            return false
        }
    }
}
