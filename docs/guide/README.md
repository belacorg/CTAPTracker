# CTAP Tracker — Visual Guide

A personal tool for Service & Repair Engineers to track the hours that count
toward their CTAP bonus, see where they stand in real time, and understand
what a positive balance is actually worth in their pocket.

> *Personal estimates only — verify against official systems. Not affiliated
> with Centrica plc, British Gas, or any employer.*

---

## Why this exists

The CTAP bonus scheme is real money on the table for engineers, but the way
it's surfaced through company tools is slow, retrospective, and hard to plan
around. By the time you find out a week is short, you can't do anything about
it. By the time you find out you're owed a payout, you're guessing how much
after tax.

CTAP Tracker fixes both:

1. **Live pace tracking** — see *today* whether you're on pace for this week,
   not next month when payroll catches up.
2. **Real take-home view** — see what your banked CTAP is actually worth
   after your personal multiplier and tax band, so the bonus becomes a real
   number instead of an abstract one.

Built by an engineer who got tired of finding out the bonus too late.

---

## Getting started

![Sign-in / onboarding](screenshots/onboarding.png)

The app works **locally first** — open it, start logging jobs, no signup
required. Sign in (Settings → Create Account) only if you want your data
synced across devices (phone + tablet, or replacing a phone).

**Why local-first?** Most engineers will use this on one phone. Forcing a
signup before the app does anything useful is friction nobody needs. Sync is
opt-in for the people who want it.

When signed in, data lives in a personal Supabase account hosted in the EU.
Nothing is shared with anyone.

---

## The Schedule tab

![Schedule tab](screenshots/schedule.png)

This is where you set up your working week — start time, end time, lunch,
and any annual leave.

### Key actions

- **Tap a time** to edit. Saves automatically.
- **"Standard week"** button applies Mon–Fri 08:00–16:30 with your default
  lunch. One tap if your week is normal.
- **"Leave"** chip per day toggles annual leave. That day drops out of your
  weekly target — important because you don't get penalised for being off.
- **Default lunch** chip at the bottom controls how many minutes are
  deducted from each day's target by default.
- **Note button (+)** at the end of each day-row opens a small notes
  textarea. Fills with a dot (●) once a note exists, so days with context
  are easy to scan.

### Why daily notes (not weekly)?

Originally there was a single week-level note field. In practice almost
everything worth recording was about *one specific day* — traffic, customer
no-show, training, van in for service. So the week note was replaced with
per-day notes. They also surface read-only in the Weekly Forecast day-detail
panel, so when you (or a manager) reviews a past day, the context sits right
next to the numbers.

---

## The Log Job tab

![Log Job tab](screenshots/log-job.png)

Categories: **Core**, **Hive**, **Sales**, **Absence**. Each contains tiles
for the jobs you'd actually log.

### Key actions

- **Tap a solid tile** to log instantly at the standard credit time.
- **Tap a dashed tile** for variable jobs — it'll prompt for the extra input
  (e.g. minutes spent, units fitted) and calculate credit from that.
- **Day picker** at the top lets you log against past days if you forgot to
  enter something at the time.

### Why category tiles instead of a typed list?

Engineers don't have time to type a job name on a phone keyboard between
appointments. Tiles are one-tap. The most common jobs sit at the top of each
category so the muscle memory builds fast.

---

## The Dashboard

The dashboard is where you live day-to-day. It has four pieces stacked:
**JOB CREDITS** hero, **CTAP** balance tile, **Week** tile, **Today's Jobs**.

### JOB CREDITS tile

![JOB CREDITS hero](screenshots/job-credits-hero.png)

Three numbers across the top:

- **EARNED TODAY** — credit hours logged so far today
- **STILL NEEDED** — what you need before you hit today's daily target
- **WEEK GAP** — what the week as a whole still owes you

Below them is a **today progress bar**. It fills as you log jobs and turns
green when you've hit today's target.

#### Why the bar tracks today, not the week

The Week tile already shows weekly progress (the % badge). Putting a
*second* weekly indicator on the hero card was redundant. The hero card is
about *now* — what you've earned today, what you still need today. The bar
mirrors that intent.

### CTAP balance tile (tappable)

![CTAP tile](screenshots/ctap-tile.png)

Your running credit or deficit, in hours. Green = in credit, red = in
deficit. Starts from your starting balance (set once in Settings) and
adjusts as completed weeks land.

**Tap the tile** to open the Cash-Out sheet.

### CTAP Cash-Out sheet

![Cash-out sheet](screenshots/cashout-sheet.png)

This is the headline feature. Pick your multiplier and tax band; see what
your current banked balance is actually worth after deductions.

- **Multiplier**: 0×, 0.8×, 1.4×, 2× — pick yours. The multiplier is on top
  of the base hourly rate (£19.39 for a Service & Repair Engineer).
- **Tax band**:
  - **Gross** — no deductions
  - **Basic** (28%) — 20% income tax + 8% NI
  - **Higher** (42%) — 40% income tax + 2% NI

The result card shows gross, take-home (large, in green), and the breakdown
line so you can see how the number was built.

#### Why no negative cash-out

If your balance is in deficit, the sheet shows £0 and a small note. You
can't cash out a deficit — you just can't withdraw — so showing a negative
£ figure would be misleading. When you go into credit, the cash-out becomes
live.

### Week tile (tappable)

![Week tile](screenshots/week-tile.png)

The week at a glance:

- **% badge** — % of weekly target earned.
- **Actual / Projected** toggle — flips the headline hours figure between
  what's actually banked and what you're on pace to finish at.
- **Daily bar chart** — quick visual of each weekday's earnings.
- **Tap the tile** to open the Weekly Forecast sheet.

#### Why the % colour is pace-aware

The % badge isn't coloured by absolute threshold (e.g. "green ≥90%"). For
the current week, it's coloured by *pace*: are you at or ahead of where you
should be by today?

Concrete example: it's Tuesday morning. Only Monday is done, so you should
be roughly 20% through the week. If you're at 23%, that's slightly ahead of
pace — the badge is green. Telling an engineer they're "amber" at 23% on a
Tuesday would be nonsense; they're actually doing fine.

Past and future weeks fall back to absolute thresholds since pace doesn't
apply to them.

### Weekly Forecast sheet

![Forecast sheet](screenshots/forecast-sheet.png)

Opens from the Week tile. Full-screen, swipe-down to dismiss.

- **Day strip** across the top — tap any weekday for that day's detail.
- **Day detail panel** — jobs logged, credit totals, day note (read-only,
  set on the Schedule tab), and an Edit Times button if you need to fix a
  timestamp.
- **Projected finish** — if you've worked at least one day, shows where the
  week will land at your current daily average.

### Today's Jobs

![Today's Jobs](screenshots/todays-jobs.png)

Collapsible list of every job, deduction, and mentor flag for today, with a
running total. Tap the ✕ on any line to remove it.

The **"+ Add a job"** button sits at the bottom of this section *whether or
not* anything's been logged. One tap to jump to the Log Job tab.

#### Why the button is always there

Originally the empty state had a "tap to log one" button, but once you had a
job logged the button vanished and adding a second one meant tabbing to Log
Job manually. It was friction. Keeping the button always-visible at the
bottom mirrors how chat apps put "compose" persistently in view — the most
common next action is always one tap away.

---

## The History tab

![History tab](screenshots/history.png)

Every past week with a colour-coded dot (green = bonus hit, amber = on
track, red = below).

### Key actions

- **Tap a week** to jump into it (view its dashboard, log jobs into it).
- **"✓ In CTAP" chip** toggles whether a week counts toward your running
  balance. Tap to exclude.

#### Why you can exclude weeks

Real life happens. You might have a week with a freak data issue, a long
sickness absence, or a week you logged into the wrong app — leaving them in
the running balance would skew your view of how you're actually doing. The
toggle lets you flag those weeks as anomalies without deleting the data.

---

## Settings

![Settings tab](screenshots/settings.png)

### Appearance

- **Theme**: Dark or Light. Saved per-device.
- **Coach Mode (BETA)**: opt-in personalised tips, surfaced in a bordered
  card on the dashboard. Off by default — some people find tips helpful,
  others find them noisy.

### Targets

- **Weekly hours target** — your roster's base hours (default 40).
- **Target %** — what % of rostered hours you're aiming to credit (default
  80%). Tap the **i** for the rationale.
- **Starting CTAP balance** — set this once when you first install. It's
  your banked balance carried in from before you started using the app.

### Help

- **How to use this app** — quick steps, in-app.

### About

- **Version** + sync status.
- **Legal & data** — disclaimer, employer separation, data storage and
  retention.
- **Built by** — Jake Rainford, Service & Repair Engineer.
- **Questions or feedback?** — reach out on Teams.

### Account (signed in only)

- **Sign out** — keeps your data on the server but logs you out locally.
- **Delete account & data** — wipes every row of your data (jobs, weeks,
  shifts, profile) from the server and signs you out. Two-step: tap
  Delete → type DELETE → confirm. The sign-in record itself is removed
  manually within 24h until an automated cleanup function is deployed.

---

## Data & privacy

- **Local-first**: the app works fully without an account. Data lives in
  your browser's local storage.
- **Sync (optional)**: signing in syncs to a personal account on Supabase
  (EU region).
- **No third parties**: nothing is shared with analytics, ads, employer
  systems, or anyone else.
- **Right to delete**: built into Settings (see above). No emails required.

---

## What's not in scope

- ❌ Not a payslip. Numbers are personal estimates.
- ❌ Not connected to any employer system. You log what you did.
- ❌ Not affiliated with Centrica, British Gas, or any employer. Personal
  tool.

---

## Tech stack (one-liner)

Vanilla JS PWA, Vite build, deployed to GitHub Pages, Supabase for auth and
sync. ~220KB JS, ~60KB CSS, offline-capable via service worker. Tests run
on Vitest.

---

*Screenshot placeholders use the filenames in `docs/guide/screenshots/`.
Once those are dropped in, the guide renders inline on GitHub.*
