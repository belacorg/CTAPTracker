// CTAP pays in minutes. Every engineer knows a gas repair as 56; the tiles
// only ever said +0.93h. Fixed-credit jobs show both.
import { describe, it, expect } from 'vitest';
import { JOB_TYPES } from '../app/data.cjs';
import { bootApp } from './helpers/app-harness.js';

const boot = () => bootApp({ now: '2026-09-24T10:00:00', storage: {
  jct_state: JSON.stringify({ baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0, weeks: {}, checkins: {}, coachGoals: {} }),
  jcpd_setup_dismissed: 'true', jcpd_howto_seen: 'true', jcpd_name: 'Sam', jcpd_seen_build: '9999'
} });
const open = (h, cat) => h.click(h.$$('.lj-cat-tile').find(t => t.dataset.logCat === cat));
const row = (h, id) => h.$(`.lj-row[data-job-id="${id}"]`);

describe('every fixed-credit tile shows the minutes it pays', () => {
  it('shows a gas repair as 56 min under its hours', () => {
    const h = boot();
    open(h, 'core');
    const credit = row(h, 'gas_repair').querySelector('.lj-row-credit');
    expect(credit.textContent).toContain('+0.93h');
    expect(credit.querySelector('.lj-row-mins').textContent).toBe('56 min');
  });

  it('shows a CHB service as 40 min', () => {
    const h = boot();
    open(h, 'core');
    expect(row(h, 'asv_chb_cir_wh_swh').querySelector('.lj-row-mins').textContent).toBe('40 min');
  });

  it('shows an SGO sale’s total under its split', () => {
    const h = boot();
    open(h, 'sales');
    const r = row(h, 'hi_lead');
    expect(r.textContent).toContain('15 fulfilment + 44 SGO min');
    expect(r.querySelector('.lj-row-mins').textContent).toBe('59 min');
  });

  it('matches the catalogue for every fixed job in every category', () => {
    const h = boot();
    for (const cat of ['core', 'hive', 'sales', 'absent']) {
      open(h, cat);
      JOB_TYPES[cat].filter(j => !j.variable && !j.isNpt && !j.isMentorFull && !j.isMentorPartial && j.minutes > 0)
        .forEach(j => expect(row(h, j.id).querySelector('.lj-row-mins').textContent, j.id).toBe(`${j.minutes} min`));
      h.click('#log-cat-back');
    }
  });

  it('gives no figure to jobs that do not have one', () => {
    const h = boot();
    open(h, 'core');
    expect(row(h, 'trace_repair').querySelector('.lj-row-mins')).toBeNull();   // variable
    h.click('#log-cat-back');
    open(h, 'absent');
    expect(row(h, 'mentor_full').querySelector('.lj-row-mins')).toBeNull();    // not a credit
    expect(row(h, 'npt_quick').querySelector('.lj-row-mins')).toBeNull();      // a deduction
  });

  it('shows the minutes on the Most used chips too', () => {
    const h = boot();
    const chip = h.$('.lj-chip[data-job-id="gas_repair"]');
    expect(chip.querySelector('.lj-chip-mins').textContent).toContain('56 min');
  });
});
