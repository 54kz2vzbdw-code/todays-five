// WidgetShelf.swift — what the iPhone app and its widgets share in the App Group, and nothing more.
//
// Four small files in `widgets/` inside the group container, each read tolerantly and written atomically:
//
//   look.json        the device's Day and Night themes, resolved by the page's own theme.js (the app writes it)
//   lists.json       which lists this phone holds, by key and name, and which one is open (the app writes it)
//   day-<key>.json   one list's Today: its lines, as of when it was last read from the server (either side writes it)
//   pending.json     a check-off made on a widget that has not reached the server yet: a key, a line id, a flag
//
// **A list is known here by its key, never its id.** The id is the list's secret (whoever has it can read the
// list and, for an edit link, change it); a widget's configuration, an App Intent's parameter and a file name
// are all things the system stores where this app cannot reach, so none of them may hold it. The key is the
// first ten bytes of a SHA-256 over the id: enough to tell a phone's lists apart, nothing to derive anything
// from. The id stays in the Keychain, where `WidgetFeed` reads it when a widget has to reach the server.
//
// **What is on disk is Today's lines and nothing else** — not Everything, not the notes' history, not the
// document. A widget draws Today, and the narrower the thing in the shared container, the less there is to leak
// (the Watch's snapshot made the same call). The page never sends list contents across the bridge: the lines
// here come from the server, through the core, the way the Watch's do.
//
// COMPATIBILITY.md §3's rule for a shape two builds exchange holds for these files as it does for the Watch's:
// `v` says which build wrote one, a missing field reads as its default, and a `v` from a future build is
// refused rather than guessed at. The shape only grows.
import CryptoKit
import Foundation
import TodaysFiveCore

enum WidgetShelf {
    static let group = "group.com.pricebrannen.todaysfive"
    static let version = 1

    /// `widgets/` in the group container, made on first use; nil when this binary has no App Group entitlement —
    /// `containerURL` says so only by returning nil, so every caller has an answer for it.
    static var directory: URL? {
        guard let root = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group) else { return nil }
        let dir = root.appendingPathComponent("widgets", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }

    /// The handle a widget, an intent and a file name know a list by. Never the id (see the top of this file).
    static func key(for id: String) -> String {
        SHA256.hash(data: Data(("tf/widget/" + id).utf8)).prefix(10).map { String(format: "%02x", $0) }.joined()
    }

    static func read(_ name: String) -> [String: Any]? {
        guard let url = directory?.appendingPathComponent(name), let data = try? Data(contentsOf: url),
              let o = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              let v = (o["v"] as? NSNumber)?.intValue, v >= 1, v <= version else { return nil }
        return o
    }

    /// Atomic: a widget may be reading the file at the moment it is written, and half a JSON document is nothing.
    /// Skips the write when nothing changed, so a file's date means something and a reload is not asked for twice.
    @discardableResult
    static func write(_ name: String, _ object: [String: Any]) -> Bool {
        guard let url = directory?.appendingPathComponent(name) else { return false }
        var o = object; o["v"] = version
        guard let data = try? JSONSerialization.data(withJSONObject: o, options: [.sortedKeys]) else { return false }
        if let old = try? Data(contentsOf: url), old == data { return false }
        do { try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication]); return true }
        catch { return false }
    }

    static func remove(_ name: String) {
        guard let url = directory?.appendingPathComponent(name) else { return }
        try? FileManager.default.removeItem(at: url)
    }

    /// Every `day-<key>.json` on the shelf, by key — so a list this phone no longer holds can be taken off it.
    static func dayKeys() -> [String] {
        guard let dir = directory, let names = try? FileManager.default.contentsOfDirectory(atPath: dir.path) else { return [] }
        return names.compactMap { n in n.hasPrefix("day-") && n.hasSuffix(".json") ? String(n.dropFirst(4).dropLast(5)) : nil }
    }
}

#if DEBUG
extension WidgetShelf {
    /// Debug builds only: the stand-in server (apple/tools/mockserver.mjs), when the shelf names one — so a simulator
    /// can run the widgets' whole path without spending from the real backend. A Release build never reads it.
    static var debugServer: SupabaseConfig? {
        guard let o = read("debug-server.json"), let url = o["url"] as? String, let key = o["key"] as? String else { return nil }
        return SupabaseConfig(url: url, key: key)
    }
}
#endif

// ---------------------------------------------------------------- Today, as a widget draws it

/// One line on Today.
struct WidgetLine: Sendable, Hashable, Identifiable {
    var id: String
    var text: String
    var note: String = ""
    var done: Bool = false
    /// `todayOrder`, and `doneAt` in ms: enough to sink a line the way the page does when a widget crosses it off,
    /// before the server has answered.
    var order: Double = 0
    var doneAt: Double = 0

    var json: [String: Any] { ["id": id, "text": text, "note": note, "done": done, "order": order, "doneAt": doneAt] }
    init(id: String, text: String, note: String = "", done: Bool = false, order: Double = 0, doneAt: Double = 0) {
        self.id = id; self.text = text; self.note = note; self.done = done; self.order = order; self.doneAt = doneAt
    }
    init?(json o: [String: Any]) {
        guard let id = o["id"] as? String, !id.isEmpty else { return nil }
        self.id = id
        text = o["text"] as? String ?? ""
        note = o["note"] as? String ?? ""
        done = o["done"] as? Bool ?? false
        order = (o["order"] as? NSNumber)?.doubleValue ?? 0
        doneAt = (o["doneAt"] as? NSNumber)?.doubleValue ?? 0
    }
}

/// One list's Today, as of `at`.
struct WidgetDay: Sendable, Equatable {
    var key = ""
    var name = ""
    var viewOnly = false
    /// The server answered that the list is gone (rotated or deleted). A widget says so instead of showing the last lines.
    var gone = false
    /// In the page's order: the undone lines by their place on Today, then the done ones as they were crossed off.
    var lines: [WidgetLine] = []
    /// When the lines were read from the list, in ms.
    var at: Double = 0
    /// The list's next midnight in its home zone, in ms: the moment rollover takes the done lines off Today. 0 when
    /// it could not be worked out, which leaves the timeline with no entry for it rather than a wrong one.
    var rollsAt: Double = 0

    var done: Int { lines.filter(\.done).count }
    var total: Int { lines.count }
    var left: Int { total - done }
    var next: WidgetLine? { lines.first { !$0.done } }
    var finished: Bool { total > 0 && done == total }

    /// What Today will be after the list's midnight, worked out rather than stored: the done lines go to History and
    /// the rest stay. A repeating line that comes back at midnight is not modelled — the widget under-counts until
    /// the next read, which is the same call the Watch's complication makes (WatchSnapshot.afterRollover).
    var afterRollover: WidgetDay {
        var out = self
        out.lines = lines.filter { !$0.done }
        out.at = rollsAt
        out.rollsAt = 0
        return out
    }

    /// A line crossed off (or brought back) here, before the server has heard: the shelf shows it at once and sinks
    /// it the way the page would. The read that follows replaces it with what the list really says.
    func with(_ id: String, done flag: Bool, at ts: Double) -> WidgetDay {
        guard let i = lines.firstIndex(where: { $0.id == id }), lines[i].done != flag else { return self }
        var out = self
        out.lines[i].done = flag
        out.lines[i].doneAt = flag ? ts : 0
        out.lines = Self.sunk(out.lines)
        return out
    }

    /// `sortSink`: the undone lines by their place, the done ones under them in the order they were crossed off.
    static func sunk(_ lines: [WidgetLine]) -> [WidgetLine] {
        let undone = lines.filter { !$0.done }.sorted { $0.order != $1.order ? $0.order < $1.order : $0.id < $1.id }
        let done = lines.filter(\.done).sorted { $0.doneAt != $1.doneAt ? $0.doneAt < $1.doneAt : $0.id < $1.id }
        return undone + done
    }

    static func file(_ key: String) -> String { "day-\(key).json" }

    static func read(key: String) -> WidgetDay? {
        guard !key.isEmpty, let o = WidgetShelf.read(file(key)) else { return nil }
        var d = WidgetDay()
        d.key = key
        d.name = o["name"] as? String ?? ""
        d.viewOnly = o["viewOnly"] as? Bool ?? false
        d.gone = o["gone"] as? Bool ?? false
        d.lines = (o["lines"] as? [[String: Any]] ?? []).compactMap(WidgetLine.init(json:))
        d.at = (o["at"] as? NSNumber)?.doubleValue ?? 0
        d.rollsAt = (o["rollsAt"] as? NSNumber)?.doubleValue ?? 0
        return d
    }

    @discardableResult
    func write() -> Bool {
        guard !key.isEmpty else { return false }
        return WidgetShelf.write(Self.file(key), ["name": name, "viewOnly": viewOnly, "gone": gone,
                                                  "lines": lines.map(\.json), "at": at, "rollsAt": rollsAt])
    }
}

// ---------------------------------------------------------------- which lists

/// A list this phone holds, as a widget's configuration offers it: a key and a name.
struct WidgetListRef: Sendable, Hashable, Identifiable {
    var key: String
    var name: String
    var viewOnly = false
    var shared = false
    var id: String { key }
}

struct WidgetIndex: Sendable, Equatable {
    var lists: [WidgetListRef] = []
    /// The list open in the app, by key: what a widget shows until it is told otherwise.
    var open = ""

    static let file = "lists.json"

    static func read() -> WidgetIndex? {
        guard let o = WidgetShelf.read(file) else { return nil }
        var ix = WidgetIndex()
        ix.open = o["open"] as? String ?? ""
        ix.lists = (o["lists"] as? [[String: Any]] ?? []).compactMap { l in
            guard let key = l["key"] as? String, !key.isEmpty else { return nil }
            return WidgetListRef(key: key, name: l["name"] as? String ?? "", viewOnly: l["viewOnly"] as? Bool ?? false,
                                 shared: l["shared"] as? Bool ?? false)
        }
        return ix
    }

    @discardableResult
    func write() -> Bool {
        WidgetShelf.write(Self.file, ["open": open, "lists": lists.map { ["key": $0.key, "name": $0.name,
                                                                          "viewOnly": $0.viewOnly, "shared": $0.shared] }])
    }

    func ref(_ key: String) -> WidgetListRef? { lists.first { $0.key == key } }
}

// ---------------------------------------------------------------- the check-offs on their way

/// A check-off made on a widget that the server has not acknowledged: on the shelf so it survives the extension
/// being torn down, and sent with the next read of that list (`WidgetFeed.refresh`). Ids and a flag; no words.
struct WidgetPending: Sendable, Equatable {
    var key: String
    var id: String
    var done: Bool
    var at: Double

    static let file = "pending.json"

    static func all() -> [WidgetPending] {
        (WidgetShelf.read(file)?["ops"] as? [[String: Any]] ?? []).compactMap { o in
            guard let key = o["key"] as? String, let id = o["id"] as? String else { return nil }
            return WidgetPending(key: key, id: id, done: o["done"] as? Bool ?? true, at: (o["at"] as? NSNumber)?.doubleValue ?? 0)
        }
    }
    static func save(_ ops: [WidgetPending]) {
        if ops.isEmpty { WidgetShelf.remove(file); return }
        WidgetShelf.write(file, ["ops": ops.map { ["key": $0.key, "id": $0.id, "done": $0.done, "at": $0.at] }])
    }
    /// The latest word on a line replaces any earlier one: crossed off, then brought back, is one op.
    static func add(_ op: WidgetPending) {
        save(all().filter { !($0.key == op.key && $0.id == op.id) } + [op])
    }
    static func of(_ key: String) -> [WidgetPending] { all().filter { $0.key == key } }
    static func clear(_ sent: [WidgetPending]) {
        save(all().filter { op in !sent.contains(op) })
    }
    static func forget(keys: Set<String>) { save(all().filter { !keys.contains($0.key) }) }
}

// ---------------------------------------------------------------- how it looks

/// One slot's theme, as the page resolved it: the kit, its finale line, its material.
struct WidgetKitLook: Sendable, Equatable {
    var kit: Kit
    /// "That's the list.", or the kit's own ("Level clear." for Arcade, a Secret kit's line).
    var finale: String
    /// theme.js `materialOf`: what the stamp's words and corners follow (crisp in phosphor and pixel).
    var mat: String

    var json: [String: Any] {
        ["kit": (try? JSONSerialization.jsonObject(with: Data(JSONWriter.stringify(kit.json).utf8))) ?? [:],
         "finale": finale, "mat": mat]
    }
    init(kit: Kit, finale: String, mat: String) { self.kit = kit; self.finale = finale; self.mat = mat }
    init?(json o: [String: Any]?) {
        guard let o, let raw = o["kit"], let data = try? JSONSerialization.data(withJSONObject: raw),
              let value = try? JSONReader.parse(data), let kit = Kit(json: value) else { return nil }
        self.kit = kit
        finale = o["finale"] as? String ?? "That's the list."
        mat = o["mat"] as? String ?? "clean"
    }
}

/// The device's Day and Night, and the switch between them — theme.js's slots, read by the app off the page.
struct WidgetLook: Sendable, Equatable {
    /// "hand", "system" or "schedule" (theme.js SWITCH_MODES).
    var mode = "system"
    /// The slot chosen by hand, and the automation's slot a manual flip is holding against (theme.js holdAuto).
    var hand = "day"
    var hold = ""
    var dayAt = "07:00"
    var nightAt = "19:00"
    var day: WidgetKitLook?
    var night: WidgetKitLook?

    static let file = "look.json"

    static func read() -> WidgetLook? {
        guard let o = WidgetShelf.read(file) else { return nil }
        var l = WidgetLook()
        l.mode = o["mode"] as? String ?? "system"
        l.hand = o["hand"] as? String ?? "day"
        l.hold = o["hold"] as? String ?? ""
        l.dayAt = o["dayAt"] as? String ?? "07:00"
        l.nightAt = o["nightAt"] as? String ?? "19:00"
        l.day = WidgetKitLook(json: o["day"] as? [String: Any])
        l.night = WidgetKitLook(json: o["night"] as? [String: Any])
        return l
    }

    @discardableResult
    func write() -> Bool {
        var o: [String: Any] = ["mode": mode, "hand": hand, "hold": hold, "dayAt": dayAt, "nightAt": nightAt]
        if let day { o["day"] = day.json }
        if let night { o["night"] = night.json }
        return WidgetShelf.write(Self.file, o)
    }

    /// theme.js `activeSlot`: by hand, the chosen slot; under an automation, its pick — unless a manual flip still
    /// holds against that pick. `systemDark` is the widget's own colour scheme, which follows the phone's.
    func slot(at date: Date, systemDark: Bool) -> String {
        let auto: String?
        switch mode {
        case "system": auto = systemDark ? "night" : "day"
        case "schedule": auto = Self.scheduled(dayAt, nightAt, date)
        default: auto = nil
        }
        guard let auto else { return hand == "night" ? "night" : "day" }
        return !hold.isEmpty && hold == auto ? (hand == "night" ? "night" : "day") : auto
    }

    /// theme.js `scheduledSlot`, in the phone's own clock.
    static func scheduled(_ dayAt: String, _ nightAt: String, _ now: Date) -> String {
        func mins(_ t: String) -> Int? {
            let p = t.split(separator: ":"); guard p.count == 2, let h = Int(p[0]), let m = Int(p[1]) else { return nil }
            return h * 60 + m
        }
        let c = Calendar.current.dateComponents([.hour, .minute], from: now)
        let cur = (c.hour ?? 0) * 60 + (c.minute ?? 0)
        guard let d = mins(dayAt), let n = mins(nightAt), d != n else { return "day" }
        if d < n { return cur >= d && cur < n ? "day" : "night" }
        return cur >= n && cur < d ? "night" : "day"
    }

    /// The next moments a schedule changes its mind, within a day of `date`: entries for a timeline, so a widget
    /// set to switch at seven turns at seven with nothing running.
    func switches(after date: Date) -> [Date] {
        guard mode == "schedule" else { return [] }
        var out: [Date] = []
        for t in [dayAt, nightAt] {
            let p = t.split(separator: ":"); guard p.count == 2, let h = Int(p[0]), let m = Int(p[1]) else { continue }
            if let d = Calendar.current.nextDate(after: date, matching: DateComponents(hour: h, minute: m, second: 0),
                                                 matchingPolicy: .nextTime), d.timeIntervalSince(date) < 86_400 {
                out.append(d)
            }
        }
        return out.sorted()
    }

    /// The slot's look, or the kit a device that never chose gets (Paper by day, Terminal by night).
    func look(_ slot: String) -> WidgetKitLook {
        if slot == "night", let night { return night }
        if slot == "day", let day { return day }
        let kit = (slot == "night" ? Kits.defaultNight : Kits.defaultDay) ?? Kits.open.first
        return WidgetKitLook(kit: kit ?? Self.emergency, finale: "That's the list.", mat: slot == "night" ? "phosphor" : "ink")
    }

    /// Only reachable with an empty generated table, which is a broken build: grey rather than a crash.
    static let emergency = Kit(
        id: "", name: "", base: .dark, lean: .night, partner: "", pair: "", secret: false,
        colors: KitColors(ink: "#16181B", ink2: "#1E2125", ink3: "#272B30", text: "#F2EEE6", muted: "#B9B4AA",
                          dim: "#8F8C84", done: "#8F8C84", muted2: "#B9B4AA", dim2: "#8F8C84", done2: "#8F8C84",
                          accent: "#E0912F", accentHi: "#F2A94A", accentDeep: "#A86014", accentText: "#E7A04B",
                          danger: "#E5484D", hairSolid: "#5C5F63", hairAlpha: 0.12, hairHiAlpha: 0.3),
        confetti: ["#E0912F", "#F2A94A", "#A86014", "#F2EEE6", "#8F8C84"], shapes: [1], finaleItalic: false)
}
