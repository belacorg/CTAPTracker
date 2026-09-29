# Flags mark days to check, and change no numbers

Trial feedback: when something out of the ordinary happens, engineers want to mark it at the time so they can check it when the CTAP update arrives. Examples are the systems being shut down, a broken laptop, or a morning of downtime. Before this, the only place to record it was the free-text day note, and there was no way to find those days again without paging back week by week.

A **Flag** sits on a day (`week.shifts[day].flag`) or on a whole week (`week.flag`) as `{ reason, checked }`. The reason comes from a short fixed list (Systems down, Laptop / kit, Van, Downtime, Other), and the day note holds the detail. A flag is set as the day happens from Log Job, beside "Add a note", or from the day's + panel or the week header on the Shift tab. The **Flagged** button on Shift opens a month calendar of flags, amber while still to check and green once checked, with a list of everything still to check across all weeks. Tapping a flag goes to that week on Shift with the day open. Checking ticks a flag off, and it stays on record so the calendar still shows the day was dealt with. Only the ✕ removes one.

A flag changes nothing that is calculated: no target, no credit, no balance. It is a reminder to check, not a claim that the day should count differently. What the day was actually worth is decided by CTAP, and if it needs changing, Leave, NPT or Rest already do that.

Stored beside the day note, in the same shift object. "Standard week" now replaces only a day's times, where before it replaced the whole object and dropped the day note with it.

Alternatives considered: free text only, with the note acting as the flag. Rejected because a fixed reason reads at a glance in the calendar, and "to check / checked" needs a marker that a note can't carry. Also rejected: removing a flag once it has been checked, because it loses the record that the day was dealt with. Also rejected: a calendar permanently on the Shift tab, because it makes the tab longer for something opened about once a week.
