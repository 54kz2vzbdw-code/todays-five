// The link hand-off: the codec the phone and the Watch both read, and the rule that decides what a
// payload does to the Watch's vault.
//
// Two measured facts about the channel are what these tests exist for. The delivery callback fires
// **twice** for every send, and an application context is a last-value-wins slot that is replayed to
// a watch app on launch — so the receiver has to be idempotent, and the stamp is what makes it one.
// The other half is the empty-payload trap: "the phone holds no lists" and "the Watch has heard
// nothing" look identical if you let them, and reading one as the other either wipes a list or
// resurrects one. Both have a test here and both are worth failing loudly.
import Foundation
import Testing
@testable import TodaysFiveCore

@Suite("The Watch link hand-off")
struct WatchLinkTests {

    static let W = "AbCdEfGhIjKlMnOpQrStUv"
    static let R = "1234567890abcdefghijkl"
    static let other = "ZzZzZzZzZzZzZzZzZzZzZz"

    static func link(_ id: String, mode: LinkMode = .edit, origin: String = "mine",
                     nickname: String = "", name: String = "") -> WatchLink {
        WatchLink(id: id, mode: mode, origin: origin, nickname: nickname, name: name)
    }

    static func vaulted(_ id: String, mode: LinkMode = .edit, origin: String = "mine",
                        nickname: String = "", name: String = "") -> VaultedLink {
        VaultedLink(id: id, mode: mode, origin: origin, nickname: nickname, name: name,
                    addedAt: 1, lastSeenAt: 100, seenInRegistry: false)
    }

    // ---------------------------------------------------------------- the codec

    @Test("the codec round-trips, and a key this build does not know survives it")
    func roundTrip() throws {
        var sent = WatchLinkPayload(links: [Self.link(Self.W, name: "Home"),
                                            Self.link(Self.R, mode: .view, origin: "shared",
                                                      nickname: "Sam's", name: "Groceries")],
                                    at: 1_700_000_000_000)
        // What a later build might put on the wire beside the keys this one reads. §3's rule is about
        // the document, but it is really about any shape two builds exchange.
        sent.extra.set("theme", "paper")
        sent.extra.set("faces", 3)

        var wire = sent.dictionary
        #expect(wire["v"] as? Int == 1)
        #expect(wire["at"] as? Double == 1_700_000_000_000)
        #expect((wire["links"] as? [Any])?.count == 2)
        #expect(PropertyListSerialization.propertyList(wire, isValidFor: .binary),
                "an application context takes property-list types only, and refuses anything else synchronously")

        let heard = try #require(WatchLinkPayload(dictionary: wire))
        #expect(heard.v == 1)
        #expect(heard.at == sent.at)
        #expect(heard.links == sent.links)
        #expect(heard.extra.str("theme").string == "paper")
        #expect(heard.extra.num("faces") == 3)

        // and out again, unchanged: an old client must hand back what it could not read
        wire = heard.dictionary
        #expect(wire["theme"] as? String == "paper")
        let again = try #require(WatchLinkPayload(dictionary: wire))
        #expect(again == heard)
    }

    @Test("an empty payload encodes and decodes as an empty payload, not as nothing")
    func emptyRoundTrip() throws {
        let heard = try #require(WatchLinkPayload(dictionary: WatchLinkPayload(links: [], at: 5).dictionary))
        #expect(heard.links.isEmpty)
        #expect(heard.at == 5)
    }

    @Test("a payload from a future v is refused, and so is a shape that is not ours")
    func refusals() {
        let good = WatchLinkPayload(links: [Self.link(Self.W)], at: 10).dictionary

        var future = good
        future["v"] = 2
        #expect(WatchLinkPayload(dictionary: future) == nil, "a v this build cannot read is refused, never guessed at")

        var noVersion = good
        noVersion.removeValue(forKey: "v")
        #expect(WatchLinkPayload(dictionary: noVersion) == nil)

        var zero = good
        zero["v"] = 0
        #expect(WatchLinkPayload(dictionary: zero) == nil)

        var textVersion = good
        textVersion["v"] = "1"
        #expect(WatchLinkPayload(dictionary: textVersion) == nil)

        // The stamp is the whole of the idempotence story: a payload that cannot be ordered would be
        // applied on both deliveries and again on every launch, so it is not a payload at all.
        var unstamped = good
        unstamped.removeValue(forKey: "at")
        #expect(WatchLinkPayload(dictionary: unstamped) == nil)

        // A *missing* links key is a shape we do not recognise. An empty one is a state — see below.
        var noLinks = good
        noLinks.removeValue(forKey: "links")
        #expect(WatchLinkPayload(dictionary: noLinks) == nil)

        #expect(WatchLinkPayload(dictionary: [:]) == nil)
        #expect(WatchLinkPayload(dictionary: ["hello": "world"]) == nil)
    }

    @Test("an entry that is not a link is skipped, and the rest of the person's lists still arrive")
    func junkEntriesSkipped() throws {
        var wire = WatchLinkPayload(links: [Self.link(Self.W)], at: 10).dictionary
        wire["links"] = [["id": Self.W, "mode": "edit", "origin": "mine", "nickname": "", "name": ""],
                         ["id": "too-short"],
                         ["mode": "edit"],
                         "not a dictionary"]
        let heard = try #require(WatchLinkPayload(dictionary: wire))
        #expect(heard.links.map(\.id) == [Self.W])
    }

    @Test("a mode and an origin are read the way the vault reads them everywhere else")
    func modeAndOriginDefaults() throws {
        var wire = WatchLinkPayload(links: [], at: 10).dictionary
        wire["links"] = [["id": Self.W, "mode": "view", "origin": "shared"],
                         ["id": Self.R, "mode": "something new", "origin": "elsewhere"]]
        let heard = try #require(WatchLinkPayload(dictionary: wire))
        #expect(heard.links[0].mode == .view)
        #expect(heard.links[0].origin == "shared")
        #expect(heard.links[1].mode == .edit)
        #expect(heard.links[1].origin == "mine")
    }

    @Test("a vault entry narrows to a WatchLink and widens back")
    func narrowAndWiden() {
        let stored = Self.vaulted(Self.R, mode: .view, origin: "shared", nickname: "Sam's", name: "Groceries")
        let narrow = WatchLink(stored)
        #expect(narrow.id == stored.id)
        #expect(narrow.mode == .view)
        #expect(narrow.origin == "shared")
        #expect(narrow.nickname == "Sam's")
        #expect(narrow.name == "Groceries")

        let wide = narrow.vaulted
        #expect(wide.id == stored.id)
        #expect(wide.mode == .view)
        #expect(wide.nickname == "Sam's")
        #expect(wide.seenInRegistry == false, "there is no page on a wrist, so the flag never turns on")
    }

    // ---------------------------------------------------------------- the stamp

    @Test("the doubled delivery is free: the same payload twice applies once")
    func doubledDeliveryIsFree() {
        let payload = WatchLinkPayload(links: [Self.link(Self.W, name: "Home")], at: 1000)
        let first = WatchLinkReconciler.reconcile(payload: payload, lastAppliedAt: 0, vault: [],
                                                  selected: nil, now: 5000)
        #expect(first.applied)
        #expect(first.appliedAt == 1000)
        #expect(first.upsert.map(\.id) == [Self.W])
        #expect(first.select == Self.W)

        // exactly what the second callback hands over, and it must do nothing at all
        let second = WatchLinkReconciler.reconcile(payload: payload, lastAppliedAt: first.appliedAt,
                                                   vault: first.upsert, selected: first.select, now: 6000)
        #expect(second.applied == false)
        #expect(second.upsert.isEmpty)
        #expect(second.remove.isEmpty)
        #expect(second.select == nil)
        #expect(second.appliedAt == 0)
    }

    @Test("out-of-order delivery is safe: an older stamp after a newer one changes nothing")
    func outOfOrderIsSafe() {
        let vault = [Self.vaulted(Self.W), Self.vaulted(Self.R)]
        let stale = WatchLinkPayload(links: [], at: 900)
        let plan = WatchLinkReconciler.reconcile(payload: stale, lastAppliedAt: 1000, vault: vault,
                                                 selected: Self.W, now: 5000)
        #expect(plan.applied == false)
        #expect(plan.remove.isEmpty, "a stale payload that names nothing must not empty the vault")
        #expect(plan.upsert.isEmpty)

        // and a stamp equal to the mark is the doubled delivery again, not a new state
        let same = WatchLinkPayload(links: [], at: 1000)
        #expect(WatchLinkReconciler.reconcile(payload: same, lastAppliedAt: 1000, vault: vault,
                                              selected: Self.W).applied == false)
    }

    // ---------------------------------------------------------------- empty, and silent

    @Test("an empty links array is a removal: the phone holds no lists and neither does the Watch")
    func emptyIsARemoval() {
        let vault = [Self.vaulted(Self.W), Self.vaulted(Self.R, mode: .view)]
        let plan = WatchLinkReconciler.reconcile(payload: WatchLinkPayload(links: [], at: 2000),
                                                 lastAppliedAt: 1000, vault: vault,
                                                 selected: Self.W, now: 5000)
        #expect(plan.applied)
        #expect(plan.remove == [Self.R, Self.W].sorted { JSString($0) < JSString($1) })
        #expect(plan.upsert.isEmpty)
        #expect(plan.select == nil, "nothing left to show")
    }

    @Test("silence is not: nothing arrived, so nothing is removed")
    func silenceRemovesNothing() {
        let vault = [Self.vaulted(Self.W), Self.vaulted(Self.R)]
        let plan = WatchLinkReconciler.reconcile(payload: nil, lastAppliedAt: 0, vault: vault,
                                                 selected: Self.W, now: 5000)
        #expect(plan.applied == false)
        #expect(plan.remove.isEmpty)
        #expect(plan.upsert.isEmpty)
        #expect(plan.select == nil)
    }

    // ---------------------------------------------------------------- what a payload changes

    @Test("the selection survives a payload that still names it, and moves when it does not")
    func selectionFollowsThePhone() {
        let vault = [Self.vaulted(Self.W), Self.vaulted(Self.R)]

        let kept = WatchLinkReconciler.reconcile(
            payload: WatchLinkPayload(links: [Self.link(Self.R), Self.link(Self.W)], at: 2000),
            lastAppliedAt: 1000, vault: vault, selected: Self.W, now: 5000)
        #expect(kept.select == Self.W, "the list on screen stays on screen while the phone still names it")
        #expect(kept.remove.isEmpty)

        let moved = WatchLinkReconciler.reconcile(
            payload: WatchLinkPayload(links: [Self.link(Self.R)], at: 2000),
            lastAppliedAt: 1000, vault: vault, selected: Self.W, now: 5000)
        #expect(moved.select == Self.R, "the phone's own order decides where it lands")
        #expect(moved.remove == [Self.W])

        let fromNothing = WatchLinkReconciler.reconcile(
            payload: WatchLinkPayload(links: [Self.link(Self.other), Self.link(Self.R)], at: 2000),
            lastAppliedAt: 1000, vault: [], selected: nil, now: 5000)
        #expect(fromNothing.select == Self.other)
    }

    @Test("only what the phone says about a link moves; a link it has not changed is not rewritten")
    func upsertsOnlyWhatMoved() {
        let vault = [Self.vaulted(Self.W, name: "Home"),
                     Self.vaulted(Self.R, mode: .view, origin: "shared", name: "Groceries")]
        let plan = WatchLinkReconciler.reconcile(
            payload: WatchLinkPayload(links: [Self.link(Self.W, name: "Home"),
                                              Self.link(Self.R, mode: .view, origin: "shared",
                                                        nickname: "Sam's", name: "Groceries")],
                                      at: 2000),
            lastAppliedAt: 1000, vault: vault, selected: nil, now: 5000)
        #expect(plan.upsert.map(\.id) == [Self.R], "the nickname is the only thing that moved")
        #expect(plan.upsert.first?.nickname == "Sam's")
        #expect(plan.upsert.first?.addedAt == 1, "when the Watch first held the secret is not the phone's to reset")
        #expect(plan.upsert.first?.lastSeenAt == 5000)
        #expect(plan.remove.isEmpty)
    }

    @Test("a link the Watch has never held arrives whole, stamped now")
    func newLinkArrives() {
        let plan = WatchLinkReconciler.reconcile(
            payload: WatchLinkPayload(links: [Self.link(Self.W, origin: "shared", name: "Home")], at: 2000),
            lastAppliedAt: 0, vault: [], selected: nil, now: 5000)
        let added = plan.upsert.first
        #expect(added?.id == Self.W)
        #expect(added?.origin == "shared")
        #expect(added?.addedAt == 5000)
        #expect(added?.lastSeenAt == 5000)
        #expect(added?.seenInRegistry == false)
    }

    @Test("a repeated id is one link, and the first of them")
    func repeatedIdIsOneLink() {
        let plan = WatchLinkReconciler.reconcile(
            payload: WatchLinkPayload(links: [Self.link(Self.W, name: "First"),
                                              Self.link(Self.W, name: "Second")], at: 2000),
            lastAppliedAt: 0, vault: [], selected: nil, now: 5000)
        #expect(plan.upsert.count == 1)
        #expect(plan.upsert.first?.name == "First")
    }

    // ---------------------------------------------------------------- the Secret kits (1.12 b207)

    /// The two kits as they leave theme.js — read from the fixture, because they are in no binary
    /// and this test is not about to be the place that puts them in one. A phone reads exactly this
    /// shape out of its own page.
    static let secretKits: [Kit] = Fixtures.kits.arr("kits")
        .compactMap(\.objectValue).filter { $0.truthy("secret") }
        .compactMap { Kit(json: .object($0)) }

    @Test("a payload with no kits leaves nothing behind")
    func noKitsMeansNoKits() {
        var payload = WatchLinkPayload(links: [Self.link(Self.W)], at: 2000)
        #expect(payload.secretKits.isEmpty)
        #expect(payload.dictionary[WatchLinkPayload.kitsKey] == nil, "no key at all, not an empty one")

        let plan = WatchLinkReconciler.reconcile(payload: payload, lastAppliedAt: 0,
                                                 vault: [], selected: nil, now: 5000)
        #expect(plan.applied)
        #expect(plan.kits.isEmpty, "and that is what takes them away again when a phone re-locks")

        // Setting them and then setting none removes the key rather than leaving an empty object.
        payload.secretKits = Self.secretKits
        #expect(payload.secretKits.count == 2)
        payload.secretKits = []
        #expect(payload.dictionary[WatchLinkPayload.kitsKey] == nil)
    }

    @Test("a payload with them round-trips, palette for palette")
    func kitsRoundTripOverTheWire() throws {
        #expect(Self.secretKits.count == 2, "the fixture still has the pair")
        var sent = WatchLinkPayload(links: [Self.link(Self.W, name: "Home")], at: 1_700_000_000_000)
        sent.secretKits = Self.secretKits

        let wire = sent.dictionary
        #expect(PropertyListSerialization.propertyList(wire, isValidFor: .binary),
                "an application context takes property-list types only")
        let bytes = try PropertyListSerialization.data(fromPropertyList: wire, format: .binary,
                                                       options: 0).count

        let back = try #require(WatchLinkPayload(dictionary: wire))
        #expect(back == sent, "the whole payload, extra included — which is where the sorting matters")
        #expect(back.secretKits == Self.secretKits.sorted { $0.id < $1.id })
        for kit in back.secretKits {
            #expect(kit.secret, "a Secret kit knows it is one on the other side")
            #expect(Kits.byId(kit.id) == nil, "and it is still not in the table")
            #expect(kit.type != nil, "but it can still find its faces — a font pair is not a secret")
        }
        let ids = back.secretKits.map(\.id).joined(separator: ", ")
        print("secret kits: \(ids) in a \(bytes)-byte application context")
    }

    @Test("the kits go in sorted, whatever order they arrive in and whatever else is already there")
    func insertionIsSorted() throws {
        var payload = WatchLinkPayload(links: [], at: 1)
        payload.setExtra("zebra", .string("last"))
        payload.setExtra("alpha", .string("first"))
        payload.secretKits = Self.secretKits.reversed()
        payload.setExtra("middle", .number(1))
        #expect(payload.extra.keys.map(\.string) == ["alpha", "kits", "middle", "zebra"])
        #expect(payload.extra.obj("kits").keys.map(\.string) == ["birthday", "superpink"])
        // The point of all that sorting: decode rebuilds `extra` in sorted order and JSONObject's
        // == compares insertion order, so an unsorted set here would make this fail about a third
        // of the time and look like the codec's fault.
        #expect(WatchLinkPayload(dictionary: payload.dictionary) == payload)
    }

    @Test("an older build keeps the key it does not understand and hands it back")
    func anOlderBuildPassesTheKitsThrough() throws {
        var fromNewPhone = WatchLinkPayload(links: [Self.link(Self.W)], at: 3000)
        fromNewPhone.secretKits = Self.secretKits

        // What a build with no idea what `kits` is does with it: `extra` keeps every key outside
        // v/at/links, and `dictionary` puts them all back. Nothing in this path reads `secretKits`,
        // which is exactly what an older build does not have.
        let older = try #require(WatchLinkPayload(dictionary: fromNewPhone.dictionary))
        let handedBack = older.dictionary
        let kits = try #require(handedBack[WatchLinkPayload.kitsKey] as? [String: Any])
        #expect(kits.keys.sorted() == ["birthday", "superpink"])
        let again = try #require(WatchLinkPayload(dictionary: handedBack))
        #expect(again.secretKits == fromNewPhone.secretKits,
                "two passes through a build that does not know the key, and the palettes are intact")
    }
}
