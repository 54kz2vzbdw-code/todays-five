// WatchTheme.swift — the kit on the wrist: its palette, its type, its ground, and the self-test that
// turns a silent Helvetica into a failure.
//
// **What was built, and what was deliberately not.** Phase 3 shipped one hex — `#A86014` — and
// argued for it on the grounds that it "is the brand accent that Dark, Paper and Terminal all
// carry". *That sentence is now false.* Phase 4 §1 gave Terminal back its own `#4AF07A` and Paper
// its own `#C8321F`; only Dark still carries the brand accent, and it carries it as its own colour
// rather than as a pin over somebody else's. A constant chosen because three kits agreed on it does
// not survive the three kits disagreeing, so the constant is gone and this file holds a **resolved
// kit** instead: `Kits`' 16 open kits plus whatever a phone has unlocked, one of them chosen on this
// device, its colours as `Color`s and its font pair as `Font`s.
//
// **The phone-follows channel was not built, and that is the decision rather than the omission it
// was in Phase 3.** Theme is a per-device preference in this app — the web keeps two slots per
// device record and syncs neither — and a Watch is a device. It gets its own choice, stored in the
// App Group where the complication can also read it, and it does not inherit the phone's. The one
// thing that *does* cross the pairing is the two **Secret** kits' palettes, and only as a
// permission: they are in no binary, they arrive over `WatchLinkPayload.extra` from a phone whose
// person has unlocked them, and a phone that re-locks takes them off the wrist again.
//
// ---------------------------------------------------------------- three things that cost something
//
// **1. `.preferredColorScheme(.light)` is inert on watchOS — measured, not assumed.** Over Paper's
// cream it left every `.primary` white and invisible. `.environment(\.colorScheme, .light)` works
// and does flip `.primary`/`.secondary`. watchOS has no light appearance at all, which is why every
// colour on this screen is a kit token and not a system one: the dozen `.primary`/`.secondary` call
// sites Phase 3 shipped were only ever right because watchOS is permanently dark.
//
// **2. The system clock in the top-right stays white and there is no API to change it.** Not a
// `.tint`, not a `.toolbar`, not an `Info.plist` key — the time is drawn by the system outside the
// app's layer and the SDK offers nothing. On Paper's cream (`#F7F2E8`) white-on-cream is about
// **1.06:1**, which is not "low contrast", it is *invisible*. A light kit on this device therefore
// ships with an illegible clock. That is a real cost of what the brief asked for and it is written
// here rather than discovered on a wrist.
//
// **3. The ground is the battery.** Paper's cream drives the panel about **17×** harder than a dark
// kit's ink (measured; see `DECISIONS-phase4-C1.md` for the method and its three caveats). It is an
// emissive-drive ratio and **not** a battery number. It is why `ink` is set explicitly and once, and
// why the Always-On path stays flat.
import CoreText
import Foundation
import SwiftUI
import WidgetKit
import TodaysFiveCore
#if canImport(UIKit)
import UIKit
#endif

// ---------------------------------------------------------------- the resolved kit

/// One kit, resolved: every colour a screen needs as a `Color`, and every face as a `Font`.
///
/// Held by `WatchThemeStore`, handed down the view tree through `\.watchTheme`, and read by name.
/// **Nothing on the Watch may use `.primary`, `.secondary`, `.red` or an asset colour**: on a device
/// with no light appearance those all resolve against the system's permanent dark and quietly go
/// invisible the moment a light-base kit is chosen.
struct WatchTheme: Equatable, Sendable {

    let kit: Kit

    /// The page and the two surfaces above it. `ink` is the ground; `ink3` is the elevated one the
    /// accent's 3:1 floor is measured against, so it is what a platter or a filled chip is drawn on.
    let ink: Color, ink2: Color, ink3: Color
    /// Body text and its three secondaries.
    let text: Color, muted: Color, dim: Color, done: Color
    /// The accent family. `accent` is a UI colour (3:1); `accentText` is the one that may carry text.
    let accent: Color, accentHi: Color, accentDeep: Color, accentText: Color
    let danger: Color
    /// A solid line that clears 3:1 on `ink` — the unchecked box, a divider.
    let hairSolid: Color
    /// `text` at the kit's two hairline alphas. The web composes these with `rgba()`; a wrist
    /// composes them with `.opacity`, which is the same arithmetic.
    let hair: Color, hairHi: Color
    /// The five or six the finale throws. Stage 2's confetti reads this; nothing else does yet.
    let confetti: [Color]

    /// Whichever of the kit's own two extremes reads on a filled accent — the check glyph inside a
    /// prominent button, and nothing else. Chosen by measured contrast rather than by assuming white:
    /// Terminal's `#4AF07A` and Pink's `#FFD36E` are both far too light to carry white text.
    let onAccent: Color

    /// The scheme to force at the root. watchOS has no light appearance, so a light-base kit has to
    /// say so explicitly or every system-drawn glyph inside a `Button` or a `TextFieldLink` comes
    /// back white on cream.
    let colorScheme: ColorScheme

    init(kit: Kit) {
        self.kit = kit
        let c = kit.colors
        ink = Color(hex: c.ink); ink2 = Color(hex: c.ink2); ink3 = Color(hex: c.ink3)
        text = Color(hex: c.text); muted = Color(hex: c.muted)
        dim = Color(hex: c.dim); done = Color(hex: c.done)
        accent = Color(hex: c.accent); accentHi = Color(hex: c.accentHi)
        accentDeep = Color(hex: c.accentDeep); accentText = Color(hex: c.accentText)
        danger = Color(hex: c.danger)
        hairSolid = Color(hex: c.hairSolid)
        hair = Color(hex: c.text).opacity(c.hairAlpha)
        hairHi = Color(hex: c.text).opacity(c.hairHiAlpha)
        confetti = kit.confetti.map(Color.init(hex:))
        onAccent = Color(hex: WatchTheme.readableOn(c.accent, c.ink, c.text))
        colorScheme = kit.base == .light ? .light : .dark
    }

    /// What a device that has never chosen renders while the table is being read — and what a build
    /// with a broken generated table would show rather than crash. Dark, because it is the one kit
    /// whose accent did not move this round.
    static let fallback = WatchTheme(kit: Kits.byId("dark") ?? Kits.open.first ?? .placeholder)

    // ---------------------------------------------------------------- Always-On

    /// The Always-On face. `isLuminanceReduced` means the wrist is down and the frame is dimmed, and
    /// a five-line list lives there all day: the accent goes flat, because a saturated fill in a
    /// dimmed frame reads as a notification somebody needs to act on.
    ///
    /// Phase 3 flattened to `Color(white: 0.62)`, which was the right *shape* and the wrong colour on
    /// fifteen of sixteen kits. The flat value is now the kit's own `dim` — a secondary that already
    /// clears its floor against this kit's ground and carries none of the accent's chroma. On Dark it
    /// is `#8F8C84`, which is what the constant was reaching for.
    var accentFlat: Color { dim }

    /// The accent, or its flat stand-in on a dimmed screen. One call rather than a conditional at
    /// every site, so the rule cannot be forgotten at one of them.
    func accent(dimmed: Bool) -> Color { dimmed ? accentFlat : accent }

    /// A done line: still readable, plainly finished. The kit's own `done`, which is exactly the
    /// token `theme.js` computes for it.
    var struck: Color { done }

    // ---------------------------------------------------------------- type

    /// The pair this kit is set in, or nil for a kit naming a pair this build does not carry — which
    /// is what a Secret kit looks like on a Watch built before its pair existed.
    var type: KitType? { kit.type }

    /// The **task** face: the list lines and the one-thing line, and nothing else. That is exactly
    /// where `styles.css` uses it — seven call sites, all `var(--task-w)`, one weight.
    ///
    /// `relativeTo:` rather than a fixed size, so the Watch's own text-size setting still moves it.
    /// A pair this build cannot find falls back to the system face at the same size rather than
    /// rendering nothing; `-TFFontSelfTest` is what makes that fallback loud instead of silent.
    func task(_ size: CGFloat, _ style: Font.TextStyle) -> Font {
        guard let face = type?.task else { return .system(size: size) }
        return .custom(face.postScriptName, size: size, relativeTo: style)
    }

    /// The **ui** faces: everything that is not a task line. `bold` takes the pair's heavier weight,
    /// which is a different *file* — `.weight()` is a no-op on two of our faces (Fraunces and Source
    /// Serif 4 carry no `fvar` named instances; measured byte-identical at `.light` and `.black`), so
    /// weight is chosen by picking a face and never by asking for one.
    func ui(_ size: CGFloat, _ style: Font.TextStyle, bold: Bool = false) -> Font {
        guard let type else { return .system(size: size, weight: bold ? .semibold : .regular) }
        let face = bold ? type.uiBold : type.uiRegular
        return .custom(face.postScriptName, size: size, relativeTo: style)
    }

    /// The task line's tracking in points, at the size this device is actually rendering.
    ///
    /// `theme.js` records it in em and `.tracking()` takes points, so it is a multiplication — but by
    /// the **scaled** size, not the nominal one, or the letter-spacing would stay put while the type
    /// grew. `UIFontMetrics` is what `Font.custom(_:size:relativeTo:)` scales by, so asking it the
    /// same question gives the same answer.
    @MainActor
    func taskTracking(_ size: CGFloat, _ style: Font.TextStyle) -> CGFloat {
        guard let type else { return 0 }
        return CGFloat(type.tracking) * WatchType.scaled(size, style)
    }

    /// The task line's extra leading in points.
    ///
    /// `theme.js`'s `lh` is a multiple of the point size; SwiftUI's `.lineSpacing` is **extra space
    /// added to the face's own line height**, which is already about 1.2–1.4× the point size. So the
    /// naive `(lh - 1) * size` is not merely imprecise, it is wrong in the same direction on every
    /// kit. The face is measured instead — `CTFontGetAscent + Descent + Leading` — and what is
    /// returned is the difference, floored at zero, because SwiftUI will not tighten a line.
    @MainActor
    func taskLineSpacing(_ size: CGFloat, _ style: Font.TextStyle) -> CGFloat {
        guard let type else { return 0 }
        let points = WatchType.scaled(size, style)
        let natural = WatchType.naturalLineHeight(type.task.postScriptName, points)
        return max(0, CGFloat(type.lineHeight) * points - natural)
    }

    // ---------------------------------------------------------------- the readable extreme

    /// WCAG relative luminance, the same function `theme.js` uses, in Swift. Two lines of arithmetic
    /// rather than a fourth copy of a palette: this decides one thing, which of the kit's own two
    /// extremes goes on top of a filled accent.
    private static func luminance(_ hex: String) -> Double {
        guard let c = Kits.rgb(hex) else { return 0 }
        func lin(_ v: Double) -> Double { v <= 0.03928 ? v / 12.92 : pow((v + 0.055) / 1.055, 2.4) }
        return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
    }

    private static func contrast(_ a: String, _ b: String) -> Double {
        let l1 = luminance(a), l2 = luminance(b)
        return (max(l1, l2) + 0.05) / (min(l1, l2) + 0.05)
    }

    private static func readableOn(_ ground: String, _ a: String, _ b: String) -> String {
        contrast(ground, a) >= contrast(ground, b) ? a : b
    }
}

private extension Kit {
    /// Only reachable if the generated table is empty, which means the build is broken. It exists so
    /// a broken build shows a grey screen instead of trapping on somebody's wrist.
    static let placeholder = Kit(
        id: "", name: "", base: .dark, lean: .night, partner: "", pair: "", secret: false,
        colors: KitColors(ink: "#000000", ink2: "#111111", ink3: "#222222",
                          text: "#FFFFFF", muted: "#AAAAAA", dim: "#888888", done: "#888888",
                          muted2: "#AAAAAA", dim2: "#888888", done2: "#888888",
                          accent: "#888888", accentHi: "#AAAAAA", accentDeep: "#555555",
                          accentText: "#AAAAAA", danger: "#FF0000", hairSolid: "#555555",
                          hairAlpha: 0.1, hairHiAlpha: 0.3),
        confetti: ["#888888", "#AAAAAA", "#FFFFFF", "#555555", "#666666"],
        shapes: [1], finaleItalic: false)
}

// ---------------------------------------------------------------- measuring a face

/// The two measurements the type needs and SwiftUI will not give: what a size becomes under the
/// device's text-size setting, and how tall a line of a given face actually is.
///
/// Both are cached, because they are asked once per `Text` per frame and a carousel of five rows
/// asks a dozen times. The cache is on the main actor because every caller is a SwiftUI body.
@MainActor
enum WatchType {

    private static var lineHeights: [String: CGFloat] = [:]

    /// What `Font.custom(_:size:relativeTo:)` will actually render at, under this device's text-size
    /// setting. `UIFontMetrics` is the same machinery, asked directly.
    static func scaled(_ size: CGFloat, _ style: Font.TextStyle) -> CGFloat {
        #if canImport(UIKit)
        let scaled = UIFontMetrics(forTextStyle: uiStyle(style)).scaledValue(for: size)
        // A non-finite or absurd answer is a broken trait environment, not a text size somebody
        // chose; the nominal size is the honest fallback.
        return scaled.isFinite && scaled > 0 ? scaled : size
        #else
        return size
        #endif
    }

    /// `ascent + descent + leading` for a face at a size, which is the line height SwiftUI starts
    /// from before `.lineSpacing` adds to it. A name CoreText cannot find answers with the system
    /// face's metrics, which is the same thing the renderer will do — so the spacing stays sane even
    /// on the failure `-TFFontSelfTest` exists to catch.
    static func naturalLineHeight(_ postScriptName: String, _ size: CGFloat) -> CGFloat {
        let key = "\(postScriptName)@\(Int(size.rounded()))"
        if let hit = lineHeights[key] { return hit }
        let font = CTFontCreateWithName(postScriptName as CFString, size, nil)
        let h = CGFloat(CTFontGetAscent(font) + CTFontGetDescent(font) + CTFontGetLeading(font))
        lineHeights[key] = h
        return h
    }

    #if canImport(UIKit)
    private static func uiStyle(_ style: Font.TextStyle) -> UIFont.TextStyle {
        switch style {
        case .largeTitle: return .largeTitle
        case .title: return .title1
        case .title2: return .title2
        case .title3: return .title3
        case .headline: return .headline
        case .subheadline: return .subheadline
        case .callout: return .callout
        case .footnote: return .footnote
        case .caption: return .caption1
        case .caption2: return .caption2
        default: return .body
        }
    }
    #endif
}

// ---------------------------------------------------------------- applying the type

/// Font, tracking and leading together, because a task line that gets the face and not the tracking
/// is a kit rendered two-thirds of the way. Every task line on the Watch goes through this.
struct TaskTypeModifier: ViewModifier {
    let theme: WatchTheme
    let size: CGFloat
    let style: Font.TextStyle

    func body(content: Content) -> some View {
        content
            .font(theme.task(size, style))
            .tracking(theme.taskTracking(size, style))
            .lineSpacing(theme.taskLineSpacing(size, style))
    }
}

extension View {
    /// A task line — a list row, the one-thing line. Nothing else takes the task face.
    func taskType(_ theme: WatchTheme, _ size: CGFloat, _ style: Font.TextStyle) -> some View {
        modifier(TaskTypeModifier(theme: theme, size: size, style: style))
    }
}

// ---------------------------------------------------------------- where the choice lives

/// The Watch's own theme preference: two slots and the one that is on.
///
/// The shape is the web's (`theme.js`, "Two slots on every device and one switch") minus the parts a
/// wrist cannot have. **`switch: "system"` is not offered and cannot be**: watchOS has no light
/// appearance, so `\.colorScheme` reads `.dark` at the root of every app on the device forever, and
/// a mode that followed it would pin every Watch to its night slot and call that a feature.
///
/// Stored in the **App Group**, not `.standard`, because the complication is another process and has
/// to be able to draw in the same kit. Deliberately unlike `WatchLinkReceiver`'s selected-list key,
/// which is in `.standard` *because* it is a secret. A kit id is not a secret: `theme.js` ships all
/// eighteen to every browser, and the two Secret kits are withheld from the wrist as a product rule
/// rather than a cryptographic one.
@MainActor
@Observable
final class WatchThemeStore {

    /// `tf/app/` is the clients' prefix (COMPATIBILITY.md §8); this is the Watch's corner of it.
    static let dayKey = "tf/app/watch/kit/day"
    static let nightKey = "tf/app/watch/kit/night"
    static let slotKey = "tf/app/watch/kit/slot"

    private(set) var theme: WatchTheme = .fallback

    /// The two slots, by kit id, and which one is on. Stage 2's picker writes these three and
    /// nothing else; this file is the only reader.
    private(set) var dayId: String
    private(set) var nightId: String
    private(set) var slot: KitLean

    /// The two Secret kits, when a phone that has unlocked them has said so. Read from the same App
    /// Group key `WatchLinkReceiver` writes, rather than from the receiver itself, so a demo launch
    /// — which never starts a `WCSession` — still resolves a secret id that is genuinely stored.
    private(set) var unlocked: [Kit] = []

    /// Every kit this device may render: the 16 in the binary, plus whatever arrived.
    var available: [Kit] { Kits.open + unlocked }

    /// What the picker lists, for the slot it is editing: the eight kits designed for this slot in
    /// `theme.js`'s own order, then the eight designed for the other, then whatever a phone has
    /// unlocked.
    ///
    /// **Both leans are offered in both slots and that is the web's rule, not a slip** — "any theme,
    /// light or dark: the slot is about *when*, not *what*". Somebody who wants Paper at night is
    /// entitled to it. What the ordering does is make the eight that were drawn for this slot the
    /// eight you reach first, which on a crown is the whole of the affordance.
    ///
    /// The Secret kits are last and are only here when a phone that has unlocked them has said so.
    /// A phone that re-locks takes them out of this list on the next `refresh()`, and a slot left
    /// pointing at one falls back to that slot's default — see `resolved()`.
    var offered: [Kit] {
        let mine = slot == .day ? Kits.day : Kits.night
        let theirs = slot == .day ? Kits.night : Kits.day
        return mine + theirs + unlocked
    }

    /// The kit id stored in a slot, which is what the picker puts its checkmark against. Not
    /// `theme.kit.id`: under `-TFKit` those two deliberately disagree.
    func id(for lean: KitLean) -> String { lean == .day ? dayId : nightId }

    private let store: UserDefaults

    init(store: UserDefaults? = UserDefaults(suiteName: WatchGroup.identifier)) {
        // nil when the entitlement is missing from the running binary — the same silent answer
        // `containerURL(forSecurityApplicationGroupIdentifier:)` gives. Falling back to `.standard`
        // costs the complication its theme and costs the person nothing.
        let defaults = store ?? .standard
        self.store = defaults
        dayId = defaults.string(forKey: Self.dayKey) ?? Kits.defaultDay?.id ?? "paper"
        nightId = defaults.string(forKey: Self.nightKey) ?? Kits.defaultNight?.id ?? "terminal"
        slot = KitLean(rawValue: defaults.string(forKey: Self.slotKey) ?? "") ?? .night
        refresh()
    }

    /// Re-resolve: after a launch, after the phone unlocked or re-locked the Secret pair, and after
    /// the picker moves a slot.
    func refresh() {
        unlocked = WatchLinkReceiver.storedKits(in: store)
        theme = WatchTheme(kit: resolved())
    }

    /// Put a kit in a slot. Stage 2's picker is the only caller; it is here because the storage is.
    func choose(_ id: String, for lean: KitLean) {
        guard available.contains(where: { $0.id == id }) else { return }
        switch lean {
        case .day: dayId = id; store.set(id, forKey: Self.dayKey)
        case .night: nightId = id; store.set(id, forKey: Self.nightKey)
        }
        refresh()
    }

    /// Which slot is on. By hand, and only by hand — see the note on `system` above.
    func show(_ lean: KitLean) {
        slot = lean
        store.set(lean.rawValue, forKey: Self.slotKey)
        refresh()
    }

    /// The slot's kit, or that slot's default, or Dark. A stored id that no longer resolves is a
    /// Secret kit whose phone has re-locked, and the default is the right answer to it.
    private func resolved() -> Kit {
        let want = slot == .day ? dayId : nightId
        #if DEBUG
        // `-TFKit <id>` overrides both slots for one launch. It exists because `simctl` cannot tap a
        // watch simulator — there is no `simctl ui tap` and no accessibility bridge — so a screenshot
        // of a kit is only reachable through a launch argument.
        if let forced = Self.forcedKitId(), let kit = find(forced) { return kit }
        #endif
        return find(want)
            ?? (slot == .day ? Kits.defaultDay : Kits.defaultNight)
            ?? Kits.byId("dark")
            ?? WatchTheme.fallback.kit
    }

    private func find(_ id: String) -> Kit? {
        Kits.byId(id) ?? unlocked.first { $0.id == id }
    }

    #if DEBUG
    static func forcedKitId() -> String? {
        let args = ProcessInfo.processInfo.arguments
        guard let i = args.firstIndex(of: "-TFKit"), i + 1 < args.count else { return nil }
        return args[i + 1]
    }

    /// `-TFThemeSet night:forest` — **the picker's own two calls, from a launch argument.**
    ///
    /// It is here because the one verification this round could not do by hand is the one that
    /// matters most: `simctl` cannot tap a watch simulator, so nothing can press a row in
    /// `KitPickerView` and then relaunch to see whether it stuck. This calls `show(_:)` and
    /// `choose(_:for:)` — the identical two methods the picker's buttons call, not a copy of them —
    /// so what a two-launch run proves about this is true of the picker.
    ///
    /// It writes to the real App Group, which is the point: the next launch reads it back the same
    /// way a person's would.
    func applyDebugArguments() {
        let args = ProcessInfo.processInfo.arguments
        if let i = args.firstIndex(of: "-TFThemeSet"), i + 1 < args.count {
            let parts = args[i + 1].split(separator: ":", maxSplits: 1)
            if parts.count == 2, let lean = KitLean(rawValue: String(parts[0])) {
                show(lean)
                choose(String(parts[1]), for: lean)
            }
        }
        say()
    }

    /// What is stored and what resolved, printed on every debug launch. Kit ids, slot names and
    /// counts — a kit id is not a secret (`theme.js` ships all eighteen to every browser) and the
    /// two Secret ones are named by id here rather than by the word that unlocks them.
    func say() {
        print("[tfive] theme: slot=\(slot.rawValue) day=\(dayId) night=\(nightId) "
              + "→ kit=\(theme.kit.id) pair=\(theme.kit.pair) "
              + "base=\(theme.kit.base.rawValue) unlocked=\(unlocked.count) offered=\(offered.count)")
    }
    #endif
}

// ---------------------------------------------------------------- the picker

/// **The Watch's one settings screen, and the reversal it is.**
///
/// Phase 3 wrote: "There is no settings screen, no Everything, no sections, no History, no rules, no
/// templates and no themes: those live on a phone-sized screen because they need one." That sentence
/// is still right about all of them except the last, and this screen is the exception, on purpose
/// and on its own. The reason it is different from the others is not that themes are more important;
/// it is that **a theme is the only one of that list that is a property of the device you are
/// looking at**. History, rules and templates are properties of a list, and a list has a phone. The
/// kit a wrist is drawn in has nowhere else it could be chosen.
///
/// **The shape is `theme.js`'s, minus the parts a wrist should not carry.** The web has two slots and
/// a switch with three modes — by hand, follow the system, and on a schedule with `dayAt`/`nightAt`.
/// This has the two slots and the hand:
///
/// * `system` **cannot exist here**, and that is a platform fact rather than a choice: watchOS has no
///   light appearance, so `\.colorScheme` reads `.dark` at the root of every app on the device
///   forever. A mode that followed it would pin every Watch to its night slot and call that a
///   feature.
/// * `schedule` was **dropped**, and that is the choice. It would need two time pickers on a screen
///   two inches across, a stored `holdAuto` so a manual flip survives until the automation next
///   changes its mind, and `settleHold` run on every occasion the app wakes — for a preference a
///   person changes by looking at their wrist and deciding they would rather it were dark. The web
///   has a keyboard and a settings page; this has a crown. If the schedule is ever wanted here the
///   place to put it is the phone's device record, and that is a different round.
///
/// **One control does two jobs, and that is the whole design.** The Day/Night buttons choose which
/// slot is *on* — the flip — and simultaneously choose which slot the list below is editing. On a
/// screen this size, showing somebody a kit they are not currently looking at while they choose it
/// would be the worse trade: here, the row you tap is the thing that happens, immediately, on the
/// screen you are standing on. Both slots are still reachable, in one extra tap.
struct KitPickerView: View {
    @Environment(WatchThemeStore.self) private var store
    @Environment(\.watchTheme) private var theme

    var body: some View {
        List {
            slotRow
            ForEach(store.offered) { kit in
                Button {
                    store.choose(kit.id, for: store.slot)
                } label: {
                    row(kit)
                }
                .buttonStyle(.plain)
                .listRowBackground(
                    RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2)
                )
            }
        }
        .scrollContentBackground(.hidden)
        .background(theme.ink)
        // The view-taking overload again: the string one is drawn by the system in the system's
        // colour, which on a light kit is white on cream.
        .navigationTitle { Text("Theme").foregroundStyle(theme.accent) }
    }

    /// The flip. Two buttons rather than a `Picker`, because a watchOS segmented `Picker` is a
    /// crown-driven wheel and this is a two-state switch that wants one tap.
    private var slotRow: some View {
        HStack(spacing: 6) {
            slotButton(.day, "sun.max.fill", "Day")
            slotButton(.night, "moon.fill", "Night")
        }
        .listRowBackground(Color.clear)
    }

    private func slotButton(_ lean: KitLean, _ symbol: String, _ label: String) -> some View {
        let on = store.slot == lean
        return Button {
            store.show(lean)
        } label: {
            HStack(spacing: 4) {
                Image(systemName: symbol).font(.system(size: 11, weight: .semibold))
                Text(label).font(theme.ui(12, .caption, bold: true))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 5)
            .foregroundStyle(on ? theme.onAccent : theme.muted)
            .background(
                Capsule().fill(on ? theme.accent : theme.hairHi)
            )
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(on ? [.isSelected] : [])
    }

    private func row(_ kit: Kit) -> some View {
        let resolved = WatchTheme(kit: kit)
        return HStack(spacing: 8) {
            swatch(resolved)
            VStack(alignment: .leading, spacing: 1) {
                Text(kit.name)
                    .font(theme.ui(14, .body, bold: true))
                    .foregroundStyle(theme.text)
                    .lineLimit(1)
                // The pair's name, because the type is half of what a kit is on this device and the
                // swatch cannot show it.
                Text(kit.type?.name ?? kit.pair)
                    .font(theme.ui(10, .caption2))
                    .foregroundStyle(theme.dim)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            if store.id(for: store.slot) == kit.id {
                Image(systemName: "checkmark")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(theme.accent)
            }
        }
        .padding(.vertical, 2)
    }

    /// The kit in miniature: its ground, a rule of its text and a bar of its accent. Three tokens is
    /// as much as 26 points can carry, and they are the three that change the screen most.
    private func swatch(_ kit: WatchTheme) -> some View {
        RoundedRectangle(cornerRadius: 6, style: .continuous)
            .fill(kit.ink)
            .frame(width: 26, height: 26)
            .overlay(
                VStack(alignment: .leading, spacing: 3) {
                    Capsule().fill(kit.text).frame(width: 13, height: 2)
                    Capsule().fill(kit.accent).frame(width: 9, height: 4)
                }
            )
            .overlay(
                RoundedRectangle(cornerRadius: 6, style: .continuous)
                    .strokeBorder(theme.hairSolid, lineWidth: 1)
            )
    }
}

// ---------------------------------------------------------------- down the tree

private struct WatchThemeKey: EnvironmentKey {
    static let defaultValue = WatchTheme.fallback
}

extension EnvironmentValues {
    /// The resolved kit. Read it in every view; there is no other source of colour on this device.
    var watchTheme: WatchTheme {
        get { self[WatchThemeKey.self] }
        set { self[WatchThemeKey.self] = newValue }
    }
}

extension View {
    /// The ground, the scheme and the tint, in one place and applied at the root of every screen —
    /// the app's own, and each sheet's, because a sheet is a new hosting context and inherits the
    /// environment but not the container background.
    ///
    /// `.containerBackground(_:for: .navigation)` is what actually paints a watchOS screen; a plain
    /// `.background` sits inside the safe area and leaves the corners the system's. Both are set,
    /// because the sheet path honours one and the navigation path the other.
    func watchGround(_ theme: WatchTheme) -> some View {
        self
            .environment(\.colorScheme, theme.colorScheme)
            .environment(\.watchTheme, theme)
            .tint(theme.accent)
            .background(theme.ink)
            .containerBackground(theme.ink, for: .navigation)
    }
}

// ---------------------------------------------------------------- #RRGGBB

extension Color {
    /// `#RRGGBB`, which is how every colour in this project is written down. Anything else is grey,
    /// because a theme that cannot be read is not a reason to crash on somebody's wrist.
    init(hex: String) {
        guard let c = Kits.rgb(hex) else {
            self = Color(white: 0.5)
            return
        }
        self = Color(red: c.r, green: c.g, blue: c.b)
    }
}

// ---------------------------------------------------------------- -TFFontSelfTest

#if DEBUG
/// **A wrong font name renders Helvetica with no log and no error.** That is the whole reason this
/// exists: every other mistake in this file shows up on a screenshot, and this one does not — a
/// screenshot of Terminal set in Helvetica looks like a screenshot of Terminal.
///
/// So, for every kit this device can render: are the task and ui **families** in
/// `CTFontManagerCopyAvailableFontFamilyNames()`, does `CTFontCreateWithName(psname)` come back
/// carrying the name it was asked for rather than a fallback, and do the pair's two ui weights
/// actually set the same string to different widths — the last one being the check that catches a
/// pair whose "bold" is the regular file under another name.
///
/// It prints counts, a tally, and the names of the faces that **failed**. A font family is not a
/// secret — `theme.js` ships all 22 to every browser — but nothing else about the device is printed
/// either way.
@MainActor
enum FontSelfTest {
    private static var ran = false

    /// The string the two weights are measured on: ASCII, no kerning pairs worth arguing about, and
    /// long enough that a 100th of a point per glyph adds up to something a Double can tell apart.
    private static let ruler = "Handgloves 0123456789"

    static func runIfAsked(_ kits: [Kit]) async {
        guard !ran, ProcessInfo.processInfo.arguments.contains("-TFFontSelfTest") else { return }
        ran = true
        run(kits)
    }

    static func run(_ kits: [Kit]) {
        var checked = 0, passed = 0
        var failures: [String] = []
        func check(_ ok: Bool, _ what: @autoclosure () -> String) {
            checked += 1
            if ok { passed += 1 } else if failures.count < 12 { failures.append(what()) }
        }

        let families = Set((CTFontManagerCopyAvailableFontFamilyNames() as NSArray) as? [String] ?? [])
        print("[tfive] font self-test: begin kits=\(kits.count) "
            + "pairs=\(Kits.types.count) files=\(Kits.fontFiles.count) "
            + "familiesOnDevice=\(families.count)")

        // Every .ttf the table names is in the bundle. A face registered in `UIAppFonts` that is not
        // in Resources is the other way to get Helvetica, and it is a build mistake rather than a
        // name mistake — so it is reported separately.
        let present = Kits.fontFiles.filter { file in
            let name = (file as NSString).deletingPathExtension
            let ext = (file as NSString).pathExtension
            return Bundle.main.url(forResource: name, withExtension: ext) != nil
        }
        print("[tfive] font self-test: bundled=\(present.count)/\(Kits.fontFiles.count)")
        check(present.count == Kits.fontFiles.count,
              "bundle is missing \(Kits.fontFiles.count - present.count) of \(Kits.fontFiles.count) files")

        // **Every pair, not every kit's pair.** The 16 open kits between them name only **11** of the
        // 13 pairs — `baloo` and `fredoka` belong to the two Secret kits and to nothing else — and
        // walking the kits alone leaves 2 of the 33 bundled files untested until somebody unlocks a
        // kit, which is precisely when nobody is watching a console. A font pair is not a secret: all
        // thirteen are in the table and all thirty-three files are in this bundle, so all thirteen
        // are checked. Which kits may be *rendered* is a separate question, asked separately below.
        var seenFaces = Set<String>()
        var byAdvance = 0, byInk = 0
        for type in Kits.types.values.sorted(by: { $0.id < $1.id }) {
            for face in [type.task] + type.ui {
                guard seenFaces.insert(face.postScriptName).inserted else { continue }
                check(families.contains(face.family), "family not on device: \(face.family)")
                check(resolves(face), "PostScript name did not resolve: \(face.postScriptName)")
            }
            let a = type.uiRegular, b = type.uiBold
            // A pair that names the same file twice has nothing to tell apart.
            if a.postScriptName == b.postScriptName { continue }
            let told = weightsDiffer(a, b)
            check(told.ok, "pair \(type.id): \(told.detail)")
            if told.ok {
                if told.how == "advance" { byAdvance += 1 } else { byInk += 1 }
            }
        }
        print("[tfive] font self-test: weights told apart by advance=\(byAdvance) ink=\(byInk)")

        // And every kit this device may render names a pair this build carries. On a Watch with the
        // Secret pair unlocked that is 18 kits against the same 13 pairs.
        for kit in kits {
            check(kit.type != nil,
                  "kit \(kit.id) names pair \(kit.pair), which this build does not carry")
        }

        for line in failures { print("[tfive] font self-test: FAILED \(line)") }
        if failures.count == 12 { print("[tfive] font self-test: (further failures not listed)") }
        print("[tfive] font self-test: faces=\(seenFaces.count) end pass=\(passed)/\(checked)")

        // What the type is actually rendered at on this device, which is the other half of "did the
        // kit reach the screen": a tracking of 0 would mean `UIFontMetrics` answered nothing.
        if let type = kits.first?.type {
            let size: CGFloat = 17
            let scaled = WatchType.scaled(size, .title3)
            let natural = WatchType.naturalLineHeight(type.task.postScriptName, scaled)
            print(String(format: "[tfive] font self-test: at %.0fpt title3 scales to %.2f, "
                                 + "task line height %.2f, tracking %.3f, extra leading %.2f",
                         size, scaled, natural,
                         CGFloat(type.tracking) * scaled,
                         max(0, CGFloat(type.lineHeight) * scaled - natural)))
        }
    }

    /// Did CoreText hand back the face we asked for? `CTFontCreateWithName` never fails — it returns
    /// a fallback — so the only honest question is whether the name on the object it returned is the
    /// name we asked it for.
    private static func resolves(_ face: KitFace) -> Bool {
        let font = CTFontCreateWithName(face.postScriptName as CFString, 17, nil)
        let got = CTFontCopyPostScriptName(font) as String
        return got == face.postScriptName
    }

    /// Do these two faces actually render differently, or is one of them the other under a second
    /// name — which is what a pair whose heavier file was never regenerated looks like from outside?
    ///
    /// **Advance width cannot answer it on its own, and this test found that out rather than
    /// assuming it.** IBM Plex Mono Regular and SemiBold set the same 21-character ruler to the same
    /// **214.20** points, because that is what monospaced *means*. So there are two discriminators:
    /// the advance, and — when the advance ties — the **ink**, the bounding box of the drawn glyphs,
    /// which is wider in the heavier face even when the cell it sits in is not. The tally says which
    /// one settled each pair, because "told apart by ink" on a pair that is not monospaced would
    /// itself be worth looking at.
    private static func weightsDiffer(_ a: KitFace, _ b: KitFace) -> (ok: Bool, how: String, detail: String) {
        let wa = advance(a), wb = advance(b)
        if abs(wa - wb) > 0.01 {
            return (true, "advance", String(format: "%.2f vs %.2f", wa, wb))
        }
        let ia = inkWidth(a), ib = inkWidth(b)
        let ok = abs(ia - ib) > 0.01
        return (ok, "ink",
                String(format: "advance ties at %.2f; ink %@ %.2f vs %@ %.2f",
                       wa, a.postScriptName, ia, b.postScriptName, ib))
    }

    /// The typographic width of the ruler in one face — the sum of the advances.
    private static func advance(_ face: KitFace) -> Double {
        CTLineGetTypographicBounds(line(face), nil, nil, nil)
    }

    /// The width of the **ink**: the box the drawn glyphs actually cover, side bearings excluded.
    /// A heavier weight thickens stems, so this moves where the advance does not.
    private static func inkWidth(_ face: KitFace) -> Double {
        Double(CTLineGetImageBounds(line(face), nil).width)
    }

    private static func line(_ face: KitFace) -> CTLine {
        let font = CTFontCreateWithName(face.postScriptName as CFString, 17, nil)
        let attributed = NSAttributedString(
            string: ruler,
            attributes: [NSAttributedString.Key(kCTFontAttributeName as String): font])
        return CTLineCreateWithAttributedString(attributed)
    }
}
#else
@MainActor
enum FontSelfTest {
    static func runIfAsked(_ kits: [Kit]) async {}
}
#endif

// ---------------------------------------------------------------- -TFFaceProbe

#if DEBUG
/// **The two questions the complication round could not be answered by reading a doc comment.**
///
/// 1. Can the extension reach the Watch app's fonts without a second copy of them?
/// 2. What does `WidgetRenderingMode.accented` actually do to a custom accent?
///
/// Both are run *in the Watch app*, because a complication only draws on a watch face and `simctl`
/// cannot tap a watch simulator. What that costs each answer is different and is stated with each.
///
/// It prints file counts, name counts and channel values. No list, no id, no secret.
@MainActor
enum FaceProbe {

    static func run(_ theme: WatchTheme) {
        func say(_ s: String) { print("[tfive] face probe: \(s)") }

        // ------------------------------------------------------------ 1. the fonts
        //
        // The URL handed in is the **extension's own**, so the arithmetic under test is the
        // extension's arithmetic and not a re-derivation of it. What this cannot prove is that the
        // widget host lets the appex read it at render time; what it does prove is that the path is
        // right, the files are there, and CoreText can read a face out of them.
        let appex = Bundle.main.builtInPlugInsURL?
            .appendingPathComponent("TodaysFiveComplications.appex")
        if let appex {
            let root = WatchFaceType.fontsBundleURL(for: appex)
            let inAppex = ((try? FileManager.default.contentsOfDirectory(at: appex,
                                                                        includingPropertiesForKeys: nil))
                           ?? []).filter { $0.pathExtension.lowercased() == "ttf" }.count
            let names = WatchFaceType.facesOnDisk(in: appex)
            let registered = WatchFaceType.register(in: appex)
            let want = theme.kit.type?.uiBold.postScriptName ?? ""
            say("appex=\(appex.lastPathComponent) ttfInAppex=\(inAppex) "
                + "fontsRoot=\(root.lastPathComponent) facesOnDisk=\(names.count) "
                + "registered=\(registered) wantedFaceOnDisk=\(names.contains(want))")
        } else {
            say("no PlugIns directory — this build has no extension embedded")
        }

        // ------------------------------------------------------------ 2. the accent
        //
        // `WidgetRenderingMode.accented`'s own words are that the system "treats the widget's views
        // as if they were template images. It replaces the view's color — rendering the new colors
        // while preserving the view's alpha channel". If that flattening happened *in SwiftUI*, an
        // `ImageRenderer` handed the environment value would show it. Whatever this prints is the
        // observation; the interpretation is in `Complications.swift`.
        let sample = ZStack {
            Rectangle().fill(theme.accent)
            Circle().fill(theme.danger).frame(width: 12, height: 12)
        }
        .frame(width: 32, height: 32)

        let full = pixel(sample.environment(\.widgetRenderingMode, .fullColor))
        let accented = pixel(sample.environment(\.widgetRenderingMode, .accented))
        say("accent asked for \(theme.kit.colors.accent)")
        say("fullColor  corner=\(describe(full?.corner)) centre=\(describe(full?.centre))")
        say("accented   corner=\(describe(accented?.corner)) centre=\(describe(accented?.centre))")
        let same = describe(full?.corner) == describe(accented?.corner)
            && describe(full?.centre) == describe(accented?.centre)
        say("the two renderings are "
            + (same
               ? "IDENTICAL — SwiftUI did not flatten anything; the treatment is the widget host's"
               : "DIFFERENT — SwiftUI itself changed the colours"))
    }

    private struct Sample { let corner: (UInt8, UInt8, UInt8, UInt8); let centre: (UInt8, UInt8, UInt8, UInt8) }

    /// Two pixels out of a 32×32 render: one inside the accent fill, one in the middle of the mark
    /// on top of it. Two rather than one because a mode that flattened *everything to one colour*
    /// and a mode that changed nothing both leave a single pixel looking plausible.
    private static func pixel<V: View>(_ view: V) -> Sample? {
        let renderer = ImageRenderer(content: view)
        renderer.scale = 1
        guard let cg = renderer.cgImage else { return nil }
        let w = cg.width, h = cg.height
        guard w >= 4, h >= 4 else { return nil }
        var buffer = [UInt8](repeating: 0, count: w * h * 4)
        guard let space = CGColorSpace(name: CGColorSpace.sRGB),
              let ctx = CGContext(data: &buffer, width: w, height: h, bitsPerComponent: 8,
                                  bytesPerRow: w * 4, space: space,
                                  bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)
        else { return nil }
        ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
        func at(_ x: Int, _ y: Int) -> (UInt8, UInt8, UInt8, UInt8) {
            let i = (y * w + x) * 4
            return (buffer[i], buffer[i + 1], buffer[i + 2], buffer[i + 3])
        }
        return Sample(corner: at(2, 2), centre: at(w / 2, h / 2))
    }

    private static func describe(_ p: (UInt8, UInt8, UInt8, UInt8)?) -> String {
        guard let p else { return "—" }
        return String(format: "#%02X%02X%02X@%d", p.0, p.1, p.2, Int(p.3))
    }
}
#else
@MainActor
enum FaceProbe {
    static func run(_ theme: WatchTheme) {}
}
#endif
