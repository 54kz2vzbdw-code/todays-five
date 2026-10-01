// WidgetDebug.swift — debug builds only: the instruments for the widgets, run by launch argument.
//
//   -TFWidgetSeed [port]   a list of five lines, two done, made on the stand-in server (apple/tools/mockserver.mjs),
//                          kept in the vault and opened, with the look of -TFWidgetKits day,night (Paper and
//                          Terminal by default) on the shelf. The page is not loaded: it would talk to the real
//                          backend, and its registry would let go of a list it never opened.
//   -TFWidgetDump          the open list read back from the server: which of its lines are done, by position, and
//                          what is waiting — never a word of it.
//   -TFWidgetSelfTest [port] the widgets' data path, end to end against the stand-in server, with a vault and a shelf
//                          of its own (nothing the seed or the person holds is touched): a list read onto the shelf, a
//                          line crossed off, a repeating line crossed off the morning after it was last done, a View
//                          link refused, a check-off made offline and sent later, never-read against gone, and a
//                          list let go. A tally of passes; never a word of a list.
//   -TFWidgetLab           every family, every place (Home Screen, StandBy, a tinted Home Screen, the Lock Screen),
//                          in progress and sealed, for each kit in -TFWidgetKits (default: all sixteen), rendered to
//                          PNG in the app's Documents/widget-lab — the views the extension draws, compiled into the
//                          debug app for this and for nothing else.
#if DEBUG
import SwiftUI
import TodaysFiveCore
import UIKit
import WidgetKit

/// The lab's stand-in for what a box does: the views are compiled into this debug app to be drawn, never tapped, and the
/// real check-off (CheckLineIntent) must exist in the widget extension alone (WidgetEntry.swift says why).
enum WidgetActions {
    static func check(list: String, line: String, done: Bool) -> OpenTodayIntent { OpenTodayIntent() }
}

@MainActor
enum WidgetDebug {
    static let args = ProcessInfo.processInfo.arguments

    /// True when an instrument runs instead of the page: asked for, or the shelf still names the stand-in server.
    static var testMode: Bool {
        args.contains("-TFWidgetSeed") || args.contains("-TFWidgetLab") || args.contains("-TFWidgetDump")
            || args.contains("-TFWidgetSelfTest") || WidgetShelf.debugServer != nil
    }

    /// `-TFWidgetReset`: the stand-in forgotten, the seeded list let go, the shelf emptied — the app back to normal.
    static func reset() {
        // the lists the seed made, by the keys it wrote down — and, for what older harnesses left, by the seed's own names
        let seeded = Set(WidgetShelf.read("debug-seeded.json")?["keys"] as? [String] ?? [])
        let names = Set(seedLists.map(\.name) + ["Kitchen"])
        for link in (try? KeychainLinkVault().all()) ?? []
        where seeded.contains(WidgetShelf.key(for: link.id)) || (link.origin == "mine" && names.contains(link.name)) {
            try? KeychainLinkVault().remove(id: link.id)
        }
        WidgetShelf.remove("debug-seeded.json")
        UserDefaults.standard.removeObject(forKey: AddService.openListKey)
        for name in ["debug-server.json", WidgetIndex.file, WidgetLook.file, WidgetPending.file] { WidgetShelf.remove(name) }
        for key in WidgetShelf.dayKeys() { WidgetShelf.remove(WidgetDay.file(key)) }
        AddService.debugConfig = nil
        WidgetCenter.shared.reloadAllTimelines()
        print("[tfive] widgets: reset")
    }

    static func value(after flag: String) -> String? {
        guard let i = args.firstIndex(of: flag), i + 1 < args.count, !args[i + 1].hasPrefix("-") else { return nil }
        return args[i + 1]
    }

    static func run() async {
        if let server = WidgetShelf.debugServer { AddService.debugConfig = server }
        if args.contains("-TFWidgetSeed") { await seed() }
        if let index = value(after: "-TFWidgetOpen").flatMap(Int.init) { openSeeded(index) }
        if args.contains("-TFWidgetDump") { await dump() }
        if args.contains("-TFWidgetSelfTest") { await selfTest() }
        if args.contains("-TFWidgetLab") { lab() }
    }

    // ---------------------------------------------------------------- the seed

    static let seedLines = ["Call the plumber about the upstairs sink", "Walk Biscuit before dinner", "Pick up the prescription",
                            "Reply to Sam about Saturday", "Empty the dishwasher"]

    /// Three lists, the way a person with a home list, a work list and a shopping list has them: made on the stand-in
    /// server, kept in the vault, the first one open.
    static let seedLists: [(name: String, lines: [String], done: Set<Int>)] = [
        ("Home to-do", seedLines, [3, 4]),
        ("Work", ["Send the Henderson draft", "Call back about the lease", "Book the Thursday room", "Expense report"], [3]),
        ("Groceries", ["Coffee", "Lemons", "Bread"], [])
    ]

    static func seed() async {
        let port = value(after: "-TFWidgetSeed") ?? "8899"
        let config = SupabaseConfig(url: "http://127.0.0.1:\(port)", key: "mock")
        WidgetShelf.write("debug-server.json", ["url": config.url, "key": config.key])
        AddService.debugConfig = config
        guard let transport = try? SupabaseTransport(config: config) else { print("[tfive] widgets: seed could not start"); return }
        var ids: [String] = []
        var at = CalendarDates.now() - 600_000
        for list in seedLists {
            let id = Model.newId()
            guard let keys = try? Keys.fromLink(.edit, id) else { continue }
            var doc = CalendarDates.withZone(Model.normalize(.object(JSONObject()), id))
            doc.json.set("name", list.name)
            var lineIds: [String] = []
            for line in list.lines {
                if let r = Model.addToToday(doc, text: line, at: at) { doc = r.doc; lineIds.append(r.id) }
                at += 1_000
            }
            for i in list.done where i < lineIds.count { doc = Model.setDone(doc, lineIds[i], true, at: at + Double(i)) }
            let engine = SyncEngine(transport: transport, store: nil)
            await engine.open(keys, ListRecord(doc: doc, rev: 0, dirty: true, created: true, mode: .edit, origin: "mine"))
            await engine.push()
            guard await engine.status == .synced else { continue }
            try? KeychainLinkVault().put(VaultedLink(id: id, mode: .edit, origin: "mine", name: list.name))
            ids.append(id)
        }
        guard let first = ids.first else { print("[tfive] widgets: seed made nothing"); return }
        WidgetShelf.write("debug-seeded.json", ["keys": ids.map(WidgetShelf.key(for:))]) // what -TFWidgetReset lets go of
        UserDefaults.standard.set(first, forKey: AddService.openListKey)
        let kits = (value(after: "-TFWidgetKits") ?? "paper,terminal").split(separator: ",").map(String.init)
        var look = WidgetLook()
        look.mode = "system"
        look.day = labLook(kits.first ?? "paper")
        look.night = labLook(kits.count > 1 ? kits[1] : "terminal")
        look.write()
        WidgetFeed.live().publishIndex(openId: first)
        for id in ids { await WidgetFeed.live().refresh(WidgetShelf.key(for: id)) }
        WidgetCenter.shared.reloadAllTimelines()
        if #available(iOS 18.0, *) { ControlCenter.shared.reloadAllControls() }
        print("[tfive] widgets: seed made \(ids.count) list(s), the first open")
    }

    /// `-TFWidgetOpen <n>`: the app's open list becomes the nth seeded list (0, 1, 2, in `seedLists` order), as if the
    /// person had opened it on the page — which is what a widget left on "Same as the app" follows.
    static func openSeeded(_ index: Int) {
        guard index >= 0, index < seedLists.count,
              let link = ((try? KeychainLinkVault().all()) ?? []).first(where: { $0.name == seedLists[index].name }) else {
            print("[tfive] widgets: no seeded list \(index)"); return
        }
        UserDefaults.standard.set(link.id, forKey: AddService.openListKey)
        WidgetFeed.live().publishIndex(openId: link.id)
        WidgetCenter.shared.reloadAllTimelines()
        print("[tfive] widgets: the open list is now seeded list \(index)")
    }

    static func dump() async {
        guard let id = UserDefaults.standard.string(forKey: AddService.openListKey) else { print("[tfive] widgets: no open list"); return }
        let key = WidgetShelf.key(for: id)
        let day = await WidgetFeed.live().refresh(key)
        let flags = (day?.lines ?? []).map { $0.done ? "1" : "0" }.joined()
        print("[tfive] widgets: dump done=\(flags) (\(day?.done ?? 0)/\(day?.total ?? 0)) pending=\(WidgetPending.of(key).count) gone=\(day?.gone ?? false)")
    }

    // ---------------------------------------------------------------- the self-test

    /// A vault in memory, so the self-test's lists are nobody's and nothing it does reaches the Keychain.
    final class MemoryVault: LinkVault, @unchecked Sendable {
        private var links: [String: VaultedLink] = [:]
        private let lock = NSLock()
        func all() throws -> [VaultedLink] { lock.lock(); defer { lock.unlock() }; return Array(links.values) }
        func put(_ link: VaultedLink) throws { lock.lock(); links[link.id] = link; lock.unlock() }
        func remove(id: String) throws { lock.lock(); links[id] = nil; lock.unlock() }
    }

    static func selfTest() async {
        let port = value(after: "-TFWidgetSelfTest") ?? "8899"
        let config = SupabaseConfig(url: "http://127.0.0.1:\(port)", key: "mock")
        let vault = MemoryVault()
        // the lists this phone really holds, in memory only: the self-test's own publishIndex then keeps their shelf files
        for link in (try? KeychainLinkVault().all()) ?? [] { try? vault.put(link) }
        /// The self-test's clock: a box the feeds read, so a step can move it.
        final class Clock: @unchecked Sendable { var ms = CalendarDates.now() }
        let tick = Clock()
        var clock: Double { get { tick.ms } set { tick.ms = newValue } }
        let feed = WidgetFeed(vault: vault, makeTransport: { try? SupabaseTransport(config: config) }, now: { tick.ms })
        let offline = WidgetFeed(vault: vault, makeTransport: { try? SupabaseTransport(config: SupabaseConfig(url: "http://127.0.0.1:1", key: "mock")) }, now: { tick.ms })
        var passed = 0, failed: [String] = []
        func check(_ ok: Bool, _ what: String) { if ok { passed += 1 } else { failed.append(what) } }

        /// A list on the server, as the page would have made it: `lines` on Today, those in `done` crossed off at `doneAt`.
        func make(_ lines: [String], done: Set<Int> = [], doneAt: Double? = nil, mode: LinkMode = .edit,
                  daily: Set<Int> = []) async -> (link: VaultedLink, ids: [String])? {
            let id = Model.newId()
            guard let keys = try? Keys.fromLink(.edit, id), let transport = try? SupabaseTransport(config: config) else { return nil }
            var doc = CalendarDates.withZone(Model.normalize(.object(JSONObject()), id))
            var ids: [String] = []
            for (i, line) in lines.enumerated() {
                if let r = Model.addToToday(doc, text: line, at: clock - 3 * 86_400_000 + Double(i)) { doc = r.doc; ids.append(r.id) }
            }
            let today = CalendarDates().todayFor(doc, clock)
            for i in daily where i < ids.count {
                var rule = JSONObject(); rule.set("kind", "daily")
                doc = Model.setRule(doc, ids[i], rule, at: clock - 3 * 86_400_000 + 10, today: today)
            }
            for i in done where i < ids.count { doc = Model.setDone(doc, ids[i], true, at: doneAt ?? clock - 60_000) }
            let engine = SyncEngine(transport: transport, store: nil)
            await engine.open(keys, ListRecord(doc: doc, rev: 0, dirty: true, created: true, mode: .edit))
            await engine.push()
            guard await engine.status == .synced else { return nil }
            let link: VaultedLink
            if mode == .view {
                link = VaultedLink(id: keys.R, mode: .view, origin: "shared", name: "Shared")
            } else {
                link = VaultedLink(id: id, mode: .edit, origin: "mine", name: "Mine")
            }
            try? vault.put(link)
            return (link, ids)
        }
        /// What the server holds for a list, read as the page would.
        func server(_ link: VaultedLink) async -> Doc? {
            guard let keys = try? Keys.fromLink(link.mode, link.id), let transport = try? SupabaseTransport(config: config) else { return nil }
            let engine = SyncEngine(transport: transport, store: nil)
            await engine.open(keys, ListRecord(doc: Doc(), mode: link.mode))
            await engine.pull()
            return await engine.status == .synced ? await engine.document() : nil
        }
        func item(_ doc: Doc?, _ id: String) -> JSONObject? { doc?.items[id]?.objectValue }

        // 1. a list read onto the shelf, in the page's order
        if let (link, ids) = await make(["One", "Two", "Three", "Four", "Five"], done: [3, 4]) {
            let key = WidgetShelf.key(for: link.id)
            let day = await feed.refresh(key)
            check(day?.total == 5 && day?.done == 2, "read: 5 lines, 2 done")
            check(day?.lines.prefix(3).allSatisfy { !$0.done } == true && day?.lines.suffix(2).allSatisfy(\.done) == true, "read: the done lines sink")
            check(WidgetDay.read(key: key)?.total == 5, "read: on the shelf")
            check(!key.contains(link.id) && key.count == 20, "read: the key is not the id")
            // 2. a line crossed off from a widget
            let shelfBefore = WidgetDay.read(key: key)
            _ = await feed.setDone(key, ids[0], true)
            let after = await server(link)
            check(item(after, ids[0])?.truthy("done") == true, "check: the server has it")
            check(WidgetDay.read(key: key)?.done == 3, "check: the shelf has it")
            check(WidgetPending.of(key).isEmpty, "check: nothing left waiting")
            check(shelfBefore?.done == 2, "check: the shelf was 2 before")
            // 3. brought back
            _ = await feed.setDone(key, ids[0], false)
            check(item(await server(link), ids[0])?.truthy("done") == false, "uncheck: the server has it")
            // 7. let go: the shelf and anything waiting go with it
            try? vault.remove(id: link.id)
            WidgetPending.add(WidgetPending(key: key, id: ids[1], done: true, at: clock))
            feed.publishIndex(openId: nil)
            check(WidgetDay.read(key: key) == nil && WidgetPending.of(key).isEmpty, "let go: off the shelf")
        } else { failed.append("could not make list 1") }

        // 4. the morning after: a daily line done yesterday, crossed off again today
        let yesterday = clock - 86_400_000
        if let (link, ids) = await make(["Stretch", "Water the plants"], done: [0], doneAt: yesterday, daily: [0]) {
            let key = WidgetShelf.key(for: link.id)
            let day = await feed.refresh(key)
            check(day?.lines.first(where: { $0.id == ids[0] })?.done == false, "morning: shown undone, as rollover will")
            _ = await feed.setDone(key, ids[0], true)
            let doc = await server(link)
            let it = item(doc, ids[0])
            check(it?.truthy("done") == true && (it?.num("doneAt") ?? 0) > yesterday + 3_600_000, "morning: done today, not yesterday")
            let filed = doc.map { d in d.history.values.compactMap { $0.arrayValue }.flatMap { $0 }.contains { $0.objectValue?.str("id").string == ids[0] } } ?? false
            check(filed, "morning: yesterday's went to History")
            try? vault.remove(id: link.id)
        } else { failed.append("could not make list 2") }

        // 5. a View link: shown, never written
        if let (link, ids) = await make(["Theirs"], mode: .view) {
            let key = WidgetShelf.key(for: link.id)
            let day = await feed.refresh(key)
            check(day?.viewOnly == true && day?.total == 1, "view: read")
            _ = await feed.setDone(key, ids[0], true)
            check(WidgetPending.of(key).isEmpty && WidgetDay.read(key: key)?.done == 0, "view: nothing written, nothing waiting")
            try? vault.remove(id: link.id)
        } else { failed.append("could not make list 3") }

        // 6. offline: the shelf moves at once, the op waits, and goes with the next read
        if let (link, ids) = await make(["Later", "Still later"]) {
            let key = WidgetShelf.key(for: link.id)
            _ = await feed.refresh(key)
            _ = await offline.setDone(key, ids[1], true)
            check(WidgetDay.read(key: key)?.done == 1, "offline: the shelf has it")
            check(WidgetPending.of(key).count == 1, "offline: it waits")
            check(item(await server(link), ids[1])?.truthy("done") == false, "offline: the server does not have it yet")
            clock += 1_000
            _ = await feed.refresh(key)
            check(item(await server(link), ids[1])?.truthy("done") == true, "online: sent with the next read")
            check(WidgetPending.of(key).isEmpty, "online: nothing left waiting")
            try? vault.remove(id: link.id)
        } else { failed.append("could not make list 4") }

        // 9. which list a widget shows: "Same as the app" follows the open list; a pinned list stays until it is let go
        if let a = await make(["A"]), let b = await make(["B"]) {
            let keyA = WidgetShelf.key(for: a.link.id), keyB = WidgetShelf.key(for: b.link.id)
            WidgetIndex(lists: [], open: keyA).write()
            check(feed.key(chosen: WidgetFeed.followApp) == keyA, "same as the app: the open list")
            check(feed.key(chosen: nil) == keyA, "unset: the open list")
            check(feed.key(chosen: keyB) == keyB, "pinned: the pinned list, whatever is open")
            WidgetIndex(lists: [], open: keyB).write()
            check(feed.key(chosen: WidgetFeed.followApp) == keyB, "same as the app: follows a change of open list")
            check(feed.key(chosen: keyA) == keyA, "pinned: stays put when the open list changes")
            try? vault.remove(id: a.link.id)
            check(feed.key(chosen: keyA) == keyB, "pinned to a list let go: the open list")
            check(feed.key(chosen: WidgetFeed.followApp) != WidgetFeed.followApp, "the follow value never reads as a key")
            try? vault.remove(id: b.link.id)
        } else { failed.append("could not make lists 5 and 6") }

        // 8. never read against gone
        let ghost = VaultedLink(id: Model.newId(), mode: .edit, name: "Not yet")
        try? vault.put(ghost)
        let ghostDay = await feed.refresh(WidgetShelf.key(for: ghost.id))
        check(ghostDay == nil, "never read: not called gone")
        var seen = WidgetDay(); seen.key = WidgetShelf.key(for: ghost.id); seen.name = "Was here"; seen.at = clock
        seen.lines = [WidgetLine(id: "x", text: "x")]; seen.write()
        let goneDay = await feed.refresh(seen.key)
        check(goneDay?.gone == true && goneDay?.lines.isEmpty == true, "read before: gone")
        try? vault.remove(id: ghost.id)
        feed.publishIndex(openId: nil)
        // the shelf back as the app keeps it: the lists this phone really holds, and the one open
        WidgetFeed.live().publishIndex(openId: UserDefaults.standard.string(forKey: AddService.openListKey))

        print("[tfive] widgets: selftest \(passed)/\(passed + failed.count) passed" + (failed.isEmpty ? "" : " — failed: " + failed.joined(separator: "; ")))
    }

    // ---------------------------------------------------------------- the lab

    /// theme.js MATERIALS, for the kits the lab can draw without the page.
    static let materials: [String: String] = ["dark": "clean", "light": "clean", "paper": "ink", "cocoa": "ink",
        "midnight": "glass", "harbor": "tide", "forest": "tide", "pink": "candy", "blush": "candy",
        "terminal": "phosphor", "teletype": "phosphor", "sunset": "glow", "dusk": "glow", "ember": "ember",
        "sketch": "pencil", "arcade": "pixel"]

    static func labLook(_ id: String) -> WidgetKitLook? {
        guard let kit = Kits.byId(id) else { return nil }
        return WidgetKitLook(kit: kit, finale: id == "arcade" ? "Level clear." : "That's the list.", mat: materials[id] ?? "clean")
    }

    static func lab() {
        let ids = value(after: "-TFWidgetKits").map { $0.split(separator: ",").map(String.init) } ?? Kits.open.map(\.id)
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent("widget-lab")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        var written = 0
        for id in ids {
            guard let kl = labLook(id) else { continue }
            KitFonts.register(kl.kit)
            var look = WidgetLook(); look.mode = "hand"; look.hand = "day"; look.day = kl; look.night = kl
            let renderer = ImageRenderer(content: LabSheet(look: look, kit: kl.kit))
            renderer.scale = 2
            if let image = renderer.uiImage, let png = image.pngData() {
                try? png.write(to: dir.appendingPathComponent("lab-\(id).png")); written += 1
            }
        }
        print("[tfive] widgets: lab wrote \(written) sheet(s), fonts task=\(ids.compactMap { Kits.byId($0)?.type?.task.postScriptName }.filter(KitFonts.resolves).count)/\(ids.count) resolved")
    }
}

/// One kit's widgets, laid out as a gallery: every family, in progress and sealed, at Home Screen, StandBy, tinted
/// and Lock Screen. Sizes are the 6.1-inch class (small 158, medium 338×158, large 338×354).
private struct LabSheet: View {
    let look: WidgetLook
    let kit: Kit

    private func entry(_ done: Int, total: Int = 5, empty: Bool = false) -> DayEntry {
        var e = DayEntry.sample(Date(timeIntervalSince1970: 1_790_000_000), look: look)
        var day = e.day
        day.key = "lab"; day.name = "Kitchen"
        if empty { day.lines = [] }
        else {
            day.lines = WidgetDebug.seedLines.prefix(total).enumerated().map { i, t in
                WidgetLine(id: "l\(i)", text: t, note: i == 1 ? "The long loop, if it's dry" : "", done: i >= total - done, order: Double(i), doneAt: Double(i))
            }
        }
        e = DayEntry(date: e.date, state: .list, day: day, look: look)
        return e
    }

    private func tile<V: View>(_ w: CGFloat, _ h: CGFloat, _ family: WidgetFamily, background: Bool = true,
                               mode: WidgetRenderingMode = .fullColor, radius: CGFloat = 22, pad: CGFloat = 16,
                               @ViewBuilder _ content: () -> V) -> some View {
        let pal = Palette(kit: kit, mode: mode, onBlack: !background)
        return ZStack {
            if mode == .accented { Color(white: 0.16).opacity(0.85) }
            else if background { KitGround(pal: pal) }
            else { Color.black }
            content().padding(pad)
        }
        .frame(width: w, height: h)
        .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
        .environment(\.widgetStage, WidgetStage(family: family, background: background))
        .environment(\.widgetRenderingMode, mode)
        // the Lock Screen draws on the wallpaper in the system's own white, whatever the kit's base
        .environment(\.colorScheme, mode == .vibrant || kit.base == .dark ? .dark : .light)
    }

    var body: some View {
        let progress = entry(2), sealed = entry(5), empty = entry(0, empty: true)
        VStack(alignment: .leading, spacing: 18) {
            Text("\(kit.name) — \(kit.id)").font(.system(size: 15, weight: .semibold)).foregroundStyle(.white)
            HStack(alignment: .top, spacing: 18) {
                tile(158, 158, .systemSmall) { NextUpView(entry: progress) }
                tile(158, 158, .systemSmall) { NextUpView(entry: sealed) }
                tile(158, 158, .systemSmall) { ProgressSmallView(entry: progress) }
                tile(158, 158, .systemSmall) { ProgressSmallView(entry: sealed) }
                tile(158, 158, .systemSmall) { NextUpView(entry: empty) }
            }
            HStack(alignment: .top, spacing: 18) {
                tile(338, 158, .systemMedium) { TodayView(entry: progress) }
                tile(338, 158, .systemMedium) { TodayView(entry: sealed) }
            }
            HStack(alignment: .top, spacing: 18) {
                tile(338, 354, .systemLarge) { TodayView(entry: progress) }
                tile(338, 354, .systemLarge) { TodayView(entry: sealed) }
            }
            Text("StandBy · tinted · Lock Screen").font(.system(size: 12, weight: .semibold)).foregroundStyle(.white.opacity(0.7))
            HStack(alignment: .top, spacing: 18) {
                tile(158, 158, .systemSmall, background: false) { NextUpView(entry: progress) }
                tile(158, 158, .systemSmall, background: false) { ProgressSmallView(entry: progress) }
                tile(158, 158, .systemSmall, mode: .accented) { NextUpView(entry: progress) }
                tile(338, 158, .systemMedium, mode: .accented) { TodayView(entry: progress) }
            }
            HStack(alignment: .center, spacing: 18) {
                tile(160, 72, .accessoryRectangular, background: false, mode: .vibrant, radius: 10, pad: 0) { LockRectangularView(entry: progress) }
                tile(160, 72, .accessoryRectangular, background: false, mode: .vibrant, radius: 10, pad: 0) { LockRectangularView(entry: sealed) }
                tile(72, 72, .accessoryCircular, background: false, mode: .vibrant, radius: 36, pad: 0) { LockCircularView(entry: progress) }
                tile(72, 72, .accessoryCircular, background: false, mode: .vibrant, radius: 36, pad: 0) { LockCircularView(entry: sealed) }
                tile(260, 24, .accessoryInline, background: false, mode: .vibrant, radius: 6, pad: 0) { LockInlineView(entry: progress) }
            }
        }
        .padding(24)
        .background(LinearGradient(colors: [Color(red: 0.16, green: 0.2, blue: 0.3), Color(red: 0.32, green: 0.22, blue: 0.3)],
                                   startPoint: .topLeading, endPoint: .bottomTrailing))
    }
}
#endif
