// JSONValue / JSONObject — a JSON document held the way JavaScript holds one.
//
// The object keeps insertion order and hands back keys the way Object.keys() does: array-index-like
// keys first in ascending numeric order, then the rest in the order they were added. That is invisible
// to canon(), which sorts — but rollover's revival step computes lastOrder() over `items` while it is
// mutating `items`, so two lines revived into the same section take their order from this order.
import Foundation

public enum JSONValue: Sendable, Hashable {
    case null
    case bool(Bool)
    case number(Double)
    case string(JSString)
    case array([JSONValue])
    case object(JSONObject)

    public static func string(_ s: String) -> JSONValue { .string(JSString(s)) }
    public static func number(_ i: Int) -> JSONValue { .number(Double(i)) }

    /// JavaScript truthiness: undefined, null, false, 0, -0, NaN and "" are false; everything else,
    /// an empty array and an empty object included, is true.
    public var isTruthy: Bool {
        switch self {
        case .null: return false
        case .bool(let b): return b
        case .number(let d): return d != 0 && !d.isNaN
        case .string(let s): return !s.isEmpty
        case .array, .object: return true
        }
    }

    /// `typeof v === "number" && isFinite(v)`, which is what model.js's num() asks.
    public var finiteNumber: Double? {
        if case .number(let d) = self, d.isFinite { return d }
        return nil
    }
    public var jsString: JSString? {
        if case .string(let s) = self { return s }
        return nil
    }
    public var arrayValue: [JSONValue]? {
        if case .array(let a) = self { return a }
        return nil
    }
    public var objectValue: JSONObject? {
        if case .object(let o) = self { return o }
        return nil
    }
    public var isObject: Bool { objectValue != nil }
}

public struct JSONObject: Sendable, Hashable {
    private var insertion: [JSString] = []
    private var map: [JSString: JSONValue] = [:]

    public init() {}

    public init(_ pairs: [(String, JSONValue)]) {
        for (k, v) in pairs { self[k] = v }
    }

    /// Object.keys(): canonical array indices ascending, then everything else in insertion order.
    public var keys: [JSString] {
        var indexed: [(UInt32, JSString)] = []
        var rest: [JSString] = []
        for k in insertion {
            if let i = Self.arrayIndex(k) { indexed.append((i, k)) } else { rest.append(k) }
        }
        if indexed.isEmpty { return rest }
        indexed.sort { $0.0 < $1.0 }
        return indexed.map(\.1) + rest
    }

    public var values: [JSONValue] { keys.map { map[$0]! } }
    public var count: Int { insertion.count }
    public var isEmpty: Bool { insertion.isEmpty }

    public func has(_ key: JSString) -> Bool { map[key] != nil }
    public func has(_ key: String) -> Bool { has(JSString(key)) }

    public subscript(key: JSString) -> JSONValue? {
        get { map[key] }
        set {
            if let newValue {
                if map.updateValue(newValue, forKey: key) == nil { insertion.append(key) }
            } else if map.removeValue(forKey: key) != nil {
                insertion.removeAll { $0 == key }
            }
        }
    }
    public subscript(key: String) -> JSONValue? {
        get { self[JSString(key)] }
        set { self[JSString(key)] = newValue }
    }

    /// A canonical array index: "0", "1", … up to 2^32 − 2, with no leading zeros and no sign.
    static func arrayIndex(_ key: JSString) -> UInt32? {
        let u = key.units
        guard !u.isEmpty, u.count <= 10 else { return nil }
        if u.count > 1 && u[0] == 0x30 { return nil }                 // "01" is not an index
        var n: UInt64 = 0
        for c in u {
            guard c >= 0x30, c <= 0x39 else { return nil }
            n = n * 10 + UInt64(c - 0x30)
            if n > 4_294_967_294 { return nil }
        }
        return UInt32(n)
    }

    // ---- typed accessors: the shape model.js expects, without discarding what it does not name ----

    public func str(_ key: String) -> JSString {
        self[key]?.jsString ?? JSString("")
    }
    public func num(_ key: String, _ dflt: Double = 0) -> Double {
        self[key]?.finiteNumber ?? dflt
    }
    public func truthy(_ key: String) -> Bool {
        self[key]?.isTruthy ?? false
    }
    public func obj(_ key: String) -> JSONObject {
        self[key]?.objectValue ?? JSONObject()
    }
    public func arr(_ key: String) -> [JSONValue] {
        self[key]?.arrayValue ?? []
    }
    /// `typeof v === "string"`, distinct from str() which coerces a missing or wrong-typed key to "".
    public func stringOrNil(_ key: String) -> JSString? {
        self[key]?.jsString
    }

    public mutating func set(_ key: String, _ value: JSONValue) { self[key] = value }
    public mutating func set(_ key: String, _ value: String) { self[key] = .string(value) }
    public mutating func set(_ key: String, _ value: JSString) { self[key] = .string(value) }
    public mutating func set(_ key: String, _ value: Double) { self[key] = .number(value) }
    public mutating func set(_ key: String, _ value: Int) { self[key] = .number(Double(value)) }
    public mutating func set(_ key: String, _ value: Bool) { self[key] = .bool(value) }
    public mutating func remove(_ key: String) { self[key] = nil }

    /// `passThrough(out, src, known)`: copy the keys `known` does not list from `src` onto `self`,
    /// never overwriting one that is already there. A future version's fields must survive this one.
    public mutating func passThrough(from src: JSONObject, known: Set<JSString>) {
        for k in src.keys where !known.contains(k) && !has(k) {
            self[k] = src[k]
        }
    }
}

extension JSONObject: CustomStringConvertible {
    public var description: String { JSONWriter.stringify(.object(self)) }
}
