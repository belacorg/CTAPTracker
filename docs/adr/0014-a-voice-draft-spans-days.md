# ADR-0014: A voice draft spans days

## Status

Accepted — 2026-07-31. Extends ADR-0007 (a voice log is a draft, never a write)
and ADR-0008 (Log Job leads with voice); neither is changed.

## Context

`parseVoiceLog` found the first day named in a transcript and hung the entire
utterance off it. That is right for the case it was built for — *"yesterday I did
four services"* — and wrong for the way an engineer actually catches up.

Jake, testing it: *"could we get them added into the days that have been said by
the engineer, or would it have to be each day specifically?"* His example was a
week read back in one breath:

> Monday six breakdowns, two services. Tuesday three breakdowns, one boiler lead.
> Thursday two breakdowns.

Under the old parser that produced nineteen jobs, all on the Monday — silently,
because the draft only ever showed one day and the engineer had no reason to
suspect the Tuesday work had gone anywhere else.

This matters more than a convenience. The reason voice exists (ADR-0008) is that
an engineer does not stop between jobs to tap tiles; the logging happens later,
often at the end of the week, in one sitting. A tool built for that sitting has
to accept the sentence people actually say in it.

## Decision

Cut the transcript into one **day segment** per day named, and parse each segment
on its own.

**The parse core is untouched.** `parseVoiceBody` is the old body-parsing code
lifted out whole, still knowing nothing about dates. Every alias, quantity,
duration and merge rule behaves exactly as before — it is simply run once per
segment instead of once per utterance. All 99 existing voice tests passed
unchanged through this refactor, which is the evidence that the change is
additive rather than a rewrite.

**Both spoken orders are understood.** Two ways an engineer says this, needing
opposite splits:

- day-leading — *"Monday six breakdowns, Tuesday three services"*
- day-trailing — *"six breakdowns on Monday, three services on Tuesday"*

Jobs appearing **before the first day named** is the tell for the trailing form;
in the leading form there is nothing there but "right so" and "I did". One rule,
checked once, no guessing per segment.

**Naming one day, or none, is exactly the old behaviour.** A single day still
claims the whole utterance wherever in the sentence it was said. This is not a
special case bolted on for compatibility — it is genuinely the right reading, and
it means the change cannot regress the flow that already worked.

**Each item carries its own `dayKey`, and the item list stays flat.** The draft
gained a per-item day rather than a nested day→items structure, so every existing
per-row control — quantity stepper, job re-select, duration input, remove —
addresses the same flat index it always did and needed no change at all.

**The draft shows one block per day.** A confirm step is only worth having if
what it shows can be checked (ADR-0007). Nineteen jobs in a flat list with no day
visible is not checkable, so each day gets its own header, its own subtotal, and
its own ‹ › stepper to correct a misheard day without disturbing the rest of the
week.

## Consequences

- Repeats merge **within** a day and never across one. Monday's services and
  Tuesday's stay separate rows, because they are separate entries the engineer
  may want to correct separately.
- A day named twice — *"Monday two services… and also on Monday a breakdown"* —
  folds back into one segment before parsing, so it reads as one day said twice
  rather than two days.
- Stepping a group onto a day already in the draft is refused rather than merged.
  Silently combining two groups would destroy the split the engineer just
  confirmed, and there is no undo on a voice write.
- A week read back on a Monday can straddle two CTAP weeks, so the commit
  collects the weeks it touched and syncs each. Previously there was only ever
  one.
- The confirm line reads "16 entries · 4 days", and the toast says "across 4
  days". The spread is visible before the write and stated after it — the failure
  this ADR fixes was silent, and the fix should not be.
- **Mixed ordering in one utterance is not handled.** *"Six breakdowns on Monday,
  then Tuesday I did three services"* switches style mid-sentence; the leading
  fragment wins and the whole thing is read as day-trailing. Detecting per
  segment would be guessing at a fragment far too small to guess from, and the
  draft is editable, so the engineer sees it and fixes it. Worth revisiting only
  if it turns out to be common.
- The day is still resolved as the most recent occurrence on or before today, so
  a week read back on Friday covers that Monday to Friday. Reading back a week
  more than seven days old is not expressible by weekday name.

## Alternatives considered

**One day per dictation, prompting for the next.** "Now say Tuesday." Rejected:
it turns one sentence into five round trips, each with a listening timeout, which
is worse than the tile flow it exists to replace.

**Splitting on sentence or clause boundaries.** Rejected. Speech recognition
punctuation is unreliable and engineers do not speak in sentences; the parser is
deliberately a scan rather than a grammar (ADR-0007's lineage). Day names are the
only reliable boundary in this domain, and they are exactly the boundary that
matters.
