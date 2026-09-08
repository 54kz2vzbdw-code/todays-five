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
import SwiftUI
import WidgetKit

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

    var body: some View {
        switch family {
        case .accessoryInline:
            // `3/5` and nothing else. Inline is one line of text beside the time; anything more is
            // truncated by the face, not by us.
            Text(snapshot.hasList ? snapshot.fraction : "—")

        case .accessoryCorner:
            Text("\(snapshot.done)")
                .font(.system(.title2, design: .rounded, weight: .semibold))
                .widgetAccentable()
                .widgetLabel {
                    // Along the bezel: the ring is the label's own, drawn by the face.
                    Gauge(value: fraction) {
                        Text(snapshot.fraction)
                    }
                }

        default:
            Gauge(value: fraction) {
                Text("Today")
            } currentValueLabel: {
                Text("\(snapshot.done)")
                    .font(.system(.title3, design: .rounded, weight: .semibold))
                    .widgetAccentable()
            }
            .gaugeStyle(.accessoryCircularCapacity)
        }
    }

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
                    .font(.system(.headline, design: .rounded, weight: .semibold))
                    .widgetAccentable()
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            // Off, this is the list's name and a count — useful, and nobody's words. On, it is the
            // line, which is the whole reason the switch exists.
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
