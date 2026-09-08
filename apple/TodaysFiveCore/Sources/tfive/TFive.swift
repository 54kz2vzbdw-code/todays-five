// tfive — the command line over TodaysFiveCore. It is a tool for checking the core by hand against
// the real backend, and it is the interop proof: every command goes through the same links, keys,
// envelope, store and sync engine an app will use.
//
//   tfive show <link>              the list, the way Today shows it
//   tfive check <link> <n>         cross off the nth line on Today (again to uncheck)
//   tfive add <link> "text"        a line on Today
//   tfive watch <link> [seconds]   poll and print the list when it changes
//   tfive new [name]               make a list (prints both links)
//   tfive links <link>             the Private and the View link for a secret
//   tfive rollover <link>          run today's rollover
//   tfive delete <link>            delete the row on the server
//   tfive raw <link>               what the server holds, and what an unchanged poll costs
//   tfive lists                    the lists this device holds
//
// TFIVE_HOME sets the store directory (default: Application Support/TodaysFive/lists).
import Foundation
import TodaysFiveCore

@main
struct TFive {
    static let base = "https://54kz2vzbdw-code.github.io/todays-five/"

    static func main() async {
        let args = Array(CommandLine.arguments.dropFirst())
        guard let command = args.first else { usage(); exit(2) }
        do {
            switch command {
            case "show":     try await show(link(args, 1))
            case "check":    try await check(link(args, 1), Int(arg(args, 2) ?? "") ?? 0)
            case "add":      try await add(link(args, 1), arg(args, 2) ?? "")
            case "watch":    try await watch(link(args, 1), every: Double(arg(args, 2) ?? "") ?? 15)
            case "new":      try await makeNew(name: arg(args, 1) ?? "")
            case "links":    try links(link(args, 1))
            case "rollover": try await rollover(link(args, 1))
            case "delete":   try await deleteList(link(args, 1))
            case "raw":      try await raw(link(args, 1))
            case "lists":    try lists()
            case "-h", "--help", "help": usage()
            default:
                fail("no such command: \(command)")
            }
        } catch let e as SyncError {
            fail(e.message + "  (\(e.kind.rawValue))")
        } catch {
            fail("\(error)")
        }
    }

    // ---------------------------------------------------------------- plumbing

    static func arg(_ args: [String], _ i: Int) -> String? { i < args.count ? args[i] : nil }

    static func link(_ args: [String], _ i: Int) throws -> (id: String, mode: LinkMode, origin: String?) {
        guard let raw = arg(args, i), let parsed = Links.parseLink(raw) else {
            throw CLIError("that doesn't look like a list link — it ends in #/l/ or #/r/ followed by 22 letters and digits")
        }
        return parsed
    }

    struct CLIError: Error, CustomStringConvertible {
        let message: String
        init(_ m: String) { message = m }
        var description: String { message }
    }

    static func fail(_ message: String) -> Never {
        FileHandle.standardError.write(Data((message + "\n").utf8))
        exit(1)
    }

    static func store() throws -> ListStore {
        if let home = ProcessInfo.processInfo.environment["TFIVE_HOME"] {
            return try ListStore(directory: URL(fileURLWithPath: home))
        }
        return try ListStore()
    }

    static func transport() -> (any Transport)? {
        try? SupabaseTransport()
    }

    static let dates = CalendarDates()

    /// Open a list: the keys, the stored record (or a fresh one), and the engine.
    static func openList(_ target: (id: String, mode: LinkMode, origin: String?))
        async throws -> (keys: ListKeys, engine: SyncEngine, store: ListStore) {
        let keys = try Keys.fromLink(target.mode, target.id)
        let store = try store()
        var record = store.load(target.id)
            ?? ListRecord(doc: Model.normalize(nil, target.id), mode: target.mode,
                          origin: target.origin ?? "mine")
        record.mode = target.mode
        if let origin = target.origin { record.origin = origin }
        let engine = SyncEngine(transport: transport(), store: store, dates: dates)
        await engine.open(keys, record)
        return (keys, engine, store)
    }

    // ---------------------------------------------------------------- commands

    static func show(_ target: (id: String, mode: LinkMode, origin: String?)) async throws {
        let (keys, engine, _) = try await openList(target)
        await engine.sync()
        print(render(await engine.document(), keys: keys, snapshot: await engine.current()))
    }

    static func check(_ target: (id: String, mode: LinkMode, origin: String?), _ n: Int) async throws {
        let (keys, engine, _) = try await openList(target)
        // A View link has no token, so the engine refuses to push it — and without this guard the
        // check-off is written locally, never sent, and replaced by the next pull. Silently losing an
        // edit is worse than refusing one, and Phase 3 makes refusing before the document is touched
        // a rule for the Watch; the CLI should not be the client that breaks it. `add` has said this
        // since Phase 1; `check` never did.
        guard keys.mode == .edit else {
            throw CLIError("a View link only shows the list — open the Private link to cross a line off")
        }
        await engine.sync()
        let doc = await engine.document()
        let today = doc.todayItems
        guard n >= 1, n <= today.count else {
            throw CLIError("there \(today.count == 1 ? "is" : "are") \(today.count) line\(today.count == 1 ? "" : "s") on Today; ask for 1 to \(today.count)")
        }
        let it = today[n - 1]
        let wasDone = it.done
        // The three fields a check-off writes live in the core now, so the CLI, the Watch and the
        // intent cannot invent a fourth between them.
        await engine.update(Model.setDone(doc, it.id, !wasDone))
        await engine.sync()
        print((wasDone ? "Back on: " : "Crossed off: ") + it.text)
        print(render(await engine.document(), keys: keys, snapshot: await engine.current()))
    }

    static func add(_ target: (id: String, mode: LinkMode, origin: String?), _ text: String) async throws {
        let (keys, engine, _) = try await openList(target)
        guard keys.mode == .edit else { throw CLIError("a View link only shows the list — open the Private link to add a line") }
        await engine.sync()
        let doc = await engine.document()
        // `addToToday` is the one add in Swift. What the CLI had here was almost it and differed in
        // three ways that all showed as a record the web would have written differently: no bidi
        // strip on the way in, order and todayOrder counted over the done lines as well as the
        // undone, and the section hard-coded rather than defaulted.
        guard let added = Model.addToToday(doc, text: text) else { throw CLIError("nothing to add") }
        await engine.update(added.doc)
        await engine.sync()
        let clean = added.doc.items[added.id]?.objectValue?.str("text") ?? JSString("")
        print("Added: " + clean.string)
        print(render(await engine.document(), keys: keys, snapshot: await engine.current()))
    }

    static func watch(_ target: (id: String, mode: LinkMode, origin: String?), every seconds: Double) async throws {
        let (keys, engine, _) = try await openList(target)
        var last: JSString? = nil
        print("Watching \(keys.lookupId.prefix(8))… every \(Int(seconds))s. Ctrl-C to stop.")
        while true {
            await engine.sync()
            let doc = await engine.document()
            if doc.canon != last {
                last = doc.canon
                print("")
                print(render(doc, keys: keys, snapshot: await engine.current()))
            }
            let snapshot = await engine.current()
            if snapshot?.gone == true {
                print("The list is gone — that link was rotated or deleted. Paste the new one.")
                return
            }
            try await Task.sleep(nanoseconds: UInt64(seconds * 1_000_000_000))
        }
    }

    static func makeNew(name: String) async throws {
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let store = try store()
        // 1.9: a list is stamped with its home zone when it is made, so every device rolls it over
        // once, at home midnight, rather than at the earliest midnight among them
        var doc = CalendarDates.withZone(Doc.seed(id: W))
        if !name.isEmpty {
            doc.json.set("name", name)
            doc.json.set("nameAt", CalendarDates.now())
        }
        let engine = SyncEngine(transport: transport(), store: store, dates: dates)
        await engine.open(keys, ListRecord(doc: doc, rev: 0, dirty: true, created: true, mode: .edit))
        await engine.sync()
        print(render(await engine.document(), keys: keys, snapshot: await engine.current()))
        print("")
        printLinks(keys)
    }

    static func links(_ target: (id: String, mode: LinkMode, origin: String?)) throws {
        printLinks(try Keys.fromLink(target.mode, target.id))
    }

    static func printLinks(_ keys: ListKeys) {
        if let W = keys.W {
            print("Private  " + base + Links.fragment(id: W, mode: .edit))
        }
        print("View     " + base + Links.fragment(id: keys.R, mode: .view))
        print("Row id   " + keys.lookupId)
    }

    static func rollover(_ target: (id: String, mode: LinkMode, origin: String?)) async throws {
        let (keys, engine, _) = try await openList(target)
        await engine.sync()
        let doc = await engine.document()
        let result = Model.rollover(doc, today: dates.todayFor(doc), at: CalendarDates.now(), dates: dates)
        if result.changed {
            await engine.update(result.doc)
            await engine.sync()
        }
        print(result.moved.isEmpty ? "Nothing to roll over." : "Moved \(result.moved.count) line(s) to History.")
        print(render(await engine.document(), keys: keys, snapshot: await engine.current()))
    }

    static func deleteList(_ target: (id: String, mode: LinkMode, origin: String?)) async throws {
        let (keys, engine, store) = try await openList(target)
        let gone = try await engine.removeRemote()
        store.remove(keys.id)
        print(gone ? "Deleted \(keys.lookupId) on the server, and the copy on this device."
                   : "There was no row to delete; the copy on this device is gone.")
    }

    static func raw(_ target: (id: String, mode: LinkMode, origin: String?)) async throws {
        let keys = try Keys.fromLink(target.mode, target.id)
        guard let t = transport() as? SupabaseTransport else { throw CLIError("sync is off — config.js has no project") }
        let full = try await t.rawGet(keys.lookupId, knownRev: nil)
        print("get_list_v3(p_rev: null)  HTTP \(full.status)  \(full.bytes) bytes")
        print(full.text.count > 400 ? String(full.text.prefix(400)) + "…" : full.text)
        guard let result = try await t.get(keys.lookupId, knownRev: nil) else {
            print("no row: that link is gone")
            return
        }
        let poll = try await t.rawGet(keys.lookupId, knownRev: result.rev)
        print("")
        print("get_list_v3(p_rev: \(result.rev))  HTTP \(poll.status)  \(poll.bytes) bytes  \(poll.text)")
        if let envelopeJSON = result.document, let envelope = Envelope(json: envelopeJSON) {
            print("")
            print("envelope  v\(envelope.v) \(envelope.algorithm) z=\(envelope.z ?? "none")  \(envelope.byteCount) bytes stored")
            let doc = Model.normalize(.object(try Crypto.openDocument(key: keys.key, envelope: envelope)), keys.id)
            print("opens to  \(doc.liveItems.count) live lines, \(doc.history.count) history days")
        } else {
            print("the row is not a v3 envelope")
        }
    }

    static func lists() throws {
        let store = try store()
        let ids = store.ids()
        if ids.isEmpty { print("No lists on this device yet. `tfive new` makes one."); return }
        for id in ids {
            guard let r = store.load(id) else { continue }
            let name = r.doc.name.isEmpty ? "(unnamed)" : r.doc.name.string
            let flags = [r.mode == .view ? "view" : "edit", r.origin, r.dirty ? "dirty" : nil, r.created ? "created" : nil]
                .compactMap { $0 }.joined(separator: " · ")
            print("\(id)  \(name.padding(toLength: min(24, max(name.count, 24)), withPad: " ", startingAt: 0))  rev \(r.rev)  \(flags)")
        }
    }

    // ---------------------------------------------------------------- rendering

    static func render(_ doc: Doc, keys: ListKeys, snapshot: SyncEngine.Snapshot?) -> String {
        var out: [String] = []
        let name = doc.name.isEmpty ? "Today's Five" : doc.name.string
        let state = snapshot.map { "\($0.status.rawValue) · rev \($0.rev)\($0.dirty ? " · unsent" : "")" } ?? "local"
        let zone = CalendarDates.zoneOf(doc)
        out.append(name + "   — " + state + (keys.mode == .view ? " · view only" : "")
                   + (zone.isEmpty ? "" : " · \(zone)"))
        out.append("")

        let today = doc.todayItems
        out.append("Today")
        if today.isEmpty {
            out.append("   (nothing on Today)")
        } else {
            for (i, it) in today.enumerated() {
                out.append(line(doc, it, number: i + 1))
            }
        }

        var sections: [(id: JSString, name: String)] = [(JSString(""), "Unsorted")]
        sections.append(contentsOf: doc.sectionsOrdered.map { ($0.idJS, $0.name) })
        var everything: [String] = []
        for s in sections {
            let items = doc.itemsInSection(s.id).filter { !$0.today }
            if items.isEmpty { continue }
            everything.append("   " + s.name)
            for it in items { everything.append(line(doc, it, number: nil, indent: 5)) }
        }
        if !everything.isEmpty {
            out.append("")
            out.append("Everything")
            out.append(contentsOf: everything)
        }

        let review = doc.dayReview(dates.todayFor(doc), dates: dates)
        out.append("")
        var footer = "\(review.streak) day streak · \(review.finishedThisWeek) of 7 this week"
        if !doc.historyDays.isEmpty { footer += " · \(doc.historyDays.count) history days" }
        out.append(footer)
        return out.joined(separator: "\n")
    }

    static func line(_ doc: Doc, _ it: Item, number: Int?, indent: Int = 3) -> String {
        var s = String(repeating: " ", count: indent)
        if let number { s += String(format: "%2d ", number) }
        s += it.done ? "✓ " : "○ "
        s += it.text
        if doc.rule(of: it.idJS) != nil { s += "  ↻" }
        if doc.returnOf(it.idJS) != nil { s += "  (back \(doc.returnOf(it.idJS)?.str("on").string ?? ""))" }
        if !it.note.isEmpty { s += "\n" + String(repeating: " ", count: indent + 5) + it.note.replacingOccurrences(of: "\n", with: " ") }
        return s
    }

    static func require<T>(_ value: T?, _ what: String) throws -> T {
        guard let value else { throw CLIError("could not find " + what) }
        return value
    }

    static func usage() {
        print("""
        tfive — Today's Five from the command line

          tfive show <link>              the list, the way Today shows it
          tfive check <link> <n>         cross off the nth line on Today (again to uncheck)
          tfive add <link> "text"        a line on Today
          tfive watch <link> [seconds]   poll and print the list when it changes
          tfive new [name]               make a list (prints both links)
          tfive links <link>             the Private and the View link for a secret
          tfive rollover <link>          run today's rollover
          tfive delete <link>            delete the row on the server
          tfive raw <link>               what the server holds, and what an unchanged poll costs
          tfive lists                    the lists this device holds

        A <link> is a full URL, a #/l/… or #/r/… fragment, or a bare 22-character secret.
        TFIVE_HOME sets where lists are kept (default: Application Support/TodaysFive/lists).
        """)
    }
}
