# ADR-0015: The app is local-only and has no accounts

## Status

Accepted — 2026-08-12

Supersedes the offline-availability consequence in ADR-0012, and parks (does not
revoke) the sync architecture the `app/src/` modules implement.

## Context

The app was built to sync: Supabase Postgres, email accounts, row-level security
scoped to the signed-in engineer, a debounced write on every state change. It
works, and the privacy properties are genuinely good — RLS means one engineer
cannot read another's rows even if they try, and ADR-0012 went further and put
the check-in diary behind an owner-only policy with no service-role view.

That reasoning was about *technical* access. The blocker raised when the app was
put to the employer is a different question: engineers' CTAP figures are internal
performance data, and the concern is not that someone could read them but that
they leave the device at all. A personal tool that uploads an engineer's
performance numbers to a third-party database — however well secured, however
private in practice — is a thing the business has to have an opinion about before
a single engineer installs it. Right now it doesn't have one, and getting one is
slower than the trial we want to run.

So the constraint arrives from outside the design: **for the first trial, nothing
leaves the phone, and there is no account to sign in to.**

This is worth stating plainly because "it's private anyway" is true and beside
the point. The objection is not answered by better encryption or a stricter
policy — it is answered by there being no transmission. Local-only is not a
weaker version of the privacy story; for this audience it is a stronger one, and
it is the version that can be explained to a manager in a sentence.

## Decision

**1. The cloud layer is parked, not deleted.** `app/src/main.js`, `db.js`,
`auth.js`, `supabase.js` and `migrate.js` stay in the tree, working, untouched.
`index.html` simply does not load `src/main.js`, and sets
`window.__ctapSupabaseActive = false`. Every `__ctapSync*` call site in `app.js`
is already written as `if (window.__ctapSyncWeek) …`, so with the bridge absent
they are all no-ops. Restoring sync is one script tag and one flag.

**2. `localStorage` is the only store, and is therefore authoritative.**
`loadState`/`saveState` in `data.cjs` already persisted the whole state object
under `jct_state`; that path is now the only path. Nothing overwrites it, which
is what makes point 3 possible.

**3. Logging works with no signal.** Previously the Log Job tab went dead
offline, the check-in card hid itself, and the app bounced the engineer to the
Dashboard on launch. That was correct at the time: a signed-in device would have
had its offline writes discarded by the next successful cloud load, so refusing
the write was better than silently losing it. With no cloud load, the reason is
gone and the gating goes with it. This is the change that matters most to the
people testing it — the plant rooms, cellars and airing cupboards where the work
happens are exactly where signal is worst.

**4. No account UI anywhere.** No sign-in, no sign-up, no sign-out, no email
capture, no "sync across devices" invitation. The Settings card in that slot now
explains that the data is on-device and offers to erase it. The engineer's name,
which the greeting used to take from the account, is a local preference they type
in themselves.

**5. Deleting is local and total.** "Erase all data" clears `jct_state` and every
`jcpd_*` preference and reloads. There is no server copy to chase, no 24-hour
cleanup function, and nothing to explain — which is the point.

## Consequences

- **There is no backup.** Delete the app, lose the phone, or wipe the browser
  data and the engineer's history is gone with it. This is the real cost of the
  decision and it must be said plainly in the walkthrough, not buried in
  Settings. Testers should be told before they start entering a quarter's worth
  of figures.
- **No second device, no handover.** An engineer with a work phone and a personal
  phone keeps two unrelated sets of data.
- ADR-0012's consequence that "check-ins are unavailable offline" no longer
  holds and is superseded here. Its five constraints are otherwise untouched —
  and constraint 1 (companion, not surveillance) is now enforced by there being
  no server at all, which is a stronger guarantee than the RLS policy it
  originally rested on.
- **The privacy copy is now a plain statement rather than a hedge.** Settings
  previously said data was on the device "and synced to your personal account on
  Supabase (EU)". It now says the data is on this device and nowhere else, which
  is both simpler and fully true.
- **Deploys still reach testers**, because the service worker stays network-first
  with a cache fallback. Two latent bugs in it were fixed alongside this change:
  `activate` was deleting every cache including the one `install` had just
  populated, and the offline fallback matched cache entries strictly, so a
  `?v=` cache-buster bump meant a miss and a blank screen.
- **The test harness boots the shipped path.** `tests/helpers/app-harness.js`
  previously set the Supabase flag true and called `__ctapInit` by hand,
  simulating a boot that no longer happens; it now fires `DOMContentLoaded` on
  `document` and fails loudly if the app does not render itself.

## Alternatives considered

**Keep accounts, disable sync.** Rejected. It leaves a sign-in screen in front of
an engineer for no benefit they can perceive, and leaves the app still talking to
Supabase on boot to check for a session — which is exactly the transmission the
objection is about.

**Encrypt the synced payload client-side.** Rejected for now. It answers "could
anyone read it" — a question nobody actually asked — while leaving "does it leave
the phone" answered yes. It also puts a key-management problem in front of an
engineer who wants to log six breakdowns.

**Ship a manual export/import so testers can back up.** Not rejected on merit —
this is the obvious answer to the no-backup consequence, and it stays local. Left
out of this change to keep the trial build small, and worth revisiting the moment
a tester has real data they would be upset to lose.
