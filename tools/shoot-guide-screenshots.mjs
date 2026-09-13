// Regenerates the screenshots in docs/guide/screenshots/.
//
// The guide is the document the trial engineers read, so its pictures have to
// match the app they open. Shooting them by hand meant they drifted — the old
// set had a sign-in screen in it months after sign-in was removed.
//
// Runs against the dev server with a seeded state (tools/demo-state.json: six
// completed weeks, a week in progress, a check-in streak), at iPhone dimensions
// and 3x DPR so the PNGs stay sharp when GitHub scales them down.
//
// Usage:
//   npm run dev                                     # in another terminal
//   npm i --no-save puppeteer-core
//   node tools/shoot-guide-screenshots.mjs docs/guide/screenshots
//
// puppeteer-core is installed --no-save on purpose: the app must not carry a
// browser dependency to photograph itself, and tools/ is outside the SHIP
// allowlist in build.mjs so none of this reaches an engineer's phone. It needs
// a Chrome on disk — set CHROME_PATH, or drop a chrome-path.txt beside this
// file.
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const HERE = new URL('.', import.meta.url).pathname;
const CHROME = process.env.CHROME_PATH || readFileSync(join(HERE, 'chrome-path.txt'), 'utf8').trim();
const STATE = readFileSync(join(HERE, 'demo-state.json'), 'utf8');
const OUT = process.argv[2] || join(HERE, 'out');
const URL_BASE = 'http://localhost:3737';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--font-render-hinting=none', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

// Pin the phone's clock to the moment the published set was shot. Without it a
// run takes today's date and moves "today" on every screen, pulling the guide's
// figures out of step with the demo page and the deck that reuse these images.
// The clock still ticks forward from that moment, so the greeting types itself
// in and the sprite animates as normal. Override with SHOOT_AT.
const SHOOT_AT = process.env.SHOOT_AT || '2026-09-12T20:30:00';
await page.evaluateOnNewDocument((iso) => {
  const RealDate = Date;
  const offset = new RealDate(iso).getTime() - RealDate.now();
  function PinnedDate(...args) {
    return args.length === 0 ? new RealDate(RealDate.now() + offset) : new RealDate(...args);
  }
  PinnedDate.prototype = RealDate.prototype;
  PinnedDate.now = () => RealDate.now() + offset;
  PinnedDate.parse = RealDate.parse;
  PinnedDate.UTC = RealDate.UTC;
  globalThis.Date = PinnedDate;
}, SHOOT_AT);
console.log('clock pinned to', SHOOT_AT);

const seed = async (raw) => {
  await page.goto(URL_BASE, { waitUntil: 'networkidle0' });
  await page.evaluate((s) => {
    localStorage.clear();
    if (s) localStorage.setItem('jct_state', s);
    localStorage.setItem('jcpd_theme', 'dark');
    localStorage.setItem('jcpd_coach_mode', 'true');
    localStorage.setItem('jcpd_checkin_on', 'true');
    localStorage.setItem('jcpd_name', 'Jake');
    if (s) {
      // A seeded phone is a phone that has been in use; the first-run card
      // would be noise in every shot but its own.
      localStorage.setItem('jcpd_setup_dismissed', 'true');
      localStorage.setItem('jcpd_howto_seen', 'true');
    }
  }, raw);
  await page.goto(URL_BASE, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 600));
};

const tab = async (t) => {
  await page.evaluate((t) => document.querySelector(`[data-tab="${t}"]`).click(), t);
  await new Promise((r) => setTimeout(r, 500));
};

const shot = async (name, opts = {}) => {
  await page.screenshot({ path: join(OUT, name), ...opts });
  console.log('  ✓', name);
};

// Clip to the element's own box, no padding. Dashboard cards stack 12px apart,
// so any padding wider than that pulls slivers of the neighbouring cards into
// the crop — which is exactly what the first set shipped with at pad = 14.
const shotEl = async (name, selector, pad = 0) => {
  const box = await page.evaluate((sel, pad) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.width + pad * 2, height: r.height + pad * 2 };
  }, selector, pad);
  if (!box) { console.log('  ✗ MISSING', name, selector); return false; }
  await shot(name, { clip: box });
  return true;
};

// The Dashboard greeting types itself in and then rolls three dots — roughly
// text.length * 52ms + 1140ms. Shots taken before it settles read "Good evenin".
const settle = () => new Promise((r) => setTimeout(r, 2600));

console.log('seeded phone:');
await seed(STATE);

await tab('dashboard');
await settle();
await shot('dashboard.png');
await shotEl('job-credits-hero.png', '.hero-jobs-card');
await shotEl('ctap-tile.png', '#ctap-tile');
await shotEl('week-tile.png', '#week-tile');
await shotEl('coach-card.png', '.coach-card');
await shotEl('checkin-card.png', '.checkin-card');

// Today's jobs sits below the fold.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise((r) => setTimeout(r, 500));
await shot('todays-jobs.png');
await page.evaluate(() => window.scrollTo(0, 0));

// Cash-out sheet — what the balance is worth after tax.
await page.evaluate(() => document.querySelector('#ctap-tile').click());
await new Promise((r) => setTimeout(r, 700));
await shot('cashout-sheet.png');
await page.evaluate(() => {
  const c = document.querySelector('#cashout-close') || document.querySelector('#cashout-backdrop');
  if (c) c.click();
});
await new Promise((r) => setTimeout(r, 500));

// Weekly forecast sheet.
await page.evaluate(() => document.querySelector('#week-tile').click());
await new Promise((r) => setTimeout(r, 700));
await shot('forecast-sheet.png');
await page.keyboard.press('Escape');
await page.evaluate(() => {
  const c = document.querySelector('.forecast-close') || document.querySelector('.forecast-backdrop');
  if (c) c.click();
});
await new Promise((r) => setTimeout(r, 500));

await tab('log');
await shot('log-job.png');
await shotEl('voice-prompt.png', '.lj-voice');

await tab('schedule');
await shot('schedule.png');

await tab('history');
await shot('history.png');

await tab('settings');
await shot('settings.png');

// A phone that has never been used — the only state the setup card exists in.
console.log('fresh phone:');
await seed(null);
await tab('dashboard');
await settle();
await shot('setup-card.png');

await browser.close();
console.log('done ->', OUT);
