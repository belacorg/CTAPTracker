> **Amended by ADR-0022.** The rolling average target this describes no longer exists. The completeness rule survives it and now guards the averages the Coach reports back; the reasoning below about why an incomplete week is not a bad week still applies.

# The rolling average target only learns from weeks that hold a full record

ADR-0003 makes the **Rolling average target** the mechanism by which the model converges to reality: after four completed weeks the **CTAP target** stops using rostered × **CTAP percentage** and starts using the engineer's own recent credit, which already reflects whatever real travel and **Performance Factor** they were working under. That is still the design. What it assumed, and never checked, is that a past week holds a complete record of the work done in it.

A trial engineer in week two reported a weekly target of 2.7 hours against a real one of about 32. Two causes, both the same mistake.

**An Excluded week still set the target.** Every other consumer of past weeks skips `excludeFromCtap`; the rolling average did not. So a week the engineer had explicitly marked "ignore this, I was still working the app out" went on to set their target for the following month. Four warm-up weeks with a job or two in them put the target at 1.63h.

**A week the engineer simply stopped logging did the same.** Marking weeks Excluded is a thing an engineer has to remember to do, and the ten trial engineers are all in warm-up right now — every one of them would have hit this within four weeks. A week is now only averaged in if its credit reached at least 40% of what that week actually asked for, measured against its own rostered hours and NPT rather than a flat figure, so a short week of mostly leave is judged as the short week it was. 40% is deliberately generous: ADR-0003 wants the average to absorb travel and PF variation, which runs to tens of percent, not to ninety. A week at 60% of target is a bad week, which is data, and it stays in.

What makes this worse than an ordinary wrong number is the direction of the error. The target moved rather than the credit, so the Dashboard showed a percentage met and a bonus achieved — it reassured the engineer while they were twenty-nine hours down. A figure that can quietly redefine what success is has to be legible, so the Dashboard now always says where the target came from, either "Rolling avg · last N weeks" or "40.0h rostered × 80%". Before, that line only appeared in the rolling case, which is exactly the case where the number was hardest to question.

Alternative considered: floor the displayed target at some share of rostered × pct, catching any cause including ones not yet thought of. Rejected as the primary fix — it treats the symptom, leaves a wrong average in place to resurface elsewhere (the CTAP trend, the forecast), and picks an arbitrary number the engineer cannot reason about. The completeness rule is about data quality, which is where the fault actually is. A floor remains available if a third cause turns up.

Cost: an engineer who genuinely runs below 40% of target every week never builds a rolling average and stays on the static formula indefinitely. That is the right answer — the formula is the employer's real bar — but it means the convergence ADR-0003 promises does not arrive for them.
