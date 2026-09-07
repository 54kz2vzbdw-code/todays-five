// Vault.swift — the link vault's shape and its reconciliation rules.
//
// The app owns the links, because a WKWebView's storage is the browser's and nothing promises it
// survives site-data clearing, storage pressure or a future tracking-prevention rule. Losing it
// would lose the list: the link *is* the list.
//
// The Keychain I/O lives in the app. What lives here is the part that can be wrong in a way a test
// can catch — what to write, what to drop, and when a wiped web store should be restored from.
import Foundation

/// One link the app is keeping. The payload mirrors what the page's registry knows about it
/// (`meta.lists[]` in `tf/v2/meta`), so the two can be compared without translation.
public struct VaultedLink: Sendable, Hashable {
    /// The secret the link carries: `W` on an edit link, `R` on a view link.
    public var id: String
    public var mode: LinkMode
    /// "mine" or "shared", the 1.4 origin.
    public var origin: String
    /// The name the page gives it here, if any (a shared list can take one).
    public var nickname: String
    /// The list's own name, as the page last saw it.
    public var name: String
    public var addedAt: Double
    public var lastSeenAt: Double
    /// True once this link has appeared in a registry the app read. Until then its *absence* from
    /// the registry means nothing: a link tapped from Notes is vaulted before the page has had a
    /// chance to register it, and must not be dropped in that window.
    public var seenInRegistry: Bool

    public init(id: String, mode: LinkMode, origin: String = "mine", nickname: String = "",
                name: String = "", addedAt: Double = CalendarDates.now(),
                lastSeenAt: Double = CalendarDates.now(), seenInRegistry: Bool = false) {
        self.id = id
        self.mode = mode
        self.origin = origin
        self.nickname = nickname
        self.name = name
        self.addedAt = addedAt
        self.lastSeenAt = lastSeenAt
        self.seenInRegistry = seenInRegistry
    }

    /// The stored payload. The id is the Keychain account, so it is not repeated here.
    public var json: JSONObject {
        var o = JSONObject()
        o.set("mode", mode.rawValue)
        o.set("origin", origin)
        o.set("nickname", nickname)
        o.set("name", name)
        o.set("addedAt", addedAt)
        o.set("lastSeenAt", lastSeenAt)
        o.set("seenInRegistry", seenInRegistry)
        return o
    }

    /// Migrate on read, never wipe (COMPATIBILITY.md §5's rule, applied to the app's own store):
    /// a payload missing a field gets that field's default.
    public init(id: String, json o: JSONObject) {
        self.id = id
        self.mode = o.str("mode") == "view" ? .view : .edit
        self.origin = o.str("origin") == "shared" ? "shared" : "mine"
        self.nickname = o.str("nickname").string
        self.name = o.str("name").string
        self.addedAt = o.num("addedAt")
        self.lastSeenAt = o.num("lastSeenAt")
        self.seenInRegistry = o.truthy("seenInRegistry")
    }
}

public protocol LinkVault: Sendable {
    func all() throws -> [VaultedLink]
    /// Insert or update — never a duplicate for the same id.
    func put(_ link: VaultedLink) throws
    func remove(id: String) throws
}

/// What came back from reading `tf/v2/meta`. Three states, not two: a read that *failed* is not a
/// read that found nothing, and treating it as one makes the app navigate away from whatever the
/// person was looking at. `localStorage` throws a SecurityError on a document that has no real
/// origin yet — which is exactly what the first load looks like for a moment.
public enum RegistryRead: Sendable, Equatable {
    /// The read itself failed. Decide nothing.
    case unreadable
    /// The read worked and the key is not there: the store was wiped, or this is a fresh install.
    case absent
    /// The key's value, whatever it holds.
    case present(String)
}

/// What to do after reading the page's registry.
public struct VaultPlan: Sendable, Equatable {
    /// Links to write (new ones, and ones whose registry details moved).
    public var upsert: [VaultedLink] = []
    /// Ids to drop, because a registry that is speaking for itself no longer names them.
    public var remove: [String] = []
    /// The link to open because the page's store is gone and the vault is not.
    public var restore: VaultedLink?
    /// True when the registry key was read and was not there, or held something that is not an
    /// object.
    public var registryMissing = false
    /// True when the read failed. Nothing in this plan means anything; try again later.
    public var unreadable = false
    /// Write the app's mark into the page's storage: this store has now been reconciled against.
    /// Its whole job is to be destroyed when the store is cleared. See `reconcile`.
    public var markStore = false
}

public enum VaultReconciler {

    /// The key the app keeps in the page's own `localStorage` to say "I have reconciled against this
    /// store before". It holds nothing — its entire purpose is to be destroyed by the one event the
    /// app cannot otherwise detect.
    public static let markKey = "tf/app/seen"

    /// Two questions have to be told apart, and a single read of `tf/v2/meta` cannot tell them apart:
    ///
    ///   * **the person removed their last list** — the registry parses and names nothing, and the
    ///     vault must drop it too, or the next launch resurrects what was just removed;
    ///   * **the web store was cleared** — iOS reclaimed the site data, or tracking prevention did.
    ///     The vault exists for exactly this, and must give the list back.
    ///
    /// Both look identical: `{"lists":[]}`. Reading `meta` as *absent* in the second case does not
    /// work either, because the page writes a registry the moment it boots — on a wiped store the
    /// app has never once seen `meta` missing, and keying on that deleted the vault in the very case
    /// it was built for. (Measured, on a simulator: `vault: +0 −1` where a restore belonged.)
    ///
    /// So the app leaves a **mark of its own in the same storage**, and the mark answers the
    /// question the registry cannot: it is still there when the person removed a list, and it is
    /// gone when the store was cleared, because it was cleared with everything else.
    ///
    ///   * unreadable → nothing is decided at all. A failed read says nothing about the store.
    ///   * the mark is **there** → the page is speaking for itself, `lists: []` included. Every entry
    ///     is written, and every vaulted link the registry does not name is dropped: that is *Remove
    ///     from this device* and *Delete this list*, observed rather than relayed.
    ///   * the mark is **gone** → this store is new to the app: a first launch, or a wipe. Nothing is
    ///     removed, every link the registry does not name has to earn its place again, the most
    ///     recently seen one is offered back if the registry names none of them, and the mark is
    ///     written so the next read is an ordinary one.
    ///   * the registry is **not an object** at all → the page will rewrite it. Nothing is removed
    ///     and nothing is marked, whatever the mark said.
    ///
    /// "Names a list" means an entry that is not `archived`: *Remove from this device* leaves the
    /// entry in `lists` and flags it, and a flagged entry is a list this device no longer holds.
    public static func reconcile(registry: RegistryRead, storeSeenBefore: Bool, vault: [VaultedLink],
                                 now: Double = CalendarDates.now()) -> VaultPlan {
        var plan = VaultPlan()

        // A read that failed is not a store that is empty. Decide nothing and wait for a read that
        // worked: acting here would navigate away from whatever the person is looking at.
        if registry == .unreadable {
            plan.unreadable = true
            return plan
        }

        var registryJSON: String? = nil
        if case let .present(value) = registry { registryJSON = value }
        let meta = registryJSON.flatMap { try? JSONReader.parse($0) }?.objectValue
        if meta == nil { plan.registryMissing = true }

        // `normalizeRegistry` guards the same way: anything that is not an array of entries is none.
        let entries = (meta?["lists"]?.arrayValue ?? []).compactMap { $0.objectValue }
        var named = Set<String>()
        var byId: [String: VaultedLink] = [:]
        for link in vault { byId[link.id] = link }

        for entry in entries {
            let id = entry.str("id").string
            guard Model.isListId(id) else { continue }
            // *Remove from this device* does not take the entry out of `lists` — it sets `archived`
            // on it, because the server and the person's other devices still have the list and Lists
            // brings it back. So an archived entry is a list this device does **not** hold, and the
            // vault must let go of its secret: keeping it would mean the phone still held the key to
            // a list the person told it to forget, and a later wipe would hand it back.
            guard !entry.truthy("archived") else { continue }
            named.insert(id)
            let mode: LinkMode = entry.str("mode") == "view" ? .view : .edit
            let origin = entry.str("origin") == "shared" ? "shared" : "mine"
            let nickname = entry.str("nickname").string
            let name = entry.str("name").string

            if var existing = byId[id] {
                let changed = existing.mode != mode || existing.origin != origin
                    || existing.nickname != nickname || existing.name != name
                    || !existing.seenInRegistry
                existing.mode = mode
                existing.origin = origin
                existing.nickname = nickname
                existing.name = name
                existing.lastSeenAt = now
                existing.seenInRegistry = true
                if changed { plan.upsert.append(existing) }
            } else {
                let addedAt = entry["addedAt"]?.finiteNumber ?? now
                plan.upsert.append(VaultedLink(id: id, mode: mode, origin: origin, nickname: nickname,
                                               name: name, addedAt: addedAt, lastSeenAt: now,
                                               seenInRegistry: true))
            }
        }

        guard storeSeenBefore, meta != nil else {
            // A store this app has not reconciled against decides nothing about what is gone. Every
            // link the registry does not name has to be named again before its absence is allowed to
            // mean anything — which also covers the race that caught this the first time: the page
            // registers a list asynchronously, so the reconcile after a restore can land before the
            // page has named the list it was handed, and without this the vault deletes what it just
            // restored, one reconcile later.
            // A registry that is not an object is not the page speaking either — the page will
            // rewrite it — so it too decides nothing about what is gone, and it is not a store worth
            // marking.
            plan.markStore = meta != nil
            for link in vault where !named.contains(link.id) && link.seenInRegistry {
                var cleared = link
                cleared.seenInRegistry = false
                plan.upsert.append(cleared)
            }
            if named.isEmpty, !storeSeenBefore {
                // the most recently seen link, then the most recently added, then the id, so the
                // answer is the same on every device that holds the same vault
                plan.restore = vault.sorted { a, b in
                    if a.lastSeenAt != b.lastSeenAt { return a.lastSeenAt > b.lastSeenAt }
                    if a.addedAt != b.addedAt { return a.addedAt > b.addedAt }
                    return JSString(a.id) < JSString(b.id)
                }.first
            }
            return plan
        }

        // A link the app vaulted but the page has never registered is not a removal — it has not had
        // its turn yet (a link tapped from Notes is vaulted before the page finishes opening it).
        for link in vault where !named.contains(link.id) && link.seenInRegistry {
            plan.remove.append(link.id)
        }
        plan.remove.sort { JSString($0) < JSString($1) }
        return plan
    }

    /// A link the app saw go by — a universal link, a paste, a navigation. Returns what to write,
    /// or nil when the vault already agrees.
    public static func seen(_ parsed: (id: String, mode: LinkMode, origin: String?),
                            vault: [VaultedLink], now: Double = CalendarDates.now()) -> VaultedLink? {
        guard Model.isListId(parsed.id) else { return nil }
        if var existing = vault.first(where: { $0.id == parsed.id }) {
            let origin = parsed.origin ?? existing.origin
            // a mode never narrows on its own: an edit link stays an edit link
            let mode: LinkMode = existing.mode == .edit ? .edit : parsed.mode
            if existing.mode == mode && existing.origin == origin { return nil }
            existing.mode = mode
            existing.origin = origin
            existing.lastSeenAt = now
            return existing
        }
        return VaultedLink(id: parsed.id, mode: parsed.mode,
                           origin: parsed.origin == "shared" ? "shared" : "mine",
                           addedAt: now, lastSeenAt: now, seenInRegistry: false)
    }
}
