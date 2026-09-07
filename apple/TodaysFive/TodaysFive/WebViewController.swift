// WebViewController.swift — one WKWebView on the live site, and the three things the web cannot do
// for itself: haptics, a link vault, and links that open here.
//
// The site is loaded, never bundled. The web ships weekly; a copy in the bundle would need an app
// build per round and would be an old client most of the time.
//
// Privacy, which is not negotiable here: no URL, fragment or secret is ever printed. The logging in
// this file names events and counts and nothing else.
import UIKit
import WebKit
import TodaysFiveCore

@MainActor
final class WebViewController: UIViewController {

    static let host = "54kz2vzbdw-code.github.io"
    static let siteURL = URL(string: "https://54kz2vzbdw-code.github.io/todays-five/")!
    /// The token the page looks for in 1.10: `SHELL = / TodaysFive\//.test(navigator.userAgent)`.
    /// A user-agent token rather than an injected flag, so the site's strict CSP and the content
    /// world it would have to be injected into never come into it.
    static let userAgentToken = "TodaysFive/1"

    /// Where the first load goes. Always the site in a release build. `-TFQuery <query>` in a debug
    /// build appends a query to it — `?transport=local` puts the page on its own localStorage-backed
    /// test server, which is how the simulator checks run without spending from the real backend's
    /// create limit (twelve new lists an hour per address, shared with every other suite).
    /// Same host either way, so app-bound domains is untouched.
    static var startURL: URL {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-TFQuery"), i + 1 < args.count,
           let url = URL(string: siteURL.absoluteString + "?" + args[i + 1]) {
            return url
        }
        #endif
        return siteURL
    }

    private var webView: WKWebView!
    private let haptics = Haptics()
    private let vault: any LinkVault = KeychainLinkVault()

    private var urlObservation: NSKeyValueObservation?
    private var themeObservation: NSKeyValueObservation?
    private var statusBarStyle: UIStatusBarStyle = .lightContent
    private var restoreAttempted = false
    private var bridgeReady = false
    /// A read can land before the document has an origin; one retry covers it without a loop.
    private var retriesLeft = 2

    override var preferredStatusBarStyle: UIStatusBarStyle { statusBarStyle }

    // ---------------------------------------------------------------- setup

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0x1A / 255, green: 0x1D / 255, blue: 0x21 / 255, alpha: 1)

        webView = WKWebView(frame: .zero, configuration: makeConfiguration())
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        webView.backgroundColor = view.backgroundColor
        webView.scrollView.backgroundColor = view.backgroundColor
        // the page has its own Back stack and its own Escape; a back-swipe would fight them
        webView.allowsBackForwardNavigationGestures = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.pinchGestureRecognizer?.isEnabled = false
        webView.scrollView.bouncesZoom = false

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

        observeWebView()
        prepareHapticsOnTouchDown()
        Audio.begin()

        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-TFWipeVault") { try? (vault as? KeychainLinkVault)?.removeAll() }
        if ProcessInfo.processInfo.arguments.contains("-TFDumpVault") { dumpVault() }
        if ProcessInfo.processInfo.arguments.contains("-TFWipeWebStore") { wipeWebStoreThenLoad(); return }
        #endif

        webView.load(URLRequest(url: Self.startURL))
    }

    private func makeConfiguration() -> WKWebViewConfiguration {
        let config = WKWebViewConfiguration()
        // The default store, so localStorage, the service worker and its caches survive relaunch.
        config.websiteDataStore = .default()
        // The load-bearing line: a service worker does not run in a WKWebView unless the domain is
        // app-bound, and the offline story *is* the service worker. Declaring WKAppBoundDomains in
        // Info.plist also means a web view without this flag loses script injection entirely — so
        // the flag is what buys back the user script and evaluateJavaScript for this one domain.
        config.limitsNavigationsToAppBoundDomains = true
        config.applicationNameForUserAgent = Self.userAgentToken
        // a check-off sounds without a fresh gesture; the page's engine still primes on first touch
        config.mediaTypesRequiringUserActionForPlayback = []

        // The bridge lives in a client content world: the site's CSP is `script-src 'self' 'sha256-…'`
        // with no unsafe-inline, and a client world is not subject to it. The DOM is shared, so an
        // event the page dispatches on window is still seen here.
        let world = WKContentWorld.defaultClient
        config.userContentController.add(self, contentWorld: world, name: "tf")
        config.userContentController.addUserScript(
            WKUserScript(source: Self.bridgeSource, injectionTime: .atDocumentStart,
                         forMainFrameOnly: true, in: world))
        return config
    }

    /// Four names, and nothing that identifies a list. `ready` carries no `tf:` prefix because it is
    /// the bridge announcing itself, not one of the page's events.
    static let bridgeSource = """
    (function () {
      var send = function (name) {
        try { window.webkit.messageHandlers.tf.postMessage(name); } catch (e) { /* nothing to do */ }
      };
      ["tf:check", "tf:uncheck", "tf:finale", "tf:shuffle"].forEach(function (name) {
        window.addEventListener(name, function () { send(name); }, { passive: true });
      });
      send("ready");
    })();
    """

    private func observeWebView() {
        // Every change of the open list: decidePolicyFor catches a navigation, this catches the
        // history.replaceState the page uses to strip /add?text= from the address bar.
        urlObservation = webView.observe(\.url, options: [.new]) { [weak self] _, change in
            guard let url = change.newValue ?? nil else { return }
            MainActor.assumeIsolated { self?.noticeLink(url) }
        }
        // The page changes its theme-color with the theme; the status bar and the safe areas follow,
        // so a light theme does not sit under a dark bar.
        themeObservation = webView.observe(\.themeColor, options: [.new, .initial]) { [weak self] webView, _ in
            MainActor.assumeIsolated { self?.applyTheme(webView.themeColor) }
        }
    }

    private func applyTheme(_ color: UIColor?) {
        guard let color else { return }
        view.backgroundColor = color
        webView.backgroundColor = color
        webView.scrollView.backgroundColor = color
        var white: CGFloat = 0, alpha: CGFloat = 0
        color.getWhite(&white, alpha: &alpha)
        statusBarStyle = white > 0.6 ? .darkContent : .lightContent
        setNeedsStatusBarAppearanceUpdate()
    }

    /// The Taptic Engine is warmed on touch-down so the first haptic of a session lands with the tap
    /// rather than after it. A zero-duration long press sees every touch and swallows none.
    private func prepareHapticsOnTouchDown() {
        let press = UILongPressGestureRecognizer(target: self, action: #selector(touchDown(_:)))
        press.minimumPressDuration = 0
        press.cancelsTouchesInView = false
        press.delaysTouchesBegan = false
        press.delaysTouchesEnded = false
        press.delegate = self
        webView.addGestureRecognizer(press)
    }

    @objc private func touchDown(_ recognizer: UILongPressGestureRecognizer) {
        if recognizer.state == .began { haptics.prepare() }
    }

    // ---------------------------------------------------------------- links in

    /// A universal link, or a URL handed to the app. Vault it, then let the page have it whole —
    /// /add?text=, /mine and /shared pass through untouched, because the page handles them.
    func open(_ url: URL) {
        guard url.host == Self.host else { return }
        noticeLink(url)
        webView.load(URLRequest(url: url))
    }

    /// Learn a link the app saw go by. Parsed with the core's own parser — the same one the web uses.
    private func noticeLink(_ url: URL) {
        guard url.host == Self.host, let parsed = Links.parseLink(url.absoluteString) else { return }
        do {
            let current = try vault.all()
            if let write = VaultReconciler.seen(parsed, vault: current) {
                try vault.put(write)
                log("vault: kept a link")
            }
        } catch {
            log("vault: could not write")
        }
    }

    // ---------------------------------------------------------------- the page's registry

    func cameToForeground() {
        Task { await reconcileVault() }
    }

    /// Read `tf/v2/meta` — storage this app already hosts — and make the vault agree with it. No
    /// bridge message, no web change, no new contract: the page's *Remove from this device* and
    /// *Delete this list* are observed rather than relayed.
    private func reconcileVault() async {
        // Two things come back in one read, because they have to be read together (see
        // `VaultReconciler.reconcile`): the registry, and the app's own mark saying it has
        // reconciled against this store before.
        //
        // Three answers for the registry, not two. `localStorage` throws a SecurityError on a
        // document that has no real origin yet — which is what the first load looks like for a
        // moment — and reading that as "the store is gone" would make the app navigate away from the
        // page the person is on. The async evaluateJavaScript also throws when the script evaluates
        // to null, so the script never returns one: "e" it threw, then "s"/"n" for the mark, then
        // "a" the registry key is absent or "p…" its value.
        let js = "(function(){try{var v=localStorage.getItem('tf/v2/meta');"
               + "var m=localStorage.getItem('\(VaultReconciler.markKey)')==='1'?'s':'n';"
               + "return typeof v==='string'?m+'p'+v:m+'a';}catch(e){return 'e';}})()"
        var registry: RegistryRead = .unreadable
        var storeSeenBefore = false
        if let answer = (try? await webView.evaluateJavaScript(js, in: nil, contentWorld: .defaultClient)) as? String,
           answer.count > 1 {
            storeSeenBefore = answer.hasPrefix("s")
            let rest = answer.dropFirst()
            if rest == "a" { registry = .absent }
            else if rest.hasPrefix("p") { registry = .present(String(rest.dropFirst())) }
        }

        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-TFDumpVault") {
            var shape = "unreadable"
            if registry == .absent { shape = "absent" }
            else if case let .present(value) = registry {
                if let meta = (try? JSONReader.parse(value))?.objectValue {
                    shape = "\((meta["lists"]?.arrayValue ?? []).count) list(s)"
                } else { shape = "not an object" }
            }
            log("read: registry=\(shape) mark=\(storeSeenBefore ? "there" : "gone")")
        }
        #endif

        do {
            let current = try vault.all()
            let plan = VaultReconciler.reconcile(registry: registry, storeSeenBefore: storeSeenBefore,
                                                 vault: current)
            if plan.unreadable {
                // Not a decision, just a moment too early. One retry, then leave it to the next
                // navigation or the next time the app comes forward.
                log("registry: unreadable")
                if retriesLeft > 0 {
                    retriesLeft -= 1
                    try? await Task.sleep(for: .milliseconds(700))
                    await reconcileVault()
                }
                return
            }
            retriesLeft = 2
            for link in plan.upsert { try vault.put(link) }
            for id in plan.remove { try vault.remove(id: id) }
            if !plan.upsert.isEmpty || !plan.remove.isEmpty {
                log("vault: +\(plan.upsert.count) −\(plan.remove.count)")
            }
            // The mark is written *after* the plan is applied, so a crash in between leaves the
            // cautious answer (an unmarked store removes nothing) rather than the destructive one.
            if plan.markStore {
                _ = try? await webView.evaluateJavaScript(
                    "(function(){try{localStorage.setItem('\(VaultReconciler.markKey)','1');}catch(e){}return 1;})()",
                    in: nil, contentWorld: .defaultClient)
            }
            // The page's store is gone and the vault is not: open what the vault remembers, so a
            // wiped web store loses nothing. Once only — the restored load has a registry of its own.
            if let restore = plan.restore, !restoreAttempted {
                restoreAttempted = true
                log("vault: restoring a list the web store had lost")
                // startURL, not siteURL: a debug run pointed at ?transport=local must stay there,
                // or the restore quietly moves the page to the real backend
                let url = Self.startURL.absoluteString + Links.fragment(id: restore.id, mode: restore.mode)
                if let target = URL(string: url) { webView.load(URLRequest(url: target)) }
            }
        } catch {
            log("vault: could not reconcile")
        }
    }

    // ---------------------------------------------------------------- debug helpers

    #if DEBUG
    /// `-TFSelfTest` — the bridge, end to end, on the real page under its real CSP.
    ///
    /// The events are dispatched in the **page** world, exactly as app.js will dispatch them from
    /// 1.10, and the listener that has to hear them lives in the **client** world. That crossing is
    /// the one thing about this design that could not be settled by reading: a user script in the
    /// page world might be refused by `script-src 'self' 'sha256-…'`, and a client world is only
    /// worth using if a `window` event still reaches it. This answers both.
    private func runSelfTest() async {
        let before = haptics.counts
        for moment in Haptics.Moment.allCases {
            _ = try? await webView.evaluateJavaScript(
                "window.dispatchEvent(new CustomEvent('\(moment.rawValue)')); 1",
                in: nil, contentWorld: .page)
        }
        try? await Task.sleep(for: .milliseconds(400))
        let fired = Haptics.Moment.allCases.filter { (haptics.counts[$0] ?? 0) > (before[$0] ?? 0) }
        log("selftest: bridge=\(bridgeReady ? "ready" : "SILENT") heard=\(fired.count)/4 \(haptics.tally)")
        log("selftest: finale pattern \(haptics.finaleSelfCheck())") // 1.12: the volley's rhythm, built even where it cannot be felt

        // and what the page will key on in 1.10
        let ua = (try? await webView.evaluateJavaScript(
            "/ TodaysFive\\//.test(navigator.userAgent)", in: nil, contentWorld: .page)) as? Bool
        let store = (try? await webView.evaluateJavaScript(
            "(function(){try{return typeof localStorage.getItem('tf/v2/meta');}catch(e){return 'blocked';}})()",
            in: nil, contentWorld: .defaultClient)) as? String
        log("selftest: registryReadableFromClientWorld=\(store ?? "threw")")
        let sw = (try? await webView.evaluateJavaScript(
            "!!(navigator.serviceWorker && navigator.serviceWorker.controller)", in: nil, contentWorld: .page)) as? Bool
        let standalone = (try? await webView.evaluateJavaScript(
            "matchMedia('(display-mode: standalone)').matches || navigator.standalone === true",
            in: nil, contentWorld: .page)) as? Bool
        log("selftest: shellToken=\(ua ?? false) serviceWorker=\(sw ?? false) standaloneSeenByPage=\(standalone ?? false)")
    }
    #endif

    #if DEBUG
    private func wipeWebStoreThenLoad() {
        let types = WKWebsiteDataStore.allWebsiteDataTypes()
        WKWebsiteDataStore.default().removeData(ofTypes: types, modifiedSince: .distantPast) { [weak self] in
            guard let self else { return }
            log("debug: web store wiped")
            webView.load(URLRequest(url: Self.startURL))
        }
    }
    #endif

    #if DEBUG
    /// `-TFDumpVault` — the vault's *shape*, so a check can say a View link was kept as a View link.
    /// Never the id: a list id is its secret, and the length is all that is ever printed of one.
    private func dumpVault() {
        guard let links = try? vault.all() else { log("vault: unreadable"); return }
        log("vault: \(links.count) link\(links.count == 1 ? "" : "s")")
        for link in links.sorted(by: { $0.addedAt < $1.addedAt }) {
            log("  · mode=\(link.mode.rawValue) origin=\(link.origin) seen=\(link.seenInRegistry) id=\(link.id.count) chars")
        }
    }
    #endif

    /// Never takes a URL, a fragment or a secret. The one rule this file cannot bend.
    private func log(_ message: String) {
        #if DEBUG
        print("[tfive] \(message)")
        #endif
    }
}

// ---------------------------------------------------------------- navigation

extension WebViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping @MainActor (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { return decisionHandler(.cancel) }
        if url.host == Self.host {
            noticeLink(url)
            return decisionHandler(.allow)
        }
        // anything off the site — About's GitHub link — belongs in Safari
        if navigationAction.navigationType == .linkActivated || navigationAction.targetFrame == nil {
            UIApplication.shared.open(url)
        }
        decisionHandler(.cancel)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        Task {
            await reconcileVault()
            #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("-TFSelfTest") { await runSelfTest() }
            #endif
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
                 withError error: Error) {
        // Offline with nothing cached: the service worker answers when it can, and there is nothing
        // useful to say here that the page does not say better.
        log("navigation: failed to start")
    }
}

extension WebViewController: WKUIDelegate {
    /// `target="_blank"` — open it in Safari and give the page no second web view.
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url, url.host != Self.host {
            UIApplication.shared.open(url)
        }
        return nil
    }
}

// ---------------------------------------------------------------- the bridge

extension WebViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard let name = message.body as? String else { return }
        if name == "ready" {
            bridgeReady = true
            log("bridge: ready")
            return
        }
        guard let moment = Haptics.Moment(rawValue: name) else { return }
        haptics.play(moment)
        log("haptic: \(haptics.tally)")
    }
}

extension WebViewController: UIGestureRecognizerDelegate {
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer,
                           shouldRecognizeSimultaneouslyWith other: UIGestureRecognizer) -> Bool {
        true
    }
}
