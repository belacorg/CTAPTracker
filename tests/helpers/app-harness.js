// Boots the real app (data.cjs + app.js as classic scripts) inside JSDOM so
// tests can drive it with genuine click events.
//
// The app is a string-template renderer with no module boundary, so this is
// the only way to cover render + listeners + state writes together. Worth the
// setup: a voice bug shipped because the listening path had no coverage.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app');
const dataSrc = readFileSync(join(APP, 'data.cjs'), 'utf8');
const appSrc = readFileSync(join(APP, 'app.js'), 'utf8');

// A clock we control, installed before app.js runs so its setTimeout calls
// land here rather than on the real event loop.
export function installClock(window) {
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

// Load as classic <script> elements, the way index.html does — `window.eval`
// would give each file its own lexical scope and they share top-level consts.
function runScript(window, src) {
  const el = window.document.createElement('script');
  el.textContent = src;
  window.document.body.appendChild(el);
}

// Pins `new Date()` and Date.now() to a fixed instant, leaving every explicit
// `new Date(...)` alone. Anything keyed on the weekday — the GROW arc runs Goal
// on Monday through Will on Friday — is otherwise a different test each day.
function freezeDate(window, iso) {
  const RealDate = window.Date;
  const fixed = new RealDate(iso).getTime();
  function FakeDate(...args) {
    return args.length === 0 ? new RealDate(fixed) : new RealDate(...args);
  }
  FakeDate.prototype = RealDate.prototype;
  FakeDate.now = () => fixed;
  FakeDate.parse = RealDate.parse;
  FakeDate.UTC = RealDate.UTC;
  window.Date = FakeDate;
}

export function bootApp({ speechRecognition = null, online = true, now = null, storage = null, checkinPaused = false } = {}) {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
    runScripts: 'dangerously',
    url: 'http://localhost:3737/',
    pretendToBeVisual: true
  });
  const { window } = dom;
  // Mirrors index.html: local-only, so app.js renders itself off DOMContentLoaded
  // rather than waiting for a cloud bridge to hand it state. See ADR-0015.
  window.__ctapSupabaseActive = false;
  // The check-in is paused in the shipped build (CHECKIN_PAUSED in data.cjs);
  // its tests still exercise it, and pass checkinPaused: true to see it hidden.
  if (!checkinPaused) window.__ctapCheckinPreview = true;
  const advance = installClock(window);
  if (speechRecognition) window.SpeechRecognition = speechRecognition;
  if (!online) Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
  // Before the scripts run — app.js resolves the current week at load time.
  if (now) freezeDate(window, now);
  // Seed preferences the way a returning engineer's phone already has them:
  // app.js reads jcpd_* at first render, so setting them after boot is too late.
  if (storage) for (const [k, v] of Object.entries(storage)) window.localStorage.setItem(k, v);

  runScript(window, dataSrc);
  runScript(window, appSrc);
  // JSDOM has already fired DOMContentLoaded by the time these scripts are
  // appended, so app.js's own listener never runs — refire it on `document`,
  // which is where app.js listens, so tests boot through the shipped path.
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  if (!window.document.querySelector('.bottom-nav')) {
    throw new Error('app did not render on DOMContentLoaded — boot path broken');
  }

  const $ = (s) => window.document.querySelector(s);
  const $$ = (s) => [...window.document.querySelectorAll(s)];
  const click = (sel) => {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el) throw new Error(`no element for ${sel}`);
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
  };
  const setValue = (sel, value, event = 'change') => {
    const el = $(sel);
    if (!el) throw new Error(`no element for ${sel}`);
    el.value = value;
    el.dispatchEvent(new window.Event(event, { bubbles: true }));
  };

  return { window, doc: window.document, $, $$, click, setValue, advance, state: () => window.__ctapGetState() };
}
