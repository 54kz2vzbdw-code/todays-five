// AppDoor.swift — the intents that open the app, and the door they knock on.
//
// Compiled into the app and the widget extension: a control's action has to be an intent the extension knows, and an
// intent that opens the app runs in the app's process (`openAppWhenRun`), so it is written once and lives in both.
// In the extension it is never performed. In the app it knocks on `AppDoor`, which the scene answers once it is up —
// a knock that comes before (a cold launch from the Action button) waits for it.
import AppIntents
import Foundation

@MainActor
final class AppDoor {
    enum Knock: Sendable, Equatable {
        /// The composer, with the keyboard out.
        case compose
        /// The list open in the app, as it is.
        case today
    }

    static let shared = AppDoor()
    private var answer: ((Knock) -> Void)?
    private var waiting: [Knock] = []

    func knock(_ k: Knock) {
        if let answer { answer(k) } else { waiting.append(k) }
    }

    /// The scene, once it can show something.
    func answer(with handler: @escaping (Knock) -> Void) {
        answer = handler
        let w = waiting; waiting = []
        w.forEach(handler)
    }
}

/// *Add a line*: the app, with the composer up. The control for Control Center, the Lock Screen and the Action
/// button. (*Add to Today's Five* is the one Siri runs with the words already in hand; this one asks on screen.)
struct OpenComposerIntent: AppIntent {
    static let title: LocalizedStringResource = "Add a line"
    static let description = IntentDescription("Opens Today's Five with a new line ready to type.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        AppDoor.shared.knock(.compose)
        return .result()
    }
}

/// *Today*: the app, on the list it has open.
struct OpenTodayIntent: AppIntent {
    static let title: LocalizedStringResource = "Open Today"
    static let description = IntentDescription("Opens Today's Five on the list it has open.")
    static let openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        AppDoor.shared.knock(.today)
        return .result()
    }
}
