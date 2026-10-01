// KitFonts.swift — a kit's faces, registered for this process from the `.ttf` the iPhone app carries.
//
// Compiled into the app (the composer) and the widget extension. The extension's bundle sits inside the app's —
// `TodaysFive.app/PlugIns/TodaysFiveWidgets.appex` — so the fonts are two directories up, and there is one copy of
// them, the app's (the Watch's complication found the same path in Phase 4; WatchSnapshot.swift's WatchFaceType).
// Only the faces a kit names are registered, once each per process. A face that does not resolve falls back to the
// system's at the same size, which is what CoreText does silently anyway; `resolves` is how a check can tell.
import CoreText
import Foundation
import TodaysFiveCore

enum KitFonts {
    private static let lock = NSLock()
    nonisolated(unsafe) private static var done: Set<String> = []

    /// The app's bundle, from the app or from inside its extension.
    static func bundleURL() -> URL {
        let here = Bundle.main.bundleURL
        return here.pathExtension == "appex" ? here.deletingLastPathComponent().deletingLastPathComponent() : here
    }

    static func register(_ kit: Kit) {
        guard let type = kit.type else { return }
        let files = Set([type.task.file] + type.ui.map(\.file))
        lock.lock(); defer { lock.unlock() }
        for file in files where !done.contains(file) {
            done.insert(file)
            let url = bundleURL().appendingPathComponent(file)
            guard FileManager.default.fileExists(atPath: url.path) else { continue }
            var error: Unmanaged<CFError>?
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error)
            error?.release()
        }
    }

    /// True when CoreText hands back the face it was asked for rather than a fallback wearing its name.
    static func resolves(_ postScriptName: String) -> Bool {
        let font = CTFontCreateWithName(postScriptName as CFString, 16, nil)
        return (CTFontCopyPostScriptName(font) as String) == postScriptName
    }
}
