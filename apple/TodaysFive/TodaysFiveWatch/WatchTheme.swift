// WatchTheme.swift — the accent, and where it comes from.
//
// **This round the Watch is always `#A86014`, and that is a decision rather than a default.**
//
// The brief asked the Watch to follow the phone's day/night slot accent. The payload the phone sends
// (PLAN-apple-phase3.md §2) carries links and nothing else — no slot, no accent — so there is no
// channel for it, and there is no honest way to follow a colour nobody sends. Rather than let the
// promise degrade quietly at integration, it is written down as not built.
//
// The fallback is a good one and was chosen, not fallen into: `#A86014` is the brand accent that
// **Dark, Paper and Terminal all carry** — the day default since 1.11, the night default, and the
// app's own — so the three likeliest themes are already right, and only somebody on Pink or Ocean
// sees a Watch that does not match their phone.
//
// `accentHex` below is the one place a colour from the phone would arrive. Nothing here builds a
// channel for it: adding `slot` and `accent` to the payload later costs nothing, because the codec
// keeps keys it does not understand (COMPATIBILITY.md §3, applied to a channel instead of a
// document), and this file would then read that value instead of the constant.
import SwiftUI

enum WatchTheme {

    /// The brand accent. ← the phone's slot accent would arrive here, and nowhere else.
    static let accentHex = "#A86014"

    static let accent = Color(hex: accentHex)

    /// The Always-On face. `isLuminanceReduced` means the screen is dimmed on a wrist that is down,
    /// and a five-line list lives there all day: the accent goes flat grey, because a saturated fill
    /// in a dimmed frame reads as a notification somebody needs to act on.
    static let accentDim = Color(white: 0.62)

    /// A done line, still readable but plainly finished.
    static let struck = Color.secondary
}

extension Color {
    /// `#RRGGBB`, which is how every colour in this project is written down. Anything else is grey,
    /// because a theme that cannot be read is not a reason to crash on somebody's wrist.
    init(hex: String) {
        let s = hex.hasPrefix("#") ? String(hex.dropFirst()) : hex
        guard s.count == 6, let v = UInt32(s, radix: 16) else {
            self = Color(white: 0.5)
            return
        }
        self = Color(red: Double((v >> 16) & 0xFF) / 255,
                     green: Double((v >> 8) & 0xFF) / 255,
                     blue: Double(v & 0xFF) / 255)
    }
}
