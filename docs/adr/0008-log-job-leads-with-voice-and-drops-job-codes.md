# Log Job leads with voice; the catalogue is a flat, code-free list

The Log Job page opens on a voice action, then Recent, then the whole catalogue as one scrolling list grouped by category. No job-type tab bar, no full-width date picker, no search field occupying the top of the screen.

Chosen from three prototyped variants (top-jobs-first, voice-first, category-drill-down) after field use. The page's job is to get a completed job recorded in as few taps as possible, and voice records several at once — so it earns the primary position. Everything that isn't logging a job is demoted: the day stepper is a compact control that reads "Today" almost every time, and search collapses to an icon that takes over the header only when tapped.

Two decisions inside this are worth stating separately, because they are easy to get wrong again:

**Job codes are not shown; subtitles are.** A tile reading `Gas Service (GS-HOB / GS-CKR)` spends its width on a code an engineer rarely needs, and at 393px the longer codes overflowed and clipped mid-word. But removing the subtitle along with the code is worse than either: the short names alone render five identical "Gas Service" rows and four identical "Gas Repair" rows, because those jobs differ only by appliance. The subtitle *is* the disambiguator. Codes remain searchable — typing "GS-CHB" still finds the job — they're just not on the face of the row.

**The category tab bar is gone in favour of section headers in one list.** Tabs hid three-quarters of the catalogue behind a tap and gave no sense of what existed. One list with sticky headers makes the whole catalogue scannable. The cost is real: reaching Absence means scrolling past ~43 rows. That's accepted because the two fast paths — voice and Recent — cover the common cases, and search covers the rest. If engineers report hunting for Absence entries, the fix is a jump affordance, not the return of tabs.

The Dashboard was prototyped alongside this (three variants) and deliberately left unchanged — the existing design was judged better than all three.
