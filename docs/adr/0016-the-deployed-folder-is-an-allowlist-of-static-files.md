# ADR-0016: The deployed folder is an allowlist of static files

## Status

Accepted — 2026-09-12

Extends ADR-0015 from the app's behaviour to the app's build output.

## Context

ADR-0015 settled that nothing leaves the engineer's device. Preparing the first
ten-engineer trial surfaced that the decision had only ever been enforced in the
source — and the thing engineers actually load is the build output, which nobody
had looked at.

Three problems, all invisible from the repo:

**The build shipped a Supabase client.** `vite.config.js` sets
`cacheDir: './app/.vite'`, which resolves relative to the Vite root and lands at
`app/app/.vite` — inside the folder being deployed. It holds the whole bundled
`@supabase/supabase-js`. It is gitignored, so a CI checkout does not have it and
no deploy has ever published it — but a copy-everything build run from a working
tree does, and the difference between "safe" and "serving a database client from
an app whose pitch is that it has no database" was a `.gitignore` line nobody was
treating as load-bearing. The same hazard covers `app/src/`, which is *not*
gitignored: it is committed, deliberately (ADR-0015 parks it rather than deleting
it), and a copy-everything build would publish it from CI every time.

**The home-screen icon was blank.** Vite treats `<link rel="manifest">` as an
asset, hashed `manifest.json` into `assets/manifest-<hash>.json`, and the
manifest's relative `icons/icon-192.png` then resolved against `assets/`, where
no icons exist. Every engineer adding the app to their home screen — the entire
install path for a PWA — would have got a default glyph.

**The precache was partly fiction.** The service worker precached
`/style.css`, which the bundler emitted as `assets/index-<hash>.css`. The
`addAll` is wrapped in `.catch(() => {})` so that a single 404 cannot fail the
install, which meant the miss was silent and the first offline open fell back to
a cache that had never contained the stylesheet.

Underneath all three: the bundler existed to hash exactly one stylesheet, while
`app.js`, `data.cjs` and `pixel-engineer.js` were already copied verbatim and
cache-busted by hand with `?v=`. It was buying one file's worth of asset hashing
and charging three production-only failure modes for it — failures that by
definition could not appear in dev or under test, because dev and test were
loading different files from the ones engineers would load.

The app also loaded DM Sans and JetBrains Mono from `fonts.googleapis.com`. No
engineer data was in those requests, but the app announced itself to a third
party on every open, which is the first thing anyone auditing "nothing leaves the
device" would find. It was also a poor fit for the work: the app is used in
cellars and plant rooms, and a webfont that only arrives online is a dependency
on the one thing that is reliably absent.

## Decision

**1. The build is a file copy, and the list of files is an allowlist.**
`build.mjs` copies named entries from `app/` to `dist/`. Not a denylist:
`app/` contains the parked cloud layer (`src/`), the shots harness, and Vite's
dep cache, and a denylist is one missed entry away from publishing any of them.
Anything new that needs to ship gets named. A listed entry that goes missing
fails the build rather than the trial.

**2. Dev, test and production serve byte-identical files.** This is the property
worth having, and it is what the bundler cost. Nothing is rewritten between what
is tested and what an engineer loads, so `manifest.json` is at
`manifest.json`, `style.css` is at `style.css`, and the service worker's
precache list can be checked against the build — which `tests/shipped-build.test.js`
now does, along with asserting no third-party origin appears in any shipped file.

Vite remains the dev server. That part it does well.

**3. Fonts are served from the app's own origin.** DM Sans and JetBrains Mono
are vendored into `app/fonts/` and declared in `app/fonts.css`. Both are variable
fonts, so one file per subset carries every weight — four files, 104KB, precached
with the rest of the shell. The app now makes zero third-party requests, and its
typography is correct on first open with no signal.

## Consequences

Cache-busting stays manual: a change to `style.css` or `fonts.css` needs the
`?v=` in `index.html` bumped, the same discipline `app.js` has always required.
This is the real cost of the decision, and it is a known step rather than a
silent production-only difference.

Font updates are a deliberate act — re-fetching from Google and re-vendoring —
rather than something that happens by itself. For two fonts that are not going
to change, that is the right trade.

`npm test` now runs in CI before the deploy, so none of the above can regress
into a published build without the workflow failing first.
