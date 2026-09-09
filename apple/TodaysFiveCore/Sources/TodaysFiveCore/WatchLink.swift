// WatchLink.swift — the link hand-off between the phone and the Watch, and its rules.
//
// The phone hands over links. It never hands over data: the Watch is a client of the server in its
// own right, which is the whole reason the core is a library rather than the phone's private
// business. What crosses is a stamped list of secrets, and what is here is the codec for it plus the
// part of the receiving that can be wrong in a way a test catches — the same division of labour as
// Vault.swift, for the same reason. The WatchConnectivity I/O lives in the two app targets.
//
// 1.12 b202 adds one thing to that, and it is a palette rather than a list: the two **Secret kits**, which
// are in no binary and reach a Watch only from a phone whose person has unlocked them. They ride in
// `extra` under `kits`, which is the key an older build already passes through untouched, so `v`
// stays 1 — COMPATIBILITY.md §3's additive rule applied to a wire shape rather than a document.
//
// Two measured facts shape everything below. `session(_:didReceiveApplicationContext:)` fires
// **twice** for every send, reproducibly; and an application context is a last-value-wins slot that
// is also replayed to a watch app on launch. So the channel's delivery cannot be trusted to happen
// once, or in order, and the answer is not a promise but a stamp: a payload is applied only when its
// `at` is strictly newer than the last one applied. Repeat delivery is then free and out-of-order
// delivery is safe.
import Foundation

/// One link on its way to the Watch: a `VaultedLink` narrowed to what a wrist can use. The bookkeeping
/// the phone keeps — when it was added, when the registry last named it, whether the registry has
/// named it at all — is the phone's own and does not cross: the Watch has no registry to reconcile
/// against, and the fewer fields on the wire the fewer there are to disagree about.
public struct WatchLink: Sendable, Hashable {
    /// The secret the link carries: `W` on an edit link, `R` on a view link.
    public var id: String
    public var mode: LinkMode
    /// "mine" or "shared", the 1.4 origin — the Watch's picker shows a Shared pill for it.
    public var origin: String
    /// The name the phone gives a shared list here, if any.
    public var nickname: String
    /// The list's own name, as the phone last saw it.
    public var name: String

    public init(id: String, mode: LinkMode, origin: String = "mine",
                nickname: String = "", name: String = "") {
        self.id = id
        self.mode = mode
        self.origin = origin
        self.nickname = nickname
        self.name = name
    }

    /// The phone's vault entry, narrowed.
    public init(_ link: VaultedLink) {
        self.init(id: link.id, mode: link.mode, origin: link.origin,
                  nickname: link.nickname, name: link.name)
    }

    /// Widened back, for the Watch's own vault. `seenInRegistry` stays false and always will: it
    /// means "the page's registry has named this link", and there is no page on a wrist. The Watch's
    /// removal rule is the payload's, not the registry's.
    public var vaulted: VaultedLink {
        VaultedLink(id: id, mode: mode, origin: origin, nickname: nickname, name: name)
    }

    /// A property-list dictionary. Every value is a `String`, which is the one type
    /// `updateApplicationContext` can never refuse.
    var dictionary: [String: Any] {
        ["id": id, "mode": mode.rawValue, "origin": origin, "nickname": nickname, "name": name]
    }

    /// nil when the entry is not a link — an id that is not a list id is a shape from some other
    /// build, and the Watch has nothing to do with it.
    init?(dictionary d: [String: Any]) {
        guard let id = d["id"] as? String, Model.isListId(id) else { return nil }
        // The same reading VaultedLink and VaultReconciler already give a mode and an origin, spelled
        // the same way on purpose: a third rule for one field is the surprise, not the safety.
        self.init(id: id,
                  mode: (d["mode"] as? String) == "view" ? .view : .edit,
                  origin: (d["origin"] as? String) == "shared" ? "shared" : "mine",
                  nickname: (d["nickname"] as? String) ?? "",
                  name: (d["name"] as? String) ?? "")
    }
}

/// What the phone sends, whole: a version, a stamp and the links.
///
/// COMPATIBILITY.md §3's rule is about the document, but it is really about any shape two builds
/// exchange, so it holds here: unknown top-level keys are **kept** and handed back on the next
/// encode, and a `v` from a future this build cannot read is refused outright rather than guessed at.
/// The keeping matters because the Watch may be the newer of the two and the phone the older, or the
/// other way round, on any given morning.
public struct WatchLinkPayload: Sendable, Equatable {
    public static let version = 1

    public var v: Int
    /// Milliseconds on the sender's clock. Only ever compared against another `at` from the same
    /// sender, so the two clocks never have to agree with each other — only with themselves.
    public var at: Double
    public var links: [WatchLink]
    /// Top-level keys this build does not know, kept exactly as they arrived.
    public var extra: JSONObject

    public init(links: [WatchLink], at: Double = CalendarDates.now()) {
        self.v = Self.version
        self.at = at
        self.links = links
        self.extra = JSONObject()
    }

    static let knownKeys: Set<String> = ["v", "at", "links"]

    // ---------------------------------------------------------------- the Secret kits (1.12 b202)

    /// The key the two Secret kits ride under. It is deliberately in `extra` and not a field of its
    /// own: a build that predates 1.12 b202 keeps unknown keys and hands them back, so a Watch on an
    /// older build passes them through untouched instead of choking, and `v` stays 1.
    public static let kitsKey = "kits"

    /// The Secret kits this payload carries — none unless the phone's person has unlocked them.
    ///
    /// **They are not in any binary.** The generated table is the 16 open kits; these two are read
    /// out of the phone's own page (`theme.js` is right there, and every browser has it) and put on
    /// the wire only by a phone whose `meta.device.secret` is set. "A Watch that has not unlocked
    /// them does not carry them" is a stricter rule than the web's own — the palettes are not
    /// cryptographically secret — and it is kept because it was asked for.
    ///
    /// Reading is by id, in sorted order, whatever order they went in.
    public var secretKits: [Kit] {
        get {
            guard let o = extra[Self.kitsKey]?.objectValue else { return [] }
            return o.keys.sorted(by: { $0 < $1 }).compactMap { o[$0].flatMap(Kit.init(json:)) }
        }
        set {
            guard !newValue.isEmpty else { return setExtra(Self.kitsKey, nil) }
            var kits = JSONObject()
            for kit in newValue.sorted(by: { $0.id < $1.id }) { kits[kit.id] = kit.json }
            setExtra(Self.kitsKey, .object(kits))
        }
    }

    /// Put a key in `extra`, **rebuilding it in sorted order**. That is not tidiness. `decode` sorts
    /// what it keeps and `JSONObject` remembers insertion order and compares it, so a payload whose
    /// extra was appended to rather than re-sorted decodes unequal to itself and the round-trip test
    /// fails in a way that looks like the codec and is not. Passing nil removes the key.
    public mutating func setExtra(_ key: String, _ value: JSONValue?) {
        var pairs: [(JSString, JSONValue)] = []
        for k in extra.keys where k.string != key {
            if let v = extra[k] { pairs.append((k, v)) }
        }
        if let value { pairs.append((JSString(key), value)) }
        var next = JSONObject()
        for (k, v) in pairs.sorted(by: { $0.0 < $1.0 }) { next[k] = v }
        extra = next
    }

    /// A property-list dictionary, ready for `WCSession.updateApplicationContext`. An application
    /// context takes property-list types only and throws `WCErrorCodePayloadUnsupportedTypes`
    /// synchronously for anything else — measured — so nothing but numbers, strings, arrays and
    /// dictionaries goes in, kept keys included.
    public var dictionary: [String: Any] {
        var out: [String: Any] = [:]
        for key in extra.keys {
            let name = key.string
            guard !Self.knownKeys.contains(name), let value = extra[key],
                  let plist = Self.plist(value) else { continue }
            out[name] = plist
        }
        out["v"] = v
        out["at"] = at
        out["links"] = links.map(\.dictionary)
        return out
    }

    /// nil when the shape is not ours or `v` is from a future this build cannot read.
    ///
    /// A missing or unreadable `at` is "not ours" too, and that is deliberate: the stamp is the whole
    /// of the idempotence story, and a payload that cannot be ordered is worse than no payload at all
    /// — it would be applied on every one of the two deliveries, and again on every launch.
    public init?(dictionary d: [String: Any]) {
        guard let version = Self.int(d["v"]), version >= 1, version <= Self.version else { return nil }
        guard let stamp = Self.double(d["at"]), stamp.isFinite else { return nil }
        // An **empty** links array is a real state — the phone holds no lists — but a *missing* one
        // is a shape we do not recognise, and the two must not be read as the same thing.
        guard let raw = d["links"] as? [Any] else { return nil }
        self.v = version
        self.at = stamp
        // An entry this build cannot read is skipped rather than fatal: a later build may put a link
        // kind on the wire that a wrist running this one has no way to open, and the rest of the
        // person's lists should still arrive.
        self.links = raw.compactMap { ($0 as? [String: Any]).flatMap(WatchLink.init(dictionary:)) }
        // Sorted, and that is not cosmetic. A Swift Dictionary iterates in an order that varies per
        // process, `JSONObject` remembers insertion order, and its `==` compares that order — so an
        // unsorted loop here makes two decodes of the same bytes unequal about a third of the time.
        // The nested helper already sorts for exactly this reason; the top level has to as well.
        var kept = JSONObject()
        for (key, value) in d.sorted(by: { $0.key < $1.key }) where !Self.knownKeys.contains(key) {
            guard let json = Self.json(value) else { continue }
            kept[key] = json
        }
        self.extra = kept
    }

    // ---------------------------------------------------------------- property list ⇄ JSON

    /// A property-list value read as JSON. `NSNumber` carries booleans as well as numbers on this
    /// platform, so the boolean has to be asked for by its CoreFoundation type or `true` comes back
    /// as `1` and does not survive a round trip. Dates and data have no JSON spelling and are
    /// dropped: they are not shapes this channel has ever carried, and inventing an encoding for
    /// them here would be inventing half of a contract.
    static func json(_ value: Any) -> JSONValue? {
        if let n = value as? NSNumber {
            if CFGetTypeID(n) == CFBooleanGetTypeID() { return .bool(n.boolValue) }
            return .number(n.doubleValue)
        }
        if let s = value as? String { return .string(s) }
        if let a = value as? [Any] {
            let mapped = a.compactMap(json)
            guard mapped.count == a.count else { return nil }
            return .array(mapped)
        }
        if let o = value as? [String: Any] {
            var out = JSONObject()
            for (k, v) in o.sorted(by: { $0.key < $1.key }) {
                guard let j = json(v) else { return nil }
                out[k] = j
            }
            return .object(out)
        }
        return nil
    }

    /// The way back. `null` has no property-list spelling, so a kept key holding one is dropped on
    /// the next encode rather than sent as something it is not.
    static func plist(_ value: JSONValue) -> Any? {
        switch value {
        case .null: return nil
        case .bool(let b): return b
        case .number(let d): return d
        case .string(let s): return s.string
        case .array(let a):
            let mapped = a.compactMap(plist)
            return mapped.count == a.count ? mapped : nil
        case .object(let o):
            var out: [String: Any] = [:]
            for key in o.keys {
                guard let v = o[key], let p = plist(v) else { return nil }
                out[key.string] = p
            }
            return out
        }
    }

    static func int(_ value: Any?) -> Int? {
        guard let n = value as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID() else { return nil }
        let d = n.doubleValue
        guard d.isFinite, d == d.rounded(.towardZero) else { return nil }
        return n.intValue
    }

    static func double(_ value: Any?) -> Double? {
        guard let n = value as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID() else { return nil }
        return n.doubleValue
    }
}

/// What to do with a payload that arrived: the same shape as `VaultPlan`, for the same reason.
public struct WatchLinkPlan: Sendable, Equatable {
    /// Links to write into the Watch's own Keychain (new ones, and ones whose details moved).
    public var upsert: [VaultedLink] = []
    /// Ids to drop, because the phone no longer names them.
    public var remove: [String] = []
    /// The Secret kits the Watch should hold once the plan is applied, by id. **Empty means hold
    /// none**, which is the same authority rule the links get: the phone is the only thing that
    /// says what this Watch has, so re-locking on the phone reaches the wrist by this line and no
    /// other. It only means anything when `applied` is true.
    public var kits: [Kit] = []
    /// The id the Watch should be showing once the plan is applied, nil when there is nothing to show.
    public var select: String? = nil
    /// false = the payload was stale, unreadable or absent. Nothing else in the plan means anything.
    public var applied = false
    /// The new high-water mark when applied.
    public var appliedAt: Double = 0

    public init() {}
}

public enum WatchLinkReconciler {

    /// The Watch has heard nothing until the phone says so. A payload is applied ONLY when its `at`
    /// is strictly newer than `lastAppliedAt` — which makes the doubled delivery free and
    /// out-of-order delivery safe. An empty `links` array is a real state and means the phone holds
    /// no lists; silence is not.
    ///
    /// That last sentence is the trap that cost Phase 2 its worst bug, one client along: reading "the
    /// registry is empty" as "the store is gone". Here it is cheaper to avoid than it was on the
    /// phone, because the phone always sends a *stamped* payload — so "no links" is something it
    /// said, and a Watch that has heard nothing has no stamp and changes nothing.
    public static func reconcile(payload: WatchLinkPayload?,
                                 lastAppliedAt: Double,
                                 vault: [VaultedLink],
                                 selected: String?,
                                 now: Double = CalendarDates.now()) -> WatchLinkPlan {
        var plan = WatchLinkPlan()
        // Silence, a shape we could not read, or a stamp we have already passed. All three are the
        // same answer — change nothing — and only the last of them is a payload at all.
        guard let payload, payload.at > lastAppliedAt else { return plan }

        plan.applied = true
        plan.appliedAt = payload.at
        // The Secret kits, under exactly the links' rule: what the phone names is what this Watch
        // holds, and a payload that names none takes away the ones it holds. A phone that never
        // unlocked them has never sent the key, so this is empty and stays empty.
        plan.kits = payload.secretKits

        var byId: [String: VaultedLink] = [:]
        for link in vault { byId[link.id] = link }
        var named = Set<String>()

        for link in payload.links {
            guard !named.contains(link.id) else { continue }   // a repeated id is one link, the first
            named.insert(link.id)
            if var existing = byId[link.id] {
                // Only what the phone actually says about a link may move. `addedAt` is the Watch's
                // own record of when it first held the secret and is not the phone's to reset.
                let changed = existing.mode != link.mode || existing.origin != link.origin
                    || existing.nickname != link.nickname || existing.name != link.name
                existing.mode = link.mode
                existing.origin = link.origin
                existing.nickname = link.nickname
                existing.name = link.name
                existing.lastSeenAt = now
                if changed { plan.upsert.append(existing) }
            } else {
                var fresh = link.vaulted
                fresh.addedAt = now
                fresh.lastSeenAt = now
                plan.upsert.append(fresh)
            }
        }

        // The phone is the only authority on what this Watch holds, so a link it does not name is
        // gone: *Remove from this device* on the phone reaches the wrist by this line and no other.
        for link in vault where !named.contains(link.id) {
            plan.remove.append(link.id)
        }
        plan.remove.sort { JSString($0) < JSString($1) }

        // The list on screen stays on screen while the phone still names it; otherwise the Watch
        // falls to the first link the phone sent, which is the phone's own order.
        if let selected, named.contains(selected) {
            plan.select = selected
        } else {
            plan.select = payload.links.first?.id
        }
        return plan
    }
}
