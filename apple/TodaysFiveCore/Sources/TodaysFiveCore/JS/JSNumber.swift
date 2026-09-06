// JSNumber — ECMAScript's Number::toString(x, 10), which is what JSON.stringify writes for a number
// and what canon() therefore compares. Swift's own Double.description gives the same *digits* (both
// pick the shortest decimal that round-trips) but formats them differently: Swift writes 1e20 as
// "1e+20" where JavaScript writes "100000000000000000000", and 1e-7 as "1e-07" where JavaScript
// writes "1e-7". So this takes Swift's digits and applies the spec's own formatting rules.
import Foundation

enum JSNumber {
    /// ECMAScript Number::toString(x, 10). Non-finite values never reach JSON (JSON.stringify writes
    /// null for them) but are spelled the way JavaScript spells them for completeness.
    static func toString(_ x: Double) -> String {
        if x.isNaN { return "NaN" }
        if x == 0 { return "0" }                       // covers -0, which JavaScript prints as "0"
        if x < 0 { return "-" + toString(-x) }
        if x.isInfinite { return "Infinity" }

        let (digits, n) = decompose(x)
        let k = digits.count

        // ES2023 6.1.6.1.20, steps 6–10, with s the digits and n the position of the decimal point.
        if k <= n && n <= 21 {
            return digits + String(repeating: "0", count: n - k)
        }
        if 0 < n && n <= 21 {
            let i = digits.index(digits.startIndex, offsetBy: n)
            return String(digits[..<i]) + "." + String(digits[i...])
        }
        if -6 < n && n <= 0 {
            return "0." + String(repeating: "0", count: -n) + digits
        }
        let e = n - 1
        let sign = e >= 0 ? "+" : "-"
        let exp = "e" + sign + String(abs(e))
        if k == 1 { return digits + exp }
        let i = digits.index(digits.startIndex, offsetBy: 1)
        return String(digits[..<i]) + "." + String(digits[i...]) + exp
    }

    /// The shortest round-tripping digits of a positive finite double, and the spec's `n`
    /// (digits × 10^(n − k) == x). Taken from Swift's own shortest description and re-normalised.
    private static func decompose(_ x: Double) -> (digits: String, n: Int) {
        var mantissa = ""
        var exponent = 0
        var pointAt = -1                                // digits before the decimal point
        var sawExponent = false
        var expDigits = ""
        var expNegative = false

        for ch in x.description {
            switch ch {
            case "0"..."9":
                if sawExponent { expDigits.append(ch) } else { mantissa.append(ch) }
            case ".":
                pointAt = mantissa.count
            case "e", "E":
                sawExponent = true
            case "-":
                if sawExponent { expNegative = true }
            case "+":
                break
            default:
                break
            }
        }
        if sawExponent { exponent = (Int(expDigits) ?? 0) * (expNegative ? -1 : 1) }
        if pointAt < 0 { pointAt = mantissa.count }

        let fractionDigits = mantissa.count - pointAt
        var digits = Substring(mantissa)
        var trailing = 0
        while digits.first == "0" { digits = digits.dropFirst() }
        while digits.last == "0" { digits = digits.dropLast(); trailing += 1 }
        if digits.isEmpty { return ("0", 1) }

        let exp10 = exponent - fractionDigits + trailing
        return (String(digits), exp10 + digits.count)
    }
}
