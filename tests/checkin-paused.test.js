// The daily check-in is paused for the start of the trial while its questions
// are rewritten. Paused means gone from every screen, not deleted: check-ins
// already on a phone must still be there when it comes back.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const TODAY = '2026-09-21T10:00:00';
const storage = {
  jct_state: JSON.stringify({
    baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
    weeks: {}, checkins: { '2026-09-18': { ratings: {}, note: 'kept' } }, coachGoals: {}
  }),
  jcpd_setup_dismissed: 'true',
  jcpd_howto_seen: 'true',
  jcpd_checkin_on: 'true'
};
const nav = (h, tab) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === tab));

describe('the paused check-in', () => {
  it('shows no check-in card on the Dashboard, even for someone who had it on', () => {
    const h = bootApp({ storage, now: TODAY, checkinPaused: true });
    nav(h, 'dashboard');
    expect(h.$('.checkin-card')).toBeNull();
    expect(h.$('#checkin-open')).toBeNull();
  });

  it('has no Settings switch to turn it back on', () => {
    const h = bootApp({ storage, now: TODAY, checkinPaused: true });
    nav(h, 'settings');
    expect(h.$('#checkin-toggle')).toBeNull();
    expect(h.$$('.st-row-label').map(e => e.textContent).join(' ')).not.toContain('check-in');
  });

  it('keeps the check-ins already saved on the phone', () => {
    const h = bootApp({ storage, now: TODAY, checkinPaused: true });
    for (const tab of ['dashboard', 'history', 'settings']) nav(h, tab);
    expect(h.state().checkins['2026-09-18'].note).toBe('kept');
  });

  it('is what the shipped build does', () => {
    const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '../app/data.cjs'), 'utf8');
    expect(src).toMatch(/const CHECKIN_PAUSED = true;/);
  });
});
