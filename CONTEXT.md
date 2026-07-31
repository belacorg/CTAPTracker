# CTAP Tracker

A mobile-first PWA for gas engineers to track progress against their **CTAP** bonus scheme — logging completed jobs, accounting for non-productive time, and seeing whether they are on track to hit the weekly target.

## Language

**CTAP** (Customer Time Allocation Plan):
The employer's bonus scheme — the rules under which an engineer earns the bonus based on hours worked on jobs versus a weekly target.
_Avoid_: "bonus scheme" (unqualified), "the target" (use **CTAP target**)

**CTAP balance**:
The running ledger of hours surplus or deficit an engineer has accumulated against their **CTAP target** over time. Accumulated as `Starting balance + Σ(week credit hours − week CTAP target)` across all completed, non-**Excluded** weeks. Never resets on a calendar cadence — the balance is the engineer's standing position with the employer indefinitely. The only way it goes down is by **Cash out** (or by accumulating weekly deficits).
_Avoid_: "CTAP" (unqualified) when you mean the balance

**Starting balance**:
The engineer's CTAP position at the moment they began using CTAP Tracker — used so the app's running balance reflects reality, not zero. Positive (engineer is in surplus) or negative (engineer is in deficit and using the app to recover). Also the value the engineer manually reduces after a **Cash out** to true the app back up with their post-sale standing.

**Excluded week**:
A week marked to be ignored when computing **CTAP balance**. Used for: weeks of full sickness/absence where credit hours would be zero through no fault of the engineer; weeks during a phased return to work; and historical "warm-up" weeks added while the engineer was still figuring the app out. An **Excluded week** is still visible in history but contributes nothing to the running balance.

**Early Finish**:
An engineer finishing the working day before their scheduled shift end (an in-day partial holiday). Logged as an **NPT** entry so it reduces this week's **CTAP target** — the engineer isn't expected to produce credits during hours they weren't on the clock. *Additionally*, at the moment of logging, the engineer picks a disposition for those hours:
1. **CTAP balance** — the early-finish hours debit the engineer's **CTAP balance**.
2. **Annual leave** — the hours debit the engineer's Workday annual leave allowance. No effect on CTAP Tracker math.

Without the disposition step, Early Finish would be cost-free; the disposition is what makes the engineer genuinely "pay" for the time off.

**SGO** (Sales Growth Opportunity):
The CTAP scheme's reward for engineer sales — historically a separate cash payment, now paid as **time credits** in the same currency as ordinary jobs. A sellable item (inhibitor, Hive product, CO alarm) attracts two distinct credit components: the **SGO credit** for *selling* it, and the **Fit credit** for *fitting* it. The same engineer doing both in one visit gets the combined credit (most common — e.g. inhibitors are nearly always sold in-day on the job); when the activities are split across engineers, each gets their portion.
_Avoid_: "SGO payment" (no longer cash); "SGO bonus" (it's a CTAP credit, not a separate bonus)

**Cash out**:
Selling a positive **CTAP balance** back to the employer in exchange for enhanced pay (e.g. double time, conditional on other monthly performance metrics). After cashing out, the engineer manually reduces their **Starting balance** in the app by the number of hours sold. Not implemented in CTAP Tracker today — recorded here because the term is part of the engineer's mental model and informs how **Starting balance** behaves.

**CTAP target**:
The hours of credited work an engineer must produce in a given week to be on track for **CTAP**. Calculated from **Rostered hours**, the **CTAP percentage**, and **NPT** logged for the week.
_Avoid_: "the target", "bonus target", "weekly goal"

**Rostered hours**:
The hours an engineer is expected to be on the clock for a given week, after **Leave** and **Mentor Day** reductions are taken off. Computed from a configured base (typically 40h) per engineer, minus those reductions.
_Avoid_: "contracted hours", "base hours" (use **Rostered hours** when describing the value used in the target calculation)

**Shift**:
A per-day record of when an engineer is scheduled to work — `{start, end, lunch, leave}`. Used by the daily-target display and by **Leave** detection.
_Avoid_: "schedule", "roster" (singular; the day-level concept is a **Shift**)

**Leave**:
A whole-day flag on a **Shift** indicating the engineer was not on the roster — covers sickness, annual leave, volunteer days, and similar. Reduces **Rostered hours** by that day's shift hours. Authoritative system of record is Workday; mirrored manually into CTAP Tracker so the local math is correct.
_Avoid_: "absence" (overloaded with NPT in the UI; in the domain, **Leave** is specifically the whole-day Workday-style absence)

**Mentor Day**:
A day on which the engineer is supporting another engineer in a mentoring role. Two flavours: **Mentor Full** and **Mentor Partial**. The reductions exist because the CTAP scheme acknowledges the engineer's reduced capacity to produce credits while mentoring.
_Avoid_: "mentor support" (UI label) when you mean the domain concept

**Mentor Full**:
A full day in which the mentee takes all the jobs and the engineer is purely there to support. The engineer attracts no work and the whole day's hours are removed from **Rostered hours** (daily target = 0). Used for apprentices, new recruits, engineers with safety concerns under review, and engineers on phased return from long-term sickness.

**Mentor Partial**:
A day where a trainee is shadowing the engineer but the engineer is still taking jobs. 20% of the day's hours are removed from **Rostered hours** to cover the time spent explaining and teaching. **The 20% figure is mandated by the employer's CTAP scheme — it is not a tuneable parameter.**

**CTAP percentage**:
A user-configurable forecasting buffer (default 0.8) representing the fraction of **Rostered hours** an engineer is realistically expected to spend on credit-earning work, accounting for travel and **Performance Factor** that can't be measured precisely in real time. Exists primarily so the in-week dashboard reflects what's actually achievable rather than always reading "behind".
_Avoid_: "target percentage" alone (ambiguous with progress %), "the 80%"

**NPT** (Non-Productive Time):
Engineer-logged time on the clock that is **uncompensated** by the CTAP scheme — pure target deductions. In the current model this is **Early Finish** entries and a free-form "NPT Quick" minutes entry. Reduces **CTAP target** *after* **CTAP percentage** has been applied to **Rostered hours**.

Travel and **Performance Factor** are conceptually similar (uncompensated non-customer time) but neither is logged in this app — they're absorbed implicitly by the **Rolling average target** once enough completed weeks exist.
_Avoid_: "deductions" (legacy spec term); "non-customer time" (overloaded — that informal phrase covers both **NPT** and **Operational credits** in the engineer's mental model; pick the right one)

**Operational credits**:
Credits awarded by the CTAP scheme for necessary non-customer activities — wait time when dispatch has no job ready, EV charging, Bybox collection, merchant parts collection. Each activity has its own credit value (some fixed, some variable). Logged via tiles in the Absence tab even though they are *not* deductions — the engineer is paid for the time at the standard credit rate.
_Avoid_: "compensated NPT" (contradiction in terms — NPT is by definition uncompensated)

**Performance Factor (PF)**:
An employer-calculated daily allowance (capped at 40 minutes) that reflects work pace; the precise value is only known once **MI** lands. CTAP Tracker shows a *daily estimated* PF figure in insights so the engineer can mentally factor it into their pace, but PF never moves the target — it's absorbed implicitly by the **Rolling average target**.
_Avoid_: "PF allowance"

**MI** (Management Information):
The employer's data feed (travel, **Performance Factor**, etc.) for a given week, typically available ~10–14 days after the week ends. **Not ingested by CTAP Tracker** — MI is referenced as the *reason* past weeks need to be editable and as the *justification* for the **CTAP percentage** buffer, but its numbers never flow into the app. The **Rolling average target** is the convergence mechanism that absorbs real travel/PF over time.
_Avoid_: "the report", "business data"

**Coach Insight**:
A single observation derived from the engineer's current state — e.g. "you're on pace to clear your deficit in ~2 weeks", "NPT this week is above your recent average", "X days in a row hitting daily target". Each insight carries a **kind** (for grouping and dedupe), a priority (for ranking), a severity colour, and display text. Insights are produced as a ranked list and consumed by multiple UI surfaces (the Best Advice strip, the projection cards in the dashboard insights area). The kind enum lives in the calc module and grows as new insights are added.
_Avoid_: "tip", "advice" (used informally in the UI; the domain term is **Coach Insight**)

**Elective job**:
A job type the engineer genuinely chooses to do, on a visit they are already making — the **SGO** and in-day sales items. Contrasted with a *dispatched* job (services, repairs, first visits, Long Durations, Hive installs), which is allocated by the employer and is not the engineer's to decide. Only **Elective jobs** may be named by a **Coach Insight** as an opportunity: pointing an engineer at a dispatched code invites raising work that was not done. **Operational credits** are not elective — they record a circumstance, not a choice. See ADR-0009.
_Avoid_: "best job", "highest value job" (the framing ADR-0009 removes)

**Coach mode**:
A per-engineer toggle that controls whether **Coach Insight** surfaces are shown. Off by default. Does not affect calculation — only display.

**Rolling average target**:
Once an engineer has 4+ completed weeks of credited work, the **CTAP target** stops using the static **CTAP percentage** and instead uses a rolling average of recent weeks (scaled by current roster).
_Avoid_: "average target"

**Check-in**:
A day's turn in a coaching conversation the engineer has with themselves — one
**GROW stage** question, plus a rating against the **Week goal**. Optional
throughout. Visible only to the engineer who wrote it: no team view, no aggregate,
no export, and that is a property of the feature rather than a current limitation.
Distinct from everything else the app stores in that it records how the day
*felt*, not what was produced. See ADR-0012 and ADR-0013.
_Avoid_: "daily log" (collides with logging jobs), "survey", "review",
"assessment" (all imply an instrument administered to someone)

**GROW stage**:
Which part of the coaching arc a given day sits in — **Goal** (Mon), **Reality**
(Tue, Wed), **Options** (Thu), **Will** (Fri, held over the weekend). One stage a
day, so the arc completes across a working week and no single day takes more than
a minute. The order is load-bearing: Reality lands mid-week while there is still
week left to change it.
_Avoid_: "step" (implies a checklist), "phase"

**Week goal**:
The one process habit the engineer chooses to work on for a week — *"do my safety
checks before I start, every job"*. Set on Monday from a menu of five suggestions
or written freehand, capped at 80 characters. Deliberately **not** the **CTAP
target**: that is the employer's number and is presented as **Reality**. The
distinction is the point — a goal the engineer was handed does not produce
ownership. Lives in `checkin_goals`, never on **weeks**.
_Avoid_: "target" (reserved for **CTAP target**), "objective", "KPI"

**Factor**:
One of the five suggested habits the **Week goal** menu offers — van & tools,
safety first, process, fault-finding, customer. A starting set, not a limit; a
goal the engineer writes themselves is tagged `custom`.
_Avoid_: "metric", "KPI" (nothing here is measured against a standard)

**Goal rating**:
The engineer's own three-way end-of-day answer on their **Week goal** — *not
really* / *so-so* / *yes*. Three-way rather than binary because a forced yes/no on
a middling day gets skipped or answered dishonestly. Skippable, and un-tappable
after the fact. Averaged over a week (no=0, mid=1, yes=2) to produce the week's
dot on the trend view, so the dots track the thing the engineer chose.
_Avoid_: "score", "self-assessment"

**Reflection note**:
The short free-text answer to the day's **GROW stage** question, capped at 280
characters by the database. Questions are open and answered by the engineer; none
of them contains a suggestion, because a coach that supplies the answer produces
compliance rather than change. Framed around feeling and behaviour, never around
events — event framing invites exactly the customer and job detail the `checkins`
table deliberately has no column for.
_Avoid_: "job note" (that's the **Shift** note, a different thing entirely)

**Voice draft**:
The parsed, editable result of speaking work into the Log Job page — a list of proposed entries (job, count, and a value for variable jobs), **each tagged with the day it belongs to**, alongside any spoken fragments the parser could not match. A **Voice draft** is a proposal, not a record: it holds no place in state until the engineer confirms it, at which point it is written through the same shapes the job tiles produce. See ADR-0007.
_Avoid_: "voice entry", "voice log" (for the draft itself — the draft is what exists before confirmation)

**Day segment**:
One day's slice of a spoken transcript, produced by cutting the utterance at each day named. An engineer catching up on a Friday says the week as one sentence — *"Monday six breakdowns, Tuesday three services"* — and each segment is parsed independently, so the jobs land on the day they were said against. Both orders are understood: the day leading its work, or trailing it (*"six breakdowns on Monday"*). Naming no day, or one, produces a single segment and the original single-day behaviour. See ADR-0014.
_Avoid_: "clause" (the parser scans, it does not split on grammar)

## Relationships

- Every job type is either **Elective** or dispatched; **Coach Insight** may name only the former
- An **Engineer** has one **CTAP percentage** and one base value for **Rostered hours**
- A week is composed of seven days, each with an optional **Shift**; a **Shift** may be flagged as **Leave** or tagged as a **Mentor Day**
- **Leave** and **Mentor Day** reductions feed into the week's **Rostered hours**; **NPT** is subtracted from the target *after* **CTAP percentage** is applied
- **CTAP balance** accumulates across many weeks of progress against **CTAP target**
- A week has one **Week goal**; each **Check-in** in that week holds one **Goal rating** against it plus one **Reflection note** answering that day's **GROW stage** question
- A week's **Goal rating**s average into the single dot shown beneath the weekly credits chart
- **CTAP target** is presented to the engineer as **Reality**, never as their goal — the **Week goal** is the only thing in the app the engineer chooses for themselves
- **Coach Insight** reports figures; the **Check-in** asks questions. Neither reads the other: no **Coach Insight** touches **Check-in** data, and nothing in the app compares it between engineers

## Flagged ambiguities

- "CTAP" was used loosely to mean the scheme, the balance, and (informally) the payment. Resolved: **CTAP** = the scheme; **CTAP balance** = the running ledger; the payment itself has no canonical term yet.
- "Deductions" (from the original spec) collapses two distinct things in today's model: **NPT** (logged hours) and the **CTAP percentage** (a buffer). Use the precise term.
- "Absence" is a UI tab on the Log Job page but covers four distinct domain concepts: **Operational credits** (Wait Work, EV Charging, Bybox, Merchant Parts — *earn* credits), **NPT** (Early Finish, NPT Quick — *deduct* from target), **Mentor Day** (Full/Partial — reduces **Rostered hours**), and the *absence* of **Leave** (which is actually logged via the shift editor, not this tab). The tab name "Absence" misleadingly groups four behaviours; the domain treats each differently.
- **Early Finish** is a specialised **NPT** entry — it reduces target like other NPT, but uniquely also requires the engineer to pick a disposition (**CTAP balance** debit or Workday annual leave).
- "Non-customer time" is the employer's wording for **NPT** — same concept, but canonical term here is **NPT**.
