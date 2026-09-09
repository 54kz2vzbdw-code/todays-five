// AddFlowView.swift — the add control, the confirmation, and five seconds of Undo. It is a row on
// Today now, not a sheet, and that is the fix.
//
// ============================================================================================
// WHAT PHASE 5 CHANGED, AND WHY IT IS NOT A BET ON ONE DIAGNOSIS
// ============================================================================================
//
// On a real Apple Watch running 1.12 (216), tapping the `+` lit the system microphone and **changed
// nothing on screen**. Three explanations fit that equally well from outside: the WatchKit controller
// was presented and renders somewhere nobody can see; it was never presented; or it was presented and
// its completion never came. The project cannot test on a wrist, so a fix that picks one of the three
// is a fix that may ship broken a second time.
//
// So every change here is right under all three of them:
//
//   1. **The journey collapsed from three taps to one.** Phase 3's `+` was a `Button` on Today that set
//      `showAdd = true`, which opened a `.sheet`, which contained a *second* button, and only that one
//      asked for input — a WatchKit modal raised from underneath a SwiftUI presentation. This view is
//      now a **row in Today's own list** and the control on it *is* the input. There is no sheet left
//      to suspect, which is better than reasoning about whether the sheet was the problem.
//   2. **`TextFieldLink` is the path and WatchKit is the seam behind it**, the reverse of Phase 3. See
//      `WatchDictation` for the whole argument; the short form is that `TextFieldLink`'s screen is
//      presented by the system from the app's own hierarchy, cannot force dictation (nothing on watchOS
//      can) and cannot be invisible, and invisible is the failure being fixed.
//   3. **`working` is no longer a latch.** It was set before presenting and cleared only inside the
//      completion, so a completion that never arrived disabled the control for the life of the sheet
//      with no sentence. The `TextFieldLink` path has no such gate at all — nothing here presents
//      anything, so there is nothing to gate — and the WatchKit path gates on a `WatchDictation.Gate`,
//      which answers once and releases on a deadline with a sentence the person can read.
//   4. **One primary action.** Phase 3 had `.handGestureShortcut(.primaryAction)` on *both* Today's `+`
//      and the button inside the sheet, which is two primary actions on one screen and a defect on its
//      own: Double Tap had no unambiguous target. There is now exactly one, on the control that *is*
//      the add. `RootView.content` keeps `.scrollInputBehavior(.disabled, for: .handGestureShortcut)`
//      on the `TabView`, which still covers this list, so Double Tap activates rather than scrolls.
//   5. **Nothing is presented during a transition any more.** `beginImmediately` is gone. The Add
//      complication's `todaysfive://add` used to open the sheet and fire the presentation from its
//      `.task` — during the sheet's entry animation, which is a classic swallowed presentation. And a
//      `TextFieldLink` **cannot be triggered from code**: it is a button a person presses. So the face
//      path is honest about what it costs: the complication opens the app on Today, and the add control
//      is the row under the count, already on screen. **One tap.**
//
// **The confirmation and the Undo are Phase 3's, unchanged.** They were never the bug, and they are the
// half of this flow a simulator could prove; what moved is only where they are drawn.
//
// ============================================================================================
// WHAT IT CAN SAY ABOUT ITSELF
// ============================================================================================
//
// `WatchDiagnostics` rows, in the order the path runs: `add.tap` (the control was pressed, written by
// `AddPressStyle` — see there for why a style and not a gesture), `add.fieldlink` (which control this
// launch offers), `add.heard` with the character count and which path it came from, `add.heard.nil`
// (backed out), `add.timeout` with the milliseconds waited. The core's own three rows — `add.service`,
// `add.landed`, `add.refused` — are written in `AddToTodaysFive.swift`, because all four ways in pass
// through there and only one of them passes through here.
//
// **Isolation.** A SwiftUI `View` and a `@MainActor @Observable` coordinator. The add itself is `async`
// and non-isolated, so the work happens off the main actor and only the answer comes back to it.
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

    /// A line landed, or an Undo took one away. The Watch's model hangs a pull off this so whatever is
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
            // The same tap the check-off gets. It belongs in `WatchHaptics` next to the other four
            // moments — this call site is one line and is meant to move.
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

// MARK: - pressed

/// How the add control reports that it was pressed.
///
/// **A style, deliberately, and not a gesture.** A `TextFieldLink` has a label and an `onSubmit` and no
/// action closure, so there is no sanctioned place to learn that it was *pressed* — only that it came
/// back with something. A `.simultaneousGesture` or an `.onTapGesture` would be a second recogniser
/// competing with the control's own, and the one thing this round may not risk is shipping a control
/// that looks right and does not activate — on a wrist, with no way to test it here. A `ButtonStyle`
/// cannot interfere: it is handed `configuration.isPressed` and asked to draw, and if watchOS ever
/// ignored it for `TextFieldLink` the cost is an `add.tap` row that stays at zero, never a dead control.
///
/// It also draws the row, in the plain style the rest of Today uses — `TodayRow` is `.buttonStyle(.plain)`
/// for the same reason: a `.bordered` tint inside a carousel platter is a button drawn on a button.
private struct AddPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.55 : 1)
            .onChange(of: configuration.isPressed) { _, pressed in
                guard pressed else { return }
                WatchDiagnostics.shared.record(WatchDiagnostics.Code.addTap)
            }
    }
}

// MARK: - the view

/// The add control, and everything that happens after it. It is one row in Today's list.
struct AddFlowView: View {

    /// Whether this device may write to the list on screen — `WatchStore.canEdit`, passed in rather
    /// than read, because this view deliberately holds no reference to the Watch's model: the same add
    /// has to work from an App Intent that ran while the app was closed, so the *path* starts from the
    /// vault and the *control* is the only thing that needs to know about the list on screen.
    var canAdd = true

    /// Always-On. A confirmation that is about to disappear anyway should not animate or count down on
    /// a dimmed screen, and an Undo nobody can reach is chrome.
    @Environment(\.isLuminanceReduced) private var dimmed

    /// The kit. Every colour and every face on this row comes from here.
    @Environment(\.watchTheme) private var theme

    /// How many adds are in flight. A **counter**, not a flag, and nothing is disabled by it: it exists
    /// only so the person is not looking at a row that appears to have done nothing while a push is in
    /// the air. Phase 3's one-way latch is exactly what a flag here would grow back into.
    @State private var inFlight = 0

    /// The WatchKit seam's gate. Only that path sets it, only `WatchDictation.Gate` clears it, and it
    /// is released on a deadline whatever the presentation does.
    @State private var presenting = false

    private var coordinator: AddCoordinator { AddCoordinator.shared }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            addControl
            if inFlight > 0, coordinator.pending == nil {
                Text("Adding…")
                    .font(theme.ui(12, .caption))
                    .foregroundStyle(theme.muted)
            }
            if let pending = coordinator.pending {
                confirmation(pending)
                    .transition(dimmed ? .identity : .opacity)
            }
        }
        .animation(dimmed ? nil : .easeOut(duration: 0.16), value: coordinator.pending)
        // Which control this launch offers, once per process. Not per appearance: this row appears every
        // time Today comes back, and sixty trace entries is four or five passes through the add flow —
        // a row repeated on every wrist raise would push the thing Price came to look at off the end.
        .onAppear(perform: Self.announceInput)
        // `AddSelfTest` is NOT run from here. Phase 3 wired it to this view's `.task` and it never ran,
        // because this view only ever existed inside a sheet nothing opened — the log was two lines
        // long. It runs from the app's root, where the app always is.
    }

    // ---------------------------------------------------------------- the control

    @ViewBuilder
    private var addControl: some View {
        switch WatchDictation.preferred {
        case .fieldLink:
            // The path. The system raises its own full-screen input from the app's own presentation
            // hierarchy, and on a real wrist that screen is where dictation lives. It cannot be asked
            // for dictation — no API on watchOS can ask — and it cannot be invisible.
            TextFieldLink(prompt: Text(verbatim: "Add a line")) {
                label
            } onSubmit: { text in
                heard(text, path: Self.pathFieldLink)
            }
            .buttonStyle(AddPressStyle())
            .disabled(!canAdd)
            // The app's one primary action. On a Series 9 or an Ultra 2 this is what a pinch reaches.
            // There is no way to inject the gesture on a simulator, so it is written and left
            // unverified — and whether a `TextFieldLink` honours it is itself a wrist item.
            .handGestureShortcut(.primaryAction, isEnabled: canAdd)
        case .watchKit:
            // The seam. Reachable by `-TFAddWatchKit` and by `WatchDictation.prefer`, and by nothing a
            // person can press on a Release wrist — said plainly in `WatchDictation.preferred`.
            Button(action: begin) { label }
                .buttonStyle(AddPressStyle())
                .disabled(!canAdd || presenting)
                .handGestureShortcut(.primaryAction, isEnabled: canAdd && !presenting)
        }
    }

    /// The row, drawn the way Today's other rows are drawn.
    private var label: some View {
        HStack(spacing: 8) {
            Image(systemName: "plus.circle.fill")
                .foregroundStyle(canAdd ? theme.accent : theme.dim)
            Text(verbatim: "Add")
                .font(theme.ui(15, .body))
                .foregroundStyle(canAdd ? theme.text : theme.muted)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
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

    /// `b` on an `add.heard` row: which control the text came back through.
    static let pathFieldLink = 0
    static let pathWatchKit = 1

    /// Announced once per process, so a trace says which control the wrist was offered without anybody
    /// having to ask which build it was. `a` is whether the WatchKit seam *would* have had a presenter —
    /// which is the one thing Phase 3 measured and the one thing it over-read, kept here so a wrist
    /// report can finally put the two side by side.
    @MainActor
    private static func announceInput() {
        guard !announced else { return }
        announced = true
        switch WatchDictation.preferred {
        case .fieldLink:
            WatchDiagnostics.shared.record(WatchDiagnostics.Code.addFieldLink,
                                           WatchDictation.canPresentController ? 1 : 0)
        case .watchKit:
            WatchDiagnostics.shared.record(WatchDiagnostics.Code.addFieldLink, 0, 1)
        }
    }

    @MainActor private static var announced = false

    /// The WatchKit seam. Present, and be released either way.
    private func begin() {
        guard canAdd, !presenting else { return }
        presenting = true
        WatchDictation.present { answer in
            // Unconditionally, before anything else is decided. This one line is Phase 3's latch.
            presenting = false
            switch answer {
            case let .text(text):
                heard(text, path: Self.pathWatchKit)
            case .cancelled:
                // Backing out is answered with silence: "never mind" does not deserve a sentence.
                WatchDiagnostics.shared.record(WatchDiagnostics.Code.addHeardNothing)
            case .noPresenter:
                // `WatchDictation` recorded `add.nopresenter`; there is nothing to tell the person
                // that a control which did not open has not already told them.
                break
            case let .timedOut(ms):
                WatchDiagnostics.shared.record(WatchDiagnostics.Code.addTimedOut, ms)
                coordinator.note(.inputTimedOut)
            }
        }
    }

    /// Something came back. An empty string goes to the core like any other text, so the answer to "it
    /// heard nothing" comes from the one place that decides an empty line is not a line.
    private func heard(_ text: String, path: Int) {
        WatchDiagnostics.shared.record(WatchDiagnostics.Code.addHeard, text.count, path)
        submit(text)
    }

    private func submit(_ text: String) {
        inFlight += 1
        Task {
            let outcome = await AddService.live().add(text)
            inFlight = max(0, inFlight - 1)
            coordinator.note(outcome)
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
/// It runs the **real** `AddService` — the same `add` and the same `undo` the control and the intent
/// call — against a `MemoryTransport` and a scratch directory, so nothing spends from the server's
/// create limit, nothing touches the Keychain, and nothing needs a phone.
///
/// Phase 5 added three things to it and they are the three things this round could actually check
/// without a wrist:
///
///   * **the trace is written, and by the right call.** The five answers were already covered; what was
///     not is whether `WatchDiagnostics` rows land on the core's path at all. The test counts rows
///     before and after and asserts the deltas, so a trace that silently stopped writing fails here
///     rather than on a wrist;
///   * **the ordinals are the table.** `add.refused` carries a number and the wrist screen prints the
///     number, so the mapping in `AddToTodaysFive.swift`'s header is load-bearing documentation. It is
///     asserted, because documentation that nothing checks is documentation that drifts;
///   * **the gate releases.** `WatchDictation.Gate` is exercised with a 50 ms deadline and with a late
///     completion, which is the whole of Phase 3's one-way latch, checked **without presenting
///     anything** — a keyboard raised on a watch simulator cannot be dismissed, because nothing here
///     can tap.
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

        // Which control a wrist is offered, and the sentence Phase 3's results needed and did not have.
        print("[tfive] add self-test: control=\(WatchDictation.preferred.rawValue)"
            + " visibleInterfaceController="
            + (WatchDictation.canPresentController ? "present" : "nil")
            + " — which says a branch would be taken and nothing about whether it renders")
        check("control", WatchDictation.preferred == .fieldLink
              || ProcessInfo.processInfo.arguments.contains("-TFAddWatchKit"),
              "TextFieldLink is the default path since Phase 5")

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

        let trace = WatchDiagnostics.shared
        func rows(_ code: StaticString) -> Int { trace.count(code) }
        let service0 = rows(WatchDiagnostics.Code.addService)
        let landed0 = rows(WatchDiagnostics.Code.addLanded)
        let refused0 = rows(WatchDiagnostics.Code.addRefused)
        let undone0 = rows(WatchDiagnostics.Code.addUndone)

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

        // 6. the trace was written, by the core's own path, for every one of those
        let dService = rows(WatchDiagnostics.Code.addService) - service0
        let dLanded = rows(WatchDiagnostics.Code.addLanded) - landed0
        let dRefused = rows(WatchDiagnostics.Code.addRefused) - refused0
        let dUndone = rows(WatchDiagnostics.Code.addUndone) - undone0
        check("trace", dService == 4 && dLanded == 1 && dRefused == 3 && dUndone == 1,
              "service=\(dService)/4 landed=\(dLanded)/1 refused=\(dRefused)/3 undone=\(dUndone)/1")

        // 7. the ordinals on `add.refused` are the table in AddToTodaysFive.swift's header, which is
        //    what a reader of a wrist screenshot decodes the digit with
        let table: [(AddOutcome, Int)] = [
            (.added(AddedLine(text: "", itemId: "", listId: "", listName: "", queued: false)), 0),
            (.nothingSaid, 1), (.noList, 2), (.viewOnly(listName: ""), 3),
            (.listGone(listName: ""), 4), (.couldNotOpen, 5), (.inputTimedOut, 6)
        ]
        let ordinalsOk = table.allSatisfy { $0.0.outcomeCode == $0.1 }
        check("ordinals", ordinalsOk, "0..6 = " + table.map { "\($0.0.outcomeCode)" }.joined())

        // 8. the gate: it releases on a deadline, it reports the wait, and a late completion is dropped.
        //    This is Phase 3's one-way latch, and it is checked without presenting anything.
        var answers: [WatchDictation.Answer] = []
        let gate = WatchDictation.Gate(timeout: .milliseconds(50)) { answers.append($0) }
        gate.arm()
        try? await Task.sleep(for: .milliseconds(250))
        let timedOut: Bool
        if case .timedOut = answers.first { timedOut = true } else { timedOut = false }
        gate.finish(.text("a late completion nobody is waiting for"))
        check("gate", timedOut && answers.count == 1 && gate.isClosed,
              "answers=\(answers.count) timedOut=\(timedOut) closed=\(gate.isClosed)")

        // 9. and the other direction: an answer that arrives first cancels the deadline
        var early: [WatchDictation.Answer] = []
        let quick = WatchDictation.Gate(timeout: .milliseconds(50)) { early.append($0) }
        quick.arm()
        quick.finish(.cancelled)
        try? await Task.sleep(for: .milliseconds(200))
        check("gate-early", early == [.cancelled], "answers=\(early.count)")

        print("[tfive] add self-test: end pass=\(passed)/\(checked)")
    }
}
#else
@MainActor
enum AddSelfTest {
    static func runIfAsked() async {}
}
#endif
