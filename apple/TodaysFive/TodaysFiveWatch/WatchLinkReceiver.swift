// WatchLinkReceiver.swift — the Watch's side of the link hand-off.
//
// What arrives is a stamped list of secrets. What this file does with it is I/O and nothing else: the
// rule that turns a payload into upserts, removals and a selection is `WatchLinkReconciler` in the
// core, where the Swift suite covers it — the same division of labour as the phone's vault, for the
// same reason. Getting it wrong here would mean a list on someone's wrist that their phone told it to
// forget, or the loss of the only copy of a secret.
//
// **Isolation.** The whole object is on the main actor. A `WCSessionDelegate` singleton is not
// concurrency-safe under Swift 6 — the compiler refuses a mutable global outright — and the main actor
// is the right one rather than a private actor because everything this object holds exists to be read
// by a SwiftUI view on the very next frame. WatchConnectivity delivers on its own queue, so the
// delegate is a small `nonisolated` object that hops the payload across and does nothing else.
//
// **Both doors are opened, because which one a delivery comes through is genuinely contested here.**
// One run on the paired simulators found `receivedApplicationContext` empty at activation with the
// callback firing (and firing twice); another found the property populated on a cold launch with the
// callback silent. Both are probably true of different moments, and a receiver that trusts either one
// shows an empty list on the launch where it was wrong. So the property is read after activation and
// the callback is handled, and the stamp in `WatchLinkPayload` is what makes opening both doors
// harmless — a payload is applied only when its `at` is newer than the last applied.
//
// The stamp is not there because anything proved the channel delivers twice. It is there because a
// channel whose delivery you do not control should not be trusted to deliver exactly once.
import Foundation
import Observation
import TodaysFiveCore
import WatchConnectivity

@MainActor
@Observable
final class WatchLinkReceiver {

    /// What the vault holds now, most recently seen first — the order the picker shows them in.
    private(set) var links: [VaultedLink] = []

    /// The list to show. nil when the phone has named none, which on a wrist is the whole of the
    /// empty state: there is nothing to add a line to until a phone says otherwise.
    private(set) var selected: String?

    /// Something changed because the phone said so. Track B's model hangs its pull off this; SwiftUI
    /// does not need it, since `links` and `selected` are observed.
    var onChange: (@MainActor () -> Void)?

    private let vault: LinkVault
    private let defaults: UserDefaults
    private var delegate: Delegate?
    private var started = false

    /// The high-water mark. `tf/app/` is the clients' prefix (COMPATIBILITY.md §8) and this is the
    /// Watch's corner of it. A stamp, not a secret.
    private static let appliedAtKey = "tf/app/watch/appliedAt"
    /// The selection *is* a secret, and it is kept the way the store already keeps one: in the app's
    /// own container, which is where the decrypted documents live too, under a name only this app
    /// reads. It is never in an App Group, never synchronised, and never printed.
    private static let selectedKey = "tf/app/watch/selected"

    init(vault: LinkVault = KeychainLinkVault(), defaults: UserDefaults = .standard) {
        self.vault = vault
        self.defaults = defaults
    }

    // ---------------------------------------------------------------- lifecycle

    func start() {
        links = (try? vault.all()) ?? []
        // A selection the vault no longer holds is no selection, and the first link is the answer —
        // the same fallback the reconciler applies when the phone stops naming the list on screen.
        let stored = defaults.string(forKey: Self.selectedKey)
        selected = links.contains(where: { $0.id == stored }) ? stored : links.first?.id

        guard WCSession.isSupported(), !started else { return }
        started = true
        let d = Delegate(owner: self)
        delegate = d
        let session = WCSession.default
        session.delegate = d
        session.activate()
    }

    /// Show this list. A list the vault does not hold is not a list this Watch can open.
    func select(_ id: String) {
        guard links.contains(where: { $0.id == id }) else { return }
        selected = id
        defaults.set(id, forKey: Self.selectedKey)
        onChange?()
    }

    // ---------------------------------------------------------------- the payload

    /// Apply a payload, whichever of the two deliveries it came in on. nil is a context this build
    /// could not read, which the reconciler treats as silence: it changes nothing.
    fileprivate func receive(_ payload: WatchLinkPayload?) {
        let held = (try? vault.all()) ?? []
        let plan = WatchLinkReconciler.reconcile(payload: payload,
                                                 lastAppliedAt: defaults.double(forKey: Self.appliedAtKey),
                                                 vault: held,
                                                 selected: selected)
        guard plan.applied else {
            dump(plan, payload)
            return
        }

        // Every write is watched, because the mark below is a promise that they happened. Keychain
        // items are `AfterFirstUnlock` and a context can wake this app before the first unlock of a
        // reboot, where every `put` answers `errSecInteractionNotAllowed` — and a mark written over
        // that leaves a Watch that has recorded a payload it did not keep and will never be sent
        // again. Ordering alone covers a *crash*; only this covers a *failure*.
        var wrote = true
        for link in plan.upsert {
            do { try vault.put(link) } catch { wrote = false }
        }
        for id in plan.remove {
            do { try vault.remove(id: id) } catch { wrote = false }
        }
        guard wrote else {
            #if DEBUG
            print("[tfive] watch: vault refused the write, mark not set")
            #endif
            links = (try? vault.all()) ?? links
            return
        }

        // The mark goes down **after** the vault is written, so a crash in between leaves the
        // cautious answer — the payload arrives again and is applied again — rather than a vault that
        // was half written and a stamp that says it was not.
        defaults.set(plan.appliedAt, forKey: Self.appliedAtKey)
        links = (try? vault.all()) ?? []
        selected = plan.select
        if let id = plan.select { defaults.set(id, forKey: Self.selectedKey) }
        else { defaults.removeObject(forKey: Self.selectedKey) }

        dump(plan, payload)
        onChange?()
    }

    private func dump(_ plan: WatchLinkPlan, _ payload: WatchLinkPayload?) {
        #if DEBUG
        // Counts and a shape. Never an id, and never the stamp's list — `showing` says whether there
        // is one, not which.
        print("[tfive] watch: heard v=\(payload.map { String($0.v) } ?? "-") "
            + "links=\(payload?.links.count ?? -1) applied=\(plan.applied) "
            + "+\(plan.upsert.count) −\(plan.remove.count) holds=\(links.count) "
            + "showing=\(selected == nil ? "none" : "one")")
        #endif
    }

    // ---------------------------------------------------------------- the delegate

    /// WatchConnectivity's own queue calls this, so it is `nonisolated`. It does one thing: read the
    /// context into the core's payload — a pure function, and the only shape that is `Sendable` — and
    /// hop *that* to the main actor. A raw `[String: Any]` could not cross the boundary at all, which
    /// is the compiler making the same point the design already wanted to. Keeping the delegate off
    /// `WatchLinkReceiver` also keeps the observable object free of an `NSObject` superclass it has no
    /// other use for.
    ///
    /// `sessionDidBecomeInactive` and `sessionDidDeactivate` are iOS-only and are deliberately absent;
    /// `session(_:activationDidCompleteWith:error:)` is required here too, under that exact Swift
    /// spelling — the Objective-C-shaped name compiles as a method of our own and then never fires.
    private final class Delegate: NSObject, WCSessionDelegate {
        let owner: WatchLinkReceiver

        init(owner: WatchLinkReceiver) {
            self.owner = owner
            super.init()
        }

        func session(_ session: WCSession,
                     activationDidCompleteWith activationState: WCSessionActivationState,
                     error: Error?) {
            guard activationState == .activated else { return }
            // Measured empty in every run, which is why the callback below is the delivery path. It is
            // read anyway: the stamp makes a repeat free, so the only thing this can cost is nothing.
            guard let payload = WatchLinkPayload(dictionary: session.receivedApplicationContext) else { return }
            Task { @MainActor [owner] in owner.receive(payload) }
        }

        func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
            let payload = WatchLinkPayload(dictionary: applicationContext)
            Task { @MainActor [owner] in owner.receive(payload) }
        }
    }
}
