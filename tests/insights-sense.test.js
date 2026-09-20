// The insights have to agree with each other, and with the tiles.
//
// Found by an engineer reading "Monday is your strongest day" in a week whose
// best day was plainly Thursday. The insight was not looking at this week at
// all — it averaged every week on record, so a Monday-heavy stretch from
// months earlier outvoted the round he is actually driving now. The Coach
// card's own strongest-day answer windows to eight weeks and said Thursday.
// Two surfaces, one screen, opposite answers.
import { describe, it, expect } from 'vitest';
import {
  getCoachInsights, getHistoricallyStrongDay, weekIsRepresentative,
  weekDays, weekCreditHours, weekTargetHours, getWeekKey, getTodayKey, isWorkingDay
} from '../app/data.cjs';

const job = (h) => ({ id: 'gas_repair', name: 'Gas Repair', creditMins: Math.round(h * 60), ts: 1 });
const L = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (iso, n) => { const b = new Date(iso + 'T00:00:00'); return L(new Date(b.getFullYear(), b.getMonth(), b.getDate() + n)); };

// Builds N consecutive weeks ending before `mondayAfter`, each from a
// per-week [mon..fri] hours array.
function build(mondayAfter, perWeek) {
  const weeks = {};
  const first = new Date(mondayAfter + 'T00:00:00');
  first.setDate(first.getDate() - 7 * perWeek.length);
  let wk = L(first);
  perWeek.forEach((hours) => {
    const days = {};
    hours.forEach((h, i) => { if (h > 0) days[addDays(wk, i)] = [job(h)]; });
    weeks[wk] = { deductionMins: 0, days };
    wk = addDays(wk, 7);
  });
  return weeks;
}

const withClock = (iso, fn) => {
  const Real = Date;
  const at = new Real(iso);
  globalThis.Date = class extends Real {
    constructor(...a) { return a.length ? new Real(...a) : new Real(at); }
    static now() { return at.getTime(); }
  };
  try { return fn(); } finally { globalThis.Date = Real; }
};

const CUR = '2026-09-14';                  // the week under test
const WED = '2026-09-16T17:00:00';         // Wednesday of it

const baseState = (weeks) => ({
  baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
  checkins: {}, coachGoals: {}, weeks
});

const insight = (state, kind, ctx = {}) => withClock(WED, () => {
  const week = state.weeks[CUR] || { days: {}, shifts: {} };
  const earned = weekCreditHours(week);
  return getCoachInsights(state, CUR, {
    dailyTarget: 6.4, todayHours: 0, weekTarget: weekTargetHours(state, CUR),
    weekEarned: earned, ...ctx
  }).find(i => i.kind === kind);
});

describe('the strongest day is one answer, not two', () => {
  // Four old Monday-heavy weeks, then eight where Thursday carries the week.
  const weeks = build(CUR, [
    ...Array(4).fill([16, 5, 5, 4, 5]),
    ...Array(8).fill([4, 5, 5, 9, 5])
  ]);
  const state = baseState({ ...weeks, [CUR]: { deductionMins: 0, days: {} } });

  it('does not name a day the engineer stopped having months ago', () => {
    const tip = insight(state, 'strongest_weekday');
    expect(tip).toBeTruthy();
    expect(tip.text).toContain('Thursday');
    expect(tip.text).not.toContain('Monday');
  });

  it('agrees with the Coach card, which windows to eight weeks', () => {
    const tip = insight(state, 'strongest_weekday');
    const coach = withClock(WED, () => getHistoricallyStrongDay(state));
    expect(coach).toBe('Thursday');
    expect(tip.text).toContain(coach);
  });

  it('quotes the average for the window it actually used', () => {
    // Thursday over the last eight weeks is a flat 9.00h, not the 7.33h that
    // averaging all twelve gives.
    expect(insight(state, 'strongest_weekday').text).toContain('9.00h');
  });

  it('stays quiet when no day genuinely stands out', () => {
    const flat = baseState({
      ...build(CUR, Array(8).fill([6, 6, 6, 6, 6])),
      [CUR]: { deductionMins: 0, days: {} }
    });
    expect(insight(flat, 'strongest_weekday')).toBeUndefined();
  });
});

describe('"tracking vs average" projects the week the way the tile does', () => {
  // Monday and Wednesday logged at 8h; Tuesday was a working day with nothing
  // entered. The tile counts two days worked and two left, and lands on 32h.
  const weeks = build(CUR, Array(6).fill([7, 7, 7, 7, 4]));
  const state = baseState({
    ...weeks,
    [CUR]: { deductionMins: 0, days: {
      [CUR]: [job(8)], [addDays(CUR, 2)]: [job(8)]
    } }
  });

  it('does not count a blank working day as if it had been worked', () => {
    const tracking = insight(state, 'tracking_vs_average');
    const projection = insight(state, 'week_projection');
    expect(projection.text).toContain('32.00h');
    // 32h against a 32h average is level, not 8h clear of it.
    if (tracking) expect(tracking.text).not.toContain('8.00h');
  });

  it('never disagrees with the projection printed beside it', () => {
    const tracking = insight(state, 'tracking_vs_average');
    if (!tracking) return;
    const avg = parseFloat(tracking.text.match(/average of ([\d.]+)h/)[1]);
    const diff = parseFloat(tracking.text.match(/Tracking ([\d.]+)h/)[1]);
    const signed = /below/.test(tracking.text) ? -diff : diff;
    const projected = parseFloat(insight(state, 'week_projection').text.match(/~([\d.]+)h/)[1]);
    expect(avg + signed).toBeCloseTo(projected, 2);
  });
});

describe('an excluded week contributes nothing to the averages', () => {
  // CONTEXT.md, "Excluded week": contributes nothing to the running balance
  // and nothing to the averages the Coach reports back.
  it('is not representative, whatever its credit looks like', () => {
    const state = baseState({});
    const week = { deductionMins: 0, excludeFromCtap: true, days: {
      '2026-09-07': [job(9)], '2026-09-08': [job(9)], '2026-09-09': [job(9)],
      '2026-09-10': [job(9)], '2026-09-11': [job(9)]
    } };
    expect(weekIsRepresentative(state, week)).toBe(false);
  });

  it('does not shape the strongest day', () => {
    // Eight honest Thursday weeks, plus three excluded weeks stacked on Monday.
    const weeks = build(CUR, [
      ...Array(3).fill([20, 0, 0, 0, 0]),
      ...Array(8).fill([4, 5, 5, 9, 5])
    ]);
    Object.keys(weeks).sort().slice(0, 3).forEach(wk => { weeks[wk].excludeFromCtap = true; });
    const state = baseState({ ...weeks, [CUR]: { deductionMins: 0, days: {} } });
    expect(insight(state, 'strongest_weekday').text).toContain('Thursday');
  });

  it('does not count against the bonus hit rate', () => {
    const weeks = build(CUR, [
      ...Array(2).fill([0, 0, 0, 0, 0]),      // excluded: sickness
      ...Array(6).fill([7, 7, 7, 7, 4])       // all comfortably on target
    ]);
    Object.keys(weeks).sort().slice(0, 2).forEach(wk => { weeks[wk].excludeFromCtap = true; });
    const state = baseState({ ...weeks, [CUR]: { deductionMins: 0, days: {} } });
    const tip = insight(state, 'bonus_hit_rate');
    expect(tip.text).toContain('6 of the last 6');
  });
});

describe('"recent" means recent', () => {
  it('compares NPT against a windowed average, not every week on record', () => {
    // Two old weeks carrying heavy NPT, then eight tidy ones running at half
    // an hour. This week has 2h — well above the recent run, but unremarkable
    // against an all-time average the two old weeks drag up to 2.4h.
    const weeks = build(CUR, Array(10).fill([7, 7, 7, 7, 4]));
    const keys = Object.keys(weeks).sort();
    keys.forEach((wk, i) => {
      weeks[wk].deductionLog = [{ name: 'NPT Quick', mins: i < 2 ? 600 : 30, date: wk }];
    });
    const state = baseState({
      ...weeks,
      [CUR]: { deductionMins: 120, deductionLog: [{ name: 'NPT Quick', mins: 120, date: CUR }], days: {} }
    });
    const tip = insight(state, 'npt_vs_average');
    expect(tip).toBeTruthy();
    // All-time average would be 2.0h and this week would look normal.
    expect(tip.text).toContain('above your recent average');
  });
});
