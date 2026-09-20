# The cash-out sheet prices hours you have not earned

The **CTAP Cash-Out** sheet could only ever cost the balance already banked. It answered *"what is this worth?"* and had no way to ask *"what would it be worth if I got there?"* — which is the question an engineer in deficit actually has, and the one the sheet was worst placed to answer, because a deficit made every figure on it £0.00.

The sheet now has an **Hours to price** field. It opens on the payable balance, takes any figure from 0 to 999, and moves the money as you type. A **−** / **+** pair either side nudges it an hour at a time, because the sheet is read one-handed in a van and the hours get thumbed far more often than typed.

## Keeping a price from being read as an entitlement

This is the same hazard ADR-0023 dealt with on the Dashboard, and it is sharper here: on the Dashboard a confused figure means a wrong expectation about the week, here it means a wrong expectation about money.

Four things keep them apart.

The **Payable balance** row stays at the top of the sheet and never moves with the field. It remains the only figure that could actually be withdrawn.

The moment the priced hours differ from that balance, the sheet says so in words: *"Pricing 40.00h — 30.00h more than you can draw today."*

The result card turns amber — border and take-home figure both, the take-home dropping its usual green. Amber rather than red, because pricing hours you have not earned is the tool working, not an error.

A priced figure never outlives the sheet. `cashOutHours` is null by default, meaning *follow the balance*, and `openCashOutSheet` resets it every time. A what-if left over from last week's daydream would be read as a balance on the next visit.

## Why a live patch rather than a rebuild

Every other control on the sheet calls `refreshSheetInPlace`, which replaces `panel.innerHTML`. That is fine for a tap and fatal for a field: it would throw the caret out on every keystroke. `patchCashOutFigures` writes the four figures directly instead, and the prose the two paths share — `cashOutModelNote` and `cashOutBreakdown` — lives in one place so a rebuild and a keystroke cannot word the same state differently.

The listeners are delegated from the sheet rather than bound to the field, for the same reason. The first build of this bound the input directly; the modeller worked until the first multiplier tap rebuilt the panel underneath it, and then went quietly dead. A test now types after a multiplier tap.

## Rejected

*Cap the field at the payable balance.* It would make the sheet incapable of the question it was built to answer. An engineer 12h down wants to know what climbing out is worth, and a field that refuses to go above zero tells them nothing.

*Default the field to something aspirational when in deficit.* Opening on an invented figure would be the same lie in the other direction. It opens on what is real — £0.00 if that is the truth — with the deficit note pointing at the field.
