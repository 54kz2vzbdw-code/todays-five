// WatchSnapshot.swift — what the Watch app leaves in the App Group for the complication, and the
// only thing the two processes share.
//
// The obvious design was to link `TodaysFiveCore` into the widget extension and read the store's own
// record out of the group. It was rejected: a widget has a small memory budget and no business
// holding somebody's list, and the narrower the thing in the shared container, the less there is to
// leak. So this is five numbers and two strings, Foundation only, and the extension depends on no
// package at all.
//
// The secrets are not here and never will be. The Keychain items stay in the Watch app's own
// keychain, which is not in the group and which the extension cannot reach — it has no reason to,
// because it never talks to the server.
//
// COMPATIBILITY.md §3's rule about a shape two builds exchange holds here as much as it does on the
// wire: `v` says which build wrote the file, a field that is missing gets its default when it is
// read, and a `v` from a future this build cannot read is refused rather than guessed at. Two
// processes from the *same* build normally write and read this, but "normally" is doing a lot of
// work in that sentence — an extension can outlive an app update by a launch.
//
// **Phase 4 added `kit`, `pair` and `face` and did not touch `v`.** That is §3's rule applied to a file
// rather than to the wire, and it is the whole reason the rule exists: `read()` already defaults
// every field it cannot find, so an extension from build 158 reading a snapshot from build 200 gets
// `kit: ""` and draws the way it always did, and an extension from build 200 reading build 158's
// snapshot gets the same. Bumping `version` would have made the first of those two a refusal — the
// face would have gone to its placeholder — to announce a field that older code does not read.
// The shape only grows.
import Foundation
import CoreText

/// The App Group both the Watch app and the complication are entitled to.
///
/// `containerURL(forSecurityApplicationGroupIdentifier:)` returns nil **silently** when the
/// entitlement is not in the running binary, which is why everything here has to decide what to do
/// about nil rather than force-unwrap it.
enum WatchGroup {
    static let identifier = "group.com.pricebrannen.todaysfive"

    static var container: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: identifier)
    }
}

/// One glance at the list, as of `at`.
struct WatchSnapshot: Sendable, Equatable {
    static let version = 1

    /// False when no phone has named a list yet. Telling that apart from a list with nothing on it
    /// matters: one says "open a list on your iPhone" and the other says the day is clear, and a
    /// complication that shows the wrong one is telling somebody something untrue about their day.
    var hasList = false
    /// The list's nickname when the phone gave it one, else the document's own name.
    var name = ""
    var done = 0
    var total = 0
    /// The first undone line on Today, "" when there is none. Someone's words — which is exactly why
    /// the rectangular complication that shows them is opt-in.
    var next = ""
    /// A view link cannot be changed, and nothing on the face should imply otherwise.
    var viewOnly = false
    /// When the Watch app wrote this, in milliseconds.
    var at: Double = 0
    /// The list's next midnight in its **home zone**, in milliseconds — the moment rollover empties
    /// Today. 0 when it could not be worked out. This is what lets the timeline carry a second entry
    /// and be right through the night with nothing running; see `ComplicationsProvider`.
    var rollsAt: Double = 0
    /// The kit the Watch is showing, by id — `"paper"`, `"terminal"`, and the two Secret ids too,
    /// which are ids and not the word that unlocks them. "" when the app has never published.
    ///
    /// The face cannot use a kit's **colours** (see the paragraph at the top of `Complications.swift`),
    /// so this is here for what it *can* use: which glyph, which shape, and — with `pair` — which
    /// face to set the count in.
    var kit = ""
    /// The kit's font pair id — `"lato"`, `"mono"`. Sent beside `kit` rather than looked up from it
    /// because the extension does not link `TodaysFiveCore` and has no table to look it up in.
    var pair = ""
    /// The **PostScript name** of the face the count is set in, resolved by the app out of the
    /// generated table — `"Lato-Black"`, `"IBMPlexMono-SemiBold"`.
    ///
    /// It is here because `pair` on its own is *not actionable in the extension*: mapping `"lato"`
    /// to `"Lato-Black"` needs the generated table, the extension does not link `TodaysFiveCore`,
    /// and a hand-written copy of that mapping in the appex is precisely the second copy of
    /// generated data this project spends `KitsGen` to avoid. `pair` still travels — it is what a
    /// log, a future reader and a person diffing two snapshots want — but `face` is what draws.
    var face = ""

    init() {}

    init(hasList: Bool, name: String, done: Int, total: Int, next: String,
         viewOnly: Bool, at: Double, rollsAt: Double,
         kit: String = "", pair: String = "", face: String = "") {
        self.hasList = hasList
        self.name = name
        self.done = done
        self.total = total
        self.next = next
        self.viewOnly = viewOnly
        self.at = at
        self.rollsAt = rollsAt
        self.kit = kit
        self.pair = pair
        self.face = face
    }

    // ---------------------------------------------------------------- the file

    static var fileURL: URL? { WatchGroup.container?.appendingPathComponent("snapshot.json") }

    /// nil when there is no container (no entitlement in this binary), no file yet, or a file this
    /// build cannot read. All three mean the same thing to a complication — show the placeholder —
    /// and none of them is worth a different answer.
    static func read() -> WatchSnapshot? {
        guard let url = fileURL, let data = try? Data(contentsOf: url) else { return nil }
        guard let o = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return nil }
        guard let v = o["v"] as? Int, v >= 1, v <= version else { return nil }
        var s = WatchSnapshot()
        s.hasList = o["hasList"] as? Bool ?? false
        s.name = o["name"] as? String ?? ""
        s.done = (o["done"] as? NSNumber)?.intValue ?? 0
        s.total = (o["total"] as? NSNumber)?.intValue ?? 0
        s.next = o["next"] as? String ?? ""
        s.viewOnly = o["viewOnly"] as? Bool ?? false
        s.at = (o["at"] as? NSNumber)?.doubleValue ?? 0
        s.rollsAt = (o["rollsAt"] as? NSNumber)?.doubleValue ?? 0
        s.kit = o["kit"] as? String ?? ""
        s.pair = o["pair"] as? String ?? ""
        s.face = o["face"] as? String ?? ""
        return s
    }

    /// Atomic, because a widget may be reading the file at the moment the app writes it and half a
    /// JSON document is not a snapshot.
    func write() throws {
        guard let url = Self.fileURL else { return }
        let o: [String: Any] = [
            "v": Self.version, "hasList": hasList, "name": name, "done": done, "total": total,
            "next": next, "viewOnly": viewOnly, "at": at, "rollsAt": rollsAt,
            "kit": kit, "pair": pair, "face": face
        ]
        let data = try JSONSerialization.data(withJSONObject: o, options: [.sortedKeys])
        try data.write(to: url, options: .atomic)
    }

    // ---------------------------------------------------------------- reading it

    /// `3/5` — the inline complication, whole.
    var fraction: String { "\(done)/\(total)" }

    /// What Today looks like after the list's next midnight, worked out rather than stored.
    ///
    /// Rollover files every line finished on an earlier day into History and tombstones it, and
    /// leaves the undone lines where they are. So at midnight the done count goes to zero and the
    /// total drops by exactly the number that were done — which the extension can work out from what
    /// it already holds, with no second write from an app that by then is not running. A recurring
    /// line that comes *back* at midnight is not modelled: the face under-counts by one for a
    /// morning rather than over-counting, and the app corrects it on the next launch.
    var afterRollover: WatchSnapshot {
        var out = self
        out.done = 0
        out.total = total - done
        out.at = rollsAt
        out.rollsAt = 0
        return out
    }
}

// ---------------------------------------------------------------- the kit's type, on the face

/// **The complication's fonts, without duplicating a single byte of them.**
///
/// The stated problem was: "the appex is a separate bundle with its own Info.plist and its own
/// Resources phase, so the Watch app's fonts are NOT visible to it", and the stated price was 1.5 MB
/// and 33 more build entries. The first half is true and was verified on the built product — 33
/// `.ttf` in `TodaysFiveWatch.app`, **zero** in `PlugIns/TodaysFiveComplications.appex`. The second
/// half does not follow, and this is why:
///
/// ```
/// TodaysFiveWatch.app/                 ← the 33 .ttf are here
///   PlugIns/
///     TodaysFiveComplications.appex/   ← Bundle.main, inside the extension
/// ```
///
/// An extension's bundle is *inside* its containing app's bundle. Two `deletingLastPathComponent()`
/// from `Bundle.main.bundleURL` and the fonts are right there, on the same disk, in the same signed
/// container, readable — no copy, no `UIAppFonts` entry, no second Resources phase.
/// `CTFontManagerRegisterFontsForURL(_:.process:_:)` then makes them resolvable for the life of the
/// process, which is exactly as long as a widget rendering lasts.
///
/// **What was actually observed, and what was not.** Everything up to the last link was run on the
/// simulator, from the Watch app, against the real `.appex` URL — the path resolves, all 33 files
/// are found, registration returns true, and `CTFontCreateWithName` hands back the PostScript name
/// it was asked for rather than a fallback's. What could **not** be observed is a complication
/// actually drawing on a face: that needs the face editor, and `simctl` cannot tap a watch
/// simulator. So the extension asks for the face and **falls back to the system font when it does
/// not resolve** — which costs nothing if the last link turns out to be closed, and is the reason
/// this is shipped rather than deferred.
///
/// It lives in the shared file, and not in `Complications.swift`, so that the Watch app can run the
/// *same* code against the extension's own bundle URL. A probe that tests a second copy of the thing
/// proves nothing about the first.
enum WatchFaceType {

    /// The bundle that holds the fonts: this bundle, or — inside an `.appex` — the app two
    /// directories up. Takes a URL rather than reading `Bundle.main` so the app can hand it the
    /// extension's own URL and exercise the extension's path exactly.
    static func fontsBundleURL(for bundleURL: URL) -> URL {
        guard bundleURL.pathExtension == "appex" else { return bundleURL }
        // …/TodaysFiveWatch.app/PlugIns/X.appex → …/TodaysFiveWatch.app
        return bundleURL.deletingLastPathComponent().deletingLastPathComponent()
    }

    /// Register every `.ttf` beside the app. Returns how many were registered, or were already
    /// registered — which is not a failure and is the normal answer inside the app itself, where
    /// `UIAppFonts` got there first.
    @discardableResult
    static func register(in bundleURL: URL = Bundle.main.bundleURL) -> Int {
        let root = fontsBundleURL(for: bundleURL)
        let files = (try? FileManager.default.contentsOfDirectory(at: root,
                                                                  includingPropertiesForKeys: nil))?
            .filter { $0.pathExtension.lowercased() == "ttf" } ?? []
        guard !files.isEmpty else { return 0 }
        // One file at a time, through the **singular** call. The plural `…ForURLs` is deprecated on
        // watchOS (2.0 → 6.0) and its replacement `CTFontManagerRegisterFontURLs` is asynchronous,
        // with a completion handler — the wrong shape for a function whose whole job is to have
        // finished before the first glyph is drawn. `CTFontManagerRegisterFontsForURL` is deprecated
        // nowhere, is synchronous, and is the one this round measured taking all 33 faces.
        //
        // A file already registered answers `false` with `kCTFontManagerErrorAlreadyRegistered`,
        // which is every one of them inside the app itself, where `UIAppFonts` got there first. That
        // is not a failure, so the count returned is how many faces are on disk at the path the
        // extension computed — the only number this can honestly report from either process.
        for url in files {
            var error: Unmanaged<CFError>?
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error)
            error?.release()
        }
        return files.count
    }

    /// True when CoreText hands back the name it was asked for. A missing custom font resolves to
    /// the system face **with no log and no error** — the same silence `-TFFontSelfTest` exists for
    /// — so this is the only way to tell "the kit's type" from "Helvetica wearing its name".
    static func resolves(_ postScriptName: String) -> Bool {
        guard !postScriptName.isEmpty else { return false }
        let font = CTFontCreateWithName(postScriptName as CFString, 16, nil)
        return (CTFontCopyPostScriptName(font) as String) == postScriptName
    }

    /// The PostScript names of the `.ttf` beside the app, read **out of the files themselves**.
    ///
    /// This is the check `resolves(_:)` cannot be, and the difference matters inside the app: there
    /// the 33 faces are already registered by `UIAppFonts`, so `resolves` would answer yes whether
    /// or not the extension's path to them works. `CTFontManagerCreateFontDescriptorsFromURL` opens
    /// the file at the URL that was computed and reads its name, which is exactly the question —
    /// *is the extension's arithmetic pointing at real fonts* — with the app's own registration
    /// taken out of the answer.
    static func facesOnDisk(in bundleURL: URL) -> [String] {
        let root = fontsBundleURL(for: bundleURL)
        let files = (try? FileManager.default.contentsOfDirectory(at: root,
                                                                  includingPropertiesForKeys: nil))?
            .filter { $0.pathExtension.lowercased() == "ttf" }.sorted(by: { $0.path < $1.path }) ?? []
        var names: [String] = []
        for file in files {
            guard let descriptors = CTFontManagerCreateFontDescriptorsFromURL(file as CFURL)
                    as? [CTFontDescriptor] else { continue }
            for d in descriptors {
                if let n = CTFontDescriptorCopyAttribute(d, kCTFontNameAttribute) as? String {
                    names.append(n)
                }
            }
        }
        return names
    }
}
