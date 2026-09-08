// WatchLinkSender.swift — the phone sends the vault's links, and nothing else.
//
// The Watch is a client of the server in its own right, so what crosses the pairing is a list of
// secrets and never a document. One `updateApplicationContext` per change: it is a last-value-wins
// slot the system delivers when it can, which is exactly the shape of "here is what this phone holds
// now" and not at all the shape of a message that has to arrive.
//
// **Isolation.** Everything here is on the main actor. A `WCSessionDelegate` singleton is not
// concurrency-safe on its own — a `static let shared` of a plain class is a mutable global under
// Swift 6 and the compiler refuses it outright — and of the two ways out, an actor or the main actor,
// the main actor is the honest one: this object exists to be poked by the view controller right after
// it reconciles the vault, off the same Keychain that code path already reads. WatchConnectivity calls
// its delegate on a background queue, so the callbacks are `nonisolated` and hop back, which is the
// one place the boundary is real.
//
// Nothing here ever prints an id. `-TFDumpWatchSend` prints the payload's shape and its counts, the
// way `-TFDumpVault` prints a length: a link in a log is a link that has left the device.
import Foundation
import TodaysFiveCore
import WatchConnectivity

@MainActor
final class WatchLinkSender: NSObject {

    static let shared = WatchLinkSender()

    /// Where the links come from when no caller has handed any over — at activation, and whenever the
    /// Watch says its state changed. The vault is the phone's own, already reconciled against the
    /// page's registry by `WebViewController`; this object never decides what the phone holds.
    private let vault: LinkVault

    /// The payload waiting to go out, kept until the session can take it. A watch app that is not
    /// installed refuses every send with `WCErrorCodeWatchAppNotInstalled` (7006), and that is the
    /// ordinary state of a pairing until the person adds the app — so a refusal parks the payload
    /// rather than dropping it.
    private var pending: WatchLinkPayload?

    /// The two Secret kits, when this phone's person has unlocked them — read out of the page's own
    /// theme.js by `WebViewController`, never compiled in. Empty is the ordinary state and is also
    /// what a phone that has *re-locked* says, which is how the wrist lets go of them again.
    private var secretKits: [Kit] = []

    /// The last stamp put on the wire by this process. Two sends inside one millisecond would carry
    /// the same `at`, and the Watch applies a payload only when its `at` is strictly newer than the
    /// last one it applied — so the second would look exactly like the doubled delivery and be
    /// ignored. The clock decides the stamp; this only stops it standing still.
    private var lastSentAt: Double = 0

    private var started = false

    init(vault: LinkVault = KeychainLinkVault()) {
        self.vault = vault
        super.init()
    }

    // ---------------------------------------------------------------- lifecycle

    /// Activate the session, and send what the vault holds once it is activated.
    func start() {
        guard WCSession.isSupported() else { return }   // an iPad, and the devices that have no pairing
        guard !started else { return }
        started = true
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    /// The vault changed: build a payload and put it in the slot.
    func send(_ links: [VaultedLink]) {
        let at = max(CalendarDates.now(), lastSentAt + 1)
        lastSentAt = at
        var payload = WatchLinkPayload(links: links.map(WatchLink.init), at: at)
        // Under `kits` in `extra`, sorted, so a Watch on an older build passes the key through
        // untouched and `v` stays 1. Setting none removes the key, which is the message a re-locked
        // phone has to be able to send.
        payload.secretKits = secretKits
        pending = payload
        flush()
    }

    /// The Secret kits this phone may hand over, or none. Called by `WebViewController` after every
    /// reconcile: the latch is `meta.device.secret` in the page's own registry, and the palettes are
    /// read out of the page's own theme.js. A change re-sends, because "the phone has re-locked" has
    /// to reach the wrist as surely as *Remove from this device* does.
    func setSecretKits(_ kits: [Kit]) {
        guard kits.map(\.id) != secretKits.map(\.id) else { return }
        secretKits = kits
        sendVault()
    }

    /// Send whatever the vault holds now, for the two moments that have no caller with a list in hand.
    ///
    /// A read that **failed** is not a vault that is **empty**, and the difference is the whole of
    /// COMPATIBILITY.md §8's hardest lesson, one channel further along. `SecItemCopyMatching` answers
    /// `errSecInteractionNotAllowed` before the first unlock, and iOS launches this app in the
    /// background for a universal link or for its counterpart on the wrist — so `(try? …) ?? []`
    /// would put a stamped, authoritative "this phone holds no lists" in the slot and the Watch,
    /// believing it, would drop every link it has. Refuse to speak instead: the next real send says
    /// the true thing, and silence changes nothing on the other side.
    /// The vault moved. This is the only moment §2 says the phone speaks, and `WebViewController`
    /// is the only thing that knows it happened — a link went by, or a reconcile added or dropped
    /// one. Public so that it can be called from there and nowhere else.
    func sendVaultNow() { sendVault() }

    private func sendVault() {
        guard let links = try? vault.all() else {
            #if DEBUG
            print("[tfive] watch: vault unreadable, sending nothing")
            #endif
            return
        }
        send(links)
    }

    private func flush() {
        guard let payload = pending else { return }
        let session = WCSession.default
        // Both of these are iOS-only — there is no watchOS spelling of either, and the watch side asks
        // `isCompanionAppInstalled` instead. Installing the phone app on a paired simulator does not
        // install the watch app, and until it is installed every send throws 7006, which looks exactly
        // like WatchConnectivity being broken and is not.
        guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else {
            dump(payload, "held")
            return
        }
        do {
            try session.updateApplicationContext(payload.dictionary)
            pending = nil
            dump(payload, "sent")
        } catch {
            // The payload stays pending and goes out on the next activation or state change. The error
            // is printed by its code and nothing else: an error's userInfo can carry the offending
            // payload back with it, and the payload is a list of secrets.
            dump(payload, "refused (\((error as NSError).code))")
        }
    }

    // ---------------------------------------------------------------- debug

    /// `-TFDumpWatchSend` — the shape and the counts, never a link. An id's *length* is the most this
    /// app has ever printed of one, and that rule does not bend for a new channel.
    private func dump(_ payload: WatchLinkPayload, _ what: String) {
        #if DEBUG
        guard ProcessInfo.processInfo.arguments.contains("-TFDumpWatchSend") else { return }
        let edit = payload.links.filter { $0.mode == .edit }.count
        let shared = payload.links.filter { $0.origin == "shared" }.count
        let named = payload.links.filter { !$0.nickname.isEmpty }.count
        print("[tfive] watch: \(what) v=\(payload.v) links=\(payload.links.count) "
            + "edit=\(edit) view=\(payload.links.count - edit) shared=\(shared) nicknamed=\(named) "
            + "kits=\(payload.secretKits.count) "
            + "keys=\(payload.dictionary.keys.sorted().joined(separator: ","))")
        #endif
    }
}

// ---------------------------------------------------------------- the delegate

// The callbacks arrive on WatchConnectivity's own queue, so they are `nonisolated` and hop to the main
// actor rather than pretending the queue is ours. `sessionDidBecomeInactive` and `sessionDidDeactivate`
// are **required on iOS and do not exist on watchOS**; `session(_:activationDidCompleteWith:error:)` is
// required on both, under that exact Swift spelling — the Objective-C-shaped name compiles as a new
// method of our own and the delegate then quietly never fires, which is the worse failure.
extension WatchLinkSender: WCSessionDelegate {

    nonisolated func session(_ session: WCSession,
                             activationDidCompleteWith activationState: WCSessionActivationState,
                             error: Error?) {
        Task { @MainActor in
            guard activationState == .activated else { return }
            if pending == nil { sendVault() } else { flush() }
        }
    }

    nonisolated func sessionDidBecomeInactive(_ session: WCSession) {}

    /// The person switched to another watch. The session has to be activated again for the new one,
    /// and the new one has heard nothing, so the vault goes out again from scratch.
    nonisolated func sessionDidDeactivate(_ session: WCSession) {
        Task { @MainActor in
            started = false
            start()
        }
    }

    /// A watch was paired, or the watch app was installed — the state that turns every earlier send
    /// from a refusal into a delivery.
    nonisolated func sessionWatchStateDidChange(_ session: WCSession) {
        Task { @MainActor in
            if pending == nil { sendVault() } else { flush() }
        }
    }
}
