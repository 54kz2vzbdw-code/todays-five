// Base62 — the alphabet and the rejection sampling in crypto.js. 248 is 4 × 62, so a byte under it
// maps to a symbol with no bias and a byte at or above it is thrown away. Frozen: COMPATIBILITY.md §2.
import Foundation

public enum Base62 {
    public static let alphabet = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")

    /// `b62FromBytes(bytes, len)`: nil when the bytes run out before `len` symbols are made.
    public static func fromBytes(_ bytes: [UInt8], _ len: Int) -> String? {
        var out = ""
        out.reserveCapacity(len)
        for b in bytes {
            if out.count >= len { break }
            if b < 248 { out.append(alphabet[Int(b) % 62]) }
        }
        return out.count == len ? out : nil
    }

    /// `newId(len)`: an unbiased base62 string from the system's random source.
    public static func randomId(_ len: Int = 22) -> String {
        var out = ""
        out.reserveCapacity(len)
        while out.count < len {
            var bytes = [UInt8](repeating: 0, count: len * 2)
            for i in bytes.indices { bytes[i] = UInt8.random(in: 0...255) }
            for b in bytes {
                if out.count >= len { break }
                if b < 248 { out.append(alphabet[Int(b) % 62]) }
            }
        }
        return out
    }
}

/// `isSecret` / `isListId`: 22–64 base62 characters and nothing else.
public func isSecret(_ s: String) -> Bool {
    let u = Array(s.utf16)
    guard u.count >= 22, u.count <= 64 else { return false }
    for c in u {
        let ok = (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)
        if !ok { return false }
    }
    return true
}
