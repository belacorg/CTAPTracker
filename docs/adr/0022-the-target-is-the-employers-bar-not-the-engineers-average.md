# The CTAP target is the employer's bar, not the engineer's own average

Supersedes ADR-0003 on the question of what sets the **CTAP target**, and supersedes ADR-0021's choice of which figure is canonical. ADR-0003's account of **MI** — that it is referenced and never ingested — still stands.

ADR-0003 made the target converge on the mean of the engineer's recent credit hours, reasoning that past credit already reflects the real travel and **Performance Factor** the app cannot see, so the average absorbs MI without ingesting it. The premise is true and the conclusion does not follow. Past credit reflects travel and PF *and* the engineer's performance, inseparably. Calibrating the bar from the outcome calibrates away the signal.

The consequence is not subtle. An engineer earning 25h against a 32h bar, every week:

| | week 1–4 | week 5 | week 12 |
|---|---|---|---|
| rolling target | 32.00 | 25.00 | 25.00 |
| balance | −28.00 | −28.00 | −28.00 |
| verdict | missed | **bonus met** | **bonus met** |

The true balance at week 12 is −84h. From week five the app congratulated someone who was sinking seven hours a week and froze their ledger. A bar computed from what you achieved is a bar you meet by construction, so "hit target" becomes roughly a coin flip for everyone regardless of how they are doing, and the **CTAP balance** — which CONTEXT defines as "the engineer's standing position with the employer" — stops matching the employer's ledger.

This is ADR-0020's failure in a subtler form and in the same direction: the target moving instead of the credit, so the error reads as praise. ADR-0020 was written the same day and the same mistake was made again four hours later, which is worth recording as a pattern rather than an accident. The tell in both cases is a target that is derived from the thing it is supposed to judge.

`weekTargetHours(state, weekKey)` is the single answer, and it is `rostered × pct − NPT`. Every screen, the balance and the bonus read it. `effectiveTargetHours` and `rollingAvgInfo` are deleted rather than left unused: a second function that computes a different target is precisely the trap that produced the cross-screen disagreement ADR-0021 was written to fix.

What ADR-0001 argued for survives intact. `pct` is still a forecasting buffer that exists so the in-week dashboard reflects what is achievable rather than always reading "behind"; it is user-configurable, and an engineer whose real travel burden differs can move it. That is the honest place for that adjustment — a number the engineer sets and can see, rather than one the app infers from their own results and never shows them.

The rolling average survives as information. The Coach reports "tracking 2.10h below your 8-week average of 29.40h", which is a useful thing to know and makes no claim to be a threshold. **Representative week** (ADR-0020) now guards that average instead of the target: an average that includes half-logged weeks reports a dip the engineer never had, in the direction that worries someone doing fine.

Timing: this lands the day before the trial opens, so no engineer has a completed week or a banked balance. It also means the rolling target, which needed four representative weeks, was never reachable by any of them — the defect was live for about four hours and only in the repository.
