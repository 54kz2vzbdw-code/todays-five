// The sync cases from test/sync.test.js, ported. Each subtle rule sync.js has gets a test here:
// gone is never resurrected, only a created list is inserted, a view ref never pushes, and a refusal
// does not become a burst.
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("Sync: the engine against a server that behaves like the real one")
struct SyncTests {

    static func tempStore() throws -> ListStore {
        let dir = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("tfive-tests-\(UUID().uuidString)", isDirectory: true)
        return try ListStore(directory: dir)
    }

    @Test("a created list is pushed as an envelope; the server never holds plaintext or the secret")
    func createdListIsSealed() async throws {
        let server = MemoryTransport()
        let store = try Self.tempStore()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let engine = SyncEngine(transport: server, store: store)

        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()

        let row = try #require(await server.row(keys.lookupId))
        #expect(Envelope(json: row.envelope) != nil)
        #expect(row.rev == 1)
        let wire = JSONWriter.stringify(.object(row.envelope))
        #expect(!wire.contains(W) && !wire.contains(keys.R) && !wire.contains("Tap or click"),
                "no secret and no plaintext on the wire")

        let back = try Crypto.openDocument(key: keys.key, envelope: try #require(Envelope(json: row.envelope)))
        #expect(back.obj("items").count == 3)
        #expect(back["id"] == nil, "the list secret is stripped before sealing")

        #expect(await engine.status == .synced)
        #expect(await engine.current()?.rev == 1)
        #expect(store.load(W)?.mode == .edit)
        #expect(store.load(W)?.dirty == false)
    }

    @Test("a view ref pulls and decrypts, never pushes, and local edits do not mark it dirty")
    func viewRefNeverPushes() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let edit = try Keys.fromWrite(W)
        let view = try Keys.fromRead(edit.R)
        var wire = Doc.seed(id: W).json
        wire.remove("id")
        await server.seed(edit.lookupId,
                          envelope: try Crypto.seal(key: edit.key, document: wire).json,
                          rev: 3, token: edit.token)

        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(view, ListRecord(doc: Model.normalize(nil, edit.R), mode: .view))
        await engine.pull()

        let doc = await engine.document()
        #expect(doc.items.count == 3)
        #expect(doc.id == edit.R, "the view's local doc is keyed by the view secret")

        var edited = doc
        var first = try #require(edited.items[doc.todayItems[0].idJS]?.objectValue)
        first.set("done", true)
        edited.items[doc.todayItems[0].idJS] = .object(first)
        await engine.update(edited)
        await engine.push()

        #expect(await server.calls().contains { $0.hasPrefix("put") } == false, "no put from a view ref")
        #expect(await engine.current()?.dirty == false)
        #expect(await engine.current()?.mode == .view)
    }

    @Test("a write with the wrong token is refused (403): readonly, and no retry storm")
    func forbiddenHolds() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let edit = try Keys.fromWrite(W)
        var wire = Doc.seed(id: W).json
        wire.remove("id")
        await server.seed(edit.lookupId,
                          envelope: try Crypto.seal(key: edit.key, document: wire).json,
                          rev: 1, token: edit.token)

        // a forged ref: the view key, dressed as an edit link, with a token that is not the row's
        let view = try Keys.fromRead(edit.R)
        let forged = ListKeys(mode: .edit, id: view.id, W: nil, R: view.R,
                              lookupId: view.lookupId, key: view.key,
                              token: String(repeating: "x", count: 43))
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(forged, ListRecord(doc: Doc.seed(id: W), rev: 1, dirty: true))
        await engine.push()
        #expect(await engine.status == .readonly)

        let puts = await server.calls().filter { $0.hasPrefix("put") }.count
        await engine.push()
        await engine.push()
        #expect(await server.calls().filter { $0.hasPrefix("put") }.count == puts,
                "no further puts after a 403")

        // one local change buys one fresh attempt, and no more
        await engine.update(Doc.seed(id: W))
        await engine.push()
        #expect(await server.calls().filter { $0.hasPrefix("put") }.count == puts + 1)
    }

    @Test("an unchanged poll carries the known rev and transfers no document")
    func unchangedPoll() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()
        await server.clearLog()
        await engine.pull()
        #expect(await server.calls().first == "get \(keys.lookupId) 1")
        #expect(await engine.status == .synced)
        #expect(await engine.pollDelay() == SyncEngine.pollMs)
        #expect(await engine.pollDelay(live: true) == SyncEngine.pollLiveMs)
    }

    @Test("conflict: decrypt the server envelope, merge on plaintext, re-encrypt, retry; both converge")
    func conflictMergesAndRetries() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        var n = 0
        let base = Doc.seed(id: W, at: 1000, idFn: { n += 1; return "s\(n)" })
        let ids = base.todayItems.map(\.idJS)

        // device B pushed rev 2 while device A was offline from rev 1
        var bDoc = Model.normalize(.object(base.json), W)
        var b1 = try #require(bDoc.items[ids[1]]?.objectValue)
        b1.set("text", "from B")
        b1.set("updatedAt", 3000)
        bDoc.items[ids[1]] = .object(b1)
        var bWire = bDoc.json
        bWire.remove("id")
        await server.seed(keys.lookupId, envelope: try Crypto.seal(key: keys.key, document: bWire).json,
                          rev: 2, token: keys.token)

        var aDoc = Model.normalize(.object(base.json), W)
        var a0 = try #require(aDoc.items[ids[0]]?.objectValue)
        a0.set("done", true)
        a0.set("doneAt", 2500)
        a0.set("updatedAt", 2500)
        aDoc.items[ids[0]] = .object(a0)

        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: aDoc, rev: 1, dirty: true))
        await engine.sync()

        #expect(await engine.status == .synced)
        #expect(await engine.current()?.rev == 3)
        let row = try #require(await server.row(keys.lookupId))
        let onServer = try Crypto.openDocument(key: keys.key, envelope: try #require(Envelope(json: row.envelope)))
        let merged = Model.normalize(.object(onServer), W)
        #expect(merged.items[ids[0]]?.objectValue?.truthy("done") == true, "A's check survived")
        #expect(merged.items[ids[1]]?.objectValue?.str("text") == "from B", "B's edit survived")
        #expect(await engine.document().items[ids[1]]?.objectValue?.str("text") == "from B",
                "A was told about B's edit")
    }

    @Test("a missing row for a link this device did not create is gone, and is never refilled")
    func missingRowIsGone() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 4, dirty: false, created: false))
        await engine.sync()
        #expect(await engine.status == .gone)
        #expect(await server.rowCount() == 0)
    }

    @Test("a device that never created the list cannot re-create a deleted row by accident")
    func neverRecreate() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 3, dirty: true, created: false))
        await engine.sync()
        #expect(await engine.status == .gone)
        #expect(await server.rowCount() == 0)
    }

    @Test("a row recreated with a lower rev is gone, never merged into")
    func lowerRevIsGone() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        var wire = Doc.seed(id: W).json
        wire.remove("id")
        await server.seed(keys.lookupId, envelope: try Crypto.seal(key: keys.key, document: wire).json,
                          rev: 1, token: keys.token)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 9, dirty: false, created: false))
        await engine.pull()
        #expect(await engine.status == .gone)
    }

    @Test("a plaintext row under a v3 id is not ours")
    func plaintextRowIsGone() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        var plain = JSONObject()
        plain.set("v", 2)
        plain["items"] = .object(JSONObject())
        await server.seed(keys.lookupId, envelope: plain, rev: 1, token: keys.token)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: false, created: false))
        await engine.pull()
        #expect(await engine.status == .gone)
    }

    @Test("429 on create: busy, the list kept locally as dirty and created, one attempt only")
    func busyHolds() async throws {
        let server = MemoryTransport()
        let store = try Self.tempStore()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        await server.setRefusal(.busy)
        let engine = SyncEngine(transport: server, store: store)
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()
        #expect(await engine.status == .busy)

        let puts = await server.calls().filter { $0.hasPrefix("put") }.count
        await engine.push()
        #expect(await server.calls().filter { $0.hasPrefix("put") }.count == puts,
                "one attempt, then a long hold")
        let kept = try #require(store.load(W))
        #expect(kept.dirty && kept.created, "kept locally as dirty and created")
    }

    @Test("507 holds the list off the wire too")
    func fullHolds() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        await server.setRefusal(.full)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()
        #expect(await engine.status == .full)
    }

    @Test("offline: the status says so, the edit is kept, and reconnecting sends it")
    func offlineKeepsTheEdit() async throws {
        let server = MemoryTransport()
        let store = try Self.tempStore()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let engine = SyncEngine(transport: server, store: store)
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()
        #expect(await engine.status == .synced)

        await server.setOffline(true)
        var doc = await engine.document()
        doc.items["offline1"] = .object(ModelTests.item("offline1", [("text", .string("Written on a plane"))]))
        await engine.update(doc)
        await engine.sync()
        #expect(await engine.status == .offline)
        #expect(store.load(W)?.dirty == true, "the offline edit is kept")

        await server.setOffline(false)
        await engine.sync()
        #expect(await engine.status == .synced)
        let row = try #require(await server.row(keys.lookupId))
        let back = try Crypto.openDocument(key: keys.key, envelope: try #require(Envelope(json: row.envelope)))
        #expect(back.obj("items")["offline1"] != nil, "the offline edit reached the server")
    }

    @Test("delete everywhere, then undo: the row comes back under the same lookup id and token")
    func deleteThenUndo() async throws {
        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()
        let doc = await engine.document()

        #expect(try await engine.removeRemote() == true)
        #expect(await server.rowCount() == 0)
        #expect(try await engine.removeRemote() == false, "nothing to delete twice")

        let again = SyncEngine(transport: server, store: try Self.tempStore())
        await again.open(keys, ListRecord(doc: doc, rev: 0, dirty: true, created: true))
        await again.sync()
        let row = try #require(await server.row(keys.lookupId))
        #expect(row.rev == 1)
        #expect(row.tokenHash == MemoryTransport.hash(try #require(keys.token)))
        let back = try Crypto.openDocument(key: keys.key, envelope: try #require(Envelope(json: row.envelope)))
        #expect(back.obj("items").count == 3, "the same three lines")
    }

    // ---------------------------------------------------------------- the store

    @Test("the store keeps rev, dirty, created, mode and origin, and anything it does not know")
    func storeRoundTrip() throws {
        let store = try Self.tempStore()
        let W = Model.newId()
        var record = ListRecord(doc: Doc.seed(id: W, at: 1000), rev: 2, dirty: true,
                                created: true, mode: .view, origin: "shared", savedAt: 5)
        record.extra.set("aFutureField", "kept")
        try store.save(W, record)

        let back = try #require(store.load(W))
        #expect(back.rev == 2)
        #expect(back.dirty)
        #expect(back.created)
        #expect(back.mode == .view)
        #expect(back.origin == "shared")
        #expect(back.doc.canon == Model.normalize(.object(record.doc.json), W).canon)
        #expect(back.extra.str("aFutureField") == "kept", "an unknown key in the file is kept")
        #expect(store.ids().contains(W))
        store.remove(W)
        #expect(store.load(W) == nil)
    }

    @Test("the store merges on write, so a second writer cannot lose an edit")
    func storeMergesOnWrite() throws {
        let store = try Self.tempStore()
        let W = Model.newId()
        var a = Model.normalize(nil, W)
        a.items["a"] = .object(ModelTests.item("a", [("text", .string("from A")), ("updatedAt", .number(10))]))
        try store.save(W, ListRecord(doc: a, rev: 1))

        var b = Model.normalize(nil, W)
        b.items["b"] = .object(ModelTests.item("b", [("text", .string("from B")), ("updatedAt", .number(20))]))
        let merged = try store.merge(W, ListRecord(doc: b, rev: 2, dirty: false))

        #expect(merged.items["a"] != nil && merged.doc.items["b"] != nil)
        #expect(merged.rev == 2)
        #expect(merged.dirty, "the merge added something the caller had not sent, so it is dirty")
        let onDisk = try #require(store.load(W))
        #expect(onDisk.doc.items.count == 2)
    }

    @Test("a store record with a missing field gets that field's default when it is read")
    func storeMigratesOnRead() throws {
        let store = try Self.tempStore()
        let W = Model.newId()
        let text = #"{"doc":{"v":3,"items":{}},"rev":4}"#
        try Data(text.utf8).write(to: store.file(W))
        let back = try #require(store.load(W))
        #expect(back.rev == 4)
        #expect(back.dirty == false)
        #expect(back.created == false)
        #expect(back.mode == .edit)
        #expect(back.origin == "mine")
        #expect(back.doc.id == W)
    }
}

private extension ListRecord {
    /// Reading `merged.items[...]` in a test reads the document's.
    var items: JSONObject { doc.items }
}
