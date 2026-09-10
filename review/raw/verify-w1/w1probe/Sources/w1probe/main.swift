import Foundation
import TodaysFiveCore

func say(_ s: String) { print(s); fflush(stdout) }
let chicago = TimeZone(identifier: "America/Chicago")!
let dates = CalendarDates(timeZone: chicago)
func at(_ s: String, _ tz: TimeZone = chicago) -> Double {
    let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"; f.timeZone = tz
    f.locale = Locale(identifier: "en_US_POSIX"); return f.date(from: s)!.timeIntervalSince1970 * 1000
}
func counts(_ doc: Doc) -> String { let t = doc.todayItems; return "\(t.filter(\.done).count)/\(t.count)" }
func face(_ doc: Doc) -> String { let t = doc.todayItems; return "0/\(t.count - t.filter(\.done).count)" }

say("# w1probe run \(Date())")

// ================================================================ W-F4: the stamp vs the mark
say("")
say("== W-F4: WatchLinkReconciler.reconcile after a payload stamped ahead of the Watch's clock ==")
func skew(_ label: String, _ aheadMs: Double) {
    let now = CalendarDates.now()
    let a = WatchLink(id: Base62.randomId(22), mode: .edit, name: "A")
    let b = WatchLink(id: Base62.randomId(22), mode: .edit, name: "B")
    let p1 = WatchLinkReconciler.reconcile(payload: WatchLinkPayload(links: [a], at: now + aheadMs),
                                           lastAppliedAt: 0, vault: [], selected: nil, now: now)
    let vault = p1.upsert
    func attempt(_ what: String, _ stamp: Double, _ links: [WatchLink]) -> String {
        let p = WatchLinkReconciler.reconcile(payload: WatchLinkPayload(links: links, at: stamp),
                                              lastAppliedAt: p1.appliedAt, vault: vault, selected: p1.select, now: stamp)
        return "\(what): applied=\(p.applied) upsert=\(p.upsert.count) remove=\(p.remove.count)"
    }
    say("-- \(label): first payload stamped now+\(Int(aheadMs)) ms → applied=\(p1.applied), mark = now+\(Int(p1.appliedAt - now)) ms, vault holds \(vault.count)")
    say("   " + attempt("honest removal (links=[]) 1 s later       ", now + 1_000, []))
    say("   " + attempt("honest new list at half the error         ", now + aheadMs / 2, [a, b]))
    say("   " + attempt("honest new list at mark − 1 ms             ", now + aheadMs - 1, [a, b]))
    say("   " + attempt("honest new list at mark exactly (at == mark)", now + aheadMs, [a, b]))
    say("   " + attempt("honest new list at mark + 1 ms             ", now + aheadMs + 1, [a, b]))
}
skew("10 minutes ahead", 600_000)
skew("1 hour ahead", 3_600_000)
skew("3 days ahead", 3 * 86_400_000)

// ================================================================ W-F5: rollover vs afterRollover
say("")
say("== W-F5: Model.rollover vs WatchSnapshot.afterRollover's 0/(total−done); today rolls to 2026-09-09 (a Wednesday) ==")
let dayBefore = at("2026-09-08T09:00:00")
let yesterday = at("2026-09-08T15:00:00")
let morning = at("2026-09-09T09:00:00")
func fiveLines(zone: String?) -> Doc {
    var doc = Doc.empty(id: Base62.randomId(22), name: "P", at: dayBefore)
    if let zone { doc.json.set("zone", zone) }
    for (i, t) in ["one", "two", "three", "four", "five"].enumerated() {
        doc = Model.addToToday(doc, text: t, at: dayBefore + Double(i))!.doc
    }
    return doc
}
func ids(_ doc: Doc) -> [String] { doc.todayItems.map(\.id) }
func rule(_ kind: String, days: [Double] = []) -> JSONObject {
    var r = JSONObject(); r.set("kind", kind)
    if !days.isEmpty { r["days"] = .array(days.map { .number($0) }) }
    return r
}
func offToday(_ doc: Doc, _ id: String) -> Doc {
    var out = doc; var items = out.items
    var it = items[JSString(id)]!.objectValue!; it.set("today", false); items[JSString(id)] = .object(it)
    out.items = items; return out
}
func addReturn(_ doc: Doc, _ id: String, on: String) -> Doc {
    var out = doc; var returns = out.returns
    var r = JSONObject(); r.set("id", id); r.set("on", on); r.set("updatedAt", yesterday)
    returns[JSString(id)] = .object(r); out.returns = returns; return out
}
func report(_ label: String, _ doc: Doc, at ts: Double = morning) {
    let r = Model.rollover(doc, at: ts, dates: dates)
    let after = counts(r.doc)
    let f = face(doc)
    let live = r.doc.todayItems.filter { !$0.done }.count
    let faceTotal = Int(f.dropFirst(2))!
    say("\(label): before=\(counts(doc))  face says \(f)  rollover gives \(after) (changed=\(r.changed))  → \(after == f ? "AGREE" : "DISAGREE: face total off by \(live - faceTotal)")")
}
do {
    var d = fiveLines(zone: "America/Chicago"); let i = ids(d)
    d = Model.setDone(d, i[0], true, at: yesterday); d = Model.setDone(d, i[1], true, at: yesterday + 1); d = Model.setDone(d, i[2], true, at: yesterday + 2)
    report("A  3 done, no rules                       ", d)
}
do {
    var d = fiveLines(zone: "America/Chicago"); let i = ids(d)
    d = Model.setRule(d, i[0], rule("daily"), at: dayBefore + 10, today: "2026-09-08")
    d = Model.setDone(d, i[0], true, at: yesterday); d = Model.setDone(d, i[1], true, at: yesterday + 1)
    report("B1 2 done, one of them daily              ", d)
}
do {
    var d = fiveLines(zone: "America/Chicago"); let i = ids(d)
    d = Model.setRule(d, i[0], rule("daily"), at: dayBefore + 10, today: "2026-09-08")
    d = Model.setRule(d, i[1], rule("daily"), at: dayBefore + 11, today: "2026-09-08")
    d = Model.setDone(d, i[0], true, at: yesterday); d = Model.setDone(d, i[1], true, at: yesterday + 1); d = Model.setDone(d, i[2], true, at: yesterday + 2)
    report("B2 3 done, two of them daily              ", d)
}
do {
    var d = fiveLines(zone: "America/Chicago"); let i = ids(d)
    d = Model.setRule(d, i[0], rule("weekly", days: [1]), at: dayBefore + 10, today: "2026-09-08")   // Mondays only
    d = Model.setDone(d, i[0], true, at: yesterday)
    report("B3 1 done, weekly rule NOT due tomorrow   ", d)
}
do {
    var d = fiveLines(zone: "America/Chicago"); let i = ids(d)
    d = Model.setRule(d, i[0], rule("weekly", days: [3]), at: dayBefore + 10, today: "2026-09-08")   // Wednesdays
    d = Model.setDone(d, i[0], true, at: yesterday)
    report("B4 1 done, weekly rule due tomorrow       ", d)
}
do {
    var d = fiveLines(zone: "America/Chicago"); let i = ids(d)
    d = Model.addToToday(d, text: "six", at: dayBefore + 5)!.doc
    let six = ids(d).first { !i.contains($0) }!
    d = Model.setRule(d, six, rule("daily"), at: dayBefore + 10, today: "2026-09-08")   // placed = 2026-09-08
    d = offToday(d, six)
    d = Model.setDone(d, i[0], true, at: yesterday)
    report("C  1 done + off-Today daily line (step 2) ", d)
}
do {
    var d = fiveLines(zone: "America/Chicago"); let i = ids(d)
    d = Model.addToToday(d, text: "six", at: dayBefore + 5)!.doc
    let six = ids(d).first { !i.contains($0) }!
    d = offToday(d, six)
    d = addReturn(d, six, on: "2026-09-09")
    d = Model.setDone(d, i[0], true, at: yesterday)
    report("R  1 done + off-Today line returning (step 3)", d)
}
do {
    var d = fiveLines(zone: nil); let i = ids(d)
    d = Model.setDone(d, i[0], true, at: at("2026-09-08T23:30:00"))
    for t in ["2026-09-09T00:05:00", "2026-09-09T05:29:00", "2026-09-09T05:31:00", "2026-09-09T09:00:00"] {
        report("D  NO zone, done 23:30, rollover at \(t.suffix(8))", d, at: at(t))
    }
}
do {
    var d = fiveLines(zone: "America/Chicago"); let i = ids(d)
    d = Model.setDone(d, i[0], true, at: at("2026-09-08T23:30:00"))
    report("Z  zoned, done 23:30, rollover at 00:05:00 ", d, at: at("2026-09-09T00:05:00"))
}

// ================================================================ W-F2: two engines, one store
say("")
say("== W-F2: AddService's throwaway engine and WatchStore's engine over ONE on-disk ListStore ==")
do {
    let dir = URL(fileURLWithPath: NSTemporaryDirectory()).[REDACTED]("w1-f2-\(UUID().uuidString)", isDirectory: true)
    let store = try ListStore(directory: dir)
    defer { try? FileManager.default.removeItem(at: dir) }
    let W = Base62.randomId(22)
    let keys = try Keys.fromLink(.edit, W)
    let transport = MemoryTransport()
    // the list already exists on the server (made elsewhere)
    let creator = SyncEngine(transport: transport)
    var seed = Doc.empty(id: W, name: "F2")
    for line in ["a", "b", "c"] { seed = Model.addToToday(seed, text: line)!.doc }
    await creator.open(keys, ListRecord(doc: seed, rev: 0, dirty: true, created: true))
    _ = await creator.sync()
    say("server: rev=\(await creator.current()?.rev ?? -1) today=\(await creator.document().todayItems.count)")

    // WatchStore.openList: engine over the App Group store, record from disk or the empty fallback; then start() syncs
    let watch = SyncEngine(transport: transport, store: store)
    await watch.open(keys, store.load(W) ?? ListRecord(doc: Doc.empty(id: W, at: 0), rev: 0, dirty: false, created: false, mode: .edit, origin: "mine"))
    _ = await watch.sync()
    say("watch engine after start(): memory today=\(await watch.document().todayItems.count)  disk today=\(store.load(W)?.doc.todayItems.count ?? -1)")

    // the wrist goes offline; the + runs AddService.add: a FRESH engine over the same store
    await transport.setOffline(true)
    let adder = SyncEngine(transport: transport, store: store)
    await adder.open(keys, store.load(W) ?? ListRecord(doc: Doc(), mode: .edit, origin: "mine"))
    await adder.pull()
    let before = await adder.document()
    let result = Model.addToToday(before, text: "added from the plus")!
    await adder.update(result.doc)
    await adder.push()
    let st = await adder.status
    say("AddService.add offline: status=\(st) (sentence would say \(st != .synced ? "'…on this watch, not up yet'" : "'Added …'"))  disk today=\(store.load(W)?.doc.todayItems.count ?? -1) disk dirty=\(store.load(W)?.dirty ?? false)")
    say("   WatchStore.doc (its engine's memory) today=\(await watch.document().todayItems.count)  ← the screen; nothing told it")

    // still offline, the person crosses a line off on the Watch: apply → engine.update + engine.push
    let wdoc = await watch.document()
    await watch.update(Model.setDone(wdoc, wdoc.todayItems[0].id, true))
    await watch.push()
    let d1 = store.load(W)!
    say("after a Watch check-off offline: disk today=\(d1.doc.todayItems.count) done=\(d1.doc.todayItems.filter(\.done).count) dirty=\(d1.dirty) diskHasAdd=\(d1.doc.items[result.id] != nil)  watch memory today=\(await watch.document().todayItems.count)")

    // back online: the next wrist raise → WatchStore.sync() → engine.sync()
    await transport.setOffline(false)
    _ = await watch.sync()
    let reader = SyncEngine(transport: transport)
    await reader.open(keys, ListRecord(doc: Doc.empty(id: W, at: 0), rev: 0, dirty: false, created: false))
    _ = await reader.sync()
    say("after the Watch's next sync online: SERVER hasAdd=\(await reader.document().items[result.id] != nil) today=\(await reader.document().todayItems.count)  watch memory today=\(await watch.document().todayItems.count)  disk dirty=\(store.load(W)?.dirty ?? false) diskHasAdd=\(store.load(W)?.doc.items[result.id] != nil)")

    // a relaunch or a list switch: openList loads the record from disk into an engine and syncs
    let relaunch = SyncEngine(transport: transport, store: store)
    await relaunch.open(keys, store.load(W)!)
    _ = await relaunch.sync()
    _ = await reader.sync()
    say("after a relaunch (open from disk + sync): SERVER hasAdd=\(await reader.document().items[result.id] != nil) today=\(await reader.document().todayItems.count)  disk dirty=\(store.load(W)?.dirty ?? false)")
}
say("")
say("done")
