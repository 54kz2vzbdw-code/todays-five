// Haptics.swift — the reason the app exists.
//
// Four moments, and nothing else. No haptic on an ordinary tap; the page's own sound still plays,
// and muting the sound does not mute these — they are different senses.
//
// The web has fired an iOS haptic on check-off since before this app, through a hidden
// <input type="checkbox" switch>. It is one tick: no distinct un-check, no finale, no control of
// intensity. From 1.10 the page turns that off when it sees the shell's user-agent token, so these
// replace it rather than stacking a second buzz on top of it.
//
// 1.12: the finale is a pattern rather than one tap. The page throws confetti in a shape — seven
// bursts along the bottom 65 ms apart, a fuller one through the middle, and the chord landing after
// them — and a single `.success` said none of that. The numbers below are fx.js's `volley()` and
// packs.js's chord, read across rather than invented; if the volley changes, these change with it.
// Nothing here works around Settings → Sounds & Haptics: Core Haptics and UIFeedbackGenerator both
// go quiet when System Haptics is off, which is exactly what should happen.
import UIKit
import CoreHaptics

@MainActor
final class Haptics {
    enum Moment: String, CaseIterable {
        case check = "tf:check"
        case uncheck = "tf:uncheck"
        case finale = "tf:finale"
        case shuffle = "tf:shuffle"
    }

    /// The volley, from `fx.js`: `for (let i = 0; i < 7; i++) … i * 65` along the bottom, then one
    /// burst through the middle at 210 ms. The chord is `packs.js`'s, at `t0 + 0.7`.
    private enum Volley {
        static let count = 7
        static let step = 0.065
        static let centre = 0.210
        static let chord = 0.700
        static let ring = 0.320
    }

    private let medium = UIImpactFeedbackGenerator(style: .medium)
    private let light = UIImpactFeedbackGenerator(style: .light)
    private let notice = UINotificationFeedbackGenerator()

    private var engine: CHHapticEngine?
    private var engineDead = false // asked once and refused: stop asking, and use the 1.10 notification tap
    private var supportsHaptics: Bool { CHHapticEngine.capabilitiesForHardware().supportsHaptics }

    /// Counted so a simulator run can prove the calls happened: a simulator has no motor.
    private(set) var counts: [Moment: Int] = [:]

    /// Called on touch-down, so the Taptic Engine is warm by the time the tap lands. Without it the
    /// first haptic of a session is late enough to feel disconnected from the check-off.
    func prepare() {
        medium.prepare()
        light.prepare()
        notice.prepare()
        startEngine()
    }

    func play(_ moment: Moment) {
        counts[moment, default: 0] += 1
        switch moment {
        case .check: medium.impactOccurred()
        case .uncheck, .shuffle: light.impactOccurred()
        case .finale: if !playFinale() { notice.notificationOccurred(.success) } // 1.10's tap, where there is no engine
        }
        // keep them warm for the next line in the same burst
        prepare()
    }

    // ---------------------------------------------------------------- the finale

    /// The volley in the hand: seven along the bottom, the fuller one through the middle, and the
    /// chord — the strongest tap, with a short roll under it the way the sound rings down. False
    /// when there is no engine to play it, so the caller can fall back rather than lose the moment.
    private func playFinale() -> Bool {
        guard supportsHaptics, !engineDead else { return false }
        startEngine()
        guard let engine else { return false }
        do {
            let player = try engine.makePlayer(with: try finalePattern())
            try player.start(atTime: CHHapticTimeImmediate)
            return true
        } catch {
            self.engine = nil // it may simply have been reset under us; the next finale builds a fresh one
            return false
        }
    }

    private func finalePattern() throws -> CHHapticPattern {
        func tap(_ intensity: Float, _ sharpness: Float, at t: TimeInterval) -> CHHapticEvent {
            CHHapticEvent(eventType: .hapticTransient, parameters: [
                CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
                CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness)
            ], relativeTime: t)
        }
        var events: [CHHapticEvent] = []
        // the run along the bottom: even and light, quick enough to read as one gesture and not seven taps
        for i in 0..<Volley.count { events.append(tap(0.55, 0.45, at: Double(i) * Volley.step)) }
        // the burst through the middle is forty pieces to the run's twenty-six, so it is fuller and rounder
        events.append(tap(0.80, 0.30, at: Volley.centre))
        // and the chord: the strongest of them, with a short roll under it for the ring-down
        events.append(tap(1.00, 0.25, at: Volley.chord))
        events.append(CHHapticEvent(eventType: .hapticContinuous, parameters: [
            CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.45),
            CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.15)
        ], relativeTime: Volley.chord, duration: Volley.ring))
        return try CHHapticPattern(events: events, parameters: [])
    }

    /// Idempotent, and safe on every touch-down: an engine already running is a no-op, one the
    /// system shut down is started again, and one that will not start is dropped so the next finale
    /// builds a fresh one. No stopped/reset handlers — they would be closures crossing the main
    /// actor under strict concurrency for something `start()` already covers on the path that matters.
    private func startEngine() {
        guard supportsHaptics, !engineDead else { return }
        if engine == nil {
            do {
                let e = try CHHapticEngine()
                e.playsHapticsOnly = true
                e.isAutoShutdownEnabled = true // it sleeps between finales rather than holding the hardware all day
                engine = e
            } catch {
                engineDead = true
                return
            }
        }
        do { try engine?.start() } catch { engine = nil }
    }

    #if DEBUG
    /// `-TFSelfTest`. The pattern is only ever *played* where there is a Taptic Engine, so on a
    /// simulator nothing would touch it and a malformed one would not be found until it reached a
    /// phone. Build it regardless and say whether it came out, and how long it runs.
    func finaleSelfCheck() -> String {
        do {
            let p = try finalePattern()
            return String(format: "ok duration=%.3fs hardware=%@", p.duration, supportsHaptics ? "yes" : "no")
        } catch {
            return "INVALID: \(error)"
        }
    }
    #endif

    /// For the simulator checklist. Names a count per moment and nothing else — no list, no link.
    var tally: String {
        Moment.allCases.map { "\($0.rawValue.dropFirst(3))=\(counts[$0] ?? 0)" }.joined(separator: " ")
    }
}
