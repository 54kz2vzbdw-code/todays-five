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
//   3. **`working` is no longer a latch — and on the shipping path that is because the gate is gone,
//      not because it is better.** Phase 3 set `working` before presenting and cleared it only inside
//      the completion, so a completion that never arrived disabled the control for the life of the
//      sheet with no sentence. The `TextFieldLink` path has **no gate at all**: nothing here presents
//      anything, so there is nothing to latch. `WatchDictation.Gate` — the deadline, and
//      `AddOutcome.inputTimedOut` — repairs the *seam*, and the seam is not reachable by any tap on a
//      Release wrist (`WatchDictation.preferred`). So the gate is real code with a real test and it is
//      **not** part of what a wrist will exercise; saying otherwise would be this round's own mistake
//      repeated. It earns its place as the thing that is already correct if the `.watchKit` arm ever
//      has to be turned on.
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
//      is the row under the count. It is the row under the count *when the list is at the top*, which a
//      resumed app need not be — so `onOpenURL` asks Today to scroll there (`AddCoordinator.focusTick`,
//      `TodayView.addRow`). **One tap, once the list is where that call puts it**, and whether the call
//      moves a carousel `List` is on the unverified list rather than asserted here.
//
// **The confirmation and the Undo are Phase 3's, and moving them cost one real bug.** The five-second
// window was a `.task` on the confirmation view, which was safe inside a sheet and is not safe inside a
// list row that Always-On tears down; an independent review found it and `AddCoordinator.startWindow`
// carries the whole story. The window is the coordinator's now. What a simulator could prove about the
// sentences and the tombstone is unchanged.
//
// ============================================================================================
// WHAT IT CAN SAY ABOUT ITSELF — AND WHICH ROWS A RELEASE WRIST CAN NEVER SHOW
// ============================================================================================
//
// `WatchDiagnostics` rows, in the order the path runs: `add.style` (the custom `ButtonStyle` was asked
// to draw — once per process), `add.tap` (the control was pressed, written by `AddPressStyle` — see
// there for why a style and not a gesture, and for what the pair of rows can and cannot separate),
// `add.fieldlink` (which control this launch offers), `add.heard` with the character count and which
// path it came from, `add.heard.nil` (backed out). The core's own three rows — `add.service`,
// `add.landed`, `add.refused` — are written in `AddToTodaysFive.swift`, because all four ways in pass
// through there and only one of them passes through here.
//
// **Four of the vocabulary's rows are structurally zero on a Release wrist, and a reader who does not
// know that will file a bug about them.** `add.present`, `add.presented`, `add.nopresenter` and
// `add.timeout` are all written by `WatchDictation.present`, which is reached only from `begin()`, which
// is only in the `.watchKit` arm of `addControl`, which `WatchDictation.preferred` never selects unless
// something wrote `tf/app/watch/addinput` — and nothing in a shipping build does. The Diagnostics
// screen's `presented` and `timed out` lines therefore read 0 on a healthy wrist. That screen is the
// orchestrator's file; the fix for its wording is in this round's `patchSpec` rather than here.
//
// On the shipping path the instrumented span is `add.style` → `add.tap` → `add.heard` → `add.service` →
// `add.landed`/`add.refused`. Between the press and the submit there is **nothing**, because there is no
// callback of ours in between — the system owns that screen. That gap is exactly where the wrist's
// failure lives, and the honest statement is that this trace brackets it rather than covers it.
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
        /// When it was announced. The window is *also* measured against this, not only slept through —
        /// see `startWindow`.
        let at: Date

        /// Whether the five seconds are still running, as wall-clock arithmetic rather than as a
        /// promise a sleeping task kept.
        func isLive(_ now: Date = Date()) -> Bool {
            now.timeIntervalSince(at) < AddCoordinator.undoWindowSeconds
        }
    }

    private(set) var pending: Pending?

    /// Bumped when something outside Today asks for the add control to be **on screen**: today that is
    /// only the Add complication's `todaysfive://add`. `TodayView` watches it and scrolls its list to
    /// the top. See `TodayView.addRow` for why that is needed and what it is worth.
    private(set) var focusTick = 0

    /// A line landed, or an Undo took one away. The Watch's model hangs a pull off this so whatever is
    /// on screen catches up; SwiftUI does not need it, since `pending` is observed.
    var onChange: (@MainActor () -> Void)?

    private var serial = 0

    /// The five seconds, held here rather than by a view. See `startWindow`.
    private var window: Task<Void, Never>?

    /// How long the Undo stays. The web's own undo toast is five seconds and this is the same five.
    /// One number, two types, because the window is both slept through and arithmetic.
    ///
    /// `nonisolated` because `Pending.isLive` reads it and a nested struct is not on this actor — an
    /// immutable `TimeInterval` is `Sendable`, so there is nothing to protect.
    nonisolated static let undoWindowSeconds: TimeInterval = 5
    nonisolated static var undoWindow: Duration { .seconds(undoWindowSeconds) }

    private init() {}

    /// Announce an outcome: the haptic, the sentence, and the window.
    func note(_ outcome: AddOutcome) {
        serial += 1
        pending = Pending(id: serial, outcome: outcome, at: Date())
        startWindow(for: serial)
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

    /// The five seconds, owned by the coordinator.
    ///
    /// **This is Phase 5 repairing a Phase 5 change, and an independent review caught it.** The
    /// countdown used to be a `.task(id: pending.id)` on the confirmation view, which was right for as
    /// long as `AddFlowView` lived inside `.sheet(isPresented: $showAdd)`: a presented sheet stays
    /// mounted when `RootView.content` switches branches, so the five seconds always ran out. It is a
    /// row in Today's list now, and `content` is an `if/else` ViewBuilder — `EmptyStateView`, else
    /// `AlwaysOnTodayView` when `isLuminanceReduced`, else the `TabView`. Lowering the wrist inside
    /// five seconds, which is the ordinary gesture after adding a line, swaps the branch, tears the row
    /// down and cancels the task with `pending` still set. Raise the wrist an hour later and the row
    /// drew a *live* Undo for a line added an hour ago, and tapping it tombstoned that line.
    ///
    /// An App Intent is the same bug from the other end: Siri's add calls `note` with no `AddFlowView`
    /// anywhere, so nothing ever started the window at all.
    ///
    /// A `Task` on the singleton is not cancelled by a view going away. It is still not a clock — a
    /// watch app is suspended within seconds of a wrist drop and what the runtime does with the
    /// remainder of a `Task.sleep` across that is not something any instrument here can measure — so
    /// `Pending.isLive` is checked as well, by the view each time it draws and by `sweepExpired` each
    /// time the row comes back. Belt and braces, because the failure this replaces was silent.
    private func startWindow(for id: Int) {
        window?.cancel()
        window = Task { [weak self] in
            try? await Task.sleep(for: Self.undoWindow)
            guard !Task.isCancelled else { return }
            self?.dismiss(id)
        }
    }

    /// The five seconds are up, or the person pressed Undo, or another add replaced this one.
    func dismiss(_ id: Int) {
        guard pending?.id == id else { return }
        pending = nil
        window?.cancel()
        window = nil
    }

    /// Drop a confirmation whose five seconds ran out while nothing was on screen to count them.
    /// Called when the add row appears; cheap, and a no-op in the ordinary case.
    func sweepExpired() {
        guard let pending, !pending.isLive() else { return }
        dismiss(pending.id)
    }

    /// The line has been taken back off the list.
    func noteUndone() {
        pending = nil
        window?.cancel()
        window = nil
        WKInterfaceDevice.current().play(.click)
        onChange?()
    }

    /// The Add complication arrived. Not a presentation — see `RootView.onOpenURL`.
    func requestFocus() {
        focusTick += 1
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
///
/// **`add.style`, and what a review made it for.** `add.tap` is the only row the shipping path writes
/// before `onSubmit`, and it comes from `configuration.isPressed` — so if that does not toggle for a
/// `TextFieldLink`, a trace reading `asked 0` cannot be told apart from a launch where nobody pressed
/// anything. This `.onAppear` is the separate, weaker question asked separately: it fires only if
/// watchOS actually called `makeBody` and put the result in the view tree, which is the same as saying
/// the custom style is **honoured**. Once per process, so the row costs one entry of the sixty.
///
/// Reading the two together: `add.style 0` means the control never drew at all; `add.style 1` with
/// `asked 0` narrows it to "the style draws but `isPressed` never went true, **or** it was never
/// pressed" — and those two are separated by *looking*, not by the trace: a press that reaches this
/// style fades the row to 0.55 while the finger is down.
private struct AddPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.55 : 1)
            .onChange(of: configuration.isPressed) { _, pressed in
                guard pressed else { return }
                WatchDiagnostics.shared.record(WatchDiagnostics.Code.addTap)
            }
            .onAppear {
                guard AddStyleWitness.shared.firstTime() else { return }
                WatchDiagnostics.shared.record(WatchDiagnostics.Code.addStyle)
            }
    }
}

/// One bit, once per process, for `add.style`.
///
/// A `final class` behind a lock rather than a `static var`, because `ButtonStyle.makeBody` and the
/// `onAppear` it returns are not main-actor-isolated and this target builds with
/// `SWIFT_STRICT_CONCURRENCY = complete`: a mutable global reachable from there does not compile, and
/// `nonisolated(unsafe)` would be a promise rather than a mechanism. Same shape as `WatchDiagnostics`
/// itself, for the same reason.
private final class AddStyleWitness: @unchecked Sendable {
    static let shared = AddStyleWitness()
    private let lock = NSLock()
    private var seen = false

    /// True exactly once.
    func firstTime() -> Bool {
        lock.lock(); defer { lock.unlock() }
        if seen { return false }
        seen = true
        return true
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
            // `isLive` as well as `pending != nil`: the countdown is the coordinator's `Task` and the
            // app is suspended when the wrist drops, so a resumed row must not redraw a five-second
            // Undo for something added an hour ago. The task is what normally clears it; this is what
            // makes the stale case impossible rather than unlikely.
            if let pending = coordinator.pending, pending.isLive() {
                confirmation(pending)
                    .transition(dimmed ? .identity : .opacity)
            }
        }
        .animation(dimmed ? nil : .easeOut(duration: 0.16), value: coordinator.pending)
        // Which control this launch offers, once per process. Not per appearance: this row appears every
        // time Today comes back, and sixty trace entries is four or five passes through the add flow —
        // a row repeated on every wrist raise would push the thing Price came to look at off the end.
        .onAppear(perform: Self.announceInput)
        // And actually clear anything that expired while no view was counting.
        .onAppear { coordinator.sweepExpired() }
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
            .doubleTapPrimaryAction(isEnabled: canAdd)
        case .watchKit:
            // The seam. Reachable by `-TFAddWatchKit` and by `WatchDictation.prefer`, and by nothing a
            // person can press on a Release wrist — said plainly in `WatchDictation.preferred`.
            Button(action: begin) { label }
                .buttonStyle(AddPressStyle())
                .disabled(!canAdd || presenting)
                .doubleTapPrimaryAction(isEnabled: canAdd && !presenting)
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
        // **No timer here.** It was a `.task(id: pending.id)` on this view and that is the bug
        // `AddCoordinator.startWindow` documents: this row is torn down every time the wrist drops,
        // which cancelled the five seconds and left the confirmation pending forever. The window is
        // the coordinator's now, keyed on the same serial, so a second add still restarts it rather
        // than inheriting the remainder of the first one's.
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

    /// The add itself is deliberately **not** view-scoped: an unstructured `Task`, not a `.task`
    /// modifier, so a wrist that drops while the push is in the air still lands the line and still
    /// announces it — the coordinator is a singleton and outlives this row. Only `inFlight`, which
    /// draws "Adding…", belongs to the view, and losing that to a teardown costs a label and no data.
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
///     can tap. Worth knowing while reading the tally: that gate is not on the path a wrist takes, so
///     this is a check on a seam, not on the feature;
///   * **the five-second Undo window is the coordinator's.** Checks 10 and 10b, added after a review
///     found that the window used to be a view's `.task` and died with the view;
///   * **the ring caps, and keeps the newest.** Added last and rewritten after a review found the first
///     version of it could not fail — see check 11.
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

        // The trace is a **ring of `WatchDiagnostics.limit` entries**, and that is why this is a clear
        // followed by absolute counts rather than the before-and-after delta it was first written as.
        //
        // Measured, because it is exactly what this round is not allowed to assume: on a watch simulator
        // whose trace was already full — 60 of 60, read out of the App Group's own plist — the delta for
        // **every** code came back 0 and this check failed while the rows it was counting were printing
        // on the console one line above it. A full ring evicts one old row per new row, so a run that
        // adds four `add.service` rows to a ring already holding four of them measures a change of
        // nothing. The first run after an install would have passed; the fifth could not. That is an
        // instrument reporting on its own blind spot, which is the family of bug this plan opens with,
        // so it is fixed rather than tuned.
        //
        // Clearing is safe **here and nowhere else**: `-TFAddSelfTest` is `#if DEBUG` and a TestFlight
        // build takes no launch arguments, so this line can never run on the wrist whose trace matters.
        // It says so on the console regardless, because somebody watching a simulator should know why
        // the Diagnostics screen emptied underneath them.
        //
        // **The consequence for a wrist is real and is not this test's to fix:** the Diagnostics verdict
        // counts what the last `limit` events still hold, not everything that ever happened. Pressing
        // Clear before a deliberate attempt is what makes those numbers mean what they look like.
        let trace = WatchDiagnostics.shared
        func rows(_ code: StaticString) -> Int { trace.count(code) }
        print("[tfive] add self-test: clearing the trace first — it is a \(WatchDiagnostics.limit)-entry"
            + " ring, and a delta measured across a full one is always zero")
        trace.clear()

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

        // 6. the trace was written, by the core's own path, for every one of those. Absolute counts off
        //    a ring cleared a moment ago: four adds were asked for, one landed, three were refused, one
        //    was undone. It is the check that says `WatchDiagnostics` is wired to `AddService` at all,
        //    which is the one half of this round's instrument a simulator can confirm.
        let nService = rows(WatchDiagnostics.Code.addService)
        let nLanded = rows(WatchDiagnostics.Code.addLanded)
        let nRefused = rows(WatchDiagnostics.Code.addRefused)
        let nUndone = rows(WatchDiagnostics.Code.addUndone)
        check("trace", nService == 4 && nLanded == 1 && nRefused == 3 && nUndone == 1,
              "service=\(nService)/4 landed=\(nLanded)/1 refused=\(nRefused)/3 undone=\(nUndone)/1")

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

        // 10. the five-second window runs in the coordinator, not in a view.
        //
        //     What this measures and what it does not: it shows that `note` starts a window and that the
        //     window clears `pending` on its own. It cannot show that no *view* cleared it, because
        //     nothing here can unmount a view — `simctl` cannot tap a watch simulator. That half is a
        //     reading: `confirmation(_:)` has no `.task` in it any more, so the coordinator's `Task` is
        //     the only timer left in the flow. The bug this replaces was a cancelled view task, so the
        //     check is still worth its five seconds.
        //
        //     `.nothingSaid` rather than an `added`, so no haptic fires and no Undo is offered for a line
        //     that does not exist. It does put one sentence on Today for five seconds during a self-test
        //     launch, which is a thing to know before photographing that screen.
        let co = AddCoordinator.shared
        co.note(.nothingSaid)
        let opened = co.pending != nil
        try? await Task.sleep(for: .seconds(AddCoordinator.undoWindowSeconds + 0.5))
        check("window", opened && co.pending == nil,
              "opened=\(opened) cleared=\(co.pending == nil) after=\(AddCoordinator.undoWindowSeconds)s")

        // 10b. and the wall-clock half of it, which is what survives a suspended process: a pending
        //      older than the window is not live, whatever happened to the task that was sleeping on it.
        let fresh = AddCoordinator.Pending(id: -1, outcome: .nothingSaid, at: Date())
        let old = AddCoordinator.Pending(id: -2, outcome: .nothingSaid,
                                         at: Date().addingTimeInterval(-600))
        check("window-stale", fresh.isLive() && !old.isLive(),
              "fresh=\(fresh.isLive()) ten-minutes-old=\(old.isLive())")

        // 11. the ring actually caps, and keeps the newest.
        //
        //     **This check was rewritten after a review, and the first version of it is worth keeping in
        //     the record as the thing it was.** It asserted `all.count <= limit && all.count >= nService`
        //     against a trace holding about eleven rows with a cap of sixty — 11 ≤ 60 and 11 ≥ 4, both
        //     true by construction. Deleting the `removeFirst` line from `WatchDiagnostics.record`
        //     altogether left it printing `ok`. A cap can only be checked by going past it, so this
        //     writes `limit + 5` rows and then asks two questions: is the count exactly `limit`, and is
        //     what survived the **newest** end. Five of one code followed by `limit` of another answers
        //     both — if eviction took from the wrong end, the five are what is left.
        //
        //     It runs last and clears afterwards, because it floods the ring on purpose and would
        //     otherwise evict the rows checks 6 and 7 are counting. The console carries `limit + 5` trace
        //     lines while it does; that is the check being visible rather than a fault.
        trace.clear()
        let cap = WatchDiagnostics.limit
        for _ in 0..<5 { trace.record(WatchDiagnostics.Code.addUndone) }
        for _ in 0..<cap { trace.record(WatchDiagnostics.Code.addService) }
        let held = trace.all
        let evictedOldest = rows(WatchDiagnostics.Code.addUndone) == 0
            && rows(WatchDiagnostics.Code.addService) == cap
        check("trace-ring", held.count == cap && evictedOldest,
              "wrote=\(cap + 5) entries=\(held.count) cap=\(cap) oldest-evicted=\(evictedOldest)")
        trace.clear()
        print("[tfive] add self-test: the trace is left empty — the ring check filled it on purpose")

        print("[tfive] add self-test: end pass=\(passed)/\(checked)")
    }
}
#else
@MainActor
enum AddSelfTest {
    static func runIfAsked() async {}
}
#endif
