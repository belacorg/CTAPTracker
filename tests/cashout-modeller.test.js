// Pricing hours you have not earned yet.
//
// The cash-out sheet could only ever cost the balance you already had, which
// answers "what is this worth?" but not "what would it be worth if I got
// there?" — the question that makes climbing out of a deficit concrete.
//
// The figure it prices is not an entitlement, and the sheet has to keep saying
// so: the Payable balance row above it is the only number that can be drawn.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const RATE = 19.39;
const MONDAY = '2026-09-21T09:00:00';

// A closed week that banks exactly +10h: 42h earned against a 32h target.
const boot = (startingBalance = 0) => {
  const h = bootApp({ now: MONDAY, storage: {
    jct_state: JSON.stringify({
      baseHours: 40, weeklyTargetPct: 0.8, startingBalance,
      weeks: {}, checkins: {}, coachGoals: {}
    }),
    jcpd_setup_dismissed: 'true', jcpd_howto_seen: 'true', jcpd_name: 'Jake'
  } });
  h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
  h.click('#ctap-tile');
  return h;
};

const hoursInput = (h) => h.$('#cashout-hours-input');
const gross = (h) => h.$('#cashout-gross').textContent;
const net = (h) => h.$('#cashout-net').textContent;
const note = (h) => h.$('#cashout-model-note');
const money = (s) => parseFloat(s.replace(/[£,]/g, ''));

// Types into the field the way the engineer does — the live patch runs on
// 'input', without a rebuild, so the caret survives.
const type = (h, value) => {
  const el = hoursInput(h);
  el.value = String(value);
  el.dispatchEvent(new h.window.Event('input', { bubbles: true }));
};

describe('the cash-out sheet prices any number of hours', () => {
  it('opens on what is actually payable', () => {
    const h = boot(10);
    expect(parseFloat(hoursInput(h).value)).toBeCloseTo(10, 2);
    expect(h.$('.cashout-balance-val').textContent).toBe('10.00h');
    expect(note(h).classList.contains('hidden')).toBe(true);
  });

  it('recalculates the money as you type, without a rebuild', () => {
    const h = boot(10);
    const before = hoursInput(h);
    type(h, 40);

    // Default multiplier is 1.4×, default band Basic (28% deductions).
    expect(money(gross(h))).toBeCloseTo(40 * RATE * 1.4, 2);
    expect(money(net(h))).toBeCloseTo(40 * RATE * 1.4 * 0.72, 2);
    // The very same input element — a rebuild here would drop the caret.
    expect(hoursInput(h)).toBe(before);
  });

  it('says plainly when the figure is more than you can draw', () => {
    const h = boot(10);
    type(h, 40);
    expect(note(h).classList.contains('hidden')).toBe(false);
    expect(note(h).textContent).toContain('Pricing 40.00h');
    expect(note(h).textContent).toContain('30.00h more than you can draw today');
  });

  it('marks the result as a price, not an entitlement', () => {
    const h = boot(10);
    expect(h.$('#cashout-result-card').className).not.toContain('cashout-result-modelled');
    type(h, 40);
    expect(h.$('#cashout-result-card').className).toContain('cashout-result-modelled');
  });

  it('keeps the payable balance row telling the truth while modelling', () => {
    const h = boot(10);
    type(h, 40);
    expect(h.$('.cashout-balance-val').textContent).toBe('10.00h');
  });

  it('drops the flag again when you come back to your own balance', () => {
    const h = boot(10);
    type(h, 40);
    type(h, 10);
    expect(note(h).classList.contains('hidden')).toBe(true);
    expect(h.$('#cashout-result-card').className).not.toContain('cashout-result-modelled');
  });
});

describe('the modeller works from a deficit, which is the point', () => {
  it('prices hours for an engineer with nothing payable', () => {
    const h = boot(-12);
    expect(h.$('.cashout-balance-val').textContent).toBe('0.00h');
    expect(money(gross(h))).toBeCloseTo(0, 2);

    type(h, 12);
    expect(money(gross(h))).toBeCloseTo(12 * RATE * 1.4, 2);
    expect(note(h).textContent).toContain('12.00h more than you can draw today');
  });

  it('points a deficit engineer at the tool rather than a dead end', () => {
    const h = boot(-12);
    expect(h.$('.cashout-deficit-note').textContent).toContain('Price any figure below');
  });
});

describe('the steppers', () => {
  it('nudge by an hour and update the field', () => {
    const h = boot(10);
    h.click('#cashout-plus');
    expect(parseFloat(hoursInput(h).value)).toBeCloseTo(11, 2);
    h.click('#cashout-minus');
    h.click('#cashout-minus');
    expect(parseFloat(hoursInput(h).value)).toBeCloseTo(9, 2);
  });

  it('will not go below zero', () => {
    const h = boot(0);
    h.click('#cashout-minus');
    expect(parseFloat(hoursInput(h).value)).toBeCloseTo(0, 2);
    expect(money(gross(h))).toBeCloseTo(0, 2);
  });
});

describe('the multiplier and tax band still drive the price', () => {
  it('applies them to the modelled hours, not the balance', () => {
    const h = boot(10);
    type(h, 40);
    h.click(h.$$('.cashout-mult-btn').find(b => b.dataset.mult === '2'));
    expect(money(gross(h))).toBeCloseTo(40 * RATE * 2, 2);
    // Still modelling after the rebuild a multiplier tap triggers.
    expect(parseFloat(hoursInput(h).value)).toBeCloseTo(40, 2);
    expect(note(h).classList.contains('hidden')).toBe(false);

    h.click(h.$$('.cashout-tax-btn').find(b => b.dataset.tax === 'gross'));
    expect(money(net(h))).toBeCloseTo(40 * RATE * 2, 2);
  });

  it('shows its working', () => {
    const h = boot(10);
    type(h, 40);
    expect(h.$('#cashout-breakdown').textContent).toContain('40.00h');
    expect(h.$('#cashout-breakdown').textContent).toContain('19.39');
  });
});

describe('a modelled figure never survives as a balance', () => {
  it('reopens on the payable balance, not last visit’s what-if', () => {
    const h = boot(10);
    type(h, 40);
    h.click('#cashout-close');
    h.click('#ctap-tile');
    expect(parseFloat(hoursInput(h).value)).toBeCloseTo(10, 2);
    expect(note(h).classList.contains('hidden')).toBe(true);
  });
});
