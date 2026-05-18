const JOB_TYPES = {
  core: [
    { id: 'ib_ff', name: 'Breakdown, First Fix (All Appliance Types)', minutes: 56, credits: 0.67, variable: false },
    { id: 'linked_ib', name: 'Linked Breakdown (Same appliance as Ann. Service Visit)', minutes: 56, credits: 0.67, variable: false },
    { id: 'asv_chb_cir_wh_swh', name: 'Annual Service Visit (CHB, CIR, WH, SWH)', minutes: 40, credits: 0.48, variable: false },
    { id: 'asv_fre', name: 'Annual Service Visit (FRE)', minutes: 47, credits: 0.56, variable: false },
    { id: 'fv_chb', name: 'First Visit (CHB)', minutes: 48, credits: 0.57, variable: false },
    { id: 'ld_completed', name: 'Long Duration (Completed)', minutes: 205, credits: 2.45, variable: false },
    { id: 'oca', name: 'OCA (All Appliance Types)', minutes: 56, credits: 0.67, variable: false },
    { id: 'remedial_safety', name: 'Remedial Safety (First Visit only)', minutes: 30, credits: 0.36, variable: false },
    { id: 'asv_bbf_wau_waw_aga', name: 'Annual Service Visit (BBF, WAU, WAW, AGA)', minutes: 63, credits: 0.75, variable: false },
    { id: 'fv_bbf_wau_waw', name: 'First Visit (BBF, WAU, WAW)', minutes: 71, credits: 0.85, variable: false },
    { id: 'as_inst', name: 'Annual Service - INST (Landlords Inspection)', minutes: 21, credits: 0.25, variable: false },
    { id: 'standalone_quote', name: 'Standalone Quote Job', minutes: 31, credits: 0.37, variable: false },
    { id: 'free_gas_safety', name: 'Free Gas Safety Check', minutes: 30, credits: 0.36, variable: false },
    { id: 'upgrade_work', name: 'Upgrade Work (per hour quoted)', minutes: 60, credits: 0.72, variable: true, variableType: 'hours', variablePrompt: 'Hours quoted' },
    { id: 'trace_repair', name: 'Trace & Repair', minutes: 1, credits: 0.01, variable: true, variableType: 'minutes', variablePrompt: 'Minutes on completion' },
    { id: 'install_cod', name: 'Install COD', minutes: 5, credits: 0.06, variable: false },
    { id: 'hive_install_generic', name: 'Hive Install', minutes: 90, credits: 1.08, variable: false },
    { id: 'asv_mwh_wal', name: 'Annual Service Visit (MWH, WAL)', minutes: 35, credits: 0.42, variable: false },
    { id: 'asv_hob_ckr_ovn', name: 'Annual Service Visit (HOB, CKR, OVN)', minutes: 23, credits: 0.28, variable: false }
  ],
  hive: [
    { id: 'hvi_hub', code: 'HVI-HUB', name: 'Hive Install – OpenTherm Upgrade', minutes: 40, credits: 0.48, variable: false },
    { id: 'hvi_iio', code: 'HVI-IIO', name: 'Hive Inday Install Offer', minutes: 34, credits: 0.41, variable: false },
    { id: 'hvi_min', code: 'HVI-MIN', name: 'Hive Install – Mini Thermostat', minutes: 90, credits: 1.08, variable: false },
    { id: 'hvi_imz', code: 'HVI-IMZ', name: 'Hive Install – Multizone', minutes: 30, credits: 0.36, variable: false },
    { id: 'hvi_trv', code: 'HVI-TRV', name: 'Hive Install – TRV', minutes: 30, credits: 0.36, variable: false },
    { id: 'hvi_wls', code: 'HVI-WLS', name: 'Hive Install – Wireless Thermostat', minutes: 90, credits: 1.08, variable: false },
    { id: 'hvi_wrd', code: 'HVI-WRD', name: 'Hive Install – Wired Thermostat', minutes: 60, credits: 0.72, variable: false },
    { id: 'hvr_the', code: 'HVR-THE', name: 'Hive Repair – Thermostat', minutes: 56, credits: 0.67, variable: false },
    { id: 'hvr_trv', code: 'HVR-TRV', name: 'Hive Repair – TRV', minutes: 56, credits: 0.67, variable: false },
    { id: 'hvu_the', code: 'HVU-THE', name: 'Hive Uninstall – Thermostat', minutes: 90, credits: 1.08, variable: false },
    { id: 'rchv_thr', code: 'RCHV-THR', name: 'Recall Hive Thermostat', minutes: 56, credits: 0.67, variable: false },
    { id: 'rchv_trv', code: 'RCHV-TRV', name: 'Recall Hive TRVs', minutes: 56, credits: 0.67, variable: false }
  ],
  sales: [
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
  };
}

function dayLabel(dayKey) {
  return new Date(dayKey + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
}
