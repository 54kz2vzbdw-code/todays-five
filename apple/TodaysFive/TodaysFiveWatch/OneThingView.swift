// OneThingView.swift — the second page: one line, huge, and shuffle.
//
// The shown line is `undone.first(where: { $0.id == shuffled }) ?? undone.first`, computed at render
// time, which is `renderToday`'s own expression. The footer is the web's words. **Nothing on this
// page writes to the document except the check-off** — shuffle is pure view state and always has
// been, which is why a shuffle on the Watch and a shuffle on a laptop cannot disagree about a list.
import SwiftUI
import TodaysFiveCore

struct OneThingView: View {
    @Environment(WatchStore.self) private var store
    @Environment(\.watchTheme) private var theme

    /// The wobble: 0 or 1 undone line means a shuffle changes nothing, and the web answers that with
    /// a small movement rather than with silence.
    @State private var nudge: CGFloat = 0

    var body: some View {
        VStack(spacing: 8) {
            if let line = store.oneThingLine {
                Text(line.text)
                    // The other place the kit's task face belongs: this is one list line, large.
                    .taskType(theme, 20, .title2)
                    .foregroundStyle(theme.text)
                    .multilineTextAlignment(.center)
                    .lineLimit(5)
                    .minimumScaleFactor(0.55)
                    .frame(maxWidth: .infinity)
                    .offset(x: nudge)

                Text(store.oneThingFooter)
                    .font(theme.ui(13, .footnote))
                    .foregroundStyle(theme.muted)

                HStack(spacing: 18) {
                    Button {
                        store.setDone(line.id, true)
                    } label: {
                        Image(systemName: "checkmark")
                            .font(.system(size: 17, weight: .semibold))
                            .frame(width: 44, height: 34)
                            // A prominent button picks its own label colour, and it picks white.
                            // On Terminal's `#4AF07A` and Sunset's amber that is unreadable, so the
                            // glyph takes whichever of the kit's own two extremes measures better
                            // against its accent.
                            .foregroundStyle(theme.onAccent)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(theme.accent)

                    Button {
                        store.shuffle()
                    } label: {
                        Image(systemName: "shuffle")
                            .font(.system(size: 15, weight: .semibold))
                            .frame(width: 44, height: 34)
                            .foregroundStyle(theme.text)
                    }
                    .buttonStyle(.bordered)
                    .tint(theme.ink3)
                }
                .disabled(!store.canEdit)
            } else {
                Text(store.totalCount == 0 ? "Nothing on Today" : "That's the list.")
                    .font(theme.ui(16, .headline, bold: true))
                    .italic(store.totalCount > 0 && theme.kit.finaleItalic)
                    .foregroundStyle(store.totalCount == 0 ? theme.muted : theme.accent)
            }
        }
        .padding(.horizontal, 6)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.ink)
        .contentShape(Rectangle())
        // The firm swipe. Horizontal only, and deliberately so: the vertical pager owns the other
        // axis, and a gesture that fought it would cost the page rather than buy the shuffle.
        .gesture(
            DragGesture(minimumDistance: 32)
                .onEnded { value in
                    guard abs(value.translation.width) > abs(value.translation.height) else { return }
                    store.shuffle()
                }
        )
        // `shuffled` is not observed — it is cleared lazily inside the read, the way `renderToday`
        // clears it — so this is the dependency that tells SwiftUI a shuffle gesture happened. Read
        // it here or the page will not move.
        .animation(.easeOut(duration: 0.16), value: store.shuffleTick)
        .onChange(of: store.wobbleTick) { _, _ in
            withAnimation(.easeOut(duration: 0.08)) { nudge = 9 }
            withAnimation(.easeOut(duration: 0.12).delay(0.08)) { nudge = 0 }
        }
    }
}
