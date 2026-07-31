// What the recogniser hears is not what the engineer said.
//
// Jake: "when I say 'two hive installs' it comes up 'too' and 'high'". The
// recogniser has no trade dictionary and is not ours to fix, so the repair
// happens in normalisation — but only where the wrong word is one an engineer
// never says and the right word is one they say constantly.
//
// The tests that matter most here are the ones asserting a fold does NOT
// happen. A homophone rule that fires too eagerly turns correct speech into
// the wrong job, silently, which is worse than the miss it was fixing.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const data = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data.cjs'));
const { normaliseVoiceText, parseVoiceLog, VOICE_BROAD, voiceAssumedHint } = data;

const REF = '2026-07-31';
const parse = (say) => parseVoiceLog(say, REF);
const jobs = (say) => parse(say).items.map(it => ({ id: it.jobId, qty: it.qty }));

describe('the case Jake hit', () => {
  it('reads what iOS actually heard as what he actually said', () => {
    expect(normaliseVoiceText('too high installs')).toBe('two hive installs');
  });

  it('logs two Hive installs from it', () => {
    expect(jobs('too high installs')).toEqual([{ id: 'hvi_wls', qty: 2 }]);
  });

  it('flags the Hive install as a guess, since four jobs are "a hive install"', () => {
    const item = parse('two hive installs').items[0];
    expect(item.assumed).toBe(true);
  });

  it('matches the phrase even when heard correctly — it was missing entirely', () => {
    // The alias didn't exist, so this failed even with perfect recognition.
    expect(jobs('two hive installs')).toEqual([{ id: 'hvi_wls', qty: 2 }]);
    expect(VOICE_BROAD).toContain('hive installs');
  });
});

describe('the Hive install guess', () => {
  // Jake: mini and the standard wireless thermostat are most of them, wired is
  // less common, TRV less again. So the default is right and the job of the
  // prompt is to hand over the wording for the rarer two.
  it('names what it guessed rather than just saying "check"', () => {
    expect(voiceAssumedHint('hive installs')).toContain('Guessed wireless');
  });

  it('gives the exact words for the ones it might have got wrong', () => {
    const hint = voiceAssumedHint('hive installs');
    ['hive mini', 'hive wired', 'hive trvs'].forEach(say => expect(hint).toContain(say));
  });

  it('leaves the appliance wording alone for everything else', () => {
    expect(voiceAssumedHint('repairs')).toBe('check the appliance');
    expect(voiceAssumedHint('services')).toBe('check the appliance');
  });

  it('takes the exact wording without guessing at all', () => {
    const exact = (say) => {
      const it = parse(say).items[0];
      return { id: it.jobId, qty: it.qty, assumed: it.assumed };
    };
    expect(exact('two hive minis')).toEqual({ id: 'hvi_min', qty: 2, assumed: false });
    expect(exact('two hive wired')).toEqual({ id: 'hvi_wrd', qty: 2, assumed: false });
    expect(exact('two hive trvs')).toEqual({ id: 'hvi_trv', qty: 2, assumed: false });
    expect(exact('two hive wireless thermostats')).toEqual({ id: 'hvi_wls', qty: 2, assumed: false });
  });

  it('costs nothing in credit when the guess lands on the other common one', () => {
    // Mini and wireless are both 90 minutes, so mishearing one for the other
    // leaves the week's figure untouched. That is why the default is safe.
    const credit = id => data.findJob(id).minutes;
    expect(credit('hvi_wls')).toBe(credit('hvi_min'));
  });
});

describe('folding "high" to "hive"', () => {
  it('folds when a Hive-shaped word follows', () => {
    expect(normaliseVoiceText('two high trvs')).toBe('two hive trvs');
    expect(normaliseVoiceText('a high repair')).toBe('a hive repair');
    expect(normaliseVoiceText('high wireless thermostat')).toBe('hive wireless thermostat');
  });

  it('folds in front of the plural too — "high minis" is as likely as "high mini"', () => {
    expect(normaliseVoiceText('too high minis')).toBe('two hive minis');
    expect(jobs('too high minis')).toEqual([{ id: 'hvi_min', qty: 2 }]);
    expect(jobs('too high installs')).toEqual([{ id: 'hvi_wls', qty: 2 }]);
  });

  it('folds when the verb comes first', () => {
    // "install hive mini" — no lookbehind, so this is a separate rule.
    expect(normaliseVoiceText('install high mini')).toBe('install hive mini');
    expect(normaliseVoiceText('fitted high trvs')).toBe('fitted hive trvs');
  });

  it('leaves real trade speech alone', () => {
    // "high pressure" is a thing an engineer says. Folding it would invent a
    // Hive job out of a gas pressure reading.
    expect(normaliseVoiceText('high pressure test')).toBe('high pressure test');
    expect(normaliseVoiceText('the flue was too high')).toBe('the flue was two high');
    expect(jobs('high pressure test and two breakdowns'))
      .toEqual([{ id: 'gas_repair', qty: 2 }]);
  });
});

describe('number homophones', () => {
  it('folds words that have no business in a job dictation', () => {
    expect(normaliseVoiceText('too services')).toBe('two services');
    expect(normaliseVoiceText('tree breakdowns')).toBe('three breakdowns');
    expect(normaliseVoiceText('won service')).toBe('one service');
    expect(normaliseVoiceText('ate breakdowns')).toBe('eight breakdowns');
  });

  it('counts them properly rather than dropping to one', () => {
    // Unfolded, "too" lands in the unmatched pile and the count silently
    // becomes 1 — the engineer loses a job and nothing says so.
    expect(jobs('too breakdowns')).toEqual([{ id: 'gas_repair', qty: 2 }]);
    expect(jobs('ate breakdowns')).toEqual([{ id: 'gas_repair', qty: 8 }]);
  });

  it('never folds "free" — it would break the free gas safety check', () => {
    expect(normaliseVoiceText('free gas safety check')).toBe('free gas safety check');
    expect(jobs('a free gas safety check and two services'))
      .toEqual([{ id: 'free_gas_safety', qty: 1 }, { id: 'asv_chb_cir_wh_swh', qty: 2 }]);
  });

  it('never folds "for", which is far too common to touch', () => {
    expect(normaliseVoiceText('a service for the landlord')).toContain('for');
  });
});

describe('contractions', () => {
  it("reads I've as filler rather than as something it couldn't understand", () => {
    expect(normaliseVoiceText("i've done six breakdowns")).toBe('ive done six breakdowns');
    expect(parse("i've done six breakdowns").unmatched).toEqual([]);
  });

  it('still strips possessives', () => {
    expect(normaliseVoiceText("the landlord's inspection")).toBe('the landlord inspection');
  });
});

describe('leftovers reported back', () => {
  it('does not report a run whose only unmatched words were filler', () => {
    // "two of these services" — Jake's own wording. "these" was meaningful, so
    // the whole run came back flagged when nothing was actually wrong.
    expect(parse('six breakdowns and two of these services').unmatched).toEqual([]);
  });

  it('still reports a genuinely unrecognised run', () => {
    expect(parse('two breakdowns and a widget flange').unmatched.length).toBeGreaterThan(0);
  });
});
