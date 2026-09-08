# Phase 4, Track D — the poll papercut

## A narrow `DoorbellTransport`, because the protocol already there would have lied

`RealtimeTransport` has been declared in `Transport.swift` since Phase 1 with zero conformers, and
conforming `SupabaseTransport` to it would have been the tidier-looking move. It promises `subscribe`,
and nothing on the Apple side intends to write one: the Watch, `tfive` and the App Intent are the
*writing* half of realtime and never the listening half. A conformer whose `subscribe` returned a
stub would have type-checked, read as complete to anybody grepping for conformances, and been false.

So `DoorbellTransport` is one method wide — `func ring(_ id: String, _ payload: JSONObject) async` —
and `RealtimeTransport` keeps its no-conformer comment, now saying so out loud. The cost is a second
protocol in a file that already had one, which is the smaller ugliness.

`ring` cannot throw. The write already reached the server; a bell that did not ring costs somebody
else's screen a poll interval and takes nothing away from what was stored, so a caller has nothing to
decide and `push()` has no new failure to map.

**How to apply:** when an existing protocol covers half of what you need, ask whether you will really
implement the other half. A protocol whose conformer stubs a method is worse than a new protocol
narrow enough to be true, because the stub is invisible at every call site.

## The ring is awaited, where `sync.js`'s is deliberately not

`sync.js:331` is `try { me.channel.send(...) } catch {}` — fire and forget, which is right for a page
that stays alive. The Swift callers are not pages. `tfive add` is a process that writes once and
returns, and an App Intent is a process iOS may suspend the moment it answers; an unawaited task in
either is a request that dies before the socket is written.

So `ringDoorbell()` is awaited inside `push()`. It costs one round trip on a write and nothing at all
at idle. It also means a slow broadcast endpoint slows a write — accepted, because the alternative is
a fix that works on the web's lifetime model and silently does not work on any of the three clients
it was written for.

**How to apply:** fire-and-forget is a property of the *host*, not of the call. The same line is
correct in a long-lived page and a no-op in a CLI.

## The fix went into the writer, and `POLL_LIVE_MS` did not move

The measurement said the phone was slow, and the cheap reading of that is "poll more often". Rejected,
on three numbers:

* shortening `POLL_LIVE_MS` costs 4× the polls at idle **forever, on every device**, including every
  web device that has no Watch and no Mac and will never receive a Swift write;
* it does nothing for a backgrounded page. Measured 20/20 "never" in 600 s of virtual time at *either*
  interval, because `schedulePoll`'s `visible()` gate is upstream of the timer — no interval reaches
  a hidden page. What rescues one is the `visibilitychange` or `focus` that comes with looking at it
  (`wake()` → `subscribe()` → `pull()`), so a person sees a fresh list when they look and never
  before, which is the design and not a bug;
* the writer's fix costs **zero requests at idle** and one 138-byte body per successful write.

A database-side broadcast — a trigger, or a `put_list_v4` beside the frozen RPC — is parked. It would
mean turning on a realtime feature the project does not configure at all, on a schema whose entire
security story is that the table is unreachable except through three `SECURITY DEFINER` functions.

**How to apply:** when a latency number points at a poller, check whether it is really pointing at the
writer. Making the reader work harder taxes every device; making the writer speak taxes the one that
had something to say.

## The 29-byte poll could not have moved, and here is why that is checkable

`realsync4.js` and `apple/tools/interop.mjs` both weigh the unchanged poll and both assert it stays
under 60 bytes; the number this project has defended across three phases is 29. A doorbell is a POST
to `/realtime/v1/api/broadcast`; a poll is a POST to `/rest/v1/rpc/get_list_v3` with `p_rev`, answered
by the migration's `jsonb_build_object`. Different service, different function, and `rawGet` — the
method both suites weigh — is untouched. The doc comment on `rawGet` now says so, so the next person
reading the two together does not have to re-derive it.

The doorbell body has its own pinned number instead: 137 bytes at a one-digit revision, 138 at two,
asserted in `SyncTests` against the exact string `JSON.stringify` produces for the object
`sync.js:121` builds. `SupabaseTransport.doorbellBody` exists as a separate `static` for exactly that
reason — a cost you can weigh without a network is a cost that stays weighed.

## The status code is written down, because the web's never was

`sync.js`'s REST fallback ends in `.catch(() => {})`. Nothing in the repo has ever exercised it, and
because the answer was thrown away, nobody could have said whether that endpoint had ever replied to
this project in its life. It does: **HTTP 202**, with `{ apikey, Content-Type }` and no
`Authorization: Bearer`, and 202 with the bearer header too.

The Swift version logs the status behind `#if DEBUG`. What it logs is the status and the body length
and nothing else — not the id, which is a channel name derived from a link — and a failure logs the
`URLError` code rather than the error object, because an error object printed whole carries its
failing URL.

**How to apply:** `.catch(() => {})` on a request is not error handling, it is deleting the only
evidence that the request exists. One line that records the answer is the difference between a
mechanism and a hope.

## The median was not the finding

The checkpoint recorded medians of 54 s (realtime connected) and 32 s (not connected). Three runs of
`tools/polld.js` on this machine gave 132 s and 16 s, and 144 s and 12 s on a second seed. None of the
three is wrong and none of them is the result: ten draws from a uniform distribution have a sampling
error of tens of seconds, and the median is the statistic most exposed to it.

What reproduces exactly, every time, is the shape. The latency of a write nobody rang the bell for is
uniform on (0, the poll period], so it is bounded by the period, averages half of it, and the ratio
between the two foreground conditions is `POLL_LIVE_MS / POLL_MS` — arithmetic, not a sample. The
maxima land where they must: 238 s against a 240 s period, 60 s against 60. "A phone whose realtime
is working is four times slower to see a wrist tap than one whose realtime is dead" survives all
three runs; "54 seconds" survives none of them.

**How to apply:** report the distribution and the mechanism that produces it. A median quoted from ten
samples of a wide distribution is a number the next run will take away from you.

## A harness that reported nothing, and looked like it had reported something

Between the before run and the after run the static server died. `polld.js` answered with a clean
table — "never, 0/0" in every condition, zero page errors, exit 0 — which is very nearly what the bug
being measured looks like when the harness *works*. Every trial had thrown `ERR_CONNECTION_REFUSED`.

This is Phase 3's `-TFAddSelfTest` lesson arriving from a new direction: the failure mode of a check
that does not run is silence, and silence looks like a pass. The fix is to make the two states print
differently and never alike — a thrown trial is counted and marked `x`, a condition with no measured
trials prints `NOT MEASURED` rather than `never, 0/0`, and the run exits 1 naming the likely cause.

**How to apply:** any harness that can report "nothing happened" as a *result* must be unable to report
"nothing ran" the same way. If the two render alike, the harness will one day tell you the answer you
were hoping for and be describing its own absence.

## What the local transport proves, and what it cannot

`tools/polld.js` runs against `?transport=local` with `page.clock.install`, so it models the app's
timer arithmetic **exactly** — `POLL_MS`, `POLL_LIVE_MS`, `setLive`, the `visible()` gate, the phase of
a sawtooth — and the network **not at all**. There are no round trips in it, no radio wake, no
`WKWebView` suspend and resume.

So the "after" it can show is not a network measurement. It is the `doorbell` condition: a writer that
rings `list:<lookupId>` the way `sync.js:331` does, and a subscribed page that pulls on it — 0.1 s in
all ten trials, which is the harness's finest slice and contains the local transport's simulated 15 ms
lag. It proves the arrival path (a broadcast reaching a live page turns into a pull immediately) and
says nothing about what a real socket costs to carry it. `apple/tools/interop.mjs` step 5b is where
that is asserted against the real backend, and whether the win survives a real suspend/resume cycle is
on the plan's list of things only a wrist can answer.

The write in the harness is done the way `SupabaseTransport.put` does it — import the app's own
`crypto.js`, decrypt the `tf/v2/localserver/<lookupId>` row, add a line, re-seal, write it back at
`rev + 1`. A `BroadcastChannel.postMessage` would have been three lines and would have simulated away
the exact bug.

**How to apply:** a harness for a missing notification must not be allowed to send the notification.
Write the state the way the real writer writes it, and let the reader find out however it finds out.

## What was left alone

* **`announceGone` has no Swift mirror.** `sync.js` broadcasts `{ rev: 0, from, gone: true }` after a
  rotate, and nothing on the Apple side rotates a link. `removeRemote()` could ring the same bell and
  does not; other devices find out on their next poll, exactly as they did before this round. Adding
  it later is one call in one place and no contract change.
* **`MemoryTransport` is untouched and does not conform**, so every test in the package is still
  offline with no flag to set and no stub to remember. The three behavioural tests use a
  `DoorbellRecorder` that wraps it. Deliberate: the moment the shared test double can broadcast, a
  test can reach the network by forgetting something.
* **`SyncEngine` still has no timer.** The caller drives, which is what a CLI, a background refresh
  and a widget all want, and `pollDelay(live:)` still only *says* what the web would wait.
