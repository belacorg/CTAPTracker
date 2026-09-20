// The pace projection used to lose today.
//
// A day with nothing logged on it yet fell into neither bucket — not "worked",
// not "remaining" — so every morning until the first job landed, the projection
// assumed today would produce nothing AND withheld it as a chance to recover.
// The engineer was told they were heading for a shortfall they weren't. The
// Weekly Forecast sheet counted the same day correctly all along, so the two
// disagreed on the same morning.
//
// Needs the real clock frozen: getCoachInsights reads getTodayKey() directly,
// and only produces this insight for the actual current week.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const job = (h) => ({ id: 'gas_repair', name: 'Gas Repair', creditMins: Math.round(h * 60), ts: 1 });
const WEDNESDAY = '2026-09-23T15:00:00';     // week of Mon 21 – Sun 27

const boot = (days) => {
  const state = {
    baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0, checkins: {}, coachGoals: {},
    weeks: { '2026-09-21': { deductionMins: 0, days } }
  };
  const h = bootApp({ now: WEDNESDAY, storage: {
    jct_state: JSON.stringify(state), jcpd_setup_dismissed: 'true',
    jcpd_howto_seen: 'true', jcpd_name: 'Jake', jcpd_coach_mode: 'true'
  } });
  h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
  return h;
};
const projectionTip = (h) =>
  h.$$('.tip-text').map(e => e.textContent).find(t => /current pace/.test(t));

describe('the pace projection counts today while it is still open', () => {
  it('projects across Wednesday too, not just Thursday and Friday', () => {
    // 14.2h over Mon and Tue is 7.1h a day. Three working days are left.
    const tip = projectionTip(boot({ '2026-09-21': [job(7.0)], '2026-09-22': [job(7.2)] }));
    expect(tip).toBeTruthy();
    expect(tip).toContain('35.50h');          // 14.2 + 7.1 × 3 — was 28.40h
    expect(tip).toContain('above target');    // was "3.60h short of target"
  });

  it('drops today from the remaining days once it has been logged on', () => {
    const tip = projectionTip(boot({
      '2026-09-21': [job(7.0)], '2026-09-22': [job(7.2)], '2026-09-23': [job(7.1)]
    }));
    expect(tip).toContain('35.50h');          // 21.3h over three days, two left
  });

  it('does not pretend a genuinely behind week is fine', () => {
    // 4h over two days is 2h a day; three days left gets nowhere near 32h.
    const tip = projectionTip(boot({ '2026-09-21': [job(2.1)], '2026-09-22': [job(1.9)] }));
    expect(tip).toContain('short of target');
    expect(tip).toContain('10.00h');          // 4 + 2 × 3
  });

  it('agrees with the Weekly Forecast sheet on the same morning', () => {
    const h = boot({ '2026-09-21': [job(7.0)], '2026-09-22': [job(7.2)] });
    const tip = projectionTip(h);
    h.click('#week-tile');
    const sheet = h.$('.forecast-sheet, .sheet-panel');
    expect(sheet, 'forecast sheet opened').toBeTruthy();
    const sheetText = sheet.textContent.replace(/\s+/g, ' ');
    // Both sides count three days left and project the same finish, so neither
    // can quietly contradict the other about what the week still holds.
    expect(sheetText).toMatch(/Days left\s*3\b/);
    expect(sheetText).toContain('35.50h');
    expect(tip).toContain('35.50h');
  });
});

// The week tile used to print the target before NPT came off, while the
// progress bar, "still needed" and the bonus all used the figure after it. An
// engineer with 4h of NPT read "Target 32.0h", was told they needed 21.00h
// having earned 7.00h, and could not make those add up.
describe('the week tile shows the target actually in use', () => {
  const bootNpt = (nptMins) => {
    const state = {
      baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0, checkins: {}, coachGoals: {},
      weeks: { '2026-09-21': {
        deductionMins: nptMins,
        deductionLog: nptMins ? [{ name: 'NPT', mins: nptMins, date: '2026-09-22' }] : [],
        days: { '2026-09-21': [{ id: 'gas_repair', name: 'Gas Repair', creditMins: 420, ts: 1 }] }
      } }
    };
    const h = bootApp({ now: WEDNESDAY, storage: {
      jct_state: JSON.stringify(state), jcpd_setup_dismissed: 'true',
      jcpd_howto_seen: 'true', jcpd_name: 'Jake', jcpd_coach_mode: 'true'
    } });
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    return h;
  };

  it('takes NPT off the figure on the tile, and says it has', () => {
    const h = bootNpt(240);
    expect(h.$('.week-rostered-row').textContent).toContain('Target 28.0h');
    expect(h.$('.week-target-basis').textContent).toBe('40.0h rostered × 80%, less 4.00h NPT');
  });

  it('earned plus still-needed comes to the target on the tile', () => {
    const h = bootNpt(240);
    const target = parseFloat(h.$('.week-rostered-row').textContent.match(/Target ([\d.]+)h/)[1]);
    const needed = parseFloat(
      h.$$('.coach-msg').map(e => e.textContent).find(t => /You need/.test(t)).match(/You need ([\d.]+)h/)[1]);
    expect(7 + needed).toBeCloseTo(target, 1);
  });

  it('says nothing about NPT when there is none', () => {
    const h = bootNpt(0);
    expect(h.$('.week-rostered-row').textContent).toContain('Target 32.0h');
    expect(h.$('.week-target-basis').textContent).toBe('40.0h rostered × 80%');
  });
});
