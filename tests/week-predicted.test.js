// The Week tile predicts, and says so.
//
// The tile carried an Actual / Projected toggle that moved only the CTAP
// balance beside it. Tapping "Projected" left the week's own hours sitting
// still, so the control read as broken.
//
// "Actual" was also claiming something the app cannot know. Every credit here
// is the engineer's own tap scored against the catalogue, not a figure from
// the business, so no number on this screen is actual in the sense that word
// carries on a payslip. The honest pair is Predicted against Logged.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const job = (hours, ts) => ({ id: 'gas_repair', name: 'Gas Repair', creditMins: Math.round(hours * 60), ts });

// Mon–Wed logged at 5h a day, against a 40h rostered week at 80% (32h target).
// Thursday and Friday are still to come, so the pace projects 5h × 2 more.
const midWeek = {
  jct_state: JSON.stringify({
    baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
    weeks: {
      '2026-09-14': {
        deductionMins: 0,
        days: {
          '2026-09-14': [job(5, 1)],
          '2026-09-15': [job(5, 2)],
          '2026-09-16': [job(5, 3)]
        }
      }
    },
    checkins: {}, coachGoals: {}
  }),
  jcpd_setup_dismissed: 'true',
  jcpd_howto_seen: 'true',
  jcpd_name: 'Jake'
};

// Thursday morning of that week, before anything is logged for the day.
const THURSDAY = '2026-09-17T08:00:00';

const nav = (h, tab) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === tab));
const tileHours = (h) => parseFloat(h.$('#week-tile .split-hours').textContent);
const toggle = (h) => h.$('#ctap-proj-toggle');

describe('the Week tile shows where the week is heading', () => {
  it('opens on the predicted end-of-week figure, not the running total', () => {
    const h = bootApp({ storage: midWeek, now: THURSDAY });
    nav(h, 'dashboard');

    // 15h logged over 3 days = 5h/day, two working days left → 25h.
    expect(tileHours(h)).toBeCloseTo(25, 1);
    expect(h.$('#week-tile .split-sub').textContent).toBe('predicted end of week');
  });

  it('never labels a prediction "Actual"', () => {
    const h = bootApp({ storage: midWeek, now: THURSDAY });
    nav(h, 'dashboard');
    expect(toggle(h).textContent).toBe('Predicted');
    expect(h.$('#week-tile').textContent).not.toContain('Actual');
  });

  it('keeps the banked figure on the tile, so the prediction is not mistaken for it', () => {
    const h = bootApp({ storage: midWeek, now: THURSDAY });
    nav(h, 'dashboard');
    const basis = h.$('.week-pred-basis').textContent;
    expect(basis).toContain('15.00h logged');
    expect(basis).toContain('3 days');
    expect(basis).toContain('2 to go');
  });

  it('moves the week hours when the toggle is tapped, not just the balance', () => {
    const h = bootApp({ storage: midWeek, now: THURSDAY });
    nav(h, 'dashboard');
    expect(tileHours(h)).toBeCloseTo(25, 1);

    h.click('#ctap-proj-toggle');
    expect(toggle(h).textContent).toBe('Logged');
    expect(tileHours(h)).toBeCloseTo(15, 1);

    h.click('#ctap-proj-toggle');
    expect(tileHours(h)).toBeCloseTo(25, 1);
  });

  it('agrees with the Weekly Forecast sheet the tile opens', () => {
    const h = bootApp({ storage: midWeek, now: THURSDAY });
    nav(h, 'dashboard');
    const onTile = tileHours(h);

    h.click('#week-tile');
    const stat = h.$$('.forecast-stat').find(s =>
      s.querySelector('.forecast-stat-label').textContent === 'Projected');
    expect(parseFloat(stat.querySelector('.forecast-stat-val').textContent)).toBeCloseTo(onTile, 2);
  });

  it('colours the badge by where the pace lands, not by how far through the week it is', () => {
    const h = bootApp({ storage: midWeek, now: THURSDAY });
    nav(h, 'dashboard');
    // 25h predicted against a 32h target is a miss by more than 10%, whatever
    // the day-by-day pace looks like on a Thursday morning.
    expect(h.$('#week-tile .pct-badge').className).toContain('pct-badge-red');
  });
});

describe('the two tiles predict the same week', () => {
  it('carries the predicted week into the predicted balance', () => {
    const h = bootApp({ storage: midWeek, now: THURSDAY });
    nav(h, 'dashboard');

    // Starting balance 0, predicted 25h against a 32h target \u2192 \u22127.00h.
    // Not \u221217.00h, which is what closing the week off today would give.
    expect(h.$('#ctap-tile .split-sub').textContent).toBe('predicted balance');
    expect(h.$('#ctap-tile .split-hours').textContent).toContain('7.00');
    expect(h.$('#ctap-tile .split-hours').textContent).toContain('-');
  });

  it('drops back to the banked balance when the toggle is turned off', () => {
    const h = bootApp({ storage: midWeek, now: THURSDAY });
    nav(h, 'dashboard');
    h.click('#ctap-proj-toggle');

    expect(h.$('#ctap-tile .split-sub').textContent).toBe('balance');
    expect(parseFloat(h.$('#ctap-tile .split-hours').textContent)).toBeCloseTo(0, 2);
  });
});

describe('the tile does not offer a prediction it cannot make', () => {
  it('shows the logged figure and hides the toggle before anything is logged', () => {
    const empty = { ...midWeek, jct_state: JSON.stringify({
      baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
      weeks: {}, checkins: {}, coachGoals: {}
    }) };
    const h = bootApp({ storage: empty, now: THURSDAY });
    nav(h, 'dashboard');

    expect(toggle(h)).toBeNull();
    expect(tileHours(h)).toBeCloseTo(0, 2);
  });

  it('does not book an unworked week as a deficit on the balance', () => {
    const empty = { ...midWeek, jct_state: JSON.stringify({
      baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 4,
      weeks: {}, checkins: {}, coachGoals: {}
    }) };
    const h = bootApp({ storage: empty, now: THURSDAY });
    nav(h, 'dashboard');
    // Not 4 − 32. With nothing logged there is no pace to project from.
    expect(parseFloat(h.$('#ctap-tile .split-hours').textContent)).toBeCloseTo(4, 1);
    expect(h.$('#ctap-tile .split-sub').textContent).toBe('balance');
  });

  it('hides the toggle once every working day is in', () => {
    const full = { ...midWeek, jct_state: JSON.stringify({
      baseHours: 40, weeklyTargetPct: 0.8, startingBalance: 0,
      weeks: { '2026-09-14': { deductionMins: 0, days: {
        '2026-09-14': [job(7, 1)], '2026-09-15': [job(7, 2)], '2026-09-16': [job(7, 3)],
        '2026-09-17': [job(7, 4)], '2026-09-18': [job(7, 5)]
      } } },
      checkins: {}, coachGoals: {}
    }) };
    // Friday evening, nothing left to predict over.
    const h = bootApp({ storage: full, now: '2026-09-18T18:00:00' });
    nav(h, 'dashboard');

    expect(toggle(h)).toBeNull();
    expect(tileHours(h)).toBeCloseTo(35, 1);
  });
});
