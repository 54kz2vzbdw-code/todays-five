// SyncEngine.swift — pull, merge on plaintext, push, and the conflict retry. The semantics are
// sync.js's, rule for rule:
//
//   * the server only ever sees envelopes: the engine decrypts what it pulls, merges on plaintext
//     (merge is commutative and idempotent) and re-encrypts what it pushes with a fresh iv;
//   * a view ref has no token and never pushes, and a local edit on one never marks it dirty;
//   * a rotated or deleted id is *gone* and is never resurrected — a null from get, or a revision
//     lower than the one we hold, or a plaintext row under a v3 id;
//   * only a list this device created may be inserted (rev 0, created, an edit link);
//   * 403 and 413 hold the list off the wire until the next local change; 429 and 507 hold it for
//     five and ten minutes, so one refusal cannot become a burst;
//   * a put that succeeded rings the list's channel — the mirror of sync.js:331, so a phone with the
//     same list open pulls now instead of at its next poll (see `ringDoorbell`).
//
// An actor, so the state is safe to touch from a widget, a Watch app and the shell at once. There is
// no timer here: the caller drives, which is what a CLI, a background refresh and a widget all want.
// `pollDelay` says what sync.js's safety-net poll would use.
import CryptoKit
import Foundation

public actor SyncEngine {

    public enum Status: String, Sendable {
        case off, synced, syncing, offline, error, gone
        case readonly       // 403: our token is not the row's
        case toolarge       // 413
        case busy           // 429
        case full           // 507
        case unreadable     // the envelope did not open with our key
    }

    public struct Snapshot: Sendable {
        public let id: String
        public let mode: LinkMode
        public let lookupId: String
        public let rev: Int
        public let dirty: Bool
        public let gone: Bool
        public let status: Status
    }

    public static let pollMs = 60_000
    public static let pollLiveMs = 240_000
    public static let holdBusy: TimeInterval = 5 * 60
    public static let holdFull: TimeInterval = 10 * 60

    private let transport: (any Transport)?
    private let store: ListStore?
    private let dates: CalendarDates
    private let deviceId: String

    private var keys: ListKeys?
    private var doc = Doc()
    private var rev = 0
    private var dirty = false
    private var created = false
    private var origin = "mine"
    private var isGone = false
    private var version = 0
    private var holdUntil: Date?
    private var holdForever = false
    private var holdStatus: Status = .error

    public private(set) var status: Status = .off

    /// `deviceId` is the `from` on a doorbell, and it is defaulted so that every call site that
    /// existed before the doorbell did goes on compiling unchanged. It identifies nothing and is
    /// worth nothing to anybody who reads it: a fresh `shortId()` per engine, whose only job is to
    /// differ from the id of the device that is listening, so a broadcast a device caused cannot make
    /// that same device pull. sync.js uses `dev.id + ":" + shortId()` — per tab — for exactly this
    /// and nothing else, and ten characters here can never collide with its thirty-three.
    public init(transport: (any Transport)? = nil, store: ListStore? = nil,
                dates: CalendarDates = CalendarDates(),
                deviceId: String = Model.shortId()) {
        self.transport = transport
        self.store = store
        self.dates = dates
        self.deviceId = deviceId
    }

    // ---------------------------------------------------------------- opening

    /// Start syncing a list. `record` is what the store already holds (or a fresh one).
    public func open(_ keys: ListKeys, _ record: ListRecord) {
        self.keys = keys
        self.doc = record.doc
        self.rev = record.rev
        self.created = record.created
        self.origin = record.origin
        // sync.js: a created list at rev 0 is dirty even when nothing has been edited — it has never
        // been sent. A view ref is never dirty.
        self.dirty = keys.mode == .edit && (record.dirty || (record.rev == 0 && record.created))
        self.isGone = false
        self.version = 0
        self.holdUntil = nil
        self.holdForever = false
        status = transport == nil ? .off : .synced
        persist()
    }

    public func current() -> Snapshot? {
        guard let keys else { return nil }
        return Snapshot(id: keys.id, mode: keys.mode, lookupId: keys.lookupId,
                        rev: rev, dirty: dirty, gone: isGone, status: status)
    }

    public func document() -> Doc { doc }

    public func record() -> ListRecord {
        ListRecord(doc: doc, rev: rev, dirty: dirty, created: created,
                   mode: keys?.mode ?? .edit, origin: origin)
    }

    /// What sync.js's safety-net poll would wait. Live updates are not in this phase, so it is the
    /// slower one only when a caller says the channel is up.
    public nonisolated func pollDelay(live: Bool = false) -> Int { live ? Self.pollLiveMs : Self.pollMs }

    // ---------------------------------------------------------------- local edits

    /// The caller changed the document.
    public func update(_ newDoc: Doc) {
        guard keys != nil else { return }
        doc = newDoc
        version += 1
        guard keys?.mode == .edit else { persist(); return }
        dirty = true
        // a new local change gets one fresh attempt after a 403 or a 413
        if holdForever { holdForever = false; holdUntil = nil }
        persist()
    }

    /// Pull, then push anything pending. What the CLI and a background refresh both want.
    @discardableResult
    public func sync() async -> Status {
        await pull()
        if dirty && !isGone { await push() }
        return status
    }

    // ---------------------------------------------------------------- pull

    public func pull() async {
        guard let keys, let transport else { return }
        if isGone { return }
        status = .syncing
        do {
            let result = try await transport.get(keys.lookupId, knownRev: rev > 0 ? rev : nil)
            guard let result else {
                // only a list this device created may be inserted; anything else is gone
                if rev == 0 && created && keys.mode == .edit {
                    dirty = true
                    await push()
                } else {
                    markGone()
                }
                return
            }
            if result.unchanged {
                if dirty { await push() } else { status = .synced }
                return
            }
            if result.rev < rev {
                markGone()                      // the row was recreated after a rotate or a delete
                return
            }
            guard let envelopeJSON = result.document, let envelope = Envelope(json: envelopeJSON) else {
                markGone()                      // a plaintext row under a v3 id is not ours
                return
            }
            let remote: Doc
            do {
                remote = Model.normalize(.object(try Crypto.openDocument(key: keys.key, envelope: envelope)), keys.id)
            } catch {
                status = .unreadable
                return
            }
            let merged = Model.merge(doc, remote)
            let cm = merged.canon
            let changedLocal = cm != doc.canon
            let changedRemote = cm != remote.canon
            rev = result.rev
            if changedLocal { doc = merged; version += 1 }
            if changedRemote && keys.mode == .edit { dirty = true }
            persist()
            if dirty { await push() } else { status = .synced }
        } catch {
            failed(error)
        }
    }

    // ---------------------------------------------------------------- push

    public func push() async {
        guard let keys, let transport else { return }
        guard keys.mode == .edit else { dirty = false; if !isGone { status = .synced }; return }
        guard dirty, !isGone else { if !isGone { status = .synced }; return }
        if holdForever || (holdUntil.map { $0 > Date() } ?? false) {
            status = holdStatus
            return
        }
        status = .syncing
        do {
            for _ in 0..<6 {
                let sentVersion = version
                let sentDoc = doc
                var wire = sentDoc.json
                wire.remove("id")                       // forWire(): a viewer must never learn W
                let envelope = try Crypto.seal(key: keys.key, document: wire)
                let result = try await transport.put(keys.lookupId, envelope: envelope.json,
                                                     baseRev: rev, token: keys.token)
                if result.ok {
                    rev = result.rev
                    if version == sentVersion { dirty = false }
                    persist()
                    await ringDoorbell()                // sync.js:331, in the same place in the block
                    if dirty { continue }               // edited while the put was in flight
                    break
                }
                // gone: the row was never there to take a base from, or it went backwards
                if (result.document == nil && result.rev == 0) || result.rev < rev {
                    markGone()
                    return
                }
                guard let staleJSON = result.document, let stale = Envelope(json: staleJSON) else {
                    markGone()
                    return
                }
                let remote: Doc
                do {
                    remote = Model.normalize(.object(try Crypto.openDocument(key: keys.key, envelope: stale)), keys.id)
                } catch {
                    status = .unreadable
                    return
                }
                let merged = Model.merge(doc, remote)
                rev = result.rev
                if merged.canon != doc.canon { doc = merged; version += 1 }
                if merged.canon == remote.canon { dirty = false; persist(); break }
                persist()
            }
            status = dirty ? .error : .synced
        } catch {
            failed(error)
        }
    }

    /// Push whatever is pending now (used before rotating or leaving).
    public func flush() async { await push() }

    /// The mirror of `sync.js:331`, and the whole of this round's fix.
    ///
    /// It lives in `push()` rather than anywhere nearer a particular app, so the Watch, `tfive` on
    /// the Mac and the *Add to Today's Five* App Intent all get it in one place: every one of them
    /// writes through this method and, until now, every one of them wrote in silence. A phone with
    /// the same list open had joined the channel, seen the join succeed, and moved its safety-net
    /// poll from 60 s to 240 s on the strength of a bell that nothing in the system rang — so the
    /// phone whose realtime was *working* was the slower one. Measured with `tools/polld.js` before
    /// this line existed: a write took a median of 132 s to appear and as long as 238 s.
    ///
    /// Three things it is careful about:
    ///
    ///  * **only after a put that the server accepted.** Nothing is rung at idle, on a refusal, on a
    ///    stale-base retry, or by a view ref that never pushes. The cost of the fix on a device that
    ///    is not writing is exactly zero requests, which is why the poll can stay at 240 s.
    ///  * **it is awaited, where sync.js's is not.** The web is a page that stays alive; `tfive add`
    ///    and an App Intent are processes that write once and return, and an unawaited task in one of
    ///    those is a request that dies before it is sent. The cost is one round trip on a write.
    ///  * **a transport with no doorbell is not an error.** `MemoryTransport` does not conform, so
    ///    every test in this package stays offline without a flag to set or a stub to remember.
    private func ringDoorbell() async {
        guard let keys, let doorbell = transport as? any DoorbellTransport else { return }
        var payload = JSONObject()
        payload.set("rev", Double(rev))
        payload.set("from", deviceId)                   // sync.js's key order: rev, then from
        await doorbell.ring(keys.lookupId, payload)
    }

    // ---------------------------------------------------------------- delete

    /// Remove the row from the server. The caller decides what to do with the local copy.
    public func removeRemote() async throws -> Bool {
        guard let keys, let transport else { return false }
        return try await transport.delete(keys.lookupId, token: keys.token)
    }

    // ---------------------------------------------------------------- the rest

    private func markGone() {
        isGone = true
        status = .gone
    }

    /// The error mapping from sync.js's failed(): a refusal must not become a burst.
    private func failed(_ error: any Error) {
        guard let e = error as? SyncError else { status = .error; return }
        switch e.kind {
        case .forbidden:
            status = .readonly; holdForever = true; holdStatus = .readonly
        case .tooLarge:
            status = .toolarge; holdForever = true; holdStatus = .toolarge
        case .busy:
            status = .busy; holdStatus = .busy; holdUntil = Date().addingTimeInterval(Self.holdBusy)
        case .full:
            status = .full; holdStatus = .full; holdUntil = Date().addingTimeInterval(Self.holdFull)
        case .network:
            status = .offline
        default:
            status = .error
        }
    }

    private func persist() {
        guard let store, let keys else { return }
        _ = try? store.merge(keys.id, record())
    }
}
