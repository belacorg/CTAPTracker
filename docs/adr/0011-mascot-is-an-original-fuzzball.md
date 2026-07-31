# The mascot is an original fuzzball, separated in two directions

The sprite in the greeting lane and on the Coach card is a round blue fuzzball of this app's own design. He replaces the pixel engineer who stood there before. He has to stay clear of two other things, and they pull in opposite directions.

**Away from Apprentice to Engineer.** A2E is Jake's own product; this is a personal tool for a Centrica bonus scheme. They are separate entities and must not look like a family. A2E's mascot wears amber and cobalt with its chevron on his chest; none of those colours appear here and there is no chevron. That separation predates this change and carries over intact.

**Away from British Gas's advertising characters.** The prompt for this redesign was the Things — Centrica's own campaign mascots. They are the employer's IP, and CTAP Tracker is a personal app that is publicly deployed and already carries internal ID1923 job codes. Putting the employer's advertising characters on it would make it read as an official British Gas tool, which is precisely the exposure the project is trying to avoid. The brief was "a fuzzy blue ball"; what was built is an original character that shares only the general idea of being blue and being fuzzy.

Concretely, he is kept generic on purpose:

- A palette of seven flat colours, so he stays a blob rather than a rendering of anything specific.
- A simple ragged-outline silhouette — the raggedness is the only thing at 24×24 that reads as fur rather than as a bouncing ball, and it is the cheapest possible way to say it.
- No accessories, no glasses, no props beyond the toolbox that was already his.

`tests/pixel-engineer.test.js` asserts the testable half of this: the palette stays small, the silhouette stays ragged and round, and nothing of A2E's palette appears. "Is this an original character" is not a property of a pixel grid and cannot be asserted — the tests exist to stop him quietly drifting toward a likeness later, not to prove he isn't one now.

Two consequences for the animation, both following from him having no limbs:

- **Greeting is a bounce and a blink**, not a tipped cap. The engineer raised an arm to his cap; a ball has neither, and a hop reads as pleased to see you without them.
- **He never puts the toolbox down**, including while talking. The engineer freed a hand to gesture on the Coach card. There is no hand here to free, and he turned up to work.

The canvas went from 22×27 to 24×24 when he became round, so the three mount points (greeting lane, Coach card, sprite element) carry matching square dimensions. Every frame keeps a clear outer ring — the greet bounce peaks two pixels up, and a third would put his top tufts in row 0 where the lane clips them.
