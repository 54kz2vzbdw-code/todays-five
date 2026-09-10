import Foundation
import TodaysFiveCore

func say(_ s: String) { print(s); fflush(stdout) }
let chicago = TimeZone(identifier: "America/Chicago")!
let dates = CalendarDates(timeZone: chicago)
func at(_ s: String, _ tz: TimeZone = chicago) -> Double {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"; f.timeZone = tz
    f.locale = Locale(identifier: "en_US_POSIX"); return f.date(from: s)!.timeIntervalSince1970 * 1000
}

// ================================================================ (b) SyncEngine.current() after open
say("== (b) SyncEngine.current() for a list the Watch has never pulled ==")
do {
    let W = Base62.randomId(22)
    let keys = try Keys.fromLink(.edit, W)
    let transport = MemoryTransport()
    let creator = SyncEngine(transport: transport)
    await creator.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
    let created = await creator.sync()
    say("creator: status=\(created) rev=\(await creator.current()?.rev ?? -1) todayItems=\(await creator.document().todayItems.count)")

    let watch = SyncEngine(transport: transport)             // a fresh engine, as WatchStore makes one per list
    say("watch before open: current()=\(await watch.current() == nil ? "nil" : "non-nil")")
    // exactly WatchStore.openList's record for a link with nothing in the store
    await watch.open(keys, ListRecord(doc: Doc.empty(id: W, at: 0), rev: 0, dirty: false, created: false, mode: .edit, origin: "mine"))
    let snap = await watch.current()
    say("watch after open:  current()=\(snap == nil ? "nil" : "non-nil") rev=\(snap?.rev ?? -1) dirty=\(snap?.dirty ?? false) todayItems=\(await watch.document().todayItems.count)")
    let status = await watch.sync()
    say("watch after sync:  status=\(status) rev=\(await watch.current()?.rev ?? -1) todayItems=\(await watch.document().todayItems.count)")
}

// ================================================================ (d) rollover vs afterRollover
say("")
say("== (d) what rollover does to Today vs what WatchSnapshot.afterRollover assumes (total - done) ==")
func probeDoc() -> Doc {
    var doc = Doc.empty(id: Base62.randomId(22), name: "Probe", at: at("2026-09-08T09:00:00"))
    doc.json.set("zone", "America/Chicago")
    for (i, line) in ["one", "two", "three", "four", "five"].enumerated() {
        doc = Model.addToToday(doc, text: line, at: at("2026-09-08T09:00:00") + Double(i))!.doc
    }
    return doc
}
func counts(_ doc: Doc) -> (done: Int, total: Int) {
    let t = doc.todayItems; return (t.filter(\.done).count, t.count)
}
let yesterday = at("2026-09-08T15:00:00")
let morning = at("2026-09-09T09:00:00")

// A: two lines finished yesterday, no rules
do {
    var doc = probeDoc()
    let ids = doc.todayItems.map(\.id)
    doc = Model.setDone(doc, ids[0], true, at: yesterday)
    doc = Model.setDone(doc, ids[1], true, at: yesterday + 1)
    let before = counts(doc)
    let after = counts(Model.rollover(doc, at: morning, dates: dates).doc)
    say("A plain:     before done=\(before.done)/\(before.total)  afterRollover assumes 0/\(before.total - before.done)  rollover gives \(after.done)/\(after.total)  \(after.total == before.total - before.done ? "agree" : "DISAGREE")")
}
// B: one of the two finished lines is a daily recurring line
do {
    var doc = probeDoc()
    let ids = doc.todayItems.map(\.id)
    doc = Model.setDone(doc, ids[0], true, at: yesterday)
    doc = Model.setDone(doc, ids[1], true, at: yesterday + 1)
    var rule = JSONObject()
    rule.set("id", ids[0]); rule.set("kind", "daily"); rule.set("text", "one"); rule.set("note", "")
    rule.set("sectionId", ""); rule.set("updatedAt", yesterday)
    var rules = doc.rules; rules[JSString(ids[0])] = .object(rule); doc.rules = rules
    let before = counts(doc)
    let after = counts(Model.rollover(doc, at: morning, dates: dates).doc)
    say("B daily rule: before done=\(before.done)/\(before.total)  afterRollover assumes 0/\(before.total - before.done)  rollover gives \(after.done)/\(after.total)  \(after.total == before.total - before.done ? "agree" : "DISAGREE (face under-counts by \(after.total - (before.total - before.done)))")")
}
// C: a recurring line that is off Today, undone, due today (step 2 places it)
do {
    var doc = probeDoc()
    let ids = doc.todayItems.map(\.id)
    var items = doc.items
    var off = items[JSString(ids[4])]!.objectValue!; off.set("today", false); items[JSString(ids[4])] = .object(off); doc.items = items
    var rule = JSONObject()
    rule.set("id", ids[4]); rule.set("kind", "daily"); rule.set("text", "five"); rule.set("note", "")
    rule.set("sectionId", ""); rule.set("updatedAt", yesterday)
    var rules = doc.rules; rules[JSString(ids[4])] = .object(rule); doc.rules = rules
    let before = counts(doc)
    let after = counts(Model.rollover(doc, at: morning, dates: dates).doc)
    say("C due rule off Today: before done=\(before.done)/\(before.total)  afterRollover assumes 0/\(before.total - before.done)  rollover gives \(after.done)/\(after.total)  \(after.total == before.total - before.done ? "agree" : "DISAGREE (face under-counts by \(after.total - (before.total - before.done)))")")
}
// D: no home zone, a line finished 30 minutes before midnight (the six-hour guard)
do {
    var doc = probeDoc()
    var j = doc.json; j["zone"] = nil; doc = Doc(j)
    let ids = doc.todayItems.map(\.id)
    doc = Model.setDone(doc, ids[0], true, at: at("2026-09-08T23:30:00"))
    let before = counts(doc)
    let after = counts(Model.rollover(doc, at: at("2026-09-09T00:05:00"), dates: dates).doc)
    let later = counts(Model.rollover(doc, at: at("2026-09-09T09:00:00"), dates: dates).doc)
    say("D no zone, done 23:30: afterRollover assumes 0/\(before.total - before.done)  rollover at 00:05 gives \(after.done)/\(after.total)  at 09:00 gives \(later.done)/\(later.total)")
}

// ================================================================ (f) the stamp and the clock
say("")
say("== (f) a phone clock one hour ahead, then corrected ==")
do {
    let now = CalendarDates.now()
    let link = WatchLink(id: Base62.randomId(22), mode: .edit, name: "A")
    let ahead = WatchLinkPayload(links: [link], at: now + 3_600_000)          // sent while the clock was 1 h ahead
    let p1 = WatchLinkReconciler.reconcile(payload: ahead, lastAppliedAt: 0, vault: [], selected: nil, now: now)
    say("1. ahead payload: applied=\(p1.applied) appliedAt-now=+\(Int(p1.appliedAt - now)) ms  (the Watch now holds a mark 1 h in its own future)")
    let removal = WatchLinkPayload(links: [], at: now + 1_000)               // clock corrected; Remove from this device
    let p2 = WatchLinkReconciler.reconcile(payload: removal, lastAppliedAt: p1.appliedAt, vault: p1.upsert, selected: p1.select, now: now + 1_000)
    say("2. honest removal 1 s later: applied=\(p2.applied) remove=\(p2.remove.count)  → the list stays on the wrist")
    let newLink = WatchLinkPayload(links: [link, WatchLink(id: Base62.randomId(22), mode: .edit, name: "B")], at: now + 3_599_000)
    let p3 = WatchLinkReconciler.reconcile(payload: newLink, lastAppliedAt: p1.appliedAt, vault: p1.upsert, selected: p1.select, now: now + 3_599_000)
    say("3. a new list 59 min 59 s later: applied=\(p3.applied)")
    let p4 = WatchLinkReconciler.reconcile(payload: WatchLinkPayload(links: newLink.links, at: now + 3_600_001), lastAppliedAt: p1.appliedAt, vault: p1.upsert, selected: p1.select, now: now + 3_600_001)
    say("4. the same, 1 h 0.001 s later: applied=\(p4.applied) upsert=\(p4.upsert.count)  → outage = the clock error, to the millisecond")
}

// ================================================================ (g) the complication timeline
say("")
say("== (g) SnapshotTimeline.entries, verbatim, with WidgetKit stubbed: what the face shows across midnight when the app never runs ==")
struct Snap { var hasList = false; var done = 0; var total = 0; var at = 0.0; var rollsAt = 0.0
    var afterRollover: Snap { var out = self; out.done = 0; out.total = total - done; out.at = rollsAt; out.rollsAt = 0; return out } }
enum Policy { case after(Date) }
// ComplicationsProvider.swift:52-65 at 7341981, copied, WidgetKit's two types stubbed above
func entries(_ snapshot: Snap, now: Date) -> ([(date: Date, snapshot: Snap)], Policy) {
    let first = (date: now, snapshot: snapshot)
    guard snapshot.hasList, snapshot.rollsAt > 0 else { return ([first], .after(now.addingTimeInterval(3600))) }
    let midnight = Date(timeIntervalSince1970: snapshot.rollsAt / 1000)
    guard midnight > now else { return ([first], .after(now.addingTimeInterval(3600))) }
    let second = (date: midnight, snapshot: snapshot.afterRollover)
    return ([first, second], .after(midnight.addingTimeInterval(60)))
}
do {
    let f = DateFormatter(); f.dateFormat = "MM-dd HH:mm:ss"; f.timeZone = chicago
    let disk = Snap(hasList: true, done: 3, total: 5, at: at("2026-09-08T22:00:00"), rollsAt: at("2026-09-09T00:00:00"))
    var now = Date(timeIntervalSince1970: at("2026-09-08T22:00:00") / 1000)
    for step in 0..<4 {
        let (e, p) = entries(disk, now: now)        // `disk` never changes: the app is not running
        let shown = e.map { "\(f.string(from: $0.date))→\($0.snapshot.done)/\($0.snapshot.total)" }.joined(separator: ", ")
        guard case let .after(next) = p else { fatalError() }
        say("getTimeline at \(f.string(from: now)): entries=[\(shown)] reload at \(f.string(from: next))")
        now = next
        if step == 0 { say("   → on the face at 00:00:30: 0/2 (the midnight entry)") }
    }
    say("   → the face reads 3/5 again from the 00:01 reload until the app runs")
}
say("")
say("done")
