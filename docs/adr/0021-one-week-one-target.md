# One week has one target

The **CTAP target** was computed two different ways depending on which screen asked. The Dashboard's live week tile used the **Rolling average target**; History, the **CTAP balance**, `bonusAchieved`, the CTAP trend chart and the Coach lines used the bare `rostered × pct − NPT` formula. The Weekly Forecast sheet had the disagreement written into it as a branch: `isPastWeek ? adjustedTargetHours(...) : _eff.hours`.

So a week silently changed what it had been asking for at the moment it stopped being the current week. On realistic figures — a 30h rolling average against a 32h formula — a week where the engineer earned 31h read *below target* on the Sunday and *Bonus ✓* on the Monday, off the same stored jobs. Nothing had changed but the question.

The rolling average is the canonical figure and the formula is the cold start, not the other way round. ADR-0001 says so directly: "`pct` is the short-run UX device. The Rolling average target is the long-run convergence mechanism that fixes the imprecision." ADR-0003 makes the rolling average how the model absorbs real travel and **Performance Factor** without ingesting **MI**. A balance struck against the formula is struck against the number both ADRs call the imprecise one.

`weekTargetHours(state, weekKey)` is now the only way to ask. It is a function of the stored weeks and the week key alone — not of what today is — so the answer cannot depend on when it was asked. `bonusAchieved` takes a week key rather than a week object, because it needs to know *which* week to judge, not just its contents.

Daily targets ride the same adjustment. `adjustedDailyTargetHours` scales by the ratio the rolling average moves the week by, so the days still sum to the week. Without that the Dashboard's "still needed today" and its weekly target disagree by exactly the size of the rolling adjustment — the same class of bug as the one already recorded in that function's comment, where the Dashboard said 2.05h still needed and the Forecast sheet said 3.65h.

Completeness is still judged against the static formula (see **Representative week**, ADR-0020) and must stay that way: judging a week's completeness against a rolling average that is itself computed from complete weeks would be circular.

Alternative considered: make the formula canonical everywhere and demote the rolling average to a live pacing aid shown under a different label. Cheaper, and it touches nobody's balance. Rejected: it contradicts both ADR-0001 and ADR-0003, and it would mean the app's headline figure was the one its own design notes call a buffer.

Timing: this lands the day before the trial opens, when no engineer has a completed week and therefore no banked **CTAP balance** — `cumulativeBalance` only counts weeks before the current one. The same change a month later would have moved every engineer's balance under them.
