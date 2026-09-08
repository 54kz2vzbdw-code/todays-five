// SupabaseTransport.swift — the three RPCs over URLSession, with the publishable key from config.js.
// COMPATIBILITY.md §4: the signatures and the semantics are frozen; a new behaviour is a new function.
//
// The read RPC's second parameter is `p_rev` (supabase/migrations/002_v3.sql), not `p_known_rev`;
// PostgREST resolves overloads by the JSON keys of the call, so the name is part of the contract.
import Foundation

public struct SupabaseTransport: Transport, DoorbellTransport {
    public let kind = "supabase"
    private let base: String
    private let key: String
    private let session: URLSession

    public init(config: SupabaseConfig = .fromRepo, session: URLSession = .shared) throws {
        guard config.isConfigured else {
            throw SyncError("Sync off — finish setup", kind: .badRequest)
        }
        var url = config.url
        while url.hasSuffix("/") { url.removeLast() }
        self.base = url
        self.key = config.key
        self.session = session
    }

    /// One RPC. Returns the parsed answer, or nil when the function answered `null`.
    @discardableResult
    func rpc(_ function: String, _ args: JSONObject) async throws -> JSONValue? {
        guard let url = URL(string: base + "/rest/v1/rpc/" + function) else {
            throw SyncError("bad project URL", kind: .badRequest)
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(key, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data(JSONWriter.stringify(.object(args)).utf8)

        let data: Data, response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw SyncError("network", kind: .network)
        }
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        let parsed = try? JSONReader.parse(data)

        guard (200..<300).contains(status) else {
            let o = parsed?.objectValue
            let message = o?.stringOrNil("message")?.string ?? o?.stringOrNil("error")?.string ?? "HTTP \(status)"
            throw SyncError(message, status: status, code: o?.stringOrNil("code")?.string ?? "")
        }
        if parsed == nil || parsed == .null { return nil }
        return parsed
    }

    public func get(_ id: String, knownRev: Int?) async throws -> GetResult? {
        var args = JSONObject()
        args.set("p_id", id)
        args["p_rev"] = knownRev.map { .number(Double($0)) } ?? .null
        guard let answer = try await rpc("get_list_v3", args), let o = answer.objectValue else { return nil }
        if o.truthy("unchanged") {
            return GetResult(unchanged: true, rev: Int(o.num("rev")), document: nil)
        }
        return GetResult(unchanged: false, rev: Int(o.num("rev")), document: o["doc"]?.objectValue)
    }

    public func put(_ id: String, envelope: JSONObject, baseRev: Int, token: String?) async throws -> PutResult {
        var args = JSONObject()
        args.set("p_id", id)
        args["p_doc"] = .object(envelope)
        args.set("p_base_rev", Double(baseRev))
        args["p_token"] = token.map { .string($0) } ?? .null
        guard let answer = try await rpc("put_list_v3", args), let o = answer.objectValue else {
            throw SyncError("put_list_v3 answered nothing", kind: .decode)
        }
        return PutResult(ok: o.truthy("ok"), rev: Int(o.num("rev")), document: o["doc"]?.objectValue)
    }

    public func delete(_ id: String, token: String?) async throws -> Bool {
        var args = JSONObject()
        args.set("p_id", id)
        args["p_token"] = token.map { .string($0) } ?? .null
        let answer = try await rpc("delete_list_v3", args)
        return answer?.isTruthy ?? false
    }

    // ---------------------------------------------------------------- the doorbell

    /// The request body `sync.js:121` builds, key for key and in its order — the whole cost of a
    /// doorbell, and separate from `ring` so a test can weigh it without a network.
    static func doorbellBody(_ id: String, _ payload: JSONObject) -> String {
        var message = JSONObject()
        message.set("topic", "list:" + id)
        message.set("event", "change")
        message["payload"] = .object(payload)
        message.set("private", false)
        var body = JSONObject()
        body["messages"] = .array([.object(message)])
        return JSONWriter.stringify(.object(body))
    }

    /// Ring `list:<id>` so a device watching this list pulls now instead of at its next poll.
    ///
    /// This is `sync.js:121`'s REST fallback, header for header: `{ apikey, Content-Type }` and
    /// **no `Authorization: Bearer`**, which the endpoint accepts (measured: HTTP 202, with the
    /// bearer header and without it). REST rather than a socket because there is nothing to keep
    /// open — this side never listens, and a `tfive add` or an App Intent is a process that writes
    /// once and goes away. The body is 138 bytes (measured, and pinned in the suite), one of them per
    /// successful write and not one byte at idle.
    ///
    /// Unlike `sync.js`, the status code is logged in a debug build. The web's version ends in
    /// `.catch(() => {})` and had therefore never been exercised in its life: nobody could have told
    /// you whether that request had ever been answered, because nothing anywhere wrote the answer
    /// down. One `print` is the whole cost of not being in that position again.
    public func ring(_ id: String, _ payload: JSONObject) async {
        guard let url = URL(string: base + "/realtime/v1/api/broadcast") else { return }
        let body = Self.doorbellBody(id, payload)

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(key, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data(body.utf8)
        do {
            let (_, response) = try await session.data(for: request)
            #if DEBUG
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            // the id is a channel name derived from a link and never goes in a log — the bytes and
            // the status are the whole diagnosis
            print("[doorbell] \(status), \(request.httpBody?.count ?? 0) bytes")
            #else
            _ = response
            #endif
        } catch {
            #if DEBUG
            // the URLError code and nothing else: an error object printed whole carries its failing
            // URL, and no address of ours belongs in a log even when it names no list
            print("[doorbell] not sent, URLError \((error as? URLError)?.code.rawValue ?? 0)")
            #endif
        }
    }

    /// The bytes an unchanged poll costs, for the interop record. Returns the raw response text too.
    ///
    /// Nothing above touches this: a doorbell is a POST to `/realtime/v1/api/broadcast`, a poll is a
    /// POST to `/rest/v1/rpc/get_list_v3` with `p_rev`, and the 29 bytes an unchanged poll answers
    /// are the migration's `jsonb_build_object`, which this round does not go near.
    public func rawGet(_ id: String, knownRev: Int?) async throws -> (status: Int, text: String, bytes: Int) {
        guard let url = URL(string: base + "/rest/v1/rpc/get_list_v3") else {
            throw SyncError("bad project URL", kind: .badRequest)
        }
        var args = JSONObject()
        args.set("p_id", id)
        args["p_rev"] = knownRev.map { .number(Double($0)) } ?? .null
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(key, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data(JSONWriter.stringify(.object(args)).utf8)
        let (data, response) = try await session.data(for: request)
        return ((response as? HTTPURLResponse)?.statusCode ?? 0,
                String(decoding: data, as: UTF8.self),
                data.count)
    }
}
