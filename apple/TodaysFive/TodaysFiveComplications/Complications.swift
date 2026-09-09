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
// | corner        | the count again, with `.widgetLabel` along the bezel                  |
// | inline        | `3/5` and nothing else                                                |
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
            // one family the kit cannot reach at all.
            Text(snapshot.hasList ? snapshot.fraction : "—")

        case .accessoryCorner:
            Text("\(snapshot.done)")
                .font(FaceType.count(snapshot, size: 22, relativeTo: .title2))
                .widgetAccentable()
                .widgetLabel {
                    // Along the bezel: the ring is the label's own, drawn by the face.
                    Gauge(value: fraction) {
                        Text(snapshot.fraction)
                    }
                }

        default:
            if FaceType.prefersNumbers(snapshot) {
                // The mono kits: the numbers, in their own face, and no ring. See
                // `FaceType.prefersNumbers`.
                VStack(spacing: -2) {
                    Text("\(snapshot.done)")
                        .font(FaceType.count(snapshot, size: 20, relativeTo: .title2))
                        .widgetAccentable()
                    Text("\(snapshot.total)")
                        .font(FaceType.count(snapshot, size: 13, relativeTo: .caption))
                        .opacity(0.7)
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
                            Text("\(snapshot.done)")
                                .font(FaceType.count(snapshot, size: 17, relativeTo: .title3))
                        }
                    }
                    .widgetAccentable()
                }
                .gaugeStyle(.accessoryCircularCapacity)
            }
        }
    }

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

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            HStack(spacing: 4) {
                Text(snapshot.hasList ? snapshot.fraction : "—")
                    .font(FaceType.count(snapshot, size: 16, relativeTo: .headline))
                    .widgetAccentable()
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            // Off, this is the list's name and a count — useful, and nobody's words. On, it is the
            // line, which is the whole reason the switch exists. It is **not** `.widgetAccentable()`
            // — see the note at `CountView.body`.
            Text(second)
                .font(.system(.body, design: .rounded))
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
