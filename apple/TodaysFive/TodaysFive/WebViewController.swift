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

    private var webView: WKWebView!
    private let haptics = Haptics()
    private let vault: any LinkVault = KeychainLinkVault()

    private var urlObservation: NSKeyValueObservation?
    private var themeObservation: NSKeyValueObservation?
    private var statusBarStyle: UIStatusBarStyle = .lightContent
    private var restoreAttempted = false
    private var bridgeReady = false

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
        if ProcessInfo.processInfo.arguments.contains("-TFWipeWebStore") { wipeWebStoreThenLoad(); return }
        if ProcessInfo.processInfo.arguments.contains("-TFWipeVault") { try? (vault as? KeychainLinkVault)?.removeAll() }
        #endif

        webView.load(URLRequest(url: Self.siteURL))
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
        // The async evaluateJavaScript returns a non-optional Any and *throws* when the script
        // evaluates to null — which is exactly what getItem returns on a device that has never held
        // a list. So the script always answers with a string, and "" is the absent case.
        let js = "(function(){try{var v=localStorage.getItem('tf/v2/meta');"
               + "return typeof v==='string'?v:'';}catch(e){return '';}})()"
        let registry: String?
        do {
            let value = try await webView.evaluateJavaScript(js, in: nil, contentWorld: .defaultClient)
            let text = (value as? String) ?? ""
            registry = text.isEmpty ? nil : text
        } catch {
            log("registry: unreadable")
            return
        }

        do {
            let current = try vault.all()
            let plan = VaultReconciler.reconcile(registryJSON: registry, vault: current)
            for link in plan.upsert { try vault.put(link) }
            for id in plan.remove { try vault.remove(id: id) }
            if !plan.upsert.isEmpty || !plan.remove.isEmpty {
                log("vault: +\(plan.upsert.count) −\(plan.remove.count)")
            }
            // The page's store is gone and the vault is not: open what the vault remembers, so a
            // wiped web store loses nothing. Once only — the restored load has a registry of its own.
            if plan.registryMissing, let restore = plan.restore, !restoreAttempted {
                restoreAttempted = true
                log("vault: restoring a list the web store had lost")
                let url = Self.siteURL.absoluteString + Links.fragment(id: restore.id, mode: restore.mode)
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
            webView.load(URLRequest(url: Self.siteURL))
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
