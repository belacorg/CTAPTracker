// Setting a working week on the Schedule, and seeing all of it in the Forecast.
//
// Three problems an engineer hit in the trial:
// - The iPhone time wheel closed after the first scroll. The app saved and
//   redrew the whole Schedule on every change, which threw away the input the
//   wheel belonged to, so an hour could be picked but never the minutes.
// - Nothing copied a shift. An engineer on 08:30–17:00 typed it in day by day,
//   and Standard week only knows 08:00–16:30, Monday to Friday. Weeks are not
//   that tidy either: Monday to Thursday, off Friday, back in on Saturday.
// - The Weekly Forecast stopped at Friday, so a Saturday shift was invisible.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

// Wednesday 9 September 2026; the week runs Monday 7 to Sunday 13.
const NOW = '2026-09-09T10:00:00';
const WEEK = '2026-09-07';
const MON = '2026-09-07', TUE = '2026-09-08', WED = '2026-09-09', THU = '2026-09-10',
  FRI = '2026-09-11', SAT = '2026-09-12', SUN = '2026-09-13';

const tab = (h, t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
const shift = (h, dk) => (((h.state().weeks[WEEK] || {}).shifts) || {})[dk] || {};
const withShifts = (shifts) => (s) => { s.weeks[WEEK] = { days: {}, shifts }; };

function schedule(seed) {
  const h = bootApp({ now: NOW });
  if (seed) seed(h.state());
  tab(h, 'schedule');
  return h;
}

function openDay(h, dk) {
  h.click(`[data-action="edit-shift"][data-day="${dk}"]`);
  return h.$('#shift-sheet');
}

// Picks a value on one wheel the way a tap on it does.
const pick = (h, wheel, value) => h.click(`[data-wheel="${wheel}"] [data-value="${value}"]`);

function setTimes(h, start, end) {
  const [sh, sm] = start.split(':');
  const [eh, em] = end.split(':');
  pick(h, 'start-h', sh); pick(h, 'start-m', sm);
  pick(h, 'end-h', eh); pick(h, 'end-m', em);
}

const chosenDays = (h) => h.$$('[data-apply-day][aria-pressed="true"]').map(b => b.dataset.applyDay);

describe('picking a shift time', () => {
  it('opens a picker for the day rather than saving on the first scroll', () => {
    const h = schedule();
    expect(openDay(h, MON)).toBeTruthy();
    expect(h.$('#shift-sheet').textContent).toMatch(/Monday/);
  });

  it('saves nothing until Confirm', () => {
    const h = schedule();
    openDay(h, MON);
    setTimes(h, '08:30', '17:00');
    expect(shift(h, MON).start).toBeUndefined();
    h.click('#shift-confirm');
    expect(shift(h, MON)).toMatchObject({ start: '08:30', end: '17:00' });
    expect(h.$('#shift-sheet')).toBeNull();
  });

  it('shows the shift and its hours before it is confirmed', () => {
    const h = schedule();
    openDay(h, MON);
    setTimes(h, '08:30', '17:00');
    const preview = h.$('#shift-preview').textContent;
    expect(preview).toContain('08:30');
    expect(preview).toContain('17:00');
    // 8.5h less the default 30-minute lunch, as Standard week already does.
    expect(preview).toContain('8.0h');
  });

  it('discards the change when closed without confirming', () => {
    const h = schedule(withShifts({ [MON]: { start: '08:00', end: '16:30', lunch: '30' } }));
    openDay(h, MON);
    setTimes(h, '09:00', '17:30');
    h.click('#shift-close');
    expect(h.$('#shift-sheet')).toBeNull();
    expect(shift(h, MON)).toMatchObject({ start: '08:00', end: '16:30' });
  });

  it('opens on the times the day already has', () => {
    const h = schedule(withShifts({ [MON]: { start: '07:45', end: '16:15', lunch: '30' } }));
    openDay(h, MON);
    expect(h.$('[data-wheel="start-h"] [aria-selected="true"]').dataset.value).toBe('07');
    expect(h.$('[data-wheel="start-m"] [aria-selected="true"]').dataset.value).toBe('45');
    expect(h.$('[data-wheel="end-h"] [aria-selected="true"]').dataset.value).toBe('16');
    expect(h.$('[data-wheel="end-m"] [aria-selected="true"]').dataset.value).toBe('15');
  });

  it('starts an empty day from the day before it, so a normal week is one Confirm a day', () => {
    const h = schedule(withShifts({ [MON]: { start: '08:30', end: '17:00', lunch: '30' } }));
    openDay(h, TUE);
    h.click('#shift-confirm');
    expect(shift(h, TUE)).toMatchObject({ start: '08:30', end: '17:00' });
  });

  it('will not confirm a finish that is not after the start', () => {
    const h = schedule();
    openDay(h, MON);
    setTimes(h, '17:00', '08:30');
    expect(h.$('#shift-confirm').disabled).toBe(true);
  });

  it('keeps an existing time that is not on a five-minute step', () => {
    const h = schedule(withShifts({ [MON]: { start: '08:07', end: '16:30', lunch: '30' } }));
    openDay(h, MON);
    h.click('#shift-confirm');
    expect(shift(h, MON).start).toBe('08:07');
  });

  it('clears the times from a day the engineer is not working, and keeps its note', () => {
    const h = schedule(withShifts({ [MON]: { start: '08:00', end: '16:30', lunch: '30', note: 'Van in for its MOT' } }));
    openDay(h, MON);
    h.click('#shift-clear');
    expect(h.$('#shift-sheet')).toBeNull();
    expect(shift(h, MON).start).toBeUndefined();
    expect(shift(h, MON).end).toBeUndefined();
    expect(shift(h, MON).note).toBe('Van in for its MOT');
  });
});

describe('copying a shift to other days', () => {
  it('applies to no other day unless one is chosen', () => {
    const h = schedule();
    openDay(h, MON);
    setTimes(h, '08:30', '17:00');
    h.click('#shift-confirm');
    [TUE, WED, THU, FRI, SAT, SUN].forEach(dk => expect(shift(h, dk).start, dk).toBeUndefined());
  });

  it('copies to exactly the days chosen: Tuesday to Thursday and Saturday, not Friday', () => {
    const h = schedule();
    openDay(h, MON);
    setTimes(h, '08:30', '17:00');
    [TUE, WED, THU, SAT].forEach(dk => h.click(`[data-apply-day="${dk}"]`));
    h.click('#shift-confirm');
    [MON, TUE, WED, THU, SAT].forEach(dk => expect(shift(h, dk), dk).toMatchObject({ start: '08:30', end: '17:00' }));
    [FRI, SUN].forEach(dk => expect(shift(h, dk).start, dk).toBeUndefined());
  });

  it('lets a chosen day be un-chosen', () => {
    const h = schedule();
    openDay(h, MON);
    h.click(`[data-apply-day="${TUE}"]`);
    h.click(`[data-apply-day="${TUE}"]`);
    expect(chosenDays(h)).toEqual([]);
  });

  it('offers "Rest of week" as the weekdays after the day being set', () => {
    const h = schedule();
    openDay(h, TUE);
    h.click('#apply-rest-week');
    expect(chosenDays(h)).toEqual([WED, THU, FRI]);
  });

  it('offers "Whole week" as every other day, the weekend included', () => {
    const h = schedule();
    openDay(h, MON);
    h.click('#apply-whole-week');
    expect(chosenDays(h)).toEqual([TUE, WED, THU, FRI, SAT, SUN]);
  });

  it('says how many days Confirm will set', () => {
    const h = schedule();
    openDay(h, MON);
    h.click('#apply-rest-week');
    expect(h.$('#shift-confirm').textContent).toMatch(/5 days/);
  });

  it('replaces the times already on a chosen day', () => {
    const h = schedule(withShifts({ [TUE]: { start: '07:00', end: '15:00', lunch: '30' } }));
    openDay(h, MON);
    setTimes(h, '08:30', '17:00');
    h.click(`[data-apply-day="${TUE}"]`);
    h.click('#shift-confirm');
    expect(shift(h, TUE)).toMatchObject({ start: '08:30', end: '17:00' });
  });

  it('never copies over a day of leave, and will not let one be chosen', () => {
    const h = schedule(withShifts({ [FRI]: { leave: true } }));
    openDay(h, MON);
    expect(h.$(`[data-apply-day="${FRI}"]`).disabled).toBe(true);
    h.click('#apply-whole-week');
    expect(chosenDays(h)).not.toContain(FRI);
    setTimes(h, '08:30', '17:00');
    h.click('#shift-confirm');
    expect(shift(h, FRI)).toEqual({ leave: true });
  });

  it("keeps each day's own note when a shift is copied onto it", () => {
    const h = schedule(withShifts({ [TUE]: { note: 'Training in the afternoon' } }));
    openDay(h, MON);
    setTimes(h, '08:30', '17:00');
    h.click(`[data-apply-day="${TUE}"]`);
    h.click('#shift-confirm');
    expect(shift(h, TUE)).toMatchObject({ start: '08:30', end: '17:00', note: 'Training in the afternoon' });
  });
});

describe('the Weekly Forecast covers the whole week', () => {
  function forecast({ now = NOW, seed } = {}) {
    const h = bootApp({ now });
    if (seed) seed(h.state());
    tab(h, 'dashboard');
    h.click('#week-tile');
    return h;
  }

  it('shows every day of the week, Saturday and Sunday included', () => {
    const h = forecast();
    const labels = h.$$('#forecast-sheet [data-strip-day] .dsp-abbr').map(e => e.textContent.trim());
    expect(labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it("opens a Saturday's jobs when Saturday is tapped", () => {
    const h = forecast({
      seed: (s) => {
        s.weeks[WEEK] = {
          days: { [SAT]: [{ id: 'gas_repair', name: 'Gas Repair (any appliance)', creditMins: 56 }] },
          shifts: { [SAT]: { start: '08:00', end: '12:00', lunch: '0' } },
        };
      },
    });
    h.click(`#forecast-sheet [data-strip-day="${SAT}"]`);
    const panel = h.$('#forecast-sheet .day-detail-wrap').textContent;
    expect(panel).toContain('Saturday');
    expect(panel).toContain('Gas Repair');
  });

  it('opens on today, even when today is a Saturday', () => {
    const h = forecast({ now: '2026-09-12T10:00:00' });
    expect(h.$('#forecast-sheet .dsp-active').dataset.stripDay).toBe(SAT);
    expect(h.$('#forecast-sheet .day-detail-wrap').textContent).toContain('Saturday');
  });
});
