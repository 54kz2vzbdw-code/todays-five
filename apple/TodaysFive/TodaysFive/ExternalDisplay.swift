// ExternalDisplay.swift — the TV. When the iPhone is connected to a screen (AirPlay to an Apple TV, or a cable), the
// screen shows the list open on the phone as the kitchen display, and the phone stays the remote: cross a line off on
// the phone and the screen plays it, the way a kitchen display plays any device's check-off.
//
// The screen is a second web view on the same site, the same storage and the same service worker, asked for with
// `?kitchen=screen` — the page's own kitchen display, told that nobody can touch it (no way out to show, no ask for
// sound). It carries no bridge: the haptics are the phone's, and a check-off the screen celebrates is one the phone
// has already felt. While it is connected the phone does not sleep, or the screen would go with it.
import TodaysFiveCore
import UIKit
import WebKit

extension Notification.Name {
    /// The phone opened another list; the screen follows it.
    static let tfOpenListChanged = Notification.Name("tf.openListChanged")
}

final class ExternalDisplaySceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = KitchenScreenController()
        window.isHidden = false
        self.window = window
        UIApplication.shared.isIdleTimerDisabled = true
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        UIApplication.shared.isIdleTimerDisabled = false
        window = nil
    }
}

@MainActor
final class KitchenScreenController: UIViewController {
    private var webView: WKWebView!
    /// The fragment on screen, held in memory only: it is the list's link.
    private var shown: String?
    private var follow: NSObjectProtocol?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.limitsNavigationsToAppBoundDomains = true            // the service worker, as on the phone
        config.applicationNameForUserAgent = WebViewController.userAgentToken
        config.mediaTypesRequiringUserActionForPlayback = []          // nobody can tap a TV to let it play
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        view.addSubview(webView)
        load()
        follow = NotificationCenter.default.addObserver(forName: .tfOpenListChanged, object: nil, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.load() }
        }
    }

    /// The list open on the phone, as the vault holds it.
    private func load() {
        let open = UserDefaults.standard.string(forKey: AddService.openListKey)
        let link = open.flatMap { id in (try? KeychainLinkVault().all())?.first { $0.id == id } }
        let fragment = link.map { Links.fragment(id: $0.id, mode: $0.mode) } ?? ""
        guard fragment != shown else { return }
        shown = fragment
        var address = WebViewController.startURL.absoluteString
        address += (address.contains("?") ? "&" : "?") + "kitchen=screen"
        if let url = URL(string: address + fragment) { webView.load(URLRequest(url: url)) }
    }
}
