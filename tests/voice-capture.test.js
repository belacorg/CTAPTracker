// Voice capture: the listening state must always be escapable.
//
// The bug these cover: continuous = true made iOS hold the microphone and
// never fire onend. While iOS holds the mic it takes over touch input, so no
// button — not Done, not ✕, not the backdrop — could exit the sheet. Anything
// here that relies on the *engine* behaving is a trap; the timers we own are
// what actually guarantee an exit.
import { describe, it, expect, beforeEach } from 'vitest';
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
    say(text, isFinal) {
      if (!this.onresult) return;
      this.onresult({ results: [Object.assign([{ transcript: text }], { isFinal: !!isFinal })] });
    }
    fail(error) { if (this.onerror) this.onerror({ error }); }
    end() { if (this.onend) this.onend(); }
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
  it('never asks for continuous recognition', () => {
    // continuous = true is what stopped iOS ever firing onend.
    const h = boot();
    h.openMic();
    expect(h.rec().continuous).toBe(false);
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
    h.advance(8000);
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
    // exactly the state that stranded the sheet on Jake's phone.
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns', false);
    expect(h.$('.voice-listening')).toBeTruthy();   // still listening, correctly
    h.advance(8000);                                 // ...until our own timer fires
    expect(h.$('.voice-listening')).toBeNull();
    expect(h.$('.voice-review')).toBeTruthy();       // and what it heard is preserved
    expect(h.$('.voice-heard').textContent).toContain('six breakdowns');
  });

  it('aborts the engine rather than waiting on stop()', () => {
    // stop() waits for a final result and can hang on iOS; abort() drops it.
    const h = boot();
    h.openMic();
    h.advance(8000);
    expect(h.log.aborted).toBeGreaterThan(0);
    expect(h.log.stopped).toBe(0);
  });

  it('keeps extending while the engineer is still talking', () => {
    const h = boot();
    h.openMic();
    h.advance(6000);
    h.rec().say('six breakdowns', false);      // speech resets the silence guard
    h.advance(6000);
    expect(h.$('.voice-listening')).toBeTruthy();
    h.advance(3000);
    expect(h.$('.voice-listening')).toBeNull();
  });
});

describe('voice capture — reaching the review', () => {
  it('advances on a final result without needing a tap', () => {
    const h = boot();
    h.openMic();
    h.rec().say('six breakdowns and two boiler leads', true);
    expect(h.$('.voice-review')).toBeTruthy();
    expect(h.$('#voice-commit').textContent.trim()).toBe('Log 8');
  });

  it('still honours the Done button', () => {
    const h = boot();
    h.openMic();
    h.rec().say('three fires', false);
    h.click('#voice-stop');
    expect(h.$('.voice-review')).toBeTruthy();
  });

  it('lets the mic circle itself stop capture', () => {
    const h = boot();
    h.openMic();
    h.rec().say('three fires', false);
    h.click('#voice-stop-mic');
    expect(h.$('.voice-review')).toBeTruthy();
  });

  it('honours the engine ending naturally', () => {
    const h = boot();
    h.openMic();
    h.rec().say('four services', false);
    h.rec().end();
    expect(h.$('.voice-review')).toBeTruthy();
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

  it('drops to typing from the link while listening', () => {
    const h = boot();
    h.openMic();
    h.click('#voice-type-instead');
    expect(h.$('#voice-text')).toBeTruthy();
    expect(h.log.aborted).toBeGreaterThan(0);
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

  it('keeps what it heard when the engine reports no-speech late', () => {
    const h = boot();
    h.openMic();
    h.rec().say('two services', false);
    h.rec().fail('no-speech');
    expect(h.$('.voice-review')).toBeTruthy();
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
