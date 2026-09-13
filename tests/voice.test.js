import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const data = require('../app/data.cjs');

const { parseVoiceLog, extractDurationMins, extractVoiceDay, voiceBatchCreditHours } = data;

// Wednesday, so "monday" resolves backwards within the same week.
const REF = '2026-07-29';

const idsOf = r => r.items.map(i => i.jobId);
const qtyOf = (r, jobId) => (r.items.find(i => i.jobId === jobId) || {}).qty;

describe('parseVoiceLog — the headline case', () => {
  it('parses a full spoken day into counted job entries', () => {
    const r = parseVoiceLog('I have done six breakdowns today, two boiler leads and three fires', REF);
    expect(idsOf(r)).toEqual(['gas_repair', 'hi_lead', 'asv_fre']);
    expect(qtyOf(r, 'gas_repair')).toBe(6);
    expect(qtyOf(r, 'hi_lead')).toBe(2);
    expect(qtyOf(r, 'asv_fre')).toBe(3);
    expect(r.dayKey).toBe(REF);
    expect(r.unmatched).toEqual([]);
  });

  it('totals the batch credit correctly', () => {
    const r = parseVoiceLog('six breakdowns and two boiler leads', REF);
    // 6 × 56 + 2 × 58 = 452 mins
    expect(voiceBatchCreditHours(r.items)).toBeCloseTo(452 / 60, 5);
  });
});

describe('parseVoiceLog — quantities', () => {
  it('defaults to one when no number is spoken', () => {
    expect(qtyOf(parseVoiceLog('did a gas service', REF), 'asv_chb_cir_wh_swh')).toBe(1);
  });

  it('reads digits as well as number words', () => {
    expect(qtyOf(parseVoiceLog('4 services', REF), 'asv_chb_cir_wh_swh')).toBe(4);
  });

  it('reads compound number words', () => {
    expect(qtyOf(parseVoiceLog('twenty two breakdowns', REF), 'gas_repair')).toBe(22);
  });

  it('understands "a couple of"', () => {
    expect(qtyOf(parseVoiceLog('a couple of quotes', REF), 'standalone_quote')).toBe(2);
  });

  it('merges repeats of the same fixed job', () => {
    const r = parseVoiceLog('two services and then three more services', REF);
    expect(r.items).toHaveLength(1);
    expect(qtyOf(r, 'asv_chb_cir_wh_swh')).toBe(5);
  });
});

// "A service on fire" was counted as a gas service AND a fire: the parser met
// "service", then "fire", and took each as a job. Said in the field as part of
// "six services, two breakdowns, and a service on fire" — which logged seven
// services and a fire.
describe('parseVoiceLog — a job said before its appliance', () => {
  const countsOf = r => Object.fromEntries(r.items.map(i => [i.jobId, i.qty]));

  it('reads the field sentence as six services, two breakdowns and one fire service', () => {
    const r = parseVoiceLog('six services, two breakdowns, and a service on fire', REF);
    expect(countsOf(r)).toEqual({ asv_chb_cir_wh_swh: 6, gas_repair: 2, asv_fre: 1 });
  });

  it('counts "a service on fire" once, as a fire service, not as a guess', () => {
    const r = parseVoiceLog('a service on fire', REF);
    expect(countsOf(r)).toEqual({ asv_fre: 1 });
    expect(r.items[0].assumed).toBe(false);
  });

  it('keeps the count and copes with plurals and "the"/"a"', () => {
    expect(countsOf(parseVoiceLog('two services on the fires', REF))).toEqual({ asv_fre: 2 });
    expect(countsOf(parseVoiceLog('serviced a gas fire', REF))).toEqual({ asv_fre: 1 });
  });

  it('lands each appliance on its own service', () => {
    expect(countsOf(parseVoiceLog('a service on the cooker', REF))).toEqual({ asv_hob_ckr_ovn: 1 });
    expect(countsOf(parseVoiceLog('a service on the back boiler', REF))).toEqual({ asv_bbf_wau_waw_aga: 1 });
    expect(countsOf(parseVoiceLog('two services on multipoints', REF))).toEqual({ asv_mwh_wal: 2 });
    const boiler = parseVoiceLog('serviced the boiler', REF);
    expect(countsOf(boiler)).toEqual({ asv_chb_cir_wh_swh: 1 });
    expect(boiler.items[0].assumed).toBe(false);
  });

  it('counts a repair on an appliance once, as a gas repair', () => {
    // Every contract gas repair is 56 minutes whatever the appliance, so the
    // appliance changes nothing but whether it gets counted twice.
    expect(countsOf(parseVoiceLog('a repair on the fire', REF))).toEqual({ gas_repair: 1 });
    expect(countsOf(parseVoiceLog('two breakdowns on cookers', REF))).toEqual({ gas_repair: 2 });
  });

  // The cases that must NOT merge. An over-eager rule here quietly deletes a
  // job an engineer did, which is worse than the double count it replaces.
  it('leaves "and" between them as two jobs', () => {
    expect(countsOf(parseVoiceLog('six services and a fire', REF)))
      .toEqual({ asv_chb_cir_wh_swh: 6, asv_fre: 1 });
  });

  it('leaves a new number between them as two jobs', () => {
    expect(countsOf(parseVoiceLog('three services two fires', REF)))
      .toEqual({ asv_chb_cir_wh_swh: 3, asv_fre: 2 });
  });

  it('does not mistake a day for an appliance', () => {
    const r = parseVoiceLog('a service on monday', REF);
    expect(countsOf(r)).toEqual({ asv_chb_cir_wh_swh: 1 });
    expect(r.dayKey).toBe('2026-07-27');
  });

  it('still reads the appliance-first wording it always did', () => {
    expect(countsOf(parseVoiceLog('a fire service', REF))).toEqual({ asv_fre: 1 });
    expect(countsOf(parseVoiceLog('one fire repair', REF))).toEqual({ linked_ib: 1 });
  });
});

describe('parseVoiceLog — alias matching', () => {
  it('prefers the longest matching phrase', () => {
    expect(idsOf(parseVoiceLog('one fire repair', REF))).toEqual(['linked_ib']);
    expect(idsOf(parseVoiceLog('one fire', REF))).toEqual(['asv_fre']);
  });

  it('does not let "trace and repair" split into two clauses', () => {
    const r = parseVoiceLog('trace and repair forty five minutes', REF);
    expect(idsOf(r)).toEqual(['trace_repair']);
    expect(r.items[0].value).toBe(45);
  });

  it('handles the spoken "T and R" shorthand', () => {
    expect(idsOf(parseVoiceLog('a t and r for thirty minutes', REF))).toEqual(['trace_repair']);
  });

  it('distinguishes hive install types', () => {
    expect(idsOf(parseVoiceLog('a wireless thermostat', REF))).toEqual(['hvi_wls']);
    expect(idsOf(parseVoiceLog('a wired thermostat', REF))).toEqual(['hvi_wrd']);
    expect(idsOf(parseVoiceLog('two hive trvs', REF))).toEqual(['hvi_trv']);
  });

  it('reports genuinely ambiguous wording as unmatched rather than guessing', () => {
    const r = parseVoiceLog('fitted a thermostat', REF);
    expect(r.items).toEqual([]);
    expect(r.unmatched).toEqual(['fitted a thermostat']);
  });

  it('keeps matched and unmatched clauses separate', () => {
    const r = parseVoiceLog('three breakdowns and some nonsense phrase', REF);
    expect(idsOf(r)).toEqual(['gas_repair']);
    expect(r.unmatched).toEqual(['some nonsense phrase']);
  });
});

describe('parseVoiceLog — absence and NPT', () => {
  it('parses wait work with an hours value', () => {
    const r = parseVoiceLog('two hours wait work', REF);
    expect(idsOf(r)).toEqual(['wait_work']);
    expect(r.items[0].value).toBe(2);       // wait_work is variableType 'hours'
    expect(r.items[0].needsValue).toBe(false);
  });

  it('parses an early finish in minutes', () => {
    const r = parseVoiceLog('finished early by ninety minutes', REF);
    expect(idsOf(r)).toEqual(['early_finish']);
    expect(r.items[0].value).toBe(90);
  });

  it('understands "half an hour"', () => {
    const r = parseVoiceLog('half an hour of npt', REF);
    expect(idsOf(r)).toEqual(['npt_quick']);
    expect(r.items[0].value).toBe(30);
  });

  it('understands "an hour and a half"', () => {
    expect(extractDurationMins('an hour and a half').mins).toBe(90);
  });

  it('flags a variable job with no spoken duration', () => {
    const r = parseVoiceLog('some wait work', REF);
    expect(r.items[0].needsValue).toBe(true);
    expect(r.items[0].value).toBe(null);
  });

  it('never counts NPT or mentor entries as credit', () => {
    const r = parseVoiceLog('forty minutes npt and mentoring all day', REF);
    expect(voiceBatchCreditHours(r.items)).toBe(0);
  });

  it('treats a mentor day as a single flag regardless of spoken count', () => {
    const r = parseVoiceLog('mentoring all day', REF);
    expect(idsOf(r)).toEqual(['mentor_full']);
    expect(r.items[0].qty).toBe(1);
  });
});

describe('parseVoiceLog — backdating', () => {
  it('defaults to the reference day', () => {
    expect(parseVoiceLog('two services', REF).dayKey).toBe(REF);
  });

  it('resolves "yesterday"', () => {
    expect(parseVoiceLog('yesterday I did four services', REF).dayKey).toBe('2026-07-28');
  });

  it('resolves "day before yesterday"', () => {
    expect(parseVoiceLog('day before yesterday two breakdowns', REF).dayKey).toBe('2026-07-27');
  });

  it('resolves a named weekday backwards', () => {
    // REF is a Wednesday; Monday of the same week is the 27th.
    expect(parseVoiceLog('on monday I did three services', REF).dayKey).toBe('2026-07-27');
  });

  it('resolves "last <weekday>" a full week back when it names today', () => {
    expect(parseVoiceLog('last wednesday two breakdowns', REF).dayKey).toBe('2026-07-22');
  });

  it('strips the day phrase so it is not matched as a job', () => {
    const r = parseVoiceLog('yesterday three breakdowns', REF);
    expect(idsOf(r)).toEqual(['gas_repair']);
    expect(qtyOf(r, 'gas_repair')).toBe(3);
  });
});

describe('parseVoiceLog — robustness', () => {
  it('returns an empty result for empty input', () => {
    const r = parseVoiceLog('', REF);
    expect(r.items).toEqual([]);
    expect(r.unmatched).toEqual([]);
  });

  it('tolerates null and undefined', () => {
    expect(parseVoiceLog(null, REF).items).toEqual([]);
    expect(parseVoiceLog(undefined, REF).items).toEqual([]);
  });

  it('is unfazed by punctuation and casing from speech-to-text', () => {
    const r = parseVoiceLog('Six Breakdowns, Two Boiler Leads.', REF);
    expect(qtyOf(r, 'gas_repair')).toBe(6);
    expect(qtyOf(r, 'hi_lead')).toBe(2);
  });

  it('only returns jobs that exist in the catalogue', () => {
    const r = parseVoiceLog('six breakdowns two boiler leads three fires half an hour npt', REF);
    r.items.forEach(it => expect(data.findJob(it.jobId)).toBeTruthy());
  });
});

describe('parseVoiceLog — run-on dictation', () => {
  it('parses a sentence with no punctuation at all', () => {
    const r = parseVoiceLog('six breakdowns two boiler leads three fires', REF);
    expect(qtyOf(r, 'gas_repair')).toBe(6);
    expect(qtyOf(r, 'hi_lead')).toBe(2);
    expect(qtyOf(r, 'asv_fre')).toBe(3);
  });

  it('survives "and then" between clauses', () => {
    const r = parseVoiceLog('three gas services and then two breakdowns', REF);
    expect(qtyOf(r, 'asv_chb_cir_wh_swh')).toBe(3);
    expect(qtyOf(r, 'gas_repair')).toBe(2);
  });

  it('reads the spoken plural of a job name', () => {
    // "gas service" must still beat the bare "services" alias when pluralised.
    expect(idsOf(parseVoiceLog('three gas services', REF))).toEqual(['asv_chb_cir_wh_swh']);
    expect(qtyOf(parseVoiceLog('four first visits', REF), 'fv_chb')).toBe(4);
  });

  it('ignores conversational filler around the job names', () => {
    const r = parseVoiceLog('did three gas services this morning then two breakdowns this afternoon', REF);
    expect(qtyOf(r, 'asv_chb_cir_wh_swh')).toBe(3);
    expect(qtyOf(r, 'gas_repair')).toBe(2);
    expect(r.unmatched).toEqual([]);
  });

  it('does not flag ordinary verbs as unmatched', () => {
    const r = parseVoiceLog('sold an inhibitor and fitted a co alarm', REF);
    expect(idsOf(r)).toEqual(['inhibitor', 'co_alarm_fit']);
    expect(r.unmatched).toEqual([]);
  });

  it('returns nothing at all when no jobs were described', () => {
    const r = parseVoiceLog('i did nothing today', REF);
    expect(r.items).toEqual([]);
    expect(r.unmatched).toEqual([]);
  });

  it('combines backdating with an absence entry in one sentence', () => {
    const r = parseVoiceLog('six breakdowns yesterday and finished early by half an hour', REF);
    expect(r.dayKey).toBe('2026-07-28');
    expect(qtyOf(r, 'gas_repair')).toBe(6);
    expect(r.items.find(i => i.jobId === 'early_finish').value).toBe(30);
  });
});

describe('parseVoiceLog — broad wording is accepted but flagged', () => {
  // "Four repairs" is a real sentence. Refusing it would be worse than taking
  // it, but a repair could be a boiler, a cooker or a fire at different credit.
  it('flags a catch-all match as assumed', () => {
    const r = parseVoiceLog('four repairs', REF);
    expect(r.items[0].jobId).toBe('gas_repair');
    expect(r.items[0].assumed).toBe(true);
  });

  it('does not flag wording that named the appliance', () => {
    expect(parseVoiceLog('three cooker services', REF).items[0].assumed).toBe(false);
    expect(parseVoiceLog('two back boiler services', REF).items[0].assumed).toBe(false);
    expect(parseVoiceLog('two boiler leads', REF).items[0].assumed).toBe(false);
  });

  it('keeps the count when an appliance word sits between number and job', () => {
    // The number no longer has to butt up against the job name.
    expect(qtyOf(parseVoiceLog('four boiler repairs', REF), 'gas_repair')).toBe(4);
    expect(qtyOf(parseVoiceLog('five gas breakdowns', REF), 'gas_repair')).toBe(5);
    expect(qtyOf(parseVoiceLog('three gas services', REF), 'asv_chb_cir_wh_swh')).toBe(3);
  });

  it('keeps the flag when two broad phrases merge', () => {
    const r = parseVoiceLog('two repairs and then three breakdowns', REF);
    expect(r.items).toHaveLength(1);
    expect(qtyOf(r, 'gas_repair')).toBe(5);
    expect(r.items[0].assumed).toBe(true);
  });

  it('carries the phrase through so the sheet can quote it back', () => {
    expect(parseVoiceLog('four repairs', REF).items[0].phrase).toBe('repairs');
  });
});

describe('extractVoiceDay', () => {
  it('reports no phrase when nothing is spoken', () => {
    expect(extractVoiceDay('three breakdowns', REF)).toEqual({ dayKey: REF, phrase: null });
  });
});
