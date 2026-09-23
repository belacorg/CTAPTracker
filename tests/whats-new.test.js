// Which version a phone is on, and what changed.
//
// Settings used to say "v0.8.0" and never changed, so there was no way to
// tell whether an engineer's phone had picked up the latest update.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { APP_BUILD, CHANGELOG, unseenChanges } from '../app/data.cjs';
import { bootApp } from './helpers/app-harness.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NOW = '2026-09-24T10:00:00';
const STATE = JSON.stringify({ baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
  weeks: { '2026-09-14': { deductionMins: 0, days: { '2026-09-15': [
    { id: 'gas_repair', name: 'Gas Repair', creditMins: 56, ts: 1 }] } } },
  checkins: {}, coachGoals: {} });
const EXISTING = { jct_state: STATE, jcpd_setup_dismissed: 'true', jcpd_howto_seen: 'true', jcpd_name: 'Sam' };

describe('the build number is the one the phone actually loaded', () => {
  it('matches the cache-bust on index.html, so it changes exactly when the code does', () => {
    const html = readFileSync(join(ROOT, 'app/index.html'), 'utf8');
    const busts = [...html.matchAll(/\?v=(\d+)/g)].map(m => Number(m[1]));
    expect(busts.length).toBeGreaterThan(0);
    busts.forEach(v => expect(v).toBe(APP_BUILD));
  });

  it('has a changelog whose newest entry is no later than the build', () => {
    expect(CHANGELOG[0].build).toBeLessThanOrEqual(APP_BUILD);
    const builds = CHANGELOG.map(e => e.build);
    expect([...builds].sort((a, b) => b - a)).toEqual(builds);   // newest first
  });

  it('shows the build in Settings', () => {
    const h = bootApp({ now: NOW, storage: { ...EXISTING, jcpd_seen_build: String(APP_BUILD) } });
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'settings'));
    expect(h.$('#app-build').textContent).toBe(`Build ${APP_BUILD}`);
    expect(h.$('.settings-content, main').textContent).not.toContain('v0.8.0');
  });
});

describe('what the phone has not seen yet', () => {
  it('shows an upgrading engineer everything on the list', () => {
    expect(unseenChanges(null, true)).toHaveLength(CHANGELOG.length);
  });
  it('tells a fresh install nothing — there is nothing to catch up on', () => {
    expect(unseenChanges(null, false)).toEqual([]);
  });
  it('shows only what came after the last update seen', () => {
    expect(unseenChanges(199, true).map(e => e.build)).toEqual([200]);
  });
  it('shows nothing once the latest has been seen', () => {
    expect(unseenChanges(APP_BUILD, true)).toEqual([]);
  });
});

describe('the "What’s new" sheet', () => {
  const sheet = (h) => h.$('#whatsnew-sheet:not(.hidden)');

  it('opens by itself after an update', () => {
    const h = bootApp({ now: NOW, storage: EXISTING });
    expect(sheet(h)).toBeTruthy();
    expect(sheet(h).textContent).toContain(`build ${APP_BUILD}`);
  });

  it('does not come back once dismissed', () => {
    const h = bootApp({ now: NOW, storage: EXISTING });
    h.click('#whatsnew-done');
    expect(sheet(h)).toBeNull();
    expect(h.window.localStorage.getItem('jcpd_seen_build')).toBe(String(APP_BUILD));
    const again = bootApp({ now: NOW, storage: { ...EXISTING, jcpd_seen_build: String(APP_BUILD) } });
    expect(sheet(again)).toBeNull();
  });

  it('comes back if the app is closed before it is read', () => {
    // Seen is recorded on "Got it", not on showing, so an engineer who opens
    // the app and closes it straight away is told next time.
    const h = bootApp({ now: NOW, storage: EXISTING });
    expect(h.window.localStorage.getItem('jcpd_seen_build')).toBeNull();
  });

  it('never opens on a brand-new phone', () => {
    const h = bootApp({ now: NOW });
    expect(sheet(h)).toBeNull();
    expect(h.window.localStorage.getItem('jcpd_seen_build')).toBe(String(APP_BUILD));
  });

  it('shows the whole history from Settings, whatever has been seen', () => {
    const h = bootApp({ now: NOW, storage: { ...EXISTING, jcpd_seen_build: String(APP_BUILD) } });
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'settings'));
    h.click('#open-changelog');
    expect(h.$$('#whatsnew-sheet .whatsnew-entry')).toHaveLength(CHANGELOG.length);
    expect(h.$('#whatsnew-sheet').textContent).toContain('This phone');
  });
});
