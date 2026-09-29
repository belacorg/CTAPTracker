// Build 201: three things the trial engineers hit in their first week.
//
// - Wait Work asked for hours. A wait is 10, 20, 30 minutes — 11 minutes — and
//   rarely a whole hour, so typing 0.18 of an hour was the only way to log one.
// - A rest day could only be made by clearing a day's times; the one button on
//   the row was Leave, so engineers reached for annual leave instead.
// - The day note lived on the Schedule. Engineers log as they go, so the note
//   belongs after the job on Log Job, where it reads in order.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const WEDNESDAY = '2026-09-23T12:00:00';
const WEEK = '2026-09-21';
const MON = '2026-09-21', TUE = '2026-09-22', WED = '2026-09-23', FRI = '2026-09-25', SAT = '2026-09-26';

const boot = (weeks = {}) => bootApp({ now: WEDNESDAY, storage: {
  jct_state: JSON.stringify({ baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
    weeks, checkins: {}, coachGoals: {} }),
  jcpd_setup_dismissed: 'true', jcpd_howto_seen: 'true', jcpd_name: 'Jake', jcpd_seen_build: '201'
} });
const tab = (h, t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
const week = (h) => h.state().weeks[WEEK] || {};
const shift = (h, dk) => ((week(h).shifts) || {})[dk] || {};
const nineToFive = { start: '08:00', end: '16:30', lunch: '30' };

describe('Wait Work in minutes', () => {
  it('asks for minutes and credits them minute for minute', () => {
    const h = boot();
    h.click(h.$$('.lj-cat-tile').find(t => t.dataset.logCat === 'absent'));
    h.click('.lj-row[data-job-id="wait_work"]');
    expect(h.$('#modal-desc').textContent).toMatch(/minutes/i);
    expect(h.$('#modal-input').placeholder).toBe('e.g. 45');
    h.$('#modal-input').value = '11';
    h.click('#modal-confirm');
    const e = week(h).days[WED].at(-1);
    expect(e).toMatchObject({ id: 'wait_work', creditMins: 11, variableInput: '11min' });
  });

  it('leaves Wait Work logged in hours by an earlier build exactly as it was', () => {
    const old = { id: 'wait_work', name: 'Wait Work', creditMins: 90, variableInput: '1.5h', ts: 1758000000000 };
    const h = boot({ [WEEK]: { deductionMins: 0, days: { [TUE]: [old] } } });
    tab(h, 'dashboard');
    expect(week(h).days[TUE]).toEqual([old]);
  });
});

describe('marking a rest day on the Schedule', () => {
  const restBtn = (h, dk) => h.$(`[data-action="toggle-rest"][data-day="${dk}"]`);

  it('makes a day a rest day in one tap, even in a week with no times', () => {
    const h = boot();
    tab(h, 'schedule');
    h.click(restBtn(h, WED));
    expect(shift(h, WED).rest).toBe(true);
    expect(h.window.isRestDay(week(h), WED)).toBe(true);
    expect(h.window.isRestDay(week(h), MON)).toBe(false);   // the rest of the week still works Mon–Fri
    expect(restBtn(h, WED).getAttribute('aria-pressed')).toBe('true');
    expect(h.$(`[data-action="edit-shift"][data-day="${WED}"]`).textContent).toMatch(/Rest day/);
  });

  it('takes the times and any leave off the day, and keeps its note', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: {
      [MON]: nineToFive, [WED]: { ...nineToFive, note: 'Dentist' }, [FRI]: { leave: true } } } });
    tab(h, 'schedule');
    h.click(restBtn(h, WED));
    h.click(restBtn(h, FRI));
    expect(shift(h, WED)).toEqual({ rest: true, note: 'Dentist' });
    expect(shift(h, FRI)).toEqual({ rest: true });
  });

  it('shows the rest days a rota already implies as rest days', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [MON]: nineToFive, [TUE]: nineToFive } } });
    tab(h, 'schedule');
    expect(restBtn(h, FRI).getAttribute('aria-pressed')).toBe('true');
    expect(restBtn(h, MON).getAttribute('aria-pressed')).toBe('false');
  });

  it('turns a rest day back into a working day by asking for its times', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [MON]: nineToFive, [FRI]: { rest: true } } } });
    tab(h, 'schedule');
    h.click(restBtn(h, FRI));
    expect(h.$('#shift-sheet')).toBeTruthy();
    h.click('#shift-confirm');
    expect(shift(h, FRI).rest).toBeUndefined();
    expect(shift(h, FRI).start).toBe('08:00');
    expect(h.window.isRestDay(week(h), FRI)).toBe(false);
  });

  it('turns a rest day off outright in a week that has no times', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { rest: true } } } });
    tab(h, 'schedule');
    h.click(restBtn(h, WED));
    expect(h.$('#shift-sheet')).toBeNull();
    expect(h.window.isRestDay(week(h), WED)).toBe(false);
  });

  it('keeps the week’s rostered hours when a day is rested (ADR-0017)', () => {
    const h = boot();
    tab(h, 'schedule');
    const before = h.window.weekTargetHours(h.state(), WEEK);
    h.click(restBtn(h, WED));
    expect(h.window.weekTargetHours(h.state(), WEEK)).toBe(before);
    expect(h.window.getDailyTarget(h.state(), week(h), WED)).toBe(0);
  });

  it('marks a rest day from the shift sheet too', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [SAT]: nineToFive } } });
    tab(h, 'schedule');
    h.click(`[data-action="edit-shift"][data-day="${SAT}"]`);
    h.click('#shift-clear');
    expect(shift(h, SAT)).toEqual({ rest: true });
  });
});

describe('a note after the job on Log Job', () => {
  const type = (h, text) => h.setValue('.lj-note-input', text, 'input');

  it('adds a note under the day’s jobs and saves it as it is typed', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {
      [WED]: [{ id: 'gas_repair', name: 'Gas Repair (any appliance)', creditMins: 56, variableInput: null, ts: 1 }] } } });
    h.click('[data-lj-note-open]');
    type(h, 'Customer not in, carded');
    expect(shift(h, WED).note).toBe('Customer not in, carded');
    h.click('[data-lj-note-done]');
    const rows = h.$$('.lj-log-list > *');
    expect(rows.at(-1).textContent).toContain('Customer not in, carded');   // after the job
  });

  it('is the same note the Schedule shows for that day', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { ...nineToFive, note: 'Van MOT' } } } });
    expect(h.$('.lj-note-row').textContent).toContain('Van MOT');
    h.click('[data-lj-note-open]');
    type(h, 'Van MOT, back by 11');
    tab(h, 'schedule');
    h.click(`[data-action="toggle-note"][data-day="${WED}"]`);
    expect(h.$(`.sched-note-input[data-day="${WED}"]`).value).toBe('Van MOT, back by 11');
    expect(shift(h, WED)).toMatchObject(nineToFive);
  });

  it('can be added on a day with nothing logged yet', () => {
    const h = boot();
    h.click('[data-lj-note-open]');
    type(h, 'Training day');
    expect(shift(h, WED).note).toBe('Training day');
  });

  it('shows Edit where a job shows its hours, and a ✕ that deletes the note', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { ...nineToFive, note: 'Van MOT' } } } });
    const row = h.$('.lj-note-row');
    expect(row.querySelector('.lj-log-credit').textContent.trim()).toBe('Edit');
    h.click(row.querySelector('.lj-log-credit'));
    expect(h.$('.lj-note-input').value).toBe('Van MOT');
    h.click('[data-lj-note-done]');
    h.click('.lj-note-row .lj-log-del');
    expect(shift(h, WED).note).toBeUndefined();
    expect(shift(h, WED)).toMatchObject(nineToFive);
    expect(h.$('.lj-note-row')).toBeNull();
    expect(h.$('[data-lj-note-open]').textContent).toContain('Add a note');
  });

  it('removes the note when it is emptied', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { note: 'x' } } } });
    h.click('[data-lj-note-open]');
    type(h, '   ');
    expect(shift(h, WED).note).toBeUndefined();
  });

  it('shows a note as text, never as markup', () => {
    const h = boot({ [WEEK]: { deductionMins: 0, days: {}, shifts: { [WED]: { note: '<img src=x onerror=alert(1)>' } } } });
    expect(h.$('.lj-note-row img')).toBeNull();
    expect(h.$('.lj-note-row').textContent).toContain('<img');
  });
});
