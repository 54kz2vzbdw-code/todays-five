// The vault's reconciliation rules. The Keychain I/O is the app's and is proved on a simulator;
// what is here is the part that can be wrong in a way a test can catch.
//
// Two cases look identical in the registry — the person removed their last list, and the web store
// was cleared — and the rule tells them apart with a mark the app leaves in the same storage. Reading
// `tf/v2/meta` alone cannot: the page writes a registry the moment it boots, so a wiped store never
// looks empty. Both cases have a test here, and getting either backwards is a disaster: one
// resurrects the list you just removed, the other deletes the list the vault exists to save.
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("The link vault")
struct VaultTests {

    static let W = "AbCdEfGhIjKlMnOpQrStUv"
    static let R = "1234567890abcdefghijkl"
    static let other = "ZzZzZzZzZzZzZzZzZzZzZz"

    static func archivedRegistry(_ id: String) -> String {
        var o = JSONObject()
        o.set("id", id)
        o.set("mode", "edit")
        o.set("origin", "mine")
        o.set("archived", true)
        var meta = JSONObject()
        meta["lists"] = .array([.object(o)])
        return JSONWriter.stringify(.object(meta))
    }

    static func registry(_ entries: [(id: String, mode: String, origin: String, name: String)]) -> String {
        var lists: [JSONValue] = []
        for e in entries {
            var o = JSONObject()
            o.set("id", e.id)
            o.set("mode", e.mode)
            o.set("name", e.name)
            o.set("addedAt", 1000)
            o.set("origin", e.origin)
            lists.append(.object(o))
        }
        var meta = JSONObject()
        meta["lists"] = .array(lists)
        meta.set("current", entries.first?.id ?? "")
        return JSONWriter.stringify(.object(meta))
    }

    static func vaulted(_ id: String, mode: LinkMode = .edit, seen: Bool = true,
                        lastSeenAt: Double = 100, origin: String = "mine", name: String = "") -> VaultedLink {
        VaultedLink(id: id, mode: mode, origin: origin, nickname: "", name: name,
                    addedAt: 1, lastSeenAt: lastSeenAt, seenInRegistry: seen)
    }

    // ---------------------------------------------------------------- restore

    @Test("a missing registry is the wiped store: restore, and remove nothing")
    func missingRegistryRestores() {
        let vault = [Self.vaulted(Self.W, lastSeenAt: 50), Self.vaulted(Self.R, mode: .view, lastSeenAt: 900)]
        let plan = VaultReconciler.reconcile(registry: .absent, storeSeenBefore: false, vault: vault, now: 5000)
        #expect(plan.registryMissing)
        #expect(plan.remove.isEmpty, "a wiped store never deletes anything")
        #expect(plan.upsert.allSatisfy { !$0.seenInRegistry }, "and every link has to be named again")
        #expect(plan.restore?.id == Self.R, "the most recently seen link comes back")
        #expect(plan.restore?.mode == .view)
    }

    @Test("a read that fails decides nothing at all")
    func unreadableDecidesNothing() {
        // localStorage throws a SecurityError on a document with no real origin yet, which is what
        // the first load looks like for a moment. Caught on a simulator: reading that as "the store
        // is gone" made the app navigate away from the page the person was on.
        let vault = [Self.vaulted(Self.W), Self.vaulted(Self.other)]
        let plan = VaultReconciler.reconcile(registry: .unreadable, storeSeenBefore: true, vault: vault, now: 5000)
        #expect(plan.unreadable)
        #expect(!plan.registryMissing, "a failed read is not an empty store")
        #expect(plan.restore == nil, "so nothing is opened")
        #expect(plan.remove.isEmpty && plan.upsert.isEmpty, "and nothing is written or dropped")
    }

    @Test("a value that is not JSON is treated as missing, not as empty")
    func junkRegistryRestores() {
        for junk in ["", "not json", "[]", "null", "7", "\"a string\""] {
            let plan = VaultReconciler.reconcile(registry: .present(junk), storeSeenBefore: false, vault: [Self.vaulted(Self.W)], now: 5000)
            #expect(plan.registryMissing, "junk: \(junk)")
            #expect(plan.remove.isEmpty, "junk: \(junk)")
            #expect(plan.restore?.id == Self.W, "junk: \(junk)")
        }
    }

    @Test("a missing registry with an empty vault asks for nothing")
    func missingRegistryEmptyVault() {
        let plan = VaultReconciler.reconcile(registry: .absent, storeSeenBefore: false, vault: [], now: 5000)
        #expect(plan.registryMissing)
        #expect(plan.restore == nil)
        #expect(plan.remove.isEmpty && plan.upsert.isEmpty)
    }

    @Test("a restore makes every link earn its place again, so the next read cannot delete it")
    func restoreClearsSeen() throws {
        // The sequence that caught this on a simulator: wipe the web store, the app restores the
        // vaulted link, the page starts opening it — and the reconcile on didFinish lands before the
        // page has registered anything. Without clearing the flag the vault deletes what it just
        // restored, one reconcile later.
        let vault = [Self.vaulted(Self.W, seen: true), Self.vaulted(Self.R, mode: .view, seen: true)]
        let wiped = VaultReconciler.reconcile(registry: .absent, storeSeenBefore: false, vault: vault, now: 5000)
        #expect(wiped.registryMissing)
        #expect(wiped.remove.isEmpty)
        #expect(wiped.upsert.count == 2, "both are written back")
        #expect(wiped.upsert.allSatisfy { !$0.seenInRegistry }, "and neither counts as named any more")

        // the very next read, before the page has written its registry: nothing is dropped
        let afterWipe = wiped.upsert
        let racing = VaultReconciler.reconcile(registry: .present(Self.registry([])), storeSeenBefore: true, vault: afterWipe, now: 5100)
        #expect(racing.remove.isEmpty, "the page has not named anything yet, so nothing goes")

        // once the page names the restored list, the ordinary rules resume
        let named = VaultReconciler.reconcile(registry: .present(Self.registry([(Self.W, "edit", "mine", "")])),
                                              storeSeenBefore: true, vault: afterWipe, now: 5200)
        #expect(named.upsert.first(where: { $0.id == Self.W })?.seenInRegistry == true)
        #expect(named.remove.isEmpty, "the one it did not name has still never been named")
        let settled = [Self.vaulted(Self.W, seen: true)]
        #expect(VaultReconciler.reconcile(registry: .present(Self.registry([])), storeSeenBefore: true, vault: settled, now: 5300).remove == [Self.W],
                "and from then on its absence means what it says")
    }

    @Test("the mark, not the registry, is what tells a wipe from a removal")
    func theMarkTellsThemApart() {
        // The two cases the app has to tell apart leave *identical* registries. This is the whole
        // rule in one test: same `lists: []`, same vault, opposite answers.
        let empty = Self.registry([])
        let vault = [Self.vaulted(Self.W)]

        let removed = VaultReconciler.reconcile(registry: .present(empty), storeSeenBefore: true,
                                                vault: vault, now: 5000)
        #expect(removed.remove == [Self.W], "the mark is there: the page removed the list, so the vault does")
        #expect(removed.restore == nil, "and nothing is offered back")

        let wiped = VaultReconciler.reconcile(registry: .present(empty), storeSeenBefore: false,
                                              vault: vault, now: 5000)
        #expect(wiped.remove.isEmpty, "the mark is gone: the store was cleared, and a cleared store deletes nothing")
        #expect(wiped.restore?.id == Self.W, "the list the vault exists for comes back")
        #expect(wiped.markStore, "and the store is marked, so the next read is an ordinary one")
    }

    @Test("a wiped store looks like an empty registry, never like a missing one")
    func aWipedStoreStillHasARegistry() {
        // Caught on a simulator, and it is the reason the mark exists: the app wiped
        // WKWebsiteDataStore, the page booted and wrote `tf/v2/meta` before the app could read it,
        // and the reconcile logged `vault: +0 −1` — it deleted the one link, in the exact case the
        // vault was built to survive. `meta` is never missing on a real wipe.
        let vault = [Self.vaulted(Self.W, lastSeenAt: 50), Self.vaulted(Self.R, mode: .view, lastSeenAt: 900)]
        let plan = VaultReconciler.reconcile(registry: .present(Self.registry([])), storeSeenBefore: false,
                                             vault: vault, now: 5000)
        #expect(plan.remove.isEmpty)
        #expect(plan.restore?.id == Self.R && plan.restore?.mode == .view, "the most recently seen link, as a view link")
        #expect(plan.upsert.count == 2 && plan.upsert.allSatisfy { !$0.seenInRegistry },
                "and both have to be named again before their absence means anything")
    }

    @Test("a store the app has not seen before removes nothing, even when it names a list")
    func unmarkedStoreNeverRemoves() {
        // storage restored from a backup that is behind the vault, say
        let json = Self.registry([(Self.W, "edit", "mine", "Work")])
        let vault = [Self.vaulted(Self.W, name: "Work"), Self.vaulted(Self.other)]
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: false,
                                             vault: vault, now: 5000)
        #expect(plan.remove.isEmpty, "nothing goes on a store this app has not reconciled against")
        #expect(plan.restore == nil, "and nothing is opened over the list it does name")
        #expect(plan.upsert.contains { $0.id == Self.other && !$0.seenInRegistry },
                "the one it does not name gets one more turn instead")
        #expect(plan.markStore)
    }

    @Test("a registry that is not an object removes nothing, mark or no mark")
    func junkNeverRemoves() {
        for mark in [true, false] {
            let plan = VaultReconciler.reconcile(registry: .present("not json"), storeSeenBefore: mark,
                                                 vault: [Self.vaulted(Self.W)], now: 5000)
            #expect(plan.registryMissing, "mark: \(mark)")
            #expect(plan.remove.isEmpty, "the page will rewrite it — mark: \(mark)")
            #expect(!plan.markStore, "and a store whose registry is junk is not worth marking — mark: \(mark)")
        }
    }

    // ---------------------------------------------------------------- reconcile

    @Test("a registry that parses writes what it names")
    func registryUpserts() throws {
        let json = Self.registry([(Self.W, "edit", "mine", "Work"), (Self.R, "view", "shared", "Sarah's")])
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: true, vault: [], now: 5000)
        #expect(!plan.registryMissing)
        #expect(plan.restore == nil, "a registry that speaks for itself is never restored over")
        #expect(plan.remove.isEmpty)
        #expect(plan.upsert.count == 2)
        let w = try #require(plan.upsert.first { $0.id == Self.W })
        #expect(w.mode == .edit && w.origin == "mine" && w.name == "Work")
        #expect(w.seenInRegistry)
        #expect(w.addedAt == 1000, "the registry's own addedAt is kept")
        let r = try #require(plan.upsert.first { $0.id == Self.R })
        #expect(r.mode == .view && r.origin == "shared" && r.name == "Sarah's")
    }

    @Test("a link the registry no longer names is removed")
    func registryRemoves() {
        let json = Self.registry([(Self.W, "edit", "mine", "Work")])
        let vault = [Self.vaulted(Self.W, name: "Work"), Self.vaulted(Self.other)]
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: true, vault: vault, now: 5000)
        #expect(plan.remove == [Self.other])
        #expect(plan.restore == nil)
    }

    @Test("removing the only list leaves an empty registry — and must not resurrect it")
    func emptyListsIsNotAWipe() {
        // this is the case the checkpoint-1 correction is about: `lists: []` is the page speaking,
        // not the page gone
        let json = Self.registry([])
        let vault = [Self.vaulted(Self.W)]
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: true, vault: vault, now: 5000)
        #expect(!plan.registryMissing)
        #expect(plan.remove == [Self.W], "the page removed it, so the vault does too")
        #expect(plan.restore == nil, "and nothing is offered back on the next launch")
    }

    @Test("a registry with no lists key at all is still the page speaking")
    func metaWithoutListsReconciles() {
        let plan = VaultReconciler.reconcile(registry: .present(#"{"device":{"muted":false}}"#),
                                             storeSeenBefore: true, vault: [Self.vaulted(Self.W)], now: 5000)
        #expect(!plan.registryMissing)
        #expect(plan.remove == [Self.W])
        #expect(plan.restore == nil)
    }

    @Test("a link the page has never registered is not removed — it has not had its turn")
    func unseenLinkSurvives() {
        // a link tapped from Notes is vaulted before the page finishes opening it
        let json = Self.registry([])
        let vault = [Self.vaulted(Self.W, seen: false)]
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: true, vault: vault, now: 5000)
        #expect(plan.remove.isEmpty)
        // and once the page names it, its absence means what it says
        let after = VaultReconciler.reconcile(registry: .present(Self.registry([(Self.W, "edit", "mine", "")])),
                                              storeSeenBefore: true, vault: vault, now: 6000)
        #expect(after.upsert.first?.seenInRegistry == true)
        let later = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: true, vault: [Self.vaulted(Self.W, seen: true)], now: 7000)
        #expect(later.remove == [Self.W])
    }

    @Test("nothing is written when the registry and the vault already agree")
    func noChurn() {
        let json = Self.registry([(Self.W, "edit", "mine", "Work")])
        let vault = [Self.vaulted(Self.W, name: "Work")]
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: true, vault: vault, now: 5000)
        #expect(plan.upsert.isEmpty, "an unchanged entry is not rewritten on every read")
        #expect(plan.remove.isEmpty)
    }

    @Test("a renamed or re-origined list is written back")
    func detailsFollow() throws {
        let json = Self.registry([(Self.W, "edit", "shared", "Renamed")])
        let vault = [Self.vaulted(Self.W, origin: "mine", name: "Work")]
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: true, vault: vault, now: 5000)
        let w = try #require(plan.upsert.first)
        #expect(w.origin == "shared" && w.name == "Renamed")
        #expect(w.addedAt == 1, "the vault's own addedAt is not overwritten")
        #expect(w.lastSeenAt == 5000)
    }

    @Test("a junk id in the registry is ignored, and does not take a vaulted link with it")
    func junkEntriesIgnored() {
        var bad = JSONObject()
        bad.set("id", "nope")
        bad.set("mode", "edit")
        var meta = JSONObject()
        meta["lists"] = .array([.object(bad)])
        let plan = VaultReconciler.reconcile(registry: .present(JSONWriter.stringify(.object(meta))),
                                             storeSeenBefore: true, vault: [Self.vaulted(Self.W, seen: false)], now: 5000)
        #expect(plan.upsert.isEmpty)
        #expect(plan.remove.isEmpty)
    }

    @Test("Remove from this device flags the entry rather than dropping it, and the vault lets go")
    func archivedIsNotHeld() {
        // Measured, on a simulator: `archiveList` sets `archived` on the entry and leaves it in
        // `lists`, because the server and the person's other devices still have the list. Reading
        // `lists` naively, the vault would keep the key to a list the phone was told to forget —
        // and hand it back at the next wipe.
        let json = Self.archivedRegistry(Self.W)
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: true,
                                             vault: [Self.vaulted(Self.W)], now: 5000)
        #expect(plan.remove == [Self.W], "the device no longer holds it, so neither does the vault")
        #expect(plan.upsert.isEmpty, "and it is certainly not written back")
    }

    @Test("an archived entry is not a list to restore over, either")
    func archivedDoesNotCountAsNamed() {
        let json = Self.archivedRegistry(Self.other)
        let plan = VaultReconciler.reconcile(registry: .present(json), storeSeenBefore: false,
                                             vault: [Self.vaulted(Self.W)], now: 5000)
        #expect(plan.restore?.id == Self.W, "a store holding nothing but an archived entry holds no list")
        #expect(plan.remove.isEmpty)
    }

    // ---------------------------------------------------------------- links the app sees go by

    @Test("a link the app sees is vaulted with its mode and origin")
    func seenLink() throws {
        let fresh = try #require(VaultReconciler.seen((Self.W, .edit, "shared"), vault: [], now: 42))
        #expect(fresh.id == Self.W && fresh.mode == .edit && fresh.origin == "shared")
        #expect(fresh.seenInRegistry == false, "the page has not named it yet")
        #expect(fresh.addedAt == 42 && fresh.lastSeenAt == 42)

        let view = try #require(VaultReconciler.seen((Self.R, .view, nil), vault: [], now: 42))
        #expect(view.mode == .view, "a view link is vaulted as a view link")
        #expect(view.origin == "mine")

        #expect(VaultReconciler.seen(("nope", .edit, nil), vault: [], now: 42) == nil)
    }

    @Test("seeing a link again does not churn, and never narrows an edit link to a view link")
    func seenAgain() {
        let vault = [Self.vaulted(Self.W, mode: .edit, origin: "mine")]
        #expect(VaultReconciler.seen((Self.W, .edit, "mine"), vault: vault, now: 99) == nil, "no change, no write")
        #expect(VaultReconciler.seen((Self.W, .view, nil), vault: vault, now: 99) == nil,
                "an edit link stays an edit link")
        let reOrigined = VaultReconciler.seen((Self.W, .edit, "shared"), vault: vault, now: 99)
        #expect(reOrigined?.origin == "shared")
    }

    @Test("the payload round-trips, and a payload from a later version keeps its defaults")
    func payloadRoundTrip() {
        let link = VaultedLink(id: Self.W, mode: .view, origin: "shared", nickname: "Sarah's",
                               name: "Groceries", addedAt: 10, lastSeenAt: 20, seenInRegistry: true)
        let back = VaultedLink(id: Self.W, json: link.json)
        #expect(back == link)
        let sparse = VaultedLink(id: Self.W, json: JSONObject())
        #expect(sparse.mode == .edit && sparse.origin == "mine" && sparse.seenInRegistry == false)
    }
}
