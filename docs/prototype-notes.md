# Prototype — Log Job & Dashboard redesign

**Status: open — awaiting Jake's verdict.**

## The question

What should the Log Job page and Dashboard look like?

Field feedback (Jake, 2026-07-29): the Log page is "extremely busy and not very easy to follow through". Specifically — the date picker is huge at the top, the search field is huge, Recent is small, and every tile carries a job code (`GS-CHB`, `GS-HOB / GS-CKR`) plus a subtitle plus a credit figure, roughly twenty of them at once.

Screenshotting the current page confirmed it and turned up something Jake hadn't mentioned: on a 393px viewport the longer codes **overflow and clip mid-word** — `GS-HOB / GS-CKR` and `GR-FRE (linked)` are visibly cut off.

The brief: opening the page should show *job types you can tap*, with usability first. The detail must still exist somewhere, just not on the landing view.

## Shape

Three variants of each page, on the real pages with real data, switchable via `?variant=A|B|C`. Read-only — tapping a job toasts what *would* be logged and writes nothing.

`app/prototype-variants.js` — the whole thing, styles included, so deleting it is one `rm` plus the four hooks listed below.
`app/_shots.html` — screenshot harness with seeded sample data (serve `app/` statically; not part of the build).

| | Log Job | Dashboard |
|---|---|---|
| **A** | **Top jobs first** — your six most-logged as large tiles, full catalogue behind "All job types" | **One number** — week progress ring, three stat chips, everything else in accordions |
| **B** | **Voice first** — voice as the hero action, recents, then a flat scannable list | **Week shape** — earned/target bar plus a day-column strip, then days logged |
| **C** | **Categories** — four big category cards, drill in to a list; nothing else on screen | **Today first** — today's credit as the headline, week strip and balance underneath |

## What the first pass already settled

Dropping the **job code** was right — it's the noise. Dropping the **subtitle** with it was wrong: the first draft rendered five identical "Gas Service" rows and four identical "Gas Repair" rows, because the short names only differ by appliance. The subtitle *is* the disambiguator. Current rule across all variants: **subtitle stays, code goes.**

## Hooks to remove when folding the winner in

- `buildMain()` — the `__protoVariant` early return
- `buildApp()` — the `__protoSwitcher` line
- `attachListeners()` — the `__protoAttach` call
- `app/index.html` — the `prototype-variants.js` script tag
- `.github/workflows/deploy.yml` — `prototype-variants.js` in the copy step

## Verdict

_To fill in once Jake has cycled through. Expected shape of the answer: "Log A with B's voice banner", not a clean single winner._
