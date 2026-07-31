# The Log Job day picker is a strip of the last seven days, not a stepper

Log Job picks its day from a seven-cell strip showing the last week ending today, each cell carrying what is already logged on that day. It replaces the `‹ Today ›` stepper.

The stepper's problem was that it showed one day at a time and every day looked identical until you landed on it. The screen it produced was the same whichever day you were on, so the control gave no reason to press it — and the one task it existed for, finding the day you forgot to log, meant walking backwards through days blind, checking each. The information needed to make the decision was on the other side of the decision.

The strip puts that information in front of the choice. Each cell shows the day's credit hours and a mark: filled where something is logged, hollow where the day was rostered and nothing is on it, faint where the engineer wasn't rostered at all. A missed day is then visible rather than searched for, and reaching it is one tap rather than several. The hollow/faint distinction is the point of the mark — an empty rostered day is a gap worth chasing, a day off is not, and they carry identical zero hours.

Two consequences:

- **The window rolls from today rather than snapping to the current week.** A Mon–Sun view would put Monday at the left edge and hide the whole weekend behind a week change, which is precisely the morning an engineer is most likely to be catching up. Rolling means yesterday is always on the strip.
- **Every day in the window is selectable, with no floor at the first tracked week.** An earlier draft locked days preceding the engineer's first week, reasoning that logging into them would double-count history the **Starting balance** already represents. That floor was wrong: **Voice draft** backdating resolves "last Tuesday" and writes to it with no such check, so the two entry points would have disagreed about which days exist. ADR-0007 requires them to be the same model reached two ways. The seven-day window is the only bound, and it applies to both.

`getLogDayStrip(state, n, todayKey)` takes its reference day as an argument rather than reading the clock, so the week-boundary behaviour is testable without freezing time.
