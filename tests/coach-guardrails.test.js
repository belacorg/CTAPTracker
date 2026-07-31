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
  it('is exactly the sales section — SGO is the only thing the engineer chooses', () => {
    const ids = getElectiveJobs().map(j => j.id).sort();
    const salesIds = JOB_TYPES.sales.filter(j => !j.variable && !j.isNpt && j.minutes > 0)
      .map(j => j.id).sort();
    expect(ids).toEqual(salesIds);
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
  // Drive the real surfaces with a deficit and read only the Coach surfaces —
  // the catalogue list on the Log tab legitimately contains every job name, so
  // scoping matters. The guardrail is only worth anything at point of output.
  function coachText() {
    const h = bootApp();
    h.window.localStorage.setItem('jcpd_coach_mode', 'true');
    h.state().startingBalance = -12;   // deep in deficit: the recovery advice path
    const nav = (t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
    let text = '';
    nav('dashboard');
    text += [...h.doc.querySelectorAll('.coach-card')].map(e => e.textContent).join(' ');
    nav('log');
    text += ' ' + [...h.doc.querySelectorAll('.coach-log-banner')].map(e => e.textContent).join(' ');
    return text;
  }

  it('renders Coach advice at all, so the assertions below are not vacuous', () => {
    expect(coachText().trim().length).toBeGreaterThan(20);
  });

  it('never names a dispatched job in Coach output', () => {
    const text = coachText();
    const dispatched = [...JOB_TYPES.core, ...JOB_TYPES.hive]
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
});
