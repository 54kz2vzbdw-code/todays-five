// AddFlowView.swift — the +, the confirmation, and five seconds of Undo.
//
// This is the whole of the Watch's add flow and it is deliberately self-contained: `AddFlowView()`
// needs nothing from Track B but a place to stand. The rule about the document is the core's
// (`Model.addToToday`), the resolution of *which* list is `AddService`'s, and what is left here is a
// button, a sentence and a five-second window to change your mind.
//
// **Why it holds no reference to the Watch's model.** The same add has to work from an App Intent
// that ran while the app was closed, so the path cannot start from a live model object. It starts
// from the vault. `AddCoordinator` is what lets the two meet: whichever way a line came in, the
// confirmation and the Undo are the same, and Track B hangs `onChange` off it to pull the new line
// into whatever is on screen.
//
// **Double Tap.** The + carries `.handGestureShortcut(.primaryAction)`, which is what makes a double
// tap start dictation while the app is open. Its partner, `.scrollInputBehavior(_:for:)` with
// `ScrollInputKind.handGestureShortcut`, belongs on the screen's *scroll container* and not here —
// it configures scroll views within the view it is applied to, so putting it on this small stack
// would be inert. Track B's Today screen is where it goes; see the report.
//
// **Isolation.** A SwiftUI `View` and a `@MainActor @Observable` coordinator. The add itself is
// `async` and non-isolated, so the work happens off the main actor and only the answer comes back
// to it.
import Foundation
import SwiftUI
import TodaysFiveCore
import WatchKit

// MARK: - the shared moment

/// The one place a finished add is announced, whichever of the four ways it came in on.
///
/// It is a singleton because the announcer may be an App Intent that has no view to talk to, and
/// because there is exactly one wrist. `@Observable` rather than `ObservableObject`, matching
/// `WatchLinkReceiver` — hold it with `@State` or read it directly; `@ObservedObject` will not
/// compile against it.
@MainActor
@Observable
final class AddCoordinator {
    static let shared = AddCoordinator()

    /// What is on screen right now, if anything.
    struct Pending: Identifiable, Equatable {
        /// A serial rather than the item's id, so a second add restarts the five seconds even when it
        /// is the same line twice, and so a refusal (which has no item) can be pending too.
        let id: Int
        let outcome: AddOutcome
    }

    private(set) var pending: Pending?

    /// A line landed, or an Undo took one away. Track B's model hangs a pull off this so whatever is
    /// on screen catches up; SwiftUI does not need it, since `pending` is observed.
    var onChange: (@MainActor () -> Void)?

    private var serial = 0

    /// How long the Undo stays. The web's own undo toast is five seconds and this is the same five.
    static let undoWindow: Duration = .seconds(5)

    private init() {}

    /// Announce an outcome: the haptic, the sentence, and the window.
    func note(_ outcome: AddOutcome) {
        serial += 1
        pending = Pending(id: serial, outcome: outcome)
        if outcome.landed != nil {
            // The same tap the check-off gets. It belongs in Track B's `WatchHaptics` next to the
            // other four moments the moment that file exists — this call site is one line and is
            // meant to move.
            WKInterfaceDevice.current().play(.success)
            onChange?()
        }
        #if DEBUG
        // A fixed word and nothing else: never the text, never an id.
        print("[tfive] add: \(outcome.label)")
        #endif
    }

    /// The five seconds are up, or the person pressed Undo, or another add replaced this one.
    func dismiss(_ id: Int) {
        guard pending?.id == id else { return }
        pending = nil
    }

    /// The line has been taken back off the list.
    func noteUndone() {
        pending = nil
        WKInterfaceDevice.current().play(.click)
        onChange?()
    }
}

// MARK: - the view

/// The +, and everything that happens after it. Place it where the + belongs.
struct AddFlowView: View {

    /// True when the flow was opened by something that already means "add a line" — the Add
    /// complication's `todaysfive://add`, or Double Tap on the face. Then the dictation controller
    /// comes up by itself, because the plan's promise from the watch face is *tap, speak, done* and
    /// a `+` that still wants a second tap is two of those three.
    var beginImmediately = false

    /// Always-On. A confirmation that is about to disappear anyway should not animate or count down
    /// on a dimmed screen, and an Undo nobody can reach is chrome.
    @Environment(\.isLuminanceReduced) private var dimmed

    /// The kit. This view is presented in a sheet, which is its own hosting context — the ground is
    /// applied at the call site in `WatchApp.swift` (`.watchGround`), and the tokens are read here.
    @Environment(\.watchTheme) private var theme

    @State private var working = false

    private var coordinator: AddCoordinator { AddCoordinator.shared }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            addControl
            if let pending = coordinator.pending {
                confirmation(pending)
                    .transition(dimmed ? .identity : .opacity)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(theme.ink)
        .animation(dimmed ? nil : .easeOut(duration: 0.16), value: coordinator.pending)
        // `AddSelfTest` is NOT run from here. This view only exists inside a sheet, and a sheet
        // nobody opens is a self-test that never runs — which is exactly what `-TFAddSelfTest` did
        // until integration noticed the log was two lines long. It runs from the app's root instead.
        .task { if beginImmediately { begin() } }
    }

    // ---------------------------------------------------------------- the +

    @ViewBuilder
    private var addControl: some View {
        if WatchDictation.canPresentController {
            Button(action: begin) { plusLabel }
                .buttonStyle(.bordered)
                .tint(theme.ink3)
                .disabled(working)
                // Double Tap: on a Series 9 or an Ultra 2 this is what a pinch reaches. There is no
                // way to inject the gesture on a simulator, so it is written and left unverified.
                .handGestureShortcut(.primaryAction, isEnabled: !working)
        } else {
            // The sanctioned fallback, for the case `visibleInterfaceController` is ever nil. It
            // cannot ask for dictation either — nothing on watchOS can — but it is a text field the
            // system presents rather than one we present.
            TextFieldLink(prompt: Text(verbatim: "Add a line")) {
                plusLabel
            } onSubmit: { text in
                submit(text)
            }
            .buttonStyle(.bordered)
            .tint(theme.ink3)
            .handGestureShortcut(.primaryAction, isEnabled: !working)
        }
    }

    private var plusLabel: some View {
        Label {
            Text(verbatim: "Add")
        } icon: {
            Image(systemName: "plus")
        }
        .font(theme.ui(15, .body))
        .foregroundStyle(theme.text)
    }

    // ---------------------------------------------------------------- what happened

    @ViewBuilder
    private func confirmation(_ pending: AddCoordinator.Pending) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(pending.outcome.sentence)
                .font(theme.ui(13, .footnote))
                .foregroundStyle(pending.outcome.landed == nil ? theme.muted : theme.text)
                .lineLimit(3)
                .fixedSize(horizontal: false, vertical: true)

            if let line = pending.outcome.landed, !dimmed {
                Button(role: .destructive) { undo(line) } label: {
                    Text(verbatim: "Undo")
                        // `role: .destructive` paints the label the system's red, which is a colour
                        // no kit names. The kit's own `danger` is what the web draws here.
                        .foregroundStyle(theme.danger)
                }
                .buttonStyle(.borderless)
                .font(theme.ui(13, .footnote, bold: true))
            }
        }
        // The window is keyed on the serial, so a second add restarts it rather than inheriting the
        // remainder of the first one's.
        .task(id: pending.id) {
            try? await Task.sleep(for: AddCoordinator.undoWindow)
            guard !Task.isCancelled else { return }
            coordinator.dismiss(pending.id)
        }
    }

    // ---------------------------------------------------------------- the flow

    private func begin() {
        guard !working else { return }
        // The controller is modal but the view behind it is not disabled by it, so without this the
        // `+` and its Double Tap shortcut stay live under the dictation screen and a second gesture
        // stacks a second controller.
        working = true
        WatchDictation.present { text in
            // nil is "never mind", and never mind is answered with silence. An empty string is a
            // confirmation that said nothing, and it goes to the core like any other text so the
            // answer comes from one place.
            guard let text else { working = false; return }
            submit(text)
        }
    }

    private func submit(_ text: String) {
        working = true                       // already true on the dictation path; not on every path
        Task {
            let outcome = await AddService.live().add(text)
            coordinator.note(outcome)
            working = false
        }
    }

    private func undo(_ line: AddedLine) {
        coordinator.dismiss(coordinator.pending?.id ?? -1)
        Task {
            let done = await AddService.live().undo(line)
            if done { coordinator.noteUndone() }
        }
    }
}

// MARK: - -TFAddSelfTest

#if DEBUG
/// `simctl` cannot tap a watch simulator, so the add flow proves itself the way Phase 2's bridge did:
/// it performs its own moments and prints a tally.
///
/// It runs the **real** `AddService` — the same `add` and the same `undo` the + and the intent call —
/// against a `MemoryTransport` and a scratch directory, so nothing spends from the server's create
/// limit, nothing touches the Keychain, and nothing needs a phone. It answers five questions a
/// screenshot cannot: does a canned line land, does an empty one add nothing, is a view-only list
/// refused, is "no list yet" answered, and does Undo put the count back. And it prints the one thing
/// about dictation a simulator *can* settle: which of the two input paths a wrist would take.
///
/// Everything it prints is a count or a fixed word. Never a line, never an id.
@MainActor
enum AddSelfTest {
    private static var ran = false

    static func runIfAsked() async {
        guard !ran, ProcessInfo.processInfo.arguments.contains("-TFAddSelfTest") else { return }
        ran = true
        await run()
    }

    /// A vault that holds what the test put in it and refuses to be written to. The self-test never
    /// writes a link, and a real Keychain on a watch simulator would need the signed target anyway.
    private struct FixedVault: LinkVault {
        let links: [VaultedLink]
        func all() throws -> [VaultedLink] { links }
        func put(_ link: VaultedLink) throws {}
        func remove(id: String) throws {}
    }

    private static func run() async {
        var passed = 0
        var checked = 0
        func check(_ name: String, _ ok: Bool, _ detail: String) {
            checked += 1
            if ok { passed += 1 }
            print("[tfive] add self-test: \(name) \(ok ? "ok" : "FAILED") \(detail)")
        }

        print("[tfive] add self-test: begin")
        print("[tfive] add self-test: visibleInterfaceController="
            + (WatchDictation.canPresentController ? "present" : "nil")
            + " so the wrist takes the "
            + (WatchDictation.canPresentController ? "WatchKit" : "TextFieldLink") + " path")

        // A scratch store and a scratch server. Both die with the process.
        let dir = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("tf-add-selftest-\(UUID().uuidString)", isDirectory: true)
        guard let store = try? ListStore(directory: dir) else {
            print("[tfive] add self-test: FAILED could not make a scratch store")
            return
        }
        defer { try? FileManager.default.removeItem(at: dir) }

        let transport = MemoryTransport()
        let editLink = VaultedLink(id: Base62.randomId(22), mode: .edit, name: "Scratch")
        let viewLink = VaultedLink(id: Base62.randomId(22), mode: .view, name: "Someone else's")

        // A list this device made, so the memory transport will take the insert — the same rule the
        // real server applies (COMPATIBILITY.md §4).
        try? store.save(editLink.id, ListRecord(doc: Doc(), rev: 0, dirty: false, created: true,
                                                mode: .edit, origin: "mine"))

        func service(_ links: [VaultedLink], pick id: String?) -> AddService {
            AddService(vault: FixedVault(links: links), store: store,
                       makeTransport: { transport },
                       pickList: { held in held.first(where: { $0.id == id }) },
                       now: { CalendarDates.now() })
        }
        func todayCount() -> Int { store.load(editLink.id)?.doc.todayItems.count ?? -1 }

        let both = [editLink, viewLink]
        let before = todayCount()

        // 1. a canned line lands
        let added = await service(both, pick: editLink.id).add("Ring the dentist back")
        check("canned", added.landed != nil && todayCount() == before + 1,
              "outcome=\(added.label) today=\(todayCount()) was=\(before)")

        // 2. an empty one adds nothing
        let after = todayCount()
        let empty = await service(both, pick: editLink.id).add("   \n  ")
        check("empty", empty == .nothingSaid && todayCount() == after,
              "outcome=\(empty.label) today=\(todayCount()) unchanged=\(todayCount() == after)")

        // 3. a view-only list is refused before the document is touched
        let refused = await service(both, pick: viewLink.id).add("Should not land")
        if case .viewOnly = refused {
            check("view-only", todayCount() == after, "outcome=\(refused.label) today=\(todayCount())")
        } else {
            check("view-only", false, "outcome=\(refused.label)")
        }

        // 4. no list selected at all
        let none = await service([], pick: nil).add("Nowhere to put this")
        check("no-list", none == .noList, "outcome=\(none.label)")

        // 5. Undo puts the count back, and leaves a tombstone rather than a hole
        if let line = added.landed {
            let undone = await service(both, pick: editLink.id).undo(line)
            let back = todayCount()
            let tomb = store.load(editLink.id)?.doc.items[line.itemId]?.objectValue?.truthy("deleted") ?? false
            check("undo", undone && back == before && tomb,
                  "today=\(back) was=\(before) tombstoned=\(tomb)")
        } else {
            check("undo", false, "nothing to undo")
        }

        print("[tfive] add self-test: end pass=\(passed)/\(checked)")
    }
}
#else
@MainActor
enum AddSelfTest {
    static func runIfAsked() async {}
}
#endif
