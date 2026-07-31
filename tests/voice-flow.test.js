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
  it('opens on Log Job with the whole catalogue ready to tap', () => {
    const h = bootApp();
    expect(h.$('.bottom-nav button.active').textContent.trim()).toBe('Log Job');
    expect(h.$$('.lj-row').length).toBeGreaterThan(40);   // all four categories, one list
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

describe('Log Job — voice-first layout (ADR-0008)', () => {
  it('leads with the voice action', () => {
    const h = bootApp();
    const voice = h.$('.lj-voice');
    expect(voice).toBeTruthy();
    expect(voice.id).toBe('voice-btn');
    // Voice sits above the catalogue, not below it.
    expect(voice.compareDocumentPosition(h.$('.lj-row')) & 4).toBeTruthy();
  });

  it('has no job-type tab bar', () => {
    const h = bootApp();
    expect(h.$('.tab-bar')).toBeNull();
    expect(h.$('[data-jobtab]')).toBeNull();
  });

  it('groups the catalogue under section headers instead', () => {
    const h = bootApp();
    expect(h.$$('.lj-sec-sticky').map(e => e.textContent)).toEqual(['Gas', 'Hive', 'SGO', 'Absence']);
  });

  it('shows no job codes on the rows', () => {
    const h = bootApp();
    const text = h.$$('.lj-row').map(r => r.textContent).join(' ');
    expect(text).not.toContain('GS-CHB');
    expect(text).not.toContain('GR-');
    expect(text).not.toContain('HVI-');
  });

  it('keeps the subtitle, since short names alone are ambiguous', () => {
    const h = bootApp();
    // These two are both "Gas Service" and must stay tellable apart.
    const rows = h.$$('.lj-row').map(r => r.textContent.replace(/\s+/g, ' ').trim());
    expect(rows.some(t => t.includes('Gas Service') && t.includes('CHB, CIR, WH, SWH'))).toBe(true);
    expect(rows.some(t => t.includes('Gas Service') && t.includes('Gas Fire'))).toBe(true);
  });

  it('gives every row a distinct label', () => {
    const h = bootApp();
    const labels = h.$$('.lj-row').map(r => r.querySelector('.lj-row-main').textContent.replace(/\s+/g, ' ').trim());
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('shows the last seven days at once, defaulted to today', () => {
    const h = bootApp();
    expect(h.$('.lj-day-label').textContent.trim()).toBe('Today');
    expect(h.$('.day-picker')).toBeNull();                 // old full-width picker gone
    expect(h.$$('#log-prev-day, #log-next-day')).toHaveLength(0);  // stepper gone too

    const days = h.$$('.lj-strip-day');
    expect(days).toHaveLength(7);
    // Today is last on the strip and selected on arrival — the common case
    // needs no interaction at all.
    expect(days[6].classList.contains('today')).toBe(true);
    expect(days[6].classList.contains('selected')).toBe(true);
    expect(days[6].dataset.logDayPick).toBe(h.window.getTodayKey());
    // Nothing on the strip is in the future.
    days.forEach(d => expect(d.dataset.logDayPick <= h.window.getTodayKey()).toBe(true));
  });

  it('backdates in one tap, and shows what is already on each day', () => {
    const h = bootApp();
    // The most recent selectable day that isn't today. Picking by index would
    // break on a Monday, when yesterday falls before the first tracked week.
    const earlier = h.$$('.lj-strip-day')
      .filter(d => !d.disabled && d.dataset.logDayPick !== h.window.getTodayKey())
      .pop();
    expect(earlier, 'a backdatable day on the strip').toBeTruthy();
    const key = earlier.dataset.logDayPick;
    expect(earlier.classList.contains('logged')).toBe(false);
    expect(earlier.querySelector('.lj-strip-val').textContent.trim()).toBe('—');

    h.click(earlier);
    expect(h.$('.lj-day-label').textContent.trim()).not.toBe('Today');

    // Logging now lands on the picked day, not today.
    h.click(h.$$('.lj-row').find(r => r.dataset.jobId === 'gas_repair'));
    const week = h.state().weeks[h.window.getWeekKey(new Date(key + 'T00:00:00'))];
    expect(week.days[key].filter(e => e.id === 'gas_repair')).toHaveLength(1);
    expect(week.days[h.window.getTodayKey()] || []).toHaveLength(0);

    // And the strip now reports it, so the day reads as done.
    const nav = (t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
    nav('dashboard'); nav('log');
    const after = h.$$('.lj-strip-day').find(d => d.dataset.logDayPick === key);
    expect(after.classList.contains('logged')).toBe(true);
    expect(after.querySelector('.lj-strip-val').textContent.trim()).not.toBe('—');
  });

  it('collapses search to an icon until asked for', () => {
    const h = bootApp();
    expect(h.$('#job-search')).toBeNull();
    h.click('#log-search-open');
    expect(h.$('#job-search')).toBeTruthy();
    expect(h.$('.lj-voice')).toBeNull();                   // search takes over
    h.click('#search-close');
    expect(h.$('#job-search')).toBeNull();
    expect(h.$('.lj-voice')).toBeTruthy();
  });

  it('still finds a job by its code even though codes are hidden', () => {
    const h = bootApp();
    h.click('#log-search-open');
    h.setValue('#job-search', 'GS-FRE', 'input');
    const rows = h.$$('.lj-row');
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('Gas Fire');
  });

  it('finds a job by its subtitle too', () => {
    const h = bootApp();
    h.click('#log-search-open');
    h.setValue('#job-search', 'cooker', 'input');
    expect(h.$$('.lj-row').length).toBeGreaterThan(0);
  });

  it('logs a job from a row tap', () => {
    const h = bootApp();
    const row = h.$$('.lj-row').find(r => r.dataset.jobId === 'gas_repair');
    h.click(row);
    const today = h.window.getTodayKey();
    const week = h.state().weeks[h.window.getWeekKey(new Date(today + 'T00:00:00'))];
    expect(week.days[today].filter(e => e.id === 'gas_repair')).toHaveLength(1);
  });

  it('promotes what you log to the front of Most used on the next visit', () => {
    // Logging deliberately does not re-render while you're on the Log tab —
    // a re-render would throw you back to the top of the list mid-tap.
    const h = bootApp();
    // Seeded from the common domestic gas day, so the grid is useful on day one
    // rather than empty until the engineer has taught it something.
    expect(h.$$('.lj-top-grid .lj-chip')).toHaveLength(6);

    h.click(h.$$('.lj-row').find(r => r.dataset.jobId === 'hive_repair'));
    const nav = (t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
    nav('dashboard'); nav('log');
    // One logged job of the engineer's own outranks every seeded entry.
    expect(h.$('.lj-top-grid .lj-chip').dataset.jobId).toBe('hive_repair');
  });
});

describe('Dashboard is unchanged', () => {
  it('still renders the existing dashboard, not a prototype variant', () => {
    const h = bootApp();
    h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === 'dashboard'));
    expect(h.$('#app').innerHTML).not.toContain('Render Error');
    expect(h.$('.pda-hero')).toBeNull();
    expect(h.$('.pdb-card')).toBeNull();
    expect(h.$('.pdc-today')).toBeNull();
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
