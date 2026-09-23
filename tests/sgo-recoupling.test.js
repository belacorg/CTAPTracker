// SGO recoupled into CTAP, March 2026.
//
// A sale used to pay SGO cash plus a fulfilment credit in minutes. From
// 2 March the cash is paid into the CTAP bank as minutes instead. The two
// parts are kept apart on every entry: the fulfilment credit is earned for the
// work, the SGO credit is what used to be cash. See ADR-0026.
import { describe, it, expect } from 'vitest';
import {
  jobCredit, findJob, SGO_TABLE, RETIRED_JOBS, JOB_TYPES, weekSummary,
  getBestAdviceOpportunities, getElectiveJobs
} from '../app/data.cjs';
import { bootApp } from './helpers/app-harness.js';

const AFTER = '2026-09-23';          // recoupled, uplift live
const BEFORE_SGO = '2026-02-27';     // uplift live, SGO still cash
const BEFORE_ALL = '2026-02-20';     // neither

describe('an SGO sale is fulfilment plus the converted cash', () => {
  it('credits both parts once SGO is recoupled', () => {
    const c = jobCredit(findJob('hive_sale_sgo'), null, AFTER);
    expect(c).toEqual({ creditMins: 49, fulfilmentMins: 10, sgoMins: 39 });
  });

  it('credits only the fulfilment before 2 March, when the SGO was paid in cash', () => {
    const c = jobCredit(findJob('hive_sale_sgo'), null, BEFORE_SGO);
    expect(c).toEqual({ creditMins: 10, fulfilmentMins: 10, sgoMins: 0 });
  });

  it('credits a boiler lead at 59, as a Service & Repair CTAP update does', () => {
    // The one figure checked against a real statement (2026-09-23). If a new
    // table ever changes it, that table disagrees with what engineers are paid.
    expect(jobCredit(findJob('hi_lead'), null, AFTER).creditMins).toBe(59);
    expect(SGO_TABLE.rows.find(r => r.id === 'hi_lead').checked).toBe('2026-09-23');
  });

  it('always splits into parts that sum to the credit', () => {
    SGO_TABLE.rows.filter(r => !r.perThousand).forEach(r => {
      const c = jobCredit(findJob(r.id), null, AFTER);
      expect(c.fulfilmentMins + c.sgoMins).toBe(c.creditMins);
    });
  });

  it('prices a HIM sale on its value, with the fulfilment flat per sale', () => {
    const him = findJob('him_sgo');
    // £2,500 excl VAT: 110 × 2.5 = 275 SGO, plus one 12-minute fulfilment.
    expect(jobCredit(him, 2500, AFTER)).toEqual({ creditMins: 287, fulfilmentMins: 12, sgoMins: 275 });
    // The filter and powerflush rows are HIM products under £1,000 and still
    // carry the full 12, which is how we know it is not per £1,000.
    expect(jobCredit(him, 500, AFTER).fulfilmentMins).toBe(12);
  });

  it('credits nothing for a HIM sale with no value yet', () => {
    expect(jobCredit(findJob('him_sgo'), null, AFTER).creditMins).toBe(0);
  });
});

describe('the conversion table is internally consistent', () => {
  // Every row's CTAP credit is its old cash at one conversion rate (~2.2 min
  // per £1 on the Technical Repair table). Typing a new role's table in by
  // hand is where a digit slips; this is the check that catches it.
  const fixed = SGO_TABLE.rows.filter(r => !r.perThousand);
  const rates = fixed.map(r => r.ctapMins / r.cash).sort((a, b) => a - b);
  const median = rates[Math.floor(rates.length / 2)];

  it.each(fixed.map(r => [r.name, r]))('%s converts its cash at the table rate', (_, r) => {
    // Rounded to whole minutes on the source table, so allow the rounding.
    expect(Math.abs(r.ctapMins - r.cash * median)).toBeLessThanOrEqual(1.6);
  });

  it('gives every row a catalogue job whose total is fulfilment plus SGO', () => {
    fixed.forEach(r => {
      expect(findJob(r.id).minutes).toBe(r.fulfilmentMins + r.ctapMins);
    });
  });

  it('is flagged provisional until the Service & Repair figures arrive', () => {
    expect(SGO_TABLE.provisional).toBe(true);
  });
});

describe('the other two changes from the same brief', () => {
  const upgrade = findJob('him_upgrade');

  it('adds 10% to an upgrade quoted over 240 minutes', () => {
    expect(jobCredit(upgrade, 300, AFTER).creditMins).toBe(330);
  });

  it('leaves a quote of exactly 240 alone — it is not over', () => {
    expect(jobCredit(upgrade, 240, AFTER).creditMins).toBe(240);
  });

  it('does not uplift work done before 23 February', () => {
    expect(jobCredit(upgrade, 300, BEFORE_ALL).creditMins).toBe(300);
  });

  it('credits a reflush at 8 hours, and at 5.5 before the change', () => {
    const reflush = findJob('reflush_him_he');
    expect(jobCredit(reflush, null, AFTER).creditMins).toBe(480);
    expect(jobCredit(reflush, null, BEFORE_ALL).creditMins).toBe(330);
  });

  it('never offers a reflush as a way to close a gap', () => {
    expect(getElectiveJobs().map(j => j.id)).not.toContain('reflush_him_he');
  });
});

describe('retired rows', () => {
  it('cannot be logged again', () => {
    RETIRED_JOBS.forEach(r => expect(findJob(r.id)).toBeNull());
    const all = Object.values(JOB_TYPES).flat().map(j => j.id);
    RETIRED_JOBS.forEach(r => expect(all).not.toContain(r.id));
  });

  it('still count as sales in a week that already holds one', () => {
    const state = { baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0, checkins: {}, coachGoals: {},
      weeks: { '2026-09-14': { deductionMins: 0, days: {
        '2026-09-15': [{ id: 'hive_sale_fit', name: 'Hive Fit (Sale Job)', creditMins: 125, ts: 1 }]
      } } } };
    const s = weekSummary(state, '2026-09-14');
    expect(s.categoryCounts.sales).toBe(1);
    expect(s.categoryCounts.absence).toBe(0);
    expect(s.earned).toBeCloseTo(125 / 60, 5);   // its own credit, unchanged
  });
});

describe('the Best advice strip prices a recommendation from verified codes', () => {
  it('values a Hive as the SGO sale plus the INSHV-THR install', () => {
    const hive = getBestAdviceOpportunities(['gas_repair']).find(o => o.id === 'hive');
    // 49 + 90 = 139 min, 2.32h. It was 3.23h, off the retired 125-min fit row.
    expect(hive.minutes).toBe(139);
  });

  it('gives the filter its fixed SGO figure now it has one', () => {
    const f = getBestAdviceOpportunities(['gas_repair']).find(o => o.id === 'filter_water');
    expect(f.minutes).toBe(35);
  });
});

describe('in the app', () => {
  const WEDNESDAY = '2026-09-23T12:00:00';
  const boot = (weeks = {}) => bootApp({ now: WEDNESDAY, storage: {
    jct_state: JSON.stringify({ baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
      weeks, checkins: {}, coachGoals: {} }),
    jcpd_setup_dismissed: 'true', jcpd_howto_seen: 'true', jcpd_name: 'Jake'
  } });
  const openSgo = (h) => h.click(h.$$('.lj-cat-tile').find(t => t.dataset.logCat === 'sales'));
  const tile = (h, id) => h.$(`.lj-row[data-job-id="${id}"]`);
  const todays = (h) => h.state().weeks['2026-09-21'].days['2026-09-23'];

  it('shows the split on the tile', () => {
    const h = boot();
    openSgo(h);
    expect(tile(h, 'hive_sale_sgo').textContent).toContain('10 fulfilment + 39 SGO min');
    expect(tile(h, 'hive_sale_sgo').textContent).toContain('0.82h');
  });

  it('records the split on the entry when a sale is logged', () => {
    const h = boot();
    openSgo(h);
    h.click(tile(h, 'hi_lead'));
    const e = todays(h).at(-1);
    expect(e).toMatchObject({ id: 'hi_lead', creditMins: 59, fulfilmentMins: 15, sgoMins: 44 });
  });

  it('shows the recorded split beside the logged entry', () => {
    const h = boot();
    openSgo(h);
    h.click(tile(h, 'hi_lead'));
    expect(h.$('.lj-log-row').textContent).toContain('15 fulfilment + 44 SGO min');
  });

  it('prices a HIM sale from the value entered', () => {
    const h = boot();
    openSgo(h);
    h.click(tile(h, 'him_sgo'));
    expect(h.$('#modal-input').placeholder).toBe('e.g. 2500');
    h.$('#modal-input').value = '2500';
    h.click('#modal-confirm');
    const e = todays(h).at(-1);
    expect(e).toMatchObject({ id: 'him_sgo', creditMins: 287, fulfilmentMins: 12, sgoMins: 275, variableInput: '£2500' });
  });

  it('applies the upgrade uplift through the tile too', () => {
    const h = boot();
    openSgo(h);
    h.click(tile(h, 'him_upgrade'));
    h.$('#modal-input').value = '300';
    h.click('#modal-confirm');
    expect(todays(h).at(-1).creditMins).toBe(330);
  });

  it('totals the week’s SGO, split, on the Weekly Forecast', () => {
    const h = boot({ '2026-09-21': { deductionMins: 0, days: { '2026-09-22': [
      { id: 'hi_lead', name: 'Boiler Lead / ASHP Lead', creditMins: 59, fulfilmentMins: 15, sgoMins: 44, ts: 1 },
      { id: 'hive_sale_sgo', name: 'Hive Thermostat (SGO)', creditMins: 49, fulfilmentMins: 10, sgoMins: 39, ts: 2 },
      { id: 'gas_repair', name: 'Gas Repair', creditMins: 56, ts: 3 }
    ] } } });
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    h.click('#week-tile');
    const box = h.$('#forecast-sheet #sgo-credit-box').textContent;
    expect(box).toContain('1.80h');                         // 108 min
    expect(box).toContain('0.42h fulfilment + 1.38h SGO');  // 25 + 83
    expect(box).toContain('2 sales');
  });

  it('shows the split in the Forecast sheet’s day list too', () => {
    // There are two day-list renderers, an edit view and a reading view; the
    // split first landed only in the edit one.
    const h = boot({ '2026-09-21': { deductionMins: 0, days: { '2026-09-23': [
      { id: 'hi_lead', name: 'Boiler Lead / ASHP Lead', creditMins: 59, fulfilmentMins: 15, sgoMins: 44, ts: 1 }
    ] } } });
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    h.click('#week-tile');
    h.click('#forecast-sheet [data-strip-day="2026-09-23"]');
    const row = h.$$('#forecast-sheet .ddp-row').find(r => /Boiler/.test(r.textContent));
    expect(row.textContent).toContain('15 fulfilment + 44 SGO min');
  });

  it('shows no SGO box in a week with no sales', () => {
    const h = boot();
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    h.click('#week-tile');
    expect(h.$('#forecast-sheet #sgo-credit-box')).toBeNull();
  });
});
