// TodaysFiveShortcuts.swift — the App Shortcut and its phrases.
//
// An App Shortcut is what makes an intent something a person can *say* without opening Shortcuts,
// and — on an Ultra — something they can put on the Action button. There is no developer-facing
// Action button API anywhere in the watchOS SDK, so this file is the whole of that feature: the
// assignment itself is two taps in Settings that only the owner of the watch can make.
//
// **The phrase cannot carry the line, and this is the round's one real disappointment.** An App
// Shortcut phrase may only interpolate a parameter whose type is an `AppEntity` or an `AppEnum`; a
// free-text `String` parameter inside a phrase is a halting build error, not a warning. A line of
// someone's to-do list has no set to enumerate, so there is nothing to model it as. The phrases are
// therefore parameterless and Siri asks for the line afterwards, from the parameter's
// `requestValueDialog` in `AddToTodaysFive`. Two beats where the brief wanted one.
//
// Two neighbouring rules, both build failures rather than warnings, and both proved on this machine
// rather than believed — the exact errors are pasted into the round's results:
//
//   * every phrase must contain `\(.applicationName)`;
//   * the intent and its `AppShortcutsProvider` must be in the same target, which is satisfied by
//     compiling this file and `AddToTodaysFive.swift` into both the phone and the Watch.
//
// An app may register at most ten. There are three here, and they are three rather than one because
// people do not all reach for the same words: "add to", "add a line to", "put something on".
import AppIntents

struct TodaysFiveShortcuts: AppShortcutsProvider {

    /// The tile's colour in the Shortcuts app. Grey-blue rather than a shout: this is a utility, not
    /// a feature that wants attention.
    static let shortcutTileColor = ShortcutTileColor.grayBlue

    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddToTodaysFive(),
            phrases: [
                "Add to \(.applicationName)",
                "Add a line to \(.applicationName)",
                "Put something on my \(.applicationName)"
            ],
            shortTitle: "Add a line",
            systemImageName: "plus.circle"
        )
    }
}
