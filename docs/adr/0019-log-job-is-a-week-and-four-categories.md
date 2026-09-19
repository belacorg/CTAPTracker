# Log Job is one week and four categories, not a rolling strip and one long list

The first ten trial engineers reported the same thing within a day: Log Job is confusing on arrival. Four separate causes, one screen.

**The strip showed the wrong week.** It was a rolling seven days ending today, so it started on a different weekday every day — an engineer opening it on a Friday read "Sa Su M T W T Today" and could not tell where their week began. Everything else in the app counts Monday to Sunday, because that is the week the **CTAP target** and the **CTAP balance** are measured over. The strip now shows that week, and stepping back a week reaches a finished one. The rolling window was chosen so that a Monday would still show the weekend behind it; a `‹` reaches the whole of it now, rather than the window happening to still cover two days of it.

**The catalogue was one flat scroll of 51 jobs.** Gas, Hive, SGO and Absence were sticky headers in a single list, so reaching Absence meant scrolling past the other 43 and losing your place. They are now four tiles, each opening its category over the whole screen. Gas alone is 20 jobs and wants the room. Most used stays above the tiles, unchanged: it is what the engineer taps most days, and it was never the part that needed scrolling.

**Tapping a job told you almost nothing.** Logging deliberately skipped the re-render on this tab, because a re-render scrolled the engineer back to the top of the catalogue mid-tap. What they got instead was a flash of colour and a toast: no way to tell whether the tap landed, what it landed as, or which day it went to. The day's entries now sit under the strip, and logging re-renders and puts the scroll back where it was. An entry shows the same short name the row carried, so the confirmation reads as the button that was pressed.

**Nothing said which day was being logged into, once you were inside a category.** A category screen carries the day at the top, and tapping it comes back out to the strip.

Alternative considered for the catalogue: collapsible drop-downs in place, so everything stays on one screen with no navigation. Rejected — the expanded list gets the room left over rather than the room it needs, and 20 gas jobs under three collapsed bars is still a scroll inside a scroll.

Cost: logging now re-renders on every tap, where before it did not. The scroll is restored by hand around the render, which is a thing to keep working; the test for it is that a job logged from inside a category leaves you in that category.
