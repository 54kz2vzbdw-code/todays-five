// JSText — the string operations model.js uses whose definitions are JavaScript's, not Swift's:
// String.prototype.trim (which trims a specific set, not Unicode's "whitespace" property) and the
// \s character class (which includes U+00A0, U+FEFF and the Zs separators but not U+0085).
import Foundation

public enum JSText {
    /// The ECMAScript WhiteSpace ∪ LineTerminator set: what trim() removes and what \s matches.
    public static func isSpace(_ c: UInt16) -> Bool {
        switch c {
        case 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x20, 0xA0, 0x1680, 0x2028, 0x2029, 0x202F, 0x205F, 0x3000, 0xFEFF:
            return true
        case 0x2000...0x200A:
            return true
        default:
            return false
        }
    }

    /// `s.trim()`.
    public static func trim(_ s: JSString) -> JSString {
        var lo = 0, hi = s.units.count
        while lo < hi, isSpace(s.units[lo]) { lo += 1 }
        while hi > lo, isSpace(s.units[hi - 1]) { hi -= 1 }
        return JSString(units: Array(s.units[lo..<hi]))
    }

    /// `s.replace(/\s+/g, " ")`.
    public static func collapseSpaces(_ s: JSString) -> JSString {
        var out: [UInt16] = []
        var inRun = false
        for c in s.units {
            if isSpace(c) {
                if !inRun { out.append(0x20); inRun = true }
            } else {
                out.append(c)
                inRun = false
            }
        }
        return JSString(units: out)
    }

    /// `s.split(/\r?\n/)`.
    public static func splitLines(_ s: JSString) -> [JSString] {
        var out: [JSString] = []
        var cur: [UInt16] = []
        var i = 0
        let u = s.units
        while i < u.count {
            if u[i] == 0x0A {
                out.append(JSString(units: cur)); cur = []; i += 1
            } else if u[i] == 0x0D, i + 1 < u.count, u[i + 1] == 0x0A {
                out.append(JSString(units: cur)); cur = []; i += 2
            } else {
                cur.append(u[i]); i += 1
            }
        }
        out.append(JSString(units: cur))
        return out
    }
}
