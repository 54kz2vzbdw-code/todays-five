// WatchHaptics.swift — the four moments, in WKInterfaceDevice's vocabulary, which is narrower than
// the phone's on purpose.
//
// | moment  | phone (1.12)                         | Watch                                  |
// | check   | UIImpactFeedbackGenerator(.medium)   | .play(.success)                        |
// | uncheck | .light                               | .play(.click)                          |
// | shuffle | .light                               | .play(.click)                          |
// | finale  | a CHHapticPattern                    | a timed run of .play(_:) on the onsets |
//
// **The finale is an approximation and this comment is where it says so.**
// `CoreHaptics.framework` is not in the watchOS SDK — checked on disk, not recalled — so 1.12's
// pattern (seven transients 65 ms apart, a fuller one at 210, the chord at 700 with a 320 ms roll
// under it) cannot be played on a wrist. `WKInterfaceDevice.play(_:)` takes a type and nothing else:
// no time, no intensity, no sharpness, and watchOS coalesces haptics that arrive too close together.
// So what is played here is the volley's *rhythm* and not its shape: seven `.click` 65 ms apart and
// `.success` on the chord at 700.
//
// The numbers are `fx.js`'s `volley()` and `packs.js`'s chord, read across rather than invented,
// exactly as `Haptics.swift` reads them — so if the volley is ever re-choreographed, both clients are
// wrong together and `test/sound.test.js` says so.
//
// The Watch answers an **uncheck** with `.click` where the web's `sound.js` gives an uncheck no buzz
// at all. Deliberate: a wrist that answers a tap with nothing reads as a tap that missed.
//
// **Isolation.** The whole object is on the main actor, because every caller is a SwiftUI gesture and
// the counts below are read by the self-test on the same actor a frame later. Nothing here escapes
// to another one.
import Foundation
import WatchKit

@MainActor
final class WatchHaptics {

    /// The same four names the page dispatches (COMPATIBILITY.md §8), so a tally from the Watch and a
    /// tally from the phone can be read side by side.
    enum Moment: String, CaseIterable {
        case check = "tf:check"
        case uncheck = "tf:uncheck"
        case finale = "tf:finale"
        case shuffle = "tf:shuffle"
    }

    /// From `fx.js`: `for (let i = 0; i < 7; i++) … i * 65`, and the chord at `t0 + 0.7`. The 210 ms
    /// burst through the middle and the 320 ms ring-down have no spelling in `WKHapticType` and are
    /// not faked with a tap that would land in the wrong place.
    private enum Volley {
        static let count = 7
        static let stepMs = 65
        static let chordMs = 700
    }

    /// Counted so a simulator run can prove the calls happened: a simulator has no motor, so the
    /// count and the spacing are the only things it can be asked about. The phone's `Haptics.swift`
    /// does exactly this, for exactly this reason.
    private(set) var counts: [Moment: Int] = [:]

    /// How many `play(_:)` calls the last finale run actually made, and how long it took wall-clock.
    /// Seven clicks plus the chord is eight; anything else is a run that was cancelled or coalesced
    /// by something above this object.
    private(set) var lastFinaleTaps = 0
    private(set) var lastFinaleSeconds: Double = 0

    /// The run in flight, so a second finale replaces the first rather than playing over it, and so
    /// the self-test can wait for one to finish instead of guessing at a sleep.
    private(set) var finaleRun: Task<Void, Never>?

    private let device = WKInterfaceDevice.current()

    func play(_ moment: Moment) {
        counts[moment, default: 0] += 1
        switch moment {
        case .check: device.play(.success)
        case .uncheck, .shuffle: device.play(.click)
        case .finale: playFinale()
        }
    }

    // ---------------------------------------------------------------- the finale

    /// The volley's rhythm. Seven `.click` on `i * 65`, then `.success` at 700 measured from the
    /// first tap rather than from the seventh — the onsets are absolute in `fx.js` and drifting them
    /// by whatever the sleeps actually cost would put the chord somewhere that is not 700.
    private func playFinale() {
        finaleRun?.cancel()
        lastFinaleTaps = 0
        lastFinaleSeconds = 0
        let started = Date()
        finaleRun = Task { @MainActor [weak self] in
            guard let self else { return }
            for i in 0..<Volley.count {
                if i > 0 {
                    try? await Task.sleep(for: .milliseconds(Volley.stepMs))
                    guard !Task.isCancelled else { return }
                }
                device.play(.click)
                lastFinaleTaps += 1
            }
            let elapsed = Date().timeIntervalSince(started)
            let remaining = Double(Volley.chordMs) / 1000 - elapsed
            if remaining > 0 {
                try? await Task.sleep(for: .seconds(remaining))
                guard !Task.isCancelled else { return }
            }
            device.play(.success)
            lastFinaleTaps += 1
            lastFinaleSeconds = Date().timeIntervalSince(started)
        }
    }

    // ---------------------------------------------------------------- the tally

    /// For the simulator checklist. Names a count per moment and nothing else — no list, no link.
    var tally: String {
        Moment.allCases.map { "\($0.rawValue.dropFirst(3))=\(counts[$0] ?? 0)" }.joined(separator: " ")
    }

    #if DEBUG
    /// `-TFWatchSelfTest`. The phone's `finaleSelfCheck()` builds the pattern and reports its
    /// duration, because a simulator would otherwise never touch it. There is no pattern object here
    /// to build — the run *is* the pattern — so this reports what the run that just happened did,
    /// which is the same question one level down: eight calls, and how long they took.
    func finaleSelfCheck() -> String {
        let want = Volley.count + 1
        return String(format: "taps=%d/%d duration=%.3fs (approximation: no CoreHaptics on watchOS)",
                      lastFinaleTaps, want, lastFinaleSeconds)
    }
    #endif
}
