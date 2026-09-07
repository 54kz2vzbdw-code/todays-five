# Today's Five for Apple — Phase 2: the iPhone shell

The plan, and at the end the results. This phase puts the live web UI on an iPhone with three things
it cannot have on its own: **haptics**, **a durable home for the link**, and **links that open in the
app**. Nothing else. Read `COMPATIBILITY.md` and `apple/PLAN-apple.md` first.

Phase 1 is on `main`: `apple/TodaysFiveCore`, 72 tests, interop proven against the live backend. This
phase adds an app target beside it and one small, dormant web change.

---

## Checkpoint report: the toolchain and the team

| | |
| --- | --- |
| Xcode | **26.6** (17F113), `/Applications/Xcode.app/Contents/Developer`, licence accepted |
| Swift | 6.3.3 |
| Simulators | iOS **18.1** (iPhone 16 Pro et al.) and **26.5** (iPhone 17 Pro et al.) — both present, both booted |
| Node | **not on `PATH`**. The copy at `~/.cache/codex-runtimes/…/node/bin/node` is v24.19.0 and is what the web suites run under. Worth installing properly at some point; nothing here is blocked by it. |
| git | clean on `main`, 1.9 build 119, 128 commits |
| `brew` | **not installed** — so no XcodeGen. The `.xcodeproj` is written by hand and committed; there is no `project.yml`. |
| `gh` | **not installed** — so the user-site repo for §5 cannot be created from here. |
| Lighthouse | **12.8.2**, the same copy 1.9 used, still in an earlier session's scratchpad — no download, no `npm`. The harness (`run.sh`) is 1.1's, unchanged, so the numbers compare to every round back to v4. |

### The signing team: there isn't one

Not a paid team, not a Personal Team — **no Apple ID is signed into Xcode at all**.

```
security find-identity -v -p codesigning     0 valid identities found
defaults read com.apple.dt.Xcode IDEProvisioningTeamByIdentifier      { }
defaults read com.apple.dt.Xcode DVTDeveloperAccountManagerAppleIDLists   { "IDE.Identifiers.Prod" = ( ); }
~/Library/Developer/Xcode/UserData/Provisioning Profiles/   does not exist
```

There is one leftover certificate in the login keychain, and it is worth reading because it says what
the account used to be:

```
Apple Development: pricebrannen@gmail.com (YAC4Y2Y5M8)
O = Price Brannen      OU (Team ID) = T7GTZC5US9
valid 2024-11-28 → 2025-11-28        expired, and its private key is gone
```

So there was a team, `T7GTZC5US9`. Whether it was paid or a Personal Team cannot be told from the
certificate — both issue exactly this kind. **What that means for this phase:**

- **Everything on the simulator works with no team and no signing.** The whole of §1–§4 and both
  simulator verification passes need nothing from you.
- **Installing on your iPhone needs an Apple ID in Xcode** — a free one is enough (Xcode → Settings →
  Accounts → +). That is checkpoint 3.
- **§5 universal links needs the paid program** (Associated Domains is not available to a Personal
  Team) *and* the Team ID from developer.apple.com → Membership details. Steps below.

---

## What the app is

One iOS app target, `com.pricebrannen.todaysfive`, "Today's Five", one `WKWebView` on the persistent
default data store showing `https://54kz2vzbdw-code.github.io/todays-five/`. **The live site, not a
copy.** The web ships weekly; a bundled copy would need an app build per round and would be an old
client most of the time. `COMPATIBILITY.md` guarantees old clients keep working, but the point of
this app is haptics on the *current* UI.

Nothing in the app has a settings screen, a menu, a tab bar or a chrome of its own. The rail, Today,
⋯ and Settings gain nothing (§7).

**Reading the code turned up no blocker to the live design.** Two things came close and are written
up below rather than worked around silently: the page's existing haptic (§3) and the page's
`STANDALONE` branches (§3a). Both are questions for you, not decisions I have taken.

### The bundling fallback, if App Review ever demands it

Guideline 4.2 (Minimum Functionality) is the risk with any web-view app. The argument here is that
the app adds what the web cannot do: system haptics, a Keychain vault that outlives the browser's
storage, and universal links. If Review disagrees, bundling is: copy the shell files
(`sw.js`'s `SHELL` list, 28 files) into the app bundle, serve them from a local
`WKURLSchemeHandler` or `loadFileURL`, and keep the Supabase calls going to the network. The cost is
an app build per web round and a version-skew story `COMPATIBILITY.md` §6 does not currently cover
(the service worker would have nothing to do). It is a real fallback, not a good one.

---

## 1. The shell

- `WKWebViewConfiguration.websiteDataStore = .default()` — persistent, so localStorage, the service
  worker and its caches survive relaunch.
- `Info.plist` `WKAppBoundDomains = ["54kz2vzbdw-code.github.io"]`, and
  `configuration.limitsNavigationsToAppBoundDomains = true`.

  This is the single most load-bearing line in the app. **Service workers do not run in a
  `WKWebView` unless the domain is app-bound**, and the offline story is the service worker.
  Declaring the key also means a web view *without* the flag loses script injection entirely — so
  the flag is not optional, it is what buys back `WKUserScript` and `evaluateJavaScript` for this
  domain. Both are needed (§2, §3).
- **To verify on 18.1 and 26.5, not assume:** that `navigator.serviceWorker.controller` is non-null
  after a second load, and that airplane-mode relaunch paints the list. If the worker does not
  register, the offline story is the page's own localStorage copy — the list still opens and syncs
  when the network returns — and the results section will say so plainly rather than claim offline.
- Navigation policy: `decidePolicyFor navigationAction` allows only
  `54kz2vzbdw-code.github.io`; everything else (About's GitHub link) goes to
  `UIApplication.open` → Safari. `target="_blank"` is handled by
  `createWebViewWith` returning nil after opening in Safari.
- `allowsBackForwardNavigationGestures = false` — the page has its own Back stack and Escape.
- No zoom: the page's viewport already sets `initial-scale=1`; the app does not add a scroll view
  zoom of its own.
- Safe areas are the page's: `viewport-fit=cover` is already in the markup, so the web view is edge
  to edge and `contentInsetAdjustmentBehavior = .never`.
- Launch screen: a solid `#1A1D21` (the site's current `theme-color`) with the icon mark, in a
  storyboard-free `UILaunchScreen` dictionary.
- Icon: the site's own mark. `icons/` tops out at 512, and iOS wants a **1024, opaque, full-bleed,
  square** (the system rounds it). The mark is a rounded tile plus a two-segment check, so a small
  committed script under `apple/TodaysFive/tools/` regenerates it at 1024 with
  `icons/apple-touch-icon.png`'s proportions. **No new artwork**, and nothing in `icons/` changes.
- Web Share: `navigator.share` in `WKWebView` needs no bridge but does need a real user gesture.
  **Verify** Tell a friend and the save-your-link sheet on both simulators rather than assume.

---

## 2. The link vault

The app owns the links. `WKWebView` storage is the browser's, and nothing promises it survives site
data clearing, storage pressure, or a future tracking-prevention rule. Losing it would lose the
list — the link *is* the list.

### Where they are kept

Keychain, one generic-password item per link:

| | |
| --- | --- |
| class | `kSecClassGenericPassword` |
| service | `com.pricebrannen.todaysfive.links` |
| account | the 22-character secret (`W` or `R`) |
| value | JSON: `{ mode, origin, nickname, name, addedAt, lastSeenAt }` |
| accessibility | `kSecAttrAccessibleAfterFirstUnlock` |
| synchronizable | **false** |

iCloud Keychain would put list secrets on Apple's servers and change what `about.html` promises.
Default off, and a separate decision if it is ever wanted — `about.html` would have to change with it.

### The protocol, for Phase 3

```swift
public protocol LinkVault: Sendable {
    func all() throws -> [VaultedLink]
    func put(_ link: VaultedLink) throws          // insert or update, never duplicate
    func remove(id: String) throws
}
```

`KeychainLinkVault` is the only implementation this phase. The Watch (WatchConnectivity) and widgets
(a shared access group) read the same items in Phase 3: moving a handful of Keychain items into a
`kSecAttrAccessGroup` is a loop over `all()` and a re-`put()`, not a redesign. The access group needs
the paid team too, so it is deliberately not designed around now.

### How the app learns a link

1. **A universal link or a paste** — the app has the URL in hand.
2. **The page navigating** — `decidePolicyFor` gives the URL with its fragment. `switchTo()` on iOS
   does `location.replace(...)`, which is a real navigation, so this fires.
3. **`history.replaceState`**, which `takeExtrasFromHash` uses to strip `/add?text=…`, does *not*
   fire the delegate — so the app also observes `webView.url` by KVO. Between the two, every change
   of the open list is seen.

Every URL goes through the core's `Links.parseLink` — the same parser the web uses, from Phase 1 —
and only a well-formed `#/l/<W>` or `#/r/<R>` is vaulted, with its mode.

4. **The registry the page holds** — the lists the app has never navigated to. Read with
   `evaluateJavaScript("localStorage.getItem('tf/v2/meta')")`, parsed with the core's JSON reader.
   That is a **read of storage the app already hosts**: no bridge message, no web change, no new
   contract. It runs on `didFinish` and on foreground.

`meta.lists` entries carry `{ id, mode, name, origin, nickname, addedAt }`, which is exactly the
vault's payload.

### How the two stay agreed

The rule keys on **whether `tf/v2/meta` exists**, never on whether it holds any lists — and, after
running it, on a third state that reading the code had not suggested:

| the read | what it means | what the vault does |
| --- | --- | --- |
| **unreadable** (`localStorage` threw) | nothing at all | nothing at all, and retry after a beat |
| **absent** (read fine, no key) | the store was wiped, or a fresh install over a vault | offer the most recently seen link back; remove nothing |
| **present** (parses, `lists: []` included) | the page is speaking for itself | write what it names, drop what it does not |

Keying on `lists` being non-empty instead would be a bug: removing the **only** list leaves
`lists: []`, restore would fire on the next launch, and the list you just removed would come back.

**The third row is the one that only a simulator could have found.** `localStorage` throws a
`SecurityError` on a document that has no real origin yet, which is what the first load looks like
for a moment — and the first version wrapped the read in a `try/catch` returning `""`, which the app
then read as *absent*, and so navigated away from whatever the person was on. Every launch, on every
device. `RegistryRead` is now `.unreadable | .absent | .present`, and the conflation cannot be
written down any more.

Two further rules keep a race from eating a list:

- A link the app has vaulted but the page has **never named** is exempt from removal. A link tapped
  from Notes is vaulted before the page finishes opening it, and must not be dropped in that window.
- **A restore clears that flag on every link.** Opening the restored link gives the page a registry
  of its own, and the next reconcile reads it — but the page registers a list asynchronously, so
  that read can land first and name nothing. Without this the vault deletes the list it has just
  restored, one reconcile later. Caught on a simulator; now a test.

Reconciling instead of relaying needs no web change, no new bridge message and no new contract, and
it survives any future removal path the page grows.

The rules are a pure function — a registry read in, vault actions out — so they live in
`TodaysFiveCore` (`VaultReconciler`) and are covered by the Swift suite. Only the Keychain I/O lives
in the app, where a simulator run is the proof.

---

## 3. Haptics, and what the code turned up

### The page already fires a haptic — this is the one real finding

`app.js` has had an iOS haptic since before this phase:

```js
const HAPTIC = IOS && (() => { const h = document.getElementById("haptic"); return !!h && "switch" in h; })();
function haptic() {
  if (!HAPTIC || dev.haptics === false) return;
  const h = document.getElementById("haptic"); h.click(); …
}
```

A hidden `<input type="checkbox" switch>` — toggling it inside a tap makes iOS play the switch tick.
It is called on **check-off** (`toggle()`) and on **shuffle**. `dev.haptics` is read but never
written: a latent kill switch with no UI.

That is good news and a trap. The good news: the web already feels right on one of the three moments.
The trap: in the app, a check-off would fire **the switch tick and the native generator — two buzzes**.

It also cannot do the job on its own: one tick, no distinct un-check, no finale, no control of
intensity. So the native haptics are still worth having, and they have to *replace* the tick in the
app rather than stack on it.

### What the app does

Three, and nothing else:

| moment | generator |
| --- | --- |
| check-off | `UIImpactFeedbackGenerator(style: .medium)`, `prepare()` on touch-down |
| un-check | `UIImpactFeedbackGenerator(style: .light)` |
| finale | `UINotificationFeedbackGenerator`, `.success` |
| shuffle | `UIImpactFeedbackGenerator(style: .light)` |

Shuffle is the fourth (added at checkpoint 1): the page ticks on shuffle today through the switch
trick, and since 1.10 turns that trick off inside the app, the app has to carry it or the shuffle
would go quiet. No haptic on ordinary taps. The page's sound still plays. On by default; the app gets no settings of
its own this phase.

### The bridge

The page dispatches one `CustomEvent` per moment, from the same place the sound plays.

**On `window`** (settled at checkpoint 1) — matching the page's existing `tf:theme` and
`tf:settings`, so there is one convention in the file rather than two.

Names, which become contract (§8): **`tf:check`, `tf:uncheck`, `tf:finale`, `tf:shuffle`**. No
`detail` — nothing that could identify a list.

Call sites in `app.js`, beside each existing `sound.*` call:

| site | event |
| --- | --- |
| `toggle()` — `sound.check(…)` | `tf:check` |
| `toggle()` — `sound.uncheck()` | `tf:uncheck` |
| `toggle()` — the finale timeout, `sound.finish()` | `tf:finale` |
| `celebrateRemote()` — `sound.check(…)` | `tf:check` |
| `celebrateRemote()` — the finale timeout | `tf:finale` |
| undo (`sound.uncheck()`), Start again (`sound.uncheck()`) | `tf:uncheck` |
| `shuffle()` — `sound.tick()`, beside the existing `haptic()` | `tf:shuffle` |

Dispatching at the call sites rather than inside `sound.js` is deliberate: `sound.js` returns early
when the device is muted, and muting the sound must not mute the haptic. They are different senses.

The app hears them with a `WKUserScript` at document end forwarding to a `WKScriptMessageHandler`
named `tf`. **Where the script is injected is a verify-first question:** the site's CSP is
`script-src 'self' 'sha256-…'` with no `unsafe-inline`, so a user script in the *page* world may be
refused. The plan is to inject into `WKContentWorld.defaultClientWorld`, which is not subject to the
page's CSP and still shares the DOM, so a `window` event dispatched by the page is observable. If
that turns out not to hold on 18.1, the fallback is the page world plus a CSP hash for the injected
script — and the results section will say which was needed.

### How the page knows it is in the app

`WKWebViewConfiguration.applicationNameForUserAgent = "TodaysFive/1"`, so `navigator.userAgent`
carries a token. **No injection, no CSP, no content-world question** — it is just there, before the
first byte of script runs. The web reads it once:

```js
const SHELL = / TodaysFive\//.test(navigator.userAgent);
```

Dormant on the web: the token never appears in Safari.

### The one web change: release 1.10

Two lines beyond the event dispatches, and a third settled at checkpoint 1:

```js
const SHELL = / TodaysFive\//.test(navigator.userAgent);
const HAPTIC = IOS && !SHELL && (() => { … })();   // the shell does its own, and better
const STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true || SHELL;
```

That is the whole of it: `SHELL`, one term on `HAPTIC`, one on `STANDALONE`, and seven
`dispatchEvent` calls. Nothing
renders differently, nothing is stored, no file is added to the precache, and a device that is not
the app cannot tell 1.9 from 1.10 except by the toast.

It ships as a **web release following `COMPATIBILITY.md` §7 to the letter**: all Node suites, the
compatibility test, the browser suite at both viewports, the real-backend suite, Lighthouse, the
cache name bumped, `BUILD` set from `git rev-list --count main` after the merge. **`BUILD` jumps well
past 119** because the Phase 1 apple commits count toward it; that is expected and is not to be
"fixed". `whatsnew.json` gains a 1.10 entry: a headline about the iPhone app and at most three items,
written through `email-in-price-voice`, voice only.

### 3a. `STANDALONE`, and a question for you

`const STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;`

In a `WKWebView` both are false, so the app is treated as **Safari on iPhone**. Three things follow,
all visible:

1. The **"Add this to your Home Screen"** hint appears 2.5 s after a list opens (`app.js:2185`) —
   nonsense advice inside the app, though dismissible once per device.
2. The **save-your-link sheet** leads with the Home Screen steps (`panels.js:334`) instead of the
   copy-first branch.
3. **Every list switch reloads the page** (`app.js:2049`), because the iOS-not-standalone branch does
   `location.replace` + `reload()`. It works — it is what Safari does today — but it is a visible
   flash the Home Screen app does not have.

One more line in 1.10 fixes all three, using the `SHELL` constant §3 already introduces:

```js
const STANDALONE = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true || SHELL;
```

**Included** (settled at checkpoint 1). It removes a branch rather than adding one, and without it
the app would ship with an Add-to-Home-Screen hint inside itself.

---

## 4. Sound in the shell

- `AVAudioSession` category **`.ambient`**, so the ring/silent switch still silences it, as it does
  in Safari and the Home Screen app. Not `.playback`: the brief is right that fighting the silent
  switch would be wrong, and the page already shows a one-time hint about it
  (`dev.silentHint`, `app.js:1198`).
- `configuration.mediaTypesRequiringUserActionForPlayback = []`, so a check-off sounds without a
  fresh gesture. The page's engine still primes on the first `pointerdown`.
- **To record, not assume:** whether the first check-off after cold start sounds; whether it survives
  backgrounding and returning; what the silent switch does. Measured on the device at checkpoint 3,
  since a simulator's silent switch is not real.

---

## 5. Universal links — done

Everything below was written while the paid programme was still pending. It is kept as it was, with
what actually happened written under each step, because the gap between the two is the useful part.

**a. The Team ID.** `T7GTZC5US9` — the dead certificate was right. Confirmed not by reading the
membership page but by the signed binary: `codesign -d --entitlements` on the device build says
`application-identifier T7GTZC5US9.com.pricebrannen.todaysfive`.

**b. The user-site repo.** Created, public, holding exactly `.nojekyll` and
`.well-known/apple-app-site-association` and nothing else. `gh` is still not installed here; the repo
was made and is pushed with plain `git` over the osxkeychain credential helper, which is all it ever
needed.

The file had one component, `/todays-five/*`. That was wrong, or at least unnecessarily brave. Every
Today's Five URL — Private, View, `/add?text=`, `/mine`, `/shared` — has the path `/todays-five/` and
nothing else, because the id and the whole grammar live in the **fragment**, and Apple matches on the
path with the fragment stripped. So the pattern that has to match is the bare `/todays-five/`, and
whether `*` matches an empty string is not a thing to leave to a reading of Apple's matcher. Both are
named now:

```json
{ "applinks": { "details": [
  { "appIDs": ["T7GTZC5US9.com.pricebrannen.todaysfive"],
    "components": [ { "/": "/todays-five/" }, { "/": "/todays-five/*" } ] } ] } }
```

Nothing else on the origin is claimed. `astraeus` is a separate project page under the same host and
no rule here touches it.

**c. The entitlement.** `applinks:54kz2vzbdw-code.github.io`, and it is in the signed app:

```
com.apple.developer.associated-domains  →  applinks:54kz2vzbdw-code.github.io
```

`?mode=developer` was **not** needed and is not there. It exists to skip Apple's CDN cache while
iterating, and the CDN turned the edit around inside the time it took to register the phone — so the
release entitlement is the one that was tested, which is better than testing a debug variant of it.

**d. Verification.** `https://app-site-association.cdn-apple.com/a/v1/54kz2vzbdw-code.github.io`
returns the file with both components. **GitHub serves it as `application/octet-stream` and Apple's
CDN does not care** — that was the one thing that could have made a user-site repo the wrong answer,
and it is closed.

**e. On open.** Proven on the phone, not on a simulator. A View link tapped in **Notes** left Notes
and opened the app — no Safari chrome, and terminating the app over the cable dropped the screen to
the Home Screen, which is what says it was *this* app and not the Home Screen web clip that carries
the same mark. The app came up on that list, in view mode, with the fragment intact. A long press on
the same link offers **Open in "Today's Five"** above Open in Safari.

An add-from-anywhere URL, `#/l/<W>/add?text=…`, opened the app the same way and **the line landed**:
the page took the add, and `tfive show` against the real backend independently read the list back at
`rev 2` with the new line on Today. And with the app already running in the background on the edit
link, a tap on the View link brought it forward and switched it to that list in view mode — the
background case, which is the one the scene delegate's `continue userActivity` exists for.

**What was not run: the Messages half.** The brief asks for the same tap from Messages as from Notes.
Getting a tappable link into Messages means *sending* a message, and that was not something to do on
someone's behalf without asking; asked, the answer was to skip it. It is recorded here as not run
rather than quietly dropped. Notes exercises the identical path — the same `NSUserActivityTypeBrowsingWeb`,
the same `webpageURL`, the same `open(_:)` — so what is untested is iOS's decision to route from
Messages specifically, not anything in this app.

**The known trade, stated plainly:** with the app installed, every tap on a Today's Five link on that
phone opens the app — **View links included**. Safari's banner and a long-press still give the web.
`about.html` does not change this round: nothing new is stored, and nothing about the privacy
promise changes.

## Privacy

Non-negotiable, and cheap to keep:

- **No URL is ever printed.** No `print`, `os_log` or `NSLog` of a link, a fragment or a secret. A
  grep over the app target is part of the checklist, not a habit.
- **No crash reporting, no analytics.** There are none. It stays that way.
- **No `NSUserActivity` with Handoff, Spotlight or prediction.** If one is ever created,
  `isEligibleForHandoff`, `isEligibleForSearch` and `isEligibleForPrediction` are all false — Handoff
  and Spotlight would carry the secret off the device. This phase creates none at all.
- **The app makes no network request of its own.** Everything on the wire is the web view's, to the
  Pages host and Supabase. Verified by watching the app's traffic with the web view idle.
- The page still strips `/add?text=` from the address bar after handling it, exactly as on the web —
  the app changes nothing about that.
- Keychain items are `AfterFirstUnlock` and **not** synchronizable, so no secret reaches iCloud.

---

## Checkpoint 1: answered

1. **`window`**, matching the page's existing `tf:theme` / `tf:settings`.
2. **The `STANDALONE` line is in** 1.10.
3. **A fourth event, `tf:shuffle` → `.light`**, so the app does not lose the tick the page has today.
4. **The vault keys on `tf/v2/meta` existing**, not on `lists` being non-empty (§2) — otherwise
   removing the only list resurrects it.

Membership is bought and awaiting the enrolment email, so §5 is written, wired and left switched off:
the entitlement, the association file and the tests are ready to turn on with a Team ID and a repo.

## What I will not do without asking

Change anything the rail, Today, ⋯ or Settings render; add an app setting; touch `about.html`; bundle
the site; add a third-party dependency; or write a link anywhere it could be read back.

---

## Verification (the checklist this round is held to)

**Simulators, 18.1 and 26.5:** welcome → Keep → list; check-off, un-check and finale with the
generator calls logged (a simulator has no motor, so the calls are logged and counted); the Share
sheet by intent; Paste a link; New keys; an offline open after a first online open, proven or stated
unproven; About's GitHub link opening Safari.

**Vault:** in a debug build, wipe the web store, relaunch, the list comes back from the vault; Remove
from this device removes it from the vault; a View link is vaulted as a View link. *If
`WKWebsiteDataStore.removeData` turns out to be restricted under app-bound domains, the wipe is done
by deleting the app's WebKit directory between launches, and the results say so.*

**Privacy:** the grep; the `NSUserActivity` count (zero); no request of the app's own.

**Web (1.10):** every Node suite, the Swift suite, the browser suite at 1440×900 and 390×844, the
real-backend suite once, Lighthouse desktop and mobile, then the live check on a fresh device and on
a 1.9 device after the merge — which must see exactly one new thing, the toast.

**Recorded here:** the app's cold start on the 26.5 simulator; before/after screenshots (the
simulator at 26.5, the web at 390×844).

---

## Results

### What running it found that reading it had not

Five bugs, all in the app, all caught by putting it on a simulator rather than by reading the code.
The last two are the serious ones, and both are in the **vault** — the part whose whole reason for
existing is that losing a link loses the list.

1. **The async `evaluateJavaScript` throws when the script evaluates to `null`** — which is exactly
   what `localStorage.getItem("tf/v2/meta")` returns on a device that has never held a list. The
   `catch` logged and returned, so **a fresh install never reconciled its vault at all**: the one
   case the vault exists for.
2. **A restore deleted what it had just restored.** Opening the restored link gives the page a
   registry of its own and the next reconcile reads it — but the page registers a list
   asynchronously, so that read lands first and names nothing. A restore now clears every link's
   "has been named" flag, so each has to be named again before its absence means anything.
3. **`localStorage` throws a `SecurityError` on a document with no origin yet**, which is what the
   first load looks like for a moment. The read was wrapped in a `try/catch` returning `""`, which
   the app read as *absent* — the wiped-store case — and so **navigated away from the page the person
   was on, on every launch**. A read now has three answers rather than two (`.unreadable`, `.absent`,
   `.present`), the reconciler decides nothing on `.unreadable`, and the conflation cannot be written
   down any more.

4. **A wiped web store deleted the vault, in the exact case the vault exists for.** Checkpoint 1's
   correction said to key on `tf/v2/meta` *existing* rather than on `lists` being non-empty, so that
   removing the only list could not resurrect it. That rule is right about removal and unreachable
   about wipes: **the page writes a registry the moment it boots**, so on a real wipe `meta` is never
   missing — it is `{"lists":[]}` a fraction of a second later. The app read that as "the page
   removed everything" and logged `vault: +0 −1`, throwing away the only copy of the link.

   The two states are indistinguishable in the registry, so the app now leaves **a mark of its own in
   the same storage** (`tf/app/seen`, holding nothing). It survives a removal and dies with a wipe,
   which is precisely the distinction. Mark there → the page is speaking, and removals apply. Mark
   gone → the store is new to the app, nothing is removed, and the most recently seen link is offered
   back. Both requirements now hold at once, and `theMarkTellsThemApart` is the test that says so:
   same registry, same vault, opposite answers.

5. **"Remove from this device" never reached the vault.** It does not take the entry out of `lists` —
   it sets `archived` on it, because the server and the person's other devices still have the list
   and Lists brings it back. Reading `lists` naively, the phone went on holding the key to a list it
   had been told to forget, and a later wipe would have handed it back. An archived entry is now read
   as *not held*.

The third is the one worth remembering for its shape: the first two were races, but that one was a
plain confusion between *"I could not read"* and *"there is nothing there"*, and it was in the design.
The fourth is the same mistake one level up — *"the registry is empty"* is not *"the store is gone"* —
and it cost the most, because reading rather than relaying means the app has to infer an event from a
state, and two different events leave the same state. The mark is the app's way of remembering which
one it saw.

### The bridge, measured rather than assumed

Three things about the design could not be settled by reading, so the app carries a `-TFSelfTest`
that dispatches the four events **in the page world** — exactly as `app.js` does from 1.10 — and
counts what the listener **in the client world** heard:

```
bridge=ready heard=4/4  registryReadableFromClientWorld=string
shellToken=true serviceWorker=true standaloneSeenByPage=false
```

- a user script in a client content world **is not** refused by `script-src 'self' 'sha256-…'`;
- a `window` event dispatched by the page **does** cross into that world (the DOM is shared, the JS
  globals are not — which is why the shell flag is a user-agent token and not an injected variable);
- `localStorage` is reachable from the client world;
- **app-bound domains really does buy the service worker** inside a `WKWebView`;
- and `standaloneSeenByPage=false` is §3a, measured: the page did think it was Safari.

### The suites

| | |
| --- | --- |
| Swift (`swift test`) | **94 tests in 7 suites** — the 72 from Phase 1 plus 22 for the vault |
| Node | model 27, theme 30, crypto 10, sync 14, sound 11, features 28, compat 9 — all green |
| Real backend (`tools/realsync4.js`) | **6 of 6**, six lists created and all six deleted. Unchanged poll **29 bytes**; a realistic list (40 lines, 90 days of history) **6,553 bytes encrypted** against 69,636 plain, well under the 20 KB budget and the 96 KB cap |
| Browser (`tools/e2e4.js`) | **159 of 159** at 1440×900 and 390×844, zero page errors, zero CSP violations, zero third-party requests — including the new test that the four moments fire once each and show nothing on the web |
| First paint | 1.9 and 1.10 measured back to back on the same local server, five runs each at 390×844: **FCP 52 ms both**, DCL 36/37 ms, load 39 ms. `app.js` grows 1,126 bytes (0.7 %), all of it comment |
| Lighthouse 12.8 (Chrome, the same harness and machine as 1.1–1.9, gzip like Pages) | **desktop 100 / 100 / 100 on both**, three runs each (FCP 364–414 ms either way). **Mobile: the same distribution on both** — ten runs each, six scoring 98 and four scoring 99, a11y and best practices 100 throughout, CLS 0.001, TBT 0. The spread is the harness's, not the build's: every mobile run lands in one of two clusters (FCP ≈ 1584 ms → 99, FCP ≈ 1776 ms → 98) and which one it lands in is a coin flip on both 1.9 and 1.10. Installability errors: `in-incognito` and nothing else, on both — the harness's own, as in every previous round |

### On the phone — against the deployed 1.10, not a copy of it

Everything below was done on the **iOS 26.5** simulator against `https://54kz2vzbdw-code.github.io/todays-five/`
after the merge, with the console open; the haptic tally is how a machine with no motor proves the
generator was called.

| | |
| --- | --- |
| The four moments, from the page's own taps | crossing a line off, taking one back, the last line of the day and a shuffle each arrived: `check=4 uncheck=2 finale=1 shuffle=1`. The finale lands 300 ms after the check-off that caused it, exactly as the sound does |
| iOS **18.1** | the same app, the same site: `heard=4/4`, `serviceWorker=true`, `shellToken=true`, and a real tap on a line raising `check`. The service worker registers on 18.1, which was the open question |
| Cold start | ~0.9 s from `simctl launch` to the page's own script running (0.76 s of it before the web view is even asked to load), including simctl's own overhead |
| Web Share | **it works** — `SHARE…` on the View link opened the iOS share sheet, titled *Today's Five*. This was on the list to verify rather than assume |
| The save sheet | leads with the link and offers no Add-to-Home-Screen hint: §3a's `STANDALONE` line, seen from the other side |
| The vault, wiped store | wipe `WKWebsiteDataStore`, relaunch → `vault: restoring a list the web store had lost`, zero removals, and the list back on screen. The page asks *whose list is this?* on the way in, because from its side the link genuinely is new |
| The vault, removal | *Remove from this device* → `vault: +0 −1` on the next read. The list moves to Lists' **Removed from this device** section, where Restore still brings it back |
| The vault, deletion | *Delete this list everywhere* → `read: registry=0 list(s) mark=there`, then `vault: +0 −1`. This is checkpoint 1's requirement on the phone: an empty registry with the mark still there is a removal, and the list does not come back on the next launch |
| Paste a link | pasted into Lists and opened; the app vaulted what it saw go by |
| Off the site | About's **on GitHub** link left the app and opened Safari, with the *◀ Today's Five* chip to come back. Everything on the host stays inside |
| About, on the phone | **VERSION 1.10 (BUILD 139)** — the deployed build, read off the screen |
| Privacy | one `print` in the app, `#if DEBUG`, every call site a fixed string with counts or a length. No analytics, no crash reporting, and the four `NSUserActivity` mentions all *receive* a universal link; the app creates none |

### The live check, both halves

**A fresh device** is the simulator run above: welcome → Keep this list → an encrypted row on the
real backend, on the deployed 1.10.

**A device that already holds a 1.9 list** was done on one origin rather than two, because storage
does not cross ports: a 1.9 clone served on 8793, a list made and crossed off there, then the same
origin swapped to 1.10 under it and the URL opened fresh — not refreshed.

```
1.9  build  : 1.9 (build 119)      1.9  count : 3/3 done      1.9  lists : 1
swapped     : the origin now serves 1.10
1.10 build  : 1.10 (build 139)     1.10 count : 3/3 done      1.10 lists : 1
toast       : New in 1.10: Now there's an iPhone app.
page errors : none
```

The list is intact and the toast is the only new thing it sees, which is what §7 step 8 asks for.

### Before and after

`apple/shots/` holds them; the shell's are the 26.5 simulator, the web's is Chrome at 390×844 with an
iPhone user agent.

| | before — 1.9 in the shell | after — 1.10 in the shell |
| --- | --- | --- |
| Saving a new list | `before-save-sheet-1.9.png` — **"Add it to your Home Screen: 1. Tap Share… 2. Scroll down. 3. Add to Home Screen."** Instructions for a browser, given inside an app that has no Share button and is already on the Home Screen | `after-save-sheet-1.10.png` — **"Saved—this icon holds your link. Copy it too, as a backup."** and Copy link beside it |
| A list, open | `before-install-hint-1.9.png` — the same advice again as a toast at the bottom, and `before-list-1.9.png` | `after-list-1.10.png` — no hint, at any point |

And the third panel, which is the one that matters most: `web-save-sheet-1.10.png` is **1.10 in a
mobile browser**, still saying *Add it to your Home Screen*. The copy did not change for anybody; the
shell simply stopped being told it was Safari.

### What could not be run, and why

- **Three test lists are left on the server.** The simulator round made four; the last was deleted
  everywhere at the end, and the other three were orphaned by the vault experiments themselves —
  their links were vaulted and then wiped, which is what the experiment was. Each holds the three
  demo lines and nothing else, and a list nobody opens for twelve months is deleted from the server
  (`about.html`). The suites keep a ledger for this; a session driving the app by hand does not.
- **The create limit got in the way for about two hours.** The server allows twelve new lists an hour
  per address, and the bucket looks shared rather than per-address — a single create was refused when
  I had made one that hour. `tools/realsync4.js` ran clean once it cleared. The simulator passes were
  moved onto the page's own local transport (`-TFQuery transport=local`) so they spend nothing.
- **The interop script was not run.** My own amendment to §7 step 5 says it goes with a change that
  touched §1–§4; 1.10 touched none of them, and the core change (the vault) is not something it
  exercises.
- **A View link vaulted as a View link was not shown on the phone.** The unit test `seenLink` covers
  the exact function the app calls, but the device demonstration needs a View link for a list the
  device does *not* already hold — pasting the View link of a list you hold opens the copy you have,
  which is right, and vaults nothing new. Worth doing on the phone with a link from another device.
- **The silent switch, and a real haptic.** A simulator has no ring/silent switch and no Taptic
  Engine: the tally proves the generator was called, not that anything was felt, and `.ambient` +
  `.mixWithOthers` is verified by construction rather than by ear. Both want the phone.
- **An offline open after a first online open.** The service worker is measured as registered and
  controlling on both simulators, which is the mechanism, but the machine has no way to take this
  simulator off the network without taking the Mac off it.

### One thing I got wrong, and what came of it

A `git add -A` swept `tools/.realsync-created.txt` — the ledger the real-backend suite writes so a
crashed run can name what it created — into a commit, and I pushed it to a public repository. **A
list id is its secret.** None of the eight was ever a live row (the ledger records the id before the
push, and every create in those runs was refused by the limit), and all eight were deleted from the
server anyway; the two commits were rewritten and both ledgers are now in `.gitignore`. Had the
timing been different they would have been real links to real lists.

---

## Phase 2b: what the real device showed

The simulator round left four things that "want the phone" (above). Three of them are now answered,
and the phone turned up four things a simulator could not have.

**Answered.** A View link vaulted as a View link: opening the View link of a list the device already
held under its *edit* link vaulted a second entry, `mode=view`, alongside it. A real haptic: the
`-TFSelfTest` tally is `heard=4/4` on hardware with a Taptic Engine rather than on a stub. The
service worker runs in the web view on the device (`serviceWorker=true`), so §6's whole story holds
in the app. Still unrun: the offline open, for the same reason as before — the machine cannot take
the phone off the network without taking itself off it.

**1. Developer Mode is a wall you meet before signing.** Until it is on, `xcodebuild -showdestinations`
lists only *Any iOS Device* — `devicectl` sees the phone and the build system does not, which reads
like a signing problem and is not one. Worse, the toggle only appears in Settings once a Mac has
tried to install a development build, so the order is: attempt the install, fail, turn it on, restart.

**2. A team with no devices cannot be signed for, and a generic destination cannot fix it.**
`-destination 'generic/platform=iOS'` names no device to register, so `-allowProvisioningUpdates`
has nothing to offer Apple and the answer is *"Your team has no devices from which to generate a
provisioning profile."* Registering the phone with `POST /v1/devices` fixes it in one call, and then
the generic destination builds and signs — which is the check §1 actually wanted.

**3. The app icon and the Home Screen web clip are indistinguishable.** Both are the same mark on the
same ground, because that is the design: one script draws the site's icons and the app's. On a phone
that has both — and this one does, the web clip predating the app — there are two identical
*Today's Five* icons on the Home Screen, and tapping the wrong one opens a page that looks almost
like the app. It cost real time here: the first "the app loads the site" screenshot was the web clip
showing a personal list, and only launching over the cable settled it.

The **tinted** appearance tells them apart: the app declares light, dark and tinted in its
`AppIcon.appiconset`, so it renders as the mark alone on the system's tint, and a web clip does not
participate. That is worth knowing but it is not a fix; if this ever matters to a person rather than
to a check, the answer is a distinguishable icon or removing the clip, and neither is this round's
business. The three appearances are in `shots/device/home-icon-{default,dark,tinted}-1.10.png`.

**4. One list, two vault entries — and that is correct.** After opening both the Private and the View
link of the same list, the dump reads:

```
vault: 2 links
  · mode=edit origin=mine seen=true id=22 chars
  · mode=view origin=mine seen=true id=22 chars
```

`#/l/<W>` and `#/r/<R>` are different ids by construction (§1: `R` is derived from `W`, never the
reverse), so the registry holds two entries and the vault follows it. The web does exactly this. It
is only startling on a phone, where "my list" feels like one thing.

**The vault, on hardware.** The wiped-store half ran on the device and behaved as designed:

```
debug: web store wiped
read: registry=absent mark=gone
vault: +1 −0
vault: restoring a list the web store had lost
```

and the race the mark exists to survive showed itself too: a link handed to the app is vaulted before
the page has registered it, so the first reconcile sees `registry=0 list(s)` against a vault holding
one link. Nothing was removed, because a link the page has never named is exempt until it has been
named once. That rule was written from a simulator finding; the phone is where it earned its keep.

### The screenshots

`shots/device/` — the shell on the live site, the three Home Screen appearances, a View link opened
from Notes, the long-press menu offering *Open in "Today's Five"*, an add-from-anywhere URL landing
its line, and the background-to-foreground case. The long-press shot is redacted: Notes and Safari's
link preview both spell the list's read secret out in full, and the menu is the only part of that
frame worth keeping. The list those shots were taken against was made for this round and deleted at
the end of it.
