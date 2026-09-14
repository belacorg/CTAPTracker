// Coach must never point an engineer at a job type they cannot elect to do.
//
// The job you get is dispatch's call. Naming a high-credit job code as the
// target — "Best opportunity: Long Duration – Unvented, 5.50h" — reads as an
// instruction to go and find a 330-minute job, and the only way to find one
// that isn't there is to raise it. That consequence lands on the engineer's
// name, not the app's. See ADR-0009.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bootApp } from './helpers/app-harness.js';

const require = createRequire(import.meta.url);
const data = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data.cjs'));
const { JOB_TYPES, getElectiveJobs, getElectiveJobForGap } = data;

describe('the elective set', () => {
  // Best advice is what an engineer can offer on a visit they're already on:
  // the sales section, plus the Hive work they recommend where a customer has
  // no smart controls or faulty ones. Hive repairs, recalls and uninstalls come
  // from dispatch or get raised on a fault — never offered. See ADR-0009.
  const OFFERED_HIVE = ['hvi_min', 'hvi_wls', 'hvi_wrd', 'hvi_trv', 'hvi_iio', 'hvi_hub', 'inshv_min', 'inshv_thr'];
  // The extra zone is out too: a customer with Hive had it fitted with the
  // original install, so it is not a separate thing to recommend.
  const NEVER_OFFERED_HIVE = ['hive_repair', 'recall_hive', 'hvu_the', 'hvi_imz'];

  it('is the sales section plus the Hive work an engineer offers', () => {
    const ids = getElectiveJobs().map(j => j.id).sort();
    const fixed = j => !j.variable && !j.isNpt && j.minutes > 0;
    const expected = [
      ...JOB_TYPES.sales.filter(fixed),
      ...JOB_TYPES.hive.filter(j => j.bestAdvice && fixed(j)),
    ].map(j => j.id).sort();
    expect(ids).toEqual(expected);
  });

  it('includes a Hive install, Hive Mini, Hive TRVs, faulty controls and the OpenTherm upgrade', () => {
    const ids = new Set(getElectiveJobs().map(j => j.id));
    OFFERED_HIVE.forEach(id => expect(ids.has(id), id).toBe(true));
  });

  it('never includes a Hive repair, recall, uninstall or extra zone — those are not offered', () => {
    const ids = new Set(getElectiveJobs().map(j => j.id));
    NEVER_OFFERED_HIVE.forEach(id => expect(ids.has(id), id).toBe(false));
  });

  it('excludes every dispatched job — services, repairs, first visits, long durations', () => {
    const ids = new Set(getElectiveJobs().map(j => j.id));
    JOB_TYPES.core.forEach(j => expect(ids.has(j.id), j.id).toBe(false));
    expect(ids.has('ld_unv')).toBe(false);
    expect(ids.has('ld_completed')).toBe(false);
    expect(ids.has('gas_repair')).toBe(false);
  });

  it('excludes operational credits — nudging someone to log more wait time is the same failure', () => {
    const ids = new Set(getElectiveJobs().map(j => j.id));
    ['wait_work', 'ev_charge', 'buybox_collection', 'merchant_parts'].forEach(
      id => expect(ids.has(id), id).toBe(false)
    );
  });
});

describe('matching a job to a gap', () => {
  it('offers an elective job when one genuinely fits', () => {
    // Inhibitor (Fit + SGO) is 51 mins — 0.85h.
    const job = getElectiveJobForGap(0.85);
    expect(job).toBeTruthy();
    expect(getElectiveJobs().map(j => j.id)).toContain(job.id);
  });

  it('offers nothing rather than reaching for the biggest number in the catalogue', () => {
    // No elective job is a credible answer to a three-hour gap. The old code
    // answered this with Long Duration – Unvented.
    expect(getElectiveJobForGap(3.2)).toBeNull();
  });

  it('never answers a gap with a dispatched job, at any gap size', () => {
    const electiveIds = new Set(getElectiveJobs().map(j => j.id));
    for (let gap = 0.05; gap <= 6; gap += 0.05) {
      const job = getElectiveJobForGap(gap);
      if (job) expect(electiveIds.has(job.id), `gap ${gap.toFixed(2)} → ${job.id}`).toBe(true);
    }
  });

  it('has no answer for a zero or negative gap', () => {
    expect(getElectiveJobForGap(0)).toBeNull();
    expect(getElectiveJobForGap(-1)).toBeNull();
  });
});

describe('what Coach actually renders', () => {
  // Drive the real surfaces with a deficit and read only the Coach surfaces.
  // Coach lives on the Dashboard alone — see the Log Job test below — so that
  // is the only tab to read. Scoping still matters: the catalogue list on the
  // Log tab legitimately contains every job name, and the guardrail is only
  // worth anything at point of output.
  //
  // Every Coach surface counts, not just the card: the Insights panel and the
  // Best advice strip speak with the same voice, and a guardrail that reads one
  // surface of three leaves the other two unchecked.
  const COACH_SURFACES = '.coach-card, .coach-opp-strip, .tip-row';

  function coachText({ seed } = {}) {
    const h = bootApp({ now: '2026-09-09T10:00:00' });   // a Wednesday
    h.window.localStorage.setItem('jcpd_coach_mode', 'true');
    h.state().startingBalance = -12;   // deep in deficit: the recovery advice path
    if (seed) seed(h.state());
    const nav = (t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
    let text = '';
    nav('dashboard');
    text += [...h.doc.querySelectorAll(COACH_SURFACES)].map(e => e.textContent).join(' ');
    return text;
  }

  // Three completed weeks with a Hive install each and none this week — the
  // shape that used to produce "you average 1.0 Hive install per week".
  function withHiveHistory(state) {
    ['2026-08-17', '2026-08-24', '2026-08-31'].forEach(wk => {
      state.weeks[wk] = {
        days: { [wk]: [{ id: 'hvi_min', name: 'Hive Install – Mini Thermostat', creditMins: 90 }] },
        shifts: {},
        deductionLog: [],
      };
    });
  }

  it('renders Coach advice at all, so the assertions below are not vacuous', () => {
    expect(coachText().trim().length).toBeGreaterThan(20);
  });

  it('never names a dispatched job in Coach output', () => {
    const text = coachText();
    const dispatched = [...JOB_TYPES.core, ...JOB_TYPES.hive.filter(j => !j.bestAdvice)]
      .map(j => j.name.replace(/\s*\(.*$/, '').trim())
      .filter(n => n.length > 6);
    dispatched.forEach(name => expect(text, name).not.toContain(name));
  });

  it('never says "Long Duration" or "Unvented"', () => {
    const text = coachText();
    expect(text).not.toContain('Long Duration');
    expect(text).not.toContain('Unvented');
  });

  it('never claims a "highest value single job"', () => {
    expect(coachText()).not.toContain('highest value');
  });

  // Hive is best advice — recommended on a service or breakdown where the
  // customer has no smart controls. An engineer who usually fits one a week and
  // hasn't yet is exactly who this reminder is for.
  it('reminds an engineer who usually fits Hive and has not this week', () => {
    expect(coachText({ seed: withHiveHistory })).toMatch(/hive install/i);
  });
});

// "Still needed today" is one number. The Weekly Forecast used to build its own
// Insights from the bare shift, so on the same morning the Dashboard said 2.05h
// and the Forecast sheet said 3.65h.
describe("today's target is the same figure on every screen", () => {
  it("has the Forecast sheet's Insights agree with the Dashboard on what is still needed today", () => {
    const h = bootApp({ now: '2026-09-09T10:00:00' });   // a Wednesday
    h.window.localStorage.setItem('jcpd_coach_mode', 'true');
    h.state().weeks['2026-09-07'] = {
      days: { '2026-09-09': [{ id: 'gas_repair', name: 'Gas Repair (any appliance)', creditMins: 56 }] },
      shifts: { '2026-09-09': { start: '08:00', end: '16:30', lunch: '30' } },
      deductionLog: [],
    };
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));

    const sheet = h.$('#forecast-sheet');
    const todayLine = (rows) => rows.map(r => r.textContent.trim())
      .find(t => /today/.test(t) && /needed|to go/.test(t));
    const onDashboard = todayLine(h.$$('.tip-row').filter(r => !sheet.contains(r)));
    const inForecast = todayLine([...sheet.querySelectorAll('.tip-row')]);

    // 6.40h target (an 8.0h shift at 80%) less the 0.93h Gas Repair = 5.47h.
    expect(onDashboard).toContain('5.47h');
    expect(inForecast).toBe(onDashboard);
  });
});

// The Best advice strip: everything worth recommending after a service or a
// repair, listed together rather than one at a time.
describe('the Best advice strip', () => {
  const TODAY = '2026-09-09';          // a Wednesday
  const THIS_WEEK = '2026-09-07';
  const service = { id: 'asv_chb_cir_wh_swh', name: 'Gas Service (CHB, CIR, WH, SWH)', creditMins: 40 };
  const ldUnv = { id: 'ld_unv', name: 'Long Duration – Unvented (completed)', creditMins: 330 };

  function dashboardWith(jobs) {
    const h = bootApp({ now: TODAY + 'T10:00:00', storage: { jcpd_coach_mode: 'true' } });
    const s = h.state();
    const wk = s.weeks[THIS_WEEK] || (s.weeks[THIS_WEEK] = { days: {}, shifts: {}, deductionLog: [] });
    wk.days = wk.days || {};
    wk.days[TODAY] = jobs;
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    return h;
  }
  const rowIds = (h) => h.$$('[data-opp-row]').map(r => r.dataset.oppRow);

  it('lists every opportunity after a service, not just the top one', () => {
    expect(rowIds(dashboardWith([service]))).toEqual(
      ['hive', 'inhibitor', 'filter_water', 'upgrade', 'boiler_lead']);
  });

  it('points filters, water quality and upgrade work at a HIM upgrade', () => {
    const h = dashboardWith([service]);
    ['filter_water', 'upgrade'].forEach(id =>
      expect(h.$(`[data-opp-row="${id}"]`).textContent, id).toMatch(/HIM upgrade/));
  });

  it('recommends a filter when a plate heat exchanger goes on poor water', () => {
    expect(dashboardWith([service]).$('[data-opp-row="filter_water"]').textContent)
      .toMatch(/plate heat exchanger/i);
  });

  it('shows nothing until there has been a service or repair to recommend on', () => {
    expect(dashboardWith([]).$('#coach-opp-strip')).toBeNull();
  });

  it('still shows once today\'s target is hit — extra credit builds the balance', () => {
    expect(rowIds(dashboardWith([service, ldUnv, ldUnv, ldUnv])).length).toBeGreaterThan(0);
  });

  it('drops an opportunity already logged today', () => {
    const inhibitor = { id: 'inhibitor', name: 'Inhibitor (Fit + SGO)', creditMins: 51 };
    expect(rowIds(dashboardWith([service, inhibitor]))).not.toContain('inhibitor');
  });

  it('dismisses one opportunity for the day and keeps the rest', () => {
    const h = dashboardWith([service]);
    h.click('[data-opp-row="inhibitor"] [data-dismiss-opp]');
    expect(rowIds(h)).not.toContain('inhibitor');
    expect(rowIds(h)).toContain('hive');
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    expect(rowIds(h)).not.toContain('inhibitor');
  });

  it('shows credit in hours, the unit the rest of the app uses', () => {
    // Inhibitor (Fit + SGO) is 51 credit minutes: 0.85h, not 0.61 "credits".
    expect(dashboardWith([service]).$('[data-opp-row="inhibitor"]').textContent).toContain('0.85h');
  });
});

// Coach Mode off means off. The toggle is the engineer's way to stop being
// advised, so every Coach surface honours it — not just the card.
describe('Coach Mode off', () => {
  it('renders no Coach surface on the Dashboard, even deep in deficit', () => {
    const h = bootApp({ now: '2026-09-09T10:00:00', storage: { jcpd_coach_mode: 'false' } });
    h.state().startingBalance = -12;
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    expect(h.$$('.coach-card, .coach-opp-strip, .tip-row')).toHaveLength(0);
  });
});


// Coach belongs to the Dashboard.
//
// Log Job is the screen an engineer opens mid-round, often one-handed, to record
// something they have just done — a place to write, not to be advised. The
// banner that sat there also pushed the job tiles down far enough to be felt.
describe('Log Job carries no Coach surface', () => {
  const logTab = (coach) => {
    const h = bootApp({ storage: { jcpd_coach_mode: coach } });
    h.state().startingBalance = -12;   // deep in deficit: the advice would fire
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'log'));
    return h;
  };

  it('renders no Coach banner even with Coach Mode on and a gap to close', () => {
    const h = logTab('true');
    expect(h.$('.coach-log-banner')).toBeNull();
    expect(h.$('.coach-card')).toBeNull();
  });

  it('offers no tip or target advice anywhere on the page', () => {
    const h = logTab('true');
    expect(h.$('#app').textContent).not.toMatch(/to hit today's target/i);
  });

  it('still puts Coach on the Dashboard, so this removed a surface not a feature', () => {
    const h = logTab('true');
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    expect(h.$('.coach-card')).toBeTruthy();
  });
});
