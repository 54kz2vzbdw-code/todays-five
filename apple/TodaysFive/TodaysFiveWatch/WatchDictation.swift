// WatchDictation.swift — the closest watchOS gets to hold-to-talk.
//
// What was wanted: press, speak, and the line lands. What watchOS allows is narrower, and the
// narrowing was measured rather than assumed (DECISIONS-apple.md, "No API forces dictation"):
//
//   * `Speech.framework` is **not in the watchOS SDK**, so our own transcription cannot be built;
//   * `TextFieldLink` has four initializers and none of them takes an input mode;
//   * `WKTextInputMode` has three cases — `.plain`, `.allowEmoji`, `.allowAnimatedEmoji` — and none
//     of them means "dictation only". The mode widens which characters may come back; it never picks
//     the input method.
//
// The one lever that exists is WatchKit's `presentTextInputController(withSuggestions:allowedInputMode:
// completion:)`, where a **nil** suggestions array skips the chooser screen and goes straight to an
// input method. In both the watchOS 11.1 and the watchOS 26.5 simulator that landed on the QWERTY
// keyboard — and **a simulator has no microphone**, so that is not an answer to the question that was
// asked. What a real wrist shows is written down as unresolved.
//
// **Reaching WatchKit from SwiftUI.** `WKApplication.shared().visibleInterfaceController` is public
// API and was measured non-nil from a pure SwiftUI `WindowGroup`. It is still an optional, so there
// is a sanctioned fallback: `TextFieldLink`, which `AddFlowView` shows instead when this returns nil.
// `-TFAddSelfTest` prints which of the two a wrist would take, because that is the one thing about
// this file a simulator *can* settle.
//
// **Isolation.** The whole enum is on the main actor: `WKInterfaceController` is UIKit-shaped and
// its completion comes back on the main thread, and the only caller is a SwiftUI view.
import Foundation
import WatchKit

@MainActor
enum WatchDictation {

    /// Whether the WatchKit path is available at all. `AddFlowView` chooses the control on this, and
    /// the self-test prints it, because it decides which of the two input paths a wrist takes.
    static var canPresentController: Bool {
        WKApplication.shared().visibleInterfaceController != nil
    }

    /// Present the input controller and hand back what came out of it.
    ///
    /// `withSuggestions: nil` is the whole trick: an empty array shows the chooser screen with no
    /// suggestions on it, and nil skips the chooser. `allowedInputMode: .plain` keeps emoji and
    /// stickers out of a to-do line — a line is text, and the document's `text` field is text.
    ///
    /// nil means the person **backed out**, and backing out is answered with silence. A confirmation
    /// that said nothing is a different thing — it comes back as an empty string, goes to the core
    /// like any other text, and gets the core's own answer, which is that an empty line is not a
    /// line. The two are worth telling apart: one is "never mind" and the other is "it didn't hear
    /// me", and only the second deserves a sentence.
    static func present(_ completion: @escaping @MainActor (String?) -> Void) {
        guard let controller = WKApplication.shared().visibleInterfaceController else {
            completion(nil)
            return
        }
        controller.presentTextInputController(withSuggestions: nil, allowedInputMode: .plain) { results in
            // The array is `[Any]?` because the same API returns `NSData` for an animated emoji.
            // `.plain` cannot produce one, so the first `String` is the answer — a defensive read of
            // a loosely typed callback rather than a case we expect.
            guard let results else { return completion(nil) }
            completion(results.compactMap { $0 as? String }.first ?? "")
        }
    }
}
