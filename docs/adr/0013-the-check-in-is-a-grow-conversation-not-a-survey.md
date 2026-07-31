# ADR-0013: The check-in is a GROW conversation, not a survey

## Status

Accepted — 2026-07-31. Revises the *mechanism* of ADR-0012; every constraint in
ADR-0012 stands unchanged.

## Context

ADR-0012 shipped a daily check-in: two rotating factor ratings and one rotating
reflection prompt. Jake used it for a day and named the problem — the questions
were "too specific and generic". Both at once, and both true. Specific, because
five fixed habits is a checklist someone else wrote. Generic, because the same
checklist would suit any engineer in the country, which means it is about nobody
in particular.

Looking at the code with that in mind, the deeper problem is that neither Coach
nor the check-in was doing any coaching.

**Coach tells.** Every insight in `getCoachInsights` is declarative: "Daily target
hit", "0.42h to go today", "NPT has cost you 1.2h — that's 34% of your daily
target". Accurate, useful, and not coaching. It is a dashboard with a friendly
voice.

**The check-in surveyed.** A fixed instrument, administered daily, that the
engineer fills in. Also not coaching. It collects self-report data.

What the coaching literature actually supports is narrower and more specific than
"be encouraging":

- Coaching produces measurable effects on performance and goal attainment, and
  the dominant technique structure across the field is **question-led
  conversation** — the coach asks, the person answers. The effect comes from the
  person doing the thinking. A coach who supplies the answer produces compliance,
  and compliance does not survive the coach leaving the room.
- **GROW** (Goal, Reality, Options, Will) is the most widely used structure for
  that conversation, and it is an *arc*, not a questionnaire. Its order matters:
  you establish what someone wants before you look at where they are, and you
  look at where they are before generating options.
- **Self-Determination Theory** identifies what makes the resulting motivation
  persist rather than fade: **autonomy** (the goal is genuinely yours),
  **competence** (you can see yourself getting better at it), and **relatedness**
  (you are not doing it alone).

The app is unusually well placed for one stage of this. It already owns
**Reality** — credits, target, gap, job count, NPT. It never has to ask "how did
the week go?", which is the question people answer least honestly.

## Decision

The check-in becomes a GROW conversation spread across the working week, anchored
to a goal the engineer sets themselves.

**One stage a day, Monday to Friday.**

| Day     | Stage   | What it asks                                          |
|---------|---------|-------------------------------------------------------|
| Mon     | Goal    | What do you want to be different about this week?     |
| Tue     | Reality | What's getting in the way of that so far?             |
| Wed     | Reality | When it did go well today, what were you doing?       |
| Thu     | Options | What could you try tomorrow?                          |
| Fri     | Will    | What will you actually do next week?                  |

The weekend holds on Will rather than starting something new, so a Friday the
engineer worked through can still be closed on Sunday night.

**The goal is the engineer's, and the CTAP target is Reality.** This is the
central move. The CTAP target is not a goal in the GROW sense — it is a fact of
the job, handed down, and no amount of framing makes it autonomously chosen. So
it is presented as Reality, alongside the credits and the job count. The Goal is
a *process* goal the engineer picks: "do my safety checks before I start, every
job". Five suggestions are offered and a blank line beneath them, because a menu
of five is a starting set, not the boundary of what someone may work on.

**The daily rating follows the goal.** Instead of rating five fixed factors on
rotation, the engineer rates the one thing they chose. This is where competence
comes from: the trend dots now show movement on the thing you decided to work on,
rather than a score on someone else's checklist.

**Reality is stated, never interpreted.** The Reality panel shows earned, target,
short-by, jobs, NPT. No adjectives, no verdict, no "you should". The figures sit
there and the engineer says what they mean. This is the accountability — what
you've done, how many jobs, where you fall short — without the app taking a view.

**The app never answers its own questions.** No question in the bank contains a
suggestion, and the Options stage offers no options. The engineer generates them
or the whole mechanism collapses into advice with a question mark on the end.
Enforced by test.

## Consequences

- Tuesday and Wednesday ask Reality from **different angles**. Tuesday looks for
  what is in the way; Wednesday is exception-finding — *when it went right, what
  were you doing differently?* A week of only problem-hunting surfaces nothing
  repeatable. The engineer's own working method is the thing worth finding.
- Questions **vary week to week** within each stage's bank, but are **fixed
  within a day**. The same Tuesday question for a year stops being a question and
  becomes a form field; a question that reshuffles while you are answering it is
  worse.
- The week's goal lives in its own table, `checkin_goals`, deliberately not on
  `weeks`. The CTAP target lives on `weeks` and is the employer's number. Putting
  the engineer's self-set goal beside it would make the two confusable, and the
  distinction between them is what the whole feature rests on.
- **Relatedness is the weakest of the three needs here**, and this is worth
  stating plainly rather than papering over. This is a single-user, private,
  self-facing app; ADR-0012 forbids the social features that would ordinarily
  serve relatedness, and rightly so. What is served instead is one Options
  question that points outward at people who already exist — *who could you ask
  about this?* That is genuinely relatedness-supporting and it is honest about
  its limits. A team feed would serve relatedness and destroy the feature.
- Coach Mode is untouched by this ADR and still tells rather than asks. The two
  now sit in a deliberate relationship: **Coach reports the numbers, the check-in
  asks the questions.** If Coach is ever reworked into question-led form, this is
  the ADR to revise.
- Missing Monday is survivable. Any day without a goal shows the goal picker
  first, so the arc can start late rather than being lost for the week.

## Alternatives considered

**One full GROW at week close.** Closer to how a real coaching session runs, and
the whole week is visible at once. Rejected on when it would actually happen: a
five-minute structured review on a Friday evening, after a full week in a van,
competes with going home. Forty seconds a day does not. Also, Reality landing on
Friday is a post-mortem — there is no week left to change.

**The CTAP target as the Goal.** Simpler, and a direct line to the bonus.
Rejected: it is the employer's number. A goal you were handed does not produce
the ownership the effect depends on, and the app would just be nagging in GROW's
clothing.

**Keeping the five factor ratings alongside the new arc.** Rejected on the
under-a-minute rule from ADR-0012. Two things to do daily is how a daily habit
stops being daily.
