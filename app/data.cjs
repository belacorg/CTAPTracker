// Catalogue mirrors Centrica sheet "ID1923 – Job Codes & Credits".
// `minutes` = the sheet's Credit (mins); credits = minutes / 83.58 to 2dp.
// Tiles are grouped only where the sheet's minutes are identical (e.g. every
// Gas Repair is 56). See ADR-0006: this is policy, expected to drift.
// Lines marked CARRY were not in the supplied screenshots (sheet rows 9–12 and
// 43–47) — values preserved from the prior catalogue, pending verification.
const JOB_TYPES = {
  core: [
    // ── Services (time varies by appliance) ──
    { id: 'asv_chb_cir_wh_swh',  code: 'GS-CHB',          name: 'Gas Service (CHB, CIR, WH, SWH)',      minutes: 40, credits: 0.48, variable: false },
    { id: 'asv_fre',             code: 'GS-FRE',          name: 'Gas Service (Gas Fire)',                minutes: 47, credits: 0.56, variable: false },
    { id: 'asv_hob_ckr_ovn',     code: 'GS-HOB / GS-CKR', name: 'Gas Service (Hob, Cooker)',             minutes: 23, credits: 0.28, variable: false },
    { id: 'asv_bbf_wau_waw_aga', code: 'GS-WAU / GS-BBU', name: 'Gas Service (Warm Air, Back Boiler)',   minutes: 63, credits: 0.75, variable: false },
    { id: 'asv_mwh_wal',         code: 'GS-MWH / GS-WAL', name: 'Gas Service (MWH, WAL)',                minutes: 35, credits: 0.42, variable: false }, // CARRY — not on ID1923
    // ── Repairs (every contract GR-* on the sheet is 56) ──
    { id: 'gas_repair',          code: 'GR-*',            name: 'Gas Repair (any appliance)',            minutes: 56, credits: 0.67, variable: false },
    { id: 'linked_ib',           code: 'GR-FRE (linked)', name: 'Gas Repair – Fire, linked to service',  minutes: 35, credits: 0.42, variable: false },
    // ── One-off / non-contract (CHB) ──
    { id: 'od_chb',  code: 'OD-CHB',  name: 'Gas Repair – Non-Contract (on-demand)', minutes: 1, credits: 0.01, variable: true, variableType: 'minutes', variablePrompt: 'CTAP mins — 20 (job ≤20 min) or 56 (over 20 min)' },
    { id: 'oow_chb', code: 'OOW-CHB', name: 'Gas Repair – Warranty (one-off)',       minutes: 56, credits: 0.67, variable: false },
    { id: 'ods_chb', code: 'ODS-CHB', name: 'Gas Service – One-Off (non-contract)',   minutes: 40, credits: 0.48, variable: false },
    // ── First visit / first fix ──
    { id: 'fv_chb',              code: 'FV-CHB',          name: 'First Visit (CHB)',                     minutes: 48, credits: 0.57, variable: false },
    { id: 'fv_bbf_wau_waw',      code: 'FV-BBU',          name: 'First Visit (Back Boiler)',             minutes: 71, credits: 0.85, variable: false },
    { id: 'ib_ff',               code: 'FF-CHB / FF-BBU', name: 'First Fix (CHB, Back Boiler)',          minutes: 56, credits: 0.67, variable: false },
    { id: 'remedial_safety',     code: 'FV-REM',          name: 'Remedial Safety Works',                 minutes: 30, credits: 0.36, variable: false },
    // ── Long duration ──
    { id: 'ld_completed',        code: 'LD-CHB',          name: 'Long Duration – CHB (completed)',       minutes: 205, credits: 2.45, variable: false },
    { id: 'ld_unv',              code: 'LD-UNV',          name: 'Long Duration – Unvented (completed)',  minutes: 330, credits: 3.95, variable: false },
    // ── Other core (CARRY — not on ID1923) ──
    { id: 'oca',                 code: 'OCA',             name: 'OCA (all appliances)',                  minutes: 56, credits: 0.67, variable: false }, // CARRY — not on ID1923
    { id: 'free_gas_safety',     code: 'FGS',             name: 'Free Gas Safety Check',                 minutes: 30, credits: 0.36, variable: false }, // CARRY — not on ID1923
    { id: 'as_inst',             code: 'LI-INS',          name: 'Landlords Gas Inspection (LGSC)',        minutes: 21, credits: 0.25, variable: false },
    { id: 'trace_repair',        code: 'TR-CHB',          name: 'Trace & Repair (min-for-min)',          minutes: 1, credits: 0.01, variable: true, variableType: 'minutes', variablePrompt: 'Minutes on completion' }
  ],
  hive: [
    { id: 'hvi_hub',     code: 'HVI-HUB',           name: 'Hive OpenTherm Upgrade (prepaid)',        minutes: 40, credits: 0.48, variable: false },
    { id: 'hvi_min',     code: 'HVI-MIN',           name: 'Hive Install – Mini Thermostat',          minutes: 90, credits: 1.08, variable: false },
    { id: 'hvi_wls',     code: 'HVI-WLS',           name: 'Hive Install – Wireless Thermostat',      minutes: 90, credits: 1.08, variable: false },
    { id: 'hvi_wrd',     code: 'HVI-WRD',           name: 'Hive Install – Wired Thermostat',         minutes: 60, credits: 0.72, variable: false },
    { id: 'hvi_imz',     code: 'HVI-IMZ',           name: 'Hive Additional Zone (per extra zone)',   minutes: 30, credits: 0.36, variable: false },
    { id: 'hvi_trv',     code: 'HVI-TRV',           name: 'Hive Install – TRV (1 action / 2 TRVs)',  minutes: 30, credits: 0.36, variable: false },
    { id: 'hvi_iio',     code: 'HVI-IIO',           name: 'Hive Faulty-Controls Install (van stock)', minutes: 34, credits: 0.41, variable: false },
    { id: 'hvu_the',     code: 'HVU-THE',           name: 'Hive Uninstall – Thermostat',             minutes: 90, credits: 1.08, variable: false },
    { id: 'hive_repair', code: 'HVR-THE / HVR-TRV', name: 'Hive Repair – Thermostat / TRV',          minutes: 56, credits: 0.67, variable: false },
    { id: 'recall_hive', code: 'RCHV-THR / RCHV-TRV', name: 'Recall Hive – Thermostat / TRV',        minutes: 56, credits: 0.67, variable: false },
    { id: 'inshv_min',   code: 'INSHV-MIN',         name: 'Install Hive Mini (sold via Services)',   minutes: 90, credits: 1.08, variable: false },
    { id: 'inshv_thr',   code: 'INSHV-THR',         name: 'Install Hive Thermostat (sold via Services)', minutes: 90, credits: 1.08, variable: false },
    { id: 'inshv_trv',   code: 'INSHV-TRV',         name: 'Install Hive TRVs (sold via Services)',   minutes: 1, credits: 0.01, variable: true, variableType: 'minutes', variablePrompt: 'Chargeable minutes' }
  ],
  sales: [
    // ── Quotes / HIM / in-day actions (verified from sheet) ──
    { id: 'standalone_quote', code: 'GQ-INS',  name: 'Provide Quote – Gas (standalone)',       minutes: 31, credits: 0.37, variable: false },
    { id: 'him_upgrade',      code: 'HIM',     name: 'HIM Upgrade (enter quoted minutes)',     minutes: 1,  credits: 0.01, variable: true, variableType: 'minutes', variablePrompt: 'Minutes quoted in Quote Tool' },
    { id: 'add_inhibitor',    code: 'ODC-SYS', name: 'Add Inhibitor (in-day action)',          minutes: 20, credits: 0.24, variable: false },
    { id: 'cod_gas',          code: 'IA-COD',  name: 'COD / CO Detector (in-day action)',      minutes: 5,  credits: 0.06, variable: false },
    // ── SGO / sale credits — CARRY rows 43–47, preserved pending verification ──
    { id: 'hi_lead',          name: 'HI Lead (Boiler Lead)',        minutes: 58,  credits: 0.69, variable: false },
    { id: 'inhibitor',        name: 'Inhibitor (Fit + SGO)',         minutes: 51,  credits: 0.61, variable: false },
    { id: 'hive_sale_sgo',    name: 'Hive Sale (SGO Credit)',        minutes: 69,  credits: 0.82, variable: false },
    { id: 'hive_sale_fit',    name: 'Hive Fit (Sale Job)',           minutes: 125, credits: 1.50, variable: false },
    { id: 'co_alarm_sgo',     name: 'CO Alarm – Sell (SGO Credit)',  minutes: 10,  credits: 0.12, variable: false },
    { id: 'co_alarm_fit',     name: 'CO Alarm – Fit Only',           minutes: 7,   credits: 0.08, variable: false }
  ],
  absent: [
    { id: 'wait_work', name: 'Wait Work', minutes: 60, credits: 0.72, variable: true, variableType: 'hours', variablePrompt: 'Time in hours' },
    { id: 'early_finish', name: 'Early Finish', minutes: 0, credits: 0, variable: true, variableType: 'minutes', variablePrompt: 'How many minutes did you finish early?', isNpt: true, confirmLabel: 'Log Early Finish', skipNameField: true },
    { id: 'mentor_full', name: 'Mentor Support (Full Day)', minutes: 0, credits: 0, variable: false, isMentorFull: true },
    { id: 'mentor_partial', name: 'Mentor Support (20% Reduction)', minutes: 0, credits: 0, variable: false, isMentorPartial: true },
    { id: 'ev_charge', name: 'EV Charging', minutes: 30, credits: 0.36, variable: false },
    { id: 'buybox_collection', name: 'Bybox Part Collection', minutes: 10, credits: 0.12, variable: false },
    { id: 'merchant_parts', name: 'Merchant Parts Collection', minutes: 10, credits: 0.12, variable: false },
    { id: 'npt_quick', name: 'Non-Productive Time', minutes: 0, credits: 0, variable: true, variableType: 'minutes', variablePrompt: 'Time in minutes', isNpt: true }
  ]
};

// credit minutes → credit hours
function minutesToCreditHours(mins) {
  return mins / 60;
}

// For variable jobs: credits = minutes / 83.58
function calcVariableCredits(mins) {
  return +(mins / 83.58).toFixed(4);
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return localDateStr(monday);
}

function getTodayKey() {
  return localDateStr(new Date());
}

function weekDays(weekKey) {
  const days = [];
  const start = new Date(weekKey + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(localDateStr(d));
  }
  return days;
}

function shiftHours(shift) {
  if (!shift || !shift.start || !shift.end) return null;
  const [sh, sm] = shift.start.split(':').map(Number);
  const [eh, em] = shift.end.split(':').map(Number);
  const gross = eh * 60 + em - sh * 60 - sm;
  const lunch = (shift.lunch !== undefined && shift.lunch !== '') ? Number(shift.lunch) : 0;
  const net = gross - lunch;
  return net > 0 ? net / 60 : null;
}

function dayIsLeave(week, dayKey) {
  var s = (week.shifts || {})[dayKey];
  return !!(s && s.leave);
}

function weekLeaveHours(state, week) {
  var total = 0;
  var shifts = week.shifts || {};
  Object.keys(shifts).forEach(function(dk) {
    var s = shifts[dk];
    if (s && s.leave) {
      var h = shiftHours(s);
      total += h !== null ? h : (state.baseHours / 5);
    }
  });
  return total;
}

function getDailyTarget(state, week, dayKey) {
  if (dayIsLeave(week, dayKey)) return 0;
  const mentor = (week.mentorDays || {})[dayKey];
  if (mentor === 'full') return 0;
  const h = shiftHours((week.shifts || {})[dayKey]);
  const base = h !== null ? h : state.baseHours / 5;
  if (mentor === 'partial') return base * 0.8;
  return base;
}

function weekMentorTargetReduction(state, week) {
  var reduction = 0;
  var mentorDays = week.mentorDays || {};
  Object.keys(mentorDays).forEach(function(dk) {
    var type = mentorDays[dk];
    var h = shiftHours((week.shifts || {})[dk]);
    var dayH = h !== null ? h : state.baseHours / 5;
    if (type === 'full') reduction += dayH;
    else if (type === 'partial') reduction += dayH * 0.2;
  });
  return reduction;
}

function cumulativeBalance(state) {
  var currentWk = getWeekKey(new Date());
  var total = state.startingBalance || 0;
  for (var wk in state.weeks) {
    if (wk < currentWk && !state.weeks[wk].excludeFromCtap) {
      var week = state.weeks[wk];
      total += weekCreditHours(week) - adjustedTargetHours(state, week);
    }
  }
  return total;
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem('jct_state') || 'null') || defaultState();
  } catch {
    return defaultState();
  }
}

function defaultState() {
  return { baseHours: 40, weeks: {}, checkins: {}, coachGoals: {} };
}

function saveState(state) {
  localStorage.setItem('jct_state', JSON.stringify(state));
}

function getOrCreateWeek(state, weekKey) {
  if (!state.weeks[weekKey]) {
    state.weeks[weekKey] = { deductionMins: 0, days: {} };
  }
  return state.weeks[weekKey];
}

function getOrCreateDay(week, dayKey) {
  if (!week.days[dayKey]) week.days[dayKey] = [];
  return week.days[dayKey];
}

function weekTotalCreditMins(week) {
  if (!week.days) return 0;
  return Object.values(week.days).reduce((s, arr) => s + arr.reduce((a, j) => a + j.creditMins, 0), 0);
}

function weekCreditHours(week) {
  return weekTotalCreditMins(week) / 60;
}

// Rostered hours = contracted hours minus leave and mentor adjustments
function rosteredHours(state, week) {
  return state.baseHours - weekLeaveHours(state, week) - weekMentorTargetReduction(state, week);
}

// Adjusted target = rostered × configured % (default 80%) minus NPT deductions
function adjustedTargetHours(state, week) {
  const rostered = rosteredHours(state, week);
  const pct = typeof state.weeklyTargetPct === 'number' ? state.weeklyTargetPct : 0.8;
  const npt = (week.deductionMins || 0) / 60;
  return Math.max(0, rostered * pct - npt);
}

// Rolling average of last 4–6 completed non-empty weeks before weekKey
// Returns { avg, n } or null when fewer than 4 qualifying weeks exist
function rollingAvgInfo(state, weekKey) {
  const cutoff = weekKey || getWeekKey(new Date());
  const qualifying = Object.keys(state.weeks)
    .filter(wk => wk < cutoff && weekCreditHours(state.weeks[wk]) > 0)
    .sort()
    .slice(-6);
  if (qualifying.length < 4) return null;
  const avg = qualifying.reduce((s, wk) => s + weekCreditHours(state.weeks[wk]), 0) / qualifying.length;
  return { avg, n: qualifying.length };
}

// Effective target for dashboard display:
//   • rolling average (scaled by roster ratio) when 4+ completed weeks exist
//   • otherwise the configured % formula
// Returns { hours, isRolling, n, displayTarget }
//   hours        = effective target after NPT deduction (used for progress %)
//   displayTarget = pre-NPT figure (shown in the Rostered | Target line)
function effectiveTargetHours(state, week, weekKey) {
  const rostered = rosteredHours(state, week);
  const npt = (week.deductionMins || 0) / 60;
  const rolling = rollingAvgInfo(state, weekKey);
  if (rolling && state.baseHours > 0) {
    const scaledAvg = rolling.avg * (rostered / state.baseHours);
    return { hours: Math.max(0, scaledAvg - npt), isRolling: true, n: rolling.n, displayTarget: Math.max(0, scaledAvg) };
  }
  const pct = typeof state.weeklyTargetPct === 'number' ? state.weeklyTargetPct : 0.8;
  const displayTarget = rostered * pct;
  return { hours: Math.max(0, displayTarget - npt), isRolling: false, n: 0, displayTarget };
}

function bonusAchieved(state, week) {
  return weekCreditHours(week) >= adjustedTargetHours(state, week);
}

function formatHM(totalMins) {
  const h = Math.floor(Math.abs(totalMins) / 60);
  const m = Math.abs(totalMins) % 60;
  const sign = totalMins < 0 ? '-' : '';
  return `${sign}${h}h ${m.toString().padStart(2,'0')}m`;
}

function formatCredits(c) {
  return c.toFixed(2);
}

function weekLabel(weekKey) {
  const d = new Date(weekKey + 'T00:00:00');
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = dt => dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(d)} – ${fmt(end)}`;
}

// ── Job lookup ─────────────────────────────────────────────────────────────
function findJob(id) {
  for (const cat of Object.values(JOB_TYPES)) {
    const j = cat.find(j => j.id === id);
    if (j) return j;
  }
  return null;
}

// ── Performance Factor ─────────────────────────────────────────────────────
// PF formula: raw productive output × 8.5%, capped at PF_DAY_CAP minutes/day.
const PF_DAY_CAP = 40;

function estimatedDailyPFMins(rawOutputHours) {
  return Math.min(PF_DAY_CAP, Math.round(Math.max(0, rawOutputHours) * 0.085 * 60));
}

function dailyRawOutputHours(state, week, dayKey) {
  const sh = shiftHours((week.shifts || {})[dayKey]);
  const shiftH = sh !== null ? sh : state.baseHours / 5;
  const dedMins = (week.deductionLog || [])
    .filter(d => d.date === dayKey)
    .reduce((s, d) => s + d.mins, 0);
  return Math.max(0, shiftH - dedMins / 60);
}

function weekPFMins(state, week, weekKey) {
  const days = weekDays(weekKey);
  return days.reduce(function(sum, dk) {
    if (dayIsLeave(week, dk)) return sum;
    return sum + estimatedDailyPFMins(dailyRawOutputHours(state, week, dk));
  }, 0);
}

// ── Pace projection ────────────────────────────────────────────────────────
// Project end-of-week credit hours from current pace.
// Returns null when not enough days to project from.
function paceProjection(weekEarned, workedDaysSoFar, remainingDays, weekTarget) {
  if (workedDaysSoFar <= 0 || remainingDays <= 0) return null;
  const projectedHours = weekEarned + (weekEarned / workedDaysSoFar) * remainingDays;
  return { projectedHours: projectedHours, gapVsTarget: projectedHours - weekTarget };
}

// ── Log Job day strip ──────────────────────────────────────────────────────
//
// Replaces a ‹ Today › stepper. Stepping told you nothing about where you were
// going: every day looked identical until you landed on it, so finding the day
// you forgot to log meant walking backwards through them one at a time.
//
// The strip shows the last `n` days at once with what's on each, so a missed
// day is visible rather than something you go hunting for — and reaching it is
// one tap instead of several.
//
// Rolling from today rather than snapped to the current week, so yesterday is
// always on the strip; on a Monday a Mon–Sun week view would hide it.
// Every day on the strip is selectable. The `n`-day window is itself the
// bound, and it matches what voice backdating already allows ("last Tuesday")
// — the tile flow and the voice flow are the same model reached two ways, so
// they must not disagree about which days exist. See ADR-0007.
function getLogDayStrip(state, n, todayKey) {
  const today = todayKey || getTodayKey();
  const days = [];
  const end = new Date(today + 'T00:00:00');
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = localDateStr(d);
    const week = (state.weeks || {})[getWeekKey(d)] || {};
    const entries = (week.days || {})[key] || [];
    const hours = entries.reduce(function(s, j) { return s + (j.creditMins || 0); }, 0) / 60;
    days.push({
      key: key,
      isToday: key === today,
      // Single letter, so seven fit across a phone without wrapping.
      initial: d.toLocaleDateString('en-GB', { weekday: 'short' }).charAt(0),
      label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      count: entries.length,
      hours: hours,
      // Not rostered is a different thing from logged nothing: one is a gap
      // worth chasing, the other is a day off. They must not look alike.
      rostered: !dayIsLeave(week, key)
    });
  }
  return days;
}

// ── Most-used jobs ─────────────────────────────────────────────────────────
//
// 51 job types is a long scroll to hit the same handful of tiles every day.
// This ranks by how often the engineer has actually logged each one, over a
// recent window so it tracks the work they're doing now rather than the work
// they did last winter.
//
// A new engineer has no history, so the list seeds from the jobs that make up
// most domestic gas days — repairs and services on boilers, services on fires,
// landlord certificates, boiler leads. The seed only ever fills the empty
// slots: one logged job of their own outranks it.
const TOP_JOBS_WINDOW_WEEKS = 8;
const TOP_JOBS_SEED = ['gas_repair', 'asv_chb_cir_wh_swh', 'asv_fre', 'as_inst', 'hi_lead', 'add_inhibitor'];

function getTopJobs(state, n) {
  const weekKeys = Object.keys(state.weeks || {}).sort().slice(-TOP_JOBS_WINDOW_WEEKS);
  const counts = new Map();
  const lastSeen = new Map();
  weekKeys.forEach(function(wk) {
    Object.values((state.weeks[wk] || {}).days || {}).forEach(function(dayJobs) {
      dayJobs.forEach(function(j) {
        if (!j.id) return;
        const job = findJob(j.id);
        if (!job || job.isNpt || job.isMentorFull || job.isMentorPartial) return;
        counts.set(j.id, (counts.get(j.id) || 0) + 1);
        if (j.ts && j.ts > (lastSeen.get(j.id) || 0)) lastSeen.set(j.id, j.ts);
      });
    });
  });

  // Ties break on recency, so the row stays stable day to day rather than
  // reshuffling under the thumb every time something is logged.
  const ranked = [...counts.keys()].sort(function(a, b) {
    return (counts.get(b) - counts.get(a)) || ((lastSeen.get(b) || 0) - (lastSeen.get(a) || 0));
  });

  const result = [];
  const taken = new Set();
  ranked.concat(TOP_JOBS_SEED).forEach(function(id) {
    if (result.length >= n || taken.has(id)) return;
    const job = findJob(id);
    if (!job) return;
    taken.add(id);
    result.push(job);
  });
  return result;
}

// ── Elective jobs — the only ones Coach may hold up as an opportunity ───────
//
// The job you get is dispatch's call, not the engineer's. A service, a repair,
// a first visit, a Long Duration — none of those are things you can decide to
// do more of today. So Coach must never name one as a target: "Best
// opportunity: Long Duration – Unvented, 5.50h" reads as an instruction to
// find a 330-minute job, and the only way to find one that isn't there is to
// raise it. That's a mis-raise, and it lands on the engineer, not the app.
//
// SGO is the exception, and it's the whole point of SGO: on a visit you are
// already on, you choose whether to offer the inhibitor, the Hive, the CO
// alarm, the quote. That is genuine discretion, and the scheme is designed to
// reward it. So the elective set is the sales section and nothing else.
//
// Operational credits (Wait Work, EV charging, Bybox) are deliberately NOT
// elective: they're circumstances you record, and nudging someone toward
// logging more wait time is the same failure in a different coat.
// See ADR-0009.
function getElectiveJobs() {
  return JOB_TYPES.sales.filter(function(j) {
    return !j.variable && !j.isNpt && j.minutes > 0;
  });
}

// The elective job whose credit best closes `gapHours`, or null when no single
// elective job is a sensible answer to a gap that size.
function getElectiveJobForGap(gapHours) {
  const elective = getElectiveJobs();
  if (!elective.length || !(gapHours > 0)) return null;
  const best = elective.reduce(function(b, j) {
    return Math.abs(j.minutes / 60 - gapHours) < Math.abs(b.minutes / 60 - gapHours) ? j : b;
  }, elective[0]);
  // Don't offer a 0.12h CO alarm against a 3h gap and call it a plan.
  return Math.abs(best.minutes / 60 - gapHours) <= 0.6 ? best : null;
}

// ── Historically strong weekday (Mon–Fri name, or null) ────────────────────
function getHistoricallyStrongDay(state) {
  const todayWk = getWeekKey(new Date());
  const pastWks = Object.keys(state.weeks).filter(function(wk) { return wk < todayWk; }).sort().slice(-8);
  if (pastWks.length < 3) return null;
  const totals = [0,0,0,0,0], counts = [0,0,0,0,0];
  pastWks.forEach(function(wkKey) {
    const wk = state.weeks[wkKey];
    weekDays(wkKey).slice(0,5).forEach(function(dk, i) {
      const jobs = (wk.days || {})[dk] || [];
      if (jobs.length > 0 && !dayIsLeave(wk, dk)) {
        totals[i] += jobs.reduce(function(s,j) { return s + j.creditMins; }, 0) / 60;
        counts[i]++;
      }
    });
  });
  const avgs = totals.map(function(t, i) { return counts[i] >= 3 ? t / counts[i] : 0; });
  const maxAvg = Math.max.apply(null, avgs);
  if (maxAvg === 0) return null;
  const totalH = totals.reduce(function(s,t) { return s+t; }, 0);
  const totalC = counts.reduce(function(s,c) { return s+c; }, 0);
  const overallAvg = totalC > 0 ? totalH / totalC : 0;
  if (maxAvg < overallAvg * 1.15) return null;
  return ['Monday','Tuesday','Wednesday','Thursday','Friday'][avgs.indexOf(maxAvg)];
}

// ── Coach mode toggle (per-engineer display flag) ──────────────────────────
function isCoachModeOn() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('jcpd_coach_mode') !== 'false';
}

// ── Coach Insights ─────────────────────────────────────────────────────────
// Returns Insight[] sorted ascending by priority (1 = highest).
// Insight = { kind, priority, severity, text }
//   kind     — identifier for grouping / dedupe / styling hooks
//   priority — 1 (highest) .. 5 (lowest); display layer typically takes top N
//   severity — 'red' | 'amber' | 'green' (display colour)
//   text     — display string
// ctx contains precomputed display values from the caller, so insight predicates
// don't have to re-derive them:
//   { dailyTarget, todayHours, weekTarget, weekEarned, todayPFMins }
function getCoachInsights(state, weekKey, ctx) {
  ctx = ctx || {};
  const dailyTarget = ctx.dailyTarget || 0;
  const todayHours = ctx.todayHours || 0;
  const weekTarget = ctx.weekTarget || 0;
  const weekEarned = ctx.weekEarned || 0;
  const todayPFMins = ctx.todayPFMins;

  const todayKey = getTodayKey();
  const todayWk  = getWeekKey(new Date());
  const week     = state.weeks[weekKey] || { days: {}, shifts: {} };
  const isCurrentWeek = weekKey === todayWk;

  const pastWks = Object.keys(state.weeks).filter(function(w) { return w < todayWk; }).sort();
  const nPast   = pastWks.length;

  const hiveIds = new Set(JOB_TYPES.hive.map(function(j) { return j.id; }));

  let weekHiveCount = 0, weekLeadCount = 0;
  Object.values(week.days || {}).forEach(function(dayJobs) {
    dayJobs.forEach(function(j) {
      if (hiveIds.has(j.id))  weekHiveCount++;
      if (j.id === 'hi_lead') weekLeadCount++;
    });
  });

  const todayNPTMins = isCurrentWeek
    ? (week.deductionLog || []).filter(function(d) { return d.date === todayKey; }).reduce(function(s, d) { return s + d.mins; }, 0)
    : 0;

  const insights = [];

  // P1: Daily status (current week only)
  if (isCurrentWeek && dailyTarget > 0) {
    const gap = dailyTarget - todayHours;
    const breakdownHrs = 56 / 60;
    if (todayHours >= dailyTarget) {
      const over = todayHours - dailyTarget;
      insights.push({ kind: 'daily_target_status', priority: 1, severity: 'green',
        text: `Daily target hit${over >= 0.01 ? ` — ${over.toFixed(2)}h over` : ''}` });
    } else if (gap <= breakdownHrs + 0.05) {
      insights.push({ kind: 'daily_target_status', priority: 1, severity: 'amber',
        text: `${gap.toFixed(2)}h to go today — one more job puts you there` });
    } else {
      const n = Math.ceil(gap / breakdownHrs);
      insights.push({ kind: 'daily_target_status', priority: 1, severity: 'amber',
        text: `${gap.toFixed(2)}h still needed today — around ${n} more job${n === 1 ? '' : 's'} at breakdown rate` });
    }

    if (todayNPTMins > 0) {
      const nptH = todayNPTMins / 60;
      const nptPct = Math.round((nptH / dailyTarget) * 100);
      insights.push({ kind: 'daily_npt_cost', priority: 1, severity: 'amber',
        text: `NPT has cost you ${nptH.toFixed(2)}h today — that's ${nptPct}% of your daily target` });
    }
  }

  // P2: Current-week actionable
  if (isCurrentWeek) {
    const bal = cumulativeBalance(state);
    if (bal < -0.1) {
      const surplus = weekEarned - weekTarget;
      if (surplus > 0.1) {
        const wks = Math.ceil(-bal / surplus);
        insights.push({ kind: 'ctap_deficit', priority: 2, severity: 'red',
          text: `CTAP is ${Math.abs(bal).toFixed(2)}h in deficit — at this week's surplus you'd clear it in ~${wks} week${wks === 1 ? '' : 's'}` });
      } else {
        insights.push({ kind: 'ctap_deficit', priority: 2, severity: 'red',
          text: `CTAP is ${Math.abs(bal).toFixed(2)}h in deficit — you'll need a weekly surplus above target to start recovering` });
      }
    }

    if (nPast >= 3) {
      const avgHive = pastWks.reduce(function(s, wk) {
        let c = 0;
        Object.values(state.weeks[wk].days || {}).forEach(function(jobs) {
          jobs.forEach(function(j) { if (hiveIds.has(j.id)) c++; });
        });
        return s + c;
      }, 0) / nPast;
      if (avgHive >= 1 && weekHiveCount === 0) {
        insights.push({ kind: 'hive_pattern', priority: 2, severity: 'amber',
          text: `You average ${avgHive.toFixed(1)} Hive install${avgHive >= 2 ? 's' : ''} per week but haven't logged any yet this week` });
      } else if (weekHiveCount > 0) {
        insights.push({ kind: 'hive_pattern', priority: 3, severity: 'green',
          text: `${weekHiveCount} Hive install${weekHiveCount === 1 ? '' : 's'} logged this week` });
      }
    } else if (weekHiveCount === 0) {
      insights.push({ kind: 'hive_pattern', priority: 3, severity: 'amber',
        text: 'No Hive installs logged this week — each adds up to 1.08h credit' });
    }

    if (nPast >= 3) {
      const avgLead = pastWks.reduce(function(s, wk) {
        let c = 0;
        Object.values(state.weeks[wk].days || {}).forEach(function(jobs) {
          jobs.forEach(function(j) { if (j.id === 'hi_lead') c++; });
        });
        return s + c;
      }, 0) / nPast;
      if (avgLead >= 1 && weekLeadCount === 0) {
        insights.push({ kind: 'boiler_lead_pattern', priority: 2, severity: 'amber',
          text: `You average ${avgLead.toFixed(1)} boiler lead${avgLead >= 2 ? 's' : ''} per week — none logged yet this week` });
      } else if (weekLeadCount > 0) {
        insights.push({ kind: 'boiler_lead_pattern', priority: 3, severity: 'green',
          text: `${weekLeadCount} boiler lead${weekLeadCount === 1 ? '' : 's'} banked this week — keep looking on visits` });
      }
    } else if (weekLeadCount === 0) {
      insights.push({ kind: 'boiler_lead_pattern', priority: 3, severity: 'amber',
        text: 'No boiler leads this week — keep an eye out for HI Lead opportunities on your visits' });
    } else {
      insights.push({ kind: 'boiler_lead_pattern', priority: 3, severity: 'green',
        text: `${weekLeadCount} boiler lead${weekLeadCount === 1 ? '' : 's'} banked this week` });
    }

    // End-of-week pace projection
    const wkDaysMF = weekDays(todayWk).slice(0, 5);
    const workedN = wkDaysMF.filter(function(dk) {
      return dk <= todayKey && !dayIsLeave(week, dk) && ((week.days || {})[dk] || []).length > 0;
    }).length;
    const remainN = wkDaysMF.filter(function(dk) {
      return dk > todayKey && !dayIsLeave(week, dk);
    }).length;
    if (workedN >= 2 && remainN > 0 && weekTarget > 0) {
      const proj = paceProjection(weekEarned, workedN, remainN, weekTarget);
      if (proj) {
        insights.push({ kind: 'week_projection', priority: 2,
          severity: proj.gapVsTarget >= 0 ? 'green' : 'amber',
          text: proj.gapVsTarget >= 0
            ? `On current pace you're heading for ~${proj.projectedHours.toFixed(2)}h — ${proj.gapVsTarget.toFixed(2)}h above target`
            : `On current pace you'll end up around ${proj.projectedHours.toFixed(2)}h — ${Math.abs(proj.gapVsTarget).toFixed(2)}h short of target` });
      }
    }

    // Consecutive days hitting daily target this week
    let streak = 0;
    for (const dk of wkDaysMF) {
      if (dk > todayKey) break;
      if (dayIsLeave(week, dk)) continue;
      const dt = getDailyTarget(state, week, dk);
      if (dt <= 0) continue;
      const dayJobs = (week.days || {})[dk] || [];
      if (dk === todayKey && dayJobs.length === 0) continue;
      const dh = dayJobs.reduce(function(s, j) { return s + j.creditMins; }, 0) / 60;
      if (dh >= dt) streak++; else streak = 0;
    }
    if (streak >= 2) {
      insights.push({ kind: 'daily_streak', priority: 2, severity: 'green',
        text: `${streak} days in a row hitting daily target this week` });
    }
  }

  // P3: Pattern insights (3+ completed weeks)
  if (nPast >= 3) {
    const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const dayAvgs = [0, 1, 2, 3, 4].map(function(i) {
      let total = 0, count = 0;
      pastWks.forEach(function(wk) {
        const dk = weekDays(wk)[i];
        const w  = state.weeks[wk];
        if (dayIsLeave(w, dk)) return;
        const jobs = (w.days || {})[dk] || [];
        if (jobs.length === 0) return;
        total += jobs.reduce(function(s, j) { return s + j.creditMins; }, 0) / 60;
        count++;
      });
      return count >= 2 ? total / count : null;
    });
    const bestIdx = dayAvgs.reduce(function(b, a, i) {
      return a !== null && (b === -1 || a > dayAvgs[b]) ? i : b;
    }, -1);
    if (bestIdx >= 0) {
      const todayDow = isCurrentWeek ? (new Date().getDay() + 6) % 7 : -1;
      if (todayDow === bestIdx) {
        insights.push({ kind: 'strongest_weekday', priority: 3, severity: 'green',
          text: `${DAY_NAMES[bestIdx]} is your strongest day on average — you typically log ${dayAvgs[bestIdx].toFixed(2)}h. Make it count.` });
      } else {
        insights.push({ kind: 'strongest_weekday', priority: 4, severity: 'green',
          text: `Your strongest day is usually ${DAY_NAMES[bestIdx]} — you average ${dayAvgs[bestIdx].toFixed(2)}h on that day` });
      }
    }

    if (isCurrentWeek) {
      const weekNPTH = (week.deductionLog || []).reduce(function(s, d) { return s + d.mins; }, 0) / 60;
      const avgNPTH  = pastWks.reduce(function(s, wk) {
        return s + (state.weeks[wk].deductionLog || []).reduce(function(ds, d) { return ds + d.mins; }, 0);
      }, 0) / nPast / 60;
      if (avgNPTH > 0.1) {
        if (weekNPTH > avgNPTH * 1.3) {
          insights.push({ kind: 'npt_vs_average', priority: 3, severity: 'red',
            text: `NPT this week (${weekNPTH.toFixed(1)}h) is above your recent average of ${avgNPTH.toFixed(1)}h — watch the deductions` });
        } else if (weekNPTH < avgNPTH * 0.5) {
          insights.push({ kind: 'npt_vs_average', priority: 4, severity: 'green',
            text: `NPT this week (${weekNPTH.toFixed(1)}h) is well below your recent average of ${avgNPTH.toFixed(1)}h — clean week` });
        }
      }
    }

    const rateWks = pastWks.slice(-10);
    const hits = rateWks.filter(function(wk) { return bonusAchieved(state, state.weeks[wk]); }).length;
    if (rateWks.length >= 3) {
      const rate = hits / rateWks.length;
      if (rate >= 0.8) {
        insights.push({ kind: 'bonus_hit_rate', priority: 4, severity: 'green',
          text: `Hit target in ${hits} of the last ${rateWks.length} weeks — strong consistency` });
      } else if (rate < 0.5) {
        insights.push({ kind: 'bonus_hit_rate', priority: 3, severity: 'red',
          text: `Hit target in only ${hits} of the last ${rateWks.length} weeks — worth looking at what's pulling the average down` });
      } else {
        insights.push({ kind: 'bonus_hit_rate', priority: 4, severity: 'amber',
          text: `Hit target in ${hits} of the last ${rateWks.length} weeks` });
      }
    }
  }

  // P4: Long-term trends (4+ completed weeks)
  if (nPast >= 4) {
    const last6 = pastWks.slice(-6).filter(function(wk) { return !state.weeks[wk].excludeFromCtap; });
    if (last6.length >= 4) {
      const change = last6.reduce(function(s, wk) {
        return s + weekCreditHours(state.weeks[wk]) - adjustedTargetHours(state, state.weeks[wk]);
      }, 0);
      if (Math.abs(change) >= 0.2) {
        insights.push({ kind: 'ctap_trajectory', priority: 4, severity: change >= 0 ? 'green' : 'red',
          text: `CTAP has ${change >= 0 ? 'improved by +' : 'dropped by '}${Math.abs(change).toFixed(2)}h over the last ${last6.length} weeks` });
      }
    }

    if (isCurrentWeek) {
      const last8 = pastWks.slice(-8);
      const avg8  = last8.reduce(function(s, wk) { return s + weekCreditHours(state.weeks[wk]); }, 0) / last8.length;
      const wkDaysMF = weekDays(todayWk).slice(0, 5);
      const workedN = wkDaysMF.filter(function(dk) {
        return dk <= todayKey && !dayIsLeave(week, dk) && ((week.days || {})[dk] || []).length > 0;
      }).length;
      if (workedN >= 1) {
        const projFull = (weekEarned / workedN) * 5;
        const diff = projFull - avg8;
        if (Math.abs(diff) >= 0.3) {
          insights.push({ kind: 'tracking_vs_average', priority: 4, severity: diff >= 0 ? 'green' : 'amber',
            text: `Tracking ${Math.abs(diff).toFixed(2)}h ${diff >= 0 ? 'above' : 'below'} your ${last8.length}-week average of ${avg8.toFixed(2)}h` });
        }
      }
    }

    const last4 = pastWks.slice(-4);
    const avg4earned = last4.reduce(function(s, wk) { return s + weekCreditHours(state.weeks[wk]); }, 0) / 4;
    const avg4target = last4.reduce(function(s, wk) { return s + adjustedTargetHours(state, state.weeks[wk]); }, 0) / 4;
    const avgGap = avg4earned - avg4target;
    if (avgGap >= -0.6 && avgGap < -0.05) {
      insights.push({ kind: 'consistency_4_week', priority: 4, severity: 'amber',
        text: `Your last 4 weeks have averaged ${avg4earned.toFixed(2)}h — just ${Math.abs(avgGap).toFixed(2)}h below target each time` });
    } else if (avgGap >= 0.5) {
      insights.push({ kind: 'consistency_4_week', priority: 4, severity: 'green',
        text: `Your last 4 weeks have averaged ${avg4earned.toFixed(2)}h — consistently above target` });
    }
  }

  // P5: Performance Factor (lowest priority, informational)
  if (isCurrentWeek && todayPFMins != null) {
    insights.push({ kind: 'pf', priority: 5, severity: 'amber',
      text: `Estimated Performance Factor today: ~${todayPFMins} min` });
  }

  insights.sort(function(a, b) { return a.priority - b.priority; });
  return insights;
}

// ── Week Summary ───────────────────────────────────────────────────────────
// Bundled retrospective for a single week — values + structured "standout"
// chosen by salience rules. Caller composes display strings.
//   { earned, target, bonus, gap, pct,
//     bestDay: { name, hours } | null,
//     categoryCounts: { core, hive, sales, absence },
//     ctapImpact: number | null,        // null when excludeFromCtap
//     totalJobs,
//     streak: { count, kind: 'hit'|'miss' },
//     standout: { kind: 'highest_job'|'busiest_day'|'total_jobs', ...details } | null }
function weekSummary(state, weekKey) {
  const week = state.weeks[weekKey];
  if (!week) return null;

  const earned = weekCreditHours(week);
  const target = adjustedTargetHours(state, week);
  const bonus  = bonusAchieved(state, week);
  const gap    = earned - target;
  const pct    = target > 0 ? Math.min((earned / target) * 100, 100) : 0;

  const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = weekDays(weekKey);

  let bestDayHours = 0, bestDayName = null;
  days.forEach(function(dk, i) {
    const jobs = (week.days || {})[dk] || [];
    const dh = jobs.reduce(function(s, j) { return s + j.creditMins; }, 0) / 60;
    if (dh > bestDayHours) { bestDayHours = dh; bestDayName = DAY_NAMES[i]; }
  });
  const bestDay = bestDayName ? { name: bestDayName, hours: bestDayHours } : null;

  const coreIds  = new Set(JOB_TYPES.core.map(function(j) { return j.id; }));
  const hiveIds  = new Set(JOB_TYPES.hive.map(function(j) { return j.id; }));
  const salesIds = new Set(JOB_TYPES.sales.map(function(j) { return j.id; }));
  let core = 0, hive = 0, sales = 0, absence = 0;
  Object.values(week.days || {}).forEach(function(dayJobs) {
    dayJobs.forEach(function(j) {
      if (coreIds.has(j.id)) core++;
      else if (hiveIds.has(j.id)) hive++;
      else if (salesIds.has(j.id)) sales++;
      else absence++;
    });
  });
  absence += (week.deductionLog || []).length;

  const ctapImpact = week.excludeFromCtap ? null : gap;

  let allJobs = [];
  const dayJobCounts = {};
  days.forEach(function(dk) {
    const jobs = (week.days || {})[dk] || [];
    allJobs = allJobs.concat(jobs);
    dayJobCounts[dk] = jobs.length;
  });
  const totalJobs = allJobs.length;

  // Streak — consecutive past weeks with the same hit/miss outcome, ending at weekKey
  const todayWk = getWeekKey(new Date());
  const allPastWkKeys = Object.keys(state.weeks).filter(function(w) { return w < todayWk; }).sort();
  const wkIdx = allPastWkKeys.indexOf(weekKey);
  let streakCount = 0;
  if (wkIdx >= 0) {
    for (let i = wkIdx; i >= 0; i--) {
      const w = state.weeks[allPastWkKeys[i]];
      if (!w || bonusAchieved(state, w) !== bonus) break;
      streakCount++;
    }
  } else {
    streakCount = 1;
  }
  const streak = { count: streakCount, kind: bonus ? 'hit' : 'miss' };

  let standout = null;
  const highestJobEntry = allJobs.length > 0
    ? allJobs.reduce(function(best, j) { return j.creditMins > best.creditMins ? j : best; }, allJobs[0])
    : null;
  const highestJobHours = highestJobEntry ? highestJobEntry.creditMins / 60 : 0;
  const maxDayCount = Object.values(dayJobCounts).reduce(function(m, c) { return Math.max(m, c); }, 0);
  const busiestDayIdx = days.findIndex(function(dk) { return dayJobCounts[dk] === maxDayCount; });

  if (highestJobHours >= 1.0 && highestJobEntry) {
    const shortName = highestJobEntry.name.replace(/\s*\(.*$/, '');
    standout = { kind: 'highest_job', name: shortName, hours: highestJobHours };
  } else if (maxDayCount >= 5 && busiestDayIdx >= 0) {
    standout = { kind: 'busiest_day', dayName: DAY_NAMES[busiestDayIdx], count: maxDayCount };
  } else if (totalJobs > 0) {
    standout = { kind: 'total_jobs', count: totalJobs };
  }

  return {
    earned: earned, target: target, bonus: bonus, gap: gap, pct: pct,
    bestDay: bestDay,
    categoryCounts: { core: core, hive: hive, sales: sales, absence: absence },
    ctapImpact: ctapImpact,
    totalJobs: totalJobs,
    streak: streak,
    standout: standout,
  };
}

// ── Voice log parsing ──────────────────────────────────────────────────────
// Turns spoken shorthand ("six breakdowns and two boiler leads yesterday")
// into draft job entries. Pure and deterministic — the caller supplies the
// reference date, so "yesterday" is testable.
//
// Matching is deliberately generous: engineers speak trade shorthand and
// speech-to-text mangles job codes. Nothing parsed here is ever written
// straight to state — every result goes through the confirm sheet first, so a
// wrong guess costs one tap to fix rather than corrupting a week. See ADR-0007.

const VOICE_UNITS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19
};
const VOICE_TENS = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90
};
// Spoken quantifiers that stand in for a number.
const VOICE_QUANTIFIERS = { a: 1, an: 1, couple: 2, pair: 2, few: 3 };

// Spoken phrase → job id. Matched longest-phrase-first, so "install hive trvs"
// beats "hive trv" and "fire repair" beats "fire". Ambiguous bare words
// (e.g. "thermostat") are deliberately absent — better to report them as
// unmatched than to guess wrong.
const VOICE_ALIASES = {
  // ── Core: services ──
  asv_chb_cir_wh_swh: ['gas service', 'boiler service', 'annual service', 'combi service', 'service', 'services', 'serviced'],
  asv_fre: ['gas fire service', 'fire service', 'gas fire', 'gas fires', 'fire', 'fires'],
  asv_hob_ckr_ovn: ['cooker service', 'hob service', 'oven service', 'cooker', 'cookers', 'hob', 'hobs', 'oven', 'ovens'],
  asv_bbf_wau_waw_aga: ['back boiler service', 'warm air service', 'warm air', 'back boiler', 'back boilers', 'aga'],
  asv_mwh_wal: ['multipoint water heater', 'multipoint', 'water heater', 'water heaters', 'wall heater'],
  // ── Core: repairs ──
  gas_repair: ['gas repair', 'gas repairs', 'breakdown', 'breakdowns', 'call out', 'callout', 'call outs', 'callouts', 'repair', 'repairs'],
  linked_ib: ['linked fire repair', 'fire repair', 'linked repair', 'linked ib'],
  od_chb: ['on demand repair', 'on demand', 'non contract repair'],
  oow_chb: ['warranty repair', 'out of warranty', 'warranty'],
  ods_chb: ['one off service', 'non contract service'],
  // ── Core: first visit / fix ──
  fv_chb: ['first visit', 'first visits'],
  fv_bbf_wau_waw: ['back boiler first visit', 'first visit back boiler'],
  ib_ff: ['first fix', 'first fixes'],
  remedial_safety: ['remedial safety works', 'remedial safety', 'remedial', 'remedials'],
  // ── Core: long duration / other ──
  ld_completed: ['long duration', 'long durations'],
  ld_unv: ['long duration unvented', 'unvented cylinder', 'unvented'],
  oca: ['oca', 'ocas'],
  free_gas_safety: ['free gas safety check', 'free safety check', 'free gas safety'],
  as_inst: ['landlords gas inspection', 'landlord inspection', 'landlords inspection', 'landlords', 'landlord', 'lgsc'],
  trace_repair: ['trace and repair', 'trace repair', 'trace'],
  // ── Hive ──
  hvi_hub: ['opentherm upgrade', 'open therm upgrade', 'opentherm', 'open therm', 'hive hub'],
  hvi_min: ['hive mini install', 'hive mini', 'mini thermostat'],
  hvi_wls: ['hive wireless thermostat', 'wireless thermostat', 'hive wireless', 'wireless hive'],
  hvi_wrd: ['hive wired thermostat', 'wired thermostat', 'hive wired', 'wired hive'],
  hvi_imz: ['additional zone', 'extra zone', 'second zone', 'hive zone'],
  hvi_trv: ['hive trv', 'hive trvs', 'trv', 'trvs'],
  hvi_iio: ['faulty controls install', 'in day install', 'inday install', 'faulty controls'],
  hvu_the: ['uninstall thermostat', 'hive uninstall', 'uninstall hive'],
  hive_repair: ['hive repair', 'hive breakdown', 'hive fault', 'thermostat repair'],
  recall_hive: ['recall hive', 'hive recall', 'recall'],
  inshv_min: ['install hive mini', 'hive mini sold'],
  inshv_thr: ['install hive thermostat', 'hive thermostat sold'],
  inshv_trv: ['install hive trvs', 'hive trvs sold'],
  // ── Sales / SGO ──
  standalone_quote: ['standalone quote', 'provide quote', 'quote', 'quotes', 'quoted'],
  him_upgrade: ['him upgrade', 'home improvement upgrade', 'him'],
  add_inhibitor: ['add inhibitor', 'added inhibitor', 'in day inhibitor'],
  cod_gas: ['carbon monoxide detector', 'co detector', 'cod'],
  hi_lead: ['boiler lead', 'boiler leads', 'hi lead', 'hi leads', 'lead', 'leads'],
  inhibitor: ['inhibitor', 'inhibitors'],
  hive_sale_sgo: ['hive sale', 'hive sold', 'sold a hive', 'hive sgo'],
  hive_sale_fit: ['hive fit', 'hive fitting', 'fitted hive'],
  co_alarm_sgo: ['co alarm sale', 'co alarm sold', 'sold a co alarm', 'co alarm sgo'],
  co_alarm_fit: ['co alarm fit', 'fitted co alarm', 'co alarm', 'co alarms'],
  // ── Absence / NPT / operational ──
  wait_work: ['wait work', 'waiting time', 'wait time', 'waiting', 'stood down'],
  early_finish: ['early finish', 'finished early', 'finish early', 'early dart'],
  mentor_full: ['mentoring all day', 'mentoring full day', 'full day mentoring', 'mentor full'],
  mentor_partial: ['mentor partial', 'partial mentoring', 'shadowing', 'mentoring', 'mentor'],
  ev_charge: ['ev charging', 'ev charge', 'charging the van', 'charged the van'],
  buybox_collection: ['bybox collection', 'buybox collection', 'bybox', 'buybox', 'by box'],
  merchant_parts: ['merchant parts', 'parts collection', 'merchants', 'merchant'],
  npt_quick: ['non productive time', 'non productive', 'npt']
};

// Phrases that match, but only to a catch-all. "Four repairs" is a real
// sentence an engineer says, and refusing it would be worse than accepting it —
// but a repair could be a boiler, a cooker or a fire, at different credit. So
// these resolve to the most common job and the item is flagged `assumed`, which
// the confirm sheet surfaces. Teaches the specific wording without blocking.
const VOICE_BROAD = [
  'repair', 'repairs', 'breakdown', 'breakdowns', 'call out', 'callout', 'call outs', 'callouts',
  'service', 'services', 'serviced', 'fire', 'fires', 'gas fire', 'gas fires',
  'quote', 'quotes', 'quoted', 'lead', 'leads', 'job', 'jobs'
];

// Flattened and sorted once: longest spoken phrase wins.
const VOICE_ALIAS_INDEX = Object.keys(VOICE_ALIASES)
  .reduce(function(acc, jobId) {
    VOICE_ALIASES[jobId].forEach(function(say) { acc.push({ say: say, jobId: jobId }); });
    return acc;
  }, [])
  .sort(function(a, b) { return b.say.length - a.say.length; });

const VOICE_WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Normalise speech-to-text output: lowercase, strip punctuation, fold the
// spoken forms that would otherwise break clause splitting or alias matching.
function normaliseVoiceText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[.,!?;:]/g, ' ')
    .replace(/[’']s\b/g, '')
    .replace(/\bt\s*(?:&|and)\s*r\b/g, 'trace and repair')
    .replace(/\b(?:c\.?o\.?|carbon monoxide)\s*alarm/g, 'co alarm')
    .replace(/&/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

// "forty five" → 45, "twenty" → 20, "6" → 6. Returns null when `tokens`
// doesn't start with a number, plus how many tokens were consumed.
function readNumber(tokens, i) {
  const t = tokens[i];
  if (t === undefined) return null;
  if (/^\d+(?:\.\d+)?$/.test(t)) return { value: parseFloat(t), used: 1 };
  if (VOICE_TENS[t] !== undefined) {
    const next = tokens[i + 1];
    if (next !== undefined && VOICE_UNITS[next] !== undefined && VOICE_UNITS[next] > 0) {
      return { value: VOICE_TENS[t] + VOICE_UNITS[next], used: 2 };
    }
    return { value: VOICE_TENS[t], used: 1 };
  }
  if (VOICE_UNITS[t] !== undefined) return { value: VOICE_UNITS[t], used: 1 };
  return null;
}

// Pull a spoken duration out of a clause, returning the minutes and the clause
// with the duration text removed (so it can't be mistaken for a quantity).
function extractDurationMins(clause) {
  const patterns = [
    { re: /\bhalf an hour\b|\bhalf hour\b/, mins: function() { return 30; } },
    { re: /\ban hour and a half\b/, mins: function() { return 90; } },
    { re: /\b(.+?)\s+and a half hours?\b/, mins: function(m, toks) { const n = readNumber(toks, 0); return n ? n.value * 60 + 30 : null; } },
    { re: /\b(.+?)\s+hours?\s+(?:and\s+)?(.+?)\s+(?:minutes?|mins?)\b/, mins: null, dual: true },
    { re: /\b(.+?)\s+(?:hours?|hrs?)\b/, mins: function(m, toks) { const n = readNumber(toks, 0); return n ? n.value * 60 : null; } },
    { re: /\ban hour\b/, mins: function() { return 60; } },
    { re: /\b(.+?)\s+(?:minutes?|mins?)\b/, mins: function(m, toks) { const n = readNumber(toks, 0); return n ? n.value : null; } }
  ];

  for (let p = 0; p < patterns.length; p++) {
    const pat = patterns[p];
    const m = clause.match(pat.re);
    if (!m) continue;

    let mins = null;
    if (pat.dual) {
      const hTok = String(m[1]).split(' ').slice(-2);
      const mTok = String(m[2]).split(' ').slice(-2);
      const h = readNumber(hTok, hTok.length - 1) || readNumber(hTok, 0);
      const mm = readNumber(mTok, mTok.length - 1) || readNumber(mTok, 0);
      if (h && mm) mins = h.value * 60 + mm.value;
    } else if (m[1] !== undefined) {
      // Only the trailing token(s) of the capture are the number — the rest is
      // job wording ("wait work two hours").
      const toks = String(m[1]).split(' ');
      for (let start = Math.max(0, toks.length - 2); start < toks.length; start++) {
        const n = readNumber(toks, start);
        if (n && start + n.used === toks.length) {
          mins = pat.mins(m, toks.slice(start));
          if (mins !== null) {
            const kept = toks.slice(0, start).join(' ');
            return { mins: mins, rest: (kept + ' ' + clause.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim() };
          }
        }
      }
      continue;
    } else {
      mins = pat.mins(m, []);
    }

    if (mins === null) continue;
    return { mins: mins, rest: clause.replace(pat.re, ' ').replace(/\s+/g, ' ').trim() };
  }
  return { mins: null, rest: clause };
}

// Find a spoken day reference and resolve it against `refDateStr`.
// Returns the matched phrase so the caller can strip it before clause parsing.
// Every day named in the transcript, in the order spoken.
//
// extractVoiceDay below finds the first one and stops, which is all a
// single-day dictation needs. Reading a whole week back — "Monday six
// breakdowns, Tuesday three services" — needs all of them, with positions, so
// the work said after each day name can be attached to it.
function findVoiceDayMarkers(text, refDateStr) {
  const ref = new Date(refDateStr + 'T00:00:00');
  const found = [];

  [['day before yesterday', 2], ['yesterday', 1], ['today', 0]].forEach(function(pair) {
    const rx = new RegExp('\\b' + pair[0] + '\\b', 'g');
    let m;
    while ((m = rx.exec(text)) !== null) {
      const d = new Date(ref);
      d.setDate(d.getDate() - pair[1]);
      found.push({ start: m.index, end: m.index + m[0].length, phrase: m[0], dayKey: localDateStr(d) });
    }
  });

  VOICE_WEEKDAYS.forEach(function(name, i) {
    const rx = new RegExp('\\b(?:last\\s+|on\\s+)?' + name + '\\b', 'g');
    let m;
    while ((m = rx.exec(text)) !== null) {
      const back = (ref.getDay() - i + 7) % 7;
      const d = new Date(ref);
      d.setDate(d.getDate() - (back === 0 && /\blast\b/.test(m[0]) ? 7 : back));
      found.push({ start: m.index, end: m.index + m[0].length, phrase: m[0], dayKey: localDateStr(d) });
    }
  });

  // Earliest first; on a tie the longer phrase wins, so the overlap pass below
  // keeps "day before yesterday" rather than the "yesterday" sitting inside it.
  found.sort(function(a, b) {
    return a.start - b.start || (b.end - b.start) - (a.end - a.start);
  });

  const out = [];
  found.forEach(function(m) {
    if (out.length && m.start < out[out.length - 1].end) return;
    out.push(m);
  });
  return out;
}

// Cut the transcript into one segment per day named, each holding the work
// that belongs to that day.
//
// Two ways an engineer says this, and they need opposite splits:
//   day-leading  "Monday six breakdowns, Tuesday three services"
//   day-trailing "six breakdowns on Monday, three services on Tuesday"
// Jobs appearing before the first day name is the tell for the trailing form —
// in the leading form there is nothing there but "right so" and "I did".
//
// Zero or one day named falls through to exactly the old behaviour: the whole
// utterance belongs to that one day, wherever in the sentence it was mentioned.
function splitVoiceDays(text, refDateStr) {
  const ref = new Date(refDateStr + 'T00:00:00');
  const markers = findVoiceDayMarkers(text, refDateStr);
  const tidy = function(s) { return String(s || '').replace(/\s+/g, ' ').trim(); };

  if (markers.length === 0) {
    return [{ dayKey: localDateStr(ref), phrase: null, body: tidy(text) }];
  }
  if (markers.length === 1) {
    const m = markers[0];
    return [{
      dayKey: m.dayKey, phrase: m.phrase,
      body: tidy(text.slice(0, m.start) + ' ' + text.slice(m.end))
    }];
  }

  const lead = text.slice(0, markers[0].start);
  const trailing = findVoiceAliasMatches(lead).length > 0;

  const segments = markers.map(function(m, i) {
    const body = trailing
      ? (i === 0 ? lead : text.slice(markers[i - 1].end, m.start))
      : text.slice(m.end, i + 1 < markers.length ? markers[i + 1].start : text.length);
    return { dayKey: m.dayKey, phrase: m.phrase, body: tidy(body) };
  });

  // "Monday two services… and Monday a breakdown" is one day, said twice.
  const byDay = [];
  segments.forEach(function(seg) {
    const prior = byDay.filter(function(s) { return s.dayKey === seg.dayKey; })[0];
    if (prior) prior.body = tidy(prior.body + ' ' + seg.body);
    else byDay.push(seg);
  });
  return byDay;
}

function extractVoiceDay(text, refDateStr) {
  const ref = new Date(refDateStr + 'T00:00:00');

  if (/\bday before yesterday\b/.test(text)) {
    const d = new Date(ref); d.setDate(d.getDate() - 2);
    return { dayKey: localDateStr(d), phrase: 'day before yesterday' };
  }
  if (/\byesterday\b/.test(text)) {
    const d = new Date(ref); d.setDate(d.getDate() - 1);
    return { dayKey: localDateStr(d), phrase: 'yesterday' };
  }
  if (/\btoday\b/.test(text)) return { dayKey: localDateStr(ref), phrase: 'today' };

  for (let i = 0; i < VOICE_WEEKDAYS.length; i++) {
    const name = VOICE_WEEKDAYS[i];
    const m = text.match(new RegExp('\\b(?:last\\s+|on\\s+)?' + name + '\\b'));
    if (!m) continue;
    // Most recent occurrence of that weekday, on or before the reference date.
    const back = (ref.getDay() - i + 7) % 7;
    const d = new Date(ref);
    d.setDate(d.getDate() - (back === 0 && /\blast\b/.test(m[0]) ? 7 : back));
    return { dayKey: localDateStr(d), phrase: m[0] };
  }
  return { dayKey: localDateStr(ref), phrase: null };
}

// Words that carry no meaning for matching — used only to decide whether
// leftover text is worth reporting back as "couldn't match this bit".
const VOICE_FILLER = new Set([
  'i', 'we', 'ive', 'weve', 'have', 'has', 'had', 'did', 'done', 'do', 'doing',
  'got', 'get', 'was', 'were', 'been', 'then', 'also', 'plus', 'and', 'with',
  'another', 'more', 'some', 'just', 'only', 'about', 'around', 'roughly',
  'of', 'for', 'by', 'on', 'at', 'in', 'to', 'the', 'my', 'a', 'an', 'x',
  'today', 'so', 'um', 'uh', 'er', 'ok', 'okay', 'right', 'up', 'out',
  // Verbs and time-of-day wording engineers wrap around a job name — these
  // are noise once the job phrase itself has been matched.
  'install', 'installed', 'fit', 'fitted', 'fitting', 'sold', 'sell', 'selling',
  'replace', 'replaced', 'change', 'changed', 'carried', 'complete', 'completed',
  'attend', 'attended', 'booked', 'went', 'nothing', 'this', 'that', 'there',
  'here', 'it', 'its', 'all', 'day', 'morning', 'afternoon', 'evening'
]);
// Trailing words between a spoken quantity and the job name.
const VOICE_TRAILING_FILLER = new Set(['of', 'x', 'more', 'extra', 'other', 'additional', 'further', 'new', 'the']);

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Read a spoken quantity: numbers ("six", "twenty two", "4") or quantifiers
// ("a", "a couple of").
function readQuantity(tokens, i) {
  const n = readNumber(tokens, i);
  if (n) return n;
  if (VOICE_QUANTIFIERS[tokens[i]] !== undefined) return { value: VOICE_QUANTIFIERS[tokens[i]], used: 1 };
  return null;
}

// Pull the quantity out of the text sitting immediately before a job phrase.
// The number must run right up to the job name ("six breakdowns", "three more
// services") so that stray digits elsewhere in the sentence aren't captured.
function readLeadingQty(text) {
  let tokens = String(text || '').trim().split(/\s+/).filter(Boolean);
  while (tokens.length > 0 && VOICE_TRAILING_FILLER.has(tokens[tokens.length - 1])) tokens.pop();
  // Preferred: the number runs right up to the job name ("six breakdowns").
  for (let i = 0; i < tokens.length; i++) {
    const q = readQuantity(tokens, i);
    if (q && i + q.used === tokens.length) return Math.max(1, Math.round(q.value));
  }
  // Otherwise take the first number in the run-up, so an appliance word between
  // the count and the job doesn't swallow it — "four boiler repairs" is four.
  for (let i = 0; i < tokens.length; i++) {
    const q = readQuantity(tokens, i);
    if (q) return Math.max(1, Math.round(q.value));
  }
  return 1;
}

// Does this leftover fragment contain anything worth flagging to the engineer?
function hasMeaningfulWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .some(function(t) {
      return !VOICE_FILLER.has(t) && !readQuantity([t], 0) && !/^\d+(?:\.\d+)?$/.test(t);
    });
}

// Locate every job phrase in the text, longest phrase first so that
// "install hive trvs" wins over "hive trv" and "fire repair" over "fire".
// Overlapping matches are discarded — each stretch of text belongs to one job.
function findVoiceAliasMatches(text) {
  const taken = new Array(text.length).fill(false);
  const matches = [];

  for (let i = 0; i < VOICE_ALIAS_INDEX.length; i++) {
    const entry = VOICE_ALIAS_INDEX[i];
    // Tolerate the spoken plural ("three gas services") without needing every
    // alias listed twice. Longest-first ordering still uses the base phrase,
    // so "gas service(s)" beats the shorter bare "services".
    const plural = /s$/.test(entry.say) ? '' : '(?:e?s)?';
    const re = new RegExp('\\b' + escapeRe(entry.say) + plural + '\\b', 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;
      let free = true;
      for (let c = start; c < end; c++) { if (taken[c]) { free = false; break; } }
      if (!free) continue;
      for (let c = start; c < end; c++) taken[c] = true;
      matches.push({ start: start, end: end, jobId: entry.jobId, say: entry.say });
    }
  }

  return matches.sort(function(a, b) { return a.start - b.start; });
}

// Parse a spoken log into draft entries.
//   parseVoiceLog('six breakdowns and two boiler leads', '2026-07-29')
// Returns { dayKey, dayPhrase, items: [...], unmatched: [...] }.
// Each item: { jobId, job, qty, value, needsValue, phrase }
//   `value`      — variable-job input, already in the job's own unit
//                  (hours for wait work, minutes for NPT/trace & repair)
//   `needsValue` — variable job with no duration spoken; the confirm sheet
//                  must collect one before it can be logged.
// Pull the jobs out of one day's worth of speech. Knows nothing about dates —
// splitVoiceDays has already decided which day this text belongs to.
function parseVoiceBody(body) {
  const matches = findVoiceAliasMatches(body);
  const items = [];
  const unmatched = [];

  // Anything before the first job phrase that isn't a quantity or filler.
  function noteLeftover(fragment) {
    const cleaned = String(fragment || '').replace(/^\s*(?:and|then|plus|also|with|,)\s*/, '').trim();
    if (cleaned && hasMeaningfulWords(cleaned)) unmatched.push(cleaned);
  }

  // Text carried forward when a duration was consumed from a job's tail, so
  // the next job doesn't read that duration as its own quantity.
  let pendingPrefix = null;
  let cursor = 0;

  matches.forEach(function(m, idx) {
    const rawPrefix = pendingPrefix !== null ? pendingPrefix : body.slice(cursor, m.start);
    pendingPrefix = null;
    cursor = m.end;

    const job = findJob(m.jobId);
    if (!job) { noteLeftover(rawPrefix); return; }

    // A duration may sit before the job ("two hours wait work") or after it
    // ("trace and repair forty five minutes").
    const before = extractDurationMins(rawPrefix);
    let mins = before.mins;
    let qtyText = before.rest;

    if (mins === null && job.variable) {
      const nextStart = idx + 1 < matches.length ? matches[idx + 1].start : body.length;
      const after = extractDurationMins(body.slice(m.end, nextStart));
      if (after.mins !== null) {
        mins = after.mins;
        pendingPrefix = after.rest;   // remainder still belongs to the next job
        cursor = nextStart;
      }
    }

    const qty = readLeadingQty(qtyText);
    noteLeftover(qtyText);

    let value = null;
    if (job.variable && mins !== null) {
      value = job.variableType === 'hours'
        ? Math.round((mins / 60) * 100) / 100
        : Math.round(mins);
    }

    items.push({
      jobId: m.jobId,
      job: job,
      // Mentor days are a flag on the day, not a countable entry.
      qty: (job.isMentorFull || job.isMentorPartial) ? 1 : qty,
      value: value,
      needsValue: !!job.variable && value === null,
      assumed: VOICE_BROAD.indexOf(m.say) !== -1,
      phrase: m.say
    });
  });

  // Trailing text after the last job phrase (or the whole thing if nothing matched).
  noteLeftover(pendingPrefix !== null ? pendingPrefix : body.slice(cursor));

  return { items: items, unmatched: unmatched };
}

// Returns a draft: every job heard, each tagged with the day it belongs to.
//
//   { dayKey, dayPhrase, days: [dayKey…], items: [{…, dayKey}], unmatched }
//
// `dayKey` is the first day named and `days` lists them all. One day named (or
// none) leaves both describing the same single day, so callers that only ever
// handled one day keep working.
function parseVoiceLog(transcript, refDateStr) {
  const refDay = refDateStr || getTodayKey();
  const text = normaliseVoiceText(transcript);
  if (!text) return { dayKey: refDay, dayPhrase: null, days: [], items: [], unmatched: [] };

  const segments = splitVoiceDays(text, refDay);
  const items = [];
  const unmatched = [];

  segments.forEach(function(seg) {
    const parsed = parseVoiceBody(seg.body);
    parsed.items.forEach(function(it) {
      it.dayKey = seg.dayKey;
      items.push(it);
    });
    parsed.unmatched.forEach(function(u) {
      if (unmatched.indexOf(u) === -1) unmatched.push(u);
    });
  });

  // Merge repeats of the same job ("two services ... and another service"), but
  // only within a day — Monday's services and Tuesday's are different entries.
  // Variable entries never merge; each carries its own duration.
  const merged = [];
  items.forEach(function(it) {
    const prior = it.job.variable ? null : merged.filter(function(m) {
      return m.jobId === it.jobId && m.dayKey === it.dayKey && !m.job.variable;
    })[0];
    if (prior) { prior.qty += it.qty; prior.assumed = prior.assumed || it.assumed; }
    else merged.push(it);
  });

  const days = [];
  merged.forEach(function(it) { if (days.indexOf(it.dayKey) === -1) days.push(it.dayKey); });
  days.sort();

  return {
    dayKey: segments[0].dayKey,
    dayPhrase: segments[0].phrase,
    days: days,
    items: merged,
    unmatched: unmatched
  };
}

// Credit minutes one entry is worth. Mirrors the arithmetic in logJob() —
// for variable jobs an 'hours' input scales the job's minutes, a 'minutes'
// input *is* the credit.
function voiceEntryCreditMins(job, value) {
  if (!job || job.isNpt || job.isMentorFull || job.isMentorPartial) return 0;
  if (!job.variable) return job.minutes;
  if (value === null || value === undefined) return 0;
  return job.variableType === 'hours' ? job.minutes * value : value;
}

// Total credit hours a parsed batch would add. Variable entries with no value
// yet contribute nothing; NPT and mentor entries never add credit.
function voiceBatchCreditHours(items) {
  return (items || []).reduce(function(sum, it) {
    const job = it.job || findJob(it.jobId);
    return sum + (voiceEntryCreditMins(job, it.value) * it.qty) / 60;
  }, 0);
}

// ── Daily check-in ─────────────────────────────────────────────────────────
// A coaching conversation the engineer has with themselves, structured as GROW
// across the working week. Self-facing, never ranked, and the app never answers
// its own questions — the whole effect depends on the engineer supplying the
// answer. See ADR-0012 and ADR-0013.

// The goal menu. These are process habits an engineer can actually choose to
// work on, in contrast to the CTAP target, which is handed to them.
//   goal — how it reads once picked, in the engineer's own voice
//   ask  — the end-of-day question while it is this week's goal
const CHECKIN_FACTORS = [
  { tag: 'van_tools',     label: 'Van & tools',
    goal: 'Keep the van and my tools organised',
    ask:  'Van and tools organised today?' },
  { tag: 'safety_first',  label: 'Safety first',
    goal: 'Do my safety checks before I start, every job',
    ask:  'Safety checks done first today?' },
  { tag: 'process',       label: 'Process',
    goal: 'Follow my own process instead of winging it',
    ask:  'Followed your own process today?' },
  { tag: 'fault_finding', label: 'Fault-finding',
    goal: 'Work to a fault-finding order I actually trust',
    ask:  'Stuck to your fault-finding order today?' },
  { tag: 'customer',      label: 'Customer',
    goal: 'Stop over-explaining — say it once, clearly',
    ask:  'Customer conversations go the way you wanted?' },
];

// A goal the engineer wrote themselves. Autonomy is the point: a menu of five
// is a starting set, not the boundary of what someone is allowed to work on.
const CHECKIN_CUSTOM_TAG = 'custom';
const CHECKIN_CUSTOM_ASK = 'How did you do on that today?';
const CHECKIN_GOAL_MAX = 80;

// Three-way, never binary. A yes/no forces a false answer on a middling day.
const CHECKIN_RATINGS = [
  { value: 'no',  label: 'Not really' },
  { value: 'mid', label: 'So-so' },
  { value: 'yes', label: 'Yes' },
];

const CHECKIN_NOTE_MAX = 280;
const CHECKIN_NOTE_PLACEHOLDER =
  'No customer names, addresses, or job details — how it felt, not what happened.';

// ── GROW ──
// One stage a day, so the arc completes across a working week and each day's
// ask stays under a minute. Reality lands Tue/Wed, while there is still week
// left to change; Options and Will close it out.
//
// Every question here is open and answered by the engineer. None of them offers
// a suggestion, and none of them contains the app's opinion — a coach that
// supplies the answer produces compliance, which does not persist. That is the
// property the guardrail tests exist to hold.
const GROW_STAGES = [
  { id: 'goal',    label: 'Goal',    blurb: 'What you want to be different' },
  { id: 'reality', label: 'Reality', blurb: "What's actually happening" },
  { id: 'options', label: 'Options', blurb: 'What you could try' },
  { id: 'will',    label: 'Will',    blurb: "What you'll actually do" },
];

const GROW_QUESTIONS = {
  // The picker already asked *what*. These ask *why* — putting the reason into
  // your own words is what turns a picked option into a goal you own, and it is
  // the difference between Monday taking twenty seconds and being a formality.
  goal: [
    { id: 'goal_why',     text: 'Why that one, this week?' },
    { id: 'goal_friday',  text: 'What would be different by Friday if you got it right?' },
    { id: 'goal_worth',   text: 'What makes that one worth the effort?' },
  ],
  // Tuesday — where it is slipping. Asked before Wednesday's exception question
  // so the week still has room to move.
  reality_obstacle: [
    { id: 'real_inway',   text: "What's getting in the way of that so far?" },
    { id: 'real_slip',    text: 'Where did it slip today?' },
    { id: 'real_cost',    text: "What's it actually costing you when it goes wrong?" },
  ],
  // Wednesday — exception-finding. Asking when it went *right* and what you did
  // differently surfaces the engineer's own working method, which is the thing
  // that can be repeated. A week of only problem-hunting teaches nothing.
  reality_exception: [
    { id: 'real_wellwhat', text: 'When it did go well today, what were you doing differently?' },
    { id: 'real_easiest',  text: 'Which job went easiest today, and what made it easy?' },
    { id: 'real_closest',  text: 'When did you come closest to how you wanted to work?' },
  ],
  options: [
    { id: 'opt_try',    text: 'What could you try tomorrow?' },
    { id: 'opt_more',   text: 'What would you do more of, if the week started again?' },
    // Relatedness — pointing outward, at people who already exist. See ADR-0013.
    { id: 'opt_who',    text: 'Who could you ask about this?' },
    { id: 'opt_remove', text: 'What could you stop doing to make room for it?' },
  ],
  will: [
    { id: 'will_do',     text: 'What will you actually do next week?' },
    { id: 'will_first',  text: 'What will you do first thing Monday?' },
    { id: 'will_keep',   text: "What's worth keeping from this week?" },
  ],
};

// Days since epoch. Rotation is derived from the date so the same day always
// asks the same thing — re-opening the sheet must not reshuffle the questions
// under someone mid-answer.
function checkinDayIndex(dayKey) {
  return Math.floor(Date.parse(dayKey + 'T00:00:00Z') / 86400000);
}

// Mon sets the goal, Tue/Wed look at reality, Thu opens options, Fri commits.
// The weekend holds on Will rather than starting something new — a Friday the
// engineer worked through can still be closed on Sunday night.
function growStageForDay(dayKey) {
  const dow = new Date(dayKey + 'T00:00:00').getDay();   // 0 = Sunday
  if (dow === 1) return 'goal';
  if (dow === 2 || dow === 3) return 'reality';
  if (dow === 4) return 'options';
  return 'will';
}

// Which bank a day draws from — Reality splits into two distinct angles.
function growBankForDay(dayKey) {
  const stage = growStageForDay(dayKey);
  if (stage !== 'reality') return stage;
  return new Date(dayKey + 'T00:00:00').getDay() === 2 ? 'reality_obstacle' : 'reality_exception';
}

// Stable within a day, varied week to week — the same Tuesday question every
// Tuesday for a year stops being a question and becomes a form field.
function growQuestionForDay(dayKey) {
  const bank = growBankForDay(dayKey);
  const list = GROW_QUESTIONS[bank];
  const wk = Math.floor(checkinDayIndex(dayKey) / 7);
  const q = list[((wk % list.length) + list.length) % list.length];
  return { stage: growStageForDay(dayKey), bank: bank, id: q.id, text: q.text };
}

function findGrowStage(id) {
  return GROW_STAGES.filter(function(s) { return s.id === id; })[0] || null;
}

function findCheckinFactor(tag) {
  return CHECKIN_FACTORS.filter(function(f) { return f.tag === tag; })[0] || null;
}

// ── The week's goal ──
// Week-keyed, not day-keyed: the goal is the thread the daily questions hang
// off, and it is the engineer's own — the app never picks one for them.

function getWeekGoal(state, weekKey) {
  return (state.coachGoals || {})[weekKey] || null;
}

function setWeekGoal(state, weekKey, goal) {
  if (!state.coachGoals) state.coachGoals = {};
  if (!goal) { delete state.coachGoals[weekKey]; return null; }
  const custom = (goal.customText || '').trim().slice(0, CHECKIN_GOAL_MAX);
  state.coachGoals[weekKey] = custom
    ? { factorTag: CHECKIN_CUSTOM_TAG, customText: custom }
    : { factorTag: goal.factorTag, customText: '' };
  return state.coachGoals[weekKey];
}

// The goal as a sentence, however it was set.
function goalText(goal) {
  if (!goal) return '';
  if (goal.customText) return goal.customText;
  const f = findCheckinFactor(goal.factorTag);
  return f ? f.goal : '';
}

// The end-of-day question for whatever the goal is.
function goalAsk(goal) {
  if (!goal) return '';
  if (goal.customText) return CHECKIN_CUSTOM_ASK;
  const f = findCheckinFactor(goal.factorTag);
  return f ? f.ask : CHECKIN_CUSTOM_ASK;
}

// The tag a day's rating is filed under — the goal's factor, so the trend dots
// track the thing the engineer chose rather than a fixed checklist.
function goalRatingTag(goal) {
  if (!goal) return null;
  return goal.customText ? CHECKIN_CUSTOM_TAG : goal.factorTag;
}

// ── Check-in state ──
// state.checkins is keyed by day: { ratings: {tag: rating}, note, promptId },
// where promptId is the GROW question the note answers and the rating is filed
// under the week goal's tag. The Supabase table is row-per-answer; this
// day-level shape is what the UI reads, the same way week.days holds job
// objects that become job_logs rows.

function getCheckin(state, dayKey) {
  return (state.checkins || {})[dayKey] || null;
}

function getOrCreateCheckin(state, dayKey) {
  if (!state.checkins) state.checkins = {};
  if (!state.checkins[dayKey]) state.checkins[dayKey] = { ratings: {}, note: '', promptId: null };
  if (!state.checkins[dayKey].ratings) state.checkins[dayKey].ratings = {};
  return state.checkins[dayKey];
}

// Nothing is required, so "answered" means at least one field carries content.
function checkinIsEmpty(entry) {
  if (!entry) return true;
  const hasRating = Object.keys(entry.ratings || {}).some(function(k) {
    return !!entry.ratings[k];
  });
  return !hasRating && !(entry.note || '').trim();
}

function checkinAnsweredCount(entry) {
  if (!entry) return 0;
  const rated = Object.keys(entry.ratings || {}).filter(function(k) {
    return !!entry.ratings[k];
  }).length;
  return rated + ((entry.note || '').trim() ? 1 : 0);
}

// ── Weekly self-rating average (the dot row on the trend view) ──

function checkinRatingScore(rating) {
  if (rating === 'yes') return 2;
  if (rating === 'mid') return 1;
  if (rating === 'no') return 0;
  return null;
}

// Average of every rating given across the week's seven days, on a 0–2 scale.
// Returns null when the engineer rated nothing that week — an unrated week
// shows a hollow dot, not a red one. Silence is not a bad score.
function weekCheckinAverage(state, weekKey) {
  const days = weekDays(weekKey);
  let sum = 0;
  let n = 0;
  days.forEach(function(dk) {
    const entry = (state.checkins || {})[dk];
    if (!entry) return;
    Object.keys(entry.ratings || {}).forEach(function(tag) {
      const score = checkinRatingScore(entry.ratings[tag]);
      if (score === null) return;
      sum += score;
      n += 1;
    });
  });
  if (n === 0) return null;
  return { avg: sum / n, n: n };
}

// green = mostly yes, amber = so-so, red = not really. A band, not a verdict:
// it is the engineer's own answer played back, not the app's assessment.
function checkinBand(avg) {
  if (avg === null || avg === undefined) return 'none';
  if (avg >= 1.5) return 'green';
  if (avg >= 0.75) return 'amber';
  return 'red';
}

// ── Keeping job detail out of the note ──
// The schema is the real enforcement — there is nowhere to put a customer name.
// This is the second line: a live warning while typing, so the engineer catches
// themselves. Deliberately advisory, not a block. Any regex is bypassable, and
// a save button that refuses to save would break a sub-minute daily habit.

const CHECKIN_NOTE_PATTERNS = [
  { re: /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i,                  why: 'a postcode' },
  { re: /\b(?:0\d{9,10}|\+44\s?\d{9,10})\b/,                        why: 'a phone number' },
  { re: /\b\d+[a-z]?\s+[A-Za-z]+\s+(?:road|rd|street|st|avenue|ave|lane|ln|close|drive|dr|way|court|crescent|terrace|grove|gardens)\b/i,
    why: 'an address' },
  { re: /\b\d{5,}\b/,                                               why: 'a job or account number' },
];

function checkinNoteWarning(text) {
  const t = (text || '').trim();
  if (!t) return null;
  for (let i = 0; i < CHECKIN_NOTE_PATTERNS.length; i++) {
    if (CHECKIN_NOTE_PATTERNS[i].re.test(t)) {
      return 'That looks like ' + CHECKIN_NOTE_PATTERNS[i].why +
        '. This is for how it felt, not what happened.';
    }
  }
  return null;
}

// ── Check-in display toggle (per-engineer, same shape as Coach mode) ────────
function isCheckinOn() {
  try {
    return localStorage.getItem('jcpd_checkin_on') !== 'false';
  } catch (e) {
    return true;
  }
}

// ── CommonJS export (browser is unaffected; this file is loaded as a plain ──
// ── <script> in the app, where `module` is undefined and the guard skips).  ─
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    JOB_TYPES: JOB_TYPES,
    minutesToCreditHours: minutesToCreditHours,
    calcVariableCredits: calcVariableCredits,
    localDateStr: localDateStr,
    getWeekKey: getWeekKey,
    getTodayKey: getTodayKey,
    weekDays: weekDays,
    weekLabel: weekLabel,
    shiftHours: shiftHours,
    dayIsLeave: dayIsLeave,
    weekLeaveHours: weekLeaveHours,
    getDailyTarget: getDailyTarget,
    weekMentorTargetReduction: weekMentorTargetReduction,
    cumulativeBalance: cumulativeBalance,
    loadState: loadState,
    defaultState: defaultState,
    saveState: saveState,
    getOrCreateWeek: getOrCreateWeek,
    getOrCreateDay: getOrCreateDay,
    weekTotalCreditMins: weekTotalCreditMins,
    weekCreditHours: weekCreditHours,
    rosteredHours: rosteredHours,
    adjustedTargetHours: adjustedTargetHours,
    rollingAvgInfo: rollingAvgInfo,
    effectiveTargetHours: effectiveTargetHours,
    bonusAchieved: bonusAchieved,
    formatHM: formatHM,
    formatCredits: formatCredits,
    findJob: findJob,
    PF_DAY_CAP: PF_DAY_CAP,
    estimatedDailyPFMins: estimatedDailyPFMins,
    dailyRawOutputHours: dailyRawOutputHours,
    weekPFMins: weekPFMins,
    paceProjection: paceProjection,
    getLogDayStrip: getLogDayStrip,
    getTopJobs: getTopJobs,
    TOP_JOBS_SEED: TOP_JOBS_SEED,
    getElectiveJobs: getElectiveJobs,
    getElectiveJobForGap: getElectiveJobForGap,
    getHistoricallyStrongDay: getHistoricallyStrongDay,
    isCoachModeOn: isCoachModeOn,
    getCoachInsights: getCoachInsights,
    weekSummary: weekSummary,
    VOICE_ALIASES: VOICE_ALIASES,
    VOICE_BROAD: VOICE_BROAD,
    normaliseVoiceText: normaliseVoiceText,
    extractDurationMins: extractDurationMins,
    extractVoiceDay: extractVoiceDay,
    findVoiceDayMarkers: findVoiceDayMarkers,
    splitVoiceDays: splitVoiceDays,
    parseVoiceBody: parseVoiceBody,
    parseVoiceLog: parseVoiceLog,
    voiceEntryCreditMins: voiceEntryCreditMins,
    voiceBatchCreditHours: voiceBatchCreditHours,
    CHECKIN_FACTORS: CHECKIN_FACTORS,
    CHECKIN_RATINGS: CHECKIN_RATINGS,
    CHECKIN_NOTE_MAX: CHECKIN_NOTE_MAX,
    CHECKIN_NOTE_PLACEHOLDER: CHECKIN_NOTE_PLACEHOLDER,
    CHECKIN_CUSTOM_TAG: CHECKIN_CUSTOM_TAG,
    CHECKIN_CUSTOM_ASK: CHECKIN_CUSTOM_ASK,
    CHECKIN_GOAL_MAX: CHECKIN_GOAL_MAX,
    GROW_STAGES: GROW_STAGES,
    GROW_QUESTIONS: GROW_QUESTIONS,
    growStageForDay: growStageForDay,
    growBankForDay: growBankForDay,
    growQuestionForDay: growQuestionForDay,
    findGrowStage: findGrowStage,
    findCheckinFactor: findCheckinFactor,
    getWeekGoal: getWeekGoal,
    setWeekGoal: setWeekGoal,
    goalText: goalText,
    goalAsk: goalAsk,
    goalRatingTag: goalRatingTag,
    getCheckin: getCheckin,
    getOrCreateCheckin: getOrCreateCheckin,
    checkinIsEmpty: checkinIsEmpty,
    checkinAnsweredCount: checkinAnsweredCount,
    checkinRatingScore: checkinRatingScore,
    weekCheckinAverage: weekCheckinAverage,
    checkinBand: checkinBand,
    checkinNoteWarning: checkinNoteWarning,
    isCheckinOn: isCheckinOn,
  };
}

function dayLabel(dayKey) {
  return new Date(dayKey + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}
