// The vault's reconciliation rules. The Keychain I/O is the app's and is proved on a simulator;
// what is here is the part that can be wrong in a way a test can catch.
//
// The rule keys on whether `tf/v2/meta` exists, never on whether it holds any lists. Getting that
// backwards resurrects the list you just removed, which is the case the last test names.
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("The link vault")
struct VaultTests {

    static let W = "AbCdEfGhIjKlMnOpQrStUv"
    static let R = "1234567890abcdefghijkl"
    static let other = "ZzZzZzZzZzZzZzZzZzZzZz"

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
        let plan = VaultReconciler.reconcile(registryJSON: nil, vault: vault, now: 5000)
        #expect(plan.registryMissing)
        #expect(plan.remove.isEmpty, "a wiped store never deletes anything")
        #expect(plan.upsert.isEmpty)
        #expect(plan.restore?.id == Self.R, "the most recently seen link comes back")
        #expect(plan.restore?.mode == .view)
    }

    @Test("an unreadable registry is treated as missing, not as empty")
    func junkRegistryRestores() {
        for junk in ["", "not json", "[]", "null", "7", "\"a string\""] {
            let plan = VaultReconciler.reconcile(registryJSON: junk, vault: [Self.vaulted(Self.W)], now: 5000)
            #expect(plan.registryMissing, "junk: \(junk)")
            #expect(plan.remove.isEmpty, "junk: \(junk)")
            #expect(plan.restore?.id == Self.W, "junk: \(junk)")
        }
    }

    @Test("a missing registry with an empty vault asks for nothing")
    func missingRegistryEmptyVault() {
        let plan = VaultReconciler.reconcile(registryJSON: nil, vault: [], now: 5000)
        #expect(plan.registryMissing)
        #expect(plan.restore == nil)
        #expect(plan.remove.isEmpty && plan.upsert.isEmpty)
    }

    // ---------------------------------------------------------------- reconcile

    @Test("a registry that parses writes what it names")
    func registryUpserts() throws {
        let json = Self.registry([(Self.W, "edit", "mine", "Work"), (Self.R, "view", "shared", "Sarah's")])
        let plan = VaultReconciler.reconcile(registryJSON: json, vault: [], now: 5000)
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
        let plan = VaultReconciler.reconcile(registryJSON: json, vault: vault, now: 5000)
        #expect(plan.remove == [Self.other])
        #expect(plan.restore == nil)
    }

    @Test("removing the only list leaves an empty registry — and must not resurrect it")
    func emptyListsIsNotAWipe() {
        // this is the case the checkpoint-1 correction is about: `lists: []` is the page speaking,
        // not the page gone
        let json = Self.registry([])
        let vault = [Self.vaulted(Self.W)]
        let plan = VaultReconciler.reconcile(registryJSON: json, vault: vault, now: 5000)
        #expect(!plan.registryMissing)
        #expect(plan.remove == [Self.W], "the page removed it, so the vault does too")
        #expect(plan.restore == nil, "and nothing is offered back on the next launch")
    }

    @Test("a registry with no lists key at all is still the page speaking")
    func metaWithoutListsReconciles() {
        let plan = VaultReconciler.reconcile(registryJSON: #"{"device":{"muted":false}}"#,
                                             vault: [Self.vaulted(Self.W)], now: 5000)
        #expect(!plan.registryMissing)
        #expect(plan.remove == [Self.W])
        #expect(plan.restore == nil)
    }

    @Test("a link the page has never registered is not removed — it has not had its turn")
    func unseenLinkSurvives() {
        // a link tapped from Notes is vaulted before the page finishes opening it
        let json = Self.registry([])
        let vault = [Self.vaulted(Self.W, seen: false)]
        let plan = VaultReconciler.reconcile(registryJSON: json, vault: vault, now: 5000)
        #expect(plan.remove.isEmpty)
        // and once the page names it, its absence means what it says
        let after = VaultReconciler.reconcile(registryJSON: Self.registry([(Self.W, "edit", "mine", "")]),
                                              vault: vault, now: 6000)
        #expect(after.upsert.first?.seenInRegistry == true)
        let later = VaultReconciler.reconcile(registryJSON: json, vault: [Self.vaulted(Self.W, seen: true)], now: 7000)
        #expect(later.remove == [Self.W])
    }

    @Test("nothing is written when the registry and the vault already agree")
    func noChurn() {
        let json = Self.registry([(Self.W, "edit", "mine", "Work")])
        let vault = [Self.vaulted(Self.W, name: "Work")]
        let plan = VaultReconciler.reconcile(registryJSON: json, vault: vault, now: 5000)
        #expect(plan.upsert.isEmpty, "an unchanged entry is not rewritten on every read")
        #expect(plan.remove.isEmpty)
    }

    @Test("a renamed or re-origined list is written back")
    func detailsFollow() throws {
        let json = Self.registry([(Self.W, "edit", "shared", "Renamed")])
        let vault = [Self.vaulted(Self.W, origin: "mine", name: "Work")]
        let plan = VaultReconciler.reconcile(registryJSON: json, vault: vault, now: 5000)
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
        let plan = VaultReconciler.reconcile(registryJSON: JSONWriter.stringify(.object(meta)),
                                             vault: [Self.vaulted(Self.W, seen: false)], now: 5000)
        #expect(plan.upsert.isEmpty)
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
