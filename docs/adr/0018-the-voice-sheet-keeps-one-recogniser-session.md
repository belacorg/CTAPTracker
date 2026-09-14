# The voice sheet keeps one recogniser session, and corrects speech against the job vocabulary

Two things the phone does that the app cannot change, and what is done about each.

## One session per sheet

On iPhone (iOS 18.7 Safari, measured with `voice-lab.html`), once a speech-recognition session has heard speech, the next session is deaf: it starts, reports listening, and hears nothing for about 40 seconds, whether the first session ended on its own or by `abort()`, and however long the gap. That is why voice "worked once": Done ended the session, and Try again started a deaf one.

So the **Voice sheet** opens one session and keeps it for as long as the sheet is up. Done, the silence guard and the cap on a dictation parse what was heard and **mute** the session — results still arrive and are discarded. Start over, Try again and the mic **unmute** it and listen from that point. Only closing the sheet, logging or discarding the draft, or the ceiling on one session ends the engine, always with `abort()`. Nothing the engineer taps between dictations restarts it.

The cost is that the microphone stays open while a draft is being checked, and the phone shows its indicator. That is accepted: the alternative is a second dictation that hears nothing. A session that the engine ends on its own is not restarted; the next tap starts fresh and, if iOS reports that start deaf, is tried once more after the report, which is the first start that hears.

The rule from ADR-0007 stands: the timers the app owns are what guarantee listening ends, never the engine and never a count of buttons.

## The vocabulary corrects the transcript

Safari offers no grammar to constrain recognition, and the engine has never heard of a breakdown: it writes "six bank accounts". An engineer logging jobs uses a small vocabulary, so the correction is done on the app's side in two places, both in `data.cjs` so they are testable without a phone:

- **`VOICE_MISHEARD`**: phrases the engine produces for job words, folded to the word said. The rule is the one the homophones already follow: a phrase is only in the table if nobody says it while logging gas jobs, so folding it can only help. "Bank accounts", "surfaces", "open term" qualify; "five", "empty" and "free" do not, however often the engine mangles them, because an engineer might mean them. The table grows from the field, one reported mishearing at a time, and every entry is a test.
- **`bestVoiceAlternative`**: the engine is asked for a few readings of each phrase, and the one that names the most jobs and leaves the fewest unplaced words is kept. A tie keeps the engine's first choice, so the app never overrides a reading that already fits.

Alternative considered: fuzzy phonetic matching of unrecognised fragments against the alias list. Rejected: on a catalogue full of near-homophones it would guess wrong silently, which ADR-0007 forbids; a visible "not recognised" chip is the better failure.
