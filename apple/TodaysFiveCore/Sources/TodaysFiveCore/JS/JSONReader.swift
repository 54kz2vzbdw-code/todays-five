// JSONReader — JSON.parse. Foundation's JSONSerialization cannot do this job: it loses object key
// order (which rollover's revival step depends on) and it cannot represent a lone surrogate written
// as \ud83d, which is exactly what an emoji truncated at a 200-code-unit boundary leaves behind.
// So the reader is written out: RFC 8259 grammar, keys in the order they appear, strings as UTF-16.
import Foundation

public struct JSONError: Error, CustomStringConvertible {
    public let message: String
    public let offset: Int
    public var description: String { "\(message) at \(offset)" }
}

public enum JSONReader {
    public static func parse(_ text: String) throws -> JSONValue {
        var p = Parser(units: Array(text.utf16))
        let v = try p.parseValue()
        p.skipWhitespace()
        guard p.i == p.units.count else { throw p.error("unexpected trailing content") }
        return v
    }

    public static func parse(_ data: Data) throws -> JSONValue {
        try parse(String(decoding: data, as: UTF8.self))
    }

    /// JSON.parse that never throws, the shape `normalize(JSON.parse(x))` wants when the input is junk.
    public static func parseOrNull(_ text: String) -> JSONValue {
        (try? parse(text)) ?? .null
    }

    private struct Parser {
        let units: [UInt16]
        var i = 0

        func error(_ m: String) -> JSONError { JSONError(message: m, offset: i) }

        mutating func skipWhitespace() {
            while i < units.count {
                let c = units[i]
                if c == 0x20 || c == 0x09 || c == 0x0A || c == 0x0D { i += 1 } else { break }
            }
        }

        mutating func parseValue() throws -> JSONValue {
            skipWhitespace()
            guard i < units.count else { throw error("unexpected end") }
            switch units[i] {
            case 0x7B: return .object(try parseObject())
            case 0x5B: return .array(try parseArray())
            case 0x22: return .string(try parseString())
            case 0x74: try expect("true"); return .bool(true)
            case 0x66: try expect("false"); return .bool(false)
            case 0x6E: try expect("null"); return .null
            default: return .number(try parseNumber())
            }
        }

        mutating func expect(_ word: String) throws {
            for u in word.utf16 {
                guard i < units.count, units[i] == u else { throw error("expected \(word)") }
                i += 1
            }
        }

        mutating func parseObject() throws -> JSONObject {
            i += 1                                        // {
            var out = JSONObject()
            skipWhitespace()
            if i < units.count, units[i] == 0x7D { i += 1; return out }
            while true {
                skipWhitespace()
                guard i < units.count, units[i] == 0x22 else { throw error("expected a key") }
                let key = try parseString()
                skipWhitespace()
                guard i < units.count, units[i] == 0x3A else { throw error("expected :") }
                i += 1
                out[key] = try parseValue()               // a repeated key keeps its first position
                skipWhitespace()
                guard i < units.count else { throw error("unexpected end in object") }
                if units[i] == 0x2C { i += 1; continue }
                if units[i] == 0x7D { i += 1; return out }
                throw error("expected , or }")
            }
        }

        mutating func parseArray() throws -> [JSONValue] {
            i += 1                                        // [
            var out: [JSONValue] = []
            skipWhitespace()
            if i < units.count, units[i] == 0x5D { i += 1; return out }
            while true {
                out.append(try parseValue())
                skipWhitespace()
                guard i < units.count else { throw error("unexpected end in array") }
                if units[i] == 0x2C { i += 1; continue }
                if units[i] == 0x5D { i += 1; return out }
                throw error("expected , or ]")
            }
        }

        mutating func parseString() throws -> JSString {
            i += 1                                        // "
            var out: [UInt16] = []
            while true {
                guard i < units.count else { throw error("unterminated string") }
                let c = units[i]
                if c == 0x22 { i += 1; return JSString(units: out) }
                if c == 0x5C {
                    i += 1
                    guard i < units.count else { throw error("unterminated escape") }
                    switch units[i] {
                    case 0x22: out.append(0x22)
                    case 0x5C: out.append(0x5C)
                    case 0x2F: out.append(0x2F)
                    case 0x62: out.append(0x08)
                    case 0x66: out.append(0x0C)
                    case 0x6E: out.append(0x0A)
                    case 0x72: out.append(0x0D)
                    case 0x74: out.append(0x09)
                    case 0x75:
                        guard i + 4 < units.count else { throw error("short \\u escape") }
                        var v: UInt16 = 0
                        for k in 1...4 {
                            guard let d = hexDigit(units[i + k]) else { throw error("bad \\u escape") }
                            v = v << 4 | UInt16(d)
                        }
                        i += 4
                        out.append(v)                     // a lone surrogate is kept as it is written
                    default: throw error("bad escape")
                    }
                    i += 1
                    continue
                }
                out.append(c)
                i += 1
            }
        }

        func hexDigit(_ c: UInt16) -> UInt8? {
            switch c {
            case 0x30...0x39: return UInt8(c - 0x30)
            case 0x61...0x66: return UInt8(c - 0x61 + 10)
            case 0x41...0x46: return UInt8(c - 0x41 + 10)
            default: return nil
            }
        }

        mutating func parseNumber() throws -> Double {
            let start = i
            if i < units.count, units[i] == 0x2D { i += 1 }
            while i < units.count, units[i] >= 0x30, units[i] <= 0x39 { i += 1 }
            if i < units.count, units[i] == 0x2E {
                i += 1
                while i < units.count, units[i] >= 0x30, units[i] <= 0x39 { i += 1 }
            }
            if i < units.count, units[i] == 0x65 || units[i] == 0x45 {
                i += 1
                if i < units.count, units[i] == 0x2B || units[i] == 0x2D { i += 1 }
                while i < units.count, units[i] >= 0x30, units[i] <= 0x39 { i += 1 }
            }
            guard i > start, let d = Double(String(decoding: units[start..<i], as: UTF16.self)) else {
                throw error("bad number")
            }
            return d
        }
    }
}
