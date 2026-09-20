// Coach and the tiles beneath it describe the same week.
//
// The Week and CTAP tiles lead with the predicted week (ADR-0023). Coach still
// read the banked balance and the running total, so the card could announce
// "You're in credit" directly above a tile reading "Deficit", off the same
// stored jobs. Same screen, same moment, opposite verdicts.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const job = (h, ts) => ({ id: 'gas_repair', name: 'Gas Repair', creditMins: Math.round(h * 60), ts });

// Wednesday of the week of Mon 21 Sept. Mon and Tue logged, Wed still open.
const WEDNESDAY = '2026-09-23T15:00:00';
const WK = '2026-09-21';

const boot = ({ days, startingBalance = 0, weeks = {} }) => {
  const h = bootApp({ now: WEDNESDAY, storage: {
    jct_state: JSON.stringify({
      baseHours: 40, weeklyTargetPct: 0.8, startingBalance,
      weeks: { ...weeks, [WK]: { deductionMins: 0, days } },
      checkins: {}, coachGoals: {}
    }),
    jcpd_setup_dismissed: 'true', jcpd_howto_seen: 'true',
    jcpd_name: 'Jake', jcpd_coach_mode: 'true'
  } });
  h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
  return h;
};

const coachText = (h) => (h.$('.coach-card') || { textContent: '' }).textContent;
const ctapTile = (h) => h.$('#ctap-tile').textContent;

// A week whose pace loses the credit: 2h a day against a 32h target.
const SLOW = { '2026-09-21': [job(2, 1)], '2026-09-22': [job(2, 2)] };
// A week whose pace clears it: 8h a day.
const FAST = { '2026-09-21': [job(8, 1)], '2026-09-22': [job(8, 2)] };

describe('Coach does not contradict the tile beneath it', () => {
  it('does not call a predicted deficit "in credit"', () => {
    // Banked +4h, but 2h a day projects 10h against a 32h target — the week
    // gives back 22h, so the predicted balance is deep in deficit.
    const h = boot({ days: SLOW, startingBalance: 4 });
    expect(ctapTile(h)).toContain('Deficit');
    expect(coachText(h)).not.toMatch(/You're in credit/i);
  });

  it('says what the pace is doing to the credit, not just that it exists', () => {
    const h = boot({ days: SLOW, startingBalance: 4 });
    // The advice has to be about the pace, because the pace is what is
    // spending the credit.
    expect(coachText(h)).toMatch(/pace/i);
  });

  it('keeps the reassurance when the pace actually holds the credit', () => {
    const h = boot({ days: FAST, startingBalance: 4 });
    expect(ctapTile(h)).toContain('In credit');
    expect(coachText(h)).toMatch(/credit/i);
    expect(coachText(h)).not.toMatch(/gives|short of target/i);
  });

  it('names a banked deficit as banked, so it is not read as the tile figure', () => {
    // Banked −10h, but a strong week: the tile predicts a credit.
    const h = boot({ days: FAST, startingBalance: -10 });
    const coach = coachText(h);
    expect(coach).toMatch(/deficit/i);
    // Whatever it says, it must not claim the flat figure the tile disagrees with.
    expect(coach).toMatch(/closed weeks|banked/i);
  });
});

describe('Coach counts the week the way the forecast does', () => {
  it('agrees with the Weekly Forecast sheet on days remaining', () => {
    // Wednesday logged, so Wednesday is no longer a day "remaining".
    const h = boot({ days: {
      '2026-09-21': [job(2, 1)], '2026-09-22': [job(2, 2)], '2026-09-23': [job(2, 3)]
    } });
    const coach = coachText(h);
    const m = coach.match(/across (\d+) remaining day/);
    expect(m).toBeTruthy();

    h.click('#week-tile');
    const daysLeft = h.$$('.forecast-stat').find(s =>
      s.querySelector('.forecast-stat-label').textContent === 'Days left');
    expect(m[1]).toBe(daysLeft.querySelector('.forecast-stat-val').textContent.trim());
  });

  it('projects the same finish as the tile and the sheet', () => {
    const h = boot({ days: FAST, startingBalance: 4 });
    const tileH = parseFloat(h.$('#week-tile .split-hours').textContent);
    const coach = coachText(h);
    const m = coach.match(/finish on ([\d.]+) hours/);
    if (m) expect(parseFloat(m[1])).toBeCloseTo(tileH, 2);
  });
});

describe('the Insights list agrees too', () => {
  it('scopes its deficit figure to closed weeks', () => {
    // Banked −10h under a strong week: the tile predicts a credit, so a bare
    // "CTAP is 10.00h in deficit" would read as a rival verdict.
    const h = boot({ days: FAST, startingBalance: -10 });
    const tips = h.$$('.tip-text').map(e => e.textContent);
    const deficit = tips.find(t => /CTAP is .*in deficit/.test(t));
    expect(deficit).toBeTruthy();
    expect(deficit).toContain('from closed weeks');
  });

  it('projects the same finish as the tile', () => {
    const h = boot({ days: FAST, startingBalance: 4 });
    const tileH = parseFloat(h.$('#week-tile .split-hours').textContent);
    const tip = h.$$('.tip-text').map(e => e.textContent).find(t => /current pace/.test(t));
    if (tip) {
      const m = tip.match(/([\d.]+)h/);
      expect(parseFloat(m[1])).toBeCloseTo(tileH, 2);
    }
  });
});

describe('an explicit balance figure names which balance it is', () => {
  it('does not print a bare "CTAP balance" that differs from the tile', () => {
    const h = boot({ days: FAST, startingBalance: 4 });
    const coach = coachText(h);
    const m = coach.match(/CTAP balance: \+?([\d.-]+)h/);
    if (m) {
      // If Coach states a figure, it must either match the tile or say it is
      // the banked one. A bare figure that differs is the bug.
      expect(coach).toMatch(/banked/i);
    }
  });
});
