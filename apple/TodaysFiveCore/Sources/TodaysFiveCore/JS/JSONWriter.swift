// JSONWriter — JSON.stringify, and canon(): the same with keys sorted, which is what model.js
// compares in the merge tie-break. Strings are escaped the way JSON.stringify escapes them, lone
// surrogates included (\ud83d, lowercase hex — ES2019's well-formed JSON.stringify), and numbers by
// ECMAScript's Number::toString.
import Foundation

public enum JSONWriter {
    /// JSON.stringify(v): keys in Object.keys order.
    public static func stringify(_ v: JSONValue) -> String {
        var out = ""
        write(v, into: &out, sortKeys: false)
        return out
    }

    /// model.js's canon(v): keys sorted by UTF-16 code unit, so equal records stringify equally
    /// regardless of insertion order.
    public static func canon(_ v: JSONValue) -> JSString {
        var out = ""
        write(v, into: &out, sortKeys: true)
        return JSString(out)
    }

    public static func canon(_ o: JSONObject) -> JSString { canon(.object(o)) }

    /// JSON.stringify(v, null, 2) over canonical (sorted) key order, which is what exportJSON writes.
    public static func canonPretty(_ v: JSONValue) -> String {
        var out = ""
        writePretty(v, into: &out, depth: 0, sortKeys: true)
        return out
    }

    /// JSON.stringify(v, null, 2) keeping Object.keys order, for anything meant to be read by a person
    /// or handed back to the web with its key order intact.
    public static func pretty(_ v: JSONValue) -> String {
        var out = ""
        writePretty(v, into: &out, depth: 0, sortKeys: false)
        return out
    }

    private static func write(_ v: JSONValue, into out: inout String, sortKeys: Bool) {
        switch v {
        case .null:
            out += "null"
        case .bool(let b):
            out += b ? "true" : "false"
        case .number(let d):
            out += d.isFinite ? JSNumber.toString(d) : "null"   // JSON.stringify(Infinity) === "null"
        case .string(let s):
            writeString(s, into: &out)
        case .array(let a):
            out += "["
            for (i, e) in a.enumerated() {
                if i > 0 { out += "," }
                write(e, into: &out, sortKeys: sortKeys)
            }
            out += "]"
        case .object(let o):
            out += "{"
            let ks = sortKeys ? o.keys.sorted(by: <) : o.keys
            for (i, k) in ks.enumerated() {
                if i > 0 { out += "," }
                writeString(k, into: &out)
                out += ":"
                write(o[k]!, into: &out, sortKeys: sortKeys)
            }
            out += "}"
        }
    }

    private static func writePretty(_ v: JSONValue, into out: inout String, depth: Int, sortKeys: Bool) {
        switch v {
        case .array(let a):
            if a.isEmpty { out += "[]"; return }
            let pad = String(repeating: " ", count: (depth + 1) * 2)
            out += "[\n"
            for (i, e) in a.enumerated() {
                if i > 0 { out += ",\n" }
                out += pad
                writePretty(e, into: &out, depth: depth + 1, sortKeys: sortKeys)
            }
            out += "\n" + String(repeating: " ", count: depth * 2) + "]"
        case .object(let o):
            if o.isEmpty { out += "{}"; return }
            let pad = String(repeating: " ", count: (depth + 1) * 2)
            out += "{\n"
            for (i, k) in (sortKeys ? o.keys.sorted(by: <) : o.keys).enumerated() {
                if i > 0 { out += ",\n" }
                out += pad
                writeString(k, into: &out)
                out += ": "
                writePretty(o[k]!, into: &out, depth: depth + 1, sortKeys: sortKeys)
            }
            out += "\n" + String(repeating: " ", count: depth * 2) + "}"
        default:
            write(v, into: &out, sortKeys: sortKeys)
        }
    }

    private static let hex: [Character] = Array("0123456789abcdef")

    /// QuoteJSONString: ", \\ and the C0 controls, plus any unpaired surrogate as \udxxx.
    static func writeString(_ s: JSString, into out: inout String) {
        out += "\""
        let u = s.units
        var i = 0
        while i < u.count {
            let c = u[i]
            switch c {
            case 0x22: out += "\\\""
            case 0x5C: out += "\\\\"
            case 0x08: out += "\\b"
            case 0x0C: out += "\\f"
            case 0x0A: out += "\\n"
            case 0x0D: out += "\\r"
            case 0x09: out += "\\t"
            default:
                if c < 0x20 {
                    out += unicodeEscape(c)
                } else if c >= 0xD800 && c <= 0xDBFF {
                    if i + 1 < u.count, u[i + 1] >= 0xDC00, u[i + 1] <= 0xDFFF {
                        let scalar = 0x10000 + (UInt32(c - 0xD800) << 10) + UInt32(u[i + 1] - 0xDC00)
                        out.unicodeScalars.append(UnicodeScalar(scalar)!)
                        i += 1
                    } else {
                        out += unicodeEscape(c)          // an unpaired lead surrogate
                    }
                } else if c >= 0xDC00 && c <= 0xDFFF {
                    out += unicodeEscape(c)              // an unpaired trail surrogate
                } else {
                    out.unicodeScalars.append(UnicodeScalar(c)!)
                }
            }
            i += 1
        }
        out += "\""
    }

    private static func unicodeEscape(_ c: UInt16) -> String {
        var s = "\\u"
        s.append(hex[Int((c >> 12) & 0xF)])
        s.append(hex[Int((c >> 8) & 0xF)])
        s.append(hex[Int((c >> 4) & 0xF)])
        s.append(hex[Int(c & 0xF)])
        return s
    }
}
