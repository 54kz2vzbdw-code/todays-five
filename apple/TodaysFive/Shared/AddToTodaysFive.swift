// AddToTodaysFive.swift — the App Intent, compiled into both the phone and the Watch, and the one
// add path that every way in ends at.
//
// There are four ways to put a line on Today from a wrist — Siri, the + in the app, Double Tap, the
// Action button — and the whole point of `TodayOps.addToToday` is that none of them writes a record.
// So this file holds no rule about the document at all. It resolves *which* list, refuses kindly
// when there is none or when it is view-only, and hands the text to the core.
//
// **Why the service is here and not in the Watch app's model.** An App Intent runs when the app is
// not on screen and, on the phone, when there is no model at all — the phone is a web view on the
// live site and has never held a Swift copy of a list. So the add path has to be able to stand up
// on its own from nothing but the vault: derive the keys, open a `SyncEngine`, pull, add, push. The
// Watch app's `+` uses the same service rather than a second one, because two adds is one add and
// one bug waiting.
//
// **Isolation.** `AddService` is a `Sendable` value with no mutable state; `add` and `undo` are
// `async` and do their work on whatever executor calls them, which for an intent is the intent's own
// and for the `+` is a `Task` off the main actor. Nothing here touches UI. The one main-actor hop is
// the Watch's confirmation banner, and it is made explicitly at the call site.
//
// **The trace, and why every call in it is `#if os(watchOS)`.** Phase 5 put `WatchDiagnostics` on this
// path, because this is the one function all four ways in end at — so one set of trace rows answers
// "did the core see it and what did it answer" for Siri, the `+`, Double Tap and the Action button
// alike, rather than four sets written four times. This file compiles into **both** the phone and the
// watch target and `WatchDiagnostics` exists only in the second, which is the same guard the `noList`
// sentence already needed.
//
// **The refusal ordinal, written down once because the wrist screen cannot name it.** `add.refused`
// carries `AddOutcome.outcomeCode` as its one number, and `DiagnosticsView` prints the number rather
// than a word: that screen is the orchestrator's file and this round may not teach it a new vocabulary.
// So the mapping lives here, beside the enum it is an ordinal of, and a reader of a wrist screenshot
// needs this table:
//
//     0 added · 1 nothing-said · 2 no-list · 3 view-only · 4 gone · 5 could-not-open · 6 input-timeout
//
// A case is only ever appended, because a screenshot sent last week is read against this list.
import AppIntents
import Foundation
import TodaysFiveCore

// MARK: - what happened

/// A line that landed.
struct AddedLine: Sendable, Equatable {
    /// The text as the core cleaned it — bidi stripped, trimmed, collapsed, cut at 200. This is what
    /// the confirmation shows, because showing what was *said* rather than what was *kept* would be
    /// a small lie on the one screen that exists to tell the truth about it.
    var text: String
    var itemId: String
    var listId: String
    var listName: String
    /// On this device and not yet on the server. The core's store queues it; the engine sends it on
    /// the next sync. Worth its own word so the confirmation does not claim more than it knows.
    var queued: Bool
}

/// Every answer the add path can give. All of them are sayable out loud; none of them is a thrown
/// error, because a person asking Siri to add a line cannot read a stack trace.
enum AddOutcome: Sendable, Equatable {
    case added(AddedLine)
    /// Nothing was heard, or what was heard was all whitespace. The core's `addToToday` returns nil
    /// for this and so do we: an empty line is not a line.
    case nothingSaid
    /// The vault holds nothing. On a Watch that means the phone has not sent a link over yet.
    case noList
    case viewOnly(listName: String)
    case listGone(listName: String)
    /// The keys would not derive, or there is no server configured in this build.
    case couldNotOpen
    /// The input screen was asked for and never came back inside `WatchDictation.defaultTimeout`.
    ///
    /// It is the one outcome the core has no opinion about — nothing was ever handed to it — and it is
    /// here rather than in the view because this enum is *what a person is told*, and the person who
    /// pressed Add and waited a minute is owed a sentence in the same place as every other answer.
    /// Phase 3's `working` latch is the bug it replaces: there, the same event produced no sentence and
    /// a dead control.
    case inputTimedOut

    /// The one line a person is shown or told, whichever way they came in. Deliberately a sentence
    /// rather than a code: these are the two answers most people will actually meet.
    var sentence: String {
        switch self {
        case let .added(line):
            // "not up yet" rather than "when you're back on": offline is the usual reason a push has
            // not landed and it is not the only one, and a sentence should not name a cause it has
            // not checked.
            return line.queued
                ? "Added \u{201C}\(line.text)\u{201D} to \(line.listName) — on this watch, not up yet."
                : "Added \u{201C}\(line.text)\u{201D} to \(line.listName)."
        case .nothingSaid:
            return "I didn't catch that, so nothing was added."
        case .noList:
            #if os(watchOS)
            return "There's no list on this watch yet. Open Today's Five on your iPhone and it'll send one over."
            #else
            return "There's no list yet. Open Today's Five and make one, then I can add to it."
            #endif
        case let .viewOnly(name):
            return "\(name) is view only, so nothing can be added to it. You'd need the edit link for that."
        case let .listGone(name):
            return "\(name) isn't there any more, so there was nowhere to put it."
        case .couldNotOpen:
            return "I couldn't get to your list just now. Try again in a moment."
        case .inputTimedOut:
            // It does not say "I didn't catch that": that sentence belongs to an input screen that
            // came back empty, and this one never came back at all. Telling the two apart is the whole
            // of what the wrist asked for.
            return "The input screen never came back, so nothing was added. Try the plus again."
        }
    }

    /// The line, when one actually landed. The haptic and the Undo hang off this.
    var landed: AddedLine? {
        if case let .added(line) = self { return line }
        return nil
    }

    /// A fixed word for a debug line. Never the text, never an id — the privacy rules in
    /// PLAN-apple-phase3.md apply to every `print` in this round.
    var label: String {
        switch self {
        case .added: return "added"
        case .nothingSaid: return "nothing-said"
        case .noList: return "no-list"
        case .viewOnly: return "view-only"
        case .listGone: return "gone"
        case .couldNotOpen: return "could-not-open"
        case .inputTimedOut: return "input-timeout"
        }
    }

    /// The ordinal `WatchDiagnostics` carries on `add.refused`, and the reason it is an ordinal.
    ///
    /// A trace entry holds a fixed literal and two `Int`s and nothing else — that is the privacy
    /// guarantee, not a convention — so "which refusal" has to be a number. The number is defined here,
    /// beside the cases, and the table is in this file's header because `DiagnosticsView` shows the
    /// digit: that screen belongs to the orchestrator and a round that taught it a new word would be
    /// editing a file three other tracks are also writing to.
    ///
    /// **Append only.** A screenshot from a wrist is read against whatever this list said when the
    /// build on that wrist was made, so renumbering would silently re-label somebody's evidence.
    var outcomeCode: Int {
        switch self {
        case .added: return 0
        case .nothingSaid: return 1
        case .noList: return 2
        case .viewOnly: return 3
        case .listGone: return 4
        case .couldNotOpen: return 5
        case .inputTimedOut: return 6
        }
    }
}

// MARK: - the service

/// The add path, and the undo of it. Everything it needs is injected, so the self-test can run the
/// real code against a memory transport and a scratch directory without a network, a Keychain or a
/// phone.
struct AddService: Sendable {

    /// The App Group the Watch app and its complication share. The Keychain items are *not* in it:
    /// what is shared is the decrypted document the complication has to read, never a secret.
    static let appGroup = "group.com.pricebrannen.todaysfive"

    /// Where `WatchLinkReceiver` keeps the id of the list on screen. It is `private` over there, and
    /// this file cannot see it — and could not use it if it could, because this file also compiles
    /// into the phone, where that type does not exist. So the string is written twice, and that is
    /// the thing integration should fix: this file is the one compiled into both targets, so the
    /// constant belongs here and `WatchLinkReceiver` should read it from here.
    static let selectedListKey = "tf/app/watch/selected"

    /// The phone's equivalent: the list the web view has open, written by `WebViewController` every
    /// time it notices a link go by. `tf/app/` is the clients' prefix — COMPATIBILITY.md §8 — and
    /// this one lives in the app's own defaults, never in the page's storage.
    static let openListKey = "tf/app/phone/open"

    var vault: any LinkVault
    /// nil is a real choice, not a missing one: on the phone nothing is kept on disk. The list lives
    /// in the page's own storage and the page picks the line up on its next poll, so writing a
    /// second, decrypted copy of someone's list into the app's container would be a copy nothing
    /// ever reads.
    var store: ListStore?
    var makeTransport: @Sendable () -> (any Transport)?
    /// Which of the vaulted links this device is showing. Injected so the self-test can point it at
    /// a list of its own.
    var pickList: @Sendable ([VaultedLink]) -> VaultedLink?
    var now: @Sendable () -> Double

    // ---------------------------------------------------------------- the real one

    static func live() -> AddService {
        AddService(
            vault: KeychainLinkVault(),
            store: liveStore(),
            makeTransport: { try? SupabaseTransport() },
            pickList: Self.selectedList,
            now: { CalendarDates.now() }
        )
    }

    /// The Watch keeps its lists in the App Group so the complication can read them without linking
    /// the core. When the entitlement is not in the running binary the container is nil *silently*,
    /// which is indistinguishable from a list with nothing on it — so the fallback says so.
    static func liveStore() -> ListStore? {
        #if os(watchOS)
        if let container = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) {
            return try? ListStore(directory: container.appendingPathComponent("lists", isDirectory: true))
        }
        #if DEBUG
        print("[tfive] add: no app group container, falling back to Application Support")
        #endif
        return try? ListStore()
        #else
        return nil
        #endif
    }

    /// The list this device is showing.
    ///
    /// Both platforms answer it the same way — a key naming the open list — and neither falls back to
    /// "the first one" without saying why. `KeychainLinkVault.all()` does sort by `lastSeenAt`, but
    /// that timestamp is not the signal it looks like: `VaultReconciler` stamps **every** held link
    /// with the same `now` on every reconcile, so the order is stable and means nothing about which
    /// list is on screen. The phone therefore writes the open list down (`WebViewController`, on each
    /// navigation) rather than having this function infer it.
    ///
    /// A stored id the vault no longer holds is no selection, and then the first link is the answer —
    /// which is `WatchLinkReceiver`'s own fallback, and on a device holding one list it is right.
    static func selectedList(_ links: [VaultedLink]) -> VaultedLink? {
        #if os(watchOS)
        let key = selectedListKey
        #else
        let key = openListKey
        #endif
        if let id = UserDefaults.standard.string(forKey: key),
           let chosen = links.first(where: { $0.id == id }) {
            return chosen
        }
        return links.first
    }

    // ---------------------------------------------------------------- add

    /// The whole of it. Four ways in end here — which is why the trace is here and not in the view.
    ///
    /// Three rows per add, and between them they separate "the core never saw it" from "the core saw it
    /// and said no" from "a line landed": `add.service` with the character count handed in, then either
    /// `add.landed` with the length the core kept and whether it is queued, or `add.refused` with the
    /// ordinal above. **Lengths and an ordinal. Never the text, never an id, never a list name.**
    func add(_ raw: String) async -> AddOutcome {
        #if os(watchOS)
        WatchDiagnostics.shared.record(WatchDiagnostics.Code.addService, raw.count)
        #endif
        let outcome = await added(raw)
        #if os(watchOS)
        if let line = outcome.landed {
            WatchDiagnostics.shared.record(WatchDiagnostics.Code.addLanded,
                                           line.text.count, line.queued ? 1 : 0)
        } else {
            WatchDiagnostics.shared.record(WatchDiagnostics.Code.addRefused, outcome.outcomeCode)
        }
        #endif
        return outcome
    }

    /// The add itself, so `add` above can be the one place the trace is written. Split for that and for
    /// nothing else: every return in here is an answer `add` then records.
    private func added(_ raw: String) async -> AddOutcome {
        let links = (try? vault.all()) ?? []
        guard let link = pickList(links) else { return .noList }
        let name = Self.displayName(of: link)

        // Refused before the document is touched, so nobody is shown a line that will not stay. The
        // core would refuse the push anyway — a view ref has no token — but a person deserves to
        // hear "no" before the line appears rather than after it quietly fails to arrive.
        guard link.mode == .edit else { return .viewOnly(listName: name) }

        guard let keys = try? Keys.fromLink(link.mode, link.id) else { return .couldNotOpen }

        let engine = SyncEngine(transport: makeTransport(), store: store)
        let held = store?.load(link.id)
        await engine.open(keys, held ?? ListRecord(doc: Doc(), mode: link.mode, origin: link.origin))

        // Pull first, so the line lands on top of what the list actually says rather than on top of
        // what this device last saw. Offline is not a failure here: the store queues the edit and
        // the engine sends it on the next sync, which is what `SyncEngine` was built for.
        await engine.pull()
        if await engine.status == .gone { return .listGone(listName: name) }

        let before = await engine.document()
        guard let result = Model.addToToday(before, text: raw, at: now()) else { return .nothingSaid }
        await engine.update(result.doc)
        await engine.push()

        let status = await engine.status
        // A 403 on an edit link means our token is not the row's — the list is read-only to us in
        // fact if not in the vault's opinion. Say the same thing we would have said up front.
        if status == .readonly { return .viewOnly(listName: name) }
        if status == .gone { return .listGone(listName: name) }

        // A push that did not land is only *queued* when there is somewhere to queue it. On the phone
        // there is not — nothing is kept on disk there, on purpose — so a failed push means the line
        // is nowhere, and saying "added" would be a lie the person only discovers later.
        if status != .synced && store == nil { return .couldNotOpen }

        let landedDoc = await engine.document()
        let text = landedDoc.items[result.id]?.objectValue?.str("text").string ?? ""
        // `displayName` prefers the nickname, and this is the one outcome a person meets on every
        // successful add — so it must not be the one place the nickname is thrown away. Only reach
        // for the live document's name where `displayName` would have fallen through to the
        // registry's stale copy of it.
        let liveName = link.nickname.isEmpty
            ? (landedDoc.name.string.isEmpty ? name : landedDoc.name.string)
            : name
        return .added(AddedLine(text: text, itemId: result.id, listId: link.id,
                                listName: liveName, queued: status != .synced))
    }

    // ---------------------------------------------------------------- undo

    /// Five seconds of "actually, no".
    ///
    /// It leaves a **tombstone** rather than taking the key out of `items`, which is what the core
    /// does everywhere else and what COMPATIBILITY.md §3 requires: a document that simply forgot a
    /// record would have the record handed back to it by the next device that merges. A tombstone is
    /// a fact a merge can carry.
    ///
    /// The composition — guard the record is live, replace it with `Model.tombstone`, stamp the
    /// document — is the one `DifferentialTests` uses, because the core has `tombstone(_:at:)` (the
    /// *shape* of a deleted record) and no `deleteItem(_:_:at:)` (the *operation*). That gap is
    /// reported rather than filled here, and these three lines are the smallest possible thing to
    /// delete once the core grows the op.
    @discardableResult
    func undo(_ line: AddedLine) async -> Bool {
        guard let keys = try? Keys.fromLink(.edit, line.listId) else { return false }
        let engine = SyncEngine(transport: makeTransport(), store: store)
        let held = store?.load(line.listId)
        await engine.open(keys, held ?? ListRecord(doc: Doc(), mode: .edit))

        // The local copy is the fast path and on the Watch it is always the right one: the add that
        // made this line wrote it to the same store a moment ago, and five seconds is not the time to
        // spend a round trip. A caller with no store — the phone — has an empty document here, so a
        // line that is not in it is pulled for rather than given up on.
        var doc = await engine.document()
        if doc.items[line.itemId] == nil {
            await engine.pull()
            doc = await engine.document()
        }
        guard let item = doc.items[line.itemId]?.objectValue, !item.truthy("deleted") else { return false }
        let ts = now()
        var out = doc
        out.items[line.itemId] = .object(Model.tombstone(item, at: ts))
        out.updatedAt = max(doc.updatedAt, ts)

        await engine.update(out)
        await engine.push()
        #if os(watchOS)
        WatchDiagnostics.shared.record(WatchDiagnostics.Code.addUndone)
        #endif
        return true
    }

    // ---------------------------------------------------------------- naming

    /// A shared list goes by its nickname when it has one, else by the document's name — `app.js`'s
    /// own rule. A list with neither is still a list, and "your list" is what a person calls it.
    static func displayName(of link: VaultedLink) -> String {
        // `app.js:739` gates it: `(entry && entry.origin === "shared" && entry.nickname) || docName`.
        // Nothing writes a nickname to a list of one's own today, so the two agree in practice — but
        // agreeing by accident is not the same as agreeing.
        if link.origin == "shared", !link.nickname.isEmpty { return link.nickname }
        if !link.name.isEmpty { return link.name }
        return "your list"
    }
}

// MARK: - the intent

/// *Add to Today's Five.* One text parameter, one dialog, no screen.
///
/// The phrases that reach it are in `TodaysFiveShortcuts.swift`, and they cannot carry the line —
/// see the note there. So the line arrives through this parameter, and Siri asks for it with
/// `requestValueDialog` when the person did not say it.
struct AddToTodaysFive: AppIntent {
    static let title: LocalizedStringResource = "Add to Today's Five"
    static let description = IntentDescription(
        "Put a line on Today, on whichever list this device is showing.",
        categoryName: "Today"
    )

    #if os(iOS)
    // On the phone the list is a page in a web view: the line goes to the server and the page picks
    // it up on its next poll, so opening the app is how a person watches it arrive. It opens on a
    // refusal too, and that is right — "there's no list yet" is answered by the welcome screen.
    // On the Watch the app is already the thing in front of them, so it stays where it is.
    static let openAppWhenRun = true
    #endif

    @Parameter(
        title: "Line",
        description: "The line to put on Today.",
        requestValueDialog: "What should I add?"
    )
    var line: String

    // A parameter summary *may* interpolate a String — it is only a *phrase* that may not. The two
    // rules read alike and are not, which is worth a sentence next to the one that surprises people.
    static var parameterSummary: some ParameterSummary {
        Summary("Add \(\.$line) to Today's Five")
    }

    func perform() async throws -> some IntentResult & ProvidesDialog {
        #if os(watchOS)
        // Siri, the Action button and Shortcuts all arrive here and nowhere else, and none of them has
        // a screen of its own — so without this row the trace could not tell "Siri never reached the
        // app" from "Siri reached it and the add was refused". It carries the length of the line and
        // nothing about it.
        WatchDiagnostics.shared.record(WatchDiagnostics.Code.intentRan, line.count)
        #endif
        let outcome = await AddService.live().add(line)
        #if os(watchOS)
        // If the app happens to be running, the same confirmation and the same five seconds of Undo
        // appear there too, so Siri and the + do not answer differently. If it is not running there
        // is nothing to show and the dialog was the whole confirmation.
        await AddCoordinator.shared.note(outcome)
        #endif
        return .result(dialog: IntentDialog(stringLiteral: outcome.sentence))
    }
}
