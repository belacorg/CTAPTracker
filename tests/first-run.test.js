// The first open, which is the only screen all ten trial engineers are
// guaranteed to see.
//
// The app arrives looking finished — 40h/80% defaults, every figure rendered,
// nothing conspicuously blank — while the one setting that makes the headline
// number the engineer's own sits untouched at zero, and the explanation of how
// any of it works is collapsed at the bottom of Settings, below the thing it
// explains. Nothing was wrong on screen; nothing pointed anywhere either.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const dash = (h) => {
  h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
  return h;
};
const card = (h) => h.$('.setup-card');
const stepLabels = (h) => h.$$('.setup-step').map(s => s.querySelector('strong').textContent);
const doneLabels = (h) => h.$$('.setup-step.is-done').map(s => s.querySelector('strong').textContent);

describe('what a new engineer is shown', () => {
  it('names what is left to do, on the dashboard, without a modal', () => {
    const h = dash(bootApp());
    expect(card(h)).toBeTruthy();
    expect(h.$$('.setup-step').length).toBe(3);
    expect(stepLabels(h).join(' ')).toMatch(/starting CTAP balance/i);
    // A modal would be dismissed to reach the app, which teaches the engineer
    // to dismiss it, and would interrupt anyone who set up on Friday. The app's
    // one modal shell is always in the DOM; what matters is that first run
    // leaves it closed.
    expect(h.$('#modal-overlay').className).toContain('hidden');
  });

  it('counts the steps that are actually outstanding', () => {
    const h = dash(bootApp());
    expect(h.$('.setup-card-count').textContent).toMatch(/^3 left/);
  });

  it('points the balance step at the field that sets it', () => {
    const h = bootApp();
    dash(h);
    h.click('[data-setup-step="balance"]');
    expect(h.$('#start-bal-input')).toBeTruthy();
  });

  it('points the shifts step at the schedule', () => {
    const h = bootApp();
    dash(h);
    h.click('[data-setup-step="shifts"]');
    expect(h.$('#apply-default')).toBeTruthy();
  });

  it('opens the help already expanded rather than asking for a second tap', () => {
    const h = bootApp();
    dash(h);
    h.click('[data-setup-step="howto"]');
    expect(h.$('.st-how-to-body')).toBeTruthy();
  });
});

describe('steps completing themselves', () => {
  it('ticks the shifts step once a week has shifts in it', () => {
    const h = bootApp();
    dash(h);
    h.click('[data-setup-step="shifts"]');
    h.click('#apply-default');
    dash(h);
    expect(doneLabels(h).join(' ')).toMatch(/shifts/i);
    expect(h.$('.setup-card-count').textContent).toMatch(/^2 left/);
  });

  it('ticks the balance step when the engineer sets a balance', () => {
    const h = bootApp();
    dash(h);
    h.click('[data-setup-step="balance"]');
    h.setValue('#start-bal-input', '12', 'blur');
    dash(h);
    expect(doneLabels(h).join(' ')).toMatch(/balance/i);
  });

  it('accepts a deliberate zero as an answer', () => {
    // An engineer who is genuinely level has still answered the question, and
    // nagging them about it forever is how the card stops being read.
    const h = bootApp();
    dash(h);
    h.click('[data-setup-step="balance"]');
    h.setValue('#start-bal-input', '0', 'blur');
    dash(h);
    expect(doneLabels(h).join(' ')).toMatch(/balance/i);
  });

  it('ticks the help step when the help is opened from Settings directly', () => {
    const h = bootApp();
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'settings'));
    h.click('#toggle-how-to');
    dash(h);
    expect(doneLabels(h).join(' ')).toMatch(/how the app works/i);
  });
});

describe('the card getting out of the way', () => {
  it('disappears for good once every step is done', () => {
    const h = bootApp();
    dash(h);
    h.click('[data-setup-step="shifts"]');
    h.click('#apply-default');
    dash(h);
    h.click('[data-setup-step="balance"]');
    h.setValue('#start-bal-input', '5', 'blur');
    dash(h);
    h.click('[data-setup-step="howto"]');
    dash(h);
    expect(card(h)).toBeNull();
  });

  it('can be dismissed with steps outstanding, and stays dismissed', () => {
    const h = bootApp();
    dash(h);
    h.click('#setup-dismiss');
    expect(card(h)).toBeNull();
    const h2 = dash(bootApp({ storage: { jcpd_setup_dismissed: 'true' } }));
    expect(card(h2)).toBeNull();
  });

  it('never appears for an engineer who is already set up', () => {
    const h = dash(bootApp({
      storage: { jcpd_howto_seen: 'true' },
    }));
    h.click('[data-setup-step="shifts"]');
    h.click('#apply-default');
    dash(h);
    h.click('[data-setup-step="balance"]');
    h.setValue('#start-bal-input', '3', 'blur');
    dash(h);
    expect(card(h)).toBeNull();
  });

  it('stays off past weeks, which are history rather than setup', () => {
    const h = dash(bootApp());
    expect(card(h)).toBeTruthy();
    h.click('#prev-week');
    expect(card(h)).toBeNull();
  });
});
