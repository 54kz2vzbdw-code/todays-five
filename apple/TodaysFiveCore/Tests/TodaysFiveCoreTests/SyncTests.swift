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

    // ---------------------------------------------------------------- the doorbell

    @Test("a put the server accepted rings the list's channel once, with the rev it wrote and nothing else")
    func aSuccessfulPutRingsOnce() async throws {
        let server = DoorbellRecorder(MemoryTransport())
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let engine = SyncEngine(transport: server, store: try Self.tempStore(), deviceId: "device-under-test")

        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()
        #expect(await engine.status == .synced)

        var rings = await server.rings
        #expect(rings.count == 1, "one write, one bell")
        let first = try #require(rings.first)
        #expect(first.id == keys.lookupId, "the bell names the row, and the transport adds the list: prefix")
        #expect(first.payload.keys.map(\.string) == ["rev", "from"], "a doorbell, not a document")
        #expect(first.payload.num("rev") == 1)
        #expect(first.payload.str("from").string == "device-under-test")
        let wire = JSONWriter.stringify(.object(first.payload))
        #expect(!wire.contains(W) && !wire.contains(keys.R) && !wire.contains("Tap or click"),
                "no secret, no line of anybody's list")

        // a second write rings a second time, carrying the revision it produced
        var doc = await engine.document()
        doc.items["milk"] = .object(ModelTests.item("milk", [("text", .string("Milk"))]))
        await engine.update(doc)
        await engine.sync()
        rings = await server.rings
        #expect(rings.count == 2)
        #expect(rings[1].payload.num("rev") == 2)
    }

    @Test("a put the server refused rings nothing at all")
    func aRefusedPutRingsNothing() async throws {
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)

        // 413: the list is over the cap, so the write never landed and nobody is told to come and look
        let inner = MemoryTransport()
        await inner.setRefusal(.tooLarge)
        let server = DoorbellRecorder(inner)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()
        #expect(await engine.status == .toolarge)
        #expect(await server.rings.isEmpty, "a refusal is not a change")

        // and a view ref, which never puts at all, never rings either
        let view = try Keys.fromRead(keys.R)
        let viewer = DoorbellRecorder(MemoryTransport())
        let viewing = SyncEngine(transport: viewer, store: try Self.tempStore())
        await viewing.open(view, ListRecord(doc: Model.normalize(nil, keys.R), mode: .view))
        var doc = await viewing.document()
        doc.items["nope"] = .object(ModelTests.item("nope", [("text", .string("not mine to write"))]))
        await viewing.update(doc)
        await viewing.push()
        #expect(await viewer.rings.isEmpty, "a view ref pushes nothing, so it rings nothing")
    }

    @Test("a doorbell is the bytes sync.js builds, and there are 138 of them")
    func theDoorbellBodyIsTheWebs() throws {
        var payload = JSONObject()
        payload.set("rev", Double(7))
        payload.set("from", "abcdefghij")
        let body = SupabaseTransport.doorbellBody(String(repeating: "L", count: 32), payload)

        // what `JSON.stringify` gives for the object sync.js:121 builds, with the same values
        #expect(body == #"{"messages":[{"topic":"list:LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL","event":"change","payload":{"rev":7,"from":"abcdefghij"},"private":false}]}"#)
        #expect(body.utf8.count == 137, "a one-digit revision")

        payload.set("rev", Double(12))
        let two = SupabaseTransport.doorbellBody(String(repeating: "L", count: 32), payload)
        #expect(two.utf8.count == 138, "the number this round costs a write, and idle costs nothing")
        #expect(!two.contains("items") && !two.contains("doc"), "a doorbell, never the document")
    }

    /// **The hook that lets a wrist say whether the bell was rung**, which nothing could before.
    ///
    /// `ring` logs its status `#if DEBUG`, and a TestFlight build is Release — so on the one client
    /// where this matters the answer went nowhere. And it is the client that matters: every doorbell
    /// this project has ever observed was rung by `tfive` on a Mac, a process macOS keeps alive, while
    /// a watchOS app is suspended seconds after the wrist drops and the ring is an awaited round trip
    /// *after* the put has already succeeded.
    ///
    /// This exercises the failure arm on purpose, because it is the one a test can reach with no
    /// network: an unroutable host cannot answer, `ring` catches, and the report must still fire — a
    /// hook that only reports success would be silent in exactly the case somebody is looking for.
    /// The success arm is what the live run measured (HTTP 202) and what `Doorbell.report` passes
    /// through unchanged.
    @Test("the doorbell reports its answer even when there is no answer")
    func theDoorbellReportsAFailure() async throws {
        let seen = Reported()
        SupabaseTransport.Doorbell.report = { status, n in Task { await seen.add(status, n) } }
        defer { SupabaseTransport.Doorbell.report = nil }

        // A host that cannot resolve, so nothing leaves this machine and `ring`'s catch is the path.
        let transport = try SupabaseTransport(
            config: SupabaseConfig(url: "https://tf-doorbell-test.invalid", key: "not-a-key"))
        var payload = JSONObject()
        payload.set("rev", Double(2))
        payload.set("from", "abcdefghij")
        await transport.ring(String(repeating: "L", count: 22), payload)

        // The task hop above is why this waits rather than reads.
        for _ in 0..<100 where await seen.all.isEmpty { try? await Task.sleep(for: .milliseconds(20)) }
        let all = await seen.all
        #expect(all.count == 1, "the report fires once per ring, answered or not")
        #expect(all.first?.0 == 0, "status 0 is the wire form of 'there was no answer'")
        // **URLError codes are negative**, which the first version of this assertion got wrong and
        // this test caught: an unresolvable host reports -1003, `cannotFindHost`. It is worth the
        // line, because the number a wrist will actually see here is one of these — -1009 for
        // offline, -1001 for a timeout — and a reader of the Diagnostics screen should not be
        // startled by a minus sign.
        #expect(all.first?.1 == URLError.cannotFindHost.rawValue,
                "and the second number is the URLError code, which is -1003 for a host that is not there")
    }

    /// A collector for the hook, because the hook is `@Sendable` and the test is not an actor.
    actor Reported {
        var all: [(Int, Int)] = []
        func add(_ a: Int, _ b: Int) { all.append((a, b)) }
    }

    @Test("a transport with no doorbell pushes exactly as it did before there was one")
    func aTransportWithoutADoorbellIsFine() async throws {
        let plain: any Transport = MemoryTransport()
        #expect((plain as? any DoorbellTransport) == nil,
                "MemoryTransport has no doorbell, which is how every test in this package stays offline")

        let server = MemoryTransport()
        let W = Model.newId()
        let keys = try Keys.fromWrite(W)
        let engine = SyncEngine(transport: server, store: try Self.tempStore())
        await engine.open(keys, ListRecord(doc: Doc.seed(id: W), rev: 0, dirty: true, created: true))
        await engine.sync()
        #expect(await engine.status == .synced)
        #expect(await server.row(keys.lookupId)?.rev == 1)
        #expect(await server.calls() == ["get \(keys.lookupId) nil", "put \(keys.lookupId) 0"],
                "the doorbell added no call of its own to a transport that cannot ring")
    }
}

/// `MemoryTransport` with a bell on it, for the three tests above and nowhere else. The real
/// transport is left alone deliberately: the moment a test double can broadcast, a test can reach the
/// network by forgetting a flag, and this package's whole test story is that it cannot.
actor DoorbellRecorder: DoorbellTransport {
    struct Ring: Sendable {
        let id: String
        let payload: JSONObject
    }

    public nonisolated let kind = "memory+doorbell"
    private let inner: MemoryTransport
    private(set) var rings: [Ring] = []

    init(_ inner: MemoryTransport) { self.inner = inner }

    func get(_ id: String, knownRev: Int?) async throws -> GetResult? { try await inner.get(id, knownRev: knownRev) }
    func put(_ id: String, envelope: JSONObject, baseRev: Int, token: String?) async throws -> PutResult {
        try await inner.put(id, envelope: envelope, baseRev: baseRev, token: token)
    }
    func delete(_ id: String, token: String?) async throws -> Bool { try await inner.delete(id, token: token) }
    func ring(_ id: String, _ payload: JSONObject) async { rings.append(Ring(id: id, payload: payload)) }
    func row(_ id: String) async -> MemoryTransport.Row? { await inner.row(id) }
}

private extension ListRecord {
    /// Reading `merged.items[...]` in a test reads the document's.
    var items: JSONObject { doc.items }
}
