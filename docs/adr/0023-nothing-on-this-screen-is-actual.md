# Nothing on this screen is actual

The Week tile carried a toggle reading **Actual** / **Projected**. Two things were wrong with it.

The small one: it moved only the **CTAP balance** tile beside it. Tapping "Projected" left the week's own hours sitting still, so the control read as broken — the label changed and the number it appeared to label did not.

The large one is the word *Actual*. Every credit in this app is the engineer's own tap scored against the local job catalogue. Nothing arrives from Centrica. So no figure on the Dashboard is actual in the sense that word carries on a payslip, and the ones sitting under that label were exposed to at least three sources of drift: a job logged on the wrong day or not at all, a catalogue credit that does not match what the business pays (the CARRY rows are still unverified against sheet ID1923), and **Performance Factor**, which is an estimate by name — `estimatedDailyPFMins`.

An engineer reading "Actual 15.00h" the day before a pay query has been told the app knows something it does not. The tile's own disclaimer — "personal estimates and may not match official Centrica or British Gas systems" — is three taps away in Settings, and it contradicts the word on the face of the tile.

The toggle is now **Predicted** / **Logged**, and it drives both tiles.

*Logged* claims only that the engineer entered it, which is true and is the whole of what the app can vouch for. *Predicted* is the end-of-week figure at the current pace. The axis the toggle switches is time — days banked against where the week lands — not truth, because both sides are the engineer's own reckoning.

The tile opens on **Predicted**. A running total answers "how much have I got?", which the engineer already knows from the day they have just had; the prediction answers "does this week make the bonus?", which is the question the tile exists to answer and the only one that can still be acted on.

Both tiles read the same figures, through `weekPaceFigures(weekKey, week)`. The Week tile and the Weekly Forecast sheet had worked the same projection out separately and had already drifted once — the comment in `getCoachInsights` records the morning when today fell into neither the worked nor the remaining bucket and the projection spent every morning assuming today would produce nothing. One function now, so the tile is a preview of the sheet rather than a rival to it.

The **CTAP balance** moved with it. It projected the week *as if it closed today*, which was defensible while the tile beside it said "Actual", but two tiles both captioned predicted and disagreeing by a day's work is worse than either reading alone. It now takes the same projected week: `bal + projected − target`.

Two guards, both hiding the toggle rather than offering a mode that would print the same number twice. With nothing logged there is no pace to project from — and projecting anyway would book the entire week's target as a deficit on the balance, with no visible control to get back from it. With every working day in, the week has landed and the prediction *is* the logged figure.

Alternative considered: drop the toggle and show the prediction alone. Rejected — the banked figure is what an engineer checks against their own notes, and it should not take a tap to reach. It is on the tile either way, as the caption under a prediction: "15.00h logged over 3 days · 1 to go".

Alternative considered: keep "Actual" and add a footnote. Rejected. A label that needs a footnote to stop being untrue is the wrong label.
