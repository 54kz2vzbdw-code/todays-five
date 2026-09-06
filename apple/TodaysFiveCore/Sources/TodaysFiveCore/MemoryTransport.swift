// MemoryTransport.swift — the same server semantics in memory: token hashes, the unchanged
// short-circuit, the stale-base answer, 403 on the wrong token, and a switch for each refusal the
// real server can give. This is what sync.js's local transport is for, and what the sync tests run
// against so they never touch the real backend.
import CryptoKit
import Foundation

public actor MemoryTransport: Transport {
    public nonisolated let kind = "memory"

    public struct Row: Sendable {
        public var envelope: JSONObject
        public var rev: Int
        public var tokenHash: String?
    }

    private var rows: [String: Row] = [:]
    private(set) public var log: [String] = []

    /// The refusal to give on the next call, if any: the server's own 403 / 413 / 429 / 507.
    public var refuse: SyncErrorKind?
    /// Every put fails with this until it is cleared.
    public var offline = false

    public init() {}

    public func setRefusal(_ kind: SyncErrorKind?) { refuse = kind }
    public func setOffline(_ value: Bool) { offline = value }
    public func rowCount() -> Int { rows.count }
    public func row(_ id: String) -> Row? { rows[id] }
    public func seed(_ id: String, envelope: JSONObject, rev: Int, token: String?) {
        rows[id] = Row(envelope: envelope, rev: rev, tokenHash: token.map(Self.hash))
    }
    public func calls() -> [String] { log }
    public func clearLog() { log = [] }

    static func hash(_ token: String) -> String {
        SHA256.hash(data: Data(token.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    private func guardAgainstRefusal() throws {
        if offline { throw SyncError("network", kind: .network) }
        if let refuse {
            self.refuse = nil
            switch refuse {
            case .busy: throw SyncError("Too many new lists from this network. Try again in a few minutes.", status: 429, code: "PT429")
            case .full: throw SyncError("The service is full.", status: 507, code: "PT507")
            case .forbidden: throw SyncError("This link can only view the list.", status: 403, code: "PT403")
            case .tooLarge: throw SyncError("This list is too large to sync.", status: 413, code: "PT413")
            default: throw SyncError("refused", status: 500, code: "")
            }
        }
    }

    public func get(_ id: String, knownRev: Int?) async throws -> GetResult? {
        log.append("get \(id) \(knownRev.map(String.init) ?? "nil")")
        try guardAgainstRefusal()
        guard let row = rows[id] else { return nil }
        if let knownRev, row.rev == knownRev {
            return GetResult(unchanged: true, rev: row.rev, document: nil)
        }
        return GetResult(unchanged: false, rev: row.rev, document: row.envelope)
    }

    public func put(_ id: String, envelope: JSONObject, baseRev: Int, token: String?) async throws -> PutResult {
        log.append("put \(id) \(baseRev)")
        try guardAgainstRefusal()
        guard let row = rows[id] else {
            // never recreate a row that was deleted or rotated
            if baseRev != 0 { return PutResult(ok: false, rev: 0, document: nil) }
            guard let token, token.count == 43 else {
                throw SyncError("bad token", status: 400, code: "PT400")
            }
            rows[id] = Row(envelope: envelope, rev: 1, tokenHash: Self.hash(token))
            return PutResult(ok: true, rev: 1, document: nil)
        }
        guard let token, row.tokenHash == Self.hash(token) else {
            throw SyncError("This link can only view the list.", status: 403, code: "PT403")
        }
        if row.rev != baseRev {
            return PutResult(ok: false, rev: row.rev, document: row.envelope)
        }
        rows[id] = Row(envelope: envelope, rev: row.rev + 1, tokenHash: row.tokenHash)
        return PutResult(ok: true, rev: row.rev + 1, document: nil)
    }

    public func delete(_ id: String, token: String?) async throws -> Bool {
        log.append("delete \(id)")
        try guardAgainstRefusal()
        guard let row = rows[id] else { return false }
        if let hash = row.tokenHash {
            guard let token, hash == Self.hash(token) else {
                throw SyncError("This link can only view the list.", status: 403, code: "PT403")
            }
        }
        rows.removeValue(forKey: id)
        return true
    }
}
