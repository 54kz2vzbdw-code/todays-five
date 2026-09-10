import Foundation

let utc = TimeZone(identifier: "UTC")!
func tz(_ id: String) -> TimeZone { TimeZone(identifier: id)! }
func fmt(_ d: Date, _ z: TimeZone) -> String {
    let f = DateFormatter(); f.dateFormat = "MM-dd HH:mm:ss"; f.timeZone = z
    f.locale = Locale(identifier: "en_US_POSIX"); return f.string(from: d)
}
func at(_ s: String, _ z: TimeZone) -> Date {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"; f.timeZone = z
    f.locale = Locale(identifier: "en_US_POSIX"); return f.date(from: s)!
}
func ms(_ d: Date) -> Double { d.timeIntervalSince1970 * 1000 }
func policy(_ p: TimelineReloadPolicy, _ z: TimeZone) -> String {
    switch p {
    case .after(let d): return "after(\(fmt(d, z)))"
    case .atEnd: return "atEnd"
    case .never: return "never"
    }
}
func show(_ e: [SnapshotEntry], _ z: TimeZone) -> String {
    e.map { "\(fmt($0.date, z))→\($0.snapshot.done)/\($0.snapshot.total)" }.joined(separator: ", ")
}
func snap(zone: String, written: String, rollsAt: String?, done: Int, total: Int,
          viewOnly: Bool = false, hasList: Bool = true) -> WatchSnapshot {
    let z = tz(zone)
    return WatchSnapshot(hasList: hasList, name: "L", done: done, total: total, next: "x",
                         viewOnly: viewOnly, at: ms(at(written, z)),
                         rollsAt: rollsAt.map { ms(at($0, z)) } ?? 0)
}
/// Call the real `SnapshotTimeline.entries` at `start`, then again at every `.after` date it asks for,
/// always with the SAME snapshot — the app is not running, so the file on disk never changes.
func walk(_ label: String, zone: String, _ s: WatchSnapshot, start: String, steps: Int) {
    let z = tz(zone)
    print("== \(label) | zone=\(zone) written=\(fmt(Date(timeIntervalSince1970: s.at/1000), z)) \(s.done)/\(s.total) rollsAt=\(s.rollsAt == 0 ? "0" : fmt(Date(timeIntervalSince1970: s.rollsAt/1000), z)) viewOnly=\(s.viewOnly) hasList=\(s.hasList)")
    var now = at(start, z)
    for _ in 0..<steps {
        let (e, p) = SnapshotTimeline.entries(s, now: now)
        print("   getTimeline(now \(fmt(now, z)) local / \(fmt(now, utc)) UTC): [\(show(e, z))] policy=\(policy(p, z))")
        guard case .after(let next) = p else { break }
        now = next
    }
}
func once(_ label: String, zone: String, _ s: WatchSnapshot, now: String) {
    let z = tz(zone)
    let (e, p) = SnapshotTimeline.entries(s, now: at(now, z))
    print("   [\(label)] getTimeline(now \(now) \(zone)): [\(show(e, z))] policy=\(policy(p, z))")
}

// S1 — the claim's case: Chicago, written 22:00, 3/5, rollsAt next midnight; app never runs again
let s1 = snap(zone: "America/Chicago", written: "2026-09-08T22:00:00", rollsAt: "2026-09-09T00:00:00", done: 3, total: 5)
walk("S1 Chicago", zone: "America/Chicago", s1, start: "2026-09-08T22:00:00", steps: 4)
once("S1 at 09:00 next morning", zone: "America/Chicago", s1, now: "2026-09-09T09:00:00")
once("S1 at 23:59:59 (1 s before rollsAt)", zone: "America/Chicago", s1, now: "2026-09-08T23:59:59")
once("S1 at 00:00:00 (now == rollsAt)", zone: "America/Chicago", s1, now: "2026-09-09T00:00:00")
// what the second entry carries
do {
    let (e, _) = SnapshotTimeline.entries(s1, now: at("2026-09-08T22:00:00", tz("America/Chicago")))
    let sec = e[1].snapshot
    print("   [S1 second entry fields] done=\(sec.done) total=\(sec.total) at==rollsAt:\(sec.at == s1.rollsAt) rollsAt=\(sec.rollsAt) viewOnly=\(sec.viewOnly) hasList=\(sec.hasList)")
}

// S2 — east of UTC: Tokyo (+9), same local times
let s2 = snap(zone: "Asia/Tokyo", written: "2026-09-08T22:00:00", rollsAt: "2026-09-09T00:00:00", done: 3, total: 5)
walk("S2 Tokyo", zone: "Asia/Tokyo", s2, start: "2026-09-08T22:00:00", steps: 3)
once("S2 at 09:00 next morning", zone: "Asia/Tokyo", s2, now: "2026-09-09T09:00:00")

// S3 — a half-hour zone east of UTC: Kolkata (+5:30)
let s3 = snap(zone: "Asia/Kolkata", written: "2026-09-08T22:00:00", rollsAt: "2026-09-09T00:00:00", done: 2, total: 5)
walk("S3 Kolkata", zone: "Asia/Kolkata", s3, start: "2026-09-08T22:00:00", steps: 2)

// S4 — rollsAt two days stale (the app last ran the evening of the 6th)
let s4 = snap(zone: "America/Chicago", written: "2026-09-06T22:00:00", rollsAt: "2026-09-07T00:00:00", done: 3, total: 5)
walk("S4 rollsAt two days stale", zone: "America/Chicago", s4, start: "2026-09-09T10:00:00", steps: 2)

// S5 — rollsAt = 0 (zone the platform cannot compute in), and hasList = false
walk("S5 rollsAt=0", zone: "America/Chicago", snap(zone: "America/Chicago", written: "2026-09-08T22:00:00", rollsAt: nil, done: 3, total: 5), start: "2026-09-08T22:00:00", steps: 2)
walk("S6 hasList=false", zone: "America/Chicago", snap(zone: "America/Chicago", written: "2026-09-08T22:00:00", rollsAt: "2026-09-09T00:00:00", done: 0, total: 0, hasList: false), start: "2026-09-08T22:00:00", steps: 1)

// S7 — a view-only list: does the function still roll it at midnight?
walk("S7 viewOnly=true", zone: "America/Chicago", snap(zone: "America/Chicago", written: "2026-09-08T22:00:00", rollsAt: "2026-09-09T00:00:00", done: 3, total: 5, viewOnly: true), start: "2026-09-08T22:00:00", steps: 2)
