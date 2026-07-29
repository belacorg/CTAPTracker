# Voice logging produces a draft, never a direct write

Speaking a day's work ("six breakdowns, two boiler leads and three fires") produces a **Voice draft** — a parsed, editable list of proposed entries — which the engineer confirms before anything reaches state. Speech never writes to a week directly, and there is no "log it and offer Undo" path.

The reason is the cost asymmetry. Speech-to-text in a van is unreliable: engine noise, radio, an accent the recogniser wasn't trained on, and a job catalogue full of near-homophones ("fire service" vs "fire repair", "Hive fit" vs "Hive sale"). A wrong entry that lands silently corrupts the **CTAP balance** — a ledger that never resets and that the engineer is paid against. Catching it later means reconstructing a day from memory. Against that, a confirm step costs one tap.

The parser therefore optimises for recall over precision: it matches generously (plurals, trade shorthand, filler words, run-on dictation with no punctuation) and lets the confirm sheet be the precision filter. Every row can be re-pointed at any job in the catalogue, re-counted, or removed. Two consequences follow:

- **Ambiguous bare words are left unmatched rather than guessed.** "Thermostat" could be four different Hive installs at different credit values, so it is reported back as unrecognised instead of resolved to the most likely one. A visible gap prompts a correction; a plausible wrong guess does not.
- **Variable jobs block the commit until a value is supplied.** Trace & Repair, Wait Work and NPT Quick are credited min-for-min, so a missing duration is not a defaulting decision the app is entitled to make. The row is flagged and the confirm button stays disabled.

The parser lives in `data.cjs` as a pure function (`parseVoiceLog(transcript, referenceDate)`) with the reference date injected, so backdating is testable without freezing the clock.

Voice is an alternative entry point to the same model as the job tiles, not a parallel one: a confirmed draft is written through the same shapes the tile flow produces, so nothing downstream can tell how an entry was logged. It does inherit the tile flow's gap — an **Early Finish** captured by voice creates a plain NPT entry without asking for its disposition (see ADR-0005), and will need the same fix.
