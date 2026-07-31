// Reading a whole week back in one go.
//
// The parser used to find the first day named and hang the entire utterance off
// it, so "Monday six breakdowns, Tuesday three services" put nine jobs on the
// Monday. An engineer catching up on a Friday says the week as one sentence;
// that is the natural way to dictate it, and it has to land on the right days.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { bootApp } from './helpers/app-harness.js';

const require = createRequire(import.meta.url);
const data = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data.cjs'));
const { parseVoiceLog, splitVoiceDays, findVoiceDayMarkers, normaliseVoiceText } = data;

// Friday. Weekday names resolve to the most recent one on or before the ref.
const FRI = '2026-07-31';
const MON = '2026-07-27', TUE = '2026-07-28', WED = '2026-07-29', THU = '2026-07-30';

const parse = (say, ref = FRI) => parseVoiceLog(say, ref);

// Jobs on a given day, as { jobId: qty }.
function onDay(draft, dayKey) {
  const out = {};
  draft.items
    .filter(it => (it.dayKey || draft.dayKey) === dayKey)
    .forEach(it => { out[it.jobId] = (out[it.jobId] || 0) + it.qty; });
  return out;
}

describe('finding every day named', () => {
  it('finds them all, in the order spoken', () => {
    const text = normaliseVoiceText('monday six breakdowns tuesday three services thursday two breakdowns');
    expect(findVoiceDayMarkers(text, FRI).map(m => m.dayKey)).toEqual([MON, TUE, THU]);
  });

  it('does not read the "yesterday" inside "day before yesterday" as a second day', () => {
    const text = normaliseVoiceText('day before yesterday i did four breakdowns');
    const markers = findVoiceDayMarkers(text, FRI);
    expect(markers).toHaveLength(1);
    expect(markers[0].dayKey).toBe(WED);
  });

  it('finds nothing in a sentence with no day in it', () => {
    expect(findVoiceDayMarkers(normaliseVoiceText('six breakdowns two boiler leads'), FRI))
      .toHaveLength(0);
  });
});

describe('splitting the week up', () => {
  it('gives each day the work said after it', () => {
    const segs = splitVoiceDays(
      normaliseVoiceText('monday six breakdowns tuesday three services'), FRI);
    expect(segs.map(s => s.dayKey)).toEqual([MON, TUE]);
    expect(segs[0].body).toContain('breakdowns');
    expect(segs[0].body).not.toContain('services');
    expect(segs[1].body).toContain('services');
  });

  it('handles the day being said after the work instead of before it', () => {
    // "six breakdowns on Monday and three services on Tuesday" — jobs before
    // the first day name is the tell that the day trails its work.
    const segs = splitVoiceDays(
      normaliseVoiceText('six breakdowns on monday and three services on tuesday'), FRI);
    expect(segs.map(s => s.dayKey)).toEqual([MON, TUE]);
    expect(segs[0].body).toContain('breakdowns');
    expect(segs[1].body).toContain('services');
  });

  it('folds a day named twice back into one', () => {
    const segs = splitVoiceDays(
      normaliseVoiceText('monday two services and also on monday a breakdown'), FRI);
    expect(segs).toHaveLength(1);
    expect(segs[0].dayKey).toBe(MON);
  });
});

describe('parsing a week in one go', () => {
  it('puts each day\'s jobs on that day', () => {
    const d = parse('monday i did six breakdowns and two services tuesday i did three breakdowns and one boiler lead thursday two breakdowns');
    expect(d.days).toEqual([MON, TUE, THU]);
    expect(onDay(d, MON)).toEqual({ gas_repair: 6, asv_chb_cir_wh_swh: 2 });
    expect(onDay(d, TUE)).toEqual({ gas_repair: 3, hi_lead: 1 });
    expect(onDay(d, THU)).toEqual({ gas_repair: 2 });
  });

  it('reads Jake\'s wording — the way he actually said it', () => {
    const d = parse('monday six breakdowns two services tuesday three breakdowns one boiler lead');
    expect(onDay(d, MON)).toEqual({ gas_repair: 6, asv_chb_cir_wh_swh: 2 });
    expect(onDay(d, TUE)).toEqual({ gas_repair: 3, hi_lead: 1 });
  });

  it('mixes yesterday and today in one sentence', () => {
    const d = parse('yesterday i did four breakdowns and today two services');
    expect(d.days).toEqual([THU, FRI]);
    expect(onDay(d, THU)).toEqual({ gas_repair: 4 });
    expect(onDay(d, FRI)).toEqual({ asv_chb_cir_wh_swh: 2 });
  });

  it('keeps a duration with the day it was said on', () => {
    const d = parse('on wednesday a service and two hours wait work thursday three breakdowns');
    const wait = d.items.find(it => it.jobId === 'wait_work');
    expect(wait.dayKey).toBe(WED);
    expect(wait.value).toBe(2);
    expect(onDay(d, THU)).toEqual({ gas_repair: 3 });
  });

  it('merges a repeated job within a day but never across days', () => {
    const d = parse('monday two breakdowns and another breakdown tuesday four breakdowns');
    expect(onDay(d, MON)).toEqual({ gas_repair: 3 });
    expect(onDay(d, TUE)).toEqual({ gas_repair: 4 });
    // Three separate rows would be three separate steppers to correct.
    expect(d.items.filter(it => it.jobId === 'gas_repair')).toHaveLength(2);
  });
});

describe('what already worked still works', () => {
  it('logs to today when no day is named', () => {
    const d = parse('six breakdowns two boiler leads');
    expect(d.dayKey).toBe(FRI);
    expect(d.days).toEqual([FRI]);
    expect(onDay(d, FRI)).toEqual({ gas_repair: 6, hi_lead: 2 });
  });

  it('logs the whole sentence to the one day named, wherever it was said', () => {
    // Single day is untouched by the splitting — the day can sit anywhere.
    const before = parse('monday i did six breakdowns and two services');
    const after = parse('six breakdowns and two services on monday');
    expect(before.dayKey).toBe(MON);
    expect(after.dayKey).toBe(MON);
    expect(onDay(before, MON)).toEqual(onDay(after, MON));
  });

  it('returns an empty draft for silence', () => {
    const d = parse('');
    expect(d.items).toEqual([]);
    expect(d.days).toEqual([]);
  });
});

describe('confirming and writing a week', () => {
  // No SpeechRecognition in JSDOM, so the sheet opens straight into the typed
  // fallback — the same draft/confirm path the spoken route lands in.
  function speakInto(h, transcript) {
    h.click('#voice-btn');
    h.setValue('#voice-text', transcript, 'input');
    h.click('#voice-parse-text');
    return h;
  }

  const boot = () => bootApp({ now: FRI + 'T18:00:00' });

  it('shows one group per day, with the days as headers', () => {
    const h = speakInto(boot(), 'monday six breakdowns tuesday three services thursday two breakdowns');
    expect(h.$$('.voice-day-group')).toHaveLength(3);
    const labels = h.$$('.voice-day-group .voice-day-label').map(e => e.textContent);
    expect(labels[0]).toContain('Monday');
    expect(labels[1]).toContain('Tuesday');
    expect(labels[2]).toContain('Thursday');
  });

  it('writes each day\'s jobs to that day', () => {
    const h = speakInto(boot(), 'monday six breakdowns tuesday three services thursday two breakdowns');
    h.click('#voice-commit');
    const week = h.state().weeks['2026-07-27'];
    expect(week.days[MON]).toHaveLength(6);
    expect(week.days[TUE]).toHaveLength(3);
    expect(week.days[THU]).toHaveLength(2);
  });

  it('still writes a single-day dictation to the one day', () => {
    const h = speakInto(boot(), 'six breakdowns and two boiler leads');
    expect(h.$$('.voice-day-group')).toHaveLength(0);   // no grouping needed
    h.click('#voice-commit');
    expect(h.state().weeks['2026-07-27'].days[FRI]).toHaveLength(8);
  });

  it('moves one day without disturbing the others', () => {
    const h = speakInto(boot(), 'monday six breakdowns thursday two breakdowns');
    // Nudge Thursday's group back to Wednesday.
    h.click('[data-voice-day-shift="-1"][data-day="' + THU + '"]');
    h.click('#voice-commit');
    const week = h.state().weeks['2026-07-27'];
    expect(week.days[MON]).toHaveLength(6);
    expect(week.days[WED]).toHaveLength(2);
    expect(week.days[THU]).toBeUndefined();
  });

  it('refuses to move a day on top of another day in the same draft', () => {
    // Merging two groups silently would lose the engineer's own split.
    const h = speakInto(boot(), 'monday six breakdowns tuesday three services');
    h.click('[data-voice-day-shift="-1"][data-day="' + TUE + '"]');
    expect(h.$$('.voice-day-group')).toHaveLength(2);
    h.click('#voice-commit');
    const week = h.state().weeks['2026-07-27'];
    expect(week.days[MON]).toHaveLength(6);
    expect(week.days[TUE]).toHaveLength(3);
  });

  it('counts the days in the confirm line, so the spread is visible before writing', () => {
    const h = speakInto(boot(), 'monday six breakdowns tuesday three services');
    expect(h.$('.voice-total-label').textContent).toContain('2 days');
  });
});
