// WatchApp.swift — the watchOS app: one scene, one model object, two pages and a picker.
//
// Everything the app knows lives in `WatchStore`, which is put in the environment here and read by
// every view (and by Track C's add flow) from there. There is no Everything, no sections, no
// History, no rules and no templates: those live on a phone-sized screen because they need one.
//
// **There is now one settings screen, and it is the theme.** Phase 3's sentence said "no settings
// screen … and no themes"; Phase 4 reverses it for that one word and nothing else. The argument is
// in `KitPickerView`: a theme is the only item on that list that is a property of the *device* being
// looked at, and a wrist is a device. It hangs off the long press on the count, which was already
// this app's one long-press surface.
//
// **The kit.** `WatchThemeStore` resolves one kit for this device — see `WatchTheme.swift`, which
// also says why the phone's theme is deliberately not followed — and it is put in the environment
// here beside the store. Every colour and every face on every screen comes from there; nothing on
// the Watch may use `.primary`, `.secondary` or a system colour, because watchOS has no light
// appearance and those are only ever right by accident.
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
    @State private var theme = WatchThemeStore()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .environment(theme)
                .watchGround(theme.theme)
                .task {
                    // First line of the trace, in every build, so a reader of `Diagnostics` can tell
                    // a launch that did nothing from a launch that never happened — and so the build
                    // number is on the screen beside what it did, which is the one thing a report
                    // from a wrist otherwise has to be asked for twice.
                    WatchDiagnostics.shared.record(WatchDiagnostics.Code.launched,
                                                   Int(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "") ?? 0)
                    // Before the first sync, because a silent Helvetica is a thing you want told
                    // about whether or not there is a list to render in it.
                    #if DEBUG
                    theme.applyDebugArguments()
                    #endif
                    await FontSelfTest.runIfAsked(theme.available)
                    #if DEBUG
                    await ConfettiSelfTest.runIfAsked(theme.available)
                    #endif
                    await store.start()
                    store.scheduleNextRefresh()
                    #if DEBUG
                    // `-TFFinale`: cross the demo list off and leave it crossed off, so a
                    // screenshot has a finale to be a screenshot of. `-TFWatchSelfTest` also
                    // finishes the list, but it puts it back afterwards — the two arguments want
                    // opposite things and this is the one that stops.
                    if ProcessInfo.processInfo.arguments.contains("-TFFinale") {
                        for row in store.rows where !row.done { store.setDone(row.id, true) }
                    }
                    #endif
                    // The face carries the kit — see `WatchSnapshot`. Published here as well as on
                    // every change, because a launch that never changes the theme still has to leave
                    // a snapshot the complication can read the type out of.
                    publishTheme()
                    #if DEBUG
                    // After the first sync settles, which is what `start()` waits for.
                    if ProcessInfo.processInfo.arguments.contains("-TFWatchSelfTest") {
                        await store.runSelfTest()
                    }
                    if ProcessInfo.processInfo.arguments.contains("-TFFaceProbe") {
                        FaceProbe.run(theme.theme)
                    }
                    if ProcessInfo.processInfo.arguments.contains("-TFWatchSelfTest") {
                        // After the self-test's finale has had time to throw its volley: the meter
                        // is the only thing that can say the Canvas actually drew, and how often.
                        try? await Task.sleep(for: .seconds(3))
                        print("[tfive] watch selftest: 10 confetti: run=\(store.finaleTick) "
                              + ConfettiMeter.report)

                        // 11. **the complication, redrawn on a theme change.** The flip goes through
                        //     `show(_:)` — the picker's own call — and nothing else is touched. What
                        //     is asserted is that the snapshot on disk moved: `publish()` writes it
                        //     and calls `reloadAllTimelines()` in the same breath, so a snapshot that
                        //     changed is a reload that was asked for.
                        let before = WatchSnapshot.read()
                        theme.show(theme.slot == .day ? .night : .day)
                        try? await Task.sleep(for: .milliseconds(500))
                        let after = WatchSnapshot.read()
                        print("[tfive] watch selftest: 11 theme change: "
                              + "\(before?.kit ?? "none")/\(before?.face ?? "none") → "
                              + "\(after?.kit ?? "none")/\(after?.face ?? "none") "
                              + "changed=\(before?.kit != after?.kit)")
                    }
                    #endif
                }
        }
        .onChange(of: theme.theme) { _, _ in
            // A theme change is a snapshot write and a timeline reload, in that order and in the
            // same breath. Without this the face keeps yesterday's type until something else on the
            // list changes — which on a finished list is tomorrow.
            publishTheme()
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active {
                store.sceneBecameActive()
                // A phone that unlocked or re-locked the Secret pair while we were away wrote the
                // App Group key; this is the occasion that reads it. Same rule as the rest of this
                // app: the occasions, never a timer.
                theme.refresh()
            }
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

    @MainActor
    private func publishTheme() {
        let kit = theme.theme.kit
        store.themeChanged(kit: kit.id, pair: kit.pair,
                           face: kit.type?.uiBold.postScriptName ?? "")
    }
}

// ---------------------------------------------------------------- the root

struct RootView: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme
    /// The Always-On display. A five-line list lives on a wrist all day, so the dimmed frame gets a
    /// calm rendering of its own rather than the live one with its accent, its buttons and its
    /// animations — none of which mean anything on a screen nobody is looking at.
    @Environment(\.isLuminanceReduced) private var dimmed

    @State private var showPicker = false
    @State private var showAdd = false
    /// The long press on the count. Start again and the theme, behind one hold.
    @State private var showActions = false
    /// The volley on screen, and which one. `run` is `store.finaleTick`, so a second finale is a
    /// second field rather than a view that is already showing and does nothing.
    @State private var confettiRun = 0
    @State private var confettiStarted = Date()
    @State private var confettiAlive = false
    /// `-TFShow actions|theme`: open one of the two screens the long press leads to. The only way a
    /// screenshot of either exists at all — see `WatchThemeStore.applyDebugArguments`.
    @State private var showThemeDirect = false
    /// `-TFShow diagnostics`: the trace screen, for a simulator screenshot of it. On a wrist it is
    /// reached the way a person reaches it — the long press, then the last row.
    @State private var showDiagnosticsDirect = false
    /// Whether the sheet was opened by the Add complication rather than by the + on Today. Cleared
    /// when the sheet closes, so the next + is an ordinary +.
    @State private var openedFromFace = false
    @State private var page = Page.today

    enum Page: Hashable { case today, oneThing }

    #if DEBUG
    /// `-TFShow actions|theme`.
    static var debugShow: String? {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-TFShow"), i + 1 < args.count else { return nil }
        return args[i + 1]
    }
    #endif

    /// `-TFFinaleHold <seconds>`: draw the volley frozen at one instant instead of running it.
    ///
    /// It exists because **a screenshot of an animation is otherwise a coin toss**, and this round
    /// owes eighteen of them. `simctl` cannot tap a watch and cannot be told to shoot on a
    /// particular frame, so the alternative was to fire the volley in a loop and hope the shutter
    /// landed on it. Held, every kit is photographed at the same instant of the same deterministic
    /// field, and the eighteen images differ in exactly one thing: colour.
    static var finaleHold: Double? {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-TFFinaleHold"), i + 1 < args.count else { return nil }
        return Double(args[i + 1])
        #else
        return nil
        #endif
    }

    var body: some View {
        NavigationStack {
            content
                .watchGround(theme)
                .navigationTitle { titleButton }
                .sheet(isPresented: $showPicker) {
                    NavigationStack { ListPickerView() }.watchGround(theme)
                }
                .sheet(isPresented: $showActions) {
                    NavigationStack { CountActionsView() }.watchGround(theme)
                }
                .sheet(isPresented: $showThemeDirect) {
                    NavigationStack { KitPickerView() }.watchGround(theme)
                }
                .sheet(isPresented: $showDiagnosticsDirect) {
                    NavigationStack { DiagnosticsView() }.watchGround(theme)
                }
                .sheet(isPresented: $showAdd) {
                    // Track C's. This file never opens it any other way and never looks inside it.
                    // `openedFromFace` is the difference between the person tapping + on Today (where
                    // the + is the thing they aimed at) and the Add complication or Double Tap, which
                    // already said "add a line" — those land straight on dictation.
                    AddFlowView(beginImmediately: openedFromFace).watchGround(theme)
                }
                .onChange(of: showAdd) { _, open in if !open { openedFromFace = false } }
                // The volley sits over everything and takes no taps. It is added on the finale's
                // **edge** and removed by the field itself when the last piece has gone — a
                // `TimelineView` has no "stop" of its own, and one left mounted holds a redraw
                // source open on a live screen for as long as the app is in front.
                .overlay {
                    if confettiAlive {
                        ConfettiView(kit: theme.kit, colors: theme.confetti,
                                     run: confettiRun, started: confettiStarted,
                                     hold: RootView.finaleHold, alive: $confettiAlive)
                    }
                }
                .onChange(of: store.finaleTick) { _, tick in
                    guard tick > 0 else { return }
                    confettiRun = tick
                    confettiStarted = Date()
                    confettiAlive = true
                }
        }
        // The add flow's self-test lives here rather than in `AddFlowView`, because that view is
        // only ever inside a sheet and a sheet nobody opens proves nothing. `runIfAsked` returns at
        // once unless `-TFAddSelfTest` was passed, and it is `#if DEBUG` on the other side.
        .task {
            await AddSelfTest.runIfAsked()
            #if DEBUG
            switch RootView.debugShow {
            case "actions": showActions = true
            case "theme": showThemeDirect = true
            case "diagnostics": showDiagnosticsDirect = true
            default: break
            }
            #endif
        }
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
                TodayView(showAdd: $showAdd, showActions: $showActions).tag(Page.today)
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
                    .font(theme.ui(15, .headline, bold: true))
                    .lineLimit(1)
                    .truncationMode(.tail)
                if store.links.count > 1 {
                    Image(systemName: "chevron.down").font(.system(size: 8, weight: .semibold))
                }
            }
            .foregroundStyle(theme.accent)
        }
        .buttonStyle(.plain)
        .disabled(store.links.count < 2)
    }
}

// ---------------------------------------------------------------- nothing to show yet

struct EmptyStateView: View {
    @Environment(\.watchTheme) private var theme

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "iphone.gen3")
                .font(.title3)
                .foregroundStyle(theme.accent)
            Text("No list yet")
                .font(theme.ui(16, .headline, bold: true))
                .foregroundStyle(theme.text)
            Text("Open a list in Today's Five on your iPhone and it will arrive here.")
                .font(theme.ui(13, .footnote))
                .foregroundStyle(theme.muted)
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 6)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.ink)
    }
}
