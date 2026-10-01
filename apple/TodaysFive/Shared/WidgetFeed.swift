// WidgetFeed.swift — the one way a widget reaches a list: the vault's key, the core's engine, the server.
//
// Compiled into the app and the widget extension. A widget that crosses a line off cannot hand the tap to the app —
// the app may not be running, and on the phone the list lives in a web page — so the extension does what the
// Watch and the *Add to Today's Five* intent do: read the link out of the Keychain (shared with the extension by
// its keychain access group), derive the keys, open a `SyncEngine`, pull, change, push. Nothing is kept on disk
// but Today's lines (WidgetShelf.swift); the engine's document lives as long as the call.
//
// It never logs a word of a list, an id, a link or a key.
import Foundation
import TodaysFiveCore

struct WidgetFeed: Sendable {
    var vault: any LinkVault
    var makeTransport: @Sendable () -> (any Transport)?
    var now: @Sendable () -> Double = { CalendarDates.now() }

    static func live() -> WidgetFeed {
        #if DEBUG
        let config = WidgetShelf.debugServer ?? .fromRepo
        #else
        let config = SupabaseConfig.fromRepo
        #endif
        return WidgetFeed(vault: KeychainLinkVault(), makeTransport: { try? SupabaseTransport(config: config) })
    }

    func links() -> [VaultedLink] { (try? vault.all()) ?? [] }

    func link(forKey key: String) -> VaultedLink? {
        guard !key.isEmpty else { return nil }
        return links().first { WidgetShelf.key(for: $0.id) == key }
    }

    /// The list a widget shows when it has not been told which: the one open in the app, else the first held.
    func defaultKey() -> String? {
        if let open = WidgetIndex.read()?.open, !open.isEmpty, link(forKey: open) != nil { return open }
        return links().first.map { WidgetShelf.key(for: $0.id) }
    }

    /// A shared list goes by its nickname, as on the page (app.js paintListName); else the list's own name.
    static func displayName(_ link: VaultedLink, doc: Doc? = nil) -> String {
        if link.origin == "shared", !link.nickname.isEmpty { return link.nickname }
        if let n = doc?.name.string, !n.isEmpty { return n }
        if !link.name.isEmpty { return link.name }
        return "Today's Five"
    }

    // ---------------------------------------------------------------- reading

    /// Read the list from the server, send any check-off made on a widget that has not landed, and put Today on the
    /// shelf. Offline, or refused: what the shelf already has, untouched. A list the server says is gone is marked so.
    @discardableResult
    func refresh(_ key: String) async -> WidgetDay? {
        guard let link = link(forKey: key) else { return nil }
        let shelf = WidgetDay.read(key: key)
        guard let keys = try? Keys.fromLink(link.mode, link.id) else { return shelf }
        let engine = SyncEngine(transport: makeTransport(), store: nil)
        await engine.open(keys, ListRecord(doc: Doc(), mode: link.mode, origin: link.origin))
        await engine.pull()
        var status = await engine.status
        if status == .gone {
            // Gone only if it was here: a list this widget has never read may simply not be on the server yet (made
            // on the page a moment ago, or offline), and saying it "isn't here any more" would be untrue. A list
            // deleted or given new keys elsewhere was read before, and the page lets go of it soon after.
            guard var gone = shelf, gone.at > 0, !gone.gone else { return shelf }
            gone.key = key; gone.name = Self.displayName(link); gone.gone = true; gone.lines = []; gone.at = now()
            gone.write()
            return gone
        }
        guard status == .synced else { return shelf }

        // the check-offs that were waiting: each at the moment it was made, so a later change elsewhere still wins
        let waiting = WidgetPending.of(key)
        if !waiting.isEmpty {
            if link.mode == .edit {
                // The page rolls a list over before a tap can land on it, and so does a write from here. Without it a
                // repeating line crossed off yesterday is still done on the server this morning (the widget shows it
                // undone, as rollover will), setDone finds it already done and does nothing, and the line comes back.
                var doc = Model.rollover(await engine.document(), at: now()).doc
                for op in waiting { doc = Model.setDone(doc, op.id, op.done, at: op.at) }
                await engine.update(doc)
                await engine.push()
                status = await engine.status
                if status == .synced || status == .readonly || status == .gone { WidgetPending.clear(waiting) }
            } else {
                WidgetPending.clear(waiting) // a View link never pushes: nothing to wait for
            }
        }
        let day = Self.day(await engine.document(), link: link, key: key, at: now())
        day.write()
        return day
    }

    /// Today for a widget: the page's own order, after the rollover the page would run on opening this list (an edit
    /// link's; a View link shows what its editors last sent, as the page does), and the list's next midnight.
    static func day(_ doc: Doc, link: VaultedLink, key: String, at ts: Double) -> WidgetDay {
        let shown = link.mode == .edit ? Model.rollover(doc, at: ts).doc : doc
        var day = WidgetDay()
        day.key = key
        day.name = displayName(link, doc: doc)
        day.viewOnly = link.mode == .view
        day.lines = shown.todayItems.map {
            WidgetLine(id: $0.id, text: $0.text, note: $0.note, done: $0.done, order: $0.todayOrder, doneAt: $0.doneAt)
        }
        day.at = ts
        day.rollsAt = nextMidnight(doc, after: ts)
        return day
    }

    /// The list's next midnight in its home zone, in ms — the Watch's `nextRollover`, for any moment.
    static func nextMidnight(_ doc: Doc, after ts: Double) -> Double {
        let zone = CalendarDates.zoneOf(doc)
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = zone.isEmpty ? TimeZone.current : (TimeZone(identifier: zone) ?? TimeZone.current)
        guard let next = calendar.nextDate(after: Date(timeIntervalSince1970: ts / 1000),
                                           matching: DateComponents(hour: 0, minute: 0, second: 0),
                                           matchingPolicy: .nextTime) else { return 0 }
        return next.timeIntervalSince1970 * 1000
    }

    // ---------------------------------------------------------------- crossing off

    /// A line crossed off or brought back from a widget. The shelf changes first, so the widget redraws with it
    /// whatever the network does; the op waits on the shelf until the server has it (`refresh` sends it).
    @discardableResult
    func setDone(_ key: String, _ id: String, _ done: Bool) async -> WidgetDay? {
        guard let link = link(forKey: key), link.mode == .edit else { return WidgetDay.read(key: key) }
        let at = now()
        if let day = WidgetDay.read(key: key) { day.with(id, done: done, at: at).write() }
        WidgetPending.add(WidgetPending(key: key, id: id, done: done, at: at))
        return await refresh(key)
    }

    // ---------------------------------------------------------------- the app's side

    /// Which lists this phone holds, and which is open — written by the app whenever the vault or the open list
    /// moves. A list the phone no longer holds comes off the shelf with its lines and any check-off still waiting.
    @discardableResult
    func publishIndex(openId: String?) -> Bool {
        let held = links()
        let refs = held.map { WidgetListRef(key: WidgetShelf.key(for: $0.id), name: Self.displayName($0),
                                            viewOnly: $0.mode == .view, shared: $0.origin == "shared") }
        let open = openId.flatMap { id in held.contains { $0.id == id } ? WidgetShelf.key(for: id) : nil } ?? refs.first?.key ?? ""
        let keep = Set(refs.map(\.key))
        let gone = Set(WidgetShelf.dayKeys()).subtracting(keep)
        for key in gone { WidgetShelf.remove(WidgetDay.file(key)) }
        if !gone.isEmpty { WidgetPending.forget(keys: gone) }
        return WidgetIndex(lists: refs, open: open).write() || !gone.isEmpty
    }
}
