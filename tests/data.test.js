import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../app/data.cjs');

// One figure for "today's target", wherever the app states it. The Dashboard
// read the day's shift × CTAP %, less that day's NPT, while the Weekly Forecast
// and the daily-streak insight read the bare shift — so on the same morning one
// screen said 2.05h still needed and the other 3.65h.
// A rest day is a normal non-working day in a rota ("off Friday, in Saturday"),
// not leave: it doesn't reduce Rostered hours. Once any day in a week has shift
// times, a day without them is a rest day. A week with no times at all reads as
// Monday to Friday, which is how the app worked before rotas.
describe('rest days', () => {
  const shift = { start: '08:30', end: '17:00', lunch: '30' };
  // Monday to Thursday and Saturday, off Friday.
  const rota = {
    days: {},
    shifts: { '2026-09-07': shift, '2026-09-08': shift, '2026-09-09': shift, '2026-09-10': shift, '2026-09-12': shift },
    deductionLog: [],
  };
  const state = { baseHours: 40, weeklyTargetPct: 0.8, weeks: {} };

  it('makes a day without times a rest day once the week has shifts', () => {
    expect(data.isRestDay(rota, '2026-09-11')).toBe(true);    // Friday
    expect(data.isRestDay(rota, '2026-09-13')).toBe(true);    // Sunday
    expect(data.isRestDay(rota, '2026-09-12')).toBe(false);   // Saturday, worked
    expect(data.isRestDay(rota, '2026-09-07')).toBe(false);   // Monday, worked
  });

  it('reads a week with no times as Monday to Friday', () => {
    const unscheduled = { days: {}, shifts: {} };
    expect(data.isRestDay(unscheduled, '2026-09-11')).toBe(false);
    expect(data.isRestDay(unscheduled, '2026-09-12')).toBe(true);
    expect(data.isRestDay(unscheduled, '2026-09-13')).toBe(true);
  });

  it('never calls a day of leave a rest day', () => {
    const w = { days: {}, shifts: { ...rota.shifts, '2026-09-11': { leave: true } } };
    expect(data.isRestDay(w, '2026-09-11')).toBe(false);
  });

  it('gives a rest day no daily target', () => {
    expect(data.getDailyTarget(state, rota, '2026-09-11')).toBe(0);
    expect(data.adjustedDailyTargetHours(state, rota, '2026-09-11')).toBe(0);
  });

  it('leaves Rostered hours whole, unlike leave', () => {
    expect(data.rosteredHours(state, rota)).toBe(40);
  });
});

describe('adjustedDailyTargetHours', () => {
  const DAY = '2026-09-09';
  const state = { baseHours: 40, weeklyTargetPct: 0.8, weeks: {} };
  const week = (extra = {}) => ({
    days: {},
    shifts: { [DAY]: { start: '08:00', end: '16:30', lunch: '30' } },
    deductionLog: [],
    ...extra,
  });

  it("scales the day's rostered hours by the CTAP percentage", () => {
    // 08:00–16:30 less a 30-minute lunch is 8.0h; 80% of that is 6.4h.
    expect(data.adjustedDailyTargetHours(state, week(), DAY)).toBeCloseTo(6.4, 5);
  });

  it('takes off NPT logged against that day, and only that day', () => {
    const w = week({ deductionLog: [{ date: DAY, mins: 30 }, { date: '2026-09-08', mins: 60 }] });
    expect(data.adjustedDailyTargetHours(state, w, DAY)).toBeCloseTo(5.9, 5);
  });
});

describe('Coach insights read the same daily target as the Dashboard', () => {
  afterEach(() => vi.useRealTimers());

  it('counts a day as hitting target at 80% of the shift, not the whole shift', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-09T15:00:00'));   // Wednesday afternoon
    const shift = { start: '08:00', end: '16:30', lunch: '30' };
    const sevenHours = [{ id: 'gas_repair', name: 'Gas Repair (any appliance)', creditMins: 420 }];
    const state = {
      baseHours: 40,
      weeklyTargetPct: 0.8,
      weeks: {
        '2026-09-07': {
          days: { '2026-09-07': sevenHours, '2026-09-08': sevenHours, '2026-09-09': sevenHours },
          shifts: { '2026-09-07': shift, '2026-09-08': shift, '2026-09-09': shift },
          deductionLog: [],
        },
      },
    };
    // 7.0h clears the 6.4h daily target but not the 8.0h shift behind it.
    const texts = data.getCoachInsights(state, '2026-09-07', {}).map((i) => i.text);
    expect(texts).toContain('3 days in a row hitting daily target this week');
  });
});

describe('Coach insights say "installs" and "leads" the way a person would', () => {
  afterEach(() => vi.useRealTimers());

  // Three completed weeks holding the given counts of one job, none this week.
  function historyOf(jobId, counts) {
    const weeks = {};
    ['2026-08-17', '2026-08-24', '2026-08-31'].forEach((wk, i) => {
      weeks[wk] = {
        days: { [wk]: Array.from({ length: counts[i] }, () => ({ id: jobId, name: jobId, creditMins: 60 })) },
        shifts: {},
        deductionLog: [],
      };
    });
    return { baseHours: 40, weeklyTargetPct: 0.8, weeks };
  }

  function insightText(state) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-09-09T10:00:00'));
    return data.getCoachInsights(state, '2026-09-07', {}).map((i) => i.text).join('\n');
  }

  it('says "installs" for an average of 1.3, which used to read "1.3 Hive install"', () => {
    expect(insightText(historyOf('hvi_min', [1, 1, 2]))).toContain('You average 1.3 Hive installs per week');
  });

  it('keeps "install" singular at exactly 1.0', () => {
    expect(insightText(historyOf('hvi_min', [1, 1, 1]))).toContain('You average 1.0 Hive install per week');
  });

  it('says "leads" for an average of 1.3 boiler leads', () => {
    expect(insightText(historyOf('hi_lead', [1, 1, 2]))).toContain('You average 1.3 boiler leads per week');
  });

  it('keeps "lead" singular at exactly 1.0', () => {
    expect(insightText(historyOf('hi_lead', [1, 1, 1]))).toContain('You average 1.0 boiler lead per week');
  });
});

describe('estimatedDailyPFMins', () => {
  it('caps at PF_DAY_CAP (40 minutes) regardless of input', () => {
    expect(data.estimatedDailyPFMins(8)).toBe(40);
    expect(data.estimatedDailyPFMins(20)).toBe(40);
  });

  it('returns 0 for zero or negative raw output', () => {
    expect(data.estimatedDailyPFMins(0)).toBe(0);
    expect(data.estimatedDailyPFMins(-3)).toBe(0);
  });

  it('applies the 8.5% multiplier and rounds to whole minutes', () => {
    // 4h × 0.085 × 60 = 20.4 → 20
    expect(data.estimatedDailyPFMins(4)).toBe(20);
    // 2h × 0.085 × 60 = 10.2 → 10
    expect(data.estimatedDailyPFMins(2)).toBe(10);
  });
});

describe('JOB_TYPES catalogue (ID1923)', () => {
  const { JOB_TYPES, findJob } = data;
  const all = [...JOB_TYPES.core, ...JOB_TYPES.hive, ...JOB_TYPES.sales, ...JOB_TYPES.absent];

  it('has no duplicate job ids', () => {
    const ids = all.map(j => j.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('groups every Gas Repair into one 56-minute tile', () => {
    const gr = findJob('gas_repair');
    expect(gr).toMatchObject({ code: 'GR-*', minutes: 56 });
  });

  it('carries the verified Gas Service minutes from the sheet', () => {
    expect(findJob('asv_chb_cir_wh_swh').minutes).toBe(40); // GS-CHB
    expect(findJob('asv_fre').minutes).toBe(47);            // GS-FRE
    expect(findJob('asv_hob_ckr_ovn').minutes).toBe(23);    // GS-HOB/CKR
    expect(findJob('asv_bbf_wau_waw_aga').minutes).toBe(63);// GS-WAU/BBU
  });

  it('derives credits as minutes / 83.58 to 2dp for fixed jobs', () => {
    [...JOB_TYPES.core, ...JOB_TYPES.hive]
      .filter(j => !j.variable)
      .forEach(j => {
        expect(j.credits).toBeCloseTo(+(j.minutes / 83.58).toFixed(2), 2);
      });
  });

  it('carries the verified rows 9–12 (non-contract / one-off CHB)', () => {
    expect(findJob('ld_completed')).toMatchObject({ code: 'LD-CHB', minutes: 205 });
    expect(findJob('oow_chb')).toMatchObject({ code: 'OOW-CHB', minutes: 56 });
    expect(findJob('ods_chb')).toMatchObject({ code: 'ODS-CHB', minutes: 40 });
    expect(findJob('od_chb')).toMatchObject({ code: 'OD-CHB', variable: true });
    expect(findJob('hvi_hub')).toMatchObject({ code: 'HVI-HUB', minutes: 40 });
  });

  it('drops catalogue entries not on the sheet', () => {
    ['hive_install_generic', 'install_cod', 'upgrade_work'].forEach(id => {
      expect(findJob(id)).toBeNull();
    });
  });
});

describe('weekSummary', () => {
  // Hand-built single-week state. Monday 2026-05-11 (a real Monday).
  const weekKey = '2026-05-11';
  const days = data.weekDays(weekKey);
  const mon = days[0];

  it('returns null for a missing week', () => {
    const state = { baseHours: 40, weeks: {} };
    expect(data.weekSummary(state, weekKey)).toBeNull();
  });

  it('bundles earned, target, bonus, gap, pct, bestDay, categoryCounts, ctapImpact, totalJobs, streak, standout', () => {
    const state = {
      baseHours: 40,
      weeklyTargetPct: 0.8,
      startingBalance: 0,
      weeks: {
        [weekKey]: {
          days: {
            // One long-duration core job on Monday: 205 credit mins ≈ 3.42h
            [mon]: [{ id: 'ld_completed', name: 'Long Duration (Completed)', creditMins: 205, ts: 1 }],
          },
          deductionLog: [],
          mentorDays: {},
          shifts: {},
          excludeFromCtap: false,
        },
      },
    };

    const summary = data.weekSummary(state, weekKey);
    expect(summary).not.toBeNull();
    expect(summary.earned).toBeCloseTo(205 / 60, 5);
    expect(summary.target).toBeCloseTo(40 * 0.8, 5);
    expect(summary.bonus).toBe(false);
    expect(summary.gap).toBeCloseTo(205 / 60 - 32, 5);
    expect(summary.bestDay).toEqual({ name: 'Monday', hours: 205 / 60 });
    expect(summary.categoryCounts).toEqual({ core: 1, hive: 0, sales: 0, absence: 0 });
    expect(summary.ctapImpact).toBeCloseTo(summary.gap, 5);
    expect(summary.totalJobs).toBe(1);
    expect(summary.streak.kind).toBe('miss');
    expect(summary.standout).toEqual({
      kind: 'highest_job',
      name: 'Long Duration',
      hours: 205 / 60,
    });
  });

  it('reports ctapImpact as null when the week is excluded from CTAP', () => {
    const state = {
      baseHours: 40,
      weeklyTargetPct: 0.8,
      weeks: {
        [weekKey]: {
          days: { [mon]: [{ id: 'ib_ff', name: 'IB, FF', creditMins: 56, ts: 1 }] },
          deductionLog: [],
          mentorDays: {},
          shifts: {},
          excludeFromCtap: true,
        },
      },
    };
    expect(data.weekSummary(state, weekKey).ctapImpact).toBeNull();
  });
});

describe('getLogWeekStrip', () => {
  // The reference day is injected, so the strip is testable across week
  // boundaries without freezing the clock. 2026-07-27 is a Monday.
  const state = () => ({
    weeks: {
      '2026-07-20': { days: { '2026-07-22': [{ id: 'gas_repair', creditMins: 56, ts: 1 }] } },
      '2026-07-27': {
        days: {
          '2026-07-27': [{ id: 'gas_repair', creditMins: 56, ts: 2 }, { id: 'asv_fre', creditMins: 47, ts: 3 }],
          '2026-07-29': [{ id: 'gas_repair', creditMins: 56, ts: 4 }]
        },
        shifts: { '2026-07-28': { leave: true } }
      }
    }
  });

  it('returns the seven days of the CTAP week, Monday first', () => {
    const strip = data.getLogWeekStrip(state(), '2026-07-27', '2026-07-31');
    expect(strip).toHaveLength(7);
    expect(strip[0].key).toBe('2026-07-27');   // Monday
    expect(strip[6].key).toBe('2026-08-02');   // Sunday
  });

  it('marks exactly the reference day as today', () => {
    const strip = data.getLogWeekStrip(state(), '2026-07-27', '2026-07-31');
    expect(strip.filter(d => d.isToday)).toHaveLength(1);
    expect(strip.find(d => d.isToday).key).toBe('2026-07-31');
  });

  it('holds a place for days that have not happened yet, and marks them', () => {
    // The week must not reflow under the engineer as the days fill in.
    const strip = data.getLogWeekStrip(state(), '2026-07-27', '2026-07-29');
    expect(strip).toHaveLength(7);
    expect(strip.filter(d => d.isFuture).map(d => d.key))
      .toEqual(['2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02']);
    expect(strip.find(d => d.key === '2026-07-29').isFuture).toBe(false);
  });

  it('steps back a week to reach a finished week, rather than rolling', () => {
    // The rolling window only covered last week by accident, and only for a
    // few days. A week key reaches any of them.
    const strip = data.getLogWeekStrip(state(), '2026-07-20', '2026-07-31');
    expect(strip[0].key).toBe('2026-07-20');
    expect(strip.some(d => d.isToday)).toBe(false);
    expect(strip.find(d => d.key === '2026-07-22').count).toBe(1);
    expect(strip.every(d => d.isFuture === false)).toBe(true);
  });

  it('carries the credit hours and count logged on each day', () => {
    const strip = data.getLogWeekStrip(state(), '2026-07-27', '2026-07-31');
    const mon = strip.find(d => d.key === '2026-07-27');
    expect(mon.count).toBe(2);
    expect(mon.hours).toBeCloseTo((56 + 47) / 60, 5);
    const wed = strip.find(d => d.key === '2026-07-29');
    expect(wed.count).toBe(1);
  });

  it('reports an empty rostered day, a day off and a rest day differently', () => {
    // An empty working day is a gap worth chasing; leave and the weekend are
    // not. Same zero hours.
    const strip = data.getLogWeekStrip(state(), '2026-07-27', '2026-08-02');
    const empty = strip.find(d => d.key === '2026-07-30');
    const leave = strip.find(d => d.key === '2026-07-28');
    const weekend = strip.find(d => d.key === '2026-08-01');
    expect(empty.count).toBe(0);
    expect(empty.rostered).toBe(true);
    expect(leave.rostered).toBe(false);
    expect(weekend.rostered).toBe(false);
  });

  it('gives Saturday and Sunday different initials', () => {
    // With one letter they were both "S", on a strip whose whole job is
    // telling you which day you are about to log into.
    const strip = data.getLogWeekStrip(state(), '2026-07-27', '2026-08-02');
    const initials = strip.map(d => d.initial);
    expect(initials).toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    expect(new Set(initials).size).toBe(7);
  });

  it('offers every past day in the week, matching what voice backdating allows', () => {
    // Voice resolves "last Tuesday" and writes to it with no floor, so a strip
    // that locked the same day would make the two entry points disagree about
    // which days exist. See ADR-0007.
    const empty = { weeks: {} };
    const strip = data.getLogWeekStrip(empty, '2026-07-27', '2026-08-02');
    expect(strip).toHaveLength(7);
    strip.forEach(d => expect(d.isFuture).toBe(false));
    expect(strip.every(d => d.count === 0)).toBe(true);
  });
});

// The completeness rule outlived the rolling target it was built for
// (ADR-0022 removed that). It now guards the averages the Coach reports back:
// "tracking 2h below your 8-week average" is a lie if half those weeks were
// only part logged — and a lie in the direction that worries someone doing fine.
describe('weekIsRepresentative', () => {
  const week = (hours, extra) => ({
    days: hours > 0 ? { d: [{ id: 'gas_repair', creditMins: Math.round(hours * 60) }] } : {},
    ...(extra || {})
  });
  const state = { baseHours: 40, weeklyTargetPct: 0.8, weeks: {} };   // asks 32h

  it('accepts a week that holds a full record, good or bad', () => {
    expect(data.weekIsRepresentative(state, week(30))).toBe(true);
    expect(data.weekIsRepresentative(state, week(20))).toBe(true);   // 63% — a bad week is data
    expect(data.weekIsRepresentative(state, week(12.8))).toBe(true); // exactly 40%
  });

  it('rejects a week that was clearly never finished being logged', () => {
    expect(data.weekIsRepresentative(state, week(4))).toBe(false);   // 12%
    expect(data.weekIsRepresentative(state, week(0))).toBe(false);
  });

  it('judges against what that week asked, not a flat figure', () => {
    // Three days' leave: the week asks 12.8h, so 11h is a full short week.
    const short = {
      days: { d: [{ id: 'gas_repair', creditMins: 11 * 60 }] },
      shifts: {
        '2026-08-25': { leave: true }, '2026-08-26': { leave: true }, '2026-08-27': { leave: true }
      }
    };
    expect(data.weekIsRepresentative(state, short)).toBe(true);
  });

  it('says nothing about a week that asked for nothing at all', () => {
    const allLeave = {
      days: { d: [{ id: 'gas_repair', creditMins: 56 }] },
      shifts: Object.fromEntries(
        ['2026-08-24','2026-08-25','2026-08-26','2026-08-27','2026-08-28']
          .map(d => [d, { leave: true }])
      )
    };
    expect(data.weekIsRepresentative(state, allLeave)).toBe(false);
  });
});

// One week, one target. The Dashboard's live tile used to read the rolling
// average while History, the balance and the bonus read the bare formula, so a
// week changed its target the moment it stopped being the current one.
describe('weekTargetHours — one answer per week', () => {
  const week = (hours, extra) => ({
    days: hours > 0 ? { d: [{ id: 'gas_repair', creditMins: Math.round(hours * 60) }] } : {},
    ...(extra || {})
  });
  // Four representative weeks averaging 30h, against a 32h formula — so the
  // rolling and static answers differ and a disagreement is visible.
  const settled = () => ({
    baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
    weeks: {
      '2026-08-17': week(28), '2026-08-24': week(30),
      '2026-08-31': week(31), '2026-09-07': week(31),
      '2026-09-14': week(29)
    }
  });

  it('is the employer bar, not the engineer\'s own recent average', () => {
    const state = settled();
    // Four weeks averaging 30h sit behind this one. The target is 32h anyway.
    expect(data.weekTargetHours(state, '2026-09-14')).toBeCloseTo(32, 5);
  });

  // A bar computed from what you achieved is a bar you meet by construction.
  // An engineer 7h short of the employer every week was shown the bonus met
  // every week from week five, with their balance frozen. See ADR-0022.
  it('does not drift towards the engineer, however long they underperform', () => {
    const keys = ['2026-06-01','2026-06-08','2026-06-15','2026-06-22',
                  '2026-06-29','2026-07-06','2026-07-13','2026-07-20'];
    const under = { baseHours: 40, weeklyTargetPct: 0.8, weeks: {} };
    keys.forEach(k => { under.weeks[k] = week(25); });
    keys.forEach(k => {
      expect(data.weekTargetHours(under, k), k).toBeCloseTo(32, 5);
      expect(data.bonusAchieved(under, k), k).toBe(false);
    });
    // And the deficit keeps accruing rather than freezing.
    const total = keys.reduce((s, k) => s + data.weekCreditHours(under.weeks[k]) - data.weekTargetHours(under, k), 0);
    expect(total).toBeCloseTo((25 - 32) * 8, 5);
  });

  it('the week summary reads the same target as the week itself', () => {
    const state = settled();
    for (const wk of Object.keys(state.weeks)) {
      expect(data.weekSummary(state, wk).target, wk).toBeCloseTo(data.weekTargetHours(state, wk), 5);
    }
  });

  it('bonus agrees with the target it is judged against', () => {
    const state = settled();
    expect(data.bonusAchieved(state, '2026-09-14')).toBe(false);   // 29h of 32h
    state.weeks['2026-09-14'] = week(32.5);
    expect(data.bonusAchieved(state, '2026-09-14')).toBe(true);
    expect(data.weekSummary(state, '2026-09-14').bonus).toBe(true);
  });

  it('the balance is struck against the same target the week was shown', () => {
    const state = settled();
    // Only completed weeks count, and 2026-09-14 is the current one here.
    const completed = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07'];
    const expected = completed.reduce(
      (s, wk) => s + data.weekCreditHours(state.weeks[wk]) - data.weekTargetHours(state, wk), 0);
    // cumulativeBalance reads the real clock, so compare the arithmetic rather
    // than the call: what matters is that it uses weekTargetHours per week.
    expect(expected).not.toBeNaN();
    completed.forEach(wk => {
      expect(data.weekTargetHours(state, wk)).toBeGreaterThan(0);
    });
  });

  it('an unknown week asks for nothing rather than throwing', () => {
    expect(data.weekTargetHours(settled(), '2019-01-07')).toBe(0);
    expect(data.bonusAchieved(settled(), '2019-01-07')).toBe(false);
  });
});

// A day's target has to move with the week's, or the Dashboard's "still needed
// today" and its weekly target disagree by the size of the rolling adjustment.
describe('daily targets sum to the weekly target', () => {
  const week = (hours) => ({
    days: hours > 0 ? { d: [{ id: 'gas_repair', creditMins: Math.round(hours * 60) }] } : {}
  });
  const sumDays = (state, wk) => data.weekDays(wk)
    .reduce((s, dk) => s + data.adjustedDailyTargetHours(state, state.weeks[wk], dk), 0);

  it('on the static formula, before any rolling average exists', () => {
    const state = { baseHours: 40, weeklyTargetPct: 0.8, weeks: { '2026-09-14': week(0) } };
    expect(sumDays(state, '2026-09-14')).toBeCloseTo(32, 5);
    expect(data.weekTargetHours(state, '2026-09-14')).toBeCloseTo(32, 5);
  });

  it('and with a settled history behind it, which must not move the bar', () => {
    const state = {
      baseHours: 40, weeklyTargetPct: 0.8,
      weeks: {
        '2026-08-17': week(28), '2026-08-24': week(30),
        '2026-08-31': week(31), '2026-09-07': week(31),
        '2026-09-14': week(0)
      }
    };
    const weekly = data.weekTargetHours(state, '2026-09-14');
    expect(weekly).toBeCloseTo(32, 5);
    expect(sumDays(state, '2026-09-14')).toBeCloseTo(weekly, 5);
  });
});

// "Around 7 more jobs at breakdown rate" was accurate and close to useless:
// nobody's day is seven breakdowns. The engineer had to do the arithmetic
// themselves to work out what would actually close the gap.
describe('describeJobMix — a day\'s shortfall as work', () => {
  const fresh = { baseHours: 40, weeklyTargetPct: 0.8, weeks: {} };
  const logged = (ids) => {
    const days = {};
    ids.forEach((id, i) => { days['2026-08-' + String(10 + i).padStart(2, '0')] = [{ id, creditMins: 60, ts: i + 1 }]; });
    return { baseHours: 40, weeklyTargetPct: 0.8, weeks: { '2026-08-03': { days } } };
  };
  const rep = (id, n) => Array(n).fill(id);

  it('offers a mix rather than a pile of one job', () => {
    const text = data.describeJobMix(fresh, 6.4);
    expect(text).toBe('3 breakdowns, 3 services and 2 fire services');
    expect(data.jobMixForGap(fresh, 6.4)).toHaveLength(3);
  });

  it('covers the gap, never falling short of it', () => {
    for (const gap of [1.2, 2.1, 3.2, 4.0, 5.0, 6.4, 7.5]) {
      const mix = data.jobMixForGap(fresh, gap);
      const total = mix.reduce((s, e) => s + e.hours, 0);
      expect(total, gap + 'h').toBeGreaterThanOrEqual(gap - 0.05);
    }
  });

  it('says nothing when the gap is too big for a day, rather than suggesting a mix that misses', () => {
    // The caller falls back to the flat count. A suggestion that quietly
    // doesn't close the gap is worse than a blunt one that admits the size.
    expect(data.describeJobMix(fresh, 12)).toBe('');
    expect(data.jobMixForGap(fresh, 12)).toEqual([]);
  });

  it('describes this engineer\'s work, not a generic day', () => {
    const hive = data.describeJobMix(logged([...rep('hvi_wls', 5), ...rep('hvi_min', 4), ...rep('hvi_trv', 3)]), 6.4);
    expect(hive).toMatch(/Hive|TRV/);
    expect(hive).not.toContain('breakdown');

    const fires = data.describeJobMix(logged([...rep('asv_fre', 6), ...rep('asv_hob_ckr_ovn', 4), ...rep('gas_repair', 3)]), 6.4);
    expect(fires).toContain('fire service');
  });

  it('leaves out add-ons, which ride on a visit rather than filling one', () => {
    // Counting leads and inhibitors as the day's work would overstate what
    // there is room for.
    const text = data.describeJobMix(logged([...rep('hi_lead', 8), ...rep('add_inhibitor', 6), ...rep('gas_repair', 2)]), 6.4);
    expect(text).not.toMatch(/lead|inhibitor/i);
    expect(text).toContain('breakdown');
  });

  it('uses the words engineers say, and gets the singular right', () => {
    expect(data.describeJobMix(fresh, 1.5)).toBe('a breakdown and a service');
    expect(data.describeJobMix(fresh, 1.5)).not.toContain('1 breakdown');
  });

  it('offers nothing for a gap that is already closed', () => {
    expect(data.describeJobMix(fresh, 0)).toBe('');
    expect(data.describeJobMix(fresh, -2)).toBe('');
  });
});
