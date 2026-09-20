> **Amended by ADR-0022.** The buffer stands, and so does the case for it. The closing sentence is wrong: the rolling average is not the long-run fix and no longer sets the target. `pct` is the whole of the adjustment, and it is user-configurable so an engineer with an unusual travel burden can move it — visibly, rather than having the app infer it from their own results.

# CTAP percentage is a forecasting buffer, not a precision instrument

The weekly target is computed as `rostered × pct − NPT` with a default `pct` of 0.8. Read literally this double-counts: travel and Performance Factor are partly absorbed by the 80% buffer, then once those are known (via MI or via rolling-average warmth) they reduce the target again. We accept that. The buffer exists primarily so the in-week dashboard reflects what's actually achievable rather than always reading "behind" — engineers can't hit 40h of credits while spending ~8h/week on uncredited travel and PF they can't measure in real time. The Rolling average target is the long-run convergence mechanism that fixes the imprecision; `pct` is the short-run UX device.

Alternatives considered: no buffer (depressing UX, made the dashboard nearly useless during testing); `pct` only applies until first NPT is entered (complex, hard to explain); rolling-average-only with no cold-start (new starters would have no target for their first 4 weeks).
