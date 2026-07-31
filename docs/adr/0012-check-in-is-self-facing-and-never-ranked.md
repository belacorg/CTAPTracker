# ADR-0012: The check-in is self-facing, never ranked, and draws no conclusions

## Status

Accepted — 2026-07-31

## Context

CTAP Tracker measures one thing: credit hours against a **CTAP target**. That's
the number the employer pays on, and it's the number the app has always shown.

But the credits are a *result*. What actually moves them is process habits — the
van being organised so you aren't hunting for a fitting, doing the safety checks
before you start rather than doubling back, having a fault-finding method you
trust, not over-explaining yourself to a customer for twenty minutes. An engineer
who can see which of their own habits track with their good weeks can act on it.
An engineer who only sees the credit number can only try harder.

So: a daily **Check-in**, and a trend view that puts self-ratings next to
credits.

The obvious failure mode is that this becomes a performance-management tool.
Habit ratings on an engineer, stored against their name, sitting in the same
database as their bonus performance, is one product decision away from a
dashboard a team leader opens on a Monday morning. At that point the ratings stop
being honest — nobody logs "not really" on safety checks to a screen their
manager reads — and the feature is worse than not having built it, because it
looks like data while being fiction.

The self-monitoring literature is consistent on this: self-tracking changes
behaviour when it is voluntary, private, and self-referential. The same data
collected *about* someone rather than *by* them changes what gets recorded, not
what gets done.

## Decision

Five constraints, in force for anything that touches this feature.

**1. Companion, not surveillance.** A check-in is visible only to the engineer
who wrote it. One RLS policy on `checkins`, owner-only, for all operations. No
service-role view, no aggregate, no export. This is why the constraint is an ADR
and not a comment: the schema change that would break it is three lines and looks
harmless in review.

**2. Self-comparison, never ranking.** Every trend surface compares the engineer
to their own past weeks. No leaderboard, no team average, no percentile, nowhere
in the feature.

**3. Short and consistent beats deep and rare.** Two factor ratings and one
reflection prompt per day, rotated so the five factors are all covered across any
five consecutive days. Rotation is derived from the date, so re-opening the sheet
never reshuffles the questions under someone mid-answer. Nothing is required —
any field can be blank and still save.

**4. Surface patterns, never state conclusions.** The trend view shows weekly
credits and weekly self-rating dots side by side and stops. No correlation text,
no "the weeks you rated process higher earned more". The app does not have enough
information to make that claim honestly, and an engineer who reaches it
themselves will believe it and act on it — which is the entire point. Coach
Insights, likewise, never read check-in data.

**5. GDPR by design, not by policy.** The `checkins` table has no column for a
customer name, address, or job reference — a deliberate omission, so the data has
nowhere to land even if the UI is bypassed. The note is capped at 280 characters
by a CHECK constraint, short enough that an incident report won't fit.

## Consequences

- The rating scale is three-way (`no` / `mid` / `yes`), never binary. A forced
  yes/no on a middling day gets skipped or answered dishonestly, and either way
  the data is worse.
- A week with no check-ins shows a hollow dot, not a red one. Silence is not a
  bad score, and rendering it as one punishes a week off.
- The reflection prompts are phrased around feeling and behaviour ("did any job
  feel rushed today?"), never around events ("which job overran?"). Event framing
  invites the exact job detail the schema refuses to store.
- The note field carries a live warning when it looks like it contains a
  postcode, address, phone number, or long reference. It is advisory and does not
  block saving: any regex is bypassable, the schema is the real enforcement, and
  a save button that refuses to save would kill a sub-minute daily habit.
- The engineer can turn the whole feature off in Settings, which removes both the
  daily card and the trend dots. A diary you cannot decline is not a diary.
- Check-ins are unavailable offline, for the same reason job logging is: they
  sync per-day to their own table, so an offline write would be discarded by the
  next successful load. Rather than open a second silent data-loss path, the card
  is hidden while offline.
- The trend dots sit under the existing WEEKLY TREND bar chart in History rather
  than in a second chart of the same credits. One set of columns, two rows of
  marks — the juxtaposition is the feature.

## Alternatives considered

**A team-visible version, with engineer opt-in.** Rejected. Opt-in to being
observed by your manager is not meaningfully optional, and the moment one
engineer opts in, declining becomes a signal. Constraint 1 is not a default
setting; it is what the feature is.

**Generated insight text on the trend view** ("your strongest weeks were weeks
you rated fault-finding highly"). Rejected under constraint 4. With a handful of
weeks and two ratings a day this is noise dressed as a finding, and a confident
wrong conclusion from the app is worse than no conclusion — the engineer would
change their behaviour on it.

**Free-text with no length cap.** Rejected. The cap is not a storage concern; it
is the difference between "felt rushed all afternoon" and a write-up of a job.
