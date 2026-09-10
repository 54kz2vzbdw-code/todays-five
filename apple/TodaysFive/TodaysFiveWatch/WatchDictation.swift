// WatchDictation.swift — the WatchKit input controller, demoted to a seam, and the gate that stops a
// presentation from taking the screen with it.
//
// ============================================================================================
// WHAT PHASE 5 LEARNED FROM A WRIST, AND WHAT IT CHANGED HERE
// ============================================================================================
//
// Phase 3 made this file the add path: the `+` presented WatchKit's
// `presentTextInputController(withSuggestions:allowedInputMode:completion:)` from
// `WKApplication.shared().visibleInterfaceController`, and `TextFieldLink` was the fallback for the
// case that controller was ever nil. On a real Apple Watch running 1.12 (216) from TestFlight that
// produced: a haptic, **the system microphone indicator lighting up**, and *no change to the screen at
// all* — no input UI, no line, no error, no confirmation.
//
// Two things about that were settled by reading rather than by the wrist, and they are why this file
// was demoted rather than debugged. `Config/WatchInfo.plist` declares **no
// `NSMicrophoneUsageDescription`** and the watch target links no audio framework, so the microphone
// that lit was **the system's own**, inside its own dictation, reached through the controller this file
// presents. So "an App Intent or a Siri path took the microphone" is not what happened. What is left is
// "it was presented and renders nowhere a person can see it" or "it was presented and the completion
// never came" — and **in both of those the controller is the thing that failed**.
//
// So Phase 5 reverses the precedence. `TextFieldLink` — the SwiftUI-sanctioned input on watchOS, whose
// screen the system presents from the app's own presentation hierarchy rather than across it — is the
// path, and this is the seam behind it. `AddFlowView` chooses between them on `preferred`.
//
// **What neither can do, still.** Nothing on watchOS forces dictation. `TextFieldLink` has four
// initializers and none takes an input mode; `WKTextInputMode` has three cases and none of them means
// "dictation only" — the mode widens which characters may come back, it never picks the method; and
// `Speech.framework` is not in the watchOS SDK at all, so our own transcription cannot be built. That
// was true in Phase 3 and it is true now. What changed is the *other* half of the requirement: a
// `TextFieldLink`'s screen cannot be invisible, and invisible is the failure being fixed.
//
// **Read out of the SDK in Phase 5, because it is the strongest evidence this project has on the
// question and it is one grep away rather than a recollection.** `WKInterfaceController.h` in
// WatchOS26.5.sdk documents the two text-input methods differently, and the difference is the whole
// argument:
//
//     presentTextInputControllerWithSuggestions:...          // results is nil if cancelled
//     presentTextInputControllerWithSuggestionsForLanguage:  // will never go straight to dictation
//                                                            // because allows for switching input language
//
// Apple says the *language* variant never goes straight to dictation, and says it **as the reason to
// prefer the other one**. So the plain variant this file calls — with `withSuggestions: nil` — is the
// one input on watchOS that is documented as able to open on dictation, and `WKTextInputModePlain` is
// annotated `// text (no emoji) from dictation + suggestions`. Phase 3 was not wrong about the API. It
// was wrong about the API *rendering*, which is a different failure and the one a wrist reported.
//
// That is why this path is kept rather than deleted, and it is the thing to reach for if the wrist
// says `TextFieldLink` opens a keyboard and will not offer the microphone: this is the only remaining
// call in the SDK that Apple documents as going straight to it. What it costs to reach is one line —
// see `preferred` — and one build, and that cost is written down in this round's results rather than
// discovered later.
//
// **What reversing the precedence widens, and it is worth knowing.** `allowedInputMode: .plain` kept
// emoji and stickers out of a line. The system's own input screen has no such restriction, so a line
// from a wrist may now carry an emoji — which is exactly what a line typed into the web already may
// carry, so the Watch stops being the one client with a narrower alphabet than the document. The one
// rule that widening touches is the 200-UTF-16-code-unit cut, which `Model.addToToday` performs as
// `String.prototype.slice(0, 200)` does, lone surrogate and all; `TodayOpsTests` pins it.
//
// ============================================================================================
// THE GATE — WHICH REPAIRS THIS SEAM AND IS NOT ON THE PATH A WRIST TAKES
// ============================================================================================
//
// Said first, because an independent review found the earlier version of this paragraph overstated and
// that is exactly the failure this round exists to stop: **`Gate`, the 60-second deadline and
// `AddOutcome.inputTimedOut` are unreachable in a shipping build.** `Gate` is constructed only in
// `present` below; `present` is called only from `AddFlowView.begin()`; `begin()` is only in the
// `.watchKit` arm of `addControl`; and `preferred` returns `.fieldLink` unless something wrote
// `inputKey`, which nothing shipping does. So `add.present`, `add.presented`, `add.nopresenter` and
// `add.timeout` are **structurally zero** on a Release wrist, the timeout sentence can never be shown
// there, and nothing on the shipping path can grey itself out. The Diagnostics screen's `timed out`
// row reading 0 is health, not a finding.
//
// What the gate is, then: the repair that makes this seam *already correct* if `prefer(.watchKit)` is
// ever turned on. `AddFlowView.begin()` used to set `working = true` before presenting and clear it
// only *inside* the completion handler. A completion that never arrives therefore disabled the add
// control for the life of the screen, with no sentence and no way back — one failure costing the
// feature rather than one attempt. On the shipping path that latch is gone for a blunter reason than
// the gate: nothing is presented, so there is nothing to latch.
//
// `Gate` answers exactly once, whichever happens first: the controller's completion, or a deadline.
// A late completion after a timeout is dropped rather than delivered, because the caller has already
// released its control and told the person so, and a line appearing two minutes after a sentence
// saying nothing was added is worse than either. `-TFAddSelfTest` exercises both directions on a
// simulator without presenting anything, which is the whole of what can be measured about it here.
//
// **No epoch reaches an `Int` here.** Phase 4's integration found a watchOS device is `arm64_32` and
// its `Int` is 32 bits; the gate reports an *elapsed* millisecond count, clamped to a day, which is
// the same fence `WatchDiagnostics` puts on its offsets.
//
// **Isolation.** The whole enum and the gate are on the main actor: `WKInterfaceController` is
// UIKit-shaped, its completion comes back on the main thread, and the only caller is a SwiftUI view.
import Foundation
import WatchKit

/// Which control the add row *is*. Not "which input method" — no API on watchOS chooses that.
enum AddInput: String {
    /// `TextFieldLink`: the system presents its own input screen from the app's own hierarchy. The
    /// default since Phase 5, and where dictation lives on a real device.
    case fieldLink
    /// WatchKit's `presentTextInputController`. What Phase 3 shipped and what a wrist could not see.
    case watchKit
}

@MainActor
enum WatchDictation {

    /// Every way a request for input can end. One value, delivered once.
    enum Answer: Equatable {
        /// Something came back. May be empty — a confirmation that said nothing is not the same as
        /// backing out, and the core is the one place that decides an empty line is not a line.
        case text(String)
        /// The person backed out. Answered with silence.
        case cancelled
        /// `visibleInterfaceController` was nil, so there was nothing to present from.
        case noPresenter
        /// Nothing came back inside the window. `afterMs` is how long was waited.
        case timedOut(afterMs: Int)
    }

    // ---------------------------------------------------------------- which control

    /// Where a future round flips the default without a rebuild. `tf/app/watch/…`, the clients' prefix
    /// (COMPATIBILITY.md §5), in the App Group so an App Intent could read it too.
    static let inputKey = "tf/app/watch/addinput"

    /// The control `AddFlowView` offers.
    ///
    /// **Said plainly, because it is the opposite of what it looks like:** nothing in the shipping app
    /// writes `inputKey`, so on a Release wrist this is always `.fieldLink` and the WatchKit path is
    /// **not reachable by any tap**. It is a seam, not a fallback — a fallback nobody can reach is how
    /// Phase 3 shipped a path nobody could see, and calling this one a fallback would repeat that.
    /// What it buys is a one-line flip (`prefer(.watchKit)`, or `-TFAddWatchKit` in Debug) if the wrist
    /// reports that `TextFieldLink`'s screen will not offer the microphone.
    static var preferred: AddInput {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-TFAddWatchKit") { return .watchKit }
        #endif
        if let raw = UserDefaults(suiteName: AddService.appGroup)?.string(forKey: inputKey),
           let stored = AddInput(rawValue: raw) {
            return stored
        }
        return .fieldLink
    }

    static func prefer(_ input: AddInput) {
        UserDefaults(suiteName: AddService.appGroup)?.set(input.rawValue, forKey: inputKey)
    }

    /// Whether the WatchKit path has anything to present from.
    ///
    /// **It says a branch would be taken and it has never said more than that.** Phase 3's results
    /// quoted `visibleInterfaceController=present` as evidence the feature worked; it was measured on a
    /// machine with no microphone and it was evidence of nothing except that the `guard` below would
    /// pass. It is still printed by `-TFAddSelfTest`, now with that sentence beside it.
    static var canPresentController: Bool {
        WKApplication.shared().visibleInterfaceController != nil
    }

    // ---------------------------------------------------------------- presenting

    /// Long enough that a person typing a line on a watch keyboard is never cut off, short enough that
    /// a presentation which never comes back costs one attempt instead of the session. It is a fence
    /// around a failure, not a pace for a feature.
    static let defaultTimeout: Duration = .seconds(60)

    /// Present the WatchKit input controller and answer exactly once.
    ///
    /// `withSuggestions: nil` is the whole trick: an empty array shows the chooser screen with no
    /// suggestions on it, and nil skips the chooser. `allowedInputMode: .plain` is kept for this path
    /// only — it is what Phase 3 chose, and changing it here would change the one thing this seam
    /// exists to reproduce.
    ///
    /// The three trace rows this writes are the three hypotheses, separated: no `add.present` is "it
    /// was never reached", `add.nopresenter` is "there was nothing to present from", and `add.presented`
    /// with no `add.heard` after it is "it went up and nothing came back".
    ///
    /// **All three are zero unless this seam was deliberately turned on.** Nothing a person can press on
    /// a Release wrist reaches this function — see `preferred` — so a trace with no `add.present` in it
    /// is not evidence about the add path the wrist actually used. It is only evidence when the reader
    /// knows `prefer(.watchKit)` or `-TFAddWatchKit` was in force.
    static func present(timeout: Duration = defaultTimeout,
                        _ completion: @escaping @MainActor (Answer) -> Void) {
        let gate = Gate(timeout: timeout, completion)
        guard let controller = WKApplication.shared().visibleInterfaceController else {
            WatchDiagnostics.shared.record(WatchDiagnostics.Code.addNoPresenter)
            gate.finish(.noPresenter)
            return
        }
        WatchDiagnostics.shared.record(WatchDiagnostics.Code.addPresent, 1)
        controller.presentTextInputController(withSuggestions: nil, allowedInputMode: .plain) { results in
            // The array is `[Any]?` because the same API returns `NSData` for an animated emoji.
            // `.plain` cannot produce one, so the first `String` is the answer — a defensive read of a
            // loosely typed callback rather than a case we expect.
            guard let results else { return gate.finish(.cancelled) }
            gate.finish(.text(results.compactMap { $0 as? String }.first ?? ""))
        }
        // After the call, because "returned without throwing" is not knowable before it. If a
        // completion ever fired synchronously this row would land after `add.heard`, which is worth
        // knowing when reading a trace and is not worth a flag to prevent.
        WatchDiagnostics.shared.record(WatchDiagnostics.Code.addPresented)
        gate.arm()
    }

    // ---------------------------------------------------------------- the gate

    /// One answer, once, from whichever of two sources arrives first.
    ///
    /// It is a class because the controller's completion and the deadline are two references to the
    /// same decision, and it is `internal` because `-TFAddSelfTest` exercises it: the unlatching is the
    /// one half of this file a simulator can settle, and it settles it **without presenting anything**,
    /// which matters because a watch simulator cannot be tapped and a keyboard raised on one would sit
    /// there until the process died.
    @MainActor
    final class Gate {
        private var completion: (@MainActor (Answer) -> Void)?
        private let timeout: Duration
        private let started = Date()
        private var deadline: Task<Void, Never>?

        init(timeout: Duration, _ completion: @escaping @MainActor (Answer) -> Void) {
            self.timeout = timeout
            self.completion = completion
        }

        /// How long the gate has been open, in milliseconds, clamped to a day so a 32-bit `Int` is
        /// never walked anywhere interesting.
        var elapsedMs: Int {
            let raw = Int((Date().timeIntervalSince(started) * 1000).rounded())
            return min(max(raw, 0), 86_400_000)
        }

        /// True once an answer has been delivered. What makes a late completion a no-op.
        var isClosed: Bool { completion == nil }

        /// Start the clock. Called after the presentation, so a presentation that threw never arms a
        /// timer nobody is waiting on.
        func arm() {
            guard !isClosed, deadline == nil else { return }
            deadline = Task { [timeout] in
                try? await Task.sleep(for: timeout)
                guard !Task.isCancelled else { return }
                finish(.timedOut(afterMs: elapsedMs))
            }
        }

        /// Deliver, once. Every later call is dropped.
        func finish(_ answer: Answer) {
            guard let hand = completion else { return }
            completion = nil
            deadline?.cancel()
            deadline = nil
            hand(answer)
        }
    }
}
