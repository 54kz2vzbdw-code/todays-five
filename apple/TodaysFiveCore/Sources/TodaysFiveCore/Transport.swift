// Transport.swift — the interface the sync engine talks to, and the error mapping.
//
// sync.js keeps the same shape: get / put / del, with a `subscribe` that the engine uses when the
// transport has one. Realtime is not in this phase, so `subscribe` lives on a second protocol a
// transport may also conform to — adding it later touches the transport, never the callers.
import Foundation

public enum SyncErrorKind: String, Sendable {
    case network        // no answer at all
    case badRequest     // PT400: a malformed id, token or envelope
    case forbidden      // PT403: this link can only view the list
    case tooLarge       // PT413: the list is over the 96 KB cap
    case busy           // PT429: too many new lists from this address
    case full           // PT507: the service is full
    case server         // anything else the server said
    case decode         // an answer we could not read
}

public struct SyncError: Error, Sendable, CustomStringConvertible {
    public let message: String
    public let status: Int
    public let code: String
    public let kind: SyncErrorKind

    public init(_ message: String, status: Int = 0, code: String = "", kind: SyncErrorKind? = nil) {
        self.message = message
        self.status = status
        self.code = code
        self.kind = kind ?? Self.kind(status: status, code: code)
    }

    /// The migration raises PT400/403/413/429/507 and PostgREST turns each into that HTTP status.
    /// Both are read, because the code survives a proxy that rewrites the status and vice versa.
    static func kind(status: Int, code: String) -> SyncErrorKind {
        switch code {
        case "PT400": return .badRequest
        case "PT403": return .forbidden
        case "PT413": return .tooLarge
        case "PT429": return .busy
        case "PT507": return .full
        default: break
        }
        switch status {
        case 0: return .network
        case 400, 404, 422: return .badRequest
        case 401, 403: return .forbidden
        case 413: return .tooLarge
        case 429: return .busy
        case 507: return .full
        default: return .server
        }
    }

    public var description: String { "\(message) [\(kind.rawValue) \(status) \(code)]" }
}

/// `get_list_v3`'s answer: nothing at all (the row is gone), the short-circuit, or the row.
public struct GetResult: Sendable {
    public let unchanged: Bool
    public let rev: Int
    public let document: JSONObject?

    public init(unchanged: Bool, rev: Int, document: JSONObject?) {
        self.unchanged = unchanged
        self.rev = rev
        self.document = document
    }
}

/// `put_list_v3`'s answer: `{ok:true, rev}`, or `{ok:false, rev, doc}` for a stale base.
public struct PutResult: Sendable {
    public let ok: Bool
    public let rev: Int
    public let document: JSONObject?

    public init(ok: Bool, rev: Int, document: JSONObject?) {
        self.ok = ok
        self.rev = rev
        self.document = document
    }
}

public protocol Transport: Sendable {
    var kind: String { get }
    /// nil means the row does not exist. `knownRev` nil asks for the document whatever its revision.
    func get(_ id: String, knownRev: Int?) async throws -> GetResult?
    func put(_ id: String, envelope: JSONObject, baseRev: Int, token: String?) async throws -> PutResult
    func delete(_ id: String, token: String?) async throws -> Bool
}

/// Still with no conformer. The channel is `list:<lookupId>` and a broadcast is a doorbell
/// (`{rev, from}`, optionally `gone`), never the document — COMPATIBILITY.md §4.
public protocol RealtimeTransport: Transport {
    func subscribe(_ id: String,
                   onMessage: @escaping @Sendable (JSONObject) -> Void,
                   onState: @escaping @Sendable (String) -> Void) -> any TransportSubscription
}

public protocol TransportSubscription: Sendable {
    func send(_ payload: JSONObject)
    func close()
}

/// A transport that can ring a list's channel after a write of its own succeeded.
///
/// Narrow on purpose. Conforming `SupabaseTransport` to `RealtimeTransport` above would have looked
/// tidier and would have been a lie: nothing on this side intends to implement `subscribe`, and a
/// protocol one of whose two halves throws or returns a stub is worse than a small new one that is
/// true. `ring` is the whole surface, because the writer is the half of realtime the Apple clients
/// are — the Watch, the CLI and the App Intent all push and none of them listens.
///
/// The payload is a doorbell (`{ rev, from }`, optionally `gone`), never the document
/// (COMPATIBILITY.md §4). The caller passes a lookup id; the `list:` prefix is the transport's.
/// `ring` never throws: the write already reached the server, so a bell that did not ring costs
/// somebody else's screen a poll interval and takes nothing away from what was stored.
public protocol DoorbellTransport: Transport {
    func ring(_ id: String, _ payload: JSONObject) async
}
