// Links.swift — `#/l/<W>` and `#/r/<R>`, and whatever a later version appends after the id.
// COMPATIBILITY.md §1: the id is matched as a *prefix*, so a suffix this version has never heard of
// leaves the id readable. That is why this ports model.js's grammar rather than a list of suffixes —
// `/tv`, when it means something, will parse here exactly as it parses on the web today.
//
//   ^#\/(l|r)\/([0-9A-Za-z]{22,64})(?:\/([A-Za-z]*)(?:\?([^#]*))?)?
import Foundation

public struct AddFromLink: Sendable, Equatable {
    public var text: [String]
    public var section: String
}

public struct ParsedHash: Sendable, Equatable {
    public var id: String
    public var mode: LinkMode
    public var add: AddFromLink?
    public var hint: String?          // "mine" or "shared", only on an edit link
}

public enum Links {
    public static let textMax = 200
    public static let sectionMax = 60

    /// `parseHash(hash)`. nil when the string is not a list link.
    public static func parseHash(_ hash: String) -> ParsedHash? {
        let u = Array(hash.utf16)
        guard u.count >= 4, u[0] == 0x23, u[1] == 0x2F else { return nil }   // "#/"
        let kind = u[2]
        guard kind == 0x6C || kind == 0x72, u[3] == 0x2F else { return nil } // "l/" or "r/"

        var i = 4
        while i < u.count, isBase62(u[i]) { i += 1 }
        let runLength = i - 4
        // {22,64} is greedy, and the group that follows can always match empty, so there is never a
        // reason to backtrack: the id is the run, capped at 64.
        guard runLength >= 22 else { return nil }
        let idEnd = 4 + min(runLength, 64)
        let id = String(decoding: u[4..<idEnd], as: UTF16.self)

        var out = ParsedHash(id: id, mode: kind == 0x72 ? .view : .edit, add: nil, hint: nil)

        var j = idEnd
        var suffix = ""
        var query: String? = nil
        if j < u.count, u[j] == 0x2F {                                       // "/"
            j += 1
            var k = j
            while k < u.count, isAlpha(u[k]) { k += 1 }
            suffix = String(decoding: u[j..<k], as: UTF16.self)
            j = k
            if j < u.count, u[j] == 0x3F {                                   // "?"
                j += 1
                var q = j
                while q < u.count, u[q] != 0x23 { q += 1 }                   // [^#]*
                query = String(decoding: u[j..<q], as: UTF16.self)
            }
        }

        if suffix == "add" {
            let params = QueryString(query ?? "")
            let raw = JSString(params.get("text") ?? "")
            let lines = JSText.splitLines(raw)
                .map { JSText.collapseSpaces(JSText.trim($0)) }
                .filter { !$0.isEmpty }
                .map { $0.prefix(textMax).string }
            let section = JSText.trim(JSString(params.get("section") ?? "")).prefix(sectionMax).string
            out.add = AddFromLink(text: lines, section: section)
        } else if (suffix == "mine" || suffix == "shared") && out.mode == .edit {
            out.hint = suffix
        }
        return out
    }

    /// `hashHasExtras(hash)`: true when the hash carries anything after the id that the address bar
    /// should lose once handled. `^#\/(l|r)\/[0-9A-Za-z]{22,64}\/.` — and here the {22,64} really can
    /// backtrack, but every character of the run is base62, so only the whole run can be followed by
    /// a "/": a run longer than 64 has no match at all.
    public static func hashHasExtras(_ hash: String) -> Bool {
        let u = Array(hash.utf16)
        guard u.count >= 4, u[0] == 0x23, u[1] == 0x2F,
              u[2] == 0x6C || u[2] == 0x72, u[3] == 0x2F else { return false }
        var i = 4
        while i < u.count, isBase62(u[i]) { i += 1 }
        let run = i - 4
        guard run >= 22, run <= 64 else { return false }
        return i + 1 < u.count && u[i] == 0x2F
    }

    /// `hintLink(link, hint)`: a private link with an origin hint on the end.
    public static func hintLink(_ link: String, _ hint: String?) -> String {
        (hint == "mine" || hint == "shared") ? link + "/" + hint! : link
    }

    /// `addUrl(base, W)`: the personalised add URL for an edit link, text left for the caller.
    public static func addUrl(_ base: String, _ W: String) -> String { base + "#/l/" + W + "/add?text=" }

    /// The fragment for a ref, the way app.js writes it back into the address bar.
    public static func fragment(id: String, mode: LinkMode) -> String {
        "#/" + (mode == .view ? "r" : "l") + "/" + id
    }

    /// `parseLink(s)` from app.js's paste box: a link *anywhere* in the string, or a bare id.
    public static func parseLink(_ s: String) -> (id: String, mode: LinkMode, origin: String?)? {
        let t = JSText.trim(JSString(s))
        let u = t.units
        var i = 0
        while i + 3 < u.count {
            if u[i] == 0x23, u[i + 1] == 0x2F, u[i + 2] == 0x6C || u[i + 2] == 0x72, u[i + 3] == 0x2F {
                var j = i + 4
                while j < u.count, isBase62(u[j]) { j += 1 }
                let run = j - (i + 4)
                if run >= 22 {
                    let end = i + 4 + min(run, 64)
                    let id = String(decoding: u[(i + 4)..<end], as: UTF16.self)
                    let mode: LinkMode = u[i + 2] == 0x72 ? .view : .edit
                    var origin: String? = nil
                    if end < u.count, u[end] == 0x2F {
                        let rest = String(decoding: u[(end + 1)...], as: UTF16.self)
                        if rest.hasPrefix("mine") { origin = "mine" }
                        else if rest.hasPrefix("shared") { origin = "shared" }
                    }
                    return (id, mode, mode == .edit ? origin : nil)
                }
            }
            i += 1
        }
        let bare = t.string
        return isSecret(bare) ? (bare, .edit, nil) : nil
    }

    static func isBase62(_ c: UInt16) -> Bool {
        (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)
    }
    static func isAlpha(_ c: UInt16) -> Bool {
        (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)
    }
}

/// URLSearchParams, as much of it as parseHash uses: `+` is a space, `%XX` is a byte, and bytes that
/// are not UTF-8 become U+FFFD.
struct QueryString {
    private var pairs: [(String, String)] = []

    init(_ query: String) {
        for part in query.split(separator: "&", omittingEmptySubsequences: true) {
            let piece = String(part)
            if let eq = piece.firstIndex(of: "=") {
                pairs.append((Self.decode(String(piece[piece.startIndex..<eq])),
                              Self.decode(String(piece[piece.index(after: eq)...]))))
            } else {
                pairs.append((Self.decode(piece), ""))
            }
        }
    }

    func get(_ name: String) -> String? { pairs.first { $0.0 == name }?.1 }

    static func decode(_ s: String) -> String {
        var bytes: [UInt8] = []
        let u = Array(s.utf8)
        var i = 0
        while i < u.count {
            if u[i] == 0x2B {                                    // "+"
                bytes.append(0x20); i += 1
            } else if u[i] == 0x25, i + 2 < u.count,
                      let hi = hexValue(u[i + 1]), let lo = hexValue(u[i + 2]) {
                bytes.append(hi << 4 | lo); i += 3
            } else {
                bytes.append(u[i]); i += 1
            }
        }
        return String(decoding: bytes, as: UTF8.self)
    }

    private static func hexValue(_ c: UInt8) -> UInt8? {
        switch c {
        case 0x30...0x39: return c - 0x30
        case 0x61...0x66: return c - 0x61 + 10
        case 0x41...0x46: return c - 0x41 + 10
        default: return nil
        }
    }
}
