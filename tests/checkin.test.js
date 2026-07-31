// The check-in is a diary the engineer keeps for themselves.
//
// Most of what follows is not testing behaviour so much as pinning down the
// things that make this feature safe to have at all: that it never ranks the
// engineer against anyone, never tells them why their week went the way it
// did, and gives job detail nowhere to land. Those properties are invisible in
// a diff — someone adds a helpful-sounding line of copy and the whole thing
// quietly becomes a performance-management tool. See ADR-0012.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bootApp } from './helpers/app-harness.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const data = require(join(ROOT, 'app', 'data.cjs'));

const {
  CHECKIN_FACTORS, CHECKIN_RATINGS, CHECKIN_PROMPTS, CHECKIN_NOTE_MAX,
  checkinFactorsForDay, checkinPromptForDay,
  getOrCreateCheckin, checkinIsEmpty, checkinAnsweredCount,
  checkinRatingScore, weekCheckinAverage, checkinBand, checkinNoteWarning,
} = data;

// Monday-anchored week used across the state-shaped tests.
const WEEK = '2026-07-27';
const DAYS = ['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30', '2026-07-31'];

function stateWith(checkins) {
  return { baseHours: 40, weeks: {}, checkins };
}

describe('the rating scale', () => {
  it('is three-way, never binary — a middling day has an honest answer', () => {
    expect(CHECKIN_RATINGS.map(r => r.value)).toEqual(['no', 'mid', 'yes']);
  });

  it('scores mid strictly between no and yes, so it is not a disguised no', () => {
    expect(checkinRatingScore('no')).toBeLessThan(checkinRatingScore('mid'));
    expect(checkinRatingScore('mid')).toBeLessThan(checkinRatingScore('yes'));
  });

  it('scores an unanswered factor as null, not zero — skipping is not "not really"', () => {
    expect(checkinRatingScore(undefined)).toBeNull();
    expect(checkinRatingScore(null)).toBeNull();
    expect(checkinRatingScore('')).toBeNull();
  });
});

describe('rotation', () => {
  it('asks two factors a day — short enough to actually do daily', () => {
    DAYS.forEach(dk => expect(checkinFactorsForDay(dk)).toHaveLength(2));
  });

  it('never asks the same factor twice in one day', () => {
    DAYS.forEach(dk => {
      const [a, b] = checkinFactorsForDay(dk);
      expect(a.tag).not.toBe(b.tag);
    });
  });

  it('covers all five factors across any five consecutive days', () => {
    // Walk a whole year rather than one lucky window.
    for (let offset = 0; offset < 365; offset++) {
      const start = new Date('2026-01-01T00:00:00Z');
      start.setUTCDate(start.getUTCDate() + offset);
      const seen = new Set();
      for (let d = 0; d < 5; d++) {
        const day = new Date(start);
        day.setUTCDate(start.getUTCDate() + d);
        checkinFactorsForDay(day.toISOString().slice(0, 10)).forEach(f => seen.add(f.tag));
      }
      expect(seen.size, `window starting +${offset}d`).toBe(CHECKIN_FACTORS.length);
    }
  });

  it('gives the same day the same questions every time it is asked', () => {
    // Re-opening the sheet must not reshuffle the questions mid-answer.
    const first = checkinFactorsForDay('2026-07-31').map(f => f.tag);
    const again = checkinFactorsForDay('2026-07-31').map(f => f.tag);
    expect(again).toEqual(first);
    expect(checkinPromptForDay('2026-07-31').id).toBe(checkinPromptForDay('2026-07-31').id);
  });

  it('rotates the reflection prompt rather than asking one thing forever', () => {
    const ids = new Set(DAYS.map(dk => checkinPromptForDay(dk).id));
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('the reflection prompts', () => {
  it('ask about feeling and behaviour, never about which job or customer', () => {
    const banned = ['customer name', 'address', 'which job', 'job number', 'postcode', 'who '];
    CHECKIN_PROMPTS.forEach(p => {
      banned.forEach(word =>
        expect(p.text.toLowerCase(), `${p.id}: "${p.text}"`).not.toContain(word));
    });
  });

  it('are phrased as questions the engineer answers about themselves', () => {
    CHECKIN_PROMPTS.forEach(p => expect(p.text.trim().endsWith('?'), p.id).toBe(true));
  });
});

describe('nothing is required', () => {
  it('treats a check-in with no answers as empty', () => {
    expect(checkinIsEmpty(null)).toBe(true);
    expect(checkinIsEmpty({ ratings: {}, note: '' })).toBe(true);
    expect(checkinIsEmpty({ ratings: {}, note: '   ' })).toBe(true);
  });

  it('accepts a note with no ratings, and ratings with no note', () => {
    expect(checkinIsEmpty({ ratings: {}, note: 'felt rushed' })).toBe(false);
    expect(checkinIsEmpty({ ratings: { process: 'mid' }, note: '' })).toBe(false);
  });

  it('counts one partly-filled day as partly filled, not as a failure', () => {
    expect(checkinAnsweredCount({ ratings: { process: 'yes' }, note: '' })).toBe(1);
    expect(checkinAnsweredCount({ ratings: { process: 'yes' }, note: 'ok' })).toBe(2);
  });
});

describe('the weekly dot', () => {
  it('averages every rating given that week', () => {
    const s = stateWith({
      '2026-07-27': { ratings: { van_tools: 'yes', safety_first: 'yes' } },
      '2026-07-28': { ratings: { process: 'no', fault_finding: 'no' } },
    });
    expect(weekCheckinAverage(s, WEEK)).toEqual({ avg: 1, n: 4 });
  });

  it('is null for a week with no check-ins at all', () => {
    expect(weekCheckinAverage(stateWith({}), WEEK)).toBeNull();
  });

  it('is null for a week that was opened but never answered', () => {
    // An empty entry must not be read as four silent "no"s.
    const s = stateWith({ '2026-07-27': { ratings: {}, note: '' } });
    expect(weekCheckinAverage(s, WEEK)).toBeNull();
  });

  it('shows an unrated week as hollow, never as red — silence is not a bad score', () => {
    expect(checkinBand(null)).toBe('none');
    expect(checkinBand(undefined)).toBe('none');
  });

  it('bands mostly-yes green, so-so amber, not-really red', () => {
    expect(checkinBand(2)).toBe('green');
    expect(checkinBand(1)).toBe('amber');
    expect(checkinBand(0)).toBe('red');
  });

  it('ignores days outside the week it was asked about', () => {
    const s = stateWith({
      '2026-07-26': { ratings: { process: 'no' } },   // Sunday before
      '2026-08-03': { ratings: { process: 'no' } },   // Monday after
      '2026-07-29': { ratings: { process: 'yes' } },
    });
    expect(weekCheckinAverage(s, WEEK)).toEqual({ avg: 2, n: 1 });
  });
});

describe('keeping job detail out of the note', () => {
  it('says nothing about an ordinary reflection', () => {
    expect(checkinNoteWarning('felt rushed on the last one, kept checking the clock')).toBeNull();
    expect(checkinNoteWarning('')).toBeNull();
    expect(checkinNoteWarning(null)).toBeNull();
  });

  it('warns on a postcode, an address, a phone number, and a long reference', () => {
    expect(checkinNoteWarning('the one over at NE12 8QR')).toContain('postcode');
    expect(checkinNoteWarning('14 Windsor Road took ages')).toContain('address');
    expect(checkinNoteWarning('rang them on 07700900123')).toContain('phone');
    expect(checkinNoteWarning('job 884213907 was a nightmare')).toContain('job or account');
  });

  it('points at how it felt rather than telling the engineer off', () => {
    const w = checkinNoteWarning('the one over at NE12 8QR');
    expect(w).toContain('how it felt');
    expect(w.toLowerCase()).not.toContain('not allowed');
    expect(w.toLowerCase()).not.toContain('error');
  });

  it('caps the note short enough that an incident report will not fit', () => {
    expect(CHECKIN_NOTE_MAX).toBeLessThanOrEqual(280);
  });
});

// ── The properties that make this safe to ship ─────────────────────────────

describe('the schema gives customer detail nowhere to land', () => {
  const schema = readFileSync(join(ROOT, 'schema.sql'), 'utf8');
  const table = schema.slice(
    schema.indexOf('create table if not exists public.checkins'),
    schema.indexOf('alter table public.checkins enable row level security')
  );

  it('has a checkins table at all, so the assertions below are not vacuous', () => {
    expect(table.length).toBeGreaterThan(100);
  });

  it('has no column for a customer name, address, or job reference', () => {
    // Column names only — "customer" is a legitimate factor tag inside a CHECK
    // constraint, and matching raw text would flag it.
    const columns = table.split('\n')
      .map(l => l.trim())
      .filter(l => /^[a-z_]+\s+\S/.test(l) && !/^(create|constraint)\b/.test(l))
      .map(l => l.split(/\s+/)[0]);

    expect(columns).toContain('reflection_note');   // the parse works
    ['customer', 'address', 'postcode', 'job_id', 'job_ref', 'job_number', 'site', 'phone', 'name']
      .forEach(banned => expect(columns, banned).not.toContain(banned));
  });

  it('caps the note in the database, not only in the UI', () => {
    expect(table).toMatch(/char_length\(reflection_note\)\s*<=\s*280/);
  });

  it('constrains the rating to the three-way scale', () => {
    expect(table).toMatch(/rating in \('no', 'mid', 'yes'\)/);
  });

  it('locks reads and writes to the row owner and grants nobody else access', () => {
    const policies = schema.slice(schema.indexOf('create policy "checkins'));
    const block = policies.slice(0, policies.indexOf('create unique index'));
    expect(block).toContain('using (user_id = auth.uid())');
    expect(block).toContain('with check (user_id = auth.uid())');
    // One policy only. A second on this table is how a team-wide read sneaks in.
    expect(schema.match(/create policy "checkins/g)).toHaveLength(1);
  });
});

describe('what the check-in surfaces actually render', () => {
  function boot() {
    const h = bootApp();
    const nav = (t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
    return Object.assign(h, { nav });
  }

  // Eight completed weeks of credits, with self-ratings good in some and poor
  // in others — the exact setup where a "helpful" correlation line would appear.
  function bootWithHistory() {
    const h = boot();
    const s = h.state();
    s.checkins = {};
    for (let i = 1; i <= 8; i++) {
      const mon = new Date();
      mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) - i * 7);
      const wk = data.getWeekKey(mon);
      s.weeks[wk] = { deductionMins: 0, days: {} };
      s.weeks[wk].days[wk] = [{ jobId: 'gas_repair', name: 'Repair', creditMins: 60 * (20 + i) }];
      s.checkins[wk] = { ratings: { process: i % 2 ? 'yes' : 'no', customer: i % 2 ? 'yes' : 'no' }, note: '' };
    }
    return h;
  }

  it('offers today\'s check-in on the dashboard', () => {
    const h = boot();
    h.nav('dashboard');
    expect(h.$('#checkin-open')).toBeTruthy();
  });

  it('saves a rating and a note, and shows the day as checked in', () => {
    const h = boot();
    h.nav('dashboard');
    h.click('#checkin-open');
    const tag = checkinFactorsForDay(data.getTodayKey())[0].tag;
    h.click(`[data-checkin-factor="${tag}"][data-checkin-rating="mid"]`);
    h.setValue('#checkin-note', 'felt rushed by the last one', 'input');
    h.click('#checkin-save');

    const entry = h.state().checkins[data.getTodayKey()];
    expect(entry.ratings[tag]).toBe('mid');
    expect(entry.note).toBe('felt rushed by the last one');
    expect(h.$('.checkin-card-done')).toBeTruthy();
  });

  it('saves a note on its own, with every rating skipped', () => {
    const h = boot();
    h.nav('dashboard');
    h.click('#checkin-open');
    h.setValue('#checkin-note', 'quiet one, felt fine', 'input');
    h.click('#checkin-save');
    const entry = h.state().checkins[data.getTodayKey()];
    expect(entry.ratings).toEqual({});
    expect(entry.note).toBe('quiet one, felt fine');
  });

  it('lets a tapped rating be untapped, so a mis-tap is not a permanent answer', () => {
    const h = boot();
    h.nav('dashboard');
    h.click('#checkin-open');
    const tag = checkinFactorsForDay(data.getTodayKey())[0].tag;
    h.click(`[data-checkin-factor="${tag}"][data-checkin-rating="yes"]`);
    h.click(`[data-checkin-factor="${tag}"][data-checkin-rating="yes"]`);
    h.click('#checkin-save');
    expect(h.state().checkins[data.getTodayKey()].ratings[tag]).toBeUndefined();
  });

  it('carries the exact placeholder wording the note field is supposed to say', () => {
    const h = boot();
    h.nav('dashboard');
    h.click('#checkin-open');
    expect(h.$('#checkin-note').getAttribute('placeholder'))
      .toBe('No customer names, addresses, or job details — how it felt, not what happened.');
  });

  it('tells the engineer the diary is theirs alone', () => {
    const h = boot();
    h.nav('dashboard');
    h.click('#checkin-open');
    expect(h.$('.checkin-intro').textContent.toLowerCase()).toContain('only you');
  });

  it('puts a dot per week under the trend chart once there is anything to show', () => {
    const h = bootWithHistory();
    h.nav('history');
    const bars = h.$$('.trend-col').length;
    const dots = h.$$('.trend-dot-col').length;
    expect(bars).toBeGreaterThan(0);
    expect(dots).toBe(bars);
  });

  function trendText() {
    const h = bootWithHistory();
    h.nav('history');
    const wrap = h.$('.trend-chart-wrap');
    return wrap ? wrap.textContent : '';
  }

  it('never draws the inference for the engineer', () => {
    const text = trendText().toLowerCase();
    expect(text.length).toBeGreaterThan(10);
    ['because', 'correlat', 'you did better', 'you earned more', 'when you rated', 'linked to',
     'suggests', 'shows that', 'proves']
      .forEach(phrase => expect(text, phrase).not.toContain(phrase));
  });

  it('never compares the engineer to anyone else, anywhere in the feature', () => {
    const h = bootWithHistory();
    h.nav('history');
    // #app, not body — the harness inlines app.js as a <script>, whose source
    // would otherwise be swept into textContent.
    const history = h.$('#app').textContent.toLowerCase();
    h.nav('dashboard');
    h.click('#checkin-open');
    const sheet = h.$('#checkin-sheet').textContent.toLowerCase();
    [history, sheet].forEach(text => {
      ['rank', 'leaderboard', 'other engineers', 'team average', 'compared to the team',
       'top 10', 'percentile', 'vs your team']
        .forEach(word => expect(text, word).not.toContain(word));
    });
  });

  it('never lets Coach reach into the diary', () => {
    // Coach exists to talk about credits. The moment it starts saying "your
    // safety ratings dipped" the diary stops being a private thing.
    const h = bootWithHistory();
    h.window.localStorage.setItem('jcpd_coach_mode', 'true');
    h.state().startingBalance = -12;
    h.nav('dashboard');
    const coach = [...h.doc.querySelectorAll('.coach-card, .coach-opp-strip, .tip-row')]
      .map(e => e.textContent.toLowerCase()).join(' ');
    ['check-in', 'checkin', 'self-rating', 'rated yourself', 'reflection', 'your notes']
      .forEach(word => expect(coach, word).not.toContain(word));
  });

  it('disappears entirely when the engineer turns it off', () => {
    const h = bootWithHistory();
    h.window.localStorage.setItem('jcpd_checkin_on', 'false');
    h.nav('dashboard');
    expect(h.$('#checkin-open')).toBeNull();
    h.nav('history');
    expect(h.$$('.trend-dot-col')).toHaveLength(0);
  });
});
