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
  it('opens on Log Job with the day, the voice button and the four categories', () => {
    const h = bootApp();
    expect(h.$('.bottom-nav button.active').textContent.trim()).toBe('Log Job');
    // Everything that matters is on screen without scrolling past 51 rows.
    expect(h.$('.lj-strip')).toBeTruthy();
    expect(h.$('.lj-voice')).toBeTruthy();
    expect(h.$$('.lj-cat-tile')).toHaveLength(4);
    expect(h.$$('.lj-row')).toHaveLength(0);   // the catalogue is behind a tile
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

  // The app is local-only (ADR-0015): a write goes to localStorage and stays
  // there, so there is no longer a cloud load that could discard it. Signal is
  // therefore irrelevant to logging — which matters, because the plant rooms
  // and cupboards an engineer works in are exactly where signal is worst.
  it('opens on Log Job with no signal', () => {
    const h = bootApp({ online: false });
    expect(h.$('.bottom-nav button.active').textContent.trim()).toBe('Log Job');
  });

  it('logs a job with no signal, and keeps it', () => {
    const h = bootApp({ online: false });
    openTyped(h, 'two gas repairs');
    h.click('#voice-commit');
    const today = h.window.getTodayKey();
    const wk = h.window.getWeekKey(new Date(today + 'T00:00:00'));
    expect(h.state().weeks[wk].days[today]).toHaveLength(2);
    // And it survived the write — localStorage is the only copy there is.
    expect(JSON.parse(h.window.localStorage.getItem('jct_state'))
      .weeks[wk].days[today]).toHaveLength(2);
  });

  it('leaves the Log tab enabled whatever the connection', () => {
    const h = bootApp({ online: false });
    const logBtn = h.$$('.bottom-nav button').find(b => b.dataset.tab === 'log');
    expect(logBtn.classList.contains('nav-disabled')).toBe(false);
    expect(logBtn.getAttribute('aria-disabled')).toBeNull();
  });
});

describe('Log Job — voice-first layout (ADR-0008)', () => {
  // The catalogue lives behind a category tile now, so a test that wants rows
  // has to open one first.
  const openCat = (h, key) => h.click(h.$$('.lj-cat-tile').find(t => t.dataset.logCat === key));

  it('leads with the voice action', () => {
    const h = bootApp();
    const voice = h.$('.lj-voice');
    expect(voice).toBeTruthy();
    expect(voice.id).toBe('voice-btn');
    // Voice sits above the catalogue, not below it.
    expect(voice.compareDocumentPosition(h.$('.lj-cat-tile')) & 4).toBeTruthy();
  });

  it('has no job-type tab bar', () => {
    const h = bootApp();
    expect(h.$('.tab-bar')).toBeNull();
    expect(h.$('[data-jobtab]')).toBeNull();
  });

  // 51 jobs in one flat scroll meant scrolling past Hive and SGO to reach
  // Absence, and losing your place doing it. Four tiles, then the category.
  it('puts the catalogue behind four category tiles', () => {
    const h = bootApp();
    const tiles = h.$$('.lj-cat-tile');
    expect(tiles.map(t => t.dataset.logCat)).toEqual(['core', 'hive', 'sales', 'absent']);
    expect(tiles.map(t => t.querySelector('.lj-cat-name').textContent))
      .toEqual(['Gas', 'Hive', 'SGO', 'Absence']);
    // Each tile says how much is behind it, so the tap is not blind.
    tiles.forEach(t => expect(t.querySelector('.lj-cat-count').textContent).toMatch(/^\d+ jobs$/));
  });

  it('opens a category over the whole screen, and comes back out', () => {
    const h = bootApp();
    openCat(h, 'core');
    expect(h.$('.lj-cat-title').textContent.trim()).toBe('Gas');
    expect(h.$$('.lj-row').length).toBe(20);
    expect(h.$$('.lj-cat-tile')).toHaveLength(0);   // the category has the screen
    h.click('#log-cat-back');
    expect(h.$$('.lj-cat-tile')).toHaveLength(4);
    expect(h.$$('.lj-row')).toHaveLength(0);
  });

  it('carries the day being logged into inside a category', () => {
    // Tapping a job from inside a category was where engineers lost track of
    // which day it was landing on.
    const h = bootApp();
    openCat(h, 'hive');
    expect(h.$('.lj-cat-day-val').textContent.trim()).toBe('Today');
  });

  it('shows no job codes on the rows', () => {
    const h = bootApp();
    openCat(h, 'core');
    const text = h.$$('.lj-row').map(r => r.textContent).join(' ');
    expect(text).not.toContain('GS-CHB');
    expect(text).not.toContain('GR-');
    h.click('#log-cat-back');
    openCat(h, 'hive');
    expect(h.$$('.lj-row').map(r => r.textContent).join(' ')).not.toContain('HVI-');
  });

  it('keeps the subtitle, since short names alone are ambiguous', () => {
    const h = bootApp();
    openCat(h, 'core');
    // These two are both "Gas Service" and must stay tellable apart.
    const rows = h.$$('.lj-row').map(r => r.textContent.replace(/\s+/g, ' ').trim());
    expect(rows.some(t => t.includes('Gas Service') && t.includes('CHB, CIR, WH, SWH'))).toBe(true);
    expect(rows.some(t => t.includes('Gas Service') && t.includes('Gas Fire'))).toBe(true);
  });

  it('gives every row a distinct label', () => {
    const h = bootApp();
    const labels = [];
    for (const cat of ['core', 'hive', 'sales', 'absent']) {
      openCat(h, cat);
      labels.push(...h.$$('.lj-row').map(r =>
        r.querySelector('.lj-row-main').textContent.replace(/\s+/g, ' ').trim()));
      h.click('#log-cat-back');
    }
    // 57: the six unverified sale rows became the eleven rows of the SGO
    // conversion table, plus the HIM-HE reflush.
    expect(labels).toHaveLength(57);
    expect(new Set(labels).size).toBe(labels.length);
  });

  // The strip is the CTAP week, Monday to Sunday — the week the target is
  // counted over. It used to roll back seven days from today, which started the
  // week on a different day every day: engineers read "Sa Su M T W T Today"
  // and could not tell where their week began.
  it('shows the CTAP week, Monday to Sunday, with today selected', () => {
    const h = bootApp();
    expect(h.$('.lj-day-label').textContent.trim()).toBe('Today');
    expect(h.$('.day-picker')).toBeNull();                 // old full-width picker gone
    expect(h.$$('#log-prev-day, #log-next-day')).toHaveLength(0);  // stepper gone too

    const days = h.$$('.lj-strip-day');
    expect(days).toHaveLength(7);
    expect(days.map(d => d.querySelector('.lj-strip-dow').textContent.trim()))
      .toEqual(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    // The strip starts on the Monday of the week that holds today.
    expect(days[0].dataset.logDayPick)
      .toBe(h.window.getWeekKey(new Date(h.window.getTodayKey() + 'T00:00:00')));

    const today = days.find(d => d.dataset.logDayPick === h.window.getTodayKey());
    expect(today.classList.contains('today')).toBe(true);
    expect(today.classList.contains('selected')).toBe(true);
    expect(h.$$('.lj-strip-day.selected')).toHaveLength(1);
  });

  it('holds a place for the rest of the week but will not log into it', () => {
    const h = bootApp();
    const todayKey = h.window.getTodayKey();
    h.$$('.lj-strip-day').forEach(d => {
      const future = d.dataset.logDayPick > todayKey;
      expect(d.disabled).toBe(future);
      expect(d.classList.contains('future')).toBe(future);
    });
  });

  it('steps back a week to reach a finished one, and forward no further than this week', () => {
    const h = bootApp();
    const thisWeek = h.window.getWeekKey(new Date(h.window.getTodayKey() + 'T00:00:00'));
    expect(h.$('[data-log-week="1"]').disabled).toBe(true);   // no logging into next week

    h.click('[data-log-week="-1"]');
    const days = h.$$('.lj-strip-day');
    expect(days[0].dataset.logDayPick < thisWeek).toBe(true);
    // Every day of a finished week is reachable, and one is selected.
    days.forEach(d => expect(d.disabled).toBe(false));
    expect(h.$$('.lj-strip-day.selected')).toHaveLength(1);
    expect(h.$('[data-log-week="1"]').disabled).toBe(false);

    h.click('[data-log-week="0"]');   // "This week" snaps back to today
    expect(h.$('.lj-day-label').textContent.trim()).toBe('Today');
  });

  it('backdates in one tap, into a week that has already finished', () => {
    const h = bootApp();
    h.click('[data-log-week="-1"]');
    const sunday = h.$$('.lj-strip-day')[6];
    const key = sunday.dataset.logDayPick;
    expect(sunday.classList.contains('logged')).toBe(false);

    h.click(sunday);
    expect(h.$('.lj-day-label').textContent.trim()).not.toBe('Today');

    // Logging now lands on the picked day, not today.
    openCat(h, 'core');
    h.click(h.$$('.lj-row').find(r => r.dataset.jobId === 'gas_repair'));
    const week = h.state().weeks[h.window.getWeekKey(new Date(key + 'T00:00:00'))];
    expect(week.days[key].filter(e => e.id === 'gas_repair')).toHaveLength(1);
    expect((h.state().weeks[h.window.getWeekKey(new Date())] || { days: {} })
      .days[h.window.getTodayKey()] || []).toHaveLength(0);
  });

  // An engineer taps a job, gets a flash of colour, and has no way to tell
  // whether it landed or on which day. The day's entries answer both, on the
  // screen that chose the day.
  it('shows what is on the selected day, and lets you take it back off', () => {
    const h = bootApp();
    expect(h.$('.lj-log-empty')).toBeTruthy();
    expect(h.$('.lj-log-none').textContent).toContain('Nothing logged yet');

    openCat(h, 'core');
    h.click(h.$$('.lj-row').find(r => r.dataset.jobId === 'gas_repair'));
    h.click('#log-cat-back');

    const rows = h.$$('.lj-log-row');
    expect(rows).toHaveLength(1);
    expect(rows[0].querySelector('.lj-log-name').textContent).toContain('Gas Repair');
    expect(rows[0].querySelector('.lj-log-credit').textContent).toBe('+0.93h');
    expect(h.$('.lj-log-sum').textContent.replace(/\s+/g, ' ')).toContain('1 logged');

    h.click('.lj-log-del');
    const today = h.window.getTodayKey();
    const wk = h.state().weeks[h.window.getWeekKey(new Date(today + 'T00:00:00'))];
    expect((wk.days || {})[today]).toBeUndefined();
    expect(h.$('.lj-log-empty')).toBeTruthy();
  });

  it('shows the selected day\'s entries inside a category too', () => {
    const h = bootApp();
    openCat(h, 'core');
    h.click(h.$$('.lj-row').find(r => r.dataset.jobId === 'gas_repair'));
    // Still in the category — the confirmation comes to the engineer.
    expect(h.$('.lj-cat-title').textContent.trim()).toBe('Gas');
    expect(h.$$('.lj-log-row')).toHaveLength(1);
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

  it('searches across every category, not just the open one', () => {
    const h = bootApp();
    openCat(h, 'absent');
    h.click('#log-search-open');
    h.setValue('#job-search', 'gas repair', 'input');
    expect(h.$$('.lj-row').length).toBeGreaterThan(0);
    expect(h.$$('.lj-row').map(r => r.dataset.jobId)).toContain('gas_repair');
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
    openCat(h, 'core');
    const row = h.$$('.lj-row').find(r => r.dataset.jobId === 'gas_repair');
    h.click(row);
    const today = h.window.getTodayKey();
    const week = h.state().weeks[h.window.getWeekKey(new Date(today + 'T00:00:00'))];
    expect(week.days[today].filter(e => e.id === 'gas_repair')).toHaveLength(1);
  });

  it('promotes what you log to the front of Most used on the next visit', () => {
    const h = bootApp();
    // Seeded from the common domestic gas day, so the grid is useful on day one
    // rather than empty until the engineer has taught it something.
    expect(h.$$('.lj-top-grid .lj-chip')).toHaveLength(6);

    openCat(h, 'hive');
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
    // Boiler lead is 59 since the SGO recoupling (15 fulfilment + 44 SGO).
    expect(entries.reduce((s, e) => s + e.creditMins, 0)).toBe(6 * 56 + 2 * 59);
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
