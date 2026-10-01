// WidgetViews.swift — every family, drawn for where it lives.
//
//   Next up      small: the next line, large, and its box (StandBy: the same, on the night, bigger than the room)
//                Lock Screen rectangular: the next line under the count, hidden until the phone knows its person
//   Today        medium: the lines with their boxes, four at a time; sealed, the day's line and the stamp
//                large: every line, a note where there is room, the bar, and the stamp under a finished day
//   Progress     small: the ring and what is left; Lock Screen circular: the gauge; inline: the count and the next line
//
// The kit is the device's: its Day or Night theme by the device's own switch (WidgetLook), its type, its box, its
// stamp. Nothing here reaches the network: a view draws what the timeline handed it.
import AppIntents
import SwiftUI
import TodaysFiveCore
import WidgetKit

// ---------------------------------------------------------------- where it is drawn

/// Where a widget is being drawn, when something other than WidgetKit is drawing it: the lab, which renders every
/// family and every place for a check (`-TFWidgetLab`, debug builds). Nil in a real widget, where the system's own
/// `widgetFamily` and `showsWidgetContainerBackground` say it — neither of which can be set from outside.
struct WidgetStage: Sendable, Equatable {
    var family: WidgetFamily
    var background: Bool
}

private struct WidgetStageKey: EnvironmentKey { static let defaultValue: WidgetStage? = nil }

extension EnvironmentValues {
    var widgetStage: WidgetStage? {
        get { self[WidgetStageKey.self] }
        set { self[WidgetStageKey.self] = newValue }
    }
}

/// The family and the ground a view should draw for: the stage's when there is one, else the system's.
struct Place: DynamicProperty {
    @Environment(\.widgetFamily) private var envFamily
    @Environment(\.showsWidgetContainerBackground) private var envBackground
    @Environment(\.widgetStage) private var stage
    var family: WidgetFamily { stage?.family ?? envFamily }
    var background: Bool { stage?.background ?? envBackground }
}

// ---------------------------------------------------------------- dressing an entry

/// One entry, dressed for where it is being drawn.
struct Dressed {
    let kit: Kit
    let pal: Palette
    let finale: String
    let mat: String
}

extension DayEntry {
    /// StandBy is the nightstand — the ground is taken away and the room is dark — so a small widget there wears the
    /// device's Night theme on black, whatever the switch says. Everywhere else it is the slot the device has on.
    func dressed(_ scheme: ColorScheme, _ mode: WidgetRenderingMode, background: Bool, family: WidgetFamily) -> Dressed {
        let standBy = !background && family == .systemSmall
        let slot = standBy ? "night" : look.slot(at: date, systemDark: scheme == .dark)
        let kl = look.look(slot)
        KitFonts.register(kl.kit)
        return Dressed(kit: kl.kit, pal: Palette(kit: kl.kit, mode: mode, onBlack: standBy), finale: kl.finale, mat: kl.mat)
    }

    /// Where a tap that is not on a box takes the person: the list, in the app — or, on an empty Today of a list
    /// they can write to, straight into the composer, since adding a line is the only thing to do there.
    var listURL: URL? {
        guard state == .list, !day.key.isEmpty else { return URL(string: "todaysfive://open") }
        if day.total == 0 && !day.viewOnly && !day.gone { return URL(string: "todaysfive://add") }
        return URL(string: "todaysfive://list/\(day.key)")
    }

    var interactive: Bool { state == .list && !day.viewOnly && !day.gone }
}

/// The rail's voice: the ui face, bold, spaced capitals, quiet.
struct Caps: View {
    let text: String
    let d: Dressed
    var size: CGFloat = 10
    var color: Color? = nil
    var body: some View {
        Text(text.uppercased())
            .font(d.kit.ui(size, bold: true))
            .tracking(size * 0.15)
            .foregroundStyle(color ?? d.pal.dim)
            .lineLimit(1)
    }
}

/// "3/5": the done number in the line's ink, rolling when it changes.
struct CountText: View {
    let done: Int
    let total: Int
    let d: Dressed
    var size: CGFloat = 11
    var body: some View {
        (Text("\(done)").foregroundStyle(d.pal.accentText) + Text("/\(total)").foregroundStyle(d.pal.muted))
            .font(d.kit.ui(size, bold: true))
            .monospacedDigit()
            .contentTransition(.numericText(value: Double(done)))
            .accessibilityLabel(Text("\(done) of \(total) done"))
    }
}

/// A sentence where the lines would be: no list, a list never read, a list gone, an empty Today.
struct Notice: View {
    let title: String
    var detail: String? = nil
    let d: Dressed
    var size: CGFloat = 17
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title).font(d.kit.task(size)).tracking(d.kit.tracking(size)).foregroundStyle(d.pal.text)
                .lineLimit(3).minimumScaleFactor(0.75)
            if let detail { Text(detail).font(d.kit.ui(size * 0.62)).foregroundStyle(d.pal.muted).lineLimit(3) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension DayEntry {
    /// The notice for a state that has no lines to show, or nil when there are lines.
    func notice(compact: Bool) -> (String, String?)? {
        switch state {
        case .noList: return ("Make a list in Today's Five.", compact ? nil : "It shows up here once there's one on this phone.")
        case .unread: return ("Waiting for the list.", compact ? nil : "It fills in once the phone is online.")
        case .list, .sample:
            if day.gone { return ("This list isn't here any more.", compact ? nil : "Open Today's Five to choose another.") }
            if day.total == 0 { return ("Nothing on Today yet.", compact ? nil : "Add a line in Today's Five and it shows up here.") }
            return nil
        }
    }
}

/// The finish: the day's line in the kit's own words, and the stamp.
struct FinaleBlock: View {
    let d: Dressed
    let date: Date
    var size: CGFloat = 20
    var stamp: CGFloat = 9.5
    /// A small widget: the date without its weekday comes first, at full size, before anything shrinks.
    var compact = false
    var body: some View {
        VStack(alignment: .leading, spacing: size * 0.6) {
            Text(d.finale)
                .font(d.kit.task(size))
                .tracking(d.kit.tracking(size))
                .italic(d.kit.finaleItalic)
                .foregroundStyle(d.pal.accentText)
                .lineLimit(2).minimumScaleFactor(0.7)
                .widgetAccentable()
            // the stamp at its size if it fits, smaller if not, and then without the weekday: never past the edge
            ViewThatFits(in: .horizontal) {
                if !compact {
                    SealStamp(date: date, size: stamp, pal: d.pal, kit: d.kit, mat: d.mat).padding(.horizontal, stamp * 0.5)
                    SealStamp(date: date, size: stamp * 0.86, pal: d.pal, kit: d.kit, mat: d.mat).padding(.horizontal, stamp * 0.45)
                }
                SealStamp(date: date, size: stamp, pal: d.pal, kit: d.kit, mat: d.mat, short: true).padding(.horizontal, stamp * 0.5)
                SealStamp(date: date, size: stamp * 0.86, pal: d.pal, kit: d.kit, mat: d.mat, short: true).padding(.horizontal, stamp * 0.45)
                SealStamp(date: date, size: stamp * 0.74, pal: d.pal, kit: d.kit, mat: d.mat, short: true).padding(.horizontal, stamp * 0.4)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .transition(.scale(scale: 1.6).combined(with: .opacity))
    }
}

// ---------------------------------------------------------------- Next up

struct NextUpView: View {
    let entry: DayEntry
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetRenderingMode) private var mode
    var place = Place()
    private var background: Bool { place.background }
    private var family: WidgetFamily { place.family }

    var body: some View {
        let d = entry.dressed(scheme, mode, background: background, family: family)
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Caps(text: entry.day.name.isEmpty ? "Today" : entry.day.name, d: d, size: 9.5)
                Spacer(minLength: 0)
            }
            Spacer(minLength: 6)
            if let (title, detail) = entry.notice(compact: true) {
                Notice(title: title, detail: detail, d: d, size: 16)
                Spacer(minLength: 0)
            } else if let next = entry.day.next {
                Text(next.text)
                    .font(d.kit.task(21, .title3))
                    .tracking(d.kit.tracking(21))
                    .foregroundStyle(d.pal.text)
                    .lineLimit(4).minimumScaleFactor(0.58)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .id(next.id)
                    .transition(.push(from: .bottom))
                Spacer(minLength: 8)
                HStack(alignment: .center, spacing: 9) {
                    if entry.interactive {
                        Toggle(isOn: false, intent: CheckLineIntent(list: entry.day.key, line: next.id, done: true)) { EmptyView() }
                            .toggleStyle(KitCheckStyle(size: 26, pal: d.pal, mat: d.mat))
                            .accessibilityLabel(Text("Cross off \(next.text)"))
                    } else {
                        KitBox(on: false, size: 26, pal: d.pal, mat: d.mat)
                    }
                    Caps(text: entry.day.left == 1 ? "Last one" : "\(entry.day.left) left", d: d, size: 9.5)
                        .contentTransition(.numericText(value: Double(entry.day.left)))
                }
            } else {
                FinaleBlock(d: d, date: entry.date, size: 19, stamp: 8.5, compact: true)
                Spacer(minLength: 0)
            }
        }
        .containerBackground(for: .widget) { KitGround(pal: d.pal) }
        .widgetURL(entry.listURL)
    }
}

// ---------------------------------------------------------------- Today

struct TodayView: View {
    let entry: DayEntry
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetRenderingMode) private var mode
    var place = Place()
    private var background: Bool { place.background }
    private var family: WidgetFamily { place.family }

    private var large: Bool { family == .systemLarge }

    var body: some View {
        let d = entry.dressed(scheme, mode, background: background, family: family)
        VStack(alignment: .leading, spacing: large ? 10 : 6) {
            header(d)
            if let (title, detail) = entry.notice(compact: !large) {
                Spacer(minLength: 0)
                Notice(title: title, detail: detail, d: d, size: large ? 22 : 18)
                Spacer(minLength: 0)
            } else if entry.day.finished && !large {
                Spacer(minLength: 0)
                FinaleBlock(d: d, date: entry.date, size: 22, stamp: 9)
                Spacer(minLength: 0)
            } else {
                rows(d)
                Spacer(minLength: 0)
                if large { footer(d) }
            }
        }
        .containerBackground(for: .widget) { KitGround(pal: d.pal) }
        .widgetURL(entry.listURL)
    }

    private func header(_ d: Dressed) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Caps(text: entry.day.name.isEmpty ? "Today" : entry.day.name, d: d, size: 10)
            if entry.day.viewOnly { Caps(text: "View only", d: d, size: 8.5, color: d.pal.muted) }
            Spacer(minLength: 6)
            if large {
                Caps(text: entry.date.formatted(.dateTime.weekday(.abbreviated).month(.abbreviated).day()), d: d, size: 9.5)
            } else if entry.day.total > 0 && !entry.day.gone {
                CountText(done: entry.day.done, total: entry.day.total, d: d, size: 11)
            }
            if entry.state == .list && !entry.day.viewOnly && !entry.day.gone {
                Link(destination: URL(string: "todaysfive://add")!) {
                    Image(systemName: "plus")
                        .font(.system(size: large ? 13 : 12, weight: .bold))
                        .foregroundStyle(d.pal.accentText)
                        .frame(width: 22, height: 18, alignment: .trailing)
                        .contentShape(Rectangle())
                }
                .widgetAccentable()
                .accessibilityLabel(Text("Add a line"))
            }
        }
    }

    @ViewBuilder private func rows(_ d: Dressed) -> some View {
        let lines = entry.day.lines
        let size: CGFloat = large ? (lines.count <= 5 ? 20 : 17) : 15
        let room = large ? 7 : 4
        let shown = lines.count > room ? Array(lines.prefix(room - 1)) : lines
        let notes = large && lines.count <= 5
        VStack(alignment: .leading, spacing: large ? (lines.count <= 5 ? 12 : 8) : 5) {
            ForEach(shown) { line in
                VStack(alignment: .leading, spacing: 2) {
                    row(line, d, size: size)
                    if notes && !line.note.isEmpty && !line.done {
                        Text(line.note).font(d.kit.ui(12)).foregroundStyle(d.pal.muted).lineLimit(1)
                            .padding(.leading, size * 0.92 + size * 0.62)
                    }
                }
                .transition(.push(from: .bottom).combined(with: .opacity))
            }
            if lines.count > shown.count {
                Caps(text: Self.rest(Array(lines.dropFirst(shown.count))), d: d, size: 9)
                    .padding(.leading, size * 0.92 + size * 0.62)
            }
        }
    }

    /// What the rows that did not fit are: "+2 more", "+2 done", "+1 more · 1 done".
    static func rest(_ hidden: [WidgetLine]) -> String {
        let done = hidden.filter(\.done).count, more = hidden.count - done
        switch (more, done) {
        case (0, _): return "+\(done) done"
        case (_, 0): return "+\(more) more"
        default: return "+\(more) more · \(done) done"
        }
    }

    @ViewBuilder private func row(_ line: WidgetLine, _ d: Dressed, size: CGFloat) -> some View {
        let label = StruckText(text: line.text, done: line.done, size: size, pal: d.pal, kit: d.kit)
        if entry.interactive {
            Toggle(isOn: line.done, intent: CheckLineIntent(list: entry.day.key, line: line.id, done: !line.done)) { label }
                .toggleStyle(KitCheckStyle(size: size * 0.92, pal: d.pal, mat: d.mat))
        } else {
            HStack(spacing: size * 0.92 * 0.62) {
                KitBox(on: line.done, size: size * 0.92, pal: d.pal, mat: d.mat)
                label
            }
        }
    }

    @ViewBuilder private func footer(_ d: Dressed) -> some View {
        if entry.day.finished {
            FinaleBlock(d: d, date: entry.date, size: 21, stamp: 9.5)
        } else {
            HStack(spacing: 10) {
                Bar(fraction: entry.day.total > 0 ? Double(entry.day.done) / Double(entry.day.total) : 0, pal: d.pal)
                CountText(done: entry.day.done, total: entry.day.total, d: d, size: 11)
            }
        }
    }
}

/// The page's bar (#fill): a hairline track and the kit's sweep over it.
struct Bar: View {
    let fraction: Double
    let pal: Palette
    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .leading) {
                Capsule().fill(pal.hair)
                Capsule().fill(pal.mono ? AnyShapeStyle(Color.white) : AnyShapeStyle(pal.sweep))
                    .frame(width: max(fraction > 0 ? 4 : 0, g.size.width * fraction))
                    .widgetAccentable()
            }
        }
        .frame(height: 4)
        .accessibilityHidden(true)
    }
}

// ---------------------------------------------------------------- Progress

struct ProgressSmallView: View {
    let entry: DayEntry
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetRenderingMode) private var mode
    var place = Place()
    private var background: Bool { place.background }
    private var family: WidgetFamily { place.family }

    var body: some View {
        let d = entry.dressed(scheme, mode, background: background, family: family)
        let day = entry.day
        ZStack {
            ProgressRing(done: day.done, total: day.total, width: 11, pal: d.pal)
                .padding(5)
            VStack(spacing: 2) {
                if entry.state == .noList || entry.state == .unread || day.gone || day.total == 0 {
                    Image(systemName: "checklist").font(.system(size: 26, weight: .semibold)).foregroundStyle(d.pal.muted)
                    Caps(text: entry.state == .noList ? "No list" : day.gone ? "Gone" : "Nothing yet", d: d, size: 8.5)
                } else if day.finished {
                    Tick().stroke(d.pal.accentText, style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round))
                        .frame(width: 34, height: 26)
                        .widgetAccentable()
                    Caps(text: "Sealed", d: d, size: 8.5, color: d.pal.accentText)
                } else {
                    Text("\(day.left)")
                        .font(d.kit.task(44, .largeTitle))
                        .foregroundStyle(d.pal.text)
                        .contentTransition(.numericText(value: Double(day.left)))
                        .minimumScaleFactor(0.6)
                    Caps(text: day.left == 1 ? "line left" : "lines left", d: d, size: 8.5)
                }
            }
            .padding(.horizontal, 24)
        }
        .containerBackground(for: .widget) { KitGround(pal: d.pal) }
        .widgetURL(entry.listURL)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(day.finished ? "Today's sealed" : "\(day.left) of \(day.total) left on Today"))
    }
}

// ---------------------------------------------------------------- the Lock Screen

struct LockCircularView: View {
    let entry: DayEntry
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetRenderingMode) private var mode
    var place = Place()

    var body: some View {
        let d = entry.dressed(scheme, mode, background: false, family: place.family)
        let day = entry.day
        Group {
            if entry.state == .noList || entry.state == .unread || day.gone || day.total == 0 {
                ZStack { AccessoryWidgetBackground(); Image(systemName: "checklist").font(.system(size: 20, weight: .semibold)) }
            } else if day.finished {
                ZStack {
                    AccessoryWidgetBackground()
                    Image(systemName: "checkmark.seal.fill").font(.system(size: 26, weight: .semibold)).widgetAccentable()
                }
            } else {
                // an open ring, so the gap can say what the number is: what is left, not what is done
                Gauge(value: Double(day.done), in: 0...Double(max(1, day.total))) {
                    Text("LEFT").font(.system(size: 8, weight: .bold)).tracking(0.6)
                } currentValueLabel: {
                    Text("\(day.left)").font(d.kit.ui(20, bold: true)).monospacedDigit()
                }
                .gaugeStyle(.accessoryCircular)
                .widgetAccentable()
            }
        }
        .widgetURL(entry.listURL)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(day.finished ? "Today's sealed" : "\(day.left) left on Today"))
    }
}

struct LockRectangularView: View {
    let entry: DayEntry
    @Environment(\.colorScheme) private var scheme
    @Environment(\.widgetRenderingMode) private var mode
    @Environment(\.redactionReasons) private var redaction
    var place = Place()

    var body: some View {
        let d = entry.dressed(scheme, mode, background: false, family: place.family)
        let day = entry.day
        HStack(alignment: .center, spacing: 7) {
            // the box, beside a line the person can see: on a locked phone that does not know them yet the line is
            // hidden, and a box for a hidden line is nothing to tap
            if entry.interactive, let next = day.next, !redaction.contains(.privacy) {
                Toggle(isOn: false, intent: CheckLineIntent(list: day.key, line: next.id, done: true)) { EmptyView() }
                    .toggleStyle(KitCheckStyle(size: 17, pal: d.pal, mat: d.mat))
                    .accessibilityLabel(Text("Cross off \(next.text)"))
            }
            lines(d, day)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .widgetURL(entry.listURL)
    }

    @ViewBuilder private func lines(_ d: Dressed, _ day: WidgetDay) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            HStack(spacing: 4) {
                Image(systemName: day.finished ? "checkmark.seal.fill" : "checklist").widgetAccentable()
                Text(head(day)).lineLimit(1)
            }
            .font(.system(size: 11, weight: .semibold))
            .textCase(.uppercase)
            .foregroundStyle(.secondary)
            if let (title, _) = entry.notice(compact: true) {
                Text(title).font(d.kit.task(14, .headline)).lineLimit(2)
            } else if let next = day.next {
                if redaction.contains(.privacy) {
                    // locked, and the phone does not yet know whose it is: the count, never the words
                    Text(day.left == 1 ? "One line left on Today" : "\(day.left) lines left on Today").font(.system(size: 14, weight: .semibold)).lineLimit(2)
                } else {
                    Text(next.text).font(d.kit.task(15, .headline)).lineLimit(2).minimumScaleFactor(0.8).privacySensitive()
                }
            } else {
                Text(d.finale).font(d.kit.task(15, .headline)).lineLimit(1)
                Text(SealStamp.words(entry.date, mat: d.mat)).font(.system(size: 11, weight: .semibold)).foregroundStyle(.secondary).lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func head(_ day: WidgetDay) -> String {
        if day.finished { return "Sealed" }
        if day.total == 0 || day.gone || entry.state != .list && entry.state != .sample { return "Today's Five" }
        return "Next up · \(day.left) left"
    }
}

struct LockInlineView: View {
    let entry: DayEntry
    @Environment(\.redactionReasons) private var redaction

    var body: some View {
        let day = entry.day
        let text: String = {
            if entry.state == .noList || day.gone || day.total == 0 { return "Today's Five" }
            if day.finished { return "Today's sealed" }
            if let next = day.next, !redaction.contains(.privacy) { return "\(day.left) left · \(next.text)" }
            return day.left == 1 ? "1 line left today" : "\(day.left) lines left today"
        }()
        Label { Text(text) } icon: { Image(systemName: day.finished ? "checkmark.seal" : "checklist") }
            .privacySensitive(day.next != nil && !day.finished)
            .widgetURL(entry.listURL)
    }
}

// ---------------------------------------------------------------- by family

struct NextUpFamilies: View {
    let entry: DayEntry
    var place = Place()
    var body: some View {
        switch place.family {
        case .accessoryRectangular: LockRectangularView(entry: entry)
        default: NextUpView(entry: entry)
        }
    }
}

struct ProgressFamilies: View {
    let entry: DayEntry
    var place = Place()
    var body: some View {
        switch place.family {
        case .accessoryCircular: LockCircularView(entry: entry)
        case .accessoryInline: LockInlineView(entry: entry)
        default: ProgressSmallView(entry: entry)
        }
    }
}
