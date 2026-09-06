// JSString — a string the way JavaScript holds one: a sequence of UTF-16 code units, lone surrogates
// and all. Swift's String cannot hold an unpaired surrogate, and model.js truncates with
// String.prototype.slice, which counts code units — so a note cut at 300 can end in half an emoji and
// JavaScript keeps that half (JSON.stringify writes it as \ud83d). Comparison and sorting are by code
// unit too, which is not what Swift's String does: Swift orders by Unicode canonical equivalence.
//
// canon() measures length in code units and compares canonical strings with >=, and merge()'s
// tie-break turns on both. So everything that will be compared, sorted, measured or escaped goes
// through this type; Swift String is for accessors and for showing a person.
import Foundation

public struct JSString: Sendable, Hashable {
    public private(set) var units: [UInt16]

    public init(units: [UInt16]) { self.units = units }
    public init(_ s: String) { self.units = Array(s.utf16) }

    /// Code units, which is what `String.prototype.length` counts.
    public var count: Int { units.count }
    public var isEmpty: Bool { units.isEmpty }

    /// Lossy only for an unpaired surrogate, which becomes U+FFFD — the one place Swift cannot follow.
    public var string: String { String(decoding: units, as: UTF16.self) }

    /// True when every surrogate is paired, i.e. `string` round-trips.
    public var isWellFormed: Bool {
        var i = 0
        while i < units.count {
            let u = units[i]
            if u >= 0xD800 && u <= 0xDBFF {
                guard i + 1 < units.count, units[i + 1] >= 0xDC00, units[i + 1] <= 0xDFFF else { return false }
                i += 2
            } else if u >= 0xDC00 && u <= 0xDFFF {
                return false
            } else {
                i += 1
            }
        }
        return true
    }

    /// `s.slice(0, max)`: the first `max` code units, splitting a surrogate pair if that is where it lands.
    public func prefix(_ max: Int) -> JSString {
        guard max < units.count else { return self }
        return JSString(units: Array(units[0..<Swift.max(0, max)]))
    }

    /// JavaScript's `<`: lexicographic over UTF-16 code units.
    public static func < (a: JSString, b: JSString) -> Bool {
        let n = Swift.min(a.units.count, b.units.count)
        var i = 0
        while i < n {
            if a.units[i] != b.units[i] { return a.units[i] < b.units[i] }
            i += 1
        }
        return a.units.count < b.units.count
    }
    public static func <= (a: JSString, b: JSString) -> Bool { !(b < a) }
    public static func > (a: JSString, b: JSString) -> Bool { b < a }
    public static func >= (a: JSString, b: JSString) -> Bool { !(a < b) }

    public func hasPrefix(_ other: JSString) -> Bool {
        guard other.units.count <= units.count else { return false }
        return Array(units[0..<other.units.count]) == other.units
    }

    public mutating func append(_ other: JSString) { units.append(contentsOf: other.units) }
    public func appending(_ other: JSString) -> JSString { JSString(units: units + other.units) }

    /// The whole string lowercased the way `String.prototype.toLowerCase()` does for the characters
    /// a list name can hold; used only for ordering templates by name.
    public var lowercased: JSString { JSString(string.lowercased()) }
}

extension JSString: ExpressibleByStringLiteral {
    public init(stringLiteral value: String) { self.init(value) }
}

extension JSString: CustomStringConvertible {
    public var description: String { string }
}

public extension String {
    var js: JSString { JSString(self) }
}

public func == (a: JSString, b: String) -> Bool { a.units == Array(b.utf16) }
public func == (a: String, b: JSString) -> Bool { Array(a.utf16) == b.units }
public func != (a: JSString, b: String) -> Bool { !(a == b) }
public func != (a: String, b: JSString) -> Bool { !(a == b) }
