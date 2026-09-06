// Envelope.swift — the v3 envelope, exactly as crypto.js writes it. Frozen: COMPATIBILITY.md §2.
//
//   { v: 3, alg: "A256GCM", z?: "deflate-raw", iv, ct }   keys in that order, iv and ct standard base64
//
// The additional authenticated data is utf8("v3:A256GCM:" + (z || "json")), so dropping or forging the
// compression flag fails authentication rather than producing rubbish. `ct` is ciphertext ‖ tag,
// because that is what WebCrypto's encrypt returns; CryptoKit keeps the two apart.
import CryptoKit
import Foundation

public struct EnvelopeError: Error, CustomStringConvertible {
    public let message: String
    public var description: String { message }
}

public struct Envelope: Sendable, Hashable {
    public static let version = 3
    public static let alg = "A256GCM"

    public var v: Int
    public var algorithm: String
    public var z: String?
    public var iv: String
    public var ct: String

    public init(v: Int = Envelope.version, algorithm: String = Envelope.alg, z: String?, iv: String, ct: String) {
        self.v = v
        self.algorithm = algorithm
        self.z = z
        self.iv = iv
        self.ct = ct
    }

    /// The envelope as JSON, keys in the order crypto.js writes them: v, alg, z?, iv, ct.
    public var json: JSONObject {
        var o = JSONObject()
        o.set("v", v)
        o.set("alg", algorithm)
        if let z { o.set("z", z) }
        o.set("iv", iv)
        o.set("ct", ct)
        return o
    }

    /// `isEnvelope(x)`: v is 3, alg is A256GCM, iv and ct are strings. Nothing else is looked at.
    public init?(json o: JSONObject) {
        guard o.num("v", -1) == Double(Envelope.version),
              let alg = o.stringOrNil("alg"), alg == Envelope.alg,
              let iv = o.stringOrNil("iv"), let ct = o.stringOrNil("ct") else { return nil }
        self.v = Envelope.version
        self.algorithm = Envelope.alg
        self.z = o.stringOrNil("z")?.string
        self.iv = iv.string
        self.ct = ct.string
    }

    public static func isEnvelope(_ v: JSONValue) -> Bool {
        guard let o = v.objectValue else { return false }
        return Envelope(json: o) != nil
    }

    /// `envelopeBytes(env)`: what the server measures.
    public var byteCount: Int { JSONWriter.stringify(.object(json)).utf8.count }
}

public enum Crypto {
    static func aad(_ z: String?) -> Data { Data(("v3:" + Envelope.alg + ":" + (z ?? "json")).utf8) }

    /// `seal(key, doc)`: deflate, then AES-256-GCM with a fresh iv.
    public static func seal(key: SymmetricKey, document: JSONObject, compress: Bool = true) throws -> Envelope {
        try seal(key: key, plaintext: Data(JSONWriter.stringify(.object(document)).utf8), compress: compress)
    }

    /// The same with the iv supplied, which is how the fixtures pin an exact ciphertext.
    public static func seal(key: SymmetricKey, plaintext: Data, compress: Bool = true, iv: Data? = nil) throws -> Envelope {
        var data = plaintext
        var z: String? = nil
        if compress {
            data = try Deflate.compress(data)
            z = "deflate-raw"
        }
        let nonceBytes = iv ?? Data((0..<12).map { _ in UInt8.random(in: 0...255) })
        guard nonceBytes.count == 12 else { throw EnvelopeError(message: "iv must be 12 bytes") }
        let box = try AES.GCM.seal(data, using: key, nonce: try AES.GCM.Nonce(data: nonceBytes), authenticating: aad(z))
        return Envelope(z: z, iv: nonceBytes.base64EncodedString(), ct: (box.ciphertext + box.tag).base64EncodedString())
    }

    /// `open(key, env)`: throws on anything that is not ours or has been tampered with.
    public static func open(key: SymmetricKey, envelope: Envelope) throws -> Data {
        let z = envelope.z
        if let z, z != "deflate-raw" { throw EnvelopeError(message: "unknown compression " + z) }
        guard let ivData = base64Decode(envelope.iv), ivData.count == 12 else {
            throw EnvelopeError(message: "bad iv")
        }
        guard let ctData = base64Decode(envelope.ct), ctData.count >= 16 else {
            throw EnvelopeError(message: "bad ct")
        }
        let tag = ctData.suffix(16)
        let body = ctData.prefix(ctData.count - 16)
        let box = try AES.GCM.SealedBox(nonce: try AES.GCM.Nonce(data: ivData), ciphertext: body, tag: tag)
        var data = try AES.GCM.open(box, using: key, authenticating: aad(z))
        if z != nil { data = try Deflate.decompress(data) }
        return data
    }

    /// The document an envelope carries.
    public static func openDocument(key: SymmetricKey, envelope: Envelope) throws -> JSONObject {
        let data = try open(key: key, envelope: envelope)
        guard let o = try JSONReader.parse(data).objectValue else {
            throw EnvelopeError(message: "the envelope did not hold an object")
        }
        return o
    }
}
