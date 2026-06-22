import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../app/data.cjs');

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
