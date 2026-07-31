// You must be able to say you're in deficit.
//
// The starting balance field was `inputmode="decimal"`, which on iOS gives a
// keypad with a decimal point and no minus key — so an engineer using the app
// to climb out of a deficit, which is the main reason to set this at all,
// could not enter their own position. The maths accepted negatives the whole
// time; there was simply no way to type one. The sign is a control now.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

function settings() {
  const h = bootApp();
  h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'settings'));
  return h;
}

describe('entering a starting balance', () => {
  it('never asks for a character the phone keypad cannot produce', () => {
    const h = settings();
    const input = h.$('#start-bal-input');
    // A decimal keypad has no minus. If the field ever wants a typed sign
    // again, it has to stop being a numeric input first.
    expect(input.getAttribute('inputmode')).toBe('decimal');
    expect(Number(input.getAttribute('min'))).toBeGreaterThanOrEqual(0);
    expect(h.$('#start-bal-sign')).toBeTruthy();
  });

  it('records a deficit from a sign tap and a positive number', () => {
    const h = settings();
    h.click('#start-bal-sign');
    h.setValue('#start-bal-input', '22', 'blur');
    expect(h.state().startingBalance).toBe(-22);
  });

  it('records credit without touching the sign', () => {
    const h = settings();
    h.setValue('#start-bal-input', '14.5', 'blur');
    expect(h.state().startingBalance).toBe(14.5);
  });

  it('flips an existing balance between credit and deficit', () => {
    const h = settings();
    h.setValue('#start-bal-input', '30', 'blur');
    expect(h.state().startingBalance).toBe(30);
    h.click('#start-bal-sign');
    expect(h.state().startingBalance).toBe(-30);
    h.click('#start-bal-sign');
    expect(h.state().startingBalance).toBe(30);
  });

  it('holds the chosen sign across a zero balance', () => {
    // Zero has no sign to read back, so a naive implementation springs to "+"
    // on the next render and the next number typed comes out positive.
    const h = settings();
    h.click('#start-bal-sign');
    expect(h.$('#start-bal-sign').classList.contains('negative')).toBe(true);
    h.setValue('#start-bal-input', '8', 'blur');
    expect(h.state().startingBalance).toBe(-8);
  });

  it('shows the magnitude in the field, never a minus the field cannot accept', () => {
    const h = settings();
    h.click('#start-bal-sign');
    h.setValue('#start-bal-input', '22', 'blur');
    expect(h.$('#start-bal-input').value).toBe('22.0');
    expect(h.$('#start-bal-sign').textContent).toBe('−');
  });

  it('re-reads the sign from the stored value when Settings is reopened', () => {
    const h = settings();
    h.click('#start-bal-sign');
    h.setValue('#start-bal-input', '22', 'blur');
    const nav = (t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
    nav('dashboard');
    nav('settings');
    expect(h.$('#start-bal-sign').classList.contains('negative')).toBe(true);
    expect(h.$('#start-bal-input').value).toBe('22.0');
  });

  it('carries the deficit through to the CTAP balance the dashboard shows', () => {
    const h = settings();
    h.click('#start-bal-sign');
    h.setValue('#start-bal-input', '22', 'blur');
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    const tile = h.$('#ctap-tile').textContent;
    expect(tile).toContain('Deficit');
    expect(tile).toContain('22');
  });
});
