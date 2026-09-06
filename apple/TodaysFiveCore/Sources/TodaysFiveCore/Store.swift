// Store.swift — one JSON file per list under Application Support, the same record sync.js keeps in
// localStorage under `tf/v3/list/<link>`: the decrypted document with `rev`, `dirty`, `created` and
// `mode`, plus `origin` (which sync.js keeps in the device registry — a Watch app or a widget reads
// one list and has no registry panel to consult).
//
// COMPATIBILITY.md §5: migrate on read, never wipe. A record missing a field gets that field's
// default when it is read, and an unknown key in the file is kept.
import Foundation

public struct ListRecord: Sendable {
    public var doc: Doc
    public var rev: Int
    public var dirty: Bool
    /// A list this device made itself (new, migrated, rotated): only these may be inserted on the server.
    public var created: Bool
    public var mode: LinkMode
    /// "mine" or "shared", the 1.4 origin.
    public var origin: String
    public var savedAt: Double
    /// Anything a later version wrote that this one does not know.
    public var extra: JSONObject

    public init(doc: Doc, rev: Int = 0, dirty: Bool = false, created: Bool = false,
                mode: LinkMode = .edit, origin: String = "mine",
                savedAt: Double = CalendarDates.now(), extra: JSONObject = JSONObject()) {
        self.doc = doc
        self.rev = rev
        self.dirty = dirty
        self.created = created
        self.mode = mode
        self.origin = origin
        self.savedAt = savedAt
        self.extra = extra
    }
}

public struct ListStore: Sendable {
    public let directory: URL

    /// `Application Support/TodaysFive/lists`, made on demand.
    public init(directory: URL? = nil) throws {
        if let directory {
            self.directory = directory
        } else {
            let support = try FileManager.default.url(for: .applicationSupportDirectory,
                                                      in: .userDomainMask, appropriateFor: nil, create: true)
            self.directory = support.appendingPathComponent("TodaysFive/lists", isDirectory: true)
        }
        try FileManager.default.createDirectory(at: self.directory, withIntermediateDirectories: true)
    }

    /// The list id is base62, so it is its own filename — as it is its own localStorage key on the web.
    func file(_ id: String) -> URL { directory.appendingPathComponent(id + ".json") }

    public func load(_ id: String) -> ListRecord? {
        guard let data = try? Data(contentsOf: file(id)),
              let o = (try? JSONReader.parse(data))?.objectValue,
              let docJSON = o["doc"]?.objectValue else { return nil }
        var extra = JSONObject()
        let known: Set<JSString> = Set(["doc", "rev", "dirty", "created", "mode", "origin", "savedAt"].map { JSString($0) })
        extra.passThrough(from: o, known: known)
        return ListRecord(
            doc: Model.normalize(.object(docJSON), id),
            rev: Int(o.num("rev")),
            dirty: o.truthy("dirty"),
            created: o.truthy("created"),
            mode: o.str("mode") == "view" ? .view : .edit,
            origin: o.str("origin") == "shared" ? "shared" : "mine",
            savedAt: o.num("savedAt"),
            extra: extra
        )
    }

    public func save(_ id: String, _ record: ListRecord) throws {
        var o = JSONObject()
        o["doc"] = .object(record.doc.json)
        o.set("rev", Double(record.rev))
        o.set("dirty", record.dirty)
        o.set("created", record.created)
        o.set("mode", record.mode.rawValue)
        o.set("origin", record.origin)
        o.set("savedAt", record.savedAt)
        for k in record.extra.keys where o[k] == nil { o[k] = record.extra[k] }
        let text = JSONWriter.pretty(.object(o)) + "\n"
        try Data(text.utf8).write(to: file(id), options: .atomic)
    }

    /// Merge-on-write, the way sync.js's persist() does it: another process may have written the same
    /// list, and neither copy may lose an edit.
    @discardableResult
    public func merge(_ id: String, _ record: ListRecord) throws -> ListRecord {
        guard let stored = load(id) else {
            try save(id, record)
            return record
        }
        if stored.doc.canon == record.doc.canon {
            var out = record
            out.rev = max(stored.rev, record.rev)
            out.created = record.created || stored.created
            try save(id, out)
            return out
        }
        let merged = Model.merge(stored.doc, record.doc)
        var out = record
        out.doc = merged
        out.rev = max(stored.rev, record.rev)
        out.dirty = stored.dirty || record.dirty || merged.canon != record.doc.canon
        out.created = record.created || stored.created
        try save(id, out)
        return out
    }

    public func remove(_ id: String) {
        try? FileManager.default.removeItem(at: file(id))
    }

    public func ids() -> [String] {
        let names = (try? FileManager.default.contentsOfDirectory(atPath: directory.path)) ?? []
        return names.filter { $0.hasSuffix(".json") }.map { String($0.dropLast(5)) }.sorted()
    }
}
