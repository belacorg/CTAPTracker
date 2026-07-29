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
  return { baseHours: 40, weeks: {} };
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

// ── Recent jobs ────────────────────────────────────────────────────────────
function getRecentJobs(state, n) {
  const seen = new Set();
  const result = [];
  const entries = [];
  Object.values(state.weeks).forEach(function(week) {
    Object.values(week.days || {}).forEach(function(dayJobs) {
      dayJobs.forEach(function(j) { if (j.id && j.ts) entries.push(j); });
    });
  });
  entries.sort(function(a, b) { return b.ts - a.ts; });
  for (const entry of entries) {
    if (seen.has(entry.id)) continue;
    const job = findJob(entry.id);
    if (!job || job.isNpt) continue;
    seen.add(entry.id);
    result.push(job);
    if (result.length >= n) break;
  }
  return result;
}

// ── Best fixed-credit job across core/hive/sales ───────────────────────────
function getBestFixedJob() {
  const all = [].concat(JOB_TYPES.core, JOB_TYPES.hive, JOB_TYPES.sales);
  const fixed = all.filter(function(j) {
    return !j.variable && !j.isMentorFull && !j.isMentorPartial && !j.isNpt && j.minutes > 0;
  });
  return fixed.length
    ? fixed.reduce(function(best, j) { return j.minutes > best.minutes ? j : best; }, fixed[0])
    : null;
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
function parseVoiceLog(transcript, refDateStr) {
  const refDay = refDateStr || getTodayKey();
  const text = normaliseVoiceText(transcript);
  if (!text) return { dayKey: refDay, dayPhrase: null, items: [], unmatched: [] };

  const day = extractVoiceDay(text, refDay);
  const body = day.phrase
    ? text.replace(new RegExp('\\b' + escapeRe(day.phrase) + '\\b'), ' ').replace(/\s+/g, ' ').trim()
    : text;

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

  // Merge repeats of the same job ("two services ... and another service"),
  // but keep variable entries separate — each carries its own duration.
  const merged = [];
  items.forEach(function(it) {
    const prior = it.job.variable
      ? null
      : merged.find(function(m) { return m.jobId === it.jobId && !m.job.variable; });
    if (prior) { prior.qty += it.qty; prior.assumed = prior.assumed || it.assumed; }
    else merged.push(it);
  });

  return { dayKey: day.dayKey, dayPhrase: day.phrase, items: merged, unmatched: unmatched };
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
    getRecentJobs: getRecentJobs,
    getBestFixedJob: getBestFixedJob,
    getHistoricallyStrongDay: getHistoricallyStrongDay,
    isCoachModeOn: isCoachModeOn,
    getCoachInsights: getCoachInsights,
    weekSummary: weekSummary,
    VOICE_ALIASES: VOICE_ALIASES,
    VOICE_BROAD: VOICE_BROAD,
    normaliseVoiceText: normaliseVoiceText,
    extractDurationMins: extractDurationMins,
    extractVoiceDay: extractVoiceDay,
    parseVoiceLog: parseVoiceLog,
    voiceEntryCreditMins: voiceEntryCreditMins,
    voiceBatchCreditHours: voiceBatchCreditHours,
  };
}

function dayLabel(dayKey) {
  return new Date(dayKey + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}
