// Dates.swift — model.js's date functions. They are *local* calendar dates: the day a list rolls over
// is the day where the person is, not UTC. Every one anchors at noon so a DST change cannot move it.
// The timezone is explicit here rather than ambient, so the differential tests can pin the zone the
// Node generator ran in.
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

    /// `localDate(ts)` — the local calendar date as YYYY-MM-DD. Years under 1000 are not padded,
    /// because `d.getFullYear() + "-"` does not pad them either.
    public func localDate(_ ts: Double) -> String {
        let date = Date(timeIntervalSince1970: ts / 1000)
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        let m = c.month ?? 1, d = c.day ?? 1
        return "\(c.year ?? 1970)-\(m < 10 ? "0" : "")\(m)-\(d < 10 ? "0" : "")\(d)"
    }

    public func localDateNow() -> String { localDate(Self.now()) }

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
