// Flagging a day to double-check against the CTAP update.
//
// An engineer wants to be reminded to check a day when the CTAP update comes
// in, and to find it again easily. One tap flags it (the day note says why, if
// they want), it shows on Shift, and a calendar of flagged days is one tap
// away. Checking a flag ticks it off; it stays on record. No numbers change.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';
import { listFlags } from '../app/data.cjs';

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
  it('flags today in one tap, asking for no reason', () => {
    const h = boot();
    h.click('[data-flag-set="' + WED + '"]');
    expect(shift(h, WEEK, WED).flag).toEqual({ checked: false });
    expect(h.$('.lj-flag-row').textContent).toMatch(/Flagged\s*·\s*to check/);
  });

  it('sits inside the day\u2019s card when nothing is logged yet', () => {
    const h = boot();
    expect(h.$('.lj-log-empty [data-flag-set]')).toBeTruthy();
    expect(h.$('.lj-log-empty [data-lj-note-open]')).toBeTruthy();
    h.click('[data-flag-set="' + WED + '"]');
    expect(h.$('.lj-log-head').textContent).toContain('Nothing logged yet');
    expect(h.$('.lj-log-head').textContent).not.toContain('0 logged');
  });

  it('flags the day being logged into, not always today', () => {
    const h = boot();
    h.click('[data-log-day-pick="' + TUE + '"]');
    h.click('[data-flag-set="' + TUE + '"]');
    expect(shift(h, WEEK, TUE).flag).toEqual({ checked: false });
    expect(shift(h, WEEK, WED).flag).toBeUndefined();
  });

  it('can be ticked off as checked and back, and removed', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { flag: { checked: false } } } } });
    h.click('.lj-flag-row [data-flag-check]');
    expect(shift(h, WEEK, WED).flag.checked).toBe(true);
    h.click('.lj-flag-row [data-flag-check]');
    expect(shift(h, WEEK, WED).flag.checked).toBe(false);
    h.click('.lj-flag-row [data-flag-clear]');
    expect(shift(h, WEEK, WED).flag).toBeUndefined();
  });

  it('keeps the day’s times and note when flagged or unflagged', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { ...nineToFive, note: 'Laptop died at 10' } } } });
    h.click('[data-flag-set="' + WED + '"]');
    h.click('.lj-flag-row [data-flag-clear]');
    expect(shift(h, WEEK, WED)).toEqual({ ...nineToFive, note: 'Laptop died at 10' });
  });

  it('changes none of the numbers', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: nineToFive, [TUE]: nineToFive } } });
    const w = () => h.state().weeks[WEEK];
    const before = [h.window.weekTargetHours(h.state(), WEEK), h.window.getDailyTarget(h.state(), w(), WED)];
    h.click('[data-flag-set="' + WED + '"]');
    expect([h.window.weekTargetHours(h.state(), WEEK), h.window.getDailyTarget(h.state(), w(), WED)]).toEqual(before);
  });
});

describe('flags on the Shift tab', () => {
  it('marks a flagged day under its date', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [TUE]: { ...nineToFive, flag: { checked: false } } } } });
    tab(h, 'schedule');
    const row = h.$(`[data-action="edit-shift"][data-day="${TUE}"]`).closest('.shift-row');
    expect(row.querySelector('.sched-flag')).toBeTruthy();
    expect(h.$(`[data-action="edit-shift"][data-day="${WED}"]`).closest('.shift-row').querySelector('.sched-flag')).toBeNull();
  });

  it('flags a day from its + panel, beside the note', () => {
    const h = boot();
    tab(h, 'schedule');
    h.click(`[data-action="toggle-note"][data-day="${TUE}"]`);
    h.click('.sched-note-panel [data-flag-set]');
    expect(shift(h, WEEK, TUE).flag).toEqual({ checked: false });
  });

  it('has no week flag, only days', () => {
    const h = boot();
    tab(h, 'schedule');
    expect(h.$('[data-flag-set^="week"]')).toBeNull();
    expect(h.$('#app').textContent).not.toMatch(/flag this week/i);
  });

  it('counts what is still to check on the Calendar button', () => {
    const h = boot({
      [WEEK]: { deductionMins: 0, days: {},
        shifts: { [TUE]: { flag: { checked: false } }, [WED]: { flag: { checked: true } } } },
      [LAST]: { deductionMins: 0, days: {}, shifts: { [LAST_THU]: { flag: { checked: false } } } }
    });
    tab(h, 'schedule');
    expect(h.$('#open-flags').textContent).toMatch(/Calendar\s*⚑ 2/);
  });

  it('keeps a day’s flag and note when Standard week is applied', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [TUE]: { note: 'IT outage', flag: { checked: false } } } } });
    tab(h, 'schedule');
    h.click('#apply-default');
    expect(shift(h, WEEK, TUE)).toMatchObject({ start: '08:00', note: 'IT outage', flag: { checked: false } });
  });
});

describe('the Calendar', () => {
  const seeded = () => boot({
    [WEEK]: { deductionMins: 0, days: {}, shifts: { [TUE]: { note: 'Systems off till 11', flag: { checked: false } } } },
    [LAST]: { deductionMins: 0, days: {},
      shifts: { [LAST]: { flag: { checked: false } }, [LAST_THU]: { flag: { checked: true } } } }
  });
  const open = (h) => { tab(h, 'schedule'); h.click('#open-flags'); return h.$('#flag-sheet'); };

  it('opens on this month with flagged days marked', () => {
    const h = seeded();
    expect(open(h).querySelector('#flag-sheet-title').textContent).toBe('Calendar');
    expect(h.$('.flagcal-month').textContent).toBe('September 2026');
    const day = h.$(`#flag-sheet [data-flag-go="day:${TUE}"]`);
    expect(day.classList.contains('is-flag')).toBe(true);
    expect(day.classList.contains('is-checked')).toBe(false);
    expect(h.$(`#flag-sheet .flagcal-day.is-checked[data-flag-go="day:${LAST_THU}"]`)).toBeTruthy();
    expect(h.$(`#flag-sheet .flagcal-day.is-flag[data-flag-go="day:${LAST}"]`)).toBeTruthy();
  });

  it('lists the flagged days still to check, oldest first, with the day note', () => {
    const h = seeded();
    open(h);
    expect(h.$('#flag-sheet .flag-list-head').textContent).toMatch(/Flagged days\s*2 to check/);
    const items = h.$$('#flag-sheet .flag-item:not(.is-checked)').map(i => i.textContent.replace(/\s+/g, ' '));
    expect(items).toHaveLength(2);
    expect(items[0]).toMatch(/Mon 14 Sept/);
    expect(items[1]).toMatch(/Tue 22 Sept.*Systems off till 11/);
  });

  it('ticks a flag off from the list', () => {
    const h = seeded();
    open(h);
    h.click(`#flag-sheet [data-flag-check="${TUE}"]`);
    expect(shift(h, WEEK, TUE).flag.checked).toBe(true);
    expect(h.$('#flag-sheet')).toBeTruthy();                       // stays open to carry on checking
  });

  it('takes a flagged day straight to its jobs on Log Job', () => {
    const h = seeded();
    open(h);
    h.click(`#flag-sheet .flagcal-day[data-flag-go="day:${TUE}"]`);
    expect(h.$('#flag-sheet')).toBeNull();
    expect(h.$('.bottom-nav button[data-tab="log"]').classList.contains('active')).toBe(true);
    expect(h.$('[data-log-day-pick="' + TUE + '"]').getAttribute('aria-pressed')).toBe('true');
    expect(h.$('.lj-flag-row').textContent).toMatch(/Flagged\s*·\s*to check/);
    expect(h.$('.lj-note-row').textContent).toContain('Systems off till 11');
  });

  it('takes a day in an earlier week to that week on Log Job', () => {
    const h = seeded();
    open(h);
    h.click(`#flag-sheet .flag-item-main[data-flag-go="day:${LAST_THU}"]`);
    expect(h.$('.lj-weeknav-label').textContent).toContain('Week 38');
    expect(h.$('[data-log-day-pick="' + LAST_THU + '"]').getAttribute('aria-pressed')).toBe('true');
  });

  it('opens any past day\u2019s jobs, flagged or not, but not days to come', () => {
    const h = seeded();
    open(h);
    expect(h.$('#flag-sheet button.flagcal-day[data-flag-go="day:2026-09-15"]')).toBeTruthy();
    expect(h.$('#flag-sheet button.flagcal-day[data-flag-go="day:2026-09-29"]')).toBeNull();
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
    expect(h.$('#flag-sheet .flag-list-empty').textContent).toContain('Want to be reminded to check a day');
    expect(h.$('#flag-sheet').textContent).not.toMatch(/out of the ordinary/i);
  });
});

describe('listFlags', () => {
  it('collects flagged days from every week, oldest first, with their notes', () => {
    const f = listFlags({ weeks: {
      [WEEK]: { shifts: { [TUE]: { flag: { checked: false }, note: ' Laptop ' }, [WED]: { note: 'no flag' } } },
      [LAST]: { shifts: { [LAST_THU]: { flag: { checked: true } } } }
    } });
    expect(f).toEqual([
      { weekKey: LAST, dayKey: LAST_THU, checked: true, note: '' },
      { weekKey: WEEK, dayKey: TUE, checked: false, note: 'Laptop' }
    ]);
  });
});
