// End-to-end: Log Job as the landing tab, and a spoken day travelling all the
// way from transcript to written state via the confirm sheet.
import { describe, it, expect } from 'vitest';
import { bootApp } from './helpers/app-harness.js';

// No SpeechRecognition → the sheet opens straight into the typed fallback,
// which is the same draft/confirm path the spoken route lands in.
const openTyped = (h, text) => {
  h.click('#voice-btn');
  h.setValue('#voice-text', text, 'input');
  h.click('#voice-parse-text');
};

describe('Log Job is the landing page', () => {
  it('opens on Log Job with the job grid ready', () => {
    const h = bootApp();
    expect(h.$('.bottom-nav button.active').textContent.trim()).toBe('Log Job');
    expect(h.$$('.job-grid .job-btn').length).toBeGreaterThan(10);
  });

  it('puts Log Job first and Dashboard second', () => {
    const h = bootApp();
    expect(h.$$('.bottom-nav button').map(b => b.dataset.tab))
      .toEqual(['log', 'dashboard', 'schedule', 'history', 'settings']);
  });

  it('renders every tab without error', () => {
    const h = bootApp();
    for (const tab of ['dashboard', 'schedule', 'history', 'settings', 'log']) {
      h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === tab));
      expect(h.$('#app').innerHTML).not.toContain('Render Error');
    }
  });

  it('starts on the dashboard when offline, since logging is unavailable', () => {
    const h = bootApp({ online: false });
    expect(h.$('.bottom-nav button.active').textContent.trim()).toBe('Dashboard');
  });

  it('moves off Log Job if signal drops while sat on it', () => {
    const h = bootApp();
    h.window.__ctapSetOffline(true);
    expect(h.$('.bottom-nav button.active').textContent.trim()).toBe('Dashboard');
  });
});

describe('voice draft → confirmed entries', () => {
  it('reads a spoken day back as counted rows', () => {
    const h = bootApp();
    openTyped(h, 'six breakdowns, two boiler leads and three fires');
    expect(h.$$('.voice-item')).toHaveLength(3);
    expect(h.$$('.voice-qty-val').map(e => e.textContent)).toEqual(['6', '2', '3']);
    expect(h.$('#voice-commit').textContent.trim()).toBe('Log 11');
  });

  it('writes nothing until the engineer confirms', () => {
    // Rendering alone creates an empty week shell, so count actual entries.
    const entryCount = (s) => Object.values(s.weeks || {})
      .flatMap(w => Object.values(w.days || {}))
      .reduce((n, day) => n + day.length, 0);

    const h = bootApp();
    openTyped(h, 'six breakdowns');
    expect(h.$('.voice-review')).toBeTruthy();     // draft is on screen…
    expect(entryCount(h.state())).toBe(0);         // …but nothing is written

    h.click('#voice-commit');
    expect(entryCount(h.state())).toBe(6);
  });

  it('writes entries matching the tile flow’s shape', () => {
    const h = bootApp();
    openTyped(h, 'six breakdowns and two boiler leads');
    h.click('#voice-commit');

    const today = h.window.getTodayKey();
    const week = h.state().weeks[h.window.getWeekKey(new Date(today + 'T00:00:00'))];
    const entries = week.days[today];
    expect(entries).toHaveLength(8);
    expect(entries.filter(e => e.id === 'gas_repair')).toHaveLength(6);
    expect(entries.reduce((s, e) => s + e.creditMins, 0)).toBe(6 * 56 + 2 * 58);
    expect(entries.every(e => e.id && e.name && typeof e.creditMins === 'number' && e.ts)).toBe(true);
    expect(h.$('#voice-sheet').classList.contains('hidden')).toBe(true);
  });

  it('lets a row be re-counted and removed before logging', () => {
    const h = bootApp();
    openTyped(h, 'six breakdowns, two boiler leads and three fires');
    h.click('[data-voice-qty="1"]');
    expect(h.$$('.voice-qty-val')[0].textContent).toBe('7');
    h.click(h.$$('[data-voice-remove]')[2]);
    expect(h.$$('.voice-item')).toHaveLength(2);
    expect(h.$('#voice-commit').textContent.trim()).toBe('Log 9');
  });

  it('lets a mis-heard job be re-pointed at another', () => {
    const h = bootApp();
    openTyped(h, 'three fires');
    expect(h.$('.voice-job-select').value).toBe('asv_fre');
    h.setValue('.voice-job-select', 'gas_repair');
    h.click('#voice-commit');
    const today = h.window.getTodayKey();
    const week = h.state().weeks[h.window.getWeekKey(new Date(today + 'T00:00:00'))];
    expect(week.days[today].every(e => e.id === 'gas_repair')).toBe(true);
  });
});

describe('voice draft — absence and NPT', () => {
  it('sends NPT to the deduction log, not to credits', () => {
    const h = bootApp();
    openTyped(h, 'two hours wait work and forty minutes npt');
    expect(h.$$('.voice-value-input').map(i => i.value)).toEqual(['2', '40']);
    h.click('#voice-commit');

    const today = h.window.getTodayKey();
    const week = h.state().weeks[h.window.getWeekKey(new Date(today + 'T00:00:00'))];
    expect(week.deductionLog).toHaveLength(1);
    expect(week.deductionMins).toBe(40);
    expect(week.days[today].some(e => e.id === 'wait_work' && e.creditMins === 120)).toBe(true);
  });

  it('records a mentor day as a flag on the day', () => {
    const h = bootApp();
    openTyped(h, 'mentoring all day');
    h.click('#voice-commit');
    const today = h.window.getTodayKey();
    const week = h.state().weeks[h.window.getWeekKey(new Date(today + 'T00:00:00'))];
    expect(week.mentorDays[today]).toBe('full');
  });

  it('blocks the commit until a variable job has a time', () => {
    const h = bootApp();
    openTyped(h, 'a trace and repair');
    expect(h.$('#voice-commit').disabled).toBe(true);
    expect(h.$('.voice-item.needs-value')).toBeTruthy();
    expect(h.$('.voice-blocked-note')).toBeTruthy();

    h.setValue('.voice-value-input', '45');
    expect(h.$('#voice-commit').disabled).toBe(false);
  });
});

describe('voice draft — backdating', () => {
  it('logs against the spoken day', () => {
    const h = bootApp();
    openTyped(h, 'yesterday I did four gas services');
    h.click('#voice-commit');

    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yKey = h.window.localDateStr(y);
    const week = h.state().weeks[h.window.getWeekKey(new Date(yKey + 'T00:00:00'))];
    expect(week.days[yKey]).toHaveLength(4);
  });

  it('cannot be stepped into the future', () => {
    const h = bootApp();
    openTyped(h, 'four gas services');
    expect(h.$('#voice-day-next').disabled).toBe(true);
  });
});

describe('voice draft — nothing usable', () => {
  it('reports fragments it could not place', () => {
    const h = bootApp();
    openTyped(h, 'three breakdowns and some nonsense phrase');
    expect(h.$$('.voice-item')).toHaveLength(1);
    expect(h.$('.voice-unmatched-chip').textContent).toBe('some nonsense phrase');
  });

  it('offers a way out when it caught no jobs at all', () => {
    const h = bootApp();
    openTyped(h, 'fitted a thermostat');
    expect(h.$('.voice-empty')).toBeTruthy();
    expect(h.$('#voice-retry')).toBeTruthy();
    expect(h.$('#voice-type-instead')).toBeTruthy();
  });
});
