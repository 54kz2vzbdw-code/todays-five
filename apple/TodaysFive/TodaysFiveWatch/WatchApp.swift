// WatchApp.swift — the watchOS app's entry point. Track B replaces this with Today, one thing and
// the list picker; it is here so the target builds and embeds from the first commit of the round.
import SwiftUI
import TodaysFiveCore

@main
struct TodaysFiveWatchApp: App {
    var body: some Scene {
        WindowGroup {
            Text(verbatim: "Today's Five")
                .font(.title3)
        }
    }
}
