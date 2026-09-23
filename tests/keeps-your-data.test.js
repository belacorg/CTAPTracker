// An update must never cost an engineer their data.
//
// Everything they have logged lives in one localStorage key on their phone
// and nowhere else (ADR-0015). There is no server copy to restore from. So
// every change to the app runs this first: take a phone as the previous build
// left it, open it in this build, use every screen, log a job, and prove that
// every week, job, shift, deduction and setting is still there, unchanged.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bootApp } from './helpers/app-harness.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEMO = JSON.parse(readFileSync(join(ROOT, 'tools/demo-state.json'), 'utf8'));
const THURSDAY = '2026-09-24T10:00:00';

// A phone as a live engineer's looks: history, leave, rest days, mentor days,
// NPT, an excluded week, variable jobs, SGO sales with their split, and rows
// the catalogue has since retired.
const job = (id, name, mins, extra = {}) => ({ id, name, creditMins: mins, variableInput: null, ts: 1758000000000, ...extra });
const LIVE_PHONE = {
  ...DEMO,
  startingBalance: -6.5,
  weeklyTargetPct: 0.8,
  defaultLunch: 30,
  weeks: {
    ...DEMO.weeks,
    '2026-09-14': {
      deductionMins: 45,
      deductionLog: [{ name: 'NPT Quick', mins: 45, date: '2026-09-15' }],
      excludeFromCtap: true,
      mentorDays: { '2026-09-17': 'partial' },
      shifts: {
        '2026-09-15': { start: '08:00', end: '16:30', lunch: '30' },
        '2026-09-16': { leave: true },
        '2026-09-18': { start: '07:30', end: '15:00', lunch: '0' }
      },
      days: {
        '2026-09-15': [
          job('gas_repair', 'Gas Repair (any appliance)', 56),
          job('hive_sale_fit', 'Hive Fit (Sale Job)', 125),                 // retired row
          job('him_upgrade', 'HIM Upgrade (enter quoted minutes)', 330, { variableInput: '300min' })
        ],
        '2026-09-18': [
          job('hi_lead', 'Boiler Lead / ASHP Lead', 59, { fulfilmentMins: 15, sgoMins: 44 }),
          job('wait_work', 'Wait Work', 90, { variableInput: '1.5h' })
        ]
      }
    },
    '2026-09-21': {
      deductionMins: 0,
      days: {
        '2026-09-22': [job('asv_chb_cir_wh_swh', 'Gas Service (CHB, CIR, WH, SWH)', 40), job('co_alarm_fit', 'CO Alarm – Fit Only', 7)],
        '2026-09-23': [job('him_sgo', 'HIM Sale (per £1,000 excl VAT)', 287, { variableInput: '£2500', fulfilmentMins: 12, sgoMins: 275 })]
      },
      shifts: { '2026-09-26': { start: '', end: '' } }
    }
  }
};
const PREFS = {
  jcpd_setup_dismissed: 'true', jcpd_howto_seen: 'true', jcpd_name: 'Sam',
  jcpd_theme: 'light', jcpd_coach_mode: 'true', jcpd_checkin_on: 'false'
};

// Every value that was there before is there after, unchanged. Arrays may
// only grow at the end — a newly logged job — never lose or reorder.
function expectPreserved(before, after, path = 'state') {
  if (Array.isArray(before)) {
    expect(Array.isArray(after), `${path} is still a list`).toBe(true);
    expect(after.length, `${path} lost entries`).toBeGreaterThanOrEqual(before.length);
    before.forEach((v, i) => expectPreserved(v, after[i], `${path}[${i}]`));
  } else if (before && typeof before === 'object') {
    expect(after && typeof after === 'object', `${path} is still there`).toBe(true);
    Object.keys(before).forEach(k => expectPreserved(before[k], after[k], `${path}.${k}`));
  } else {
    expect(after, `${path} changed`).toEqual(before);
  }
}

const tab = (h, t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
const stored = (h) => JSON.parse(h.window.localStorage.getItem('jct_state'));

function useEverything(h) {
  for (const t of ['log', 'dashboard', 'schedule', 'history', 'settings']) tab(h, t);
  tab(h, 'dashboard');
  h.click('#week-tile');   h.click('#forecast-close');
  h.click('#ctap-tile');   h.click('#cashout-close');
  tab(h, 'history');
  const past = h.$$('.history-item').find(r => r.dataset.gotoWeek === '2026-09-14');
  if (past) h.click(past);
  tab(h, 'settings');
  h.click('#open-changelog'); h.click('#whatsnew-done');
}

describe('updating keeps everything on the phone', () => {
  it('keeps every week, job, shift, deduction and setting after using every screen', () => {
    const before = JSON.parse(JSON.stringify(LIVE_PHONE));
    const h = bootApp({ now: THURSDAY, storage: { jct_state: JSON.stringify(LIVE_PHONE), ...PREFS } });
    useEverything(h);
    // Log something, so the app definitely writes.
    tab(h, 'log');
    h.click(h.$$('.lj-cat-tile').find(t => t.dataset.logCat === 'core'));
    h.click('.lj-row[data-job-id="gas_repair"]');

    const after = stored(h);
    expectPreserved(before, after);
    // And the new job is there, added rather than substituted.
    expect(after.weeks['2026-09-21'].days['2026-09-24'].at(-1).id).toBe('gas_repair');
  });

  it('keeps every preference, adding only the note of which update was seen', () => {
    const h = bootApp({ now: THURSDAY, storage: { jct_state: JSON.stringify(LIVE_PHONE), ...PREFS } });
    useEverything(h);
    for (const [k, v] of Object.entries(PREFS)) {
      expect(h.window.localStorage.getItem(k), k).toBe(v);
    }
  });

  it('keeps the plain demo phone too', () => {
    const before = JSON.parse(JSON.stringify(DEMO));
    const h = bootApp({ now: THURSDAY, storage: { jct_state: JSON.stringify(DEMO), ...PREFS } });
    useEverything(h);
    expectPreserved(before, stored(h));
  });
});

describe('never writing over data it could not read', () => {
  const CORRUPT = '{"baseHours":40,"weeks":{"2026-09-21":{"days":{"2026-09-22":[{"id":"gas_rep';

  it('says so, loudly, rather than opening empty', () => {
    const h = bootApp({ now: THURSDAY, storage: { jct_state: CORRUPT, ...PREFS } });
    expect(h.$('#data-rescue-banner')).toBeTruthy();
    expect(h.$('#data-rescue-banner').textContent).toContain('Nothing has been deleted');
  });

  it('keeps a rescue copy of exactly what was there', () => {
    const h = bootApp({ now: THURSDAY, storage: { jct_state: CORRUPT, ...PREFS } });
    const ls = h.window.localStorage;
    const rescue = Object.keys(ls).filter(k => k.startsWith('jct_state_rescue_'));
    expect(rescue).toHaveLength(1);
    expect(ls.getItem(rescue[0])).toBe(CORRUPT);
  });

  it('leaves the original untouched even after the engineer logs a job', () => {
    const h = bootApp({ now: THURSDAY, storage: { jct_state: CORRUPT, ...PREFS } });
    tab(h, 'log');
    h.click(h.$$('.lj-cat-tile').find(t => t.dataset.logCat === 'core'));
    h.click('.lj-row[data-job-id="gas_repair"]');
    // The old code saved an empty state over this on the first tap.
    expect(h.window.localStorage.getItem('jct_state')).toBe(CORRUPT);
  });

  it('opens normally on a phone that has never saved anything', () => {
    const h = bootApp({ now: THURSDAY });
    expect(h.$('#data-rescue-banner')).toBeNull();
  });
});

describe('a save that does not land', () => {
  it('tells the engineer instead of failing silently', () => {
    const h = bootApp({ now: THURSDAY, storage: { jct_state: JSON.stringify(LIVE_PHONE), ...PREFS } });
    const proto = Object.getPrototypeOf(h.window.localStorage);
    const real = proto.setItem;
    proto.setItem = function(k, v) {
      if (k === 'jct_state') throw new h.window.DOMException('full', 'QuotaExceededError');
      return real.call(this, k, v);
    };
    try {
      tab(h, 'log');
      h.click(h.$$('.lj-cat-tile').find(t => t.dataset.logCat === 'core'));
      expect(() => h.click('.lj-row[data-job-id="gas_repair"]')).not.toThrow();
      // A banner, not a toast: the first build used a toast, and the "added"
      // toast that follows every log wrote straight over it.
      expect(h.$('#save-failed-banner')).toBeTruthy();
      expect(h.$('#save-failed-banner').textContent).toContain('wasn’t saved');
      expect(h.$('#toast').textContent).not.toContain('added');
    } finally {
      proto.setItem = real;
    }
    // Once a save lands again, the warning goes.
    h.click('.lj-row[data-job-id="gas_repair"]');
    expect(h.$('#save-failed-banner')).toBeNull();
  });
});
