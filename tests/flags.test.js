// Flagging a day, or a week, to check against the CTAP update.
//
// Something out of the ordinary — systems shut down, the laptop broken, a
// morning of downtime — and the engineer wants to be sure it was allowed for
// when the CTAP update lands. A flag marks the day with why, shows on Shift,
// and a calendar of flagged days is one tap away to check through. Checking a
// flag ticks it off; it stays on record. Nothing about the numbers changes.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';
import { listFlags, FLAG_REASONS } from '../app/data.cjs';

const WEDNESDAY = '2026-09-23T12:00:00';
const WEEK = '2026-09-21', LAST = '2026-09-14';
const TUE = '2026-09-22', WED = '2026-09-23', LAST_THU = '2026-09-17';
const nineToFive = { start: '08:00', end: '16:30', lunch: '30' };

const boot = (weeks = {}) => bootApp({ now: WEDNESDAY, storage: {
  jct_state: JSON.stringify({ baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
    weeks, checkins: {}, coachGoals: {} }),
  jcpd_setup_dismissed: 'true', jcpd_howto_seen: 'true', jcpd_name: 'Jake', jcpd_seen_build: '201'
} });
const tab = (h, t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
const shift = (h, wk, dk) => (((h.state().weeks[wk] || {}).shifts) || {})[dk] || {};

describe('flagging a day on Log Job', () => {
  it('flags today with a reason in two taps', () => {
    const h = boot();
    h.click('[data-flag-open="day:' + WED + '"]');
    expect(h.$$('[data-flag-set]').map(b => b.textContent)).toEqual(FLAG_REASONS.map(r => r.label));
    h.click('[data-flag-set="day:' + WED + '"][data-reason="kit"]');
    expect(shift(h, WEEK, WED).flag).toEqual({ reason: 'kit', checked: false });
    expect(h.$('.lj-flag-row').textContent).toMatch(/Laptop \/ kit\s*·\s*to check/);
  });

  it('flags the day being logged into, not always today', () => {
    const h = boot();
    h.click('[data-log-day-pick="' + TUE + '"]');
    h.click('[data-flag-open="day:' + TUE + '"]');
    h.click('[data-flag-set="day:' + TUE + '"][data-reason="systems"]');
    expect(shift(h, WEEK, TUE).flag.reason).toBe('systems');
    expect(shift(h, WEEK, WED).flag).toBeUndefined();
  });

  it('can be ticked off as checked and back, and removed', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { flag: { reason: 'van', checked: false } } } } });
    h.click('.lj-flag-row [data-flag-check]');
    expect(shift(h, WEEK, WED).flag.checked).toBe(true);
    h.click('.lj-flag-row [data-flag-check]');
    expect(shift(h, WEEK, WED).flag.checked).toBe(false);
    h.click('.lj-flag-row [data-flag-clear]');
    expect(shift(h, WEEK, WED).flag).toBeUndefined();
  });

  it('keeps the day’s times and note when flagged or unflagged', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { ...nineToFive, note: 'Laptop died at 10' } } } });
    h.click('[data-flag-open="day:' + WED + '"]');
    h.click('[data-flag-set="day:' + WED + '"][data-reason="kit"]');
    h.click('.lj-flag-row [data-flag-clear]');
    expect(shift(h, WEEK, WED)).toEqual({ ...nineToFive, note: 'Laptop died at 10' });
  });

  it('changes none of the numbers', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: nineToFive, [TUE]: nineToFive } } });
    const w = () => h.state().weeks[WEEK];
    const before = [h.window.weekTargetHours(h.state(), WEEK), h.window.getDailyTarget(h.state(), w(), WED)];
    h.click('[data-flag-open="day:' + WED + '"]');
    h.click('[data-flag-set="day:' + WED + '"][data-reason="downtime"]');
    expect([h.window.weekTargetHours(h.state(), WEEK), h.window.getDailyTarget(h.state(), w(), WED)]).toEqual(before);
  });
});

describe('flags on the Shift tab', () => {
  it('marks a flagged day under its date', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [TUE]: { ...nineToFive, flag: { reason: 'systems', checked: false } } } } });
    tab(h, 'schedule');
    const row = h.$(`[data-action="edit-shift"][data-day="${TUE}"]`).closest('.shift-row');
    expect(row.querySelector('.sched-flag')).toBeTruthy();
    expect(h.$(`[data-action="edit-shift"][data-day="${WED}"]`).closest('.shift-row').querySelector('.sched-flag')).toBeNull();
  });

  it('flags a day from its + panel, beside the note', () => {
    const h = boot();
    tab(h, 'schedule');
    h.click(`[data-action="toggle-note"][data-day="${TUE}"]`);
    h.click('.sched-note-panel [data-flag-open]');
    h.click('.sched-note-panel [data-reason="systems"]');
    expect(shift(h, WEEK, TUE).flag).toEqual({ reason: 'systems', checked: false });
  });

  it('flags a whole week', () => {
    const h = boot();
    tab(h, 'schedule');
    h.click('[data-flag-open="week:' + WEEK + '"]');
    h.click('[data-flag-set="week:' + WEEK + '"][data-reason="systems"]');
    expect(h.state().weeks[WEEK].flag).toEqual({ reason: 'systems', checked: false });
    expect(h.$('.sched-week-flag').textContent).toContain('Systems down');
  });

  it('counts what is still to check on the Flagged button', () => {
    const h = boot({
      [WEEK]: { deductionMins: 0, days: {}, flag: { reason: 'other', checked: true },
        shifts: { [TUE]: { flag: { reason: 'systems', checked: false } } } },
      [LAST]: { deductionMins: 0, days: {}, shifts: { [LAST_THU]: { flag: { reason: 'van', checked: false } } } }
    });
    tab(h, 'schedule');
    expect(h.$('#open-flags .flags-count').textContent).toBe('2');
  });

  it('keeps a day’s flag and note when Standard week is applied', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [TUE]: { note: 'IT outage', flag: { reason: 'systems', checked: false } } } } });
    tab(h, 'schedule');
    h.click('#apply-default');
    expect(shift(h, WEEK, TUE)).toMatchObject({ start: '08:00', note: 'IT outage', flag: { reason: 'systems' } });
  });
});

describe('the Flagged calendar', () => {
  const seeded = () => boot({
    [WEEK]: { deductionMins: 0, days: {}, shifts: { [TUE]: { note: 'Systems off till 11', flag: { reason: 'systems', checked: false } } } },
    [LAST]: { deductionMins: 0, days: {}, flag: { reason: 'kit', checked: false },
      shifts: { [LAST_THU]: { flag: { reason: 'van', checked: true } } } }
  });
  const open = (h) => { tab(h, 'schedule'); h.click('#open-flags'); return h.$('#flag-sheet'); };

  it('opens on this month with flagged days marked', () => {
    const h = seeded();
    expect(open(h).querySelector('.flagcal-month').textContent).toBe('September 2026');
    const day = h.$(`#flag-sheet [data-flag-go="day:${TUE}"]`);
    expect(day.classList.contains('is-flag')).toBe(true);
    expect(day.classList.contains('is-checked')).toBe(false);
    expect(h.$(`#flag-sheet .flagcal-day.is-checked[data-flag-go="day:${LAST_THU}"]`)).toBeTruthy();
    expect(h.$$('#flag-sheet .flagcal-week.wk-flag')).toHaveLength(1);
  });

  it('lists what is still to check, oldest first, with the day note', () => {
    const h = seeded();
    open(h);
    const items = h.$$('#flag-sheet .flag-item:not(.is-checked)').map(i => i.textContent.replace(/\s+/g, ' '));
    expect(items).toHaveLength(2);
    expect(items[0]).toMatch(/Week 38 .* Laptop \/ kit/);
    expect(items[1]).toMatch(/Tue 22 Sept.*Systems down — Systems off till 11/);
  });

  it('ticks a flag off from the list', () => {
    const h = seeded();
    open(h);
    h.click(`#flag-sheet [data-flag-check="day:${TUE}"]`);
    expect(shift(h, WEEK, TUE).flag.checked).toBe(true);
    expect(h.$('#flag-sheet')).toBeTruthy();                       // stays open to carry on checking
  });

  it('goes to a flagged week from the list', () => {
    const h = seeded();
    open(h);
    h.click(`#flag-sheet .flag-item-main[data-flag-go="week:${LAST}"]`);
    expect(h.$('#flag-sheet')).toBeNull();
    expect(h.$('.sched-nav-wk').textContent).toBe('Week 38');
    expect(h.$('.sched-week-flag').textContent).toContain('Laptop / kit');
  });

  it('jumps to a flagged day’s week with its note and flag open', () => {
    const h = seeded();
    open(h);
    h.click('[data-flag-month="-1"]');
    h.click('[data-flag-month="1"]');
    h.click(`#flag-sheet .flagcal-day[data-flag-go="day:${LAST_THU}"]`);
    expect(h.$('#flag-sheet')).toBeNull();
    expect(h.$('.sched-nav-wk').textContent).toBe('Week 38');
    expect(h.$(`.sched-note-input[data-day="${LAST_THU}"]`)).toBeTruthy();
    expect(h.$('.sched-note-panel .flag-line').textContent).toContain('Van');
  });

  it('moves between months', () => {
    const h = seeded();
    open(h);
    h.click('[data-flag-month="1"]');
    expect(h.$('.flagcal-month').textContent).toBe('October 2026');
    h.click('[data-flag-month="-1"]');
    h.click('[data-flag-month="-1"]');
    expect(h.$('.flagcal-month').textContent).toBe('August 2026');
  });

  it('says so when nothing is flagged', () => {
    const h = boot();
    open(h);
    expect(h.$('#flag-sheet .flag-list-empty')).toBeTruthy();
  });
});

describe('listFlags', () => {
  it('collects day and week flags from every week, oldest first', () => {
    const f = listFlags({ weeks: {
      [WEEK]: { shifts: { [TUE]: { flag: { reason: 'systems' } }, [WED]: { note: 'no flag' } } },
      [LAST]: { flag: { reason: 'kit', checked: true } }
    } });
    expect(f.map(x => [x.kind, x.dayKey, x.checked])).toEqual([['week', LAST, true], ['day', TUE, false]]);
  });
});
