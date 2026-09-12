// The app ships local-only: no account, no upload, localStorage the sole store.
// See ADR-0015. These tests exist because the failure they guard against is
// silent — a restored sign-in button or a stray fetch would look like a feature,
// not a regression, and the whole reason the employer allowed a trial is that
// neither is present.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

const goTab = (h, tab) => {
  h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === tab));
  return h.$('#app').innerHTML;
};
const settings = (h) => goTab(h, 'settings');

describe('no account, anywhere', () => {
  it('offers no way to sign in, sign up or sign out', () => {
    const h = bootApp();
    const html = settings(h);
    for (const id of ['settings-login-btn', 'settings-signup-btn', 'sign-out-btn']) {
      expect(h.$('#' + id)).toBeNull();
    }
    expect(html).not.toMatch(/sign in|sign up|log in|create account|sign out/i);
  });

  it('never invites the engineer to sync or mentions where data would go', () => {
    const h = bootApp();
    const html = settings(h);
    expect(html).not.toMatch(/supabase|sync across devices|cloud|our servers/i);
  });

  it('states plainly that the data stays on the device', () => {
    const h = bootApp();
    const html = settings(h);
    expect(html).toMatch(/on this (phone|device)/i);
  });

  it('boots with the cloud bridge absent, as index.html ships it', () => {
    const h = bootApp();
    expect(h.window.__ctapSupabaseActive).toBe(false);
    for (const fn of ['__ctapSyncWeek', '__ctapSyncCheckin', '__ctapSyncGoal',
                      '__ctapSyncProfile', '__ctapShowAuth', '__ctapSignOut',
                      '__ctapDeleteAccountData']) {
      expect(h.window[fn]).toBeUndefined();
    }
  });
});

describe('localStorage is the only store', () => {
  it('writes a logged job straight to jct_state', () => {
    const h = bootApp();
    h.click('#voice-btn');
    h.setValue('#voice-text', 'three gas repairs', 'input');
    h.click('#voice-parse-text');
    h.click('#voice-commit');

    const today = h.window.getTodayKey();
    const wk = h.window.getWeekKey(new Date(today + 'T00:00:00'));
    const stored = JSON.parse(h.window.localStorage.getItem('jct_state'));
    expect(stored.weeks[wk].days[today]).toHaveLength(3);
  });

  it('makes no network request while logging a job', () => {
    const h = bootApp();
    const calls = [];
    h.window.fetch = (...a) => { calls.push(a[0]); return Promise.reject(new Error('blocked')); };
    h.window.XMLHttpRequest = function() { calls.push('xhr'); };

    h.click('#voice-btn');
    h.setValue('#voice-text', 'two gas repairs and a fire service', 'input');
    h.click('#voice-parse-text');
    h.click('#voice-commit');

    expect(calls).toEqual([]);
  });
});

describe('erase all data', () => {
  it('is a two-step confirm that only arms on the word ERASE', () => {
    const h = bootApp();
    settings(h);
    h.click('#erase-data-btn');

    const confirmBtn = h.$('#delete-confirm-btn');
    expect(confirmBtn.disabled).toBe(true);

    h.setValue('#delete-confirm-input', 'DELETE', 'input');
    expect(h.$('#delete-confirm-btn').disabled).toBe(true);

    h.setValue('#delete-confirm-input', 'erase', 'input');   // case-insensitive
    expect(h.$('#delete-confirm-btn').disabled).toBe(false);
  });

  it('clears the state and every jcpd_ preference', () => {
    const h = bootApp();
    h.window.localStorage.setItem('jcpd_name', 'Dave');
    h.window.localStorage.setItem('jcpd_theme', 'light');
    h.window.localStorage.setItem('unrelated_key', 'keep me');

    settings(h);
    h.click('#erase-data-btn');
    h.setValue('#delete-confirm-input', 'ERASE', 'input');
    // location.reload is not implemented in JSDOM; the clearing happens first.
    try { h.click('#delete-confirm-btn'); } catch {}

    expect(h.window.localStorage.getItem('jct_state')).toBeNull();
    expect(h.window.localStorage.getItem('jcpd_name')).toBeNull();
    expect(h.window.localStorage.getItem('jcpd_theme')).toBeNull();
    expect(h.window.localStorage.getItem('unrelated_key')).toBe('keep me');
  });
});

describe('the engineer names themselves', () => {
  it('greets by first name once set, and plainly when not', () => {
    const h = bootApp();
    expect(goTab(h, 'dashboard')).toMatch(/Good (morning|afternoon|evening|night)[^,]/);

    settings(h);
    h.setValue('#display-name-input', 'Dave Whitmore', 'input');
    expect(h.window.localStorage.getItem('jcpd_name')).toBe('Dave Whitmore');

    // First name only — a greeting is not a payroll record.
    const h2 = bootApp({ storage: { jcpd_name: 'Dave Whitmore' } });
    const greeting = goTab(h2, 'dashboard');
    expect(greeting).toMatch(/Good (morning|afternoon|evening|night), Dave/);
    expect(greeting).not.toContain('Whitmore');
  });

  it('escapes a name that would otherwise break out of the value attribute', () => {
    const h = bootApp({ storage: { jcpd_name: '" onfocus="alert(1)' } });
    settings(h);
    const input = h.$('#display-name-input');
    expect(input.getAttribute('onfocus')).toBeNull();
    expect(input.value).toBe('" onfocus="alert(1)');
  });
});
