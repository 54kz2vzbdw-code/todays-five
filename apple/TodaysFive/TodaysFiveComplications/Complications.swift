// Complications.swift — the widget bundle and the four accessory families.
//
// There are exactly four `WidgetFamily` cases on watchOS — `.accessoryCircular`,
// `.accessoryRectangular`, `.accessoryCorner`, `.accessoryInline` — and every `system*` case is
// explicitly unavailable. All four are here, plus an Add complication that is a button rather than a
// reading.
//
// | family        | what it shows                                                        |
// | circular      | the count, with the accent ring                                       |
// | rectangular   | the next unfinished line — **opt-in**, off by default                 |
// | corner        | the **fraction**, with a curved **text** label along the bezel        |
// | inline        | `3/5` and nothing else                                                |
//
// ============================================================================================
// PHASE 5: WHAT A REAL WRIST SAID, AND WHAT THE CODE SAID BACK
// ============================================================================================
//
// The finding, off a real Apple Watch, bottom-left corner slot: the complication reads as **"a 1 and
// a dot on a line"**. That is not a mystery, it is a reading. The `.accessoryCorner` arm was
// `Text("\(snapshot.done)")` — the **done count alone, no denominator** — with a `Gauge` in
// `.widgetLabel`, which the host draws as a thin arc along the bezel. A bare digit and a three-point
// arc is exactly what "a 1 and a dot on a line" describes, so this one was diagnosable by reading and
// only the replacement needs a face.
//
// **What replaced it, and the numbers the choice rests on.**
//
//   * the content slot gets the **fraction**. `3/5` is three characters where `3` was one, and the
//     three carry the whole glance: a bare `1` on a corner says nothing at all, because the corner —
//     unlike the circular family — has no ring around it to be the denominator;
//   * the bezel label becomes **`Text`** rather than a `Gauge`. A curved word is legible at that
//     size; a three-point arc is a mark, not a reading;
//   * the finished-list **check** is kept, and is the one case where a glyph replaces the fraction
//     rather than sitting beside it. There is no room for both — see the widths below.
//
// Measured on this machine with `fontTools` over the thirteen **ui-bold** faces the snapshot can name
// (`kit.type?.uiBold`, which is what `WatchApp.swift` publishes as `face`): every one of the thirteen
// carries the ten digits, `U+002F` and `U+2014`, so neither the fraction nor the no-list em dash can
// tofu on any kit. Advance widths, in ems:
//
// | | narrowest | widest |
// | `3` | 0.527 (JosefinSans-Thin-700) | 0.625 (ArchivoSemiBold-Regular-800) |
// | `3/5` | 1.458 (SourceSerif4-Regular-600) | **1.800** (IBMPlexMono-SemiBold) |
// | `12/15` | 2.210 | **3.000** |
//
// So `3/5` costs about 2.7× the width of the bare digit it replaces, and at **17 pt** the widest face
// draws it in **30.6 pt** — which is why 17 is the number in the code rather than the 22 that was
// there. `minimumScaleFactor(0.5)` covers the two-digit list: `12/15` at 17 pt wants 51 pt, scales
// into a 32 pt square, and was rendered and looked at rather than assumed to be legible there.
//
// **The instrument, and what it cannot see.** Those renderings are `ImageRenderer` on macOS over a
// *transcription* of these view bodies, in a throwaway package under `/tmp`, outside the repository —
// the only way to look at pixels this round had, since `simctl` cannot tap a watch simulator, driving
// the Simulator app was requested and declined, and no real Watch is reachable from this machine. It
// shows what **the app's own layer** draws: how many characters fit, where a line truncates, when
// `minimumScaleFactor` starts eating the type. It shows **nothing** the widget host does — not the
// bezel label, not `.accented` flattening, not the real slot rectangle, and not whether the host
// permits a custom face at render time. Two further blind spots, named because they shaped what was
// looked at: an accessory `Gauge` style **draws nothing at all** outside a widget context (the note
// below records the Watch app finding the same thing in Phase 3), so the ring is in none of this
// round's pictures; and `Font.TextStyle` resolves to different points on macOS than on watchOS, which
// is why the sizes that decide fit are written as explicit points below rather than as `.body` and
// `.caption2`.
//
// **On the gauge style.** `.accessoryCircularCapacity` draws a *ring* around a value in the middle;
// `.accessoryCircular` draws a dial with a needle and tick marks, which is a speedometer and not a
// progress ring. Capacity is what this uses: three of five done is a proportion filled, not a
// position on a scale.
//
// Both were put side by side in the Watch app under a throwaway launch argument to be looked at
// rather than reasoned about, and **neither rendered anything at all**: an accessory gauge style is
// for a widget context and draws nothing inside an ordinary app view. So the choice above rests on
// the two styles' contracts, and the only thing that can settle the *look* is a face editor — which
// needs a tap, and `simctl` cannot tap a watch simulator. That is a verification item, written down
// rather than claimed.
//
// The extension reads `WatchSnapshot` from the App Group and **never a link**. It does not depend on
// `TodaysFiveCore`.
//
// ============================================================================================
// THE KIT'S ACCENT CANNOT REACH THE FACE. THIS IS THE PARAGRAPH THAT SAYS SO.
// ============================================================================================
//
// **What was asked.** Phase 4 gave the Watch eighteen kits, each with its own accent — Terminal's
// `#4AF07A`, Paper's `#C8321F`, Dark's `#A86014` — and asked that the complication follow the kit
// the way every other surface now does.
//
// **What the SDK does.** It cannot. `WidgetRenderingMode.accented` — the mode every watchOS
// complication is drawn in on the great majority of faces — says in its own words that the system
// "treats the widget's views as if they were template images. It replaces the view's color —
// rendering the new colors while preserving the view's alpha channel." The colour that replaces it
// is the one the wearer chose in the **face editor**, not the one the app chose. The escape hatch
// that exists on the phone, `WidgetAccentedRenderingMode.fullColor`, is documented in one sentence:
// "Only applies to iOS." There is no watchOS equivalent, no opt-out, and no entitlement.
//
// The alpha channel surviving is the whole of what an app gets to say. A view's *shape* crosses. Its
// *colour* does not. `.widgetAccentable()` does not add a colour either — it moves a subview from
// the face's neutral group into the face's accent group, both of which are the face's.
//
// **This was observed rather than taken on trust, and the observation is itself worth having.**
// `-TFFaceProbe` in the Watch app renders a filled rectangle in a kit's accent through
// `ImageRenderer` twice, once at `.fullColor` and once at `.accented`, and reads the pixels back.
// The two renderings come out **byte-identical**: SwiftUI does not flatten anything, which means the
// flattening is done by the widget host at composite time and is therefore not reachable, not
// overridable, and not visible to any test that does not involve a watch face and a finger. The
// probe's value is in ruling out the cheerful hypothesis — that `.accented` is a SwiftUI-side
// treatment an app could see coming and compensate for. It is not.
//
// **What was built instead.** Everything a kit *can* change on a face, which is more than nothing:
//
// | the **type**            | the count is set in the kit's own ui face, by PostScript name           |
// | **gauge or text**       | a monospaced pair gets the numbers; every other pair gets the ring      |
// | the **glyph**           | finished / unfinished, and the type it is set in                        |
// | **`.widgetAccentable`** | which subview joins the face's accent group — see the note at `CountView` |
//
// And the theme reaches all four through `WatchSnapshot`, additively, with `v` left at 1. See that
// file for why that is the compatibility rule rather than a shortcut past it.
//
// **A per-kit glyph was considered and rejected.** It would need an id-to-symbol table inside the
// appex — eighteen rows of design decision with nothing generating it, nothing checking it, and
// nothing to notice when a nineteenth kit is added. The extension does not link `TodaysFiveCore` and
// must not grow a hand-written copy of a table that lives somewhere else. `pair` is the one
// kit-shaped input it can act on without one, so `pair` is what drives the one structural choice.
import SwiftUI
import WidgetKit

// ---------------------------------------------------------------- the kit's type, in the appex

/// The face the count is set in. See `WatchFaceType` in `WatchSnapshot.swift` for the mechanism —
/// short version: the appex is *inside* the Watch app's bundle, so the app's 33 `.ttf` are two
/// directories up, and registering them for the process costs no copy and no build entry.
///
/// **It falls back to the system face without complaining**, which is deliberate: the last link —
/// the widget host actually permitting this at render time — could not be observed on a simulator
/// that cannot be tapped, so the failure mode had to be a complication that looks the way it did in
/// Phase 3 rather than one that does not draw.
///
/// **Phase 5 did not settle it either, and here is how a wrist can, by looking.** Put the count
/// complication on a face with the Watch on the **Terminal** kit. Terminal's ui-bold face is
/// `IBMPlexMono-SemiBold`: squared-off, monospaced, `3` and `5` the same width, a straight-cut
/// terminal on every stroke.
///
///   * **pass** — the fraction is set in that face: the two digits are the same width and the shapes
///     are mechanical;
///   * **fail** — the fraction is set in the system's rounded face: the `3` is visibly narrower than
///     the `5` and the strokes end round.
///
/// The two are told apart at a glance and neither is a crash, which is the point of the fallback: if
/// the host refuses the face, the complication still draws, in the face Phase 3 shipped.
///
/// Nothing in this extension traces. `WatchDiagnostics` lives in the Watch app's target and a widget
/// rendering is a different process with a different lifetime, so a failure here leaves no line
/// anywhere — a face is the only instrument, and it is the wearer's eyes.
enum FaceType {
    /// Once per process. A widget rendering is short; a `static let` is exactly its lifetime.
    private static let registered = WatchFaceType.register()

    static func count(_ snapshot: WatchSnapshot, size: CGFloat,
                      relativeTo style: Font.TextStyle) -> Font {
        _ = registered
        guard WatchFaceType.resolves(snapshot.face) else {
            return .system(style, design: .rounded, weight: .semibold)
        }
        return .custom(snapshot.face, size: size, relativeTo: style)
    }

    /// `theme.js`'s two monospaced kits — Terminal and Teletype — share one pair, and on a face a
    /// monospaced pair's whole identity is that it sets numbers in a grid. So those two get the
    /// **numbers** where every other kit gets the ring.
    ///
    /// Worth naming as a choice rather than a derivation: nothing in the SDK says a mono kit should
    /// prefer text, and a ring is the better glance for most people most of the time. This is the
    /// one structural thing a kit can change on a face at all, and spending it on the pair that
    /// most wants it is more interesting than spending it on nothing.
    static func prefersNumbers(_ snapshot: WatchSnapshot) -> Bool { snapshot.pair == "mono" }
}

@main
struct TodaysFiveComplications: WidgetBundle {
    var body: some Widget {
        CountComplication()
        NextLineComplication()
        AddComplication()
    }
}

// ---------------------------------------------------------------- the count

struct CountComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TodaysFiveCount", provider: CountProvider()) { entry in
            CountView(entry: entry)
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        }
        .configurationDisplayName("Today's Five")
        .description("How much of Today is done.")
        .supportedFamilies([.accessoryCircular, .accessoryCorner, .accessoryInline])
    }
}

struct CountView: View {
    @Environment(\.widgetFamily) private var family
    let entry: SnapshotEntry

    private var snapshot: WatchSnapshot { entry.snapshot }

    /// **Which subview carries `.widgetAccentable()` is the only colour lever an app has on a
    /// watch face, and it is not a colour.** It moves a view from the face's neutral group into the
    /// face's *accent* group — two groups, both of them the wearer's. The rule here is the same on
    /// every family and is about meaning rather than about looks: **the count is accented, and
    /// anybody's words are not.** A number the wearer chose to put on their face should read as the
    /// thing they put there; a line lifted off their list should sit quietly in the neutral group,
    /// the same way it is opt-in in the first place.
    var body: some View {
        switch family {
        case .accessoryInline:
            // `3/5` and nothing else. Inline is one line of text beside the time; anything more is
            // truncated by the face, not by us. Inline ignores fonts as well as colours — it is the
            // one family the kit cannot reach at all, and that is the SDK's doing, not ours. No font
            // is asked for here on purpose: asking and being ignored is worse than not asking,
            // because it reads like a bug in this file rather than a limit of the platform.
            Text(snapshot.hasList ? snapshot.fraction : "—")

        case .accessoryCorner:
            corner

        default:
            circular
        }
    }

    // ---------------------------------------------------------------- the corner

    /// A tiny content area plus a curved bezel label, and the two carry different things: the
    /// **numbers** go in the content slot, where they are read up close, and **words** go on the
    /// curve, where they are read at a glance.
    @ViewBuilder
    private var corner: some View {
        Group {
            if finished {
                // The one case where a glyph replaces the fraction instead of joining it. `5/5` and
                // a check say the same thing twice and the corner has room for one of them; the
                // check is the one that reads without being read.
                Image(systemName: "checkmark")
                    .font(.system(size: 15, weight: .semibold))
            } else {
                Text(snapshot.hasList ? snapshot.fraction : "—")
                    .font(FaceType.count(snapshot, size: 17, relativeTo: .title3))
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
            }
        }
        .widgetAccentable()
        .widgetLabel { Text(verbatim: cornerLabel) }
    }

    /// **What the bezel says, and why it is never the list's name.**
    ///
    /// The corner label is drawn along the outside of the watch face. It is on screen whenever the
    /// face is, at the largest type of anything this extension draws, and it is read by whoever is
    /// standing next to the wearer. The rectangular family puts a line of somebody's list on a face
    /// only behind an explicit opt-in, for exactly that reason (`ComplicationsIntent.swift`) — and a
    /// label with **no** opt-in at all should therefore hold strictly less, not more.
    ///
    /// So: counts, in this file's own words, and nothing that came off anybody's list. Not the
    /// nickname, not the document's name, not a line. The phrases are short because the label is a
    /// curve — `NextLineView` keeps the longer form of the same sentence, where there is room for it.
    private var cornerLabel: String {
        guard snapshot.hasList else { return "Today's Five" }
        guard snapshot.total > 0 else { return "Nothing today" }
        guard snapshot.done < snapshot.total else { return "All done" }
        return "\(snapshot.total - snapshot.done) to go"
    }

    // ---------------------------------------------------------------- the circular one

    /// A round slot: a ring, and about two characters inside it. Unchanged in shape from Phase 4 —
    /// the ring **is** the denominator here, which is why a bare `done` is right in the middle of it
    /// and wrong in a corner. The one thing that moved is the no-list reading: see below.
    @ViewBuilder
    private var circular: some View {
        if FaceType.prefersNumbers(snapshot) {
            // The mono kits: the numbers, in their own face, and no ring. See
            // `FaceType.prefersNumbers`.
            VStack(spacing: -2) {
                Text(count)
                    .font(FaceType.count(snapshot, size: 20, relativeTo: .title2))
                    .widgetAccentable()
                if snapshot.hasList {
                    Text("\(snapshot.total)")
                        .font(FaceType.count(snapshot, size: 13, relativeTo: .caption))
                        .opacity(0.7)
                }
            }
            .minimumScaleFactor(0.6)
            .lineLimit(1)
        } else {
            Gauge(value: fraction) {
                Text("Today")
            } currentValueLabel: {
                // The glyph, and the one place it changes: a finished list puts a check in the
                // middle of a full ring rather than the number the ring is already saying. Not
                // per-kit — see the note about the rejected id-to-symbol table at the top — but
                // the count beside it is, because it is set in the kit's face.
                Group {
                    if finished {
                        Image(systemName: "checkmark")
                            .font(.system(size: 15, weight: .semibold))
                    } else {
                        Text(count)
                            .font(FaceType.count(snapshot, size: 17, relativeTo: .title3))
                    }
                }
                .widgetAccentable()
            }
            .gaugeStyle(.accessoryCircularCapacity)
        }
    }

    /// **`0` and `—` are different sentences and the face used to say the first when it meant the
    /// second.** With no list the snapshot's `done` is 0, so an empty ring around a `0` read as
    /// "you have finished none of today" when what it actually meant was "no phone has named a list
    /// yet". `WatchSnapshot` keeps `hasList` separate from an empty list precisely so the two can be
    /// told apart, and until now only the inline family used it. The em dash is in all thirteen
    /// ui-bold faces — measured, not assumed.
    private var count: String { snapshot.hasList ? "\(snapshot.done)" : "—" }

    /// Finished, and not merely empty. `total == 0` is a day with nothing on it, which is not the
    /// same thing and does not get the check.
    private var finished: Bool { snapshot.hasList && snapshot.total > 0 && snapshot.done >= snapshot.total }

    /// Nothing on Today is an empty ring rather than a full one: a list with no lines is not a list
    /// that is finished, and the difference is the whole point of the glance.
    private var fraction: Double {
        guard snapshot.hasList, snapshot.total > 0 else { return 0 }
        return min(1, Double(snapshot.done) / Double(snapshot.total))
    }
}

// ---------------------------------------------------------------- the next line

struct NextLineComplication: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "TodaysFiveNextLine",
                               intent: NextLineConfiguration.self,
                               provider: NextLineProvider()) { entry in
            NextLineView(entry: entry)
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        }
        .configurationDisplayName("Next on Today")
        .description("The count, and — if you turn it on — the next unfinished line.")
        .supportedFamilies([.accessoryRectangular])
    }
}

struct NextLineView: View {
    let entry: SnapshotEntry

    private var snapshot: WatchSnapshot { entry.snapshot }

    /// **The two-line allowance was nominal, and the probe caught it.** This view asked for
    /// `lineLimit(2)` at `.body`, which on a 45/46 mm watch is about 16 pt — under a 16 pt count row,
    /// in a slot a few tens of points tall, that is one line of room, not two. Rendered at three
    /// plausible content sizes (140×38, 160×44, 176×50 pt), a 34-character line came out truncated to
    /// **17, 19 and 21 characters** — one line, at every one of the three: `Call the pharmacy a…`.
    /// The line the wearer had to go into the face editor and switch on was arriving as a fragment.
    ///
    /// Three changes, and each is there because a picture showed it:
    ///
    ///   * the line is set at an explicit **13 pt** instead of `.body`. At 160×44 the whole
    ///     34-character line now fits on one line; at 176×50 it wraps to two and is shown whole; at
    ///     140×38 it truncates at 27 characters rather than 17;
    ///   * **`fixedSize` is gone.** With it, two lines of 13 pt plus the count row overflowed the
    ///     frame at the smallest size — drawn outside the rectangle, which on a face is drawn nowhere.
    ///     Without it the text takes the height it is given and truncates inside the slot, which is
    ///     the failure that can be read;
    ///   * the sizes are **explicit points**, not `.body` and `.caption2`, because `Font.TextStyle`
    ///     resolves differently on macOS than on watchOS and a number that decides whether a line
    ///     survives should not change between the machine that measured it and the wrist that shows
    ///     it. The count keeps `relativeTo:` — it is the one thing here small enough to grow.
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 4) {
                Text(snapshot.hasList ? snapshot.fraction : "—")
                    .font(FaceType.count(snapshot, size: 16, relativeTo: .headline))
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .widgetAccentable()
                Text(title)
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            // Off, this is the list's name and a count — useful, and nobody's words. On, it is the
            // line, which is the whole reason the switch exists. It is **not** `.widgetAccentable()`
            // — see the note at `CountView.body`.
            Text(second)
                .font(.system(size: 13, design: .rounded))
                .lineLimit(2)
                .minimumScaleFactor(0.75)
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private var title: String {
        guard snapshot.hasList else { return "" }
        return snapshot.name
    }

    private var second: String {
        guard snapshot.hasList else { return "Open a list on your iPhone" }
        guard entry.showLine else {
            return snapshot.total == 0 ? "Nothing on Today"
                 : (snapshot.done == snapshot.total ? "That's the list." : "\(snapshot.total - snapshot.done) to go")
        }
        if snapshot.next.isEmpty {
            return snapshot.total == 0 ? "Nothing on Today" : "That's the list."
        }
        return snapshot.next
    }
}

// ---------------------------------------------------------------- Add

/// Tap it and the app opens straight into the add flow. `WKApplicationDelegate` has no url-opening
/// callback, so the app receives this with SwiftUI's `onOpenURL` — see `WatchApp.swift`.
///
/// The scheme needs `CFBundleURLTypes` in `Config/WatchInfo.plist`, which is not this track's file.
/// The exact snippet is in the round's report.
struct AddComplication: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "TodaysFiveAdd", provider: AddProvider()) { _ in
            AddView()
                .containerBackground(for: .widget) { AccessoryWidgetBackground() }
        }
        .configurationDisplayName("Add to Today's Five")
        .description("Open Today's Five ready to add a line.")
        .supportedFamilies([.accessoryCircular, .accessoryCorner])
    }
}

struct AddView: View {
    @Environment(\.widgetFamily) private var family

    var body: some View {
        Group {
            if family == .accessoryCorner {
                Image(systemName: "plus")
                    .font(.system(size: 18, weight: .semibold))
                    .widgetAccentable()
                    .widgetLabel("Add")
            } else {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .semibold))
                    .widgetAccentable()
            }
        }
        .widgetURL(URL(string: "todaysfive://add"))
    }
}
