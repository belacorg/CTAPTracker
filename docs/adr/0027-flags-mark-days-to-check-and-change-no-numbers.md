# Flags mark days to check, and change no numbers

Trial feedback: engineers want to be reminded to double-check a day when the CTAP update comes in, and to find that day again easily. Before this, the only place to record it was the free-text day note, and there was no way to find those days again without paging back week by week.

A **Flag** sits on a day (`week.shifts[day].flag`) or on a whole week (`week.flag`) as `{ checked }`. One tap sets it: **⚑ Flag** on Log Job, beside "+ Add a note", or in a day's + panel on the Shift tab, or **⚑ Flag this week** on Shift. No reason is asked for. If the engineer wants to say why, that is what the day note is for. The **Flagged** button on Shift opens a month calendar of flags, amber while still to check and green once checked, with a list of everything still to check across all weeks (with each day's note). Tapping a flag goes to that week on Shift with the day open. Checking ticks a flag off, and it stays on record so the calendar still shows the day was dealt with. Only the ✕ removes one.

A flag changes nothing that is calculated: no target, no credit, no balance. It is a reminder to check, not a claim that the day should count differently. What the day was worth is decided by CTAP, and if it needs changing, Leave, NPT or Rest already do that.

Stored beside the day note, in the same shift object. "Standard week" now replaces only a day's times, where before it replaced the whole object and dropped the day note with it.

Alternatives considered: a short list of reasons (systems down, laptop, van…). Built first, then taken out on Jake's call. The app shouldn't suggest what a flag is for, and the note already says why. Also rejected: removing a flag once it has been checked, because it loses the record that the day was dealt with. Also rejected: a calendar permanently on the Shift tab, because it makes the tab longer for something opened about once a week.
