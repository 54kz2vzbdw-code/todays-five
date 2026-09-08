// WatchStore.swift — the app's one model object: the vault the phone fills, the store on disk, a
// sync engine per open list, the selection, the shuffle pick and the finale's edge.
//
// Everything a view knows, it reads from here. Every rule about the *document* is the core's — the
// check-off's three fields, the add, Start again, rollover, merge — and this file only decides when
// to call them and what to do with the answer. That division is not tidiness: a rule written twice
// is a rule that will disagree with itself on somebody's list, and the Watch is the third client of
// the same document.
//
// **Isolation.** The whole object is on the main actor, because everything it holds exists to be
// read by a SwiftUI view on the very next frame, and because a gesture is where every write starts.
// `SyncEngine` is an actor and `ListStore` is `Sendable`, so the only crossing is at `await`, and the
// writes are put through one chained task (`chain`) so two taps in a burst reach the engine in the
// order the person made them.
import Foundation
import Observation
import TodaysFiveCore
import WatchKit
import WidgetKit

@MainActor
@Observable
final class WatchStore {

    /// One line of Today, as a view needs it. Deliberately not `Item`: a row is an id, a string and a
    /// flag, and nothing in a view should be able to reach the record behind it.
    struct Row: Identifiable, Equatable, Sendable {
        let id: String
        let text: String
        let done: Bool
    }

    /// The quiet mark beside the title: four states, one glyph, no sentence.
    enum SyncMark: String, Sendable {
        case synced, syncing, offline, busy

        /// SF Symbols, and they have to read at 11 points on a dimmed screen.
        var symbol: String {
            switch self {
            case .synced: return "checkmark.circle.fill"
            case .syncing: return "arrow.triangle.2.circlepath"
            case .offline: return "bolt.horizontal.circle"
            case .busy: return "exclamationmark.circle"
            }
        }

        /// The engine has more states than a wrist has room for, so they fold. `busy` is everything
        /// the server refused for a reason a person cannot act on from a watch — 429, 507, 413, a
        /// token that is not the row's — and `offline` is the two that mean "try again later".
        init(_ status: SyncEngine.Status) {
            switch status {
            case .syncing: self = .syncing
            case .synced, .off: self = .synced
            case .offline: self = .offline
            case .busy, .full, .toolarge, .readonly, .error, .gone, .unreadable: self = .busy
            }
        }
    }

    // ---------------------------------------------------------------- what a view reads

    private(set) var doc = Doc()
    /// The vaulted links, most recently seen first — the order the picker shows them in.
    private(set) var links: [VaultedLink] = []
    private(set) var selected: String?
    private(set) var mark: SyncMark = .synced
    /// The finale card is on screen. It is set 300 ms *after* the check-off that caused it, which is
    /// the web's own hold, so the two feel like one product.
    private(set) var finaleShowing = false
    /// A list has been opened at least once, so an empty screen can say which empty it is.
    private(set) var opened = false

    /// The row order the view is showing, frozen for the length of the settle. The **document
    /// changes at once** — only the re-order waits, 320 ms after a check-off and 160 after an
    /// uncheck, which is `app.js`'s `afterChange({ delay })`.
    private(set) var frozenOrder: [String]?

    /// Bumped by a shuffle gesture. `shuffled` below is deliberately not observed, so this is what
    /// tells SwiftUI a gesture happened; a view that shows the one-thing line must read it.
    private(set) var shuffleTick = 0
    /// Bumped by the wobble — 0 or 1 undone, where the web wobbles the row and changes nothing.
    private(set) var wobbleTick = 0

    // ---------------------------------------------------------------- what it holds

    let haptics = WatchHaptics()

    /// The shuffle pick. **Not observed, on purpose.** It is cleared *lazily, inside render* the
    /// moment the shuffled line stops being undone (`oneThingLine` below), which is exactly what
    /// `renderToday` does — and a stored property SwiftUI is watching cannot be written during a
    /// body evaluation. Every way the pick goes stale except the gesture is a change to `doc`, which
    /// is observed and re-renders on its own; the gesture bumps `shuffleTick`.
    @ObservationIgnored private var shuffled: String?

    @ObservationIgnored private let receiver: WatchLinkReceiver
    @ObservationIgnored private var store: ListStore?
    /// False when the App Group container was not there and the store fell back to Application
    /// Support. Reported by the self-test, because a complication reading an empty directory looks
    /// exactly like a list with nothing on it.
    @ObservationIgnored private(set) var usingAppGroup = false
    @ObservationIgnored private let transport: (any Transport)?
    @ObservationIgnored private var engines: [String: SyncEngine] = [:]
    @ObservationIgnored private var keys: ListKeys?
    @ObservationIgnored private var openId: String?

    /// Whether there is a list on screen. Not the same question as "has the phone named one": a link
    /// whose keys will not derive is selected and not open, and branching the empty state on the
    /// phone's selection alone showed a live Today with nothing behind it.
    private(set) var hasOpenList = false

    @ObservationIgnored private var settleTask: Task<Void, Never>?
    @ObservationIgnored private var finaleTask: Task<Void, Never>?
    @ObservationIgnored private var pending: Task<Void, Never>?
    /// The finale's edge detector — `wasAll` in `app.js`, and it lives here for the same reason: the
    /// finale fires when the list *becomes* complete, never when it merely is.
    @ObservationIgnored private var wasAllDone = false

    /// True in `-TFWatchDemo`: a seeded local list over `MemoryTransport`, no phone and no network,
    /// and nothing spent from the server's create limit.
    @ObservationIgnored private(set) var isDemo = false

    // ---------------------------------------------------------------- making one

    init(receiver: WatchLinkReceiver = WatchLinkReceiver(), transport: (any Transport)? = nil) {
        #if DEBUG
        let demo = ProcessInfo.processInfo.arguments.contains("-TFWatchDemo")
        #else
        let demo = false        // the demo list and the self-test do not exist in a shipped build
        #endif
        self.isDemo = demo
        self.receiver = receiver
        // The whole choice sits inside the conditional rather than the demo branch alone: with
        // `demo` a compile-time `false` in a Release build, an `else if demo` leaves a branch the
        // optimiser can see is dead and the shipping configuration warns "will never be executed" —
        // a warning only a Release build shows, which is the one nobody runs by habit.
        if let transport {
            self.transport = transport
        } else {
            #if DEBUG
            // config.js in local-only mode throws here, and that is a valid state: the list still
            // opens from disk and every edit is kept, it simply never leaves the wrist.
            self.transport = demo ? MemoryTransport() : (try? SupabaseTransport())
            #else
            self.transport = try? SupabaseTransport()
            #endif
        }
    }

    /// The store lives in the **App Group**, not Application Support, because the complication is a
    /// separate process that has to read the same list.
    ///
    /// `containerURL(forSecurityApplicationGroupIdentifier:)` returns nil *silently* whenever the
    /// entitlement is not in the running binary, so the fallback says which one it got. A
    /// complication reading an empty directory is otherwise indistinguishable from a list with
    /// nothing on it, and that is a bug nobody would find by looking at the screen.
    private static func makeStore() -> (ListStore?, Bool) {
        if let group = WatchGroup.container,
           let shared = try? ListStore(directory: group.appendingPathComponent("lists", isDirectory: true)) {
            return (shared, true)
        }
        return (try? ListStore(), false)
    }

    // ---------------------------------------------------------------- lifecycle

    /// Called once, from the root view's `.task`.
    func start() async {
        let (made, group) = Self.makeStore()
        store = made
        usingAppGroup = group
        #if DEBUG
        print("[tfive] watch: store=\(group ? "appGroup" : "fallback(ApplicationSupport)")")
        #endif

        if isDemo {
            #if DEBUG
            await startDemo()
            #endif
            return
        }

        receiver.onChange = { [weak self] in self?.linksChanged() }
        receiver.start()
        linksChanged()
        await sync()
    }

    /// The phone said something: a link arrived, a link went, or the selection moved.
    private func linksChanged() {
        links = receiver.links
        let want = receiver.selected
        guard want != openId else {
            selected = want
            return
        }
        selected = want
        if let want {
            openList(want)
            Task { await sync() }
        } else {
            // The phone holds no lists. Nothing is on screen and nothing is open — but the store
            // keeps whatever it has, because the way back is the phone naming the link again.
            closeList()
        }
    }

    /// Show a different list. The picker's one job.
    func select(_ id: String) {
        guard id != openId else { return }
        receiver.select(id)          // the receiver remembers it; `onChange` brings it back here
    }

    /// Open a list: derive its keys, hand the engine what the store holds, roll it over, show it.
    private func openList(_ id: String) {
        guard let link = links.first(where: { $0.id == id }),
              let derived = try? Keys.fromLink(link.mode, id) else {
            closeList()
            return
        }
        keys = derived
        openId = id
        hasOpenList = true
        // Never `created: true`. A list this Watch did not make must never be inserted on the server:
        // a row that is gone is gone, and re-creating it is how a rotated link comes back from the
        // dead. `SyncEngine` refuses on exactly this flag.
        let record = store?.load(id)
            ?? ListRecord(doc: Doc.empty(id: id, at: 0), rev: 0, dirty: false, created: false,
                          mode: link.mode, origin: link.origin)
        let engine = engines[id] ?? SyncEngine(transport: transport, store: store)
        engines[id] = engine
        doc = record.doc
        // Eagerly on open, and again when one-thing mode is entered or left: a pick from the list
        // that was on screen a moment ago means nothing here.
        shuffled = nil
        frozenOrder = nil
        settleTask?.cancel()
        finaleTask?.cancel()
        finaleShowing = false
        wasAllDone = allDone
        opened = true
        chain { await $0.open(derived, record) }
        // Rollover on open — the first of the web's two call sites. An **edit link only**: a view
        // link never rolls, because rolling writes records and a view link may not.
        rollIfNeeded()
        publish()
    }

    private func closeList() {
        keys = nil
        openId = nil
        hasOpenList = false
        doc = Doc()
        shuffled = nil
        frozenOrder = nil
        finaleShowing = false
        wasAllDone = false
        publish()
    }

    // ---------------------------------------------------------------- the beat

    /// The scene became active — a wrist raise that shows the app.
    ///
    /// This is one of the three occasions the recurring rollover hangs off, and it is worth saying
    /// why it is not a timer. The web runs rollover on a `setInterval(…, 60000)`; a watchOS app is
    /// suspended seconds after the wrist drops, so a minute timer copied across never fires, and it
    /// fails **silently** — no log, no crash, just yesterday's finished lines still on Today at nine
    /// in the morning, which is the exact bug that second call site exists to prevent. So the beat is
    /// a list of moments rather than a clock: this, a sync completing, and a background refresh.
    func sceneBecameActive() {
        rollIfNeeded()
        Task { await sync() }
    }

    /// Woken in the background — a phone send, or the daily refresh. Same beat, no screen.
    func wokeInBackground() async {
        rollIfNeeded()
        await sync()
        scheduleNextRefresh()
    }

    /// One background refresh a day, asked for at the list's next midnight in its home zone, which is
    /// the moment the face would otherwise start showing yesterday. watchOS keeps one request at a
    /// time and may honour it late; that is fine, because the timeline already carries the midnight
    /// entry and this only has to correct it eventually.
    func scheduleNextRefresh() {
        let when = nextRollover()
        let date = when > 0 ? Date(timeIntervalSince1970: when / 1000) : Date().addingTimeInterval(6 * 3600)
        WKApplication.shared().scheduleBackgroundRefresh(withPreferredDate: date, userInfo: nil) { _ in
            // Nothing useful to say: a refusal here means the system declined the slot, and the next
            // launch asks again. Never a log with a date in it.
        }
    }

    /// Rollover, in the list's home zone, through the core's pure function. Idempotent by
    /// construction, so calling it on every occasion costs a comparison when there is nothing to do.
    func rollIfNeeded() {
        guard canEdit else { return }
        let result = Model.rollover(doc)
        guard result.changed else { return }
        apply(result.doc, local: true)
    }

    // ---------------------------------------------------------------- sync

    /// Pull, then push anything pending. **No realtime**: a poll while the app is on screen, with
    /// `p_rev`, so an unchanged poll costs bytes rather than a document.
    func sync() async {
        await chain { [weak self] engine in
            guard let self else { return }
            // An engine that has not been opened yet holds an empty document, and reading one here
            // would put an empty list on screen a frame before the real one — which is exactly what
            // happened the first time this went through a `Task` of its own instead of the chain.
            guard await engine.current() != nil else { return }
            self.mark = .syncing
            // What is on screen before the await, so an edit made *during* the pull is not wiped by
            // the read-back after it. A tap crosses a line off, the engine hears it through the
            // chain, and this document — fetched a moment later — already contains it; but a tap
            // that lands while `sync()` is suspended would be overwritten by a `fresh` that predates
            // it. The engine merges; the screen must not un-merge.
            let before = self.doc.canon
            _ = await engine.sync()
            let fresh = await engine.document()
            if self.doc.canon != before {
                // Someone edited while we were away. The engine already has that edit and will fold
                // the server's copy into it; the next sync brings the union down. Leave the screen.
                self.mark = .synced
            } else if fresh.canon != before {
                self.apply(fresh, local: false)
            }
            // A sync completing is the second of the three occasions the recurring rollover hangs off.
            self.rollIfNeeded()
            self.publish()
        }?.value
    }

    private var currentEngine: SyncEngine? {
        guard let openId else { return nil }
        return engines[openId]
    }

    /// **Every** engine interaction goes through one chained task, so an open, two taps in a burst
    /// and a poll all reach the actor in the order they were asked for. Separate `Task`s into an
    /// actor give no such promise, and the order of two check-offs is the difference between a
    /// `doneAt` that sinks the right line and one that does not — while an open that lost its race
    /// with a poll put an empty document on screen, which is how this rule was learned.
    @discardableResult
    private func chain(_ work: @escaping @MainActor (SyncEngine) async -> Void) -> Task<Void, Never>? {
        guard let engine = currentEngine else { return nil }
        let prior = pending
        let task = Task { @MainActor [weak self] in
            await prior?.value
            await work(engine)
            let status = await engine.status
            self?.mark = SyncMark(status)
        }
        pending = task
        return task
    }

    // ---------------------------------------------------------------- reading the list

    /// Today, in the order the view is showing it.
    ///
    /// `doc.todayItems` is already `sortSink` — undone by `todayOrder`, done sinking by `doneAt` —
    /// and nothing here re-sorts it. During a settle the ids are held in the order the view had them
    /// when the tap landed; a line that order does not name (one that arrived from another device
    /// mid-settle) goes to the end in the order the sink gave it.
    var rows: [Row] {
        let items = doc.todayItems.map { Row(id: $0.id, text: $0.text, done: $0.done) }
        guard let frozen = frozenOrder else { return items }
        var index: [String: Int] = [:]
        for (i, id) in frozen.enumerated() { index[id] = i }
        return items.enumerated().sorted { a, b in
            let ia = index[a.element.id] ?? (frozen.count + a.offset)
            let ib = index[b.element.id] ?? (frozen.count + b.offset)
            return ia < ib
        }.map(\.element)
    }

    var doneCount: Int { doc.todayItems.filter(\.done).count }
    var totalCount: Int { doc.todayItems.count }
    var allDone: Bool { totalCount > 0 && doneCount == totalCount }

    /// The open link, when there is one.
    var link: VaultedLink? { openId.flatMap { id in links.first { $0.id == id } } }

    /// A shared list goes by its `nickname` when it has one, else by the document's name — which is
    /// `app.js`'s own rule for the same two fields.
    var title: String {
        guard let link else { return "Today's Five" }
        if !link.nickname.isEmpty { return link.nickname }
        let name = doc.name.string
        if !name.isEmpty { return name }
        return link.name.isEmpty ? "Today's Five" : link.name
    }

    var isShared: Bool { link?.origin == "shared" }
    var isViewOnly: Bool { link?.mode == .view }

    /// **The refusal that keeps a line from crossing itself off and coming back.** Every write below
    /// asks this before the document is touched, so nobody is shown an edit that will not stay.
    var canEdit: Bool { openId != nil && link?.mode == .edit }

    // ---------------------------------------------------------------- one thing

    /// The line one-thing mode shows: the shuffled one while it is still undone, else the top of the
    /// list. `renderToday`, ported.
    ///
    /// The clearing is **lazy and inside the read**, which is what makes a remote pull that deletes
    /// or un-stars the shuffled line fall back to the top undone line on the very next render with no
    /// bookkeeping anywhere else. `shuffled` is `@ObservationIgnored` precisely so this write cannot
    /// invalidate the view that is reading it.
    var oneThingLine: Row? {
        let undone = rows.filter { !$0.done }
        if let s = shuffled, !undone.contains(where: { $0.id == s }) { shuffled = nil }
        return undone.first { $0.id == shuffled } ?? undone.first
    }

    /// The web's words: `left + " more after this"`, or `"Last one"`.
    var oneThingFooter: String {
        guard oneThingLine != nil else { return "" }
        let left = rows.filter { !$0.done }.count - 1
        return left > 0 ? "\(left) more after this" : "Last one"
    }

    /// Entering or leaving one-thing mode clears the pick eagerly, as the web does.
    func oneThingModeChanged() {
        shuffled = nil
        shuffleTick &+= 1
    }

    /// Shuffle. The rules are the web's, ported exactly:
    ///
    ///   * the pool is the undone Today lines **minus the one currently shown**;
    ///   * 0 or 1 undone is a wobble and **nothing changes** — including the haptic, which in
    ///     `app.js` sits below that early return;
    ///   * the pick is uniform over the pool, so with exactly two undone lines it is deterministic;
    ///   * **nothing is written to the document**. Shuffle is pure view state and always has been.
    ///
    /// The haptic fires on the gesture, not after any settle. Returns true when the pick moved.
    @discardableResult
    func shuffle() -> Bool {
        guard canEdit else { return false }
        let undone = rows.filter { !$0.done }
        guard undone.count > 1 else {
            wobbleTick &+= 1
            return false
        }
        let current = oneThingLine?.id
        let pool = undone.filter { $0.id != current }
        guard let pick = pool.randomElement() else { return false }
        shuffled = pick.id
        shuffleTick &+= 1
        haptics.play(.shuffle)
        return true
    }

    // ---------------------------------------------------------------- the writes

    /// The check-off. `Model.setDone` writes exactly three fields — `done`, `doneAt`, `updatedAt` —
    /// and never `today`, `order` or `todayOrder`: the sink is derived, and a client that wrote new
    /// `todayOrder` values here would be fighting the web on every merge.
    ///
    /// It **sets** rather than toggles, and the core no-ops when the line is already in the state
    /// asked for, so a double tap cannot stamp a fresh `updatedAt` that wins a merge tie-break for no
    /// user action.
    func setDone(_ id: String, _ done: Bool) {
        guard canEdit else { return }
        let next = Model.setDone(doc, id, done)
        guard next.canon != doc.canon else { return }

        // Freeze the order the person is looking at *before* the document changes, so the strike
        // lands on a row that has not moved.
        frozenOrder = rows.map(\.id)
        settleTask?.cancel()
        apply(next, local: true)
        haptics.play(done ? .check : .uncheck)

        let delay = done ? 320 : 160        // app.js: afterChange({ delay: it.done ? 320 : 160 })
        settleTask = Task { @MainActor [weak self] in
            try? await Task.sleep(for: .milliseconds(delay))
            guard !Task.isCancelled else { return }
            self?.frozenOrder = nil
        }
    }

    /// Start again — a long press on the count. `app.js`'s `startAgain()`: un-done every done line in
    /// the view, each with its own fresh `updatedAt`, and the uncheck moment.
    func startAgain() {
        guard canEdit else { return }
        let ids = rows.filter(\.done).map(\.id)
        guard !ids.isEmpty else { return }
        let next = Model.startAgain(doc, ids: ids)
        guard next.canon != doc.canon else { return }
        finaleTask?.cancel()
        finaleShowing = false
        settleTask?.cancel()
        frozenOrder = nil
        apply(next, local: true)
        haptics.play(.uncheck)
    }

    /// Put a line on Today. **Track C's `AddFlowView` calls this**, and so does the App Intent: one
    /// add in Swift, which is the whole reason `addToToday` is in the core. Returns the new line's
    /// id, or nil when the text had nothing in it or the list cannot be changed.
    @discardableResult
    func add(_ text: String) -> String? {
        guard canEdit else { return nil }
        guard let result = Model.addToToday(doc, text: text) else { return nil }
        apply(result.doc, local: true)
        return result.id
    }

    /// Every document change goes through here: the engine hears about it, the finale's edge is
    /// looked at, and the face is refreshed.
    private func apply(_ newDoc: Doc, local: Bool) {
        doc = newDoc
        if local {
            chain { engine in
                await engine.update(newDoc)
                await engine.push()          // push on every change
            }
            checkFinaleEdge()
        } else {
            // A completion that arrived from somewhere else is not this wrist's moment. `app.js`
            // renders a remote change quietly and then *re-baselines* its edge detector, so the
            // chord belongs to whoever crossed the last line off — and so that the next local
            // check-off on a list that is already complete does not fire a finale for a list that
            // finished on a laptop ten minutes ago.
            wasAllDone = allDone
            if !allDone { finaleShowing = false }
        }
        publish()
    }

    /// The finale fires when the list *becomes* complete, and waits **300 ms** after the check-off
    /// that caused it — the web holds the chord exactly that long, so the two feel like one product.
    /// If the line is taken back inside those 300 ms there is no chord for a finale that is not
    /// there, which is `app.js`'s own guard.
    private func checkFinaleEdge() {
        let now = allDone
        if now && !wasAllDone {
            finaleTask?.cancel()
            finaleTask = Task { @MainActor [weak self] in
                try? await Task.sleep(for: .milliseconds(300))
                guard let self, !Task.isCancelled, self.allDone else { return }
                self.finaleShowing = true
                self.haptics.play(.finale)
            }
        }
        if !now {
            finaleTask?.cancel()
            finaleShowing = false
        }
        wasAllDone = now
    }

    // ---------------------------------------------------------------- the face

    /// Write the snapshot and ask for a reload. Called after every change, which is cheap: the file
    /// is a couple of hundred bytes and `reloadAllTimelines` coalesces.
    private func publish() {
        let items = doc.todayItems
        let snapshot = WatchSnapshot(
            hasList: openId != nil,
            name: openId == nil ? "" : title,
            done: items.filter(\.done).count,
            total: items.count,
            next: items.first { !$0.done }?.text ?? "",
            viewOnly: isViewOnly,
            at: CalendarDates.now(),
            rollsAt: nextRollover()
        )
        try? snapshot.write()
        WidgetCenter.shared.reloadAllTimelines()
    }

    /// The list's next midnight **in its home zone** — the moment rollover empties Today. A list with
    /// no `zone` rolls on this device's clock, which is what the core does too, so this follows it.
    /// 0 when the platform cannot compute in the zone the list carries, which leaves the timeline
    /// with one entry rather than a wrong second one.
    private func nextRollover() -> Double {
        let zone = CalendarDates.zoneOf(doc)
        let tz = zone.isEmpty ? TimeZone.current : (TimeZone(identifier: zone) ?? TimeZone.current)
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = tz
        guard let midnight = calendar.nextDate(after: Date(),
                                               matching: DateComponents(hour: 0, minute: 0, second: 0),
                                               matchingPolicy: .nextTime) else { return 0 }
        return midnight.timeIntervalSince1970 * 1000
    }

    // ---------------------------------------------------------------- the add URL

    /// `todaysfive://add`, from the Add complication. `WKApplicationDelegate` has no url-opening
    /// callback — the whole optional list was read, and the only `openURL` in WatchKit sends a URL
    /// *out* — so SwiftUI's `onOpenURL` is the door, and this is what it decides.
    ///
    /// See the report: the scheme needs `CFBundleURLTypes` in `Config/WatchInfo.plist`, which is the
    /// orchestrator's file and not this track's.
    func wantsAddFlow(_ url: URL) -> Bool {
        url.scheme == "todaysfive" && (url.host == "add" || url.path == "/add")
    }
}

// ---------------------------------------------------------------- the demo list, and the self-test

#if DEBUG
extension WatchStore {

    /// A fixed id so the demo list is the same list across launches and the complication has
    /// something to draw between them. It never reaches a server: `-TFWatchDemo` builds the store on
    /// `MemoryTransport`, so nothing is spent from the create limit and no row is ever made.
    private static let demoId = "TFdemoTFdemoTFdemoTFde"

    /// Five lines, none of them anybody's. Written through `Model.addToToday` rather than assembled
    /// here, so the demo records are the same shape every other client would write.
    private static func demoDoc() -> Doc {
        let t = CalendarDates.now() - 5_000
        var doc = CalendarDates.withZone(Doc.empty(id: demoId, name: "Demo", at: t))
        let lines = ["Ten minutes outside", "Water the plants", "Write it down",
                     "Call back", "Clear the desk"]
        for (i, line) in lines.enumerated() {
            if let made = Model.addToToday(doc, text: line, at: t + Double(i)) { doc = made.doc }
        }
        return doc
    }

    /// `-TFWatchDemo`. Everything the real path does, with the phone and the network taken out: a
    /// link that is not in the vault, a document that is not on a server, and an engine whose
    /// transport is memory.
    func startDemo() async {
        let id = Self.demoId
        let link = VaultedLink(id: id, mode: .edit, origin: "mine", nickname: "", name: "Demo",
                               addedAt: CalendarDates.now(), lastSeenAt: CalendarDates.now(),
                               seenInRegistry: true)
        links = [link]
        selected = id
        // A fresh document every launch, so the self-test always starts from five undone lines.
        // `created: true` only here, and only because the demo's transport is memory: it is what
        // lets the engine insert the row and gives the sync mark something honest to say. On the real
        // path the Watch never creates a list, and the flag stays false.
        let record = ListRecord(doc: Self.demoDoc(), rev: 0, dirty: false, created: true,
                               mode: .edit, origin: "mine")
        try? store?.save(id, record)
        openList(id)
        await sync()
        print("[tfive] watch: demo list seeded, lines=\(totalCount) mark=\(mark.rawValue)")
    }

    /// `-TFWatchSelfTest`. `simctl` cannot tap a watch simulator, so the app performs the moments
    /// itself and prints a tally — the same answer Phase 2 gave the phone when it hit the same wall,
    /// and a better one here, because more of what has to be checked is a *rule* than a feeling.
    ///
    /// Everything it prints is a count or a fixed string. Never a line of anyone's list, never an id.
    func runSelfTest() async {
        func say(_ s: String) { print("[tfive] watch selftest: \(s)") }

        say("store=\(usingAppGroup ? "appGroup" : "fallback(ApplicationSupport)")")
        say("list=\(opened ? "open" : "none") editable=\(canEdit) lines=\(totalCount)")
        guard canEdit, totalCount > 0 else {
            say("nothing editable to run against — stopping")
            return
        }

        // 1. cross the first undone line off, and say whether the row's model went done.
        guard let first = rows.first(where: { !$0.done }) else { say("1 check: no undone line"); return }
        setDone(first.id, true)
        let wentDone = rows.first { $0.id == first.id }?.done ?? false
        say("1 check: modelDone=\(wentDone) done=\(doneCount)/\(totalCount)")

        // 2. cross it back on.
        try? await Task.sleep(for: .milliseconds(400))     // past the 320 ms settle
        setDone(first.id, false)
        let wentBack = !(rows.first { $0.id == first.id }?.done ?? true)
        say("2 uncheck: modelUndone=\(wentBack) done=\(doneCount)/\(totalCount)")

        // 3. cross every line off, and report whether the finale fired and after how long.
        try? await Task.sleep(for: .milliseconds(250))
        let started = Date()
        for row in rows where !row.done { setDone(row.id, true) }
        var waited = 0
        while !finaleShowing && waited < 2000 {
            try? await Task.sleep(for: .milliseconds(20))
            waited += 20
        }
        let delay = Date().timeIntervalSince(started)
        say(String(format: "3 finale: fired=%@ after=%.3fs done=%d/%d",
                   finaleShowing ? "yes" : "NO", delay, doneCount, totalCount))
        await haptics.finaleRun?.value

        // 4. Start again, and report the count going back.
        startAgain()
        say("4 startAgain: done=\(doneCount)/\(totalCount) finaleCard=\(finaleShowing)")

        // 5. one-thing mode, ten shuffles: how many distinct lines came up, and whether the same
        //    line ever came up twice in a row. That second one is the web's rule, machine-checked.
        oneThingModeChanged()
        var picks: [String] = []
        if let shown = oneThingLine?.id { picks.append(shown) }
        var repeats = 0
        for _ in 0..<10 {
            _ = shuffle()
            guard let now = oneThingLine?.id else { continue }
            if now == picks.last { repeats += 1 }
            picks.append(now)
        }
        // Ids never reach the log; only how many different ones there were.
        let distinct = Set(picks.dropFirst()).count
        say("5 shuffle x10: distinct=\(distinct) sameTwiceInARow=\(repeats) undone=\(rows.filter { !$0.done }.count)")

        // 6. one undone line left: shuffle, and report that nothing changed.
        let leaveUndone = rows.first(where: { !$0.done })?.id
        for row in rows where !row.done && row.id != leaveUndone { setDone(row.id, true) }
        try? await Task.sleep(for: .milliseconds(400))
        let beforeWobble = (line: oneThingLine?.id, tick: shuffleTick, wobble: wobbleTick)
        let moved = shuffle()
        let changed = oneThingLine?.id != beforeWobble.line || shuffleTick != beforeWobble.tick
        say("6 wobble: undone=\(rows.filter { !$0.done }.count) moved=\(moved) changed=\(changed) "
            + "wobbled=\(wobbleTick != beforeWobble.wobble)")

        // 7. the haptic tally and the finale run.
        say("7 haptics: \(haptics.tally)")
        say("7 finale run: \(haptics.finaleSelfCheck())")

        // 8. where the store landed. (Said first as well, because it changes how 9 reads.)
        say("8 appGroup=\(usingAppGroup)")

        // 9. the snapshot that was written — counts only.
        if let snap = WatchSnapshot.read() {
            say("9 snapshot: hasList=\(snap.hasList) done=\(snap.done)/\(snap.total) "
                + "nextLine=\(snap.next.isEmpty ? "none" : "\(snap.next.count) chars") "
                + "viewOnly=\(snap.viewOnly) rollsAt=\(snap.rollsAt > 0 ? "set" : "unknown")")
        } else {
            say("9 snapshot: UNREADABLE (no App Group container, or nothing written)")
        }
    }
}
#endif
