# Screenshots

**These are generated, not taken by hand.** Regenerate them rather than
replacing them one at a time — that is how the old set ended up showing a
sign-in screen months after sign-in was removed.

```bash
npm run dev                                  # in another terminal
npm i --no-save puppeteer-core
node tools/shoot-guide-screenshots.mjs docs/guide/screenshots
```

`puppeteer-core` is installed `--no-save` deliberately: the app must not carry
a browser dependency in order to photograph itself, and `tools/` sits outside
the `SHIP` allowlist in `build.mjs`, so none of it reaches an engineer's phone.
It needs a Chrome on disk — set `CHROME_PATH`, or put the binary's path in
`tools/chrome-path.txt`.

**The phone's clock is pinned** to Saturday 12 September 2026, 20:30 — the
moment the published set was first shot. A run on any other day would move
"today" on every screen and pull the figures quoted in this guide, the demo
page and the deck out of step with the images. Set `SHOOT_AT` (a local ISO
time, e.g. `SHOOT_AT=2026-09-10T11:00:00`) only when the whole set, and the
prose that quotes it, is being moved on together.

## What gets shot

Everything runs against `tools/demo-state.json`: six completed weeks, a week in
progress, a +14.50h starting balance and a check-in streak, on an iPhone
viewport at 3x DPR.

| File                    | What it shows                                          |
|-------------------------|--------------------------------------------------------|
| `setup-card.png`        | A **fresh** phone — the "Set up · 3 left" card          |
| `dashboard.png`         | The whole Dashboard in one shot                        |
| `job-credits-hero.png`  | JOB CREDITS hero — earned / still needed / week gap     |
| `ctap-tile.png`         | CTAP balance tile                                       |
| `week-tile.png`         | Week tile — % badge, hours, day bars                    |
| `cashout-sheet.png`     | Cash-out sheet, multiplier and tax band selected        |
| `forecast-sheet.png`    | Weekly Forecast sheet                                   |
| `todays-jobs.png`       | Today's Jobs, expanded                                  |
| `coach-card.png`        | The Coach card                                          |
| `checkin-card.png`      | The day's check-in prompt                               |
| `log-job.png`           | Log Job — recent tiles and the catalogue                |
| `voice-prompt.png`      | "Say what you've done" bar                              |
| `schedule.png`          | Schedule tab, a week filled in                          |
| `history.png`           | History — weekly trend and past weeks                   |
| `settings.png`          | Settings                                                |

## Two things the script handles that a manual shot gets wrong

- **The greeting types itself in**, then rolls three dots. Capture it early and
  you get "Good evenin". The script waits for it to settle.
- **The setup card only exists before the app has been used**, so it is shot
  last, against a deliberately empty phone.

## If you'd rather use real phone shots

Drop them in with these filenames and they'll render in the guide instead.
iPhone screenshots come out at 1290×2796, which is fine as-is. PNG only —
GitHub won't render HEIC.
