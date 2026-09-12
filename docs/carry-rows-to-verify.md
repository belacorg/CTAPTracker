# CARRY rows — to check against sheet ID1923

Nine catalogue entries in `app/data.cjs` were never seen on the supplied
screenshots of Centrica's "ID1923 – Job Codes & Credits" (sheet rows 9–12 and
43–47). Their figures were carried over from the earlier catalogue and have
never been confirmed.

They are live in the trial. Every one of them is a **credit an engineer earns**,
so if a figure is wrong the engineer's balance is wrong in their favour or
against it, and the first thing they will do is compare it to their payslip and
stop trusting the app.

`credits = minutes / 83.58`, so **only the minutes column needs checking** — the
credits follow. See ADR-0006: the catalogue is policy, expected to drift.

## Core

| Line | Code              | Job                          | Mins | ✓? |
|-----:|-------------------|------------------------------|-----:|----|
| 14   | `GS-MWH / GS-WAL` | Gas Service (MWH, WAL)       | 35   |    |
| 31   | `OCA`             | OCA (all appliances)         | 56   |    |
| 32   | `FGS`             | Free Gas Safety Check        | 30   |    |

## SGO / sale credits

| Line | Id               | Job                         | Mins | ✓? |
|-----:|------------------|-----------------------------|-----:|----|
| 58   | `hi_lead`        | HI Lead (Boiler Lead)       | 58   |    |
| 59   | `inhibitor`      | Inhibitor (Fit + SGO)       | 51   |    |
| 60   | `hive_sale_sgo`  | Hive Sale (SGO Credit)      | 69   |    |
| 61   | `hive_sale_fit`  | Hive Fit (Sale Job)         | 125  |    |
| 62   | `co_alarm_sgo`   | CO Alarm – Sell (SGO)       | 10   |    |
| 63   | `co_alarm_fit`   | CO Alarm – Fit Only         | 7    |    |

## If a figure is wrong

Change `minutes` and recompute `credits` as `minutes / 83.58` to 2dp, then drop
the `CARRY` comment from that line. `tests/data.test.js` checks the two stay
consistent, so a mismatch fails the build rather than reaching an engineer.

`OCA` and `FGS` are additionally marked "not on ID1923" — worth settling whether
they belong in the catalogue at all, not just what they are worth.
