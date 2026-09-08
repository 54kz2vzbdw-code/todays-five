// WatchApp.swift — the watchOS app: one scene, one model object, two pages and a picker.
//
// Everything the app knows lives in `WatchStore`, which is put in the environment here and read by
// every view (and by Track C's add flow) from there. There is no settings screen, no Everything, no
// sections, no History, no rules, no templates and no themes: those live on a phone-sized screen
// because they need one.
//
// **The three background doors.** A complication that only refreshes while the app is running shows
// yesterday's count all morning, so: `.backgroundTask(.watchConnectivity)` wakes the app when the
// phone sends links, `.backgroundTask(.appRefresh)` is the one refresh a day the store asks for at
// the list's next midnight, and the scene becoming active is the third. Between them they are the
// recurring beat rollover hangs off — the *occasions*, never a timer, because a watchOS app is
// suspended seconds after the wrist drops and a minute tick would fail with no log at all.
import SwiftUI
import TodaysFiveCore
import WatchKit

@main
struct TodaysFiveWatchApp: App {
    @State private var store = WatchStore()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .task {
                    await store.start()
                    store.scheduleNextRefresh()
                    #if DEBUG
                    // After the first sync settles, which is what `start()` waits for.
                    if ProcessInfo.processInfo.arguments.contains("-TFWatchSelfTest") {
                        await store.runSelfTest()
                    }
                    #endif
                }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { store.sceneBecameActive() }
        }
        // A phone send wakes us; the receiver is already listening, so being awake is the whole job.
        // Rolling over and refreshing the face while we are up is free.
        .backgroundTask(.watchConnectivity) {
            await store.wokeInBackground()
        }
        .backgroundTask(.appRefresh) { _ in
            await store.wokeInBackground()
        }
    }
}

// ---------------------------------------------------------------- the root

struct RootView: View {
    @Environment(WatchStore.self) private var store
    /// The Always-On display. A five-line list lives on a wrist all day, so the dimmed frame gets a
    /// calm rendering of its own rather than the live one with its accent, its buttons and its
    /// animations — none of which mean anything on a screen nobody is looking at.
    @Environment(\.isLuminanceReduced) private var dimmed

    @State private var showPicker = false
    @State private var showAdd = false
    /// Whether the sheet was opened by the Add complication rather than by the + on Today. Cleared
    /// when the sheet closes, so the next + is an ordinary +.
    @State private var openedFromFace = false
    @State private var page = Page.today

    enum Page: Hashable { case today, oneThing }

    var body: some View {
        NavigationStack {
            content
                .navigationTitle { titleButton }
                .sheet(isPresented: $showPicker) {
                    NavigationStack { ListPickerView() }
                }
                .sheet(isPresented: $showAdd) {
                    // Track C's. This file never opens it any other way and never looks inside it.
                    // `openedFromFace` is the difference between the person tapping + on Today (where
                    // the + is the thing they aimed at) and the Add complication or Double Tap, which
                    // already said "add a line" — those land straight on dictation.
                    AddFlowView(beginImmediately: openedFromFace)
                }
                .onChange(of: showAdd) { _, open in if !open { openedFromFace = false } }
        }
        // The add flow's self-test lives here rather than in `AddFlowView`, because that view is
        // only ever inside a sheet and a sheet nobody opens proves nothing. `runIfAsked` returns at
        // once unless `-TFAddSelfTest` was passed, and it is `#if DEBUG` on the other side.
        .task { await AddSelfTest.runIfAsked() }
        .onOpenURL { url in
            // `todaysfive://add`, from the Add complication. `WKApplicationDelegate` has no
            // url-opening callback at all — the whole optional list was read — so this is the door.
            if store.wantsAddFlow(url) { openedFromFace = true; showAdd = true }
        }
    }

    @ViewBuilder
    private var content: some View {
        if !store.hasOpenList {
            EmptyStateView()
        } else if dimmed {
            AlwaysOnTodayView()
        } else {
            TabView(selection: $page) {
                TodayView(showAdd: $showAdd).tag(Page.today)
                OneThingView().tag(Page.oneThing)
            }
            .tabViewStyle(.verticalPage)
            // Double Tap should activate the `+` rather than scroll the page under it: the primary
            // action is the point of the gesture here, and `.scrollInputBehavior` is the arbiter.
            .scrollInputBehavior(.disabled, for: .handGestureShortcut)
            .onChange(of: page) { _, _ in
                // Entering or leaving one-thing mode clears the shuffle pick eagerly, as the web does.
                store.oneThingModeChanged()
            }
        }
    }

    /// watchOS has **no SwiftUI `Menu`**, so the picker cannot be a dropdown. The title itself is the
    /// button, through the watchOS-exclusive `navigationTitle { }` overload that takes a view.
    @ViewBuilder
    private var titleButton: some View {
        Button {
            showPicker = true
        } label: {
            HStack(spacing: 3) {
                Text(store.title)
                    .lineLimit(1)
                    .truncationMode(.tail)
                if store.links.count > 1 {
                    Image(systemName: "chevron.down").font(.system(size: 8, weight: .semibold))
                }
            }
            .foregroundStyle(WatchTheme.accent)
        }
        .buttonStyle(.plain)
        .disabled(store.links.count < 2)
    }
}

// ---------------------------------------------------------------- nothing to show yet

struct EmptyStateView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "iphone.gen3")
                .font(.title3)
                .foregroundStyle(WatchTheme.accent)
            Text("No list yet")
                .font(.system(.headline, design: .rounded))
            Text("Open a list in Today's Five on your iPhone and it will arrive here.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 6)
    }
}
