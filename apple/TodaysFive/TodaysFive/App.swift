// App.swift — the whole of the app's lifecycle. One window, one view controller, one web view — and, since 1.12
// b405, a second scene for a connected screen (ExternalDisplay.swift) and the door the widgets' intents knock on.
//
// Nothing here has a settings screen, a menu, a tab bar or chrome of its own: the app is the live
// site plus haptics, a link vault and universal links. COMPATIBILITY.md §7 — the rail, Today, ⋯ and
// Settings gain nothing.
import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     configurationForConnecting connecting: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        if connecting.role == .windowExternalDisplayNonInteractive {
            let config = UISceneConfiguration(name: "External", sessionRole: connecting.role)
            config.delegateClass = ExternalDisplaySceneDelegate.self
            return config
        }
        let config = UISceneConfiguration(name: "Default", sessionRole: connecting.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

final class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private let root = WebViewController()

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession,
               options: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = root
        window.makeKeyAndVisible()
        self.window = window
        // what an intent that opened the app asked for — the composer — once there is a screen to show it on
        AppDoor.shared.answer { [root] knock in root.answer(knock) }

        // a universal link or a URL that started the app
        for activity in options.userActivities where activity.activityType == NSUserActivityTypeBrowsingWeb {
            if let url = activity.webpageURL { root.open(url) }
        }
        if let url = options.urlContexts.first?.url { root.open(url) }
    }

    /// A universal link tapped while the app is already running.
    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let url = userActivity.webpageURL else { return }
        root.open(url)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let url = URLContexts.first?.url { root.open(url) }
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        root.cameToForeground()
    }

    /// 1.12 b293: the app switcher's picture is a card, not the list (WebViewController).
    func sceneWillResignActive(_ scene: UIScene) {
        root.coverForSwitcher()
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        root.uncoverForSwitcher()
    }

    /// 1.12 b405: the widgets are read once more on the way out, so they show the list where it was left.
    func sceneDidEnterBackground(_ scene: UIScene) {
        root.goingAway()
    }
}
