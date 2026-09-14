// The recogniser has never heard of a breakdown.
//
// Jake: "I said 'six breakdowns' and it came up 'six bank accounts'". Safari
// has no grammar list to hand the engine, so the vocabulary lives on our side
// of it in two places: a table of the phrases the engine actually produces for
// job words (VOICE_MISHEARD), and a scorer that picks, out of the readings the
// engine offers, the one that names the most jobs (bestVoiceAlternative).
//
// As with the homophones, the tests that matter are the ones proving a fold
// does NOT fire on something an engineer might genuinely say.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const data = require(join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data.cjs'));
const { normaliseVoiceText, parseVoiceLog, VOICE_MISHEARD, voiceVocabularyScore, bestVoiceAlternative } = data;

const REF = '2026-09-14';
const parse = (say) => parseVoiceLog(say, REF);
const jobs = (say) => parse(say).items.map(it => ({ id: it.jobId, qty: it.qty }));

describe('the case Jake hit', () => {
  it('reads "six bank accounts" as six breakdowns', () => {
    expect(normaliseVoiceText('six bank accounts')).toBe('six breakdowns');
    expect(jobs('six bank accounts')).toEqual([{ id: 'gas_repair', qty: 6 }]);
    expect(parse('six bank accounts').unmatched).toEqual([]);
  });

  it('still flags it as a guessed appliance, the way "breakdowns" always is', () => {
    expect(parse('six bank accounts').items[0].assumed).toBe(true);
  });
});

describe('phrases the engine produces for job words', () => {
  // Each pair: what the iPhone tends to write → what was said. Every left-hand
  // side is something nobody says while logging gas jobs.
  const cases = [
    ['a bank account', 'a breakdown'],
    ['two break downs', 'two breakdowns'],
    ['two brake downs', 'two breakdowns'],
    ['three surfaces', 'three services'],
    ['a surface', 'a service'],
    ['a fire surface', 'a fire service'],
    ['an inhibiter', 'an inhibitor'],
    ['an open term upgrade', 'an opentherm upgrade'],
    ['a buy box collection', 'a bybox collection'],
    ['two first fixed', 'two first fix'],
    ['a boiler leed', 'a boiler lead'],
    ['three boiler lids', 'three boiler leads'],
    ['an invented cylinder', 'an unvented cylinder'],
    ['a multi point service', 'a multipoint service'],
    ['a warm hair service', 'a warm air service'],
    ['a hymn upgrade', 'a him upgrade'],
    ['a see o alarm', 'a co alarm'],
    ['empty quick thirty minutes', 'npt thirty minutes'],
    ['two t r vs', 'two trvs'],
    ['two hi installs', 'two hive installs'],
    ['a hive minnie', 'a hive mini'],
    ['a call-out', 'a call out'],
    ['forty-five minutes trace and repair', 'forty five minutes trace and repair'],
  ];
  cases.forEach(([heard, said]) => {
    it(`"${heard}" → "${said}"`, () => {
      expect(normaliseVoiceText(heard)).toBe(said);
    });
  });

  it('lands each of them on a job, with nothing left unrecognised', () => {
    expect(jobs('three surfaces and a fire surface'))
      .toEqual([{ id: 'asv_chb_cir_wh_swh', qty: 3 }, { id: 'asv_fre', qty: 1 }]);
    expect(jobs('an open term upgrade')).toEqual([{ id: 'hvi_hub', qty: 1 }]);
    expect(jobs('three boiler lids')).toEqual([{ id: 'hi_lead', qty: 3 }]);
    expect(jobs('two t r vs')).toEqual([{ id: 'hvi_trv', qty: 2 }]);
    expect(jobs('empty quick thirty minutes')).toEqual([{ id: 'npt_quick', qty: 1 }]);
    expect(parse('three surfaces and a fire surface').unmatched).toEqual([]);
  });

  it('every entry is a phrase, so a stray word inside another word is left alone', () => {
    VOICE_MISHEARD.forEach(([re]) => {
      expect(re.source.startsWith('\\b')).toBe(true);
      expect(re.source.endsWith('\\b')).toBe(true);
    });
  });
});

describe('what must NOT fold', () => {
  it('leaves "five" alone even though the engine hears it for "hive"', () => {
    // "five installs" could be five of something. A number is never folded.
    expect(normaliseVoiceText('five installs')).toBe('five installs');
  });

  it('leaves a bare "empty" alone — only "empty quick" is NPT', () => {
    expect(normaliseVoiceText('the tank was empty')).toBe('the tank was empty');
  });

  it('leaves "free" alone for the free gas safety check', () => {
    expect(jobs('a free gas safety check')).toEqual([{ id: 'free_gas_safety', qty: 1 }]);
  });

  it('leaves real job words untouched', () => {
    ['six breakdowns', 'two services', 'a fire service', 'an inhibitor', 'two boiler leads']
      .forEach(say => expect(normaliseVoiceText(say)).toBe(say));
  });
});

describe('choosing between the readings the engine offers', () => {
  it('scores speech by the jobs it names and the words it leaves over', () => {
    expect(voiceVocabularyScore('six breakdowns')).toBeGreaterThan(voiceVocabularyScore('six bank statements'));
    expect(voiceVocabularyScore('two services and a fire')).toBeGreaterThan(voiceVocabularyScore('two surfers and a fire'));
  });

  it('keeps the reading that names the most jobs', () => {
    expect(bestVoiceAlternative(['six bank statements', 'six breakdowns', 'sick breakdowns'])).toBe('six breakdowns');
  });

  it("keeps the engine's first choice on a tie", () => {
    expect(bestVoiceAlternative(['two services', 'two service'])).toBe('two services');
    expect(bestVoiceAlternative(['six breakdowns', 'six repairs'])).toBe('six breakdowns');
  });

  it('copes with an empty list, and with blanks in it', () => {
    expect(bestVoiceAlternative([])).toBe('');
    expect(bestVoiceAlternative(['', 'six breakdowns'])).toBe('six breakdowns');
  });

  it('is a count of jobs, so "six breakdowns" beats "breakdowns" said once', () => {
    expect(bestVoiceAlternative(['a breakdown', 'six breakdowns'])).toBe('six breakdowns');
  });
});
