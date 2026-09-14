// Voice capture: listening must always be escapable, and a second go must
// hear as well as the first.
//
// Three iPhone findings shaped this. First, continuous = true with no timers
// of our own stranded the sheet in "Listening…": the engine never ended and no
// tap got the page out. Timers we own now guarantee an exit. Second, measured
// with voice-lab.html on iOS 18.7: once a session has heard speech, the NEXT
// session is deaf for ~40 seconds, however the first one ended and whatever
// the gap. Short self-restarting bursts therefore heard one phrase; and Try
// again after Done heard nothing. Third, one continuous session carries phrase
// after phrase through pauses. So the sheet opens one session and keeps it:
// Done mutes it, Start over unmutes it, and only closing the sheet aborts it.
//
// Anything here that relies on the *engine* behaving is a trap; the timers we
// own and abort() are what actually guarantee an exit and a released mic.
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', 'app');
const dataSrc = readFileSync(join(APP, 'data.cjs'), 'utf8');
const appSrc = readFileSync(join(APP, 'app.js'), 'utf8');

// A clock we control, installed before app.js is evaluated so its setTimeout
// calls land here rather than on the real event loop.
function installClock(window) {
  let now = 0;
  let seq = 1;
  const timers = new Map();
  window.setTimeout = (fn, ms) => { timers.set(seq, { fn, at: now + (ms || 0) }); return seq++; };
  window.clearTimeout = (id) => { timers.delete(id); };
  window.setInterval = () => 0;
  window.clearInterval = () => {};
  return function advance(ms) {
    const target = now + ms;
    for (let guard = 0; guard < 500; guard++) {
      let pick = null;
      for (const [id, t] of timers) {
        if (t.at <= target && (pick === null || t.at < timers.get(pick).at)) pick = id;
      }
      if (pick === null) break;
      const t = timers.get(pick);
      timers.delete(pick);
      now = t.at;
      t.fn();
    }
    now = target;
  };
}

// Stand-in for the browser's SpeechRecognition. Defaults to a well-behaved
// engine; individual tests opt into the pathological behaviours.
function makeRecognitionClass(log) {
  return class FakeRecognition {
    constructor() {
      this.continuous = null;
      this.interimResults = null;
      this.lang = '';
      this.aborted = false;
      this.results = [];
      log.instances.push(this);
    }
    start() {
      log.started++;
      if (log.neverStarts) return;              // engine accepts start() then dies
      if (this.onstart) this.onstart();
    }
    stop() { log.stopped++; }
    abort() { log.aborted++; this.aborted = true; }

    // ── helpers the tests drive ──
    // Results accumulate the way a continuous session reports them: a phrase
    // in progress replaces the interim at the end of the list, and a final one
    // fixes it there.
    say(text, isFinal, alternatives = []) {
      if (!this.onresult) return;
      const last = this.results[this.results.length - 1];
      const index = last && !last.isFinal ? this.results.length - 1 : this.results.length;
      const result = [{ transcript: text }].concat(alternatives.map((t) => ({ transcript: t })));
      result.isFinal = !!isFinal;
      this.results[index] = result;
      this.onresult({ resultIndex: index, results: this.results.slice() });
    }
    fail(error) { if (this.onerror) this.onerror({ error }); }
    end() { if (this.onend) this.onend(); }    // the engine stopping on its own
  };
}

// Load as classic <script> elements, the way index.html does — `window.eval`
// would give each file its own lexical scope and they share top-level consts.
function runScript(window, src) {
  const el = window.document.createElement('script');
  el.textContent = src;
  window.document.body.appendChild(el);
}

function boot({ neverStarts = false, noRecognition = false } = {}) {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
    runScripts: 'dangerously',
    url: 'http://localhost:3737/',
    pretendToBeVisual: true
  });
  const { window } = dom;
  window.__ctapSupabaseActive = true;
  const advance = installClock(window);

  const log = { instances: [], started: 0, stopped: 0, aborted: 0, neverStarts };
  if (!noRecognition) window.SpeechRecognition = makeRecognitionClass(log);

  runScript(window, dataSrc);
  runScript(window, appSrc);
  window.__ctapInit(null, null, null);

  const $ = (s) => window.document.querySelector(s);
  const click = (sel) => {
    const el = $(sel);
    if (!el) throw new Error(`no element for ${sel}`);
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  };
  const openMic = () => click('#voice-btn');

  return { window, $, click, openMic, advance, log, rec: () => log.instances[log.instances.length - 1] };
}

describe('voice capture — configuration', () => {
  it('asks for one continuous session rather than short bursts', () => {
    // Bursts ended themselves on every pause, and on iPhone each self-ended
    // session keeps the microphone for ~45s — so every restart after the first
    // phrase heard nothing. See voice-lab.html.
    const h = boot();
    h.openMic();
    expect(h.rec().continuous).toBe(true);
  });

  it('starts the engine and shows the listening state', () => {
    const h = boot();
    h.openMic();
    expect(h.log.started).toBe(1);
    expect(h.$('.voice-listening')).toBeTruthy();
  });
});

describe('voice capture — always escapable', () => {
  it('leaves listening on its own when the engine goes silent', () => {
    const h = boot();
    h.openMic();
    expect(h.$('.voice-listening')).toBeTruthy();
    h.advance(7000);
    expect(h.$('.voice-listening')).toBeNull();
    expect(h.$('#voice-text')).toBeTruthy();       // dropped to the typed fallback
  });

  it('rescues itself when the engine never starts', () => {
    const h = boot({ neverStarts: true });
    h.openMic();
    h.advance(4000);
    expect(h.$('.voice-listening')).toBeNull();
    expect(h.$('.voice-message').textContent).toMatch(/didn’t start/i);
  });

  it('escapes the iOS trap: engine holds the mic and never ends', () => {
    // Engine starts, takes speech, but never fires onend or a final result —
    // the state that once stranded the sheet on Jake's phone. A continuous
    // session is exactly this shape, so our own timer must end it.
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', false);
    expect(h.$('.voice-listening')).toBeTruthy();   // still listening, correctly
    h.advance(7000);                                 // ...until our own timer fires
    expect(h.$('.voice-listening')).toBeNull();
    expect(h.$('.voice-review')).toBeTruthy();       // and what it heard is preserved
    expect(h.$('.voice-heard').textContent).toContain('six breakdowns');
  });

  it('mutes rather than ends the session when the pause runs long', () => {
    // Ending it would make the next start deaf on iPhone. The sheet moves on;
    // the engine keeps running, and what it hears now is discarded.
    const h = boot();
    h.openMic();
    h.advance(7000);
    expect(h.log.aborted).toBe(0);
    expect(h.log.stopped).toBe(0);
    expect(h.rec().onresult).toBeTruthy();
  });

  it('aborts the engine rather than waiting on stop() when the sheet closes', () => {
    // stop() waits for a final result and can hang on iOS; abort() drops it,
    // and it is what releases the microphone.
    const h = boot();
    h.openMic();
    h.click('#voice-close');
    expect(h.log.aborted).toBe(1);
    expect(h.log.stopped).toBe(0);
  });

  it('keeps extending while the engineer is still talking', () => {
    const h = boot();
    h.openMic();
    h.advance(6000);
    h.rec().say('six breakdowns', false);      // speech resets the silence guard
    h.advance(6000);
    expect(h.$('.voice-listening')).toBeTruthy();
    h.advance(2000);
    expect(h.$('.voice-listening')).toBeNull();
  });

  it('caps one dictation, however long the engine keeps talking', () => {
    const h = boot();
    h.openMic();
    for (let t = 0; t < 130000; t += 5000) { if (h.$('.voice-listening')) h.rec().say('and another', true); h.advance(5000); }
    expect(h.$('.voice-listening')).toBeNull();
    expect(h.log.aborted).toBeGreaterThan(0);
  });
});

describe('voice capture — listening through pauses', () => {
  // Engineers pause constantly: reading the next job off a phone, thinking.
  // One continuous session carries those pauses, so nothing is restarted
  // mid-dictation.
  it('keeps listening after the engine commits a phrase', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', true);
    expect(h.$('.voice-listening')).toBeTruthy();
    expect(h.$('.voice-review')).toBeNull();
  });

  it('carries phrase after phrase through pauses in the one session', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', true);
    h.advance(3000);
    h.rec().say('and two boiler leads', true);
    h.advance(3000);
    h.rec().say('and three fires', true);
    h.click('#voice-stop');

    expect(h.log.started).toBe(1);
    expect(h.$('.voice-heard').textContent).toContain('six breakdowns');
    expect(h.$('.voice-heard').textContent).toContain('two boiler leads');
    expect(h.$('#voice-commit').textContent.trim()).toBe('Log 11');
  });

  it('shows the running transcript while still listening', () => {
    const h = boot();
    h.openMic();
    h.rec().say('four services', true);
    h.rec().say('and a quote', false);
    expect(h.$('#voice-live').textContent).toContain('four services');
    expect(h.$('#voice-live').textContent).toContain('quote');
  });

  it('rides out a long pause without losing the thread', () => {
    const h = boot();
    h.openMic();
    h.rec().say('two services', true);
    h.advance(5000);                      // a good think, under the guard
    expect(h.$('.voice-listening')).toBeTruthy();
    h.rec().say('and one fire', true);
    h.click('#voice-stop');
    expect(h.$('.voice-heard').textContent).toContain('two services');
    expect(h.$('.voice-heard').textContent).toContain('one fire');
  });

  it('wraps up once the pause runs long', () => {
    const h = boot();
    h.openMic();
    h.rec().say('two services', true);
    h.advance(7000);
    expect(h.$('.voice-listening')).toBeNull();
    expect(h.$('.voice-review')).toBeTruthy();
  });

  it('never restarts after the engine ends on its own — on iPhone that start is deaf', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', true);
    h.rec().end();
    h.advance(1000);
    expect(h.log.started).toBe(1);
    expect(h.$('.voice-review')).toBeTruthy();
    expect(h.$('.voice-heard').textContent).toContain('six breakdowns');
  });

  it('says so when the engine ends on its own having heard nothing', () => {
    const h = boot();
    h.openMic();
    h.rec().end();
    h.advance(1000);
    expect(h.log.started).toBe(1);
    expect(h.$('.voice-message').textContent).toMatch(/didn’t catch/i);
  });

  it('keeps the session through Done, and releases the microphone when the draft is logged', () => {
    const h = boot();
    h.openMic();
    const rec = h.rec();
    rec.say('three fires', true);
    h.click('#voice-stop');
    expect(rec.aborted).toBe(false);
    h.click('#voice-commit');
    expect(rec.aborted).toBe(true);
    expect(h.log.stopped).toBe(0);
  });

  it('still honours the Done button', () => {
    const h = boot();
    h.openMic();
    h.rec().say('three fires', false);
    h.click('#voice-stop');
    expect(h.$('.voice-review')).toBeTruthy();
  });
});

// Tapping the mic means "listen again" — on the session already open.
//
// The mic circle used to be a second Done button, added as one more way out
// when iOS held the microphone. But the exit is guaranteed by the timers we
// own, not by how many buttons stop capture — and on a phone, tapping the mic
// because it didn't catch you is the natural thing to do. And it must not
// restart the engine: on iPhone the session after one that heard speech is
// deaf, which is exactly the "works once" bug Jake reported.
describe('voice capture — trying again', () => {
  it('listens again on the same session when the mic is tapped mid-capture', () => {
    const h = boot();
    h.openMic();
    h.click('#voice-mic-again');
    expect(h.$('.voice-listening')).toBeTruthy();
    expect(h.$('.voice-message')).toBeNull();
    h.advance(1000);
    expect(h.log.started).toBe(1);
    expect(h.log.aborted).toBe(0);
    expect(h.log.instances.length).toBe(1);
  });

  it('drops what it heard, so the second go is a clean one', () => {
    const h = boot();
    h.openMic();
    h.rec().say('three fires', true);
    h.click('#voice-mic-again');
    expect(h.$('#voice-live').textContent).not.toContain('three fires');
    h.rec().say('two services', true);
    h.click('#voice-stop');
    expect(h.$('.voice-heard').textContent).toContain('two services');
    expect(h.$('.voice-heard').textContent).not.toContain('three fires');
  });

  it('ignores a phrase from before the tap that the engine finalises late', () => {
    // The engine was part-way through "three fires" when the mic was tapped.
    // When it fixes that phrase a moment later it must not land in the new go.
    const h = boot();
    h.openMic();
    h.rec().say('three fires', false);
    h.click('#voice-mic-again');
    h.rec().say('three fires', true);           // same slot, now final
    expect(h.$('#voice-live').textContent).not.toContain('three fires');
    h.rec().say('two services', true);
    h.click('#voice-stop');
    expect(h.$('#voice-commit').textContent.trim()).toBe('Log 2');
  });

  it('starts over from the draft without restarting the engine', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', true);
    h.click('#voice-stop');
    expect(h.$('.voice-review')).toBeTruthy();
    h.click('#voice-retry');
    expect(h.$('.voice-listening')).toBeTruthy();
    expect(h.log.started).toBe(1);
    expect(h.log.aborted).toBe(0);
    h.rec().say('two services', true);
    h.click('#voice-stop');
    expect(h.$('.voice-heard').textContent).toBe('“two services”');
  });

  it('discards what the engine hears between Done and Start over', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', true);
    h.click('#voice-stop');
    h.rec().say('and some chat with the customer', true);
    expect(h.$('.voice-heard').textContent).toBe('“six breakdowns”');
    h.click('#voice-retry');
    expect(h.$('#voice-live').textContent).not.toContain('customer');
  });

  it('is still escapable after starting again', () => {
    const h = boot();
    h.openMic();
    h.click('#voice-mic-again');
    h.advance(7000);
    expect(h.$('.voice-listening')).toBeNull();
    expect(h.$('#voice-text')).toBeTruthy();
  });

  it('offers to listen again from "Didn\'t catch anything", on the same session', () => {
    const h = boot();
    h.openMic();
    h.advance(7000);
    expect(h.$('.voice-message').textContent).toMatch(/didn’t catch/i);
    h.click('#voice-listen-again');
    expect(h.$('.voice-listening')).toBeTruthy();
    expect(h.log.started).toBe(1);
    h.rec().say('four services', true);
    h.click('#voice-stop');
    expect(h.$('#voice-commit').textContent.trim()).toBe('Log 4');
  });

  it('starts fresh only when the engine has already gone', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', true);
    h.rec().end();                                // iOS ended it itself
    expect(h.$('.voice-review')).toBeTruthy();
    h.click('#voice-retry');
    expect(h.log.started).toBe(2);
    expect(h.$('.voice-listening')).toBeTruthy();
  });

  it('tries once more when iOS reports the fresh start deaf', () => {
    // A deaf session fails with audio-capture ~40s in, and the start after
    // that failure is the one that hears.
    const h = boot();
    h.openMic();
    h.rec().end();
    h.click('#voice-listen-again');
    expect(h.log.started).toBe(2);
    h.rec().fail('audio-capture');
    expect(h.log.started).toBe(3);
    expect(h.$('.voice-listening')).toBeTruthy();
    h.rec().fail('audio-capture');               // a phone with no microphone at all
    expect(h.log.started).toBe(3);
    expect(h.$('#voice-text')).toBeTruthy();
  });

  it('lets a muted session fail quietly, without disturbing the draft', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', true);
    h.click('#voice-stop');
    h.rec().fail('audio-capture');
    expect(h.$('.voice-review')).toBeTruthy();
    expect(h.$('.voice-message')).toBeNull();
  });

  it('releases the microphone at the ceiling even while muted', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', true);
    h.click('#voice-stop');
    h.advance(120000);
    expect(h.log.aborted).toBe(1);
    expect(h.$('.voice-review')).toBeTruthy();   // the draft is untouched
  });

  it('offers no listen-again where voice cannot work', () => {
    const none = boot({ noRecognition: true });
    none.openMic();
    expect(none.$('#voice-listen-again')).toBeNull();

    const blocked = boot();
    blocked.openMic();
    blocked.rec().fail('not-allowed');
    expect(blocked.$('#voice-listen-again')).toBeNull();
  });
});

// The engine offers several readings of a phrase and ranks them as English.
// The job vocabulary re-ranks them, so "six bank accounts" comes in as the
// "six breakdowns" it was.
describe('voice capture — picking the reading that names jobs', () => {
  it('asks the engine for more than one reading', () => {
    const h = boot();
    h.openMic();
    expect(h.rec().maxAlternatives).toBeGreaterThan(1);
  });

  it('keeps the reading with the jobs in it', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six bank statements', true, ['six breakdowns', 'sick break downs']);
    expect(h.$('#voice-live').textContent).toContain('six breakdowns');
    h.click('#voice-stop');
    expect(h.$('#voice-commit').textContent.trim()).toBe('Log 6');
  });

  it("keeps the engine's own choice when it already fits", () => {
    const h = boot();
    h.openMic();
    h.rec().say('two services', true, ['two surfaces', 'to services']);
    h.click('#voice-stop');
    expect(h.$('.voice-heard').textContent).toBe('“two services”');
  });
});

describe('voice capture — closing out', () => {
  it('closes from the ✕ while listening', () => {
    const h = boot();
    h.openMic();
    h.click('#voice-close');
    expect(h.$('#voice-sheet').classList.contains('hidden')).toBe(true);
    expect(h.log.aborted).toBeGreaterThan(0);
  });

  it('closes from the backdrop while listening', () => {
    const h = boot();
    h.openMic();
    h.click('#voice-backdrop');
    expect(h.$('#voice-sheet').classList.contains('hidden')).toBe(true);
  });

  it('drops to typing from the link while listening, keeping the session for a Try again', () => {
    const h = boot();
    h.openMic();
    h.click('#voice-type-instead');
    expect(h.$('#voice-text')).toBeTruthy();
    expect(h.log.aborted).toBe(0);
    h.click('#voice-listen-again');
    expect(h.log.started).toBe(1);
    expect(h.$('.voice-listening')).toBeTruthy();
  });

  it('leaves no timer able to reopen a closed sheet', () => {
    const h = boot();
    h.openMic();
    h.click('#voice-close');
    h.advance(30000);
    expect(h.$('#voice-sheet').classList.contains('hidden')).toBe(true);
  });
});

describe('voice capture — engine errors', () => {
  it('explains a blocked microphone', () => {
    const h = boot();
    h.openMic();
    h.rec().fail('not-allowed');
    expect(h.$('.voice-message').textContent).toMatch(/microphone access/i);
  });

  it('treats no-speech as a pause and keeps listening', () => {
    const h = boot();
    h.openMic();
    h.rec().say('two services', true);
    h.rec().fail('no-speech');
    expect(h.$('.voice-listening')).toBeTruthy();
    h.click('#voice-stop');
    expect(h.$('.voice-heard').textContent).toContain('two services');
  });

  it('offers the typed fallback on an unknown failure', () => {
    const h = boot();
    h.openMic();
    h.rec().fail('network');
    expect(h.$('#voice-text')).toBeTruthy();
  });

  it('ignores the abort we caused ourselves', () => {
    const h = boot();
    h.openMic();
    const rec = h.rec();
    h.click('#voice-close');
    rec.fail('aborted');                       // fires after our abort()
    expect(h.$('#voice-sheet').classList.contains('hidden')).toBe(true);
  });
});

describe('voice capture — no engine at all', () => {
  it('goes straight to the typed fallback', () => {
    const h = boot({ noRecognition: true });
    h.openMic();
    expect(h.$('#voice-text')).toBeTruthy();
    expect(h.$('.voice-message').textContent).toMatch(/isn’t available/i);
  });
});
