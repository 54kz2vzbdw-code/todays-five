// WidgetIntents.swift — which list a widget shows, and the check-off a widget performs.
//
// A list is offered by its name and stored by its key (WidgetShelf.key): the configuration a person picks is kept
// by the system, outside this app, so it must never hold the list's id. The names come from `lists.json`, which the
// app writes; before the app has written it (a phone that updated and has not opened the app since), the vault
// answers directly, so the picker is never empty for a phone that holds a list.
import AppIntents
import Foundation
import TodaysFiveCore
import WidgetKit

/// The lists this phone holds, as the widgets offer them: what the app last wrote, else what the vault has.
enum HeldLists {
    static func current() -> (lists: [WidgetListRef], open: String) {
        if let ix = WidgetIndex.read(), !ix.lists.isEmpty { return (ix.lists, ix.open) }
        let links = WidgetFeed.live().links()
        let refs = links.map { WidgetListRef(key: WidgetShelf.key(for: $0.id), name: WidgetFeed.displayName($0),
                                             viewOnly: $0.mode == .view, shared: $0.origin == "shared") }
        return (refs, refs.first?.key ?? "")
    }
}

/// What the List setting offers: "Same as the app" first, then each list by name. A choice is stored as a key — the
/// words a person sees are the list's name, and the value kept is `WidgetShelf.key`, never the id.
///
/// **Options, not an `AppEntity`** (b407). 406 offered the lists as an entity, and the system has to recognise an
/// entity's type before it will hand a chosen one back to the widget; where it would not (seen in the simulator:
/// "ListEntity is not a registered AppEntity identifier"), the choice came back empty and every widget showed the open
/// list whatever was picked. A plain value has nothing to recognise, so a choice is a choice everywhere.
struct ListChoices: DynamicOptionsProvider {
    func results() async throws -> IntentItemCollection<String> {
        var items = [IntentItem(WidgetFeed.followApp, title: "Same as the app", subtitle: "The list open in Today's Five")]
        for ref in HeldLists.current().lists {
            items.append(IntentItem(ref.key, title: "\(ref.name)", subtitle: ref.viewOnly ? "View only" : nil))
        }
        return IntentItemCollection(sections: [IntentItemSection(items: items)])
    }

    /// A widget follows the app until it is pinned to a list.
    func defaultResult() async -> String? { WidgetFeed.followApp }
}

/// The one setting a list widget has: which list. "Same as the app" (and no choice at all) follows the list open in
/// the app; a list chosen by name stays put until this phone lets go of it.
///
/// The parameter is `choice`, not 406's `list`: a widget set up on 406 was pinned, the moment it was added, to whichever
/// list happened to be open, and a new name lets those widgets start again on "Same as the app" rather than carry that
/// accident forward.
struct ListConfiguration: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "List"
    static let description = IntentDescription("Choose the list this widget shows. Same as the app follows the list open in Today's Five.")

    @Parameter(title: "List", optionsProvider: ListChoices())
    var choice: String?

    init() {}
    init(choice: String?) { self.choice = choice }
}

/// What a box on a widget does: cross its line off. A factory, so the views never name the intent — the debug app's widget
/// lab compiles the views with a stand-in of its own (WidgetDebug.swift), and an intent in both targets is one too many.
enum WidgetActions {
    static func check(list: String, line: String, done: Bool) -> CheckLineIntent {
        CheckLineIntent(list: list, line: line, done: done)
    }
}

/// A line crossed off, or brought back, from a widget. Runs in the widget extension: the shelf changes at once, the
/// list on the server a moment later (WidgetFeed.setDone), and the widget is drawn again when it returns. Not offered
/// in Shortcuts — it needs a line's id, which only a widget has.
struct CheckLineIntent: AppIntent {
    static let title: LocalizedStringResource = "Cross off a line"
    static let description = IntentDescription("Crosses a line off Today, or brings it back.")
    static let isDiscoverable = false
    /// A locked phone on a nightstand in StandBy is not a reason to let whoever is near it cross lines off.
    static let authenticationPolicy = IntentAuthenticationPolicy.requiresAuthentication

    @Parameter(title: "List") var list: String
    @Parameter(title: "Line") var line: String
    @Parameter(title: "Done") var done: Bool

    init() {}
    init(list: String, line: String, done: Bool) {
        self.list = list
        self.line = line
        self.done = done
    }

    func perform() async throws -> some IntentResult {
        await WidgetFeed.live().setDone(list, line, done)
        // WidgetKit draws the widget that was tapped again by itself, and only that one: Next up beside it, the ring
        // and the Today control are the same list, so they are asked for too (measured in the simulator, b405)
        WidgetCenter.shared.reloadAllTimelines()
        if #available(iOS 18.0, *) { ControlCenter.shared.reloadAllControls() }
        return .result()
    }
}
