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
  CHECKIN_FACTORS, CHECKIN_RATINGS, CHECKIN_NOTE_MAX, CHECKIN_GOAL_MAX,
  GROW_STAGES, GROW_QUESTIONS,
  growStageForDay, growBankForDay, growQuestionForDay,
  getWeekGoal, setWeekGoal, goalText, goalAsk, goalRatingTag,
  checkinIsEmpty, checkinAnsweredCount,
  checkinRatingScore, weekCheckinAverage, checkinBand, checkinNoteWarning,
} = data;

// Every question the app can ever ask, flattened.
const ALL_QUESTIONS = Object.values(GROW_QUESTIONS).flat();

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

describe('the GROW arc across the week', () => {
  // 2026-07-27 is a Monday.
  const [MON, TUE, WED, THU, FRI] = DAYS;
  const SAT = '2026-08-01', SUN = '2026-08-02';

  it('runs Goal, Reality, Reality, Options, Will across the working week', () => {
    expect(DAYS.map(growStageForDay))
      .toEqual(['goal', 'reality', 'reality', 'options', 'will']);
  });

  it('puts Reality mid-week, while there is still week left to change', () => {
    // Reality after Will would just be a post-mortem. The order is the point.
    const order = GROW_STAGES.map(s => s.id);
    expect(order.indexOf(growStageForDay(TUE)))
      .toBeLessThan(order.indexOf(growStageForDay(THU)));
    expect(order.indexOf(growStageForDay(THU)))
      .toBeLessThan(order.indexOf(growStageForDay(FRI)));
  });

  it('asks the two Reality days from different angles', () => {
    // Tuesday looks for what is in the way; Wednesday looks for what worked.
    // A week of only problem-hunting teaches the engineer nothing repeatable.
    expect(growBankForDay(TUE)).toBe('reality_obstacle');
    expect(growBankForDay(WED)).toBe('reality_exception');
  });

  it('holds on Will over the weekend rather than starting something new', () => {
    // A Friday worked through can still be closed on Sunday night.
    expect(growStageForDay(SAT)).toBe('will');
    expect(growStageForDay(SUN)).toBe('will');
  });

  it('gives the same day the same question every time it is asked', () => {
    // Re-opening the sheet must not reshuffle the question mid-answer.
    expect(growQuestionForDay(TUE).id).toBe(growQuestionForDay(TUE).id);
    expect(growQuestionForDay(TUE).text).toBe(growQuestionForDay(TUE).text);
  });

  it('varies the question week to week', () => {
    // The same Tuesday question for a year stops being a question and becomes
    // a form field.
    const ids = new Set();
    for (let w = 0; w < 4; w++) {
      const d = new Date(TUE + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + w * 7);
      ids.add(growQuestionForDay(d.toISOString().slice(0, 10)).id);
    }
    expect(ids.size).toBeGreaterThan(1);
  });

  it('draws every question from the bank belonging to that day', () => {
    for (let offset = 0; offset < 200; offset++) {
      const d = new Date('2026-01-01T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + offset);
      const dk = d.toISOString().slice(0, 10);
      const q = growQuestionForDay(dk);
      const bank = GROW_QUESTIONS[growBankForDay(dk)];
      expect(bank.map(x => x.id), dk).toContain(q.id);
    }
  });
});

describe('the questions themselves', () => {
  it('are all open questions the engineer answers', () => {
    ALL_QUESTIONS.forEach(q =>
      expect(q.text.trim().endsWith('?'), `${q.id}: "${q.text}"`).toBe(true));
  });

  it('never supply the answer', () => {
    // A coach that hands over the answer produces compliance, and compliance
    // does not persist. The engineer generates the options, or this is just
    // advice with a question mark on the end.
    //
    // Word boundaries, not substrings: "try tomorrow" contains "try to".
    const TELLS = [
      /\byou should\b/, /\byou ought\b/, /\byou need to\b/, /\byou must\b/,
      /\bmake sure\b/, /\bremember to\b/, /\bthe best way\b/,
      /\bwe suggest\b/, /\bwe recommend\b/, /\bwhy not\b/, /\bhave you tried\b/,
    ];
    ALL_QUESTIONS.forEach(q => {
      TELLS.forEach(tell =>
        expect(tell.test(q.text.toLowerCase()), `${q.id}: "${q.text}" matched ${tell}`).toBe(false));
    });
  });

  it('never ask about a customer, an address, or which job', () => {
    ALL_QUESTIONS.forEach(q => {
      const t = q.text.toLowerCase();
      ['customer name', 'address', 'which customer', 'job number', 'postcode']
        .forEach(word => expect(t, `${q.id}: "${q.text}"`).not.toContain(word));
    });
  });

  it('asks at least one question that points at another person', () => {
    // Relatedness is the weakest of the three needs in a single-user app. It
    // isn't faked with social features; it's served by pointing outward at
    // people who already exist. See ADR-0013.
    expect(GROW_QUESTIONS.options.some(q => /\bwho\b/i.test(q.text))).toBe(true);
  });
});

describe("the week's goal", () => {
  it('is the engineer\'s to set — the app ships a menu, not a default', () => {
    const s = stateWith({});
    expect(getWeekGoal(s, WEEK)).toBeNull();
  });

  it('records a goal picked from the menu', () => {
    const s = stateWith({});
    setWeekGoal(s, WEEK, { factorTag: 'safety_first' });
    const g = getWeekGoal(s, WEEK);
    expect(g.factorTag).toBe('safety_first');
    expect(goalText(g)).toBe(CHECKIN_FACTORS.find(f => f.tag === 'safety_first').goal);
  });

  it('records a goal the engineer wrote themselves', () => {
    const s = stateWith({});
    setWeekGoal(s, WEEK, { customText: 'Stop skipping my flue checks' });
    const g = getWeekGoal(s, WEEK);
    expect(g.factorTag).toBe('custom');
    expect(goalText(g)).toBe('Stop skipping my flue checks');
    expect(goalAsk(g)).toMatch(/\?$/);
  });

  it('caps a written goal at a sentence — a goal is not a plan', () => {
    const s = stateWith({});
    setWeekGoal(s, WEEK, { customText: 'x'.repeat(400) });
    expect(goalText(getWeekGoal(s, WEEK)).length).toBe(CHECKIN_GOAL_MAX);
  });

  it('prefers what the engineer typed over what they tapped', () => {
    const s = stateWith({});
    setWeekGoal(s, WEEK, { factorTag: 'process', customText: 'My own thing' });
    expect(goalText(getWeekGoal(s, WEEK))).toBe('My own thing');
  });

  it('files the daily rating under the goal, so the dots track what was chosen', () => {
    expect(goalRatingTag({ factorTag: 'van_tools', customText: '' })).toBe('van_tools');
    expect(goalRatingTag({ factorTag: 'custom', customText: 'mine' })).toBe('custom');
    expect(goalRatingTag(null)).toBeNull();
  });

  it('every menu goal has a matching end-of-day question', () => {
    CHECKIN_FACTORS.forEach(f => {
      expect(f.goal, f.tag).toBeTruthy();
      expect(f.ask.trim().endsWith('?'), f.tag).toBe(true);
    });
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
    const policies = schema.slice(schema.indexOf('create policy "checkins:'));
    const block = policies.slice(0, policies.indexOf('create unique index'));
    expect(block).toContain('using (user_id = auth.uid())');
    expect(block).toContain('with check (user_id = auth.uid())');
    // One policy per table. A second is how a team-wide read sneaks in.
    expect(schema.match(/create policy "checkins:/g)).toHaveLength(1);
    expect(schema.match(/create policy "checkin_goals:/g)).toHaveLength(1);
  });

  it('locks the goals table to its owner too', () => {
    const block = schema.slice(schema.indexOf('create policy "checkin_goals:'));
    expect(block.slice(0, 300)).toContain('using (user_id = auth.uid())');
    expect(block.slice(0, 300)).toContain('with check (user_id = auth.uid())');
  });

  it('keeps the engineer\'s goal in its own table, not alongside the CTAP target', () => {
    // The CTAP target is the employer's number and lives on `weeks`. Putting the
    // engineer's self-set goal there would make the two confusable, which is
    // exactly the distinction the feature rests on.
    expect(schema).toContain('create table if not exists public.checkin_goals');
    const weeksTable = schema.slice(
      schema.indexOf('create table if not exists public.weeks'),
      schema.indexOf('alter table public.weeks enable row level security')
    );
    expect(weeksTable).not.toContain('goal');
  });
});

describe('what the check-in surfaces actually render', () => {
  // Fixed days so the arc is deterministic. 2026-07-27 is a Monday.
  const MONDAY = '2026-07-27T09:00:00';
  const TUESDAY = '2026-07-28T18:00:00';

  function boot(now = TUESDAY) {
    const h = bootApp({ now });
    const nav = (t) => h.click(h.$$('.bottom-nav button').find(b => b.dataset.tab === t));
    return Object.assign(h, { nav });
  }

  // Open the sheet with this week's goal already chosen.
  function withGoal(now = TUESDAY, tag = 'safety_first') {
    const h = boot(now);
    h.nav('dashboard');
    h.click('#checkin-open');
    h.click(`[data-goal-factor="${tag}"]`);
    h.click('#checkin-save');
    h.click('#checkin-open');
    return h;
  }

  // Eight completed weeks of credits, with self-ratings good in some and poor
  // in others — the exact setup where a "helpful" correlation line would appear.
  function bootWithHistory(now = TUESDAY) {
    const h = boot(now);
    const s = h.state();
    s.checkins = {};
    for (let i = 1; i <= 8; i++) {
      const mon = new Date(now);
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

  it('asks for a goal before anything else, and never picks one itself', () => {
    const h = boot(MONDAY);
    h.nav('dashboard');
    h.click('#checkin-open');
    expect(h.$$('[data-goal-factor]').length).toBe(CHECKIN_FACTORS.length);
    // Nothing pre-selected: the engineer chooses, or there is no goal.
    expect(h.$$('.goal-opt.selected')).toHaveLength(0);
    expect(h.state().coachGoals || {}).toEqual({});
  });

  it('records a goal picked from the menu, against the week', () => {
    const h = boot(MONDAY);
    h.nav('dashboard');
    h.click('#checkin-open');
    h.click('[data-goal-factor="safety_first"]');
    h.click('#checkin-save');
    expect(h.state().coachGoals['2026-07-27'].factorTag).toBe('safety_first');
  });

  it('records a goal the engineer typed instead', () => {
    const h = boot(MONDAY);
    h.nav('dashboard');
    h.click('#checkin-open');
    h.setValue('#goal-custom', 'Stop skipping my flue checks', 'input');
    h.click('#checkin-save');
    const g = h.state().coachGoals['2026-07-27'];
    expect(g.factorTag).toBe('custom');
    expect(g.customText).toBe('Stop skipping my flue checks');
  });

  it('carries the goal into the following days and rates against it', () => {
    const h = withGoal(TUESDAY, 'safety_first');
    expect(h.$('.goal-banner-text').textContent)
      .toBe(CHECKIN_FACTORS.find(f => f.tag === 'safety_first').goal);
    // The single rating shown is about the chosen goal, not a fixed checklist.
    const tags = new Set(h.$$('[data-checkin-factor]').map(b => b.dataset.checkinFactor));
    expect([...tags]).toEqual(['safety_first']);
  });

  it('shows the week in figures on a Reality day, and passes no verdict on them', () => {
    const h = withGoal(TUESDAY);
    const panel = h.$('.reality-panel');
    expect(panel).toBeTruthy();
    const labels = h.$$('.reality-label').map(e => e.textContent);
    expect(labels).toContain('EARNED');
    expect(labels).toContain('JOBS');
    expect(labels.some(l => l === 'TO GO' || l === 'AHEAD')).toBe(true);
    // Figures only. The moment this panel gains an adjective it stops being
    // Reality and becomes the app's opinion of the engineer.
    const text = panel.textContent.toLowerCase();
    ['should', 'need to', 'good', 'bad', 'poor', 'well done', 'behind schedule']
      .forEach(word => expect(text, word).not.toContain(word));
  });

  it('never calls a half-finished week a shortfall', () => {
    // On Tuesday the whole week's target is still ahead of you. "Short by" is a
    // verdict on a week that has barely started.
    const h = withGoal(TUESDAY);
    const text = h.$('.reality-panel').textContent.toLowerCase();
    ['short', 'behind', 'missed', 'failed', 'off track']
      .forEach(word => expect(text, word).not.toContain(word));
  });

  it('asks why the goal matters on the day it is set, not what it is again', () => {
    // The picker already asked what. Asking it twice in one sheet is the kind
    // of thing that makes a daily habit feel like paperwork.
    const h = boot(MONDAY);
    h.nav('dashboard');
    h.click('#checkin-open');
    const asks = h.$$('.checkin-factor-ask').map(e => e.textContent);
    expect(asks).toHaveLength(2);
    expect(asks[0]).toContain('what do you want to be different'.replace(/^./, c => c.toUpperCase()));
    expect(asks[1]).not.toBe(asks[0]);
    expect(asks[1].toLowerCase()).toMatch(/why|worth|friday/);
  });

  it("shows where you are in the week's arc", () => {
    const h = withGoal(TUESDAY);
    expect(h.$$('.grow-pip').length).toBe(GROW_STAGES.length);
    expect(h.$('.grow-pip.active').textContent).toBe('Reality');
  });

  it('saves a rating and a note, and shows the day as checked in', () => {
    const h = withGoal(TUESDAY, 'safety_first');
    h.click('[data-checkin-factor="safety_first"][data-checkin-rating="mid"]');
    h.setValue('#checkin-note', 'felt rushed by the last one', 'input');
    h.click('#checkin-save');

    const entry = h.state().checkins['2026-07-28'];
    expect(entry.ratings.safety_first).toBe('mid');
    expect(entry.note).toBe('felt rushed by the last one');
    expect(h.$('.checkin-card-done')).toBeTruthy();
  });

  it('records which question the note was answering', () => {
    const h = withGoal(TUESDAY);
    h.setValue('#checkin-note', 'kept getting pulled off it', 'input');
    h.click('#checkin-save');
    expect(h.state().checkins['2026-07-28'].promptId)
      .toBe(growQuestionForDay('2026-07-28').id);
  });

  it('saves a note on its own, with the rating skipped', () => {
    const h = withGoal(TUESDAY);
    h.setValue('#checkin-note', 'quiet one, felt fine', 'input');
    h.click('#checkin-save');
    const entry = h.state().checkins['2026-07-28'];
    expect(entry.ratings).toEqual({});
    expect(entry.note).toBe('quiet one, felt fine');
  });

  it('lets a tapped rating be untapped, so a mis-tap is not a permanent answer', () => {
    const h = withGoal(TUESDAY, 'process');
    h.click('[data-checkin-factor="process"][data-checkin-rating="yes"]');
    h.click('[data-checkin-factor="process"][data-checkin-rating="yes"]');
    h.click('#checkin-save');
    expect(h.state().checkins['2026-07-28'].ratings.process).toBeUndefined();
  });

  it('carries the exact placeholder wording the note field is supposed to say', () => {
    const h = withGoal(TUESDAY);
    expect(h.$('#checkin-note').getAttribute('placeholder'))
      .toBe('No customer names, addresses, or job details — how it felt, not what happened.');
  });

  it('tells the engineer the diary is theirs alone', () => {
    const h = withGoal(TUESDAY);
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
