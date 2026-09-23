# SGO is recoupled, and kept in two parts

From 2 March 2026 SGO stopped being paid as cash and started being paid into the CTAP bank as minutes. The brief calls the old arrangement *decoupled* and the new one *recoupled*. The app had never heard of it: its six SGO rows were unverified CARRY values, and several were far out against the conversion table — Inhibitor 51 against 17, Hive Sale 69 against 49.

## What a sale is worth

The conversion table gives each item three figures: SGO cash (the old arrangement), a fulfilment credit, and a CTAP credit. Two readings of the table settle how they combine.

**The fulfilment credit is the credit engineers already had.** It is identical before and after 2 March on every row — 15, 12, 5, 10 — while the cash column is replaced wholesale. Nothing about the recoupling touched it.

**The CTAP credit is the cash, converted, on top.** It is the old cash at one rate across the whole table, about 2.2 minutes per pound: £20 → 44, £17.50 → 39, £31.50 → 70, £10.25 → 23. The table's own last column, "Total CTAP credit", is the two added together.

So a sale is worth fulfilment + SGO credit, and before 2 March only the fulfilment reached the bank. `jobCredit(job, value, dayKey)` decides it by the day the work was done, so a sale backdated across the line is credited under its own day's rules.

## Why the parts are stored apart

An entry records `fulfilmentMins` and `sgoMins` alongside `creditMins`, rather than just the sum.

They are different things — one is earned for the work, the other is what used to be cash — and the engineer asked to see them separately. The Weekly Forecast and the Week Summary show a week's SGO as a total split into its two parts, and every logged sale shows its own split.

They are read off the entry, not the catalogue. The table is provisional and will change; a week already logged must keep saying what it was paid. An entry logged before today carries neither field and is simply not counted as SGO, rather than being retro-fitted with a split it never had.

## HIM priced on value

HIM is "per £1,000 excl VAT", but only the CTAP credit scales with value. The fulfilment credit is flat per sale: the filter (£205) and powerflush (£630) rows are both HIM products under £1,000 and still carry the full 12 minutes, which they could not if fulfilment were per £1,000. A £2,500 HIM sale is 12 + 275 = 287 minutes.

## The same brief's two other credit changes

**Upgrades quoted over 240 minutes earn +10%**, from 23 February. Read as the whole credit — "upgrade job credits will be enhanced by 10%" — not the minutes above 240, and a quote of exactly 240 is not over it. Rounded to the whole minute.

**The HIM-HE reflush is a fixed 480 minutes on completion**, from 23 February (330 before). WCH-IRF, the installs reflush, is not added: this app is for Service & Repair engineers.

The reflush is marked out of the elective set. It is sold work booked in its own right; offering "a reflush is 8.00h" as a way to close today's gap would be fiction.

## Two retired rows

"Hive Fit (Sale Job)" (125) and "CO Alarm – Fit Only" (7) were CARRY rows duplicating verified codes: INSHV-THR (90) and IA-COD (5). Left beside the new SGO rows they invited one sale being logged as a sale, a fit and an install. The first was also the source of the "a Hive is 3.23h" line on the Best advice strip, which summed it with the old Hive SGO row; the strip now prices a Hive as the SGO sale plus INSHV-THR, 2.32h.

They live in `RETIRED_JOBS`, outside the catalogue and unreachable from `findJob`, so nothing can offer them again. Engineers' old entries keep their own name and credit, and are still counted as sales in their week.

## Open

**The table is provisional.** It is the Technical Repair Engineer table. Service & Repair has its own, to follow. It replaces `SGO_TABLE.rows` and nothing else; a test checks every row's CTAP credit against the cash at the table's own rate, so a digit that slips on the way in fails before it reaches anyone's balance.

**Fulfilment may overlap a fit code.** The CO detector's 5-minute fulfilment equals IA-COD exactly. If IA-COD *is* the fulfilment, an engineer logging both counts 5 minutes twice. Unconfirmed, so both stay and the tiles show their figures side by side, where a double count is at least visible. Settling it is one line per item.
