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

struct ListEntity: AppEntity, Identifiable {
    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "List")
    static let defaultQuery = ListQuery()

    /// The key, never the id.
    let id: String
    let name: String
    let viewOnly: Bool

    var displayRepresentation: DisplayRepresentation {
        viewOnly ? DisplayRepresentation(title: "\(name)", subtitle: "View only") : DisplayRepresentation(title: "\(name)")
    }

    init(_ ref: WidgetListRef) { id = ref.key; name = ref.name; viewOnly = ref.viewOnly }
}

struct ListQuery: EntityQuery {
    /// What the phone holds, as the app last wrote it, else as the vault has it.
    static func held() -> (lists: [WidgetListRef], open: String) {
        if let ix = WidgetIndex.read(), !ix.lists.isEmpty { return (ix.lists, ix.open) }
        let links = WidgetFeed.live().links()
        let refs = links.map { WidgetListRef(key: WidgetShelf.key(for: $0.id), name: WidgetFeed.displayName($0),
                                             viewOnly: $0.mode == .view, shared: $0.origin == "shared") }
        return (refs, refs.first?.key ?? "")
    }

    func entities(for identifiers: [ListEntity.ID]) async throws -> [ListEntity] {
        Self.held().lists.filter { identifiers.contains($0.key) }.map(ListEntity.init)
    }

    func suggestedEntities() async throws -> [ListEntity] {
        Self.held().lists.map(ListEntity.init)
    }

    func defaultResult() async -> ListEntity? {
        let h = Self.held()
        return (h.lists.first { $0.key == h.open } ?? h.lists.first).map(ListEntity.init)
    }
}

/// The one setting a list widget has: which list. Left unset, it follows the list open in the app.
struct ListConfiguration: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "List"
    static let description = IntentDescription("Choose the list this widget shows. Left as it is, it shows the list open in Today's Five.")

    @Parameter(title: "List")
    var list: ListEntity?

    init() {}
    init(list: ListEntity?) { self.list = list }
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
