// TodayView.swift — Today, the checkbox, the count, the finale, and the dimmed version of all three.
//
// The lines are large, the checkbox is the whole row's hit area, and the count is done-over-total the
// way the rail's `d/n` is. Nothing here decides anything about the document: a tap calls
// `WatchStore.setDone`, which calls the core's `Model.setDone`, which writes exactly three fields.
//
// **Every colour and every face here comes from the kit** (`\.watchTheme`). The list lines take the
// kit's *task* face with its tracking and its leading — they are the seven call sites `styles.css`
// gives `var(--task-w)` — and everything else takes a ui face. There is no `.primary`, no
// `.secondary` and no system colour on this screen: watchOS has no light appearance, so those read
// correctly only for as long as nobody chooses a light kit.
//
// **The row platter is the kit's `ink2`.** `.listStyle(.carousel)` draws its own translucent grey
// otherwise, which on Paper's cream is a grey card on paper.
import SwiftUI
import TodaysFiveCore

struct TodayView: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme
    /// The long press on the count. It used to *be* Start again; it now opens the two things a hold
    /// on the count can mean — see `CountActionsView`.
    @Binding var showActions: Bool

    var body: some View {
        List {
            // **The list row**, above the count, and only when there is more than one list to switch
            // between. It is `TodayListRow` in `ListPickerView.swift`, with the picker's other two
            // doors, because the three belong to one question and not to this screen.
            if store.links.count > 1 {
                TodayListRow().listRowBackground(rowPlatter)
            }
            countRow
            if store.finaleShowing { finaleCard }
            addRow
            ForEach(store.rows) { row in
                TodayRow(row: row)
            }
        }
        .listStyle(.carousel)
        // `todaysfive://add` arrived. A resumed watch app comes back with the scroll offset it had, so
        // "the add control is the row under the count" is only one tap when the list is at the top, and
        // `page = .today` does not put it there. Whether this moves a carousel `List` is on this round's
        // unverified list: `simctl` cannot scroll a watch simulator, so nothing here could leave it
        // scrolled and then check that this brought it back. `ScrollPosition` is watchOS 11 API, so on
        // a watchOS 10 wrist the list is simply left where it was — see `WatchOS11.swift`.
        .scrollToTop(on: AddCoordinator.shared.focusTick)
        .scrollContentBackground(.hidden)
        .background(theme.ink)
        // The document changes at once; only the re-order waits, and this is the wait made visible.
        .animation(.easeOut(duration: 0.22), value: store.rows)
        .animation(.easeOut(duration: 0.25), value: store.finaleShowing)
    }

    // ---------------------------------------------------------------- the count

    /// Done over total, the sync mark, and — on a **long press** — the count's two actions.
    ///
    /// Worth saying plainly: *the web has no long press on the count*. There a plain tap toggles
    /// one-thing mode and Start again is a button under the finale card reading "Bring them all
    /// back". The long press is a Watch idiom for a Watch that has no room for a second button; the
    /// *action* is the web's `startAgain()` exactly.
    ///
    /// **Phase 4 put a second thing behind the same hold, and that cost Start again a tap.** The
    /// count is the Watch's one long-press surface and a third page would cost Today a swipe every
    /// time somebody scrolls, forever, to reach a screen they will open twice a year — so the hold
    /// now presents a sheet instead of firing. Named rather than buried: a gesture that used to do a
    /// thing and now opens a menu is a small regression for the person who had learned it.
    ///
    /// **Phase 5 puts a third thing there, and it is Lists** — on this gesture specifically, because it
    /// is the one gesture in this app a wrist has reported working: Price reaches the theme picker
    /// through it, so the hold fires and the sheet presents. That is **his report, not a measurement
    /// taken here** — nothing on this machine can tap a watch — and it is still the best evidence the
    /// round has about any control on this screen, which is why the new row went behind this gesture
    /// rather than a new one. *Start again* keeps the first row it has always had; the new row is
    /// additive rather than a re-teaching.
    ///
    /// It also fixed something. **The old hold was gated on `store.canEdit`**, so a view-only list
    /// had no long press at all — and once the theme lives behind it, that would have meant a person
    /// whose only list is shared read-only could never change their Watch's theme. A theme is not a
    /// property of the list. So the hold is ungated and *Start again* is the row that is disabled.
    private var countRow: some View {
        HStack(spacing: 3) {
            Text("\(store.doneCount)")
                .font(theme.ui(16, .headline, bold: true))
                .foregroundStyle(store.finaleShowing ? theme.accent : theme.text)
            Text("/\(store.totalCount)")
                .font(theme.ui(16, .headline))
                .foregroundStyle(theme.muted)
            // The pills live on the list row when there is one, so they are drawn once and the
            // count row does not grow by the width of two chips it was already showing elsewhere.
            if store.links.count < 2 {
                if store.isViewOnly { Pill(text: "view only") }
                if store.isShared { Pill(text: "Shared") }
            }
            Spacer(minLength: 0)
            Image(systemName: store.mark.symbol)
                .font(.system(size: 11))
                .foregroundStyle(theme.dim)
                .accessibilityLabel(Text(store.mark.rawValue))
        }
        .padding(.vertical, 2)
        .contentShape(Rectangle())
        .onLongPressGesture(minimumDuration: 0.5) { showActions = true }
        .accessibilityHint(Text("Hold for start again, lists and theme"))
        .listRowBackground(Color.clear)
    }

    /// The carousel's platter, in the kit's own first surface above the page.
    private var rowPlatter: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2)
    }

    /// The web's own default string, and its own 300 ms hold — the wait is in `WatchStore`, because
    /// it is about the moment rather than about the drawing.
    private var finaleCard: some View {
        HStack {
            Spacer(minLength: 0)
            Text("That's the list.")
                .font(theme.ui(16, .headline, bold: true))
                .italic(theme.kit.finaleItalic)
                .foregroundStyle(theme.accent)
            Spacer(minLength: 0)
        }
        .padding(.vertical, 6)
        .listRowBackground(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(theme.accent.opacity(0.18))
        )
        .transition(.opacity)
    }

    // ---------------------------------------------------------------- the add

    /// **The add control itself, not a button that opens one.** This is Phase 5's §1 in one line.
    ///
    /// Phase 3's version was a `Button` that set `showAdd = true`, which raised a `.sheet` carrying
    /// `AddFlowView`, which held a *second* button, and only that one asked for input: three taps for
    /// "tap, speak, done", and a WatchKit modal presented from underneath a SwiftUI sheet. On a real
    /// wrist the microphone lit and the screen never changed. `AddFlowView` is now this row, the control
    /// on it is the input, and there is no sheet left to be the suspect.
    ///
    /// **It sits above the lines, which is a change worth naming.** On the web the `+` is at the end of
    /// the list. Here it is directly under the count, because the complication's `todaysfive://add` now
    /// opens the app on Today rather than presenting anything — so the control has to be *on screen at
    /// launch* for the face path to cost one tap, and a row below five lines on a 46 mm screen is a
    /// crown turn away. The cost is that the Watch's vertical order no longer matches the web's.
    ///
    /// **Being the second row is not the same as being on screen, and a review was right about that.**
    /// A watch app resumed from the background comes back with the scroll offset it had; `onOpenURL`
    /// sets `page = .today` and that moves nothing. So the complication bumps
    /// `AddCoordinator.focusTick` and `body` asks this list to scroll to its top edge. Stated as what it
    /// is: the call is made, and whether a carousel `List` honours it is unverified here, because
    /// nothing on this machine can scroll a watch simulator in order to find out.
    ///
    /// `canAdd` is the only thing the flow needs from the model: the view deliberately holds no
    /// reference to `WatchStore`, because the same add has to work from an App Intent that ran while the
    /// app was closed.
    private var addRow: some View {
        AddFlowView(canAdd: store.canEdit)
            .listRowBackground(rowPlatter)
    }
}

// ---------------------------------------------------------------- one line

struct TodayRow: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme
    let row: WatchStore.Row

    var body: some View {
        Button {
            // Set, never toggle. `Model.setDone` no-ops when the line is already in the state asked
            // for, so a second tap that lost a race cannot stamp a fresh `updatedAt` and win a merge
            // tie-break for no user action.
            store.setDone(row.id, !row.done)
        } label: {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: row.done ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 17))
                    // `hairSolid` is the kit's own line that clears 3:1 on its ground — which is
                    // what an unchecked box is. `.secondary` was a grey that happened to work on a
                    // device that is always dark.
                    .foregroundStyle(row.done ? theme.accent : theme.hairSolid)
                Text(row.text)
                    .taskType(theme, 17, .title3)
                    .strikethrough(row.done, color: theme.struck)
                    .foregroundStyle(row.done ? theme.struck : theme.text)
                    .multilineTextAlignment(.leading)
                    .lineLimit(4)
                    .minimumScaleFactor(0.7)
                Spacer(minLength: 0)
            }
            .padding(.vertical, 2)
        }
        .buttonStyle(.plain)
        .listRowBackground(
            RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2)
        )
        // A view-only list cannot be changed, and the refusal happens here as well as in the store:
        // nobody is shown a line crossing itself off that will not stay crossed off.
        .disabled(!store.canEdit)
    }
}

// ---------------------------------------------------------------- the pills

/// The web's words, exactly: **"Shared"** and **"view only"**. Two independent pills, and both can be
/// on at once.
struct Pill: View {
    @Environment(\.watchTheme) private var theme
    let text: String

    var body: some View {
        Text(text)
            .font(theme.ui(10, .caption2, bold: true))
            .padding(.horizontal, 5)
            .padding(.vertical, 1)
            // The kit's own emphasised hairline — `text` at `hairHiAlpha` — which is exactly what
            // the web fills a chip with. The old `Color.primary.opacity(0.16)` was Pink's alpha
            // applied to every kit and to a colour no kit names.
            .background(Capsule().fill(theme.hairHi))
            .foregroundStyle(theme.muted)
    }
}

// ---------------------------------------------------------------- Always-On

/// `isLuminanceReduced` is the Always-On display: the wrist is down and the screen is dimmed, and a
/// five-line list is going to sit here all day. So this is Today with everything that asks for
/// attention taken out — no accent fill, no buttons, no animation, no finale card — leaving the one
/// thing a glance wants, which is how much is left.
struct AlwaysOnTodayView: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 4) {
                Text(store.title)
                    .font(theme.ui(12, .caption))
                    .foregroundStyle(theme.dim)
                    .lineLimit(1)
                Spacer(minLength: 0)
                Text("\(store.doneCount)/\(store.totalCount)")
                    .font(theme.ui(12, .caption, bold: true))
                    .foregroundStyle(theme.accent(dimmed: true))
            }
            ForEach(store.rows.prefix(5)) { row in
                Text(row.text)
                    .taskType(theme, 15, .body)
                    .strikethrough(row.done, color: theme.accent(dimmed: true))
                    .foregroundStyle(row.done ? theme.accent(dimmed: true) : theme.text.opacity(0.75))
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 4)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        // The dimmed frame gets the ground too. It is the one screen that is on for hours, and it is
        // where the 17x emissive-drive ratio between a dark kit and Paper's cream is actually spent.
        .background(theme.ink)
    }
}

// ---------------------------------------------------------------- the volley

/// **The finale's confetti, ported from `fx.js` rather than reinvented.** Every number below is that
/// file's: gravity `0.30`, drag `0.992` on both axes, `life` from 1 decaying `0.0075 + rand*0.008` a
/// frame, `rib` on 45% of pieces, alpha `life * 1.7` clamped, and the volley itself — seven bursts of
/// 26 at `w * (0.08 + 0.14i)`, `h * 0.97`, power 19, spread 1.15, fired `i * 65` ms apart, then one
/// of 40 at `w/2`, `h * 0.6`, power 14, spread 2.6, at 210 ms. 222 particles.
///
/// ---------------------------------------------------------------- the one number that had to move
///
/// **`fx.js`'s speeds are in browser pixels and a watch is not a browser.** A piece launched at 19
/// px/frame against 0.30 px/frame² of gravity reaches its apex 601 px up. On a 208×248 pt watch
/// screen that is two and a half screens: the whole volley would leave through the top on frame one
/// and the screen would be empty for a second and a half before anything came back.
///
/// So the port scales **every length by one factor** — positions, velocities, gravity and particle
/// sizes alike — and scales *nothing else*. That is the only rescaling that leaves the choreography
/// alone: an apex is `v² / 2g`, so multiplying `v` and `g` by the same `k` multiplies the apex by
/// `k` and leaves every **time** exactly where `fx.js` put it. The bursts stay 65 ms apart, the wide
/// one still lands at 210 ms, and a piece still lives about as long as it did. `k = height / 800`,
/// 800 being a browser viewport's working height; on this simulator that is **0.31**.
///
/// The alternative — keep the speeds and shrink gravity — would have changed the timing, and the
/// volley's timing is the half of it the haptics are already playing (`WatchHaptics`, seven clicks
/// 65 ms apart). Those two must not drift apart.
///
/// ---------------------------------------------------------------- what `shapes` says
///
/// A kit's `shapes` is **the list of shape indices to draw from**: 0 ribbon, 1 heart, 2 star,
/// 3 sparkle, 4 sprinkle. It arrives that way and this file draws it, and that is the whole of it.
///
/// It is worth a line only because it was briefly not that. In `theme.js` the field is a union —
/// either a count carrying v1's meaning (1 ribbons, 2 ribbons and hearts, 3 ribbons hearts and
/// stars) or a list — and the two readings disagree completely, because as a count `1` is ribbons
/// and as a list `[1]` is hearts. The fixture's first mapping wrapped a count in an array, which
/// flattened the union and read fifteen of the eighteen kits as hearts-only. Nothing could see it
/// until something drew a particle, and this file is the first thing in the project that did.
///
/// `test/tools/gen-kits.mjs` now **resolves** a count instead of wrapping it — `n` becomes
/// `0 … n-1`, which is exactly what `fx.js`'s `shapeOf()` does with it — so the union stops at the
/// generator and no reader downstream has to know it existed.

/// One piece. A struct, in a flat array, stepped by a free function — because the whole field has to
/// be steppable with no view attached, which is what makes the volley checkable off-screen.
struct ConfettiParticle {
    var x: Double, y: Double
    var vx: Double, vy: Double
    /// The ribbon's box, and the polygon shapes' radius.
    var w: Double, h: Double, s: Double
    var rotation: Double, spin: Double
    var life: Double, decay: Double
    /// A ribbon flutters: its drawn height is `h * |cos(r * 1.7)|`, which is `fx.js`'s trick for
    /// making a flat rectangle read as a twisting strip without a 3-D transform.
    var ribbon: Bool
    /// 0 ribbon, 1 heart, 2 star, 3 sparkle, 4 sprinkle.
    var shape: Int
    /// An index into the kit's confetti palette rather than a `Color`, so the field stays a plain
    /// value and a screenshot of it can be compared across kits.
    var color: Int
}

/// The field, and `fx.js`'s frame loop.
///
/// **Fixed timestep, 60 a second.** `fx.js` steps once per `requestAnimationFrame` and its constants
/// are per-frame, not per-second; a `dt`-scaled port would drift from the web's arithmetic on every
/// device whose refresh rate is not 60. So the view converts elapsed seconds into a frame number and
/// this steps to it. That also makes the whole thing **deterministic given a seed**, which is what
/// lets eighteen screenshots of the same volley differ only in colour.
struct ConfettiField {
    /// `fx.js`, unchanged.
    static let gravity = 0.30, drag = 0.992
    static let burstCount = 26, wideCount = 40
    static let burstPower = 19.0, widePower = 14.0
    static let burstSpread = 1.15, wideSpread = 2.6
    static let stepMs = 65.0, wideAtMs = 210.0
    /// A browser's working viewport height, and the only reason a number like this appears at all.
    /// See the note above: it scales *lengths*, never times.
    static let referenceHeight = 800.0

    private(set) var particles: [ConfettiParticle] = []
    /// The frame the field has been stepped to. `fx.js` has no such thing because a browser hands it
    /// one; a `TimelineView` hands us a date instead, and this is how the two are reconciled.
    private(set) var frame = 0
    /// Bursts that have not fired yet, as (frame, how to fire it). The volley's schedule, resolved
    /// to frames once, so a dropped frame delays nothing.
    private var pending: [(frame: Int, x: Double, y: Double, n: Int, power: Double, spread: Double)] = []

    private var rng: SplitMix64
    private let size: CGSize
    private let palette: Int
    private let shapes: [Int]

    init(size: CGSize, kit: Kit, seed: UInt64) {
        self.size = size
        self.palette = max(1, kit.confetti.count)
        self.shapes = kit.shapes
        self.rng = SplitMix64(seed: seed)
        schedule()
    }

    /// `volley()`. Seven along the foot 65 ms apart, one wide one through the middle at 210.
    private mutating func schedule() {
        let w = size.width, h = size.height
        for i in 0..<7 {
            pending.append((frame: Int((Double(i) * Self.stepMs / 1000 * 60).rounded()),
                            x: w * (0.08 + 0.14 * Double(i)), y: h * 0.97,
                            n: Self.burstCount, power: Self.burstPower, spread: Self.burstSpread))
        }
        pending.append((frame: Int((Self.wideAtMs / 1000 * 60).rounded()),
                        x: w * 0.5, y: h * 0.6,
                        n: Self.wideCount, power: Self.widePower, spread: Self.wideSpread))
    }

    /// The length scale. Every distance in `fx.js` goes through this and nothing else does.
    private var k: Double { size.height / Self.referenceHeight }

    /// `burst()`.
    private mutating func burst(x: Double, y: Double, n: Int, power: Double, spread: Double) {
        let k = self.k
        for _ in 0..<n {
            let a = -Double.pi / 2 + (rng.unit() - 0.5) * spread
            let sp = power * (0.55 + rng.unit() * 0.8) * k
            particles.append(ConfettiParticle(
                x: x, y: y,
                vx: cos(a) * sp + (rng.unit() - 0.5) * 1.3 * k,
                vy: sin(a) * sp,
                w: (3 + rng.unit() * 5) * k,
                h: (6 + rng.unit() * 11) * k,
                s: (5 + rng.unit() * 6) * k,
                rotation: rng.unit() * .pi * 2,
                spin: (rng.unit() - 0.5) * 0.34,
                life: 1,
                decay: 0.0075 + rng.unit() * 0.008,
                ribbon: rng.unit() < 0.45,
                shape: shapeOf(),
                color: Int(rng.unit() * Double(palette)) % palette))
        }
    }

    /// `shapeOf()`. `shapes` is already the list to draw from — see the note above.
    private mutating func shapeOf() -> Int {
        return shapes.isEmpty ? 0 : shapes[Int(rng.unit() * Double(shapes.count)) % shapes.count]
    }

    /// Step to `target`, one frame at a time, firing each burst on the frame the volley put it on.
    ///
    /// **The frame counter has to move inside the loop**, not before it: the seven bursts are 65 ms
    /// apart and the whole shape of the volley is that stagger, so a catch-up that set the clock to
    /// the destination first would fire all eight bursts on one frame and throw the entire 222
    /// pieces from the floor at once.
    ///
    /// The ceiling is a watchOS fact rather than a tidiness one: a watch app is suspended seconds
    /// after the wrist drops and comes back to a date that can be hours later, and simulating a
    /// quarter of a million frames to arrive at an empty field is a spin, not a recovery. 600 frames
    /// is ten seconds and the field is provably empty by 140 (`1 / 0.0075`, the slowest decay).
    mutating func advance(to target: Int) {
        let stop = min(target, frame + 600)
        while frame <= stop {
            fireDue()
            if frame >= stop { break }
            step()
            frame += 1
        }
        if target > frame { frame = target; fireDue() }
    }

    private mutating func fireDue() {
        while let next = pending.first, next.frame <= frame {
            pending.removeFirst()
            burst(x: next.x, y: next.y, n: next.n, power: next.power, spread: next.spread)
        }
    }

    private mutating func step() {
        let floorY = size.height + 70 * k
        var kept: [ConfettiParticle] = []
        kept.reserveCapacity(particles.count)
        for var p in particles {
            p.vy += Self.gravity * k
            p.vx *= Self.drag
            p.vy *= Self.drag
            p.x += p.vx
            p.y += p.vy
            p.rotation += p.spin
            p.life -= p.decay
            if p.life <= 0 || p.y > floorY { continue }
            kept.append(p)
        }
        particles = kept
    }

    /// **The end.** `fx.js` stops asking for frames when the array empties; a `TimelineView` has no
    /// such switch and will keep a redraw source alive on a live screen forever, so the view removes
    /// itself when this goes false. Pending bursts count: the field is not done before it has begun.
    var isAlive: Bool { !particles.isEmpty || !pending.isEmpty }
}

/// Deterministic, seedable, and eight bytes of state — so a field can be replayed exactly, which is
/// what a screenshot of eighteen kits' confetti needs to be worth comparing. `Double.random` is not
/// seedable without carrying a whole `RandomNumberGenerator` through every call site.
struct SplitMix64 {
    private var state: UInt64
    init(seed: UInt64) { state = seed }
    mutating func next() -> UInt64 {
        state &+= 0x9E3779B97F4A7C15
        var z = state
        z = (z ^ (z >> 30)) &* 0xBF58476D1CE4E5B9
        z = (z ^ (z >> 27)) &* 0x94D049BB133111EB
        return z ^ (z >> 31)
    }
    /// 0..<1.
    mutating func unit() -> Double { Double(next() >> 11) * (1.0 / 9007199254740992.0) }
}

// ---------------------------------------------------------------- drawing it

/// `Canvas` inside `TimelineView(.animation)`, which is the pair the plan measured: both watchOS
/// 8.0+, and 180 rotating particles drawn live on a 26.5 simulator.
///
/// **Always-On is not gated here and must not be.** `AnimationTimelineSchedule.entries(from:mode:)`
/// returns **zero entries** in `.lowFrequency`, so `TimelineView(.animation)` parks itself the
/// moment the wrist drops — measured, on both runtimes. An `isLuminanceReduced` check would be a
/// second mechanism doing the same job, and the failure mode of two mechanisms is that one of them
/// is wrong. (A hand-rolled `PeriodicTimelineSchedule` would **not** self-park: it ignores the mode
/// and keeps ticking. That is the trap, and it is why this is not one.)
///
/// **Sound stays out and the haptic half does not change.** `CoreHaptics` is still absent from the
/// watchOS SDK — `WatchHaptics` says so at length — so the volley's shape is still seven
/// `WKInterfaceDevice.play(.click)` on the same onsets this draws to, and nothing here plays a note.
struct ConfettiView: View {
    let kit: Kit
    let colors: [Color]
    /// Changes every time the finale fires; a new value is a new field.
    let run: Int
    /// The moment the run began, so the field's frame number is measured from the burst rather than
    /// from whenever this view happened to be created.
    let started: Date
    /// `-TFFinaleHold <seconds>`: freeze the field at one instant so a screenshot of an animation is
    /// reproducible. nil in every build a person will ever run.
    let hold: Double?

    /// Removed by the parent when this goes false — see `isAlive`.
    @Binding var alive: Bool

    var body: some View {
        TimelineView(.animation) { timeline in
            Canvas(rendersAsynchronously: false) { context, size in
                #if DEBUG
                ConfettiMeter.tick(timeline.date)
                #endif
                draw(context: context, size: size, at: seconds(timeline.date))
            }
        }
        .allowsHitTesting(false)
        .ignoresSafeArea()
    }

    private func seconds(_ date: Date) -> Double {
        if let hold { return hold }
        return max(0, date.timeIntervalSince(started))
    }

    private func draw(context: GraphicsContext, size: CGSize, at seconds: Double) {
        guard size.width > 0, size.height > 0 else { return }
        var field = ConfettiField(size: size, kit: kit, seed: seed(size))
        field.advance(to: Int(seconds * 60))
        if !field.isAlive {
            // The end, reported out of the draw rather than out of a timer: the field itself is the
            // only thing that knows when the last piece left.
            if alive { Task { @MainActor in alive = false } }
            return
        }
        for p in field.particles {
            var c = context
            c.translateBy(x: p.x, y: p.y)
            c.rotate(by: .radians(p.rotation))
            c.opacity = min(1, max(0, p.life * 1.7))
            let paint = GraphicsContext.Shading.color(colors[p.color % max(1, colors.count)])
            c.fill(path(p), with: paint)
        }
    }

    /// The field is rebuilt from the seed on every frame rather than held in `@State`, because a
    /// `Canvas` closure is not allowed to mutate view state and a `TimelineView` may draw the same
    /// date twice. Cheap: 222 particles over at most 240 steps is arithmetic, and it is the same
    /// arithmetic `fx.js` does per frame anyway — the difference is only that this one starts over.
    /// The seed is the run and the size, so a resize is a new field rather than a jump.
    ///
    /// The multiply is done in `UInt64` on purpose, and it is not a matter of style. **A watchOS
    /// device is `arm64_32`: 64-bit registers, 32-bit pointers — and therefore a 32-bit `Int`.**
    /// Knuth's golden-ratio constant 2_654_435_761 (`0x9E3779B1`) is larger than `Int32.max`, so
    /// `run &* 2_654_435_761` does not compile there at all. Every simulator in this project is
    /// 64-bit and took it happily; the only thing that ever said otherwise was `xcodebuild archive`
    /// for a real device.
    private func seed(_ size: CGSize) -> UInt64 {
        let mixed = UInt64(bitPattern: Int64(run)) &* 0x9E37_79B1
        return mixed ^ UInt64(size.width.bitPattern &+ size.height.bitPattern)
    }

    private func path(_ p: ConfettiParticle) -> Path {
        switch p.shape {
        case 1: return heart(p.s)
        case 2: return star(p.s)
        case 3: return sparkle(p.s)
        case 4: return sprinkle(w: p.w * 1.15, h: p.h * 0.62)
        default:
            let hh = p.ribbon ? p.h * abs(cos(p.rotation * 1.7)) : p.h
            return Path(CGRect(x: -p.w / 2, y: -hh / 2, width: p.w, height: hh))
        }
    }

    // `fx.js`'s four shapes, curve for curve.

    private func heart(_ s: Double) -> Path {
        let t = s * 0.5
        var path = Path()
        path.move(to: CGPoint(x: 0, y: t * 0.62))
        path.addCurve(to: CGPoint(x: 0, y: -t * 0.55),
                      control1: CGPoint(x: t * 1.25, y: -t * 0.60),
                      control2: CGPoint(x: t * 0.62, y: -t * 1.52))
        path.addCurve(to: CGPoint(x: 0, y: t * 0.62),
                      control1: CGPoint(x: -t * 0.62, y: -t * 1.52),
                      control2: CGPoint(x: -t * 1.25, y: -t * 0.60))
        path.closeSubpath()
        return path
    }

    private func star(_ s: Double) -> Path {
        var path = Path()
        for i in 0..<10 {
            let r = (i % 2 == 1) ? s * 0.42 : s * 0.95
            let a = Double.pi / 5 * Double(i) - .pi / 2
            let point = CGPoint(x: cos(a) * r, y: sin(a) * r)
            if i == 0 { path.move(to: point) } else { path.addLine(to: point) }
        }
        path.closeSubpath()
        return path
    }

    private func sparkle(_ s: Double) -> Path {
        let a = s * 1.15, b = s * 0.20
        var path = Path()
        path.move(to: CGPoint(x: 0, y: -a))
        path.addQuadCurve(to: CGPoint(x: a, y: 0), control: CGPoint(x: b * 0.5, y: -b * 0.5))
        path.addQuadCurve(to: CGPoint(x: 0, y: a), control: CGPoint(x: b * 0.5, y: b * 0.5))
        path.addQuadCurve(to: CGPoint(x: -a, y: 0), control: CGPoint(x: -b * 0.5, y: b * 0.5))
        path.addQuadCurve(to: CGPoint(x: 0, y: -a), control: CGPoint(x: -b * 0.5, y: -b * 0.5))
        path.closeSubpath()
        return path
    }

    private func sprinkle(w: Double, h: Double) -> Path {
        Path(roundedRect: CGRect(x: -w / 2, y: -h / 2, width: w, height: h), cornerRadius: w / 2)
    }
}

// ---------------------------------------------------------------- what a hold on the count means

/// Start again, Lists, the theme, and the trace — the second of those is Phase 3's "no settings
/// screen" exception and the third is Phase 5's answer to a title that would not open a picker.
///
/// `NavigationLink` rather than a second `.sheet`: a sheet from a sheet on watchOS stacks two
/// dismiss gestures on top of each other, and the crown-and-swipe that gets you out of the inner one
/// is the same gesture that gets you out of the outer. For the Lists row that is not merely tidier —
/// a push cannot fail the way a presentation can, which is half of what this round is about.
struct CountActionsView: View {
    @Environment(WatchStore.self) private var store
    @Environment(WatchThemeStore.self) private var themeStore
    @Environment(\.watchTheme) private var theme
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            Button {
                store.startAgain()
                dismiss()
            } label: {
                Label {
                    Text("Start again").font(theme.ui(15, .body)).foregroundStyle(theme.text)
                } icon: {
                    Image(systemName: "arrow.counterclockwise").foregroundStyle(theme.accent)
                }
            }
            .buttonStyle(.plain)
            .disabled(!store.canEdit)
            .listRowBackground(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2))

            // **Lists.** Ungated by `canEdit` on purpose, for the same reason the hold itself is:
            // which list you are looking at is not a thing a view-only list may forbid you to change.
            // *Start again* above is the row that is disabled.
            //
            // It carries the count and the current list's name, because a row that says only "Lists"
            // makes a person open a screen to find out what they already had on the one they left —
            // and the count is what says whether there is anything to switch *to*. Absent below two,
            // which is the same rule the row at the top of Today follows.
            //
            // The name is `store.title`, which is what `ListPickerView.name(of:)` returns for the list
            // that is open: this row and the picker's row one push away are the same string computed
            // the same way, rather than the registry's name here and the document's name there.
            //
            // `dismiss` is handed down so that choosing a list closes the whole sheet onto it rather
            // than popping back here: the hold's menu is not where somebody wants to land after
            // asking to go and look at another list.
            if store.links.count > 1 {
                NavigationLink {
                    ListPickerView(door: .actions, dismissAll: dismiss).watchGround(theme)
                } label: {
                    Label {
                        VStack(alignment: .leading, spacing: 1) {
                            Text("Lists").font(theme.ui(15, .body)).foregroundStyle(theme.text)
                            Text(verbatim: "\(store.links.count) lists · \(store.title)")
                                .font(theme.ui(11, .caption2))
                                .foregroundStyle(theme.muted)
                                .lineLimit(1)
                                .truncationMode(.tail)
                        }
                    } icon: {
                        Image(systemName: "list.bullet").foregroundStyle(theme.accent)
                    }
                }
                .listRowBackground(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2))
            }

            NavigationLink {
                KitPickerView().watchGround(theme)
            } label: {
                Label {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Theme").font(theme.ui(15, .body)).foregroundStyle(theme.text)
                        Text(theme.kit.name).font(theme.ui(11, .caption2)).foregroundStyle(theme.muted)
                    }
                } icon: {
                    // The kit's own two colours, which is the only preview a row this size can hold.
                    Circle().fill(theme.accent)
                        .frame(width: 14, height: 14)
                        .overlay(Circle().strokeBorder(theme.hairSolid, lineWidth: 1))
                }
            }
            .listRowBackground(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2))

            // **In every build, not only in Debug**, and that is the whole point of it. Every other
            // instrument this project has is `#if DEBUG` behind a launch argument, so not one of them
            // exists on the device where Phase 5's four findings were found — which is how a feature
            // was able to look present and do nothing for a round with nothing going red.
            // `WatchDiagnostics` has the argument; this row is the door.
            //
            // Last, quiet, and in the muted token rather than the accent: it is not a thing anybody
            // needs. Nothing on that screen can carry a secret — every string there is written in this
            // repository and everything else is a number — so a photograph of it is safe to send.
            NavigationLink {
                DiagnosticsView().watchGround(theme)
            } label: {
                Label {
                    Text("Diagnostics").font(theme.ui(15, .body)).foregroundStyle(theme.muted)
                } icon: {
                    Image(systemName: "waveform.path.ecg").foregroundStyle(theme.muted)
                }
            }
            .listRowBackground(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(theme.ink2))
        }
        .scrollContentBackground(.hidden)
        .background(theme.ink)
        .navigationTitle { Text("Today").foregroundStyle(theme.accent) }
    }
}

// ---------------------------------------------------------------- -TFConfettiSelfTest

#if DEBUG
/// **How many frames the volley actually got.** A `Canvas` cannot write to view state, so the count
/// lives here. It is the only way to say what a watch simulator did with 222 rotating particles
/// rather than what it ought to have done.
enum ConfettiMeter {
    nonisolated(unsafe) static var draws = 0
    nonisolated(unsafe) static var first: Date?
    nonisolated(unsafe) static var last: Date?

    static func tick(_ now: Date) {
        if first == nil { first = now }
        last = now
        draws += 1
    }

    static var report: String {
        guard let first, let last, draws > 1 else { return "frames=\(draws) (nothing drawn yet)" }
        let seconds = last.timeIntervalSince(first)
        guard seconds > 0 else { return "frames=\(draws) over 0s" }
        return String(format: "frames=%d over %.2fs = %.1f/s", draws, seconds, Double(draws - 1) / seconds)
    }
}

/// `-TFConfettiSelfTest`. The volley, walked off-screen for every kit this device can render.
///
/// It exists for the same reason `-TFFontSelfTest` does: **the failure is silent.** A field whose
/// particles all leave on frame one, a `shapes` value read as the wrong kind, a decay that never
/// reaches zero and keeps a `TimelineView` awake forever — every one of those is a screenshot that
/// looks like a screenshot of confetti, or of nothing, and neither says which.
///
/// Nothing here draws. It steps the same `ConfettiField` the `Canvas` steps, on the same 208×248 the
/// simulator reports, and asks it four questions per kit.
@MainActor
enum ConfettiSelfTest {

    static func runIfAsked(_ kits: [Kit]) async {
        guard ProcessInfo.processInfo.arguments.contains("-TFConfettiSelfTest") else { return }
        run(kits)
    }

    static func run(_ kits: [Kit]) {
        func say(_ s: String) { print("[tfive] confetti self-test: \(s)") }
        // The Series 11 46mm, in points. A field is size-relative, so the number that matters is the
        // ratio it produces, and that is printed.
        let size = CGSize(width: 208, height: 248)
        var failures: [String] = []
        var checked = 0, passed = 0
        func check(_ ok: Bool, _ what: @autoclosure () -> String) {
            checked += 1
            if ok { passed += 1 } else { failures.append(what()) }
        }

        say("begin kits=\(kits.count) canvas=\(Int(size.width))x\(Int(size.height)) "
            + String(format: "k=%.3f", size.height / ConfettiField.referenceHeight))

        var shapeTally: [String: [Int: Int]] = [:]
        var lifetimes: [String: Int] = [:]

        for kit in kits {
            // 1. the full volley arrives, and arrives staggered.
            var field = ConfettiField(size: size, kit: kit, seed: 1)
            field.advance(to: 0)
            let atFirstFrame = field.particles.count
            field.advance(to: 12)                       // just before the wide burst at 210 ms
            let beforeWide = field.particles.count
            field.advance(to: 14)
            let afterWide = field.particles.count

            check(atFirstFrame == ConfettiField.burstCount,
                  "\(kit.id): frame 0 has \(atFirstFrame) particles, not one burst of \(ConfettiField.burstCount)")
            check(beforeWide > atFirstFrame,
                  "\(kit.id): the seven bursts did not stagger — \(beforeWide) at frame 12")
            check(afterWide >= beforeWide,
                  "\(kit.id): the wide burst did not land by frame 14")

            // 2. it stays on screen. A volley that leaves through the top is the failure the length
            //    scale exists to prevent, so this asks how much of it is still inside the frame at
            //    the moment it is most spread out.
            var peak = ConfettiField(size: size, kit: kit, seed: 1)
            peak.advance(to: 45)
            let onScreen = peak.particles.filter { $0.y >= 0 && $0.y <= size.height }.count
            check(!peak.particles.isEmpty && Double(onScreen) / Double(peak.particles.count) > 0.5,
                  "\(kit.id): only \(onScreen)/\(peak.particles.count) of the volley is on screen at frame 45")

            // 3. it ends. The whole reason the view removes itself.
            var end = ConfettiField(size: size, kit: kit, seed: 1)
            var frame = 0
            while end.isAlive && frame < 600 { frame += 1; end.advance(to: frame) }
            check(!end.isAlive, "\(kit.id): the field never emptied — a TimelineView left awake forever")
            lifetimes[kit.id] = frame

            // 4. the shapes are the kit's. Ten fields, so the tally is of the rule rather than of
            //    one seed's luck.
            var tally: [Int: Int] = [:]
            for seed in 0..<10 {
                var f = ConfettiField(size: size, kit: kit, seed: UInt64(seed))
                f.advance(to: 14)
                for p in f.particles { tally[p.shape, default: 0] += 1 }
            }
            shapeTally[kit.id] = tally
            let allowed = Set(kit.shapes)
            check(Set(tally.keys).isSubset(of: allowed),
                  "\(kit.id): drew shapes \(Set(tally.keys).sorted()) outside \(allowed.sorted())")
        }

        // What each kit actually drew, said out loud, because it is the one thing about this port
        // that a reader cannot check by looking at the screen.
        for kit in kits {
            let shapes = (shapeTally[kit.id] ?? [:]).keys.sorted()
            say("\(kit.id): shapes=\(kit.shapes) → drew \(shapes) "
                + "· palette=\(kit.confetti.count) · ends at frame \(lifetimes[kit.id] ?? -1)")
        }

        for f in failures { say("FAIL \(f)") }
        say("end pass=\(passed)/\(checked)")
    }
}
#endif
