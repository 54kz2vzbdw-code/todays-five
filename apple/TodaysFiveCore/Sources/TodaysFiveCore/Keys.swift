// Keys.swift — the derivation in crypto.js, frozen by COMPATIBILITY.md §2 and by the vectors in
// test/fixtures/vectors.json. A byte wrong here orphans every list in existence: the server would look
// the row up under a different id and the key would not open it.
//
//   W (edit link, 22 base62)
//     ├─ R          = b62(HKDF(W, "read"), 22)        view link; W → R only, never back
//     │    ├─ lookupId = b62(HKDF(R, "lookup"), 32)   the row id the server sees
//     │    └─ key      = HKDF(R, "key")               AES-256-GCM
//     └─ writeToken = b64url(HKDF(W, "write"))        sent on every write; the server stores its sha256
//
// A view link derives lookupId and key but not the token, so the server can enforce view-only.
import CryptoKit
import Foundation

public enum LinkMode: String, Sendable, Hashable {
    case edit
    case view
}

public struct KeyError: Error, CustomStringConvertible {
    public let message: String
    public var description: String { message }
}

/// Everything a link gives. `token` is nil on the view path — no token exists there.
public struct ListKeys: Sendable {
    public let mode: LinkMode
    public let id: String            // the secret the link carries: W on the edit path, R on the view path
    public let W: String?
    public let R: String
    public let lookupId: String
    public let key: SymmetricKey
    public let token: String?

    public var keyBytes: Data { key.withUnsafeBytes { Data($0) } }
}

public enum Keys {
    static let salt = Data("todays-five/v3".utf8)

    /// HKDF-SHA256(ikm = utf8(ikmString), salt = "todays-five/v3", info) → `bytes` bytes.
    public static func hkdfBits(_ ikm: String, _ info: String, _ bytes: Int) -> Data {
        let key = HKDF<SHA256>.deriveKey(
            inputKeyMaterial: SymmetricKey(data: Data(ikm.utf8)),
            salt: salt,
            info: Data(info.utf8),
            outputByteCount: bytes
        )
        return key.withUnsafeBytes { Data($0) }
    }

    /// `deriveB62`: asks for more bytes than it can need and, if a block ever falls short, continues
    /// deterministically with info + "/2", "/3", …
    public static func deriveB62(_ ikm: String, _ info: String, _ len: Int) throws -> String {
        let want = len <= 22 ? 64 : 96
        for i in 1..<32 {
            let bytes = hkdfBits(ikm, i == 1 ? info : info + "/" + String(i), want)
            if let s = Base62.fromBytes([UInt8](bytes), len) { return s }
        }
        throw KeyError(message: "derivation failed")
    }

    /// Everything an edit link (W) gives: R, lookupId, key, token.
    public static func fromWrite(_ W: String) throws -> ListKeys {
        guard isSecret(W) else { throw KeyError(message: "bad link") }
        let R = try deriveB62(W, "read", 22)
        let view = try fromRead(R)
        let token = base64url(hkdfBits(W, "write", 32))
        return ListKeys(mode: .edit, id: W, W: W, R: R, lookupId: view.lookupId, key: view.key, token: token)
    }

    /// Everything a view link (R) gives: lookupId and key.
    public static func fromRead(_ R: String) throws -> ListKeys {
        guard isSecret(R) else { throw KeyError(message: "bad link") }
        let lookupId = try deriveB62(R, "lookup", 32)
        let key = SymmetricKey(data: hkdfBits(R, "key", 32))
        return ListKeys(mode: .view, id: R, W: nil, R: R, lookupId: lookupId, key: key, token: nil)
    }

    /// Derive for either link kind.
    public static func fromLink(_ mode: LinkMode, _ id: String) throws -> ListKeys {
        mode == .view ? try fromRead(id) : try fromWrite(id)
    }
}

/// `b64url(bytes)`: standard base64 with +/ swapped for -_ and the padding dropped.
public func base64url(_ data: Data) -> String {
    data.base64EncodedString()
        .replacingOccurrences(of: "+", with: "-")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "=", with: "")
}

/// `unb64(s)`: accepts either alphabet and a missing tail of padding, the way atob-after-replace does.
public func base64Decode(_ s: String) -> Data? {
    var t = s.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
    if t.count % 4 != 0 { t += String(repeating: "=", count: 4 - t.count % 4) }
    return Data(base64Encoded: t)
}

public func hexString(_ data: Data) -> String {
    data.map { String(format: "%02x", $0) }.joined()
}
