// Haptics.swift — the reason the app exists.
//
// Four moments, and nothing else. No haptic on an ordinary tap; the page's own sound still plays,
// and muting the sound does not mute these — they are different senses.
//
// The web has fired an iOS haptic on check-off since before this app, through a hidden
// <input type="checkbox" switch>. It is one tick: no distinct un-check, no finale, no control of
// intensity. From 1.10 the page turns that off when it sees the shell's user-agent token, so these
// replace it rather than stacking a second buzz on top of it.
import UIKit

@MainActor
final class Haptics {
    enum Moment: String, CaseIterable {
        case check = "tf:check"
        case uncheck = "tf:uncheck"
        case finale = "tf:finale"
        case shuffle = "tf:shuffle"
    }

    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let notice = UINotificationFeedbackGenerator()

    /// Counted so a simulator run can prove the calls happened: a simulator has no motor.
    private(set) var counts: [Moment: Int] = [:]

    /// Called on touch-down, so the Taptic Engine is warm by the time the tap lands. Without it the
    /// first haptic of a session is late enough to feel disconnected from the check-off.
    func prepare() {
        medium.prepare()
        light.prepare()
        notice.prepare()
    }

    func play(_ moment: Moment) {
        counts[moment, default: 0] += 1
        switch moment {
        case .check: medium.impactOccurred()
        case .uncheck, .shuffle: light.impactOccurred()
        case .finale: notice.notificationOccurred(.success)
        }
        // keep them warm for the next line in the same burst
        prepare()
    }

    /// For the simulator checklist. Names a count per moment and nothing else — no list, no link.
    var tally: String {
        Moment.allCases.map { "\($0.rawValue.dropFirst(3))=\(counts[$0] ?? 0)" }.joined(separator: " ")
    }
}
