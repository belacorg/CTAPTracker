// History does not grade a week that is still being worked.
//
// The row for the current week read "Below target" with a red dot from the
// first job on a Monday: 5h logged against a 32h target is 16%, and the row
// scored it as if the week had closed. The Dashboard beside it leads with the
// predicted week (ADR-0023), so the two tabs told the same engineer opposite
// things about the same week. The current row now says it is in progress and
// colours its dot from the prediction the Week tile prints.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const job = (hours, ts) => ({ id: 'gas_repair', name: 'Gas Repair', creditMins: Math.round(hours * 60), ts });

const withDays = (days) => ({
  jct_state: JSON.stringify({
    baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
    weeks: { '2026-09-14': { deductionMins: 0, days } },
    checkins: {}, coachGoals: {}
  }),
  jcpd_setup_dismissed: 'true',
  jcpd_howto_seen: 'true'
});

const nav = (h, tab) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === tab));
const currentRow = (h) => h.$$('.history-item').find(r => r.dataset.gotoWeek === '2026-09-14');

describe('the current week in History', () => {
  it('is not called "Below target" while it is still being worked', () => {
    // Monday 11:00, one 5h job in — on pace for 25h+ but only 16% banked.
    const h = bootApp({ storage: withDays({ '2026-09-14': [job(5, 1)] }), now: '2026-09-14T11:00:00' });
    nav(h, 'history');
    const row = currentRow(h);
    expect(row.textContent).not.toContain('Below target');
    expect(row.textContent).toContain('In progress');
  });

  it('colours its dot from the predicted week, not the running total', () => {
    // Mon–Wed at 7h a day: 21h banked (66%, red on the old rule), predicted 35h.
    const h = bootApp({
      storage: withDays({ '2026-09-14': [job(7, 1)], '2026-09-15': [job(7, 2)], '2026-09-16': [job(7, 3)] }),
      now: '2026-09-17T08:00:00'
    });
    nav(h, 'history');
    expect(currentRow(h).querySelector('.history-dot').classList.contains('green')).toBe(true);
  });

  it('still reads amber or red when the prediction falls short', () => {
    // Mon–Wed at 3h a day: predicted 15h against 32h.
    const h = bootApp({
      storage: withDays({ '2026-09-14': [job(3, 1)], '2026-09-15': [job(3, 2)], '2026-09-16': [job(3, 3)] }),
      now: '2026-09-17T08:00:00'
    });
    nav(h, 'history');
    expect(currentRow(h).querySelector('.history-dot').classList.contains('red')).toBe(true);
  });

  it('grades a finished week exactly as before', () => {
    const h = bootApp({ storage: withDays({ '2026-09-14': [job(5, 1)] }), now: '2026-09-22T09:00:00' });
    nav(h, 'history');
    expect(currentRow(h).textContent).toContain('Below target');
  });
});
