// ComplicationsIntent.swift — the opt-in that keeps words off the face.
//
// The rectangular complication can show the next unfinished line, and a watch face is read by
// whoever is standing next to you. So it is **off by default** and turned on by the person adding it,
// in the face editor, before the complication has ever drawn: that is what an `AppIntentConfiguration`
// (watchOS 10) with a `WidgetConfigurationIntent` is for, and the Bool below is the whole of it.
//
// Off, the complication shows the count and the list's name — useful, and nobody's words.
//
// `WidgetConfigurationIntent` supplies its own `perform()`, so there is nothing to run here: the
// intent is a form, not an action.
import AppIntents

struct NextLineConfiguration: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Today's Five"
    static let description = IntentDescription(
        "Choose whether this complication shows the next unfinished line, or just the count."
    )

    @Parameter(title: "Show the line", description: "Off shows the count and the list's name.",
               default: false)
    var showLine: Bool

    init() {}

    init(showLine: Bool) {
        self.showLine = showLine
    }
}
