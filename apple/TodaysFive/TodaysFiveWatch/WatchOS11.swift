// WatchOS11.swift — the watchOS 11 API this app uses, each behind the one availability check.
//
// The Watch app's floor is **watchOS 10**, because a Series 4, 5 or SE cannot run 11 and a watch that
// cannot run the floor is never offered the app at all: it simply does not appear under *Available
// Apps* in the phone's Watch app, with no error anywhere to say why. Build 258 shipped with the floor
// at 11 and that is exactly what a tester with an older Watch saw.
//
// Three modifiers is the whole of what the lower floor costs, and the compiler named all three.
// They answer one question — *is this watchOS 11* — so they answer it in one place; a fourth site
// asking it separately is how the answers start to differ.
//
// **Double Tap costs nothing anyone can feel.** `handGestureShortcut(_:isEnabled:)` and
// `scrollInputBehavior(_:for:)` both configure Double Tap, and Double Tap is a property of the
// *hardware* — Series 9 and Ultra 2 and later — every one of which shipped with watchOS 11 or newer
// and cannot be running 10. On the wrists where these return the view unchanged there was never a
// gesture to route.
//
// **`ScrollPosition` costs one thing, and it is small.** On watchOS 10 a `todaysfive://add` arriving
// from the complication does not scroll Today back to its top, so on a resumed app the add control
// may be a crown-turn away rather than under the count. The gesture the person then makes is the one
// they were already making before the complication existed, and nothing is wrong on screen — which is
// why this is guarded rather than backfilled with a `ScrollViewReader`. Note that whether it moves a
// carousel `List` at all is *already* on this project's unverified list: `simctl` cannot scroll a
// watch simulator, so no build has ever confirmed the watchOS 11 path either.

import SwiftUI

extension View {
    /// Routes **Double Tap** to this view as the app's primary action, on the systems that have the
    /// gesture. On watchOS 10 the view is returned unchanged — see the note above for why that is
    /// not a loss.
    @ViewBuilder
    func doubleTapPrimaryAction(isEnabled: Bool) -> some View {
        if #available(watchOS 11, *) {
            self.handGestureShortcut(.primaryAction, isEnabled: isEnabled)
        } else {
            self
        }
    }

    /// Stops **Double Tap** scrolling the views within this one, so the gesture reaches the primary
    /// action instead. On watchOS 10 the view is returned unchanged.
    @ViewBuilder
    func doubleTapScrollDisabled() -> some View {
        if #available(watchOS 11, *) {
            self.scrollInputBehavior(.disabled, for: .handGestureShortcut)
        } else {
            self
        }
    }

    /// Scrolls this list to its top edge every time `tick` changes — the Add complication's arrival,
    /// and nothing else. A person's own crown is never overridden either way. On watchOS 10 the list
    /// is left where it was.
    ///
    /// The `ScrollPosition` has to live inside a modifier the compiler can mark unavailable, because
    /// a stored property cannot sit behind an `if`.
    @ViewBuilder
    func scrollToTop(on tick: Int) -> some View {
        if #available(watchOS 11, *) {
            modifier(ScrollToTopOnTick(tick: tick))
        } else {
            self
        }
    }
}

@available(watchOS 11, *)
private struct ScrollToTopOnTick: ViewModifier {
    let tick: Int
    @State private var scroll = ScrollPosition()

    func body(content: Content) -> some View {
        content
            .scrollPosition($scroll)
            .onChange(of: tick) { _, _ in
                scroll.scrollTo(edge: .top)
            }
    }
}
