// One week, one target — across screens and across the moment it stops being
// the current week.
//
// The Dashboard's live tile read effectiveTargetHours while History, the
// balance and bonusAchieved read the bare rostered × pct formula. So a week
// silently changed what it had been asking for the moment it became a past
// week: earn 29h against a 30h rolling target and the week read "Below target"
// on the Sunday and "On track" on the Monday, off the same stored jobs.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

// Four weeks averaging 30h behind a 32h employer bar. Before ADR-0022 the
// Dashboard answered 30h here and History answered 32h for the same week.
const week = (hours) => ({
  deductionMins: 0,
  days: { '2026-01-01': [{ id: 'gas_repair', name: 'Gas Repair', creditMins: Math.round(hours * 60), ts: 1 }] }
});
const STATE = JSON.stringify({
  baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
  weeks: {
    '2026-08-17': week(28), '2026-08-24': week(30),
    '2026-08-31': week(31), '2026-09-07': week(31),
    '2026-09-14': week(29)
  },
  checkins: {}, coachGoals: {}
});
const storage = {
  jct_state: STATE,
  jcpd_setup_dismissed: 'true',
  jcpd_howto_seen: 'true',
  jcpd_name: 'Jake'
};

const nav = (h, tab) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === tab));

// The target the History row prints for the week of 14 Sept.
const historyTarget = (h) => {
  const row = h.$$('.history-item').find(r => r.dataset.gotoWeek === '2026-09-14');
  const m = row.querySelector('.hi-credits').textContent.match(/([\d.]+)h\s*\/\s*([\d.]+)h target/);
  return { earned: parseFloat(m[1]), target: parseFloat(m[2]), text: row.querySelector('.hi-credits').textContent };
};

describe('a week keeps its target when it stops being the current week', () => {
  it('reads the same target on the Dashboard during the week and in History after it', () => {
    // Friday of the week in question.
    const during = bootApp({ storage, now: '2026-09-18T09:00:00' });
    nav(during, 'dashboard');
    const shown = during.$('.week-rostered-row').textContent.match(/Target ([\d.]+)h/)[1];
    // The basis is always stated, and it is always the employer's bar.
    expect(during.$('.week-target-basis').textContent).toBe('40.0h rostered × 80%');
    expect(during.$('.week-target-basis').textContent).not.toContain('Rolling');
    expect(parseFloat(shown)).toBeCloseTo(32.0, 1);

    // The Monday after. Same stored jobs, same week, now in the past.
    const after = bootApp({ storage, now: '2026-09-21T09:00:00' });
    nav(after, 'history');
    expect(historyTarget(after).target).toBeCloseTo(parseFloat(shown), 1);
  });

  it('does not flip a miss into a hit overnight', () => {
    const during = bootApp({ storage, now: '2026-09-18T09:00:00' });
    nav(during, 'dashboard');
    const target = parseFloat(during.$('.week-rostered-row').textContent.match(/Target ([\d.]+)h/)[1]);
    expect(29).toBeLessThan(target);            // 29h earned, 32h asked — a miss

    const after = bootApp({ storage, now: '2026-09-21T09:00:00' });
    nav(after, 'history');
    const row = historyTarget(after);
    expect(row.earned).toBeCloseTo(29, 1);
    expect(row.text).not.toContain('Bonus ✓');  // still a miss on the Monday
  });

  it('renders every tab against a settled history without error', () => {
    const h = bootApp({ storage, now: '2026-09-21T09:00:00' });
    for (const tab of ['dashboard', 'schedule', 'history', 'settings', 'log']) {
      nav(h, tab);
      expect(h.$('#app').innerHTML, tab).not.toContain('Render Error');
    }
  });
});
