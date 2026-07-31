# Coach only ever names work the engineer can elect to do

**Coach Insight** may name a specific job type only when that job type is one the engineer genuinely chooses to do. It may never hold up a dispatched job as a target. The **elective** set is the `sales` section of the catalogue and nothing else.

Until now the Log Job banner read `Best opportunity: Long Duration – Unvented — 5.50h`, and the deficit-recovery advice read `A Long Duration – Unvented gives you 5.50h — your highest value single job.` Both were produced by taking the highest-credit fixed job in the catalogue. LD-UNV is 330 credit minutes, several times the next entry, so it won that comparison almost by definition.

The problem is that the engineer does not choose their jobs. Dispatch allocates them. LD-UNV in particular is a narrow, uncommon job. Telling someone in deficit that their best opportunity is a 330-minute job code is not advice they can act on honestly — the only way to produce one that dispatch did not send is to raise it against work that was not that job. That is a mis-raise, and it lands on the engineer's name and the employer's audit trail, not on the app. An app that nudges toward it is a liability to the person using it, whatever the intent. The same objection applies to any dispatched code; LD-UNV merely made it unmissable.

**SGO** is the exception, and it is the exception by design. On a visit the engineer is already making, they choose whether to offer the inhibitor, the Hive, the CO alarm, the quote. That discretion is exactly what the scheme rewards, and surfacing it is advice the engineer can take without misrepresenting anything. So elective means the sales section:

- Its members are things done *in addition to* the allocated job, not *instead of* it.
- It carries no implication about which job the engineer was sent to.

**Operational credits** (Wait Work, EV charging, Bybox, merchant parts) are deliberately excluded, though they sit in the catalogue with real credit values. They record a circumstance that happened to the engineer. Nudging someone toward logging more wait time to close a gap is the same failure in a different coat.

Three consequences:

- **`getBestFixedJob()` is gone**, not merely filtered. A "highest credit job in the catalogue" helper reintroduces this bug the moment anyone calls it, and the previous partial fix — an `EXCLUDE_FROM_BEST` set naming `ld_completed` and `trace_repair` by hand — shows how it drifts: LD-UNV was simply never added to it. The replacement, `getElectiveJobForGap(gapHours)`, cannot express the old question.
- **A gap no elective job fits gets an honest answer, not the biggest available number.** Over roughly 0.6h away from any elective credit value, Coach says the gap is more than one job will close and points at the week. That is also better advice.
- **The catalogue stays the single source of truth for what exists** (ADR-0006); electability is a property of the section, derived rather than hand-listed, so a new sales row is elective automatically and a new core row is not.

`tests/coach-guardrails.test.js` asserts the policy at the point of output: it renders the real Coach surfaces with a deficit and fails if any dispatched job name appears in them.
