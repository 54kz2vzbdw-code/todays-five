// WatchDiagnostics.swift — a trace that survives Release, because the wrist is where the bugs are.
//
// ============================================================================================
// WHY THIS FILE EXISTS
// ============================================================================================
//
// Every diagnostic this project has built is `#if DEBUG` and reached by a launch argument:
// `-TFSelfTest`, `-TFWatchSelfTest`, `-TFAddSelfTest`, `-TFFontSelfTest`, `-TFConfettiSelfTest`,
// `-TFFaceProbe`, `-TFKit`, `-TFShow`, `-TFThemeSet`, `-TFFinale`, `-TFFinaleHold`. Every one of them
// is therefore **absent from the build that is on a real wrist**, because a TestFlight build is
// Release and takes no launch arguments.
//
// That is how Phase 5's four findings were possible. Add-by-voice looked present for a whole round and
// did nothing, and nothing in the project could have said so: the only instrument pointed at it ran on
// a machine with **no microphone**, printed that a *branch* would be taken, and that line was read as
// the feature working. A wrist had no way to disagree.
//
// So this is the one instrument that ships. The app writes a bounded trace on the paths that matter
// and there is a screen that shows it, behind the long press on the count. Price taps, reads, and
// reports — no Xcode, no cable, no console, no Release/Debug difference.
//
// ============================================================================================
// THE PRIVACY RULE IS THE TYPE, NOT THE CALL SITES
// ============================================================================================
//
// `COMPATIBILITY.md` §8 and every plan since Phase 2: no link, fragment, id, URL or line of anybody's
// list reaches a log, a screenshot, a screenshot filename, a commit or a crash report. Every `print`
// in this project obeys that by *convention* — each call site was written to pass a fixed string and
// counts. A convention is a thing that holds until somebody is in a hurry.
//
// Here it is structural. `record` takes a **`StaticString`**, which the compiler accepts only as a
// literal written in the source: it cannot be built from a variable, interpolated, concatenated or
// derived from input. The only runtime values that can reach a trace entry are two `Int`s. **There is
// no field in this type that can hold a secret**, so no call site can put one there and no screenshot
// of this screen can carry one out.
//
// A character count is not content — the phone has printed `id=22 chars` since Phase 2 and the
// snapshot has printed `nextLine=19 chars` since Phase 3 — and it is exactly what the add path needs:
// "the callback fired with 24 characters" and "the callback fired with nothing" are the two answers
// this round was built to tell apart.
//
// ============================================================================================
// WHERE IT LIVES, AND THE INTEGER THAT IS NOT AN EPOCH
// ============================================================================================
//
// In the App Group under `tf/app/watch/trace`, beside the kit keys. Two reasons it is not merely a
// property in memory:
//
//   * an **App Intent** — Siri's path — can run before the UI exists or after it is gone. A trace it
//     could not write to would be blind on the one way in that has no screen of its own;
//   * the screen is read *after* the failure, and a failure that takes the app down with it would take
//     an in-memory trace with it.
//
// **No timestamp here is an epoch.** Phase 4's integration found that a watchOS device is `arm64_32`
// and its `Int` is 32 bits, so `Int32.max` is 2,147,483,647 — and epoch milliseconds are about
// 1.76 × 10¹², three orders of magnitude past it. It would not be a runtime overflow a test might
// miss; it would not compile for the target, and only `xcodebuild archive` would ever say so. So an
// entry carries a **session number** and **milliseconds since that session's first entry**, both of
// which stay small, and the screen reads them as "this launch" and "how long after".
//
// Capped at `limit` entries, newest kept. `tf/app/` is the clients' prefix (COMPATIBILITY.md §5) and
// this is a client.
//
// **Isolation.** A `final class` behind an `NSLock`, `@unchecked Sendable`, because the writers are not
// all on one actor: `AddFlowView` is main-actor, `AddService` is a non-isolated `async` value doing its
// work off it, and a background refresh is neither.
import Foundation
import SwiftUI

#if os(watchOS)

/// The shipping trace. One line per event: a fixed code, up to two numbers, and when it happened.
final class WatchDiagnostics: @unchecked Sendable {

    static let shared = WatchDiagnostics()

    // ---------------------------------------------------------------- the vocabulary
    //
    // The codes are `static let`s rather than literals scattered across four files, for two reasons
    // and neither of them is tidiness. A shared vocabulary is what lets the **screen** compute a
    // verdict — "presented 3, heard 0" is the answer to this round's first question and it can only
    // be counted if the writer and the reader name the event the same way. And a `StaticString`
    // constant is still a `StaticString`: it can only ever have been written as a literal here, so
    // naming them centrally gives up none of the guarantee above.
    //
    // A track adding an event adds a case here. That is deliberate friction: an event worth tracing is
    // worth a line in the list a person reads.

    enum Code {
        // the add path — §1, and the reason this file exists
        /// The `+` (or Double Tap, or the complication) asked for input.
        static let addTap: StaticString = "add.tap"
        /// `WatchDictation.present` was reached. `a` is 1 when there was a controller to present from.
        static let addPresent: StaticString = "add.present"
        /// `presentTextInputController` returned without throwing — the controller is up, or believes
        /// it is. This firing with no `add.heard` after it is hypothesis (a) or (c); this *not* firing
        /// is hypothesis (b).
        static let addPresented: StaticString = "add.presented"
        /// `visibleInterfaceController` was nil, so there was nothing to present from.
        static let addNoPresenter: StaticString = "add.nopresenter"
        /// The `TextFieldLink` path was the one taken.
        static let addFieldLink: StaticString = "add.fieldlink"
        /// The callback fired. `a` is the character count; absent means the callback handed back nil,
        /// which is "never mind" and not a failure.
        static let addHeard: StaticString = "add.heard"
        static let addHeardNothing: StaticString = "add.heard.nil"
        /// No callback inside the window. `a` is how long was waited, in milliseconds.
        static let addTimedOut: StaticString = "add.timeout"
        /// The core was asked. `a` is the character count handed to it.
        static let addService: StaticString = "add.service"
        /// A line landed. `a` is its length after the core cleaned it, `b` is 1 when it is queued.
        static let addLanded: StaticString = "add.landed"
        /// The core or the service said no. `a` is an `AddOutcome` ordinal — see `outcomeCode`.
        static let addRefused: StaticString = "add.refused"
        static let addUndone: StaticString = "add.undone"
        /// The App Intent ran — Siri, the Action button, or Shortcuts.
        static let intentRan: StaticString = "intent.ran"
        /// The Add complication's `todaysfive://add` arrived: the app was opened *asking* for an add.
        ///
        /// Since Phase 5 that opens the app on Today and presents nothing — a `TextFieldLink` cannot be
        /// triggered from code, and a presentation fired during a transition is what a wrist saw fail.
        /// So this row followed by an `add.tap` is the face path working, and this row **alone** is the
        /// person arriving and not finding the control.
        static let addFromFace: StaticString = "add.face"

        // the picker — §2
        /// The title was pressed. **Its absence after a press is the finding.**
        static let titleTap: StaticString = "picker.title.tap"
        /// The Lists row in the long-press sheet was pressed.
        static let listsRowTap: StaticString = "picker.row.tap"
        /// The picker presented. `a` is how many lists it is offering.
        static let pickerShown: StaticString = "picker.shown"
        /// A different list was chosen. `a` is 1 when it is an edit link.
        static let listSelected: StaticString = "picker.selected"

        // the rest
        static let launched: StaticString = "app.launch"
        static let snapshotPublished: StaticString = "face.published"
    }

    /// How many entries are kept. Sixty is four or five passes through the add flow, which is about
    /// what a person reading this on a wrist can get through before the thing they came to look at
    /// scrolls off the end.
    static let limit = 60

    /// `tf/app/watch/…`, beside the kit keys. See `WatchThemeStore` for why the group rather than
    /// `.standard`: this has to be writable by an App Intent that is not the app's UI.
    private static let traceKey = "tf/app/watch/trace"
    private static let sessionKey = "tf/app/watch/trace/session"

    /// A day of milliseconds. An offset is clamped to it so a watch left awake cannot walk an `Int`
    /// anywhere interesting on a 32-bit target — 24.8 days of milliseconds is `Int32.max`, and a watch
    /// app is suspended seconds after the wrist drops, so this can never be reached. It is a fence
    /// rather than a behaviour.
    private static let dayMs = 86_400_000

    /// One event. Nothing in it is a `String` that came from outside the source.
    struct Entry: Equatable, Identifiable {
        /// Which launch. Entries from an earlier launch are kept and shown behind a divider, because
        /// "it did not happen this time either" is an answer.
        let session: Int
        /// Milliseconds after this session's first entry.
        let at: Int
        /// The literal written at the call site. Never built, never interpolated.
        let code: String
        /// Two numbers, or absent. A bool is 0 or 1.
        let a: Int?
        let b: Int?

        var id: String { "\(session).\(at).\(code).\(a ?? -1).\(b ?? -1)" }

        /// What the screen shows, and what a screenshot of it can carry: a code and numbers.
        var line: String {
            var s = code
            if let a { s += " \(a)" }
            if let b { s += " \(b)" }
            return s
        }

        var stamp: String { "+\(at)ms" }
    }

    private let lock = NSLock()
    private var entries: [Entry] = []
    private var origin: Date?
    private var session = 0
    private let defaults = UserDefaults(suiteName: AddService.appGroup)

    private init() {
        entries = Self.load(defaults)
        // The session number is claimed on the first `record` of a process rather than here, so a
        // launch that traces nothing does not burn one and the screen's "this launch" is never a
        // session with no rows in it.
        session = 0
    }

    /// The launch the newest entries belong to. 0 until something has been recorded this process.
    var currentSession: Int {
        lock.lock(); defer { lock.unlock() }
        return session
    }

    // ---------------------------------------------------------------- writing

    /// Record an event.
    ///
    /// `code` is a `StaticString` on purpose and it is the privacy guarantee: the compiler accepts
    /// only a literal, so nothing a person typed, dictated or pasted can reach it. Pass counts and
    /// lengths as `a` and `b`; pass a bool as 0 or 1.
    ///
    ///     WatchDiagnostics.shared.record("add.completion.text", chars)
    ///     WatchDiagnostics.shared.record("add.present", controller ? 1 : 0)
    func record(_ code: StaticString, _ a: Int? = nil, _ b: Int? = nil) {
        let now = Date()
        lock.lock()
        if session == 0 {
            let next = (defaults?.integer(forKey: Self.sessionKey) ?? 0) + 1
            // Wraps rather than grows. A session number is a label, not a quantity, and 9,999 launches
            // is more than this app will see before the next round.
            session = next > 9_999 ? 1 : next
            defaults?.set(session, forKey: Self.sessionKey)
        }
        if origin == nil { origin = now }
        let raw = Int(((now.timeIntervalSince(origin ?? now)) * 1000).rounded())
        let at = min(max(raw, 0), Self.dayMs)
        entries.append(Entry(session: session, at: at, code: code.description, a: a, b: b))
        if entries.count > Self.limit { entries.removeFirst(entries.count - Self.limit) }
        let snapshot = entries
        lock.unlock()
        Self.save(snapshot, to: defaults)
        #if DEBUG
        // The same line on the console, for the simulator. It obeys the project's logging rule for
        // the same structural reason the screen does, rather than by the call site remembering to.
        if let last = snapshot.last { print("[tfive] trace: \(last.stamp) \(last.line)") }
        #endif
    }

    // ---------------------------------------------------------------- reading

    var all: [Entry] {
        lock.lock(); defer { lock.unlock() }
        return entries
    }

    /// How many times a code has been seen, over every session the trace still holds. The screen's
    /// header uses it to answer "did the callback ever fire" without making anybody count rows.
    func count(_ code: StaticString) -> Int {
        let want = code.description
        lock.lock(); defer { lock.unlock() }
        return entries.filter { $0.code == want }.count
    }

    func clear() {
        lock.lock()
        entries = []
        origin = nil
        lock.unlock()
        defaults?.removeObject(forKey: Self.traceKey)
    }

    // ---------------------------------------------------------------- the plist shape
    //
    // Parallel arrays rather than an array of dictionaries: sixty small dictionaries is a lot of
    // objects for a watch to write on every event, and this shape is nobody's contract — no other
    // process reads it and no document names it — so it may be as dull as it likes. A count mismatch
    // between the arrays is read as "no trace" rather than patched up, because a half-read trace is
    // worse than an empty one.

    private static func load(_ defaults: UserDefaults?) -> [Entry] {
        guard let d = defaults,
              let raw = d.dictionary(forKey: traceKey),
              let sessions = raw["s"] as? [Int],
              let ats = raw["t"] as? [Int],
              let codes = raw["c"] as? [String],
              let first = raw["a"] as? [Int],
              let second = raw["b"] as? [Int],
              sessions.count == ats.count, sessions.count == codes.count,
              sessions.count == first.count, sessions.count == second.count
        else { return [] }
        return (0..<sessions.count).map { i in
            Entry(session: sessions[i], at: ats[i], code: codes[i],
                  a: first[i] == Int.min ? nil : first[i],
                  b: second[i] == Int.min ? nil : second[i])
        }
    }

    private static func save(_ entries: [Entry], to defaults: UserDefaults?) {
        guard let d = defaults else { return }
        d.set(["s": entries.map(\.session),
               "t": entries.map(\.at),
               "c": entries.map(\.code),
               "a": entries.map { $0.a ?? Int.min },
               "b": entries.map { $0.b ?? Int.min }],
              forKey: traceKey)
    }
}

// ---------------------------------------------------------------- the screen

/// What the trace looks like on a wrist. Reached from the long press on the count, in **every** build,
/// which is the whole point: a diagnostic that is only in Debug is a diagnostic that is never where the
/// bug is.
///
/// It leads with a verdict rather than with rows, because the question a person opens this screen with
/// is always the same one — *did the thing happen* — and counting rows on a two-inch screen is not a
/// way to answer it. The rows are underneath for when the verdict is surprising.
///
/// Every string on this screen is either written in this file or a number. There is nothing here to
/// redact, so a photograph of it is safe to send.
struct DiagnosticsView: View {
    @Environment(\.watchTheme) private var theme

    /// Read once when the screen opens rather than observed: a trace that redraws while it is being
    /// read moves the line somebody is looking at. Pull-to-refresh is the crown and a reopen.
    @State private var entries: [WatchDiagnostics.Entry] = []
    @State private var session = 0

    private var trace: WatchDiagnostics { .shared }

    var body: some View {
        List {
            Section {
                verdict
            }
            .listRowBackground(Color.clear)

            if entries.isEmpty {
                Text("Nothing traced yet.")
                    .font(theme.ui(13, .footnote))
                    .foregroundStyle(theme.muted)
                    .listRowBackground(Color.clear)
            }

            ForEach(entries.reversed()) { entry in
                HStack(alignment: .firstTextBaseline, spacing: 5) {
                    Text(entry.line)
                        .font(theme.ui(12, .caption))
                        .foregroundStyle(entry.session == session ? theme.text : theme.muted)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 0)
                    Text(entry.stamp)
                        .font(theme.ui(10, .caption2))
                        .foregroundStyle(theme.muted)
                        .monospacedDigit()
                }
                .padding(.vertical, 1)
                .listRowBackground(
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .fill(entry.session == session ? theme.ink2 : theme.ink)
                )
            }

            Button(role: .destructive) {
                trace.clear()
                load()
            } label: {
                Text("Clear")
                    .font(theme.ui(13, .footnote, bold: true))
                    .foregroundStyle(theme.danger)
            }
            .buttonStyle(.borderless)
            .listRowBackground(Color.clear)
        }
        .scrollContentBackground(.hidden)
        .background(theme.ink)
        .navigationTitle { Text("Diagnostics").foregroundStyle(theme.accent) }
        .onAppear(perform: load)
    }

    /// The five numbers this round was built to read, on one screen, in the order the add path runs in.
    /// Each is a count over every session the trace still holds, so "it has never once been heard" is
    /// visible without scrolling.
    @ViewBuilder
    private var verdict: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(verbatim: "launch \(session)  ·  \(entries.count) events")
                .font(theme.ui(11, .caption2))
                .foregroundStyle(theme.muted)
            row("asked", trace.count(WatchDiagnostics.Code.addTap))
            row("presented", trace.count(WatchDiagnostics.Code.addPresented))
            row("heard", trace.count(WatchDiagnostics.Code.addHeard))
            row("landed", trace.count(WatchDiagnostics.Code.addLanded))
            row("timed out", trace.count(WatchDiagnostics.Code.addTimedOut))
            row("title tap", trace.count(WatchDiagnostics.Code.titleTap))
        }
    }

    @ViewBuilder
    private func row(_ label: String, _ n: Int) -> some View {
        HStack(spacing: 4) {
            Text(label)
                .font(theme.ui(12, .caption))
                .foregroundStyle(theme.muted)
            Spacer(minLength: 0)
            Text(verbatim: "\(n)")
                .font(theme.ui(13, .caption, bold: true))
                .foregroundStyle(n > 0 ? theme.accent : theme.muted)
                .monospacedDigit()
        }
    }

    private func load() {
        entries = trace.all
        session = trace.currentSession
    }
}

#endif
