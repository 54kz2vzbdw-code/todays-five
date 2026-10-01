// WidgetPublisher.swift — the app's half of the widgets: what it leaves on the shelf for them, and when it asks them
// to draw again.
//
// Three things, none of them a word of anybody's list from the page:
//
//   * which lists this phone holds and which is open (`lists.json`), whenever the vault or the open list moves;
//   * the device's Day and Night themes and its switch (`look.json`), read out of the page's own theme.js — the same
//     way the Secret kits are read for the Watch — whenever the page's theme colour changes;
//   * after a change on the page (a check-off, the finale, the stamp), Today for the open list, read from the server
//     through the core once the page has pushed (sync.js pushes 250 ms after a change), and then a reload.
//
// A reload asked for while the app is in front does not count against a widget's daily budget.
import Foundation
import TodaysFiveCore
import UIKit
import WebKit
import WidgetKit

@MainActor
final class WidgetPublisher {
    static let shared = WidgetPublisher()

    /// Made when it is used, not once at launch: a debug run points the shelf at the stand-in server after the app has
    /// started (WidgetDebug.swift), and a feed made before that would read the open list from the real backend.
    private var feed: WidgetFeed { WidgetFeed.live() }
    private var changeTask: Task<Void, Never>?
    private var lookTask: Task<Void, Never>?
    private var background: UIBackgroundTaskIdentifier = .invalid

    /// The vault or the open list moved.
    func listsMoved() {
        if feed.publishIndex(openId: UserDefaults.standard.string(forKey: AddService.openListKey)) { reload() }
    }

    /// The page changed the open list. Coalesced: a run of check-offs is one read, 1.8 s after the last of them.
    func listChanged() {
        changeTask?.cancel()
        changeTask = Task { [feed] in
            try? await Task.sleep(for: .milliseconds(1800))
            guard !Task.isCancelled, let id = UserDefaults.standard.string(forKey: AddService.openListKey) else { return }
            await feed.refresh(WidgetShelf.key(for: id))
            self.reload()
        }
    }

    /// The app is going to the background: one more read of the open list, so what the widgets show is where the
    /// person left it, and a reload.
    func leaving() {
        changeTask?.cancel()
        endBackground()
        // a few seconds the system lends an app on its way out, so the read is not frozen half-way
        background = UIApplication.shared.beginBackgroundTask(withName: "tf.widgets") { [weak self] in
            MainActor.assumeIsolated { self?.endBackground() }
        }
        changeTask = Task { [feed] in
            if let id = UserDefaults.standard.string(forKey: AddService.openListKey) { await feed.refresh(WidgetShelf.key(for: id)) }
            self.reload()
            self.endBackground()
        }
    }

    private func endBackground() {
        guard background != .invalid else { return }
        UIApplication.shared.endBackgroundTask(background)
        background = .invalid
    }

    /// Read the device's two slots out of the page and leave them for the widgets. In the page's world: a dynamic
    /// import needs the page's module loader, and the module is the page's own (`?v=` its build), so this is a hit in
    /// its module map, not a fetch. Every failure leaves the last look on the shelf, or none: the widgets then wear
    /// the kits a device that never chose gets.
    func readLook(from webView: WKWebView) {
        lookTask?.cancel()
        lookTask = Task {
            try? await Task.sleep(for: .milliseconds(250)) // the theme colour moves with every frame of a crossfade
            guard !Task.isCancelled else { return }
            let answer = try? await webView.callAsyncJavaScript(Self.lookSource, arguments: [:], in: nil, contentWorld: .page)
            guard let text = answer as? String, let data = text.data(using: .utf8),
                  let o = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return }
            var look = WidgetLook()
            look.mode = o["mode"] as? String ?? "system"
            look.hand = o["hand"] as? String ?? "day"
            look.hold = o["hold"] as? String ?? ""
            look.dayAt = o["dayAt"] as? String ?? "07:00"
            look.nightAt = o["nightAt"] as? String ?? "19:00"
            look.day = WidgetKitLook(json: o["day"] as? [String: Any])
            look.night = WidgetKitLook(json: o["night"] as? [String: Any])
            guard look.day != nil || look.night != nil else { return }
            if look.write() { reload() }
        }
    }

    func reload() {
        WidgetCenter.shared.reloadAllTimelines()
        if #available(iOS 18.0, *) { ControlCenter.shared.reloadAllControls() }
    }

    /// theme.js decides what a slot's code means — a curated kit, an Extra or Secret one the device has unlocked, or
    /// a theme somebody made — and how it finishes (its line: app.js FINALE_LINES and a kit's own finaleText; its
    /// material: materialOf). A made theme has no `lean`, so its base says which way it leans.
    static let lookSource = """
    var b = document.documentElement.dataset.build || "";
    var T = await import("./theme.js" + (b ? "?v=" + b : ""));
    var meta = {}; try { meta = JSON.parse(localStorage.getItem("tf/v2/meta") || "{}") || {}; } catch (e) { meta = {}; }
    var dev = meta.device || {}, sw = dev.switch || {};
    function look(slot) {
      var t = T.parseCode(dev[slot] || T.SLOT_DEFAULT[slot]) || T.parseCode(T.SLOT_DEFAULT[slot]);
      if (!t) return null;
      var k = JSON.parse(JSON.stringify(t));
      if (!k.lean) k.lean = k.base === "light" ? "day" : "night";
      if (!k.partner) k.partner = "";
      return { kit: k, finale: t.finaleText || (t.id === "arcade" ? "Level clear." : "That's the list."), mat: T.materialOf(t) };
    }
    return JSON.stringify({ mode: sw.mode || "system", hand: dev.slot === "night" ? "night" : "day", hold: dev.holdAuto || "",
      dayAt: sw.dayAt || "07:00", nightAt: sw.nightAt || "19:00", day: look("day"), night: look("night") });
    """
}
