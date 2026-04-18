# PM Review — R3.5 Crosshair + Tooltip

## Verdict
ITERATE

## Findings

### 🟡 Tooltip is too easy to miss, then gone forever
**Issue:** First-focus only, 2.5s timeout, sessionStorage-gated. In the screenshot the intro modal "CLICK ANYTHING TO READ" is *still on top of* the tooltip on first room entry — the user is reading the modal, not the 11-px tooltip below the crosshair. The 2.5s window burns down while they read the modal, then they dismiss it and the hint is permanently spent for the session. Net result: a meaningful subset of new users see exactly zero hint despite the code "firing."
**Fix:** Either (a) gate `shouldShow` on `!modal && !introModalOpen` so the timer doesn't start until the user is actually playing, or (b) drop sessionStorage and show the tooltip on the first N (e.g. 3) distinct focuses, fading after 2.5s each time. Cheaper UX insurance than the storage gymnastics.

### 🟡 Crosshair signal is real but secondary
**Issue:** 6px → ~10px gold→cyan shift is *visible if you're looking for it*, but it's not the discoverability mechanism — the tooltip is. So if the tooltip misses, the crosshair alone won't carry the load for a first-time user who doesn't know to watch a dot. Acceptable as a *reinforcing* signal for returning users.
**Fix:** None required if tooltip lifecycle is fixed. Otherwise consider 8px base + 2× scale.

### 🔵 Mobile (OOS but flag)
**Issue:** No crosshair on touch, no hover-focus event → tooltip never fires. Mobile users get the exit-hint fix but zero in-room interaction discoverability. Copy "Press E" is also wrong on touch.
**Fix:** Track as separate ticket — show "Tap objects to interact" toast once per session on mobile FP entry.

### 🔵 Copy redundancy
**Issue:** Intro modal already says "click on objects ... to open their description." The new tooltip says "Press E to interact." Two overlapping discoverability layers, neither acknowledging the other.
**Fix:** Acceptable — keyboard hint complements click hint. Monitor.

## Does this solve the original complaint?
**Partially.** For desktop returning users who notice the crosshair color shift, yes. For first-time desktop users, the tooltip is technically there but is racing the intro modal and a 2.5s timer it will likely lose — the original "no hints" complaint can recur. Mobile is uncovered. Fix the modal-overlap race before shipping.
