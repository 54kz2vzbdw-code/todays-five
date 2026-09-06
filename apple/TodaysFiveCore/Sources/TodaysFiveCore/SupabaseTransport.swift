// SupabaseTransport.swift — the three RPCs over URLSession, with the publishable key from config.js.
// COMPATIBILITY.md §4: the signatures and the semantics are frozen; a new behaviour is a new function.
//
// The read RPC's second parameter is `p_rev` (supabase/migrations/002_v3.sql), not `p_known_rev`;
// PostgREST resolves overloads by the JSON keys of the call, so the name is part of the contract.
import Foundation

public struct SupabaseTransport: Transport {
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

    /// The bytes an unchanged poll costs, for the interop record. Returns the raw response text too.
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
