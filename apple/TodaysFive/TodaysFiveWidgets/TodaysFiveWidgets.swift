// TodaysFiveWidgets.swift — the widgets and controls, and where each one is offered.
//
// Three widgets, each named for what it is for, so the gallery reads as a choice rather than a list of sizes:
//
//   Next up    Home Screen and StandBy (small), Lock Screen (rectangular): one line, and its box.
//   Today      Home Screen (medium, large): the day's lines, each a box to tap.
//   Progress   Home Screen and StandBy (small), Lock Screen (circular, inline): how much is left.
//
// And, from iOS 18, two controls — for Control Center, the Lock Screen's buttons and the Action button:
//
//   Add a line   opens the app with the composer up and the keyboard out.
//   Today        says how much is left, and opens the list.
import SwiftUI
import WidgetKit

@main
struct TodaysFiveWidgets: WidgetBundle {
    var body: some Widget {
        NextUpWidget()
        TodayWidget()
        ProgressWidget()
        if #available(iOS 18.0, *) {
            AddLineControl()
            TodayControl()
        }
    }
}

struct NextUpWidget: Widget {
    static let kind = "TodaysFiveNext"
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: Self.kind, intent: ListConfiguration.self, provider: DayProvider()) { entry in
            NextUpFamilies(entry: entry)
        }
        .configurationDisplayName("Next up")
        .description("The next line on Today, and a box to cross it off.")
        .supportedFamilies([.systemSmall, .accessoryRectangular])
    }
}

struct TodayWidget: Widget {
    static let kind = "TodaysFiveToday"
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: Self.kind, intent: ListConfiguration.self, provider: DayProvider()) { entry in
            TodayView(entry: entry)
        }
        .configurationDisplayName("Today")
        .description("Today's lines. Tap a box to cross one off.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

struct ProgressWidget: Widget {
    static let kind = "TodaysFiveProgress"
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: Self.kind, intent: ListConfiguration.self, provider: DayProvider()) { entry in
            ProgressFamilies(entry: entry)
        }
        .configurationDisplayName("Progress")
        .description("How much of today is left.")
        .supportedFamilies([.systemSmall, .accessoryCircular, .accessoryInline])
    }
}

// ---------------------------------------------------------------- controls (iOS 18)

@available(iOS 18.0, *)
struct AddLineControl: ControlWidget {
    static let kind = "TodaysFiveAddLine"
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: OpenComposerIntent()) {
                Label("Add a line", systemImage: "plus")
            }
        }
        .displayName("Add a line")
        .description("Opens Today's Five ready to type a new line onto Today.")
    }
}

@available(iOS 18.0, *)
struct TodayControl: ControlWidget {
    static let kind = "TodaysFiveTodayControl"
    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind, provider: TodayCount()) { count in
            ControlWidgetButton(action: OpenTodayIntent()) {
                Label {
                    Text("Today")
                    Text(count.label)
                } icon: {
                    Image(systemName: count.sealed ? "checkmark.seal.fill" : "checklist")
                }
            }
        }
        .displayName("Today")
        .description("How much of today is left, with the list a tap away.")
    }
}

/// The Today control's value: what is left on the list open in the app, from the shelf. No network: a control is
/// asked for its value whenever Control Center opens, and the shelf is as fresh as the last change.
@available(iOS 18.0, *)
struct TodayCount: ControlValueProvider {
    struct Value: Sendable, Equatable {
        var left: Int
        var total: Int
        var sealed: Bool { total > 0 && left == 0 }
        var label: String {
            if total == 0 { return "Nothing yet" }
            if sealed { return "Sealed" }
            return left == 1 ? "1 left" : "\(left) left"
        }
    }

    var previewValue: Value { Value(left: 2, total: 5) }

    func currentValue() async throws -> Value {
        guard let key = WidgetFeed.live().defaultKey(), let day = WidgetDay.read(key: key) else { return Value(left: 0, total: 0) }
        let shown = day.rollsAt > 0 && day.rollsAt <= Date().timeIntervalSince1970 * 1000 ? day.afterRollover : day
        return Value(left: shown.left, total: shown.total)
    }
}
