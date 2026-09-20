# The Coach averages over one window

An engineer read "Monday is your strongest day" in a week whose best day was plainly Thursday.

The insight was not looking at that week at all — it is a claim about a pattern, not about the week on screen — but it was wrong on its own terms too. It averaged **every week on record**, so a Monday-heavy stretch from months earlier still outvoted the round he was actually driving. The Coach card, two inches above it, windowed to eight weeks and said Thursday. Two surfaces, one screen, opposite answers, both labelled "your strongest day".

There were two implementations because there were two callers, and they had drifted apart on every axis that mattered: window (all history against eight weeks), how many showings a day needed before it counted (two against three), and whether a day had to stand clear of the others at all (the Coach card required 15% above the overall average; the insight named a winner even when the days were within noise of each other).

`getStrongestWeekday` is now the only one, and it returns the window with the answer, so the average quoted belongs to the weeks it was measured over. The Coach card's rules won: eight weeks, three showings, 15% clear.

## One window for every average

The same fault ran through the other insights, so the window itself is now a named thing. `coachAverageWeeks(state, n)` returns the last n weeks that count, and every average the Coach reports back goes through it.

That fixed three more, each found by asking the same question of the next insight along:

**NPT** compared this week against "your recent average" while computing it over every week on record. Two heavy weeks in the spring kept the bar high enough that a bad week now read as normal.

**The bonus hit rate** counted an **Excluded week** as a miss — "hit target in 6 of the last 8" for an engineer whose other two weeks were signed-off sickness he had already set aside.

**The four-week consistency line** divided by a hard-coded 4 regardless of how many weeks it actually had.

**Excluded weeks** are dropped inside `coachAverageWeeks` rather than at each call site, because CONTEXT.md has always promised they contribute "nothing to the averages the Coach reports back" and four separate filters is four chances to forget one. `weekIsRepresentative` was missing the check its own documented definition states, which is how a sickness week the engineer had explicitly set aside still pulled their average down.

## A fourth projection

`tracking_vs_average` multiplied the daily average by every working day in the week: `(earned / worked) × working`. That counts a day the engineer worked but logged nothing as though it had been earned on.

With Tuesday blank it read *"Tracking 8.00h above your 6-week average of 32.00h"* directly beneath *"On current pace you're heading for ~32.00h"*. The same card, contradicting itself by a day's work, because one line counted the blank day and the other did not.

It takes the same worked and remaining counts as the projection beside it now — the ones ADR-0023 settled for the Week tile. Where the week is genuinely ahead the two now reconcile exactly: projection 44.00h, average 32.00h, "tracking 12.00h above".

## What this does not change

The **Week Summary**'s "Best day" is a different question — the biggest day of one specific week — and was correct throughout. It keeps its own computation and its own name, and the glossary now separates the two so the next reader does not merge them.
