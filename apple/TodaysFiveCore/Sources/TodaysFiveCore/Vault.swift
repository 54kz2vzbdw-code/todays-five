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

/// What to do after reading the page's registry.
public struct VaultPlan: Sendable, Equatable {
    /// Links to write (new ones, and ones whose registry details moved).
    public var upsert: [VaultedLink] = []
    /// Ids to drop, because a registry that is speaking for itself no longer names them.
    public var remove: [String] = []
    /// The link to open because the page's store is gone and the vault is not.
    public var restore: VaultedLink?
    /// True when the registry key was absent or unreadable — the wiped-storage case.
    public var registryMissing = false
}

public enum VaultReconciler {

    /// `registryJSON` is exactly what `localStorage.getItem("tf/v2/meta")` returned: nil when the
    /// key is absent.
    ///
    /// The rule keys on **whether the registry exists**, never on whether it holds any lists:
    ///
    ///   * missing or unreadable → the store was wiped (or this is a fresh install over a vault).
    ///     Nothing is removed, and the most recently seen link is offered back.
    ///   * parses → the page is speaking for itself, `lists: []` included. Every entry is written,
    ///     and every vaulted link the registry does not name is dropped: that is *Remove from this
    ///     device* and *Delete this list*, observed rather than relayed.
    ///
    /// Keying on `lists` being non-empty instead would be a bug — removing the only list leaves
    /// `lists: []`, restore would fire on the next launch, and the list would come back.
    public static func reconcile(registryJSON: String?, vault: [VaultedLink],
                                 now: Double = CalendarDates.now()) -> VaultPlan {
        var plan = VaultPlan()

        guard let registryJSON,
              let parsed = try? JSONReader.parse(registryJSON),
              let meta = parsed.objectValue else {
            plan.registryMissing = true
            // the most recently seen link, then the most recently added, then the id, so the answer
            // is the same on every device that holds the same vault
            plan.restore = vault.sorted { a, b in
                if a.lastSeenAt != b.lastSeenAt { return a.lastSeenAt > b.lastSeenAt }
                if a.addedAt != b.addedAt { return a.addedAt > b.addedAt }
                return JSString(a.id) < JSString(b.id)
            }.first
            return plan
        }

        // `normalizeRegistry` guards the same way: anything that is not an array of entries is none.
        let entries = (meta["lists"]?.arrayValue ?? []).compactMap { $0.objectValue }
        var named = Set<String>()
        var byId: [String: VaultedLink] = [:]
        for link in vault { byId[link.id] = link }

        for entry in entries {
            let id = entry.str("id").string
            guard Model.isListId(id) else { continue }
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
